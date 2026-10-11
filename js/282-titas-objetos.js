'use strict';

/* ================= o Ossário dos Titãs: objetos de cena =================
   Tudo o que é maior que um bloco e veste o Ossário (docs/camadas/12-ossario-titas.md, seção 5): 28 objetos.
   No Campo das Costelas: o monte de cinza com ossos saindo, o dente solto do tamanho de um homem, o acampamento de
   catador com o fogo de tutano (luz amarelo-pálida), o varal de ossinhos, a pele seca esticada entre as costelas, as
   pegadas gigantes no pó e o crânio de um bicho comum ao lado de um dedo de titã (para dar a escala).
   Na Espinha: a apófise quebrada, a corrente de bronze partida, a cabeça de lança de titã fincada, o disco de
   cartilagem caído, o ninho de abutre (pendurado debaixo das pontes) e a bandeira de bronze rasgada.
   No Vale dos Crânios: o olho de cristal opaco caído da órbita, o cocar de bronze, o dente quebrado, o elmo de ciclope
   com um furo só, a pintura de catador na parede de osso, o totem de crânio de nascido, a pilha de capacetes humanos
   (escala de novo) e a teia de tendões secos.
   No Leito do Último: a lâmina da foice de Cronos (20 x 12 blocos, a maior peça da camada, com o brilho frio), o cabo
   da foice quebrado, a corrente presa no grilhão gigante, o coração de pedra rachado, a ampulheta de bronze tombada,
   as lascas da foice em leque e o osso com marcas de corte.
   O pintor do 252 (rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, grão). Luz só onde há
   motivo: o fogo de tutano dos catadores (amarelo-pálido, a chama ao vivo), a adamantita da foice e das lascas (fria,
   cintila) e um fio frio no olho de cristal.
   Registrados com defProp (`titas: true`), postos pelo 285 a partir do TT_PROP_PLAN. Flags para o gerador:
     caixa: true   só dentro das caixas torácicas (a pele esticada entre as costelas);
     cranio: true  só dentro dos crânios e dos elmos (a pintura, a teia de tendões);
     canion: true  só nos desfiladeiros e nas pontes (o ninho de abutre);
     campo: true   só junto de um acampamento de catador (o fogo de tutano). */
const TT_PROP_PLAN = {};
// peças de fundo que ficam em pé no chão em vez de penduradas na altura dos olhos
const TT_BACK_FLOOR = { tt_pegadas: 1, tt_foice: 1, tt_lascas_leque: 1 };
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  osso: ['#3a352a', '#5a5444', '#7e7660', '#a29880', '#c8bca0', '#e8e0c8'],
  marfim: ['#4a4436', '#6e6652', '#948a72', '#b8ae94', '#d8d0b6', '#f4eedc'],
  esponja: ['#4a3c30', '#6a5848', '#8a7660', '#a8947a', '#c4b096', '#dccab0'],
  esmalte: ['#4a5458', '#6e7a80', '#94a2a8', '#b8c4ca', '#dce4e8', '#f4f8fa'],
  bronze: ['#1a241c', '#2a3a2c', '#3a5240', '#4a6a52', '#6a8a6a', '#a8b88a'],
  azinhavre: ['#1e3a30', '#2e5a48', '#4a8068', '#74a88a', '#a8d0b0', '#d4ecd8'],
  ada: ['#1c2422', '#2e3a38', '#465652', '#5e7470', '#7a948a', '#d0e4dc'],
  tutano: ['#4a2a20', '#6e4030', '#945a42', '#b87a5a', '#d4a07a', '#ecc8a4'],
  cartilagem: ['#4a3e1e', '#6a5a2c', '#8c7a40', '#ae9a58', '#ccb878', '#e6d6a0'],
  rocha: ['#24221c', '#363228', '#4c4638', '#6a6252', '#887e6a', '#a69c86'],
  cinza: ['#1e1d1c', '#2e2c2a', '#403d3a', '#55514c', '#6c6862', '#87827a'],
  po: ['#4e4a40', '#6a6556', '#87806e', '#a89e88', '#c4bca6', '#ddd6c2'],
  pele: ['#2a1c14', '#46301e', '#64462c', '#84603c', '#a47c52', '#c49c70'],
  tendao: ['#2e2216', '#4a3824', '#664e34', '#866648', '#a8865e', '#c8a67a'],
  ocre: ['#3a1a0c', '#5e2a12', '#86401c', '#b05c2a', '#d07e3e', '#e8a660'],
  pena: ['#141210', '#24201c', '#38322c', '#504840', '#6c6258', '#8c8276'],
  ferro: ['#1a1a1c', '#2c2c30', '#424248', '#5c5c64', '#7a7a84', '#a0a0aa'],
  cristal: ['#2a3430', '#44544e', '#62746c', '#84968c', '#a8b8ae', '#d4e0d8'],
  pedraC: ['#2a1a1a', '#442a28', '#5e3c38', '#7a524c', '#966a62', '#b2887e'],
  vidro: ['#2a3a3a', '#3e5452', '#58706c', '#76908a', '#9cb4ac', '#cad8d2'],
  areia: ['#3a3222', '#5a4c32', '#7a6844', '#9c8858', '#bca870', '#d8c690']
};
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#06050a');
const FRIO = { miolo: '#ffffff', claro: '#e4f6ee', luz: '#bfe8dc', fundo: '#7aa89a' };
const FOGO = { miolo: '#fffbe8', claro: '#fff0b0', luz: '#f0d890', fundo: '#c89a50' };

/* ---- o pintor (o do 252): rid -2 marca um pixel de cor pura que acende ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, ramps, idOf, pts: {},
    put(x, y, R, v) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; },
    N(x, y, hex) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = ph(hex); rid[k] = -2; val[k] = 5; },
    clear(x, y) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    isN(x, y) { return x >= 0 && y >= 0 && x < w && y < h && rid[(y | 0) * w + (x | 0)] === -2; },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    blob(cx, cy, rx, ry, R, s, base = 2.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 0.9 - (dx + dy) * 0.9 - d * 0.6 + cg(x, y, s) * 0.35); } },
    ell(cx, cy, rx, ry, fn) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d <= 1) fn(x, y, dx, dy, d); } },
    line(x0, y0, x1, y1, R, v, wd = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < wd; k++) P.put(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), R, typeof v === 'function' ? v(i / n, k) : v); } },
    nline(x0, y0, x1, y1, col) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) P.N(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, typeof col === 'function' ? col(i / n) : col); },
    mark(name, x, y, extra) { (P.pts[name] || (P.pts[name] = [])).push(Object.assign({ x: Math.round(x), y: Math.round(y) }, extra || {})); },
    done(rim = true) {
      if (rim) {
        const src = c.slice(), sr = rid.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const k = y * w + x; if (src[k]) continue;
          let n = -1; if (x > 0 && src[k - 1]) n = k - 1; else if (x < w - 1 && src[k + 1]) n = k + 1; else if (y > 0 && src[k - w]) n = k - w; else if (y < h - 1 && src[k + w]) n = k + w;
          if (n < 0) continue; const r = sr[n]; c[k] = r >= 0 ? ramps[r][0] : OUTLINE;
        }
      }
      return P;
    }
  };
  return P;
}
// uma curva grossa: fn(t) -> [x, y], wd(t) a largura; redonda no corte, luz de cima à esquerda
function tube(P, fn, wd, R, s, base = 2.8) {
  const [ax, ay] = fn(0), [bx, by] = fn(1), n = Math.ceil(Math.hypot(bx - ax, by - ay) * 3) + 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = fn(t), r = Math.max(0.5, wd(t) / 2);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      const dx = (xx + 0.5 - x) / r, dy = (yy + 0.5 - y) / r, d = dx * dx + dy * dy; if (d > 1) continue;
      P.put(xx, yy, R, base + 0.8 - (dx + dy) * 0.95 - d * 0.45 + cg(xx, yy, s) * 0.3);
    }
  }
}
const bez = (a, b, c, d) => t => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; };
const lin = (a, b) => t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
// um osso longo: a haste e as duas cabeças (côndilos), veio fibroso ao comprido
function longBone(P, a, b, wd, R, s, base = 2.8) {
  tube(P, lin(a, b), t => wd * (0.78 + 0.22 * Math.pow(Math.abs(t - 0.5) * 2, 3)), R, s, base);
  for (const [p, q] of [[a, -1], [b, 1]]) { const dx = (b[0] - a[0]), dy = (b[1] - a[1]), L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L; P.blob(p[0] + nx * wd * 0.35, p[1] + ny * wd * 0.35, wd * 0.62, wd * 0.62, R, s + 1, base); P.blob(p[0] - nx * wd * 0.35, p[1] - ny * wd * 0.35, wd * 0.58, wd * 0.58, R, s + 2, base - 0.2); void q; }
  // o veio: riscos claros e escuros ao comprido
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
  for (let i = 3; i < n - 3; i += 2) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; if (hash2(i, 1, s) < 0.35) P.put(x, y + wd * 0.2, R, base - 0.8); if (hash2(i, 2, s) < 0.3) P.put(x, y - wd * 0.25, R, base + 1.3); }
}
// uma mancha sobre o que já está pintado (pó, cinza, azinhavre); só nas rampas de on (ou em tudo)
function stain(P, R, cover, s, bias, lift = 0, on = null) {
  const me = P.idOf(R);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0 || P.rid[k] === me) continue;
    if (on && !on.includes(P.ramps[P.rid[k]])) continue;
    const n = cn(x, y, 12, 12, s) + cn(x, y, 40, 40, s + 1) * 0.5 + (bias ? bias(x, y) : 0);
    if (n > 0.5 - cover) P.put(x, y, R, 0.9 + P.val[k] * 0.55 + cg(x, y, s + 2) * 0.7 + lift);
  }
}
// o pó assentado: pega no que olha para cima
const dust = (P, cover, s, on) => stain(P, RP.po, cover, s, (x, y) => P.has(x, y - 1) ? (P.has(x, y - 3) ? -0.3 : 0.15) : 0.5, 0.4, on);
// rachaduras finas e escuras que andam ao acaso
function cracks(P, n, s, on) {
  for (let k = 0; k < n; k++) {
    let x = hash2(k, 0, s) * P.w, y = hash2(k, 1, s) * P.h, a = hash2(k, 2, s) * 6.28;
    for (let i = 0; i < 6 + hash2(k, 3, s) * 10; i++) {
      const X = Math.floor(x), Y = Math.floor(y), q = Y * P.w + X;
      if (P.has(X, Y) && P.rid[q] >= 0 && (!on || on.includes(P.ramps[P.rid[q]]))) P.put(X, Y, P.ramps[P.rid[q]], Math.max(0, P.val[q] - 1.6));
      a += (hash2(k, i, s + 5) - 0.5) * 1.2; x += Math.cos(a); y += Math.sin(a);
    }
  }
}
function chip(P, amt, s) {
  const del = [];
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    if (!P.has(x, y) || P.isN(x, y)) continue;
    const a = (P.has(x - 1, y) ? 0 : 1) + (P.has(x + 1, y) ? 0 : 1) + (P.has(x, y - 1) ? 0 : 1) + (P.has(x, y + 1) ? 0 : 1);
    if (a >= 2 && hash2(x, y, s) < amt) del.push(x, y);
  }
  for (let i = 0; i < del.length; i += 2) P.clear(del[i], del[i + 1]);
}
// pedrinhas e ossinhos espalhados no chão
function scatter(P, x0, x1, by, n, R, s) { for (let k = 0; k < n; k++) { const x = x0 + hash2(k, 0, s) * (x1 - x0), w = 1 + hash2(k, 1, s) * 2.2; P.blob(x, by - 0.6, w, 0.9, R, s + k, 2.4); } }
// a lâmina de adamantita: aço cinza-esverdeado, o fio quase branco que acende frio
function adaBlade(P, pts, s, edge) {
  for (const [x, y, v] of pts) P.put(x, y, RP.ada, v + cg(x, y, s) * 0.3);
  for (const [x, y] of edge) { P.N(x, y, hash2(x, y, s) < 0.3 ? FRIO.miolo : FRIO.claro); }
}

/* =============================== o Campo das Costelas =============================== */
// o monte de cinza com ossos saindo: a cinza em camadas, costelas e um fêmur espetados
function ashMound(k) {
  const W = k ? 44 : 38, H = k ? 20 : 16, P = painter(W, H), s = 28201 + k;
  for (let x = 0; x < W; x++) { const u = (x + 0.5) / W * 2 - 1, top = Math.round(H - (H - 4) * Math.pow(1 - u * u, 0.8)); for (let y = top; y < H; y++) P.put(x, y, RP.cinza, 2.3 + (y === top ? 1.2 : 0) - (y - top) * 0.06 + Math.sin(y * 1.7 + x * 0.1) * 0.3 + cg(x, y, s) * 0.5 - u * 0.4); }
  longBone(P, [W * 0.25, H * 0.5], [W * 0.05, 3], 3, RP.osso, s + 1);
  tube(P, bez([W * 0.55, H * 0.5], [W * 0.6, 4], [W * 0.75, 1], [W * 0.9, 3]), t => 3 - t * 1.6, RP.osso, s + 2);
  if (k) tube(P, bez([W * 0.45, H * 0.6], [W * 0.42, 6], [W * 0.5, 2], [W * 0.62, 0]), t => 2.6 - t * 1.4, RP.marfim, s + 3);
  for (let x = 0; x < W; x++) { let y = 0; while (y < H && !P.has(x, y)) y++; if (y < H && hash2(x, 3, s) < 0.5) P.put(x, y, RP.cinza, 4); }
  return P.done();
}
// o dente solto, do tamanho de um homem: coroa de esmalte, as raízes amarelas, uma lasca faltando
function looseTooth(k) {
  const W = 18, H = 28, P = painter(W, H), s = 28211 + k;
  P.ell(9, 9, 8, 9, (x, y, dx, dy, d) => P.put(x, y, RP.esmalte, 3.4 - dx * 1.2 - dy * 0.9 - d * 0.6 + cg(x, y, s) * 0.3));
  for (const sx of [-1, 1]) tube(P, bez([9 + sx * 4, 14], [9 + sx * 5, 19], [9 + sx * 4, 24], [9 + sx * 2.5, 27]), t => 4.4 - t * 2.6, RP.cartilagem, s + 1, 2.4);
  for (let y = 1; y < 16; y++) if (hash2(y, 0, s) < 0.35) P.put(7 + (y % 3), y, RP.esmalte, 5);
  if (k) for (let y = 0; y < 5; y++) for (let x = 12; x < 18; x++) if (x - 12 > y) P.clear(x, y);
  cracks(P, 2, s + 4, [RP.esmalte]);
  return P.done();
}
// o acampamento de catador: o abrigo de costelas com a pele por cima, a tigela de crânio com o fogo de tutano, ossos amarrados
function scavCamp(k) {
  const W = 46, H = 26, P = painter(W, H), s = 28221 + k;
  // o abrigo: duas costelas curvas em arco com a pele esticada
  for (const [x0, dir] of k ? [[4, 1], [24, 1]] : [[6, 1], [28, 1]]) tube(P, bez([x0, 25], [x0 + 1, 12], [x0 + 6, 3], [x0 + 14 * dir, 2]), t => 2.6 - t, RP.osso, s + x0);
  for (let y = 3; y < 18; y++) for (let x = (k ? 6 : 8) + Math.floor(y * 0.2); x < (k ? 24 : 28) + Math.floor(y * 0.2); x++) if (y < 6 + (x % 5) || hash2(x, y, s) < 0.92) P.put(x, y, RP.pele, 2.4 + (y < 5 ? 1 : 0) + Math.sin(x * 0.7) * 0.4 - y * 0.05 + cg(x, y, s) * 0.5);
  // a tigela (meio crânio virado) e o fogo
  const fx = k ? 34 : 38;
  P.ell(fx, 23, 6, 3, (x, y, dx, dy, d) => { if (dy > -0.2) P.put(x, y, RP.osso, 3 - dx - d * 0.6); });
  for (let x = fx - 3; x <= fx + 3; x++) P.put(x, 22, RP.tutano, 4.2 + hash2(x, 1, s) * 0.8);
  P.mark('fogo', fx - 3, 21, { w: 7 });
  // ossos amarrados em pé e um saco de pele
  tube(P, lin([k ? 42 : 2, 25], [k ? 44 : 3, 10]), () => 1.6, RP.osso, s + 3);
  P.ell(k ? 19 : 22, 22, 4, 3.4, (x, y, dx, dy, d) => P.put(x, y, RP.pele, 3 - dx - dy - d * 0.6 + cg(x, y, s) * 0.4));
  scatter(P, 0, W, 25, 6, RP.osso, s + 5);
  return P.done();
}
// o varal de ossinhos: um tendão de ponta a ponta com ossinhos e dentes pendurados balançando
function boneLine(k) {
  const W = k ? 46 : 38, H = 14, P = painter(W, H), s = 28231 + k;
  const sag = t => 1 + Math.sin(t * Math.PI) * 4;
  for (let x = 0; x < W; x++) P.put(x, sag(x / W), RP.tendao, 2.6 + cg(x, 0, s) * 0.4);
  for (let x = 3; x < W - 2; x += 4 + ((hash2(x, 0, s) * 2) | 0)) {
    const y0 = Math.round(sag(x / W)) + 1, L = 3 + ((hash2(x, 1, s) * 5) | 0), q = hash2(x, 2, s);
    P.put(x, y0, RP.tendao, 2);
    if (q < 0.4) longBone(P, [x, y0 + 1], [x, y0 + L], 1.6, RP.osso, s + x);
    else if (q < 0.7) P.ell(x, y0 + 2, 1.4, 2, (xx, yy, dx, dy, d) => P.put(xx, yy, RP.esmalte, 3.4 - dx - dy));
    else P.ell(x, y0 + 2, 2.2, 1.8, (xx, yy, dx, dy, d) => P.put(xx, yy, RP.marfim, d < 0.25 ? 1 : 3.2 - dx - dy));
  }
  return P.done();
}
// a pele seca esticada entre as costelas: couro rasgado, amarrado com tendão nos quatro cantos
function hide(k) {
  const W = 36, H = 30, P = painter(W, H), s = 28241 + k;
  for (let y = 3; y < H - 2; y++) for (let x = 3; x < W - 3; x++) {
    const e = Math.min(x - 3, W - 4 - x, y - 3, H - 3 - y), n = cn(x, y, 8, 8, s);
    if (e < 2 && n < 0.45) continue;
    if (k && x > 16 && x < 22 && y > 10 + (x - 16) && y < 24) continue;   // o rasgo
    P.put(x, y, RP.pele, 2.5 + Math.sin(x * 0.4 + y * 0.2) * 0.4 + cn(x, y, 6, 6, s + 1) * 0.6 - y * 0.02 + cg(x, y, s) * 0.5);
  }
  for (const [x, y, dx, dy] of [[2, 2, -2, -2], [W - 3, 2, 2, -2], [2, H - 3, -2, 2], [W - 3, H - 3, 2, 2]]) P.line(x, y, x + dx, y + dy, RP.tendao, 3);
  return P.done();
}
// as pegadas gigantes no pó: duas depressões compridas com os dedos, a borda de pó levantado (no chão, atrás do herói)
function footprints(k) {
  const W = 60, H = 8, P = painter(W, H), s = 28251 + k;
  for (let x = 0; x < W; x++) P.put(x, H - 1, RP.po, 2.6 + cg(x, 0, s) * 0.4);
  for (const x0 of k ? [4, 34] : [8]) {
    for (let x = x0; x < x0 + 22; x++) { const u = (x - x0) / 22, d = Math.round(Math.sin(u * Math.PI) * 3); for (let y = H - 1 - d; y < H; y++) P.put(x, y, RP.po, 1.4 + (y === H - 1 - d ? 0.8 : 0)); P.put(x, H - 2 - d, RP.po, 4.2); }
    for (let t = 0; t < 4; t++) P.ell(x0 + 24 + t * 3, H - 3, 1.3, 1.6, (x, y) => P.put(x, y, RP.po, 1.6));
  }
  return P.done();
}
// o crânio de um bicho comum (um boi) ao lado da ponta de um dedo de titã: a escala
function scaleSkull(k) {
  const W = 46, H = 20, P = painter(W, H), s = 28261 + k;
  // o dedo: a falange da ponta, do tamanho de um tronco
  tube(P, bez([k ? 44 : 2, 19], [k ? 40 : 6, 8], [k ? 32 : 14, 2], [k ? 22 : 24, 3]), t => 9 - t * 3, RP.osso, s, 2.7);
  // o crânio de boi pequeno, com os chifres
  const cx = k ? 10 : 36;
  P.ell(cx, 15, 4, 3.4, (x, y, dx, dy, d) => P.put(x, y, RP.marfim, 3.4 - dx - dy - d * 0.7));
  P.put(cx - 2, 14, RP.osso, 0.4); P.put(cx + 1, 14, RP.osso, 0.4); P.put(cx - 1, 17, RP.osso, 0.6);
  P.line(cx - 4, 13, cx - 7, 10, RP.marfim, 3.6); P.line(cx + 4, 13, cx + 7, 10, RP.marfim, 3.6);
  return P.done();
}

/* =============================== a Espinha =============================== */
// a apófise quebrada: a ponta de uma vértebra gigante, fincada, partida em cima
function process_(k) {
  const W = 18, H = 32, P = painter(W, H), s = 28301 + k;
  for (let y = 0; y < H; y++) { const hw = 3 + y * 0.18 + (y > H - 6 ? (y - H + 6) * 0.8 : 0); for (let x = Math.round(9 - hw); x <= 9 + hw; x++) P.put(x, y, RP.osso, 2.8 - (x - 9) / hw * 1.1 + (y < 3 ? -0.6 : 0) + cg(x, y, s) * 0.4 + Math.sin(y * 0.8) * 0.2); }
  for (let x = 0; x < W; x++) for (let y = 0; y < 4 + hash2(x, 0, s) * 3; y++) if (hash2(x, y, s) < 0.6) P.clear(x, y);
  for (let y = 6; y < H - 4; y += 3) if (hash2(y, 1, s) < 0.6) P.put(7 + (y % 4), y, RP.esponja, 1.4);
  cracks(P, 3, s + 2);
  return P.done();
}
// a corrente de bronze partida pendurada: elos grossos de azinhavre, o último aberto
function bronzeChain(k) {
  const W = 12, H = k ? 46 : 36, P = painter(W, H), s = 28311 + k;
  for (let i = 0, y = 0; y < H - 4; i++, y += 5) {
    if (i % 2 === 0) P.ell(6, y + 3, 3.4, 3.6, (x, yy, dx, dy, d) => { if (d > 0.35) P.put(x, yy, RP.bronze, 3 - dx - dy + cg(x, yy, s) * 0.4); });
    else P.rect(5, y, 2, 6, RP.bronze, (a, b) => 2.6 + (a ? -0.6 : 0.6));
  }
  stain(P, RP.azinhavre, 0.12, s + 3, null, 0.2);
  for (let y = H - 4; y < H; y++) P.clear(8, y);
  return P.done();
}
// a cabeça de lança de titã fincada: folha de bronze larga, o alvado, um toco da haste
function titanSpear(k) {
  const W = 24, H = 42, P = painter(W, H), s = 28321 + k;
  for (let y = 0; y < 26; y++) { const hw = y < 18 ? y * 0.55 + 0.5 : (26 - y) * 1.1 + 2; for (let x = Math.round(12 - hw); x <= 12 + hw; x++) P.put(x, y + 16, RP.bronze, 2.8 + (x < 12 ? 0.8 : -0.5) + (Math.abs(x - 12) < 1 ? 1.2 : 0) + cg(x, y, s) * 0.4); }
  P.rect(10, 0, 5, 18, RP.ferro, (i, j) => 2.4 + (i === 0 ? 0.8 : i === 4 ? -0.8 : 0) + Math.sin(j * 0.7) * 0.2);
  stain(P, RP.azinhavre, 0.08, s + 1, null, 0.2, [RP.bronze]);
  if (k) for (let y = 30; y < 36; y++) for (let x = 15; x < 20; x++) if (x - 15 < y - 30) P.clear(x, y);
  // a ponta virada para cima: espelha
  const Q = painter(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const q = (H - 1 - y) * W + x; if (P.c[q]) Q.put(x, y, P.ramps[P.rid[q]], P.val[q] + (P.ramps[P.rid[q]] === RP.bronze ? 0 : 0)); }
  return Q.done();
}
// o disco de cartilagem caído: amarelado, anéis fibrosos de lado, rachado
function disc(k) {
  const W = 28, H = 13, P = painter(W, H), s = 28331 + k;
  P.ell(14, 7, 13.5, 6, (x, y, dx, dy, d) => P.put(x, y, RP.cartilagem, 2.8 - dy * 1.2 - dx * 0.4 + Math.sin(Math.sqrt(d) * 9 + s) * 0.45 + cg(x, y, s) * 0.4));
  cracks(P, 2, s + 1);
  if (k) for (let y = 0; y < H; y++) P.clear(18 + (y % 2), y);
  return P.done();
}
// o ninho de abutre debaixo de uma ponte: ossinhos e penas trançados, pendurado
function vultureNest(k) {
  const W = 32, H = 16, P = painter(W, H), s = 28341 + k;
  for (let i = 0; i < 70; i++) { const a = hash2(i, 0, s) * Math.PI, r = 13 * Math.sqrt(hash2(i, 1, s)), x = 16 + Math.cos(a) * r, y = 2 + Math.sin(a) * r * 0.75, L = 3 + hash2(i, 2, s) * 4, an = hash2(i, 3, s) * 3; P.line(x, y, x + Math.cos(an) * L, y + Math.sin(an) * L, hash2(i, 4, s) < 0.6 ? RP.osso : RP.tendao, 2 + hash2(i, 5, s) * 2); }
  for (let i = 0; i < 6; i++) { const x = 4 + hash2(i, 6, s) * 24, y = 6 + hash2(i, 7, s) * 6; P.line(x, y, x + 1, y + 4, RP.pena, 2.6); }
  return P.done();
}
// a bandeira de bronze rasgada: placas finas de bronze presas numa haste, rasgadas embaixo
function bronzeBanner(k) {
  const W = 26, H = 42, P = painter(W, H), s = 28351 + k;
  P.rect(1, 0, 24, 2, RP.ferro, (i, j) => 3 - j);
  for (let y = 2; y < H; y++) for (let x = 3; x < 23; x++) {
    const bot = H - 2 - Math.abs(Math.sin(x * 0.9 + s)) * 9 - (k && x > 12 ? 8 : 0); if (y > bot) continue;
    const plate = (Math.floor((y - 2) / 6) + Math.floor((x - 3) / 5)) % 2;
    P.put(x, y, RP.bronze, 2.6 + plate * 0.5 + ((y - 2) % 6 === 0 ? 1 : 0) - (x - 3) * 0.03 + cg(x, y, s) * 0.4 + Math.sin(y * 0.3) * 0.3);
  }
  stain(P, RP.azinhavre, 0.18, s + 1, (x, y) => y / H * 0.3, 0.3, [RP.bronze]);
  return P.done();
}

/* =============================== o Vale dos Crânios =============================== */
// o olho de cristal opaco caído da órbita: leitoso, a íris apagada, um fio frio por dentro
function crystalEye(k) {
  const W = 24, H = 19, P = painter(W, H), s = 28401 + k;
  P.ell(12, 10, 11, 8.5, (x, y, dx, dy, d) => P.put(x, y, RP.cristal, 3.4 - dx * 0.9 - dy * 1.1 - d * 0.6 + cn(x, y, 6, 6, s) * 0.5));
  P.ell(13, 10, 4.5, 4, (x, y, dx, dy, d) => P.put(x, y, RP.vidro, d < 0.3 ? 0.6 : 2.4 - dx - dy));
  P.N(10, 7, FRIO.claro); P.N(11, 7, FRIO.luz); P.mark('brilho', 10, 7);
  cracks(P, 2, s + 1);
  if (k) for (let y = 15; y < H; y++) for (let x = 0; x < W; x++) if (y > 17 - x * 0.1) P.clear(x, y);
  return P.done();
}
// o cocar de bronze: a crista de placas em leque de um elmo de titã, caída de lado
function crest(k) {
  const W = 36, H = 20, P = painter(W, H), s = 28411 + k;
  for (let i = 0; i < 7; i++) { const a = Math.PI * (0.12 + i * 0.12), x1 = 18 + Math.cos(a) * 17 * (k && i === 5 ? 0.6 : 1), y1 = 19 - Math.sin(a) * 17; tube(P, lin([18, 19], [x1, y1]), t => 2.6 + t * 2.2, RP.bronze, s + i, 2.6); }
  P.ell(18, 19, 5, 3, (x, y, dx, dy, d) => P.put(x, y, RP.bronze, 3 - dx - dy));
  stain(P, RP.azinhavre, 0.15, s + 2, null, 0.2);
  return P.done();
}
// o dente quebrado: a metade de baixo de um dente, a quebra cheia de lascas
function brokenTooth(k) {
  const W = 18, H = 20, P = painter(W, H), s = 28421 + k;
  for (let y = 0; y < H; y++) { const hw = 7 - y * 0.12; for (let x = Math.round(9 - hw); x <= 9 + hw; x++) P.put(x, y, y > 13 ? RP.cartilagem : RP.esmalte, 3.2 - (x - 9) / hw * 1.2 + cg(x, y, s) * 0.3); }
  for (let x = 0; x < W; x++) { const cut = 3 + Math.abs(Math.sin(x * 1.3 + k)) * 5; for (let y = 0; y < cut; y++) P.clear(x, y); }
  return P.done();
}
// o elmo de ciclope: bronze redondo com um furo só no meio, amassado
function cyclopsHelm(k) {
  const W = 32, H = 26, P = painter(W, H), s = 28431 + k;
  P.ell(16, 17, 15, 15, (x, y, dx, dy, d) => { if (y < 25) P.put(x, y, RP.bronze, 3.1 - dx * 1.1 - dy * 1.1 - d * 0.5 + cg(x, y, s) * 0.4); });
  P.ell(16, 15, 4, 3.6, (x, y, dx, dy, d) => P.put(x, y, RP.bronze, d > 0.55 ? 1.2 : 0));
  for (let x = 2; x < 30; x += 4) P.put(x, 21, RP.ferro, 4);
  P.rect(1, 22, 30, 3, RP.bronze, (i, j) => 2.4 - j * 0.4 + (i % 5 === 0 ? 0.8 : 0));
  if (k) P.ell(24, 9, 4, 3, (x, y) => P.put(x, y, RP.bronze, 1.6));
  stain(P, RP.azinhavre, 0.14, s + 2, null, 0.2);
  return P.done();
}
// a pintura de catador na parede de osso: ocre e fuligem, um titã enorme deitado e gente pequena em volta
function painting(k) {
  const W = 38, H = 24, P = painter(W, H), s = 28441 + k;
  const ink = (x, y, R, v) => P.put(x, y, R, v + cg(x, y, s) * 0.3);
  // o titã deitado
  for (let x = 4; x < 32; x++) { const top = 12 - Math.round(Math.sin((x - 4) / 28 * Math.PI) * 5); for (let y = top; y < 15; y++) if ((x + y) % 7 !== 0) ink(x, y, RP.ocre, 3); }
  P.ell(33, 12, 3, 2.6, (x, y) => ink(x, y, RP.ocre, 3.4));
  // os homenzinhos com lanças e as mãos espalmadas
  for (let i = 0; i < (k ? 5 : 4); i++) { const x = 6 + i * 6, y = 18; ink(x, y, RP.cinza, 1); ink(x, y + 1, RP.cinza, 1); ink(x, y + 2, RP.cinza, 1); ink(x - 1, y + 3, RP.cinza, 1); ink(x + 1, y + 3, RP.cinza, 1); P.line(x + 1, y - 2, x + 3, y + 2, RP.cinza, 1); }
  for (const [x, y] of [[3, 3], [33, 4]]) P.ell(x, y, 1.6, 2, (xx, yy) => ink(xx, yy, RP.ocre, 2));
  return P.done(false);
}
// o totem de crânio de nascido: um crânio de ciclope num pau de osso, penas e dentes pendurados
function totem(k) {
  const W = 18, H = 44, P = painter(W, H), s = 28451 + k;
  longBone(P, [9, 43], [9, 14], 2.4, RP.osso, s);
  P.ell(9, 8, 7.5, 7, (x, y, dx, dy, d) => P.put(x, y, RP.marfim, 3.3 - dx - dy - d * 0.6 + cg(x, y, s) * 0.3));
  P.ell(9, 7, 2.6, 2.4, (x, y) => P.put(x, y, RP.osso, 0.2));
  for (let x = 5; x < 14; x += 2) P.put(x, 14, RP.esmalte, 4);
  for (const x of [3, 15]) { P.line(x, 14, x, 22, RP.tendao, 2.4); P.line(x, 22, x, 26, RP.pena, 2.4); }
  if (k) P.rect(6, 28, 7, 3, RP.ocre, (i, j) => 2.6 + j * 0.2);
  return P.done();
}
// a pilha de capacetes humanos: elmos de ferro pequenos amontoados (escala)
function helmPile(k) {
  const W = 30, H = 15, P = painter(W, H), s = 28461 + k;
  const helm = (cx, cy, r, R) => { P.ell(cx, cy, r, r * 0.9, (x, y, dx, dy, d) => { if (dy < 0.35) P.put(x, y, R, 3.2 - dx - dy - d * 0.6 + cg(x, y, s) * 0.4); }); P.line(cx - r, cy + r * 0.35, cx + r, cy + r * 0.35, R, 1.4); };
  const L = k ? [[6, 11, 4.5], [14, 12, 4.2], [22, 11, 4.6], [10, 7, 4], [18, 6, 4.2]] : [[7, 11, 4.6], [16, 12, 4.4], [24, 12, 4], [12, 7, 4.2]];
  L.forEach(([x, y, r], i) => helm(x, y, r, i % 3 === 1 ? RP.bronze : RP.ferro));
  return P.done();
}
// a teia de tendões secos: fios de tendão esticados do teto, cruzando, com nós
function tendonWeb(k) {
  const W = 38, H = 26, P = painter(W, H), s = 28471 + k;
  const pts = [[2, 0], [12, 0], [24, 0], [36, 0], [6, 12], [18, 16], [30, 11], [12, 24], [26, 22]];
  const links = [[0, 4], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [4, 5], [5, 6], [4, 7], [5, 7], [5, 8], [6, 8]];
  for (const [a, b] of links) { if (k && hash2(a, b, s) < 0.2) continue; const A = pts[a], B = pts[b]; tube(P, bez(A, [A[0], A[1] + 3], [B[0], B[1] - 3], B), () => 1.2, RP.tendao, s + a); }
  for (const [x, y] of pts.slice(4)) P.blob(x, y, 1.6, 1.4, RP.tendao, s, 2.8);
  return P.done();
}

/* =============================== o Leito do Último =============================== */
// a lâmina da foice de Cronos: uma meia-lua de adamantita do tamanho de uma casa, enterrada pela ponta, o fio frio
function scytheBlade() {
  const W = 240, H = 144, P = painter(W, H), s = 28501;
  const pts = [], edge = [];
  // a meia-lua: entre dois círculos, a ponta enterrada à esquerda embaixo
  const ax = 150, ay = 150, ra = 138, bx = 170, by = 178, rb = 128;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const da = Math.hypot(x + 0.5 - ax, y + 0.5 - ay), db = Math.hypot(x + 0.5 - bx, y + 0.5 - by);
    if (da > ra || db < rb || x > 214 || y > H - 1) continue;
    const t = (ra - da) / 30, fio = db - rb;
    let v = 3 - t * 0.6 + (x < 120 ? 0.3 : -0.2) + Math.sin(x * 0.05 + y * 0.03) * 0.3;
    if (da > ra - 2.5) v = 4.6;
    if (fio < 2.2) { edge.push([x, y]); continue; }
    if (fio < 5) v = 4.2;
    pts.push([x, y, v]);
  }
  adaBlade(P, pts, s, edge);
  // o talão e a ponta de prender no cabo (direita), com rebites de bronze
  P.rect(206, 26, 22, 30, RP.bronze, (i, j) => 2.6 + (i === 0 ? 0.8 : 0) - j * 0.02 + cg(206 + i, 26 + j, s) * 0.4);
  for (const [x, y] of [[211, 32], [222, 32], [211, 48], [222, 48]]) P.ell(x, y, 2, 2, (xx, yy, dx, dy) => P.put(xx, yy, RP.bronze, 4 - dx - dy));
  stain(P, RP.azinhavre, 0.2, s + 2, null, 0.2, [RP.bronze]);
  // marcas: os entalhes de batalha e as rachaduras
  cracks(P, 10, s + 3, [RP.ada]);
  for (let i = 0; i < 6; i++) { const x = 30 + i * 30, y = 60 + Math.sin(i) * 20; P.mark('brilho', x, y); }
  // o pó que subiu pela lâmina perto do chão
  for (let x = 0; x < W; x++) for (let y = H - 10; y < H; y++) if (P.has(x, y) && !P.isN(x, y) && hash2(x, y, s) < (y - H + 10) / 10) P.put(x, y, RP.po, 2.4 + cg(x, y, s));
  return P.done();
}
// o cabo da foice quebrado: um tronco de madeira-de-titã petrificada com anéis de bronze, partido em lascas
function scytheHandle(k) {
  const W = 64, H = 15, P = painter(W, H), s = 28511 + k;
  tube(P, lin([2, 8], [60, 7]), () => 11, RP.esponja, s, 2.6);
  for (const x of [12, 30, 48]) P.rect(x, 1, 3, 13, RP.bronze, (i, j) => 2.8 + (i === 0 ? 0.8 : 0) - Math.abs(j - 6) * 0.15);
  for (let y = 0; y < H; y++) { const cut = k ? 56 + Math.abs(Math.sin(y * 1.7)) * 6 : 54 + Math.abs(Math.sin(y * 1.3)) * 8; for (let x = Math.round(cut); x < W; x++) P.clear(x, y); }
  stain(P, RP.azinhavre, 0.1, s + 2, null, 0.2, [RP.bronze]);
  return P.done();
}
// a corrente de bronze presa num grilhão gigante: o aro do grilhão aberto no chão e os elos saindo
function shackle(k) {
  const W = 40, H = 24, P = painter(W, H), s = 28521 + k;
  P.ell(12, 14, 11, 9.5, (x, y, dx, dy, d) => { if (d > 0.42) P.put(x, y, RP.bronze, 3 - dx - dy + cg(x, y, s) * 0.4); });
  P.rect(8, 21, 9, 3, RP.ferro, (i, j) => 2.6 - j * 0.4);
  for (let i = 0; i < 4; i++) { const x = 24 + i * 4; if (i % 2 === 0) P.ell(x, 20, 2.6, 2.2, (xx, yy, dx, dy, d) => { if (d > 0.3) P.put(xx, yy, RP.bronze, 3 - dx - dy); }); else P.rect(x - 1, 19, 3, 2, RP.bronze, () => 2.8); }
  stain(P, RP.azinhavre, 0.15, s + 2, null, 0.2);
  return P.done();
}
// o coração de pedra rachado: um coração de titã virado pedra, as câmaras e as veias grossas, a racha no meio
function stoneHeart(k) {
  const W = 32, H = 30, P = painter(W, H), s = 28531 + k;
  P.ell(15, 17, 12, 12, (x, y, dx, dy, d) => P.put(x, y, RP.pedraC, 3 - dx * 1.1 - dy * 0.9 - d * 0.5 + cn(x, y, 7, 7, s) * 0.6));
  P.ell(20, 9, 6, 6, (x, y, dx, dy, d) => P.put(x, y, RP.pedraC, 3.2 - dx - dy - d * 0.5));
  tube(P, bez([12, 6], [11, 2], [8, 1], [5, 2]), t => 4 - t * 1.4, RP.pedraC, s + 1, 2.6);
  tube(P, bez([22, 4], [23, 1], [27, 0], [30, 2]), t => 3.6 - t * 1.4, RP.pedraC, s + 2, 2.4);
  for (let y = 4; y < 29; y++) { const x = 15 + Math.round(Math.sin(y * 0.7) * 1.5); P.put(x, y, RP.pedraC, 0.2); if (k) P.put(x + 1, y, RP.pedraC, 0.6); }
  cracks(P, 4, s + 3);
  return P.done();
}
// a ampulheta de bronze tombada: a armação de bronze deitada, o vidro rachado, a areia escorrida no chão
function hourglass(k) {
  const W = 42, H = 24, P = painter(W, H), s = 28541 + k;
  for (const x of [2, 38]) P.rect(x, 2, 3, 20, RP.bronze, (i, j) => 2.8 + (i === 0 ? 0.8 : -0.4) + (j % 5 === 0 ? 0.6 : 0));
  for (const y of [3, 19]) P.rect(4, y, 34, 2, RP.bronze, (i, j) => 2.6 - j * 0.4);
  for (let x = 5; x < 38; x++) { const u = Math.abs(x - 21) / 16, hw = 1 + u * u * 7; for (let y = Math.round(11 - hw); y <= 11 + hw; y++) if (y > 4 && y < 19) P.put(x, y, RP.vidro, 2 + (y < 11 ? 1 : 0) + (Math.abs(y - 11 + hw) < 1 ? 1.5 : 0)); }
  for (let x = 6; x < 20; x++) for (let y = 14; y < 18; y++) if (y > 18 - (x - 6) * 0.35) P.put(x, y, RP.areia, 3 + cg(x, y, s));
  for (let x = 24; x < 41; x++) if (hash2(x, 0, s) < 0.7) P.put(x, 23, RP.areia, 3);
  stain(P, RP.azinhavre, 0.12, s + 2, null, 0.2, [RP.bronze]);
  if (k) cracks(P, 3, s + 3, [RP.vidro]);
  return P.done();
}
// as lascas da foice em leque: cacos de adamantita cravados na parede, abertos como um leque, o fio frio
function shardFan(k) {
  const W = 44, H = 32, P = painter(W, H), s = 28551 + k;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.15 + i * 0.14), L = 14 + hash2(i, 0, s) * 12, bx = 22 + Math.cos(a) * 3, by = 31, tx = 22 + Math.cos(a) * L * 1.2, ty = 31 - Math.sin(a) * L;
    const pts = [], edge = [];
    for (let j = 0; j <= 40; j++) { const t = j / 40, x = bx + (tx - bx) * t, y = by + (ty - by) * t, wd = (1 - t) * 3.2 + 0.5; for (let o = -wd; o <= wd; o += 0.5) { const X = x - Math.sin(a) * o, Y = y - Math.cos(a) * o; if (o > wd - 0.8) edge.push([X | 0, Y | 0]); else pts.push([X | 0, Y | 0, 2.8 + (o < 0 ? 0.6 : -0.3)]); } }
    adaBlade(P, pts, s + i, edge);
    P.mark('brilho', tx, ty + 1);
  }
  return P.done();
}
// o osso com marcas de corte: um úmero de titã deitado, os talhos fundos e limpos da foice
function cutBone(k) {
  const W = 46, H = 15, P = painter(W, H), s = 28561 + k;
  longBone(P, [6, 8], [40, 8], 9, RP.osso, s, 2.8);
  for (const x of k ? [14, 22, 30] : [18, 27]) for (let y = 2; y < 13; y++) { if (!P.has(x, y)) continue; P.put(x, y, RP.osso, 0.4); P.put(x + 1, y, RP.osso, 4.6); }
  for (let y = 0; y < H; y++) { const cut = k ? 0 : 3; for (let x = 0; x < cut; x++) P.clear(x, y); }
  dust(P, 0.05, s + 2);
  return P.done();
}

/* =============================== registro =============================== */
// assa os pixels de luz pura de cada variação (fio frio, brasa) para o drawGlow
function bakeLuz(P) {
  let any = false; for (let k = 0; k < P.w * P.h; k++) if (P.rid[k] === -2) { any = true; break; }
  if (!any) return null;
  const nv = mk(P.w, P.h), nx = nv.getContext('2d'), im = nx.createImageData(P.w, P.h), d32 = new Uint32Array(im.data.buffer);
  for (let k = 0; k < P.w * P.h; k++) if (P.rid[k] === -2) d32[k] = P.c[k];
  nx.putImageData(im, 0, 0);
  return nv;
}
const toCv = P => { const cv = mk(P.w, P.h), x = cv.getContext('2d'), img = x.createImageData(P.w, P.h); new Uint32Array(img.data.buffer).set(P.c); x.putImageData(img, 0, 0); return cv; };
const F = 'chao', C = 'teto', Wl = 'parede';
const def = (id, nome, apoio, camada, faixas, Ps, extra) => {
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), titas: true, ttLuz: Ps.map(bakeLuz), ttPts: Ps.map(P => P.pts) }, extra || {}));
};
// o Campo das Costelas
def('tt_monte_cinza', 'Monte de cinza com ossos', F, 'frente', ['costelas'], [ashMound(0), ashMound(1)]);
def('tt_dente_solto', 'Dente solto de titã', F, 'frente', ['costelas', 'cranios'], [looseTooth(0), looseTooth(1)]);
def('tt_acampamento', 'Acampamento de catador', F, 'frente', ['costelas', 'espinha'], [scavCamp(0), scavCamp(1)], { campo: true, luz: [{ x: 38, y: 19, r: 0.95 }], brilho: TT_COL.tutano, ttAnim: 'fogo' });
def('tt_varal', 'Varal de ossinhos', C, 'frente', ['costelas'], [boneLine(0), boneLine(1)]);
def('tt_pele_seca', 'Pele seca esticada', Wl, 'fundo', ['costelas'], [hide(0), hide(1)], { caixa: true });
def('tt_pegadas', 'Pegadas gigantes no pó', Wl, 'fundo', ['costelas', 'espinha'], [footprints(0), footprints(1)]);
def('tt_cranio_bicho', 'Crânio de bicho ao lado de um dedo de titã', F, 'frente', ['costelas'], [scaleSkull(0), scaleSkull(1)]);
// a Espinha
def('tt_apofise', 'Apófise quebrada', F, 'frente', ['espinha'], [process_(0), process_(1)]);
def('tt_corrente', 'Corrente de bronze partida', C, 'frente', ['espinha', 'leito'], [bronzeChain(0), bronzeChain(1)]);
def('tt_lanca', 'Cabeça de lança de titã', F, 'frente', ['espinha'], [titanSpear(0), titanSpear(1)]);
def('tt_disco', 'Disco de cartilagem caído', F, 'frente', ['espinha'], [disc(0), disc(1)]);
def('tt_ninho', 'Ninho de abutre', C, 'frente', ['espinha', 'costelas'], [vultureNest(0), vultureNest(1)], { canion: true });
def('tt_bandeira', 'Bandeira de bronze rasgada', Wl, 'fundo', ['espinha'], [bronzeBanner(0), bronzeBanner(1)]);
// o Vale dos Crânios
def('tt_olho_cristal', 'Olho de cristal opaco', F, 'frente', ['cranios'], [crystalEye(0), crystalEye(1)], { luz: [{ x: 11, y: 8, r: 0.18 }], brilho: TT_COL.frio, ttAnim: 'frio' });
def('tt_cocar', 'Cocar de bronze', F, 'frente', ['cranios'], [crest(0), crest(1)]);
def('tt_dente_quebrado', 'Dente quebrado', F, 'frente', ['cranios'], [brokenTooth(0), brokenTooth(1)]);
def('tt_elmo_ciclope', 'Elmo de ciclope', F, 'frente', ['cranios', 'leito'], [cyclopsHelm(0), cyclopsHelm(1)]);
def('tt_pintura', 'Pintura de catador na parede de osso', Wl, 'fundo', ['cranios'], [painting(0), painting(1)], { cranio: true });
def('tt_totem', 'Totem de crânio de nascido', F, 'frente', ['cranios', 'costelas'], [totem(0), totem(1)]);
def('tt_capacetes', 'Pilha de capacetes humanos', F, 'frente', ['cranios'], [helmPile(0), helmPile(1)]);
def('tt_teia_tendoes', 'Teia de tendões secos', C, 'frente', ['cranios', 'leito'], [tendonWeb(0), tendonWeb(1)]);
// o Leito do Último
def('tt_foice', 'Lâmina da foice de Cronos', Wl, 'fundo', ['leito'], [scytheBlade()], { luz: [{ x: 60, y: 40, r: 0.5 }, { x: 150, y: 20, r: 0.4 }], brilho: TT_COL.foice, ttAnim: 'frio' });
def('tt_cabo_foice', 'Cabo da foice quebrado', F, 'frente', ['leito'], [scytheHandle(0), scytheHandle(1)]);
def('tt_grilhao', 'Corrente presa num grilhão gigante', F, 'frente', ['leito'], [shackle(0), shackle(1)]);
def('tt_coracao', 'Coração de pedra rachado', F, 'frente', ['leito'], [stoneHeart(0), stoneHeart(1)]);
def('tt_ampulheta', 'Ampulheta de bronze tombada', F, 'frente', ['leito'], [hourglass(0), hourglass(1)]);
def('tt_lascas_leque', 'Lascas da foice em leque', Wl, 'fundo', ['leito', 'cranios'], [shardFan(0), shardFan(1)], { luz: [{ x: 22, y: 14, r: 0.3 }], brilho: TT_COL.foice, ttAnim: 'frio' });
def('tt_osso_cortes', 'Osso com marcas de corte', F, 'frente', ['leito', 'cranios'], [cutBone(0), cutBone(1)]);

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(TT_PROP_PLAN, {
  costelas: { chao: [['tt_acampamento', 3, 1], ['tt_monte_cinza', 0.12, 1], ['tt_dente_solto', 0.06, 1], ['tt_cranio_bicho', 0.06, 1], ['tt_totem', 0.03, 1]], teto: [['tt_varal', 0.1, 1], ['tt_ninho', 0.03, 1]], fundo: [['tt_pele_seca', 0.12, 1], ['tt_pegadas', 0.06, 1]] },
  espinha: { chao: [['tt_acampamento', 3, 1], ['tt_apofise', 0.08, 1], ['tt_lanca', 0.06, 1], ['tt_disco', 0.08, 1]], teto: [['tt_ninho', 0.3, 1], ['tt_corrente', 0.1, 1]], fundo: [['tt_bandeira', 0.08, 1], ['tt_pegadas', 0.04, 1]] },
  cranios: { chao: [['tt_olho_cristal', 0.05, 1], ['tt_cocar', 0.06, 1], ['tt_dente_quebrado', 0.1, 1], ['tt_elmo_ciclope', 0.05, 1], ['tt_totem', 0.06, 1], ['tt_capacetes', 0.06, 1], ['tt_dente_solto', 0.04, 1], ['tt_osso_cortes', 0.03, 1]], teto: [['tt_teia_tendoes', 0.12, 1]], fundo: [['tt_pintura', 0.3, 1], ['tt_lascas_leque', 0.03, 1]] },
  leito: { chao: [['tt_cabo_foice', 0.05, 1], ['tt_grilhao', 0.07, 1], ['tt_coracao', 0.1, 1], ['tt_ampulheta', 0.05, 1], ['tt_osso_cortes', 0.08, 1], ['tt_elmo_ciclope', 0.03, 1]], teto: [['tt_corrente', 0.1, 1], ['tt_teia_tendoes', 0.06, 1]], fundo: [['tt_foice', 0.05, 1], ['tt_lascas_leque', 0.1, 1]] }
});

/* ---------- a luz: o fio frio da adamantita e a brasa do tutano somados por cima; o fogo de tutano ao vivo ---------- */
const ttPt = (p, nm) => { const P = p.def.ttPts && p.def.ttPts[p.v]; return P && P[nm] ? P[nm] : null; };
const FL = ['#c89a50', '#f0d890', '#fff0b0', '#fffbe8'];
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.titas) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), nv = p.def.ttLuz[p.v];
    if (nv) { lc.globalAlpha = 0.35 + 0.12 * Math.sin(gameTime * 1.1 + p.X * 0.03); lc.drawImage(nv, X, Y); }
    if (p.def.ttAnim === 'fogo') { const Fq = ttPt(p, 'fogo'); if (Fq) { const q = Fq[0]; lc.globalAlpha = 0.5 + 0.1 * Math.sin(gameTime * 9 + p.X); lc.drawImage(TTART.ttGlow('fogo16', 16, TT_COL.tutano), X + q.x + 3 - 16, Y + q.y - 18); } }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.titas || !p.def.ttAnim) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    if (p.def.ttAnim === 'fogo') {   // o fogo de tutano: chamas baixas amarelo-pálidas, quase sem fumaça
      const Fq = ttPt(p, 'fogo'); if (!Fq) continue; const q = Fq[0], T0 = Math.floor(gameTime * 9);
      for (let c = 0; c < q.w; c++) {
        const env = Math.sin(Math.PI * (c + 0.5) / q.w), h = Math.round(env * (3 + (Math.sin(gameTime * 8 + c * 1.9 + p.X) + 1) * 1.6 + hash2(c, T0, p.X) * 2));
        for (let j = 0; j < h; j++) { const t = j / Math.max(1, h); lc.globalAlpha = t > 0.8 ? 0.6 : 1; lc.fillStyle = t < 0.25 && env > 0.6 ? FL[3] : t < 0.55 ? FL[2] : t < 0.8 ? FL[1] : FL[0]; lc.fillRect(X + q.x + c, Y + q.y - j, 1, 1); }
      }
    }
    const St = ttPt(p, 'brilho'); if (St) for (let j = 0; j < St.length; j++) {   // o fio frio cintila de vez em quando
      const b = Math.sin(gameTime * (0.9 + hash2(j, p.X, 3) * 1.4) + j * 2.3 + p.X); if (b < 0.8) continue;
      lc.globalAlpha = (b - 0.8) * 5; lc.fillStyle = '#ffffff'; lc.fillRect(X + St[j].x - 1, Y + St[j].y, 3, 1); lc.fillRect(X + St[j].x, Y + St[j].y - 1, 1, 3);
    }
  }
  lc.globalAlpha = 1;
});
}
