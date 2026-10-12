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
// measuring the hotbar right after the HUD texts change forced a full page layout every frame: now it measures 4x per
// second (and right away after a resize)
let xpAlign = '', xpAlignT = 0;
addEventListener('resize', () => { xpAlignT = 0; });
function alignXp() {
  const now = performance.now(); if (now - xpAlignT < 250) return; xpAlignT = now;
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
