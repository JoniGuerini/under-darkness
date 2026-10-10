'use strict';

/* ================= ambrita: o metal da Colmeia (2026-10-10) =================
   Um metal por camada (102): a ambrita é o da nona, a Colmeia (190-199). Mel que endureceu por séculos debaixo da
   resina até virar pedra, cor de mel translúcido com o miolo mais escuro e um brilho dourado fraco; funde na fornalha
   como os outros, mas pede 7 minérios por barra (a receita da fornalha fica no 195, que carrega depois da forja).
   Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129) e as 9
   peças; o peitoral de ambrita dá luz 1 (o mel brilha). Também os materiais da camada (cera bruta, mel escuro, geleia
   real, ferrão, âmbar com fóssil) e as três bases que só caem lá (Lança-Ferrão, Escudo de Favo, Elmo de Âmbar).
   Carrega logo depois do 138-prata, antes do 110-infernita: a bigorna mostra a ambrita antes da infernita. Carrega
   antes do 190, então não usa os ids de bloco da camada (o 191 liga cera_bruta e ambar_fossil aos blocos). */

const AMBRITA_PAL = ['#5a2a06', '#dca032', '#fff0a8'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_ambrita: { name: 'Minério de Ambrita', rar: 2, stack: 99, icon: 'ore', ore: AMBRITA_PAL, desc: 'Mel que virou pedra debaixo da resina. Ainda brilha um pouco no escuro.' },
  barra_ambrita: { name: 'Barra de Ambrita', rar: 2, stack: 99, icon: 'bar', ore: AMBRITA_PAL, desc: 'Fundida de 7 minérios de ambrita. Vai para a bigorna do Grimaldo.' }
});
// gotas facetadas de mel duro presas na resina escura, e uma barra translúcida com o miolo queimado
ORE_ICONS.min_ambrita = [[
  "...rrrr...",
  "..rAaArr..",
  ".rAWaarRr.",
  "rraaDaArrr",
  "rRrAaArAar",
  ".rrrarrWr.",
  "..rrrrrr..",
  "....rr...."], { r: '#2a120a', R: '#5a2a12', a: '#b0761c', A: '#f6c856', D: '#7a4a10', W: '#fff0a8' }];
BAR_ICONS.barra_ambrita = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgDgGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmDmmmEE",
  "mmmDmmmGmmmE.",
  "dddddddddd..."], { T: '#ffe08a', t: '#f6c856', g: '#dca032', G: '#fff0a8', W: '#fffbe0', D: '#8a4808', F: '#c08020', m: '#a0600e', e: '#6a3a08', E: '#4a2006', d: '#2a1204' }];

METALS.push({ id: 'ambrita', name: 'Ambrita', bar: 'barra_ambrita', il: layerForgeIl('colmeia'),
  wp: { w: '#fff0a8', W: '#f6c856', l: '#b0761c', g: '#3a2a12', G: '#22180a', h: '#2a1d10', p: '#dca032' },
  m: '#dca032', M: '#fff0a8', body: { r: '#e0a838', R: '#b0761c', D: '#7a4a10', b: '#4a2a08', B: '#ffe08a' }, s: '#dca032', S: '#8a4808' });
FORGE_ILVL.push(layerForgeIl('colmeia'));
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
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 11, hp: 28, light: 1 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.055 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    if (pc === 'peitoral') o.desc += ' O mel dentro do metal brilha fraco.';
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  cmCera: [["..........", "..cCCCCc..", ".cCWCCCCc.", "cCCCcCCCCc", "cCcCCCCcCc", "cCCCCcCCCc", ".cccccccc.", ".........."], { c: '#6e5022', C: '#b8923e', W: '#ecd27a' }],
  cmMel: [["...gg....", "..gWWg...", "..gMMg...", ".gMMMMg..", "gMWMMMMg.", "gMMMMMDg.", ".gMMMDg..", "..gggg..."], { g: '#5a2a04', M: '#e8981e', W: '#fff4c8', D: '#a05a0a' }],
  cmGeleia: [["...ww....", "..wWWw...", ".wWPPWw..", "wWPPPPWw.", "wPPWPPPw.", "wPPPPPPw.", ".wPPPPw..", "..wwww..."], { w: '#8e5a40', W: '#f4d6a8', P: '#dcae80' }],
  cmFerrao: [["........k", ".......kK", "......kK.", ".....kK..", "..yykK...", ".yYYk....", "yYyy.....", "yy......."], { k: '#16120c', K: '#4a3e2a', y: '#a0600e', Y: '#f0b030' }],
  cmFossil: [["..aAAAa..", ".aAWAAAa.", "aAAkkAAAa", "aAkKkkAAa", "aAAkkAAAa", "aAAAAkAaa", ".aaAAAaa.", "..aaaaa.."], { a: '#b0600e', A: '#f4b03a', W: '#ffd878', k: '#241e14', K: '#4a3e2a' }]
});
Object.assign(ITEMS, {
  cera_bruta: Object.assign(ITEMS.cera_bruta || {}, { name: 'Cera Bruta', rar: 0, stack: 99, icon: 'cmCera', desc: 'Cera velha da colmeia, em camadas. O Grimaldo faz molde de fundição com ela.' }),
  mel_escuro: { name: 'Mel Escuro', rar: 0, stack: 99, icon: 'cmMel', desc: 'Mel quase preto, grosso e amargo. O Odo cozinha com ele e a Marta adoça as poções.' },
  geleia_real: { name: 'Geleia Real', rar: 2, stack: 99, icon: 'cmGeleia', desc: 'O que as larvas reais comem. A Marta faz poção forte com ela; a Aurélia também quer.' },
  ferrao: { name: 'Ferrão', rar: 1, stack: 99, icon: 'cmFerrao', desc: 'Um ferrão do tamanho de um punhal, ainda com veneno na ponta. O Grimaldo compra.' },
  ambar_fossil: { name: 'Âmbar com Fóssil', rar: 3, stack: 99, icon: 'cmFossil', desc: 'Âmbar com um bicho preso desde antes dos anões. Pedra rara: o Grimaldo paga caro.' }
});

/* ---------- as bases que só caem na Colmeia ---------- */
const CM_BASE_LVL = layerLo('colmeia');
Object.assign(ITEMS, {
  lanca_ferrao: { name: 'Lança-Ferrão', slot: 'weapon', kind: 'spear', rar: 1, critB: 0.06, pal: { w: '#f0b030', W: '#a0600e', l: '#3a1e04', g: '#4a3416', G: '#2a1c0c', h: '#2a1d10', p: '#d08a1a' }, desc: 'Um ferrão de zangão preso numa haste de resina. Fura fundo e acha o ponto fraco.' },
  escudo_favo: { name: 'Escudo de Favo', slot: 'shield', rar: 1, def: 3, parry: 0.36, pal: { o: '#3a1e04', W: '#a0600e', w: '#f0b030', m: '#d8b45a', M: '#ffd870' }, desc: 'Uma placa de favo endurecido com resina. Leve, e a janela de aparo é larga.' },
  elmo_ambar: { name: 'Elmo de Âmbar', slot: 'head', rar: 1, def: 6, light: 1, art: ["............", "...mmmmm....", "..mMMWMMm...", ".mMMMkMMMm..", ".mMMMMMMMm..", ".m.......m..", ".m.........."], oy: -1, pal: { m: '#b0600e', M: '#f4b03a', W: '#fff0c0', k: '#241e14' }, desc: 'Âmbar polido em forma de elmo, com um mosquito preso no alto. Brilha fraco no escuro.' }
});
Object.assign(BASE_INFO, { lanca_ferrao: [CM_BASE_LVL, 0.72], escudo_favo: [CM_BASE_LVL], elmo_ambar: [CM_BASE_LVL] });
Object.assign(ITEM_G, { lanca_ferrao: 0, escudo_favo: 0, elmo_ambar: 0 });
for (const id of ['lanca_ferrao', 'escudo_favo', 'elmo_ambar']) ITEMS[id].g = ITEM_G[id];
// a Lança-Ferrão tem crítico a mais (as armas só levam o crítico do tipo, 48)
{ const _bs = baseStats; baseStats = function (s) { const o = _bs(s); const it = s ? ITEMS[s.id] : null; if (it && it.critB) o.crit += it.critB; return o; }; }
