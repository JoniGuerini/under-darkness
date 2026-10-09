'use strict';

/* ================= the abandoned cathedral: props =================
   Everything bigger than a block that furnishes the cathedral: pews, candelabra, statues of saints and
   angels, the altar, pulpit, sarcophagi and coffins, a font, a fallen bell, broken arches and columns,
   heaps of bones, the bishop's chair; hanging from the vaults a wheel chandelier, censers, torn banners,
   big webs, chains and a gibbet cage; and on the back walls stained glass lancets and a rose window,
   relief arches, niches, faded frescoes, coats of arms, burial niches, wall sconces, a torn painting and
   the organ. Each one is painted once here on 7-tone ramps lit from the top left, with a dark rim where
   it meets the air, and handed to defProp (41-catedral-api), which bakes it into the chunk images.
   Flames are never painted: `chamas` lists the pixel above each wick for the animated flame. */
{
const { cg, cn } = CATART;
const R7 = hexes => hexes.map(h => ph(h));
const RP = {
  pedra: R7(['#24221f', '#3b3936', '#5a5751', '#7a766e', '#9a958b', '#b9b3a7', '#d6d0c3']),
  marmore: R7(['#2e2c2a', '#45423f', '#66625d', '#8a857e', '#aca69c', '#cac4b8', '#e3ddd1']),
  negro: R7(['#08080a', '#0e0d10', '#18161b', '#232027', '#2f2b34', '#3d3843', '#4d4754']),
  madeira: R7(['#100a06', '#1a110b', '#2c1d13', '#40291a', '#563823', '#6e4a2f', '#88603d']),
  bronze: R7(['#1e150a', '#2e200e', '#4e3818', '#745626', '#9c7a38', '#c4a252', '#e6ca7a']),
  verdete: R7(['#0e1a16', '#16281f', '#20392c', '#2c4c3a', '#3c6450', '#568068', '#78a088']),
  ferro: R7(['#0c0c0f', '#141418', '#24252b', '#383a42', '#50535d', '#6e727e', '#9298a4']),
  ferrugem: R7(['#1a0c06', '#2a140a', '#4a2412', '#6e3a1c', '#8e5228', '#a86a36', '#c08850']),
  estanho: R7(['#1c1e24', '#2e3139', '#454a54', '#626874', '#848b97', '#a8afba', '#ccd2db']),
  tecido: R7(['#1a060a', '#2a0a10', '#43121a', '#5e1a22', '#7a262c', '#94383a', '#b04e4a']),
  azul: R7(['#080a16', '#10142a', '#18203e', '#222c52', '#2e3a66', '#3e4c7c', '#526294']),
  ouro: R7(['#3a2a10', '#5a4418', '#8a6a2a', '#a8843a', '#c49a42', '#dcb860', '#f0d890']),
  osso: R7(['#241e16', '#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6']),
  cera: R7(['#2a241a', '#3a3226', '#6a5e48', '#a09276', '#cfc2a2', '#ece2c8', '#fff6e2']),
  pano: R7(['#2a261e', '#3e382c', '#5a5240', '#7a7058', '#9a8e72', '#b8ac8c', '#d2c6a6']),
  sombra: R7(['#050406', '#08070a', '#0c0a0e', '#100e13', '#151218', '#1a171e', '#201c24']),
  reboco: R7(['#2a241c', '#3e3628', '#584e3c', '#746850', '#8e8266', '#a89c7e', '#c2b696']),
  ocre: R7(['#2a1c0c', '#463016', '#6a4a22', '#8a6430', '#a88042', '#c09a58', '#d4b474']),
  vermelho: R7(['#200a08', '#3a1410', '#561e18', '#702a22', '#8a3a2e', '#a04e3e', '#b46652']),
  ceu: R7(['#0e1420', '#182234', '#24324a', '#32445e', '#445874', '#5a6e88', '#7488a0'])
};
// stained glass: lead and five dim colours (the panes glow a little on their own, they never light the room)
const VID = { chumbo: ph('#141214') };
const VIDR = { r: R7(['#2a0a0c', '#3e1014', '#5a1418', '#8a2228', '#b8403a', '#d46a58', '#e8988a']), b: R7(['#0a1228', '#101e40', '#162a5a', '#23428a', '#3e66b8', '#6488d0', '#94b0e4']), a: R7(['#2e1c06', '#4a2e0a', '#6a4410', '#a06c1a', '#d8a03a', '#ecc068', '#f8dc9a']), g: R7(['#0a1c10', '#102a18', '#163a22', '#23603a', '#3e8a56', '#68aa78', '#98c8a0']), v: R7(['#140a22', '#1e1030', '#2a1840', '#46286a', '#6a46a0', '#8e6cc0', '#b49ade']) };
const OUTLINE = ph('#120c10');

/* ---- the painter: a w x h buffer of packed colours, each pixel remembers its ramp for the rim ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[y * w + x] = idOf(R); },
    col(x, y, col) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = col; rid[y * w + x] = -2; },
    clear(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    // fill a rectangle; fn(i, j, x, y) returns a tone (or null to skip)
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    // a block with a bevel: lit top and left, dark bottom and right
    box(x0, y0, rw, rh, R, s, base = 3.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.6 : j === 1 ? 0.6 : 0) + (i === 0 ? 0.7 : 0) - (j === rh - 1 ? 1.6 : 0) - (i === rw - 1 ? 1.1 : 0) + cg(x, y, s) * 0.55 + cn(x, y, 60, 60, s + 1) * 0.5); },
    // a vertical cylinder: round shading across its width
    cyl(x0, y0, rw, rh, R, s, base = 3.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => { const u = (i + 0.5) / rw; return base + 1.9 - u * 3.4 - Math.pow(Math.abs(u - 0.3) * 2, 3) * 0.6 + cg(x, y, s) * 0.45; }); },
    // an ellipse filled with dome shading
    blob(cx, cy, rx, ry, R, s, base = 3.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1.2 - (dx + dy) * 1.3 - d * 0.6 + cg(x, y, s) * 0.45); } },
    line(x0, y0, x1, y1, R, v, wd = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < wd; k++) P.put(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), R, typeof v === 'function' ? v(i / n, k) : v); } },
    // finish: dark rim (the ramp's own darkest tone) where the shape meets the air, then a canvas
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
const mirror = (P, x0, x1) => { for (let y = 0; y < P.h; y++) for (let x = x0; x <= x1; x++) { const m = P.w - 1 - x; P.c[y * P.w + m] = P.c[y * P.w + x]; } };
const candle = (P, x, top, bot, s) => { P.cyl(x - 1, top, 3, bot - top, RP.cera, s, 3.6); P.put(x, top - 1, RP.sombra, 2); P.put(x + 1, top + 2, RP.cera, 5.5); };   // a 3-wide candle, wick at (x, top-1)

/* =============================== FLOOR =============================== */
function pew(kind) {   // 36 x 14: backrest, seat, the two carved ends
  const P = painter(36, 14), s = 2001 + kind * 7;
  const plank = (x0, y0, w, h, base) => P.rect(x0, y0, w, h, RP.madeira, (i, j, x, y) => base + (j === 0 ? 1.4 : 0) - (j === h - 1 ? 1.4 : 0) + cn(x, y, 200, 10, s) * 1.6 + cg(x, y, s + 1) * 0.35);
  if (kind === 2) {   // toppled onto its back: the seat stands up, the legs point at you
    plank(2, 9, 32, 5, 3.4); for (let x = 6; x < 32; x += 8) P.put(x, 11, RP.madeira, 1);
    P.rect(0, 3, 3, 11, RP.madeira, (i, j, x, y) => 3.8 + (i === 0 ? 1 : 0) - (i === 2 ? 1 : 0) + cg(x, y, s) * 0.4);
    P.rect(33, 5, 3, 9, RP.madeira, (i, j, x, y) => 3 + (i === 0 ? 1 : 0) - (i === 2 ? 1 : 0) + cg(x, y, s) * 0.4);
    plank(4, 6, 27, 3, 3.0);
    return P.done();
  }
  plank(2, 0, 32, 2, 4.0);                                                      // top rail
  P.rect(3, 2, 30, 5, RP.madeira, (i, j, x, y) => 2.6 + cn(x, y, 160, 14, s + 2) * 1.4 + cg(x, y, s + 3) * 0.3 + (i % 10 === 0 ? -1.4 : i % 10 === 1 ? 0.6 : 0));   // backrest boards
  plank(1, 7, 34, 2, 4.4);                                                      // seat
  P.rect(3, 9, 30, 1, RP.madeira, () => 1.4);                                   // shadow under the seat
  P.rect(4, 12, 28, 1, RP.madeira, (i, j, x, y) => 2.6 + cg(x, y, s) * 0.5);   // kneeler rail
  for (const ex of [0, 33]) P.rect(ex, 0, 3, 14, RP.madeira, (i, j, x, y) => { if (j === 0 && i !== 1) return null; return 3.8 + (i === 0 ? 1.1 : 0) - (i === 2 ? 1.2 : 0) + (j === 1 ? 1 : 0) + (j > 3 && j < 6 && i === 1 ? -1.4 : 0) + cg(x, y, s + 5) * 0.4; });   // ends with a carved slot
  if (kind === 1) {   // broken: a bite out of the backrest, the seat split and sagging at the right end
    for (let y = 0; y < 7; y++) for (let x = 14; x < 24; x++) if (y < 7 - Math.abs(x - 19) * 0.8 + hash2(x, y, s) * 2) P.clear(x, y);
    for (let x = 27; x < 36; x++) for (let y = 0; y < 14; y++) { const k = y * 36 + x; if (y >= 7 && y <= 8) continue; if (x >= 33 || y < 7) P.clear(x, y); }
    for (let x = 27; x < 36; x++) { const sag = Math.round((x - 27) * 0.45); P.clear(x, 7); P.clear(x, 8); P.put(x, 7 + sag, RP.madeira, 4); P.put(x, 8 + sag, RP.madeira, 2.4); }
    P.put(35, 13, RP.madeira, 2); P.put(34, 13, RP.madeira, 3);
  }
  return P.done();
}
function standingCandelabrum() {   // 12 x 34: tripod foot, knopped stem, three arms with candles
  const P = painter(12, 34), s = 2011, R = RP.bronze;
  for (let x = 1; x < 11; x++) { const h = 3 - Math.abs(x - 5.5) * 0.45; for (let y = 33 - Math.round(h); y < 34; y++) P.put(x, y, R, 4.2 - x * 0.25 + (y === 33 - Math.round(h) ? 1.2 : 0)); }
  P.put(0, 33, R, 3); P.put(11, 33, R, 1.5);
  P.cyl(5, 9, 2, 22, R, s, 3.2);
  for (const ky of [14, 21, 27]) P.blob(6, ky, 2.2, 1.3, R, s + ky, 3.6);           // knops
  P.rect(1, 8, 10, 2, R, (i, j) => (j === 0 ? 5 : 2.4) - i * 0.12);                 // drip pan / arms
  P.put(1, 7, R, 4); P.put(10, 7, R, 3); P.put(5, 7, R, 4.4); P.put(6, 7, R, 3.6);
  candle(P, 1, 3, 7, s + 1); candle(P, 6, 1, 7, s + 2); candle(P, 10, 4, 7, s + 3);
  for (let y = 22; y < 33; y++) if (hash2(y, 0, s + 9) < 0.3) P.put(5, y, RP.verdete, 3);
  return P.done();
}
function robe(P, x0, y0, w, h, R, s) {   // a hanging robe with long vertical folds
  for (let j = 0; j < h; j++) { const t = j / h, ww = w * (0.72 + t * 0.28); const L = x0 + (w - ww) / 2; for (let i = 0; i < ww; i++) { const u = i / ww; P.put(L + i, y0 + j, R, 4.6 - u * 3 + Math.sin(u * 13 + s) * 0.7 + cg(L + i, y0 + j, s) * 0.4 - (j > h - 2 ? 1 : 0)); } }
}
function plinth(P, x0, y0, w, h, R, s) { P.box(x0, y0, w, h, R, s, 3.4); P.rect(x0 + 1, y0 + 2, w - 2, 1, R, () => 2); }
function saint(broken) {   // 18 x 40: a hooded saint with folded hands on a plinth
  const P = painter(18, 40), s = 2021 + broken, R = RP.pedra;
  plinth(P, 1, 34, 16, 6, R, s);
  robe(P, 3, 13, 12, 21, R, s);
  P.blob(9, 18, 3.5, 3, R, s + 1, 3.4);                         // the folded sleeves
  P.blob(9, 17, 1.6, 1.6, R, s + 2, 4.4);                       // praying hands
  if (!broken) {
    P.blob(9, 8, 4.8, 6, R, s + 3, 3.3);                        // hood
    P.blob(9.6, 9.2, 2.4, 3.6, RP.sombra, s + 4, 3);            // the empty face inside
    P.rect(5, 12, 9, 2, R, (i, j, x, y) => 3.2 - i * 0.2 + cg(x, y, s) * 0.4);   // the hood's hem on the shoulders
  } else {
    P.rect(5, 11, 9, 3, R, (i, j, x, y) => j === 0 ? 5 - i * 0.2 + (hash2(i, 0, s) < 0.5 ? -0.8 : 0) : 3.2 - i * 0.2);   // the snapped neck
    P.blob(9, 11, 2, 1, R, s + 5, 2);
  }
  for (let y = 14; y < 34; y++) if (hash2(y, 3, s) < 0.12) P.put(11 + (hash2(y, 4, s) * 3 | 0), y, R, 1.6);   // weathering
  return P.done();
}
function angel(broken) {   // 24 x 44: a grieving angel, wings folded high, face in its hands
  const P = painter(24, 44), s = 2031 + broken, R = RP.marmore;
  plinth(P, 2, 38, 20, 6, RP.pedra, s);
  const wing = (side, cut) => {   // feathers in rows, tip up past the head
    for (let y = 4; y < 34; y++) {
      const t = (y - 4) / 30, w = (1 - Math.pow(Math.abs(t - 0.35) * 1.5, 2)) * 6.5 + 1; if (cut && y < 18) continue;
      for (let i = 0; i < w; i++) { const x = side < 0 ? 6 - i + t * 2 : 17 + i - t * 2; P.put(x, y, R, (side < 0 ? 4.6 - i * 0.35 : 3.2 - i * 0.3) - ((y + i * 2) % 5 === 0 ? 1.2 : 0) + cg(x, y, s + side) * 0.4); }
    }
  };
  wing(-1, 0); wing(1, broken);
  if (broken) for (let y = 16; y < 19; y++) for (let x = 17; x < 22; x++) if (hash2(x, y, s) < 0.6) P.put(x, y, R, 5.5);   // the broken stump of the wing
  robe(P, 7, 15, 10, 23, R, s + 2);
  P.blob(12, 10, 3.2, 3.6, R, s + 3, 3.6);                       // bowed head
  P.rect(9, 6, 7, 2, R, (i) => 4.6 - i * 0.3);                   // hair
  P.blob(12.2, 12.4, 2.6, 1.6, R, s + 4, 4.2);                   // hands over the face
  P.blob(10, 17, 2.4, 1.6, R, s + 5, 3);                         // elbows
  P.blob(14.5, 17, 2.4, 1.6, R, s + 6, 2.6);
  for (let y = 13; y < 26; y += 3) P.put(12 + (y % 2), y, RP.negro, 4);   // a stain like a tear track
  return P.done();
}
function altar() {   // 48 x 24: a marble altar on a black step, a torn cloth, candles and a cross
  const P = painter(48, 24), s = 2041;
  P.box(0, 21, 48, 3, RP.negro, s, 3.8);                                        // the black marble step
  P.box(4, 8, 40, 13, RP.marmore, s + 1, 3.4);                                  // the block
  for (let k = 0; k < 3; k++) { const ax = 8 + k * 12; P.rect(ax, 11, 8, 9, RP.marmore, (i, j) => { const top = 3 - Math.sqrt(Math.max(0, 16 - (i - 3.5) ** 2)) * 0.8; if (j < top) return null; return i === 0 || j <= top + 1 ? 2 : i === 7 ? 4.6 : 2.8; }); }   // three carved arches
  P.box(2, 6, 44, 3, RP.marmore, s + 2, 4.2);                                   // the mensa slab
  // the cloth: draped over the top, hanging in front, torn at the bottom, gold border
  for (let x = 10; x < 38; x++) { const torn = 13 + Math.round(hash2(x, 0, s + 3) * 4 + Math.sin(x * 0.7) * 1.5); for (let y = 6; y < torn; y++) { const fold = Math.sin(x * 0.9) * 0.8; P.put(x, y, RP.tecido, (y === 6 ? 5 : 3.6) + fold - (x > 33 ? 1 : 0) + cg(x, y, s + 4) * 0.5); } if (hash2(x, 1, s) < 0.85) P.put(x, 8, RP.ouro, 3.5 + hash2(x, 2, s)); P.put(x, torn, RP.tecido, 1.5); }
  candle(P, 6, 1, 6, s + 5); candle(P, 41, 2, 6, s + 6);
  P.rect(5, 5, 3, 1, RP.bronze, (i) => 4 - i); P.rect(40, 5, 3, 1, RP.bronze, (i) => 4 - i);
  P.rect(23, 0, 2, 6, RP.ouro, (i) => i ? 3 : 5); P.rect(21, 1, 6, 1, RP.ouro, (i) => 5 - i * 0.4);    // the cross
  return P.done();
}
function pulpit() {   // 20 x 30: a carved wooden pulpit on a stem, a book on the desk
  const P = painter(20, 30), s = 2051, R = RP.madeira;
  P.box(4, 26, 12, 4, R, s, 3.2);
  P.cyl(8, 16, 4, 10, R, s, 3.4);
  for (let y = 13; y < 17; y++) { const w = 18 - (y - 13) * 2.5; P.rect(Math.round(10 - w / 2), y, Math.round(w), 1, R, (i) => 3.4 - i * 0.12); }   // corbel
  P.box(1, 4, 18, 10, R, s + 1, 3.2);
  for (let k = 0; k < 3; k++) P.rect(3 + k * 5, 6, 4, 6, R, (i, j) => i === 0 || j === 0 ? 1.4 : i === 3 || j === 5 ? 4.4 : 3 + cg(i, j, s + k) * 0.6);   // carved panels
  P.box(0, 3, 20, 2, R, s + 2, 4.6);
  P.rect(11, 0, 7, 3, RP.pano, (i, j) => j === 0 ? 5 : 3.2 - i * 0.2);                               // the open book
  P.rect(11, 0, 1, 3, RP.tecido, () => 3);
  return P.done();
}
function sarcophagus(open) {   // 36 x 18: a stone chest, and a lid carved with a lying figure
  const P = painter(36, 18), s = 2061 + open, R = RP.pedra;
  P.box(2, 9, 32, 9, R, s, 3.3);
  for (let k = 0; k < 4; k++) P.rect(5 + k * 7, 11, 5, 5, R, (i, j) => i === 0 || j === 0 ? 1.8 : i === 4 || j === 4 ? 4.4 : 2.8 + (Math.abs(i - 2) + Math.abs(j - 2) < 2 ? 1 : 0));   // panels with a boss
  const lid = (dx, dy, tilt) => {
    const at = (x, y) => [x + dx, y + dy + Math.round((x - 18) * tilt)];
    for (let x = 0; x < 36; x++) for (let y = 6; y < 9; y++) { const [X, Y] = at(x, y); P.put(X, Y, R, (y === 6 ? 5 : y === 8 ? 2 : 3.8) - x * 0.03 + cg(x, y, s + 1) * 0.4); }
    // the figure: pillowed head at the left, hands folded on the chest, feet up at the right
    const fig = [[4, 5, 3, 4.6], [8, 3, 3.4, 4.2], [12, 4, 3, 4], [16, 3, 4, 4], [21, 4, 4, 3.8], [26, 4.5, 3, 3.6], [30, 3.5, 2.5, 3.6]];
    for (const [cx, cy, rx, b] of fig) for (let y = 0; y < 7; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const ux = (x + 0.5 - cx) / rx, uy = (y + 0.5 - cy) / 2.6; if (ux * ux + uy * uy > 1 || y > 6) continue; const [X, Y] = at(x, y); P.put(X, Y, R, b + 0.8 - (ux + uy) * 1.2 + cg(x, y, s + 2) * 0.4); }
    const [hx, hy] = at(8, 2); P.put(hx, hy, R, 2); const [px, py] = at(17, 2); P.put(px, py, R, 5.5);
  };
  if (!open) lid(0, 0, 0);
  else {
    P.rect(4, 9, 28, 2, RP.sombra, (i) => 2 + (i < 3 ? 1 : 0));              // the dark inside
    P.rect(6, 8, 4, 2, RP.osso, (i, j) => j ? 3 : 5 - i * 0.4);              // a bony hand on the rim
    lid(9, -3, 0.12);
  }
  return P.done();
}
function coffin(open) {   // 24 x 12: rotten planks, wider at the shoulders
  const P = painter(24, 12), s = 2071 + open, R = RP.madeira;
  const prof = x => x < 6 ? 6 + x * 0.6 : 9.6 - (x - 6) * 0.2;                       // height along the length
  for (let x = 0; x < 24; x++) { const h = Math.round(prof(x)); for (let y = 12 - h; y < 12; y++) { const j = y - (12 - h); P.put(x, y, R, 3.4 + (j === 0 ? 1.4 : 0) - (y === 11 ? 1.3 : 0) + cn(x, y, 200, 12, s) * 1.4 - (y % 4 === 0 ? 0.9 : 0) + cg(x, y, s + 1) * 0.35); } }
  for (let k = 0; k < 6; k++) { const x = 2 + (hash2(k, 0, s) * 20 | 0), y = 6 + (hash2(k, 1, s) * 5 | 0); P.put(x, y, R, 0.5); P.put(x + 1, y, R, 1); }   // rot holes
  if (open) {
    for (let x = 1; x < 23; x++) { const h = Math.round(prof(x)); P.put(x, 12 - h, RP.sombra, 2); }
    P.blob(5, 3.4, 2.4, 2.2, RP.osso, s + 2, 4.2); P.put(4, 3, RP.sombra, 1); P.put(6, 3, RP.sombra, 1);   // a skull looking over the rim
    for (let x = 9; x < 19; x += 3) P.put(x, 2, RP.osso, 4.5);
  } else P.rect(0, 2, 24, 1, R, (i) => 4.8 - (i > 18 ? 1 : 0));
  return P.done();
}
function font() {   // 18 x 20: a marble basin on a pedestal, dark water
  const P = painter(18, 20), s = 2081, R = RP.marmore;
  P.box(3, 17, 12, 3, R, s, 3.4);
  P.cyl(7, 9, 4, 8, R, s + 1, 3.4); P.rect(6, 15, 6, 2, R, (i) => 4 - i * 0.4);
  for (let y = 1; y < 9; y++) { const w = 18 - (y - 1) * 1.1; const L = (18 - w) / 2; for (let i = 0; i < w; i++) P.put(L + i, y, R, 4.4 - i / w * 3 - (y === 8 ? 1 : 0) + cg(L + i, y, s) * 0.4); }   // the bowl
  P.rect(1, 0, 16, 2, R, (i, j) => j ? 3 - i * 0.1 : 5.5 - i * 0.12);
  P.rect(3, 1, 12, 1, RP.ceu, (i) => 2 + (i === 3 ? 3 : 0));                   // still water catching a glint
  for (let y = 3; y < 8; y++) P.put(5 + (y & 1), y, R, 5);                     // the carved fluting
  return P.done();
}
function fallenBell() {   // 24 x 22: a cracked bronze bell sitting on its lip
  const P = painter(24, 22), s = 2091, R = RP.bronze;
  for (let y = 4; y < 22; y++) { const t = (y - 4) / 17, w = 10 + Math.pow(t, 2.2) * 12 + (y > 19 ? 1 : 0); const L = 12 - w / 2; for (let i = 0; i < w; i++) { const u = i / w; P.put(L + i, y, R, 5 - u * 3.8 - Math.pow(Math.abs(u - 0.3) * 2, 3) * 0.7 + (y === 18 || y === 9 ? -1.2 : 0) + cg(L + i, y, s) * 0.4); } }
  P.blob(12, 4, 5, 2.5, R, s + 1, 3.6);                                         // the crown
  P.rect(10, 0, 4, 3, R, (i, j) => i === 0 || i === 3 ? 3.4 - i * 0.4 : j === 0 ? 4 : null);   // the loop
  P.rect(1, 21, 22, 1, R, (i) => 2.6 - i * 0.06);
  for (let y = 8; y < 21; y++) P.put(15 + Math.round(Math.sin(y * 0.8) * 1.2 + (y - 8) * 0.25), y, RP.sombra, 2);   // the crack
  for (let k = 0; k < 18; k++) { const x = 3 + (hash2(k, 0, s) * 18 | 0), y = 6 + (hash2(k, 1, s) * 14 | 0); if (P.has(x, y)) P.put(x, y, RP.verdete, 3 + hash2(k, 2, s) * 2); }   // verdigris
  return P.done();
}
function fallenArch() {   // 36 x 16: a broken length of arch moulding lying in its own rubble
  const P = painter(36, 16), s = 2101, R = RP.pedra;
  for (let x = 2; x < 34; x++) { const top = 3 + Math.round(Math.pow((x - 18) / 16, 2) * 7); for (let y = top; y < top + 6; y++) { const j = y - top; P.put(x, y, R, (j === 0 ? 5 : j === 2 ? 1.8 : j === 3 ? 4.4 : 3.2) - x * 0.02 + cg(x, y, s) * 0.5 - (x % 7 === 0 ? 1.2 : 0)); } }   // voussoirs with mouldings
  for (let k = 0; k < 9; k++) { const cx = 1 + hash2(k, 0, s) * 34, sz = 1.2 + hash2(k, 1, s) * 2; P.blob(cx, 15 - sz * 0.6, sz, sz * 0.8, R, s + k, 3.2); }   // rubble
  return P.done();
}
function fallenColumn() {   // 48 x 14: column drums lying on their side, the capital at one end
  const P = painter(48, 14), s = 2111, R = RP.pedra;
  for (let x = 0; x < 38; x++) for (let y = 3; y < 14; y++) { const v = (y - 3) / 11; P.put(x, y, R, 5 - v * 3.6 - Math.pow(Math.abs(v - 0.3) * 2, 3) * 0.6 + ((y - 3) % 3 === 2 ? -1 : 0) + cg(x, y, s) * 0.4 - (x === 12 || x === 26 ? 2 : 0)); }   // fluted drums
  for (let y = 3; y < 14; y++) for (let x = 36; x < 40; x++) if (hash2(x, y, s) < 0.5 || x < 38) P.put(x, y, R, 1.6);   // the broken face
  for (let x = 38; x < 48; x++) for (let y = 0; y < 14; y++) { const u = Math.abs(y - 7.5) / 7.5, spread = (x - 38) / 10; if (u > 0.55 + spread * 0.45) continue; P.put(x, y, R, 4 - u * 2 + ((x - 38) % 4 === 0 ? -0.8 : 0) + cg(x, y, s + 1) * 0.5); }   // the capital
  for (let x = 2; x < 36; x += 9) P.put(x + (hash2(x, 0, s) * 3 | 0), 4, R, 1);
  return P.done();
}
function boneHeap() {   // 24 x 10: long bones, ribs and two skulls in a heap
  const P = painter(24, 10), s = 2121, R = RP.osso;
  for (let k = 0; k < 9; k++) { const x0 = 1 + hash2(k, 0, s) * 16, y0 = 5 + hash2(k, 1, s) * 4, a = (hash2(k, 2, s) - 0.5) * 0.9, L = 4 + hash2(k, 3, s) * 5; const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L; P.line(x0, y0, x1, y1, R, t => 3.6 + (t < 0.15 || t > 0.85 ? 1.2 : 0)); P.put(x0, y0 - 1, R, 5); P.put(x1, y1 - 1, R, 4.6); }
  P.blob(8, 4.2, 3, 2.8, R, s + 1, 4.2); P.put(7, 4, RP.sombra, 1); P.put(9, 4, RP.sombra, 1); P.put(8, 6, R, 1.5);
  P.blob(18, 6.2, 2.6, 2.4, R, s + 2, 3.6); P.put(17, 6, RP.sombra, 1); P.put(19, 6, RP.sombra, 1);
  return P.done();
}
function bishopChair() {   // 16 x 26: a tall chair with a pointed back, a finial and a faded cushion
  const P = painter(16, 26), s = 2131, R = RP.madeira;
  for (let y = 0; y < 16; y++) { const w = y < 6 ? 2 + y * 2 : 12; const L = 8 - w / 2; P.rect(Math.round(L), y, Math.round(w), 1, R, (i, j, x) => 3.4 - i * 0.18 + (y < 6 ? 0.8 : 0) + cn(x, y, 20, 200, s) * 1.2); }
  P.rect(5, 6, 6, 8, R, (i, j) => i === 0 || j === 0 ? 1.6 : i === 5 ? 4.2 : 2.8);   // the carved panel
  P.blob(8, 1, 1.4, 1.4, RP.ouro, s, 4);
  P.box(1, 15, 14, 3, R, s + 1, 4);                                              // seat
  P.rect(2, 13, 12, 2, RP.tecido, (i, j) => j ? 3 - i * 0.1 : 4.6 - i * 0.15);  // cushion
  for (const lx of [1, 13]) P.rect(lx, 18, 2, 8, R, (i) => i ? 2 : 4);
  P.rect(0, 11, 2, 7, R, (i, j) => j === 0 ? 5 : 3.4 - i); P.rect(14, 11, 2, 7, R, (i, j) => j === 0 ? 4 : 2.4 - i);   // arms
  return P.done();
}

/* =============================== CEILING =============================== */
function chainDown(P, x, y0, y1) { for (let y = y0; y < y1; y++) { const link = (y - y0) % 4; if (link === 0 || link === 3) { P.put(x - 1, y, RP.ferro, 4); P.put(x + 1, y, RP.ferro, 2); } else P.put(x, y, RP.ferro, link === 1 ? 5 : 3); } }
function chandelier() {   // 36 x 30: an iron wheel on chains, five candles
  const P = painter(36, 30), s = 2141;
  chainDown(P, 18, 0, 10);
  P.line(18, 9, 4, 21, RP.ferro, 3); P.line(18, 9, 32, 21, RP.ferro, 2.4); P.line(18, 9, 12, 21, RP.ferro, 3.4); P.line(18, 9, 24, 21, RP.ferro, 2.8);   // chains to the rim
  P.rect(1, 21, 34, 3, RP.ferro, (i, j, x, y) => (j === 0 ? 5 : j === 2 ? 1.6 : 3.4) - i * 0.04 + cg(x, y, s) * 0.5);   // the wheel seen edge-on
  for (let k = 0; k < 5; k++) { const x = 3 + k * 7.5 | 0; P.put(x, 24, RP.ferro, 3); P.put(x, 25, RP.ferro, 2); }   // spikes under the rim
  P.blob(18, 27, 2.2, 2.6, RP.ferro, s + 1, 3.4);                                 // the boss
  for (let k = 0; k < 5; k++) { const x = 3 + Math.round(k * 7.5); candle(P, x, 15 + (k % 2), 21, s + 2 + k); P.put(x + 1, 21, RP.cera, 5); }
  for (let k = 0; k < 4; k++) { const x = 6 + k * 8; P.put(x, 24, RP.cera, 4.6); P.put(x, 25, RP.cera, 3.6); }   // wax drips off the rim
  return P.done();
}
const CHAND_WICKS = [0, 1, 2, 3, 4].map(k => ({ x: 3 + Math.round(k * 7.5), y: 14 + (k % 2) }));
function censer() {   // 10 x 24: a thurible on three chains, pierced bowl and domed lid
  const P = painter(10, 24), s = 2151, R = RP.bronze;
  chainDown(P, 5, 0, 10); P.line(5, 9, 1, 15, RP.ferro, 3); P.line(5, 9, 9, 15, RP.ferro, 2);
  P.blob(5, 15, 3.2, 3, R, s, 3.6); P.put(5, 11, R, 5);                            // lid
  P.rect(1, 17, 9, 4, R, (i, j) => 4.4 - i * 0.4 - j * 0.4); for (let i = 2; i < 9; i += 2) P.put(i, 18, RP.sombra, 2);   // bowl with holes
  P.rect(3, 21, 4, 2, R, (i) => 3.4 - i * 0.5);
  return P.done();
}
const BANNER_EMBLEM = [
  ['..g..', '..g..', 'ggggg', '..g..', '..g..', '..g..'],     // cross
  ['.ggg.', 'g.g.g', 'ggggg', '.g.g.', '.....', 'g...g'],     // skull
  ['g...g', 'ggggg', '.ggg.', '..g..', '.ggg.', 'ggggg']      // chalice
];
function banner(k) {   // 14 x 40: a torn cloth on an iron rod with a faded gold emblem
  const P = painter(14, 40), s = 2161 + k, R = k === 1 ? RP.azul : RP.tecido;
  P.rect(0, 0, 14, 2, RP.ferro, (i, j) => (j ? 2.4 : 4.6) - i * 0.12); P.blob(0.5, 1, 1, 1, RP.ferro, s, 4); P.blob(13.5, 1, 1, 1, RP.ferro, s, 3);
  for (let x = 1; x < 13; x++) {
    const cut = k === 2 ? 30 + Math.abs(x - 6.5) * 1.2 : 34 - Math.abs(x - 6.5) * 0.9, torn = cut + (hash2(x, 0, s) - 0.5) * 6;
    for (let y = 2; y < torn; y++) { if (hash2(x, y >> 1, s + 1) < 0.02 && y > 12) continue; P.put(x, y, R, 3.6 + Math.sin(x * 1.1 + 0.6) * 1.1 - (x === 12 ? 1 : 0) + cg(x, y, s + 2) * 0.35 - (y > torn - 3 ? 0.8 : 0)); }
  }
  for (let y = 4; y < 30; y++) { P.put(1, y, RP.ouro, 3); }                         // gold edging
  const E = BANNER_EMBLEM[k]; for (let j = 0; j < E.length; j++) for (let i = 0; i < 5; i++) if (E[j][i] === 'g') P.put(5 + i, 11 + j * 1.5 | 0, RP.ouro, 4 + (i < 2 ? 0.8 : 0)), P.put(5 + i, 12 + j * 1.5 | 0, RP.ouro, 3);
  return P.done();
}
function bigWeb() {   // 30 x 24: a web hanging from the ceiling, sagging between radial threads
  const P = painter(30, 24), s = 2171, R = RP.pano;
  const ang = [0.15, 0.5, 0.9, 1.3, 1.65, 2.05, 2.45, 2.85].map(a => a + (hash2(a * 10, 0, s) - 0.5) * 0.15), cx = 15, cy = -2;
  for (const a of ang) for (let r = 2; r < 25; r += 0.5) { const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (y < 24 && x >= 0 && x < 30) P.put(x, y, R, 4.5 - r * 0.08); }
  for (let ring = 5; ring < 24; ring += 3.2) for (let i = 0; i < ang.length - 1; i++) for (let k = 0; k <= 10; k++) { const t = k / 10, a = ang[i] + (ang[i + 1] - ang[i]) * t, r = ring - Math.sin(t * Math.PI) * 1.2; if (hash2(i, ring | 0, s) < 0.1) continue; P.put(cx + Math.cos(a) * r, cy + Math.sin(a) * r, R, 3.8 - ring * 0.05); }
  P.blob(19, 13, 1.6, 1.4, RP.sombra, s, 3); P.put(19, 12, RP.sombra, 1);          // a dead husk caught in it
  return P.done(false);
}
function hook() {   // 8 x 30: a chain ending in an iron hook
  const P = painter(8, 30), s = 2181;
  chainDown(P, 4, 0, 22);
  for (let y = 22; y < 30; y++) { const t = (y - 22) / 7; const x = 4 + (y > 26 ? -Math.sin((y - 26) / 3 * Math.PI) * 2.5 : 0); P.put(x, y, RP.ferro, 4 - t); }
  P.put(1, 27, RP.ferro, 4); P.put(1, 26, RP.ferro, 5); P.put(2, 29, RP.ferro, 2);
  for (let y = 22; y < 29; y += 2) if (hash2(y, 0, s) < 0.5) P.put(5, y, RP.ferrugem, 3);
  return P.done();
}
function gibbet() {   // 14 x 36: a cage on a chain with a skeleton slumped inside
  const P = painter(14, 36), s = 2191;
  chainDown(P, 7, 0, 7);
  const half = y => y < 12 ? 2 + (y - 7) * 1 : y > 30 ? 6 - (y - 30) * 1 : 6;
  // the skeleton behind the front bars
  P.blob(7, 13, 2.6, 2.4, RP.osso, s, 4); P.put(6, 13, RP.sombra, 1); P.put(8, 13, RP.sombra, 1); P.put(7, 15, RP.osso, 2);
  for (let y = 17; y < 26; y += 2) P.rect(4, y, 6, 1, RP.osso, (i) => 4 - i * 0.4);
  P.rect(7, 16, 1, 12, RP.osso, () => 3.6);
  P.line(4, 18, 2, 27, RP.osso, 3.6); P.line(10, 18, 11, 25, RP.osso, 3);
  P.line(6, 28, 5, 34, RP.osso, 3.4); P.line(8, 28, 10, 33, RP.osso, 3);
  for (let y = 7; y < 35; y++) { const h = half(y); for (const x of [7 - h, 7 + h]) P.put(x, y, RP.ferro, x < 7 ? 4.4 : 2.6); if (y % 6 === 1 || y === 34) for (let x = 7 - h; x <= 7 + h; x++) P.put(x, y, RP.ferro, 3.6 - (x - 7 + h) * 0.15); if (y > 11 && y < 31) { P.put(5, y, RP.ferro, 3.4); P.put(9, y, RP.ferro, 2.8); } }
  for (let k = 0; k < 10; k++) { const y = 8 + (hash2(k, 0, s) * 26 | 0), x = hash2(k, 1, s) < 0.5 ? 7 - half(y) : 7 + half(y); P.put(x, y, RP.ferrugem, 3); }
  return P.done();
}

/* =============================== BACK WALL =============================== */
// a pointed lancet window: stone frame, lead cames, dim coloured quarries, a medallion, broken panes
function lancet(k) {   // 36 x 72
  const P = painter(36, 72), s = 2201 + k, R = RP.pedra, cols = k ? ['b', 'v', 'a', 'b', 'g'] : ['r', 'a', 'b', 'r', 'g'];
  const inside = (x, y, m) => { if (x < 3 - m || x > 32 + m || y > 69 + m) return false; if (y >= 18) return true; return Math.hypot(x - 32 - m * 0.2, y - 18) < 29 + m && Math.hypot(x - 3 + m * 0.2, y - 18) < 29 + m && y > -1; };
  for (let y = 0; y < 72; y++) for (let x = 0; x < 36; x++) {
    if (!inside(x, y, 3)) continue;
    if (!inside(x, y, 0)) { const L = inside(x + 1, y + 1, 0); P.put(x, y, R, (L ? 5.2 : 2.6) - y * 0.01 + cg(x, y, s) * 0.5); continue; }   // the stone frame
    // tracery: a central mullion and a small round light at the top
    if (Math.abs(x - 17.5) < 1 && y > 24) { P.put(x, y, R, x < 17.5 ? 4.6 : 2.4); continue; }
    const rr = Math.hypot(x - 17.5, y - 15); if (Math.abs(rr - 6) < 1) { P.put(x, y, R, y < 15 ? 4.4 : 2.6); continue; }
    // lead cames on a diamond grid, quarries coloured by panel
    const d1 = (x + y) % 7, d2 = (x - y + 700) % 7; if (d1 === 0 || d2 === 0) { P.col(x, y, VID.chumbo); continue; }
    const q = Math.floor((x + y) / 7) * 31 + Math.floor((x - y + 700) / 7), broken = hash2(q, 0, s) < (k ? 0.16 : 0.09);
    if (broken) { P.put(x, y, RP.sombra, 1 + hash2(x, y, s) * 0.8); continue; }
    let c = cols[(q * 7 + (rr < 6 ? 3 : 0)) % 5]; if (rr < 5) c = k ? 'a' : 'b'; if (y > 40 && y < 56 && Math.hypot(x - 17.5, y - 48) < 7.5) c = k ? 'r' : 'v';   // medallion
    const G = VIDR[c]; P.put(x, y, G, 1.7 + (1 - y / 72) * 0.8 + cn(x, y, 40, 40, s) * 1.6 + cg(x, y, s + 1) * 0.6 + (d1 === 1 || d2 === 1 ? 0.5 : 0) - (hash2(q, 1, s) < 0.3 ? 0.7 : 0));
  }
  P.rect(1, 69, 34, 3, R, (i, j) => j === 0 ? 5 : 2.6 - i * 0.04);               // sill
  return P.done();
}
function rose() {   // 60 x 60: a rose window, petals of tracery around a hub
  const P = painter(60, 60), s = 2211, R = RP.pedra, cx = 29.5, cy = 29.5;
  for (let y = 0; y < 60; y++) for (let x = 0; x < 60; x++) {
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), seg = ((a + Math.PI) / (Math.PI * 2) * 12 + 12) % 12, ls = seg % 1, sid = Math.floor(seg);
    if (r > 30) continue;
    if (r > 27) { P.put(x, y, R, (dx + dy < 0 ? 5 : 2.4) + cg(x, y, s) * 0.4); continue; }   // the frame ring
    if (r < 5) { P.put(x, y, r < 2 ? VIDR.a : R, r < 2 ? 3.4 : 4 - (dx + dy) * 0.2); continue; }   // hub
    const petal = r > 9 && r < 25 && Math.abs(ls - 0.5) * 2 * r < (r < 17 ? r * 0.55 : (25 - r) * 1.2);
    if ((ls < 0.07 || ls > 0.93) || Math.abs(r - 9) < 0.8 || (r > 24.4 && r < 25.4)) { P.put(x, y, R, 3.6 - dy * 0.03 + cg(x, y, s + 1) * 0.5); continue; }   // tracery bars
    if (petal) { const edge = Math.abs(Math.abs(ls - 0.5) * 2 * r - (r < 17 ? r * 0.55 : (25 - r) * 1.2)) < 0.9; if (edge) { P.col(x, y, VID.chumbo); continue; } }
    const G = VIDR[petal ? (sid & 1 ? 'r' : 'b') : r < 9 ? 'a' : (sid % 3 === 0 ? 'v' : 'g')], broken = hash2(sid, Math.floor(r / 4), s) < 0.08;
    if (broken) { P.put(x, y, RP.sombra, 1.2); continue; }
    if ((x + y) % 5 === 0 && !petal) { P.col(x, y, VID.chumbo); continue; }
    P.put(x, y, G, 1.7 + (1 - r / 27) * 1 + cg(x, y, s + 2) * 0.6 + cn(x, y, 30, 30, s) * 1.4);
  }
  return P.done();
}
function reliefArch() {   // 60 x 48: an ogival arch in relief to frame a passage; the inside stays empty
  const P = painter(60, 48), s = 2221, R = RP.pedra;
  const ins = (x, y, m) => y >= 40 ? x >= 7 - m && x <= 52 + m : Math.hypot(x - 52, y - 40) < 45 + m && Math.hypot(x - 7, y - 40) < 45 + m;
  for (let y = 0; y < 48; y++) for (let x = 0; x < 60; x++) {
    if (ins(x, y, 0) || !ins(x, y, 7)) continue;
    const band = ins(x, y, 2) ? 0 : ins(x, y, 4) ? 1 : 2;                       // three mouldings
    P.put(x, y, R, [4.6, 2.6, 3.8][band] + (x < 30 ? 0.4 : -0.4) + cg(x, y, s) * 0.5 - ((Math.round(Math.atan2(40 - y, x - 29.5) * 9)) % 2 === 0 && y < 40 && band === 2 ? 0.9 : 0));
  }
  for (const bx of [0, 53]) P.rect(bx, 38, 7, 3, R, (i, j) => j === 0 ? 5.2 : j === 2 ? 2 : 3.6);   // capitals at the springing
  return P.done();
}
function niche() {   // 24 x 36: an arched niche with a little saint
  const P = painter(24, 36), s = 2231, R = RP.pedra;
  for (let y = 0; y < 36; y++) for (let x = 0; x < 24; x++) {
    const o = y >= 10 ? x >= 1 && x <= 22 : Math.hypot(x - 11.5, y - 10) < 11.5, i = y >= 10 ? x >= 4 && x <= 19 && y < 32 : Math.hypot(x - 11.5, y - 10) < 8.5;
    if (!o) continue;
    if (i) P.put(x, y, RP.sombra, 3 + (x < 8 ? -1 : 0) + (y < 12 ? -0.6 : 0) + cg(x, y, s) * 0.5);
    else P.put(x, y, R, (x < 12 ? 4.4 : 2.8) + (y > 31 ? (y === 32 ? 1.6 : -0.8) : 0) + cg(x, y, s + 1) * 0.5);
  }
  robe(P, 8, 14, 8, 17, RP.pedra, s + 2); P.blob(12, 11, 2.6, 3, RP.pedra, s + 3, 3.8); P.blob(12.6, 11.8, 1.2, 1.6, RP.sombra, s, 2);
  P.rect(7, 30, 10, 2, R, (i) => 4 - i * 0.2);
  return P.done();
}
function fresco(k) {   // 48 x 30: a faded, peeling painting of haloed figures on plaster
  const P = painter(48, 30), s = 2241 + k;
  for (let y = 0; y < 30; y++) for (let x = 0; x < 48; x++) {
    const edge = Math.min(x, y, 47 - x, 29 - y) + cn(x, y, 30, 30, s) * 10;
    if (edge < 1.5) continue;                                                   // ragged peeled border
    const peel = cn(x, y, 24, 24, s + 1) > 0.2; if (peel) continue;            // patches gone back to the wall
    let R = RP.reboco, v = 3 + cg(x, y, s + 2) * 0.6;
    if (y < 10) { R = RP.ceu; v = 2.6 + cg(x, y, s + 3) * 0.5; }               // a dim blue sky band
    for (let f = 0; f < 3; f++) {                                               // three standing figures with halos
      const fx = 10 + f * 14 + (k ? 3 : 0), dx = x - fx;
      if (Math.abs(Math.hypot(dx, y - 8) - 3.6) < 0.8) { R = RP.ouro; v = 3.4; }
      else if (Math.hypot(dx, y - 8) < 2.4) { R = RP.reboco; v = 4.2; }
      else if (y > 11 && y < 28 && Math.abs(dx) < 3 + (y - 11) * 0.18) { R = (f + k) % 2 ? RP.vermelho : RP.azul; v = 3.4 - dx * 0.2 + Math.sin(dx * 1.5) * 0.4; }
    }
    if (y > 26) { R = RP.ocre; v = 2.8; }
    if (Math.abs(cn(x, y, 20, 20, s + 4)) < 0.012) v -= 1.6;                    // cracks
    P.put(x, y, R, v - 0.6);
  }
  return P.done(false);
}
function tiltedCross() {   // 24 x 36: a wooden cross knocked askew on its nail
  const P = painter(24, 36), s = 2251, R = RP.madeira, a = 0.32, ca = Math.cos(a), sa = Math.sin(a), cx = 12, cy = 12;
  for (let y = 0; y < 36; y++) for (let x = 0; x < 24; x++) {
    const u = (x - cx) * ca + (y - cy) * sa, v = -(x - cx) * sa + (y - cy) * ca;
    const vert = Math.abs(u) < 2 && v > -11 && v < 23, horiz = Math.abs(v + 3) < 1.6 && Math.abs(u) < 9;
    if (!vert && !horiz) continue;
    P.put(x, y, R, 3.4 + (vert ? (u < -1 ? 1.2 : u > 1 ? -1 : 0) : (v < -3.6 ? 1.2 : -0.6)) + cn(x, y, 30, 200, s) * 1.2 + cg(x, y, s + 1) * 0.3);
  }
  P.put(cx, cy - 3, RP.ferro, 5); P.put(cx + 1, cy - 3, RP.ferro, 2);
  return P.done();
}
function coatOfArms() {   // 24 x 24: a stone-framed shield, quartered, worn
  const P = painter(24, 24), s = 2261;
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
    const hw = y < 12 ? 11 : 11 - Math.pow((y - 12) / 12, 1.6) * 11; if (Math.abs(x - 11.5) > hw) continue;
    const inner = Math.abs(x - 11.5) < hw - 2 && y > 1 && y < 22;
    if (!inner) { P.put(x, y, RP.pedra, (x < 12 ? 4.6 : 2.8) + cg(x, y, s) * 0.5); continue; }
    const q = (x < 12) !== (y < 11); let R = q ? RP.vermelho : RP.ouro;
    if (Math.abs(x - 11.5) < 1 || Math.abs(y - 10.5) < 1) R = RP.pedra;
    P.put(x, y, R, 3 - (x - 11.5) * 0.06 + cg(x, y, s + 1) * 0.6 - (hash2(x >> 1, y >> 1, s) < 0.15 ? 1.3 : 0));
  }
  return P.done();
}
function cryptNiches() {   // 36 x 36: three rows of burial niches, some with skulls
  const P = painter(36, 36), s = 2271;
  P.rect(0, 0, 36, 36, RP.pedra, (i, j, x, y) => 2.4 + cg(x, y, s) * 0.6 + cn(x, y, 40, 40, s) * 0.8 + (i === 0 || j === 0 ? 1 : 0) - (i === 35 || j === 35 ? 1 : 0));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x0 = 2 + c * 11, y0 = 2 + r * 11;
    for (let y = 0; y < 9; y++) for (let x = 0; x < 10; x++) { const inN = y >= 3 || Math.hypot(x - 4.5, y - 3.5) < 4.6; if (inN) P.put(x0 + x, y0 + y, RP.sombra, 2 + (x < 2 ? -1 : 0) + (y < 2 ? -0.5 : 0)); }
    P.rect(x0, y0 + 9, 10, 1, RP.pedra, () => 4.6);
    const h = hash2(r, c, s);
    if (h < 0.55) { P.blob(x0 + 4.5 + (h - 0.3) * 4, y0 + 6.4, 2.4, 2.2, RP.osso, s + r * 3 + c, 3.6); P.put(x0 + 4 + (h - 0.3) * 4, y0 + 6, RP.sombra, 1); P.put(x0 + 6 + (h - 0.3) * 4, y0 + 6, RP.sombra, 1); }
    else if (h < 0.8) for (let x = 1; x < 9; x++) P.put(x0 + x, y0 + 8, RP.osso, 3 + hash2(x, r, s) * 2);
  }
  return P.done();
}
function sconce() {   // 10 x 16: an iron wall bracket holding a candle
  const P = painter(10, 16), s = 2281;
  P.rect(3, 11, 4, 5, RP.ferro, (i, j) => (j === 0 ? 4.6 : 3) - i * 0.4);       // the plate on the wall
  P.line(5, 12, 5, 9, RP.ferro, 3.6);
  P.rect(2, 8, 7, 2, RP.ferro, (i, j) => j ? 2.4 : 4.6 - i * 0.2);              // the cup
  candle(P, 5, 3, 8, s);
  P.put(7, 9, RP.cera, 5); P.put(7, 10, RP.cera, 4);
  return P.done();
}
function tornPainting() {   // 24 x 30: a portrait in a gilded frame, the canvas slashed
  const P = painter(24, 30), s = 2291;
  P.rect(0, 0, 24, 30, RP.ouro, (i, j, x, y) => { const e = Math.min(i, j, 23 - i, 29 - j); if (e > 2) return null; return (e === 0 ? 2 : e === 1 ? (i < 12 && j < 15 ? 4.6 : 3.4) : 1.8) + cg(x, y, s) * 0.6; });
  P.rect(3, 3, 18, 24, RP.madeira, (i, j, x, y) => 1.8 + cn(x, y, 30, 30, s) * 1.2 + cg(x, y, s + 1) * 0.4);   // dark varnish
  P.blob(12, 11, 4, 5, RP.pano, s + 2, 2.2); P.blob(12, 22, 7, 5, RP.tecido, s + 3, 1.8);   // a dim face and red robe
  for (let y = 5; y < 25; y++) { const x = 8 + Math.round((y - 5) * 0.45 + Math.sin(y * 0.6)); for (let w = 0; w < 2 + (y > 10 && y < 18 ? 1 : 0); w++) P.put(x + w, y, RP.sombra, 0.5); P.put(x - 1, y, RP.pano, 3.6); }   // the slash, curling edge
  P.rect(11, 0, 2, 1, RP.ferro, () => 3);
  return P.done();
}
function organ() {   // 72 x 60: a wooden case with towers of tin pipes
  const P = painter(72, 60), s = 2301, R = RP.madeira;
  P.box(4, 40, 64, 20, R, s, 2.8);                                               // the lower case
  for (let k = 0; k < 4; k++) P.rect(8 + k * 15, 44, 12, 12, R, (i, j) => i === 0 || j === 0 ? 1.4 : i === 11 || j === 11 ? 4.2 : 2.6 + cg(i, j, s + k) * 0.6);
  P.box(2, 38, 68, 3, R, s + 1, 4.2);                                            // the cornice
  // pipes: tallest in the middle, falling off to the sides, each with its mouth
  const pipes = []; for (let i = 0; i < 17; i++) { const x = 4 + i * 4, d = Math.abs(i - 8); pipes.push([x, 6 + d * d * 0.28 + (d % 2) * 2]); }
  for (const [x, top] of pipes) {
    P.cyl(x, Math.round(top), 3, 38 - Math.round(top), RP.estanho, s + x, 3.4);
    P.put(x + 1, Math.round(top), RP.estanho, 6);
    const my = 31 - (x % 3); P.rect(x, my, 3, 2, RP.sombra, (i, j) => j ? 2 : 3);   // the mouth
    P.put(x, my - 1, RP.estanho, 5);
  }
  // carved towers framing the pipes
  for (const tx of [0, 68]) { P.box(tx, 10, 4, 30, R, s + tx, 3.2); P.rect(tx, 6, 4, 4, R, (i, j) => j < 2 && (i === 0 || i === 3) ? null : 4); P.blob(tx + 2, 4, 1.4, 1.6, RP.ouro, s, 4); }
  P.blob(36, 3, 2, 2.4, RP.ouro, s + 2, 4);
  // a few dead pipes, dented and dark
  for (const i of [3, 11, 14]) { const [x, top] = pipes[i]; for (let y = Math.round(top) + 4; y < Math.round(top) + 9; y++) P.put(x + 1, y, RP.estanho, 1.4); }
  return P.done();
}

/* =============================== register =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes }, extra || {}));
const WARM = '#ffb060';
// floor
def('banco', 'Banco', F, 'frente', ['nave', 'claustro'], [pew(0), pew(1), pew(2)]);
def('candelabro_pe', 'Candelabro', F, 'frente', ['nave', 'claustro', 'criptas'], [standingCandelabrum()], { luz: [{ x: 6, y: 0, r: 0.8 }], chamas: [{ x: 1, y: 2 }, { x: 6, y: 0 }, { x: 10, y: 3 }], brilho: WARM });
def('estatua_santo', 'Estátua de santo', F, 'frente', ['nave', 'claustro', 'criptas'], [saint(0), saint(1)]);
def('estatua_anjo', 'Estátua de anjo', F, 'frente', ['nave', 'claustro', 'criptas'], [angel(0), angel(1)]);
def('altar', 'Altar', F, 'frente', ['nave', 'claustro'], [altar()], { luz: [{ x: 6, y: 0, r: 0.7 }, { x: 41, y: 1, r: 0.7 }], chamas: [{ x: 6, y: 0 }, { x: 41, y: 1 }], brilho: WARM });
def('pulpito', 'Púlpito', F, 'frente', ['nave'], [pulpit()]);
def('sarcofago', 'Sarcófago', F, 'frente', ['claustro', 'criptas'], [sarcophagus(0), sarcophagus(1)]);
def('caixao', 'Caixão', F, 'frente', ['claustro', 'criptas'], [coffin(0), coffin(1)]);
def('pia_batismal', 'Pia batismal', F, 'frente', ['nave', 'claustro'], [font()]);
def('sino_caido', 'Sino caído', F, 'frente', ['atrio', 'nave'], [fallenBell()]);
def('escombro_grande', 'Arco caído', F, 'frente', ['atrio', 'nave', 'claustro'], [fallenArch()]);
def('coluna_tombada', 'Coluna tombada', F, 'frente', ['atrio', 'nave', 'claustro'], [fallenColumn()]);
def('ossos_monte', 'Monte de ossos', F, 'frente', ['claustro', 'criptas'], [boneHeap()]);
def('cadeira_bispo', 'Cadeira do bispo', F, 'frente', ['nave'], [bishopChair()]);
// ceiling
def('lustre', 'Lustre', C, 'frente', ['nave', 'claustro'], [chandelier()], { luz: [{ x: 18, y: 16, r: 0.9 }], chamas: CHAND_WICKS, brilho: WARM });
def('incensario', 'Incensário', C, 'frente', ['nave', 'claustro'], [censer()]);
def('estandarte', 'Estandarte', C, 'frente', ['nave', 'claustro', 'criptas'], [banner(0), banner(1), banner(2)]);
def('teia_grande', 'Teia', C, 'frente', ['atrio', 'nave', 'claustro', 'criptas'], [bigWeb()]);
def('corrente_gancho', 'Corrente com gancho', C, 'frente', ['claustro', 'criptas'], [hook()]);
def('gaiola', 'Gaiola', C, 'frente', ['claustro', 'criptas'], [gibbet()]);
// back wall
def('vitral_alto', 'Vitral', W, 'fundo', ['nave', 'claustro'], [lancet(0), lancet(1)]);
def('vitral_rosacea', 'Rosácea', W, 'fundo', ['nave'], [rose()]);
def('arco_ogiva', 'Arco ogival', W, 'fundo', ['atrio', 'nave', 'claustro', 'criptas'], [reliefArch()]);
def('nicho_santo', 'Nicho', W, 'fundo', ['nave', 'claustro'], [niche()]);
def('afresco', 'Afresco', W, 'fundo', ['claustro'], [fresco(0), fresco(1)]);
def('cruz_caida', 'Cruz torta', W, 'fundo', ['nave', 'claustro', 'criptas'], [tiltedCross()]);
def('brasao', 'Brasão', W, 'fundo', ['nave', 'claustro'], [coatOfArms()]);
def('nichos_cripta', 'Nichos de túmulo', W, 'fundo', ['criptas'], [cryptNiches()]);
def('tocheiro_parede', 'Tocheiro', W, 'fundo', ['atrio', 'nave', 'claustro', 'criptas'], [sconce()], { luz: [{ x: 5, y: 2, r: 0.65 }], chamas: [{ x: 5, y: 2 }], brilho: WARM });
def('quadro_rasgado', 'Quadro rasgado', W, 'fundo', ['claustro'], [tornPainting()]);
def('orgao', 'Órgão', W, 'fundo', ['nave'], [organ()]);
}
