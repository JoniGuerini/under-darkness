'use strict';

/* ================= o Abismo: the save =================
   Worlds made before the abyss are remade (wg 8); level, items, gold and the chest stay. Loads after 102, which
   knows world 7 (108 loads before 87 so its worldLink still runs last; the save has to wrap after 102). */

let abyssNews = false;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (ABISMO) o.wg = 8; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!ABISMO || !v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== 8) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null; v.principe = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
    abyssNews = !!v.p && v.wrap === 1;
  }
  v.wg = 7; const r = _ms(v); if (r) r.wg = 8; return r;   // 102 knows world 7
}; }
HOOK.update.push(() => {
  if (abyssNews && state === 'play') { abyssNews = false; setTimeout(() => toast('Novidade: debaixo da Mina agora há o Abismo, com dez demônios novos e o Príncipe do Caos no fundo. O mundo foi refeito; seu nível, itens e ouro continuam.', 'gold'), 900); }
});
