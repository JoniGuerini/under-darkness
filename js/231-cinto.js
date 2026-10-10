'use strict';

/* ================= cinto: três casas fora da barra de ação =================
   Pedido do Jonathan (2026-10-10): poção de vida e tocha ficam em duas casas ao lado do globo de vida, e a poção de
   mana numa casa ao lado do globo de mana; esses itens não ocupam mais a barra de ação.
   - `belt.pot` (qualquer poção de vida), `belt.torch` (tocha) e `belt.mana` (qualquer poção de mana): { id, n }.
   - O que chega (addItem) entra primeiro na casa certa; o que se gasta (removeItem) sai primeiro dela, e ela se
     completa sozinha com o que houver na mochila. countItem e canFit contam o cinto, então Q (tocha), R (poção),
     a alquimia, a forja e as lojas seguem funcionando sem mudar nada.
   - R bebe a poção de vida do cinto, T a de mana, Q põe tocha como antes. Clicar na casa de poção do HUD também bebe.
   - No inventário as três casas ficam numa fileira debaixo da barra: arrastar troca qual poção fica no cinto, botão
     direito devolve para a mochila (numa tocha da mochila, sobe para o cinto).
   - Salva em `cinto` no save. Saves antigos: as tochas e poções da mochila e da barra sobem para o cinto ao carregar.
   - As casas do HUD ficam coladas nos globos, na altura da barra de ação; se a tela é estreita e encostariam nela,
     sobem para cima da barra (`placeBelt`, só quando o tamanho muda).
   Carrega depois do 27, 95 e 172, antes do 24-boot. */

const BELT_K = ['pot', 'torch', 'mana'];
const BELT_GHOST = { pot: 'pocao', torch: 'tocha', mana: 'pocao_mana' };
let belt = { pot: null, torch: null, mana: null };
function beltKind(id) {
  if (id === 'tocha') return 'torch';
  const a = typeof ALQ !== 'undefined' && ALQ[id]; if (!a) return null;
  return a.kind === 'life' ? 'pot' : a.kind === 'mana' ? 'mana' : null;
}
const beltOf = id => { const k = beltKind(id), b = k && belt[k]; return b && b.id === id ? b : null; };
// completa a casa com o que houver na mochila (a barra primeiro, para liberar as casas dela)
function beltFill(k) {
  let b = belt[k];
  for (let i = 0; i < INV_N; i++) {
    const s = inv[i]; if (!s || beltKind(s.id) !== k) continue;
    if (!b) b = belt[k] = { id: s.id, n: 0 };
    if (s.id !== b.id) continue;
    const t = Math.min(s.n, stackMax(b.id) - b.n); if (t <= 0) break;
    b.n += t; s.n -= t; if (s.n <= 0) inv[i] = null; invDirty = true;
  }
}

/* ---- contar, guardar e gastar passam pelo cinto ---- */
const addBag0 = addItem;
// o que não cabe no cinto vai para a mochila de cima antes da fileira da barra
function addBag(id, n) {
  if (!beltKind(id)) return addBag0(id, n);
  const mx = stackMax(id);
  for (const s of inv) { if (n <= 0) break; if (s && s.id === id && s.n < mx) { const t = Math.min(n, mx - s.n); s.n += t; n -= t; } }
  for (let i = HB_BAG; i < INV_N && n > 0; i++) if (!inv[i]) { const t = Math.min(n, mx); inv[i] = { id, n: t }; n -= t; }
  invDirty = true;
  return n > 0 ? addBag0(id, n) : 0;
}
{ const _ci = countItem, _cf = canFit, _rm = removeItem;
  countItem = id => { const b = beltOf(id); return _ci(id) + (b ? b.n : 0); };
  canFit = id => { const k = beltKind(id), b = k && belt[k]; return !!k && (!b || (b.id === id && b.n < stackMax(id))) || _cf(id); };
  addItem = function (id, n = 1) {
    const k = beltKind(id);
    if (k && n > 0) {
      const b = belt[k], mx = stackMax(id);
      if (!b) { const t = Math.min(n, mx); belt[k] = { id, n: t }; n -= t; }
      else if (b.id === id && b.n < mx) { const t = Math.min(n, mx - b.n); b.n += t; n -= t; }
      invDirty = true;
    }
    return n > 0 ? addBag(id, n) : 0;
  };
  removeItem = function (id, n = 1) {
    const k = beltKind(id), b = beltOf(id);
    if (b) { const t = Math.min(n, b.n); b.n -= t; n -= t; if (b.n <= 0) belt[k] = null; invDirty = true; }
    const ok = n > 0 ? _rm(id, n) : true;
    if (k) beltFill(k);
    return ok;
  };
}

/* ---- beber pelo cinto ---- */
function beltDrink(k) {
  const b = belt[k]; if (!b || pl.dead) return false;
  if (k === 'pot') pl.potCD = 0;
  return alqDrink(b.id);
}
{ const _dp = drinkPotion; drinkPotion = function () {
  if (mouse.lPressed && typeof heldBag === 'function' && heldBag()) return _dp();   // frasco na mão, clique: o 95 cuida
  return belt.pot ? beltDrink('pot') : _dp();
}; }
HOOK.update.push(() => { if (pressed.KeyT) beltDrink('mana'); });

/* ---- no inventário: refOf / itemAt / moveItem / quickAction conhecem a casa do cinto ---- */
function beltGet(r) { return r.k === 'belt' ? belt[r.s] : r.k === 'inv' ? inv[r.i] : r.k === 'chest' ? stash[r.i] : null; }
function beltSet(r, v) { if (r.k === 'belt') belt[r.s] = v; else if (r.k === 'inv') inv[r.i] = v; else if (r.k === 'chest') stash[r.i] = v; }
function moveBelt(a, b, el) {
  if (a.k === 'belt' && b.k === 'trash') { belt[a.s] = null; changed(false); sfx.trash(); return; }
  const ok = r => r.k === 'belt' || r.k === 'inv' || r.k === 'chest';
  if (!ok(a) || !ok(b) || (a.k === 'belt' && b.k === 'belt')) return bad(el);
  const A = beltGet(a), B = beltGet(b); if (!A) return;
  const fits = (r, s) => r.k !== 'belt' || beltKind(s.id) === r.s;
  if (!fits(b, A)) return bad(el);
  if (B && B.id === A.id && stackMax(A.id) > 1) {
    const t = Math.min(A.n, stackMax(A.id) - B.n); if (t <= 0) return bad(el);
    B.n += t; A.n -= t; if (A.n <= 0) beltSet(a, null);
  } else {
    if (B && !fits(a, B)) return bad(el);
    beltSet(a, B || null); beltSet(b, A);
  }
  changed(false); sfx.equip();
}
{ const _ro = refOf, _ia = itemAt, _mv = moveItem, _qa = quickAction, _bi = buildInvUI, _ri = refreshInv;
  refOf = el => el && el.dataset && el.dataset.belt && !el.dataset.hud ? { k: 'belt', s: el.dataset.belt } : _ro(el);
  itemAt = r => r && r.k === 'belt' ? belt[r.s] || null : _ia(r);
  moveItem = (a, b, el) => a.k === 'belt' || b.k === 'belt' ? moveBelt(a, b, el) : _mv(a, b, el);
  quickAction = function (r) {
    if (r && r.k === 'belt') {   // botão direito na casa do cinto: volta para a mochila
      const s = belt[r.s]; if (!s) return;
      const left = addBag(s.id, s.n); if (left === s.n) return bad(null);
      if (left) s.n = left; else belt[r.s] = null; changed(false); sfx.equip(); return;
    }
    const s = r && r.k === 'inv' && inv[r.i];
    if (s && beltKind(s.id) === 'torch') return moveBelt(r, { k: 'belt', s: 'torch' }, null);
    return _qa(r);
  };
  buildInvUI = function () {
    _bi();
    if ($('invBelt')) return;
    const hot = $('invHot'); if (!hot) return;
    const sep = document.createElement('div'); sep.className = 'sep beltsep'; sep.setAttribute('role', 'separator');
    const row = document.createElement('div'); row.id = 'invBelt'; row.className = 'beltrow';
    row.innerHTML = `<div class="beltgrp">${beltSlotHTML('pot')}${beltSlotHTML('torch')}</div><div class="beltgrp">${beltSlotHTML('mana')}</div>`;
    hot.after(sep, row); beltGhosts(row);
  };
  refreshInv = function (force) {
    _ri(force);
    if (!invVisible()) return;
    document.querySelectorAll('#invBelt .slot').forEach(d => paintSlot(d, belt[d.dataset.belt], force));
  };
}
const beltSlotHTML = (k, hud) => `<div class="slot belt" data-belt="${k}"${hud ? ' data-hud="1"' : ''}><img alt="" hidden><span class="n"></span></div>`;
function beltGhosts(root) { root.querySelectorAll('.slot.belt').forEach(d => { const ic = ICON[BELT_GHOST[d.dataset.belt]]; if (ic) d.style.setProperty('--ghost', `url(${ic.url})`); }); }

/* ---- as casas do HUD, ao lado dos globos ---- */
let beltHud = null, beltPosKey = '';
function buildBeltHud() {
  const hud = $('hud'); if (!hud || typeof ICON === 'undefined' || !ICON.tocha) return false;
  const box = (id, ks) => { const w = document.createElement('div'); w.id = id; w.className = 'beltbox panel'; w.innerHTML = ks.map(k => beltSlotHTML(k, true)).join(''); hud.appendChild(w); beltGhosts(w); return w; };
  beltHud = { l: box('beltHp', ['pot', 'torch']), r: box('beltMp', ['mana']) };
  beltHud.slots = [...hud.querySelectorAll('.beltbox .slot')];
  for (const d of beltHud.slots) d.addEventListener('pointerdown', e => {
    e.preventDefault(); if (state !== 'play' || e.button !== 0) return;
    initAudio(); if (d.dataset.belt !== 'torch') beltDrink(d.dataset.belt);
  });
  return true;
}
function placeBelt() {
  const oh = $('orbHp').getBoundingClientRect(), om = $('orbMp').getBoundingClientRect(), hb = $('hotbar').getBoundingClientRect();
  if (!oh.width || !hb.width) return false;
  const H = innerHeight, os = oh.width / 88, rows = [$('hbrow'), $('xpbar')].map(e => e.getBoundingClientRect()).filter(q => q.width);
  const base = Math.max(H - hb.bottom, H - oh.bottom + 4 * os);
  const put = (el, x, right) => {
    el.style.bottom = base + 'px';
    if (right) { el.style.right = Math.round(innerWidth - x) + 'px'; el.style.left = 'auto'; } else { el.style.left = Math.round(x) + 'px'; el.style.right = 'auto'; }
    const r = el.getBoundingClientRect();
    if (rows.some(q => r.left < q.right + 8 && r.right > q.left - 8 && r.top < q.bottom && r.bottom > q.top))
      el.style.bottom = Math.round(H - Math.min(...rows.map(q => q.top)) + 8) + 'px';
  };
  put(beltHud.l, oh.right - 4 * os + 6, false); put(beltHud.r, om.left + 4 * os - 6, true);
  return true;
}
addEventListener('resize', () => { beltPosKey = ''; });
{ const _uh = updateHUD; updateHUD = function () {
  _uh();
  if (!beltHud && !buildBeltHud()) return;
  for (const d of beltHud.slots) paintSlot(d, belt[d.dataset.belt]);
  const k = innerWidth + 'x' + innerHeight + '|' + $('hbrow').offsetWidth;
  if (k !== beltPosKey && placeBelt()) beltPosKey = k;
}; }

/* ---- save ---- */
{ const _ms = makeSave; makeSave = function () { const v = _ms(); v.cinto = BELT_K.map(k => belt[k] ? [belt[k].id, belt[k].n] : null); return v; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  belt = { pot: null, torch: null, mana: null };
  _nw(sd, sv);
  const c = sv && sv.cinto;
  if (Array.isArray(c)) BELT_K.forEach((k, i) => {
    const q = c[i]; if (!Array.isArray(q) || !ITEMS[q[0]] || beltKind(q[0]) !== k) return;
    if (belt[k]) addBag(belt[k].id, belt[k].n);
    belt[k] = { id: q[0], n: clamp(q[1] | 0, 1, stackMax(q[0])) };
  });
  for (const k of BELT_K) beltFill(k);
  hudCache.hb = null; invDirty = true;
}; }
