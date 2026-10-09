'use strict';

/* ================= nível e ouro ao lado da barra de ação ================= */
// o ouro usa o mesmo ícone de moeda dos itens, desenhado no início junto dos outros ícones
function fmtOuro(n) { return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function paintCoinIcon() {
  const img = document.getElementById('hGoldIcon');
  if (!img) return;
  const url = (typeof ICON !== 'undefined' && ICON.ouro) ? ICON.ouro.url : '';
  if (url) { img.src = url; img.hidden = false; }
}

// a barra de XP acompanha a barra de ação, que agora fica deslocada pelos quadros das laterais
let xpAlign = '';
function alignXp() {
  const hb = document.getElementById('hotbar'), xp = document.getElementById('xpbar');
  if (!hb || !xp) return;
  const r = hb.getBoundingClientRect();
  if (!r.width) return;
  const key = Math.round(r.left) + ':' + Math.round(r.width);
  if (xpAlign === key) return;
  xpAlign = key;
  xp.style.width = r.width + 'px';
  xp.style.left = (r.left + r.width / 2) + 'px';
}
