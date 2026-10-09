'use strict';

/* ================= interface textures: pixel-art frames and stone, drawn once into data URLs ================= */
(function makeUITextures() {
  const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); f(x, w, h); return c.toDataURL(); };
  const px = (x, X, Y, col) => { x.fillStyle = col; x.fillRect(X, Y, 1, 1); };
  // big forged frame: black rim, bronze band with light top-left and dark bottom-right, black line, slate inner line; gold studs in the corners
  const frame = (n, b, rings, corner) => mk(n, n, (x) => {
    for (let Y = 0; Y < n; Y++) for (let X = 0; X < n; X++) {
      const r = Math.min(X, Y, n - 1 - X, n - 1 - Y); if (r >= b) continue;
      const lit = (Y === r && X >= r && X <= n - 1 - r) || (X === r && Y >= r && Y <= n - 1 - r);
      const c = rings[r]; px(x, X, Y, Array.isArray(c) ? c[lit ? 0 : 1] : c);
    }
    for (const [fx, fy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (let Y = 0; Y < b; Y++) for (let X = 0; X < b; X++) {
      const c = corner(X, Y); if (c) px(x, fx ? n - 1 - X : X, fy ? n - 1 - Y : Y, c);
    }
  });
  const big = frame(26, 10, ['#000', '#15100a', ['#5a5262', '#221d28'], ['#3e3746', '#1a161f'], '#000', ['#f2c470', '#7a4e1a'], ['#b07a34', '#4e3210'], '#000', '#0f0b13', '#3b3046'], (X, Y) => {
    if (X === 0 || Y === 0 || X === 9 || Y === 9) return '#000';
    const d = Math.abs(X - 4.5) + Math.abs(Y - 4.5);
    if (d <= 2) return X + Y <= 8 ? (X === 4 && Y === 4 ? '#ffc4b4' : '#e04848') : '#8a1a24';   // a ruby set in the corner
    if (d <= 3) return '#000';
    if (X === 1 || Y === 1) return '#f2c470';
    if (X === 8 || Y === 8) return '#5e3c14';
    return '#b07a34';
  });
  const small = frame(10, 4, ['#000', ['#e0b060', '#6e4718'], ['#a87230', '#4e3210'], '#000'], (X, Y) => {
    if (X === 0 || Y === 0 || X === 3 || Y === 3) return '#000';
    return X === 1 && Y === 1 ? '#fff2c0' : X === 2 && Y === 2 ? '#a86a20' : '#ffd060';
  });
  // worn stone blocks with grit, tiled under every panel
  const stone = mk(64, 64, (x) => {
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let row = 0; row < 4; row++) for (let b = -1; b < 3; b++) {
      const bx = b * 32 + (row % 2 ? 16 : 0), by = row * 16, t = Math.floor(rnd() * 6);
      x.fillStyle = `rgb(${24 + t},${19 + t},${29 + t})`; x.fillRect(bx, by, 32, 16);
      x.fillStyle = `rgb(${33 + t},${27 + t},${38 + t})`; x.fillRect(bx + 1, by + 1, 30, 1);
      x.fillStyle = '#0d0a11'; x.fillRect(bx, by + 15, 32, 1); x.fillRect(bx + 31, by, 1, 16);
    }
    for (let i = 0; i < 520; i++) { const v = rnd(); x.fillStyle = v < 0.5 ? 'rgba(0,0,0,.35)' : 'rgba(255,235,200,.05)'; x.fillRect(Math.floor(rnd() * 64), Math.floor(rnd() * 64), 1, 1); }
  });
  const R = document.documentElement.style;
  R.setProperty('--tx-frame', `url(${big})`); R.setProperty('--tx-frame-sm', `url(${small})`); R.setProperty('--tx-stone', `url(${stone})`);
})();
