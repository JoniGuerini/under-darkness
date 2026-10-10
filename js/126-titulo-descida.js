'use strict';
/* arte da tela de título: a descida. Um corte do chão, do vilarejo lá em cima até a Escuridão lá embaixo.
   Cada faixa é uma camada do jogo (Cavernas, Catedral, Gelo, Mina, as camadas esquecidas e a Escuridão),
   cada vez mais escura. O poço do vilarejo desce por todas elas; o herói vai descendo na corda, com a lanterna.
   Pintada uma vez (480x270, 39-titulo). Por quadro só mexem coisas pequenas, na camada de efeitos:
   a corda e o herói balançando, a luz da lanterna tremendo, poeira caindo no poço, esporos, brasas e os olhos lá no fundo.
   A arte antiga (castelo e cavaleiro) continua no 39-titulo como paintTitleArt. */
function paintTitleArtDescida() {
  const W = TITLE_W, H = TITLE_H;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d'), img = cx.createImageData(W, H), D = img.data;
  const C = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const P = a => a.map(C);
  const h2 = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const sm = t => t * t * (3 - 2 * t);
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi); const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const fbm = (x, y, s, o = 4) => { let t = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { t += vn(x * f, y * f, s + i * 17) * a; n += a; a *= 0.5; f *= 2; } return t / n; };
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bay = (x, y) => (BAY[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const rp = (pal, t, x, y) => { const f = cl(t, 0, 0.9999) * (pal.length - 1), i = Math.floor(f); return (f - i) > bay(x, y) ? pal[i + 1] : pal[i]; };
  const qa = (a, x, y, n = 4) => Math.floor(cl(a, 0, 1) * n + bay(x, y)) / n;
  const put = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255; };
  const get = (x, y) => { const i = (y * W + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const blend = (x, y, c, a) => { x |= 0; y |= 0; if (a <= 0 || x < 0 || y < 0 || x >= W || y >= H) return; put(x, y, mix(get(x, y), c, cl(a, 0, 1))); };

  /* ---------- geometria: chão, faixas das camadas e o poço ---------- */
  const ROPE = 322;                                                    // x da corda (o poço é centrado nela lá em cima)
  const yS = x => 50 + (fbm(x / 30, 1, 3) - 0.5) * 5 + (Math.abs(x - ROPE) < 16 ? 0 : 0);
  const BASE = [0, 94, 136, 174, 207, 236];                            // topo de cada camada (a 0 começa no chão)
  const bTop = (k, x) => k === 0 ? yS(x) : BASE[k] + (fbm(x / 55, k * 3, 11 + k) - 0.5) * 18 + (fbm(x / 12, k * 5, 13 + k) - 0.5) * 6;
  const layerAt = (x, y) => { let k = 0; const yy = y + (h2(x, y, 17) - 0.5) * 6; for (let i = 1; i < BASE.length; i++) if (yy >= bTop(i, x)) k = i; return k; };
  const xs = y => ROPE + 1 + Math.sin(y / 23) * (y > 60 ? 5 : 0) * cl((y - 60) / 40, 0, 1) + (fbm(y / 14, 2, 21) - 0.5) * 6 * cl((y - 60) / 40, 0, 1);
  const hw = y => 12 + cl((y - 58) / 30, 0, 1) * 10 + (fbm(y / 9, 4, 23) - 0.5) * 8 + Math.max(0, y - 214) * 0.9 + Math.pow(Math.max(0, y - 236) / 34, 2) * 50;
  const edgeL = y => xs(y) - hw(y) - (fbm(y / 6, 1, 25) - 0.5) * 12, edgeR = y => xs(y) + hw(y) + (fbm(y / 6, 2, 27) - 0.5) * 12;
  const shaft = (x, y) => y >= yS(x) - 1 && x > edgeL(y) && x < edgeR(y);
  const near = (x, y) => { const d = Math.max(0, Math.max(edgeL(y) - x, x - edgeR(y))); return Math.exp(-d / 40); };

  // cavernas de cada camada: bolsões abertos, maiores perto do poço
  const MARG = [5, 6, 5, 5, 4, 0];
  const cave = (x, y) => {
    const k = layerAt(x, y);
    if (k === 5) return true;                                          // a Escuridão é vazio
    const top = bTop(k, x) + MARG[k], bot = bTop(k + 1, x) - MARG[k];
    if (y < top || y > bot) return false;
    const mid = (top + bot) / 2, hh = (bot - top) / 2;
    const fall = 1 - Math.pow(Math.abs(y - mid) / hh, 2);              // mais aberto no meio da faixa
    const near = cl(1 - Math.abs(x - ROPE) / 150, 0, 1);
    const n = fbm(x / 30, y / 13, 31 + k * 7) * 0.75 + fbm(x / 8, y / 6, 37 + k) * 0.25;
    return n * (0.5 + fall * 0.7) + near * 0.05 > 0.6;
  };
  const open = new Uint8Array(W * H), LY = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, sky = y < yS(x);
    LY[i] = sky ? 255 : layerAt(x, y);
    open[i] = sky ? 2 : shaft(x, y) || cave(x, y) ? 1 : 0;
  }
  const isRock = (x, y) => x >= 0 && x < W && y >= 0 && y < H && open[y * W + x] === 0;
  const isOpen = (x, y) => x >= 0 && x < W && y >= 0 && y < H && open[y * W + x] === 1;
  // borda do poço: a rocha que dá para ele pega um fio de luz (de cima, da lua; lá embaixo, do vermelho)
  const rim = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (open[y * W + x] !== 0) continue;
    let k = 0; for (let d = 1; d <= 3 && !k; d++) if ((x - d >= 0 && shaft(x - d, y)) || (x + d < W && shaft(x + d, y)) || (y - d >= 0 && shaft(x, y - d))) k = 4 - d;
    rim[y * W + x] = k;
  }

  /* ---------- luzes ---------- */
  const HERO = { x: ROPE, y: 112 };                                    // mão na corda; a lanterna fica abaixo à direita
  const LANT = { x: ROPE + 7, y: HERO.y + 16 };
  const lights = [
    { x: LANT.x, y: LANT.y, r: 70, c: C('#ffb45a'), s: 1.25 },
    { x: 404, y: 113, r: 30, c: C('#c070ff'), s: 0.7 },                 // a rosácea da catedral
    { x: 247, y: 120, r: 12, c: C('#ffb45a'), s: 0.5 },                 // velas
    { x: 268, y: 156, r: 22, c: C('#7ad8ff'), s: 0.75 },                // cristais de gelo
    { x: 420, y: 160, r: 20, c: C('#7ad8ff'), s: 0.6 },
    { x: 383, y: 190, r: 22, c: C('#ff9a3a'), s: 0.8 },                 // lampiões da mina
    { x: 236, y: 189, r: 16, c: C('#ff9a3a'), s: 0.6 },
    { x: 278, y: 226, r: 15, c: C('#5cffb0'), s: 0.65 },                // fungos
    { x: 396, y: 224, r: 15, c: C('#5cffb0'), s: 0.55 },
    { x: 452, y: 221, r: 11, c: C('#5cffb0'), s: 0.45 },
    { x: 330, y: 292, r: 110, c: C('#c0301a'), s: 1.2 },               // o fundo, vermelho
  ];
  const lightAt = (x, y) => {
    let a = 0, r = 0, g = 0, b = 0;
    for (const L of lights) {
      const d = Math.hypot(x - L.x, (y - L.y) * 1.1); if (d >= L.r) continue;
      const f = Math.pow(1 - d / L.r, 1.6) * L.s; a += f; r += L.c[0] * f; g += L.c[1] * f; b += L.c[2] * f;
    }
    return a > 0 ? { a, c: [r / a, g / a, b / a] } : null;
  };
  // luz ambiente: some com a profundidade
  const ambY = y => cl(0.5 * Math.pow(1 - cl((y - 50) / 215, 0, 1), 1.25), 0, 0.5);
  const AMB = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) AMB[y * W + x] = ambY(y) * (shaft(x, y) ? 0.22 : 0.04 + 0.96 * near(x, y));
  const amb = (y, x = ROPE) => AMB[cl(y | 0, 0, H - 1) * W + cl(x | 0, 0, W - 1)];

  /* ---------- paletas por camada: rocha da frente e parede do fundo ---------- */
  const ROCKP = [
    P(['#0e0806', '#1a100a', '#28180e', '#3a2414', '#4e321c', '#664426', '#7e5832']),   // cavernas: terra
    P(['#0a090e', '#131118', '#1d1924', '#29232f', '#37303e', '#493f50', '#5d5266']),   // catedral: cantaria
    P(['#070c14', '#0c1724', '#132438', '#1c3550', '#2a4e6e', '#3f6e8e', '#6a9cb8']),   // gelo
    P(['#0a0908', '#12100e', '#1b1815', '#26211c', '#332b24', '#40362c', '#4e4234']),   // mina
    P(['#070908', '#0c100e', '#121915', '#19231d', '#213027', '#2c3f33', '#3a5040']),   // esquecidas
    P(['#020103', '#040206', '#070409', '#0a060d']),                                     // escuridão
  ];
  const WALLP = [
    P(['#070404', '#0d0806', '#140c09', '#1d120c', '#271810']),
    P(['#060509', '#0b0a0f', '#110f16', '#18151e', '#201c27']),
    P(['#04070c', '#070d16', '#0b1420', '#101d2c', '#16283a']),
    P(['#050404', '#090807', '#0e0c0a', '#14110e', '#1a1612']),
    P(['#030504', '#060907', '#0a0e0b', '#0e1410', '#131b16']),
    P(['#010102', '#020203', '#040306', '#060409']),
  ];

  /* ---------- céu e superfície ---------- */
  const SKY = P(['#05050b', '#080812', '#0c0b18', '#110f1f', '#171327', '#1e1830', '#281e38']);
  const MOON = { x: 446, y: 15, r: 7 };
  for (let y = 0; y < 60; y++) for (let x = 0; x < W; x++) {
    if (open[y * W + x] !== 2) continue;
    const t = Math.pow(y / 52, 1.3) * 0.85 + (fbm(x / 70, y / 20, 5) - 0.5) * 0.12;
    let c = rp(SKY, t, x, y);
    const dm = Math.hypot(x - MOON.x, y - MOON.y);
    c = mix(c, C('#8c84a0'), qa(Math.exp(-Math.max(0, dm - MOON.r) / 9) * 0.35, x, y, 5));
    put(x, y, c);
    const r = h2(x, y, 9);
    if (r > 0.993 && dm > MOON.r + 6 && y < 40) put(x, y, h2(x, y, 10) > 0.6 ? C('#d8d2e6') : C('#77708e'));
  }
  // lua minguante: um fio de osso
  for (let y = MOON.y - MOON.r; y <= MOON.y + MOON.r; y++) for (let x = MOON.x - MOON.r; x <= MOON.x + MOON.r; x++) {
    const d = Math.hypot(x - MOON.x, y - MOON.y), d2 = Math.hypot(x - MOON.x - 3.5, y - MOON.y + 1.5);
    if (d <= MOON.r && d2 > MOON.r - 0.5) put(x, y, d2 > MOON.r + 2 ? C('#f2ead6') : C('#b8aeb0'));
  }
  // morros ao longe
  const MT = P(['#0a0912', '#0e0c17', '#13101d']);
  for (let x = 0; x < W; x++) {
    const top = Math.round(38 - (1 - Math.abs(2 * fbm(x / 50, 0.5, 7, 5) - 1)) * 14);
    for (let y = top; y < 60; y++) if (open[y * W + x] === 2) put(x, y, rp(MT, (y - top) / 20 + (fbm(x / 6, y / 4, 8) - 0.5) * 0.3, x, y));
  }

  /* ---------- rocha e paredes, com luz ---------- */
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, o = open[i]; if (o === 2) continue;
    const k = LY[i];
    const L = lightAt(x, y), la = L ? L.a : 0;
    const lit = amb(y, x) + la;
    let c;
    if (o === 0) {
      // rocha: estratos, veios e um friso claro na borda virada para o vazio
      let t = 0.32 + (fbm(x / 6, y / 4, 101 + k) - 0.5) * 0.45;
      const st = fbm(x / 26, y / 3, 103 + k);
      if (st > 0.62) t += 0.16; else if (st > 0.58) t -= 0.12;
      if (k === 1 && ((y + (x >> 3 & 1) * 2) % 5 === 0 || (x + ((y / 5 | 0) & 1) * 5) % 10 === 0)) t -= 0.12;   // blocos de cantaria
      if (k === 3 && fbm(x / 3, y / 7, 107) > 0.68) t += 0.1;
      let edge = 0;
      if (isOpen(x, y - 1) || isOpen(x, y - 2)) edge = 0.32;                                  // chão aceso
      else if (isOpen(x, y + 1)) edge = -0.08;                                                // teto em sombra
      else if (isOpen(x - 1, y) || isOpen(x + 1, y)) edge = 0.14;
      t = t * (0.25 + lit * 1.05) + edge * (0.35 + lit);
      if (rim[i]) t += rim[i] * 0.09;
      c = rp(ROCKP[k], t, x, y);
    } else {
      // parede do fundo: mais escura, com textura larga
      let t = 0.35 + (fbm(x / 9, y / 6, 201 + k) - 0.5) * 0.5;
      if (k === 1 && (y % 6 === 0 || (x + ((y / 6 | 0) & 1) * 6) % 12 === 0)) t -= 0.15;
      if (k === 3 && x % 14 < 1) t -= 0.1;
      // sombra projetada pela rocha logo acima
      let sh = 0; for (let d = 1; d <= 4; d++) if (isRock(x, y - d)) { sh = (5 - d) / 5; break; }
      t = t * (0.2 + lit * 1.0) - sh * 0.25;
      if (shaft(x, y)) t = t * 0.55 - 0.05;   // o poço é mais fundo que as cavernas: a parede dele fica longe e escura
      if (k === 5) t = 0.2 * (fbm(x / 20, y / 10, 209)) + la * 0.9;
      c = rp(WALLP[k], t, x, y);
    }
    if (L) c = mix(c, L.c, qa(Math.min(0.55, la * 0.45), x, y, 8));
    put(x, y, c);
  }

  // minério em cada camada: cobre, ferro, ouro, cobalto e um verde que ninguém conhece
  const ORE = [['#c8703a', '#8a4422'], ['#a8a0a8', '#6a646c'], ['#f0c850', '#a8842c'], ['#4a7cf0', '#2c4aa0'], ['#4ad8a0', '#258a64']];
  for (let n = 0; n < 160; n++) {
    const x = (h2(n, 1, 301) * W) | 0, y = (55 + h2(n, 2, 301) * 180) | 0;
    if (!isRock(x, y)) continue;
    const k = LY[y * W + x]; if (k > 4) continue;
    const L = lightAt(x, y), v = amb(y, x) + (L ? L.a : 0); if (v < 0.12) continue;
    const pal = ORE[k].map(C);
    for (const [dx, dy, j] of [[0, 0, 0], [1, 0, 1], [0, 1, 1], [1, 1, 0]]) if (isRock(x + dx, y + dy) && h2(x + dx, y + dy, 303) > 0.25) put(x + dx, y + dy, mix(get(x + dx, y + dy), pal[j], cl(v * 1.3, 0.25, 1)));
  }

  /* ---------- superfície: grama, o vilarejo e o poço ---------- */
  for (let x = 0; x < W; x++) {
    const top = Math.ceil(yS(x));
    if (open[top * W + x] === 1) continue;
    for (let j = 0; j < 3; j++) if (isRock(x, top + j)) put(x, top + j, C(j === 0 ? '#2c3a22' : j === 1 ? '#1d2716' : '#1a140e'));
    if (h2(x, 1, 401) > 0.55 && !shaft(x, top - 1)) put(x, top - 1, C('#1e2a18'));
    if (h2(x, 2, 401) > 0.85 && !shaft(x, top - 2)) put(x, top - 2, C('#161f12'));
  }
  // casas: silhuetas com telhado e janelas acesas
  const HOUSE = P(['#0a080c', '#100d12', '#171219']), ROOF = P(['#0d0a0e', '#151017', '#1d151c']);
  const house = (x0, w, h, roof, wins) => {
    const base = Math.round(yS(x0 + w / 2));
    for (let y = base - h; y < base + 1; y++) for (let x = x0; x < x0 + w; x++) put(x, y, rp(HOUSE, 0.3 + (fbm(x / 3, y / 3, 411) - 0.5) * 0.6 + (x === x0 ? -0.2 : 0), x, y));
    for (let j = 0; j < roof; j++) for (let x = x0 - 2 + j; x < x0 + w + 2 - j; x++) put(x, base - h - 1 - j, rp(ROOF, 0.4 + (j === 0 ? 0.3 : 0) + (fbm(x / 2, j, 413) - 0.5) * 0.5, x, base - h - 1 - j));
    for (const [wx, wy] of wins) { put(x0 + wx, base - h + wy, C('#ffcf72')); put(x0 + wx + 1, base - h + wy, C('#f0a048')); put(x0 + wx, base - h + wy + 1, C('#d07a30')); put(x0 + wx + 1, base - h + wy + 1, C('#a85a24'));
      for (let d = -5; d <= 5; d++) for (let e = -2; e <= 6; e++) { const xx = x0 + wx + d, yy = base - h + wy + e; if (yy < base + 1 && open[yy * W + xx] === 2) blend(xx, yy, C('#ff9a40'), qa(0.22 * (1 - Math.hypot(d, e) / 6), xx, yy, 4)); } }
    return base - h - roof;
  };
  const ch1 = house(352, 18, 9, 7, [[4, 3], [12, 3]]);
  house(378, 12, 7, 5, [[5, 2]]);
  const ch2 = house(400, 22, 11, 8, [[3, 3], [10, 3], [17, 3]]);
  house(430, 14, 8, 6, [[4, 3]]);
  house(452, 20, 10, 7, [[5, 3], [13, 3]]);
  house(276, 14, 8, 6, [[5, 2]]);
  // chaminés e torre da capela
  for (let y = ch1 - 4; y < ch1 + 3; y++) { put(366, y, C('#0c0a0e')); put(367, y, C('#0c0a0e')); }
  for (let y = ch2 - 3; y < ch2 + 4; y++) { put(404, y, C('#0c0a0e')); put(405, y, C('#0c0a0e')); }
  { const bx = 470, base = Math.round(yS(bx)); for (let y = base - 26; y <= base; y++) for (let x = bx - 3; x <= bx + 3; x++) put(x, y, rp(HOUSE, 0.3 + (fbm(x / 2, y / 3, 415) - 0.5) * 0.5, x, y));
    for (let j = 0; j < 12; j++) for (let x = bx - 3 + (j >> 2); x <= bx + 3 - (j >> 2); x++) put(x, base - 27 - j, C('#0e0a10'));
    put(bx, base - 20, C('#ffcf72')); put(bx, base - 19, C('#c87030')); }
  // fumaça das chaminés (ralinha, parada; quem mexe é a camada de efeitos)
  // o poço: borda de pedra, o sarilho de madeira e a corda
  { const top = Math.round(yS(ROPE));
    const WELL = P(['#16121a', '#221c26', '#30283a', '#443a4e']), WOOD = P(['#1a0f08', '#2a180c', '#3e2412', '#58361a']);
    for (let y = top - 4; y < top + 2; y++) for (const side of [-1, 1]) for (let i = 0; i < 4; i++) { const x = ROPE + side * (11 + i) ; put(x, y, rp(WELL, 0.3 + (y === top - 4 ? 0.5 : 0) + (fbm(x / 2, y / 2, 421) - 0.5) * 0.5 + (i === 0 ? 0.15 : 0), x, y)); }
    for (let y = top - 17; y < top - 4; y++) { put(ROPE - 12, y, rp(WOOD, 0.5, ROPE - 12, y)); put(ROPE - 13, y, rp(WOOD, 0.2, ROPE - 13, y)); put(ROPE + 12, y, rp(WOOD, 0.5, ROPE + 12, y)); put(ROPE + 13, y, rp(WOOD, 0.2, ROPE + 13, y)); }
    for (let x = ROPE - 13; x <= ROPE + 14; x++) { put(x, top - 15, rp(WOOD, 0.75, x, top - 15)); put(x, top - 14, rp(WOOD, 0.35, x, top - 14)); }   // eixo
    for (let x = ROPE - 4; x <= ROPE + 4; x++) for (let y = top - 17; y <= top - 13; y++) if (Math.abs(x - ROPE) + Math.abs(y - top + 15) * 1.5 < 5) put(x, y, rp(WOOD, 0.55 + (x - ROPE) * 0.06, x, y));   // rolo com a corda enrolada
    for (let j = 0; j < 4; j++) put(ROPE + 15 + j, top - 15 + (j >> 1), C('#3e2412'));   // manivela
    for (let x = ROPE - 16; x <= ROPE + 16; x++) for (let j = 0; j < 3; j++) { const y = top - 19 - j + Math.abs(x - ROPE) / 4 | 0; if (j < 3) put(x, y + j, rp(ROOF, 0.6 - j * 0.25, x, y + j)); }   // telhadinho
  }

  /* ---------- camada 1: raízes, estalactites e teias ---------- */
  const ROOT = P(['#1a100a', '#2a1a0e', '#3c2614']);
  for (let n = 0; n < 70; n++) {
    let x = (h2(n, 3, 501) * W) | 0; if (x > 440 || x < 20) continue;
    let y = Math.ceil(yS(x)) + 3; while (y < 92 && isRock(x, y)) y++;
    if (y >= 90 || !isOpen(x, y)) continue;
    const len = 4 + (h2(n, 4, 501) * 12) | 0;
    for (let j = 0; j < len && isOpen(x, y); j++) { const L = lightAt(x, y); put(x, y, rp(ROOT, (amb(y, x) + (L ? L.a : 0)) * 1.2, x, y)); if (h2(n, j, 503) > 0.75) x += h2(n, j, 505) > 0.5 ? 1 : -1; y++; }
  }
  // estalactites em todas as camadas de cima (de gelo na terceira)
  for (let n = 0; n < 140; n++) {
    const x = (h2(n, 5, 511) * W) | 0, y0 = (60 + h2(n, 6, 511) * 150) | 0;
    if (!isRock(x, y0) || !isOpen(x, y0 + 1)) continue;
    const k = LY[y0 * W + x]; if (k > 4 || Math.abs(x - xs(y0)) < hw(y0) + 1) continue;
    const len = 2 + (h2(n, 7, 511) * (k === 2 ? 9 : 5)) | 0;
    const pal = k === 2 ? P(['#1c3550', '#3f6e8e', '#8ac4e0', '#d8f4ff']) : ROCKP[k];
    for (let j = 1; j <= len; j++) for (let w = -1; w <= 1; w++) {
      if (Math.abs(w) > (len - j) / 3) continue;
      const xx = x + w, yy = y0 + j; if (!isOpen(xx, yy)) continue;
      const L = lightAt(xx, yy); put(xx, yy, rp(pal, (amb(yy, xx) + (L ? L.a : 0)) * (k === 2 ? 1.1 : 0.9) + (w < 0 ? 0.15 : 0), xx, yy));
    }
  }
  // teias num canto da caverna
  const web = (cx0, cy0, r) => { for (let a = 0; a < 6; a++) { const ang = Math.PI * 0.05 + a * Math.PI * 0.09; for (let d = 1; d < r; d++) { const x = Math.round(cx0 + Math.cos(ang) * d), y = Math.round(cy0 + Math.sin(ang) * d); if (isOpen(x, y)) blend(x, y, C('#8a8290'), 0.35); } }
    for (let rr = 3; rr < r; rr += 3) for (let a = 0; a < 30; a++) { const ang = Math.PI * 0.05 + a / 30 * Math.PI * 0.45, x = Math.round(cx0 + Math.cos(ang) * rr), y = Math.round(cy0 + Math.sin(ang) * rr); if (isOpen(x, y)) blend(x, y, C('#6a6272'), 0.3); } };
  { let best = null; for (let x = 340; x < 420; x++) for (let y = 62; y < 80; y++) if (isOpen(x, y) && isRock(x - 1, y) && isRock(x, y - 1) && !shaft(x, y)) { best = [x, y]; break; } if (best) web(best[0], best[1], 12); }

  /* ---------- camada 2: arcos góticos, a rosácea e velas ---------- */
  const ARCH = P(['#0f0d14', '#1a1622', '#28222f', '#3a3244', '#4e445a', '#665a72']);
  const pillar = (x0, yTop, yBot) => { for (let y = yTop; y <= yBot; y++) for (let i = 0; i < 5; i++) { const x = x0 + i; if (!isOpen(x, y)) continue; const L = lightAt(x, y); const v = amb(y, x) + (L ? L.a : 0); let t = (0.15 + (i === 1 ? 0.35 : i === 2 ? 0.2 : i === 4 ? -0.1 : 0)) * (0.4 + v * 1.2) + (y === yTop || y === yBot ? 0.2 : 0); put(x, y, rp(ARCH, t, x, y)); } };
  const arch = (xa, xb, yTop) => { const mid = (xa + xb) / 2, half = (xb - xa) / 2; for (let x = xa; x <= xb; x++) { const u = Math.abs(x - mid) / half; const y = Math.round(yTop + (1 - Math.sqrt(1 - Math.pow(1 - u, 2) * 0 - u * u * 0)) + Math.pow(u, 1.6) * half * 0.9); for (let j = 0; j < 2; j++) if (isOpen(x, y + j - 0)) { const L = lightAt(x, y); put(x, y + j, rp(ARCH, (0.25 + (j ? -0.1 : 0.2)) * (0.4 + (amb(y, x) + (L ? L.a : 0)) * 1.2), x, y + j)); } } };
  // procura o vão da catedral perto da rosácea e põe colunas e arcos que vão do chão ao teto
  for (const px of [372, 392, 414, 436, 226, 248, 268]) {
    let yT = 110; while (yT > 96 && isOpen(px + 2, yT - 1)) yT--; let yB = 110; while (yB < 134 && isOpen(px + 2, yB + 1)) yB++;
    if (!isOpen(px + 2, 112) || yB - yT < 10) continue;
    if (Math.abs(px + 2 - xs(112)) < hw(112) + 3) continue;
    pillar(px, yT, yB);
  }
  arch(377, 392, 100); arch(397, 414, 100); arch(419, 436, 100); arch(231, 248, 102); arch(253, 268, 102);
  // rosácea: vitral roxo e âmbar, quebrado num canto
  { const R0 = { x: 404, y: 113 }; const GL = P(['#3a1450', '#6a28a0', '#a058e0', '#e0b0ff']), AM = P(['#5a2a10', '#a85a20', '#f0a040', '#ffe0a0']);
    for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) { const d = Math.hypot(x, y); if (d > 7.2) continue; const X = R0.x + x, Y = R0.y + y;
      const a = Math.atan2(y, x), spoke = Math.abs(((a / (Math.PI / 4)) % 1 + 1) % 1 - 0.5) < 0.12;
      if (d > 6.2 || spoke || (d > 2.6 && d < 3.4)) put(X, Y, rp(ARCH, 0.35, X, Y));
      else if (x > 2 && y > 2 && h2(X, Y, 601) > 0.4) put(X, Y, C('#06050a'));   // pedaço quebrado
      else put(X, Y, rp(d < 3 ? AM : GL, 0.45 + (fbm(X / 2, Y / 2, 603) - 0.5) * 0.7 + (y < 0 ? 0.15 : 0), X, Y)); }
    for (let j = 1; j < 18; j++) for (let w = -3; w <= 3; w++) { const X = R0.x + w + (j >> 2), Y = R0.y + 7 + j; if (isOpen(X, Y)) blend(X, Y, C('#9a50e0'), qa(0.25 * (1 - j / 18) * (1 - Math.abs(w) / 4), X, Y, 4)); }   // feixe de luz colorida descendo
  }
  // velas no chão da nave
  for (const [x0] of [[244], [249], [252]]) { let y = 112; while (y < 134 && isOpen(x0, y + 1)) y++; if (y >= 134) continue; const h = 2 + (x0 % 3); for (let j = 0; j < h; j++) put(x0, y - j, C(j ? '#c8b89a' : '#8a7a62')); put(x0, y - h, C('#ffe08a')); put(x0, y - h - 1, C('#ff9a3a')); }

  /* ---------- camada 3: cristais de gelo ---------- */
  const ICE = P(['#16304a', '#2a5a80', '#4a90c0', '#8ad0f0', '#d8f8ff']);
  const crystal = (x0, h, lean) => { let y0 = 140; while (y0 < 172 && !(isOpen(x0, y0) && isRock(x0, y0 + 1))) y0++; if (y0 >= 172) return;
    for (let j = 0; j < h; j++) { const w = Math.max(0, Math.round((h - j) / h * 2.4)); const cx1 = x0 + Math.round(j * lean); for (let i = -w; i <= w; i++) { const X = cx1 + i, Y = y0 - j; if (!isOpen(X, Y)) continue; put(X, Y, rp(ICE, 0.35 + (i < 0 ? 0.35 : i > 0 ? -0.1 : 0.15) + j / h * 0.3, X, Y)); } } };
  for (const [x, h, l] of [[262, 12, 0.15], [268, 8, -0.3], [273, 6, 0.4], [256, 5, -0.5], [415, 10, -0.15], [421, 7, 0.3], [410, 5, -0.4], [188, 6, 0.2], [460, 6, -0.2]]) crystal(x, h, l);

  /* ---------- camada 4: escoras, trilhos e lampiões ---------- */
  const WOOD = P(['#140b06', '#22140a', '#341f0f', '#4a2e16', '#66421e']);
  const timber = (x0, x1) => { let yT = 190; while (yT > 176 && isOpen(x0, yT - 1)) yT--; let yB = 190; while (yB < 206 && isOpen(x0, yB + 1)) yB++;
    if (yB - yT < 8) return;
    for (const xp of [x0, x1]) for (let y = yT; y <= yB; y++) for (let i = 0; i < 2; i++) { const L = lightAt(xp + i, y); put(xp + i, y, rp(WOOD, (0.3 + (i ? -0.15 : 0.15)) * (0.4 + (amb(y, xp + i) + (L ? L.a : 0)) * 1.4), xp + i, y)); }
    for (let x = x0; x <= x1 + 1; x++) for (let j = 0; j < 2; j++) { const L = lightAt(x, yT + j); put(x, yT + j, rp(WOOD, (0.4 - j * 0.25) * (0.4 + (amb(yT, x) + (L ? L.a : 0)) * 1.4), x, yT + j)); }
    return yT; };
  timber(370, 394); timber(226, 246); timber(440, 458);
  // trilho no chão
  for (let x = 200; x < 470; x++) { if (Math.abs(x - xs(200)) < hw(200) + 1) continue; let y = 186; while (y < 207 && !(isOpen(x, y) && isRock(x, y + 1))) y++; if (y >= 207) continue;
    const L = lightAt(x, y), v = amb(y, x) + (L ? L.a : 0); put(x, y - 1, rp(P(['#1a1816', '#3a3632', '#6a645c', '#a09888']), 0.2 + v, x, y - 1)); if (x % 4 === 0) put(x, y, rp(WOOD, 0.2 + v, x, y)); }
  // lampiões pendurados
  for (const [x, y] of [[383, 186], [236, 185]]) { put(x, y - 3, C('#2a2420')); put(x, y - 2, C('#2a2420')); for (let j = 0; j < 3; j++) for (let i = -1; i <= 1; i++) put(x + i, y - 1 + j, i === 0 && j === 1 ? C('#fff0b0') : Math.abs(i) === 1 && j !== 1 ? C('#3a2a1a') : C('#ff9a3a')); }

  /* ---------- camada 5+: as camadas esquecidas (fungo que brilha) ---------- */
  const SHROOM = P(['#0f3a2a', '#1a6a4a', '#30b07a', '#7cffc8', '#d8fff0']), STEM = P(['#2a3a30', '#4a5a4c', '#8a9a88']);
  const shroom = (x0, h, r) => { let y0 = 214; while (y0 < 236 && !(isOpen(x0, y0) && isRock(x0, y0 + 1))) y0++; if (y0 >= 236) return;
    for (let j = 0; j < h; j++) put(x0, y0 - j, rp(STEM, 0.5, x0, y0 - j));
    for (let i = -r; i <= r; i++) for (let j = 0; j <= Math.ceil(r * 0.6); j++) { if (i * i / (r * r) + j * j / (r * r * 0.4) > 1) continue; const X = x0 + i, Y = y0 - h - j + 1; put(X, Y, rp(SHROOM, 0.55 + (j > r * 0.35 ? 0.25 : 0) + (i < 0 ? 0.1 : 0) - (j === 0 ? 0.35 : 0), X, Y)); } };
  for (const [x, h, r] of [[276, 6, 4], [283, 3, 2], [271, 2, 2], [394, 5, 3], [400, 3, 2], [452, 4, 3], [212, 3, 2], [356, 2, 2]]) shroom(x, h, r);
  // fios de micélio pendurados
  for (let n = 0; n < 40; n++) { let x = (200 + h2(n, 1, 701) * 270) | 0; let y = 208; while (y < 232 && isRock(x, y)) y++; if (!isOpen(x, y) || shaft(x, y)) continue; const len = 3 + (h2(n, 2, 701) * 8) | 0; for (let j = 0; j < len && isOpen(x, y + j); j++) blend(x, y + j, C('#3a8a6a'), 0.5 - j / len * 0.4); }

  /* ---------- a Escuridão: o poço se abre num vazio; o vermelho vem lá do fundo ---------- */
  // bordas do vazio pegam a luz vermelha
  for (let y = 236; y < H; y++) for (let x = 0; x < W; x++) if (isRock(x, y) && (isOpen(x + 1, y) || isOpen(x - 1, y) || isOpen(x, y - 1))) { const L = lightAt(x, y); if (L) blend(x, y, C('#8a2414'), qa(L.a * 0.8, x, y, 4)); }

  /* ---------- o herói ficará na camada de efeitos; aqui só uma sombra quente na parede atrás dele ---------- */

  /* ---------- a Escuridão subindo: gavinhas negras saem do fundo e sobem pelas paredes do poço ---------- */
  const TEND = C('#020103'), TRIM = P(['#3a0c0a', '#6a1a10', '#a8341a']);
  for (let n = 0; n < 9; n++) {
    const side = n % 2 ? 1 : -1;
    let x = xs(262) + side * (14 + h2(n, 1, 801) * 40), y = 270, w = 4 + h2(n, 2, 801) * 3;
    const top = 196 + h2(n, 3, 801) * 34, ph = h2(n, 4, 801) * 6;
    for (let s2 = 0; y > top; s2++) {
      const k = (270 - y) / (270 - top), ww = Math.max(0.6, w * (1 - k * 0.85));
      x += Math.sin(s2 * 0.11 + ph) * 0.7 + side * (k > 0.6 ? -0.25 : 0.05); y -= 1;
      for (let i = -Math.ceil(ww); i <= Math.ceil(ww); i++) { if (Math.abs(i) > ww) continue; const X = Math.round(x + i), Y = Math.round(y);
        if (X < 0 || X >= W) continue;
        const L = lightAt(X, Y), r = L ? L.a : 0;
        put(X, Y, i === Math.ceil(ww) * -side || Math.abs(i) >= ww - 0.6 ? mix(TEND, rp(TRIM, r * 1.1, X, Y), cl(r * 1.6, 0, 1)) : TEND);
        if (open[Y * W + X] === 0) rim[Y * W + X] = 0; }
    }
  }
  // os olhos: a camada de efeitos acende e apaga; aqui fica o halo vermelho em volta deles
  for (let y = 240; y < 266; y++) for (let x = 320; x < 372; x++) { const d = Math.hypot((x - 345) / 2.2, y - 253); if (d < 11) blend(x, y, C('#5a1008'), qa((1 - d / 11) * 0.5, x, y, 5)); }

  /* ---------- longe da luz, tudo some no escuro ---------- */
  const DARK = C('#030205');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (open[y * W + x] === 2) continue;
    const L = lightAt(x, y); let lit = amb(y, x) + (L ? L.a : 0);
    if (rim[y * W + x]) lit += 0.22 * rim[y * W + x] / 3;
    const dk = cl(0.8 - lit * 2.6, 0, 0.9);
    if (dk > 0) put(x, y, mix(get(x, y), DARK, qa(dk, x, y, 8)));
  }

  /* ---------- acabamento: grão e vinheta ---------- */
  const VIG = C('#020103');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - W * 0.62) / (W * 0.6), ny = (y - H * 0.42) / (H * 0.7), d = Math.hypot(nx, ny);
    let c = get(x, y);
    const g = (h2(x, y, 999) - 0.5) * 8; c = [c[0] + g, c[1] + g, c[2] + g];
    const v = cl((d - 0.6) / 0.6, 0, 1) * 0.75;
    if (v > 0) c = mix(c, VIG, qa(v, x, y, 5));
    put(x, y, [cl(c[0], 0, 255), cl(c[1], 0, 255), cl(c[2], 0, 255)]);
  }
  cx.putImageData(img, 0, 0);

  /* ---------- o que mexe ---------- */
  const wellTop = Math.round(yS(ROPE)) - 15;
  // herói: roupa simples, cabelo castanho; uma mão na corda, a outra segurando a lanterna
  const HK = [
    '...gg.......',
    '...ss.......',
    '...ss.......',
    '..hhsh......',
    '.hhhhhh.....',
    '.hhhhhhh....',
    '.hhhssWs....',
    '..hhsssss...',
    '...hssms....',
    '....sss.....',
    '...nnnnn....',
    '..rrrrrrr...',
    '..rrrrrrrss.',
    '..rrrrrr..s.',
    '..rrrrrr..l.',
    '..bbbbkb.lLl',
    '..rrrrrr.LLL',
    '..rrrrrr.lLl',
    '...pp.pp....',
    '...pp..pp...',
    '..pp....pp..',
    '..ff....ff..'];
  const HC = { g: '#e2a982', s: '#e2a982', h: '#4e2c1a', W: '#f2ead8', n: '#8a6a48', r: '#6e5a44', b: '#3a2618', k: '#c8a050', p: '#4b3b33', f: '#2a1c14', L: '#ffd27a', l: '#3a2a1a' };
  const heroPx = [];
  for (let j = 0; j < HK.length; j++) for (let i = 0; i < HK[j].length; i++) { const ch = HK[j][i]; if (!HC[ch]) continue;
    let c = C(HC[ch]);
    // luz da lanterna vem de baixo à direita: lado direito mais claro, esquerdo mais escuro
    const lx = i / 11, ly = j / 21; if (ch !== 'L' && ch !== 'W') c = mix(c, i < 3 ? [20, 12, 24] : [255, 190, 110], i < 3 ? 0.3 : cl((lx + ly) * 0.22, 0, 0.3));
    heroPx.push({ i: i - 3, j, col: `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` }); }
  // luz da lanterna em degraus (pré-pintada uma vez; por quadro só muda a opacidade)
  const glow = document.createElement('canvas'); glow.width = 64; glow.height = 64;
  { const g = glow.getContext('2d'); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const d = Math.hypot(x - 32, y - 32) / 26; const a = qa(cl(1 - d, 0, 1), x, y, 4); if (a > 0) { g.fillStyle = `rgba(255,170,80,${a * 0.07})`; g.fillRect(x, y, 1, 1); } } }
  const motes = [], spores = [], embers = [];
  const EMB = ['#ffd27a', '#f39a3a', '#d0601e', '#9c3414', '#5a1a10'];
  let blinkAt = 3;
  function frame(fx, t, dt) {
    // balanço: pêndulo bem lento preso no sarilho
    const ang = Math.sin(t * 0.7) * 0.012 + Math.sin(t * 0.23) * 0.006;
    const len = HERO.y - wellTop, hx = ROPE + Math.sin(ang) * len, hy = HERO.y + (Math.sin(t * 0.5) * 0.6);
    // corda
    fx.fillStyle = '#7a5a36';
    for (let y = wellTop + 2; y < hy; y++) { const k = (y - wellTop) / len; fx.fillRect(Math.round(ROPE + (hx - ROPE) * k), y, 1, 1); }
    fx.fillStyle = '#4a3420';
    for (let y = wellTop + 3; y < hy; y += 3) { const k = (y - wellTop) / len; fx.fillRect(Math.round(ROPE + (hx - ROPE) * k), y, 1, 1); }
    // herói
    const bx = Math.round(hx), by = Math.round(hy);
    for (const p of heroPx) { fx.fillStyle = p.col; fx.fillRect(bx + p.i, by + p.j, 1, 1); }
    // lanterna tremendo
    const fl = 0.75 + Math.sin(t * 11) * 0.08 + Math.sin(t * 17.3) * 0.06 + Math.sin(t * 3.1) * 0.06;
    fx.globalAlpha = cl(fl, 0, 1); fx.drawImage(glow, bx + 7 - 32, by + 16 - 32); fx.globalAlpha = 1;
    fx.fillStyle = Math.sin(t * 13) > 0.3 ? '#fff2c0' : '#ffd27a'; fx.fillRect(bx + 7, by + 16, 1, 1);
    // poeira caindo no poço, acesa perto da lanterna
    if (motes.length < 26 && Math.random() < dt * 8) motes.push({ x: ROPE - 8 + Math.random() * 18, y: 50 + Math.random() * 20, vy: 4 + Math.random() * 6, ph: Math.random() * 6 });
    for (let i = motes.length - 1; i >= 0; i--) { const m = motes[i]; m.y += m.vy * dt; m.x += Math.sin(t * 1.3 + m.ph) * 2 * dt; if (m.y > 232) { motes.splice(i, 1); continue; }
      const d = Math.hypot(m.x - bx - 7, m.y - by - 16); const a = d < 40 ? 0.9 - d / 50 : 0.12; fx.globalAlpha = cl(a, 0.08, 0.9); fx.fillStyle = d < 40 ? '#ffd8a0' : '#8a8090'; fx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); }
    fx.globalAlpha = 1;
    // esporos subindo dos fungos
    if (spores.length < 22 && Math.random() < dt * 5) { const s = [[276, 222], [394, 222], [452, 222], [212, 228]][(Math.random() * 4) | 0]; spores.push({ x: s[0] + (Math.random() - 0.5) * 8, y: s[1], vy: -(2 + Math.random() * 3), t: 0, life: 3 + Math.random() * 3, ph: Math.random() * 6 }); }
    for (let i = spores.length - 1; i >= 0; i--) { const s = spores[i]; s.t += dt; if (s.t > s.life) { spores.splice(i, 1); continue; } s.y += s.vy * dt; s.x += Math.sin(s.t * 1.7 + s.ph) * 3 * dt;
      fx.globalAlpha = Math.sin(s.t / s.life * Math.PI) * 0.9; fx.fillStyle = '#7cffc8'; fx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
    fx.globalAlpha = 1;
    // brasas lá do fundo
    if (embers.length < 30 && Math.random() < dt * 10) embers.push({ x: 300 + Math.random() * 54, y: 268 + Math.random() * 4, vx: (Math.random() - 0.5) * 4, vy: -(6 + Math.random() * 10), t: 0, life: 3 + Math.random() * 4, ph: Math.random() * 6 });
    for (let i = embers.length - 1; i >= 0; i--) { const e = embers[i]; e.t += dt; if (e.t > e.life) { embers.splice(i, 1); continue; }
      e.x += (e.vx + Math.sin(e.t * 2 + e.ph) * 4) * dt; e.y += e.vy * dt;
      const f = e.t / e.life; fx.globalAlpha = f > 0.7 ? 1 - (f - 0.7) / 0.3 : 1; fx.fillStyle = EMB[Math.min(EMB.length - 1, Math.floor(f * EMB.length))]; fx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1); }
    fx.globalAlpha = 1;
    // os olhos lá embaixo, piscando de vez em quando
    if (t > blinkAt + 0.18) blinkAt = t + 2 + Math.random() * 5;
    const shut = t > blinkAt && t < blinkAt + 0.18, glowE = 0.55 + Math.sin(t * 0.8) * 0.25;
    if (!shut) { fx.globalAlpha = glowE; fx.fillStyle = '#ff3a1e'; for (const ex of [336, 350]) { fx.fillRect(ex, 252, 5, 2); fx.fillRect(ex + 1, 251, 3, 1); } fx.fillStyle = '#ffd890'; for (const ex of [336, 350]) fx.fillRect(ex + 2, 252, 1, 2); fx.globalAlpha = 1; }
  }
  return { canvas: cv, frame };
}
