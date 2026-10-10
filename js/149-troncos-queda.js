'use strict';

/* ================= falling trunks: a standing column of blocks topples and becomes a lying platform =================
   Generic (docs/camadas/07-floresta-petrificada.md, section 14): the Cervo de Pedra (146) uses it for the giant
   trunks of his clearing; the Titã and the Arquiteto can use it the same way. The caller gives:
     x, y, w, h   the standing rect, in tiles (its blocks are what falls)
     side         -1 falls to the left, +1 to the right (it pivots on its foot corner on that side)
     cells        the lying blocks, precomputed (a sloped line, see trqLine), as [tx, ty] pairs or tile indices
     tile         the block the lying cells get (one id, or a function (tx, ty, k) -> id)
     ang          how far the sprite turns before it lands, radians from upright (default 1.2)
     warn         seconds of warning first: a pale crack climbs the trunk and a shadow grows on the ground under
                  where it will land (default 1)
     dur          seconds of the fall itself (default 0.6): the sprite turns, speeding up like a falling thing
     dmg, src     whoever the sweeping trunk passes over takes dmg (once) and is thrown along the fall
     onFall(f), onLand(f)   called when the standing blocks go and when the lying ones are stamped
   The standing blocks are erased and the lying ones stamped through setTile (the normal tile path), so light,
   chunks, map and diffs follow by themselves. Lying blocks marked in TRQ_RAMP can be walked up like a ramp: the
   hero steps up one block onto them (only onto them: everywhere else one-block ledges still need a jump).
   trqNow(f) cuts a warning short (the boss arrived early); trqClear() drops every fall in progress (a reset).
   Loads before 145, so the forest's blocks and the boss can use it. */

const TRQ_RAMP = new Uint8Array(NT);   // lying-trunk blocks the hero walks up (the user marks its own ids)
const trqFalls = [];
const trqI = (tx, ty) => ty * WW + wrapX(tx);
const trqEase = k => k * k * (0.35 + 0.65 * k);   // slow tip, fast end

// the standing rect as the chunks would show it: each block's own texture and ramp, lit edge on top, outline round
// the rect (one canvas per fall, built once when it starts to fall)
function trqSprite(x0, y0, w, h) {
  const W = w * T, H = h * T, cv = mk(W, H), cx = cv.getContext('2d'), im = cx.createImageData(W, H), buf = new Uint32Array(im.data.buffer);
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    const t = tiles[trqI(x0 + tx, y0 + ty)]; if (!SOLID[t] || !MAT[t]) continue;
    const P = MAT[t][0], MV = MAT[t][1].v, MX = MAT[t][1].x, X0 = wrapX(x0 + tx) * T, Y0 = (y0 + ty) * T;
    for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
      const gx = tx * T + px, gy = ty * T + py, k = ((Y0 + py) % TP) * TP + (X0 + px) % TP;
      let c;
      if (gx === 0 || gy === 0 || gx === W - 1 || gy === H - 1) c = P[0];
      else if (MX[k]) c = MX[k];
      else { let v = MV[k]; if (gy === 1) v += 1.7; else if (gy === 2) v += 0.7; if (gy === H - 2) v -= 1.2; if (gx === 1) v += 0.4; else if (gx === W - 2) v -= 0.5; c = shadeOf(P, v); }
      buf[gy * W + gx] = c;
    }
  }
  cx.putImageData(im, 0, 0);
  return cv;
}

// a sloped line of blocks from (ax, ay) to (bx, by) (tiles; a and b on the top surface), `thick` rows under it
function trqLine(ax, ay, bx, by, thick = 2) {
  const out = [], n = Math.max(Math.abs(bx - ax), 1), seen = new Set();
  for (let k = 0; k <= n; k++) {
    const x = Math.round(ax + (bx - ax) * k / n), y = Math.round(ay + (by - ay) * k / n);
    for (let r = 0; r < thick; r++) { const i = trqI(x, y + r); if (!seen.has(i)) { seen.add(i); out.push(i); } }
  }
  return out;
}

function trqFall(o) {
  const f = Object.assign({ warn: 1, dur: 0.6, ang: 1.2, dmg: 0, src: null, crackCol: '#d4f4ec', dust: ['#3e342a', '#6e5e4d', '#8c7a66'] }, o);
  f.cells = (f.cells || []).map(c => Array.isArray(c) ? trqI(c[0], c[1]) : c);
  f.st = 'warn'; f.t = 0; f.k = 0; f.hit = false; f.spr = null;
  f.px = (f.side > 0 ? f.x + f.w : f.x) * T; f.py = (f.y + f.h) * T;   // the pivot: the foot corner on the falling side
  // the shadow: the columns the lying trunk covers, each on the first solid surface under the lying blocks
  const cols = new Map();
  for (const i of f.cells) { const tx = i % WW, ty = (i / WW) | 0; if (!cols.has(tx) || cols.get(tx) < ty) cols.set(tx, ty); }
  f.shadow = [];
  f.under = {};   // per column: the top row of the lying blocks there (whoever is between it and the shadow is under it)
  for (const i of f.cells) { const tx = i % WW, ty = (i / WW) | 0; if (f.under[tx] === undefined || ty < f.under[tx]) f.under[tx] = ty; }
  for (const [tx, ty] of cols) { let y = ty + 1; while (y < ty + 14 && !solidAt(tx, y)) y++; f.shadow.push([tx, y]); }
  // the crack's path up the trunk (a wobble, fixed per fall)
  f.crack = []; { let cx = f.w * T / 2; for (let y = f.h * T - 1; y >= 0; y -= 2) { cx += (hash2(y, f.x, 1491) - 0.5) * 3; cx = clamp(cx, 3, f.w * T - 4); f.crack.push([Math.round(cx), y]); } }
  trqFalls.push(f);
  if (sfx.trqRacha) sfx.trqRacha();
  return f;
}
function trqNow(f) { if (f && f.st === 'warn') f.t = f.warn; }
function trqClear() { trqFalls.length = 0; }
const trqBusy = () => trqFalls.length > 0;

function trqStart(f) {
  f.st = 'fall'; f.t = 0;
  f.spr = trqSprite(f.x, f.y, f.w, f.h);
  for (let ty = f.y; ty < f.y + f.h; ty++) for (let tx = f.x; tx < f.x + f.w; tx++) if (tileAt(tx, ty) !== AIR) setTile(tx, ty, AIR);
  if (f.onFall) f.onFall(f);
  if (sfx.trqQueda) sfx.trqQueda();
  for (let k = 0; k < 10; k++) parts.push({ x: f.px + rnd(-f.w * T, f.w * T) * 0.5, y: f.py - rnd(0, 8), vx: rnd(-30, 30), vy: rnd(-60, -10), g: 300, life: 0.7, max: 0.7, col: f.dust[k % 3], size: 2 });
}
function trqLand(f) {
  f.st = 'done';
  let k = 0;
  for (const i of f.cells) {
    const tx = i % WW, ty = (i / WW) | 0; if (SOLID[tiles[i]]) continue;
    setTile(tx, ty, typeof f.tile === 'function' ? f.tile(tx, ty, k++) : f.tile);
  }
  // whoever ended up inside the lying trunk is lifted out on top of it
  if (!pl.dead && rectSolid(pl.x, pl.y, pl.w, pl.h)) { let n = 0; while (n++ < 40 && rectSolid(pl.x, pl.y, pl.w, pl.h)) pl.y -= 3; pl.vy = Math.min(pl.vy, 0); }
  for (const e of enemies) if (!e.dead && !ET[e.type].phase && !ET[e.type].fly && rectSolid(e.x, e.y, e.w, e.h)) { let n = 0; while (n++ < 40 && rectSolid(e.x, e.y, e.w, e.h)) e.y -= 3; }
  // the crash: dust and chips along the lying trunk
  for (const i of f.cells) if (Math.random() < 0.4) { const x = (i % WW + 0.5) * T, y = ((i / WW) | 0) * T; burst(x, y, 3, f.dust[(Math.random() * 3) | 0], 70, 300, 0.6); }
  shake(6);
  if (sfx.trqImpacto) sfx.trqImpacto();
  if (f.onLand) f.onLand(f);
}
// is the point (wx, wy) inside the turning trunk (with a margin)?
function trqInside(f, wx, wy, m) {
  const a = f.side * f.k * f.ang, ca = Math.cos(a), sa = Math.sin(a), dx = wx - f.px, dy = wy - f.py;
  const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca, W = f.w * T;
  return ly <= m && ly >= -f.h * T - m && (f.side > 0 ? lx <= m && lx >= -W - m : lx >= -m && lx <= W + m);
}

HOOK.update.push(dt => {
  if (!trqFalls.length || state !== 'play') return;
  for (let n = trqFalls.length - 1; n >= 0; n--) {
    const f = trqFalls[n]; f.t += dt;
    if (f.st === 'warn') {
      if (Math.random() < dt * 14) { const [cx, cy] = f.crack[Math.min(f.crack.length - 1, Math.floor(f.crack.length * Math.min(1, f.t / f.warn)))]; parts.push({ x: f.x * T + cx, y: f.y * T + cy, vx: rnd(-20, 20), vy: rnd(-10, 20), g: 300, life: 0.5, max: 0.5, col: f.dust[1 + (Math.random() * 2 | 0)], size: 1 }); }
      if (f.t >= f.warn) trqStart(f);
    } else if (f.st === 'fall') {
      f.k = trqEase(Math.min(1, f.t / f.dur));
      // the sweep: whoever it passes over (once), thrown along the fall
      if (!f.hit && f.dmg > 0 && f.k > 0.12 && !pl.dead) {
        const cx = pl.x + pl.w / 2;
        if (trqInside(f, cx, pl.y + 3, 3) || trqInside(f, cx, pl.y + pl.h / 2, 3) || trqInside(f, cx, pl.y + pl.h - 2, 3)) {
          f.hit = true; const r = hurtPlayer(f.dmg, f.px - f.side * 20, f.src, true);
          if (r === 'hit') { pl.vx = f.side * 260; pl.vy = -220; }
        }
      }
      // the crash: whoever stands in the shadow, under where it lies, is hit as it comes down
      if (!f.hit && f.dmg > 0 && f.k > 0.8 && !pl.dead) {
        const tx = Math.floor((pl.x + pl.w / 2) / T), S = f.shadow.find(q => wrapX(q[0]) === wrapX(tx));
        if (S && pl.y + pl.h <= S[1] * T + 2 && pl.y + pl.h >= f.under[wrapX(tx)] * T - 2) {
          f.hit = true; const r = hurtPlayer(f.dmg, f.px - f.side * 20, f.src, true);
          if (r === 'hit') { pl.vx = f.side * 200; pl.vy = -160; }
        }
      }
      if (f.t >= f.dur) { f.k = 1; trqLand(f); }
    }
    if (f.st === 'done') trqFalls.splice(n, 1);
  }
});
// the sprite turning, and the crack climbing while it warns
const trqLap = (x, cx) => { const W = WW * T, d = x - (cx + VW / 2); return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
HOOK.drawWorld.push((cx, cy) => {
  for (const f of trqFalls) {
    if (f.st === 'fall' && f.spr) {
      const px = trqLap(f.px, cx) - cx, py = f.py - cy;
      lc.save(); lc.translate(px, py); lc.rotate(f.side * f.k * f.ang);
      lc.drawImage(f.spr, f.side > 0 ? -f.w * T : 0, -f.h * T);
      lc.restore();
    } else if (f.st === 'warn') {
      const X = trqLap(f.x * T, cx) - cx, Y = f.y * T - cy, n = Math.floor(f.crack.length * Math.min(1, f.t / f.warn));
      for (let j = 0; j < n; j++) {
        const [x, y] = f.crack[j]; lc.fillStyle = '#100c0a'; lc.fillRect(X + x - 1, Y + y, 1, 2);
        lc.fillStyle = f.crackCol; lc.fillRect(X + x, Y + y, 1, 2);
        if (j % 7 === 3) { const b = (hash2(j, f.x, 1492) < 0.5 ? -1 : 1); lc.fillRect(X + x + b, Y + y - 1, 1, 1); lc.fillRect(X + x + b * 2, Y + y - 2, 1, 1); }
      }
    }
  }
});
// the shadow on the ground, over the dark: it is the warning
HOOK.drawTop.push((cx, cy) => {
  for (const f of trqFalls) {
    if (f.st === 'done') continue;
    const k = f.st === 'warn' ? Math.min(1, f.t / Math.max(0.01, f.warn)) : 1, blink = (Math.floor(gameTime * 10) & 1) ? 1 : 0.7;
    for (const [tx, ty] of f.shadow) {
      const x = trqLap(tx * T, cx) - cx, y = ty * T - cy;
      lc.globalAlpha = (0.2 + 0.4 * k) * blink; lc.fillStyle = '#05070a'; lc.fillRect(x, y - 3, T, 3);
      lc.globalAlpha = 0.25 + 0.35 * k; lc.fillStyle = f.crackCol; lc.fillRect(x + ((tx * 5) % 7), y - 4, 2, 1);
    }
  }
  lc.globalAlpha = 1;
});

// walking up a lying trunk: one block up, like a ramp (moveEntity's own step, enabled only there)
function trqRampAhead() {
  const d = Math.sign(pl.vx); if (!d) return false;
  const tx = Math.floor((d > 0 ? pl.x + pl.w + 0.5 : pl.x - 0.5) / T), ty = Math.floor((pl.y + pl.h - 0.5) / T);
  return TRQ_RAMP[tileAt(tx, ty)] === 1 && !solidAt(tx, ty - 1) && !solidAt(tx, ty - 2);
}
// in the air against the end of a lying trunk, the feet less than a block under its top: up onto it (its end is
// three blocks high, a little more than a jump clears cleanly)
function trqLedge() {
  const d = Math.sign(pl.vx); if (!d) return;
  const tx = Math.floor((d > 0 ? pl.x + pl.w + 0.5 : pl.x - 0.5) / T), feet = pl.y + pl.h, ty = Math.floor((feet - 0.5) / T);
  if (TRQ_RAMP[tileAt(tx, ty)] !== 1 || solidAt(tx, ty - 1) || solidAt(tx, ty - 2)) return;
  const top = ty * T; if (feet - top > T) return;
  if (!rectSolid(pl.x, top - pl.h - 0.01, pl.w, pl.h)) { pl.y = top - pl.h - 0.01; if (pl.vy > 0) pl.vy = 0; }
}
{ const _mv = moveEntity; moveEntity = function (e, dt, step) {
  if (e === pl && !step) { if (pl.onGround) { if (trqRampAhead()) step = true; } else if (!pl.climb) trqLedge(); }
  return _mv(e, dt, step);
}; }

Object.assign(sfx, {
  trqRacha() { for (let k = 0; k < 7; k++) noise(0.05, 0.035, 2600 + Math.random() * 1400, 'bandpass', k * 0.12 + Math.random() * 0.05, 4); tone(60, 0.9, 'sawtooth', 0.018, -10); },
  trqQueda() { noise(0.6, 0.06, 300, 'lowpass'); noise(0.5, 0.035, 900, 'bandpass', 0.05, 1.2); tone(48, 0.6, 'sine', 0.035, 10); },
  trqImpacto() { noise(0.9, 0.16, 260, 'lowpass'); tone(40, 0.8, 'sine', 0.07, -12); noise(0.3, 0.07, 1500, 'bandpass', 0.04); for (let k = 0; k < 5; k++) noise(0.05, 0.04, 3200, 'highpass', 0.1 + k * 0.07); }
});
