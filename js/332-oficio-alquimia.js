'use strict';

/* ================= ofício de Alquimia: a árvore da Marta (pedido do Jonathan, 2026-10-11, à tarde) =================
   O quarto ofício, no mesmo sistema do 331-oficios.js (XP, pontos, aba "Talentos", save `ofi`); os talentos estão no
   330-oficios-dados (OFICIOS.alquimia: Alambique, Ervas e Frascos). Aqui:
   - XP: cada frasco que sai do alambique dá o tempo da receita + 1 (poção de vida 3, elixir da Mina 7); cada erva colhida
     (com E ou com a picareta) dá 1 + metade da camada dela (sanguinária 1, raiz-de-brasa 3).
   - Alambique: embrulha tickFurnace por fora (o 96 prepara dentro dele) para acelerar o frasco e, quando um fica pronto,
     devolver frasco, partes de monstro ou ervas pela chance, dar um frasco a mais e o terceiro de graça.
   - Ervas: embrulha harvestHerb e breakTile (erva a mais) e troca o herbRegrow do 95 por um igual que conta os talentos.
   - Frascos: embrulha alqDrink (cura, mana e duração dos elixires maiores, cura mais rápida, gole sem gastar) e die
     (elixires que ficam depois da morte).
   - A tela: monta a aba no livro da Marta (#alq) com as abas Alquimia e Talentos no cabeçalho, como a cozinha.
   Carrega depois do 331-oficios. */

let ofA3 = 0;   // frascos preparados desde o último de graça (Alambique Duplo)
const ofHerbIds = new Set(HERBS.map(h => h.id));

/* ---------- o alambique ---------- */
{ const _tf = tickFurnace; tickFurnace = function (dt) {
  let done = null;
  if (brew && alqOpen()) { brew.t += dt * ofV('alquimia', 'velAlq') / 100; if (brew.t + dt >= brew.rc.t) done = brew.rc; }
  _tf(dt);
  if (done) ofOnBrew(done);
}; }
function ofOnBrew(rc) {
  ofGain('alquimia', rc.t + 1);
  const give = (id, n) => { const left = rGive(id, n); if (left) dropLoot(pl.x + pl.w / 2, pl.y + pl.h - 2, id, left, true); };
  const frasco = ofRoll('alquimia', 'frasco'), parte = ofRoll('alquimia', 'parte'), erva = ofRoll('alquimia', 'poupaErva');
  let free = false;
  if (ofV('alquimia', 'terco')) { ofA3 = (ofA3 + 1) % 3; free = !ofA3; }
  for (const [id, n] of rc.r) if (free || (id === 'frasco' ? frasco : ofHerbIds.has(id) ? erva : parte)) give(id, n);
  if (ofRoll('alquimia', 'dose')) { give(rc.id, 1); sfx.potion(); }
  alqDirty = true; invDirty = true;
}
// o tempo por frasco no livro já conta o fogo dos talentos
{ const _ra = refreshAlq; refreshAlq = function () {
  _ra(); if (!alqOpen()) return;
  const rc = alqRecipe(alqSel), el = $('alqSub'); if (!rc || !el) return;
  const t = `Alambique · ${dec1(rc.t / (1 + ofV('alquimia', 'velAlq') / 100))} s por frasco`;
  if (el.textContent !== t) el.textContent = t;
}; }

/* ---------- as ervas ---------- */
function ofOnHerb(h, tx, ty) {
  ofGain('alquimia', 1 + (h.camada >> 1));
  const n = (ofRoll('alquimia', 'colheita') ? 1 : 0) + (ofV('alquimia', 'jardim') ? 1 : 0);
  if (n) dropLoot((tx + 0.5) * T, (ty + 1) * T - 1, h.id, n, true);
}
{ const _hh = harvestHerb; harvestHerb = function (tx, ty, src) { const h = HERB_OF[tileAt(tx, ty)], r = _hh(tx, ty, src); if (r && h) ofOnHerb(h, tx, ty); return r; }; }
{ const _bt = breakTile; breakTile = function (tx, ty) { const h = HERB_OF[tileAt(tx, ty)]; _bt(tx, ty); if (h && tileAt(tx, ty) !== h.t) ofOnHerb(h, tx, ty); }; }
// o mesmo do 95, com a estação mais curta e mais ervas voltando
herbRegrow = function (dt) {
  herbClock += dt * (1 + ofV('alquimia', 'estacao') / 100); if (herbClock < 120) return; herbClock = 0;
  const ch = 0.35 + ofV('alquimia', 'rebrota') / 100, px = (pl.x + pl.w / 2) / T, py = (pl.y + pl.h / 2) / T;
  for (const [i, t] of HERB_SPOTS) {
    if (tiles[i] !== AIR || Math.random() > ch) continue;
    const x = i % WW, y = (i / WW) | 0;
    if (Math.abs(wdx(x - px)) < VW / T / 2 + 4 && Math.abs(y - py) < VH / T / 2 + 4) continue;   // nunca na frente do herói
    if (!SOLID[tileAt(x, y + 1)] || tileAt(x, y - 1) !== AIR) continue;
    tiles[i] = t; diffs.delete(i); markDirty(x, y); mapVer++;
  }
};

/* ---------- beber ---------- */
{ const _ad = alqDrink; alqDrink = function (id) {
  const a = ALQ[id]; if (!a) return _ad(id);
  const k = a.kind === 'life' ? 'heal' : a.kind === 'mana' ? 'mana' : 't', v0 = a[k];
  const up = ofV('alquimia', a.kind === 'life' ? 'curaPot' : a.kind === 'mana' ? 'manaPot' : 'elixT');
  a[k] = Math.round(v0 * (1 + up / 100));
  let ok; try { ok = _ad(id); } finally { a[k] = v0; }
  if (!ok) return ok;
  const g = ofV('alquimia', 'gole'); if (a.kind === 'life' && g) pl.potRate = Math.max(POT_RATE, pl.potHeal / (5 * Math.max(0.3, 1 - g / 100)));
  if (ofRoll('alquimia', 'gota')) { addItem(id, 1); invDirty = true; }
  return ok;
}; }
{ const _die = die; die = function () {
  const keep = ofV('alquimia', 'sangue') ? Object.assign({}, pl.elix) : null;
  _die();
  if (keep) { pl.elix = keep; recalc(); }
}; }

/* ---------- a tela ---------- */
OF_OPEN.alquimia = () => alqOpen();
OF_REDRAW.alquimia = () => { alqDirty = true; };
// a placa: pedra de porão esverdeada pelo vapor, manchas do que já entornou e o brilho do fogo do alambique embaixo
OF_BG.alquimia = x => {
  vMasonry(x, 0, 0, OF_BW, OF_BH, 3304, { ramps: [ALQ_RAMP.caule, ALQ_RAMP.losna], soot: (px, py) => py < 12 ? (12 - py) * 0.1 : 0 });
  for (let py = 0; py < OF_BH; py++) for (let px = 0; px < OF_BW; px++) {
    const m = pn(px, py, 30, 30, 3305);
    if (m > 0.74 && hash2(px, py, 3306) < 0.7) { x.fillStyle = m > 0.8 ? 'rgba(90,200,80,.22)' : 'rgba(60,140,60,.16)'; x.fillRect(px, py, 1, 1); }
    if (py > 136 && hash2(px, py, 3307) < (py - 136) / 40) { x.fillStyle = 'rgba(246,136,26,.14)'; x.fillRect(px, py, 1, 1); }
  }
};
{ const _ba = buildAlqUI; buildAlqUI = function () {
  const first = !alqBuilt; _ba(); if (!first) return;
  const sec = document.querySelector('#alq .alqp'); ofMount('alquimia', sec, ofHeadTabs(sec, 'Alquimia'));
}; }
{ const _oa = openAlq; openAlq = function (n) { _oa(n); ofView('alquimia', false); }; }
