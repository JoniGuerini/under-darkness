'use strict';

/* ---- the forge: a furnace that smelts ore into bars, and an anvil that turns bars into gear ----
   One window in the style of a profession book: the recipes on the left, grouped and searchable;
   the chosen recipe on the right with its materials, a quantity, and a bar that fills while the work is done. */
const FURN = { min_cobre: { bar: 'barra_cobre', n: 2, t: 3 }, min_ferro: { bar: 'barra_ferro', n: 3, t: 4.5 }, min_ouro: { bar: 'barra_ouro', n: 4, t: 6 }, min_cobalto: { bar: 'barra_cobalto', n: 5, t: 8 } };   // crystal is a gem since 2026-10-09: it does not melt
let furnace = { ore: null, fuel: null, out: null, on: false, t: 0, made: 0, goal: 0 }, forgeNpc = null, forgeBuilt = false, forgeTab = 'smelt';
let forgeSel = { smelt: 'min_cobre', craft: 'f_espada_cobre' }, forgeShut = {}, forgeQty = 1, forgeFind = '', anvil = null, forgeDirty = true;
const forgeOpen = () => !!forgeNpc && !$('forge').hidden;
const anvilTime = rc => 2 + rc.metal * 0.6;          // seconds of hammering per piece
const bagFree = () => inv.some(q => !q);

/* ---- the furnace: loaded from the bag and the village chest by the recipe (reagents: js/93-reagentes.js), keeps burning after you walk away ---- */
const furHas = id => reagHave(id) + (furnace.ore && furnace.ore.id === id ? furnace.ore.n : 0) + (id === 'carvao' && furnace.fuel ? furnace.fuel.n : 0);
const smeltMax = id => Math.min(Math.floor(furHas(id) / FURN[id].n), furHas('carvao'));
function furnaceWhy() {
  const o = furnace.ore, r = o && FURN[o.id];
  if (!o) return 'Sem minério na fornalha.';
  if (o.n < r.n) return `Minério insuficiente: cada barra precisa de ${r.n}.`;
  if (!furnace.fuel) return 'Acabou o carvão.';
  if (furnace.out && (furnace.out.id !== r.bar || furnace.out.n >= stackMax(r.bar))) return 'Mochila cheia: pegue as barras prontas.';
  return '';
}
// give back what is left in the furnace (ore, coal, finished bars); whatever does not fit stays inside
function emptyFurnace() {
  for (const k of ['out', 'ore', 'fuel']) { const q = furnace[k]; if (!q) continue; const left = reagGive(q.id, q.n); if (left) q.n = left; else furnace[k] = null; }
  furnace.t = 0; invDirty = true; forgeDirty = true;
}
function tickFurnace(dt) {
  tickAnvil(dt);
  if (!furnace.on) return;
  if (furnaceWhy()) { stopFurnace(); return; }
  const r = FURN[furnace.ore.id]; furnace.t += dt;
  if (furnace.t < r.t) return;
  furnace.t = 0; furnace.ore.n -= r.n; if (furnace.ore.n <= 0) furnace.ore = null;
  if (--furnace.fuel.n <= 0) furnace.fuel = null;
  barStockAdd(r.bar, 1);   // into the forge's stock, collected by hand (js/352-estoque-barras.js)
  furnace.made++; furnace.lastBar = r.bar; forgeDirty = true; invDirty = true;
  if (forgeOpen()) sfx.anvil(0.7);
  if (furnace.goal && furnace.made >= furnace.goal) { stopFurnace(); return; }
  if (furnaceWhy()) stopFurnace();
}
function stopFurnace() {
  furnace.on = false; furnace.t = 0; furnace.goal = 0; furnace.made = 0;
  emptyFurnace();
}
function startSmelt(id, q, el) {
  const r = FURN[id]; q = Math.min(q, smeltMax(id));
  if (q < 1) { bad(el); toast(furHas(id) < r.n ? `Falta ${ITEMS[id].name.toLowerCase()}: cada barra precisa de ${r.n}.` : 'Falta carvão. O Odo, na taverna, vende.'); return; }
  if (furnace.on) { furnace.on = false; furnace.goal = 0; }
  if (furnace.ore && furnace.ore.id !== id) { const left = reagGive(furnace.ore.id, furnace.ore.n); if (left) { furnace.ore.n = left; bad(el); toast('Mochila cheia'); return; } furnace.ore = null; }
  const fill = (slot, iid, want) => { const cur = furnace[slot], k = Math.min(want - (cur ? cur.n : 0), reagHave(iid)); if (k <= 0) return; reagTake(iid, k); if (cur) cur.n += k; else furnace[slot] = { id: iid, n: k }; };
  fill('ore', id, q * r.n); fill('fuel', 'carvao', q);
  furnace.on = true; furnace.t = 0; furnace.made = 0; furnace.goal = q;
  sfx.torch(); forgeDirty = true; invDirty = true;
}

/* ---- the anvil: one piece at a time, the bars go in when the hammering starts ---- */
function startCraft(rc, q, el) {
  if (reagHave(rc.bar) < rc.n) { bad(el); toast(`Faltam barras: precisa de ${rc.n}.`); return; }
  if (!bagFree()) { bad(el); toast('Mochila cheia'); return; }
  reagTake(rc.bar, rc.n);
  anvil = { rc, left: q, done: 0, t: 0, dur: anvilTime(rc), ring: 0 }; sfx.anvil(0.9); forgeDirty = true; invDirty = true;
}
function stopCraft(refund) { if (!anvil) return; if (refund) reagGive(anvil.rc.bar, anvil.rc.n); anvil = null; forgeDirty = true; invDirty = true; }
function tickAnvil(dt) {
  if (!anvil) return;
  if (!forgeOpen()) { stopCraft(true); return; }
  anvil.t += dt; anvil.ring += dt;
  if (anvil.ring > 0.55) { anvil.ring = 0; sfx.anvil(0.45); }
  if (anvil.t < anvil.dur) return;
  const rc = anvil.rc, s = rollItem(rc.id, rc.metal + 1, 'forge'), rar = itemRar(s);   // rarity and modifiers: js/48-itemizacao.js
  addInst(s); sfx.anvil(1); setTimeout(() => sfx.anvil(0.8), 140); if (rar >= 2) sfx.rare();
  toast(`Você forjou: ${itemName(s)}${rar ? ` (${RAR[rar]})` : ''}`, rar >= 2 ? 'gold' : '', RAR_COL[rar]);
  anvil.done++; anvil.left--; anvil.t = 0; forgeDirty = true; invDirty = true;
  if (anvil.left <= 0) { anvil = null; return; }
  if (reagHave(rc.bar) < rc.n || !bagFree()) { toast(!bagFree() ? 'Mochila cheia: a bigorna parou.' : 'Acabaram as barras: a bigorna parou.'); anvil = null; return; }
  reagTake(rc.bar, rc.n);
}

/* ---- the book: groups, entries, the chosen recipe ---- */
function forgeGroups() {
  if (forgeTab === 'smelt') return [{ k: 'barras', name: 'Barras de metal', items: Object.keys(FURN).map(id => ({ id, out: FURN[id].bar, name: ITEMS[FURN[id].bar].name, n: smeltMax(id) })) }];
  return METALS.map((M, t) => ({ k: 'm' + t, name: `Peças de ${M.name.toLowerCase()}`, bar: M.bar, items: RECIPES.filter(rc => rc.metal === t).map(rc => ({ id: rc.id, out: rc.id, name: ITEMS[rc.id].name, n: Math.floor(reagHave(rc.bar) / rc.n) })) }));
}
function buildForgeUI() {
  if (forgeBuilt) return; forgeBuilt = true;
  const p = document.querySelector('#forge .forgep');
  p.addEventListener('contextmenu', e => e.preventDefault());
  $('forge').addEventListener('click', e => {
    if (e.target === $('forge')) { backFromForge(); return; }
    const t = e.target.closest && e.target;
    const tb = t.closest('.tab'); if (tb) { if (forgeTab !== tb.dataset.tab) { forgeTab = tb.dataset.tab; forgeQty = 1; sfx.select(); forgeDirty = true; } return; }
    const g = t.closest('.pg'); if (g) { forgeShut[g.dataset.g] = !forgeShut[g.dataset.g]; sfx.select(); forgeDirty = true; return; }
    const r = t.closest('.pr'); if (r) { if (forgeSel[forgeTab] !== r.dataset.k) { forgeSel[forgeTab] = r.dataset.k; forgeQty = 1; sfx.select(); forgeDirty = true; } return; }
  });
  p.addEventListener('pointermove', e => { const r = e.target.closest && e.target.closest('.pr[data-tip]'); if (r) recipeTip(e, r.dataset.k); else hideTip(); });
  p.addEventListener('pointerleave', hideTip);
  $('profSearch').addEventListener('input', e => { forgeFind = e.target.value.trim().toLowerCase(); forgeDirty = true; });
  $('profSearch').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { e.target.value = ''; forgeFind = ''; forgeDirty = true; e.target.blur(); } });
  const setQty = v => { forgeQty = Math.max(1, Math.min(99, v | 0 || 1)); forgeDirty = true; };
  $('btnQtyDn').addEventListener('click', () => { setQty(forgeQty - 1); sfx.select(); });
  $('btnQtyUp').addEventListener('click', () => { setQty(forgeQty + 1); sfx.select(); });
  $('pdQty').addEventListener('keydown', e => e.stopPropagation());
  $('pdQty').addEventListener('change', e => setQty(+e.target.value));
  const make = all => {
    const b = all ? $('btnMakeAll') : $('btnMake');
    if (forgeTab === 'smelt') {
      if (furnace.on && !all) { furnace.on = false; furnace.goal = 0; furnace.made = 0; emptyFurnace(); sfx.select(); return; }
      const id = forgeSel.smelt; startSmelt(id, all ? smeltMax(id) : forgeQty, b);
    } else {
      if (anvil && !all) { stopCraft(true); sfx.select(); return; }
      const rc = RECIPES.find(q => q.id === forgeSel.craft); if (!rc) return; if (anvil) stopCraft(true);
      startCraft(rc, all ? Math.floor(reagHave(rc.bar) / rc.n) : forgeQty, b);
    }
    forgeDirty = true;
  };
  $('btnMake').addEventListener('click', () => make(false));
  $('btnMakeAll').addEventListener('click', () => make(true));
  $('btnForgeBack').addEventListener('click', () => { sfx.select(); backFromForge(); });
  $('profList').addEventListener('keydown', e => { const r = e.target.closest('.pr'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.click(); } });
}
function openForge(n) {
  buildForgeUI(); buildInvUI(); forgeNpc = n;
  if (!furnace.on && (furnace.ore || furnace.fuel || furnace.out)) emptyFurnace();   // leftovers from an older save go back to the bag
  if (furnace.ore && furnace.on) { forgeTab = 'smelt'; forgeSel.smelt = furnace.ore.id; }
  else { const have = METALS.map(M => reagHave(M.bar)); let best = -1; have.forEach((v, i) => { if (v > 0) best = i; }); if (best >= 0 && !forgeSel.craft.endsWith(METALS[best].id)) forgeSel.craft = `f_espada_${METALS[best].id}`; }
  $('talk').hidden = true; $('forge').hidden = false; forgeDirty = true; refreshForge();
}
function backFromForge() {
  hideTip(); if (anvil) stopCraft(true); $('forge').hidden = true;
  const n = forgeNpc; forgeNpc = null; $('talk').hidden = false; talkMenu(n, pickLine(['O fogo fica aceso. Volte quando quiser.', 'Bom trabalho de forja, para um aprendiz.', 'Cuidado com as mãos. Eu perdi duas unhas assim.']));
}
function drawFire() {
  const cv = $('fireCv'), x = cv.getContext('2d'); x.clearRect(0, 0, 16, 12);
  const on = forgeTab === 'smelt' ? furnace.on : !!anvil, cols = on ? ['#7a1a08', '#c8420b', '#ff9a2a', '#ffe08a'] : ['#2a1a14', '#3a2418', '#5a3020', '#7a3a20'];
  for (let i = 0; i < 16; i++) { x.fillStyle = '#1a1210'; x.fillRect(i, 11, 1, 1); }
  for (let i = 1; i < 15; i++) {
    const h = on ? 3 + Math.floor((Math.sin(gameTime * 9 + i * 1.7) * 0.5 + 0.5) * 6 + Math.random() * 2) : 2 + (i % 3 === 0 ? 1 : 0);
    for (let y = 0; y < h; y++) { x.fillStyle = cols[Math.min(3, Math.floor((h - y) / h * 4 * 0.99))]; x.fillRect(i, 10 - y, 1, 1); }
  }
}
const reagRow = (id, need, have) => `<li class="${have >= need ? 'ok' : 'no'}"><span class="ri"><img src="${ICON[id].url}" alt=""></span><b>${have}/${need}</b><span>${ITEMS[id].name}</span></li>`;
function refreshForge() {
  if (!forgeOpen()) return;
  // the live part, every frame: the bar and the fire
  let fill = 0, txt = '';
  if (forgeTab === 'smelt' && furnace.on && furnace.ore) { const r = FURN[furnace.ore.id]; fill = furnace.t / r.t; txt = `Fundindo ${ITEMS[r.bar].name.toLowerCase()} · ${furnace.made + 1} de ${furnace.goal || '?'}`; }
  else if (forgeTab === 'craft' && anvil) { fill = anvil.t / anvil.dur; txt = `Forjando ${ITEMS[anvil.rc.id].name.toLowerCase()} · ${anvil.done + 1} de ${anvil.done + anvil.left}`; }
  // touch the page only when something visible changed: the bar moves in 0.5% steps, the fire flickers at 12 frames a second
  const w = pct(Math.round(Math.min(1, fill) * 200) / 200), fe = $('pdFill'), te = $('pdBarTxt');
  if (fe._w !== w) { fe.style.width = w; fe._w = w; }
  if (te._t !== txt) { te.textContent = txt; te._t = txt; }
  const lit = forgeTab === 'smelt' ? furnace.on : !!anvil, fk = lit ? Math.floor(gameTime * 12) : -1;
  if (fk !== drawFire.k || lit !== drawFire.lit || forgeDirty) { drawFire.k = fk; drawFire.lit = lit; drawFire(); }
  if (!forgeDirty) return; forgeDirty = false;
  document.querySelectorAll('#forge .tab').forEach(b => { b.classList.toggle('on', b.dataset.tab === forgeTab); b.classList.toggle('busy', b.dataset.tab === 'smelt' ? furnace.on : !!anvil); });
  $('forgeGold').textContent = `${pl.gold} de ouro`;
  // the list
  const groups = forgeGroups(), sel = forgeSel[forgeTab];
  $('profList').innerHTML = groups.map(G => {
    const items = G.items.filter(it => !forgeFind || it.name.toLowerCase().includes(forgeFind)); if (!items.length) return '';
    const shut = forgeShut[forgeTab + G.k] && !forgeFind;
    const head = `<div class="pg${shut ? ' shut' : ''}" data-g="${forgeTab + G.k}" role="button" tabindex="0">${G.bar ? `<img src="${ICON[G.bar].url}" alt="">` : ''}<span>${G.name}</span>${G.bar ? `<small>${reagHave(G.bar)} barras</small>` : ''}<i aria-hidden="true"></i></div>`;
    if (shut) return head;
    return head + items.map(it => `<div class="pr${it.id === sel ? ' on' : ''}${it.n > 0 ? ' can' : ''}" data-k="${it.id}"${forgeTab === 'craft' ? ' data-tip="1"' : ''} role="option" aria-selected="${it.id === sel}" tabindex="0"><img src="${ICON[it.out].url}" alt=""><span>${it.name}</span>${it.n > 0 ? `<em>[${it.n}]</em>` : ''}</div>`).join('');
  }).join('') || '<p class="pnone">Nenhuma receita com esse nome.</p>';
  // the chosen recipe
  let max, busy, body, verb;
  if (forgeTab === 'smelt') {
    const id = sel, r = FURN[id], bar = ITEMS[r.bar];
    $('pdIcon').src = ICON[r.bar].url; $('pdName').textContent = bar.name; $('pdName').style.color = ''; $('pdSub').textContent = `Fornalha · ${dec1(r.t)} s por barra`;
    body = `<p class="pdesc">${bar.desc || 'Metal pronto para a bigorna.'}</p><h5>Materiais por barra</h5><ul class="preag">${reagRow(id, r.n, furHas(id))}${reagRow('carvao', 1, furHas('carvao'))}</ul>`;
    max = smeltMax(id); busy = furnace.on; verb = 'Fundir';
    const ld = furnace.ore || furnace.fuel || furnace.out;
    $('pdNote').textContent = furnace.on ? (furnace.ore && furnace.ore.id !== id ? `A fornalha está fundindo ${ITEMS[FURN[furnace.ore.id].bar].name.toLowerCase()}. Fundir esta receita troca o minério.` : 'A fornalha continua acesa se você sair.')
      : ld ? `Ficou na fornalha: ${[furnace.ore, furnace.fuel, furnace.out].filter(Boolean).map(q => `${q.n}× ${ITEMS[q.id].name.toLowerCase()}`).join(', ')} (mochila cheia).` : max ? '' : furHas(id) < r.n ? `Você precisa de ${r.n} ${ITEMS[id].name.toLowerCase()} por barra.` : 'Falta carvão. O Odo, na taverna, vende.';
  } else {
    const rc = RECIPES.find(q => q.id === sel), it = ITEMS[rc.id];
    $('pdIcon').src = ICON[rc.id].url; $('pdName').textContent = it.name; $('pdName').style.color = RAR_COL[0]; $('pdSub').textContent = `Bigorna · ${dec1(anvilTime(rc))} s por peça`;
    body = `<div class="tipbox pdtip">${tipHTML(mkItem(rc.id, 0), { k: 'inv' }, '')}</div><h5>Materiais</h5><ul class="preag">${reagRow(rc.bar, rc.n, reagHave(rc.bar))}</ul>`;
    max = Math.floor(reagHave(rc.bar) / rc.n); busy = !!anvil; verb = 'Forjar';
    $('pdNote').textContent = anvil ? (anvil.rc.id !== rc.id ? `A bigorna está ocupada com ${ITEMS[anvil.rc.id].name.toLowerCase()}.` : 'Se você sair, a peça que está na bigorna é cancelada e as barras voltam.') : max ? '' : `Você precisa de ${rc.n} ${ITEMS[rc.bar].name.toLowerCase()}.`;
  }
  $('pdBody').innerHTML = body;
  forgeQty = Math.max(1, Math.min(forgeQty, Math.max(1, max)));
  $('pdQty').value = forgeQty;
  const mk = $('btnMake'); mk.textContent = busy ? 'Parar' : verb; mk.classList.toggle('stop', busy); mk.disabled = !busy && max < 1;
  const all = $('btnMakeAll'); all.textContent = `${verb} todos [${max}]`; all.disabled = max < 1;
  $('btnQtyDn').disabled = forgeQty <= 1; $('btnQtyUp').disabled = forgeQty >= max;
}
function recipeTip(e, id) {
  const tip = $('tip'), key = 'rec|' + id;
  if (tip._key !== key) { tip.innerHTML = tipHTML(mkItem(id, 0), { k: 'inv' }, ''); tip._key = key; }
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 16, y = e.clientY + 14;
  if (x + w > innerWidth - 8) x = e.clientX - w - 12; if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}
