'use strict';

/* ================= O Príncipe do Caos: the boss of the abyss =================
   He waits on the Trono do Caos, the hall 108-abismo-mundo digs at the bottom of the abyss across the world from the
   rifts (56 x 20): a throne of black iron and bone set with chaos crystals, braziers, chains. A tall horned demon
   with a sword that burns. Step in and grates of chaos close every way out (leaving the hall, by portal or by dying,
   resets the fight). Three phases, every blow shown before it lands:
     1. a wide sweep of the sword (the blade goes white-hot first), a dash across the floor with the blade dragging
        fire behind it (the flames stay a while), a fan of fire breath (he throws his head back, the mouth glows)
     2. under 60%: tears portals open and his imps and hounds come through; lava geysers burst from the floor
        (a glowing ring on the floor first)
     3. under 25%: spreads his wings and takes to the air: meteors rain on the hall (a shadow on the floor first),
        and he dives sword first at you (he hangs over you, the blade flares); after a dive he is stuck for a moment
   Drops the Coração do Caos (legendary accessory: your blows burn for more, kills heal you, a red light about you).
   His death is saved (`principe`).
   Plugs in like the Rei Goblin (85): buildCathedral (dressing fallback), spawnEnemy, endBossFight, hitEnemy,
   hurtPlayer, recalc, breakTile, propLights, makeSave, migrateSave and newWorld are wrapped; art and AI through
   DRAW_E/EYES_E/WARN_E/HOOK. 108 calls abDress() at the end of the build (it also puts the ladders up the walls);
   diggers ask abGuard() before breaking anything. Loads before 49 (BAL scaling). */

// level from the abyss's place in the layer list (129-camadas: 2n + 3, 15 as the 6th); life and damage were tuned at
// level 12 and follow the monsters' curve from there (life +30% a level, damage +20%)
const PR_L = layerBossLvl('abismo');
const PR = { hp: Math.round(1400 * (1 + 0.3 * (PR_L - 1)) / 4.3), dmg: Math.round(30 * (1 + 0.2 * (PR_L - 1)) / 3.2), xp: 420, lvl: PR_L, p2: 0.6, p3: 0.25 };
const prState = { dead: false };
const prFx = { gates: [], flames: [], balls: [], portals: [], geysers: [], meteors: [], arcs: [] };
let prBoss = null, prDressed = false, prBurnCD = 0;
ET.principecaos = { name: 'O Príncipe do Caos', w: 24, h: 62, hp: PR.hp, dmg: PR.dmg, xp: PR.xp, kb: 0, fly: false, blood: '#5a0a12', boss: true };
const PR_DROPS = [['coracao_caos', 1], ['pocao', 1, 2, 4], ['essencia_demoniaca', 1, 3, 6], ['chifre', 1, 2, 4], ['min_infernita', 1, 4, 8], ['lamina_infernal', 0.15], ['coracao_infernal', 0.35]];
DROPS.principecaos = PR_DROPS.filter(([id]) => ITEMS[id]);   // again at the fight, in case something loaded later
if (typeof CV_STEP !== 'undefined') CV_STEP.principecaos = 1;
const PR_FIRE = ['#3a0c02', '#6e1c04', '#a83a08', '#e06414', '#ff9a2a', '#ffd070', '#fff4c8'];
const PR_CHAOS = ['#2a0834', '#6c1a6e', '#c4489a', '#ee86c0'];
// damage of fire with no monster behind it (flames, balls, lava, meteors): marked for 101's resistances
function prBurn(dmg, x) { const has = typeof dmgCtx !== 'undefined', o = has ? dmgCtx : null; if (has) dmgCtx = 'fogo'; try { return hurtPlayer(Math.max(1, Math.round(dmg)), x, null, true); } finally { if (has) dmgCtx = o; } }

/* ---------- the hall ---------- */
function inAbHall(tx, ty, m = 0) { const B = abBoss; if (!B) return false; const dx = wdx(wrapX(tx) - B.cx); return Math.abs(dx) <= (B.w >> 1) - m && ty >= B.top - 1 && ty < B.fy; }
// the hall with its shell (floor, roof, walls): what nothing may break while he fights (diggers keep out of it always)
function abGuard(tx, ty) { const B = abBoss; if (!B) return false; return Math.abs(wdx(wrapX(tx) - B.cx)) <= (B.w >> 1) + 3 && ty >= B.top - 8 && ty <= B.fy + 2; }
function prDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
const PR_SHELL = t => SOLID[t] && t !== BEDROCK && t !== AB_BARREIRA && t !== AB_O_INFERNITA && t !== AB_O_CARVAO;
function abDress() {
  const B = abBoss; if (!B) return;
  prDressed = true;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), x0 = B.cx - (B.w >> 1), x1 = x0 + B.w - 1;
  for (let x = x0; x <= x1; x++) {
    tiles[I(x, B.fy)] = AB_TIJOLO; tiles[I(x, B.fy + 1)] = AB_CAOS;
    for (let y = B.top - 4; y < B.fy; y++) { const i = I(x, y), t = tiles[i]; if (t !== AIR && !SOLID[t]) tiles[i] = AIR; if (y >= B.top - 1) walls[i] = (x - x0) % 14 < 3 ? WAB_CAOS : WAB_TIJOLO; }
  }
  // a doorway at floor level on each side, cut through to the first open air (so the hall is entered from both ends)
  for (const d of [-1, 1]) {
    const wx = d < 0 ? x0 - 1 : x1 + 1;
    let open = false; for (let y = B.top; y < B.fy; y++) if (!SOLID[tiles[I(wx, y)]]) { open = true; break; }
    if (open) continue;
    for (let k = 0; k < 16; k++) {
      const x = wx + d * k; let air = 0;
      for (let y = B.fy - 4; y < B.fy; y++) { const i = I(x, y); if (!SOLID[tiles[i]]) air++; else if (tiles[i] !== BEDROCK) tiles[i] = AIR; }
      if (k > 1 && air >= 3) break;
      tiles[I(x, B.fy)] = SOLID[tiles[I(x, B.fy)]] ? tiles[I(x, B.fy)] : AB_TIJOLO;
    }
  }
  // hell brick round the walls and roof, chaos stone at the floor's edge
  for (let y = B.top - 4; y <= B.fy; y++) for (let x = x0 - 2; x <= x1 + 2; x++) {
    const i = I(x, y), t = tiles[i]; if (!PR_SHELL(t)) continue;
    if (tiles[I(x, y + 1)] === AIR || tiles[I(x, y - 1)] === AIR || tiles[I(x - 1, y)] === AIR || tiles[I(x + 1, y)] === AIR) tiles[i] = AB_TIJOLO;
  }
  // nothing of the generic dressing stays in it
  for (let k = PROPS.length - 1; k >= 0; k--) { const p = PROPS[k]; if ((p.def.abismo || p.def.mina) && inAbHall(Math.floor((p.X + p.w / 2) / T), Math.floor((p.Y + p.h / 2) / T), -2)) PROPS.splice(k, 1); }
  propBuckets.clear(); propBySup.clear(); const keep = PROPS.slice(); PROPS.length = 0; for (const p of keep) addProp(p.def, p.v, p.X, p.Y, p.sup);
  const put = (id, v, tx, how) => {
    const def = PROP_DEFS[id]; if (!def) return null; if (!def.vars[v]) v = 0; const V = def.vars[v], tw = Math.ceil(V.w / T), sup = [];
    const X = W1(tx) * T + ((tw * T - V.w) >> 1);
    if (how === 'teto') {
      let r = -1; for (let k = tx; k < tx + tw; k++) { let y = B.fy - 2; while (y > B.top - 12 && !SOLID[tiles[I(k, y)]]) y--; r = Math.max(r, y); }
      for (let k = tx; k < tx + tw; k++) if (SOLID[tiles[I(k, r)]]) sup.push(I(k, r));
      return sup.length ? addProp(def, v, X, (r + 1) * T, sup) : null;
    }
    for (let k = tx; k < tx + tw; k++) sup.push(I(k, B.fy));
    return addProp(def, v, X, B.fy * T - V.h, sup);
  };
  put('ab_trono', 0, B.cx - 2, 'chao');
  // 105's pieces when they exist: demon statues flanking the throne, great braziers at the ends, torn banners overhead
  put('ab_estatua', 0, B.cx - 12, 'chao'); put('ab_estatua', 1, B.cx + 9, 'chao');
  put('ab_braseiro', 0, x0 + 1, 'chao'); put('ab_braseiro', 0, x1 - 2, 'chao');
  for (const [tx, v] of [[x0 + 8, 0], [x0 + 19, 1], [x1 - 21, 0], [x1 - 10, 1]]) put('ab_estandarte', v, tx, 'teto');
  // one-block dressing: braziers along the floor, runes and crystals by the throne, skulls, chains from the roof
  const floor1 = (x, t) => { const i = I(x, B.fy - 1); if (tiles[i] === AIR && SOLID[tiles[I(x, B.fy)]]) tiles[i] = t; };
  for (const k of [11, B.w - 12]) floor1(x0 + k, AB_BRASEIRO);
  floor1(B.cx - 5, AB_RUNA); floor1(B.cx + 4, AB_RUNA); floor1(B.cx - 7, AB_CRISTAL); floor1(B.cx + 6, AB_CRISTAL);
  floor1(x0 + 7, AB_CRANIOS); floor1(x1 - 8, AB_CRANIOS); floor1(x0 + 16, AB_ESPINHOS); floor1(x1 - 17, AB_ESPINHOS);
  for (const [k, len] of [[6, 5], [9, 3], [17, 7], [22, 4], [B.w - 23, 4], [B.w - 18, 7], [B.w - 10, 3], [B.w - 7, 5]]) {
    const x = x0 + k; let r = B.fy - 2; while (r > B.top - 8 && !SOLID[tiles[I(x, r)]]) r--;
    for (let y = r + 1; y <= r + len && y < B.fy - 6; y++) if (tiles[I(x, y)] === AIR) tiles[I(x, y)] = AB_CORRENTE;
  }
}
// where a tunnel opens high in the hall's side wall, a black-iron ladder up to it
function abWallLadders() {
  const B = abBoss; if (!B) return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), x0 = B.cx - (B.w >> 1), x1 = x0 + B.w - 1;
  for (const [wx, lx] of [[x0 - 1, x0], [x1 + 1, x1]]) {
    for (let y = B.fy - 5; y > B.top - 2; y--) {
      if (SOLID[tiles[I(wx, y)]] || !SOLID[tiles[I(wx, y + 1)]]) continue;   // the floor of an opening in the wall
      for (let k = y; k < B.fy; k++) if (!SOLID[tiles[I(lx, k)]]) tiles[I(lx, k)] = AB_ESCADA;
      break;
    }
  }
  // and a way up out of the roof, where one opens over the hall
  for (let x = x0 + 1; x < x1; x++) {
    if (SOLID[tiles[I(x, B.top - 2)]] || SOLID[tiles[I(x, B.top - 3)]]) continue;
    let r = B.top - 1; while (r < B.fy && !SOLID[tiles[I(x, r)]]) r++;
    if (r !== B.fy) continue;
    for (let y = B.top - 3; y < B.fy; y++) if (!SOLID[tiles[I(x, y)]]) tiles[I(x, y)] = AB_ESCADA;
    break;
  }
}
const abDressAll = () => { abDress(); abWallLadders(); };
// 108 calls abDress at the end of the build; if it didn't, dress the hall here
{ const _bc = buildCathedral; buildCathedral = function () { _bc(); if (typeof ABISMO !== 'undefined' && ABISMO && abBoss && !prDressed) { try { abDressAll(); } catch (err) { console.error(err); } } }; }
{ const _ad = abDress; abDress = function () { _ad(); try { abWallLadders(); } catch (err) { console.error(err); } }; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type !== 'principecaos' && abBoss && inAbHall(Math.floor((px + e.w / 2) / T), Math.floor((py + e.h / 2) / T), -2) && !(bossFight && bossFight.pr)) prDrop(e);
  return e;
}; }
// nothing breaks the hall while he fights in it
{ const _bt = breakTile; breakTile = function (tx, ty) { if (bossFight && bossFight.pr && abGuard(tx, ty)) return; return _bt(tx, ty); }; }

/* ---------- the heart ---------- */
STAT_DEF.lgInferno = { t: 'Seus golpes causam +X% de dano de fogo', pct: 1 };
STAT_DEF.lgCaos = { t: 'Uma luz vermelha te acompanha', flag: 1 };
STAT_KEYS.push('lgInferno', 'lgCaos');
ICON_ART.caosHeart = [["..k...k..", ".kRk.kRk.", "kRWRkRrRk", "kRRrRrcRk", "kRrRcRrRk", ".kRrcrRk.", "..kRrRk..", "...kRk...", "....k...."], { k: '#2a0834', R: '#a01a2a', r: '#ff5a3a', W: '#fff0c8', c: '#c4489a' }];
ITEMS.coracao_caos = {
  name: 'Coração do Caos', slot: 'acc', rar: 4, hp: 20, icon: 'caosHeart',
  legend: [['lgInferno', 0.25], ['onKill', 10], ['light', 3], ['lgCaos', 1]],
  desc: 'O coração do Príncipe, arrancado ainda em brasa. Bate fora do peito e acende o que você toca.'
};
if (typeof BASE_INFO !== 'undefined') BASE_INFO.coracao_caos = [10];
if (typeof ITEM_G !== 'undefined') ITEM_G.coracao_caos = 0;
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let f = 0, c = 0;
  for (const k of EQ_SLOTS) if (equip[k]) { const st = itemStats(equip[k]); f += st.lgInferno || 0; c += st.lgCaos || 0; }
  if (pl.lg) { pl.lg.inferno = f; pl.lg.caos = c > 0; }
  return r;
}; }
// fire on every blow that lands: a share of it again, in flames
function prInfernoHit(e, hp0) {
  if (!pl.lg || !pl.lg.inferno || e.dead || e.hp >= hp0) return;
  const d = Math.max(1, Math.round((hp0 - e.hp) * pl.lg.inferno)); e.hp -= d;
  burst(e.x + e.w / 2, e.y + e.h / 2, 6, Math.random() < 0.5 ? '#ff9a2a' : '#ffd070', 60, -60, 0.4, 1, true);
  floatText(e.x + e.w / 2 + 6, e.y - 10, String(d), '#ff8a2a', 0.85);
  if (e.hp <= 0) killEnemy(e);
}
// the red light about you (the light stat lifts the dark; this tints it)
HOOK.drawGlow.push((cx, cy) => {
  if (!pl.lg || !pl.lg.caos || pl.dead) return;
  lc.globalAlpha = 0.32 + Math.sin(gameTime * 3.1) * 0.05; lc.drawImage(PRA.GL.red, Math.round(pl.x + pl.w / 2) - cx - 40, Math.round(pl.y + pl.h / 2) - cy - 40);
});

/* ---------- art ---------- */
const PRA = {};
{
const { cg } = CVART;
const cn = (x, y, cell, s) => { const L = Math.round(TP / cell); return pn(x, y, L, L, s) - 0.5; };   // smooth noise, cells of about `cell` px
const R7 = hexes => hexes.map(h => ph(h));
const RP = {
  pele: R7(['#12050a', '#260a10', '#421016', '#621a1c', '#862a24', '#aa4232', '#cc6648']),
  ferro: R7(['#050507', '#0c0c10', '#16161c', '#22222a', '#32323c', '#484852', '#68687a']),
  osso: R7(['#140e0a', '#281d14', '#43331f', '#64502f', '#8a7046', '#b29866', '#dccb98']),
  fogo: R7(PR_FIRE),
  caos: R7(['#14041a', '#2a0834', '#481052', '#6c1a6e', '#962a82', '#c4489a', '#ee86c0']),
  asa: R7(['#090306', '#14060b', '#220a11', '#330f19', '#481622', '#5e202c', '#7a2e38']),
  pano: R7(['#100308', '#22060e', '#380a14', '#52101a', '#701a20', '#90282a', '#ac3c34'])
};
const OUT = ph('#050203');
/* the painter: like 81's (each ramp's darkest tone rims what it paints), plus tubes, curves and polygons */
function pp(w, h, ox = 0) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c,
    put(x, y, R, v) { x = (x + ox) | 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = R[v < 0 ? 0 : v > 6 ? 6 : v | 0]; rid[y * w + x] = idOf(R); },
    has(x, y) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0; },
    blob(cx, cy, rx, ry, R, s, base = 3.4, f) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; const e = f ? f(x, y, dx, dy) : 0; if (e === null) continue; P.put(x, y, R, base + 1.3 - (dx * 0.8 + dy) * 1.4 - d * 0.7 + cg(x, y, s) * 0.5 + e); } },
    // a tapered capsule a -> b, shaded as a round limb lit from the top left
    tube(ax, ay, bx, by, r0, r1, R, s, base = 3.2, f) {
      const x0 = Math.floor(Math.min(ax, bx) - Math.max(r0, r1) - 1), x1 = Math.ceil(Math.max(ax, bx) + Math.max(r0, r1) + 1), y0 = Math.floor(Math.min(ay, by) - Math.max(r0, r1) - 1), y1 = Math.ceil(Math.max(ay, by) + Math.max(r0, r1) + 1);
      const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5, t = clamp(((px - ax) * vx + (py - ay) * vy) / L2, 0, 1), qx = ax + vx * t, qy = ay + vy * t, r = r0 + (r1 - r0) * t;
        const nx = (px - qx) / r, ny = (py - qy) / r, d = nx * nx + ny * ny; if (d > 1) continue;
        const e = f ? f(x, y, t, nx, ny) : 0; if (e === null) continue;
        P.put(x, y, R, base + 0.9 - (nx * 0.8 + ny) * 1.5 - d * 0.8 + cg(x, y, s) * 0.5 + e);
      }
    },
    // a curved tapered horn / bone along a quadratic curve
    curve(ax, ay, kx, ky, bx, by, r0, r1, R, s, vf) {
      const n = Math.ceil(Math.hypot(kx - ax, ky - ay) + Math.hypot(bx - kx, by - ky)) * 2;
      let px = ax, py = ay;
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t, x = u * u * ax + 2 * u * t * kx + t * t * bx, y = u * u * ay + 2 * u * t * ky + t * t * by, tp = (i - 1) / n;
        P.tube(px, py, x, y, r0 + (r1 - r0) * tp, r0 + (r1 - r0) * t, R, s, vf(tp));
        px = x; py = y;
      }
    },
    // a filled polygon, each pixel shaded by fn(x, y)
    poly(pts, R, fn) {
      let y0 = 1e9, y1 = -1e9; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc) !== (by <= yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) { const v = fn(x, y); if (v !== null) P.put(x, y, R, v); }
      }
    },
    // glowing cracks through everything painted in ramp R: thin ridges of a smooth noise turned to fire
    veins(R, F, sd, cell, thr) { const id = ramps.indexOf(R); if (id < 0) return; const L = Math.round(TP / cell); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = y * w + x; if (rid[k] !== id) continue; const n = Math.abs(pn(x + sd, y, L, L, sd) - 0.5); if (n < thr) { c[k] = F[n < thr * 0.4 ? 5 : 4]; rid[k] = idOf(F); } else if (n < thr * 1.8) c[k] = R[Math.min(6, R.indexOf(c[k]) + 1)] || c[k]; } },
    line(x0, y0, x1, y1, R, v) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) P.put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, R, typeof v === 'function' ? v(i / n) : v); },
    done() {
      const src = c.slice(), sr = rid.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const k = y * w + x; if (src[k]) continue;
        let n = -1; if (x > 0 && src[k - 1]) n = k - 1; else if (x < w - 1 && src[k + 1]) n = k + 1; else if (y > 0 && src[k - w]) n = k - w; else if (y < h - 1 && src[k + w]) n = k + w;
        if (n < 0) continue; const r = sr[n]; c[k] = r >= 0 ? ramps[r][0] : OUT;
      }
      const cv = mk(w, h), x = cv.getContext('2d'), img = x.createImageData(w, h); new Uint32Array(img.data.buffer).set(c); x.putImageData(img, 0, 0); return cv;
    }
  };
  return P;
}
const set = cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
const PW = 140, PH = 88, GY = 87, OX = 18;   // the frame: poses are laid out with the body at x 60 and moved OX right (room for the wings); hooves on row 87

/* ---- the poses: joints facing right ---- */
// legs: [hip, knee, hock, toe] near and far; arms: [shoulder, elbow, hand]; sword: hilt and tip; head: centre and tilt;
// wings: folded | up | mid | down | back | open
function poseOf(k) {
  const P = {
    lean: 0, crouch: 0, bob: 0,
    legN: [[63, 54], [68, 65], [63, 76], [68, GY - 1]], legF: [[56, 54], [59, 65], [53, 76], [57, GY - 1]],
    armN: [[69, 32], [73, 42], [77, 48]], armF: [[51, 32], [48, 42], [50, 50]], handF: 'claw',
    sword: [[77, 48], [104, 70]], hot: 0, head: [65, 20], tilt: 0, mouth: 0, wings: 'folded'
  };
  const walk = (s) => { P.legN = [[63, 54], [68 + s * 3, 65], [63 + s * 4, 76], [68 + s * 5, GY - 1 - (s < 0 ? 2 : 0)]]; P.legF = [[56, 54], [59 - s * 3, 65], [53 - s * 4, 76], [57 - s * 5, GY - 1 - (s > 0 ? 2 : 0)]]; P.bob = -1; P.armF = [[51, 32], [48 + s * 2, 42], [50 + s * 3, 50]]; };
  switch (k) {
    case 1: walk(1); break;
    case 2: walk(-1); break;
    case 3:   // the sweep wound up: sword over the shoulder, behind him, white-hot
      P.armN = [[68, 31], [66, 20], [59, 15]]; P.sword = [[59, 15], [26, 8]]; P.hot = 1; P.lean = -2; P.tilt = -0.15;
      P.legN = [[63, 54], [70, 64], [66, 75], [72, GY - 1]]; P.legF = [[56, 54], [55, 65], [48, 75], [50, GY - 1]];
      P.armF = [[51, 32], [56, 40], [62, 44]]; break;
    case 4:   // the sweep: arm thrown out, the blade level and far forward
      P.armN = [[70, 33], [79, 38], [88, 40]]; P.sword = [[88, 40], [118, 44]]; P.lean = 4; P.hot = 0.6;
      P.legN = [[63, 54], [72, 63], [70, 75], [76, GY - 1]]; P.legF = [[56, 54], [53, 65], [45, 75], [46, GY - 1]];
      P.armF = [[51, 33], [46, 38], [42, 36]]; break;
    case 5:   // the dash: low and forward, the blade dragging behind on the floor
      P.lean = 6; P.crouch = 4; P.armN = [[69, 35], [62, 46], [54, 54]]; P.sword = [[54, 54], [20, GY - 1]]; P.hot = 0.5;
      P.legN = [[63, 58], [73, 66], [70, 77], [77, GY - 1]]; P.legF = [[56, 58], [50, 68], [41, 75], [40, GY - 1]];
      P.armF = [[52, 35], [58, 44], [66, 46]]; break;
    case 6:   // the breath drawn in: head thrown back, the chest full
      P.head = [62, 20]; P.tilt = -0.45; P.mouth = 1; P.lean = -2; P.armN = [[69, 32], [74, 41], [77, 48]]; P.sword = [[77, 48], [96, 76]]; P.armF = [[51, 32], [44, 38], [40, 34]]; break;
    case 7:   // the breath: head thrust forward, the jaws wide
      P.head = [67, 23]; P.tilt = 0.25; P.mouth = 2; P.lean = 3; P.sword = [[77, 49], [100, 74]]; P.armF = [[51, 33], [46, 40], [44, 46]]; break;
    case 8:   // the call: sword raised high, the free hand clawing the air
      P.armN = [[69, 31], [75, 22], [78, 14]]; P.sword = [[78, 14], [96, 0]]; P.hot = 0.7; P.armF = [[51, 31], [43, 24], [38, 17]]; P.handF = 'open'; P.tilt = -0.2; P.mouth = 2;
      P.legN = [[63, 54], [70, 64], [66, 75], [72, GY - 1]]; P.legF = [[56, 54], [55, 65], [48, 75], [50, GY - 1]]; P.wings = 'open'; break;
    case 9: case 10: case 11:   // flying: legs hanging back, wings beating
      P.wings = ['up', 'mid', 'down'][k - 9]; P.bob = k === 9 ? 1 : k === 11 ? -1 : 0;
      P.legN = [[63, 54], [69, 62], [64, 70], [67, 80]]; P.legF = [[56, 54], [60, 63], [54, 70], [56, 79]];
      P.armN = [[69, 32], [75, 40], [81, 44]]; P.sword = [[81, 44], [110, 52]]; break;
    case 12:   // the dive: both fists on the hilt, the blade straight down, wings swept back
      P.wings = 'back'; P.armN = [[69, 32], [70, 41], [64, 48]]; P.armF = [[51, 32], [55, 42], [62, 47]]; P.handF = 'grip'; P.sword = [[63, 48], [66, GY]]; P.hot = 1;
      P.legN = [[63, 54], [72, 58], [70, 66], [76, 70]]; P.legF = [[56, 54], [64, 58], [60, 66], [66, 70]]; break;
    case 13:   // landed: down on one knee, the sword driven into the floor
      P.crouch = 9; P.lean = 3; P.armN = [[70, 40], [76, 48], [80, 54]]; P.sword = [[80, 54], [82, GY + 6]]; P.armF = [[52, 40], [57, 49], [64, 56]];
      P.legN = [[63, 63], [74, 66], [72, 76], [79, GY - 1]]; P.legF = [[56, 63], [52, 75], [43, GY - 2], [38, GY - 1]]; break;
  }
  return P;
}
/* the prince, 140 x 88 facing right */
function prince(k) {
  const P = pp(PW, PH, OX), s = 9601 + k * 7, Q = poseOf(k), lean = Q.lean, cr = Q.crouch, bob = Q.bob;
  // the torso and everything on it moves with the lean (more at the top) and the crouch
  const tx = (x, y) => x + lean * clamp((60 - y) / 30, 0, 1.2), ty = y => y + cr + bob;
  const T2 = ([x, y]) => [tx(x, y), ty(y)];
  const head = [tx(Q.head[0], Q.head[1]), ty(Q.head[1])], shN = T2(Q.armN[0]), shF = T2(Q.armF[0]);
  const dark = -0.9;

  /* ---- wings ---- */
  const wing = (mode, dx, dy, far) => {
    const v0 = far ? -1.1 : 0, root = [tx(54, 30) + dx, ty(30) + dy];
    let wrist, tips, elbow;
    if (mode === 'folded') {   // folded along the back: a bony arm over the shoulder, the membrane hanging like a cloak
      elbow = [root[0] - 7, root[1] - 3]; wrist = [root[0] - 5, root[1] - 10];
      P.poly([wrist, [root[0] - 10, root[1] - 6], [root[0] - 15, root[1] + 14], [root[0] - 13, root[1] + 30], [root[0] - 8, root[1] + 38], [root[0] - 3, root[1] + 28], [root[0] + 2, root[1] + 8]], RP.asa, (x, y) => 2.4 + v0 - (y - root[1]) * 0.03 + Math.sin((x - root[0]) * 0.9) * 0.6 + cg(x, y, s + 1) * 0.6 + (((x - root[0] + 30) % 4) === 0 ? -0.8 : 0));
      for (let j = 0; j < 3; j++) P.line(wrist[0] - 1 - j, wrist[1] + 2, root[0] - 12 + j * 3, root[1] + 26 + j * 4, RP.asa, 4.6 + v0);
      P.tube(root[0], root[1], elbow[0], elbow[1], 2.2, 1.8, RP.asa, s + 2, 4.4 + v0);
      P.tube(elbow[0], elbow[1], wrist[0], wrist[1], 1.8, 1.4, RP.asa, s + 3, 4.8 + v0);
      P.curve(wrist[0], wrist[1], wrist[0] - 1, wrist[1] - 4, wrist[0] - 4, wrist[1] - 6, 1.2, 0.5, RP.osso, s + 4, t => 2.6 + v0 + t * 2);   // the thumb claw
      return;
    }
    const W = {
      up: { e: [-8, -12], w: [-14, -26], t: [[-50, -29], [-46, -14], [-40, 2], [-28, 14]] },
      mid: { e: [-12, -6], w: [-26, -10], t: [[-58, -22], [-56, -2], [-48, 14], [-32, 22]] },
      down: { e: [-12, 2], w: [-24, 10], t: [[-50, 28], [-42, 40], [-32, 46], [-18, 40]] },
      back: { e: [-10, -10], w: [-16, -24], t: [[-34, -28], [-30, -16], [-26, -4], [-18, 8]] },
      open: { e: [-10, -10], w: [-20, -24], t: [[-54, -26], [-52, -8], [-44, 8], [-30, 18]] }
    }[mode];
    const sc = far ? 0.86 : 1; elbow = [root[0] + W.e[0] * sc, root[1] + W.e[1] * sc]; wrist = [root[0] + W.w[0] * sc, root[1] + W.w[1] * sc]; tips = W.t.map(([a, b]) => [root[0] + a * sc, root[1] + b * sc]);
    const back = [root[0] - 2, root[1] + 20];
    // the membrane: between the fingers, scalloped toward the wrist
    const pts = [root, elbow, wrist];
    for (let i = 0; i < tips.length; i++) {
      pts.push(tips[i]);
      const nx = i + 1 < tips.length ? tips[i + 1] : back, mx = (tips[i][0] + nx[0]) / 2, my = (tips[i][1] + nx[1]) / 2;
      pts.push([mx + (wrist[0] - mx) * 0.22, my + (wrist[1] - my) * 0.22]);
    }
    pts.push(back);
    P.poly(pts, RP.asa, (x, y) => { const d = Math.hypot(x - wrist[0], y - wrist[1]); return 3.7 + v0 - d * 0.035 + cn(x, y, 7, s + 5) * 1.4 + cg(x, y, s + 6) * 0.6 + (hash2(x >> 1, y >> 1, s + 7) < 0.03 ? -1.5 : 0); });
    // veins over the membrane, the arm and finger bones
    for (const t of tips) P.line(wrist[0], wrist[1], t[0], t[1], RP.asa, 1.4 + v0);
    P.tube(root[0], root[1], elbow[0], elbow[1], 2.4, 2, RP.osso, s + 8, 3 + v0);
    P.tube(elbow[0], elbow[1], wrist[0], wrist[1], 2, 1.5, RP.osso, s + 9, 3.3 + v0);
    tips.forEach((t, i) => P.tube(wrist[0], wrist[1], t[0], t[1], 1.2, 0.6, RP.osso, s + 10 + i, 3 + v0 - i * 0.2));
    P.blob(wrist[0], wrist[1], 1.8, 1.8, RP.osso, s + 15, 3.6 + v0);
    P.curve(wrist[0], wrist[1], wrist[0] + 2, wrist[1] - 4, wrist[0] + 5, wrist[1] - 5, 1.2, 0.5, RP.osso, s + 16, t => 4.4 + v0 + t);
  };
  wing(Q.wings, Q.wings === 'folded' ? 5 : 12, Q.wings === 'folded' ? -2 : -7, true);

  /* ---- the tail: from under the belt, curling down behind, a barbed tip ---- */
  {
    const a = [tx(55, 52), ty(52)], k1 = [a[0] - 16, a[1] + 4], b = [a[0] - 20 - lean, ty(70)];
    P.curve(a[0], a[1], k1[0], k1[1], b[0], b[1], 2.4, 1, RP.pele, s + 20, t => 2.4 - t * 0.6);
    P.poly([[b[0] + 1, b[1] - 1], [b[0] - 5, b[1] + 1], [b[0] - 2, b[1] + 6], [b[0] - 1, b[1] + 3]], RP.osso, (x, y) => 3.6 - (y - b[1]) * 0.25 + cg(x, y, s) * 0.5);
  }
  wing(Q.wings, 0, 0, false);

  /* ---- limbs ---- */
  const leg = (L, v0, sd) => {
    const [h, kn, hk, to] = L.map(([x, y]) => [x, y + (y < 70 ? 0 : 0)]);
    P.tube(h[0], h[1], kn[0], kn[1], 5, 3.6, RP.pele, sd, 3.2 + v0, (x, y, t, nx) => (Math.abs(nx + 0.2) < 0.12 && t > 0.2 ? -0.7 : 0));   // thigh, a muscle line
    P.tube(kn[0], kn[1], hk[0], hk[1], 3.6, 2.6, RP.ferro, sd + 1, 3.2 + v0, (x, y, t) => ((t * 10 | 0) % 3 === 0 ? 0.7 : 0));        // the greave: banded black iron
    P.blob(kn[0] + 0.5, kn[1], 3.4, 3, RP.ferro, sd + 2, 3.8 + v0);                                                                      // the knee cop
    P.curve(kn[0] + 1, kn[1] - 1, kn[0] + 5, kn[1] - 1, kn[0] + 6, kn[1] - 5, 1.4, 0.4, RP.osso, sd + 3, t => 3.6 + v0 + t * 1.6);        // a spike off it
    P.tube(hk[0], hk[1], to[0] - 1, to[1] - 2, 2.6, 2.2, RP.pele, sd + 4, 2.8 + v0);
    P.poly([[to[0] - 5, to[1] - 3], [to[0] + 2, to[1] - 4], [to[0] + 4, to[1] + 1], [to[0] - 5, to[1] + 1]], RP.osso, (x, y) => 2.2 + v0 - (y - to[1]) * 0.3 + (x - to[0]) * -0.1 + cg(x, y, sd) * 0.5);   // the cloven hoof
    P.put(to[0] - 1, to[1], RP.osso, 0.4); P.put(to[0] - 1, to[1] - 1, RP.osso, 0.6);
  };
  const arm = (A, v0, sd, hand, far) => {
    const [sh, el, hd] = A.map(T2);
    P.tube(sh[0], sh[1], el[0], el[1], 3.8, 3.2, RP.pele, sd, 3.3 + v0, (x, y, t, nx, ny) => (Math.abs(ny - 0.1) < 0.1 && t > 0.3 && t < 0.8 ? -0.6 : 0));
    P.tube(el[0], el[1], hd[0], hd[1], 3.4, 2.6, RP.ferro, sd + 1, 3 + v0, (x, y, t) => (t > 0.15 && ((t * 12) | 0) % 4 === 0 ? 0.9 : 0));   // the vambrace
    P.blob(el[0], el[1], 2.8, 2.6, RP.pele, sd + 2, 3 + v0);
    const ux = (hd[0] - el[0]) / (Math.hypot(hd[0] - el[0], hd[1] - el[1]) || 1), uy = (hd[1] - el[1]) / (Math.hypot(hd[0] - el[0], hd[1] - el[1]) || 1);
    for (let j = 0; j < 3; j++) { const bx = el[0] + ux * (3 + j * 2.4), by = el[1] + uy * (3 + j * 2.4); P.put(bx - uy * 2.6, by + ux * 2.6, RP.osso, 4 + v0); }   // spikes on the vambrace
    if (hand === 'claw' || hand === 'open') {
      P.blob(hd[0], hd[1], 2.6, 2.4, RP.pele, sd + 3, 3 + v0);
      const sp = hand === 'open' ? 1 : 0.5;
      for (let j = -1; j <= 1; j++) { const a = Math.atan2(uy, ux) + j * sp * 0.7; P.curve(hd[0] + Math.cos(a) * 2, hd[1] + Math.sin(a) * 2, hd[0] + Math.cos(a) * 4.5, hd[1] + Math.sin(a) * 4.5, hd[0] + Math.cos(a + 0.6) * 6, hd[1] + Math.sin(a + 0.6) * 6, 0.9, 0.4, RP.osso, sd + 4 + j, t => 3.6 + v0 + t * 1.5); }
    } else P.blob(hd[0], hd[1], 2.8, 2.6, RP.pele, sd + 3, 3.2 + v0);   // a fist (on a hilt)
  };
  arm(Q.armF, dark, s + 30, Q.handF, true);
  // the far pauldron peeking past the chest
  P.blob(shF[0], shF[1] - 1, 5, 4, RP.ferro, s + 34, 2.8);
  leg(Q.legF, dark - 0.2, s + 40);

  /* ---- the loincloth: torn red cloth hanging from the belt ---- */
  {
    const bx = tx(59, 50), by = ty(50);
    P.poly([[bx - 4, by], [bx + 6, by], [bx + 8 + lean * 0.3, by + 15], [bx + 4, by + 13], [bx + 2, by + 17], [bx - 1, by + 12], [bx - 4, by + 15]], RP.pano, (x, y) => 3.4 - (y - by) * 0.08 + Math.sin(x * 1.3) * 0.5 + cg(x, y, s + 50) * 0.6 - (x > bx + 3 ? 0.6 : 0));
  }
  leg(Q.legN, 0, s + 60);

  /* ---- the torso ---- */
  {
    const w0 = [tx(59, 50), ty(50)], ch = [tx(60, 37), ty(37)];
    P.tube(w0[0], w0[1], ch[0], ch[1] + 2, 7, 9, RP.pele, s + 70, 3, (x, y, t, nx, ny) => {
      // the belly ridged, a line down the middle
      const ab = t < 0.55 && Math.abs(nx - 0.15) < 0.08 ? -1.1 : t < 0.55 && ((((y - w0[1]) + 40) % 4) === 0) && Math.abs(nx) < 0.5 ? -0.7 : 0;
      return ab;
    });
    // the chest under a black-iron breastplate split by a glowing chaos seam
    P.blob(ch[0] + 1, ch[1] - 1, 10.5, 8, RP.ferro, s + 71, 3.2, (x, y, dx, dy) => (Math.abs(dy - 0.05) < 0.09 && dx > -0.6 ? 1.6 : 0) + (dy > 0.6 ? -1 : 0) + (Math.abs(dx - 0.05) < 0.07 ? -1.4 : 0));
    for (let j = -2; j <= 2; j++) P.put(ch[0] + 1 + j * 4, ch[1] + 5, RP.fogo, 4.6 - Math.abs(j) * 0.4);   // ember rivets along the lower edge
    // the chaos crystal set in the breastplate
    P.poly([[ch[0] + 2, ch[1] - 6], [ch[0] + 5, ch[1] - 2], [ch[0] + 2, ch[1] + 3], [ch[0] - 1, ch[1] - 2]], RP.caos, (x, y) => 4.6 - (x - ch[0] - 2) * 0.35 - (y - ch[1] + 2) * 0.3 + cg(x, y, s + 72) * 0.6);
    P.put(ch[0] + 1, ch[1] - 3, RP.caos, 6.4); P.put(ch[0] + 2, ch[1] - 4, RP.caos, 6.4);
    // the belt with a skull buckle
    for (let x = Math.round(w0[0] - 8); x <= w0[0] + 8; x++) for (let y = Math.round(w0[1] - 2); y <= w0[1]; y++) P.put(x, y, RP.ferro, 3 + (y === Math.round(w0[1] - 2) ? 1.2 : 0) + cg(x, y, s + 73) * 0.5);
    P.blob(w0[0] + 3, w0[1] - 1, 2.6, 2.4, RP.osso, s + 74, 4); P.put(w0[0] + 2, w0[1] - 1, RP.fogo, 5.4); P.put(w0[0] + 4, w0[1] - 1, RP.fogo, 5.4); P.put(w0[0] + 3, w0[1] + 1, RP.osso, 1);
    // tassets: iron plates down over the hip
    P.poly([[w0[0] + 1, w0[1] + 1], [w0[0] + 8, w0[1] + 1], [w0[0] + 9, w0[1] + 8], [w0[0] + 3, w0[1] + 9]], RP.ferro, (x, y) => 3.6 - (y - w0[1]) * 0.12 - (x - w0[0]) * 0.06 + ((y - w0[1]) % 3 === 0 ? -1 : 0) + cg(x, y, s + 75) * 0.5);
  }

  /* ---- the head: great horns, a long jaw, a crown of chaos crystals, eyes of fire ---- */
  const drawHead = () => {
    const [hx, hy] = head, a = Q.tilt, ca = Math.cos(a), sa = Math.sin(a);
    const R = (x, y) => [hx + x * ca - y * sa, hy + x * sa + y * ca];   // head-local -> frame (tilted about the centre)
    // the neck, thick, with a collar of iron spikes
    const nb = [tx(61, 31), ty(31)]; P.tube(nb[0], nb[1], hx - 1, hy + 2, 5, 4, RP.pele, s + 80, 2.6);
    // a horn: back from the brow, round and up, the tip hooking forward; dark at the root, bone-pale at the tip, ridged
    const horn = (bx, by, far) => {
      const v = far ? -1.1 : 0, rd = far ? 0.85 : 1;
      const p0 = R(bx, by), p1 = R(bx - 8, by - 1), p2 = R(bx - 13, by - 7), p3 = R(bx - 14.5, by - 15), p4 = R(bx - 10, by - 19.5);
      P.curve(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], 3 * rd, 2.1 * rd, RP.osso, s + (far ? 81 : 82), t => 3.3 + v + t * 1.2 - (((t * 8) | 0) % 2 ? 0.8 : 0));
      P.curve(p2[0], p2[1], p3[0], p3[1], p4[0], p4[1], 2.1 * rd, 0.5, RP.osso, s + (far ? 83 : 84), t => 4.3 + v + t * 2.2 - (((t * 7) | 0) % 2 ? 0.6 : 0));
    };
    horn(2.4, -4.6, true);
    // a pointed ear laid back
    { const e0 = R(-3, 0), e1 = R(-9, -3.6); P.tube(e0[0], e0[1], e1[0], e1[1], 1.8, 0.5, RP.pele, s + 85, 2.4); }
    const sk = R(0, 0); P.blob(sk[0], sk[1], 5.6, 5.4, RP.pele, s + 86, 3.4);
    // the long muzzle and the jaw (open for the breath)
    const jopen = Q.mouth === 2 ? 2.6 : Q.mouth === 1 ? 1.2 : 0;
    const up = R(5.2, 1.6); P.blob(up[0], up[1], 4.6, 2.6, RP.pele, s + 87, 3.4);
    const nose = R(9.4, 1); P.blob(nose[0], nose[1], 1.4, 1.4, RP.pele, s + 88, 3.6);
    if (jopen) for (let i = 0; i < 8; i++) for (let j = 0; j <= Math.ceil(jopen); j++) { const [x, y] = R(1.6 + i, 3.6 + j); P.put(x, y, RP.fogo, Q.mouth === 2 ? 5.8 - i * 0.25 - j * 0.3 : 3.6 - i * 0.2); }   // a fire inside
    const lo = R(4.2, 4.6 + jopen); P.blob(lo[0], lo[1], 4.4, 1.7, RP.pele, s + 89, 2.4);
    for (const fx of [3, 5.4, 7.6]) { const [x, y] = R(fx, 3.6); P.put(x, y, RP.osso, 5.6); const [x1, y1] = R(fx, 4.4); P.put(x1, y1, RP.osso, 4.4); }   // fangs down
    for (const fx of [4.2, 6.6]) { const [x, y] = R(fx, 3.6 + jopen); P.put(x, y, RP.osso, 5); }   // and up
    // the brow: a heavy ridge over a burning eye
    const b0 = R(0.6, -2.6), b1 = R(6.4, -1.2); P.tube(b0[0], b0[1], b1[0], b1[1], 1.5, 1.1, RP.pele, s + 90, 4.4);
    const ey = R(4.2, -0.4); P.put(ey[0], ey[1], RP.fogo, 6.6); P.put(ey[0] - 1, ey[1], RP.fogo, 5.2); P.put(ey[0] + 1, ey[1], RP.fogo, 4.4);
    // cheek spikes and a beard of bone barbs under the jaw
    for (let i = 0; i < 3; i++) { const [x, y] = R(-1 + i * 1.6, 5 + jopen * 0.6); const [x2, y2] = R(-2 + i * 1.6, 7.4 + jopen * 0.6 + (i === 1 ? 1 : 0)); P.line(x, y, x2, y2, RP.osso, 3.4 - i * 0.3); }
    // the near horn over it all
    horn(-0.6, -3.8, false);
    // the crown: chaos crystals in a black-iron band
    for (let i = -3; i <= 3; i++) { const [x, y] = R(i, -5); P.put(x, y, RP.ferro, 3.6 + (i < 0 ? 0.6 : 0)); }
    for (const [cx, hgt] of [[-2.2, 3], [0.4, 5], [2.8, 3.4]]) for (let j = 0; j < hgt; j++) { const [x, y] = R(cx, -6 - j); P.put(x, y, RP.caos, 3.6 + j * 0.7); const [x2, y2] = R(cx + 0.9, -6 - j + 0.4); if (j < hgt - 1) P.put(x2, y2, RP.caos, 2.4); }
    // the spiked collar
    for (let i = 0; i < 5; i++) { const x = nb[0] - 6 + i * 2.6, y = nb[1] + 1 - Math.abs(i - 2) * 0.4; P.put(x, y, RP.ferro, 4); P.put(x, y - 1, RP.ferro, 3); P.put(x + 0.4, y - 2, RP.osso, 4.6); }
  };

  /* ---- the sword: a long black blade with molten edges, a horned guard ---- */
  const sword = () => {
    const [h, t] = Q.sword, dx = t[0] - h[0], dy = t[1] - h[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux, hot = Q.hot;
    // grip and pommel behind the hand
    P.tube(h[0] - ux * 6, h[1] - uy * 6, h[0] + ux * 1, h[1] + uy * 1, 1.2, 1.2, RP.ferro, s + 90, 2.6, (x, y, tt) => (((tt * 8) | 0) % 2 ? -0.8 : 0.4));
    P.blob(h[0] - ux * 7, h[1] - uy * 7, 1.8, 1.8, RP.caos, s + 91, 3.8);
    // the blade: wavy, a dark fuller, edges of fire
    const B0 = 4, n = Math.ceil(L * 2);
    for (let i = 0; i <= n; i++) {
      const d = B0 + (L - B0) * i / n, f = (d - B0) / (L - B0), hw = (2.8 + Math.sin(d * 0.8) * 0.5) * (f > 0.72 ? (1 - f) / 0.28 : 1) + (f > 0.72 ? 0.3 : 0);
      for (let w = -hw; w <= hw; w += 0.5) {
        const x = h[0] + ux * d + px * w, y = h[1] + uy * d + py * w, e = Math.abs(w) / Math.max(0.5, hw);
        if (e > 0.62) P.put(x, y, RP.fogo, 3.2 + hot * 2.4 + (w < 0 ? 0.8 : -0.2) + cg(x | 0, y | 0, s + 92) * 0.6 - (1 - f) * 0.2);
        else P.put(x, y, hot > 0.8 ? RP.fogo : RP.ferro, (hot > 0.8 ? 4.6 : 1.6 + hot * 1.4) + (w < 0 ? 0.8 : 0) + (Math.abs(w) < 0.4 ? 1 : 0) + cg(x | 0, y | 0, s + 93) * 0.6);
      }
      // runes burning in the fuller
      if (i % 9 === 4 && f < 0.7) P.put(h[0] + ux * d, h[1] + uy * d, RP.fogo, hot > 0.8 ? 6.6 : 5.2);
    }
    // the guard: two curved horns of black iron
    for (const sg of [-1, 1]) { const gx = h[0] + ux * 3, gy = h[1] + uy * 3; P.curve(gx, gy, gx + px * sg * 5, gy + py * sg * 5, gx + px * sg * 6 + ux * 3, gy + py * sg * 6 + uy * 3, 1.6, 0.5, RP.ferro, s + 94 + sg, tt => 3.6 + tt * 1.6); }
    P.blob(h[0] + ux * 3, h[1] + uy * 3, 1.8, 1.8, RP.caos, s + 96, 4.2);
  };
  // the near pauldron: a big spiked plate
  const pauldron = () => {
    P.blob(shN[0] - 0.5, shN[1] - 1.5, 6.4, 5, RP.ferro, s + 100, 3.6, (x, y, dx, dy) => (dy > 0.3 && dy < 0.5 ? -1.2 : 0) + (dy < -0.5 ? 0.8 : 0));
    for (const [ox, oy, kx, ky] of [[-5, -2, -11, -6], [-2, -4, -7, -10], [1, -4, -2, -9]]) P.curve(shN[0] + ox, shN[1] + oy, shN[0] + ox + (kx - ox) * 0.4, shN[1] + oy + (ky - oy) * 0.6, shN[0] + kx, shN[1] + ky, 1.6, 0.4, RP.osso, s + 101 + ox, t => 3 + t * 2.6);
    P.put(shN[0] + 2, shN[1], RP.fogo, 5); P.put(shN[0] - 2, shN[1] + 1, RP.fogo, 4.6);
  };
  if (k === 5) { pauldron(); drawHead(); sword(); arm(Q.armN, 0, s + 110, 'grip'); }
  else { pauldron(); drawHead(); sword(); arm(Q.armN, 0, s + 110, 'grip'); }
  P.veins(RP.pele, RP.fogo, 9650, 10, 0.015);
  return P.done();
}
// where the blade, the mouth and the eyes are in each frame (facing right, frame pixels): for the fire, the glows and the eyes
function poseMeta(k) {
  const Q = poseOf(k), lean = Q.lean, cr = Q.crouch, bob = Q.bob;
  const tx = (x, y) => x + lean * clamp((60 - y) / 30, 0, 1.2), ty = y => y + cr + bob;
  const [hx, hy] = [tx(Q.head[0], Q.head[1]), ty(Q.head[1])], a = Q.tilt, R = (x, y) => [hx + x * Math.cos(a) - y * Math.sin(a), hy + x * Math.sin(a) + y * Math.cos(a)];
  return { hilt: Q.sword[0], tip: Q.sword[1], mouth: R(7.5, 4.4), eye: R(4, -0.4), hot: Q.hot };
}
/* the throne: 52 x 66, black iron and bone, a high back of ribs and horns, chaos crystals burning on it, two fire bowls */
function throne() {
  const P = pp(52, 66), s = 9801;
  // the back: a tall shield of black iron, ribbed with bone, crowned with horns
  P.poly([[10, 12], [26, 3], [42, 12], [41, 46], [11, 46]], RP.ferro, (x, y) => 2.6 + (y < 14 ? 0.6 : 0) - (x - 10) * 0.03 + cn(x, y, 9, s) * 0.8 + cg(x, y, s + 1) * 0.6 + ((x - 10) % 8 === 0 ? -1 : 0) + ((x - 10) % 8 === 1 ? 0.9 : 0));
  for (let k = 0; k < 4; k++) { const x0 = 14 + k * 8; P.curve(x0, 44, x0 - 1, 28, x0 + 2, 14 + Math.abs(k - 1.5) * 2, 1.6, 1, RP.osso, s + 10 + k, t => 3 + t * 1.6); }   // ribs up the back
  P.curve(11, 13, 4, 6, 6, -0, 2.8, 0.6, RP.osso, s + 20, t => 2 + t * 4);   // the horns
  P.curve(41, 13, 48, 6, 46, -0, 2.8, 0.6, RP.osso, s + 21, t => 2 + t * 4);
  P.blob(26, 10, 5.4, 5, RP.osso, s + 22, 3.8);   // a great skull at the top
  P.blob(24, 10, 1.4, 1.6, RP.fogo, s + 23, 4.6); P.blob(28.4, 10, 1.4, 1.6, RP.fogo, s + 24, 4.6); P.put(26, 13, RP.osso, 0.6); P.line(23.6, 14.4, 28.6, 14.4, RP.osso, 2.2);
  // chaos crystals growing out of the back
  const crystal = (cx, by, hgt, wd, sd) => P.poly([[cx - wd, by], [cx - wd * 0.6, by - hgt * 0.7], [cx, by - hgt], [cx + wd * 0.6, by - hgt * 0.7], [cx + wd, by]], RP.caos, (x, y) => 3.4 + (x < cx ? 1.2 : -0.4) + (by - y) / hgt * 1.4 + cg(x, y, sd) * 0.6 + (Math.abs(x - cx + 0.5) < 0.6 ? 1.2 : 0));
  crystal(15, 22, 9, 2.6, s + 30); crystal(37, 24, 11, 2.8, s + 31); crystal(19, 30, 6, 2, s + 32); crystal(33, 31, 7, 2.2, s + 33);
  // the seat: a slab of iron on a bone frame
  P.poly([[6, 44], [46, 44], [47, 49], [5, 49]], RP.ferro, (x, y) => 3.4 + (y === 44 ? 1.6 : 0) - (y - 44) * 0.3 + cg(x, y, s + 40) * 0.6);
  P.poly([[8, 49], [44, 49], [44, 56], [8, 56]], RP.pano, (x, y) => 3 + Math.sin(x * 0.9) * 0.6 - (y - 49) * 0.15 + cg(x, y, s + 41) * 0.6);   // a red cloth over the front
  for (let x = 9; x < 44; x += 5) P.put(x, 56, RP.pano, 1.4);
  // the arms: iron with fire bowls on bone posts
  for (const [x0, sd] of [[2, s + 50], [43, s + 51]]) {
    P.poly([[x0, 34], [x0 + 7, 34], [x0 + 7, 56], [x0, 56]], RP.ferro, (x, y) => 3.2 - (x - x0) * 0.2 + (y === 34 ? 1.4 : 0) + ((y - 34) % 5 === 0 ? -0.8 : 0) + cg(x, y, sd) * 0.6);
    P.blob(x0 + 3.5, 32, 4.6, 2.4, RP.ferro, sd + 1, 3.6);
    for (let x = x0; x <= x0 + 7; x++) P.put(x, 30.6, RP.fogo, 4.2 + hash2(x, 1, sd) * 1.6);   // embers in the bowl
    P.put(x0 + 2, 38, RP.caos, 5.2); P.put(x0 + 4, 44, RP.fogo, 4.8);
  }
  // the steps: chaos stone, skulls heaped at the foot
  P.poly([[0, 56], [52, 56], [52, 61], [0, 61]], RP.ferro, (x, y) => 3 + (y === 56 ? 1.4 : 0) + cn(x, y, 5, s + 60) * 0.8 + cg(x, y, s + 61) * 0.6);
  P.poly([[-2, 61], [54, 61], [54, 66], [-2, 66]], RP.caos, (x, y) => 2 + (y === 61 ? 1.6 : 0) + cn(x, y, 6, s + 62) * 1 + cg(x, y, s + 63) * 0.6);
  for (const [x, y] of [[4, 59], [9, 60], [44, 59], [48, 60], [7, 57]]) { P.blob(x, y, 2.2, 2, RP.osso, s + x, 3.8); P.put(x - 0.6, y, RP.osso, 0.4); P.put(x + 0.8, y, RP.osso, 0.4); }
  return P.done();
}
const GL = { sword: glow(26, '#ff7a20'), mouth: glow(20, '#ffb040'), eye: glow(8, '#ffd070'), red: glow(40, '#ff2a1a'), chaos: glow(30, '#c4489a'), lava: glow(24, '#ff8a20') };
const N = 14;
PRA.get = () => PRA.ready || (PRA.ready = { body: Array.from({ length: N }, (_, k) => set(prince(k))), meta: Array.from({ length: N }, (_, k) => poseMeta(k)) });
Object.assign(PRA, { GL, PW, PH, OX, prince, throne, RP });
// the throne prop (only the boss hall gets it)
defProp('ab_trono', { nome: 'Trono do Caos', apoio: 'chao', camada: 'fundo', faixas: [], variantes: [throne()], abismo: true, luz: [{ x: 15, y: 16, r: 0.6 }, { x: 37, y: 16, r: 0.6 }, { x: 5, y: 30, r: 0.8 }, { x: 47, y: 30, r: 0.8 }], chamas: [{ x: 4, y: 30 }, { x: 6, y: 30 }, { x: 45, y: 30 }, { x: 47, y: 30 }], brilho: '#ff6a3a' });
}

/* ---------- drawing ---------- */
function prPose(e) {
  const flap = 9 + [0, 1, 2, 1][Math.floor(e.t * 8) % 4];
  switch (e.state) {
    case 'intro': return e.stateT > 1.3 ? 13 : 8;
    case 'sweepWind': return 3;
    case 'sweep': return 4;
    case 'dashWind': case 'dash': return 5;
    case 'breathWind': return e.flying ? flap : 6;
    case 'breath': return e.flying ? flap : 7;
    case 'summon': case 'wingsOpen': return 8;
    case 'geyserWind': case 'geyser': case 'stuck': return 13;
    case 'diveWind': case 'dive': return 12;
    case 'fly': case 'meteorWind': case 'takeoff': return flap;
    default: return e.flying ? flap : Math.abs(e.vx) > 8 && e.onGround ? 1 + (Math.floor(e.t * 5) % 2) : 0;
  }
}
// a point of the frame (facing right, pose space) on screen
const prPt = (e, fx, fy, p) => [fx + e.facing * (p[0] - 60), fy - 88 + p[1]];
DRAW_E.principecaos = function (e, fx, fy, fl) {
  const A = PRA.get(), k = prPose(e), img = cvPick(A.body[k], e, fl), sh = e.state === 'stuck' || e.state === 'wingsOpen' ? Math.round(Math.sin(e.t * 40) * (e.state === 'stuck' ? 1 : 0.6)) : 0;
  lc.drawImage(img, fx - (e.facing > 0 ? 61 + PRA.OX : PRA.PW + 1 - 61 - PRA.OX) + sh, fy - 89);
};
EYES_E.principecaos = (e, fx, fy) => {
  const m = PRA.get().meta[prPose(e)], [x, y] = prPt(e, fx, fy, m.eye);
  lc.globalAlpha = WARN_E.principecaos(e) ? 0.95 : 0.6; lc.drawImage(PRA.GL.eye, Math.round(x) - 8, Math.round(y) - 8);
};
WARN_E.principecaos = e => e.state === 'sweepWind' || e.state === 'dashWind' || e.state === 'breathWind' || e.state === 'summon' || e.state === 'geyserWind' || e.state === 'wingsOpen' || e.state === 'meteorWind' || e.state === 'diveWind';
// little flames, 3 to 7 px tall, flickering: the floor fires, the blade, the geysers' spray
function prFlame(x, y, hgt, seed, a = 1) {
  const f = Math.floor(gameTime * 10 + seed) % 3, h = Math.max(2, Math.round(hgt + (f === 1 ? 1 : f === 2 ? -1 : 0))), sx = Math.round(x), sy = Math.round(y);
  lc.globalAlpha = a;
  lc.fillStyle = PR_FIRE[2]; lc.fillRect(sx - 1, sy - Math.ceil(h * 0.6), 3, Math.ceil(h * 0.6));
  lc.fillStyle = PR_FIRE[4]; lc.fillRect(sx - (f === 2 ? 1 : 0), sy - h + 1, 2, h - 1);
  lc.fillStyle = PR_FIRE[5]; lc.fillRect(sx, sy - Math.ceil(h * 0.5), 1, Math.ceil(h * 0.5));
  lc.fillStyle = PR_FIRE[6]; lc.fillRect(sx, sy - 1, 1, 1);
  lc.fillStyle = PR_FIRE[3]; lc.fillRect(sx + (f === 0 ? 1 : -1), sy - h, 1, 1);
}
// the blade on fire
function prBladeFire(e, cx, cy) {
  const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy, m = PRA.get().meta[prPose(e)];
  const [hx, hy] = prPt(e, fx, fy, m.hilt), [tx, ty] = prPt(e, fx, fy, m.tip), L = Math.hypot(tx - hx, ty - hy), hot = WARN_E.principecaos(e) ? 1 : m.hot;
  for (let d = 8; d < L - 1; d += 4) { const t = d / L, x = hx + (tx - hx) * t, y = hy + (ty - hy) * t; prFlame(x, y - 1, 2 + hot * 3 + Math.sin(d + e.t * 9) * 1.2, d * 3, 0.85); }
  lc.globalAlpha = 1;
}
HOOK.drawWorld.push((cx, cy) => {
  // meteors' shadows and the geysers' rings on the floor, under everything
  for (const m of prFx.meteors) { const x = Math.round(m.tx) - cx, y = m.floor - cy - 1, a = clamp(1 - m.warn / 1.2, 0.2, 0.85); lc.globalAlpha = a * 0.75; lc.fillStyle = '#000'; lc.beginPath(); lc.ellipse(x, y, 6 + a * 8, 2 + a, 0, 0, Math.PI * 2); lc.fill(); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  const e = prBoss;
  if (e && !e.dead) prBladeFire(e, cx, cy);
  // flames left on the floor
  for (const f of prFx.flames) { const a = Math.min(1, f.t / 0.5, (f.max - f.t) / 0.15 + 0.2); prFlame(f.x - cx, f.y - cy, 4 + Math.sin(f.seed + gameTime * 7) * 1.5, f.seed, a); prFlame(f.x - cx + 3, f.y - cy, 2.5, f.seed + 5, a); }
  // the dash's warning: embers running along the floor ahead of him
  if (e && !e.dead && e.state === 'dashWind') { const gy = abBoss.fy * T - cy - 1, x0 = e.x + e.w / 2 - cx; for (let k = 0; k < 14; k++) { const x = x0 + e.facing * (20 + k * 9), a = 0.3 + 0.5 * ((Math.floor(gameTime * 14) + k) % 3 === 0 ? 1 : 0.4); lc.globalAlpha = a; lc.fillStyle = k % 2 ? PR_FIRE[4] : PR_FIRE[3]; lc.fillRect(Math.round(x), gy, 3, 1); } }
  // the dive's warning: a burning mark on the floor right under him
  if (e && !e.dead && (e.state === 'diveWind' || e.state === 'dive')) { const gy = abBoss.fy * T - cy - 1, x = Math.round(e.diveX !== undefined ? e.diveX : e.x + e.w / 2) - cx, p = 0.5 + Math.sin(gameTime * 18) * 0.3; lc.globalAlpha = p; lc.fillStyle = PR_FIRE[3]; lc.fillRect(x - 14, gy, 28, 1); lc.fillStyle = PR_FIRE[5]; lc.fillRect(x - 6, gy, 12, 1); lc.fillRect(x - 1, gy - 2, 2, 2); }
  // geysers: a glowing ring growing on the floor, then the column of lava
  for (const g of prFx.geysers) {
    const x = Math.round(g.x) - cx, y = g.floor - cy;
    if (g.warn > 0) {
      const a = clamp(1 - g.warn / 1.2, 0.15, 1), r = 4 + a * 9, pu = 0.6 + Math.sin(gameTime * 16) * 0.3;
      lc.globalAlpha = pu; lc.fillStyle = PR_FIRE[2]; lc.fillRect(x - r, y - 1, r * 2, 1); lc.fillStyle = PR_FIRE[4]; lc.fillRect(x - r * 0.6, y - 1, r * 1.2, 1); lc.fillStyle = PR_FIRE[6]; lc.fillRect(x - 1, y - 2, 2, 1);
      for (let k = 0; k < 3; k++) { const b = (gameTime * 1.8 + k / 3) % 1; lc.fillStyle = PR_FIRE[4 + (k & 1)]; lc.fillRect(Math.round(x - r * 0.5 + k * r * 0.5), Math.round(y - 2 - b * 6 * a), 1, 1); }
      continue;
    }
    const k = g.t / g.max, hgt = Math.round(86 * Math.sin(Math.min(1, k * 1.6) * Math.PI / 2) * (k > 0.75 ? (1 - k) / 0.25 : 1));
    for (let j = 0; j < hgt; j += 2) {
      const w = 5 + Math.sin(j * 0.5 + gameTime * 20) * 1.4 + (j > hgt - 8 ? -2 : 0), yy = y - j;
      lc.globalAlpha = 1; lc.fillStyle = PR_FIRE[2]; lc.fillRect(Math.round(x - w), yy - 2, Math.round(w * 2), 2);
      lc.fillStyle = PR_FIRE[4]; lc.fillRect(Math.round(x - w + 2), yy - 2, Math.max(1, Math.round(w * 2 - 4)), 2);
      lc.fillStyle = (j + Math.floor(gameTime * 30)) % 6 < 2 ? PR_FIRE[6] : PR_FIRE[5]; lc.fillRect(Math.round(x - 1 + Math.sin(j + gameTime * 12)), yy - 2, 2, 2);
    }
    if (hgt > 6) { prFlame(x - 4, y - hgt, 4, g.x, 1); prFlame(x + 3, y - hgt + 1, 5, g.x + 3, 1); }
  }
  // portals: a ring of chaos tearing open, dark in the middle
  for (const p of prFx.portals) {
    const x = Math.round(p.x) - cx, y = Math.round(p.y) - cy, k = Math.min(1, p.t / 0.6, (p.life - p.t) / 0.5), rx = 3 + k * 9, ry = 6 + k * 16;
    lc.globalAlpha = 0.9 * k; lc.fillStyle = '#0a0208'; lc.beginPath(); lc.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); lc.fill();
    lc.globalAlpha = k;
    for (let a = 0; a < 6.28; a += 0.18) { const w = Math.sin(a * 3 + gameTime * 8), px = Math.round(x + Math.cos(a) * (rx + w)), py = Math.round(y + Math.sin(a) * (ry + w * 1.5)); lc.fillStyle = PR_CHAOS[(Math.floor(a * 3 + gameTime * 12) % 4 + 4) % 4]; lc.fillRect(px, py, 2, 2); }
    for (let j = 0; j < 5; j++) { const a = gameTime * 3 + j * 1.25, r = (gameTime * 0.9 + j * 0.2) % 1; lc.fillStyle = PR_CHAOS[3]; lc.fillRect(Math.round(x + Math.cos(a) * rx * r), Math.round(y + Math.sin(a) * ry * r), 1, 1); }
  }
  // fireballs
  for (const b of prFx.balls) {
    const x = Math.round(b.x) - cx, y = Math.round(b.y) - cy;
    lc.globalAlpha = 1; lc.fillStyle = PR_FIRE[1]; lc.fillRect(x - 3, y - 2, 6, 5); lc.fillRect(x - 2, y - 3, 4, 7);
    lc.fillStyle = PR_FIRE[3]; lc.fillRect(x - 2, y - 2, 4, 4); lc.fillStyle = PR_FIRE[5]; lc.fillRect(x - 1, y - 1, 3, 2); lc.fillStyle = PR_FIRE[6]; lc.fillRect(x, y - 1, 1, 1);
  }
  // meteors: a burning rock with a tail of fire
  for (const m of prFx.meteors) {
    if (m.warn > 0) continue;
    const x = Math.round(m.x) - cx, y = Math.round(m.y) - cy, ux = -m.vx / (Math.hypot(m.vx, m.vy) || 1), uy = -m.vy / (Math.hypot(m.vx, m.vy) || 1);
    for (let j = 12; j > 0; j--) { lc.globalAlpha = 0.9 - j * 0.06; lc.fillStyle = PR_FIRE[clamp(6 - (j >> 1), 1, 6)]; const s = j > 7 ? 1 : 2; lc.fillRect(Math.round(x + ux * j * 1.6 + Math.sin(j + gameTime * 30)), Math.round(y + uy * j * 1.6), s, s); }
    lc.globalAlpha = 1; lc.fillStyle = '#0c0606'; lc.fillRect(x - 4, y - 3, 8, 7); lc.fillRect(x - 3, y - 4, 6, 9);
    lc.fillStyle = '#3a1810'; lc.fillRect(x - 3, y - 3, 6, 6); lc.fillStyle = '#6a2a14'; lc.fillRect(x - 3, y - 3, 3, 2); lc.fillStyle = PR_FIRE[4]; lc.fillRect(x + 1, y, 2, 1); lc.fillRect(x - 1, y + 2, 1, 1); lc.fillStyle = PR_FIRE[5]; lc.fillRect(x - 2, y - 1, 1, 1);
  }
  // the sweep: a crescent of fire in front of him
  for (const a of prFx.arcs) {
    const k = a.t / a.max, x = a.x - cx, y = a.y - cy;
    for (let i = 0; i <= 24; i++) {
      const ang = -1.25 + i / 24 * 2.3, r = 46 + Math.sin(i * 1.7) * 2;
      for (let j = 0; j < 4; j++) { lc.globalAlpha = k * (1 - j * 0.2); lc.fillStyle = PR_FIRE[6 - j - (i % 3 === 0 ? 1 : 0)]; lc.fillRect(Math.round(x + a.f * Math.cos(ang) * (r - j * 2.5)), Math.round(y + Math.sin(ang) * (r - j * 2.5) * 0.9), 2, 2); }
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  const e = prBoss, G = PRA.GL;
  if (e && !e.dead) {
    const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy, m = PRA.get().meta[prPose(e)], hot = WARN_E.principecaos(e) ? 1 : m.hot;
    const [hx, hy] = prPt(e, fx, fy, m.hilt), [tx, ty] = prPt(e, fx, fy, m.tip);
    lc.globalAlpha = 0.3 + hot * 0.35; lc.drawImage(G.sword, Math.round((hx + tx) / 2) - 26, Math.round((hy + ty) / 2) - 26); lc.drawImage(G.sword, Math.round(tx) - 26, Math.round(ty) - 26);
    if (e.state === 'breathWind' || e.state === 'breath') { const [mx, my] = prPt(e, fx, fy, m.mouth); lc.globalAlpha = 0.7 + Math.random() * 0.2; lc.drawImage(G.mouth, Math.round(mx) - 20, Math.round(my) - 20); }
  }
  for (const f of prFx.flames) { lc.globalAlpha = 0.28 * Math.min(1, f.t / 0.5); lc.drawImage(G.lava, f.x - cx - 24, f.y - cy - 30); }
  for (const g of prFx.geysers) { lc.globalAlpha = g.warn > 0 ? 0.25 + (1 - g.warn) * 0.2 : 0.6; lc.drawImage(G.lava, g.x - cx - 24, g.floor - cy - 24 - (g.warn > 0 ? 0 : 30)); }
  for (const p of prFx.portals) { lc.globalAlpha = 0.6 * Math.min(1, p.t / 0.6, (p.life - p.t) / 0.5); lc.drawImage(G.chaos, p.x - cx - 30, p.y - cy - 30); }
  for (const b of prFx.balls) { lc.globalAlpha = 0.6; lc.drawImage(G.mouth, b.x - cx - 20, b.y - cy - 20); }
  for (const m of prFx.meteors) if (m.warn <= 0) { lc.globalAlpha = 0.7; lc.drawImage(G.lava, m.x - cx - 24, m.y - cy - 24); }
  for (const a of prFx.arcs) { lc.globalAlpha = 0.5 * a.t / a.max; lc.drawImage(G.sword, a.x + a.f * 30 - cx - 26, a.y - cy - 26); }
  lc.globalAlpha = 1;
});
// everything that burns lights the hall
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const e = prBoss;
  if (e && !e.dead) { const m = PRA.get().meta[prPose(e)], [tx, ty] = prPt(e, e.x + e.w / 2, e.y + e.h, m.tip), [hx, hy] = prPt(e, e.x + e.w / 2, e.y + e.h, m.hilt); addL((tx + hx) / 2, (ty + hy) / 2, 0.75); addL(tx, ty, 0.6); }
  for (const f of prFx.flames) addL(f.x, f.y - 4, 0.55);
  for (const g of prFx.geysers) { addL(g.x, g.floor - 4, g.warn > 0 ? 0.45 : 0.9); if (g.warn <= 0) addL(g.x, g.floor - 40, 0.8); }
  for (const p of prFx.portals) addL(p.x, p.y, 0.7);
  for (const b of prFx.balls) addL(b.x, b.y, 0.6);
  for (const m of prFx.meteors) if (m.warn <= 0) addL(m.x, m.y, 0.7);
}; }

/* ---------- the fight ---------- */
function prPhase(e) { return e.hp <= e.maxHp * PR.p3 ? 2 : e.hp <= e.maxHp * PR.p2 ? 1 : 0; }
function prSet(e, st, t) { e.state = st; e.stateT = t; }
function prMinions() { let n = 0; for (const m of enemies) if (m.prMinion && !m.dead) n++; return n; }
const prMinionTypes = () => ['diabrete', 'caoinferno'].filter(t => ET[t] && AI[t]);
const prClear = () => { for (const k in prFx) if (k !== 'gates') prFx[k].length = 0; };
function prStart() {
  const B = abBoss; prGates(true);
  DROPS.principecaos = PR_DROPS.filter(([id]) => ITEMS[id]);
  const D = ET.principecaos, e = spawnEnemy('principecaos', (B.cx - 2) * T - D.w / 2, B.fy * T - D.h - 1, AB_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: PR.lvl, hp: D.hp, maxHp: D.hp, dmg: D.dmg, gold: 0, facing: pl.x < B.cx * T ? -1 : 1, cd: 1, callT: 4, geyT: 0, flying: false });
  prSet(e, 'intro', 2.8);
  prBoss = e; bossFight = { e, pr: true }; prClear();
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Príncipe do Caos'; bn.lastChild.textContent = 'senhor do Abismo'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Príncipe do Caos', 'senhor do Abismo');
}
function prEnd(won) {
  const e = prBoss; prBoss = null; bossFight = null;
  prGates(false); prClear();
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Carrasco'; bn.lastChild.textContent = 'guardião da cripta'; }
  for (const m of enemies.slice()) if (m.prMinion && !m.dead) { prDrop(m); burst(m.x + m.w / 2, m.y + m.h / 2, 8, '#c4489a', 50, 200, 0.4, 1, true); }
  if (!won) { if (e) { const k = enemies.indexOf(e); if (k >= 0) enemies.splice(k, 1); } return; }
  prState.dead = true;
  showBanner('Vitória', 'o Príncipe do Caos caiu');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.pr) return prEnd(won); return _eb(won); }; }
// grates of chaos over every way out (they can't be dug; they sink when the fight ends)
function prGates(on) {
  const B = abBoss; if (!B) return;
  if (on) {
    prFx.gates.length = 0;
    const put = (x, y) => { const i = y * WW + wrapX(x), t = tiles[i]; if (SOLID[t]) return; prFx.gates.push([i, t]); tiles[i] = AB_BARREIRA; markDirty(wrapX(x), y); burst(wrapX(x) * T + 6, y * T + 6, 2, '#c4489a', 30, 60, 0.4, 1, true); };
    const x0 = B.cx - (B.w >> 1), x1 = x0 + B.w - 1;
    for (let y = B.top - 6; y <= B.fy; y++) { put(x0 - 1, y); put(x1 + 1, y); }
    for (let x = x0; x <= x1; x++) { put(x, B.top - 6); put(x, B.fy); }
    sfx.prGate();
  } else {
    for (const [i, t] of prFx.gates) if (tiles[i] === AB_BARREIRA) { tiles[i] = t; markDirty(i % WW, (i / WW) | 0); burst((i % WW) * T + 6, ((i / WW) | 0) * T + 6, 4, '#c4489a', 40, 160, 0.5, 1, true); }
    prFx.gates.length = 0;
  }
  mapVer++;
}
const prHall = () => { const B = abBoss; return { x0: (B.cx - (B.w >> 1) + 1) * T, x1: (B.cx + (B.w >> 1) - 1) * T, floor: B.fy * T, roof: B.top * T }; };
function prAddFlame(x, y, life = 3.2) { if (prFx.flames.length > 80) prFx.flames.shift(); prFx.flames.push({ x, y, t: life, max: life, seed: Math.random() * 99 }); }
// a fan of fireballs from the mouth toward the hero
function prBreathVolley(e, n) {
  const m = PRA.get().meta[prPose(e)], [mx, my] = prPt(e, e.x + e.w / 2, e.y + e.h, m.mouth), aim = Math.atan2(pl.y + pl.h / 2 - my, pl.x + pl.w / 2 - mx);
  for (let k = 0; k < n; k++) { const a = aim + (k - (n - 1) / 2) * 0.17, sp = 190; prFx.balls.push({ x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 3, dmg: Math.round(e.dmg * 0.5) }); }
  burst(mx, my, 10, '#ffd070', 90, -40, 0.4, 1, true); sfx.prBreath();
}
function prGeysers(e, n) {
  const H = prHall(), px = pl.x + pl.w / 2;
  for (let k = 0; k < n; k++) { const x = clamp(k === 0 ? px : px + (k % 2 ? -1 : 1) * (40 + Math.ceil(k / 2) * 46) + rnd(-10, 10), H.x0 + 8, H.x1 - 8); prFx.geysers.push({ x, floor: H.floor, warn: 1.1 + k * 0.22, t: 0, max: 0.95, hit: false }); }
  sfx.prRumble(); shake(3);
}
function prMeteors(n) {
  const H = prHall(), px = pl.x + pl.w / 2;
  for (let k = 0; k < n; k++) { const tx = clamp(k === 0 ? px : px + rnd(-170, 170), H.x0 + 6, H.x1 - 6), d = Math.random() < 0.5 ? -1 : 1; prFx.meteors.push({ tx, floor: H.floor, warn: 1.0 + k * 0.2, x: tx - d * 60, y: H.roof, vx: d * 60 / 0.5, vy: (H.floor - H.roof) / 0.5 }); }
  sfx.prRumble();
}
function prPortals(e) {
  const B = abBoss, types = prMinionTypes(); if (!types.length) return;
  for (const side of [-1, 1]) { if (prMinions() + prFx.portals.length >= 3) break; prFx.portals.push({ x: (B.cx + side * ((B.w >> 1) - 6)) * T, y: B.fy * T - 26, t: 0, life: 2.6, type: types[(Math.random() * types.length) | 0], spawned: false }); }
  sfx.prPortal();
}
function prSpawnFrom(p) {
  const D = ET[p.type]; if (!D) return;
  const m = spawnEnemy(p.type, p.x - D.w / 2, abBoss.fy * T - D.h - 1, AB_ZONE0 + 3); if (!m) return;
  m.prMinion = true; m.memT = 6; m.lvl = layerLo('abismo'); const mul = 1 + 0.3 * (m.lvl - 1); m.hp = m.maxHp = Math.round(D.hp * mul); m.dmg = Math.round(D.dmg * (1 + 0.2 * (m.lvl - 1))); m.xp = 1; m.gold = 0;
  burst(p.x, p.y, 18, '#c4489a', 120, 0, 0.6, 1, true);
}
AI.principecaos = function (e, dt, dx, dy, dist) {
  const H = prHall(), ph = prPhase(e), ecx = e.x + e.w / 2, toPl = Math.sign(dx) || e.facing, adx = Math.abs(dx);
  e.stateT -= dt; e.cd -= dt; e.callT -= dt; e.geyT -= dt;
  // in the air: hold a height over the floor (the gravity the game adds afterwards is taken back here)
  const hover = (txp, tyFeet, sx, sy) => { e.vx = approach(e.vx, clamp((clamp(txp, H.x0 + 20, H.x1 - 20) - ecx) * 2.2, -sx, sx), 500 * dt); const vy = clamp((tyFeet - (e.y + e.h)) * 2.4, -sy, sy) + Math.sin(e.t * 3) * 14; e.vy = vy - GRAV * dt; };
  const air = () => hover(pl.x + pl.w / 2 + Math.sin(e.t * 0.7) * 90, H.floor - 30, 120, 140);
  if (Math.random() < dt * 6) parts.push({ x: ecx + rnd(-10, 10), y: e.y + rnd(0, 20), vx: rnd(-8, 8), vy: rnd(-40, -20), g: -20, life: 0.9, max: 0.9, col: Math.random() < 0.5 ? '#ff9a2a' : '#c4489a', size: 1, glow: true });   // embers off him
  switch (e.state) {
    case 'intro':
      e.vx = 0;
      if (e.stateT < 1.3 && !e.roared) { e.roared = true; sfx.prRoar(); shake(6); burst(ecx, e.y + 10, 30, '#ff9a2a', 140, -60, 0.8, 1, true); burst(ecx, e.y + e.h, 20, '#c4489a', 120, 200, 0.6, 1, true); }
      if (e.stateT <= 0) { prSet(e, 'walk', 0); e.cd = 0.6; }
      return;
    case 'walk': {
      e.facing = toPl;
      if (ph === 2 && !e.p3Done) { e.p3Done = e.p2Done = true; prSet(e, 'wingsOpen', 1.7); e.vx = 0; sfx.prRoar(); return; }
      if (ph >= 1 && !e.p2Done) { e.p2Done = true; if (prMinionTypes().length) { prSet(e, 'summon', 1.3); e.vx = 0; sfx.prRoar(); return; } }
      e.vx = approach(e.vx, adx > 44 ? toPl * 58 : adx < 22 ? -toPl * 30 : 0, 420 * dt);
      if (e.cd > 0 || !e.onGround) return;
      const r = Math.random();
      if (ph >= 1 && e.callT <= 0 && prMinions() < 2 && prMinionTypes().length && r < 0.3) { prSet(e, 'summon', 1.3); e.vx = 0; sfx.prRoar(); return; }
      if (ph >= 1 && e.geyT <= 0 && r < 0.6) { prSet(e, 'geyserWind', 0.8); e.vx = 0; return; }
      if (adx < 74 && Math.abs(dy) < 50) { prSet(e, 'sweepWind', 0.75); e.vx = 0; sfx.prCharge(); return; }
      if (adx > 90 && r < 0.6) { prSet(e, 'dashWind', 0.75); e.vx = 0; sfx.prCharge(); return; }
      prSet(e, 'breathWind', 0.8); e.vx = 0; sfx.prInhale(); return;
    }
    case 'sweepWind':
      e.vx = approach(e.vx, 0, 900 * dt); e.facing = toPl;
      if (e.stateT <= 0) {
        const hb = { x: e.facing > 0 ? ecx - 12 : ecx - 80, y: e.y - 16, w: 92, h: e.h + 16 };
        e.hitDone = false; if (!pl.dead && overlap(hb, pl)) { e.hitDone = true; hurtPlayer(Math.round(e.dmg * 1.1), ecx, e, false); }
        prFx.arcs.push({ x: ecx, y: e.y + 26, f: e.facing, t: 0.28, max: 0.28 });
        shake(4); sfx.prSwing(); prSet(e, 'sweep', 0.45);
      }
      return;
    case 'sweep': e.vx = 0; if (e.stateT <= 0) prSet(e, 'recover', 0.55); return;
    case 'dashWind':
      e.vx = approach(e.vx, 0, 900 * dt); e.facing = toPl;
      if (Math.random() < dt * 30) burst(ecx - e.facing * 30, H.floor - 2, 1, '#ffd070', 60, 300, 0.25, 1, true);
      if (e.stateT <= 0) { prSet(e, 'dash', 1.2); e.hitDone = false; e.lastFl = ecx; sfx.prDash(); }
      return;
    case 'dash': {
      e.vx = e.facing * (300 + ph * 30);
      if (Math.abs(ecx - e.lastFl) > 11) { e.lastFl = ecx; prAddFlame(ecx - e.facing * 34, H.floor); }
      if (Math.random() < dt * 40) parts.push({ x: ecx - e.facing * 36, y: H.floor - 2, vx: -e.facing * rnd(20, 90), vy: rnd(-120, -30), g: 300, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ffd070' : '#ff9a2a', size: 1, glow: true });
      if (!e.hitDone && !pl.dead && overlap({ x: e.x - 6, y: e.y, w: e.w + 12, h: e.h }, pl)) { e.hitDone = true; hurtPlayer(e.dmg, ecx, e, false); }
      const edge = e.facing > 0 ? H.x1 - 10 : H.x0 + 10;
      if (e.hitWall || (e.facing > 0 ? e.x + e.w >= edge : e.x <= edge) || e.stateT <= 0) { e.vx = 0; burst(ecx + e.facing * 12, H.floor - 3, 16, '#ffb040', 120, 300, 0.5, 1, true); shake(3); prSet(e, 'recover', 0.8); }
      return;
    }
    case 'breathWind':
      if (e.flying) air(); else e.vx = approach(e.vx, 0, 900 * dt);
      e.facing = toPl;
      if (e.stateT <= 0) { prSet(e, 'breath', 1.15); e.volley = 0; }
      return;
    case 'breath':
      if (e.flying) air(); else e.vx = 0;
      e.facing = toPl;
      if (e.volley === 0 && e.stateT < 1.0) { e.volley = 1; prBreathVolley(e, ph >= 1 ? 7 : 5); }
      if (e.volley === 1 && e.stateT < 0.45) { e.volley = 2; prBreathVolley(e, ph >= 1 ? 6 : 4); }
      if (e.stateT <= 0) prSet(e, 'recover', 0.6);
      return;
    case 'summon':
      e.vx = 0; if (e.stateT < 0.8 && !e.called) { e.called = true; prPortals(e); }
      if (e.stateT <= 0) { e.called = false; e.callT = 15; prSet(e, 'recover', 0.4); }
      return;
    case 'geyserWind':
      e.vx = approach(e.vx, 0, 900 * dt);
      if (e.stateT <= 0) { prGeysers(e, ph === 2 ? 6 : 4); e.geyT = 7; shake(5); sfx.prImpact(); burst(ecx + e.facing * 22, H.floor - 2, 20, '#ff9a2a', 110, 300, 0.5, 1, true); prSet(e, 'geyser', 0.7); }
      return;
    case 'geyser': e.vx = 0; if (e.stateT <= 0) prSet(e, 'recover', 0.5); return;
    case 'wingsOpen':
      e.vx = 0;
      if (Math.random() < dt * 30) burst(ecx + rnd(-40, 40), e.y + rnd(0, 30), 1, Math.random() < 0.5 ? '#c4489a' : '#ff9a2a', 60, -40, 0.5, 1, true);
      if (e.stateT < 0.6 && !e.flapped) { e.flapped = true; sfx.prWings(); shake(5); burst(ecx, H.floor - 2, 30, '#5a3a30', 160, 200, 0.7); }
      if (e.stateT <= 0) { e.flying = true; e.vy = -260; prSet(e, 'fly', 0); e.cd = 1.2; }
      return;
    case 'fly': {
      air(); e.facing = toPl;
      if (Math.random() < dt * 2.4) sfx.prWings();
      if (e.cd > 0) return;
      const r = Math.random();
      if (r < 0.36) { prSet(e, 'meteorWind', 0.9); sfx.prRoar(); return; }
      if (r < 0.78) { prSet(e, 'diveWind', 0.95); sfx.prCharge(); return; }
      prSet(e, 'breathWind', 0.75); sfx.prInhale(); return;
    }
    case 'meteorWind':
      hover(ecx, H.floor - 36, 60, 120); e.facing = toPl;
      if (e.stateT <= 0) { prMeteors(7); prSet(e, 'recover', 0.6); }
      return;
    case 'diveWind':   // over the hero, the blade flaring
      hover(pl.x + pl.w / 2, H.floor - 50, 260, 160); e.facing = toPl; e.diveX = clamp(ecx, H.x0 + 14, H.x1 - 14);
      if (e.stateT <= 0) { prSet(e, 'dive', 1.2); e.hitDone = false; e.vy = 200; sfx.prDash(); }
      return;
    case 'dive':
      e.vx = approach(e.vx, 0, 600 * dt); e.vy = Math.max(e.vy, 560);
      if (!e.hitDone && !pl.dead && overlap({ x: e.x - 4, y: e.y + 20, w: e.w + 8, h: e.h - 10 }, pl)) { e.hitDone = true; hurtPlayer(Math.round(e.dmg * 1.3), ecx, e, false); }
      if (e.onGround || e.stateT <= 0) {
        e.flying = false; e.vx = 0; shake(9); sfx.prImpact(); hitstop = Math.max(hitstop, 0.08);
        burst(ecx, H.floor - 2, 36, '#ffb040', 200, 300, 0.7, 1, true); burst(ecx, H.floor - 2, 20, '#3a2420', 140, 300, 0.8);
        for (const d of [-1, 1]) for (let k = 1; k <= 4; k++) prAddFlame(ecx + d * k * 12, H.floor, 2.4 + k * 0.2);
        if (!e.hitDone && !pl.dead && Math.abs(pl.x + pl.w / 2 - ecx) < 30 && pl.y + pl.h > H.floor - 26) { e.hitDone = true; hurtPlayer(Math.round(e.dmg * 1.1), ecx, e, false); }
        prSet(e, 'stuck', 1.7);
      }
      return;
    case 'stuck': e.vx = 0; if (e.stateT <= 0) { prSet(e, 'takeoff', 0.6); e.flying = true; e.vy = -280; sfx.prWings(); } return;
    case 'takeoff': air(); if (e.stateT <= 0) { prSet(e, 'fly', 0); e.cd = 0.8 + Math.random() * 0.6; } return;
    case 'recover':
      if (e.flying) air(); else e.vx = approach(e.vx, 0, 700 * dt);
      if (e.stateT <= 0) { prSet(e, e.flying ? 'fly' : 'walk', 0); e.cd = (ph === 2 ? 0.6 : ph === 1 ? 0.7 : 0.9) + Math.random() * 0.6; }
      return;
  }
};
HOOK.update.push(dt => {
  if (typeof DMG_KIND !== 'undefined' && !DMG_KIND.principecaos) DMG_KIND.principecaos = 'fogo';
  if (typeof ABISMO === 'undefined' || !ABISMO || !abBoss || !pl) return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (!prState.dead && !bossFight && !pl.dead && state === 'play' && inAbHall(ptx, pty, 3)) prStart();
  const e = prBoss;
  if (e && bossFight && bossFight.pr && !inAbHall(ptx, pty, -3) && !pl.dead) endBossFight(false);
  const pcx = pl.x + pl.w / 2, feet = pl.y + pl.h;
  prBurnCD -= dt;
  // flames on the floor
  for (let i = prFx.flames.length - 1; i >= 0; i--) {
    const f = prFx.flames[i]; f.t -= dt; if (f.t <= 0) { prFx.flames.splice(i, 1); continue; }
    if (Math.random() < dt * 3) parts.push({ x: f.x + rnd(-2, 2), y: f.y - 5, vx: rnd(-6, 6), vy: rnd(-40, -20), g: -10, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#ff9a2a' : '#3a2a28', size: 1, glow: Math.random() < 0.5 });
    if (!pl.dead && prBurnCD <= 0 && Math.abs(pcx - f.x) < 6 && feet > f.y - 10 && feet < f.y + 3) { prBurnCD = 0.5; prBurn(ET.principecaos.dmg * 0.3, f.x); }
  }
  // fireballs
  for (let i = prFx.balls.length - 1; i >= 0; i--) {
    const b = prFx.balls[i]; b.t -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (Math.random() < dt * 30) parts.push({ x: b.x + rnd(-1, 1), y: b.y + rnd(-1, 1), vx: rnd(-10, 10), vy: rnd(-20, 0), g: -20, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ff9a2a' : '#ffd070', size: 1, glow: true });
    if (!pl.dead && Math.abs(b.x - pcx) < pl.w / 2 + 3 && b.y > pl.y - 3 && b.y < feet + 3) { prBurn(b.dmg, b.x); burst(b.x, b.y, 8, '#ffb040', 80, 100, 0.4, 1, true); prFx.balls.splice(i, 1); continue; }
    if (b.t <= 0 || solidAt(Math.floor(b.x / T), Math.floor(b.y / T))) { burst(b.x, b.y, 8, '#ff9a2a', 70, 200, 0.4, 1, true); if (b.vy > 0 && solidAt(Math.floor(b.x / T), Math.floor((b.y + 2) / T)) && Math.random() < 0.5) prAddFlame(b.x, Math.floor((b.y + 2) / T) * T, 1.6); prFx.balls.splice(i, 1); }
  }
  // geysers
  for (let i = prFx.geysers.length - 1; i >= 0; i--) {
    const g = prFx.geysers[i];
    if (g.warn > 0) { g.warn -= dt; if (g.warn <= 0) { sfx.prGeyser(); burst(g.x, g.floor - 2, 14, '#ffb040', 120, 300, 0.5, 1, true); } continue; }
    g.t += dt; if (g.t >= g.max) { prAddFlame(g.x, g.floor, 1.8); prFx.geysers.splice(i, 1); continue; }
    if (Math.random() < dt * 40) parts.push({ x: g.x + rnd(-4, 4), y: g.floor - rnd(10, 80) * Math.min(1, g.t * 3), vx: rnd(-60, 60), vy: rnd(-160, -60), g: 500, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#ffd070' : '#ff6a1a', size: Math.random() < 0.3 ? 2 : 1, glow: true });
    if (!g.hit && !pl.dead && Math.abs(pcx - g.x) < 9 && feet > g.floor - 84 * Math.min(1, g.t * 3)) { g.hit = true; if (prBurn(ET.principecaos.dmg * 0.8, g.x) === 'hit') pl.vy = -320; }
  }
  // meteors
  for (let i = prFx.meteors.length - 1; i >= 0; i--) {
    const m = prFx.meteors[i];
    if (m.warn > 0) { m.warn -= dt; if (m.warn <= 0) sfx.prMeteor(); continue; }
    m.x += m.vx * dt; m.y += m.vy * dt;
    if (Math.random() < dt * 40) parts.push({ x: m.x + rnd(-2, 2), y: m.y + rnd(-2, 2), vx: rnd(-20, 20), vy: rnd(-30, 10), g: 0, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#3a2420' : '#ff9a2a', size: 2, glow: Math.random() < 0.4 });
    if (m.y >= m.floor - 3) {
      burst(m.tx, m.floor - 3, 24, '#ffb040', 150, 300, 0.6, 1, true); burst(m.tx, m.floor - 3, 10, '#3a2420', 100, 300, 0.7); shake(3); sfx.prImpact();
      prAddFlame(m.tx - 4, m.floor, 2.2); prAddFlame(m.tx + 5, m.floor, 2);
      if (!pl.dead && Math.abs(pcx - m.tx) < 15 && feet > m.floor - 26) prBurn(ET.principecaos.dmg * 0.7, m.tx);
      prFx.meteors.splice(i, 1);
    }
  }
  // portals
  for (let i = prFx.portals.length - 1; i >= 0; i--) {
    const p = prFx.portals[i]; p.t += dt;
    if (Math.random() < dt * 20) parts.push({ x: p.x + rnd(-8, 8), y: p.y + rnd(-18, 18), vx: rnd(-20, 20), vy: rnd(-30, 30), g: 0, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#c4489a' : '#ee86c0', size: 1, glow: true });
    if (!p.spawned && p.t > 0.9) { p.spawned = true; if (bossFight && bossFight.pr) prSpawnFrom(p); }
    if (p.t >= p.life) prFx.portals.splice(i, 1);
  }
  for (let i = prFx.arcs.length - 1; i >= 0; i--) { const a = prFx.arcs[i]; a.t -= dt; if (a.t <= 0) prFx.arcs.splice(i, 1); }
});
// no damage while he rises from the throne; struck hard while stuck after a dive; nothing stops his blows; your blows burn
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && e.type === 'principecaos' && e.state === 'stuck') mult = (mult || 1) * 1.5;
  const hp0 = e ? e.hp : 0, r = _hit(e, dir, mult, melee);
  if (e && e.type === 'principecaos') { e.stun = 0; if (!e.flying && e.state !== 'walk' && e.state !== 'dash') e.vx = 0; }
  if (e && melee && !e.dead) prInfernoHit(e, hp0);
  return r;
}; }
// his blows throw you back
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const r = _hp(dmg, srcX, src, isProj);
  if (r === 'hit' && src && src === prBoss && !pl.dead) { const d = Math.sign(pl.x + pl.w / 2 - (src.x + src.w / 2)) || src.facing; pl.vx = d * (src.state === 'dash' ? 380 : 300); pl.vy = Math.min(pl.vy, -200); }
  return r;
}; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  prRoar() { tone(70, 1.3, 'sawtooth', 0.06, -20); tone(104, 1.1, 'square', 0.03, -30, 0.05); noise(1.2, 0.06, 400, 'lowpass'); },
  prGate() { tone(90, 0.5, 'sawtooth', 0.05, -20); noise(0.5, 0.06, 700, 'bandpass'); tone(330, 0.4, 'triangle', 0.02, -120, 0.1); },
  prCharge() { tone(180, 0.6, 'sawtooth', 0.025, 200); noise(0.6, 0.03, 2600, 'highpass'); },
  prSwing() { noise(0.35, 0.09, 1400, 'bandpass'); tone(120, 0.3, 'sawtooth', 0.04, -60); },
  prDash() { noise(0.9, 0.06, 900, 'lowpass'); tone(90, 0.8, 'sawtooth', 0.03, 40); },
  prInhale() { noise(0.7, 0.04, 1800, 'highpass'); },
  prBreath() { noise(0.6, 0.08, 600, 'lowpass'); tone(160, 0.4, 'sawtooth', 0.02, -80); },
  prPortal() { tone(220, 0.9, 'triangle', 0.035, -150); tone(330, 0.9, 'sine', 0.025, 220, 0.1); noise(0.8, 0.03, 1200, 'bandpass'); },
  prRumble() { noise(1.0, 0.07, 160, 'lowpass'); tone(48, 0.9, 'sawtooth', 0.04, -10); },
  prGeyser() { noise(0.6, 0.08, 500, 'lowpass'); tone(110, 0.4, 'square', 0.02, 160); },
  prMeteor() { tone(900, 0.5, 'sine', 0.025, -700); },
  prImpact() { noise(0.45, 0.1, 300, 'lowpass'); tone(60, 0.4, 'sawtooth', 0.05, -20); },
  prWings() { noise(0.22, 0.05, 500, 'lowpass'); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.principe = { dead: prState.dead }; return o; }; }
// a world made again (a new seed) has its prince back
{ const _ms = migrateSave; migrateSave = function (v) { const sd = v && v.seed, r = _ms(v); if (r && typeof r.seed === 'number' && r.seed !== sd) r.principe = null; return r; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) { prBoss = null; prDressed = false; prFx.gates.length = 0; prClear(); const r = _nw(sd, sv); prState.dead = !!(sv && sv.principe && sv.principe.dead); return r; }; }
