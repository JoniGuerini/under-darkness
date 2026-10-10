'use strict';

/* ================= a cozinha do Odo: ingredientes, pratos e receitas (só dados; a wiki carrega também) =================
   Ingredientes caem dos bichos do subterrâneo; o Odo cozinha na taverna (js/99-cozinha.js) e o prato vira um
   consumível que se come parado, como quem conjura o portal. Comer leva `food.eat` segundos; depois a vida
   (e a mana, no ensopado) volta aos poucos durante `food.t` segundos. Uma refeição nova toma o lugar da anterior. */

Object.assign(ICON_ART, {
  // pernil cru: carne vermelha com veio de gordura e o osso saindo embaixo
  rawMeat: [["..drrrd...", ".drRRrrd..", "drRpRRrrd.", "drRRpRrrd.", "drRRRrrrd.", ".drrrrrd..", "..ddrrdWw.", ".....dWwW.", "......Ww.."],
    { d: '#4a1014', r: '#9a2428', R: '#cc4440', p: '#f0b0a0', W: '#b8a888', w: '#ece2c8' }],
  // o mesmo pernil assado: casca dourada, marcas da grelha
  roastMeat: [["..drrrd...", ".drRRgrd..", "drRpRgrrd.", "drRgpRgrd.", "drgRRgrrd.", ".drrgrrd..", "..ddrrdWw.", ".....dWwW.", "......Ww.."],
    { d: '#2e1206', r: '#7a3a12', R: '#b0602a', p: '#f0b860', g: '#3e1a08', W: '#b8a888', w: '#ece2c8' }],
  // cogumelo das grutas: chapéu pardo com pintas claras, lamelas e pé
  cookShroom: [["...ccc...", ".ccCCCcc.", "cCCwCCwCc", "cCCCCwCCc", ".ddgggdd.", "...sSs...", "...sSs...", "..ssSss.."],
    { c: '#5a3018', C: '#a0602c', w: '#f0e4c4', d: '#3a2414', g: '#8a6a4a', s: '#bcae90', S: '#ece2c8' }],
  // ensopado na tigela de madeira: caldo grosso, pedaços de carne e cogumelo, uma folha verde
  stewBowl: [[".ooooooooo.", "oMmMcmgMmMo", "obmMmmMcmbo", "obbbbbbbbbo", ".bBbbbbbBb.", "..bbbbbbb..", "...ddddd..."],
    { o: '#a8783e', m: '#7a3e14', M: '#b46a30', c: '#e0cca0', g: '#6a9a2a', b: '#6a4426', B: '#8e5c32', d: '#2e1a0c' }]
});

Object.assign(ITEMS, {
  carne_crua: { name: 'Carne Crua', rar: 0, stack: 99, icon: 'rawMeat', cook: 1, desc: 'Carne fresca de bicho do subterrâneo. Crua não presta: o Odo, na taverna, sabe o que fazer. Ingrediente.' },
  cogumelo: { name: 'Cogumelo das Grutas', rar: 0, stack: 99, icon: 'cookShroom', cook: 1, desc: 'Cresce na cabeça do fungo esporento. Cozido perde o veneno e ganha gosto de terra. Ingrediente.' },
  carne_assada: { name: 'Carne Assada', rar: 1, stack: 20, icon: 'roastMeat', food: { hp: 8, mp: 0, t: 8, eat: 3 }, desc: 'Assada na brasa da taverna do Odo. Comer leva 3 segundos parado; depois recupera 8 de vida ao longo de 8 segundos.' },
  ensopado: { name: 'Ensopado de Cogumelos', rar: 1, stack: 20, icon: 'stewBowl', food: { hp: 14, mp: 15, t: 14, eat: 4 }, desc: 'O caldeirão do Odo: carne e cogumelos fervidos devagar. Comer leva 4 segundos parado; depois recupera 14 de vida e 15 de mana ao longo de 14 segundos.' }
});
Object.assign(MAT_VAL, { carne_crua: 3, cogumelo: 3, carne_assada: 10, ensopado: 16 });

// quem deixa cair o quê (chance antes do corte de materiais do 10-combate)
for (const [k, id, ch, a, b] of [
  ['rato', 'carne_crua', 0.6], ['sapo', 'carne_crua', 0.6], ['toupeira', 'carne_crua', 0.6],
  ['lobo', 'carne_crua', 0.7], ['javali', 'carne_crua', 0.9, 1, 2], ['yeti', 'carne_crua', 0.8, 1, 2],
  ['fungo', 'cogumelo', 0.75, 1, 2]
]) if (DROPS[k]) DROPS[k].push(a ? [id, ch, a, b] : [id, ch]);

/* Regra da culinária (Jonathan, 2026-10-10):
   - Preparar uma coisa crua é 1 para 1: 1 carne crua vira 1 carne assada (um frango vira um frango assado). Não se pede 2 crus para 1 pronto.
   - Todo prato vai ao fogo, então toda receita gasta combustível: `fuel` unidades de madeira ou de carvão (qualquer um dos dois, `CK_FUEL`).
   - Receitas que juntam vários ingredientes (o ensopado) pedem cada um na quantidade que faz sentido, mais o combustível. */
const CK_FUEL = ['madeira', 'carvao'];   // na ordem em que o fogo gasta: madeira primeiro, carvão depois
// as receitas, em grupos como o livro da forja: `t` = segundos no fogo por prato, `need` = ingredientes, `fuel` = combustível por prato
const COZINHA = [
  { k: 'brasa', name: 'Na brasa', items: [{ id: 'carne_assada', t: 3, need: [['carne_crua', 1]], fuel: 1 }] },
  { k: 'caldeirao', name: 'No caldeirão', items: [{ id: 'ensopado', t: 4.5, need: [['carne_crua', 1], ['cogumelo', 2]], fuel: 1 }] }
];
const CK_REC = Object.fromEntries(COZINHA.flatMap(G => G.items.map(r => [r.id, Object.assign(r, { g: G.k })])));
