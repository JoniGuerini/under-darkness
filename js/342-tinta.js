'use strict';

/* ================= tinta: o tom do gelo e da sépia sem filtro de canvas (2026-10-12) =================
   O resfriado e o congelado da Nevasca (68) e o parado no tempo da Hora Parada (134) pintavam o inimigo com
   lc.filter (grayscale, sepia, hue-rotate...). Com o filtro ligado, CADA desenho do bicho vira uma camada
   filtrada à parte: com 40 bichos resfriados pelo anel de gelo o quadro chegava a meio segundo.
   Agora a mesma conta dos filtros (as matrizes de cor da especificação, passo a passo, com o mesmo corte em 0 e 1)
   é feita uma vez por cor e uma vez por figura, e o resultado fica guardado: o desenho tingido sai de uma cópia
   já pintada da figura (drawImage) e as cores de fillStyle/strokeStyle são trocadas pela cor tingida. O
   compositor dos humanoides (comp, 04) muda a cada desenho, então ele é tingido na hora, sem guardar.
   Uso: tintDraw(TINTA.x, () => desenho). Carrega antes do 68. */

const tintMat = {
  grayscale: a => { const s = 1 - a; return [0.2126 + 0.7874 * s, 0.7152 - 0.7152 * s, 0.0722 - 0.0722 * s, 0.2126 - 0.2126 * s, 0.7152 + 0.2848 * s, 0.0722 - 0.0722 * s, 0.2126 - 0.2126 * s, 0.7152 - 0.7152 * s, 0.0722 + 0.9278 * s]; },
  sepia: a => { const s = 1 - a; return [0.393 + 0.607 * s, 0.769 - 0.769 * s, 0.189 - 0.189 * s, 0.349 - 0.349 * s, 0.686 + 0.314 * s, 0.168 - 0.168 * s, 0.272 - 0.272 * s, 0.534 - 0.534 * s, 0.131 + 0.869 * s]; },
  saturate: s => [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
  hue: d => { const r = d * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    return [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
      0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
      0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072]; },
  brightness: b => [b, 0, 0, 0, b, 0, 0, 0, b]
};
// passos: [['grayscale', 0.7], ['hue', 160], ['contrast', 1.15], ...] na ordem do filtro CSS
function tintMake(steps) {
  const ops = steps.map(([k, v]) => k === 'contrast' ? { c: v } : { m: tintMat[k](v) });
  const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const memo = new Map();
  // rgb 0-255 empacotado -> rgb 0-255 empacotado
  const px = p => {
    let o = memo.get(p); if (o !== undefined) return o;
    let r = (p >> 16 & 255) / 255, g = (p >> 8 & 255) / 255, b = (p & 255) / 255;
    for (const op of ops) {
      if (op.m) { const m = op.m; const R = m[0] * r + m[1] * g + m[2] * b, G = m[3] * r + m[4] * g + m[5] * b, B = m[6] * r + m[7] * g + m[8] * b; r = cl(R); g = cl(G); b = cl(B); }
      else { r = cl((r - 0.5) * op.c + 0.5); g = cl((g - 0.5) * op.c + 0.5); b = cl((b - 0.5) * op.c + 0.5); }
    }
    o = Math.round(r * 255) << 16 | Math.round(g * 255) << 8 | Math.round(b * 255);
    memo.set(p, o); return o;
  };
  return { px, cols: new Map(), imgs: new WeakMap() };
}
const TINTA = {
  frio: tintMake([['grayscale', 0.4], ['sepia', 0.35], ['hue', 165], ['saturate', 1.8], ['brightness', 1.08]]),
  gelo: tintMake([['grayscale', 0.7], ['sepia', 0.4], ['hue', 160], ['saturate', 2.2], ['brightness', 1.25]]),
  sepia: tintMake([['grayscale', 1], ['sepia', 0.9], ['brightness', 1.08], ['contrast', 1.15]])
};

let tintCur = null, tintDraw = null;
{
  // só o lc (o mundo) passa por aqui, e só pesa um teste enquanto não há tinta
  const P = CanvasRenderingContext2D.prototype, norm = mk(1, 1).getContext('2d');
  const fsD = Object.getOwnPropertyDescriptor(P, 'fillStyle'), ssD = Object.getOwnPropertyDescriptor(P, 'strokeStyle'), di = P.drawImage;
  // uma cor de fillStyle tingida (texto como '#abc', 'rgba(...)' ou nome); gradiente e padrão passam como estão
  const tintCol = (T, v) => {
    if (typeof v !== 'string') return v;
    let o = T.cols.get(v); if (o !== undefined) return o;
    norm.fillStyle = '#000'; norm.fillStyle = v; const n = norm.fillStyle;
    let r, g, b, a = 1;
    if (n[0] === '#') { r = parseInt(n.slice(1, 3), 16); g = parseInt(n.slice(3, 5), 16); b = parseInt(n.slice(5, 7), 16); }
    else { const q = n.match(/[\d.]+/g).map(Number); [r, g, b] = q; a = q.length > 3 ? q[3] : 1; }
    const p = T.px(r << 16 | g << 8 | b);
    o = `rgba(${p >> 16 & 255},${p >> 8 & 255},${p & 255},${a})`;
    T.cols.set(v, o); return o;
  };
  // a figura tingida: guardada por figura; o compositor dos humanoides é tingido a cada vez num quadro de rascunho
  let scr = null, sx = null;
  const paint = (T, img, dx) => {
    const w = img.width, h = img.height;
    dx.clearRect(0, 0, w, h); di.call(dx, img, 0, 0);
    const d = dx.getImageData(0, 0, w, h), u = new Uint32Array(d.data.buffer);
    for (let i = 0; i < u.length; i++) { const v = u[i]; if (!(v >>> 24)) continue; const p = T.px((v & 255) << 16 | (v >> 8 & 255) << 8 | (v >> 16 & 255)); u[i] = (v & 0xff000000) | (p & 255) << 16 | (p >> 8 & 255) << 8 | (p >> 16 & 255); }
    dx.putImageData(d, 0, 0);
  };
  const tintImg = (T, img) => {
    const w = img.width, h = img.height; if (!(w > 0 && h > 0)) return null;
    if (typeof comp !== 'undefined' && img === comp) {
      if (!scr || scr.width < w || scr.height < h) { scr = mk(Math.max(w, 64), Math.max(h, 64)); sx = scr.getContext('2d', { willReadFrequently: true }); }
      paint(T, img, sx); return scr;
    }
    let o = T.imgs.get(img); if (o && o.width === w && o.height === h) return o;
    o = mk(w, h); paint(T, img, o.getContext('2d', { willReadFrequently: true })); T.imgs.set(img, o); return o;
  };
  lc.drawImage = function (img, ...a) {
    if (!tintCur) return di.call(lc, img, ...a);
    const t = tintImg(tintCur, img);
    if (!t) return di.call(lc, img, ...a);
    // o rascunho do compositor pode ser maior que a figura: recorta do canto
    if (a.length === 2) return di.call(lc, t, 0, 0, img.width, img.height, a[0], a[1], img.width, img.height);
    if (a.length === 4) return di.call(lc, t, 0, 0, img.width, img.height, a[0], a[1], a[2], a[3]);
    return di.call(lc, t, ...a);
  };
  // enquanto há tinta, guarda a última cor pedida (sem tinta), para devolver no fim
  let rawF = null, rawS = null;
  Object.defineProperty(lc, 'fillStyle', { configurable: true, get() { return fsD.get.call(lc); }, set(v) { if (tintCur) { rawF = v; v = tintCol(tintCur, v); } fsD.set.call(lc, v); } });
  Object.defineProperty(lc, 'strokeStyle', { configurable: true, get() { return ssD.get.call(lc); }, set(v) { if (tintCur) { rawS = v; v = tintCol(tintCur, v); } ssD.set.call(lc, v); } });
  // desenha fn() no lc com a tinta T; a tinta de dentro vale sobre a de fora (como o filtro de antes)
  tintDraw = function (T, fn) {
    const prev = tintCur;
    if (!prev) { rawF = fsD.get.call(lc); rawS = ssD.get.call(lc); }
    tintCur = T; fsD.set.call(lc, tintCol(T, rawF)); ssD.set.call(lc, tintCol(T, rawS));
    try { return fn(); } finally {
      tintCur = prev;
      fsD.set.call(lc, prev ? tintCol(prev, rawF) : rawF); ssD.set.call(lc, prev ? tintCol(prev, rawS) : rawS);
      if (!prev) rawF = rawS = null;
    }
  };
}
