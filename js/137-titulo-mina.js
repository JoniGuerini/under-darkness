'use strict';
/* arte da tela de título: A Mina Abandonada. Uma galeria funda escorada com madeira: o vigamento do teto, os
   esteios, um lampião de mineiro pendurado na viga, trilhos no chão e um vagonete esquecido; atrás, a boca de
   uma galeria escura que desce ainda mais. À direita, uma ponte de cavaletes carrega os trilhos por cima de uma
   fornalha de tijolo que ainda arde. Na ponte, quebrada na ponta, o Rei Goblin na Escavadeira: a caldeira com a
   chaminé, o chassi de tábuas com a caveira e as dinamites pintadas, as três rodas, a broca apontada para baixo,
   e ele na cabine, de capacete de mineiro com a coroa pregada, erguendo uma banana de dinamite acesa.
   O herói, no chão entre os trilhos, ergue a tocha e olha para cima. O lado esquerdo fica escuro para o nome e o menu.
   Pintada uma vez (480x270, 39-titulo sorteia entre as artes de TITLE_ARTS). Por quadro mexem só coisas pequenas:
   a chama da tocha, a fumaça da chaminé, o pavio da dinamite, o brilho do lampião e da fornalha (com fagulhas),
   o reflexo girando na broca e pedrinhas caindo da ponta quebrada da ponte. */
function paintTitleArtMina() {
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
  const N = new Uint8Array(W * H);   // 0 fundo, 1 plano distante, 2 rocha, 3 madeira/ferro da frente, 5 o chefe, 6 herói, 7 fogo
  const M = (x, y) => inb(x, y) ? N[y * W + x] : 2;

  /* ---------- paletas do jogo (80-mina-blocos, 81-mina-objetos, 82-mina-bichos, 85-rei-goblin) ---------- */
  const R = {
    ferrosa: P(['#140c0b', '#271614', '#3e211c', '#593026', '#764233', '#925845', '#ae7058']),
    ferrosaW: P(['#0a0605', '#100a08', '#160d0b', '#1d110e', '#251612', '#2d1b16']),
    jaspe: P(['#1e0806', '#38100a', '#561a10', '#762618', '#963624', '#b04a34', '#c86448']),
    rejeito: P(['#1b1a19', '#2d2b29', '#43403c', '#5a5650', '#726d66', '#8b857c']),
    entulho: P(['#16110f', '#28201c', '#3d322c', '#54473e', '#6c5d51', '#857466']),
    viga: P(['#120a06', '#21130b', '#331e11', '#472a18', '#5c3821', '#72482b']),
    madeira: P(['#140b05', '#26160a', '#3c2412', '#56361c', '#724a28', '#8e6036', '#aa7a48']),
    velha: P(['#100b08', '#1c140e', '#2c2016', '#3e2e20', '#52402c', '#66523a', '#7c6648']),
    ferro: P(['#0e0e11', '#1c1c21', '#2e2f36', '#44464f', '#5e616c', '#7c808c', '#a2a6b2']),
    latao: P(['#2a1a06', '#4a300c', '#6e4a14', '#966820', '#bc8a30', '#dcae4a', '#f4d27a']),
    ouro: P(['#3a2404', '#6a4a0c', '#a87808', '#d8a420', '#f0c43a', '#fce07a', '#fff6c8']),
    tijolo: P(['#170a08', '#2f1410', '#4a1f17', '#662a1f', '#82392a', '#9c4d39', '#b4644c']),
    fogo: P(['#3a0c02', '#6e1c04', '#a83a08', '#e06414', '#ff9a2a', '#ffd070', '#fff4c8']),
    vidroL: P(['#5a2004', '#8a3a08', '#c26014', '#f08a24', '#ffb04a', '#ffd88a', '#fff4d0']),
    osso: P(['#2a2620', '#46403a', '#665e54', '#8a8072', '#aea290', '#cec2ae', '#ece2cc']),
    ossoB: P(['#241e16', '#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6']),
    pele: P(['#141a10', '#22301a', '#344628', '#4a5e38', '#62784a', '#7c925e', '#9cae78']),
    manto: P(['#1e0608', '#360a0e', '#521216', '#701c20', '#8e2a2c', '#aa3e3c', '#c4584e']),
    pelo: P(['#2a2620', '#46403a', '#665e54', '#8a8072', '#aea290', '#cec2ae', '#ece2cc']),
    vidro: P(['#0a1e2a', '#123a50', '#1a5a78', '#2a80a0', '#4aa8c8', '#80d0e8', '#c8f4ff']),
    boca: P(['#100404', '#200808', '#341010', '#4a1818', '#622222', '#7a2e2e', '#963c3c']),
    luz: P(['#5a2004', '#8a3a08', '#c26014', '#f08a24', '#ffb04a', '#ffd88a', '#fff4d0']),
    corda: P(['#1e160c', '#33261a', '#4c3a26', '#665034', '#806844', '#9a8058', '#b49a70']),
    carvao: P(['#060608', '#0c0c0f', '#141418', '#1c1c22', '#26262d', '#32323a', '#42424c'])
  };
  const v6 = (pal, v, x, y) => rp(pal, v / (pal.length - 1), x, y);   // valor 0..6 como nas rampas do jogo

  /* ---------- palcos ---------- */
  const yCeil = x => 15 + (fbm(x / 26, 1, 3) - 0.5) * 12 + Math.max(0, 150 - x) * 0.25;
  const yFloor = x => 236 + (fbm(x / 22, 3, 7) - 0.5) * 5 + Math.max(0, 70 - x) * 0.25;
  const CAP = { y0: 27, y1: 34, a: 186 };                                    // a viga do teto (capa do quadro de escoramento)
  const POSTS = [[193, 7]];                                                  // esteio da galeria (x, largura)
  const DECK = { a: 300, y0: 179, y1: 186 };                                 // a ponte de cavaletes
  const TPOSTS = [[312, 6], [356, 6], [400, 6], [444, 6]];
  const capAt = (x, y) => x >= CAP.a && y >= CAP.y0 && y < CAP.y1;
  const postAt = (x, y) => { for (const [px, w] of POSTS) if (x >= px && x < px + w && y >= CAP.y1 && y < yFloor(x) + 1) return true; return false; };
  const deckEnd = y => DECK.a + (y - DECK.y0) * 0.6 + (h2(y, 1, 5) - 0.5) * 3;   // a ponta quebrada, lascada
  const deckAt = (x, y) => y >= DECK.y0 && y < DECK.y1 && x >= deckEnd(y);
  const tpostAt = (x, y) => { for (const [px, w] of TPOSTS) if (x >= px && x < px + w && y >= DECK.y1 && y < yFloor(x) + 1) return true; return false; };
  // as mãos-francesas em X entre os cavaletes (não na baia da fornalha)
  const braceAt = (x, y) => { if (y < DECK.y1 + 2 || y > 233) return false; for (let k = 0; k < TPOSTS.length - 1; k++) { if (k === 2) continue; const a = TPOSTS[k][0] + 6, b = TPOSTS[k + 1][0], t = (x - a) / (b - a); if (t < 0 || t > 1) continue; const ya = DECK.y1 + 2 + t * 46, yb = 233 - t * 46; if (Math.abs(y - ya) < 1.6 || Math.abs(y - yb) < 1.6) return true; } return false; };
  const rockAt = (x, y) => y < yCeil(x) || y > yFloor(x);

  /* ---------- a Escavadeira: desenhada no espaço do sprite do jogo (60x40, virada para a direita), espelhada e ampliada ---------- */
  const K = 2.9, ORX = 474, ORY = DECK.y0 - 39.4 * K;          // x do sprite 0 -> tela ORX (virada para a esquerda); rodas sobre a ponte
  const SX = dx => ORX - dx * K, SY = dy => ORY + dy * K;
  const DA = 0.2;                                              // a broca apontada um pouco para baixo

  /* ---------- luzes ---------- */
  const HERO = { x: 214, y: 0 }; HERO.y = Math.round(yFloor(HERO.x + 6)) - 22;
  const TORCH = { x: HERO.x + 13, y: HERO.y + 1 };
  const LANT = { x: 263, y: 64 };                                           // lampião pendurado na viga
  const FURN = { x: 422, y: 222 };                                          // boca da fornalha
  const HLAMP = { x: SX(23 + 15), y: SY(-6 + 2.6) };                        // o lampião do capacete do rei
  const FIREBOX = { x: SX(7), y: SY(25) };                                  // a fornalha da caldeira
  const lights = [
    { x: TORCH.x, y: TORCH.y, r: 125, c: C('#ffa850'), s: 1.25 },
    { x: LANT.x, y: LANT.y + 4, r: 95, c: C('#ffb04a'), s: 0.85 },
    { x: FURN.x, y: FURN.y, r: 120, c: C('#ff7a24'), s: 1.0 },
    { x: FIREBOX.x, y: FIREBOX.y, r: 55, c: C('#ff8a30'), s: 0.7 },
    { x: HLAMP.x, y: HLAMP.y, r: 60, c: C('#ffc860'), s: 0.55 },
    { x: 150, y: 150, r: 70, c: C('#c87830'), s: 0.18 },                    // um lampião longe, na galeria do fundo
  ];
  const lightAt = (x, y) => { let a = 0, r = 0, g = 0, b = 0;
    for (const L of lights) { const d = Math.hypot(x - L.x, (y - L.y) * 1.1); if (d >= L.r) continue; const f = Math.pow(1 - d / L.r, 1.5) * L.s; a += f; r += L.c[0] * f; g += L.c[1] * f; b += L.c[2] * f; }
    return a > 0 ? { a, c: [r / a, g / a, b / a] } : null; };
  // direção da luz mais forte num ponto (para acender as bordas)
  const lightDir = (x, y) => { let bx = 0, by = 0; for (const L of lights) { const d = Math.hypot(x - L.x, y - L.y); if (d >= L.r || d < 1) continue; const f = Math.pow(1 - d / L.r, 1.5) * L.s; bx += (L.x - x) / d * f; by += (L.y - y) / d * f; } return [bx, by]; };

  /* ---------- fundo: parede de rocha ferrosa, a boca de uma galeria que desce, quadros de escoramento sumindo ---------- */
  const BACK = P(['#070404', '#0c0706', '#120a08', '#190e0b', '#21130f', '#2a1813', '#341e18']);
  const FAR = P(['#050303', '#0a0605', '#100a08', '#160d0b', '#1d110e', '#251612']);
  const ADIT = { x: 212, w: 80, top: 112, fl: 236 };                         // a galeria de trás (boca larga)
  const aditIn = (x, y) => { const hw = ADIT.w / 2, c = ADIT.x + hw; return y > ADIT.top + Math.pow(Math.abs(x - c) / hw, 4) * 26 && Math.abs(x - c) < hw && y < ADIT.fl; };
  // quadros de madeira dentro da galeria, cada vez menores e mais escuros (perspectiva)
  const FRAMES = [0.72, 0.5, 0.36].map((k, i) => { const c = ADIT.x + ADIT.w / 2 + 6 * (1 - k), hw = ADIT.w / 2 * k, top = 236 - (236 - ADIT.top) * k * 1.05, bot = 236 - 30 * (1 - k); return { c, hw, top, bot, i, k }; });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const L = lightAt(x, y);
    let c;
    if (aditIn(x, y)) {
      N[y * W + x] = 1;
      const deep = Math.hypot((x - ADIT.x - ADIT.w / 2 - 4) / ADIT.w, (y - 200) / 90);
      c = rp(FAR, 0.05 + deep * 0.5 + (fbm(x / 6, y / 5, 23) - 0.5) * 0.3 + (L ? L.a * 0.4 : 0), x, y);
      for (const F of FRAMES) {   // esteios e capa de cada quadro
        const post = (Math.abs(x - (F.c - F.hw)) < 3 * F.k || Math.abs(x - (F.c + F.hw)) < 3 * F.k) && y > F.top && y < F.bot;
        const cap = y > F.top && y < F.top + 5 * F.k + 1 && Math.abs(x - F.c) < F.hw + 3 * F.k;
        if (post || cap) c = rp(R.viga, 0.03 + F.k * F.k * 0.3 + (L ? L.a * 0.3 * F.k : 0) + (cap && y < F.top + 1.5 ? 0.15 : 0), x, y);
      }
    } else {
      const band = Math.sin(y * 0.33 + fbm(x / 22, y / 16, 25) * 14) * (0.2 + fbm(x / 60, y / 30, 26) * 0.9);
      const t = 0.2 + (fbm(x / 7, y / 5, 21) - 0.5) * 0.5 + (fbm(x / 30, y / 18, 22) - 0.5) * 0.3 + (band > 0.6 ? 0.1 : band < -0.5 ? -0.06 : 0) + (L ? L.a * 0.4 : 0);
      c = rp(BACK, t, x, y);
      if (band > 0.75 && L && L.a > 0.15) c = mix(c, R.jaspe[3], qa(L.a * 0.35, x, y, 4));   // faixas de jaspe pegando a luz
    }
    // poeira no ar, perto do chão
    const fog = Math.exp(-Math.pow((y - 205) / 38, 2)) * (0.25 + fbm(x / 40, y / 12, 27) * 0.5);
    c = mix(c, C('#2a1e1a'), qa(fog * 0.45, x, y, 5));
    put(x, y, c);
  }
  // moldura de madeira na boca da galeria
  for (let y = ADIT.top - 4; y < 236; y++) for (let x = ADIT.x - 6; x < ADIT.x + ADIT.w + 6; x++) {
    const c0 = ADIT.x + ADIT.w / 2, d = Math.abs(x - c0);
    const post = d > ADIT.w / 2 - 1 && d < ADIT.w / 2 + 5 && y > ADIT.top + 6;
    const cap = y >= ADIT.top - 4 && y < ADIT.top + 4 && d < ADIT.w / 2 + 7;
    if (!post && !cap) continue;
    const L = lightAt(x, y), lit = L ? L.a : 0;
    let v = 2 + (fbm(x / (cap ? 9 : 1.5), y / (cap ? 1.5 : 9), 31) - 0.5) * 2 + (cap && y < ADIT.top - 2 ? 1.2 : 0) + (post && x > c0 ? 0.6 : 0);
    put(x, y, v6(R.viga, v * (0.35 + lit * 1.1), x, y)); N[y * W + x] = 1;
  }

  /* ---------- a fornalha de tijolo debaixo da ponte (o fogo que nunca apagou) ---------- */
  const FW = { a: 404, b: 442, top: 186 };
  for (let y = FW.top; y < 237; y++) for (let x = FW.a; x < FW.b; x++) {
    const row = Math.floor(y / 3), off = row % 2 ? 2 : 0, mortar = y % 3 === 2 || (x + off) % 5 === 4;
    const L = lightAt(x, y), lit = L ? L.a : 0;
    const mdx = (x + 0.5 - FURN.x) / 11, mdy = (y + 0.5 - (FURN.y + 2)) / 10;
    const mouth = y < 234 && (mdy < 0 ? mdx * mdx + mdy * mdy <= 1 : Math.abs(mdx) <= 1);
    if (mouth) { const d = Math.hypot(mdx, Math.max(0, -mdy)); put(x, y, v6(R.fogo, 5.8 - d * 2.6 - (234 - y) * 0.05 + (fbm(x / 2, y / 2, 33) - 0.5) * 1.4, x, y)); N[y * W + x] = 7; continue; }
    let v = mortar ? 1.2 : 3.4 + h2(Math.floor((x + off) / 5), row, 35) * 1.2 - (x - FW.a) / 38 * 1.2;
    const soot = fbm(x / 8, y / 10, 37); if (soot > 0.55 && y < FURN.y - 6) v -= 1.6;
    // a borda do arco acesa pelo fogo
    const ring = Math.hypot(mdx, Math.max(0, -mdy)); if (ring < 1.35 && !mouth) v += (1.35 - ring) * 4;
    put(x, y, v6(R.tijolo, v * (0.25 + lit * 0.75), x, y)); N[y * W + x] = 3;
  }
  for (let x = FW.a + 7; x < FW.b - 7; x += 3) for (let y = 228; y < 234; y++) { put(x, y, v6(R.ferro, y === 228 ? 2.6 : 1.4, x, y)); N[y * W + x] = 3; }   // a grelha
  for (let x = FW.a - 2; x < FW.b + 2; x++) for (let y = FW.top - 2; y < FW.top; y++) { put(x, y, v6(R.tijolo, 1.2, x, y)); N[y * W + x] = 3; }

  /* ---------- rocha: teto e chão ---------- */
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rockAt(x, y)) N[y * W + x] = 2;
  const open = (x, y) => inb(x, y) && N[y * W + x] !== 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (N[y * W + x] !== 2) continue;
    const L = lightAt(x, y), lit = L ? L.a : 0, floor = y > 150;
    // ferro bandado: camadas finas e onduladas de óxido preto e jaspe vermelho
    const band = Math.sin(y * 0.55 + fbm(x / 40, y / 14, 41) * 10 + x * 0.02);
    let pal = floor ? (fbm(x / 18, y / 6, 43) > 0.5 ? R.rejeito : R.entulho) : band > 0.45 ? R.jaspe : R.ferrosa;
    let t = 0.32 + (fbm(x / 6, y / 4, 43) - 0.5) * 0.45;
    if (!floor && band > 0.8) t += 0.1;
    let e = 0;
    if (open(x, y - 1)) e = 0.4; else if (open(x, y - 2)) e = 0.2;
    if (open(x, y + 1) && !floor) e = 0.22;
    if (L) { const dx = Math.sign(TORCH.x - x); if (open(x + dx, y)) e += 0.2; }
    t = t * (0.22 + lit * 1.05) + e * (0.2 + lit * 0.9);
    let c = rp(pal, t, x, y);
    if (L) c = mix(c, L.c, qa(Math.min(0.45, lit * 0.35), x, y, 8));
    // brilhos de óxido cinza-aço onde a luz bate
    if (!floor && lit > 0.12 && h2(x, y, 47) > 0.985) c = mix(R.ferro[5], R.ferro[6], h2(x, y, 48));
    put(x, y, c);
  }
  // cascalho e pedrinhas no chão
  for (let n = 0; n < 160; n++) { const x = (h2(n, 1, 51) * W) | 0, y = Math.round(yFloor(x)) + ((h2(n, 2, 51) * 3) | 0) - 1; const L = lightAt(x, y), lit = L ? L.a : 0, r = 1 + (h2(n, 3, 51) > 0.7 ? 1 : 0);
    for (let j = -r; j <= 0; j++) for (let i = -r; i <= r; i++) { if (Math.hypot(i, j * 1.4) > r + 0.2) continue; put(x + i, y + j, v6(R.entulho, (3.4 - j * -0.6 - (i > 0 ? 0.8 : 0)) * (0.25 + lit * 1.0), x + i, y + j)); N[(y + j) * W + x + i] = 2; } }

  /* ---------- madeira da frente: viga do teto, tábuas por cima, esteio ---------- */
  const timberPx = (x, y, v, pal = R.madeira) => { const L = lightAt(x, y), lit = L ? L.a : 0; let c = v6(pal, v * (0.25 + lit * 1.0), x, y); if (L) c = mix(c, L.c, qa(Math.min(0.35, lit * 0.3), x, y, 6)); put(x, y, c); N[y * W + x] = 3; };
  for (let y = 0; y < CAP.y1; y++) for (let x = CAP.a - 4; x < W; x++) {
    if (capAt(x, y)) { const j = y - CAP.y0; let v = (j === 0 ? 4.6 : j === CAP.y1 - CAP.y0 - 1 ? 1.4 : 3.2) + (fbm(x / 10, y / 1.2, 53) - 0.5) * 1.8; if (x - CAP.a < 2) v -= 1; if ((x - CAP.a) % 44 === 20 && j === 2) v = 5.6; timberPx(x, y, v, R.madeira); continue; }
    // o tabuado entre a viga e a rocha (pranchas de pé, pregadas)
    if (y >= yCeil(x) - 1 && y < CAP.y0 && x >= CAP.a + 2) { const pl = Math.floor((x - CAP.a) / 6), i = (x - CAP.a) % 6; let v = (i === 0 ? 1 : i === 1 ? 3.6 : 2.6) + (fbm(x / 1.5, y / 8, 55 + pl) - 0.5) * 1.6 - (h2(pl, 0, 57) < 0.2 ? 1.2 : 0); timberPx(x, y, v, R.velha); }
  }
  for (let y = CAP.y1; y < H; y++) for (let x = 180; x < 205; x++) if (postAt(x, y)) { const i = x - POSTS[0][0]; let v = (i === 0 ? 1.2 : i === 1 ? 4.2 : i < 4 ? 3.4 : i === 6 ? 1.2 : 2.6) + Math.sin(y * 0.9 + x) * 0.25 + (fbm(x / 1.2, y / 10, 59) - 0.5) * 1.4; if (y < CAP.y1 + 3) v -= 1.2; timberPx(x, y, v, R.viga); }
  // as mãos-francesas entre esteio e viga
  for (let k = 0; k < 16; k++) for (let w = 0; w < 3; w++) { const x = POSTS[0][0] + 7 + k, y = CAP.y1 + 16 - k + w; if (N[y * W + x] !== 3 || w > 0) timberPx(x, y, w === 0 ? 3.8 : 2, R.viga); }

  /* ---------- a ponte de cavaletes: esteios, Xs, o tabuleiro quebrado na ponta, os trilhos ---------- */
  for (let y = DECK.y1; y < 238; y++) for (let x = 296; x < W; x++) {
    if (tpostAt(x, y)) { const i = (x - 312) % 44; timberPx(x, y, (i === 0 ? 1.2 : i === 1 ? 4.4 : i === 5 ? 1.2 : 2.8) + (fbm(x / 1.2, y / 9, 61) - 0.5) * 1.4, R.viga); }
    else if (braceAt(x, y)) timberPx(x, y, 2.6 + (fbm(x / 6, y / 6, 63) - 0.5) * 1.2, R.viga);
  }
  for (let y = DECK.y0; y < DECK.y1 + 3; y++) for (let x = 290; x < W; x++) {
    if (deckAt(x, y)) { const j = y - DECK.y0; timberPx(x, y, (j === 0 ? 4.6 : j === 1 ? 3.6 : j >= 6 ? 1.2 : 2.8) + (fbm(x / 10, y / 1.2, 65) - 0.5) * 1.6 - (x < DECK.a + 4 ? 0.8 : 0), R.madeira); }
  }
  // tábuas soltas penduradas da ponta quebrada
  for (const [x0, len, ang] of [[302, 18, 0.35], [309, 12, -0.15]]) for (let j = 0; j < len; j++) for (let w = 0; w < 3; w++) { const x = Math.round(x0 + Math.sin(ang) * j + w), y = DECK.y1 + j; if (inb(x, y)) timberPx(x, y, w === 0 ? 3.8 : w === 2 ? 1.2 : 2.6, R.madeira); }
  // dormentes e trilho no tabuleiro (o trilho torto na ponta, caindo)
  const railY = x => x < 318 ? DECK.y0 - 2 + (318 - x) * 0.35 : DECK.y0 - 2;
  for (let x = 298; x < W; x++) { const y = Math.round(railY(x)); if (x % 9 < 4 && x > DECK.a + 3) for (let j = 0; j < 1; j++) timberPx(x, DECK.y0 - 1, 3.6 - (x % 9) * 0.4, R.madeira);
    timberPx(x, y, 5.2 + (h2(x, 0, 67) < 0.2 ? 0.8 : 0), R.ferro); timberPx(x, y + 1, h2(x, 1, 67) < 0.25 ? 1 : 2.6, R.ferro); }
  // trilhos no chão de baixo, entrando na galeria
  for (let x = 66; x < 300; x++) { const fy = Math.round(yFloor(x)); if (x % 10 < 5) { timberPx(x, fy - 1, 3.2 - (x % 10) * 0.3, R.madeira); timberPx(x, fy, 1.8, R.madeira); }
    timberPx(x, fy - 3, 5.2 + (h2(x, 2, 69) < 0.2 ? 0.8 : 0) - (h2(x, 3, 69) < 0.15 ? 2 : 0), R.ferro); timberPx(x, fy - 2, h2(x, 4, 69) < 0.25 ? 1 : 2.6, R.ferro); }

  /* ---------- o vagonete esquecido nos trilhos e o mineiro morto no chão ---------- */
  { const ox = 112, oy = Math.round(yFloor(124)) - 22, s = 71;
    const cp = (x, y, pal, v) => { const X = ox + Math.round(x), Y = oy + Math.round(y); if (inb(X, Y)) timberPx(X, Y, v, pal); };
    for (let y = 6; y < 15; y++) { const inset = Math.round((y - 6) * 0.25); for (let x = 2 + inset; x < 24 - inset; x++) { const row = (y - 6) % 3; cp(x, y, R.madeira, 3.2 + (row === 0 ? 0.9 : row === 2 ? -0.8 : 0) - (x - 2) * 0.03 + (h2(x, y, s) - 0.5) * 0.5); } }
    for (const x of [2, 3, 22, 23]) for (let y = 6; y < 15; y++) cp(x - (x > 12 ? Math.round((y - 6) * 0.25) : -Math.round((y - 6) * 0.25)), y, R.ferro, x === 2 || x === 22 ? 4.2 : 2.6);
    for (let x = 1; x < 25; x++) { cp(x, 5, R.ferro, 4.8); cp(x, 6, R.ferro, 3); }
    for (let x = 4; x < 22; x++) cp(x, 15, R.ferro, 2.2);
    for (const wx of [7, 18]) for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const d = Math.hypot(i, j); if (d > 2.8) continue; cp(wx + i, 18 + j, R.ferro, d > 2 ? 4 - j * 0.5 : d < 0.8 ? 5 : 2.2); }
    for (let k = 0; k < 9; k++) { const lx = 4 + k * 2.2 + h2(k, 0, s) * 1.5, ly = 4 - Math.sin(k / 8 * Math.PI) * 2.6 + h2(k, 1, s), r = 2.2 + h2(k, 2, s) * 0.8; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { if (Math.hypot(i, j) > r) continue; const gold = k % 3 && h2(i + k * 9, j, s) > 0.82; cp(lx + i, ly + j, gold ? R.ouro : R.ferrosa, gold ? 5 : 4 - (i + j) * 0.4); } }
  }
  { const ox = 252, oy = Math.round(yFloor(264)) - 7;                            // os ossos do mineiro, capacete ainda na cabeça
    const bp = (x, y, pal, v) => { const X = ox + x, Y = oy + y; if (inb(X, Y)) timberPx(X, Y, v, pal); };
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) bp(2 + i, 3 + j, R.osso, 4.4 - j * 0.6 - i * 0.2);   // crânio
    bp(3, 4, R.boca, 0.5); bp(5, 4, R.boca, 0.5);
    for (let i = 0; i < 6; i++) bp(1 + i, 2, R.latao, 4.6 - i * 0.3); for (let i = 0; i < 4; i++) bp(2 + i, 1, R.latao, 3.8); bp(5, 1, R.luz, 5);
    for (let i = 0; i < 12; i++) bp(7 + i, 5 + (i > 8 ? 1 : 0), R.osso, 3.6);                // a espinha
    for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) bp(9 + k * 2, 3 + j, R.osso, 3 - j * 0.4);   // costelas
    for (let i = 0; i < 7; i++) { bp(18 + i, 6, R.osso, 3.2); }
    for (let i = 0; i < 9; i++) bp(10 + i, 0 + Math.round(i * 0.5) - 4 + 4, R.velha, 3); for (let j = -2; j <= 2; j++) bp(19 + Math.abs(j), 4 + j, R.ferro, 4 - Math.abs(j) * 0.6);   // a picareta
  }

  /* ---------- o lampião de mineiro pendurado na viga (81-mina-objetos, bigLantern) ---------- */
  { const ox = LANT.x - 7, oy = CAP.y1;
    const lp = (x, y, pal, v) => { const X = ox + x, Y = oy + y; if (!inb(X, Y)) return; const L = lightAt(X, Y); put(X, Y, v6(pal, v * (0.55 + Math.min(1, L ? L.a : 0) * 0.5), X, Y)); N[Y * W + X] = 7; };
    for (let y = 0; y < 22; y++) lp(6 + (y % 2), y, R.ferro, 4.2 - (y % 2) * 1.2);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) lp(3 + i, 22 + j, R.ferro, 4.4 - i * 0.3 - j); lp(7, 21, R.ferro, 5);
    for (let y = 24; y < 33; y++) for (let x = 2; x < 12; x++) { if (x === 2 || x === 11 || x === 6) { lp(x, y, R.latao, x === 2 ? 4.6 : x === 6 ? 3.6 : 2.6); continue; } lp(x, y, R.vidroL, 6.4 - Math.hypot(x - 6.5, y - 28) * 0.8); }
    for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) lp(1 + i, 33 + j, R.latao, 4.8 - i * 0.25 - j); for (let i = 0; i < 6; i++) lp(4 + i, 35, R.latao, 2.6 - i * 0.1);
    for (let y = 24; y < 33; y++) { lp(1, y, R.ferro, 1); lp(12, y, R.ferro, 1); }
  }

  /* ---------- o Rei Goblin na Escavadeira ---------- */
  const BI = new Int16Array(W * H).fill(-1), BV = new Float32Array(W * H), BN = new Float32Array(W * H * 2);
  const RAMPS = [];
  const rid = pal => { let i = RAMPS.indexOf(pal); if (i < 0) { RAMPS.push(pal); i = RAMPS.length - 1; } return i; };
  // escreve um pixel do chefe: rampa, valor e uma "normal" (para acender a borda do lado da luz)
  const bput = (X, Y, pal, v, nx = 0, ny = 0) => { if (!inb(X, Y)) return; const k = Y * W + X; BI[k] = rid(pal); BV[k] = v; BN[k * 2] = nx; BN[k * 2 + 1] = ny; };
  const gn = (x, y, s) => (fbm(x * 1.3, y * 1.3, s, 2) - 0.5);                     // o "cg" do jogo, mais fino
  // varre os pixels da tela de uma caixa no espaço do sprite; f(dx, dy) devolve [rampa, valor, nx, ny] ou null
  const fillD = (x0, y0, x1, y1, f) => { const X0 = Math.floor(SX(x1)) - 1, X1 = Math.ceil(SX(x0)) + 1, Y0 = Math.floor(SY(y0)) - 1, Y1 = Math.ceil(SY(y1)) + 1;
    for (let Y = Y0; Y <= Y1; Y++) for (let X = X0; X <= X1; X++) { const dx = (ORX - X - 0.5) / K, dy = (Y + 0.5 - ORY) / K; const r = f(dx, dy, X, Y); if (r) bput(X, Y, r[0], r[1], r[2] || 0, r[3] || 0); } };
  // a "blob" do jogo: base + 1.3 - (dx*0.8 + dy)*1.4 - d*0.7 (luz de cima à esquerda do sprite)
  const blob = (cx0, cy0, rx, ry, pal, s, base = 3.4, f) => fillD(cx0 - rx, cy0 - ry, cx0 + rx, cy0 + ry, (dx, dy) => { const ex = (dx - cx0) / rx, ey = (dy - cy0) / ry, d = ex * ex + ey * ey; if (d > 1) return null; return [pal, base + 1.3 - (ex * 0.8 + ey) * 1.4 - d * 0.7 + gn(dx, dy, s) * 0.8 + (f ? f(dx, dy, ex, ey) : 0), -ex, ey]; });
  const line = (x0, y0, x1, y1, pal, v, w = 1) => { const L2 = (x1 - x0) ** 2 + (y1 - y0) ** 2 || 1; fillD(Math.min(x0, x1) - w, Math.min(y0, y1) - w, Math.max(x0, x1) + w, Math.max(y0, y1) + w, (dx, dy) => { let t = ((dx - x0) * (x1 - x0) + (dy - y0) * (y1 - y0)) / L2; t = cl(t, 0, 1); const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t, d = Math.hypot(dx - px, dy - py); if (d > w / 2) return null; const nx = -(y1 - y0), ny = (x1 - x0), nn = Math.hypot(nx, ny) || 1, side = ((dx - px) * nx + (dy - py) * ny) / nn; return [pal, (typeof v === 'function' ? v(t) : v) - side / (w / 2) * 0.7 * Math.sign(-ny || 1), 0, 0]; }); };
  const rect = (x0, y0, w, h, pal, f) => fillD(x0, y0, x0 + w, y0 + h, (dx, dy) => { if (dx < x0 || dy < y0 || dx >= x0 + w || dy >= y0 + h) return null; const v = f(dx - x0, dy - y0, dx, dy); return v === null ? null : [pal, v]; });
  const S = 9001;
  // a broca (24x16 no jogo, presa no suporte em x 56, y 18): cone de ferro com o sulco em espiral
  const drillAt = (dx, dy) => { const ux = dx - 56, uy = dy - 26, i = Math.cos(DA) * ux + Math.sin(DA) * uy, j = -Math.sin(DA) * ux + Math.cos(DA) * uy; return [i, j]; };
  const DRILL_TIP = (() => { const i = 24, j = 0; return { x: SX(56 + Math.cos(DA) * i - Math.sin(DA) * j), y: SY(26 + Math.sin(DA) * i + Math.cos(DA) * j) }; })();
  fillD(52, 12, 82, 42, (dx, dy) => { const [i, j] = drillAt(dx, dy); if (i < 0 || i > 24) return null; const hw = 7.4 * (1 - i / 24); if (Math.abs(j) > hw || hw < 0.15) return null;
    if (i < 3) { if (Math.abs(j) > 7) return null; return [R.latao, 4.6 - i * 0.8 - (j + 7) * 0.06 + (Math.abs(j) > 6.2 ? -1 : 0), 0, j / 7]; }
    const dyn = j / Math.max(0.5, hw), groove = ((i * 0.7 + Math.asin(cl(dyn, -1, 1)) * 2.2) % 3.14 + 3.14) % 3.14;
    const g = groove < 0.7, edge = groove > 0.7 && groove < 0.95;
    return [R.ferro, 4.4 - dyn * 1.6 - (g ? 2.8 : 0) + (edge ? 1.3 : 0) + gn(i, j, S + 1) * 0.5 + (Math.abs(dyn + 0.4) < 0.16 ? 1.2 : 0), 0, dyn]; });
  // a caldeira: tambor de ferro com cintas de latão e rebites
  fillD(2, 7, 19, 23, (dx, dy) => { const yy = Math.floor(dy), xx = Math.floor(dx), ddy = (dy - 15) / 8; if (Math.abs(ddy) > 1 || dx < 2 || dx >= 19) return null; const band = (xx - 2) % 6 === 0, rivet = (xx - 2) % 6 === 1 && Math.abs(dy - (Math.floor(dy / 3) * 3 + 0.5)) < 0.32 && Math.abs(dx - xx - 0.5) < 0.32;
    let v = 4.2 - ddy * 1.8 - Math.abs(ddy) * 0.6 - (dx - 2) * 0.04 + gn(dx, dy, S) * 0.9; if (band) v += 0.6; if (rivet) v = 6;
    if (fbm(dx / 2, dy / 3, S + 5) > 0.68 && !band) return [R.ferrosa, v - 0.4, 0, ddy];   // ferrugem escorrendo
    return [band ? R.latao : R.ferro, v, 0, ddy]; });
  // a chaminé e o chapéu dela
  fillD(5, 0, 12, 8, (dx, dy) => { if (dy < 1 && dx >= 5 && dx < 12) return [R.ferro, 5 - (dx - 5) * 0.3, 0, -1]; if (dx < 6 || dx >= 11 || dy > 8) return null; return [R.ferro, 4.2 - (dx - 6) * 0.5 + (dy < 1.4 ? 1.2 : 0) + gn(dx, dy, S + 2) * 0.6 + (Math.floor(dy) % 3 === 2 ? -0.6 : 0), (8.5 - dx) / 2.5, 0]; });
  // o manômetro
  blob(16, 10, 2, 2, R.latao, S + 3, 4); fillD(15, 9, 17, 11, (dx, dy) => Math.hypot(dx - 16, dy - 10) < 1.1 ? [R.pelo, 6] : null); line(16, 10, 16.9, 9.2, R.boca, 1, 0.35);
  // o chassi: tábuas e cintas de ferro
  fillD(1, 20, 52, 33, (dx, dy) => { if (dx < 1 || dx >= 52 || dy < 20 || dy >= 33) return null; const row = Math.floor(dy - 20) % 4, fr = (dy - 20) % 4; let v = 3.2 + (row === 0 ? 1 : row === 3 ? -0.9 : 0) - (dx - 1) * 0.012 + gn(dx, dy, S) * 0.6 + (fbm(dx / 3, dy * 1.6, S + 7) - 0.5) * 0.9; if (fr > 3.75) v -= 1.4;   // fresta entre as tábuas
    if (Math.abs(dx - Math.round(dx / 8.5) * 8.5) < 0.25 && fr > 1 && fr < 2) v = 5;   // pregos
    return [R.madeira, v, 0, 0]; });
  for (const x of [1, 18, 35, 50]) fillD(x, 20, x + 2, 33, (dx, dy) => dx >= x && dx < x + 2 && dy >= 20 && dy < 33 ? [R.ferro, (dx < x + 1 ? 4.4 : 2.6) + (Math.abs((dy - 21.5) % 3) < 0.4 ? 1.4 : 0), 0, 0] : null);
  fillD(0, 19, 53, 34, (dx, dy) => { if (dx < 0 || dx >= 53) return null; if (dy >= 19 && dy < 20) return [R.ferro, 5, 0, -1]; if (dy >= 20 && dy < 20.6) return [R.ferro, 3.4]; if (dy >= 33 && dy < 34) return [R.ferro, 2.4, 0, 1]; return null; });
  // a portinhola da fornalha da caldeira, com o fogo pela grade
  fillD(4, 22, 11, 30, (dx, dy) => { if (dx < 4.2 || dx > 10.6 || dy < 22.4 || dy > 29.6) return null; const fr = dx < 4.8 || dx > 10 || dy < 23 || dy > 29; if (fr) return [R.ferro, dx < 4.8 || dy < 23 ? 4.6 : 2.4]; const slot = dy > 26 && Math.floor((dy - 23) / 1.2) % 2 === 0 && Math.abs(dx - 7.4) < 2.2; return slot ? [R.fogo, 4.4 - Math.abs(dx - 7.4) * 0.6 + gn(dx, dy, S + 9)] : [R.ferro, 2.2 + gn(dx, dy, S + 8)]; });
  // a caveira e as dinamites cruzadas pintadas no lado
  line(22, 30, 32, 22, R.jaspe, 4.2, 1.1); line(22, 22, 32, 30, R.jaspe, 4.2, 1.1);
  for (const [a, b] of [[22, 30], [22, 22]]) { const [ex, ey] = a === 22 && b === 30 ? [32, 22] : [32, 30]; fillD(ex - 1, ey - 1, ex + 1, ey + 1, (dx, dy) => Math.hypot(dx - ex, dy - ey) < 0.55 ? [R.luz, 6] : null); }
  blob(27, 26, 2.6, 2.2, R.ossoB, S + 5, 4.4);
  fillD(25, 25, 29, 28, (dx, dy) => (Math.hypot(dx - 26.2, dy - 26.1) < 0.6 || Math.hypot(dx - 27.9, dy - 26.1) < 0.6) ? [R.boca, 0.5] : (dy > 27.4 && dy < 28 && Math.abs(dx - 27) < 1.2 && Math.floor(dx * 2) % 2 === 0) ? [R.boca, 1] : null);
  // o encosto do banco e as alavancas (e um caixote de assento por baixo dele)
  rect(25, 13, 15, 6, R.madeira, (i, j) => 2.6 + (Math.floor(j) % 3 === 0 ? 0.9 : 0) - i * 0.04 + gn(i, j, S + 13) * 0.6);
  rect(22, 10, 2, 10, R.madeira, (i, j) => 3.6 - i + (Math.floor(j) % 4 === 0 ? 0.8 : 0) + gn(i, j, S + 8) * 0.6);
  line(40, 19, 43, 11, R.ferro, 4.2, 0.9); blob(43, 10.4, 1, 1, R.boca, S, 4.4);
  line(44, 19, 46, 13, R.ferro, 3.4, 0.9); blob(46, 12.4, 1, 1, R.ferro, S + 1, 5);
  // o suporte da broca
  rect(51, 21, 6, 10, R.ferro, (i, j) => 4.4 - i * 0.3 - (j > 7 ? 1.4 : 0) + (j < 1 ? 1 : 0) + gn(i, j, S + 4) * 0.5);
  for (let y = 22; y < 30; y += 3) fillD(54.5, y, 55.5, y + 1, (dx, dy) => Math.hypot(dx - 55, dy - y - 0.5) < 0.55 ? [R.latao, 5.4] : null);
  // as rodas: disco de ferro, aro, três raios, cubo de latão
  const wheel = (wx, wy, r, rot, s) => {
    fillD(wx - r, wy - r, wx + r, wy + r, (dx, dy) => { const ex = dx - wx, ey = dy - wy, d = Math.hypot(ex, ey); if (d > r) return null;
      const a = Math.atan2(ey, ex);
      if (d > r - 1) return [R.ferro, (Math.sin(a) < 0 ? 4.6 : 2) + (Math.abs(Math.sin(a * 6)) < 0.08 ? 1 : 0), -ex / r, ey / r];
      if (d < 1.4) return [R.latao, 4.4 + 1.3 - (ex * 0.8 + ey) - d * 0.5, -ex, ey];
      for (let k = 0; k < 3; k++) { const sa = rot + k * 1.047, sd = Math.abs(-Math.sin(sa) * ex + Math.cos(sa) * ey); if (sd < 0.6) return [R.ferro, 5 - sd * 1.5, 0, 0]; if (sd < 0.9) return [R.ferro, 1.2, 0, 0]; }
      return [R.ferro, 3 + 1.3 - (ex / r * 0.8 + ey / r) * 1.4 - (d / r) ** 2 * 0.7 + gn(dx, dy, s) * 0.6 - 2.2, -ex / r, ey / r]; });
  };
  wheel(9, 34, 5.4, 0, S + 10); wheel(26, 34, 5.4, 0.5, S + 11); wheel(43, 34, 5.4, 1, S + 12);
  // o rei na cabine (22x20 no jogo, posto em x 23, y -6), pose 1: erguendo a dinamite
  const KX = 23, KY = -6, kb = (x, y, rx, ry, pal, s, base, f) => blob(KX + x, KY + y, rx, ry, pal, s, base, f), kl = (x0, y0, x1, y1, pal, v, w) => line(KX + x0, KY + y0, KX + x1, KY + y1, pal, v, w);
  const kp = (x, y, pal, v, r = 0.55) => fillD(KX + x - 1, KY + y - 1, KX + x + 1, KY + y + 1, (dx, dy) => Math.hypot(dx - KX - x - 0.5, dy - KY - y - 0.5) < r ? [pal, v] : null);
  const SK = 9202;
  kb(9, 15, 7, 5.4, R.manto, SK, 3.4, (x, y) => (Math.floor(x * 1.5 + y * 1.5) % 5 === 0 ? -0.6 : 0) + (fbm(x * 2, y * 2, SK + 30) - 0.5) * 0.8);   // o manto vermelho
  fillD(KX + 2.5, KY + 9, KX + 16, KY + 12, (dx, dy) => { const x = dx - KX, y = dy - KY; if (x < 3 || x > 15.5) return null; const yy = 10.6 + Math.sin(x) * 0.4; if (Math.abs(y - yy) > 0.7 + (fbm(x * 3, 1, SK + 31) - 0.5) * 0.8) return null; return [R.pelo, 4.6 + (fbm(x * 4, y * 4, SK + 32) - 0.5) * 2.4 - (y - yy) * 0.8]; });   // a gola de pele
  kb(10, 15.6, 5, 4.6, R.pele, SK + 1, 3.6);   // a barriga
  const hx = 11, hy = 6.6;
  kl(hx - 3, hy + 0.4, hx - 7.4, hy - 1.6, R.pele, 4, 1.4); kb(hx - 7.6, hy - 1.9, 0.7, 0.6, R.pele, SK, 2.4);   // a orelha comprida
  kl(hx - 3.4, hy + 0.2, hx - 6.6, hy - 1.2, R.pele, 2.6, 0.5);
  kb(hx, hy, 4.2, 3.6, R.pele, SK + 2, 4.2);
  kb(hx + 1, hy + 2.6, 4, 1.8, R.pele, SK + 3, 3.4);   // as bochechas caídas
  kl(hx + 3.6, hy, hx + 6.2, hy + 1.2, R.pele, 5, 1.3); kb(hx + 6, hy + 1.6, 0.8, 0.7, R.pele, SK, 3);   // o nariz
  for (const gx of [hx + 0.8, hx + 3.2]) { kb(gx, hy - 0.6, 1.3, 1.2, R.latao, SK + 4, 3.4); fillD(KX + gx - 1, KY + hy - 1.6, KX + gx + 1, KY + hy + 0.4, (dx, dy) => { const d = Math.hypot(dx - KX - gx, dy - KY - hy + 0.6); return d < 0.75 ? [R.vidro, 5.6 - d * 2 + (dx - KX - gx < -0.2 && dy - KY - hy + 0.6 < -0.2 ? 1 : 0)] : null; }); }   // os óculos
  kl(hx - 0.4, hy + 2.6, hx + 3.4, hy + 3, R.boca, 0.8, 0.7); kp(hx + 0.4 - 0.5, hy + 2.2 - 0.5, R.ossoB, 5.6, 0.5); kp(hx + 2.8 - 0.5, hy + 2.4 - 0.5, R.ossoB, 5.4, 0.5);   // o sorriso largo e as duas presas
  // o capacete de mineiro com a coroa pregada e o lampião aceso
  kb(hx - 0.4, hy - 3.2, 4.6, 2, R.latao, SK + 5, 3.8, (x, y, ex, ey) => ey > 0.35 ? -1.4 : 0);
  kl(hx - 5, hy - 1.6, hx + 4, hy - 1.6, R.latao, 2.6, 0.8);
  kb(hx + 4, hy - 3.6, 0.9, 0.9, R.luz, SK, 5.6); kp(hx + 4 - 0.5, hy - 3.2, R.latao, 4.6);
  for (const c0 of [hx - 3, hx - 0.6, hx + 1.8]) { fillD(KX + c0 - 1, KY + hy - 7.2, KX + c0 + 1, KY + hy - 5, (dx, dy) => { const x = dx - KX - c0, y = dy - KY - (hy - 5.2); return Math.abs(x) < 0.55 - y * 0.25 && y > -1.6 && y < 0.1 ? [R.ouro, 5.4 + y * 0.4 - x * 0.6] : null; }); }
  kl(hx - 3.4, hy - 5, hx + 2.2, hy - 5, R.ouro, 5, 0.9); kp(hx - 0.6 - 0.5, hy - 5.5, R.jaspe, 6, 0.6);
  // o braço erguido com a dinamite (o pavio acende no frame)
  kl(13, 11, 19, 5, R.pele, 4.2, 2); kb(19, 5.2, 0.9, 0.9, R.pele, SK + 6, 4);
  kl(19, 5, 21, 2, R.jaspe, 4.6, 1.3); kl(18.7, 5.4, 20.5, 2.6, R.jaspe, 3.4, 0.5);
  kl(21, 2, 21.4, 1.2, R.corda, 3.2, 0.35);
  const FUSE = { x: Math.round(SX(KX + 21.5)), y: Math.round(SY(KY + 1.0)) };
  const EYEG = [hx + 0.8, hx + 3.2].map(gx => ({ x: Math.round(SX(KX + gx)), y: Math.round(SY(KY + hy - 0.6)) }));
  // pinta o chefe: luz de cena por cima do sombreado do jogo, contorno escuro como o "outlined" do jogo
  const BOUT = C('#0a0706');
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) { const k = Y * W + X; if (BI[k] < 0) continue;
    const L = lightAt(X, Y), lit = L ? L.a : 0, [lx, ly] = lightDir(X, Y), ll = Math.hypot(lx, ly) || 1;
    const lf = cl(lit * 1.3, 0, 1); let v = BV[k] * (0.6 + 0.4 * lf) - (1 - lf) * 1.1;
    const facing = (BN[k * 2] * lx + BN[k * 2 + 1] * ly) / ll; if (facing > 0) v += facing * Math.min(1, lit) * 1.6;
    // borda acesa: o lado do contorno virado para a luz
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (!inb(X + ox, Y + oy) || BI[(Y + oy) * W + X + ox] < 0) { if (ox * lx + oy * ly > 0.25 * ll) v += Math.min(1.4, lit * 2.2); }
    let c = v6(RAMPS[BI[k]], v, X, Y);
    if (L) c = mix(c, L.c, qa(Math.min(0.3, lit * 0.25), X, Y, 6));
    put(X, Y, c); N[k] = 5; }
  for (let Y = 1; Y < H - 1; Y++) for (let X = 1; X < W - 1; X++) { const k = Y * W + X; if (BI[k] >= 0) continue; if (BI[k - 1] >= 0 || BI[k + 1] >= 0 || BI[k - W] >= 0 || BI[k + W] >= 0) { put(X, Y, BOUT); N[k] = 5; } }

  /* ---------- o herói, no chão, tocha erguida ---------- */
  const HK = [ // o herói já com a armadura de placas de ouro, elmo de crista
    '....xxx.......',
    '...qoooq......',
    '..qoOOOoq.....',
    '.qoOooooq...t.',
    '.qooqqsWe...t.',
    '.qoqosssm...t.',
    '..qqosssq.oO..',
    '...qqssq.oOo..',
    '....qooq.oq...',
    '.qOooooooR....',
    '.qooOOooqr....',
    '..qoOOooqr....',
    '..qqooooqr....',
    '.ybbbbbbkb....',
    '.yqoqqoqrr....',
    '.yrrrrrrrr....',
    '.rrrrrrrrrr...',
    '.rrrrrrrrrr...',
    '..qooq.qoq....',
    '..qOq...Oq....',
    '..qoq...oq....',
    '.qqq....qqq...'];
  const HC = { h: '#4e2c1a', s: '#e2a982', W: '#f2ead8', e: '#1c1422', m: '#a5604a', n: '#8a6a48', r: '#6a2620', b: '#3a2618', k: '#c8a050', p: '#4b3b33', f: '#2a1c14', t: '#5a3a1e', o: '#d0a030', O: '#fff0a0', q: '#7a5418', x: '#a83020', R: '#8a2a20', y: '#9aa0aa' };
  for (let j = 0; j < HK.length; j++) for (let i = 0; i < HK[j].length; i++) { const ch = HK[j][i]; if (!HC[ch]) continue;
    let c = C(HC[ch]); const X = HERO.x + i, Y = HERO.y + j;
    if (ch !== 'W' && ch !== 'e') { const lx = (i - 4) / 10, up = (21 - j) / 21; c = mix(c, lx > 0.2 || up > 0.7 ? C('#ffc888') : C('#160e10'), lx > 0.2 || up > 0.7 ? cl(lx * 0.3 + up * 0.15, 0, 0.35) : 0.4); }
    if (ch === 'h' && (i + j) % 4 === 0) c = mix(c, C('#2a160c'), 0.4);
    put(X, Y, c); N[Y * W + X] = 6; }
  // sombra comprida no chão, para trás
  for (let x = HERO.x - 22; x < HERO.x + 2; x++) { const y = Math.round(yFloor(x)) + 1; if (M(x, y) === 2) blend(x, y, C('#050304'), 0.6 * (1 - (HERO.x + 2 - x) / 26)); }

  /* ---------- longe da luz, tudo some no escuro; a esquerda fica para o nome e o menu ---------- */
  const DARK = C('#030205');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = N[y * W + x]; if (n === 6 || n === 7) continue;
    const L = lightAt(x, y); const lit = (L ? L.a : 0) + (n === 0 ? 0.2 : n === 1 ? 0.14 : n === 5 ? 0.2 : n === 3 ? 0.08 : 0.06);
    const left = cl((170 - x) / 150, 0, 1) * 0.55;
    const dk = cl(0.7 - lit * 2.3 + left, 0, 0.92);
    if (dk > 0) put(x, y, mix(get(x, y), DARK, qa(dk, x, y, 8)));
  }
  /* ---------- grão e vinheta ---------- */
  const VIG = C('#020103');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - W * 0.6) / (W * 0.6), ny = (y - H * 0.45) / (H * 0.68), d = Math.hypot(nx, ny);
    let c = get(x, y); const g = (h2(x, y, 999) - 0.5) * 8; c = [c[0] + g, c[1] + g, c[2] + g];
    const v = cl((d - 0.62) / 0.6, 0, 1) * 0.75; if (v > 0) c = mix(c, VIG, qa(v, x, y, 5));
    put(x, y, [cl(c[0], 0, 255), cl(c[1], 0, 255), cl(c[2], 0, 255)]);
  }
  cx.putImageData(img, 0, 0);

  /* ---------- o que mexe ---------- */
  const mkGlow = (r, col, a0) => { const g = document.createElement('canvas'); g.width = g.height = r * 2; const c2 = g.getContext('2d'), [cr, cg2, cb] = C(col); for (let y = 0; y < r * 2; y++) for (let x = 0; x < r * 2; x++) { const d = Math.hypot(x - r, y - r) / (r * 0.84); const a = qa(cl(1 - d, 0, 1), x, y, 4); if (a > 0) { c2.fillStyle = `rgba(${cr},${cg2},${cb},${a * a0})`; c2.fillRect(x, y, 1, 1); } } return g; };
  const glow = mkGlow(36, '#ffa046', 0.06), lglow = mkGlow(30, '#ffb04a', 0.05), fglow = mkGlow(40, '#ff7a24', 0.05), sglow = mkGlow(8, '#ffe0a0', 0.25);
  const FL = ['#fff4c0', '#ffd27a', '#f39a3a', '#d0601e', '#8a2e10'];
  const parts = [], smoke = [], pebbles = [];
  const STACK = { x: Math.round(SX(8.5)), y: Math.round(SY(0)) - 1 };
  const DRL = []; for (let i = 4; i < 22; i += 1.5) DRL.push(i);
  let pebT = 1.2;
  function frame(fx, t, dt) {
    // chama da tocha
    const tx = TORCH.x, ty = TORCH.y;
    fx.globalAlpha = 0.8 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.1; fx.drawImage(glow, tx - 36, ty - 36); fx.globalAlpha = 1;
    for (let j = 0; j < 5; j++) { const w = j < 1 ? 1 : j < 3 ? 2 : 1, sway = Math.round(Math.sin(t * 7 + j) * (j / 4) * 1.2); fx.fillStyle = FL[Math.min(4, j + (Math.sin(t * 15 + j * 2) > 0.5 ? 1 : 0))]; fx.fillRect(tx - (w > 1 ? 1 : 0) + sway, ty - j, w, 1); }
    if (Math.random() < dt * 6) parts.push({ x: tx + (Math.random() - 0.5) * 2, y: ty - 4, vx: (Math.random() - 0.5) * 6, vy: -(8 + Math.random() * 10), t: 0, life: 0.6 + Math.random() * 0.8 });
    // o lampião da viga e a fornalha respiram
    fx.globalAlpha = 0.75 + Math.sin(t * 2.3) * 0.12 + Math.sin(t * 11) * 0.05; fx.drawImage(lglow, LANT.x - 30, LANT.y - 26); fx.globalAlpha = 0.7 + Math.sin(t * 1.7) * 0.15 + Math.sin(t * 7.3) * 0.08; fx.drawImage(fglow, FURN.x - 40, FURN.y - 40); fx.globalAlpha = 1;
    if (Math.random() < dt * 4) parts.push({ x: FURN.x + (Math.random() - 0.5) * 14, y: FURN.y + 4, vx: (Math.random() - 0.5) * 8, vy: -(10 + Math.random() * 14), t: 0, life: 0.8 + Math.random() * 0.9 });
    for (let i = parts.length - 1; i >= 0; i--) { const m = parts[i]; m.t += dt; if (m.t > m.life) { parts.splice(i, 1); continue; } m.x += (m.vx + Math.sin(m.t * 3 + i) * 2) * dt; m.y += m.vy * dt;
      const f = m.t / m.life; fx.globalAlpha = 1 - f; fx.fillStyle = FL[Math.min(4, (f * 5) | 0)]; fx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); }
    fx.globalAlpha = 1;
    // fumaça da chaminé da Escavadeira
    if (smoke.length < 18 && Math.random() < dt * 5) smoke.push({ x: STACK.x + (Math.random() - 0.5) * 6, y: STACK.y, vx: 3 + Math.random() * 4, vy: -(6 + Math.random() * 6), t: 0, life: 2.5 + Math.random() * 1.5, r: 1 });
    for (let i = smoke.length - 1; i >= 0; i--) { const s = smoke[i]; s.t += dt; if (s.t > s.life) { smoke.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; const f = s.t / s.life, r = 1 + f * 4;
      fx.globalAlpha = (1 - f) * 0.35; fx.fillStyle = f < 0.3 ? '#50505a' : '#3c3c44'; fx.fillRect(Math.round(s.x - r), Math.round(s.y - r * 0.7), Math.round(r * 2), Math.round(r * 1.4)); }
    fx.globalAlpha = 1;
    // o pavio da dinamite chiando
    fx.globalAlpha = 0.6 + Math.random() * 0.4; fx.drawImage(sglow, FUSE.x - 8, FUSE.y - 8); fx.globalAlpha = 1;
    fx.fillStyle = Math.random() < 0.5 ? '#fff4c8' : '#ffd070'; fx.fillRect(FUSE.x, FUSE.y, 1, 1);
    for (let k = 0; k < 2; k++) if (Math.random() < 0.6) { fx.fillStyle = Math.random() < 0.5 ? '#ffd070' : '#ff9a2a'; fx.fillRect(FUSE.x + Math.round((Math.random() - 0.5) * 5), FUSE.y - Math.round(Math.random() * 4), 1, 1); }
    // os óculos do rei pegam a luz de vez em quando
    const gl = Math.sin(t * 0.8); if (gl > 0.92) { fx.fillStyle = '#c8f4ff'; for (const e of EYEG) fx.fillRect(e.x, e.y - 1, 1, 1); }
    // o reflexo girando na broca
    const ph = (t * 1.6) % 1;
    fx.fillStyle = 'rgba(200,206,220,0.55)';
    for (let q = 0; q < 3; q++) { const i = 3 + ((ph + q / 3) % 1) * 20, hw = 7.4 * (1 - i / 24) * 0.7, j = -hw * 0.6; const X = Math.round(SX(56 + Math.cos(DA) * i - Math.sin(DA) * j)), Y = Math.round(SY(26 + Math.sin(DA) * i + Math.cos(DA) * j)); fx.fillRect(X, Y, 1, 2); }
    // pedrinhas caindo da ponta quebrada da ponte
    pebT -= dt; if (pebT <= 0) { pebbles.push({ x: DECK.a + 2 + Math.random() * 14, y: DECK.y1 + 1, vy: 0, vx: -2 - Math.random() * 3 }); pebT = 0.5 + Math.random() * 1.6; }
    for (let i = pebbles.length - 1; i >= 0; i--) { const p = pebbles[i]; p.vy += 240 * dt; p.y += p.vy * dt; p.x += p.vx * dt; if (p.y > yFloor(p.x) - 1) { pebbles.splice(i, 1); continue; } fx.fillStyle = '#593026'; fx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1); fx.fillStyle = '#764233'; fx.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 1); }
  }
  return { canvas: cv, frame };
}
var TITLE_ARTS = TITLE_ARTS || []; TITLE_ARTS.push(paintTitleArtMina);
