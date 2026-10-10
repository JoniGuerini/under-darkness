'use strict';
/* arte da tela de título: As Minas Fúngicas. A Gruta da Mãe, no Coração do Micélio: uma caverna alagada que o fungo
   tomou. Na parede do fundo, ocupando todo o lado direito, a Mãe-Esporo: a massa de carne rosada em caroços, os
   cordões de micélio creme e cinza correndo para ela de todos os lados, placas de esporita cravadas, cogumelos e
   bolsas de esporos na borda, três bulbos abertos brilhando em ciano, e no meio a primeira colona de Ferroalto, de
   braços abertos, comida pelos fios, o peito costurado com a luz lá dentro. Chapéus de cogumelo gigante saem da
   água (as lamelas acendem por baixo), cordões descem do teto, cachos de esporos brilham verdes na rocha. O herói,
   no chapéu mais perto, ergue a tocha e olha para ela. A água escura espelha tudo. A esquerda fica escura.
   Pintada uma vez (480x270, 39-titulo sorteia entre as artes de TITLE_ARTS). Por quadro mexem só coisas pequenas:
   a chama da tocha, os esporos subindo da massa, os bulbos e o peito pulsando, gotas caindo dos estalactites na
   água e uma mariposa-esporo rodando a tocha. */
function paintTitleArtFungo() {
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
  const N = new Uint8Array(W * H);   // o que está em cada pixel: 0 fundo, 1 plano distante, 2 rocha, 3 água, 5 a Mãe, 6 herói, 7 cogumelos/cordões
  const M = (x, y) => inb(x, y) ? N[y * W + x] : 2;
  const nz = (x, y, sc, s) => vn(x / sc, y / sc, s) - 0.5;                 // como o nz do 126: -0,5..0,5
  const cg = (x, y, s) => h2(x | 0, y | 0, s) - 0.5;                         // grão por pixel
  const VC = { d1: 0, d2: 0, id: 0, ox: 0, oy: 0, cx: 0, cy: 0 };
  const vor = (x, y, cs, s) => { const gx = Math.floor(x / cs), gy = Math.floor(y / cs); let d1 = 1e9, d2 = 1e9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const qx = gx + i, qy = gy + j, px = (qx + h2(qx, qy, s)) * cs, py = (qy + h2(qx, qy, s + 1)) * cs, d = Math.hypot(x - px, y - py);
      if (d < d1) { d2 = d1; d1 = d; VC.id = h2(qx, qy, s + 2); VC.ox = x - px; VC.oy = y - py; VC.cx = px; VC.cy = py; } else if (d < d2) d2 = d; }
    VC.d1 = d1; VC.d2 = d2; return VC; };

  /* ---------- palcos: teto, rocha da esquerda, água, os chapéus ---------- */
  const WL = 214;                                                              // a linha da água
  const yCeil = x => 15 + (fbm(x / 24, 1, 3) - 0.5) * 14 + Math.max(0, 160 - x) * 0.42 - Math.max(0, x - 400) * 0.05;
  const colL = y => 64 + (fbm(y / 18, 5, 11) - 0.5) * 22 + Math.max(0, 80 - y) * 0.8 + Math.max(0, y - 190) * 0.9;
  // estalactites fúngicas: rocha tomada pingando (x, comprimento, largura)
  const STAL = [[148, 46, 5], [166, 24, 3], [184, 14, 2], [226, 26, 3], [240, 14, 2], [298, 12, 2], [404, 16, 2], [468, 22, 3], [128, 30, 4]];
  const stalAt = (x, y) => { for (const [sx, len, w] of STAL) { const top = yCeil(sx) - 2, k = (y - top) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx + Math.sin(k * 3) * 1.2) <= w * Math.pow(1 - k, 0.8) + 0.3) return true; } return false; };
  const rockAt = (x, y) => y < yCeil(x) || x < colL(y) || stalAt(x, y) || (y > 236 && x < 96 + (fbm(y / 9, 7, 13) - 0.5) * 10);

  // a Mãe-Esporo: a arte da parede do 126 (480 x 288, o peito em 240,120), pintada aqui em escala S
  const S = 0.68, OX = 358 - 240 * S, OY = 101 - 120 * S;
  const tx = u => OX + u * S, ty = v => OY + v * S;
  // os chapéus de cogumelo gigante saindo da água (centro, topo, raio): o primeiro é o do herói
  const CAPS = [[176, 192, 20], [242, 205, 12], [302, 196, 9], [428, 202, 15], [474, 194, 9]];

  /* ---------- luzes ---------- */
  const HERO = { x: 169, y: 0 };
  const capTop = (k, x) => { const [c, t, r] = CAPS[k], d = (x - c) / r; return t + d * d * r * 0.5; };
  HERO.y = Math.round(capTop(0, HERO.x + 6)) - 22;
  const TORCH = { x: HERO.x + 13, y: HERO.y + 1 };
  const BULBS = [[156, 96], [408, 156], [96, 246]].map(([u, v]) => [tx(u), ty(v)]);   // três dos seis bulbos, abertos
  const CHEST = [tx(240), ty(118)];
  const SPC = [[206, 30], [286, 20], [452, 26], [140, 66], [330, 16]].map(([x]) => [x, Math.round(yCeil(x)) + 1]);   // cachos de esporos no teto
  const lights = [
    { x: TORCH.x, y: TORCH.y, r: 120, c: C('#ffa850'), s: 1.3 },
    { x: CHEST[0], y: CHEST[1], r: 80, c: C('#6ad4b4'), s: 0.55 },
    ...BULBS.map(([x, y]) => ({ x, y, r: 46, c: C('#5ae0d0'), s: 0.75 })),
    ...CAPS.map(([x, t, r]) => ({ x, y: t + r * 0.55 + 3, r: r * 2.6, c: C('#4ad8c8'), s: 0.5 })),
    ...SPC.map(([x, y]) => ({ x, y: y + 2, r: 26, c: C('#7ad860'), s: 0.45 })),
    { x: 352, y: 130, r: 150, c: C('#5a8a88'), s: 0.1 },                     // o brilho fraco da massa inteira
  ];
  const lightAt = (x, y) => { let a = 0, r = 0, g = 0, b = 0;
    for (const L of lights) { const d = Math.hypot(x - L.x, (y - L.y) * 1.1); if (d >= L.r) continue; const f = Math.pow(1 - d / L.r, 1.5) * L.s; a += f; r += L.c[0] * f; g += L.c[1] * f; b += L.c[2] * f; }
    return a > 0 ? { a, c: [r / a, g / a, b / a] } : null; };

  /* ---------- fundo: a parede da gruta, escura; o Bosque de Chapéus lá atrás, na névoa de esporos ---------- */
  const BACK = P(['#06080a', '#0b1013', '#11181c', '#172126', '#1e2b31', '#26363c', '#30434a']);
  const FAR = P(['#03070a', '#050d10', '#081418', '#0c1e22', '#12303a', '#1a4a50']);
  const farAt = (x, y) => {   // silhuetas de cogumelos gigantes ao longe: caule e chapéu
    if (y > WL - 18 + (fbm(x / 30, 8, 17) - 0.5) * 8) return 2;
    for (let i = 0; i < 6; i++) { const sx = 80 + i * 56 + h2(i, 1, 19) * 26, top = 120 + h2(i, 2, 19) * 50, r = 10 + h2(i, 3, 19) * 14;
      const dx = (x - sx) / r, dy = (y - top) / (r * 0.5); if (dy < 1 && dy > -1 && dx * dx + dy * dy < 1 && dy < 0.4) return y > top + r * 0.1 ? 3 : 1;   // 3: as lamelas
      if (y > top && Math.abs(x - sx - Math.sin(y / 20 + i) * 2) < r * 0.16 + (y - top) * 0.02) return 1; }
    return 0;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const L = lightAt(x, y), f = farAt(x, y);
    let c;
    if (f) { N[y * W + x] = 1; c = rp(FAR, 0.3 + (fbm(x / 5, y / 4, 23) - 0.5) * 0.4 + (L ? L.a * 0.25 : 0) + (f === 3 ? 0.35 : 0), x, y); }
    else { const haze = Math.exp(-Math.hypot((x - 250) / 1.5, y - 160) / 90); c = rp(BACK, 0.12 + haze * 0.5 + (fbm(x / 8, y / 6, 25) - 0.5) * 0.3 + (L ? L.a * 0.22 : 0), x, y); }
    const fog = Math.exp(-Math.pow((y - 186) / 34, 2)) * (0.3 + fbm(x / 40, y / 10, 27) * 0.5);   // névoa de esporos baixa, sobre a água
    c = mix(c, C('#1e2e2c'), qa(fog * 0.55, x, y, 5));
    put(x, y, c);
  }

  /* ---------- a Mãe-Esporo: carne, cordões, veias, poros, placas de esporita, cogumelos, bolsas, cicatrizes ---------- */
  const RAMPS = [];
  const R6 = a => { const r = P(a); r.k = RAMPS.length; RAMPS.push(r); return r; };
  const Q = {   // PAL.vivo do 126
    carne: R6(['#2a1a20', '#4a2c34', '#74464e', '#a0686c', '#c89490', '#ecc8bc']),
    veia: R6(['#2a141c', '#4a2230', '#6e3442', '#8a4a58', '#b87480', '#d8a0a4']),
    myc: R6(['#2e2a22', '#4a4436', '#7a705a', '#a89c7e', '#cabf9c', '#e2d8b6']),
    tom: R6(['#1a2024', '#2e383a', '#4a5652', '#74807a', '#a8b2a6', '#d8e0d0']),
    esp: R6(['#0c2a2a', '#145048', '#1e7a6a', '#34a890', '#6ad4b4', '#c8fce8']),
    chap: R6(['#0e2a2e', '#16444a', '#1e6a6e', '#3a9a94', '#7accc0', '#c4f4e6']),
    tron: R6(['#2a2a26', '#48463e', '#6e6a5c', '#9a9480', '#c4bca2', '#e6dec4']),
    sac: R6(['#1a1912', '#33311f', '#524f30', '#7a7648', '#a39e6a', '#ccc496']),
    pele: R6(['#2a1e1a', '#4a3630', '#6e5448', '#927262', '#b2927c', '#ccb09a']),
    roupa: R6(['#1a1418', '#2c2228', '#40323a', '#564450', '#6c5864', '#84707a']),
    avental: R6(['#1c1c18', '#302e28', '#48453c', '#626052', '#7c796a', '#969282']),
    cabelo: R6(['#100a08', '#1c130e', '#2a1d15', '#3a291d', '#4c3726', '#5e4632'])
  };
  const BR = new Int8Array(W * H).fill(-1), BV = new Float32Array(W * H), HM = new Uint8Array(W * H);
  let marking = false, over = null;
  const bput = (X, Y, R, v, u, w) => { X |= 0; Y |= 0; if (!inb(X, Y)) return; if (over) { const o = over(u, w, R, v); R = o[0]; v = o[1]; } const i = Y * W + X; BR[i] = R.k; BV[i] = v; if (marking) HM[i] = 1; N[i] = 5; };
  const wput = (u, v, R, val) => bput(Math.floor(tx(u)), Math.floor(ty(v)), R, val, u, v);
  const has = (u, v) => { const X = Math.floor(tx(u)), Y = Math.floor(ty(v)); return inb(X, Y) && BR[Y * W + X] >= 0; };
  // pincéis em coordenadas da parede, pintados pixel a pixel da tela
  const box = (u0, v0, u1, v1, fn) => { for (let Y = Math.floor(ty(v0)); Y <= Math.ceil(ty(v1)); Y++) for (let X = Math.floor(tx(u0)); X <= Math.ceil(tx(u1)); X++) fn(X, Y, (X + 0.5 - OX) / S, (Y + 0.5 - OY) / S); };
  const blob = (bx, by, rx, ry, R, s, base = 2.6, f) => { rx = Math.max(rx, 0.7 / S); ry = Math.max(ry, 0.7 / S);
    box(bx - rx, by - ry, bx + rx, by + ry, (X, Y, u, v) => { const dx = (u - bx) / rx, dy = (v - by) / ry, d = dx * dx + dy * dy; if (d > 1) return; const e = f ? f(u, v, dx, dy) : 0; if (e === null) return; bput(X, Y, R, base + 1.2 - (dx * 0.8 + dy) * 1.3 - d * 0.7 + cg(X, Y, s) * 0.5 + e, u, v); }); };
  const tube = (ax, ay, bx, by, r0, r1, R, s, base = 2.4, f) => { r0 = Math.max(r0, 0.6 / S); r1 = Math.max(r1, 0.6 / S); const m = Math.max(r0, r1) + 1, vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
    box(Math.min(ax, bx) - m, Math.min(ay, by) - m, Math.max(ax, bx) + m, Math.max(ay, by) + m, (X, Y, u, v) => { const t = cl(((u - ax) * vx + (v - ay) * vy) / L2, 0, 1), qx = ax + vx * t, qy = ay + vy * t, r = r0 + (r1 - r0) * t;
      const nx = (u - qx) / r, ny = (v - qy) / r, d = nx * nx + ny * ny; if (d > 1) return; const e = f ? f(u, v, t, nx, ny) : 0; if (e === null) return; bput(X, Y, R, base + 0.9 - (nx * 0.8 + ny) * 1.4 - d * 0.8 + cg(X, Y, s) * 0.5 + e, u, v); }); };
  const MCX = 240, MCY = 120;
  const mass = (x, y) => { const dx = (x - MCX) / 230, dy = (y - 170) / (y < 170 ? 164 : 120); let d = dx * dx + dy * dy; const fl = Math.max(0, (y - 210) / 78); d -= fl * fl * 1.1;
    d += nz(x, y, 56, 7101) * 0.62 + nz(x, y, 20, 7102) * 0.26 + nz(x, y, 7, 7103) * 0.07; return 1 - d; };
  const SD = 7200;
  for (let Y = Math.floor(ty(0)); Y < Math.min(H, ty(288)); Y++) for (let X = Math.floor(tx(0)); X < W; X++) {
    const x = (X + 0.5 - OX) / S, y = (Y + 0.5 - OY) / S; if (x > 480) continue;
    const m = mass(x, y);
    const a = Math.atan2(y - MCY, x - MCX), r = Math.hypot(x - MCX, (y - MCY) * 1.15);
    // os cordões: faixas de ângulo em volta dela, partidas no comprimento (engrossados um pouco: aqui ela é menor)
    const NB = 20, band = a * NB / Math.PI + nz(x, y, 70, 7104) * 2.6 + nz(x, y, 22, 7114) * 0.7 + Math.sin(r * 0.05 + a * 3) * 0.25, bi = Math.round(band);
    const ov = nz(bi * 300 + 17, r, 34, 7106) - (r < 120 ? -0.32 : -0.06), tap = cl(ov * 7, 0, 1);
    const bpx = Math.max(1, r * Math.PI / NB), hw = cl(3.6 - r / 110, 1.3, 3.4) * (0.7 + 0.6 * h2(bi, 3, 7105)) * (0.35 + 0.65 * tap) * 1.45, f = (band - bi) * bpx / hw;
    const cord = r > 50 && Math.abs(f) < 1 && ov > 0 && h2(bi, 9, 7115) < 0.8;
    if (m <= 0) {   // fios passando da borda por cima da parede nua
      if (cord && m > -0.28 && Math.abs(f) < 0.5 + (1 + m * 3) * 0.5) { const L = (Math.sin(a) - Math.cos(a)) * 0.7; bput(X, Y, Q.myc, 2.6 + f * L * 1.4 - f * f * 0.8 + cg(X, Y, SD) * 0.5 + m * 3, x, y); }
      continue;
    }
    let R = Q.carne, v;
    const c = vor(x + nz(x, y, 18, SD + 5) * 10, y + nz(x, y, 18, SD + 6) * 10, 15, SD + 1), e = c.d2 - c.d1, rr = c.d1 / (c.d1 + c.d2) * 2;
    v = 2.9 - (c.ox + c.oy) / 14 * 1.1 - rr * rr * 1.3 + nz(x, y, 30, SD + 2) * 0.9 + cg(X, Y, SD + 3) * 0.55;
    if (e < 1.5) v -= 1.0;                                                     // o vinco entre os caroços
    v += -(x - MCX) / 480 * 0.8 - (y - 140) / 288 * 0.9;
    v -= Math.max(0, 0.3 - m) * 4;
    if (r < 90) v -= (90 - r) / 90 * 0.6;
    const vv = Math.abs(nz(x, y, 26, SD + 7));
    if (vv < 0.012 && !cord) { R = Q.veia; v = vv < 0.006 ? 1.4 : 2.4; } else if (vv < 0.02 && !cord) v -= 0.6;
    const p = vor(x + 500, y, 9, SD + 9);
    if (!cord && p.id < 0.1 && p.d1 < 2) v = p.oy < 0 ? 0.6 : v + 0.6;
    if (cord) { const L = (Math.sin(a) - Math.cos(a)) * 0.7; R = h2(bi, 5, 7109) < 0.25 ? Q.tom : Q.myc; v = 3.0 + f * L * 1.5 - f * f * 1.1 + cg(X, Y, SD + 4) * 0.5 - Math.max(0, 0.3 - m) * 3 + (Math.sin(r * 0.55 + bi) > 0.8 ? -0.7 : 0); }
    const q = vor(x + 900, y + 300, 30, SD + 11);
    if (q.id < 0.16 && !cord && m > 0.12) { const sz = 3 + q.id * 22, ax = Math.abs(q.ox), ay = Math.abs(q.oy);
      if (ax * 0.7 + ay < sz && ax < sz * 1.1) { R = Q.esp; v = 3.2 - (q.ox + q.oy) / sz * 1.1 + cg(X, Y, SD + 12) * 0.4; if (ax * 0.7 + ay > sz - 1.6) v -= 1.4; else if (q.ox + q.oy < -sz * 0.6) v += 1.2; } }
    if (R === Q.carne && h2(X, Y, SD + 13) < 0.004 && v > 3) v = 5;          // um brilho molhado
    bput(X, Y, R, v, x, y);
  }
  // cogumelos em tufos na borda, bolsas de esporos
  for (let n = 0; n < 70; n++) {
    const x = h2(n, 1, SD + 20) * 480, y = h2(n, 2, SD + 20) * 250, m = mass(x, y);
    if (m < 0.02 || m > 0.3 || !has(x, y)) continue;
    const k = 1 + ((h2(n, 3, SD + 20) * 3) | 0);
    for (let j = 0; j < k; j++) {
      const sx = x + (j - (k - 1) / 2) * 6 + h2(n, 10 + j, SD) * 3, s = 3 + h2(n, 20 + j, SD) * 3.4, hgt = s * (0.8 + h2(n, 30 + j, SD) * 0.8), lean = (sx - MCX) / 260 * 2;
      tube(sx, y, sx + lean, y - hgt, 0.9, 0.8, Q.tron, SD + n, 2.6);
      const qx = sx + lean, qy = y - hgt;
      box(qx - s, qy - s * 0.65, qx + s, qy + 0.5, (X, Y, u, v) => { const dx = (u - qx) / s, dy = (v - qy) / (s * 0.65); if (dx * dx + dy * dy > 1 || dy > 0.2) return; bput(X, Y, Q.chap, 3.6 - (dx * 0.8 + dy) * 1.3 + cg(X, Y, SD + 21) * 0.5, u, v); });
      for (let X = Math.floor(tx(qx - s + 1)); X <= tx(qx + s - 1); X++) bput(X, Math.floor(ty(qy)) + 1, Q.chap, (X & 1) ? 4.6 : 2.4, 0, 0);   // as lamelas
    }
  }
  for (let n = 0; n < 16; n++) { const x = h2(n, 4, SD + 22) * 480, y = 40 + h2(n, 5, SD + 22) * 200, m = mass(x, y);
    if (m < 0.15 || Math.abs(x - MCX) < 60 || !has(x, y)) continue; const r = 4 + h2(n, 6, SD + 22) * 3;
    blob(x, y, r, r * 0.9, Q.sac, SD + 30 + n, 2.4, (u, v, dx, dy) => Math.hypot(dx + 0.4, dy + 0.4) < 0.3 ? 2 : (h2(u | 0, v | 0, 7111) < 0.1 && dx * dx + dy * dy < 0.5 ? -2 : 0)); }
  // as seis cicatrizes onde os bulbos abrem; três estão abertas
  const SLOTS = [[96, 246, 1], [444, 246, 0], [72, 168, 0], [408, 156, 1], [156, 96, 1], [324, 96, 0]];
  for (const [bx, by, open] of SLOTS) {
    box(bx - 13, by - 13, bx + 13, by + 13, (X, Y, u, v) => { const dx = u - bx, dy = v - by, d = Math.hypot(dx, dy * 1.15) / 12; if (d > 1 || BR[Y * W + X] < 0) return;
      const an = Math.atan2(dy, dx), crease = Math.sin(an * 9 + d * 3) > 0.55;
      let val = 2.4 + (d > 0.55 ? (0.9 - Math.abs(d - 0.75) * 4) : -0.4 - (0.55 - d) * 2) - (dx + dy) / 11 * 0.9 + cg(X, Y, SD + 40) * 0.4; if (crease && d < 0.85) val -= 1.1;
      bput(X, Y, d < 0.5 ? Q.veia : Q.carne, val, u, v); });
    if (!open) { for (let u = bx - 5; u <= bx + 5; u += 1) wput(u, by, Q.veia, 0); wput(bx - 1, by - 2, Q.esp, 3); continue; }
    // o bulbo aberto (paintBulb, k = 1): lábios de carne em volta de um saco que brilha, os esporos escuros dentro
    const sr = 9.5, op = 10.5;
    box(bx - 15, by - 15, bx + 15, by + 15, (X, Y, u, v) => { const dx = u - bx, dy = v - by, d = Math.hypot(dx, dy * 1.1);
      if (d < sr) { const nx = dx / sr, ny = dy / sr, dd = nx * nx + ny * ny; let val = 4.3 - (nx * 0.8 + ny) * 1.3 - dd * 1.1 + cg(X, Y, SD + 50) * 0.4 + 0.3;
        if (Math.hypot(nx + 0.4, ny + 0.45) < 0.26) val = 5.6; if (dd < 0.6 && dd > 0.08 && h2(X, Y, SD + 51) < 0.14) { bput(X, Y, Q.sac, 0.5, u, v); return; } bput(X, Y, Q.esp, val, u, v); return; }
      if (d < op + 3.6 && d > op - 0.6) { const w = (d - op) / 4, an = Math.atan2(dy, dx); let val = 3.3 - Math.abs(w - 0.2) * 3 - (dx + dy) / 14 * 1.1 + cg(X, Y, SD + 52) * 0.5; if (Math.sin(an * 8 + d) > 0.7) val -= 0.9; bput(X, Y, Q.carne, val, u, v); }
      else if (d < op - 0.6) bput(X, Y, Q.veia, 0.6, u, v); });
  }
  /* ela: a primeira colona, braços abertos, as mãos engolidas por nós de micélio, olhos fechados, o peito costurado */
  {
    const c0 = MCX;
    marking = true;
    over = (x, y, R, v) => {   // os fios sobem por ela: mais embaixo e para as mãos
      const amt = (y - 112) / 60 + Math.max(0, Math.abs(x - c0) - 30) / 70, th = nz(x * 1.6, y * 0.3, 3, SD + 50) + nz(x, y, 9, SD + 52) * 0.5;
      if (R !== Q.myc && amt > 0 && th + amt * 0.35 > 0.3) return [Q.myc, 3.0 + nz(x * 1.6, y * 0.3, 1.6, SD + 53) * 2.4];
      return [R, v]; };
    blob(c0, 100, 9.5, 15, Q.cabelo, SD + 60, 1.8, (x) => (Math.sin(x * 1.4) > 0.5 ? 0.7 : 0));
    for (const sd of [-1, 1]) {
      const sx = c0 + sd * 12, ex = c0 + sd * 46, wx = c0 + sd * 80;
      tube(sx, 104, ex, 100, 4.6, 3.8, Q.roupa, SD + 61 + sd, 2.4, (x, y, t) => Math.sin(t * 20) > 0.7 ? -0.6 : 0);
      tube(ex, 100, wx, 96, 3.3, 2.7, Q.pele, SD + 63 + sd, 2.6);
      blob(c0 + sd * 87, 95.5, 4.4, 3.6, Q.pele, SD + 65 + sd, 2.7);
      for (let k = 0; k < 4; k++) { const a = -0.9 + k * 0.5; tube(c0 + sd * 89, 95, c0 + sd * (89 + Math.cos(a) * 7), 95 + Math.sin(a) * 7, 1.1, 0.8, Q.pele, SD + 66 + k, 2.8); }
      marking = false;
      blob(c0 + sd * 81, 96.5, 5.5, 5, Q.myc, SD + 67 + sd, 2.8, (x, y) => (Math.sin(x * 1.3 + y * 0.9) > 0.3 ? 0.8 : -0.4));
      blob(c0 + sd * 47, 101, 3.4, 4.2, Q.myc, SD + 69 + sd, 2.6);
      marking = true;
    }
    tube(c0, 96, c0, 104, 2.6, 3, Q.pele, SD + 70, 2.3);
    box(c0 - 30, 102, c0 + 30, 182, (X, Y, x, y) => {   // o vestido, o avental, o cinto
      const k = (y - 102) / 38, hw = y < 140 ? 14 - k * 4.5 : 9.5 + (y - 140) * 0.32; if (Math.abs(x - c0) > hw || y < 102 || y > 182) return;
      if (y > 150 && nz(c0, y, 6, SD + 71) + (y - 150) / 34 > 0.75) return;
      if (y > 150 && nz(x, y, 6, SD + 72) + (y - 150) / 40 > 0.6) return;
      const u = (x - c0) / hw, fold = Math.sin((x - c0) * 0.75 + y * 0.05);
      let R = Q.roupa, v = 2.8 - u * 1.0 - (y - 102) / 80 + fold * 0.45 + cg(X, Y, SD + 73) * 0.45 - u * u * 0.8;
      if (Math.abs(x - c0) < 7.5 && y > 126) { R = Q.avental; v = 3.0 - u * 1.4 + fold * 0.3 + cg(X, Y, SD + 74) * 0.4 - (y - 126) / 70; }
      if (y >= 123.5 && y <= 126.5) { R = Q.cabelo; v = y < 125 ? 3.4 : 2; }
      bput(X, Y, R, v, x, y); });
    marking = false; over = null;
    // a costura do peito: lábios de carne, a luz de esporita lá dentro
    box(c0 - 5, 108, c0 + 5, 131, (X, Y, x, y) => { if (y < 108 || y > 131) return; const w = 1.6 + Math.sin((y - 108) / 23 * Math.PI) * 3.2, u = (x - c0) / w; if (Math.abs(u) > 1) return;
      bput(X, Y, Math.abs(u) < 0.4 ? Q.esp : Q.carne, Math.abs(u) < 0.4 ? 3 + ((Y & 1) ? 1.5 : 0) : 3.6 - u * 1.2, x, y); });
    marking = true;
    blob(c0, 90, 6.6, 7.6, Q.pele, SD + 80, 2.6);
    blob(c0 - 0.4, 85.2, 7.4, 4.6, Q.cabelo, SD + 81, 2.4, (x, y, dx, dy) => dy > 0.6 && Math.abs(dx) < 0.55 ? null : 0);
    for (const sd of [-1, 1]) for (let y = 86; y < 104; y += 1) wput(c0 + sd * (6.4 + (y - 86) * 0.12), y, Q.cabelo, 2.2 + (y & 1));
    wput(c0 - 3, 90.5, Q.cabelo, 0); wput(c0 + 2.5, 90.5, Q.cabelo, 0);          // olhos fechados
    wput(c0, 95.5, Q.carne, 0);                                                // a boca um pouco aberta
    marking = false;
    for (const [mx, my, s] of [[c0 - 5, 82, 3.2], [c0 + 16, 101, 3.4], [c0 + 20, 104, 2.4]]) {   // cogumelinhos no cabelo e no ombro
      tube(mx, my + 3, mx, my, 0.7, 0.6, Q.tron, SD + 82, 2.8);
      box(mx - s, my - s * 0.7, mx + s, my, (X, Y, u, v) => { const dx = (u - mx) / s, dy = (v - my) / (s * 0.7); if (dx * dx + dy * dy <= 1 && dy <= 0.25) bput(X, Y, Q.chap, 3.8 - (dx * 0.8 + dy) * 1.3, u, v); });
    }
  }
  // contorno: o tom mais escuro de cada rampa onde a Mãe encontra o ar; e ela contra a carne, para ler
  { const o = BV.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (BR[i] < 0) continue;
      const air = x > 0 && BR[i - 1] < 0 || x < W - 1 && BR[i + 1] < 0 || y > 0 && BR[i - W] < 0 || y < H - 1 && BR[i + W] < 0;
      const edge = HM[i] && (!HM[i - 1] || !HM[i + 1] || !HM[i - W] || !HM[i + W]);
      if (air || edge) o[i] = Math.min(o[i], air ? 0.2 : 0.6); }
    BV.set(o); }
  // a Mãe na tela: tom da arte, a luz dos bulbos e do peito por cima, a tocha de longe
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (BR[i] < 0) continue;
    const L = lightAt(x, y), lit = L ? L.a : 0, R = RAMPS[BR[i]];
    const own = R === Q.esp && BV[i] > 3.4 ? 0.35 : 0;                          // a esporita e o saco brilham sozinhos
    let c = rp(R, cl(BV[i] / 5, 0, 1) * cl(0.46 + lit * 0.62 + own, 0, 1.15), x, y);
    if (L) c = mix(c, L.c, qa(Math.min(0.32, lit * 0.3), x, y, 6));
    put(x, y, c); }

  /* ---------- rocha da frente: teto de xisto com a crosta de micélio, a coluna da esquerda, estalactites ---------- */
  const XISTO = P(['#0a0e10', '#12181c', '#1e282e', '#2c3a40', '#3e5056', '#56686c', '#7a8c8c']);
  const TOMADA = P(['#10141a', '#1a2024', '#2e383a', '#4a5652', '#74807a', '#a8b2a6', '#d8e0d0']);
  const HUMUS = P(['#0a080c', '#120f14', '#1e1a22', '#2c2632', '#3c3444', '#504658']);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rockAt(x, y) && y < WL + 30) N[y * W + x] = 2;
  const open = (x, y) => inb(x, y) && N[y * W + x] !== 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (N[y * W + x] !== 2) continue;
    const L = lightAt(x, y), lit = L ? L.a : 0;
    // xisto em lâminas inclinadas; a crosta clara do micélio perto das bordas e nas estalactites
    const lam = Math.sin((x * 0.5 + y) / 2.6 + fbm(x / 20, y / 20, 41) * 6), crust = stalAt(x, y) || (fbm(x / 9, y / 7, 43) > 0.58 && (open(x, y + 3) || open(x + 3, y) || open(x - 3, y)));
    let pal = crust ? TOMADA : (fbm(x / 30, y / 14, 45) > 0.6 ? HUMUS : XISTO);
    let t = 0.3 + (fbm(x / 6, y / 4, 47) - 0.5) * 0.4 + (lam > 0.75 ? 0.12 : lam < -0.8 ? -0.1 : 0);
    if (crust) t += (fbm(x / 2, y / 3, 49) - 0.5) * 0.35 + 0.08;
    let e = 0;
    if (open(x, y - 1)) e = 0.35; else if (open(x, y - 2)) e = 0.18;
    if (open(x, y + 1)) e += 0.12;
    if (L) { const dx = Math.sign(TORCH.x - x); if (open(x + dx, y)) e += 0.25; }
    t = t * (0.22 + lit * 1.1) + e * (0.2 + lit * 0.9);
    let c = rp(pal, t, x, y);
    if (L) c = mix(c, L.c, qa(Math.min(0.5, L.a * 0.4), x, y, 8));
    put(x, y, c);
  }
  // filmes de água escorrendo no xisto perto da luz
  for (let n = 0; n < 60; n++) { let x = (h2(n, 1, 61) * W) | 0, y = (h2(n, 2, 61) * 200) | 0; if (M(x, y) !== 2) continue; const len = 4 + (h2(n, 3, 61) * 14) | 0;
    for (let j = 0; j < len; j++) { if (M(x, y + j) !== 2) break; const L = lightAt(x, y + j); if (L && L.a > 0.08) blend(x, y + j, C(j % 3 ? '#3e5a62' : '#6a8c94'), cl(L.a * 0.9, 0, 0.6)); } }
  // placas de esporita na rocha, presas por fios, com uma luz fraca
  const PLATES = [[124, 132], [110, 158], [196, 26], [142, 92], [262, 18], [70, 205]];
  for (const [px, py] of PLATES) { if (M(px, py) !== 2) continue; lights.push({ x: px, y: py, r: 16, c: C('#1e8a74'), s: 0.35 });
    for (let j = -3; j <= 3; j++) for (let i = -4; i <= 4; i++) { const X = px + i, Y = py + j, s = Math.abs(i) * 0.7 + Math.abs(j); if (s > 3.2 || M(X, Y) !== 2 || h2(X, Y, 65) < 0.15) continue;
      put(X, Y, rp(Q.esp, (s > 2.5 ? 0.25 : 0.55) + (i + j < -1 ? 0.3 : 0) + (h2(X, Y, 66) - 0.5) * 0.2, X, Y)); }
    for (let k = 0; k < 4; k++) { const a = h2(px, k, 67) * 6.28; for (let d = 3; d < 8; d++) { const X = Math.round(px + Math.cos(a) * d), Y = Math.round(py + Math.sin(a) * d * 0.7); if (M(X, Y) === 2 && h2(X, Y, 68) < 0.7) put(X, Y, C(d < 6 ? '#7a705a' : '#4a4436')); } } }
  // cachos de esporos no teto: bolinhas verdes que brilham
  const SPORE = P(['#0e1e10', '#1a3a1a', '#2a5a26', '#3e7e34', '#5aa848', '#8ad070', '#c4ecaa']);
  for (const [sx, sy] of SPC) for (let k = 0; k < 9; k++) { const X0 = sx + Math.round((h2(sx, k, 71) - 0.5) * 12), Y0 = sy + Math.round(h2(sx, k, 72) * 6) - 1, r = 1.2 + h2(sx, k, 73) * 1.6;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const d = Math.hypot(i, j) / r; if (d > 1) continue; put(X0 + i, Y0 + j, rp(SPORE, 0.3 + (1 - d) * 0.4 + (i < 0 && j < 0 ? 0.15 : 0), X0 + i, Y0 + j)); N[(Y0 + j) * W + X0 + i] = 7; } }
  // fios pendurados do teto (creme, nunca branco)
  const MYC = P(['#2e2a22', '#4a4436', '#7a705a', '#a89c7e', '#cabf9c', '#e2d8b6']);
  for (let n = 0; n < 46; n++) { let x = (130 + h2(n, 3, 75) * 350) | 0, y = 0; while (y < H - 1 && M(x, y) === 2) y++; if (y > 90 || y < 3) continue;
    const len = 5 + (h2(n, 4, 75) * 26) | 0; for (let j = 0; j < len && M(x, y) !== 2; j++) { const L = lightAt(x, y); put(x, y, rp(MYC, 0.15 + (L ? L.a * 0.7 : 0) - j / len * 0.15, x, y)); N[y * W + x] = 7; if (h2(n, j, 77) > 0.8) x += h2(n, j, 79) > 0.5 ? 1 : -1; y++; } }
  // dois cordões de micélio descendo do teto até perto da água
  const CORDS = [[226, 166], [458, 168]];
  for (const [kx, bot] of CORDS) { const top = Math.round(yCeil(kx)) - 2;
    for (let y = top; y < bot; y++) { const sw = (Math.sin(y / 17 + kx) * 2.5 + Math.sin(y / 41 + kx * 2) * 3) * (y - top) / (bot - top), w = 1.6 + Math.sin(y / 3) * 0.4;
      for (let i = -2; i <= 2; i++) { const X = Math.round(kx + sw + i); if (Math.abs(i) > w) continue; const L = lightAt(X, y); const twist = ((y + i * 2) % 5 === 0) ? -0.18 : 0;
        put(X, y, rp(MYC, 0.25 + (i < 0 ? 0.2 : -0.05) + twist + (L ? L.a * 0.6 : 0), X, y)); N[y * W + X] = 7; } }
    for (let j = 0; j < 4; j++) { const X = Math.round(kx + Math.sin(bot / 17 + kx) * 2.5 + Math.sin(bot / 41 + kx * 2) * 3) + (j & 1 ? 1 : -1) * (j >> 1); put(X, bot + j, rp(MYC, 0.2, X, bot + j)); N[(bot + j) * W + X] = 7; } }

  /* ---------- os chapéus de cogumelo gigante saindo da água; as lamelas acendem por baixo ---------- */
  const TRON = P(['#2a2a26', '#48463e', '#6e6a5c', '#9a9480', '#c4bca2', '#e6dec4']);
  const CHAP = P(['#0e2a2e', '#16444a', '#1e6a6e', '#3a9a94', '#7accc0', '#c4f4e6']);
  const GILL = P(['#16444a', '#2a8a86', '#5ac0b4', '#9ae8d8']);
  for (const [cxp, top, r] of CAPS) {
    const sw = Math.max(2, r * 0.22), under = top + r * 0.55;
    for (let y = Math.floor(under); y < WL + 4; y++) { const bend = Math.sin((y - under) / 14 + cxp) * 1.5, ww = sw + (y - under) * 0.03;
      for (let x = Math.floor(cxp + bend - ww); x <= cxp + bend + ww; x++) { const u = (x - cxp - bend) / ww; const L = lightAt(x, y);
        put(x, y, rp(TRON, (0.45 - u * 0.25 - (y - under) / 80 + (h2(x, y, 81) - 0.5) * 0.15 + ((y * 3 + x) % 7 === 0 ? -0.12 : 0)) * (0.4 + (L ? L.a * 0.8 : 0)) + 0.06, x, y)); N[y * W + x] = 7; } }
    for (let y = Math.floor(top - 1); y <= under + 1; y++) for (let x = Math.floor(cxp - r - 1); x <= cxp + r + 1; x++) {
      const dx = (x + 0.5 - cxp) / r, ctop = top + dx * dx * r * 0.5, cbot = under + 1 - Math.abs(dx) * 2; if (Math.abs(dx) > 1 || y < ctop || y > cbot) continue;
      const L = lightAt(x, y), k = (y - ctop) / Math.max(1, cbot - ctop);
      let c;
      if (y >= cbot - 1 && Math.abs(dx) < 0.92) c = rp(GILL, (x & 1) ? 0.85 : 0.35, x, y);                             // as lamelas
      else { const spot = h2((x / 3) | 0, (y / 2) | 0, 83 + r) < 0.12 && k < 0.6; c = rp(CHAP, (0.55 - dx * 0.25 - k * 0.35 + (spot ? 0.3 : 0) + (y < ctop + 1 ? 0.15 : 0) + (h2(x, y, 84) - 0.5) * 0.12) * (0.55 + (L ? L.a * 0.6 : 0)) + 0.08, x, y);
        if (Math.abs(dx) > 0.94 || y >= cbot) c = CHAP[0]; }
      if (L) c = mix(c, L.c, qa(Math.min(0.35, L.a * 0.3), x, y, 6));
      put(x, y, c); N[y * W + x] = 7; }
  }

  /* ---------- o herói, no chapéu, tocha erguida ---------- */
  const HK = [ // o herói já com a placa completa de cobalto, elmo fechado
    '.....zz.......',
    '...zaaaz......',
    '..zaAAAaz.....',
    '.zaAaaaaz...t.',
    '.zaaaaaaz...t.',
    '.zazzzeez...t.',
    '.zaaaaaaz.aA..',
    '..zaaaaz.aAa..',
    '...zaaz..az...',
    '.zAaaaaaaz....',
    'zaaaAAaaaz....',
    'zaaaAAaaz.....',
    '.zzaaaaaz.....',
    '.zbbbbbbkb....',
    '.zazzazaz.....',
    '.zrrrrrrrr....',
    '.rrrrrrrrrr...',
    '.rrrrrrrrrr...',
    '..zaaz.zaz....',
    '..zAz...Az....',
    '..zaz...az....',
    '.zzz....zzz...'];
  const HC = { h: '#4e2c1a', s: '#e2a982', W: '#f2ead8', e: '#80e0ff', m: '#a5604a', n: '#8a6a48', r: '#24304e', b: '#3a2618', k: '#c0d0f0', p: '#4b3b33', f: '#2a1c14', t: '#5a3a1e', a: '#3a64c8', A: '#9ac0ff', z: '#14204a' };
  for (let j = 0; j < HK.length; j++) for (let i = 0; i < HK[j].length; i++) { const ch = HK[j][i]; if (!HC[ch]) continue;
    let c = C(HC[ch]); const X = HERO.x + i, Y = HERO.y + j;
    if (ch !== 'W' && ch !== 'e') { const lx = (i - 4) / 10, up = (21 - j) / 21; c = mix(c, lx > 0.2 || up > 0.7 ? C('#ffc888') : C('#160e10'), lx > 0.2 || up > 0.7 ? cl(lx * 0.3 + up * 0.15, 0, 0.35) : 0.4); }
    if (ch === 'h' && (i + j) % 4 === 0) c = mix(c, C('#2a160c'), 0.4);
    put(X, Y, c); N[Y * W + X] = 6; }

  /* ---------- longe da luz, tudo some no escuro; a esquerda fica para o nome e o menu ---------- */
  const DARK = C('#020305');
  for (let y = 0; y < WL; y++) for (let x = 0; x < W; x++) {
    const n = N[y * W + x]; if (n === 6) continue;
    const L = lightAt(x, y); const lit = (L ? L.a : 0) + (n === 0 ? 0.3 : n === 1 ? 0.22 : n === 5 ? 0.26 : n === 7 ? 0.2 : 0.06);
    const left = cl((170 - x) / 150, 0, 1) * 0.55;
    const dk = cl(0.72 - lit * 2.2 + left, 0, 0.93);
    if (dk > 0) put(x, y, mix(get(x, y), DARK, qa(dk, x, y, 8)));
  }

  /* ---------- a água: escura, espelha a Mãe, os chapéus e a tocha, em faixas que tremem ---------- */
  const AGUA = P(['#02060c', '#041020', '#081c34', '#0e2c4a', '#164264', '#2a6688']);
  for (let y = WL; y < H; y++) for (let x = 0; x < W; x++) {
    if (N[y * W + x] === 2 && y > WL + 1) continue;
    const dpt = (y - WL) / (H - WL), wob = Math.round(Math.sin(y * 1.3 + x * 0.04) * (1 + dpt * 3) + (fbm(x / 18, y / 2, 91) - 0.5) * 4 * dpt);
    const sy = 2 * WL - y - 1 - ((y - WL) >> 3), sx = cl(x + wob, 0, W - 1);
    let c = rp(AGUA, 0.18 - dpt * 0.12 + (fbm(x / 30, y / 3, 93) - 0.5) * 0.12, x, y);
    if (sy >= 0) { const s = get(sx, sy), lum = (s[0] + s[1] + s[2]) / 3; c = mix(c, s, cl(0.62 - dpt * 0.4 + (lum > 70 ? 0.15 : 0), 0, 0.8) * ((y & 1) && dpt > 0.15 ? 0.7 : 1)); }
    if (y === WL) c = mix(c, C('#6a8c94'), 0.2 + (lightAt(x, y) ? cl(lightAt(x, y).a * 0.6, 0, 0.5) : 0));
    put(x, y, c); N[y * W + x] = 3;
  }
  for (let y = WL; y < H; y++) for (let x = 0; x < W; x++) { if (N[y * W + x] !== 3) continue; const left = cl((150 - x) / 140, 0, 1) * 0.55; if (left > 0) put(x, y, mix(get(x, y), DARK, qa(left, x, y, 8))); }
  // brilhos da tocha e dos bulbos riscando a água
  for (const [lx0, col, n] of [[TORCH.x, '#ffb060', 14], [BULBS[2][0], '#7af0e0', 8], [CHEST[0], '#6ad4b4', 7], [CAPS[3][0], '#5ac0b4', 5]]) for (let k = 0; k < n; k++) {
    const y = WL + 2 + Math.round(h2(k, lx0, 95) * 40), w = 1 + ((h2(k, lx0, 96) * 4) | 0), x = Math.round(lx0 + (h2(k, lx0, 97) - 0.5) * (6 + (y - WL) * 0.5));
    for (let i = 0; i < w; i++) blend(x + i, y, C(col), 0.45 - (y - WL) / 100); }

  /* ---------- grão e vinheta ---------- */
  const VIG = C('#010203');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - W * 0.6) / (W * 0.6), ny = (y - H * 0.45) / (H * 0.68), d = Math.hypot(nx, ny);
    let c = get(x, y); const g = (h2(x, y, 999) - 0.5) * 8; c = [c[0] + g, c[1] + g, c[2] + g];
    const v = cl((d - 0.6) / 0.6, 0, 1) * 0.75; if (v > 0) c = mix(c, VIG, qa(v, x, y, 5));
    put(x, y, [cl(c[0], 0, 255), cl(c[1], 0, 255), cl(c[2], 0, 255)]);
  }
  cx.putImageData(img, 0, 0);

  /* ---------- o que mexe ---------- */
  const mkGlow = (r, rgb, k) => { const c = document.createElement('canvas'); c.width = c.height = r * 2; const g = c.getContext('2d');
    for (let y = 0; y < r * 2; y++) for (let x = 0; x < r * 2; x++) { const d = Math.hypot(x - r, y - r) / (r - 4); const a = qa(cl(1 - d, 0, 1), x, y, 4); if (a > 0) { g.fillStyle = `rgba(${rgb},${a * k})`; g.fillRect(x, y, 1, 1); } } return c; };
  const glow = mkGlow(36, '255,160,70', 0.06), cyan = mkGlow(18, '90,224,208', 0.12), core = mkGlow(24, '106,212,180', 0.08);
  const FL = ['#fff4c0', '#ffd27a', '#f39a3a', '#d0601e', '#8a2e10'];
  // pontos da massa de onde os esporos sobem
  const SRC = []; for (let n = 0; n < 4000 && SRC.length < 300; n++) { const x = (h2(n, 1, 101) * W) | 0, y = (h2(n, 2, 101) * WL) | 0; if (N[y * W + x] === 5) SRC.push([x, y]); }
  const motes = [], drips = [], ripples = [];
  const DRIP_FROM = STAL.filter(([sx]) => sx > 140).map(([sx, len]) => [sx, Math.round(yCeil(sx) - 2 + len)]);
  let dripT = 0.6;
  function frame(fx, t, dt) {
    // os bulbos e o peito pulsam
    for (const [i, [bx, by]] of BULBS.entries()) { const p = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 2.1); fx.globalAlpha = 0.45 + p * 0.55; fx.drawImage(cyan, Math.round(bx) - 18, Math.round(by) - 18);
      fx.globalAlpha = 0.35 + p * 0.5; fx.fillStyle = '#c8fce8'; fx.fillRect(Math.round(bx) - 2, Math.round(by) - 2, 2, 1); fx.fillRect(Math.round(bx) - 3, Math.round(by) - 1, 1, 1); }
    { const p = 0.5 + 0.5 * Math.sin(t * 1.1); fx.globalAlpha = 0.4 + p * 0.5; fx.drawImage(core, Math.round(CHEST[0]) - 24, Math.round(CHEST[1]) - 24);
      fx.globalAlpha = 0.3 + p * 0.5; fx.fillStyle = '#c8fce8'; for (let y = -5; y <= 5; y += 2) fx.fillRect(Math.round(CHEST[0]), Math.round(CHEST[1]) + y, 1, 1); }
    fx.globalAlpha = 1;
    // chama da tocha
    const tx0 = TORCH.x, ty0 = TORCH.y;
    fx.globalAlpha = 0.8 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.1; fx.drawImage(glow, tx0 - 36, ty0 - 36); fx.globalAlpha = 1;
    for (let j = 0; j < 5; j++) { const w = j < 1 ? 1 : j < 3 ? 2 : 1, sway = Math.round(Math.sin(t * 7 + j) * (j / 4) * 1.2); fx.fillStyle = FL[Math.min(4, j + (Math.sin(t * 15 + j * 2) > 0.5 ? 1 : 0))]; fx.fillRect(tx0 - (w > 1 ? 1 : 0) + sway, ty0 - j, w, 1); }
    if (Math.random() < dt * 6) motes.push({ x: tx0 + (Math.random() - 0.5) * 2, y: ty0 - 4, vx: (Math.random() - 0.5) * 6, vy: -(8 + Math.random() * 10), t: 0, life: 0.6 + Math.random() * 0.8, spark: true });
    // esporos subindo devagar da massa
    if (motes.length < 46 && Math.random() < dt * 12 && SRC.length) { const [x, y] = SRC[(Math.random() * SRC.length) | 0]; motes.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: -(2 + Math.random() * 4), t: 0, life: 3 + Math.random() * 4, col: Math.random() < 0.5 ? '#c4ecaa' : '#6ad4b4' }); }
    for (let i = motes.length - 1; i >= 0; i--) { const m = motes[i]; m.t += dt; if (m.t > m.life) { motes.splice(i, 1); continue; } m.x += (m.vx + Math.sin(m.t * 1.7 + i) * 2) * dt; m.y += m.vy * dt;
      const f = m.t / m.life; fx.globalAlpha = m.spark ? 1 - f : Math.sin(f * Math.PI) * 0.8; fx.fillStyle = m.spark ? FL[Math.min(4, (f * 5) | 0)] : m.col; fx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); }
    fx.globalAlpha = 1;
    // gotas caindo das estalactites na água
    dripT -= dt; if (dripT <= 0 && DRIP_FROM.length) { const [x, y] = DRIP_FROM[(Math.random() * DRIP_FROM.length) | 0]; drips.push({ x, y, vy: 0 }); dripT = 0.7 + Math.random() * 1.6; }
    for (let i = drips.length - 1; i >= 0; i--) { const d = drips[i]; d.vy += 220 * dt; d.y += d.vy * dt; if (d.y >= WL) { ripples.push({ x: d.x, t: 0 }); drips.splice(i, 1); continue; } fx.fillStyle = '#a8d8c8'; fx.fillRect(d.x, Math.round(d.y), 1, d.vy > 60 ? 2 : 1); }
    for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.t += dt; if (r.t > 1.2) { ripples.splice(i, 1); continue; } const rad = 1 + r.t * 8; fx.globalAlpha = (1 - r.t / 1.2) * 0.8; fx.fillStyle = '#7ab8b0'; fx.fillRect(Math.round(r.x - rad), WL, 2, 1); fx.fillRect(Math.round(r.x + rad - 1), WL, 2, 1); }
    fx.globalAlpha = 1;
    // uma mariposa-esporo rodando a tocha (asas cinza-pardas comidas de micélio)
    const mx = Math.round(tx0 + Math.cos(t * 1.25) * 16 + Math.sin(t * 2.9) * 3), my = Math.round(ty0 - 10 + Math.sin(t * 2.1) * 8), up = Math.sin(t * 22) > 0;
    fx.fillStyle = '#302820'; fx.fillRect(mx, my, 2, 1);
    fx.fillStyle = up ? '#8c7860' : '#5a4a3c'; fx.fillRect(mx - 1, my + (up ? -1 : 1), 2, 1); fx.fillRect(mx + 1, my + (up ? -1 : 1), 2, 1);
    fx.fillStyle = '#a89c7e'; fx.fillRect(mx + (up ? 0 : 1), my + (up ? -2 : 1), 1, 1);
  }
  return { canvas: cv, frame };
}
var TITLE_ARTS = TITLE_ARTS || []; TITLE_ARTS.push(paintTitleArtFungo);
