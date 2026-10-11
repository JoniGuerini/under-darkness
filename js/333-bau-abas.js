'use strict';

/* ================= the village chest's tabs, Path of Exile style (js/27-bau.js owns the chest itself; sizes, prices and colours in js/332-bau-abas-dados.js) =================
   The chest starts with one tab and can have as many as you buy. The + at the end of the row shows what the next tab
   costs and asks before spending (stashPreco: it stops rising at 5 mil). Tabs that don't fit the row scroll sideways:
   the arrows (or the mouse wheel over the row) move it, and the list button opens every tab in a column at the side.
   A right click or a double click on a tab opens its editor: name and colour.
   Clicking a tab with an item on the cursor just switches tabs (the item stays on the cursor); dragging an item and
   letting go over a tab drops it into that tab, stacking first, like Guardar tudo does. */
let stashTabsKey = '', stashPop = null;   // stashPop: { kind: 'buy' | 'edit', t }

const tabOf = i => Math.floor(i / STASH_PER);
const tabEl = el => el && el.closest ? el.closest('#stashTabs .aba') : null;

function drawStashTabs() {
  const nav = $('stashTabs'); if (!nav) return;
  const key = stashTab + '|' + stashTabs.map(t => t.name + ':' + t.cor).join('/');
  if (key === stashTabsKey) return; stashTabsKey = key;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const btn = (cls, t, i) => { const c = STASH_CORES[t.cor] || STASH_CORES[0];
    return `<button type="button" class="${cls}${i === stashTab ? ' on' : ''}" data-t="${i}" style="--a0:${c[1]};--a1:${c[2]};--a2:${c[3]}">${esc(t.name)}</button>`; };
  nav.innerHTML = stashTabs.map((t, i) => btn('aba', t, i)).join('');
  const list = $('stashList'); if (list) list.innerHTML = stashTabs.map((t, i) => btn('aba-item', t, i)).join('');
  fitStashTabs(true);
}
// arrows and list only when the tabs don't fit; the open tab is always scrolled into view
function fitStashTabs(show) {
  const nav = $('stashTabs'), bar = $('stashTabsBar'); if (!nav || !bar) return;
  bar.classList.remove('cheia'); if (nav.scrollWidth > nav.clientWidth + 1) bar.classList.add('cheia');
  if (show) { const a = nav.querySelector('.aba.on'); if (a) { const l = a.offsetLeft - nav.offsetLeft; if (l < nav.scrollLeft) nav.scrollLeft = l - 8; else if (l + a.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = l + a.offsetWidth - nav.clientWidth + 8; } }
  arrowsStashTabs();
}
function arrowsStashTabs() {
  const nav = $('stashTabs'); if (!nav) return;
  const [l, r] = document.querySelectorAll('#stashTabsBar .aba-seta');
  l.disabled = nav.scrollLeft <= 0; r.disabled = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 1;
}
function setStashTab(t) {
  if (t === stashTab || t < 0 || t >= stashTabs.length) return;
  if (held && held.r.k === 'chest' && held.el) { held.el.classList.remove('lifting'); held.el = null; }
  stashTab = t; sfx.select(); hideTip(); refreshStash(true);
  if (held && held.r.k === 'chest' && tabOf(held.r.i) === t) { const d = document.querySelector(`#stashGrid .slot[data-chest="${held.r.i}"]`); if (d) { held.el = d; d.classList.add('lifting'); } }
}

/* ---- the two little windows: buying a tab, editing one ---- */
function closeStashPop() { stashPop = null; for (const id of ['stashBuy', 'stashEdit']) { const e = $(id); if (e) e.hidden = true; } }
function placePop(pop, anchor) {   // just under what was clicked, kept inside the chest's window
  const p = pop.parentElement.getBoundingClientRect(), a = anchor.getBoundingClientRect();
  pop.hidden = false;
  const w = pop.offsetWidth, x = clamp(a.left + a.width / 2 - w / 2 - p.left, 4, p.width - w - 4);
  pop.style.left = Math.round(x) + 'px'; pop.style.top = Math.round(a.bottom - p.top + 6) + 'px';
}
function openBuyPop(anchor) {
  const cost = stashPreco(stashTabs.length), can = pl.gold >= cost;
  stashPop = { kind: 'buy' };
  $('stashBuyCost').innerHTML = coinTag(cost.toLocaleString('pt-BR')); $('stashBuyCost').classList.toggle('cant', !can);
  $('stashBuyOk').disabled = !can;
  $('stashEdit').hidden = true; placePop($('stashBuy'), anchor); sfx.select();
}
function buyStashTab() {
  const cost = stashPreco(stashTabs.length);
  if (pl.gold < cost) { bad(null); return; }
  pl.gold -= cost; stashTabs.push(newTab(stashTabs.length));
  for (let i = 0; i < STASH_PER; i++) stash.push(null);
  STASH_N = stashTabs.length * STASH_PER;
  closeStashPop(); sfx.coin(); setStashTab(stashTabs.length - 1); invDirty = true;
  if (typeof saveGame === 'function') saveGame();
}
function openEditPop(t, anchor) {
  stashPop = { kind: 'edit', t }; setStashTab(t);
  const tab = stashTabs[t], inp = $('stashEditName');
  inp.value = tab.name; paintSwatches();
  $('stashBuy').hidden = true; placePop($('stashEdit'), document.querySelector(`#stashTabs .aba[data-t="${t}"]`) || anchor);
  inp.focus(); inp.select();
}
// every tab in a column docked beside the grid, inside the chest's own window (it takes its own room, never covering the
// inventory), like PoE's list; it stays open while you pick tabs from it, and the list button closes it again
let stashListOpen = false;
function toggleStashList(open = !stashListOpen) {
  stashListOpen = open; const col = $('stashList'); if (!col) return;
  col.hidden = !open; $('stashTabListBtn').classList.toggle('on', open);
  if (open) { const on = col.querySelector('.aba-item.on'); if (on) on.scrollIntoView({ block: 'nearest' }); }
  fitStashTabs(true);
}
function paintSwatches() {
  const t = stashPop && stashTabs[stashPop.t]; if (!t) return;
  $('stashEditCores').querySelectorAll('.cor').forEach(b => b.classList.toggle('on', +b.dataset.c === t.cor));
}
function endEdit() {   // an empty name goes back to the tab's number
  if (stashPop && stashPop.kind === 'edit') { const t = stashTabs[stashPop.t]; if (t && !t.name.trim()) t.name = String(stashPop.t + 1); invDirty = true; }
  closeStashPop(); drawStashTabs();
}

/* ---- moving an item into a tab by dropping it on the tab ---- */
function dropOnTab(r, t) {
  const A = itemAt(r); if (!A) return;
  if (r.k === 'chest' && tabOf(r.i) === t) return;
  if (r.k === 'inv') { if (!toStash(r.i, t)) return bad(null); sfx.equip(); changed(false); return; }
  if (r.k === 'chest') {
    const left = putInTab(A, t);
    if (stackMax(A.id) > 1) { if (left === A.n) return bad(null); if (left) A.n = left; else stash[r.i] = null; }
    else { if (left) return bad(null); stash[r.i] = null; }
    sfx.equip(); changed(false); return;
  }
  if (r.k === 'eq') { if (putInTab(A, t)) return bad(null); equip[r.s] = null; changed(true); return; }
  bad(null);
}

/* ---- wiring: the chest's window is built lazily (27), so the bar and the pops are added the first time it opens ---- */
const _buildStashUI = buildStashUI;
buildStashUI = function () {
  const first = !stashBuilt; _buildStashUI(); if (!first) return;
  const panel = $('stash').querySelector('.chestp'), nav = $('stashTabs'), bar = $('stashTabsBar');
  nav.insertAdjacentHTML('beforebegin', '<button type="button" class="aba-seta" data-d="-1" aria-label="Abas à esquerda">‹</button>');
  nav.insertAdjacentHTML('afterend', '<button type="button" class="aba-seta" data-d="1" aria-label="Abas à direita">›</button><button type="button" class="aba-lista" id="stashTabListBtn" aria-label="Todas as abas"><i></i><i></i><i></i></button><button type="button" class="aba-mais" id="stashTabAdd" aria-label="Nova aba">+</button>');
  const pops = document.createElement('div');
  pops.innerHTML = `<div class="bau-pop" id="stashBuy" hidden><h4>Nova aba</h4><p class="preco" id="stashBuyCost"></p>
      <div class="bts"><button type="button" class="ghost sm" id="stashBuyOk">Comprar</button><button type="button" class="ghost sm" id="stashBuyNo">Cancelar</button></div></div>
    <div class="bau-pop" id="stashEdit" hidden><input type="text" id="stashEditName" maxlength="${STASH_NAME_MAX}" spellcheck="false" autocomplete="off" aria-label="Nome da aba">
      <div class="cores" id="stashEditCores">${STASH_CORES.map((c, i) => `<button type="button" class="cor" data-c="${i}" aria-label="${c[0]}" style="--a0:${c[1]};--a1:${c[2]};--a2:${c[3]}"></button>`).join('')}</div>
      <div class="bts"><button type="button" class="ghost sm" id="stashEditOk">OK</button></div></div>`;
  while (pops.firstChild) panel.appendChild(pops.firstChild);
  const grid = $('stashGrid'), corpo = document.createElement('div'); corpo.className = 'bau-corpo';
  grid.before(corpo); corpo.appendChild(grid); corpo.insertAdjacentHTML('beforeend', '<div class="bau-lista" id="stashList" hidden></div>');
  bar.addEventListener('click', e => {
    const a = tabEl(e.target); if (a) { if (!(stashPop && stashPop.kind === 'edit' && stashPop.t === +a.dataset.t)) closeStashPop(); setStashTab(+a.dataset.t); drawStashTabs(); return; }
    const seta = e.target.closest('.aba-seta'); if (seta) { nav.scrollBy({ left: +seta.dataset.d * nav.clientWidth * 0.75, behavior: 'smooth' }); sfx.select(); return; }
    const lst = e.target.closest('#stashTabListBtn'); if (lst) { closeStashPop(); toggleStashList(); sfx.select(); return; }
    const plus = e.target.closest('#stashTabAdd'); if (plus) { if (stashPop && stashPop.kind === 'buy') closeStashPop(); else openBuyPop(plus); }
  });
  nav.addEventListener('scroll', arrowsStashTabs);
  nav.addEventListener('wheel', e => { if (nav.scrollWidth <= nav.clientWidth) return; e.preventDefault(); nav.scrollLeft += e.deltaY || e.deltaX; }, { passive: false });
  $('stashList').addEventListener('click', e => { const b = e.target.closest('.aba-item'); if (!b) return; closeStashPop(); setStashTab(+b.dataset.t); drawStashTabs(); const on = $('stashList').querySelector('.aba-item.on'); if (on) on.scrollIntoView({ block: 'nearest' }); });
  $('stashList').addEventListener('pointerdown', e => { const b = e.target.closest('.aba-item'); if (b && e.button === 2) { e.preventDefault(); openEditPop(+b.dataset.t, b); } });
  nav.addEventListener('dblclick', e => { const a = tabEl(e.target); if (a) openEditPop(+a.dataset.t, a); });
  nav.addEventListener('pointerdown', e => { const a = tabEl(e.target); if (a && e.button === 2) { e.preventDefault(); openEditPop(+a.dataset.t, a); } });
  $('stashBuyOk').addEventListener('click', buyStashTab);
  $('stashBuyNo').addEventListener('click', () => { sfx.select(); closeStashPop(); });
  const inp = $('stashEditName');
  inp.addEventListener('input', () => { const t = stashPop && stashTabs[stashPop.t]; if (t) { t.name = inp.value.slice(0, STASH_NAME_MAX); drawStashTabs(); } });
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); endEdit(); } });
  inp.addEventListener('keyup', e => e.stopPropagation());
  $('stashEditCores').addEventListener('click', e => { const b = e.target.closest('.cor'), t = stashPop && stashTabs[stashPop.t]; if (!b || !t) return; t.cor = +b.dataset.c; paintSwatches(); drawStashTabs(); sfx.select(); invDirty = true; });
  $('stashEditOk').addEventListener('click', () => { sfx.select(); endEdit(); });
  // a press anywhere else in the window closes an open pop (finishing the edit)
  panel.addEventListener('pointerdown', e => { if (!stashPop || (e.target.closest && e.target.closest('.bau-pop, #stashTabAdd'))) return; if (tabEl(e.target) && stashPop.kind === 'edit') return; stashPop.kind === 'edit' ? endEdit() : closeStashPop(); }, true);
};
const _refreshStash = refreshStash;
refreshStash = function (force) { if (!stashOpen()) return; drawStashTabs(); _refreshStash(force); };
const _closeTalkAbas = closeTalk;
closeTalk = function () { if (stashPop) { if (stashPop.kind === 'edit') endEdit(); else closeStashPop(); } _closeTalkAbas(); };

// registered at load, so these run before the inventory's own held/drag handlers (js/21, built on first open)
addEventListener('pointerdown', e => {
  if (!held || !stashOpen() || e.button !== 0) return;
  const a = tabEl(e.target); if (!a) return;
  e.preventDefault(); e.stopImmediatePropagation(); closeStashPop(); setStashTab(+a.dataset.t); drawStashTabs();
}, true);
let tabOver = null;
addEventListener('pointermove', e => {
  const a = drag && drag.moved && stashOpen() ? tabEl(document.elementFromPoint(e.clientX, e.clientY)) : null;
  if (a !== tabOver) { if (tabOver) tabOver.classList.remove('over'); tabOver = a; if (a) a.classList.add('over'); }
});
addEventListener('pointerup', e => {
  if (tabOver) { tabOver.classList.remove('over'); tabOver = null; }
  if (!drag || !drag.moved || !stashOpen()) return;
  const a = tabEl(document.elementFromPoint(e.clientX, e.clientY)); if (!a) return;
  e.stopImmediatePropagation(); const d = drag; endDrag(); dropOnTab(d.r, +a.dataset.t); refreshInv();
}, true);
// Esc closes an open pop before it closes the chest
addEventListener('keydown', e => {
  if (!stashPop || !stashOpen() || e.code !== 'Escape') return;
  e.preventDefault(); e.stopImmediatePropagation(); stashPop.kind === 'edit' ? endEdit() : closeStashPop();
}, true);
