'use strict';

/* ================= belicita: o metal do Campo da Última Guerra (2026-10-21) =================
   Um metal por camada (102): a belicita é a do Campo (400-409). Quando a guerra acabou, as armas dos dois exércitos
   ficaram no barro; o aço dos anjos e o ferro dos demônios se fundiram devagar, no calor da Brecha, e viraram veio:
   metal cinza-vinho com o fio dourado, que nasce perto das armas fincadas, da sucata e da rocha queimada.
   Pede 8 minérios por barra (a regra do 00-geral). A receita da fornalha, os preços e as lojas ficam no 405.
   Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129) e as 9
   peças (na arte, o aço escuro com o fio dourado); os materiais da camada (pena de anjo, chifre de demônio, trapo de
   estandarte, medalha de guerra) e as três bases que só caem lá (Espada de Anjo Caído, Escudo de Muralha, Elmo de
   Chifres do Caído).
   Carrega com os outros metais (depois do último deles, antes do 110-infernita): a bigorna mostra a belicita entre o
   metal da camada de cima e a infernita. Carrega antes do 400, então não usa os ids de bloco (o 401 liga o bloco). */

const BELICITA_PAL = ['#2a1418', '#8a5a5e', '#f0d070'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_belicita: { name: 'Minério de Belicita', rar: 3, stack: 99, icon: 'ore', ore: BELICITA_PAL, desc: 'Lascas de aço cinza-vinho com um fio dourado, presas na terra de batalha. Eram as armas de dois exércitos.' },
  barra_belicita: { name: 'Barra de Belicita', rar: 3, stack: 99, icon: 'bar', ore: BELICITA_PAL, desc: 'Fundida de 8 minérios de belicita. Escura como sangue seco, com o fio dourado correndo por cima. Vai para a bigorna do Grimaldo.' }
});
// pontas de lâmina quebradas saindo da terra, uma com o fio dourado; a barra escura com o fio claro em cima
ORE_ICONS.min_belicita = [[
  "....G.....",
  "...GSs..G.",
  "..GSs..GS.",
  ".rSsr.GSr.",
  "rRssRrSsRr",
  ".rrRrsrRr.",
  "..rrrrrr..",
  "....rr...."], { r: '#2a1c16', R: '#5a4030', s: '#5e3a40', S: '#8a5a5e', G: '#f0d070' }];
BAR_ICONS.barra_belicita = [[
  "...tTTTTTTTt.",
  "..tTGGGGGGTe.",
  ".tgggggggggeE",
  "FFFFFFFFFFFeE",
  "mmmmmmmmmmmEE",
  "mmmmmmmmmmmE.",
  "dddddddddd..."], { T: '#b88a8e', t: '#8a5a5e', g: '#5e3a40', G: '#f0d070', F: '#d4a850', m: '#3e2428', e: '#24141a', E: '#160a0e', d: '#0a0406' }];

METALS.push({ id: 'belicita', name: 'Belicita', bar: 'barra_belicita', il: layerForgeIl('guerra'),
  wp: { w: '#f0d070', W: '#8a5a5e', l: '#5e3a40', g: '#24141a', G: '#100608', h: '#2a1810', p: '#b88a8e' },
  m: '#8a5a5e', M: '#f0d070', body: { r: '#8a5a5e', R: '#6a4044', D: '#3e2428', b: '#160a0e', B: '#f0d070' }, s: '#6a4044', S: '#3e2428' });
FORGE_ILVL.push(layerForgeIl('guerra'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre o metal de cima e a infernita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 43, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 29, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 65, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 51, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 46, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 8, hp: 21, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 12, hp: 31 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.06 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}. Aço cor de sangue seco com o fio dourado.` }, st);
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  guPena: [["........W.", ".......Wp.", "......Wpp.", ".....Wpp..", "....Wpp...", "...Wpp....", "..spp.....", ".s........"], { W: '#fff4d8', p: '#d8c8a0', s: '#8a7a5a' }],
  guChifre: [["..........", ".k........", ".kK.......", "..kK......", "...kKK....", "....kKKk..", ".....kkKk.", ".......kk."], { k: '#2a1a14', K: '#6a4a3a' }],
  guTrapo: [["..........", ".rRRRRrr..", ".rRGRRRr..", ".rRRGRr...", "..rRRRrr..", "..rRRr.r..", "...rr.....", ".........."], { r: '#4a1412', R: '#8a2a22', G: '#c8a040' }],
  guMedalha: [["...r.r....", "...rRr....", "....r.....", "...gGg....", "..gGWGg...", "..gGGGg...", "...ggg....", ".........."], { r: '#6a1a18', R: '#a83028', g: '#7a5410', G: '#d8a830', W: '#fff0a0' }]
});
Object.assign(ITEMS, {
  pena_anjo: { name: 'Pena de Anjo', rar: 1, stack: 99, icon: 'guPena', desc: 'Uma pena comprida e clara de uma asa que caiu. Ainda brilha um pouco no escuro. A Marta paga bem: serve para a alquimia.' },
  chifre_demonio: { name: 'Chifre de Demônio', rar: 1, stack: 99, icon: 'guChifre', desc: 'Um chifre escuro e torto, quente na base. O Grimaldo faz cabos com ele.' },
  trapo_estandarte: { name: 'Trapo de Estandarte', rar: 1, stack: 99, icon: 'guTrapo', desc: 'Um pedaço de pano vermelho de um estandarte rasgado, com um fio de ouro bordado. O Grimaldo compra para forrar armaduras.' },
  medalha_guerra: { name: 'Medalha de Guerra', rar: 2, stack: 99, icon: 'guMedalha', desc: 'Uma medalha de ouro numa fita vinho, de um exército que ninguém lembra. O Odo coleciona e paga caro.' }
});

/* ---------- as bases que só caem no Campo ---------- */
const GU_BASE_LVL = layerLo('guerra');
Object.assign(ITEMS, {
  espada_anjo: { name: 'Espada de Anjo Caído', slot: 'weapon', kind: 'sword', rar: 1, crit: 0.18, pal: { w: '#fffbe8', W: '#e8dcb8', l: '#a89a78', g: '#f0d070', G: '#8a6a20', h: '#3a2a18', p: '#fff4c0' }, desc: 'A espada larga e clara de um anjo que caiu no barro. A lâmina não enferruja, e acha o ponto fraco.' },
  escudo_muralha: { name: 'Escudo de Muralha', slot: 'shield', rar: 1, def: 8, parry: 0.18, spd: -0.04, pal: { o: '#1a1214', W: '#3e2428', w: '#6a4044', m: '#8a8a90', M: '#f0d070' }, desc: 'Um escudo-torre de ferro de batalha, alto como um homem, com a marca de três exércitos. Pesa, mas segura.' },
  elmo_chifres_caido: { name: 'Elmo de Chifres do Caído', slot: 'head', rar: 1, def: 8, hp: 16, art: ["k..........k", "kk.mmmmmm.kk", ".kmMMMMMMmk.", ".mMMMbMMMm..", ".mMMMMMMMm..", ".m.......m..", ".m.........."], oy: -1, pal: { m: '#3e2428', M: '#6a4044', k: '#2a1a14', b: '#ff6a1a' }, desc: 'O elmo de um cavaleiro que lutou do lado dos demônios, com os chifres retos. Quem usa aguenta mais.' }
});
Object.assign(BASE_INFO, { espada_anjo: [GU_BASE_LVL], escudo_muralha: [GU_BASE_LVL], elmo_chifres_caido: [GU_BASE_LVL] });
Object.assign(ITEM_G, { espada_anjo: 1, escudo_muralha: 0, elmo_chifres_caido: 0 });
for (const id of ['espada_anjo', 'escudo_muralha', 'elmo_chifres_caido']) ITEMS[id].g = ITEM_G[id];
