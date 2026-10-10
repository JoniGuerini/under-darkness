'use strict';

/* ================= criar: receitas rápidas no inventário =================
   Pedido do Jonathan (2026-10-10): ao lado do "Organizar" da mochila, um botão "Criar" abre uma lista de receitas.
   A primeira é a tocha: 1 carvão + 1 madeira = 4 tochas. Cada clique na receita gasta os materiais (mochila e baú,
   via reagHave/reagTake do 93) e põe o resultado na mão, no cursor; clicar de novo soma mais 4 na mesma mão.
   - A mão (`craftHand`, { id, n }) não é uma casa: clique numa casa vazia ou com o mesmo item larga a pilha (o que não
     cabe continua na mão); a casa do cinto aceita se for o item dela; o lixo joga fora.
   - Botão direito, clicar fora das casas, fechar o inventário ou trocar de receita devolve a mão para a mochila
     (addItem: a tocha sobe para o cinto primeiro, o que sobrar vai para o baú).
   - O save guarda a mão em `mao` e devolve ao carregar, então nada se perde se o jogo fecha com tochas no cursor.
   - Novas receitas: uma linha em CRAFT_RECIPES ({ id, n, need: [[id, qtd], ...] }).
   Carrega depois do 231-cinto (usa beltGet/beltSet/beltKind), antes do 24-boot. */

const CRAFT_RECIPES = [
  { id: 'tocha', n: 4, need: [['carvao', 1], ['madeira', 1]] },
];
let craftHand = null, craftBuilt = false;

const craftCan = R => R.need.every(([id, k]) => reagHave(id) >= k);
const craftOpen = () => craftBuilt && !$('craftBox').hidden;

/* ---- a mão no cursor ---- */
function handGhost(x, y) {
  const g = $('ghost');
  if (!craftHand) { g.hidden = true; g.classList.remove('held', 'hand'); return; }
  g.innerHTML = `<img src="${ICON[craftHand.id].url}" alt=""><span class="n">${craftHand.n}</span>`;
  g.classList.add('held', 'hand'); g.hidden = false;
  if (x != null) { g.style.left = x + 'px'; g.style.top = y + 'px'; }
}
function handReturn() {
  if (!craftHand) return;
  const h = craftHand; craftHand = null; handGhost();
  reagGive(h.id, h.n); invDirty = true; refreshInv();
}
// larga a mão numa casa: vazia ou com o mesmo item (até a pilha encher); o resto fica na mão
function handDrop(r, el) {
  const h = craftHand;
  if (r.k === 'trash') { craftHand = null; handGhost(); sfx.trash(); invDirty = true; return; }
  if (r.k !== 'inv' && r.k !== 'belt' && r.k !== 'chest') return bad(el);
  if (r.k === 'belt' && beltKind(h.id) !== r.s) return bad(el);
  const B = beltGet(r), mx = stackMax(h.id);
  if (B && B.id !== h.id) return bad(el);
  const t = Math.min(h.n, mx - (B ? B.n : 0)); if (t <= 0) return bad(el);
  if (B) B.n += t; else beltSet(r, { id: h.id, n: t });
  h.n -= t; if (h.n <= 0) craftHand = null;
  sfx.equip(); invDirty = true;
}
// roda antes do onHeldDown do 22 (este listener é registrado primeiro): com a mão cheia, o clique é dela
addEventListener('pointerdown', e => {
  if (!craftHand) return;
  const el = e.target, row = el.closest && el.closest('#craftBox .crow');
  if (row && e.button === 0) return;   // outro clique na receita: soma mais
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.button !== 0) { handReturn(); return; }
  const sl = el.closest && el.closest('.slot'), r = invVisible() ? refOf(sl) : null;
  if (r) { handDrop(r, sl); handGhost(e.clientX, e.clientY); refreshInv(); refreshCraft(); }
  else handReturn();
}, true);
addEventListener('pointermove', e => { if (craftHand) { const g = $('ghost'); g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; } });
addEventListener('keydown', e => { if (craftHand && e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); handReturn(); } }, true);

/* ---- a lista de receitas ---- */
function craftOne(i, e) {
  const R = CRAFT_RECIPES[i];
  if (typeof cancelHeld === 'function') cancelHeld();
  if (craftHand && craftHand.id !== R.id) handReturn();
  const cur = craftHand ? craftHand.n : 0;
  if (!craftCan(R) || cur + R.n > stackMax(R.id)) { bad(e.currentTarget); return; }
  for (const [id, k] of R.need) reagTake(id, k);
  craftHand = { id: R.id, n: cur + R.n };
  hideTip(); handGhost(e.clientX, e.clientY); sfx.equip();
  invDirty = true; refreshInv(); refreshCraft();
}
function buildCraft() {
  if (craftBuilt) return; craftBuilt = true;
  const box = document.createElement('section'); box.id = 'craftBox'; box.className = 'panel'; box.hidden = true; box.setAttribute('aria-label', 'Criar');
  box.innerHTML = `<h4 class="sub4">Criar</h4><div class="clist">${CRAFT_RECIPES.map((R, i) => `<button class="crow" type="button" data-r="${i}">
    <span class="slot out"><img src="${ICON[R.id].url}" alt=""><span class="n">${R.n}</span></span>
    <span class="cname">${ITEMS[R.id].name}</span>
    <span class="cneed">${R.need.map(([id, k]) => `<span class="ci" data-id="${id}" title="${ITEMS[id].name}"><img src="${ICON[id].url}" alt=""><b>${k}</b></span>`).join('')}</span>
  </button>`).join('')}</div>`;
  document.body.appendChild(box);
  box.querySelectorAll('.crow').forEach(b => b.addEventListener('click', e => craftOne(+b.dataset.r, e)));
  box.addEventListener('contextmenu', e => e.preventDefault());
}
function refreshCraft() {
  if (!craftOpen()) return;
  $('craftBox').querySelectorAll('.crow').forEach(b => {
    const R = CRAFT_RECIPES[+b.dataset.r];
    b.classList.toggle('no', !craftCan(R));
    b.querySelectorAll('.ci').forEach(c => c.classList.toggle('falta', reagHave(c.dataset.id) < +c.querySelector('b').textContent));
  });
}
// a lista fica colada no cartão do inventário, do lado de fora; à direita se couber, senão à esquerda
function placeCraft() {
  if (!craftOpen()) return;
  const box = $('craftBox'), card = document.querySelector('.invcard'), b = $('btnCraft');
  if (!card || !card.offsetParent) { closeCraft(); return; }
  const c = card.getBoundingClientRect(), k = b.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight;
  let x = c.right + 6; if (x + w > innerWidth - 6) x = c.left - w - 6;
  if (x < 6) x = Math.max(6, Math.min(innerWidth - w - 6, k.right - w));
  const y = Math.max(6, Math.min(innerHeight - h - 6, k.top - 8));
  box.style.left = Math.round(x) + 'px'; box.style.top = Math.round(y) + 'px';
}
function openCraft() { buildCraft(); $('craftBox').hidden = false; $('btnCraft').classList.add('on'); refreshCraft(); placeCraft(); }
function closeCraft() { if (!craftBuilt) return; $('craftBox').hidden = true; const b = $('btnCraft'); if (b) b.classList.remove('on'); }
addEventListener('resize', placeCraft);

/* ---- ganchos: o botão ao lado do Organizar, e a mão volta quando o inventário fecha ---- */
{ const _bi = buildInvUI, _ri = refreshInv, _ci = closeInv;
  buildInvUI = function () {
    _bi();
    if ($('btnCraft')) return;
    const sort = $('btnSort'); if (!sort) return;
    const b = document.createElement('button'); b.id = 'btnCraft'; b.type = 'button'; b.className = 'ghost sm push'; b.textContent = 'Criar';
    sort.classList.remove('push'); sort.before(b);
    b.addEventListener('click', () => { sfx.select(); craftOpen() ? closeCraft() : openCraft(); });
  };
  refreshInv = function (force) { _ri(force); refreshCraft(); placeCraft(); };
  closeInv = function () { handReturn(); closeCraft(); _ci(); };
}
// fallback: qualquer outro jeito de esconder o cartão (loja, forja, baú, morte) devolve a mão e fecha a lista
setInterval(() => {
  if (!invVisible()) { if (craftHand) handReturn(); if (craftOpen()) closeCraft(); }
}, 250);

/* ---- save: o que estiver na mão volta para a mochila ao carregar ---- */
{ const _ms = makeSave; makeSave = function () { const v = _ms(); if (craftHand) v.mao = [craftHand.id, craftHand.n]; return v; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  craftHand = null; if (craftBuilt) handGhost();
  _nw(sd, sv);
  const m = sv && sv.mao;
  if (Array.isArray(m) && ITEMS[m[0]] && m[1] > 0) reagGive(m[0], Math.min(m[1] | 0, stackMax(m[0])));
}; }
