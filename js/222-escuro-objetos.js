'use strict';

/* ================= a Escuridão: props =================
   Everything bigger than a block that dresses A Escuridão (docs/camadas/16-escuridao.md, section 5). On the floor: a
   Kindler's statue with its arm raised and no head, the bones of one hugging a big lantern, a fallen pyre, a heap of
   burnt-out torches, a dry oil jar, a broken obelisk with sun rays, an empty pedestal, a ring of the Kindlers' stones,
   the carcass of a colossus turned to stone, a stone hand coming out of the floor, a cut root stump, a cold altar and
   the two Seals of the Bottom (round discs of carved stone with a sun, cold and shut: protected, they never break). From
   the roof: a dead lantern on its chain, an empty wisp cage, a moth cocoon, a cluster of hanging roots, a faded banner
   with a sun. On the back wall standing on the floor: a sealed door of the Kindlers, the relief of the rising sun, a
   root vein climbing the wall. At eye height: the Mural of the Kindlers (a column of 16 bands painted one over the
   other, a small sun at the top, a black stain rising from the bottom: the map of the world painted by the ones who
   built it), faded writing, someone's shadow on the wall that belongs to nobody, a window onto the Nothing, a pair of
   big eyes that blink (live, only in the dark), pale hand prints.
   Nothing here gives light: the warm is the hero's or the Kindlers' braziers, the cold is the Darkness's.
   Same painter as 132 (6-tone ramps of the card's section 12, lit from the top left, dark rim only where the sprite
   touches air). Registered with defProp (`escuro: true`), placed by 226 from ES_PROP_PLAN; `unico` ones (the seals,
   the mural) only where 226 puts them. */
const ES_PROP_PLAN = {};
// back-wall pieces that stand on the floor instead of hanging at eye height
const ES_BACK_FLOOR = { es_porta: 1, es_relevo: 1, es_veia: 1, es_mural: 1 };
{
const { cg, cn } = ESART;
const R6 = hexes => hexes.map(h => ph(h));
const RP = {
  apagada: R6(['#121012', '#1e1a1a', '#2a2524', '#3a3330', '#4c4440', '#605652']),
  breu: R6(['#07080c', '#0d0f15', '#14171f', '#1b1f2a', '#242936', '#2e3444']),
  vidro: R6(['#08080c', '#0e0d14', '#191826', '#262438', '#3a3852', '#6a6890']),
  raiz: R6(['#0a070c', '#150f18', '#211726', '#2e2036', '#3e2b48', '#54405e']),
  primeva: R6(['#1a1a1e', '#26262c', '#33333a', '#43434b', '#57575f', '#6e6e76']),
  lavrada: R6(['#2a241c', '#3a3226', '#4c4232', '#625640', '#7c6e52', '#9a8a68']),
  ferro: R6(['#050608', '#0c0d10', '#16181c', '#22252a', '#30343a', '#42474e']),
  madeira: R6(['#0c0907', '#16110c', '#221a12', '#2e2318', '#3c2e20', '#4c3a28']),
  carvao: R6(['#050506', '#0a0a0c', '#121216', '#1a1a20', '#24242c', '#30303a']),
  cinza: R6(['#141212', '#201e1c', '#2e2a28', '#3e3a36', '#524c48', '#68625c']),
  osso: R6(['#26221c', '#3e382e', '#5c5444', '#7e745e', '#a09478', '#bcb094']),
  pano: R6(['#140e0c', '#22180f', '#322418', '#443222', '#56422e', '#6a523a']),
  ouro: R6(['#1e1608', '#3a2a0e', '#5a4216', '#7c5e22', '#9c7a32', '#bc9a4c']),
  pele: R6(['#1e1a18', '#2e2a26', '#423c36', '#5a5248', '#746a5c', '#8e8472']),
  sombra: R6(['#020203', '#040406', '#07070a', '#0a0a0f', '#0e0e14', '#13131a']),
  palido: R6(['#3a3c44', '#5a5e6a', '#7e8494', '#a4aabb', '#c8ceda', '#e6ecf4']),
  // the mural's paint, faded: one tone per layer of the world, top to bottom
  tinta: [R6(['#3a2a1a', '#5a4026', '#7a5634', '#9a6e44', '#b48a5a', '#c8a274']),   // the caves
    R6(['#4a4640', '#6a645a', '#8a8476', '#a8a292', '#c2bcaa', '#d6d0be']),          // the cathedral
    R6(['#1c2a34', '#2a4250', '#3e5c6c', '#567688', '#7090a2', '#8eaabc']),          // the ice
    R6(['#2e1c12', '#4a2c1a', '#663e24', '#82522e', '#9c663a', '#b47c4a']),          // the mine
    R6(['#12282a', '#1c3e40', '#285656', '#36706c', '#488a84', '#62a49c']),          // the fungus
    R6(['#26262a', '#3a3a40', '#505058', '#686872', '#82828c', '#9c9ca6']),          // the city
    R6(['#2a0c0a', '#4a1410', '#6a1e16', '#8a2a1e', '#a83a28', '#c44e36'])]          // the abyss
};
const OUTLINE = ph('#030304');

/* ---- the painter (132's: 6 tones, rimmed where it touches the air) ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); },
    clear(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    box(x0, y0, rw, rh, R, s, base = 2.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.4 : j === 1 ? 0.5 : 0) + (i === 0 ? 0.6 : 0) - (j === rh - 1 ? 1.3 : 0) - (i === rw - 1 ? 0.9 : 0) + cg(x, y, s) * 0.5 + cn(x * 4, y * 4, 60, 60, s + 1) * 0.45); },
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
// a thick curve, round in section, lit from the top left
function tube(P, fn, wd, R, s, base = 2.8) {
  const [ax, ay] = fn(0), [bx, by] = fn(1), n = Math.ceil(Math.hypot(bx - ax, by - ay) * 3) + 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = fn(t), r = Math.max(0.5, wd(t) / 2);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      const dx = (xx + 0.5 - x) / r, dy = (yy + 0.5 - y) / r, d = dx * dx + dy * dy; if (d > 1) continue;
      P.put(xx, yy, R, base + 0.8 - (dx + dy) * 0.95 - d * 0.45 + cg(xx, yy, s) * 0.3);
    }
  }
}
// a carved sun in relief: boss, ring, rays (on a stone face)
function sunRelief(P, cx, cy, r, R, s, lift = 0) {
  for (let y = Math.floor(cy - r - 3); y <= cy + r + 3; y++) for (let x = Math.floor(cx - r - 3); x <= cx + r + 3; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (!P.has(x, y)) continue;
    if (d < r * 0.45) P.put(x, y, R, 4.2 + lift - (dx + dy) / r * 0.8);
    else if (d > r * 0.7 && d < r) P.put(x, y, R, (dx + dy > 0 ? 1.2 : 3.8) + lift);
    else if (d >= r * 1.1 && d < r + 3 && Math.abs(Math.sin(a * 4)) > 0.85) P.put(x, y, R, 1.4 + lift);
  }
}
function chainV(P, x, y0, y1, R = RP.ferro, base = 3.4) { for (let y = y0; y <= y1; y++) { const ring = (y - y0) % 4; if (ring === 0 || ring === 3) { P.put(x - 1, y, R, base + 0.6); P.put(x + 1, y, R, base - 1); } else P.put(x, y, R, base + 0.8 - (ring === 2 ? 0.8 : 0)); } }

/* =============================== floor =============================== */
function kindlerStatue() {   // 22 x 46: a Kindler in a long robe on a plinth, the right arm raised as if holding up a light; the head broken away
  const P = painter(22, 46), s = 22701, St = RP.lavrada;
  P.box(1, 38, 20, 8, St, s, 2.8);                                                                      // the plinth
  for (let y = 41; y < 44; y++) for (let x = 4; x < 18; x += 5) P.put(x, y, St, 1.4);
  for (let y = 12; y < 38; y++) { const hw = 4 + (y - 12) * 0.18; for (let x = Math.floor(11 - hw); x <= 11 + hw; x++) P.put(x, y, St, 3 - (x - 11) / hw * 1.2 + ((x * 3 + y) % 7 === 0 ? -0.8 : 0) + cg(x, y, s) * 0.4); }   // the robe, folds
  for (let y = 14; y < 37; y += 1) if ((y % 5) < 2) P.put(9, y, St, 1.6);
  P.blob(11, 12, 4, 3, St, s + 1, 2.8);                                                                 // the shoulders
  tube(P, t => [14 + t * 4, 12 - t * 10], () => 3, St, s + 2, 2.8);                                     // the raised arm
  P.blob(18.4, 2.4, 2, 1.8, St, s + 3, 3.2);                                                            // the fist (empty)
  tube(P, t => [8 - t * 2, 13 + t * 9], () => 2.6, St, s + 4, 2.2);                                     // the other arm down
  for (const [x, y] of [[10, 8], [11, 9], [12, 8], [10, 10], [13, 10]]) P.put(x, y, St, 1.2);            // the break where the head was
  for (const [x, y] of [[9, 9], [12, 7]]) P.put(x, y, St, 4.4);
  return P.done();
}
function bonesLantern() {   // 30 x 22: a Kindler's skeleton sitting against nothing, arms round a big empty lantern
  const P = painter(30, 22), s = 22711, O = RP.osso, F = RP.ferro;
  for (let x = 2; x < 18; x++) { P.put(x, 21, O, 2.6 - x * 0.05); P.put(x, 20, O, 3.6 - x * 0.06); }    // the legs out
  P.blob(5, 6, 3.4, 3.2, O, s, 3.2);                                                                    // the skull, tipped
  P.put(4, 6, O, 0.4); P.put(6, 6, O, 0.4); P.put(5, 8, O, 1.2); P.put(4, 9, O, 2); P.put(6, 9, O, 2);
  for (let y = 10; y < 19; y++) for (let x = 3; x < 9; x++) if (((y + x) & 1) === 0 || x === 3) P.put(x, y, O, 3.6 - (x - 3) * 0.25);   // the ribs
  for (let y = 9; y < 20; y++) P.put(2, y, O, 4);                                                       // the spine
  // the lantern: a tall iron cage with a ring on top, its glass gone dark
  for (let y = 4; y < 19; y++) { P.put(16, y, F, 3.8); P.put(25, y, F, 2); }
  for (let x = 16; x <= 25; x++) { P.put(x, 4, F, 4.4 - (x - 16) * 0.2); P.put(x, 18, F, 3); P.put(x, 19, F, 2.4); }
  for (let y = 5; y < 18; y++) for (let x = 17; x < 25; x++) P.put(x, y, RP.sombra, 2 + (x < 19 && y < 9 ? 1.5 : 0));
  for (let x = 18; x < 24; x++) P.put(x, 3, F, 3.6); P.blob(21, 1.5, 1.6, 1.4, F, s + 2, 3);
  tube(P, t => [7 + t * 9, 12 + Math.sin(t * 3) * 1.4], () => 1.8, O, s + 3, 3.2);                     // the arm round it
  tube(P, t => [7 + t * 9, 15 + t * 1], () => 1.6, O, s + 4, 2.6);
  return P.done();
}
function fallenPyre() {   // 40 x 18: a pyre of the Kindlers fallen on its side: the iron basket split, cold ash spilled, the plinth broken
  const P = painter(40, 18), s = 22721, F = RP.ferro, St = RP.lavrada;
  P.box(26, 9, 12, 9, St, s, 2.8); for (const [x, y] of [[26, 9], [27, 9], [37, 10]]) P.clear(x, y);
  for (let k = 0; k < 7; k++) { const x0 = 4 + k * 3; for (let y = 6; y < 16; y++) if ((y + k) % 3 !== 1) P.put(x0 + (y - 6) * 0.3, y, F, 3.6 - k * 0.1); }   // the basket's bars, lying
  for (let x = 3; x < 26; x++) { P.put(x, 5 + Math.sin(x * 0.3) * 0.8, F, 4.2); P.put(x, 16, F, 2.4); }
  for (let x = 0; x < 24; x++) { const h = 1 + Math.floor((1 - Math.abs(x - 12) / 12) * 3 * hash2(x, 0, s)); for (let y = 17 - h; y < 18; y++) P.put(x, y, hash2(x, y, s) < 0.4 ? RP.carvao : RP.cinza, 1.6 + hash2(x, y, s + 1) * 2.6); }
  return P.done();
}
function deadTorches() {   // 22 x 12: a heap of torches that burnt out, sticks every way, the charred heads
  const P = painter(22, 12), s = 22731, W = RP.madeira;
  for (let k = 0; k < 9; k++) {
    const a = (hash2(k, 0, s) - 0.5) * 1.2, x0 = 2 + hash2(k, 1, s) * 16, y0 = 11 - hash2(k, 2, s) * 3, len = 8 + hash2(k, 3, s) * 5;
    const x1 = x0 + Math.cos(a) * len, y1 = y0 - Math.abs(Math.sin(a)) * len * 0.6;
    P.line(x0, y0, x1, y1, W, 3.4 - k * 0.15);
    P.blob(x1, y1, 1.4, 1.2, RP.carvao, s + k, 2.4);
  }
  return P.done();
}
function oilJar() {   // 16 x 22: a tall clay jar for lamp oil, dry, the mouth chipped, a black stain down the side
  const P = painter(16, 22), s = 22741, C = RP.pele;
  for (let y = 3; y < 22; y++) { const t = (y - 3) / 19, hw = 2.4 + Math.sin(t * Math.PI) * 4.6 - (y > 19 ? (y - 19) : 0); for (let x = Math.floor(8 - hw); x <= 8 + hw; x++) P.put(x, y, C, 3.2 - (x - 8) / hw * 1.3 + cg(x, y, s) * 0.4); }
  for (let x = 5; x < 12; x++) P.put(x, 3, C, 4.6); P.clear(10, 3); P.clear(11, 3);
  for (let y = 4; y < 16; y++) P.put(10 + Math.sin(y) * 0.4, y, RP.carvao, 2);
  for (let x = 4; x < 13; x++) P.put(x, 9, C, 1.6);
  return P.done();
}
function brokenObelisk() {   // 18 x 40: an obelisk of the Kindlers snapped two-thirds up, a sun with rays cut on its face
  const P = painter(18, 40), s = 22751, St = RP.lavrada;
  P.box(1, 34, 16, 6, St, s, 2.8);
  for (let y = 8; y < 34; y++) { const hw = 4.2 - (34 - y) * 0.03; for (let x = Math.floor(9 - hw); x <= 9 + hw; x++) P.put(x, y, St, 3.1 - (x - 9) / hw * 1.4 + cg(x, y, s) * 0.4); }
  for (let x = 5; x <= 13; x++) { const top = 8 - Math.floor(hash2(x, 0, s) * 4); for (let y = top; y < 8; y++) P.put(x, y, St, 3.6); }   // the break, ragged
  sunRelief(P, 9, 18, 3, St, s + 1);
  return P.done();
}
function emptyPedestal() {   // 18 x 22: a pedestal with a moulded top, nothing on it any more; a sun in a roundel
  const P = painter(18, 22), s = 22761, St = RP.lavrada;
  P.box(0, 0, 18, 4, St, s, 3); P.box(2, 4, 14, 14, St, s + 1, 2.6); P.box(0, 18, 18, 4, St, s + 2, 2.8);
  sunRelief(P, 9, 11, 2.6, St, s + 3);
  return P.done();
}
function stoneRing() {   // 40 x 14: a ring of the Kindlers' standing stones (seen from the side: a row of them, every height, one fallen)
  const P = painter(40, 14), s = 22771, St = RP.lavrada;
  for (const [x0, w, h] of [[0, 5, 10], [7, 4, 13], [13, 6, 8], [21, 4, 12], [27, 5, 9], [34, 5, 11]]) P.box(x0, 14 - h, w, h, St, s + x0, 2.8);
  P.box(13, 10, 12, 4, St, s + 99, 2.4);   // the fallen one
  return P.done();
}
function petrifiedColossus() {   // 60 x 30: the carcass of a colossus turned to stone, lying: a great ribbed back, a skull-like head, an arm
  const P = painter(60, 30), s = 22781, B = RP.breu;
  for (let x = 4; x < 52; x++) { const t = (x - 4) / 48, h = Math.sin(t * Math.PI) * 18 + 4; for (let y = Math.floor(30 - h); y < 30; y++) P.put(x, y, B, 3.2 - (y - (30 - h)) / h * 1.6 + cn(x * 3, y * 3, 30, 30, s) * 0.9 + cg(x, y, s) * 0.4); }
  for (let k = 0; k < 9; k++) { const x = 10 + k * 4.6; for (let y = 10; y < 28; y++) if (P.has(x, y)) P.put(x, y, B, 1.2); }   // the ribs under the skin
  P.blob(53, 20, 7, 7, B, s + 1, 3);   P.put(55, 18, RP.sombra, 0); P.put(56, 18, RP.sombra, 0); P.put(55, 19, RP.sombra, 0);   // the head, a socket
  tube(P, t => [8 - t * 6, 26 - t * 2 + Math.sin(t * 3) * 2], () => 4, B, s + 2, 2.6);                 // the arm
  for (let k = 0; k < 4; k++) P.line(1 + k * 1.5, 26, k * 2, 29, B, 3);                                 // the fingers
  return P.done();
}
function stoneHand() {   // 24 x 26: a hand of pale stone coming up out of the floor, the fingers curled as if to grab
  const P = painter(24, 26), s = 22791, St = RP.primeva;
  tube(P, t => [10 + t * 1, 26 - t * 12], t => 7 - t * 1.4, St, s, 2.8);                                 // the wrist
  P.blob(12, 12, 6, 5, St, s + 1, 3);                                                                    // the palm
  for (let k = 0; k < 4; k++) tube(P, t => [7 + k * 3.2 + Math.sin(t * 2) * 1.4, 9 - t * 7 + t * t * 4 * (k % 2 ? 1 : 0.6)], () => 2.2, St, s + 2 + k, 3.2);   // the fingers, curling
  tube(P, t => [18 + t * 4, 13 - t * 3], () => 2.4, St, s + 9, 2.8);                                     // the thumb
  return P.done();
}
function rootStump() {   // 30 x 20: a night root cut through, the stump showing its rings of black fibre and violet sap
  const P = painter(30, 20), s = 22801, R = RP.raiz;
  for (let x = 2; x < 28; x++) { const flare = Math.abs(x - 15) > 9 ? (Math.abs(x - 15) - 9) * 1.4 : 0, top = 4 + flare; for (let y = Math.floor(top); y < 20; y++) P.put(x, y, R, 3 - (x - 15) / 13 * 1.2 + (x % 4 === 0 ? -0.8 : 0) + cg(x, y, s) * 0.4); }
  for (let x = 6; x < 25; x++) { const d = Math.abs(x - 15.5) / 9.5; P.put(x, 4, R, 4.6 - d); if (((x * 2) % 5) === 0) P.put(x, 4, RP.vidro, 4); }   // the cut face
  for (let x = 4; x < 26; x += 6) for (let y = 8; y < 19; y++) if (hash2(x, y, s) < 0.3) P.put(x, y, RP.raiz, 5);
  return P.done();
}
function coldAltar() {   // 40 x 24: a cold altar of the Kindlers: a slab on two blocks, a dish for the fire on it, dead, suns cut in the front
  const P = painter(40, 24), s = 22811, St = RP.lavrada;
  P.box(0, 8, 40, 5, St, s, 3.2); P.box(3, 13, 10, 11, St, s + 1, 2.6); P.box(27, 13, 10, 11, St, s + 2, 2.6);
  sunRelief(P, 8, 18, 2.6, St, s + 3); sunRelief(P, 32, 18, 2.6, St, s + 4);
  for (let x = 12; x < 28; x++) { const t = (x - 12) / 16, h = Math.sin(t * Math.PI) * 4; for (let y = Math.floor(8 - h); y < 8; y++) P.put(x, y, RP.ferro, 3 - t); }   // the fire dish
  for (let x = 14; x < 26; x++) P.put(x, 4 + Math.round(Math.abs(x - 20) / 3), RP.cinza, 2 + hash2(x, 0, s) * 2);
  return P.done();
}
function seal() {   // 72 x 16: a Seal of the Bottom: a great disc of carved stone set in the floor (seen from the side, its rim and sun face), cold, shut
  const P = painter(72, 16), s = 22821, St = RP.lavrada;
  for (let x = 0; x < 72; x++) { const t = (x - 36) / 36, h = Math.sqrt(Math.max(0, 1 - t * t)) * 10 + 4; for (let y = Math.floor(16 - h); y < 16; y++) P.put(x, y, St, 3 - t * 1.3 + (y === Math.floor(16 - h) ? 1.4 : 0) + cn(x * 3, y * 3, 30, 30, s) * 0.6 + cg(x, y, s) * 0.3); }
  sunRelief(P, 36, 10, 4.4, St, s + 1);
  for (let k = 0; k < 12; k++) { const x = 6 + k * 5.4; if (Math.abs(x - 36) > 9) for (let y = 12; y < 16; y++) if (P.has(x, y)) P.put(x, y, St, 1.6); }   // the segments of its rim
  return P.done();
}

/* =============================== ceiling =============================== */
function deadLantern(k) {   // 12 x 34 or 12 x 26: a lantern of the Kindlers hanging dead on its chain, its glass black
  const H = k ? 26 : 34, P = painter(12, H), s = 22831 + k, F = RP.ferro, top = H - 14;
  chainV(P, 6, 0, top);
  for (let x = 2; x <= 9; x++) { P.put(x, top + 1, F, 4.4 - (x - 2) * 0.3); P.put(x, top + 13, F, 3); }
  for (let y = top + 2; y < top + 13; y++) { P.put(2, y, F, 4); P.put(9, y, F, 2); for (let x = 3; x < 9; x++) P.put(x, y, RP.sombra, 2 + (x < 5 && y < top + 5 ? 1.6 : 0)); }
  P.put(5, top + 6, RP.cinza, 2.4); P.put(6, top + 7, RP.cinza, 1.6);   // a dead wick
  return P.done();
}
function wispCage() {   // 14 x 26: an empty cage the Kindlers kept wisps in, the door open
  const P = painter(14, 26), s = 22841, F = RP.ferro;
  chainV(P, 7, 0, 7);
  for (let y = 9; y < 25; y++) for (const x of [2, 5, 8, 11]) if (!(x === 11 && y > 13 && y < 21)) P.put(x, y, F, x < 7 ? 3.8 : 2.4);
  for (let x = 1; x <= 12; x++) { P.put(x, 8 + Math.abs(x - 6.5) * 0.25, F, 4.2); P.put(x, 25, F, 3); }
  P.line(12, 14, 13.5, 20, F, 3);   // the door hanging out
  return P.done();
}
function mothCocoon() {   // 14 x 22: a cocoon of the black moths, grey silk wound round, hanging by threads
  const P = painter(14, 22), s = 22851, C = RP.cinza;
  for (let y = 0; y < 5; y++) { P.put(6, y, C, 3); if (y > 1) P.put(8, y, C, 2.4); }
  for (let y = 5; y < 21; y++) { const t = (y - 5) / 16, hw = Math.sin(t * Math.PI) * 5 + 1; for (let x = Math.floor(7 - hw); x <= 7 + hw; x++) P.put(x, y, C, 3 - (x - 7) / hw * 1.2 + (((y + x * 2) % 4) === 0 ? -1 : 0)); }
  for (let y = 8; y < 18; y += 3) P.line(2, y, 12, y + 2, RP.palido, 2.2);
  return P.done();
}
function rootCluster() {   // 30 x 36: a cluster of night roots hanging from the roof, thick ones and fine ones, the tips fraying
  const P = painter(30, 36), s = 22861, R = RP.raiz;
  for (let k = 0; k < 9; k++) {
    const x0 = 2 + k * 3.2 + hash2(k, 0, s) * 2, len = 14 + hash2(k, 1, s) * 20, w = 1.4 + hash2(k, 2, s) * 2.4;
    tube(P, t => [x0 + Math.sin(t * 3 + k) * 2, t * len], t => w * (1 - t * 0.6), R, s + k, 2.8);
  }
  return P.done();
}
function fadedBanner() {   // 20 x 40: a banner of the Kindlers on a bar, faded to brown, a sun on it, the bottom in rags
  const P = painter(20, 40), s = 22871, C = RP.pano;
  for (let x = 0; x < 20; x++) P.put(x, 0, RP.ferro, 3.6 - x * 0.1);
  for (let y = 1; y < 40; y++) for (let x = 2; x < 18; x++) { if (y > 30 && hash2(x, y, s) < (y - 30) * 0.12) continue; P.put(x, y, C, 3 - (x - 2) * 0.08 + Math.sin(x * 0.7 + y * 0.1) * 0.5 + cg(x, y, s) * 0.3); }
  for (let y = 11; y < 22; y++) for (let x = 5; x < 15; x++) { const d = Math.hypot(x + 0.5 - 10, y + 0.5 - 16); if (d < 2.4) P.put(x, y, RP.ouro, 3.2); else if (d < 4.6 && Math.abs(Math.sin(Math.atan2(y - 16, x - 10) * 4)) > 0.8) P.put(x, y, RP.ouro, 2.4); }
  return P.done();
}

/* =============================== back wall =============================== */
function sealedDoor() {   // 36 x 48: a door of the Kindlers set in a frame of carved stone, the leaves of black iron shut with a bar, a sun over it
  const P = painter(36, 48), s = 22881, St = RP.lavrada, F = RP.ferro;
  for (let y = 0; y < 48; y++) for (let x = 0; x < 36; x++) { const inArch = x >= 6 && x < 30 && (y > 14 || Math.hypot(x + 0.5 - 18, y + 0.5 - 14) < 12); if (inArch) continue; if (y < 4 && (x < 3 || x > 32)) continue; P.put(x, y, St, 2.8 + (x < 2 ? 0.8 : 0) - (x > 33 ? 0.8 : 0) + ((y % 8) === 7 ? -1 : 0) + cg(x, y, s) * 0.4); }
  for (let y = 4; y < 48; y++) for (let x = 6; x < 30; x++) { const inArch = y > 14 || Math.hypot(x + 0.5 - 18, y + 0.5 - 14) < 12; if (!inArch) continue; P.put(x, y, F, 2.6 + (x === 17 || x === 18 ? -1.4 : 0) + ((y % 10) === 0 ? 1 : 0) + cg(x, y, s + 1) * 0.3); }
  for (let x = 4; x < 32; x++) { P.put(x, 30, F, 4.2); P.put(x, 31, F, 2.2); }   // the bar
  sunRelief(P, 18, 6, 3.2, St, s + 2, 0.4);
  return P.done();
}
function risingSun() {   // 50 x 30: the relief of the rising sun: half a sun over a line of hills, long rays fanning up
  const P = painter(50, 30), s = 22891, St = RP.lavrada;
  P.box(0, 0, 50, 30, St, s, 2.4);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 50; x++) {
    const dx = x + 0.5 - 25, dy = y + 0.5 - 24, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (y < 24 && d < 8) P.put(x, y, St, 4.2 - (dx + dy) / 8 * 0.6);
    else if (y < 24 && d < 9.4) P.put(x, y, St, 1.2);
    else if (y < 24 && d > 11 && d < 22 && Math.abs(Math.sin(a * 6)) > 0.93) P.put(x, y, St, 1.4);
    if (y === 24 + Math.round(Math.sin(x * 0.2) * 1.5)) P.put(x, y, St, 1.2);
  }
  return P.done();
}
function rootVein() {   // 18 x 48: a night root climbing the wall like a vein, branching, pulsing violet in the cracks
  const P = painter(18, 48), s = 22901, R = RP.raiz;
  tube(P, t => [9 + Math.sin(t * 6) * 3, 48 - t * 48], t => 4.4 - t * 2.4, R, s, 2.8);
  for (let k = 0; k < 4; k++) { const t0 = 0.2 + k * 0.18, y0 = 48 - t0 * 48, x0 = 9 + Math.sin(t0 * 6) * 3, side = k % 2 ? 1 : -1; tube(P, t => [x0 + side * t * 7, y0 - t * 8], t => 2 - t * 1.2, R, s + k + 1, 2.6); }
  for (let y = 0; y < 48; y += 5) P.put(9 + Math.sin((48 - y) / 48 * 6) * 3, y, RP.raiz, 5.4);
  return P.done();
}
function mural() {   // 40 x 64: the Mural of the Kindlers: a frame of carved stone, inside a column of 16 bands painted one over the other,
  // a small sun at the top (the village), each band its layer's colour, and a black stain rising from the bottom through the lower bands
  const P = painter(40, 64), s = 22911, St = RP.lavrada, top = 10, band = 3;
  P.box(0, 0, 40, 64, St, s, 2.6);
  for (let y = 4; y < 60; y++) for (let x = 4; x < 36; x++) P.put(x, y, St, 1.8 + cg(x, y, s) * 0.3);   // the plaster, dark
  // the sun: the village up top, in faded gold
  for (let y = 3; y < 10; y++) for (let x = 15; x < 25; x++) { const d = Math.hypot(x + 0.5 - 20, y + 0.5 - 7); if (d < 2.6) P.put(x, y, RP.ouro, 4); else if (d < 4.4 && Math.abs(Math.sin(Math.atan2(y - 7, x - 20) * 4)) > 0.8) P.put(x, y, RP.ouro, 3); }
  for (let b = 0; b < 16; b++) {
    const R = b < 7 ? RP.tinta[b] : b === 15 ? RP.sombra : b > 10 ? RP.breu : RP.primeva, y0 = top + b * band;
    for (let y = y0; y < y0 + band; y++) for (let x = 7; x < 33; x++) {
      if (hash2(x, y, s + b) < 0.12) continue;   // the paint flaked off
      P.put(x, y, R, (y === y0 ? 3.6 : 2.6) + cg(x, y, s + b) * 0.6 - (x > 30 ? 0.6 : 0));
    }
    P.line(5, y0 + 1, 6, y0 + 1, St, 1.2);   // a tally on the frame for each
  }
  // the stain: black rising from the bottom in tongues, reaching up into the middle bands
  for (let x = 7; x < 33; x++) { const reach = 22 + Math.sin(x * 0.7) * 6 + hash2(x, 0, s + 77) * 10; for (let y = top + 16 * band - 1; y > top + 16 * band - reach; y--) P.put(x, y, RP.sombra, 0.6 + hash2(x, y, s + 78) * 1.2); }
  return P.done();
}
function fadedWriting() {   // 30 x 14: writing of the Kindlers cut in the stone, mostly worn away
  const P = painter(30, 14), s = 22921, St = RP.lavrada;
  P.box(0, 0, 30, 14, St, s, 2.4);
  for (let row = 0; row < 3; row++) for (let x = 3; x < 27; x++) { if (hash2(x, row, s) < 0.45) continue; const y = 3 + row * 3.5; P.put(x, y, St, 1); if (hash2(x, row + 9, s) < 0.4) P.put(x, y + 1, St, 1.2); }
  return P.done();
}
function nobodysShadow() {   // 16 x 40: a shadow on the wall shaped like someone standing, arms a little out; nobody casts it
  const P = painter(16, 40), s = 22931, S = RP.sombra;
  P.blob(8, 5, 3.4, 4, S, s, 1.6);
  for (let y = 9; y < 40; y++) { const hw = y < 24 ? 3.2 + (y - 9) * 0.05 : 2.8 - (y - 24) * 0.04; for (let x = Math.floor(8 - hw); x <= 8 + hw; x++) if (!(y > 26 && Math.abs(x - 8) < 1)) P.put(x, y, S, 1.4 + hash2(x, y, s) * 0.6); }
  tube(P, t => [5 - t * 4, 11 + t * 14], () => 1.8, S, s + 1, 1.2); tube(P, t => [11 + t * 4, 11 + t * 14], () => 1.8, S, s + 2, 1.2);
  return P.done(false);
}
function voidWindow() {   // 24 x 30: a hole in the wall where there is nothing behind: a ragged rim of darkstone round pure black
  const P = painter(24, 30), s = 22941, B = RP.breu;
  for (let y = 0; y < 30; y++) for (let x = 0; x < 24; x++) {
    const dx = (x + 0.5 - 12) / 11, dy = (y + 0.5 - 15) / 14, d = dx * dx + dy * dy + (hash2(x >> 1, y >> 1, s) - 0.5) * 0.25;
    if (d > 1) continue;
    if (d > 0.62) P.put(x, y, B, 2.6 - (dx + dy) * 1.2 + cg(x, y, s) * 0.5); else P.put(x, y, RP.sombra, 0);
  }
  return P.done();
}
function bigEyes() {   // 30 x 14: the place a pair of big eyes opens in the dark (the eyes are drawn live): only two faint creases in the rock
  const P = painter(30, 14), s = 22951, B = RP.breu;
  for (const cx of [8, 22]) for (let x = cx - 5; x <= cx + 5; x++) { const y = 7 - Math.round(Math.sqrt(Math.max(0, 25 - (x - cx) * (x - cx))) * 0.4); P.put(x, y, B, 1.4); P.put(x, 14 - y, B, 2.6); }
  return P.done(false);
}
function handPrints() {   // 26 x 22: pale hand prints on the root wall, some smeared, one dragged down
  const P = painter(26, 22), s = 22961, Pl = RP.palido;
  const hand = (cx, cy, a, k) => { P.blob(cx, cy, 2.4, 2.8, Pl, s + k, 1.6); for (let f = 0; f < 4; f++) { const fa = a - 0.9 + f * 0.45; P.line(cx + Math.cos(fa - Math.PI / 2) * 2, cy + Math.sin(fa - Math.PI / 2) * 2, cx + Math.cos(fa - Math.PI / 2) * 5.4, cy + Math.sin(fa - Math.PI / 2) * 5.4, Pl, 1.8); } };
  hand(6, 9, 0, 1); hand(16, 7, 0.3, 2); hand(21, 15, -0.2, 3);
  for (let y = 12; y < 22; y++) P.put(16 + Math.sin(y) * 0.4, y, Pl, 1.2);   // dragged down
  return P.done(false);
}

/* =============================== register =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes, escuro: true }, extra || {}));
// floor
def('es_estatua', 'Estátua de Acendedor', F, 'frente', ['borda', 'fundo'], [kindlerStatue()]);
def('es_ossada_lanterna', 'Ossada abraçada a uma lanterna', F, 'frente', ['borda', 'breu'], [bonesLantern()]);
def('es_pira_caida', 'Pira caída', F, 'frente', ['fundo'], [fallenPyre()]);
def('es_tochas', 'Pilha de tochas apagadas', F, 'frente', ['borda'], [deadTorches()]);
def('es_vaso', 'Vaso de óleo seco', F, 'frente', ['borda'], [oilJar()]);
def('es_obelisco', 'Obelisco quebrado', F, 'frente', ['borda', 'fundo'], [brokenObelisk()]);
def('es_pedestal', 'Pedestal vazio', F, 'frente', ['fundo'], [emptyPedestal()]);
def('es_aneis', 'Anel de pedras dos Acendedores', F, 'frente', ['borda'], [stoneRing()]);
def('es_colosso', 'Carcaça de colosso petrificada', F, 'frente', ['breu', 'fundo'], [petrifiedColossus()]);
def('es_mao', 'Mão de pedra', F, 'frente', ['breu'], [stoneHand()]);
def('es_toco', 'Toco de raiz cortado', F, 'frente', ['raizes'], [rootStump()]);
def('es_altar', 'Altar frio', F, 'frente', ['fundo'], [coldAltar()]);
def('es_selo', 'Selo do Fundo', F, 'frente', ['fundo'], [seal()], { unico: true, protegido: true });
// ceiling
def('es_lanterna', 'Lanterna apagada', C, 'frente', ['borda', 'fundo'], [deadLantern(0), deadLantern(1)]);
def('es_gaiola', 'Gaiola de lume vazia', C, 'frente', ['borda'], [wispCage()]);
def('es_casulo', 'Casulo de mariposas', C, 'frente', ['breu', 'raizes'], [mothCocoon()]);
def('es_cacho', 'Cacho de raízes pendentes', C, 'frente', ['raizes'], [rootCluster()]);
def('es_estandarte', 'Estandarte desbotado', C, 'frente', ['borda'], [fadedBanner()]);
// back wall, standing on the floor
def('es_porta', 'Porta selada dos Acendedores', W, 'fundo', ['borda', 'fundo'], [sealedDoor()]);
def('es_relevo', 'Relevo do sol nascente', W, 'fundo', ['fundo'], [risingSun()]);
def('es_veia', 'Raiz-veia', W, 'fundo', ['raizes'], [rootVein()]);
def('es_mural', 'Mural dos Acendedores', W, 'fundo', ['borda', 'fundo'], [mural()], { unico: true });
// back wall, eye height
def('es_escrita', 'Escrita apagada', W, 'fundo', ['borda'], [fadedWriting()]);
def('es_sombra', 'Sombra de ninguém', W, 'fundo', ['breu', 'raizes'], [nobodysShadow()]);
def('es_janela', 'Janela para o Nada', W, 'fundo', ['breu'], [voidWindow()]);
def('es_olhos', 'Par de olhos', W, 'fundo', ['breu'], [bigEyes()], { olhos: true });
def('es_maos', 'Marcas de mão', W, 'fundo', ['raizes'], [handPrints()]);

// what each band gets, per open stretch of floor or ceiling: [id, chance per 10 blocks, max per stretch]
Object.assign(ES_PROP_PLAN, {
  borda: { chao: [['es_estatua', 0.06, 1], ['es_ossada_lanterna', 0.08, 1], ['es_tochas', 0.08, 1], ['es_vaso', 0.08, 1], ['es_obelisco', 0.05, 1], ['es_aneis', 0.04, 1]], teto: [['es_lanterna', 0.12, 2], ['es_gaiola', 0.06, 1], ['es_estandarte', 0.06, 1]], fundo: [['es_porta', 0.04, 1], ['es_escrita', 0.08, 1]] },
  breu: { chao: [['es_ossada_lanterna', 0.04, 1], ['es_colosso', 0.03, 1], ['es_mao', 0.05, 1]], teto: [['es_casulo', 0.08, 2]], fundo: [['es_sombra', 0.05, 1], ['es_janela', 0.04, 1], ['es_olhos', 0.05, 1]] },
  raizes: { chao: [['es_toco', 0.08, 1]], teto: [['es_cacho', 0.14, 2], ['es_casulo', 0.06, 1]], fundo: [['es_veia', 0.1, 2], ['es_sombra', 0.04, 1], ['es_maos', 0.06, 1]] },
  fundo: { chao: [['es_estatua', 0.06, 1], ['es_pira_caida', 0.05, 1], ['es_obelisco', 0.05, 1], ['es_pedestal', 0.06, 1], ['es_colosso', 0.03, 1], ['es_altar', 0.04, 1]], teto: [['es_lanterna', 0.08, 1]], fundo: [['es_porta', 0.04, 1], ['es_relevo', 0.05, 1]] }
});
}

// the Seals never break: a blow or a pick on the stone under them does nothing to them
{ const _pls = propsLoseSupport; propsLoseSupport = function (x, y) {
  if (typeof esSeals !== 'undefined' && esSeals.some(S => Math.abs(wdx(x - S.cx)) <= 4 && Math.abs(y - S.fy) <= 1)) return;
  return _pls(x, y);
}; }
// the big eyes: two pale points open in the dark, blink, and close when light reaches them (visProps only has the lit
// props, so the eyes keep their own list, refreshed when the props change)
let esEyeProps = [], esEyeN = -1;
HOOK.drawTop.push((cx, cy) => {
  if (!ESCURO || cy + VH < (ES_S0 - 6) * T) return;
  if (esEyeN !== PROPS.length) { esEyeN = PROPS.length; esEyeProps = PROPS.filter(p => p.def.olhos); }
  const WP = WW * T;
  for (let i = 0; i < esEyeProps.length; i++) {
    const p = esEyeProps[i]; if (p.gone) continue;
    const sh = Math.round((cx + VW / 2 - p.X - p.w / 2) / WP) * WP, px = p.X + sh - cx, py = p.Y - cy;
    if (px + p.w < 0 || px > VW || py + p.h < 0 || py > VH) continue;
    const L = ESART.esLB(Math.floor((p.X + p.w / 2) / T), Math.floor((p.Y + 7) / T)); if (L > 0.12) continue;
    const ph0 = (gameTime * 0.17 + (p.X % 97) * 0.13) % 1; if (ph0 > 0.6 || (ph0 > 0.33 && ph0 < 0.36)) continue;
    const a = (1 - L / 0.12) * (ph0 < 0.06 ? ph0 / 0.06 : ph0 > 0.54 ? (0.6 - ph0) / 0.06 : 1);
    for (const ox of [8, 22]) {
      const X = Math.round(px + ox), Y = Math.round(py + 7);
      lc.globalAlpha = 0.8 * a; lc.fillStyle = '#e6ecf4'; lc.fillRect(X - 2, Y, 5, 1); lc.fillRect(X - 1, Y - 1, 3, 1); lc.fillRect(X - 1, Y + 1, 3, 1);
      lc.globalAlpha = a; lc.fillStyle = '#05060a'; lc.fillRect(X, Y, 1, 1);
    }
  }
  lc.globalAlpha = 1;
});
