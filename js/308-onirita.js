'use strict';

/* ================= onirita: o metal dos Salões do Pesadelo (2026-10-11) =================
   Um metal por camada (102): a onirita é o dos Salões do Pesadelo (300-309). Um metal lilás que muda de cor devagar
   (lilás, rosa, turquesa), como óleo na água; só existe enquanto alguém sonha com ele (os veios nascem em volta dos
   Adormecidos, 305 e 306). Pede 9 minérios por barra (a ficha). A receita da fornalha, os preços e as lojas ficam no
   305, que carrega depois da forja e do vilarejo. Aqui: o minério e a barra, o metal na forja (METALS, nível de item
   pela posição da camada no registro 129) e as 9 peças; os materiais da camada (pó de sono, caco de porcelana, corda
   de caixinha, ponteiro mole) e as três bases que só caem lá (Tesoura de Costura, Capuz de Lençol, Pantufas do
   Sonâmbulo: os passos não fazem barulho para quem ouve).
   Carrega logo antes do 110-infernita: a bigorna mostra a onirita antes da infernita. Carrega antes do 300, então não
   usa os ids de bloco da camada (o 301 liga o bloco ao minério). */

const ONIRITA_PAL = ['#34205a', '#c09ae0', '#f2dcff'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_onirita: { name: 'Minério de Onirita', rar: 3, stack: 99, icon: 'ore', ore: ONIRITA_PAL, desc: 'Um metal que alguém está sonhando. Muda de cor devagar, lilás, rosa, turquesa. Se o sonhador acordar, ele some do veio.' },
  barra_onirita: { name: 'Barra de Onirita', rar: 3, stack: 99, icon: 'bar', ore: ONIRITA_PAL, desc: 'Fundida de 9 minérios de onirita. Sonhada e levada embora, virou metal de verdade. Vai para a bigorna do Grimaldo.' }
});
ORE_ICONS.min_onirita = [[
  "....Pp....",
  "..rPWpr...",
  ".rpWTtpr..",
  "rRpPtTPrr.",
  "rRrpPWpRr.",
  ".rrRpprRr.",
  "..rrrrrr..",
  "....rr...."], { r: '#2a2434', R: '#585068', p: '#8a64b8', P: '#c09ae0', W: '#f2dcff', t: '#f0a0c8', T: '#90e8e0' }];
BAR_ICONS.barra_onirita = [[
  "...tTTTTTTTt.",
  "..tTgWgrgGTe.",
  ".tggGgqgGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#f2dcff', t: '#e0c8f4', g: '#c09ae0', G: '#ffffff', W: '#ffffff', r: '#f0a0c8', q: '#90e8e0', F: '#a07cd0', m: '#8a64b8', e: '#5a3a8a', E: '#34205a', d: '#1a1030' }];

METALS.push({ id: 'onirita', name: 'Onirita', bar: 'barra_onirita', il: layerForgeIl('pesadelo'),
  wp: { w: '#f2dcff', W: '#c09ae0', l: '#8a64b8', g: '#34205a', G: '#1a1030', h: '#2a2434', p: '#f0a0c8' },
  m: '#c09ae0', M: '#f2dcff', body: { r: '#c09ae0', R: '#8a64b8', D: '#5a3a8a', b: '#1a1030', B: '#f2dcff' }, s: '#c09ae0', S: '#5a3a8a' });
FORGE_ILVL.push(layerForgeIl('pesadelo'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: antes da infernita
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
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, onirita: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}. A cor não para quieta.` }, st);
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  psPo: [["..........", "...w..W...", ".W..wWw.w.", "..wWPWw...", ".wWPpPWw..", "..wPWPw.W.", "W..www....", "....W....."], { w: '#a69cba', W: '#f2dcff', P: '#c09ae0', p: '#8a64b8' }],
  psPorcelana: [["..........", "...wWWw...", "..wWWWWW..", "..wWrWWk..", "...wWWk...", "....wk....", ".....k....", ".........."], { w: '#b0a6a0', W: '#faf6f4', r: '#ba5a7a', k: '#5a5250' }],
  psCorda: [["..gG......", "..Gg......", "...gGgg...", "....gGGg..", "...gG..g..", "..gG...G..", "...gGgG...", "....gg...."], { g: '#a8822e', G: '#f4dc8a' }],
  psPonteiro: [["..........", ".k........", "..kk......", "...kKk....", "....kKkk..", ".....kkKk.", "......kk.k", ".........."], { k: '#1a1416', K: '#4a4652' }]
});
Object.assign(ITEMS, {
  po_de_sono: { name: 'Pó de Sono', rar: 1, stack: 99, icon: 'psPo', desc: 'O pó cintilante das asas da mariposa do sono. Cheirar dá vontade de deitar. A Marta faz poção de dormir com ele.' },
  porcelana: { name: 'Caco de Porcelana', rar: 1, stack: 99, icon: 'psPorcelana', desc: 'Um pedaço de rosto de boneca, ainda com a bochecha pintada. O Grimaldo usa no esmalte.' },
  corda_caixinha: { name: 'Corda de Caixinha', rar: 1, stack: 99, icon: 'psCorda', desc: 'A mola de uma caixinha de música. Se der corda, toca a mesma nota. O Odo gosta.' },
  ponteiro_mole: { name: 'Ponteiro Mole', rar: 1, stack: 99, icon: 'psPonteiro', desc: 'O ponteiro de um relógio derretido. Ainda anda, para trás. A Marta compra.' }
});

/* ---------- as bases que só caem nos Salões ---------- */
const PS_BASE_LVL = layerLo('pesadelo');
Object.assign(ITEMS, {
  tesoura_costura: { name: 'Tesoura de Costura', slot: 'weapon', kind: 'dagger', rar: 1, crit: 0.14, critB: 0.06, pal: { w: '#f4f4fa', W: '#c6c4d0', l: '#7e7c8c', g: '#ba5a7a', G: '#6e2842', h: '#2a2434', p: '#e2e0ea' }, desc: 'Uma tesoura de costura grande demais, com as argolas cor-de-rosa. Corta fundo e acha o ponto fraco.' },
  capuz_lencol: { name: 'Capuz de Lençol', slot: 'head', rar: 1, def: 5, dodge: 0.06, art: [".llllllll...", "lLLLLLLLLl..", "lLWLLLLWLl..", "lLkLLLLkLl..", "lLLLLLLLLl..", ".lLLLLLLl...", "..l....l...."], oy: -2, pal: { l: '#948f9e', L: '#dcd8e4', W: '#f6f4fa', k: '#140d14' }, desc: 'Um lençol com dois furos para os olhos, como fantasma de criança. Ninguém acerta o que não sabe onde está.' },
  pantufas_sonambulo: { name: 'Pantufas do Sonâmbulo', slot: 'feet', rar: 1, def: 3, spd: 0.09, pal: { s: '#c6c4d0', S: '#7e7c8c' }, desc: 'Pantufas felpudas de quem anda dormindo. Rápidas, e os passos não fazem barulho para quem só ouve.' }
});
Object.assign(BASE_INFO, { tesoura_costura: [PS_BASE_LVL, 0.4], capuz_lencol: [PS_BASE_LVL], pantufas_sonambulo: [PS_BASE_LVL] });
Object.assign(ITEM_G, { tesoura_costura: 1, capuz_lencol: 0, pantufas_sonambulo: 3 });
for (const id of ['tesoura_costura', 'capuz_lencol', 'pantufas_sonambulo']) ITEMS[id].g = ITEM_G[id];
// as pantufas: o Sonâmbulo (303) não ouve os passos de quem as calça
const psPantufas = () => typeof equip !== 'undefined' && equip && equip.feet && equip.feet.id === 'pantufas_sonambulo';
