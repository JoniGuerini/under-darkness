'use strict';

/* ================= the abandoned cathedral: the world under the village =================
   Built at the end of generate() (06-mundo) when CATEDRAL is on, from the seed alone:
   the old caves are generated first and then everything under the village is replaced:
   a mass of pale limestone (dirt near the top), and inside it the cathedral in four bands (metres of the
   186 m design; the layer is LAYER_K times longer since 2026-10-12, so each band holds LAYER_K times the floors):
     Átrio Soterrado  0-26 m   the ruined stairways down from the caves, four floors of vestibules
     Nave             26-82 m  six floors of tall vaulted halls with columns
     Claustro         82-132 m nine floors of chapels and arcaded walks
     Criptas          132-186m ten floors of low vaults and ossuaries
   joined by doorways on each floor, stairways and shafts with chains between floors (as short as before).
   Then it is dressed: tile decorations (candles, bones, webs...) and the big props
   (43-catedral-objetos), which are baked into the chunk images and cost nothing per frame. */

let CB_S0 = 46, CB_F = 1;                         // the cathedral's top row and how much it is squeezed (1 unless the world is short)
const cbY = d => CB_S0 + Math.round(d * CB_F);     // rows below the cathedral's top (0..LAYER_D) -> tile row
const CB_BANDS = [0, 26, 82, 132, 186].map(v => v * LAYER_K);   // band tops in rows below CB_S0: átrio, nave, claustro, criptas, (ice)
let cathRooms = [], cathEntry = null;
function cathBand(ty) { const d = (ty - CB_S0) / CB_F; return d < CB_BANDS[1] ? 0 : d < CB_BANDS[2] ? 1 : d < CB_BANDS[3] ? 2 : 3; }
function cathZone(tx, ty) { return 5 + cathBand(ty); }
const CATH_SPAWN = {
  5: [[['zombie', 0.6], ['skeleton', 0.4]], 5],
  6: [[['zombie', 0.3], ['vomit', 0.15], ['skeleton', 0.3], ['archer', 0.25]], 8],
  7: [[['zombie', 0.1], ['vomit', 0.13], ['skeleton', 0.22], ['archer', 0.2], ['guard', 0.2], ['ghost', 0.15]], 9],
  8: [[['zombie', 0.13], ['vomit', 0.1], ['skeleton', 0.2], ['archer', 0.1], ['guard', 0.22], ['ghost', 0.25]], 10]
};
const BAND_NAMES = ['atrio', 'nave', 'claustro', 'criptas'];

function buildCathedral() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const R = mulberry32(seed ^ 0x7ca7ed2a);
  CB_S0 = surf[SPX] + CAVE_D; CB_F = Math.min(1, (WH - 7 - CB_S0) / (LAYER_D + 2));   // the caves (js/56-caverna-mundo.js) fill the CAVE_D metres above
  const occ = new Uint8Array(NN);   // 1 masonry, 2 inside a room or passage
  cathRooms = [];
  const X42 = n => { try { const v = eval(n); return (v < 30 ? WMAT[v] : MAT[v] || DECO[v]) ? v : 0; } catch (e) { return 0; } };
  const FRISO = X42('CT_FRISO'), LAPIDE = X42('CT_LAPIDE'), MUSGO = X42('CT_MUSGO'), MARMORE = X42('CT_MARMORE'), PILASTRA = X42('CT_PILASTRA'), TIJOLO = X42('CT_TIJOLO'), ARDOSIA = X42('CT_ARDOSIA'), W_ARCADA = X42('WCT_ARCADA'), W_MARMORE = X42('WCT_MARMORE');
  const inside = (x, y) => occ[I(x, y)] === 2;

  // ---------- 2. the rock: dirt up top, then limestone with dirt pockets, then limestone ----------
  for (let x = 0; x < WW; x++) {
    const sx = surf[x], yBed = WH - 3 - ((hash2(x, 0, seed) * 2) | 0);   // the bedrock row only depends on the column
    for (let y = CAVE_D ? Math.max(sx, CB_S0) : sx; y < WH; y++) {
      const i = y * WW + x, d = CAVE_D ? y - CB_S0 + 12 : y - sx;   // under the caves: no dirt, limestone with dirt pockets first
      if (y >= yBed) { tiles[i] = BEDROCK; walls[i] = 3; continue; }
      if (d < 4) { if (!SOLID[tiles[i]]) tiles[i] = DIRT; continue; }
      // the wobble is under ±4.5, so from d 29 on it is always plain limestone (dd >= 24): the same tile without the noise
      // (most of the layer, and every row under it down to the bottom until the next layer writes over them)
      if (d >= 29) { tiles[i] = CT_CALCARIO; walls[i] = WCT_CALCARIO; continue; }
      const dd = d + (depthNz(x, y, 40, seed ^ 0x51c1) - 0.5) * 9;
      tiles[i] = dd < 9 ? DIRT : dd < 24 && depthNz(x, y, 50, seed ^ 0x51c2) > 0.42 ? CT_CALC_TERRA : CT_CALCARIO;
      walls[i] = dd < 11 ? 1 : WCT_CALCARIO;
    }
    // grass back on any old tunnel mouth that got filled
    const i0 = sx * WW + x; if (tiles[i0] === DIRT && tileAt(x, sx - 1) === AIR && walls[i0] === 0) tiles[i0] = GRASS;
  }
  // a few natural fissures in the limestone (dead ends, bones and ore show up there)
  for (let y = cbY(10); y < cbY(LAYER_D - 2); y++) for (let x = 0; x < WW; x++) {
    const n = depthNz(x, y, 38, seed ^ 0x51c3), m = depthNz(x, y, 90, seed ^ 0x51c4);
    if (Math.abs(n - 0.5) < 0.018 && m > 0.55) tiles[y * WW + x] = AIR;
  }

  // ---------- 3. rooms ----------
  const STY = [
    { mas: CT_CANTARIA, floor: CT_LAJE, wall: WCT_CANTARIA, ruin: 0.3, moss: 1 },                                   // átrio
    { mas: CT_CANTARIA, floor: CT_LAJE, wall: W_ARCADA || WCT_CANTARIA, ruin: 0.12, vault: ARDOSIA, pil: PILASTRA, lintel: FRISO },   // nave
    { mas: CT_CANTARIA, floor: CT_LAJE, wall: WCT_REBOCO, ruin: 0.16, brick: 1, lintel: FRISO },                    // claustro
    { mas: CT_CRIPTA, floor: CT_CRIPTA, wall: WCT_CRIPTA, ruin: 0.1, brick: 1 }                                      // criptas
  ];
  const wallOf = (x, y, w) => y < surf[W1(x)] + 2 ? 0 : w;
  const free = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) { if (y < 1 || y >= WH - 4) return false; for (let x = x0; x <= x1; x++) if (occ[I(x, y)] >= 2) return false; } return true; };
  const masAt = (x, y, st) => {
    const i = I(x, y); if (occ[i] === 2 || y < surf[W1(x)]) return;
    const n = depthNz(x, y, 60, seed ^ 0x51d1);
    tiles[i] = n > 1 - st.ruin * 1.6 ? (MUSGO && st.moss && hash2(x, y, 0x51d2) < 0.5 ? MUSGO : CT_RUINA) : TIJOLO && st.brick && depthNz(x, y, 45, seed ^ 0x51d3) > 0.7 ? TIJOLO : st.mas; occ[i] = 1;
  };
  function room(x0, w, fy, h, band, kind, o) {
    o = o || {};
    const x1 = x0 + w - 1, top = fy - h, st = Object.assign({}, STY[band], o.st || {});
    if (!free(x0 - 2, x1 + 2, top - 2, fy + 1)) return null;
    const vd = o.vd != null ? o.vd : band === 1 ? 2 + (R() * 3 | 0) : band === 2 ? 1 + (R() * 2 | 0) : R() < 0.5 ? 1 : 0;
    const bayW = o.bay || (band === 1 ? 8 + (R() * 5 | 0) : band === 2 ? 6 + (R() * 4 | 0) : 5 + (R() * 3 | 0));
    const nb = Math.max(1, Math.round(w / bayW)), bw = w / nb, ceil = new Int16Array(w), cols = [];
    for (let k = 0; k < w; k++) { const f = ((k + 0.5) / bw) % 1, t = Math.abs(2 * f - 1); ceil[k] = top + Math.round(vd * Math.pow(t, 1.6)); }
    for (let k = 1; k < nb; k++) cols.push(x0 + Math.round(k * bw) - (R() < 0.5 ? 1 : 0));
    const Rm = { x0, x1, w, top, fy, h, band, kind, st, ceil, cols, i: cathRooms.length };
    for (let y = top - 2; y <= fy + 1; y++) for (let x = x0 - 2; x <= x1 + 2; x++) {
      const i = I(x, y); if (occ[i] === 2) continue;
      const k = x - x0, inX = k >= 0 && k < w;
      if (inX && y >= ceil[k] && y < fy) { tiles[i] = AIR; occ[i] = 2; }
      else if (inX && y === fy) { tiles[i] = st.floor; occ[i] = 1; }
      else if (inX && y < ceil[k] && y >= top - 2 && st.vault && occ[i] !== 3) { tiles[i] = st.vault; occ[i] = 1; }
      else if (st.pil && (x === x0 - 1 || x === x1 + 1) && y >= top && y < fy && occ[i] !== 3) { tiles[i] = st.pil; occ[i] = 1; }
      else masAt(x, y, st);
      walls[i] = st.wall;
    }
    if (o.lower) for (let y = fy - o.lower; y < fy; y++) for (let x = x0; x <= x1; x++) walls[I(x, y)] = o.lowerWall;   // panelled lower walls
    cathRooms.push(Rm); return Rm;
  }
  // a passage on one floor between two rooms (or out into the rock): air rows fy-h..fy-1, lined like a room
  function passage(xa, xb, fy, h, st) {
    for (let x = xa; x <= xb; x++) {
      for (let y = fy - h; y < fy; y++) { const i = I(x, y); tiles[i] = AIR; occ[i] = 2; walls[i] = st.wall; }
      const c = I(x, fy - h - 1); if (occ[c] !== 2 && occ[c] !== 3) { masAt(x, fy - h - 1, st); if (st.lintel && occ[c] === 1) tiles[c] = st.lintel; walls[c] = st.wall; }
      const f = I(x, fy); if (occ[f] !== 2 && occ[f] !== 3) { tiles[f] = st.floor; occ[f] = 1; walls[f] = st.wall; }
      const g = I(x, fy + 1); if (occ[g] === 0) masAt(x, fy + 1, st);
    }
  }
  // a stairway: from the floor row (x, y) down to row yEnd, one row per two columns, h tall
  function stairs(x, y, dir, yEnd, h, st, steep) {
    while (true) {
      const run = steep && steep-- > 0 ? 1 : 2;
      for (let s = 0; s < run; s++) {
        for (let yy = y - h; yy < y; yy++) { const i = I(x, yy); tiles[i] = AIR; occ[i] = 2; walls[i] = wallOf(x, yy, st.wall); }
        const c = I(x, y - h - 1); if (occ[c] === 0 || occ[c] === 1) { if (occ[c] === 0) masAt(x, y - h - 1, st); walls[c] = wallOf(x, y - h - 1, st.wall); }
        const f = I(x, y); if (occ[f] !== 2 && occ[f] !== 3) { tiles[f] = st.floor; occ[f] = 1; walls[f] = wallOf(x, y, st.wall); }
        for (let k = 1; k <= 2; k++) { const g = I(x, y + k); if (occ[g] === 0) masAt(x, y + k, st); }
        x += dir;
      }
      if (y >= yEnd) break;
      y++;
    }
    return [x, y];
  }
  // a shaft with a chain to climb: (x, x+1) from row ya down to row yb (both air)
  function shaft(x, ya, yb, st) {
    for (let y = ya; y <= yb; y++) for (let dx = -1; dx <= 2; dx++) {
      const i = I(x + dx, y);
      if (dx === 0 || dx === 1) { if (occ[i] !== 2 || SOLID[tiles[i]]) tiles[i] = AIR; occ[i] = 2; walls[i] = st.wall; }
      else if (occ[i] === 0) { masAt(x + dx, y, st); walls[i] = st.wall; }
    }
    for (let y = ya; y <= yb; y++) { const i = I(x, y); if (tiles[i] === AIR) tiles[i] = CHAIN; }
  }
  // fill one floor of a band with rooms all the way round the world
  function floor(band, fy, wMin, wMax, hMin, hMax, gMin, gMax, kinds) {
    const list = []; let x = (R() * WW) | 0; const end = x + WW - 6;
    while (x < end) {
      const w = wMin + (R() * (wMax - wMin + 1) | 0), h = hMin + (R() * (hMax - hMin + 1) | 0);
      if (x + w + 3 > end) break;
      const kind = kinds[(R() * kinds.length) | 0];
      const Rm = room(x, w, fy, h, band, kind, kind === 'capela' ? (R() < 0.5 && W_MARMORE ? { st: { floor: MARMORE || CT_LAJE, wall: W_MARMORE } } : { lower: 3, lowerWall: WCT_PAINEL, st: { floor: MARMORE || CT_LAJE } }) : kind === 'ossario' ? { st: { mas: CT_OSSARIO, wall: WCT_OSSARIO } } : kind === 'tumulos' ? { st: { floor: LAPIDE || CT_CRIPTA } } : kind === 'principal' ? { st: { floor: CT_MOSAICO } } : null);
      if (Rm) list.push(Rm);
      x += w + gMin + (R() * (gMax - gMin + 1) | 0);
    }
    // doorways and passages between neighbours on this floor
    for (let k = 0; k < list.length; k++) {
      const A = list[k], B = list[(k + 1) % list.length]; if (A === B) break;
      let gap = W1(B.x0 - A.x1) - 1; if (gap > 46 || (list.length > 3 && R() < 0.12)) continue;
      const hh = Math.min(A.h, B.h, band === 1 ? 5 : band === 3 ? 3 : 4);
      passage(A.x1 + 1, A.x1 + gap, fy, hh, STY[band]);
    }
    return list;
  }

  // the bands: the floors of the 186 m design (one átrio, two naves, three claustros, three criptas) repeated down
  // the LAYER_K times longer layer at the same spacing, so rooms and the climbs between floors keep their size.
  // [band, first floor below the band's top, spacing, rows kept under the last floor, then the design floors' rooms
  // in turn: [wMin, wMax, hMin, hMax, gMin, gMax, kinds]]; with LAYER_K 3 that is 4 átrio, 6 nave, 9 claustro, 10 cripta floors
  const FLOORS = [
    [0, 21, 18, 3, [[9, 18, 6, 8, 10, 30, ['vestibulo', 'sala']]]],
    [1, 26, 28, 2, [[24, 50, 15, 19, 4, 14, ['nave', 'principal', 'nave']], [22, 46, 15, 21, 4, 14, ['nave', 'nave', 'capela']]]],
    [2, 18, 16, 4, [[10, 28, 8, 11, 4, 10, ['capela', 'claustro', 'sala']], [10, 28, 8, 11, 4, 10, ['capela', 'claustro', 'biblioteca']], [10, 30, 8, 11, 4, 10, ['claustro', 'capela', 'sala']]]],
    [3, 13, 15, 14, [[8, 22, 5, 7, 4, 12, ['cripta', 'ossario', 'cripta']], [8, 22, 5, 7, 4, 12, ['cripta', 'ossario', 'tumulos']], [8, 20, 5, 6, 4, 12, ['cripta', 'tumulos', 'ossario']]]]
  ];
  const F = {}, ORDER = [];
  for (const [band, off, step, tail, kinds] of FLOORS) {
    const f0 = CB_BANDS[band] + off, n = Math.floor((CB_BANDS[band + 1] - tail - f0) / step) + 1;
    for (let j = 0; j < n; j++) {
      const [wa, wb, ha, hb, ga, gb, ks] = kinds[j % kinds.length], id = BAND_NAMES[band] + j;
      F[id] = floor(band, cbY(f0 + j * step), wa, wb, ha, hb, ga, gb, ks); F[id].band = band; ORDER.push(id);
    }
  }
  F.atrio = F.atrio0;

  // columns: arcades in the naves and cloisters, short piers in the crypts
  for (const Rm of cathRooms) {
    if (Rm.kind === 'vestibulo' || Rm.kind === 'ossario' || Rm.kind === 'biblioteca') continue;
    for (const cx of Rm.cols) for (let y = Rm.ceil[cx - Rm.x0]; y < Rm.fy; y++) { const i = I(cx, y); if (tiles[i] === AIR) tiles[i] = CT_COLUNA; }
  }

  // ---------- 4. between floors: shafts with chains, and the odd grand stairway ----------
  const overlapX = (A, B) => { const a0 = A.x0, a1 = A.x1; let b0 = B.x0, b1 = B.x1; const d = Math.round((a0 - b0) / WW) * WW; b0 += d; b1 += d; return [Math.max(a0, b0) + 2, Math.min(a1, b1) - 3]; };
  for (let k = 0; k < ORDER.length - 1; k++) {
    const U = F[ORDER[k]], L = F[ORDER[k + 1]], pairs = [];
    for (const A of U) for (const B of L) { const [o0, o1] = overlapX(A, B); if (o1 - o0 >= 2) pairs.push([A, B, o0, o1]); }
    for (let j = pairs.length - 1; j > 0; j--) { const q = (R() * (j + 1)) | 0; [pairs[j], pairs[q]] = [pairs[q], pairs[j]]; }
    const want = Math.min(pairs.length, (U.band === 0 ? 2 : 3 + (R() < 0.5 ? 1 : 0)) * WSC);
    for (let j = 0; j < want; j++) {
      const [A, B, o0, o1] = pairs[j], st = STY[B.band];
      if (j === 0 && (U.band === 1 || U.band === 2) && L.band <= 2 && R() < 0.75) {   // the grand stairways: in the naves and claustros
        // a stairway: out of A's floor along one side, down through the rock into B
        const dir = R() < 0.5 ? 1 : -1, sx = dir > 0 ? o0 : o1;
        stairs(sx, A.fy, dir, B.fy, 4, st);
        continue;
      }
      const x = o0 + ((R() * (o1 - o0 - 1)) | 0);
      shaft(x, A.fy - 2, B.fy - 1, st);
    }
  }

  // ---------- 5. the way in: a broken stairway down from the village sign ----------
  {
    const st = { mas: CT_CANTARIA, floor: CT_LAJE, wall: WCT_CANTARIA, ruin: 0.45 };
    const ex = SPX + VIL_HALF + 5, ey = surf[W1(ex)];
    // a stone portal sunk in the ground: the opening and the first steps
    const target = F.atrio.length ? F.atrio.reduce((b, Rm) => Math.abs(W1(Rm.x0 - ex)) < Math.abs(W1(b.x0 - ex)) ? Rm : b) : null;
    for (let x = ex - 9; x <= ex + 11; x++) for (let y = 2; y < WH - 2; y++) if (tiles[I(x, y)] === TRUNK && tiles[I(x, y + 1)] !== TRUNK) fellTree(x, y);
    // with the caves on, the stairway only goes a little way down: the caves take over from there (56-caverna-mundo)
    const [sx2, sy2] = stairs(ex, ey, 1, CAVE_D ? ey + 14 : cbY(21), 4, st, 7);
    cathEntry = [ex, ey];
    if (CAVE_D) cavePortalEnd = [sx2, sy2];
    // a ruined stone portico over the first steps, open towards the village: a free-standing column on
    // the left you walk past, a solid pier on the right, a frieze and a small gable on top
    const PT = (x, y, t) => { tiles[I(x, y)] = t || (hash2(x, y, seed ^ 0x9071) < 0.3 ? CT_RUINA : CT_CANTARIA); };
    for (let y = ey - 8; y < ey; y++) for (let x = ex - 4; x <= ex + 6; x++) { const i = I(x, y); if (!SOLID[tiles[i]] || y < surf[W1(x)]) { tiles[i] = AIR; walls[i] = 0; } }
    for (let y = ey - 5; y < ey; y++) { tiles[I(ex - 2, y)] = CT_COLUNA; PT(ex + 4, y); PT(ex + 5, y); }
    for (let x = ex - 3; x <= ex + 6; x++) PT(x, ey - 6, FRISO || CT_CANTARIA);
    for (let x = ex - 2; x <= ex + 5; x++) if (!(x === ex - 2 && hash2(ex, ey, seed) < 0.5)) PT(x, ey - 7);
    for (let x = ex; x <= ex + 3; x++) PT(x, ey - 8);
    for (let y = ey - 5; y < ey; y++) for (let x = ex - 1; x <= ex + 3; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WCT_CANTARIA; }
    for (let x = ex - 4; x < ex; x++) { const i = I(x, ey); tiles[i] = CT_LAJE; for (let y = ey + 1; y < ey + 3; y++) if (!SOLID[tiles[I(x, y)]]) tiles[I(x, y)] = CT_CALC_TERRA; }
    tiles[I(ex - 4, ey - 1)] = TORCH;
    // flat to the nearest átrio room (or make one right here)
    const toHall = (sx2, sy2, st) => {
      let hall = cathRooms.find(Rm => Rm.band === 0 && W1(sx2 - Rm.x0) <= Rm.w);
      if (!hall) hall = room(sx2 + 1, 16, sy2, 7, 0, 'vestibulo', { st: { ruin: 0.35 } }) || target;
      if (hall && !inside(sx2, sy2 - 1)) { const tx = W1(hall.x0 - sx2) < WW / 2 ? sx2 + W1(hall.x0 - sx2) : sx2; if (tx > sx2) passage(sx2, tx, sy2, 4, st); }
    };
    if (!CAVE_D) toHall(sx2, sy2, st);
    // under the caves: a ruined stairway down from each grotto where the atrium's vault caved in
    else for (const [gx, gy] of caveExits) {
      const sr = { mas: CT_CANTARIA, floor: CT_LAJE, wall: WCT_CANTARIA, ruin: 0.5, moss: 1 };
      const [qx, qy] = stairs(gx, gy, 1, cbY(21), 4, sr);
      toHall(qx, qy, sr);
      if (cathEntry[1] < CB_S0 - 20) cathEntry = [gx, gy];
    }
    // the dirt still holds on up here: dirt walls, roots and soil in the stone
    for (let y = ey - 1; y < (CAVE_D ? ey + 16 : cbY(24)); y++) for (let x = ex - 2; x < ex + 50; x++) {
      const i = I(x, y), d = y - surf[W1(x)];
      if (d < 0) continue;
      if (occ[i] === 1 && d < 14 && hash2(x, y, seed ^ 0x5e1) < 0.5 - d * 0.03) tiles[i] = CT_CALC_TERRA;
      if (walls[i] && d < 9) walls[i] = d < 5 ? 1 : (hash2(x, y, 0x5e2) < 0.5 ? 1 : WCT_CANTARIA);
    }
    for (let y = ey; y < ey + 4; y++) for (let x = ex - 1; x < ex + 6; x++) { const i = I(x, y); if (tiles[i] === AIR) walls[i] = x <= ex + 5 ? WCT_CANTARIA : y - surf[W1(x)] < 2 ? 0 : walls[i]; }
  }

  // ---------- 7. damage: rubble under broken vaults, collapsed corners ----------
  const R2 = mulberry32(seed ^ 0x2ca7);
  for (const Rm of cathRooms) {
    const n = Rm.band === 0 ? 2 : Rm.w > 20 ? 1 + (R2() < 0.6) : R2() < 0.5 ? 1 : 0;
    for (let k = 0; k < n; k++) {
      const cx = Rm.x0 + 1 + ((R2() * (Rm.w - 2)) | 0), r = 1 + ((R2() * 3) | 0);
      for (let dx = -r - 1; dx <= r + 1; dx++) { const hgt = r + 1 - Math.abs(dx) - (R2() < 0.3 ? 1 : 0); for (let j = 1; j <= hgt; j++) { const i = I(cx + dx, Rm.fy - j); if (tiles[i] === AIR || tiles[i] === CT_COLUNA) tiles[i] = CT_ESCOMBRO; } }
      // the hole in the vault the stones came from
      const top = Rm.ceil[clamp(cx - Rm.x0, 0, Rm.w - 1)];
      for (let dx = -1; dx <= 1; dx++) { const i = I(cx + dx, top - 1); if (occ[i] === 1 && R2() < 0.7) tiles[i] = CT_RUINA; }
    }
  }

  // ---------- 8. ore veins in the limestone ----------
  const R4 = mulberry32(seed ^ 0x0e5ca7);
  const vein = (ore, n, d0, d1, lmin, lmax) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = cbY(d0) + ((R4() * (cbY(d1) - cbY(d0))) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y); if ((tiles[i] === CT_CALCARIO || tiles[i] === CT_CALC_TERRA) && y > surf[W1(x)] + 7) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), 2, WH - 5);
      }
    }
  };
  vein(COAL, 150 * WSC * LAYER_K, 6, LAYER_D - 2, 3, 7); vein(IRON, 140 * WSC * LAYER_K, 6, LAYER_D - 2, 2, 6);   // coal and iron in the cathedral (102: one metal per layer)

  // ---------- 9. everything reachable from the village ----------
  const reach = new Uint8Array(NN), stack = [];
  // grows the reached set from s0 (digging only opens rock, so what was reached stays reached; no need to start over)
  const flood = (s0 = I(cathEntry[0], cathEntry[1] - 1)) => {
    if (SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0);
    while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } }
  };
  flood();
  const goals = cathRooms.map(Rm => { let gx = Rm.x0 + (Rm.w >> 1); for (let k = 0; k < Rm.w; k++) { const x = Rm.x0 + ((k + (Rm.w >> 1)) % Rm.w); if (!SOLID[tiles[I(x, Rm.fy - 1)]]) { gx = x; break; } } return [gx, Rm.fy - 1, Rm.band]; });
  for (const [gx, gy, band] of goals) {
    if (reach[I(gx, gy)]) continue;
    // nearest reached tile above-ish: drop a chained shaft down to here, or a passage across
    let best = null, bd = 1e9;
    for (let y = Math.max(2, gy - 40); y <= Math.min(WH - 6, gy + 6); y++) for (let dx = -40; dx <= 40; dx++) {
      const i = I(gx + dx, y); if (!reach[i] || SOLID[tiles[i]] || !SOLID[tiles[i + WW]]) continue;
      const d = Math.abs(dx) * 1.2 + Math.abs(y - gy); if (d < bd) { bd = d; best = [gx + dx, y]; }
    }
    if (!best) continue;
    const st = STY[band], [bx, by] = best;
    if (by < gy - 2) { const fy = by + 1; passage(Math.min(bx, gx), Math.max(bx, gx), fy, 3, st); shaft(gx, fy - 2, gy, st); }
    else passage(Math.min(bx, gx), Math.max(bx, gx), gy + 1, 3, st);
    flood(I(bx, by));
  }

  // ---------- 10. tile dressing: candles, bones, webs, roots (no loot chests since 2026-10-10) ----------
  const R3 = mulberry32(seed ^ 0xd3c0);
  const floorOk = (x, y) => tiles[I(x, y)] === AIR && SOLID[tiles[I(x, y + 1)]] && tiles[I(x, y + 1)] !== CT_ESCOMBRO && tiles[I(x, y - 1)] === AIR;
  const ceilOk = (x, y) => tiles[I(x, y)] === AIR && SOLID[tiles[I(x, y - 1)]] && tiles[I(x, y + 1)] === AIR;
  for (const Rm of cathRooms) {
    const B = Rm.band, put = (x, y, t) => { tiles[I(x, y)] = t; };
    const n = Math.max(1, Math.round(Rm.w / 9));
    for (let k = 0; k < n; k++) {
      const x = Rm.x0 + ((R3() * Rm.w) | 0), y = Rm.fy - 1; if (!floorOk(x, y)) continue;
      const r = R3();
      if (r < 0.32) put(x, y, B === 0 ? TORCH : CANDLE);
      else if (r < 0.5) put(x, y, CT_VELAS);
      else if (r < 0.66) put(x, y, B >= 2 ? CT_CRANIOS : BONES);
      else if (r < 0.78) put(x, y, B <= 1 ? CT_CACOS : URN);
      else if (r < 0.88) put(x, y, BONES);
    }
    // corners: webs; átrio: roots from the vault
    for (const x of [Rm.x0, Rm.x1]) { const y = Rm.ceil[x - Rm.x0]; if (R3() < 0.6 && ceilOk(x, y)) put(x, y, R3() < 0.5 ? CT_TEIA : WEB); }
    if (B === 0) for (let k = 0; k < 4; k++) { const x = Rm.x0 + ((R3() * Rm.w) | 0), y = Rm.ceil[x - Rm.x0]; if (ceilOk(x, y)) { const len = 1 + ((R3() * 2) | 0); for (let j = 0; j < len && tiles[I(x, y + j)] === AIR; j++) put(x, y + j, CT_RAIZ); } }
    if (B === 1 && Rm.h > 14 && R3() < 0.6) { const x = Rm.x0 + 2 + ((R3() * (Rm.w - 4)) | 0), y = Rm.ceil[x - Rm.x0]; if (ceilOk(x, y)) { put(x, y, BANNER); put(x, y + 1, BANNER); } }
    if (R3() < 0.35) { const x = Rm.x0 + 1 + ((R3() * (Rm.w - 2)) | 0), y = Rm.ceil[x - Rm.x0]; if (ceilOk(x, y)) for (let j = 0, len = 1 + ((R3() * 3) | 0); j < len && tiles[I(x, y + j)] === AIR; j++) put(x, y + j, CHAIN); }
  }

  // ---------- 10b. columns run from floor to vault; trees only stand on soil ----------
  for (let x = 0; x < WW; x++) for (let y = 1; y < WH - 1; y++) {
    if (tiles[y * WW + x] !== CT_COLUNA || tiles[(y - 1) * WW + x] === CT_COLUNA) continue;
    let y1 = y; while (y1 + 1 < WH && tiles[(y1 + 1) * WW + x] === CT_COLUNA) y1++;
    let top = y, bot = y1;
    while (top > 1 && tiles[(top - 1) * WW + x] === AIR && y1 - top < 40) top--;
    while (bot < WH - 2 && tiles[(bot + 1) * WW + x] === AIR && bot - y < 40) bot++;
    const ok = SOLID[tiles[(top - 1) * WW + x]] && SOLID[tiles[(bot + 1) * WW + x]] && !SEETHRU[tiles[(bot + 1) * WW + x]];
    for (let yy = ok ? top : y; yy <= (ok ? bot : y1); yy++) tiles[yy * WW + x] = ok ? CT_COLUNA : AIR;
    y = bot;
  }
  for (let x = 0; x < WW; x++) for (let y = 2; y < WH - 1; y++) { const t = tiles[y * WW + x]; if (t === TRUNK && tiles[(y + 1) * WW + x] !== TRUNK && tiles[(y + 1) * WW + x] !== GRASS && tiles[(y + 1) * WW + x] !== DIRT) fellTree(x, y); }

  // ---------- 11. the big props ----------
  placeProps(occ);
}

/* ---------- props: placement ---------- */
const PROPS = [], propBuckets = new Map(), propBySup = new Map(), propGone = new Set();
const PROP_PLAN = {   // what each kind of room gets: [id, how many per 10 blocks of width, max]
  vestibulo: { chao: [['estatua_santo', 0.5, 2], ['candelabro_pe', 0.6, 2], ['escombro_grande', 0.4, 1], ['coluna_tombada', 0.3, 1]], teto: [['teia_grande', 0.5, 1], ['lustre', 0.3, 1]], fundo: [['arco_ogiva', 0.5, 1], ['nicho_santo', 0.4, 1], ['tocheiro_parede', 0.6, 2]] },
  sala: { chao: [['candelabro_pe', 0.5, 2], ['caixao', 0.3, 1], ['ossos_monte', 0.3, 1], ['escombro_grande', 0.3, 1]], teto: [['lustre', 0.3, 1], ['teia_grande', 0.4, 1]], fundo: [['afresco', 0.4, 1], ['tocheiro_parede', 0.6, 2], ['quadro_rasgado', 0.3, 1]] },
  nave: { chao: [['banco', 1.4, 8], ['candelabro_pe', 0.5, 4], ['estatua_santo', 0.25, 2], ['estatua_anjo', 0.2, 1], ['coluna_tombada', 0.15, 1], ['sino_caido', 0.1, 1]], teto: [['lustre', 0.35, 3], ['estandarte', 0.4, 3], ['incensario', 0.2, 2], ['gaiola', 0.1, 1]], fundo: [['vitral_alto', 0.5, 5], ['vitral_rosacea', 0.12, 1], ['arco_ogiva', 0.2, 2], ['tocheiro_parede', 0.3, 3]] },
  principal: { chao: [['altar', 0.2, 1], ['pulpito', 0.15, 1], ['cadeira_bispo', 0.1, 1], ['banco', 1.4, 10], ['candelabro_pe', 0.6, 4], ['estatua_anjo', 0.25, 2]], teto: [['lustre', 0.4, 3], ['estandarte', 0.4, 4]], fundo: [['orgao', 0.1, 1], ['vitral_rosacea', 0.15, 1], ['vitral_alto', 0.5, 5], ['tocheiro_parede', 0.3, 3]] },
  capela: { chao: [['altar', 0.4, 1], ['banco', 0.8, 3], ['candelabro_pe', 0.6, 2], ['pia_batismal', 0.3, 1], ['estatua_santo', 0.3, 1]], teto: [['incensario', 0.4, 1], ['lustre', 0.3, 1]], fundo: [['vitral_alto', 0.5, 2], ['nicho_santo', 0.4, 1], ['cruz_caida', 0.3, 1], ['afresco', 0.3, 1], ['tocheiro_parede', 0.5, 2]] },
  claustro: { chao: [['estatua_santo', 0.4, 2], ['pia_batismal', 0.2, 1], ['candelabro_pe', 0.5, 2], ['escombro_grande', 0.3, 1]], teto: [['estandarte', 0.3, 2], ['teia_grande', 0.3, 1]], fundo: [['arco_ogiva', 0.6, 3], ['afresco', 0.4, 2], ['brasao', 0.3, 1], ['tocheiro_parede', 0.6, 3]] },
  biblioteca: { chao: [['pulpito', 0.4, 1], ['candelabro_pe', 0.5, 2], ['cadeira_bispo', 0.3, 1]], teto: [['lustre', 0.4, 1], ['teia_grande', 0.4, 1]], fundo: [['quadro_rasgado', 0.4, 2], ['tocheiro_parede', 0.6, 2]] },
  cripta: { chao: [['sarcofago', 0.6, 2], ['caixao', 0.5, 2], ['ossos_monte', 0.4, 1], ['candelabro_pe', 0.4, 1]], teto: [['corrente_gancho', 0.5, 2], ['gaiola', 0.15, 1], ['teia_grande', 0.4, 1]], fundo: [['nichos_cripta', 0.6, 3], ['tocheiro_parede', 0.6, 2]] },
  tumulos: { chao: [['sarcofago', 1, 3], ['caixao', 0.4, 2], ['candelabro_pe', 0.4, 1]], teto: [['corrente_gancho', 0.4, 2], ['teia_grande', 0.3, 1]], fundo: [['nichos_cripta', 0.8, 3], ['tocheiro_parede', 0.5, 2]] },
  ossario: { chao: [['ossos_monte', 0.8, 3], ['caixao', 0.3, 1]], teto: [['corrente_gancho', 0.4, 1], ['gaiola', 0.2, 1]], fundo: [['nichos_cripta', 0.6, 2], ['tocheiro_parede', 0.5, 2]] }
};
// how a back-wall prop sits: 'chao' stands on the walkable floor (organ, arches), 'janela' joins the room's
// row of windows (one height for all of them, evenly spaced, gaps between), anything else hangs at eye height
const BACK_RULE = { orgao: 'chao', arco_ogiva: 'chao', nichos_cripta: 'chao', cruz_caida: 'chao', vitral_alto: 'janela', vitral_rosacea: 'janela' };
function addProp(def, v, X, Y, sup) {
  const V = def.vars[v], p = { def, v, X, Y, w: V.w, h: V.h, px: V.px, front: def.camada !== 'fundo', sup, key: def.id + ':' + X + ':' + Y, gone: false };
  PROPS.push(p);
  const c0 = Math.floor(X / (CH * T)), c1 = Math.floor((X + V.w - 1) / (CH * T)), r0 = Math.floor(Y / (CH * T)), r1 = Math.floor((Y + V.h - 1) / (CH * T));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const k = r * 64 + c; let a = propBuckets.get(k); if (!a) propBuckets.set(k, a = []); a.push(p); }
  for (const i of sup) { let a = propBySup.get(i); if (!a) propBySup.set(i, a = []); a.push(p); }
  return p;
}
function placeProps() {
  PROPS.length = 0; propBuckets.clear(); propBySup.clear();
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9a0b5);
  const used = new Uint8Array(WW * WH * 2);   // [floor/ceiling layer, back layer] per tile
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (x0 < 1 || x0 + tw >= WW - 1 || y0 < 1 || y0 + th >= WH - 3) return false;   // never across the seam of the world
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = y * WW + x, t = tiles[i]; if (used[i * 2 + layer]) return false; if (SOLID[t] || (needAir && t !== AIR)) return false; if (!walls[i]) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[(y * WW + x) * 2 + layer] = 1; };
  for (const Rm of cathRooms) {
    const plan = PROP_PLAN[Rm.kind]; if (!plan) continue;
    const band = BAND_NAMES[Rm.band];
    // the windows first: one row under the lowest point of the vault, the rose in the middle, lancets spread out
    {
      const okId = id => PROP_DEFS[id] && (!PROP_DEFS[id].faixas || PROP_DEFS[id].faixas.includes(band));
      const wins = (plan.fundo || []).filter(([id]) => BACK_RULE[id] === 'janela' && okId(id));
      let yTop = 0; for (let k = 0; k < Rm.w; k++) yTop = Math.max(yTop, Rm.ceil[k]); yTop += 1;
      const putWin = (def, v, x0) => { const V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T); if (yTop + th > Rm.fy - 3 || !fits(x0, yTop, tw, th, 1, false)) return false; mark(x0 - 1, yTop, tw + 2, th, 1); addProp(def, v, x0 * T + ((tw * T - V.w) >> 1), yTop * T, []); return true; };
      for (const [id, per10, max] of wins.filter(w => w[0] === 'vitral_rosacea')) { const def = PROP_DEFS[id]; if (Math.min(max, Math.round(Rm.w / 10 * per10 + R() * 0.8)) < 1) continue; const tw = Math.ceil(def.vars[0].w / T); putWin(def, 0, Rm.x0 + ((Rm.w - tw) >> 1)); }
      for (const [id, per10, max] of wins.filter(w => w[0] !== 'vitral_rosacea')) {
        const def = PROP_DEFS[id], v = (R() * def.vars.length) | 0, tw = Math.ceil(def.vars[v].w / T), step = tw + 2;
        const slots = Math.floor((Rm.w - 2 + 2) / step), n = Math.min(max, slots, Math.max(1, Math.round(Rm.w / 10 * per10 + R() * 0.8)));
        if (slots < 1) continue;
        const start = Rm.x0 + 1 + ((Rm.w - 2 - (slots * step - 2)) >> 1);
        for (let j = 0; j < n; j++) putWin(def, v, start + Math.round((j + 0.5) * slots / n - 0.5) * step);
      }
    }
    for (const apoio of ['fundo', 'chao', 'teto']) for (const [id, per10, max] of plan[apoio] || []) {
      const def = PROP_DEFS[id]; if (!def || (def.faixas && !def.faixas.includes(band))) continue;
      if (apoio === 'fundo' && BACK_RULE[id] === 'janela') continue;
      let n = Math.min(max, Math.round(Rm.w / 10 * per10 + R() * 0.8)), tries = n * 6;
      while (n > 0 && tries-- > 0) {
        const v = (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
        if (tw > Rm.w || th > Rm.h - 1) break;
        const x0 = Rm.x0 + ((R() * (Rm.w - tw + 1)) | 0); if (x0 < 1 || x0 + tw >= WW - 1) continue;
        if (apoio === 'chao') {
          const y0 = Rm.fy - th; let ok = fits(x0, y0, tw, th, 0, true);
          for (let x = x0; ok && x < x0 + tw; x++) if (!SOLID[tiles[I(x, Rm.fy)]]) ok = false;
          if (!ok) continue;
          mark(x0, y0, tw, th, 0); n--;
          const sup = []; for (let x = x0; x < x0 + tw; x++) sup.push(Rm.fy * WW + x);
          addProp(def, v, x0 * T + ((tw * T - V.w) >> 1), Rm.fy * T - V.h, sup);
        } else if (apoio === 'teto') {
          const cy = Math.max(...Array.from({ length: tw }, (_, k) => Rm.ceil[clamp(x0 + k - Rm.x0, 0, Rm.w - 1)]));
          if (cy + th > Rm.fy - 4) continue;
          let ok = fits(x0, cy, tw, th, 0, true), sup = [];
          for (let x = x0; ok && x < x0 + tw; x++) { const i = I(x, cy - 1); if (SOLID[tiles[i]]) sup.push(i); }
          if (!ok || !sup.length) continue;
          mark(x0, cy, tw, th, 0); n--;
          addProp(def, v, x0 * T + ((tw * T - V.w) >> 1), cy * T, sup);
        } else {
          // on the back wall: standing on the floor (its foot on walkable blocks), or at eye height
          const onFloor = BACK_RULE[id] === 'chao', y0 = onFloor ? Rm.fy - th : Rm.fy - th - 1 - ((R() * 2) | 0);
          if (y0 < Rm.top || y0 + th > Rm.fy) continue;
          let ok = fits(x0, y0, tw, th, 1, false), sup = [];
          for (let x = x0; ok && onFloor && x < x0 + tw; x++) { const i = I(x, Rm.fy); if (!SOLID[tiles[i]] || SEETHRU[tiles[i]]) ok = false; else sup.push(i); }
          if (!ok) continue;
          mark(x0, y0, tw, th, 1); n--;
          addProp(def, v, x0 * T + ((tw * T - V.w) >> 1), onFloor ? Rm.fy * T - V.h : y0 * T + ((th * T - V.h) >> 1), sup);
        }
      }
    }
  }
}
// a tree (trunk base at x, y): the trunk and the crown above it go
function fellTree(x, y) {
  let top = y; while (top > 1 && tiles[(top - 1) * WW + ((x % WW) + WW) % WW] === TRUNK) top--;
  for (let yy = top; yy <= y; yy++) tiles[yy * WW + ((x % WW) + WW) % WW] = AIR;
  for (let yy = top - 10; yy <= top + 1; yy++) for (let dx = -4; dx <= 4; dx++) { if (yy < 0) continue; const i = yy * WW + (((x + dx) % WW) + WW) % WW; if (tiles[i] === LEAVES) tiles[i] = AIR; }
}
// a column lost the block it stands on (or hangs from), or was itself broken: the whole shaft comes down
function columnFalls(x, y) {
  for (const dy of [-1, 1]) {
    let yy = y + dy; if (yy < 0 || yy >= WH || tiles[yy * WW + x] !== CT_COLUNA) continue;
    let n = 0; for (; yy >= 0 && yy < WH && tiles[yy * WW + x] === CT_COLUNA; yy += dy, n++) { const i = yy * WW + x; tiles[i] = AIR; diffs.set(i, AIR); markDirty(x, yy); if (n % 2 === 0) burst(x * T + 6, yy * T + 6, 6, '#b9b3a7', 60, 260, 0.5); }
  }
}
// a block under (or above) a prop was broken: the prop falls apart
function propsLoseSupport(x, y) {
  if (CATEDRAL) columnFalls(x, y);
  const a = propBySup.get(y * WW + x); if (!a) return;
  for (const p of a) if (!p.gone) { p.gone = true; propGone.add(p.key); propDirty(p); burst(p.X + p.w / 2, p.Y + p.h / 2, 14, '#8a8378', 70, 300, 0.6); }
}
function propDirty(p) { for (let Y = p.Y; Y < p.Y + p.h + T; Y += T) for (let X = p.X; X < p.X + p.w + T; X += T) markDirty(Math.floor(Math.min(X, p.X + p.w - 1) / T), Math.floor(Math.min(Y, p.Y + p.h - 1) / T)); }
// all the saved keys stay (a layer generated later, js/312, finds its broken props here when it is built)
function applyPropGone(keys) { propGone.clear(); if (Array.isArray(keys)) for (const k of keys) propGone.add(k); propGoneMark(); }
function propGoneMark() { for (const p of PROPS) if (propGone.has(p.key)) p.gone = true; }

/* ---------- props: drawing into the chunk images ---------- */
function paintProps(ccx, ccy, buf, SZ) {
  const list = propBuckets.get(ccy * 64 + ccx); if (!list) return;
  const X0 = ccx * SZ, Y0 = ccy * SZ;
  let backDeco = null;
  for (let pass = 0; pass < 2; pass++) {
    for (const p of list) {
      if (p.gone || (p.front ? 1 : 0) !== pass) continue;
      const xa = Math.max(p.X, X0), xb = Math.min(p.X + p.w, X0 + SZ), ya = Math.max(p.Y, Y0), yb = Math.min(p.Y + p.h, Y0 + SZ);
      for (let Y = ya; Y < yb; Y++) {
        const row = ((Y / T) | 0) * WW, src = (Y - p.Y) * p.w - p.X, dst = (Y - Y0) * SZ - X0;
        for (let X = xa; X < xb; X++) {
          const c = p.px[src + X]; if (!c) continue;
          const t = tiles[row + ((X / T) | 0)]; if (SOLID[t] && !SEETHRU[t]) continue;
          if (!pass && t !== AIR) { (backDeco || (backDeco = new Set())).add(row + ((X / T) | 0)); }
          buf[dst + X] = c;
        }
      }
    }
    // decorations in front of a wall prop (columns before a window) go back on top of it
    if (!pass && backDeco) for (const i of backDeco) {
      const t = tiles[i], arr = DECO[t]; if (!arr || BLOCKY[t]) continue;
      const gx = i % WW, gy = (i / WW) | 0, sp = decoSprite(t, gx, gy, arr); if (!sp) continue;
      const o = (gy * T - Y0) * SZ + gx * T - X0;
      for (let k = 0; k < T * T; k++) if (sp[k]) buf[o + ((k / T) | 0) * SZ + (k % T)] = sp[k];
    }
  }
}

/* ---------- props: light, glow and flames ---------- */
const visProps = [];
let propFrame = 0;
function propLights(addL, x0, y0, w, h) {
  visProps.length = 0; propFrame++;
  const S = CH * T, NCX = Math.ceil(WW / CH), WP = WW * T, mid = (x0 + w / 2) * T, r0 = Math.max(0, Math.floor(y0 * T / S)), r1 = Math.floor((y0 + h) * T / S);
  for (let r = r0; r <= r1; r++) for (let c = 0; c < NCX; c++) {
    const list = propBuckets.get(r * 64 + c); if (!list) continue;
    for (const p of list) {
      if (p.gone || (!p.def.luz && !p.def.chamas) || p.seenF === propFrame) continue;
      const sh = Math.round((mid - p.X - p.w / 2) / WP) * WP, px = p.X + sh;
      if (px + p.w < x0 * T || px > (x0 + w) * T) continue;
      p.seenF = propFrame; p.sh = sh; visProps.push(p);
      if (p.def.luz) for (const L of p.def.luz) addL(px + L.x, p.Y + L.y, L.r);
    }
  }
}
let propGlowCv = null;
function drawPropGlows(cx, cy, fl) {
  if (!visProps.length) return;
  if (!propGlowCv) propGlowCv = {};
  for (const p of visProps) {
    if (!p.def.luz) continue;
    const g = propGlowCv[p.def.brilho] || (propGlowCv[p.def.brilho] = glow(30, p.def.brilho));
    for (const L of p.def.luz) { lc.globalAlpha = 0.24 * fl * L.r; lc.drawImage(g, Math.round(p.X + p.sh + L.x - cx - 30), Math.round(p.Y + L.y - cy - 32)); }
  }
}
function drawPropFlames(cx, cy) {
  for (const p of visProps) if (p.def.chamas) for (let k = 0; k < p.def.chamas.length; k++) {
    const F = p.def.chamas[k], x = Math.round(p.X + p.sh + F.x - cx), y = Math.round(p.Y + F.y - cy), f = Math.floor(gameTime * 8 + p.X * 0.3 + k * 5) % 3;
    lc.fillStyle = '#ff7a1a'; lc.fillRect(x, y - 2 - (f === 1 ? 1 : 0), 1, 2); lc.fillStyle = '#fff3b0'; lc.fillRect(x, y - 1, 1, 1);
  }
  // candle clusters on the floor
  const wk = WICKS[CT_VELAS];
  if (wk) for (let i = 0; i < emitters.length; i += 3) {
    if (emitters[i + 2] !== CT_VELAS) continue;
    const gx = emitters[i], gy = emitters[i + 1], arr = DECO[CT_VELAS], v = arr ? arr.indexOf(decoSprite(CT_VELAS, gx, gy, arr)) : 0, list = wk[Math.max(0, v)] || wk[0];
    for (let k = 0; k < list.length; k++) { const [px, py] = list[k], x = gx * T + px - cx, y = gy * T + py - cy, f = Math.floor(gameTime * 8 + gx * 3 + k * 5) % 3; lc.fillStyle = '#ff7a1a'; lc.fillRect(x, y - 2 - (f === 1 ? 1 : 0), 1, 2); lc.fillStyle = '#fff3b0'; lc.fillRect(x, y - 1, 1, 1); }
  }
}

/* ---------- the far layer behind the cathedral ---------- */
function cathedralDeep() {
  const has = t => !!DMAT[t];
  const near = new Uint8Array(WW * WH);
  for (const Rm of cathRooms) for (let y = Rm.top - 6; y <= Rm.fy + 3; y++) for (let x = Rm.x0 - 6; x <= Rm.x1 + 6; x++) { if (y < 0 || y >= WH) continue; near[y * WW + ((x % WW) + WW) % WW] = y < Rm.top + 4 ? 2 : 1; }
  for (let y = genDeepA; y < WH; y++) for (let x = 0; x < WW; x++) {   // genDeepA: a later layer (312) redoes only the rows from there down
    const i = y * WW + x, t = DEEPT[i]; if (!t || y < surf[x] + 3) continue;
    const b = cathBand(y);
    let n = b === 3 ? DP_CT_CRIPTA : near[i] === 2 ? DP_CT_ABOBADA : near[i] ? DP_CT_ALVENARIA : DP_CT_CALCARIO;
    if (!has(n)) n = has(DP_CT_CALCARIO) ? DP_CT_CALCARIO : 0;
    if (n) DEEPT[i] = n;
  }
}

/* ---------- columns pick their piece from their neighbours ---------- */
DECO_PICK[CT_COLUNA] = DECO_PICK[CT_COLUNA] || ((gx, gy, arr) => {
  const up = tileAt(gx, gy - 1), dn = tileAt(gx, gy + 1);
  if (dn !== CT_COLUNA) return arr[0];
  if (up !== CT_COLUNA) return arr[Math.min(2, arr.length - 1)];
  return arr[arr.length > 3 && hash2(gx, gy, seed ^ 0xc01) < 0.12 ? 3 : 1];
});
DECO_PICK[CT_RAIZ] = DECO_PICK[CT_RAIZ] || ((gx, gy, arr) => arr.length > 1 && tileAt(gx, gy + 1) !== CT_RAIZ ? arr[arr.length - 1] : arr[(hash2(gx, gy, seed) * Math.max(1, arr.length - 1)) | 0]);

/* ---------- stand-in art: only for what 42-catedral-blocos has not painted (yet) ---------- */
(function cathStandIns() {
  const P = (name, hexes) => { if (!PALS[name]) pal(name, hexes); return PALS[name]; };
  const ash = (bw, bh, s) => (x, y) => {
    const gy = Math.floor(y / bh), off = (gy & 1) * (bw >> 1), gx = Math.floor((x + off) / bw) % (TP / bw), lx = (x + off) % bw, ly = y - gy * bh, h = hash2(gx, gy, s);
    if (ly === bh - 1 || lx === bw - 1) return 0.4;
    let v = 2.6 + (h - 0.5) * 1.1 + (hash2(x, y, s + 1) - 0.5) * 0.7 + (pn(x, y, 40, 40, s + 2) - 0.5) * 0.8;
    if (ly === 0) v += 0.8; else if (ly === bh - 2) v -= 0.5; if (lx === 0) v += 0.4;
    return v;
  };
  const rough = s => (x, y) => 2.5 + (pn(x, y, 30, 30, s) - 0.5) * 2.1 + (pn(x, y, 90, 90, s + 1) - 0.5) * 0.9 + (hash2(x, y, s + 2) - 0.5) * 0.8 - (Math.abs(pn(x, y, 22, 22, s + 3) - 0.5) < 0.02 ? 1.4 : 0);
  const block = (t, name, hexes, fn, dig, col) => { if (MAT[t]) return; MAT[t] = [P(name, hexes), bake(fn)]; SOLID[t] = 1; BLOCKY[t] = 1; if (!DIG[t]) DIG[t] = dig; if (!PCOL[t]) PCOL[t] = col || hexes[3]; };
  const CALC = ['#35322e', '#514c45', '#6d675e', '#8a8378', '#a69e91', '#c1b9aa'], CANT = ['#3b3936', '#5a5751', '#7a766e', '#9a958b', '#b9b3a7', '#d6d0c3'];
  block(CT_CALCARIO, 'ct_calcario', CALC, rough(601), 0.55);
  block(CT_CALC_TERRA, 'ct_calcario', CALC, (x, y) => rough(611)(x, y) - (pn(x, y, 24, 24, 612) > 0.6 ? 1.2 : 0), 0.4);
  block(CT_CANTARIA, 'ct_cantaria', CANT, ash(12, 6, 621), 0.9);
  block(CT_LAJE, 'ct_marmore', ['#45423f', '#66625d', '#8a857e', '#aca69c', '#cac4b8', '#e3ddd1'], ash(24, 12, 631), 0.9);
  block(CT_MOSAICO, 'ct_marmore', ['#45423f', '#66625d', '#8a857e', '#aca69c', '#cac4b8', '#e3ddd1'], (x, y) => ((x >> 2) + (y >> 2)) & 1 ? 1.4 + hash2(x, y, 641) * 0.5 : 3.6 + hash2(x, y, 642) * 0.6, 0.9);
  block(CT_RUINA, 'ct_cantaria', CANT, (x, y) => ash(12, 6, 651)(x, y) - (Math.abs(pn(x, y, 18, 18, 652) - 0.5) < 0.03 ? 1.6 : 0) - pn(x, y, 30, 30, 653) * 0.8, 0.7);
  block(CT_ESCOMBRO, 'ct_cantaria', CANT, (x, y) => { const g = Math.floor(x / 4) + Math.floor(y / 4) * 60; return 2.4 + (hash2(g, 0, 661) - 0.5) * 2 + (x % 4 === 0 || y % 4 === 0 ? -1 : 0.3); }, 0.45);
  block(CT_CRIPTA, 'ct_cripta', ['#17161b', '#222027', '#2d2a33', '#3a3640', '#48434f', '#57515f'], ash(12, 6, 671), 1.0);
  block(CT_OSSARIO, 'ct_osso', ['#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6'], (x, y) => { const lx = x % 6, ly = y % 6; return lx === 5 || ly === 5 ? 0.5 : (lx === 1 || lx === 3) && ly === 2 ? 0.3 : 3 + hash2(x, y, 681) * 0.8; }, 0.6);
  block(CT_MARMORE_NEGRO, 'ct_negro', ['#0e0d10', '#18161b', '#232027', '#2f2b34', '#3d3843', '#4d4754'], ash(24, 12, 691), 1.1);
  block(CT_GRADE, 'ct_ferro', ['#141418', '#24252b', '#383a42', '#50535d', '#6e727e', '#9298a4'], (x, y) => 3, 1.0);
  if (!BLEND[CT_CALCARIO]) { BLEND[CT_CALCARIO] = 1; BLEND[CT_CALC_TERRA] = 1; }
  if (!SEETHRU[CT_GRADE]) SEETHRU[CT_GRADE] = 1;
  const wall = (w, name, hexes, fn) => { if (!WMAT[w]) WMAT[w] = [P(name, hexes), bake(fn)]; };
  const CW = ['#121110', '#181715', '#1f1d1a', '#262420', '#2e2b27', '#37332e'];
  wall(WCT_CALCARIO, 'ct_calcW', ['#0f0e0d', '#151412', '#1b1917', '#211f1c', '#282521', '#2f2c27'], rough(701));
  wall(WCT_CANTARIA, 'ct_cantW', CW, ash(24, 12, 711));
  wall(WCT_REBOCO, 'ct_rebW', ['#14110f', '#1b1714', '#221d19', '#29231e', '#312a24', '#3a322a'], rough(721));
  wall(WCT_PAINEL, 'ct_panW', ['#0c0806', '#130d09', '#1a120c', '#22170f', '#2a1d13', '#332318'], (x, y) => x % 12 === 0 ? 0.6 : 2.6 + (pn(x, y, 20, 240, 731) - 0.5) * 1.6);
  wall(WCT_CRIPTA, 'ct_cripW', ['#08080a', '#0c0b0e', '#100f13', '#141318', '#19171d', '#1e1c23'], ash(12, 6, 741));
  wall(WCT_OSSARIO, 'ct_ossW', ['#13110d', '#1a1712', '#221e17', '#2a251d', '#332d23', '#3d362a'], (x, y) => { const lx = x % 6, ly = y % 6; return lx === 5 || ly === 5 ? 0.6 : (lx === 1 || lx === 3) && ly === 2 ? 0.2 : 3 + hash2(x, y, 751) * 0.8; });
  const deep = (t, name, hexes, fn) => { if (!DMAT[t]) DMAT[t] = [P(name, hexes), bake(fn)]; };
  const DH = ['#0c0b0b', '#141312', '#1b1a18', '#23211f', '#2c2a27', '#363330'];
  deep(DP_CT_ALVENARIA, 'ct_dAlv', DH, ash(36, 18, 801)); deep(DP_CT_ABOBADA, 'ct_dAlv', DH, ash(12, 24, 811)); deep(DP_CT_CALCARIO, 'ct_dCalc', DH, rough(821)); deep(DP_CT_CRIPTA, 'ct_dCrip', ['#08070a', '#0d0c10', '#121116', '#17161c', '#1d1b22', '#242129'], ash(12, 12, 831));
  const deco = (t, rows, map) => { if (!DECO[t]) DECO[t] = rows.map(r => rowsT(r, map)); if (!PCOL[t]) PCOL[t] = map[Object.keys(map)[0]]; };
  const COL = { o: '#3b3936', m: '#9a958b', l: '#d6d0c3', d: '#5a5751' };
  deco(CT_COLUNA, [
    ['..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '.ommmmmmmmo.', '.odddddddddo', 'ommmmmmmmmmo', 'oooooooooooo'],
    ['..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..'],
    ['oooooooooooo', 'ollllllllllo', '.odmmmmmmdo.', '..ommmmmmo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..', '..odmmmldo..']
  ], COL);
  deco(CT_RAIZ, [['...rR.......', '...rR...r...', '....r...rR..', '....rR...r..', '.....r...r..', '.....r...R..', '....rR..r...', '....r...r...', '...rR....r..', '...r.....r..', '...rR.....r.', '....r.......'], ['...rR.......', '...rR...r...', '....r...rR..', '....r....r..', '.....r...r..', '.....r......', '....r.......', '....r.......', '............', '............', '............', '............']], { r: '#43301e', R: '#5e4630' });
  deco(CT_CACOS, [['............', '............', '............', '............', '............', '............', '............', '............', '............', '...b....r...', '.k.bb.akr.g.', 'kkkkkkkkkkkk'].map(r => r.replace(/k/g, '.'))], { b: '#3e66b8', r: '#b8403a', a: '#d8a03a', g: '#3e8a56' });
  deco(CT_CRANIOS, [['............', '............', '............', '............', '............', '............', '....ooo.....', '...oxoxo....', '...ooooo.oo.', '.oooOoo.oxoo', 'oxoxooooOooo', 'oooOoOooooOo']], { o: '#d8cfb8', O: '#a89e86', x: '#1a1418' });
  deco(CT_VELAS, [['............', '............', '............', '............', '............', '....w.......', '.w..w...w...', '.w..W...w...', '.W.wWw..W...', 'wWwwWwwwWw..', 'WwwwwwWwwwW.', 'WWWWWWWWWWW.']], { w: '#e8dcc0', W: '#b8a888' });
  if (!WICKS[CT_VELAS]) WICKS[CT_VELAS] = [[[1, 6], [4, 5], [8, 6]]];
  if (!EMIT[CT_VELAS]) EMIT[CT_VELAS] = 0.7;
  deco(CT_TEIA, [ART_WEB, ART_WEB.map(r => r.split('').reverse().join(''))], ART_WEB_P);
  for (const t of [CT_COLUNA, CT_RAIZ, CT_CACOS, CT_CRANIOS, CT_VELAS, CT_TEIA]) if (!DIG[t]) DIG[t] = t === CT_COLUNA ? 0.5 : 0.05;
})();
