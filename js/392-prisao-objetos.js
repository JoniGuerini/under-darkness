'use strict';

/* ================= a Prisão dos Deuses: objetos de cena =================
   O que é maior que um bloco e veste a Prisão (docs/camadas/16-prisao-deuses.md, seção 5): 15 objetos.
   No chão: a estátua de carcereiro (de pedra, com a chave do tamanho de um braço), a bola de ferro com a corrente, o
   cepo de pedra com as cintas de ferro (três furos: pescoço e pulsos), a ossada de uma fera enorme, o elo partido de uma
   corrente-ponte, a coluna de runas (as runas ainda acesas) e, no Tártaro, os espinhos de pedra negra.
   No teto: a jaula pendurada, com o que sobrou de quem ficou nela.
   Na parede (fundo): o prisioneiro preso pelos pulsos, os grilhões vazios, o argolão com o toco de corrente, a porta de
   bronze selada, o relevo dos deuses atando o lobo, a racha que pinga ícor (luz dourada) e, só nos salões do Salão dos
   Gigantes, o gigante preso: ajoelhado, os pulsos acorrentados na rocha, a cabeça baixa.
   O pintor é o mesmo jeito do 55: rampas de 6 tons, luz de cima à esquerda, o contorno escuro só onde toca o ar
   (outlined). A luz (só no que tem de onde vir: o ícor e as runas) vai em `luz`, que o 45 acende.
   Flags que o 395 respeita: salao: true (só nos salões dos gigantes), tartaro: true (só no Tártaro). */
const PD_PROP_PLAN = {};
// peças de fundo que ficam em pé no chão em vez de penduradas na altura dos olhos
const PD_BACK_FLOOR = { pd_gigante_preso: 1, pd_porta: 1 };
{
const cg = CVART.cg;
const R6 = hexes => hexes.map(h => ph(h));
const RP = {
  ferro: R6(['#0c0c10', '#1a1a20', '#2c2c34', '#42424c', '#5e5e6a', '#86868f']),
  bronze: R6(['#1a1006', '#33220c', '#523814', '#78561e', '#a07a30', '#d0a850']),
  osso: R6(['#2a241a', '#463c2c', '#685a44', '#8e7e62', '#b4a486', '#d8cab0']),
  pedra: R6(['#15130f', '#262119', '#3a3326', '#504636', '#6a5e4a', '#8c7e66']),
  rocha: R6(['#121016', '#201b26', '#302838', '#42384c', '#5a4e66', '#786a84']),
  tartaro: R6(['#050408', '#0b0910', '#141018', '#1e1824', '#2a2232', '#3a3046']),
  icor: R6(['#5a3006', '#8a5410', '#c08018', '#f0b030', '#ffd860', '#fff4c0']),
  runa: R6(['#0e2030', '#1a3a58', '#2a6090', '#5ab0e8', '#a8dcff', '#e8f8ff']),
  ferr: R6(['#1e0c04', '#341808', '#522810', '#723a18', '#925024', '#b06c3a'])
};
// o pintor: rampas de 6 tons; v fracionário cai no tom de baixo
function painter(w, h) {
  const c = new Uint32Array(w * h);
  const P = {
    w, h, c,
    put(x, y, R, v) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = R[v < 0 ? 0 : v > 5 ? 5 : v | 0]; },
    clear(x, y) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < w && y < h) c[y * w + x] = 0; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    // retângulo talhado: chanfro aceso em cima e à esquerda, sombra embaixo e à direita, grão
    slab(x0, y0, x1, y1, R, s, base = 2.7, gr = 0.35) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) P.put(x, y, R, base + (y === y0 ? 1.1 : 0) + (x === x0 ? 0.5 : 0) - (y === y1 ? 0.9 : 0) - (x === x1 ? 0.6 : 0) - (y - y0) / Math.max(1, y1 - y0) * 0.4 + cg(x, y, s) * gr); },
    // elipse cheia com luz de cima à esquerda
    ell(cx, cy, rx, ry, R, s, base = 2.8, f) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; const g = f ? f(dx, dy, d, x, y) : 0; if (g === false) continue; P.put(x, y, R, base + 1 - (dx * 0.6 + dy * 0.8) * 1.3 - d * 0.5 + cg(x, y, s) * 0.3 + (g || 0)); } },
    // barra de espessura th de (x0, y0) a (x1, y1)
    rod(x0, y0, x1, y1, th, R, base, s) {
      const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux, lit = -(nx * 0.6 + ny * 0.8), hh = (th - 1) / 2;
      for (let t = 0; t <= L; t += 0.5) for (let k = -hh; k <= hh + 0.01; k += 0.5) P.put(x0 + ux * t + nx * k, y0 + uy * t + ny * k, R, base + (hh ? k / hh : 0) * lit * 1.1 + cg((x0 + ux * t) | 0, (y0 + uy * t) | 0, s) * 0.3);
    },
    // um anel (elo de frente ou argola): raios de fora e de dentro
    ring(cx, cy, rx, ry, th, R, base, s) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.hypot(dx, dy), di = Math.hypot((x + 0.5 - cx) / Math.max(0.5, rx - th), (y + 0.5 - cy) / Math.max(0.5, ry - th)); if (d <= 1 && di > 1) P.put(x, y, R, base + 0.6 - (dx * 0.6 + dy * 0.8) * 1.4 + (d > 0.85 ? -0.6 : 0) + (di < 1.3 ? (dx + dy > 0 ? 0.6 : -0.8) : 0) + cg(x, y, s) * 0.3); } },
    // uma corrente de elos de (x0, y0) a (x1, y1), elos de tamanho r, com a barriga sag para baixo
    chain(x0, y0, x1, y1, r, sag, R, s) {
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.floor(L / (r * 1.6)));
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
        if (i % 2 === 0) P.ring(x, y, r, r * 0.72, Math.max(1, r * 0.45), R, 2.6, s + i);
        else { const a = Math.atan2(y1 - y0 + sag * 4 * (1 - 2 * t), x1 - x0), ux = Math.cos(a) * r, uy = Math.sin(a) * r; P.rod(x - ux, y - uy, x + ux, y + uy, Math.max(1, r * 0.5), R, 2.8, s + i); }
      }
    },
    done() { const cv = mk(w, h), x = cv.getContext('2d'), img = x.createImageData(w, h); new Uint32Array(img.data.buffer).set(c); x.putImageData(img, 0, 0); return outlined(cv); }
  };
  return P;
}

/* ---------- o chão ---------- */
// a estátua de carcereiro: o corpo de blocos de pedra, o elmo fechado, a chave enorme em pé ao lado, o pedestal
function estatua(v) {
  const P = painter(20, 42), s = 39701 + v * 9, R = RP.pedra;
  P.slab(1, 36, 18, 41, R, s, 2.4);
  P.slab(5, 26, 9, 35, R, s + 1, 2.6); P.slab(11, 26, 15, 35, R, s + 2, 2.2);   // as pernas
  P.slab(4, 13, 16, 25, R, s + 3, 2.9);                                           // o tronco
  for (let x = 5; x < 16; x++) P.put(x, 20, R, 1.4);                              // o cinto
  P.slab(6, 4, 14, 12, R, s + 4, 3.1);                                            // o elmo
  for (let x = 7; x <= 13; x++) P.put(x, 8, R, 0.6);                              // a fenda do visor
  P.slab(1, 14, 4, 22, R, s + 5, 2.6); P.slab(16, 14, 18, 22, R, s + 6, 2.1);     // os braços
  // a chave: a haste em pé à direita, o anel em cima, os dentes embaixo (ferro velho)
  const kx = v ? 18 : 2; if (v) { P.rod(17.5, 2, 17.5, 34, 2, RP.ferro, 2.6, s + 7); P.ring(17.5, 3, 2.4, 2.4, 1, RP.ferro, 2.6, s + 8); P.slab(15, 30, 17, 31, RP.ferro, s + 9, 2.6); P.slab(15, 33, 16, 34, RP.ferro, s + 9, 2.4); }
  else { P.rod(2.5, 2, 2.5, 34, 2, RP.ferro, 3, s + 7); P.ring(2.5, 3, 2.4, 2.4, 1, RP.ferro, 3, s + 8); P.slab(3, 30, 5, 31, RP.ferro, s + 9, 2.8); P.slab(4, 33, 5, 34, RP.ferro, s + 9, 2.6); }
  void kx;
  for (let k = 0; k < 10; k++) { const x = 3 + (cg(k, v, s) + 0.5) * 14 | 0, y = 14 + (cg(v, k, s + 1) + 0.5) * 26 | 0; if (P.has(x, y)) P.put(x, y, R, 1.2); }   // rachaduras
  return P.done();
}
// a bola de ferro e a corrente com o grilhão aberto
function bola(v) {
  const P = painter(20, 13), s = 39711 + v;
  P.chain(3, 11, 12, 10, 1.4, v ? 1.5 : 0.5, RP.ferro, s);
  P.ring(2.5, 10.5, 2.2, 1.6, 1, RP.ferro, 3, s + 1);
  P.ell(14.5, 7, 5.2, 5.2, RP.ferro, s + 2, 2.6, (dx, dy) => (dx * dx + dy * dy < 0.08 && dx < 0 && dy < 0) ? 1.6 : 0);
  for (let k = 0; k < 6; k++) { const x = 11 + (cg(k, 1, s) + 0.5) * 7 | 0, y = 4 + (cg(1, k, s) + 0.5) * 7 | 0; if (P.has(x, y)) P.put(x, y, RP.ferr, 2 + (k % 3)); }
  return P.done();
}
// o cepo de pedra: o bloco largo com três furos (pescoço e pulsos), as cintas de ferro, os grilhões no pé
function cepo(v) {
  const P = painter(32, 20), s = 39721 + v;
  P.slab(1, 15, 30, 19, RP.pedra, s, 2.2);
  P.slab(3, 3, 28, 14, RP.pedra, s + 1, 2.9);
  for (const [cx, r] of [[9, 1.8], [16, 2.6], [23, 1.8]]) P.ell(cx, 8.5, r, r, RP.pedra, s + 2, 0, () => -1.6);
  for (const x of [5, 27]) for (let y = 3; y <= 14; y++) { P.put(x, y, RP.ferro, y === 3 ? 4.4 : 3); P.put(x + 1, y, RP.ferro, 1.8); }
  for (let x = 3; x <= 28; x++) P.put(x, 8, RP.pedra, (x < 7 || x > 25) ? 1.2 : P.has(x, 8) ? 1.5 : 1);
  if (v) P.chain(10, 15, 20, 18, 1.3, 0.4, RP.ferro, s + 3);
  return P.done();
}
// a ossada de uma fera enorme: a caixa de costelas em arco, a espinha, um pedaço do crânio com os dentes
function ossada(v) {
  const P = painter(48, 19), s = 39731 + v, O = RP.osso;
  for (let x = 4; x <= 40; x++) { const y = 6 + Math.round(Math.sin((x - 4) / 36 * Math.PI) * -3) + 3; P.put(x, y, O, 3.6 + cg(x, 0, s) * 0.5); P.put(x, y + 1, O, 2); }
  for (let k = 0; k < 7; k++) { const x0 = 8 + k * 5; for (let y = 0; y < 10 - Math.abs(k - 3); y++) { const xx = x0 + Math.round(Math.sin(y / 9 * 1.6) * 2.4); P.put(xx, 7 + y, O, 4.2 - y * 0.18); P.put(xx + 1, 7 + y, O, 2.4); } }
  for (let x = 1; x <= 46; x++) { P.put(x, 18, O, 2.6); }
  // o crânio (à esquerda ou à direita): a mandíbula comprida, o olho fundo, os dentes
  const L = v === 0, x0 = L ? 0 : 36;
  P.ell(x0 + 6, 13, 6, 4, O, s + 1, 3);
  P.put(x0 + (L ? 4 : 7), 12, O, 0.2); P.put(x0 + (L ? 5 : 8), 12, O, 0.4);
  for (let k = 0; k < 4; k++) P.put(x0 + 2 + k * 2, 16, O, 5);
  return P.done();
}
// o elo partido de uma corrente-ponte: o anel enorme caído de lado, a ponta rompida brilhando de ferro novo
function eloPartido(v) {
  const P = painter(32, 20), s = 39741 + v;
  P.ring(15, 11, 14, 8, 4, RP.ferro, 2.4, s);
  for (let y = 0; y < 20; y++) for (let x = v ? 22 : 4; x < (v ? 27 : 9); x++) P.clear(x, y);   // o rompimento
  for (let y = 4; y < 18; y++) { const x = v ? 21 : 9; if (P.has(x, y)) P.put(x, y, RP.ferro, 5); }
  for (let k = 0; k < 14; k++) { const x = 2 + (cg(k, 2, s) + 0.5) * 28 | 0, y = 3 + (cg(2, k, s) + 0.5) * 15 | 0; if (P.has(x, y)) P.put(x, y, RP.ferr, 1 + (k % 4)); }
  for (let x = 0; x < 32; x++) if (P.has(x, 18) || P.has(x, 17)) P.put(x, 19, RP.ferro, 1);
  return P.done();
}
// a coluna de runas: um pilar de pedra rúnica com três runas acesas de cima para baixo, o capitel e a base
function colunaRunas(v) {
  const P = painter(14, 42), s = 39751 + v;
  P.slab(0, 0, 13, 3, RP.pedra, s, 3); P.slab(0, 38, 13, 41, RP.pedra, s + 1, 2.6);
  P.slab(2, 4, 11, 37, RP.pedra, s + 2, 2.8);
  for (let y = 4; y <= 37; y += 11) for (let x = 2; x <= 11; x++) P.put(x, y, RP.pedra, 1.4);
  const runas = typeof PDART !== 'undefined' && PDART.RUNAS ? PDART.RUNAS : null;
  if (runas) for (let k = 0; k < 3; k++) { const r = runas[(k + v * 3) % runas.length], oy = 6 + k * 11; for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (r[y][x] === '#') P.put(4 + x, oy + y, RP.runa, (x + y) % 3 ? 3.4 : 4.4); }
  return P.done();
}
// os espinhos do Tártaro: lâminas de pedra negra saindo do chão, a ponta com um fio violeta
function espinhos(v) {
  const P = painter(26, 16), s = 39761 + v;
  const L = v ? [[3, 9], [8, 15], [13, 11], [18, 14], [23, 7]] : [[4, 12], [10, 8], [15, 15], [21, 10]];
  for (const [cx, h] of L) for (let y = 0; y < h; y++) { const w = (1 - y / h) * 2.4 + 0.4; for (let x = Math.floor(cx - w); x <= cx + w; x++) P.put(x, 15 - y, RP.tartaro, 2.6 - (x - cx) / w * 1.3 + y / h * 0.8); }
  for (const [cx, h] of L) P.put(cx, 16 - h, RP.runa, 2);
  return P.done();
}

/* ---------- o teto ---------- */
// a jaula pendurada: a corrente do teto, a cúpula de barras, o piso de ferro, os ossos dentro
function jaula(v) {
  const P = painter(20, 38), s = 39771 + v;
  P.chain(10, 0, 10, 10, 1.4, 0, RP.ferro, s);
  P.ring(10, 12, 2.4, 2, 1, RP.ferro, 3, s + 1);
  for (let x = 2; x <= 18; x++) { const y = 14 + Math.round((Math.abs(x - 10) / 8) ** 2 * 3); P.put(x, y, RP.ferro, 4); P.put(x, y + 1, RP.ferro, 2); }
  for (let x = 2; x <= 18; x += 4) { const y0 = 14 + Math.round((Math.abs(x - 10) / 8) ** 2 * 3); for (let y = y0; y <= 34; y++) { P.put(x, y, RP.ferro, 3.8); P.put(x + 1, y, RP.ferro, 1.8); } }
  for (let x = 1; x <= 19; x++) { P.put(x, 35, RP.ferro, 3.4); P.put(x, 36, RP.ferro, 1.6); }
  // dentro: o crânio caído e um osso longo
  P.ell(v ? 7 : 13, 32, 2.6, 2.2, RP.osso, s + 2, 3.2); P.put(v ? 6 : 12, 32, RP.osso, 0.3);
  for (let x = v ? 10 : 4; x <= (v ? 16 : 10); x++) P.put(x, 34, RP.osso, 3.6);
  for (let x = 2; x <= 18; x += 4) for (let y = 22; y <= 34; y++) if (P.has(x, y)) P.put(x, y, RP.ferro, 3.8);   // as barras na frente
  return P.done();
}

/* ---------- a parede ---------- */
// o prisioneiro preso pelos pulsos: dois argolões na parede, as correntes curtas, o esqueleto pendurado (a cabeça caída)
function prisioneiro(v) {
  const P = painter(24, 34), s = 39781 + v, O = RP.osso;
  for (const x of [3, 20]) { P.slab(x - 2, 1, x + 2, 4, RP.ferro, s + x, 2.6); P.ring(x, 6, 1.8, 1.8, 1, RP.ferro, 3, s + x + 1); }
  P.chain(3, 8, 7, 13, 1.1, 0, RP.ferro, s + 2); P.chain(20, 8, 16, 13, 1.1, 0, RP.ferro, s + 3);
  // os braços para cima, o crânio caído, as costelas, a bacia, as pernas penduradas
  P.rod(7, 13, 10, 18, 1.5, O, 3.6, s + 4); P.rod(16, 13, 14, 18, 1.5, O, 3, s + 5);
  P.ell(12 + (v ? -1 : 1), 17.5, 2.6, 2.4, O, s + 6, 3.4); P.put(11 + (v ? -1 : 1), 17.5, O, 0.2); P.put(13 + (v ? -1 : 1), 17.5, O, 0.3);
  for (let y = 20; y <= 27; y += 2) for (let x = 9; x <= 15; x++) P.put(x, y, O, 3.6 - Math.abs(x - 12) * 0.25);
  for (let y = 20; y <= 28; y++) P.put(12, y, O, 4.4);
  P.slab(9, 28, 15, 29, O, s + 7, 3);
  P.rod(10, 30, 9, 33, 1.5, O, 3.4, s + 8); P.rod(14, 30, 15, 33, 1.5, O, 2.8, s + 9);
  return P.done();
}
// os grilhões vazios: o argolão, a corrente e as duas algemas abertas
function grilhoes(v) {
  const P = painter(20, 18), s = 39791 + v;
  P.slab(7, 0, 12, 3, RP.ferro, s, 2.6); P.ring(9.5, 5, 2, 2, 1, RP.ferro, 3, s + 1);
  P.chain(9.5, 7, 4, 13, 1.1, 0, RP.ferro, s + 2); P.chain(9.5, 7, 15, 13, 1.1, 0, RP.ferro, s + 3);
  for (const cx of [4, 15]) { P.ring(cx, 15, 2.6, 2.2, 1, RP.ferro, 3, s + cx); P.clear(cx + 2, 14); P.clear(cx + 2, 15); }
  return P.done();
}
// o argolão: a placa de bronze cravada na pedra, o aro grosso, o toco de corrente rompido pendurado
function argolao(v) {
  const P = painter(28, 30), s = 39801 + v;
  P.slab(8, 0, 19, 6, RP.bronze, s, 2.6);
  for (const [x, y] of [[9, 1], [18, 1], [9, 5], [18, 5]]) P.put(x, y, RP.bronze, 5);
  P.ring(13.5, 13, 9, 8, 3, RP.ferro, 2.6, s + 1);
  P.chain(13.5, 21, 13.5 + (v ? 3 : -2), 29, 1.6, 0, RP.ferro, s + 2);
  return P.done();
}
// a porta de bronze selada: o arco, as folhas com as cintas, o relevo de correntes cruzadas, o cadeado enorme
function porta(v) {
  const P = painter(32, 42), s = 39811 + v;
  for (let y = 0; y < 42; y++) for (let x = 0; x < 32; x++) {
    const inA = y > 10 || Math.hypot(x + 0.5 - 16, y + 0.5 - 11) < 16; if (!inA) continue;
    const inD = (y > 12 || Math.hypot(x + 0.5 - 16, y + 0.5 - 12) < 12.5) && x >= 4 && x <= 27 && y >= 1;
    if (!inD) P.put(x, y, RP.pedra, 2.8 + (x < 16 ? 0.6 : -0.3) + cg(x, y, s) * 0.4);
    else P.put(x, y, RP.bronze, 2.6 + (x === 4 ? 1 : 0) + (x === 15 ? -1.4 : x === 16 ? -0.6 : 0) + cg(x, y, s + 1) * 0.35 + (y % 10 === 0 ? 1 : y % 10 === 1 ? -0.6 : 0));
  }
  // as correntes cruzadas em relevo, o cadeado no meio
  P.chain(6, 16, 26, 36, 1.3, 0, RP.ferro, s + 2); P.chain(26, 16, 6, 36, 1.3, 0, RP.ferro, s + 3);
  P.slab(12, 22, 20, 30, RP.ferro, s + 4, 2.8); P.ring(16, 21, 3, 3, 1.2, RP.ferro, 3, s + 5); P.put(16, 26, RP.ferro, 0.2); P.put(16, 27, RP.ferro, 0.2);
  for (let x = 0; x < 32; x++) P.put(x, 41, RP.pedra, 2);
  return P.done();
}
// o relevo: os deuses (figuras altas com auréola) segurando a corrente que ata o lobo deitado, na moldura de bronze
function relevo(v) {
  const P = painter(50, 28), s = 39821 + v, R = RP.pedra;
  P.slab(0, 0, 49, 27, RP.bronze, s, 2.4);
  for (let y = 2; y <= 25; y++) for (let x = 2; x <= 47; x++) P.put(x, y, R, 2.2 + cg(x, y, s + 1) * 0.3);
  // as figuras: dois deuses em pé (cabeça, auréola, manto), puxando
  for (const fx of v ? [8, 41] : [8, 18]) {
    P.ell(fx, 7, 2, 2, R, s + fx, 3.6); P.ring(fx, 7, 3.4, 3.4, 0.8, RP.bronze, 3.6, s + fx + 1);
    for (let y = 9; y <= 24; y++) { const w = 1.5 + (y - 9) * 0.18; for (let x = Math.floor(fx - w); x <= fx + w; x++) P.put(x, y, R, 3.6 - (x - fx) / w * 0.8); }
  }
  // o lobo deitado: o corpo comprido, a cabeça erguida, as orelhas, a corrente no pescoço
  const wx = v ? 24 : 34;
  P.ell(wx, 19, 10, 4, R, s + 3, 3.4); P.ell(wx + 9, 14, 3.6, 3, R, s + 4, 3.6); P.put(wx + 8, 10, R, 4.4); P.put(wx + 10, 10, R, 4.2);
  P.put(wx + 10, 14, RP.runa, 4);
  for (const fx of v ? [8, 41] : [8, 18]) P.chain(fx + 2, 14, wx + 7, 15, 0.9, 1, RP.ferro, s + 5 + fx);
  return P.done();
}
// a racha que pinga ícor: a fenda torta na pedra, o dourado escorrendo, a poça no pé
function rachaIcor(v) {
  const P = painter(16, 32), s = 39831 + v;
  let x = 8;
  for (let y = 0; y < 26; y++) {
    x += Math.round(cg(y, v, s) * 2.4); x = Math.max(4, Math.min(11, x));
    P.put(x - 1, y, RP.rocha, 4); P.put(x, y, RP.icor, 3.6 + (y % 4 === 0 ? 1 : 0)); P.put(x + 1, y, RP.rocha, 1.2);
    if (y > 4 && y % 6 === 2) P.put(x, y + 1, RP.icor, 5);
  }
  for (let xx = 2; xx <= 13; xx++) { const u = (xx - 7.5) / 5.5; P.put(xx, 30, RP.icor, 3.2 + (1 - u * u) * 1.8); P.put(xx, 31, RP.icor, 1.8); }
  return P.done();
}
// o gigante preso: ajoelhado de frente, enorme, a cabeça baixa com a barba de pedra, os braços abertos e os pulsos
// presos por correntes na rocha dos dois lados; a pele virou pedra em placas
function gigantePreso(v) {
  const P = painter(80, 100), s = 39841 + v, R = RP.rocha;
  // as correntes dos pulsos até as bordas
  P.chain(0, 26, 12, 40, 3, 3, RP.ferro, s); P.chain(79, 26, 67, 40, 3, 3, RP.ferro, s + 1);
  // os braços
  P.rod(14, 40, 26, 30, 9, R, 2.6, s + 2); P.rod(66, 40, 54, 30, 9, R, 2.2, s + 3);
  for (const cx of [12, 68]) { P.ell(cx, 41, 5, 6, R, s + cx, 2.6); P.slab(cx - 6, 37, cx + 6, 40, RP.ferro, s + cx + 1, 2.8); }   // os punhos e as algemas
  // o tronco
  P.ell(40, 52, 20, 26, R, s + 4, 2.6, (dx, dy) => Math.abs(dx) < 0.05 && dy > -0.3 && dy < 0.6 ? -1.4 : 0);
  for (let y = 36; y <= 66; y += 6) for (let x = 24; x <= 56; x++) if (P.has(x, y) && (x + y) % 3) P.put(x, y, R, 1.6);
  // a cabeça baixa e a barba
  P.ell(40, 26, 10, 11, R, s + 5, 2.9);
  for (let x = 33; x <= 47; x++) { P.put(x, 25, R, 0.8); }
  P.put(36, 24, RP.icor, 1.6); P.put(44, 24, RP.icor, 1.6);
  for (let y = 30; y <= 46; y++) { const w = 7 - (y - 30) * 0.35; for (let x = Math.floor(40 - w); x <= 40 + w; x++) P.put(x, y, R, 2.6 + ((x + (y >> 1)) % 3 === 0 ? 0.8 : -0.2)); }
  // as pernas dobradas (ajoelhado) e os pés
  P.ell(28, 82, 12, 9, R, s + 6, 2.5); P.ell(52, 82, 12, 9, R, s + 7, 2.1);
  P.slab(14, 90, 66, 99, R, s + 8, 2.1);
  return P.done();
}

const def = (id, nome, apoio, camada, faixas, vs, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: vs, prisao: true }, extra || {}));
const F = 'chao', C = 'teto', Wl = 'parede';
def('pd_estatua', 'Estátua de carcereiro', F, 'frente', ['correntes', 'celas', 'gigantes'], [estatua(0), estatua(1)]);
def('pd_bola', 'Bola de ferro com corrente', F, 'frente', ['correntes', 'celas'], [bola(0), bola(1)]);
def('pd_cepo', 'Cepo de pedra', F, 'frente', ['celas'], [cepo(0), cepo(1)]);
def('pd_ossada', 'Ossada de fera', F, 'frente', ['correntes', 'gigantes', 'tartaro'], [ossada(0), ossada(1)]);
def('pd_elo_partido', 'Elo partido', F, 'frente', ['correntes', 'gigantes'], [eloPartido(0), eloPartido(1)]);
def('pd_coluna_runas', 'Coluna de runas', F, 'frente', ['gigantes', 'tartaro'], [colunaRunas(0), colunaRunas(1)], { luz: [{ x: 7, y: 20, r: 0.5 }], brilho: '#5ab0e8' });
def('pd_espinhos', 'Espinhos de pedra negra', F, 'frente', ['tartaro'], [espinhos(0), espinhos(1)], { tartaro: true });
def('pd_jaula', 'Jaula pendurada', C, 'frente', ['correntes', 'celas', 'gigantes'], [jaula(0), jaula(1)]);
def('pd_prisioneiro', 'Prisioneiro na parede', Wl, 'fundo', ['correntes', 'celas'], [prisioneiro(0), prisioneiro(1)]);
def('pd_grilhoes', 'Grilhões vazios', Wl, 'fundo', ['celas', 'gigantes'], [grilhoes(0), grilhoes(1)]);
def('pd_argolao', 'Argolão de bronze', Wl, 'fundo', ['correntes', 'gigantes', 'tartaro'], [argolao(0), argolao(1)]);
def('pd_porta', 'Porta de bronze selada', F, 'fundo', ['celas', 'tartaro'], [porta(0), porta(1)]);
def('pd_relevo', 'Relevo dos deuses e do lobo', Wl, 'fundo', ['celas', 'gigantes'], [relevo(0), relevo(1)]);
def('pd_racha_icor', 'Racha que pinga ícor', Wl, 'fundo', ['correntes', 'celas', 'tartaro'], [rachaIcor(0), rachaIcor(1)], { luz: [{ x: 8, y: 16, r: 0.55 }], brilho: '#ffb030' });
def('pd_gigante_preso', 'Gigante preso', F, 'fundo', ['gigantes'], [gigantePreso(0)], { salao: true });

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(PD_PROP_PLAN, {
  correntes: { chao: [['pd_estatua', 0.05, 1], ['pd_bola', 0.1, 2], ['pd_elo_partido', 0.07, 1], ['pd_ossada', 0.05, 1]], teto: [['pd_jaula', 0.08, 1]], fundo: [['pd_argolao', 0.08, 1], ['pd_prisioneiro', 0.08, 1], ['pd_racha_icor', 0.06, 1]] },
  celas: { chao: [['pd_bola', 0.1, 2], ['pd_cepo', 0.06, 1], ['pd_estatua', 0.05, 1]], teto: [['pd_jaula', 0.1, 1]], fundo: [['pd_prisioneiro', 0.14, 2], ['pd_grilhoes', 0.12, 2], ['pd_porta', 0.05, 1], ['pd_relevo', 0.05, 1], ['pd_racha_icor', 0.06, 1]] },
  gigantes: { chao: [['pd_ossada', 0.06, 1], ['pd_elo_partido', 0.07, 1], ['pd_coluna_runas', 0.06, 1], ['pd_estatua', 0.05, 1]], teto: [['pd_jaula', 0.05, 1]], fundo: [['pd_gigante_preso', 0.2, 1], ['pd_argolao', 0.06, 1], ['pd_grilhoes', 0.06, 1], ['pd_relevo', 0.05, 1]] },
  tartaro: { chao: [['pd_espinhos', 0.12, 2], ['pd_ossada', 0.05, 1], ['pd_coluna_runas', 0.05, 1]], teto: [], fundo: [['pd_porta', 0.05, 1], ['pd_racha_icor', 0.07, 1], ['pd_argolao', 0.05, 1]] }
});
Object.assign(PDART, { propPainter: painter, RP });
}
