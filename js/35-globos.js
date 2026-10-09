'use strict';

/* ================= life and mana orbs: pixel-art glass, liquid and iron frame, painted once into data URLs =================
   Each orb is 88x88 art pixels (glass 66x66 in the middle), scaled up in css/globos.css by --os.
   Layers: back (empty dark glass) -> liquid (static picture, cut from the top by the height of #hHpFill/#hMpFill)
   -> front (glass shine + frame). Nothing is repainted while playing. */
(function makeOrbTextures() {
  const N = 88, G = 66, GR = 33, C = 44;
  const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); f(x, w, h); return c.toDataURL(); };
  const px = (x, X, Y, col) => { x.fillStyle = col; x.fillRect(X, Y, 1, 1); };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bay = (X, Y) => BAYER[(Y & 3) * 4 + (X & 3)] / 16 - 0.5;
  const hash = (X, Y, s) => { let h = (X * 374761393 + Y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const pick = (ramp, v) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)))];
  // light comes from the upper left, a little in front
  const LX = -0.45, LY = -0.6, LZ = 0.66;

  const THEMES = {
    hp: {
      liq: ['#2a040b', '#470811', '#6a0d18', '#911621', '#b8202a', '#d93a34', '#f2604a', '#ff9478'],
      back: ['#060204', '#0d0508', '#16080d', '#200c13'],
    },
    mp: {
      liq: ['#04072a', '#081046', '#0e1c6c', '#162d96', '#2142bc', '#3260dc', '#5a8cf2', '#94bcff'],
      back: ['#020308', '#05070f', '#080c19', '#0c1224'],
    },
  };

  // sphere normal of a glass pixel (glass centred in its own 66x66 box)
  const sphere = (X, Y) => {
    const dx = (X + 0.5 - GR) / GR, dy = (Y + 0.5 - GR) / GR, r2 = dx * dx + dy * dy;
    if (r2 >= 1) return null;
    return { dx, dy, r2, z: Math.sqrt(1 - r2) };
  };

  const back = t => mk(G, G, x => {
    for (let Y = 0; Y < G; Y++) for (let X = 0; X < G; X++) {
      const s = sphere(X, Y); if (!s) continue;
      const v = 0.95 - s.r2 * 0.75 + (s.dx * LX + s.dy * LY) * 0.25 + bay(X, Y) * 0.3 + (hash(X, Y, 3) - 0.5) * 0.25;
      px(x, X, Y, pick(t.back, v));
    }
  });

  const liquid = t => mk(G, G, x => {
    for (let Y = 0; Y < G; Y++) for (let X = 0; X < G; X++) {
      const s = sphere(X, Y); if (!s) continue;
      const lam = Math.max(0, s.dx * LX + s.dy * LY + s.z * LZ);   // lambert
      const depth = (Y + 0.5) / G;                                    // deeper liquid is darker
      let v = 0.2 + lam * 0.85 - depth * 0.25 - Math.pow(s.r2, 2) * 0.3;
      if (s.r2 > 0.82 && s.dx < 0.1 && s.dy > -0.2) v += 0.18;            // light caught on the lower-left wall of the glass
      v += bay(X, Y) * 0.16 + (hash(X, Y, 7) - 0.5) * 0.12;          // ordered dither + grain
      let col = pick(t.liq, v);
      if (hash(X, Y, 11) < 0.012 && s.r2 < 0.7) col = t.liq[Math.min(t.liq.length - 1, Math.floor(v * t.liq.length) + 2)]; // tiny bubbles
      px(x, X, Y, col);
    }
  });

  const front = t => mk(N, N, x => {
    // glass: soft inner shadow on the rim, a big shine on the upper left, a small one beside it, a thin reflected arc lower right
    for (let Y = 0; Y < N; Y++) for (let X = 0; X < N; X++) {
      const dx = X + 0.5 - C, dy = Y + 0.5 - C, d = Math.hypot(dx, dy); if (d >= GR) continue;
      const a = Math.atan2(dy, dx) * 180 / Math.PI, P = (c) => { x.fillStyle = c; x.fillRect(X, Y, 1, 1); };
      if (d >= GR - 2) P(`rgba(0,0,0,${d >= GR - 1 ? 0.55 : 0.3})`);
      if (d >= GR - 6 && d < GR - 3 && a > -160 && a < -105) P(`rgba(255,248,236,${a < -150 || a > -112 || d < GR - 5.5 ? 0.22 : 0.5})`);
      if (d >= GR - 4 && d < GR - 2 && a > 25 && a < 70) P('rgba(255,240,230,.16)');
    }
    const blob = (bx, by, rx, ry, al) => { for (let Y = -ry; Y <= ry; Y++) for (let X = -rx; X <= rx; X++) if ((X * X) / (rx * rx) + (Y * Y) / (ry * ry) <= 1) { x.fillStyle = `rgba(255,250,240,${al})`; x.fillRect(bx + X, by + Y, 1, 1); } };
    blob(34, 25, 4, 2, 0.28); blob(33, 25, 2, 1, 0.3); px(x, 32, 24, 'rgba(255,255,255,.85)'); px(x, 41, 22, 'rgba(255,255,255,.6)');
    px(x, 27, 34, 'rgba(255,250,240,.35)');
    // a plain dark iron frame with a thin bronze lip
    const iron = ['#0e0c12', '#1b1820', '#2b2731', '#3e3846', '#544d5c', '#6c6476'];
    for (let Y = 0; Y < N; Y++) for (let X = 0; X < N; X++) {
      const dx = X + 0.5 - C, dy = Y + 0.5 - C, d = Math.hypot(dx, dy); if (d < GR || d >= GR + 7) continue;
      const nx = dx / d, ny = dy / d, l = nx * LX + ny * LY, g = bay(X, Y) * 0.2 + (hash(X, Y, 5) - 0.5) * 0.2;
      let col;
      if (d < GR + 1) col = '#000';
      else if (d < GR + 2) col = pick(['#4e3210', '#7a4e1a', '#b07a34', '#f2c470'], 0.45 - l * 0.5 + g);   // bronze lip faces inwards
      else if (d < GR + 6) col = pick(iron, 0.48 + l * 0.38 + g + (d < GR + 3 ? 0.16 : d >= GR + 5 ? -0.16 : 0));
      else col = '#000';
      px(x, X, Y, col);
    }
  });

  const R = document.documentElement.style;
  for (const k of ['hp', 'mp']) {
    const t = THEMES[k];
    R.setProperty(`--orb-${k}-back`, `url(${back(t)})`);
    R.setProperty(`--orb-${k}-liq`, `url(${liquid(t)})`);
    R.setProperty(`--orb-${k}-front`, `url(${front(t)})`);
  }
})();
