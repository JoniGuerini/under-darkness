'use strict';

/* ================= the fungal mines: props =================
   Everything bigger than a block that dresses the Minas Fúngicas (docs/camadas/05-minas-fungicas.md, section 5).
   In the Galerias Tomadas the colony of Ferroalto as it was left: colonists fossilized where they sat, rotten
   bunks, a table with a lantern still burning over the colony's map, a tipped wheelbarrow, sacks of esporita, an
   anvil the mycelium took, the infirmary's stretchers; a pulley with its bucket and an empty canary cage from the
   roof; on the walls the gallery arches pushed crooked, a colonist sunk in the wall with only his face out, a house
   door boarded shut, the cracked "Ferroalto" sign. In the Bosque de Chapéus: small giant mushrooms (two sizes) whose
   gills light the halls, clumps of caps, a felled stump, a nest of brotos, big glowing spore clusters, curtains of
   threads, a shelf of bracket fungi. In the Grutas Alagadas: a plank boat stranded at the water's edge, heaps of
   rotten nets, fungal stalactites, colony lanterns with a glowing mushroom for a flame, exposed esporita. In the
   Coração do Micélio: a heart of mycelium on the floor that beats, body cocoons, thick mycelium pillars.
   Same painter as 81/105, but on the card's 6-tone ramps (section 12), lit from the top left, dark rim only where
   the sprite touches air. Mycelium is cream, never white; the colonists keep a little of their old colour under it.
   Registered with defProp (`fungo: true`), placed by 125 from FG_PROP_PLAN (same walk as 84's mnPlaceProps).
   Flags the generator must honour: `beira: true` stands only on the floor right at the water's edge (the boat).
   Props with one light per variation carry `luzV` (and an empty `luz`): the light wrapper at the end adds them.
   The floor heart beats (`anim: { k: 'fung_pulso' }`, drawn by the hooks at the end). */
const FG_PROP_PLAN = {};
// back-wall pieces that stand on the floor instead of hanging at eye height
const FG_BACK_FLOOR = { fg_arco: 1, fg_preso: 1, fg_porta: 1, fg_pilar: 1 };
let fungHeartCv = null;   // the heart's canvas, for its beat (hooks at the end)
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const RP = {
  // the card's ramps (section 12)
  xisto: R6(['#12181c', '#1e282e', '#2c3a40', '#3e5056', '#56686c', '#7a8c8c']),
  tomada: R6(['#1a2024', '#2e383a', '#4a5652', '#74807a', '#a8b2a6', '#d8e0d0']),
  humus: R6(['#120f14', '#1e1a22', '#2c2632', '#3c3444', '#504658', '#6a5e70']),
  tronco: R6(['#2a2a26', '#48463e', '#6e6a5c', '#9a9480', '#c4bca2', '#e6dec4']),
  chapeu: R6(['#0e2a2e', '#16444a', '#1e6a6e', '#3a9a94', '#7accc0', '#c4f4e6']),
  carne: R6(['#2a1a20', '#4a2c34', '#74464e', '#a0686c', '#c89490', '#ecc8bc']),
  esporita: R6(['#0c2a2a', '#145048', '#1e7a6a', '#34a890', '#6ad4b4', '#c8fce8']),
  agua: R6(['#061214', '#0a1e22', '#102c30', '#1a3e40', '#2a5654', '#467472']),
  // the props' own
  micelio: R6(['#2c2a22', '#4c483a', '#746e58', '#9e967a', '#c6bc9c', '#e2d8b8']),
  madeira: R6(['#120e0a', '#211a12', '#32281c', '#443726', '#584832', '#6c5a40']),
  ferro: R6(['#0c0e10', '#181c20', '#262c32', '#384046', '#4e585e', '#6a767a']),
  ferrugem: R6(['#1a0e08', '#2e180c', '#4a2612', '#66361a', '#824a24', '#9a6032']),
  latao: R6(['#22160a', '#3e2a10', '#5e4218', '#805c24', '#a27832', '#c29848']),
  vidro: R6(['#6a2a06', '#a04a0e', '#d4701a', '#f49a30', '#ffc060', '#ffe0a0']),
  papel: R6(['#28241a', '#443e2e', '#625a44', '#827860', '#a0967a', '#bcb294']),
  azul: R6(['#10141c', '#1a2230', '#263244', '#344458', '#46586c', '#5c6e80']),
  rubro: R6(['#1a0e0e', '#2e1818', '#462422', '#5e322e', '#76443c', '#8c584c']),
  pele: R6(['#1e1612', '#36281e', '#523c2c', '#6e523c', '#8a6a50', '#a48466']),
  couro: R6(['#150e0a', '#271a12', '#3a281c', '#4e3726', '#644832', '#7a5a40']),
  linho: R6(['#1a1d1c', '#2c312f', '#434a46', '#5c645e', '#78807a', '#949a92']),
  saco: R6(['#1a150e', '#2e2618', '#443a26', '#5a4e34', '#726444', '#8a7a56']),
  corda: R6(['#1c160e', '#32281a', '#4a3e28', '#625438', '#7c6c4a', '#94845e']),
  osso: R6(['#2a261e', '#463f34', '#665d4e', '#8a7f6a', '#aca088', '#c8bca2']),
  tijolo: R6(['#121614', '#1e2422', '#2c3532', '#3c4844', '#505e58', '#66766e']),
  lodo: R6(['#0c100e', '#161c19', '#202824', '#2a3430', '#3a4640', '#4c5a52']),
  esporo: R6(['#0e1a0a', '#1a3212', '#2a4e1a', '#447428', '#6e9e3c', '#a8cc68']),
  sombra: R6(['#030404', '#060808', '#0a0c0c', '#0e1212', '#131818', '#181e1e'])
};
const OUTLINE = ph('#05080a');

/* ---- the painter (81's, on 6 tones; it remembers each pixel's shade so a crust can keep the lighting) ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, ramps, idOf,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; },
    clear(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    is(x, y, R) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0 && ramps[rid[y * w + x]] === R; },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    box(x0, y0, rw, rh, R, s, base = 2.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.4 : j === 1 ? 0.5 : 0) + (i === 0 ? 0.6 : 0) - (j === rh - 1 ? 1.3 : 0) - (i === rw - 1 ? 0.9 : 0) + cg(x, y, s) * 0.5 + cn(x, y, 60, 60, s + 1) * 0.45); },
    blob(cx, cy, rx, ry, R, s, base = 2.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 - d * 0.5 + cg(x, y, s) * 0.4); } },
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
// paste painter Q into P at (ox, oy), turned by ang around Q's (px, py) (nearest pixel, shades kept)
function blit(P, Q, ox, oy, ang = 0, px = 0, py = 0) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.ceil(Math.hypot(Q.w, Q.h));
  for (let y = -m; y <= m; y++) for (let x = -m; x <= m; x++) {
    const dx = x + 0.5, dy = y + 0.5, u = Math.floor(dx * ca + dy * sa + px), v = Math.floor(-dx * sa + dy * ca + py);
    if (u < 0 || v < 0 || u >= Q.w || v >= Q.h) continue; const k = v * Q.w + u; if (!Q.c[k]) continue;
    P.put(ox + px + x, oy + py + y, Q.ramps[Q.rid[k]], Q.val[k]);
  }
}
// a thick curve: fn(t) -> [x, y], wd(t) its width; round in section, lit from the top left (105's)
function tube(P, fn, wd, R, s, base = 2.8, n = 0) {
  const [ax, ay] = fn(0), [bx, by] = fn(1); n = n || Math.ceil(Math.hypot(bx - ax, by - ay) * 3) + 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = fn(t), r = Math.max(0.5, wd(t) / 2);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      const dx = (xx + 0.5 - x) / r, dy = (yy + 0.5 - y) / r, d = dx * dx + dy * dy; if (d > 1) continue;
      P.put(xx, yy, R, base + 0.8 - (dx + dy) * 0.95 - d * 0.45 + cg(xx, yy, s) * 0.3);
    }
  }
}
// a plank: grain along its length, lit top and left edge, a nail at each end
function plank(P, x0, y0, len, thick, R, s, vert = false, base = 2.6) {
  for (let a = 0; a < len; a++) for (let b = 0; b < thick; b++) {
    const x = vert ? x0 + b : x0 + a, y = vert ? y0 + a : y0 + b;
    let v = base + (b === 0 ? 0.9 : b === thick - 1 ? -0.9 : 0) + Math.sin(a * 0.45 + b * 1.9 + s) * 0.3 + cg(x, y, s) * 0.45;
    if (a === 0 || a === len - 1) v -= 0.5;
    P.put(x, y, R, v);
  }
  if (len > 5 && thick > 1) { const n = vert ? [[x0 + (thick >> 1), y0 + 1], [x0 + (thick >> 1), y0 + len - 2]] : [[x0 + 1, y0 + (thick >> 1)], [x0 + len - 2, y0 + (thick >> 1)]]; for (const [x, y] of n) P.put(x, y, RP.ferrugem, 3.6); }
}
// the mycelium crust over what is painted: patches by noise (cover 0..1), bias(x, y) thickens it; the shading is kept
function overgrow(P, cover, s, bias, R = RP.micelio) {
  const me = P.idOf(R);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] === me) continue;
    const n = cn(x, y, 26, 26, s) + cn(x, y, 80, 80, s + 1) * 0.5 + (bias ? bias(x, y) : 0);
    if (n > 0.5 - cover) P.put(x, y, R, 1.2 + P.val[k] * 0.6 + cg(x, y, s + 2) * 0.6 + (n > 0.72 - cover ? 0.5 : 0));
  }
}
// loose fibres where the crust meets the air (up and to the sides)
function fuzz(P, s, p = 0.3, R = RP.micelio) {
  const me = P.idOf(R), add = [];
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    if (P.has(x, y)) continue;
    const near = [[0, 1], [1, 0], [-1, 0]].some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < P.w && yy < P.h && P.rid[yy * P.w + xx] === me; });
    if (near && hash2(x, y, s) < p) add.push(x, y);
  }
  for (let i = 0; i < add.length; i += 2) P.put(add[i], add[i + 1], R, 2 + hash2(add[i], add[i + 1], s + 1) * 1.4);
}
// a little mushroom: a cream stalk h tall from (x, by) up, a cap of r (1 or 2), the gills under it lit cyan
function sprout(P, x, by, h, s, r = 1, cap = RP.micelio, glow = 0) {
  for (let j = 0; j < h; j++) P.put(x, by - j, RP.tronco, 3 - j * 0.1 + cg(x, j, s) * 0.5);
  const cy = by - h;
  if (r < 2) {   // .##. over ####: a button cap, lit on its left
    for (let i = -1; i <= 2; i++) P.put(x + i, cy, cap, 3.2 - i * 0.5 + cg(x + i, cy, s) * 0.4);
    P.put(x, cy - 1, cap, 4.4); P.put(x + 1, cy - 1, cap, 3.6);
    if (glow) { P.put(x - 1, cy + 1, RP.chapeu, 3 + glow * 1.6); P.put(x + 2, cy + 1, RP.chapeu, 2.6 + glow * 1.4); }
  } else {       // a wider dome with gills under it
    for (let i = -2; i <= 2; i++) P.put(x + i, cy, cap, 2.8 - i * 0.4 + cg(x + i, cy, s) * 0.4);
    for (let i = -1; i <= 1; i++) P.put(x + i, cy - 1, cap, 3.8 - i * 0.5);
    P.put(x, cy - 2, cap, 4.4); P.put(x - 1, cy - 1, cap, 4.6);
    for (let i = -2; i <= 2; i++) if (i) P.put(x + i, cy + 1, RP.chapeu, 2.6 + glow * 1.8 - Math.abs(i) * 0.3);
  }
}
// a hanging thread of mycelium, swaying a little, a bead at its end
function thread(P, x, y0, len, s, R = RP.micelio, bead = null) {
  for (let j = 0; j < len; j++) { if (j > len * 0.6 && hash2(j, x, s) < 0.18) continue; P.put(x + Math.sin(j * 0.3 + s) * 0.45, y0 + j, R, 3 - j / len * 1.4 + cg(x, j, s) * 0.4); }
  if (bead) P.put(x + Math.sin(len * 0.3 + s) * 0.45, y0 + len, bead, 4.6);
}
// a bracket fungus (orelha-de-pau) on an upright face: a half-disc lit on top, a line of gills under it
function bracket(P, x, y, w, s, glow = 0, R = RP.tronco) {
  const hh = Math.max(1.6, w * 0.38);
  for (let yy = Math.floor(y - hh); yy <= y; yy++) for (let xx = Math.floor(x - w / 2); xx <= x + w / 2; xx++) {
    const dx = (xx + 0.5 - x) / (w / 2), dy = (yy + 0.5 - y) / hh; if (dx * dx + dy * dy > 1 || dy > 0) continue;
    P.put(xx, yy, R, 3 - dx * 0.7 - dy * 1.4 + cg(xx, yy, s) * 0.5 + ((xx + yy * 3) % 4 === 0 ? -0.5 : 0));
  }
  for (let xx = Math.ceil(x - w / 2 + 0.5); xx < x + w / 2 - 0.5; xx++) P.put(xx, y + 1, glow ? RP.chapeu : R, glow ? 3.4 + glow * 1.4 - Math.abs(xx + 0.5 - x) / w : 1.4);
}
// a lump of wet schist with flecks or plates of esporita
function oreLump(P, cx, cy, r, s, rich = 0.4) {
  P.blob(cx, cy, r, r * 0.8, RP.xisto, s, 2.4);
  for (let k = 0; k < r * 1.8; k++) { if (hash2(k, 9, s) > rich + 0.3) continue; const a = hash2(k, 1, s) * 6.28, d = hash2(k, 2, s) * r * 0.7; P.put(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, RP.esporita, 3.2 + hash2(k, 3, s) * 2.2); }
}
// a 3 x 5 letter (for the sign)
const FONT = { F: ['111', '100', '110', '100', '100'], E: ['111', '100', '110', '100', '111'], R: ['110', '101', '110', '101', '101'], O: ['010', '101', '101', '101', '010'], A: ['010', '101', '111', '101', '101'], L: ['100', '100', '100', '100', '111'], T: ['111', '010', '010', '010', '010'] };
// a seated or lying body (side view, facing right); parts: what to draw, in the colony's clothes
function seatedBody(P, s, shirt = RP.azul, trousers = RP.rubro) {   // 20 x 20, floor at y 19: on a crate, slumped forward
  P.box(1, 13, 8, 7, RP.madeira, s, 2.2); P.line(2, 16, 7, 16, RP.madeira, 1.2, 1); P.put(1, 13, RP.ferrugem, 3.4); P.put(8, 13, RP.ferrugem, 2.6);   // the crate
  tube(P, t => [12.4 + t * 0.6, 13 + t * 5.2], () => 3, trousers, s, 2.2);                          // shin
  P.rect(11, 18, 5, 2, RP.couro, (i, j) => 2.8 - i * 0.3 - j * 0.9);                                // boot
  tube(P, t => [5 + t * 8, 11.6 + t * 0.6], () => 3.6, trousers, s + 1, 2.8);                       // thigh
  tube(P, t => [5.2 + t * 1.8, 12 - t * 6.4], t => 5 - t * 0.6, shirt, s + 2, 2.6);                 // the back, bowed
  P.put(4, 10, RP.couro, 2); P.put(4, 11, RP.couro, 1.8);                                             // the belt at the back
  P.blob(9, 4.6, 2.5, 2.6, RP.pele, s + 3, 2.6);                                                     // the head hung forward
  P.blob(8, 3.4, 2.4, 1.8, RP.couro, s + 4, 1.8);                                                    // hair
  P.put(10, 5, RP.sombra, 1); P.put(11, 6.4, RP.pele, 1.4);                                          // a shut eye, the mouth
  tube(P, t => [8 + t * 2.6, 7.4 + t * 4.4], () => 2.2, shirt, s + 5, 3);                            // arm hanging to the knee
  P.blob(11.6, 12.2, 1.3, 1.1, RP.pele, s + 6, 2.8);                                                 // the hand on the knee
}

/* =============================== FLOOR =============================== */
function colonist(k) {   // 20 x 20: a colonist sat on a crate, head hung, fossilized under the crust (k 1: the Coração's, more taken)
  const P = painter(20, 20), s = 12201 + k;
  seatedBody(P, s, k ? RP.rubro : RP.azul, k ? RP.couro : RP.rubro);
  overgrow(P, k ? 0.3 : 0.02, s, (x, y) => (y - 12) * (k ? 0.05 : 0.07) + (y < 7 && x > 6 ? 0.15 : 0));
  if (k) overgrow(P, 0.06, s + 7, (x, y) => cn(x, y, 30, 30, s + 8) * 0.8, RP.carne);
  // the mat it has rooted into
  for (let x = 0; x < 20; x++) { if (hash2(x, 0, s) < 0.8) P.put(x, 19, RP.micelio, 2.4 + hash2(x, 1, s) * 1.2); }
  for (const [x, y, h, r] of k ? [[9, 2, 2, 2], [6, 6, 2, 1], [13, 12, 2, 1], [3, 12, 3, 1], [16, 18, 2, 1]] : [[8, 2, 1, 1], [5, 7, 1, 1], [17, 18, 2, 1]]) sprout(P, x, y, h, s + x, r, k ? RP.carne : RP.micelio, k ? 0.5 : 0);
  if (k) for (const x of [10, 13]) thread(P, x, 7, 3, s + x);
  fuzz(P, s, k ? 0.3 : 0.15);
  return P.done();
}
function bunk(k) {   // 32 x 26: a two-level bunk of rotten timber, the ticks gone to fuzz, threads between the levels (k 1: the top fallen in)
  const P = painter(32, 26), s = 12221 + k;
  plank(P, 1, 0, 26, 2, RP.madeira, s, true, 2.6); plank(P, 29, k ? 9 : 0, k ? 17 : 26, 2, RP.madeira, s + 1, true, 2.2);
  const board = (x0, x1, y0, y1, sag, ss) => { for (let x = x0; x <= x1; x++) { const t = (x - x0) / (x1 - x0), y = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag); P.put(x, y, RP.madeira, 3.4 + cg(x, y, ss) * 0.5 - (x % 7 === 0 ? 0.8 : 0)); P.put(x, y + 1, RP.madeira, 2 + cg(x, y + 1, ss) * 0.5); } };
  const tick = (x0, x1, y0, y1, sag, ss) => { for (let x = x0; x <= x1; x++) { const t = (x - x0) / (x1 - x0), yb = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag); const h = 3 + (cn(x, 0, 40, 40, ss) > 0 ? 1 : 0); for (let j = 1; j <= h; j++) { if (cn(x, j, 60, 60, ss + 1) < -0.3) continue; P.put(x, yb - j, RP.linho, 2.6 + (j === h ? 0.9 : 0) - t * 0.4 + (x % 4 === 0 ? -0.9 : 0) + cg(x, j, ss) * 0.5); } } };
  if (!k) { tick(3, 28, 7, 7, 1.5, s + 2); board(1, 30, 8, 8, 1.5, s + 3); }
  else { tick(4, 26, 9, 18, 0.5, s + 2); board(2, 28, 10, 19, 0, s + 3); }   // the top fallen across the lower one
  tick(3, 28, 19, 19, 0.6, s + 4); board(1, 30, 20, 20, 0.6, s + 5);
  // a blanket hanging off the low level
  for (let y = 17; y < 25; y++) for (let x = 22; x < 28; x++) if (y < 22 + Math.sin(x * 1.3) * 2.4) P.put(x, y, RP.azul, 3 - (x - 22) * 0.2 - (y - 17) * 0.08 + ((x + y) % 4 === 0 ? -0.6 : 0));
  overgrow(P, 0.04, s, (x, y) => (P.is(x, y, RP.linho) ? 0.2 : 0) + (y > 21 ? 0.3 : 0) + (x < 4 || x > 27 ? (y - 14) * 0.03 : 0));
  // threads from the top level down onto the lower tick, brackets on the posts
  if (!k) for (let x = 5; x < 27; x += 3) if (hash2(x, 0, s) < 0.7) thread(P, x, 10 + (hash2(x, 3, s) < 0.5 ? 1 : 0), 3 + hash2(x, 1, s) * 5, s + x);
  bracket(P, 2, 12, 5, s); bracket(P, 30, 15, 4, s + 1); bracket(P, 2.5, 4, 4, s + 2);
  sprout(P, 9, 16, 2, s, 1); sprout(P, 18, 15 - (k ? 1 : 0), 3, s + 1, 1);
  fuzz(P, s, 0.22);
  return P.done();
}
function lampTable() {   // 30 x 20: a trestle table going soft, a lantern still burning on it over the colony's map, a mug, the mycelium up one leg
  const P = painter(30, 20), s = 12241;
  plank(P, 0, 9, 30, 2, RP.madeira, s, false, 2.8);
  P.line(4, 11, 2, 19, RP.madeira, 2.6, 2); P.line(6, 11, 8, 19, RP.madeira, 1.8, 2);
  P.line(23, 11, 21, 19, RP.madeira, 2.4, 2); P.line(25, 11, 27, 17, RP.madeira, 1.8, 2);   // a leg rotted short: the table leans on a stone
  P.blob(27.5, 18.5, 2, 1.5, RP.xisto, s, 2.4);
  // the map: the colony's galleries in charcoal, the houses in squares, a ring round something
  P.rect(10, 7, 15, 2, RP.papel, (i, j) => 4.6 - i * 0.07 - j * 0.6 + (j === 1 && i % 3 === 1 ? -1.6 : 0) + (i === 6 ? -1.6 : 0));
  P.put(13, 7, RP.sombra, 2); P.put(17, 7, RP.sombra, 2); P.put(18, 7, RP.sombra, 2); P.put(21, 8, RP.rubro, 4); P.put(22, 7, RP.rubro, 4);
  P.put(24, 6, RP.papel, 3.4); P.put(25, 6, RP.papel, 2.6);   // a curled corner
  // the mug
  P.rect(26, 5, 3, 4, RP.ferro, (i, j) => 3.6 - i * 0.7 - j * 0.1); P.put(29, 6, RP.ferro, 2.2); P.put(29, 7, RP.ferro, 2.2);
  // the lantern: brass cap and foot, warm glass
  P.put(5, 0, RP.latao, 3.8); P.put(4, 1, RP.latao, 3.4); P.put(6, 1, RP.latao, 2.4);   // the handle loop
  P.rect(3, 2, 5, 1, RP.latao, (i) => 3.8 - i * 0.4);
  for (let y = 3; y < 7; y++) { P.put(3, y, RP.latao, 3.2); P.put(7, y, RP.latao, 1.8); for (let x = 4; x < 7; x++) P.put(x, y, RP.vidro, 4.4 - Math.hypot(x - 5, y - 4.6) * 1.4); }
  P.rect(2, 7, 7, 2, RP.latao, (i, j) => 3.6 - i * 0.3 - j);
  overgrow(P, 0, s, (x, y) => (x > 20 && y > 11 ? 0.3 + (y - 11) * 0.03 : -0.3) - (P.is(x, y, RP.vidro) || P.is(x, y, RP.latao) ? 2 : 0));
  for (let x = 16; x < 30; x++) if (hash2(x, 0, s) < 0.7) P.put(x, 19, RP.micelio, 2.4 + hash2(x, 1, s));
  sprout(P, 18, 18, 2, s, 1);
  fuzz(P, s, 0.12);
  return P.done();
}
function tippedBarrow() {   // 28 x 16: the colony's wheelbarrow tipped on its nose, a load of esporita ore spilled, sprouts in the spill
  const P = painter(28, 16), s = 12261, Q = painter(26, 16);
  for (let y = 3; y < 10; y++) for (let x = Math.round(6 + (y - 3) * 0.6); x < 21 - (y - 3) * 0.3; x++) Q.put(x, y, RP.madeira, 2.6 - (y - 3) * 0.15 + ((y - 3) % 3 === 0 ? 0.8 : 0) + cg(x, y, s) * 0.5);
  for (let x = 6; x < 21; x++) Q.put(x, 3, RP.ferro, 3.6);
  Q.line(0, 5, 8, 8, RP.madeira, 3.2, 1); Q.line(1, 12, 8, 9, RP.madeira, 2, 1); Q.line(9, 10, 8, 14, RP.madeira, 2.2, 1);
  for (let a = 0; a < 6.3; a += 0.12) { Q.put(20 + Math.cos(a) * 3.5, 11 + Math.sin(a) * 3.5, RP.ferro, Math.sin(a) < 0 ? 3.6 : 2); Q.put(20 + Math.cos(a) * 2.5, 11 + Math.sin(a) * 2.5, RP.madeira, 2.6); }
  for (let k = 0; k < 4; k++) { const a = k * 0.785 + 0.3; Q.line(20 - Math.cos(a) * 2.4, 11 - Math.sin(a) * 2.4, 20 + Math.cos(a) * 2.4, 11 + Math.sin(a) * 2.4, RP.madeira, 2.2); }
  Q.put(20, 11, RP.ferro, 4.4);
  blit(P, Q, 2, -1, 0.42, 20, 11);
  // the spill, heaped on the left, flecked with metal
  for (let row = 0; row < 2; row++) for (let k = 0; k < 6 - row * 2; k++) oreLump(P, 2 + row * 2 + k * 2.6 + hash2(k, row, s), 14.4 - row * 2.1 + hash2(k, row + 1, s) * 0.6, 1.6 + hash2(k, row + 2, s) * 0.8, s + k * 5 + row * 13, 0.7);
  overgrow(P, 0.15, s, (x, y) => (y > 12 ? 0.25 : 0));
  sprout(P, 6, 11, 2, s, 1); sprout(P, 12, 12, 1, s + 1, 1);
  fuzz(P, s, 0.2);
  return P.done();
}
function sacks(k) {   // 24 x 16 or 34 x 20: sacks of esporita ore, tied at the neck, stamped with the colony's leaf; one split, the metal spilling (k 1)
  const P = painter(k ? 34 : 24, k ? 20 : 16), s = 12281 + k, H = P.h;
  const sack = (cx, by, rw, rh, ss, split, lean = 0) => {
    const top = by - rh;
    for (let y = Math.floor(top + 2); y <= by; y++) {
      const t = (y - top - 2) / (rh - 2), sh = t < 0.28 ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - t / 0.28, 2))) : 1, hw = rw * (0.35 + sh * 0.6 + Math.sin(t * Math.PI) * 0.05), c = cx + (1 - t) * lean;
      for (let x = Math.floor(c - hw); x <= c + hw; x++) {
        const u = (x + 0.5 - c) / hw; if (Math.abs(u) > 1) continue;
        if (split && u > 0.15 && Math.abs(u - 0.55) < 0.32 - Math.abs(t - 0.5) * 0.9) continue;   // the tear
        const crease = Math.abs(((x - c) * 0.9 + Math.sin(y * 0.5) * 0.6) % 3) < 0.35 && t > 0.25;
        P.put(x, y, RP.saco, 3.3 - u * 1.2 - t * 0.6 + (t < 0.15 ? 0.6 : 0) + (y % 2 ? 0.15 : -0.15) + (crease ? -0.7 : 0) + cg(x, y, ss) * 0.35);
      }
    }
    // the gathered neck above the tie
    const nx = cx + lean; P.put(nx, top + 1, RP.corda, 3.6); P.put(nx - 1, top + 1, RP.corda, 3.8); P.put(nx + 1, top + 1, RP.corda, 2.6);
    P.put(nx - 1, top, RP.saco, 3.8); P.put(nx, top, RP.saco, 3.2); P.put(nx + 1, top, RP.saco, 2.4);
    // the stamp: a three-lobed leaf in faded teal
    const mx = Math.round(cx - rw * 0.25), my = Math.round(by - rh * 0.45);
    P.put(mx, my, RP.esporita, 2.4); P.put(mx - 1, my - 1, RP.esporita, 2.6); P.put(mx + 1, my - 1, RP.esporita, 2.2); P.put(mx, my - 2, RP.esporita, 2.6); P.put(mx, my + 1, RP.esporita, 1.8);
    if (split) for (let j = 0; j < 4; j++) oreLump(P, cx + rw * 0.7 + j * 1.7, by - rh * 0.4 + j * 1.6, 1.3, ss + j, 0.9);
  };
  if (k) { sack(26.5, H - 1, 5.4, 12, s + 1, false, 1); sack(7, H - 1, 6, 13, s, false, -1); sack(16, H - 1, 6, 14, s + 2, true); sack(10.5, H - 12, 4.4, 8, s + 3, false, 1); for (let j = 0; j < 5; j++) oreLump(P, 22 + j * 2.2, H - 1.4, 1.2 + hash2(j, 0, s) * 0.6, s + 9 + j, 0.9); }
  else { sack(17, H - 1, 5.4, 12, s + 1, false, 1); sack(7, H - 1, 6, 13, s, false, -1); }
  overgrow(P, 0.06, s, (x, y) => (y > H - 4 ? 0.3 : 0));
  for (let x = 0; x < P.w; x++) if (hash2(x, 3, s) < 0.5) P.put(x, H - 1, RP.micelio, 2.4 + hash2(x, 4, s));
  sprout(P, k ? 2 : 21, H - 2, 2, s, 1);
  fuzz(P, s, 0.12);
  return P.done();
}
function anvil() {   // 28 x 20: the colony's anvil on its stump, taken: the stump gone to cream, brackets on it, a hammer lying on the face
  const P = painter(28, 20), s = 12301;
  P.box(4, 10, 11, 10, RP.madeira, s, 2.4); for (let y = 12; y < 19; y += 2) P.line(5, y, 13, y, RP.madeira, 1.6, 1);
  P.rect(2, 5, 16, 3, RP.ferro, (i, j) => 3.6 - j * 0.9 - (i > 13 ? 0.5 : 0) + cg(i, j, s) * 0.4); P.rect(0, 5, 4, 1, RP.ferro, (i) => 4 - i * 0.2); P.put(0, 6, RP.ferro, 2.6);   // face and horn
  P.rect(6, 8, 8, 2, RP.ferro, (i) => 2.4 - i * 0.15);
  for (let k = 0; k < 9; k++) P.put(3 + hash2(k, 0, s) * 14, 5 + hash2(k, 1, s) * 4, RP.ferrugem, 2.4 + hash2(k, 2, s) * 1.6);   // rust blooms
  P.line(8, 4, 17, 2, RP.madeira, 3, 1); P.rect(17, 0, 3, 4, RP.ferro, (i, j) => 3.8 - i * 0.6 - j * 0.3);   // the hammer
  overgrow(P, 0.12, s, (x, y) => (y > 9 ? 0.4 : -0.15) + (y > 15 ? 0.2 : 0));
  // the mycelium foot spreading out from the stump, a line of brackets and sprouts
  for (let x = 0; x < 28; x++) { const d = Math.abs(x - 9.5); if (d < 13 && hash2(x, 0, s) < 0.9 - d * 0.05) P.put(x, 19, RP.micelio, 3 - d * 0.08 + hash2(x, 1, s)); if (d < 8 && hash2(x, 2, s) < 0.45) P.put(x, 18, RP.micelio, 3.2 + hash2(x, 3, s)); }
  bracket(P, 15.5, 13, 4, s); bracket(P, 15, 17, 3, s + 1); bracket(P, 4, 15, 3, s + 2);
  sprout(P, 1.5, 4, 2, s, 1); sprout(P, 21, 18, 3, s + 1, 1); sprout(P, 23, 18, 1, s + 2, 1);
  fuzz(P, s, 0.22);
  return P.done();
}
function stretcher(k) {   // 32 x 16: an infirmary stretcher on its legs; a body under a sheet with the mycelium burst out of its chest (k 0), or the stained sheet slid half off (k 1)
  const P = painter(32, 16), s = 12321 + k;
  for (const lx of [3, 27]) { plank(P, lx, 9, 7, 2, RP.madeira, s + lx, true, lx < 10 ? 2.6 : 2); }
  P.line(5, 13, 27, 13, RP.madeira, 1.6, 1);   // the brace between the legs
  for (let x = 0; x < 32; x++) { P.put(x, 8, RP.madeira, 3.2 + cg(x, 8, s) * 0.4 - (x === 0 || x === 31 ? 0.8 : 0)); P.put(x, 9, RP.madeira, 1.8); }   // the near pole, handles out at both ends
  for (let x = 2; x < 30; x++) P.put(x, 7, RP.linho, 2 + cg(x, 7, s) * 0.4);   // the canvas edge
  if (!k) {
    // under the sheet: the head (left), shoulders, chest heaved up, the legs, feet up at the end
    const prof = x => x < 3 ? 0 : x < 7 ? 3.4 - Math.pow((x - 5) / 2.2, 2) * 1.6 : x < 9 ? 1.6 : x < 18 ? 2.6 + Math.sin((x - 9) / 9 * Math.PI) * 1.4 : x < 26 ? 1.8 - (x - 18) * 0.05 : x < 29 ? 3 - Math.abs(x - 27) * 0.6 : 0;
    for (let x = 2; x < 30; x++) { const top = 7 - prof(x); for (let y = Math.ceil(top); y < 7; y++) P.put(x, y, RP.linho, 3.8 - (y - top) * 0.45 - (x - 2) * 0.03 + cg(x, y, s) * 0.3 + ((x * 3 + y) % 9 === 0 ? -0.6 : 0)); }
    for (let x = 2; x < 30; x++) if (hash2(x, 5, s) < 0.35) P.put(x, 8 + (hash2(x, 6, s) < 0.5 ? 1 : 0), RP.linho, 2.6);   // the hem hanging over the pole
    for (let i = 0; i < 6; i++) P.put(10 + i * 2.4, 6 - hash2(i, 0, s), RP.rubro, 1.8 + hash2(i, 1, s));   // old stains
    // the burst: a cream mass out of the chest, sprouts, threads down to the floor
    for (let x = 10; x < 18; x++) if (hash2(x, 7, s) < 0.8) P.put(x, Math.round(7 - (2.6 + Math.sin((x - 9) / 9 * Math.PI) * 1.4)) - (x > 11 && x < 16 ? 1 : 0), RP.micelio, 3 + hash2(x, 8, s));
    for (const [x, h, r] of [[13, 5, 2], [16, 3, 1], [10, 2, 1], [11, 7, 1]]) sprout(P, x, 3, h, s + x, r, RP.micelio, 0.5);
    for (const x of [7, 12, 17, 23]) thread(P, x, 10, 2 + hash2(x, 0, s) * 3, s + x);
  } else {
    for (let x = 6; x < 26; x++) P.put(x, 6, RP.linho, 3.2 + cg(x, 6, s) * 0.5 - (x % 5 === 0 ? 0.7 : 0));
    for (let y = 7; y < 15; y++) for (let x = 24; x < 31; x++) if (y < 9 + (x - 24) * 0.7 + Math.sin(x * 1.3) * 1.2) P.put(x, y, RP.linho, 3.2 - (y - 7) * 0.2 - (x - 24) * 0.12 + ((x + y) % 3 === 0 ? -0.6 : 0));   // the sheet trailing off
    for (let i = 0; i < 5; i++) { P.put(9 + i * 3, 6, RP.rubro, 2 + hash2(i, 1, s)); P.put(10 + i * 3, 7, RP.rubro, 1.8); }   // where it lay: the stain of its shape
    for (let x = 8; x < 24; x += 2) if (hash2(x, 2, s) < 0.7) P.put(x, 5, RP.micelio, 2.6 + hash2(x, 3, s));
    sprout(P, 15, 5, 1, s, 1);
  }
  for (let x = 0; x < 32; x++) if (hash2(x, 3, s) < 0.45) P.put(x, 15, RP.micelio, 2.4 + hash2(x, 4, s));
  fuzz(P, s, 0.15);
  return P.done();
}
function giantShroom(big) {   // 24 x 30 or 36 x 46: a giant mushroom still small: a fibrous stalk with a ring, a teal cap spotted cream, gills glowing cyan
  const W = big ? 36 : 24, H = big ? 46 : 30, P = painter(W, H), s = big ? 12342 : 12341, cx = W / 2, cw = big ? 6 : 4, ch = big ? 13 : 9, capY = ch, lean = big ? 1.5 : -1;
  // the stalk: fibres up its length, a flared root, the ring (annulus) under the cap
  for (let y = capY; y < H; y++) {
    const t = (y - capY) / (H - capY), hw = cw / 2 + Math.pow(Math.max(0, t - 0.7) / 0.3, 2) * cw * 0.55, c = cx + lean * (1 - t) * (1 - t);
    for (let x = Math.floor(c - hw); x <= c + hw; x++) { const u = (x + 0.5 - c) / hw; if (Math.abs(u) > 1) continue; P.put(x, y, RP.tronco, 3.2 - u * 1.3 + Math.sin(x * 2.1 + Math.floor(y / 3) * 0.3) * 0.35 + cg(x, y, s) * 0.5 - (t < 0.12 ? 1 - t * 8 : 0)); }
  }
  const ry = capY + (big ? 5 : 3), rc = cx + lean * 0.8;
  for (let x = Math.floor(rc - cw / 2 - 1.5); x <= rc + cw / 2 + 1.5; x++) { P.put(x, ry, RP.tronco, 4 - (x - rc) * 0.25); P.put(x, ry + 1, RP.tronco, 2.4 - (x - rc) * 0.2); if (hash2(x, 0, s) < 0.4) P.put(x, ry + 2, RP.tronco, 2); }
  // the gills: a band of radial lines under the cap, brightest near the stalk
  for (let x = 1; x < W - 1; x++) { const u = (x + 0.5 - cx) / (W / 2 - 1); for (let j = 0; j < (big ? 3 : 2); j++) { const y = capY - j + Math.round(Math.abs(u) * (big ? 1.4 : 1)) - (Math.abs(u) > 0.85 ? 1 : 0); P.put(x, y, RP.chapeu, (x % 2 ? 4.8 : 3.2) - Math.abs(u) * 1.6 - j * 0.4); } }
  // the cap: a flattened dome, teal, lit from the top left, with cream spots and a rim rolled under
  const crx = W / 2, ccy = capY - (big ? 2 : 1), cry = ccy + 0.5;
  for (let y = 0; y <= ccy; y++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - cx) / crx, dy = (y + 0.5 - ccy) / cry; if (Math.pow(Math.abs(dx), 2.4) + dy * dy > 1) continue;
    const rim = Math.pow(Math.abs(dx), 2.4) + dy * dy > 0.8 && dy > -0.45;
    P.put(x, y, RP.chapeu, (rim ? 2.2 : 2.6) - dx * 1.1 - dy * 0.5 + cg(x, y, s) * 0.45 + cn(x, y, 40, 40, s) * 0.8);
  }
  for (let k = 0; k < (big ? 11 : 6); k++) { const a = hash2(k, 0, s) * Math.PI, r = 0.25 + hash2(k, 1, s) * 0.6, x = cx - Math.cos(a) * crx * r, y = ccy - Math.sin(a) * cry * r; if (!P.has(x, y)) continue; const big2 = hash2(k, 2, s) < 0.4; P.put(x, y, RP.micelio, 3.6 - (x - cx) / crx); P.put(x + 1, y, RP.micelio, 2.8 - (x - cx) / crx); if (big2) { P.put(x, y - 1, RP.micelio, 4.2 - (x - cx) / crx); P.put(x + 1, y - 1, RP.micelio, 3.4 - (x - cx) / crx); } }
  // roots in the floor, a couple of sprouts at the foot
  for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - cx) < cw * 1.4 + 2 && hash2(x, 5, s) < 0.7) P.put(x, H - 1, RP.micelio, 2.4 + hash2(x, 6, s));
  sprout(P, Math.round(cx - cw - 2), H - 2, 2, s, 1, RP.chapeu, 0.6); if (big) sprout(P, Math.round(cx + cw + 3), H - 2, 3, s + 1, 1, RP.chapeu, 0.6);
  return P.done();
}
function capClump(k) {   // 28 x 22: a clump of mid mushrooms, violet-grey caps on cream stalks, a dim gill line under each
  const P = painter(28, 22), s = 12361 + k;
  const list = k ? [[5, 9, 4, 0.2], [11, 17, 5.5, 0], [17, 12, 4.6, 0.1], [22, 7, 3.4, 0], [14, 5, 2.4, 0.3], [25, 4, 2, 0]] : [[6, 14, 5, 0.1], [13, 19, 6, 0], [20, 10, 4.4, 0.2], [24, 6, 3, 0], [9, 6, 2.6, 0.2]];
  list.sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < list.length; i++) {
    const [x, h, r, lean] = list[i], top = 21 - h, ss = s + i * 7;
    tube(P, t => [x + lean * (1 - t) * 6, top + 1 + t * (h - 1)], t => Math.max(1.4, r * 0.38 + t * 0.6), RP.tronco, ss, 2.6 - i * 0.1);
    const cx = x + lean * 6, ry = Math.max(1.6, r * 0.55);
    for (let y = Math.floor(top - ry); y <= top + 0.5; y++) for (let xx = Math.floor(cx - r); xx <= cx + r; xx++) {
      const dx = (xx + 0.5 - cx) / r, dy = (y + 0.5 - top) / ry; if (dx * dx + dy * dy > 1 || dy > 0.4) continue;
      P.put(xx, y, RP.humus, 3.4 - dx * 1.1 - dy * 0.6 + cg(xx, y, ss) * 0.5 + (hash2(xx, y, ss) < 0.08 ? 1.4 : 0));
    }
    for (let xx = Math.ceil(cx - r + 0.5); xx < cx + r - 0.5; xx++) P.put(xx, top + 1, RP.chapeu, 2.4 - Math.abs(xx + 0.5 - cx) / r);
    P.blob(cx - r * 0.35, top - ry * 0.45, Math.max(0.8, r * 0.18), 0.7, RP.micelio, ss, 2.8);
  }
  for (let x = 0; x < 28; x++) if (hash2(x, 1, s) < 0.75) P.put(x, 21, RP.humus, 2 + hash2(x, 2, s) * 1.6);
  sprout(P, 2, 20, 1, s, 1); sprout(P, 26, 20, 2, s + 1, 1);
  fuzz(P, s, 0.12);
  return P.done();
}
function stump() {   // 30 x 18: the stump of a giant mushroom the colony felled: a cut face of rings, fibres split down the side, the axe left in it
  const P = painter(30, 18), s = 12381, cx = 14;
  for (let y = 5; y < 18; y++) { const t = (y - 5) / 12, hw = 8 + Math.pow(t, 3) * 5; for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const u = (x + 0.5 - cx) / hw; if (Math.abs(u) > 1) continue; P.put(x, y, RP.tronco, 3 - u * 1.3 + Math.sin(x * 1.7) * 0.4 + cg(x, y, s) * 0.5 - (y === 5 ? 0 : 0)); } }
  for (let k = 0; k < 6; k++) { const x = cx - 6 + k * 2.6; P.line(x, 7, x + (hash2(k, 0, s) - 0.5) * 2, 15, RP.tronco, 1.6, 1); }   // splits down the side
  // the cut face, seen a little from above: growth rings, a dark heart
  for (let y = 1; y < 8; y++) for (let x = 5; x < 24; x++) { const dx = (x + 0.5 - cx) / 8.6, dy = (y + 0.5 - 5) / 3.4, d = Math.hypot(dx, dy); if (d > 1) continue; P.put(x, y, RP.micelio, 3.6 - dx * 0.5 + (Math.abs((d * 5) % 1 - 0.5) < 0.18 ? -1 : 0) - (d < 0.2 ? 1.6 : 0) + cg(x, y, s) * 0.4); }
  for (let x = 6; x < 23; x++) P.put(x, 5 + Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((x + 0.5 - cx) / 8.6, 2))) * 3.4), RP.tronco, 4.6);   // the lit lip of the cut
  // the axe: haft leaning back, head bitten into the face
  P.line(20, 4, 27, -3, RP.madeira, 3, 1); P.line(21, 5, 28, -2, RP.madeira, 1.8, 1);
  P.rect(17, 2, 4, 3, RP.ferro, (i, j) => 3.8 - i * 0.4 - j * 0.6); P.put(17, 5, RP.ferro, 2); P.put(21, 2, RP.ferrugem, 2.6);
  // regrowth on the cut, chips on the floor
  sprout(P, 9, 4, 2, s, 1, RP.chapeu, 0.5); sprout(P, 12, 3, 1, s + 1, 1, RP.chapeu, 0.5);
  for (let k = 0; k < 7; k++) { const x = 1 + hash2(k, 0, s) * 28; if (Math.abs(x - cx) < 10) continue; P.put(x, 17, RP.tronco, 3.4 + hash2(k, 1, s)); P.put(x + 1, 17, RP.tronco, 2.4); }
  return P.done(true);
}
function sproutNest(k) {   // 26 x 12 or 34 x 13: a low mound of humus with little brotos coming up out of it, a few with their slit eyes already open
  const W = k ? 34 : 26, H = k ? 13 : 12, P = painter(W, H), s = 12401 + k;
  const mound = x => H - 1 - Math.sin(((x + 0.5) / W) * Math.PI) * 4 - cn(x, 0, 60, 60, s) * 1.6;
  for (let x = 0; x < W; x++) { const top = mound(x); for (let y = Math.floor(top); y < H; y++) P.put(x, y, RP.humus, 3 - (y - top) * 0.35 - ((x + 0.5) / W - 0.5) * 0.8 + cg(x, y, s) * 0.6 + (hash2(x, y, s) < 0.06 ? 1.2 : 0)); }
  for (let x = 0; x < W; x++) if (hash2(x, 9, s) < 0.35) P.put(x, Math.floor(mound(x)), RP.micelio, 2.6 + hash2(x, 8, s));   // a few threads on the crown
  const xs = k ? [3, 7, 10, 14, 17, 21, 25, 29] : [3, 7, 11, 14, 18, 22];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i] + (hash2(i, 0, s) < 0.5 ? 0 : 1), big = hash2(i, 1, s) < 0.4, h = 2 + (hash2(i, 2, s) * 3 | 0) + (big ? 1 : 0), by = Math.floor(mound(x));
    sprout(P, x, by, h, s + i, big ? 2 : 1, RP.micelio);
    if (big && hash2(i, 3, s) < 0.7) { P.put(x - 1, by - h + 1, RP.sombra, 0.4); P.put(x + 1, by - h + 1, RP.sombra, 0.4); }   // slit eyes under the cap
  }
  return P.done();
}
function strandedBoat() {   // 42 x 17: a plank boat of the colony run aground and listing, a hole stove in, an oar across it, scum to the waterline
  const P = painter(42, 17), s = 12421, Q = painter(42, 17);
  for (let x = 1; x < 41; x++) {
    const t = (x + 0.5 - 21) / 20, top = Math.round(5 - 2.6 * t * t - (t > 0 ? 2.2 * t * t * t : 0)), bot = Math.round(Math.min(14.5, 15 - 9.5 * Math.pow(Math.abs(t), t < 0 ? 4 : 2.2)));
    if (bot <= top) continue;
    for (let y = top; y <= bot; y++) { const ly = (y - top) % 3; Q.put(x, y, y > bot - 3 ? RP.lodo : RP.madeira, (ly === 0 ? 3.6 : ly === 2 ? 2 : 3) - (y - top) * 0.1 - t * 0.5 + cg(x, y, s) * 0.4 - (x % 9 === 0 && ly === 1 ? 0.7 : 0)); }
    Q.put(x, top, RP.madeira, 4.4 + cg(x, 0, s) * 0.4); Q.put(x, top - 1, RP.madeira, 2.6);   // the gunwale and its rail
  }
  for (let y = 4; y < 13; y++) { Q.put(1, y, RP.madeira, 2.8); Q.put(2, y, RP.madeira, 2.4); }   // the transom
  for (let y = 7; y < 12; y++) for (let x = 15; x < 21; x++) if (Math.hypot((x + 0.5 - 18) / 3, (y + 0.5 - 9.5) / 2.4) < 1 - hash2(x, y, s) * 0.3) Q.put(x, y, RP.sombra, 1);   // the hole
  for (let x = 14; x < 22; x += 2) Q.put(x, 7 + (x % 4 ? 0 : 1), RP.madeira, 4);   // splinters round it
  Q.line(3, 0, 28, 4, RP.madeira, (t) => 3.8 - t * 0.6, 1); Q.rect(28, 3, 6, 2, RP.madeira, (i, j) => 3.4 - j - i * 0.1);   // the oar, blade out over the side
  blit(P, Q, 0, 0, 0.06, 20, 14);
  overgrow(P, 0.02, s, (x, y) => (y < 7 ? 0.25 : 0) - (P.is(x, y, RP.sombra) ? 2 : 0));
  for (let x = 5; x < 36; x += 6) thread(P, x + hash2(x, 0, s) * 2, 6 + hash2(x, 1, s) * 2, 2 + hash2(x, 2, s) * 3, s + x);
  bracket(P, 7, 10, 3, s, 0.4); sprout(P, 24, 4, 2, s, 1, RP.chapeu, 0.5);
  for (let x = 0; x < 42; x++) if (hash2(x, 7, s) < 0.6) P.put(x, 16, RP.lodo, 2.4 + hash2(x, 8, s) * 1.4);
  fuzz(P, s, 0.12);
  return P.done();
}
function netHeap() {   // 30 x 13: rotten fishing nets in a heap, cork floats, a fish's bones, weed in the mesh
  const P = painter(30, 13), s = 12441;
  for (let x = 0; x < 30; x++) { const t = (x + 0.5) / 30, top = 12 - Math.sin(t * Math.PI) * 8.5 - cn(x, 0, 50, 50, s) * 3; for (let y = Math.floor(top); y < 13; y++) { const fold = Math.sin(x * 0.5 + y * 0.2) * 1.5, mesh = (x + y + Math.round(fold)) % 3 === 0 || (x - y + 60 + Math.round(fold)) % 3 === 0; P.put(x, y, mesh ? RP.corda : RP.couro, mesh ? 3.6 - (y - top) * 0.2 - (t - 0.4) * 1 + cg(x, y, s) * 0.4 : 0.8 + cg(x, y, s) * 0.5); } }
  for (let k = 0; k < 6; k++) { const x = 3 + k * 4.6 + hash2(k, 0, s) * 2, t = x / 30, y = 12 - Math.sin(t * Math.PI) * 8.5 * (0.4 + hash2(k, 1, s) * 0.5); P.blob(x, y, 1.5, 1.1, RP.ferrugem, s + k, 3.2); }   // the cork floats
  // the fish: a spine and ribs, a skull
  P.line(17, 4, 25, 5, RP.osso, 3.6, 1); for (let i = 0; i < 4; i++) { P.put(19 + i * 1.6, 3, RP.osso, 3); P.put(19 + i * 1.6, 6, RP.osso, 2.6); }
  P.blob(16, 4.2, 1.6, 1.4, RP.osso, s, 2.8); P.put(15.6, 4, RP.sombra, 0.5); P.put(26, 4, RP.osso, 3.4); P.put(26, 6, RP.osso, 3.4);
  for (let k = 0; k < 8; k++) { const x = 1 + hash2(k, 2, s) * 28, y = 12 - hash2(k, 3, s) * 5; for (let j = 0; j < 3; j++) if (P.has(x, y + j)) P.put(x + (j & 1), y + j, RP.esporo, 2.4 - j * 0.3); }   // weed
  for (let x = 0; x < 30; x++) if (hash2(x, 5, s) < 0.4) P.put(x, 12, RP.micelio, 2.4 + hash2(x, 6, s));
  fuzz(P, s, 0.1);
  return P.done();
}
function floorHeart() {   // 30 x 20: a heart of mycelium on the floor, pink flesh half sheathed in cream, vessels arching off into the ground; it beats
  const P = painter(30, 20), s = 12461;
  tube(P, t => [10 - t * 8, 5 - Math.sin(t * Math.PI) * 4 + t * 14], t => 3.2 - t * 1.6, RP.carne, s + 1, 2.4);   // a vessel arching down into the floor, left
  tube(P, t => [19 + t * 9, 4 - Math.sin(t * Math.PI) * 3 + t * 15], t => 2.6 - t * 1.4, RP.micelio, s + 2, 2.6);   // a cream cord, right
  // the body: a fat bulb, a little heart-shaped, glossy
  for (let y = 2; y < 20; y++) for (let x = 3; x < 27; x++) {
    const l1 = Math.hypot((x + 0.5 - 11.5) / 7, (y + 0.5 - 10) / 7.5), l2 = Math.hypot((x + 0.5 - 18.5) / 7, (y + 0.5 - 9.6) / 7.5), bot = y >= 11 && Math.abs(x + 0.5 - 15) < 10.6 * Math.sqrt(Math.max(0, 1 - (y - 11) / 9.5));
    if (l1 > 1 && l2 > 1 && !bot) continue;
    const dx = (x + 0.5 - 15) / 12, dy = (y + 0.5 - 11) / 9;
    P.put(x, y, RP.carne, 3.2 - dx * 1.3 - dy * 1.2 - (dx * dx + dy * dy) * 0.5 + cg(x, y, s) * 0.35);
  }
  for (let j = 0; j < 12; j++) P.put(15 + Math.sin(j * 0.5) * 1.2, 4 + j, RP.carne, 1.2);   // the groove between the halves
  for (let v = 0; v < 4; v++) { let x = 7 + v * 5, y = 4 + hash2(v, 0, s) * 3; for (let j = 0; j < 9; j++) { x += (hash2(j, v, s) - 0.5) * 1.4; y += 1; if (P.is(x, y, RP.carne)) P.put(x, y, RP.carne, 1.6); } }   // veins
  // the sheath of mycelium round its foot
  for (let y = 12; y < 20; y++) for (let x = 2; x < 28; x++) { if (!P.has(x, y) && y < 19) continue; const n = cn(x, y, 30, 30, s + 3) + (y - 12) * 0.08; if (n > 0.1) P.put(x, y, RP.micelio, 1.6 + (P.has(x, y) ? P.val[y * 30 + x] * 0.5 : 1) + cg(x, y, s) * 0.5 + (y === 19 ? -0.4 : 0)); }
  P.put(8, 6, RP.carne, 5.4); P.put(9, 6, RP.carne, 5); P.put(8, 7, RP.carne, 4.6); P.put(17, 5, RP.carne, 5); P.put(18, 5, RP.carne, 4.4);   // wet highlights
  for (let x = 0; x < 30; x++) if (hash2(x, 3, s) < 0.7) P.put(x, 19, RP.micelio, 2.2 + hash2(x, 4, s) * 1.4);
  fuzz(P, s, 0.15);
  return (fungHeartCv = P.done());
}
function bodyCocoon(k) {   // 14 x 26 standing, or 26 x 14 lying: a body wound up in cream mycelium, the head and shoulders still showing through, a face and a hand pressed out
  const Q = painter(14, 26), s = 12481 + k, H = 26;
  // the silhouette: head, neck, shoulders, tapering to the feet, rooted
  const hw = y => y < 6 ? Math.sqrt(Math.max(0, 1 - Math.pow((y + 0.5 - 3.4) / 3.4, 2))) * 3 : y < 7 ? 2.4 : y < 10 ? 2.4 + (y - 6) * 1.1 : 5.6 - (y - 10) * 0.16;
  for (let y = 0; y < H; y++) { const w = hw(y); for (let x = 0; x < 14; x++) { const u = (x + 0.5 - 7) / Math.max(0.6, w); if (Math.abs(u) > 1) continue; const wrap = Math.sin(y * 1.1 + x * 0.55 + s) > 0.5; Q.put(x, y, RP.micelio, 2.8 - u * 1.2 - y * 0.03 + (wrap ? 0.7 : -0.1) + cg(x, y, s) * 0.4); } }
  // the face: pale skin, shut eyes, the mouth a little open
  Q.blob(7.6, 3.6, 2, 2.4, RP.pele, s, 3);
  Q.put(6.6, 3.2, RP.pele, 1); Q.put(8.6, 3.2, RP.pele, 1); Q.put(7.6, 5, RP.sombra, 1.2);
  for (let a = 0; a < 6.3; a += 0.4) if (hash2(a * 10 | 0, 0, s) < 0.6) Q.put(7.6 + Math.cos(a) * 2.4, 3.6 + Math.sin(a) * 2.8, RP.micelio, 3.8);   // strands across it
  // a hand pressed out at the chest
  Q.blob(9.5, 12.5, 1.6, 1.4, RP.pele, s + 1, 2.6); for (let f = 0; f < 3; f++) Q.put(8.6 + f, 10.6, RP.pele, 3 - f * 0.3);
  if (k) overgrow(Q, 0.05, s + 2, (x, y) => (y > 18 ? 0.4 : -0.3), RP.carne);
  else overgrow(Q, 0.02, s + 2, (x, y) => (y > 21 ? 0.4 : -0.5), RP.carne);
  let P;
  if (!k) { P = painter(14, 26); blit(P, Q, 0, 0, 0, 0, 0); for (const x of [3, 10]) thread(P, x, 23, 2, s + x); for (let x = 0; x < 14; x++) if (hash2(x, 3, s) < 0.7) P.put(x, 25, RP.micelio, 2.4 + hash2(x, 4, s)); }
  else { P = painter(27, 14); blit(P, Q, 6, -6, Math.PI / 2, 7, 13); for (let x = 0; x < 28; x++) if (hash2(x, 3, s) < 0.75) P.put(x, 13, RP.micelio, 2.4 + hash2(x, 4, s)); }
  fuzz(P, s, 0.25);
  return P.done();
}
/* =============================== CEILING =============================== */
function sporeCluster(big) {   // 16 x 22 or 22 x 32: a big cluster of spore sacs hung on a cord, glowing green, one dripping
  const W = big ? 22 : 16, H = big ? 32 : 22, P = painter(W, H), s = big ? 12502 : 12501, cx = W / 2;
  // the root mat on the ceiling and the cord
  for (let x = 1; x < W - 1; x++) if (hash2(x, 0, s) < 0.85) P.put(x, 0, RP.micelio, 2.6 + hash2(x, 1, s));
  tube(P, t => [cx + Math.sin(t * 3) * 0.8, t * (big ? 10 : 6) + 0.5], t => 2.4 - t * 0.6, RP.micelio, s, 2.6);
  // the sacs: spheres, biggest near the top, lit from inside (bright core) and from the top left
  const top = big ? 9 : 5, list = [];
  const n = big ? 13 : 8;
  for (let i = 0; i < n; i++) { const t = i / n, r = (big ? 3.4 : 2.6) * (1 - t * 0.55) + hash2(i, 0, s) * 0.6, y = top + t * (H - top - 4) + r * 0.4, x = cx + (hash2(i, 1, s) - 0.5) * (W - 6) * (1 - t * 0.6); list.push([x, y, r]); }
  list.sort((a, b) => a[2] - b[2]);
  for (const [x0, y0, r] of list) for (let y = Math.floor(y0 - r); y <= y0 + r; y++) for (let x = Math.floor(x0 - r); x <= x0 + r; x++) {
    const dx = (x + 0.5 - x0) / r, dy = (y + 0.5 - y0) / r, d = dx * dx + dy * dy; if (d > 1) continue;
    P.put(x, y, RP.esporo, 3.4 - d * 2 - (dx + dy) * 0.5 + cg(x, y, s) * 0.35 + (d < 0.3 ? 1.2 - d * 2 : 0));
    if (Math.abs(dx + 0.45) < 0.2 && Math.abs(dy + 0.45) < 0.2) P.put(x, y, RP.esporo, 5);
  }
  for (const [x0, y0, r] of list) if (r > 1.6) P.put(x0 + r * 0.3, y0 + r * 0.2, RP.esporo, 2);   // a pore on each
  const [lx, ly, lr] = list[0]; for (let j = 1; j < 4; j++) P.put(lx, ly + lr + j, RP.esporo, 4.6 - j * 0.6);   // a drip
  fuzz(P, s, 0.15);
  return P.done();
}
function fungalStalactite(big) {   // 14 x 28 or 20 x 36: a stalactite of wet schist sheathed in mycelium, a fringe of threads, sap dripping off the point
  const W = big ? 20 : 14, H = big ? 36 : 28, P = painter(W, H), s = big ? 12522 : 12521, cx = W / 2 - 0.5, L = H - 5;
  for (let y = 0; y < L; y++) { const t = y / L, hw = (W / 2 - 1) * Math.pow(1 - t, 1.25) + 0.4, c = cx + Math.sin(t * 3 + s) * 0.8 * t; for (let x = Math.floor(c - hw); x <= c + hw; x++) { const u = (x + 0.5 - c) / hw; if (Math.abs(u) > 1) continue; P.put(x, y, RP.xisto, 3 - u * 1.4 - t * 0.4 + cg(x, y, s) * 0.5 + (Math.abs(((y * 0.6 + x * 0.2) % 3) - 1.5) < 0.3 ? 0.7 : 0)); } }   // wet bands
  overgrow(P, 0.12, s, (x, y) => (y < L * 0.5 ? 0.3 - y / L * 0.4 : -0.3), RP.tomada);
  overgrow(P, 0.15, s + 1, (x, y) => (y < L * 0.4 ? 0.35 : -0.3));
  for (let k = 0; k < (big ? 7 : 5); k++) { const y = 2 + k * (L * 0.5) / 6, t = y / L, hw = (W / 2 - 1) * Math.pow(1 - t, 1.25), side = k % 2 ? 1 : -1; thread(P, cx + side * (hw + 1), y + 1, 3 + hash2(k, 0, s) * (big ? 6 : 4), s + k); }
  bracket(P, cx - 2, L * 0.3, 3, s, 0.6);
  for (let j = 0; j < 5; j++) if (j !== 2) P.put(cx + 0.5, L + j, RP.esporo, 4.6 - j * 0.5);   // sap drops
  return P.done();
}
function pulley() {   // 14 x 36: the colony's pulley, the rope furred over, the bucket brimming with fuzz
  const P = painter(14, 36), s = 12541;
  P.rect(2, 0, 10, 2, RP.madeira, (i, j) => 3 - j * 1.2); P.line(4, 2, 6, 5, RP.ferro, 2.8, 1); P.line(10, 2, 8, 5, RP.ferro, 2.2, 1);
  for (let a = 0; a < 6.3; a += 0.1) { P.put(7 + Math.cos(a) * 3.6, 7 + Math.sin(a) * 3.6, RP.ferro, 3.6 - Math.cos(a + 0.8) * 1.2); P.put(7 + Math.cos(a) * 2.7, 7 + Math.sin(a) * 2.7, RP.ferro, 2); }
  for (let k = 0; k < 3; k++) { const a = k * 1.05 + 0.3; P.line(7 - Math.cos(a) * 2.4, 7 - Math.sin(a) * 2.4, 7 + Math.cos(a) * 2.4, 7 + Math.sin(a) * 2.4, RP.ferro, 3.2); }
  P.put(7, 7, RP.ferro, 4.6); P.put(9, 4, RP.ferrugem, 3.4); P.put(4, 8, RP.ferrugem, 3);
  for (let y = 7; y < 27; y++) { P.put(3.6, y, RP.corda, 3.4 - (y % 3 === 0 ? 1 : 0)); if (y < 15) P.put(10.4, y, RP.corda, 2.6 - (y % 3 === 0 ? 1 : 0)); }
  for (let y = 27; y < 36; y++) { const hw = 4.6 - (y - 27) * 0.18; for (let x = Math.round(4 - hw); x <= Math.round(4 + hw); x++) P.put(x + 2, y, RP.madeira, 3.2 - (x - 4 + hw) / hw * 1 + (y === 29 || y === 33 ? -1.3 : 0)); }
  P.line(1, 27, 4, 24, RP.ferro, 3, 1); P.line(9, 27, 6, 24, RP.ferro, 2.4, 1);
  for (let x = 2; x < 11; x++) P.put(x, 26, RP.micelio, 3.6 + hash2(x, 0, s) * 1.2);   // fuzz heaped in the bucket
  overgrow(P, 0.15, s, (x, y) => (P.is(x, y, RP.corda) ? 0.25 : 0) + (y > 28 ? 0.15 : 0));
  thread(P, 10.4, 15, 4, s); thread(P, 4, 36 - 1, 0, s);
  fuzz(P, s, 0.25);
  return P.done();
}
function birdCage() {   // 14 x 26: a canary cage on a cord, the door hanging open, a perch, a feather; threads through the bars
  const P = painter(14, 26), s = 12561;
  for (let y = 0; y < 7; y++) P.put(7 + Math.sin(y * 0.6) * 0.4, y, RP.corda, 3.2 - (y % 2) * 0.8);
  for (let a = 0; a < 6.3; a += 0.3) P.put(7 + Math.cos(a) * 1.2, 7.5 + Math.sin(a) * 1.2, RP.latao, 3.6);   // the ring
  for (let y = 9; y < 14; y++) { const hw = Math.sqrt(Math.max(0, 1 - Math.pow((14 - y) / 5, 2))) * 6; P.put(7 - hw, y, RP.latao, 3.8); P.put(7 + hw, y, RP.latao, 2.4); }   // the dome
  for (let x = 2; x < 13; x++) P.put(x, 9 + Math.round(Math.pow((x - 7) / 6, 2) * 5), RP.latao, 3.6 - (x - 2) * 0.12);
  for (const x of [1, 4, 7, 10, 13]) for (let y = 14; y < 24; y++) if (!(x === 13 && y > 15)) P.put(x, y, RP.latao, x < 7 ? 3.6 : x === 7 ? 3 : 2.2);
  P.line(4, 9 + 2, 4, 14, RP.latao, 3.2, 1); P.line(10, 11, 10, 14, RP.latao, 2.4, 1);
  P.rect(0, 24, 14, 2, RP.latao, (i, j) => 3.8 - j * 1.4 - i * 0.12);   // the tray
  for (let y = 15; y < 22; y++) P.put(13 + (y - 15) * 0.15, y, RP.latao, 2);   // the door swung out
  P.line(2, 19, 11, 19, RP.madeira, 2.8, 1);   // the perch
  P.put(6, 23, RP.esporo, 3.6); P.put(7, 22, RP.esporo, 4); P.put(8, 23, RP.esporo, 3);   // a yellow-green feather on the tray
  for (const x of [3, 9]) thread(P, x, 12, 6 + hash2(x, 0, s) * 6, s + x);
  for (let x = 1; x < 12; x++) if (hash2(x, 2, s) < 0.5) P.put(x, 23, RP.micelio, 3 + hash2(x, 3, s));
  return P.done(false);
}
function threadCurtain(wide) {   // 26 x 30 or 38 x 36: a curtain of mycelium threads from a mat on the roof, beaded, a few beads glowing green
  const W = wide ? 38 : 26, H = wide ? 36 : 30, P = painter(W, H), s = wide ? 12582 : 12581;
  for (let x = 0; x < W; x++) { const d = 2 + Math.round(Math.sin(x / W * Math.PI) * 2 + cn(x, 0, 60, 60, s) * 2); for (let y = 0; y < d; y++) P.put(x, y, RP.micelio, 3.4 - y * 0.5 + cg(x, y, s) * 0.6); }
  for (let x = 1; x < W - 1; x += 1 + (hash2(x, 0, s) < 0.5 ? 1 : 0)) {
    const len = (H - 5) * (0.35 + Math.sin((x + 0.5) / W * Math.PI) * 0.65) * (0.6 + hash2(x, 1, s) * 0.4);
    thread(P, x, 2, len, s + x, hash2(x, 2, s) < 0.5 ? RP.micelio : RP.tronco, hash2(x, 3, s) < 0.25 ? RP.esporo : hash2(x, 3, s) < 0.5 ? RP.micelio : null);
  }
  return P.done(false);
}
function shroomLantern(k) {   // 12 x 26 or 12 x 34: a colony lantern on a cord, a glowing mushroom in it where the flame was
  const H = k ? 34 : 26, P = painter(12, H), s = 12601 + k, top = H - 16;
  for (let y = 0; y < top; y++) P.put(6 + Math.sin(y * 0.5 + s) * 0.5, y, RP.micelio, 3.2 - (y % 3 === 0 ? 0.8 : 0));
  P.rect(3, top, 6, 2, RP.ferro, (i, j) => 3.4 - i * 0.3 - j); P.put(5, top - 1, RP.ferro, 3.6); P.put(6, top - 1, RP.ferro, 2.8);
  // the glass, the mushroom glowing inside it
  for (let y = top + 2; y < top + 11; y++) for (let x = 2; x < 10; x++) {
    if (x === 2 || x === 9 || x === 6) { P.put(x, y, RP.ferro, x === 2 ? 3.6 : x === 6 ? 2.8 : 1.8); continue; }
    P.put(x, y, RP.agua, 2 + (x < 5 ? 0.6 : 0) + cg(x, y, s) * 0.3);
  }
  const my = top + 9; for (let j = 0; j < 4; j++) P.put(5, my - j, RP.tronco, 3.8 - j * 0.2); for (let i = -2; i <= 2; i++) { P.put(5 + i, my - 4, RP.chapeu, 4.6 - Math.abs(i) * 0.4); P.put(5 + i, my - 3, RP.chapeu, 5 - Math.abs(i) * 0.3); } P.put(5, my - 5, RP.chapeu, 5);
  P.put(7, my - 1, RP.chapeu, 4.4); P.put(7, my - 2, RP.chapeu, 4.8); P.put(8, my - 2, RP.chapeu, 4);   // a second, small
  P.rect(1, top + 11, 10, 2, RP.ferro, (i, j) => 3.4 - i * 0.2 - j); P.rect(3, top + 13, 6, 2, RP.ferro, (i) => 2 - i * 0.1);
  overgrow(P, 0.05, s, (x, y) => (P.is(x, y, RP.ferro) ? 0.15 : -1));
  thread(P, 3, top + 15, 1 + k * 2, s);
  return P.done();
}

/* =============================== BACK WALL =============================== */
function galleryArch() {   // 44 x 42: a timber arch of the colony's gallery shoved crooked by the fungus, cords wound round the posts, threads off the lintel
  const P = painter(44, 42), s = 12621, Q = painter(44, 42);
  plank(Q, 3, 4, 38, 4, RP.madeira, s, true, 2.6); plank(Q, 37, 5, 37, 4, RP.madeira, s + 1, true, 2.2);
  plank(Q, 0, 1, 44, 4, RP.madeira, s + 2, false, 2.8);
  Q.line(7, 6, 15, 12, RP.madeira, 2.4, 2); Q.line(37, 7, 29, 13, RP.madeira, 2, 2);   // braces
  blit(P, Q, 0, 0, 0, 0, 0);
  // the lintel bowed down in the middle where the post was pushed: redraw the left post leaning
  for (let y = 0; y < 42; y++) for (let x = 0; x < 9; x++) P.clear(x, y);
  const L = painter(6, 40); plank(L, 0, 0, 40, 4, RP.madeira, s + 3, true, 2.6); blit(P, L, 3, 3, 0.07, 2, 39);
  // cords of mycelium spiralling up the posts and along the beam
  for (const [x0, w] of [[5, 4], [39, 4]]) for (let y = 4; y < 42; y++) { const ph2 = (y * 0.45 + x0) % 6.28, x = x0 + Math.sin(ph2) * w * 0.55 - (x0 < 20 ? (41 - y) * 0.07 : 0); if (Math.cos(ph2) > -0.2 || y > 34) P.put(x, y, RP.micelio, 3 + Math.cos(ph2) * 0.9 + cg(x, y, s) * 0.5); }
  tube(P, t => [2 + t * 40, 3.6 + Math.sin(t * 9) * 1.2 + t * 1], () => 1.8, RP.micelio, s + 4, 2.8);
  for (let x = 9; x < 36; x += 2) if (hash2(x, 0, s) < 0.6) thread(P, x, 5, 3 + hash2(x, 1, s) * 9, s + x);
  bracket(P, 41, 20, 4, s, 0.3); bracket(P, 6, 27, 4, s + 1); bracket(P, 40, 31, 3, s + 2);
  for (let x = 0; x < 44; x++) if (hash2(x, 4, s) < (x < 10 || x > 34 ? 0.8 : 0.2)) P.put(x, 41, RP.micelio, 2.4 + hash2(x, 5, s));
  fuzz(P, s, 0.15);
  return P.done();
}
function wallColonist(k) {   // 22 x 34: a colonist swallowed by a mound of mycelium against the wall, only the face and a hand out (k 1: the Coração's, pinker, older)
  const P = painter(22, 34), s = 12641 + k;
  for (let y = 0; y < 34; y++) for (let x = 0; x < 22; x++) {
    const t = y / 34, hw = 6 + t * 4.6 + Math.sin(y * 0.4 + s) * 0.8 + (y < 6 ? -(6 - y) * 0.7 : 0), d = Math.abs(x + 0.5 - 11) / hw; if (d > 1) continue;
    const rope = Math.sin(x * 1.2 + y * 0.35 + Math.sin(y * 0.2) * 2) > 0.4;
    P.put(x, y, k && cn(x, y, 30, 30, s) > 0.12 ? RP.carne : RP.micelio, 2.6 - (x + 0.5 - 11) / hw * 1.1 - t * 0.6 + (rope ? 0.7 : -0.2) + cg(x, y, s) * 0.5);
  }
  // the shape of the shoulders under it, the face out at the top, the mouth open
  for (let x = 4; x < 18; x++) { const y = 13 - Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((x + 0.5 - 11) / 7, 2))) * 2); P.put(x, y, RP.micelio, 4.2 - (x - 4) * 0.12); }
  const fx = 11, fy = 7.6; for (let a = 0; a < 6.3; a += 0.12) for (const r of [3.6, 4.2]) P.put(fx + Math.cos(a) * r * 0.9, fy + Math.sin(a) * r, RP.micelio, 1);
  P.blob(fx, fy, 3, 3.6, RP.pele, s, k ? 2.4 : 3);
  if (k) overgrow(P, 0.1, s + 2, (x, y) => (Math.hypot(x - fx, y - fy) < 4 ? 0.15 : -2));
  P.put(fx - 1.4, fy - 0.8, RP.sombra, 0.6); P.put(fx + 1.2, fy - 0.8, RP.sombra, 0.6); P.put(fx - 1.4, fy - 1.8, RP.pele, 3.6); P.put(fx + 1, fy - 1.8, RP.pele, 3.2);   // eyes, brows
  P.put(fx, fy + 1.6, RP.sombra, 0.4); P.put(fx - 0.6, fy + 2.4, RP.sombra, 0.6); P.put(fx + 0.6, fy + 2.4, RP.sombra, 1);   // the mouth
  P.blob(fx - 2, fy - 3.2, 2.6, 1.4, RP.couro, s + 1, 1.6);   // a lock of hair at the brow
  for (let a = 0; a < 6.3; a += 0.18) { const x = fx + Math.cos(a) * 3.6, y = fy + Math.sin(a) * 4.2; if (hash2(Math.round(x), Math.round(y), s) < 0.7) P.put(x, y, RP.micelio, 4 - Math.sin(a) * 0.6); }   // the rim of the hole round the face
  // the hand, reaching out of the mound, low on the left
  const hx = 5, hy = 21; P.blob(hx, hy, 1.8, 1.6, RP.pele, s + 2, k ? 2.2 : 2.8); for (let f = 0; f < 4; f++) P.line(hx - 1.5 + f, hy - 1, hx - 2.6 + f * 1.3, hy - 3.6 + Math.abs(f - 1.5) * 0.5, RP.pele, 2.6 - f * 0.2, 1);
  for (let a = 0; a < 6.3; a += 0.3) P.put(hx + 0.5 + Math.cos(a) * 2.4, hy + 0.5 + Math.sin(a) * 2, RP.micelio, 3.8);
  for (const [x, y] of [[4, 6], [17, 10], [15, 25], [7, 29]]) sprout(P, x, y, 2, s + x, 1, k ? RP.carne : RP.micelio);
  fuzz(P, s, 0.25);
  return P.done();
}
function boardedDoor() {   // 24 x 36: a colony house door in its brick frame, boarded across, a plague cross daubed on it, mycelium seeping out round the edges
  const P = painter(24, 36), s = 12661;
  for (let y = 0; y < 36; y++) for (let x = 0; x < 24; x++) {   // the brick frame and lintel
    const inside = x >= 4 && x < 20 && y >= 5; if (inside) continue;
    const row = Math.floor(y / 3), off = row % 2 ? 2 : 0, mortar = y % 3 === 2 || (x + off) % 5 === 4;
    P.put(x, y, RP.tijolo, mortar ? 1 + cg(x, y, s) * 0.5 : 2.8 + hash2(Math.floor((x + off) / 5), row, s) * 1 - (x / 24) * 1 + (y % 3 === 0 ? 0.5 : 0) + cg(x, y, s) * 0.4);
  }
  for (let x = 2; x < 22; x++) P.put(x, 4, RP.tijolo, 3.6 - x * 0.06);
  for (let x = 4; x < 20; x++) for (let y = 5; y < 36; y++) { const pl2 = Math.floor((x - 4) / 4), lx = (x - 4) % 4; P.put(x, y, RP.madeira, (lx === 3 ? 1.2 : 2.4 - lx * 0.2) + hash2(pl2, 0, s) * 0.6 + cg(x, y, s) * 0.4 - (y > 31 ? 0.6 : 0)); }   // the door
  P.put(16, 20, RP.ferro, 3.6); P.put(17, 20, RP.ferro, 2.4);   // the latch
  // the boards: one across, one diagonal, nails
  const board = (x0, y0, x1, y1, ss) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2); for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; for (let j = 0; j < 3; j++) P.put(x, y + j, RP.madeira, (j === 0 ? 3.6 : j === 2 ? 1.6 : 2.8) + cg(Math.round(x), j, ss) * 0.4); } P.put(x0 + 1, y0 + 1, RP.ferrugem, 3.6); P.put(x1 - 1, y1 + 1, RP.ferrugem, 3.6); };
  board(1, 11, 23, 13, s); board(2, 29, 22, 21, s + 1); board(1, 31, 23, 31, s + 2);
  for (const [x0, y0, x1, y1] of [[7, 16, 13, 24], [13, 16, 7, 24]]) P.line(x0, y0, x1, y1, RP.rubro, 3.2, 1);   // the cross daubed in red
  // mycelium coming out of the gaps: under the door, up the hinge side
  for (let x = 3; x < 21; x++) for (let j = 0; j < 3; j++) if (hash2(x, j, s) < 0.75 - j * 0.25) P.put(x, 35 - j, RP.micelio, 3.6 - j * 0.3 + hash2(x, j + 3, s));
  for (let y = 6; y < 35; y++) if (hash2(y, 7, s) < 0.6) P.put(4 + (hash2(y, 8, s) < 0.5 ? 0 : 1), y, RP.micelio, 3.2 + hash2(y, 9, s));
  for (let x = 5; x < 19; x++) if (hash2(x, 10, s) < 0.4) P.put(x, 5, RP.micelio, 3.4);
  thread(P, 9, 6, 4, s); thread(P, 15, 6, 6, s + 1);
  bracket(P, 21.5, 26, 3, s);
  fuzz(P, s, 0.2);
  return P.done();
}
function myceliumPillar() {   // 24 x 52: a pillar of mycelium cords twisted thick as a trunk, roots flared on the floor, fanning out into the wall at the top, pink veins
  const P = painter(24, 52), s = 12681, cx = 12;
  const half = y => { const t = y / 51; return 6 + Math.pow(Math.max(0, (0.22 - t) / 0.22), 1.6) * 5.6 + Math.pow(Math.max(0, (t - 0.8) / 0.2), 1.8) * 5.6 + Math.sin(y * 0.3) * 0.4; };
  for (let y = 0; y < 52; y++) {
    const hw = half(y), c = cx + Math.sin(y * 0.09) * 0.8;
    for (let x = 0; x < 24; x++) {
      const u = (x + 0.5 - c) / hw; if (Math.abs(u) > 1) continue;
      if ((y < 10 || y > 42) && Math.abs(u) > 0.55 && cn(x, y, 50, 50, s) > 0.08) continue;   // gaps between the splayed cords
      const cord = Math.sin(u * 7 + y * 0.32), R = RP.micelio;
      P.put(x, y, R, 2.8 - u * 1.2 + cord * 0.7 + cg(x, y, s) * 0.4 - (cord < -0.75 ? 0.9 : 0));
    }
  }
  for (let v = 0; v < 2; v++) { let x = 10 + v * 4; for (let y = 8; y < 46; y++) { x += (hash2(y, v, s) - 0.5) * 1.2 + (12 - x) * 0.05; if (P.has(x, y) && hash2(y, v + 5, s) < 0.8) P.put(x, y, RP.carne, 3.2 + hash2(y, v + 9, s)); } }   // veins
  for (const [x, y] of [[6, 20], [18, 31], [7, 38]]) bracket(P, x, y, 3, s + x, 0.3);
  fuzz(P, s, 0.15);
  return P.done();
}
function colonySign() {   // 48 x 17: the colony's sign, FERROALTO carved in a board, split in two, the right half hanging from its last nail
  const P = painter(48, 17), s = 12701, Q = painter(25, 15);
  const carve = (Pp, x0, txt) => { let x = x0; for (const ch of txt) { const g = FONT[ch]; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j][i] === '1') { Pp.put(x + i, 5 + j, RP.sombra, 1.2); if (!(g[j + 1] && g[j + 1][i] === '1')) Pp.put(x + i, 6 + j, RP.madeira, 4); } x += 4; } };
  const cutAt = y => 22 + Math.round(Math.sin(y * 1.7) * 1 + hash2(y, 0, s) * 1.6);
  plank(P, 0, 2, 26, 11, RP.madeira, s, false, 2.8);
  for (let y = 2; y < 13; y++) for (let x = cutAt(y) + 1; x < 26; x++) P.clear(x, y);   // the split
  carve(P, 2, 'FERRO');
  plank(Q, 0, 2, 25, 11, RP.madeira, s + 1, false, 2.6);
  for (let y = 2; y < 13; y++) for (let x = 0; x <= cutAt(y) - 21; x++) Q.clear(x, y);
  carve(Q, 4, 'ALTO');
  Q.put(22, 4, RP.ferrugem, 3.6);
  blit(P, Q, 22, 2, 0, 0, 0);
  P.put(2, 4, RP.ferrugem, 3.6);
  overgrow(P, 0.02, s, (x, y) => (x > 38 ? (x - 38) * 0.06 : -0.3) + (y > 12 ? 0.15 : 0));
  for (const x of [6, 13, 29, 35, 41]) thread(P, x, 13 + (x > 24 ? 2 : 0), 1 + hash2(x, 0, s) * 3, s + x);
  bracket(P, 44, 8, 4, s);
  fuzz(P, s, 0.15);
  return P.done();
}
function bracketShelf() {   // 30 x 16: a colony shelf on two brackets, a jar and a bottle left on it, bracket fungi grown along it with faintly glowing gills
  const P = painter(30, 16), s = 12721;
  plank(P, 0, 6, 30, 2, RP.madeira, s, false, 2.8);
  for (const x of [4, 24]) { P.line(x, 8, x, 13, RP.ferro, 2.8, 1); P.line(x, 13, x + 4, 8, RP.ferro, 2.2, 1); }
  P.rect(5, 1, 4, 5, RP.agua, (i, j) => 3 - i * 0.4 + (j === 0 ? 1 : 0)); P.rect(5, 0, 4, 1, RP.ferro, (i) => 3 - i * 0.3); P.rect(6, 3, 2, 2, RP.esporo, () => 2.6);   // a jar with something in it
  P.rect(20, 2, 2, 4, RP.esporita, (i) => 2.6 - i); P.put(20, 1, RP.esporita, 3); P.put(20, 0, RP.couro, 2.6);   // a bottle
  for (const [x, y, w] of [[12, 6, 5], [16, 6, 4], [27, 6, 4], [13, 11, 4], [8, 10, 3], [19, 12, 4]]) bracket(P, x, y, w, s + x, 0.8);
  for (let x = 11; x < 18; x++) if (hash2(x, 0, s) < 0.6) P.put(x, 8, RP.micelio, 3);
  fuzz(P, s, 0.15);
  return P.done();
}
function esporitaSeam(k) {   // 32 x 17: plates of esporita laid bare in a patch of schist, cream fibres between them (k 1: in taken rock, richer)
  const P = painter(32, 17), s = 12741 + k, R = k ? RP.tomada : RP.xisto;
  for (let y = 0; y < 17; y++) for (let x = 0; x < 32; x++) { const dx = (x + 0.5 - 16) / 16, dy = (y + 0.5 - 8.5) / 8.5; if (dx * dx + dy * dy > 1 - cn(x, y, 30, 30, s) * 0.6) continue; P.put(x, y, R, (k ? 1.6 : 2.2) - dx * 0.7 - dy * 0.6 + cg(x, y, s) * 0.6 + (Math.abs(((x * 0.3 + y) % 4) - 2) < 0.4 ? 0.6 : 0)); }
  // the plates: angular flakes along a band, a lit edge on each
  for (let i = 0; i < (k ? 9 : 6); i++) {
    const x0 = 4 + i * (k ? 2.7 : 3.9) + hash2(i, 0, s) * 2, y0 = 8.5 + Math.sin(x0 * 0.3 + 1) * 2.4 + (hash2(i, 1, s) - 0.5) * 3, w = 2 + hash2(i, 2, s) * 2.4, h = 1.4 + hash2(i, 3, s) * 1.6, sk = (hash2(i, 4, s) - 0.5) * 1.2;
    for (let y = Math.floor(y0 - h); y <= y0 + h; y++) for (let x = Math.floor(x0 - w); x <= x0 + w; x++) { const u = (x + 0.5 - x0 - (y - y0) * sk) / w, v = (y + 0.5 - y0) / h; if (Math.abs(u) + Math.abs(v) > 1 || !P.has(x, y)) continue; P.put(x, y, RP.esporita, 3.2 - u * 0.8 - v * 1.2 + cg(x, y, s) * 0.5 + (Math.abs(u) + Math.abs(v) > 0.7 && v < 0 ? 1.4 : 0)); }
  }
  for (let v = 0; v < 4; v++) { let x = 3 + v * 8, y = 3; for (let j = 0; j < 12; j++) { x += (hash2(j, v, s) - 0.5) * 2; y += 1; if (P.has(x, y) && !P.is(x, y, RP.esporita)) P.put(x, y, RP.micelio, 2.8 + hash2(j, v + 3, s)); } }
  fuzz(P, s, 0.1);
  return P.done();
}

/* =============================== register =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes, fungo: true }, extra || {}));
const WARM = '#ffa040', CYAN = '#5ae0d0', GREEN = '#9ad85a', PINK = '#f0a0a0', ESP = '#40d0a8';
// floor
def('fg_colono', 'Colono fossilizado', F, 'frente', ['galerias', 'coracao'], [colonist(0), colonist(1)]);
def('fg_beliche', 'Beliche podre', F, 'frente', ['galerias'], [bunk(0), bunk(1)]);
def('fg_mesa', 'Mesa com lampião e mapa', F, 'frente', ['galerias'], [lampTable()], { luz: [{ x: 5, y: 4, r: 0.5 }], chamas: [{ x: 5, y: 5 }], brilho: WARM });
def('fg_carrinho', 'Carrinho de mão tombado', F, 'frente', ['galerias'], [tippedBarrow()]);
def('fg_sacos', 'Sacos de esporita', F, 'frente', ['galerias'], [sacks(0), sacks(1)]);
def('fg_bigorna', 'Bigorna tomada', F, 'frente', ['galerias'], [anvil()]);
def('fg_maca', 'Maca da enfermaria', F, 'frente', ['galerias'], [stretcher(0), stretcher(1)]);
def('fg_cogumelo', 'Cogumelo gigante', F, 'frente', ['bosque', 'grutas'], [giantShroom(false), giantShroom(true)], { luz: [], luzV: [[{ x: 12, y: 10, r: 0.6 }], [{ x: 18, y: 14, r: 0.75 }, { x: 8, y: 13, r: 0.5 }, { x: 28, y: 13, r: 0.5 }]], brilho: CYAN });
def('fg_touceira', 'Touceira de chapéus', F, 'frente', ['bosque'], [capClump(0), capClump(1)]);
def('fg_toco', 'Toco de cogumelo cortado', F, 'frente', ['bosque'], [stump()]);
def('fg_ninho', 'Ninho de brotos', F, 'frente', ['bosque'], [sproutNest(0), sproutNest(1)]);
def('fg_barco', 'Barco encalhado', F, 'frente', ['grutas'], [strandedBoat()], { beira: true });
def('fg_redes', 'Redes podres', F, 'frente', ['grutas'], [netHeap()]);
def('fg_coracao', 'Coração de micélio', F, 'frente', ['coracao'], [floorHeart()], { luz: [], luzV: [[{ x: 15, y: 10, r: 0.45 }]], brilho: PINK, anim: { k: 'fung_pulso', x: 15, y: 10 } });
def('fg_casulo', 'Casulo de corpo', F, 'frente', ['coracao'], [bodyCocoon(0), bodyCocoon(1)]);
// ceiling
def('fg_cacho', 'Cacho de esporos', C, 'frente', ['bosque', 'coracao'], [sporeCluster(false), sporeCluster(true)], { luz: [], luzV: [[{ x: 8, y: 12, r: 0.5 }], [{ x: 11, y: 18, r: 0.65 }]], brilho: GREEN });
def('fg_estalactite', 'Estalactite fúngica', C, 'frente', ['grutas', 'coracao'], [fungalStalactite(false), fungalStalactite(true)]);
def('fg_polia', 'Polia com balde', C, 'frente', ['galerias'], [pulley()]);
def('fg_gaiola', 'Gaiola vazia', C, 'frente', ['galerias'], [birdCage()]);
def('fg_cortina', 'Cortina de fios', C, 'frente', ['bosque', 'coracao'], [threadCurtain(false), threadCurtain(true)]);
def('fg_lanterna', 'Lanterna de cogumelo', C, 'frente', ['grutas'], [shroomLantern(0), shroomLantern(1)], { luz: [], luzV: [[{ x: 6, y: 16, r: 0.65 }], [{ x: 6, y: 24, r: 0.65 }]], brilho: CYAN });
// back wall
def('fg_arco', 'Arco da galeria', W, 'fundo', ['galerias'], [galleryArch()]);
def('fg_preso', 'Colono preso na parede', W, 'fundo', ['galerias', 'coracao'], [wallColonist(0), wallColonist(1)]);
def('fg_porta', 'Porta lacrada', W, 'fundo', ['galerias'], [boardedDoor()]);
def('fg_pilar', 'Pilar de micélio', W, 'fundo', ['coracao'], [myceliumPillar()]);
def('fg_placa', 'Placa de Ferroalto', W, 'fundo', ['galerias'], [colonySign()]);
def('fg_orelhas', 'Orelhas-de-pau na prateleira', W, 'fundo', ['bosque'], [bracketShelf()], { luz: [{ x: 15, y: 9, r: 0.3 }], brilho: CYAN });
def('fg_veio', 'Veio de esporita', W, 'fundo', ['grutas', 'coracao'], [esporitaSeam(0), esporitaSeam(1)], { luz: [{ x: 16, y: 8, r: 0.3 }], brilho: ESP });

// what each band gets, per open stretch of floor or ceiling: [id, chance per 10 blocks, max per stretch]
Object.assign(FG_PROP_PLAN, {
  galerias: { chao: [['fg_colono', 0.08, 1], ['fg_beliche', 0.06, 1], ['fg_mesa', 0.06, 1], ['fg_carrinho', 0.08, 1], ['fg_sacos', 0.12, 1], ['fg_bigorna', 0.05, 1], ['fg_maca', 0.05, 1]], teto: [['fg_polia', 0.12, 1], ['fg_gaiola', 0.06, 1]], fundo: [['fg_arco', 0.06, 1], ['fg_preso', 0.04, 1], ['fg_porta', 0.05, 1], ['fg_placa', 0.05, 1]] },
  bosque: { chao: [['fg_cogumelo', 0.3, 2], ['fg_touceira', 0.25, 2], ['fg_toco', 0.08, 1], ['fg_ninho', 0.12, 1]], teto: [['fg_cacho', 0.2, 2], ['fg_cortina', 0.2, 2]], fundo: [['fg_orelhas', 0.12, 1]] },
  grutas: { chao: [['fg_barco', 0.3, 1], ['fg_cogumelo', 0.15, 1], ['fg_redes', 0.12, 1]], teto: [['fg_estalactite', 0.3, 2], ['fg_lanterna', 0.15, 1]], fundo: [['fg_veio', 0.1, 1]] },
  coracao: { chao: [['fg_coracao', 0.12, 1], ['fg_casulo', 0.15, 1], ['fg_colono', 0.06, 1]], teto: [['fg_cacho', 0.15, 1], ['fg_estalactite', 0.2, 2], ['fg_cortina', 0.15, 1]], fundo: [['fg_pilar', 0.1, 1], ['fg_preso', 0.06, 1], ['fg_veio', 0.08, 1]] }
});
}

/* ---------- one light per variation (`luzV`), and the heart that beats ----------
   45's propLights/drawPropGlows read def.luz, which is one list for every variation; props of two sizes (the giant
   mushroom, the spore cluster, the lantern on its cord) keep `luz: []` (so they still count as lit) and their own
   list per variation in `luzV`. The heart's light swells with each beat. */
const fungBeat = t => { const p = (t * 0.8) % 1; return Math.max(0, 1 - Math.abs(p - 0.06) * 8) + Math.max(0, 1 - Math.abs(p - 0.26) * 10) * 0.55; };   // lub-dub, slow
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], LV = p.def.luzV; if (!LV) continue;
    const ls = LV[p.v] || LV[0], k = p.def.anim && p.def.anim.k === 'fung_pulso' ? 0.75 + 0.3 * fungBeat(gameTime + p.X * 0.013) : 1;
    for (let j = 0; j < ls.length; j++) addL(p.X + p.sh + ls[j].x, p.Y + ls[j].y, ls[j].r * k);
  }
}; }
const fungGlowCv = {};
{ const _dg = drawPropGlows; drawPropGlows = function (cx, cy, fl) {
  _dg(cx, cy, fl);
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], LV = p.def.luzV; if (!LV) continue;
    const g = fungGlowCv[p.def.brilho] || (fungGlowCv[p.def.brilho] = glow(30, p.def.brilho)), ls = LV[p.v] || LV[0];
    for (let j = 0; j < ls.length; j++) { lc.globalAlpha = 0.24 * fl * ls[j].r; lc.drawImage(g, Math.round(p.X + p.sh + ls[j].x - cx - 30), Math.round(p.Y + ls[j].y - cy - 32)); }
  }
}; }
let fungHeartGlow = null;
HOOK.drawGlow.push((cx, cy) => {
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || A.k !== 'fung_pulso') continue;
    if (!fungHeartGlow) fungHeartGlow = glow(26, '#ff8a9a');
    lc.globalAlpha = 0.4 * fungBeat(gameTime + p.X * 0.013); lc.drawImage(fungHeartGlow, Math.round(p.X + p.sh + A.x - cx - 26), Math.round(p.Y + A.y - cy - 26));
  }
});
// on the beat the heart swells a pixel and flushes
HOOK.drawTop.push((cx, cy) => {
  if (!fungHeartCv) return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || A.k !== 'fung_pulso') continue;
    const b = fungBeat(gameTime + p.X * 0.013); if (b < 0.3) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    lc.globalAlpha = 0.22 * b; lc.drawImage(fungHeartCv, 2, 0, 26, 19, X + 1, Y - 1, 28, 20);
  }
  lc.globalAlpha = 1;
});
