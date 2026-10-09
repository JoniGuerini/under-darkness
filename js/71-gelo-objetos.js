'use strict';

/* ================= the ice caves: props =================
   Everything bigger than a block that dresses the ice. On the floor: an explorer frozen standing inside a block
   of clear ice (his torch still in his hand), a cathedral sarcophagus that slid down from the crypts and froze,
   a frozen statue of a saint, mammoth tusks curving out of the snow and a whole mammoth skeleton, the yetis'
   dead campfire (a ring of stones, gnawed bones, a last ember), snow drifts, a frozen boulder, big ice
   stalagmites, a geode of glowing ice crystals and an old rune altar crusted with ice. From the roof: clusters
   of great icicles, a hanging crystal that glows, roots frozen stiff. On the back wall: a frozen waterfall
   stopped in mid-fall, a seam of glowing blue ice, a beast caught in the ice, the silhouette of a giant inside
   the wall, the yetis' claw marks and their crude hunting paintings. Same 7-tone ramps lit from the top left and
   dark rim as 54-caverna-objetos; registered with defProp (`gelo: true`), placed by 73-gelo-mundo (IC_PROP_PLAN). */
const IC_PROP_PLAN = {};
// back-wall pieces that stand on the floor instead of hanging at eye height
const IC_BACK_FLOOR = { ic_cachoeira: 1, ic_gigante: 1 };
{
const { cg, cn } = ICART;
const R7 = hexes => hexes.map(h => ph(h));
const RP = {
  gelo: R7(['#10283e', '#1c4466', '#30668e', '#5090b8', '#80bcdc', '#b8e0f4', '#effaff']),
  azul: R7(['#061630', '#0b2850', '#123e76', '#1c5c9e', '#3282c4', '#64b0e4', '#b4e2fa']),
  cristal: R7(['#06203a', '#0a3a62', '#12608e', '#1e8ec0', '#46bce6', '#9ae4fa', '#eafcff']),
  neve: R7(['#3a475a', '#566880', '#7a8ea8', '#a0b6cc', '#c6d8e8', '#e4eff8', '#ffffff']),
  rocha: R7(['#10151c', '#1c2430', '#2c3846', '#3e4e60', '#526478', '#687c92', '#8296ac']),
  negro: R7(['#03060c', '#070d17', '#0e1724', '#162334', '#203247', '#2c445e', '#3c5a78']),
  osso: R7(['#26282a', '#3e4244', '#5e6466', '#82898c', '#a8b0b2', '#c8d2d6', '#e8f2f6']),
  marfim: R7(['#2e2a22', '#4a4436', '#6e664e', '#958a6a', '#b8ac88', '#d6cca8', '#f0e8cc']),
  cantaria: R7(['#22252a', '#383c42', '#545a61', '#737a82', '#939aa2', '#b2b9c0', '#d0d6dc']),
  couro: R7(['#120c0a', '#1e1612', '#2e221c', '#423226', '#584432', '#6e5640', '#86704e']),
  pano: R7(['#141820', '#20283a', '#2e3a54', '#3e4e70', '#52668c', '#6a82a8', '#88a2c4']),
  pele: R7(['#1e1a1e', '#2e2830', '#443c44', '#5c525a', '#766a72', '#90848a', '#aca0a4']),
  ferro: R7(['#0c0c0f', '#141418', '#24252b', '#383a42', '#50535d', '#6e727e', '#9298a4']),
  brasa: R7(['#200804', '#401006', '#70200a', '#a83c10', '#e06a20', '#ffa040', '#ffe0a0']),
  cinza: R7(['#141414', '#202022', '#303032', '#444446', '#5a5a5c', '#727274', '#8c8c8e']),
  madeira: R7(['#140c06', '#22140a', '#341f10', '#4a2e18', '#624022', '#7c542e', '#966c40']),
  ocre: R7(['#2a120a', '#46200f', '#6a3218', '#8e4622', '#ae5c2e', '#c8783e', '#dc9656']),
  carvao: R7(['#08080a', '#0e0e10', '#161618', '#1e1e22', '#28282c', '#323236', '#3e3e44']),
  runa: R7(['#04202a', '#063a4a', '#0a5a6e', '#10808e', '#28aab4', '#6ad8dc', '#c8faf8']),
  sombra: R7(['#020306', '#04060a', '#070a10', '#0a0e16', '#0e131c', '#121822', '#171e2a'])
};
const OUTLINE = ph('#06090e');

/* ---- the painter (same as 54's) ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[y * w + x] = idOf(R); },
    clear(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    ramp(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? ramps[rid[(y | 0) * w + (x | 0)]] : null; },
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
// an ice cone w wide at its root, len long, hanging (tip down) or standing (tip up): clear, with a bright face and a wet tip
function cone(P, cx, y0, w, len, hang, R, s, base = 3.4) {
  for (let k = 0; k < len; k++) {
    const t = k / len, half = Math.max(0.5, (1 - Math.pow(t, 0.7)) * w / 2 + Math.sin(k * 0.7 + s) * 0.25), y = hang ? y0 + k : y0 - k, c = cx + Math.sin(t * 2.2 + s) * 0.6;
    for (let x = Math.floor(c - half); x <= Math.ceil(c + half) - 1; x++) {
      const u = (x + 0.5 - (c - half)) / (2 * half);
      let v = base + 1.6 - u * 3 + cg(x, y, s) * 0.4 + (t > 0.86 ? 1.1 : 0);
      if (Math.abs(u - 0.3) < 0.09) v += 1.6;
      if (k % 5 === (s & 3) && u > 0.55) v -= 0.6;
      P.put(x, y, R, v);
    }
  }
}
// a block of clear ice over a figure already painted: fills the gaps with deep ice, frosts the edges, adds glints
function encase(P, x0, y0, w, h, s) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const i = x - x0, j = y - y0, edge = i === 0 || j === 0 || i === w - 1 || j === h - 1, g = i + j * 0.7, gl = (Math.abs(g - w * 0.3) < 0.7 && j < h * 0.7) || (Math.abs(g - w * 0.3 - 3) < 0.45 && j > 2 && j < h * 0.45);   // two glints, top left
    if (edge) { P.put(x, y, RP.gelo, (i === 0 || j === 0 ? 5.2 : 2.2) + cg(x, y, s) * 0.4); continue; }
    if (gl) { P.put(x, y, RP.gelo, 6); continue; }
    if (!P.has(x, y)) { P.put(x, y, RP.azul, 2.4 + (1 - j / h) * 1.2 - i / w * 0.8 + cn(x, y, 20, 20, s) * 1.2 + cg(x, y, s + 1) * 0.3); continue; }
    if (hash2(x, y, s + 2) < 0.07) P.put(x, y, RP.gelo, 5.4);   // frost bloom over the figure
  }
  for (let k = 0; k < Math.floor(w / 3); k++) { const x = x0 + 1 + ((k * 3 + s) % (w - 2)), len = 1 + (hash2(k, 0, s) * 3 | 0); for (let j = 0; j < len; j++) P.put(x, y0 - 1 - j, RP.gelo, 4.6 - j * 0.6); }   // little crystals on top
}

/* =============================== FLOOR =============================== */
function frozenExplorer() {   // 22 x 32: an explorer frozen standing in a block of clear ice, the torch still in his raised hand
  const P = painter(22, 32), s = 7401, F = RP.pano, L = RP.couro, K = RP.pele;
  // the figure, painted in cold muted tones (seen through the ice)
  P.rect(8, 22, 2, 8, L, (i, j) => 3 - i - j * 0.06); P.rect(12, 22, 2, 8, L, (i, j) => 2.6 - i - j * 0.06);   // legs, boots
  P.rect(7, 12, 8, 11, F, (i, j) => 3.8 - i * 0.24 + (j === 7 ? -1.2 : 0) + cg(i, j, s) * 0.4);                   // coat, belt
  P.rect(5, 13, 2, 7, F, (i, j) => 3 - j * 0.1); P.put(5, 20, K, 3.4);                                              // left arm hanging
  P.line(15, 13, 18, 8, F, 3.2, 2); P.put(18, 7, K, 3.6);                                                         // right arm raised
  P.rect(17, 2, 2, 6, RP.madeira, (i, j) => 3.4 - i); P.blob(18, 2, 1.8, 1.6, RP.cinza, s, 2.6);                   // the torch, burnt out
  P.blob(11, 8.5, 3, 3.2, K, s + 1, 3.6); P.rect(8, 5, 6, 2, L, (i) => 3.4 - i * 0.3);                             // head, a fur hat
  P.put(10, 9, RP.sombra, 2); P.put(12, 9, RP.sombra, 2); P.rect(10, 11, 3, 1, RP.neve, () => 4.4);                // eyes shut, frost in the beard
  P.rect(6, 15, 3, 6, L, (i, j) => 2.8 - i * 0.4);                                                                 // a pack strap
  encase(P, 2, 3, 19, 28, s);
  for (let x = 0; x < 22; x++) P.put(x, 31, RP.neve, 3.6 + cg(x, 0, s) * 0.8 - (x === 0 || x === 21 ? 1 : 0));   // snow at its foot
  P.blob(1.5, 30, 1.8, 1.6, RP.neve, s + 3, 4); P.blob(20.5, 30, 1.8, 1.4, RP.neve, s + 4, 4);
  return P.done();
}
function frozenTomb() {   // 34 x 17: a cathedral sarcophagus that slid down from the crypts, tilted and glazed in ice
  const P = painter(34, 17), s = 7421;
  for (let x = 2; x < 32; x++) { const lift = Math.round((x - 2) * 0.1); for (let y = 6 - lift; y < 16 - lift; y++) { const j = y - (6 - lift); P.put(x, y, RP.cantaria, 3.6 + (j === 0 ? 1.6 : j === 1 ? 0.6 : 0) - (j === 9 ? 1.4 : 0) - (x === 31 ? 1 : 0) + cg(x, y, s) * 0.5 + (j === 4 ? -1.2 : 0)); } }
  for (let x = 1; x < 33; x++) { const lift = Math.round((x - 1) * 0.1); P.put(x, 5 - lift, RP.cantaria, 5); P.put(x, 4 - lift, RP.cantaria, 4.2); }   // the lid
  for (let k = 0; k < 4; k++) { const x = 6 + k * 6; for (let j = 0; j < 3; j++) P.put(x, 10 - Math.round(x * 0.1) + j, RP.cantaria, 2); }   // carved panels
  // ice: a glaze over the top, icicles off the lid, a heap of frozen snow on the low end
  for (let x = 1; x < 33; x++) { const lift = Math.round((x - 1) * 0.1); P.put(x, 3 - lift, RP.gelo, 5 + cg(x, 0, s) * 0.8); if (hash2(x, 0, s) < 0.4) P.put(x, 2 - lift, RP.gelo, 6); }
  for (const x of [5, 11, 18, 26, 30]) { const lift = Math.round((x - 1) * 0.1); for (let j = 0; j < 2 + (x % 3); j++) P.put(x, 6 - lift + j, RP.gelo, 5.4 - j); }
  P.blob(3, 14, 4, 3.4, RP.neve, s + 1, 3.8); P.blob(31, 13, 3, 2.6, RP.neve, s + 2, 3.6);
  for (let x = 0; x < 34; x++) if (P.has(x, 16)) P.put(x, 16, RP.neve, 2.4);
  return P.done();
}
function frozenStatue() {   // 16 x 36: a saint from the cathedral, fallen into the cold, rimed with frost and ice
  const P = painter(16, 36), s = 7441, C = RP.cantaria;
  P.box(2, 31, 12, 5, C, s, 3.2);                                                   // plinth
  P.rect(4, 14, 8, 17, C, (i, j) => 3.6 - i * 0.22 + ((i + j) % 5 === 0 ? -0.8 : 0) + cg(i, j, s) * 0.4);   // robe in folds
  P.rect(3, 15, 2, 9, C, (i, j) => 3 - i * 0.3); P.rect(11, 15, 2, 9, C, (i, j) => 2.6 - i * 0.3);           // arms
  P.rect(6, 17, 4, 3, C, (i) => 4.6 - i * 0.3);                                     // hands joined in prayer
  P.blob(8, 10, 3, 3.4, C, s + 1, 3.8); P.put(7, 10, C, 1.6); P.put(9, 10, C, 1.6);   // head, eyes worn away
  for (let a = 0; a < 6.3; a += 0.3) P.put(8 + Math.cos(a) * 5, 9 + Math.sin(a) * 5, RP.cantaria, 4.8);   // halo ring
  // frost: on every upper surface, and icicles from the arms and halo
  for (let y = 1; y < 36; y++) for (let x = 0; x < 16; x++) if (P.has(x, y) && !P.has(x, y - 1)) P.put(x, y, RP.neve, 5.4 + cg(x, y, s) * 0.6);
  for (const [x, y, l] of [[3, 24, 3], [12, 24, 4], [5, 14, 2], [10, 14, 2], [8, 14, 3]]) for (let j = 0; j < l; j++) P.put(x, y + j, RP.gelo, 5.6 - j * 0.8);
  P.blob(3, 34, 3, 2, RP.neve, s + 2, 4); P.blob(13, 34.5, 2.6, 1.6, RP.neve, s + 3, 4);
  return P.done();
}
function tusks() {   // 36 x 22: two great curved mammoth tusks rising out of a snow drift
  const P = painter(36, 22), s = 7461;
  // each tusk sweeps up out of the snow, curls forward and its point turns back down
  const tusk = (bx, R, th, s2) => {
    for (let k = 0; k <= 60; k++) {
      const t = k / 60, a = t * Math.PI * 0.66, x = bx + R * (1 - Math.cos(a)), y = 19 - R * 1.5 * Math.sin(a), w = th * (1 - t * 0.8) + 0.4;
      const nx = Math.sin(a), ny = Math.cos(a) * 1.5, nl = Math.hypot(nx, ny);   // across the tusk
      for (let j = -w; j <= w; j += 0.5) P.put(x + nx / nl * j * -1, y + ny / nl * j * -1, RP.marfim, 4.4 + j / w * 1.3 + (k % 9 === 0 ? -0.7 : 0) + cg(k, j * 2, s2) * 0.35 - t * 0.3);
    }
  };
  tusk(6, 9, 2.4, s); tusk(19, 8, 2.1, s + 5);
  for (let x = 0; x < 36; x++) { const top = 16 + Math.sin(x * 0.3) * 1.4 + Math.abs(x - 18) * 0.12; for (let y = Math.floor(top); y < 22; y++) P.put(x, y, RP.neve, 4.8 - (y - top) * 0.3 + cg(x, y, s + 1) * 0.5 + (y - top < 1 ? 1 : 0)); }
  return P.done();
}
function mammoth() {   // 58 x 30: a whole mammoth skeleton half in the snow: spine, a cage of ribs, the skull with its tusks
  const P = painter(58, 30), s = 7481, O = RP.osso;
  for (let i = 0; i < 18; i++) { const x = 8 + i * 2.2, y = 6 + Math.sin(i / 17 * Math.PI) * -3 + 3; P.blob(x, y, 1.1, 1.5, O, s + i, 4); P.put(x, y - 2.2, O, 3.6); }   // spine with spikes
  for (let i = 0; i < 9; i++) { const x0 = 12 + i * 3.4, y0 = 7 - Math.sin((i + 2) / 13 * Math.PI) * 1.5; P.line(x0, y0, x0 - 3 + i * 0.2, y0 + 9, O, 4.2 - i * 0.05); P.line(x0 - 3 + i * 0.2, y0 + 9, x0 - 1 + i * 0.3, y0 + 16, O, 3.6); }   // ribs
  P.blob(49, 11, 6, 5.4, O, s + 50, 3.8); P.put(51, 10, RP.sombra, 1); P.put(52, 10, RP.sombra, 1); P.blob(51.5, 10.5, 1.4, 1.2, RP.sombra, s, 2);   // the skull, its eye
  P.blob(53, 15, 3, 2.4, O, s + 51, 3.4);
  for (let k = 0; k < 30; k++) { const t = k / 30, x = 54 + Math.sin(t * 2.4) * 4, y = 16 + t * 10 - Math.sin(t * 3) * 6; P.put(x, y, RP.marfim, 4.6 - t); P.put(x + 1, y, RP.marfim, 3.4 - t); }   // a tusk curling down
  P.line(6, 8, 2, 14, O, 3.6); P.line(2, 14, 1, 20, O, 3.2);   // the tail end, a hind leg bone
  P.line(42, 14, 44, 24, O, 4); P.line(16, 14, 14, 24, O, 4);
  for (let x = 0; x < 58; x++) { const top = 22 + Math.sin(x * 0.2) * 1.8 + Math.sin(x * 0.07) * 1.4; for (let y = Math.floor(top); y < 30; y++) P.put(x, y, RP.neve, 4.8 - (y - top) * 0.3 + cg(x, y, s + 9) * 0.5 + (y - top < 1 ? 1 : 0)); }
  return P.done();
}
function deadFire() {   // 28 x 12: the yetis' fire: a ring of stones, ash, charred bones, one ember that will not die
  const P = painter(28, 12), s = 7501;
  P.blob(14, 9.5, 9, 2.4, RP.cinza, s, 2.6);                                         // the ash bed
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, x = 14 + Math.cos(a) * 10.5, y = 9 + Math.sin(a) * 2.2; P.blob(x, y, 2.2, 1.8, RP.rocha, s + k, 3.4); P.put(x - 0.5, y - 1.6, RP.neve, 5.4); }   // stones, snow on each
  P.line(9, 8, 18, 6, RP.carvao, 3.2, 2); P.line(12, 6, 20, 9, RP.carvao, 2.6, 2);    // charred logs
  P.line(16, 7, 22, 4, RP.osso, 4.6); P.put(22, 3, RP.osso, 5); P.put(23, 4, RP.osso, 5);   // a gnawed bone in the ashes
  P.blob(13.5, 8.5, 1.6, 1.1, RP.brasa, s + 20, 4.4); P.put(14, 8, RP.brasa, 6);       // the ember
  return P.done();
}
function snowDrift() {   // 36 x 14: a long drift of snow blown into a wave, its crest curling over
  const P = painter(36, 14), s = 7521;
  for (let x = 0; x < 36; x++) { const top = 13 - Math.sin(Math.min(1, x / 26) * Math.PI * 0.62) * 11 + (x > 26 ? (x - 26) * 1.1 : 0); for (let y = Math.max(0, Math.floor(top)); y < 14; y++) P.put(x, y, RP.neve, 5 - (y - top) * 0.25 - x * 0.02 + cg(x, y, s) * 0.4 + (y - top < 1 ? 1.2 : 0) + ((y * 3 + x) % 11 === 0 ? -0.8 : 0)); }
  for (let x = 20; x < 27; x++) P.put(x, 1 + Math.round((x - 20) * 0.35), RP.neve, 6);   // the curling crest
  return P.done();
}
function frozenBoulder() {   // 24 x 15: a block of frozen rock, its top heaped with snow, its side glazed
  const P = painter(24, 15), s = 7541;
  P.blob(11.5, 8.5, 10.5, 6.6, RP.rocha, s, 3.2);
  for (let y = 0; y < 15; y++) for (let x = 0; x < 24; x++) if (P.has(x, y) && Math.abs(cn(x, y, 10, 10, s + 1)) < 0.03) P.put(x, y, RP.gelo, 4.8);   // ice in the cracks
  for (let x = 2; x < 22; x++) for (let y = 1; y < 6; y++) if (P.has(x, y) && !P.has(x, y - 2)) P.put(x, y, RP.neve, 5.2 + cg(x, y, s) * 0.6);   // snow on top
  P.blob(21, 12.5, 3, 2.4, RP.neve, s + 3, 3.6);
  for (let x = 0; x < 24; x++) if (P.has(x, 14)) P.put(x, 14, RP.rocha, 1.3);
  return P.done();
}
function bigIceStalagmite(k) {   // 16 x 36 or 12 x 24: a clear ice spike with a smaller one leaning on it
  const w = k ? 12 : 16, h = k ? 24 : 36, P = painter(w, h), s = 7561 + k * 7;
  cone(P, w * 0.42, h - 1, w * 0.62, h - 1, false, RP.gelo, s);
  cone(P, w * 0.8, h - 1, w * 0.34, h * 0.45, false, RP.gelo, s + 3, 3);
  for (let x = 0; x < w; x++) P.put(x, h - 1, RP.neve, 3.8 + cg(x, 0, s) * 0.6);
  return P.done();
}
function crystalGeode() {   // 26 x 22: a crown of long glowing ice crystals bursting from a lump of black ice
  const P = painter(26, 22), s = 7581;
  P.blob(13, 18, 12, 4.4, RP.negro, s, 3);
  const pts = [[4, 18, -0.85, 7], [7, 18, -0.45, 12], [10, 19, -0.15, 16], [13.5, 19, 0.04, 19], [17, 19, 0.28, 14], [20, 18, 0.55, 10], [22.5, 18, 0.9, 6], [11, 20, -0.95, 4], [16, 20, 1.1, 4]];
  for (const [bx, by, ang, len] of pts) {
    const ux = Math.sin(ang), uy = -Math.cos(ang), wd = len > 10 ? 2.2 : 1.6;
    for (let y = 0; y < 22; y++) for (let x = 0; x < 26; x++) {
      const px = x + 0.5 - bx, py = y + 0.5 - by, al = px * ux + py * uy, pe = px * -uy + py * ux; if (al < 0 || al > len) continue;
      const ww = wd * Math.min(1, (len - al) / 2.6); if (Math.abs(pe) > ww) continue;
      P.put(x, y, RP.cristal, (pe < -ww * 0.3 ? 5 : pe > ww * 0.3 ? 2.6 : 6) - (al < 1.5 ? 1.6 : 0) + (al > len - 1.5 ? 0.5 : 0));
    }
  }
  for (let x = 0; x < 26; x++) if (P.has(x, 21)) P.put(x, 21, RP.negro, 1.2);
  return P.done();
}
function runeAltar() {   // 30 x 24: an old standing stone from before the cathedral, cut with runes that glow cold, crusted in ice
  const P = painter(30, 24), s = 7601;
  P.box(2, 19, 26, 5, RP.rocha, s, 3);                                                          // the step
  P.rect(9, 3, 12, 17, RP.rocha, (i, j) => 3.4 - i * 0.12 + (j === 0 ? 1.4 : 0) + cg(i, j, s) * 0.5 + cn(i, j, 6, 6, s) * 0.8);   // the stone
  for (let x = 10; x < 20; x++) P.put(x, 2 - (Math.abs(x - 15) < 3 ? 1 : 0), RP.rocha, 4.4);   // its rounded top
  const runes = [[11, 6, '|/'], [15, 6, '<|'], [11, 11, 'X'], [16, 11, '|>'], [13, 15, 'Y']];
  for (const [x, y, g] of runes) { for (let j = 0; j < 4; j++) P.put(x, y + j, RP.runa, 5 - j * 0.2); if (g.includes('/')) P.put(x + 1, y + 1, RP.runa, 5); if (g.includes('<') || g.includes('X')) { P.put(x + 1, y + 1, RP.runa, 4.6); P.put(x + 2, y, RP.runa, 4.4); } if (g.includes('>') || g.includes('X')) { P.put(x + 1, y + 2, RP.runa, 4.6); P.put(x + 2, y + 3, RP.runa, 4.4); } if (g === 'Y') { P.put(x - 1, y - 1, RP.runa, 4.6); P.put(x + 1, y - 1, RP.runa, 4.6); } }
  for (let y = 0; y < 24; y++) for (let x = 0; x < 30; x++) if (P.has(x, y) && !P.has(x, y - 1)) P.put(x, y, RP.gelo, 5.4);
  for (const [x, y, l] of [[9, 4, 4], [20, 6, 5], [3, 20, 2], [27, 20, 3]]) for (let j = 0; j < l; j++) P.put(x, y + j, RP.gelo, 5.6 - j * 0.7);
  P.blob(5, 18, 3, 1.8, RP.neve, s + 1, 4); P.blob(24, 18.5, 3.4, 1.6, RP.neve, s + 2, 4);
  return P.done();
}

/* =============================== CEILING =============================== */
function icicleCluster(k) {   // 22 x 34 or 14 x 22: a fringe of great icicles from the roof, the longest dripping
  const w = k ? 14 : 22, h = k ? 22 : 34, P = painter(w, h), s = 7621 + k * 3;
  for (let x = 0; x < w; x++) { P.put(x, 0, RP.neve, 4 + cg(x, 0, s)); P.put(x, 1, RP.gelo, 4.4 + cg(x, 1, s)); }
  const n = k ? 4 : 6;
  for (let i = 0; i < n; i++) { const cx = (i + 0.5) * w / n + (hash2(i, 0, s) - 0.5) * 1.5, len = (0.35 + hash2(i, 1, s) * 0.65) * (h - 2); cone(P, cx, 1, w / n * 1.15, len, true, RP.gelo, s + i); }
  return P.done();
}
function hangingCrystal() {   // 18 x 26: a great glowing crystal hanging point down from a crust of black ice
  const P = painter(18, 26), s = 7641;
  P.blob(9, 2, 8.4, 3, RP.negro, s, 3);
  const pts = [[9, 3, Math.PI, 22], [5, 3, Math.PI - 0.35, 12], [13, 3, Math.PI + 0.3, 14], [3, 2, Math.PI - 0.8, 6], [15.5, 2, Math.PI + 0.75, 6]];
  for (const [bx, by, ang, len] of pts) {
    const ux = Math.sin(ang), uy = -Math.cos(ang), wd = len > 12 ? 2.6 : 1.6;
    for (let y = 0; y < 26; y++) for (let x = 0; x < 18; x++) {
      const px = x + 0.5 - bx, py = y + 0.5 - by, al = px * ux + py * uy, pe = px * -uy + py * ux; if (al < 0 || al > len) continue;
      const ww = wd * Math.min(1, (len - al) / 3); if (Math.abs(pe) > ww) continue;
      P.put(x, y, RP.cristal, (pe > ww * 0.3 ? 5 : pe < -ww * 0.3 ? 2.6 : 6) - (al < 1.5 ? 1.4 : 0));
    }
  }
  return P.done();
}
function frozenRoots() {   // 26 x 22: the last roots from the world above, hanging stiff and white with frost
  const P = painter(26, 22), s = 7661;
  for (let x = 0; x < 26; x++) for (let y = 0; y < 2; y++) P.put(x, y, RP.rocha, 2.6 + cg(x, y, s) * 0.8 - y);
  for (let k = 0; k < 8; k++) {
    let x = 1.5 + k * 3.1 + hash2(k, 0, s) * 1.5; const len = 7 + hash2(k, 1, s) * 14, th = k % 4 === 0 ? 2 : 1;
    for (let y = 1; y < len; y++) { x += Math.sin(y * 0.4 + k) * 0.25; for (let i = 0; i < th; i++) P.put(x + i, y, hash2(Math.round(x) + i, y, s + k) < 0.3 ? RP.neve : RP.madeira, 4.4 - i * 1.4 - y / len); }
    for (let j = 0; j < 3; j++) P.put(x, len + j, RP.gelo, 5.4 - j);   // an icicle off its tip
  }
  return P.done();
}

/* =============================== BACK WALL =============================== */
function frozenFall() {   // 32 x 58: a waterfall frozen in mid-fall: smooth columns of ice, a lip of rock, a heap where it splashed
  const P = painter(32, 58), s = 7681;
  for (let x = 2; x < 30; x++) for (let y = 0; y < 4; y++) P.put(x, y, RP.rocha, 3 - y * 0.4 + cg(x, y, s) * 0.6);
  for (let y = 3; y < 52; y++) {
    const spread = 7 + y * 0.12, cx = 16 + Math.sin(y * 0.05) * 1.4;
    for (let x = 0; x < 32; x++) {
      const dx = x + 0.5 - cx; if (Math.abs(dx) > spread) continue;
      const col = Math.sin((dx + cn(x, y, 3, 30, s) * 4) * 1.1);
      let v = 3.4 + col * 1.2 - Math.abs(dx) / spread * 1.1 + cg(x, y, s) * 0.3 + (y % 9 === 0 ? 0.5 : 0);
      if (Math.abs(dx) > spread - 1.2 && (y * 5 + x) % 7 < 3) continue;
      P.put(x, y, Math.abs(dx) < spread * 0.45 ? RP.azul : RP.gelo, v);
    }
  }
  for (let x = 0; x < 32; x++) { const top = 50 + Math.abs(x - 16) * 0.35 - Math.sin(x * 0.7) * 1.2; for (let y = Math.floor(top); y < 58; y++) P.put(x, y, RP.gelo, 4.6 - (y - top) * 0.3 + cg(x, y, s + 1) * 0.6 + ((x + y) % 5 === 0 ? 0.8 : 0)); }
  return P.done(false);
}
function iceSeam() {   // 30 x 18: a seam of glowing blue ice in the rock face
  const P = painter(30, 18), s = 7701;
  for (let x = 0; x < 30; x++) { const cy = 9 + Math.sin(x * 0.2 + 2) * 3, th = 2.4 + Math.sin(x * 0.45) * 0.8; for (let y = Math.floor(cy - th - 1.5); y <= cy + th + 1.5; y++) P.put(x, y, RP.rocha, 2.6 + cg(x, y, s) * 0.8 - Math.abs(y - cy) * 0.2); for (let y = Math.floor(cy - th); y <= cy + th; y++) P.put(x, y, RP.cristal, 3.4 + cg(x, y, s + 1) * 1.4 + (y < cy ? 1.2 : -0.6)); }
  for (const x of [4, 9, 14, 19, 24, 27]) { const cy = 9 + Math.sin(x * 0.2 + 2) * 3; P.put(x, cy, RP.cristal, 6); P.put(x + 1, cy - 1, RP.cristal, 6); }
  return P.done(false);
}
function beastInIce() {   // 38 x 26: a great clawed beast caught in the wall's ice, seen dark through it
  const P = painter(38, 26), s = 7721, B = RP.sombra;
  P.blob(19, 14, 12, 7, B, s, 4);                                                  // body
  P.blob(32, 9, 5, 4.4, B, s + 1, 4.4); P.put(34, 8, RP.cristal, 5); P.put(35, 8, RP.cristal, 4);   // head, a pale eye
  for (const [x, y] of [[30, 13], [33, 12], [35, 13]]) P.line(x, y, x + 1, y + 3, RP.osso, 3.6);   // teeth
  for (const [hx, fx] of [[11, 7], [16, 15], [24, 26], [28, 31]]) { P.line(hx, 18, fx, 24, B, 4.4); P.line(fx, 24, fx + 2, 25, RP.osso, 4); }   // legs, claws
  P.line(7, 12, 1, 6, B, 4); P.line(1, 6, 3, 2, B, 3.6);                         // tail
  for (let y = 0; y < 26; y++) for (let x = 0; x < 38; x++) {
    const inner = Math.hypot((x - 19) / 19, (y - 13) / 13); if (inner > 1) continue;
    if (!P.has(x, y)) P.put(x, y, RP.azul, 2.6 + cn(x, y, 14, 14, s) * 1.4 + (1 - inner) * 0.8);
    else if (hash2(x, y, s + 2) < 0.08) P.put(x, y, RP.gelo, 4.6);
    if (((x + y * 0.6) % 13) < 1) P.put(x, y, RP.gelo, 5.6);
  }
  return P.done(false);
}
function giantInIce() {   // 44 x 64: the silhouette of a giant standing inside the wall, arms at its sides, head bowed
  const P = painter(44, 64), s = 7741, G = RP.negro;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 44; x++) {   // the column of clear ice it stands in
    const half = 17 + Math.sin(y * 0.11) * 2 + (y > 56 ? (y - 56) * 0.6 : 0), dx = x + 0.5 - 22; if (Math.abs(dx) > half) continue;
    if ((y * 7 + x * 3) % 11 < 2 && Math.abs(dx) > half - 1.5) continue;
    P.put(x, y, RP.azul, 2.4 + cn(x, y, 20, 40, s) * 1.6 - Math.abs(dx) / half * 0.8 + cg(x, y, s) * 0.2 + (Math.abs(x + y * 0.5 - 18) < 0.8 && y < 40 || Math.abs(x + y * 0.5 - 23) < 0.5 && y < 26 ? 2.6 : 0));
  }
  const fig = (x, y, v) => P.put(x, y, G, v);
  for (let y = 10; y < 15; y++) for (let x = 18; x < 27; x++) if (Math.hypot((x - 22.5) / 4.5, (y - 12.5) / 3) < 1) fig(x, y, 3);   // head, bowed
  for (let y = 15; y < 38; y++) { const half = 9 - Math.abs(y - 22) * 0.12; for (let x = Math.floor(22.5 - half); x < 22.5 + half; x++) fig(x, y, 2.6 + (x < 22 ? 0.4 : 0)); }   // chest
  for (let y = 16; y < 44; y++) { fig(12 - (y - 16) * 0.08, y, 2.6); fig(13 - (y - 16) * 0.08, y, 2.8); fig(32 + (y - 16) * 0.08, y, 2.4); fig(33 + (y - 16) * 0.08, y, 2.2); }   // arms
  for (let y = 38; y < 60; y++) { for (let x = 16; x < 21; x++) fig(x, y, 2.6); for (let x = 24; x < 29; x++) fig(x, y, 2.4); }   // legs
  P.put(20, 13, RP.cristal, 4); P.put(24, 13, RP.cristal, 4);   // two faint eyes
  for (let x = 0; x < 44; x++) for (let y = 61; y < 64; y++) P.put(x, y, RP.neve, 3.4 + cg(x, y, s + 1) * 0.6);
  return P.done(false);
}
function clawMarks() {   // 22 x 18: four deep gouges raked down the rock by a yeti marking its den
  const P = painter(22, 18), s = 7761;
  for (let k = 0; k < 4; k++) { const x0 = 3 + k * 4.4, x1 = x0 + 3; for (let j = 0; j < 16; j++) { const t = j / 15, x = x0 + (x1 - x0) * t + Math.sin(t * 3) * 0.6, w = Math.sin(t * Math.PI) * 1.4 + 0.3; for (let i = -1; i <= Math.ceil(w); i++) P.put(x + i, 1 + j, RP.rocha, i < 0 ? 4.6 : i === 0 ? 0.6 : 1.4); } }
  return P.done(false);
}
function yetiPainting() {   // 40 x 20: smeared in soot and ochre: big shaggy figures hunting a mammoth, a sun, hand prints
  const P = painter(40, 20), s = 7781, fade = (x, y) => hash2(x | 0, y | 0, s) < 0.2;
  const dot = (x, y, R, v) => { if (!fade(x, y)) P.put(x, y, R, v + cg(x, y, s) * 0.5); };
  for (let x = 20; x < 34; x++) for (let y = 6; y < 13; y++) if (Math.hypot((x - 27) / 7, (y - 9.5) / 3.6) < 1) dot(x, y, RP.ocre, 3.6);   // the mammoth
  for (const lx of [22, 24, 30, 32]) for (let y = 12; y < 16; y++) dot(lx, y, RP.ocre, 3.4);
  for (let k = 0; k < 7; k++) dot(34 + Math.sin(k * 0.5) * 1.5, 8 + k, RP.ocre, 3.6);   // trunk
  for (let k = 0; k < 5; k++) dot(33 - k * 0.4, 12 + k * 0.6, RP.carvao, 4.2);          // tusk
  const yeti = (x, y) => { for (let j = 0; j < 8; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) < 2.6 - Math.abs(j - 3) * 0.2) dot(x + i, y + j, RP.carvao, 3.6); dot(x - 3, y + 2, RP.carvao, 3.4); dot(x + 3, y + 1, RP.carvao, 3.4); dot(x + 4, y, RP.carvao, 3.4); dot(x - 1, y + 8, RP.carvao, 3.4); dot(x + 1, y + 8, RP.carvao, 3.4); };
  yeti(8, 7); yeti(14, 6);
  for (let a = 0; a < 6.3; a += 0.5) dot(4 + Math.cos(a) * 2.4, 3 + Math.sin(a) * 2.4, RP.ocre, 4); dot(4, 3, RP.ocre, 4.6);   // the sun
  for (let x = 2; x < 38; x += 2) dot(x, 17.5, RP.ocre, 3);
  for (const [hx, hy] of [[37, 3]]) { for (let a = 0; a < 6.2; a += 0.7) dot(hx + Math.cos(a) * 1.8, hy + Math.sin(a) * 1.8, RP.carvao, 4); dot(hx, hy, RP.carvao, 4.4); }
  return P.done(false);
}

/* =============================== THE THRONE (74) =============================== */
function iceThrone() {   // 48 x 44: the Yeti Ancestral's seat: a dais of ice blocks, a slab back crowned with crystals, skulls on the arms, a white pelt
  const P = painter(48, 44), s = 7480;
  // crystals rising behind the back, the middle ones tallest
  for (const [cx, len, w] of [[13, 13, 4], [18, 19, 5], [24, 24, 6], [30, 19, 5], [35, 13, 4]]) cone(P, cx, 13, w, len, false, RP.cristal, s + cx, 3.6);
  P.box(14, 8, 20, 18, RP.gelo, s + 1, 3.4);                                             // the slab of the back
  for (let y = 10; y < 24; y += 4) P.line(16, y, 31, y + 1, RP.gelo, 2.4);                // its layers
  P.box(10, 24, 28, 9, RP.azul, s + 2, 3.6);                                             // the seat
  P.rect(12, 23, 24, 3, RP.neve, (i, j) => 4.6 - j * 0.8 + cg(i, j, s) * 0.6);            // the pelt over it...
  for (let k = 0; k < 12; k++) { const x = 13 + k * 2, len = 4 + (hash2(k, 1, s) * 4 | 0); for (let j = 0; j < len; j++) P.put(x + (j > 2 ? (k % 2 ? 1 : -1) * 0 : 0), 26 + j, RP.neve, 4.2 - j * 0.35 + cg(x, j, s) * 0.5); }   // ...hanging over the front in tufts
  for (const ax of [5, 37]) { P.box(ax, 19, 6, 14, RP.gelo, s + ax, 3.2); P.blob(ax + 3, 17, 3, 2.8, RP.osso, s + ax + 1, 4); P.put(ax + 2, 17, RP.sombra, 1); P.put(ax + 4, 17, RP.sombra, 1); P.rect(ax + 2, 19, 3, 1, RP.osso, (i) => i === 1 ? 2 : 4); }   // the arms, a skull on each
  P.box(6, 33, 36, 5, RP.gelo, s + 3, 3.8); P.box(1, 38, 46, 6, RP.gelo, s + 4, 3.4);   // the two steps of the dais
  for (let x = 2; x < 46; x += 5) P.line(x, 38, x + 1, 43, RP.gelo, 2.2);                 // cracks between the blocks
  for (const [x0, y0, x1, y1] of [[3, 37, 10, 36], [36, 37, 44, 35], [20, 32, 27, 32]]) P.line(x0, y0, x1, y1, RP.osso, 4.6, 2);   // gnawed bones
  P.blob(41, 35.5, 2.2, 1.8, RP.osso, s + 5, 4.2); P.put(40, 35, RP.sombra, 1);          // a skull rolled off
  return P.done();
}

/* =============================== register =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes, gelo: true }, extra || {}));
const ALL = ['fendas', 'saloes', 'covis', 'coracao'];
// floor
def('ic_explorador', 'Explorador congelado', F, 'frente', ['fendas', 'saloes'], [frozenExplorer()]);
def('ic_tumba', 'Tumba congelada', F, 'frente', ['fendas'], [frozenTomb()]);
def('ic_estatua', 'Estátua congelada', F, 'frente', ['fendas'], [frozenStatue()]);
def('ic_presas', 'Presas de mamute', F, 'frente', ['covis'], [tusks()]);
def('ic_mamute', 'Ossada de mamute', F, 'frente', ['covis'], [mammoth()]);
def('ic_fogueira', 'Fogueira apagada dos yetis', F, 'frente', ['covis'], [deadFire()], { luz: [{ x: 14, y: 8, r: 0.35 }], brilho: '#ff8a3a' });
def('ic_monte', 'Monte de neve', F, 'frente', ['fendas', 'covis'], [snowDrift()]);
def('ic_pedregulho', 'Pedregulho gelado', F, 'frente', ALL, [frozenBoulder()]);
def('ic_estalagmite', 'Estalagmite de gelo', F, 'frente', ['saloes', 'coracao'], [bigIceStalagmite(0), bigIceStalagmite(1)]);
def('ic_drusa', 'Drusa de cristal de gelo', F, 'frente', ['saloes', 'coracao'], [crystalGeode()], { luz: [{ x: 13, y: 9, r: 0.8 }], brilho: '#6ad0f4' });
def('ic_altar', 'Altar de gelo', F, 'frente', ['coracao'], [runeAltar()], { luz: [{ x: 15, y: 10, r: 0.6 }], brilho: '#5ad8dc' });
// ceiling
def('ic_sincelos', 'Sincelos grandes', C, 'frente', ALL, [icicleCluster(0), icicleCluster(1)]);
def('ic_cristal_teto', 'Cristal pendente', C, 'frente', ['coracao'], [hangingCrystal()], { luz: [{ x: 9, y: 14, r: 0.75 }], brilho: '#6ad0f4' });
def('ic_raizes', 'Raízes congeladas', C, 'frente', ['fendas'], [frozenRoots()]);
// back wall
def('ic_cachoeira', 'Cachoeira congelada', W, 'fundo', ['saloes'], [frozenFall()], { luz: [{ x: 16, y: 30, r: 0.45 }], brilho: '#4aa0e0' });
def('ic_veio', 'Veio de gelo azul', W, 'fundo', ['saloes', 'coracao'], [iceSeam()], { luz: [{ x: 15, y: 9, r: 0.55 }], brilho: '#6ad0f4' });
def('ic_fera', 'Fera presa no gelo', W, 'fundo', ['covis', 'coracao'], [beastInIce()]);
def('ic_gigante', 'Gigante preso no gelo', W, 'fundo', ['coracao'], [giantInIce()]);
def('ic_garras', 'Marcas de garra', W, 'fundo', ['covis'], [clawMarks()]);
def('ic_pintura', 'Pintura dos yetis', W, 'fundo', ['covis'], [yetiPainting()]);
// the boss hall (74 places it)
def('ic_trono', 'Trono de Gelo', F, 'fundo', [], [iceThrone()], { luz: [{ x: 24, y: 6, r: 0.9 }], brilho: '#6ad0f4' });

// what each band gets, per open stretch of floor or ceiling: [id, chance per 10 blocks, max per stretch]
Object.assign(IC_PROP_PLAN, {
  fendas: { chao: [['ic_tumba', 0.18, 1], ['ic_estatua', 0.12, 1], ['ic_explorador', 0.06, 1], ['ic_pedregulho', 0.25, 1], ['ic_monte', 0.2, 1]], teto: [['ic_sincelos', 0.45, 2], ['ic_raizes', 0.25, 1]], fundo: [['ic_garras', 0.03, 1]] },
  saloes: { chao: [['ic_estalagmite', 0.45, 2], ['ic_drusa', 0.12, 1], ['ic_pedregulho', 0.2, 1], ['ic_explorador', 0.05, 1]], teto: [['ic_sincelos', 0.7, 3]], fundo: [['ic_cachoeira', 0.12, 1], ['ic_veio', 0.14, 1]] },
  covis: { chao: [['ic_presas', 0.18, 1], ['ic_mamute', 0.1, 1], ['ic_fogueira', 0.15, 1], ['ic_monte', 0.3, 1], ['ic_pedregulho', 0.15, 1]], teto: [['ic_sincelos', 0.4, 2]], fundo: [['ic_garras', 0.18, 1], ['ic_pintura', 0.08, 1], ['ic_fera', 0.05, 1]] },
  coracao: { chao: [['ic_drusa', 0.25, 1], ['ic_estalagmite', 0.3, 2], ['ic_altar', 0.06, 1], ['ic_pedregulho', 0.15, 1]], teto: [['ic_cristal_teto', 0.25, 1], ['ic_sincelos', 0.45, 2]], fundo: [['ic_gigante', 0.06, 1], ['ic_fera', 0.08, 1], ['ic_veio', 0.15, 1]] }
});
}
