'use strict';

/* ================= tiles ================= */
const AIR = 0, DIRT = 1, GRASS = 2, STONE = 3, DEEP = 4, COPPER = 5, IRON = 6, GOLD = 7, CRYSTAL = 8, BEDROCK = 9, LAVA = 10, TRUNK = 11, LEAVES = 12, TORCH = 13, SHROOM = 14, TUFT = 15, FLOWER = 16, BONES = 19, PLANK = 20, CRYPT = 21, CANDLE = 22, CHAIN = 23, WEB = 24, BANNER = 25, GATE = 26, URN = 27, ALTAR = 28, COAL = 29;
const NT = 192;   // tile ids 17 and 18 were the loot chests (removed 2026-10-10), leave them unused; tile ids: 30-53 cathedral, 54-73 caves (js/52-caverna-api.js), 74-93 ice (69), 94-117 mine (79), 118-122 herbs (94), 123 ice coal, 128-152 abyss (103), 153-156 gems (117), 157-167 the same gems in another layer's rock (117)
const SOLID = new Uint8Array(NT), BLOCKY = new Uint8Array(NT), EMIT = new Float32Array(NT), DIG = new Float32Array(NT), ORE_XP = new Uint8Array(NT);
[DIRT, GRASS, STONE, DEEP, COPPER, IRON, GOLD, CRYSTAL, BEDROCK, PLANK, CRYPT, COAL].forEach(t => { SOLID[t] = 1; BLOCKY[t] = 1; });
SOLID[GATE] = 1;
BLOCKY[LEAVES] = 1; BLOCKY[LAVA] = 1;
EMIT[TORCH] = 1.0; EMIT[CANDLE] = 0.85; EMIT[ALTAR] = 0.55; EMIT[SHROOM] = 0.55; EMIT[CRYSTAL] = 0.62; EMIT[LAVA] = 0.95;
DIG[DIRT] = 0.26; DIG[GRASS] = 0.26; DIG[STONE] = 0.55; DIG[DEEP] = 0.8; DIG[COPPER] = 0.7; DIG[IRON] = 0.85; DIG[GOLD] = 1.0; DIG[CRYSTAL] = 1.1; DIG[COAL] = 0.6;
DIG[TRUNK] = 0.45; DIG[PLANK] = 0.45; DIG[CRYPT] = 1.2; DIG[CANDLE] = 0.1; DIG[CHAIN] = 0.1; DIG[WEB] = 0.03; DIG[BANNER] = 0.08; DIG[URN] = 0.03; DIG[LEAVES] = 0.08; DIG[TORCH] = 0.05; DIG[SHROOM] = 0.05; DIG[TUFT] = 0.03; DIG[FLOWER] = 0.03; DIG[BONES] = 0.04;
ORE_XP[COPPER] = 3; ORE_XP[IRON] = 5; ORE_XP[GOLD] = 9; ORE_XP[CRYSTAL] = 14; ORE_XP[COAL] = 1;
const ORE_NAME = { [COAL]: 'Carvão', [COPPER]: 'Cobre', [IRON]: 'Ferro', [GOLD]: 'Ouro', [CRYSTAL]: 'Cristal' };
const ORE_PAL = { [COAL]: ['#000000', '#08080a', '#5a5a68'], [COPPER]: ['#9a4a22', '#e0884c', '#ffc08a'], [IRON]: ['#8c6a5e', '#d0aa98', '#f6e0d4'], [GOLD]: ['#a87808', '#f0c43a', '#fff3a0'], [CRYSTAL]: ['#6a32c0', '#b77bff', '#f0deff'] };
const PCOL = { [COAL]: '#2a2a30', [DIRT]: '#7a5236', [GRASS]: '#5dbb46', [STONE]: '#7a7c83', [DEEP]: '#3b4157', [COPPER]: '#e0884c', [IRON]: '#d0aa98', [GOLD]: '#f0c43a', [CRYSTAL]: '#b77bff', [TRUNK]: '#6e4628', [LEAVES]: '#3d8a38', [TORCH]: '#f6d36b', [SHROOM]: '#3fc7d6', [TUFT]: '#4fa244', [FLOWER]: '#e0505a', [BONES]: '#d8cfb8', [PLANK]: '#a06d3e', [CRYPT]: '#3a3446', [CANDLE]: '#c9a14a', [CHAIN]: '#6a6e78', [WEB]: '#c8c8d0', [BANNER]: '#7a1f2a', [URN]: '#8a5a3a' };

/* procedural materials, sampled in world pixels so big masses read as one continuous rock */
const PALS = {}, PALH = {};
function pal(name, hexes) { PALS[name] = hexes.map(h => ph(h)); PALH[name] = hexes; }
pal('dirt', ['#311f12', '#4a311f', '#61422b', '#775237', '#8d6343', '#a47651']);
pal('dirtW', ['#0f0a08', '#150f0c', '#1b1410', '#221914', '#2a1f19', '#33261f']);
pal('stone', ['#26262b', '#3c3d43', '#515359', '#66686f', '#7c7e86', '#9597a0']);
pal('stoneW', ['#111114', '#17171b', '#1d1e22', '#24252a', '#2b2c32', '#33353b']);
pal('deep', ['#171a26', '#232838', '#30364b', '#3d4560', '#4c5576', '#5e688c']);
pal('deepW', ['#08090e', '#0c0e15', '#10131c', '#151823', '#1a1e2b', '#202535']);
pal('bed', ['#060509', '#0c0b11', '#131118', '#1a1720', '#221e2a', '#2b2635']);
pal('lava', ['#6e1604', '#9c2a08', '#c8420b', '#e8641a', '#ff9a2a', '#ffd070']);
pal('grass', ['#173a16', '#235420', '#2f6d2a', '#3f8835', '#55a243', '#73bd57']);
pal('crypt', ['#0b0a0f', '#14121a', '#1d1a25', '#272331', '#332e3f', '#423b50']);
pal('cryptW', ['#050407', '#08070b', '#0b0a0f', '#0f0d14', '#13111a', '#18151f']);
pal('plank', ['#2a1a0e', '#4a2f19', '#6b4526', '#875a32', '#a06d3e', '#b98249']);
pal('leaf', ['#0c2412', '#16361c', '#1f4e28', '#2f6e34', '#4c9a42', '#8fce62']);
const PEB = [ph('#3a2c22'), ph('#7d6b58'), ph('#a08c74')];
const OREP = {}; for (const t of [COAL, COPPER, IRON, GOLD, CRYSTAL]) OREP[t] = ORE_PAL[t].map(h => ph(h));
// textures are baked once into seamless 240x240 tiles (20 blocks), so chunk drawing is just table lookups
const TP = 240;
const sm3 = t => t * t * (3 - 2 * t);
function pn(x, y, L, LY, s) { const fx = x / TP * L, fy = y / TP * LY, ix = Math.floor(fx), iy = Math.floor(fy), ux = sm3(fx - ix), uy = sm3(fy - iy); const w = (a, b) => hash2(a % L, b % LY, s); const A = w(ix, iy), B = w(ix + 1, iy), C = w(ix, iy + 1), D = w(ix + 1, iy + 1); return A + (B - A) * ux + (C - A) * uy + (A - B - C + D) * ux * uy; }
const shadeOf = (P, v) => P[v < 0 ? 0 : v > 5 ? 5 : v | 0];
let MATX = 0;
function vDirt(x, y) {
  let v = 2.35 + (pn(x, y, 40, 40, 1) - 0.5) * 2.3 + (pn(x, y, 108, 108, 2) - 0.5) * 1.0 + (hash2(x, y, 11) - 0.5) * 0.8;
  const gx = Math.floor(x / 5), gy = Math.floor(y / 5), h = hash2(gx, gy, 21);
  if (h < 0.15) {
    const cx = gx * 5 + 1 + Math.floor(hash2(gx, gy, 22) * 2), cy = gy * 5 + 1 + Math.floor(hash2(gx, gy, 23) * 2), dx = x - cx, dy = y - cy, big = h < 0.05;
    if (dx >= 0 && dy >= 0 && dx <= (big ? 2 : 1) && dy <= 1) { MATX = dx === 0 && dy === 0 ? PEB[2] : dy === 1 && dx > 0 ? PEB[0] : PEB[1]; return -9; }
  }
  if (hash2(x, y, 12) < 0.035) v -= 1.4;
  return v;
}
function vCobble(x, y) {
  const cs = 6, gy = Math.floor(y / cs), off = (gy & 1) * 3, gx = Math.floor((x + off) / cs) % (TP / cs), lx = (x + off) % cs, ly = y - gy * cs, h = hash2(gx, gy, 31);
  if (lx === cs - 1 || ly === cs - 1) return 0.2;
  if ((lx === 0 || lx === cs - 2) && (ly === 0 || ly === cs - 2)) return 1.1;
  let v = 2.1 + h * 1.5 + (hash2(x, y, 33) - 0.5) * 0.6;
  if (ly === 0 || lx === 0) v += 1.0; else if (ly === cs - 2 || lx === cs - 2) v -= 0.8;
  return v;
}
function vDeep(x, y) {
  let v = 2.4 + (pn(x, y, 17, 77, 3) - 0.5) * 2.6 + (hash2(x, y, 41) - 0.5) * 0.6;
  if (Math.abs(pn(x, y, 26, 26, 4) - 0.5) < 0.022) v -= 1.7;
  if (hash2(x, y, 42) < 0.012) v += 2;
  return v;
}
function vBed(x, y) { return 1.9 + (pn(x, y, 67, 67, 5) - 0.5) * 2.6 + (hash2(x, y, 51) - 0.5) * 0.7; }
function vLava(x, y) { return 2.8 + Math.sin(x * Math.PI * 2 * 14 / TP + pn(x, y, 24, 60, 6) * 7) * 0.9 + (pn(x, y, 72, 72, 7) - 0.5) * 1.4; }
function vLeaf(x, y) {
  const clump = pn(x, y, 30, 22, 8), fine = hash2(x, y, 61);
  let v = 3.05 + (clump - 0.5) * 1.7 + (pn(x, y, 70, 50, 18) - 0.5) * 0.8;
  if (fine > 0.92 && clump > 0.58) v = 5.4;
  else if (clump < 0.22) v -= 1.15;
  return v;
}
function vWallDirt(x, y) { let v = 2.6 + (pn(x, y, 26, 96, 9) - 0.5) * 2.2 + (pn(x, y, 96, 96, 10) - 0.5) * 0.9 + (hash2(x, y, 71) - 0.5) * 0.7; if (hash2(Math.floor(x / 5), Math.floor(y / 5), 72) < 0.1 && hash2(x, y, 73) < 0.5) v += 1; return v; }
// planks: boards two per block, staggered seams and a little grain
function vPlank(x, y) {
  const bh = 6, gy = Math.floor(y / bh), ly = y - gy * bh, off = (hash2(gy, 0, 91) * 24) | 0, lx = (x + off) % 24, bid = Math.floor((x + off) / 24);
  if (ly === bh - 1) return 0.45;
  if (lx === 23) return 0.75;
  let v = 2.7 + (hash2(bid, gy, 92) - 0.5) * 0.9 + (pn(x, y, 30, 240, 93) - 0.5) * 1.5 + (hash2(x, y, 94) - 0.5) * 0.4;
  if (ly === 0) v += 0.8;
  if (hash2(x >> 1, y, 95) < 0.015) v -= 1.3;
  return v;
}
// crypt: big dark bricks, staggered, with cracks here and there
function vCrypt(x, y) {
  const bh = 6, bw = 12, gy = Math.floor(y / bh), off = (gy & 1) * 6, gx = Math.floor((x + off) / bw) % (TP / bw), lx = (x + off) % bw, ly = y - gy * bh, h = hash2(gx, gy, 101);
  if (ly === bh - 1 || lx === bw - 1) return 0.3;
  let v = 2.3 + (h - 0.5) * 1.2 + (hash2(x, y, 102) - 0.5) * 0.6 + (pn(x, y, 48, 48, 103) - 0.5) * 0.8;
  if (ly === 0) v += 0.7; else if (ly === bh - 2) v -= 0.5;
  if (lx === 0) v += 0.4; else if (lx === bw - 2) v -= 0.3;
  if (h < 0.14 && Math.abs(lx - ly * 1.6 - 2 - h * 20) < 0.7) v -= 1.5;
  if (hash2(x, y, 104) < 0.012) v -= 1.2;
  return v;
}
function vWallDeep(x, y) { return 2.5 + (pn(x, y, 14, 67, 11) - 0.5) * 2.4 + (hash2(x, y, 81) - 0.5) * 0.6; }
function bake(fn) { const v = new Float32Array(TP * TP), xx = new Uint32Array(TP * TP); for (let y = 0; y < TP; y++) for (let x = 0; x < TP; x++) { MATX = 0; const r = fn(x, y), k = y * TP + x; if (r === -9) xx[k] = MATX; v[k] = r; } return { v, x: xx }; }
const BK = { dirt: bake(vDirt), cobble: bake(vCobble), deep: bake(vDeep), bed: bake(vBed), lava: bake(vLava), leaf: bake(vLeaf), wdirt: bake(vWallDirt), wdeep: bake(vWallDeep), plank: bake(vPlank), crypt: bake(vCrypt) };
/* ore nodes: every block is its own little composition painted over the host rock, shaded on ramps
   with light from the top-left like the rest of the terrain: faceted coal lumps joined by a seam,
   copper nuggets with verdigris, rusty iron with steel flecks, gold sitting in a quartz vein,
   crystal prisms that glow into the rock around them */
const ORE_RAMP = {}; const oreRamp = (t, hexes) => { ORE_RAMP[t] = hexes.map(h => ph(h)); };
oreRamp(COAL, ['#07070a', '#111117', '#1d1e27', '#2c2e3c', '#424659', '#666d88', '#c4ccea']);
oreRamp(COPPER, ['#3a1606', '#6e2e10', '#a8481c', '#d8692c', '#f4914a', '#ffc58a', '#fff2dc']);
oreRamp(IRON, ['#121318', '#2a2c35', '#474b58', '#6f7584', '#9ea5b4', '#ced4e0', '#ffffff']);
const RUST = ['#4a1c0c', '#7a3416', '#a84e22', '#cc6a30'].map(h => ph(h));
oreRamp(GOLD, ['#3a2504', '#7a4e06', '#b47e0e', '#e2ac22', '#f8d65a', '#fff2a6', '#ffffff']);
oreRamp(CRYSTAL, ['#1c0a38', '#3a1874', '#5c2cae', '#8a52e6', '#b88aff', '#e6d2ff', '#ffffff']);
const VERD = ['#123a30', '#1f5e4a', '#2f8a68', '#58b88e', '#9ae0bc'].map(h => ph(h));
const STEEL = ['#3e4048', '#5e616c', '#8e929e', '#c4c8d2', '#eef0f6'].map(h => ph(h));
const QUARTZ = ['#5e5c62', '#8e8c8e', '#b8b4ae', '#d8d4ca', '#eeeae0', '#fffdf6'].map(h => ph(h));
// the host rock's own ramp pushed toward a colour: soot, rust, verdigris, crystal glow
function tintPal(hexes, to, a) { const B = rgb(to); return hexes.map(h => { const A = rgb(h); return pack(lerp(A[0], B[0], a) | 0, lerp(A[1], B[1], a) | 0, lerp(A[2], B[2], a) | 0); }); }
const ramp = (R, l) => R[l < 0 ? 0 : l > R.length - 1 ? R.length - 1 : l | 0];
// a rounded lump with a ragged rim, lit from the top-left; facets > 0 cuts it into flat faces (coal)
function oreLump(L, cx, cy, rx, ry, R, s, facets) {
  const fo = hash2(s, 7, 1) * 6.28, fb = [];
  for (let i = 0; i < (facets || 0); i++) fb.push(hash2(s, i, 2));
  let best = -9, bx = 0, by = 0;
  for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
    if (x < 1 || y < 1 || x > 10 || y > 10) continue;
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.hypot(dx, dy) + (hash2(x + s * 3, y, 3) - 0.5) * 0.28;
    if (d > 1) continue;
    let l;
    if (facets) {
      const a = Math.atan2(dy, dx) + fo, f = ((a / 6.2832 * facets) % facets + facets) % facets | 0, fa = (f + 0.5) / facets * 6.2832 - fo;
      l = 2.5 - (Math.cos(fa) + Math.sin(fa)) * 1.5 + (fb[f] - 0.5) * 1.6 + (d < 0.38 ? 0.6 : 0);
    } else l = 2.7 - (dx + dy) * 1.15 - d * 0.7;
    l += (hash2(x + s, y, 4) - 0.5) * 0.7;
    L.put(x, y, ramp(R, Math.min(l, R.length - 2)), l);
    if (l > best) { best = l; bx = x; by = y; }
  }
  if (best > 3.4) L.put(bx, by, R[R.length - 1], best);
  return [bx, by];
}
// a slanted six-sided prism growing out of a root point; light face left, dark face right, bright ridge
function orePrism(L, rx0, ry0, ang, len, hw, R, s) {
  const ux = Math.sin(ang), uy = -Math.cos(ang), nx = -uy, ny = ux;
  for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
    const px = x + 0.5 - rx0, py = y + 0.5 - ry0, al = px * ux + py * uy, pe = px * nx + py * ny;
    if (al < -0.6 || al > len) continue;
    const w = hw * Math.min(1, (len - al) / (hw * 1.25));
    if (Math.abs(pe) > w + 0.15) continue;
    let l = pe < -0.35 ? 4.2 : pe > 0.35 ? 2.1 : 5.1;
    if (al > len - 1.6) l += 0.8; if (al < 1.2) l -= 1.2;
    l += (hash2(x + s, y, 5) - 0.5) * 0.5;
    L.put(x, y, ramp(R, Math.min(l, R.length - 2)), l);
  }
  const tx = Math.round(rx0 + ux * (len - 0.8) - 0.5), ty = Math.round(ry0 + uy * (len - 0.8) - 0.5);
  if (tx >= 1 && ty >= 1 && tx <= 10 && ty <= 10) L.put(tx, ty, R[R.length - 1], 9);
}
function oreLine(L, x0, y0, x1, y1, fn) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 | 0; for (let i = 0; i <= n; i++) { const x = Math.round(lerp(x0, x1, i / n)), y = Math.round(lerp(y0, y1, i / n)); if (x >= 1 && y >= 1 && x <= 10 && y <= 10) fn(x, y, i / n); } }
// one main node per block, off-centre, plus a couple of satellites, so a vein never reads as a grid
function oreNodes(L, s, R, k, main, sat, facets) {
  const pts = [], n = 1 + (hash2(s, 0, k) < 0.6 ? 2 : 1);
  for (let i = 0; i < n; i++) {
    const big = i === 0, r = big ? main : sat, cx = big ? 3.8 + hash2(s, i, k + 1) * 4.4 : 2.2 + hash2(s, i, k + 1) * 7.6, cy = big ? 3.8 + hash2(s, i, k + 2) * 4.4 : 2.2 + hash2(s, i, k + 2) * 7.6;
    pts.push(oreLump(L, cx, cy, r[0] + hash2(s, i, k + 3) * r[1], (r[0] + hash2(s, i, k + 4) * r[1]) * 0.85, R, s * 7 + i, facets && (big ? facets : 3)));
  }
  return pts;
}
const ORE_PAINT = {
  [COAL](L, s) {
    const R = ORE_RAMP[COAL], pts = oreNodes(L, s, R, 10, [3.2, 0.8], [1.4, 0.5], 5);
    // a thin seam running out of the main lump toward the block's edge
    const a = hash2(s, 2, 14) * 6.28, [x0, y0] = pts[0];
    oreLine(L, x0, y0, x0 + Math.cos(a) * 7, y0 + Math.sin(a) * 4, (x, y) => { if (!L.m[y * 12 + x] && hash2(x + s, y, 15) < 0.8) L.put(x, y, R[1], 1); });
  },
  [COPPER](L, s) {
    const R = ORE_RAMP[COPPER];
    oreNodes(L, s, R, 20, [2.7, 0.7], [1.3, 0.5]);
    // verdigris creeps over the shaded underside of the nuggets
    for (let k = 0; k < 144; k++) if (L.m[k] && L.l[k] < 2.3 && hash2(k, s, 25) < 0.45) L.put(k % 12, k / 12 | 0, VERD[1 + (hash2(k, s, 26) * 2.2 | 0)], L.l[k]);
  },
  [IRON](L, s) {
    const R = ORE_RAMP[IRON];
    oreNodes(L, s, R, 30, [2.9, 0.7], [1.3, 0.5]);
    // rust blooms on the shaded side; a few bright steel flecks on the lit side
    for (let k = 0; k < 144; k++) if (L.m[k]) { const h = hash2(k, s, 35); if (L.l[k] < 2 && h < 0.3) L.put(k % 12, k / 12 | 0, ramp(RUST, L.l[k] * 0.9 + h * 2), L.l[k]); else if (L.l[k] > 3 && h > 0.86) L.put(k % 12, k / 12 | 0, ramp(STEEL, 3 + h), L.l[k]); }
  },
  [GOLD](L, s) {
    const R = ORE_RAMP[GOLD], pts = oreNodes(L, s, R, 40, [2.1, 0.5], [1.1, 0.4]);
    // each nugget sits in a pocket of white quartz
    const q = new Uint8Array(144);
    for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
      if (L.m[y * 12 + x]) continue;
      let near = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < 12 && yy < 12 && L.m[yy * 12 + xx]) near = Math.max(near, Math.abs(dx) + Math.abs(dy) <= 1 ? 2 : Math.abs(dx) + Math.abs(dy) <= 2 ? 1 : near); }
      if (near === 2 || (near === 1 && hash2(x + s, y, 43) < 0.55)) q[y * 12 + x] = 1;
    }
    for (let k = 0; k < 144; k++) if (q[k]) { const x = k % 12, y = k / 12 | 0; L.put(x, y, ramp(QUARTZ, 3.2 - ((x - 5.5) + (y - 5.5)) * 0.18 + (hash2(x + s, y, 44) - 0.5) * 1.4 - (q[k - 1] && q[k - 12] ? 0 : -0.6) - (q[k + 1] && q[k + 12] ? 0 : 1.1)), 1); }
    // a sparkle on the main nugget
    const sp = pts[0];
    if (hash2(s, 7, 49) < 0.6) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const x = sp[0] + dx, y = sp[1] + dy; if (x >= 1 && y >= 1 && x <= 10 && y <= 10) L.put(x, y, R[5], 6); }
  },
  [CRYSTAL](L, s) {
    const n = 2 + (hash2(s, 1, 50) < 0.5), R = ORE_RAMP[CRYSTAL], bx = 3.8 + hash2(s, 2, 51) * 4.4, by = 8 + hash2(s, 3, 51) * 1.8, tilt = (hash2(s, 4, 51) - 0.5) * 0.7;
    // small ones first so the big prism sits in front
    for (let i = n - 1; i >= 0; i--) {
      const side = i === 0 ? 0 : i === 1 ? -1 : 1, ang = tilt + side * (0.55 + hash2(s, i, 53) * 0.4);
      const len = i === 0 ? 6.8 + hash2(s, i, 54) * 1.8 : 3.6 + hash2(s, i, 54) * 1.8, hw = i === 0 ? 1.6 + hash2(s, i, 55) * 0.4 : 1.0 + hash2(s, i, 55) * 0.3;
      orePrism(L, bx + side * 1.6, by, ang, len, hw, R, s * 17 + i);
    }
    for (let i = 0; i < 2; i++) { const x = 1 + (hash2(s, i, 56) * 10 | 0), y = 1 + (hash2(s, i, 57) * 10 | 0); if (!L.m[y * 12 + x]) L.put(x, y, R[3 + i], 1); }
  }
};
// the rock right around the ore: shadow under it, and a stain (soot, rust, verdigris, glow) fading out
const ORE_HALO = {
  [COAL]: { pal: ['stone', '#0a0a0e', 0.4, 0.15], shade: 0 },
  [COPPER]: { pal: ['stone', '#2f8a68', 0.26, 0.1], shade: 0 },
  [IRON]: { pal: ['stone', '#8a3f1c', 0.42, 0.18], shade: 0, drip: 1 },
  [GOLD]: { pal: ['stone', '#c8a040', 0.18, 0.06], shade: 0 },
  [CRYSTAL]: { pal: ['deep', '#8a4ae8', 0.38, 0.12], shade: 0.4 }
};
// ore blocks sit in rough, unworked rock instead of the cobble pattern, so a vein reads as its own face
function vOreRock(x, y) {
  let v = 2.2 + (pn(x, y, 30, 30, 201) - 0.5) * 2.0 + (pn(x, y, 90, 90, 202) - 0.5) * 0.9 + (hash2(x, y, 204) - 0.5) * 0.7;
  if (Math.abs(pn(x, y, 20, 20, 203) - 0.5) < 0.02) v -= 1.5;
  if (hash2(x, y, 205) < 0.02) v += 1.3;
  return v;
}
function bakeOre(t, base, hostName) {
  const B = bake(base), V = B.v, XX = B.x, H = ORE_HALO[t], T1 = tintPal(PALH[H.pal[0]], H.pal[1], H.pal[2]), T2 = tintPal(PALH[H.pal[0]], H.pal[1], H.pal[3]);
  const col = new Uint32Array(144), m = new Uint8Array(144), lv = new Float32Array(144);
  const OM = B.o = new Uint8Array(TP * TP);   // the ore itself, as opposed to the stained rock around it
  const L = { m, l: lv, put(x, y, c, l) { const k = y * 12 + x; col[k] = c; m[k] = 1; lv[k] = l; } };
  for (let gy = 0; gy < TP / T; gy++) for (let gx = 0; gx < TP / T; gx++) {
    col.fill(0); m.fill(0); lv.fill(0);
    ORE_PAINT[t](L, (gx * 31 + gy * 977 + t * 7919) | 0);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
      const k = (gy * T + y) * TP + gx * T + x, q = y * 12 + x;
      if (m[q]) { XX[k] = col[q]; OM[k] = 1; continue; }
      let d = 9, sh = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx > 11 || yy > 11 || !m[yy * 12 + xx]) continue;
        d = Math.min(d, Math.abs(dx) + Math.abs(dy) <= 1 ? 1 : 2);
        if (dy === -1 && dx >= -1 && dx <= 0) sh = 1;
      }
      if (H.drip && d > 2 && hash2(gx * 12 + x, 0, gy + t) < 0.3) for (let dy = 1; dy <= 4; dy++) if (y - dy >= 0 && m[(y - dy) * 12 + x]) { d = dy < 3 ? 1 : 2; break; }
      if (d > 2) continue;
      let v = V[k] + H.shade * (d === 1 ? 1 : 0.5); if (sh) v -= 1.1;
      if (x === 0 || y === 0 || x === 11 || y === 11) { V[k] = v - 0.4; continue; }
      XX[k] = shadeOf(d === 1 ? T1 : T2, v);
    }
  }
  return B;
}
for (const t of [COAL, COPPER, IRON, GOLD]) BK['o' + t] = bakeOre(t, vOreRock, 'stone');
BK['o' + CRYSTAL] = bakeOre(CRYSTAL, vDeep, 'deep');
const MAT = {
  [DIRT]: [PALS.dirt, BK.dirt], [GRASS]: [PALS.dirt, BK.dirt], [STONE]: [PALS.stone, BK.cobble], [DEEP]: [PALS.deep, BK.deep], [BEDROCK]: [PALS.bed, BK.bed], [LAVA]: [PALS.lava, BK.lava], [LEAVES]: [PALS.leaf, BK.leaf], [PLANK]: [PALS.plank, BK.plank], [CRYPT]: [PALS.crypt, BK.crypt],
  [COAL]: [PALS.stone, BK['o' + COAL]], [COPPER]: [PALS.stone, BK['o' + COPPER]], [IRON]: [PALS.stone, BK['o' + IRON]], [GOLD]: [PALS.stone, BK['o' + GOLD]], [CRYSTAL]: [PALS.deep, BK['o' + CRYSTAL]]
};
const WMAT = { 1: [PALS.dirtW, BK.wdirt], 2: [PALS.stoneW, BK.cobble], 3: [PALS.deepW, BK.wdeep], 4: [PALS.cryptW, BK.crypt] };
const texAt = (x, y) => (y % TP) * TP + (x % TP);
// a lone block (all sides exposed) as a little canvas: icons, the block in your hand, the placement preview
function blockCanvas(t, size, cut, X0, Y0) {
  const c = mk(size, size), x = c.getContext('2d'), img = x.createImageData(size, size), buf = new Uint32Array(img.data.buffer);
  const P = MAT[t][0], MV = MAT[t][1].v, MXX = MAT[t][1].x, OUT = P[0], E = size - 1;
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const ul = px + py, ur = E - px + py, dl = px + E - py, dr = E - px + E - py;
    if (ul < cut || ur < cut || dl < cut || dr < cut) continue;
    const q = py * size + px, k = texAt(X0 + px, Y0 + py);
    if (Math.min(px, py, E - px, E - py) === 0 || ul === cut || ur === cut || dl === cut || dr === cut) { buf[q] = OUT; continue; }
    if (MXX[k]) { buf[q] = MXX[k]; continue; }
    let v = MV[k]; if (py === 1) v += 1.7; else if (py === 2) v += 0.7; if (py === E - 1) v -= 1.2; else if (py === E - 2) v -= 0.4; if (px === 1 || px === E - 1) v -= 0.35;
    buf[q] = shadeOf(P, v);
  }
  x.putImageData(img, 0, 0); return c;
}

/* decorations (T x T pixel art, base on the bottom row) */
function rowsT(rows, palMap) { const a = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const ch = rows[y] && rows[y][x], c = ch && palMap[ch]; a[y * T + x] = c ? ph(c) : 0; } return a; }
const DECO = [];
DECO[TORCH] = [rowsT(["............", "............", "............", "............", "............", ".....yy.....", "....oWwo....", ".....Ww.....", "...iiWwii...", "...i.Ww.i...", ".....WW.....", "............"], { y: '#ffcf5a', w: '#9a6a3c', W: '#62401f', o: '#2a1a10', i: '#4a4a52' })];
DECO[SHROOM] = [
  rowsT(["............", "............", "............", "............", "............", "...cccc.....", "..cCcccc....", ".cccccccc...", "....ss...cc.", "....ss..cCcc", "....ss....s.", "...ssss..sss"], { c: '#3fc7d6', C: '#c8fbff', s: '#d6e4dc' }),
  rowsT(["............", "............", "............", "............", "............", "............", "..cc........", ".cCcc..ccc..", "..ss..cCccc.", "..ss...sss..", "..ss....s...", ".ssss..sss.."], { c: '#58e0b0', C: '#d4fff0', s: '#d6e4dc' })
];
DECO[TUFT] = [
  rowsT(["............", "............", "............", "............", "............", "............", "............", "..g......g..", ".gG..g..gG..", ".g.g.Gg.g.g.", "gG.gg.g.gG.g", "g.gGg.gg.g.g"], { g: '#55ad46', G: '#3a7d33' }),
  rowsT(["............", "............", "............", "............", "............", "............", "............", "......g.....", "..g..gG...g.", ".gG.g.g..gG.", ".g.gG.gg.g.g", "gg.g.gG.gg.g"], { g: '#4a9c3e', G: '#356f2e' })
];
DECO[FLOWER] = ['#e0505a', '#f0c43a', '#9a7cf0'].map(p => rowsT(["............", "............", "............", "............", "............", "....pp......", "...pYp......", "....pp......", "....g.......", "...gg.g..g..", "..g.gGg.gG..", ".gG.gg.gg.g."], { p, Y: '#fff2a8', g: '#4fa244', G: '#3a7d33' }));
DECO[BONES] = [
  rowsT(["............", "............", "............", "............", "............", "............", "............", "...ooo......", "..oxoxo.....", "..ooOoo...oo", ".oo.o.ooooOo", "oOooOOOoOOoo"], { o: '#d8cfb8', O: '#a89e86', x: '#1a1418' }),
  rowsT(["............", "............", "............", "............", "............", "............", "............", "............", "......ooo...", "oo...oxoxo..", "OoooooooOOo.", "ooOOoOOoooOo"], { o: '#d0c6ae', O: '#9e947c', x: '#1a1418' })
];
const TRUNK_P = { o: '#1a0e08', d: '#3a2412', m: '#6b4424', l: '#c4925a', k: '#120c08' };
const TRUNK_BARK = [
  "..odmmlmdo..",
  "..odmmlmdo..",
  "..odmkmldo..",
  "..odmmlmdo..",
  "..odmmlldo..",
  "..odmmlmdo..",
  "..okkmlmdo..",
  "..odmmlmdo..",
  "..odmmlldo..",
  "..odmmlmdo..",
  "..odmmlmdo..",
  "..odmmlmdo.."
];
const TRUNK_KNOT = [
  "..odmmlmdo..",
  "..odmmlldo..",
  "..odmmlmdo..",
  "..okkmldo...",
  "..odmmlmdo..",
  "..odmmlmdo..",
  "..odmkmldo..",
  "..odmmlldo..",
  "..odmmlmdo..",
  "..odmmlmdo..",
  "..odmmlldo..",
  "..odmmlmdo.."
];
const TRUNK_TOP = [
  ".ommmmmmmo..",
  "oodmmmlmdoo.",
  "..odmmlmdo..",
  "..odmmlldo..",
  "..odmkmldo..",
  "..odmmlmdo..",
  "..odmmlldo..",
  "..odmmlmdo..",
  "..odmkmldo..",
  "..odmmlmdo..",
  "..odmmlldo..",
  "..odmmlmdo.."
];
DECO[TRUNK] = [TRUNK_BARK, TRUNK_KNOT, TRUNK_TOP].map(rows => rowsT(rows, TRUNK_P));
DECO[CANDLE] = [rowsT(ART_CANDLE, ART_CANDLE_P), rowsT(ART_CANDLE2, ART_CANDLE2_P)];
DECO[CHAIN] = [rowsT(ART_CHAIN, ART_CHAIN_P), rowsT(ART_CHAIN_END, ART_CHAIN_END_P)];
DECO[BANNER] = [rowsT(ART_BANNER_T, ART_BANNER_T_P), rowsT(ART_BANNER_B, ART_BANNER_B_P)];
DECO[WEB] = [rowsT(ART_WEB, ART_WEB_P), rowsT(ART_WEB.map(r => r.split('').reverse().join('')), ART_WEB_P)];
DECO[URN] = [rowsT(ART_URN, ART_URN_P), rowsT(ART_URN2, ART_URN2_P)];
DECO[GATE] = [rowsT(ART_GATE, ART_GATE_P)];
DECO[ALTAR] = [rowsT(ART_ALTAR, ART_ALTAR_P)];
