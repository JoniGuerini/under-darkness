'use strict';

/* ================= o Abismo: props =================
   Everything bigger than a block that dresses the abyss. In the Portões de Cinza: broken gates of black iron
   between hell-brick pillars, crouching demon statues, pillars mortared with skulls, great braziers, torn
   banners, heaps of chains with a ball and manacles, spiked iron barricades, a torture wheel. In the Rios de Fogo:
   iron cauldrons boiling over a fire, a basalt basin brimming with lava, shards of obsidian, a broken bridge and a
   small lavafall on the back wall. In the Entranhas: giant ribs, a giant horned skull, flesh cocoons and demon
   eggs, butcher's hooks with meat, a pyre of bones, and in the walls a heart that beats, an eye that blinks and a
   mouth full of teeth. In the Trono do Caos: sacrifice altars, a pentagram burning on the floor, an obelisk of
   runes, great chaos crystals, a profane book on its lectern, giant spikes, a horned skull with candles.
   Cages hang everywhere. The boss's throne is 109's. Same 7-tone ramps lit from the top left and dark rim as
   81-mina-objetos; registered with defProp (`abismo: true`), placed by abPlaceProps (called by 108) from
   AB_PROP_PLAN. The lavafall, the heart and the eye move (`anim`, drawn by the hooks at the end). */
const AB_PROP_PLAN = {};
// back-wall pieces that stand on the floor instead of hanging at eye height
const AB_BACK_FLOOR = { ab_portao: 1, ab_cachoeira: 1 };
{
const { cg, cn } = MNART;
const R7 = hexes => hexes.map(h => ph(h));
const RP = {
  cinza: R7(['#121010', '#1e1a19', '#2c2725', '#3c3532', '#4e4642', '#625854', '#7a6e68']),
  basalto: R7(['#07080c', '#0e1016', '#171a22', '#21252f', '#2c313d', '#3a404e', '#4e5566']),
  obsidiana: R7(['#050308', '#0c0712', '#150d1e', '#20132c', '#2e1b3e', '#47295c', '#7a4e98']),
  ferroN: R7(['#060607', '#0f0f12', '#1a1a1f', '#26272d', '#35363e', '#4a4c55', '#6c6e78']),
  ferrugem: R7(['#1a0a06', '#2e1208', '#4a1c0c', '#662812', '#82361a', '#9e4824', '#b85e32']),
  tijolo: R7(['#0e0505', '#1c0908', '#2e0f0c', '#441611', '#5c1f17', '#76291e', '#923627']),
  carne: R7(['#1a0507', '#30090c', '#4a0f13', '#66161a', '#842022', '#a2302c', '#c04a3c']),
  rosa: R7(['#2e0c12', '#4e1620', '#70222e', '#92343e', '#b24c50', '#cc6a66', '#e49488']),
  veia: R7(['#12060e', '#220a1a', '#341028', '#4a1838', '#62224a', '#7c305e', '#984478']),
  osso: R7(['#221c16', '#3c342a', '#5c5242', '#7e725e', '#a0947c', '#c2b69c', '#e2d8be']),
  chifre: R7(['#0c0806', '#18100c', '#261a14', '#36261c', '#483426', '#5e4632', '#7a5e44']),
  enxofre: R7(['#1e1a04', '#383008', '#5a4c0e', '#807018', '#a8962a', '#ccbc48', '#ece07c']),
  caos: R7(['#0c0610', '#170b1c', '#24112a', '#33183a', '#44204c', '#582a5e', '#723a78']),
  runa: R7(['#2a0a3a', '#4a1066', '#7018a0', '#9a2ad0', '#c050f0', '#e090ff', '#f8d8ff']),
  cristal: R7(['#300614', '#580a26', '#8a1040', '#c01c5a', '#ec3a7a', '#ff7aa8', '#ffd0e0']),
  fogo: R7(['#3a0c02', '#6e1c04', '#a83a08', '#e06414', '#ff9a2a', '#ffd070', '#fff4c8']),
  lava: R7(['#2a0602', '#5a1204', '#962406', '#d2440a', '#f87818', '#ffb040', '#fff0a0']),
  sangue: R7(['#120202', '#240404', '#3a0706', '#540b09', '#700f0c', '#8c1610', '#a82018']),
  cera: R7(['#2a2418', '#4a4230', '#6e644a', '#968a68', '#bcb08a', '#dcd2ac', '#f6eed2']),
  pano: R7(['#160406', '#2a080c', '#420e14', '#5c141c', '#781c24', '#94282e', '#ae383a']),
  latao: R7(['#22160a', '#3c2810', '#5a3e18', '#7a5722', '#9c722e', '#bc8e40', '#d8ae5e']),
  madeira: R7(['#0c0806', '#16100c', '#221812', '#30221a', '#3e2c22', '#4e382c', '#604638']),
  couro: R7(['#140a0a', '#241212', '#381c1a', '#4c2724', '#62332e', '#7a423a', '#94544a']),
  ovo: R7(['#140810', '#24101c', '#381a2a', '#4e263a', '#66344a', '#80465c', '#9c5c70']),
  olho: R7(['#2a2008', '#4a3a0e', '#7a6414', '#b0941c', '#e0c430', '#f8e478', '#fffad0']),
  papel: R7(['#241c12', '#3e3222', '#5a4c36', '#7a6a4e', '#9a8a68', '#b8a884', '#d4c6a2']),
  carvao: R7(['#060505', '#0c0a0a', '#141010', '#1c1716', '#26201e', '#322a27', '#423834']),
  sombra: R7(['#030102', '#060304', '#0a0506', '#0e0708', '#130a0b', '#180d0e', '#1e1112'])
};
const OUTLINE = ph('#060303');

/* ---- the painter (same as 81's) ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[y * w + x] = idOf(R); },
    clear(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    box(x0, y0, rw, rh, R, s, base = 3.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.6 : j === 1 ? 0.6 : 0) + (i === 0 ? 0.7 : 0) - (j === rh - 1 ? 1.6 : 0) - (i === rw - 1 ? 1.1 : 0) + cg(x, y, s) * 0.55 + cn(x, y, 60, 60, s + 1) * 0.5); },
    blob(cx, cy, rx, ry, R, s, base = 3.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1.2 - (dx + dy) * 1.3 - d * 0.6 + cg(x, y, s) * 0.45); } },
    line(x0, y0, x1, y1, R, v, wd = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < wd; k++) P.put(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), R, typeof v === 'function' ? v(i / n, k) : v); } },
    done(rim = true) {
      if (rim) {
        const src = c.slice(), sr = rid.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const k = y * w + x; if (src[k]) continue;
          let n = -1; if (x > 0 && src[k - 1]) n = k - 1; else if (x < w - 1 && src[k + 1]) n = k + 1; else if (y > 0 && src[k - w]) n = k - w; else if (y < h - 1 && src[k + w]) n = k + w;
          if (n < 0) continue; const r = sr[n]; c[k] = r >= 0 ? ramps[r][0] : OUTLINE;
        }
      }
      const cv = mk(w, h), x = cv.getContext('2d'), img = x.createImageData(w, h); new Uint32Array(img.data.buffer).set(c); x.putImageData(img, 0, 0); return cv;
    }
  };
  return P;
}
// a thick curve: fn(t) -> [x, y], wd(t) its width; round in section, lit from the top left
function tube(P, fn, wd, R, s, base = 3.6, n = 0) {
  const [ax, ay] = fn(0), [bx, by] = fn(1); n = n || Math.ceil(Math.hypot(bx - ax, by - ay) * 3) + 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = fn(t), r = Math.max(0.5, wd(t) / 2);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      const dx = (xx + 0.5 - x) / r, dy = (yy + 0.5 - y) / r, d = dx * dx + dy * dy; if (d > 1) continue;
      P.put(xx, yy, R, base + 0.9 - (dx + dy) * 1.1 - d * 0.5 + cg(xx, yy, s) * 0.5);
    }
  }
}
// a shard (crystal, spike, obsidian): from its root (bx, by) along ang for len, wd half-width, two faces and a ridge
function shard(P, bx, by, ang, len, wd, R, s, point = 0.35, base = 3.4) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = len + wd + 2;
  for (let y = Math.floor(by - m); y <= by + m; y++) for (let x = Math.floor(bx - m); x <= bx + m; x++) {
    const dx = x + 0.5 - bx, dy = y + 0.5 - by, u = dx * ca + dy * sa, v = -dx * sa + dy * ca; if (u < 0 || u > len) continue;
    const t = u / len, hw = wd * (t < 1 - point ? 1 : (1 - t) / point); if (Math.abs(v) > hw + 0.15) continue;
    const lit = (-sa < 0 ? v > 0 : v < 0) ? 1 : -1;   // the face toward the top left catches the light
    let val = base + lit * 0.9 + t * 0.9 + cg(x, y, s) * 0.5 - Math.abs(v) / Math.max(0.6, hw) * 0.5;
    if (Math.abs(v + lit * hw * 0.45) < 0.45 && t < 0.92) val += 1.4;   // a glint along the lit face
    if (Math.abs(v) < 0.5 && hw > 1.2) val -= 0.6;                      // the ridge
    P.put(x, y, R, val);
  }
}
// a painted tongue of fire standing on base, h tall, w half-width at its foot
function flame(P, cx, base, h, w, s, R = RP.fogo) {
  for (let y = Math.floor(base - h); y <= base; y++) {
    const t = (base - y) / h; if (t < 0 || t > 1) continue;
    const hw = w * Math.pow(1 - t, 0.7) * (0.8 + 0.35 * Math.sin(y * 1.3 + s)), off = Math.sin(t * 5 + s) * t * 1.6;
    for (let x = Math.floor(cx - w - 2); x <= cx + w + 2; x++) { const d = Math.abs(x + 0.5 - cx - off) / Math.max(0.6, hw); if (d > 1) continue; P.put(x, y, R, 6.3 - d * 2.6 - t * 2.4 + cg(x, y, s) * 0.8); }
  }
}
// hell brick: courses of 3, offset, worn and chipped (keep(x, y) false leaves a hole)
function bricks(P, x0, y0, w, h, s, keep, R = RP.tijolo) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (keep && !keep(x, y)) continue;
    const row = Math.floor(y / 3), off = row % 2 ? 3 : 0, mortar = y % 3 === 2 || (x + off) % 6 === 5;
    P.put(x, y, R, mortar ? 1.2 + cg(x, y, s) * 0.6 : 3.3 + hash2(Math.floor((x + off) / 6), row, s) * 1.3 - (x - x0) / w * 1.2 + (y % 3 === 0 ? 0.7 : 0) + cg(x, y, s) * 0.55 - Math.max(0, cn(x, y, 30, 40, s)) * 2.5);
  }
}
// a hanging chain of black iron: links face on, then edge on
function chainV(P, x, y0, y1, R = RP.ferroN, base = 4) {
  for (let y = y0; y < y1; y++) { const k = (y - y0) % 5; if (k < 3) { P.put(x, y, R, base + (k === 1 ? -1.6 : 0.6)); P.put(x + 1, y, R, base - 1 + (k === 1 ? -1.6 : 0)); } else P.put(x + (k === 3 ? 0 : 1), y, R, base + 0.4); }
}
// a small skull: dome, two sockets, a nose, a row of teeth
function skull(P, cx, cy, s, R = RP.osso, base = 4.2) {
  P.blob(cx, cy, 2.7, 2.4, R, s, base); P.rect(cx - 1.5, cy + 2, 3, 1, R, (i) => i === 1 ? base - 1.6 : base - 0.2);
  P.put(cx - 1, cy, RP.sombra, 0.5); P.put(cx + 1, cy, RP.sombra, 0.5); P.put(cx, cy + 1, RP.sombra, 2);
}
// a candle: a stub of tallow, drips down its side; returns the pixel above the wick for the animated flame
const WK = [];   // the wicks of the candles painted since the last WK.length = 0 (for `chamas`)
function candle(P, x, base, h, s) {
  WK.push({ x, y: base - h });
  for (let y = base - h + 1; y <= base; y++) { P.put(x, y, RP.cera, 4.8 - (y - base + h) * 0.08 + cg(x, y, s) * 0.4); P.put(x + 1, y, RP.cera, 3.2 + cg(x + 1, y, s) * 0.4); }
  P.put(x, base - h, RP.carvao, 2); if (hash2(x, base, s) < 0.6) P.put(x + 2, base - (h >> 1), RP.cera, 4);
  P.put(x - 1, base, RP.cera, 4.4); P.put(x + 2, base, RP.cera, 3);
  return { x: x, y: base - h };
}
// a rune: one of a handful of 3 x 4 glyphs
const GLYPHS = [[[1, 0], [1, 1], [1, 2], [1, 3], [0, 1], [2, 2]], [[0, 0], [2, 0], [1, 1], [1, 2], [0, 3], [2, 3]], [[0, 0], [0, 1], [0, 2], [0, 3], [1, 1], [2, 0], [2, 2]], [[0, 3], [1, 2], [2, 1], [1, 0], [0, 1]], [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [1, 3], [2, 3]], [[0, 1], [1, 0], [2, 1], [1, 2], [1, 3]], [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [2, 3]]];
const glyph = (P, x, y, k, R = RP.runa, v = 4.6) => { for (const [i, j] of GLYPHS[k % GLYPHS.length]) P.put(x + i, y + j, R, v - j * 0.25); };

/* =============================== PORTÕES DE CINZA =============================== */
function hellGate(broken) {   // 46 x 46: a gate of black iron bars between two hell-brick pillars under an arched lintel
  const P = painter(46, 46), s = broken ? 10502 : 10501;
  const yb = x => Math.round(8 + 6 * Math.pow((x + 0.5 - 23) / 14, 2));   // the arch's underside
  // the dark beyond the gate, warmed by a far fire low down
  for (let x = 9; x < 37; x++) for (let y = yb(x) + 1; y < 44; y++) P.put(x, y, y > 34 ? RP.tijolo : RP.sombra, y > 34 ? 0.4 + (y - 34) * 0.14 + cg(x, y, s) * 0.5 : 2.6 + cg(x, y, s) * 0.8);
  // the pillars, the lintel (broken through the middle on the ruined one)
  const ragged = (x, y) => !broken || y > 3 + Math.round((cn(x, 0, 6, 6, s) + 0.5) * 9);
  bricks(P, 0, 4, 9, 40, s, ragged); bricks(P, 37, 4, 9, 40, s + 1, broken ? (x, y) => y > 1 + Math.round((cn(x, 0, 5, 5, s + 3) + 0.5) * 5) : null);
  for (let x = 9; x < 37; x++) { if (broken && x > 16 && x < 31) continue; for (let y = 2; y <= yb(x); y++) P.put(x, y, RP.tijolo, (y === yb(x) ? 1.6 : 3.4) + (Math.abs(x - 23) < 2 ? 1 : 0) + hash2(Math.floor(x / 3), Math.floor(y / 3), s) * 1.2 - (y - 2) * 0.1 + cg(x, y, s) * 0.5); }
  for (let y = 2; y < 9; y++) if (!broken) { P.put(22, y, RP.cinza, 5 - (y - 2) * 0.3); P.put(23, y, RP.cinza, 4.4 - (y - 2) * 0.3); P.put(24, y, RP.cinza, 3 - (y - 2) * 0.3); }   // the keystone
  if (!broken) {
    P.rect(0, 2, 46, 2, RP.cinza, (i, j) => 4.6 - j * 1.4 - i * 0.03 + cg(i, j, s) * 0.6);   // the cornice
    for (const px of [4, 41]) { skull(P, px + 0.5, -0.5 + 2, s + px); }
  }
  // worn runes in the pillars
  for (let k = 0; k < 4; k++) glyph(P, k < 2 ? 3 : 40, 16 + (k % 2) * 12, k + (broken ? 3 : 0), RP.runa, 1.4);
  // the bars: left leaf shut, right leaf shut (intact) or hanging off one hinge (broken)
  const bar = (x0, y0, x1, y1) => { P.line(x0, y0, x1, y1, RP.ferroN, (t) => 4.2 - t * 1.4, 1); P.line(x0 + 1, y0, x1 + 1, y1, RP.ferroN, 2.2, 1); };
  for (let x = 10; x < 23; x += 3) { bar(x, yb(x) + 1, x, 43); P.put(x, yb(x) + 1, RP.ferroN, 5.6); }
  for (const cy of [20, 34]) P.line(10, cy, 22, cy, RP.ferroN, (t) => 4.6 - t, 1);
  if (!broken) {
    for (let x = 24; x < 36; x += 3) { bar(x, yb(x) + 1, x, 43); P.put(x, yb(x) + 1, RP.ferroN, 5.6); }
    for (const cy of [20, 34]) P.line(24, cy, 36, cy, RP.ferroN, (t) => 4.2 - t, 1);
    P.blob(23, 27, 2, 2.4, RP.ferroN, s, 4); P.put(23, 27, RP.sombra, 1);   // the lock ring
  } else {
    for (let k = 0; k < 4; k++) { const x = 26 + k * 3; bar(x + 10 - k * 1.5, 18 + k * 4, x - 2, 43 - k * 0.5); }   // the leaf swung down and wedged
    P.line(35, 21, 25, 36, RP.ferroN, 4.2, 1); P.line(36, 32, 27, 42, RP.ferroN, 3.4, 1);
    for (let k = 0; k < 16; k++) { const x = 13 + hash2(k, 0, s) * 22, y = 44 - hash2(k, 1, s) * 3; P.blob(x, y, 1.5 + hash2(k, 2, s), 1.2, k % 3 ? RP.tijolo : RP.cinza, s + k, 3.4); }   // the fallen lintel
  }
  P.rect(0, 44, 46, 2, RP.cinza, (i, j) => 4 - j * 1.6 + cg(i, j, s) * 0.6);   // the threshold
  return P.done();
}
function demonStatue(broken) {   // 26 x 46: a crouching winged demon in ash stone on a pedestal, eyes still smouldering
  const P = painter(26, 46), s = broken ? 10522 : 10521, R = RP.cinza;
  // wings, folded half open behind it
  for (const side of [-1, 1]) {
    if (broken && side > 0) continue;
    const sx = 13 + side * 4;
    for (let y = 6; y < 33; y++) { const t = (y - 6) / 27, reach = 10 * Math.sin(Math.min(1, t * 1.4) * Math.PI * 0.55) * (1 - t * 0.35); for (let k = 0; k <= reach; k++) { const x = sx + side * k; if (y > 30 - k * 0.6) continue; P.put(x, y, R, 2.2 + (side < 0 ? 0.6 : -0.4) - k * 0.04 + cg(x, y, s) * 0.6 + (Math.abs((k + y * 0.3) % 4 - 2) < 0.6 ? 1 : 0)); } }
    P.line(sx, 9, sx + side * 10, 3, R, side < 0 ? 5 : 3.6, 1); for (let f = 0; f < 3; f++) P.line(sx + side * (3 + f * 3), 6 - f, sx + side * (3 + f * 2.5), 26 - f * 3, R, side < 0 ? 4 : 3, 1);   // the wing bones
  }
  // haunches, torso, arms resting on the knees
  P.blob(8.5, 33, 4, 4.4, R, s, 3.4); P.blob(17.5, 33, 4, 4.4, R, s + 1, 3);
  P.blob(13, 24, 5.5, 8, R, s + 2, 3.8);
  for (let k = 0; k < 3; k++) P.line(10, 22 + k * 2.4, 16, 22 + k * 2.4, R, 2.6, 1);   // ribs under the hide
  tube(P, t => [8 - t * 1, 19 + t * 12], () => 2.6, R, s, 3.6); tube(P, t => [18 + t * 1, 19 + t * 12], () => 2.6, R, s, 3);
  for (const cx of [6, 18]) for (let k = 0; k < 3; k++) P.line(cx + k, 31, cx + k - 0.5, 33, R, 5, 1);   // claws over the knees
  // the head, the horns (one snapped off on the broken one), the eyes
  P.blob(13, 13, 3.8, 3.6, R, s + 3, 4); P.rect(11, 16, 5, 1, R, (i) => i % 2 ? 2 : 4.6);
  tube(P, t => [10.5 - t * 5, 11 - t * 7 + t * t * 3], t => 2.4 - t * 1.6, RP.chifre, s, 4.2);
  if (!broken) tube(P, t => [15.5 + t * 5, 11 - t * 7 + t * t * 3], t => 2.4 - t * 1.6, RP.chifre, s, 3.4);
  else { P.blob(16.5, 10, 1.2, 1, RP.chifre, s, 3); for (let k = 0; k < 8; k++) P.put(14 + k * 0.4, 18 + k * 2.2, R, 1); }   // a stump and a crack down the chest
  P.put(11, 13, RP.lava, 5.4); P.put(15, 13, RP.lava, 4.6); P.put(12, 13, RP.lava, 3.4);
  // the pedestal: a moulding, carved face, chipped corners
  P.box(1, 37, 24, 9, RP.basalto, s, 3.4); P.rect(0, 36, 26, 2, RP.basalto, (i, j) => 5 - j * 1.4 - i * 0.04);
  for (let k = 0; k < 4; k++) glyph(P, 4 + k * 5, 40, k * 2 + (broken ? 1 : 0), RP.runa, 1.6);
  if (broken) { P.clear(25, 36); P.clear(25, 37); P.clear(24, 36); for (let k = 0; k < 4; k++) P.blob(22 + k * 1.2, 45, 1, 0.9, R, s + k, 3.6); }
  return P.done();
}
function skullPillar() {   // 18 x 46: a pillar built of skulls set in black mortar, a stone cap, a spike on top
  const P = painter(18, 46), s = 10541;
  P.box(1, 40, 16, 6, RP.cinza, s, 3.4); P.rect(0, 39, 18, 2, RP.cinza, (i, j) => 4.8 - j * 1.4 - i * 0.05);
  for (let y = 9; y < 39; y++) for (let x = 3; x < 15; x++) P.put(x, y, RP.carvao, 2.4 - (x - 3) * 0.08 + cg(x, y, s) * 0.8);   // the mortar
  for (let row = 0; row < 5; row++) for (let k = 0; k < 2 + (row % 2 ? 0 : 0); k++) { const cx = (row % 2 ? 6 : 5) + k * 6 + 0.5, cy = 12 + row * 6; skull(P, cx, cy, s + row * 7 + k, RP.osso, 4.2 - k * 0.6 - row * 0.08); }
  for (let row = 0; row < 5; row++) { P.line(3, 15 + row * 6, 14, 15 + row * 6, RP.osso, 2.6, 1); }   // bones laid between the courses
  P.box(1, 6, 16, 3, RP.cinza, s + 1, 3.8); P.rect(2, 5, 14, 1, RP.cinza, (i) => 5 - i * 0.12);
  shard(P, 9, 6, -Math.PI / 2, 6, 2, RP.ferroN, s, 0.8, 3.6);
  return P.done();
}
function bigBrazier(tall) {   // 20 x 36 or 24 x 22: an iron bowl of coals on legs, burning high
  const P = painter(tall ? 20 : 22, tall ? 36 : 22), s = tall ? 10561 : 10562, cx = tall ? 10 : 11, by = tall ? 16 : 10;
  if (tall) { P.line(10, 20, 10, 33, RP.ferroN, 4.2, 2); P.line(10, 32, 3, 35, RP.ferroN, 3.8, 1); P.line(11, 32, 17, 35, RP.ferroN, 3, 1); P.line(10, 32, 10, 35, RP.ferroN, 4, 1); P.rect(7, 25, 7, 1, RP.ferroN, (i) => 4.6 - i * 0.3); }
  else for (const lx of [4, 18]) { P.line(lx, 16, lx + (lx < 12 ? -2 : 2), 21, RP.ferroN, 3.8, 2); P.put(lx + (lx < 12 ? -3 : 3), 21, RP.ferroN, 4.4); }
  // the bowl: flared rim with spikes, banded
  const hw0 = tall ? 8 : 9;
  for (let y = by; y < by + (tall ? 5 : 6); y++) { const t = (y - by) / (tall ? 5 : 6), hw = hw0 - t * t * (hw0 * 0.45); for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) P.put(x, y, RP.ferroN, 4.4 - (x - cx + hw) / (hw * 2) * 2.6 + (y === by + 2 ? 1 : 0) + cg(x, y, s) * 0.5); }
  P.rect(cx - hw0 - 1, by - 1, hw0 * 2 + 3, 1, RP.ferroN, (i) => 5.2 - i * 0.12);
  for (const k of [-hw0 - 1, -hw0 / 2, hw0 / 2, hw0 + 1]) { P.put(cx + k, by - 2, RP.ferroN, 5); P.put(cx + k, by - 3, RP.ferroN, 4.2); }
  if (!tall) { skull(P, cx + 0.5, by + 3, s, RP.osso, 3.8); }
  // coals and fire
  for (let x = cx - hw0 + 1; x < cx + hw0; x++) { P.put(x, by - 1, hash2(x, 0, s) < 0.5 ? RP.lava : RP.carvao, hash2(x, 0, s) < 0.5 ? 4 + hash2(x, 1, s) * 2 : 2.4); }
  flame(P, cx - 2.5, by - 2, tall ? 9 : 8, 2.6, s); flame(P, cx + 2.5, by - 2, tall ? 8 : 7, 2.4, s + 3); flame(P, cx, by - 1, tall ? 13 : 11, 3.4, s + 5);
  return P.done();
}
function tornBanner(k) {   // 18 x 40: a rag of dark red on a spiked rod, hung by two chains: a horned skull or an eye daubed in old gold
  const P = painter(18, 40), s = 10581 + k;
  chainV(P, 2, 0, 5); chainV(P, 14, 0, 5);
  P.rect(0, 5, 18, 2, RP.ferroN, (i, j) => 4.8 - j * 1.6 - i * 0.06); P.put(0, 4, RP.ferroN, 5); P.put(17, 4, RP.ferroN, 3.6);
  for (let y = 7; y < 39; y++) for (let x = 2; x < 16; x++) {
    const tear = k ? (y > 30 - Math.abs(x - 9) * 1.4 + hash2(x, 0, s) * 3) : (y > 33 + Math.sin(x * 1.7) * 3 || (y > 26 && x > 10 && x < 14 && hash2(x, y, s) < 0.7));
    if (tear || (y > 15 && cn(x, y, 6, 6, s) > 0.38)) continue;   // the tears and burnt holes
    const burn = Math.max(0, (y - 24) / 14) * (0.6 + hash2(x, y, s) * 0.8);
    P.put(x + Math.sin(y * 0.28 + k) * 0.6, y, RP.pano, 3.8 - (x - 2) * 0.12 + Math.sin(x * 0.9 + y * 0.2) * 0.45 + cg(x, y, s) * 0.5 - burn * 2.2);
  }
  for (let y = 7; y < 30; y++) { P.put(2, y, RP.pano, 5); }
  if (k === 0) {   // a horned skull
    P.blob(9, 16, 2.8, 2.6, RP.latao, s, 4.2); P.put(8, 16, RP.pano, 1); P.put(10, 16, RP.pano, 1); P.rect(8, 19, 3, 1, RP.latao, (i) => i === 1 ? 2.4 : 4);
    P.line(6.5, 14.5, 4, 11, RP.latao, 4.6, 1); P.line(4, 11, 4, 9, RP.latao, 5, 1); P.line(11.5, 14.5, 14, 11, RP.latao, 3.8, 1); P.line(14, 11, 14, 9, RP.latao, 4.2, 1);
  } else {     // the eye in a ring of points
    for (let a = 0; a < 6.28; a += 0.25) P.put(9 + Math.cos(a) * 5, 15 + Math.sin(a) * 5, RP.latao, 3.6 + Math.sin(-a) * 0.8);
    for (let a = 0; a < 6.28; a += 1.05) P.put(9 + Math.cos(a) * 6.5, 15 + Math.sin(a) * 6.5, RP.latao, 4.8);
    P.rect(6, 15, 7, 1, RP.latao, () => 4.6); P.rect(7, 14, 5, 3, RP.latao, (i, j) => j === 1 ? null : 4); P.put(9, 15, RP.sangue, 6); P.put(9, 14, RP.sangue, 5);
  }
  return P.done();
}
function chainHeap() {   // 32 x 14: a heap of heavy chain, links face on and edge on, an iron ball and an open manacle
  const P = painter(32, 14), s = 10601;
  const link = (x, y, face, v) => {
    if (face) { P.put(x + 1, y, RP.ferroN, v + 1); P.put(x + 2, y, RP.ferroN, v + 0.6); P.put(x, y + 1, RP.ferroN, v + 0.4); P.put(x + 3, y + 1, RP.ferroN, v - 1); P.put(x + 1, y + 2, RP.ferroN, v - 1.2); P.put(x + 2, y + 2, RP.ferroN, v - 1.4); }
    else { P.put(x, y + 1, RP.ferroN, v + 0.8); P.put(x + 1, y + 1, RP.ferroN, v + 0.4); P.put(x + 2, y + 1, RP.ferroN, v - 0.6); }
  };
  for (let r = 0; r < 4; r++) { const n = 7 - r * 1.6; for (let i = 0; i < n; i++) { const x = 1 + r * 2.4 + i * 2.6 + hash2(i, r, s) * 0.8, y = 11 - r * 2.4 + hash2(i, r + 5, s) * 0.8; link(x, y, (i + r) % 2 === 0, 3.4 + r * 0.25 + hash2(i, r + 9, s) * 0.6); } }
  P.blob(26, 9.5, 4.4, 4.2, RP.ferroN, s, 3.6); P.put(24, 7, RP.ferroN, 6); P.put(25, 7, RP.ferroN, 5); P.put(24, 8, RP.ferroN, 5);   // the ball
  for (let i = 0; i < 3; i++) link(18 + i * 2.4, 9 + i * 0.3, i % 2 === 1, 3.4);
  for (let a = 3.1; a < 6.4; a += 0.25) P.put(5 + Math.cos(a) * 3, 12.5 + Math.sin(a) * 2.6, RP.ferrugem, 4.2 + Math.sin(-a) * 0.9);   // the manacle, open
  P.put(1, 13, RP.ferrugem, 3); P.put(9, 13, RP.ferrugem, 2.6);
  for (let x = 0; x < 32; x++) if (hash2(x, 3, s) < 0.3) P.put(x, 13, RP.ferrugem, 2.4);   // rust flakes
  return P.done();
}
function spikedBarricade() {   // 34 x 22: an iron sawhorse: a spiked beam on two crossed trestles, blood on the points
  const P = painter(34, 22), s = 10621;
  for (const lx of [7, 27]) { tube(P, t => [lx - 5 + t * 10, 21 - t * 14], () => 2.2, RP.ferroN, s + lx, 3); tube(P, t => [lx + 5 - t * 10, 21 - t * 14], () => 2.2, RP.ferroN, s + lx + 1, 3.6); }
  tube(P, t => [0.5 + t * 33, 9], () => 3.6, RP.ferroN, s, 3.8);
  for (let x = 3; x < 33; x += 6) { P.put(x, 8, RP.ferrugem, 4.6); P.put(x, 9, RP.ferrugem, 3); }   // rivets
  for (let k = 0; k < 6; k++) { const x = 3.5 + k * 5.4, a = -Math.PI / 2 + (k - 2.5) * 0.16; shard(P, x, 8, a, 7, 1.3, RP.ferroN, s + k, 0.75, 3.8); if (k % 2 === 0) { const tx = x + Math.cos(a) * 5, ty = 8 + Math.sin(a) * 5; P.put(tx, ty, RP.sangue, 4.6); P.put(tx, ty + 1, RP.sangue, 3.6); } }
  return P.done();
}
function tortureWheel() {   // 30 x 36: a spiked wheel of charred wood on an iron frame, manacles on the rim, bones below
  const P = painter(30, 36), s = 10641, cx = 15, cy = 14, r = 11;
  P.line(15, 15, 3, 35, RP.ferroN, 3.8, 2); P.line(15, 15, 27, 35, RP.ferroN, 2.8, 2); P.line(7, 28, 23, 28, RP.ferroN, 3.4, 1);
  for (let y = cy - r - 2; y <= cy + r + 2; y++) for (let x = cx - r - 2; x <= cx + r + 2; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (d <= r && d > r - 2.6) P.put(x, y, RP.madeira, 4 - (dx + dy) / r * 1.1 - (d > r - 0.8 ? 0.8 : 0) + cg(x, y, s) * 0.6 + (Math.round(a * 4) % 2 ? -0.4 : 0));
    else if (d < r - 2.6 && d > 2 && Math.abs(Math.sin(a * 3)) < 0.2 * (r / d)) P.put(x, y, RP.madeira, 4.2 - (dx + dy) / r + cg(x, y, s) * 0.6);
  }
  P.blob(cx, cy, 2.4, 2.4, RP.ferroN, s, 4);
  for (let k = 0; k < 10; k++) { const a = k * 0.628 + 0.3; shard(P, cx + Math.cos(a) * (r - 0.5), cy + Math.sin(a) * (r - 0.5), a, 4, 1, RP.ferroN, s + k, 0.9, 3.8); }   // the spikes round the rim
  P.line(cx + 7, cy + 8, cx + 8, cy + 12, RP.ferrugem, 3.6, 1); for (let b = 0; b < 6.3; b += 0.45) P.put(cx + 8.5 + Math.cos(b) * 1.6, cy + 14 + Math.sin(b) * 1.6, RP.ferrugem, 4 - Math.sin(b) * 0.8);   // a manacle hanging off the rim
  for (let x = 4; x < 27; x += 3) P.line(x, 35 - hash2(x, 0, s) * 1.4, x + 2.5, 34 + hash2(x, 1, s), RP.osso, 3.8, 1);
  skull(P, 21.5, 31.5, s, RP.osso, 3.8);
  return P.done();
}

/* =============================== RIOS DE FOGO =============================== */
function cauldron() {   // 28 x 30: a fat iron cauldron on three legs over a fire, boiling over with lava, a bone in it
  const P = painter(28, 30), s = 10661;
  for (let k = 0; k < 9; k++) P.blob(7 + k * 1.8, 28.5 - Math.sin(k / 8 * Math.PI) * 1.2, 1.4, 1.1, k % 3 ? RP.carvao : RP.lava, s + k, k % 3 ? 2.6 : 4.4);   // coals
  flame(P, 10, 27, 6, 2, s); flame(P, 18, 27, 5, 1.8, s + 2); flame(P, 14, 27, 8, 2.4, s + 4);
  for (const [lx, dx] of [[5, -1], [22, 1], [14, 0]]) P.line(lx, 20, lx + dx * 2, 29, RP.ferroN, lx === 14 ? 2.4 : 3.6, 2);
  for (let y = 6; y < 22; y++) { const t = (y - 6) / 16, hw = 12 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.35) / 0.72, 2))); for (let x = Math.round(14 - hw); x <= Math.round(14 + hw); x++) { const u = (x - 14 + hw) / Math.max(1, hw * 2); P.put(x, y, RP.ferroN, 4.6 - u * 2.8 - Math.max(0, t - 0.6) * 2 + cg(x, y, s) * 0.5 + (y === 9 ? 0.9 : 0) + (t > 0.75 ? 0.9 * (1 - Math.abs(u - 0.5) * 2) : 0)); } }   // the belly, lit from the fire under it
  for (const hx of [1, 26]) for (let a = 0; a < 6.3; a += 0.4) P.put(hx + Math.cos(a) * 1.6, 10 + Math.sin(a) * 2, RP.ferroN, hx < 14 ? 4.6 : 3);   // ring handles
  P.rect(3, 5, 23, 2, RP.ferroN, (i, j) => 5.2 - j * 1.6 - i * 0.08);   // the lip
  for (let x = 4; x < 25; x++) { P.put(x, 4, RP.lava, 5.2 - Math.abs(x - 14) * 0.06 + cg(x, 0, s) * 0.9); if (hash2(x, 2, s) < 0.35) P.put(x, 3, RP.lava, 4.6); }
  for (const [bx, r] of [[8, 1.6], [15, 2], [20, 1.3]]) P.blob(bx, 3, r, r * 0.9, RP.lava, s + bx, 4.6);   // bubbles
  for (let j = 0; j < 9; j++) P.put(5 + (j > 4 ? 1 : 0) - (j > 7 ? 1 : 0), 7 + j, RP.lava, 5.2 - j * 0.35);   // a spill down the side
  P.line(18, 3, 23, -1, RP.osso, 4.6, 2); P.put(23, 0, RP.osso, 5.4);
  return P.done();
}
function lavaBasin() {   // 34 x 30: a fountain of basalt: lava wells up in a small high bowl and pours over into the wide basin below
  const P = painter(34, 30), s = 10681;
  // the falls from the upper bowl, behind the column
  for (const [x0, x1] of [[9, 7], [24, 26]]) for (let y = 7; y < 19; y++) { const x = x0 + (x1 - x0) * Math.min(1, (y - 7) / 5); P.put(x, y, RP.lava, 5.4 - (y % 3 === 0 ? 1 : 0) + cg(x, y, s) * 0.6); P.put(x + (x0 < 17 ? 1 : -1), y, RP.lava, 3.8); }
  P.box(14, 8, 6, 12, RP.basalto, s + 1, 3.4); for (let y = 9; y < 19; y += 3) P.put(15, y, RP.basalto, 1.6);   // the column
  // the upper bowl
  for (let y = 4; y < 9; y++) { const hw = 8 - (y - 4) * 1.1; for (let x = Math.round(17 - hw); x < Math.round(17 + hw); x++) P.put(x, y, RP.basalto, 4.4 - (x - 17 + hw) / (hw * 2) * 2.4 + (y === 4 ? 1 : 0) + cg(x, y, s) * 0.5); }
  for (let x = 10; x < 24; x++) P.put(x, 3, RP.lava, 5 + cg(x, 3, s) * 1.2); P.blob(16, 2.6, 1.4, 1.1, RP.lava, s, 5);
  // the basin: a ring of rough-cut basalt blocks, brimming
  for (let x = 1; x < 33; x++) { P.put(x, 18, RP.lava, 4.8 + cg(x, 18, s) * 1.4 - Math.abs(x - 17) * 0.03); if (hash2(x, 1, s) < 0.25) P.put(x, 17, RP.lava, 4.4); }
  P.blob(7, 17.6, 1.4, 1, RP.lava, s + 3, 5); P.blob(27, 17.8, 1.2, 1, RP.lava, s + 4, 5.2);
  for (let k = 0; k < 6; k++) { const x0 = k * 5.6 | 0, w = (k === 5 ? 34 : ((k + 1) * 5.6) | 0) - x0, top = 19 + (k % 2); P.box(x0, top, w, 30 - top, RP.basalto, s + k * 3, 3.2 + (k < 3 ? 0.3 : -0.2)); }
  P.rect(0, 19, 34, 1, RP.basalto, (i) => 5 - i * 0.05);
  for (const [x, l] of [[3, 5], [21, 3]]) for (let j = 0; j < l; j++) P.put(x, 20 + j, RP.lava, 5 - j * 0.6);   // spill over the rim
  return P.done();
}
function brokenBridge() {   // 56 x 22: a span of black-iron truss snapped in the middle, the deck sagging, chains hanging off
  const P = painter(56, 22), s = 10701;
  P.blob(3, 13, 6, 9, RP.basalto, s, 3);   // the anchor rock it grows out of
  const truss = (x0, x1, sag) => {
    const y = x => 4 + sag(x), d = x => 13 + sag(x);
    for (let x = x0; x < x1; x++) { P.put(x, y(x), RP.ferroN, 4.4); P.put(x, y(x) + 1, RP.ferroN, 2.8); for (let j = 0; j < 3; j++) P.put(x, d(x) + j, RP.ferroN, (j === 0 ? 4.6 : 3) - ((x - x0) % 6 === 0 ? 1 : 0) + cg(x, j, s) * 0.5); }
    for (let x = x0; x < x1 - 4; x += 8) { P.line(x, y(x) + 1, x + 4, d(x + 4), RP.ferroN, 3.4, 1); P.line(x + 4, d(x + 4), x + 8, y(x + 8) + 1, RP.ferroN, 2.8, 1); P.line(x, y(x), x, d(x), RP.ferroN, 3.8, 1); P.put(x, d(x) + 1, RP.ferrugem, 4.6); }
  };
  truss(6, 30, () => 0);
  truss(35, 52, x => Math.round(Math.pow((x - 35) / 17, 1.6) * 5));
  // the snapped ends: twisted members, a plate hanging by a corner
  P.line(30, 4, 33, 1, RP.ferroN, 4, 1); P.line(30, 13, 32, 18, RP.ferroN, 3.4, 1); P.line(31, 14, 29, 19, RP.ferroN, 2.8, 1);
  P.line(35, 4, 33, 7, RP.ferroN, 3.6, 1); P.line(35, 13, 37, 19, RP.ferroN, 3, 1);
  chainV(P, 27, 16, 22); chainV(P, 44, 19, 22); chainV(P, 49, 20, 22);
  for (let k = 0; k < 10; k++) P.put(8 + k * 4.5, 16, RP.ferrugem, 3.4 + hash2(k, 0, s));   // rust runs
  return P.done();
}
function lavaFall() {   // 20 x 52: a crack in the basalt pours a thread of lava down the wall into a crusted pool
  const P = painter(20, 52), s = 10721;
  for (let x = 0; x < 20; x++) { const bot = Math.round(3 + hash2(x, 0, s) * 2.4 + Math.max(0, 6 - Math.abs(x + 0.5 - 10.5)) * 1.1), top = Math.max(0, Math.round((Math.abs(x + 0.5 - 10) - 5) * 0.7 + hash2(x, 1, s) * 1.5)); for (let y = top; y <= bot; y++) P.put(x, y, RP.basalto, 3.8 - (x - 10) * 0.08 - y * 0.12 + (y === bot ? -1.2 : 0) + ((x + 1) % 4 === 0 ? -1 : (x + 1) % 4 === 1 ? 0.6 : 0) + cg(x, y, s) * 0.6); }   // a ragged lip of basalt
  for (let y = 0; y < 10; y++) { const x = 10 + Math.round(Math.sin(y * 1.3) * 1.2); P.put(x, y, RP.lava, 3.4 + y * 0.25); if (y > 4) P.put(x + 1, y, RP.lava, 4 + y * 0.2); }   // the glowing crack it pours from
  for (const [x0, y0] of [[4, 1], [15, 2]]) for (let j = 0; j < 3; j++) P.put(x0 + j, y0 + (j & 1), RP.lava, 2.6);
  // the stream: bands of brighter and darker flow, its edges cooling
  for (let y = 9; y < 46; y++) { const c = 10.5 + Math.sin(y * 0.18) * 0.7 + (y - 9) * 0.02, hw = 2.2 + (y - 9) * 0.018 + Math.sin(y * 0.7) * 0.25; for (let x = Math.floor(c - hw); x <= c + hw; x++) { const u = Math.abs(x + 0.5 - c) / hw; if (u > 1) continue; P.put(x, y, u > 0.75 ? RP.fogo : RP.lava, 5.6 - u * 2.2 + Math.sin(y * 0.9 - x * 0.4) * 0.5 + cg(x, y, s) * 0.6 - (u > 0.75 ? 1 : 0)); } }
  // the pool and its crust, a splash
  for (let y = 44; y < 52; y++) for (let x = 1; x < 20; x++) { const dx = (x + 0.5 - 10.5) / 9.5, dy = (y + 0.5 - 50) / 5; const d = dx * dx + dy * dy; if (d > 1 || y > 51) continue; if (d > 0.62) P.put(x, y, RP.basalto, 3.4 - dx * 1.2 + cg(x, y, s) * 0.6 + (hash2(x, y, s) < 0.25 ? -1 : 0)); else P.put(x, y, RP.lava, 5.4 - d * 2.5 + cg(x, y, s) * 0.8); }
  for (const [x, y] of [[7, 44], [14, 43], [6, 42], [15, 45]]) P.put(x, y, RP.lava, 5.6);
  return P.done();
}
function shardCluster(bone) {   // 34 x 28 or 28 x 30: giant spikes of bone (a skull stuck on one) or of obsidian, thrust up from the floor
  const P = painter(bone ? 34 : 28, bone ? 28 : 30), s = bone ? 10741 : 10742, R = bone ? RP.osso : RP.obsidiana;
  const list = bone ? [[6, -1.95, 18, 2.2], [27, -1.2, 20, 2.4], [16, -1.62, 27, 3.2], [11, -1.3, 13, 1.8], [22, -2.0, 12, 1.6]] : [[8, -1.9, 22, 3], [19, -1.3, 26, 3.4], [14, -1.6, 16, 2.4], [4, -2.3, 12, 2], [24, -1.0, 11, 1.8]];
  for (let k = 0; k < list.length; k++) { const [x, a, l, w] = list[k]; shard(P, x, (bone ? 28 : 30) + 1, a, l, w, R, s + k, bone ? 0.7 : 0.4, bone ? 3.4 - k * 0.1 : 3.9); }
  if (bone) { skull(P, 16.5, 9.5, s, RP.osso, 3.6); for (let j = 0; j < 4; j++) P.put(16 + (j % 2), 12 + j, RP.sangue, 4 - j * 0.5); }
  else for (let k = 0; k < 8; k++) P.put(5 + hash2(k, 0, s) * 18, 12 + hash2(k, 1, s) * 16, RP.obsidiana, 6);   // purple glints
  for (let x = 0; x < P.w; x++) if (hash2(x, 5, s) < 0.6) P.put(x, P.h - 1, bone ? RP.osso : RP.basalto, 2.4 + hash2(x, 6, s));   // the broken floor around the roots
  return P.done();
}
function cage(skel) {   // 20 x 40: a black-iron cage on a chain, spiked crown; empty with its door hanging open, or a prisoner's bones
  const P = painter(20, 40), s = skel ? 10762 : 10761;
  chainV(P, 9, 0, 8);
  for (let y = 8; y < 12; y++) { const hw = (y - 7) * 2.2; for (let x = Math.round(10 - hw); x <= Math.round(10 + hw); x++) P.put(x, y, RP.ferroN, Math.abs(x - 10) > hw - 1 ? 4.6 : 2.4); }
  for (const x of [2, 6, 10, 14, 18]) { P.put(x, 10, RP.ferroN, 5); P.put(x, 9, RP.ferroN, 4.2); }
  if (skel) {   // the prisoner, folded up on the floor of it, one arm through the bars
    skull(P, 8.5, 26.5, s, RP.osso, 3.8); P.put(8, 26, RP.sombra, 0.3);
    for (let k = 0; k < 4; k++) P.line(7, 30 + k * 1.4, 12, 30 + k * 1.4 + 0.5, RP.osso, 3.6 - k * 0.2, 1);
    P.line(10, 30, 15, 35, RP.osso, 3.4, 1); P.line(13, 30, 20, 32, RP.osso, 4, 1); P.line(20, 32, 20, 36, RP.osso, 3.4, 1);
    P.line(4, 36, 14, 36, RP.osso, 3.8, 1); P.line(5, 35, 9, 33, RP.osso, 3.4, 1);
  }
  for (let y = 11; y < 39; y++) for (const x of [2, 6, 10, 14, 18]) { if (!skel && x === 18 && y > 13) continue; P.put(x, y, RP.ferroN, (x < 10 ? 4.6 : x === 10 ? 4 : 3.2) - (y % 7 === 0 ? 0.8 : 0)); }
  for (const y of [11, 24, 38]) P.line(2, y, 18, y, RP.ferroN, (t) => 4.8 - t * 1.4, 1);
  if (!skel) { for (let k = 0; k < 4; k++) P.line(18 + k * 0.4, 13 + k * 8, 20, 14 + k * 8, RP.ferroN, 3.6, 1); P.line(19, 13, 20, 38, RP.ferroN, 3.4, 1); }   // the door swung out
  P.rect(2, 39, 17, 1, RP.ferroN, () => 2.6);
  return P.done();
}

/* =============================== AS ENTRANHAS =============================== */
function giantRibs() {   // 46 x 36: the ribs of something enormous arching out of the floor, its spine along the ground
  const P = painter(46, 36), s = 10781;
  for (let k = 5; k >= 0; k--) {
    const bx = 5 + k * 6.6, h = 31 - Math.abs(k - 2.2) * 3.2, lean = 7 + k * 0.6, broken = k === 4;
    tube(P, t => [bx + Math.sin(t * Math.PI * 0.85) * lean, 33 - t * h * (broken ? 0.62 : 1)], t => 3.6 - t * 2, RP.osso, s + k, 3.6 - (5 - k) * 0.12);
    if (broken) { P.put(bx + lean * 0.93, 33 - h * 0.62 - 1, RP.osso, 5.4); P.put(bx + lean * 0.9 + 1, 33 - h * 0.62, RP.osso, 2); }
  }
  tube(P, t => [1 + t * 44, 33 + Math.sin(t * 3) * 0.6], () => 4, RP.osso, s, 3.2);   // the spine
  for (let x = 3; x < 45; x += 4) { P.blob(x, 31, 1.6, 1.4, RP.osso, s + x, 4.2); P.put(x + 2, 33, RP.osso, 1.4); }   // vertebrae
  for (let k = 0; k < 6; k++) { const x = 6 + k * 7, y = 18 + hash2(k, 0, s) * 10; P.line(x, y, x + 2, y + 6, RP.carne, 3, 1); P.put(x + 2, y + 7, RP.carne, 2.4); }   // shreds of meat still on them
  return P.done();
}
function giantSkull() {   // 38 x 28: the horned skull of a great demon half sunk in the floor, an ember deep in one socket
  const P = painter(38, 28), s = 10801;
  tube(P, t => [10 - t * 9, 9 - Math.sin(t * 2.4) * 9 + t * 4], t => 4.4 - t * 3.6, RP.chifre, s, 3.8);
  tube(P, t => [28 + t * 9, 9 - Math.sin(t * 2.4) * 9 + t * 4], t => 4.4 - t * 3.6, RP.chifre, s + 1, 3.2);
  for (let y = 0; y < 28; y++) for (let x = 0; x < 38; x++) {
    const dx = (x + 0.5 - 19) / 14, dy = (y + 0.5 - 14) / 12.5, dome = dx * dx + dy * dy, jaw = Math.abs(x + 0.5 - 19) < 10 - Math.max(0, y - 18) * 0.4 && y >= 14;
    if (dome > 1 && !jaw) continue;
    P.put(x, y, RP.osso, 4 - dx * 1.2 - dy * 1.1 - (y > 22 ? (y - 22) * 0.35 : 0) + cg(x, y, s) * 0.6 + cn(x, y, 30, 30, s) * 0.8);
  }
  for (const [ex, ey] of [[12.5, 13], [25.5, 13]]) for (let y = ey - 4; y <= ey + 3; y++) for (let x = ex - 4; x <= ex + 4; x++) { const d = Math.hypot((x + 0.5 - ex) / 4, (y + 0.5 - ey) / 3.6); if (d < 1) P.put(x, y, RP.sombra, 1 + d * 2.6 + (y < ey - 2 ? 0.8 : 0)); }
  P.blob(12.5, 13.5, 1.4, 1.2, RP.lava, s, 4.8); P.put(12, 13, RP.lava, 6);   // the ember
  for (let y = 16; y < 21; y++) for (let x = 17; x < 21; x++) if (Math.abs(x + 0.5 - 19) < (y - 15) * 0.5) P.put(x, y, RP.sombra, 2);   // the nose
  for (let k = 0; k < 7; k++) { const x = 11 + k * 2.4, l = 3 + (k % 3 === 1 ? 2 : 0) + (k === 0 || k === 6 ? 1 : 0); for (let j = 0; j < l; j++) { P.put(x, 22 + j, RP.osso, 5 - j * 0.5); P.put(x + 1, 22 + j, RP.osso, 3.4 - j * 0.4); } P.put(x + 2, 22, RP.sombra, 1); }   // the teeth
  for (let k = 0; k < 10; k++) P.put(19 + Math.sin(k * 0.8) * 1.2 - 3, 2 + k, RP.osso, 1.6);   // a crack across the crown
  for (let x = 0; x < 38; x++) if (hash2(x, 4, s) < 0.55) P.put(x, 27, RP.carne, 2.6 + hash2(x, 5, s) * 1.4);
  return P.done();
}
function cocoon(k) {   // 14 x 32 or 18 x 36: a cocoon of veined flesh hung on sinews, something curled up inside it
  const W = k ? 18 : 14, H = k ? 36 : 32, P = painter(W, H), s = 10821 + k, cx = W / 2, cy = H * 0.6, rx = W / 2 - 1, ry = H * 0.36;
  for (const [x0, x1] of [[1, cx - 2], [W - 2, cx + 2], [cx, cx]]) P.line(x0, 0, x1, cy - ry + 1, RP.rosa, (t) => 3.6 - t, 1);   // the sinews it hangs by
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, w = 1 - Math.max(0, dy) * 0.25, d = (dx / w) * (dx / w) + dy * dy; if (d > 1) continue;
    const core = Math.hypot((x + 0.5 - cx + 1) / (rx * 0.55), (y + 0.5 - cy - 1) / (ry * 0.55)) < 1 && cn(x, y, 4, 4, s) > -0.25;
    P.put(x, y, core ? RP.carne : RP.rosa, (core ? 1.6 : 3.8) - dx * 1.1 - dy * 0.9 - d * 0.6 + cg(x, y, s) * 0.6);
  }
  for (let v = 0; v < 3; v++) { let x = cx - 3 + v * 3, y = cy - ry + 2; for (let j = 0; j < ry * 1.6; j++) { x += (hash2(j, v, s) - 0.5) * 1.4; y += 1; if (P.has(x, y)) P.put(x, y, RP.veia, 4); } }   // veins
  P.put(cx - 2, cy - ry * 0.4, RP.rosa, 6); P.put(cx - 3, cy - ry * 0.4 + 1, RP.rosa, 5.4);   // a wet highlight
  for (let j = 0; j < 4; j++) P.put(cx + 1, cy + ry + j, RP.rosa, 4 - j * 0.6);   // a drip
  return P.done();
}
function demonEggs(nest) {   // 14 x 18 or 32 x 20: leathery eggs veined in purple, cracks glowing hot; in a nest of sinew and bone
  const P = painter(nest ? 32 : 16, nest ? 20 : 22), s = nest ? 10842 : 10841;
  const egg = (cx, by, rx, ry, ss) => {
    for (let y = Math.floor(by - ry * 2); y <= by; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dy = (y + 0.5 - (by - ry)) / ry, w = rx * (dy < 0 ? 1 - dy * dy * 0.42 : Math.sqrt(Math.max(0, 1 - dy * dy * 0.85))), dx = (x + 0.5 - cx) / Math.max(0.5, w); if (Math.abs(dx) > 1 || Math.abs(dy) > 1) continue;
      P.put(x, y, RP.ovo, 4 - dx * 1.4 - dy * 0.8 + cg(x, y, ss) * 0.6 + ((x + y * 2) % 5 === 0 ? -0.6 : 0));
    }
    { let x = cx - 0.5; for (let j = 0; j < ry * 1.1; j++) { const y = by - ry * 1.7 + j; x += (hash2(j, 0, ss) - 0.5) * 1.8; P.put(x, y, RP.lava, 4.4 + (j % 3 === 1 ? 1.4 : 0)); if (j === 3 || j === 6) for (let b = 1; b < 3; b++) P.put(x + b * (j === 3 ? 1 : -1), y + b * 0.5, RP.lava, 3.6); } }   // the crack, glowing
    P.put(cx - rx * 0.5, by - ry * 1.5, RP.ovo, 6); P.put(cx - rx * 0.5 + 1, by - ry * 1.5 + 1, RP.ovo, 5.2);
    for (let v = 0; v < 2; v++) for (let j = 0; j < ry; j++) P.put(cx + rx * 0.4 + v - j * 0.15, by - ry * 1.4 + j * 1.2, RP.veia, 4.6);
  };
  if (nest) {
    for (let k = 0; k < 12; k++) { const x = 2 + k * 2.4, y = 18 + hash2(k, 0, s) * 1.5; P.line(x, y, x + 3 + hash2(k, 1, s) * 2, y - 1 - hash2(k, 2, s) * 2, k % 3 ? RP.rosa : RP.osso, 3.6, 1); }
    egg(9, 18, 4.6, 7, s); egg(22, 18, 4, 6, s + 1); egg(15.5, 19, 3.6, 5, s + 2);
    for (let x = 0; x < 32; x++) P.put(x, 19, RP.carne, 2.8 + hash2(x, 3, s) * 1.4);
  } else egg(8, 21, 6, 10, s);
  return P.done();
}
function heartWall() {   // 30 x 32: a heart grown into the wall, arteries running out into the rock; it beats
  const P = painter(30, 32), s = 10861;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 30; x++) { const dx = (x + 0.5 - 15) / 15, dy = (y + 0.5 - 16) / 16; if (dx * dx + dy * dy > 0.85 - cn(x, y, 5, 5, s) * 1.3) continue; P.put(x, y, RP.carne, 1.8 - dx * 0.6 - dy * 0.6 + cg(x, y, s) * 0.9 + cn(x, y, 4, 4, s + 1) * 1.2); }   // the flesh it sits in
  for (let a = 0; a < 7; a++) { const ang = a * 0.9 + 0.3, len = 13 + hash2(a, 0, s) * 3; tube(P, t => [15 + Math.cos(ang) * len * t + Math.sin(t * 6 + a) * 0.8, 17 + Math.sin(ang) * len * t], t => 2.4 - t * 1.4, RP.veia, s + a, 3.4); }
  for (let y = 4; y < 30; y++) for (let x = 3; x < 28; x++) {
    const l1 = Math.hypot((x + 0.5 - 11) / 6.4, (y + 0.5 - 13) / 6.4), l2 = Math.hypot((x + 0.5 - 19) / 6, (y + 0.5 - 12.5) / 6), tri = y >= 13 && Math.abs(x + 0.5 - 15 - (y - 13) * 0.08) < 11 * (1 - (y - 13) / 15.5);
    if (l1 > 1 && l2 > 1 && !tri) continue;
    const dx = (x + 0.5 - 15) / 12, dy = (y + 0.5 - 16) / 13;
    P.put(x, y, RP.rosa, 3.8 - dx * 1.5 - dy * 1.3 + cg(x, y, s) * 0.5 + cn(x, y, 10, 10, s) * 0.8);
  }
  tube(P, t => [13 - t * 2, 7 - t * 7], () => 3.6, RP.rosa, s + 9, 3.6); tube(P, t => [18 + t * 4, 7 - t * 5 + t * t * 2], () => 3, RP.veia, s + 10, 3.8);   // aorta and a vein out the top
  P.put(12.5, 0, RP.sombra, 1); P.put(22, 3, RP.sombra, 1);
  for (let j = 0; j < 14; j++) { P.put(15 + Math.sin(j * 0.6) * 1.5, 11 + j, RP.veia, 4.4); if (j % 4 === 1) P.put(16 + Math.sin(j * 0.6) * 1.5 + 1, 11 + j, RP.veia, 3.6); }   // the groove between the halves
  P.put(8, 9, RP.rosa, 6); P.put(9, 9, RP.rosa, 6); P.put(8, 10, RP.rosa, 5.4); P.put(17, 8, RP.rosa, 5.6);   // wet highlights
  return P.done();
}
function eyeWall() {   // 26 x 18: a yellow eye with a slit pupil, sunk in lids of flesh, bloodshot; it blinks
  const P = painter(26, 18), s = 10881;
  for (let y = 0; y < 18; y++) for (let x = 0; x < 26; x++) { const dx = (x + 0.5 - 13) / 13, dy = (y + 0.5 - 9) / 9; if (dx * dx + dy * dy > 1 - cn(x, y, 6, 6, s) * 0.4) continue; P.put(x, y, RP.carne, 3 - dx * 0.8 - dy * 1.4 + cg(x, y, s) * 0.7 + (Math.abs(dy) > 0.5 ? 0.4 : 0)); }
  for (let y = 4; y < 15; y++) for (let x = 3; x < 24; x++) { const dx = (x + 0.5 - 13) / 9, dy = (y + 0.5 - 9) / 4.6; if (dx * dx + dy * dy > 1) continue; P.put(x, y, RP.olho, 4.6 - dx * 0.8 - dy * 1 - (dx * dx + dy * dy) * 1.4 + cg(x, y, s) * 0.4); }   // the white (yellowed)
  for (let k = 0; k < 6; k++) { let x = k < 3 ? 4.5 : 21.5, y = 7 + (k % 3) * 2; for (let j = 0; j < 4; j++) { P.put(x, y, RP.sangue, 5.4); x += k < 3 ? 1 : -1; y += hash2(j, k, s) - 0.5; } }   // bloodshot
  for (let y = 5; y < 14; y++) for (let x = 9; x < 18; x++) { const d = Math.hypot((x + 0.5 - 13.5) / 4.2, (y + 0.5 - 9) / 4.2); if (d > 1) continue; P.put(x, y, RP.fogo, 5.4 - d * 2.6 + cg(x, y, s) * 0.5); }   // the iris
  for (let y = 5; y < 14; y++) { const hw = 0.6 + Math.sin((y - 5) / 8 * Math.PI) * 0.9; for (let x = 12; x < 16; x++) if (Math.abs(x + 0.5 - 13.5) < hw) P.put(x, y, RP.sombra, 0.5); }   // slit pupil
  P.put(11, 7, RP.olho, 6); P.put(12, 6, RP.olho, 6);
  for (let x = 4; x < 23; x++) { const dx = (x + 0.5 - 13) / 9.4; P.put(x, Math.round(9 - Math.sqrt(Math.max(0, 1 - dx * dx)) * 4.8), RP.rosa, 4.8); P.put(x, Math.round(9 + Math.sqrt(Math.max(0, 1 - dx * dx)) * 4.8), RP.rosa, 3.2); }   // the lid rims
  return P.done();
}
function mouthWall() {   // 28 x 22: lips of flesh in the wall, rows of crooked teeth, a dark throat, drool
  const P = painter(28, 22), s = 10901;
  for (let y = 0; y < 20; y++) for (let x = 0; x < 28; x++) { const dx = (x + 0.5 - 14) / 14, dy = (y + 0.5 - 10) / 10; if (dx * dx + dy * dy > 1 - cn(x, y, 6, 6, s) * 0.4) continue; P.put(x, y, RP.carne, 2.6 - dx * 0.7 - dy * 1.2 + cg(x, y, s) * 0.7); }
  for (let y = 3; y < 18; y++) for (let x = 3; x < 25; x++) { const dx = (x + 0.5 - 14) / 11, dy = (y + 0.5 - 10) / 6.4; const d = dx * dx + dy * dy; if (d > 1) continue; if (d > 0.5) P.put(x, y, RP.rosa, 4.4 - dy * 1.6 - dx * 0.5 + cg(x, y, s) * 0.5 + (Math.abs(dy) < 0.2 ? -1.5 : 0)); else P.put(x, y, d < 0.18 ? RP.sombra : RP.sangue, d < 0.18 ? 0.5 : 2.4 - d * 2 + cg(x, y, s) * 0.6); }
  for (let k = 0; k < 9; k++) { const x = 6.5 + k * 1.9, dx = (x - 14) / 8; const top = Math.round(10 - Math.sqrt(Math.max(0, 1 - dx * dx)) * 4.2), l = 2 + (hash2(k, 0, s) * 2.4 | 0); for (let j = 0; j < l; j++) P.put(x, top + j, RP.osso, 5 - j * 0.7); if (k % 2) P.put(x + 1, top, RP.osso, 3.6); }
  for (let k = 0; k < 8; k++) { const x = 7.5 + k * 2, dx = (x - 14) / 8; const bot = Math.round(10 + Math.sqrt(Math.max(0, 1 - dx * dx)) * 4.2), l = 2 + (hash2(k, 1, s) * 2 | 0); for (let j = 0; j < l; j++) P.put(x, bot - j, RP.osso, 4 - j * 0.4); }
  P.blob(16, 12, 3, 1.4, RP.rosa, s, 3.2);   // the tongue
  for (const [x, l] of [[9, 6], [17, 4], [20, 7]]) for (let j = 0; j < l; j++) P.put(x, 15 + j, RP.cera, 4.6 - j * 0.4 + (j === l - 1 ? 1 : 0));   // drool
  return P.done();
}
function meatHooks(k) {   // 26 x 36 or 14 x 38: butcher's hooks on chains, slabs of meat and a haunch hung on them
  const P = painter(k ? 14 : 26, k ? 38 : 36), s = 10921 + k;
  const hook = (x, y) => { P.line(x, y, x, y + 4, RP.ferroN, 4.4, 1); for (let a = 0; a < 3.4; a += 0.35) P.put(x - 1.6 + Math.cos(a) * 1.8, y + 5 + Math.sin(a) * 1.8, RP.ferroN, 4.6 - a * 0.3); P.put(x - 3, y + 4, RP.ferroN, 5); };
  const slab = (cx, y0, w, h, ss) => {
    for (let y = y0; y < y0 + h; y++) for (let x = Math.floor(cx - w); x <= cx + w; x++) {
      const t = (y - y0) / h, hw = w * (0.55 + Math.sin(t * Math.PI) * 0.45); if (Math.abs(x + 0.5 - cx) > hw) continue;
      const fat = Math.abs(((y + Math.sin(x * 0.7) * 1.2) % 5) - 2.5) < 0.6, u = (x + 0.5 - cx + hw) / (hw * 2);
      P.put(x, y, fat ? RP.cera : RP.carne, (fat ? 3.6 : 4.2) - u * 1.8 + cg(x, y, ss) * 0.6);
    }
    P.blob(cx, y0 + h, 1.6, 1.3, RP.osso, ss, 4.6);   // the bone end
  };
  if (k) { chainV(P, 6, 0, 12); hook(7, 12); tube(P, t => [7 + Math.sin(t * 3) * 1.2, 16 + t * 18], t => 9 - t * 6, RP.carne, s, 3.8); P.blob(7.5, 35, 2, 1.6, RP.osso, s, 4.6); for (let j = 0; j < 3; j++) P.put(6, 37 - j * 0, RP.sangue, 4); }
  else {
    P.rect(0, 0, 26, 2, RP.ferroN, (i, j) => 4.6 - j * 1.6 - i * 0.05);
    chainV(P, 4, 2, 8); hook(5, 8); slab(5, 15, 4, 16, s);
    chainV(P, 13, 2, 15); hook(14, 15); slab(14, 22, 3.4, 12, s + 1);
    chainV(P, 21, 2, 6); hook(22, 6); P.blob(21, 9, 1, 1, RP.ferroN, s, 3);   // an empty hook
  }
  for (let j = 0; j < 3; j++) { P.put(k ? 8 : 5, (k ? 36 : 32) + j, RP.sangue, 4.4 - j); }   // a drop of blood falling
  return P.done();
}
function bonePyre() {   // 26 x 30: a heap of bones and skulls burning on top
  const P = painter(26, 30), s = 10941;
  for (let k = 0; k < 46; k++) {
    const t = hash2(k, 0, s), x = 2 + t * 22, top = 29 - Math.sin(t * Math.PI) * 14, y = top + hash2(k, 1, s) * (29 - top) * 0.9, a = hash2(k, 2, s) * 3.1, l = 2.5 + hash2(k, 3, s) * 3;
    P.line(x - Math.cos(a) * l, y - Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.5, RP.osso, 3.2 + (29 - y) * 0.06 + hash2(k, 4, s), 1);
    P.put(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.5, RP.osso, 5);
  }
  for (const [x, y, ss] of [[7.5, 24.5, 1], [17.5, 22.5, 2], [12.5, 26.5, 3], [21.5, 26.5, 4]]) skull(P, x, y, s + ss, RP.osso, 4);
  for (let x = 7; x < 20; x++) for (let y = 14; y < 18; y++) if (hash2(x, y, s) < 0.6) P.put(x, y, hash2(x, y, s + 1) < 0.5 ? RP.lava : RP.carvao, 3.6 + hash2(x, y, s + 2) * 2);   // the embers
  flame(P, 10, 16, 10, 3, s); flame(P, 16, 16, 12, 3.2, s + 4); flame(P, 13, 16, 15, 3.6, s + 7);
  return P.done();
}

/* =============================== TRONO DO CAOS =============================== */
function sacrificeAltar(k) {   // 36 x 24: a slab of chaos stone on a carved base, runes lit, blood down the front, candles at the corners
  const P = painter(36, 24), s = 10961 + k;
  P.box(5, 11, 26, 13, RP.caos, s, 3.2);
  for (let i = 0; i < 4; i++) glyph(P, 8 + i * 6, 15, i * 2 + k, RP.runa, 4.6);   // the lit runes
  P.box(1, 7, 34, 5, RP.caos, s + 1, 3.8); P.rect(0, 7, 36, 1, RP.caos, (i) => 5 - i * 0.05);
  for (const [x, l] of [[9, 9], [14, 5], [23, 11], [27, 4]]) for (let j = 0; j < l; j++) P.put(x + (j > 5 ? 1 : 0), 8 + j, RP.sangue, 5 - j * 0.25);   // blood running down
  for (let x = 8; x < 28; x++) if (hash2(x, 0, s) < 0.7) P.put(x, 7, RP.sangue, 4 + hash2(x, 1, s) * 1.5);
  candle(P, 1, 6, 5, s); candle(P, 32, 6, 3, s + 1);
  if (k === 0) { P.line(12, 5, 22, 5, RP.ferroN, 5, 1); P.line(22, 5, 25, 4, RP.ferroN, 4, 1); P.rect(9, 4, 3, 2, RP.latao, (i, j) => 4.6 - i * 0.6 - j); P.put(8, 5, RP.cristal, 5); }   // a sacrificial knife with a red stone
  else { skull(P, 13.5, 3.5, s, RP.osso, 4); for (let i = 0; i < 4; i++) P.line(17 + i * 2, 5, 19 + i * 2, 6, RP.osso, 3.8, 1); P.rect(24, 1, 4, 5, RP.latao, (i, j) => j === 0 ? 5 : 4.2 - i * 0.6); P.rect(25, 2, 2, 1, RP.sangue, () => 5); }   // bones and a chalice
  return P.done();
}
function pentagram() {   // 44 x 18: a pentagram burnt into the floor, seen from above the floor line, its lines glowing; a candle at every point
  const P = painter(44, 18), s = 10981, cx = 22, cy = 11.5, rx = 20, ry = 5.4;
  for (let y = 4; y < 18; y++) for (let x = 0; x < 44; x++) { const d = Math.hypot((x + 0.5 - cx) / (rx + 1.5), (y + 0.5 - cy) / (ry + 1)); if (d < 1) P.put(x, y, d > 0.88 ? RP.carvao : RP.sangue, (d > 0.88 ? 2.4 : 0.8) + cg(x, y, s) * 1.2); }   // the scorched stain
  for (let a = 0; a < 6.3; a += 0.015) P.put(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, RP.runa, 3.4 + Math.sin(a) * 1);
  const pts = []; for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + k * Math.PI * 2 / 5; pts.push([cx + Math.cos(a) * rx * 0.97, cy + Math.sin(a) * ry * 0.97]); }   // point down: the profane way
  for (let k = 0; k < 5; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[(k + 2) % 5]; P.line(x0, y0, x1, y1, RP.runa, (t) => 4.6 - Math.abs(t - 0.5) * 1.2, 1); }
  for (const [x, y] of pts) P.put(x, y, RP.runa, 6);
  for (const [x, y] of pts) candle(P, Math.round(x) - (x > cx ? 1 : 0), Math.round(y) - 1, 3 + (y < cy ? 1 : 0), s + x);
  return P.done();
}
function runeObelisk() {   // 18 x 52: a tapering obelisk of chaos stone, a column of runes burning up its face
  const P = painter(18, 52), s = 11001;
  P.box(0, 46, 18, 6, RP.caos, s, 3.4); P.box(2, 42, 14, 4, RP.caos, s + 1, 3.6);
  for (let y = 6; y < 42; y++) { const hw = 4 + (y - 6) / 36 * 2.2; for (let x = Math.round(9 - hw); x < Math.round(9 + hw); x++) { const u = (x - 9 + hw) / (hw * 2); P.put(x, y, RP.caos, 4.4 - u * 2.6 + (u < 0.12 ? 0.8 : 0) + cg(x, y, s) * 0.55 + cn(x, y, 20, 30, s) * 0.7 - (y % 9 === 0 ? 0.8 : 0)); } }
  for (let y = 0; y < 7; y++) { const hw = (y + 1) * 0.62; for (let x = Math.round(9 - hw); x < Math.round(9 + hw); x++) P.put(x, y, RP.caos, (x < 9 ? 5 : 3) - y * 0.1 + cg(x, y, s) * 0.4); }
  P.put(8, 0, RP.runa, 5.4);
  for (let k = 0; k < 6; k++) glyph(P, 7, 9 + k * 5.4, k * 3 + 1, RP.runa, 5.2 - k * 0.2);
  for (let k = 0; k < 7; k++) P.put(5 + hash2(k, 0, s) * 8, 10 + hash2(k, 1, s) * 30, RP.veia, 4.6);   // flecks of red vein
  return P.done();
}
function chaosCrystal(k) {   // 26 x 36 or 22 x 28: a burst of magenta-red chaos crystal out of a cracked chaos-stone root
  const P = painter(k ? 22 : 26, k ? 28 : 36), s = 11021 + k, H = k ? 28 : 36, cx = k ? 11 : 13;
  P.blob(cx, H - 1.5, cx - 2, 3, RP.caos, s, 3.2);
  const list = k ? [[-1.95, 18, 2.6], [-1.2, 15, 2.2], [-1.62, 24, 3.2], [-2.4, 10, 1.8]] : [[-1.9, 24, 3], [-1.25, 22, 2.6], [-1.6, 32, 3.8], [-2.35, 14, 2.2], [-0.9, 12, 1.8]];
  for (let i = 0; i < list.length; i++) { const [a, l, w] = list[i]; shard(P, cx + Math.cos(a) * 2, H - 2, a, l, w, RP.cristal, s + i, 0.32, 2.8); }
  for (let i = 0; i < 6; i++) P.put(cx - 4 + hash2(i, 0, s) * 8, H - 6 - hash2(i, 1, s) * (H - 12), RP.cristal, 6);   // sparks inside
  return P.done();
}
function profaneLectern() {   // 20 x 30: an iron lectern, an open book whose letters burn, a candle on the corner
  const P = painter(20, 30), s = 11041;
  P.box(3, 27, 14, 3, RP.ferroN, s, 3.4); P.line(9, 14, 9, 27, RP.ferroN, 4, 2); P.rect(6, 20, 8, 1, RP.ferroN, (i) => 4.4 - i * 0.3);
  for (let x = 1; x < 19; x++) { const y = Math.round(12 - (x - 1) * 0.2); P.put(x, y, RP.ferroN, 4.6); P.put(x, y + 1, RP.ferroN, 2.8); P.put(x, y + 2, RP.ferroN, 2); }   // the slanted desk
  for (let x = 2; x < 18; x++) { const yb = Math.round(11 - (x - 2) * 0.2), mid = Math.abs(x - 9.5) < 0.8, hgt = 5 - Math.abs(x - 9.5) * 0.12; for (let y = Math.round(yb - hgt); y <= yb; y++) P.put(x, y, mid ? RP.couro : RP.papel, mid ? 2 : 4.6 - (x < 9.5 ? (9.5 - x) * 0.08 : (x - 9.5) * 0.14) + cg(x, y, s) * 0.5); }
  for (let x = 3; x < 17; x++) if (Math.abs(x - 9.5) > 1.4) for (let y = 0; y < 2; y++) { const yb = Math.round(11 - (x - 2) * 0.2) - 1 - y * 2; if (hash2(Math.floor(x / 3), y, s) < 0.8 && x % 3 !== 2) P.put(x, yb, RP.cristal, 4 + hash2(x, y, s + 1) * 1.6); }   // the burning script
  glyph(P, 4, 4 - 1, 2, RP.cristal, 5.4);
  P.rect(1, 12, 3, 1, RP.couro, () => 3); P.line(10, 12, 11, 17, RP.pano, 4.4, 1);   // binding and a ribbon
  candle(P, 16, 8 - 2, 3, s);
  return P.done();
}
function candleSkull() {   // 18 x 20: a horned demon skull on the floor, three candles melted onto its crown, wax down its face
  const P = painter(18, 20), s = 11061;
  tube(P, t => [5 - t * 4, 12 - t * 6 + t * t * 2], t => 2.6 - t * 1.6, RP.chifre, s, 5); tube(P, t => [13 + t * 4, 12 - t * 6 + t * t * 2], t => 2.6 - t * 1.6, RP.chifre, s + 1, 4.2);
  P.blob(9, 13, 5.4, 4.6, RP.osso, s, 4); P.rect(5, 17, 8, 3, RP.osso, (i, j) => (i % 2 && j < 2) ? 2.4 : 4.2 - i * 0.2 - j * 0.4);
  P.blob(6.5, 13.5, 1.5, 1.4, RP.sombra, s, 0.5); P.blob(11.5, 13.5, 1.5, 1.4, RP.sombra, s, 0.5); P.put(9, 16, RP.sombra, 1.5);
  candle(P, 5, 9, 4, s); candle(P, 9, 8, 6, s + 1); candle(P, 12, 9, 3, s + 2);
  for (const [x, l] of [[4, 6], [8, 4], [13, 7]]) for (let j = 0; j < l; j++) P.put(x, 10 + j, RP.cera, 4.8 - j * 0.3);   // wax runs down the face
  return P.done();
}

/* =============================== register =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes, abismo: true }, extra || {}));
const wicked = fn => { WK.length = 0; const cv = fn(); return [cv, WK.map(w => ({ x: w.x, y: w.y }))]; };
const FIRE = '#ff7a20', RUNE = '#b050f0', CHAOS = '#ff3a7a', BLOOD = '#ff3a2a';
// Portões de Cinza
def('ab_portao', 'Portão de ferro quebrado', W, 'fundo', ['portoes', 'trono'], [hellGate(false), hellGate(true)]);
def('ab_estatua', 'Estátua de demônio', F, 'frente', ['portoes', 'trono'], [demonStatue(false), demonStatue(true)], { luz: [{ x: 13, y: 13, r: 0.25 }], brilho: FIRE });
def('ab_pilar', 'Pilar de crânios', F, 'frente', ['portoes', 'entranhas'], [skullPillar()]);
def('ab_braseiro', 'Braseiro', F, 'frente', ['portoes', 'rios', 'trono'], [bigBrazier(true), bigBrazier(false)], { luz: [{ x: 10, y: 6, r: 1 }], brilho: FIRE });
def('ab_estandarte', 'Estandarte rasgado', C, 'frente', ['portoes', 'trono'], [tornBanner(0), tornBanner(1)]);
def('ab_correntes', 'Pilha de correntes', F, 'frente', ['portoes', 'rios'], [chainHeap()]);
def('ab_cavalete', 'Cavalete de ferro', F, 'frente', ['portoes'], [spikedBarricade()]);
def('ab_roda', 'Roda de tortura', F, 'frente', ['portoes', 'trono'], [tortureWheel()]);
// Rios de Fogo
def('ab_caldeirao', 'Caldeirão de ferro', F, 'frente', ['rios'], [cauldron()], { luz: [{ x: 14, y: 4, r: 0.8 }, { x: 14, y: 25, r: 0.55 }], brilho: FIRE });
def('ab_bacia', 'Fonte de lava', F, 'frente', ['rios'], [lavaBasin()], { luz: [{ x: 17, y: 4, r: 0.6 }, { x: 17, y: 18, r: 0.8 }], brilho: FIRE });
def('ab_ponte', 'Ponte quebrada', W, 'fundo', ['rios'], [brokenBridge()]);
def('ab_cachoeira', 'Cachoeira de lava', W, 'fundo', ['rios'], [lavaFall()], { luz: [{ x: 10, y: 8, r: 0.6 }, { x: 10, y: 28, r: 0.6 }, { x: 10, y: 48, r: 0.8 }], brilho: FIRE, anim: { k: 'lava', x0: 8, x1: 13, y0: 9, y1: 46 } });
def('ab_espinhos', 'Espinhos gigantes', F, 'frente', ['rios', 'entranhas', 'trono'], [shardCluster(true), shardCluster(false)]);
def('ab_jaula', 'Jaula pendurada', C, 'frente', ['portoes', 'rios', 'entranhas', 'trono'], [cage(false), cage(true)]);
// As Entranhas
def('ab_costelas', 'Costelas gigantes', F, 'frente', ['entranhas'], [giantRibs()]);
def('ab_cranio', 'Crânio gigante', F, 'frente', ['entranhas'], [giantSkull()], { luz: [{ x: 12, y: 13, r: 0.3 }], brilho: FIRE });
def('ab_casulo', 'Casulo de carne', C, 'frente', ['entranhas'], [cocoon(0), cocoon(1)]);
def('ab_ovo', 'Ovo de demônio', F, 'frente', ['entranhas'], [demonEggs(false), demonEggs(true)], { luz: [{ x: 8, y: 12, r: 0.3 }], brilho: FIRE });
def('ab_coracao', 'Coração na parede', W, 'fundo', ['entranhas'], [heartWall()], { luz: [{ x: 15, y: 16, r: 0.55 }], brilho: BLOOD, anim: { k: 'coracao' } });
def('ab_olho', 'Olho na parede', W, 'fundo', ['entranhas'], [eyeWall()], { luz: [{ x: 13, y: 9, r: 0.3 }], brilho: '#ffb020', anim: { k: 'olho', x0: 4, x1: 23, cy: 9, ry: 4.8 } });
def('ab_boca', 'Boca na parede', W, 'fundo', ['entranhas'], [mouthWall()]);
def('ab_ganchos', 'Ganchos de açougue', C, 'frente', ['entranhas'], [meatHooks(0), meatHooks(1)]);
def('ab_pira', 'Pira de ossos', F, 'frente', ['entranhas', 'trono'], [bonePyre()], { luz: [{ x: 13, y: 10, r: 0.95 }], chamas: [{ x: 10, y: 8 }, { x: 16, y: 6 }], brilho: FIRE });
// Trono do Caos
{ const [a0, w0] = wicked(() => sacrificeAltar(0)), [a1] = wicked(() => sacrificeAltar(1));
  def('ab_altar', 'Altar de sacrifício', F, 'frente', ['trono'], [a0, a1], { luz: [{ x: 18, y: 16, r: 0.5 }, { x: w0[0].x, y: w0[0].y, r: 0.35 }], chamas: w0, brilho: RUNE }); }
{ const [cv, w] = wicked(pentagram); def('ab_pentagrama', 'Pentagrama', F, 'frente', ['trono'], [cv], { luz: [{ x: 22, y: 11, r: 0.85 }], chamas: w, brilho: RUNE }); }
def('ab_obelisco', 'Obelisco de runas', F, 'frente', ['trono'], [runeObelisk()], { luz: [{ x: 9, y: 22, r: 0.7 }], brilho: RUNE });
def('ab_cristal', 'Cristal do caos', F, 'frente', ['trono'], [chaosCrystal(0), chaosCrystal(1)], { luz: [{ x: 12, y: 16, r: 0.85 }], brilho: CHAOS });
{ const [cv, w] = wicked(profaneLectern); def('ab_pulpito', 'Livro profano', F, 'frente', ['trono'], [cv], { luz: [{ x: 9, y: 8, r: 0.45 }], chamas: w, brilho: CHAOS }); }
{ const [cv, w] = wicked(candleSkull); def('ab_velas', 'Caveira com velas', F, 'frente', ['trono', 'entranhas', 'portoes'], [cv], { luz: [{ x: 9, y: 3, r: 0.5 }], chamas: w, brilho: FIRE }); }

// what each band gets, per open stretch of floor or ceiling: [id, chance per 10 blocks, max per stretch]
Object.assign(AB_PROP_PLAN, {
  portoes: { chao: [['ab_estatua', 0.12, 1], ['ab_pilar', 0.1, 1], ['ab_braseiro', 0.2, 1], ['ab_correntes', 0.1, 1], ['ab_cavalete', 0.1, 1], ['ab_roda', 0.05, 1], ['ab_velas', 0.06, 1]], teto: [['ab_estandarte', 0.3, 2], ['ab_jaula', 0.1, 1]], fundo: [['ab_portao', 0.08, 1]] },
  rios: { chao: [['ab_caldeirao', 0.15, 1], ['ab_bacia', 0.1, 1], ['ab_espinhos', 0.12, 1], ['ab_braseiro', 0.08, 1], ['ab_correntes', 0.06, 1]], teto: [['ab_jaula', 0.12, 1]], fundo: [['ab_cachoeira', 0.1, 1], ['ab_ponte', 0.06, 1]] },
  entranhas: { chao: [['ab_costelas', 0.1, 1], ['ab_cranio', 0.08, 1], ['ab_ovo', 0.2, 1], ['ab_pira', 0.08, 1], ['ab_pilar', 0.05, 1], ['ab_espinhos', 0.05, 1], ['ab_velas', 0.04, 1]], teto: [['ab_casulo', 0.25, 2], ['ab_ganchos', 0.2, 1], ['ab_jaula', 0.08, 1]], fundo: [['ab_olho', 0.1, 1], ['ab_boca', 0.06, 1], ['ab_coracao', 0.05, 1]] },
  trono: { chao: [['ab_altar', 0.12, 1], ['ab_pentagrama', 0.1, 1], ['ab_obelisco', 0.1, 1], ['ab_cristal', 0.15, 1], ['ab_pulpito', 0.08, 1], ['ab_espinhos', 0.1, 1], ['ab_velas', 0.1, 1], ['ab_braseiro', 0.1, 1], ['ab_roda', 0.05, 1], ['ab_estatua', 0.06, 1], ['ab_pira', 0.05, 1]], teto: [['ab_estandarte', 0.2, 2], ['ab_jaula', 0.06, 1]], fundo: [['ab_portao', 0.03, 1]] }
});
}

/* ---------- placing them (108 calls this at the end of generation) ----------
   Same walk as 84's mnPlaceProps: every open stretch of floor or ceiling in a band gets its share of AB_PROP_PLAN.
   Props only stand on (or hang from) natural abyss soil: AB_SOILS from 108 when it exists, any solid block otherwise.
   Ladders, chains and the like in abKeep (108) and the boss hall are left alone. */
function abPlaceProps() {
  if (typeof AB_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0xab105);
  const S0 = AB_S0, YB = Math.min(WH - 8, S0 + AB_D), used = new Uint8Array(WW * WH * 2);
  const keep = typeof abKeep !== 'undefined' && abKeep ? abKeep : null, soils = typeof AB_SOILS !== 'undefined' ? AB_SOILS : null;
  const kept = i => keep !== null && keep.has(i);
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (x0 < 1 || x0 + tw >= WW - 1 || y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = y * WW + x, t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || kept(i)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[(y * WW + x) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && (!soils || soils[t]); };
  const boss = typeof abBoss !== 'undefined' ? abBoss : null;
  const inBoss = (x, y) => boss && Math.abs(wdx(x - boss.cx)) < boss.w / 2 + 2 && y >= boss.top - 2 && y <= boss.fy + 1;
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = AB_BAND_NAMES[clamp(abyssBand(y), 0, 3)], plan = AB_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inBoss(k, y) || kept(i)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 2.2 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (how === 'chao') {
              const y0 = y + 1 - th;
              if (!fits(px, y0, tw, th, 0, true)) continue;
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, th + 3, 0, true)) continue;
              mark(px, y, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!AB_BACK_FLOOR[id], y0 = onFloor ? y + 1 - th : y - th - ((R() * 2) | 0);
              if (!fits(px, y0, tw, th, 1, false)) continue;
              mark(px, y0, tw, th, 1); n--;
              const sup = []; if (onFloor) for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), onFloor ? (y + 1) * T - V.h : y0 * T + ((th * T - V.h) >> 1), sup);
            }
          }
        }
      }
    }
  }
}

/* ---------- the props that move: the lavafall runs, the heart beats, the eye blinks ---------- */
const abBeat = t => { const p = (t * 1.1) % 1; return Math.max(0, 1 - Math.abs(p - 0.05) * 9) + Math.max(0, 1 - Math.abs(p - 0.24) * 11) * 0.6; };   // lub-dub
let abHeartGlow = null;
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (const p of visProps) {
    const A = p.def.anim; if (!A || A.k !== 'coracao') continue;
    if (!abHeartGlow) abHeartGlow = glow(24, '#ff2a1a');
    lc.globalAlpha = 0.45 * abBeat(gameTime + p.X * 0.013); lc.drawImage(abHeartGlow, Math.round(p.X + p.sh + 15 - cx - 24), Math.round(p.Y + 16 - cy - 24));
  }
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (const p of visProps) {
    const A = p.def.anim; if (!A) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    if (A.k === 'lava') {   // bright gobs sliding down the stream
      const h = A.y1 - A.y0;
      for (let k = 0; k < 7; k++) {
        const x = A.x0 + 1 + ((k * 3) % (A.x1 - A.x0 - 1)), y = A.y0 + ((gameTime * 26 + k * h / 7 + p.X) % h), c = 10.5 + Math.sin(y * 0.18) * 0.7 - 10.5;
        lc.globalAlpha = 0.9; lc.fillStyle = k % 3 ? '#ffd070' : '#fff0a0'; lc.fillRect(X + Math.round(x + c), Y + Math.round(y), 1, 2 + (k & 1));
      }
      lc.globalAlpha = 1;
    } else if (A.k === 'olho') {   // a blink every few seconds
      const ph = (gameTime * 0.31 + p.X * 0.0071) % 1; if (ph > 0.035) continue;
      const shut = 1 - Math.abs(ph / 0.035 - 0.5) * 2;
      for (let x = A.x0; x <= A.x1; x++) { const dx = (x + 0.5 - (A.x0 + A.x1 + 1) / 2) / ((A.x1 - A.x0 + 1) / 2), half = Math.sqrt(Math.max(0, 1 - dx * dx)) * A.ry; const top = Math.round(A.cy - half), lid = Math.round(half * 2 * shut); lc.fillStyle = '#4a0f13'; lc.fillRect(X + x, Y + top, 1, lid); lc.fillStyle = '#92343e'; lc.fillRect(X + x, Y + top + lid, 1, lid > 0 ? 1 : 0); }
    }
  }
});
