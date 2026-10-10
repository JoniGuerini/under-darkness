'use strict';

/* ================= platina: o metal da Floresta Petrificada (2026-10-10) =================
   Um metal por camada (102): a platina é o da sétima, a Floresta Petrificada (140-149). Veios branco-acinzentados de
   brilho frio no granito verde e na raiz de pedra, mais grossos nas Raízes Profundas e na Clareira dos Gigantes; funde
   na fornalha como os outros (6 minérios por barra, receita no 145, que carrega depois da forja). Aqui: o minério e a
   barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129) e as 9 peças. Também os
   materiais da camada (casca petrificada, folha de cristal, seiva vítrea, olho de prisma) e as três bases que só caem
   lá (Lança de Raiz Petrificada, Escudo de Casca de Pedra, Manto de Folhas de Cristal), com o que cada uma faz.
   Carrega logo depois do 138-prata, antes do 110-infernita: a bigorna mostra a platina antes da infernita. */

const PLATINA_PAL = ['#3a3c44', '#b4b8c0', '#f0f0ec'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_platina: { name: 'Minério de Platina', rar: 2, stack: 99, icon: 'ore', ore: PLATINA_PAL, desc: 'Platina presa no granito verde, fria ao toque. Só existe daqui para baixo.' },
  barra_platina: { name: 'Barra de Platina', rar: 2, stack: 99, icon: 'bar', ore: PLATINA_PAL, desc: 'Fundida de 6 minérios de platina. Vai para a bigorna do Grimaldo.' }
});
// a lump of green granite with pale platinum grains, and a bar with a cold bright edge
ORE_ICONS.min_platina = [[
  "...rrrr...",
  "..rRsSrr..",
  ".rsSWsrRr.",
  "rrSsssSrrr",
  "rRrsSsrRsr",
  ".rrrsrrSr.",
  "..rrrrrr..",
  "....rr...."], { r: '#2c3a32', R: '#566a5a', s: '#8a8e98', S: '#d6d8dc', W: '#f0f0ec' }];
BAR_ICONS.barra_platina = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgggGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#d6d8dc', t: '#b4b8c0', g: '#9a9ea8', G: '#d6d8dc', W: '#f0f0ec', F: '#8a8e98', m: '#5e626c', e: '#4a4c54', E: '#3a3c44', d: '#22242a' }];

METALS.push({ id: 'platina', name: 'Platina', bar: 'barra_platina', il: layerForgeIl('floresta'),
  wp: { w: '#f0f0ec', W: '#d6d8dc', l: '#8a8e98', g: '#2c3a32', G: '#1c2420', h: '#22201a', p: '#b4b8c0' },
  m: '#9a9ea8', M: '#f0f0ec', body: { r: '#b4b8c0', R: '#8a8e98', D: '#5e626c', b: '#3a3c44', B: '#f0f0ec' }, s: '#9a9ea8', S: '#5e626c' });
FORGE_ILVL.push(layerForgeIl('floresta'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre a prata e a infernita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 41, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 27, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 62, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 48, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 44, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 7, hp: 20, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 11, hp: 28 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 4, spd: 0.058 }]
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
  fpCasca: [["..cCCc...", ".cCcCCc..", "cCcCcCCc.", "cCcCcCcC.", "cCcCcCcCc", ".cCcCcCc.", "..cccccc.", "...dddd.."], { c: '#54463a', C: '#8c7a66', d: '#221c18' }],
  fpFolha: [["....fF...", "...fFWF..", "..fFFFFf.", ".fFFWFFf.", ".fFFFFf..", "..fFFf...", "..sf.....", ".s......."], { f: '#2f7e8a', F: '#8ad8cc', W: '#d4f4ec', s: '#3e5044' }],
  fpSeiva: [["...ss....", "..sSSs...", ".sSWSSs..", ".sSSSSs..", "sSSSSSSs.", "sSSWSSSs.", ".sSSSSs..", "..ssss..."], { s: '#6e7c22', S: '#c4cc6a', W: '#e6ecac' }],
  fpOlho: [["...ppp...", "..pPPPp..", ".pPWWPPp.", ".pPWkPPp.", ".pPPPPPp.", "..pPPPp..", "...ppp..."], { p: '#1f5260', P: '#4fb0b0', W: '#d4f4ec', k: '#16303a' }]
});
Object.assign(ITEMS, {
  casca_petrea: { name: 'Casca Petrificada', rar: 0, stack: 99, icon: 'fpCasca', desc: 'Uma lasca de casca de árvore que virou pedra, com os sulcos ainda no lugar. O Grimaldo usa nos cabos.' },
  folha_cristal: { name: 'Folha de Cristal', rar: 1, stack: 99, icon: 'fpFolha', desc: 'Uma folha inteira de cristal, fina como vidro. A alquimista paga bem.' },
  seiva_vitrea: { name: 'Seiva Vítrea', rar: 1, stack: 99, icon: 'fpSeiva', desc: 'Seiva que virou vidro verde sem endurecer de todo. A Marta faz unguento com ela.' },
  olho_prisma: { name: 'Olho de Prisma', rar: 2, stack: 99, icon: 'fpOlho', desc: 'O cristal que guiava o raio do prisma. Ainda separa a luz em cores. A Aurélia quer.' }
});

/* ---------- as bases que só caem na Floresta Petrificada (nível 15) ---------- */
const FP_BASE_LVL = layerLo('floresta');
Object.assign(ITEMS, {
  lanca_raiz: { name: 'Lança de Raiz Petrificada', slot: 'weapon', kind: 'spear', rar: 1, alcance: 12, pal: { w: '#98aa9a', W: '#74887a', l: '#3e5044', g: '#4c3e2e', G: '#33291f', h: '#33291f', p: '#665440' }, desc: 'Uma raiz reta que virou pedra, com a ponta lascada em gume. Alcança mais longe que as outras lanças.' },
  escudo_casca: { name: 'Escudo de Casca de Pedra', slot: 'shield', rar: 1, def: 6, parry: 0.17, pal: { o: '#221c18', W: '#54463a', w: '#8c7a66', m: '#74887a', M: '#98aa9a' }, desc: 'Uma placa de casca de pedra presa em correias. Aguenta pancada, mas é pesada para aparar.' },
  manto_folhas: { name: 'Manto de Folhas de Cristal', slot: 'body', rar: 1, def: 7, hp: 14, light: 1, pal: { r: '#2f7e8a', R: '#1f5260', D: '#16303a', b: '#3e5044', B: '#8ad8cc' }, desc: 'Folhas de cristal costuradas umas sobre as outras. Leve, e brilha fraco no escuro.' }
});
Object.assign(BASE_INFO, { lanca_raiz: [FP_BASE_LVL, 1.05], escudo_casca: [FP_BASE_LVL], manto_folhas: [FP_BASE_LVL] });
Object.assign(ITEM_G, { lanca_raiz: 1, escudo_casca: 0, manto_folhas: 0 });
for (const id of ['lanca_raiz', 'escudo_casca', 'manto_folhas']) ITEMS[id].g = ITEM_G[id];

// o que a Lança de Raiz (alcance) faz fica no 148, que carrega depois do combate
