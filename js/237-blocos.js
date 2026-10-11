'use strict';

/* ================= bolsa de blocos: uma casa para cada bloco do jogo =================
   Pedido do Jonathan (2026-10-10), no espírito das abas de afinidade do baú do Path of Exile: ao lado do "Criar",
   o botão "Blocos" troca a grade da mochila pela grade da bolsa, com uma casa fixa para cada bloco que o jogo tem
   (todo item com `block`: terra, pedra, madeira, os tijolos e pedras de cada camada...).
   - Bloco coletado vai direto para a bolsa (`pouch`, id -> quantidade, sem limite) e nunca ocupa a mochila.
     Antes, completa uma pilha dele que já esteja na barra de ação.
   - Da bolsa, arrastar (ou clicar e largar) numa casa da barra leva uma pilha (até 99) para lá. Botão direito leva
     para a primeira casa livre da barra. Colocar blocos no mundo gasta a pilha da barra, e ela se completa
     sozinha com o que houver na bolsa, então a barra funciona como uma janela da bolsa.
   - Bloco largado na mochila, na bolsa ou que apareça na mochila de outro jeito (baú, ordenar, save antigo) volta
     para a bolsa. Barra e baú do vilarejo continuam aceitando blocos.
   - countItem/removeItem contam e gastam da bolsa, então a madeira da tocha (235-criar), lojas e receitas seguem
     funcionando sem mudar nada.
   - Itens de colocar que não são blocos (candelabro e outros `deco`) continuam na mochila.
   - A bolsa mostra duas fileiras de casas e, na terceira, as abas: uma página por bioma, na ordem da descida.
   - Salva em `blocos` no save.
   Carrega depois do 231-cinto e do 235-criar, antes do 24-boot. */

const isBlk = id => !!ITEMS[id] && ITEMS[id].block != null && !ITEMS[id].alias;
const BLK_IDS = Object.keys(ITEMS).filter(isBlk);
let pouch = {}, blkView = false, blkBuilt = false;
const pouchN = id => pouch[id] || 0;
function pouchPut(id, n) { if (n > 0) { pouch[id] = pouchN(id) + n; invDirty = true; } }
function pouchTake(id, n) { const t = Math.min(n, pouchN(id)); if (t > 0) { pouch[id] -= t; if (!pouch[id]) delete pouch[id]; invDirty = true; } return t; }

// completa as pilhas desse bloco que estão na barra com o que houver na bolsa
function blkTopUp(id) {
  const mx = stackMax(id);
  for (let i = 0; i < HB_BAG && pouchN(id); i++) { const s = inv[i]; if (s && s.id === id && s.n < mx) s.n += pouchTake(id, mx - s.n); }
}
// o que for bloco na mochila (fora da barra) vai para a bolsa
function blkSweep() {
  let moved = false;
  for (let i = HB_BAG; i < INV_N; i++) { const s = inv[i]; if (s && isBlk(s.id)) { pouchPut(s.id, s.n); inv[i] = null; moved = true; } }
  return moved;
}

/* ---- contar, guardar e gastar passam pela bolsa ---- */
{ const _ci = countItem, _cf = canFit, _ai = addItem, _rm = removeItem;
  countItem = id => _ci(id) + (isBlk(id) ? pouchN(id) : 0);
  canFit = id => isBlk(id) || _cf(id);
  addItem = function (id, n = 1) {
    if (!isBlk(id) || n <= 0) return _ai(id, n);
    pouchPut(id, n); blkTopUp(id); return 0;
  };
  removeItem = function (id, n = 1) {
    if (isBlk(id)) n -= pouchTake(id, n);
    return n > 0 ? _rm(id, n) : true;
  };
}
// colocar um bloco da barra: depois do que a pilha gastou, ela se completa da bolsa
{ const _ph = placeHeld; placeHeld = function (held) {
  const id = held && held.s.id, i = held && held.i, ok = _ph(held);
  if (ok && id && isBlk(id) && pouchN(id)) {
    if (!inv[i]) inv[i] = { id, n: pouchTake(id, stackMax(id)) }; else if (inv[i].id === id) blkTopUp(id);
    invDirty = true;
  }
  return ok;
}; }

/* ---- a grade da bolsa: duas fileiras por página, uma página por bioma, na ordem da descida ----
   O bioma sai do número do bloco (cada camada reservou uma faixa de números); a terceira fileira são as abas. */
const BLK_BIOMES = [   // [nome, primeiro número de bloco, último]
  ['Superfície', 0, 29], ['Cavernas', 54, 73], ['Catedral', 30, 53], ['Gelo', 74, 93], ['Mina', 94, 127],
  ['Minas Fúngicas', 256, 287], ['Cidade Afundada', 288, 319], ['Floresta Petrificada', 320, 351],
  ['Fortaleza dos Anões', 352, 383], ['Colmeia', 384, 575], ['Nave Caída', 640, 703], ['Abismo', 128, 255],
  ['Escuridão', 576, 639], ['Outros', 704, 1e9]
];
const BLK_PAGES = BLK_BIOMES.map(([name, a, b]) => ({ name, ids: BLK_IDS.filter(id => ITEMS[id].block >= a && ITEMS[id].block <= b) }))
  .filter(P => P.ids.length);
{ const t = BLK_PAGES[0].ids, k = t.indexOf('terra'); if (k > 0) t.unshift(t.splice(k, 1)[0]); }   // terra é a primeira casa
const BLK_PER = 20;
let blkPage = 0;
function buildBlk() {
  if (blkBuilt) return; blkBuilt = true;
  const g = document.createElement('div'); g.className = 'grid'; g.id = 'blkGrid'; g.hidden = true;
  g.innerHTML = Array.from({ length: BLK_PER }, () => '<div class="slot blk"><img alt="" hidden><span class="n"></span></div>').join('');
  const tabs = document.createElement('div'); tabs.id = 'blkTabs'; tabs.hidden = true;
  tabs.innerHTML = BLK_PAGES.map((P, i) => `<button class="btab" type="button" data-p="${i}" title="${P.name}"><img src="${ICON[P.ids[0]].url}" alt="${P.name}"></button>`).join('');
  $('invGrid').after(g, tabs);
  tabs.querySelectorAll('.btab').forEach(b => b.addEventListener('click', () => { if (+b.dataset.p !== blkPage) { sfx.select(); setBlkPage(+b.dataset.p); } }));
  setBlkPage(0);
}
function setBlkPage(i) {
  blkPage = i; const P = BLK_PAGES[i];
  $('blkGrid').querySelectorAll('.slot').forEach((d, k) => {
    const id = P.ids[k];
    if (id) { d.dataset.blk = id; d.style.setProperty('--ghost', `url(${ICON[id].url})`); d.classList.remove('off'); }
    else { delete d.dataset.blk; d.style.removeProperty('--ghost'); d.classList.add('off'); }
    d._key = null;
  });
  $('blkTabs').querySelectorAll('.btab').forEach(b => b.classList.toggle('on', +b.dataset.p === i));
  const h = document.querySelector('.invcard .ph .sub4'); if (h && blkView) h.textContent = P.name;
  hideTip(); paintBlk(true);
}
function setBlkView(on) {
  buildBlk(); blkView = on;
  $('invGrid').hidden = on; $('blkGrid').hidden = !on; $('blkTabs').hidden = !on;
  $('btnBlk').classList.toggle('on', on);
  const h = document.querySelector('.invcard .ph .sub4'); if (h) h.textContent = on ? BLK_PAGES[blkPage].name : 'Mochila';
  $('bagCount').hidden = on;
  refreshInv(true);
}
function paintBlk(force) {
  if (!blkView) return;
  document.querySelectorAll('#blkGrid .slot').forEach(d => { const id = d.dataset.blk, n = id ? pouchN(id) : 0; paintSlot(d, n ? { id, n } : null, force); });
}

/* ---- no inventário: refOf / itemAt / moveItem / quickAction / actFor conhecem a bolsa ---- */
function invGet(r) { return r.k === 'belt' || r.k === 'inv' || r.k === 'chest' ? beltGet(r) : null; }
function moveBlk(a, b, el) {
  if (a.k === 'blk') {
    const id = a.id, have = pouchN(id); if (!have) return;
    if (b.k === 'trash') { pouchTake(id, Math.min(have, stackMax(id))); changed(false); sfx.trash(); return; }
    if (b.k === 'blk') return;
    if (b.k !== 'inv' && b.k !== 'chest') return bad(el);
    if (b.k === 'inv' && b.i >= HB_BAG) return bad(el);   // a mochila não guarda blocos
    const B = invGet(b), mx = stackMax(id);
    if (B && B.id === id) { const t = pouchTake(id, mx - B.n); if (!t) return bad(el); }
    else if (B && !isBlk(B.id)) return bad(el);
    else { if (B) pouchPut(B.id, B.n); beltSet(b, { id, n: pouchTake(id, mx) }); }
    changed(false); sfx.equip(); return;
  }
  // para a bolsa (ou para a mochila, que manda o bloco para a bolsa)
  const A = invGet(a); if (!A) return;
  if (!isBlk(A.id)) return bad(el);
  pouchPut(A.id, A.n); beltSet(a, null); changed(false); sfx.equip();
}
{ const _ro = refOf, _ia = itemAt, _mv = moveItem, _qa = quickAction, _af = actFor, _bi = buildInvUI, _ri = refreshInv, _ci = closeInv;
  refOf = el => el && el.dataset && el.dataset.blk ? { k: 'blk', id: el.dataset.blk } : _ro(el);
  itemAt = r => r && r.k === 'blk' ? (pouchN(r.id) ? { id: r.id, n: pouchN(r.id) } : null) : _ia(r);
  moveItem = function (a, b, el) {
    if (a.k === 'blk' || b.k === 'blk') return moveBlk(a, b, el);
    const A = (a.k === 'inv' || a.k === 'chest') && invGet(a);
    if (A && isBlk(A.id) && b.k === 'inv' && b.i >= HB_BAG) return moveBlk(a, b, el);   // bloco solto na mochila: vai para a bolsa
    return _mv(a, b, el);
  };
  quickAction = function (r) {
    if (r && r.k === 'blk') {   // botão direito na bolsa: uma pilha para a primeira casa livre da barra
      const i = inv.slice(0, HB_BAG).findIndex(s => !s); if (i < 0) return bad(null);
      return moveBlk(r, { k: 'inv', i }, null);
    }
    const s = r && r.k === 'inv' && inv[r.i];
    if (s && isBlk(s.id)) return moveBlk(r, { k: 'blk', id: s.id }, null);   // bloco da barra: de volta para a bolsa
    return _qa(r);
  };
  actFor = (s, r) => r.k === 'blk' ? 'Arraste para a barra · Botão direito: para a barra' : _af(s, r);
  buildInvUI = function () {
    _bi();
    if ($('btnBlk')) return;
    const craft = $('btnCraft') || $('btnSort'); if (!craft) return;
    const b = document.createElement('button'); b.id = 'btnBlk'; b.type = 'button'; b.className = 'ghost sm'; b.textContent = 'Blocos';
    craft.after(b);
    b.addEventListener('click', () => { sfx.select(); setBlkView(!blkView); });
  };
  refreshInv = function (force) { if (blkSweep()) force = true; _ri(force); if (invVisible()) paintBlk(force); };
  closeInv = function () { _ci(); if (blkView) setBlkView(false); };
}

/* ---- save: a bolsa em `blocos`; saves antigos mandam os blocos da mochila para ela ---- */
{ const _ms = makeSave; makeSave = function () { const v = _ms(); v.blocos = Object.entries(pouch).filter(([, n]) => n > 0); return v; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  pouch = {};
  _nw(sd, sv);
  const p = sv && sv.blocos;
  if (Array.isArray(p)) for (const q of p) if (Array.isArray(q) && isBlk(q[0]) && q[1] > 0) pouchPut(q[0], Math.floor(q[1]));
  blkSweep(); invDirty = true;
}; }
