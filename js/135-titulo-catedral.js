'use strict';
/* arte da tela de título: A Catedral Abandonada. A nave enterrada por dentro: uma coluna canelada sobe do chão
   ao teto à esquerda, e dela nasce o grande arco ogival da abside; no fundo, a rosácea de vitrais quebrados brilha
   fraca atrás da cabeça do Rei Esqueleto, sentado enorme no seu trono negro, no alto do estrado, com a coroa de
   rubis e a maça de flanges na mão. Um tapete vermelho sobe os degraus; candelabros e velas acesos aos pés dele.
   Lá embaixo o herói, pequeno, ergue a tocha diante do estrado. Ao longe, entre os bancos, olhos de mortos-vivos.
   O lado esquerdo fica escuro para o nome e o menu.
   Pintada uma vez (480x270, 39-titulo sorteia entre as artes de TITLE_ARTS). Por quadro mexem só coisas pequenas:
   a chama da tocha, as velas, o brilho vermelho nos olhos do rei, um lampejo na coroa, a poeira na luz da rosácea
   e olhos que piscam no escuro da nave. */
function paintTitleArtCatedral() {
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
  const rq = (pal, t) => pal[Math.round(cl(t, 0, 1) * (pal.length - 1))];   // tom chapado, sem pontilhado (sprites)
  const qa = (a, x, y, n = 4) => Math.floor(cl(a, 0, 1) * n + bay(x, y)) / n;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const put = (x, y, c) => { x |= 0; y |= 0; if (!inb(x, y)) return; const i = (y * W + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255; };
  const get = (x, y) => { const i = (y * W + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const blend = (x, y, c, a) => { x |= 0; y |= 0; if (a <= 0 || !inb(x, y)) return; put(x, y, mix(get(x, y), c, cl(a, 0, 1))); };
  // as rampas do jogo (heroRamp): sombras puxam para ameixa, luzes para pergaminho; 6 tons, o base é o 4º
  const R6 = hex => [0.7, 0.46, 0.22, 0, 0.28, 0.52].map((t, i) => mix(C(hex), C(i < 3 ? '#2a1a30' : '#fff3d6'), t));
  const N = new Uint8Array(W * H);   // 0 parede da abside, 1 nave distante, 2 pedra da frente, 3 objetos, 5 rei/trono, 6 herói, 7 vitral
  const M = (x, y) => inb(x, y) ? N[y * W + x] : 2;

  /* ---------- palcos: chão, estrado com degraus, colunas, o arco da abside ---------- */
  const yFloor = 240, DAIS = 346, DAIS_Y = 204;
  const stepTop = x => x >= DAIS ? DAIS_Y : x >= DAIS - 48 ? DAIS_Y + 8 * Math.ceil((DAIS - x) / 12) : yFloor;
  const COLS = [{ x: 225, w: 11 }, { x: 474, w: 11 }];                       // colunas: do chão ao teto
  const CAP = 100;                                                           // altura do capitel
  const colAt = (x, y) => { for (const c of COLS) { let w = c.w; if (y > yFloor - 18) w += y > yFloor - 7 ? 4 : 2; else if (y > CAP - 8 && y < CAP + 6) w += y < CAP - 4 ? 5 : Math.max(0, 4 - (y - CAP + 4) * 0.5); if (Math.abs(x + 0.5 - c.x) < w) return c; } return null; };
  // o arco ogival entre as duas colunas: dois círculos de raio AR, cada um centrado do lado oposto
  const AR = 150, AL = COLS[0].x + COLS[0].w, ARt = COLS[1].x - COLS[1].w;
  const cL = [AL + AR, CAP], cR = [ARt - AR, CAP];
  const dL = (x, y) => Math.hypot(x - cR[0], y - cR[1]), dR = (x, y) => Math.hypot(x - cL[0], y - cL[1]);
  const opening = (x, y) => x >= AL && x < ARt && (y >= CAP || (dL(x, y) < AR && dR(x, y) < AR));
  const archBand = (x, y) => !opening(x, y) && x >= AL - 14 && x < ARt + 14 && y < CAP && dL(x, y) < AR + 12 && dR(x, y) < AR + 12;
  const rockAt = (x, y) => y >= stepTop(x) || !!colAt(x, y) || archBand(x, y);

  /* ---------- o rei e o trono: coordenadas do sprite do jogo (u, v), viradas para o herói ---------- */
  const S = 3.4, KU = 31.7, KX = 392, KV = 52;
  const sxU = u => KX - (u - KU) * S, syV = v => DAIS_Y - (KV - v) * S;
  const uOf = X => KU - (X - KX) / S, vOf = Y => KV - (DAIS_Y - Y) / S;

  /* ---------- luzes ---------- */
  const HERO = { x: 248, y: yFloor - 22 };
  const TORCH = { x: HERO.x + 13, y: HERO.y + 1 };
  const CANDL = [{ x: 296, s: 2, top: 0 }, { x: 462, s: 2, top: 0 }];     // candelabros de pé (o do jogo, em dobro)
  CANDL[0].base = yFloor; CANDL[1].base = DAIS_Y;
  for (const c of CANDL) c.top = c.base - 34 * c.s;
  const ROSE = { x: 392, y: 62, r: 48 };
  const VELAS = [[312, 228], [316, 228], [326, 220], [336, 212], [341, 212], [352, 204], [357, 204]];   // velas soltas nos degraus
  const lights = [
    { x: TORCH.x, y: TORCH.y, r: 120, c: C('#ffa850'), s: 1.3 },
    { x: CANDL[0].x, y: CANDL[0].top, r: 125, c: C('#ffb060'), s: 0.8 },
    { x: CANDL[1].x, y: CANDL[1].top, r: 80, c: C('#ffb060'), s: 0.6 },
    { x: 334, y: 210, r: 70, c: C('#ffb060'), s: 0.55 },                    // as velas dos degraus
    { x: ROSE.x, y: ROSE.y, r: 80, c: C('#8878c8'), s: 0.2 },                // a rosácea mal brilha
    { x: 151, y: 190, r: 60, c: C('#ffb060'), s: 0.4 },                      // velas num altar lá no fundo da nave
  ];
  const lightAt = (x, y) => { let a = 0, r = 0, g = 0, b = 0;
    for (const L of lights) { const d = Math.hypot(x - L.x, (y - L.y) * 1.1); if (d >= L.r) continue; const f = Math.pow(1 - d / L.r, 1.5) * L.s; a += f; r += L.c[0] * f; g += L.c[1] * f; b += L.c[2] * f; }
    return a > 0 ? { a, c: [r / a, g / a, b / a] } : null; };

  /* ---------- fundo: a parede da abside (cantaria escura) e, fora do arco, a nave que some ao longe ---------- */
  const BACK = P(['#0c0b0a', '#121110', '#181715', '#1f1d1a', '#262420', '#2e2b27', '#37332e', '#45403a']);
  const FAR = P(['#070709', '#0a0a0c', '#111114', '#18181c', '#201f25', '#28272e']);
  // a nave distante: arcadas que recuam no escuro, com janelas altas mortas
  const farCol = x => { for (const fx of [44, 118, 176]) if (Math.abs(x - fx) < (fx === 176 ? 6 : 4)) return true; return false; };
  const farAt = (x, y) => {
    if (opening(x, y) || x >= ARt) return false;
    if (farCol(x)) return true;
    if (y > 196 + (fbm(x / 18, 3, 7) - 0.5) * 4) return true;                          // o chão lá longe
    for (const [a, b] of [[44, 118], [118, 176]]) { const m = (a + b) / 2, R = (b - a) * 0.62, cy = 120; if (x > a && x < b && y < cy && Math.hypot(x - (b - R), y - cy) > R - 4 && Math.hypot(x - (a + R), y - cy) > R - 4 && y > 40) return true; }
    return y < 38 + (x > 190 ? 0 : 0);
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const L = lightAt(x, y);
    let c;
    if (opening(x, y) || x >= ARt) {   // parede da abside: fiadas de cantaria
      const r = Math.floor(y / 9), ly = y - r * 9, off = (h2(r, 0, 3) * 26) | 0, bx = Math.floor((x + off) / 26), lx = (x + off) - bx * 26, id = h2(bx, r, 5);
      let t = 0.24 + (id - 0.5) * 0.12 + (fbm(x / 9, y / 7, 9) - 0.5) * 0.2;
      if (ly === 8 || lx === 25) t = 0.12; else if (ly === 0) t += 0.08;
      t += Math.exp(-Math.hypot(x - ROSE.x, (y - ROSE.y) * 0.8) / 60) * 0.18;
      c = rp(BACK, t + (L ? L.a * 0.3 : 0), x, y);
    } else if (farAt(x, y)) { N[y * W + x] = 1; c = rp(FAR, 0.3 + (fbm(x / 5, y / 4, 23) - 0.5) * 0.4 + (L ? L.a * 0.2 : 0), x, y); }
    else { N[y * W + x] = 1; const haze = Math.exp(-Math.hypot((x - 150) / 1.4, y - 170) / 80); c = rp(FAR, 0.14 + haze * 0.5 + (fbm(x / 8, y / 6, 25) - 0.5) * 0.25 + (L ? L.a * 0.2 : 0), x, y); }
    // névoa baixa no chão da nave
    const fog = Math.exp(-Math.pow((y - 215) / 30, 2)) * (0.3 + fbm(x / 40, y / 10, 27) * 0.5);
    c = mix(c, C('#26222a'), qa(fog * 0.45, x, y, 5));
    put(x, y, c);
  }
  // janelas altas da nave distante, apagadas (vidro escuro, só um resto de cor)
  const FGL = P(['#0c0a12', '#14102a', '#1c1430', '#2a1418']);
  for (const [wx, wy] of [[81, 70], [147, 78]]) for (let y = wy - 22; y < wy + 40; y++) for (let x = wx - 7; x <= wx + 7; x++) {
    const inside = y >= wy ? Math.abs(x - wx) <= 6 : Math.hypot(x - (wx + 6), y - wy) < 12 && Math.hypot(x - (wx - 6), y - wy) < 12;
    if (!inside || N[y * W + x] !== 1) continue; const lead = (x + y) % 5 === 0 || (x - y + 100) % 5 === 0 || x === wx;
    put(x, y, lead ? C('#08070a') : rp(FGL, 0.2 + h2(x >> 1, y >> 1, 81) * 0.6, x, y));
  }

  /* ---------- a rosácea (vitral_rosacea do jogo, maior): pétalas de chumbo em volta do miolo ---------- */
  const RP7 = { pedra: P(['#24221f', '#3b3936', '#5a5751', '#7a766e', '#9a958b', '#b9b3a7', '#d6d0c3']) };
  const VIDR = { r: P(['#2a0a0c', '#3e1014', '#5a1418', '#8a2228', '#b8403a', '#d46a58', '#e8988a']), b: P(['#0a1228', '#101e40', '#162a5a', '#23428a', '#3e66b8', '#6488d0', '#94b0e4']), a: P(['#2e1c06', '#4a2e0a', '#6a4410', '#a06c1a', '#d8a03a', '#ecc068', '#f8dc9a']), g: P(['#0a1c10', '#102a18', '#163a22', '#23603a', '#3e8a56', '#68aa78', '#98c8a0']), v: P(['#140a22', '#1e1030', '#2a1840', '#46286a', '#6a46a0', '#8e6cc0', '#b49ade']) };
  const LEAD = C('#141214'), SOMBRA = C('#08070a');
  { const k = ROSE.r / 30;
    for (let y = ROSE.y - ROSE.r - 1; y <= ROSE.y + ROSE.r + 1; y++) for (let x = ROSE.x - ROSE.r - 1; x <= ROSE.x + ROSE.r + 1; x++) {
      if (!inb(x, y)) continue;
      const dx = (x + 0.5 - ROSE.x) / k, dy = (y + 0.5 - ROSE.y) / k, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), seg = ((a + Math.PI) / (Math.PI * 2) * 12 + 12) % 12, ls = seg % 1, sid = Math.floor(seg);
      if (r > 30) continue;
      let c, n = 7;
      if (r > 27) { c = rp(RP7.pedra, (dx + dy < 0 ? 0.6 : 0.3) + (h2(x, y, 91) - 0.5) * 0.1, x, y); n = 2; }
      else if (r < 5) { c = r < 2.4 ? rp(VIDR.a, 0.6, x, y) : rp(RP7.pedra, 0.5 - (dx + dy) * 0.02, x, y); n = r < 2.4 ? 7 : 2; }
      else {
        const petal = r > 9 && r < 25 && Math.abs(ls - 0.5) * 2 * r < (r < 17 ? r * 0.55 : (25 - r) * 1.2);
        if ((ls < 0.06 || ls > 0.94) || Math.abs(r - 9) < 0.7 || (r > 24.5 && r < 25.4)) { c = rp(RP7.pedra, 0.48 - dy * 0.006 + (h2(x, y, 93) - 0.5) * 0.1, x, y); n = 2; }
        else if (petal && Math.abs(Math.abs(ls - 0.5) * 2 * r - (r < 17 ? r * 0.55 : (25 - r) * 1.2)) < 0.7) c = LEAD;
        else {
          const G = VIDR[petal ? (sid & 1 ? 'r' : 'b') : r < 9 ? 'a' : (sid % 3 === 0 ? 'v' : 'g')], broken = h2(sid, Math.floor(r / 4), 2211) < 0.1;
          if (broken) c = SOMBRA;
          else if ((x + y) % 6 === 0 && !petal) c = LEAD;
          else c = rp(G, 0.16 + (1 - r / 27) * 0.2 + (fbm(x / 6, y / 6, 95) - 0.5) * 0.3 + (h2(x, y, 97) - 0.5) * 0.08, x, y);
        }
      }
      put(x, y, c); N[y * W + x] = n;
    }
  }
  // um vitral alto (lanceta) na abside, à esquerda da rosácea, quase apagado
  const LAN = { x: 278, y: 96, w: 11, b: 176 };
  for (let y = LAN.y - 20; y < LAN.b + 4; y++) for (let x = LAN.x - LAN.w - 3; x <= LAN.x + LAN.w + 3; x++) {
    const ins = m => y > LAN.b + m ? false : y >= LAN.y ? Math.abs(x + 0.5 - LAN.x) < LAN.w + m : Math.hypot(x + 0.5 - (LAN.x + LAN.w + m * 0.2 - 22), y - LAN.y) < 22 + m && Math.hypot(x + 0.5 - (LAN.x - LAN.w - m * 0.2 + 22), y - LAN.y) < 22 + m;
    if (!ins(3)) continue;
    if (!ins(0)) { put(x, y, rp(RP7.pedra, (x < LAN.x ? 0.42 : 0.24) + (y > LAN.b ? 0.15 : 0) + (h2(x, y, 101) - 0.5) * 0.1, x, y)); N[y * W + x] = 2; continue; }
    if (Math.abs(x + 0.5 - LAN.x) < 1 && y > LAN.y + 4) { put(x, y, rp(RP7.pedra, x < LAN.x ? 0.5 : 0.3, x, y)); N[y * W + x] = 2; continue; }
    const d1 = (x + y) % 6, d2 = (x - y + 600) % 6; if (d1 === 0 || d2 === 0) { put(x, y, LEAD); N[y * W + x] = 7; continue; }
    const q = Math.floor((x + y) / 6) * 31 + Math.floor((x - y + 600) / 6); if (h2(q, 0, 103) < 0.14) { put(x, y, SOMBRA); N[y * W + x] = 7; continue; }
    const G = VIDR[['r', 'a', 'b', 'r', 'g'][(q * 7) % 5]];
    put(x, y, rp(G, 0.22 + (1 - (y - LAN.y) / 100) * 0.15 + (fbm(x / 8, y / 8, 105) - 0.5) * 0.25, x, y)); N[y * W + x] = 7;
  }

  /* ---------- estandarte rasgado pendurado do arco ---------- */
  const TEC = P(['#1a060a', '#2a0a10', '#43121a', '#5e1a22', '#7a262c', '#94383a', '#b04e4a']);
  const OURO = P(['#3a2a10', '#5a4418', '#8a6a2a', '#a8843a', '#c49a42', '#dcb860', '#f0d890']);
  const FERRO = P(['#0c0c0f', '#141418', '#24252b', '#383a42', '#50535d', '#6e727e', '#9298a4']);
  { const bx = 300, bw = 18, by = 0;
    for (let x = bx - 2; x < bx + bw + 2; x++) put(x, by + 14, rp(FERRO, 0.5 - (x - bx) * 0.012, x, by + 14));
    for (let x = bx; x < bx + bw; x++) { const torn = 62 - Math.abs(x - bx - bw / 2) * 0.9 + (h2(x, 0, 111) - 0.5) * 9;
      for (let y = by + 15; y < torn; y++) { if (h2(x, y >> 1, 113) < 0.03 && y > 30) continue; const u = (x - bx) / bw;
        let c = rp(TEC, 0.5 + Math.sin(u * 9 + 0.6) * 0.14 - u * 0.12 - (y > torn - 4 ? 0.12 : 0) + (h2(x, y, 115) - 0.5) * 0.06, x, y);
        if (x === bx + 1 || x === bx + bw - 2) c = rp(OURO, 0.45, x, y);
        // a coroa bordada, desbotada
        const ex = x - (bx + bw / 2), ey = y - 34; if (Math.abs(ex) < 5 && ey > -1 && ey < 3) c = rp(OURO, 0.5 + (ey === -0 ? 0.1 : 0), x, y);
        if (ey >= -4 && ey < -1 && (Math.abs(ex) === 4 || ex === 0 || Math.abs(ex) === 2 && ey === -2)) c = rp(OURO, 0.55, x, y);
        put(x, y, c); N[y * W + x] = 3; } }
  }

  /* ---------- pedra da frente: chão de lajes, estrado de mármore, colunas caneladas, o arco ---------- */
  const LAJE = P(['#1c1a17', '#36332e', '#524d45', '#6f695e', '#8d8677', '#aba291', '#c6bdaa']);
  const MARM = P(['#2e2c2a', '#45423f', '#66625d', '#8a857e', '#aca69c', '#cac4b8', '#e3ddd1']);
  const CANT = P(['#1e1d1b', '#3b3936', '#5a5751', '#7a766e', '#9a958b', '#b9b3a7', '#d6d0c3']);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rockAt(x, y) && N[y * W + x] !== 7) N[y * W + x] = 2;
  const open = (x, y) => inb(x, y) && N[y * W + x] !== 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!rockAt(x, y)) continue;
    const L = lightAt(x, y), lit = L ? L.a : 0;
    const col = colAt(x, y), dais = !col && x >= DAIS - 48 && y < yFloor + 4, band = !col && archBand(x, y);
    let pal = col || band ? CANT : dais ? MARM : LAJE, t;
    if (col) {   // fuste canelado: sombra redonda, caneluras de 3 px; base e capitel
      const u = (x + 0.5 - (col.x - col.w)) / (col.w * 2);
      t = 0.62 - u * 0.4 + (h2(x, y, 121) - 0.5) * 0.08;
      if (y < CAP + 6 && y > CAP - 8 || y > yFloor - 18) { t = 0.5 - u * 0.25 + (y === CAP - 8 || y === yFloor - 18 || y === yFloor - 7 ? 0.25 : 0) + ((y - CAP) % 3 === 0 && y > CAP - 4 && y < CAP + 6 ? -0.12 : 0); }
      else { const fl = Math.floor(x - (col.x - col.w)) % 3; if (fl === 2) t -= 0.13; else if (fl === 0) t += 0.04; if (y % 34 === 0) t -= 0.15; }
    } else if (band) {   // as molduras do arco: três frisos
      const d = Math.min(Math.abs(dL(x, y) - AR), Math.abs(dR(x, y) - AR)); t = 0.42 + (d < 2 ? 0.12 : d < 4 ? -0.1 : d < 7 ? 0.05 : d < 9 ? -0.12 : 0.02) + (h2(x, y, 123) - 0.5) * 0.08;
    } else if (dais) {   // degraus e estrado de mármore claro, veios
      const top = stepTop(x), ly = y - top; t = 0.42 + (fbm(x / 10, y / 10, 125) - 0.5) * 0.25 + (Math.abs(fbm(x / 14 + y / 30, y / 8, 127) - 0.5) < 0.015 ? -0.2 : 0);
      if (ly === 0) t += 0.3; else if (ly === 1) t += 0.12; else if (ly === 7 && x < DAIS) t -= 0.18;
      if (x >= DAIS && (y - DAIS_Y) % 12 === 11) t -= 0.18;
      if (x >= DAIS && ((x - DAIS + Math.floor((y - DAIS_Y) / 12) * 13) % 26) === 25) t -= 0.18;
    } else {   // lajes gastas
      const r = Math.floor((y - yFloor) / 10), ly = y - yFloor - r * 10, off = (h2(r, 0, 131) * 30) | 0, bx = Math.floor((x + off) / 30), lx = (x + off) - bx * 30, id = h2(bx, r, 133);
      t = 0.36 + (id - 0.5) * 0.14 + (fbm(x / 6, y / 4, 135) - 0.5) * 0.25; if (ly === 9 || lx === 29) t = 0.12; else if (ly === 0) t += 0.06;
      if (h2(x, y, 137) < 0.03) t -= 0.15;
    }
    let e = 0;
    if (open(x, y - 1)) e = 0.35; else if (open(x, y - 2)) e = 0.15;
    if (L) { const dx = Math.sign(TORCH.x - x); if (open(x + dx, y)) e += 0.2; }
    t = t * (0.3 + lit * 1.0) + e * (0.2 + lit * 0.9);
    let c = rp(pal, t, x, y);
    if (L) c = mix(c, L.c, qa(Math.min(0.45, L.a * 0.4), x, y, 8));
    put(x, y, c);
  }

  /* ---------- o trono negro (paintThrone do jogo, redesenhado grande) ---------- */
  const KB = new Uint8Array(W * H);                                         // máscara do grupo rei+trono, para o contorno
  const kput = (X, Y, c) => { if (!inb(X, Y)) return; const L = lightAt(X, Y); if (L) c = mix(c, L.c, Math.min(0.3, L.a * 0.35)); put(X, Y, c); N[Y * W + X] = 5; KB[Y * W + X] = 1; };
  // pinta tudo que cai no retângulo (u0..u1, v0..v1); fn devolve [rampa, t] ou uma cor pronta
  const kp = (u0, v0, u1, v1, fn) => {
    const X0 = Math.floor(sxU(u1)), X1 = Math.ceil(sxU(u0)), Y0 = Math.floor(syV(v0)), Y1 = Math.ceil(syV(v1));
    for (let Y = Y0; Y <= Y1; Y++) for (let X = X0; X <= X1; X++) { const u = uOf(X + 0.5), v = vOf(Y + 0.5); if (u < u0 || u > u1 || v < v0 || v > v1) continue;
      const r = fn(u, v, X, Y); if (!r) continue;
      if (typeof r[0] === 'number') { kput(X, Y, r); continue; }
      const L = lightAt(X, Y), back = cl((X - 368) / 80, 0, 1) * 0.26 + cl((150 - Y) / 120, 0, 1) * 0.08; kput(X, Y, rq(r[0], r[1] * (0.76 + Math.min(0.45, (L ? L.a : 0) * 0.5) - back))); } };
  const REI = { bone: R6('#d4c8a8'), fur: R6('#d8d0c0'), iron: R6('#4e505c'), gold: R6('#c99a34'), goldD: R6('#8e6420'), crown: R6('#e0b040'), tab: R6('#45285e'), cape: R6('#7a1c28'), ruby: R6('#d0283c'), mace: R6('#62666f'), haft: R6('#4a3020'), k: R6('#2f2b34'), K: R6('#18161b') };
  const SOCK = C('#140c10'), GAP = C('#2a1c1c'), SPOT = C('#1a1418');
  const gn = (u, v, s) => (h2(Math.floor(u * S), Math.floor(v * S), s) - 0.5);    // grão por pixel
  // trono: coluna c / linha r do desenho do jogo -> u = 15 + c, v = 4 + r
  const TU = c => 15 + c, TV = r => 4 + r;
  kp(TU(0), TV(0), TU(26), TV(48), (u, v) => {
    const c = u - 15, r = v - 4;
    const fac = (c - 1) / 12;                                                 // luz da frente (c alto = frente)
    // caveira no topo do espaldar
    if (c > 4.6 && c < 9.4 && r > 0.6 && r < 5) { const dx = (c - 7) / 2.4, dy = (r - 2.8) / 2.2; if (dx * dx + dy * dy < 1) { if (Math.abs(r - 2.6) < 0.6 && (Math.abs(c - 6.1) < 0.55 || Math.abs(c - 7.9) < 0.55)) return SOCK; if (r > 4.1 && (Math.floor(c * 3) & 1)) return GAP; return [REI.bone, 0.62 + dx * 0.15 - dy * 0.15 + gn(u, v, 141) * 0.1]; } }
    if (r >= 4.8 && r < 5.6 && c > 4 && c < 10) return [REI.gold, 0.7 - (r - 4.8) * 0.4 + (c - 4) * 0.02];
    // caveiras dos cantos do espaldar
    for (const sx of [1.5, 11.5]) { const dx = (c - sx) / 1.3, dy = (r - 11.5) / 1.6; if (dx * dx + dy * dy < 1) { if (Math.abs(r - 11.3) < 0.45 && Math.abs(c - sx + 0.2) < 0.55) return SOCK; return [REI.bone, 0.55 + dx * 0.15 - dy * 0.1 + gn(u, v, 143) * 0.1]; } }
    // espaldar com empena gótica e croquetes
    const hw = r < 13 ? 0.6 + (r - 5.4) * 0.72 : 5.6;
    const croq = r < 13 && r > 6 && Math.abs(Math.abs(c - 7) - hw) < 0.8 && (Math.floor(r * 1.4) % 2 === 0);
    if (r >= 5.4 && r < 37 && (Math.abs(c - 7) < hw || croq)) {
      const edge = Math.abs(c - 7) > hw - 0.7;
      // moldura de ouro e veludo vermelho acolchoado, com arco ogival no alto
      const inF = (m) => c > 3 - m && c < 11 + m && r < 35.8 + m && (r > 18 - m || Math.hypot(c - 3 + m - 0.5 - 7.5, r - 18) < 8.4 + m && Math.hypot(c - 11 - m + 0.5 + 7.5, r - 18) < 8.4 + m) && r > 10 - m;
      if (inF(0)) { const qx = (c - 7 + r * 0.5) % 2.4, qy = (c - 7 - r * 0.5 + 100) % 2.4; let t = 0.55 + fac * 0.15 + gn(u, v, 145) * 0.08 - (Math.min(qx, qy) < 0.25 ? 0.18 : 0); if (Math.abs(qx - 1.2) < 0.3 && Math.abs(qy - 1.2) < 0.3) t = 0.85; return [REI.cape, t - (r > 33 ? 0.12 : 0)]; }
      if (inF(0.8)) return [REI.gold, 0.6 + fac * 0.2 + (c < 7 ? -0.1 : 0.1) + gn(u, v, 147) * 0.08];
      // nichos cegos góticos entalhados na pedra negra
      let t = 0.55 + fac * 0.12 + gn(u, v, 149) * 0.08 - (edge ? 0.3 : 0) + (Math.abs(c - 7) < hw - 0.7 && Math.abs(c - 7) > hw - 1.4 ? 0.15 : 0);
      if (croq) t = 0.8;
      if (r < 13.4 && edge) return [REI.gold, 0.62 + fac * 0.15];
      return [edge ? REI.K : REI.k, t];
    }
    // braço do trono (barra) e pilar da frente com caveira
    if (c > 20 && c < 25 && r > 20.6 && r < 25.2) { const dx = (c - 22.5) / 2.4, dy = (r - 22.9) / 2.2; if (dx * dx + dy * dy < 1) { if (Math.abs(r - 22.6) < 0.55 && (Math.abs(c - 21.7) < 0.5 || Math.abs(c - 23.4) < 0.5)) return SOCK; if (r > 24.2 && (Math.floor(c * 3) & 1)) return GAP; return [REI.bone, 0.6 + dx * 0.18 - dy * 0.15 + gn(u, v, 151) * 0.1]; } }
    if (c >= 10 && c < 22.8 && r >= 25 && r < 28) return r < 25.8 ? [REI.gold, 0.75 + gn(u, v, 153) * 0.1] : [REI.k, 0.5 - (r - 25.8) * 0.12 + fac * 0.1];
    if (c >= 21 && c < 24 && r >= 25 && r < 47.5) { if (r > 39 && r < 39.8) return [REI.gold, 0.7]; const uu = (c - 21) / 3; return [REI.k, 0.75 - uu * 0.0 + (uu > 0.66 ? 0.12 : uu < 0.2 ? -0.2 : 0) + gn(u, v, 155) * 0.08]; }
    // assento: almofada vermelha e bloco
    if (c >= 8 && c < 24 && r >= 33 && r < 35) return [REI.cape, 0.6 + (r < 33.8 ? 0.15 : -0.05) + gn(u, v, 157) * 0.08];
    if (c >= 7 && c < 25 && r >= 35 && r < 39) return r < 35.7 ? [REI.gold, 0.72] : [REI.k, 0.5 + fac * 0.12 - (r > 38.3 ? 0.2 : 0) + gn(u, v, 159) * 0.08];
    // base com painel afundado e o rubi
    if (c >= 6 && c < 25 && r >= 39 && r < 47.6) {
      if (r < 39.7) return [REI.gold, 0.72 + gn(u, v, 161) * 0.1];
      if (c >= 12 && c < 16 && r >= 42 && r < 44.8) { const dx = (c - 14) / 2, dy = (r - 43.4) / 1.4; return [REI.ruby, 0.62 - dx * 0.2 - dy * 0.25 + (dx < -0.3 && dy < -0.2 ? 0.25 : 0)]; }
      if (c >= 11.4 && c < 16.6 && r >= 41.5 && r < 45.3) return [REI.gold, 0.55];
      if (c >= 9 && c < 19 && r >= 41 && r < 46.4) return [REI.K, 0.45 + (r < 41.6 || c < 9.6 ? -0.2 : 0)];
      return [REI.k, 0.52 + fac * 0.12 + (r < 40.4 ? 0.12 : 0) + gn(u, v, 163) * 0.08];
    }
    if (c >= 5 && c < 26 && r >= 47.6 && r < 48) return [REI.K, 0.5];
    return null;
  });

  /* ---------- o Rei Esqueleto sentado (pose 'sit' do jogo), em detalhe ---------- */
  const seg = (u, v, a, b, rr) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = cl(((u - a[0]) * dx + (v - a[1]) * dy) / L2, 0, 1), ex = u - a[0] - dx * t, ey = v - a[1] - dy * t; return { d: Math.hypot(ex, ey) / rr, t, ex, ey }; };
  // pernas: fêmures para a frente, canelas para baixo, sapatos de ferro
  kp(29, 37, 42, 52.2, (u, v) => {
    // sapatos (o de trás mais escuro)
    for (const [o, dk] of [[0, 0], [-2.3, 0.16]]) {
      const uu = u - o; if (v < 47.3 || v > 52 || uu < 36.6 || uu > 41.6) continue;
      const cuff = v < 48.7, top = uu > 39.4 ? 48.7 + (uu - 39.4) * 1.1 : 48.7;
      if (cuff && (uu < 37.0 || uu > 39.2)) continue;
      if (!cuff && v < top) continue;
      const lame = Math.abs(v - 48.8) < 0.2 || Math.abs(v - 50.3) < 0.2, sole = v > 51.4;
      return [REI.iron, 0.6 - dk + (uu - 38) * 0.04 - (sole ? 0.3 : 0) - (lame ? 0.22 : 0) + (cuff ? 0.12 : 0) + (Math.abs(v - top) < 0.35 ? 0.15 : 0) + gn(u, v, 171) * 0.05];
    }
    // canelas: tíbia e fíbula
    for (const [k0, a0, dk] of [[[37.3, 40.2], [36.0, 47.8], 0.16], [[38.7, 40.2], [37.6, 47.8], 0]]) {
      const s1 = seg(u, v, k0, a0, 0.48), s2 = seg(u, v, [k0[0] - 0.65, k0[1] + 0.6], [a0[0] - 0.55, a0[1] - 0.2], 0.22);
      if (s1.d < 1) return [REI.bone, 0.62 - dk - s1.ex * 0.25 + (s1.t < 0.1 || s1.t > 0.92 ? 0.12 : 0) + gn(u, v, 173) * 0.08];
      if (s2.d < 1) return [REI.bone, 0.42 - dk];
    }
    // fêmures e joelhos
    for (const [h, k, dk] of [[[31.4, 38.0], [37.4, 39.4], 0.16], [[32.4, 38.6], [38.8, 39.6], 0]]) {
      const s = seg(u, v, h, k, 0.55); if (s.d < 1) return [REI.bone, 0.66 - dk - s.ey * 0.3 + gn(u, v, 175) * 0.08];
      if (Math.hypot(u - k[0], v - k[1] - 0.2) < 0.85) return [REI.bone, 0.72 - dk - (v - k[1]) * 0.2];
    }
    return null;
  });
  // costelas, esterno e espinha (sprite: linhas 12-19)
  const BCX = 32.8;
  kp(27, 25, 38.5, 33.2, (u, v) => {
    const hw = 4.4 - Math.pow((v - 28) / 5.2, 2) * 1.6; if (Math.abs(u - BCX) > hw || v < 25.2) return null;
    if (Math.abs(u - BCX) < 0.55 && v < 30.4) return [REI.bone, 0.66 + (u > BCX ? 0.08 : -0.06) + gn(u, v, 181) * 0.06];        // esterno
    for (let k = 0; k < 6; k++) { const yk = 25.9 + k * 1.22 + Math.pow((u - BCX) / 4, 2) * 0.7 - (k > 3 && Math.abs(u - BCX) < 1.2 ? 9 : 0); if (Math.abs(v - yk) < 0.36) return [REI.bone, 0.6 + (u - BCX) / hw * 0.16 - (v - yk) * 0.25 + gn(u, v, 183) * 0.06]; }
    if (Math.abs(u - BCX) < 0.5 && v > 30.4) { const vv = (v * 1.6) % 1; return [REI.bone, vv < 0.2 ? 0.3 : 0.55]; }                       // vértebras
    return GAP;
  });
  // cinto de ouro, tabardo roxo com faixa de ouro, barra e franja (linhas 20-27)
  kp(26, 33, 42, 41.6, (u, v) => {
    const l = 27.6 - (v - 34) * 0.18, r = 38.4 + (v - 34) * 0.32;
    if (v < 34.2) { if (u < 28.4 || u > 38.2) return null; if (Math.abs(u - 33.2) < 0.7) return [REI.ruby, 0.6 - (v - 33.6) * 0.5]; if (Math.abs(u - 33.2) < 1.1) return [REI.goldD, 0.7]; return [REI.gold, 0.7 - (v - 33) * 0.3 + (u - 28) * 0.012 + gn(u, v, 191) * 0.06]; }
    if (u < l || u > r) return null;
    if (v > 40.5) { const st = Math.floor((u - l) / 0.62); if ((u - l) % 0.62 < 0.18) return null; if (v > 40.9 + (st & 1) * 0.35) return null; return st % 3 === 0 ? [REI.gold, 0.55] : [REI.tab, 0.4]; }
    if (v > 39.6) return [REI.gold, 0.66 + (v < 39.9 ? 0.12 : -0.08) + gn(u, v, 193) * 0.06];
    if (Math.abs(u - 33.6) < 0.48) return [REI.gold, 0.6 + (u > 33.6 ? 0.1 : 0)];
    const fold = Math.sin((u - l) * 2.1 + (v - 34) * 0.15);
    return [REI.tab, 0.56 + fold * 0.14 + (u - l) / (r - l) * 0.14 - (v - 34) * 0.012 + gn(u, v, 195) * 0.06];
  });
  // ombreiras de ferro com lâminas e friso de ouro (linhas 12-15)
  for (const [a, b, dk] of [[23.6, 28.4, 0.16], [36.6, 41.6, 0]]) kp(a, 24.2, b, 29.6, (u, v) => {
    const cu = (a + b) / 2, hw = (b - a) / 2, top = 24.6 + Math.pow((u - cu) / hw, 2) * 1.2; if (v < top) return null;
    const bot = 29.2 - Math.abs(u - cu) * 0.15; if (v > bot) return null;
    const out = a < 30 ? u < a + 0.55 : u > b - 0.55;
    if (out || v > bot - 0.5) return [REI.gold, 0.66 + (v > bot - 0.5 ? -0.05 : 0.1) + gn(u, v, 201) * 0.06];
    const lam = [26.5, 27.9].some(y => Math.abs(v - y) < 0.2) ? -0.25 : [26.75, 28.15].some(y => Math.abs(v - y) < 0.2) ? 0.15 : 0;
    if (Math.abs(v - 25.6) < 0.3 && Math.abs(u - cu - hw * 0.4) < 0.3) return [REI.iron, 0.95 - dk];            // rebite
    return [REI.iron, 0.55 - dk + (u - cu) / hw * 0.16 - (v - top) * 0.04 + lam + gn(u, v, 203) * 0.06];
  });
  // gola de arminho com as pintas pretas e fechos de ouro (linhas 10-11)
  kp(24, 22.4, 41.2, 26, (u, v) => {
    const top = 23.1 - (u > 26 && u < 40 ? 0.2 : -0.3) + (h2(Math.floor(u * 3.4), 0, 211) - 0.5) * 0.5, bot = 25.3 + (h2(Math.floor(u * 3.4), 1, 211) - 0.5) * 0.5 - Math.pow((u - 32.6) / 9, 2);
    if (u < 24.6 || u > 40.8 || v < top || v > bot) return null;
    if ((u < 25.6 || u > 39.8) && v > 24) return [REI.gold, 0.7];
    for (const sx of [26.4, 28.9, 36.2, 38.6]) if (Math.abs(u - sx) < 0.42 - (v - 23.9) * 0.18 && v > 23.6 && v < 25.3) return SPOT;
    return [REI.fur, 0.6 + (u - 32.6) / 8 * 0.12 - (v - top) * 0.06 + gn(u, v, 213) * 0.22];
  });
  // a caveira: crânio, órbitas fundas, nariz, a fileira de dentes, a mandíbula (linhas 0-9)
  const SK = { u: 31.6, v: 17.4 }, EYES_U = [[30.0, 18.5], [33.4, 18.5]];
  kp(26, 12, 37.4, 24.2, (u, v) => {
    const dx = (u - SK.u) / 4.8, dy = (v - SK.v) / 4.9, cran = dx * dx + dy * dy < 1 && v < 20.6;
    const cheek = v >= 19.2 && v < 21.3 && Math.abs(u - 31.8) < 4.4 - (v - 19.2) * 0.6;
    const jaw = v >= 21.2 && v < 24 && Math.abs(u - 31.9) < 3.3 - Math.max(0, v - 23.2) * 1.2;
    if (!cran && !cheek && !jaw) return null;
    for (const [ex, ey] of EYES_U) { const ax = Math.abs(u - ex) / 1.2, ay = Math.abs(v - ey) / 1.15; const q = ax * ax * ax + ay * ay * ay; if (q < 1) return SOCK; if (q < 1.45 && v < ey) return [REI.bone, 0.35]; }
    if (v > 19.6 && v < 20.8 && Math.abs(u - 31.8) < (20.8 - v) * 0.55) return SOCK;                                    // nariz
    if (v >= 21.0 && v < 22.9) {   // dentes de cima e de baixo
      if (Math.abs(u - 31.9) > 2.9) return [REI.bone, 0.4];
      if (Math.abs(v - 21.95) < 0.22) return GAP;
      const tw = 0.8, k = (u - 29.0 + (v > 21.95 ? 0.4 : 0)) / tw; if (k % 1 < 0.3) return GAP;
      return [REI.bone, (v > 21.95 ? 0.56 : 0.7) + (k % 1 > 0.8 ? -0.1 : 0) + (u - 31.9) * 0.02];
    }
    let t = 0.62 + dx * 0.16 - dy * 0.14 + gn(u, v, 221) * 0.06;
    if (dx * dx + dy * dy > 0.82 && cran) t -= 0.14;
    if (cran && dx < -0.2 && dy < -0.3 && dx * dx + dy * dy < 0.6) t += 0.1;                                           // brilho na testa
    if (v > 19.1 && v < 19.6 && Math.abs(u - 31.7) < 3.7) t += 0.08;                                                   // maçãs
    if (Math.abs(u - (33.6 + (v - 13.5) * 0.25 + Math.sin(v * 3) * 0.2)) < 0.14 && v > 13 && v < 17) return GAP;     // uma rachadura
    if (u < 28 && v > 18.2 && v < 21) t -= 0.12;
    return [REI.bone, t];
  });
  // a coroa: aro com rubis, três pontas com rubis nas pontas (REI_CROWN)
  kp(26.6, 8.2, 37.6, 14.6, (u, v) => {
    const band = v >= 12.2 && v < 14.4 && u > 27.0 && u < 36.9;
    if (band) {
      for (const gx of [28.6, 32.0, 35.4]) { const d = Math.hypot((u - gx) / 0.62, (v - 13.35) / 0.62); if (d < 1) return [REI.ruby, 0.62 - (u - gx) * 0.3 - (v - 13.35) * 0.4 + (d < 0.4 && u > gx ? 0.3 : 0)]; }
      for (const gx of [30.3, 33.7]) if (Math.abs(u - gx) < 0.3 && Math.abs(v - 13.35) < 0.3) return [REI.goldD, 0.4];
      return [REI.crown, (v < 12.6 ? 0.85 : v > 14.0 ? 0.32 : 0.58) + (u - 32) * 0.025 + gn(u, v, 231) * 0.06];
    }
    for (const [px, tip, hw] of [[27.7, 9.8, 1.1], [32.0, 9.2, 1.55], [36.3, 9.8, 1.1]]) {
      if (Math.hypot(u - px, v - tip + 0.1) < 0.62) return [REI.ruby, 0.68 + (u > px ? 0.18 : -0.1) - (v - tip) * 0.3];
      const k = (v - tip) / (12.3 - tip); if (k > 0 && k <= 1.05 && Math.abs(u - px) < hw * k + 0.15) {
        if (px === 32.0 && Math.hypot(u - px, v - 11.3) < 0.48) return [REI.ruby, 0.6 + (u > px ? 0.15 : 0)];
        return [REI.crown, 0.55 + (u - px) / hw * 0.22 + (Math.abs(u - px) < 0.25 ? 0.12 : 0) + gn(u, v, 233) * 0.06];
      }
    }
    return null;
  });
  // o braço da frente: úmero, cotovelo, rádio e ulna, bracelete de ouro, a mão fechada na maça
  const SH = [38.8, 26.6], EL = [43.2, 28.9], HAND = [47.6, 29.7];
  const MD = [Math.sin(0.15), -Math.cos(0.15)], MP = k => [HAND[0] + MD[0] * k, HAND[1] + MD[1] * k], MHEAD = MP(14.4);
  // a maça: cabo de madeira, anéis de ouro e a cabeça de flanges (REI_MACE), atrás da mão
  kp(43, 9, 56, 33, (u, v) => {
    const hx = u - MHEAD[0], hy = v - MHEAD[1], r = Math.hypot(hx, hy), a = Math.atan2(hy, hx) + 0.15, c4 = Math.cos(a * 4);
    const edge = 3.0 + 1.55 * Math.pow(Math.max(0, -c4), 5) + 0.9 * Math.pow(Math.max(0, c4), 6);
    if (r < edge) {
      const fl = r > 2.6, ridge = Math.abs(Math.sin(a * 4)) < 0.12 && r > 1.2;
      let t = 0.55 + (hx / 4.5) * 0.25 - (hy / 4.5) * 0.2 + gn(u, v, 241) * 0.08;
      if (fl) t += -c4 > 0 ? 0.08 : -0.1; if (ridge) t -= 0.2; if (r < 1.2 && hx > 0 && hy < 0) t += 0.15;
      return [REI.mace, t];
    }
    const s = seg(u, v, MP(-2.6), MP(10.4), 0.42);
    if (s.d < 1) { const k = s.t * 13 - 2.6; if (k > 9.4 || k < -1.8 || Math.abs(k - 0.9) < 0.35) { const s2 = seg(u, v, MP(-2.6), MP(10.4), 0.75); return [REI.gold, 0.62 - s.ex * 0.4 * Math.sign(MD[1])]; } return [REI.haft, 0.55 + (s.ex * MD[1] < 0 ? 0.15 : -0.1) + (h2(Math.floor(s.t * 40), 0, 243) - 0.5) * 0.15]; }
    const s2 = seg(u, v, MP(9.5), MP(10.4), 0.75); if (s2.d < 1) return [REI.gold, 0.65 - (v - MP(10)[1]) * 0.2];
    const s3 = seg(u, v, MP(-2.8), MP(-1.8), 0.75); if (s3.d < 1) return [REI.gold, 0.6];
    return null;
  });
  kp(37, 25, 50, 32, (u, v) => {
    // mão: nós dos dedos em volta do cabo
    if (Math.hypot((u - HAND[0]) / 1.05, (v - HAND[1] - 0.2) / 0.95) < 1) { const fk = (v - HAND[1] + 1) % 0.62; return [REI.bone, (fk < 0.16 ? 0.35 : 0.68) + (u - HAND[0]) * 0.15]; }
    const fa = seg(u, v, EL, [HAND[0] - 0.8, HAND[1]], 0.5);
    if (fa.d < 1) { if (fa.t > 0.62 && fa.t < 0.86) return [REI.gold, 0.7 - fa.ey * 0.5]; if (Math.abs(fa.ey) < 0.12 && fa.t > 0.1 && fa.t < 0.6) return GAP; return [REI.bone, 0.62 - fa.ey * 0.3]; }
    const fb = seg(u, v, EL, [HAND[0] - 0.8, HAND[1]], 0.72); if (fb.d < 1 && fb.t > 0.62 && fb.t < 0.86) return [REI.gold, 0.6 - fb.ey * 0.4];
    const hu = seg(u, v, SH, EL, 0.5); if (hu.d < 1) return [REI.bone, 0.64 - hu.ey * 0.3 + (hu.t > 0.4 && hu.t < 0.6 ? -0.06 : 0)];
    if (Math.hypot(u - EL[0], v - EL[1]) < 0.75) return [REI.bone, 0.72 - (v - EL[1]) * 0.25];
    return null;
  });
  // contorno escuro do grupo, como os sprites do jogo
  const OUT = C('#120c10');
  { const ed = []; for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { if (KB[y * W + x]) continue; if (KB[y * W + x - 1] || KB[y * W + x + 1] || KB[(y - 1) * W + x] || KB[(y + 1) * W + x]) ed.push(x, y); }
    for (let i = 0; i < ed.length; i += 2) { put(ed[i], ed[i + 1], OUT); N[ed[i + 1] * W + ed[i]] = 5; } }
  const KEYES = EYES_U.map(([u, v]) => [Math.round(sxU(u)), Math.round(syV(v + 0.1))]);
  const KCROWN = [[27.7, 9.2], [32.0, 8.6], [36.3, 9.2]].map(([u, v]) => [Math.round(sxU(u)), Math.round(syV(v))]);

  /* ---------- candelabros de pé (candelabro_pe do jogo, em dobro), velas e tapete ---------- */
  const BRZ = P(['#1e150a', '#2e200e', '#4e3818', '#745626', '#9c7a38', '#c4a252', '#e6ca7a']);
  const CERA = P(['#2a241a', '#3a3226', '#6a5e48', '#a09276', '#cfc2a2', '#ece2c8', '#fff6e2']);
  const VERD = P(['#0e1a16', '#16281f', '#20392c', '#2c4c3a', '#3c6450', '#568068', '#78a088']);
  const propPut = (x, y, pal, t, n = 3) => { x = Math.round(x); y = Math.round(y); if (!inb(x, y)) return; const L = lightAt(x, y); let c = rp(pal, t * (0.45 + Math.min(0.9, (L ? L.a : 0) * 0.9)), x, y); if (L) c = mix(c, L.c, qa(Math.min(0.3, L.a * 0.3), x, y, 4)); put(x, y, c); N[y * W + x] = n; };
  const FLAMES = [];
  for (const cd of CANDL) { const s = cd.s, x0 = cd.x - 6 * s, y0 = cd.top;
    const px = (gx, gy, pal, t) => { for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) propPut(x0 + gx * s + i, y0 + gy * s + j, pal, t); };
    for (let gx = 1; gx < 11; gx++) { const h = 3 - Math.abs(gx - 5.5) * 0.45; for (let gy = 33 - Math.round(h); gy < 34; gy++) px(gx, gy, BRZ, (4.2 - gx * 0.25 + (gy === 33 - Math.round(h) ? 1.2 : 0)) / 6); }
    for (let gy = 9; gy < 31; gy++) for (let gx = 5; gx < 7; gx++) px(gx, gy, h2(gx, gy, 251) < 0.15 && gy > 21 ? VERD : BRZ, gx === 5 ? 0.72 : 0.42);
    for (const ky of [14, 21, 27]) for (let gx = 4; gx < 8; gx++) px(gx, ky, BRZ, gx < 6 ? 0.8 : 0.5);
    for (let gx = 1; gx < 11; gx++) { px(gx, 8, BRZ, 0.8 - gx * 0.02); px(gx, 9, BRZ, 0.4); }
    for (const [wx, top] of [[1, 3], [6, 1], [10, 4]]) { for (let gy = top; gy < 8; gy++) for (let gx = wx - 1; gx <= wx + 1; gx++) px(gx, gy, CERA, gx < wx ? 0.82 : gx === wx ? 0.66 : 0.45); FLAMES.push([x0 + wx * s + (s >> 1), y0 + (top - 1) * s + s - 1, 2]); }
  }
  for (const [vx, vy] of VELAS) { const hgt = 4 + ((h2(vx, vy, 255) * 5) | 0); for (let j = 0; j < hgt; j++) { propPut(vx, vy - 1 - j, CERA, 0.8); propPut(vx + 1, vy - 1 - j, CERA, 0.5); } if (h2(vx, 0, 257) < 0.5) propPut(vx - 1, vy - 1, CERA, 0.6); FLAMES.push([vx, vy - hgt - 1, 1]); }
  // tapete vermelho: no chão a partir do herói, depois sobe os degraus caindo pelos espelhos
  const TAPR = R6('#7a1c28'), TAPG = R6('#c99a34');
  for (let x = HERO.x + 16; x < DAIS + 16; x++) { const y = stepTop(x);
    propPut(x, y - 3, TAPG, 0.55 + (h2(x, 3, 777) < 0.08 ? -0.2 : 0)); propPut(x, y - 2, TAPR, h2(x, 3, 777) > 0.85 ? 0.75 : 0.6); propPut(x, y - 1, TAPR, 0.4);
    if (x < DAIS && stepTop(x + 1) < y) for (let yy = stepTop(x + 1) - 3; yy < y - 3; yy++) { propPut(x, yy, TAPR, 0.55); propPut(x - 1, yy, TAPR, 0.4); } }
  // ossos e caveiras espalhados nos degraus e no chão (ossos_monte)
  const OSSO = P(['#241e16', '#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6']);
  const skull = (x, y) => { for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) { if (i * i / 9 + j * j / 5 > 1) continue; propPut(x + i, y + j, OSSO, 0.75 - (i + j) * 0.06); } propPut(x - 1, y, P(['#08070a']), 0); propPut(x + 1, y, P(['#08070a']), 0); };
  const bone = (x, y, len, a) => { for (let k = 0; k <= len; k++) propPut(x + Math.cos(a) * k, y + Math.sin(a) * k, OSSO, k < 1 || k > len - 1 ? 0.9 : 0.7); };
  for (const [x, y, l, a] of [[222, 238, 7, -0.1], [236, 238, 6, 0.25], [356, 202, 6, 0.0], [440, 203, 7, 0.1], [305, 234, 5, -0.2]]) bone(x, y, l, a);
  skull(230, 237); skull(448, 201); skull(318, 226);

  /* ---------- bancos da nave (banco do jogo), meio no escuro à esquerda ---------- */
  const MAD = P(['#100a06', '#1a110b', '#2c1d13', '#40291a', '#563823', '#6e4a2f', '#88603d']);
  const pew = (x0, broken) => { const y0 = yFloor - 14;
    for (let j = 0; j < 14; j++) for (let i = 0; i < 36; i++) { let t = null;
      if ((i < 3 || i > 32) && !(j === 0 && i % 33 !== 1)) t = 3.8 + (i % 33 === 0 ? 1.1 : 0) - (i % 33 === 2 ? 1.2 : 0) + (j > 3 && j < 6 && i % 33 === 1 ? -1.4 : 0);
      else if (j < 2 && i >= 2 && i < 34) t = j === 0 ? 5 : 3.4;
      else if (j < 7 && i >= 3 && i < 33) t = 2.6 + (i % 10 === 0 ? -1.4 : i % 10 === 1 ? 0.6 : 0) + (fbm(i / 6, j / 3, 261) - 0.5) * 1.4;
      else if (j >= 7 && j < 9) t = j === 7 ? 5.2 : 3.4; else if (j === 9 && i > 2 && i < 33) t = 1.4; else if (j === 12 && i > 3 && i < 32) t = 2.6;
      if (t === null) continue; if (broken && j < 7 && i > 13 && i < 24 && j < 7 - Math.abs(i - 19) * 0.8 + h2(i, j, 263) * 2) continue;
      propPut(x0 + i, y0 + j, MAD, t / 6); } };
  pew(128, 0); pew(170, 1);

  /* ---------- mortos-vivos no escuro da nave: só vultos de ossos, os olhos acendem no quadro ---------- */
  const UND = [[100, 196], [196, 194]];
  for (const [ux, uy] of UND) for (let j = 0; j < 22; j++) for (let i = -4; i <= 4; i++) {
    const head = j < 6 && Math.hypot(i, j - 3) < 3.2, body = j >= 6 && j < 14 && Math.abs(i) < 3.5 - (j > 11 ? 1.2 : 0), legs = j >= 14 && (Math.abs(i + 1.5) < 0.8 || Math.abs(i - 1.5) < 0.8);
    if (!head && !body && !legs) continue; if (body && (j % 2 === 1) && Math.abs(i) < 2.5) { put(ux + i, uy + j, C('#0a090b')); continue; }
    put(ux + i, uy + j, rp(P(['#0e0d10', '#17151a', '#221f24']), 0.5 + (i < 0 ? 0.3 : 0) - j * 0.01, ux + i, uy + j)); N[(uy + j) * W + ux + i] = 1;
  }
  const UEYES = UND.map(([ux, uy]) => [ux - 1, uy + 3]);
  // o altarzinho lá no fundo, com quatro velas
  for (let y = 186; y < 197; y++) for (let x = 140; x < 163; x++) { const top = y < 188; put(x, y, rp(FAR, top ? 0.85 : 0.5 + (x < 145 ? 0.15 : 0) + (y > 194 ? -0.2 : 0), x, y)); N[y * W + x] = 1; }
  const FARV = [[144, 185, 3], [149, 185, 4], [153, 185, 4], [158, 185, 3]];
  for (const [vx, vy, hh] of FARV) { for (let j = 0; j < hh; j++) { put(vx, vy - j, C('#8a7e66')); N[(vy - j) * W + vx] = 3; } FLAMES.push([vx, vy - hh, 0]); }

  /* ---------- o herói, no chão diante do estrado, tocha erguida ---------- */
  const HK = [ // o herói já com a armadura de cobre da primeira camada
    '....hh.h......',
    '..hhhhhhhh....',
    '.hhhhhhhhhh...',
    '.hhhhhhhhh..t.',
    '..hhhhssWe..t.',
    '..hhhsssss..t.',
    '...hhsssms.ss.',
    '....hssss.cC..',
    '....nssn.cd...',
    '.dCcnnnncr....',
    '.dcccCCcrr....',
    '..dccCCcrr....',
    '..ddcccdrr....',
    'gbbbbbbbkb....',
    'g.rrrrrrrr....',
    'g.rrrrrrrr....',
    '.rrrrrrrrrr...',
    '.rrrrrrrrrr...',
    '..pppp.ppp....',
    '..ppp...pp....',
    '..ppp...pp....',
    '.fff....fff...'];
  const HC = { h: '#4e2c1a', s: '#e2a982', W: '#f2ead8', e: '#1c1422', m: '#a5604a', n: '#8a6a48', r: '#6e5a44', b: '#3a2618', k: '#c8a050', p: '#4b3b33', f: '#2a1c14', t: '#5a3a1e', c: '#d07c40', C: '#ffc080', d: '#6e3a20', g: '#9a9aa0' };
  for (let j = 0; j < HK.length; j++) for (let i = 0; i < HK[j].length; i++) { const ch = HK[j][i]; if (!HC[ch]) continue;
    let c = C(HC[ch]); const X = HERO.x + i, Y = HERO.y + j;
    if (ch !== 'W' && ch !== 'e') { const lx = (i - 4) / 10, up = (21 - j) / 21; c = mix(c, lx > 0.2 || up > 0.7 ? C('#ffc888') : C('#160e10'), lx > 0.2 || up > 0.7 ? cl(lx * 0.3 + up * 0.15, 0, 0.35) : 0.4); }
    if (ch === 'h' && (i + j) % 4 === 0) c = mix(c, C('#2a160c'), 0.4);
    put(X, Y, c); N[Y * W + X] = 6; }
  // sombra comprida do herói para trás
  for (let x = HERO.x - 22; x < HERO.x + 2; x++) { const y = yFloor; if (M(x, y) === 2) blend(x, y, C('#050304'), 0.6 * (1 - (HERO.x + 2 - x) / 26)); }

  /* ---------- longe da luz, tudo some no escuro; a esquerda fica para o nome e o menu ---------- */
  const DARK = C('#030205');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = N[y * W + x]; if (n === 6) continue;
    const L = lightAt(x, y); const lit = (L ? L.a : 0) + (n === 0 ? 0.13 : n === 1 ? 0.16 : n === 5 ? 0.34 : n === 7 ? 0.22 : n === 3 ? 0.12 : 0.06);
    const left = cl((170 - x) / 150, 0, 1) * 0.55;
    const dk = cl(0.7 - lit * 2.3 + left, 0, 0.93);
    if (dk > 0) put(x, y, mix(get(x, y), DARK, qa(dk, x, y, 8)));
  }
  /* ---------- grão e vinheta ---------- */
  const VIG = C('#020103');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = (x - W * 0.62) / (W * 0.6), ny = (y - H * 0.45) / (H * 0.68), d = Math.hypot(nx, ny);
    let c = get(x, y); const g = (h2(x, y, 999) - 0.5) * 8; c = [c[0] + g, c[1] + g, c[2] + g];
    const v = cl((d - 0.6) / 0.6, 0, 1) * 0.75; if (v > 0) c = mix(c, VIG, qa(v, x, y, 5));
    put(x, y, [cl(c[0], 0, 255), cl(c[1], 0, 255), cl(c[2], 0, 255)]);
  }
  cx.putImageData(img, 0, 0);

  /* ---------- o que mexe ---------- */
  const mkGlow = (R, rgb, a0) => { const g = document.createElement('canvas'); g.width = g.height = R * 2; const x = g.getContext('2d');
    for (let y = 0; y < R * 2; y++) for (let i = 0; i < R * 2; i++) { const d = Math.hypot(i - R, y - R) / (R * 0.85); const a = qa(cl(1 - d, 0, 1), i, y, 4); if (a > 0) { x.fillStyle = `rgba(${rgb},${a * a0})`; x.fillRect(i, y, 1, 1); } } return g; };
  const glow = mkGlow(36, '255,160,70', 0.06), cglow = mkGlow(10, '255,176,96', 0.1), eglow = mkGlow(6, '255,58,42', 0.35);
  const FL = ['#fff4c0', '#ffd27a', '#f39a3a', '#d0601e', '#8a2e10'];
  const motes = [];
  let glintAt = 1.5, glintI = 0, ublink = [3, 5.5];
  function frame(fx, t, dt) {
    // chama da tocha
    const tx = TORCH.x, ty = TORCH.y;
    fx.globalAlpha = 0.8 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.1; fx.drawImage(glow, tx - 36, ty - 36); fx.globalAlpha = 1;
    for (let j = 0; j < 5; j++) { const w = j < 1 ? 1 : j < 3 ? 2 : 1, sway = Math.round(Math.sin(t * 7 + j) * (j / 4) * 1.2); fx.fillStyle = FL[Math.min(4, j + (Math.sin(t * 15 + j * 2) > 0.5 ? 1 : 0))]; fx.fillRect(tx - (w > 1 ? 1 : 0) + sway, ty - j, w, 1); }
    if (Math.random() < dt * 6) motes.push({ x: tx + (Math.random() - 0.5) * 2, y: ty - 4, vx: (Math.random() - 0.5) * 6, vy: -(8 + Math.random() * 10), t: 0, life: 0.6 + Math.random() * 0.8, spark: true });
    // velas: chamas pequenas que tremem
    for (let i = 0; i < FLAMES.length; i++) { const [x, y, s] = FLAMES[i], f = Math.sin(t * (8 + i % 3) + i * 1.7) + Math.sin(t * 19 + i) * 0.5;
      fx.globalAlpha = (s ? 0.6 : 0.3) + f * 0.12; fx.drawImage(cglow, x - 10, y - 10); fx.globalAlpha = 1;
      if (!s) { fx.fillStyle = FL[f > 0.5 ? 0 : 1]; fx.fillRect(x, y, 1, 1); if (f > -0.3) { fx.fillStyle = FL[2]; fx.fillRect(x, y - 1, 1, 1); } continue; }
      const hgt = s > 1 ? 3 + (f > 0.6 ? 1 : 0) : 2 + (f > 0.8 ? 1 : 0), sw = f > 1 ? 1 : f < -1 ? -1 : 0;
      fx.fillStyle = FL[3]; fx.fillRect(x, y, 1, 1); fx.fillStyle = FL[1]; fx.fillRect(x + (s > 1 ? 0 : 0), y - 1, 1, hgt - 1); fx.fillStyle = FL[0]; fx.fillRect(x + sw * 0, y - 1, 1, 1); if (hgt > 2) { fx.fillStyle = FL[2]; fx.fillRect(x + sw, y - hgt + 1, 1, 1); } }
    // poeira caindo devagar na luz colorida da rosácea
    if (motes.length < 36 && Math.random() < dt * 6) { const a = Math.random() * Math.PI * 2, r = Math.random() * ROSE.r; motes.push({ x: ROSE.x + Math.cos(a) * r, y: ROSE.y + Math.sin(a) * r * 0.6 + 20, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, t: 0, life: 5 + Math.random() * 4, col: ['#e8988a', '#94b0e4', '#f8dc9a', '#b49ade'][(Math.random() * 4) | 0] }); }
    for (let i = motes.length - 1; i >= 0; i--) { const m = motes[i]; m.t += dt; if (m.t > m.life) { motes.splice(i, 1); continue; } m.x += (m.vx + Math.sin(m.t * 2 + i) * 1.5) * dt; m.y += m.vy * dt;
      const f = m.t / m.life; fx.globalAlpha = m.spark ? 1 - f : Math.sin(f * Math.PI) * 0.4; fx.fillStyle = m.spark ? FL[Math.min(4, (f * 5) | 0)] : m.col; fx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); }
    fx.globalAlpha = 1;
    // os olhos do rei: brasa vermelha no fundo das órbitas, que pulsa devagar
    const ep = 0.55 + Math.sin(t * 1.3) * 0.25 + Math.max(0, Math.sin(t * 0.37) - 0.85) * 2;
    fx.globalAlpha = cl(ep, 0, 1); for (const [x, y] of KEYES) fx.drawImage(eglow, x - 6, y - 6);
    for (const [x, y] of KEYES) { fx.fillStyle = '#ff3a2a'; fx.fillRect(x - 1, y, 2, 1); fx.fillStyle = '#ffb090'; fx.fillRect(x, y, 1, 1); }
    fx.globalAlpha = 1;
    // um lampejo correndo pelas pontas da coroa
    if (t > glintAt + 0.5) { glintAt = t + 2 + Math.random() * 3; glintI = (Math.random() * KCROWN.length) | 0; }
    if (t > glintAt) { const k = (t - glintAt) / 0.5, a = Math.sin(k * Math.PI), [gx, gy] = KCROWN[glintI]; fx.globalAlpha = a; fx.fillStyle = '#fff6d8'; fx.fillRect(gx, gy - 2, 1, 5); fx.fillRect(gx - 2, gy, 5, 1); fx.globalAlpha = 1; }
    // olhos de mortos-vivos no escuro da nave, acendem e piscam
    for (let i = 0; i < UEYES.length; i++) { if (t > ublink[i] + 0.18) ublink[i] = t + 2 + Math.random() * 5; if (t > ublink[i]) continue;
      const [x, y] = UEYES[i]; fx.globalAlpha = 0.35 + Math.sin(t * 0.8 + i * 2) * 0.2; fx.fillStyle = '#c84a30'; fx.fillRect(x, y, 1, 1); fx.fillRect(x + 2, y, 1, 1); fx.globalAlpha = 1; }
  }
  return { canvas: cv, frame };
}
var TITLE_ARTS = TITLE_ARTS || []; TITLE_ARTS.push(paintTitleArtCatedral);
