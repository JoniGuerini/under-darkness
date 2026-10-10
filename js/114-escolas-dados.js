'use strict';

/* ================= escolas de raio e gelo: os dados =================
   Cada escola tem cinco feitiços. O primeiro de cada uma já existia: o Arco Voltaico (raio, js/63-64) e a Nevasca
   (gelo, js/67-68). Aqui ficam os outros quatro de cada escola, no mesmo molde dos de fogo (js/112):
   pergaminho lacrado perg_selado_<k>, pergaminho identificado perg_<k> e o feitiço feitico_<k>.
   Raio:
   - Relâmpago: um raio desce do teto (ou do céu) na mira depois de um instante e atordoa quem ele toca.
   - Lança de Raio: um risco elétrico muito rápido que atravessa todos os inimigos na linha.
   - Passo do Trovão: o herói vira raio e salta até a mira num piscar, ferindo tudo que estiver no caminho.
   - Essência Estática: um pequeno elemental de raio (sem forma de gente, só energia) fica parado no ar onde está a mira
     e pulsa choques em todo inimigo que chegar perto.
   Todo raio pode atordoar por um instante (choque).
   Gelo:
   - Lança de Gelo: uma estaca de gelo voa até o primeiro inimigo e se quebra nele.
   - Nova Congelante: um anel de gelo sai do herói e resfria todo mundo que ele alcança.
   - Estacas de Gelo: uma fileira de espinhos de gelo brota do chão, do herói para a frente.
   - Orbe Glacial: uma bola de gelo anda devagar até a mira, cuspindo lascas para todo lado, e estoura no fim.
   Todo gelo resfria (o inimigo fica lento) e soma para congelar, com as mesmas regras da Nevasca (js/68).
   Bichos de frio levam metade do gelo; bichos de fogo levam 50% a mais.
   Este arquivo só tem os dados e ícones e carrega depois de 112-fogo-dados (a wiki também carrega).
   As regras ficam em js/115-escolas.js (raio e o que é comum) e js/116-gelo.js. */

// cost: mana · cd: segundos entre lançamentos · min/max: dano · reach: até onde a mira alcança a partir do herói
const ESC = {
  // delay: segundos até o raio cair · w: meia largura do raio que fere · stun: segundos atordoado
  relampago: { cost: 10, cd: 1.2, min: 6, max: 10, delay: 0.28, w: 5, stun: 0.6, reach: 200 },
  // spd: velocidade · len: até onde vai
  lanca_raio: { cost: 7, cd: 0.6, min: 3, max: 6, spd: 430, len: 250 },
  // reach: distância máxima do salto · inv: segundos sem levar dano depois do salto
  passo: { cost: 9, cd: 1.4, min: 4, max: 7, reach: 110, inv: 0.3 },
  // dur: segundos no ar · range: até onde o choque alcança · pulse: segundos entre pulsos · n: quantos bichos por pulso
  pararaios: { cost: 14, cd: 2.5, min: 3, max: 5, dur: 7, range: 46, pulse: 0.5, n: 3, reach: 160 },
  // r: raio final do anel · grow: segundos para abrir
  // stacks: quanto soma para congelar (a Nevasca soma 1 por fragmento)
  lanca_gelo: { cost: 6, cd: 0.5, min: 3, max: 5, spd: 260, len: 210, stacks: 2 },
  nova_gelo: { cost: 12, cd: 3, min: 2, max: 4, r: 62, grow: 0.4, stacks: 3 },
  // n: quantos espinhos · gap: distância entre eles · step: segundos entre um e outro · h: altura · life: segundos de pé
  estacas: { cost: 11, cd: 1.6, min: 3, max: 6, n: 8, gap: 11, step: 0.05, h: 15, life: 0.7, stacks: 2 },
  // rate: lascas por segundo · shard: dano de cada lasca · burst: lascas no estouro final
  orbe: { cost: 18, cd: 3.5, min: 1, max: 2, spd: 62, dur: 2.4, rate: 14, sspd: 150, slife: 0.6, burst: 14, reach: 200, stacks: 1 },
  shock: { chance: 0.3, stun: 0.4 },
  weakSame: 0.5, weakOpp: 1.5
};
// [chave, elemento, nome, artigo do pergaminho, descrição]
const ESC_LIST = [
  ['relampago', 'raio', 'Relâmpago', 'do', 'Um raio desce do alto na mira depois de um instante. Quem ele toca fica atordoado.'],
  ['lanca_raio', 'raio', 'Lança de Raio', 'da', 'Um risco elétrico muito rápido que atravessa todos os inimigos na linha.'],
  ['passo', 'raio', 'Passo do Trovão', 'do', 'O herói vira raio e salta até a mira num piscar, ferindo tudo que estiver no caminho. Não atravessa parede.'],
  ['pararaios', 'raio', 'Essência Estática', 'da', 'Um pequeno elemental de raio fica parado no ar onde está a mira e pulsa choques em todo inimigo que chegar perto.'],
  ['lanca_gelo', 'gelo', 'Lança de Gelo', 'da', 'Uma estaca de gelo voa até o primeiro inimigo e se quebra nele.'],
  ['nova_gelo', 'gelo', 'Nova Congelante', 'da', 'Um anel de gelo sai do herói e deixa lento todo mundo que ele alcança.'],
  ['estacas', 'gelo', 'Estacas de Gelo', 'das', 'Uma fileira de espinhos de gelo brota do chão, do herói para a frente.'],
  ['orbe', 'gelo', 'Orbe Glacial', 'do', 'Uma bola de gelo anda devagar até a mira cuspindo lascas para todo lado e estoura no fim.']
];
// a ordem completa de cada escola, com o primeiro feitiço que já existia
const ESC_SCHOOL = {
  raio: ['feitico_arco', 'feitico_relampago', 'feitico_lanca_raio', 'feitico_passo', 'feitico_pararaios'],
  gelo: ['feitico_nevasca', 'feitico_lanca_gelo', 'feitico_nova_gelo', 'feitico_estacas', 'feitico_orbe']
};
const ESC_SEAL = {}, ESC_SCROLL = {}, ESC_SPELL = {}, ESC_ELEM = {};
for (const [k, elem, name, art, desc] of ESC_LIST) {
  const sealed = 'perg_selado_' + k, scroll = 'perg_' + k, spell = 'feitico_' + k;
  ESC_SEAL[sealed] = k; ESC_SCROLL[scroll] = k; ESC_SPELL[spell] = k; ESC_ELEM[k] = elem;
  ITEMS[sealed] = { name: 'Pergaminho Não Identificado', rar: 0, scroll: 1, icon: sealed, desc: elem === 'raio' ? 'Um rolo lacrado com cera azul. Arrepia os pelos do braço de quem segura.' : 'Um rolo lacrado com cera clara. Está gelado e úmido de geada.' };
  ITEMS[scroll] = { name: `Pergaminho ${art} ${name}`, rar: 2, scroll: 2, icon: scroll, elem, desc: elem === 'raio' ? 'As runas estalam e soltam faíscas. Lido em voz alta, ensina o feitiço e se desfaz.' : 'As runas estão cobertas de geada. Lido em voz alta, ensina o feitiço e derrete.' };
  ITEMS[spell] = { name, rar: 2, spell: true, icon: spell, elem, desc };
}
const escKey = id => ESC_SEAL[id] || ESC_SCROLL[id] || ESC_SPELL[id] || null;
function escTipLines(k) {
  const S = ESC[k], n = v => String(v).replace('.', ','), L = [['Mana', S.cost], ['Dano', `${S.min} – ${S.max}`]];
  if (k === 'lanca_raio') L.push(['Atravessa', 'todos na linha']);
  if (k === 'passo') L.push(['Salto', 'até ' + Math.round(S.reach / T) + ' blocos']);
  if (k === 'pararaios') L.push(['Dura', n(S.dur) + ' s'], ['Pulso a cada', n(S.pulse) + ' s'], ['Alcance', Math.round(S.range / T) + ' blocos']);
  if (k === 'relampago') L.push(['Atordoa', n(S.stun) + ' s']);
  if (k === 'nova_gelo') L.push(['Área', 'anel em volta']);
  if (k === 'estacas') L.push(['Espinhos', S.n]);
  if (k === 'orbe') L.push(['Dura', n(S.dur) + ' s'], ['Lascas', S.rate + ' por segundo']);
  L.push(ESC_ELEM[k] === 'raio' ? ['Choque', Math.round(ESC.shock.chance * 100) + '% de atordoar'] : ['Frio', 'deixa lento e congela']);
  L.push(['Recarga', n(S.cd) + ' s']);
  return L;
}

/* ---- ícones: o rolo com runas da escola; o feitiço num disco de pedra ---- */
const ESC_PAL = {
  raio: { roll: '#c9b48a', sheet: '#d8cfb0', ink: '#7a7464', rune: '#5aa8ff', wax: '#2f6fe0', ribbon: '#1a2a5a', stone: '#141c34' },
  gelo: { roll: '#c4bca8', sheet: '#dcdcd0', ink: '#6a7480', rune: '#8fd8f8', wax: '#bfe8ff', ribbon: '#2a4a6a', stone: '#162a3e' }
};
const ESC_SYM_COL = {
  raio: { W: '#ffffff', Y: '#bfe6ff', O: '#5aa8ff', R: '#2f5fd0', K: '#3a3a4a' },
  gelo: { W: '#ffffff', Y: '#d8f4ff', O: '#8fd0f0', R: '#3a7ab0', K: '#3a3a4a' }
};
// W branco · Y claro · O meio · R escuro · K pedra
const ESC_SYM = {
  relampago: [".............", "...RRRRRR....", "..ROOOOOOR...", "...RRYRRR....", ".....YW......", "....YW.......", "...YWWWY.....", ".....WY......", "....WY.......", "...YW........", "..YWO........", "..O..........", "............."],
  lanca_raio: ["...........YW", "..........YWY", ".........YWY.", "........YWY..", ".......OWY...", "......OYO....", ".....OYO.....", "....RYO......", "...RO.R......", "..RO.........", ".RO..........", "R............", "............."],
  passo: [".............", "......YW.....", ".....YWY.....", "....RYWO.....", "...RO.YW...W.", "..R...WWWWWWY", ".R....YWWWWO.", "......WY...Y.", ".....YW......", "....YWO......", "...RWO.......", "..RO.........", "............."],
  pararaios: [".............", "...Y.....O...", "....O...Y....", "..R..OYO..R..", "...ROYWYOR...", "Y..OYWWWYO..Y", ".OYWWWWWWWYO.", "Y..OYWWWYO..Y", "...ROYWYOR...", "..R..OYO..R..", "....Y...O....", "...O.....Y...", "............."],
  lanca_gelo: ["............W", "..........WY.", ".........WYO.", "........WYO..", ".......WYO...", "......YYO....", ".....YOR.....", "....OOR......", "...OR........", "..R..........", ".............", ".............", "............."],
  nova_gelo: [".............", "....OYWYO....", "..YO.....OY..", ".Y.........Y.", ".O...R.R...O.", "W....RWR....W", "Y...RWWWR...Y", "W....RWR....W", ".O...R.R...O.", ".Y.........Y.", "..YO.....OY..", "....OYWYO....", "............."],
  estacas: [".............", ".............", "......W......", ".....WY......", "..W..YO...W..", "..Y..YO..WY..", ".WY.YOO..YO..", ".YO.YOOR.YO.W", "YOO.OOORYOO.Y", "YOOROOORYOORO", "KKKKKKKKKKKKK", ".............", "............."],
  orbe: [".............", "..W.......W..", "...Y.....Y...", "....RRRRR....", "...ROOYOOR...", "..ROYWWWYOR..", "..ROYWWWYOR..", "..ROYWWWYOR..", "...ROOYOOR...", "....RRRRR....", "...Y.....Y...", "..W.......W..", "............."]
};
function escPaintRows(rows, pal, seed) {
  const c = mk(13, 13), x = c.getContext('2d');
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const m = SCROLL_MAT[rows[j][i]]; if (!m) continue;
    let v = m[1]; const g = hash2(i, j, seed);
    if (m[0] === 'sheet' || m[0] === 'roll') v += g < 0.16 ? -1 : g > 0.9 ? 1 : 0;
    x.fillStyle = heroRamp(pal[m[0]])[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
function escPaintSpell(k) {
  const elem = ESC_ELEM[k], c = mk(13, 13), x = c.getContext('2d'), st = heroRamp(ESC_PAL[elem].stone), S = ESC_SYM[k], C = ESC_SYM_COL[elem];
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const d = Math.hypot(i - 6, j - 6); if (d > 6.4) continue;
    const g = hash2(i, j, 114);
    let v = d > 5.3 ? (j < 6 ? 4 : 2) : (i + j < 11 ? 2 : 1);
    if (g < 0.14) v -= 1; else if (g > 0.9) v += 1;
    x.fillStyle = st[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) { const ch = S[j][i]; if (ch === '.' || Math.hypot(i - 6, j - 6) > 6.4) continue; x.fillStyle = C[ch]; x.fillRect(i, j, 1, 1); }
  return c;
}
{
  const _makeIcon = makeIcon;
  makeIcon = function (id) {
    const k = escKey(id); if (!k) return _makeIcon(id);
    const pal = ESC_PAL[ESC_ELEM[k]];
    const src = ESC_SPELL[id] ? escPaintSpell(k) : escPaintRows(ESC_SCROLL[id] ? SCROLL_ID_ROWS : SCROLL_ROWS, pal, ESC_SCROLL[id] ? 61 : 59);
    const o = outlined(src); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}
