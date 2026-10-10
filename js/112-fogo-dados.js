'use strict';

/* ================= elementos dos feitiços e os cinco feitiços de fogo: os dados =================
   Cada feitiço tem um elemento (ITEMS[id].elem): raio, fogo ou gelo. O Arco Voltaico é de raio, a Nevasca é de gelo
   e a Forma de Morcego não tem elemento. O elemento aparece na dica e decide como o feitiço fere (js/113-fogo.js).
   Fogo, o primeiro arquétipo completo, com cinco feitiços bem diferentes entre si:
   - Bola de Fogo: uma bola que voa até a mira e explode em área.
   - Inferno: segure o botão e o herói sopra um cone de chamas para a frente, gastando mana enquanto sopra.
   - Parede de Fogo: uma fileira de chamas no chão onde está o mouse; quem passa por ela queima.
   - Meteoro: uma pedra em brasa cai do céu na mira depois de um instante, explode forte e deixa o chão em chamas.
   - Hidra: uma serpente de fogo brota do chão e cospe bolas de fogo sozinha no inimigo mais perto (até 2 ao mesmo tempo).
   Todo fogo põe o alvo para queimar (dano a cada meio segundo). Bichos de fogo levam metade e não queimam;
   bichos de frio levam 50% a mais.
   Herói novo já começa com os cinco feitiços aprendidos (pedido do Jonathan). Os pergaminhos continuam existindo: botão direito identifica, botão direito
   de novo aprende. A Aurélia (js/91-maga.js) também vende os cinco já identificados.
   Este arquivo só tem os dados (elementos, números, itens e ícones) e carrega depois de 90-armas-magicas, para a wiki
   ver também. As regras com o jogo rodando ficam em js/113-fogo.js. */

const SPELL_ELEM = {
  raio: { name: 'Raio', col: '#8fd0ff' },
  fogo: { name: 'Fogo', col: '#ff9a3c' },
  gelo: { name: 'Gelo', col: '#a8dcf4' }
};
for (const id of ['perg_arco', 'feitico_arco']) if (ITEMS[id]) ITEMS[id].elem = 'raio';
for (const id of ['perg_nevasca', 'feitico_nevasca']) if (ITEMS[id]) ITEMS[id].elem = 'gelo';

// cost: mana · cd: segundos entre lançamentos · min/max: dano · reach: até onde o mouse alcança a partir do herói
const FOGO = {
  // spd: velocidade da bola · r: raio da explosão
  bola: { cost: 8, cd: 0.75, min: 4, max: 7, spd: 240, r: 30, reach: 220 },
  // costS: mana por segundo soprando · len: alcance do cone · ang: meia abertura (radianos) · tick: segundos entre queimadas
  inferno: { costS: 10, min: 1, max: 2, len: 70, ang: 0.38, tick: 0.15 },
  // w: largura da parede · h: altura das chamas · dur: segundos acesa · tick: segundos entre queimadas
  parede: { cost: 14, cd: 2.5, min: 1, max: 3, w: 64, h: 26, dur: 5, tick: 0.35, reach: 160 },
  // delay: segundos até cair · r: raio da explosão · patch: segundos de chão em chamas depois
  meteoro: { cost: 20, cd: 3.5, min: 10, max: 16, delay: 0.9, r: 36, patch: 2.5, reach: 180 },
  // dur: segundos de vida · rate: segundos entre cuspidas · range: alcance da mira · n: quantas ao mesmo tempo
  hidra: { cost: 15, cd: 1.5, min: 2, max: 4, dur: 9, rate: 0.85, range: 150, n: 2, spd: 200, reach: 120 },
  // queimadura: dmg a cada tick segundos, por dur segundos (renova a cada golpe de fogo)
  burn: { dmg: 1, tick: 0.5, dur: 2.5 },
  weakFire: 0.5, weakCold: 1.5
};
// os cinco, na ordem em que o herói novo recebe: [chave, nome, descrição, linhas extras da dica]
const FOGO_LIST = [
  ['bola', 'Bola de Fogo', 'Uma bola de fogo voa até a mira e explode em tudo que estiver perto. Quem sobrevive continua queimando.'],
  ['inferno', 'Inferno', 'Segure e sopre chamas para a frente, num cone curto. Gasta mana enquanto durar o fôlego.'],
  ['parede', 'Parede de Fogo', 'Uma fileira de chamas sobe do chão onde está a mira. Quem atravessa queima.'],
  ['meteoro', 'Meteoro', 'Uma pedra em brasa cai do céu na mira depois de um instante. A explosão é forte e o chão fica em chamas.'],
  ['hidra', 'Hidra', 'Uma serpente de fogo brota do chão e cospe bolas de fogo sozinha no inimigo mais perto. Até duas ao mesmo tempo.']
];
const FOGO_SEAL = {}, FOGO_SCROLL = {}, FOGO_SPELL = {};
for (const [k, name, desc] of FOGO_LIST) {
  const sealed = 'perg_selado_' + k, scroll = 'perg_' + k, spell = 'feitico_' + k;
  FOGO_SEAL[sealed] = k; FOGO_SCROLL[scroll] = k; FOGO_SPELL[spell] = k;
  ITEMS[sealed] = { name: 'Pergaminho Não Identificado', rar: 0, scroll: 1, icon: sealed, desc: 'Um rolo lacrado com cera cor de brasa. O papel está morno, como se tivesse dormido perto do fogo.' };
  ITEMS[scroll] = { name: 'Pergaminho ' + (k === 'parede' || k === 'hidra' || k === 'bola' ? 'da ' : 'do ') + name, rar: 2, scroll: 2, icon: scroll, elem: 'fogo', desc: 'As runas brilham como carvão soprado. Lido em voz alta, ensina o feitiço e vira cinza.' };
  ITEMS[spell] = { name, rar: 2, spell: true, icon: spell, elem: 'fogo', desc };
}
const fogoKey = id => FOGO_SEAL[id] || FOGO_SCROLL[id] || FOGO_SPELL[id] || null;
// linhas da dica de cada um
function fogoTipLines(k) {
  const F = FOGO[k], B = FOGO.burn, n = v => String(v).replace('.', ',');
  const L = [];
  if (k === 'inferno') L.push(['Mana', n(F.costS) + ' por segundo']); else L.push(['Mana', F.cost]);
  L.push(['Dano', k === 'inferno' || k === 'parede' ? `${F.min} – ${F.max} a cada ${n(F.tick)} s` : `${F.min} – ${F.max}`]);
  if (k === 'bola' || k === 'meteoro') L.push(['Área', 'explosão']);
  if (k === 'parede') L.push(['Dura', n(F.dur) + ' s']);
  if (k === 'meteoro') L.push(['Chão em chamas', n(F.patch) + ' s']);
  if (k === 'hidra') L.push(['Dura', n(F.dur) + ' s'], ['Ao mesmo tempo', F.n]);
  L.push(['Queimadura', `${B.dmg} a cada ${n(B.tick)} s, ${n(B.dur)} s`]);
  if (F.cd) L.push(['Recarga', n(F.cd) + ' s']);
  return L;
}

/* ---- ícones: o rolo do Arco com lacre e runas de brasa; o feitiço num disco de pedra queimada ---- */
const FOGO_PAL = { roll: '#c9a978', sheet: '#d8c49a', ink: '#8a7458', rune: '#ff8a2a', wax: '#d0501c', ribbon: '#5a1e14', stone: '#3a1a14' };
function fogoPaintRows(rows, seed) {
  const c = mk(13, 13), x = c.getContext('2d');
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const m = SCROLL_MAT[rows[j][i]]; if (!m) continue;
    let v = m[1]; const g = hash2(i, j, seed);
    if (m[0] === 'sheet' || m[0] === 'roll') v += g < 0.16 ? -1 : g > 0.9 ? 1 : 0;
    x.fillStyle = heroRamp(FOGO_PAL[m[0]])[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
// W miolo branco · Y amarelo · O laranja · R vermelho · K pedra · k pedra clara
const FOGO_SYM = {
  bola: [".............", ".............", "........RRR..", ".......ROOOR.", "......ROYYOR.", ".....ROYWWYO.", "....ROOYWWYO.", "...ROO.OYYOR.", "..RO.R..OOR..", ".RO.R........", "..R..........", ".............", "............."],
  inferno: [".............", "..........R..", "........R.OR.", "......ROROOR.", "....ROOYOYOR.", "..ROOYYWYYOO.", "RROYWWWWWYYO.", "..ROOYYWYYOO.", "....ROOYOYOR.", "......ROROOR.", "........R.OR.", "..........R..", "............."],
  parede: [".............", ".............", "...R....R....", "..RO..R.OR.R.", ".ROOR.OROOROR", ".OYOROYOOYOR.", "ROYYOOYYOYYOR", "OYWYOYWYOYWYO", "YWWWYWWWYWWWY", "KKKKKKKKKKKKK", ".............", ".............", "............."],
  meteoro: ["R............", ".O..R........", ".RO..O.......", "..OYR.O......", "...YYO.R.....", "....YWYO.....", ".....YWWOR...", "......OKKKO..", ".....RKKkKKR.", "......KkKKKO.", "......OKKKK..", ".......ROO...", "............."],
  hidra: [".............", "....RRRR.....", "...ROOOOR....", "...RW.OOOR.Y.", "....RRROOOYW.", ".......ROOR.Y", "......ROOR...", ".....ROOR....", "....ROOR.....", "...ROOOR.....", "..ROOOOOR....", ".RRRRRRRRR...", "............."]
};
const FOGO_SYM_COL = { W: '#fff6d0', Y: '#ffd23a', O: '#ff8a1e', R: '#c8320e', K: '#3a2a26', k: '#6a5048' };
function fogoPaintSpell(k) {
  const c = mk(13, 13), x = c.getContext('2d'), st = heroRamp(FOGO_PAL.stone), S = FOGO_SYM[k];
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const d = Math.hypot(i - 6, j - 6); if (d > 6.4) continue;
    const g = hash2(i, j, 113);
    let v = d > 5.3 ? (j < 6 ? 4 : 2) : (i + j < 11 ? 2 : 1);
    if (g < 0.14) v -= 1; else if (g > 0.9) v += 1;
    x.fillStyle = st[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) { const ch = S[j][i]; if (ch === '.' || Math.hypot(i - 6, j - 6) > 6.4) continue; x.fillStyle = FOGO_SYM_COL[ch]; x.fillRect(i, j, 1, 1); }
  return c;
}
{
  const _makeIcon = makeIcon;
  makeIcon = function (id) {
    const k = fogoKey(id); if (!k) return _makeIcon(id);
    const src = FOGO_SPELL[id] ? fogoPaintSpell(k) : fogoPaintRows(FOGO_SCROLL[id] ? SCROLL_ID_ROWS : SCROLL_ROWS, FOGO_SCROLL[id] ? 57 : 53);
    const o = outlined(src); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}
