'use strict';

/* ================= mithril: o metal da Fortaleza dos Anões (2026-10-10) =================
   Um metal por camada (102): o mithril, reservado desde o começo para a fortaleza, é o da oitava (180 a 189). Prata-
   azulado e leve, preso no granito anão com um brilho fraco; funde na fornalha com 7 minérios por barra (receita no
   185, que carrega depois da forja). Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição
   da camada no registro 129: 15 como a oitava) e as 9 peças. As peças de mithril são as mais leves da bigorna: botas
   um pouco mais rápidas e armas um pouco mais rápidas que as das outras barras do mesmo nível (`leve`, 49 lê).
   Também os materiais da camada (runa gravada, mola rúnica, brasa domada, barba espectral), o Cinzel de Runas e as três
   bases que só caem lá (Machado de Guerra do Clã, Elmo do Clã com Viseira, Escudo de Bronze Rúnico).
   Carrega logo depois do 138-prata, antes do 110-infernita: a bigorna mostra o mithril antes da infernita. */

const MITHRIL_PAL = ['#1e2a3a', '#9cc0d8', '#d8eef8'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_mithril: { name: 'Minério de Mithril', rar: 2, stack: 99, icon: 'ore', ore: MITHRIL_PAL, desc: 'Fios prata-azulados presos no granito anão. Leve na mão, brilha um pouco no escuro.' },
  barra_mithril: { name: 'Barra de Mithril', rar: 2, stack: 99, icon: 'bar', ore: MITHRIL_PAL, desc: 'Fundida de 7 minérios de mithril. Pesa metade do que parece. Vai para a bigorna do Grimaldo.' }
});
// a lump of grey-blue granite with mithril threads showing through, and a bar with a cold bright edge
ORE_ICONS.min_mithril = [[
  "...gggg...",
  "..gGmMgg..",
  ".gmMWmgGg.",
  "ggMmmmMggg",
  "gGgmMmgGmg",
  ".gggmggMg.",
  "..gggggg..",
  "....gg...."], { g: '#2e343c', G: '#5a646e', m: '#46627e', M: '#9cc0d8', W: '#d8eef8' }];
BAR_ICONS.barra_mithril = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgggGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#d8eef8', t: '#9cc0d8', g: '#6a8eac', G: '#bcdcee', W: '#f2fbff', F: '#46627e', m: '#2e4258', e: '#243446', E: '#1e2a3a', d: '#121a24' }];

METALS.push({ id: 'mithril', name: 'Mithril', bar: 'barra_mithril', il: layerForgeIl('anoes'),
  wp: { w: '#f2fbff', W: '#bcdcee', l: '#46627e', g: '#3a2e1e', G: '#241c12', h: '#2a2016', p: '#9cc0d8' },
  m: '#6a8eac', M: '#d8eef8', body: { r: '#8ab0cc', R: '#5a7e9c', D: '#3a5672', b: '#1e2a3a', B: '#d8eef8' }, s: '#6a8eac', S: '#2e4258' });
FORGE_ILVL.push(layerForgeIl('anoes'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre a prata e a infernita, e leve (um pouco mais rápido)
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 41, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 27, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 62, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 48, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 44, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 7, hp: 20, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 11, hp: 28 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 4, spd: 0.07 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, leve: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}. Mais leve que as outras.` }, st);
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  anRuna: [["..gggggg.", ".gGGGGGGg", ".gGbBbGGg", ".gGGbGGGg", ".gGbBbGGg", ".gGGbGGGg", ".gGGGGGGg", "..gggggg."], { g: '#2e343c', G: '#5a646e', b: '#1e7aa8', B: '#7ad0f0' }],
  anMola: [["...kKk...", "..k...k..", "...kKk...", "..k...k..", "...kKk...", "..k...k..", "...kKk...", "...bBb..."], { k: '#70461e', K: '#c49448', b: '#1e7aa8', B: '#7ad0f0' }],
  anBrasa: [["...yy....", "..yYYy...", ".oYWYYo..", ".oYYYYo..", "roOYYOor.", "rrOOOOrr.", ".rrrrrr..", "..dddd..."], { y: '#ffa62a', Y: '#ffe08a', W: '#fff4c8', o: '#e8700e', O: '#b8400a', r: '#7a1e06', d: '#3a0c04' }],
  anBarba: [["..rrrrr..", ".rRRRRRr.", ".rR...Rr.", "..rR.Rr..", "..rRRRr..", "...rRr...", "...rRr...", "....r...."], { r: '#3aa8d8', R: '#d0f4ff' }],
  anCinzel: [["......wW.", ".....wWb.", "....wWb..", "...wWb...", "..hHb....", ".hHh.....", "hHh......", "hh......."], { w: '#9cc0d8', W: '#d8eef8', b: '#1e7aa8', h: '#4a2e14', H: '#9a6a2c' }]
});
Object.assign(ITEMS, {
  runa_gravada: { name: 'Runa Gravada', rar: 1, stack: 99, icon: 'anRuna', desc: 'Uma placa de granito com uma runa dos anões ainda acesa. O Grimaldo compra; com o cinzel, ela vai para as peças.' },
  mola_runica: { name: 'Mola Rúnica', rar: 1, stack: 99, icon: 'anMola', desc: 'A mola de bronze que dá corda nos autômatos, com uma runa no eixo. O Grimaldo compra.' },
  brasa_domada: { name: 'Brasa Domada', rar: 1, stack: 99, icon: 'anBrasa', desc: 'Um carvão de forja que nunca apaga. Na fornalha vale por 2 carvões.' },
  barba_espectral: { name: 'Barba Espectral', rar: 2, stack: 99, icon: 'anBarba', desc: 'Uma mecha fria e azulada que fica depois que um fantasma anão some. A Aurélia quer todas.' },
  cinzel_runico: { name: 'Cinzel de Runas', rar: 3, stack: 1, icon: 'anCinzel', unico: true, nosell: true, desc: 'O cinzel do mestre runeiro de Brasafunda. Leve ao Grimaldo: a marca no cabo é a mesma da bigorna dele.' }
});

/* ---------- as bases que só caem na Fortaleza dos Anões ---------- */
const AN_BASE_LVL = layerLo('anoes');
Object.assign(ITEMS, {
  machado_cla: { name: 'Machado de Guerra do Clã', slot: 'weapon', kind: 'axe', rar: 1, dois: 1, pal: { w: '#e8c27a', W: '#c49448', l: '#4a2e14', g: '#2a1a0c', G: '#1a1006', h: '#2a1d12', p: '#3aa8d8' }, desc: 'Lâmina larga de bronze com a marca do clã. Empurra mais longe e acerta dois de uma vez.' },
  elmo_cla: { name: 'Elmo do Clã com Viseira', slot: 'head', rar: 1, def: 9, viseira: 0.3, art: ["............", "...mmmmm....", "..mMMMMMm...", ".mMMMMMMMm..", ".mmmmmmmmm..", ".mM.m.m.Mm..", ".mm.....mm.."], oy: -1, pal: { m: '#70461e', M: '#c49448' }, desc: 'O elmo fechado da guarda de Brasafunda. A viseira segura melhor o que vem de cima.' },
  escudo_runico: { name: 'Escudo de Bronze Rúnico', slot: 'shield', rar: 1, def: 5, parry: 0.34, pesado: 1, pal: { o: '#2a1a0c', W: '#9a6a2c', w: '#c49448', m: '#1e7aa8', M: '#7ad0f0' }, desc: 'Bronze grosso com uma runa de guarda no centro. Apara muito bem, mas cansa o braço.' }
});
Object.assign(BASE_INFO, { machado_cla: [AN_BASE_LVL, 0.94], elmo_cla: [AN_BASE_LVL], escudo_runico: [AN_BASE_LVL] });
Object.assign(ITEM_G, { machado_cla: 0, elmo_cla: 0, escudo_runico: 0 });
for (const id of ['machado_cla', 'elmo_cla', 'escudo_runico']) ITEMS[id].g = ITEM_G[id];
// o que o machado (dois), o elmo (viseira) e o escudo (pesado) fazem fica no 185, que carrega depois do combate
