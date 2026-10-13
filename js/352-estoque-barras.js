'use strict';

/* ---- o estoque da fornalha: as barras prontas ficam guardadas na forja até você coletar ----
   A fornalha (js/18-forja.js) e o talento Barra Extra (js/331-oficios.js) põem cada barra aqui com barStockAdd.
   Na aba Fornalha, abaixo da receita, aparece a bandeja do estoque: clicar numa barra leva a pilha para a mochila,
   o botão coleta todas. O que não cabe na mochila continua no estoque. Salvo em `bst`. Visual em css/estoque-barras.css. */
let barStock = {};
const BS_MIN = 6;   // casas vazias mostradas na bandeja
function barStockAdd(id, n = 1) { barStock[id] = (barStock[id] || 0) + n; forgeDirty = true; }
// leva uma pilha do estoque para a mochila; devolve quantas barras couberam
function barStockTake(id) {
  const n = barStock[id] | 0; if (!n) return 0;
  const left = addItem(id, n); if (left) barStock[id] = left; else delete barStock[id];
  if (left < n) { invDirty = true; forgeDirty = true; }
  return n - left;
}
const barStockIds = () => Object.keys(FURN).map(k => FURN[k].bar).filter(id => barStock[id] > 0)
  .concat(Object.keys(barStock).filter(id => barStock[id] > 0 && !Object.values(FURN).some(r => r.bar === id)));
function barStockHTML() {
  const ids = barStockIds(), cells = ids.map(id => `<div class="bs-slot" data-bs="${id}" role="button" tabindex="0" aria-label="${ITEMS[id].name}"><img src="${ICON[id].url}" alt=""><b>${barStock[id]}</b></div>`);
  for (let i = ids.length; i < BS_MIN; i++) cells.push('<div class="bs-slot vazio" aria-hidden="true"></div>');
  return `<div class="bs-head"><h5>Estoque</h5><button class="ghost sm" id="btnStockAll" type="button"${ids.length ? '' : ' disabled'}>Coletar tudo</button></div><div class="bs-tray">${cells.join('')}</div>`;
}
function barStockDraw() {
  if (!forgeOpen() || forgeTab !== 'smelt') return;
  const body = $('pdBody'); if (!body) return;
  let el = $('barStock');
  if (!el || el.parentNode !== body) { el = document.createElement('div'); el.id = 'barStock'; el.className = 'bstock'; body.appendChild(el); }
  const key = barStockIds().map(id => id + barStock[id]).join();
  if (el._k !== key) { el.innerHTML = barStockHTML(); el._k = key; }
}
{ const _rf = refreshForge; refreshForge = function () { const r = _rf(); barStockDraw(); return r; }; }
{ const _bf = buildForgeUI; buildForgeUI = function () {
  const first = !forgeBuilt; _bf(); if (!first) return;
  const p = document.querySelector('#forge .forgep');
  const collect = (ids, el) => {
    let got = 0; for (const id of ids) got += barStockTake(id);
    if (got) { sfx.equip(); hideTip(); } else bad(el);
  };
  p.addEventListener('click', e => {
    const s = e.target.closest && e.target.closest('.bs-slot[data-bs]'); if (s) { collect([s.dataset.bs], s); return; }
    const b = e.target.closest && e.target.closest('#btnStockAll'); if (b) collect(barStockIds(), b);
  });
  p.addEventListener('contextmenu', e => { const s = e.target.closest && e.target.closest('.bs-slot[data-bs]'); if (s) collect([s.dataset.bs], s); });
  p.addEventListener('keydown', e => { const s = e.target.closest && e.target.closest('.bs-slot[data-bs]'); if (s && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); s.click(); } });
  p.addEventListener('pointermove', e => { const s = e.target.closest && e.target.closest('.bs-slot[data-bs]'); if (s) barStockTip(e, s.dataset.bs); });
}; }

// a dica da barra, no mesmo quadro das dicas da mochila
function barStockTip(e, id) {
  const tip = $('tip'), key = 'bst|' + id + '|' + barStock[id];
  if (tip._key !== key) { tip.innerHTML = tipHTML({ id, n: barStock[id] | 0 }, { k: 'inv' }, ''); tip._key = key; }
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 16, y = e.clientY + 14;
  if (x + w > innerWidth - 8) x = e.clientX - w - 12; if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}

/* ---- save ---- */
{ const _ms = makeSave; makeSave = function () { const v = _ms(); v.bst = Object.fromEntries(Object.entries(barStock).filter(([, n]) => n > 0)); return v; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  const r = _nw(sd, sv); barStock = {};
  const b = sv && sv.bst; if (b && typeof b === 'object') for (const id in b) { const n = b[id] | 0; if (ITEMS[id] && n > 0) barStock[id] = n; }
  forgeDirty = true; return r;
}; }
