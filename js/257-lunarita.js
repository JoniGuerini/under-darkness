'use strict';

/* ================= lunarita: o metal do Reino Élfico (2026-10-11) =================
   Um metal por camada (102): a lunarita é o da décima primeira, o Reino Élfico (250-259). Lascas branco-azuladas em
   crescente dentro do mármore-lua, que brilham fraco; pede 8 minérios por barra (a regra do 00-geral: 8 do dracônio
   em diante). A receita da fornalha, os preços e as lojas ficam no 255, que carrega depois da forja e do vilarejo.
   Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129: 21) e as
   9 peças; o peitoral de lunarita dá luz 1. Também os materiais da camada (folha de prata, asa de sílfide, essência
   fátua, pelo de cão-fada, rosa negra, lágrima de carpideira) e as três bases que só caem lá (Lâmina-Folha, Escudo
   de Folha, Elmo Alado). Revamp de 2026-10-21: o cristal sangrento, a pena de hipogrifo, a presa de sabre, a lágrima
   de espectro e o Glaive Lunar saíram com os monstros de cara de Warcraft (EL_ITEM_TROCA, o 258 troca nos saves).
   Carrega logo depois do 247-xenita, antes do 110-infernita: a bigorna mostra a lunarita entre a xenita e a
   infernita. Carrega antes do 250, então não usa os ids de bloco da camada (o 251 liga o bloco ao minério). */

const LUNARITA_PAL = ['#1a2a4a', '#9cc8ff', '#f4faff'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_lunarita: { name: 'Minério de Lunarita', rar: 3, stack: 99, icon: 'ore', ore: LUNARITA_PAL, desc: 'Lascas em forma de lua crescente presas no mármore. Brilham fraco mesmo no escuro.' },
  barra_lunarita: { name: 'Barra de Lunarita', rar: 3, stack: 99, icon: 'bar', ore: LUNARITA_PAL, desc: 'Fundida de 8 minérios de lunarita. Fria na mão, nunca embaça. Vai para a bigorna do Grimaldo.' }
});
// crescentes brancos saindo do mármore, e uma barra polida com o reflexo azul
ORE_ICONS.min_lunarita = [[
  "...WN.....",
  "..Wn...N..",
  ".rWn..Wnr.",
  ".rNWr.Wnr.",
  "rRrNWWnRrr",
  ".rrrNnrRr.",
  "..rrrrrr..",
  "....rr...."], { r: '#2a3448', R: '#5a6680', n: '#4a7ad0', N: '#9cc8ff', W: '#f4faff' }];
BAR_ICONS.barra_lunarita = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgggGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#f4faff', t: '#c8dcf4', g: '#9cc8ff', G: '#ffffff', W: '#ffffff', F: '#7aa4e0', m: '#4a7ad0', e: '#2a4a8a', E: '#1a2a4a', d: '#0e1a30' }];

METALS.push({ id: 'lunarita', name: 'Lunarita', bar: 'barra_lunarita', il: layerForgeIl('elfos'),
  wp: { w: '#f4faff', W: '#9cc8ff', l: '#4a7ad0', g: '#2a3448', G: '#141a28', h: '#1a2030', p: '#c8dcf4' },
  m: '#9cc8ff', M: '#f4faff', body: { r: '#9cc8ff', R: '#5a86c8', D: '#2a4a8a', b: '#0e1a30', B: '#f4faff' }, s: '#9cc8ff', S: '#2a4a8a' });
FORGE_ILVL.push(layerForgeIl('elfos'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre a xenita e a infernita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 42, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 28, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 64, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 50, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 45, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 8, hp: 20, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 12, hp: 29, light: 1 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.059 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    if (pc === 'peitoral') o.desc += ' A lunarita guarda um pouco de luar e acende fraco no escuro.';
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada (revistos no revamp de 2026-10-21: os elfos de cara de Warcraft saíram) ---------- */
Object.assign(ICON_ART, {
  elFolha: [["......lL..", ".....lLW..", "....lLLl..", "...lLWLl..", "..lLLLl...", ".lLWLl....", ".lLl......", "s........."], { l: '#7a96b0', L: '#c8dcec', W: '#ffffff', s: '#5a6a7a' }],
  // a asa de sílfide: vidro fino com as nervuras de prata, a ponta azulada
  elAsa: [[".......wW.", ".....wWnW.", "...wWnWWw.", "..wnWWnw..", ".wWWnWw...", ".nWwWw....", "kwWw......", "k........."], { w: '#9cb8d0', W: '#e8f4ff', n: '#c8d4e4', k: '#5a6474' }],
  elFatua: [["....b.....", "...bBb....", "..bBWBb...", "..BWWWB...", "..bBWBb...", "...bBb....", "....b.....", ".........."], { b: '#2a6ab0', B: '#7ad0ff', W: '#f4ffff' }],
  // o tufo de pelo de cão-fada: verde-musgo escuro, trançado, preso por uma linha clara
  elPelo: [[".....gG...", "....gGgd..", "...gGdGg..", "..gGgGd...", "..dGgg....", ".wwdg.....", ".dgG......", "dg........"], { g: '#2e5a3a', G: '#5e9a68', d: '#142a1c', w: '#d8d0bc' }],
  // a rosa negra: as pétalas violeta-escuras em espiral, o talo de espinho
  elRosa: [["...rRr....", "..rRWRr...", ".rRrRRRr..", ".rRRrRr...", "..rrRr....", "....g.....", "...gtg....", "....g....."], { r: '#36102a', R: '#7a2c62', W: '#c890b8', g: '#2e4232', t: '#5e7a5a' }],
  elLagrima: [["....w.....", "....W.....", "...wWw....", "..wWWWw...", "..WWbWW...", "..wWWWw...", "...www....", ".........."], { w: '#7ab8c8', W: '#dcf4ff', b: '#ffffff' }]
});
Object.assign(ITEMS, {
  folha_prata: { name: 'Folha de Prata', rar: 0, stack: 99, icon: 'elFolha', desc: 'Uma folha das árvores debaixo da Lua Presa, fina como papel e fria como metal. A Marta faz chá de cura com ela.' },
  asa_silfide: { name: 'Asa de Sílfide', rar: 1, stack: 99, icon: 'elAsa', desc: 'A asa caída de uma sílfide, fina como vidro, com nervuras de prata. Ainda treme quando venta. A Aurélia compra.' },
  essencia_fatua: { name: 'Essência Fátua', rar: 1, stack: 99, icon: 'elFatua', desc: 'O que sobra de um fogo-fátuo: uma chama azul presa numa gota. A Aurélia compra.' },
  pelo_caofada: { name: 'Pelo de Cão-Fada', rar: 1, stack: 99, icon: 'elPelo', desc: 'Um tufo trançado do pelo verde de um cão-fada. Dizem que quem o carrega não ouve o terceiro latido. O Grimaldo enrola cabos com ele.' },
  rosa_negra: { name: 'Rosa Negra', rar: 3, stack: 99, icon: 'elRosa', desc: 'Uma rosa da Corte dos Espinhos que nunca murcha. As pétalas cortam como navalha e cheiram a sono velho. A Aurélia paga caro.' },
  lagrima_carpideira: { name: 'Lágrima de Carpideira', rar: 1, stack: 99, icon: 'elLagrima', desc: 'Uma gota fria que uma carpideira deixou cair chorando por alguém. Não seca. A Marta compra.' }
});

/* ---------- as bases que só caem no Reino ---------- */
const EL_BASE_LVL = layerLo('elfos');
Object.assign(ITEMS, {
  lamina_folha: { name: 'Lâmina-Folha', slot: 'weapon', kind: 'sword', rar: 1, critB: 0.04, pal: { w: '#f4faff', W: '#b8c8d8', l: '#5a6a82', g: '#9a8a6a', G: '#5e5240', h: '#2a3028', p: '#d8e6dc' }, desc: 'A espada longa dos guardas da fronteira, a lâmina estreita em forma de folha de salgueiro. Leve, rápida e de corte limpo.' },
  escudo_folha: { name: 'Escudo de Folha', slot: 'shield', rar: 1, def: 4, parry: 0.3, pal: { o: '#1a2a3a', W: '#5a86c8', w: '#c8dcec', m: '#e6eef8', M: '#ffffff' }, desc: 'Um escudo em forma de folha, de madeira prateada com borda de metal. O dos guardiões do salão.' },
  elmo_alado: { name: 'Elmo Alado', slot: 'head', rar: 1, def: 7, hp: 8, art: ["w..........w", "Ww.mmmmm..wW", ".WmMMWMMmW..", ".mMMMbMMMm..", ".mMMMMMMMm..", ".m.......m..", ".m.........."], oy: -1, pal: { m: '#7a96b0', M: '#e6eef8', W: '#ffffff', w: '#c8dcec', b: '#4a7ad0' }, desc: 'O elmo prateado dos guardiões do salão, com uma asa de cada lado. Leve e firme.' }
});
Object.assign(BASE_INFO, { lamina_folha: [EL_BASE_LVL, 0.54], escudo_folha: [EL_BASE_LVL], elmo_alado: [EL_BASE_LVL] });
Object.assign(ITEM_G, { lamina_folha: 1, escudo_folha: 0, elmo_alado: 0 });
for (const id of ['lamina_folha', 'escudo_folha', 'elmo_alado']) ITEMS[id].g = ITEM_G[id];
// a Lâmina-Folha tem crítico a mais; o 197 já soma `critB` de qualquer item (baseStats)
// os itens de antes do revamp (2026-10-21) que viraram outros: o 258 troca nos saves
const EL_ITEM_TROCA = { cristal_sangrento: 'rosa_negra', pena_hipogrifo: 'asa_silfide', presa_sabre: 'pelo_caofada', lagrima_espectro: 'lagrima_carpideira', glaive_lunar: 'lamina_folha' };
