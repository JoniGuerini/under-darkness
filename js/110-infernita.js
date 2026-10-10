'use strict';

/* ================= infernita: the fifth metal, from the abyss (2026-10-09) =================
   One metal per layer (102): copper in the caves, iron in the cathedral, gold in the ice, cobalt in the mine, and
   infernite in the abyss (103-109), an ember-red ore that stays warm in the hand. Here: the ore and the bar, the
   fifth metal at the forge (METALS, so the anvil shows "Peças de infernita") and its nine pieces: the eight of
   05-itens (sword, dagger, axe, mace, spear, helm, breastplate, boots) and the two-handed sword of 61-montante.
   Item level from the abyss's place in the layer list (129-camadas: 2n - 1, 11 while it is the 6th). The furnace recipe (6 ores a bar), the smith buying it and the prices are in
   108-abismo-mundo, which loads after the forge and the village.
   Loads after 61-montante and 48-itemizacao. */

const INF_PAL = ['#5e0c06', '#e2481c', '#ffb87a'];   // dark, body, glint: like ORE_PAL
Object.assign(ITEMS, {
  min_infernita: { name: 'Minério de Infernita', rar: 3, stack: 99, icon: 'ore', ore: INF_PAL, desc: 'Ainda quente. Vem do fundo do Abismo.' },
  barra_infernita: { name: 'Barra de Infernita', rar: 3, stack: 99, icon: 'bar', ore: INF_PAL, desc: 'Fundida de 6 minérios de infernita. Vai para a bigorna do Grimaldo.' }
});
// a lump of black slag with ember veins, and a bar that glows along its cracks
ORE_ICONS.min_infernita = [[
  "...dkkd...",
  "..dkRrkd..",
  ".dkrYRkkd.",
  "dkkrRkrRkd",
  "dkRkkkrYkd",
  ".dkkrRkkd.",
  "..ddkkdd..",
  "....dd...."], { d: '#140606', k: '#2e100c', r: '#a8281a', R: '#ff6a2a', Y: '#ffd08a' }];
BAR_ICONS.barra_infernita = [[
  "...tTTTTTTTt.",
  "..tTkkRkkkTe.",
  ".tkkkRYRkkkeE",
  "FFFFFFFFFFFeE",
  "mmmRmmmmRmmEE",
  "mmmmRRmmmmmE.",
  "dddddddddd..."], { T: '#5a2a24', t: '#3a1612', k: '#24100c', R: '#ff5a1e', Y: '#ffd08a', F: '#6a2a20', m: '#3a1410', e: '#2a0e0a', E: '#140606', d: '#0e0404' }];

METALS.push({ id: 'infernita', name: 'Infernita', bar: 'barra_infernita', il: layerForgeIl('abismo'),
  wp: { w: '#ffe0c8', W: '#ff6a2a', l: '#a8200c', g: '#3a1010', G: '#200808', h: '#2a0e0a', p: '#d8401a' },
  m: '#b8321a', M: '#ffb07a', body: { r: '#a82a18', R: '#701408', D: '#400a06', b: '#260808', B: '#ff9a5a' }, s: '#b8321a', S: '#6a1206' });
FORGE_ILVL.push(layerForgeIl('abismo'));   // the item level follows the abyss's place in the layer list (129): 7 as the 5th layer, 11 as the 6th
{
  const t = METALS.length - 1, M = METALS[t];
  // [piece, name, gender, bars, stats]: one step above cobalt
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 42, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 28, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 64, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 50, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 45, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 8, hp: 20, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 12, hp: 30 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.06 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}
