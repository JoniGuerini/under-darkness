'use strict';

/* ================= bolsa de blocos: uma casa para cada bloco do jogo =================
   Pedido do Jonathan (2026-10-10), no espírito das abas de afinidade do baú do Path of Exile: ao lado do "Criar",
   o botão "Blocos" troca a grade da mochila pela grade da bolsa, com uma casa fixa para cada bloco que o jogo tem
   (todo item com `block`: terra, pedra, madeira, os tijolos e pedras de cada camada...).
   - Bloco coletado vai para a bolsa (`pouch`, id -> quantidade, sem limite). Antes, completa as pilhas dele que já
     estejam na barra ou na mochila (pedido de 2026-10-12): só o que sobra vai para a bolsa.
   - Da bolsa, arrastar (ou clicar e largar) numa casa da barra leva uma pilha (até 99) para lá. Botão direito leva
     para a primeira casa livre da barra. Colocar blocos no mundo gasta a pilha da barra, e ela se completa
     sozinha com o que houver na bolsa, então a barra funciona como uma janela da bolsa.
   - A mochila aceita pilhas de bloco que o herói puser lá (arrastando da bolsa ou da barra); bloco nunca entra
     sozinho numa casa vazia da mochila. Botão direito numa pilha de bloco a devolve para a bolsa.
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
// bloco coletado: completa primeiro as pilhas dele na barra e depois na mochila; devolve o que sobrou
function blkFillStacks(id, n) {
  const mx = stackMax(id);
  for (let i = 0; i < INV_N && n > 0; i++) { const s = inv[i]; if (s && s.id === id && s.n < mx) { const t = Math.min(n, mx - s.n); s.n += t; n -= t; invDirty = true; } }
  return n;
}

/* ---- contar, guardar e gastar passam pela bolsa ---- */
{ const _ci = countItem, _cf = canFit, _ai = addItem, _rm = removeItem;
  countItem = id => _ci(id) + (isBlk(id) ? pouchN(id) : 0);
  canFit = id => isBlk(id) || _cf(id);
  addItem = function (id, n = 1) {
    if (!isBlk(id) || n <= 0) return _ai(id, n);
    pouchPut(id, blkFillStacks(id, n)); blkTopUp(id); return 0;
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
const BLK_BIOMES = [   // [nome, primeiro número de bloco, último], na ordem da descida (2026-10-21: as 20 camadas, 129)
  ['Superfície', 0, 29], ['Cavernas', 54, 73], ['Catedral', 30, 53], ['Gelo', 74, 93], ['Mina', 94, 127],
  ['Minas Fúngicas', 256, 287], ['Brejo das Bruxas', 864, 895], ['Cidade Afundada', 288, 319], ['Floresta Petrificada', 320, 351],
  ['Fortaleza dos Anões', 352, 383], ['Reino Élfico', 672, 703], ['Mar Sem Sol', 704, 735], ['Covil do Dragão', 736, 767],
  ['Ossário dos Titãs', 768, 799], ['Necrópole', 896, 927], ['Cidade dos Antigos', 800, 831], ['Prisão dos Deuses', 928, 959],
  ['Campo da Última Guerra', 960, 991], ['Abismo', 128, 255], ['Ruínas dos Acendedores', 992, 1023], ['Escuridão', 576, 639], ['Outros', 0, 1e9]
];
const BLK_PAGES = BLK_BIOMES.map(([name, a, b]) => ({ name, ids: BLK_IDS.filter(id => ITEMS[id].block >= a && ITEMS[id].block <= b) }))
  .filter(P => P.ids.length);
// 'Outros' só fica com o que nenhuma camada pegou (as faixas novas, 704 em diante, caem dentro dele)
{ const O = BLK_PAGES.find(P => P.name === 'Outros'); if (O) { const got = new Set(BLK_PAGES.filter(P => P !== O).flatMap(P => P.ids)); O.ids = O.ids.filter(id => !got.has(id)); if (!O.ids.length) BLK_PAGES.splice(BLK_PAGES.indexOf(O), 1); } }
{ const t = BLK_PAGES[0].ids, k = t.indexOf('terra'); if (k > 0) t.unshift(t.splice(k, 1)[0]); }   // terra é a primeira casa
// a plataforma (239) usa um número da faixa da mina, mas é feita de madeira: fica na Superfície, logo depois da madeira
if (ITEMS.plataforma) { for (const P of BLK_PAGES) { const k = P.ids.indexOf('plataforma'); if (k >= 0) P.ids.splice(k, 1); } const t = BLK_PAGES[0].ids; t.splice(t.indexOf('madeira') + 1, 0, 'plataforma'); }
const BLK_PER = 20;
let blkPage = 0;
function buildBlk() {
  if (blkBuilt) return; blkBuilt = true;
  const g = document.createElement('div'); g.className = 'grid'; g.id = 'blkGrid'; g.hidden = true;
  g.innerHTML = Array.from({ length: BLK_PER }, () => '<div class="slot blk"><img alt="" hidden><span class="n"></span></div>').join('');
  const tabs = document.createElement('div'); tabs.id = 'blkTabs'; tabs.hidden = true;
  tabs.innerHTML = `<button class="barr l" type="button" data-d="-1" aria-label="Biomas anteriores"></button><div class="bview">${
    BLK_PAGES.map((P, i) => `<button class="btab" type="button" data-p="${i}" title="${P.name}"><img src="${ICON[P.ids[0]].url}" alt="${P.name}"></button>`).join('')
  }</div><button class="barr r" type="button" data-d="1" aria-label="Próximos biomas"></button>`;
  $('invGrid').after(g, tabs);
  tabs.querySelectorAll('.btab').forEach(b => b.addEventListener('click', () => { if (+b.dataset.p !== blkPage) { sfx.select(); setBlkPage(+b.dataset.p); } }));
  tabs.querySelectorAll('.barr').forEach(b => b.addEventListener('click', () => { if (!b.disabled) { sfx.select(); blkTabStart += +b.dataset.d * blkTabFit; layBlkTabs(); } }));
  setBlkPage(0);
}
/* as abas: só as que cabem na largura do cartão; as setas dos lados passam para o próximo grupo de biomas */
let blkTabStart = 0, blkTabFit = BLK_PAGES.length;
function layBlkTabs(follow) {
  const tabs = $('blkTabs'); if (!tabs || tabs.hidden) return;
  const v = tabs.querySelector('.bview'), all = v.querySelectorAll('.btab'), n = all.length;
  const cs = getComputedStyle(v), gap = parseFloat(cs.columnGap) || 6, w = all[0].offsetWidth || 42;
  const fullW = tabs.clientWidth, fitAll = Math.floor((fullW + gap) / (w + gap));
  const arrW = tabs.querySelector('.barr').offsetWidth || 30;
  blkTabFit = n <= fitAll ? n : Math.max(1, Math.floor((fullW - 2 * (arrW + gap) + gap) / (w + gap)));
  if (follow) blkTabStart = Math.floor(blkPage / blkTabFit) * blkTabFit;
  blkTabStart = Math.max(0, Math.min(blkTabStart, n - 1 - (n - 1) % blkTabFit));
  all.forEach((b, i) => { b.hidden = i < blkTabStart || i >= blkTabStart + blkTabFit; });
  const paged = blkTabFit < n;
  tabs.classList.toggle('paged', paged);
  tabs.querySelector('.l').disabled = !paged || blkTabStart === 0;
  tabs.querySelector('.r').disabled = !paged || blkTabStart + blkTabFit >= n;
}
addEventListener('resize', () => { if (blkView) layBlkTabs(true); });
function setBlkPage(i) {
  blkPage = i; const P = BLK_PAGES[i];
  $('blkGrid').querySelectorAll('.slot').forEach((d, k) => {
    const id = P.ids[k];
    if (id) { d.dataset.blk = id; d.style.setProperty('--ghost', `url(${ICON[id].url})`); d.classList.remove('off'); }
    else { delete d.dataset.blk; d.style.removeProperty('--ghost'); d.classList.add('off'); }
    d._key = null;
  });
  $('blkTabs').querySelectorAll('.btab').forEach(b => b.classList.toggle('on', +b.dataset.p === i));
  layBlkTabs(true);
  const h = document.querySelector('.invcard .ph .sub4'); if (h && blkView) h.textContent = P.name;
  hideTip(); paintBlk(true);
}
function setBlkView(on) {
  buildBlk(); blkView = on;
  $('invGrid').hidden = on; $('blkGrid').hidden = !on; $('blkTabs').hidden = !on;
  $('btnBlk').classList.toggle('on', on);
  const h = document.querySelector('.invcard .ph .sub4'); if (h) h.textContent = on ? BLK_PAGES[blkPage].name : 'Mochila';
  $('bagCount').hidden = on;
  if (on) layBlkTabs(true);
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
  refreshInv = function (force) { _ri(force); if (invVisible()) paintBlk(force); };
  closeInv = function () { _ci(); if (blkView) setBlkView(false); };
}

/* ---- save: a bolsa em `blocos`; saves antigos mandam os blocos da mochila para ela ---- */
{ const _ms = makeSave; makeSave = function () { const v = _ms(); v.blocos = Object.entries(pouch).filter(([, n]) => n > 0); return v; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  pouch = {};
  _nw(sd, sv);
  const p = sv && sv.blocos;
  if (Array.isArray(p)) for (const q of p) if (Array.isArray(q) && isBlk(q[0]) && q[1] > 0) pouchPut(q[0], Math.floor(q[1]));
  invDirty = true;
}; }
