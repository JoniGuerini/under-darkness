'use strict';

/* ================= o Brejo das Bruxas: objetos de cena =================
   Tudo o que é maior que um bloco e veste o Brejo (docs/camadas/06-brejo-bruxas.md, seção 5): 19 objetos.
   Na Turfeira: o corpo de turfa (um morto de mil anos meio saído da terra, a pele de couro, a corda no pescoço), o
   toco de árvore afogada com as raízes, o tronco morto em pé (fundo), a touceira grande de taboa.
   Nas Palafitas: o caldeirãozinho no tripé com o fogo de lenha (a luz laranja), o varal de trapos e ervas, os maços
   de ervas secando, a gaiola de corvo pendurada, o barril podre amarrado, o espantalho de gravetos.
   No Patíbulo: a forca com o laço, a gaiola de enforcado com o esqueleto, a fogueira apagada com a estaca queimada,
   o pelourinho, a tábua com a marca dos caçadores pregada na parede (fundo).
   No Círculo: a pedra em pé pequena com a espiral, as marcas de bruxa riscadas na parede (fundo), o monte de crânios
   com as velas pretas acesas, os bonecos de graveto pendurados.
   O pintor do 282 (rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, grão). Luz só onde há
   motivo: o fogo do caldeirãozinho, as velas pretas, a brasa que sobrou na fogueira.
   Registrados com defProp (`brejo: true`), postos pelo 375 a partir do BJ_PROP_PLAN. */
const BJ_PROP_PLAN = {};
const BJ_BACK_FLOOR = { bj_tronco: 1 };
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  pele: ['#1a0e08', '#2c180c', '#422614', '#5a361e', '#72482a', '#8c5c38'],     // a pele curtida do corpo de turfa
  turfa: ['#120c08', '#1e140c', '#2c1e12', '#3e2c1a', '#544028', '#6c5638'],
  pau: ['#140c06', '#24180c', '#382614', '#4e3820', '#664c2e', '#80623e'],
  morto: ['#16140f', '#24211a', '#353026', '#484234', '#5e5644', '#766c56'],    // madeira morta, cinza de seca
  corda: ['#1e160c', '#342614', '#4e3c20', '#6a5430', '#866e42', '#a28a58'],
  junco: ['#141a0c', '#222c12', '#34421a', '#4a5a24', '#647430', '#80903e'],
  taboa: ['#1a0e08', '#2c180c', '#422412', '#5a321a', '#724224', '#8c5430'],
  ferro: ['#121214', '#1e1e22', '#2e2e34', '#424248', '#5a5a62', '#76767e'],
  ferrugem: ['#1e0e06', '#34180a', '#4e2610', '#6c3818', '#8c4e24', '#ac6a36'],
  osso: ['#2a261e', '#4a4436', '#6e6652', '#968c74', '#bcb296', '#ddd4ba'],
  pano: ['#16120e', '#262019', '#383026', '#4c4234', '#625644', '#7a6c56'],
  trapo: ['#1a1014', '#2a1a20', '#3e2830', '#523842', '#684a54', '#7e5e68'],
  erva: ['#161c0e', '#242e16', '#34421e', '#48582a', '#5e6e38', '#788848'],
  carvao: ['#060606', '#0e0d0c', '#181614', '#24201c', '#302a24', '#3e362e'],
  menir: ['#1a1c1c', '#2a2e2c', '#3c403c', '#525650', '#6a6e66', '#868a80'],
  liquen: ['#2a3022', '#3a4230', '#566044', '#727e58', '#909c6c', '#b0ba84'],
  vela: ['#060606', '#0e0e10', '#18181c', '#242428', '#323238', '#44444c'],
  cera: ['#3a3628', '#5a5440', '#7c745a', '#9e9476', '#c0b694', '#dcd4b4'],
  barro: ['#1c140e', '#2c2018', '#3e2e22', '#52402e', '#68523c', '#806a4e'],
  pena: ['#08080a', '#101014', '#1a1a20', '#26262e', '#34343e', '#46465a'],
  po: ['#1c1610', '#2a2218', '#3a3022', '#4c402e', '#5e503a', '#726448']   // o lodo seco assentado
};
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#050403');
const FOGO = { miolo: '#fff6dc', claro: '#ffd890', luz: '#f0a050', fundo: '#b85a20' };
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

// madeira: um pau reto com o veio ao comprido
function stick(P, a, b, wd, R, s, base = 2.8) {
  tube(P, lin(a, b), () => wd, R, s, base);
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
  for (let i = 2; i < n - 1; i += 3) if (hash2(i, 0, s) < 0.4) { const t = i / n; P.put(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, R, base - 1); }
}
// a chama de lenha marcada para o desenho ao vivo
const fireMark = (P, x, y, w) => P.mark('fogo', x, y, { w });

/* =============================== a Turfeira =============================== */
// o corpo de turfa: o tronco curtido saindo da terra de lado, o braço seco, a cara afundada, a corda no pescoço
function bogBody(k) {
  const W = 40, H = 16, P = painter(W, H), s = 37801 + k;
  for (let x = 0; x < W; x++) { const top = Math.round(11 + Math.sin(x * 0.3 + k) * 1.2); for (let y = top; y < H; y++) P.put(x, y, RP.turfa, 2.4 + (y === top ? 1.2 : 0) + cg(x, y, s) * 0.6); }
  // o tronco deitado, a pele de couro esticada nas costelas
  P.ell(18, 10, 10, 3.6, (x, y, dx, dy, d) => { if (y < 13) P.put(x, y, RP.pele, 3 - dy * 1.3 - dx * 0.4 - d * 0.5 + (Math.sin(x * 1.6) > 0.6 ? -0.8 : 0) + cg(x, y, s) * 0.3); });
  // a cabeça: o crânio afundado, a boca aberta, o cabelo ruivo (a turfa deixa o cabelo vermelho)
  P.ell(31, 9, 3.6, 3.2, (x, y, dx, dy, d) => P.put(x, y, RP.pele, 3.2 - dy - dx * 0.8 - d * 0.6));
  P.put(32, 9, RP.pele, 0.4); P.put(30, 8, RP.pele, 0.6); P.put(32, 11, RP.pele, 0.3); P.put(33, 11, RP.pele, 0.6);
  for (let x = 28; x < 35; x++) for (let y = 5; y < 8; y++) if (hash2(x, y, s) < 0.6 && y < 6 + Math.abs(x - 31) * 0.3) P.put(x, y, RP.ferrugem, 3.4 + cg(x, y, s));
  // a corda no pescoço, com a ponta solta
  for (let y = 8; y < 12; y++) P.put(27, y, RP.corda, 4 - (y - 8) * 0.4);
  for (let x = 23; x < 27; x++) P.put(x, 12 + ((x & 1)), RP.corda, 3);
  // o braço seco dobrado, os dedos compridos
  tube(P, bez([12, 9], [10, 4], [6, 2], [4, 4]), t => 2.2 - t * 0.9, RP.pele, s + 2, 3);
  for (let i = 0; i < 3; i++) P.line(4, 4, 1 + i, 7 + i * 0.6, RP.pele, 2.8 - i * 0.4);
  if (k) tube(P, bez([10, 11], [8, 12], [5, 12], [2, 12]), () => 1.6, RP.pele, s + 3, 2.4);   // as pernas afundando
  for (let x = 6; x < 34; x++) if (hash2(x, 9, s) < 0.35) P.put(x, 12 + (hash2(x, 3, s) * 2 | 0), RP.turfa, 4);   // a turfa por cima
  return P.done();
}
// o toco afogado: tronco quebrado com as raízes de fora em arco, a casca solta
function stump(k) {
  const W = k ? 34 : 28, H = k ? 26 : 22, P = painter(W, H), s = 37811 + k, cx = W / 2;
  for (let y = 4; y < H - 4; y++) { const hw = 4 + (y > H - 10 ? (y - H + 10) * 0.5 : 0); for (let x = Math.round(cx - hw); x <= cx + hw; x++) P.put(x, y, RP.morto, 3 - (x - cx) / hw * 1.4 + Math.sin(x * 1.3) * 0.3 + cg(x, y, s) * 0.3); }
  for (let x = Math.round(cx - 4); x <= cx + 4; x++) { const t = 4 - ((hash2(x, 0, s) * 4) | 0); for (let y = t; y < 5; y++) P.put(x, y, RP.morto, 4.2 - (y - t) * 0.4); }   // a quebra lascada
  for (const d of [-1, 1]) for (let r = 0; r < 3; r++) { const x0 = cx + d * (2 + r * 1.5); tube(P, bez([x0, H - 7], [x0 + d * (4 + r * 3), H - 9 + r], [x0 + d * (7 + r * 4), H - 4], [x0 + d * (8 + r * 5), H]), t => 2.6 - t * 1.4, RP.pau, s + r * 3 + d, 2.6); }
  for (let y = 7; y < H - 6; y += 3) if (hash2(y, 0, s) < 0.7) P.put(cx - 1 + (y % 2), y, RP.morto, 0.6);
  if (k) for (let x = 0; x < W; x++) if (hash2(x, 4, s) < 0.4) P.put(x, H - 1, RP.erva, 3);
  stain(P, RP.erva, 0.1, s + 5, (x, y) => P.has(x, y - 1) ? 0 : 0.4, 0, [RP.morto, RP.pau]);
  return P.done();
}
// o tronco morto em pé (fundo): alto, fino, galhos quebrados tortos, a barba-de-velho pendurada
function deadTree(k) {
  const W = 40, H = 84, P = painter(W, H), s = 37821 + k, cx = 20 + (k ? 3 : -2);
  for (let y = 0; y < H; y++) { const hw = 2 + y / H * 3.4, x0 = cx + Math.sin(y * 0.05 + k) * 2; for (let x = Math.floor(x0 - hw); x <= x0 + hw; x++) P.put(x, y, RP.morto, 2.6 - (x - x0) / hw * 1.2 + cg(x, y, s) * 0.3 + (Math.sin(y * 0.6 + x) > 0.85 ? -0.8 : 0)); }
  const br = k ? [[20, -1], [34, 1], [50, -1]] : [[14, 1], [30, -1], [44, 1], [58, -1]];
  for (const [y, d] of br) { const x0 = cx + Math.sin(y * 0.05 + k) * 2, L = 10 + hash2(y, 0, s) * 8; tube(P, bez([x0, y], [x0 + d * L * 0.4, y - 3], [x0 + d * L * 0.8, y - 8], [x0 + d * L, y - 12]), t => 2.2 - t * 1.4, RP.morto, s + y, 2.4);
    for (let i = 0; i < 6; i++) { const t = 0.3 + i * 0.1, xx = x0 + d * L * t, yy = y - 12 * t * t; const n = 3 + ((hash2(i, y, s) * 7) | 0); for (let j = 0; j < n; j++) P.put(xx + Math.sin(j * 0.9) * 0.6, yy + 1 + j, RP.liquen, 2.6 - j * 0.25); } }
  return P.done();
}
// a touceira grande de taboa: as folhas compridas em leque e as espigas marrons
function bigReeds(k) {
  const W = 26, H = 30, P = painter(W, H), s = 37831 + k;
  for (let i = 0; i < 16; i++) {
    const x0 = 6 + i * 0.9, a = (i - 7.5) * 0.06 + (hash2(i, 0, s) - 0.5) * 0.15, L = 16 + hash2(i, 1, s) * 12;
    for (let j = 0; j < L; j++) { const t = j / L, x = x0 + Math.sin(a) * j + (t > 0.7 ? (t - 0.7) * 6 * Math.sign(a) : 0), y = H - 1 - j; P.put(x, y, RP.junco, 2.4 + t * 1.8 + (i % 3 === 0 ? 0.6 : 0) + cg(x, y, s) * 0.4); }
    if (i % 4 === 1) { const x = x0 + Math.sin(a) * (L - 4), y = H - L; for (let j = 0; j < 5; j++) { P.put(x, y + j, RP.taboa, 4 - j * 0.4); P.put(x + 1, y + j, RP.taboa, 2.6); } }
  }
  return P.done();
}

/* =============================== as Palafitas =============================== */
// o caldeirãozinho no tripé: o tripé de paus amarrados, a corrente, a panela de ferro preto, o fogo de lenha embaixo
function smallCauldron(k) {
  const W = 26, H = 28, P = painter(W, H), s = 37841 + k;
  stick(P, [3, 27], [13, 1], 1.6, RP.pau, s); stick(P, [23, 27], [13, 1], 1.6, RP.pau, s + 1); if (k) stick(P, [16, 27], [13, 1], 1.4, RP.pau, s + 2);
  for (let x = 11; x <= 15; x++) P.put(x, 2, RP.corda, 4);
  for (let y = 3; y < 12; y++) P.put(13, y, RP.ferro, y % 2 ? 3.6 : 2.4);   // a corrente
  P.ell(13, 15, 6.4, 4.4, (x, y, dx, dy, d) => { if (dy > -0.5) P.put(x, y, RP.ferro, 2.6 - dx * 0.9 - dy * 0.6 - d * 0.6 + cg(x, y, s) * 0.3); });
  for (let x = 7; x <= 19; x++) P.put(x, 12, RP.ferro, 4 - Math.abs(x - 13) * 0.15);   // a boca
  for (let x = 8; x <= 18; x++) P.put(x, 13, RP.erva, 2.8 + Math.sin(x * 1.3) * 0.6);   // o caldo verde-escuro
  P.line(11, 22, 9, 26, RP.carvao, 1.6, 2); P.line(15, 22, 17, 26, RP.carvao, 1.4, 2);
  for (let x = 6; x < 21; x++) P.put(x, 27, RP.carvao, 2 + hash2(x, 0, s) * 1.4);
  for (let x = 9; x < 18; x++) if (hash2(x, 1, s) < 0.6) P.N(x, 26, hash2(x, 2, s) < 0.4 ? FOGO.claro : FOGO.luz);   // a brasa
  fireMark(P, 9, 25, 9);
  return P.done();
}
// o varal: a corda bamba de ponta a ponta com trapos, uma camisola, um maço de ervas, uma pele de sapo
function clothesLine(k) {
  const W = k ? 50 : 40, H = 18, P = painter(W, H), s = 37851 + k, sag = t => 1 + Math.sin(t * Math.PI) * 4;
  for (let x = 0; x < W; x++) P.put(x, sag(x / W), RP.corda, 3 + cg(x, 0, s) * 0.4);
  for (let x = 4; x < W - 4; x += 7 + ((hash2(x, 0, s) * 3) | 0)) {
    const y0 = Math.round(sag(x / W)) + 1, q = hash2(x, 1, s), w = 4 + ((hash2(x, 2, s) * 3) | 0), L = 6 + ((hash2(x, 3, s) * 8) | 0);
    if (q < 0.5) for (let j = 0; j < L; j++) for (let i = 0; i < w; i++) { if (j > L - 3 && hash2(i, j, s + x) < 0.5) continue; P.put(x - (w >> 1) + i, y0 + j, q < 0.25 ? RP.trapo : RP.pano, 3.2 - i / w * 1.4 + (j === 0 ? 0.6 : 0) + Math.sin(i * 2) * 0.3); }
    else if (q < 0.8) for (let j = 0; j < 7; j++) for (let i = -1; i <= 1; i++) P.put(x + i + (j > 3 ? Math.sin(j) * 0.6 : 0), y0 + j, RP.erva, 3.4 - i * 0.6 - j * 0.15 + cg(x + i, j, s) * 0.6);
    else { P.ell(x, y0 + 4, 2.4, 3.6, (xx, yy, dx, dy) => P.put(xx, yy, RP.pele, 3 - dx - dy)); P.put(x - 2, y0 + 8, RP.pele, 2.4); P.put(x + 2, y0 + 8, RP.pele, 2.4); }
  }
  return P.done();
}
// os maços de ervas secando: amarrados de cabeça para baixo num pau atravessado
function herbBundles(k) {
  const W = 30, H = 16, P = painter(W, H), s = 37861 + k;
  stick(P, [0, 2], [W - 1, 2], 1.6, RP.pau, s);
  for (let x = 3; x < W - 2; x += 5) {
    P.put(x, 3, RP.corda, 4); P.put(x, 4, RP.corda, 3);
    const R = hash2(x, 0, s) < 0.6 ? RP.erva : hash2(x, 1, s) < 0.5 ? RP.taboa : RP.morto, L = 7 + ((hash2(x, 2, s) * 5) | 0);
    for (let j = 0; j < L; j++) { const hw = 0.6 + j / L * 2; for (let i = -hw; i <= hw; i += 1) P.put(x + i, 5 + j, R, 3.2 - i * 0.5 + Math.sin(j * 2 + i) * 0.5); }
  }
  return P.done();
}
// a gaiola de corvo: a gaiola de vime pendurada, um corvo preto dentro
function crowCage(k) {
  const W = 14, H = 24, P = painter(W, H), s = 37871 + k;
  for (let y = 0; y < 6; y++) P.put(7, y, RP.corda, 3.6);
  P.ell(7, 7, 5, 2, (x, y, dx, dy) => { if (dy < 0.3) P.put(x, y, RP.pau, 3.4 - dx - dy); });
  for (const x of [2, 4.5, 7, 9.5, 12]) for (let y = 7; y < 21; y++) P.put(x, y, RP.pau, 3 - Math.abs(x - 7) * 0.2 + (y % 4 === 0 ? 0.6 : 0));
  for (let x = 2; x <= 12; x++) { P.put(x, 21, RP.pau, 3.4); P.put(x, 14, RP.pau, 2.6); }
  if (!k) { P.ell(6, 17, 2.6, 2.2, (x, y, dx, dy) => P.put(x, y, RP.pena, 3 - dx - dy)); P.put(8, 15, RP.pena, 3); P.put(9, 15, RP.osso, 3); P.N(7, 15, '#c8b060'); for (let y = 19; y < 21; y++) P.put(6, y, RP.osso, 2.4); }
  else { P.put(5, 20, RP.osso, 4); P.put(6, 20, RP.osso, 3); P.put(8, 20, RP.pena, 3); P.put(9, 19, RP.pena, 2.6); }   // vazia: os ossinhos e uma pena
  return P.done();
}
// o barril podre: as aduelas inchadas, os aros de ferro enferrujados, a corda amarrada, a tampa caída de lado
function barrel(k) {
  const W = 16, H = 18, P = painter(W, H), s = 37881 + k;
  for (let y = 1; y < 18; y++) { const hw = 6 + Math.sin((y - 1) / 16 * Math.PI) * 1.4; for (let x = Math.round(8 - hw); x <= 8 + hw; x++) { const st = ((x + 9) % 3); P.put(x, y, RP.pau, 2.8 - (x - 8) / hw * 1.4 + (st === 0 ? -0.6 : 0) + cg(x, y, s) * 0.3); } }
  for (const y of [3, 14]) for (let x = 1; x <= 15; x++) if (P.has(x, y)) P.put(x, y, RP.ferrugem, 3.4 - (x - 8) * 0.12);
  for (let x = 2; x <= 14; x++) if (P.has(x, 1)) P.put(x, 1, RP.pau, 4.4);
  if (k) for (let y = 4; y < 14; y++) P.put(4 + (y * 0.6 | 0), y, RP.corda, 4);
  stain(P, RP.erva, 0.06, s + 3, (x, y) => y > 12 ? 0.4 : 0, 0, [RP.pau]);
  return P.done();
}
// o espantalho de gravetos: a figura de varas amarradas em cruz, a cabeça de saco, os trapos, os ossinhos pendurados
function scarecrow(k) {
  const W = 22, H = 36, P = painter(W, H), s = 37891 + k;
  stick(P, [11, 35], [11, 4], 1.8, RP.pau, s);
  stick(P, [1, 12 + k], [21, 11 - k], 1.4, RP.pau, s + 1);
  P.ell(11, 6, 4, 4.4, (x, y, dx, dy, d) => P.put(x, y, RP.pano, 3.2 - dx * 0.9 - dy - d * 0.4 + cg(x, y, s) * 0.5));
  P.put(9, 6, RP.pano, 0.3); P.put(13, 6, RP.pano, 0.3); for (let x = 9; x <= 13; x++) P.put(x, 8, RP.corda, 3.2);   // os olhos costurados e a amarra
  for (let y = 12; y < 26; y++) for (let x = 6; x <= 16; x++) { const sp = 3 + (y - 12) * 0.35; if (Math.abs(x - 11) > sp || (y > 22 && hash2(x, y, s) < 0.5)) continue; P.put(x, y, RP.trapo, 2.8 - (x - 11) / sp * 1 + (y === 12 ? 0.8 : 0) + Math.sin(x * 2) * 0.3); }
  for (const x of [2, 20]) for (let y = 12; y < 16; y++) P.put(x + (y & 1) * 0.5, y, RP.osso, 4 - (y - 12) * 0.4);
  for (let x = 4; x < 19; x += 3) if (hash2(x, 0, s) < 0.6) P.put(x, 10 + (x & 1), RP.taboa, 3.4);   // palha saindo
  return P.done();
}

/* =============================== o Patíbulo =============================== */
// a forca: o poste, a trave, a mão-francesa, a corda com o laço vazio, o degrau de tábua
function gallows(k) {
  const W = 40, H = 54, P = painter(W, H), s = 37901 + k, px = k ? 32 : 6, dir = k ? -1 : 1;
  for (let y = 2; y < H; y++) for (let x = px - 2; x <= px + 2; x++) P.put(x, y, RP.pau, 3 - (x - px) * 0.7 * dir * dir + cg(x, y, s) * 0.3 + (Math.sin(y * 0.8) > 0.9 ? -0.6 : 0));
  const tx0 = Math.min(px - 2, px + dir * 28), tx1 = Math.max(px + 2, px + dir * 28);
  for (let x = tx0; x <= tx1; x++) for (let y = 2; y < 6; y++) P.put(x, y, RP.pau, 3.2 + (y === 2 ? 1 : y === 5 ? -0.8 : 0) + cg(x, y, s) * 0.3);
  tube(P, lin([px + dir * 2, 16], [px + dir * 12, 6]), () => 2.2, RP.pau, s + 2);   // a mão-francesa
  const rx = px + dir * 24;
  for (let y = 6; y < 24; y++) P.put(rx + Math.sin(y * 0.2) * 0.4, y, RP.corda, 3.6 + (y % 3 === 0 ? 0.6 : -0.2));
  for (let y = 24; y < 28; y++) { P.put(rx, y, RP.corda, 4.4); P.put(rx + 1, y, RP.corda, 3); }   // o nó
  P.ell(rx + 0.5, 32, 3.2, 3.8, (x, y, dx, dy, d) => { if (d > 0.4) P.put(x, y, RP.corda, 3.6 - dy - dx); });
  for (let x = rx - 6; x <= rx + 6; x++) { P.put(x, H - 9, RP.pau, 4); P.put(x, H - 8, RP.pau, 2.4); }   // o banquinho
  stick(P, [rx - 5, H - 8], [rx - 6, H - 1], 1.2, RP.pau, s + 4); stick(P, [rx + 5, H - 8], [rx + 6, H - 1], 1.2, RP.pau, s + 5);
  if (k) for (let i = 0; i < 5; i++) P.put(px - 6 + i * 3, H - 1, RP.osso, 3.6);
  return P.done();
}
// a gaiola de enforcado: ferro de tiras rebitadas no formato de um homem, o esqueleto encolhido, a corrente
function gibbet(k) {
  const W = 18, H = 40, P = painter(W, H), s = 37911 + k;
  for (let y = 0; y < 7; y++) P.put(9, y, RP.ferro, y % 2 ? 3.6 : 2.2);
  P.ell(9, 10, 4, 3.6, (x, y, dx, dy, d) => { if (d > 0.6) P.put(x, y, RP.ferro, 3 - dx - dy); });
  for (const x of [3, 15]) for (let y = 13; y < 38; y++) P.put(x + (y > 30 ? (x < 9 ? 1 : -1) : 0), y, RP.ferro, 3.2 - (x > 9 ? 1 : 0));
  for (const x of [6, 9, 12]) for (let y = 13; y < 38; y++) P.put(x, y, RP.ferro, 2.6);
  for (const y of [13, 22, 30, 38]) for (let x = 3; x <= 15; x++) if (P.has(x, y) || y === 13 || y === 22) P.put(x, y, RP.ferro, 3.6 - (x - 3) * 0.08);
  for (const y of [13, 22, 30]) for (const x of [3, 15]) P.put(x, y, RP.ferrugem, 4.2);
  // o esqueleto: crânio caído para o lado, as costelas, os braços pendurados
  P.ell(8, 10, 2.4, 2.2, (x, y, dx, dy) => P.put(x, y, RP.osso, 4 - dx - dy)); P.put(7, 10, RP.osso, 0.6); P.put(9, 10, RP.osso, 0.6);
  for (let y = 15; y < 25; y += 2) for (let x = 6; x <= 11; x++) P.put(x, y, RP.osso, 3.6 - Math.abs(x - 8.5) * 0.3);
  for (let y = 14; y < 30; y++) P.put(8.5, y, RP.osso, 3);
  if (!k) { for (let y = 26; y < 37; y++) { P.put(7, y, RP.osso, 3.4); P.put(10, y + 1, RP.osso, 3); } }
  else for (let x = 4; x < 14; x++) if (hash2(x, 0, s) < 0.5) P.put(x, 37, RP.osso, 3.6);   // caiu tudo no fundo
  stain(P, RP.ferrugem, 0.14, s + 3, null, 0, [RP.ferro]);
  return P.done();
}
// a fogueira apagada: a estaca queimada em pé com a corrente, o monte de lenha preta, a brasa que sobrou
function burnedStake(k) {
  const W = 34, H = 40, P = painter(W, H), s = 37921 + k;
  for (let y = 0; y < 34; y++) for (let x = 15; x <= 18; x++) P.put(x, y, RP.carvao, 2.6 - (x - 16.5) * 0.8 + (hash2(x, y, s) < 0.1 ? 1.6 : 0) + (y < 3 ? -0.6 : 0));
  for (let x = 13; x <= 20; x++) { P.put(x, 18, RP.ferro, 3.6); P.put(x, 22, RP.ferro, 3.2); }
  for (let i = 0; i < 14; i++) { const a = 0.25 + i * 0.19, L = 10 + hash2(i, 0, s) * 6, x0 = 17 + Math.cos(Math.PI * a) * 2, y0 = 38; stick(P, [x0, y0], [x0 + Math.cos(Math.PI * a) * L, y0 - Math.sin(Math.PI * a) * L * 0.8], 1.8, RP.carvao, s + i, 2.2); }
  for (let x = 2; x < 32; x++) for (let y = 36; y < 40; y++) if (y > 36 + Math.abs(x - 17) * 0.15) P.put(x, y, RP.carvao, 1.8 + cg(x, y, s) * 0.8 + (hash2(x, y, s) < 0.1 ? 1.4 : 0));
  for (let i = 0; i < (k ? 5 : 9); i++) P.N(8 + hash2(i, 1, s) * 18, 34 + hash2(i, 2, s) * 4, hash2(i, 3, s) < 0.4 ? FOGO.luz : FOGO.fundo);   // brasa
  if (k) { P.ell(17, 30, 1.8, 1.6, (x, y, dx, dy) => P.put(x, y, RP.osso, 3 - dx - dy)); P.put(19, 33, RP.osso, 3); }
  P.mark('brasa', 17, 36);
  return P.done();
}
// o pelourinho: o poste, a tábua com os três buracos (cabeça e mãos), o cadeado
function pillory(k) {
  const W = 26, H = 34, P = painter(W, H), s = 37931 + k;
  for (let y = 4; y < H; y++) for (let x = 11; x <= 14; x++) P.put(x, y, RP.pau, 3 - (x - 12.5) * 0.7 + cg(x, y, s) * 0.3);
  for (let y = 8; y < 16; y++) for (let x = 1; x < 25; x++) { const cut = Math.hypot(x - 12.5, y - 12) < 2.6 || Math.hypot(x - 5, y - 12) < 1.6 || Math.hypot(x - 20, y - 12) < 1.6; if (cut) continue; P.put(x, y, RP.pau, 3.2 + (y === 8 ? 1 : y === 15 ? -0.8 : 0) + (y === 12 ? -0.5 : 0) + cg(x, y, s) * 0.3); }
  for (const x of [2, 23]) P.put(x, 10, RP.ferro, 4);
  P.ell(12.5, 17.4, 1.4, 1.4, (x, y, dx, dy) => P.put(x, y, RP.ferrugem, 3.6 - dx - dy));
  for (let y = 3; y < 8; y++) for (let x = 10; x <= 15; x++) P.put(x, y, RP.pau, 3.6 - (y === 3 ? -0.8 : 0));
  if (k) for (let x = 3; x < 23; x += 4) P.put(x, 16 + (x & 3) * 0.5, RP.erva, 3);
  return P.done();
}
// a tábua dos caçadores (fundo): uma prancha pregada com a marca deles (o sol com a cruz queimado na madeira)
function hunterBoard(k) {
  const W = 20, H = 16, P = painter(W, H), s = 37941 + k;
  for (let y = 1; y < 15; y++) for (let x = 1; x < 19; x++) { if ((y === 1 || y === 14) && hash2(x, y, s) < 0.3) continue; P.put(x, y, RP.pau, 2.6 + Math.sin(x * 0.4 + y * 0.1) * 0.3 + (y % 7 === 0 ? -0.9 : 0) + cg(x, y, s) * 0.3); }
  P.ell(10, 8, 4.4, 4.4, (x, y, dx, dy, d) => { if (d > 0.55 && d < 1) P.put(x, y, RP.carvao, 1.4); });
  for (let i = -4; i <= 4; i++) { P.put(10 + i, 8, RP.carvao, 1.2); P.put(10, 8 + i, RP.carvao, 1.2); }
  for (const [x, y] of [[2, 2], [17, 2], [2, 13], [17, 13]]) P.put(x, y, RP.ferro, 4);
  if (k) { for (let y = 9; y < 16; y++) P.put(16, y, RP.trapo, 3 - (y - 9) * 0.2); }
  return P.done();
}

/* =============================== o Círculo =============================== */
// a pedra em pé pequena: granito com a espiral riscada e o líquen
function smallMenhir(k) {
  const W = 16, H = k ? 30 : 24, P = painter(W, H), s = 37951 + k;
  for (let y = 0; y < H; y++) { const hw = 4.4 + y / H * 2.6 - (y < 4 ? (4 - y) * 0.8 : 0); for (let x = Math.round(8 - hw); x <= 8 + hw; x++) P.put(x, y, RP.menir, 3 - (x - 8) / hw * 1.3 - (y < 2 ? -0.6 : 0) + cg(x, y, s) * 0.6 + (hash2(x, y, s) < 0.05 ? 1 : 0)); }
  for (let a = 0; a < 14; a += 0.25) { const r = a * 0.3, x = 8 + Math.cos(a) * r, y = H * 0.42 + Math.sin(a) * r; P.put(x, y, RP.menir, 0.8); }
  stain(P, RP.liquen, 0.12, s + 2, (x, y) => P.has(x, y - 1) ? 0 : 0.4, 0, [RP.menir]);
  return P.done();
}
// as marcas de bruxa (fundo): rosetas riscadas, o "VV" de proteção, as linhas de contagem, uma mão espalmada de barro
function witchMarks(k) {
  const W = 34, H = 22, P = painter(W, H), s = 37961 + k;
  const scr = (x, y) => { if (hash2(x, y, s) < 0.85) P.put(x, y, RP.barro, 3.8 + cg(x, y, s) * 0.6); };
  const ros = (cx, cy, r) => { for (let a = 0; a < 6.28; a += 0.05) scr(cx + Math.cos(a) * r, cy + Math.sin(a) * r); for (let i = 0; i < 6; i++) { const a = i * 1.047; for (let t = 0; t < 1; t += 0.06) { const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; scr(cx + (x - cx) * t + Math.cos(a + 2.1) * r * Math.sin(t * Math.PI) * 0.5, cy + (y - cy) * t + Math.sin(a + 2.1) * r * Math.sin(t * Math.PI) * 0.5); } } };
  ros(k ? 24 : 8, 9, 6);
  for (let i = 0; i < 9; i++) { scr((k ? 4 : 18) + i * 0.5, 4 + i); scr((k ? 8 : 22) - i * 0.5, 4 + i); scr((k ? 8 : 22) + i * 0.5, 4 + i); scr((k ? 12 : 26) - i * 0.5, 4 + i); }
  for (let i = 0; i < 7; i++) for (let y = 16; y < 21; y++) scr((k ? 2 : 22) + i * 1.5, y);
  for (let x = 0; x < 4; x++) scr((k ? 4 : 23) + x * 2, 17 - x % 2);
  return P.done(false);
}
// o monte de crânios com as velas pretas: crânios empilhados, a cera escorrida, as velas acesas por cima
function skullCandles(k) {
  const W = 26, H = 22, P = painter(W, H), s = 37971 + k;
  const sk = (cx, cy, r) => { P.ell(cx, cy, r, r * 0.9, (x, y, dx, dy, d) => P.put(x, y, RP.osso, 3.4 - dx - dy * 1.1 - d * 0.5 + cg(x, y, s) * 0.3)); P.put(cx - r * 0.4, cy, RP.osso, 0.5); P.put(cx + r * 0.4, cy, RP.osso, 0.5); P.put(cx, cy + r * 0.5, RP.osso, 1); };
  for (const [x, y, r] of k ? [[6, 18, 3.6], [13, 18, 3.8], [20, 18, 3.4], [9, 12, 3.4], [17, 12, 3.4], [13, 7, 3.2]] : [[7, 18, 3.8], [15, 18, 3.6], [22, 19, 2.8], [11, 12, 3.4]]) sk(x, y, r);
  const cand = k ? [[13, 0, 4], [5, 7, 3], [21, 7, 4]] : [[11, 4, 4], [19, 12, 3], [3, 13, 3]];
  for (const [x, y, h] of cand) { for (let j = 0; j < h; j++) { P.put(x, y + 1 + j, RP.vela, 3.4); P.put(x + 1, y + 1 + j, RP.vela, 2); } P.put(x, y + h + 1, RP.cera, 3.6); P.put(x - 1, y + h + 1, RP.cera, 3); P.put(x + 2, y + h + 1, RP.cera, 2.6); P.put(x, y, RP.pau, 1); P.mark('vela', x, y); }
  for (let x = 0; x < W; x++) if (P.has(x, H - 2) && hash2(x, 0, s) < 0.4) P.put(x, H - 1, RP.cera, 2.4);
  return P.done();
}
// os bonecos de graveto pendurados: três ou quatro bonequinhos de varas amarrados em fios de alturas diferentes
function poppets(k) {
  const W = 30, H = 26, P = painter(W, H), s = 37981 + k;
  for (let i = 0; i < (k ? 4 : 3); i++) {
    const x = 4 + i * (k ? 7 : 10), L = 4 + ((hash2(i, 0, s) * 10) | 0);
    for (let y = 0; y < L; y++) P.put(x, y, RP.corda, 3.2);
    const y0 = L; stick(P, [x, y0], [x, y0 + 9], 1, RP.morto, s + i); stick(P, [x - 3, y0 + 3], [x + 3, y0 + 3], 1, RP.morto, s + i + 9);
    P.line(x, y0 + 9, x - 2, y0 + 12, RP.morto, 3); P.line(x, y0 + 9, x + 2, y0 + 12, RP.morto, 2.6);
    P.ell(x, y0 + 1, 1.6, 1.6, (xx, yy, dx, dy) => P.put(xx, yy, i % 2 ? RP.osso : RP.pano, 3.6 - dx - dy));
    P.put(x, y0 + 3, RP.trapo, 4);
  }
  return P.done();
}

/* =============================== registro =============================== */
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
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), brejo: true, bjLuz: Ps.map(bakeLuz), bjPts: Ps.map(P => P.pts) }, extra || {}));
};
// a Turfeira
def('bj_corpo_turfa', 'Corpo de turfa', F, 'frente', ['turfeira'], [bogBody(0), bogBody(1)]);
def('bj_toco', 'Toco de árvore afogada', F, 'frente', ['turfeira', 'palafitas', 'circulo'], [stump(0), stump(1)]);
def('bj_tronco', 'Tronco morto em pé', Wl, 'fundo', ['turfeira', 'circulo'], [deadTree(0), deadTree(1)]);
def('bj_taboa', 'Touceira de taboa', F, 'frente', ['turfeira', 'palafitas'], [bigReeds(0), bigReeds(1)]);
// as Palafitas
def('bj_caldeirinho', 'Caldeirãozinho no tripé', F, 'frente', ['palafitas'], [smallCauldron(0), smallCauldron(1)], { luz: [{ x: 13, y: 24, r: 0.8 }], brilho: '#f0a050', bjAnim: 'fogo' });
def('bj_varal', 'Varal de trapos e ervas', C, 'frente', ['palafitas'], [clothesLine(0), clothesLine(1)]);
def('bj_ervas', 'Maços de ervas secando', C, 'frente', ['palafitas', 'circulo'], [herbBundles(0), herbBundles(1)]);
def('bj_gaiola_corvo', 'Gaiola de corvo', C, 'frente', ['palafitas', 'patibulo'], [crowCage(0), crowCage(1)]);
def('bj_barril', 'Barril podre', F, 'frente', ['palafitas'], [barrel(0), barrel(1)]);
def('bj_espantalho', 'Espantalho de gravetos', F, 'frente', ['palafitas', 'turfeira'], [scarecrow(0), scarecrow(1)]);
// o Patíbulo
def('bj_forca', 'Forca', F, 'frente', ['patibulo'], [gallows(0), gallows(1)]);
def('bj_gaiola_enforcado', 'Gaiola de enforcado', C, 'frente', ['patibulo'], [gibbet(0), gibbet(1)]);
def('bj_fogueira', 'Fogueira apagada', F, 'frente', ['patibulo'], [burnedStake(0), burnedStake(1)], { luz: [{ x: 17, y: 36, r: 0.35 }], brilho: '#b85a20', bjAnim: 'brasa' });
def('bj_pelourinho', 'Pelourinho', F, 'frente', ['patibulo'], [pillory(0), pillory(1)]);
def('bj_tabua_cacadores', 'Tábua dos caçadores', Wl, 'fundo', ['patibulo', 'palafitas'], [hunterBoard(0), hunterBoard(1)]);
// o Círculo
def('bj_menir_pequeno', 'Pedra em pé', F, 'frente', ['circulo'], [smallMenhir(0), smallMenhir(1)]);
def('bj_marcas', 'Marcas de bruxa', Wl, 'fundo', ['circulo', 'palafitas'], [witchMarks(0), witchMarks(1)]);
def('bj_cranios_velas', 'Crânios com velas pretas', F, 'frente', ['circulo'], [skullCandles(0), skullCandles(1)], { luz: [{ x: 13, y: 6, r: 0.5 }], brilho: '#ffcf7a', bjAnim: 'velas' });
def('bj_bonecos', 'Bonecos de graveto', C, 'frente', ['circulo', 'patibulo'], [poppets(0), poppets(1)]);

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(BJ_PROP_PLAN, {
  turfeira: { chao: [['bj_corpo_turfa', 0.08, 1], ['bj_toco', 0.12, 1], ['bj_taboa', 0.14, 1], ['bj_espantalho', 0.02, 1]], teto: [], fundo: [['bj_tronco', 0.1, 1]] },
  palafitas: { chao: [['bj_caldeirinho', 0.05, 1], ['bj_barril', 0.08, 1], ['bj_espantalho', 0.04, 1], ['bj_taboa', 0.06, 1], ['bj_toco', 0.04, 1]], teto: [['bj_varal', 0.1, 1], ['bj_ervas', 0.1, 1], ['bj_gaiola_corvo', 0.04, 1]], fundo: [['bj_tabua_cacadores', 0.04, 1], ['bj_marcas', 0.04, 1]] },
  patibulo: { chao: [['bj_forca', 0.08, 1], ['bj_fogueira', 0.06, 1], ['bj_pelourinho', 0.06, 1]], teto: [['bj_gaiola_enforcado', 0.12, 1], ['bj_gaiola_corvo', 0.05, 1], ['bj_bonecos', 0.04, 1]], fundo: [['bj_tabua_cacadores', 0.08, 1]] },
  circulo: { chao: [['bj_menir_pequeno', 0.12, 1], ['bj_cranios_velas', 0.05, 1], ['bj_toco', 0.05, 1]], teto: [['bj_bonecos', 0.1, 1], ['bj_ervas', 0.04, 1]], fundo: [['bj_marcas', 0.1, 1], ['bj_tronco', 0.06, 1]] }
});

/* ---------- a luz: o fogo de lenha, as velas, a brasa; desenhados ao vivo, só no que está na tela ---------- */
const bjPt = (p, nm) => { const P = p.def.bjPts && p.def.bjPts[p.v]; return P && P[nm] ? P[nm] : null; };
const FL = ['#b85a20', '#f0a050', '#ffd890', '#fff6dc'];
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined' || BJART.bjOut(cy)) return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.brejo || !p.def.bjAnim) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), nv = p.def.bjLuz[p.v];
    if (nv) { lc.globalAlpha = 0.4 + 0.15 * Math.sin(gameTime * 3 + p.X * 0.03); lc.drawImage(nv, X, Y); }
    const a = p.def.bjAnim;
    if (a === 'fogo') { const q = (bjPt(p, 'fogo') || [])[0]; if (q) { lc.globalAlpha = 0.45 + 0.1 * Math.sin(gameTime * 9 + p.X); lc.drawImage(BJART.bjGlow('fogoP', 34, '#f0a050'), X + q.x + (q.w >> 1) - 34, Y + q.y - 38); } }
    else if (a === 'brasa') { const q = (bjPt(p, 'brasa') || [])[0]; if (q) { lc.globalAlpha = 0.18 + 0.08 * Math.sin(gameTime * 1.3 + p.X); lc.drawImage(BJART.bjGlow('brasaP', 18, '#b85a20'), X + q.x - 18, Y + q.y - 18); } }
    else if (a === 'velas') for (const q of bjPt(p, 'vela') || []) { lc.globalAlpha = 0.24 + 0.05 * Math.sin(gameTime * 11 + q.x); lc.drawImage(BJART.bjGlow('vb', 28, BJ_COL.vela), X + q.x - 28, Y + q.y - 30); }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined' || BJART.bjOut(cy)) return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.brejo || !p.def.bjAnim) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), a = p.def.bjAnim;
    if (a === 'fogo') {   // a lenha: chamas laranja baixas lambendo a panela
      const q = (bjPt(p, 'fogo') || [])[0]; if (!q) continue; const T0 = Math.floor(gameTime * 9);
      for (let c = 0; c < q.w; c++) {
        const env = Math.sin(Math.PI * (c + 0.5) / q.w), h = Math.round(env * (2 + (Math.sin(gameTime * 8 + c * 1.9 + p.X) + 1) * 1.4 + hash2(c, T0, p.X) * 2));
        for (let j = 0; j < h; j++) { const t = j / Math.max(1, h); lc.globalAlpha = t > 0.8 ? 0.6 : 1; lc.fillStyle = t < 0.25 && env > 0.6 ? FL[3] : t < 0.55 ? FL[2] : t < 0.8 ? FL[1] : FL[0]; lc.fillRect(X + q.x + c, Y + q.y - j, 1, 1); }
      }
    } else if (a === 'velas') for (const q of bjPt(p, 'vela') || []) {
      const f = Math.floor(gameTime * 9 + q.x * 3) % 4;
      lc.fillStyle = BJART.CHAMA[2]; lc.fillRect(X + q.x + (f === 2 ? 1 : f === 3 ? -1 : 0), Y + q.y - 3 - (f === 1 ? 1 : 0), 1, 1);
      lc.fillStyle = BJART.CHAMA[1]; lc.fillRect(X + q.x, Y + q.y - 2, 1, 1); lc.fillStyle = BJART.CHAMA[0]; lc.fillRect(X + q.x, Y + q.y - 1, 1, 1);
    }
  }
  lc.globalAlpha = 1;
});
Object.assign(BJART, { painter, tube, bez, lin, stain, cracks, chip, scatter, stick, RP, HX, OUTLINE, FOGO, toCv, bakeLuz });
}
