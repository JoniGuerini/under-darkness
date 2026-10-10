'use strict';
/* As janelas acesas do vilarejo ficam ATRÁS do herói.
   O brilho das janelas (drawVillageGlow, 17-vilarejo) é pintado por cima da escuridão, depois de tudo,
   então cobria o herói e a espada. Aqui, depois do brilho, o herói (e o rastro do golpe) é desenhado de novo, recortado só dentro dos
   vidros acesos. 2026-10-10: antes os pixels eram lidos de volta da tela com getImageData duas vezes por
   quadro; o Chrome passava a tela para o processador e o FPS caía para uns 60 até recarregar. Só roda à noite, perto de uma janela. */
const winCut = { on: false, x: 0, y: 0, w: 72, h: 80, cx: 0, cy: 0 };
function litPanes(cx, cy) {
  const out = []; if (!SPR.vil || nightK() <= 0.05) return out;
  for (const v of VIL_BUILD) { const b = SPR.vil[v.k], [x, y] = bPos(v); for (const w of b.wins) out.push([x + 1 + w[0] - cx, y + 1 + w[1] - cy, w[2], w[3]]); }
  return out;
}
{
  const _drawPlayer = drawPlayer, _drawSmear = drawSmear;
  drawPlayer = function (cx, cy) {
    winCut.on = false;
    if (!pl.dead && SPR.vil) {
      const x = Math.round(pl.x + pl.w / 2) - cx - (winCut.w >> 1), y = Math.round(pl.y + pl.h) - cy - winCut.h + 12;
      if (litPanes(cx, cy).some(r => r[0] < x + winCut.w && r[0] + r[2] > x && r[1] < y + winCut.h && r[1] + r[3] > y)) { winCut.on = true; winCut.x = x; winCut.y = y; winCut.cx = cx; winCut.cy = cy; }
    }
    return _drawPlayer(cx, cy);
  };
  const _drawVillageGlow = drawVillageGlow;
  drawVillageGlow = function (cx, cy) {
    _drawVillageGlow(cx, cy);
    if (!winCut.on) return;
    lc.save(); lc.beginPath();
    for (const r of litPanes(cx, cy)) lc.rect(r[0], r[1], r[2], r[3]);
    lc.clip(); lc.beginPath(); lc.rect(winCut.x, winCut.y, winCut.w, winCut.h); lc.clip();
    lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over';
    _drawPlayer(winCut.cx, winCut.cy); _drawSmear(winCut.cx, winCut.cy);
    lc.restore();
  };
}
