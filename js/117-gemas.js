'use strict';

/* ================= pedras preciosas: uma por camada (2026-10-09) =================
   As peças da forja saem brancas; quem põe modificadores nelas é o encantador (118-encantador), com uma destas pedras.
   Não são minérios: não vão para a fornalha. Ficam soltas na rocha de cada camada, mais raras que o metal dela.
     As Cavernas        Topázio        na rocha das cavernas
     A Catedral         Esmeralda      no calcário
     Cavernas de Gelo   Safira         na rocha gelada
     A Mina             Cristal Bruto  (já existia: 79, 80, 84)
     O Abismo           Rubi           no basalto
   Blocos 153 a 156. As pedras entram depois de o mundo estar pronto (embrulha buildCathedral, como as ervas do 94),
   só pela semente, então mundos salvos também ganham as suas.
   GEMS diz a ordem e as chances de cada raridade no encantador. Carrega depois do 111 (a wiki também). */

const GEM_TOPAZIO = 153, GEM_ESMERALDA = 154, GEM_SAFIRA = 155, GEM_RUBI = 156;

// a pedra, a camada, as chances [incomum, raro, épico, lendário] no encantador
const GEMS = [
  { id: 'gema_topazio', layer: 'Cavernas', odds: [85, 15, 0, 0] },
  { id: 'gema_esmeralda', layer: 'Catedral', odds: [55, 38, 7, 0] },
  { id: 'gema_safira', layer: 'Cavernas de Gelo', odds: [30, 48, 20, 2] },
  { id: 'min_cristal', layer: 'Mina Abandonada', odds: [15, 45, 34, 6] },
  { id: 'gema_rubi', layer: 'O Abismo', odds: [5, 35, 47, 13] }
];
const GEM_OF = Object.fromEntries(GEMS.map(g => [g.id, g]));

/* ---- os itens ---- */
Object.assign(ITEMS, {
  gema_topazio: { name: 'Topázio', rar: 1, stack: 99, icon: 'ore', ore: ['#5a3006', '#eaa62a', '#fff4c8'], gem: 1, desc: 'Amarelo como mel contra a luz. Vem da rocha das cavernas.' },
  gema_esmeralda: { name: 'Esmeralda', rar: 1, stack: 99, icon: 'ore', ore: ['#073418', '#2ab86a', '#e0fff0'], gem: 1, desc: 'Cresce em prismas dentro do calcário da catedral.' },
  gema_safira: { name: 'Safira', rar: 2, stack: 99, icon: 'ore', ore: ['#0a1a5a', '#3a74ec', '#e4eeff'], gem: 1, desc: 'Fria ao toque mesmo longe do gelo onde nasceu.' },
  gema_rubi: { name: 'Rubi', rar: 3, stack: 99, icon: 'ore', ore: ['#540612', '#e83048', '#fff0f2'], gem: 1, desc: 'Arrancado do basalto do Abismo. Parece pulsar devagar.' }
});
ITEMS.min_cristal.gem = 1;
ITEMS.min_cristal.desc = 'Uma pedra preciosa, não um metal: não vai para a fornalha. Vem da Mina Abandonada.';

// prismas para topázio, esmeralda e safira; o rubi é um seixo lapidado pela própria rocha
ORE_ICONS.gema_topazio = [[
  "....W.....",
  "...LWp....",
  "...LPp.W..",
  ".W.LPpLWp.",
  "LWpLPpLPp.",
  "LPpLPpLPp.",
  ".LPpbbPpb.",
  "bbBbbbbBbb"], { W: '#fff4c8', L: '#ffd46a', P: '#eaa62a', p: '#a8640a', b: '#3a2f26', B: '#5a4a3c' }];
ORE_ICONS.gema_esmeralda = [[
  "...WL.....",
  "..LWPp....",
  "..LPPp.WL.",
  "..LPPpLWPp",
  ".WLPPpLPPp",
  "LWPpPpLPPp",
  "LPPpbbbPpb",
  "bbBbbbbbBb"], { W: '#e0fff0', L: '#7ae8a6', P: '#2ab86a', p: '#0e5a2a', b: '#3e3a34', B: '#605a50' }];
ORE_ICONS.gema_safira = [[
  ".....W....",
  "....LWp...",
  ".W..LPp...",
  "LWp.LPpW..",
  "LPpLLPpWp.",
  "LPpLPPpPp.",
  ".LPpPPpPpb",
  "bbBbbbbBbb"], { W: '#e4eeff', L: '#8ab0ff', P: '#3a74ec', p: '#14308e', b: '#2a3240', B: '#46546a' }];
ORE_ICONS.gema_rubi = [[
  "...LWWL...",
  "..LWLLPp..",
  ".LWLPPPpd.",
  "LLPPPPppdd",
  "dPPPpppddd",
  ".dpPppddd.",
  "..ddpdd...",
  "....dd...."], { W: '#fff0f2', L: '#ff8a9a', P: '#e83048', p: '#86101e', d: '#3a0408' }];

/* ---- os blocos: a pedra na rocha de cada camada ---- */
oreRamp(GEM_TOPAZIO, ['#2e1804', '#5a3006', '#8a4e0a', '#c07a12', '#eaa62a', '#ffd46a', '#fff4c8']);
oreRamp(GEM_ESMERALDA, ['#03180c', '#073418', '#0e5a2a', '#18864a', '#2ab86a', '#7ae8a6', '#e0fff0']);
oreRamp(GEM_SAFIRA, ['#040a2a', '#0a1a5a', '#14308e', '#1e4cc4', '#3a74ec', '#8ab0ff', '#e4eeff']);
oreRamp(GEM_RUBI, ['#2a0208', '#540612', '#86101e', '#b8182c', '#e83048', '#ff8a9a', '#fff0f2']);
// a cluster of prisms out of a crack (like the crystal), small ones behind; n = how many, w = how thick
function gemPrisms(t, n0, w0) {
  return function (L, s) {
    const n = n0 + (hash2(s, 1, 60) < 0.5), R = ORE_RAMP[t], bx = 3.6 + hash2(s, 2, 61) * 4.8, by = 8 + hash2(s, 3, 61) * 1.8, tilt = (hash2(s, 4, 61) - 0.5) * 0.8;
    for (let i = n - 1; i >= 0; i--) {
      const side = i === 0 ? 0 : i % 2 ? -1 : 1, ang = tilt + side * (0.5 + hash2(s, i, 63) * 0.45);
      const len = i === 0 ? 6 + hash2(s, i, 64) * 2 : 3.2 + hash2(s, i, 64) * 1.8, hw = (i === 0 ? w0 : w0 * 0.65) + hash2(s, i, 65) * 0.35;
      orePrism(L, bx + side * (1.4 + i * 0.4), by, ang, len, hw, R, s * 19 + i + t);
    }
  };
}
ORE_PAINT[GEM_TOPAZIO] = gemPrisms(GEM_TOPAZIO, 2, 1.5);
ORE_PAINT[GEM_ESMERALDA] = gemPrisms(GEM_ESMERALDA, 2, 1.8);
ORE_PAINT[GEM_SAFIRA] = gemPrisms(GEM_SAFIRA, 3, 1.2);
ORE_PAINT[GEM_RUBI] = function (L, s) {
  const R = ORE_RAMP[GEM_RUBI], pts = oreNodes(L, s, R, 80, [2.4, 0.6], [1.1, 0.4], 6);
  const sp = pts[0]; for (const [dx, dy] of [[-1, -1], [0, -1]]) { const x = sp[0] + dx, y = sp[1] + dy; if (x >= 1 && y >= 1 && x <= 10 && y <= 10) L.put(x, y, R[6], 6); }
};
// the host rock is replayed from its baked texture (the painters of 42, 53 and 70 live inside blocks)
const fromBaked = t => { const B = MAT[t][1]; return (x, y) => { const k = y * TP + x; if (B.v[k] === -9) { MATX = B.x[k]; return -9; } return B.v[k]; }; };
// [bloco, item, paleta e textura da rocha, mancha em volta, dureza, cor no mapa, luz, nome]
const GEM_BLOCKS = [
  [GEM_TOPAZIO, 'gema_topazio', 'cvRocha', fromBaked(CV_ROCHA), '#c07a12', 0.75, '#eaa62a', 0.32, 'Topázio'],
  [GEM_ESMERALDA, 'gema_esmeralda', 'calcario', fromBaked(CT_CALCARIO), '#18864a', 0.9, '#2ab86a', 0.36, 'Esmeralda'],
  [GEM_SAFIRA, 'gema_safira', 'icRocha', fromBaked(IC_ROCHA), '#1e4cc4', 1.05, '#3a74ec', 0.4, 'Safira'],
  [GEM_RUBI, 'gema_rubi', 'abBasalto', fromBaked(AB_BASALTO), '#b8182c', 1.25, '#e83048', 0.44, 'Rubi']
];
for (const [t, item, p, fn, tint, dig, col, emit, name] of GEM_BLOCKS) {
  ORE_HALO[t] = { pal: [p, tint, 0.38, 0.12], shade: 0.35 };
  MAT[t] = [PALS[p], bakeOre(t, fn)]; SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1;
  DIG[t] = dig; ORE_XP[t] = ORE_XP[CRYSTAL]; ORE_NAME[t] = name; PCOL[t] = col; ORE_ITEM[t] = item; EMIT[t] = emit;
}
CV_SOILS[GEM_TOPAZIO] = 1; IC_SOILS[GEM_SAFIRA] = 1; AB_SOILS[GEM_RUBI] = 1;

Object.assign(ORE_WHERE, { gema_topazio: 'Pedra preciosa, rara, das Cavernas', gema_esmeralda: 'Pedra preciosa, rara, da Catedral', gema_safira: 'Pedra preciosa, rara, das Cavernas de Gelo', gema_rubi: 'Pedra preciosa, rara, do Abismo' });
Object.assign(MAT_VAL, { gema_topazio: 12, gema_esmeralda: 20, gema_safira: 30, gema_rubi: 70 });

/* ---- espalhar as pedras: aglomerados de 1 ou 2 blocos dentro da rocha de cada camada ---- */
const GEM_HOST = [
  [GEM_TOPAZIO, t => t === CV_ROCHA || t === CV_XISTO],
  [GEM_ESMERALDA, t => t === CT_CALCARIO || t === CT_CALC_TERRA, z => z >= 5 && z <= 8],   // the caves' lowest band has limestone too
  [GEM_SAFIRA, t => t === IC_ROCHA || t === IC_PERMA || t === IC_CALC_GELO],
  [GEM_RUBI, t => t === AB_BASALTO || t === AB_OBSIDIANA || t === AB_CAOS]
];
function placeGems() {
  const R = mulberry32(seed ^ 0x6e3a5), W1 = x => (x + WW) % WW, want = 36 * WSC, got = GEM_HOST.map(() => 0);
  for (let k = 0; k < 900000 && got.some(n => n < want); k++) {
    const x = (R() * WW) | 0, y = surf[x] + 10 + ((R() * (WH - surf[x] - 16)) | 0), i = y * WW + x, t = tiles[i];
    const h = GEM_HOST.findIndex(([, ok]) => ok(t)); if (h < 0 || got[h] >= want) continue;
    const [g, ok, zone] = GEM_HOST[h]; if (zone && !zone(zoneAt(x, y))) continue;
    tiles[i] = g; got[h]++;
    if (R() < 0.45) { const d = (R() * 4) | 0, nx = W1(x + (d === 0 ? 1 : d === 1 ? -1 : 0)), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0), j = ny * WW + nx; if (ok(tiles[j])) tiles[j] = g; }
  }
}
{ const _bc = buildCathedral; buildCathedral = function () { _bc(); try { placeGems(); } catch (err) { console.error(err); } }; }
