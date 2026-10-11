'use strict';

/* ================= adamantita: o metal do Ossário dos Titãs (2026-10-11) =================
   Um metal por camada (102): a adamantita é o da décima quarta, o Ossário (280-289). O metal da foice de Cronos: as
   lascas que a lâmina deixou cravadas nos titãs viraram veio na rocha fóssil e no osso, sempre perto de uma lasca ou de
   bronze. Aço cinza-esverdeado com o fio quase branco; pede 8 minérios por barra (a regra do 00-geral).
   A receita da fornalha, os preços e as lojas ficam no 285, que carrega depois da forja e do vilarejo. Aqui: o minério e
   a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129) e as 9 peças. Também os
   materiais da camada (tutano de titã, dente de titã, tendão seco, olho de ciclope) e as três bases que só caem lá
   (Maça de Fêmur, Escudo de Omoplata, Elmo de Crânio de Nascido).
   Carrega com os outros metais (depois do último deles, antes do 110-infernita): a bigorna mostra a adamantita entre
   o metal da camada de cima e a infernita. Carrega antes do 280, então não usa os ids de bloco (o 281 liga o bloco).

   O registro (129): as cinco camadas novas (Mar Sem Sol, Covil, Ossário, Antigos, Pesadelo) foram feitas ao mesmo tempo.
   Para o nível dos monstros, do chefe e da forja saírem certos qualquer que seja a ordem em que cada uma entrou no
   registro, o Ossário se acomoda aqui: logo abaixo da mais funda que existir entre Covil, Mar e Elfos, e acima de
   Antigos, Pesadelo e Abismo. */
{
  const at = id => LAYERS.findIndex(L => L.id === id);
  let k = at('titas'); const me = k >= 0 ? LAYERS.splice(k, 1)[0] : { id: 'titas', nome: 'O Ossário dos Titãs' };
  const up = Math.max(...['elfos', 'mar', 'covil', 'dragao'].map(at)), down = ['antigos', 'pesadelo', 'abismo'].map(at).filter(i => i >= 0);
  k = Math.max(up + 1, 0); if (down.length) k = Math.min(k, Math.min(...down));
  LAYERS.splice(k, 0, me);
}

const ADAMANTITA_PAL = ['#1c2422', '#7a948a', '#d0e4dc'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_adamantita: { name: 'Minério de Adamantita', rar: 3, stack: 99, icon: 'ore', ore: ADAMANTITA_PAL, desc: 'Cacos de aço cinza-esverdeado presos na rocha fóssil. Foram a lâmina da foice que derrubou os titãs.' },
  barra_adamantita: { name: 'Barra de Adamantita', rar: 3, stack: 99, icon: 'bar', ore: ADAMANTITA_PAL, desc: 'Fundida de 8 minérios de adamantita. Pesada, fria, e o fio que se tira dela não cega. Vai para a bigorna do Grimaldo.' }
});
// cacos de lâmina saindo da rocha, e uma barra fosca com o fio claro
ORE_ICONS.min_adamantita = [[
  "....W.....",
  "...WNr..N.",
  "..WNn..Wn.",
  ".rNnr.WNr.",
  "rRnnRrNnRr",
  ".rrRrnrRr.",
  "..rrrrrr..",
  "....rr...."], { r: '#2e2a24', R: '#5a5444', n: '#465652', N: '#7a948a', W: '#d0e4dc' }];
BAR_ICONS.barra_adamantita = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgggGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#e8f4ee', t: '#b0c8be', g: '#7a948a', G: '#d0e4dc', W: '#ffffff', F: '#5e7470', m: '#465652', e: '#2e3a38', E: '#1c2422', d: '#141a18' }];

const ADA_LAYER = 'titas';
METALS.push({ id: 'adamantita', name: 'Adamantita', bar: 'barra_adamantita', il: layerForgeIl(ADA_LAYER),
  wp: { w: '#e8f4ee', W: '#7a948a', l: '#465652', g: '#3a352a', G: '#1e1a14', h: '#2e2a24', p: '#d0e4dc' },
  m: '#7a948a', M: '#d0e4dc', body: { r: '#7a948a', R: '#5e7470', D: '#2e3a38', b: '#141a18', B: '#d0e4dc' }, s: '#7a948a', S: '#2e3a38' });
FORGE_ILVL.push(layerForgeIl(ADA_LAYER));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: um pouco acima da lunarita, abaixo do noctírio
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 43, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 29, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 66, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 52, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 46, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 9, hp: 21, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 12, hp: 31 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.06 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    if (pc === 'espada' || pc === 'machado') o.desc += ' O fio de adamantita não cega.';
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  ttTutano: [["...wwww...", "..wWWWWw..", ".wWtTTtWw.", ".wWTTTTWw.", ".wWtTTtWw.", ".wWTTttWw.", "..wWWWWw..", "...wwww..."], { w: '#8a806a', W: '#d6ccb2', t: '#b87a5a', T: '#ecc8a4' }],
  ttDente: [["..wWWWw...", ".wWWWWWw..", ".WWWbWWWw.", ".wWWWWWw..", "..wWWWw...", "..wW.Ww...", "..rw.wr...", "..r...r..."], { w: '#94a2a8', W: '#f4f8fa', b: '#ffffff', r: '#866648' }],
  ttTendao: [["......tT..", ".....tTt..", "....tTt...", "...tTt....", "..tTt.....", ".tTt......", ".Tt.......", "t.t......."], { t: '#866648', T: '#c8a67a' }],
  ttOlho: [["..kkkkk...", ".kwWWWwk..", "kwWgGgWwk.", "kWgGKGgWk.", "kWgGGGgWk.", "kwWgggWwk.", ".kwWWWwk..", "..kkkkk..."], { k: '#4a3a2e', w: '#c8bca0', W: '#f0e8d4', g: '#6a8a6a', G: '#a8d0b0', K: '#0e1210' }]
});
Object.assign(ITEMS, {
  tutano: { name: 'Tutano de Titã', rar: 1, stack: 99, icon: 'ttTutano', desc: 'Um naco do tutano de um titã, ceroso e rosado. Ainda é quente por dentro. A Marta faz elixir com ele.' },
  dente_tita: { name: 'Dente de Titã', rar: 1, stack: 99, icon: 'ttDente', desc: 'Um dente do tamanho de uma mão aberta, de esmalte branco-azulado. O Grimaldo afia lâminas nele.' },
  tendao: { name: 'Tendão Seco', rar: 0, stack: 99, icon: 'ttTendao', desc: 'Um tendão de gigante, seco e duro como couro velho. Os catadores fazem corda com ele, o Grimaldo também.' },
  olho_ciclope: { name: 'Olho de Ciclope', rar: 3, stack: 99, icon: 'ttOlho', desc: 'O único olho de um ciclope jovem, opaco e frio. Ainda segue quem passa perto. A Marta e a Aurélia pagam caro.' }
});

/* ---------- as bases que só caem no Ossário ---------- */
const TT_BASE_LVL = layerLo(ADA_LAYER);
Object.assign(ITEMS, {
  maca_femur: { name: 'Maça de Fêmur', slot: 'weapon', kind: 'mace', rar: 1, stunB: 0.08, pal: { w: '#f0e8d4', W: '#c8bca0', l: '#7e7660', g: '#866648', G: '#4e3824', h: '#3a352a', p: '#e8e0c8' }, desc: 'O fêmur de um nascido dos titãs, a cabeça do osso como clava e o cabo enrolado em tendão. Atordoa mais que as outras.' },
  escudo_omoplata: { name: 'Escudo de Omoplata', slot: 'shield', rar: 1, def: 6, parry: 0.42, pal: { o: '#2a261e', W: '#7e7660', w: '#c8bca0', m: '#e8e0c8', M: '#fffaee' }, desc: 'A omoplata de um hecatônquiro, larga e curva, com a alça de tendão. Defende muito e o aparo é largo.' },
  elmo_cranio: { name: 'Elmo de Crânio de Nascido', slot: 'head', rar: 1, def: 8, hp: 14, art: ["..wwwwwwww..", ".wWWWWWWWWw.", ".WWkkWWkkWW.", ".WWkkWWkkWW.", ".wWWWdWWWWw.", ".wW.tWWt.Ww.", ".w........w."], oy: -1, pal: { w: '#a29880', W: '#e8e0c8', k: '#1a1610', d: '#5a5444', t: '#f4f8fa' }, desc: 'A metade de cima do crânio de uma titânide, as órbitas viradas em viseira. Dá mais vida a quem usa.' }
});
Object.assign(BASE_INFO, { maca_femur: [TT_BASE_LVL, 0.9], escudo_omoplata: [TT_BASE_LVL], elmo_cranio: [TT_BASE_LVL] });
Object.assign(ITEM_G, { maca_femur: 1, escudo_omoplata: 1, elmo_cranio: 0 });
for (const id of ['maca_femur', 'escudo_omoplata', 'elmo_cranio']) ITEMS[id].g = ITEM_G[id];
