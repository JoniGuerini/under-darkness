'use strict';
/* arte da tela de título: O Reino Élfico. O fundo da camada, o Espelho da Lua: uma gruta de Pedra-do-Poço com o teto
   tomado pelo emaranhado da Raiz-Mãe (casca de prata, a seiva azul acesa nos sulcos, fios pendurados com gotas de
   luar). Pendurada nas raízes, enorme, a Lua Presa, o disco branco com mares e crateras e as raízes cor de palha que
   a abraçam; dela descem feixes de luar até o chão, que é o Espelho d'Água, liso e escuro. Raízes do tamanho de
   torres descem pela parede do fundo; plataformas de raiz nos dois lados; cachos de Cristal Lunar na beira.
   Sobre a água, maior que tudo, a Dama do Espelho da fase 1: o vestido branco de cintura alta com o ouro na gola,
   no cinto e na barra bordada, a barra se desfazendo em luz, as mangas de anjo, o cabelo prata-dourado boiando para
   trás, a tiara de ouro com a pedra da lua e a orelha pontuda; a mão da frente estendida para o herói, com um
   pouco de luar na palma (o chamado). Na água, o reflexo dela não é ela: é a Tentação da fase 2, o vestido escuro
   com a saia de baixo carmesim, o cabelo branco subindo, a pele cinza-azulada, a coroa de pontas e os olhos brancos.
   Pequeno, de pé sobre o espelho, o herói com a armadura de xenita forjada (a camada de cima), a espada de xenita
   baixa na mão de trás e a tocha erguida na da frente. O lado esquerdo fica escuro para o nome e o menu.
   Pintada uma vez (480x270, 39-titulo sorteia entre as artes de TITLE_ARTS). Por quadro mexem só coisas pequenas: a
   chama da tocha, o halo da Lua pulsando, o luar na palma da Dama, o brilho correndo pelo cabelo e pela barra,
   centelhas subindo da barra, pó nos feixes de luar, vaga-lumes, gotas de luar caindo dos fios e anéis na água,
   reflexos piscando no espelho e os olhos brancos do reflexo. */
function paintTitleArtElfos() {
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
  const lerp = (a, b, t) => a + (b - a) * t;
  const rpc = (pal, t, x, y, k = 2.4) => { const f = cl(t, 0, 0.9999) * (pal.length - 1), i = Math.floor(f), fr = cl((f - i - 0.5) * k + 0.5, 0, 1); return fr > bay(x, y) ? pal[Math.min(pal.length - 1, i + 1)] : pal[i]; };
  const rp = (pal, t, x, y) => { const f = cl(t, 0, 0.9999) * (pal.length - 1), i = Math.floor(f); return (f - i) > bay(x, y) ? pal[i + 1] : pal[i]; };
  const qa = (a, x, y, n = 4) => Math.floor(cl(a, 0, 1) * n + bay(x, y)) / n;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const put = (x, y, c) => { x |= 0; y |= 0; if (!inb(x, y)) return; const i = (y * W + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255; };
  const get = (x, y) => { const i = (y * W + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const blend = (x, y, c, a) => { x |= 0; y |= 0; if (a <= 0 || !inb(x, y)) return; put(x, y, mix(get(x, y), c, cl(a, 0, 1))); };
  // o que está em cada pixel: 0 fundo (a parede do poço), 1 raízes do fundo, 2 pedra, 3 raiz (teto, plataformas),
  // 4 a Lua, 5 a Dama, 6 o herói, 7 a água, 8 cristal (brilha sozinho)
  const N = new Uint8Array(W * H);
  const M = (x, y) => inb(x, y) ? N[y * W + x] : 2;

  /* ---------- palcos: a linha d'água, o teto, as paredes dos lados, a Lua ---------- */
  const WL = 156;                                    // a linha do espelho
  const MOON = { x: 414, y: 50, r: 44 };
  const yCeil = x => 3 + (fbm(x / 22, 1, 3) - 0.5) * 8 + Math.max(0, 70 - x) * 0.45 + Math.max(0, x - 452) * 0.9;
  const wallL = y => 10 + (fbm(y / 16, 2, 5) - 0.5) * 12 + Math.max(0, 60 - y) * 0.6 + Math.max(0, y - 150) * 0.25;
  const wallR = y => 469 + (fbm(y / 16, 3, 7) - 0.5) * 8 - Math.max(0, 40 - y) * 0.5 - Math.max(0, y - 140) * 0.15;
  const rockAt = (x, y) => y < WL && (y < yCeil(x) || x < wallL(y) || x > wallR(y));

  /* ---------- luzes ---------- */
  const HERO = { x: 192, y: WL - 22 };
  const TORCH = { x: HERO.x + 16, y: HERO.y };    // a boca da tocha (a chama nasce aqui)
  const PALM = { x: 280, y: 49 };                     // o luar na palma da Dama
  const CRY = [[454, 152, 1], [460, 100, 0.7]];
  const lights = [
    { x: MOON.x, y: MOON.y, r: 330, c: C('#c8dcff'), s: 1.15 },
    { x: 326, y: 88, r: 100, c: C('#f8f0d2'), s: 0.4 },        // a Dama brilha sozinha
    { x: PALM.x, y: PALM.y, r: 46, c: C('#d0e8ff'), s: 0.45 },
    { x: TORCH.x, y: TORCH.y, r: 82, c: C('#ffa850'), s: 0.95 },
    ...CRY.map(([x, y, s]) => ({ x, y: y - 6, r: 34 * s + 10, c: C('#9cc8ff'), s: 0.5 * s }))
  ];
  const lightAt = (x, y) => { let a = 0, r = 0, g = 0, b = 0;
    for (const L of lights) { const d = Math.hypot(x - L.x, (y - L.y) * 1.1); if (d >= L.r) continue; const f = Math.pow(1 - d / L.r, L === lights[0] ? 2.2 : 1.6) * L.s; a += f; r += L.c[0] * f; g += L.c[1] * f; b += L.c[2] * f; }
    return a > 0.002 ? { a, c: [r / a, g / a, b / a] } : null; };
  const toMoon = (x, y) => { const dx = MOON.x - x, dy = MOON.y - y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
  // os feixes de luar: faixas inclinadas da Lua até a água (x no topo, x na água, meia largura)
  const BEAMS = [[394, 338, 12, 0.55], [424, 392, 8, 0.42], [378, 262, 9, 0.3]];
  const beamAt = (x, y) => { let a = 0; for (const [x0, x1, w, s] of BEAMS) { const k = (y - MOON.y) / (WL - MOON.y); if (k < 0 || k > 1) continue; const c = lerp(x0, x1, k), hw = w * (0.6 + k * 0.7), d = Math.abs(x - c) / hw; if (d < 1) a += (1 - d * d) * s * (0.35 + 0.65 * Math.min(1, k * 2.5)); } return a; };

  /* ---------- fundo: a parede do poço rachada em placas, as raízes enormes descendo, a névoa sobre a água ---------- */
  const POCO = P(['#020507', '#04090c', '#071216', '#0d1e24', '#142c34', '#1e3e48', '#2a525c', '#3a6a74']);
  const FUNDO = P(['#020308', '#03060c', '#050a14', '#08101e', '#0c1628', '#121e36', '#1a2a48', '#28406a']);
  const RAIZ = P(['#0c0e13', '#16191f', '#22262f', '#373d4a', '#505866', '#6e7786', '#929bab', '#bac2d0', '#e2e8f2']);
  const SEIVA = P(['#14305a', '#244e88', '#3a74b8', '#64a0e0', '#a4cdf8', '#e8f6ff']);
  const NEVOA = C('#4a6488');
  // as raízes do fundo: troncos que descem ondulando do teto até a água (x, largura, fase)
  const TRUNKS = [[44, 13, 0.3], [118, 9, 2.1], [204, 15, 4.0], [268, 8, 1.2], [352, 12, 5.1], [446, 14, 3.3]];
  const trunkAt = (x, y) => { for (const [tx, w, ph] of TRUNKS) { const c = tx + Math.sin(y / 34 + ph) * 12 + (fbm(y / 20, tx, 31) - 0.5) * 8, ww = w * (0.85 + 0.3 * fbm(y / 26, tx, 33)) + Math.max(0, 40 - y) * 0.25 + Math.max(0, y - 150) * 0.18; const u = (x - c) / ww; if (Math.abs(u) < 1) return { u, c, tx }; } return null; };
  // runas de lua gravadas na pedra (as do 251), acesas fraco
  const RUNES = [['.##', '#..', '#..', '#..', '.##'], ['.#.', '###', '.#.', '#.#', '.#.'], ['#.#', '.#.', '###', '.#.', '#.#'], ['##.', '#.#', '##.', '#..', '#..'], ['.#.', '#.#', '.#.', '.#.', '###'], ['#..', '##.', '#.#', '##.', '#..']];
  const RUNEAT = [[236, 104, 0], [292, 128, 3], [168, 60, 2], [446, 124, 4], [96, 118, 5], [250, 52, 1]];
  for (let y = 0; y < WL; y++) for (let x = 0; x < W; x++) {
    const L = lightAt(x, y), lit = L ? L.a : 0;
    const halo = Math.exp(-Math.max(0, Math.hypot(x - MOON.x, y - MOON.y) - MOON.r) / 60) * 0.5;
    const mist = Math.exp(-Math.pow((y - WL + 8) / 12, 2)) * (0.35 + fbm(x / 30, y / 8, 27) * 0.65);
    const tr = trunkAt(x, y);
    let c;
    if (tr) {   // a raiz do fundo: cilindro escuro, o lado da Lua aceso, a seiva em fios correndo por ela
      N[y * W + x] = 1;
      const [lx] = toMoon(x, y), sh = 0.5 + 0.5 * tr.u * Math.sign(lx), bark = Math.sin((y + tr.u * 6) * 0.45 + tr.tx) > 0.6 ? -0.05 : 0;
      let t = 0.16 + sh * 0.12 * (0.4 + lit) + bark + halo * 0.35 + (fbm(x / 4, y / 9, 41) - 0.5) * 0.1 + lit * 0.12;
      c = rp(FUNDO, t, x, y);
      if (Math.abs(vn(tr.u * 3 + tr.tx, y / 22, 43) - 0.5) < 0.025 && Math.abs(tr.u) < 0.8) c = mix(c, rp(SEIVA, 0.25 + lit * 0.6, x, y), 0.35 + lit * 0.4);
      if (Math.abs(tr.u) > 0.86) c = mix(c, C('#010206'), 0.5);
    } else {   // a parede: placas de pedra rachadas
      const fx0 = x / 15, fy0 = y / 12, ix = Math.floor(fx0), iy = Math.floor(fy0); let d1 = 9, d2 = 9;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const px = ix + i + h2(ix + i, iy + j, 51), py = iy + j + h2(ix + i, iy + j, 52), d = Math.hypot((fx0 - px) * 15, (fy0 - py) * 12); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
      let t = 0.18 + (fbm(x / 7, y / 5, 45) - 0.5) * 0.12 + halo * 0.45 + lit * 0.24;
      if (d2 - d1 < 1.1) t -= 0.07; else if (d2 - d1 < 2.2) t += 0.03;
      c = rp(POCO, t, x, y);
    }
    c = mix(c, NEVOA, qa(mist * (0.1 + lit * 0.5), x, y, 6));
    put(x, y, c);
  }
  for (const [rx, ry, k] of RUNEAT) RUNES[k].forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '#') return; const x = rx + i, y = ry + j; if (M(x, y) !== 0) return; const L = lightAt(x, y); blend(x, y, C('#64a0e0'), 0.4 + (L ? L.a * 0.4 : 0)); }));

  /* ---------- a rocha: o teto e as paredes dos lados ---------- */
  for (let y = 0; y < WL; y++) for (let x = 0; x < W; x++) if (rockAt(x, y)) N[y * W + x] = 2;
  const open = (x, y) => inb(x, y) && N[y * W + x] !== 2;
  for (let y = 0; y < WL; y++) for (let x = 0; x < W; x++) {
    if (N[y * W + x] !== 2) continue;
    const L = lightAt(x, y), lit = L ? L.a : 0;
    let t = 0.22 + (fbm(x / 6, y / 4, 61) - 0.5) * 0.3;
    const st = fbm(x / 20, y / 4, 63); if (st > 0.64) t += 0.1; else if (st > 0.6) t -= 0.1;
    let e = 0; if (open(x, y + 1)) e = 0.3; if (open(x - 1, y) || open(x + 1, y)) e += 0.15;
    t = t * (0.3 + lit * 0.9) + e * lit;
    let c = rp(POCO, t, x, y);
    if (L) c = mix(c, L.c, qa(Math.min(0.3, L.a * 0.25), x, y, 6));
    put(x, y, c);
  }

  /* ---------- o pintor por rampa: raízes, Lua, Dama e o reflexo dela gravam rampa e valor; a cor vem no fim ---------- */
  const RAIZL = P(['#14100c', '#2e261e', '#4e4234', '#76664e', '#a08c6e', '#c8b898']);
  const LUA = P(['#2a3450', '#5a6a8e', '#97a6c4', '#c8d4e8', '#e8eef8', '#ffffff']);
  const PELE = P(['#3a2a3a', '#7a5a68', '#b8909c', '#e4c4c4', '#f6e2dc', '#fff6f0']);
  const CABELO = P(['#3a2c1c', '#4a3a26', '#8a7450', '#c4ae7c', '#e6d6a6', '#f8f0d2', '#ffffff']);
  const VESTIDO = P(['#2e3450', '#4c5674', '#6a7496', '#a8b2cc', '#d6dcec', '#eef2fa', '#ffffff']);
  const OURO = P(['#4a3008', '#8a6018', '#c09030', '#f0c050', '#ffe08a', '#fff4c8']);
  const LUAZ = P(['#1a2a5a', '#2a4a90', '#4a7ad0', '#9cc8ff', '#d0e8ff', '#ffffff']);
  const PELE2 = P(['#141828', '#2e3650', '#4e5a7a', '#7a88a6', '#a4b0ca', '#d0d8ea']);
  const CABELO2 = P(['#24243a', '#4e4e6c', '#8a8aa6', '#bcbcd4', '#e4e4f4', '#ffffff']);
  const VESTIDO2 = P(['#05050c', '#0e1024', '#1c2040', '#2e3460', '#4a5288', '#7a84b8']);
  const PRATA2 = P(['#1a1a2a', '#3a4058', '#6a7490', '#a8b2cc', '#dce2f0', '#ffffff']);
  const SANGUE = P(['#2a0610', '#5a0c1c', '#901a2c', '#d02a3a', '#ff6a6a', '#ffc0c0']);
  const SOMBRA = P(['#05060c', '#0a0c18', '#141a2c', '#20283e', '#2e3854', '#44506e']);
  const RAMPS = [RAIZ, SEIVA, RAIZL, LUA, PELE, CABELO, VESTIDO, OURO, LUAZ, PELE2, CABELO2, VESTIDO2, PRATA2, SANGUE, SOMBRA];
  const [kRAIZ, kSEIVA, kRAIZL, kLUA, kPELE, kCAB, kVES, kOURO, kLUAZ, kPELE2, kCAB2, kVES2, kPRATA2, kSANGUE, kSOMBRA] = RAMPS.map((_, i) => i);
  const mkL = () => ({ r: new Int8Array(W * H).fill(-1), v: new Float32Array(W * H), e: new Uint8Array(W * H), z: new Uint8Array(W * H) });
  const lput = (Lr, x, y, r, v, e = 0, z = 0) => { x = Math.floor(x); y = Math.floor(y); if (!inb(x, y)) return; const i = y * W + x; Lr.r[i] = r; Lr.v[i] = v; Lr.e[i] = e; Lr.z[i] = z; };
  // um tubo (raiz, braço, mecha): sombreado como cilindro virado para a luz (lx, ly); vf dá o valor ao longo dele
  const tube = (Lr, ax, ay, bx, by, r0, r1, r, vf, lx = 0.7, ly = -0.7, z = 0) => {
    const m = Math.max(r0, r1) + 1, vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1, len = Math.sqrt(L2);
    for (let y = Math.floor(Math.min(ay, by) - m); y <= Math.max(ay, by) + m; y++) for (let x = Math.floor(Math.min(ax, bx) - m); x <= Math.max(ax, bx) + m; x++) {
      const px = x + 0.5, py = y + 0.5, t = cl(((px - ax) * vx + (py - ay) * vy) / L2, 0, 1), qx = ax + vx * t, qy = ay + vy * t, rr = r0 + (r1 - r0) * t;
      const dx = (px - qx) / rr, dy = (py - qy) / rr, d = dx * dx + dy * dy; if (d > 1) continue;
      const side = (dx * -vy + dy * vx) / len;   // -1..1 através do tubo
      const v = vf(t, side, x, y, dx * lx + dy * ly, d, dx, dy); if (v === null) continue;
      lput(Lr, x, y, typeof v === 'object' ? v[0] : r, typeof v === 'object' ? v[1] : v, typeof v === 'object' ? v[2] || 0 : 0, z);
    }
  };
  const bez = (a, k, b, t) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * k[0] + t * t * b[0], u * u * a[1] + 2 * u * t * k[1] + t * t * b[1]]; };
  const curve = (Lr, a, k, b, r0, r1, r, vf, z) => { const n = Math.ceil(Math.hypot(k[0] - a[0], k[1] - a[1]) + Math.hypot(b[0] - k[0], b[1] - k[1])) ; let p = a;
    for (let i = 1; i <= n; i++) { const t0 = (i - 1) / n, t1 = i / n, q = bez(a, k, b, t1); tube(Lr, p[0], p[1], q[0], q[1], r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1, r, (t, s, x, y, ln, d, nx, ny) => vf(t0 + (t1 - t0) * t, s, x, y, ln, d, nx, ny), 0.7, -0.7, z); p = q; } };

  /* ---------- o emaranhado da Raiz-Mãe no teto, os fios pendurados, as plataformas de raiz ---------- */
  const ENV = mkL();
  // a casca: estrias em diagonal, a seiva azul acesa em alguns sulcos; o lado virado para a Lua mais claro
  const bark = (base, sd, len = 60) => (t, s, x, y, ln, d, nx, ny) => {
    const [mx, my] = toMoon(x, y), nd = (nx * mx + ny * my) / Math.max(0.3, Math.sqrt(d));   // a casca virada para a Lua acende
    const g = Math.sin(t * len * 0.3 + s * 2.2 + sd);                                         // as estrias correm ao longo da raiz
    const v = base + nd * 0.26 - (d > 0.7 ? 0.2 : 0) + (g > 0.7 ? 0.07 : g < -0.6 ? -0.12 : 0) + (h2(x, y, sd) - 0.5) * 0.05;
    if (g < -0.92 && nd > -0.2 && h2(Math.floor(t * len / 4), sd, 7) < 0.25) return [kSEIVA, 0.6 + h2(x, y, sd + 2) * 0.35];   // a seiva azul no sulco
    return v;
  };
  const ROOTS = [];
  for (let i = 0; i < 28; i++) {
    // metade são laços que pendem do teto e voltam a ele; a outra metade descem em diagonal e somem na pedra
    const loop = i % 2 === 0, x0 = -30 + Math.pow(h2(i, 1, 101), 0.7) * 540, len = 40 + h2(i, 2, 101) * 110, dir = h2(i, 3, 101) < 0.5 ? -1 : 1, x1 = x0 + dir * len;
    const y0 = yCeil(cl(x0, 0, W - 1)) - 1 + h2(i, 4, 101) * 6, y1 = loop ? yCeil(cl(x1, 0, W - 1)) - 1 + h2(i, 5, 101) * 6 : y0 + 10 + h2(i, 5, 101) * 14;
    const sag = loop ? 10 + h2(i, 6, 101) * 22 : 4 + h2(i, 6, 101) * 10;
    ROOTS.push({ a: [x0, y0], k: [lerp(x0, x1, 0.3 + h2(i, 8, 101) * 0.4), Math.max(y0, y1) + sag], b: [x1, y1], r: 2.2 + h2(i, 7, 101) * 3.2 + (x0 > 260 ? 0.8 : 0), sd: 110 + i, dk: i < 9 ? -0.14 : i < 18 ? -0.06 : 0 });
  }
  ROOTS.forEach((R, i) => curve(ENV, R.a, R.k, R.b, R.r, R.r * 0.7, kRAIZ, bark(0.42 + R.dk, R.sd, Math.hypot(R.b[0] - R.a[0], R.b[1] - R.a[1])), 1 + i));
  // os fios pendurados: descem do emaranhado, finos, com uma gota de luar na ponta
  const DROPS = [];
  const STRANDS = [[56, 34], [88, 22], [150, 46], [176, 28], [232, 40], [252, 18], [296, 30], [348, 24], [470, 30], [458, 46], [138, 16], [210, 24]];
  const bottomOf = x => { let y = 0; x = Math.floor(x); while (y < WL - 1 && (ENV.r[y * W + x] >= 0 || N[y * W + x] === 2)) y++; return y; };
  for (const [sx, len] of STRANDS) {
    const top = bottomOf(sx) - 2, sw = (h2(sx, 1, 121) - 0.5) * 8, tip = [sx + sw, top + len];
    curve(ENV, [sx, top], [sx + sw * 0.2, top + len * 0.6], tip, 1.3, 0.6, kRAIZ, bark(0.36, sx, len), 60);
    DROPS.push([Math.round(tip[0]), Math.round(tip[1]) + 1]);
  }
  for (const [x, y] of DROPS) { lput(ENV, x, y, kSEIVA, 0.85, 1, 2); lput(ENV, x, y - 1, kSEIVA, 0.5, 1, 2); }
  // as plataformas de raiz: troncos deitados, o alto aceso, a seiva no sulco, raizinhas pendendo por baixo
  const PLATS = [[434, 488, 104, 4.6, 0.24], [104, 170, 96, 3.8, 0.4]];
  for (const [a, b, y, r, pv] of PLATS) {
    curve(ENV, [a, y + 1], [(a + b) / 2, y - 1.5], [b, y + 0.5], r, r * 0.9, kRAIZ, bark(pv, a, b - a), 100);
    for (let k = 0; k < 5; k++) { const x = a + 6 + h2(k, a, 131) * (b - a - 12), l = 4 + h2(k, a, 132) * 9; curve(ENV, [x, y + r - 1], [x + 1, y + r + l * 0.5], [x + (h2(k, a, 133) - 0.5) * 6, y + r + l], 1, 0.5, kRAIZ, bark(0.3, x), 99); }
  }

  /* ---------- a Lua Presa: o disco com mares e crateras, as raízes cor de palha que a abraçam ---------- */
  const MOONL = mkL();
  // as duas raízes que a seguram, do teto até ela
  for (const dx of [-18, 14]) curve(ENV, [MOON.x + dx - 4, yCeil(MOON.x + dx) - 2], [MOON.x + dx + 2, MOON.y - MOON.r - 4], [MOON.x + dx * 0.9, MOON.y - MOON.r + 6], 3.4, 2.4, kRAIZ, bark(0.5, 141 + dx), 2);
  const CRAT = [[-15, -12, 8], [13, 9, 10], [-7, 20, 6], [22, -15, 5], [-27, 6, 6], [4, -26, 5], [-2, 2, 3], [28, 15, 4], [-20, -26, 3], [8, 30, 4]];
  for (let y = MOON.y - MOON.r - 1; y <= MOON.y + MOON.r + 1; y++) for (let x = MOON.x - MOON.r - 1; x <= MOON.x + MOON.r + 1; x++) {
    const lx = x + 0.5 - MOON.x, ly = y + 0.5 - MOON.y, dx = lx / MOON.r, dy = ly / MOON.r, d = Math.hypot(dx, dy); if (d > 1) continue;
    // a luz é dela: o disco quase chapado, um pouco mais claro no alto à esquerda e escurecendo na borda
    let v = 0.82 - (dx * 0.4 + dy * 0.55) * 0.14 - Math.pow(d, 5) * 0.28 + (h2(x, y, 151) - 0.5) * 0.05;
    const mare = fbm((lx + 60) / 16, (ly + 60) / 16, 152) * 0.7 + fbm((lx + 60) / 6, (ly + 60) / 6, 153) * 0.3;
    if (mare > 0.55) v -= 0.12 + (mare - 0.55) * 0.9;
    for (const [c0, c1, cr] of CRAT) { const e = Math.hypot(lx - c0, ly - c1) / cr; if (e < 1) v -= 0.1 - ((lx - c0) + (ly - c1)) / cr * 0.07; else if (e < 1.25) v += ((lx - c0) + (ly - c1)) < 0 ? 0.08 : -0.05; }
    lput(MOONL, x, y, kLUA, v, 0, 1);
  }
  // as raízes que abraçam o disco (as do 256, maiores): por cima dele, sem passar da borda
  const MR = MOON.r / 43;
  const moonRoot = (pts, rr) => { for (let s = 0; s < pts.length - 1; s++) tube(MOONL, MOON.x + pts[s][0] * MR, MOON.y + pts[s][1] * MR, MOON.x + pts[s + 1][0] * MR, MOON.y + pts[s + 1][1] * MR, rr, rr, kRAIZL, (t, sd, x, y, ln, d) => { if (Math.hypot(x + 0.5 - MOON.x, y + 0.5 - MOON.y) > MOON.r + 1.2) return null; if (h2(x, y, 161) < 0.05) return [kSEIVA, 0.7, 1]; return 0.5 + sd * 0.25 - d * 0.25 + (h2(x, y, 162) - 0.5) * 0.15; }, 0.7, -0.7, 2); };
  moonRoot([[-24, -44], [-21, -36], [-22, -26], [-28, -18], [-34, -6], [-38, 6], [-40, 16]], 2.2);
  moonRoot([[12, -44], [14, -36], [10, -28], [18, -20], [30, -14], [38, -4], [41, 6]], 2.2);
  moonRoot([[-21, -36], [-8, -31], [2, -36], [12, -30]], 1.4);
  moonRoot([[-30, -12], [-24, -4], [-26, 4], [-20, 12]], 1.4);
  moonRoot([[38, -4], [34, 8], [36, 20], [30, 30]], 1.3);

  // a cor: rampa e valor viram pixel; o que não brilha sozinho pega a luz de onde está (e a escuridão da esquerda)
  const paintLayer = (Lr, nk, lk = 1, skip) => {
    for (let i = 0; i < W * H; i++) {
      const r = Lr.r[i]; if (r < 0) continue;
      const x = i % W, y = (i / W) | 0; if (skip && skip(x, y)) continue;
      let v = Lr.v[i], c;
      if (Lr.e[i]) c = rp(RAMPS[r], v, x, y);
      else { const L = lightAt(x, y), lit = L ? L.a : 0; c = rpc(RAMPS[r], r === kSEIVA ? v * cl(lit * 1.6 - 0.1, 0, 1) : v * (0.25 + Math.min(1.1, lit) * lk), x, y, 3.2); if (L) c = mix(c, L.c, Math.min(0.3, L.a * 0.22)); }
      put(x, y, c); N[i] = nk;
    }
  };
  // os contornos: a borda de cada coisa pega o tom mais escuro da rampa (ou acende do lado da Lua)
  const outline = (Lr, rimMoon) => {
    const r0 = Lr.r.slice(), v0 = Lr.v.slice(), z0 = Lr.z.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x; if (r0[i] < 0 || Lr.e[i]) continue;
      const up = r0[i - W] < 0, dn = r0[i + W] < 0, lf = r0[i - 1] < 0, rt = r0[i + 1] < 0;
      if (!(up || dn || lf || rt)) {   // uma raiz passando por cima de outra: a de baixo ganha a sombra dela
        const z = z0[i]; if (z0[i - W] > z || z0[i + W] > z || z0[i - 1] > z || z0[i + 1] > z) Lr.v[i] = Math.min(v0[i], 0.12);
        continue;
      }
      if (rimMoon && (rt || up)) { const [mx, my] = toMoon(x, y); if ((rt ? mx : 0) + (up ? -my : 0) > 0.5) { Lr.v[i] = Math.min(1, v0[i] + 0.22); continue; } }
      Lr.v[i] = Math.min(v0[i], 0.06);
    }
  };
  outline(ENV, true);
  paintLayer(ENV, 3, 1.9);
  paintLayer(MOONL, 4, 0, null);
  // a Lua é luz: o valor dela vai direto, sem escurecer
  for (let i = 0; i < W * H; i++) if (MOONL.r[i] === kLUA) { const x = i % W, y = (i / W) | 0; put(x, y, rp(LUA, MOONL.v[i], x, y)); }
  else if (MOONL.r[i] === kRAIZL) { const x = i % W, y = (i / W) | 0; put(x, y, rp(RAIZL, MOONL.v[i] * 0.95, x, y)); }
  // o halo junto da borda da Lua: o ar acende em volta do disco
  for (let y = 0; y < WL; y++) for (let x = MOON.x - MOON.r - 30; x < W; x++) { if (N[y * W + x] === 4) continue; const d = Math.hypot(x - MOON.x, y - MOON.y) - MOON.r; if (d < 0 || d > 22) continue; blend(x, y, C('#b8ccf0'), qa(Math.pow(1 - d / 22, 2.2) * 0.55, x, y, 6)); }

  /* ---------- cristais lunares na beira (prismas branco-azulados que brilham) ---------- */
  const CRISTAL = P(['#1a2a4a', '#2e4a7a', '#4a72ac', '#78a2d8', '#b0d0f4', '#eef8ff']);
  const prism = (cx0, by, hgt, wd, lean, sd) => { for (let y = Math.floor(by - hgt); y <= by; y++) { const k = (by - y) / hgt, c = cx0 + lean * (1 - k) * 0 + lean * k * hgt * 0.3, hw = wd * (k < 0.7 ? 1 : (1 - k) / 0.3); for (let x = Math.floor(c - hw); x <= c + hw; x++) { const u = (x + 0.5 - c) / Math.max(0.6, hw); if (Math.abs(u) > 1) continue; put(x, y, rp(CRISTAL, 0.42 + (u > 0 ? 0.25 : -0.05) + k * 0.25 + (Math.abs(u) < 0.25 ? 0.18 : 0) + (h2(x, y, sd) - 0.5) * 0.1, x, y)); N[y * W + x] = 8; } } };
  for (const [x, h, w, l] of [[452, 14, 2.4, 0.1], [458, 9, 1.8, 0.35], [447, 8, 1.6, -0.3], [463, 6, 1.4, 0.4], [442, 5, 1.2, -0.4]]) prism(x, WL - 1, h, w, l, x);
  for (const [x, h, w, l] of [[458, 8, 1.8, 0.2], [463, 5, 1.3, 0.4], [453, 4, 1.1, -0.3]]) prism(x, 100, h, w, l, x + 7);

  /* ---------- o herói sobre o espelho: armadura de xenita forjada, a espada de xenita baixa, a tocha erguida ---------- */
  const HK = [
    '......kkkkk.......',
    '.....kBWBBRk...cc.',
    '....kBRrrrRDk..cc.',
    '....kRDDRRDDk...t.',
    '....kDkkkNNNk...t.',
    '....kDRRDkkk...kt.',
    '.....kDDDDk...kRk.',
    '...kkBBRDkkkkBDk..',
    '..kBRDDRRDRDRkk...',
    '..kRDkRBRDDDk.....',
    '..kDDkDRBRDDk.....',
    '..kDDkDDRDDk......',
    '..kDkkNNNNNk......',
    '..kGk.kuUuuk......',
    '......kuUuuuk.....',
    '......kuUkuuk.....',
    '......kBB.kBBk....',
    '......kRD.kRD.....',
    '......kDD.kDD.....',
    '......kDD.kDDk....',
    '.....kRDD.kRDDk...',
    '.....kkkk..kkkk...'];
  const HC = { k: '#041409', D: '#0e4a1e', R: '#1a8a32', r: '#3ad44e', B: '#b8ff8a', W: '#d4ffb0', N: '#7dff3a', u: '#0c1014', U: '#1c232c', t: '#5a3a1e', c: '#e0b070', G: '#2a3440' };
  for (let j = 0; j < HK.length; j++) for (let i = 0; i < HK[j].length; i++) { const ch = HK[j][i]; if (!HC[ch]) continue;
    let c = C(HC[ch]); const X = HERO.x + i, Y = HERO.y + j;
    // a tocha acende o alto e a frente; o resto fica no escuro (o cristal da armadura ainda brilha um pouco)
    if (!'Nc'.includes(ch)) { const tl = Math.max(0, 1 - Math.hypot(X - TORCH.x, Y - TORCH.y) / 22), lx = (i - 8) / 9; c = mix(c, C('#ffc070'), cl(tl * 0.4 + lx * 0.08, 0, 0.42)); c = mix(c, C('#020604'), cl(0.22 - tl * 0.45, 0, 0.3)); }
    if (!'Nc'.includes(ch) && !HC[HK[j][i + 1]]) c = mix(c, C('#a8c4f0'), 0.3);   // a Lua desenha a borda de lá
    put(X, Y, c); N[Y * W + X] = 6; }
  // a espada de xenita na mão de trás, a ponta para baixo e para trás
  { const hx = HERO.x + 3, hy = HERO.y + 13;
    for (const [dx, dy, c] of [[0, -1, '#14202a'], [-1, 0, '#0a1018'], [1, 0, '#14202a'], [-2, 1, '#20a03a'], [0, 1, '#20a03a']]) { put(hx + dx, hy + dy, C(c)); N[(hy + dy) * W + hx + dx] = 6; }
    for (let s = 1; s <= 8; s++) { const x = hx - Math.round(s * 0.62), y = hy + 1 + s; put(x, y, C(s < 7 ? '#7dff3a' : '#d4ffb0')); put(x + 1, y, C(s < 6 ? '#20a03a' : '#3ad44e')); N[y * W + x] = 6; N[y * W + x + 1] = 6; } }

  /* ---------- longe da luz, tudo some; a esquerda é breu para o nome e o menu ---------- */
  const DARK = C('#010205');
  const darken = (x, y) => {
    const n = N[y * W + x]; if (n === 4 || n === 6 || n === 8) return;
    const L = lightAt(x, y); const lit = (L ? L.a : 0) + (n === 0 ? 0.1 : n === 1 ? 0.08 : n === 3 ? 0.16 : 0.05) + beamAt(x, y) * 0.3;
    const left = cl((175 - x) / 150, 0, 1) * 0.55;
    const dk = cl(0.75 - lit * 1.9 + left, 0, 0.94);
    if (dk > 0) put(x, y, mix(get(x, y), DARK, qa(dk, x, y, n === 3 ? 20 : 8)));
  };
  for (let y = 0; y < WL; y++) for (let x = 0; x < W; x++) darken(x, y);
  // os feixes de luar por cima de tudo (menos da Lua)
  for (let y = MOON.y; y < WL; y++) for (let x = 200; x < W; x++) { if (N[y * W + x] === 4) continue; const a = beamAt(x, y); if (a > 0.02) blend(x, y, C('#c8dcff'), qa(a * 0.5, x, y, 6)); }

  /* ---------- a Dama do Espelho: a mesma figura do 256 (a Dama da Luz), pintada aqui por pixel, bem maior ---------- */
  const DAMA = mkL(), REFL = mkL();
  const DY = -14, Y = v => v + DY;                       // a figura toda um pouco acima do espelho (ela paira)
  const SH = Y(52), WA = Y(75), HEM = Y(156);           // ombros, cintura alta, barra
  const HX0 = 310, HY0 = Y(26);                         // o canto da cabeça
  const SPARK = [];                                      // pontos da barra que se desfaz (para as centelhas por quadro)
  const HAIRPTS = [];                                    // pontos claros do cabelo (para o brilho correr)
  function paintDama(Lr, ph) {
    const SK = ph ? kPELE2 : kPELE, HR = ph ? kCAB2 : kCAB, GW = ph ? kVES2 : kVES, TR = ph ? kPRATA2 : kOURO, GEM = ph ? kSANGUE : kLUAZ;
    const P1 = (x, y, r, v, e = 0, z = 0) => lput(Lr, x, y, r, v, e, z);
    const sparkle = (x, y, z) => {
      if (ph) { const em = h2(x, y, 223) < 0.45; P1(x, y, em ? kSANGUE : kSOMBRA, em ? 0.55 + h2(x, y, 224) * 0.45 : 0.3 + h2(x, y, 224) * 0.4, em ? 1 : 0, z); }
      else { P1(x, y, kLUAZ, 0.62 + h2(x, y, 224) * 0.38, 1, z); SPARK.push(x, y); }
    };
    /* 1. as mechas de trás: saem da nuca e boiam para trás em leque, ondulando; na Tentação sobem como debaixo d'água */
    const NL = 19;
    for (let k = NL - 1; k >= 0; k--) {
      const kk = k / (NL - 1), base = (h2(k, 3, 201) - 0.5) * 0.12;
      let x = 324 + kk * 4.5 + (h2(k, 6, 201) - 0.5) * 2, y = Y(28) + kk * 16, b = ph ? 1.25 + kk * 0.75 : 0.42 + kk * 0.5 + (h2(k, 7, 201) - 0.5) * 0.12;
      const len = (ph ? 46 : 86) + h2(k, 1, 201) * 24 - kk * 12, w0 = 4.2 - kk * 1.0 + h2(k, 2, 201) * 0.9, dark = (k % 3 === 1 ? 0.1 : 0) + kk * 0.05 - base;
      const wav = 0.009 + h2(k, 4, 201) * 0.005, ph0 = 1.2 + h2(k, 5, 201) * 1.2;
      for (let s = 0; s < len; s += 0.5) {
        const q = s / len, w = Math.max(0.5, w0 * (q < 0.55 ? 1 - q * 0.3 : 0.835 * (1 - (q - 0.55) / 0.45 * 0.85)));
        b += Math.sin(s * 0.075 + ph0) * wav + (q > 0.3 ? (ph ? 0.006 : 0.0042) : 0);
        const dx = Math.sin(b), dy = Math.cos(b); x += dx * 0.5; y += dy * 0.5;
        const nx = dy, ny = -dx;                     // o lado de cima/de trás da mecha, o que olha para a Lua
        for (let o = -w; o <= w; o += 0.5) {
          const px = x + nx * o, py = y + ny * o, u = o / (w + 0.3);
          let v = 0.64 + u * 0.16 - q * 0.1 + (q > 0.88 ? 0.1 : 0) - dark - (ph ? 0.2 : 0);
          if (Math.abs(u) > 0.75) v -= 0.08;                                   // a mecha se separa da vizinha
          v += (h2(Math.floor(o * 1.4 + k * 9), k, 202) - 0.5) * 0.08;        // os fios
          if (Math.abs(q - 0.15 - kk * 0.06) < 0.035) v += 0.2;               // o brilho que dá a volta no cabelo
          P1(px, py, HR, v, 0, 1);
          if (!ph && v > 0.66 && h2(Math.floor(px), Math.floor(py), 203) < 0.14) HAIRPTS.push(Math.floor(px), Math.floor(py));
        }
      }
    }
    /* 2. o braço de trás, aberto para trás, com a manga de anjo caindo (mais escuro, atrás do corpo) */
    const sleeve = (sx, sy, ex, ey, hx, hy, dk, Lmax, swing) => {
      tube(Lr, sx, sy, ex, ey, 3.4, 2.8, GW, (t, s, x, y, ln, d) => 0.62 - dk + s * 0.14 - d * 0.15 + (h2(x, y, 211) - 0.5) * 0.04, 0.7, -0.7, 2);
      tube(Lr, ex, ey, hx, hy, 2.6, 2, GW, (t, s, x, y, ln, d) => 0.6 - dk + s * 0.14 - d * 0.15 + (h2(x, y, 212) - 0.5) * 0.04, 0.7, -0.7, 2);
      // a manga: pende do antebraço, mais comprida no punho, varre para trás
      const n = 40;
      for (let i = 0; i <= n; i++) {
        const k = i / n, ax = lerp(ex, hx, k), ay = lerp(ey, hy, k) + 1.5, Lh = 3 + Math.pow(k, 1.25) * Lmax;
        for (let d = 0; d <= Lh; d += 0.5) {
          const q = d / Lh, xx = ax + swing * q * q * (0.5 + k), yy = ay + d;
          const fc = Math.cos(k * 15 + q * 2.5);
          let v = 0.62 - dk - q * 0.14 + fc * 0.12 + (k - 0.5) * 0.12 + (fc > 0.85 ? 0.06 : 0);
          if (d > Lh - 2 && k > 0.3) { P1(xx, yy, TR, 0.6 - dk + ((Math.floor(xx) & 1) ? 0.15 : 0), 0, 2); continue; }
          if (ph && d > Lh - 4 && k > 0.5 && h2(Math.floor(xx), Math.floor(yy), 213) < 0.3) { P1(xx, yy, kSANGUE, 0.5, 0, 2); continue; }
          P1(xx, yy, GW, v, 0, 2);
        }
      }
    };
    sleeve(331, Y(57), 340, Y(67), 348, Y(75), 0.14, 26, 5);
    tube(Lr, 348, Y(75), 351, Y(79), 1.4, 1, SK, (t, s) => 0.5 + s * 0.1, 0.7, -0.7, 2);   // a mão de trás
    /* 3. a saia: abre da cintura, a cauda varre para trás, as pregas, o bordado de ouro e a barra que vira luz */
    const DIS = 16;
    for (let y = WA; y <= HEM + 14; y++) {
      const t = cl((y - WA) / (HEM - WA), 0, 1.1), c0 = 321 + Math.pow(t, 1.5) * 10 + Math.sin(t * 2.6 + 0.5) * t * 2.5;
      const hwF = 7.5 + 23 * Math.pow(t, 0.95) + (ph ? t * 4 : 0), hwB = hwF + 17 * Math.pow(t, 2.2);
      for (let x = Math.floor(c0 - hwF - 2); x <= c0 + hwB + 2; x++) {
        const dx = x + 0.5 - c0, u = dx < 0 ? dx / hwF : dx / hwB; if (Math.abs(u) > 1) continue;
        const yb = HEM - Math.max(0, -u) * 4 + Math.sin(x * 0.21) * 2.2 + Math.sin(x * 0.067 + 1) * 2, dis = yb - y;
        if (dis < 0) { if (dis > -12 && h2(x, y, 226) < 0.2 * (1 + dis / 12)) sparkle(x, y, 3); continue; }   // centelhas soltas debaixo da barra
        let fade = 0;
        if (dis < DIS) { const k = dis / DIS; if (h2(x, y, 221) > Math.pow(k, 0.7)) { if (h2(x, y, 222) < 0.5) sparkle(x, y, 3); else if (k > 0.35 && !ph) P1(x, y, kLUAZ, 0.42 + k * 0.25, 1, 3); else if (k > 0.35) P1(x, y, kSOMBRA, 0.25, 0, 3); continue; } fade = 1 - k; }
        const cyl = Math.sqrt(Math.max(0, 1 - u * u)), lam = 0.4 + 0.34 * u + 0.26 * cyl;
        const fc = Math.cos(u * (3 + t * 8) + Math.sin(t * 3) * 0.7 * t + 0.6);
        let v = 0.12 + 0.74 * lam + fc * 0.17 * (0.3 + t) + (fc > 0.8 ? 0.09 : fc < -0.7 ? -0.15 : 0) - t * 0.04 + (h2(x, y, 225) - 0.5) * 0.02;
        if (u > 0.9) v += 0.1;
        v += ph ? -fade * 0.2 : fade * 0.28;          // perto da barra o pano já é luz (fumaça na Tentação)
        // o bordado de folhas logo acima de onde a barra se desfaz, e o filete de ouro em cima dele
        if (dis >= 17 && dis < 21 && ((x + Math.floor(dis)) % 4 === 0 || (dis >= 18 && dis < 20 && (x % 4 === 2)))) { P1(x, y, TR, 0.5 + lam * 0.4, 0, 3); continue; }
        if (dis >= 22 && dis < 23) { P1(x, y, TR, 0.4 + lam * 0.45 + ((x & 1) ? 0.08 : 0), 0, 3); continue; }
        // a Tentação: a saia de baixo carmesim aparece na abertura da frente
        if (ph && t > 0.2 && u < -0.1 && u > -0.1 - (t - 0.2) * 0.55) { P1(x, y, kSANGUE, 0.3 + fc * 0.1 + (u + 0.3) * 0.4 + lam * 0.3, 0, 3); continue; }
        P1(x, y, GW, v, 0, 3);
      }
    }
    /* 4. o corpete justo: o busto do lado da frente, a gola em V com o filete de ouro, o cinto alto com o broche */
    for (let y = SH; y < WA; y++) {
      const q = (y - SH) / (WA - SH), c0 = 320.5 + q * 0.5;
      let hw = q < 0.25 ? 9.6 + q * 3 : lerp(10.4, 7.4, (q - 0.25) / 0.75); if (q < 0.1) hw *= 0.78 + q * 2.2;
      const hwL = hw + 2.2 * Math.exp(-Math.pow((q - 0.42) / 0.14, 2));
      for (let x = Math.floor(c0 - hwL - 1); x <= c0 + hw + 1; x++) {
        const dx = x + 0.5 - c0, u = dx < 0 ? dx / hwL : dx / hw; if (Math.abs(u) > 1) continue;
        const cyl = Math.sqrt(Math.max(0, 1 - u * u)), lam = 0.42 + 0.32 * u + 0.26 * cyl;
        const vV = (SH + 13 - y) * 0.42, ax = Math.abs(x + 0.5 - 318.5);
        if (y < SH + 13 && ax < vV - 0.6) { P1(x, y, SK, 0.62 + lam * 0.3 - (y > SH + 9 ? 0.12 : 0) + (h2(x, y, 231) - 0.5) * 0.05, 0, 4); continue; }   // o decote
        if (y < SH + 13 && ax < vV + 0.8) { P1(x, y, TR, 0.5 + lam * 0.45, 0, 4); continue; }                                                         // a gola
        if (y >= WA - 3) { P1(x, y, TR, 0.35 + lam * 0.55 + (y === WA - 3 ? 0.12 : 0) + ((x & 1) ? 0.06 : 0), 0, 4); continue; }                    // o cinto
        let v = 0.16 + 0.7 * lam;
        if (q > 0.6 && q < 0.74 && u < 0.4) v -= 0.14;                       // a sombra debaixo do busto
        if (q > 0.3 && q < 0.5 && u > -0.75 && u < -0.2) v += 0.08;           // o busto pega luz
        if (Math.abs(u - 0.15) < 0.06 && q > 0.55) v -= 0.08;                 // a costura do meio
        P1(x, y, GW, v + (h2(x, y, 232) - 0.5) * 0.03, 0, 4);
      }
    }
    // o broche no cinto: a pedra da lua (a de sangue na Tentação) num engaste
    for (const [dx, dy, r, v, e] of [[-3, -2, GEM, 0.95, 1], [-2, -2, GEM, 0.7, 1], [-3, -1, GEM, 0.6, 1], [-2, -1, GEM, 0.5, 1], [-4, -2, TR, 0.9], [-1, -2, TR, 0.5], [-3, -3, TR, 0.85], [-3, 0, TR, 0.45]]) P1(321 + dx, WA + dy, r, v, e, 5);
    /* 5. o pescoço e a cabeça (três quartos para a esquerda, olhando para o herói lá embaixo) */
    for (let y = HY0 + 19; y <= SH + 1; y++) for (let x = 316; x <= 321; x++) P1(x, y, SK, 0.5 + (x - 316) * 0.05 - (y < HY0 + 23 ? 0.18 : 0) + (x === 316 ? -0.08 : 0), 0, 5);
    const HEAD = [
      '........xxxxx.......',
      '......xxhHHHhxx.....',
      '.....xhHHHHHHhhdx...',
      '....xhHHHHHHhhhhdx..',
      '...xhHHHHHhhhhhhhdx.',
      '...xhHHHhhhhhhhhhhdx',
      '..xoGGgoMMogGgohhhdx',
      '..xksSSoMmoSSskhhhdx',
      '..xsSSSSooSSSskdhhhd',
      '.xsSSSSSSSSSSskkdhhd',
      '.xbbsSSbbbSSsskkdhhd',
      '.xewSSwEEeSSskkKdhhd',
      'xsSSSSSSSSSSskkKdhhd',
      'xnSSSSSSSSssskKdhhhd',
      '.xSSSSSSSssskkKdhhhd',
      '..xSSSSSsssskKdhhhhd',
      '..xppSSsssskkkdhhhhd',
      '..xSSSssssskKdhhhhhd',
      '...xSssskkKxdhhhhhhd',
      '....xkkkkKx.dhhhhhd.',
      '.....xkKKx..dhhhhd..'];
    const HV = { x: [HR, 0.08], d: [HR, 0.36], h: [HR, 0.56], H: [HR, 0.8], b: [HR, 0.3], K: [SK, 0.18], k: [SK, 0.42], s: [SK, 0.62], S: [SK, 0.8], n: [SK, 0.4], p: [SK, 0.34], G: [TR, 0.85], g: [TR, 0.6], o: [TR, 0.32], M: [GEM, 0.92, 1], m: [GEM, 0.62, 1], E: [kLUAZ, 0.55], e: [kLUAZ, 0.12], w: [SK, 0.95] };
    if (ph) { HV.E = HV.w = [kVES, 1, 1]; HV.e = [kVES, 0.85, 1]; HV.b = [kVES, 0.75, 1]; HV.p = [kSANGUE, 0.55, 1]; HV.K = [SK, 0.08]; }
    HEAD.forEach((row, j) => [...row].forEach((ch, i) => { const hv = HV[ch]; if (!hv) return; P1(HX0 + i, HY0 + j, hv[0], hv[1], hv[2] || 0, 6); }));
    // a orelha pontuda, atrás, subindo por cima do cabelo: uma folha fina da base até a ponta, com contorno
    { const EAR = new Set();
      for (let st = 0; st <= 8; st += 0.25) { const cx0 = 13.6 + st * 0.85, cy0 = 12.4 - st * 0.95, w = 1.5 * (1 - st / 9) + 0.3; for (let o = -w; o <= w; o += 0.25) EAR.add(Math.round(cx0 + o * 0.7) + ',' + Math.round(cy0 + o * 0.7)); }
      for (const key of EAR) { const [i, j] = key.split(',').map(Number); const up = !EAR.has(i + ',' + (j - 1)); P1(HX0 + i, HY0 + j, SK, up ? 0.82 : 0.55 + (i - 13) * 0.02, 0, 7); }
      for (const key of EAR) { const [i, j] = key.split(',').map(Number); for (const [a2, b2] of [[1, 0], [0, 1], [1, 1], [0, -1], [-1, -1]]) { const k2 = (i + a2) + ',' + (j + b2); if (!EAR.has(k2) && i + a2 > 13) P1(HX0 + i + a2, HY0 + j + b2, SK, 0.14, 0, 7); } } }
    // a lua crescente da tiara, segurando a pedra
    for (const [i, j, v] of [[7, 5, 0.75], [10, 5, 0.6], [7, 4, 0.9], [10, 4, 0.7], [8, 5, 0.5], [9, 5, 0.45]]) P1(HX0 + i, HY0 + j, TR, v, 0, 7);
    if (ph) for (const [i, j] of [[3, 5], [3, 4], [4, 3], [6, 4], [6, 3], [6, 2], [7, 1], [9, 4], [9, 3], [9, 2], [9, 1], [9, 0], [12, 4], [12, 3], [12, 2], [15, 5], [15, 4]]) P1(HX0 + i, HY0 + j, TR, 0.55 + (j & 1) * 0.2, 0, 7);   // as pontas da coroa
    /* 6. a mecha da frente, caindo pelo ombro de trás por cima do vestido */
    for (let s = 0; s < 46; s += 0.5) { const y = HY0 + 14 + s, x = 324 + Math.sin(s * 0.18) * 1.2 + s * 0.12, w = 2.2 - s * 0.03;
      for (let o = -w; o <= w; o += 0.5) P1(x + o, y, HR, 0.5 + o * 0.12 + (h2(Math.floor(o * 2), 3, 241) - 0.5) * 0.14 - (s > 38 ? 0.1 : 0), 0, 8); }
    /* 7. o braço da frente estendido para o herói, a manga de anjo, a mão aberta com o luar na palma */
    sleeve(310, Y(58), 297, Y(62), 284, Y(64), 0, 30, 6);
    for (const [dx, dy, v] of [[0, 0, 0.62], [-1, 0, 0.72], [-2, 0, 0.75], [-3, 0, 0.7], [-4, -1, 0.66], [-5, -1, 0.6], [-1, 1, 0.48], [-2, 1, 0.52], [-3, 1, 0.5], [-4, 1, 0.42], [0, -1, 0.5], [-1, -1, 0.6], [-2, -1, 0.66], [-6, -2, 0.5], [-5, 0, 0.45]]) P1(284 + dx, Y(64) + dy, SK, v, 0, 9);
    if (!ph) for (const [dx, dy, v] of [[0, 0, 1], [1, 0, 0.85], [-1, 0, 0.85], [0, -1, 0.85], [0, 1, 0.6], [1, -1, 0.6], [-1, -1, 0.7]]) P1(PALM.x + dx, PALM.y - 1 + dy, kLUAZ, v, 1, 9);
  }
  paintDama(DAMA, 0);
  paintDama(REFL, 1);
  // a borda da Dama: do lado da Lua (direita e alto) acende; do outro, o tom mais escuro; e onde uma camada passa
  // por cima de outra, a de baixo ganha uma sombra fina
  const shadeFig = (Lr, rim) => {
    const r0 = Lr.r.slice(), v0 = Lr.v.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x; if (r0[i] < 0 || Lr.e[i]) continue;
      const up = r0[i - W] < 0, dn = r0[i + W] < 0, lf = r0[i - 1] < 0, rt = r0[i + 1] < 0;
      if (up || dn || lf || rt) {
        if (rim && (rt || (up && !lf))) { Lr.v[i] = Math.min(1, v0[i] + 0.28); continue; }
        Lr.v[i] = Math.min(v0[i], 0.05); continue;
      }
      const z = Lr.z[i];
      if ((Lr.z[i - W] > z && r0[i - W] !== r0[i]) || (Lr.z[i - 1] > z && r0[i - 1] !== r0[i]) || (Lr.z[i + 1] > z && r0[i + 1] !== r0[i]) || (Lr.z[i + W] > z && r0[i + W] !== r0[i])) Lr.v[i] = v0[i] - 0.16;
    }
  };
  shadeFig(DAMA, true); shadeFig(REFL, false);

  /* ---------- o espelho d'água: reflete a sala achatada (é luz de lua e água parada), com o reflexo trocado ---------- */
  // o que a água vê: a sala como está, com a Tentação no lugar da Dama
  const SRC = new Uint8ClampedArray(D);
  const srcPut = (x, y, c) => { const i = (y * W + x) * 4; SRC[i] = c[0]; SRC[i + 1] = c[1]; SRC[i + 2] = c[2]; };
  for (let i = 0; i < W * H; i++) { const r = REFL.r[i]; if (r < 0) continue; const x = i % W, y = (i / W) | 0; srcPut(x, y, REFL.e[i] ? rp(RAMPS[r], REFL.v[i], x, y) : rpc(RAMPS[r], REFL.v[i] * (r === kCAB2 ? 0.75 : r === kPELE2 ? 0.8 : 1.05) + 0.02, x, y)); }
  const ESP = P(['#010306', '#03070c', '#071017', '#0c1822', '#142432', '#203448', '#3e5e80']);
  const EMB = [];                                       // as brasas do reflexo, para piscarem por quadro
  const SQ = 1.65, sqd = d => d * SQ;                    // a água achata o reflexo (é um chão visto de cima)
  const sqInv = ys => (WL - 1 - ys) / SQ;
  const ripple = (x, y) => { const d = y - WL; return Math.round(Math.sin(y * 1.7 + Math.sin(x * 0.05 + y * 0.3) * 1.5) * Math.min(0.75, d * 0.02) + (fbm(x / 18, y / 2, 251) - 0.5) * Math.min(1.4, d * 0.04)); };
  for (let y = WL; y < H; y++) for (let x = 0; x < W; x++) {
    N[y * W + x] = 7;
    const d = y - WL, sy = Math.round(WL - 1 - sqd(d)), sx = cl(x + ripple(x, y), 0, W - 1);
    const base = rp(ESP, 0.18 + (fbm(x / 40, y / 6, 253) - 0.5) * 0.12 + Math.max(0, 1 - d / 40) * 0.1, x, y);
    let c = base;
    if (sy >= 1) { let j = sy * W + sx; if (REFL.e[j - W] && !REFL.e[j]) j -= W; const i = j * 4, i2 = (REFL.e[j] ? j : j - W) * 4, s = mix([SRC[i], SRC[i + 1], SRC[i + 2]], [SRC[i2], SRC[i2 + 1], SRC[i2 + 2]], 0.5), isR = REFL.r[j] >= 0, k = isR ? 0.92 - d / 500 : 0.78 - d / 200; c = mix(base, mix(s, C(isR ? '#2a3c60' : '#1c3048'), isR ? 0.1 : 0.22), k); if (REFL.e[j] && REFL.r[j] === kSANGUE) EMB.push(x, y); }
    // as linhas da água: faixas horizontais finas, mais juntas perto da beira
    const band = Math.sin(y * 2.3 + fbm(x / 30, y, 255) * 6);
    if (band > 0.93) c = mix(c, C('#7aa0d0'), 0.12 + Math.max(0, 1 - d / 60) * 0.1);
    else if (band < -0.9) c = mix(c, C('#010306'), 0.3);
    put(x, y, c);
  }
  // a beira da água encostando na parede: um fio aceso pela Lua
  for (let x = 0; x < W; x++) { const L = lightAt(x, WL - 1); blend(x, WL, C('#a4c4f0'), (L ? Math.min(0.7, L.a * 0.6) : 0) * (0.6 + h2(x, 1, 257) * 0.4)); }
  // o rastro de luz da tocha e da Lua na água: colunas tremidas embaixo das luzes
  for (let y = WL + 1; y < H; y++) {
    const d = y - WL;
    for (const [lx0, w, col, s] of [[TORCH.x, 2.2, '#ffb060', 0.55], [PALM.x, 1.6, '#d0e8ff', 0.3]]) for (let x = Math.floor(lx0 - w - 4); x <= lx0 + w + 4; x++) { const k = Math.abs(x - lx0 + ripple(x, y) * 1.5) / (w + d * 0.04); if (k < 1 && Math.sin(y * 1.9 + x) > -0.2) blend(x, y, C(col), (1 - k) * s * Math.max(0, 1 - d / 80)); }
  }
  // longe da luz, a água também some; a esquerda fica escura
  for (let y = WL; y < H; y++) for (let x = 0; x < W; x++) { const left = cl((185 - x) / 150, 0, 1) * 0.7, dk = cl(left + Math.max(0, y - WL - 50) / 400, 0, 0.92); if (dk > 0) put(x, y, mix(get(x, y), DARK, qa(dk, x, y, 8))); }

  /* ---------- por fim a Dama, que brilha sozinha: o luar pela direita, o próprio brilho por dentro ---------- */
  for (let i = 0; i < W * H; i++) {
    const r = DAMA.r[i]; if (r < 0) continue;
    const x = i % W, y = (i / W) | 0;
    let c;
    if (DAMA.e[i]) c = rp(RAMPS[r], DAMA.v[i], x, y);
    else {
      c = rpc(RAMPS[r], DAMA.v[i], x, y, 3.4);
      // a borda de baixo e da frente pega um pouco da tocha; a de cima, um azul de lua
      const tl = Math.max(0, 1 - Math.hypot(x - TORCH.x, y - TORCH.y) / 150);
      if (tl > 0 && r !== kOURO) c = mix(c, C('#ffb878'), tl * 0.16);
      c = mix(c, C('#9cb8e8'), 0.1 + Math.max(0, (x - 330) / 120) * 0.12);
    }
    put(x, y, c); N[i] = 5;
  }

  /* ---------- grão e vinheta ---------- */
  const VIG = C('#010103');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - W * 0.62) / (W * 0.62), ny = (y - H * 0.42) / (H * 0.95), d = Math.hypot(nx, ny);
    let c = get(x, y); const g = (h2(x, y, 999) - 0.5) * 6; c = [c[0] + g, c[1] + g, c[2] + g];
    const v = cl((d - 0.6) / 0.6, 0, 1) * 0.75; if (v > 0) c = mix(c, VIG, qa(v, x, y, 5));
    put(x, y, [cl(c[0], 0, 255), cl(c[1], 0, 255), cl(c[2], 0, 255)]);
  }
  cx.putImageData(img, 0, 0);

  /* ---------- o que mexe ---------- */
  const mkGlow = (r, rgb, k) => { const g = document.createElement('canvas'); g.width = g.height = r * 2; const gx = g.getContext('2d'); for (let y = 0; y < r * 2; y++) for (let x = 0; x < r * 2; x++) { const d = Math.hypot(x - r, y - r) / (r * 0.84); const a = qa(cl(1 - d, 0, 1), x, y, 4); if (a > 0) { gx.fillStyle = `rgba(${rgb},${a * k})`; gx.fillRect(x, y, 1, 1); } } return g; };
  const moonGlow = mkGlow(80, '200,220,255', 0.08), tGlow = mkGlow(30, '255,168,80', 0.08), pGlow = mkGlow(14, '208,232,255', 0.2), cGlow = mkGlow(12, '156,200,255', 0.14), eGlow = mkGlow(6, '230,240,255', 0.4), fGlow = mkGlow(4, '180,255,200', 0.3), rGlow = mkGlow(18, '208,42,58', 0.09);
  const FL = ['#fff4c0', '#ffd27a', '#f39a3a', '#d0601e', '#8a2e10'];
  const parts = [], rings = [];
  const motes = Array.from({ length: 34 }, (_, i) => ({ x: 250 + h2(i, 1, 301) * 220, y: 60 + h2(i, 2, 301) * 120, vx: (h2(i, 3, 301) - 0.5) * 2, vy: 1 + h2(i, 4, 301) * 2.5, ph: h2(i, 5, 301) * 6 }));
  const flies = [0, 1, 2, 3, 4].map(i => ({ x: [150, 236, 120, 262, 440][i], y: [110, 80, 128, 132, 128][i], ph: i * 1.7, r: 6 + i * 2 }));
  const REYE = [[HX0 + 7.5], [HX0 + 2]].map(([x]) => [Math.round(x), Math.round(WL + sqInv(HY0 + 11))]);
  let dripAt = 1.5, drip = null;
  function frame(fx, t, dt) {
    dt = Math.min(dt, 0.1);
    // o halo da Lua respira devagar
    fx.globalAlpha = 0.7 + Math.sin(t * 0.9) * 0.2; fx.drawImage(moonGlow, MOON.x - 80, MOON.y - 80); fx.globalAlpha = 1;
    // a tocha do herói
    fx.globalAlpha = 0.8 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.1; fx.drawImage(tGlow, TORCH.x - 30, TORCH.y - 30); fx.globalAlpha = 1;
    for (let j = 0; j < 5; j++) { const w = j < 1 ? 1 : j < 3 ? 2 : 1, sway = Math.round(Math.sin(t * 7 + j) * (j / 4) * 1.2); fx.fillStyle = FL[Math.min(4, j + (Math.sin(t * 15 + j * 2) > 0.5 ? 1 : 0))]; fx.fillRect(TORCH.x - (w > 1 ? 1 : 0) + sway, TORCH.y - j, w, 1); }
    if (Math.random() < dt * 5) parts.push({ x: TORCH.x + (Math.random() - 0.5) * 2, y: TORCH.y - 4, vx: (Math.random() - 0.5) * 6, vy: -(8 + Math.random() * 10), t: 0, life: 0.5 + Math.random() * 0.7, c: FL });
    // o luar na palma da Dama pulsa
    fx.globalAlpha = 0.65 + Math.sin(t * 2.2) * 0.25; fx.drawImage(pGlow, PALM.x - 14, PALM.y - 15); fx.globalAlpha = 1;
    if (Math.sin(t * 3.3) > 0.2) { fx.fillStyle = '#ffffff'; fx.fillRect(PALM.x, PALM.y - 3, 1, 1); }
    // centelhas subindo da barra que se desfaz
    if (SPARK.length && Math.random() < dt * 16) { const k = ((Math.random() * SPARK.length / 2) | 0) * 2; parts.push({ x: SPARK[k], y: SPARK[k + 1], vx: (Math.random() - 0.5) * 4, vy: -(4 + Math.random() * 8), t: 0, life: 0.8 + Math.random() * 1.2, c: ['#ffffff', '#d0e8ff', '#9cc8ff', '#4a7ad0', '#2a4a90'] }); }
    for (let i = parts.length - 1; i >= 0; i--) { const m = parts[i]; m.t += dt; if (m.t > m.life) { parts.splice(i, 1); continue; } m.x += (m.vx + Math.sin(m.t * 3 + i) * 2) * dt; m.y += m.vy * dt;
      const f = m.t / m.life; fx.globalAlpha = 1 - f * f; fx.fillStyle = m.c[Math.min(4, (f * 5) | 0)]; fx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); }
    fx.globalAlpha = 1;
    // o brilho correndo pelo cabelo: uma onda que desce pelas mechas
    for (let i = 0; i < HAIRPTS.length; i += 2) { const x = HAIRPTS[i], y = HAIRPTS[i + 1], w = Math.sin(t * 1.6 - (x - 320) * 0.07 - (y - 40) * 0.05); if (w > 0.82) { fx.globalAlpha = (w - 0.82) * 4; fx.fillStyle = '#fffbe8'; fx.fillRect(x, y, 1, 1); } }
    fx.globalAlpha = 1;
    // pó nos feixes de luar: só aparece dentro deles
    for (const p of motes) {
      p.x += (p.vx + Math.sin(t * 0.6 + p.ph) * 1.5) * dt; p.y += p.vy * dt; if (p.y > WL - 2) { p.y = 70; p.x = 250 + Math.random() * 220; }
      const k = beamAt(p.x, p.y); if (k < 0.08) continue;
      fx.globalAlpha = Math.min(0.85, k * 1.6); fx.fillStyle = k > 0.3 ? '#eef4ff' : '#9cb8e0'; fx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    fx.globalAlpha = 1;
    // vaga-lumes azul-verdes vagando perto das raízes
    for (const f of flies) { const x = Math.round(f.x + Math.sin(t * 0.5 + f.ph) * f.r * 2 + Math.sin(t * 1.7 + f.ph) * 3), y = Math.round(f.y + Math.sin(t * 0.8 + f.ph * 2) * f.r), on = 0.5 + 0.5 * Math.sin(t * 2.6 + f.ph * 3);
      if (on < 0.15) continue; fx.globalAlpha = on * 0.8; fx.drawImage(fGlow, x - 4, y - 4); fx.globalAlpha = on; fx.fillStyle = '#c8ffd8'; fx.fillRect(x, y, 1, 1); }
    fx.globalAlpha = 1;
    // os cristais respiram
    CRY.forEach(([x, y, s], i) => { fx.globalAlpha = (0.5 + Math.sin(t * 1.3 + i * 2) * 0.3) * s; fx.drawImage(cGlow, x - 12, y - 16); });
    fx.globalAlpha = 1;
    // uma gota de luar cai de um fio e abre anéis na água
    if (!drip && t > dripAt) { const [x, y] = DROPS[(Math.random() * DROPS.length) | 0]; drip = { x, y, v: 0 }; }
    if (drip) { drip.v += 140 * dt; drip.y += drip.v * dt; if (drip.y >= WL) { rings.push({ x: drip.x, t: 0 }); drip = null; dripAt = t + 1.5 + Math.random() * 3; } else { fx.fillStyle = '#a4cdf8'; fx.globalAlpha = 0.85; fx.fillRect(drip.x, Math.round(drip.y), 1, 2); fx.globalAlpha = 1; } }
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; if (r.t > 1.6) { rings.splice(i, 1); continue; } const k = r.t / 1.6, w = 2 + k * 22, a = (1 - k) * 0.6;
      fx.globalAlpha = a; fx.fillStyle = '#a4c4f0'; fx.fillRect(Math.round(r.x - w), WL + 1 + Math.round(k * 2), Math.round(w * 0.6), 1); fx.fillRect(Math.round(r.x + w * 0.4), WL + 1 + Math.round(k * 2), Math.round(w * 0.6), 1);
      if (k > 0.25) { const w2 = w * 0.55; fx.globalAlpha = a * 0.7; fx.fillRect(Math.round(r.x - w2), WL + 2 + Math.round(k * 4), Math.round(w2 * 0.6), 1); fx.fillRect(Math.round(r.x + w2 * 0.4), WL + 2 + Math.round(k * 4), Math.round(w2 * 0.6), 1); } }
    fx.globalAlpha = 1;
    // reflexos piscando no espelho, debaixo da Lua e dos feixes
    for (let i = 0; i < 14; i++) { const ph = Math.floor(t * 2 + i * 0.37), x = Math.round(250 + h2(i, ph, 311) * 220), y = Math.round(WL + 2 + h2(i, ph, 312) * 70), a = Math.sin((t * 2 + i * 0.37) % 1 * Math.PI); fx.globalAlpha = a * 0.6; fx.fillStyle = '#d8e8ff'; fx.fillRect(x, y, 2 + (i & 1), 1); }
    fx.globalAlpha = 1;
    // as brasas da barra do reflexo piscam
    const tb = Math.floor(t * 8);
    for (let i = 0; i < EMB.length; i += 2) { const q = h2(EMB[i], EMB[i + 1] + tb, 321); if (q < 0.1) { fx.globalAlpha = 0.5 + q * 5; fx.fillStyle = q < 0.04 ? '#ffc0c0' : '#ff6a6a'; fx.fillRect(EMB[i], EMB[i + 1], 1, 1); } }
    fx.globalAlpha = 1;
    // os olhos brancos do reflexo acendem e apagam devagar
    const eo = 0.5 + 0.5 * Math.sin(t * 1.1);
    fx.globalAlpha = 0.4 + eo * 0.6; fx.drawImage(rGlow, REYE[0][0] - 20, REYE[0][1] - 18);
    fx.globalAlpha = 0.35 + eo * 0.55; for (const [x, y] of REYE) { fx.drawImage(eGlow, x - 6, y - 6); fx.fillStyle = '#ffffff'; fx.fillRect(x, y, 1, 1); }
    fx.globalAlpha = 1;
  }
  return { canvas: cv, frame };
}
var TITLE_ARTS = TITLE_ARTS || []; TITLE_ARTS.push(paintTitleArtElfos);
