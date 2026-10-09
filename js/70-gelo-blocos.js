'use strict';

/* ================= the ice caves: blocks, back walls, far layer, decorations =================
   Cold ground only: the cathedral's limestone with frost in every crack, frozen earth and gravel (permafrost)
   glinting with ice lenses, slate-blue rock veined with ice, soft snow and packed snow laid down in wind-drift
   beds, white ice full of trapped bubbles and long cracks, the deep translucent blue ice of the great halls
   (old, with conchoidal fractures and diagonal glints, and a faint light of its own), and the near-black ancient
   ice of the Coração, crazed with electric-blue cracks. Iron and gold come back set in frozen rock; crystal, in
   black ice. Ice is slippery (IC_SLIP; 73 makes the hero slide on it). Like 53-caverna-blocos, every material
   is a seamless 240x240 texture sampled in world pixels; outline, lit edge, shade and ambient occlusion come from
   07-chunks-luz. Small decorations (icicles, ice stalagmites, glowing ice crystals on the floor and hanging from
   the roof, snow mounds, frozen bones) are 12x12 sprites on ramps lit from the top left. Ids: 69-gelo-api. */
const ICART = {};   // helpers shared with 71-gelo-objetos and 72-gelo-bichos
{
const { cg, cn, cells, dPix, cvSprite } = CVART;
/* ---- palettes: 6 shades, dark to light ---- */
pal('icNeve', ['#3c4a5e', '#5c6e86', '#8297b0', '#a9bdd2', '#cddcea', '#eef6fc']);
pal('icGelo', ['#1c3a54', '#2c5878', '#457ea2', '#6ea6c6', '#a0cbe2', '#d6eef9']);
pal('icAzul', ['#071a36', '#0d2c56', '#15437c', '#2063a4', '#3889c8', '#78c0ea']);
pal('icPerma', ['#1c1a1c', '#2d2a2b', '#413c3b', '#56504d', '#6d6662', '#857e78']);
pal('icRocha', ['#121820', '#1f2834', '#2f3b4a', '#415062', '#556679', '#6c8094']);
pal('icNegro', ['#04070d', '#090f18', '#101927', '#182537', '#213349', '#2c445d']);
pal('icCalc', ['#2c2f34', '#45494f', '#60656b', '#7c8288', '#9aa0a5', '#b7bdc1']);
// back walls: always far darker than the ground in front
pal('icCalcW', ['#0d0e10', '#131417', '#191b1e', '#1f2226', '#26292e', '#2d3136']);
pal('icRochaW', ['#080b0f', '#0d1117', '#12171f', '#171e28', '#1d2531', '#232d3b']);
pal('icGeloW', ['#050d18', '#081424', '#0c1c31', '#10253f', '#152f4e', '#1b3a5e']);
pal('icNeveW', ['#0e1218', '#141a22', '#1b222c', '#222b37', '#2a3442', '#323e4e']);
pal('icNegroW', ['#020408', '#04070c', '#060a12', '#090e18', '#0c131f', '#101827']);
// the far layer behind the walls
pal('dpIcRocha', ['#06080b', '#0a0d12', '#0e1219', '#121821', '#171e29', '#1c2532']);
pal('dpIcGelo', ['#040a13', '#06101d', '#091628', '#0c1d34', '#102541', '#152e4f']);
pal('dpIcNegro', ['#020306', '#03050a', '#05080f', '#070b14', '#0a0f1a', '#0d1421']);

const wrapT = v => ((v % TP) + TP) % TP;
const FROST = ['#7f9cb2', '#a9c6da', '#d2e8f4', '#f2fbff'].map(h => ph(h));
const LENS = ['#5a7e98', '#8cb6d0', '#c8e6f6'].map(h => ph(h));
const CRACKB = ['#1c5e9c', '#2f8ad0', '#5ec0f4', '#b8ecff'].map(h => ph(h));
const PEB = ['#2c2a2a', '#45403e', '#625b56', '#807870'].map(h => ph(h));

/* ---- solid ground ---- */
function vNeve(x, y) {   // soft snow: wind-drift beds, faint ripples, glints of light on the crystals
  const drift = y + cn(x, y, 60, 8, 7001) * 16 + Math.sin(x / 19) * 2, bed = ((drift % 9) + 9) % 9;
  let v = 3.5 + cn(x, y, 50, 30, 7002) * 0.9 + cg(x, y, 7003) * 0.35;
  if (bed < 0.8) v -= 0.7; else if (bed < 1.6) v += 0.35;
  if (hash2(x, y, 7004) < 0.012) { MATX = FROST[3]; return -9; }   // a sparkle
  if (hash2(x, y, 7005) < 0.03) v -= 0.6;
  return v;
}
function vNeveDura(x, y) {   // packed snow: thin compressed layers, a grey line of grit here and there, harder shadows
  const tilt = y + cn(x, y, 40, 6, 7011) * 10, bed = ((tilt % 6) + 6) % 6;
  let v = 3.0 + cn(x, y, 30, 30, 7012) * 1.0 + cg(x, y, 7013) * 0.35 + (bed < 0.9 ? -0.8 : bed < 1.8 ? 0.4 : 0);
  if (Math.abs(cn(x, y, 80, 5, 7014)) < 0.012) v -= 1.4;   // a dirty layer
  const c = cells(x, y, 10, 7015); if (c.d2 - c.d1 < 0.7) v -= 0.6;   // the snow cracks in plates
  if (hash2(x, y, 7016) < 0.008) { MATX = FROST[3]; return -9; }
  return v;
}
function vGelo(x, y) {   // white-blue ice: bubbles caught in it, long straight cracks, cloudy streaks
  let v = 3.0 + cn(x, y, 70, 40, 7021) * 1.2 + cn(x, y, 24, 90, 7022) * 0.7 + cg(x, y, 7023) * 0.25;
  const streak = cn(x * 0.4 + y, y, 40, 8, 7024); if (streak > 0.16) v += 0.7;
  const k1 = Math.abs(cn(x + y * 0.9, y, 60, 60, 7025)), k2 = Math.abs(cn(x - y * 0.5, y, 44, 44, 7026));
  if (k1 < 0.008 || k2 < 0.006) v = 4.9;   // the cracks shine white
  else if (k1 < 0.016) v -= 0.6;
  const b = cells(x, y, 9, 7027); if (b.id < 0.18) { const r = b.d1 / (1 + b.id * 8); if (r < 1.1) v = r < 0.5 && b.ox + b.oy < 0 ? 5.4 : r < 0.75 ? 1.6 : 4.4; }   // a bubble: rim, shadow, spark
  return v;
}
function vGeloAzul(x, y) {   // the old blue ice: deep and smooth, fractured in shells, glints running down at a slant
  let v = 2.6 + cn(x, y, 90, 90, 7031) * 1.6 + cn(x, y, 30, 30, 7032) * 0.5 + cg(x, y, 7033) * 0.18;
  const sh = cells(x, y, 26, 7034, 0.9); const ring = sh.d1 % 7; if (ring < 0.8) v += 0.9; else if (ring < 1.6) v -= 0.4;   // conchoidal fractures
  if (sh.d2 - sh.d1 < 0.8) v -= 1.0;
  const g = wrapT(x + y * 0.6 + cn(x, y, 20, 20, 7035) * 12) % 48; if (g < 2.2) v += 1.6 - g * 0.4; else if (g > 46.5) v += 0.5;   // diagonal glints
  if (hash2(x, y, 7036) < 0.004) { MATX = FROST[3]; return -9; }
  return v;
}
function vPerma(x, y) {   // permafrost: frozen earth and gravel; lenses of clear ice and a rime of frost in the cracks
  let v = 2.5 + cn(x, y, 30, 30, 7041) * 1.6 + cn(x, y, 100, 100, 7042) * 0.7 + cg(x, y, 7043) * 0.7;
  const c = cells(x, y, 6, 7044);
  if (c.id < 0.16 && c.d1 < 1.7) { MATX = c.ox + c.oy < -0.3 ? PEB[3] : c.ox + c.oy > 0.5 ? PEB[0] : PEB[c.id < 0.08 ? 2 : 1]; return -9; }   // a pebble lit from the top left
  const lens = cn(x, y, 22, 7, 7045); if (lens > 0.3) { MATX = LENS[lens > 0.4 ? 2 : lens > 0.35 ? 1 : 0]; return -9; }   // an ice lens
  const cr = Math.abs(cn(x, y, 18, 18, 7046)); if (cr < 0.01) { MATX = FROST[hash2(x, y, 7047) < 0.5 ? 1 : 2]; return -9; } else if (cr < 0.018) v -= 0.8;
  if (hash2(x, y, 7048) < 0.025) v -= 1.2;
  return v;
}
function vRochaGel(x, y) {   // slate-blue rock in tilted beds, veins of ice in the joints, frost on the knobs
  const tilt = y - x * 0.18 + cn(x, y, 6, 4, 7051) * 12, bed = ((tilt % 16) + 16) % 16;
  let v = 2.5 + cn(x, y, 30, 30, 7052) * 1.6 + cn(x, y, 96, 96, 7053) * 0.7 + cg(x, y, 7054) * 0.6;
  if (bed < 1) v -= 1.1; else if (bed < 2.2) v += 0.6;
  const vein = Math.abs(cn(x, y, 26, 26, 7055)); if (vein < 0.009) { MATX = LENS[vein < 0.004 ? 2 : 1]; return -9; } else if (vein < 0.016) v -= 0.9;
  const k = cells(x, y, 20, 7056, 1); if (k.id < 0.35) { const r = k.d1 / 7; if (r < 1) { v += (1 - r) * 0.8 - (k.ox + k.oy) * 0.05; if (r < 0.5 && k.oy < -2 && hash2(x, y, 7057) < 0.5) { MATX = FROST[1]; return -9; } } }
  if (hash2(x, y, 7058) < 0.02) v -= 1.1;
  return v;
}
function vGeloNegro(x, y) {   // ancient black ice: almost no light gets in; a web of electric-blue cracks, a few deep glints
  let v = 2.4 + cn(x, y, 60, 60, 7061) * 1.4 + cn(x, y, 20, 20, 7062) * 0.4 + cg(x, y, 7063) * 0.25;
  const c = cells(x, y, 18, 7064, 1); const e = c.d2 - c.d1;
  if (e < 0.55 && hash2(Math.floor(x / 3), Math.floor(y / 3), 7065) < 0.7) { MATX = CRACKB[e < 0.25 ? 2 : 1]; return -9; }   // the cracks
  if (e < 1.2) v -= 0.9;
  const k = Math.abs(cn(x + y, y, 50, 50, 7066)); if (k < 0.006) { MATX = CRACKB[3]; return -9; }
  if (hash2(x, y, 7067) < 0.003) { MATX = CRACKB[2]; return -9; }
  return v;
}
function vCalcGelo(x, y) {   // the crypts' limestone, frozen: rough pale stone, its cracks and hollows filled with frost
  let v = 2.5 + cn(x, y, 30, 30, 7071) * 2.1 + cn(x, y, 90, 90, 7072) * 0.9 + cg(x, y, 7073) * 0.8;
  const cr = Math.abs(cn(x, y, 22, 22, 7074)); if (cr < 0.014) { MATX = FROST[hash2(x, y, 7075) < 0.4 ? 2 : 1]; return -9; }
  const hol = cn(x, y, 14, 14, 7076); if (hol > 0.3 && hash2(x, y, 7077) < (hol - 0.3) * 6) { MATX = FROST[hol > 0.38 ? 3 : 2]; return -9; }   // rime in the hollows
  if (hash2(x, y, 7078) < 0.02) v += 1.3;
  return v;
}
function vVeio(x, y) {   // a seam of glowing ice in the blue: brighter, with a bright core line
  const v = vGeloAzul(x, y); if (v === -9) return v;
  const core = Math.abs(cn(x, y, 30, 30, 7081)); return core < 0.03 ? 5.6 : v + 1.4;
}
function vBarreira(x, y) {   // the boss hall's wall of ice: thick, clear, layered, with frost feathers
  const lay = (y + cn(x, y, 30, 6, 7091) * 8) % 10;
  let v = 3.2 + cn(x, y, 40, 40, 7092) * 0.9 + (lay < 1 ? 1.2 : 0) + cg(x, y, 7093) * 0.3;
  const f = Math.abs(cn(x + y * 0.5, y, 8, 8, 7094)); if (f < 0.02) v = 5.4;
  return v;
}

/* ---- back walls ---- */
function vCalcW(x, y) { const v = vCalcGelo(x, y); return v === -9 ? 3.8 : v; }
function vRochaW(x, y) { const v = vRochaGel(x, y); return v === -9 ? 3.4 : v; }
function vGeloW(x, y) {   // blue ice in thick horizontal sheets, seen behind: a few glints
  const lay = ((y + cn(x, y, 50, 8, 7101) * 14) % 22 + 22) % 22;
  let v = 2.6 + cn(x, y, 80, 40, 7102) * 1.4 + (lay < 1.2 ? 1 : lay < 2.2 ? -0.6 : 0) + cg(x, y, 7103) * 0.25;
  const g = wrapT(x + y * 0.6) % 40; if (g < 1.6) v += 1.1;
  return v;
}
function vNeveW(x, y) { const v = vNeveDura(x, y); return v === -9 ? 4 : v * 0.95; }
function vNegroW(x, y) { const v = vGeloNegro(x, y); return v === -9 ? 4.6 : v; }

/* ---- far layer ---- */
function vDpIcRocha(x, y) {   // far rock in thick layers with frost lines
  const bed = (y - x * 0.12 + cn(x, y, 5, 3, 7201) * 18) % 28; let v = 2.4 + cn(x, y, 24, 24, 7202) * 1.4 + cg(x, y, 7203) * 0.5;
  if (bed < 1.4) v += 1.2; else if (bed < 3) v -= 0.6;
  return v;
}
function vDpIcGelo(x, y) {   // far walls of glacier: tall vertical seracs, lit edges
  const k = Math.floor(wrapT(x + cn(x, y, 6, 40, 7211) * 30) / 20), lx = wrapT(x + cn(x, y, 6, 40, 7211) * 30) % 20;
  let v = 2.2 + hash2(k, 0, 7212) * 1.4 + cn(x, y, 40, 40, 7213) * 0.8 + cg(x, y, 7214) * 0.3;
  if (lx < 1.2) v += 1.6; else if (lx > 18) v -= 1.2;
  return v;
}
function vDpIcSincelos(x, y) {   // a forest of icicles far back: slender cones hanging in rows every 60 px
  const row = Math.floor(wrapT(y) / 60), ly = wrapT(y) % 60, k = Math.floor(wrapT(x + row * 17) / (TP / 16)), lx = wrapT(x + row * 17) % (TP / 16);
  const len = 22 + hash2(k, row % 4, 7221) * 32, half = (1 - ly / len) * (2 + hash2(k, row % 4, 7222) * 3), c = TP / 32;
  if (ly < len && Math.abs(lx - c) < half) return 3.6 - (lx - c) / Math.max(1, half) * 1.4 - ly / len * 0.6 + cg(x, y, 7223) * 0.3;
  return vDpIcGelo(x, y) * 0.55;
}
function vDpIcNegro(x, y) { let v = 2.2 + cn(x, y, 40, 40, 7231) * 1.2 + cg(x, y, 7232) * 0.3; const c = cells(x, y, 24, 7233, 1); if (c.d2 - c.d1 < 0.6) v += 2.2; return v; }

/* ---- bake and register ---- */
const BKV = {
  neve: bake(vNeve), neveDura: bake(vNeveDura), gelo: bake(vGelo), azul: bake(vGeloAzul), perma: bake(vPerma), rocha: bake(vRochaGel), negro: bake(vGeloNegro), calc: bake(vCalcGelo), veio: bake(vVeio), barreira: bake(vBarreira),
  calcW: bake(vCalcW), rochaW: bake(vRochaW), geloW: bake(vGeloW), neveW: bake(vNeveW), negroW: bake(vNegroW),
  dpRocha: bake(vDpIcRocha), dpGelo: bake(vDpIcGelo), dpSinc: bake(vDpIcSincelos), dpNegro: bake(vDpIcNegro)
};
const IC_SOLID = [
  // id, palette, texture, dig, map colour
  [IC_NEVE, 'icNeve', 'neve', 0.15, '#cddcea'], [IC_NEVE_DURA, 'icNeve', 'neveDura', 0.28, '#a9bdd2'], [IC_GELO, 'icGelo', 'gelo', 0.45, '#a0cbe2'],
  [IC_GELO_AZUL, 'icAzul', 'azul', 0.6, '#2063a4'], [IC_PERMA, 'icPerma', 'perma', 0.5, '#56504d'], [IC_ROCHA, 'icRocha', 'rocha', 0.7, '#415062'],
  [IC_GELO_NEGRO, 'icNegro', 'negro', 0.95, '#182537'], [IC_CALC_GELO, 'icCalc', 'calc', 0.6, '#9aa0a5'], [IC_VEIO, 'icAzul', 'veio', 0.6, '#78c0ea'], [IC_BARREIRA, 'icGelo', 'barreira', 0, '#d6eef9']
];
for (const [t, p, k, dig, col] of IC_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [IC_NEVE, IC_NEVE_DURA, IC_GELO, IC_GELO_AZUL, IC_PERMA, IC_ROCHA, IC_GELO_NEGRO, IC_CALC_GELO, IC_VEIO]) BLEND[t] = 1;
for (const t of [IC_GELO, IC_GELO_AZUL, IC_GELO_NEGRO, IC_VEIO, IC_BARREIRA]) IC_SLIP[t] = 1;
EMIT[IC_GELO_AZUL] = 0.13; EMIT[IC_VEIO] = 0.55;   // the old blue ice holds a little light; its seams glow

WMAT[WIC_CALC] = [PALS.icCalcW, BKV.calcW]; WMAT[WIC_ROCHA] = [PALS.icRochaW, BKV.rochaW]; WMAT[WIC_GELO] = [PALS.icGeloW, BKV.geloW];
WMAT[WIC_NEVE] = [PALS.icNeveW, BKV.neveW]; WMAT[WIC_NEGRO] = [PALS.icNegroW, BKV.negroW];
DMAT[DP_IC_ROCHA] = [PALS.dpIcRocha, BKV.dpRocha]; DMAT[DP_IC_GELO] = [PALS.dpIcGelo, BKV.dpGelo]; DMAT[DP_IC_SINCELOS] = [PALS.dpIcGelo, BKV.dpSinc]; DMAT[DP_IC_NEGRO] = [PALS.dpIcNegro, BKV.dpNegro];

/* ---- the ores again: iron and gold in frozen rock, crystal in black ice (same items) ---- */
const IC_ORES = [[IC_O_FERRO, IRON, 'icRocha', vRochaGel, '#8a3f1c', 0.4, 0.16], [IC_O_OURO, GOLD, 'icRocha', vRochaGel, '#c8a040', 0.2, 0.07], [IC_O_CRISTAL, CRYSTAL, 'icNegro', vGeloNegro, '#8a4ae8', 0.42, 0.14]];
for (const [t, o, p, fn, tint, a1, a2] of IC_ORES) {
  ORE_PAINT[t] = ORE_PAINT[o]; ORE_HALO[t] = { pal: [p, tint, a1, a2], shade: 0, drip: ORE_HALO[o].drip };
  MAT[t] = [PALS[p], bakeOre(t, fn)]; SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1;
  DIG[t] = DIG[o]; ORE_XP[t] = ORE_XP[o]; ORE_NAME[t] = ORE_NAME[o]; PCOL[t] = PCOL[o]; ORE_ITEM[t] = ORE_ITEM[o];
}
EMIT[IC_O_CRISTAL] = EMIT[CRYSTAL];

/* ---- block items ---- */
const IC_ITEMS = {
  neve: ['Neve', IC_NEVE, 'Fria, fofa e silenciosa. Cava num instante.'],
  gelo: ['Gelo', IC_GELO, 'Gelo branco com bolhas presas dentro. Escorrega.'],
  gelo_azul: ['Gelo Azul', IC_GELO_AZUL, 'Gelo tão velho que ficou azul. Guarda um pouco de luz.'],
  permafrost: ['Permafrost', IC_PERMA, 'Terra e cascalho que não descongelam há mil anos.'],
  rocha_gelada: ['Rocha Gelada', IC_ROCHA, 'Rocha azulada com veios de gelo nas juntas.'],
  gelo_negro: ['Gelo Negro', IC_GELO_NEGRO, 'Quase preto, cheio de rachaduras azuis. Duro como ferro.']
};
for (const id in IC_ITEMS) { const [name, block, desc] = IC_ITEMS[id]; ITEMS[id] = { name, rar: 0, stack: 99, block, desc }; BLOCK_DROP[block] = id; }
BLOCK_DROP[IC_NEVE_DURA] = 'neve'; BLOCK_DROP[IC_VEIO] = 'gelo_azul';
if (ITEMS.calcario) BLOCK_DROP[IC_CALC_GELO] = 'calcario';

/* ================= decorations: 12x12 sprites on ramps ================= */
const DRI = {
  gelo: ['#10283e', '#1c4466', '#30668e', '#5090b8', '#80bcdc', '#b8e0f4', '#effaff'],
  cristal: ['#06203a', '#0a3a62', '#12608e', '#1e8ec0', '#46bce6', '#9ae4fa', '#eafcff'],
  rocha: ['#10151c', '#1c2430', '#2c3846', '#3e4e60', '#526478', '#687c92', '#8296ac'],
  neve: ['#3a475a', '#566880', '#7a8ea8', '#a0b6cc', '#c6d8e8', '#e4eff8', '#ffffff'],
  osso: ['#26282a', '#3e4244', '#5e6466', '#82898c', '#a8b0b2', '#c8d2d6', '#e8f2f6']
};
for (const k in DRI) DRI[k] = DRI[k].map(h => ph(h));
const flipX = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[y * T + T - 1 - x]; return b; };
const flipY = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[(T - 1 - y) * T + x]; return b; };
const rimOut = (a, o, up) => { const b = a.slice(); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (!b[k] && ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (up !== false && y > 0 && b[k - T]) || (y < T - 1 && b[k + T]))) a[k] = o; } return a; };

/* an icicle: a slender clear cone (hanging, tip down) or an ice stalagmite (standing), with a bright core line */
function iceCone(hang, w0, len, s, off = 0) {
  return cvSprite((x, y) => {
    const t = hang ? y / len : (T - 1 - y) / len; if (t > 1) return 0;
    const half = Math.max(0.3, (1 - Math.pow(t, 0.7)) * w0 / 2), cx = 5.5 + off + Math.sin(t * 2.4 + s) * 0.3, dx = x + 0.5 - cx - 0.5;
    if (Math.abs(dx) > half) return 0;
    const u = (dx / half + 1) / 2;
    let v = 4.4 - u * 2.6 - t * 0.4 + cg(x, y, s) * 0.35;
    if (Math.abs(u - 0.32) < 0.12) v += 1.4;   // the light running down its face
    if (t > 0.86) v += 1.2;                     // the wet tip
    if ((y + (s | 0)) % 4 === 0 && u > 0.6) v -= 0.6;
    return dPix(DRI.gelo, v);
  }, DRI.gelo[0]);
}
const SINCELO = [iceCone(true, 7, 26, 1), iceCone(true, 5, 11.5, 2), iceCone(true, 3.4, 9, 3, 0.6)];   // [meio, ponta, ponta fina]
const ESTALAG = [iceCone(false, 9, 26, 4), iceCone(false, 7, 11.5, 5), iceCone(false, 4, 9, 6, -0.5)];  // [base, ponta, ponta fina]

/* a cluster of glowing ice crystals growing out of a lump of frozen rock (or out of the roof, upside down) */
function crystalSprite(s) {
  const a = new Uint32Array(T * T);
  for (let x = 1; x < 11; x++) for (let y = 9; y < 12; y++) if (Math.abs(x - 5.5) < 5 - (11 - y) * 0.8) a[y * T + x] = dPix(DRI.rocha, 3.4 - x * 0.18 - (y - 9) * 0.5 + cg(x, y, s) * 0.6);
  const pts = s === 1 ? [[3, 6, -0.35], [5.5, 10, 0.02], [8.5, 7, 0.35], [10, 3.5, 0.8]] : [[2, 4, -0.7], [4.5, 8, -0.2], [7, 10, 0.12], [9.5, 6, 0.5]];
  for (const [bx, len, ang] of pts) {
    const ux = Math.sin(ang), uy = -Math.cos(ang);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const px = x + 0.5 - bx, py = y + 0.5 - 10, al = px * ux + py * uy, pe = px * -uy + py * ux; if (al < 0 || al > len) continue;
      const w = 1.25 * Math.min(1, (len - al) / 2); if (Math.abs(pe) > w) continue;
      a[y * T + x] = dPix(DRI.cristal, (pe < -0.3 ? 4.6 : pe > 0.3 ? 2.6 : 5.8) + (al > len - 1.5 ? 0.8 : 0) - (al < 1 ? 1.4 : 0));
    }
  }
  return rimOut(a, DRI.cristal[0], true);
}
const CRISTAIS = [crystalSprite(1), crystalSprite(2)];
const CRISTAIS_TETO = [flipY(crystalSprite(1)), flipY(crystalSprite(2))];

/* a little mound of snow on the floor */
function moundSprite(s) {
  const a = new Uint32Array(T * T);
  const hump = (cx, rx, ry) => { for (let y = Math.floor(12 - ry); y < T; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { if (x < 0 || x >= T) continue; const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - 12) / ry; if (dx * dx + dy * dy > 1) continue; a[y * T + x] = dPix(DRI.neve, 4.8 - dx * 1.1 - (dy + 1) * 1.2 + cg(x, y, s) * 0.35 + (hash2(x, y, s) < 0.06 ? 1.2 : 0)); } };
  if (s === 1) { hump(4, 4.2, 4.6); hump(9, 3, 3); } else { hump(6, 5.6, 3.6); hump(1.5, 1.6, 1.8); }
  return rimOut(a, DRI.neve[1], true);
}
const MONTES = [moundSprite(1), moundSprite(2)];

/* bones lying in the frost: a long bone, a jaw, a rib, all furred with rime */
function bonesSprite(s) {
  const a = new Uint32Array(T * T), put = (x, y, v) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = dPix(DRI.osso, v); };
  if (s === 1) {
    for (let x = 1; x < 10; x++) { put(x, 10, 4.2 - x * 0.06); put(x, 11, 2.8); }
    put(0, 9, 4.6); put(0, 10, 3.8); put(10, 9, 4.6); put(10, 10, 3.6); put(1, 9, 3.8); put(9, 9, 3.8);   // the knuckles at both ends
    for (let k = 0; k < 4; k++) put(3 + k * 2, 9, 6);   // rime on top
  } else {
    for (let k = 0; k < 7; k++) { const x = 2 + k, y = 7 + Math.round(Math.pow((k - 3) / 3, 2) * 3); put(x, y, 4.6); put(x, y + 1, 3); }   // a rib
    for (let x = 7; x < 11; x++) { put(x, 10, 4); put(x, 11, 2.6); } put(10, 9, 4.4); put(7, 9, 5.6); put(8, 9, 1.2);   // a jaw with a tooth
    put(3, 6, 6); put(5, 9, 6);
  }
  return rimOut(a, DRI.osso[0], true);
}
const OSSOS = [bonesSprite(1), bonesSprite(2)];

/* an ice column: a clear shaft with a bright core and frost rings, a flared foot and a flared head */
function columnPiece(k) {   // 0 foot, 1 shaft, 2 head
  return cvSprite((x, y) => {
    let half = 3.4 + Math.sin(y * 0.9 + k) * 0.25;
    if (k === 0) half += Math.max(0, (y - 7) * 0.5); if (k === 2) half += Math.max(0, (4 - y) * 0.5);
    const dx = x + 0.5 - 6; if (Math.abs(dx) > half) return 0;
    const u = (dx / half + 1) / 2;
    let v = 4.2 - u * 2.6 + cg(x, y, 7311 + k) * 0.3;
    if (Math.abs(u - 0.34) < 0.1) v += 1.5;
    if ((y + k * 5) % 6 === 0) v += 0.6;   // frost rings
    if ((k === 0 && y > 9) || (k === 2 && y < 2)) v -= 0.5;
    return dPix(DRI.gelo, v);
  }, DRI.gelo[0]);
}
const COLUNA = [columnPiece(0), columnPiece(1), columnPiece(2)];
DECO[IC_COLUNA] = COLUNA; DIG[IC_COLUNA] = 0.5; PCOL[IC_COLUNA] = '#a0cbe2'; CV_HANGS[IC_COLUNA] = 1; CV_STANDS[IC_COLUNA] = 1; BLOCK_DROP[IC_COLUNA] = 'gelo';
DECO_PICK[IC_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== IC_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== IC_COLUNA ? arr[2] : arr[1];
DECO[IC_SINCELO] = SINCELO; DECO[IC_ESTALAG] = ESTALAG; DECO[IC_CRISTAL] = CRISTAIS; DECO[IC_CRISTAL_TETO] = CRISTAIS_TETO; DECO[IC_NEVE_MONTE] = MONTES; DECO[IC_OSSOS] = OSSOS;
DIG[IC_SINCELO] = 0.2; DIG[IC_ESTALAG] = 0.2; DIG[IC_CRISTAL] = 0.2; DIG[IC_CRISTAL_TETO] = 0.2; DIG[IC_NEVE_MONTE] = 0.04; DIG[IC_OSSOS] = 0.05;
PCOL[IC_SINCELO] = '#b8e0f4'; PCOL[IC_ESTALAG] = '#b8e0f4'; PCOL[IC_CRISTAL] = '#46bce6'; PCOL[IC_CRISTAL_TETO] = '#46bce6'; PCOL[IC_NEVE_MONTE] = '#e4eff8'; PCOL[IC_OSSOS] = '#c8d2d6';
EMIT[IC_CRISTAL] = 0.5; EMIT[IC_CRISTAL_TETO] = 0.5;
for (const t of [IC_SINCELO, IC_CRISTAL_TETO]) CV_HANGS[t] = 1;
for (const t of [IC_ESTALAG, IC_CRISTAL, IC_NEVE_MONTE, IC_OSSOS]) CV_STANDS[t] = 1;
BLOCK_DROP[IC_SINCELO] = 'gelo'; BLOCK_DROP[IC_ESTALAG] = 'gelo'; BLOCK_DROP[IC_NEVE_MONTE] = 'neve';

// which variation goes where: icicle pieces from their neighbours
DECO_PICK[IC_SINCELO] = (gx, gy, arr) => tileAt(gx, gy + 1) === IC_SINCELO ? arr[0] : tileAt(gx, gy - 1) === IC_SINCELO ? arr[1] : arr[hash2(gx, gy, 7301) < 0.5 ? 1 : 2];
DECO_PICK[IC_ESTALAG] = (gx, gy, arr) => tileAt(gx, gy - 1) === IC_ESTALAG ? arr[0] : tileAt(gx, gy + 1) === IC_ESTALAG ? arr[1] : arr[hash2(gx, gy, 7302) < 0.5 ? 1 : 2];

Object.assign(ICART, { cg, cn, cells, DRI, dPix, vGelo, vGeloAzul, vGeloNegro, vNeve, vRochaGel, FROST });
}
