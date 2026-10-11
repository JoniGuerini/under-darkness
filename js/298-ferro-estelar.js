'use strict';

/* ================= ferro estelar: o metal da Cidade dos Antigos (2026-10-11) =================
   Um metal por camada (102): o ferro estelar é o da Cidade dos Antigos (290-299). Não é da terra: é o ferro da estrela
   que caiu no fundo da cidade e abriu a cratera de vidro. Violeta-prata, com pontinhos brancos que piscam como estrelas;
   pede 8 minérios por barra (a regra do 00-geral: 8 do dracônio ao ferro estelar). A receita da fornalha, os preços e
   as lojas ficam no 295, que carrega depois da forja e do vilarejo.
   Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129) e as 9
   peças, cor violeta-prata com estrelinhas brancas na lâmina; o peitoral dá luz 1 (a estrela ainda brilha no metal).
   Também os materiais da camada (núcleo estelar, tessela, lente de vigia, pó estelar) e as três bases que só caem lá
   (Lança-Compasso, Elmo de Prumo, Couraça de Tesselas).
   Carrega logo depois do 257-lunarita, antes do 110-infernita: a bigorna mostra o ferro estelar entre a lunarita e a
   infernita. Carrega antes do 290, então não usa os ids de bloco da camada (o 291 liga o bloco ao minério). */

const FERRO_ESTELAR_PAL = ['#14121e', '#7a7ab0', '#f0f4ff'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_ferro_estelar: { name: 'Minério de Ferro Estelar', rar: 3, stack: 99, icon: 'ore', ore: FERRO_ESTELAR_PAL, desc: 'Um caroço violeta-prata arrancado do vidro da cratera. Os pontinhos brancos dentro dele ainda piscam.' },
  barra_ferro_estelar: { name: 'Barra de Ferro Estelar', rar: 3, stack: 99, icon: 'bar', ore: FERRO_ESTELAR_PAL, desc: 'Fundida de 8 minérios de ferro estelar. Mais pesada do que parece, e fria como a noite. Vai para a bigorna do Grimaldo.' }
});
// um caroço de ferro com pontinhos de estrela, meio enterrado; e a barra violeta com o céu dentro
ORE_ICONS.min_ferro_estelar = [[
  "...nNNn...",
  "..nNWNNn..",
  ".nNNNnWNn.",
  ".nWNnNNNk.",
  "rnNNNNWnkr",
  "rRknNnnkRr",
  ".rrkkkkRr.",
  "..rrrrrr..",
  "....rr...."], { r: '#0e1018', R: '#2e3a4a', k: '#2a2840', n: '#4a4870', N: '#7a7ab0', W: '#f0f4ff' }];
BAR_ICONS.barra_ferro_estelar = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgggWggeE",
  "FFFFFFFFFFFeE",
  "mmWmmmmmGmmEE",
  "mmmmmGmmmmmE.",
  "dddddddddd..."], { T: '#d4d8f4', t: '#b4b8e8', g: '#7a7ab0', G: '#c8ccf4', W: '#ffffff', F: '#5a5890', m: '#4a4870', e: '#2a2840', E: '#14121e', d: '#0a0910' }];

METALS.push({ id: 'ferro_estelar', name: 'Ferro Estelar', bar: 'barra_ferro_estelar', il: layerForgeIl('antigos'),
  wp: { w: '#f0f4ff', W: '#b4b8e8', l: '#7a7ab0', g: '#4a4870', G: '#2a2840', h: '#14121e', p: '#d4d8f4' },
  m: '#7a7ab0', M: '#f0f4ff', body: { r: '#7a7ab0', R: '#4a4870', D: '#2a2840', b: '#14121e', B: '#f0f4ff' }, s: '#7a7ab0', S: '#2a2840' });
FORGE_ILVL.push(layerForgeIl('antigos'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre a lunarita e a infernita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 43, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 29, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 65, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 51, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 46, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 8, hp: 21, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 12, hp: 30, light: 1 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.06 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    if (pc === 'peitoral') o.desc += ' O metal guarda um resto da luz da estrela e acende fraco no escuro.';
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  atNucleo: [["...bBBb...", "..bBWWBb..", ".bBWccWBb.", ".BWcWWcWB.", ".BWcWWcWB.", ".bBWccWBb.", "..bBWWBb..", "...bBBb..."], { b: '#2a2840', B: '#7a7ab0', W: '#f0f4ff', c: '#9af0f0' }],
  atTessela: [[".........", "....W....", "...WlW...", "..WlllW..", ".WlllllW.", "WlllcllldW", "dddddddddd", "........."], { W: '#b0bccc', l: '#56606e', c: '#4ac8d0', d: '#262c36' }],
  atLente: [["..kkkkk...", ".kcCCCck..", "kcCWWCCck.", "kCWWCCCCk.", "kCCCCCCck.", "kcCCCCcck.", ".kccccck..", "..kkkkk..."], { k: '#262c36', c: '#145058', C: '#4ac8d0', W: '#e8ffff' }],
  atPo: [["..W.......", "......w...", "...wWw....", "..wWWWw.W.", ".w.wWw....", "W...w..w..", "..w....W..", "w....w...."], { w: '#b4b8e8', W: '#ffffff' }]
});
Object.assign(ITEMS, {
  nucleo_estelar: { name: 'Núcleo Estelar', rar: 2, stack: 99, icon: 'atNucleo', desc: 'O coração de um construto: uma esfera de laje com uma luz parada dentro. Ainda está morno. O Grimaldo compra.' },
  tessela: { name: 'Tessela', rar: 0, stack: 99, icon: 'atTessela', desc: 'Um ladrilho triangular perfeito, que caiu de um enxame. Encaixa com qualquer outro. O Grimaldo compra.' },
  lente_vigia: { name: 'Lente de Vigia', rar: 1, stack: 99, icon: 'atLente', desc: 'A lente de um olho-vigia. Olhando por ela, tudo fica com linhas de medida. A Marta compra.' },
  po_estelar: { name: 'Pó Estelar', rar: 1, stack: 99, icon: 'atPo', desc: 'Poeira branca que sobe devagar quando a gente solta. Veio da estrela. A Marta compra.' }
});

/* ---------- as bases que só caem na Cidade ---------- */
const AT_BASE_LVL = layerLo('antigos');
Object.assign(ITEMS, {
  lanca_compasso: { name: 'Lança-Compasso', slot: 'weapon', kind: 'spear', rar: 1, critB: 0.03, atReach: 8, pal: { w: '#e8ffff', W: '#b0bccc', l: '#56606e', g: '#4ac8d0', G: '#145058', h: '#262c36', p: '#9af0f0' }, desc: 'Uma das pernas de um compasso dos Antigos, com a ponta afiada por régua. Alcança mais longe que qualquer lança.' },
  elmo_prumo: { name: 'Elmo de Prumo', slot: 'head', rar: 1, def: 8, hp: 6, light: 1, art: ["....mmmm....", "...mMWMMm...", "..mMMMMMMm..", "..mMMcMMMm..", "..mm....mm..", "..mm....mm..", "..m......m.."], oy: -1, pal: { m: '#56606e', M: '#b0bccc', W: '#e8ffff', c: '#4ac8d0' }, desc: 'Um elmo liso dos vigias, com um glifo aceso bem no meio da testa. Ilumina o caminho.' },
  couraca_tesselas: { name: 'Couraça de Tesselas', slot: 'body', rar: 1, def: 15, dodge: 0.03, pal: { r: '#7c8898', R: '#56606e', D: '#3a4250', b: '#145058', B: '#4ac8d0' }, desc: 'Centenas de tesselas encaixadas umas nas outras. Pesada, mas os golpes escorregam nos ângulos.' }
});
Object.assign(BASE_INFO, { lanca_compasso: [AT_BASE_LVL, 0.9], elmo_prumo: [AT_BASE_LVL], couraca_tesselas: [AT_BASE_LVL] });
Object.assign(ITEM_G, { lanca_compasso: 0, elmo_prumo: 0, couraca_tesselas: 0 });
for (const id of ['lanca_compasso', 'elmo_prumo', 'couraca_tesselas']) ITEMS[id].g = ITEM_G[id];
// a Lança-Compasso alcança 8 px a mais que as outras lanças: o 295 embrulha o recalc (este arquivo carrega antes do 08)
