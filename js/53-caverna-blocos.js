'use strict';

/* ================= the caves: blocks, back walls, far layer, decorations =================
   Natural ground only, nothing built: damp dark earth with pebbles and root threads, red clay, layered cave rock
   (and the same rock grown over with moss), cream flowstone, loose gravel, the dark mica schist of the spiders'
   nest and the solid mass of web that plugs its tunnels. The ores are painted again on cave rock (same items),
   so a vein doesn't show the pale limestone of the cathedral. Like 03-blocos and 42-catedral-blocos, every
   material is a seamless 240x240 texture sampled in world pixels; outline, lit edge, shade and ambient occlusion
   come from 07-chunks-luz. Back walls and the far layer only read the tone (.v), so they carry no colour accents.
   Small decorations (stalactites, stalagmites, roots, mushrooms, crystal druses, pebbles, cocoons, web threads)
   are 12x12 sprites on ramps lit from the top left. Ids: 52-caverna-api. */
const CVART = {};   // helpers shared with 54-caverna-objetos
{
/* ---- palettes: 6 shades, dark to light ---- */
pal('cvTerra', ['#1d140d', '#2c1f15', '#3c2b1e', '#4e3a29', '#614935', '#765a43']);
pal('cvArgila', ['#2c140e', '#462116', '#613022', '#7c4030', '#975440', '#b06a52']);
pal('cvRocha', ['#1f1c1a', '#312c29', '#45403a', '#5a524a', '#6f665c', '#867b6f']);
pal('cvCalcita', ['#3a3124', '#594b38', '#7b6a52', '#9d8a6c', '#bba889', '#d6c6a4']);
pal('cvCascalho', ['#221f1c', '#36312c', '#4b453e', '#615950', '#776e63', '#8e8478']);
pal('cvXisto', ['#111319', '#1b1f28', '#262c38', '#323a49', '#3f485a', '#4f586d']);
pal('cvTeia', ['#3c3c44', '#5c5c66', '#7c7c88', '#9c9ca8', '#bcbcc6', '#d8d8e0']);
// back walls: always far darker than the ground in front
pal('cvTerraW', ['#0c0806', '#110c09', '#17100c', '#1d1510', '#231a14', '#2a2019']);
pal('cvRochaW', ['#0d0c0b', '#13110f', '#191614', '#1f1c19', '#26221e', '#2d2824']);
pal('cvCalcitaW', ['#13100c', '#1a1611', '#211c16', '#29231b', '#312a21', '#3a3127']);
pal('cvTeiaW', ['#0d0d10', '#131317', '#1a1a1f', '#212127', '#29292f', '#323238']);
pal('cvXistoW', ['#07080b', '#0b0d11', '#101217', '#14171d', '#191d24', '#1f232b']);
// the far layer behind the walls
pal('dpCvTerra', ['#0a0705', '#100b08', '#160f0b', '#1c140f', '#221913', '#291f17']);
pal('dpCvRocha', ['#090808', '#0f0e0d', '#151312', '#1b1917', '#221f1c', '#292521']);
pal('dpCvTeia', ['#09090b', '#0f0f12', '#151519', '#1b1b20', '#222228', '#2a2a31']);

/* ---- little tools ---- */
const cg = (x, y, s) => hash2(x, y, s) - 0.5;
const cn = (x, y, L, LY, s) => pn(x, y, L, LY, s) - 0.5;
const wrapT = v => ((v % TP) + TP) % TP;
// cellular pebbles: distance to the nearest and second-nearest seed in a grid of cs px (repeats every 240)
function cells(x, y, cs, s, sy = 1.15) {
  const n = TP / cs, gx = Math.floor(x / cs), gy = Math.floor(y / cs); let d1 = 99, d2 = 99, id = 0, ox = 0, oy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = gx + i, cy = gy + j, wx = ((cx % n) + n) % n, wy = ((cy % n) + n) % n;
    const px = cx * cs + hash2(wx, wy, s) * cs, py = cy * cs + hash2(wx, wy, s + 1) * cs, d = Math.hypot(x - px, (y - py) * sy);
    if (d < d1) { d2 = d1; d1 = d; id = hash2(wx, wy, s + 2); ox = x - px; oy = y - py; } else if (d < d2) d2 = d;
  }
  return { d1, d2, id, ox, oy };
}
const MOSSC = ['#121b0f', '#1c2915', '#2a3c1e', '#384e26', '#46602e'].map(h => ph(h));
const ROOTC = ['#1e130b', '#2f1f13', '#45301e', '#5c432c'].map(h => ph(h));
const PEBC = ['#2a2420', '#4a423a', '#6a6056', '#8a7f72'].map(h => ph(h));
const MICA = ['#5a6680', '#8a98b4', '#c8d4ea'].map(h => ph(h));

/* ---- solid ground ---- */
function vTerraU(x, y) {   // damp cave earth: clods, dark wet patches, pebbles and thin root threads
  let v = 2.3 + cn(x, y, 36, 36, 2501) * 2.0 + cn(x, y, 110, 110, 2502) * 0.9 + cg(x, y, 2503) * 0.8;
  const wet = cn(x, y, 16, 22, 2504); if (wet > 0.2) v -= (wet - 0.2) * 4;
  const c = cells(x, y, 7, 2505);
  if (c.id < 0.13 && c.d1 < 1.9) { MATX = c.d1 < 0.9 && c.ox + c.oy < 0 ? PEBC[3] : c.ox + c.oy > 0.5 ? PEBC[0] : PEBC[c.id < 0.06 ? 2 : 1]; return -9; }   // pebble lit from the top left
  const root = Math.abs(cn(x + cn(x, y, 10, 30, 2507) * 50, y, 30, 7, 2506));
  if (root < 0.006) { MATX = ROOTC[root < 0.003 ? 3 : 2]; return -9; }
  if (root < 0.011 && hash2(x, y, 2508) < 0.6) { MATX = ROOTC[1]; return -9; }
  if (hash2(x, y, 2509) < 0.03) v -= 1.3; else if (hash2(x, y, 2510) < 0.018) v += 1.2;
  return v;
}
function vArgila(x, y) {   // red clay laid down in soft beds, dried cracks, a smear of grey
  const bedw = cn(x, y, 6, 3, 2521) * 12, bed = (y + bedw) % 10;
  let v = 2.7 + cn(x, y, 24, 24, 2522) * 1.1 + cg(x, y, 2523) * 0.45 + (bed < 1.2 ? -0.9 : bed < 2.4 ? 0.6 : 0);
  const cr = Math.abs(cn(x, y, 20, 20, 2524)); if (cr < 0.012) v = 0.8; else if (cr < 0.02) v -= 0.6;
  if (hash2(x, y, 2525) < 0.02) v -= 1.0;
  return v;
}
function vRochaC(x, y) {   // cave rock: tilted strata, fractures, worn rounded knobs, speckles
  const tilt = y + x * 0.22 + cn(x, y, 6, 4, 2531) * 14, bed = ((tilt % 14) + 14) % 14;
  let v = 2.4 + cn(x, y, 28, 28, 2532) * 1.7 + cn(x, y, 96, 96, 2533) * 0.8 + cg(x, y, 2534) * 0.7;
  if (bed < 1) v -= 1.1; else if (bed < 2.2) v += 0.7;
  const f = Math.abs(cn(x, y, 16, 16, 2535)); if (f < 0.012) v -= 1.7; else if (f < 0.02) v -= 0.5;
  const k = cells(x, y, 20, 2536, 1); if (k.id < 0.35) { const r = k.d1 / 7; if (r < 1) v += (1 - r) * 0.9 - (k.ox + k.oy) * 0.06; }
  if (hash2(x, y, 2537) < 0.025) v -= 1.2; else if (hash2(x, y, 2538) < 0.015) v += 1.3;
  return v;
}
function vMusgoC(x, y) {   // the same rock where the damp gets in: moss sits on the tops of the knobs and in the cracks
  const v = vRochaC(x, y), m = cn(x, y, 14, 14, 2541) + cn(x, y, 44, 44, 2542) * 0.5 + 0.08, g = hash2(x, y, 2543);
  if (m > 0.1 && g < (m - 0.1) * 3.2) { MATX = MOSSC[clamp(((m - 0.1) * 9 + g * 1.6) | 0, 0, 4)]; return -9; }
  return v;
}
function vCalcita(x, y) {   // flowstone: smooth drapery running down, little rimstone ridges, a wet shine
  const flow = cn(x, y, 30, 4, 2551) * 1.6, rim = (y + cn(x, y, 20, 6, 2552) * 18) % 8;
  let v = 3.0 + flow + cn(x, y, 60, 30, 2553) * 0.6 + cg(x, y, 2554) * 0.35;
  if (rim < 0.9) v += 1.0; else if (rim < 1.8) v -= 0.7;
  const drape = Math.abs(cn(x, y, 40, 3, 2555)); if (drape < 0.02) v -= 0.9;
  if (hash2(x, y, 2556) < 0.012) v += 1.6;   // glints of wet calcite
  return v;
}
function vCascalho(x, y) {   // loose gravel: rounded stones of every size, dusty gaps
  const c = cells(x, y, 5, 2561), c2 = cells(x, y, 12, 2562);
  if (c2.id < 0.25 && c2.d1 < 4) { if (c2.d2 - c2.d1 < 0.8) return 0.3; return 2.8 + (c2.id - 0.12) * 4 - (c2.ox + c2.oy) * 0.2 - c2.d1 * 0.12 + cg(x, y, 2563) * 0.4; }   // a bigger cobble
  if (c.d2 - c.d1 < 0.9) return 0.4 + cg(x, y, 2564) * 0.5;
  return 2.4 + (c.id - 0.5) * 1.8 - (c.ox + c.oy) * 0.25 - c.d1 * 0.1 + cg(x, y, 2565) * 0.5;
}
function vXisto(x, y) {   // dark schist: thin wavy foliation, flaking edges, mica that glints
  const w = cn(x, y, 10, 24, 2571) * 10 + cn(x, y, 40, 60, 2572) * 4, ly = ((y + w - x * 0.12) % 4 + 4) % 4;
  let v = 2.4 + cn(x, y, 30, 80, 2573) * 1.4 + cg(x, y, 2574) * 0.45;
  if (ly < 0.8) v -= 1.2; else if (ly < 1.6) v += 0.8;
  if (hash2(Math.floor(x / 7), Math.floor((y + w) / 4), 2575) < 0.07 && ly > 1.6) v -= 0.8;   // a flake gone
  if (hash2(x, y, 2576) < 0.012 && ly > 1) { MATX = MICA[hash2(x, y, 2577) < 0.3 ? 2 : hash2(x, y, 2578) < 0.5 ? 1 : 0]; return -9; }
  return v;
}
function vTeiaM(x, y) {   // a solid mass of old web: layered sheets, threads running every way, dark hollows behind
  const a = Math.abs(cn(x, y, 30, 10, 2581)), b = Math.abs(cn(x + y * 0.6, y, 16, 24, 2582)), c = Math.abs(cn(x - y * 0.5, y, 20, 20, 2583));
  let v = 1.4 + cn(x, y, 24, 24, 2584) * 1.2;
  if (a < 0.03) v += 2.6 - a * 40; if (b < 0.02) v += 2.0; if (c < 0.016) v += 1.6;
  const sheet = cn(x, y, 12, 8, 2585); if (sheet > 0.12) v += 1.2 + sheet * 2;
  if (hash2(x, y, 2586) < 0.02) v += 1.5;   // a dew drop or a scrap of shed skin
  return v + cg(x, y, 2587) * 0.4;
}

/* ---- back walls ---- */
function vRochaW(x, y) { return vRochaC(x, y) * 0.95 + 0.1; }
function vTerraW(x, y) { const v = vTerraU(x, y); return v === -9 ? 2.6 + cg(x, y, 2601) * 0.8 : v; }
function vCalcitaW(x, y) {   // flowstone curtains seen against the wall: tall folds
  const fold = Math.sin((x + cn(x, y, 8, 3, 2611) * 40) / 7) * 0.9;
  return 2.6 + fold + cn(x, y, 40, 10, 2612) * 0.7 + cg(x, y, 2613) * 0.35 + ((y + cn(x, y, 24, 6, 2614) * 14) % 10 < 1 ? 0.8 : 0);
}
function vTeiaW(x, y) {   // rock half hidden under old web: threads in straight runs, sheets in the corners
  let v = vRochaC(x, y) * 0.75;
  const t1 = Math.abs(cn(x + y * 0.8, y, 18, 18, 2621)), t2 = Math.abs(cn(x - y * 0.7, y, 22, 22, 2622)), sh = cn(x, y, 16, 16, 2623);
  if (t1 < 0.012 || t2 < 0.01) v = 4.2 + cg(x, y, 2624) * 0.5;
  else if (sh > 0.2) v = Math.max(v, 2.6 + sh * 3);
  return v;
}
function vXistoW(x, y) { const v = vXisto(x, y); return v === -9 ? 3.6 : v; }

/* ---- far layer ---- */
function vDpCvTerra(x, y) {   // far earth with roots threading down
  let v = 2.4 + cn(x, y, 30, 30, 2701) * 1.6 + cg(x, y, 2702) * 0.6;
  const r = Math.abs(cn(x + cn(x, y, 8, 30, 2703) * 40, y, 24, 4, 2704)); if (r < 0.012) v += 1.6; else if (r < 0.02) v -= 0.7;
  return v;
}
function vDpCvRocha(x, y) {   // far rock in thick layers, big fractures
  const bed = (y + x * 0.15 + cn(x, y, 5, 3, 2711) * 20) % 30; let v = 2.4 + cn(x, y, 24, 24, 2712) * 1.4 + cg(x, y, 2713) * 0.5;
  if (bed < 1.6) v -= 1.4; else if (bed < 3.4) v += 0.8;
  if (Math.abs(cn(x, y, 10, 10, 2714)) < 0.012) v -= 1.6;
  return v;
}
function vDpCvEstalac(x, y) {   // a forest of stalactites far back: tapering cones hanging in rows every 48 px
  const row = Math.floor(wrapT(y) / 48), ly = wrapT(y) % 48, n = 9, cw = TP / n / 1, k = Math.floor(wrapT(x + row * 13) / (TP / 12)), lx = wrapT(x + row * 13) % (TP / 12);
  const len = 18 + hash2(k, row % 5, 2721) * 26, half = (1 - ly / len) * (3 + hash2(k, row % 5, 2722) * 4), cx = TP / 24;
  if (ly < len && Math.abs(lx - cx) < half) return 3.2 - (lx - cx) / Math.max(1, half) * 1.4 - ly / len * 0.8 + cg(x, y, 2723) * 0.4;
  return 1.0 + cn(x, y, 30, 30, 2724) * 0.8 + cg(x, y, 2725) * 0.3;
}
function vDpCvTeia(x, y) { let v = vDpCvRocha(x, y) * 0.8; if (Math.abs(cn(x + y * 0.8, y, 14, 14, 2731)) < 0.012 || Math.abs(cn(x - y * 0.6, y, 18, 18, 2732)) < 0.01) v = 3.8; return v; }

/* ---- bake and register ---- */
const BKV = {
  terra: bake(vTerraU), argila: bake(vArgila), rocha: bake(vRochaC), musgo: bake(vMusgoC), calcita: bake(vCalcita), cascalho: bake(vCascalho), xisto: bake(vXisto), teia: bake(vTeiaM),
  terraW: bake(vTerraW), rochaW: bake(vRochaW), calcitaW: bake(vCalcitaW), teiaW: bake(vTeiaW), xistoW: bake(vXistoW),
  dpTerra: bake(vDpCvTerra), dpRocha: bake(vDpCvRocha), dpEstalac: bake(vDpCvEstalac), dpTeia: bake(vDpCvTeia)
};
const CV_SOLID = [
  // id, palette, texture, dig, map colour
  [CV_TERRA, 'cvTerra', 'terra', 0.3, '#4e3a29'], [CV_ARGILA, 'cvArgila', 'argila', 0.25, '#7c4030'], [CV_ROCHA, 'cvRocha', 'rocha', 0.6, '#5a524a'],
  [CV_MUSGO, 'cvRocha', 'musgo', 0.6, '#4a5636'], [CV_CALCITA, 'cvCalcita', 'calcita', 0.7, '#9d8a6c'], [CV_CASCALHO, 'cvCascalho', 'cascalho', 0.35, '#615950'],
  [CV_XISTO, 'cvXisto', 'xisto', 0.75, '#323a49'], [CV_TEIA, 'cvTeia', 'teia', 0.06, '#bcbcc6']
];
for (const [t, p, k, dig, col] of CV_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [CV_TERRA, CV_ARGILA, CV_ROCHA, CV_MUSGO, CV_CALCITA, CV_CASCALHO, CV_XISTO]) BLEND[t] = 1;

WMAT[WCV_TERRA] = [PALS.cvTerraW, BKV.terraW]; WMAT[WCV_ROCHA] = [PALS.cvRochaW, BKV.rochaW]; WMAT[WCV_CALCITA] = [PALS.cvCalcitaW, BKV.calcitaW];
WMAT[WCV_TEIA] = [PALS.cvTeiaW, BKV.teiaW]; WMAT[WCV_XISTO] = [PALS.cvXistoW, BKV.xistoW];
DMAT[DP_CV_TERRA] = [PALS.dpCvTerra, BKV.dpTerra]; DMAT[DP_CV_ROCHA] = [PALS.dpCvRocha, BKV.dpRocha]; DMAT[DP_CV_ESTALAC] = [PALS.dpCvRocha, BKV.dpEstalac]; DMAT[DP_CV_TEIA] = [PALS.dpCvTeia, BKV.dpTeia];

/* ---- the ores again, set in cave rock: same items, same look of the ore itself ---- */
const CV_ORES = [[CV_O_CARVAO, COAL, '#0a0a0e', 0.4, 0.15], [CV_O_COBRE, COPPER, '#2f8a68', 0.26, 0.1], [CV_O_FERRO, IRON, '#8a3f1c', 0.42, 0.18], [CV_O_OURO, GOLD, '#c8a040', 0.18, 0.06]];
for (const [t, o, tint, a1, a2] of CV_ORES) {
  ORE_PAINT[t] = ORE_PAINT[o]; ORE_HALO[t] = { pal: ['cvRocha', tint, a1, a2], shade: 0, drip: ORE_HALO[o].drip };
  MAT[t] = [PALS.cvRocha, bakeOre(t, vRochaC)]; SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1;
  DIG[t] = DIG[o]; ORE_XP[t] = ORE_XP[o]; ORE_NAME[t] = ORE_NAME[o]; PCOL[t] = PCOL[o]; ORE_ITEM[t] = ORE_ITEM[o];
}
// which cave ore stands for which ore (56 places veins by the plain ore id)
const CV_ORE_OF = { [COAL]: CV_O_CARVAO, [COPPER]: CV_O_COBRE, [IRON]: CV_O_FERRO, [GOLD]: CV_O_OURO };

/* ---- block items ---- */
const CV_ITEMS = {
  terra_umida: ['Terra Úmida', CV_TERRA, 'Terra escura das grutas, sempre molhada.'],
  argila: ['Argila', CV_ARGILA, 'Barro vermelho e mole. Cava num instante.'],
  rocha: ['Rocha', CV_ROCHA, 'Rocha da caverna, em camadas.'],
  calcita: ['Calcita', CV_CALCITA, 'Pedra de escorrimento, cor de creme. A água a fez gota a gota.'],
  cascalho: ['Cascalho', CV_CASCALHO, 'Pedra solta de desabamento.'],
  xisto: ['Xisto', CV_XISTO, 'Pedra escura em lâminas, com brilho de mica.']
};
for (const id in CV_ITEMS) { const [name, block, desc] = CV_ITEMS[id]; ITEMS[id] = { name, rar: 0, stack: 99, block, desc }; BLOCK_DROP[block] = id; }
BLOCK_DROP[CV_MUSGO] = 'rocha';
// silk: from the web mass and from the spiders (55-caverna-bichos)
ICON_ART.silk = [["...ww....", "..wWWw.w.", ".wWwwWWw.", "wWw..wWw.", "wW.ww.Ww.", ".wWWWWw..", "..wwww...", "....w...."], { w: '#a8a8b4', W: '#e4e4ec' }];
ITEMS.seda = { name: 'Seda de Aranha', rar: 0, stack: 99, icon: 'silk', desc: 'Fio grosso e grudento. Material.' };
BLOCK_DROP[CV_TEIA] = 'seda';

/* ================= decorations: 12x12 sprites on ramps ================= */
const DRC = {
  rocha: ['#171513', '#26221f', '#3a3430', '#4f4842', '#655c54', '#7c7268', '#968a7e'],
  calcita: ['#2a2318', '#4a3e2e', '#6e5e48', '#927e62', '#b3a07e', '#cfbd9a', '#e6d8ba'],
  raiz: ['#140c07', '#24170d', '#382515', '#4d3520', '#64472d'],
  cogu: ['#1a0f08', '#33200f', '#523418', '#704a24', '#8e6234', '#ad7e48', '#c89a62'],
  caule: ['#3a3226', '#5e5442', '#857a64', '#aaa088', '#cdc4ac'],
  drusa: ['#160a2a', '#2a1650', '#43267a', '#6440a8', '#8a66d0', '#b494ec', '#e4d6ff'],
  seixo: ['#1c1916', '#2e2925', '#45403a', '#5d564e', '#766e64', '#91877b'],
  seda: ['#3a3a42', '#5c5c66', '#80808c', '#a4a4b0', '#c8c8d2', '#e6e6ee'],
  vitima: ['#2a1c14', '#46301f', '#634530', '#7d5a40']
};
for (const k in DRC) DRC[k] = DRC[k].map(h => ph(h));
const dPix = (R, v) => R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0];
// paint a 12x12 sprite (fn returns a packed colour or 0) and rim it with the darkest tone where it meets the air
function cvSprite(fn, rim) {
  const a = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) a[y * T + x] = fn(x, y) || 0;
  if (rim) { const o = rim, b = a.slice(); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (b[k]) continue; if ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (y > 0 && b[k - T]) || (y < T - 1 && b[k + T])) a[k] = o; } }
  return a;
}
const flip = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[y * T + T - 1 - x]; return b; };

/* a cone of dripstone: hanging (tip down) or standing (tip up). w0 = width at the root, the root row is full width */
function dripCone(hang, w0, len, s, ramp, off = 0) {
  return cvSprite((x, y) => {
    const t = hang ? y / len : (T - 1 - y) / len; if (t > 1) return 0;
    const half = Math.max(0.35, (1 - Math.pow(t, 0.8)) * w0 / 2), cx = 5.5 + off + Math.sin(t * 3 + s) * 0.4, dx = x + 0.5 - cx - 0.5;
    if (Math.abs(dx) > half) return 0;
    const u = (dx / half + 1) / 2;
    let v = 4.6 - u * 3 - t * 0.6 + cg(x, y, s) * 0.5 + ((y + (s | 0)) % 3 === 0 ? 0.35 : 0);   // light from the left, faint growth rings
    if (t > 0.85) v += 1;   // the wet tip catches the light
    return dPix(ramp, v);
  }, ramp[0]);
}
// a hanging run: the middle pieces are full-width columns that narrow a little, the last one tapers to a tip
const ESTALACTITE = [dripCone(true, 9, 22, 1, DRC.rocha), dripCone(true, 7, 11.5, 2, DRC.rocha), dripCone(true, 5, 11, 3, DRC.calcita, 0.5)];      // [meio, ponta, ponta de calcita]
const ESTALAGMITE = [dripCone(false, 10, 24, 4, DRC.rocha), dripCone(false, 8, 11.5, 5, DRC.rocha), dripCone(false, 6, 10, 6, DRC.calcita, -0.5)];  // [base, ponta, ponta de calcita]

/* thin roots hanging from the earth */
function rootsSprite(s, tip) {
  const a = new Uint32Array(T * T);
  for (let k = 0; k < 3; k++) {
    const x0 = 2 + hash2(s, k, 2801) * 8, len = tip ? 4 + hash2(s, k, 2802) * 8 : 12, w = k === 0 ? 1.6 : 1;
    for (let y = 0; y < len; y++) { const cx = x0 + Math.sin((y + s * 3 + k * 5) * 0.6) * 1.1, ww = tip ? w * (1 - y / len * 0.6) : w; for (let x = Math.floor(cx - ww / 2); x <= Math.floor(cx + ww / 2); x++) if (x >= 0 && x < T) a[y * T + x] = dPix(DRC.raiz, 3 - (x - cx + 0.5) * 1.2 + cg(x, y, s + k) * 0.8); }
    if (tip && hash2(s, k, 2803) < 0.6) { const y = Math.min(T - 1, len | 0), x = Math.round(x0 + 1); if (x < T) a[y * T + x] = dPix(DRC.raiz, 1); }
  }
  return a;
}
const RAIZES = [rootsSprite(1, 0), rootsSprite(2, 0), rootsSprite(3, 1), rootsSprite(4, 1)];

/* brown cave mushrooms in a little cluster */
function mushSprite(s) {
  const a = new Uint32Array(T * T);
  const one = (cx, h, r) => {
    for (let y = T - h; y < T; y++) for (let x = Math.floor(cx - 0.5); x <= Math.floor(cx + 0.5); x++) if (x >= 0 && x < T) a[y * T + x] = dPix(DRC.caule, 3 - (x - cx) * 1.5 + cg(x, y, s) * 0.5);   // stem
    const cy = T - h; for (let y = cy - Math.ceil(r * 0.7); y <= cy; y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if (x < 0 || x >= T || y < 0) continue; const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / (r * 0.75); if (dx * dx + dy * dy > 1 || y > cy) continue;
      let v = 4.4 - (dx + dy) * 1.4 + cg(x, y, s + 1) * 0.6; if (y === cy) v = 1.2; if (hash2(x, y, s + 2) < 0.12 && y < cy) v += 1.4;   // gills under, freckles on top
      a[y * T + x] = dPix(DRC.cogu, v);
    }
  };
  if (s === 1) { one(3.5, 5, 2.8); one(8.5, 3, 2); } else { one(6, 6, 3.4); one(2, 2, 1.4); one(10, 3, 1.6); }
  const b = a.slice(), o = DRC.cogu[0]; for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (!b[k] && ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (y > 0 && b[k - T]))) a[k] = o; }
  return a;
}
const COGUMELOS = [mushSprite(1), mushSprite(2)];

/* a small druse: violet crystal points growing out of a lump of rock (glows a little) */
function druseSprite(s) {
  const a = new Uint32Array(T * T);
  for (let x = 1; x < 11; x++) for (let y = 9; y < 12; y++) if (Math.abs(x - 5.5) < 5 - (11 - y) * 0.8) a[y * T + x] = dPix(DRC.rocha, 3.4 - x * 0.18 - (y - 9) * 0.5 + cg(x, y, s) * 0.6);   // the rock it sits on
  const pts = s === 1 ? [[3, 6, -0.4], [6, 9, 0.05], [9, 5, 0.45]] : [[2.5, 4, -0.5], [5, 7, -0.1], [7.5, 8, 0.25], [9.5, 4, 0.6]];
  for (const [bx, len, ang] of pts) {
    const ux = Math.sin(ang), uy = -Math.cos(ang);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const px = x + 0.5 - bx, py = y + 0.5 - 10, al = px * ux + py * uy, pe = px * -uy + py * ux; if (al < 0 || al > len) continue;
      const w = 1.3 * Math.min(1, (len - al) / 1.8); if (Math.abs(pe) > w) continue;
      a[y * T + x] = dPix(DRC.drusa, (pe < -0.3 ? 4.6 : pe > 0.3 ? 2.3 : 5.6) + (al > len - 1.4 ? 0.8 : 0) - (al < 1 ? 1.2 : 0));
    }
  }
  const b = a.slice(), o = DRC.drusa[0]; for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (!b[k] && ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (y > 0 && b[k - T]))) a[k] = o; }
  return a;
}
const DRUSAS = [druseSprite(1), druseSprite(2)];

/* pebbles on the floor */
function pebbleSprite(s) {
  const a = new Uint32Array(T * T);
  const stone = (cx, rx, ry, tone) => { for (let y = Math.floor(11.5 - ry * 2); y < T; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) { if (x < 0 || x >= T) continue; const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - (12 - ry)) / ry; if (dx * dx + dy * dy > 1) continue; a[y * T + x] = dPix(DRC.seixo, 3.6 + tone - (dx + dy) * 1.3 + cg(x, y, s) * 0.5); } };
  if (s === 1) { stone(3, 2.2, 1.6, 0); stone(7.5, 1.4, 1.1, -0.4); stone(10, 1, 0.8, 0.5); }
  else { stone(5, 2.8, 2, 0.2); stone(9.5, 1.5, 1.2, -0.3); stone(1.5, 1, 0.9, 0); }
  const b = a.slice(), o = DRC.seixo[0]; for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (!b[k] && ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (y > 0 && b[k - T]))) a[k] = o; }
  return a;
}
const SEIXOS = [pebbleSprite(1), pebbleSprite(2)];

/* a small cocoon hanging on a thread */
function cocoonSprite(s) {
  return cvSprite((x, y) => {
    if (y < 3) return x === 6 ? dPix(DRC.seda, 3) : 0;   // the thread
    const cx = 6 + Math.sin(y * 0.4 + s) * 0.3, dy = (y - 7.5) / 4.6, half = Math.sqrt(Math.max(0, 1 - dy * dy)) * (s === 1 ? 2.7 : 3.2); if (Math.abs(x + 0.5 - cx) > half) return 0;
    const u = (x + 0.5 - cx) / Math.max(0.5, half);
    let v = 4.4 - u * 1.8 - dy * 0.6 + cg(x, y, s) * 0.5 + (((y * 2 + x + s) % 5) === 0 ? -1.2 : 0);   // wrapped in spirals of silk
    if (s === 2 && y >= 5 && y <= 6 && Math.abs(u) < 0.5) return dPix(DRC.vitima, 1.5 + cg(x, y, 2811) * 2);   // something shows through
    return dPix(DRC.seda, v);
  }, DRC.seda[0]);
}
const CASULOS = [cocoonSprite(1), cocoonSprite(2)];

/* web threads strung across a corner (anchored top-left; the second is mirrored) */
const FIOS_A = (() => {
  const a = new Uint32Array(T * T), set = (x, y, v) => { if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = dPix(DRC.seda, v); };
  for (let i = 0; i < 4; i++) { const x1 = 3 + i * 3, y1 = 11 - i * 2.4; for (let k = 0; k <= 16; k++) { const t = k / 16; set(Math.round(x1 * t), Math.round(y1 * t * t * 0.6 + y1 * t * 0.4), 3.4 - t); } }
  for (let k = 0; k < 12; k++) set(k, Math.round(1 + Math.sin(k * 0.5) * 0.6 + k * 0.12), 2.6);
  return a;
})();
const FIOS = [FIOS_A, flip(FIOS_A)];

DECO[CV_ESTALACTITE] = ESTALACTITE; DECO[CV_ESTALAGMITE] = ESTALAGMITE; DECO[CV_RAIZES] = RAIZES; DECO[CV_COGUMELO] = COGUMELOS;
DECO[CV_DRUSA] = DRUSAS; DECO[CV_SEIXOS] = SEIXOS; DECO[CV_CASULO] = CASULOS; DECO[CV_FIOS] = FIOS;
DIG[CV_ESTALACTITE] = 0.25; DIG[CV_ESTALAGMITE] = 0.25; DIG[CV_RAIZES] = 0.04; DIG[CV_COGUMELO] = 0.04; DIG[CV_DRUSA] = 0.15; DIG[CV_SEIXOS] = 0.04; DIG[CV_CASULO] = 0.05; DIG[CV_FIOS] = 0.03;
PCOL[CV_ESTALACTITE] = '#6f665c'; PCOL[CV_ESTALAGMITE] = '#6f665c'; PCOL[CV_RAIZES] = '#45301e'; PCOL[CV_COGUMELO] = '#8e6234'; PCOL[CV_DRUSA] = '#8a66d0'; PCOL[CV_SEIXOS] = '#5d564e'; PCOL[CV_CASULO] = '#c8c8d2'; PCOL[CV_FIOS] = '#a4a4b0';
EMIT[CV_DRUSA] = 0.42;
for (const t of [CV_ESTALACTITE, CV_RAIZES, CV_CASULO]) CV_HANGS[t] = 1;
for (const t of [CV_ESTALAGMITE, CV_COGUMELO, CV_DRUSA, CV_SEIXOS]) CV_STANDS[t] = 1;
// a druse or a calcite tip breaks off into a little material
BLOCK_DROP[CV_ESTALAGMITE] = 'cascalho'; BLOCK_DROP[CV_ESTALACTITE] = 'cascalho'; BLOCK_DROP[CV_CASULO] = 'seda';

// which variation goes where: dripstone pieces from their neighbours, threads against the wall
DECO_PICK[CV_ESTALACTITE] = (gx, gy, arr) => tileAt(gx, gy + 1) === CV_ESTALACTITE ? arr[0] : tileAt(gx, gy - 1) === CV_CALCITA ? arr[2] : arr[1];
DECO_PICK[CV_ESTALAGMITE] = (gx, gy, arr) => tileAt(gx, gy - 1) === CV_ESTALAGMITE ? arr[0] : tileAt(gx, gy + 1) === CV_CALCITA ? arr[2] : arr[1];
DECO_PICK[CV_RAIZES] = (gx, gy, arr) => tileAt(gx, gy + 1) === CV_RAIZES ? arr[(hash2(gx, gy, 2821) * 2) | 0] : arr[2 + ((hash2(gx, gy, 2822) * 2) | 0)];
DECO_PICK[CV_FIOS] = (gx, gy, arr) => solidAt(gx - 1, gy) || !solidAt(gx + 1, gy) ? arr[0] : arr[1];

Object.assign(CVART, { cg, cn, cells, DRC, dPix, cvSprite, vRochaC, vCalcita, vXisto, vTerraU });
}
