'use strict';

/* ================= world ================= */
let tiles, walls, surf, seed = 1;
let crypt = null;
const diffs = new Map();
const Z1 = 106, Z2 = 166;
// the world wraps around horizontally: walk far enough one way and you come back from the other side
const wrapX = x => (x < 0 || x >= WW) ? ((x % WW) + WW) % WW : x;
const wdx = d => d - Math.round(d / WW) * WW;   // shortest horizontal tile distance around the ring
function tileAt(x, y) { if (y < 0) return AIR; if (y >= WH) return BEDROCK; return tiles[y * WW + wrapX(x)]; }
function wallAt(x, y) { return y < 0 || y >= WH ? 0 : walls[y * WW + wrapX(x)]; }
function solidAt(x, y) { return SOLID[tileAt(x, y)] === 1; }

function generate(sd) {
  seed = sd >>> 0;
  const R = mulberry32(seed ^ 0x5bd1e995), N = makeNoise(seed), NN = WW * WH;
  tiles = new Uint8Array(NN); walls = new Uint8Array(NN); surf = new Int16Array(WW); seen = new Uint8Array(NN); mapVer++;
  // 1D noise sampled around a circle so the ends meet; 2D noise blended across a seam band
  const ring = (x, f, ox, oy) => { const a = x / WW * Math.PI * 2, r = WW * f / (Math.PI * 2); return [Math.cos(a) * r + ox, Math.sin(a) * r + oy]; };
  const ring1 = (x, f, ox, oy, oct) => { const [a, b] = ring(x, f, ox, oy); return N.fbm(a, b, oct); };
  const SB = 40, seam = (fn, x, y) => x < WW - SB ? fn(x, y) : lerp(fn(x, y), fn(x - WW, y), (x - (WW - SB)) / SB);
  const W1 = x => (x + WW) % WW;
  for (let x = 0; x < WW; x++) surf[x] = Math.round(SURF_BASE + (ring1(x, 0.017, 50, 3.3, 4) - 0.5) * 26 + (ring1(x, 0.09, 70, 9.1, 2) - 0.5) * 4);
  const s0 = surf[SPX];
  // the village sits on flat ground; the land eases back into hills on both sides
  for (let x = SPX - VIL_HALF; x <= SPX + VIL_HALF; x++) surf[x] = s0;
  for (let k = 1; k <= 10; k++) { const a = k / 11; surf[SPX - VIL_HALF - k] = Math.round(lerp(s0, surf[SPX - VIL_HALF - k], a)); surf[SPX + VIL_HALF + k] = Math.round(lerp(s0, surf[SPX + VIL_HALF + k], a)); }
  // strata: dirt with cobble patches up top, cobble lower down, dark slate in the deep
  for (let x = 0; x < WW; x++) {
    const sx = surf[x], dirtD = 5 + ring1(x, 0.09, 90, 1.7, 2) * 6, deepL = Z1 + 8 + (ring1(x, 0.03, 110, 5.5, 3) - 0.5) * 18;
    for (let y = Math.max(0, sx); y < WH; y++) {
      const d = y - sx, i = y * WW + x, n = seam((a, b) => N.fbm(a * 0.06, b * 0.06 + 40, 3), x, y);
      let t;
      if (d < dirtD) t = DIRT;
      else if (y < deepL) { const k = clamp((y - sx - 10) / 70, 0, 1), n2 = seam((a, b) => N.fbm(a * 0.13 + 90, b * 0.13, 2), x, y); t = n > 0.6 - k * 0.18 && n2 < 0.66 ? STONE : DIRT; }
      else t = n > 0.7 ? STONE : DEEP;
      tiles[i] = t;
      if (d >= 2) walls[i] = y >= deepL - 1 ? 3 : (seam((a, b) => N.fbm(a * 0.05 + 200, b * 0.05, 3), x, y) > 0.58 + Math.max(0, 0.1 - (y - sx) / 300) ? 2 : 1);
    }
  }
  // caves: noisy fill + cellular automata = chunky organic caverns with ledges
  // with the cave layer on (52-57) everything under the crust is rebuilt, so the old caverns are skipped (they cost seconds in the wide world)
  const OLD_CAVES = !(typeof CAVERNA !== 'undefined' && CAVERNA);
  const cave = new Uint8Array(NN), tmp = new Uint8Array(NN);
  const top = x => surf[x] + 9;
  if (OLD_CAVES) for (let y = 0; y < WH - 4; y++) for (let x = 0; x < WW; x++) {
    const d = y - top(x); if (d < 0) continue;
    const ramp = clamp(d / 8, 0, 1), reg = seam((a, b) => N.fbm(a * 0.02, b * 0.028 + 77, 3), x, y), streak = seam((a, b) => N.n2(a * 0.22, b * 0.55 + 300), x, y);
    const p = (0.445 + (reg - 0.5) * 0.55 + (streak - 0.5) * 0.16) * ramp;
    cave[y * WW + x] = R() < p ? 1 : 0;
  }
  for (let it = 0; it < (OLD_CAVES ? 6 : 0); it++) {
    for (let y = 1; y < WH - 4; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (y < top(x)) { tmp[i] = 0; continue; }
      let s1 = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!cave[(y + dy) * WW + W1(x + dx)]) s1++;
      let solid = s1 >= 5;
      if (it < 2) { let s2 = 0; for (let dy = -2; dy <= 2; dy++) { const yy = y + dy; if (yy < 0 || yy >= WH) { s2 += 5; continue; } for (let dx = -2; dx <= 2; dx++) if (!cave[yy * WW + W1(x + dx)]) s2++; } if (s2 <= 2) solid = true; }
      tmp[i] = solid ? 0 : 1;
    }
    cave.set(tmp);
  }
  // label air regions; drop tiny pockets
  const lab = new Int32Array(NN).fill(-1), regions = [], stack = [];
  for (let s = 0; s < NN; s++) {
    if (!cave[s] || lab[s] >= 0) continue;
    const id = regions.length, cells = []; lab[s] = id; stack.push(s);
    while (stack.length) { const c = stack.pop(); cells.push(c); const cx0 = c % WW, row = c - cx0; for (const nb of [row + W1(cx0 - 1), row + W1(cx0 + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && cave[nb] && lab[nb] < 0) { lab[nb] = id; stack.push(nb); } }
    regions.push(cells);
  }
  const big = [];
  for (const cells of regions) {
    if (cells.length < 22) continue;
    for (const c of cells) tiles[c] = AIR;
    let sx = 0, sy = 0; for (const c of cells) { sx += c % WW; sy += (c / WW) | 0; }
    const pick = cells[(R() * cells.length) | 0];
    big.push({ n: cells.length, cx: sx / cells.length, cy: sy / cells.length, px: pick % WW, py: (pick / WW) | 0 });
  }
  let protect = null;
  const carve = (cx, cy, r) => { const r2 = r * r; for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { if (y < 0 || y >= WH - 4) continue; const wx = W1(x); if (protect && wx >= protect[0] && wx <= protect[2] && y >= protect[1] && y <= protect[3]) continue; if (y < surf[wx] + 2 && y < cy - 1) continue; const dx = x - cx, dy = (y - cy) * 1.15; if (dx * dx + dy * dy <= r2) tiles[y * WW + wx] = AIR; } };
  const tunnel = (x0, y0, x1, y1, r, path) => {
    let x = x0, y = y0, ang = Math.atan2(y1 - y0, x1 - x0);
    for (let i = 0; i < 600; i++) {
      carve(x, y, r + R() * 0.35); if (path && i % 7 === 4) path.push([Math.round(x), Math.round(y)]);
      const want = Math.atan2(y1 - y, x1 - x); let da = want - ang; da = Math.atan2(Math.sin(da), Math.cos(da));
      ang += da * 0.25 + (R() - 0.5) * 0.6; x += Math.cos(ang) * 0.85; y += Math.sin(ang) * 0.85;
      if (Math.hypot(x1 - x, y1 - y) < 1.5) break;
    }
  };
  // connect the caverns (nearest-neighbour spanning tree over region centres)
  if (big.length > 1) {
    // Prim's with a nearest-tree-node table: O(n^2) instead of O(n^3) (the 3x world has three times the caverns)
    const inT = new Uint8Array(big.length), nd = new Float64Array(big.length).fill(1e9), nf = new Int32Array(big.length).fill(-1);
    const dd = (i, j) => Math.hypot(wdx(big[i].px - big[j].px), (big[i].py - big[j].py) * 1.4);
    const add = i => { inT[i] = 1; for (let j = 0; j < big.length; j++) if (!inT[j]) { const d = dd(i, j); if (d < nd[j]) { nd[j] = d; nf[j] = i; } } };
    add(0);
    for (let k = 1; k < big.length; k++) {
      let best = 1e9, a = -1, b = -1;
      for (let j = 0; j < big.length; j++) if (!inT[j] && nd[j] < best) { best = nd[j]; a = nf[j]; b = j; }
      add(b);
      inT[b] = 1; tunnel(big[a].px, big[a].py, big[a].px + wdx(big[b].px - big[a].px), big[b].py, 1.35 + R() * 0.4, null);   // the short way round
    }
  }
  // the way down from the village: a winding sloped tunnel just past its right edge
  const entrance = [];
  { let x = SPX + VIL_HALF + 4, y = surf[SPX + VIL_HALF + 4] - 1; const pts = [[x, y]]; for (let k = 0; k < 6; k++) { x += 7 + R() * 8; y += 6 + R() * 6; pts.push([x, y]); }
    for (let k = 1; k < pts.length; k++) tunnel(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], 1.75, entrance); }
  for (let k = 0; k < 4 * WSC; k++) {
    let x = 15 + R() * (WW - 30); if (Math.abs(x - SPX) < VIL_HALF + 16) x += VIL_HALF + 40; x = clamp(x, 10, WW - 10);
    const dir = R() < 0.5 ? 1 : -1, x1 = clamp(x + dir * (20 + R() * 20), 6, WW - 6);
    tunnel(x, surf[Math.floor(x)] - 1, x1, surf[Math.floor(x)] + 26 + R() * 14, 1.55, null);
  }
  // remove floating specks of rock
  for (let y = 1; y < WH - 4; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!SOLID[tiles[i]] || y < surf[x] + 3) continue;
    const n = (SOLID[tiles[y * WW + W1(x - 1)]] ? 1 : 0) + (SOLID[tiles[y * WW + W1(x + 1)]] ? 1 : 0) + (SOLID[tiles[i - WW]] ? 1 : 0) + (SOLID[tiles[i + WW]] ? 1 : 0);
    if (n === 0) tiles[i] = AIR;
  }
  // dissolve small rock islands floating in big caverns
  if (OLD_CAVES) { const seen = new Uint8Array(NN), st = [];
    for (let s0 = 0; s0 < NN; s0++) {
      const y0 = (s0 / WW) | 0, x0 = s0 % WW; if (seen[s0] || !SOLID[tiles[s0]] || y0 < surf[x0] + 10 || y0 > WH - 6) continue;
      const cells = []; let open = true; seen[s0] = 1; st.push(s0);
      while (st.length) { const c = st.pop(); cells.push(c); if (cells.length > 14) open = false; const cx0 = c % WW, row = c - cx0; for (const nb of [row + W1(cx0 - 1), row + W1(cx0 + 1), c - WW, c + WW]) { if (nb < 0 || nb >= NN) continue; const yy = (nb / WW) | 0, xx = nb % WW; if (seen[nb] || !SOLID[tiles[nb]]) continue; if (yy < surf[xx] + 10 || yy > WH - 6) { open = false; continue; } seen[nb] = 1; st.push(nb); } }
      if (open && cells.length <= 14) for (const c of cells) tiles[c] = AIR;
    } }
  // bottom: lava lakes and bedrock (no side walls any more: the world wraps)
  for (let x = 0; x < WW; x++) for (let y = WH - 24; y < WH; y++) {
    const i = y * WW + x;
    if (y >= WH - 3 - ((hash2(x, 0, seed) * 2) | 0)) { tiles[i] = BEDROCK; walls[i] = 3; continue; }
    if (tiles[i] === AIR && y >= WH - 13) tiles[i] = LAVA;
  }
  // ores
  for (let k = 0; k < 760 * WSC; k++) {
    let x = 3 + Math.floor(R() * (WW - 6)), y = SURF_BASE + 6 + Math.floor(R() * (WH - SURF_BASE - 22));
    const t0 = tiles[y * WW + x]; if (t0 !== STONE && t0 !== DEEP && t0 !== DIRT) continue;
    const r = R(); let ore = COPPER;
    if (y > Z2 && t0 === DEEP && r < 0.45) ore = CRYSTAL; else if (y > Z1 + 20 && r < 0.5) ore = GOLD; else if (y > SURF_BASE + 40 && r < 0.62) ore = IRON;
    const n = 2 + Math.floor(R() * 5);
    for (let s = 0; s < n; s++) {
      const i = y * WW + x, tt = tiles[i];
      if (tt === STONE || tt === DEEP || tt === DIRT) tiles[i] = ore;
      const dir = Math.floor(R() * 4); x += dir === 0 ? 1 : dir === 1 ? -1 : 0; y += dir === 2 ? 1 : dir === 3 ? -1 : 0;
      x = W1(x); y = clamp(y, 1, WH - 5);
    }
  }
  // coal seams: placed by hash, not by R(), so everything else in a seeded world stays where it was
  for (let y = SURF_BASE + 8; y < WH - 16; y++) for (let x = 0; x < WW; x++) {
    if (hash2(x, y, seed ^ 0x2c0a1) > 0.0042) continue;
    let cx = x, cy = y; const n = 3 + Math.floor(hash2(x, y, seed ^ 0x2c0a2) * 5);
    for (let k = 0; k < n; k++) {
      const i = cy * WW + cx, tt = tiles[i]; if (tt === STONE || tt === DIRT || (tt === DEEP && y < Z2 + 20)) tiles[i] = COAL;
      const d = Math.floor(hash2(cx, cy, seed ^ (0x2c0b0 + k)) * 4); cx = W1(cx + (d === 0 ? 1 : d === 1 ? -1 : 0)); cy = clamp(cy + (d === 2 ? 1 : d === 3 ? -1 : 0), 1, WH - 5);
    }
  }
  // the village ground stays whole: no cave or tunnel breaks through under the houses
  for (let x = SPX - VIL_HALF; x <= SPX + VIL_HALF; x++) { for (let y = s0 - 30; y < s0; y++) tiles[y * WW + x] = AIR; for (let y = s0; y < s0 + 6; y++) if (!SOLID[tiles[y * WW + x]]) tiles[y * WW + x] = DIRT; }
  // grass
  for (let x = 0; x < WW; x++) for (let y = surf[x]; y < surf[x] + 4 && y < WH; y++) { const i = y * WW + x; if (tiles[i] === DIRT && tileAt(x, y - 1) === AIR && walls[i] === 0) tiles[i] = GRASS; }
  // trees: hand-shaped crowns. '#' is a leaf tile; the bottom row sits on the top of the trunk.
  const TREE_ART = [
    ['....#....', '...###...', '..#####..', '.#######.', '########.', '.######..', '...#.#...'],
    ['.....#...', '....###..', '...#####.', '..#######', '.########', '..######.', '...####..', '...#.#...'],
    ['....#....', '...###...', '..#####..', '...###...', '..#####..', '.#######.', '..#####..', '...###...', '...#.#...'],
    ['...####..', '.#######.', '#########', '########.', '.######..', '...#.#...']
  ];
  const TREE_H = [5, 6, 7, 3];
  function growTree(x, y, kind) {
    const art = TREE_ART[kind], h = TREE_H[kind], rows = art.length, mid = 4, top = y - h;
    for (let k = 1; k <= h; k++) if (y - k < 2 || tileAt(x, y - k) !== AIR) return false;
    for (let r = 0; r < rows; r++) {
      const ty = top - (rows - 1) + r; if (ty < 2) return false;
      const row = art[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== '#') continue;
        const tx = x + c - mid;
        if (tx < 2 || tx >= WW - 2 || tileAt(tx, ty) !== AIR) return false;
      }
    }
    for (let k = 1; k <= h; k++) tiles[(y - k) * WW + x] = TRUNK;
    for (let r = 0; r < rows; r++) {
      const ty = top - (rows - 1) + r, row = art[r];
      for (let c = 0; c < row.length; c++) if (row[c] === '#') tiles[ty * WW + (x + c - mid)] = LEAVES;
    }
    return true;
  }
  let lastTree = -12;
  for (let x = 6; x < WW - 6; x++) {
    if (x - lastTree < 11 || Math.abs(x - SPX) < VIL_HALF + 3) continue;
    const y = surf[x]; if (tiles[y * WW + x] !== GRASS || surf[x - 1] !== y || surf[x + 1] !== y) continue;
    if (R() > 0.42) continue;
    const roll = R(), kind = roll < 0.3 ? 0 : roll < 0.55 ? 1 : roll < 0.78 ? 2 : 3;
    if (growTree(x, y, kind)) lastTree = x;
  }
  // surface decorations
  for (let x = 0; x < WW; x++) { const y = surf[x]; if (y < 1) continue; if (tiles[y * WW + x] === GRASS && tiles[(y - 1) * WW + x] === AIR) { const r = R(); if (r < 0.3) tiles[(y - 1) * WW + x] = TUFT; else if (r < 0.37) tiles[(y - 1) * WW + x] = FLOWER; } }
  // cave floor dressing: glowing mushrooms deeper down, bones everywhere
  const floorOk = (x, y) => { const i = y * WW + x; return tiles[i] === AIR && walls[i] && SOLID[tiles[i + WW]] && tiles[i + WW] !== BEDROCK && tiles[i - WW] === AIR; };
  for (let y = 2; y < WH - 16; y++) for (let x = 3; x < WW - 3; x++) {
    if (y < surf[x] + 12 || !floorOk(x, y)) continue;
    const r = R();
    if (y > Z1 - 10 && r < 0.035) tiles[y * WW + x] = SHROOM;
    else if (r > 0.975) tiles[y * WW + x] = BONES;
  }
  // torches: the entrance path, then scattered through the caves (more of them near the top)
  for (let k = 1; k < entrance.length; k += 2) { const [x, y] = entrance[k]; for (let yy = y; yy < y + 4; yy++) if (floorOk(x, yy)) { tiles[yy * WW + x] = TORCH; break; } }
  for (let cy = surf[SPX] + 14; cy < WH - 16; cy += 10) for (let cx = 4; cx < WW - 4; cx += 15) {
    const p = cy < Z1 ? 0.62 : cy < Z2 ? 0.45 : 0.3; if (R() > p) continue;
    for (let a = 0; a < 30; a++) {
      const x = cx + Math.floor(R() * 15), y = cy + Math.floor(R() * 10); if (x >= WW - 3 || y >= WH - 16) continue;
      const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || tiles[i - WW] !== AIR) continue;
      if (!(SOLID[tiles[i + WW]] || SOLID[tiles[i - 1]] || SOLID[tiles[i + 1]])) continue;
      tiles[i] = TORCH; break;
    }
  }
  // treasure chests on cave floors (one near the first cave)
  const chestAt = [];
  const tryChest = (x, y) => {
    if (x < 4 || x >= WW - 4 || y < 2 || y >= WH - 16 || !floorOk(x, y)) return false;
    if (chestAt.some(([cx, cy]) => Math.abs(cx - x) < 10 && Math.abs(cy - y) < 7)) return false;
    tiles[y * WW + x] = CHEST; chestAt.push([x, y]); return true;
  };
  if (entrance.length > 6) { const [ex, ey] = entrance[Math.floor(entrance.length * 0.6)]; for (let r = 0; r < 8; r++) { let ok = false; for (let y = ey - 2; y < ey + 6 && !ok; y++) ok = tryChest(ex + r, y) || tryChest(ex - r, y); if (ok) break; } }
  for (let k = 0; k < 6000 * WSC && chestAt.length < 36 * WSC; k++) { const x = 4 + Math.floor(R() * (WW - 8)); tryChest(x, Math.floor(surf[x] + 16 + R() * (WH - surf[x] - 34))); }
  // then thin them out to a few, far apart (done without the random stream, so the rest of the world comes out the same)
  { const keep = []; for (const c of chestAt) { if (keep.length < 14 * WSC && !keep.some(([kx, ky]) => Math.abs(wdx(kx - c[0])) < 24 && Math.abs(ky - c[1]) < 14)) keep.push(c); else tiles[c[1] * WW + c[0]] = AIR; } }

  // ---------- the abandoned crypt: a grid of rooms deep in the caves; where it is, its layout and its dressing change every world ----------
  crypt = null;
  {
    const COLS = 4, ROWS = 3, CWc = 16, CHc = 10, w = COLS * CWc + 4, h = ROWS * CHc + 4;
    let cx0 = 8;
    for (let k = 0; k < 80; k++) { cx0 = 8 + Math.floor(R() * (WW - w - 16)); if (Math.abs(cx0 + w / 2 - SPX) > 45) break; }
    const cy0 = Z1 + 4 + Math.floor(R() * Math.max(1, Z2 - Z1 - h - 8)), cx1 = cx0 + w - 1, cy1 = cy0 + h - 1;
    const put = (x, y, t) => { tiles[y * WW + x] = t; };
    const isAir = (x, y) => tiles[y * WW + x] === AIR;
    const air = (xa, ya, xb, yb) => { for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) put(x, y, AIR); };
    for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) { put(x, y, CRYPT); walls[y * WW + x] = 4; }
    const entRight = cx0 + w / 2 < SPX, entCol = entRight ? COLS - 1 : 0, bossCol = entRight ? 0 : COLS - 2;
    const floorY = r => cy0 + 2 + (r + 1) * CHc - 1, cellX = c => cx0 + 2 + c * CWc;
    const mkRoom = (r, c, ent) => { const rw = 7 + Math.floor(R() * (CWc - 8)), rh = 5 + Math.floor(R() * 3), x0 = cellX(c) + 1 + Math.floor(R() * (CWc - 2 - rw + 1)), fy = floorY(r); return { x0, x1: x0 + rw - 1, y0: fy - rh, y1: fy - 1, fy, ent }; };
    const rooms = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        if (r === ROWS - 1 && c === bossCol) { const fy = floorY(r); row.push({ x0: cellX(c) + 1, x1: cellX(c + 1) + CWc - 2, y0: fy - 8, y1: fy - 1, fy, boss: true }); continue; }
        if (r === ROWS - 1 && c === bossCol + 1) { row.push(row[c - 1]); continue; }
        const ent = r === 0 && c === entCol;
        row.push(!ent && R() < 0.15 ? null : mkRoom(r, c, ent));
      }
      rooms.push(row);
    }
    // every floor needs at least one way down that skips the boss hall
    for (let r = 0; r < ROWS - 1; r++) {
      const ok = []; for (let c = 0; c < COLS; c++) { const Bm = rooms[r + 1][c]; if (!(Bm && Bm.boss)) ok.push(c); }
      if (!ok.some(c => rooms[r][c] && rooms[r + 1][c])) { const c = ok[Math.floor(R() * ok.length)]; if (!rooms[r][c]) rooms[r][c] = mkRoom(r, c, false); if (!rooms[r + 1][c]) rooms[r + 1][c] = mkRoom(r + 1, c, false); }
    }
    const all = new Set(); rooms.forEach(row => row.forEach(Rm => Rm && all.add(Rm)));
    // shafts down: a hole through the floor with a chain hanging from the ceiling to climb (may widen the room below)
    const shafts = [];
    for (let r = 0; r < ROWS - 1; r++) {
      const cols = []; for (let c = 0; c < COLS; c++) { const A = rooms[r][c], Bm = rooms[r + 1][c]; if (A && Bm && !Bm.boss) cols.push(c); }
      for (let i = cols.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [cols[i], cols[j]] = [cols[j], cols[i]]; }
      const n = Math.min(cols.length, 1 + (R() < 0.45 ? 1 : 0));
      for (let k = 0; k < n; k++) {
        const A = rooms[r][cols[k]], Bm = rooms[r + 1][cols[k]], acx = (A.x0 + A.x1) >> 1;
        if (acx - 1 < Bm.x0) Bm.x0 = acx - 1; if (acx + 2 > Bm.x1) Bm.x1 = acx + 2;
        const lo = Math.max(A.x0, Bm.x0) + 1, hi = Math.min(A.x1, Bm.x1) - 2, hx = lo + Math.floor(R() * Math.max(1, hi - lo + 1));
        shafts.push({ A, B: Bm, hx, cx: hx + (R() < 0.5 ? 0 : 1) });
      }
    }
    for (const Rm of all) air(Rm.x0, Rm.y0, Rm.x1, Rm.y1);
    // corridors along each floor, three blocks tall; the ones that reach the boss hall become its doors
    const doors = [];
    for (let r = 0; r < ROWS; r++) {
      const list = [...new Set(rooms[r].filter(Boolean))].sort((a, b) => a.x0 - b.x0), fy = floorY(r);
      for (let i = 1; i < list.length; i++) {
        const A = list[i - 1], Bm = list[i];
        air(A.x1 + 1, fy - 3, Bm.x0 - 1, fy - 1);
        if (Bm.boss) for (let y = fy - 3; y < fy; y++) doors.push([Bm.x0 - 1, y]);
        if (A.boss) for (let y = fy - 3; y < fy; y++) doors.push([A.x1 + 1, y]);
      }
    }
    for (const sh of shafts) { air(sh.hx, sh.A.fy, sh.hx + 1, sh.B.y0 - 1); for (let y = sh.A.y0; y <= sh.B.y1; y++) put(sh.cx, y, CHAIN); }
    // the way in: a doorway through the outer wall on the side facing the village, dug through to the nearest cavern
    const E = rooms[0][entCol], efy = E.fy, exitX = entRight ? cx1 + 2 : cx0 - 2, exitY = efy - 2;
    if (entRight) air(E.x1 + 1, efy - 3, cx1 + 3, efy - 1); else air(cx0 - 3, efy - 3, E.x0 - 1, efy - 1);
    let best = null;
    for (let pass = 0; pass < 2 && !best; pass++) {
      let bd = 1e9;
      for (const g of big) {
        const gi = g.py * WW + g.px; if (tiles[gi] !== AIR || walls[gi] === 4) continue;
        if (g.px > cx0 - 6 && g.px < cx1 + 6 && g.py > cy0 - 6 && g.py < cy1 + 6) continue;
        if (pass === 0 && (entRight ? g.px < cx1 : g.px > cx0)) continue;
        const d = Math.hypot(g.px - exitX, (g.py - exitY) * 1.3); if (d < bd) { bd = d; best = g; }
      }
    }
    protect = [cx0, cy0, cx1, cy1];
    if (best) tunnel(exitX + (entRight ? 1 : -1), exitY, best.px, best.py, 1.6, null);
    protect = null;
    // dressing
    const used = new Set(), mark = (x, y) => used.add(y * WW + x);
    const take = (Rm, gap) => {
      const a = [];
      for (let x = Rm.x0; x <= Rm.x1; x++) {
        if (!isAir(x, Rm.y1) || tiles[(Rm.y1 + 1) * WW + x] !== CRYPT) continue;
        let free = true; for (let k = -gap; k <= gap; k++) if (used.has(Rm.y1 * WW + x + k)) free = false;
        if (free) a.push(x);
      }
      if (!a.length) return -1; const x = a[Math.floor(R() * a.length)]; mark(x, Rm.y1); return x;
    };
    const hang = (Rm, t, len) => {
      const x = Rm.x0 + 1 + Math.floor(R() * Math.max(1, Rm.x1 - Rm.x0 - 1));
      if (tiles[(Rm.y0 - 1) * WW + x] !== CRYPT) return;
      for (let k = 0; k < len; k++) if (!isAir(x, Rm.y0 + k)) return;
      for (let k = 0; k < len; k++) put(x, Rm.y0 + k, t);
    };
    const rest = [...all].filter(Rm => !Rm.boss), pool = rest.filter(Rm => !Rm.ent);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    for (const Rm of pool.slice(0, 3)) { const x = take(Rm, 1); if (x >= 0) put(x, Rm.y1, CHEST); }
    for (const Rm of rest) {
      const nC = Rm.ent ? 2 : 1 + (R() < 0.5 ? 1 : 0);
      for (let k = 0; k < nC; k++) { const x = take(Rm, 3); if (x >= 0) put(x, Rm.y1, CANDLE); }
      for (let k = Math.floor(R() * 3); k > 0; k--) { const x = take(Rm, 1); if (x >= 0) put(x, Rm.y1, URN); }
      if (R() < 0.6) { const x = take(Rm, 1); if (x >= 0) put(x, Rm.y1, BONES); }
      if (Rm.y1 - Rm.y0 >= 5 && R() < 0.55) hang(Rm, BANNER, 2);
      if (R() < 0.45) hang(Rm, CHAIN, 1 + Math.floor(R() * 3));
      if (R() < 0.7 && isAir(Rm.x0, Rm.y0)) put(Rm.x0, Rm.y0, WEB);
      if (R() < 0.7 && isAir(Rm.x1, Rm.y0)) put(Rm.x1, Rm.y0, WEB);
    }
    const Bh = rooms[ROWS - 1][bossCol], ax = (Bh.x0 + Bh.x1) >> 1;
    put(ax, Bh.y1, ALTAR); for (let k = -1; k <= 2; k++) mark(ax + k, Bh.y1);
    for (let x = Bh.x0 + 2; x <= Bh.x1 - 2; x += 5) if (Math.abs(x - ax) > 2 && isAir(x, Bh.y1)) { put(x, Bh.y1, CANDLE); mark(x, Bh.y1); }
    for (let x = Bh.x0 + 3; x <= Bh.x1 - 3; x += 6) if (Math.abs(x - ax) > 1) { put(x, Bh.y0, BANNER); put(x, Bh.y0 + 1, BANNER); }
    for (let k = 0; k < 3; k++) { const x = Bh.x0 + 2 + Math.floor(R() * (Bh.x1 - Bh.x0 - 3)), len = 1 + Math.floor(R() * 3); for (let j = 0; j < len && isAir(x, Bh.y0 + j); j++) put(x, Bh.y0 + j, CHAIN); }
    put(Bh.x0, Bh.y0, WEB); put(Bh.x1, Bh.y0, WEB);
    for (let k = 0; k < 4; k++) { const x = take(Bh, 1); if (x >= 0) put(x, Bh.y1, BONES); }
    crypt = { entRight, x0: cx0, y0: cy0, x1: cx1, y1: cy1, boss: { x0: Bh.x0, x1: Bh.x1, y0: Bh.y0, y1: Bh.y1, fy: Bh.fy, altar: ax, doors }, door: [exitX, exitY], rooms: [...all].map(Rm => [Rm.x0, Rm.y0, Rm.x1, Rm.y1]), bossDead: false };
  }
  // the crypt may cut through old cave tunnels: make sure its doorway is reachable from the village
  if (crypt) {
    const reach = new Uint8Array(NN), st = [], s0 = (surf[SPX] - 2) * WW + SPX; reach[s0] = 1; st.push(s0);
    while (st.length) { const c = st.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; st.push(nb); } }
    const [ex, ey] = crypt.door;
    if (!reach[ey * WW + W1(ex)]) {
      let best = null;
      for (let pass = 0; pass < 2 && !best; pass++) {
        let bd = 1e9;
        for (let y = SURF_BASE; y < WH - 14; y++) for (let x = 0; x < WW; x++) {
          const i = y * WW + x; if (!reach[i] || y < surf[x] + 6) continue;
          if (x >= crypt.x0 - 2 && x <= crypt.x1 + 2 && y >= crypt.y0 - 2 && y <= crypt.y1 + 2) continue;
          const dx = wdx(x - ex); if (pass === 0 && (crypt.entRight ? dx < -2 : dx > 2)) continue;
          const d = Math.hypot(dx, (y - ey) * 1.2); if (d < bd) { bd = d; best = [ex + dx, y]; }
        }
      }
      if (best) { protect = [crypt.x0, crypt.y0, crypt.x1, crypt.y1]; tunnel(ex, ey, best[0], best[1], 1.6, null); protect = null; }
    }
  }
  // the abandoned cathedral replaces the caves under the village (js/45-catedral-mundo.js); the cave code above stays for later
  if (CATEDRAL) buildCathedral();
  // the far layer behind the back wall: where it opens onto the deep caverns (js/36-profundeza.js)
  buildDepth();
  if (CATEDRAL) cathedralDeep();

}
