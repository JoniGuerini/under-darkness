'use strict';

/* ================= ferro divino: o metal da Prisão dos Deuses (2026-10-21) =================
   Um metal por camada (102): o ferro divino é o da Prisão dos Deuses (390-399). É o ferro de que os deuses fizeram as
   correntes dos que eles prenderam: preto de tão escuro, com veios de ouro que acendem quando batem nele. Pede 8
   minérios por barra (a regra do 00-geral). A receita da fornalha, os preços e as lojas ficam no 395, que carrega
   depois da forja e do vilarejo.
   Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129) e as 9
   peças, preto com o fio de ouro; o peitoral dá um pouco de espinho (quem bate na corrente se corta). Também os
   materiais da camada (icor divino, elo vivo, pena do suplício, coração de pedra, presa de lobo) e as três bases que só
   caem lá (Mangual de Grilhão, Elmo do Carcereiro, Cota de Elos).
   Carrega logo depois do 288-adamantita, antes do 110-infernita: a bigorna mostra o ferro divino entre a adamantita e
   a infernita. Carrega antes do 390, então não usa os ids de bloco da camada (o 391 liga o bloco ao minério). */

const FERRO_DIVINO_PAL = ['#0c0a08', '#3a3630', '#ffcc4a'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_ferro_divino: { name: 'Minério de Ferro Divino', rar: 3, stack: 99, icon: 'ore', ore: FERRO_DIVINO_PAL, desc: 'Uma lasca preta e pesada da rocha da prisão, cortada por um fio de ouro. Bater nela faz o fio acender.' },
  barra_ferro_divino: { name: 'Barra de Ferro Divino', rar: 3, stack: 99, icon: 'bar', ore: FERRO_DIVINO_PAL, desc: 'Fundida de 8 minérios de ferro divino. É o ferro das correntes dos deuses. Vai para a bigorna do Grimaldo.' }
});
ORE_ICONS.min_ferro_divino = [[
  "...nNNn...",
  "..nNnYNn..",
  ".nNNYnnNn.",
  ".nNnYNNNk.",
  "rnNNnYNnkr",
  "rRknNnYkRr",
  ".rrkkkkRr.",
  "..rrrrrr..",
  "....rr...."], { r: '#0a0806', R: '#2a241c', k: '#14120e', n: '#26221c', N: '#4a443a', Y: '#ffcc4a' }];
BAR_ICONS.barra_ferro_divino = [[
  "...tTTTTTTTt.",
  "..tTgggYgGTe.",
  ".tggGgYgggeeE",
  "FFFFFYFFFFFeE",
  "mmmmYmmmmmmEE",
  "mmmYmmmmmmmE.",
  "dddddddddd..."], { T: '#6a6458', t: '#4e4a40', g: '#3a3630', G: '#5a5448', Y: '#ffcc4a', F: '#24221e', m: '#1a1814', e: '#100e0c', E: '#080604', d: '#040302' }];

METALS.push({ id: 'ferro_divino', name: 'Ferro Divino', bar: 'barra_ferro_divino', il: layerForgeIl('prisao'),
  wp: { w: '#fff0b0', W: '#8a8070', l: '#4a443a', g: '#2a2620', G: '#16140f', h: '#0a0806', p: '#ffcc4a' },
  m: '#3a3630', M: '#ffcc4a', body: { r: '#3a3630', R: '#26221c', D: '#16140f', b: '#0a0806', B: '#ffcc4a' }, s: '#3a3630', S: '#16140f' });
FORGE_ILVL.push(layerForgeIl('prisao'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre a adamantita e a infernita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 44, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 30, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 67, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 53, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 47, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 9, hp: 22, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 13, hp: 31, thorns: 0.06 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.06 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    if (pc === 'peitoral') o.desc += ' Feito de elos como as correntes dos deuses: quem bate nele de perto se corta.';
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  pdIcor: [["....Y.....", "...YWY....", "...YWY....", "..YWWWY...", ".YWWYYWY..", ".YWYYYYY..", ".yYYYYYy..", "..yyyyy..."], { y: '#a87010', Y: '#ffcc4a', W: '#fff0b0' }],
  pdElo: [["..kkkk....", ".kNNNNk...", "kN....Nkk.", "kN..kkNNNk", "kNkkNNk..N", ".kNNk..kNk", "...kN..Nk.", "....kNNk.."], { k: '#16161c', N: '#7a7a86' }],
  pdPena: [[".......bB", "......bBb", ".....bBb.", "....bBYb.", "...bBYb..", "..bBYb...", ".bBb.....", "Yb......."], { b: '#32200e', B: '#8a6a2e', Y: '#e8c878' }],
  pdCoracao: [["...kkkk...", "..kRRRRk..", ".kRrVrrRk.", ".kRVVVrRk.", ".kRrVrRRk.", "..kRrrRk..", "...kRRk...", "....kk...."], { k: '#140a0a', R: '#4c2824', r: '#643830', V: '#ff6a3a' }],
  pdPresa: [["..WWw.....", "..WWWw....", "...WWWw...", "...wWWWw..", "....wWWw..", ".....wWw..", "......ww..", ".......d.."], { W: '#dcd0b6', w: '#a09078', d: '#5a4e3c' }]
});
Object.assign(ITEMS, {
  icor_divino: { name: 'Icor Divino', rar: 2, stack: 99, icon: 'pdIcor', desc: 'Uma gota de ouro quente que não esfria nunca. É o sangue dos deuses presos. A Marta compra.' },
  elo_vivo: { name: 'Elo Vivo', rar: 0, stack: 99, icon: 'pdElo', desc: 'Um elo das correntes da prisão que ainda se mexe sozinho, devagar, na palma da mão. O Grimaldo compra.' },
  pena_suplicio: { name: 'Pena do Suplício', rar: 1, stack: 99, icon: 'pdPena', desc: 'Uma pena de bronze escuro, dura como lâmina. Cheira a sangue velho. A Marta compra.' },
  coracao_pedra: { name: 'Coração de Pedra', rar: 1, stack: 99, icon: 'pdCoracao', desc: 'O caroço vermelho de dentro de uma pedra viva. Bate, muito de vez em quando. O Grimaldo compra.' },
  presa_lobo: { name: 'Presa de Lobo', rar: 0, stack: 99, icon: 'pdPresa', desc: 'Um dente de leite de uma cria do lobo. Do tamanho de uma adaga. A Marta compra.' }
});

/* ---------- as bases que só caem na Prisão ---------- */
const PD_BASE_LVL = layerLo('prisao');
Object.assign(ITEMS, {
  mangual_grilhao: { name: 'Mangual de Grilhão', slot: 'weapon', kind: 'mace', rar: 1, critB: 0.04, pal: { w: '#fff0b0', W: '#8a8070', l: '#55555f', g: '#3a3a44', G: '#16161c', h: '#0a0806', p: '#ffcc4a' }, desc: 'O grilhão de um condenado, a bola de ferro ainda presa na corrente. Pesado de girar, e o golpe acerta onde mais dói.' },
  elmo_carcereiro: { name: 'Elmo do Carcereiro', slot: 'head', rar: 1, def: 9, hp: 12, art: ["..mmmmmmmm..", ".mMMMMMMMMm.", ".mMMMMMMMMm.", ".mmkkkkkkmm.", ".mM......Mm.", ".mM......Mm.", "..m......m.."], oy: -1, pal: { m: '#4e463a', M: '#888070', k: '#0a0808' }, desc: 'O elmo quadrado de pedra de um carcereiro, com a fenda fina do visor. Pesado, mas nada passa por ele.' },
  cota_elos: { name: 'Cota de Elos', slot: 'body', rar: 1, def: 14, thorns: 0.12, pal: { r: '#55555f', R: '#3a3a44', D: '#26262e', b: '#16161c', B: '#a8a8b4' }, desc: 'Uma camisa feita dos elos soltos, que ainda se apertam sozinhos. Quem bate em você de perto se corta.' }
});
Object.assign(BASE_INFO, { mangual_grilhao: [PD_BASE_LVL, 1.0], elmo_carcereiro: [PD_BASE_LVL], cota_elos: [PD_BASE_LVL] });
Object.assign(ITEM_G, { mangual_grilhao: 0, elmo_carcereiro: 0, cota_elos: 1 });
for (const id of ['mangual_grilhao', 'elmo_carcereiro', 'cota_elos']) ITEMS[id].g = ITEM_G[id];
