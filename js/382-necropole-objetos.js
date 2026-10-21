'use strict';

/* ================= a Necrópole: objetos de cena =================
   Tudo o que é maior que um bloco e veste a cidade dos mortos (docs/camadas/14-necropole.md, seção 5): 18 objetos.
   Nas Avenidas dos Túmulos: a carpideira de pedra (encapuzada, a cabeça baixa), o obelisco com o nome raspado, a carroça
   fúnebre com o caixão, o portão de ferro do cemitério (fundo), o sino de finados na trave (teto).
   Nos Columbários: a estante de crânios (fundo), as urnas grandes empilhadas, as mortalhas penduradas em varal (teto), o
   altar dos necromantes (a vela de alma acesa: a única luz de objeto da camada, onde eles estão).
   Nos Quartéis da Legião: o estandarte rasgado da legião (fundo), o armeiro com lanças e escudos, o tambor de guerra de
   pele seca, o cabide de armadura vazio, os grilhões pendurados (teto).
   Na Cripta Real: o sarcófago com a efígie, o brasão do rei em relevo de ouro (fundo), a estátua do rei moço, as
   correntes de alma penduradas do teto.
   O pintor do 282 (rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, grão). Registrados com
   defProp (`necro: true`), postos pelo 385 a partir do NC_PROP_PLAN. Flags para o gerador:
     campo: true   só junto de um altar de necromante (ncCamps);
     coluna: true  só nos columbários (as estantes de crânios). */
const NC_PROP_PLAN = {};
const NC_BACK_FLOOR = { nc_portao: 1, nc_brasao: 0 };   // peças de fundo que ficam em pé no chão
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  pedra: ['#1e1c1a', '#34312c', '#4c4842', '#66615a', '#827c74', '#a09a90'],
  marmore: ['#36363a', '#535357', '#747476', '#979592', '#bab8b2', '#dcdad2'],
  musgo: ['#121a14', '#1e2a20', '#2c3c2e', '#3c503e', '#506650', '#688068'],
  ferro: ['#121316', '#22252a', '#363a42', '#4e535c', '#6c727c', '#8e95a0'],
  ferrugem: ['#1e120c', '#341e12', '#4e2c18', '#6a3e20', '#86522c', '#a26a3c'],
  madeira: ['#16100a', '#281c12', '#3c2a1a', '#523a24', '#6a4c30', '#84603e'],
  osso: ['#2a241c', '#463c2e', '#685a46', '#8c7c62', '#b0a082', '#d4c6a6'],
  pano: ['#16151a', '#26242c', '#3a3742', '#504c5a', '#686474', '#827e90'],
  mortalha: ['#2a2824', '#43403a', '#5e5a52', '#7a756c', '#979188', '#b4aea4'],
  barro: ['#1e140e', '#341f14', '#4c2e1c', '#664026', '#825434', '#9e6c46'],
  bronze: ['#16120a', '#2a2212', '#42361c', '#5c4c28', '#786436', '#968046'],
  ouro: ['#3a2a0c', '#5e4616', '#86662a', '#ae8a40', '#d4b060', '#f2d890'],
  real: ['#08080a', '#121216', '#1c1c22', '#28282f', '#36363e', '#4a4a54'],
  rubro: ['#1a080a', '#300e12', '#4a161c', '#661e26', '#822a32', '#a03c42'],
  couro: ['#1e140c', '#342216', '#4c3420', '#66462c', '#80583a', '#9a6c4a'],
  cera: ['#3a3428', '#5a5240', '#7c725a', '#a09676', '#c4ba98', '#e4dcc0']
};
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#06050a');
const ALMA = { miolo: '#f0fff8', claro: '#c4f0d8', luz: '#94d6b0', fundo: '#4a8a6a' };

/* ---- o pintor (o do 282): rid -2 marca um pixel de cor pura que acende ---- */
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
// uma curva grossa: fn(t) -> [x, y], wd(t) a largura
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
// um bloco de pedra lavrada: a face acesa em cima à esquerda, a quina de baixo à direita escura
function stone(P, x0, y0, w, h, R, s, base = 2.8) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    let v = base + cn(x, y, 10, 10, s) * 0.6 + cg(x, y, s + 1) * 0.4 - (x - x0) / w * 0.6 - (y - y0) / h * 0.4;
    if (y === y0) v += 1.1; else if (x === x0) v += 0.6; if (y === y0 + h - 1) v -= 0.7; if (x === x0 + w - 1) v -= 0.6;
    P.put(x, y, R, v);
  }
}
// uma mancha sobre o que já está pintado (musgo, ferrugem, pó); só nas rampas de on
function stain(P, R, cover, s, on, lift = 0) {
  const me = P.idOf(R);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0 || P.rid[k] === me) continue;
    if (on && !on.includes(P.ramps[P.rid[k]])) continue;
    const n = cn(x, y, 12, 12, s) + cn(x, y, 40, 40, s + 1) * 0.5 + (P.has(x, y - 1) ? 0 : 0.35);
    if (n > 0.5 - cover) P.put(x, y, R, 0.9 + P.val[k] * 0.55 + cg(x, y, s + 2) * 0.7 + lift);
  }
}
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
// uma figura encapuzada de pé (carpideira, estátua): o manto em sino, o capuz, a cabeça baixa
function hooded(P, cx, top, h, R, s, bow = 2) {
  for (let y = top; y < top + h; y++) {
    const t = (y - top) / h, hw = t < 0.18 ? 2.6 + t * 8 : 3.6 + t * 4.4;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const u = (x + 0.5 - cx) / hw; if (Math.abs(u) > 1) continue;
      const fold = Math.sin(x * 1.3 + t * 3 + s) * (t > 0.3 ? 1 : 0.3);
      P.put(x, y, R, 3.1 - u * 1.4 - t * 0.5 + (fold > 0.7 ? 0.8 : fold < -0.75 ? -0.8 : 0) + cg(x, y, s) * 0.35);
    }
  }
  // a sombra do capuz e o rosto baixo
  P.ell(cx + bow * 0.3, top + h * 0.12, 1.8, 1.6, (x, y) => P.put(x, y, R, 0.6));
}

/* =============================== as Avenidas dos Túmulos =============================== */
// a carpideira de pedra: encapuzada, as mãos juntas no peito, a cabeça baixa; no pedestal, o musgo
function mourner(k) {
  const W = 20, H = 38, P = painter(W, H), s = 38801 + k;
  stone(P, 2, H - 6, 16, 6, RP.pedra, s);
  hooded(P, 10, 3, H - 9, RP.marmore, s + 1, k ? 2 : -2);
  P.ell(10.6, 13, 2.4, 1.8, (x, y, dx, dy) => P.put(x, y, RP.marmore, 4 - dx - dy * 0.6));   // as mãos juntas
  for (let y = 4; y < 10; y++) P.put(8 + (y > 7 ? 1 : 0), y, RP.marmore, 4.6);               // a borda do capuz acesa
  stain(P, RP.musgo, 0.12, s + 2, [RP.pedra, RP.marmore]);
  if (k) cracks(P, 3, s + 3, [RP.marmore]);
  return P.done();
}
// o obelisco: a agulha sobre o degrau, a inscrição raspada, o topo em pirâmide
function obelisk(k) {
  const W = 14, H = k ? 42 : 34, P = painter(W, H), s = 38811 + k;
  stone(P, 0, H - 4, 14, 4, RP.pedra, s);
  for (let y = 4; y < H - 4; y++) { const hw = 3 + (y - 4) / (H - 8) * 1.6; for (let x = Math.floor(7 - hw); x < Math.ceil(7 + hw); x++) P.put(x, y, RP.marmore, 3.4 - (x + 0.5 - 7) / hw * 1.4 + cg(x, y, s + 1) * 0.35 + cn(x, y, 6, 6, s + 2) * 0.4); }
  for (let y = 0; y < 4; y++) for (let x = 7 - y; x < 7 + y + (y > 0 ? 0 : 1); x++) P.put(x, y, RP.marmore, 4.6 - (x - 7 + y) * 0.4);
  for (let y = 10; y < H - 10; y += 3) for (let x = 5; x <= 8; x++) if (hash2(x, y, s) < 0.6) P.put(x, y, RP.marmore, 1.4);   // as letras raspadas
  stain(P, RP.musgo, 0.08, s + 3, [RP.marmore]);
  return P.done();
}
// a carroça fúnebre: as rodas raiadas, a caixa de madeira escura, o caixão em cima coberto com o pano
function hearse(k) {
  const W = 44, H = 24, P = painter(W, H), s = 38821 + k;
  for (const wx of [9, 34]) {   // as rodas
    P.ell(wx, H - 6, 5.6, 5.6, (x, y, dx, dy, d) => { if (d > 0.62) P.put(x, y, RP.madeira, 3.4 - dy * 1.2 - dx * 0.6); });
    for (let a = 0; a < 6; a++) P.line(wx, H - 6, wx + Math.cos(a + k) * 4.4, H - 6 + Math.sin(a + k) * 4.4, RP.madeira, 2.6);
    P.blob(wx, H - 6, 1.2, 1.2, RP.ferro, s, 3);
  }
  for (let x = 3; x < 41; x++) for (let y = 9; y < 14; y++) P.put(x, y, RP.madeira, 2.8 + (y === 9 ? 1 : 0) - (y - 9) * 0.25 + (x % 7 === 0 ? -0.8 : 0) + cg(x, y, s + 1) * 0.4);
  P.line(41, 12, 44, 15, RP.madeira, 2.4);   // o varal
  // o caixão
  const cpts = [[8, 9], [10, 2], [32, 2], [36, 9]];
  for (let y = 2; y < 9; y++) { const t = (y - 2) / 7, x0 = 10 - t * 2, x1 = 32 + t * 4; for (let x = Math.floor(x0); x < x1; x++) P.put(x, y, RP.madeira, 3.2 - t * 0.6 + (y === 2 ? 1 : 0) + cg(x, y, s + 2) * 0.4); }
  void cpts;
  // o pano por cima, caído de um lado
  for (let x = 12; x < 30; x++) { const dr = 3 + Math.round(Math.sin(x * 0.7) * 1.2) + (x > 24 ? 3 : 0); for (let y = 1; y < 1 + dr; y++) P.put(x, y, RP.mortalha, 3.4 - (y - 1) * 0.3 + Math.sin(x * 1.4) * 0.5 + cg(x, y, s + 3) * 0.3); }
  if (k) { for (let x = 20; x < 26; x++) P.clear(x, 0); cracks(P, 2, s + 4, [RP.madeira]); }
  return P.done();
}
// o portão de ferro do cemitério (fundo): duas folhas de barras com as pontas de lança, o arco com espirais, uma torta
function gate(k) {
  const W = 30, H = 28, P = painter(W, H), s = 38831 + k;
  for (let x = 1; x < W - 1; x += 3) {
    const lean = k && x > W / 2 ? (x - W / 2) * 0.12 : 0, top = 4 + Math.round(Math.abs(x - W / 2) * 0.18);
    for (let y = top; y < H; y++) P.put(x + lean * (H - y) / H, y, RP.ferro, 3.6 + cg(x, y, s) * 0.5 - (y > H - 4 ? 0.8 : 0));
    P.put(x + lean, top - 1, RP.ferro, 5); P.put(x + lean, top - 2, RP.ferro, 4);   // a ponta de lança
  }
  for (const yy of [8, H - 6]) for (let x = 0; x < W; x++) P.put(x, yy, RP.ferro, 3.8 - x / W);
  for (let a = 0; a < 6.28; a += 0.3) { P.put(W / 2 + Math.cos(a) * 3, 13 + Math.sin(a) * 3, RP.ferro, 4.2); P.put(W / 2 + Math.cos(a) * 1.4, 13 + Math.sin(a) * 1.4, RP.ferro, 3); }
  stain(P, RP.ferrugem, 0.18, s + 1, [RP.ferro]);
  return P.done();
}
// o sino de finados: a trave de madeira presa ao teto, o sino de bronze esverdeado, o badalo parado
function bell(k) {
  const W = 18, H = 24, P = painter(W, H), s = 38841 + k;
  for (let x = 0; x < W; x++) P.put(x, 1, RP.madeira, 3.6 - x * 0.06);
  for (let x = 0; x < W; x++) P.put(x, 2, RP.madeira, 2);
  P.line(5, 0, 7, 6, RP.ferro, 3.4); P.line(13, 0, 11, 6, RP.ferro, 3);
  for (let y = 6; y < 21; y++) { const t = (y - 6) / 15, hw = 2.6 + t * t * 5.4; for (let x = Math.floor(9 - hw); x < Math.ceil(9 + hw); x++) P.put(x, y, RP.bronze, 3.4 - (x + 0.5 - 9) / hw * 1.6 + (y === 20 ? 1 : 0) + cg(x, y, s) * 0.35 + (k && t > 0.6 && x > 11 ? -1 : 0)); }
  P.blob(9, 22, 1.4, 1.4, RP.ferro, s + 1, 2.4);
  stain(P, RP.musgo, 0.1, s + 2, [RP.bronze]);
  return P.done();
}

/* =============================== os Columbários =============================== */
// a estante de crânios (fundo): prateleiras de pedra com crânios de lado a lado, alguns caídos
function skullShelf(k) {
  const W = 28, H = 30, P = painter(W, H), s = 38851 + k;
  for (const y0 of [0, 10, 20]) stone(P, 0, y0 + 8, W, 2, RP.pedra, s + y0, 2.4);
  stone(P, 0, 0, 2, H, RP.pedra, s + 1, 2.2); stone(P, W - 2, 0, 2, H, RP.pedra, s + 2, 2);
  for (const y0 of [0, 10, 20]) for (let x = 3; x < W - 4; x += 5) {
    if (hash2(x, y0, s) < 0.18) continue;
    const cx = x + 2, cy = y0 + 5;
    P.ell(cx, cy, 2.4, 2.6, (xx, yy, dx, dy, d) => P.put(xx, yy, RP.osso, 3.8 - dx * 1.1 - dy * 1.2 - d * 0.4 + cg(xx, yy, s) * 0.3));
    P.put(cx - 1, cy, RP.osso, 0.4); P.put(cx + 1, cy, RP.osso, 0.4); P.put(cx, cy + 1.6, RP.osso, 1);
    for (let xx = cx - 1; xx <= cx + 1; xx++) P.put(xx, cy + 2.6, RP.osso, xx === cx ? 1.4 : 3.6);
  }
  return P.done();
}
// as urnas grandes empilhadas: de barro com bocas largas, uma tombada e rachada, as cinzas escorrendo
function bigUrns(k) {
  const W = 30, H = 20, P = painter(W, H), s = 38861 + k;
  const urn = (cx, by, hh, R, ss) => { for (let y = by - hh; y < by; y++) { const t = (y - by + hh) / hh, hw = t < 0.12 ? 2.4 : 1.8 + Math.sin(Math.min(1, (t - 0.1) / 0.9) * Math.PI) * 3.6; for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) P.put(x, y, R, 3.5 - (x + 0.5 - cx) / hw * 1.6 + (Math.abs(t - 0.45) < 0.05 ? 0.9 : 0) + cg(x, y, ss) * 0.35); } };
  urn(7, H, 15, RP.barro, s); urn(17, H, 18, RP.bronze, s + 1);
  if (k) { for (let x = 20; x < 30; x++) for (let y = H - 6; y < H; y++) { const u = (x - 25) / 5, v = (y - (H - 3)) / 3; if (u * u + v * v < 1) P.put(x, y, RP.barro, 3 - u - v); } for (let x = 26; x < 30; x++) P.put(x, H - 1, RP.cera, 3 + cg(x, 1, s)); }
  else urn(26, H, 11, RP.barro, s + 2);
  cracks(P, 2, s + 3, [RP.barro]);
  return P.done();
}
// as mortalhas penduradas em varal (teto): a corda entre dois ganchos e três panos compridos caindo
function shroudLine(k) {
  const W = 36, H = 18, P = painter(W, H), s = 38871 + k;
  for (let x = 0; x < W; x++) P.put(x, 1 + Math.round(Math.sin(x / W * Math.PI) * 2), RP.couro, 3.2);
  for (const [x0, len] of k ? [[4, 14], [15, 10], [25, 16]] : [[6, 12], [18, 16], [28, 9]]) {
    for (let y = 2; y < len; y++) { const sw = Math.sin(y * 0.4 + x0) * 0.8; for (let x = x0; x < x0 + 6; x++) { if (y > len - 3 && hash2(x, y, s) < 0.4) continue; P.put(x + sw, y + Math.round(Math.sin(x0 / W * Math.PI) * 2), RP.mortalha, 3.6 - (x - x0) * 0.25 + (Math.sin(x * 1.9 + y * 0.3) > 0.7 ? 0.8 : 0) + cg(x, y, s) * 0.3); } }
  }
  return P.done();
}
// o altar dos necromantes: a laje sobre dois crânios grandes, as velas pretas, a vela de alma acesa no meio
function altar(k) {
  const W = 30, H = 20, P = painter(W, H), s = 38881 + k;
  for (const cx of [6, 23]) { P.ell(cx, H - 4, 4, 4, (x, y, dx, dy, d) => P.put(x, y, RP.osso, 3.6 - dx * 1.2 - dy - d * 0.4 + cg(x, y, s) * 0.3)); P.put(cx - 2, H - 4, RP.osso, 0.4); P.put(cx + 1, H - 4, RP.osso, 0.4); }
  stone(P, 1, 10, 28, 3, RP.real, s + 1, 3);
  for (let x = 2; x < 28; x += 2) if (hash2(x, 1, s) < 0.4) P.put(x, 13, RP.cera, 3);   // a cera escorrida
  for (const [x, h] of [[4, 4], [7, 6], [21, 5], [25, 3]]) { for (let y = 10 - h; y < 10; y++) P.put(x, y, RP.pano, 2 + (y === 10 - h ? 1 : 0)); }
  // a vela de alma: o toco de cera clara, a chama fria (marcada para o brilho)
  for (let y = 4; y < 10; y++) { P.put(14, y, RP.cera, 4); P.put(15, y, RP.cera, 3); }
  for (const [x, y, c] of [[14, 3, ALMA.luz], [15, 3, ALMA.claro], [14, 2, ALMA.claro], [15, 1, ALMA.miolo], [14, 1, ALMA.luz], [15, 0, ALMA.claro]]) P.N(x, y, c);
  P.mark('chama', 15, 1);
  if (k) for (let x = 9; x < 13; x++) P.put(x, 9, RP.osso, 4.4 - (x - 9) * 0.3);   // um osso de mão em oferenda
  return P.done();
}

/* =============================== os Quartéis da Legião =============================== */
// o estandarte rasgado (fundo): a haste com a ponta, o pano vermelho-escuro em farrapos, a caveira coroada bordada
function banner(k) {
  const W = 18, H = 32, P = painter(W, H), s = 38891 + k;
  for (let x = 0; x < W; x++) P.put(x, 2, RP.madeira, 3.6 - x * 0.08);
  P.put(W - 1, 1, RP.ferro, 5); P.put(0, 1, RP.ferro, 4);
  for (let y = 3; y < H; y++) for (let x = 2; x < W - 2; x++) {
    const tear = H - 1 - y < 6 && hash2(x, (y / 2) | 0, s) < (6 - (H - 1 - y)) * 0.18; if (tear) continue;
    if (k && x > 10 && y > 16 && y < 22) continue;   // o furo
    P.put(x, y, RP.rubro, 3 - (x - 2) / (W - 4) * 1.2 + Math.sin(x * 0.9 + y * 0.15) * 0.4 + cg(x, y, s) * 0.4);
  }
  // a caveira coroada em fio de ouro
  P.ell(9, 13, 3, 3.2, (x, y, dx, dy, d) => { if (d > 0.55) P.put(x, y, RP.ouro, 3.4 - dy); });
  P.put(8, 13, RP.ouro, 4); P.put(10, 13, RP.ouro, 4); for (const x of [7, 9, 11]) P.put(x, 8, RP.ouro, 4.6); for (let x = 7; x <= 11; x++) P.put(x, 9, RP.ouro, 3.4);
  return P.done();
}
// o armeiro: o cavalete com as lanças em pé, dois escudos redondos de ferro encostados
function armory(k) {
  const W = 30, H = 24, P = painter(W, H), s = 38901 + k;
  for (const yy of [8, 18]) for (let x = 1; x < W - 1; x++) P.put(x, yy, RP.madeira, 3.4 - x * 0.04 + cg(x, yy, s) * 0.4);
  for (const x of [2, W - 3]) for (let y = 6; y < H; y++) P.put(x, y, RP.madeira, 2.8);
  for (let x = 5; x < W - 4; x += 3) { if (hash2(x, k, s) < 0.2) continue; for (let y = 3; y < H - 1; y++) P.put(x, y, RP.madeira, 3.2 + cg(x, y, s + 1) * 0.4); P.put(x, 2, RP.ferro, 4.6); P.put(x, 1, RP.ferro, 5.2); P.put(x, 0, RP.ferro, 5.6); }
  for (const cx of k ? [8, 21] : [11]) P.ell(cx, H - 6, 5, 5.4, (x, y, dx, dy, d) => P.put(x, y, d < 0.15 ? RP.bronze : RP.ferro, (d < 0.15 ? 4.2 : 3.4) - dx * 1.3 - dy * 0.9 + (d > 0.8 ? 0.6 : 0) + cg(x, y, s + 2) * 0.3));
  stain(P, RP.ferrugem, 0.12, s + 3, [RP.ferro]);
  return P.done();
}
// o tambor de guerra: o casco de madeira com as cordas em zigue-zague, a pele seca rasgada, a baqueta de osso
function drum(k) {
  const W = 18, H = 16, P = painter(W, H), s = 38911 + k;
  for (let y = 3; y < H; y++) for (let x = 1; x < W - 1; x++) { const u = (x + 0.5 - 9) / 8; P.put(x, y, RP.madeira, 3.2 - u * 1.4 - u * u * 0.6 + cg(x, y, s) * 0.4); }
  P.ell(9, 3, 8, 2, (x, y, dx, dy) => P.put(x, y, RP.couro, 3.8 - dx * 0.8 - dy * 0.6 + cg(x, y, s + 1) * 0.4));
  for (let x = 2; x < 16; x += 3) { P.line(x, 5, x + 1.5, 13, RP.cera, 3.6); P.line(x + 1.5, 5, x, 13, RP.cera, 2.8); }
  if (k) for (let x = 6; x < 11; x++) P.put(x, 3, RP.couro, 0.6);
  P.line(12, 0, 17, 4, RP.osso, 4.2);
  return P.done();
}
// o cabide de armadura: a cruzeta de madeira com o peitoral vazio e o elmo em cima, a capa caída
function armorStand(k) {
  const W = 14, H = 28, P = painter(W, H), s = 38921 + k;
  for (let y = 4; y < H; y++) P.put(7, y, RP.madeira, 2.8); for (let x = 3; x < 12; x++) P.put(x, H - 1, RP.madeira, 2.4);
  for (let x = 1; x < 13; x++) P.put(x, 9, RP.madeira, 3.2);
  for (let y = 9; y < 19; y++) { const hw = 5 - Math.max(0, y - 14) * 0.6; for (let x = Math.floor(7 - hw); x < Math.ceil(7 + hw); x++) P.put(x, y, RP.ferro, 3.6 - (x + 0.5 - 7) / hw * 1.4 - (y - 9) * 0.05 + (y === 9 ? 1 : 0) + cg(x, y, s) * 0.3); }
  P.ell(7, 5, 3.2, 3.6, (x, y, dx, dy) => P.put(x, y, RP.ferro, 4 - dx * 1.2 - dy));
  for (let x = 6; x < 10; x++) P.put(x, 6, RP.ferro, 0.4);
  if (k) for (let y = 10; y < 24; y++) for (let x = 0; x < 3; x++) P.put(x, y, RP.rubro, 2.6 - x * 0.3 + Math.sin(y * 0.6) * 0.5);
  stain(P, RP.ferrugem, 0.1, s + 1, [RP.ferro]);
  return P.done();
}
// os grilhões pendurados (teto): correntes curtas com algemas abertas
function shackles(k) {
  const W = 20, H = 22, P = painter(W, H), s = 38931 + k;
  for (const [x0, len] of k ? [[4, 16], [14, 12]] : [[5, 12], [10, 18], [16, 10]]) {
    for (let y = 0; y < len; y++) P.put(x0 + (y % 3 === 1 ? 1 : 0), y, RP.ferro, y % 3 === 0 ? 4.4 : 2.8);
    P.ell(x0 + 0.5, len + 1.5, 2, 1.8, (x, y, dx, dy, d) => { if (d > 0.4) P.put(x, y, RP.ferro, 4 - dy - dx * 0.6); });
  }
  stain(P, RP.ferrugem, 0.15, s, [RP.ferro]);
  return P.done();
}

/* =============================== a Cripta Real =============================== */
// o sarcófago com a efígie: a caixa de mármore real com o friso de ouro, o rei deitado de mãos no peito por cima
function sarcophagus(k) {
  const W = 42, H = 18, P = painter(W, H), s = 38941 + k;
  stone(P, 1, 8, 40, 10, RP.real, s, 3);
  for (let x = 2; x < 40; x++) { P.put(x, 10, RP.ouro, 4 - x / 40); if (x % 6 === 0) for (let y = 11; y < 16; y++) P.put(x, y, RP.ouro, 2.6); }
  // a efígie: o corpo deitado sob o manto de pedra, a coroa, as mãos, os pés
  for (let x = 5; x < 37; x++) { const hh = x < 11 ? 4 : x > 32 ? 3 : 3.4 + Math.sin((x - 11) / 21 * Math.PI) * 1.4; for (let y = Math.round(8 - hh); y < 8; y++) P.put(x, y, RP.marmore, 3.4 - (y - 8 + hh) * 0.2 + (y === Math.round(8 - hh) ? 0.9 : 0) + cg(x, y, s + 1) * 0.3 - (x > 30 ? 0.3 : 0)); }
  P.ell(7.5, 5, 2.6, 2.4, (x, y, dx, dy) => P.put(x, y, RP.marmore, 4.2 - dx - dy));
  for (const x of [5, 7, 9]) P.put(x, 2, RP.ouro, 5); for (let x = 5; x <= 10; x++) P.put(x, 3, RP.ouro, 3.6);
  P.ell(20, 4, 2.2, 1.4, (x, y) => P.put(x, y, RP.marmore, 4.6));
  if (k) { cracks(P, 4, s + 2, [RP.marmore, RP.real]); for (let x = 30; x < 38; x++) P.clear(x, 4 + ((x * 3) % 2)); }
  return P.done();
}
// o brasão do rei (fundo): o escudo de mármore negro, a caveira coroada de ouro, as duas foices cruzadas
function crest(k) {
  const W = 26, H = 26, P = painter(W, H), s = 38951 + k;
  for (let y = 1; y < H - 1; y++) { const t = (y - 1) / (H - 2), hw = t < 0.6 ? 10 : 10 * Math.sqrt(Math.max(0, 1 - (t - 0.6) / 0.4)); for (let x = Math.floor(13 - hw); x < Math.ceil(13 + hw); x++) P.put(x, y, RP.real, 3 - (x - 13) / 10 - t * 0.6 + cg(x, y, s) * 0.2 + (Math.abs(Math.abs(x + 0.5 - 13) - hw) < 1 || y === 1 ? 1.4 : 0)); }
  for (const d of [-1, 1]) { P.line(13 - d * 8, 4, 13 + d * 6, 20, RP.ouro, 3.4); P.line(13 + d * 6, 20, 13 + d * 9, 18, RP.ouro, 4.4); }
  P.ell(13, 11, 4, 4.2, (x, y, dx, dy) => P.put(x, y, RP.ouro, 3.8 - dx * 1.2 - dy));
  P.put(11.5, 11, RP.real, 0); P.put(14.5, 11, RP.real, 0); P.put(13, 13, RP.real, 0.6); for (let x = 11; x <= 15; x++) P.put(x, 15, RP.ouro, x % 2 ? 4.4 : 1.6);
  for (const x of [10, 13, 16]) { P.put(x, 5, RP.ouro, 5.2); P.put(x, 4, RP.ouro, 4.4); } for (let x = 10; x <= 16; x++) P.put(x, 6, RP.ouro, 3.8);
  if (k) cracks(P, 3, s + 1, [RP.real]);
  return P.done();
}
// a estátua do rei moço: de pé, a coroa, a capa, a espada de ponta no chão, as duas mãos no punho
function kingStatue(k) {
  const W = 22, H = 44, P = painter(W, H), s = 38961 + k;
  stone(P, 1, H - 5, 20, 5, RP.real, s, 2.8);
  for (let y = 9; y < H - 5; y++) { const t = (y - 9) / (H - 14), hw = 3.4 + t * 5; for (let x = Math.floor(11 - hw); x < Math.ceil(11 + hw); x++) { const u = (x + 0.5 - 11) / hw; P.put(x, y, RP.marmore, 3.2 - u * 1.3 + (Math.sin(x * 1.1 + t * 4) > 0.8 ? 0.7 : 0) + cg(x, y, s + 1) * 0.3); } }
  P.ell(11, 6, 3, 3.6, (x, y, dx, dy) => P.put(x, y, RP.marmore, 4 - dx * 1.1 - dy * 0.8));
  for (const x of [8, 10, 12, 14]) { P.put(x, 1, RP.marmore, 5); } for (let x = 8; x <= 14; x++) P.put(x, 2, RP.marmore, 4.2);
  for (let y = 14; y < H - 5; y++) P.put(11, y, RP.ferro, y < 17 ? 3 : 4.4 - (y - 17) * 0.04);   // a espada
  for (let x = 8; x <= 14; x++) P.put(x, 17, RP.ferro, 3.6);
  P.ell(11, 15, 2.2, 1.4, (x, y) => P.put(x, y, RP.marmore, 4.4));
  stain(P, RP.musgo, 0.06, s + 2, [RP.marmore]);
  if (k) { for (let y = 0; y < 4; y++) for (let x = 12; x < 16; x++) P.clear(x, y); cracks(P, 3, s + 3, [RP.marmore]); }
  return P.done();
}
// as correntes de alma penduradas do teto: três correntes com elos grossos e argolas, uma partida
function soulChains(k) {
  const W = 20, H = 30, P = painter(W, H), s = 38971 + k;
  for (const [x0, len] of k ? [[4, 22], [10, 28], [16, 14]] : [[5, 26], [12, 18], [16, 24]]) {
    for (let y = 0; y < len; y++) { const sw = Math.sin(y * 0.15 + x0) * 0.6, seg = Math.floor(y / 3) % 2; if (seg) { P.put(x0 + sw, y, RP.ferro, 4.2); P.put(x0 + 1 + sw, y, RP.ferro, 2.6); } else if (y % 3 === 0) { P.put(x0 - 1 + sw, y, RP.ferro, 4.6); P.put(x0 + 2 + sw, y, RP.ferro, 2.4); } else { P.put(x0 - 1 + sw, y, RP.ferro, 4); P.put(x0 + 2 + sw, y, RP.ferro, 2); } }
    P.ell(x0 + 0.5, len + 1.2, 1.6, 1.6, (x, y, dx, dy, d) => { if (d > 0.3) P.put(x, y, RP.ferro, 4 - dy - dx); });
  }
  stain(P, RP.ferrugem, 0.08, s, [RP.ferro]);
  return P.done();
}

/* ---------- o registro ---------- */
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
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), necro: true, ncLuz: Ps.map(bakeLuz), ncPts: Ps.map(P => P.pts) }, extra || {}));
};
// as Avenidas
def('nc_carpideira', 'Carpideira de pedra', F, 'frente', ['avenidas'], [mourner(0), mourner(1)]);
def('nc_obelisco', 'Obelisco de nome raspado', F, 'frente', ['avenidas', 'cripta'], [obelisk(0), obelisk(1)]);
def('nc_carroca', 'Carroça fúnebre', F, 'frente', ['avenidas'], [hearse(0), hearse(1)]);
def('nc_portao', 'Portão de ferro do cemitério', Wl, 'fundo', ['avenidas'], [gate(0), gate(1)]);
def('nc_sino', 'Sino de finados', C, 'frente', ['avenidas', 'columbarios'], [bell(0), bell(1)]);
// os Columbários
def('nc_estante', 'Estante de crânios', Wl, 'fundo', ['columbarios'], [skullShelf(0), skullShelf(1)], { coluna: true });
def('nc_urnas', 'Urnas grandes', F, 'frente', ['columbarios', 'avenidas'], [bigUrns(0), bigUrns(1)]);
def('nc_varal', 'Mortalhas no varal', C, 'frente', ['columbarios'], [shroudLine(0), shroudLine(1)]);
def('nc_altar', 'Altar dos necromantes', F, 'frente', ['columbarios', 'avenidas', 'quarteis', 'cripta'], [altar(0), altar(1)], { campo: true, luz: [{ x: 15, y: 2, r: 0.9 }], brilho: NC_COL.alma, ncAnim: 'vela' });
// os Quartéis
def('nc_estandarte', 'Estandarte da legião', Wl, 'fundo', ['quarteis'], [banner(0), banner(1)]);
def('nc_armeiro', 'Armeiro da legião', F, 'frente', ['quarteis'], [armory(0), armory(1)]);
def('nc_tambor', 'Tambor de guerra', F, 'frente', ['quarteis'], [drum(0), drum(1)]);
def('nc_cabide', 'Cabide de armadura', F, 'frente', ['quarteis'], [armorStand(0), armorStand(1)]);
def('nc_grilhoes', 'Grilhões pendurados', C, 'frente', ['quarteis', 'cripta'], [shackles(0), shackles(1)]);
// a Cripta
def('nc_sarcofago', 'Sarcófago com efígie', F, 'frente', ['cripta'], [sarcophagus(0), sarcophagus(1)]);
def('nc_brasao', 'Brasão do Rei Eterno', Wl, 'fundo', ['cripta'], [crest(0), crest(1)]);
def('nc_estatua', 'Estátua do rei moço', F, 'frente', ['cripta'], [kingStatue(0), kingStatue(1)]);
def('nc_correntes', 'Correntes de alma', C, 'frente', ['cripta'], [soulChains(0), soulChains(1)]);

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(NC_PROP_PLAN, {
  avenidas: { chao: [['nc_altar', 3, 1], ['nc_carpideira', 0.12, 1], ['nc_obelisco', 0.08, 1], ['nc_carroca', 0.04, 1], ['nc_urnas', 0.05, 1]], teto: [['nc_sino', 0.05, 1]], fundo: [['nc_portao', 0.06, 1]] },
  columbarios: { chao: [['nc_altar', 3, 1], ['nc_urnas', 0.14, 1]], teto: [['nc_varal', 0.12, 1], ['nc_sino', 0.03, 1]], fundo: [['nc_estante', 0.3, 1]] },
  quarteis: { chao: [['nc_altar', 3, 1], ['nc_armeiro', 0.1, 1], ['nc_tambor', 0.07, 1], ['nc_cabide', 0.12, 1]], teto: [['nc_grilhoes', 0.1, 1]], fundo: [['nc_estandarte', 0.16, 1]] },
  cripta: { chao: [['nc_altar', 3, 1], ['nc_sarcofago', 0.1, 1], ['nc_estatua', 0.05, 1], ['nc_obelisco', 0.04, 1]], teto: [['nc_correntes', 0.1, 1], ['nc_grilhoes', 0.04, 1]], fundo: [['nc_brasao', 0.12, 1]] }
});

/* ---------- a luz: a vela de alma do altar (o brilho por baixo e a chama ao vivo por cima) ---------- */
const FL = [ALMA.fundo, ALMA.luz, ALMA.claro, ALMA.miolo];
const ncPt = (p, nm) => { const P = p.def.ncPts && p.def.ncPts[p.v]; return P && P[nm] ? P[nm][0] : null; };
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.necro) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), nv = p.def.ncLuz[p.v];
    if (nv) { lc.globalAlpha = 0.4 + 0.1 * Math.sin(gameTime * 1.3 + p.X * 0.03); lc.drawImage(nv, X, Y); }
    if (p.def.ncAnim === 'vela') { const q = ncPt(p, 'chama'); if (q) { lc.globalAlpha = 0.5 + 0.08 * Math.sin(gameTime * 6 + p.X); lc.drawImage(NCART.ncGlow('vela16', 16, NC_COL.alma), X + q.x - 16, Y + q.y - 14); } }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.necro || p.def.ncAnim !== 'vela') continue;
    const q = ncPt(p, 'chama'); if (!q) continue;
    const X = Math.round(p.X + p.sh - cx) + q.x, Y = Math.round(p.Y - cy) + q.y, f = Math.floor(gameTime * 7 + p.X) % 4;
    lc.fillStyle = FL[3]; lc.fillRect(X - (f === 2 ? 1 : 0), Y - 1 - (f === 1 ? 1 : 0), 1, 1);
  }
});
}
