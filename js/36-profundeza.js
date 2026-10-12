'use strict';

/* ================= the third layer: deep rock blocks behind the back wall =================
   Underground there are three layers of blocks: the ones you walk on and break (tiles), the back
   wall (walls), and behind it the deep layer (DEEPT), its own grid of blocks with their own rocks:
   rocha antiga up top, ardósia funda in the deep caves, basalto in the abyss, with fossils and
   dim crystal veins, and hollows here and there. The back wall is torn open in the big caverns so
   the deep blocks show through. Everything comes from world generation (buildDepth, called at the
   end of generate) from the seed alone, so saves don't store it and old saves load the same.
   It is decoration: nothing collides with it, and light and monsters still treat it as back wall.
   It is drawn into the chunk images like the other two layers, so a frame costs nothing extra. */

const DEPTH_THR = 0.77;                 // openness above this tears the back wall open
let DF = null, FAR = null, DEEPT = null; // per tile openness, "an opening reaches this tile", deep block type
const depthCache = new Map();           // tile index -> its pixel codes (null: no opening there); the openings never change

// deep block types (0 = hollow)
const DP_ANTIGA = 1, DP_ARDOSIA = 2, DP_BASALTO = 3, DP_FOSSIL = 4, DP_CRISTAL = 5;
const DEEP_NAMES = ['', 'Rocha antiga', 'Ardósia funda', 'Basalto', 'Pedra fóssil', 'Veio de cristal apagado'];

// value noise that repeats around the world (period = WW tiles)
// the lattice values are kept per (cells, seed) and lattice row, filled as they are first read (2026-10-12: the
// world got 3x taller and this was the slowest thing in generation); the cache is emptied around each generate
// the lattice rows of each (cells, seed), found through a small open hash table (a Map with number keys was most of the cost)
const NZH = 4096, NZH_C = new Float64Array(NZH), NZH_S = new Int32Array(NZH), NZH_R = new Array(NZH); let nzhN = 0;
function nzClear() { NZH_C.fill(0); NZH_R.fill(undefined); nzhN = 0; }
function nzRows(cells, s) {
  s |= 0; let h = Math.imul(s ^ Math.imul(cells | 0, 0x45d9f3b), 0x9e3779b1) >>> 20;
  for (;;) {
    const c = NZH_C[h];
    if (c === cells && NZH_S[h] === s) return NZH_R[h];
    if (c === 0) { if (++nzhN > NZH * 0.7) { nzClear(); return nzRows(cells, s); } NZH_C[h] = cells; NZH_S[h] = s; return NZH_R[h] = []; }
    h = (h + 1) & (NZH - 1);
  }
}
function nzRow(rows, j, cells, s) { let r = rows[j]; if (!r) { r = rows[j] = new Float64Array(cells); for (let a = 0; a < cells; a++) r[a] = hash2(a, j, s); } return r; }
function depthNz(x, y, cells, s) {
  cells *= WSC;   // same feature size whatever the world width
  const f = x / WW * cells, ix = Math.floor(f), ux = sm3(f - ix), g = y / (WW / cells), iy = Math.floor(g), uy = sm3(g - iy);
  const a0 = ((ix % cells) + cells) % cells, a1 = a0 + 1 === cells ? 0 : a0 + 1;
  let A, B, C, D;
  if (iy >= 0) { const rows = nzRows(cells, s), r0 = nzRow(rows, iy, cells, s), r1 = nzRow(rows, iy + 1, cells, s); A = r0[a0]; B = r0[a1]; C = r1[a0]; D = r1[a1]; }
  else { A = hash2(a0, iy, s); B = hash2(a1, iy, s); C = iy + 1 >= 0 ? nzRow(nzRows(cells, s), iy + 1, cells, s)[a0] : hash2(a0, iy + 1, s); D = iy + 1 >= 0 ? nzRow(nzRows(cells, s), iy + 1, cells, s)[a1] : hash2(a1, iy + 1, s); }
  return A + (B - A) * ux + (C - A) * uy + (A - B - C + D) * ux * uy;
}
// the same noise for a whole row (x = 0..WW-1) into out: what buildDepth needs for every tile, without the per call cost
function depthNzRow(y, cells, s, out) {
  cells *= WSC;
  const g = y / (WW / cells), iy = Math.floor(g), uy = sm3(g - iy), rows = nzRows(cells, s), r0 = nzRow(rows, iy, cells, s), r1 = nzRow(rows, iy + 1, cells, s);
  for (let x = 0; x < WW; x++) {
    const f = x / WW * cells, ix = Math.floor(f), ux = sm3(f - ix), a0 = ix % cells, a1 = a0 + 1 === cells ? 0 : a0 + 1;
    const A = r0[a0], B = r0[a1], C = r1[a0], D = r1[a1];
    out[x] = A + (B - A) * ux + (C - A) * uy + (A - B - C + D) * ux * uy;
  }
  return out;
}
{ const _g = generate; generate = function (sd) { nzClear(); try { return _g.apply(this, arguments); } finally { nzClear(); } }; }

// yA: only from this row down (a layer generated later, js/312); the rows above stay as they are
function buildDepth(yA = 0, yB = WH) {   // yB: down to this row (the rows below are not generated yet)
  const NN = WW * WH;
  if (!yA || !DF || DF.length !== NN) { yA = 0; DF = new Float32Array(NN).fill(-1); FAR = new Uint8Array(NN); DEEPT = new Uint8Array(NN); }
  else { DF.fill(-1, yA * WW); FAR.fill(0, yA * WW); DEEPT.fill(0, yA * WW); }
  depthCache.clear(); deepCache.clear();
  // how open the rock around each tile is (a wide window), so the big caverns open up and narrow tunnels stay walled
  // (summed from the first row the window can reach; 32 bits, a 16 bit sum wrapped around in the tall world)
  const RX = 6, RY = 4, ys = Math.max(0, yA - RY - 1), air = new Int32Array((WW + 1) * (WH + 1)), W1 = WW + 1;
  for (let y = ys, ye = Math.min(WH, yB + RY + 1); y < ye; y++) { let run = 0; for (let x = 0; x < WW; x++) { const i = y * WW + x; run += !SOLID[tiles[i]] && walls[i] ? 1 : 0; air[(y + 1) * W1 + x + 1] = air[y * W1 + x + 1] + run; } }
  const box = (x0, y0, x1, y1) => air[y1 * W1 + x1] - air[y0 * W1 + x1] - air[y1 * W1 + x0] + air[y0 * W1 + x0];
  const openAt = (x, y) => {
    const y0 = Math.max(0, y - RY), y1 = Math.min(WH, y + RY + 1); let n = 0;
    const xa = x - RX, xb = x + RX + 1;
    if (xa < 0) n = box(0, y0, xb, y1) + box(WW + xa, y0, WW, y1);
    else if (xb > WW) n = box(xa, y0, WW, y1) + box(0, y0, xb - WW, y1);
    else n = box(xa, y0, xb, y1);
    return n / ((xb - xa) * (y1 - y0));
  };
  const nA = new Float64Array(WW), nB = new Float64Array(WW);
  for (let y = yA, ye = Math.min(WH - 8, yB); y < ye; y++) { depthNzRow(y, 25, seed ^ 0x6d31, nA); depthNzRow(y, 60, seed ^ 0x6d32, nB); for (let x = 0; x < WW; x++) {
    const i = y * WW + x, w = walls[i];
    if (!w || w === 4 || y < surf[x] + 13 || y > WH - 9) continue;
    const n = nA[x] * 0.65 + nB[x] * 0.35;
    const k = clamp((y - surf[x] - 13) / 10, 0, 1);       // the openings ease in below the surface
    DF[i] = (n * 0.62 + openAt(x, y) * 0.62 + clamp((y - Z1) / 400, -0.05, 0.08)) * k;
  } }
  // tiles an opening (or its rim) can reach
  for (let y = Math.max(1, yA + 1), ye = Math.min(WH - 1, yB); y < ye; y++) for (let x = 0; x < WW; x++) {
    let m = -1; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = DF[(y + dy) * WW + wrapX(x + dx)]; if (v > m) m = v; }
    if (m > DEPTH_THR - 0.09) FAR[y * WW + x] = 1;
  }
  buildDeepTiles(yA, yB);
}

// is the back wall open at this world pixel? bilinear openness between tile centres, plus a little grain on the edge
function depthOpen(X, Y) {
  const fx = X / T - 0.5, fy = Y / T - 0.5, ix = Math.floor(fx), iy = Math.floor(fy), ux = fx - ix, uy = fy - iy;
  if (iy < 0 || iy >= WH - 1) return false;
  const x0 = wrapX(ix), x1 = wrapX(ix + 1), r0 = iy * WW, r1 = r0 + WW;
  const a = DF[r0 + x0], b = DF[r0 + x1], c = DF[r1 + x0], d = DF[r1 + x1];
  const f = a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  if (f < DEPTH_THR - 0.035) return false; if (f > DEPTH_THR + 0.035) return true;
  return f + (hash2(X >> 1, Y >> 1, 977) - 0.5) * 0.02 + (hash2(X >> 2, Y >> 2, 978) - 0.5) * 0.045 > DEPTH_THR;
}

// per pixel of one tile: 0 back wall, 1 its cut edge, 2/3 the lip seen on the wall below an opening,
// 10 + n an opening, n = how deep the wall above shades it
const DEPTH_M = 5, DEPTH_GW = T + 2, DEPTH_GH = T + DEPTH_M + 1, depthG = new Uint8Array(DEPTH_GW * DEPTH_GH), depthOut = new Uint8Array(T * T);   // 5 px above for the shade, 1 px around for the edge
function depthTile(gx, gy) {
  const key = gy * WW + gx; let c = depthCache.get(key);
  if (c === undefined) { c = depthTileCalc(gx, gy); depthCache.set(key, c && c.slice()); }
  return c;
}
function depthTileCalc(gx, gy) {
  const X0 = gx * T - 1, Y0 = gy * T - DEPTH_M; let any = 0;
  for (let j = 0; j < DEPTH_GH; j++) for (let i = 0; i < DEPTH_GW; i++) { const o = depthOpen(X0 + i, Y0 + j) ? 1 : 0; depthG[j * DEPTH_GW + i] = o; any |= o; }
  if (!any) return null;
  for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
    const g = (py + DEPTH_M) * DEPTH_GW + px + 1;
    if (depthG[g]) { let n = 0; while (n < 5 && depthG[g - (n + 1) * DEPTH_GW]) n++; depthOut[py * T + px] = 10 + (5 - n); continue; }
    if (depthG[g - DEPTH_GW]) depthOut[py * T + px] = depthG[g - DEPTH_GW * 2] ? 2 : 1;
    else if (depthG[g - 1] || depthG[g + 1] || depthG[g + DEPTH_GW]) depthOut[py * T + px] = 1;
    else if (depthG[g - DEPTH_GW * 2] && depthG[g - DEPTH_GW * 3]) depthOut[py * T + px] = 3;
    else depthOut[py * T + px] = 0;
  }
  return depthOut;
}

/* ---------- the deep blocks: generated from the seed ---------- */
function buildDeepTiles(yA = 0, yB = WH) {
  const zb = (x, y, s) => (depthNz(x, y, 30, seed ^ s) - 0.5) * 10;
  const nA = new Float64Array(WW), nB = new Float64Array(WW), nC = new Float64Array(WW);
  for (let y = yA, ye = Math.min(WH, yB); y < ye; y++) {
    // row by row (same values as depthNz per tile); the band edges (zb) only matter near Z1/Z2, so they stay per tile
    depthNzRow(y, 50, seed ^ 0x7e01, nA); depthNzRow(y, 100, seed ^ 0x7e02, nB); depthNzRow(y, 75, seed ^ 0x7e06, nC);
    for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (y < surf[x] + 3) continue;
      // hollows: a far cave system of its own, a little sparser than the near one
      if (nA[x] * 0.7 + nB[x] * 0.3 > 0.66) continue;
      let t = y < Z1 + 6 - 5 ? DP_ANTIGA : y < Z1 + 6 + 5 && y < Z1 + 6 + zb(x, y, 0x7e03) ? DP_ANTIGA : y < Z2 - 5 ? DP_ARDOSIA : y < Z2 + 5 && y < Z2 + zb(x, y, 0x7e04) ? DP_ARDOSIA : DP_BASALTO;
      const h = hash2(x, y, seed ^ 0x7e05);
      if (t !== DP_BASALTO && h < 0.022) t = DP_FOSSIL;
      else if (t !== DP_ANTIGA && nC[x] > 0.8 && h < 0.5) t = DP_CRISTAL;
      DEEPT[i] = t;
    }
  }
}

// textures, baked once like the other materials (seamless 240x240)
function vAntiga(x, y) {   // big rough stones packed together
  const cs = 8, gx = Math.floor(x / cs), gy = Math.floor(y / cs); let d1 = 99, d2 = 99, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = gx + i, cy = gy + j, wx = ((cx % 30) + 30) % 30, wy = ((cy % 30) + 30) % 30;
    const px = cx * cs + hash2(wx, wy, 131) * cs, py = cy * cs + hash2(wx, wy, 132) * cs, d = Math.hypot(x - px, (y - py) * 1.2);
    if (d < d1) { d2 = d1; d1 = d; id = hash2(wx, wy, 133); } else if (d < d2) d2 = d;
  }
  if (d2 - d1 < 1.1) return 0.35;
  let v = 2.2 + (id - 0.5) * 1.1 + (hash2(x, y, 134) - 0.5) * 0.7 + (pn(x, y, 60, 60, 135) - 0.5) * 0.6;
  if (d2 - d1 < 2.2) v += 0.7;              // the rounded top of each stone catches a little light
  return v - d1 * 0.06;
}
function vArdosia(x, y) {  // thin slate plates in tilted layers
  const w = pn(x, y, 12, 30, 141) * 7, ly = (y + w + x * 0.08) % 5;
  let v = 2.3 + (pn(x, y, 48, 120, 142) - 0.5) * 1.5 + (hash2(x, y, 143) - 0.5) * 0.5;
  if (ly < 0.9) v -= 1.3; else if (ly < 1.9) v += 0.9;
  if (hash2(Math.floor(x / 9), Math.floor((y + w) / 5), 144) < 0.08 && ly > 2) v -= 0.6;
  return v;
}
function vBasalto(x, y) {  // tall columns, each a slightly different shade, broken by cross cracks
  const cw = 6, c = Math.floor(x / cw), lx = x - c * cw, cid = c % (TP / cw), off = (hash2(cid, 0, 151) * 40) | 0, len = 14 + ((hash2(cid, 1, 151) * 12) | 0), ly = (y + off) % len;
  if (lx === cw - 1) return 0.3;
  if (ly === 0) return 0.6;
  let v = 2.2 + (hash2(cid, Math.floor((y + off) / len), 152) - 0.5) * 1.1 + (hash2(x, y, 153) - 0.5) * 0.5;
  if (lx === 0) v += 1.0; else if (lx === cw - 2) v -= 0.6;
  if (ly === 1) v += 0.6;
  return v;
}
pal('deepAntiga', ['#0e0b0c', '#181416', '#211b1e', '#2b2427', '#362e31', '#433a3d']);
pal('deepArdosia', ['#0a0c12', '#11151d', '#191f29', '#212935', '#2a3443', '#364254']);
pal('deepBasalto', ['#0b0910', '#130f1a', '#1b1524', '#241c30', '#2f253d', '#3b2f4c']);
const BKD = { antiga: bake(vAntiga), ardosia: bake(vArdosia), basalto: bake(vBasalto) };
const DMAT = [null, [PALS.deepAntiga, BKD.antiga], [PALS.deepArdosia, BKD.ardosia], [PALS.deepBasalto, BKD.basalto]];   // fossils and crystal veins sit in the rock of their depth
const DEEP_HOLLOW = ph('#040306');
// shade a packed colour toward the dark of the far rock (s = 0..5)
const DSH = new Map();
function deepShade(c, s) {
  if (s <= 0) return c; s = Math.min(6, Math.round(s * 2) / 2); const k = c * 16 + s * 2; let r = DSH.get(k); if (r !== undefined) return r;
  const f = Math.max(0.12, 1 - s * 0.17), R = c & 255, G = (c >>> 8) & 255, B = (c >>> 16) & 255;
  r = pack((3 + (R - 3) * f) | 0, (2 + (G - 2) * f) | 0, (6 + (B - 6) * f) | 0); DSH.set(k, r); return r;
}
// small accents: fossil shells and crystal shards (dim, they are far back)
const DEEP_BONE = ['#2c2820', '#423c30', '#5a5240'].map(h => ph(h)), DEEP_CRY = ['#2a1e44', '#45306e', '#6a50a0'].map(h => ph(h));
const FOSSILS = [
  ['............', '............', '....111.....', '...12221....', '..1231121...', '..123.3121..', '..12.3.121..', '..1231.21...', '...12221....', '....111.....', '............', '............'],
  ['............', '............', '..1.....1...', '..21...12...', '...2111211..', '..1232232...', '...2111211..', '..21...12...', '..1.....1...', '............', '............', '............']
];
const DEEP_SHARD = ['............', '.......1....', '......12....', '..1...121...', '..21..1231..', '..121.1231..', '..1231.121..', '...121.1....', '....1.......', '............', '............', '............'];

// the colour of one pixel of the deep layer at world tile (gx, gy), local pixel (px, py), shaded by s;
// each deep block is painted once and kept (it never changes), so redrawing a chunk after mining stays cheap
const deepCache = new Map();
function deepPix(gx, gy, px, py, s) {
  const key = gy * WW + wrapX(gx); let a = deepCache.get(key);
  if (!a) { a = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) a[y * T + x] = deepPixRaw(gx, gy, x, y); deepCache.set(key, a); }
  return deepShade(a[py * T + px], s);
}
function deepPixRaw(gx, gy, px, py) {
  const s = 0;
  const i = gy * WW + wrapX(gx), t = DEEPT[i];
  if (!t) return deepShade(DEEP_HOLLOW, s);
  const dt = (x, y) => y < 0 || y >= WH ? 1 : DEEPT[y * WW + wrapX(x)];
  const up = dt(gx, gy - 1), dn = dt(gx, gy + 1), lf = dt(gx - 1, gy), rt = dt(gx + 1, gy);
  const ul = px + py, ur = (T - 1 - px) + py, dl = px + (T - 1 - py), dr = (T - 1 - px) + (T - 1 - py);
  if ((!up && !lf && ul < 2) || (!up && !rt && ur < 2) || (!dn && !lf && dl < 2) || (!dn && !rt && dr < 2)) return deepShade(DEEP_HOLLOW, s);
  const M = DMAT[t <= DP_BASALTO || (t > DP_CRISTAL && DMAT[t]) ? t : gy < Z1 + 6 ? DP_ANTIGA : gy < Z2 ? DP_ARDOSIA : DP_BASALTO] || DMAT[DP_ANTIGA], P = M[0], X = gx * T + px, Y = gy * T + py, tk = (Y % TP) * TP + (X % TP);
  const eu = up ? 99 : py, ed = dn ? 99 : T - 1 - py, el = lf ? 99 : px, er = rt ? 99 : T - 1 - px, e = Math.min(eu, ed, el, er);
  if (e === 0) return deepShade(P[0], s);
  let v = M[1].v[tk];
  // each deep block shows its own edges a little, so the layer reads as blocks
  if (py === 0 && up) v += 0.7; else if (py === T - 1 && dn) v -= 0.9;
  if (px === 0 && lf) v += 0.4; else if (px === T - 1 && rt) v -= 0.5;
  if (eu === 1) v += 1.4; else if (eu === 2) v += 0.5;
  if (ed === 1) v -= 1; if (el === 1 || er === 1) v -= 0.3;
  let c = shadeOf(P, v);
  if (t === DP_FOSSIL || t === DP_CRISTAL) {
    const art = t === DP_CRISTAL ? DEEP_SHARD : FOSSILS[(hash2(gx, gy, 161) * 2) | 0], flip = hash2(gx, gy, 162) < 0.5;
    const ch = art[py][flip ? T - 1 - px : px];
    if (ch !== '.' && (t === DP_FOSSIL || hash2(gx, gy, 163) < 0.45)) c = (t === DP_CRISTAL ? DEEP_CRY : DEEP_BONE)[+ch - 1];
  }
  return deepShade(c, s);
}
