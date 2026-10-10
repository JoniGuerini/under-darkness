'use strict';

/* ================= noctírio: o metal da Escuridão (2026-10-10) =================
   Um metal por camada (102): o noctírio é o da Escuridão, o fundo do mundo (220-229). O metal que bebe a luz: preto, com
   a borda prateada que só aparece quando acesa. Veios na pedra-breu e na pedra primeva; funde na fornalha como os outros,
   mas pede 10 minérios por barra (a receita fica no 226, que carrega depois da forja). Aqui: o minério e a barra, o metal
   na forja (METALS, nível de item pela posição da camada no registro 129) e as 9 peças. Também os materiais da camada
   (pó de breu, asa de mariposa negra, núcleo de breu, lume-fátuo: a chama que acende os braseiros, 223) e as três bases
   que só caem lá (Lâmina de Vidro Negro,
   Manto de Breu, Escudo dos Acendedores); o que o manto faz fica no 226 (carrega depois do combate).
   Carrega logo depois do 110-infernita: a bigorna mostra o noctírio depois da infernita. */

const NOCT_PAL = ['#0b0d14', '#2a3246', '#d8e2f4'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_noctirio: { name: 'Minério de Noctírio', rar: 3, stack: 99, icon: 'ore', ore: NOCT_PAL, desc: 'Preto como a pedra em volta. Só a borda prateada denuncia, e só quando a luz bate.' },
  barra_noctirio: { name: 'Barra de Noctírio', rar: 3, stack: 99, icon: 'bar', ore: NOCT_PAL, desc: 'Fundida de 10 minérios de noctírio. A luz da forja some dentro dela.' }
});
// a lump of darkstone with black nuggets and their silver rims; a bar as black as a hole with a bright edge
ORE_ICONS.min_noctirio = [[
  "...rrrr...",
  "..rRnnrr..",
  ".rnSNnrRr.",
  "rrnNNSnrrr",
  "rRrSnNrRnr",
  ".rrrnrrSr.",
  "..rrrrrr..",
  "....rr...."], { r: '#0d0f15', R: '#242936', n: '#0b0d14', N: '#151a26', S: '#b4c2dc' }];
BAR_ICONS.barra_noctirio = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgggGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#7c8aa8', t: '#2a3246', g: '#151a26', G: '#b4c2dc', W: '#d8e2f4', F: '#1e2434', m: '#0b0d14', e: '#080a10', E: '#050608', d: '#030405' }];

METALS.push({ id: 'noctirio', name: 'Noctírio', bar: 'barra_noctirio', il: layerForgeIl('escuro'),
  wp: { w: '#d8e2f4', W: '#2a3246', l: '#0b0d14', g: '#151a26', G: '#0b0d14', h: '#1a1620', p: '#7c8aa8' },
  m: '#1e2434', M: '#7c8aa8', body: { r: '#1e2434', R: '#0e121c', D: '#080a10', b: '#2a3246', B: '#b4c2dc' }, s: '#1e2434', S: '#0b0d14' });
FORGE_ILVL.push(layerForgeIl('escuro'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: um degrau acima da infernita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 45, crit: 0.16 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 30, crit: 0.12 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 68, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 53, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 48, crit: 0.1 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 9, hp: 22, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 13, hp: 33 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 6, spd: 0.065 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  esPo: [["....p....", "...pPp...", "..pPWPp..", ".pPPPPPp.", "pPPpPPPPp", "pppppppPp", ".ddddddd."], { p: '#14141c', P: '#24242e', W: '#4a4a58', d: '#0a0a10' }],
  esAsa: [["a.......a", "aA.....Aa", "aAa...aAa", ".aAa.aAa.", ".aWAoAWa.", "..aAoAa..", "..a.o.a..", "....o...."], { a: '#16141a', A: '#2c2832', W: '#8a8698', o: '#3a3040' }],
  esNucleo: [["...nnn...", "..nNNNn..", ".nNWNNNn.", ".nNNbNNn.", ".nNNNNNn.", "..nNNNn..", "...nnn..."], { n: '#05060a', N: '#121624', W: '#4a5470', b: '#2a3246' }],
  esLume: [["....l....", "...lL....", "...lLl...", "..lLWLl..", "..lLWWLl.", "..lLWWLl.", "...lLLl..", "....ll..."], { l: '#2c4a78', L: '#7aa2dc', W: '#e6f0ff' }]
});
Object.assign(ITEMS, {
  po_breu: { name: 'Pó de Breu', rar: 1, stack: 99, icon: 'esPo', desc: 'O que sobra de uma criatura da sombra quando a luz acaba com ela. A Aurélia quer para as misturas dela.' },
  asa_mariposa: { name: 'Asa de Mariposa Negra', rar: 1, stack: 99, icon: 'esAsa', desc: 'Fina como cinza. Solta um pó que embaça a vista. A Marta sabe o que fazer com isso.' },
  nucleo_breu: { name: 'Núcleo de Breu', rar: 2, stack: 99, icon: 'esNucleo', desc: 'Um caroço de escuridão dura, pesado e frio. O Grimaldo paga muito por um.' },
  lume_fatuo: { name: 'Lume-Fátuo', rar: 2, stack: 99, icon: 'esLume', desc: 'Uma chama azul e fria que flutua sozinha no escuro. Posta num braseiro dos Acendedores, acende com uma luz que nada da Escuridão consegue apagar.' }
});

/* ---------- as bases que só caem na Escuridão ---------- */
const ES_BASE_LVL = layerLo('escuro');
Object.assign(ITEMS, {
  lamina_vidronegro: { name: 'Lâmina de Vidro Negro', slot: 'weapon', kind: 'sword', rar: 1, crit: 0.22, pal: { w: '#a4a8d0', W: '#262438', l: '#08080c', g: '#3a3226', G: '#1e1a14', h: '#1a1620', p: '#6a6890' }, desc: 'Lascada de um veio de vidro negro. Leve e rápida, e corta fundo quando acerta em cheio.' },
  manto_breu: { name: 'Manto de Breu', slot: 'body', rar: 1, def: 12, hp: 20, breu: 0.15, pal: { r: '#14121c', R: '#0a0910', D: '#050408', b: '#1e1a28', B: '#3a3448' }, desc: 'Tecido do escuro da camada. No escuro, quem o veste desvia e aguenta mais.' },
  escudo_acendedor: { name: 'Escudo dos Acendedores', slot: 'shield', rar: 1, def: 8, parry: 0.26, light: 2, pal: { o: '#1a1612', W: '#625640', w: '#9a8a68', m: '#ffb060', M: '#ffe6a8' }, desc: 'Um escudo dos Acendedores com uma lanterna presa na frente. Ainda acende.' }
});
Object.assign(BASE_INFO, { lamina_vidronegro: [ES_BASE_LVL, 1.15], manto_breu: [ES_BASE_LVL], escudo_acendedor: [ES_BASE_LVL] });
Object.assign(ITEM_G, { lamina_vidronegro: 1, manto_breu: 0, escudo_acendedor: 0 });
for (const id of ['lamina_vidronegro', 'manto_breu', 'escudo_acendedor']) ITEMS[id].g = ITEM_G[id];
