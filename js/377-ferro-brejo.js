'use strict';

/* ================= ferro-do-brejo: o metal do Brejo das Bruxas (docs/camadas/06-brejo-bruxas.md, seção 8) =================
   Um metal por camada (102): o ferro-do-brejo é o da sexta, o Brejo das Bruxas (370-379). O ferro que a água parada
   tira da turfa e junta em crostas e nódulos ferrugentos em volta das poças: o ferro mais velho que se forjou, mole
   e escuro, que as bruxas usavam nos caldeirões e os caçadores nas grilhetas. Funde na fornalha como os outros (6
   minérios por barra, a receita no 375, que carrega depois da forja); o minério também cai dos bichos da camada.
   Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129) e as 9
   peças. Também os materiais da camada (pele de sapo-boi, corda de forca, pena de corvo, erva do brejo, vela preta)
   e as três bases que só caem lá (Fisga do Turfeiro, Chapéu de Caçador, Botas de Atoleiro).
   Carrega com os outros metais, depois da esporita (o metal das Minas, a camada de cima) e antes da prata (a Cidade,
   a de baixo): a bigorna mostra os três na ordem do mundo. Carrega antes do 370, então não usa os ids de bloco. */

const FBJ_PAL = ['#1e0e06', '#8c4e24', '#d8a070'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_ferrobrejo: { name: 'Minério de Ferro-do-Brejo', rar: 2, stack: 99, icon: 'ore', ore: FBJ_PAL, desc: 'Nódulos ferrugentos que a água parada juntou na turfa. Pesados para o tamanho e sempre molhados.' },
  barra_ferrobrejo: { name: 'Barra de Ferro-do-Brejo', rar: 2, stack: 99, icon: 'bar', ore: FBJ_PAL, desc: 'Fundida de 6 minérios de ferro-do-brejo. Escura, um pouco mole, e não enferruja mais do que já enferrujou. Vai para a bigorna do Grimaldo.' }
});
// um torrão de turfa com os nódulos de ferrugem, e uma barra escura com o brilho cor de cobre em cima
ORE_ICONS.min_ferrobrejo = [[
  "...rrrr...",
  "..rRnNrr..",
  ".rnNWnrRr.",
  "rrNnnnNrrr",
  "rRrnNnrRnr",
  ".rrrnrrNr.",
  "..rrrrrr..",
  "....rr...."], { r: '#2a1c10', R: '#4a3420', n: '#6c3818', N: '#a8542a', W: '#d8a070' }];
BAR_ICONS.barra_ferrobrejo = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgggGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#c4885a', t: '#8c4e24', g: '#6c3818', G: '#c4885a', W: '#f0c89a', F: '#4e2610', m: '#3a2010', e: '#2a160a', E: '#1e0e06', d: '#140a04' }];

METALS.push({ id: 'ferrobrejo', name: 'Ferro-do-Brejo', bar: 'barra_ferrobrejo', il: layerForgeIl('brejo'),
  wp: { w: '#f0c89a', W: '#a8542a', l: '#4e2610', g: '#3a2a1c', G: '#1e160c', h: '#2a1d12', p: '#8c4e24' },
  m: '#6c3818', M: '#c4885a', body: { r: '#7a4220', R: '#56301a', D: '#34180a', b: '#1e0e06', B: '#c4885a' }, s: '#6c3818', S: '#34180a' });
FORGE_ILVL.push(layerForgeIl('brejo'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre a esporita (as Minas, em cima) e a prata (a Cidade, embaixo)
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 39, crit: 0.14 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 26, crit: 0.1 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 60, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 46, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 42, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 7, hp: 19, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 10, hp: 26 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 4, spd: 0.052 }]
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
  bjPele: [["..gGGGGg..", ".gGvGGgGg.", "gGGGGvGGGg", "gGvGGGGGvg", "gGGGGGvGGg", ".gGGvGGGg.", "..gggggg..", "........."], { g: '#34421e', G: '#62743a', v: '#947a52' }],
  bjCorda: [["....cC....", "...c..C...", "...C..c...", "....cC....", ".....c....", ".....C....", ".....c....", ".....C...."], { c: '#6a5430', C: '#a28a58' }],
  bjPena: [[".......pP", "......pPp", ".....pPp.", "....pPp..", "...pPp...", "..pPp....", ".pBp.....", "b........"], { p: '#18181e', P: '#464a5a', B: '#32323e', b: '#5c5c5c' }],
  bjErva: [["...g..G...", "..gGg.Gg..", ".g.Gg.gG..", "...gGGg...", "....GG....", "...cCCc...", "....gg....", "....gg...."], { g: '#4a5a2a', G: '#82b478', c: '#6a5430', C: '#a28a58' }],
  bjVela: [["....f.....", "....F.....", "....w.....", "...kKk....", "...kKk....", "...kKk....", "...kKk....", "..kkkkk..."], { f: '#ffd890', F: '#f0a050', w: '#5c5c5c', k: '#101012', K: '#26262a' }]
});
Object.assign(ITEMS, {
  pele_sapo: { name: 'Pele de Sapo-Boi', rar: 1, stack: 99, icon: 'bjPele', desc: 'Um pedaço do couro verrugoso do sapo-boi, escorregadio e frio. A Marta seca e faz unguento com ele.' },
  corda_forca: { name: 'Corda de Forca', rar: 0, stack: 99, icon: 'bjCorda', desc: 'Corda de cânhamo apodrecida, com o nó ainda feito. Dizem que dá sorte. O Grimaldo amarra cabos com ela mesmo assim.' },
  pena_corvo: { name: 'Pena de Corvo', rar: 0, stack: 99, icon: 'bjPena', desc: 'Preta com o reflexo azul. Os corvos do patíbulo largam muitas.' },
  erva_brejo: { name: 'Erva do Brejo', rar: 1, stack: 99, icon: 'bjErva', desc: 'Um maço das ervas que as bruxas penduravam para secar. Cheira a terra molhada e a remédio.' },
  vela_preta: { name: 'Vela Preta', rar: 1, stack: 99, icon: 'bjVela', desc: 'Sebo preto com o pavio de cabelo. Acesa, a chama quase não tremula. A Aurélia compra.' }
});

/* ---------- as bases que só caem no Brejo ---------- */
const BJ_BASE_LVL = layerLo('brejo');
Object.assign(ITEMS, {
  fisga_turfeiro: { name: 'Fisga do Turfeiro', slot: 'weapon', kind: 'spear', rar: 1, bjAgua: 1, pal: { w: '#d8a070', W: '#8c4e24', l: '#4e2610', g: '#3a2a1c', G: '#1e160c', h: '#2a1d12', p: '#6c3818' }, desc: 'A fisga de três dentes dos turfeiros, para sapo e enguia. Com o herói ou o bicho dentro da água, fura 30% mais.' },
  chapeu_cacador: { name: 'Chapéu de Caçador', slot: 'head', rar: 1, def: 6, bjCaca: 1, art: ["............", "....kkkk....", "...kKKKKk...", "...kKKKKk...", ".kkbbbbbbkk.", "kKKKKKKKKKKk", "............"], oy: -2, pal: { k: '#101012', K: '#26262a', b: '#8a6a3a' }, desc: 'O chapéu alto de aba larga dos caçadores de bruxas, com a fivela de latão. Os feitiços das bruxas pegam pela metade em quem usa.' },
  botas_atoleiro: { name: 'Botas de Atoleiro', slot: 'feet', rar: 1, def: 4, swimSpd: 1, bjAtoleiro: 1, pal: { s: '#4a3c26', S: '#2a1d12' }, desc: 'Botas de cano alto untadas de sebo. A lama não prende e na água você anda como em terra.' }
});
Object.assign(BASE_INFO, { fisga_turfeiro: [BJ_BASE_LVL, 0.8], chapeu_cacador: [BJ_BASE_LVL], botas_atoleiro: [BJ_BASE_LVL] });
Object.assign(ITEM_G, { fisga_turfeiro: 1, chapeu_cacador: 0, botas_atoleiro: 3 });
for (const id of ['fisga_turfeiro', 'chapeu_cacador', 'botas_atoleiro']) ITEMS[id].g = ITEM_G[id];
