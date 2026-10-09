'use strict';

/* ================= inventory screen ================= */
let invBuilt = false, drag = null;
const pct = v => Math.round(v * 100) + '%';
const signPct = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.round(Math.abs(v) * 100) + '%';
const secs = v => v.toFixed(2).replace('.', ',') + ' s';
function openInv() {
  if (state !== 'play' || pl.dead) return;
  buildInvUI();
  state = 'inv'; mouse.l = mouse.r = false; pl.shieldOn = false;
  $('inv').hidden = false; hideTip(); refreshInv(true);
}
function closeInv() { $('inv').hidden = true; hideTip(); endDrag(); cancelHeld(); state = 'play'; last = performance.now(); saveTimer = Math.min(saveTimer, 1); }
// the inventory card is one element: it sits in its own overlay, or next to a merchant while a shop is open
function invVisible() { return !$('inv').hidden || (!!shopNpc && !$('shop').hidden) || (!!forgeNpc && !$('forge').hidden); }
function dockInv(where) { const c = document.querySelector('.invcard'); (where === 'shop' ? $('shop').querySelector('.inv') : where === 'forge' ? $('forge').querySelector('.inv') : $('inv')).appendChild(c); }
function buildInvUI() {
  if (invBuilt) return; invBuilt = true;
  // backpack grid on top (inv 8-37), separator, then the hotbar row: weapon, pickaxe and inv 0-7 (keys 1 to 0), like Minecraft
  document.querySelectorAll('.invcard .slot.eq').forEach(d => { d.innerHTML = '<img alt="" hidden><span class="lbl">' + d.dataset.label + '</span>' + (d.dataset.hk ? `<span class="hk">${d.dataset.hk}</span>` : ''); });
  for (let i = 0; i < INV_N; i++) { const hot = i < HB_BAG, d = document.createElement('div'); d.className = hot ? 'slot hot' : 'slot'; d.dataset.inv = String(i); d.innerHTML = '<img alt="" hidden><span class="n"></span>' + (hot ? `<span class="hk">${(i + 3) % 10}</span>` : ''); $(hot ? 'invHot' : 'invGrid').appendChild(d); }
  const root = $('inv'), card = document.querySelector('.invcard');
  card.addEventListener('pointerdown', onInvDown);
  card.addEventListener('pointermove', onInvHover);
  card.addEventListener('pointerleave', hideTip);
  card.addEventListener('contextmenu', e => e.preventDefault());
  root.addEventListener('click', e => { if (e.target === root) closeInv(); });
  addEventListener('pointerdown', onHeldDown, true);
  addEventListener('pointermove', onDragMove);
  addEventListener('pointerup', onDragUp);
  addEventListener('pointercancel', endDrag);
  $('btnSort').addEventListener('click', () => { cancelHeld(); sortInv(); sfx.equip(); });
  $('btnCloseInv').addEventListener('click', () => { if (state === 'inv') closeInv(); else if (shopNpc) { sfx.select(); backFromShop(); } else if (forgeNpc) { sfx.select(); backFromForge(); } });
}
$('char').addEventListener('pointermove', e => charTipAt(e.target));
$('char').addEventListener('pointerleave', () => charTipAt(null));
$('char').addEventListener('click', e => { if (e.target === $('char')) closeChar(); });
function refOf(el) {
  if (!el) return null;
  if (el.dataset.inv !== undefined) return { k: 'inv', i: +el.dataset.inv };
  if (el.dataset.eq) return { k: 'eq', s: el.dataset.eq };
  if (el.dataset.trash) return { k: 'trash' };
  if (el.dataset.fur) return { k: 'fur', s: el.dataset.fur };
  return null;
}
function itemAt(r) { if (!r) return null; if (r.k === 'fur') return furnace[r.s] || null; if (r.k === 'inv') return inv[r.i]; if (r.k === 'eq') return equip[r.s] || null; return null; }
function slotFits(id, s) { const it = ITEMS[id]; if (!it || !it.slot) return false; return s.startsWith('acc') ? it.slot === 'acc' : it.slot === s; }
function paintSlot(d, s, force) {
  const key = s ? (s.uid ? 'u' + s.uid : s.id + ':' + s.n) : '';
  if (!force && d._key === key) return; d._key = key;
  const img = d.querySelector('img'), n = d.querySelector('.n');
  if (s) { img.src = ICON[s.id].url; img.hidden = false; d.style.setProperty('--rc', RAR_COL[itemRar(s)]); d.classList.add('full'); }
  else { img.removeAttribute('src'); img.hidden = true; d.style.removeProperty('--rc'); d.classList.remove('full'); }
  if (n) n.textContent = s && s.n > 1 ? String(s.n) : '';
}
function refreshInv(force) {
  if (!invVisible()) return;
  document.querySelectorAll('.invcard .slot[data-inv]').forEach(d => { paintSlot(d, inv[+d.dataset.inv], force); d.classList.toggle('cur', +d.dataset.inv === hb.sel - 2); });
  document.querySelectorAll('.invcard .slot.eq').forEach(d => paintSlot(d, equip[d.dataset.eq] || null, force));
  document.querySelectorAll('#invHot .slot.eq').forEach(d => d.classList.toggle('cur', hb.sel === (d.dataset.eq === 'weapon' ? 0 : 1)));
  const sh = shopNpc && !$('shop').hidden ? SHOPS[shopNpc.id] : null;   // in a shop, grey out what this merchant won't buy
  document.querySelectorAll('.invcard .slot[data-inv]').forEach(d => { const q = inv[+d.dataset.inv]; d.classList.toggle('no', !!sh && !!q && (!sh.buys(q.id) || sellPrice(q) <= 0)); d.classList.toggle('armed', !!sh && !!q && sellArm === q.uid); });
  $('bagCount').textContent = `${inv.slice(HB_BAG).filter(Boolean).length} / ${INV_N - HB_BAG}`; $('bagGold').textContent = goldTxt(pl.gold);
  $('eqLvl').textContent = `Nível ${pl.lvl}`;
  const cv = $('dollCv'), x = cv.getContext('2d');
  compose(poseFor(0, 2.7, 0.9, 'idle', false)); x.clearRect(0, 0, 48, 44); x.drawImage(comp, OX - 18, OY - 12, 48, 44, 0, 0, 48, 44);
  invDirty = false;
}
const pct1 = v => (Math.round(v * 1000) / 10).toString().replace('.', ',') + '%';
