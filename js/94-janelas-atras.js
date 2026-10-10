'use strict';
/* As janelas acesas do vilarejo ficam ATRÁS do herói.
   O brilho das janelas (drawVillageGlow, 17-vilarejo) é pintado por cima da escuridão, depois de tudo,
   então cobria o herói e a espada. Aqui o desenho do herói é guardado (os pixels que drawPlayer e drawSmear
   mudaram) e, depois do brilho, colado de volta só dentro dos vidros acesos. Só roda à noite, perto de uma janela. */
const winCut = { on: false, x: 0, y: 0, w: 72, h: 80, before: null, cv: null, cx: null };
function litPanes(cx, cy) {
  const out = []; if (!SPR.vil || nightK() <= 0.05) return out;
  for (const v of VIL_BUILD) { const b = SPR.vil[v.k], [x, y] = bPos(v); for (const w of b.wins) out.push([x + 1 + w[0] - cx, y + 1 + w[1] - cy, w[2], w[3]]); }
  return out;
}
{
  const _drawPlayer = drawPlayer;
  drawPlayer = function (cx, cy) {
    winCut.on = false;
    if (!pl.dead && SPR.vil) {
      const x = Math.round(pl.x + pl.w / 2) - cx - (winCut.w >> 1), y = Math.round(pl.y + pl.h) - cy - winCut.h + 12;
      if (litPanes(cx, cy).some(r => r[0] < x + winCut.w && r[0] + r[2] > x && r[1] < y + winCut.h && r[1] + r[3] > y)) {
        winCut.on = true; winCut.x = x; winCut.y = y; winCut.before = lc.getImageData(x, y, winCut.w, winCut.h);
      }
    }
    return _drawPlayer(cx, cy);
  };
  const _drawSmear = drawSmear;
  drawSmear = function (cx, cy) {
    const r = _drawSmear(cx, cy);
    if (winCut.on) {
      if (!winCut.cv) { winCut.cv = mk(winCut.w, winCut.h); winCut.cx = winCut.cv.getContext('2d'); }
      const a = winCut.before.data, after = lc.getImageData(winCut.x, winCut.y, winCut.w, winCut.h), d = after.data;
      for (let i = 0; i < d.length; i += 4) if (d[i] === a[i] && d[i + 1] === a[i + 1] && d[i + 2] === a[i + 2]) d[i + 3] = 0;
      winCut.cx.putImageData(after, 0, 0);
    }
    return r;
  };
  const _drawVillageGlow = drawVillageGlow;
  drawVillageGlow = function (cx, cy) {
    _drawVillageGlow(cx, cy);
    if (!winCut.on || !winCut.cv) return;
    lc.save(); lc.beginPath();
    for (const r of litPanes(cx, cy)) lc.rect(r[0], r[1], r[2], r[3]);
    lc.clip(); lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over';
    lc.drawImage(winCut.cv, winCut.x, winCut.y);
    lc.restore();
  };
}
