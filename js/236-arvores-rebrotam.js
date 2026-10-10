'use strict';

/* ================= árvores voltam a nascer na superfície =================
   Pedido do Jonathan (2026-10-10): árvore cortada não volta (o corte fica no save como ar), então a madeira das tochas
   acabaria. Agora, a cada TREE_REGROW_H horas do jogo, nasce uma árvore nova num ponto sorteado da superfície, do
   mesmo jeito que o mundo as gera: no capim, em chão plano, longe de outra árvore e fora do vilarejo.
   - Nunca passa do número de árvores que o mundo tinha ao ser gerado (`treeCap`, contado logo depois do generate).
   - Nasce só fora da tela, para nenhuma árvore aparecer do nada na frente do herói.
   - O relógio é o do mundo (worldTime): conta também com o jogo fora de foco, e a próxima vez fica no save (`arvT`).
   - A árvore entra pelo setTile, então fica no save como qualquer outro bloco.
   Carrega depois do 34-arvores e do 171-agua, antes do 24-boot. */

const TREE_REGROW_H = 4;                                  // horas do jogo entre uma árvore nova e a próxima
const TREE_REGROW_S = TREE_REGROW_H / 24 * DAY_LEN;       // em segundos do mundo
const RG_ART = [   // as mesmas copas do 06-mundo ('#' = folha; a última fileira senta no topo do tronco)
  ['....#....', '...###...', '..#####..', '.#######.', '########.', '.######..', '...#.#...'],
  ['.....#...', '....###..', '...#####.', '..#######', '.########', '..######.', '...####..', '...#.#...'],
  ['....#....', '...###...', '..#####..', '...###...', '..#####..', '.#######.', '..#####..', '...###...', '...#.#...'],
  ['...####..', '.#######.', '#########', '########.', '.######..', '...#.#...']
];
const RG_H = [5, 6, 7, 3];
let treeCap = 0, treeNext = 0;

// a base de um tronco da superfície (perto da linha do chão gerada), para contar as árvores
const isSurfTreeBase = (x, y) => tiles[y * WW + x] === TRUNK && tiles[(y + 1) * WW + x] !== TRUNK && Math.abs(y + 1 - surf[x]) <= 6;
function countSurfTrees() {
  let n = 0;
  for (let x = 0; x < WW; x++) for (let y = Math.max(2, surf[x] - 8); y <= Math.min(WH - 2, surf[x] + 5); y++) if (isSurfTreeBase(x, y)) n++;
  return n;
}
// o chão de verdade nessa coluna hoje (o herói pode ter cavado ou construído): primeiro sólido de cima para baixo
function groundAt(x) {
  for (let y = Math.max(2, surf[x] - 12); y <= Math.min(WH - 2, surf[x] + 6); y++) if (SOLID[tileAt(x, y)]) return y;
  return -1;
}
function rgFits(x, y, kind) {
  const art = RG_ART[kind], h = RG_H[kind], rows = art.length, top = y - h;
  for (let k = 1; k <= h; k++) { const t = tileAt(x, y - k); if (y - k < 2 || (t !== AIR && t !== TUFT && t !== FLOWER)) return false; }
  for (let r = 0; r < rows; r++) {
    const ty = top - (rows - 1) + r; if (ty < 2) return false;
    for (let c = 0; c < art[r].length; c++) if (art[r][c] === '#' && tileAt(x + c - 4, ty) !== AIR) return false;
  }
  return true;
}
function rgGrow(x, y, kind) {
  const art = RG_ART[kind], h = RG_H[kind], rows = art.length, top = y - h;
  for (let k = 1; k <= h; k++) setTile(x, y - k, TRUNK);
  for (let r = 0; r < rows; r++) { const ty = top - (rows - 1) + r; for (let c = 0; c < art[r].length; c++) if (art[r][c] === '#') setTile(x + c - 4, ty, LEAVES); }
}
// sorteia pontos da superfície até achar um que sirva; false se nenhum servir desta vez
function regrowOne() {
  const px = Math.floor((pl.x + pl.w / 2) / T), half = Math.ceil(VW / T / 2) + 14;
  for (let tries = 0; tries < 80; tries++) {
    const x = 6 + Math.floor(Math.random() * (WW - 12));
    if (Math.abs(wdx(x - SPX)) < VIL_HALF + 3 || Math.abs(wdx(x - px)) < half) continue;
    const y = groundAt(x); if (y < 0) continue;
    if (tileAt(x, y) !== GRASS || walls[y * WW + x] || groundAt(x - 1) !== y || groundAt(x + 1) !== y) continue;
    let near = false; for (let k = -10; k <= 10 && !near; k++) for (let j = y - 12; j <= y + 2 && !near; j++) if (tileAt(x + k, j) === TRUNK) near = true;
    if (near) continue;
    const roll = Math.random(), kind = roll < 0.3 ? 0 : roll < 0.55 ? 1 : roll < 0.78 ? 2 : 3;
    if (!rgFits(x, y, kind)) continue;
    rgGrow(x, y, kind); return true;
  }
  return false;
}
HOOK.update.push(() => {
  if (!tiles || !treeCap || worldTime < treeNext) return;
  treeNext = worldTime + TREE_REGROW_S;
  if (countSurfTrees() < treeCap) regrowOne();
});

/* ---- quantas árvores o mundo tinha, e quando nasce a próxima ---- */
{ const _gen = generate; generate = function (sd) { _gen(sd); treeCap = countSurfTrees(); }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  _nw(sd, sv);
  const t = sv && +sv.arvT;
  treeNext = t > 0 && t - worldTime <= TREE_REGROW_S ? t : worldTime + TREE_REGROW_S;
}; }
{ const _ms = makeSave; makeSave = function () { const v = _ms(); v.arvT = treeNext; return v; }; }
