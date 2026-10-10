'use strict';
/* arte da tela de título: As Cavernas. Uma gruta rasa por dentro: a lua entra por um buraco no teto e cai
   numa poça, raízes descem do chão de cima, estalactites de calcita pingam. No canto de cima, à direita, o Ninho:
   uma teia enorme com casulos e ovos, e a Mãe-Teia de cabeça para baixo no meio dela. O herói, numa laje de pedra,
   ergue a tocha e olha para ela. O lado esquerdo fica escuro para o nome e o menu.
   Pintada uma vez (480x270, 39-titulo sorteia entre as artes de TITLE_ARTS). Por quadro mexem só coisas pequenas:
   a chama da tocha, a poeira no feixe de lua, as gotas caindo na poça, os olhos da Mãe-Teia e uma aranha descendo no fio. */
function paintTitleArtCavernas() {
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
  const N = new Uint8Array(W * H);   // o que está em cada pixel: 0 fundo, 1 plano distante, 2 rocha, 3 água, 4 céu, 5 teia/ninho
  const M = (x, y) => inb(x, y) ? N[y * W + x] : 2;

  /* ---------- palcos: teto, chão, laje do herói, coluna da esquerda ---------- */
  const HOLE = { a: 226, b: 262 };                                           // o buraco no teto
  const yCeil = x => 22 + (fbm(x / 26, 1, 3) - 0.5) * 16 + Math.max(0, 120 - x) * 0.35 - Math.max(0, x - 330) * 0.12;
  const holeAt = (x, y) => { const m = (HOLE.a + HOLE.b) / 2, hwid = (HOLE.b - HOLE.a) / 2 + (fbm(y / 3, 2, 5) - 0.5) * 8 - y * 0.12; return Math.abs(x - m) < hwid && y < yCeil(x) + 2; };
  const yFloor = x => 236 + (fbm(x / 20, 3, 7) - 0.5) * 6 + Math.max(0, 160 - x) * -0.15;
  const POOL = { a: 176, b: 296, y: 239 };
  const yLedge = x => 212 + (fbm(x / 14, 4, 9) - 0.5) * 9 + (fbm(x / 4, 4, 10) - 0.5) * 3 + Math.max(0, 312 - x) * 1.6 + Math.max(0, x - 440) * 0.08;
  const colL = y => 70 + (fbm(y / 18, 5, 11) - 0.5) * 22 + Math.max(0, 60 - y) * 0.9 + Math.max(0, y - 190) * 0.8;   // borda da rocha da esquerda
  // estalactites e estalagmites (x, comprimento, largura)
  const STAL = [[146, 58, 5], [172, 34, 4], [196, 22, 3], [288, 30, 4], [304, 46, 5], [318, 20, 3], [214, 16, 2], [130, 26, 3]];
  const STAG = [[150, 30, 6], [168, 12, 4], [302, 10, 3], [460, 16, 4], [438, 8, 3], [118, 18, 4]];
  const stalAt = (x, y) => { for (const [sx, len, w] of STAL) { const top = yCeil(sx) - 2, k = (y - top) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx) <= w * (1 - k) + 0.3) return true; } return false; };
  const stagAt = (x, y) => { for (const [sx, len, w] of STAG) { const base = sx > 310 ? yLedge(sx) + 2 : yFloor(sx) + 2, k = (base - y) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx) <= w * (1 - k * k) + 0.3) return true; } return false; };
  // a grande coluna de calcita: estalactite e estalagmite que se encontraram
  const colAt = (x, y) => { const c = 150 + Math.sin(y / 14) * 2 + (fbm(y / 8, 6, 13) - 0.5) * 3, w = 4 + Math.pow(Math.abs(y - 140) / 90, 2) * 9; return Math.abs(x - c) < w; };
  const rockAt = (x, y) => (y < yCeil(x) && !holeAt(x, y)) || y > (x > 300 ? Math.min(yLedge(x), yFloor(x)) : yFloor(x)) || x < colL(y) || stalAt(x, y) || stagAt(x, y) || colAt(x, y);

  /* ---------- luzes ---------- */
  const HERO = { x: 338, y: 0 }; HERO.y = Math.round(yLedge(HERO.x + 6)) - 22;
  const TORCH = { x: HERO.x + 13, y: HERO.y + 1 };
  const lights = [
    { x: TORCH.x, y: TORCH.y, r: 120, c: C('#ffa850'), s: 1.3 },
    { x: 240, y: 236, r: 150, c: C('#7080b0'), s: 0.32 },                    // a luz da lua espalhada pela gruta
    { x: 426, y: 128, r: 50, c: C('#9ad83a'), s: 0.55 },                       // ovos que brilham
    { x: 236, y: 242, r: 40, c: C('#a8b8e0'), s: 0.55 },                      // a lua batendo na poça
  ];
  // o feixe de lua: do buraco até a poça
  const beam = (x, y) => { const k = y / 240, l = HOLE.a + 2 - k * 22, r = HOLE.b - 4 - k * 10; if (y > 240 || x < l - 6 || x > r + 6) return 0; const e = Math.min(x - l, r - x); return cl((e + 6) / 12, 0, 1) * (0.55 - k * 0.25) * (0.75 + fbm(x / 6 - y / 30, y / 40, 15) * 0.5); };
  const lightAt = (x, y) => { let a = 0, r = 0, g = 0, b = 0;
    for (const L of lights) { const d = Math.hypot(x - L.x, (y - L.y) * 1.1); if (d >= L.r) continue; const f = Math.pow(1 - d / L.r, 1.5) * L.s; a += f; r += L.c[0] * f; g += L.c[1] * f; b += L.c[2] * f; }
    return a > 0 ? { a, c: [r / a, g / a, b / a] } : null; };
  const MOONC = C('#9aaad8');

  /* ---------- fundo: parede distante, escura; uma galeria lá atrás, na névoa ---------- */
  const BACK = P(['#0a080c', '#120e12', '#1a1418', '#241c20', '#30262a', '#3e3236', '#4e4046']);
  const FAR = P(['#08060a', '#0e0b0e', '#151014', '#1d161a', '#271d22']);
  const farAt = (x, y) => { // silhuetas de estalagmites e uma galeria ao longe
    const fl = 205 + (fbm(x / 30, 8, 17) - 0.5) * 14;
    if (y > fl) return true;
    for (let i = 0; i < 9; i++) { const sx = 110 + i * 41 + h2(i, 1, 19) * 20, len = 20 + h2(i, 2, 19) * 40, w = 5 + h2(i, 3, 19) * 6; const k = (fl - y) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx) < w * Math.pow(1 - k, 0.7) * (0.8 + fbm(y / 4, i, 29) * 0.4)) return true; }
    for (let i = 0; i < 8; i++) { const sx = 120 + i * 45 + h2(i, 4, 19) * 20, len = 14 + h2(i, 5, 19) * 30, w = 4 + h2(i, 6, 19) * 5, top = 40 + h2(i, 7, 19) * 14; const k = (y - top) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx) < w * Math.pow(1 - k, 1.4) * (0.8 + fbm(y / 4, i, 31) * 0.4)) return true; }
    return y < 46 + (fbm(x / 20, 9, 21) - 0.5) * 10;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const L = lightAt(x, y), bm = beam(x, y);
    let c;
    if (farAt(x, y)) { N[y * W + x] = 1; c = rp(FAR, 0.25 + (fbm(x / 5, y / 4, 23) - 0.5) * 0.4 + bm * 0.9 + (L ? L.a * 0.25 : 0), x, y); }
    else { const haze = Math.exp(-Math.hypot((x - 250) / 1.4, y - 150) / 90); c = rp(BACK, 0.12 + haze * 0.55 + (fbm(x / 8, y / 6, 25) - 0.5) * 0.3 + bm * 0.6 + (L ? L.a * 0.2 : 0), x, y); }
    // névoa no meio da gruta, acesa pela lua
    const fog = Math.exp(-Math.pow((y - 190) / 40, 2)) * (0.3 + fbm(x / 40, y / 10, 27) * 0.5);
    c = mix(c, C('#2a2630'), qa(fog * 0.5, x, y, 5));
    put(x, y, c);
  }

  /* ---------- o Ninho: teia grande no canto de cima, à direita ---------- */
  const WEB = { x: 420, y: 70 };
  const SILK = C('#b8b8c4'), SILK2 = C('#6a6a76');
  const webPx = (x, y, a) => { x = Math.round(x); y = Math.round(y); if (!inb(x, y) || N[y * W + x] === 2) return; const L = lightAt(x, y), lit = 0.25 + (L ? L.a : 0) + beam(x, y); blend(x, y, mix(SILK2, SILK, cl(lit, 0, 1)), a * cl(0.35 + lit, 0, 1)); if (N[y * W + x] !== 1) N[y * W + x] = 5; };
  const anchors = [];
  for (let i = 0; i < 14; i++) { const ang = i / 14 * Math.PI * 2 + 0.2; let r = 1; while (r < 130) { const x = WEB.x + Math.cos(ang) * r, y = WEB.y + Math.sin(ang) * r * 0.85; if (!inb(x | 0, y | 0) || rockAt(x | 0, y | 0)) break; r++; } anchors.push([ang, r]); }
  for (const [ang, r] of anchors) for (let d = 3; d < r; d += 0.7) { const sag = Math.sin(d / r * Math.PI) * 2; webPx(WEB.x + Math.cos(ang) * d, WEB.y + Math.sin(ang) * d * 0.85 + sag, 0.38); }
  for (let rr = 6; rr < 125; rr += 5 + rr * 0.06) for (let i = 0; i < anchors.length; i++) {
    const [a0, r0] = anchors[i], [a1, r1] = anchors[(i + 1) % anchors.length]; if (rr > r0 || rr > r1) continue;
    if (h2(i, rr | 0, 31) < 0.22) continue;                                   // fios rompidos
    const x0 = WEB.x + Math.cos(a0) * rr, y0 = WEB.y + Math.sin(a0) * rr * 0.85, x1 = WEB.x + Math.cos(a1) * rr, y1 = WEB.y + Math.sin(a1) * rr * 0.85;
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let s = 0; s <= n; s++) { const t = s / n, sag = Math.sin(t * Math.PI) * rr * 0.05; webPx(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + sag, 0.26); }
  }
  // casulos pendurados e o cacho de ovos
  const COC = P(['#3a3a40', '#6a6a72', '#9c9ca6', '#cfcfd8']);
  const cocoon = (x0, y0, len, w) => { for (let j = 0; j < len; j++) { const ww = w * Math.sin((j + 1) / (len + 1) * Math.PI); for (let i = -Math.ceil(ww); i <= Math.ceil(ww); i++) { if (Math.abs(i) > ww) continue; const X = x0 + i + Math.round(Math.sin(j / 3) * 0.6), Y = y0 + j; const L = lightAt(X, Y); put(X, Y, rp(COC, 0.15 + (i < 0 ? 0.25 : 0) + ((j + (i & 1)) % 3 === 0 ? -0.15 : 0) + (L ? L.a * 0.8 : 0) + beam(X, Y), X, Y)); N[Y * W + X] = 5; } } for (let j = 1; j < 6; j++) webPx(x0, y0 - j, 0.6); };
  cocoon(372, 44, 14, 3.2); cocoon(458, 88, 11, 2.6); cocoon(392, 104, 9, 2.2);
  const EGG = P(['#2a3a1a', '#4a6a2a', '#7aa840', '#c8f080', '#f0ffd0']);
  for (const [ex, ey, r] of [[420, 124, 5], [430, 128, 4.5], [411, 130, 4], [438, 122, 3.5], [424, 134, 4], [446, 130, 3]]) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y * 1.15) / r; if (d > 1) continue; const X = ex + x, Y = ey + y; put(X, Y, rp(EGG, 0.2 + (1 - d) * 0.55 + (x < 0 && y < 0 ? 0.2 : 0) - (d > 0.85 ? 0.2 : 0), X, Y)); N[Y * W + X] = 5; }

  /* ---------- a Mãe-Teia, de cabeça para baixo no centro da teia ---------- */
  const SP = { g: C('#2e3024'), G: C('#16170f'), l: C('#4e7030'), L: C('#86ae48'), h: C('#3a2414') };
  const spPut = (x, y, c, rim) => { x = Math.round(x); y = Math.round(y); if (!inb(x, y)) return; const L = lightAt(x, y); let cc = c; if (L && rim) cc = mix(cc, L.c, qa(Math.min(0.4, L.a * 0.5), x, y, 4)); put(x, y, cc); N[y * W + x] = 5; };
  const seg = (ax, ay, bx2, by2, w, rim) => { const n = Math.ceil(Math.hypot(bx2 - ax, by2 - ay)) * 2; for (let q = 0; q <= n; q++) { const t = q / n, X = ax + (bx2 - ax) * t, Y = ay + (by2 - ay) * t; for (let o = 0; o < w; o++) spPut(X, Y + o, o === 0 && rim ? SP.g : SP.G, o === 0); } };
  // pernas: quatro de cada lado, em leque; três segmentos, o joelho dobrado para cima e para fora
  for (const side of [-1, 1]) for (let k = 0; k < 4; k++) {
    const hx = WEB.x + side * 7, hy = WEB.y + 7 + k * 3;
    const a1 = (-0.95 + k * 0.5), a2 = a1 + 0.9, a3 = a2 + 0.7;
    const kx = hx + side * Math.cos(a1) * 21, ky = hy + Math.sin(a1) * 21;
    const jx = kx + side * Math.cos(a2) * 20, jy = ky + Math.sin(a2) * 20;
    const tx = jx + side * Math.cos(a3) * 14, ty = jy + Math.sin(a3) * 14;
    seg(hx, hy, kx, ky, 4, true); seg(kx, ky, jx, jy, 3, true); seg(jx, jy, tx, ty, 2, false);
    spPut(kx, ky - 1, SP.L, true); spPut(jx, jy - 1, SP.L, true);
  }
  // abdômen (em cima, porque ela está de cabeça para baixo) com a marca de ampulheta, e a cabeça embaixo
  for (let y = -18; y <= 15; y++) for (let x = -15; x <= 15; x++) { const d = Math.hypot(x / 15, y / (y < 0 ? 18 : 15)); if (d > 1) continue; const X = WEB.x + x, Y = WEB.y - 10 + y;
    let c = d > 0.88 ? SP.G : SP.g;
    const ay = Math.abs(y + 1) * 0.8, hg = Math.abs(x) <= Math.max(0, 6 - ay * 0.8) + (ay > 4 ? (ay - 4) * 0.6 : 0) && ay < 10 && Math.abs(x) < 6;
    if (hg) c = ay < 2 ? SP.L : SP.l;
    if (x < -3 && y < -5 && d < 0.85 && d > 0.5) c = mix(c, C('#5a5e46'), 0.7);           // brilho
    if (d > 0.7 && d < 0.88 && (x + y * 3) % 7 === 0) c = SP.l;                              // pelos
    spPut(X, Y, c, d > 0.75); }
  for (let y = -8; y <= 8; y++) for (let x = -9; x <= 9; x++) { const d = Math.hypot(x / 9, y / 8); if (d > 1) continue; spPut(WEB.x + x, WEB.y + 12 + y, d > 0.8 ? SP.G : d < 0.4 && y < 0 ? C('#3a3e2c') : SP.g, d > 0.6); }
  for (const s of [-1, 1]) { for (let j = 0; j < 4; j++) spPut(WEB.x + s * (2 + (j > 2 ? 1 : 0)), WEB.y + 20 + j, j > 1 ? C('#8a5a30') : SP.h, j > 1); }   // as presas
  const EYES = [[-2, 16], [-1, 17], [1, 17], [2, 16], [-4, 14], [4, 14], [-5, 17], [5, 17]].map(([x, y]) => [WEB.x + x, WEB.y + y]);

  /* ---------- rocha da frente: teto, chão, coluna, laje ---------- */
  const TERRA = P(['#0e0906', '#1d140d', '#2c1f15', '#3c2b1e', '#4e3a29', '#614935', '#765a43']);
  const ROCHA = P(['#0e0d0c', '#1f1c1a', '#312c29', '#45403a', '#5a524a', '#6f665c', '#867b6f']);
  const CALC = P(['#1d1812', '#3a3124', '#594b38', '#7b6a52', '#9d8a6c', '#bba889', '#d6c6a4']);
  const ARG = P(['#160a07', '#2c140e', '#462116', '#613022', '#7c4030', '#975440']);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rockAt(x, y)) N[y * W + x] = 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (holeAt(x, y) && y < 8) N[y * W + x] = 4;
  const open = (x, y) => inb(x, y) && N[y * W + x] !== 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (N[y * W + x] !== 2) continue;
    const L = lightAt(x, y), lit = (L ? L.a : 0) + beam(x, y) * 0.6;
    const calc = stalAt(x, y) || stagAt(x, y) || colAt(x, y);
    const top = y < 60, ledge = x > 296 && y > 190;
    let pal = calc ? CALC : top ? TERRA : ledge ? ROCHA : (fbm(x / 30, y / 12, 41) > 0.55 && y < 200 ? ARG : TERRA);
    let t = 0.3 + (fbm(x / 6, y / 4, 43) - 0.5) * 0.45;
    const st = fbm(x / 24, y / 3, 45); if (st > 0.63) t += 0.14; else if (st > 0.59) t -= 0.1;
    if (calc) t += (fbm(x / 2, y / 8, 47) - 0.5) * 0.3;
    // bordas: chão aceso por cima, laterais viradas para a luz
    let e = 0;
    if (open(x, y - 1)) e = 0.35; else if (open(x, y - 2)) e = 0.18;
    if (L) { const dx = Math.sign(TORCH.x - x); if (open(x + dx, y)) e += 0.25; }
    if (beam(x, y - 2) > 0.1 && open(x, y - 1)) e += 0.3;
    t = t * (0.22 + lit * 1.1) + e * (0.25 + lit * 0.9);
    let c = rp(pal, t, x, y);
    if (L) c = mix(c, L.c, qa(Math.min(0.5, L.a * 0.4), x, y, 8));
    if (beam(x, y) > 0.05) c = mix(c, MOONC, qa(beam(x, y) * 0.35, x, y, 6));
    put(x, y, c);
  }
  // céu pelo buraco
  for (let y = 0; y < 12; y++) for (let x = HOLE.a - 6; x < HOLE.b + 6; x++) if (N[y * W + x] === 4 || (holeAt(x, y) && y < 3)) { put(x, y, rp(P(['#0a0a18', '#121428', '#1a1e38']), 0.6 - y / 12, x, y)); if (h2(x, y, 51) > 0.96) put(x, y, C('#d8d8f0')); }

  // veios de cobre perto da tocha
  for (let n = 0; n < 120; n++) { const x = (h2(n, 1, 61) * W) | 0, y = (h2(n, 2, 61) * H) | 0; if (M(x, y) !== 2) continue; const L = lightAt(x, y); if (!L || L.a < 0.12) continue;
    for (const [dx, dy, c] of [[0, 0, '#e08a48'], [1, 0, '#a85a2a'], [0, 1, '#7a3e1e'], [1, 1, '#c8703a']]) if (M(x + dx, y + dy) === 2 && h2(x + dx, y + dy, 63) > 0.3) put(x + dx, y + dy, mix(get(x + dx, y + dy), C(c), cl(L.a * 1.4, 0.3, 1))); }
  // raízes descendo pelo buraco e pelo teto
  const ROOT = P(['#140c07', '#24170c', '#3a2614', '#56391e']);
  for (let n = 0; n < 40; n++) { let x = (100 + h2(n, 3, 71) * 300) | 0, y = 0; while (y < H - 1 && M(x, y) === 2) y++; if (y > 60 || y < 4) continue;
    const len = 6 + (h2(n, 4, 71) * 22) | 0; for (let j = 0; j < len && open(x, y); j++) { const L = lightAt(x, y); put(x, y, rp(ROOT, 0.2 + (L ? L.a : 0) + beam(x, y) * 0.8, x, y)); if (h2(n, j, 73) > 0.7) x += h2(n, j, 75) > 0.5 ? 1 : -1; y++; } }
  // a poça: água escura que espelha a lua e a tocha
  for (let x = POOL.a; x < POOL.b; x++) { const edge = Math.min(x - POOL.a, POOL.b - x); if (edge < 0) continue; const depth = Math.min(6, edge / 6);
    for (let j = 0; j < depth; j++) { const y = POOL.y + j; if (y >= H) continue; const bm = beam(x, POOL.y - 4) ; const L = lightAt(x, y);
      let c = rp(P(['#04060c', '#0a1020', '#14203a', '#24365a', '#5a6e98', '#b8c8f0']), 0.15 + bm * 1.2 * (j === 0 ? 1.3 : 0.7) + (L ? L.a * 0.3 : 0) + (j === 0 ? 0.1 : 0), x, y);
      if (L && L.a > 0.15 && (x + j) % 3 === 0) c = mix(c, C('#ffa850'), 0.35 * L.a);
      put(x, y, c); N[y * W + x] = 3; } }

  /* ---------- o herói, na laje, tocha erguida ---------- */
  const HK = [
    '....hh.h......',
    '..hhhhhhhh....',
    '.hhhhhhhhhh...',
    '.hhhhhhhhh..t.',
    '..hhhhssWe..t.',
    '..hhhsssss..t.',
    '...hhsssms.ss.',
    '....hssss.rr..',
    '....nssn.rr...',
    '...nnnnnnr....',
    '..rrrrrrrr....',
    '..rrrrrrrr....',
    '..rrrrrrrr....',
    '..bbbbbbkb....',
    '..rrrrrrrr....',
    '..rrrrrrrr....',
    '.rrrrrrrrrr...',
    '.rrrrrrrrrr...',
    '..pppp.ppp....',
    '..ppp...pp....',
    '..ppp...pp....',
    '.fff....fff...'];
  const HC = { h: '#4e2c1a', s: '#e2a982', W: '#f2ead8', e: '#1c1422', m: '#a5604a', n: '#8a6a48', r: '#6e5a44', b: '#3a2618', k: '#c8a050', p: '#4b3b33', f: '#2a1c14', t: '#5a3a1e' };
  for (let j = 0; j < HK.length; j++) for (let i = 0; i < HK[j].length; i++) { const ch = HK[j][i]; if (!HC[ch]) continue;
    let c = C(HC[ch]); const X = HERO.x + i, Y = HERO.y + j;
    if (ch !== 'W' && ch !== 'e') { const lx = (i - 4) / 10, up = (21 - j) / 21; c = mix(c, lx > 0.2 || up > 0.7 ? C('#ffc888') : C('#160e10'), lx > 0.2 || up > 0.7 ? cl(lx * 0.3 + up * 0.15, 0, 0.35) : 0.4); }
    if (ch === 'h' && (i + j) % 4 === 0) c = mix(c, C('#2a160c'), 0.4);
    put(X, Y, c); N[Y * W + X] = 6; }
  // sombra comprida da laje para trás
  for (let x = HERO.x - 22; x < HERO.x + 2; x++) { const y = Math.round(yLedge(x)) + 1; if (M(x, y) === 2) blend(x, y, C('#050304'), 0.6 * (1 - (HERO.x + 2 - x) / 26)); }

  /* ---------- longe da luz, tudo some no escuro; a esquerda fica para o nome e o menu ---------- */
  const DARK = C('#030205');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = N[y * W + x]; if (n === 4 || n === 6) continue;
    const L = lightAt(x, y); const lit = (L ? L.a : 0) + beam(x, y) * 1.1 + (n === 0 ? 0.3 : n === 1 ? 0.22 : n === 5 ? 0.25 : 0.08);
    const left = cl((150 - x) / 140, 0, 1) * 0.5;
    const dk = cl(0.7 - lit * 2.3 + left, 0, 0.92);
    if (dk > 0) put(x, y, mix(get(x, y), DARK, qa(dk, x, y, 8)));
  }
  /* ---------- grão e vinheta ---------- */
  const VIG = C('#020103');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - W * 0.6) / (W * 0.6), ny = (y - H * 0.45) / (H * 0.68), d = Math.hypot(nx, ny);
    let c = get(x, y); const g = (h2(x, y, 999) - 0.5) * 8; c = [c[0] + g, c[1] + g, c[2] + g];
    const v = cl((d - 0.6) / 0.6, 0, 1) * 0.75; if (v > 0) c = mix(c, VIG, qa(v, x, y, 5));
    put(x, y, [cl(c[0], 0, 255), cl(c[1], 0, 255), cl(c[2], 0, 255)]);
  }
  cx.putImageData(img, 0, 0);

  /* ---------- o que mexe ---------- */
  const glow = document.createElement('canvas'); glow.width = 72; glow.height = 72;
  { const g = glow.getContext('2d'); for (let y = 0; y < 72; y++) for (let x = 0; x < 72; x++) { const d = Math.hypot(x - 36, y - 36) / 30; const a = qa(cl(1 - d, 0, 1), x, y, 4); if (a > 0) { g.fillStyle = `rgba(255,160,70,${a * 0.06})`; g.fillRect(x, y, 1, 1); } } }
  const FL = ['#fff4c0', '#ffd27a', '#f39a3a', '#d0601e', '#8a2e10'];
  const motes = [], drips = [], ripples = [];
  const DRIP_FROM = STAL.filter(([sx]) => sx > POOL.a + 4 && sx < POOL.b - 4).map(([sx, len]) => [sx, Math.round(yCeil(sx) - 2 + len)]);
  let dripT = 0.8, blinkAt = 2.5, sp = { y: 0, ph: 0 };
  function frame(fx, t, dt) {
    // chama da tocha
    const tx = TORCH.x, ty = TORCH.y;
    fx.globalAlpha = 0.8 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.1; fx.drawImage(glow, tx - 36, ty - 36); fx.globalAlpha = 1;
    for (let j = 0; j < 5; j++) { const w = j < 1 ? 1 : j < 3 ? 2 : 1, sway = Math.round(Math.sin(t * 7 + j) * (j / 4) * 1.2); fx.fillStyle = FL[Math.min(4, j + (Math.sin(t * 15 + j * 2) > 0.5 ? 1 : 0))]; fx.fillRect(tx - (w > 1 ? 1 : 0) + sway, ty - j, w, 1); }
    if (Math.random() < dt * 6) motes.push({ x: tx + (Math.random() - 0.5) * 2, y: ty - 4, vx: (Math.random() - 0.5) * 6, vy: -(8 + Math.random() * 10), t: 0, life: 0.6 + Math.random() * 0.8, spark: true });
    // poeira no feixe da lua
    if (motes.length < 40 && Math.random() < dt * 10) { const y = Math.random() * 230, k = y / 240; motes.push({ x: HOLE.a + 4 - k * 22 + Math.random() * (HOLE.b - HOLE.a - 10 + k * 12), y, vx: 1 + Math.random() * 2, vy: 1 + Math.random() * 3, t: 0, life: 4 + Math.random() * 4 }); }
    for (let i = motes.length - 1; i >= 0; i--) { const m = motes[i]; m.t += dt; if (m.t > m.life) { motes.splice(i, 1); continue; } m.x += (m.vx + Math.sin(m.t * 2 + i) * 1.5) * dt; m.y += m.vy * dt;
      const f = m.t / m.life; fx.globalAlpha = m.spark ? 1 - f : Math.sin(f * Math.PI) * cl(beam(m.x | 0, m.y | 0) * 1.2, 0, 0.5); fx.fillStyle = m.spark ? FL[Math.min(4, (f * 5) | 0)] : '#d8e0ff'; fx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); }
    fx.globalAlpha = 1;
    // gotas caindo das estalactites na poça
    dripT -= dt; if (dripT <= 0 && DRIP_FROM.length) { const [x, y] = DRIP_FROM[(Math.random() * DRIP_FROM.length) | 0]; drips.push({ x, y, vy: 0 }); dripT = 0.9 + Math.random() * 1.8; }
    for (let i = drips.length - 1; i >= 0; i--) { const d = drips[i]; d.vy += 220 * dt; d.y += d.vy * dt; if (d.y >= POOL.y) { ripples.push({ x: d.x, t: 0 }); drips.splice(i, 1); continue; } fx.fillStyle = '#c8d8ff'; fx.fillRect(d.x, Math.round(d.y), 1, d.vy > 60 ? 2 : 1); }
    for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.t += dt; if (r.t > 1.2) { ripples.splice(i, 1); continue; } const rad = 1 + r.t * 8; fx.globalAlpha = 1 - r.t / 1.2; fx.fillStyle = '#9ab0e0'; fx.fillRect(Math.round(r.x - rad), POOL.y, 2, 1); fx.fillRect(Math.round(r.x + rad - 1), POOL.y, 2, 1); }
    fx.globalAlpha = 1;
    // os olhos da Mãe-Teia: acendem e apagam devagar, e piscam
    if (t > blinkAt + 0.2) blinkAt = t + 2.5 + Math.random() * 5;
    if (!(t > blinkAt && t < blinkAt + 0.2)) { fx.globalAlpha = 0.55 + Math.sin(t * 0.9) * 0.3; for (const [i, [x, y]] of EYES.entries()) { fx.fillStyle = i < 4 ? '#eef4dc' : '#9ad83a'; fx.fillRect(x, y, 1, 1); } fx.globalAlpha = 1; }
    // uma aranha pequena descendo e subindo no fio
    sp.y = 24 + (Math.sin(t * 0.35) * 0.5 + 0.5) * 60; const sx = 386, top = 52;
    fx.fillStyle = 'rgba(184,184,196,0.45)'; for (let y = top; y < top + sp.y; y += 1) fx.fillRect(sx, y, 1, 1);
    const sy = Math.round(top + sp.y); fx.fillStyle = '#24261c'; fx.fillRect(sx - 1, sy, 3, 2); fx.fillRect(sx - 2, sy + (Math.sin(t * 6) > 0 ? 0 : 1), 1, 1); fx.fillRect(sx + 2, sy + (Math.sin(t * 6) > 0 ? 1 : 0), 1, 1); fx.fillStyle = '#9ad83a'; fx.fillRect(sx, sy + 2, 1, 1);
  }
  return { canvas: cv, frame };
}
var TITLE_ARTS = TITLE_ARTS || []; TITLE_ARTS.push(paintTitleArtCavernas);
