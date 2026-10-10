'use strict';
/* arte da tela de título: A Escuridão. O fundo do mundo: um Grande Vão de pedra-breu e vidro negro, quase sem luz.
   Na beira de uma laje lavrada dos Acendedores, o herói (no Conjunto do Eclipse, o montante nas costas) ergue na mão
   um lume-fátuo, e ao lado dele arde o único braseiro aceso, azul, diante de um pilar quebrado com um sol gravado que
   ainda guarda um resto de calor. Do outro lado do poço sem fundo, maior que tudo, Nox, Aquele Que Apaga: um pedaço
   mais preto que o preto, a borda pálida tremendo, dois olhos como estrelas frias e um braço comprido estendido para o
   braseiro (o mesmo corpo de fumaça do 227, bem maior). Ao longe, a Rota dos Acendedores: uma fila de braseiros azuis
   cada vez menores, até sumir. Raízes da noite e estalactites de vidro pendem do teto; uma corrente desce para o poço.
   Nesta arte quase tudo já é escuro: o nome e o menu ficam no breu da esquerda.
   Pintada uma vez (480x270, 39-titulo sorteia entre as artes de TITLE_ARTS). Por quadro mexem só coisas pequenas: a
   chama do braseiro e as da Rota, o lume na mão do herói, a borda e os olhos do Nox, mariposas negras rodando a luz,
   pó de breu no ar, olhos piscando no escuro, dois lumes soltos flutuando e uma gota que cai no poço e não bate. */
function paintTitleArtEscuridao() {
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
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const put = (x, y, c) => { x |= 0; y |= 0; if (!inb(x, y)) return; const i = (y * W + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255; };
  const get = (x, y) => { const i = (y * W + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const blend = (x, y, c, a) => { x |= 0; y |= 0; if (a <= 0 || !inb(x, y)) return; put(x, y, mix(get(x, y), c, cl(a, 0, 1))); };
  // o que está em cada pixel: 0 fundo, 1 plano distante, 2 rocha, 3 vidro negro, 4 raiz e corrente, 5 Nox, 6 herói,
  // 7 braseiro, pilar e ossada, 8 a borda pálida do Nox, 9 as luzes da Rota
  const N = new Uint8Array(W * H);
  const M = (x, y) => inb(x, y) ? N[y * W + x] : 2;

  /* ---------- palcos: teto, coluna da esquerda, a laje do herói, a beira de lá e o poço entre elas ---------- */
  const FLOOR = 214, LIP = 318, FARX = 394;
  const yCeil = x => 12 + (fbm(x / 24, 1, 3) - 0.5) * 16 + (fbm(x / 6, 1, 4) - 0.5) * 4 + Math.max(0, 230 - x) * 0.1;
  const colL = y => 30 + (fbm(y / 16, 4, 9) - 0.5) * 18 + Math.max(0, 70 - y) * 0.7 + Math.max(0, y - 196) * 0.9;
  const yTop = x => x < 150 ? FLOOR - 1 + (fbm(x / 9, 2, 5) - 0.5) * 5 + Math.max(0, 110 - x) * 0.18 : FLOOR;
  const lipX = y => LIP - (y - FLOOR) * 0.14 + (fbm(y / 5, 6, 11) - 0.5) * 5;
  const yFarTop = x => 224 + (fbm(x / 12, 3, 7) - 0.5) * 5 + Math.max(0, 404 - x) * 0.5;
  const farX = y => FARX + (y - 224) * 0.2 + (fbm(y / 5, 7, 13) - 0.5) * 5;
  const ledgeAt = (x, y) => y >= yTop(x) && x <= lipX(y);
  const farAt = (x, y) => y >= yFarTop(x) && x >= farX(y);
  const pitAt = (x, y) => y > FLOOR - 2 && x > lipX(y) && x < farX(y);
  // estalactites de vidro negro (x, comprimento, meia largura) e espinhos de vidro na beira de lá
  const STAL = [[228, 18, 2.4], [252, 30, 3], [300, 22, 2.6], [340, 42, 3.4], [374, 14, 2], [466, 26, 3]];
  const stalAt = (x, y) => { for (const [sx, len, w] of STAL) { const top = yCeil(sx) - 2, k = (y - top) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx) <= w * Math.pow(1 - k, 1.2) + 0.3) return true; } return false; };
  const SPK = [[406, 15, 2.6, -0.1], [414, 26, 3.2, 0.06], [423, 11, 2, 0.2], [448, 20, 2.8, -0.05], [459, 10, 1.8, 0.15], [471, 17, 2.4, 0]];
  const spkAt = (x, y) => { for (const [sx, len, w, lean] of SPK) { const base = yFarTop(sx) + 2, k = (base - y) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx - lean * k * len) <= w * (1 - k) + 0.3) return true; } return false; };
  // o pilar dos Acendedores atrás do braseiro, quebrado em cima
  const PIL = { x0: 266, x1: 277 };
  const pilTop = x => 138 + Math.abs(Math.sin(x * 2.3)) * 8 + h2(x, 1, 21) * 5 + (x > 272 ? (x - 272) * 3.4 : 0);
  const pilAt = (x, y) => x >= PIL.x0 && x <= PIL.x1 && y < FLOOR && y > pilTop(x);
  const rockAt = (x, y) => y < yCeil(x) || x < colL(y) || ledgeAt(x, y) || farAt(x, y);
  const glassAt = (x, y) => stalAt(x, y) || spkAt(x, y);

  /* ---------- luzes ---------- */
  const HERO = { x: 232, y: FLOOR - 22 };
  const WISP = { x: HERO.x + 12, y: HERO.y + 2 };     // o lume na mão erguida
  const BRZ = { x: 296, y: FLOOR - 12 };             // a boca do braseiro (a chama nasce aqui)
  const ROUTE = [[214, 194, 0.8], [201, 187, 0.7], [195, 177, 0.6], [183, 170, 0.52], [179, 161, 0.45], [168, 155, 0.39], [165, 147, 0.34], [157, 142, 0.3], [154, 136, 0.27]];
  const LOOSE = [[180, 203], [438, 211]];             // dois lumes soltos
  const SUN = { x: 271, y: 170 };
  const lights = [
    { x: BRZ.x, y: BRZ.y - 7, r: 140, c: C('#5f8cd8'), s: 1.3 },
    { x: WISP.x, y: WISP.y, r: 64, c: C('#b4ceff'), s: 0.8 },
    { x: SUN.x, y: SUN.y, r: 16, c: C('#d89048'), s: 0.22 },
    ...ROUTE.map(([x, y, s]) => ({ x, y: y - 2, r: 6 + 16 * s, c: C('#6a94dc'), s: 0.5 * s })),
    ...LOOSE.map(([x, y]) => ({ x, y, r: 18, c: C('#9ab8ec'), s: 0.35 }))
  ];
  // a laje faz sombra: debaixo da beira a luz de cima quase não chega
  const shade = (x, y) => y > FLOOR + 1 && x < lipX(y) + 1 ? Math.exp(-(y - FLOOR) / 5) : 1;
  const lightAt = (x, y) => { let a = 0, r = 0, g = 0, b = 0; const sh = shade(x, y);
    for (const L of lights) { const d = Math.hypot(x - L.x, (y - L.y) * 1.1); if (d >= L.r) continue; const f = Math.pow(1 - d / L.r, 1.6) * L.s * sh; a += f; r += L.c[0] * f; g += L.c[1] * f; b += L.c[2] * f; }
    return a > 0.002 ? { a, c: [r / a, g / a, b / a] } : null; };
  // atrás do Nox o escuro tem um fundo um tico menos preto: é o que deixa ver que ele é mais preto que o preto
  const backHaze = (x, y) => Math.exp(-Math.hypot((x - 414) / 1.25, (y - 112) / 1.5) / 52) * 0.55;

  /* ---------- fundo: o vão perdido no escuro; raízes do tamanho de torres ao longe; a névoa na boca do poço ---------- */
  const BACK = P(['#010103', '#030409', '#05070f', '#080b17', '#0c1120', '#121a2e']);
  const FARP = P(['#020306', '#04060c', '#070a14', '#0b0f1e', '#10162a', '#18203a']);
  const NEVOA = C('#3a4a6a');
  const FROOT = [[206, 8], [338, 12], [474, 10], [128, 7]];
  const yFarFloor = x => 198 + (fbm(x / 30, 8, 17) - 0.5) * 10;
  const farRootAt = (x, y) => { for (const [rx, w] of FROOT) { const c = rx + Math.sin(y / 23 + rx) * 4 + (fbm(y / 14, rx, 31) - 0.5) * 6, ww = w * (0.8 + 0.4 * fbm(y / 20, rx, 33)) + Math.max(0, 50 - y) * 0.2 + Math.max(0, y - 170) * 0.15; if (Math.abs(x - c) < ww) return true; } return false; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const L = lightAt(x, y);
    const haze = Math.exp(-Math.hypot((x - 150) / 1.4, y - 132) / 46) * 0.35;   // um resto de claridade para onde a Rota vai
    let c;
    if (farRootAt(x, y) || y > yFarFloor(x)) { N[y * W + x] = 1; c = rp(FARP, 0.18 + (fbm(x / 5, y / 4, 23) - 0.5) * 0.3 + haze * 0.6 + (L ? L.a * 0.25 : 0), x, y); }
    else c = rp(BACK, 0.12 + haze + backHaze(x, y) + (fbm(x / 9, y / 7, 25) - 0.5) * 0.22 + (L ? L.a * 0.22 : 0), x, y);
    if (pitAt(x, y)) {   // o poço: preto, com uma névoa fina na boca que o braseiro acende de leve
      const d = y - FLOOR, mist = Math.exp(-Math.pow((d - 12) / 7, 2)) * (0.3 + fbm(x / 14, y / 4, 27) * 0.6);
      c = mix(mix(c, C('#010102'), cl(d / 30, 0, 1)), NEVOA, qa(mist * (0.12 + (L ? L.a * 0.5 : 0)), x, y, 5));
    }
    put(x, y, c);
  }

  /* ---------- rocha: teto, coluna, laje (o alto lavrado em blocos), beira de lá; vidro negro; o pilar ---------- */
  const BREU = P(['#04050a', '#090b13', '#10131e', '#181c2b', '#21273a', '#2c344b', '#3c4762']);
  const LAVR = P(['#0b0908', '#15120e', '#201b15', '#2d261d', '#3c3327', '#504533', '#685a43']);
  const VIDRO = P(['#020207', '#070818', '#0e0f28', '#18193c', '#252956', '#384080', '#6a7ac4']);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rockAt(x, y)) N[y * W + x] = 2; else if (glassAt(x, y)) N[y * W + x] = 3; else if (pilAt(x, y)) N[y * W + x] = 7;
  const open = (x, y) => inb(x, y) && N[y * W + x] !== 2 && N[y * W + x] !== 3 && N[y * W + x] !== 7;
  const lavrada = (x, y) => ledgeAt(x, y) && x >= 146 && y < FLOOR + 11;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = N[y * W + x]; if (n !== 2 && n !== 3 && n !== 7) continue;
    const L = lightAt(x, y), lit = L ? L.a : 0;
    let pal = BREU, t = 0.28 + (fbm(x / 6, y / 4, 43) - 0.5) * 0.4;
    if (n === 3) { pal = VIDRO; t = 0.3 + (x % 3 === 0 ? 0.12 : 0) + (fbm(x / 2, y / 9, 45) - 0.5) * 0.3; }   // vidro: lascas verticais
    else if (n === 7 || lavrada(x, y)) {
      pal = LAVR; t = 0.42 + (fbm(x / 7, y / 5, 47) - 0.5) * 0.3;
      if (n === 7) { const u = (x - PIL.x0) / (PIL.x1 - PIL.x0); t = 0.3 + (fbm(x / 4, y / 6, 47) - 0.5) * 0.3 + (u > 0.7 ? 0.14 : u < 0.2 ? -0.12 : 0); if ((x - PIL.x0) % 3 === 0 && x > PIL.x0 && x < PIL.x1) t -= 0.14; if (y % 15 === 0) t -= 0.22; if (Math.abs(vn(x / 3, y / 11, 48) - 0.5) < 0.03) t -= 0.25; }   // o fuste com caneluras, juntas e rachaduras
      else { const row = Math.floor((y - FLOOR) / 5), m = ((x + row * 6) % 12 + 12) % 12; if ((y - FLOOR) % 5 === 4 || m === 0) t -= 0.25; else if ((y - FLOOR) % 5 === 0) t += 0.12; t += (h2(Math.floor((x + row * 6) / 12), row, 49) - 0.5) * 0.15; }   // blocos com junta
    } else { const st = fbm(x / 22, y / 3, 51); if (st > 0.64) t += 0.12; else if (st > 0.6) t -= 0.1; }   // a pedra-breu em lâminas
    let e = 0;
    if (open(x, y - 1)) e = 0.35; else if (open(x, y - 2)) e = 0.16;
    for (const S of [lights[0], lights[1]]) { const dx = Math.sign(S.x - x); if (Math.hypot(x - S.x, y - S.y) < S.r && open(x + dx, y)) e += 0.28; }
    const lk = n === 7 || lavrada(x, y) ? 0.8 : 1.15;
    t = t * (0.2 + lit * lk) + e * (0.15 + lit * lk * 0.85);
    let c = rp(pal, t, x, y);
    if (L) c = mix(c, L.c, qa(lk < 1 ? Math.min(0.28, L.a * 0.22) : Math.min(0.5, L.a * 0.45), x, y, 8));
    // veios de vidro na pedra-breu: um brilho frio só onde a luz pega
    if (n === 2 && !lavrada(x, y) && lit > 0.12 && Math.abs(vn(x / 9 + y / 31, y / 5, 53) - 0.5) < 0.015 && h2(x, y, 54) < 0.7) c = mix(c, C('#7a8cc8'), cl(lit * 0.8, 0.15, 0.55));
    put(x, y, c);
  }
  // o sol gravado no pilar: um disco com raios, que guarda um pouco do calor do braseiro
  const SOLP = P(['#2a1c10', '#4a3018', '#7a4e22', '#b0742e', '#e0a050', '#ffd090']);
  for (let y = SUN.y - 8; y <= SUN.y + 8; y++) for (let x = SUN.x - 8; x <= SUN.x + 8; x++) {
    if (M(x, y) !== 7) continue;
    const d = Math.hypot(x - SUN.x, y - SUN.y), a = Math.atan2(y - SUN.y, x - SUN.x), ray = d > 4 && d < 7.5 && Math.abs(Math.sin(a * 4)) > 0.82;
    if (d < 3.6 || ray || (d > 3.6 && d < 4.5)) put(x, y, rp(SOLP, (d < 4.5 ? 0.62 - d * 0.06 : 0.45 - (d - 4) * 0.06) + (x < SUN.x ? 0.08 : -0.05), x, y));
  }
  // a beira da laje: blocos soltos, uma lasca caída no poço
  for (const [bx, by, w, h] of [[312, FLOOR - 3, 5, 3], [305, FLOOR - 2, 3, 2], [334, FLOOR + 26, 3, 2]]) for (let y = by; y < by + h; y++) for (let x = bx; x < bx + w; x++) { const L = lightAt(x, y); put(x, y, rp(LAVR, (y === by ? 0.62 : 0.36) * (0.3 + (L ? L.a : 0)), x, y)); N[y * W + x] = 7; }

  /* ---------- raízes da noite pendendo do teto, e a corrente dos Acendedores descendo para o poço ---------- */
  const RAIZ = P(['#07050a', '#100a14', '#1a1020', '#24162c', '#2e1c38', '#3c2648', '#4e3260']);
  const ROOTS = [[220, 34, 2.6], [238, 22, 2], [258, 64, 3.2], [292, 30, 2.4], [312, 52, 2.8], [360, 26, 2.2], [392, 18, 2], [444, 40, 2.8], [468, 22, 2]];
  for (const [rx, len, w0] of ROOTS) {
    const top = Math.round(yCeil(rx)) - 1;
    for (let j = 0; j < len; j++) {
      const k = j / len, wx = rx + Math.sin(j / 7 + rx) * 2.2 * k + (fbm(j / 6, rx, 61) - 0.5) * 3, w = Math.max(0.6, w0 * (1 - k * 0.8));
      for (let x = Math.floor(wx - w); x <= wx + w; x++) { const y = top + j; if (!inb(x, y) || N[y * W + x] === 2) continue; const L = lightAt(x, y), side = (x - wx) / (w + 0.5); put(x, y, rp(RAIZ, (0.35 - side * 0.25 + (h2(x, y, 63) - 0.5) * 0.2) * (0.35 + (L ? L.a * 1.2 : 0)), x, y)); N[y * W + x] = 4; }
      if (h2(j, rx, 65) < 0.06 && k > 0.2) for (let q = 1; q < 6; q++) { const x = Math.round(wx + q * (h2(j, rx, 66) < 0.5 ? 1 : -1)), y = top + j + q; if (inb(x, y) && N[y * W + x] !== 2) { put(x, y, rp(RAIZ, 0.3, x, y)); N[y * W + x] = 4; } }   // fiapos
    }
  }
  const FERRO = P(['#050507', '#0d0e12', '#17181e', '#22242c', '#30333d', '#444855', '#606674']);
  const metal = (x, y, t) => { x = Math.round(x); y = Math.round(y); if (!inb(x, y) || N[y * W + x] === 2) return; const L = lightAt(x, y); put(x, y, rp(FERRO, t * (0.3 + (L ? L.a * 1.1 : 0)), x, y)); N[y * W + x] = 4; };
  const chain = (x, top, len) => { for (let j = 0; j < len; j++) { const y = top + j, ph = j % 4; if (ph === 0 || ph === 2) metal(x, y, 0.7); else { metal(x - 1, y, 0.75); metal(x + 1, y, 0.4); } } };
  { const x = 352, top = Math.round(yCeil(x)) - 1; chain(x, top, H - top); }
  // uma lanterna dos Acendedores, apagada, pendurada sobre o braseiro: o fundo dela pega a luz de baixo
  const LAN = { x: 318, y: 128 };
  { const top = Math.round(yCeil(LAN.x)) - 1; chain(LAN.x, top, LAN.y - top);
    for (let y = LAN.y; y < LAN.y + 3; y++) { const hw = 1 + (y - LAN.y); for (let x = LAN.x - hw; x <= LAN.x + hw; x++) metal(x, y, 0.8); }
    for (let y = LAN.y + 3; y < LAN.y + 12; y++) for (const dx of [-3, 0, 3]) metal(LAN.x + dx, y, dx < 0 ? 0.6 : 0.85);
    for (const y of [LAN.y + 3, LAN.y + 12]) for (let dx = -3; dx <= 3; dx++) metal(LAN.x + dx, y, 0.9);
    for (let y = LAN.y + 4; y < LAN.y + 12; y++) for (const dx of [-2, -1, 1, 2]) { const X = LAN.x + dx, L = lightAt(X, y); put(X, y, mix(C('#0a0c14'), C('#3a4660'), cl((L ? L.a : 0) * 0.8 + (y - LAN.y) * 0.02, 0, 0.6))); N[y * W + X] = 4; }   // o vidro fosco, vazio
    metal(LAN.x, LAN.y + 13, 0.7); }

  /* ---------- Nox: o corpo de fumaça do 227, bem maior, sobre o poço; um braço comprido estendido para o braseiro ---------- */
  const NX = { cx: 412, top: 30, w: 96, h: 200 };
  const bodyIn = (x, y) => {
    const u = (x - NX.cx) / (NX.w / 2), v = (y - NX.top) / NX.h; if (v < 0 || v > 1) return false;
    if ((u / 0.3) ** 2 + ((v - 0.07) / 0.07) ** 2 < 1) return true;                                     // a cabeça
    if (v < 0.13) return false;
    const wd = v < 0.2 ? 0.26 + (v - 0.13) * 3.6 : 0.52 - (v - 0.2) * 0.5 + Math.sin(v * 22 - 0.6) * 0.05 * v;   // ombros, depois a fumaça afinando
    return Math.abs(u + Math.sin(v * 9) * 0.04 * v) < wd && !(v > 0.78 && Math.abs(Math.sin(u * 9 + v * 30 + 1.3)) > 0.62 + (1 - v) * 0.8);
  };
  // os braços: ombro, cotovelo, mão (o da esquerda estendido para o braseiro), e dedos longos e finos
  const ARMS = [[[388, 64], [356, 104], [330, 146], 3.4, 1.6], [[436, 64], [452, 112], [458, 158], 3, 1.4]];
  const FING = [[330, 146, 318, 150], [330, 146, 320, 156], [331, 147, 323, 162], [329, 145, 316, 145]];
  const segD = (px, py, ax, ay, bx, by) => { const vx = bx - ax, vy = by - ay, t = cl(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1); return [Math.hypot(px - ax - vx * t, py - ay - vy * t), t]; };
  const armIn = (x, y) => {
    for (const [a, b, c, r0, r1] of ARMS) { const [d1, t1] = segD(x, y, a[0], a[1], b[0], b[1]); if (d1 < r0 + (r1 - r0) * t1 * 0.5) return true; const [d2, t2] = segD(x, y, b[0], b[1], c[0], c[1]); if (d2 < r0 * 0.8 + (r1 - r0 * 0.8) * t2) return true; }
    for (const [ax, ay, bx, by] of FING) if (segD(x, y, ax, ay, bx, by)[0] < 0.7) return true;
    return false;
  };
  // a fumaça de baixo escorrendo para dentro do poço em fios
  const STRANDS = [-30, -19, -9, 2, 13, 25].map((o, i) => ({ x: NX.cx + o, y0: NX.top + NX.h * 0.86, len: 26 + h2(i, 1, 75) * 26, ph: i * 1.9 }));
  const strandIn = (x, y) => { for (const s of STRANDS) { const k = (y - s.y0) / s.len; if (k < 0 || k > 1) continue; const c = s.x + Math.sin(k * 5 + s.ph) * 3 * k; if (Math.abs(x - c) < 1.8 * (1 - k) + 0.3) return true; } return false; };
  const noxAt = (x, y) => bodyIn(x, y) || armIn(x, y) || strandIn(x, y);
  const SMOKE = P(['#010103', '#0a0a10', '#141319', '#1e1c25', '#2a2632', '#3e3a48', '#5a5466']);
  const RIM = [];
  for (let y = NX.top - 2; y < H; y++) for (let x = 300; x < W; x++) {
    if (!noxAt(x, y)) continue;
    N[y * W + x] = 5;
    // no escuro, preto; do lado do braseiro a luz mal revela a fumaça parada
    const L = lightAt(x, y), n = Math.sin(x * 0.7 + y * 0.31) + Math.sin(x * 0.23 - y * 0.6);
    const k = cl((L ? L.a : 0) * 1.8 - 0.06, 0, 0.8);
    put(x, y, k > 0 ? rp(SMOKE, (0.2 + (n + 2) * 0.13) * k * 1.4, x, y) : C('#000000'));
    if (!noxAt(x - 1, y) || !noxAt(x + 1, y) || !noxAt(x, y - 1)) RIM.push(x, y);
  }
  for (let i = 0; i < RIM.length; i += 2) {
    const x = RIM[i], y = RIM[i + 1], L = lightAt(x, y), toward = x < NX.cx ? 0.25 : 0, q = h2(x, y, 71);   // o lado do braseiro, mais aceso
    const low = cl((y - NX.top - NX.h * 0.72) / (NX.h * 0.3), 0, 1);   // embaixo a borda vai sumindo na fumaça
    if (q < (0.42 + toward) * (1 - low * 0.85)) { put(x, y, C(q < 0.1 + toward * 0.4 ? '#c4cad8' : q < 0.3 ? '#8a90a4' : '#565c70')); N[y * W + x] = 8; }
    if (x < NX.cx && L && L.a > 0.08 && !noxAt(x - 1, y)) blend(x - 1, y, C('#4a5a80'), cl(L.a, 0.2, 0.5));   // a luz fria lambendo a borda por fora
  }
  const EYES = [[NX.cx - 11, NX.top + 13], [NX.cx - 1, NX.top + 13]];   // olhando para o herói

  /* ---------- o braseiro aceso: base lavrada, bacia de ferro, brasas azuis (a chama mexe por quadro) ---------- */
  const AZUL = P(['#0c1424', '#1c2a44', '#2c4a78', '#4a74b0', '#7aa2dc', '#b4ceff']);
  for (let y = BRZ.y + 4; y < FLOOR; y++) for (let x = BRZ.x - 5; x <= BRZ.x + 5; x++) { const L = lightAt(x, y); put(x, y, rp(LAVR, (y === BRZ.y + 4 ? 0.7 : 0.45 - (x - BRZ.x + 5) * 0.02 + (y % 3 === 0 ? -0.12 : 0)) * (0.5 + (L ? L.a * 0.6 : 0)), x, y)); N[y * W + x] = 7; }
  for (let y = BRZ.y; y < BRZ.y + 4; y++) { const hw = 7 - (y - BRZ.y); for (let x = BRZ.x - hw; x <= BRZ.x + hw; x++) { put(x, y, rp(FERRO, (y === BRZ.y ? 0.8 : 0.5) + (x < BRZ.x ? 0.15 : -0.1), x, y)); N[y * W + x] = 7; } }
  for (let x = BRZ.x - 5; x <= BRZ.x + 5; x++) { put(x, BRZ.y, rp(AZUL, 0.55 + h2(x, 1, 81) * 0.45, x, BRZ.y)); put(x, BRZ.y - 1, rp(AZUL, 0.4 + h2(x, 2, 81) * 0.5, x, BRZ.y - 1)); }

  /* ---------- uma ossada de Acendedor abraçada à lanterna, no escuro da laje ---------- */
  const OSSO = P(['#1c1814', '#2e2820', '#463e32', '#625846', '#82765e', '#a4987c']);
  for (const [dx, dy, t] of [[0, 0, 0.6], [1, 0, 0.7], [2, -1, 0.5], [-1, 1, 0.4], [0, 1, 0.5], [1, 1, 0.6], [2, 1, 0.5], [3, 1, 0.4], [4, 1, 0.5], [5, 0, 0.6], [6, 0, 0.5], [6, -1, 0.7], [5, -2, 0.6], [6, -2, 0.7]]) { const x = 196 + dx, y = FLOOR - 2 + dy, L = lightAt(x, y); put(x, y, rp(OSSO, t * (0.35 + (L ? L.a : 0)), x, y)); N[y * W + x] = 7; }
  for (const [dx, dy] of [[-3, -1], [-3, 0], [-2, -2], [-4, -2], [-3, -3]]) { const x = 196 + dx, y = FLOOR - 1 + dy; put(x, y, rp(FERRO, 0.5, x, y)); N[y * W + x] = 7; }   // a lanterna apagada

  /* ---------- o herói, na beira da laje, o lume erguido (o mesmo desenho da arte do Abismo, sem a tocha) ---------- */
  const HK = [
    '..c....c......',
    'g.cdddddc.....',
    'h.dDDDDDd.....',
    'hdDgggggd.....',
    'ggDDDDDDd.....',
    'cBdddyyd......',
    'cBDDDDDDd.Dg..',
    'cBdDDDDd.DgD..',
    'cB.dggd..Dd...',
    'cBdgDDDDgd....',
    'cBdDDggDDd....',
    'cBdDDggDd.....',
    'cBddDDDDd.....',
    'cBgggggggg....',
    'cBdDdDdDd.....',
    'cBDDDDDDDD....',
    '.BDDDDDDDDD...',
    '.DDDDDDDDDD...',
    '..dDDd.dDd....',
    '..dgd...gd....',
    '..dDd...Dd....',
    '.ddd....ddd...'];
  const HC = { D: '#2a1e3c', d: '#110a18', g: '#e0b048', c: '#ffc860', y: '#ffe090', B: '#241834', h: '#4a2a62' };
  for (let j = 0; j < HK.length; j++) for (let i = 0; i < HK[j].length; i++) { const ch = HK[j][i]; if (!HC[ch]) continue;
    let c = C(HC[ch]); const X = HERO.x + i, Y = HERO.y + j;
    if (!'cy'.includes(ch)) { const lx = (i - 4) / 10, up = (12 - j) / 12; c = mix(c, lx > 0.15 || up > 0.5 ? C('#a8c4f0') : C('#06070c'), lx > 0.15 || up > 0.5 ? cl(lx * 0.55 + up * 0.35, 0, 0.55) : 0.3); }
    else c = mix(c, C('#c8dcff'), 0.25);   // o ouro do conjunto pega o azul
    put(X, Y, c); N[Y * W + X] = 6; }
  for (let x = HERO.x - 14; x < HERO.x + 1; x++) { const y = FLOOR; if (M(x, y) === 2) blend(x, y, C('#020206'), 0.55 * (1 - (HERO.x + 1 - x) / 16)); }   // a sombra que o braseiro joga para trás

  /* ---------- longe da luz, tudo some; a esquerda é breu para o nome e o menu ---------- */
  const DARK = C('#010103');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = N[y * W + x]; if (n === 6 || n === 8 || n === 9) continue;
    const L = lightAt(x, y); const lit = (L ? L.a : 0) + (n === 0 ? 0.16 + backHaze(x, y) * 0.4 : n === 1 ? 0.14 : n === 5 ? 0.5 : 0.06);
    const left = cl((170 - x) / 150, 0, 1) * 0.5;
    const dk = cl(0.8 - lit * 2.3 + left, 0, 0.95);
    if (dk > 0) put(x, y, mix(get(x, y), DARK, qa(dk, x, y, 8)));
  }
  // as bases dos braseiros da Rota: um tico de pedra sob cada chama
  for (const [x, y, s] of ROUTE) { const w = Math.max(1, Math.round(2 * s)); for (let k = -w; k <= w; k++) { put(x + k, y, C('#141a2a')); N[y * W + x + k] = 9; } }
  /* ---------- grão e vinheta ---------- */
  const VIG = C('#010102');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - W * 0.62) / (W * 0.6), ny = (y - H * 0.5) / (H * 0.7), d = Math.hypot(nx, ny);
    let c = get(x, y); const g = (h2(x, y, 999) - 0.5) * 6; c = [c[0] + g, c[1] + g, c[2] + g];
    const v = cl((d - 0.55) / 0.6, 0, 1) * 0.8; if (v > 0) c = mix(c, VIG, qa(v, x, y, 5));
    put(x, y, [cl(c[0], 0, 255), cl(c[1], 0, 255), cl(c[2], 0, 255)]);
  }
  cx.putImageData(img, 0, 0);

  /* ---------- o que mexe ---------- */
  const mkGlow = (r, rgb, k) => { const g = document.createElement('canvas'); g.width = g.height = r * 2; const gx = g.getContext('2d'); for (let y = 0; y < r * 2; y++) for (let x = 0; x < r * 2; x++) { const d = Math.hypot(x - r, y - r) / (r * 0.84); const a = qa(cl(1 - d, 0, 1), x, y, 4); if (a > 0) { gx.fillStyle = `rgba(${rgb},${a * k})`; gx.fillRect(x, y, 1, 1); } } return g; };
  const bGlow = mkGlow(44, '96,140,220', 0.07), wGlow = mkGlow(22, '180,206,255', 0.1), rGlow = mkGlow(8, '106,148,220', 0.22), lGlow = mkGlow(9, '154,184,236', 0.18), eGlow = mkGlow(5, '230,240,255', 0.3);
  const FIRE = ['#1c3a78', '#3a6ac0', '#7aa2dc', '#e6f0ff', '#b4ceff'];
  const moths = [0, 1, 2, 3].map(i => ({ r: 12 + i * 4, w: 1.6 + i * 0.37, ph: i * 1.7, dy: -16 - i * 3 }));
  const dust = Array.from({ length: 22 }, (_, i) => ({ x: 200 + h2(i, 1, 91) * 160, y: 120 + h2(i, 2, 91) * 100, vx: (h2(i, 3, 91) - 0.5) * 3, vy: -1 - h2(i, 4, 91) * 2, ph: h2(i, 5, 91) * 6 }));
  const darkEyes = [{ x: 118, y: 170, at: 2 }, { x: 236, y: 52, at: 4.5 }];
  let blinkAt = 3, drip = null, dripAt = 2;
  const nearLight = (x, y) => Math.max(0, 1 - Math.hypot(x - BRZ.x, y - BRZ.y + 6) / 110) + Math.max(0, 1 - Math.hypot(x - WISP.x, y - WISP.y) / 50) * 0.7;
  function frame(fx, t, dt) {
    dt = Math.min(dt, 0.1);
    // o braseiro: a chama azul fria, alta no meio, e o brilho grande pulsando
    fx.globalAlpha = 0.85 + Math.sin(t * 7) * 0.08 + Math.sin(t * 13) * 0.05; fx.drawImage(bGlow, BRZ.x - 44, BRZ.y - 52); fx.globalAlpha = 1;
    for (let k = -4; k <= 4; k++) {
      const e = 1 - Math.abs(k) / 5, h = Math.round(13 * e * (0.6 + 0.4 * Math.abs(Math.sin(t * 6 + k * 1.9))) + Math.sin(t * 11 + k) * 1.2); if (h < 1) continue;
      const X = BRZ.x + k, Y = BRZ.y - 1;
      fx.fillStyle = FIRE[0]; fx.fillRect(X, Y - h, 1, h); fx.fillStyle = FIRE[1]; fx.fillRect(X, Y - Math.round(h * 0.75), 1, Math.round(h * 0.75));
      if (Math.abs(k) < 3) { fx.fillStyle = FIRE[2]; fx.fillRect(X, Y - Math.round(h * 0.45), 1, Math.round(h * 0.45)); }
      if (Math.abs(k) < 2) { fx.fillStyle = FIRE[3]; fx.fillRect(X, Y - Math.round(h * 0.2), 1, Math.round(h * 0.2)); }
    }
    for (let i = 0; i < 2; i++) { const sp = (t * 0.9 + i * 0.5) % 1; fx.globalAlpha = 1 - sp; fx.fillStyle = FIRE[4]; fx.fillRect(BRZ.x + Math.round(Math.sin(sp * 9 + i * 3) * 3), BRZ.y - 14 - Math.round(sp * 16), 1, 1); }
    fx.globalAlpha = 1;
    // a Rota dos Acendedores: chamas pequenas, cada vez menores, tremendo cada uma no seu tempo
    ROUTE.forEach(([x, y, s], i) => {
      fx.globalAlpha = 0.7 + Math.sin(t * 5 + i * 1.3) * 0.2; fx.drawImage(rGlow, x - 8, y - 10); fx.globalAlpha = 1;
      const hgt = Math.max(1, Math.round(3.4 * s + Math.sin(t * 9 + i * 2.1) * 0.8));
      fx.fillStyle = '#3a6ac0'; fx.fillRect(x, y - hgt, 1, hgt); fx.fillStyle = '#b4ceff'; fx.fillRect(x, y - 1, 1, 1);
      if (s > 0.5) { fx.fillStyle = '#1c3a78'; fx.fillRect(x - 1, y - Math.max(1, hgt - 1), 1, Math.max(1, hgt - 1)); fx.fillRect(x + 1, y - Math.max(1, hgt - 2), 1, Math.max(1, hgt - 2)); }
    });
    // o lume na mão do herói, e os dois soltos no escuro, subindo e descendo devagar
    const wy = WISP.y + Math.round(Math.sin(t * 1.9) * 1.2);
    fx.globalAlpha = 0.8 + Math.sin(t * 3.1) * 0.15; fx.drawImage(wGlow, WISP.x - 22, wy - 22); fx.globalAlpha = 1;
    fx.fillStyle = '#7aa2dc'; fx.fillRect(WISP.x - 1, wy - 1, 3, 3); fx.fillStyle = '#e6f0ff'; fx.fillRect(WISP.x, wy - 2, 1, 3); fx.fillRect(WISP.x - 1, wy, 3, 1);
    if (Math.sin(t * 7) > 0.3) { fx.fillStyle = '#b4ceff'; fx.fillRect(WISP.x, wy - 3 - Math.round((t * 3) % 2), 1, 1); }
    LOOSE.forEach(([x, y], i) => { const yy = y + Math.round(Math.sin(t * 1.4 + i * 2) * 1.6); fx.globalAlpha = 0.7 + Math.sin(t * 2.3 + i) * 0.2; fx.drawImage(lGlow, x - 9, yy - 9); fx.globalAlpha = 1; fx.fillStyle = '#7aa2dc'; fx.fillRect(x, yy, 2, 2); fx.fillStyle = '#e6f0ff'; fx.fillRect(x, yy, 1, 1); });
    // a borda pálida do Nox tremendo, e os olhos como estrelas frias (de vez em quando somem)
    fx.fillStyle = '#e6ecf4';
    const tk = Math.floor(t * 12);
    for (let i = 0; i < RIM.length; i += 2) { const x = RIM[i], y = RIM[i + 1]; const q = h2(x, y + tk, 73); if (q < 0.18 * (1 - cl((y - NX.top - NX.h * 0.72) / (NX.h * 0.3), 0, 1) * 0.8)) { fx.globalAlpha = 0.5 + q * 2; fx.fillRect(x, y, 1, 1); } }
    fx.globalAlpha = 1;
    if (t > blinkAt + 0.22) blinkAt = t + 4 + Math.random() * 5;
    if (!(t > blinkAt && t < blinkAt + 0.22)) for (const [ex, ey] of EYES) {
      fx.globalAlpha = 0.6 + Math.sin(t * 2.4 + ex) * 0.25; fx.drawImage(eGlow, ex - 5, ey - 5); fx.globalAlpha = 1;
      fx.fillStyle = '#e6f0ff'; fx.fillRect(ex, ey, 1, 1); fx.globalAlpha = 0.55; fx.fillRect(ex - 1, ey, 3, 1); fx.fillRect(ex, ey - 1, 1, 3); fx.globalAlpha = 1;
    }
    // mariposas negras rodando a chama: asas que piscam pálidas
    for (const m of moths) {
      const a = t * m.w + m.ph, x = Math.round(BRZ.x + Math.cos(a) * m.r), y = Math.round(BRZ.y + m.dy + Math.sin(a * 1.3) * m.r * 0.45), up = Math.sin(t * 26 + m.ph) > 0;
      fx.fillStyle = '#05060a'; fx.fillRect(x, y, 1, 2);
      fx.fillStyle = up ? '#6a7488' : '#14161e'; if (up) { fx.fillRect(x - 2, y - 1, 2, 1); fx.fillRect(x + 1, y - 1, 2, 1); } else { fx.fillRect(x - 2, y + 1, 2, 1); fx.fillRect(x + 1, y + 1, 2, 1); }
    }
    // pó de breu no ar, que só aparece perto da luz
    for (const p of dust) {
      p.x += (p.vx + Math.sin(t * 0.7 + p.ph) * 2) * dt; p.y += p.vy * dt; if (p.y < 100) { p.y = 225; p.x = 200 + Math.random() * 160; }
      const k = nearLight(p.x, p.y); if (k < 0.12) continue;
      fx.globalAlpha = Math.min(0.5, k * 0.6); fx.fillStyle = k > 0.7 ? '#7a94c4' : '#3a4866'; fx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    fx.globalAlpha = 1;
    // olhos no escuro, que piscam
    for (const E of darkEyes) { if (t > E.at + 0.18) E.at = t + 3 + Math.random() * 6; if (t > E.at && t < E.at + 0.18) continue; fx.globalAlpha = 0.55; fx.fillStyle = '#c4cad8'; fx.fillRect(E.x, E.y, 1, 1); fx.fillRect(E.x + 4, E.y, 1, 1); fx.globalAlpha = 1; }
    // uma gota que cai da estalactite grande para dentro do poço e nunca bate no fundo
    if (!drip && t > dripAt) drip = { y: yCeil(340) + 40, v: 0 };
    if (drip) { drip.v += 160 * dt; drip.y += drip.v * dt; if (drip.y > H + 2) { drip = null; dripAt = t + 3 + Math.random() * 4; } else { const k = nearLight(340, drip.y); fx.globalAlpha = 0.35 + Math.min(0.6, k); fx.fillStyle = '#9ab8ec'; fx.fillRect(340, Math.round(drip.y), 1, 2); fx.globalAlpha = 1; } }
  }
  return { canvas: cv, frame };
}
var TITLE_ARTS = TITLE_ARTS || []; TITLE_ARTS.push(paintTitleArtEscuridao);
