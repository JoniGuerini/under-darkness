'use strict';

/* ---- the shop screen: the merchant's shelves on the left, the counter with the chosen piece on the right ----
   The stock sits on shelves grouped by kind (one plank per group). Click a piece to put it on the counter, where it
   shows its numbers and the buy button; hovering only previews it. Right click or double click on a shelf buys one
   (Shift buys 5 of what never runs out). Selling: drag or drop an item of yours anywhere on the window, or Shift +
   right click it in the bag. Looks: css/vitrine.css, dressed per villager by the theme vars of css/temas-npc.css.
   2026-10-14: what you sell no longer goes onto the merchant's wall (selling a dozen pieces to Grimaldo used to push his
   whole stock out). Each villager keeps your last 10 sales in the "Vendidos" tab, where they can be bought back for
   what you got for them; the "Estoque" tab is the merchant's own wall, untouched. */
let shopBuilt = false, vSel = null, vHover = null, vQty = 1, vKey = '', vFeatKey = '', vTab = 'stock';
const SOLD_MAX = 10;
// the sales history of the villager you are talking to (lives in `stock`, so a load or a new game clears it)
const soldList = id => { const v = stock.vendidos || (stock.vendidos = {}); return v[id] || (v[id] = []); };
const shopList = () => !shopNpc ? [] : vTab === 'sold' ? soldList(shopNpc.id) : (stock[shopNpc.id] || []);
function setShopTab(t) {
  if (t === vTab) return; vTab = t; vSel = vHover = null; vQty = 1; vKey = ''; sfx.select();
  document.querySelectorAll('#shop .vtabs .tab').forEach(b => { b.classList.toggle('on', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
  refreshShop(); const g = $('shopGrid'); g.scrollTop = 0; g.dispatchEvent(new Event('scroll'));
}
// "Renovar" (2026-10-14): only the merchants whose wall is rolled (Grimaldo's gear, Aurélia's staves and tomes) get a
// fresh one now, for a little gold that grows with the hero's level; the other villagers sell the same things every day
const SHOP_REROLL = { ferreiro: true, maga: true };
const rerollCost = () => 20 + 10 * pl.lvl;
function rerollShop() {
  if (!shopNpc || !SHOP_REROLL[shopNpc.id]) return;
  const c = rerollCost(), b = $('btnReroll'); if (pl.gold < c) { bad(b); floatShop('Ouro insuficiente'); return; }
  const id = shopNpc.id, keep = Object.assign({}, stock);
  pl.gold -= c; restock();
  for (const k in keep) if (k !== id) stock[k] = keep[k];   // only this merchant's wall changes
  if (id === 'maga' && typeof magaScrolls === 'function') stock.maga = magaScrolls(false).concat((stock.maga || []).filter(g => !g.inf));
  vSel = vHover = null; vQty = 1; vKey = ''; sfx.coin(); refreshShop();
  const g = $('shopGrid'); g.scrollTop = 0; g.dispatchEvent(new Event('scroll'));
}
const SHELVES = [
  ['scroll', 'Pergaminhos'], ['magicw', 'Cajados e varinhas'], ['weapon', 'Armas'], ['tome', 'Tomos'],
  ['armor', 'Armaduras e escudos'], ['acc', 'Anéis e amuletos'], ['tool', 'Ferramentas'], ['potion', 'Poções'], ['food', 'Da cozinha'], ['goods', 'Mercadorias']
];
function shelfOf(s) {
  const it = ITEMS[s.id], mg = typeof isMagicItem === 'function' && isMagicItem(s.id);
  if (it.scroll || it.spell) return 'scroll';
  if (it.slot === 'weapon') return mg ? 'magicw' : 'weapon';
  if (it.slot === 'shield') return mg ? 'tome' : 'armor';
  if (it.slot === 'head' || it.slot === 'body' || it.slot === 'feet') return 'armor';
  if (it.slot) return it.slot === 'acc' ? 'acc' : 'tool';
  if (it.use) return 'potion';
  if (it.food) return 'food';
  return 'goods';
}
const coinURL = (() => { let u = ''; return () => { if (!u) { const a = ICON_ART.coin, c = mk(9, 9); c.getContext('2d').drawImage(fromRows(a[0], a[1]), 1, 1); try { u = outlined(c).toDataURL(); } catch (e) { } } return u; }; })();
// the rays behind rare pieces, already faded towards the edge: one picture per rarity colour, made once
const raysURL = (() => { const c = {}; return col => c[col] || (c[col] = (() => {
  const S = 150, cv = mk(S, S), x = cv.getContext('2d'), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, col + '66'); g.addColorStop(0.2, col + '4d'); g.addColorStop(1, col + '00'); x.fillStyle = g;
  for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; x.beginPath(); x.moveTo(S / 2, S / 2); x.arc(S / 2, S / 2, S / 2, a, a + 0.13); x.closePath(); x.fill(); }
  try { return `url(${cv.toDataURL()})`; } catch (e) { return 'none'; }
})()); })();
const coinTag = v => `<img class="vc" src="${coinURL()}" alt="">${v}`;

function buildShopUI() {
  if (shopBuilt) return; shopBuilt = true;
  const root = $('shop');
  root.addEventListener('click', onShopClick);
  root.addEventListener('dblclick', onShopDbl);
  root.addEventListener('pointerdown', onShopDown);
  root.addEventListener('pointermove', onShopHover);
  root.addEventListener('pointerleave', () => { setHover(null); showSell(null); });
  root.addEventListener('contextmenu', e => e.preventDefault());
  $('btnShopBack').addEventListener('click', () => { sfx.select(); backFromShop(); });
  $('vfMinus').addEventListener('click', () => stepQty(-1));
  $('vfPlus').addEventListener('click', () => stepQty(1));
  $('btnBuy').addEventListener('click', () => { const en = vSel; if (!en) return; if (buyEntry(en, en.inf ? vQty : 1, $('vfStage'))) sfx.select(); });
  if (typeof customScroll === 'function') customScroll($('shopGrid'));
}
function openShop(n) {
  if (dayNow() !== shopDay || !stock.ferreiro) restock();
  buildShopUI(); buildInvUI(); shopNpc = n; sellArm = null; dockInv('shop');
  $('shopTitle').textContent = SHOPS[n.id].title;
  vSel = null; vHover = null; vQty = 1; vKey = ''; vFeatKey = ''; vTab = 'sold'; setShopTab('stock');
  $('talk').hidden = true; $('shop').hidden = false; refreshShop();
  const g = $('shopGrid'); g.scrollTop = 0; g.dispatchEvent(new Event('scroll'));
}
function backFromShop() { cancelHeld(); endDrag(); hideTip(); dockInv(false); $('shop').hidden = true; showSell(null); sellArm = null; vSel = vHover = null; $('talk').hidden = false; talkMenu(shopNpc, pickLine(['Mais alguma coisa?', 'Bom negócio. Para os dois, espero.', 'Volte sempre.'])); shopNpc = null; }

/* the shelves: rebuilt only when the stock changes; otherwise only the classes move */
function refreshShop() {
  if (!shopNpc) return;
  const st = shopList(), sold = vTab === 'sold';
  const rb = $('btnReroll'); if (rb) { const c = rerollCost(), on = !sold && !!SHOP_REROLL[shopNpc.id], h = `Renovar ${coinTag(c)}`; rb.hidden = !on; if (rb._h !== h) { rb._h = h; rb.innerHTML = h; } rb.classList.toggle('cant', c > pl.gold); }
  const tb = $('shopTabSold'); if (tb) { const n = soldList(shopNpc.id).length, t = n ? `Vendidos (${n})` : 'Vendidos'; if (tb.textContent !== t) tb.textContent = t; }
  if (vSel && !st.includes(vSel)) vSel = st[Math.min(vSel._i || 0, st.length - 1)] || null;   // bought: the next piece takes its place
  if (vHover && !st.includes(vHover)) vHover = null;
  const key = vTab + '|' + shopNpc.id + '|' + st.map(e => (e.s.uid || e.s.id) + ':' + e.price).join(',');
  const g = $('shopGrid');
  if (key !== vKey) {
    vKey = key;
    const big = st.length <= 4, per = big ? 3 : 4, groups = new Map();
    st.forEach((e, i) => { e._i = i; const k = shelfOf(e.s); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); });
    let h = '';
    for (const [k, name] of SHELVES) {
      const ids = groups.get(k); if (!ids) continue;
      for (let r = 0; r < ids.length; r += per) {
        const row = ids.slice(r, r + per);
        h += `<div class="vshelf">${r === 0 ? `<span class="vlab">${name}</span>` : ''}<div class="vrow">`;
        for (const i of row) {
          const e = st[i], rar = itemRar(e.s);
          h += `<div class="vn r${Math.max(0, rar)}" data-shop="${i}" style="--rc:${RAR_COL[rar]}"><i class="vglow"></i><img src="${ICON[e.s.id].url}" alt="">${e.s.n > 1 && !e.inf ? `<b class="vcnt">${e.s.n}</b>` : ''}<span class="vtag">${coinTag(e.price)}</span></div>`;
        }
        for (let j = row.length; j < per; j++) h += '<div class="vn vnone"></div>';
        h += '</div><i class="vplank"></i></div>';
      }
    }
    if (!h && sold) h = '<p class="vempty">Nada vendido</p>';
    g.innerHTML = h; g.classList.toggle('vbig', big);
    if (!vSel) { const f = g.querySelector('.vn[data-shop]'); vSel = f ? st[+f.dataset.shop] : null; }   // the counter starts with the first piece on the wall
    g.dispatchEvent(new Event('scroll'));
  }
  g.querySelectorAll('.vn[data-shop]').forEach(d => { const e = st[+d.dataset.shop]; d.classList.toggle('cant', !!e && e.price > pl.gold); d.classList.toggle('on', e === vSel); });
  $('shopGold').innerHTML = coinTag(pl.gold);
  renderFeat();
  invDirty = true; refreshInv(true);
}
/* the counter: the piece on show (the hovered one, else the chosen one) */
function renderFeat() {
  const en = vHover || vSel, st = $('vfStage');
  const key = en ? (en.s.uid || en.s.id) + '|' + en.price + '|' + pl.gold + '|' + vQty + '|' + (en === vSel) + '|' + equipKey() : '';
  if (key === vFeatKey) return; vFeatKey = key;
  $('shopFeat').classList.toggle('empty', !en);
  if (!en) { $('vfIcon').hidden = true; $('vfInfo').innerHTML = ''; $('vfBuy').hidden = true; st.className = 'vstage'; return; }
  const rar = itemRar(en.s);
  st.className = 'vstage r' + Math.max(0, rar); st.style.setProperty('--rc', RAR_COL[rar]);
  if (rar >= 2) st.style.setProperty('--rays', raysURL(RAR_COL[rar]));
  const ic = $('vfIcon'); ic.src = ICON[en.s.id].url; ic.hidden = false;
  $('vfInfo').innerHTML = tipHTML(en.s, { k: 'inv' }, '');
  const n = en.inf ? vQty : 1, tot = en.price * n, can = tot <= pl.gold;
  $('vfBuy').hidden = false;
  $('vfQty').hidden = !en.inf; $('vfN').textContent = String(vQty);
  $('vfMinus').disabled = vQty <= 1; $('vfPlus').disabled = vQty >= 99;
  const p = $('vfPrice'); p.innerHTML = coinTag(tot); p.classList.toggle('cant', !can);
  const b = $('btnBuy'); b.disabled = !can; b.textContent = !can ? 'Falta ouro' : en.sold ? 'Recomprar' : 'Comprar';
  $('shopFeat').classList.toggle('preview', en !== vSel);
}
const equipKey = () => ['weapon', 'shield', 'head', 'body', 'feet', 'tool', 'acc1', 'acc2'].map(k => equip[k] ? equip[k].uid || equip[k].id : '').join(',');
function setHover(en) { if (vHover === en) return; vHover = en; renderFeat(); }
function selectEntry(en) { if (!en || vSel === en) return; vSel = en; vQty = 1; sfx.select(); refreshShop(); }
function stepQty(d) { if (!vSel || !vSel.inf) return; const q = clamp(vQty + d, 1, 99); if (q === vQty) return; vQty = q; sfx.select(); renderFeat(); }
const entryAt = el => { const d = el && el.closest && el.closest('#shopGrid .vn[data-shop]'); return d && shopNpc ? [shopList()[+d.dataset.shop], d] : [null, null]; };

function buyEntry(en, n, el) {
  const st = shopList(), i = st.indexOf(en); if (i < 0) return false;
  if (en.inf) n = Math.min(n, Math.floor(pl.gold / en.price));
  if (n < 1) { bad(el); floatShop('Ouro insuficiente'); return false; }
  if (en.sold && !ITEMS[en.s.id].slot) {   // a lot sold back: all of it or nothing
    if (en.price > pl.gold) { bad(el); floatShop('Ouro insuficiente'); return false; }
    const left = addItem(en.s.id, en.s.n); if (left > 0) { if (left < en.s.n) removeItem(en.s.id, en.s.n - left); bad(el); floatShop('Mochila cheia'); return false; }
    pl.gold -= en.price; st.splice(i, 1); if (vHover === en) vHover = null;
  } else if (en.inf) { const left = addItem(en.s.id, n), got = n - left; if (got < 1) { bad(el); floatShop('Mochila cheia'); return false; } pl.gold -= got * en.price; }
  else { if (!addInst(en.s)) { bad(el); floatShop('Mochila cheia'); return false; } pl.gold -= en.price; st.splice(i, 1); if (vHover === en) vHover = null; }
  sfx.coin(); invDirty = true; refreshShop();
  const s = $('vfStage'); s.classList.remove('sold'); void s.offsetWidth; s.classList.add('sold');
  return true;
}
function onShopClick(e) {
  if (e.target === $('shop')) { backFromShop(); return; }
  if (e.target.closest && e.target.closest('#btnReroll')) { rerollShop(); return; }
  const tab = e.target.closest && e.target.closest('#shop .vtabs .tab'); if (tab) { setShopTab(tab.dataset.tab); return; }
  const [en] = entryAt(e.target); if (en) selectEntry(en);
}
function onShopDbl(e) { const [en, d] = entryAt(e.target); if (en && !held) buyEntry(en, 1, d); }
function onShopDown(e) {
  if (e.button !== 2 || held) return;
  const [en, d] = entryAt(e.target); if (!en) return;
  e.preventDefault(); buyEntry(en, en.inf && e.shiftKey ? 5 : 1, d);
}
function sellRef(r, el, whole) {
  if (!shopNpc) return;
  if (r.k !== 'inv') { bad(el); floatShop('Tire o item antes de vender'); return; }
  const i = r.i, s = inv[i]; if (!s) return;
  const sh = SHOPS[shopNpc.id], p = sellPrice(s);
  if (!sh.buys(s.id) || p <= 0) { bad(el); floatShop(`${shopNpc.name} não compra isso`); return; }
  if (ITEMS[s.id].slot) {
    if (itemRar(s) >= 2 && sellArm !== s.uid) { sellArm = s.uid; refreshShop(); floatShop('Item raro: repita para vender'); return; }
    inv[i] = null; pl.gold += p; soldAdd({ s, price: p, sold: true });
  } else { const n = whole ? s.n : 1; s.n -= n; if (s.n <= 0) inv[i] = null; pl.gold += p * n; soldAdd({ s: { id: s.id, n }, price: p * n, sold: true }); }
  sellArm = null; sfx.coin(); invDirty = true; showSell(null); refreshShop(); hideTip();
}
// the newest sale first; past SOLD_MAX the oldest is gone for good
function soldAdd(en) { const L = soldList(shopNpc.id); L.unshift(en); if (L.length > SOLD_MAX) L.length = SOLD_MAX; }
function floatShop(t) { const g = $('shopGold'); g.textContent = t; g.classList.add('warn'); clearTimeout(floatShop._t); floatShop._t = setTimeout(() => { g.classList.remove('warn'); if (shopNpc) g.innerHTML = coinTag(pl.gold); }, 1200); }

/* hovering: the shelf previews on the counter; carrying one of your items over the window shows what it fetches */
function onShopHover(e) {
  const carry = held ? held : drag && drag.moved ? drag : null;
  if (carry) { showSell(e.target.closest && e.target.closest('#shop .vendor') ? itemAt(carry.r) : null, carry.r); setHover(null); return; }
  showSell(null);
  const [en] = entryAt(e.target);
  if (en) setHover(en); else if (!(e.target.closest && e.target.closest('#shopGrid'))) setHover(null);   // the gaps between pieces keep the preview
}
function showSell(s, r) {
  const v = $('vSell'); if (!v) return;
  if (!s || !shopNpc) { if (!v.hidden) { v.hidden = true; $('shop').querySelector('.vendor').classList.remove('selling'); } return; }
  const p = sellPrice(s), ok = r.k === 'inv' && SHOPS[shopNpc.id].buys(s.id) && p > 0, n = ITEMS[s.id].slot ? 1 : s.n || 1;
  const key = (s.uid || s.id) + '|' + n + '|' + ok;
  if (v._k !== key || v.hidden) {
    v._k = key;
    v.innerHTML = `<img class="vsi" src="${ICON[s.id].url}" alt=""><span>${ok ? `Vender${n > 1 ? ` ${n}` : ''}` : r.k !== 'inv' ? 'Tire o item antes de vender' : `${shopNpc.name} não compra isso`}</span>${ok ? `<b>${coinTag(p * n)}</b>` : ''}`;
    v.classList.toggle('no', !ok);
  }
  v.hidden = false; $('shop').querySelector('.vendor').classList.add('selling');
}
function hideShopTip() { setHover(null); }
