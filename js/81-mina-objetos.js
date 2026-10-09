'use strict';

/* ================= the abandoned mine: props =================
   Everything bigger than a block that dresses the mine. On the floor: ore carts on the rails (full, and one
   tipped over with its load spilled), a wooden winch with its crank, crates, powder kegs, a rotten bunk, a table
   with a lantern and a mine map, an old anvil and bellows, heaps of ore, a wheelbarrow, a miner's skeleton still
   in his helmet; the goblins' things: hide tents, a pile of stolen loot, their cooking fire, a broken giant gear;
   down in the furnaces the great brick smelters with a glowing mouth and crucibles of metal that never set.
   From the roof: a pulley with rope and bucket, big hanging lanterns, a goblin cage, their rag banners. On the
   back wall: the elevator frame of a shaft, gallery signs, tools on a rack, a scratched map, the goblins'
   paintings of their dynamite, an exposed seam of gold. And the Rei Goblin's throne for 85. Same 7-tone ramps lit
   from the top left and dark rim as 71-gelo-objetos; registered with defProp (`mina: true`), placed by
   84-mina-mundo (MN_PROP_PLAN). Carts (`trilho: true`) only stand on rails. */
const MN_PROP_PLAN = {};
// back-wall pieces that stand on the floor instead of hanging at eye height
const MN_BACK_FLOOR = { mn_elevador: 1 };
{
const { cg, cn } = MNART;
const R7 = hexes => hexes.map(h => ph(h));
const RP = {
  madeira: R7(['#140b05', '#26160a', '#3c2412', '#56361c', '#724a28', '#8e6036', '#aa7a48']),
  velha: R7(['#100b08', '#1c140e', '#2c2016', '#3e2e20', '#52402c', '#66523a', '#7c6648']),
  ferro: R7(['#0e0e11', '#1c1c21', '#2e2f36', '#44464f', '#5e616c', '#7c808c', '#a2a6b2']),
  ferrugem: R7(['#1e0c06', '#36160a', '#54220e', '#723214', '#90461e', '#ac602c', '#c47c40']),
  latao: R7(['#2a1a06', '#4a300c', '#6e4a14', '#966820', '#bc8a30', '#dcae4a', '#f4d27a']),
  ouro: R7(['#3a2404', '#6a4a0c', '#a87808', '#d8a420', '#f0c43a', '#fce07a', '#fff6c8']),
  minerio: R7(['#140c0b', '#271614', '#3e211c', '#593026', '#764233', '#925845', '#ae7058']),
  pedra: R7(['#18171a', '#29282c', '#3e3d42', '#55545a', '#6e6d73', '#88878d', '#a4a3a8']),
  carvao: R7(['#060608', '#0c0c0f', '#141418', '#1c1c22', '#26262d', '#32323a', '#42424c']),
  couro: R7(['#160e08', '#28190e', '#3c2716', '#523720', '#6a4a2c', '#82603a', '#9a784c']),
  pele: R7(['#1c1610', '#30261a', '#463826', '#5e4c34', '#786244', '#927a56', '#ae946c']),
  pano: R7(['#1a0e0c', '#2e1814', '#48241c', '#643024', '#7e402e', '#985238', '#b0664a']),
  panoVerde: R7(['#0e1408', '#18220e', '#243216', '#32441e', '#425828', '#546c34', '#6a8244']),
  osso: R7(['#2a2620', '#46403a', '#665e54', '#8a8072', '#aea290', '#cec2ae', '#ece2cc']),
  corda: R7(['#1e160c', '#33261a', '#4c3a26', '#665034', '#806844', '#9a8058', '#b49a70']),
  papel: R7(['#2c261a', '#4a4030', '#6a5e48', '#8c7e64', '#ac9e80', '#c8bc9c', '#e2d8bc']),
  tijolo: R7(['#170a08', '#2f1410', '#4a1f17', '#662a1f', '#82392a', '#9c4d39', '#b4644c']),
  fogo: R7(['#3a0c02', '#6e1c04', '#a83a08', '#e06414', '#ff9a2a', '#ffd070', '#fff4c8']),
  escoria: R7(['#07080a', '#0f1114', '#181b20', '#22262d', '#2e333c', '#3c434e', '#4e5664']),
  vidro: R7(['#5a2004', '#8a3a08', '#c26014', '#f08a24', '#ffb04a', '#ffd88a', '#fff4d0']),
  goblin: R7(['#0e160a', '#1a2810', '#2a3c18', '#3c5222', '#506a2e', '#68843c', '#84a04e']),
  sombra: R7(['#030202', '#060404', '#0a0706', '#0e0a08', '#130e0b', '#18120e', '#1e1612'])
};
const OUTLINE = ph('#070504');

/* ---- the painter (same as 71's) ---- */
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
// a plank: grain along its length, lit top and left edge, a nail at each end
function plank(P, x0, y0, len, thick, R, s, vert = false, base = 3.4) {
  for (let a = 0; a < len; a++) for (let b = 0; b < thick; b++) {
    const x = vert ? x0 + b : x0 + a, y = vert ? y0 + a : y0 + b;
    let v = base + (b === 0 ? 1.1 : b === thick - 1 ? -1.1 : 0) + Math.sin(a * 0.45 + b * 1.9 + s) * 0.35 + cg(x, y, s) * 0.45;
    if (a === 0 || a === len - 1) v -= 0.6;
    P.put(x, y, R, v);
  }
  if (len > 5 && thick > 1) { const n = vert ? [[x0 + (thick >> 1), y0 + 1], [x0 + (thick >> 1), y0 + len - 2]] : [[x0 + 1, y0 + (thick >> 1)], [x0 + len - 2, y0 + (thick >> 1)]]; for (const [x, y] of n) P.put(x, y, RP.ferro, 4.6); }
}
// a lump of ore: rock with flecks of the metal
function oreLump(P, cx, cy, r, s, fleck = RP.ouro) {
  P.blob(cx, cy, r, r * 0.8, RP.minerio, s, 3.4);
  for (let k = 0; k < r * 1.6; k++) { const a = hash2(k, 1, s) * 6.28, d = hash2(k, 2, s) * r * 0.7; P.put(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, fleck, 4 + hash2(k, 3, s) * 2.5); }
}
// spoked wheel of iron
function wheel(P, cx, cy, r, s) {
  for (let a = 0; a < 6.3; a += 0.12) { P.put(cx + Math.cos(a) * r, cy + Math.sin(a) * r, RP.ferro, Math.sin(a) < 0 ? 4.4 : 2.6); P.put(cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1), RP.ferro, 3.2); }
  for (let k = 0; k < 4; k++) { const a = k * 0.785 + s; P.line(cx - Math.cos(a) * (r - 1), cy - Math.sin(a) * (r - 1), cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1), RP.ferro, 2.6); }
  P.put(cx, cy, RP.ferro, 5.4); P.put(cx - 1, cy, RP.ferro, 4);
}
// a goblin silhouette scrawled in soot (for their wall paintings)
const scrawl = (P, x, y, s, R = RP.carvao, v = 4.2) => { const d = (dx, dy) => { if (hash2(x + dx, y + dy, s) > 0.15) P.put(x + dx, y + dy, R, v); }; for (let j = 0; j < 4; j++) d(0, j + 2); d(-1, 3); d(1, 3); d(-1, 6); d(1, 6); d(0, 0); d(-1, 1); d(1, 1); d(-2, 0); d(2, 0); };

/* =============================== FLOOR =============================== */
function oreCart(full, s) {   // 26 x 20: an iron-banded wooden cart on four little wheels, heaped with ore
  const P = painter(26, 20);
  // the body: tapering box of planks, iron bands at the corners
  for (let y = 6; y < 15; y++) { const inset = Math.round((y - 6) * 0.25); for (let x = 2 + inset; x < 24 - inset; x++) { const row = (y - 6) % 3; P.put(x, y, RP.madeira, 3.2 + (row === 0 ? 0.9 : row === 2 ? -0.8 : 0) - (x - 2) * 0.03 + cg(x, y, s) * 0.5); } }
  for (const x of [2, 3, 22, 23]) for (let y = 6; y < 15; y++) P.put(x - (x > 12 ? Math.round((y - 6) * 0.25) : -Math.round((y - 6) * 0.25)), y, RP.ferro, x === 2 || x === 22 ? 4.2 : 2.6);
  for (let x = 1; x < 25; x++) { P.put(x, 5, RP.ferro, 4.8); P.put(x, 6, RP.ferro, 3); }   // the iron lip
  P.put(12, 10, RP.ferro, 4.4); P.put(13, 10, RP.ferro, 3); P.put(12, 11, RP.ferro, 2.6);   // a rivet plate
  for (let x = 4; x < 22; x++) P.put(x, 15, RP.ferro, 2.2);
  for (const wx of [7, 18]) { P.blob(wx, 17, 2.6, 2.6, RP.ferro, s + wx, 3); P.put(wx - 1, 16, RP.ferro, 5); P.put(wx, 17, RP.ferro, 1.4); }
  if (full) { for (let k = 0; k < 9; k++) oreLump(P, 4 + k * 2.2 + hash2(k, 0, s) * 1.5, 4 - Math.sin(k / 8 * Math.PI) * 2.6 + hash2(k, 1, s), 2.2 + hash2(k, 2, s) * 0.8, s + k * 7, k % 3 ? RP.ouro : RP.ferro); }
  return P.done();
}
function tippedCart() {   // 30 x 16: a cart on its side, its load spilled across the floor
  const P = painter(30, 16), s = 9021;
  for (let y = 1; y < 13; y++) for (let x = 3; x < 12; x++) { const row = (x - 3) % 3; P.put(x, y, RP.madeira, 3.2 + (row === 0 ? 0.9 : row === 2 ? -0.8 : 0) - y * 0.05 + cg(x, y, s) * 0.5); }
  for (let y = 0; y < 14; y++) { P.put(2, y, RP.ferro, 4.4); P.put(12, y, RP.ferro, 2.6); }
  for (const wy of [3, 10]) { P.blob(0.5, wy, 2, 2.4, RP.ferro, s + wy, 3); P.put(0, wy, RP.ferro, 1.2); }
  P.rect(3, 13, 9, 1, RP.ferro, () => 2.4);
  for (let row = 0; row < 3; row++) for (let k = 0; k < 8 - row * 3; k++) oreLump(P, 14 + row * 1.5 + k * 2 + hash2(k, row, s) * 1.2, 13.4 - row * 2.2 + hash2(k, row + 1, s) * 0.6, 1.5 + hash2(k, row + 2, s) * 0.9, s + k * 5 + row * 17, (k + row) % 2 ? RP.ouro : RP.ferro);
  return P.done();
}
function winch() {   // 32 x 30: a windlass on two A-frames, a drum wound with rope, a crank, the rope running down
  const P = painter(32, 30), s = 9041;
  for (const bx of [5, 25]) { P.line(bx - 4, 29, bx, 8, RP.madeira, (t, k) => 4 - k * 1.4, 2); P.line(bx + 4, 29, bx, 8, RP.madeira, (t, k) => 3 - k * 1.2, 2); P.line(bx - 2, 20, bx + 3, 20, RP.madeira, 2.8, 1); }
  for (let y = 9; y < 17; y++) for (let x = 6; x < 26; x++) { const ry = y - 9; P.put(x, y, ry === 0 || ry === 7 ? RP.madeira : RP.corda, ry === 0 || ry === 7 ? 3.2 : 4.2 - Math.abs(ry - 3) * 0.6 + ((x + ry) % 3 === 0 ? -1.2 : 0.4)); }   // the drum and its rope
  for (let x = 3; x < 29; x++) P.put(x, 12, RP.ferro, x < 6 || x > 25 ? 4.6 : 0);   // axle
  P.line(29, 12, 31, 7, RP.ferro, 4, 1); P.line(31, 7, 31, 4, RP.madeira, 4.6, 1);   // crank and handle
  for (let y = 17; y < 30; y++) P.put(16 + Math.sin(y * 0.6) * 0.4, y, RP.corda, 4.4 - (y % 3 === 0 ? 1.4 : 0));   // the rope going down
  P.box(13, 26, 7, 4, RP.ferro, s, 3);   // a hook block on the floor
  return P.done();
}
function crates() {   // 30 x 24: a stack of crates with a lid ajar, rope-tied, stencil marks
  const P = painter(30, 24), s = 9061;
  const crate = (x0, y0, w, h, ss) => {
    P.box(x0, y0, w, h, RP.madeira, ss, 3.2);
    for (let y = y0 + 3; y < y0 + h - 1; y += 3) P.line(x0 + 1, y, x0 + w - 2, y, RP.madeira, 2, 1);
    P.line(x0 + 1, y0 + 1, x0 + w - 2, y0 + h - 2, RP.madeira, 4.6, 1); P.line(x0 + 1, y0 + h - 2, x0 + w - 2, y0 + 1, RP.madeira, 2.6, 1);
    for (const [cx, cy] of [[x0, y0], [x0 + w - 1, y0], [x0, y0 + h - 1], [x0 + w - 1, y0 + h - 1]]) P.put(cx, cy, RP.ferro, 4.4);
  };
  crate(1, 11, 14, 13, s); crate(15, 13, 13, 11, s + 1); crate(6, 0, 12, 11, s + 2);
  for (let x = 6; x < 18; x++) P.put(x, 4, RP.corda, 4.6 - (x % 2) * 1.2);
  P.rect(3, 15, 3, 3, RP.pano, (i, j) => (i + j) % 2 ? 4.2 : null);   // a red mark
  return P.done();
}
function powderKegs(two) {   // 14 x 18 or 26 x 18: kegs with iron hoops, a skull smeared on, a trail of black powder
  const P = painter(two ? 26 : 14, 18), s = two ? 9081 : 9082;
  const keg = (x0, ss) => {
    for (let y = 1; y < 17; y++) { const bulge = Math.sin((y - 1) / 15 * Math.PI) * 1.6; for (let x = Math.round(x0 + 1.5 - bulge); x <= Math.round(x0 + 10.5 + bulge); x++) { const u = (x - x0 + bulge) / (11 + bulge * 2); P.put(x, y, RP.madeira, 4.6 - u * 2.8 + ((x - x0) % 3 === 0 ? -0.6 : 0) + cg(x, y, ss) * 0.4); } }
    for (const hy of [3, 8, 14]) for (let x = x0; x < x0 + 13; x++) if (P.has(x, hy)) P.put(x, hy, RP.ferro, 4.4 - (x - x0) * 0.2);
    P.rect(x0 + 2, 0, 9, 1, RP.madeira, (i) => 4.8 - i * 0.2);
    const sx = x0 + 6; P.blob(sx, 10.5, 2.2, 1.8, RP.osso, ss, 4.4); P.put(sx - 1, 10, RP.carvao, 1); P.put(sx + 1, 10, RP.carvao, 1); P.put(sx, 12, RP.osso, 3.6);   // the skull
  };
  keg(0, s); if (two) keg(12, s + 1);
  for (let x = 0; x < P.w; x++) if (hash2(x, 0, s) < 0.5) P.put(x, 17, RP.carvao, 3);
  return P.done();
}
function bunk() {   // 32 x 26: a two-level bunk of rough timber, the straw ticks rotted, a blanket hanging off
  const P = painter(32, 26), s = 9101;
  for (const px of [1, 29]) plank(P, px, 0, 26, 2, RP.velha, s + px, true, 3.2);
  for (const by of [7, 19]) { plank(P, 1, by, 30, 2, RP.velha, s + by, false, 3.4); for (let x = 3; x < 29; x++) for (let y = by - 3; y < by; y++) if (cn(x, y, 40, 40, s + by) > -0.2) P.put(x, y, RP.pele, 3.2 + (y === by - 3 ? 0.9 : 0) + cg(x, y, s) * 0.8); }
  for (let y = 9; y < 17; y++) for (let x = 20; x < 27; x++) if (y < 14 + Math.sin(x) * 2) P.put(x, y, RP.pano, 3.6 - (x - 20) * 0.2 - (y - 9) * 0.1 + ((x + y) % 4 === 0 ? -0.8 : 0));   // the blanket
  P.blob(8, 16, 2, 1.2, RP.osso, s, 4);   // a bone under the top bunk
  return P.done();
}
function mapTable() {   // 28 x 18: a trestle table, a lantern burning on it, a mine map held down by a stone
  const P = painter(28, 18), s = 9121;
  plank(P, 0, 8, 28, 2, RP.madeira, s, false, 3.6);
  for (const lx of [3, 22]) { P.line(lx, 10, lx - 2, 17, RP.madeira, 3, 2); P.line(lx + 2, 10, lx + 4, 17, RP.madeira, 2.4, 2); }
  P.rect(11, 6, 12, 2, RP.papel, (i, j) => 4.6 - i * 0.08 + (i === 4 || i === 8 ? -1.4 : 0) + (j === 1 && i % 3 === 1 ? -1.6 : 0));   // the map
  P.blob(21, 6, 1.6, 1.2, RP.pedra, s, 3.6);
  // the lantern
  P.rect(3, 0, 6, 1, RP.ferro, (i) => 4 - i * 0.3); for (let y = 1; y < 6; y++) { P.put(3, y, RP.latao, 4.4); P.put(8, y, RP.latao, 2.6); for (let x = 4; x < 8; x++) P.put(x, y, RP.vidro, 6 - Math.hypot(x - 5.5, y - 3.2) * 1.2); }
  P.rect(2, 6, 8, 2, RP.latao, (i, j) => 4.6 - i * 0.3 - j);
  return P.done();
}
function anvil() {   // 30 x 18: an old anvil on a stump, a pair of leather bellows beside it, tongs
  const P = painter(30, 18), s = 9141;
  P.box(2, 10, 9, 8, RP.velha, s, 3); for (let y = 11; y < 17; y += 2) P.line(3, y, 9, y, RP.velha, 2.2, 1);   // the stump
  P.rect(0, 5, 14, 3, RP.ferro, (i, j) => 4.4 - j * 1 - (i > 11 ? 0.6 : 0) + cg(i, j, s) * 0.4); P.rect(0, 5, 3, 1, RP.ferro, () => 5.2);   // face and horn
  P.rect(4, 8, 6, 2, RP.ferro, (i) => 3 - i * 0.2);
  // the bellows: two boards, the leather folds, a nozzle
  for (let y = 9; y < 17; y++) { const half = 4 - Math.abs(y - 13) * 0.4; for (let x = 15; x < 27; x++) if (Math.abs(x - 21) < half + (x - 15) * 0.2) P.put(x, y, RP.couro, 3.6 + ((x + y) % 3 === 0 ? -1 : 0.3) - (y - 9) * 0.08); }
  P.line(15, 9, 27, 8, RP.madeira, 4.2, 1); P.line(15, 17, 27, 17, RP.madeira, 2.6, 1); P.line(27, 8, 29, 10, RP.ferro, 4, 1); P.line(14, 13, 12, 13, RP.ferro, 4.4, 1);
  P.line(1, 4, 9, 1, RP.ferro, 3.8, 1);   // tongs lying across the anvil
  return P.done();
}
function oreHeap(s) {   // 26 x 13: a heap of broken ore, gold glinting in it
  const P = painter(26, 13);
  for (let row = 0; row < 4; row++) { const half = 11 - row * 2.6, n = Math.ceil(half * 0.9); for (let k = 0; k < n; k++) { const x = 13 - half + (k + 0.5) / n * half * 2 + (hash2(k, row, s) - 0.5) * 1.4, y = 11.2 - row * 2.4 + (hash2(k, row + 9, s) - 0.5); oreLump(P, x, y, 1.7 + hash2(k, row + 4, s) * 0.9, s + k * 3 + row * 31, (k + row) % 3 === 0 ? RP.ouro : (k + row) % 3 === 1 ? RP.ferro : RP.minerio); } }
  return P.done();
}
function wheelbarrow() {   // 24 x 15: a wooden wheelbarrow, one handle broken
  const P = painter(24, 15), s = 9161;
  for (let y = 3; y < 10; y++) for (let x = 6 + (y - 3) * 0.6; x < 21 - (y - 3) * 0.3; x++) P.put(x, y, RP.madeira, 3.4 - (y - 3) * 0.2 + ((y - 3) % 3 === 0 ? 0.8 : 0) + cg(x, y, s) * 0.5);
  P.line(0, 5, 8, 8, RP.madeira, 4.2, 1); P.line(1, 12, 8, 9, RP.madeira, 2.8, 1); P.line(9, 10, 8, 14, RP.madeira, 3, 1);
  wheel(P, 20, 11, 3.5, 0.3);
  P.blob(13, 3, 4, 1.6, RP.pedra, s, 3.4);
  return P.done();
}
function minerSkeleton() {   // 26 x 14: a miner slumped against nothing, helmet still on, his pick beside him
  const P = painter(26, 14), s = 9181;
  P.blob(5, 6.5, 3, 2.6, RP.osso, s, 4); P.put(4, 6, RP.carvao, 1); P.put(6, 6, RP.carvao, 1); P.rect(4, 8, 3, 1, RP.osso, (i) => i === 1 ? 2 : 4.2);   // skull
  P.rect(2, 3, 7, 2, RP.latao, (i, j) => 4.6 - i * 0.3 - j); P.rect(1, 5, 9, 1, RP.latao, (i) => 3.4 - i * 0.15); P.put(5, 2, RP.vidro, 3);   // helmet with a dead lamp
  for (let k = 0; k < 5; k++) P.line(7 + k * 1.6, 9, 9 + k * 1.6, 12, RP.osso, 4.2 - k * 0.2, 1);   // ribs
  P.line(7, 12, 18, 12, RP.osso, 3.4, 1); P.line(16, 13, 24, 13, RP.osso, 4.4, 1); P.put(24, 12, RP.osso, 4.8);   // leg bones
  P.line(8, 10, 4, 13, RP.osso, 3.8, 1);
  P.line(12, 6, 24, 9, RP.madeira, 3.6, 1); P.line(20, 4, 23, 9, RP.ferro, 4.6, 1); P.line(23, 9, 25, 13, RP.ferro, 3, 1);   // the pick
  return P.done();
}
function goblinTent(s) {   // 38 x 28: patched hides stretched over crooked poles, a skull over the flap
  const P = painter(38, 28);
  P.line(19, 0, 19, 27, RP.velha, 3.6, 2); P.line(3, 6, 1, 27, RP.velha, 3, 1); P.line(35, 7, 37, 27, RP.velha, 2.6, 1);
  for (let y = 3; y < 28; y++) { const half = (y - 3) / 24 * 18; for (let x = Math.round(19 - half); x <= 19 + half; x++) {
    const u = (x - (19 - half)) / Math.max(1, half * 2), patch = Math.floor((x + hash2(Math.floor(y / 6), 0, s) * 6) / 7) + Math.floor(y / 6) * 5, R = hash2(patch, 0, s) < 0.3 ? RP.pele : RP.couro;
    let v = 4.2 - u * 2.4 + cg(x, y, s) * 0.5 + ((x + Math.floor(y / 6)) % 7 === 0 ? -1.2 : 0);
    if (y % 6 === 0 && hash2(x, y, s) < 0.6) v -= 1.4;   // stitches between the hides
    P.put(x, y, R, v);
  } }
  for (let y = 12; y < 28; y++) { const half = (y - 12) / 16 * 5; for (let x = Math.round(19 - half); x <= 19 + half; x++) P.put(x, y, RP.sombra, 2 + (y - 12) * 0.08); }   // the dark doorway
  P.line(19, 12, 24, 27, RP.couro, 4.6, 1);   // the flap tied back
  P.blob(19, 6, 2.4, 2, RP.osso, s, 4.4); P.put(18, 6, RP.carvao, 0.5); P.put(20, 6, RP.carvao, 0.5); P.put(16, 5, RP.osso, 3.8); P.put(22, 5, RP.osso, 3.8);
  for (const [x, y] of [[8, 16], [30, 18], [11, 24]]) P.rect(x, y, 3, 2, RP.panoVerde, (i, j) => 3.6 - j);   // patches
  return P.done();
}
function lootPile() {   // 32 x 16: what the goblins took: coins, cups, a crown, a candlestick, a sack
  const P = painter(32, 16), s = 9221;
  for (let k = 0; k < 260; k++) { const t = hash2(k, 0, s), x = 2 + t * 28, top = 15 - Math.sin(t * Math.PI) * 9; const y = top + hash2(k, 1, s) * (15 - top); P.put(x, y, RP.ouro, 3 + hash2(k, 2, s) * 3 - (y - top) * 0.15); }
  for (let k = 0; k < 18; k++) { const x = 3 + hash2(k, 3, s) * 26, y = 15 - Math.sin((x - 2) / 28 * Math.PI) * 9 + 1; P.rect(x, y, 2, 1, RP.ouro, (i) => 6 - i * 1.6); }
  P.rect(13, 2, 6, 3, RP.ouro, (i, j) => 5 - i * 0.4 - j * 0.6); for (const x of [13, 15, 17]) P.put(x + 0.5, 1, RP.ouro, 6); P.put(15, 3, RP.pano, 5);   // the crown
  P.rect(5, 6, 3, 4, RP.latao, (i, j) => 4.6 - i * 0.8); P.rect(4, 5, 5, 1, RP.latao, () => 5.2);   // a cup
  P.blob(26, 9, 4, 4.6, RP.pele, s, 3.4); P.line(25, 4, 28, 4, RP.corda, 4, 1);   // a sack
  P.line(21, 1, 21, 9, RP.latao, 4.2, 1); P.rect(20, 0, 3, 1, RP.latao, () => 5);   // a candlestick
  return P.done();
}
function goblinFire() {   // 26 x 20: a ring of stones, a spit on two forked sticks with something on it, bones around
  const P = painter(26, 20), s = 9241;
  for (const fx of [3, 22]) { P.line(fx, 19, fx, 6, RP.velha, 3.6, 1); P.put(fx - 1, 5, RP.velha, 3.6); P.put(fx + 1, 5, RP.velha, 3.6); }
  P.line(2, 6, 24, 6, RP.velha, 4, 1);   // the spit
  P.blob(13, 8, 4, 2.4, RP.couro, s, 3.6); P.put(10, 9, RP.osso, 4.4); P.put(17, 9, RP.osso, 4.4);   // a roast rat
  for (let k = 0; k < 7; k++) P.blob(6 + k * 2.4, 18 - Math.sin(k / 6 * Math.PI) * 0.8, 1.4, 1.2, RP.pedra, s + k, 3.4);   // stones
  for (let x = 8; x < 19; x++) for (let y = 14; y < 18; y++) { const d = Math.hypot((x - 13.5) / 5, (y - 18) / 4); if (d < 1) P.put(x, y, d < 0.5 ? RP.fogo : RP.carvao, d < 0.5 ? 4 + (1 - d) * 2 : 2.6 + hash2(x, y, s) * 1.5); }   // embers
  P.line(20, 19, 25, 17, RP.osso, 4.4, 1); P.line(0, 19, 4, 18, RP.osso, 4, 1);
  return P.done();
}
function brokenGear() {   // 42 x 24: half of a great iron gear sunk in the floor, teeth broken, rust bleeding down
  const P = painter(42, 24), s = 9261, cx = 21, cy = 24;
  for (let y = 0; y < 24; y++) for (let x = 0; x < 42; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const tooth = Math.cos(a * 14) > 0.3 && hash2(Math.round(a * 14 / 6.28 * 14), 0, s) > 0.18;
    if (r > 20 + (tooth ? 3 : 0) || r < 5) continue;
    if (r > 8 && r < 17 && Math.abs(Math.sin(a * 3)) > 0.5) continue;   // the gaps between the spokes
    let v = 4 - (dx + dy) / 30 + cg(x, y, s) * 0.5 + (Math.abs(r - 18) < 0.8 ? -1 : 0);
    P.put(x, y, hash2(x, y, s) < 0.18 + y * 0.012 ? RP.ferrugem : RP.ferro, v);
  }
  P.blob(cx, 23, 4.4, 3, RP.ferro, s, 4.4);
  return P.done();
}
function smelter() {   // 38 x 46: a brick furnace: a wide base, a glowing arched mouth, a stack going up, soot
  const P = painter(38, 46), s = 9281;
  const brick = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const row = Math.floor(y / 3), off = row % 2 ? 2 : 0, mortar = y % 3 === 2 || (x + off) % 5 === 4; P.put(x, y, RP.tijolo, mortar ? 1.4 : 3.6 + hash2(Math.floor((x + off) / 5), row, s) * 1.2 - (x - x0) / w * 1.4 - Math.max(0, cn(x, y, 30, 60, s)) * 4); } };
  brick(13, 0, 12, 22); brick(3, 20, 32, 26);
  for (let x = 12; x < 26; x++) P.put(x, 0, RP.ferro, 4);   // the stack's iron cap
  // the mouth: an arch with a fire inside, a grate across its foot
  for (let y = 27; y < 44; y++) for (let x = 10; x < 28; x++) { const dx = (x + 0.5 - 19) / 9, dy = (y + 0.5 - 35) / 8; if (dy < 0 ? dx * dx + dy * dy > 1 : Math.abs(dx) > 1) continue; const d = Math.hypot(dx, Math.max(0, -dy)); P.put(x, y, RP.fogo, 5.6 - d * 2.6 - (44 - y) * 0.06 + cg(x, y, s) * 0.6); }
  for (let x = 9; x < 29; x++) for (let y = 26; y < 28; y++) if (P.has(x, y + 1) && !P.has(x, y)) P.put(x, y, RP.tijolo, 4.8);
  for (let x = 11; x < 28; x += 3) for (let y = 40; y < 44; y++) P.put(x, y, RP.ferro, y === 40 ? 4 : 2.4);
  P.rect(3, 44, 32, 2, RP.ferro, (i, j) => 3.4 - j);
  return P.done();
}
function crucible() {   // 24 x 22: an iron crucible on a stand, brimming with metal that still glows, a ladle in it
  const P = painter(24, 22), s = 9301;
  for (const lx of [4, 19]) P.line(lx, 21, lx + (lx < 12 ? 3 : -3), 13, RP.ferro, 3.4, 2);
  for (let y = 6; y < 16; y++) { const half = 9 - Math.pow((y - 6) / 10, 2) * 4; for (let x = Math.round(12 - half); x <= Math.round(12 + half); x++) P.put(x, y, RP.ferro, 4 - (x - 12 + half) / (half * 2) * 2.4 + cg(x, y, s) * 0.4 + (y === 9 ? 0.8 : 0)); }
  for (let x = 4; x < 21; x++) { P.put(x, 5, RP.fogo, 5.6 - Math.abs(x - 12) * 0.08); P.put(x, 6, RP.fogo, 4.4); }   // the metal
  P.rect(2, 4, 21, 1, RP.ferro, (i) => 5 - i * 0.1);
  P.line(15, 5, 22, 0, RP.ferro, 4.2, 1);
  P.blob(12, 20, 5, 1.6, RP.carvao, s, 3);   // coals under it
  for (let x = 9; x < 16; x++) if (hash2(x, 0, s) < 0.6) P.put(x, 19, RP.fogo, 4.4);
  return P.done();
}

/* =============================== CEILING =============================== */
function pulley() {   // 14 x 36: a pulley wheel on an iron bracket, a rope with a bucket at its end
  const P = painter(14, 36), s = 9321;
  P.rect(2, 0, 10, 2, RP.ferro, (i, j) => 4 - j * 1.4); P.line(4, 2, 6, 5, RP.ferro, 3.4, 1); P.line(10, 2, 8, 5, RP.ferro, 3, 1);
  wheel(P, 7, 7, 3.4, 0.4);
  for (let y = 7; y < 27; y++) { P.put(3.6, y, RP.corda, 4.4 - (y % 3 === 0 ? 1.2 : 0)); if (y < 14) P.put(10.4, y, RP.corda, 3.6 - (y % 3 === 0 ? 1.2 : 0)); }
  for (let y = 27; y < 36; y++) { const hw = 4.6 - (y - 27) * 0.18; for (let x = Math.round(4 - hw); x <= Math.round(4 + hw); x++) P.put(x + 2, y, RP.madeira, 4.2 - (x - 4 + hw) / hw * 1.2 + (y === 29 || y === 33 ? -1.6 : 0)); }
  P.line(1, 27, 4, 24, RP.ferro, 3.8, 1); P.line(9, 27, 6, 24, RP.ferro, 3.2, 1);
  return P.done();
}
function bigLantern() {   // 14 x 26: a big miner's lantern on a long chain
  const P = painter(14, 26), s = 9341;
  for (let y = 0; y < 12; y++) P.put(6 + (y % 2), y, RP.ferro, 4.2 - (y % 2) * 1.2);
  P.rect(3, 12, 8, 2, RP.ferro, (i, j) => 4.4 - i * 0.3 - j); P.put(7, 11, RP.ferro, 5);
  for (let y = 14; y < 22; y++) for (let x = 2; x < 12; x++) { if (x === 2 || x === 11 || x === 6) { P.put(x, y, RP.latao, x === 2 ? 4.6 : x === 6 ? 3.6 : 2.6); continue; } P.put(x, y, RP.vidro, 6.2 - Math.hypot(x - 6.5, y - 17.5) * 0.9 + cg(x, y, s) * 0.3); }
  P.rect(1, 22, 12, 2, RP.latao, (i, j) => 4.8 - i * 0.25 - j); P.rect(4, 24, 6, 2, RP.latao, (i) => 2.6 - i * 0.1);
  return P.done();
}
function cage() {   // 18 x 34: an iron cage on a chain; something small and dead in it
  const P = painter(18, 34), s = 9361;
  for (let y = 0; y < 8; y++) P.put(9 + (y % 2), y, RP.ferro, 4 - (y % 2) * 1.2);
  for (let y = 8; y < 12; y++) { const hw = (y - 8) * 2; for (let x = 9 - hw; x <= 9 + hw; x++) P.put(x, y, RP.ferro, x === 9 - hw || x === 9 + hw ? 4 : 0); }
  for (let y = 11; y < 33; y++) for (const x of [1, 5, 9, 13, 17]) P.put(x, y, RP.ferro, x < 9 ? 4.4 : 3);
  for (const y of [11, 22, 32]) P.line(1, y, 17, y, RP.ferro, 4.2, 1);
  P.blob(8, 30, 3, 1.6, RP.osso, s, 4); P.put(6, 30, RP.carvao, 1); P.line(9, 31, 14, 31, RP.osso, 3.6, 1);
  P.rect(0, 33, 18, 1, RP.ferro, () => 2.6);
  return P.done(false);
}
function goblinBanner(s) {   // 16 x 32: a rag nailed to a crosspiece: a crude goblin face daubed on it
  const P = painter(16, 32);
  P.line(0, 1, 15, 1, RP.velha, 4, 1); P.line(8, 0, 8, 2, RP.ferro, 4.4, 1);
  for (let y = 2; y < 31; y++) for (let x = 1; x < 15; x++) { if (y > 24 && ((x + (y > 28 ? 1 : 0)) % 4 === 0 || hash2(x, y, s) < (y - 24) * 0.08)) continue; P.put(x + Math.sin(y * 0.3) * 0.5, y, RP.pano, 3.6 - (x - 1) * 0.12 + Math.sin(x * 0.9 + y * 0.2) * 0.4 + cg(x, y, s) * 0.4); }
  // the face: two slanted eyes, a toothy grin, ears out to the sides
  for (const [x, y] of [[4, 9], [5, 10], [10, 10], [11, 9]]) P.put(x, y, RP.goblin, 5);
  for (let x = 4; x < 12; x++) P.put(x, 15 + (x === 4 || x === 11 ? -1 : 0), RP.goblin, 4.4); for (const x of [5, 7, 9]) P.put(x, 16, RP.osso, 5);
  P.put(2, 8, RP.goblin, 4); P.put(1, 7, RP.goblin, 4); P.put(13, 8, RP.goblin, 4); P.put(14, 7, RP.goblin, 4);
  return P.done();
}

/* =============================== BACK WALL =============================== */
function elevator() {   // 32 x 52: the head frame of a shaft: two posts, a crossbeam with a sheave, a cage hung low
  const P = painter(32, 52), s = 9381;
  for (const px of [1, 27]) plank(P, px, 4, 48, 4, RP.madeira, s + px, true, 3.2);
  plank(P, 0, 2, 32, 3, RP.madeira, s, false, 3.6);
  for (const [x0, x1] of [[5, 15], [27, 17]]) P.line(x0, 6, x1, 20, RP.madeira, 2.8, 2);   // braces
  wheel(P, 16, 8, 4, 0.2);
  for (let y = 12; y < 26; y++) { P.put(13, y, RP.corda, 4.2 - (y % 3 === 0 ? 1.2 : 0)); P.put(19, y, RP.corda, 3.4 - (y % 3 === 0 ? 1.2 : 0)); }
  for (let y = 26; y < 50; y++) for (let x = 8; x < 24; x++) { const fr = x === 8 || x === 23 || y === 26 || y === 49 || y === 37; if (fr) P.put(x, y, RP.ferro, x === 8 || y === 26 ? 4.4 : 2.8); else if ((x - 8) % 3 === 0) P.put(x, y, RP.ferro, 3.4); }   // the cage
  P.rect(9, 48, 14, 1, RP.madeira, (i) => 3.6 - i * 0.1);
  return P.done();
}
function gallerySign(k) {   // 26 x 12: a board with the gallery's number in Roman numerals and an arrow
  const P = painter(26, 12), s = 9401 + k;
  plank(P, 0, 1, 26, 10, RP.velha, s, false, 3.4);
  P.put(2, 2, RP.ferro, 4.6); P.put(23, 2, RP.ferro, 4.6);
  const n = ['I', 'II', 'III', 'IV', 'V'][k % 5]; let x = 4;
  for (const ch of n) { if (ch === 'I') { P.line(x, 3, x, 8, RP.osso, 4.6, 1); x += 2; } else { P.line(x, 3, x + 2, 8, RP.osso, 4.6, 1); P.line(x + 4, 3, x + 2, 8, RP.osso, 4.6, 1); x += 6; } }
  const ax = 15, dir = k % 2 ? 1 : -1; P.line(ax, 6, ax + 7, 6, RP.osso, 4.4, 1); for (let j = 1; j < 3; j++) { P.put(dir > 0 ? ax + 7 - j : ax + j, 6 - j, RP.osso, 4.4); P.put(dir > 0 ? ax + 7 - j : ax + j, 6 + j, RP.osso, 4.4); }
  return P.done();
}
function toolRack() {   // 30 x 18: a rail with pegs: two picks, a shovel, a coil of rope, a hammer
  const P = painter(30, 18), s = 9421;
  plank(P, 0, 1, 30, 3, RP.velha, s, false, 3.4);
  P.line(4, 3, 4, 17, RP.madeira, 3.8, 1); P.rect(1, 3, 7, 2, RP.ferro, (i) => 4.6 - i * 0.3);   // pick
  P.line(10, 3, 10, 13, RP.madeira, 3.6, 1); P.rect(8, 13, 5, 5, RP.ferro, (i, j) => 4.4 - i * 0.5 - j * 0.2);   // shovel
  for (let a = 0; a < 6.3; a += 0.2) for (const r of [3, 4]) P.put(18 + Math.cos(a) * r, 9 + Math.sin(a) * r * 1.2, RP.corda, 4.2 - Math.sin(a) * 0.8 - (r - 3) * 0.8);   // rope coil
  P.line(25, 3, 25, 16, RP.madeira, 3.4, 1); P.rect(23, 13, 5, 3, RP.ferro, (i) => 4.2 - i * 0.4);   // hammer
  return P.done();
}
function mineMap() {   // 22 x 18: a sheet of hide pinned up: the galleries scratched on it, a cross marked in red
  const P = painter(22, 18), s = 9441;
  P.rect(1, 1, 20, 16, RP.papel, (i, j) => 4.4 - j * 0.05 - (i === 0 || j === 0 ? -0.6 : 0) + cn(i, j, 30, 30, s) * 1.2 + ((i === 19 && j > 12) ? -2 : 0));
  for (const [x0, y0, x1, y1] of [[3, 4, 17, 4], [5, 4, 5, 13], [5, 9, 15, 9], [12, 9, 12, 15], [3, 13, 12, 13]]) P.line(x0, y0, x1, y1, RP.carvao, 3.6, 1);
  P.put(14, 14, RP.pano, 5.6); P.put(15, 15, RP.pano, 5.6); P.put(15, 13, RP.pano, 5.6); P.put(13, 15, RP.pano, 5.6);
  for (const [x, y] of [[1, 1], [20, 1], [1, 16], [20, 16]]) P.put(x, y, RP.ferro, 4.6);
  return P.done();
}
function goblinPainting() {   // 34 x 18: soot and ochre: goblins throwing dynamite at a fat man in a helmet, an explosion
  const P = painter(34, 18), s = 9461;
  scrawl(P, 4, 7, s); scrawl(P, 10, 6, s + 1);
  P.line(11, 6, 15, 2, RP.carvao, 4.2, 1); P.put(16, 1, RP.pano, 5); P.put(17, 0, RP.fogo, 5);   // a stick of dynamite in the air
  for (let a = 0; a < 6.3; a += 0.4) P.line(26, 8, 26 + Math.cos(a) * (4 + (a * 3 % 2)), 8 + Math.sin(a) * (4 + (a * 3 % 2)), RP.ferrugem, 4.4, 1);   // the bang
  P.blob(26, 8, 2, 2, RP.fogo, s, 3.6);
  for (let x = 18; x < 22; x++) for (let y = 11; y < 16; y++) if (hash2(x, y, s) > 0.15) P.put(x, y, RP.ferrugem, 3.6);   // the miner, running
  P.rect(18, 9, 4, 2, RP.latao, () => 3.8);
  for (let x = 1; x < 33; x += 2) if (hash2(x, 3, s) > 0.3) P.put(x, 17, RP.ferrugem, 3.2);
  return P.done(false);
}
function goldSeam() {   // 30 x 16: a seam of gold-bearing quartz laid bare in a patch of hacked rock
  const P = painter(30, 16), s = 9481;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 30; x++) { const dx = (x + 0.5 - 15) / 15, dy = (y + 0.5 - 8) / 8; if (dx * dx + dy * dy > 1 - cn(x, y, 20, 20, s) * 0.5) continue; P.put(x, y, RP.minerio, 2.6 - dx * 0.8 - dy * 0.6 + cg(x, y, s) * 0.7); }
  for (let x = 2; x < 28; x++) { const c = 8 + Math.sin(x * 0.25 + 1) * 2.2, hw = 1.6 + Math.sin(x * 0.5) * 0.6; for (let y = Math.round(c - hw); y <= Math.round(c + hw); y++) { if (!P.has(x, y)) continue; const g = hash2(x, y, s) < 0.22; P.put(x, y, g ? RP.ouro : RP.papel, g ? 4.4 + hash2(x, y, s + 1) * 2.4 : 4.4 - Math.abs(y - c) * 0.5 + cg(x, y, s) * 0.6); } }
  for (let k = 0; k < 6; k++) { const x = 4 + k * 4.4, y = k % 2 ? 2.5 : 12.5; P.line(x, y, x + 2, y + (k % 2 ? 2 : -2), RP.minerio, 0.6, 1); }
  return P.done();
}

/* =============================== THE BOSS'S THRONE (85) =============================== */
function goblinThrone() {   // 44 x 36: the Rei Goblin's seat: a tipped ore cart for a chair, hides, a heap of loot, skull stakes
  const P = painter(44, 36), s = 9500;
  for (const [x, top] of [[3, 2], [40, 4]]) { P.line(x, top + 6, x, 35, RP.velha, 3.6, 2); P.blob(x + 0.5, top + 3, 2.6, 2.4, RP.osso, s + x, 4.4); P.put(x - 1, top + 3, RP.carvao, 0.5); P.put(x + 1, top + 3, RP.carvao, 0.5); }
  // the back: the cart stood on end, banded
  for (let y = 4; y < 26; y++) for (let x = 12; x < 32; x++) { const row = (y - 4) % 3; P.put(x, y, RP.madeira, 3.2 + (row === 0 ? 0.9 : row === 2 ? -0.8 : 0) - (x - 12) * 0.04 + cg(x, y, s) * 0.5); }
  for (const x of [12, 13, 30, 31]) for (let y = 4; y < 26; y++) P.put(x, y, RP.ferro, x === 12 || x === 30 ? 4.2 : 2.6);
  for (let x = 11; x < 33; x++) { P.put(x, 3, RP.ferro, 4.8); P.put(x, 4, RP.ferro, 3); }
  for (const wx of [16, 28]) { P.blob(wx, 3, 2.4, 2.4, RP.ferro, s + wx, 3.2); P.put(wx, 3, RP.ferro, 1.2); }   // its wheels up top like ears
  // the seat: a hide thrown over crates
  P.box(9, 22, 26, 8, RP.madeira, s + 1, 3);
  for (let x = 9; x < 35; x++) for (let y = 19; y < 26 + Math.round(Math.sin(x * 0.7) * 1.4); y++) P.put(x, y, RP.pele, 4.2 - (y - 19) * 0.25 + ((x + y) % 5 === 0 ? -1 : 0) + cg(x, y, s) * 0.5);
  // loot spilling over the steps
  for (let k = 0; k < 220; k++) { const t = hash2(k, 0, s), x = 1 + t * 42, top = 35 - Math.sin(t * Math.PI) * 5 - (t > 0.25 && t < 0.75 ? 0 : 0); P.put(x, top + hash2(k, 1, s) * (35 - top), RP.ouro, 3.2 + hash2(k, 2, s) * 2.8); }
  P.rect(0, 33, 44, 3, RP.madeira, (i, j) => 3.4 - j * 0.8 + cg(i, j, s) * 0.5);
  for (const [x, y] of [[6, 30], [37, 31], [21, 31]]) { P.rect(x, y, 3, 2, RP.ouro, (i, j) => 5.6 - i * 0.6 - j); }
  return P.done();
}

/* =============================== register =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes, mina: true }, extra || {}));
const ALL = ['galerias', 'pocos', 'acampamento', 'fornalhas'];
const WARMM = '#ffa040';
// floor
def('mn_vagonete', 'Vagonete', F, 'frente', ['galerias', 'acampamento'], [oreCart(true, 9001), oreCart(true, 9002), oreCart(false, 9003)], { trilho: true });
def('mn_tombado', 'Vagonete tombado', F, 'frente', ['galerias', 'pocos'], [tippedCart()]);
def('mn_guincho', 'Guincho', F, 'frente', ['pocos'], [winch()]);
def('mn_caixotes', 'Pilha de caixotes', F, 'frente', ['galerias', 'pocos', 'acampamento'], [crates()]);
def('mn_barril', 'Barril de pólvora', F, 'frente', ['galerias', 'acampamento'], [powderKegs(false), powderKegs(true)]);
def('mn_beliche', 'Beliche podre', F, 'frente', ['pocos'], [bunk()]);
def('mn_mesa', 'Mesa com lampião e mapa', F, 'frente', ['galerias', 'pocos'], [mapTable()], { luz: [{ x: 5, y: 3, r: 0.7 }], brilho: WARMM });
def('mn_bigorna', 'Bigorna e fole', F, 'frente', ['fornalhas'], [anvil()]);
def('mn_minerio', 'Monte de minério', F, 'frente', ['galerias', 'pocos', 'fornalhas'], [oreHeap(9151), oreHeap(9152)]);
def('mn_carrinho', 'Carrinho de mão', F, 'frente', ['galerias', 'pocos'], [wheelbarrow()]);
def('mn_esqueleto', 'Mineiro morto', F, 'frente', ['galerias', 'pocos'], [minerSkeleton()]);
def('mn_tenda', 'Tenda goblin', F, 'frente', ['acampamento'], [goblinTent(9201), goblinTent(9202)]);
def('mn_saque', 'Saque dos goblins', F, 'frente', ['acampamento'], [lootPile()], { luz: [{ x: 16, y: 8, r: 0.35 }], brilho: '#f0c43a' });
def('mn_fogueira', 'Fogueira goblin', F, 'frente', ['acampamento'], [goblinFire()], { luz: [{ x: 13, y: 14, r: 0.8 }], chamas: [{ x: 12, y: 13 }, { x: 14, y: 13 }], brilho: WARMM });
def('mn_engrenagem', 'Engrenagem quebrada', F, 'frente', ['acampamento', 'fornalhas'], [brokenGear()]);
def('mn_fornalha', 'Fornalha', F, 'frente', ['fornalhas'], [smelter()], { luz: [{ x: 19, y: 36, r: 0.95 }], chamas: [{ x: 16, y: 39 }, { x: 19, y: 38 }, { x: 22, y: 39 }], brilho: '#ff7a20' });
def('mn_cadinho', 'Cadinho', F, 'frente', ['fornalhas'], [crucible()], { luz: [{ x: 12, y: 5, r: 0.7 }], brilho: '#ff7a20' });
// ceiling
def('mn_polia', 'Polia com balde', C, 'frente', ['pocos'], [pulley()]);
def('mn_lanterna', 'Lanterna grande', C, 'frente', ['galerias', 'pocos'], [bigLantern()], { luz: [{ x: 7, y: 18, r: 0.9 }], brilho: WARMM });
def('mn_jaula', 'Jaula goblin', C, 'frente', ['acampamento'], [cage()]);
def('mn_estandarte', 'Estandarte goblin', C, 'frente', ['acampamento'], [goblinBanner(9371), goblinBanner(9372)]);
// back wall
def('mn_elevador', 'Elevador de mina', W, 'fundo', ['pocos'], [elevator()]);
def('mn_placa', 'Placa de galeria', W, 'fundo', ['galerias', 'pocos'], [gallerySign(0), gallerySign(1), gallerySign(2), gallerySign(3)]);
def('mn_ferramentas', 'Ferramentas na parede', W, 'fundo', ['galerias', 'pocos'], [toolRack()]);
def('mn_mapa', 'Mapa da mina', W, 'fundo', ['galerias', 'pocos', 'acampamento'], [mineMap()]);
def('mn_pintura', 'Pintura goblin', W, 'fundo', ['acampamento'], [goblinPainting()]);
def('mn_veio', 'Veio de ouro', W, 'fundo', ['pocos', 'fornalhas'], [goldSeam()], { luz: [{ x: 15, y: 8, r: 0.3 }], brilho: '#f0c43a' });
// the boss hall (85 places it)
def('mn_trono', 'Trono do Rei Goblin', F, 'fundo', [], [goblinThrone()], { luz: [{ x: 22, y: 30, r: 0.5 }], brilho: '#f0c43a' });

// what each band gets, per open stretch of floor or ceiling: [id, chance per 10 blocks, max per stretch]
Object.assign(MN_PROP_PLAN, {
  galerias: { chao: [['mn_vagonete', 0.5, 1], ['mn_caixotes', 0.15, 1], ['mn_barril', 0.12, 1], ['mn_mesa', 0.06, 1], ['mn_minerio', 0.15, 1], ['mn_carrinho', 0.08, 1], ['mn_esqueleto', 0.06, 1], ['mn_tombado', 0.05, 1]], teto: [['mn_lanterna', 0.12, 1]], fundo: [['mn_placa', 0.08, 1], ['mn_ferramentas', 0.05, 1], ['mn_mapa', 0.03, 1]] },
  pocos: { chao: [['mn_guincho', 0.12, 1], ['mn_beliche', 0.06, 1], ['mn_caixotes', 0.12, 1], ['mn_minerio', 0.15, 1], ['mn_tombado', 0.06, 1], ['mn_mesa', 0.05, 1], ['mn_carrinho', 0.06, 1], ['mn_esqueleto', 0.06, 1]], teto: [['mn_polia', 0.15, 1], ['mn_lanterna', 0.12, 1]], fundo: [['mn_elevador', 0.04, 1], ['mn_veio', 0.1, 1], ['mn_placa', 0.05, 1], ['mn_ferramentas', 0.05, 1]] },
  acampamento: { chao: [['mn_tenda', 0.3, 1], ['mn_fogueira', 0.2, 1], ['mn_saque', 0.12, 1], ['mn_barril', 0.15, 1], ['mn_caixotes', 0.12, 1], ['mn_engrenagem', 0.05, 1], ['mn_vagonete', 0.3, 1]], teto: [['mn_estandarte', 0.3, 2], ['mn_jaula', 0.12, 1]], fundo: [['mn_pintura', 0.12, 1], ['mn_mapa', 0.03, 1]] },
  fornalhas: { chao: [['mn_fornalha', 0.25, 1], ['mn_cadinho', 0.2, 1], ['mn_bigorna', 0.12, 1], ['mn_engrenagem', 0.06, 1], ['mn_minerio', 0.1, 1]], teto: [], fundo: [['mn_veio', 0.05, 1]] }
});
}
