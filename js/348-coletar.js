'use strict';

/* ================= E coleta o que está sob o mouse (2026-10-12) =================
   Pedido do Jonathan: com o mouse em cima de algo que dá para coletar, E pega e põe na mochila.
   Vale para tudo que é coletável:
     - drops no chão (itens, ouro, equipamentos);
     - tochas e candelabros colocados (voltam como item);
     - ervas (passa pelo harvestHerb do 95, então os talentos de colheita contam);
     - os objetos soltos das camadas que já davam um item ao quebrar (não sólidos, com BLOCK_DROP).
   Sem limite de distância, igual a colocar tocha: basta o mouse estar em cima. Blocos sólidos e
   plataformas continuam só com a picareta; nada do vilarejo é coletável (as lanternas dele ficam).
   Quando o mouse está sobre algo coletável, o E é dele: ganha do portal (29), dos moradores, das
   ervas e alavancas perto do herói (95, 189) e das piras do Escuro (223). Por isso este arquivo
   embrulha updatePlayer por último (carrega depois de todos os que embrulham) e o 29 e o 31 perguntam
   coletavelSobMouse(). */

const COL_PAD = 3;   // folga em px em volta do drop para o mouse acertar

function colLootSobMouse() {
  const [wx, wy] = mouseWorld(); let best = null, bd = 1e9;
  for (const o of loot) {
    if (wx < o.x - LOOT_HW - COL_PAD || wx > o.x + LOOT_HW + COL_PAD || wy < o.y - LOOT_H - 4 - COL_PAD || wy > o.y + COL_PAD) continue;
    const d = Math.abs(wx - o.x) + Math.abs(wy - (o.y - LOOT_H / 2)); if (d < bd) { bd = d; best = o; }
  }
  return best;
}
function colTileOk(tx, ty) {
  if (ty < 0 || ty >= WH - 1 || inVillage(tx, ty)) return false;
  const t = tileAt(tx, ty);
  if (t === TORCH || t === CANDLE || HERB_OF[t]) return true;
  if (typeof PLAT !== 'undefined' && t === PLAT) return false;
  return !SOLID[t] && DIG[t] > 0 && !!BLOCK_DROP[t];
}
function colTileSobMouse() { const [wx, wy] = mouseWorld(), tx = Math.floor(wx / T), ty = Math.floor(wy / T); return colTileOk(tx, ty) ? [tx, ty] : null; }
function coletavelSobMouse() {
  if (typeof pl === 'undefined' || pl.dead || state !== 'play' || !surf) return false;
  return !!(colLootSobMouse() || colTileSobMouse());
}

// põe um drop na mochila; o que não couber fica no chão, aos pés do herói
function colPegar(o) {
  const left = o.item ? (addInst(o.item) ? 0 : 1) : ITEMS[o.id].gold ? (pl.gold += o.n, 0) : addItem(o.id, o.n), got = o.n - left;
  if (got > 0) pickupMsg(o.id, got, o.item);
  if (left <= 0) { const i = loot.indexOf(o); if (i >= 0) loot.splice(i, 1); return true; }
  o.n = left; o.x = pl.x + pl.w / 2; o.y = pl.y + pl.h - 0.01; o.vx = o.vy = 0; o.t = 0;
  if (pl.fullMsg <= 0) { pl.fullMsg = 2.5; floatText(pl.x + pl.w / 2, pl.y - 10, 'Mochila cheia', '#ffb4a8', 0.8); }
  return got > 0;
}
function coletarSobMouse() {
  const o = colLootSobMouse(); if (o) { colPegar(o); return true; }
  const c = colTileSobMouse(); if (!c) return false;
  const [tx, ty] = c, n0 = loot.length;
  if (HERB_OF[tileAt(tx, ty)]) harvestHerb(tx, ty); else breakTile(tx, ty);
  // o que caiu do objeto vai direto para a mochila
  for (const d of loot.splice(n0)) { loot.push(d); colPegar(d); }
  return true;
}

{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (pressed.KeyE && state === 'play' && !pl.dead && coletarSobMouse()) pressed.KeyE = false;
  return _up(dt);
}; }
