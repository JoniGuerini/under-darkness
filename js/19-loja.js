'use strict';

/* ---- the shop screen ---- */
let shopBuilt = false;
function buildShopUI() {
  if (shopBuilt) return; shopBuilt = true;
  const g = $('shopGrid'); for (let i = 0; i < 12; i++) { const d = document.createElement('div'); d.className = 'slot'; d.dataset.shop = String(i); d.innerHTML = '<img alt="" hidden><span class="price"></span>'; g.appendChild(d); }
  const root = $('shop');
  root.addEventListener('click', onShopClick);
  root.addEventListener('pointerdown', onShopDown);
  root.addEventListener('pointermove', onShopHover);
  root.addEventListener('pointerleave', hideShopTip);
  root.addEventListener('contextmenu', e => e.preventDefault());
  $('btnShopBack').addEventListener('click', () => { sfx.select(); backFromShop(); });
}
function openShop(n) {
  if (dayNow() !== shopDay || !stock.ferreiro) restock();
  buildShopUI(); buildInvUI(); shopNpc = n; sellArm = null; dockInv('shop');
  $('shopTitle').textContent = SHOPS[n.id].title; $('shopHint').textContent = SHOPS[n.id].hint;
  $('talk').hidden = true; $('shop').hidden = false; refreshShop();
}
function backFromShop() { cancelHeld(); endDrag(); hideTip(); dockInv(false); $('shop').hidden = true; hideShopTip(); sellArm = null; $('talk').hidden = false; talkMenu(shopNpc, pickLine(['Mais alguma coisa?', 'Bom negócio. Para os dois, espero.', 'Volte sempre.'])); shopNpc = null; }
function refreshShop() {
  if (!shopNpc) return;
  const st = stock[shopNpc.id] || [], sh = SHOPS[shopNpc.id];
  document.querySelectorAll('#shopGrid .slot').forEach(d => { const e = st[+d.dataset.shop]; paintSlot(d, e ? e.s : null, true); d.querySelector('.price').textContent = e ? String(e.price) : ''; d.classList.toggle('cant', !!e && e.price > pl.gold); });
  $('shopGold').textContent = goldTxt(pl.gold); $('shopSub').textContent = shopNpc.name;
  invDirty = true; refreshInv(true);
}
function onShopClick(e) {
  if (e.target === $('shop')) { backFromShop(); return; }
  const el = e.target.closest && e.target.closest('#shopGrid .slot'); if (!el || !shopNpc) return;
  if ((stock[shopNpc.id] || [])[+el.dataset.shop]) floatShop('Botão direito compra');
}
function onShopDown(e) {
  if (e.button !== 2 || held) return;
  const el = e.target.closest && e.target.closest('#shopGrid .slot'); if (!el || !shopNpc) return;
  e.preventDefault();
  const st = stock[shopNpc.id], i = +el.dataset.shop, en = st[i]; if (!en) return;
  let n = en.inf && e.shiftKey ? 5 : 1; if (en.inf) n = Math.min(n, Math.floor(pl.gold / en.price));
  if (n < 1) { bad(el); floatShop('Ouro insuficiente'); return; }
  if (en.inf) { const left = addItem(en.s.id, n), got = n - left; if (got < 1) { bad(el); floatShop('Mochila cheia'); return; } pl.gold -= got * en.price; }
  else { if (!addInst(en.s)) { bad(el); floatShop('Mochila cheia'); return; } pl.gold -= en.price; st.splice(i, 1); }
  sfx.coin(); invDirty = true; refreshShop(); hideShopTip();
}
function sellRef(r, el, whole) {
  if (!shopNpc) return;
  if (r.k !== 'inv') { bad(el); floatShop('Tire o item antes de vender'); return; }
  const i = r.i, s = inv[i]; if (!s) return;
  const sh = SHOPS[shopNpc.id], p = sellPrice(s);
  if (!sh.buys(s.id) || p <= 0) { bad(el); floatShop(`${shopNpc.name} não compra isso`); return; }
  if (ITEMS[s.id].slot) {
    if (itemRar(s) >= 2 && sellArm !== s.uid) { sellArm = s.uid; refreshShop(); floatShop('Item raro: repita para vender'); return; }
    inv[i] = null; pl.gold += p; if (shopNpc.id === 'ferreiro' && s.uid) { s.uid = UID++; stock.ferreiro.push({ s, price: itemValue(s) }); if (stock.ferreiro.length > 12) stock.ferreiro.shift(); }
  } else { const n = whole ? s.n : 1; s.n -= n; if (s.n <= 0) inv[i] = null; pl.gold += p * n; }
  sellArm = null; sfx.coin(); invDirty = true; refreshShop(); hideTip();
}
function floatShop(t) { const g = $('shopGold'); g.textContent = t; g.style.color = '#ffb4a8'; setTimeout(() => { g.style.color = ''; if (shopNpc) g.textContent = goldTxt(pl.gold); }, 1200); }
function onShopHover(e) { const el = e.target.closest && e.target.closest('.slot'); if (!el) { hideShopTip(); return; } showShopTip(el, e); }
function showShopTip(el, e) {
  if (!shopNpc) return;
  let s = null, act = '';
  if (el.dataset.shop !== undefined) { const en = (stock[shopNpc.id] || [])[+el.dataset.shop]; if (en) { s = en.s; act = `Botão direito: comprar por ${goldTxt(en.price)}${en.inf ? ' · com Shift compra 5' : ''}${en.price > pl.gold ? ' · ouro insuficiente' : ''}`; } }
  else if (false) {
    if (s) { const p = sellPrice(s); act = !SHOPS[shopNpc.id].buys(s.id) || p <= 0 ? `${shopNpc.name} não compra isso` : sellArm === s.uid ? `Clique de novo para vender por ${goldTxt(p)}` : ITEMS[s.id].slot ? `Vender por ${goldTxt(p)}` : `Vender por ${goldTxt(p)}${s.n > 1 ? ` cada · Shift + clique vende ${s.n} por ${goldTxt(p * s.n)}` : ''}`; }
  }
  const tip = $('shopTip'); if (!s) { hideShopTip(); return; }
  tip.innerHTML = tipHTML(s, { k: 'inv' }, act); tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 16, y = e.clientY + 14;
  if (x + w > innerWidth - 8) x = e.clientX - w - 12; if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}
function hideShopTip() { const t = $('shopTip'); if (t) t.hidden = true; }
