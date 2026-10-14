'use strict';
/* tela de título "Under Darkness": a primeira coisa que aparece ao abrir o jogo.
   A arte (480x270) é sorteada a cada abertura entre as de TITLE_ARTS (126-titulo-descida e uma por camada: 128 Cavernas, 135 Catedral, 136 Gelo, 137 Mina, 138 Minas Fúngicas, 139 Abismo, 230 Escuridão;
   cada arquivo se põe na lista), sem repetir a da vez anterior ('ud-titulo-arte'). Os efeitos de cada arte rodam
   numa camada pequena por cima, só enquanto o título está aberto.
   A arte antiga (castelo em ruína, abismo e cavaleiro com capa) continua guardada aqui em paintTitleArt, fora do sorteio;
   ela volta sozinha se a lista ficar vazia.
   O nome é desenhado com a fonte do jogo e sombreado em pixel art (latão envelhecido).
   Menu no canto inferior esquerdo: Continuar (só com save), Novo jogo, Opções, Sair.
   Opções abre a mesma tela de opções do menu de pausa (40-opcoes).
   O antigo cartão #menu fica escondido; "Continuar" e "Novo jogo" usam os mesmos botões dele (24-boot). */
const TITLE_W = 480, TITLE_H = 270;

function paintTitleArt() {
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
  const qa = (a, x, y, n = 4) => Math.floor(cl(a, 0, 1) * n + bay(x, y)) / n;   // alfa em degraus, pontilhado
  const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255; };
  const get = (x, y) => { const i = (y * W + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const blend = (x, y, c, a) => { if (a <= 0 || x < 0 || y < 0 || x >= W || y >= H) return; put(x, y, mix(get(x, y), c, a)); };

  const MOON = { x: 404, y: 62, r: 25 }, GLOW = { x: 262, y: 300 };   // a lua e o brilho do abismo
  const glowAt = (x, y) => { const d = Math.hypot((x - GLOW.x) * 0.8, y - GLOW.y); return cl(1 - (d - 40) / 130, 0, 1); };

  /* ---------- céu ---------- */
  const SKY = P(['#07060c', '#0b0913', '#110d1c', '#181226', '#21152b', '#2d182e', '#3d1c2f', '#52202f', '#6a2830', '#83332e']);
  const HALO = C('#b9a9b8');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 90, y / 40, 3) - 0.5;
    let t = Math.pow(y / 205, 1.6) * 0.95 + n * 0.12;
    const dm = Math.hypot(x - MOON.x, y - MOON.y);
    t += cl(1 - (dm - MOON.r) / 150, 0, 1) * 0.12;
    let c = rp(SKY, t, x, y);
    const halo = Math.exp(-Math.max(0, dm - MOON.r) / 16) * 0.5 + Math.exp(-Math.max(0, dm - MOON.r) / 60) * 0.14;
    c = mix(c, HALO, qa(halo, x, y, 6) * 0.6);
    put(x, y, c);
  }
  // estrelas: poucas e frias, mais no alto
  for (let y = 0; y < 150; y++) for (let x = 0; x < W; x++) {
    const r = h2(x, y, 9), lim = 0.9965 + y / 150 * 0.003;
    if (r > lim && Math.hypot(x - MOON.x, y - MOON.y) > MOON.r + 14) {
      const b = h2(x, y, 10); put(x, y, b > 0.8 ? C('#e8e2f0') : b > 0.4 ? C('#9a93b0') : C('#5d5672'));
      if (b > 0.93 && y < 110) { blend(x - 1, y, C('#6d6688'), 0.6); blend(x + 1, y, C('#6d6688'), 0.6); blend(x, y - 1, C('#6d6688'), 0.6); blend(x, y + 1, C('#6d6688'), 0.6); }
    }
  }
  // lua: osso pálido, mares e crateras, borda de baixo à esquerda mais escura
  const MP = P(['#6f6774', '#958c94', '#b8adaa', '#d6ccbc', '#ece3cf', '#fbf4e2']);
  for (let y = MOON.y - MOON.r - 1; y <= MOON.y + MOON.r + 1; y++) for (let x = MOON.x - MOON.r - 1; x <= MOON.x + MOON.r + 1; x++) {
    const dx = x - MOON.x, dy = y - MOON.y, d = Math.hypot(dx, dy);
    if (d > MOON.r + 0.3) continue;
    const lit = cl(0.75 + (dx * 0.5 - dy * 0.6) / MOON.r * 0.35 - Math.pow(d / MOON.r, 6) * 0.35, 0, 1);
    const mare = fbm(x / 13, y / 13, 41) > 0.56 ? 0.2 : 0;
    const crat = fbm(x / 4, y / 4, 43) > 0.7 ? 0.14 : 0;
    put(x, y, rp(MP, lit - mare - crat, x, y));
  }
  // nuvens: faixas finas e escuras, com a borda acesa perto da lua
  const CLD = P(['#120e19', '#1a1422', '#251c2d', '#3a2d40', '#5e4c62', '#8e7c8a']);
  for (let y = 30; y < 150; y++) for (let x = 0; x < W; x++) {
    const band = Math.exp(-Math.pow((y - 92) / 34, 2));
    const v = fbm(x / 80 + y / 200, y / 7, 51) * 0.85 + fbm(x / 24, y / 4, 53) * 0.25;
    const dens = v * band;
    if (dens < 0.47) continue;
    const above = fbm(x / 80 + (y - 2) / 200, (y - 2) / 7, 51) * 0.85 + fbm(x / 24, (y - 2) / 4, 53) * 0.25;
    const edge = above * Math.exp(-Math.pow((y - 94) / 34, 2)) < 0.47;
    const dm = Math.hypot(x - MOON.x, y - MOON.y), near = cl(1 - (dm - MOON.r) / 120, 0, 1);
    let t = 0.12 + near * 0.35 + (edge ? near * 0.45 : 0) - (dens - 0.47) * 0.8;
    const c = rp(CLD, t, x, y);
    blend(x, y, c, dm < MOON.r + 2 ? 0.9 : 1);
  }

  /* ---------- silhuetas: máscara + sombreado com luz de borda ---------- */
  const ridge = (x, s, sc) => { const n = fbm(x / sc, 0.5, s, 5); return 1 - Math.abs(2 * n - 1); };
  function layer(test) { const m = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(x, y)) m[y * W + x] = 1; return m; }
  const at = (m, x, y) => x < 0 || x >= W ? 1 : y < 0 ? 0 : y >= H ? 1 : m[y * W + x];
  const dist = (m, x, y, dx, dy, max) => { for (let k = 1; k <= max; k++) if (!at(m, x + dx * k, y + dy * k)) return k; return max + 1; };

  // montanhas do fundo (duas camadas), com a névoa vermelha subindo de baixo
  const yA = x => 150 - ridge(x, 61, 70) * 46 - fbm(x / 18, 1, 62) * 10;
  const yB = x => 176 - ridge(x + 300, 71, 46) * 30 - fbm(x / 10, 1, 72) * 6;
  const MA = P(['#1d1628', '#251b31', '#2f2038', '#3d253c', '#4f2b3c']), MB = P(['#100c16', '#161019', '#1e1520', '#291a27', '#371f2b']);
  for (const [f, pal, rim, s] of [[yA, MA, C('#5c4660'), 63], [yB, MB, C('#3e2f44'), 73]]) {
    for (let x = 0; x < W; x++) {
      const top = Math.round(f(x));
      for (let y = top; y < H; y++) {
        const fog = cl((y - top) / 50, 0, 1), tex = fbm(x / 7, y / 5, s) - 0.5;
        let c = rp(pal, fog * 0.85 + tex * 0.25, x, y);
        const lm = (x - MOON.x) / 300;   // as encostas viradas para a lua pegam um pouco de luz
        const slope = f(x + 1) - f(x - 1);
        if (y - top < 4 && slope * Math.sign(lm || 1) < 0) c = mix(c, rim, qa((4 - (y - top)) / 6, x, y, 3));
        put(x, y, y === top ? mix(c, rim, 0.5) : c);
      }
    }
  }
  // névoa baixa
  const FOG = C('#4a2a38');
  for (let y = 150; y < 215; y++) for (let x = 0; x < W; x++) {
    const a = Math.exp(-Math.pow((y - 190) / 14, 2)) * (0.45 + fbm(x / 40, y / 6, 81) * 0.5);
    blend(x, y, FOG, qa(a, x, y, 5) * 0.75);
  }

  // o abismo: tudo abaixo da névoa escurece e depois arde lá no fundo
  const ABY = P(['#0a070c', '#140a0e', '#240c0e', '#3f120f', '#6a1d10', '#9c3414', '#d0601e', '#f39a3a']);
  for (let y = 200; y < H; y++) for (let x = 150; x < 360; x++) {
    const g = glowAt(x, y), fade = cl((y - 200) / 18, 0, 1);
    const t = Math.pow(g, 1.4) * 0.95 + (fbm(x / 9, y / 6, 91) - 0.5) * 0.08;
    const c = rp(ABY, t, x, y);
    blend(x, y, c, qa(fade, x, y, 4));
  }

  // penhasco do castelo + castelo (mesma máscara, recortada contra a lua)
  const yC = x => { const e = Math.max(0, Math.abs(x - 402) - 58); return 131 + e * 1.15 + e * e * 0.02 + (fbm(x / 7, 3, 101) - 0.5) * 9; };
  const rects = [];
  const R = (x0, y0, x1, y1) => rects.push([x0, y0, x1, y1]);
  const crenel = (x0, x1, y) => { for (let x = x0; x <= x1; x += 4) R(x, y - 3, Math.min(x + 1, x1), y); };
  R(342, 113, 462, 131); crenel(342, 462, 113);              // muralha
  R(381, 76, 409, 131); crenel(381, 409, 76);                // torre de menagem
  R(346, 94, 357, 131); R(443, 90, 454, 131); R(414, 86, 422, 131); R(366, 102, 373, 131);
  const cones = [[351.5, 94, 6.5, 74], [448.5, 90, 6.5, 68], [418, 86, 5, 70], [369.5, 102, 4.5, 90], [395, 76, 10, 40]];
  const spikes = [[395, 40, 33], [448, 68, 62], [351, 74, 69], [418, 70, 66]];
  const ruin = (x, y) => x > 457 && y < 120 && h2(x, y >> 1, 5) > 0.35;   // a ponta direita da muralha desabou
  const mC = layer((x, y) => {
    if (x > 290 && y >= yC(x)) return true;
    for (const [a, b, c] of rects) if (x >= a && x <= c && y >= b) return !ruin(x, y);   // as paredes descem até a rocha
    for (const [ccx, base, hw, tip] of cones) if (y <= base && y >= tip) { const w = hw * (y - tip) / (base - tip); if (Math.abs(x + 0.5 - ccx) <= w + 0.3) return true; }
    for (const [sx, from, to] of spikes) if (x === sx && y < from && y >= to) return true;
    return false;
  });
  // janelas acesas
  const WIN = [[388, 86], [400, 86], [394, 98], [388, 108], [350, 104], [449, 99], [417, 94], [403, 118], [430, 120], [369, 110]];
  const winSet = new Set(); for (const [x, y] of WIN) { winSet.add(x + ',' + y); winSet.add(x + ',' + (y + 1)); }
  const STONE = P(['#09070d', '#0e0b13', '#141019', '#1b1520', '#241b28']), CST = P(['#0c0a11', '#14101b', '#1c1726', '#262033', '#322a42', '#41364f']);
  const MOONRIM = P(['#2c2436', '#463a52', '#6c5c78', '#9a8aa0']);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mC[y * W + x]) continue;
    const castle = y < yC(x) - 1;
    let t = 0.08 + (fbm(x / 6, y / 6, 111) - 0.5) * 0.35;
    if (castle) {
      // cada torre é um cilindro: faixa clara do lado da lua, sombra do outro; a base escurece onde encontra a rocha
      let u = -1; for (const [a, b, c] of rects) if (x >= a && x <= c && y >= b && c - a < 32) u = (x - a) / (c - a);
      t = 0.42 + (fbm(x / 6, y / 6, 111) - 0.5) * 0.3 - cl((y - 95) / 45, 0, 1) * 0.2;
      if (u >= 0) t += (0.35 - Math.abs(u - 0.7)) * 0.45;
      if ((y % 3 === 0 || ((x + (Math.floor(y / 3) % 2) * 2) % 4 === 0)) && h2(x, y, 7) > 0.25) t -= 0.13;   // juntas das pedras
      if (yC(x) - y < 4) t -= 0.18;
    } else {
      const st = fbm(x / 22, y / 3.2, 117);   // camadas da rocha: um friso claro em cima, sombra embaixo
      if (st > 0.6) t += 0.35; else if (st > 0.56) t -= 0.12;
    }
    let c = rp(castle ? CST : STONE, t - cl((y - 200) / 70, 0, 1) * 0.1, x, y);
    // luz de borda da lua: lados virados para ela
    const dx = Math.sign(MOON.x - x), dy = Math.sign(MOON.y - y);
    const k = Math.min(dist(mC, x, y, 0, -1, 3), dist(mC, x, y, dx, 0, 3), dist(mC, x, y, dx, dy, 3));
    if (k <= 3) { const near = cl(1 - Math.hypot(x - MOON.x, y - MOON.y) / 260, 0.2, 1); c = mix(c, rp(MOONRIM, near * (1.1 - k * 0.3), x, y), k === 1 ? 0.9 : 0.5); }
    // o brilho do abismo pinta a parede esquerda do penhasco
    const g = glowAt(x, y);
    if (g > 0) { const kl = dist(mC, x, y, -1, 0, 7); if (kl <= 7) c = mix(c, rp(ABY, g * (1 - kl / 8) * 1.05, x, y), qa(g * (1 - kl / 8) * 1.2, x, y, 4)); }
    put(x, y, c);
  }
  for (const [x, y] of WIN) { put(x, y, C('#ffd27a')); put(x, y + 1, C('#e8892e')); blend(x - 1, y, C('#5a2614'), 0.6); blend(x + 1, y, C('#5a2614'), 0.6); blend(x, y + 2, C('#3a160e'), 0.6); }
  // a estrada sobe o penhasco em zigue-zague até o portão
  { let x = 395, y = 131, dir = 1; const ROAD = P(['#1a1420', '#241c2a', '#30263a']);
    while (y < 222) { for (let n = 0, len = 10 + Math.floor(h2(x, y, 77) * 16); n < len && y < 222; n++) { for (let w = 0; w < 2; w++) if (mC[(y + w) * W + x]) put(x, y + w, rp(ROAD, 0.3 + w * 0.3 + h2(x, y, 3) * 0.3, x, y)); x += dir; if (n % 2) y++; } dir = -dir; } }
  // portão em arco, com luz de tocha lá dentro
  for (let j = 0; j < 9; j++) for (let i = -3; i <= 3; i++) { if (j < 3 && Math.abs(i) > j + 1) continue; const y = 122 + j, x = 395 + i; if (mC[y * W + x]) put(x, y, Math.abs(i) === 3 || j === 0 ? C('#08060a') : C(j > 5 ? '#c8682c' : j > 2 ? '#7a3418' : '#3a160e')); }
  // estandarte rasgado no topo da torre
  for (let i = 0; i < 9; i++) { const yy = 34 + Math.round(Math.sin(i * 0.7) * 1); for (let j = 0; j < 3 - (i > 6 ? 1 : 0); j++) put(396 + i, yy + j, i > 5 && j === 2 ? C('#3a0c10') : C('#6e1218')); }
  // corvos rodeando o castelo
  for (const [x, y, s] of [[330, 82, 1], [341, 74, 0], [318, 96, 1], [462, 52, 0], [470, 61, 1], [356, 60, 0]]) {
    const c = C('#0c0910'); put(x, y, c); put(x - 1, y - 1 + s, c); put(x + 1, y - 1 + s, c); put(x - 2, y - 1, c); put(x + 2, y - 1, c);
  }

  // terra do lado direito: túmulos, cruzes, árvores mortas e a beira do abismo
  const yD = x => 224 + (fbm(x / 22, 7, 121) - 0.5) * 8 + Math.max(0, 318 - x) * 0.25;
  const lD = y => 304 + (fbm(y / 7, 9, 123) - 0.5) * 12 + (y - 224) * 0.12;
  const deco = new Uint8Array(W * H);
  const dp = (x, y) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) deco[y * W + x] = 1; };
  function tree(x, y, len, ang, w, depth, s) {
    const steps = Math.round(len);
    let px = x, py = y;
    for (let i = 0; i < steps; i++) { px += Math.cos(ang) * 1; py += Math.sin(ang) * 1; for (let k = 0; k < w; k++) dp(px + k, py); ang += (h2(i, depth, s) - 0.5) * 0.25; }
    if (depth <= 0) return;
    const n = 2 + (h2(depth, s, 3) > 0.6 ? 1 : 0);
    for (let b = 0; b < n; b++) tree(px, py, len * (0.55 + h2(b, depth, s + 1) * 0.25), ang + (b - (n - 1) / 2) * 0.75 + (h2(b, depth, s + 2) - 0.5) * 0.4, Math.max(1, w - 1), depth - 1, s * 3 + b + 1);
  }
  for (const [x, len, dep, s] of [[340, 20, 4, 3], [452, 26, 4, 7], [470, 14, 3, 11]]) { const y = Math.round(yD(x)); for (let k = 0; k < 3; k++) dp(x + k - 1, y); tree(x, y, len * 0.6, -Math.PI / 2 + (h2(x, 1, s) - 0.5) * 0.3, 3, dep, s); }
  const cross = (x, y, h) => { for (let i = 0; i < h; i++) dp(x, y - i); for (let i = -1; i <= 1; i++) dp(x + i, y - h + 2); };
  const stone = (x, y) => { for (let j = 0; j < 5; j++) for (let i = -1; i <= 1; i++) if (!(j === 4 && Math.abs(i) === 1)) dp(x + i, y - j); };
  for (const [x, t] of [[322, 0], [360, 1], [372, 0], [386, 1], [400, 0], [418, 1], [432, 0], [441, 1]]) { const y = Math.round(yD(x)); if (t) cross(x, y, 7 + (x % 3)); else stone(x, y); }
  const mD = layer((x, y) => (y >= yD(x) && x >= lD(y)) || deco[y * W + x] === 1);
  const ROCK = P(['#060408', '#0b080e', '#110c14', '#18111b', '#211722']);
  const COOL = P(['#241d2e', '#3a3048', '#5a4c66']), WARM = P(['#3a1210', '#6e2414', '#a8401c', '#e07a2a', '#ffc060']);
  const shadeNear = (m, pal, x, y, rimDir) => {
    let t = 0.2 + (fbm(x / 5, y / 4, 131) - 0.5) * 0.6;
    if (fbm(x / 26, y / 2.5, 133) > 0.63) t -= 0.2;   // veios da rocha
    let c = rp(pal, t - cl((y - 220) / 60, 0, 1) * 0.2, x, y);
    const ku = dist(m, x, y, 0, -1, 3);
    if (ku <= 3) c = mix(c, rp(COOL, 1 - ku * 0.33, x, y), ku === 1 ? 0.85 : 0.45);
    const g = glowAt(x, y);
    if (g > 0.02) {
      const ks = dist(m, x, y, rimDir, 0, 8);
      if (ks <= 8) { const a = g * (1 - ks / 9); c = mix(c, rp(WARM, a * 1.15, x, y), qa(a * 1.4, x, y, 4)); }
      const kd = dist(m, x, y, rimDir, -1, 4);
      if (kd <= 4) { const a = g * (1 - kd / 5) * 0.8; c = mix(c, rp(WARM, a, x, y), qa(a, x, y, 3)); }
    }
    return c;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mD[y * W + x]) put(x, y, shadeNear(mD, ROCK, x, y, -1));

  // o penhasco da frente, à esquerda, onde o cavaleiro está
  const yE = x => 199 + (fbm(x / 16, 13, 141) - 0.5) * 9 - Math.max(0, 70 - x) * 0.45 + Math.max(0, x - 205) * 0.35;
  const rE = y => 230 - (y - 198) * 0.32 + (fbm(y / 6, 15, 143) - 0.5) * 12;
  const kx = 199, ky = Math.round(yE(kx));
  const mE = layer((x, y) => y >= yE(x) && x <= rE(y));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mE[y * W + x]) put(x, y, shadeNear(mE, ROCK, x, y, 1));
  // capim seco na beira de cima
  for (let x = 0; x < 228; x++) {
    const top = Math.ceil(yE(x)); if (!mE[top * W + x] || h2(x, 2, 151) < 0.55) continue;
    const hgt = 1 + Math.floor(h2(x, 3, 151) * 3), lean = h2(x, 4, 151) > 0.5 ? 1 : 0;
    for (let i = 1; i <= hgt; i++) put(x + (i === hgt ? lean : 0), top - i, i === hgt ? C('#3a3046') : C('#1a1420'));
  }

  // o cavaleiro: de costas para nós, olhando o castelo, a capa batendo no vento, a espada fincada na pedra
  const KN = [
    '..........RR............',
    '........RRRRl...........',
    '......RRR..lml..........',
    '...........lmmml........',
    '...........lmmmmw.......',
    '...........dmmmmw.......',
    '...........ddmmmw.......',
    '............ddmw........',
    '........rRCldmmmlw......',
    '......rrRCldmmmmmlw.....',
    '.....rrRRCdmmmmmmmlw....',
    '....rrrRRCddmmmmmmmlw...',
    '...rrrRRRCddmmmmdmmmlw..',
    '...rrRRRRCddmmmmd.dmmmw.',
    '..rrrRRRRRddmmmmd..dmmw.',
    '..rrRRRRRRddmmmd....gw..',
    '.rrrRRRRRRddmmmd...mmmw.',
    '.rrRRRRRRRdddmmd..gggggw',
    'rrrRRRRRRRdddmmd...lsw..',
    'rrRRRRRRRRddddmd...lsw..',
    '.rrRRRRRRRdd.dmd...lsw..',
    '..rrRRRRRRdd..dmw..lsw..',
    '...rrRRRRRdd..dmw..lsw..',
    '....rrRRRRdd..dmw..lsw..',
    '.....rrRRWdd..dmw..lSw..',
    '......rrRWdd..dmw..lSw..',
    '.......rrWdd..dmw..lSw..',
    '........rddd..ddw..lSw..',
    '........dddd..dddw.SS...'];
  const KC = { d: ['#17161f', '#1c1b25'], m: ['#2c2b37', '#25242f'], l: ['#9aa0ba', '#7c8098'], w: ['#e8873e', '#c8682c'], r: ['#22090d', '#1a070a'], R: ['#3e1016', '#330d12'], C: ['#6a2430', '#5a1e28'], W: ['#b8452a', '#9a3822'], g: ['#b08a40', '#8a6a30'], s: ['#5d6273', '#4e5262'], S: ['#e0a060', '#c08048'] };
  const kh = KN.length, ox = kx - 12, oy = ky - kh;
  // a capa e o penacho (r R C W) não entram na imagem parada: vão para uma lista que a camada de efeitos desenha balançando
  const cape = [];
  const grain = (c, x, y) => { const g = (h2(x, y, 999) - 0.5) * 9; return `rgb(${cl(c[0] + g, 0, 255) | 0},${cl(c[1] + g, 0, 255) | 0},${cl(c[2] + g, 0, 255) | 0})`; };
  for (let j = 0; j < kh; j++) for (let i = 0; i < KN[j].length; i++) {
    const ch = KN[j][i]; if (!KC[ch]) continue;
    const x = ox + i, y = oy + j, pal = KC[ch], c = C(pal[fbm(i / 2, j / 2, 161 + ch.charCodeAt(0)) > 0.58 ? 1 : 0]);
    if ('rRCW'.includes(ch)) cape.push({ x, y, j, col: grain(c, x, y) }); else put(x, y, c);
  }
  put(ox + 14, oy + 5, C('#0a090e')); put(ox + 15, oy + 5, C('#0a090e'));   // fenda do elmo
  // capa rasgada: fiapos soltos ao vento
  for (const [i, j] of [[-1, 17], [-2, 18], [-1, 19], [-2, 21], [0, 22], [1, 24], [3, 26]]) cape.push({ x: ox + i, y: oy + j, j, col: grain(C('#22090d'), ox + i, oy + j) });
  // cada linha da capa presa no ponto mais à direita (ombro/elmo); quanto mais longe dele, mais ela balança
  const anchor = {}; for (const p of cape) anchor[p.y] = Math.max(anchor[p.y] ?? -1, p.x);
  for (const p of cape) { p.ax = anchor[p.y]; p.d = p.ax - p.x; }
  // sombra no chão e um pouco de luz quente na pedra aos pés
  for (let i = 6; i < 22; i++) blend(ox + i, ky, C('#050306'), 0.6);

  /* ---------- acabamento: grão e vinheta em degraus ---------- */
  const VIG = C('#030205');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - W * 0.55) / (W * 0.62), ny = (y - H * 0.45) / (H * 0.62), d = Math.hypot(nx, ny);
    let c = get(x, y);
    const g = (h2(x, y, 999) - 0.5) * 9; c = [c[0] + g, c[1] + g, c[2] + g];
    const v = cl((d - 0.65) / 0.6, 0, 1) * 0.7;
    if (v > 0) c = mix(c, VIG, qa(v, x, y, 5));
    put(x, y, c);
  }
  cx.putImageData(img, 0, 0);
  return { canvas: cv, knight: { x: kx, y: ky }, cape, capeTop: oy };
}

/* nome do jogo em pixel art: letras da fonte do jogo, viradas em latão envelhecido com contorno e sombra */
function paintTitleLogo() {
  const L1 = 'UNDER', L2 = 'DARKNESS', F = '"Jersey 10", "Rubik", sans-serif';
  const W = 236, H = 78;
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
  const t = tmp.getContext('2d');
  t.fillStyle = '#fff'; t.textBaseline = 'alphabetic';
  t.font = `24px ${F}`; const w1 = t.measureText(L1).width;
  t.font = `52px ${F}`; const w2 = t.measureText(L2).width;
  const big = Math.min(52, 52 * (W - 12) / w2);
  t.font = `${big}px ${F}`; const w2b = t.measureText(L2).width;
  const x2 = 4, x1 = 6;
  t.font = `24px ${F}`; t.fillText(L1, x1, 22);
  t.font = `${big}px ${F}`; t.fillText(L2, x2, 64);
  const src = t.getImageData(0, 0, W, H).data;
  const m = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) m[i] = src[i * 4 + 3] > 110 ? 1 : 0;
  // ornamento: uma lâmina fina sob o nome
  const y0 = 70, xe = Math.min(W - 6, x2 + Math.round(w2b));
  for (let x = x2 + 2; x <= xe; x++) m[y0 * W + x] = 2;
  for (let x = x2 + 2; x <= x2 + 8; x++) { m[(y0 - 1) * W + x] = 2; m[(y0 + 1) * W + x] = 2; }
  m[(y0 - 2) * W + x2 + 9] = 2; m[(y0 + 2) * W + x2 + 9] = 2; m[(y0 - 1) * W + x2 + 9] = 2; m[(y0 + 1) * W + x2 + 9] = 2;
  void w1;
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const o = out.getContext('2d'), img = o.createImageData(W, H), D = img.data;
  const C = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const BR = ['#fff3d2', '#f0d8a0', '#d8b06a', '#b98a4a', '#8e5e32', '#5e3a20'].map(C);
  const put = (x, y, c, a = 255) => { const i = (y * W + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = a; };
  const at = (x, y) => x >= 0 && y >= 0 && x < W && y < H ? m[y * W + x] : 0;
  const rows = (y) => y < 30 ? [4, 24] : [26, 66];
  const hs = (x, y) => { let h = Math.imul(x * 73856093 ^ y * 19349663, 2654435761); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
  // sombra (2px para baixo e à direita), depois contorno, depois as letras
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!at(x, y)) {
    if (at(x - 2, y - 2) || at(x - 1, y - 2) || at(x - 2, y - 1)) put(x, y, C('#2a070b'), 230);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!at(x, y)) {
    if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1) || at(x - 1, y - 1) || at(x + 1, y + 1) || at(x + 1, y - 1) || at(x - 1, y + 1)) put(x, y, C('#08050a'));
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = at(x, y); if (!v) continue;
    let c;
    if (v === 2) c = at(x, y - 1) ? BR[2] : BR[1];
    else {
      const [a, b] = rows(y), f = (y - a) / (b - a);
      const tt = f * (BR.length - 1.2) + (hs(x, y) < 0.06 ? 1 : 0), i = Math.floor(tt);
      c = BR[Math.min(BR.length - 1, (tt - i) > (BAY[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? i + 1 : i)];
      if (!at(x, y - 1)) c = C('#fff8e4');
      else if (!at(x + 1, y) && f > 0.3) c = BR[Math.min(5, i + 2)];
    }
    put(x, y, c);
  }
  o.putImageData(img, 0, 0);
  return out;
}

(function () {
  // o nome novo em tudo que aparece
  document.title = 'Under Darkness';
  $('screen').setAttribute('aria-label', 'Tela do jogo Under Darkness');
  const oldH = document.querySelector('#menu h1'); if (oldH) oldH.textContent = 'Under Darkness';
  const md = document.querySelector('meta[name="description"]'); if (md) md.content = 'Under Darkness: RPG 2D de exploração e combate em cavernas, em pixel art.';

  const root = document.createElement('div');
  root.id = 'title';
  root.innerHTML = `
    <canvas id="ttArt" width="${TITLE_W}" height="${TITLE_H}" aria-hidden="true"></canvas>
    <canvas id="ttFx" width="${TITLE_W}" height="${TITLE_H}" aria-hidden="true"></canvas>
    <div class="shade"></div>
    <h1 class="logo"><canvas id="ttLogo" role="img" aria-label="Under Darkness"></canvas></h1>
    <nav class="tmenu" id="ttMain" aria-label="Menu principal">
      <button type="button" id="ttCont">Continuar</button>
      <button type="button" id="ttLoad">Carregar</button>
      <button type="button" id="ttImp">Importar</button>
      <button type="button" id="ttNew">Novo jogo</button>
      <button type="button" id="ttNews">Novidades</button>
      <button type="button" id="ttOpt">Opções</button>
      <button type="button" id="ttQuit">Sair</button>
    </nav>
    <nav class="tmenu" id="ttChars" aria-label="Personagens" hidden></nav>
    <section class="tnews" id="ttNewsBox" aria-label="Novidades" hidden><h2>Novidades</h2><div class="tnlist" id="ttNewsList"></div><nav class="tmenu"><button type="button" class="back" id="ttNewsBack">Voltar</button></nav></section>
    <div class="tver" id="ttVer"></div>
    <div id="ttBye" hidden><canvas id="ttByeLogo" aria-hidden="true"></canvas></div>`;
  document.body.appendChild(root);
  $('menu').hidden = true;

  const art = (() => {
    const pool = typeof TITLE_ARTS !== 'undefined' ? TITLE_ARTS : [];
    if (!pool.length) return paintTitleArt();
    let last = null; try { last = localStorage.getItem('ud-titulo-arte'); } catch (e) { }
    let want = null; try { want = new URLSearchParams(location.search).get('arte'); } catch (e) { }   // ?arte=Cavernas abre essa (para testar)
    const forced = want && pool.find(f => f.name.toLowerCase() === ('paintTitleArt' + want).toLowerCase());
    const opts = pool.length > 1 ? pool.filter(f => f.name !== last) : pool, pick = forced || opts[(Math.random() * opts.length) | 0];
    try { localStorage.setItem('ud-titulo-arte', pick.name); } catch (e) { }
    return pick();
  })();
  $('ttArt').getContext('2d').drawImage(art.canvas, 0, 0);
  function drawLogo() {
    const lg = paintTitleLogo();
    for (const id of ['ttLogo', 'ttByeLogo']) { const c = $(id); c.width = lg.width; c.height = lg.height; c.getContext('2d').drawImage(lg, 0, 0); }
    fit();
  }
  // tamanho: a arte cobre a tela; o nome usa o pixel da arte pela menor medida da tela (arredondado, para ficar nítido)
  function fit() {
    const kk = Math.max(1, Math.round(Math.min(innerWidth / TITLE_W, innerHeight / TITLE_H) * 0.92));
    for (const id of ['ttLogo', 'ttByeLogo']) { const c = $(id); c.style.width = c.width * kk + 'px'; c.style.height = c.height * kk + 'px'; }
    root.style.setProperty('--px', kk + 'px');
  }
  addEventListener('resize', fit);
  drawLogo();
  try { document.fonts.load('52px "Jersey 10"').then(drawLogo, () => { }); document.fonts.ready.then(drawLogo); } catch (e) { }

  /* brasas subindo do abismo: a única coisa que mexe, desenhada numa camada pequena */
  const fx = $('ttFx').getContext('2d'), embers = [];
  let fxLast = 0, fxOn = true;
  const EMB = ['#ffd27a', '#f39a3a', '#d0601e', '#9c3414', '#5a1a10'];
  /* capa ao vento: cada linha estica e encolhe a partir do ombro, numa onda que desce pela capa, com rajadas lentas.
     Só mexe nos ~150 pixels da capa, por isso é barato. */
  function drawCape(t) {
    const gust = 0.5 + 0.5 * Math.sin(t * 0.55) * Math.sin(t * 0.21 + 1.3);
    for (const p of art.cape) {
      const r = p.j / 28, ph = t * 3.1 - p.j * 0.32 - p.d * 0.2;
      const s = 1 + (0.1 + gust * 0.14) * Math.sin(ph) * (0.4 + r) + gust * 0.12 * r;
      const lift = Math.round(Math.sin(ph * 0.7 + 0.8) * p.d * 0.07 * r - gust * p.d * 0.05 * r);
      const nx = p.ax - p.d * s, w = Math.max(1, Math.ceil(s + 0.2));
      fx.fillStyle = p.col; fx.fillRect(Math.round(nx), p.y + lift, w, 1);
    }
  }
  function fxFrame(now) {
    if (!fxOn) return;
    requestAnimationFrame(fxFrame);
    const dt = Math.min(0.05, (now - (fxLast || now)) / 1000); fxLast = now;
    if (art.frame) { fx.clearRect(0, 0, TITLE_W, TITLE_H); art.frame(fx, now / 1000, dt); return; }
    if (embers.length < 46 && Math.random() < dt * 14) embers.push({ x: 236 + Math.random() * 60, y: 262 + Math.random() * 10, vx: (Math.random() - 0.5) * 4, vy: -(10 + Math.random() * 16), t: 0, life: 4 + Math.random() * 5, ph: Math.random() * 6 });
    fx.clearRect(0, 0, TITLE_W, TITLE_H);
    drawCape(now / 1000);
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i]; e.t += dt;
      if (e.t > e.life) { embers.splice(i, 1); continue; }
      e.x += (e.vx + Math.sin(e.t * 2 + e.ph) * 5) * dt; e.y += e.vy * dt;
      const f = e.t / e.life, ci = Math.min(EMB.length - 1, Math.floor(f * EMB.length + (Math.sin(e.t * 9 + e.ph) > 0.6 ? -1 : 0)));
      fx.globalAlpha = f > 0.8 ? 1 - (f - 0.8) / 0.2 : 1;
      fx.fillStyle = EMB[Math.max(0, ci)]; fx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
    }
    fx.globalAlpha = 1;
  }
  function fxStart() { if (!fxOn) { fxOn = true; fxLast = 0; requestAnimationFrame(fxFrame); } }
  requestAnimationFrame(fxFrame);

  /* menu: os personagens vêm do 120-personagens (charList, charNew, charLoad, charDelete) */
  const btnCont = $('ttCont'), btnLoad = $('ttLoad'), btnNew = $('ttNew'), navMain = $('ttMain'), navChars = $('ttChars');
  const newsBox = $('ttNewsBox');
  const navNow = () => !newsBox.hidden ? newsBox.querySelector('.tmenu') : navChars.hidden ? navMain : navChars;
  function mainUI() {
    const any = charList().length > 0;
    btnCont.hidden = !any; btnLoad.hidden = !any;
    navChars.hidden = true; newsBox.hidden = true; navMain.hidden = false;
  }
  function play(fn) {
    initAudio();
    root.classList.add('out');
    setTimeout(() => { fxOn = false; root.hidden = true; root.classList.remove('out'); }, 260);
    fn();
  }
  function playChar(id) { play(() => { if (id !== charCur || !tiles) charLoad(id); startPlaying(); }); }
  btnCont.addEventListener('click', () => { const id = charCur != null ? charCur : chars.last; if (id != null) playChar(id); });
  btnNew.addEventListener('click', () => play(() => { charNew(); startPlaying(); }));

  // carregar: a lista de personagens, cada um com Exportar (357-save-arquivo) e Excluir (pede um segundo clique)
  function charsUI(focusId) {
    const list = charList();
    if (!list.length) { mainUI(); navMain.querySelector('button:not([hidden])').focus(); return; }
    navMain.hidden = true; navChars.hidden = false; navChars.textContent = '';
    const h = document.createElement('h2'); h.textContent = 'Personagens'; navChars.appendChild(h);
    for (const c of list) {
      const row = document.createElement('div'); row.className = 'crow';
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cpick'; b.dataset.id = c.id;
      b.innerHTML = `${charName(c)}<small>Nível ${c.lvl} · ${typeof fmtOuro === 'function' ? fmtOuro(c.gold) : c.gold} de ouro</small>`;
      b.addEventListener('click', () => playChar(c.id));
      const d = document.createElement('button'); d.type = 'button'; d.className = 'cdel'; d.textContent = 'Excluir';
      let armed = false;
      d.addEventListener('click', () => {
        if (!armed) { armed = true; d.textContent = 'Confirmar'; d.classList.add('warn'); return; }
        const i = list.indexOf(c); charDelete(c.id);
        const next = list[i + 1] || list[i - 1]; charsUI(next && next.id);
      });
      d.addEventListener('blur', () => { armed = false; d.textContent = 'Excluir'; d.classList.remove('warn'); });
      const x = document.createElement('button'); x.type = 'button'; x.className = 'cexp'; x.textContent = 'Exportar';
      x.addEventListener('click', () => charExport(c.id));
      row.append(b, x, d); navChars.appendChild(row);
    }
    const back = document.createElement('button'); back.type = 'button'; back.className = 'back'; back.textContent = 'Voltar';
    back.addEventListener('click', () => { mainUI(); btnLoad.focus(); });
    navChars.appendChild(back);
    for (const b of navChars.querySelectorAll('button')) b.addEventListener('pointerenter', () => b.focus({ preventScroll: true }));
    (navChars.querySelector(`.cpick[data-id="${focusId}"]`) || navChars.querySelector('.cpick')).focus();
  }
  btnLoad.addEventListener('click', () => { initAudio(); charsUI(); });
  // importar: um save em arquivo vira um personagem novo, e a lista Carregar abre com ele (357-save-arquivo)
  const btnImp = $('ttImp'); let impT = 0;
  btnImp.addEventListener('click', () => { initAudio(); charImportFile().then(id => {
    if (id != null) { charsUI(id); return; }
    btnImp.textContent = 'Arquivo inválido'; btnImp.classList.add('warn'); clearTimeout(impT);
    impT = setTimeout(() => { btnImp.textContent = 'Importar'; btnImp.classList.remove('warn'); }, 1800);
  }); });

  // novidades: as notas de cada versão (121-versao); a opção fica marcada até a versão atual ser vista
  const btnNews = $('ttNews');
  $('ttVer').textContent = 'Versão ' + VERSAO;
  const newsSeen = () => { try { return localStorage.getItem('ud-versao-vista') === VERSAO; } catch (e) { return true; } };
  btnNews.classList.toggle('new', !newsSeen());
  $('ttNewsList').innerHTML = NOVIDADES.map((n, i) => `<article${i ? '' : ' class="cur"'}><h3>${n.v}<span>${n.titulo}</span><small>${n.data}</small></h3><ul>${n.itens.map(t => `<li>${t}</li>`).join('')}</ul></article>`).join('');
  let newsScroll = false;
  btnNews.addEventListener('click', () => {
    initAudio();
    navMain.hidden = true; newsBox.hidden = false; $('ttNewsList').scrollTop = 0;
    if (!newsScroll && typeof customScroll === 'function') { newsScroll = true; try { customScroll($('ttNewsList')); } catch (e) { } }
    try { localStorage.setItem('ud-versao-vista', VERSAO); } catch (e) { }
    btnNews.classList.remove('new');
    $('ttNewsBack').focus();
  });
  $('ttNewsBack').addEventListener('click', () => { mainUI(); btnNews.focus(); });

  // opções: a tela completa do 40-opcoes, a mesma do menu de pausa
  $('ttOpt').addEventListener('click', () => { initAudio(); openOpts('title'); });

  // sair: num navegador a aba só fecha se foi aberta por um script; senão a tela escurece e volta ao título com um clique ou tecla
  $('ttQuit').addEventListener('click', () => {
    saveGame();
    try { if (fullEl()) exitFull(); } catch (e) { }
    try { window.close(); } catch (e) { }
    setTimeout(() => { if (window.closed) return; fxOn = false; $('ttBye').hidden = false; root.classList.add('bye'); }, 150);
  });
  function backFromBye() { if ($('ttBye').hidden) return; $('ttBye').hidden = true; root.classList.remove('bye'); fxStart(); mainUI(); navMain.querySelector('button:not([hidden])').focus(); }
  $('ttBye').addEventListener('pointerdown', e => { e.preventDefault(); setTimeout(backFromBye, 0); });
  addEventListener('keydown', e => { if (!root.hidden && !$('ttBye').hidden) { e.preventDefault(); backFromBye(); } }, true);

  // teclado: setas sobem e descem, Esc volta das opções
  addEventListener('keydown', e => {
    if (root.hidden || !$('ttBye').hidden || optsOpen()) return;
    if (e.code === 'Escape' && !navChars.hidden) { e.preventDefault(); e.stopPropagation(); mainUI(); btnLoad.focus(); return; }
    if (e.code === 'Escape' && !newsBox.hidden) { e.preventDefault(); e.stopPropagation(); mainUI(); btnNews.focus(); return; }
    if (!newsBox.hidden && (e.code === 'ArrowDown' || e.code === 'ArrowUp' || e.code === 'KeyS' || e.code === 'KeyW')) { e.preventDefault(); e.stopPropagation(); $('ttNewsList').scrollTop += (e.code === 'ArrowDown' || e.code === 'KeyS' ? 60 : -60); return; }
    const nav = navNow();
    const list = [...nav.querySelectorAll('button:not([hidden])')];
    let i = list.indexOf(document.activeElement);
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
    if (e.code !== 'Enter' && e.code !== 'Space' && e.code !== 'NumpadEnter') e.stopPropagation();
  }, true);
  for (const b of root.querySelectorAll('button')) b.addEventListener('pointerenter', () => b.focus({ preventScroll: true }));

  // menu de pausa: "Exportar personagem" baixa o save do atual; "Tela de início" salva e volta para esta tela; "Excluir personagem" apaga o atual e volta para ela
  function toTitle() {
    $('pause').hidden = true; $('hud').hidden = true; state = 'menu';
    root.hidden = false; $('ttBye').hidden = true; root.classList.remove('bye', 'out');
    fxStart(); mainUI();
    navMain.querySelector('button:not([hidden])').focus();
  }
  const bt = document.createElement('button');
  bt.id = 'btnTitle'; bt.className = 'ghost'; bt.type = 'button'; bt.textContent = 'Tela de início';
  const bx = document.createElement('button');
  bx.id = 'btnExpChar'; bx.className = 'ghost'; bx.type = 'button'; bx.textContent = 'Exportar personagem';
  $('pause').querySelector('.actions').append(bx, bt);
  bx.addEventListener('click', () => { if (charCur == null) return; saveGame(); charExport(charCur); });
  bt.addEventListener('click', () => { saveGame(); toTitle(); });
  const bd = document.createElement('button');
  bd.id = 'btnDelChar'; bd.className = 'ghost warn'; bd.type = 'button';
  let delArmed = false;
  const delReset = () => { delArmed = false; bd.textContent = 'Excluir personagem'; };
  delReset();
  $('btnNew').after(bd);
  bd.addEventListener('click', () => {
    if (!delArmed) { delArmed = true; bd.textContent = 'Confirmar exclusão'; return; }
    delReset(); if (charCur != null) charDelete(charCur); toTitle();
  });
  bd.addEventListener('blur', delReset);

  mainUI();
  navMain.querySelector('button:not([hidden])').focus();
  window.__title = { root, art };
})();
