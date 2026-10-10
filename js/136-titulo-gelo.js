'use strict';
/* arte da tela de título: As Cavernas de Gelo. Um salão sob as criptas onde um frio antigo parou tudo: o teto
   é uma crosta de rocha e gelo azul cheia de sincelos, no fundo há paredes de geleira e uma floresta de sincelos
   na névoa, uma cachoeira congelada no meio da queda brilha azul, e cristais de gelo (um pendurado no teto, uma
   drusa no chão, os que crescem nas costas dele) dão a única luz fria. À direita, enorme, o Yeti Ancestral,
   curvado como um grande macaco, bate os dois punhos no chão e ruge: pelo branco-azulado, cara escura, chifres
   de osso, olhos azuis. Entre ele e o herói, um explorador que veio antes, congelado em pé num bloco de gelo.
   O herói, numa laje coberta de neve, ergue a tocha (a única luz quente) e olha para ele. A esquerda fica escura
   para o nome e o menu; embaixo, um lago congelado espelha a tocha.
   Pintada uma vez (480x270, 39-titulo sorteia entre as artes de TITLE_ARTS). Por quadro mexem só coisas pequenas:
   a chama da tocha, pó de gelo caindo do teto, brilhos piscando no gelo, os olhos do Yeti e o bafo dele no frio. */
function paintTitleArtGelo() {
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
  const N = new Uint8Array(W * H);   // o que está em cada pixel: 0 fundo, 1 plano distante, 2 rocha/gelo, 3 lago, 5 yeti, 6 herói, 7 gelo que brilha
  const M = (x, y) => inb(x, y) ? N[y * W + x] : 2;

  /* ---------- paletas do jogo (70-gelo-blocos, 71-gelo-objetos, 72-gelo-bichos) ---------- */
  const NEVE = P(['#3a475a', '#566880', '#7a8ea8', '#a0b6cc', '#c6d8e8', '#e4eff8', '#ffffff']);
  const GELO = P(['#10283e', '#1c4466', '#30668e', '#5090b8', '#80bcdc', '#b8e0f4', '#effaff']);
  const AZUL = P(['#061630', '#0b2850', '#123e76', '#1c5c9e', '#3282c4', '#64b0e4', '#b4e2fa']);
  const CRIS = P(['#06203a', '#0a3a62', '#12608e', '#1e8ec0', '#46bce6', '#9ae4fa', '#eafcff']);
  const ROCHA = P(['#10151c', '#1c2430', '#2c3846', '#3e4e60', '#526478', '#687c92', '#8296ac']);
  const PERMA = P(['#1c1a1c', '#2d2a2b', '#413c3b', '#56504d', '#6d6662', '#857e78']);
  const NEGRO = P(['#03060c', '#070d17', '#0e1724', '#162334', '#203247', '#2c445e', '#3c5a78']);
  const OSSO = P(['#26282a', '#3e4244', '#5e6466', '#82898c', '#a8b0b2', '#c8d2d6', '#e8f2f6']);
  const PELO = P(['#26303e', '#425266', '#66788e', '#90a4ba', '#b8c8da', '#dae6f0', '#f6fbff']);
  const CARA = P(['#121218', '#1e1e26', '#2e2e38', '#42424e', '#585866', '#70707e', '#8c8c9a']);
  const OLHO = P(['#06243a', '#0a4064', '#126894', '#2496c4', '#5cc4ea', '#a8e8fa', '#ffffff']);
  const BOCA = P(['#200608', '#3a0c10', '#5a1418', '#7c2024', '#a03034', '#c04c4c', '#e07a76']);

  /* ---------- palcos: teto, chão do salão, laje do herói, lago congelado, rocha da esquerda ---------- */
  const yCeil = x => 20 + (fbm(x / 24, 1, 3) - 0.5) * 18 + (fbm(x / 60, 2, 4) - 0.5) * 22 + Math.max(0, 150 - x) * 0.3 + Math.max(0, x - 400) * 0.1;
  const yFloor = x => { const k = sm(cl((x - 190) / 110, 0, 1)); return 240 - k * 12 + (fbm(x / 22, 3, 7) - 0.5) * 5; };
  const HX = 238;                                                                 // onde o herói está
  const yLedge = x => 211 + (fbm(x / 12, 4, 9) - 0.5) * 6 + (fbm(x / 4, 4, 10) - 0.5) * 2 + Math.pow(Math.max(0, 222 - x) / 9, 2) + Math.pow(Math.max(0, x - 268) / 8, 2);
  const LAKE = { a: 62, b: 218, y: 241 };
  const colL = y => 54 + (fbm(y / 18, 5, 11) - 0.5) * 20 + Math.max(0, 70 - y) * 0.8 + Math.max(0, y - 200) * 0.5;
  // sincelos (x, comprimento, largura) e estalagmites de gelo
  const STAL = [[204, 26, 4], [211, 12, 2], [222, 16, 3], [236, 44, 6], [243, 20, 3], [252, 9, 2], [266, 30, 4], [272, 12, 2], [318, 14, 3], [330, 38, 5], [337, 16, 2], [350, 8, 2], [362, 24, 4], [372, 11, 2], [430, 18, 3], [442, 34, 5], [450, 12, 2], [470, 26, 5], [458, 9, 2], [178, 18, 3], [186, 7, 2], [164, 10, 2]];
  const STAG = [[206, 14, 5], [282, 9, 3], [470, 22, 6], [478, 12, 4], [196, 8, 3]];
  const stalK = (x, y) => { for (const [sx, len, w] of STAL) { const top = yCeil(sx) - 2, k = (y - top) / len; if (k >= 0 && k <= 1) { const c = sx + Math.sin(k * 2.2 + sx) * 0.6, half = Math.max(0.4, (1 - Math.pow(k, 0.7)) * w); if (Math.abs(x + 0.5 - c) <= half) return [(x + 0.5 - (c - half)) / (2 * half), k]; } } return null; };
  const stagK = (x, y) => { for (const [sx, len, w] of STAG) { const base = Math.min(yLedge(sx), yFloor(sx)) + 2, k = (base - y) / len; if (k >= 0 && k <= 1) { const half = Math.max(0.4, (1 - Math.pow(k, 0.7)) * w); if (Math.abs(x + 0.5 - sx) <= half) return [(x + 0.5 - (sx - half)) / (2 * half), k]; } } return null; };
  const ground = x => Math.min(yLedge(x), yFloor(x));
  const rockAt = (x, y) => y < yCeil(x) || y > ground(x) || x < colL(y) || !!stalK(x, y) || !!stagK(x, y);

  /* ---------- a cachoeira congelada, a drusa e o cristal pendurado ---------- */
  const FALL = { x: 200, top: 0 }; FALL.top = Math.round(yCeil(FALL.x)) - 2;
  const fallAt = (x, y) => { if (y < FALL.top || y > yFloor(x) + 1) return 0; const t = (y - FALL.top) / (228 - FALL.top), spread = 9 + t * 9 + (t > 0.9 ? (t - 0.9) * 90 : 0), c = FALL.x + Math.sin(y * 0.05) * 1.6, dx = x + 0.5 - c; if (Math.abs(dx) > spread) return 0; if (Math.abs(dx) > spread - 1.5 && (y * 5 + x) % 7 < 3) return 0; return [dx / spread, t]; };
  const GEODE = { x: 468, y: 0 }; GEODE.y = Math.round(yFloor(GEODE.x)) + 1;
  const HANG = { x: 404, y: 0 }; HANG.y = Math.round(yCeil(HANG.x)) - 1;

  /* ---------- luzes ---------- */
  const HERO = { x: HX, y: 0 }; HERO.y = Math.round(yLedge(HERO.x + 6)) - 22;
  const TORCH = { x: HERO.x + 13, y: HERO.y + 1 };
  const lights = [
    { x: TORCH.x, y: TORCH.y, r: 135, c: C('#ffa850'), s: 1.3 },
    { x: 300, y: 150, r: 175, c: C('#4a78b0'), s: 0.15 },                       // o frio que o gelo devolve, espalhado pelo salão
    { x: FALL.x, y: 140, r: 70, c: C('#4aa0e0'), s: 0.3 },                      // a cachoeira congelada
    { x: GEODE.x, y: GEODE.y - 10, r: 70, c: C('#6ad0f4'), s: 0.7 },             // a drusa no chão
    { x: HANG.x, y: HANG.y + 16, r: 75, c: C('#6ad0f4'), s: 0.65 },              // o cristal pendurado
    { x: 404, y: 82, r: 46, c: C('#8fdcff'), s: 0.5 },                         // os cristais nas costas do Yeti
  ];
  const lightAt = (x, y) => { let a = 0, r = 0, g = 0, b = 0;
    for (const L of lights) { const d = Math.hypot(x - L.x, (y - L.y) * 1.1); if (d >= L.r) continue; const f = Math.pow(1 - d / L.r, 1.5) * L.s; a += f; r += L.c[0] * f; g += L.c[1] * f; b += L.c[2] * f; }
    return a > 0 ? { a, c: [r / a, g / a, b / a] } : null; };
  const warmAt = (x, y, r = 135) => { const d = Math.hypot(x - TORCH.x, (y - TORCH.y) * 1.1); return d < r ? Math.pow(1 - d / r, 1.5) * 1.3 : 0; };
  const WARM = C('#ffa850'), COLD = C('#8fdcff');

  /* ---------- fundo: paredes de geleira ao longe, sincelos na névoa ---------- */
  const BACK = P(['#050d18', '#081424', '#0c1c31', '#10253f', '#152f4e', '#1b3a5e', '#24486e']);
  const FAR = P(['#040a13', '#06101d', '#091628', '#0c1d34', '#102541', '#152e4f']);
  const farAt = (x, y) => {
    const fl = 200 + (fbm(x / 30, 8, 17) - 0.5) * 14;
    if (y > fl) return 1;
    for (let i = 0; i < 10; i++) { const sx = 100 + i * 39 + h2(i, 1, 19) * 18, len = 40 + h2(i, 2, 19) * 70, w = 7 + h2(i, 3, 19) * 8; const k = (fl - y) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx) < w * (k < 0.85 ? 1 : (1 - k) / 0.15) * (0.85 + fbm(y / 6, i, 29) * 0.3)) return 2; }   // seracs: colunas retas de geleira
    for (let i = 0; i < 18; i++) { const sx = 96 + i * 22 + h2(i, 4, 19) * 12, len = 14 + h2(i, 5, 19) * 44, w = 2 + h2(i, 6, 19) * 3.5, top = 40 + h2(i, 7, 19) * 10; const k = (y - top) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx) < w * Math.pow(1 - k, 0.9)) return 3; }   // a floresta de sincelos lá atrás
    return y < 44 + (fbm(x / 20, 9, 21) - 0.5) * 10 ? 1 : 0;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const L = lightAt(x, y), fa = farAt(x, y);
    let c;
    if (fa) { N[y * W + x] = 1; let t = 0.25 + (fbm(x / 5, y / 4, 23) - 0.5) * 0.35 + (L ? L.a * 0.3 : 0);
      if (fa === 2) { const ph = (x * 0.9 + fbm(y / 20, x / 9, 33) * 6) % 9; t += ph < 1 ? 0.25 : ph < 2 ? -0.08 : 0; }   // arestas das colunas
      if (fa === 3) t += 0.12;
      c = rp(FAR, t, x, y); }
    else { const haze = Math.exp(-Math.hypot((x - 320) / 1.4, y - 140) / 95); c = rp(BACK, 0.08 + haze * 0.48 + (fbm(x / 8, y / 6, 25) - 0.5) * 0.3 + (L ? L.a * 0.22 : 0), x, y); }
    const fog = Math.exp(-Math.pow((y - 196) / 36, 2)) * (0.3 + fbm(x / 40, y / 10, 27) * 0.5);   // névoa fria rente ao chão
    c = mix(c, C('#1e3048'), qa(fog * 0.5, x, y, 5));
    put(x, y, c);
  }

  /* ---------- rocha e gelo da frente ---------- */
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rockAt(x, y)) N[y * W + x] = 2;
  const open = (x, y) => inb(x, y) && N[y * W + x] !== 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (N[y * W + x] !== 2) continue;
    const L = lightAt(x, y), lit = L ? L.a : 0, sk = stalK(x, y) || stagK(x, y);
    let c;
    if (sk) {   // sincelo / estalagmite: gelo claro, a luz descendo pela face, a ponta molhada
      const [u, k] = sk; let v = 4.6 - u * 3 + (fbm(x / 2, y / 3, 47) - 0.5) * 0.5 + (k > 0.86 ? 1.1 : 0) + (Math.abs(u - 0.3) < 0.1 ? 1.5 : 0);
      c = rp(GELO, (v / 6) * (0.14 + lit * 1.2) + (L && Math.sign(TORCH.x - x) < 0 === u > 0.5 ? lit * 0.15 : 0), x, y); N[y * W + x] = 7;
    } else {
      const top = y < 70, gy = ground(x), floor = y > gy - 1 && y >= 150, depth = y - gy;
      const ledge = x > 196 && x < 296 && y > 196 && yLedge(x) < yFloor(x) + 1;
      let pal = ROCHA, t = 0.3 + (fbm(x / 6, y / 4, 43) - 0.5) * 0.45;
      const bed = ((y - x * 0.18 + (fbm(x / 6, y / 4, 51) - 0.5) * 12) % 16 + 16) % 16; if (bed < 1) t -= 0.14; else if (bed < 2.2) t += 0.08;   // camadas inclinadas da ardósia
      if (top) { const glaze = fbm(x / 18, y / 7, 41); if (glaze > 0.55 || y > yCeil(x) - 6) { pal = AZUL; t = 0.32 + (glaze - 0.5) * 0.6 + (fbm(x / 3, y / 3, 49) - 0.5) * 0.3; const g = ((x + y * 0.6 + fbm(x / 20, y / 20, 53) * 12) % 48 + 48) % 48; if (g < 2) t += 0.25; } }   // crosta de gelo azul no teto
      if (floor) { const snow = 5 + fbm(x / 9, 5, 55) * 6; if (depth < snow) { pal = NEVE; const drift = (y + fbm(x / 60, y / 8, 57) * 16 + Math.sin(x / 19) * 2) % 9; t = 0.5 + (fbm(x / 12, y / 5, 59) - 0.5) * 0.3 - depth * 0.03 + (drift < 0.8 ? -0.1 : drift < 1.6 ? 0.06 : 0); } else if (!ledge) { pal = PERMA; } }
      if (x < colL(y) + 1 && !floor && !top) { pal = ROCHA; }
      let e = 0;
      if (open(x, y - 1)) e = 0.4; else if (open(x, y - 2)) e = 0.2;
      if (L) { const dx = Math.sign(TORCH.x - x); if (open(x + dx, y)) e += 0.25; }
      t = t * (0.22 + lit * 1.1) + e * (0.25 + lit * 0.9);
      c = rp(pal, t, x, y);
      if (pal === NEVE && h2(x, y, 61) < 0.012 && lit > 0.12) c = C('#f2fbff');   // um brilho na neve
    }
    if (L) c = mix(c, L.c, qa(Math.min(0.5, L.a * 0.4), x, y, 8));
    put(x, y, c);
  }
  // veios de gelo nas juntas da rocha perto das luzes
  for (let n = 0; n < 160; n++) { const x = (h2(n, 1, 61) * W) | 0, y = (h2(n, 2, 61) * H) | 0; if (M(x, y) !== 2) continue; const L = lightAt(x, y); if (!L || L.a < 0.1) continue;
    const len = 3 + (h2(n, 3, 61) * 6) | 0; for (let j = 0; j < len; j++) { const X = x + j, Y = y + Math.round(j * 0.2); if (M(X, Y) === 2) put(X, Y, mix(get(X, Y), C(j % 3 ? '#8cb6d0' : '#c8e6f6'), cl(L.a * 1.2, 0.25, 0.8))); } }

  // o lago congelado: gelo liso e escuro que espelha a tocha, com rachaduras brancas
  for (let x = LAKE.a; x < LAKE.b; x++) { const edge = Math.min(x - LAKE.a, LAKE.b - x); if (edge < 0) continue; const depth = Math.min(7, 1 + edge / 5);
    for (let j = 0; j < depth; j++) { const y = LAKE.y + j; if (y >= H || M(x, y) !== 2) continue; const L = lightAt(x, y), wm = warmAt(x, y - 20);
      let c = rp(AZUL, 0.12 + (L ? L.a * 0.35 : 0) + (j === 0 ? 0.15 : 0) + (fbm(x / 14, j, 63) - 0.5) * 0.15, x, y);
      if (wm > 0.1 && Math.abs(x - TORCH.x + 26) < 30 * wm && (x + j * 2) % 3 === 0) c = mix(c, WARM, 0.4 * wm);   // a tocha refletida
      if (Math.abs(fbm(x / 10, j / 2, 65) - 0.5) < 0.02) c = mix(c, C('#c8e6f6'), 0.5);
      put(x, y, c); N[y * W + x] = 3; } }

  // a cachoeira congelada: colunas lisas de gelo, a parte do meio mais funda, um monte onde ela bateu no chão
  for (let y = 0; y < H; y++) for (let x = FALL.x - 40; x < FALL.x + 40; x++) {
    const f = fallAt(x, y); if (!f || M(x, y) === 2 && y < yCeil(x) - 4) continue; if (M(x, y) === 2 && y > yFloor(x) - 1) continue;
    const [u, t] = f, col = Math.sin((u * 14 + (fbm(x / 3, y / 30, 67) - 0.5) * 4) * 1.1), L = lightAt(x, y), lit = L ? L.a : 0;
    let v = 0.5 + col * 0.18 - Math.abs(u) * 0.2 + (y % 9 === 0 ? 0.06 : 0) + (u < -0.5 ? 0.12 : 0);
    let c = rp(Math.abs(u) < 0.45 ? AZUL : GELO, v * (0.3 + lit * 0.85) + 0.03, x, y);
    if (L) c = mix(c, L.c, qa(Math.min(0.4, lit * 0.35), x, y, 6));
    put(x, y, c); N[y * W + x] = 7;
  }
  // a drusa: uma coroa de cristais compridos saindo de um caroço de gelo negro
  const crystal = (bx, by, ang, len, wd, R, glow) => { const ux = Math.sin(ang), uy = -Math.cos(ang);
    for (let y = Math.floor(by - len - 3); y <= by + len + 3; y++) for (let x = Math.floor(bx - len - 3); x <= bx + len + 3; x++) {
      const px = x + 0.5 - bx, py = y + 0.5 - by, al = px * ux + py * uy, pe = px * -uy + py * ux; if (al < 0 || al > len) continue;
      const ww = wd * Math.min(1, (len - al) / (wd * 1.3)); if (Math.abs(pe) > ww) continue;
      const v = (pe < -ww * 0.3 ? 5 : pe > ww * 0.3 ? 2.6 : 6) - (al < 1.5 ? 1.6 : 0) + (al > len - 1.5 ? 0.5 : 0);
      put(x, y, rp(R, v / 6 * glow, x, y)); N[y * W + x] = 7; } };
  for (let y = -6; y <= 4; y++) for (let x = -16; x <= 16; x++) { if (Math.hypot(x / 16, y / 5) > 1) continue; const X = GEODE.x + x, Y = GEODE.y - 2 + y; put(X, Y, rp(NEGRO, 0.35 - y * 0.03 + (fbm(X / 3, Y / 3, 69) - 0.5) * 0.3, X, Y)); N[Y * W + X] = 2; }
  for (const [dx, ang, len, wd] of [[-12, -0.85, 9, 2], [-8, -0.45, 16, 2.6], [-3, -0.15, 22, 3], [2, 0.04, 26, 3.2], [7, 0.28, 18, 2.6], [11, 0.55, 13, 2.2], [14, 0.9, 8, 1.8], [-1, -0.95, 6, 1.6]]) crystal(GEODE.x + dx, GEODE.y - 4, ang, len, wd, CRIS, 0.95);
  // o cristal pendurado do teto, ponta para baixo, numa crosta de gelo negro
  for (let y = -3; y <= 3; y++) for (let x = -12; x <= 12; x++) { if (Math.hypot(x / 12, y / 3.5) > 1) continue; const X = HANG.x + x, Y = HANG.y + y; put(X, Y, rp(NEGRO, 0.4 - y * 0.05, X, Y)); N[Y * W + X] = 2; }
  for (const [dx, ang, len, wd] of [[0, Math.PI, 30, 3.4], [-6, Math.PI - 0.35, 17, 2.4], [6, Math.PI + 0.3, 20, 2.4], [-10, Math.PI - 0.8, 8, 1.6], [10, Math.PI + 0.75, 8, 1.6]]) crystal(HANG.x + dx, HANG.y + 2, ang, len, wd, CRIS, 0.95);
  // ossos de mamute congelados na neve, aos pés do Yeti
  const tusk = (x0, y0, len, dir) => { for (let j = 0; j < len; j++) { const t = j / len, X = Math.round(x0 + dir * j), Y = Math.round(y0 - Math.sin(t * 2.4) * len * 0.42), w = Math.max(1, Math.round((1 - t) * 2.4)); for (let o = 0; o < w; o++) { const L = lightAt(X, Y - o); put(X, Y - o, rp(OSSO, 0.25 + (o === w - 1 ? 0.25 : 0) + (L ? L.a * 0.6 : 0), X, Y - o)); N[(Y - o) * W + X] = 2; } } };
  

  // um explorador que veio antes: congelado em pé dentro de um bloco de gelo claro, a tocha apagada ainda erguida
  const ICEBLOCK = { x: 300, w: 20, h: 29 };
  const iceBlock = () => { const bx = ICEBLOCK.x, by = Math.round(yFloor(bx)) + 2, bw = ICEBLOCK.w, bh = ICEBLOCK.h;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const X = bx - (bw >> 1) + x, Y = by - bh + y; if ((x === 0 || x === bw - 1) && (y * 3 + x) % 5 < 2) continue; if (y < 2 && (x < 2 || x > bw - 3)) continue;
      const L = lightAt(X, Y), lit = L ? L.a : 0; let t = 0.3 + (fbm(X / 4, Y / 6, 111) - 0.5) * 0.2 + (x < 2 ? 0.22 : 0) + (y < 2 ? 0.3 : 0) - (x > bw - 3 ? 0.12 : 0) + (Math.abs(x - y * 0.4 - 3) < 0.6 ? 0.3 : 0);
      let c = rp(GELO, t * (0.35 + lit * 1.1), X, Y);
      const ch = HK[y - 5] && HK[y - 5][x - 3]; if (ch && HC[ch]) c = mix(c, mix(C(HC[ch]), C('#0c1c30'), 0.55), 0.8);   // ele, visto escuro através do gelo
      if (L) c = mix(c, L.c, qa(Math.min(0.4, lit * 0.35), X, Y, 6));
      put(X, Y, c); N[Y * W + X] = 7; } };
  /* ---------- o Yeti Ancestral: o desenho do jogo (72/74, a pose dos punhos no chão, rugindo) refeito a 5x, de frente para a esquerda ---------- */
  const K = 5, YX = 326, YY = 44;                                  // canto do desenho de 30x37 unidades
  const WX = sx => YX + (30 - sx) * K, WY = sy => YY + (sy + 3) * K;
  const YR = new Int8Array(W * H).fill(-1), YV = new Float32Array(W * H), YNX = new Float32Array(W * H), YNY = new Float32Array(W * H), RAMPS = [PELO, CARA, OLHO, OSSO, BOCA, GELO];
  const yput = (x, y, r, v, nx = 0, ny = 0) => { x = Math.round(x); y = Math.round(y); if (!inb(x, y)) return; const i = y * W + x; YR[i] = r; YV[i] = v; YNX[i] = nx; YNY[i] = ny; };
  // pelo: fios compridos caindo, mechas mais escuras entre eles, uma ponta clara aqui e ali
  const fur = (x, y, s) => { let v = (fbm(x / 1.1, y / 6, s, 3) - 0.5) * 0.8;
    // mechas em ponta, sobrepostas como escamas: cada uma clara no meio e com um vão escuro em V em volta
    const row = Math.floor(y / 9), ox = (row & 1) * 3.5, col = Math.floor((x + ox) / 7), jx = (h2(col, row, s) - 0.5) * 2.5, jy = h2(col, row, s + 1) * 3;
    const u = ((x + ox) - col * 7 - 3.5 - jx) / 3.5, w = (y - row * 9 - jy + 3) / 12, edge = Math.abs(u) - (1 - w) * 1.15;
    if (w > 0 && w < 1) { if (edge < -0.25) v += 0.5 - w * 0.6; else if (edge < 0.1) v -= 1.3; } return v; };
  // uma bola de pelo ou de pele; a forma vai na normal (a luz vem depois), a borda de baixo do pelo é desfiada em mechas
  const blob = (sx, sy, rx, ry, r, base, s, shaggy = true, f) => { const cxw = WX(sx), cyw = WY(sy), RX = rx * K, RY = ry * K;
    for (let y = Math.floor(cyw - RY - 6); y <= cyw + RY + 6; y++) for (let x = Math.floor(cxw - RX - 3); x <= cxw + RX + 3; x++) {
      const dx = (x + 0.5 - cxw) / RX, dy = (y + 0.5 - cyw) / RY, d = dx * dx + dy * dy;
      if (d > 1 + (shaggy ? Math.max(0, dy) * 0.5 * Math.pow(Math.sin(x * 0.9 + s + Math.sin(x * 0.37) * 2) * 0.5 + 0.5, 3) * (1 + dy) : 0)) continue;
      const k = Math.min(1, Math.sqrt(d));
      yput(x, y, r, base + 1.6 - d * 0.5 + (shaggy ? fur(x, y, s) * 0.9 : (fbm(x / 2, y / 2, s) - 0.5) * 0.8) + (f ? f(x, y, dx, dy) : 0), dx / Math.max(1, Math.sqrt(d)) * 0.95, dy / Math.max(1, Math.sqrt(d)) * 0.95); } };
  // um membro grosso ao longo de uma linha: primeiro um aro escuro (separa do pelo de trás), depois o membro
  const limb = (pts, r, base, s) => { const w = pts.map(([a, b]) => [WX(a), WY(b)]), R = r * K;
    const each = fn => { for (let i = 0; i < w.length - 1; i++) { const [ax, ay] = w[i], [bx, by] = w[i + 1], n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2); for (let q = 0; q <= n; q++) fn(ax + (bx - ax) * q / n, ay + (by - ay) * q / n); } };
    each((cx0, cy0) => { const rr = R + 1.5; for (let y = Math.floor(cy0 - rr); y <= cy0 + rr; y++) for (let x = Math.floor(cx0 - rr); x <= cx0 + rr; x++) if (Math.hypot(x + 0.5 - cx0, y + 0.5 - cy0) <= rr) yput(x, y, 0, 0.4, 0, 0); });
    each((cx0, cy0) => { for (let y = Math.floor(cy0 - R); y <= cy0 + R; y++) for (let x = Math.floor(cx0 - R); x <= cx0 + R; x++) { const dx = (x + 0.5 - cx0) / R, dy = (y + 0.5 - cy0) / R; if (dx * dx + dy * dy > 1) continue; yput(x, y, 0, base + 1.4 + fur(x, y, s) * 0.9, dx * 0.95, dy * 0.95); } }); };
  const yline = (ax, ay, bx, by, r, v, th = 2) => { const x0 = WX(ax), y0 = WY(ay), x1 = WX(bx), y1 = WY(by), n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2); for (let q = 0; q <= n; q++) { const t = q / n, X = x0 + (x1 - x0) * t, Y = y0 + (y1 - y0) * t, tt = typeof th === 'function' ? th(t) : th; for (let o = 0; o < tt; o++) yput(X + o - (tt >> 1), Y, r, typeof v === 'function' ? v(t, o / Math.max(1, tt - 1)) : v - o * 0.5, (o / Math.max(1, tt - 1) - 0.5) * 1.6, -0.3); } };
  const ydot = (sx, sy, r, v, n = Math.round(K)) => { for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) yput(Math.round(WX(sx) - n / 2) + i, Math.round(WY(sy)) + j, r, v, (i / Math.max(1, n - 1) - 0.5), (j / Math.max(1, n - 1) - 0.5)); };
  // pose 3: [ombro, cotovelo, punho] do braço de trás e do da frente, os dois punhos batendo no chão
  const low = 2, ARMS = [[[13, 14], [18, 21], [21, 30.5]], [[19, 14], [24, 21], [26, 30.5]]];
  limb(ARMS[0], 2.2, 1.6, 11);                                                   // braço de trás, na sombra
  blob(21, 30.5, 2.4, 2.2, 1, 1.6, 12, false);
  for (let k = -1; k <= 1; k++) for (let j = 0; j < 3; j++) ydot(21 + 2.4 + j * 0.5, 30.5 + k * 1.2, 3, 4.2 - j * 0.4, 2);   // garras de trás
  limb([[11, 25], [11, 31]], 2.4, 1.8, 13);                                      // perna de trás
  blob(11, 33, 3, 1.2, 1, 1.6, 14, false);
  blob(13, 22 + low * 0.5, 7.8, 7.4, 0, 2.4, 15, true, (x, y, dx, dy) => dx > 0.3 && dy > 0 ? -0.5 : 0);   // a barriga
  blob(15.5, 14 + low, 8.8, 7.6, 0, 2.9, 16, true, (x, y, dx, dy) => dy > 0.6 ? -0.6 : 0);                 // a corcova dos ombros
  limb([[16, 26], [16, 31]], 2.7, 2.4, 17);                                      // perna da frente (a barra do pelo cai por cima dela)
  for (let k = 0; k < 8; k++) { const x = 6.5 + k * 1.9, y = 28 + low * 0.5 + (k % 2); yline(x, y - 1.5, x - 0.4, y + 1.8, 0, t => 3.2 - t * 1.2, t => Math.max(1, Math.round((1 - t) * 6))); }   // a barra desgrenhada
  blob(17, 33, 3.4, 1.2, 1, 2.6, 18, false);
  for (let k = 0; k < 4; k++) ydot(17 + 1.6 + k * 0.9, 33.8, 3, 4.4, 2);       // unhas do pé
  // cristais de gelo crescendo nas costas do velho: prismas que brilham sozinhos
  const BACKC = [[9, 9, 5.5, 1.1], [12, 7.5, 7, 1.3], [15, 7, 6, 1.2], [18, 7.5, 4.5, 1], [10.5, 8.5, 3.5, 0.8]];
  for (const [bx, by, len, wd] of BACKC) { const x0 = WX(bx), y0 = WY(by + low) + 3, ang = -0.25 + (bx - 13) * 0.04, ux = Math.sin(ang), uy = -Math.cos(ang), L2 = len * K, WD = wd * K * 0.7;
    for (let y = Math.floor(y0 - L2 - 2); y <= y0 + 2; y++) for (let x = Math.floor(x0 - L2); x <= x0 + L2; x++) { const px = x + 0.5 - x0, py = y + 0.5 - y0, al = px * ux + py * uy, pe = px * -uy + py * ux; if (al < 0 || al > L2) continue; const ww = WD * Math.min(1, (L2 - al) / (WD * 1.4)); if (Math.abs(pe) > ww) continue;
      yput(x, y, 5, (pe < -ww * 0.3 ? 5 : pe > ww * 0.3 ? 2.8 : 6.2) - (al < 3 ? 1.8 : 0) + (al > L2 - 2 ? 0.5 : 0) + (Math.abs(pe + al * 0.1) < 0.4 ? 0.8 : 0), 0, 0); } }
  // cabeça: baixa, na frente da corcova, a cara escura e pelada sob uma franja de pelo
  const hx = 24, hy = 15;
  // chifres do ancestral: saem de trás da cabeça, curvam para trás e para cima
  const HORN = (t, o) => 2.4 + t * 2.6 + (o < 0.4 ? 1.4 : 0) - (Math.floor(t * 7) % 2 && t < 0.7 ? 0.6 : 0);
  yline(hx - 2, hy - 3, hx - 5, hy - 7, 3, HORN, t => Math.round(6 - t * 2)); yline(hx - 5, hy - 7, hx - 3, hy - 9, 3, (t, o) => 4.8 + t * 1.2 + (o < 0.4 ? 0.6 : 0), t => Math.round(4 - t * 3));
  yline(hx + 0.5, hy - 4, hx + 0.5, hy - 8, 3, HORN, t => Math.round(6 - t * 2)); yline(hx + 0.5, hy - 8, hx + 2.5, hy - 9.5, 3, (t, o) => 4.8 + t * 1.2 + (o < 0.4 ? 0.6 : 0), t => Math.round(4 - t * 3));
  limb(ARMS[1], 2.8, 2.7, 19);                                                   // braço da frente, comprido e grosso
  blob(26, 30.5, 3, 2.7, 1, 3, 20, false, (x, y) => ((x * 2 + y) % 7 === 0 ? -0.8 : 0));   // o punho escuro no chão
  for (let k = -1; k <= 1; k++) for (let j = 0; j < 4; j++) ydot(26 + 2.6 + j * 0.45, 30.5 + k * 1.2 + j * 0.15, 3, 5.2 - j * 0.35, 3);   // garras de osso
  blob(hx, hy, 4.6, 4.4, 0, 3.2, 21, true);
  blob(hx + 1.8, hy + 1, 3.3, 3.1, 1, 3.2, 22, false, (x, y, dx, dy) => (dy > 0.2 && dy < 0.35 && Math.abs(dx) < 0.5 ? -0.8 : 0) + (dx < -0.6 ? -0.6 : 0));   // a cara
  { const fcx = WX(hx + 1.8), fcy = WY(hy + 1), frx = 3.3 * K, fry = 3.1 * K; for (let X = Math.round(fcx - frx - 1); X <= fcx + frx + 1; X++) { const q = cl((X + 0.5 - fcx) / frx, -1, 1), top = fcy - fry * Math.sqrt(1 - q * q), n = 4 + Math.floor(h2(X, 1, 101) * 4) + (h2(X, 2, 101) < 0.25 ? 3 : 0) - Math.round(Math.abs(q) * 3); for (let j = -4; j < n; j++) yput(X, Math.round(top) + j, 0, 4.2 - Math.max(0, j) * 0.25 + (h2(X, j, 103) < 0.15 ? 0.6 : 0), q * 0.4, j < 0 ? -0.8 : -0.2); } }   // a franja pesada caindo sobre a testa
  ydot(hx + 1, hy - 1, 1, 0.4, 4); ydot(hx + 2.6, hy - 1, 1, 0.4, 4); ydot(hx + 1.8, hy - 1.1, 1, 0.6, 3);   // a testa funda
  ydot(hx + 2.6, hy + 0.9, 1, 0.3, 2); ydot(hx + 3.5, hy + 0.9, 1, 0.3, 2);    // as narinas
  const EYES = [];
  for (const [ex, v] of [[hx + 1.2, 5.6], [hx + 3.2, 4.8]]) { ydot(ex, hy - 0.2, 2, v, 4); ydot(ex - 0.2, hy - 0.2, 2, 6.6, 2); EYES.push([Math.round(WX(ex)), Math.round(WY(hy - 0.2)) + 2]); }
  // a boca aberta rugindo, com presas
  { const mx0 = WX(hx + 3.6), mx1 = WX(hx - 0.2), my = WY(hy + 1.8); for (let x = Math.round(mx0); x <= mx1; x++) { const u = (x - mx0) / (mx1 - mx0), hgt = 3 + Math.sin(u * Math.PI) * 8; for (let j = 0; j < hgt; j++) yput(x, my + j, 4, (j < 2 ? 3.2 : 2) - j * 0.12 + (j > hgt - 3 && u > 0.3 && u < 0.7 ? 1.6 : 0), 0, 0); } }   // a goela e a língua
  for (const [fx0, fy0, l] of [[hx + 0.5, hy + 1.8, 5], [hx + 3, hy + 1.8, 5], [hx + 1.6, hy + 1.8, 3], [hx + 0.6, hy + 4, -5], [hx + 2.6, hy + 4, -5]]) for (let j = 0; j < Math.abs(l); j++) { const X = Math.round(WX(fx0)), Y = Math.round(WY(fy0)) + (l > 0 ? j : -j); const w = Math.abs(l) - j > 2 ? 2 : 1; for (let o = 0; o < w; o++) yput(X - o, Y, 3, 6 - j * 0.3 - o * 0.8, 0, 0); }
  const MOUTH = [Math.round(WX(hx + 3.6)), Math.round(WY(hy + 2.6))];
  // fios de pelo por cima de tudo: traços curtos caindo, claros, cada um com a sombra do lado
  for (let gy = 0; gy < H; gy += 4) for (let gx = 0; gx < W; gx += 3) { const x0 = gx + Math.floor(h2(gx, gy, 97) * 3), y0 = gy + Math.floor(h2(gx, gy, 98) * 4); if (!inb(x0, y0) || YR[y0 * W + x0] !== 0) continue;
    const L = 3 + Math.floor(h2(gx, gy, 99) * 5), lean = (YNX[y0 * W + x0] * 0.5 + (h2(gx, gy, 100) - 0.5) * 0.4);
    for (let j = 0; j < L; j++) { const X = Math.round(x0 + lean * j), Y = y0 + j; if (!inb(X + 1, Y) || YR[Y * W + X] !== 0) break; YV[Y * W + X] += 0.9 * (1 - j / L) + 0.2; if (YR[Y * W + X + 1] === 0) YV[Y * W + X + 1] -= 0.8; } }
  // pintar: albedo pela rampa, forma pela normal; a tocha acende o lado esquerdo e quente, os cristais o lado direito e frio
  const OUT = C('#06090e');
  const COLDL = [[HANG.x, HANG.y + 30, 1.0, 90], [GEODE.x, GEODE.y - 10, 1.0, 80], [FALL.x, 150, 0.5, 70], [WX(13), WY(2), 0.6, 60]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, r = YR[i]; if (r < 0) { if ((x > 0 && YR[i - 1] >= 0) || (x < W - 1 && YR[i + 1] >= 0) || (y > 0 && YR[i - W] >= 0) || (y < H - 1 && YR[i + W] >= 0)) { put(x, y, OUT); N[i] = 5; } continue; }
    const R = RAMPS[r], v = YV[i];
    if (r === 5 || r === 2) { put(x, y, rp(R, v / 6 * 0.95, x, y)); N[i] = 7; continue; }   // os cristais e os olhos têm luz própria
    const nx = YNX[i], ny = YNY[i], nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
    const dif = (lx, ly, lz) => { const m = Math.hypot(lx, ly, lz); return Math.max(0, (nx * lx + ny * ly + nz * lz) / m); };
    const wm = warmAt(x, y, 190), dT = Math.pow(dif(TORCH.x - x, TORCH.y - y, 30), 1.6);
    let cold = 0; for (const [lx, ly, s, rr] of COLDL) { const d = Math.hypot(x - lx, y - ly); if (d < rr) cold += Math.pow(dif(lx - x, ly - y, 10), 3) * Math.pow(1 - d / rr, 1.2) * s; }
    const top = Math.max(0, -ny) * 0.12;                                          // um pouco do frio do salão por cima
    const lw = dT * wm * 3.6, lc2 = cold * 2.2 + top * 1.5;
    let c = rp(R, v / 6 * cl(0.1 + lw + lc2, 0, 1.25), x, y);
    const tw = cl(lw / (lw + lc2 + 0.05), 0, 1);                                    // matiz: quente onde a tocha manda, frio onde os cristais mandam
    c = mix(c, [c[0] * 1.35 + 10, c[1] * 1.05, c[2] * 0.7], qa(tw * 0.8, x, y, 4));
    c = mix(c, [c[0] * 0.8, c[1] * 1.02, c[2] * 1.15 + 6], qa((1 - tw) * Math.min(1, lc2 * 3), x, y, 4));
    put(x, y, c); N[i] = 5;
  }
  // a sombra dele na neve e as rachaduras onde os punhos bateram
  for (let x = WX(28); x < WX(4); x++) { const y = Math.round(yFloor(x)) + 1; for (let j = 0; j < 3; j++) if (M(x, y + j) === 2 && YR[(y + j) * W + x] < 0) blend(x, y + j, C('#04070d'), 0.55 - j * 0.15); }
  for (const fxw of [WX(26) - 6, WX(21) - 6]) { const fy = Math.round(yFloor(fxw)) + 1; for (let k = 0; k < 7; k++) { let x = fxw, y = fy; const dir = k < 3 ? -1 : k < 6 ? 1 : -1, n = 6 + h2(k, 1, 91) * 10; for (let j = 0; j < n; j++) { x += dir * (1 + (h2(k, j, 93) > 0.6 ? 1 : 0)); y += h2(k, j, 95) > 0.7 ? 1 : 0; if (M(x, y) !== 2 || YR[y * W + x] >= 0) continue; const L = lightAt(x, y); put(x, y, mix(get(x, y), C(j < 3 ? '#d2e8f4' : '#7f9cb2'), cl(0.3 + (L ? L.a : 0), 0, 0.8))); } } }

  /* ---------- o herói, na laje de neve, tocha erguida ---------- */
  const HK = [ // o herói já com elmo e peitoral de ferro, gola de pele e escudo nas costas
    '...jjjj.......',
    '..jiiiiij.....',
    '.jiIIIiiij....',
    '.jiiiiiiij..t.',
    '.jjjjjsWe...t.',
    '..hjhsssss..t.',
    '...jhsssms.ss.',
    '....hssss.iI..',
    '..uuuuuuu.ij..',
    'SjiuuuuuuR....',
    'SjiiIIiiir....',
    'SjjiIIiirr....',
    'SjjiiiiiRr....',
    'SbbbbbbbkR....',
    'S.jrrrjrrr....',
    '..rrrrrrrr....',
    '.rrrrrrrrrr...',
    '.rrrrrrrrrr...',
    '..jiij.jij....',
    '..jIj...Ij....',
    '..jij...ij....',
    '.fff....fff...'];
  const HC = { h: '#4e2c1a', s: '#e2a982', W: '#f2ead8', e: '#1c1422', m: '#a5604a', n: '#8a6a48', r: '#6e5a44', b: '#3a2618', k: '#c8a050', p: '#4b3b33', f: '#2a1c14', t: '#5a3a1e', i: '#8a929c', I: '#d2dae2', j: '#4a5058', u: '#c8b898', R: '#7a6050', S: '#5a3a24' };
  for (let j = 0; j < HK.length; j++) for (let i = 0; i < HK[j].length; i++) { const ch = HK[j][i]; if (!HC[ch]) continue;
    let c = C(HC[ch]); const X = HERO.x + i, Y = HERO.y + j;
    if (ch !== 'W' && ch !== 'e') { const lx = (i - 4) / 10, up = (21 - j) / 21; c = mix(c, lx > 0.2 || up > 0.7 ? C('#ffc888') : C('#160e10'), lx > 0.2 || up > 0.7 ? cl(lx * 0.3 + up * 0.15, 0, 0.35) : 0.4); }
    if (ch === 'h' && (i + j) % 4 === 0) c = mix(c, C('#2a160c'), 0.4);
    if (i < 3 && ch !== 'W' && ch !== 'e') c = mix(c, C('#6a9ac8'), 0.12);       // o frio azul pelas costas
    put(X, Y, c); N[Y * W + X] = 6; }
  iceBlock();
  // sombra comprida na neve, para trás
  for (let x = HERO.x - 26; x < HERO.x + 2; x++) { const y = Math.round(yLedge(x)) + 1; if (M(x, y) === 2) blend(x, y, C('#0a1220'), 0.6 * (1 - (HERO.x + 2 - x) / 30)); }

  /* ---------- longe da luz, tudo some no escuro; a esquerda fica para o nome e o menu ---------- */
  const DARK = C('#020408');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = N[y * W + x]; if (n === 6) continue;
    const L = lightAt(x, y); const lit = (L ? L.a : 0) + (n === 0 ? 0.3 : n === 1 ? 0.22 : n === 5 ? 0.3 : n === 7 ? 0.32 : n === 3 ? 0.15 : 0.08);
    const left = cl((165 - x) / 150, 0, 1) * 0.55;
    const dk = cl(0.7 - lit * 2.3 + left, 0, 0.92);
    if (dk > 0) put(x, y, mix(get(x, y), DARK, qa(dk, x, y, 8)));
  }
  /* ---------- grão e vinheta ---------- */
  const VIG = C('#010205');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - W * 0.6) / (W * 0.6), ny = (y - H * 0.45) / (H * 0.68), d = Math.hypot(nx, ny);
    let c = get(x, y); const g = (h2(x, y, 999) - 0.5) * 8; c = [c[0] + g, c[1] + g, c[2] + g];
    const v = cl((d - 0.6) / 0.6, 0, 1) * 0.75; if (v > 0) c = mix(c, VIG, qa(v, x, y, 5));
    put(x, y, [cl(c[0], 0, 255), cl(c[1], 0, 255), cl(c[2], 0, 255)]);
  }
  // lugares onde o gelo pode cintilar (escolhidos agora, para o frame não ler pixels)
  const GLINTS = [];
  for (let n = 0; n < 4000 && GLINTS.length < 40; n++) { const x = (h2(n, 1, 81) * W) | 0, y = (h2(n, 2, 81) * H) | 0; if (x < 180 || M(x, y) !== 7 && !(M(x, y) === 2 && y > ground(x) - 1 && y < ground(x) + 4)) continue; const L = lightAt(x, y); if (!L || L.a < 0.15) continue; GLINTS.push([x, y, h2(n, 3, 81) * 10, 2 + h2(n, 4, 81) * 3]); }
  cx.putImageData(img, 0, 0);

  /* ---------- o que mexe ---------- */
  const mkGlow = (r, rgb, k) => { const s = r * 2 + 4, g = document.createElement('canvas'); g.width = s; g.height = s; const x = g.getContext('2d');
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { const d = Math.hypot(i - s / 2, j - s / 2) / r; const a = qa(cl(1 - d, 0, 1), i, j, 4); if (a > 0) { x.fillStyle = `rgba(${rgb},${a * k})`; x.fillRect(i, j, 1, 1); } } return g; };
  const glow = mkGlow(30, '255,160,70', 0.06), eyeG = mkGlow(5, '143,220,255', 0.45);
  const FL = ['#fff4c0', '#ffd27a', '#f39a3a', '#d0601e', '#8a2e10'];
  const motes = [], puffs = [];
  let blinkAt = 3, puffT = 0;
  function frame(fx, t, dt) {
    // chama da tocha
    const tx = TORCH.x, ty = TORCH.y;
    fx.globalAlpha = 0.8 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.1; fx.drawImage(glow, tx - 32, ty - 32); fx.globalAlpha = 1;
    for (let j = 0; j < 5; j++) { const w = j < 1 ? 1 : j < 3 ? 2 : 1, sway = Math.round(Math.sin(t * 7 + j) * (j / 4) * 1.2); fx.fillStyle = FL[Math.min(4, j + (Math.sin(t * 15 + j * 2) > 0.5 ? 1 : 0))]; fx.fillRect(tx - (w > 1 ? 1 : 0) + sway, ty - j, w, 1); }
    if (Math.random() < dt * 6) motes.push({ x: tx + (Math.random() - 0.5) * 2, y: ty - 4, vx: (Math.random() - 0.5) * 6, vy: -(8 + Math.random() * 10), t: 0, life: 0.6 + Math.random() * 0.8, spark: true });
    // pó de gelo descendo devagar do teto
    if (motes.length < 44 && Math.random() < dt * 9) { const x = 190 + Math.random() * 290; motes.push({ x, y: yCeil(x) + Math.random() * 20, vx: -2 + Math.random() * 3, vy: 5 + Math.random() * 6, t: 0, life: 7 + Math.random() * 6 }); }
    for (let i = motes.length - 1; i >= 0; i--) { const m = motes[i]; m.t += dt; if (m.t > m.life || m.y > 236) { motes.splice(i, 1); continue; } m.x += (m.vx + Math.sin(m.t * 1.3 + i) * 2.5) * dt; m.y += m.vy * dt;
      const f = m.t / m.life; let a; if (m.spark) a = 1 - f; else { const L = lightAt(m.x | 0, m.y | 0); a = Math.sin(f * Math.PI) * cl((L ? L.a : 0) * 1.1, 0.06, 0.6); }
      fx.globalAlpha = a; fx.fillStyle = m.spark ? FL[Math.min(4, (f * 5) | 0)] : '#e4f2fc'; fx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); }
    fx.globalAlpha = 1;
    // brilhos piscando no gelo e na neve
    for (const [x, y, ph, sp] of GLINTS) { const k = Math.sin(t * sp + ph); if (k < 0.93) continue; const a = (k - 0.93) / 0.07; fx.globalAlpha = a; fx.fillStyle = '#ffffff'; fx.fillRect(x, y, 1, 1); if (a > 0.6) { fx.globalAlpha = a * 0.5; fx.fillStyle = '#b8e0f4'; fx.fillRect(x - 1, y, 1, 1); fx.fillRect(x + 1, y, 1, 1); fx.fillRect(x, y - 1, 1, 1); fx.fillRect(x, y + 1, 1, 1); } }
    fx.globalAlpha = 1;
    // os olhos do Yeti: um brilho azul que pulsa devagar, e uma piscada de vez em quando
    if (t > blinkAt + 0.18) blinkAt = t + 3 + Math.random() * 5;
    if (!(t > blinkAt && t < blinkAt + 0.18)) { const a = 0.55 + Math.sin(t * 1.1) * 0.25; for (const [ex, ey] of EYES) { fx.globalAlpha = a; fx.drawImage(eyeG, ex - 7, ey - 7); fx.globalAlpha = Math.min(1, a + 0.3); fx.fillStyle = '#eafcff'; fx.fillRect(ex - 1, ey - 1, 1, 1); } fx.globalAlpha = 1; }
    // o bafo do rugido no frio: nuvenzinhas pálidas saindo da boca para a esquerda
    puffT -= dt; if (puffT <= 0) { puffT = 0.12 + Math.random() * 0.1; if (Math.sin(t * 0.8) > -0.2) puffs.push({ x: MOUTH[0] - 2, y: MOUTH[1] + Math.random() * 4, vx: -(14 + Math.random() * 10), vy: (Math.random() - 0.6) * 5, t: 0, life: 1.4 + Math.random() }); }
    for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.t += dt; if (p.t > p.life) { puffs.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 0.8;
      const f = p.t / p.life, r = 1 + f * 4; fx.globalAlpha = (1 - f) * 0.35; fx.fillStyle = '#d6f0fc'; for (let k = 0; k < 4; k++) fx.fillRect(Math.round(p.x + Math.cos(k * 1.7 + i) * r), Math.round(p.y + Math.sin(k * 2.3 + i) * r * 0.5), 1, 1); }
    fx.globalAlpha = 1;
  }
  return { canvas: cv, frame };
}
var TITLE_ARTS = TITLE_ARTS || []; TITLE_ARTS.push(paintTitleArtGelo);
