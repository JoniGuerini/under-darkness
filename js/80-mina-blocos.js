'use strict';

/* ================= the abandoned mine: blocks, back walls, far layer, decorations =================
   The ground the miners cut through: banded iron rock (black iron oxide and rust-red jasper in thin wavy layers,
   with steel-grey glints), the loose grey tailings they dumped behind them, rubble from old cave-ins, rock scored
   by thousands of pick blows, pale sugary quartzite with a fleck of gold here and there, and down in the furnaces
   sooty brick and black glassy slag still holding an ember. Their timber too: mine planks on nails and heavy
   beams banded with iron. Iron, coal, gold and crystal come back set in this rock. Like 70-gelo-blocos, every
   material is a seamless 240x240 texture sampled in world pixels; outline, lit edge, shade and ambient occlusion
   come from 07-chunks-luz. Small decorations (timber props from floor to roof, rails, a lantern on a hook,
   ladders and ropes you can climb, tools left lying, stones, a glowing lump of slag, a goblin's skull on a
   stick) are 12x12 sprites on ramps lit from the top left. Ids: 79-mina-api. */
const MNART = {};   // helpers shared with 81-mina-objetos and 82/83 (the monsters)
{
const { cg, cn, cells, dPix, cvSprite } = CVART;
/* ---- palettes: 6 shades, dark to light ---- */
pal('mnFerrosa', ['#140c0b', '#271614', '#3e211c', '#593026', '#764233', '#925845']);
pal('mnRejeito', ['#1b1a19', '#2d2b29', '#43403c', '#5a5650', '#726d66', '#8b857c']);
pal('mnEntulho', ['#16110f', '#28201c', '#3d322c', '#54473e', '#6c5d51', '#857466']);
pal('mnTabua', ['#1a0f08', '#2e1b0e', '#452a16', '#5e3b20', '#7a4f2c', '#94663a']);
pal('mnViga', ['#120a06', '#21130b', '#331e11', '#472a18', '#5c3821', '#72482b']);
pal('mnTijolo', ['#170a08', '#2f1410', '#4a1f17', '#662a1f', '#82392a', '#9c4d39']);
pal('mnEscoria', ['#07080a', '#0f1114', '#181b20', '#22262d', '#2e333c', '#3c434e']);
pal('mnQuartzito', ['#2e2a26', '#4a453f', '#6a645b', '#8b8478', '#aca496', '#cbc3b3']);
pal('mnBarreira', ['#0b0b0d', '#16161a', '#24252a', '#36383f', '#4c4f57', '#666a73']);
// back walls: always far darker than the ground in front
pal('mnFerrosaW', ['#0a0605', '#100a08', '#160d0b', '#1d110e', '#251612', '#2d1b16']);
pal('mnTabuadoW', ['#0b0704', '#110b06', '#180f09', '#20140c', '#281a10', '#312014']);
pal('mnCavadaW', ['#0c0908', '#120e0c', '#181310', '#1f1814', '#271e19', '#2f251f']);
pal('mnTijoloW', ['#0c0605', '#140907', '#1d0d0a', '#26110d', '#301611', '#3a1c15']);
pal('mnQuartzitoW', ['#100f0e', '#171513', '#1e1c19', '#26231f', '#2e2b26', '#37332d']);
// the far layer behind the walls
pal('dpMnRocha', ['#060404', '#0a0706', '#0f0a09', '#140e0c', '#19120f', '#1f1613']);
pal('dpMnAndaime', ['#050302', '#0a0604', '#100a06', '#160e09', '#1d130c', '#251910']);
pal('dpMnFornalha', ['#070302', '#0e0604', '#170a06', '#220f08', '#30160b', '#43200e']);

const wrapT = v => ((v % TP) + TP) % TP;
const RAMPX = hexes => hexes.map(h => ph(h));
const GLINT = RAMPX(['#4a4e56', '#7a808c', '#b4bac6', '#e8ecf2']);          // steel-grey specular iron oxide
const JASPER = RAMPX(['#4a1a12', '#6e2818', '#923a22', '#b4522e']);          // the red bands where they catch light
const RUST = RAMPX(['#3a1a0c', '#5e2c12', '#8a4418', '#b06428']);
const IRONC = RAMPX(['#141418', '#26272d', '#3e4048', '#5c5f69', '#868a96']);
const GOLDC = RAMPX(['#6a4a0c', '#a87808', '#f0c43a', '#fff3a0']);
const EMBER = RAMPX(['#5a1404', '#a83a08', '#ff8a20', '#ffd27a']);
const PEB = RAMPX(['#24221f', '#3c3934', '#58544d', '#77726a']);

/* ---- solid ground ---- */
function vFerrosa(x, y) {   // banded iron: thin wavy layers of black oxide and red jasper, gently folded, with steel glints
  const fold = y + cn(x, y, 3, 2, 8001) * 30 + cn(x, y, 7, 4, 8011) * 9 + Math.sin(x * Math.PI / 20) * 0.6 + cn(x, y, 16, 10, 8002) * 2, b = ((fold % 10) + 10) % 10;
  let v = (b < 3 ? 1.5 : b < 3.8 ? 2.4 : b < 5 ? 3.9 : b < 8.6 ? 3.4 : 2.6) + cn(x, y, 6, 24, 8003) * 0.7 + cg(x, y, 8004) * 0.4;
  if (b < 3) {   // the dark iron bands: tiny mirror-like glints
    if (hash2(x, y, 8005) < 0.005) { MATX = GLINT[hash2(x, y, 8006) < 0.2 ? 2 : 1]; return -9; }
    if (b < 0.8) v -= 0.5;
  } else if (b > 4.4 && b < 8.2 && cn(x, y, 8, 30, 8008) > 0.22) { MATX = JASPER[b < 5.2 ? 3 : 2]; return -9; }   // a vivid streak of jasper
  const cr = Math.abs(cn(x, y, 34, 34, 8010)); if (cr < 0.007) v -= 1.6;   // joints across the bands
  return v;
}
function vRejeito(x, y) {   // tailings: grey crushed rock and grit, tipped in heaps, little stones in it
  let v = 2.6 + cn(x, y, 26, 26, 8021) * 1.4 + cn(x, y, 90, 90, 8022) * 0.6 + cg(x, y, 8023) * 0.9;
  const c = cells(x, y, 5, 8024);
  if (c.id < 0.22 && c.d1 < 1.6) { MATX = c.ox + c.oy < -0.3 ? PEB[3] : c.ox + c.oy > 0.5 ? PEB[0] : PEB[c.id < 0.1 ? 2 : 1]; return -9; }
  if (c.id > 0.94 && c.d1 < 1.3) { MATX = RUST[c.ox + c.oy < 0 ? 2 : 1]; return -9; }   // a rusty chip of iron rock
  const tip = ((y + x * 0.5 + cn(x, y, 6, 30, 8025) * 8) % 11 + 11) % 11; if (tip < 0.8) v -= 0.9;   // the slope of the tip
  return v;
}
function vEntulho(x, y) {   // rubble: angular blocks of fallen rock jammed together, dark gaps between them
  const c = cells(x, y, 11, 8031, 1.05), e = c.d2 - c.d1;
  if (e < 0.9) return 0.6 + e;
  let v = 3 + (c.id - 0.5) * 1.6 - c.ox * 0.09 - c.oy * 0.12 + cg(x, y, 8032) * 0.5 + cn(x, y, 20, 20, 8033) * 0.6;
  if (e < 1.8 && c.ox + c.oy < 0) v += 0.8;   // the lit rim of each block
  if (c.id < 0.18 && hash2(x, y, 8034) < 0.05) { MATX = GLINT[2]; return -9; }
  if (c.id > 0.8 && Math.sin((x - y) * 0.6 + c.id * 9) > 0.86) v -= 0.9;   // a banded block
  return v;
}
function vTabua(x, y) {   // mine planks: boards 6 px thick, butt joints staggered, grain, nails at the joints, worn edges
  const row = Math.floor(wrapT(y) / 6), ly = wrapT(y) % 6, L = 40 + (hash2(row, 0, 8041) * 3 | 0) * 8, off = hash2(row, 1, 8042) * TP, lx = wrapT(x + off) % L, board = Math.floor(wrapT(x + off) / L);
  if (ly === 5) return 0.5;                                          // the gap under the board
  if (lx < 1) return 0.9;                                            // a butt joint
  let v = 3.2 + (hash2(board, row, 8043) - 0.5) * 1.1 + (ly === 0 ? 1 : ly === 4 ? -0.7 : 0) + cg(x, y, 8044) * 0.3;
  v += Math.sin((x + off) * 0.21 + Math.sin((x + off) * 0.04 + row) * 3 + ly * 1.4) * 0.45;   // the grain
  const knot = cells(x, y, 30, 8045, 2.5); if (knot.id < 0.12 && knot.d1 < 2.4) v -= 1.3 - knot.d1 * 0.4;
  if ((lx === 2 || lx === L - 3) && ly === 2) { MATX = IRONC[3]; return -9; }   // nail heads
  if ((lx === 2 || lx === L - 3) && ly === 3) { MATX = RUST[0]; return -9; }
  return v;
}
function vViga(x, y) {   // a timber beam: long dark grain, checks along it, an iron strap with rivets every so often
  const sx = wrapT(x) % 48;
  if (sx < 4) {   // the strap
    const rv = (wrapT(y) % 6 === 2) && (sx === 1 || sx === 2);
    MATX = rv ? IRONC[4] : sx === 0 ? IRONC[3] : sx === 3 ? IRONC[0] : (hash2(x, y, 8051) < 0.25 ? RUST[1] : IRONC[2]); return -9;
  }
  let v = 2.8 + cn(x, y, 4, 40, 8052) * 1.6 + Math.sin(y * 1.1 + cn(x, y, 6, 20, 8053) * 6) * 0.45 + cg(x, y, 8054) * 0.25;
  if (Math.abs(cn(x, y, 5, 60, 8055)) < 0.012) v -= 1.6;   // a check (a crack along the grain)
  if (sx === 4) v -= 0.8; if (sx === 47) v -= 0.4;
  return v;
}
function vCavada(x, y) {   // the iron rock scored by picks: sets of short slanted gouges, lit on the upper lip
  let v = vFerrosa(x, y); const c = cells(x, y, 16, 8061, 1);
  const a = c.id < 0.5 ? 0.75 : 2.4, ux = Math.cos(a), uy = Math.sin(a), u = c.ox * ux + c.oy * uy, w = -c.ox * uy + c.oy * ux;
  if (Math.abs(u) < 5.5 && Math.abs(w) < 6) { const g = ((w + 12) % 4 + 4) % 4; if (g < 1.1) { MATX = 0; return 0.4; } if (g < 2) { MATX = 0; return 4.8; } }
  return v === -9 ? v : v - 0.4;
}
function vTijolo(x, y) {   // furnace brick: 12 x 6 courses, each brick its own fire, mortar, soot rising, a crack
  const row = Math.floor(wrapT(y) / 6), ly = wrapT(y) % 6, off = row % 2 ? 6 : 0, lx = wrapT(x + off) % 12, bk = Math.floor(wrapT(x + off) / 12);
  if (ly === 5 || lx === 11) return 0.7 + cg(x, y, 8071) * 0.4;   // mortar
  let v = 3.1 + (hash2(bk, row, 8072) - 0.5) * 1.4 + (ly === 0 ? 0.8 : ly === 4 ? -0.6 : 0) + (lx === 0 ? 0.5 : lx === 10 ? -0.5 : 0) + cg(x, y, 8073) * 0.5;
  const soot = cn(x, y, 10, 4, 8074); if (soot > 0.05) v -= (soot - 0.05) * 7;
  if (Math.abs(cn(x, y, 30, 30, 8075)) < 0.01) v -= 1.6;
  if (hash2(bk, row, 8076) < 0.06 && hash2(x, y, 8077) < 0.3) v += 1.1;   // a glazed brick
  return v;
}
function vEscoria(x, y) {   // slag: black glassy rock full of burst bubbles, rust stains, an ember deep in a crack
  let v = 2.4 + cn(x, y, 40, 40, 8081) * 1.4 + cg(x, y, 8082) * 0.3;
  const b = cells(x, y, 8, 8083); if (b.id < 0.4) { const r = b.d1 / (1.4 + b.id * 4); if (r < 1) { v = r < 0.6 ? 0.6 : 4.4 - r; if (r > 0.6 && b.ox + b.oy < -1) v = 5.2; } }   // bubbles: a dark hole with a glassy rim
  const st = cn(x, y, 12, 30, 8084); if (st > 0.36) { MATX = RUST[st > 0.42 ? 2 : 1]; return -9; }
  const k = Math.abs(cn(x, y, 30, 30, 8085)); if (k < 0.006 && cn(x, y, 60, 60, 8086) > 0.1) { MATX = EMBER[k < 0.003 ? 2 : 1]; return -9; }
  if (Math.abs(cn(x + y, y, 26, 26, 8087)) < 0.01) v = 5;   // a glassy streak
  return v;
}
function vQuartzito(x, y) {   // quartzite: pale and sugary, faint beds, white quartz veins with a fleck of gold
  const bed = ((y + cn(x, y, 4, 8, 8091) * 14) % 13 + 13) % 13;
  let v = 3 + cn(x, y, 40, 40, 8092) * 1.2 + cg(x, y, 8093) * 0.9 + (bed < 1 ? -0.7 : 0);
  if (hash2(x, y, 8094) < 0.1) v += 0.7;   // sugary grain
  const vein = Math.abs(cn(x, y, 36, 36, 8095));
  if (vein < 0.012) { if (hash2(x, y, 8096) < 0.06) { MATX = GOLDC[hash2(x, y, 8097) < 0.4 ? 3 : 2]; return -9; } return 5.4; }
  if (vein < 0.02) v -= 0.6;
  return v;
}
function vBarreira(x, y) {   // the boss hall's gate: heavy iron bars, a crossbar with rivets, rust at the joints
  const bx = wrapT(x) % 6, cy = wrapT(y) % 24;
  if (cy < 4) { let v = cy === 0 ? 4.6 : cy === 3 ? 1.2 : 3.2; if (cy === 1 && bx === 2) v = 5.4; if (hash2(x, y, 8101) < 0.12) { MATX = RUST[2]; return -9; } return v; }
  if (bx > 3) return 0.4;
  let v = bx === 0 ? 4.4 : bx === 1 ? 3.6 : bx === 2 ? 2.8 : 1.6; v += cg(x, y, 8102) * 0.3;
  if (cy < 6 && hash2(x, y, 8103) < 0.4) { MATX = RUST[1]; return -9; }
  return v;
}

/* ---- back walls ---- */
function vFerrosaW(x, y) { const v = vFerrosa(x, y); return v === -9 ? 3.4 : v; }
function vTabuadoW(x, y) {   // a wall of upright boards, 8 px wide, nailed to a batten every 48 px
  const col = Math.floor(wrapT(x) / 8), lx = wrapT(x) % 8, by = wrapT(y + hash2(col, 0, 8111) * 20) % 48;
  if (lx === 7) return 0.5;
  if (by < 5) return by === 0 ? 4.2 : by === 4 ? 1.2 : 3.4 + cg(x, y, 8112) * 0.3;   // the batten across
  let v = 2.9 + (hash2(col, 1, 8113) - 0.5) * 1.2 + (lx === 0 ? 0.7 : lx === 6 ? -0.6 : 0) + Math.sin(y * 0.18 + Math.sin(y * 0.03 + col) * 3 + lx) * 0.4 + cg(x, y, 8114) * 0.3;
  if (hash2(col, Math.floor(wrapT(y) / 60), 8115) < 0.08) v -= 1.2;   // a rotten board
  return v;
}
function vCavadaW(x, y) { const v = vCavada(x, y); return v === -9 ? 3.2 : v; }
function vTijoloW(x, y) { return vTijolo(x, y); }
function vQuartzitoW(x, y) { const v = vQuartzito(x, y); return v === -9 ? 4.6 : v; }

/* ---- far layer ---- */
function vDpMnRocha(x, y) {   // far iron rock: the bands, wide and soft
  const b = ((y + cn(x, y, 4, 6, 8201) * 30) % 26 + 26) % 26; let v = 2.2 + cn(x, y, 30, 30, 8202) * 1.2 + cg(x, y, 8203) * 0.4;
  if (b < 8) v -= 0.8; else if (b < 10) v += 0.6;
  return v;
}
function vDpMnAndaime(x, y) {   // galleries seen far back: scaffold posts, planked levels, cross braces, lamp-lit gaps
  const px = wrapT(x) % 60, py = wrapT(y) % 40, cell = Math.floor(wrapT(x) / 60) + Math.floor(wrapT(y) / 40) * 5;
  if (px < 4) return 3.2 + (px === 0 ? 0.8 : px === 3 ? -0.8 : 0) + cg(x, y, 8211) * 0.3;          // a post
  if (py < 3) return 3.6 + (py === 0 ? 0.8 : -0.4) + cg(x, y, 8212) * 0.3;                         // a planked level
  const d = hash2(cell, 0, 8213) < 0.5 ? px - py * 1.4 : (60 - px) - py * 1.4; if (Math.abs(d - 4) < 1.6) return 2.8;   // a brace
  return vDpMnRocha(x, y) * 0.6 + (hash2(cell, 1, 8214) < 0.15 ? 1.4 - Math.hypot(px - 30, py - 22) / 18 : 0);
}
function vDpMnFornalha(x, y) {   // far furnaces: arched mouths in brick, a dull glow inside
  const ax = wrapT(x) % 80, ay = wrapT(y) % 60, dx = (ax - 40) / 16, dy = (ay - 38) / 22;
  if (dx * dx + (dy < 0 ? dy * dy : 0) < 1 && ay < 54 && ay > 14) return 3.6 + (1 - Math.abs(dx)) * 1.6 - (54 - ay) / 40 + cg(x, y, 8221) * 0.4;   // the mouth
  if (dx * dx + (dy < 0 ? dy * dy : 0) < 1.4 && ay < 56) return 1.0;
  const row = Math.floor(ay / 5), off = row % 2 ? 5 : 0; if (ay % 5 === 4 || (ax + off) % 10 === 9) return 0.8;
  return 2.0 + hash2(Math.floor((ax + off) / 10), row, 8222) * 0.9 + cg(x, y, 8223) * 0.3;
}

/* ---- bake and register ---- */
const BKV = {
  ferrosa: bake(vFerrosa), rejeito: bake(vRejeito), entulho: bake(vEntulho), tabua: bake(vTabua), viga: bake(vViga), cavada: bake(vCavada), tijolo: bake(vTijolo), escoria: bake(vEscoria), quartzito: bake(vQuartzito), barreira: bake(vBarreira),
  ferrosaW: bake(vFerrosaW), tabuadoW: bake(vTabuadoW), cavadaW: bake(vCavadaW), tijoloW: bake(vTijoloW), quartzitoW: bake(vQuartzitoW),
  dpRocha: bake(vDpMnRocha), dpAndaime: bake(vDpMnAndaime), dpFornalha: bake(vDpMnFornalha)
};
const MN_SOLID = [
  // id, palette, texture, dig, map colour
  [MN_FERROSA, 'mnFerrosa', 'ferrosa', 0.75, '#593026'], [MN_REJEITO, 'mnRejeito', 'rejeito', 0.3, '#5a5650'], [MN_ENTULHO, 'mnEntulho', 'entulho', 0.45, '#54473e'],
  [MN_TABUA, 'mnTabua', 'tabua', 0.4, '#7a4f2c'], [MN_VIGA, 'mnViga', 'viga', 0.55, '#472a18'], [MN_CAVADA, 'mnFerrosa', 'cavada', 0.7, '#4a2a22'],
  [MN_TIJOLO, 'mnTijolo', 'tijolo', 0.85, '#82392a'], [MN_ESCORIA, 'mnEscoria', 'escoria', 0.9, '#22262d'], [MN_QUARTZITO, 'mnQuartzito', 'quartzito', 0.8, '#aca496'],
  [MN_BARREIRA, 'mnBarreira', 'barreira', 0, '#4c4f57']
];
for (const [t, p, k, dig, col] of MN_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [MN_FERROSA, MN_REJEITO, MN_ENTULHO, MN_CAVADA, MN_QUARTZITO, MN_ESCORIA]) BLEND[t] = 1;

WMAT[WMN_FERROSA] = [PALS.mnFerrosaW, BKV.ferrosaW]; WMAT[WMN_TABUADO] = [PALS.mnTabuadoW, BKV.tabuadoW]; WMAT[WMN_CAVADA] = [PALS.mnCavadaW, BKV.cavadaW];
WMAT[WMN_TIJOLO] = [PALS.mnTijoloW, BKV.tijoloW]; WMAT[WMN_QUARTZITO] = [PALS.mnQuartzitoW, BKV.quartzitoW];
DMAT[DP_MN_ROCHA] = [PALS.dpMnRocha, BKV.dpRocha]; DMAT[DP_MN_ANDAIME] = [PALS.dpMnAndaime, BKV.dpAndaime]; DMAT[DP_MN_FORNALHA] = [PALS.dpMnFornalha, BKV.dpFornalha];

/* ---- the ores again: coal and iron in the iron rock, gold and crystal in quartzite (same items) ---- */
const MN_ORES = [[MN_O_CARVAO, COAL, 'mnFerrosa', vFerrosa, '#0a0a0e', 0.4, 0.15], [MN_O_FERRO, IRON, 'mnFerrosa', vFerrosa, '#8a3f1c', 0.42, 0.18], [MN_O_OURO, GOLD, 'mnQuartzito', vQuartzito, '#c8a040', 0.24, 0.08], [MN_O_CRISTAL, CRYSTAL, 'mnQuartzito', vQuartzito, '#8a4ae8', 0.36, 0.12]];
for (const [t, o, p, fn, tint, a1, a2] of MN_ORES) {
  ORE_PAINT[t] = ORE_PAINT[o]; ORE_HALO[t] = { pal: [p, tint, a1, a2], shade: 0, drip: ORE_HALO[o].drip };
  MAT[t] = [PALS[p], bakeOre(t, fn)]; SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1;
  DIG[t] = DIG[o]; ORE_XP[t] = ORE_XP[o]; ORE_NAME[t] = ORE_NAME[o]; PCOL[t] = PCOL[o]; ORE_ITEM[t] = ORE_ITEM[o];
}
EMIT[MN_O_CRISTAL] = EMIT[CRYSTAL];

/* ---- block items ---- */
const MN_ITEMS = {
  rocha_ferrosa: ['Rocha Ferrosa', MN_FERROSA, 'Faixas pretas e vermelhas, pesada de ferro. Os mineiros cavaram atrás dela.'],
  rejeito: ['Rejeito', MN_REJEITO, 'Pedra moída que os mineiros jogavam fora. Cava num instante.'],
  tabua_mina: ['Tábua de Mina', MN_TABUA, 'Tábua grossa, pregada com cravos de ferro. Vira piso e andaime.'],
  viga_mina: ['Viga de Mina', MN_VIGA, 'Viga escura com cinta de ferro. Segurou o teto por cem anos.'],
  tijolo_fornalha: ['Tijolo de Fornalha', MN_TIJOLO, 'Tijolo cozido no fogo das fornalhas, preto de fuligem.'],
  escoria: ['Escória', MN_ESCORIA, 'O que sobrou do minério derretido. Preta, vidrada e dura.'],
  quartzito: ['Quartzito', MN_QUARTZITO, 'Pedra clara e áspera. Às vezes brilha um pontinho de ouro.']
};
for (const id in MN_ITEMS) { const [name, block, desc] = MN_ITEMS[id]; ITEMS[id] = { name, rar: 0, stack: 99, block, desc }; BLOCK_DROP[block] = id; }
BLOCK_DROP[MN_ENTULHO] = 'rocha_ferrosa'; BLOCK_DROP[MN_CAVADA] = 'rocha_ferrosa';

/* ================= decorations: 12x12 sprites on ramps ================= */
const DRM = {
  madeira: ['#140b05', '#26160a', '#3c2412', '#56361c', '#724a28', '#8e6036', '#aa7a48'],
  ferro: ['#0e0e11', '#1c1c21', '#2e2f36', '#44464f', '#5e616c', '#7c808c', '#a2a6b2'],
  latao: ['#2a1a06', '#4a300c', '#6e4a14', '#966820', '#bc8a30', '#dcae4a', '#f4d27a'],
  vidro: ['#5a2004', '#8a3a08', '#c26014', '#f08a24', '#ffb04a', '#ffd88a', '#fff4d0'],
  corda: ['#1e160c', '#33261a', '#4c3a26', '#665034', '#806844', '#9a8058', '#b49a70'],
  pedra: ['#140c0b', '#271614', '#3e211c', '#593026', '#764233', '#925845', '#ae7058'],
  brasa: ['#0a0808', '#1a1210', '#2a1a14', '#5a1404', '#a83a08', '#ff8a20', '#ffd27a'],
  osso: ['#2a2620', '#46403a', '#665e54', '#8a8072', '#aea290', '#cec2ae', '#ece2cc'],
  pano: ['#1a0e0c', '#2e1814', '#48241c', '#643024', '#7e402e', '#985238', '#b0664a']
};
for (const k in DRM) DRM[k] = DRM[k].map(h => ph(h));
const flipY = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[(T - 1 - y) * T + x]; return b; };
const rimOut = (a, o) => { const b = a.slice(); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (!b[k] && ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (y > 0 && b[k - T]) || (y < T - 1 && b[k + T]))) a[k] = o; } return a; };
const spr = () => { const a = new Uint32Array(T * T); a.put = (x, y, R, v) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = dPix(R, v); }; return a; };

/* a timber prop: a square post with a footing wedge at the floor and a cap piece under the roof */
function propPiece(k, s) {   // 0 foot, 1 shaft, 2 head
  const a = spr(), W = DRM.madeira;
  for (let y = 0; y < T; y++) for (let x = 3; x <= 8; x++) {
    const u = (x - 3) / 5; let v = 4.4 - u * 2.6 + Math.sin(y * 0.8 + x * 1.7 + s) * 0.25 + cg(x, y, s) * 0.35;
    if (x === 5 && hash2(y, k, s) < 0.3) v -= 0.9;   // a check in the grain
    a.put(x, y, W, v);
  }
  if (k === 0) { for (let x = 1; x <= 10; x++) for (let y = 9; y < 12; y++) a.put(x, y, DRM.pedra, 3.6 - (y - 9) * 0.7 - x * 0.08 + cg(x, y, s) * 0.5); for (let x = 2; x <= 9; x++) a.put(x, 8, W, x < 3 ? 5 : 3.4); }   // a flat stone and a wedge
  if (k === 2) { for (let x = 0; x < T; x++) for (let y = 0; y < 3; y++) a.put(x, y, W, (y === 0 ? 4.6 : y === 2 ? 1.8 : 3.4) - x * 0.06 + cg(x, y, s) * 0.3); a.put(1, 1, DRM.ferro, 5); a.put(10, 1, DRM.ferro, 4); }   // the cap
  if (k === 1 && s % 3 === 0) { a.put(3, 5, DRM.ferro, 4.6); a.put(8, 5, DRM.ferro, 3); for (let x = 4; x <= 7; x++) a.put(x, 5, DRM.ferro, 3.6); }   // an iron band
  return rimOut(a, W[0]);
}
const ESCORA = [propPiece(0, 8301), propPiece(1, 8302), propPiece(2, 8303), propPiece(1, 8304)];
DECO[MN_ESCORA] = ESCORA; DIG[MN_ESCORA] = 0.45; PCOL[MN_ESCORA] = '#724a28'; CV_HANGS[MN_ESCORA] = 1; CV_STANDS[MN_ESCORA] = 1; BLOCK_DROP[MN_ESCORA] = 'madeira';
DECO_PICK[MN_ESCORA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== MN_ESCORA ? arr[0] : tileAt(gx, gy - 1) !== MN_ESCORA ? arr[2] : arr[hash2(gx, gy, 8305) < 0.25 ? 3 : 1];

/* rails on the gallery floor: an iron rail on wooden sleepers, seamless from block to block */
function railSprite(s) {
  const a = spr();
  for (const sx of [1, 7]) for (let x = sx; x < sx + 4; x++) for (let y = 10; y < 12; y++) a.put(x, y, DRM.madeira, (y === 10 ? 3.6 : 2.2) - (x - sx) * 0.3 + cg(x, y, s) * 0.5);   // sleeper ends
  for (let x = 0; x < T; x++) { a.put(x, 8, DRM.ferro, 5.2 + (hash2(x, 0, s) < 0.2 ? 0.8 : 0)); a.put(x, 9, DRM.ferro, hash2(x, 1, s) < 0.25 ? 1 : 2.6); }   // the rail head and web
  for (const sx of [2, 8]) { a.put(sx, 10, DRM.ferro, 3.4); a.put(sx + 1, 10, DRM.ferro, 2.4); }   // spikes
  if (s % 2) for (let x = 0; x < T; x++) if (hash2(x, 2, s) < 0.3) a.put(x, 9, DRM.pedra, 2);   // rust
  return a;
}
const TRILHO = [railSprite(8311), railSprite(8312)];

/* a miner's lantern on a hook: a short chain, a tin cap, glass glowing amber, a brass base */
function lampSprite(s) {
  const a = spr();
  for (let y = 0; y < 3; y++) a.put(5 + (y % 2), y, DRM.ferro, 4 - y * 0.4);
  for (let x = 3; x <= 8; x++) a.put(x, 3, DRM.ferro, 4.4 - (x - 3) * 0.4);                 // cap
  a.put(5, 3, DRM.ferro, 5.6);
  for (let y = 4; y <= 8; y++) for (let x = 3; x <= 8; x++) {
    if (x === 3 || x === 8) { a.put(x, y, DRM.latao, x === 3 ? 4.4 : 2.6); continue; }      // frame
    const g = 6 - Math.hypot(x - 5.5, y - 6.2) * 1.1; a.put(x, y, DRM.vidro, g + (x === 4 && y === 5 ? 1 : 0));   // the flame behind the glass
  }
  for (let x = 2; x <= 9; x++) a.put(x, 9, DRM.latao, 4.6 - (x - 2) * 0.3);
  for (let x = 3; x <= 8; x++) a.put(x, 10, DRM.latao, 2.4);
  return rimOut(a, DRM.ferro[0]);
}
const LAMPIAO = [lampSprite(8321)];

/* a ladder: two side rails and rungs every 4 px, seamless up and down */
function ladderSprite(s) {
  const a = spr();
  for (let y = 0; y < T; y++) for (const [x, v] of [[1, 4.6], [2, 2.8], [9, 4.4], [10, 2.6]]) a.put(x, y, DRM.madeira, v + Math.sin(y * 0.9 + x + s) * 0.3 + cg(x, y, s) * 0.3);
  for (const ry of [2, 6, 10]) { for (let x = 3; x <= 8; x++) { a.put(x, ry, DRM.madeira, 4.2 - (x - 3) * 0.15 + cg(x, ry, s) * 0.4); a.put(x, ry + 1, DRM.madeira, 1.4); } }
  if (s % 2) { a.put(2, 6, DRM.ferro, 4.4); a.put(9, 2, DRM.ferro, 4.4); }   // nails
  return a;
}
const ESCADA = [ladderSprite(8331), ladderSprite(8332)];

/* tools left lying: a pick on the floor, a shovel leaning on nothing, a dented bucket */
function toolSprite(k, s) {
  const a = spr();
  if (k === 0) {   // pick, handle along the floor, head standing up
    for (let x = 1; x < 9; x++) { a.put(x, 10, DRM.madeira, 4 - x * 0.1); a.put(x, 11, DRM.madeira, 2); }
    for (let y = 4; y < 11; y++) { const c = 9 + Math.round((y - 7) * (y < 7 ? -0.5 : 0.2)); a.put(c, y, DRM.ferro, y < 6 ? 5.4 - y * 0.2 : 3.6); a.put(c + 1, y, DRM.ferro, 2.4); }
    a.put(8, 4, DRM.ferro, 4.6); a.put(11, 10, DRM.ferro, 3);
  } else if (k === 1) {   // shovel lying, blade up a little
    for (let x = 0; x < 7; x++) { a.put(x, 9 + (x > 4 ? 0 : 1), DRM.madeira, 4 - x * 0.1); a.put(x, 10 + (x > 4 ? 0 : 1), DRM.madeira, 1.8); }
    a.put(0, 9, DRM.madeira, 3); a.put(0, 8, DRM.madeira, 3.4);
    for (let y = 6; y < 11; y++) for (let x = 7; x < 11; x++) if (!(y === 6 && (x === 7 || x === 10))) a.put(x, y, DRM.ferro, 4.6 - (x - 7) * 0.5 - (y - 6) * 0.3 + (hash2(x, y, s) < 0.2 ? -1.4 : 0));
    a.put(8, 11, DRM.ferro, 2.4); a.put(9, 11, DRM.ferro, 2);
  } else {   // bucket
    for (let y = 6; y < 12; y++) { const hw = 3 - (y - 6) * 0.12; for (let x = Math.round(5.5 - hw); x <= Math.round(5.5 + hw); x++) a.put(x, y, DRM.ferro, 4.4 - (x - 2) * 0.45 + (y === 8 || y === 10 ? -0.8 : 0) + (hash2(x, y, s) < 0.12 ? -1.4 : 0)); }
    for (let x = 2; x <= 9; x++) a.put(x, 5, DRM.ferro, 5.2);
    for (const [x, y] of [[2, 4], [3, 3], [4, 2], [5, 2], [6, 2], [7, 2], [8, 3], [9, 4]]) a.put(x, y, DRM.ferro, 3.4);   // the handle
  }
  return rimOut(a, DRM.ferro[0]);
}
const FERRAMENTAS = [toolSprite(0, 8341), toolSprite(1, 8342), toolSprite(2, 8343)];

/* a heap of stones from the iron rock */
function stonesSprite(s) {
  const a = spr();
  const rock = (cx, cy, rx, ry, sd) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1 + (hash2(x, y, sd) - 0.5) * 0.4) continue; a.put(x, y, DRM.pedra, 4.6 - (dx + dy) * 1.4 + cg(x, y, sd) * 0.6 + (Math.sin((x - y) * 1.3) > 0.7 ? -0.9 : 0)); } };
  if (s % 2) { rock(3.5, 9.5, 3, 2.6, s); rock(8.5, 10, 3, 2.2, s + 1); rock(6, 7, 2.4, 2.2, s + 2); } else { rock(4, 10, 3.4, 2.2, s); rock(9, 9.5, 2.2, 2.6, s + 1); rock(1.2, 10.8, 1.2, 1.2, s + 2); }
  return rimOut(a, DRM.pedra[0]);
}
const PEDRAS = [stonesSprite(8351), stonesSprite(8352)];

/* a rope hanging down a shaft: twisted strands; the last piece ends in a knot */
function ropeSprite(end, s) {
  const a = spr(), len = end ? 9 : 12;
  for (let y = 0; y < len; y++) for (let x = 5; x <= 6; x++) { const tw = ((y + (x === 5 ? 0 : 2)) % 4); a.put(x, y, DRM.corda, (x === 5 ? 4.4 : 2.8) + (tw === 0 ? 1.2 : tw === 2 ? -0.8 : 0)); }
  if (end) { for (let y = 8; y < 11; y++) for (let x = 4; x <= 7; x++) a.put(x, y, DRM.corda, 4 - (x - 4) * 0.6 - (y - 8) * 0.4); a.put(4, 11, DRM.corda, 2.6); a.put(7, 11, DRM.corda, 2.2); a.put(6, 11, DRM.corda, 3); }
  return rimOut(a, DRM.corda[0]);
}
const CORDA = [ropeSprite(false, 8361), ropeSprite(true, 8362)];

/* a lump of slag that hasn't cooled: black crust cracked over orange */
function emberSprite(s) {
  const a = spr();
  for (let y = 5; y < T; y++) for (let x = 1; x < 11; x++) {
    const dx = (x + 0.5 - 6) / 5, dy = (y + 0.5 - 11.5) / 6.2; if (dx * dx + dy * dy > 1 + (hash2(x, y, s) - 0.5) * 0.3) continue;
    const c = cells(x * 3, y * 3, 9, s); a.put(x, y, DRM.brasa, c.d2 - c.d1 < 2.2 ? 5 + (c.d2 - c.d1 < 1 ? 1 : 0) : 2 - dx * 0.8 - dy * 0.4 + cg(x, y, s) * 0.5);
  }
  return rimOut(a, DRM.brasa[0]);
}
const BRASA = [emberSprite(8371), emberSprite(8372)];

/* a goblin skull on a stick (marking their ground), a rag tied under it */
function stakeSprite(s) {
  const a = spr();
  for (let y = 4; y < T; y++) { a.put(5, y, DRM.madeira, 4); a.put(6, y, DRM.madeira, 2.4); }
  for (let y = 0; y < 5; y++) for (let x = 2; x <= 9; x++) { const dx = (x + 0.5 - 6) / 4, dy = (y + 0.5 - 2.6) / 2.6; if (dx * dx + dy * dy > 1) continue; a.put(x, y, DRM.osso, 5 - dx * 1.2 - dy * 0.8); }
  a.put(4, 2, DRM.osso, 0.4); a.put(7, 2, DRM.osso, 0.4); a.put(4, 1, DRM.osso, 1); a.put(7, 1, DRM.osso, 1);                       // the big eye holes
  a.put(1, 1, DRM.osso, 4); a.put(0, 0, DRM.osso, 3.6); a.put(10, 1, DRM.osso, 3.4); a.put(11, 0, DRM.osso, 3);                    // the long ears' stubs
  a.put(5, 4, DRM.osso, 4.6); a.put(7, 4, DRM.osso, 4.2);                                                                         // fangs
  for (let y = 5; y < 9; y++) a.put(7 + (y > 6 ? 1 : 0), y, DRM.pano, 4 - y * 0.2); a.put(4, 5, DRM.pano, 3.2); a.put(4, 6, DRM.pano, 2.6);   // the rag
  return rimOut(a, DRM.madeira[0]);
}
const ESTACA = [stakeSprite(8381)];

DECO[MN_TRILHO] = TRILHO; DECO[MN_LAMPIAO] = LAMPIAO; DECO[MN_ESCADA] = ESCADA; DECO[MN_FERRAMENTA] = FERRAMENTAS; DECO[MN_PEDRAS] = PEDRAS; DECO[MN_CORDA] = CORDA; DECO[MN_BRASA] = BRASA; DECO[MN_ESTACA] = ESTACA;
DIG[MN_TRILHO] = 0.2; DIG[MN_LAMPIAO] = 0.1; DIG[MN_ESCADA] = 0.25; DIG[MN_FERRAMENTA] = 0.05; DIG[MN_PEDRAS] = 0.08; DIG[MN_CORDA] = 0.1; DIG[MN_BRASA] = 0.15; DIG[MN_ESTACA] = 0.08;
PCOL[MN_TRILHO] = '#5e616c'; PCOL[MN_LAMPIAO] = '#f08a24'; PCOL[MN_ESCADA] = '#8e6036'; PCOL[MN_FERRAMENTA] = '#5e616c'; PCOL[MN_PEDRAS] = '#593026'; PCOL[MN_CORDA] = '#806844'; PCOL[MN_BRASA] = '#ff8a20'; PCOL[MN_ESTACA] = '#cec2ae';
EMIT[MN_LAMPIAO] = 0.85; EMIT[MN_BRASA] = 0.45;
for (const t of [MN_LAMPIAO, MN_CORDA]) CV_HANGS[t] = 1;
for (const t of [MN_TRILHO, MN_FERRAMENTA, MN_PEDRAS, MN_BRASA, MN_ESTACA]) CV_STANDS[t] = 1;
BLOCK_DROP[MN_ESCADA] = 'madeira'; BLOCK_DROP[MN_PEDRAS] = 'rocha_ferrosa';
DECO_PICK[MN_CORDA] = (gx, gy, arr) => tileAt(gx, gy + 1) === MN_CORDA ? arr[0] : arr[1];
DECO_PICK[MN_TRILHO] = (gx, gy, arr) => arr[(gx & 3) === 1 ? 1 : 0];
DECO_PICK[MN_ESCADA] = (gx, gy, arr) => arr[hash2(gx, gy, 8333) < 0.2 ? 1 : 0];

// ladders and ropes are climbed like the cathedral's chains (W and S, Space lets go)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, MN_ESCADA) || _tt(e, MN_CORDA))); }; }

Object.assign(MNART, { cg, cn, cells, DRM, dPix, vFerrosa, vQuartzito, vTijolo, vEscoria, GLINT, RUST, IRONC, GOLDC, EMBER });
}
