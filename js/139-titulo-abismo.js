'use strict';
/* arte da tela de título: O Abismo. O fundo do inferno: um salão enorme de cinza e basalto, um rio de fogo correndo
   numa fenda entre duas margens, uma cachoeira de lava escorrendo na parede lá atrás e, ao longe, contra o brilho
   vermelho, um portão de ferro negro arrombado (os Portões de Cinza). Correntes e uma gaiola pendem do teto.
   Na margem da direita, em pé num rochedo de basalto com cristais do caos, o Príncipe do Caos: asas abertas, a
   espada que queima erguida, a boca acesa (o mesmo desenho do 109, pose do chamado, repintado bem maior). Na margem
   da esquerda, pequeno, o herói ergue a tocha e olha para ele. O lado esquerdo fica escuro para o nome e o menu.
   Pintada uma vez (480x270, 39-titulo sorteia entre as artes de TITLE_ARTS). Por quadro mexem só coisas pequenas:
   a chama da tocha, as brasas subindo do rio, o fogo lambendo a lâmina, o olho e a boca do Príncipe, a lava
   descendo a cachoeira, bolhas estourando no rio e dois diabretes voando ao longe. */
function paintTitleArtAbismo() {
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
  const N = new Uint8Array(W * H);   // o que está em cada pixel: 0 fundo, 1 plano distante, 2 rocha, 3 lava, 5 o Príncipe e o que pende, 6 herói, 7 cachoeira de lava
  const M = (x, y) => inb(x, y) ? N[y * W + x] : 2;

  /* ---------- palcos: teto, coluna da esquerda, margem do herói, rochedo do Príncipe, o rio de fogo ---------- */
  const yCeil = x => 20 + (fbm(x / 26, 1, 3) - 0.5) * 16 + Math.max(0, 130 - x) * 0.35 - Math.max(0, x - 360) * 0.08;
  const colL = y => 66 + (fbm(y / 18, 5, 11) - 0.5) * 20 + Math.max(0, 60 - y) * 0.9 + Math.max(0, y - 196) * 0.7;
  const yLedge = x => 214 + (fbm(x / 14, 4, 9) - 0.5) * 7 + (fbm(x / 4, 4, 10) - 0.5) * 2.5 + Math.max(0, x - 290) * 3.4 + Math.max(0, 200 - x) * 0.12;
  const yOut = x => 201 + (fbm(x / 16, 5, 13) - 0.5) * 4 + (fbm(x / 4, 5, 14) - 0.5) * 1.5 + (x < 392 || x > 452 ? (h2(Math.floor((x - 2) / 9), 1, 77) - 0.3) * 8 : 0) + Math.max(0, 374 - x) * 4.2 - Math.max(0, x - 455) * 0.3;
  const LY = x => 245 + Math.sin(x / 23) * 0.8;
  const shore = x => LY(x) + 1 + fbm(x / 6, 2, 81) * 3;   // a beira das margens dentro do rio
  // estalactites de obsidiana (x, comprimento, largura)
  const STAL = [[150, 40, 5], [176, 22, 3], [214, 30, 4], [262, 18, 3], [296, 44, 5], [310, 22, 3], [348, 16, 3], [470, 26, 4], [124, 22, 3]];
  const stalAt = (x, y) => { for (const [sx, len, w] of STAL) { const top = yCeil(sx) - 2, k = (y - top) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx) <= w * Math.pow(1 - k, 1.3) + 0.3) return true; } return false; };
  // a coluna de basalto do chão ao teto, à esquerda
  const colAt = (x, y) => { const c = 142 + (fbm(y / 10, 6, 13) - 0.5) * 2, w = 6 + Math.pow(Math.abs(y - 130) / 95, 2) * 7; return Math.abs(x - c) < w; };
  // pontas de osso e de obsidiana saindo das margens
  const SPK = [[226, 12, 2, -0.25], [232, 8, 1.5, 0.2], [236, 16, 2.4, -0.1], [462, 14, 3, 0.15], [470, 9, 2, -0.2], [384, 7, 1.6, 0.3]];
  const spkAt = (x, y) => { for (const [sx, len, w, lean] of SPK) { const base = sx > 300 ? yOut(sx) + 2 : yLedge(sx) + 2, k = (base - y) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx - lean * k * len) <= w * (1 - k) + 0.3) return true; } return false; };
  const ledgeAt = (x, y) => x < 300 && y > yLedge(x) && y < shore(x);
  const outAt = (x, y) => x > 340 && y > yOut(x) && y < shore(x);
  const rockAt = (x, y) => y < yCeil(x) || ledgeAt(x, y) || outAt(x, y) || x < colL(y) || stalAt(x, y) || colAt(x, y) || spkAt(x, y);
  const lavaAt = (x, y) => y >= LY(x) && !rockAt(x, y);

  /* ---------- luzes ---------- */
  const HERO = { x: 258, y: 0 }; HERO.y = Math.round(yLedge(HERO.x + 6)) - 22;
  const TORCH = { x: HERO.x + 13, y: HERO.y + 1 };
  // o Príncipe: o quadro dele (140x88 no jogo) pintado S vezes maior, espelhado para olhar para o herói
  const S = 1.6, OX = 18, BW = Math.ceil(140 * S), BH = Math.ceil(90 * S);
  const BX0 = 302, BY0 = Math.round(yOut(420)) - Math.floor(87 * S) - 1;
  const toScr = (x, y) => [BX0 + BW - 1 - Math.floor((x + OX) * S), BY0 + Math.floor(y * S)];
  const HEAD = [65, 20], TILT = -0.2, Rh = (x, y) => [HEAD[0] + x * Math.cos(TILT) - y * Math.sin(TILT), HEAD[1] + x * Math.sin(TILT) + y * Math.cos(TILT)];
  const EYE = toScr(...Rh(4.2, -0.4)), MOUTH = toScr(...Rh(6, 4.4));
  const HILT = toScr(88, 40), TIP = toScr(116, 50), BLADE = [(HILT[0] + TIP[0]) / 2, (HILT[1] + TIP[1]) / 2];
  const FALL = { x: 322, w: 2.2, top: 66 };   // a cachoeira de lava na parede do fundo
  const lights = [
    { x: TORCH.x, y: TORCH.y, r: 115, c: C('#ffa850'), s: 1.25 },
    { x: BLADE[0], y: BLADE[1], r: 85, c: C('#ff7a20'), s: 0.75 },        // a espada que queima
    { x: MOUTH[0], y: MOUTH[1], r: 40, c: C('#ffb040'), s: 0.5 },          // a boca acesa
    { x: 372, y: 206, r: 40, c: C('#c4489a'), s: 0.4 },                    // cristais do caos no rochedo
  ];
  // o rio de fogo acende tudo por baixo, mais forte perto da fenda
  const LAVAC = C('#ff5a14');
  const lavaGlow = (x, y) => { const d = LY(x) - y; if (d < -2) return 0; const gx = Math.exp(-Math.pow((x - 332) / 70, 2)); return Math.exp(-Math.max(0, d) / 30) * (0.5 + gx * 0.8); };
  const lightAt = (x, y) => { let a = 0, r = 0, g = 0, b = 0;
    for (const L of lights) { const d = Math.hypot(x - L.x, (y - L.y) * 1.1); if (d >= L.r) continue; const f = Math.pow(1 - d / L.r, 1.5) * L.s; a += f; r += L.c[0] * f; g += L.c[1] * f; b += L.c[2] * f; }
    const lv = lavaGlow(x, y); if (lv > 0) { a += lv; r += LAVAC[0] * lv; g += LAVAC[1] * lv; b += LAVAC[2] * lv; }
    return a > 0 ? { a, c: [r / a, g / a, b / a] } : null; };

  /* ---------- fundo: o salão perdido no vermelho; espigões ao longe e os Portões de Cinza arrombados ---------- */
  const BACK = P(['#060304', '#0c0506', '#140808', '#1e0c0a', '#2c120c', '#40190e', '#5a2410']);
  const FAR = P(['#050303', '#0a0605', '#100907', '#170c09', '#25100a', '#3a170b']);   // dpAbRocha: o tom de cima já é o brilho do fogo
  const GX = 214, GW = 30, GT = 118;   // o portão: centro, meia largura, topo
  const flFar = x => 204 + (fbm(x / 30, 8, 17) - 0.5) * 12;
  const gateAt = (x, y) => { const fl = flFar(x), dx = x - GX, ax = Math.abs(dx);
    if (y > fl || ax > GW + 2 || y < GT) return 0;
    if (ax > GW - 8) return y > GT + (dx > 0 ? 6 + (fbm(x / 3, 1, 33) * 6) : 0) ? 1 : 0;                         // os pilares (o da direita quebrado)
    const yb = GT + 12 + 9 * Math.pow(dx / (GW - 8), 2);
    if (y < yb && y > GT + 2) return ax > 7 || dx < -5 ? 1 : 0;                                                    // a verga, rompida no meio
    if (y >= yb && ((dx + 40) % 5 === 0) && dx < 2) return 2;                                                     // as grades da folha esquerda
    if (y >= yb && dx < 2 && (Math.abs(y - (GT + 40)) < 1 || Math.abs(y - (GT + 66)) < 1)) return 2;
    if (dx >= 3 && dx < GW - 8) { const k = (dx - 3) / (GW - 11); const yy = fl - 2 - (1 - k) * 22; if (Math.abs(y - yy) < 1.2 || ((dx % 5) === 0 && y > yy && y < yy + 14 + k * 10)) return 2; }   // a folha caída
    return y > GT + 4 ? 3 : 0; };   // o vão: o brilho do fogo do outro lado
  const farAt = (x, y) => {
    const fl = flFar(x);
    if (y > fl) return true;
    const g = gateAt(x, y); if (g === 1 || g === 2) return true; if (g === 3) return false;
    for (let i = 0; i < 9; i++) { const sx = 96 + i * 44 + h2(i, 1, 19) * 22, len = 26 + h2(i, 2, 19) * 50, w = 5 + h2(i, 3, 19) * 6; if (Math.abs(sx - GX) < GW + 8) continue; const k = (fl - y) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx) < w * Math.pow(1 - k, 0.8) * (0.8 + fbm(y / 4, i, 29) * 0.4)) return true; }
    for (let i = 0; i < 8; i++) { const sx = 110 + i * 46 + h2(i, 4, 19) * 20, len = 14 + h2(i, 5, 19) * 26, w = 4 + h2(i, 6, 19) * 4, top = 38 + h2(i, 7, 19) * 12; const k = (y - top) / len; if (k >= 0 && k <= 1 && Math.abs(x - sx) < w * Math.pow(1 - k, 1.4)) return true; }
    return y < 42 + (fbm(x / 20, 9, 21) - 0.5) * 10;
  };
  const fallAt = (x, y) => { return false; const c = FALL.x + Math.sin(y / 17) * 1.2 + (fbm(y / 9, 3, 41) - 0.5) * 2; return y > FALL.top && y < flFar(x) + 2 && Math.abs(x - c) < FALL.w * (0.7 + (y - FALL.top) / 300); };
  const LAVA = P(['#2a0602', '#5a1204', '#962406', '#d2440a', '#f87818', '#ffb040', '#fff0a0']);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const L = lightAt(x, y);
    // o calor sobe do fundo: o vermelho é mais forte embaixo e atrás do portão
    const heat = Math.exp(-Math.max(0, 215 - y) / 55) * (0.45 + fbm(x / 30, y / 20, 25) * 0.35) + Math.exp(-Math.hypot((x - GX) / 1.2, y - 196) / 38) * 0.5 + Math.exp(-Math.pow((x - 334) / 42, 2)) * Math.exp(-Math.max(0, 245 - y) / 50) * 0.55;   // e sobe da fenda do rio
    let c;
    if (fallAt(x, y)) { N[y * W + x] = 7; const u = Math.abs(x - FALL.x - Math.sin(y / 17) * 1.2) / FALL.w; c = rp(LAVA, 0.5 - u * 0.35 + (fbm(x / 2, y / 6, 43) - 0.5) * 0.4 - Math.max(0, 90 - y) * 0.012, x, y); c = mix(c, C('#2a0c06'), 0.3); }
    else if (farAt(x, y)) { N[y * W + x] = 1; const rim = y > flFar(x) - 3 && y < flFar(x) + 2 ? 0.15 : 0; c = rp(FAR, 0.2 + (fbm(x / 5, y / 4, 23) - 0.5) * 0.35 + heat * 0.35 + rim + (L ? L.a * 0.2 : 0), x, y); }
    else { const gv = gateAt(x, y) === 3 ? 0.38 : 0; c = rp(BACK, 0.1 + heat * 0.6 + gv + (fbm(x / 8, y / 6, 25) - 0.5) * 0.25 + (L ? L.a * 0.18 : 0), x, y); }
    // fumaça e cinza no ar, acesa por baixo
    const fog = Math.exp(-Math.pow((y - 200) / 36, 2)) * (0.3 + fbm(x / 40, y / 10, 27) * 0.5);
    if (N[y * W + x] !== 7) c = mix(c, C('#3a1a12'), qa(fog * 0.45, x, y, 5));
    put(x, y, c);
  }

  /* ---------- correntes e uma gaiola pendendo do teto ---------- */
  const FERRO = P(['#060607', '#0f0f12', '#1a1a1f', '#26272d', '#35363e', '#4a4c55', '#6c6e78']);
  const OSSO = P(['#221c16', '#3c342a', '#5c5242', '#7e725e', '#a0947c', '#c2b69c', '#e2d8be']);
  const metal = (x, y, t) => { x = Math.round(x); y = Math.round(y); if (!inb(x, y) || rockAt(x, y)) return; const L = lightAt(x, y); put(x, y, rp(FERRO, t * (0.35 + (L ? L.a * 0.9 : 0)), x, y)); N[y * W + x] = 5; };
  const chain = (x, top, len) => { for (let j = 0; j < len; j++) { const y = top + j, ph = j % 4; if (ph === 0 || ph === 2) metal(x, y, 0.7); else { metal(x - 1, y, 0.75); metal(x + 1, y, 0.4); } } };
  for (const [x, len] of [[188, 46], [206, 30], [250, 62], [366, 24], [440, 34]]) chain(x, Math.round(yCeil(x)) - 1, len);
  { const gx = 286, top = Math.round(yCeil(gx)) - 1; chain(gx, top, 24); const y0 = top + 24;   // a gaiola, porta aberta, ossos dentro
    for (let y = y0; y < y0 + 4; y++) { const hw = (y - y0 + 1) * 2.2; for (let x = Math.round(gx - hw); x <= Math.round(gx + hw); x++) metal(x, y, Math.abs(x - gx) > hw - 1 ? 0.85 : 0.45); }
    for (let y = y0 + 3; y < y0 + 30; y++) for (const dx of [-8, -4, 0, 4, 8]) { if (dx === 8 && y > y0 + 6) continue; metal(gx + dx, y, dx < 0 ? 0.8 : 0.55); }
    for (const y of [y0 + 3, y0 + 16, y0 + 30]) for (let dx = -8; dx <= 8; dx++) metal(gx + dx, y, 0.75 - (dx + 8) * 0.02);
    for (let k = 0; k < 5; k++) metal(gx + 9 + k * 0.6, y0 + 6 + k * 5, 0.6);
    for (const [dx, dy, t] of [[-2, 25, 0.8], [-1, 25, 0.9], [-2, 26, 0.6], [0, 26, 0.7], [1, 28, 0.6], [2, 28, 0.6], [-4, 29, 0.6], [-3, 29, 0.7], [3, 29, 0.5]]) { const X = gx + dx, Y = y0 + dy, L = lightAt(X, Y); put(X, Y, rp(OSSO, t * (0.35 + (L ? L.a : 0)), X, Y)); N[Y * W + X] = 5; } }

  /* ---------- rocha da frente: teto, coluna, margens; e o rio de fogo ---------- */
  const CINZA = P(['#141112', '#221d1d', '#332d2c', '#463f3c', '#5b524e', '#726762', '#8a7e76']);
  const BASAL = P(['#0a0c11', '#141821', '#1f2531', '#2b3242', '#394255', '#4b566c', '#5c6880']);
  const OBSID = P(['#050409', '#0b0912', '#14101d', '#1e182b', '#2a213b', '#382d4f', '#5c4090']);
  const CROSTA = P(['#0a0707', '#130f0f', '#1d1716', '#28201e', '#342a27', '#423531']);
  const CAOS = P(['#0b060c', '#170d18', '#241426', '#321c34', '#422444', '#552f56', '#723a78']);
  const EMBER = P(['#5a1404', '#a83a08', '#ff8a20', '#ffd27a']);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rockAt(x, y)) N[y * W + x] = 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (N[y * W + x] !== 2 && lavaAt(x, y)) N[y * W + x] = 3;
  const open = (x, y) => inb(x, y) && N[y * W + x] !== 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (N[y * W + x] !== 2) continue;
    const L = lightAt(x, y), lit = L ? L.a : 0;
    const obs = stalAt(x, y) || (spkAt(x, y) && x > 300), bone = spkAt(x, y) && x < 300, bas = colAt(x, y) || outAt(x, y) || x < colL(y);
    const nearLava = (y > LY(x) - 6 && (ledgeAt(x, y) || outAt(x, y))) || (ledgeAt(x, y) && x > 284 && y > yLedge(x) + 3) || (outAt(x, y) && x < 382 && y > yOut(x) + 3);
    let pal = bone ? OSSO : obs ? OBSID : bas ? BASAL : nearLava ? CROSTA : CINZA;
    let t = 0.3 + (fbm(x / 6, y / 4, 43) - 0.5) * 0.45;
    if (bas && !(x < colL(y))) { const cx0 = outAt(x, y) ? x - 2 : x - 136, ci = Math.floor(cx0 / 9), m = ((cx0 % 9) + 9) % 9; t += (h2(ci, 3, 79) - 0.5) * 0.18; if (m === 0) t -= 0.25; else if (m === 1 || m === 2) t += 0.12; else if (m === 8) t -= 0.1; if (((y + ci * 7) % 19) === 0) t -= 0.22; else if (((y + ci * 7) % 19) === 1) t += 0.1; }   // prismas de basalto: cada um com seu tom, aresta acesa, juntas
    else if (!bone) { const st = fbm(x / 24, y / 3, 45); if (st > 0.63) t += 0.14; else if (st > 0.59) t -= 0.1; }   // a cinza prensada em lâminas
    // bordas: aceso por cima, laterais viradas para a luz, por baixo pelo rio
    let e = 0;
    if (open(x, y - 1)) e = 0.35; else if (open(x, y - 2)) e = 0.18;
    if (L) { const dx = Math.sign(TORCH.x - x); if (Math.hypot(x - TORCH.x, y - TORCH.y) < 110 && open(x + dx, y)) e += 0.25; }
    if (lavaGlow(x, y) > 0.3 && (open(x + 1, y) || open(x - 1, y) || open(x, y + 1))) e += 0.3;
    t = t * (0.22 + lit * 1.1) + e * (0.2 + lit * 0.9);
    let c = rp(pal, t, x, y);
    if (L) c = mix(c, L.c, qa(Math.min(0.5, L.a * 0.4), x, y, 8));
    // a crosta perto da lava rachada em placas, com fogo nas frestas
    if (nearLava && !bone) { const n = Math.abs(vn(x / 7, y / 5, 47) - 0.5); if (n < 0.035) c = rp(EMBER, 0.2 + lavaGlow(x, y) * 0.5, x, y); }
    put(x, y, c);
  }
  // veios de infernita perto da tocha e do rio: caroços vermelhos que brilham fraco
  for (let n = 0; n < 160; n++) { const x = (h2(n, 1, 61) * W) | 0, y = (h2(n, 2, 61) * H) | 0; if (M(x, y) !== 2) continue; const L = lightAt(x, y); if (!L || L.a < 0.15) continue;
    for (const [dx, dy, c] of [[0, 0, '#ff6c26'], [1, 0, '#c8320e'], [0, 1, '#8a1a0a'], [1, 1, '#ffd690'], [-1, 1, '#541008']]) if (M(x + dx, y + dy) === 2 && h2(x + dx, y + dy, 63) > 0.25) put(x + dx, y + dy, mix(get(x + dx, y + dy), C(c), cl(L.a * 1.3, 0.35, 1))); }
  // o rio de fogo: placas de crosta preta boiando, a superfície branca de calor
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (N[y * W + x] !== 3) continue;
    const d = y - LY(x), fl = fbm(x / 9 - y / 30, y / 4, 51), crust = vn(x / 7, y / 2.4, 53);
    const str = fbm(x / 16 - y / 9, y / 2.2, 55), sh = M(x, y - 1) === 2 || M(x, y - 2) === 2 ? -0.18 : 0;   // correnteza em faixas; sob a beira, mais escuro
    let c = rp(LAVA, 0.74 + (fl - 0.5) * 0.4 + (str - 0.5) * 0.9 - Math.min(1, d / 30) * 0.12 + (d < 1.2 ? 0.28 : 0) + sh, x, y);
    if (crust > 0.82 && d > 2) { const edge = crust < 0.84; c = edge ? rp(EMBER, 0.55, x, y) : rp(CROSTA, 0.25 + (crust - 0.83) * 2, x, y); }
    put(x, y, c);
  }
  // o rio também passa por baixo das margens: a boca da fenda acesa
  for (let x = 0; x < W; x++) for (let y = Math.floor(LY(x)) - 1; y < H; y++) if (M(x, y) === 2 && (M(x - 1, y) === 3 || M(x + 1, y) === 3 || M(x - 2, y) === 3 || M(x + 2, y) === 3)) blend(x, y, C('#ff7a20'), 0.35);
  // a beira das margens, onde a rocha encosta na lava, arde em brasa
  for (let x = 0; x < W; x++) for (let y = Math.floor(LY(x)) - 6; y < H - 1; y++) if (M(x, y) === 2 && M(x, y + 1) === 3) { put(x, y, rp(EMBER, 0.55 + h2(x, y, 83) * 0.3, x, y)); if (M(x, y - 1) === 2) blend(x, y - 1, C('#ff6a1a'), 0.45); if (M(x, y - 2) === 2) blend(x, y - 2, C('#c83a10'), 0.2); }
  // cristais do caos no rochedo do Príncipe
  const CRIST = P(['#300614', '#580a26', '#8a1040', '#c01c5a', '#ec3a7a', '#ff7aa8', '#ffd0e0']);
  const crystal = (cxp, by, hgt, wd, sd) => { for (let y = by - hgt; y <= by; y++) for (let x = Math.floor(cxp - wd); x <= cxp + wd; x++) { const k = (by - y) / hgt, hw = wd * (k < 0.7 ? 1 - k * 0.3 : (1 - k) / 0.3 * 0.79); if (Math.abs(x - cxp) > hw) continue; put(x, y, rp(CRIST, 0.45 + (x < cxp ? 0.22 : -0.08) + k * 0.25 + (Math.abs(x - cxp + 0.5) < 0.6 ? 0.2 : 0) + (h2(x, y, sd) - 0.5) * 0.15, x, y)); N[y * W + x] = 5; } };
  for (const [x, h, w, a] of [[371, 15, 2.6, 0], [376, 10, 2, 0], [366, 8, 1.8, 0], [380, 6, 1.4, 0], [462, 12, 2.2, 0], [467, 7, 1.6, 0]]) crystal(x, Math.round(yOut(x)) + 1, h, w, x);
  // um monte de crânios na margem do herói
  const skull = (sx, sy, t0) => { for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { if (Math.abs(x) + Math.abs(y) > 3) continue; const X = sx + x, Y = sy + y, L = lightAt(X, Y); put(X, Y, rp(OSSO, (t0 + (x < 0 ? 0.15 : 0) - (y > 0 ? 0.1 : 0)) * (0.3 + (L ? L.a * 0.9 : 0)), X, Y)); N[Y * W + X] = 2; } put(sx - 1, sy, C('#120a08')); put(sx + 1, sy, C('#120a08')); };
  for (const [dx, dy, t] of [[0, 0, 0.7], [5, 0, 0.6], [2, -3, 0.8], [-4, 1, 0.5], [9, 1, 0.5]]) { const x = 212 + dx; skull(x, Math.round(yLedge(x)) - 2 + dy, t); }

  /* ---------- o Príncipe do Caos: o desenho do 109 (pose 8, o chamado), repintado S vezes maior ---------- */
  const RAMP = [
    P(['#12050a', '#260a10', '#421016', '#621a1c', '#862a24', '#aa4232', '#cc6648']),   // 0 pele
    P(['#050507', '#0c0c10', '#16161c', '#22222a', '#32323c', '#484852', '#68687a']),   // 1 ferro
    P(['#140e0a', '#281d14', '#43331f', '#64502f', '#8a7046', '#b29866', '#dccb98']),   // 2 osso
    P(['#3a0c02', '#6e1c04', '#a83a08', '#e06414', '#ff9a2a', '#ffd070', '#fff4c8']),   // 3 fogo
    P(['#14041a', '#2a0834', '#481052', '#6c1a6e', '#962a82', '#c4489a', '#ee86c0']),   // 4 caos
    P(['#090306', '#14060b', '#220a11', '#330f19', '#481622', '#5e202c', '#7a2e38']),   // 5 asa
    P(['#100308', '#22060e', '#380a14', '#52101a', '#701a20', '#90282a', '#ac3c34'])    // 6 pano
  ];
  const [PELE, FER, OSS, FOGO, CAO, ASA, PANO] = [0, 1, 2, 3, 4, 5, 6];
  const BR = new Int8Array(BW * BH).fill(-1), BV = new Float32Array(BW * BH);
  const LXs = -1;   // a luz do jogo vem de cima à esquerda; espelhado, ela tem de continuar vindo da esquerda (a tocha)
  const cg = (x, y, s) => h2(x, y, s) - 0.5;
  const bput = (x, y, r, v) => { if (x < 0 || y < 0 || x >= BW || y >= BH) return; BR[y * BW + x] = r; BV[y * BW + x] = v; };
  const bx = x => (x + OX) * S, by = y => y * S, dxo = X => (X + 0.5) / S - OX, dyo = Y => (Y + 0.5) / S;
  const Q = {
    put(x, y, r, v) { const xi = Math.floor(x), yi = Math.floor(y); for (let Y = Math.floor(by(yi)); Y < Math.floor(by(yi + 1)); Y++) for (let X = Math.floor(bx(xi)); X < Math.floor(bx(xi + 1)); X++) bput(X, Y, r, v); },
    blob(cx0, cy0, rx, ry, r, s, base = 3.4, f) { for (let Y = Math.floor(by(cy0 - ry)); Y <= by(cy0 + ry); Y++) for (let X = Math.floor(bx(cx0 - rx)); X <= bx(cx0 + rx); X++) { const px = dxo(X), py = dyo(Y), dx = (px - cx0) / rx, dy = (py - cy0) / ry, d = dx * dx + dy * dy; if (d > 1) continue; const e = f ? f(Math.floor(px), Math.floor(py), dx, dy) : 0; if (e === null) continue; bput(X, Y, r, base + 1.3 - (LXs * dx * 0.8 + dy) * 1.4 - d * 0.7 + cg(X, Y, s) * 0.5 + e); } },
    tube(ax, ay, bx2, by2, r0, r1, r, s, base = 3.2, f) {
      const m = Math.max(r0, r1) + 1, vx = bx2 - ax, vy = by2 - ay, L2 = vx * vx + vy * vy || 1;
      for (let Y = Math.floor(by(Math.min(ay, by2) - m)); Y <= by(Math.max(ay, by2) + m); Y++) for (let X = Math.floor(bx(Math.min(ax, bx2) - m)); X <= bx(Math.max(ax, bx2) + m); X++) {
        const px = dxo(X), py = dyo(Y), t = cl(((px - ax) * vx + (py - ay) * vy) / L2, 0, 1), qx = ax + vx * t, qy = ay + vy * t, rr = r0 + (r1 - r0) * t;
        const nx = (px - qx) / rr, ny = (py - qy) / rr, d = nx * nx + ny * ny; if (d > 1) continue;
        const e = f ? f(Math.floor(px), Math.floor(py), t, nx, ny) : 0; if (e === null) continue;
        bput(X, Y, r, base + 0.9 - (LXs * nx * 0.8 + ny) * 1.5 - d * 0.8 + cg(X, Y, s) * 0.5 + e);
      } },
    curve(ax, ay, kx, ky, bx2, by2, r0, r1, r, s, vf) { const n = Math.ceil(Math.hypot(kx - ax, ky - ay) + Math.hypot(bx2 - kx, by2 - ky)) * 2; let px = ax, py = ay;
      for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t, x = u * u * ax + 2 * u * t * kx + t * t * bx2, y = u * u * ay + 2 * u * t * ky + t * t * by2, tp = (i - 1) / n; Q.tube(px, py, x, y, r0 + (r1 - r0) * tp, r0 + (r1 - r0) * t, r, s, vf(tp)); px = x; py = y; } },
    poly(pts, r, fn) { const sp = pts.map(([x, y]) => [bx(x), by(y)]); let y0 = 1e9, y1 = -1e9; for (const [, y] of sp) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      for (let Y = Math.floor(y0); Y <= Math.ceil(y1); Y++) { const yc = Y + 0.5, xs = [];
        for (let i = 0; i < sp.length; i++) { const [ax, ay] = sp[i], [bx2, by2] = sp[(i + 1) % sp.length]; if ((ay <= yc) !== (by2 <= yc)) xs.push(ax + (yc - ay) / (by2 - ay) * (bx2 - ax)); }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let X = Math.round(xs[k]); X < Math.round(xs[k + 1]); X++) { const v = fn(Math.floor(dxo(X)), Math.floor(dyo(Y)), X, Y); if (v !== null) bput(X, Y, r, v); } } },
    line(x0, y0, x1, y1, r, v) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * S * 2)); for (let i = 0; i <= n; i++) { const vv = typeof v === 'function' ? v(i / n) : v, X = bx(x0 + (x1 - x0) * i / n + 0.5), Y = by(y0 + (y1 - y0) * i / n + 0.5); for (let a = -0.5; a <= 0.5; a += 0.5) for (let b = -0.5; b <= 0.5; b += 0.5) bput(Math.floor(X + a), Math.floor(Y + b), r, vv); } },
    // rachaduras de fogo pela pele: cristas finas de um ruído liso
    veins(r, F, sd, cell, thr) { for (let Y = 0; Y < BH; Y++) for (let X = 0; X < BW; X++) { const k = Y * BW + X; if (BR[k] !== r) continue; const n = Math.abs(vn(X / (cell * S), Y / (cell * S), sd) - 0.5); if (n < thr) { BR[k] = F; BV[k] = n < thr * 0.4 ? 5.4 : 4.4; } else if (n < thr * 1.8) BV[k] += 0.8; } }
  };
  // a pose 8 do 109: a espada erguida bem alto, a mão livre arranhando o ar, as asas abertas, a boca acesa
  const GY = 87;
  const PO = { legN: [[63, 54], [70, 64], [66, 75], [72, GY - 1]], legF: [[56, 54], [55, 65], [48, 75], [50, GY - 1]], armN: [[70, 33], [79, 38], [88, 40]], armF: [[51, 31], [43, 24], [38, 17]], sword: [[88, 40], [116, 50]], hot: 0.7 };
  const s = 9601 + 8 * 7, dark = -0.9, head = HEAD, shN = PO.armN[0], shF = PO.armF[0];
  /* ---- as asas ---- */
  const wing = (dx, dy, far) => {
    const v0 = far ? -1.1 : 0, root = [54 + dx, 30 + dy];
    const Wd = { e: [-10, -10], w: [-20, -24], t: [[-54, -26], [-52, -8], [-44, 8], [-30, 18]] };
    const sc = far ? 0.86 : 1, elbow = [root[0] + Wd.e[0] * sc, root[1] + Wd.e[1] * sc], wrist = [root[0] + Wd.w[0] * sc, root[1] + Wd.w[1] * sc], tips = Wd.t.map(([a, b]) => [root[0] + a * sc, root[1] + b * sc]);
    const back = [root[0] - 2, root[1] + 20], pts = [root, elbow, wrist];
    for (let i = 0; i < tips.length; i++) { pts.push(tips[i]); const nx = i + 1 < tips.length ? tips[i + 1] : back, mx = (tips[i][0] + nx[0]) / 2, my = (tips[i][1] + nx[1]) / 2; pts.push([mx + (wrist[0] - mx) * 0.22, my + (wrist[1] - my) * 0.22]); }
    pts.push(back);
    Q.poly(pts, ASA, (x, y, X, Y) => { const d = Math.hypot(x - wrist[0], y - wrist[1]); return 3.7 + v0 - d * 0.035 + (vn(X / (7 * S), Y / (7 * S), s + 5) - 0.5) * 1.4 + cg(X, Y, s + 6) * 0.6 + (h2(X >> 1, Y >> 1, s + 7) < 0.02 ? -1.5 : 0); });
    for (const t of tips) Q.line(wrist[0], wrist[1], t[0], t[1], ASA, 1.4 + v0);
    const wb = v0 - 0.6;   // os ossos da asa um tom abaixo, para os chifres se destacarem deles
    Q.tube(root[0], root[1], elbow[0], elbow[1], 2.4, 2, OSS, s + 8, 3 + wb);
    Q.tube(elbow[0], elbow[1], wrist[0], wrist[1], 2, 1.5, OSS, s + 9, 3.3 + wb);
    tips.forEach((t, i) => Q.tube(wrist[0], wrist[1], t[0], t[1], 1.2, 0.6, OSS, s + 10 + i, 3 + wb - i * 0.2));
    Q.blob(wrist[0], wrist[1], 1.8, 1.8, OSS, s + 15, 3.6 + v0);
    Q.curve(wrist[0], wrist[1], wrist[0] + 2, wrist[1] - 4, wrist[0] + 5, wrist[1] - 5, 1.2, 0.5, OSS, s + 16, t => 4.4 + v0 + t);
  };
  wing(12, -7, true);
  /* ---- a cauda: sai de baixo do cinto, enrola para trás, ponta farpada ---- */
  { const a = [55, 52], k1 = [a[0] - 16, a[1] + 4], b = [a[0] - 20, 70];
    Q.curve(a[0], a[1], k1[0], k1[1], b[0], b[1], 2.4, 1, PELE, s + 20, t => 2.4 - t * 0.6);
    Q.poly([[b[0] + 1, b[1] - 1], [b[0] - 5, b[1] + 1], [b[0] - 2, b[1] + 6], [b[0] - 1, b[1] + 3]], OSS, (x, y, X, Y) => 3.6 - (y - b[1]) * 0.25 + cg(X, Y, s) * 0.5); }
  wing(0, 0, false);
  /* ---- pernas e braços ---- */
  const leg = (L, v0, sd) => { const [hp, kn, hk, to] = L;
    Q.tube(hp[0], hp[1], kn[0], kn[1], 5, 3.6, PELE, sd, 3.2 + v0, (x, y, t, nx) => (Math.abs(nx + 0.2) < 0.12 && t > 0.2 ? -0.7 : 0));
    Q.tube(kn[0], kn[1], hk[0], hk[1], 3.6, 2.6, FER, sd + 1, 3.2 + v0, (x, y, t) => ((t * 10 | 0) % 3 === 0 ? 0.7 : 0));
    Q.blob(kn[0] + 0.5, kn[1], 3.4, 3, FER, sd + 2, 3.8 + v0);
    Q.curve(kn[0] + 1, kn[1] - 1, kn[0] + 5, kn[1] - 1, kn[0] + 6, kn[1] - 5, 1.4, 0.4, OSS, sd + 3, t => 3.6 + v0 + t * 1.6);
    Q.tube(hk[0], hk[1], to[0] - 1, to[1] - 2, 2.6, 2.2, PELE, sd + 4, 2.8 + v0);
    Q.poly([[to[0] - 5, to[1] - 3], [to[0] + 2, to[1] - 4], [to[0] + 4, to[1] + 1], [to[0] - 5, to[1] + 1]], OSS, (x, y, X, Y) => 2.2 + v0 - (y - to[1]) * 0.3 + (x - to[0]) * -0.1 + cg(X, Y, sd) * 0.5);
    Q.put(to[0] - 1, to[1], OSS, 0.4); Q.put(to[0] - 1, to[1] - 1, OSS, 0.6); };
  const arm = (A, v0, sd, hand) => { const [sh, el, hd] = A;
    Q.tube(sh[0], sh[1], el[0], el[1], 3.8, 3.2, PELE, sd, 3.3 + v0, (x, y, t, nx, ny) => (Math.abs(ny - 0.1) < 0.1 && t > 0.3 && t < 0.8 ? -0.6 : 0));
    Q.tube(el[0], el[1], hd[0], hd[1], 3.4, 2.6, FER, sd + 1, 3 + v0, (x, y, t) => (t > 0.15 && ((t * 12) | 0) % 4 === 0 ? 0.9 : 0));
    Q.blob(el[0], el[1], 2.8, 2.6, PELE, sd + 2, 3 + v0);
    const ln = Math.hypot(hd[0] - el[0], hd[1] - el[1]) || 1, ux = (hd[0] - el[0]) / ln, uy = (hd[1] - el[1]) / ln;
    for (let j = 0; j < 3; j++) { const ex = el[0] + ux * (3 + j * 2.4), ey = el[1] + uy * (3 + j * 2.4); Q.put(ex - uy * 2.6, ey + ux * 2.6, OSS, 4 + v0); }
    if (hand === 'open') { Q.blob(hd[0], hd[1], 2.6, 2.4, PELE, sd + 3, 3 + v0);
      for (let j = -1; j <= 1; j++) { const a = Math.atan2(uy, ux) + j * 0.7; Q.curve(hd[0] + Math.cos(a) * 2, hd[1] + Math.sin(a) * 2, hd[0] + Math.cos(a) * 4.5, hd[1] + Math.sin(a) * 4.5, hd[0] + Math.cos(a + 0.6) * 6, hd[1] + Math.sin(a + 0.6) * 6, 0.9, 0.4, OSS, sd + 4 + j, t => 3.6 + v0 + t * 1.5); } }
    else Q.blob(hd[0], hd[1], 2.8, 2.6, PELE, sd + 3, 3.2 + v0); };
  arm(PO.armF, dark, s + 30, 'open');
  Q.blob(shF[0], shF[1] - 1, 5, 4, FER, s + 34, 2.8);
  leg(PO.legF, dark - 0.2, s + 40);
  /* ---- a tanga de pano vermelho rasgado ---- */
  { const ax = 59, ay = 50; Q.poly([[ax - 4, ay], [ax + 6, ay], [ax + 8, ay + 15], [ax + 4, ay + 13], [ax + 2, ay + 17], [ax - 1, ay + 12], [ax - 4, ay + 15]], PANO, (x, y, X, Y) => 3.4 - (y - ay) * 0.08 + Math.sin(x * 1.3) * 0.5 + cg(X, Y, s + 50) * 0.6 - (x > ax + 3 ? 0.6 : 0)); }
  leg(PO.legN, 0, s + 60);
  /* ---- o tronco: barriga em gomos, peitoral de ferro negro com o cristal do caos, cinto com fivela de crânio ---- */
  { const w0 = [59, 50], ch = [60, 37];
    Q.tube(w0[0], w0[1], ch[0], ch[1] + 2, 7, 9, PELE, s + 70, 3, (x, y, t, nx) => t < 0.55 && Math.abs(nx - 0.15) < 0.08 ? -1.1 : t < 0.55 && ((((y - w0[1]) + 40) % 4) === 0) && Math.abs(nx) < 0.5 ? -0.7 : 0);
    Q.blob(ch[0] + 1, ch[1] - 1, 10.5, 8, FER, s + 71, 3.2, (x, y, dx, dy) => (Math.abs(dy - 0.05) < 0.09 && dx > -0.6 ? 1.6 : 0) + (dy > 0.6 ? -1 : 0) + (Math.abs(dx - 0.05) < 0.07 ? -1.4 : 0));
    for (let j = -2; j <= 2; j++) Q.put(ch[0] + 1 + j * 4, ch[1] + 5, FOGO, 4.6 - Math.abs(j) * 0.4);
    Q.poly([[ch[0] + 2, ch[1] - 6], [ch[0] + 5, ch[1] - 2], [ch[0] + 2, ch[1] + 3], [ch[0] - 1, ch[1] - 2]], CAO, (x, y, X, Y) => 4.6 - (X / S - OX - ch[0] - 2) * 0.35 - (Y / S - ch[1] + 2) * 0.3 + cg(X, Y, s + 72) * 0.6);
    Q.put(ch[0] + 1, ch[1] - 3, CAO, 6.4); Q.put(ch[0] + 2, ch[1] - 4, CAO, 6.4);
    for (let x = Math.round(w0[0] - 8); x <= w0[0] + 8; x++) for (let y = Math.round(w0[1] - 2); y <= w0[1]; y++) Q.put(x, y, FER, 3 + (y === Math.round(w0[1] - 2) ? 1.2 : 0) + cg(x, y, s + 73) * 0.5);
    Q.blob(w0[0] + 3, w0[1] - 1, 2.6, 2.4, OSS, s + 74, 4); Q.put(w0[0] + 2, w0[1] - 1, FOGO, 5.4); Q.put(w0[0] + 4, w0[1] - 1, FOGO, 5.4); Q.put(w0[0] + 3, w0[1] + 1, OSS, 1);
    Q.poly([[w0[0] + 1, w0[1] + 1], [w0[0] + 8, w0[1] + 1], [w0[0] + 9, w0[1] + 8], [w0[0] + 3, w0[1] + 9]], FER, (x, y, X, Y) => 3.6 - (y - w0[1]) * 0.12 - (x - w0[0]) * 0.06 + ((y - w0[1]) % 3 === 0 ? -1 : 0) + cg(X, Y, s + 75) * 0.5); }
  /* ---- a cabeça: chifres enormes, focinho comprido, coroa de cristais do caos, olho de fogo, a boca aberta com fogo dentro ---- */
  const drawHead = () => {
    const R = Rh;
    const nb = [61, 31]; Q.tube(nb[0], nb[1], head[0] - 1, head[1] + 2, 5, 4, PELE, s + 80, 2.6);
    const horn = (hbx, hby, far) => { const v = far ? -1.1 : 0, rd = far ? 0.85 : 1;
      const p0 = R(hbx, hby), p1 = R(hbx - 8, hby - 1), p2 = R(hbx - 13, hby - 7), p3 = R(hbx - 14.5, hby - 15), p4 = R(hbx - 10, hby - 19.5);
      Q.curve(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], 3 * rd, 2.1 * rd, OSS, s + (far ? 81 : 82), t => 3.3 + v + t * 1.2 - (((t * 8) | 0) % 2 ? 0.8 : 0));
      Q.curve(p2[0], p2[1], p3[0], p3[1], p4[0], p4[1], 2.1 * rd, 0.5, OSS, s + (far ? 83 : 84), t => 4.3 + v + t * 2.2 - (((t * 7) | 0) % 2 ? 0.6 : 0)); };
    horn(2.4, -4.6, true);
    { const e0 = R(-3, 0), e1 = R(-9, -3.6); Q.tube(e0[0], e0[1], e1[0], e1[1], 1.8, 0.5, PELE, s + 85, 2.4); }
    const sk = R(0, 0); Q.blob(sk[0], sk[1], 5.6, 5.4, PELE, s + 86, 3.4);
    const jopen = 2.6;
    const up = R(5.2, 1.6); Q.blob(up[0], up[1], 4.6, 2.6, PELE, s + 87, 3.4);
    const nose = R(9.4, 1); Q.blob(nose[0], nose[1], 1.4, 1.4, PELE, s + 88, 3.6);
    for (let i = 0; i < 16; i++) for (let j = 0; j <= 6; j++) { const [x, y] = R(1.6 + i * 0.5, 3.6 + j * 0.5); Q.put(x, y, FOGO, 5.8 - i * 0.12 - j * 0.15); }   // o fogo lá dentro
    const lo = R(4.2, 4.6 + jopen); Q.blob(lo[0], lo[1], 4.4, 1.7, PELE, s + 89, 2.4);
    for (const fx of [3, 5.4, 7.6]) { const [x, y] = R(fx, 3.6); Q.put(x, y, OSS, 5.6); const [x1, y1] = R(fx, 4.4); Q.put(x1, y1, OSS, 4.4); }
    for (const fx of [4.2, 6.6]) { const [x, y] = R(fx, 3.6 + jopen); Q.put(x, y, OSS, 5); }
    const b0 = R(0.6, -2.6), b1 = R(6.4, -1.2); Q.tube(b0[0], b0[1], b1[0], b1[1], 1.5, 1.1, PELE, s + 90, 4.4);
    const ey = R(4.2, -0.4); Q.put(ey[0], ey[1], FOGO, 6.6); Q.put(ey[0] - 1, ey[1], FOGO, 5.2); Q.put(ey[0] + 1, ey[1], FOGO, 4.4);
    for (let i = 0; i < 3; i++) { const [x, y] = R(-1 + i * 1.6, 5 + jopen * 0.6); const [x2, y2] = R(-2 + i * 1.6, 7.4 + jopen * 0.6 + (i === 1 ? 1 : 0)); Q.line(x, y, x2, y2, OSS, 3.4 - i * 0.3); }
    horn(-0.6, -3.8, false);
    for (let i = -3; i <= 3; i++) { const [x, y] = R(i, -5); Q.put(x, y, FER, 3.6 + (i < 0 ? 0.6 : 0)); }
    for (const [ccx, hgt] of [[-2.2, 3], [0.4, 5], [2.8, 3.4]]) for (let j = 0; j < hgt; j++) { const [x, y] = R(ccx, -6 - j); Q.put(x, y, CAO, 3.6 + j * 0.7); const [x2, y2] = R(ccx + 0.9, -6 - j + 0.4); if (j < hgt - 1) Q.put(x2, y2, CAO, 2.4); }
    for (let i = 0; i < 5; i++) { const x = nb[0] - 6 + i * 2.6, y = nb[1] + 1 - Math.abs(i - 2) * 0.4; Q.put(x, y, FER, 4); Q.put(x, y - 1, FER, 3); Q.put(x + 0.4, y - 2, OSS, 4.6); }
  };
  /* ---- a espada: lâmina negra comprida e ondulada, gumes em brasa, guarda de dois chifres ---- */
  const BLADEPTS = [];
  const sword = () => {
    const [hh, tt] = PO.sword, ddx = tt[0] - hh[0], ddy = tt[1] - hh[1], L = Math.hypot(ddx, ddy), ux = ddx / L, uy = ddy / L, px = -uy, py = ux, hot = PO.hot;
    Q.tube(hh[0] - ux * 6, hh[1] - uy * 6, hh[0] + ux, hh[1] + uy, 1.2, 1.2, FER, s + 90, 2.6, (x, y, t) => (((t * 8) | 0) % 2 ? -0.8 : 0.4));
    Q.blob(hh[0] - ux * 7, hh[1] - uy * 7, 1.8, 1.8, CAO, s + 91, 3.8);
    const B0 = 4, n = Math.ceil(L * 2 * S);
    for (let i = 0; i <= n; i++) {
      const d = B0 + (L - B0) * i / n, f = (d - B0) / (L - B0), hw = (2.8 + Math.sin(d * 0.8) * 0.5) * (f > 0.72 ? (1 - f) / 0.28 : 1) + (f > 0.72 ? 0.3 : 0);
      for (let w = -hw; w <= hw; w += 0.3) {
        const x = hh[0] + ux * d + px * w, y = hh[1] + uy * d + py * w, e = Math.abs(w) / Math.max(0.5, hw), X = Math.floor(bx(x + 0.5)), Y = Math.floor(by(y + 0.5));
        if (e > 0.62) { bput(X, Y, FOGO, 3.2 + hot * 2.4 + (w < 0 ? 0.8 : -0.2) + cg(X, Y, s + 92) * 0.6 - (1 - f) * 0.2); if (e > 0.9 && i % 3 === 0) BLADEPTS.push(toScr(x, y)); }
        else bput(X, Y, FER, 1.6 + hot * 1.4 + (w < 0 ? 0.8 : 0) + (Math.abs(w) < 0.4 ? 1 : 0) + cg(X, Y, s + 93) * 0.6);
      }
      if (Math.round(i / S) % 9 === 4 && f < 0.7) Q.put(hh[0] + ux * d, hh[1] + uy * d, FOGO, 5.2);   // runas queimando no sulco
    }
    for (const sg of [-1, 1]) { const gx = hh[0] + ux * 3, gy = hh[1] + uy * 3; Q.curve(gx, gy, gx + px * sg * 5, gy + py * sg * 5, gx + px * sg * 6 + ux * 3, gy + py * sg * 6 + uy * 3, 1.6, 0.5, FER, s + 94 + sg, t => 3.6 + t * 1.6); }
    Q.blob(hh[0] + ux * 3, hh[1] + uy * 3, 1.8, 1.8, CAO, s + 96, 4.2);
  };
  const pauldron = () => {
    Q.blob(shN[0] - 0.5, shN[1] - 1.5, 6.4, 5, FER, s + 100, 3.6, (x, y, dx, dy) => (dy > 0.3 && dy < 0.5 ? -1.2 : 0) + (dy < -0.5 ? 0.8 : 0));
    for (const [ox, oy, kx, ky] of [[-5, -2, -11, -6], [-2, -4, -7, -10], [1, -4, -2, -9]]) Q.curve(shN[0] + ox, shN[1] + oy, shN[0] + ox + (kx - ox) * 0.4, shN[1] + oy + (ky - oy) * 0.6, shN[0] + kx, shN[1] + ky, 1.6, 0.4, OSS, s + 101 + ox, t => 3 + t * 2.6);
    Q.put(shN[0] + 2, shN[1], FOGO, 5); Q.put(shN[0] - 2, shN[1] + 1, FOGO, 4.6);
  };
  pauldron(); drawHead(); sword(); arm(PO.armN, 0, s + 110, 'grip');
  Q.veins(PELE, FOGO, 9650, 10, 0.013);
  // a borda: o tom mais escuro de cada rampa em volta do que pintou, e por fora o contorno quase preto
  { const r0 = BR.slice();
    for (let Y = 0; Y < BH; Y++) for (let X = 0; X < BW; X++) { const k = Y * BW + X; if (r0[k] >= 0) continue; let n = -1; if (X > 0 && r0[k - 1] >= 0) n = k - 1; else if (X < BW - 1 && r0[k + 1] >= 0) n = k + 1; else if (Y > 0 && r0[k - BW] >= 0) n = k - BW; else if (Y < BH - 1 && r0[k + BW] >= 0) n = k + BW; if (n < 0) continue; BR[k] = r0[n] === FOGO ? FOGO : r0[n]; BV[k] = r0[n] === FOGO ? 2 : 0; }
    const r1 = BR.slice();
    for (let Y = 0; Y < BH; Y++) for (let X = 0; X < BW; X++) { const k = Y * BW + X; if (r1[k] >= 0) continue; if ((X > 0 && r1[k - 1] >= 0) || (X < BW - 1 && r1[k + 1] >= 0) || (Y > 0 && r1[k - BW] >= 0) || (Y < BH - 1 && r1[k + BW] >= 0)) { BR[k] = 7; BV[k] = 0; } } }
  // no quadro: aceso pela tocha, pela espada e pelo rio por baixo; o fogo dele brilha sozinho
  const OUTC = C('#050203');
  for (let Y = 0; Y < BH; Y++) for (let X = 0; X < BW; X++) {
    const k = Y * BW + X, r = BR[k]; if (r < 0) continue;
    const sx = BX0 + BW - 1 - X, sy = BY0 + Y; if (!inb(sx, sy)) continue;
    if (r === 7) { put(sx, sy, OUTC); N[sy * W + sx] = 5; continue; }
    const v = BV[k], pal = RAMP[r];
    let c;
    if (r === FOGO || (r === CAO && v > 4.5)) c = rp(pal, v / 6, sx, sy);
    else { const L = lightAt(sx, sy), lit = L ? Math.min(1.4, L.a) : 0;
      // de baixo, o rio acende as bordas viradas para baixo e para a fenda
      const under = (Y + 2 < BH && BR[(Y + 2) * BW + X] < 0) ? lavaGlow(sx, sy) * 0.9 : 0, side = (X + 2 < BW && BR[k + 2] < 0) ? 0.25 + lavaGlow(sx, sy) * 0.5 : 0;   // a borda virada para o herói pega a tocha e o rio
      c = rp(pal, cl(v / 6 * (0.6 + lit * 0.5) + under * 0.25 + side * 0.25, 0, 1), sx, sy);
      if (L) c = mix(c, L.c, qa(Math.min(0.35, L.a * 0.3), sx, sy, 6)); }
    put(sx, sy, c); N[sy * W + sx] = 5;
  }

  /* ---------- o herói, na margem, tocha erguida ---------- */
  const HK = [ // o herói já com o Conjunto do Eclipse, com o Montante do Eclipse nas costas
    '..c....c......',
    'g.cdddddc.....',
    'h.dDDDDDd.....',
    'hdDgggggd...t.',
    'ggDDDDDDd...t.',
    'cBdddyyd....t.',
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
  const HC = { h: '#4a2a62', s: '#e2a982', W: '#f2ead8', e: '#1c1422', m: '#a5604a', n: '#8a6a48', r: '#6e5a44', b: '#3a2618', k: '#c8a050', p: '#4b3b33', f: '#2a1c14', t: '#5a3a1e', D: '#2a1e3c', d: '#110a18', g: '#e0b048', c: '#ffc860', y: '#ffe090', B: '#241834' };
  for (let j = 0; j < HK.length; j++) for (let i = 0; i < HK[j].length; i++) { const ch = HK[j][i]; if (!HC[ch]) continue;
    let c = C(HC[ch]); const X = HERO.x + i, Y = HERO.y + j;
    if (!'Wecy'.includes(ch)) { const lx = (i - 4) / 10, up = (21 - j) / 21; c = mix(c, lx > 0.2 || up > 0.7 ? C('#ffc888') : C('#160e10'), lx > 0.2 || up > 0.7 ? cl(lx * 0.3 + up * 0.15, 0, 0.35) : 0.4); }
    if (ch === 'h' && (i + j) % 4 === 0) c = mix(c, C('#2a160c'), 0.4);
    if (j > 15 && i > 6) c = mix(c, C('#ff6a2a'), 0.12);   // o rio esquenta as pernas do lado da fenda
    put(X, Y, c); N[Y * W + X] = 6; }
  for (let x = HERO.x - 22; x < HERO.x + 2; x++) { const y = Math.round(yLedge(x)) + 1; if (M(x, y) === 2) blend(x, y, C('#050304'), 0.6 * (1 - (HERO.x + 2 - x) / 26)); }

  /* ---------- longe da luz, tudo some no escuro; a esquerda fica para o nome e o menu ---------- */
  const DARK = C('#030204');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = N[y * W + x]; if (n === 6 || n === 3 || n === 7) continue;
    const L = lightAt(x, y); const lit = (L ? L.a : 0) + (n === 0 ? 0.32 : n === 1 ? 0.24 : n === 5 ? 0.3 : 0.08);
    const left = cl((160 - x) / 140, 0, 1) * 0.55;
    const dk = cl(0.7 - lit * 2.2 + left, 0, 0.93);
    if (dk > 0) put(x, y, mix(get(x, y), DARK, qa(dk, x, y, 8)));
  }
  // a lava da esquerda (se aparecer) também se apaga para o menu
  for (let y = 180; y < H; y++) for (let x = 0; x < 150; x++) if (N[y * W + x] === 3) put(x, y, mix(get(x, y), DARK, qa(cl((150 - x) / 80, 0, 0.9), x, y, 6)));
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
  const mkGlow = (r, rgb, k) => { const g = document.createElement('canvas'); g.width = g.height = r * 2; const gx = g.getContext('2d'); for (let y = 0; y < r * 2; y++) for (let x = 0; x < r * 2; x++) { const d = Math.hypot(x - r, y - r) / (r * 0.84); const a = qa(cl(1 - d, 0, 1), x, y, 4); if (a > 0) { gx.fillStyle = `rgba(${rgb},${a * k})`; gx.fillRect(x, y, 1, 1); } } return g; };
  const glow = mkGlow(36, '255,160,70', 0.06), sGlow = mkGlow(30, '255,110,30', 0.05), eGlow = mkGlow(6, '255,200,90', 0.25);
  const FL = ['#fff4c0', '#ffd27a', '#f39a3a', '#d0601e', '#8a2e10'];
  const parts = [], bubbles = [];
  const GAP = [302, 366];   // a fenda do rio entre as margens
  const imps = [{ x: 205, y: 92, ph: 0 }, { x: 236, y: 120, ph: 2.1 }];
  let blinkAt = 3;
  function frame(fx, t, dt) {
    dt = Math.min(dt, 0.1);
    // chama da tocha
    const tx = TORCH.x, ty = TORCH.y;
    fx.globalAlpha = 0.8 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.1; fx.drawImage(glow, tx - 36, ty - 36); fx.globalAlpha = 1;
    for (let j = 0; j < 5; j++) { const w = j < 1 ? 1 : j < 3 ? 2 : 1, sway = Math.round(Math.sin(t * 7 + j) * (j / 4) * 1.2); fx.fillStyle = FL[Math.min(4, j + (Math.sin(t * 15 + j * 2) > 0.5 ? 1 : 0))]; fx.fillRect(tx - (w > 1 ? 1 : 0) + sway, ty - j, w, 1); }
    if (Math.random() < dt * 6) parts.push({ x: tx + (Math.random() - 0.5) * 2, y: ty - 4, vx: (Math.random() - 0.5) * 6, vy: -(8 + Math.random() * 10), t: 0, life: 0.6 + Math.random() * 0.8 });
    // brasas subindo do rio de fogo
    if (parts.length < 46 && Math.random() < dt * 14) { const x = GAP[0] + Math.random() * (GAP[1] - GAP[0]); parts.push({ x, y: LY(x) - 1, vx: (Math.random() - 0.5) * 8, vy: -(10 + Math.random() * 22), t: 0, life: 1.5 + Math.random() * 2.5 }); }
    // o fogo lambendo os gumes da espada
    if (parts.length < 60 && Math.random() < dt * 18 && BLADEPTS.length) { const [x, y] = BLADEPTS[(Math.random() * BLADEPTS.length) | 0]; parts.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: -(6 + Math.random() * 10), t: 0, life: 0.3 + Math.random() * 0.4 }); }
    for (let i = parts.length - 1; i >= 0; i--) { const m = parts[i]; m.t += dt; if (m.t > m.life) { parts.splice(i, 1); continue; } m.x += (m.vx + Math.sin(m.t * 3 + i) * 2) * dt; m.y += m.vy * dt;
      const f = m.t / m.life; fx.globalAlpha = 1 - f * f; fx.fillStyle = FL[Math.min(4, (f * 5) | 0)]; fx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); }
    fx.globalAlpha = 1;
    // o brilho da espada e da boca pulsando
    fx.globalAlpha = 0.55 + Math.sin(t * 5.3) * 0.15 + Math.sin(t * 13) * 0.08; fx.drawImage(sGlow, Math.round(BLADE[0]) - 30, Math.round(BLADE[1]) - 30); fx.drawImage(sGlow, MOUTH[0] - 30, MOUTH[1] - 30); fx.globalAlpha = 1;
    // o olho do Príncipe: arde, e de vez em quando pisca
    if (t > blinkAt + 0.18) blinkAt = t + 3 + Math.random() * 5;
    if (!(t > blinkAt && t < blinkAt + 0.18)) { fx.globalAlpha = 0.7 + Math.sin(t * 2.2) * 0.25; fx.drawImage(eGlow, EYE[0] - 6, EYE[1] - 6); fx.fillStyle = '#fff4c8'; fx.fillRect(EYE[0], EYE[1], 1, 1); fx.globalAlpha = 1; }
    else { fx.fillStyle = '#260a10'; fx.fillRect(EYE[0] - 2, EYE[1] - 1, 4, 2); }
    // bolhas estourando no rio
    if (bubbles.length < 4 && Math.random() < dt * 1.6) { const x = GAP[0] + 4 + Math.random() * (GAP[1] - GAP[0] - 8); bubbles.push({ x: Math.round(x), y: Math.round(LY(x)) + 1 + ((Math.random() * 10) | 0), t: 0 }); }
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.t += dt; if (b.t > 0.9) { bubbles.splice(i, 1); continue; }
      if (b.t < 0.6) { const r = b.t < 0.3 ? 1 : 2; fx.fillStyle = '#ffd070'; fx.fillRect(b.x - r, b.y - r + 1, r * 2 + 1, r); fx.fillStyle = '#fff0a0'; fx.fillRect(b.x, b.y - r, 1, 1); }
      else { fx.globalAlpha = 1 - (b.t - 0.6) / 0.3; fx.fillStyle = '#ff9a2a'; fx.fillRect(b.x - 3, b.y - 1, 1, 1); fx.fillRect(b.x + 3, b.y - 1, 1, 1); fx.fillRect(b.x - 1, b.y - 3, 1, 1); fx.fillRect(b.x + 1, b.y - 2, 1, 1); fx.globalAlpha = 1; } }
    // dois diabretes voando ao longe, em zigue-zague nervoso, contra o brilho
    for (const d of imps) { const x = Math.round(d.x + Math.sin(t * 0.7 + d.ph) * 26 + Math.sin(t * 3.1 + d.ph) * 4), y = Math.round(d.y + Math.sin(t * 1.3 + d.ph * 2) * 10), up = Math.sin(t * 22 + d.ph) > 0, dir = Math.cos(t * 0.7 + d.ph) > 0 ? 1 : -1;
      fx.fillStyle = '#1c070a'; fx.fillRect(x - 1, y, 3, 3); fx.fillRect(x + dir, y - 1, 2, 2); fx.fillRect(x - 2 * dir, y + 3, 1, 1);
      if (up) { fx.fillRect(x - 3, y - 2, 2, 1); fx.fillRect(x + 2, y - 2, 2, 1); fx.fillRect(x - 2, y - 1, 1, 1); fx.fillRect(x + 2, y - 1, 1, 1); } else { fx.fillRect(x - 3, y + 1, 2, 1); fx.fillRect(x + 2, y + 1, 2, 1); }
      fx.fillStyle = '#ffd070'; fx.fillRect(x + dir + (dir > 0 ? 1 : 0), y - 1, 1, 1); }
  }
  return { canvas: cv, frame };
}
var TITLE_ARTS = TITLE_ARTS || []; TITLE_ARTS.push(paintTitleArtAbismo);
