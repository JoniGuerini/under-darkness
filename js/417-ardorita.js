'use strict';

/* ================= ardorita: o metal das Ruínas dos Acendedores =================
   Um metal por camada (102): a ardorita é o das Ruínas dos Acendedores (410-419), entre o Abismo e a Escuridão. O metal
   que guarda o calor: vermelho-cobre por fora, com o miolo que ainda brilha como brasa. Os veios nascem sempre junto
   da rocha de brasa (415); funde na fornalha como os outros e pede 10 minérios por barra (a receita fica no 415, que
   carrega depois da forja). Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição da camada no
   registro 129) e as 9 peças; os materiais da camada (cera de círio, brasa viva, pavio eterno) e as três bases que só
   caem lá (o Atiçador, o Capuz de Cinza, as Botas de Brasa).
   Carrega logo depois do 110-infernita e antes do 228-noctirio: a bigorna mostra a ardorita entre os dois. */

const ARD_PAL = ['#2a0c06', '#a4421c', '#ffc070'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_ardorita: { name: 'Minério de Ardorita', rar: 3, stack: 99, icon: 'ore', ore: ARD_PAL, desc: 'Pepitas cor de cobre presas na rocha de brasa. Mesmo arrancadas, ficam mornas na mão.' },
  barra_ardorita: { name: 'Barra de Ardorita', rar: 3, stack: 99, icon: 'bar', ore: ARD_PAL, desc: 'Fundida de 10 minérios de ardorita. Esfria por fora, mas o miolo nunca apaga de todo.' }
});
// o torrão de rocha preta com as pepitas de cobre, o brilho de brasa no meio; a barra de cobre com o miolo aceso
ORE_ICONS.min_ardorita = [[
  "...rrrr...",
  "..rRnnrr..",
  ".rnSNnrRr.",
  "rrnNYSnrrr",
  "rRrSnNrRnr",
  ".rrrnrrSr.",
  "..rrrrrr..",
  "....rr...."], { r: '#1a1614', R: '#3c332c', n: '#6e2a10', N: '#a4421c', S: '#ffc070', Y: '#fff0c0' }];
BAR_ICONS.barra_ardorita = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgYgGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#e8925a', t: '#a4421c', g: '#c86a34', G: '#ffc070', W: '#fff0c0', Y: '#ffe6a8', F: '#8a3416', m: '#6e2a10', e: '#4a1a0a', E: '#2a0c06', d: '#1a0804' }];

METALS.push({ id: 'ardorita', name: 'Ardorita', bar: 'barra_ardorita', il: layerForgeIl('acendedores'),
  wp: { w: '#ffe6a8', W: '#c86a34', l: '#4a1a0a', g: '#3c2014', G: '#1e100a', h: '#2a1810', p: '#e8925a' },
  m: '#a4421c', M: '#e8925a', body: { r: '#a4421c', R: '#6e2a10', D: '#2a0c06', b: '#c86a34', B: '#ffc070' }, s: '#8a3416', S: '#4a1a0a' });
FORGE_ILVL.push(layerForgeIl('acendedores'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre a infernita e o noctírio
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 44, crit: 0.155 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 29, crit: 0.115 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 66, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 52, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 47, crit: 0.095 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 9, hp: 21, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 12, hp: 32 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 6, spd: 0.06 }]
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
  acCera: [["...cc....", "..cCCc...", "..cWCc...", ".cCCCCc..", ".cCCCCcc.", "cCCCCCCCc", "ccCCcCCcc", ".ddddddd."], { c: '#a8905e', C: '#e8d6a6', W: '#fbf0d0', d: '#7a6440' }],
  acBrasa: [["...bbb...", "..bBBBb..", ".bBYWYBb.", ".bBYYYBb.", ".bBBYBBb.", "..bBBBb..", "...bbb..."], { b: '#6e1e06', B: '#d86214', Y: '#f6962a', W: '#fff0c0' }],
  acPavio: [["....f....", "...fF....", "...fWf...", "....w....", "....w....", "...ww....", "..ww.....", ".ww......"], { f: '#d86214', F: '#ffd070', W: '#fff6e0', w: '#e8d6a6' }]
});
Object.assign(ITEMS, {
  cera_acendedor: { name: 'Cera de Círio', rar: 0, stack: 99, icon: 'acCera', desc: 'Cera grossa e amarelada dos círios dos Acendedores. Ainda cheira a reza. A Marta derrete para os unguentos.' },
  brasa_viva: { name: 'Brasa Viva', rar: 1, stack: 99, icon: 'acBrasa', desc: 'Uma brasa que não apaga, tirada de um braseiro dos Acendedores. Queima a mão de quem segura sem luva.' },
  pavio_eterno: { name: 'Pavio Eterno', rar: 2, stack: 99, icon: 'acPavio', desc: 'Um pavio trançado pelos Acendedores que acende sem gastar. O Grimaldo usa na têmpera.' }
});

/* ---------- as bases que só caem nas Ruínas ---------- */
const AC_BASE_LVL = layerLo('acendedores');
Object.assign(ITEMS, {
  aticador: { name: 'Atiçador dos Acendedores', slot: 'weapon', kind: 'mace', rar: 1, crit: 0.08, pal: { w: '#ffc070', W: '#a4421c', l: '#2a0c06', g: '#3c332c', G: '#1a1614', h: '#2a2420', p: '#e8925a' }, desc: 'O ferro de atiçar dos braseiros da cidade, com a ponta que nunca esfriou. Bate pesado e acerta onde dói.' },
  capuz_cinza: { name: 'Capuz de Cinza', slot: 'head', rar: 1, def: 6, hp: 18, light: 1, art: ["...mmmmmm...", "..mMMMMMMm..", ".mMMMMMMMMm.", ".mMkkkkkkMm.", ".mMkbkkbkMm.", ".mmMkkkkMmm.", "..m......m.."], oy: -1, pal: { m: '#2a2420', M: '#524438', k: '#120e0c', b: '#ffb050' }, desc: 'O capuz de um Acendedor, duro de fuligem. Os olhos de quem o veste brilham um pouco no escuro.' },
  botas_brasa: { name: 'Botas de Brasa', slot: 'feet', rar: 1, def: 4, spd: 0.07, pal: { s: '#6e2a10', S: '#3a1a10' }, desc: 'As botas dos carregadores da Fornalha, com sola de ardorita. Quentes, e leves para correr no ferro em brasa.' }
});
Object.assign(BASE_INFO, { aticador: [AC_BASE_LVL, 0.95], capuz_cinza: [AC_BASE_LVL], botas_brasa: [AC_BASE_LVL] });
Object.assign(ITEM_G, { aticador: 0, capuz_cinza: 0, botas_brasa: 3 });
for (const id of ['aticador', 'capuz_cinza', 'botas_brasa']) ITEMS[id].g = ITEM_G[id];
