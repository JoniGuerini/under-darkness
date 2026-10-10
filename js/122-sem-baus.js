'use strict';

/* ================= no more loot chests (Jonathan, 2026-10-10) =================
   The random loot chests are gone from every layer: the generators no longer place them, the E key only talks and
   opens the village chest (js/27-bau.js, which stays), and the old chest table is now the smith's shop pool
   (SHOP_GEAR in 05). Worlds saved before this (wg 8) keep their seed, so the same world comes back without the chests;
   only the dug and built blocks (diffs) are dropped, because the generation after the chests changed. Level, items,
   gold, the village chest, the map and the bosses already killed stay. Loads right after 111. */

let noChestNews = false;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (o.wg === 8) o.wg = 9; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg === 9) v.wg = 8;
  else if (v.wg === 8) { v.diffs = []; noChestNews = !!v.p && v.wrap === 1; }
  const r = _ms(v); if (r && r.wg === 8) r.wg = 9; return r;
}; }
HOOK.update.push(() => {
  if (noChestNews && state === 'play') { noChestNews = false; setTimeout(() => toast('Novidade: os baús de tesouro saíram de todas as camadas. O baú da vila continua. Os buracos que você cavou foram desfeitos; nível, itens e ouro continuam.', 'gold'), 900); }
});
