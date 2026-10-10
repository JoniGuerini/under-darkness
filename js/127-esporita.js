'use strict';

/* ================= esporita: o metal das Minas Fúngicas (2026-10-10) =================
   Um metal por camada (102): a esporita é o da quinta, as Minas Fúngicas (120-126). Placas de metal verde-azulado
   que o micélio foi deixando coladas na rocha; funde na fornalha como os outros (6 minérios por barra, receita no
   125, que carrega depois da forja). Aqui: o minério e a barra, o metal na forja (METALS, com o próprio nível de
   item: 9, a posição da camada no registro 129) e as 9 peças (as 8 do 05 e o montante do 61).
   Também: os materiais da camada (fio de micélio, pó de mariposa, chapéu-lanterna, perna de grilo) e as três bases
   que só caem lá (Capacete com Lanterna, Botas de Seiva, Gancho de Colheita), nível 11.
   Carrega logo antes do 110-infernita, então a bigorna mostra a esporita antes da infernita, como no mundo. */

const ESP_PAL = ['#0c2a2a', '#34a890', '#c8fce8'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_esporita: { name: 'Minério de Esporita', rar: 2, stack: 99, icon: 'ore', ore: ESP_PAL, desc: 'Placas verde-azuladas que o fungo deixou na rocha. Frias e um pouco úmidas.' },
  barra_esporita: { name: 'Barra de Esporita', rar: 2, stack: 99, icon: 'bar', ore: ESP_PAL, desc: 'Fundida de 6 minérios de esporita. Vai para a bigorna do Grimaldo.' }
});
// a lump of rock with green-blue plates stuck on it, and a bar with a faint sheen along the top
ORE_ICONS.min_esporita = [[
  "...rrrr...",
  "..rRgGrr..",
  ".rgGWgrRr.",
  "rrGgggGrrr",
  "rRrgGgrRgr",
  ".rrrgrrGr.",
  "..rrrrrr..",
  "....rr...."], { r: '#2c3a40', R: '#56686c', g: '#1e7a6a', G: '#34a890', W: '#c8fce8' }];
BAR_ICONS.barra_esporita = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgggGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#6ad4b4', t: '#34a890', g: '#2a8a76', G: '#6ad4b4', W: '#c8fce8', F: '#1e7a6a', m: '#145048', e: '#0e3a34', E: '#0c2a2a', d: '#081c1c' }];

METALS.push({ id: 'esporita', name: 'Esporita', bar: 'barra_esporita', il: layerForgeIl('fungo'),
  wp: { w: '#e4fff4', W: '#6ad4b4', l: '#1e7a6a', g: '#3a3a30', G: '#22221c', h: '#26241c', p: '#34a890' },
  m: '#2a8a76', M: '#a8f0d8', body: { r: '#2a9a82', R: '#1a6a5a', D: '#0e4038', b: '#0a2a26', B: '#a8f0d8' }, s: '#2a9a82', S: '#145048' });
FORGE_ILVL.push(layerForgeIl('fungo'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre o cobalto e a infernita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 38, crit: 0.14 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 25, crit: 0.1 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 58, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 45, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 41, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 7, hp: 18, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 10, hp: 25 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 4, spd: 0.05 }]
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
  fgFio: [["c.....c..", ".c...cC..", "..cCcC...", "...CWc...", "..cCcCc..", ".cC...Cc.", "cC.....cc", "c.......c"], { c: '#a8b2a6', C: '#d8e0d0', W: '#f4f8ec' }],
  fgPo: [["....p....", "..p.Pp.p.", ".pPpWPpP.", "pPWPPPpPp", ".pPPpPPp.", "..ppPpp..", "...p.p..."], { p: '#2a6a5a', P: '#6ad4b4', W: '#e0fff4' }],
  fgChapeu: [["..cCCCCc..", ".cCWCCCCc.", "cCCCCCCCCc", "lLlLlLlLlL", "...tTt....", "...tTt....", "...tTt...."], { c: '#1e6a6e', C: '#3a9a94', W: '#c4f4e6', l: '#7accc0', L: '#c4f4e6', t: '#9a9480', T: '#e6dec4' }],
  fgPerna: [["........k", ".......kK", "......kKk", ".....kKk.", "..kkkKk..", ".kKKKk...", "kKkk.....", "kk......."], { k: '#3a3a26', K: '#8a9a5a' }]
});
Object.assign(ITEMS, {
  fio_micelio: { name: 'Fio de Micélio', rar: 0, stack: 99, icon: 'fgFio', desc: 'Branco e forte como corda. O Grimaldo usa para amarrar cabos.' },
  po_mariposa: { name: 'Pó de Mariposa', rar: 1, stack: 99, icon: 'fgPo', desc: 'Brilha de leve no escuro. A Marta põe nas misturas dela.' },
  chapeu_lanterna: { name: 'Chapéu-Lanterna', rar: 1, stack: 99, icon: 'fgChapeu', desc: 'Um cogumelo que acende sozinho. Dá para comer cozido, dizem.' },
  perna_grilo: { name: 'Perna de Grilo', rar: 1, stack: 99, icon: 'fgPerna', desc: 'Dura e cheia de espinhos. Mola de verdade.' }
});

/* ---------- as bases que só caem nas Minas Fúngicas (nível 11) ---------- */
const FG_BASE_LVL = layerLo('fungo');
Object.assign(ITEMS, {
  capacete_lanterna: { name: 'Capacete com Lanterna', slot: 'head', rar: 1, def: 6, light: 2, art: ["....LL......", "...mWWm.....", "..mMMmmmm...", "..mmmmmmmm..", "..mmmmmmmmm.", "..mm.....m..", "..m........."], oy: -2, pal: { m: '#5a6a5e', M: '#8a9a8a', L: '#3a9a94', W: '#c4f4e6' }, desc: 'Um capacete da colônia com um chapéu-lanterna preso na frente. Ainda acende.' },
  botas_seiva: { name: 'Botas de Seiva', slot: 'feet', rar: 1, def: 4, swimSpd: 1, pal: { s: '#3a6a4a', S: '#1e3a2a' }, desc: 'Couro grosso untado de seiva. Na água, você anda como em terra.' },
  gancho_colheita: { name: 'Gancho de Colheita', slot: 'weapon', kind: 'spear', rar: 1, hook: 1, pal: { w: '#e8f0e0', W: '#a8b2a6', l: '#5a6a5e', g: '#3a2a1a', G: '#22180e', h: '#2a1d12', p: '#74807a' }, desc: 'A vara com gancho que a colônia usava nos cogumelos altos. A estocada puxa o bicho para perto.' }
});
Object.assign(BASE_INFO, { capacete_lanterna: [FG_BASE_LVL], botas_seiva: [FG_BASE_LVL], gancho_colheita: [FG_BASE_LVL, 0.78] });
Object.assign(ITEM_G, { capacete_lanterna: 0, botas_seiva: 3, gancho_colheita: 0 });
for (const id of ['capacete_lanterna', 'botas_seiva', 'gancho_colheita']) ITEMS[id].g = ITEM_G[id];
