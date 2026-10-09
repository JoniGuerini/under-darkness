'use strict';

/* ================= Arco Voltaico, o primeiro feitiço (para teste): os dados =================
   Um herói novo começa com um pergaminho não identificado. Botão direito identifica; botão direito de novo lê o
   pergaminho, que some e vira o feitiço, um item que fica na barra (3 a 0). Com ele na mão, o clique esquerdo solta
   um raio azul que salta de inimigo em inimigo e gasta mana.
   Este arquivo só tem os dados (itens, números e ícones) e carrega logo depois de 61-montante, para a wiki ver também.
   As regras que precisam do jogo rodando (identificar, aprender, lançar, desenhar o raio) ficam em js/64-arco-voltaico.js. */

// cost: mana por lançamento · cd: segundos entre lançamentos · min/max: dano do primeiro alvo · jumps: saltos depois dele
// fall: cada salto leva esta fração do dano anterior · reach: distância até o primeiro alvo · hop: distância de um salto
const ARC = { cost: 6, cd: 0.55, min: 3, max: 6, jumps: 4, fall: 0.85, reach: 120, hop: 72 };

Object.assign(ITEMS, {
  perg_selado: { name: 'Pergaminho Não Identificado', rar: 0, scroll: 1, icon: 'perg_selado', desc: 'Um rolo lacrado com cera. As letras fogem quando você tenta ler.' },
  perg_arco: { name: 'Pergaminho do Arco Voltaico', rar: 2, scroll: 2, icon: 'perg_arco', desc: 'As runas estalam debaixo dos dedos. Lido em voz alta, ensina o feitiço e se desfaz.' },
  feitico_arco: { name: 'Arco Voltaico', rar: 2, spell: true, icon: 'feitico_arco', desc: 'Um raio azul que pula de inimigo em inimigo, mais fraco a cada salto.' }
});
const isArcItem = id => !!(ITEMS[id] && (ITEMS[id].scroll || ITEMS[id].spell));

// pergaminhos e feitiços não são equipamento: nunca ganham modificadores, só um uid para ninguém confundir com uma pilha
{ const _mkItem = mkItem; mkItem = function (id, rar, mods, il) { return isArcItem(id) ? { id, n: 1, uid: UID++ } : _mkItem(id, rar, mods, il); }; }

/* ---- ícones: pintados letra a letra nas mesmas rampas de 6 tons do herói, com grão ---- */
// c C d: o rolo (claro, corpo, sombra) · P: a folha · q: rabiscos apagados · b B: runas acesas · s S: lacre · t: fita
const SCROLL_ROWS = [
  "..ccccccccc..",
  ".cCCCCCCCCCc.",
  "..dDDDDDDDd..",
  "...PPPPPPP...",
  "...PqqPqqP...",
  "...PPPPPPP...",
  "...PqPqqqP...",
  "...PPPPPPP...",
  "...PqqPsSP...",
  "..ccccsSSsc..",
  ".cCCCCCSsCCc.",
  "..dDDDDtDDd..",
  ".......t....."
];
// o mesmo rolo lido: o lacre partido e as runas acesas em azul
const SCROLL_ID_ROWS = [
  "..ccccccccc..",
  ".cCCCCCCCCCc.",
  "..dDDDDDDDd..",
  "...PPPPPPP...",
  "...PbBPbbP...",
  "...PPPPPPP...",
  "...PBPbBbP...",
  "...PPPPPPP...",
  "...PbbPPsP...",
  "..ccccccSsc..",
  ".cCCCCCCCsCc.",
  "..dDDDDDDDd..",
  "............."
];
const ARC_PAL = { roll: '#c9a978', sheet: '#d8c49a', ink: '#8a7458', rune: '#5aa8ff', wax: '#a8282e', ribbon: '#6a2a3a', stone: '#2c3c66', bolt: '#6ab8ff' };
const SCROLL_MAT = { c: ['roll', 4], C: ['roll', 3], d: ['roll', 1], P: ['sheet', 3], q: ['ink', 2], b: ['rune', 3], B: ['rune', 5], s: ['wax', 3], S: ['wax', 4], t: ['ribbon', 3] };
function arcPaintRows(rows, seed) {
  const c = mk(13, 13), x = c.getContext('2d');
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const m = SCROLL_MAT[rows[j][i]]; if (!m) continue;
    let v = m[1]; const g = hash2(i, j, seed);
    if (m[0] === 'sheet' || m[0] === 'roll') v += g < 0.16 ? -1 : g > 0.9 ? 1 : 0;   // fibras do papel
    x.fillStyle = heroRamp(ARC_PAL[m[0]])[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
// o feitiço: um disco de pedra rúnica azul-escura cortado por um raio
function arcPaintSpell() {
  const c = mk(13, 13), x = c.getContext('2d'), st = heroRamp(ARC_PAL.stone), bl = heroRamp(ARC_PAL.bolt);
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const d = Math.hypot(i - 6, j - 6); if (d > 6.4) continue;
    const g = hash2(i, j, 71);
    let v = d > 5.3 ? (j < 6 ? 4 : 2) : (i + j < 11 ? 2 : 1);                 // borda clara em cima, miolo escuro
    if (g < 0.14) v -= 1; else if (g > 0.9) v += 1;
    x.fillStyle = st[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  const bolt = [[8, 1], [5, 5], [8, 6], [4, 11]];
  const px = new Map();
  for (let k = 0; k < bolt.length - 1; k++) {
    const [ax, ay] = bolt[k], [bx, by] = bolt[k + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let s = 0; s <= n; s++) px.set(Math.round(ax + (bx - ax) * s / n) + ',' + Math.round(ay + (by - ay) * s / n), 1);
  }
  x.fillStyle = bl[2];   // halo azul em volta do raio
  for (const p of px.keys()) { const [i, j] = p.split(',').map(Number); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!px.has((i + di) + ',' + (j + dj))) x.fillRect(i + di, j + dj, 1, 1); }
  for (const p of px.keys()) { const [i, j] = p.split(',').map(Number); x.fillStyle = hash2(i, j, 9) < 0.35 ? bl[5] : '#f2fbff'; x.fillRect(i, j, 1, 1); }
  return c;
}
{
  const _makeIcon = makeIcon;
  makeIcon = function (id) {
    if (!isArcItem(id)) return _makeIcon(id);
    const src = id === 'feitico_arco' ? arcPaintSpell() : arcPaintRows(id === 'perg_arco' ? SCROLL_ID_ROWS : SCROLL_ROWS, id === 'perg_arco' ? 33 : 31);
    const o = outlined(src); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}
