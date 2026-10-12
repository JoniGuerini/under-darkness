'use strict';

/* ================= modo lixo =================
   Pedido do Jonathan (2026-10-12): arrastar item por item até o lixo é um saco. Agora a casa "Lixo" do inventário é um
   botão que liga e desliga o modo lixo; ligado, cada clique num item da mochila joga a pilha inteira fora.
   - Vale para as casas da mochila (inv a partir de HB_BAG) e para as casas da bolsa de blocos (237), que jogam fora
     tudo daquele bloco. A barra, o cinto e o equipamento ficam de fora: no modo lixo, clicar neles não faz nada.
   - A última picareta continua protegida. Runas (feitiços aprendidos) vão para o lixo também, até a última.
   - Arrastar um item até o lixo continua funcionando como antes; com um item na mão, clicar no lixo larga o item nele.
   - Fechar o inventário desliga o modo. O cursor vira uma lixeirinha enquanto ele está ligado.
   Carrega depois do 237-blocos, antes do 24-boot. */

let trashMode = false;

// a lixeirinha do cursor, desenhada uma vez (12 x 14, em dobro)
const LIXO_CUR = (() => {
  const rows = ['....kkkk....', '.kkkkkkkkkk.', 'kRRRRRRRRRRk', '.kkkkkkkkkk.', '.kRrRrRrRrk.', '.kRrRrRrRrk.', '.kRrRrRrRrk.', '.kRrRrRrRrk.', '.kRrRrRrRrk.', '.kRrRrRrRrk.', '.kRrRrRrRrk.', '..kRrRrRrk..', '..kkkkkkkk..'];
  const c = mk(24, 26), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.drawImage(fromRows(rows, { k: '#120a0c', R: '#d8584a', r: '#8a2a26' }), 0, 0, 24, 26);
  try { return `url(${c.toDataURL()}) 12 13, pointer`; } catch (e) { return 'pointer'; }
})();
document.documentElement.style.setProperty('--lixo-cur', LIXO_CUR);

function setTrashMode(on) {
  trashMode = !!on;
  document.querySelectorAll('.slot.trash').forEach(d => d.classList.toggle('on', trashMode));
  document.querySelectorAll('.invcard').forEach(c => c.classList.toggle('lixo', trashMode));
  hideTip();
}
// as casas que o modo lixo esvazia
function trashRef(el) {
  const r = el && refOf(el);
  if (!r) return null;
  if (r.k === 'inv' && r.i >= HB_BAG) return r;
  if (r.k === 'blk') return r;
  return null;
}
addEventListener('pointerdown', e => {
  if (e.button !== 0 || !invVisible() || held || (typeof craftHand !== 'undefined' && craftHand)) return;
  const sl = e.target.closest && e.target.closest('.slot'); if (!sl) return;
  if (sl.dataset.trash) { e.preventDefault(); e.stopImmediatePropagation(); sfx.select(); setTrashMode(!trashMode); return; }
  if (!trashMode || !refOf(sl)) return;
  e.preventDefault(); e.stopImmediatePropagation();   // no modo lixo, as outras casas (barra, equipamento) não pegam item
  const r = trashRef(sl); if (!r || !itemAt(r)) return;
  if (r.k === 'blk') { pouchTake(r.id, pouchN(r.id)); changed(false); sfx.trash(); }
  else moveItem(r, { k: 'trash' }, sl);
  refreshInv(); if (shopNpc) refreshShop();
}, true);

{ const _ci = closeInv, _bi = buildInvUI;
  closeInv = function () { setTrashMode(false); _ci(); };
  buildInvUI = function () { _bi(); document.querySelectorAll('.slot.trash').forEach(d => d.removeAttribute('title')); };
}
// runas (feitiços aprendidos): o 64 não deixava jogar fora. O Jonathan quer poder jogar todas fora (2026-10-12): sem a
// runa o feitiço é esquecido, e para tê-lo de novo é só comprar outra.
{ const _mv = moveItem; moveItem = function (a, b, el) {
  const s = b && b.k === 'trash' && (a.k === 'inv' || a.k === 'chest') ? itemAt(a) : null;
  if (s && ITEMS[s.id].spell) {
    if (a.k === 'inv') inv[a.i] = null; else stash[a.i] = null;
    changed(false); sfx.trash(); return;
  }
  return _mv(a, b, el);
}; }
// o tremor de recusa (bad, no 22) larga a classe quando acaba; antes ela ficava e a casa voltava a tremer toda vez que
// o inventário reabria
addEventListener('animationend', e => { const t = e.target; if (t.classList && t.classList.contains('bad')) t.classList.remove('bad'); }, true);

// o cartão some por outro caminho (loja, forja, baú, morte): o modo desliga junto
setInterval(() => { if (trashMode && !invVisible()) setTrashMode(false); }, 250);
