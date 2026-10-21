'use strict';

/* ================= sepulcrita: o metal da Necrópole do Rei Eterno (2026-10-21) =================
   Um metal por camada (102): a sepulcrita é o da Necrópole (380-389). Cresce onde muitos mortos repousam: o ferro dos
   cravos dos caixões e das armaduras enterradas, passado por séculos de alma presa, vira nódulos cinza-prata com um
   lustro verde-pálido. Sempre perto de uma cova, de um mausoléu, de um ossuário ou de um salão da legião (385). Pede 8
   minérios por barra (a regra do 00-geral).
   A receita da fornalha, os preços e as lojas ficam no 385, que carrega depois da forja e do vilarejo. Aqui: o minério e
   a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129) e as 9 peças. Também os
   materiais da camada (cravo de caixão, cinza de alma, unguento de embalsamar, tinta da sentença, pano de mortalha) e as
   três bases que só caem lá (Alabarda da Legião, Escudo de Tampa de Sarcófago, Capuz do Necromante).
   Carrega com os outros metais (depois da adamantita, antes da infernita): a bigorna mostra a sepulcrita entre o metal
   da camada de cima e a infernita. Carrega antes do 380, então não usa os ids de bloco (o 381 liga o bloco). */

const SEPULCRITA_PAL = ['#18222a', '#64807e', '#eafff4'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_sepulcrita: { name: 'Minério de Sepulcrita', rar: 3, stack: 99, icon: 'ore', ore: SEPULCRITA_PAL, desc: 'Nódulos frios de cinza-prata, com um lustro verde que não vem de luz nenhuma. Crescem perto dos mortos.' },
  barra_sepulcrita: { name: 'Barra de Sepulcrita', rar: 3, stack: 99, icon: 'bar', ore: SEPULCRITA_PAL, desc: 'Fundida de 8 minérios de sepulcrita. Pesa como chumbo e nunca esquenta, nem na forja. Vai para a bigorna do Grimaldo.' }
});
// três nódulos achatados na rocha, e uma barra fosca com o lustro verde
ORE_ICONS.min_sepulcrita = [[
  "..........",
  "..nNW.....",
  ".nNNNn.nW.",
  ".rnnnr.NNn",
  "rRrnrRrnnr",
  ".rrRrrRrr.",
  "..rrrrrr..",
  "....rr...."], { r: '#1d1f24', R: '#3a3e46', n: '#42585e', N: '#64807e', W: '#eafff4' }];
BAR_ICONS.barra_sepulcrita = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgggGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#d8f0e6', t: '#a2c8bc', g: '#64807e', G: '#b8f0d0', W: '#ffffff', F: '#4a6262', m: '#2a3a42', e: '#18222a', E: '#0c1014', d: '#080a0c' }];

const SEP_LAYER = 'necropole';
METALS.push({ id: 'sepulcrita', name: 'Sepulcrita', bar: 'barra_sepulcrita', il: layerForgeIl(SEP_LAYER),
  wp: { w: '#d8f0e6', W: '#64807e', l: '#2a3a42', g: '#3a3226', G: '#1e1a14', h: '#18222a', p: '#b8f0d0' },
  m: '#64807e', M: '#d8f0e6', body: { r: '#64807e', R: '#4a6262', D: '#2a3a42', b: '#0c1014', B: '#b8f0d0' }, s: '#64807e', S: '#2a3a42' });
FORGE_ILVL.push(layerForgeIl(SEP_LAYER));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: um pouco acima da adamantita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 44, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 30, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 67, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 53, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 47, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 9, hp: 22, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 12, hp: 32 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.06 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    if (pc === 'peitoral' || pc === 'elmo') o.desc += ' Frio ao toque, mesmo no sol.';
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  ncCravo: [[".kKKk.....", ".kKKk.....", "..kk......", "..kk......", "..kk......", "..kr......", "..rr......", "...r......"], { k: '#363a42', K: '#8e95a0', r: '#6a3e20' }],
  ncCinza: [["..........", "...aAa....", "..aAWAa...", ".aAAAAAa..", "gggggggg..", ".gGgggGg..", "..gggggg..", ".........."], { a: '#4a8a6a', A: '#b8f0d0', W: '#ffffff', g: '#3a3632', G: '#5e5850' }],
  ncUnguento: [["...cc.....", "..cCCc....", "..bbbb....", ".bBGgbb...", ".bGggbb...", ".bbggbb...", ".bbbbbb...", "..bbbb...."], { c: '#7c725e', C: '#bcb298', b: '#4c2e1c', B: '#825434', g: '#88a858', G: '#c8e8a0' }],
  ncTinta: [["......q...", ".....qQ...", "....qQ....", "..ttQt....", ".tTTTTt...", ".tTwTTt...", ".tTTTTt...", "..tttt...."], { t: '#141a16', T: '#2a3a34', w: '#b8f0d0', q: '#c4ba98', Q: '#e4dcc0' }],
  ncPano: [[".wWWWWw...", ".wWwWWw...", ".wWWWwW...", ".wwWWWw...", "..wWWww...", "..wWwW....", "..w.wW....", "....w....."], { w: '#7c725e', W: '#bcb298' }]
});
Object.assign(ITEMS, {
  cravo_caixao: { name: 'Cravo de Caixão', rar: 0, stack: 99, icon: 'ncCravo', desc: 'Um cravo comprido de ferro, torto de tanto pregar tampas. O Grimaldo derrete e aproveita.' },
  cinza_alma: { name: 'Cinza de Alma', rar: 2, stack: 99, icon: 'ncCinza', desc: 'Um punhado de cinza fria que ainda acende verde quando se sopra. A Marta e a Aurélia pagam bem.' },
  unguento: { name: 'Unguento de Embalsamar', rar: 1, stack: 99, icon: 'ncUnguento', desc: 'Resina, mirra e alguma coisa que não se pergunta. Gruda em tudo. A Marta faz emplastro com ele.' },
  tinta_sentenca: { name: 'Tinta da Sentença', rar: 2, stack: 99, icon: 'ncTinta', desc: 'A tinta com que os escribas do rei escrevem quem vai morrer. A Aurélia guarda num vidro fechado.' },
  mortalha_pano: { name: 'Pano de Mortalha', rar: 0, stack: 99, icon: 'ncPano', desc: 'Linho velho, amarelado, que já embrulhou alguém. Ainda é bom pano.' }
});

/* ---------- as bases que só caem na Necrópole ---------- */
const NC_BASE_LVL = layerLo(SEP_LAYER);
Object.assign(ITEMS, {
  alabarda_legiao: { name: 'Alabarda da Legião', slot: 'weapon', kind: 'spear', rar: 1, crit: 0.1, pal: { w: '#b8f0d0', W: '#9aa0aa', l: '#4e535c', g: '#664a2a', G: '#382614', h: '#22252a', p: '#d8f0e6' }, desc: 'A lança comprida da legião do rei, com a lâmina de machado e o gancho. O alcance é o da lança, o golpe é mais pesado.' },
  escudo_tampa: { name: 'Escudo de Tampa de Sarcófago', slot: 'shield', rar: 1, def: 7, parry: 0.36, pal: { o: '#24242b', W: '#747476', w: '#bab8b2', m: '#dcdad2', M: '#f4f2ea' }, desc: 'A tampa de pedra de um sarcófago pequeno, com a efígie gasta e as alças de ferro. Pesada, mas nada passa.' },
  capuz_necromante: { name: 'Capuz do Necromante', slot: 'head', rar: 1, def: 5, hp: 10, regen: 1, art: HOOD, oy: 0, pal: { c: '#1e1a26', C: '#3a5a48' }, desc: 'O capuz fundo dos que mantêm as lanternas de alma. Por dentro ainda cheira a cera e cinza. Quem usa fecha as feridas devagar, como os que não morrem.' }
});
Object.assign(BASE_INFO, { alabarda_legiao: [NC_BASE_LVL, 1.05], escudo_tampa: [NC_BASE_LVL], capuz_necromante: [NC_BASE_LVL] });
Object.assign(ITEM_G, { alabarda_legiao: 1, escudo_tampa: 0, capuz_necromante: 0 });
for (const id of ['alabarda_legiao', 'escudo_tampa', 'capuz_necromante']) ITEMS[id].g = ITEM_G[id];
