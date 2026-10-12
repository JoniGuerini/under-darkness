'use strict';

/* ================= o Conjunto da Hora Parada em jogo (dados e efeitos: js/133-hora-parada.js) =================
   - Inimigo parado no tempo: desenhado em sépia, como uma foto antiga, com um mostrador em volta que se apaga
     tique a tique até o tempo voltar (o ponteiro varre o que falta).
   - Quando o tempo para: um mostrador de relógio se abre do alvo e a tela perde a cor por um instante.
   - Os ecos dos golpes são um anel ciano pequeno; o dano que volta de uma vez, um anel de latão.
   - O Rebobinar deixa um rastro ciano do lugar da morte até onde o herói estava, e um mostrador girando ao contrário.
   - Com as botas aceleradas, poeira ciana nos pés.
   As partes acesas das peças ficam com o 131 (ECL_EMIT e GEAR_SPOT). Embrulha drawEnemy; carrega depois do 68 (o
   resfriado de lá fica por dentro, então o gelo ainda pinta o inimigo se ele também estiver congelado). */

const HOR_GL = { ring: glow(30, '#9ae8ff'), gold: glow(16, '#f0d080') };
{
  // grayscale(1) sepia(0.9) brightness(1.08) contrast(1.15), sem lc.filter: js/342-tinta.js
  const _draw = drawEnemy;
  drawEnemy = function (e, cx, cy) {
    if (!(e.horT > 0)) return _draw(e, cx, cy);
    tintDraw(TINTA.sepia, () => _draw(e, cx, cy));
  };
}

// a clock face of radius r round (x, y): 12 ticks, the first `lit` in `col`, the rest in `dim` (none if null);
// `hand`: angle of a hand from the centre, or null
function horDial(x, y, r, lit, col, dim, hand) {
  for (let i = 0; i < 12; i++) {
    if (i >= lit && !dim) continue;
    const a = -Math.PI / 2 + i / 12 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    lc.fillStyle = i < lit ? col : dim;
    lc.fillRect(Math.round(x + c * r), Math.round(y + s * r), 1, 1);
    if (i % 3 === 0) lc.fillRect(Math.round(x + c * (r - 1)), Math.round(y + s * (r - 1)), 1, 1);   // the quarter hours are longer
  }
  if (hand != null) { lc.fillStyle = col; const c = Math.cos(hand), s = Math.sin(hand); for (let k = 1; k < r - 1; k++) lc.fillRect(Math.round(x + c * k), Math.round(y + s * k), 1, 1); }
}
function horCircle(x, y, r, col) {
  const m = Math.ceil(Math.PI * 2 * r); lc.fillStyle = col;
  for (let i = 0; i < m; i++) { const a = i / m * Math.PI * 2; lc.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1); }
}

HOOK.update.push(dt => {
  // the boots, while time runs fast for you
  if (pl.horHaste > gameTime && !pl.dead && Math.abs(pl.vx) > 20 && Math.random() < dt * 30)
    parts.push({ x: pl.x + pl.w / 2 + rnd(-3, 3), y: pl.y + pl.h - 1, vx: -pl.vx * 0.15, vy: rnd(-14, -2), g: 0, life: 0.35, max: 0.35, col: Math.random() < 0.7 ? '#9ae8ff' : '#f0d080', size: 1, glow: true });
});

HOOK.drawGlow.push((cx, cy) => {
  for (const f of horFx) {
    const k = f.t / f.max;
    if (f.kind === 'stop') { const r = 8 + HOR.r * easeOut(k); lc.globalAlpha = (1 - k) * 0.6; lc.drawImage(HOR_GL.ring, Math.round(f.x - cx - r), Math.round(f.y - cy - r), Math.round(r * 2), Math.round(r * 2)); }
    else if (f.kind === 'release') { lc.globalAlpha = (1 - k) * 0.7; lc.drawImage(HOR_GL.gold, Math.round(f.x - cx) - 16, Math.round(f.y - cy) - 16); }
  }
  lc.globalAlpha = 1;
});

HOOK.drawTop.push((cx, cy) => {
  const W = lc.canvas.width, H = lc.canvas.height;
  // the moment time stops: the colour drains out of the world, then comes back
  if (horFlash > 0) {
    const k = horFlash / 0.45;
    lc.save();
    lc.globalCompositeOperation = 'saturation'; lc.globalAlpha = k * 0.9; lc.fillStyle = '#808080'; lc.fillRect(0, 0, W, H);
    lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = k * 0.12; lc.fillStyle = '#e8dcc0'; lc.fillRect(0, 0, W, H);
    lc.restore();
  }
  // every stopped foe wears its own countdown
  for (const e of enemies) {
    if (!(e.horT > 0) || e.dead) continue;
    const x = Math.round(e.x + e.w / 2 - cx), y = Math.round(e.y + e.h / 2 - cy), r = Math.round(Math.max(e.w, e.h) / 2) + 4;
    if (x < -r || y < -r || x > W + r || y > H + r) continue;
    const left = clamp(e.horT / (e.horMax || 1), 0, 1);
    lc.globalAlpha = 0.9; horDial(x, y, r, Math.ceil(12 * left), '#d8f8ff', '#3a4a6a', -Math.PI / 2 + left * Math.PI * 2);
  }
  lc.globalAlpha = 1;
  for (const f of horFx) {
    const k = f.t / f.max, x = f.x - cx, y = f.y - cy;
    lc.globalAlpha = 1 - k;
    if (f.kind === 'stop') {
      const r = 6 + HOR.r * easeOut(k);
      horCircle(x, y, r, '#9ae8ff'); horDial(x, y, r - 2, 12, '#fff6e0', null, -Math.PI / 2 + k * Math.PI * 4);
    } else if (f.kind === 'echo') horCircle(x, y, 3 + 8 * k, '#9ae8ff');
    else if (f.kind === 'release') { horCircle(x, y, 4 + 14 * easeOut(k), '#f0d080'); horCircle(x, y, 2 + 9 * easeOut(k), '#fff6e0'); }
    else if (f.kind === 'rewind') {
      const P = f.path, n = P.length;
      for (let i = 0; i < n; i++) { lc.globalAlpha = (1 - k) * (0.3 + 0.7 * i / n); lc.fillStyle = i % 2 ? '#9ae8ff' : '#d8f8ff'; lc.fillRect(Math.round(P[i][0] - cx) - 1, Math.round(P[i][1] - cy) - 1, 2, 2); }
      lc.globalAlpha = 1 - k; horDial(x, y, 12 + 4 * k, 12, '#9ae8ff', null, -Math.PI / 2 - k * Math.PI * 6);
    }
  }
  lc.globalAlpha = 1;
});
