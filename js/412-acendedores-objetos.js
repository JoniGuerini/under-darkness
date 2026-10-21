'use strict';

/* ================= As Ruínas dos Acendedores: objetos de cena =================
   Tudo o que é maior que um bloco e veste a cidade (docs/camadas/19-ruinas-acendedores.md, seção 5): 21 objetos.
   Nos Faróis Caídos: a lente de farol rachada, o sino de farol caído, a pira de farol apagada (o cesto de ferro no
   pedestal), o estandarte queimado da guilda e o pedaço de escadaria em caracol.
   Nas Ruas de Cinza: a carroça de carvão tombada, o poço de rua, a estátua de Acendedor sem cabeça, a placa da guilda
   pendurada, os barris de óleo de lamparina e o varal de lanternas apagadas.
   Nos Templos da Chama: o altar da chama, o disco do Sol em bronze, o incensário de pé, o lampadário de teto e o nicho
   de urnas de cinza.
   Na Fornalha do Mundo: a bigorna gigante, o fole quebrado, o cadinho tombado com a escória ainda em brasa, a pilha de
   lingotes e a boca de forno (a Fornalha ainda arde no fundo: a escória e o forno são a última chama do mundo, a luz
   que nasce do lugar).
   O pintor do 282 (rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, grão). Registrados com
   defProp (`acend: true`), postos pelo 415 a partir do AC_PROP_PLAN. Flags: templo (só nas salas de templo), forja (só
   nas salas da Fornalha). */
const AC_PROP_PLAN = {};
// peças de fundo que ficam em pé no chão em vez de penduradas na altura dos olhos
const AC_BACK_FLOOR = { ac_escadaria: 1, ac_urnas: 1, ac_forno: 1 };
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  pedra: ['#2a241c', '#3a3226', '#4c4232', '#625640', '#7c6e52', '#9a8a68'],
  rocha: ['#141210', '#211d19', '#2f2a24', '#3f3830', '#51493e', '#665c4e'],
  ferro: ['#121112', '#1e1c1d', '#2c2a2a', '#3e3a3a', '#545050', '#706a66'],
  ferrugem: ['#1e0e08', '#341a0e', '#4c2816', '#643822', '#7c4a30', '#946044'],
  bronze: ['#1a120a', '#2e2010', '#46321a', '#604626', '#7e5e34', '#a07c48'],
  ouro: ['#3a2410', '#5e3c18', '#8a5c24', '#b88434', '#dcaa4e', '#f4d27e'],
  vidro: ['#1a2224', '#2a3a3c', '#3e5458', '#5a7478', '#86a0a2', '#c4d8d6'],
  madeira: ['#140d08', '#22160c', '#342214', '#48301c', '#5c4026', '#745234'],
  pano: ['#160c0a', '#281410', '#3c1e16', '#52281c', '#6a3422', '#84442c'],
  ocre: ['#3a1a0c', '#5e2a12', '#86401c', '#b05c2a', '#d07e3e', '#e8a660'],
  cinza: ['#262422', '#383532', '#4c4844', '#625d57', '#7c766e', '#98928a'],
  cera: ['#3a3226', '#5a4e3a', '#7e7056', '#a49474', '#c8b896', '#e8dcb8'],
  carvao: ['#060505', '#0e0c0b', '#181513', '#221e1b', '#2e2925', '#3c3530'],
  tijolo: ['#2a120a', '#44200f', '#5e2e16', '#7a3e1f', '#965230', '#b06a44'],
  escoria: ['#08080a', '#111115', '#1a1a20', '#25252d', '#33333d', '#4a4a56'],
  osso: ['#3a352a', '#5a5444', '#7e7660', '#a29880', '#c8bca0', '#e8e0c8'],
  couro: ['#1a100a', '#2c1c12', '#40281a', '#563622', '#6e462c', '#885a3a'],
  agua: ['#06080a', '#0c1014', '#141a20', '#1e262e', '#2a343e', '#3a4652']
};
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#06050a');
const BRASA = { miolo: '#fff0c0', claro: '#ffbe5a', luz: '#f08a2a', fundo: '#c05a18', escuro: '#7a2a0c' };

/* ---- o pintor (o do 252/282): rid -2 marca um pixel de cor pura que acende ---- */
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
    line(x0, y0, x1, y1, R, v) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) P.put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, R, typeof v === 'function' ? v(i / n) : v); },
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
// uma mancha sobre o que já está pintado (fuligem, cinza, ferrugem); só nas rampas de on (ou em tudo)
function stain(P, R, cover, s, bias, lift = 0, on = null) {
  const me = P.idOf(R);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0 || P.rid[k] === me) continue;
    if (on && !on.includes(P.ramps[P.rid[k]])) continue;
    const n = cn(x, y, 12, 12, s) + cn(x, y, 40, 40, s + 1) * 0.5 + (bias ? bias(x, y) : 0);
    if (n > 0.5 - cover) P.put(x, y, R, 0.9 + P.val[k] * 0.55 + cg(x, y, s + 2) * 0.7 + lift);
  }
}
// a cinza assentada: pega no que olha para cima; a fuligem: sobe do pé
const ash = (P, cover, s, on) => stain(P, RP.cinza, cover, s, (x, y) => P.has(x, y - 1) ? (P.has(x, y - 3) ? -0.3 : 0.15) : 0.5, 0.4, on);
const soot = (P, cover, s, on) => stain(P, RP.carvao, cover, s, (x, y) => (y / P.h - 0.5) * 0.8, 0.6, on);
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
function scatter(P, x0, x1, by, n, R, s) { for (let k = 0; k < n; k++) { const x = x0 + hash2(k, 0, s) * (x1 - x0), w = 1 + hash2(k, 1, s) * 2.2; P.blob(x, by - 0.6, w, 0.9, R, s + k, 2.4); } }
// um bloco de pedra lavrada: a face com o chanfro aceso em cima e à esquerda
function ashlar(P, x0, y0, w, h, R, s, base = 2.8) { P.rect(x0, y0, w, h, R, (i, j) => base + (i === 0 || j === 0 ? 1.3 : 0) - (i === w - 1 || j === h - 1 ? 1.1 : 0) + cg(x0 + i, y0 + j, s) * 0.45 - j / h * 0.3); }
// um chão de cinza na base de tudo
function ashFloor(P, x0, x1, s) { for (let x = x0; x < x1; x++) { const h = 1 + (hash2(x, 0, s) < 0.4 ? 1 : 0); for (let k = 0; k < h; k++) P.put(x, P.h - 1 - k, RP.cinza, 2.8 + (k === h - 1 ? 1 : 0) + cg(x, k, s) * 0.5); } }

/* =============================== Os Faróis Caídos =============================== */
// a lente de farol rachada: um disco de vidro grosso em anéis (a lente de degraus) num aro de bronze, encostada torta
function lens(k) {
  const W = 30, H = 32, P = painter(W, H), s = 41201 + k, cx = 15, cy = 15, r = 13.5;
  P.ell(cx, cy, r, r, (x, y, dx, dy, d) => {
    const rr = Math.sqrt(d);
    if (rr > 0.86) { P.put(x, y, RP.bronze, 3.2 - (dx + dy) * 1.4 + cg(x, y, s) * 0.4); return; }
    const ring = Math.floor(rr * 6), f = rr * 6 - ring;
    P.put(x, y, RP.vidro, 1.6 + (f < 0.25 ? 2.4 : 0) - (dx + dy) * 0.9 + (ring === 0 ? 0.6 : 0) + cg(x, y, s) * 0.25);
  });
  for (let a = 0; a < 6.28; a += 0.7) P.put(cx + Math.cos(a) * r * 0.93, cy + Math.sin(a) * r * 0.93, RP.ouro, 4.4);   // os rebites do aro
  // a rachadura: uma linha clara de canto a canto, com a lasca faltando
  for (let t = 0; t < 1; t += 0.03) { const x = 6 + t * 18 + Math.sin(t * 9) * 1.2, y = 6 + t * 17; P.put(x, y, RP.vidro, 5); P.put(x + 1, y, RP.vidro, 0.6); }
  if (k) for (let y = 3; y < 9; y++) for (let x = 20; x < 27; x++) if (x - 20 > y - 3 && P.has(x, y)) P.clear(x, y);
  // o pé: tombada no chão, um calço de pedra
  ashlar(P, 2, 27, 8, 4, RP.pedra, s + 3); ashFloor(P, 0, W, s + 4);
  soot(P, 0.15, s + 5, [RP.bronze]); ash(P, 0.1, s + 6);
  return P.done();
}
// o sino de farol caído: bronze de lado, a boca para a esquerda, a rachadura, o badalo caído fora
function bell(k) {
  const W = 30, H = 24, P = painter(W, H), s = 41211 + k;
  for (let x = 2; x < 26; x++) {
    const t = (x - 2) / 24, hw = 4 + Math.pow(1 - t, 1.6) * 6.4 + (t < 0.08 ? 1.5 : 0), cy = 13;
    for (let y = Math.round(cy - hw); y <= Math.round(cy + hw); y++) { const v = (y - cy) / hw; P.put(x, y, RP.bronze, 3.4 - v * 1.6 - t * 0.4 + (Math.abs(v) > 0.86 ? -0.8 : 0) + cg(x, y, s) * 0.35 + (Math.abs(t - 0.35) < 0.02 ? 1.2 : 0)); }
  }
  for (let y = 4; y <= 22; y++) P.put(2, y, RP.carvao, 1);                                                // a boca escura
  P.ell(27, 13, 2.4, 3, (x, y, dx, dy) => P.put(x, y, RP.ferro, 3.6 - dx - dy));                           // a argola
  for (let t = 0; t < 1; t += 0.06) P.put(12 + t * 6, 6 + t * 5 + Math.sin(t * 7), RP.carvao, 0.8);        // a rachadura
  tube(P, lin([k ? 4 : 22, 21], [k ? 9 : 27, 21]), () => 2, RP.ferro, s + 2);                              // o badalo
  ashFloor(P, 0, W, s + 3); soot(P, 0.2, s + 4, [RP.bronze]); ash(P, 0.12, s + 5);
  return P.done();
}
// a pira de farol apagada: o cesto de ferro batido no alto de um pedestal de pedra, a cinza e o carvão morto dentro
function pyre(k) {
  const W = 30, H = 46, P = painter(W, H), s = 41221 + k;
  for (let j = 0; j < 4; j++) ashlar(P, 9 - (j === 3 ? 2 : 0), 24 + j * 5, 12 + (j === 3 ? 4 : 0), 5, RP.pedra, s + j);
  ashlar(P, 7, 21, 16, 3, RP.pedra, s + 9, 3.2);
  // o cesto: aros e varões de ferro, aberto em cima
  for (let y = 4; y < 21; y++) { const t = (y - 4) / 17, hw = 13 - t * 6; for (const sg of [-1, 1]) P.put(15 + sg * hw, y, RP.ferro, sg < 0 ? 4.2 : 2.4); for (let x = -3; x <= 3; x++) if ((y % 6) === 0 || Math.abs(x * hw / 3.4 - Math.round(x * hw / 3.4)) < 0.4) P.put(15 + x * hw / 3.4, y, RP.ferro, 3.2 - x * 0.2); }
  for (let x = 2; x < 28; x++) { P.put(x, 4, RP.ferro, 4.8 - (x - 2) * 0.08); P.put(x, 3, RP.ferro, 3.4); }
  for (let x = 4; x < 26; x++) { const h = 2 + (hash2(x, 1, s) * 3 | 0); for (let y = 5 - h; y < 6; y++) P.put(x, y, (x + y) % 3 ? RP.cinza : RP.carvao, 3 + cg(x, y, s)); }
  if (k) { for (let y = 8; y < 14; y++) P.clear(24 - (y - 8) * 0.2, y); }                                    // um varão partido
  ashFloor(P, 4, 26, s + 5); soot(P, 0.3, s + 6, [RP.pedra]); cracks(P, 3, s + 7, [RP.pedra]);
  return P.done();
}
// o estandarte da guilda queimado: a haste de ferro, o pano vermelho com a chama bordada em ocre, a barra comida pelo fogo
function banner(k) {
  const W = 20, H = 40, P = painter(W, H), s = 41231 + k;
  tube(P, lin([0, 2], [20, 2]), () => 2, RP.ferro, s);
  for (let y = 3; y < 38; y++) for (let x = 2; x < 18; x++) {
    const burn = 30 + Math.sin(x * 1.3 + k) * 3 + hash2(x, 5, s) * 4; if (y > burn) continue;
    const edge = y > burn - 1.5;
    let v = 2.8 - (x - 10) * 0.06 + Math.sin(x * 0.9) * 0.4 + cg(x, y, s) * 0.4;
    const fx = x - 10, fy = y - 18, flame = Math.abs(fx) < 5 - fy * 0.35 + Math.sin(fy * 0.8) * 1.2 && fy > -8 && fy < 10;
    P.put(x, y, edge ? RP.carvao : flame ? RP.ocre : RP.pano, edge ? 2 : flame ? v + 0.8 + (Math.abs(fx) < 2 && fy > 0 ? 1 : 0) : v);
  }
  for (const x of [2, 17]) for (let y = 3; y < 8; y++) P.put(x, y, RP.ouro, 3.2);                         // a franja de cima
  soot(P, 0.25, s + 3); chip(P, 0.25, s + 4);
  return P.done();
}
// o pedaço de escadaria em caracol: degraus de pedra saindo de um pilar, subindo e acabando no ar
function spiral(k) {
  const W = 34, H = 48, P = painter(W, H), s = 41241 + k;
  for (let y = 0; y < H; y++) for (let x = 15; x < 20; x++) P.put(x, y, RP.pedra, 2.6 + (x === 15 ? 1.2 : x === 19 ? -0.8 : 0) + cg(x, y, s) * 0.4 + ((y % 8) === 0 ? -1 : 0));
  for (let j = 0; j < 9; j++) {
    const y = H - 4 - j * 5, a = j * 0.85 + k, dx = Math.cos(a), x0 = 17 + dx * 2, x1 = 17 + dx * 15, xs = Math.min(x0, x1), xe = Math.max(x0, x1);
    if (j > 6 && k) break;
    for (let x = Math.round(xs); x <= Math.round(xe); x++) { P.put(x, y, RP.pedra, 4.2); P.put(x, y + 1, RP.pedra, 2.8); P.put(x, y + 2, RP.pedra, 1.6); }
  }
  soot(P, 0.2, s + 2); chip(P, 0.15, s + 3);
  return P.done();
}

/* =============================== As Ruas de Cinza =============================== */
// a carroça de carvão tombada: a caixa de tábuas de lado, uma roda no chão e outra no ar, o carvão espalhado
function cart(k) {
  const W = 40, H = 24, P = painter(W, H), s = 41301 + k;
  for (let y = 4; y < 18; y++) for (let x = 6; x < 32; x++) {   // a caixa tombada (tábuas na vertical: está de lado)
    const plank = (x - 6) % 6, v = 2.6 + (plank === 0 ? 1 : plank === 5 ? -1 : 0) + cg(x, y, s) * 0.5 - (y - 4) * 0.03;
    if (y === 4 || y === 17) { P.put(x, y, RP.ferro, y === 4 ? 4 : 1.8); continue; }
    P.put(x, y, RP.madeira, v);
  }
  const wheel = (cx, cy, r) => P.ell(cx, cy, r, r, (x, y, dx, dy, d) => { const rr = Math.sqrt(d), a = Math.atan2(dy, dx); if (rr > 0.78) P.put(x, y, RP.ferro, 3.6 - (dx + dy) * 1.2); else if (rr < 0.2) P.put(x, y, RP.ferro, 4); else if (Math.abs(Math.sin(a * 3)) < 0.18) P.put(x, y, RP.madeira, 3.2 - dy); });
  wheel(10, 18, 5.4); wheel(k ? 30 : 33, k ? 6 : 8, 5);
  for (let i = 0; i < 9; i++) P.blob(20 + hash2(i, 0, s) * 18, 21 + hash2(i, 1, s) * 2, 1.6 + hash2(i, 2, s), 1.2, RP.carvao, s + i, 2.6);
  ashFloor(P, 0, W, s + 9); soot(P, 0.18, s + 10, [RP.madeira]);
  return P.done();
}
// o poço de rua: o parapeito redondo de pedra, as duas forquilhas de ferro com o sarilho, o balde pendurado
function well(k) {
  const W = 30, H = 36, P = painter(W, H), s = 41311 + k;
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) ashlar(P, 3 + i * 8 + (j & 1) * 4 - 2, 22 + j * 4, 8, 4, RP.pedra, s + i + j * 3);
  for (let x = 2; x < 28; x++) P.put(x, 21, RP.pedra, 4.6);
  for (const x0 of [4, 25]) tube(P, lin([x0, 21], [x0, 4]), () => 2, RP.ferro, s + x0);
  tube(P, lin([4, 5], [25, 5]), () => 2.6, RP.madeira, s + 7);
  for (let y = 6; y < (k ? 15 : 12); y++) P.put(15, y, RP.couro, 3);
  P.rect(12, k ? 15 : 12, 7, 5, RP.madeira, (i, j) => 2.8 + (i === 0 ? 1 : i === 6 ? -1 : 0) + (j === 0 || j === 3 ? 0.8 : 0));
  ashFloor(P, 0, W, s + 9); soot(P, 0.2, s + 10, [RP.pedra]);
  return P.done();
}
// a estátua de Acendedor sem cabeça: o manto esculpido, a mão erguida com a tocha de pedra, a cabeça caída ao pé
function statue(k) {
  const W = 26, H = 50, P = painter(W, H), s = 41321 + k;
  ashlar(P, 3, 42, 20, 7, RP.pedra, s, 3);
  for (let y = 12; y < 42; y++) { const t = (y - 12) / 30, hw = 4 + t * 4.4; for (let x = Math.round(13 - hw); x <= Math.round(13 + hw); x++) { const u = (x - 13) / hw; P.put(x, y, RP.pedra, 3.4 - u * 1.4 + (Math.abs(Math.sin(x * 1.1 + y * 0.05)) < 0.2 ? -1 : 0) + cg(x, y, s) * 0.3); } }
  P.blob(13, 12, 4.6, 2.4, RP.pedra, s + 1, 3);                                                             // os ombros
  P.rect(11, 8, 5, 3, RP.pedra, (i, j) => j === 0 ? 1.4 : 2.4);                                             // o toco do pescoço
  tube(P, bez([17, 13], [21, 10], [22, 5], [21, 2]), t => 3 - t, RP.pedra, s + 2);                          // o braço erguido
  P.rect(19, 0, 5, 3, RP.pedra, (i, j) => 3.8 - i * 0.3);                                                   // a tocha de pedra
  P.blob(k ? 4 : 21, 47, 3.4, 2.6, RP.pedra, s + 3, 2.8); P.put(k ? 3 : 20, 47, RP.carvao, 1);              // a cabeça no chão
  soot(P, 0.3, s + 4); cracks(P, 4, s + 5); ash(P, 0.15, s + 6); chip(P, 0.12, s + 7);
  return P.done();
}
// a placa da guilda: o braço de ferro torcido saindo do teto, a placa de madeira com a chama pintada
function sign(k) {
  const W = 22, H = 22, P = painter(W, H), s = 41331 + k;
  tube(P, lin([3, 0], [3, 5]), () => 1.6, RP.ferro, s);
  tube(P, bez([3, 5], [8, 4], [14, 4], [19, 5]), () => 1.6, RP.ferro, s + 1);
  for (const x of [6, 17]) for (let y = 6; y < 9; y++) P.put(x, y, RP.ferro, 3);
  P.rect(3, 9, 17, 11, RP.madeira, (i, j, x, y) => { const fx = x - 11.5, fy = y - 15, fl = Math.abs(fx) < 3.6 - fy * 0.4 + Math.sin(fy) * 0.6 && fy > -4 && fy < 4; return fl ? null : 2.6 + (i === 0 || j === 0 ? 1 : 0) - (i === 16 || j === 10 ? 1 : 0) + cg(x, y, s) * 0.5; });
  for (let y = 11; y < 19; y++) for (let x = 7; x < 17; x++) if (!P.has(x, y)) P.put(x, y, RP.ocre, 3.4 - (y - 11) * 0.15 + (Math.abs(x - 11.5) < 1.5 ? 1 : 0));
  if (k) for (let y = 15; y < 20; y++) P.clear(19 - (y - 15) * 0.6, y);
  soot(P, 0.25, s + 3);
  return P.done();
}
// os barris de óleo de lamparina: dois em pé e um deitado, aros de ferro, o óleo escorrido escuro
function barrels(k) {
  const W = 30, H = 22, P = painter(W, H), s = 41341 + k;
  const stand = (x0, y0, w, h) => P.rect(x0, y0, w, h, RP.madeira, (i, j) => { const u = (i + 0.5) / w * 2 - 1, hoop = j === 2 || j === h - 3; return hoop ? null : 3 - u * 1.6 + Math.sin(i * 1.7) * 0.3 - Math.abs(j / h - 0.5) * 0.4; });
  const hoops = (x0, y0, w, h) => { for (let i = 0; i < w; i++) for (const j of [2, h - 3]) P.put(x0 + i, y0 + j, RP.ferro, 3.6 - (i / w) * 1.6); };
  stand(2, 6, 9, 15); hoops(2, 6, 9, 15); stand(11, 9, 8, 12); hoops(11, 9, 8, 12);
  if (k) { P.ell(24, 17, 5, 4, (x, y, dx, dy) => P.put(x, y, RP.madeira, 3 - dy * 1.4 - dx * 0.4 + (Math.abs(dx) > 0.55 && Math.abs(dx) < 0.7 ? -1.4 : 0))); P.ell(19.5, 17, 1.6, 4, (x, y) => P.put(x, y, RP.madeira, 4)); }
  for (let x = 4; x < 9; x++) P.put(x, 21, RP.carvao, 0.6);
  ashFloor(P, 0, W, s + 1); soot(P, 0.2, s + 2, [RP.madeira]);
  return P.done();
}
// o varal de lanternas apagadas: uma corrente de ponta a ponta com lanternas de chifre penduradas
function lanternLine(k) {
  const W = k ? 52 : 40, H = 18, P = painter(W, H), s = 41351 + k;
  const sag = t => 1 + Math.sin(t * Math.PI) * 4;
  for (let x = 0; x < W; x++) P.put(x, sag(x / W), RP.ferro, (x % 3 === 0 ? 4 : 2.6));
  for (let x = 5; x < W - 4; x += 9) {
    const y0 = Math.round(sag(x / W)) + 1;
    P.put(x, y0, RP.ferro, 3); P.put(x, y0 + 1, RP.ferro, 3);
    P.rect(x - 2, y0 + 2, 5, 1, RP.ferro, () => 4); P.rect(x - 2, y0 + 8, 5, 1, RP.ferro, () => 2.4);
    P.rect(x - 2, y0 + 3, 5, 5, RP.cera, (i, j) => i === 0 || i === 4 ? null : 2.4 - i * 0.3 + (hash2(x, j, s) < 0.2 ? -1 : 0));
    for (let j = 3; j < 8; j++) { P.put(x - 2, y0 + j, RP.ferro, 4); P.put(x + 2, y0 + j, RP.ferro, 2.2); }
  }
  return P.done();
}

/* =============================== Os Templos da Chama =============================== */
// o altar da chama: o bloco de pedra lavrada com a faixa de chamas em relevo, a bacia de bronze fria em cima
function altar(k) {
  const W = 34, H = 22, P = painter(W, H), s = 41401 + k;
  ashlar(P, 3, 8, 28, 13, RP.pedra, s, 3);
  for (let x = 5; x < 29; x++) { const h = 2.4 + Math.sin(x * 0.9) * 1.6; for (let y = 13; y < 13 + h; y++) P.put(x, y, RP.pedra, 4.4 - (y - 13) * 0.5); }   // as chamas em relevo
  P.rect(1, 6, 32, 2, RP.pedra, (i, j) => j === 0 ? 4.6 : 2.4);
  P.ell(17, 5, 8, 2.6, (x, y, dx, dy) => { if (dy > -0.3) P.put(x, y, RP.bronze, 3.6 - dx * 1.2 - dy); });
  for (let x = 11; x < 23; x++) P.put(x, 4, RP.cinza, 3.4 + hash2(x, 0, s));
  if (k) { P.ell(26, 4, 1.4, 1.8, (x, y, dx, dy) => P.put(x, y, RP.cera, 4 - dx)); P.put(26, 1, RP.carvao, 1); }
  soot(P, 0.25, s + 2); cracks(P, 3, s + 3, [RP.pedra]); ash(P, 0.1, s + 4);
  return P.done();
}
// o disco do Sol em bronze: o sol dos Acendedores, raios em chama, a cara gasta no meio; preto de fuligem, o relevo claro
function sunDisc(k) {
  const W = 38, H = 38, P = painter(W, H), s = 41411 + k, cx = 19, cy = 19;
  P.ell(cx, cy, 18, 18, (x, y, dx, dy, d) => {
    const r = Math.sqrt(d) * 18, a = Math.atan2(dy, dx), ray = r > 10 && r < 17.5 && Math.abs(Math.sin(a * 6 + Math.sin(r * 0.6) * 0.6)) > 0.7;
    if (r < 9.6) P.put(x, y, RP.bronze, 3.6 - (dx + dy) * 1.6 + (r > 8.6 ? 1 : 0) + cg(x, y, s) * 0.3);
    else if (ray) P.put(x, y, RP.bronze, 3.2 - (dx + dy) * 1.2 + cg(x, y, s) * 0.3);
  });
  P.put(16, 17, RP.carvao, 1); P.put(22, 17, RP.carvao, 1); for (let x = 16; x <= 22; x++) P.put(x, 22 + (x === 16 || x === 22 ? -1 : 0), RP.carvao, 1.4);   // a cara
  soot(P, 0.3, s + 2, [RP.bronze]);
  for (let a = 0; a < 6.28; a += 0.4) if (hash2(a * 10 | 0, 0, s) < 0.6) P.put(cx + Math.cos(a) * 8.8, cy + Math.sin(a) * 8.8, RP.ouro, 4.6);   // o ouro gasto da borda
  if (k) chip(P, 0.3, s + 3);
  return P.done();
}
// o incensário de pé: a haste de bronze, a taça com a tampa furada, os três pés de garra, cinza fria dentro
function censer(k) {
  const W = 14, H = 32, P = painter(W, H), s = 41421 + k;
  tube(P, lin([7, 10], [7, 28]), t => 2 + Math.sin(t * 12) * 0.5, RP.bronze, s);
  for (const [a, b] of [[[7, 28], [2, 31]], [[7, 28], [12, 31]], [[7, 28], [7, 31]]]) tube(P, lin(a, b), () => 1.6, RP.bronze, s + a[0] + b[0]);
  P.ell(7, 8, 5.6, 3.4, (x, y, dx, dy) => P.put(x, y, RP.bronze, 3.4 - dx * 1.4 - dy * 0.8 + (dy > 0.3 && dy < 0.5 ? 1 : 0)));
  P.ell(7, 4.6, 4.4, 2.6, (x, y, dx, dy) => P.put(x, y, RP.bronze, (hash2(x, y, s) < 0.25 ? 0.6 : 3.8) - dx - dy));
  P.put(7, 1, RP.bronze, 4.4); P.put(7, 2, RP.bronze, 3.6);
  if (k) for (let y = 12; y < 30; y++) if (hash2(y, 1, s) < 0.4) P.put(7 + (hash2(y, 2, s) < 0.5 ? -1 : 1), y, RP.carvao, 2);
  soot(P, 0.2, s + 3);
  return P.done();
}
// o lampadário de teto: três correntes descendo até o aro de ferro com os copos de vela, a cera escorrida pendurada
function chandelier(k) {
  const W = 40, H = 30, P = painter(W, H), s = 41431 + k;
  for (const x0 of [4, 20, 36]) tube(P, lin([20, 0], [x0, 18]), () => 1, RP.ferro, s + x0);
  P.ell(20, 19, 18, 3.2, (x, y, dx, dy, d) => { if (d > 0.55) P.put(x, y, RP.ferro, 3.6 - dy * 1.6 - dx * 0.5); });
  for (let x = 3; x < 38; x += 5) {
    const y = 16 + Math.round(Math.sin((x - 20) / 18 * 1.57) * 0) ; P.rect(x - 1, y, 3, 3, RP.bronze, (i, j) => 3.4 - i * 0.6 + (j === 0 ? 0.8 : 0));
    const L = 2 + ((hash2(x, 0, s) * 7) | 0); for (let j = 0; j < L; j++) P.put(x, 22 + j, RP.cera, 4.4 - j * 0.3);
  }
  if (k) for (let y = 19; y < 24; y++) P.clear(38 - (y - 19), y);
  soot(P, 0.2, s + 2, [RP.ferro, RP.bronze]);
  return P.done();
}
// o nicho de urnas de cinza: o arco de pedra lavrada, a prateleira com as urnas de barro com os nomes riscados
function urns(k) {
  const W = 36, H = 30, P = painter(W, H), s = 41441 + k;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = (x + 0.5 - 18) / 18, top = 8 * (1 - Math.sqrt(Math.max(0, 1 - u * u))) + 2, inside = x > 3 && x < W - 4 && y > top + 2 && y < H - 3;
    if (y < top) continue;
    if (inside) P.put(x, y, RP.carvao, 1.2 + cg(x, y, s) * 0.4 + (y < top + 4 ? -0.4 : 0));
    else P.put(x, y, RP.pedra, 3.2 + ((x + Math.floor(y / 5) * 3) % 7 === 0 ? -1.2 : 0) + (y < top + 1.5 ? 1 : 0) + cg(x, y, s) * 0.4);
  }
  P.rect(4, 18, 28, 2, RP.pedra, (i, j) => j === 0 ? 4.4 : 2.2);
  for (let i = 0; i < (k ? 5 : 4); i++) {
    const cx = 7 + i * 6, h = 6 + (hash2(i, 0, s) * 3 | 0);
    P.ell(cx, 18 - h / 2, 2.4, h / 2, (x, y, dx, dy) => P.put(x, y, RP.ocre, 3 - dx * 1.4 - dy * 0.8 + (Math.abs(dy) < 0.12 ? -1.2 : 0)));
    P.rect(cx - 1, 18 - h - 1, 3, 1, RP.ocre, () => 3.6);
  }
  soot(P, 0.18, s + 2, [RP.pedra]); ash(P, 0.12, s + 3);
  return P.done();
}

/* =============================== A Fornalha do Mundo =============================== */
// a bigorna gigante: o corpo de ferro com o chifre, o pé de pedra, o martelo encostado
function anvil(k) {
  const W = 40, H = 26, P = painter(W, H), s = 41501 + k;
  ashlar(P, 10, 18, 20, 7, RP.pedra, s, 2.8);
  P.rect(13, 11, 14, 7, RP.ferro, (i, j) => 3 - (i / 14) * 1 + (j === 0 ? 1.2 : 0) - (j > 4 ? 0.8 : 0));
  P.rect(6, 5, 28, 6, RP.ferro, (i, j) => 3.4 - i * 0.03 + (j === 0 ? 1.4 : 0) - (j === 5 ? 1.2 : 0));
  tube(P, bez([6, 7], [3, 7], [1, 8], [0, 9]), t => 4 - t * 3, RP.ferro, s + 1);                              // o chifre
  tube(P, lin([k ? 34 : 33, 25], [k ? 38 : 37, 10]), () => 2, RP.madeira, s + 2);
  P.rect(k ? 35 : 34, 7, 6, 4, RP.ferro, (i, j) => 3.6 - i * 0.2 + (j === 0 ? 0.8 : 0));
  stain(P, RP.ferrugem, 0.12, s + 3, null, 0.4, [RP.ferro]); ashFloor(P, 0, W, s + 4);
  return P.done();
}
// o fole quebrado: as duas tábuas em pera, o couro rasgado entre elas, o bico de ferro
function bellows(k) {
  const W = 38, H = 20, P = painter(W, H), s = 41511 + k;
  const board = (y0, d) => { for (let x = 4; x < 30; x++) { const t = (x - 4) / 26, hw = 7 - t * 4.6; for (let j = 0; j < 2; j++) P.put(x, y0 + d * j, RP.madeira, 3.2 - t * 0.5 + (j === 0 ? 0.8 : -0.6) + cg(x, j, s) * 0.4); void hw; } };
  board(5, 1); board(14, 1);
  for (let x = 5; x < 28; x++) for (let y = 7; y < 14; y++) { const torn = k && x > 14 && x < 20 && y > 8 && y < 12; if (torn) continue; P.put(x, y, RP.couro, 2.6 + Math.sin(x * 0.8) * 0.6 - (y - 7) * 0.1 + cg(x, y, s) * 0.5); }
  tube(P, lin([30, 10], [37, 10]), t => 3 - t, RP.ferro, s + 1);
  tube(P, lin([4, 5], [0, 2]), () => 1.6, RP.madeira, s + 2); tube(P, lin([4, 16], [0, 19]), () => 1.6, RP.madeira, s + 3);
  ashFloor(P, 0, W, s + 4); soot(P, 0.15, s + 5);
  return P.done();
}
// o cadinho tombado: a panela grossa de barro refratário de lado, a escória que escorreu e ainda está em brasa
function crucible(k) {
  const W = 34, H = 22, P = painter(W, H), s = 41521 + k;
  P.ell(12, 11, 10, 9, (x, y, dx, dy, d) => { if (dx > 0.62) return; P.put(x, y, RP.tijolo, 3.2 - (dx + dy) * 1.2 - d * 0.4 + cg(x, y, s) * 0.4); });
  for (let y = 3; y < 20; y++) P.put(18, y, RP.tijolo, 1.6);
  // a escória escorrida: o vidro preto por fora, a brasa por dentro (pixels que acendem), mais quente perto da boca
  for (let x = 17; x < 33; x++) {
    const t = (x - 17) / 16, h = Math.round(4 - t * 2.6 + Math.sin(x * 0.9) * 0.6);
    for (let j = 0; j < h; j++) {
      const y = 20 - j, hot = j < h - 1 && hash2(x, j, s) < 0.75 - t * 0.6;
      if (hot) P.N(x, y, t < 0.3 && j === 0 ? BRASA.miolo : t < 0.5 ? BRASA.claro : BRASA.luz); else P.put(x, y, RP.escoria, 2.6 + (j === h - 1 ? 1.4 : 0));
    }
  }
  P.mark('brasa', 22, 18, { w: 10 });
  ashFloor(P, 0, 17, s + 2); soot(P, 0.2, s + 3, [RP.tijolo]);
  return P.done();
}
// a pilha de lingotes: barras de ferro em grade cruzada, as de cima de ardorita (o brilho quente fraco)
function ingots(k) {
  const W = 30, H = 18, P = painter(W, H), s = 41531 + k;
  for (let j = 0; j < 4; j++) {
    const y = 15 - j * 4, n = 4 - (j >> 1), off = (j & 1) * 3 + j * 1.5;
    for (let i = 0; i < n; i++) { const x0 = Math.round(2 + off + i * 7), top = j === 3 && k; P.rect(x0, y, 6, 3, top ? RP.ouro : RP.ferro, (a, b) => 3.2 - a * 0.25 + (b === 0 ? 1.2 : 0) - (b === 2 ? 1 : 0) + (a === 0 ? 0.6 : 0)); }
  }
  stain(P, RP.ferrugem, 0.15, s + 1, null, 0.3, [RP.ferro]); ashFloor(P, 0, W, s + 2);
  return P.done();
}
// a boca de forno: o arco de tijolo refratário na parede, a porta de ferro meio aberta, as brasas no fundo (acendem)
function furnace(k) {
  const W = 40, H = 40, P = painter(W, H), s = 41541 + k;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = (x + 0.5 - 20) / 20, top = 10 * (1 - Math.sqrt(Math.max(0, 1 - u * u))), row = Math.floor(y / 4), bx = (x + (row & 1) * 4) % 8, by = y % 4;
    if (y < top) continue;
    const mouth = Math.abs(x + 0.5 - 20) < 10 && y > 16 - Math.sqrt(Math.max(0, 100 - (x + 0.5 - 20) ** 2)) * 0.8 + 6 && y < H - 4;
    if (mouth) {
      const deep = (y - 14) / 22, hot = hash2(x, y, s) < 0.12 + deep * 0.5;
      if (y > H - 10 && hot) P.N(x, y, hash2(x, y, s + 1) < 0.3 ? BRASA.claro : BRASA.luz);
      else if (y > H - 8) P.put(x, y, RP.carvao, 2 + hash2(x, y, s) * 1.5);
      else P.put(x, y, RP.carvao, 0.6 + deep * 0.8);
      continue;
    }
    P.put(x, y, RP.tijolo, 2.8 + (by === 3 || bx === 7 ? -1.6 : 0) + (by === 0 ? 0.6 : 0) + cg(x, y, s) * 0.5);
  }
  // a porta de ferro meio aberta, pendurada na dobradiça da esquerda
  P.rect(k ? 6 : 8, 16, 5, 18, RP.ferro, (i, j) => 3 - i * 0.3 + (j % 6 === 0 ? 1 : 0));
  P.mark('brasa', 12, H - 7, { w: 16 });
  soot(P, 0.35, s + 2, [RP.tijolo]);
  return P.done();
}

/* =============================== registro =============================== */
// assa os pixels de luz pura de cada variação (a brasa da escória e do forno) para o drawGlow
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
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), acend: true, acLuz: Ps.map(bakeLuz), acPts: Ps.map(P => P.pts) }, extra || {}));
};
// Os Faróis Caídos
def('ac_lente', 'Lente de farol rachada', F, 'frente', ['farois'], [lens(0), lens(1)]);
def('ac_sino', 'Sino de farol caído', F, 'frente', ['farois', 'ruas'], [bell(0), bell(1)]);
def('ac_pira_fria', 'Pira de farol apagada', F, 'frente', ['farois'], [pyre(0), pyre(1)]);
def('ac_estandarte', 'Estandarte queimado da guilda', Wl, 'fundo', ['farois', 'ruas', 'templos'], [banner(0), banner(1)]);
def('ac_escadaria', 'Escadaria em caracol partida', Wl, 'fundo', ['farois'], [spiral(0), spiral(1)]);
// As Ruas de Cinza
def('ac_carroca', 'Carroça de carvão tombada', F, 'frente', ['ruas'], [cart(0), cart(1)]);
def('ac_poco', 'Poço de rua', F, 'frente', ['ruas'], [well(0), well(1)]);
def('ac_estatua', 'Estátua de Acendedor sem cabeça', F, 'frente', ['ruas', 'templos'], [statue(0), statue(1)]);
def('ac_placa', 'Placa da guilda', C, 'frente', ['ruas'], [sign(0), sign(1)]);
def('ac_barris', 'Barris de óleo de lamparina', F, 'frente', ['ruas', 'farois'], [barrels(0), barrels(1)]);
def('ac_varal', 'Varal de lanternas apagadas', C, 'frente', ['ruas'], [lanternLine(0), lanternLine(1)]);
// Os Templos da Chama
def('ac_altar', 'Altar da chama', F, 'frente', ['templos'], [altar(0), altar(1)], { templo: true });
def('ac_sol', 'Disco do Sol', Wl, 'fundo', ['templos'], [sunDisc(0), sunDisc(1)], { templo: true });
def('ac_incensario', 'Incensário de pé', F, 'frente', ['templos'], [censer(0), censer(1)]);
def('ac_lampadario', 'Lampadário de teto', C, 'frente', ['templos', 'ruas'], [chandelier(0), chandelier(1)]);
def('ac_urnas', 'Nicho de urnas de cinza', Wl, 'fundo', ['templos'], [urns(0), urns(1)]);
// A Fornalha do Mundo
def('ac_bigorna', 'Bigorna gigante', F, 'frente', ['fornalha'], [anvil(0), anvil(1)]);
def('ac_fole', 'Fole quebrado', F, 'frente', ['fornalha'], [bellows(0), bellows(1)]);
def('ac_cadinho', 'Cadinho tombado', F, 'frente', ['fornalha'], [crucible(0), crucible(1)], { luz: [{ x: 24, y: 18, r: 0.55 }], brilho: AC_COL.brasa, acAnim: 'brasa' });
def('ac_lingotes', 'Pilha de lingotes', F, 'frente', ['fornalha'], [ingots(0), ingots(1)]);
def('ac_forno', 'Boca de forno', Wl, 'fundo', ['fornalha'], [furnace(0), furnace(1)], { luz: [{ x: 20, y: 33, r: 0.75 }], brilho: AC_COL.brasa, acAnim: 'brasa', forja: true });

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(AC_PROP_PLAN, {
  farois: { chao: [['ac_pira_fria', 0.05, 1], ['ac_lente', 0.06, 1], ['ac_sino', 0.06, 1], ['ac_barris', 0.06, 1]], teto: [], fundo: [['ac_estandarte', 0.1, 1], ['ac_escadaria', 0.05, 1]] },
  ruas: { chao: [['ac_carroca', 0.07, 1], ['ac_poco', 0.05, 1], ['ac_estatua', 0.05, 1], ['ac_barris', 0.07, 1], ['ac_sino', 0.02, 1]], teto: [['ac_placa', 0.12, 1], ['ac_varal', 0.1, 1], ['ac_lampadario', 0.03, 1]], fundo: [['ac_estandarte', 0.12, 1]] },
  templos: { chao: [['ac_altar', 0.1, 1], ['ac_incensario', 0.1, 2], ['ac_estatua', 0.05, 1]], teto: [['ac_lampadario', 0.14, 1]], fundo: [['ac_sol', 0.12, 1], ['ac_urnas', 0.1, 1], ['ac_estandarte', 0.06, 1]] },
  fornalha: { chao: [['ac_bigorna', 0.06, 1], ['ac_fole', 0.06, 1], ['ac_cadinho', 0.07, 1], ['ac_lingotes', 0.06, 1]], teto: [], fundo: [['ac_forno', 0.08, 1]] }
});

/* ---------- a luz: a brasa da escória e do forno somada por cima, o tremor dela ao vivo ---------- */
const acPt = (p, nm) => { const P = p.def.acPts && p.def.acPts[p.v]; return P && P[nm] ? P[nm] : null; };
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.acend) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), nv = p.def.acLuz[p.v];
    if (nv) { lc.globalAlpha = 0.4 + 0.15 * Math.sin(gameTime * 1.7 + p.X * 0.03); lc.drawImage(nv, X, Y); }
    if (p.def.acAnim === 'brasa') { const B = acPt(p, 'brasa'); if (B) { const q = B[0]; lc.globalAlpha = 0.35 + 0.1 * Math.sin(gameTime * 3 + p.X); lc.drawImage(ACART.acGlow('pb18', 18, AC_COL.brasa), X + q.x + (q.w >> 1) - 18, Y + q.y - 18); } }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.acend || p.def.acAnim !== 'brasa') continue;
    const B = acPt(p, 'brasa'); if (!B) continue;
    const q = B[0], X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), T0 = Math.floor(gameTime * 6);
    for (let c = 0; c < q.w; c += 2) {   // tremor de calor: pontinhos que sobem e somem
      const ph0 = (gameTime * 0.8 + hash2(c, 1, p.X) * 3) % 1; if (ph0 > 0.5) continue;
      lc.globalAlpha = (1 - ph0 * 2) * 0.9; lc.fillStyle = hash2(c, T0, p.X) < 0.5 ? '#ffbe5a' : '#f08a2a'; lc.fillRect(X + q.x + c, Y + q.y - 2 - Math.round(ph0 * 12), 1, 1);
    }
  }
  lc.globalAlpha = 1;
});
Object.assign(ACART, { painter, tube, bez, lin, stain, ash, soot, cracks, chip, scatter, ashlar, RP, BRASA, toCv, bakeLuz });
}
