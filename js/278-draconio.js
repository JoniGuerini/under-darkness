'use strict';

/* ================= dracônio: o metal do Covil do Dragão (2026-10-11) =================
   Um metal por camada (102): o dracônio é o do Covil (270-279). Escamas de metal escuro que nascem onde o fogo do
   dragão bateu, na obsidiana rajada e no osso de dragão, com a brasa dourada na borda; temperado no fogo do dragão.
   Pede 8 minérios por barra (a regra do 00-geral). A receita da fornalha, os preços e as lojas ficam no 275.
   Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129) e as 9
   peças (na arte, escamas gravadas e o fio dourado); os materiais da camada (escama de draco, glândula de fogo, moeda
   antiga, obsidiana rajada) e as três bases que só caem lá (Dente de Draco, Couraça de Escamas, Elmo de Chifre de
   Serpe).
   Carrega logo depois do 257-lunarita, antes do 110-infernita: a bigorna mostra o dracônio entre a lunarita e a
   infernita. Carrega antes do 270, então não usa os ids de bloco da camada (o 271 liga o bloco ao minério). */

const DRACONIO_PAL = ['#3a1a0e', '#c47a3a', '#ffd860'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_draconio: { name: 'Minério de Dracônio', rar: 3, stack: 99, icon: 'ore', ore: DRACONIO_PAL, desc: 'Escamas de metal escuro presas na obsidiana, com a borda ainda em brasa. Nasce onde o fogo do dragão bateu.' },
  barra_draconio: { name: 'Barra de Dracônio', rar: 3, stack: 99, icon: 'bar', ore: DRACONIO_PAL, desc: 'Fundida de 8 minérios de dracônio. Escura, com um fio dourado correndo por dentro, e sempre morna. Vai para a bigorna do Grimaldo.' }
});
// escamas de metal sobrepostas saindo da pedra, a borda de baixo acesa; a barra escura com o fio dourado
ORE_ICONS.min_draconio = [[
  "...dDd....",
  "..dSSSd.d.",
  "..dSsSdDSd",
  ".rdGSGdSsd",
  "rRrdGdrdGd",
  ".rrrdrrRd.",
  "..rrrrrr..",
  "....rr...."], { r: '#2e140c', R: '#6a301e', d: '#3a1a0e', D: '#6a3418', S: '#a86020', s: '#c47a3a', G: '#ffd860' }];
BAR_ICONS.barra_draconio = [[
  "...tTTTTTTTt.",
  "..tTgGgggGTe.",
  ".tggGgggGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#e8a85a', t: '#c47a3a', g: '#6a3418', G: '#ffd860', F: '#ffa020', m: '#4a2418', e: '#2a1410', E: '#1a0a06', d: '#0e0604' }];

METALS.push({ id: 'draconio', name: 'Dracônio', bar: 'barra_draconio', il: layerForgeIl('dragao'),
  wp: { w: '#ffd860', W: '#c47a3a', l: '#6a3418', g: '#2a1410', G: '#140804', h: '#1a0c08', p: '#e8a85a' },
  m: '#c47a3a', M: '#ffd860', body: { r: '#c47a3a', R: '#9a5428', D: '#4a2418', b: '#1a0a06', B: '#ffd860' }, s: '#9a5428', S: '#4a2418' });
FORGE_ILVL.push(layerForgeIl('dragao'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre a lunarita e a infernita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 45, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 30, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 68, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 53, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 48, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 9, hp: 21, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 13, hp: 31 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.06 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}. Escamas gravadas e um fio dourado.` }, st);
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  dgEscama: [["..........", "...eEEe...", "..eEWEEe..", ".eEEEEEEe.", ".eEEsEEEe.", "..eEEEEe..", "...eEEe...", "....ee...."], { e: '#4a2418', E: '#c47a3a', W: '#e8a85a', s: '#9a5428' }],
  dgGlandula: [["....o.....", "...oOo....", "..oOYOo...", ".oOYWYOo..", ".oOOYOOo..", "..oOOOo...", "...ooo....", ".........."], { o: '#6a1a04', O: '#e06a10', Y: '#ffa020', W: '#fff4c0' }],
  dgMoeda: [["...gGGg...", "..gGWGGg..", ".gGGkkGGg.", ".gGkGGkGg.", ".gGGkkGGg.", "..gGGGGg..", "...gggg...", ".........."], { g: '#7a5410', G: '#d8a830', W: '#fff0a0', k: '#a87808' }],
  dgObsidiana: [["....W.....", "...wWo....", "..wOOoo...", ".wOOkOoo..", ".oOkkOOo..", "..ooOOo...", "...ooo....", ".........."], { w: '#c87a52', W: '#ffd0a8', O: '#6a301e', o: '#2e140c', k: '#1a0c08' }]
});
Object.assign(ITEMS, {
  escama_draco: Object.assign(ITEMS.escama_draco || {}, { name: 'Escama de Draco', rar: 1, stack: 99, icon: 'dgEscama', desc: 'Uma escama cor de cobre, dura como chapa e morna na mão. O Grimaldo faz rebites com ela.' }),
  glandula_fogo: { name: 'Glândula de Fogo', rar: 1, stack: 99, icon: 'dgGlandula', desc: 'O saquinho de onde sai o fogo de um draco. Ainda quente. A Marta paga bem: serve para a alquimia.' },
  moeda_antiga: { name: 'Moeda Antiga', rar: 2, stack: 99, icon: 'dgMoeda', desc: 'Uma moeda de um reino que ninguém lembra, com um rei de perfil. O Odo coleciona e paga caro.' },
  obsidiana_rajada: Object.assign(ITEMS.obsidiana_rajada || {}, { name: 'Obsidiana Rajada', rar: 1, stack: 99, icon: 'dgObsidiana', desc: 'Vidro de vulcão cor de mogno, com rajadas pretas. Corta como faca. O Grimaldo compra.' })
});

/* ---------- as bases que só caem no Covil ---------- */
const DG_BASE_LVL = layerLo('dragao');
Object.assign(ITEMS, {
  dente_draco: { name: 'Dente de Draco', slot: 'weapon', kind: 'dagger', rar: 1, critB: 0.08, pal: { w: '#fff4dc', W: '#ddd0ae', l: '#9a8a68', g: '#c47a3a', G: '#6e3820', h: '#2a1410', p: '#ffd860' }, desc: 'O dente comprido de um draco couraçado, com o cabo enrolado em couro. Curto, e acha a fresta da armadura.' },
  couraca_escamas: { name: 'Couraça de Escamas', slot: 'body', rar: 1, def: 11, hp: 14, pal: { r: '#c47a3a', R: '#9a5428', D: '#4a2418', b: '#1a0a06', B: '#e8a85a' }, desc: 'Escamas de draco costuradas em couro grosso. Aguenta o calor: fogo machuca um quarto a menos.' },
  elmo_chifre_serpe: { name: 'Elmo de Chifre de Serpe', slot: 'head', rar: 1, def: 7, hp: 9, atkSpd: 0.06, art: ["W..........W", "Ww.mmmmm..wW", ".wmMMMMMmw..", ".mMMMbMMMm..", ".mMMMMMMMm..", ".m.......m..", ".m.........."], oy: -1, pal: { m: '#6e3820', M: '#c47a3a', W: '#ddd0ae', w: '#9a8a68', b: '#ffd860' }, desc: 'Um elmo de escama com os chifres curvos de uma serpe. Leve: a mão fica mais rápida.' }
});
Object.assign(BASE_INFO, { dente_draco: [DG_BASE_LVL, 0.4], couraca_escamas: [DG_BASE_LVL], elmo_chifre_serpe: [DG_BASE_LVL] });
Object.assign(ITEM_G, { dente_draco: 0, couraca_escamas: 1, elmo_chifre_serpe: 0 });
for (const id of ['dente_draco', 'couraca_escamas', 'elmo_chifre_serpe']) ITEMS[id].g = ITEM_G[id];
// a Couraça de Escamas corta 25% do dano de fogo: o 275 embrulha o hurtPlayer (ele ainda não existe aqui)
