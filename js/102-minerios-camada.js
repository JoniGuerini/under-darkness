'use strict';

/* ================= one metal per layer (2026-10-09) =================
   Each underground layer has coal and one metal, in the order the forge ranks them:
     As Cavernas      6 to 186 m    coal and copper
     A Catedral     186 to 372 m    coal and iron
     Cavernas de Gelo 372 to 558 m  coal and gold
     A Mina         558 to 744 m    coal and cobalt
     A Cidade       930 to 1116 m   coal and silver (138)
     O Abismo       1116 to 1302 m  coal and infernite (110)
   Crystal was the mine's metal until Jonathan made it a gem (2026-10-09): it is still mined (rarer, in the mine's
   quartzite) and sold, but it does not melt; cobalt took its place at the forge (05 METALS, 18 FURN, the mine's
   MN_O_COBALTO block in 79/80, veins in 84). Saves holding crystal bars or forged crystal pieces get cobalt ones.
   The veins themselves are in each layer's generator (56, 45, 73, 84). The coal of the ice is a new block (IC_O_CARVAO, 123, in 69 and
   70). Here: where-to-find texts, and the save: worlds made before this are remade (wg 7); level, items, gold
   and the chest stay. Monsters drop only their layer's metal or a lower one.
   Loads after 87. */

IC_SOILS[IC_O_CARVAO] = 1; MN_HOST[IC_O_CARVAO] = 1;   // the ice's coal block (69, 70) counts as ice soil and as filler the mine may cut


/* ---------- the save: worlds with every ore everywhere are remade ---------- */
let oreNews = false;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.wg = 7; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== 7) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.crypt = null; v.cp = []; v.rei = null; v.teia = null; v.yeti = null; v.reiGoblin = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
    oreNews = !!v.p && v.wrap === 1;
  }
  v.wg = 6; const r = _ms(v); if (r) r.wg = 7; return r;   // 87 knows world 6
}; }
HOOK.update.push(() => {
  if (oreNews && state === 'play') { oreNews = false; setTimeout(() => toast('Novidade: cada camada agora tem um minério próprio, além do carvão. O mundo foi refeito; seu nível, itens e ouro continuam.', 'gold'), 900); }
});

/* ---------- crystal bars and forged crystal pieces in a save become cobalt ones ---------- */
{ const _ms = migrateSave; migrateSave = function (v) {
  if (v && typeof v === 'object') try {
    const j = JSON.stringify(v), k = j.replace(/"barra_cristal"/g, '"barra_cobalto"').replace(/"f_([a-z]+)_cristal"/g, '"f_$1_cobalto"');
    if (k !== j) v = JSON.parse(k);
    if (v.fur && v.fur.ore === 'min_cristal') v.fur.ore = 'min_cobalto';
  } catch (e) { }
  return _ms(v);
}; }
