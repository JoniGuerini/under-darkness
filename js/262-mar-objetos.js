'use strict';

/* ================= o Mar Sem Sol: objetos de cena =================
   Tudo o que é maior que um bloco e veste O Mar Sem Sol (docs/camadas/10-mar-sem-sol.md, seção 5): 28 objetos.
   Nas Praias Negras, o que o mar trouxe e a gente-peixe juntou: o bote virado, a âncora caída, o barril de óleo, a
   figura de proa caída, o canhão enferrujado, o mastro quebrado com a vela rasgada, a rede secando em varas, a
   armadilha de peixe, o totem da gente-peixe, o braseiro de óleo de peixe (fogo verde), o farol da gente-peixe (só nas
   ilhas: o facho gira), a cabana de palafita, a lanterna de navio pendurada e as redes penduradas. Na Floresta de
   Algas, debaixo da água: o coral-cérebro, o coral-leque (as pontas acendem), a concha gigante entreaberta (a pérola
   brilha), a ânfora afundada, a estrela-do-mar e a vigia de navio acesa (só dentro dos cascos). Na Fossa: o esqueleto
   de baleia, o crânio de leviatã antigo, a estátua do deus-peixe e o mural da gente-peixe (só nos templos) e o casco no
   fundo. Nas Chaminés Negras: a chaminé negra fumegando, os vermes-tubo gigantes e a crosta de enxofre.
   O pintor é o do 252 (rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, juntas por P.z,
   grão); um pixel aceso (P.N) é cor pura e vai somado por cima do escuro com o halo assado em volta, sem releitura por
   quadro.
   Animados (ganchos no fim), pelos pontos marcados no desenho (msPts):
     'chama'  a chama da lanterna de navio treme (drawGlow + drawTop);
     'fogo'   as línguas verdes do óleo de peixe no braseiro e no farol (drawGlow + drawTop);
     'farol'  o facho do farol varrendo de um lado para o outro (drawGlow);
     'fumo'   a fumaça preta subindo da boca da chaminé, a brasa embaixo dela (drawGlow + drawTop);
     'vapor'  fiapos de vapor claro da crosta de enxofre (drawTop);
     'bolha'  bolhas subindo da concha, dos vermes e da chaminé, só se o ponto estiver dentro da água (drawTop);
     'brilho' cintila de vez em quando (pontas do coral-leque, a pérola, o olho do deus-peixe) (drawTop).
   Registrados com defProp (`mar: true`), postos pelo 265 (msPlaceProps) a partir do MS_PROP_PLAN. Peças de fundo em
   MS_BACK_FLOOR ficam em pé no chão; as outras de fundo, na altura dos olhos.
   Flags que o gerador respeita:
     agua: true      só debaixo da água (o resto só no seco); agua: 'ambos' vai nos dois;
     ilha: true      só nas ilhas (o farol); casco: true só dentro dos cascos e navios (a vigia);
     templo: true    só dentro dos templos da Fossa (a estátua do deus-peixe e o mural);
     alto: n         precisa de n blocos de ar livres. */
const MS_PROP_PLAN = {};
const MS_HR = 9;
const MS_BACK_FLOOR = { ms_rede_varas: 1, ms_deus_peixe: 1, ms_casco_fundo: 1 };
{
const { cg, cn, msOut } = MSART;
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  madeira: ['#120e0a', '#221a12', '#36291c', '#4c3a28', '#64503a', '#7e6a50'],      // tábua de navio molhada
  deriva: ['#2a2622', '#46403a', '#665e54', '#8a8074', '#ada396', '#cfc6b8'],       // madeira lavada de sal
  ferro: ['#100e0e', '#1e1a1a', '#2e2826', '#423a36', '#5a504a', '#766a62'],
  ferrugem: ['#2a0e06', '#4a1c0a', '#6e2e12', '#94441c', '#b8622e', '#d68a50'],
  corda: ['#2a2418', '#463c2a', '#665a40', '#857858', '#a49870', '#c2b78e'],
  vela: ['#3a362c', '#5a5446', '#7c7462', '#9e9680', '#bcb49e', '#d8d2be'],
  pintura: ['#3a1416', '#5e2024', '#863034', '#ac4446', '#cc6460', '#e8928a'],      // a tinta vermelha da figura de proa
  pedra: ['#0a0e12', '#141a20', '#20282e', '#2e3840', '#404c54', '#56646c'],
  templo: ['#0c1416', '#16242a', '#22363c', '#304a50', '#426066', '#5a7c80'],
  osso: ['#2a261e', '#4a4436', '#6e6652', '#948a70', '#b8ae92', '#dcd4ba'],
  coral: ['#3a0e1a', '#62182a', '#8e2a3e', '#ba4456', '#de6a74', '#f6a0a0'],
  coralL: ['#3a1a06', '#6a320c', '#9a5418', '#c87c2a', '#e8a448', '#fcd080'],
  cerebro: ['#2a2412', '#4a401e', '#6e602c', '#94843e', '#b8a856', '#d8cc7c'],
  concha: ['#2e2632', '#4e4454', '#76687a', '#a0929e', '#c8bcc2', '#ece4e4'],
  manto: ['#06202a', '#0c3440', '#14505a', '#1e6e76', '#2e9294', '#50b8b0'],        // o manto da concha gigante
  barro: ['#2a120a', '#4a2212', '#6e361c', '#924c28', '#b46838', '#d08a52'],
  escama: ['#081a1a', '#0e2c2a', '#164240', '#225c56', '#347a70', '#4e9a8a'],
  alga: ['#0e1408', '#1a240e', '#283616', '#384a1e', '#4a5e26', '#5e7430'],
  musgo: ['#0a1610', '#122418', '#1c3422', '#28482e', '#365e3a', '#46764a'],
  lodo: ['#08090a', '#101214', '#1a1c1e', '#24282a', '#303538', '#3e4448'],
  sulfeto: ['#0a0806', '#16120e', '#241c16', '#32281e', '#443628', '#584634'],
  enxofre: ['#3a3006', '#62520c', '#8e7a16', '#b8a024', '#dcc63c', '#f6e878'],
  verme: ['#4a4440', '#706a64', '#968e86', '#b8b0a6', '#d6cec4', '#f0eae0'],
  pluma: ['#3a0408', '#620a10', '#8e1418', '#ba2422', '#e04432', '#ff7a5a'],
  latao: ['#2a1e0a', '#4a3612', '#6e521c', '#94722a', '#b8963e', '#dcbc62'],
  azinhavre: ['#0c2018', '#163428', '#224c3a', '#306650', '#448468', '#62a486'],
  vidro: ['#04141a', '#08242c', '#0e3640', '#184c58', '#286872', '#468c94'],
  peixe: ['#1a2226', '#2e3a40', '#46565c', '#62747a', '#82969a', '#a8bcbe'],
  silhueta: ['#04070a', '#070b0f', '#0a1015', '#0e151b', '#121a22', '#17202a'],
  sombra: ['#020304', '#040608', '#06090c', '#080c10', '#0b1015', '#0e141a']
};
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#030406');
// as cores puras do que acende: o ciano do plâncton, o verde do óleo de peixe, o laranja da lanterna e da brasa
const LC = { ciano: '#6ae8d8', cianoC: '#d0fff6', cianoF: '#2a9490', oleo: '#b8e050', oleoC: '#eaffb0', oleoF: '#4a7a10', laranja: '#ff8a3a', laranjaC: '#ffe0a8', brasa: '#e8601a', brasaF: '#7a2208', rosa: '#ff8ab0', perola: '#eef6ff' };
const mixHex = (a, b, k) => { const A = rgb(a), B = rgb(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0')).join(''); };

/* ---- o pintor do 252 (rampas de 6 tons, P.N acende um pixel de cor pura, juntas por P.z) ---- */
/* ---- o pintor (o do 182, com P.z e as juntas) mais o luar do 242: rid -2 marca um pixel de cor pura que acende ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), zb = new Uint8Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, zb, ramps, idOf, z: 0, pts: {},
    put(x, y, R, v) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; zb[k] = P.z; },
    N(x, y, hex) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = ph(hex); rid[k] = -2; val[k] = 5; zb[k] = P.z; },
    clear(x, y) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    isN(x, y) { return x >= 0 && y >= 0 && x < w && y < h && rid[(y | 0) * w + (x | 0)] === -2; },
    is(x, y, R) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0 && rid[y * w + x] >= 0 && ramps[rid[y * w + x]] === R; },
    v(x, y) { return val[(y | 0) * w + (x | 0)]; },
    // mistura a cor de um pixel já pintado com hex (vidro, água por cima)
    tint(x, y, hex, k) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; if (!c[i]) return; const q = c[i], B = rgb(hex); c[i] = pack(Math.round((q & 255) + (B[0] - (q & 255)) * k), Math.round(((q >> 8) & 255) + (B[1] - ((q >> 8) & 255)) * k), Math.round(((q >> 16) & 255) + (B[2] - ((q >> 16) & 255)) * k)); },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    box(x0, y0, rw, rh, R, s, base = 2.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.4 : j === 1 ? 0.5 : 0) + (i === 0 ? 0.6 : 0) - (j === rh - 1 ? 1.3 : 0) - (i === rw - 1 ? 0.9 : 0) + cg(x, y, s) * 0.45 + cn(x, y, 60, 60, s + 1) * 0.4); },
    blob(cx, cy, rx, ry, R, s, base = 2.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 - d * 0.5 + cg(x, y, s) * 0.4); } },
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
// cola Q em P em (ox, oy) girado de ang em volta de (px, py) de Q; o luar e os pontos marcados vão junto
function blit(P, Q, ox, oy, ang = 0, px = 0, py = 0) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.ceil(Math.hypot(Q.w, Q.h));
  for (let y = -m; y <= m; y++) for (let x = -m; x <= m; x++) {
    const dx = x + 0.5, dy = y + 0.5, u = Math.floor(dx * ca + dy * sa + px), v = Math.floor(-dx * sa + dy * ca + py);
    if (u < 0 || v < 0 || u >= Q.w || v >= Q.h) continue; const k = v * Q.w + u; if (!Q.c[k]) continue;
    if (Q.rid[k] === -2) { const q = Q.c[k]; P.N(ox + px + x, oy + py + y, '#' + [q & 255, (q >> 8) & 255, (q >> 16) & 255].map(n => n.toString(16).padStart(2, '0')).join('')); continue; }
    P.put(ox + px + x, oy + py + y, Q.ramps[Q.rid[k]], Q.val[k]);
  }
  const map = (U, V) => { const a = U - px, b = V - py; return [Math.round(ox + px + a * ca - b * sa - 0.5), Math.round(oy + py + a * sa + b * ca - 0.5)]; };
  for (const nm in Q.pts) for (const q of Q.pts[nm]) { const [x, y] = map(q.x, q.y); P.mark(nm, x, y, Object.assign({}, q, { x, y })); }
  return map;
}
// uma curva grossa: fn(t) -> [x, y], wd(t) a largura; redonda no corte, luz de cima à esquerda
function tube(P, fn, wd, R, s, base = 2.8, n = 0) {
  const [ax, ay] = fn(0), [bx, by] = fn(1); n = n || Math.ceil(Math.hypot(bx - ax, by - ay) * 3) + 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = fn(t), r = Math.max(0.5, wd(t) / 2);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      const dx = (xx + 0.5 - x) / r, dy = (yy + 0.5 - y) / r, d = dx * dx + dy * dy; if (d > 1) continue;
      P.put(xx, yy, R, base + 0.8 - (dx + dy) * 0.95 - d * 0.45 + cg(xx, yy, s) * 0.3);
    }
  }
}
// uma curva de Bézier cúbica (para raízes, galhos, pescoços)
const bez = (a, b, c, d) => t => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; };

// uma tábua: veio ao comprido, aresta de cima e da esquerda acesas
function plank(P, x0, y0, len, thick, R, s, vert = false, base = 2.6) {
  for (let a = 0; a < len; a++) for (let b = 0; b < thick; b++) {
    const x = vert ? x0 + b : x0 + a, y = vert ? y0 + a : y0 + b;
    let v = base + (b === 0 ? 0.9 : b === thick - 1 ? -0.9 : 0) + Math.sin(a * 0.45 + b * 1.9 + s) * 0.3 + cg(x, y, s) * 0.45;
    if (a === 0 || a === len - 1) v -= 0.5;
    P.put(x, y, R, v);
  }
}
// cantaria élfica: fiadas finas, junta de 1 px, aresta de cima e da esquerda acesas; keep(x, y) recorta
function ashlar(P, x0, y0, w, h, R, s, ch = 4, cw = 11, keep = null, base = 2.6) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x0 + x, Y = y0 + y; if (keep && !keep(X, Y)) continue;
    const row = Math.floor(y / ch), off = (row % 2) * Math.floor(cw / 2), col = Math.floor((x + off) / cw), ly = y % ch, lx = (x + off) % cw;
    const joint = ly === ch - 1 || lx === cw - 1;
    P.put(X, Y, R, joint ? base - 1.3 : base + hash2(col, row, s) * 0.7 - 0.25 + (ly === 0 ? 0.8 : 0) + (lx === 0 ? 0.4 : 0) - x / w * 0.6 + cg(X, Y, s) * 0.5 + cn(X, Y, 30, 30, s + 3) * 0.3);
  }
}
// uma mancha sobre o que já está pintado (musgo, pó, vinho); só nas rampas de on (ou em tudo); bias engrossa
function stain(P, R, cover, s, bias, lift = 0, on = null) {
  const me = P.idOf(R);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0 || P.rid[k] === me) continue;
    if (on && !on.includes(P.ramps[P.rid[k]])) continue;
    const n = cn(x, y, 12, 12, s) + cn(x, y, 40, 40, s + 1) * 0.5 + (bias ? bias(x, y) : 0);
    if (n > 0.5 - cover) P.put(x, y, R, 0.9 + P.val[k] * 0.55 + cg(x, y, s + 2) * 0.7 + lift);
  }
}
// o musgo: pega no que olha para cima (ar em cima) e escorre um pouco
function moss(P, cover, s, bias, on = null) { stain(P, RP.musgo, cover, s, (x, y) => (bias ? bias(x, y) : 0) + (P.has(x, y - 1) ? (P.has(x, y - 3) ? -0.25 : 0.2) : 0.55), 0.5, on); }
// sujeira sem trocar de rampa: escurece o tom onde o ruído passa
function grime(P, amt, cover, s, bias, on = null) {
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0) continue; const R = P.ramps[P.rid[k]]; if (on && !on.includes(R)) continue;
    const n = cn(x, y, 16, 16, s) + cn(x, y, 50, 50, s + 1) * 0.5 + (bias ? bias(x, y) : 0) - (0.5 - cover);
    if (n > 0) P.put(x, y, R, P.val[k] - Math.min(1, n * 3) * amt);
  }
}
// as juntas entre peças: cada parte pintada com P.z maior fica na frente; a de trás ganha sombra onde encosta
function seams(P, amt = 1.1) {
  const d = new Float32Array(P.w * P.h);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0) continue; const z = P.zb[k];
    const fz = (xx, yy) => xx >= 0 && yy >= 0 && xx < P.w && yy < P.h && P.c[yy * P.w + xx] && P.zb[yy * P.w + xx] > z;
    if (fz(x - 1, y) || fz(x, y - 1)) d[k] = amt; else if (fz(x + 1, y) || fz(x, y + 1)) d[k] = amt * 0.45;
    const bz = (xx, yy) => xx >= 0 && yy >= 0 && xx < P.w && yy < P.h && P.c[yy * P.w + xx] && P.zb[yy * P.w + xx] < z;
    if (!d[k] && (bz(x - 1, y) || bz(x, y - 1))) d[k] = -0.5;
  }
  const oz = P.z;
  for (let k = 0; k < d.length; k++) if (d[k]) { P.z = P.zb[k]; P.put(k % P.w, (k / P.w) | 0, P.ramps[P.rid[k]], P.val[k] - d[k]); }
  P.z = oz;
}
// quinas lascadas: tira pixels de borda que têm ar em dois lados, com chance amt
function chip(P, amt, s, on = null) {
  const del = [];
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    if (!P.has(x, y) || P.isN(x, y)) continue; if (on && !on.includes(P.ramps[P.rid[y * P.w + x]])) continue;
    const a = (P.has(x - 1, y) ? 0 : 1) + (P.has(x + 1, y) ? 0 : 1) + (P.has(x, y - 1) ? 0 : 1) + (P.has(x, y + 1) ? 0 : 1);
    if (a >= 2 && hash2(x, y, s) < amt) del.push(x, y);
  }
  for (let i = 0; i < del.length; i += 2) P.clear(del[i], del[i + 1]);
}
// entulho ao longo do chão
function rubble(P, x0, x1, by, hgt, R, s) {
  for (let k = 0; k < (x1 - x0) * 0.8; k++) { const x = x0 + hash2(k, 0, s) * (x1 - x0), t = (x - x0) / (x1 - x0), y = by - hash2(k, 1, s) * hgt * Math.sin(t * Math.PI); P.blob(x, y, 1 + hash2(k, 2, s) * 1.4, 0.8 + hash2(k, 3, s), R, s + k, 2.4); }
  for (let x = x0; x <= x1; x++) if (hash2(x, 4, s) < 0.7) P.put(x, by, R, 1.8 + hash2(x, 5, s));
}

// espelha um desenho já fechado (os pontos marcados vão junto)
function mirror(Q) {
  const P = painter(Q.w, Q.h);
  for (let y = 0; y < Q.h; y++) for (let x = 0; x < Q.w; x++) {
    const k = y * Q.w + x; if (!Q.c[k]) continue; const K = y * Q.w + (Q.w - 1 - x);
    P.c[K] = Q.c[k]; P.rid[K] = Q.rid[k] >= 0 ? P.idOf(Q.ramps[Q.rid[k]]) : Q.rid[k]; P.val[K] = Q.val[k]; P.zb[K] = Q.zb[k];
  }
  for (const nm in Q.pts) for (const q of Q.pts[nm]) { const X = Q.w - 1 - q.x - (q.w ? q.w - 1 : 0); P.mark(nm, X, q.y, Object.assign({}, q, { x: X, y: q.y })); }
  return P;
}
// cracas: grupinhos de 2 x 2 (o canto de cima aceso, o de baixo escuro) onde o ruído passa; bias(x, y) engrossa
function barn(P, cover, s, bias, on = null) {
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0) continue; if (on && !on.includes(P.ramps[P.rid[k]])) continue;
    const n = cn(x >> 1, y >> 1, 6, 6, s) + (bias ? bias(x, y) : 0); if (n < 0.45 - cover * 0.6 || hash2(x >> 1, y >> 1, s + 1) < 0.6) continue;
    const a = x & 1, b = y & 1; if (a && !b && hash2(x, y, s + 2) < 0.5) continue; P.put(x, y, RP.concha, !a && !b ? 3.3 : a && b ? 1 : 2 + cg(x, y, s) * 0.5);
  }
}
// fiapos de alga pendurados das bordas de baixo (n pontas, até len px)
function strands(P, n, len, s, R = RP.alga) {
  const tips = [];
  for (let y = 1; y < P.h - 1; y++) for (let x = 0; x < P.w; x++) if (P.has(x, y) && !P.has(x, y + 1) && !P.isN(x, y)) tips.push(x, y);
  for (let i = 0; i < n && tips.length; i++) {
    const j = ((hash2(i, 3, s) * tips.length / 2) | 0) * 2, x0 = tips[j], y0 = tips[j + 1], L = 2 + ((hash2(i, 4, s) * len) | 0);
    for (let k = 1; k <= L && y0 + k < P.h; k++) { const x = x0 + Math.round(Math.sin(k * 0.7 + i) * 0.6); if (P.has(x, y0 + k)) break; P.put(x, y0 + k, R, 3 - k / L * 1.6 + cg(x, k, s) * 0.4); }
  }
}
// sal seco nas bordas de cima (o que ficou ao sol que não existe: ao ar)
function salt(P, cover, s, on = null) { stain(P, RP.vela, cover, s, (x, y) => (P.has(x, y - 1) ? -0.3 : 0.4), 1.2, on); }
// um peixinho de perfil (para as redes e o varal): 7 x 3, cabeça para a direita
function fishlet(P, x, y, s, R = RP.peixe, down = false) {
  const F = down ? ['.xx.', 'xxxx', 'xxxx', '.xx.', '.xx.', '.x..', 'xxx.'] : ['x..xxx.', 'xxxxxxx', 'x..xxx.'];
  for (let j = 0; j < F.length; j++) for (let i = 0; i < F[j].length; i++) if (F[j][i] === 'x') P.put(x + i, y + j, R, 3.2 - j * 0.6 + cg(x + i, y + j, s) * 0.4);
  if (!down) P.put(x + 5, y, RP.sombra, 0);
}
// a malha de rede: losangos de 4 px dentro de keep(x, y)
function mesh(P, x0, y0, w, h, keep, s, R = RP.corda) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (!keep(x, y)) continue; const a = ((x + y) % 4 + 4) % 4, b = ((x - y) % 4 + 4) % 4;
    if (a === 0 || b === 0) P.put(x, y, R, (a === 0 && b === 0 ? 3.6 : 2.6) + cg(x, y, s) * 0.5);
  }
}
const ellOk = (cx, cy, rx, ry) => (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; };

/* =============================== as Praias Negras =============================== */
function boat(k) {   // 56 x 22: o bote virado de quilha para cima: as fiadas de tábua seguindo a curva, a quilha escura, a borda clara no chão, cracas embaixo (k 1: o casco furado mostrando as cavernas por dentro)
  const W = 56, P = painter(W, 22), by = 21, x0 = 2, x1 = 53, H = 15, s = 811 + k * 7;
  const top = x => {
    const u = (x + 0.5 - x0) / (x1 - x0); if (u < 0 || u > 1) return 99;
    if (u < 0.32) { const t = u / 0.32; return by - H * Math.pow(t, 0.55) * (0.95 + t * 0.05); }   // a proa afina em ponta
    if (u > 0.94) return by - H + (u - 0.94) * 30;                                               // o painel de popa, quase reto
    return by - H - Math.sin((u - 0.32) / 0.62 * Math.PI) * 0.8;
  };
  for (let x = x0; x <= x1; x++) {
    const t0 = top(x); if (t0 > by) continue;
    for (let y = Math.ceil(t0); y <= by; y++) {
      const f = (by - y) / Math.max(1, by - t0), st = Math.floor(f * 5), fr = f * 5 - st;
      let v = 2.5 + (fr > 0.82 ? 0.8 : fr < 0.15 ? -1.1 : 0) - (1 - f) * 0.4 + Math.sin(x * 0.4 + st * 2.1) * 0.25 + cg(x, y, s) * 0.45 + cn(x, y, 30, 30, s) * 0.3;
      if (y - t0 < 2) { P.put(x, y, RP.madeira, 1.6 + (y - t0 < 1 ? 1 : 0) + cg(x, y, s) * 0.4); continue; }   // a quilha
      if (by - y < 2) { P.put(x, y, RP.deriva, 3.2 - (by - y) * 0.9 + cg(x, y, s) * 0.5); continue; }        // a borda
      if (((x - x0) % 9 === 0) && f < 0.85) v -= 0.6;                                                       // os pregos das cavernas
      P.put(x, y, st % 2 ? RP.madeira : RP.deriva, v - (st % 2 ? 0 : 1.2));
    }
  }
  if (k === 1) {   // o rombo: as tábuas partidas, o escuro de dentro e duas cavernas atravessando
    const hx = 34, hy = 12;
    P.ell(hx, hy, 6.5, 4.2, (x, y, dx, dy, d) => { if (!P.has(x, y)) return; P.put(x, y, RP.sombra, 1.2 + dy * 0.8 + cg(x, y, s) * 0.5); });
    for (const rx of [31, 37]) for (let y = hy - 4; y <= hy + 4; y++) if (P.is(rx, y, RP.sombra)) P.put(rx, y, RP.madeira, 2 + (y < hy ? 0.6 : -0.3));
    P.ell(hx, hy, 7.6, 5.2, (x, y, dx, dy, d) => { if (d > 0.72 && P.has(x, y) && !P.is(x, y, RP.sombra) && hash2(x, y, s) < 0.6) P.put(x, y, RP.deriva, 4.2); });
  }
  barn(P, 0.35, s + 3, (x, y) => (y - 12) / 12);
  salt(P, 0.12, s + 5, [RP.madeira]);
  return P.done();
}
function anchor(k) {   // 44 x 30: a âncora caída de lado: o anel e a corrente, o cepo de madeira podre, a haste, os braços em curva com as patas (k 1: espelhada, meio enterrada)
  const P = painter(44, 30), s = 823 + k * 5;
  tube(P, t => [7 + t * 25, 7 + t * 15], () => 3.4, RP.ferro, s, 2.6);                                     // a haste
  tube(P, bez([32, 22], [40, 22], [42, 14], [39, 7]), t => 3 - t * 0.8, RP.ferro, s, 2.8);                   // o braço de cima
  tube(P, bez([32, 22], [30, 27], [24, 28], [19, 26]), t => 3 - t * 0.8, RP.ferro, s, 2.3);                  // o braço do chão
  for (const [fx, fy, a] of [[39, 6, -0.4], [18, 26, 2.6]]) for (let j = 0; j < 6; j++) for (let i = -3 + (j >> 1); i <= 3 - (j >> 1); i++) {
    const X = fx + Math.round(Math.cos(a) * i - Math.sin(a) * j * 0.6), Y = fy + Math.round(Math.sin(a) * i + Math.cos(a) * j * 0.6) - 2; P.put(X, Y, RP.ferro, 2.9 - j * 0.2 + cg(X, Y, s) * 0.4);
  }
  P.z = 1; tube(P, t => [3 + t * 13, 16 - t * 13], () => 2.6, RP.madeira, s + 1, 2.4);                       // o cepo atravessado
  P.z = 2; P.ell(5, 5, 3.6, 3.6, (x, y, dx, dy, d) => { if (d > 0.36) P.put(x, y, RP.ferro, 3 - (dx + dy) * 0.9); });   // o anel
  for (let i = 0; i < 5; i++) { const cx = 3 - i * 0.2, cy = 9 + i * 4; P.ell(cx, cy, 1.6, 2.2, (x, y, dx, dy, d) => { if (d > 0.3) P.put(x, y, RP.ferro, 2.6 - dx); }); }
  seams(P); stain(P, RP.ferrugem, 0.18, s + 2, (x, y) => (y > 18 ? 0.15 : 0), 0, [RP.ferro]); barn(P, 0.25, s + 3, (x, y) => (y - 18) / 14);
  if (k === 1) { for (let y = 26; y < 30; y++) for (let x = 0; x < 44; x++) if (P.has(x, y) && hash2(x, y, s) < 0.5 + (y - 26) * 0.2) P.put(x, y, RP.lodo, 2 + cg(x, y, s)); }
  P.done(); return k ? mirror(P) : P;
}
function barrel(k) {   // 20 x 24 de pé (k 1: 28 x 18 deitado): o barril de óleo: aduelas, três aros enferrujados, a tampa com o batoque, o óleo escuro escorrendo
  const s = 837 + k * 3;
  if (k === 0) {
    const P = painter(20, 24), cx = 10;
    for (let y = 2; y < 24; y++) {
      const hw = 7 + Math.sin(Math.PI * (y - 2) / 21) * 1.6;
      for (let x = Math.ceil(cx - hw); x < cx + hw; x++) {
        const q = (x + 0.5 - cx) / hw, hoop = [4, 5, 12, 13, 20, 21].includes(y);
        let v = 2.7 - q * 1.2 - q * q * 0.8 + cg(x, y, s) * 0.4 + ((x + 1) % 3 === 0 ? -0.7 : 0);
        if (hoop) P.put(x, y, RP.ferrugem, v + (y % 2 ? -0.4 : 0.6)); else P.put(x, y, RP.madeira, v);
      }
    }
    P.ell(cx, 2, 7.2, 1.8, (x, y, dx, dy, d) => P.put(x, y, RP.madeira, d > 0.55 ? 3.6 : 1.4 + dy));
    P.put(13, 2, RP.ferro, 1); P.put(14, 2, RP.ferro, 0.5);
    for (let y = 3; y < 20; y++) if (hash2(y, 1, s) < 0.85) P.put(5 + Math.round(Math.sin(y * 0.5)), y, RP.sombra, 2 + (y < 6 ? 1.5 : 0));   // o óleo escorrido
    salt(P, 0.1, s + 1, [RP.madeira]); barn(P, 0.22, s + 2, (x, y) => (y - 14) / 10);
    return P.done();
  }
  const P = painter(28, 18), cy = 9;
  for (let x = 1; x < 24; x++) {
    const hh = 7 + Math.sin(Math.PI * (x - 1) / 22) * 1.4;
    for (let y = Math.ceil(cy - hh); y < cy + hh; y++) {
      const q = (y + 0.5 - cy) / hh, hoop = [3, 4, 11, 12, 19, 20].includes(x);
      const v = 2.7 - q * 1.3 - q * q * 0.7 + cg(x, y, s) * 0.4 + ((y + 1) % 3 === 0 ? -0.7 : 0);
      P.put(x, y, hoop ? RP.ferrugem : RP.madeira, v + (hoop && x % 2 ? 0.5 : 0));
    }
  }
  P.ell(24, cy, 2.6, 7.4, (x, y, dx, dy, d) => P.put(x, y, RP.madeira, d > 0.6 ? 3.4 - dy : 2.2 + Math.sin(Math.hypot(dx, dy) * 9) * 0.6));
  P.put(24, cy, RP.ferro, 0.8);
  for (let x = 2; x < 22; x++) if (hash2(x, 2, s) < 0.7) P.put(x, cy + 7 - (x > 12 ? 0 : 1), RP.sombra, 1.5);
  salt(P, 0.1, s + 1, [RP.madeira]); barn(P, 0.3, s + 2, (x, y) => (y - 10) / 8);
  return P.done();
}
function figurehead(k) {   // 34 x 44 (k 1: 46 x 32): a figura de proa caída: a mulher-peixe de madeira entalhada, os braços cruzados, o cabelo pintado, a cauda de escamas enrolada, a tinta descascando
  const Q = painter(24, 50), s = 851 + k * 11;
  tube(Q, bez([12, 26], [16, 34], [6, 40], [10, 48]), t => 9 - t * 5, RP.escama, s, 2.8);                    // a cauda
  for (let y = 26; y < 49; y++) for (let x = 0; x < 24; x++) if (Q.is(x, y, RP.escama) && ((x + (y >> 1) * 2) % 4 === 0) && y % 2 === 0) Q.put(x, y, RP.escama, 1.4);
  Q.blob(8, 47, 4.5, 2.2, RP.escama, s + 1, 3); Q.blob(13, 48, 3, 1.6, RP.escama, s + 2, 2.4);
  Q.z = 1; Q.blob(12, 20, 5.4, 7.6, RP.vela, s + 3, 2.8);                                                      // o tronco
  Q.line(7, 17, 16, 22, RP.vela, 3.6, 2); Q.line(16, 17, 8, 23, RP.vela, 2.2, 2);                             // os braços cruzados
  Q.z = 2; Q.blob(13, 7.5, 4.4, 5.4, RP.vela, s + 4, 3.1);                                                     // a cabeça de perfil
  Q.put(17, 8, RP.vela, 4); Q.put(18, 8, RP.vela, 3.4); Q.put(17, 9, RP.vela, 2.6); Q.put(15, 7, RP.sombra, 0.5); Q.put(16, 11, RP.pintura, 2);
  Q.z = 3; for (let i = 0; i < 6; i++) tube(Q, bez([12 - i * 0.6, 2 + i * 0.4], [7 - i, 6 + i], [5 - i * 0.4, 14 + i], [6 + i * 0.5, 24 + i * 0.8]), t => 2.2 - t, RP.pintura, s + 5 + i, 2.6 - (i % 2) * 0.6);   // o cabelo
  Q.z = 0; Q.box(14, 14, 9, 7, RP.madeira, s + 6, 2);                                                           // o toco da trave que a prendia
  seams(Q); stain(Q, RP.madeira, 0.16, s + 7, (x, y) => (Q.has(x - 1, y) && Q.has(x + 1, y) ? 0 : 0.3), 0, [RP.vela, RP.pintura]);
  barn(Q, 0.2, s + 8, (x, y) => (y - 30) / 20);
  const P = k ? painter(46, 32) : painter(34, 44);
  if (k) blit(P, Q, 9, -6, 1.28, 12, 24); else blit(P, Q, 6, -4, 0.32, 12, 24);
  return P.done();
}
function cannon(k) {   // 44 x 24: o canhão enferrujado na carreta podre: o cano com os reforços e o botão de culatra, as rodas de raios (k 1: caído fora da carreta, três balas e uma roda partida)
  const P = painter(44, 24), s = 863 + k * 9;
  if (k === 0) {
    P.box(9, 13, 22, 6, RP.madeira, s, 2.3); P.box(11, 10, 6, 4, RP.madeira, s + 1, 2.1);
    for (const [wx, wy] of [[13, 19], [28, 19]]) { P.z = 2; P.ell(wx, wy, 4.6, 4.6, (x, y, dx, dy, d) => { const a = Math.atan2(dy, dx), sp = Math.abs(((a * 8 / Math.PI) % 2 + 2) % 2 - 1) < 0.25; if (d > 0.62 || sp || d < 0.1) P.put(x, y, RP.madeira, d > 0.62 ? 3 - dy : 2.4); }); }
    P.z = 1; tube(P, t => [4 + t * 37, 11 - t * 4], t => 7.4 - t * 2.6 + (t > 0.9 ? 1.2 : 0), RP.ferro, s + 2, 2.6);
    for (const t of [0.12, 0.42, 0.75]) { const x = 4 + t * 37, y = 11 - t * 4; P.line(x, y - 4, x, y + 4, RP.ferro, 3.8); }
    P.blob(2.5, 11.5, 2, 2, RP.ferro, s + 3, 3); P.put(41, 7, RP.sombra, 0); P.put(41, 6, RP.sombra, 0.5);
  } else {
    P.z = 1; tube(P, t => [3 + t * 34, 18 + t * 1.5], t => 7 - t * 2.4 + (t > 0.92 ? 1.2 : 0), RP.ferro, s + 2, 2.6);
    for (const t of [0.12, 0.42, 0.75]) { const x = 3 + t * 34, y = 18 + t * 1.5; P.line(x, y - 4, x, y + 3, RP.ferro, 3.8); }
    P.put(37, 20, RP.sombra, 0); for (const [bx, by] of [[39.5, 21.5], [42, 21.5], [40.8, 19]]) P.blob(bx, by, 1.7, 1.7, RP.ferro, s + bx, 3);
    P.z = 0; P.ell(12, 10, 5, 5, (x, y, dx, dy, d) => { const a = Math.atan2(dy, dx); if (dx > 0.3 && dy > -0.2) return; const sp = Math.abs(((a * 8 / Math.PI) % 2 + 2) % 2 - 1) < 0.25; if (d > 0.62 || sp) P.put(x, y, RP.madeira, d > 0.62 ? 3 - dy : 2.4); });
  }
  seams(P); stain(P, RP.ferrugem, 0.25, s + 4, null, 0.2, [RP.ferro]); barn(P, 0.2, s + 5, (x, y) => (y - 14) / 10);
  return P.done();
}
function mast(k) {   // 34 x 90: o mastro quebrado de pé: o toco lascado no alto, a verga atravessada, a vela rasgada pendurada em farrapos, os cabos descendo até a base (k 1: a verga caída de um lado)
  const P = painter(34, 90), s = 877 + k * 13, cx = 17;
  for (let y = 6; y < 90; y++) { const hw = 2.4 + (y / 90) * 0.8; for (let x = Math.ceil(cx - hw); x < cx + hw; x++) { const q = (x + 0.5 - cx) / hw; P.put(x, y, RP.madeira, 2.8 - q * 1.2 - q * q * 0.6 + cg(x, y, s) * 0.4 + Math.sin(y * 0.3) * 0.15); } }
  for (let x = 14; x <= 20; x++) { const cut = 6 + Math.round(hash2(x, 0, s) * 5); for (let y = 0; y < cut; y++) P.clear(x, y); P.put(x, cut, RP.deriva, 4.4); }   // as lascas
  for (const y of [30, 31, 56, 57]) for (let x = 14; x <= 20; x++) if (P.has(x, y)) P.put(x, y, RP.ferrugem, y % 2 ? 2 : 3);       // os aros
  P.z = 1; const yA = k ? [3, 18] : [2, 20], yB = k ? [31, 34] : [32, 18];
  tube(P, t => [yA[0] + (yB[0] - yA[0]) * t, yA[1] + (yB[1] - yA[1]) * t], () => 2.6, RP.madeira, s + 1, 2.5);                     // a verga
  P.z = 0; for (let x = 4; x <= 30; x++) {   // a vela: farrapos pendurados da verga, dobras, buracos
    const t = (x - yA[0]) / (yB[0] - yA[0]), y0 = Math.round(yA[1] + (yB[1] - yA[1]) * t) + 1, L = 14 + Math.round(cn(x, 0, 6, 6, s) * 22 + Math.sin(x * 0.9) * 3);
    for (let y = y0; y < y0 + L && y < 70; y++) { if (cn(x, y, 5, 7, s + 2) > 0.2 && y > y0 + 4) continue; P.put(x, y, RP.vela, 2.6 + Math.sin(x * 0.75) * 0.9 - (y - y0) / 40 + cg(x, y, s) * 0.4); }
  }
  P.z = 2; for (const [ax, ay, bx, by] of [[yA[0] + 1, yA[1], 3, 89], [yB[0] - 1, yB[1], 31, 89], [cx, 10, 6, 89]]) P.line(ax, ay, bx, by, RP.corda, 2.4);
  seams(P); stain(P, RP.deriva, 0.1, s + 3, null, 0, [RP.madeira]); barn(P, 0.35, s + 4, (x, y) => (y - 74) / 14); strands(P, 6, 5, s + 5);
  return P.done();
}
function netPoles(k) {   // 48 x 40: a rede secando em duas varas: a rede caída em barriga, as boias de cortiça na corda de cima, peixes secando (k 1: a rede rasgada, uma vara torta)
  const P = painter(48, 40), s = 889 + k * 7;
  for (const [x, lean] of [[3, 0], [44, k ? -3 : 0]]) for (let y = 3; y < 40; y++) { const X = Math.round(x + lean * (1 - y / 40)); P.put(X, y, RP.deriva, 3 + cg(X, y, s) * 0.5); P.put(X + 1, y, RP.deriva, 1.8 + cg(X + 1, y, s) * 0.5); }
  const top = x => 5 + Math.sin(Math.PI * (x - 4) / 40) * 5, bot = x => 30 + Math.sin(Math.PI * (x - 4) / 40) * 4 + cn(x, 0, 5, 5, s) * 4;
  mesh(P, 5, 4, 39, 34, (x, y) => y >= top(x) && y <= bot(x) && !(k && cn(x, y, 8, 8, s + 3) > 0.18), s + 1);
  for (let x = 4; x <= 44; x++) P.put(x, Math.round(top(x)), RP.corda, 3.4);
  for (let x = 8; x < 42; x += 7) P.blob(x, top(x) + 1, 1.6, 1.3, RP.barro, s + x, 3.2);
  for (let i = 0; i < (k ? 2 : 4); i++) fishlet(P, 10 + i * 8, Math.round(bot(10 + i * 8)) - 1, s + 4 + i, RP.peixe, true);
  return P.done();
}
function fishTrap(k) {   // 30 x 20: a armadilha de peixe: o cesto de vime em cone deitado, a boca larga escura, as amarras, uma boia (k 1: de pé, a boca para cima)
  const Q = painter(30, 20), s = 901 + k * 5, cy = 11;
  for (let x = 2; x < 28; x++) {
    const r = 8 * (1 - (x - 2) / 26 * 0.72);
    for (let y = Math.ceil(cy - r); y < cy + r; y++) {
      const q = (y + 0.5 - cy) / r, wv = ((Math.floor(x / 2) + Math.floor((y + (x % 4 < 2 ? 0 : 1)) / 2)) % 2);
      if ((x % 3 === 1) && (y % 3 === 1)) { Q.put(x, y, RP.sombra, 1.2); continue; }
      Q.put(x, y, RP.deriva, 2.5 - q * 1.1 + wv * 0.7 + cg(x, y, s) * 0.4);
    }
  }
  Q.ell(3, cy, 2.2, 7.8, (x, y, dx, dy, d) => Q.put(x, y, d > 0.5 ? RP.deriva : RP.sombra, d > 0.5 ? 3.6 - dy : 0.6));
  for (const x of [9, 18]) for (let y = 0; y < 20; y++) if (Q.has(x, y) && !Q.is(x, y, RP.sombra)) Q.put(x, y, RP.corda, 3.4 - Math.abs(y - cy) * 0.1);
  Q.z = 1; Q.line(27, cy, 29, 3, RP.corda, 2.4); Q.blob(29, 2.5, 1.5, 1.5, RP.barro, s + 1, 3.4);
  salt(Q, 0.08, s + 2);
  if (!k) return Q.done();
  const P = painter(22, 32); blit(P, Q, -4, 6, -Math.PI / 2, 15, 11); return P.done();
}
function totem(k) {   // 22 x 56: o totem da gente-peixe: a estaca de madeira de deriva com três cabeças de peixe entalhadas e pintadas de verde-água, conchas penduradas em fios, a crista de barbatana no alto, os olhos de cima acesos
  const P = painter(22, 56), s = 913 + k * 17, cx = 11;
  for (let y = 4; y < 56; y++) for (let x = cx - 2; x <= cx + 2; x++) P.put(x, y, RP.deriva, 2.6 - (x - cx) * 0.5 + cg(x, y, s) * 0.5);
  const heads = k ? [[16, 9], [36, 8]] : [[12, 8], [27, 7], [41, 6]];
  heads.forEach(([hy, r], i) => {
    P.z = 1 + i; const R = i % 2 ? RP.deriva : RP.escama;
    P.ell(cx, hy, r + 0.5, r * 0.75, (x, y, dx, dy, d) => { if (dx > 0.55 && Math.abs(dy) < 0.18) return; P.put(x, y, R, 2.8 - (dx + dy) * 0.9 - d * 0.5 + cg(x, y, s + i) * 0.4); });   // a boca aberta para a direita
    for (let j = -2; j <= 2; j++) P.put(cx - 2 + (j & 1), hy + j, R, 1.4);                                                 // a guelra
    P.put(cx + 2, hy - 2, RP.sombra, 0.4); P.put(cx + 3, hy - 2, RP.sombra, 0.4);
    if (i === heads.length - 1) { P.N(cx + 2, hy - 2, LC.ciano); P.N(cx + 3, hy - 2, LC.cianoC); P.mark('brilho', cx + 2, hy - 2); }
  });
  P.z = 4; for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; P.line(cx, 4, cx + Math.sin(a) * 9, 4 - Math.cos(a) * 4 + 3, RP.escama, 3 - Math.abs(i - 2) * 0.4); }
  for (const [hx, hy] of [[3, 22], [19, 33], [4, 44]]) { P.line(cx, hy - 5, hx, hy, RP.corda, 2); P.blob(hx, hy + 1.4, 1.8, 1.6, RP.concha, s + hx, 3.3); }
  for (let x = 4; x < 18; x++) if (hash2(x, 0, s) < 0.7) P.blob(x, 55, 1.4, 1, RP.pedra, s + x, 2.4);
  seams(P); salt(P, 0.12, s + 2, [RP.deriva]); barn(P, 0.15, s + 3, (x, y) => (y - 44) / 10);
  return P.done();
}
function brazier(k) {   // 24 x 26 (k 1: 20 x 36): o braseiro de óleo de peixe: a bacia de ferro enferrujado com os ossos de peixe na borda, o óleo escuro e o fogo verde (vivo), três pernas tortas (k 1: no alto de uma estaca de deriva)
  const H = k ? 36 : 26, P = painter(k ? 20 : 24, H), s = 929 + k * 3, cx = k ? 10 : 12, by = k ? 14 : 13;
  if (k) { for (let y = by + 3; y < H; y++) for (let x = cx - 1; x <= cx + 1; x++) P.put(x, y, RP.deriva, 2.6 - (x - cx) * 0.7 + cg(x, y, s) * 0.5); for (let x = cx - 4; x <= cx + 4; x++) if (hash2(x, 1, s) < 0.7) P.blob(x, H - 1, 1.3, 1, RP.pedra, s + x, 2.4); }
  else for (const [ax, bx] of [[cx - 5, cx - 9], [cx, cx + 1], [cx + 5, cx + 9]]) P.line(ax, by + 2, bx, H - 1, RP.ferro, 2.2);
  P.z = 1; P.ell(cx, by - 1, 8, 4.4, (x, y, dx, dy, d) => { if (dy < 0) return; P.put(x, y, RP.ferro, 3 - dy * 1.6 - dx * 0.6 + cg(x, y, s) * 0.4); });
  for (let x = cx - 8; x <= cx + 8; x++) P.put(x, by - 1, RP.ferro, 3.8);
  for (let x = cx - 6; x <= cx + 6; x++) { P.put(x, by - 2, RP.sombra, 2); if (hash2(x, 2, s) < 0.45) P.N(x, by - 2, hash2(x, 3, s) < 0.5 ? LC.oleo : LC.oleoF); }
  P.z = 2; for (const [fx, a] of [[cx - 7, -1], [cx + 6, 1]]) { P.line(fx, by - 2, fx + a * 2, by - 6, RP.osso, 3.4); for (let j = 0; j < 3; j++) P.line(fx + a * (0.6 * j + 0.4), by - 3 - j, fx + a * (0.6 * j + 1.8), by - 3 - j, RP.osso, 2.6); }
  P.mark('fogo', cx - 5, by - 3, { w: 11 });
  seams(P); stain(P, RP.ferrugem, 0.3, s + 2, null, 0.2, [RP.ferro]);
  return P.done();
}
function lighthouse(k) {   // 38 x 104: o farol da gente-peixe: a base de pedras empilhadas, a torre de varas de deriva amarradas com escoras em X e a escada, o piso de tábua, a gaiola de latão com o fogo verde e a concha enorme atrás que joga a luz, o telhado de placas de concha
  const P = painter(38, 104), s = 941 + k * 19, cx = 19;
  for (let y = 74; y < 104; y++) { const hw = 11 + (y - 74) / 30 * 5; for (let x = Math.ceil(cx - hw); x < cx + hw; x++) { const r = Math.floor((y - 74) / 4), o = (r % 2) * 3, c = Math.floor((x + o) / 6), j = (y - 74) % 4 === 3 || (x + o) % 6 === 5; P.put(x, y, RP.pedra, j ? 1.1 : 2.4 + hash2(c, r, s) * 0.9 + ((y - 74) % 4 === 0 ? 0.8 : 0) - (x - cx) / hw * 0.6 + cg(x, y, s) * 0.4); } }
  P.z = 1; for (const [a, b] of [[cx - 10, cx - 6], [cx + 10, cx + 6], [cx - 4, cx - 3], [cx + 4, cx + 3]]) tube(P, t => [a + (b - a) * t, 76 - t * 52], () => 2.2, RP.deriva, s + a, 2.6);   // as varas
  for (let y0 = 30; y0 < 72; y0 += 14) { P.line(cx - 9 + (y0 - 30) * 0.08, y0 + 13, cx + 8 - (y0 - 30) * 0.08, y0, RP.deriva, 2.2); P.line(cx - 9 + (y0 - 30) * 0.08, y0, cx + 8 - (y0 - 30) * 0.08, y0 + 13, RP.deriva, 1.8); for (let x = cx - 9; x <= cx + 9; x++) if (P.has(x, y0)) P.put(x, y0, RP.corda, 3); }
  P.z = 2; for (let y = 26; y < 76; y += 3) P.line(cx - 2, y, cx + 2, y, RP.madeira, 3.2); for (let y = 24; y < 76; y++) { P.put(cx - 2, y, RP.madeira, 2); P.put(cx + 2, y, RP.madeira, 2); }   // a escada
  P.z = 3; for (let x = 3; x < 35; x++) for (let y = 22; y < 25; y++) P.put(x, y, RP.madeira, 2.8 + (y === 22 ? 1 : y === 24 ? -1 : 0) + ((x - 3) % 6 === 5 ? -0.8 : 0) + cg(x, y, s) * 0.4);   // o piso
  P.z = 1; P.ell(cx, 15, 13, 9, (x, y, dx, dy, d) => { if (dy > 0.6) return; const rib = Math.abs(((Math.atan2(dy, dx) * 6 / Math.PI) % 1 + 1) % 1 - 0.5) < 0.12; P.put(x, y, RP.concha, 3 - d * 1.2 + (rib ? 0.9 : 0) - dy * 0.5 + cg(x, y, s) * 0.4); });   // a concha refletora
  P.z = 4; for (const x of [cx - 7, cx - 2, cx + 2, cx + 7]) for (let y = 8; y < 22; y++) P.put(x, y, RP.latao, 3.2 - (x > cx ? 1 : 0)); for (let x = cx - 7; x <= cx + 7; x++) { P.put(x, 8, RP.latao, 3.8); P.put(x, 21, RP.latao, 2.6); }
  P.ell(cx, 19, 5, 2.4, (x, y, dx, dy, d) => { if (dy > 0) P.put(x, y, RP.ferro, 3 - dy * 2); });
  for (let x = cx - 4; x <= cx + 4; x++) P.N(x, 19, hash2(x, 9, s) < 0.5 ? LC.oleo : LC.oleoC);
  P.mark('fogo', cx - 4, 18, { w: 9 }); P.mark('farol', cx, 14);
  P.z = 5; for (let y = 0; y < 9; y++) { const hw = 3 + y * 1.35; for (let x = Math.ceil(cx - hw); x < cx + hw; x++) { const sc = ((x + (y % 2) * 2) % 4 === 0) || y % 3 === 2; P.put(x, y, RP.concha, 3.6 - y * 0.12 - (x - cx) / hw * 0.8 + (sc ? -1 : 0) + cg(x, y, s) * 0.4); } }
  for (const fy of [36, 52]) { P.line(cx + 9, fy - 4, cx + 9, fy, RP.corda, 2); fishlet(P, cx + 7, fy, s + fy, RP.osso, true); }
  seams(P); salt(P, 0.1, s + 2, [RP.deriva, RP.madeira]); barn(P, 0.3, s + 3, (x, y) => (y - 90) / 14); strands(P, 5, 4, s + 4);
  return P.done();
}
function stiltHut(k) {   // 58 x 60: a cabana de palafita: as estacas com cracas e algas, o piso de tábua, as paredes de tábua com frestas, a porta escura, a janelinha redonda com uma luz verde fraca, o telhado de alga seca em farrapos, a escada (k 1: o telhado furado, um varal de peixes)
  const P = painter(58, 60), s = 953 + k * 23;
  for (const x of [6, 19, 38, 51]) for (let y = 34; y < 60; y++) { P.put(x, y, RP.madeira, 2.8 + cg(x, y, s) * 0.5); P.put(x + 1, y, RP.madeira, 1.8 + cg(x + 1, y, s) * 0.5); }
  for (const [a, b] of [[7, 39], [39, 51]]) { P.line(a, 40, b, 52, RP.deriva, 2.2); P.line(a, 52, b, 40, RP.deriva, 1.8); }
  P.z = 1; for (let x = 8; x < 48; x++) for (let y = 15; y < 33; y++) { const pk = (x - 8) % 4, gap = pk === 3 && cn(x, y, 4, 9, s) > 0.12; P.put(x, y, gap ? RP.sombra : RP.madeira, gap ? 0.8 : 2.4 + (pk === 0 ? 0.8 : pk === 3 ? -0.9 : 0) + cg(x, y, s) * 0.45 + cn(x, y, 20, 20, s + 1) * 0.4); }
  for (let x = 31; x < 38; x++) for (let y = 21; y < 33; y++) P.put(x, y, RP.sombra, 0.6 + (x === 31 ? 0.8 : 0));   // a porta
  P.ell(19.5, 23.5, 3.4, 3.4, (x, y, dx, dy, d) => { if (d > 0.55) P.put(x, y, RP.deriva, 3.4 - dy); else P.N(x, y, d < 0.15 ? LC.oleoC : hash2(x, y, s) < 0.5 ? LC.oleo : LC.oleoF); });
  P.z = 2; for (let x = 2; x < 56; x++) for (let y = 32; y < 35; y++) P.put(x, y, RP.deriva, 2.6 + (y === 32 ? 1 : y === 34 ? -1 : 0) + ((x - 2) % 7 === 6 ? -0.9 : 0) + cg(x, y, s) * 0.4);
  P.z = 3; for (let x = 0; x < 58; x++) {   // o telhado: alga seca em fiapos pendurados, mais escura embaixo
    const ytop = 2 + Math.abs(x - 28) * 0.52, yb = 17 + Math.round(cn(x, 0, 3, 3, s + 2) * 4);
    for (let y = Math.ceil(ytop); y < yb; y++) { if (k && Math.hypot(x - 40, y - 10) < 3.4) { if (y > 8) P.put(x, y, RP.sombra, 0.5); continue; } P.put(x, y, RP.alga, 3 - (y - ytop) / 12 - (x > 28 ? 0.5 : 0) + Math.sin(x * 1.7 + y * 0.2) * 0.45 + cg(x, y, s) * 0.5); }
  }
  for (let x = 2; x < 56; x++) if (hash2(x, 5, s) < 0.6) P.put(x, Math.round(2 + Math.abs(x - 28) * 0.52), RP.alga, 4.2);
  P.z = 4; for (let y = 35; y < 60; y++) { P.put(42, y, RP.deriva, 2.6); P.put(46, y, RP.deriva, 2); if (y % 4 === 0) for (let x = 43; x < 46; x++) P.put(x, y, RP.deriva, 3.4); }
  if (k) { P.line(4, 30, 8, 26, RP.corda, 2); for (let i = 0; i < 3; i++) fishlet(P, 2 + i * 2, 29 + i, s + i, RP.peixe, true); }
  else { for (let x = 10; x < 30; x++) if (x % 5 === 0) fishlet(P, x - 1, 13 + 4 + (x % 2), s + x, RP.osso, true); }
  P.mark('brilho', 19, 23);
  seams(P); salt(P, 0.06, s + 3, [RP.madeira, RP.deriva]); barn(P, 0.45, s + 4, (x, y) => (y - 50) / 8, [RP.madeira, RP.deriva]); strands(P, 9, 6, s + 5);
  return P.done();
}
function shipLantern(k) {   // 14 x 36: a lanterna de navio pendurada: a corrente (k 1: a corda), o chapéu de latão com a argola, o vidro grosso com a chama dentro, as barras, o fundo
  const P = painter(14, 36), s = 967 + k * 3;
  for (let y = 0; y < 15; y++) { if (k) P.put(7 + (y % 4 === 0 ? 0 : 0), y, RP.corda, 2.6 + (y % 2) * 0.8); else { const o = y % 3; P.put(o === 1 ? 6 : 7, y, RP.ferro, 3.2); if (o !== 1) P.put(8, y, RP.ferro, 1.8); } }
  P.ell(7, 15, 2, 1.6, (x, y, dx, dy, d) => { if (d > 0.3) P.put(x, y, RP.latao, 3.4 - dy); });
  for (let y = 16; y < 20; y++) { const hw = 1.5 + (y - 16) * 1.3; for (let x = Math.ceil(7 - hw); x < 7 + hw; x++) P.put(x, y, RP.latao, 3.4 - (y - 16) * 0.3 - (x - 7) / hw); }
  for (let y = 20; y < 30; y++) for (let x = 2; x < 12; x++) {
    if (x === 2 || x === 11 || x === 7) { P.put(x, y, RP.latao, x === 2 ? 3.6 : 2.4); continue; }
    const d = Math.hypot(x - 6.5, (y - 25) * 0.8); if (d < 2.4) P.N(x, y, d < 1.2 ? LC.laranjaC : LC.laranja); else P.N(x, y, mixHex(LC.laranja, '#3a1a08', clamp((d - 2) / 4, 0, 0.85)));
  }
  for (let x = 1; x < 13; x++) { P.put(x, 30, RP.latao, 3); P.put(x, 31, RP.latao, 1.8); }
  P.mark('chama', 6, 24, { c: LC.laranja });
  stain(P, RP.azinhavre, 0.2, s, null, 0, [RP.latao]);
  return P.done();
}
function hangingNets(k) {   // 52 x 30: as redes penduradas do teto em duas barrigas, as boias, a alga presa e uma espinha de peixe na malha (k 1: uma barriga só, rasgada)
  const P = painter(52, 30), s = 979 + k * 5;
  const pins = k ? [2, 49] : [2, 26, 49], sag = k ? 24 : 18;
  const top = x => { for (let i = 0; i < pins.length - 1; i++) if (x >= pins[i] && x <= pins[i + 1]) return 1 + Math.sin(Math.PI * (x - pins[i]) / (pins[i + 1] - pins[i])) * 3; return 1; };
  const bot = x => { for (let i = 0; i < pins.length - 1; i++) if (x >= pins[i] && x <= pins[i + 1]) return 2 + Math.sin(Math.PI * (x - pins[i]) / (pins[i + 1] - pins[i])) * (sag + cn(x, 0, 4, 4, s) * 4); return 1; };
  mesh(P, 0, 0, 52, 30, (x, y) => y >= top(x) && y <= bot(x) && !(k && Math.hypot(x - 30, y - 16) < 5), s);
  for (let x = 0; x < 52; x++) P.put(x, Math.round(top(x)), RP.corda, 3.4);
  for (const x of pins) { P.put(x, 0, RP.ferro, 3); P.put(x, 1, RP.ferro, 2); }
  for (let x = 6; x < 48; x += 8) P.blob(x, top(x) + 1.2, 1.5, 1.2, RP.barro, s + x, 3.2);
  for (let i = 0; i < 4; i++) { const x = 6 + i * 12, y = Math.round(bot(x)); for (let j = 0; j < 4 + i; j++) P.put(x + Math.round(Math.sin(j)), y + j, RP.alga, 3 - j * 0.3); }
  const fx = k ? 14 : 34, fy = Math.round(bot(fx) * 0.6); P.line(fx, fy, fx + 7, fy, RP.osso, 3.6); for (let j = 1; j < 7; j += 2) { P.put(fx + j, fy - 1, RP.osso, 3); P.put(fx + j, fy + 1, RP.osso, 2.4); } P.blob(fx + 8, fy, 1.5, 1.2, RP.osso, s, 3.4);
  return P.done();
}

/* =============================== a Floresta de Algas (debaixo da água) =============================== */
function brainCoral(k) {   // 38 x 22 (k 1: 40 x 20, dois domos rosados): o coral-cérebro: o domo com os sulcos em labirinto, aceso de cima à esquerda, a base comida pelo lodo
  const P = painter(k ? 40 : 38, k ? 20 : 22), s = 1009 + k * 7, R = k ? RP.coral : RP.cerebro;
  const domes = k ? [[13, 20, 12, 15], [30, 20, 9, 11]] : [[19, 22, 18, 19]];
  domes.forEach(([cx, cy, rx, ry], i) => {
    P.z = i; P.ell(cx, cy, rx, ry, (x, y, dx, dy, d) => {
      if (y >= P.h) return; const m = Math.sin((cn(x, y, 7, 7, s + i) * 2 + cn(x, y, 3, 3, s + 3) * 0.4) * 14);
      P.put(x, y, R, 2.6 - (dx + dy) * 0.9 - d * 0.6 + (m > 0.3 ? 0.9 : m < -0.4 ? -1.1 : 0) + cg(x, y, s) * 0.35);
    });
  });
  for (let x = 0; x < P.w; x++) for (let y = P.h - 3; y < P.h; y++) if (P.has(x, y) && hash2(x, y, s) < 0.5 + (y - P.h + 3) * 0.25) P.put(x, y, RP.lodo, 2 + cg(x, y, s));
  seams(P); return P.done();
}
function seaFan(k) {   // 34 x 42: o coral-leque: o pé na pedra, os galhos se abrindo num leque fino e trançado, as pontas acesas fracas (k 0 laranja com pontas rosa, k 1 vermelho com pontas ciano)
  const P = painter(34, 42), s = 1021 + k * 11, R = k ? RP.coral : RP.coralL, tipC = k ? LC.ciano : LC.rosa, tips = [];
  P.blob(17, 40, 6, 3, RP.pedra, s, 2.4);
  const br = (x, y, a, len, dep) => {
    const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len; P.line(x, y, x2, y2, R, 2.4 + dep * 0.25, dep > 3 ? 2 : 1);
    if (dep === 0 || y2 < 3) { tips.push(x2, y2); return; }
    const sp = 0.32 + hash2(dep, x | 0, s) * 0.2; br(x2, y2, a - sp, len * 0.78, dep - 1); br(x2, y2, a + sp, len * 0.78, dep - 1);
  };
  br(17, 38, 0, 8, 5);
  for (let y = 4; y < 34; y += 3) for (let x = 2; x < 32; x++) if (P.is(x, y - 1, R) || (P.is(x - 1, y, R) && P.is(x + 3, y, R) && hash2(x, y, s) < 0.5)) { if (!P.has(x, y) && P.has(x - 1, y)) P.put(x, y, R, 1.8); }   // a trama
  for (let i = 0; i < tips.length; i += 2) { const x = Math.round(tips[i]), y = Math.round(tips[i + 1]); P.N(x, y, tipC); if (i % 6 === 0) P.mark('brilho', x, y); }
  return P.done();
}
function clam(k) {   // 44 x 28: a concha gigante entreaberta: a valva de baixo com as costelas e a borda em zigue-zague, a de cima erguida, o manto verde-água com pintas acesas e a pérola (k 1: fechada, coberta de cracas, sem pérola)
  const P = painter(44, 28), s = 1033 + k * 5, cx = 22, ry = k ? 7 : 8, lift = k ? 1 : 7;
  const shell = (cy, up) => P.ell(cx, cy, 20, ry, (x, y, dx, dy, d) => {
    if (up ? dy > 0.05 : dy < -0.05) return; const rib = Math.sin(Math.atan2(dy, dx) * 9) > 0.35;
    let v = 2.6 + (rib ? 0.8 : -0.4) - d * 0.8 + (up ? -dy * 0.6 : -dy * 1.2) + cg(x, y, s) * 0.35;
    P.put(x, y, RP.concha, v);
  });
  P.z = 0; shell(27 - ry - lift + 1, true);
  if (!k) {
    P.z = 1; for (let x = cx - 18; x <= cx + 18; x++) { const zz = Math.round(Math.sin(x * 1.2) * 1.4); for (let y = 27 - ry - lift + 2; y <= 27 - ry + 1 + zz; y++) { P.put(x, y, RP.manto, 2.4 + Math.sin(x * 0.9 + y) * 0.7 + cg(x, y, s) * 0.4); if (hash2(x, y, s + 4) < 0.07) P.N(x, y, LC.ciano); } }
    P.z = 2; P.ell(cx + 3, 27 - ry - 1, 2.3, 2.3, (x, y, dx, dy, d) => P.N(x, y, d < 0.3 ? '#ffffff' : d < 0.7 ? LC.perola : '#a8b8d0')); P.mark('brilho', cx + 2, 27 - ry - 2); P.mark('bolha', cx - 6, 27 - ry - 3);
  }
  P.z = 3; shell(27 - ry + 1, false);
  for (let x = 2; x < 42; x++) { const y = 27 - ry + 1 + Math.round(Math.sin(x * 1.2) * 1.4); if (P.has(x, y)) P.put(x, y, RP.concha, 4.3); }
  seams(P); barn(P, k ? 0.5 : 0.2, s + 2); stain(P, RP.alga, 0.12, s + 3, null, 0, [RP.concha]);
  return P.done();
}
function amphora(k) {   // 20 x 30 de pé (k 1: 34 x 18 deitada e quebrada): a ânfora afundada: o gargalo com as duas asas, o bojo, o pé em ponta; cracas e alga
  const Q = painter(20, 30), s = 1045 + k * 3, cx = 10;
  const r = y => y < 2 ? 3.2 : y < 8 ? 2.4 : y < 14 ? 2.4 + (y - 8) / 6 * 5 : y < 22 ? 7.4 - (y - 14) / 8 * 2.2 : 5.2 - (y - 22) / 7 * 4.4;
  for (let y = 0; y < 30; y++) { const R = r(y); for (let x = Math.ceil(cx - R); x < cx + R; x++) { const q = (x + 0.5 - cx) / R; Q.put(x, y, RP.barro, 2.8 - q * 1.3 - q * q * 0.8 + (y < 2 ? 0.8 : 0) + cg(x, y, s) * 0.4 + (y === 15 || y === 16 ? -0.6 : 0)); } }
  Q.put(cx, 0, RP.sombra, 0.4); Q.put(cx - 1, 0, RP.sombra, 0.8);
  Q.z = 1; for (const a of [-1, 1]) tube(Q, bez([cx + a * 2, 3], [cx + a * 6, 3], [cx + a * 7, 7], [cx + a * 5, 11]), () => 1.6, RP.barro, s + a, 2.6);
  seams(Q); barn(Q, 0.32, s + 2); stain(Q, RP.alga, 0.1, s + 3, null, 0, [RP.barro]);
  if (!k) return Q.done();
  const P = painter(34, 18); blit(P, Q, 7, -6, 1.5, 10, 15);
  for (let x = 0; x < 9; x++) for (let y = 0; y < 18; y++) if (P.has(x, y) && x < 5 + (y % 3)) P.clear(x, y);
  P.blob(3, 15, 2.4, 1.6, RP.barro, s + 4, 2.4); P.blob(7, 16, 1.6, 1.2, RP.barro, s + 5, 3);
  return P.done();
}
function starfish(k) {   // 16 x 16: a estrela-do-mar na parede: cinco braços, a pele de bolinhas (k 0 vermelha, k 1 laranja)
  const P = painter(16, 16), s = 1057 + k * 3, R = k ? RP.coralL : RP.coral, rot = k * 0.6;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = x + 0.5 - 8, dy = y + 0.5 - 8, a = Math.atan2(dy, dx) + rot, rr = Math.hypot(dx, dy), lim = 7.4 * (0.32 + 0.68 * Math.pow(Math.abs(Math.cos(2.5 * a)), 1.6));
    if (rr > lim) continue; const bump = (x + y) % 2 === 0 && hash2(x, y, s) < 0.5;
    P.put(x, y, R, 2.6 + (bump ? 1 : 0) - rr / 7.4 * 0.8 - (dx + dy) * 0.07 + cg(x, y, s) * 0.3);
  }
  return P.done();
}
function porthole(k) {   // 22 x 22: a vigia de navio: o aro de latão verde de azinhavre com oito parafusos, o vidro grosso aceso por trás (k 1: rachado, quase apagado)
  const P = painter(22, 22), s = 1069 + k * 3;
  P.ell(11, 11, 10.6, 10.6, (x, y, dx, dy, d) => {
    if (d > 0.48) { const bolt = Math.abs(((Math.atan2(dy, dx) * 4 / Math.PI) % 1 + 1) % 1 - 0.5) < 0.1 && d > 0.62 && d < 0.85; P.put(x, y, RP.latao, bolt ? 4.4 : 2.8 - (dx + dy) * 0.9 + (d > 0.9 ? -0.8 : 0) + cg(x, y, s) * 0.3); return; }
    if (k) { P.put(x, y, RP.vidro, 1.6 - (dx + dy) + cg(x, y, s) * 0.4); if (hash2(x, y, s) < 0.08) P.N(x, y, LC.cianoF); return; }
    const g = 1 - d / 0.48; P.N(x, y, g > 0.7 ? LC.cianoC : g > 0.35 ? LC.ciano : LC.cianoF);
  });
  if (k) { P.line(7, 6, 12, 12, RP.vela, 4.2); P.line(12, 12, 15, 11, RP.vela, 3.6); P.line(12, 12, 11, 16, RP.vela, 3.6); }
  else { P.line(7, 7, 9, 5, RP.vela, 5); P.mark('brilho', 8, 6); }
  stain(P, RP.azinhavre, 0.3, s + 2, null, 0.3, [RP.latao]);
  return P.done();
}

/* =============================== a Fossa =============================== */
function whale(k) {   // 126 x 44: o esqueleto de baleia no fundo: o crânio comprido com a mandíbula solta, a espinha em arco de vértebras com os espinhos, as costelas curvas (algumas partidas), a cauda sumindo no lodo
  const P = painter(126, 44), s = 1081 + k * 13;
  const sp = x => 16 - Math.sin(Math.PI * clamp((x - 30) / 96, 0, 1)) * 8 + (x > 104 ? (x - 104) * 0.9 : 0);
  for (let x = 32; x < 124; x += 4) {   // as vértebras e os espinhos
    const y = sp(x), r = 2.6 - (x - 32) / 92 * 1.4; P.blob(x, y, r + 0.3, r, RP.osso, s + x, 3);
    if (x < 108) P.line(x, y - r, x - 1, y - r - 4 + (x - 32) / 30, RP.osso, 2.8);
  }
  for (let i = 0; i < 12; i++) {   // as costelas
    const x = 38 + i * 5.2, y = sp(x), broken = hash2(i, 0, s) < 0.25, L = broken ? 0.45 + hash2(i, 1, s) * 0.3 : 1;
    const f = bez([x, y + 2], [x + 10, y + 8], [x + 9, 34], [x + 2 + i * 0.2, 42]);
    P.z = i % 2; tube(P, t => f(t * L), () => 2.2, RP.osso, s + i, 2.6 - (i % 2) * 0.6);
    if (broken) P.blob(f(1)[0] + 3, 42, 1.6, 1, RP.osso, s + i + 40, 2.4);
  }
  P.z = 2; P.ell(17, 27, 17, 7.5, (x, y, dx, dy, d) => { P.put(x, y, RP.osso, 2.8 - (dx + dy) * 0.8 - d * 0.5 + cg(x, y, s) * 0.4); });   // o crânio
  P.ell(26, 25, 3.2, 2.4, (x, y) => P.put(x, y, RP.sombra, 0.6));
  for (let x = 2; x < 30; x++) P.put(x, Math.round(31 + (x - 2) * 0.05), RP.osso, 1.4);
  P.z = 3; tube(P, bez([1, 37], [10, 39], [22, 41], [33, 38]), t => 3.4 - t * 0.8, RP.osso, s + 2, 2.6);           // a mandíbula solta
  for (let x = 0; x < 126; x++) for (let y = 39; y < 44; y++) if (P.has(x, y) && hash2(x, y, s) < 0.35 + (y - 39) * 0.15) P.put(x, y, RP.lodo, 2 + cg(x, y, s));
  seams(P); stain(P, RP.alga, 0.1, s + 3, null, 0, [RP.osso]); barn(P, 0.12, s + 4);
  return P.done();
}
function levSkull(k) {   // 66 x 38: o crânio de um leviatã antigo meio enterrado: o focinho comprido, a mandíbula entreaberta com fileiras de dentes, o olho fundo com um brilho ciano lá dentro, dois chifres para trás (k 1: sem mandíbula, um chifre partido)
  const P = painter(66, 38), s = 1093 + k * 7;
  P.z = 0; for (const [hx, L] of [[50, k ? 0.55 : 1], [56, 1]]) tube(P, t => bez([hx, 10], [hx + 8, 2], [hx + 14, 4], [hx + 13, 14])(t * L), t => 4 - t * 3, RP.osso, s + hx, 2.4);   // os chifres
  P.z = 1; P.ell(50, 17, 14, 12, (x, y, dx, dy, d) => P.put(x, y, RP.osso, 2.9 - (dx + dy) * 0.8 - d * 0.4 + cg(x, y, s) * 0.4));
  for (let x = 4; x < 46; x++) { const yt = 14 + (46 - x) * 0.12, yb = 22 - (46 - x) * 0.02; for (let y = Math.round(yt); y < yb; y++) P.put(x, y, RP.osso, 2.7 - (y - yt) / (yb - yt) * 1.2 + (y === Math.round(yt) ? 0.9 : 0) + cg(x, y, s) * 0.4); }
  for (let x = 6; x < 42; x += 3) { P.put(x, 22, RP.osso, 4.4); P.put(x, 23, RP.osso, 3.6); P.put(x + 1, 22, RP.osso, 3.4); }   // os dentes de cima
  if (!k) { P.z = 2; for (let x = 6; x < 50; x++) { const y0 = 26 + (x - 6) * 0.08; for (let y = Math.round(y0); y < y0 + 4; y++) P.put(x, y, RP.osso, 2.4 - (y - y0) * 0.4 + cg(x, y, s) * 0.4); } for (let x = 8; x < 44; x += 3) { P.put(x, 25, RP.osso, 4.2); P.put(x, 24, RP.osso, 3.6); } }
  P.z = 3; P.ell(48, 14, 4.4, 3.4, (x, y, dx, dy, d) => P.put(x, y, RP.sombra, 0.2 + d * 1.2));
  P.N(47, 15, LC.ciano); P.N(48, 15, LC.cianoF); P.mark('brilho', 47, 15);
  for (let x = 20; x < 40; x += 4) P.put(x, 17, RP.sombra, 1);
  for (let x = 0; x < 66; x++) for (let y = 31; y < 38; y++) if (P.has(x, y) && hash2(x, y, s) < 0.25 + (y - 31) * 0.14) P.put(x, y, RP.lodo, 2 + cg(x, y, s));
  seams(P); barn(P, 0.18, s + 2); stain(P, RP.alga, 0.08, s + 3, null, 0, [RP.osso]);
  return P.done();
}
function fishGod(k) {   // 44 x 86: a estátua do deus-peixe no templo: o plinto de cantaria entalhada, o corpo de manto até os pés, a cabeça de peixe com a crista de espinhos e o olho aceso ciano, o tridente de bronze verde (k 1: a cabeça caída no plinto, o tridente partido)
  const P = painter(44, 86), s = 1105 + k * 11, cx = 20;
  ashlar(P, 4, 76, 36, 10, RP.templo, s, 5, 9);
  for (let x = 4; x < 40; x++) P.put(x, 76, RP.templo, 4);
  P.z = 1; for (let y = 34; y < 76; y++) { const hw = 7 + (y - 34) / 42 * 6; for (let x = Math.ceil(cx - hw); x < cx + hw; x++) { const q = (x + 0.5 - cx) / hw, fold = Math.sin((x - cx) * 1.3 + (y - 34) * 0.05) * 0.7; P.put(x, y, RP.templo, 2.6 - q * 1.1 + fold + cg(x, y, s) * 0.4); } }   // o manto
  for (let y = 40; y < 76; y += 9) for (let x = cx - 9; x < cx + 9; x++) if (P.has(x, y) && Math.sin(x * 0.9 + y) > 0) P.put(x, y, RP.templo, 1.2);   // as ondas gravadas na barra
  P.z = 2; P.line(cx - 4, 40, cx + 12, 44, RP.templo, 3.2, 3); P.line(cx + 12, 44, cx + 14, 38, RP.templo, 3, 3);                                 // o braço que segura o tridente
  P.z = 3; const tl = k ? 22 : 6; for (let y = tl; y < 80; y++) { P.put(cx + 14, y, RP.azinhavre, 3.2); P.put(cx + 15, y, RP.azinhavre, 2); }
  if (!k) { for (let x = cx + 9; x <= cx + 20; x++) P.put(x, 12, RP.azinhavre, 3); for (const x of [cx + 9, cx + 14, cx + 20]) for (let y = 3; y < 12; y++) P.put(x, y, RP.azinhavre, 3.4 - (y < 5 ? -0.6 : 0)); }
  const head = (Q, hx, hy, up) => {
    Q.ell(hx, hy, 10, 8, (x, y, dx, dy, d) => { if (dx > 0.6 && Math.abs(dy - 0.15) < 0.12) return; Q.put(x, y, RP.templo, 2.9 - (dx + dy) * 0.9 - d * 0.4 + cg(x, y, s) * 0.4); });
    for (let j = -3; j <= 4; j++) Q.put(hx - 3 + (j & 1), hy + j, RP.templo, 1.3);
    for (let i = 0; i < 6; i++) Q.line(hx - 6 + i * 2.2, hy - 7, hx - 7 + i * 2.6, hy - 12 - (i % 2) * 2, RP.templo, 3.4 - i * 0.2);   // a crista
    Q.ell(hx + 4, hy - 2, 2.2, 2.2, (x, y, dx, dy, d) => Q.N(x, y, d < 0.4 ? LC.cianoC : LC.ciano)); Q.mark('brilho', hx + 4, hy - 2);
  };
  P.z = 4; if (k) head(P, 30, 69, false); else head(P, cx + 1, 25, true);
  seams(P); stain(P, RP.alga, 0.14, s + 2, (x, y) => (P.has(x, y - 1) ? 0 : 0.3), 0, [RP.templo]); barn(P, 0.15, s + 3); strands(P, 5, 4, s + 4);
  return P.done();
}
function mural(k) {   // 56 x 36: o mural da gente-peixe: a moldura de cantaria, o painel em relevo com as ondas embaixo e o grande olho com raios (k 1: a procissão de três homens-peixe), os sulcos com um fio de ciano aceso
  const P = painter(56, 36), s = 1117 + k * 7;
  ashlar(P, 0, 0, 56, 36, RP.templo, s, 4, 8, (x, y) => x < 3 || y < 3 || x > 52 || y > 32);
  for (let y = 3; y < 33; y++) for (let x = 3; x < 53; x++) P.put(x, y, RP.templo, 1.8 + cg(x, y, s) * 0.4 + cn(x, y, 20, 20, s) * 0.4);
  for (let r = 0; r < 2; r++) for (let x = 4; x < 52; x++) { const y = 28 - r * 3 + Math.round(Math.sin(x * 0.5 + r * 2) * 1.2); P.put(x, y, RP.templo, 3.6); P.put(x, y + 1, RP.templo, 0.9); if (r === 0 && x % 3 === 0) P.N(x, y, LC.cianoF); }
  if (!k) {
    P.ell(28, 14, 13, 7, (x, y, dx, dy, d) => { if (d > 0.8) P.put(x, y, RP.templo, 3.6 - dy * 1.4); else if (d > 0.68) P.put(x, y, RP.templo, 1); });
    P.ell(28, 14, 4, 4, (x, y, dx, dy, d) => d < 0.45 ? P.N(x, y, LC.ciano) : P.put(x, y, RP.templo, 3.4 - (dx + dy)));
    P.mark('brilho', 28, 14);
    for (let i = 0; i < 10; i++) { const a = -Math.PI + i * Math.PI / 9; if (Math.sin(a) > 0.1) continue; P.line(28 + Math.cos(a) * 15, 14 + Math.sin(a) * 9, 28 + Math.cos(a) * 21, 14 + Math.sin(a) * 12, RP.templo, 3.4); }
  } else for (let i = 0; i < 3; i++) {
    const x = 10 + i * 14;
    P.ell(x + 2, 9, 3.2, 2.6, (X, Y, dx, dy) => P.put(X, Y, RP.templo, 3.4 - (dx + dy)));
    P.N(x + 4, 8, LC.cianoF);
    for (let y = 11; y < 23; y++) for (let X = x - 1; X < x + 4 + (y > 18 ? 1 : 0); X++) P.put(X, y, RP.templo, 3 - (X - x) * 0.3);
    P.line(x + 4, 13, x + 8, 16, RP.templo, 3.4); P.line(x + 8, 5, x + 8, 24, RP.templo, 3.6);
  }
  chip(P, 0.15, s + 2); stain(P, RP.alga, 0.12, s + 3, null, 0, [RP.templo]);
  return P.done();
}
function hullBack(k) {   // 104 x 46: o casco no fundo: a silhueta de um navio inteiro deitado de lado no lodo, as fiadas mal se vendo no escuro, o toco do mastro, um rombo, plâncton grudado (k 1: partido ao meio)
  const P = painter(104, 46), s = 1129 + k * 13, by = 45;
  for (let x = 2; x < 102; x++) {
    if (k && x > 50 && x < 58) continue;
    const u = (x - 2) / 100, h = 24 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.5) + (u > 0.85 ? 6 : 0), tilt = u * 6;
    for (let y = Math.round(by - h - tilt); y <= by; y++) { const f = (by - y) / Math.max(1, h); P.put(x, y, RP.silhueta, 2.6 + ((f * 7) % 1 < 0.15 ? -1.2 : 0) + cg(x, y, s) * 0.5 - f * 0.4); }
  }
  P.z = 1; tube(P, t => [40 + t * 14, 18 - t * 16], () => 2.6, RP.silhueta, s + 1, 3);
  P.ell(70, 30, 6, 4, (x, y) => { if (P.has(x, y)) P.put(x, y, RP.sombra, 0); });
  for (let i = 0; i < 14; i++) { const x = 4 + ((hash2(i, 0, s) * 96) | 0), y = 20 + ((hash2(i, 1, s) * 24) | 0); if (P.has(x, y)) { P.N(x, y, i % 3 ? LC.cianoF : LC.ciano); if (i % 4 === 0) P.mark('brilho', x, y); } }
  return P.done();
}

/* =============================== as Chaminés Negras =============================== */
function smoker(k) {   // 32 x 72: a chaminé negra: a torre de sulfeto em camadas, as rachaduras de brasa acesas embaixo, a boca no alto soltando fumaça (viva), a crosta amarela de enxofre, vermes-tubo no pé (k 1: duas torres)
  const P = painter(32, 72), s = 1141 + k * 17;
  const spire = (cx, y0, w0, w1, sd) => {
    for (let y = y0; y < 72; y++) {
      const t = (y - y0) / (72 - y0), hw = w1 + (w0 - w1) * Math.pow(t, 1.4) + (cn(0, y, 1, 6, sd) - 0.5) * 3;
      for (let x = Math.ceil(cx - hw); x < cx + hw; x++) { const q = (x + 0.5 - cx) / hw, band = ((y + Math.round(cn(x, 0, 4, 1, sd) * 3)) % 5); P.put(x, y, RP.sulfeto, 2.4 - q * 1.2 - q * q * 0.6 + (band === 0 ? 0.9 : band === 4 ? -0.8 : 0) + cg(x, y, sd) * 0.5); }
    }
    P.ell(cx, y0 + 1, w1 + 0.6, 1.6, (x, y, dx, dy, d) => P.put(x, y, d < 0.5 ? RP.sombra : RP.sulfeto, d < 0.5 ? 0.2 : 3.4));
    P.mark('fumo', Math.round(cx), y0); P.mark('bolha', Math.round(cx), y0 - 1);
  };
  P.z = 0; if (k) spire(23, 34, 7, 3, s + 5);
  P.z = 1; spire(13, 2, 13, 4, s);
  for (let i = 0; i < 18; i++) { const y = 32 + ((hash2(i, 0, s) * 38) | 0), x = 6 + ((hash2(i, 1, s) * 16) | 0); for (let j = 0; j < 3 + (i % 4); j++) { const X = x + Math.round(Math.sin(i + j) * 1), Y = y + j; if (P.has(X, Y)) P.N(X, Y, j === 1 ? LC.laranja : j ? LC.brasa : LC.brasaF); } }
  stain(P, RP.enxofre, 0.06, s + 2, (x, y) => (y < 14 ? 0.1 : -0.3), 0.3, [RP.sulfeto]);
  P.z = 2; for (let i = 0; i < 6; i++) { const x = 3 + i * 2 + (i > 2 ? 14 : 0), L = 6 + (i * 5) % 7; for (let y = 71; y > 71 - L; y--) P.put(x, y, RP.verme, 3.4 - (71 - y) * 0.05); P.blob(x, 71 - L, 1.3, 1.3, RP.pluma, s + i, 3.4); }
  seams(P);
  return P.done();
}
function giantWorms(k) {   // 32 x 44: os vermes-tubo gigantes: um feixe de tubos brancos de anéis saindo de um bolo de sulfeto, as plumas vermelhas abertas no alto, bolhas subindo
  const P = painter(32, 44), s = 1153 + k * 9;
  P.blob(16, 41, 13, 4.5, RP.sulfeto, s, 2.4);
  const n = k ? 7 : 9;
  for (let i = 0; i < n; i++) {
    const x0 = 6 + i * (20 / (n - 1)), H = 14 + hash2(i, 0, s) * 22, bend = (hash2(i, 1, s) - 0.5) * 8, f = bez([x0, 40], [x0, 40 - H * 0.4], [x0 + bend, 40 - H * 0.7], [x0 + bend * 1.2, 40 - H]);
    P.z = i % 3; tube(P, f, () => 3, RP.verme, s + i, 2.8);
    for (let t = 0.1; t < 0.95; t += 0.08) { const [x, y] = f(t); P.put(Math.round(x) - 1, Math.round(y), RP.verme, 1.4); }
    const [tx, ty] = f(1); P.z = 3;
    for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (j - 3) * 0.38; P.line(tx, ty, tx + Math.cos(a) * 4.2, ty + Math.sin(a) * 4.6, RP.pluma, 3.4 - Math.abs(j - 3) * 0.3); }
    P.blob(tx, ty - 1, 2.2, 1.6, RP.pluma, s + i + 9, 3);
    if (i % 3 === 0) P.mark('bolha', Math.round(tx), Math.round(ty) - 4);
  }
  seams(P); stain(P, RP.enxofre, 0.08, s + 2, null, 0.2, [RP.sulfeto]);
  return P.done();
}
function sulfurCrust(k) {   // 36 x 16: a crosta de enxofre: um montinho de sulfeto coberto de cristais amarelos em agulha e bolhas estouradas, vapor subindo de duas frestas (k 1: mais baixa e larga, uma poça de ácido)
  const P = painter(36, 16), s = 1165 + k * 5;
  for (let x = 0; x < 36; x++) { const h = (k ? 6 : 10) * Math.pow(Math.sin(Math.PI * (x + 0.5) / 36), 0.8) + cn(x, 0, 4, 4, s) * 4; for (let y = Math.round(16 - h); y < 16; y++) P.put(x, y, RP.sulfeto, 2.4 - (y - 16 + h) / Math.max(1, h) * 0.8 + cg(x, y, s) * 0.5); }
  stain(P, RP.enxofre, 0.3, s + 1, (x, y) => (P.has(x, y - 1) ? -0.1 : 0.5), 0.6, [RP.sulfeto]);
  for (let i = 0; i < 9; i++) { const x = 3 + ((hash2(i, 0, s) * 30) | 0); let y = 0; while (y < 16 && !P.has(x, y)) y++; const L = 2 + (i % 3); for (let j = 1; j <= L; j++) P.put(x, y - j, RP.enxofre, 3.6 + j * 0.3); P.put(x + 1, y - 1, RP.enxofre, 2.4); }
  for (const fx of [11, 25]) { let y = 0; while (y < 16 && !P.has(fx, y)) y++; P.put(fx, y, RP.sombra, 0.3); P.put(fx + 1, y, RP.sombra, 0.6); P.mark('vapor', fx, y - 1); }
  if (k) for (let x = 15; x < 22; x++) P.N(x, 15, hash2(x, 3, s) < 0.5 ? '#c8d020' : '#88a010');
  return P.done();
}

/* =============================== registro =============================== */
const HR = MS_HR;
function bakeLuz(P) {
  const list = [];
  for (let k = 0; k < P.w * P.h; k++) if (P.rid[k] === -2) list.push(k);
  if (!list.length) return { nv: null, halo: null };
  const nv = mk(P.w, P.h), nx = nv.getContext('2d'), im = nx.createImageData(P.w, P.h), d32 = new Uint32Array(im.data.buffer);
  for (const k of list) d32[k] = P.c[k];
  nx.putImageData(im, 0, 0);
  const HW = P.w + HR * 2, HH = P.h + HR * 2, acc = new Float32Array(HW * HH * 3), ker = [], dens = clamp(Math.sqrt(80 / list.length), 0.2, 1);
  for (let j = -HR; j <= HR; j++) for (let i = -HR; i <= HR; i++) { const d = Math.hypot(i, j) / HR; if (d < 1) ker.push(i, j, Math.pow(1 - d, 2.2) * 0.07 * dens); }
  for (const k of list) {
    const x = k % P.w + HR, y = ((k / P.w) | 0) + HR, q = P.c[k], r = (q & 255) / 255, g = ((q >> 8) & 255) / 255, b = ((q >> 16) & 255) / 255;
    for (let m = 0; m < ker.length; m += 3) { const o = ((y + ker[m + 1]) * HW + x + ker[m]) * 3, w = ker[m + 2]; acc[o] += r * w; acc[o + 1] += g * w; acc[o + 2] += b * w; }
  }
  const hc = mk(HW, HH), hx = hc.getContext('2d'), hi = hx.createImageData(HW, HH), hd = hi.data;
  for (let k = 0; k < HW * HH; k++) { const sat = v => Math.round(255 * (1 - Math.exp(-v * 1.6))); hd[k * 4] = sat(acc[k * 3]); hd[k * 4 + 1] = sat(acc[k * 3 + 1]); hd[k * 4 + 2] = sat(acc[k * 3 + 2]); hd[k * 4 + 3] = 255; }
  hx.putImageData(hi, 0, 0);
  return { nv, halo: hc };
}
const toCv = P => { const cv = mk(P.w, P.h), x = cv.getContext('2d'), img = x.createImageData(P.w, P.h); new Uint32Array(img.data.buffer).set(P.c); x.putImageData(img, 0, 0); return cv; };
const F = 'chao', C = 'teto', Wl = 'parede';
const def = (id, nome, apoio, camada, faixas, Ps, extra) => {
  const B = Ps.map(bakeLuz);
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), mar: true, msLuz: B.map(b => b.nv), msHalo: B.map(b => b.halo), msPts: Ps.map(P => P.pts), luz: [] }, extra || {}));
};
const A = true, B2 = 'ambos';
// As Praias Negras
def('ms_bote', 'Bote virado', F, 'frente', ['praias'], [boat(0), boat(1)]);
def('ms_ancora', 'Âncora caída', F, 'frente', ['praias', 'floresta'], [anchor(0), anchor(1)], { agua: B2 });
def('ms_barril', 'Barril de óleo', F, 'frente', ['praias'], [barrel(0), barrel(1)]);
def('ms_figura_proa', 'Figura de proa caída', F, 'frente', ['praias'], [figurehead(0), figurehead(1)]);
def('ms_canhao', 'Canhão enferrujado', F, 'frente', ['praias', 'floresta'], [cannon(0), cannon(1)], { agua: B2 });
def('ms_mastro', 'Mastro quebrado', F, 'frente', ['praias'], [mast(0), mast(1)], { alto: 8 });
def('ms_rede_varas', 'Rede secando em varas', Wl, 'fundo', ['praias'], [netPoles(0), netPoles(1)]);
def('ms_armadilha', 'Armadilha de peixe', F, 'frente', ['praias'], [fishTrap(0), fishTrap(1)]);
def('ms_totem', 'Totem da gente-peixe', F, 'frente', ['praias', 'chamines'], [totem(0), totem(1)], { luz: [{ x: 13, y: 38, r: 0.2 }], brilho: MS_COL.ciano });
def('ms_braseiro', 'Braseiro de óleo de peixe', F, 'frente', ['praias', 'chamines'], [brazier(0), brazier(1)], { luz: [{ x: 11, y: 6, r: 0.85 }], brilho: MS_COL.oleo, anim: { k: 'ms_fogo' } });
def('ms_farol', 'Farol da gente-peixe', F, 'frente', ['praias'], [lighthouse(0)], { ilha: true, alto: 10, luz: [{ x: 19, y: 15, r: 1.4 }], brilho: MS_COL.oleo, anim: { k: 'ms_farol' } });
def('ms_cabana', 'Cabana de palafita', F, 'frente', ['praias'], [stiltHut(0), stiltHut(1)], { alto: 6, luz: [{ x: 19, y: 23, r: 0.3 }], brilho: MS_COL.oleo });
def('ms_lanterna_navio', 'Lanterna de navio pendurada', C, 'frente', ['praias', 'floresta'], [shipLantern(0), shipLantern(1)], { agua: B2, luz: [{ x: 7, y: 25, r: 0.8 }], brilho: MS_COL.laranja });
def('ms_redes_teto', 'Redes penduradas', C, 'frente', ['praias'], [hangingNets(0), hangingNets(1)]);
// A Floresta de Algas
def('ms_coral_cerebro', 'Coral-cérebro', F, 'frente', ['praias', 'floresta'], [brainCoral(0), brainCoral(1)], { agua: A });
def('ms_coral_leque', 'Coral-leque', F, 'frente', ['floresta'], [seaFan(0), seaFan(1)], { agua: A, luz: [{ x: 17, y: 14, r: 0.25 }], brilho: MS_COL.rosa });
def('ms_concha_gigante', 'Concha gigante entreaberta', F, 'frente', ['floresta', 'fossa'], [clam(0), clam(1)], { agua: A, luz: [{ x: 24, y: 18, r: 0.3 }], brilho: MS_COL.ciano });
def('ms_anfora', 'Ânfora afundada', F, 'frente', ['praias', 'floresta', 'fossa'], [amphora(0), amphora(1)], { agua: A });
def('ms_estrela', 'Estrela-do-mar', Wl, 'fundo', ['floresta'], [starfish(0), starfish(1)], { agua: A });
def('ms_vigia', 'Vigia de navio acesa', Wl, 'fundo', ['praias', 'floresta', 'fossa'], [porthole(0), porthole(1)], { agua: B2, casco: true, luz: [{ x: 11, y: 11, r: 0.4 }], brilho: MS_COL.ciano });
// A Fossa
def('ms_baleia', 'Esqueleto de baleia', F, 'frente', ['fossa', 'floresta'], [whale(0)], { agua: A });
def('ms_cranio_leviata', 'Crânio de leviatã antigo', F, 'frente', ['fossa', 'floresta'], [levSkull(0), levSkull(1)], { agua: A, luz: [{ x: 47, y: 15, r: 0.15 }], brilho: MS_COL.ciano });
def('ms_deus_peixe', 'Estátua do deus-peixe', Wl, 'fundo', ['fossa'], [fishGod(0), fishGod(1)], { agua: B2, templo: true, alto: 8, luz: [{ x: 25, y: 23, r: 0.3 }], brilho: MS_COL.ciano });
def('ms_mural', 'Mural da gente-peixe', Wl, 'fundo', ['fossa'], [mural(0), mural(1)], { agua: B2, templo: true, luz: [{ x: 28, y: 14, r: 0.2 }], brilho: MS_COL.ciano });
def('ms_casco_fundo', 'Casco no fundo', Wl, 'fundo', ['fossa', 'floresta'], [hullBack(0), hullBack(1)], { agua: A });
// As Chaminés Negras
def('ms_chamine', 'Chaminé negra fumegando', F, 'frente', ['chamines'], [smoker(0), smoker(1)], { agua: B2, alto: 6, luz: [{ x: 13, y: 4, r: 0.55 }, { x: 13, y: 50, r: 0.45 }], brilho: MS_COL.laranja, anim: { k: 'ms_fumo' } });
def('ms_vermes_gigantes', 'Vermes-tubo gigantes', F, 'frente', ['chamines', 'fossa'], [giantWorms(0), giantWorms(1)], { agua: B2 });
def('ms_crosta', 'Crosta de enxofre', F, 'frente', ['chamines'], [sulfurCrust(0), sulfurCrust(1)]);

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(MS_PROP_PLAN, {
  praias: { chao: [['ms_bote', 0.08, 1], ['ms_ancora', 0.05, 1], ['ms_barril', 0.14, 2], ['ms_figura_proa', 0.04, 1], ['ms_canhao', 0.06, 1], ['ms_mastro', 0.04, 1], ['ms_armadilha', 0.08, 1], ['ms_totem', 0.06, 1], ['ms_braseiro', 0.1, 1], ['ms_farol', 0.1, 1], ['ms_cabana', 0.05, 1], ['ms_coral_cerebro', 0.12, 1], ['ms_anfora', 0.08, 1]], teto: [['ms_lanterna_navio', 0.08, 1], ['ms_redes_teto', 0.08, 1]], fundo: [['ms_rede_varas', 0.06, 1], ['ms_vigia', 0.25, 2]] },
  floresta: { chao: [['ms_coral_cerebro', 0.3, 2], ['ms_coral_leque', 0.35, 2], ['ms_concha_gigante', 0.12, 1], ['ms_anfora', 0.15, 1], ['ms_ancora', 0.04, 1], ['ms_canhao', 0.04, 1], ['ms_baleia', 0.03, 1], ['ms_cranio_leviata', 0.05, 1], ['ms_vermes_gigantes', 0.03, 1]], teto: [['ms_lanterna_navio', 0.06, 1]], fundo: [['ms_estrela', 0.18, 2], ['ms_vigia', 0.25, 2], ['ms_casco_fundo', 0.08, 1]] },
  fossa: { chao: [['ms_baleia', 0.04, 1], ['ms_cranio_leviata', 0.04, 1], ['ms_concha_gigante', 0.05, 1], ['ms_anfora', 0.05, 1], ['ms_vermes_gigantes', 0.04, 1]], teto: [], fundo: [['ms_deus_peixe', 0.3, 1], ['ms_mural', 0.35, 2], ['ms_casco_fundo', 0.05, 1], ['ms_vigia', 0.2, 1]] },
  chamines: { chao: [['ms_chamine', 0.12, 1], ['ms_vermes_gigantes', 0.14, 2], ['ms_crosta', 0.16, 2], ['ms_braseiro', 0.05, 1], ['ms_totem', 0.03, 1]], teto: [], fundo: [] }
});

/* ---------- o que acende e o que mexe ----------
   O aceso e o halo assados vão no drawGlow (somados); as chamas, a fumaça, o vapor, as bolhas e os brilhos no drawTop
   (por cima do escuro e da água). O facho do farol é uma faixa assada uma vez, varrendo pelo cosseno do giro. */
const msPt = (p, nm) => { const P = p.def.msPts && p.def.msPts[p.v]; return P && P[nm] ? P[nm] : null; };
const msFlick = (p, j) => 0.8 + Math.sin(gameTime * 11 + j * 2.3 + p.X) * 0.1 + Math.sin(gameTime * 23 + j) * 0.08;
let msGl = null, msBeam = null;
const msGlowC = (c, r) => { const G = msGl || (msGl = {}), k = c + r; return G[k] || (G[k] = glow(r, c)); };
const msBeamCv = () => {
  if (msBeam) return msBeam;
  const W = 190, H = 34, cv = mk(W, H), x = cv.getContext('2d');
  for (let i = 0; i < W; i++) { const t = i / W, hh = 2 + t * (H / 2 - 2), a = 0.55 * (1 - t) * (1 - t); x.fillStyle = `rgba(190,232,120,${a.toFixed(3)})`; x.fillRect(i, Math.round(H / 2 - hh), 1, Math.round(hh * 2)); }
  return (msBeam = cv);
};
const FL_OLEO = ['#1a3a08', '#4a7a10', '#a8d038', '#eaffb0'];
const inWater = (X, Y) => { const tx = Math.floor(X / T), ty = Math.floor(Y / T); return ty >= 0 && ty < WH && agua.length && agua[ty * WW + ((tx % WW) + WW) % WW] > 0; };
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined' || msOut(cy)) return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.mar) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), hl = p.def.msHalo[p.v], nv = p.def.msLuz[p.v], An = p.def.anim;
    const br = An && An.k === 'ms_fogo' ? 0.8 + Math.sin(gameTime * 9 + p.X) * 0.12 : 0.9 + Math.sin(gameTime * 1.4 + p.X * 0.05) * 0.1;
    if (hl) { lc.globalAlpha = 0.55 * br; lc.drawImage(hl, X - MS_HR, Y - MS_HR); }
    if (nv) { lc.globalAlpha = 0.45 * br; lc.drawImage(nv, X, Y); }
    const Ch = msPt(p, 'chama'); if (Ch) for (let j = 0; j < Ch.length; j++) { const q = Ch[j]; lc.globalAlpha = 0.55 * msFlick(p, j); lc.drawImage(msGlowC(q.c, 10), X + q.x - 10, Y + q.y - 10); }
    const Fg = msPt(p, 'fogo'); if (Fg) { const q = Fg[0]; lc.globalAlpha = 0.5 * br; lc.drawImage(msGlowC(MS_COL.oleo, 16), X + q.x + (q.w >> 1) - 16, Y + q.y - 18); }
    const Fm = msPt(p, 'fumo'); if (Fm) for (const q of Fm) { lc.globalAlpha = 0.35 + 0.1 * Math.sin(gameTime * 3 + p.X); lc.drawImage(msGlowC(MS_COL.laranja, 12), X + q.x - 12, Y + q.y - 10); }
    const Fr = msPt(p, 'farol'); if (Fr) {
      const q = Fr[0], c = Math.cos(gameTime * 0.9 + p.X * 0.01), bm = msBeamCv(), x0 = X + q.x, y0 = Y + q.y;
      lc.globalAlpha = 0.6; lc.drawImage(msGlowC(MS_COL.oleo, 26), x0 - 26, y0 - 26);
      if (c > 0.05) { lc.globalAlpha = c; lc.drawImage(bm, x0, y0 - bm.height / 2); }
      else if (c < -0.05) { lc.globalAlpha = -c; lc.save(); lc.translate(x0, y0); lc.scale(-1, 1); lc.drawImage(bm, 0, -bm.height / 2); lc.restore(); }
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined' || msOut(cy)) return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.mar) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    const Ch = msPt(p, 'chama'); if (Ch) for (let j = 0; j < Ch.length; j++) {   // a chama da lanterna: um fiapo que balança, o miolo claro
      const q = Ch[j], f = Math.floor(gameTime * 7 + p.X * 0.3 + j * 5) % 4, x = X + q.x, y = Y + q.y; lc.globalAlpha = 1;
      lc.fillStyle = '#ff6a1a'; lc.fillRect(x + (f === 3 ? 1 : 0), y - 2 - (f === 1 ? 1 : 0), 1, 1 + (f === 1 ? 1 : 0));
      lc.fillStyle = '#ffb050'; lc.fillRect(x, y - 1, 1, 1); lc.fillStyle = '#fff0c8'; lc.fillRect(x, y, 1, 1);
    }
    const Fg = msPt(p, 'fogo'); if (Fg) {   // as línguas verdes do óleo de peixe
      const q = Fg[0], Tq = Math.floor(gameTime * 10);
      for (let c = 0; c < q.w; c++) {
        const env = Math.sin(Math.PI * (c + 0.5) / q.w), h = Math.round(env * (4 + (Math.sin(gameTime * 9 + c * 1.7 + p.X) + 1) * 2 + hash2(c, Tq, p.X) * 2.5));
        for (let j = 0; j < h; j++) { const t = j / Math.max(1, h); lc.globalAlpha = t > 0.85 ? 0.6 : 1; lc.fillStyle = t < 0.25 && env > 0.6 ? FL_OLEO[3] : t < 0.55 ? FL_OLEO[2] : t < 0.85 ? FL_OLEO[1] : FL_OLEO[0]; lc.fillRect(X + q.x + c, Y + q.y - j, 1, 1); }
      }
      for (let k = 0; k < 3; k++) { const h = hash2(k, p.X, 21), t = (gameTime * (0.5 + h * 0.4) + h) % 1; lc.globalAlpha = 1 - t; lc.fillStyle = k % 2 ? '#c8f070' : '#f0ffc0'; lc.fillRect(X + q.x + Math.round(h * q.w + Math.sin(t * 8 + k) * 2), Y + q.y - 6 - Math.round(t * 16), 1, 1); }
    }
    const Fm = msPt(p, 'fumo'); if (Fm) for (const q of Fm) for (let k = 0; k < 9; k++) {   // a fumaça preta: blocos que sobem, abrem e somem
      const h = hash2(k, p.X, 31), t = (gameTime * (0.16 + h * 0.08) + h) % 1, r = Math.round(2 + t * 7), x = X + q.x + Math.round(Math.sin(t * 4 + k) * (2 + t * 9)) - (r >> 1), y = Y + q.y - Math.round(t * 70) - (r >> 1);
      lc.globalAlpha = 0.5 * (1 - t) * Math.min(1, t * 8); lc.fillStyle = k % 3 ? '#16120e' : '#2a221a'; lc.fillRect(x, y, r, r);
    }
    const Vp = msPt(p, 'vapor'); if (Vp) for (const q of Vp) for (let k = 0; k < 4; k++) {
      const h = hash2(k, p.X + q.x, 41), t = (gameTime * (0.3 + h * 0.2) + h) % 1; lc.globalAlpha = 0.3 * (1 - t); lc.fillStyle = '#d8d8c0';
      lc.fillRect(X + q.x + Math.round(Math.sin(t * 6 + k) * (1 + t * 4)), Y + q.y - Math.round(t * 22), 1 + (t > 0.5 ? 1 : 0), 1);
    }
    const Bo = msPt(p, 'bolha'); if (Bo) for (const q of Bo) {   // bolhas: só dentro da água
      if (!inWater(p.X + q.x, p.Y + q.y)) continue;
      for (let k = 0; k < 5; k++) { const h = hash2(k, p.X + q.x, 51), t = (gameTime * (0.35 + h * 0.3) + h) % 1, x = X + q.x + Math.round(Math.sin(t * 9 + k) * 1.5), y = Y + q.y - Math.round(t * 40); lc.globalAlpha = 0.7 * (1 - t); lc.fillStyle = '#bfe8f0'; if (k % 2) { lc.fillRect(x, y, 1, 1); } else { lc.fillRect(x - 1, y, 1, 1); lc.fillRect(x + 1, y, 1, 1); lc.fillRect(x, y - 1, 1, 1); lc.fillRect(x, y + 1, 1, 1); } }
    }
    const St = msPt(p, 'brilho'); if (St) for (let j = 0; j < St.length; j++) { const b = Math.sin(gameTime * (1.1 + hash2(j, p.X, 3) * 1.6) + j * 2.3 + p.X); if (b < 0.75) continue; lc.globalAlpha = (b - 0.75) * 4; lc.fillStyle = '#ffffff'; lc.fillRect(X + St[j].x - 1, Y + St[j].y, 3, 1); lc.fillRect(X + St[j].x, Y + St[j].y - 1, 1, 3); }
  }
  lc.globalAlpha = 1;
});
}
