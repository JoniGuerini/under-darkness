'use strict';

/* ================= oricalco: o metal do Mar Sem Sol (2026-10-11) =================
   Um metal por camada (102): o oricalco é o da décima segunda, o Mar Sem Sol (260-269). Veios verde-dourados com
   reflexo de água, na rocha do mar e no sulfeto das Chaminés; pede 8 minérios por barra (a regra do 00-geral: 8 do
   dracônio em diante). A receita da fornalha, os preços e as lojas ficam no 265, que carrega depois da forja e do
   vilarejo; o prato do Odo e o peso na água ficam no 269, que carrega depois da cozinha e do 172.
   Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129) e as 9
   peças. O metal de Atlântida não pesa na água: elmo, peitoral e botas de oricalco têm `oricalco: true`, não contam
   para o peso de nado e cada peça dá +2 s de fôlego (o 269 faz as duas coisas). Também os materiais da camada (escama
   abissal, tinta de polvo, isca viva, peixe-cego; a pérola negra já existe, da Cidade Afundada) e as três bases que
   só caem lá (Tridente Escamado, Cutelo de Abordagem, Escudo de Carapaça).
   Carrega logo depois do 257-lunarita, antes do 110-infernita: a bigorna mostra o oricalco entre a lunarita e a
   infernita. Carrega antes do 260, então não usa os ids de bloco da camada (o 261 liga o bloco ao minério). */

const ORICALCO_PAL = ['#2e3e18', '#a8a83c', '#fffbd0'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_oricalco: { name: 'Minério de Oricalco', rar: 3, stack: 99, icon: 'ore', ore: ORICALCO_PAL, desc: 'Veios verde-dourados presos na rocha do mar. Molhados ou secos, sempre parecem estar debaixo da água.' },
  barra_oricalco: { name: 'Barra de Oricalco', rar: 3, stack: 99, icon: 'bar', ore: ORICALCO_PAL, desc: 'Fundida de 8 minérios de oricalco. Leve como madeira de deriva. Vai para a bigorna do Grimaldo.' }
});
// os veios verde-dourados com o brilho de água por cima, e uma barra com o reflexo ondulado
ORE_ICONS.min_oricalco = [[
  "....W.....",
  "..rNg..r..",
  ".rgNnr.Wr.",
  ".rnWgrNgr.",
  "rRrgNgnRrr",
  ".rrrngrRr.",
  "..rrrrrr..",
  "....rr...."], { r: '#14202a', R: '#2a4250', n: '#72822c', g: '#a8a83c', N: '#e0d870', W: '#fffbd0' }];
BAR_ICONS.barra_oricalco = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgcgGggeE",
  "FFFFcFFFFcFeE",
  "mmmmGmmcmmmEE",
  "mmmcmmmGmmmE.",
  "dddddddddd..."], { T: '#fffbd0', t: '#e0d870', g: '#c8c050', G: '#ffffff', W: '#ffffff', c: '#8ae8d8', F: '#a8a83c', m: '#72822c', e: '#4a5e20', E: '#2e3e18', d: '#1a2410' }];

METALS.push({ id: 'oricalco', name: 'Oricalco', bar: 'barra_oricalco', il: layerForgeIl('mar'),
  wp: { w: '#fffbd0', W: '#e0d870', l: '#a8a83c', g: '#2a4250', G: '#14202a', h: '#1a2410', p: '#8ae8d8' },
  m: '#a8a83c', M: '#fffbd0', body: { r: '#c8c050', R: '#8a9030', D: '#4a5e20', b: '#1a2410', B: '#fffbd0' }, s: '#a8a83c', S: '#4a5e20' });
FORGE_ILVL.push(layerForgeIl('mar'));
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
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 8, hp: 21, art: HELM, oy: -1, oricalco: true }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 12, hp: 31, oricalco: true }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.06, oricalco: true }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    if (o.oricalco) o.desc += ' O oricalco não pesa na água e guarda ar: +2 s de fôlego.';
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  msEscama: [["...ssss...", "..sSWSss..", ".sSWSSSgs.", ".sSSSSgSs.", "..sSSgSs..", "..ssgSs...", "...sss....", ".........."], { s: '#164240', S: '#347a70', W: '#a8e8d8', g: '#0e2c2a' }],
  msTinta: [["...kk.....", "...cc.....", "..kKKk....", ".kKbbKk...", ".kbBbbk...", ".kbbbbk...", "..kkkk....", ".........."], { k: '#2a2a34', K: '#6a6a7a', c: '#8a6a40', b: '#0a0a14', B: '#3a3a5a' }],
  msIsca: [["......k...", ".....k....", "....k.....", "...k......", "..cCc.....", ".cCWCc....", "..cCc.....", "...c......"], { k: '#3a3a44', c: '#1a6a66', C: '#6ae8d8', W: '#e0fff8' }],
  msPeixe: [["..........", "w...www...", "ww.wWWWw..", "wwwWWWbWw.", "ww.wWWWw..", "w...www...", "..........", ".........."], { w: '#82969a', W: '#c8d8da', b: '#e8f4f6' }],
  msPeixeAssado: [["..........", "o...ooo...", "oo.oOgOo..", "oooOgOOgo.", "oo.oOOgo..", "o...ooo...", "..........", ".........."], { o: '#6a3a14', O: '#b06a2a', g: '#3e1a08' }]
});
Object.assign(ITEMS, {
  escama_abissal: { name: 'Escama Abissal', rar: 1, stack: 99, icon: 'msEscama', desc: 'Escama grossa da gente-peixe e dos tubarões-cegos, verde-escura e fria. O Grimaldo faz cota com ela.' },
  tinta_polvo: { name: 'Tinta de Polvo', rar: 1, stack: 99, icon: 'msTinta', desc: 'A tinta preta de um polvo das ruínas, guardada num frasquinho. Apaga a luz em volta. A Aurélia escreve pergaminhos com ela.' },
  isca_viva: { name: 'Isca Viva', rar: 1, stack: 99, icon: 'msIsca', desc: 'A ponta acesa de um diabo-marinho, ou um pedaço de medusa. Ainda brilha. A Marta tira luz e poção dela.' },
  peixe_cego: { name: 'Peixe-Cego', rar: 0, stack: 99, icon: 'msPeixe', cook: 1, desc: 'Um peixe branco sem olhos do mar de baixo. Cru não presta: o Odo, na taverna, sabe o que fazer. Ingrediente.' },
  peixe_assado: { name: 'Peixe-Cego na Brasa', rar: 1, stack: 20, icon: 'msPeixeAssado', food: { hp: 16, mp: 0, t: 10, eat: 3 }, desc: 'Assado na brasa da taverna do Odo, com sal do mar de baixo. Comer leva 3 segundos parado; depois recupera 16 de vida ao longo de 10 segundos.' }
});

/* ---------- as bases que só caem no Mar ---------- */
const MS_BASE_LVL = layerLo('mar');
Object.assign(ITEMS, {
  tridente_escamado: { name: 'Tridente Escamado', slot: 'weapon', kind: 'spear', rar: 1, critB: 0.02, pal: { w: '#e0f4ee', W: '#8ac8b8', l: '#347a70', g: '#4a5e20', G: '#2e3e18', h: '#164240', p: '#a8e8d8' }, desc: 'A lança de três pontas da gente-peixe, de bronze verde e osso. Feita para a água: a estocada não perde nada lá dentro.' },
  cutelo_abordagem: { name: 'Cutelo de Abordagem', slot: 'weapon', kind: 'sword', rar: 1, critB: 0.05, pal: { w: '#e8e2d4', W: '#a89e8a', l: '#6a6252', g: '#94722a', G: '#4a3612', h: '#36291c', p: '#c8c0ae' }, desc: 'Um cutelo curto de pirata, achado dentro da casca de um caranguejo-ermitão. Rápido, e corta fundo.' },
  escudo_carapaca: { name: 'Escudo de Carapaça', slot: 'shield', rar: 1, def: 4, parry: 0.34, thorns: 0.1, pal: { o: '#1a0e0a', W: '#6e2e12', w: '#b8622e', m: '#d68a50', M: '#f6c8a0' }, desc: 'A carapaça de um caranguejo grande, com os espinhos ainda nela. Apara largo, e quem bate se espeta.' }
});
Object.assign(BASE_INFO, { tridente_escamado: [MS_BASE_LVL, 0.74], cutelo_abordagem: [MS_BASE_LVL, 0.5], escudo_carapaca: [MS_BASE_LVL] });
Object.assign(ITEM_G, { tridente_escamado: 0, cutelo_abordagem: 0, escudo_carapaca: 0 });
for (const id of ['tridente_escamado', 'cutelo_abordagem', 'escudo_carapaca']) ITEMS[id].g = ITEM_G[id];
