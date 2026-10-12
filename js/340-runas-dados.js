'use strict';

/* ================= runas: os dados do tabuleiro de aperfeiçoamento =================
   Pedido do Jonathan (inspirado nas árvores de habilidade do Last Epoch): na torre da Aurélia, um tabuleiro no meio da
   tela com um encaixe no centro. A runa do feitiço vai no encaixe e em volta dela abrem nós que mudam o feitiço.
   Por enquanto só o Arco Voltaico tem tabuleiro; os outros feitiços vêm depois que o Jonathan validar o jeito.
   - Pontos: a runa sobe de nível com o uso (cada inimigo que o feitiço acerta dá 1 de experiência à runa). Cada nível
     dá 1 ponto. RUNE_XP(L) é quanto falta do nível L para o L+1.
   - Um nó só aceita ponto se o nó de onde ele sai (parent) já tiver pelo menos 1.
   - x, y: posição do nó no tabuleiro, em pixels a partir do centro (o tabuleiro tem 300x250 e é desenhado em dobro).
   - icon: máscara 11x11 (W branco, Y claro, O meio, R escuro), pintada na cor do feitiço.
   - val(r): o texto do efeito com r pontos, para a dica mostrar o agora e o próximo.
   As regras (aplicar no feitiço, ganhar experiência, a janela) ficam em js/341-runas.js. A wiki carrega este arquivo. */

const RUNE_XP = L => 10 + 5 * L;

// o Arco Voltaico como veio de fábrica: o tabuleiro sempre recalcula o ARC a partir daqui
const ARC_BASE = Object.assign({}, ARC);
Object.assign(ARC, { stun: 0, fork: 0, last: 1 });

const RUNE_ICONS = {
  ricochete: ["...........", ".O.......O.", "OWO.....OWO", ".OY.....YO.", "..Y.....Y..", "...Y...Y...", "...Y.O.Y...", "....YWY....", ".....W.....", "....OWO....", ".....O....."],
  corrente: ["...........", ".RRRR......", ".R..R......", ".R.YYYY....", ".RRYRR.Y...", "...Y...Y...", "...Y..WWWW.", "...YYYYW..W", "......W..W.", "......WWWW.", "..........."],
  bifurcacao: ["W.........W", ".Y.......Y.", "..Y.....Y..", "...O...O...", "....OYO....", ".....W.....", ".....Y.....", "....Y......", ".....O.....", "....O......", "....R......"],
  sobrecarga: ["......WWW..", ".....WYY...", "....WYY....", "...WYY.....", "..WWWWWW...", ".....YYW...", "....YYW....", "...YYW.....", "..OOW......", "..OO.......", "..R........"],
  choque: ["...........", ".....W.....", "..O..Y..O..", "...Y.Y.Y...", "....YWY....", ".WYYWWWYYW.", "....YWY....", "...Y.Y.Y...", "..O..Y..O..", ".....W.....", "..........."],
  ultimo: ["...........", "...OOOOO...", "..O.....O..", ".O..YYY..O.", ".O.Y...Y.O.", ".O.Y.W.Y.O.", ".O.Y...Y.O.", ".O..YYY..O.", "..O.....O..", "...OOOOO...", "..........."],
  alcance: ["...........", "...........", "...........", ".......W...", "........W..", "RROOYYWWWW.", "........W..", ".......W...", "...........", "...........", "..........."],
  salto: ["...........", "...........", "...YYYYY...", "..Y.....Y..", ".Y.......Y.", ".Y.......Y.", "OWO.....OWO", ".O.......O.", "...........", "...........", "..........."],
  fluxo: ["...........", ".....W.....", "....WY.....", "....YYO....", "...YWYOO...", "..YWYYOOR..", "..YYYOOOR..", "..OYOOORR..", "...OOORR...", "....RRR....", "..........."],
  descarga: ["...........", "..WWWWWWW..", "...Y...Y...", "...YOOOY...", "....YOY....", ".....W.....", "....Y.Y....", "...Y.O.Y...", "...YOOOY...", "..WWWWWWW..", "..........."]
};

const RUNE_BOARDS = {
  feitico_arco: {
    col: { W: '#ffffff', Y: '#bfe6ff', O: '#5aa8ff', R: '#2f5fd0' },
    nodes: [
      // para cima: a corrente
      { k: 'ricochete', name: 'Ricochete', max: 3, parent: null, x: 0, y: -54, icon: 'ricochete', val: r => `Saltos: ${ARC_BASE.jumps + 2 * r}` },
      { k: 'corrente', name: 'Corrente Firme', max: 3, parent: 'ricochete', x: -42, y: -98, icon: 'corrente', val: r => `Cada salto perde ${Math.round((1 - ARC_BASE.fall - 0.05 * r) * 100)}% do dano` },
      { k: 'bifurcacao', name: 'Bifurcação', max: 1, parent: 'ricochete', x: 42, y: -98, icon: 'bifurcacao', val: r => r ? 'No primeiro alvo o raio se divide em dois e a segunda corrente salta metade das vezes' : 'O raio não se divide' },
      // para a direita: a força
      { k: 'sobrecarga', name: 'Sobrecarga', max: 3, parent: null, x: 62, y: 0, icon: 'sobrecarga', val: r => `Dano: +${20 * r}%` },
      { k: 'choque', name: 'Choque', max: 2, parent: 'sobrecarga', x: 112, y: -32, icon: 'choque', val: r => `${15 * r}% de chance de atordoar por meio segundo` },
      { k: 'ultimo', name: 'Último Elo', max: 1, parent: 'sobrecarga', x: 112, y: 32, icon: 'ultimo', val: r => r ? 'O último alvo da corrente leva o dobro do dano' : 'O último alvo leva o dano normal' },
      // para a esquerda: o alcance
      { k: 'alcance', name: 'Alcance', max: 2, parent: null, x: -62, y: 0, icon: 'alcance', val: r => `Alcance do primeiro alvo: ${Math.round((ARC_BASE.reach + 25 * r) / T)} blocos` },
      { k: 'salto', name: 'Salto Longo', max: 3, parent: 'alcance', x: -112, y: 0, icon: 'salto', val: r => `Distância de um salto: ${Math.round(ARC_BASE.hop * (1 + 0.2 * r) / T)} blocos` },
      // para baixo: o fôlego
      { k: 'fluxo', name: 'Fluxo', max: 2, parent: null, x: 0, y: 54, icon: 'fluxo', val: r => `Mana: ${ARC_BASE.cost - r}` },
      { k: 'descarga', name: 'Descarga Rápida', max: 2, parent: 'fluxo', x: 0, y: 100, icon: 'descarga', val: r => `Recarga: ${String(+(ARC_BASE.cd - 0.1 * r).toFixed(2)).replace('.', ',')} s` }
    ],
    // recalcula o ARC a partir dos pontos (n[k] = pontos no nó k)
    apply(n) {
      const g = k => n[k] | 0;
      Object.assign(ARC, ARC_BASE, {
        jumps: ARC_BASE.jumps + 2 * g('ricochete'),
        fall: Math.min(1, ARC_BASE.fall + 0.05 * g('corrente')),
        fork: g('bifurcacao'),
        min: ARC_BASE.min * (1 + 0.2 * g('sobrecarga')),
        max: ARC_BASE.max * (1 + 0.2 * g('sobrecarga')),
        stun: 0.15 * g('choque'),
        last: g('ultimo') ? 2 : 1,
        reach: ARC_BASE.reach + 25 * g('alcance'),
        hop: ARC_BASE.hop * (1 + 0.2 * g('salto')),
        cost: ARC_BASE.cost - g('fluxo'),
        cd: ARC_BASE.cd - 0.1 * g('descarga')
      });
    }
  }
};
for (const id in RUNE_BOARDS) { const B = RUNE_BOARDS[id]; B.maxLvl = B.nodes.reduce((a, q) => a + q.max, 0); B.byK = {}; for (const q of B.nodes) B.byK[q.k] = q; }
