'use strict';

/* ================= o Covil do Dragão: objetos de cena =================
   Tudo o que é maior que um bloco e veste O Covil do Dragão (docs/camadas/11-covil-dragao.md, seção 5): 30 objetos
   (os 29 da ficha e a estatueta de barro, a irmã pequena da estátua do santuário).
   Nas Chaminés de Vapor, onde o mar de cima encontra o calor: o gêiser de pedra em degraus de sínter (solta vapor e,
   de tempos em tempos, um jato), a bacia de água fervendo com os anéis amarelos e laranja da borda, a rocha de basalto
   com cristais de olivina, a crosta de sal na parede, o crânio de peixe gigante caído do mar e a cortina de vapor (uma
   fenda funda na parede que solta vapor sem parar, com a brasa lá no fundo).
   Nos Túneis Kobold: a fogueira kobold com o lagarto no espeto (ou o pote no tripé de ossos), o cesto de moedas
   roubadas, o varal de escamas secando, a estátua de dragão de barro com as oferendas e as velas de sebo (só nos
   santuários) e a estatueta de barro (em qualquer túnel), o tambor de couro, a pilha de lanças de obsidiana, a jaula
   de vime com um coelho-de-gruta, o mapa kobold riscado na parede e a porta de toca de ossos.
   Nos Tubos de Lava: o ovo de draco grande (as rachas pulsam laranja), o ninho de cascas e escamas, a casca de serpe
   trocada, a bolha de lava esfriada partida, a estalactite de lava grande (uma gota de lava se forma na ponta e cai) e
   o fluxo de lava parado no meio da descida.
   No Leito de Ouro: o crânio de dragão antigo (o pequeno, 3 x 2), a costela de dragão, o monte de taças e coroas, a
   armadura de cavaleiro derretida no ouro, o escudo com o dente cravado, a bigorna afundada no ouro, o estandarte do
   reino esquecido e a espada enterrada no ouro.
   O pintor do 252 (rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, juntas por P.z, grão)
   com a tinta acesa: a BRASA. Um pixel de brasa (P.N) é cor pura, não rampa (magma nas rachas, a lava no fundo das
   fendas, as brasas da fogueira); no fim cada variação assa duas imagens a mais: os pixels acesos sozinhos e o halo em
   volta (um borrão macio calculado uma vez). O drawGlow desenha os dois com 'lighter'; nada é relido por quadro. Luz só
   onde há fogo, magma ou ovo quente: o ouro não acende sozinho, só cintila.
   Animados (ganchos no fim; todo objeto do Covil tem `luz`, nem que vazia, para entrar em visProps), pelos pontos
   marcados no desenho (dgPts):
     'vela'    a chama de uma vela de sebo treme e o brilho âmbar respira (drawGlow + drawTop);
     'brilho'  um reflexo de ouro (ou de olivina) cintila de vez em quando (drawTop);
     'fogo'    as línguas da fogueira, as fagulhas subindo e o brilho que tremula (drawGlow + drawTop);
     'vapor'   baforadas de vapor subindo (o gêiser, a bacia, o pote); com `jato`, o gêiser solta de tempos em tempos
               uma coluna de vapor (drawWorld: escurece com o lugar);
     'bolha'   bolhas estourando na água fervendo (drawWorld);
     'cortina' o vapor saindo da fenda em lâminas que tremem (drawWorld);
     'ovo'     o ovo de draco: o brilho das rachas sobe e desce devagar, como um coração (drawGlow + drawTop);
     'gota'    a gota de lava que incha na ponta da estalactite e cai (drawGlow + drawTop);
     anim { k: 'dg_morno' }  o brilho fraco do fluxo de lava parado e da bolha partida respira devagar (drawGlow).
   Registrados com defProp (`dragao: true`), postos pelo 275 a partir do DG_PROP_PLAN. Peças de fundo em DG_BACK_FLOOR
   ficam em pé no chão; as outras de fundo, na altura dos olhos.
   Flags que o gerador deve respeitar:
     toca: true       só dentro das tocas kobold (dgDens sem shrine): a fogueira kobold;
     santuario: true  só dentro dos santuários (dgDens com shrine): a estátua de dragão de barro;
     ninho: true      só dentro dos ninhos de draco (dgNests): o ovo de draco;
     tesouro: true    só nas câmaras do tesouro (dgHoards): a armadura derretida no ouro;
     alto: n          precisa de n blocos de ar livres (a estátua, a costela, a cortina de vapor, o fluxo parado...).
   Objeto de chão nunca vai em cima de ouro solto (o 275 cuida). */
const DG_PROP_PLAN = {};
// peças de fundo que ficam em pé no chão em vez de penduradas na altura dos olhos
const DG_BACK_FLOOR = { dg_cortina_vapor: 1, dg_lancas: 1, dg_porta_toca: 1, dg_fluxo_parado: 1, dg_costela: 1 };
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  // as rampas da ficha (seção 12)
  tufo: ['#3a2a1a', '#5a4228', '#7a5c3a', '#9a774c', '#b8935e', '#d4b07a'],
  andesito: ['#2a2422', '#3e3632', '#544a44', '#6e625a', '#8a7c72', '#a89a8e'],
  lavaC: ['#1c1a1a', '#2c2826', '#3c3634', '#4e4844', '#645c56', '#7c736a'],   // a lava cordada (o brilho das dobras é tinta acesa)
  obsidiana: ['#1a0c08', '#2e140c', '#4a2014', '#6a301e', '#8a4630', '#c87a52'],
  ouro: ['#4a3008', '#7a5410', '#a87808', '#d8a830', '#f0cc5a', '#fff0a0'],
  osso: ['#3a3020', '#5a4c34', '#7a6a4c', '#9a8a68', '#bcac88', '#ddd0ae'],
  escama: ['#2a1410', '#4a2418', '#6e3820', '#9a5428', '#c47a3a', '#e8a85a'],
  // as do lugar
  taipa: ['#221c18', '#352c26', '#4a3f36', '#615349', '#7a6a5c', '#948272'],
  sinter: ['#3e3020', '#5e4a30', '#806848', '#a28a64', '#c4ac84', '#e2d0a8'],
  ferrugem: ['#3a1608', '#5e260e', '#863a14', '#ac5420', '#cc7432', '#e89a52'],
  esteira: ['#3a2a08', '#5e440e', '#8a6416', '#b48a22', '#d8b03a', '#f0d064'],
  agua: ['#0a2426', '#123a3a', '#1c5450', '#2a7068', '#3e8e82', '#62b0a2'],
  sal: ['#5a5448', '#7e786a', '#a29c8c', '#c4beae', '#e0dccc', '#f6f4ea'],
  olivina: ['#18240a', '#2a3e10', '#40581a', '#5a7a26', '#7c9e36', '#a8cc5a'],
  couro: ['#1e120a', '#342014', '#4e301e', '#6a4228', '#865836', '#a2704a'],
  barro: ['#2e160c', '#4a2414', '#6a361e', '#8a4a2a', '#aa6038', '#c87c4c'],
  vime: ['#2a200e', '#443418', '#634c24', '#846630', '#a4823e', '#c2a058'],
  sebo: ['#3a3020', '#5e5034', '#857452', '#ab9a72', '#cfc094', '#ece0b8'],
  ferro: ['#141416', '#24242a', '#383840', '#505058', '#6e6e78', '#9a9aa4'],
  pano: ['#1e0808', '#360e0e', '#521616', '#702020', '#8e2e2a', '#ac443a'],
  carvao: ['#0c0a0a', '#161212', '#221c1a', '#2e2624', '#3c3230', '#4c403c'],
  cinza: ['#1e1c1a', '#2e2b28', '#423e3a', '#58534e', '#706a64', '#8a847c'],
  pelo: ['#3a3430', '#5a524c', '#7c746c', '#a09890', '#c2bab2', '#e0d8d0'],
  carne: ['#2a0e08', '#4a1a0e', '#6e2a16', '#8e4022', '#ae5a30', '#c87a44'],
  casca: ['#3c3628', '#5c5440', '#7e765c', '#a29a7c', '#c6bea0', '#e6e0c6'],
  rubi: ['#2a0408', '#4e0a12', '#7a121e', '#a8202c', '#d03c44', '#f07a7a'],
  safira: ['#060c2a', '#0c1a4e', '#16307a', '#2448a8', '#3c6ad0', '#7aa0f0'],
  sombra: ['#060404', '#0c0806', '#120c0a', '#18100c', '#1e1410', '#261a14']
};
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#070403');
// as cores puras acesas: o magma da ficha (do mais fundo ao miolo) e a dobra acesa da lava cordada
const MG = { brasa: '#6a1a04', fundo: '#a83a08', laranja: '#e06a10', ambar: '#ffa020', claro: '#ffd050', miolo: '#fff4c0', dobra: '#ff9a40' };

/* ---- o pintor (o do 252): rid -2 marca um pixel de cor pura que acende ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), zb = new Uint8Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, zb, ramps, idOf, z: 0, pts: {},
    put(x, y, R, v) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; zb[k] = P.z; },
    N(x, y, hex) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = ph(hex); rid[k] = -2; val[k] = 5; zb[k] = P.z; },
    clear(x, y) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0; },
    isN(x, y) { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < w && y < h && rid[y * w + x] === -2; },
    is(x, y, R) { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0 && rid[y * w + x] >= 0 && ramps[rid[y * w + x]] === R; },
    rampAt(x, y) { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] && rid[y * w + x] >= 0 ? ramps[rid[y * w + x]] : null; },
    v(x, y) { return val[Math.floor(y) * w + Math.floor(x)]; },
    tint(x, y, hex, k) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; if (!c[i]) return; const q = c[i], B = rgb(hex); c[i] = pack(Math.round((q & 255) + (B[0] - (q & 255)) * k), Math.round(((q >> 8) & 255) + (B[1] - ((q >> 8) & 255)) * k), Math.round(((q >> 16) & 255) + (B[2] - ((q >> 16) & 255)) * k)); },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
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
// cola Q em P em (ox, oy) girado de ang em volta de (px, py) de Q; a tinta acesa e os pontos marcados vão junto
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
const bez = (a, b, c, d) => t => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; };
const lin = (x0, y0, x1, y1) => t => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
// um corpo em tubo sombreado pela normal ao longo de uma curva; pat(a, q, X, Y) soma ao tom (a: comprimento andado,
// q: de -1 a 1 de lado a lado) e devolve null para furar; opt { base }
function sweep(P, fn, wd, R, s, pat, opt = {}) {
  let L = 0; { let [px, py] = fn(0); for (let i = 1; i <= 60; i++) { const [x, y] = fn(i / 60); L += Math.hypot(x - px, y - py); px = x; py = y; } }
  const n = Math.ceil(L * 2.5) + 4, base = opt.base !== undefined ? opt.base : 2.6;
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = fn(t), [x2, y2] = fn(Math.min(1, t + 0.01)), [x1, y1] = fn(Math.max(0, t - 0.01));
    let tx = x2 - x1, ty = y2 - y1; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx, r = Math.max(0.6, wd(t) / 2), lit = -(nx + ny) * 0.707;
    for (let o = -r; o <= r; o += 0.5) {
      const X = Math.floor(x + nx * o), Y = Math.floor(y + ny * o), q = o / r;
      const add = pat ? pat(t * L, q, X, Y) : 0; if (add === null) continue;
      P.put(X, Y, R, base + 0.5 + q * lit * 1.4 - q * q * 0.9 + cg(X, Y, s) * 0.28 + add);
    }
  }
}
// uma mancha sobre o que já está pintado; só nas rampas de on (ou em tudo); bias engrossa
function stain(P, R, cover, s, bias, lift = 0, on = null) {
  const me = P.idOf(R);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0 || P.rid[k] === me) continue;
    if (on && !on.includes(P.ramps[P.rid[k]])) continue;
    const n = cn(x, y, 12, 12, s) + cn(x, y, 40, 40, s + 1) * 0.5 + (bias ? bias(x, y) : 0);
    if (n > 0.5 - cover) P.put(x, y, R, 0.9 + P.val[k] * 0.55 + cg(x, y, s + 2) * 0.7 + lift);
  }
}
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
// uma racha: anda de (x, y) na direção ang, torta, escurecendo o que já está pintado (o lábio de baixo aceso); com
// col, acende (magma nas rachas); galhos de vez em quando
function crack(P, x, y, ang, len, s, col = null, dv = 1.4) {
  for (let i = 0; i < len; i++) {
    ang += (hash2(i, 0, s) - 0.5) * 0.9; x += Math.cos(ang); y += Math.sin(ang);
    if (!P.has(x, y)) return;
    if (col) P.N(x, y, typeof col === 'function' ? col(i / len, x, y) : col);
    else {
      const R = P.rampAt(x, y); if (R) P.put(x, y, R, P.v(x, y) - dv);
      const R2 = P.rampAt(x, y + 1); if (R2 && !P.isN(x, y + 1)) P.put(x, y + 1, R2, P.v(x, y + 1) + 0.5);
    }
    if (hash2(i, 1, s) < 0.12) crack(P, x, y, ang + (hash2(i, 2, s) < 0.5 ? 0.9 : -0.9), (len - i) * 0.5, s + i + 7, col, dv);
  }
}
// as dobras da lava cordada: arcos de festão (convexos para onde a lava correu); +1 na crista, -1 no vale
const ropy = (x, y, xc, s, k = 0.07) => Math.sin((y + k * (x - xc) * (x - xc)) * 1.05 + cn(x, y, 9, 9, s) * 2.4 + s);
// escamas sobrepostas: o alto de cada escama claro, a borda de baixo escura (sz o tamanho)
const scaleV = (x, y, sz) => { const hh = sz * 0.7, row = Math.floor(y / hh), ly = (y - row * hh) / hh, lx = (((x + (row % 2) * sz / 2) % sz) + sz) % sz / sz - 0.5; return ly > 0.8 - lx * lx * 1.6 ? -1.1 : 0.6 - ly * 1.1; };

/* ---- peças miúdas ---- */
// uma moeda deitada (3 x 2) ou em pé (2 x 3); a de cima acesa
function coin(P, x, y, s, edge = false) {
  x = Math.floor(x); y = Math.floor(y); const R = RP.ouro, h = hash2(x, y, s);
  if (edge) { P.put(x, y - 1, R, 4.6); P.put(x, y, R, 3.4); P.put(x, y + 1, R, 2.2); P.put(x + 1, y, R, 1.6); return; }
  P.put(x - 1, y, R, 3.8 + h * 0.6); P.put(x, y, R, 4.7); P.put(x + 1, y, R, 3.5 + h * 0.4);
  P.put(x - 1, y + 1, R, 2.3); P.put(x, y + 1, R, 2.8); P.put(x + 1, y + 1, R, 1.8);
}
// um monte de moedas em domo de x0 a x1, o pé em by, hgt de altura: o miolo, a pele de moedas de trás para a frente
// (algumas em pé), pedras soltas; marca nGlint brilhos no alto; devolve o contorno de cima
function coinHeap(P, x0, x1, by, hgt, s, nGlint = 2, gems = true) {
  const w = x1 - x0, top = x => by - hgt * Math.pow(Math.max(0, Math.sin(Math.PI * clamp((x - x0) / w, 0, 1))), 0.75);
  for (let x = Math.floor(x0); x <= x1; x++) { const t = top(x + 0.5); for (let y = Math.ceil(t); y <= by; y++) P.put(x, y, RP.ouro, 2.7 - (y - t) * 0.22 + ((x * 3 + y * 5) % 7 === 0 ? 1.3 : 0) + ((x + y * 2) % 5 === 0 ? -0.9 : 0) + cg(x, y, s) * 0.5 - (x - x0) / w * 0.5); }
  const n = Math.round(w * hgt * 0.32) + 4, L = [];
  for (let k = 0; k < n; k++) { const x = x0 + 1 + hash2(k, 0, s) * (w - 2), t = top(x), y = t + Math.pow(hash2(k, 1, s), 1.6) * Math.max(1, by - t - 1); L.push([x, y, hash2(k, 2, s) < 0.12]); }
  L.sort((a, b) => a[1] - b[1]);
  for (const [x, y, e] of L) coin(P, x, y, s, e);
  if (gems) for (let k = 0; k < Math.floor(w / 12); k++) { const x = Math.floor(x0 + w * (0.2 + 0.6 * hash2(k, 9, s))), y = Math.floor(by - (by - top(x)) * 0.4), G = hash2(k, 10, s) < 0.5 ? RP.rubi : RP.safira; P.put(x, y, G, 4.6); P.put(x + 1, y, G, 2.6); P.put(x, y + 1, G, 1.8); }
  for (let k = 0; k < nGlint; k++) { const x = x0 + w * (0.2 + 0.6 * hash2(k, 7, s)); P.mark('brilho', x, Math.round(top(x)) + 1); }
  return top;
}
// a taça de ouro: o bojo, a haste com o nó, o pé; (x, by) o meio do pé; ang a inclinação; gem uma pedra no bojo
function goblet(P, x, by, s, ang = 0, gem = null, big = false) {
  const Q = painter(9, 11), R = RP.ouro, rx = big ? 4 : 3.4;
  Q.ell(4.5, 2.4, rx, 3, (xx, yy, dx, dy) => { if (dy < -0.5) return; Q.put(xx, yy, R, 3.5 - dx * 1.5 - dy * 0.4 + (dx < -0.35 && dx > -0.8 && dy < 0.5 ? 1.3 : 0)); });
  for (let xx = Math.floor(4.5 - rx); xx < 4.5 + rx; xx++) Q.put(xx, 1, R, xx < 4 ? 4.9 : 3.8);
  for (let xx = Math.floor(5.5 - rx); xx < 3.5 + rx; xx++) Q.put(xx, 2, R, 1.2);   // o fundo escuro da boca
  if (gem) { Q.put(4, 4, gem, 4.6); Q.put(5, 4, gem, 2.6); }
  Q.put(4, 6, R, 4); Q.put(5, 6, R, 2.4); Q.put(3, 7, R, 3.8); Q.put(4, 7, R, 4.6); Q.put(5, 7, R, 2.4); Q.put(4, 8, R, 3.6); Q.put(5, 8, R, 2.2);
  Q.rect(2, 9, 5, 1, R, i => 4.6 - i * 0.6); Q.rect(1, 10, 7, 1, R, i => 3.3 - i * 0.3);
  Q.mark('brilho', 2, 2);
  blit(P, Q, x - 4, by - 10, ang, 4.5, 10);
}
// uma coroa de pontas (largura w), o aro com pedras; (x, by) o canto de baixo à esquerda
function crown(P, x, by, w, s, R = RP.ouro) {
  for (let i = 0; i < w; i++) { P.put(x + i, by, R, 3.4 - i / w * 1.2); P.put(x + i, by - 1, R, 4.4 - i / w * 1.4); P.put(x + i, by - 2, R, 3.6 - i / w * 1.2); }
  for (let i = 0; i < w; i += 2) {
    const h = i % 4 === 0 ? 3 : 2; for (let j = 1; j <= h; j++) P.put(x + i, by - 2 - j, R, 4.4 - j * 0.3 - i / w);
    P.put(x + i, by - 3 - h, R, 5);   // a bolinha na ponta
  }
  for (let i = 1; i < w - 1; i += 3) P.put(x + i, by - 1, i % 2 ? RP.rubi : RP.safira, 4.4);
  P.mark('brilho', x + 1, by - 4);
}
// vela de sebo grossa, escorrida; (x, by) o pé; marca a chama
function tallow(P, x, by, h, s) {
  for (let y = by - h + 1; y <= by; y++) { P.put(x, y, RP.sebo, 4.5 - (y - by + h) * 0.08); P.put(x + 1, y, RP.sebo, 3.3); P.put(x + 2, y, RP.sebo, 2.2); }
  P.put(x - 1, by, RP.sebo, 3.4); P.put(x + 3, by, RP.sebo, 1.8);
  if (h > 3) { P.put(x - 1, by - h + 3, RP.sebo, 4); P.put(x - 1, by - h + 4, RP.sebo, 3.4); }   // o escorrido
  P.put(x + 1, by - h + 1, RP.sebo, 5); P.put(x + 1, by - h, RP.carvao, 3);   // o pavio
  P.mark('vela', x + 1, by - h - 1);
}
// um osso: a haste e os dois nós na ponta
function bone(P, x0, y0, x1, y1, wd, s, base = 2.8, R = RP.osso) {
  tube(P, lin(x0, y0, x1, y1), () => wd, R, s, base);
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, r = Math.max(0.9, wd * 0.5);
  for (const [x, y] of [[x0, y0], [x1, y1]]) for (const sd of [-1, 1]) P.blob(x + nx * wd * 0.42 * sd, y + ny * wd * 0.42 * sd, r, r, R, s + sd, base + (sd < 0 ? 0.4 : -0.2));
}
// um dente cônico curvo: da raiz (x0, y0) à ponta (x1, y1), largura wd na raiz
function fang(P, x0, y0, x1, y1, wd, s, R = RP.osso, base = 3.2) {
  const mx = (x0 + x1) / 2 + (y1 - y0) * 0.12, my = (y0 + y1) / 2 - (x1 - x0) * 0.12;
  sweep(P, bez([x0, y0], [mx, my], [mx, my], [x1, y1]), t => Math.max(0.8, wd * (1 - t * 0.92)), R, s, () => 0, { base });
}
// um cristal de olivina facetado (losango): faceta de cima à esquerda clara, as outras escuras; às vezes marca o brilho
function olivXtal(P, x, y, r, s) {
  for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r * 0.8); xx <= x + r * 0.8; xx++) {
    const dx = (xx + 0.5 - x) / (r * 0.8), dy = (yy + 0.5 - y) / r; if (Math.abs(dx) + Math.abs(dy) > 1) continue;
    const f = dx < 0 && dy < 0 ? 4.6 : dx >= 0 && dy < 0 ? 3.2 : dx < 0 ? 2.4 : 1.4;
    P.put(xx, yy, RP.olivina, f + (Math.abs(dx) + Math.abs(dy) > 0.75 ? -0.6 : 0) + (Math.abs(dx) < 0.18 && dy < 0 ? 0.6 : 0));
  }
  if (hash2(Math.floor(x), Math.floor(y), s) < 0.5) P.mark('brilho', x - 1, y - 1, { c: '#eaffc0' });
}
// uma corda de couro torcida de (x0, y0) a (x1, y1)
function cord(P, x0, y0, x1, y1, s, R = RP.couro) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); for (let i = 0; i <= n; i++) P.put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, R, i % 3 === 0 ? 2 : 3.4 + hash2(i, 0, s) * 0.5); }
// a pedra crua (andesito) de apoio: uma laje baixa irregular
function slab(P, x0, x1, top, R, s, base = 2.8) {
  for (let x = x0; x <= x1; x++) { const t = (x - x0) / Math.max(1, x1 - x0), tt = top + (t < 0.08 || t > 0.92 ? 1 : 0) + (hash2(x >> 2, 0, s) < 0.3 ? 1 : 0); for (let y = tt; y < P.h; y++) P.put(x, y, R, base + (y === tt ? 1.3 : y === tt + 1 ? 0.4 : 0) - t * 0.9 - (y - tt) * 0.15 + cg(x, y, s) * 0.5 + cn(x, y, 7, 7, s + 1) * 0.6); }
}

/* =============================== AS CHAMINÉS DE VAPOR =============================== */
function geyser(k) {   // 34 x 34 (k 1: 46 x 26): o gêiser de pedra: um cone de sínter bege em degraus (cada degrau com a beira clara e uma poça na beira), a boca escura e molhada no alto, manchas de mineral laranja escorrendo da boca, entulho de tufo no pé; solta vapor e às vezes um jato (k 1: dois cones baixos lado a lado)
  const W = k ? 46 : 34, H = k ? 26 : 34, P = painter(W, H), s = 27201 + k, R = RP.sinter;
  const cones = k ? [[15, 8, 0.78], [33, 12, 0.72]] : [[16.5, 3, 0.52]];
  cones.forEach(([cx, ty, sl], ci) => {
    P.z = ci + 1;
    const hwAt = a => { const ter = a % 5; return 2.2 + a * sl + Math.pow(a / (H - ty), 2.2) * 5 + (a > 2 && ter === 0 ? 0.9 : a > 2 && ter === 1 ? 0.5 : 0); };
    for (let y = ty; y < H; y++) {
      const a = y - ty, ter = a % 5, hw = hwAt(a);
      for (let x = Math.floor(cx - hw); x < cx + hw; x++) {
        const u = (x + 0.5 - cx) / hw;
        P.put(x, y, R, 3.1 - u * 1.3 - u * u * 0.5 + (a > 2 && ter === 0 ? 1.1 : ter === 1 ? 0.35 : ter === 4 ? -0.7 : 0) - a / H * 0.5 + cg(x, y, s) * 0.45 + cn(x, y, 6, 6, s + ci) * 0.5);
      }
      // a poça que fica na beira de cada degrau
      if (a > 2 && ter === 0 && y < H - 2 && hash2(a, ci, s) < 0.75) { const px = Math.floor(cx - hw * (0.2 + hash2(a, 1, s) * 0.4)); P.put(px, y, RP.agua, 4.4); P.put(px + 1, y, RP.agua, 3.6); if (hash2(a, 2, s) < 0.5) P.put(px + 2, y, RP.agua, 3); }
    }
    // as manchas de mineral escorrendo da boca, por cima dos degraus
    for (let j = 0; j < (k ? 4 : 6); j++) {
      let x = cx + (hash2(j, 0, s + ci) - 0.5) * 4; const y1 = H - 3 - hash2(j, 1, s + ci) * (H - ty) * 0.5;
      for (let y = ty + 2; y < y1; y++) { x += (hash2(j, y, s) - 0.5) * 0.9 + (x - cx) * 0.03; if (P.is(x, y, R) && hash2(Math.floor(x), y, s + 3) < 0.85) P.put(x, y, (y - ty) / (H - ty) < 0.35 ? RP.ferrugem : RP.esteira, P.v(x, y) * 0.75 + 0.7); }
    }
    // a boca: o buraco escuro, o anel molhado
    const mx = Math.floor(cx);
    for (let x = mx - 2; x <= mx + 1; x++) P.put(x, ty, RP.sombra, x === mx - 2 ? 2.4 : 1.2);
    P.put(mx - 1, ty + 1, RP.sombra, 2.2); P.put(mx, ty + 1, RP.sombra, 1.6);
    P.put(mx - 3, ty, RP.agua, 4.2); P.put(mx + 2, ty, RP.agua, 3); P.put(mx - 3, ty + 1, RP.agua, 3.4); P.put(mx + 2, ty + 1, RP.agua, 2.4);
    P.mark('vapor', mx - 1, ty - 1, { w: 3, jato: ci === 0 ? 1 : 0, n: 5 });
  });
  seams(P);
  P.z = 9; rubble(P, 0, W - 1, H - 1, 3, RP.tufo, s + 7);
  return P.done();
}
function boilingBasin(k) {   // 48 x 20 (k 1: 36 x 24): a bacia de água fervendo: a borda de rocha (a de trás fina, a da frente grossa com a crosta de sínter), a água azul-verde funda no meio e os anéis amarelo e laranja na beira (o limo da água quente), um fio d'água transbordando pela frente; bolhas e vapor ao vivo (k 1: menor e mais funda, o transbordo descendo em degrauzinhos de sínter)
  const W = k ? 36 : 48, H = k ? 24 : 20, P = painter(W, H), s = 27221 + k, cx = W / 2, sy = k ? 8 : 7, rx = W / 2 - 3.5;
  // a borda de trás (fina, mais escura)
  for (let x = 3; x < W - 3; x++) { const u = (x + 0.5 - cx) / rx; if (Math.abs(u) > 1) continue; const yb = sy - 1 - Math.round(Math.sqrt(Math.max(0, 1 - u * u)) * 1.6); for (let y = yb; y < sy; y++) P.put(x, y, y === yb ? RP.sinter : RP.andesito, (y === yb ? 3.4 : 2) - u * 0.6 + cg(x, y, s) * 0.4); }
  // a água e os anéis de cor
  for (let x = 2; x < W - 2; x++) {
    const u = Math.abs(x + 0.5 - cx) / rx; if (u > 1.04) continue;
    for (let y = sy; y < sy + 3; y++) {
      if (u < 0.56) P.put(x, y, RP.agua, 2.6 - u * 1.4 + (y === sy ? 0.8 : 0) + Math.sin(x * 0.7 + y) * 0.25);
      else if (u < 0.7) P.put(x, y, RP.agua, 4.4 + (y === sy ? 0.5 : -0.4));
      else if (u < 0.84) P.put(x, y, RP.esteira, 4 + (y === sy ? 0.6 : -0.3) + cg(x, y, s) * 0.4);
      else P.put(x, y, RP.ferrugem, 3.6 + (y === sy ? 0.4 : -0.5) + cg(x, y, s) * 0.4);
    }
  }
  // a borda da frente: a crosta clara em cima, a rocha embaixo; os cantos arredondados
  P.z = 1;
  const spill = Math.floor(W * (k ? 0.62 : 0.68));
  for (let x = 1; x < W - 1; x++) {
    const u = (x + 0.5 - cx) / (W / 2 - 1), e = Math.abs(u), yt = sy + 3 + (e > 0.86 ? Math.round((e - 0.86) * 14) - 1 : 0) - (e > 0.86 && e < 0.94 ? 0 : 0);
    for (let y = Math.max(sy - 1, yt); y < H; y++) {
      const a = y - yt, inCrust = a < 2 || (k && Math.abs(x - spill) < 4 + (y - yt) * 0.4 && a < H - yt - 1);
      P.put(x, y, inCrust ? RP.sinter : RP.andesito, (inCrust ? 3.6 - a * 0.4 + (k && a > 1 && (y - yt) % 3 === 0 ? 0.9 : 0) : 3 - a * 0.12) - u * 1.1 - e * e * 0.6 + cg(x, y, s) * 0.5 + cn(x, y, 7, 7, s) * 0.55 + (hash2(x, y, s) < 0.05 ? -1.2 : 0));
    }
  }
  // o transbordo: a água escorrendo pela frente, o rastro amarelo e laranja em volta
  for (let y = sy + 3; y < H - 1; y++) { const x = spill + Math.round(Math.sin(y * 0.8) * 0.6); P.put(x - 1, y, RP.esteira, 3.4); P.put(x, y, RP.agua, 4.4 - (y - sy) * 0.08); P.put(x + 1, y, RP.agua, 3); P.put(x + 2, y, RP.ferrugem, 3); }
  for (let x = spill - 3; x < spill + 5; x++) P.put(x, H - 1, RP.agua, 3.6 - Math.abs(x - spill) * 0.3);
  seams(P);
  P.mark('bolha', cx - rx * 0.5, sy, { w: Math.round(rx) });
  for (const f of [0.3, 0.5, 0.72]) P.mark('vapor', Math.round(3 + (W - 6) * f), sy - 1, { w: 5, n: 3 });
  return P.done();
}
function olivineRock(k) {   // 34 x 26 (k 1: 38 x 24): a rocha de basalto (lava cordada escura, cheia de furinhos) com ninhos de cristais de olivina verde saindo da crosta; os cristais cintilam (k 1: a rocha rachada ao meio, o miolo verde granulado aparecendo na fenda)
  const W = k ? 38 : 34, H = k ? 24 : 26, P = painter(W, H), s = 27241 + k, R = RP.lavaC;
  const lumps = k ? [[11, 15, 10.5, 10], [27, 16, 10, 9]] : [[15, 16, 13.5, 12], [27, 20, 7, 7]];
  lumps.forEach(([lx, ly, rx, ry], i) => {
    P.z = i + 1;
    P.ell(lx, ly, rx, ry, (x, y, dx, dy, d) => { if (y > H - 1) return; P.put(x, y, R, 3.4 - dx * 1.1 - dy * 1.3 - d * 0.7 + cg(x, y, s) * 0.5 + cn(x, y, 7, 7, s + i) * 0.7 + (hash2(x, y, s) < 0.07 ? -1.4 : 0) + (hash2(x, y, s + 1) < 0.03 ? 1 : 0)); });
  });
  if (k) {
    // a fenda: o miolo de olivina granulada aparecendo entre as duas metades
    for (let y = 4; y < H; y++) { const c = 19 + Math.sin(y * 0.5) * 1.2 - (y - 4) * 0.08, hw = 1.6 + Math.sin(Math.PI * (y - 4) / (H - 4)) * 2.6; for (let x = Math.floor(c - hw); x < c + hw; x++) { if (!P.has(x, y)) continue; const g = hash2(x >> 1, y >> 1, s) * 2 + (x < c ? 0.8 : -0.4); P.put(x, y, RP.olivina, 1.6 + g + cg(x, y, s) * 0.5); } P.put(c - hw - 1, y, R, 1); P.put(c + hw, y, R, 4.2); }
    P.mark('brilho', 18, 10, { c: '#eaffc0' }); P.mark('brilho', 20, 17, { c: '#eaffc0' });
  }
  seams(P);
  // os ninhos de cristais na crosta
  P.z = 5;
  const nests = k ? [[6, 9, 4], [30, 10, 3], [9, 18, 3]] : [[9, 9, 5], [21, 7, 4], [26, 17, 3], [7, 18, 3]];
  for (const [nx, ny, n] of nests) for (let j = 0; j < n; j++) { const x = nx + (hash2(j, nx, s) - 0.5) * 6, y = ny + (hash2(j, ny, s) - 0.5) * 4, r = 1.6 + hash2(j, 3, s) * 1.6; if (P.has(x, y + 1)) olivXtal(P, x, y, r, s + j + nx); }
  chip(P, 0.12, s, [R]);
  return P.done();
}
function saltCrust(k) {   // 40 x 32 (k 1: 46 x 24): a crosta de sal na parede: o sal do mar de cima secando em couve-flor branca e creme, a água de mineral escorrendo em listras cor de ferrugem, as estalactitezinhas de sal penduradas embaixo (k 1: uma faixa comprida ao longo de uma racha, mais escorrida)
  const W = k ? 46 : 40, H = k ? 24 : 32, P = painter(W, H), s = 27261 + k, R = RP.sal;
  const inShape = k ? (x, y) => { const dx = (x + 0.5 - 23) / 21, dy = (y + 0.5 - 8 - (x - 23) * 0.1) / 5.5; return dx * dx + dy * dy + cn(x, y, 7, 7, s) * 0.8 - 0.4 < 1; }
    : (x, y) => { const dx = (x + 0.5 - 20) / 17.5, dy = (y + 0.5 - 12) / 10.5; return dx * dx + dy * dy + cn(x, y, 8, 8, s) * 0.8 - 0.4 < 1; };
  // o fundo da crosta (mais escuro, entre os caroços)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inShape(x, y)) P.put(x, y, R, 1.8 + cg(x, y, s) * 0.5 - x / W * 0.4);
  // os caroços de couve-flor, de cima para baixo
  const L = []; for (let j = 0; j < (k ? 110 : 120); j++) { const x = 1 + hash2(j, 0, s) * (W - 2), y = 1 + hash2(j, 1, s) * (H - 2); if (inShape(x, y)) L.push([x, y, j]); }
  L.sort((a, b) => a[1] - b[1]);
  for (const [x, y, j] of L) P.blob(x, y, 1.2 + hash2(j, 2, s) * 1.7, 1 + hash2(j, 3, s) * 1.3, R, s + j, 2.8 - x / W * 0.5);
  // a água de mineral escorrendo
  for (let j = 0; j < 3; j++) { let x = 6 + hash2(j, 5, s) * (W - 12); const y0 = Math.floor(hash2(j, 6, s) * H * 0.3); for (let y = y0; y < H; y++) { x += (hash2(j, y, s) - 0.5) * 1.6 + Math.sin(y * 0.5 + j) * 0.35; if (cn(x, y, 3, 3, s + j) > 0.62) continue; if (P.is(x, y, R) && P.v(x, y) < 3.6) P.put(x, y, RP.ferrugem, 2.2 + P.v(x, y) * 0.4); } }
  // as estalactitezinhas: do pé de cada coluna da crosta, penduradas
  for (let x = 2; x < W - 2; x++) {
    if (hash2(x, 9, s) > 0.42) continue; let y = H - 1; while (y > 0 && !P.has(x, y)) y--; if (!y) continue;
    const l = 1 + Math.floor(hash2(x, 10, s) * (k ? 6 : 5)); for (let j = 1; j <= l; j++) P.put(x, y + j, R, 3.8 - j * 0.35 - (j === l ? 0.4 : 0));
    if (l > 3) P.put(x + 1, y + 1, R, 2.6);
  }
  P.mark('brilho', W * 0.35, H * 0.3, { c: '#ffffff' }); P.mark('brilho', W * 0.62, H * 0.45, { c: '#ffffff' });
  return P.done();
}
// o crânio de peixe das profundezas, de perfil olhando para a esquerda, num quadro de 54 x 26 (jaw: com a mandíbula)
function fishSkullQ(s, jaw) {
  const P = painter(54, 26), R = RP.osso;
  // o opérculo (a tampa da guelra) atrás, em leque com as costelinhas
  P.z = 1;
  P.ell(41, 14, 8, 9, (x, y, dx, dy, d) => { if (dx < -0.2) return; const a = Math.atan2(dy, dx); P.put(x, y, R, 2.8 - dy * 0.8 - d * 0.6 + (Math.abs(((a * 3.2) % 1 + 1) % 1 - 0.5) < 0.14 ? 1 : 0) + (d > 0.8 ? -0.5 : 0) + cg(x, y, s) * 0.35); });
  // o crânio: o domo alto, a crista de cima
  P.z = 2;
  P.ell(33, 12, 12.5, 8.5, (x, y, dx, dy, d) => { if (y > 19) return; P.put(x, y, R, 3.5 - dx * 0.8 - dy * 1.3 - d * 0.6 + cg(x, y, s) * 0.4 + cn(x, y, 6, 6, s) * 0.5); });
  for (let x = 26; x < 44; x++) { const y = 3 + Math.round(Math.pow((x - 35) / 9, 2) * 2.6); P.put(x, y, R, 4.8 - (x - 26) * 0.08); P.put(x, y + 1, R, 4); }
  // o maxilar comprido para a esquerda com as presas para baixo
  P.z = 3;
  const up = x => 13 + (24 - x) * 0.12;
  for (let x = 3; x < 25; x++) { const y = up(x); for (let j = 0; j < 3; j++) P.put(x, y + j, R, 4.2 - j * 1.1 - (24 - x) * 0.02 + cg(x, y + j, s) * 0.3); }
  P.blob(4, up(4) + 1, 2.4, 2, R, s + 2, 3.2);
  // a mandíbula: da dobradiça embaixo do crânio até a ponta, curvando para cima, presas para cima
  const lo = x => 21 - Math.pow((28 - x) / 25, 1.6) * 3;
  if (jaw) {
    for (let x = 4; x < 31; x++) { const y = lo(x); for (let j = 0; j < 3; j++) P.put(x, y + j, R, 3.6 - j * 1 + cg(x, y + j, s) * 0.3); }
    // a boca aberta: escuro entre os dois
    for (let x = 6; x < 26; x++) for (let y = Math.ceil(up(x) + 3); y < lo(x); y++) P.put(x, y, RP.sombra, 1.6 - (x - 6) / 20);
  }
  // as presas: finas e compridas na frente, pequenas atrás (as do maxilar descem, as da mandíbula sobem)
  P.z = 4;
  for (let x = 5; x < 24; x += 2) { const l = Math.round(1 + (24 - x) / 6 + hash2(x, 0, s) * 1.5), y0 = Math.ceil(up(x) + 3); for (let j = 0; j < l; j++) P.put(x, y0 + j, R, 4.8 - j * 0.6); }
  if (jaw) for (let x = 6; x < 25; x += 3) { const l = Math.round(1 + (25 - x) / 8 + hash2(x, 1, s)), y0 = Math.floor(lo(x)) - 1; for (let j = 0; j < l; j++) P.put(x, y0 - j, R, 4.4 - j * 0.6); }
  // a órbita grande e funda, a borda de cima acesa; a narina
  P.ell(28, 10, 4.6, 4.2, (x, y, dx, dy, d) => P.put(x, y, d > 0.62 ? R : RP.sombra, d > 0.62 ? (dy < 0 ? 1.6 : 4.4) - dx * 0.4 : 0.8 + d));
  P.put(12, 12, RP.sombra, 1); P.put(13, 12, RP.sombra, 1.6);
  // as vértebras que ficaram, caídas atrás
  P.z = 1;
  for (const [x, y] of [[49, 20], [52, 21]]) { P.rect(x, y - 2, 2, 4, R, (i, j) => 3.6 - i * 1 - j * 0.3); P.put(x, y - 3, R, 4.2); P.put(x + 1, y + 2, R, 1.8); }
  seams(P);
  // as rachas, o sal do mar e as cracas
  for (let j = 0; j < 4; j++) crack(P, 30 + hash2(j, 0, s) * 12, 6 + hash2(j, 1, s) * 8, 1.2 + hash2(j, 2, s), 7, s + j * 11);
  stain(P, RP.sal, -0.1, s + 5, (x, y) => (y < 9 ? 0.25 : -0.2), 0.8, [R]);
  for (const [x, y] of [[36, 7], [40, 16], [19, 14]]) { P.put(x, y, RP.sal, 4.6); P.put(x + 1, y, RP.sal, 3.6); P.put(x, y + 1, RP.sal, 3); P.put(x + 1, y + 1, RP.sombra, 1.4); }
  return P;
}
function fishSkull(k) {   // 54 x 26 (k 1: 58 x 28): o crânio de peixe gigante caído do mar de cima: o domo alto com a crista, a órbita funda, o maxilar comprido cheio de presas finas como agulhas, a tampa da guelra em leque, duas vértebras caídas atrás, sal e cracas do mar (k 1: tombado de lado, a mandíbula solta no chão na frente)
  if (!k) return fishSkullQ(27281, true).done();
  const P = painter(58, 28), s = 27282, Q = fishSkullQ(s, false);
  blit(P, Q, 3, -1, -0.16, 30, 20);
  // a mandíbula solta, deitada no chão
  P.z = 6;
  for (let x = 3; x < 30; x++) { const y = 25 - Math.round(Math.pow((30 - x) / 27, 1.4) * 2); P.put(x, y, RP.osso, 4.2 - (30 - x) * 0.02); P.put(x, y + 1, RP.osso, 2.8); if (y + 2 < 28) P.put(x, y + 2, RP.osso, 1.8); if (x % 3 === 0 && x < 26) { P.put(x, y - 1, RP.osso, 4.6); if (x < 14) P.put(x, y - 2, RP.osso, 4); } }
  seams(P);
  return P.done();
}
function steamCurtain(k) {   // 30 x 60: a cortina de vapor: uma fenda funda e torta na parede de tufo, os lábios de crosta de sínter com o limo amarelo, a água escorrendo; lá no fundo da fenda a rocha brilha de calor (só no pé); o vapor sai ao vivo em lâminas (k 1: a fenda se abre em duas no alto)
  const W = 30, H = 60, P = painter(W, H), s = 27301 + k;
  const cxAt = (y, b = 0) => 15 + Math.sin(y * 0.11 + s + b) * 3 + Math.sin(y * 0.31 + b) * 1.2 + b * (H * 0.45 - y) * 0.36;
  const hwAt = y => (1.1 + Math.sin(Math.PI * y / H) * 2.6 + cn(0, y, 1, 5, s) * 1.2) * (y > H - 10 ? 1 + (y - H + 10) * 0.1 : 1);
  const branches = k ? [0, 1] : [0];
  for (const b of branches) for (let y = b ? 3 : 2; y < (b ? H * 0.45 : H); y++) {
    const c = cxAt(y, b), hw = b ? hwAt(y) * 0.7 : hwAt(y);
    for (let x = Math.floor(c - hw - 4.5); x < c + hw + 4.5; x++) {
      const dd = Math.abs(x + 0.5 - c) - hw; if (dd > 3 + cn(x, y, 4, 4, s) * 3) continue;
      if (dd < 0) {
        // o fundo da fenda: escuro; no pé, a rocha quente acesa
        const q = Math.abs(x + 0.5 - c) / hw;
        P.put(x, y, RP.sombra, 2.4 - q * 0.6 - (1 - q) * 1.6);
        const hot = (y / H - 0.6) * 2.4; if (!b && hot > 0 && q < 0.55 && hash2(x, y, s) < hot * 0.7) P.N(x, y, y > H - 6 && hash2(x, y, s + 1) < 0.35 ? MG.laranja : hash2(x, y, s + 2) < 0.4 ? MG.fundo : MG.brasa);
      } else {
        const lip = dd < 1.4, left = x < c;
        if (P.isN(x, y) || (P.has(x, y) && P.rampAt(x, y) === RP.sombra)) continue;
        P.put(x, y, lip ? RP.sinter : RP.tufo, (left ? 3.6 : 2.2) - dd * 0.35 + (lip && left ? 0.6 : 0) + cg(x, y, s) * 0.5 + cn(x, y, 6, 6, s + 2) * 0.5);
      }
    }
  }
  // o limo amarelo e a água nos lábios
  stain(P, RP.esteira, -0.15, s + 4, (x, y) => (y > H * 0.5 ? 0.2 : -0.1), 0.6, [RP.sinter]);
  for (let j = 0; j < 3; j++) { let x = cxAt(10 + j * 12) - hwAt(10 + j * 12) - 1; for (let y = 10 + j * 12; y < H - 2; y++) { if (P.is(x, y, RP.sinter) || P.is(x, y, RP.tufo) || P.is(x, y, RP.esteira)) P.put(x, y, RP.agua, 3.4 + (y % 4 === 0 ? 0.8 : 0)); x += (hash2(j, y, s) - 0.5) * 0.4; } }
  // os pontos de onde o vapor sai ao longo da fenda
  for (let y = 6; y < H - 4; y += 5) P.mark('cortina', cxAt(y), y, { w: Math.max(2, Math.round(hwAt(y) * 2)) });
  if (k) for (let y = 6; y < H * 0.42; y += 6) P.mark('cortina', cxAt(y, 1), y, { w: 2 });
  return P.done();
}

/* =============================== OS TÚNEIS KOBOLD =============================== */
function campfire(k) {   // 36 x 28: a fogueira kobold: a roda de pedras, ossos e carvão cruzados, as brasas acesas, duas forquilhas de osso com o espeto de ferro e um lagarto-de-gruta assando (k 1: o tripé de ossos amarrados com o pote de barro pendurado, soltando vapor); o fogo é ao vivo
  const W = 36, H = 28, P = painter(W, H), s = 27321 + k, cx = 18, by = H - 1;
  P.z = 1;
  if (!k) {
    // as forquilhas de osso e o espeto
    for (const x of [5, 30]) { bone(P, x, by - 1, x + (x < cx ? 0.6 : -0.6), 11, 2, s + x, 2.6); P.line(x, 11, x - 2, 6, RP.osso, 3.6); P.line(x + 1, 11, x + 3, 6, RP.osso, 2.6); cord(P, x - 1, 12, x + 2, 12, s + x); }
    for (let x = 2; x < 34; x++) { P.put(x, 8, RP.ferro, x < 6 ? 4 : 3.6 - (x - 6) * 0.02); P.put(x, 9, RP.ferro, 1.8); }
    P.rect(1, 7, 2, 4, RP.ferro, (i, j) => 3.4 - i - j * 0.3);   // a manivela
    // o lagarto no espeto: o corpo dourado de assado, a cabeça, o rabo enrolado, as patinhas encolhidas
    P.z = 2;
    P.ell(18, 8.5, 7.5, 2.8, (x, y, dx, dy, d) => P.put(x, y, RP.carne, 3.6 - dx * 0.8 - dy * 1.5 - d * 0.5 + ((x + (y & 1)) % 3 === 0 ? -0.6 : 0) + cg(x, y, s) * 0.3));
    P.ell(9.5, 8, 2.6, 1.8, (x, y, dx, dy) => P.put(x, y, RP.carne, 3.8 - dx * 0.6 - dy * 1.2)); P.put(8, 7, RP.carvao, 1);
    for (let i = 0; i < 9; i++) { const a = i * 0.45, r = 5 - i * 0.4; P.put(25 + Math.cos(a) * r * 0.9 + i * 0.4, 9 + Math.sin(a) * r * 0.5 - i * 0.2, RP.carne, 3.4 - i * 0.15); }
    for (const x of [13, 21]) { P.put(x, 11, RP.carne, 2.4); P.put(x + 1, 11, RP.carne, 2); }
    for (const x of [15, 18, 21]) P.put(x, 6, RP.carne, 5);   // a gordura brilhando no lombo
  } else {
    // o tripé de ossos amarrado no alto, o pote de barro pendurado
    for (const [x0, x1] of [[4, 17], [32, 19], [12, 18]]) bone(P, x0, by - 1, x1, 2, x0 === 12 ? 1.6 : 2, s + x0, x0 === 12 ? 2 : 2.8);
    cord(P, 16, 2, 20, 3, s); cord(P, 16, 4, 20, 2, s + 1);
    for (let y = 4; y < 9; y++) P.put(18, y, RP.ferro, 3 - (y & 1));
    P.z = 2;
    P.ell(18, 13, 6.5, 5, (x, y, dx, dy, d) => { if (dy < -0.55) return; P.put(x, y, RP.barro, 3.4 - dx * 1.3 - dy * 0.6 - d * 0.4 + (Math.abs(dy - 0.1) < 0.12 ? -0.8 : 0) + cg(x, y, s) * 0.4); });
    for (let x = 12; x < 25; x++) { P.put(x, 9, RP.barro, x < 18 ? 4.4 : 3.4); P.put(x, 10, RP.barro, 2.2); }
    for (let x = 13; x < 24; x++) P.put(x, 9 - (x > 14 && x < 23 ? 0 : 0), RP.barro, x < 17 ? 4.6 : 3.6);
    P.put(14, 10, RP.carne, 3.6); P.put(17, 10, RP.carne, 3); P.put(21, 10, RP.agua, 3.4);   // o caldo
    P.mark('vapor', 16, 8, { w: 5, n: 3 });
  }
  // o miolo da fogueira: ossos queimados e carvão cruzados, as brasas
  P.z = 3;
  for (const [x0, y0, x1, y1] of [[10, by - 2, 25, by - 5], [12, by - 6, 26, by - 2], [14, by - 2, 22, by - 2]]) P.line(x0, y0, x1, y1, RP.carvao, (t) => 2.6 - t * 0.8 + (hash2(Math.round(t * 20), y0, s) < 0.3 ? -1 : 0), 2);
  for (let x = 11; x < 26; x++) for (let y = by - 6; y <= by; y++) {
    if (!P.has(x, y) && y < by - 2) continue; const t = Math.abs(x - 18) / 8, hgt = 3.4 - t * 2.4; if (by - y > hgt + 0.5) continue;
    const h = hash2(x, y, s); if (h < 0.42) P.N(x, y, h < 0.08 ? MG.claro : h < 0.22 ? MG.ambar : h < 0.34 ? MG.laranja : MG.fundo); else if (!P.has(x, y)) P.put(x, y, RP.cinza, 1.6 + h);
  }
  // a roda de pedras: as de trás menores e escuras, as da frente grandes
  P.z = 4;
  for (const [x, y, r, v] of [[7, by - 3, 2, 2.2], [11, by - 4.5, 1.8, 2], [25, by - 4.5, 1.8, 2], [29, by - 3, 2, 2.1]]) P.blob(x, y, r + 0.4, r, RP.andesito, s + x, v);
  P.z = 5;
  for (const [x, y, r] of [[5, by - 1.5, 2.6], [10, by - 1, 2.8], [15.5, by - 0.8, 2.6], [21, by - 0.8, 2.8], [26.5, by - 1, 2.6], [31, by - 1.5, 2.4]]) P.blob(x, y, r + 0.5, r, RP.andesito, s + x * 3, 2.8);
  seams(P);
  for (let x = 9; x < 28; x += 3) if (P.is(x, by - 3, RP.andesito)) P.N(x, by - 3, MG.brasa);   // o brilho das brasas batendo nas pedras
  P.mark('fogo', 12, by - 4, { w: 13 });
  return P.done();
}
function coinBasket(k) {   // 26 x 24: o cesto de moedas roubadas: o cesto de vime trançado, transbordando de moedas com uma taça espetada e um colar caído pela borda, moedas soltas no pé (k 1: o cesto tombado, as moedas escorrendo para fora)
  const W = 26, H = 24, P = painter(W, H), s = 27341 + k, R = RP.vime;
  const weave = (x, y, u) => 2.8 - u * 1.3 + (((x + ((y >> 1) % 2) * 2) >> 1) % 2 ? 0.7 : -0.5) + (y % 2 ? -0.3 : 0.2) + (x % 5 === 0 ? -0.6 : 0) + cg(x, y, s) * 0.3;
  if (!k) {
    P.z = 1;
    coinHeap(P, 4, 22, 12, 7, s, 2);
    goblet(P, 17, 9, s + 3, 0.45, RP.rubi);
    P.z = 2;
    for (let y = 11; y < H; y++) { const t = (y - 11) / (H - 12), hw = 9.2 - t * 1.6 - (y === H - 1 ? 1 : 0); for (let x = Math.floor(13 - hw); x < 13 + hw; x++) P.put(x, y, R, weave(x, y, (x + 0.5 - 13) / hw)); }
    for (let x = 3; x < 23; x++) { P.put(x, 11, R, (x % 2 ? 4.4 : 3.6) - (x - 3) * 0.06); P.put(x, 12, R, (x % 2 ? 2.6 : 3.4) - (x - 3) * 0.05); }   // a borda trançada
    // o colar de contas de pérola caindo pela borda
    P.z = 3;
    for (let i = 0; i < 9; i++) { const x = 6 + i * 0.9, y = 12 + Math.sin(i / 8 * Math.PI) * 5; P.put(x, y, RP.sal, i % 2 ? 4.8 : 3.8); }
    P.put(9, 18, RP.rubi, 4.4);
    coin(P, 2, H - 2, s); coin(P, 23, H - 1, s + 1, true); coin(P, 25, H - 2, s + 2);
  } else {
    // o cesto deitado: o corpo de vime à esquerda, a boca escura virada para a direita
    P.z = 1;
    for (let y = 8; y < H; y++) for (let x = 1; x < 15; x++) { const v = (y - 8) / (H - 9), u = v * 2 - 1, e = Math.sqrt(Math.max(0, 1 - u * u)); if (x < 1 + (1 - e) * 3) continue; P.put(x, y, R, weave(y, x, -u * 0.8) - (x < 3 ? 0.5 : 0)); }
    P.ell(14.5, 15.5, 3, 7.5, (x, y, dx, dy, d) => P.put(x, y, d > 0.6 ? R : RP.sombra, d > 0.6 ? 4 - dy * 1.2 : 1 + d));
    for (let y = 9; y < H - 1; y++) P.put(17, y, R, y % 2 ? 4.2 : 3.2);
    P.z = 2;
    coinHeap(P, 13, 25.5, H - 1, 6, s, 2);
    for (const [x, y] of [[15, 13], [15, 17], [16, 20]]) coin(P, x, y, s + x);
    goblet(P, 21, H - 6, s + 4, 1.4);
  }
  seams(P);
  return P.done();
}
function scaleLine(k) {   // 56 x 26: o varal de escamas secando: dois cordões de couro descendo do teto com um nó de osso, o cordão do varal caído em curva, escamas de draco presas em ganchinhos de osso, uma tira de couro de draco, uma fieira de dentes (k 1: um couro inteiro de draco esticado no varal, com as patas caindo)
  const W = 56, H = 26, P = painter(W, H), s = 27361 + k;
  const sagY = x => 6 + 5 * (1 - Math.pow((x - 28) / 25, 2));
  for (const x of [3, 52]) { cord(P, x, 0, x, 5, s + x); P.blob(x + 0.5, 6, 1.3, 1, RP.osso, s + x, 3.2); }
  for (let x = 3; x <= 52; x++) P.put(x, sagY(x), RP.couro, (x % 3 === 0 ? 2.2 : 3.6));
  const scale = (x, y, tilt) => {   // uma escama de draco: gota com a ponta para baixo, a nervura clara, a borda de cima escura
    P.ell(x + tilt * 0.5, y + 4, 2.6, 3.8, (xx, yy, dx, dy, d) => { if (dy > 0.3 && Math.abs(dx) > 1 - (dy - 0.3) * 1.3) return; P.put(xx, yy, RP.escama, 3.5 - dx * 1.2 - dy * 0.6 + (Math.abs(dx) < 0.22 ? 0.9 : 0) - d * 0.3 + cg(xx, yy, s) * 0.3); });
    P.put(x, y, RP.osso, 4); P.put(x, y + 1, RP.osso, 3);
  };
  if (!k) {
    P.z = 1;
    for (const x of [8, 14, 33, 39, 47]) scale(x, sagY(x) + 1, hash2(x, 0, s) - 0.5);
    // a tira de couro de draco: escamas pequenas, a franja embaixo
    for (let x = 18; x < 27; x++) { const y0 = Math.floor(sagY(x)) + 1, l = 13 + Math.round(Math.sin(x * 1.3) * 1.5); for (let y = y0; y < y0 + l; y++) P.put(x, y, RP.escama, 2.6 + scaleV(x, y - y0, 3) + (x === 18 ? 0.7 : x === 26 ? -0.7 : 0) + cg(x, y, s) * 0.3); P.put(x, y0 + l, RP.escama, 1.2); }
    // a fieira de dentes
    for (let i = 0; i < 4; i++) { const x = 29 + i, y = sagY(x) + 1 + i * 2; P.put(x, y, RP.couro, 3); fang(P, x, y + 1, x + 0.5, y + 4, 1.6, s + i, RP.osso, 3.6); }
  } else {
    // o couro inteiro: o corpo esticado, as quatro patas e o rabo caindo
    P.z = 1;
    const top = x => sagY(x) + 1;
    for (let x = 9; x < 47; x++) { const t = (x - 9) / 37, l = 7 + Math.sin(t * Math.PI) * 6; for (let y = Math.floor(top(x)); y < top(x) + l; y++) P.put(x, y, RP.escama, 2.4 + scaleV(x, y, 4) * 0.9 + (y < top(x) + 2 ? 0.8 : 0) - t * 0.4 + cg(x, y, s) * 0.3); }
    for (const [x, d] of [[13, -1], [20, 1], [36, -1], [43, 1]]) { for (let j = 0; j < 7; j++) { P.put(x + d * j * 0.3, top(x) + 9 + j, RP.escama, 3 - j * 0.15); P.put(x + 1 + d * j * 0.3, top(x) + 9 + j, RP.escama, 2); } P.put(x - 1 + d * 2, top(x) + 16, RP.escama, 3.6); P.put(x + 1 + d * 2, top(x) + 16, RP.escama, 2.6); }
    for (let j = 0; j < 9; j++) P.put(47 + j * 0.5, top(47) + 3 + j * 1.6, RP.escama, 3 - j * 0.15);
    for (const x of [9, 28, 46]) P.blob(x, top(x) - 0.5, 1, 0.9, RP.osso, s + x, 3.4);   // os prendedores
  }
  seams(P);
  return P.done();
}
// o dragão de barro feito à mão pelos kobolds, num quadro Q; (ox, oy) o canto, sentado virado para a esquerda; up: as
// asas abertas para cima e a cabeça erguida rugindo
function clayDragon(P, ox, oy, s, up, sc = 1) {
  const R = RP.barro, X = v => ox + v * sc, Y = v => oy + v * sc;
  P.z = 1;
  // a asa de trás (só no up) e o rabo enrolado na frente do pé
  if (up) for (let y = 0; y < 22; y++) for (let x = 0; x < 14; x++) { if (x > y * 0.8 + 2 || x < y * 0.25) continue; P.put(X(24 + x), Y(4 + y), R, 1.8 + (x % 4 === 0 ? -0.5 : 0) + cg(x, y, s) * 0.3); }
  tube(P, bez([X(30), Y(36)], [X(38), Y(38)], [X(30), Y(43)], [X(6), Y(42)]), t => (4.6 - t * 3.2) * sc, R, s, 2.6);
  // a anca e o corpo
  P.z = 2;
  P.ell(X(25), Y(31), 9 * sc, 8 * sc, (x, y, dx, dy, d) => P.put(x, y, R, 3.2 - dx * 1 - dy * 1.1 - d * 0.5 + cg(x, y, s) * 0.4 + cn(x, y, 5, 5, s) * 0.5));
  P.ell(X(19), Y(25), 7 * sc, 10 * sc, (x, y, dx, dy, d) => P.put(x, y, R, 3.4 - dx * 1.1 - dy * 0.7 - d * 0.5 + cg(x, y, s) * 0.4 + cn(x, y, 5, 5, s + 1) * 0.5));
  // as moedas cravadas no peito em fileiras, como escamas
  for (let j = 0; j < 4; j++) for (let i = 0; i < 3 - (j > 2 ? 1 : 0); i++) { const x = X(15 + i * 3 + (j % 2) * 1.5), y = Y(22 + j * 3); P.put(x, y, RP.ouro, 4.2); P.put(x + 1, y, RP.ouro, 3); }
  // as patas da frente
  P.z = 3;
  for (const x of [15, 20]) { tube(P, lin(X(x), Y(30), X(x - 2), Y(39)), () => 3.4 * sc, R, s + x, 3); for (let i = 0; i < 3; i++) P.put(X(x - 4 + i * 1.5), Y(40), R, 3.6 - i * 0.6); }
  // a asa dobrada (ou aberta para o alto)
  P.z = up ? 4 : 4;
  if (!up) for (let y = 0; y < 18; y++) for (let x = 0; x < 11; x++) { const hy = y < 6 ? y * 1.2 : 7 - (y - 6) * 0.4; if (x > hy + 2 || (y > 6 && x > 11 - (y - 6) * 0.5)) continue; P.put(X(22 + x), Y(16 + y), R, 3.2 - x * 0.12 - y * 0.05 + (x % 4 === 0 ? -0.9 : 0) + cg(x, y, s) * 0.3); }
  else for (let y = 0; y < 24; y++) for (let x = 0; x < 13; x++) { if (x > (24 - y) * 0.55 + 1 || x < (24 - y) * 0.12) continue; P.put(X(18 + x + (24 - y) * 0.25), Y(y), R, 3.4 - x * 0.1 + (y % 5 === 0 ? -0.9 : 0) + cg(x, y, s) * 0.3); }
  // o pescoço e a cabeça
  P.z = 5;
  const nk = up ? bez([X(17), Y(18)], [X(15), Y(13)], [X(10), Y(10)], [X(8), Y(6)]) : bez([X(17), Y(18)], [X(15), Y(14)], [X(14), Y(12)], [X(12), Y(9)]);
  tube(P, nk, t => (6 - t * 2) * sc, R, s + 3, 3);
  const [hx, hy] = nk(1);
  // a crista de espinhos pelo pescoço e pelas costas, beliscada no barro
  for (let i = 1; i < 9; i++) { const t = i / 9, [x, y] = i < 6 ? nk(1 - t * 1.4) : [X(19 + (i - 5) * 3.2), Y(15 + (i - 5) * 2.6)]; const l = Math.max(1, Math.round((2.6 - Math.abs(t - 0.5) * 2) * sc)); for (let j = 1; j <= l; j++) P.put(x + 2.4 * sc + j * 0.4, y - 2.4 * sc - j + 1, R, 4 - j * 0.4); }
  P.ell(hx, hy, 5 * sc, 3.6 * sc, (x, y, dx, dy, d) => P.put(x, y, R, 3.8 - dx * 0.8 - dy * 1.2 - d * 0.5 + cg(x, y, s) * 0.3));
  P.ell(hx - 5.5 * sc, hy + (up ? -0.5 : 1) * sc, 4.6 * sc, 2.3 * sc, (x, y, dx, dy, d) => P.put(x, y, R, 3.6 - dx * 0.6 - dy * 1.2 - d * 0.4));
  if (up) { for (let x = Math.floor(hx - 9 * sc); x < hx - 1; x++) P.put(x, hy + 1 * sc, RP.sombra, 1.4); }
  else for (let x = Math.floor(hx - 9 * sc); x < hx - 1; x++) P.put(x, hy + 2 * sc, R, 1.4);
  // os chifres puxados para trás, o olho de moeda
  P.line(hx + 1, hy - 2 * sc, hx + 6 * sc, hy - 6 * sc, R, 4, 1); P.line(hx + 2, hy - 1 * sc, hx + 7 * sc, hy - 3 * sc, R, 3, 1);
  P.put(hx + 6 * sc, hy - 6 * sc, R, 4.6); P.put(hx + 7 * sc, hy - 3 * sc, R, 3.6);
  P.put(hx - 1, hy - 1, RP.ouro, 5); P.put(hx, hy - 1, RP.ouro, 3.6); P.mark('brilho', hx - 1, hy - 2);
  P.put(hx - 9 * sc, hy, RP.sombra, 1.2);   // a narina
  for (let x = Math.floor(hx - 9 * sc); x < hx - 2; x += 2) P.put(x, hy + (up ? 2 : 3) * sc, RP.osso, 4.4);   // os dentinhos de osso que o kobold enfiou
}
function clayStatue(k) {   // 44 x 58: a estátua de dragão de barro do santuário: feita à mão pelos kobolds (marcas de dedo, rachas de secar), sentada num pedestal de tijolo de taipa, moedas cravadas no peito como escamas, os olhos de moeda; no pedestal, as oferendas (moedas, um dente) e velas de sebo acesas (k 1: as asas abertas para o alto e a cabeça erguida rugindo)
  const W = 44, H = 58, P = painter(W, H), s = 27381 + k, top = 46;
  // o pedestal de tijolos de taipa
  for (let y = top; y < H; y++) for (let x = 3; x < 41; x++) {
    const row = Math.floor((y - top) / 4), off = (row % 2) * 4, lx = (x + off) % 8, ly = (y - top) % 4, joint = ly === 3 || lx === 7;
    P.put(x, y, RP.taipa, joint ? 1.4 : 2.9 + hash2((x + off) >> 3, row, s) * 0.7 + (ly === 0 ? 0.8 : 0) - (x - 3) / 38 * 0.8 + cg(x, y, s) * 0.5 + (hash2(x, y, s) < 0.05 ? 1.3 : 0));
  }
  for (let x = 2; x < 42; x++) { P.put(x, top - 1, RP.taipa, 4.2 - (x - 2) * 0.04); P.put(x, top, RP.taipa, 3.2 - (x - 2) * 0.03); }
  clayDragon(P, 3, -1, s, !!k);
  seams(P);
  // as marcas de dedo e as rachas de secar
  for (let j = 0; j < 7; j++) { const x = 10 + hash2(j, 0, s) * 24, y = 12 + hash2(j, 1, s) * 28; if (P.is(x, y, RP.barro)) for (let i = 0; i < 3; i++) { P.put(x + i, y + i * 0.4, RP.barro, P.v(x + i, y) - 0.7); P.put(x + i, y + 1 + i * 0.4, RP.barro, P.v(x + i, y) + 0.5); } }
  for (let j = 0; j < 4; j++) crack(P, 14 + hash2(j, 2, s) * 18, 22 + hash2(j, 3, s) * 16, 1.4 + hash2(j, 4, s), 6, s + j * 9);
  // as oferendas no pedestal: moedas, um dente de draco, as velas de sebo
  P.z = 8;
  for (const [x, e] of [[11, 0], [14, 1], [30, 0], [33, 0]]) coin(P, x, top - 2, s + x, !!e);
  fang(P, 24, top - 1, 29, top - 2, 2, s + 5, RP.osso, 3.6);
  tallow(P, 4, top - 2, 6, s); tallow(P, 37, top - 2, 5, s + 1); tallow(P, 33, top - 2, 3, s + 2);
  return P.done();
}
function clayIdol(k) {   // 24 x 28: a estatueta de barro: um dragãozinho de barro do tamanho de um kobold numa pedra chata, uma vela de sebo e três moedas de oferenda (k 1: com as asas abertas; a vela já no toco)
  const W = 24, H = 28, P = painter(W, H), s = 27391 + k, top = 23;
  slab(P, 1, 22, top, RP.andesito, s, 2.8);
  clayDragon(P, 3, 1.5, s, !!k, 0.5);
  seams(P);
  P.z = 8;
  tallow(P, 18, top - 1, k ? 2 : 5, s + 1);
  coin(P, 4, top - 1, s); coin(P, 7, top - 1, s + 1); coin(P, 15, top - 1, s + 2, true);
  return P.done();
}
function drum(k) {   // 26 x 26: o tambor de couro: o casco de couro escuro com as costelas de osso em pé, a pele clara esticada em cima (o meio mais gasto), o cordão em zigue-zague, três pés de osso, a baqueta de osso com a bola de couro encostada (k 1: um tambor alto e um pequeno na frente)
  const W = 26, H = 26, P = painter(W, H), s = 27401 + k;
  const one = (cx, y0, rx, y1, ss) => {
    for (let y = y0; y <= y1; y++) for (let x = Math.floor(cx - rx); x < cx + rx; x++) { const u = (x + 0.5 - cx) / rx, rib = Math.abs((((x - cx) / rx * 2.5 + 10) % 1) - 0.5) < 0.12; P.put(x, y, rib ? RP.osso : RP.couro, (rib ? 3.6 : 2.6) - u * 1.3 - u * u * 0.6 + cg(x, y, ss) * 0.4 - (y - y0) / (y1 - y0) * 0.3); }
    // o cordão em zigue-zague entre o aro de cima e o de baixo
    for (let i = 0; i < 4; i++) { const xa = cx - rx + 1 + i * (rx * 2 - 2) / 4, xb = xa + (rx * 2 - 2) / 8; P.line(xa, y0 + 2, xb, y1 - 2, RP.couro, 4.2); P.line(xb, y1 - 2, xa + (rx * 2 - 2) / 4, y0 + 2, RP.couro, 3.6); }
    for (let x = Math.floor(cx - rx); x < cx + rx; x++) { P.put(x, y0 + 1, RP.couro, 1.6); P.put(x, y1 - 1, RP.couro, 1.8); P.put(x, y1, RP.osso, 2.6 - (x - cx) / rx); }
    // a pele de cima
    P.ell(cx, y0, rx, 2.2, (x, y, dx, dy, d) => P.put(x, y, RP.casca, 4 - dx * 0.8 - dy * 0.6 - (d < 0.25 ? 0.8 : 0) + cg(x, y, ss) * 0.3));
  };
  if (!k) {
    one(12, 8, 8.5, H - 4, s);
    for (const x of [6, 12, 18]) { P.line(x, H - 4, x - (x < 12 ? 1 : x > 12 ? -1 : 0), H - 1, RP.osso, 3.2); P.put(x, H - 1, RP.osso, 4); }
    P.z = 3; bone(P, 22.5, H - 1, 24, 10, 1.4, s + 4, 3); P.blob(24, 8.5, 1.8, 1.7, RP.couro, s, 3);
  } else {
    one(9, 4, 7, H - 3, s);
    for (const x of [4, 14]) P.line(x, H - 3, x, H - 1, RP.osso, 3.2);
    P.z = 3; one(19, 14, 5, H - 2, s + 1);
    P.z = 4; bone(P, 2, H - 2, 12, H - 1, 1.4, s + 4, 3); P.blob(13, H - 1.5, 1.6, 1.5, RP.couro, s, 3);
  }
  seams(P);
  return P.done();
}
function spearRack(k) {   // 34 x 44: a pilha de lanças: a armação de dois ossos de pé e um travessão amarrados com couro, cinco lanças de haste de cana encostadas com as pontas de obsidiana em folha (vidro escuro, a aresta acesa), o escudo redondo de escamas encostado no pé (k 1: as lanças amontoadas no chão e duas encostadas)
  const W = 34, H = 44, P = painter(W, H), s = 27421 + k;
  const spear = (x0, y0, x1, y1, ss) => {   // (x0, y0) o pé, (x1, y1) a ponta
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
    P.line(x0, y0, x1 - ux * 6, y1 - uy * 6, RP.vime, t => 3.4 + (Math.round(t * l) % 6 === 0 ? -1.2 : 0) + hash2(Math.round(t * l), 0, ss) * 0.4);
    for (let j = 0; j < 3; j++) P.put(x1 - ux * (6 + j), y1 - uy * (6 + j), RP.couro, 3.4 - j * 0.4);   // a amarração
    for (let j = 0; j < 7; j++) { const w = j < 2 ? 0.5 : j < 5 ? 1 : 0.5, cx = x1 - ux * (6 - j), cy = y1 - uy * (6 - j); for (let o = -w; o <= w; o += 0.5) P.put(cx - uy * o, cy + ux * o, RP.obsidiana, o < 0 ? 4.6 - j * 0.1 : 2 + j * 0.05); }
    P.put(x1, y1, RP.obsidiana, 5);
  };
  if (!k) {
    P.z = 1;
    bone(P, 4, H - 1, 4, 16, 2.6, s, 2.6); bone(P, 29, H - 1, 29, 16, 2.6, s + 1, 2.4);
    P.z = 2; bone(P, 2, 18, 31, 18, 2.2, s + 2, 3);
    for (const x of [4, 29]) for (let j = -1; j <= 1; j++) cord(P, x - 2, 17 + j, x + 2, 19 + j, s + j);
    P.z = 3;
    for (const [x0, x1, y1] of [[7, 10, 1], [11, 15, 3], [16, 18, 0], [20, 23, 4], [25, 26, 2]]) spear(x0, H - 1, x1, y1, s + x0);
    P.z = 4;
    P.ell(11, H - 8.5, 7, 7.5, (x, y, dx, dy, d) => P.put(x, y, RP.escama, 2.5 + scaleV(x, y, 3) * 0.9 - dx * 0.9 - dy * 0.7 + (d > 0.8 ? -0.9 : 0) + cg(x, y, s) * 0.3));
    P.blob(11, H - 8.5, 2, 2, RP.osso, s + 7, 3.4);
  } else {
    P.z = 1;
    for (const [x0, y0, x1, y1] of [[1, H - 3, 33, H - 6], [2, H - 1, 32, H - 2], [3, H - 6, 30, H - 4]]) spear(x0, y0, x1, y1, s + y0);
    P.z = 2;
    for (const [x0, x1, y1] of [[6, 11, 6], [24, 21, 2]]) spear(x0, H - 1, x1, y1, s + x0);
    P.z = 3; bone(P, 14, H - 1, 18, H - 9, 2, s + 9, 2.6); P.blob(18.5, H - 10, 2.4, 2, RP.osso, s, 3);   // a lança quebrada que virou porrete
  }
  seams(P);
  return P.done();
}
function rabbitCage(k) {   // 22 x 40: a jaula de vime pendurada com um coelho-de-gruta (branco, de olho vermelho, as orelhas compridas): o cordão do teto, a argola, a cúpula e as varas (as de trás escuras, as da frente claras), três aros trançados, o fundo (k 1: o coelho deitado, as orelhas caídas, um pouco de musgo seco no fundo)
  const W = 22, H = 40, P = painter(W, H), s = 27441 + k, R = RP.vime, cx = 11, y0 = 10, y1 = 37;
  cord(P, cx, 0, cx, 6, s); P.ell(cx, 7.5, 1.6, 1.6, (x, y, dx, dy, d) => { if (d > 0.35) P.put(x, y, R, 3.6 - dx - dy); });
  const hw = y => y < y0 + 6 ? 8.5 * Math.sqrt(Math.max(0, 1 - Math.pow((y0 + 6 - y) / 7, 2))) + 0.6 : 8.5 + (y - y0 - 6) * 0.03;
  const bars = [-1, -0.62, -0.22, 0.22, 0.62, 1];
  // as varas de trás e o fundo
  P.z = 1;
  for (let y = y0; y <= y1; y++) for (const b of bars) P.put(cx + b * hw(y) * 0.6 - 0.5, y, R, 1.4);
  for (let x = Math.floor(cx - 8.5); x < cx + 8.5; x++) { P.put(x, y1, R, 2.6 + (x % 2 ? 0.6 : 0)); P.put(x, y1 + 1, R, 1.8); }
  // o coelho
  P.z = 2;
  if (!k) {
    P.ell(12.5, 32.5, 4.6, 3.6, (x, y, dx, dy, d) => P.put(x, y, RP.pelo, 4 - dx * 0.9 - dy * 1.1 - d * 0.5 + cg(x, y, s) * 0.3));
    P.ell(8.5, 29.5, 2.6, 2.3, (x, y, dx, dy, d) => P.put(x, y, RP.pelo, 4.4 - dx * 0.7 - dy * 1 - d * 0.4));
    for (let j = 0; j < 6; j++) { P.put(8 - j * 0.15, 27 - j, RP.pelo, 4.4); P.put(9 + j * 0.3, 27 - j, RP.pelo, 3.6); if (j > 1 && j < 5) P.put(8.6, 27 - j, RP.carne, 4.6); }
    P.put(7, 29, RP.rubi, 4.6); P.put(6, 30, RP.carne, 4.4);
    P.put(16, 31, RP.pelo, 5); P.put(17, 32, RP.pelo, 4.4);   // o rabinho
    P.put(10, 35, RP.pelo, 3.4); P.put(13, 35, RP.pelo, 3);
  } else {
    for (let x = 4; x < 18; x += 2) P.put(x, y1 - 1, RP.olivina, 2.2 + hash2(x, 0, s));
    P.ell(12, 34, 5.5, 2.6, (x, y, dx, dy, d) => P.put(x, y, RP.pelo, 4 - dx * 0.8 - dy * 1.2 - d * 0.5 + cg(x, y, s) * 0.3));
    P.ell(6.5, 34.5, 2.4, 2, (x, y, dx, dy, d) => P.put(x, y, RP.pelo, 4.4 - dx * 0.7 - dy));
    for (let j = 0; j < 6; j++) { P.put(8 + j, 32.5 + j * 0.15, RP.pelo, 4.2 - j * 0.1); if (j > 0 && j < 5) P.put(8 + j, 33.5 + j * 0.15, RP.carne, 4); }
    P.put(5, 34, RP.rubi, 4.2);
  }
  // as varas da frente, a cúpula e os aros
  P.z = 3;
  for (let y = y0 - 2; y <= y1; y++) for (const b of bars) { const x = cx + b * hw(y) - 0.5; if (y < y0 + 6 && Math.abs(b) === 1 && hw(y) < 2) continue; P.put(x, y, R, 3.8 - b * 0.9 + (y % 3 === 0 ? 0.4 : 0)); }
  for (const yr of [y0 + 2, y0 + 15, y1 - 1]) for (let x = Math.floor(cx - hw(yr)); x < cx + hw(yr); x++) { P.put(x, yr, R, (x % 2 ? 4.4 : 3.4) - (x - cx + 9) * 0.06); P.put(x, yr + 1, R, (x % 2 ? 2.4 : 3) - (x - cx + 9) * 0.04); }
  seams(P, 0.8);
  return P.done();
}
function koboldMap(k) {   // 48 x 32: o mapa kobold riscado na parede: um pedaço de rocha alisado, as galerias riscadas com garra (o sulco escuro, o lábio de baixo claro), as tocas em rodinha, um X de carvão onde tem ouro, a cabeça de dragão pintada com ocre, risquinhos de contagem e uma mão de três dedos em ocre (k 1: riscado a carvão num couro esticado com quatro cravos de osso)
  const W = 48, H = 32, P = painter(W, H), s = 27461 + k;
  if (!k) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (x + 0.5 - 24) / 23, dy = (y + 0.5 - 16) / 15, d = Math.pow(Math.abs(dx), 2.6) + Math.pow(Math.abs(dy), 2.6) + cn(x, y, 6, 6, s) * 0.5 - 0.25; if (d > 1) continue; P.put(x, y, RP.andesito, 3.3 - x / W * 0.7 + (d > 0.82 ? -0.8 : 0) + cg(x, y, s) * 0.35 + (hash2(x, y, s) < 0.03 ? -1 : 0)); }
  } else {
    for (let y = 2; y < H - 1; y++) for (let x = 2; x < W - 2; x++) { const e = Math.min(x - 2, W - 3 - x, y - 2, H - 2 - y), rag = cn(x, y, 3, 3, s) * 2.2; if (e + rag < 0.6) continue; P.put(x, y, RP.couro, 3.4 - x / W * 0.7 - (e < 2 ? 0.7 : 0) + Math.sin(x * 0.4 + y * 0.2) * 0.3 + cg(x, y, s) * 0.4); }
    for (const [x, y] of [[4, 4], [W - 5, 4], [4, H - 4], [W - 5, H - 4]]) { P.blob(x, y, 1.4, 1.4, RP.osso, s + x, 3.4); }
  }
  const R0 = k ? RP.couro : RP.andesito;
  const scratch = (x0, y0, x1, y1) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n + Math.sin(i * 0.9) * 0.3, y = y0 + (y1 - y0) * i / n; if (k) P.put(x, y, RP.carvao, 1.4); else { P.put(x, y, R0, 1.1); P.put(x, y + 1, R0, 4.4); } } };
  const nodes = [[8, 8], [20, 6], [34, 9], [41, 19], [26, 17], [12, 22], [31, 26]], edges = [[0, 1], [1, 2], [2, 3], [1, 4], [4, 3], [4, 5], [5, 0], [4, 6]];
  for (const [a, b] of edges) { const [x0, y0] = nodes[a], [x1, y1] = nodes[b]; scratch(x0, y0, (x0 + x1) / 2 + (hash2(a, b, s) - 0.5) * 4, (y0 + y1) / 2 + (hash2(b, a, s) - 0.5) * 3); scratch((x0 + x1) / 2 + (hash2(a, b, s) - 0.5) * 4, (y0 + y1) / 2 + (hash2(b, a, s) - 0.5) * 3, x1, y1); }
  for (const [x, y] of nodes) for (let a = 0; a < 12; a++) { const xx = x + Math.cos(a / 12 * Math.PI * 2) * 2.2, yy = y + Math.sin(a / 12 * Math.PI * 2) * 1.8; if (k) P.put(xx, yy, RP.carvao, 1.6); else P.put(xx, yy, R0, a > 6 ? 4.4 : 1.2); }
  // o X de carvão no tesouro, com moedinhas riscadas
  for (let i = -2; i <= 2; i++) { P.put(34 + i, 9 + i, RP.carvao, 1.4); P.put(34 + i, 9 - i, RP.carvao, 1.4); }
  for (const [x, y] of [[37, 12], [39, 11]]) { P.put(x, y, RP.ferrugem, 4); P.put(x + 1, y, RP.ferrugem, 3.4); }
  // a cabeça de dragão em ocre (um triângulo de ponta para baixo, os chifres, os dois olhos)
  const hx = 38, hy = 24;
  for (let j = 0; j < 6; j++) { P.put(hx - 4 + j * 0.7, hy - 2 + j, RP.ferrugem, 4); P.put(hx + 4 - j * 0.7, hy - 2 + j, RP.ferrugem, 3.6); }
  for (let x = hx - 4; x <= hx + 4; x++) P.put(x, hy - 2, RP.ferrugem, 3.8);
  P.line(hx - 3, hy - 3, hx - 5, hy - 7, RP.ferrugem, 4); P.line(hx + 3, hy - 3, hx + 5, hy - 7, RP.ferrugem, 3.6);
  P.put(hx - 2, hy, RP.ferrugem, 4.6); P.put(hx + 2, hy, RP.ferrugem, 4.6);
  // os risquinhos de contagem
  for (let i = 0; i < 4; i++) scratch(3 + i * 1.5, 13, 3 + i * 1.5, 17); scratch(2, 16, 9, 14);
  // a mão de três dedos em ocre
  P.blob(7, 27.5, 2.2, 1.8, RP.ferrugem, s, 2.6);
  for (const [dx, dy] of [[-2.5, -3], [0, -3.8], [2.5, -3]]) P.line(7 + dx * 0.4, 27 + dy * 0.3, 7 + dx, 27 + dy, RP.ferrugem, 3.2);
  return P.done();
}
function denDoor(k) {   // 38 x 44: a porta de toca de ossos: o buraco redondo e escuro na parede, o colar de taipa com escamas prensadas, dois fêmures de pé dos lados, duas costelas em arco por cima, um crânio de draco com chifres no alto, a cortina de couro enrolada de um lado e amuletos de dentes pendurados (k 1: o arco é uma mandíbula de draco com os dentes, duas velas de sebo no pé)
  const W = 38, H = 44, P = painter(W, H), s = 27481 + k, cx = 19, cy = 28, rx = 10, ry = 15;
  // o colar de taipa e o buraco
  P.ell(cx, cy, rx + 3.5, ry + 3, (x, y, dx, dy, d) => { if (y >= H) return; P.put(x, y, RP.taipa, 3.2 - dx * 0.9 - dy * 0.6 + cg(x, y, s) * 0.5 + (hash2(x, y, s) < 0.06 ? 1.2 : 0)); if (hash2(x, y, s + 1) < 0.05) P.put(x, y, RP.escama, 3.6); });
  P.ell(cx, cy, rx, ry, (x, y, dx, dy, d) => { if (y >= H) return; P.put(x, y, RP.sombra, d > 0.82 ? (dx > 0 ? 3.2 : 1.6) - dy : Math.max(0, 1.6 - (1 - d) * 2.2)); });
  // lá dentro, no fundo da toca, a luz de uma fogueira que não se vê
  for (let y = H - 7; y < H; y++) for (let x = cx - 4; x < cx + 4; x++) { const q = Math.hypot((x + 0.5 - cx) / 4, (H - y) / 7); if (q < 1 && hash2(x, y, s) < (1 - q) * 0.8) P.N(x, y, q < 0.35 && hash2(x, y, s + 1) < 0.4 ? MG.fundo : MG.brasa); }
  if (!k) {
    // os fêmures, as costelas em arco, o crânio de draco
    P.z = 2;
    bone(P, 6.5, H - 1, 6.5, 17, 3, s, 2.8); bone(P, 31.5, H - 1, 31.5, 17, 3, s + 1, 2.6);
    P.z = 3;
    for (let j = 0; j < 2; j++) sweep(P, bez([7 + j * 2, 18 + j], [9 + j, 5 + j * 2], [29 - j, 5 + j * 2], [31 - j * 2, 18 + j]), () => 2.4 - j * 0.4, RP.osso, s + j, null, { base: 2.8 - j * 0.6 });
    P.z = 4;
    P.ell(cx, 7, 4.6, 3.6, (x, y, dx, dy, d) => P.put(x, y, RP.osso, 3.8 - dx * 0.9 - dy * 1.1 - d * 0.5 + cg(x, y, s) * 0.3));
    P.ell(cx, 10.5, 2.6, 2.2, (x, y, dx, dy, d) => P.put(x, y, RP.osso, 3.4 - dx * 0.8 - dy * 0.8));
    for (const sd of [-1, 1]) { P.put(cx + sd * 2 - (sd > 0 ? 1 : 0), 7, RP.sombra, 0.8); P.put(cx + sd * 2 - (sd > 0 ? 1 : 0), 8, RP.sombra, 1.4); P.line(cx + sd * 3.5, 5, cx + sd * 8, 1, RP.osso, sd < 0 ? 4.2 : 3); P.line(cx + sd * 3, 5.5, cx + sd * 7, 1.5, RP.osso, sd < 0 ? 3.4 : 2.4); }
    P.put(cx - 1, 12, RP.osso, 4.4); P.put(cx + 1, 12, RP.osso, 3.6);
    // a cortina de couro enrolada no alto à esquerda, caindo pela beira
    P.z = 5;
    for (let x = 10; x < 18; x++) { const l = 12 + Math.round(cn(x, 0, 2, 2, s) * 4); for (let y = 15; y < 15 + l; y++) { if (P.rampAt(x, y) !== RP.sombra && !(y > 15 && P.rampAt(x, y - 1) === RP.couro)) continue; P.put(x, y, RP.couro, 2.8 - (x - 10) * 0.12 + Math.sin(x * 1.3) * 0.5 + cg(x, y, s) * 0.3 - (y === 15 + l - 1 ? 0.8 : 0)); } }
    for (let x = 9; x < 19; x++) { P.put(x, 14, RP.couro, 4.2); P.put(x, 15, RP.couro, 3); }
    // os amuletos de dentes
    for (const x of [12, 26]) { cord(P, x, 14, x, 19, s + x); fang(P, x, 19, x + 0.5, 23, 1.8, s + x, RP.osso, 3.8); }
  } else {
    // a mandíbula de draco em arco por cima do buraco, os dentes para dentro
    P.z = 3;
    const arc = bez([5, H - 1], [3, 6], [35, 6], [33, H - 1]);
    sweep(P, arc, t => 4.4 - Math.sin(t * Math.PI) * 1.4, RP.osso, s, (a, q) => (Math.abs(((a / 3.2) % 1) - 0.5) < 0.1 ? -0.6 : 0), { base: 2.8 });
    for (let i = 3; i < 18; i++) { const t = i / 20, [x, y] = arc(t), [x2, y2] = arc(t + 0.01), l = Math.hypot(x2 - x, y2 - y) || 1, nx = (y2 - y) / l, ny = -(x2 - x) / l; if (i % 2) fang(P, x - nx * 2, y - ny * 2, x - nx * 5, y - ny * 5, 1.6, s + i, RP.osso, 3.8); }
    P.z = 6; tallow(P, 1, H - 1, 6, s); tallow(P, 34, H - 1, 4, s + 1);
  }
  seams(P);
  for (let j = 0; j < 3; j++) crack(P, 6 + j * 13, 16 + hash2(j, 0, s) * 20, 1.6, 5, s + j * 7, null, 1);
  return P.done();
}

/* =============================== OS TUBOS DE LAVA =============================== */
// um ovo de draco de pé: a casca de couro em escamas miúdas (luz de cima à esquerda), as rachas de magma acesas;
// (cx, by) o meio do pé, rx e ry os raios; marca o miolo
function drakeEgg(P, cx, by, rx, ry, s, ang = 0) {
  const Q = painter(Math.ceil(rx * 2 + 2), Math.ceil(ry * 2 + 2)), qx = rx + 1, qy = ry + 1;
  Q.ell(qx, qy, rx, ry, (x, y, dx, dy, d) => {
    const w = dy < 0 ? 1 + dy * 0.18 : 1; if (Math.abs(dx) > w) return;   // mais fino em cima
    Q.put(x, y, RP.escama, 3.3 - dx * 1.4 - dy * 0.9 - d * 0.6 + scaleV(x, y, 3) * 0.55 + cg(x, y, s) * 0.3 + (dx < -0.3 && dx > -0.65 && dy < -0.2 && dy > -0.6 ? 0.9 : 0));
  });
  // as rachas acesas: descem do alto tortas, o miolo claro só no meio
  for (let j = 0; j < 2; j++) crack(Q, qx + (j ? 0.4 : -0.3) * rx, qy - ry * (j ? 0.3 : 0.7), 1.4 + (j ? -0.5 : 0.3), ry * (j ? 0.6 : 0.9), s + j * 5, (t, x, y) => { const e = Math.hypot((x - qx) / rx, (y - qy) / ry); return e > 0.85 ? MG.fundo : t < 0.15 || t > 0.85 ? MG.laranja : hash2(Math.floor(x), Math.floor(y), s) < 0.3 ? MG.claro : MG.ambar; });
  Q.mark('ovo', qx, qy, { r: Math.round(Math.max(rx, ry) * 1.4) });
  blit(P, Q, cx - qx, by - Q.h + 1, ang, qx, Q.h - 1);
}
function drakeEggProp(k) {   // 26 x 30: o ovo de draco grande num ninho de cinza morna: a casca cor de cobre em escamas miúdas, as rachas de magma pulsando, escamas e lasquinhas de osso em volta, pedras aquecidas (k 1: dois ovos, um grande inclinado e um pequeno, e meia casca vazia)
  const W = 26, H = 30, P = painter(W, H), s = 27501 + k;
  // o ninho de cinza: um morrinho baixo com a beira mais clara
  for (let x = 0; x < W; x++) { const t = (x + 0.5) / W, hh = 3.4 * Math.sin(t * Math.PI) + (t < 0.2 || t > 0.8 ? 1 : 0); for (let y = Math.round(H - 1 - hh); y < H; y++) P.put(x, y, RP.cinza, 2.6 + (y === Math.round(H - 1 - hh) ? 1.2 : 0) - t * 0.7 + cg(x, y, s) * 0.6); }
  P.z = 2;
  if (!k) drakeEgg(P, 13, H - 3, 8, 11.5, s);
  else { drakeEgg(P, 10, H - 3, 7, 10, s, -0.12); P.z = 3; drakeEgg(P, 20, H - 2, 4.4, 6, s + 1); }
  // escamas e lasquinhas de osso caídas na cinza, pedras quentes
  P.z = 4;
  for (const [x, y] of k ? [[2, H - 2], [24, H - 3]] : [[3, H - 2], [21, H - 2], [24, H - 3]]) { P.put(x, y, RP.escama, 4.2); P.put(x + 1, y, RP.escama, 3); P.put(x, y + 1, RP.escama, 2.4); }
  for (const x of [6, 18]) P.blob(x, H - 1.2, 2, 1.4, RP.lavaC, s + x, 2.6);
  P.put(5, H - 2, RP.lavaC, 1); P.N(18, H - 1, MG.brasa);
  if (k) { P.ell(23, H - 2, 3, 2.4, (x, y, dx, dy) => { if (dy < -0.1) return; P.put(x, y, dy < 0.4 && Math.abs(dx) < 0.7 ? RP.casca : RP.escama, dy < 0.4 && Math.abs(dx) < 0.7 ? 3 - dx : 3.2 - dx * 1.2); }); }
  seams(P);
  return P.done();
}
function shellNest(k) {   // 44 x 16: o ninho de cascas e escamas: um morrinho de cinza com cascas de ovo partidas (o lado de fora cor de cobre, o de dentro claro), escamas soltas, ossinhos e o crânio de um filhote (k 1: mais espalhado, com uma casca quase inteira de boca para cima)
  const W = 44, H = 16, P = painter(W, H), s = 27521 + k;
  for (let x = 0; x < W; x++) { const t = (x + 0.5) / W, hh = 4 * Math.pow(Math.sin(t * Math.PI), 0.7) + cn(x, 0, 6, 6, s) * 2; for (let y = Math.round(H - 1 - hh); y < H; y++) P.put(x, y, RP.cinza, 2.4 + (y === Math.round(H - 1 - hh) ? 1.1 : 0) - t * 0.6 + cg(x, y, s) * 0.6); }
  // uma meia casca: a concha de fora cor de cobre, a parte de dentro clara; ang gira, r o raio
  const half = (cx, by, r, ang, z) => { P.z = z; const Q = painter(Math.ceil(r * 2 + 2), Math.ceil(r + 3)); Q.ell(r + 1, 1, r, r + 1, (x, y, dx, dy, d) => { if (y < 1) return; const inn = d < 0.62 && dy < 0.72; Q.put(x, y, inn ? RP.casca : RP.escama, inn ? 3.6 - dy * 1.6 + dx * 0.4 : 3.2 - dx * 1.2 - dy * 0.6 + scaleV(x, y, 3) * 0.4); }); for (let x = 0; x < Q.w; x++) if (Q.has(x, 1) && hash2(x, 3, s + z) < 0.5) Q.clear(x, 1); blit(P, Q, cx - r - 1, by - r - 2, ang, r + 1, r + 2); };
  const parts = k ? [[9, H - 3, 5, 0, 1], [24, H - 2, 3.4, 2.4, 2], [35, H - 3, 4, 0.6, 3]] : [[8, H - 4, 4.2, 0.3, 1], [17, H - 2, 3.4, 2.7, 2], [28, H - 4, 4.6, -0.4, 3], [37, H - 2, 3, 2.9, 4]];
  for (const [x, y, r, a, z] of parts) half(x, y, r, a, z);
  // escamas soltas, os ossinhos, o crânio do filhote
  P.z = 6;
  for (let j = 0; j < 9; j++) { const x = 2 + hash2(j, 0, s) * (W - 4), y = H - 2 - hash2(j, 1, s) * 3; if (!P.has(x, y + 1)) continue; P.put(x, y, RP.escama, 4.4); P.put(x + 1, y, RP.escama, 3.2); }
  bone(P, 13, H - 2, 19, H - 3, 1.2, s + 1, 3.2); bone(P, 31, H - 1, 35, H - 2, 1.1, s + 2, 3);
  if (!k) { P.ell(22, H - 4, 2.6, 2, (x, y, dx, dy, d) => P.put(x, y, RP.osso, 4 - dx - dy * 0.8)); P.ell(19.6, H - 3.4, 1.6, 1.1, (x, y, dx) => P.put(x, y, RP.osso, 3.4 - dx)); P.put(21, H - 5, RP.sombra, 1); P.put(18, H - 3, RP.osso, 4.6); }
  seams(P);
  return P.done();
}
function serpentSkin(k) {   // 68 x 28: a casca de serpe trocada: a pele seca e clara, fina como papel, em S, as escamas em losango marcadas, rasgada aqui e ali (dá para ver a parede pelos furos), a casca da cabeça com os buracos dos olhos, um pedaço da asa-braço caindo, presa em dois tocos (k 1: dobrada em laço, mais rasgada, sem a asa)
  const W = 68, H = 28, P = painter(W, H), s = 27541 + k, R = RP.casca;
  const path = k ? bez([6, 9], [40, 30], [62, -8], [24, 16]) : bez([7, 10], [22, 26], [44, -4], [64, 17]);
  const wd = t => t < 0.12 ? 6 + t / 0.12 * 3 : Math.max(1.2, 9 * (1 - (t - 0.12) * 0.95));
  P.z = 1;
  if (!k) {   // a asa-braço: um triângulo de membrana com os dedos, pendurado do ombro
    const [ax, ay] = path(0.2);
    for (let j = 0; j < 14; j++) for (let i = -Math.floor(j * 0.6); i <= Math.floor(j * 0.5); i++) { const x = ax + i + j * 0.3, y = ay + 3 + j; if (y >= H || cn(x, y, 3, 3, s) > 0.78) continue; P.put(x, y, R, 2.4 + (i % 4 === 0 ? 1 : 0) - j * 0.05 + cg(x, y, s) * 0.3); }
  }
  P.z = 2;
  sweep(P, path, wd, R, s, (a, q, X, Y) => {
    if (Math.abs(q) > 0.25 && cn(X, Y, 4, 4, s + 3) > (k ? 0.7 : 0.76)) return null;   // os furos
    const g1 = ((a * 0.55 + q * 2.2) % 2 + 2) % 2, g2 = ((a * 0.55 - q * 2.2) % 2 + 2) % 2;
    return (g1 < 0.45 || g2 < 0.45 ? -0.9 : 0.25) + (Math.abs(q) > 0.85 ? -0.5 : 0);
  }, { base: 2.8 });
  // a casca da cabeça: o focinho, os buracos dos olhos, a boca
  P.z = 3;
  const [hx, hy] = path(0);
  P.ell(hx - 1, hy, 5.5, 4, (x, y, dx, dy, d) => P.put(x, y, R, 3.6 - dx * 0.6 - dy * 1.1 - d * 0.5 + cg(x, y, s) * 0.3));
  P.clear(hx - 2, hy - 1); P.clear(hx - 1, hy - 1); P.put(hx - 2, hy, R, 1.4);
  for (let x = hx - 6; x < hx + 1; x++) P.put(x, hy + 2, R, 1.6);
  // os dois tocos de pedra que seguram a casca
  P.z = 4;
  for (const t of k ? [0.3, 0.7] : [0.35, 0.72]) { const [x, y] = path(t); P.blob(x, y - wd(t) / 2 - 0.5, 1.6, 1.3, RP.lavaC, s + t * 10, 3); }
  seams(P, 0.8);
  return P.done();
}
function lavaBubble(k) {   // 40 x 26: a bolha de lava esfriada partida: o domo de lava cordada em dobras de festão, a frente quebrada mostrando o oco de vidro escuro, o lábio da quebra em camadas, no fundo do oco umas brasas ainda mornas, cacos da casca no chão (k 1: menor e mais alta, quebrada no alto)
  const W = 40, H = 26, P = painter(W, H), s = 27561 + k, R = RP.lavaC, cx = 20;
  const rx = k ? 14 : 18.5, ry = k ? 22 : 19;
  const hole = k ? (x, y) => Math.hypot((x + 0.5 - 22) / 6, (y + 0.5 - 8) / 5) + cn(x, y, 3, 3, s) * 0.5 < 1.1
    : (x, y) => Math.hypot((x + 0.5 - 23) / 8.5, (y + 0.5 - 17) / 7) + cn(x, y, 3, 3, s) * 0.5 < 1.1;
  P.ell(cx, H, rx, ry, (x, y, dx, dy, d) => {
    if (y >= H) return;
    if (hole(x, y)) {
      // o oco: vidro escuro com um reflexo, mais fundo no meio; brasas mornas no fundo
      const hd = k ? Math.hypot((x + 0.5 - 22) / 6, (y + 0.5 - 8) / 5) : Math.hypot((x + 0.5 - 23) / 8.5, (y + 0.5 - 17) / 7);
      P.put(x, y, RP.obsidiana, 0.6 + hd * 1.4 + (Math.abs(x - y * 0.4 - 12) < 0.8 ? 1.6 : 0));
      if (!k && y > H - 5 && hash2(x, y, s) < 0.35) P.N(x, y, hash2(x, y, s + 1) < 0.3 ? MG.laranja : hash2(x, y, s + 2) < 0.5 ? MG.fundo : MG.brasa);
      if (k && y > 9 && hash2(x, y, s) < 0.3) P.N(x, y, hash2(x, y, s + 1) < 0.5 ? MG.fundo : MG.brasa);
      return;
    }
    const f = ropy(x, y, cx, s);
    P.put(x, y, R, 2.9 - dx * 1.1 - dy * 0.9 - d * 0.5 + f * 0.75 + (f > 0.92 ? 0.6 : 0) + cg(x, y, s) * 0.35);
  });
  // o lábio da quebra: a casca grossa em camadas, clara na beira de cima
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!P.has(x, y) || hole(x, y) || P.isN(x, y)) continue;
    const nb = hole(x - 1, y) || hole(x + 1, y) || hole(x, y - 1) || hole(x, y + 1), nb2 = hole(x - 2, y) || hole(x + 2, y) || hole(x, y + 2);
    if (nb) P.put(x, y, R, hole(x, y + 1) ? 4.6 : 3.8); else if (nb2) P.put(x, y, RP.obsidiana, hole(x, y + 2) ? 3.2 : 2.2);
  }
  // umas dobras ainda mornas perto da quebra
  for (let j = 0; j < 5; j++) { const x = Math.floor((k ? 15 : 13) + hash2(j, 0, s) * 18), y = Math.floor((k ? 10 : 12) + hash2(j, 1, s) * 10); if (P.is(x, y, R) && !hole(x, y)) P.N(x, y, MG.brasa); }
  // os cacos da casca no chão
  P.z = 3;
  for (const [x, w2] of k ? [[4, 3], [34, 4]] : [[3, 3], [30, 4], [36, 2]]) for (let i = 0; i < w2; i++) { P.put(x + i, H - 1, R, 3.6 - i * 0.4); if (i < w2 - 1) P.put(x + i, H - 2, R, 4.2 - i * 0.6); }
  seams(P);
  return P.done();
}
function bigStalactite(k) {   // 24 x 46: a estalactite de lava grande: o cone de lava cordada pendurado do teto, os anéis de escorrido, as estrias de cima a baixo, a ponta de vidro de obsidiana e a gota de lava se formando nela (ao vivo: incha e cai) (k 1: três pontas, a do meio maior)
  const W = 24, H = 46, P = painter(W, H), s = 27581 + k, R = RP.lavaC;
  const cone = (cx, len, r0, z, ss) => {
    P.z = z;
    for (let y = 0; y < len; y++) {
      const t = y / len, ring = (y % 6) < 2 && t < 0.85, hw = r0 * Math.pow(1 - t, 0.85) + (ring ? 0.9 : 0) + 0.4, c = cx + Math.sin(y * 0.25 + ss) * 0.8 * (1 - t);
      for (let x = Math.floor(c - hw); x < c + hw; x++) {
        const u = (x + 0.5 - c) / hw, glass = t > 0.68;
        P.put(x, y, glass ? RP.obsidiana : R, (glass ? 2.6 : 2.8) - u * 1.3 - u * u * 0.5 + (ring ? 0.8 : 0) + (glass && Math.abs(u + 0.4) < 0.18 ? 2 : 0) + (Math.abs(((x - c) * 0.9 + 10) % 2.2 - 1.1) < 0.35 ? -0.7 : 0) + cg(x, y, ss) * 0.35 - t * 0.3);
      }
    }
    P.mark('gota', cx, len, { r: z });
  };
  if (!k) cone(12, 41, 10.5, 1, s);
  else { cone(5, 22, 4.6, 1, s + 1); cone(19, 27, 5, 1, s + 2); cone(12, 41, 7.5, 2, s); }
  // a gota de lava na ponta do maior (a assada é pequena; o ao vivo incha por cima)
  const G = P.pts.gota[P.pts.gota.length - 1]; P.N(G.x, G.y - 1, MG.ambar); P.N(G.x, G.y, MG.claro);
  seams(P);
  return P.done();
}
function frozenFlow(k) {   // 46 x 62: o fluxo de lava parado no meio da descida: a língua de lava cordada saindo de uma racha no alto da parede, engrossando para baixo em dobras de festão, os dedos espalhados no chão; nas rachas da crosta o magma ainda brilha fraco, mais no pé (k 1: a língua desce torta e se divide em duas)
  const W = 46, H = 62, P = painter(W, H), s = 27601 + k, R = RP.lavaC;
  const tongues = k ? [[t => 18 + Math.sin(t * 3) * 6 - t * 6, 0], [t => 18 + Math.sin(t * 3) * 6 + Math.max(0, t - 0.45) * 30, 1]] : [[t => 22 + Math.sin(t * 4 + 1) * 4, 0]];
  const hwOf = (y, b) => (2.6 + y * 0.18) * (b ? 0.75 : 1) + (y > H - 12 ? (y - H + 12) * 0.9 : 0);
  const inT = (x, y) => tongues.some(([cf, b]) => (!b || y > H * 0.45) && Math.abs(x + 0.5 - cf(y / H)) < hwOf(y, b) + cn(x, y, 5, 5, s) * 1.6);
  const lobes = k ? [[9, H - 4, 8, 4], [24, H - 3, 7, 3.5], [36, H - 4, 8, 4]] : [[10, H - 4, 9, 4.5], [24, H - 3, 8, 3.6], [37, H - 4, 8, 4.2]];
  const inL = (x, y) => lobes.some(([lx, ly, rx, ry]) => Math.hypot((x + 0.5 - lx) / rx, (y + 0.5 - ly) / ry) < 1);
  for (let y = 2; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inT(x, y) && !inL(x, y)) continue;
    const [cf] = tongues[0], xc = cf(y / H), f = ropy(x, H - y, xc, s, -0.06);
    const edge = !inT(x - 1, y) && !inL(x - 1, y) ? 0.9 : !inT(x + 1, y) && !inL(x + 1, y) ? -0.9 : 0;
    P.put(x, y, R, 2.7 + f * 0.8 + (f > 0.9 ? 0.6 : 0) + edge - (x - xc) * 0.03 + cg(x, y, s) * 0.35);
  }
  // a racha de onde saiu, no alto
  for (let x = 18; x < 27; x++) { const y = 2 + Math.round(Math.sin(x * 0.9) * 0.6); P.put(x, y - 1, RP.sombra, 2); P.put(x, y, RP.sombra, 1); if (x > 19 && x < 25) P.N(x, y, hash2(x, 0, s) < 0.5 ? MG.fundo : MG.brasa); }
  // as rachas da crosta com o magma morno: mais quentes embaixo
  for (let j = 0; j < 7; j++) { const y0 = 8 + hash2(j, 0, s) * (H - 16), [cf] = tongues[0]; crack(P, cf(y0 / H) + (hash2(j, 1, s) - 0.5) * 4, y0, 1.3 + (hash2(j, 2, s) - 0.5) * 1.2, 5 + y0 / H * 9, s + j * 13, (t, x, y) => y > H - 10 && hash2(Math.floor(x), Math.floor(y), s) < 0.4 ? MG.laranja : y > H * 0.5 ? MG.fundo : MG.brasa); }
  // as dobras de crista acesas no pé
  for (let y = H - 9; y < H; y++) for (let x = 0; x < W; x++) if (P.is(x, y, R) && P.v(x, y) > 3.8 && hash2(x, y, s + 4) < 0.25) P.N(x, y, MG.dobra);
  return P.done();
}

/* =============================== O LEITO DE OURO =============================== */
function dragonSkull(k) {   // 36 x 24: o crânio de dragão antigo (o pequeno): de perfil para a esquerda, o focinho comprido, a narina, a órbita funda, os dois chifres varridos para trás, a fileira de dentes, a mandíbula; afundado até o queixo num montinho de moedas (k 1: sem a mandíbula, uma moeda presa na órbita, apoiado em ouro endurecido)
  const W = 36, H = 24, P = painter(W, H), s = 27621 + k, R = RP.osso;
  // os chifres atrás
  P.z = 1;
  sweep(P, bez([25, 7], [30, 3], [33, 2], [35, 5]), t => 3.2 - t * 2.4, R, s, (a) => (Math.round(a) % 3 === 0 ? -0.6 : 0), { base: 2.4 });
  P.z = 2;
  sweep(P, bez([24, 5], [28, 0], [33, 0], [35, 1]), t => 3.6 - t * 2.8, R, s + 1, (a) => (Math.round(a) % 3 === 0 ? -0.6 : 0), { base: 3 });
  // o crânio e o focinho
  P.z = 3;
  P.ell(24, 10, 8.5, 6.5, (x, y, dx, dy, d) => P.put(x, y, R, 3.4 - dx * 0.8 - dy * 1.2 - d * 0.6 + cg(x, y, s) * 0.4 + cn(x, y, 5, 5, s) * 0.4));
  for (let x = 2; x < 20; x++) { const t = (x - 2) / 18, y0 = 7.5 + (1 - t) * 3, y1 = 15; for (let y = Math.floor(y0); y < y1; y++) P.put(x, y, R, 3.6 - (y - y0) / (y1 - y0) * 1.8 + (y === Math.floor(y0) ? 0.9 : 0) - (1 - t) * 0.3 + cg(x, y, s) * 0.4); }
  P.blob(3.5, 12, 2.4, 3, R, s + 2, 3);
  // a mandíbula e os dentes
  if (!k) { P.z = 2; for (let x = 4; x < 27; x++) { const y = 18 - Math.pow((26 - x) / 22, 1.5) * 1.4; for (let j = 0; j < 3; j++) P.put(x, y + j, R, 3 - j * 0.9); } for (let x = 6; x < 22; x++) for (let y = 15; y < 18 - Math.pow((26 - x) / 22, 1.5) * 1.4; y++) P.put(x, y, RP.sombra, 1.2); }
  P.z = 4;
  for (let x = 4; x < 21; x += 2) { const l = x < 8 ? 3 : 2; for (let j = 0; j < l; j++) P.put(x, 15 + j, R, 4.8 - j * 0.6); }
  if (!k) for (let x = 7; x < 21; x += 3) { P.put(x, 17, R, 4.4); P.put(x, 16, R, 4); }
  // a órbita, a narina, a crista sobre o olho
  P.ell(22, 9, 3.4, 3, (x, y, dx, dy, d) => P.put(x, y, d > 0.55 ? R : RP.sombra, d > 0.55 ? (dy < 0 ? 1.4 : 4.4) : 0.6 + d));
  for (let x = 18; x < 27; x++) P.put(x, 5.5 + Math.abs(x - 22) * 0.15, R, 4.8);
  P.put(5, 10, RP.sombra, 1); P.put(6, 10, RP.sombra, 1.6);
  if (k) { P.put(21, 9, RP.ouro, 4.6); P.put(22, 9, RP.ouro, 3.4); P.put(21, 10, RP.ouro, 2.6); P.mark('brilho', 21, 8); }
  seams(P);
  for (let j = 0; j < 4; j++) crack(P, 14 + hash2(j, 0, s) * 16, 8 + hash2(j, 1, s) * 6, 1 + hash2(j, 2, s) * 1.6, 6, s + j * 7);
  grime(P, 0.7, -0.05, s + 3, null, [R]);
  // o ouro em volta do queixo
  P.z = 8;
  if (!k) coinHeap(P, 0, 35, H - 1, 4, s, 2, false);
  else { for (let x = 0; x < W; x++) { const t = (x + 0.5) / W, hh = 2.4 + Math.sin(t * Math.PI) * 1.6; for (let y = Math.round(H - hh); y < H; y++) P.put(x, y, RP.ouro, 3.2 + (y === Math.round(H - hh) ? 1.3 : 0) + Math.sin(x * 0.5) * 0.3 - t * 0.6 + cg(x, y, s) * 0.2); } P.mark('brilho', 8, H - 3); }
  return P.done();
}
function dragonRib(k) {   // 46 x 66: a costela de dragão: uma costela enorme saindo do chão e curvando por cima como uma foice, os sulcos do osso, rachas de calor, outra menor atrás; moedas amontoadas no pé (k 1: duas costelas cruzadas saindo de um pedaço de espinha meio enterrado)
  const W = 46, H = 66, P = painter(W, H), s = 27641 + k, R = RP.osso;
  const rib = (fn, w0, w1, base, z, ss) => { P.z = z; sweep(P, fn, t => w0 + (w1 - w0) * t, R, ss, (a, q) => (Math.abs(q + 0.3) < 0.12 ? -0.8 : 0) + (Math.abs(((a / 7) % 1) - 0.5) < 0.04 ? -0.4 : 0), { base }); };
  if (!k) {
    rib(bez([28, H - 1], [26, 38], [34, 24], [44, 28]), 5, 2, 2, 1, s + 1);
    rib(bez([9, H - 1], [5, 30], [18, 3], [42, 10]), 7.5, 2.4, 2.8, 2, s);
  } else {
    P.z = 1;
    for (let i = 0; i < 4; i++) { const x = 6 + i * 9; P.rect(x, H - 9, 7, 9, R, (ii, j) => 3.2 - ii * 0.3 - j * 0.1 + (ii === 0 ? 0.8 : 0) + (j === 0 ? 0.8 : 0)); P.rect(x + 2, H - 13, 3, 4, R, (ii, j) => 3.6 - ii * 0.6 - j * 0.1); }
    rib(bez([12, H - 8], [10, 30], [24, 10], [42, 6]), 6.5, 2.2, 2.4, 2, s);
    rib(bez([34, H - 8], [36, 32], [22, 12], [4, 10]), 6.5, 2.2, 3, 3, s + 1);
  }
  seams(P);
  for (let j = 0; j < 6; j++) { const x = 4 + hash2(j, 0, s) * 36, y = 6 + hash2(j, 1, s) * 50; if (P.is(x, y, R)) crack(P, x, y, 1.2 + hash2(j, 2, s), 6, s + j * 5); }
  grime(P, 0.6, 0, s + 3, (x, y) => (y > H - 14 ? 0.3 : 0), [R]);
  P.z = 8;
  coinHeap(P, 0, k ? 45 : 24, H - 1, k ? 5 : 6, s, 2, true);
  if (!k) coinHeap(P, 22, 38, H - 1, 3, s + 7, 1, false);
  return P.done();
}
function cupHeap(k) {   // 42 x 24: o monte de taças e coroas: um monte de moedas com pedras preciosas, taças em pé e tombadas, uma coroa jogada no alto, um cetro atravessado, um colar de pérolas escorrendo; os reflexos cintilam (k 1: um monte menor com uma coroa grande em cima e um prato de ouro em pé atrás)
  const W = 42, H = 24, P = painter(W, H), s = 27661 + k;
  if (!k) {
    P.z = 1;
    // o cetro atravessado atrás
    for (let i = 0; i < 18; i++) { const x = 6 + i, y = H - 4 - i * 0.7; P.put(x, y, RP.ouro, 4.2 - (i % 4 === 0 ? 1.4 : 0)); P.put(x, y + 1, RP.ouro, 2.4); }
    P.blob(24.5, H - 17, 2, 2, RP.safira, s, 3);
    P.z = 2;
    coinHeap(P, 1, 41, H - 1, 9, s, 3);
    P.z = 3;
    goblet(P, 11, H - 6, s + 1, -0.12, RP.rubi, true); goblet(P, 32, H - 3, s + 2, 1.35);
    crown(P, 18, H - 10, 9, s + 3);
    for (let i = 0; i < 10; i++) P.put(26 + i, H - 7 + Math.sin(i / 9 * Math.PI) * 3, RP.sal, i % 2 ? 4.8 : 3.6);   // o colar
  } else {
    P.z = 1;
    P.ell(28, 9, 7, 7, (x, y, dx, dy, d) => P.put(x, y, RP.ouro, 3.2 - dx * 1.2 - dy * 0.9 + (d > 0.7 ? 0.9 : d < 0.2 ? 0.6 : 0) + (Math.abs(d - 0.5) < 0.06 ? -1 : 0)));   // o prato
    P.mark('brilho', 25, 5);
    P.z = 2;
    coinHeap(P, 3, 39, H - 1, 7, s, 2);
    P.z = 3;
    crown(P, 13, H - 8, 13, s + 3);
    goblet(P, 34, H - 2, s + 2, 0.2);
  }
  seams(P, 0.8);
  return P.done();
}
function meltedArmor(k) {   // 40 x 28: a armadura de cavaleiro derretida no ouro: a poça de ouro endurecido lisa, com o brilho correndo; o peitoral afundado até o peito, o ouro escorrido por cima dele, o elmo fechado tombado ao lado, a manopla saindo da poça com os dedos abertos; o aço manchado de azul e palha onde o calor bateu (k 1: só o elmo afundado até os olhos e a manopla segurando o cabo de uma espada)
  const W = 40, H = 28, P = painter(W, H), s = 27681 + k, F = RP.ferro, pool = H - 8;
  const helm = (Q, ox, oy, ss) => {   // o elmo fechado: o balde, a fresta dos olhos, os furos de respirar, a crista
    Q.ell(ox + 5, oy + 5, 5, 5.5, (x, y, dx, dy, d) => { if (dy > 0.6) return; Q.put(x, y, F, 3.4 - dx * 1.4 - dy * 0.8 - d * 0.4 + cg(x, y, ss) * 0.3); });
    Q.rect(ox, oy + 6, 10, 5, F, (i, j) => 3.2 - (i - 4.5) / 5 * 1.4 - j * 0.2);
    for (let x = ox + 1; x < ox + 9; x++) Q.put(x, oy + 6, RP.sombra, 0.6);
    for (const [x, y] of [[ox + 3, oy + 8], [ox + 5, oy + 8], [ox + 4, oy + 9], [ox + 6, oy + 9]]) Q.put(x, y, RP.sombra, 1);
    for (let y = oy + 1; y < oy + 10; y++) Q.put(ox + 5, y, F, 4.6 - (y - oy) * 0.15);
  };
  if (!k) {
    // o peitoral afundado, a ombreira, o elmo tombado
    P.z = 1;
    P.ell(21, pool + 1, 8.5, 8, (x, y, dx, dy, d) => { if (y > pool) return; P.put(x, y, F, 3.4 - dx * 1.4 - dy * 0.7 - d * 0.4 + (Math.abs(dx) < 0.06 ? 1 : 0) + cg(x, y, s) * 0.3); });
    for (const [x, y] of [[15, pool - 3], [27, pool - 3], [18, pool - 6], [24, pool - 6]]) P.put(x, y, F, 5);
    P.z = 2;
    P.ell(29, pool - 4, 4.6, 3.6, (x, y, dx, dy, d) => { if (dy > 0.4) return; P.put(x, y, F, 3.6 - dx * 1.2 - dy - d * 0.4 + ((x + y) % 3 === 0 ? -0.5 : 0)); });
    P.z = 3;
    const Q = painter(12, 13); helm(Q, 1, 1, s); blit(P, Q, 2, pool - 11, -0.5, 6, 11);
    // a manopla saindo da poça
    P.z = 4;
    tube(P, lin(34, pool + 1, 35.5, pool - 9), () => 4, F, s + 3, 3);
    for (let j = pool - 8; j < pool + 1; j += 3) for (let x = 33; x < 38; x++) P.put(x, j, F, 1.6);
    for (const [dx, dy] of [[-2.5, -3], [-1, -4], [0.5, -4.2], [2, -3.6], [3, -1.6]]) P.line(35.5, pool - 10, 35.5 + dx, pool - 10 + dy, F, 3.8);
  } else {
    P.z = 1;
    const Q = painter(12, 13); helm(Q, 1, 1, s); blit(P, Q, 9, pool - 9, 0.1, 6, 11);
    P.z = 2;
    // a manopla segurando o cabo da espada fincada
    for (let y = pool - 15; y < pool + 1; y++) { P.put(28, y, RP.couro, (y % 2 ? 3.4 : 2.2)); P.put(29, y, RP.couro, 2); }
    P.rect(24, pool - 3, 10, 2, RP.ouro, (i, j) => 4.4 - i * 0.2 - j * 1.2); P.blob(28.5, pool - 16, 1.6, 1.6, RP.ouro, s, 3.4);
    tube(P, lin(34, pool + 1, 31, pool - 8), () => 4, F, s + 3, 3);
    P.ell(29.5, pool - 9, 2.6, 2.2, (x, y, dx, dy, d) => P.put(x, y, F, 3.6 - dx - dy));
  }
  seams(P);
  // o calor: o aço perto da poça ganha as cores de têmpera
  for (let y = pool - 7; y < pool + 1; y++) for (let x = 0; x < W; x++) if (P.is(x, y, F)) { const d = pool - y; P.tint(x, y, d < 2 ? '#5a3a8a' : d < 4 ? '#3a5aa0' : '#b08848', d < 4 ? 0.35 : 0.22); }
  // a poça de ouro endurecido
  P.z = 6;
  for (let x = 0; x < W; x++) { const t = (x + 0.5) / W, top = pool + Math.round((t < 0.1 ? (0.1 - t) * 30 : t > 0.92 ? (t - 0.92) * 40 : 0) + Math.sin(x * 0.35) * 0.6); for (let y = top; y < H; y++) { const a = y - top; P.put(x, y, RP.ouro, 3.4 + (a === 0 ? 1.4 : a === 1 ? 0.5 : 0) - t * 0.8 + Math.sin(x * 0.3 + y * 1.4) * 0.35 + (Math.abs(((x * 0.25 + y * 0.6) % 4) - 2) < 0.2 ? 1 : 0) + cg(x, y, s) * 0.15); } }
  // o ouro escorrido por cima do aço
  for (let j = 0; j < (k ? 3 : 5); j++) { const x = (k ? 10 : 14) + hash2(j, 0, s) * (k ? 10 : 16); let y = pool - 2 - hash2(j, 1, s) * (k ? 5 : 9); while (y < pool && P.has(x, y)) { P.put(x, y, RP.ouro, 4.4 - (pool - y) * 0.05); P.put(x + 1, y, RP.ouro, 2.6); y++; } }
  for (const x of [8, 22, 33]) P.mark('brilho', x, pool);
  return P.done();
}
function toothShield(k) {   // 28 x 34: o escudo com o dente cravado: um escudo de cavaleiro de fundo vinho com a coroa de ouro do reino esquecido, o aro de ferro, amassados e chamuscado embaixo; um dente de dragão enorme atravessado, rachas saindo do furo; pendurado num cravo (k 1: o dente arrancado, só o rasgo, e três riscos de garra em diagonal)
  const W = 28, H = 34, P = painter(W, H), s = 27701 + k, cx = 14;
  const hwAt = y => y < 17 ? 11.5 : 11.5 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 17) / 16, 2)));
  for (let y = 3; y < H - 1; y++) { const hw = hwAt(y); for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw, rim = Math.abs(x + 0.5 - cx) > hw - 1.6 || y < 5; if (rim) P.put(x, y, RP.ferro, 3.6 - u * 1.4 - (y > 20 ? 0.6 : 0) + cg(x, y, s) * 0.3); else P.put(x, y, RP.pano, 3.2 - u * 1.2 - y / H * 0.6 + Math.sin(x * 0.7) * 0.15 + cg(x, y, s) * 0.4); } }
  // a coroa e a faixa de ouro
  crown(P, 9, 15, 11, s); P.pts.brilho = [];
  for (let y = 18; y < 28; y++) { P.put(cx - 1, y, RP.ouro, 4); P.put(cx, y, RP.ouro, 2.8); }
  for (let x = cx - 5; x <= cx + 4; x++) { P.put(x, 21, RP.ouro, 4 - (x - cx + 5) * 0.15); P.put(x, 22, RP.ouro, 2.4); }
  // amassados e chamuscado
  for (const [x, y] of [[7, 9], [20, 25], [10, 26]]) { P.put(x, y, P.rampAt(x, y) || RP.pano, (P.v(x, y) || 3) - 1.2); P.put(x + 1, y + 1, P.rampAt(x + 1, y + 1) || RP.pano, (P.v(x + 1, y + 1) || 3) + 0.9); }
  stain(P, RP.carvao, 0.0, s + 2, (x, y) => (y > 22 ? 0.4 : -0.3) + (x < 12 ? 0.15 : 0), 0.6, [RP.pano, RP.ouro]);
  // o cravo de cima
  P.put(cx - 1, 1, RP.ferro, 4.4); P.put(cx, 1, RP.ferro, 3); P.put(cx - 1, 2, RP.ferro, 3); P.put(cx, 2, RP.ferro, 2);
  if (!k) {
    P.z = 3;
    for (let j = 0; j < 5; j++) crack(P, 11, 12, j * 1.25, 6, s + j * 3, null, 1.3);
    P.ell(11, 12, 3, 2.6, (x, y, dx, dy, d) => P.put(x, y, RP.sombra, 1 + d));
    fang(P, 10, 11, 23, 28, 6, s + 4, RP.osso, 3.2);
    P.blob(9.5, 11, 2.6, 2.4, RP.osso, s + 5, 2.4);   // a raiz partida
  } else {
    // o rasgo do dente, os três riscos de garra
    P.ell(12, 13, 3.2, 2.6, (x, y, dx, dy, d) => { P.clear(x, y); });
    for (let j = 0; j < 5; j++) crack(P, 12, 13, j * 1.25, 5, s + j * 3, null, 1.3);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 14; j++) { const x = 15 + i * 3 + j * 0.45, y = 8 + j; if (P.has(x, y)) { P.put(x, y, P.rampAt(x, y) || RP.pano, 0.8); if (P.has(x + 1, y)) P.put(x + 1, y, P.rampAt(x + 1, y) || RP.pano, 4.2); } }
  }
  P.mark('brilho', 9, 10);
  return P.done();
}
function anvil(k) {   // 38 x 24: a bigorna do reino esquecido afundada no ouro: o chifre comprido, a mesa com a aresta clara, a cintura com a faixa de ouro lavrada em losangos e a coroa estampada, o pé afundado num monte de moedas (k 1: tombada de lado, um martelo de cabo de couro caído junto)
  const W = 38, H = 24, P = painter(W, H), s = 27721 + k, F = RP.ferro;
  const Q = painter(34, 22);
  // a mesa e o chifre
  for (let x = 0; x < 34; x++) { const horn = x < 11, t = horn ? (11 - x) / 11 : 0, y0 = horn ? 3 + Math.round(t * t * 2) : 2, y1 = horn ? 8 - Math.round(t * 3.4) : 8; for (let y = y0; y < y1; y++) Q.put(x, y, F, 3.2 - (y - y0) / Math.max(1, y1 - y0) * 1.6 + (y === y0 ? 1.4 : 0) - x / 34 * 0.6 + cg(x, y, s) * 0.3); }
  Q.rect(30, 1, 4, 1, F, i => 4.4 - i * 0.3);
  // a cintura e o pé
  for (let y = 8; y < 22; y++) { const t = (y - 8) / 13, hw = y < 15 ? 7 - Math.sin(t * Math.PI * 1.1) * 2.6 : 5 + (y - 15) * 1.3, c = 21; for (let x = Math.floor(c - hw); x < c + hw; x++) Q.put(x, y, F, 2.8 - (x + 0.5 - c) / hw * 1.3 + cg(x, y, s) * 0.3); }
  // a faixa de ouro lavrada e a coroa estampada
  for (let x = 15; x < 28; x++) { Q.put(x, 9, RP.ouro, 4.2 - (x - 15) * 0.1); Q.put(x, 10, RP.ouro, (x % 3 === 0 ? 1.6 : 3.2)); Q.put(x, 11, RP.ouro, 2.4); }
  for (let x = 18; x < 25; x++) { Q.put(x, 16, F, 1.4); if (x % 2 === 0) { Q.put(x, 14, F, 1.4); Q.put(x, 15, F, 1.4); } }
  Q.mark('brilho', 2, 4); Q.mark('brilho', 16, 9);
  Q.done(false);
  if (!k) {
    blit(P, Q, 2, 0);
    P.z = 5; coinHeap(P, 0, 37, H - 1, 5, s, 2);
  } else {
    blit(P, Q, 2, 0, 0.22, 17, 12);
    P.z = 5; coinHeap(P, 0, 37, H - 1, 3, s, 1, false);
    P.z = 6; for (let x = 6; x < 22; x++) { P.put(x, H - 4 - (x - 6) * 0.15, RP.couro, x % 3 === 0 ? 2 : 3.4); }
    P.rect(2, H - 8, 5, 6, F, (i, j) => 3.6 - i * 0.4 - j * 0.15 + (j === 0 ? 0.8 : 0));
  }
  seams(P);
  return P.done();
}
function banner(k) {   // 28 x 56: o estandarte do reino esquecido: duas correntes do teto, a vara de ferro com as pontas de ouro, o pano vinho desbotado em dobras com a borda de ouro, o sol-coroa bordado, rabo de andorinha embaixo, rasgos, furos queimados com a beira preta e a barra chamuscada (k 1: rasgado na diagonal, só sobra metade, a vara torta)
  const W = 28, H = 56, P = painter(W, H), s = 27741 + k;
  const tilt = k ? 0.12 : 0;
  for (const x of [5, 22]) for (let y = 0; y < 7 + (x > 14 ? Math.round(tilt * 17) : 0); y++) P.put(x, y, RP.ferro, y % 2 ? 2 : 3.8);
  for (let x = 1; x < W - 1; x++) { const y = 7 + Math.round((x - 1) * tilt); P.put(x, y, RP.ferro, 3.8 - x * 0.04); P.put(x, y + 1, RP.ferro, 2); }
  P.blob(1, 7.5, 1.3, 1.3, RP.ouro, s, 3.4); P.blob(W - 2, 7.5 + (W - 3) * tilt, 1.3, 1.3, RP.ouro, s, 3.2);
  const x0 = 3, x1 = W - 4, bot = x => { const u = (x - x0) / (x1 - x0); return 50 - Math.round(Math.abs(u - 0.5) < 0.18 ? (0.18 - Math.abs(u - 0.5)) * 40 : 0) + Math.round(cn(x, 0, 2, 2, s) * 4) + Math.round(hash2(x, 1, s) * 2); };
  const torn = k ? (x, y) => y > 12 + (x - x0) * 1.9 + cn(x, y, 3, 3, s) * 4 : () => false;
  const burn = (x, y) => cn(x, y, 5, 6, s + 2) > 0.82 && y > 18;
  P.z = 1;
  for (let x = x0; x <= x1; x++) for (let y = 9 + Math.round((x - 1) * tilt); y < bot(x); y++) {
    if (torn(x, y) || burn(x, y)) continue;
    const border = x < x0 + 2 || x > x1 - 2, fold = Math.sin((x - x0) * 0.75) * 0.5;
    P.put(x, y, border ? RP.ouro : RP.pano, (border ? 3 : 2.8) + fold - (x - x0) / (x1 - x0) * 0.5 - (y > 40 ? (y - 40) * 0.05 : 0) + cg(x, y, s) * 0.35);
  }
  // o sol-coroa bordado
  const sx = 15, sy = 24;
  for (let a = 0; a < 12; a++) { const ang = a / 12 * Math.PI * 2; for (let r = 4; r < (a % 2 ? 7 : 8.5); r++) { const x = sx + Math.cos(ang) * r, y = sy + Math.sin(ang) * r; if (P.is(x, y, RP.pano)) P.put(x, y, RP.ouro, 3.6 - r * 0.1 + Math.sin((x - x0) * 0.75) * 0.4); } }
  P.ell(sx, sy, 3.6, 3.6, (x, y, dx, dy) => { if (P.is(x, y, RP.pano)) P.put(x, y, RP.ouro, 3.8 - dx - dy * 0.8); });
  crown(P, sx - 3, sy + 1, 7, s); P.pts.brilho = [];
  // a beira dos furos e a barra chamuscadas
  for (let y = 9; y < H; y++) for (let x = x0; x <= x1; x++) { if (!P.has(x, y)) continue; if (!P.has(x, y + 1) || !P.has(x - 1, y) || !P.has(x + 1, y) || (burn(x, y - 1) && y > 18)) P.put(x, y, RP.carvao, 2.6 + hash2(x, y, s) * 1.2); }
  grime(P, 0.9, 0, s + 4, (x, y) => (y > 36 ? 0.3 : -0.3), [RP.pano, RP.ouro]);
  return P.done();
}
function buriedSword(k) {   // 20 x 38: a espada enterrada no ouro: a lâmina larga com o sulco no meio, a guarda de ouro com as pontas curvas, o cabo em couro trançado, o pomo com um rubi; fincada num montinho de moedas (k 1: torta, com um trapo vinho amarrado na guarda)
  const W = 20, H = 38, P = painter(W, H), s = 27761 + k;
  const Q = painter(16, 34), F = RP.ferro, cx = 8;
  for (let y = 13; y < 34; y++) { const t = (y - 13) / 21, hw = 2.2 - t * 0.4; for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw; Q.put(x, y, F, Math.abs(u) < 0.3 ? 2 : u < 0 ? 4.6 - (y % 7 === 0 ? 0.8 : 0) : 3); } }
  for (let x = 1; x < 15; x++) { const e = Math.abs(x + 0.5 - cx) / 7; Q.put(x, 11 + Math.round(e * e * 2), RP.ouro, 4.4 - (x - 1) * 0.12); Q.put(x, 12 + Math.round(e * e * 2), RP.ouro, 2.4); }
  for (let y = 4; y < 11; y++) { Q.put(cx - 1, y, RP.couro, (y % 2 ? 3.8 : 2.6)); Q.put(cx, y, RP.couro, (y % 2 ? 2.4 : 3.2)); }
  Q.ell(cx, 2.5, 2.2, 2.2, (x, y, dx, dy) => Q.put(x, y, RP.ouro, 3.6 - dx * 1.2 - dy));
  Q.put(cx - 1, 2, RP.rubi, 4.8); Q.put(cx, 2, RP.rubi, 3); Q.put(cx - 1, 3, RP.rubi, 2.2);
  Q.mark('brilho', cx - 5, 10);
  if (k) for (let y = 12; y < 20; y++) { Q.put(cx + 2 + (y - 12) * 0.3, y, RP.pano, 3.2 - (y - 12) * 0.1); Q.put(cx + 3 + (y - 12) * 0.3, y, RP.pano, 2.2); }
  Q.done(false);
  blit(P, Q, 2, 0, k ? 0.2 : 0, 8, 33);
  P.z = 5; coinHeap(P, 0, 19, H - 1, 5, s, 1);
  seams(P);
  return P.done();
}

/* =============================== registro =============================== */
// assa as camadas acesas de cada variação: os pixels acesos sozinhos e o halo em volta (pad HR)
const HR = 9;
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
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), dragao: true, dgLuz: B.map(b => b.nv), dgHalo: B.map(b => b.halo), dgPts: Ps.map(P => P.pts), luz: [], brilho: DG_COL.magma }, extra || {}));
};
// As Chaminés de Vapor
def('dg_geiser', 'Gêiser de pedra', F, 'frente', ['chamines'], [geyser(0), geyser(1)], { alto: 4 });
def('dg_bacia', 'Bacia de água fervendo', F, 'frente', ['chamines'], [boilingBasin(0), boilingBasin(1)]);
def('dg_olivina_rocha', 'Rocha com olivina', F, 'frente', ['chamines', 'tubos'], [olivineRock(0), olivineRock(1)]);
def('dg_crosta_sal', 'Crosta de sal', Wl, 'fundo', ['chamines'], [saltCrust(0), saltCrust(1)]);
def('dg_cranio_peixe', 'Crânio de peixe gigante', F, 'frente', ['chamines'], [fishSkull(0), fishSkull(1)]);
def('dg_cortina_vapor', 'Cortina de vapor', Wl, 'fundo', ['chamines'], [steamCurtain(0), steamCurtain(1)], { alto: 6, luz: [{ x: 15, y: 54, r: 0.25 }], brilho: DG_COL.brasa });
// Os Túneis Kobold
def('dg_fogueira', 'Fogueira kobold', F, 'frente', ['tuneis', 'chamines'], [campfire(0), campfire(1)], { toca: true, luz: [{ x: 18, y: 20, r: 1 }], brilho: DG_COL.magma, anim: { k: 'dg_fogo' } });
def('dg_cesto_moedas', 'Cesto de moedas roubadas', F, 'frente', ['tuneis', 'chamines'], [coinBasket(0), coinBasket(1)]);
def('dg_varal_escamas', 'Varal de escamas', C, 'frente', ['tuneis'], [scaleLine(0), scaleLine(1)]);
def('dg_estatua_barro', 'Estátua de dragão de barro', F, 'frente', ['tuneis'], [clayStatue(0), clayStatue(1)], { santuario: true, alto: 6, luz: [{ x: 6, y: 37, r: 0.4 }, { x: 38, y: 38, r: 0.4 }], brilho: DG_COL.magma });
def('dg_idolo_barro', 'Estatueta de barro', F, 'frente', ['tuneis'], [clayIdol(0), clayIdol(1)], { luz: [{ x: 19, y: 16, r: 0.3 }], brilho: DG_COL.magma });
def('dg_tambor', 'Tambor de couro', F, 'frente', ['tuneis'], [drum(0), drum(1)]);
def('dg_lancas', 'Pilha de lanças', Wl, 'fundo', ['tuneis'], [spearRack(0), spearRack(1)], { alto: 4 });
def('dg_jaula_coelho', 'Jaula de vime com coelho-de-gruta', C, 'frente', ['tuneis'], [rabbitCage(0), rabbitCage(1)]);
def('dg_mapa_kobold', 'Mapa kobold riscado', Wl, 'fundo', ['tuneis'], [koboldMap(0), koboldMap(1)]);
def('dg_porta_toca', 'Porta de toca de ossos', Wl, 'fundo', ['tuneis', 'chamines'], [denDoor(0), denDoor(1)], { alto: 4, luz: [{ x: 19, y: 38, r: 0.2 }], brilho: DG_COL.brasa });
// Os Tubos de Lava
def('dg_ovo_draco', 'Ovo de draco', F, 'frente', ['tubos'], [drakeEggProp(0), drakeEggProp(1)], { ninho: true, luz: [{ x: 13, y: 17, r: 0.55 }], brilho: DG_COL.brasa });
def('dg_ninho_cascas', 'Ninho de cascas e escamas', F, 'frente', ['tubos'], [shellNest(0), shellNest(1)]);
def('dg_casca_serpe', 'Casca de serpe trocada', Wl, 'fundo', ['tubos'], [serpentSkin(0), serpentSkin(1)]);
def('dg_bolha_lava', 'Bolha de lava partida', F, 'frente', ['tubos'], [lavaBubble(0), lavaBubble(1)], { luz: [{ x: 23, y: 20, r: 0.3 }], brilho: DG_COL.brasa, anim: { k: 'dg_morno' } });
def('dg_estalactite_grande', 'Estalactite de lava grande', C, 'frente', ['tubos'], [bigStalactite(0), bigStalactite(1)], { alto: 6, luz: [{ x: 12, y: 42, r: 0.3 }], brilho: DG_COL.magma });
def('dg_fluxo_parado', 'Fluxo de lava parado', Wl, 'fundo', ['tubos'], [frozenFlow(0), frozenFlow(1)], { alto: 6, luz: [{ x: 23, y: 54, r: 0.45 }], brilho: DG_COL.brasa, anim: { k: 'dg_morno' } });
// O Leito de Ouro
def('dg_cranio_dragao', 'Crânio de dragão antigo', F, 'frente', ['leito'], [dragonSkull(0), dragonSkull(1)]);
def('dg_costela', 'Costela de dragão', Wl, 'fundo', ['leito'], [dragonRib(0), dragonRib(1)], { alto: 6 });
def('dg_monte_tacas', 'Monte de taças e coroas', F, 'frente', ['leito'], [cupHeap(0), cupHeap(1)]);
def('dg_armadura_derretida', 'Armadura derretida no ouro', F, 'frente', ['leito'], [meltedArmor(0), meltedArmor(1)], { tesouro: true });
def('dg_escudo_dente', 'Escudo com dente cravado', Wl, 'fundo', ['leito'], [toothShield(0), toothShield(1)]);
def('dg_bigorna', 'Bigorna afundada no ouro', F, 'frente', ['leito'], [anvil(0), anvil(1)]);
def('dg_estandarte', 'Estandarte de reino esquecido', C, 'frente', ['leito'], [banner(0), banner(1)], { alto: 7 });
def('dg_espada_enterrada', 'Espada enterrada no ouro', F, 'frente', ['leito'], [buriedSword(0), buriedSword(1)]);

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(DG_PROP_PLAN, {
  chamines: { chao: [['dg_geiser', 0.08, 1], ['dg_bacia', 0.07, 1], ['dg_olivina_rocha', 0.12, 2], ['dg_cranio_peixe', 0.05, 1], ['dg_fogueira', 0.08, 1], ['dg_cesto_moedas', 0.03, 1]], teto: [], fundo: [['dg_crosta_sal', 0.14, 2], ['dg_cortina_vapor', 0.07, 1], ['dg_porta_toca', 0.03, 1]] },
  tuneis: { chao: [['dg_estatua_barro', 0.4, 1], ['dg_fogueira', 0.14, 1], ['dg_cesto_moedas', 0.08, 1], ['dg_idolo_barro', 0.05, 1], ['dg_tambor', 0.08, 1]], teto: [['dg_varal_escamas', 0.12, 1], ['dg_jaula_coelho', 0.07, 1]], fundo: [['dg_lancas', 0.08, 1], ['dg_mapa_kobold', 0.06, 1], ['dg_porta_toca', 0.07, 1]] },
  tubos: { chao: [['dg_ovo_draco', 0.4, 2], ['dg_ninho_cascas', 0.1, 1], ['dg_bolha_lava', 0.07, 1], ['dg_olivina_rocha', 0.03, 1]], teto: [['dg_estalactite_grande', 0.12, 2]], fundo: [['dg_casca_serpe', 0.06, 1], ['dg_fluxo_parado', 0.05, 1]] },
  leito: { chao: [['dg_armadura_derretida', 0.25, 1], ['dg_cranio_dragao', 0.08, 1], ['dg_monte_tacas', 0.1, 1], ['dg_bigorna', 0.05, 1], ['dg_espada_enterrada', 0.1, 1]], teto: [['dg_estandarte', 0.08, 1]], fundo: [['dg_costela', 0.07, 1], ['dg_escudo_dente', 0.08, 1]] }
});

/* ---------- a brasa e os animados ----------
   visProps só guarda objetos com luz (todos os do Covil têm `luz`, nem que vazia). drawWorld vem antes da luz e do
   herói (o vapor e as bolhas escurecem com o lugar); a brasa, o halo e as chamas vão no drawGlow (somados) e no
   drawTop (por cima do escuro). Tudo só para os objetos na tela. */
const dgPt = (p, nm) => { const P = p.def.dgPts && p.def.dgPts[p.v]; return P && P[nm] ? P[nm] : null; };
const dgFlick = (p, j) => 0.8 + Math.sin(gameTime * 11 + j * 2.3 + p.X) * 0.1 + Math.sin(gameTime * 23 + j) * 0.08;
// o pulso do ovo: sobe devagar e cai, como um coração lento
const dgPulse = p => { const v = 0.5 + 0.5 * Math.sin(gameTime * 1.6 + p.X * 0.013); return v * v * (3 - 2 * v); };
// a gota de lava da estalactite: incha na ponta (sz de 0 a 1) e cai (dy em pixels, t de 0 a 1)
const dgDrop = (p, j) => { const h = hash2(p.X + j * 13, p.Y, 23), ph = (gameTime / (3.6 + h * 2.4) + h) % 1; if (ph < 0.82) return { sz: ph < 0.35 ? 0 : (ph - 0.35) / 0.47, dy: 0, fall: false, t: 0 }; const t = (ph - 0.82) / 0.18; return { sz: 1, dy: Math.round(t * t * 34), fall: true, t }; };
// a luz que chega num ponto do mundo (o LB do 07, deste quadro): o reflexo só cintila onde alguma luz bate
const dgLit = (wx, wy) => { if (typeof LB === 'undefined' || !LB) return 1; const i = Math.floor(wx / T) - LX0, j = Math.floor(wy / T) - LY0; return i >= 0 && j >= 0 && i < LW && j < LH ? clamp((LB[j * LW + i] - 0.06) * 3, 0, 1) : 0; };
let dgGl = null;
const dgGlowC = (c, r) => { const G = dgGl || (dgGl = {}), k = c + r; return G[k] || (G[k] = glow(r, c)); };
const FL = ['#6a1a04', '#e06a10', '#ffa020', '#fff4c0'];
HOOK.drawWorld.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.dragao) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    // o vapor subindo em baforadas; o jato do gêiser de tempos em tempos
    const V = dgPt(p, 'vapor'); if (V) for (let j = 0; j < V.length; j++) {
      const q = V[j], n = q.n || 4;
      for (let k = 0; k < n; k++) {
        const h = hash2(k + j * 7, p.X, 5), t = (gameTime * (0.28 + h * 0.18) + h + k / n) % 1, sz = 2 + Math.round(t * 4);
        lc.globalAlpha = 0.3 * (1 - t) * Math.min(1, t * 6); lc.fillStyle = k % 2 ? '#d8d0c4' : '#aaa298';
        lc.fillRect(X + q.x + Math.round((h - 0.5) * q.w + Math.sin(t * 5 + k) * (1 + t * 4)) - (sz >> 1), Y + q.y - Math.round(t * 26) - (sz >> 1), sz, sz);
      }
      if (q.jato) {
        const ph = (gameTime * 0.09 + hash2(p.X, p.Y, 9)) % 1; if (ph > 0.1) continue;
        const e = ph / 0.1, hgt = Math.sin(Math.min(1, e * 1.6) * Math.PI / 2) * 52 * (e > 0.7 ? 1 - (e - 0.7) / 0.3 * 0.4 : 1);
        for (let yy = 0; yy < hgt; yy += 2) { const w = 2 + Math.round(yy * 0.14 + Math.sin(yy * 0.5 + gameTime * 20) * 1.2); lc.globalAlpha = 0.5 * (1 - yy / (hgt + 2)) * (e > 0.7 ? 1 - (e - 0.7) / 0.3 : 1); lc.fillStyle = yy % 4 ? '#e8e2d8' : '#bcb4aa'; lc.fillRect(X + q.x + 1 - (w >> 1) + Math.round(Math.sin(yy * 0.2 + gameTime * 6) * yy * 0.04), Y + q.y - yy, w, 2); }
      }
    }
    // as bolhas estourando na água fervendo
    const Bb = dgPt(p, 'bolha'); if (Bb) for (const q of Bb) for (let k = 0; k < 6; k++) {
      const h = hash2(k, p.X, 11), t = (gameTime * (0.7 + h * 0.8) + h) % 1, x = X + q.x + Math.round(h * q.w), y = Y + q.y;
      if (t < 0.7) { lc.globalAlpha = 0.7 * t / 0.7; lc.fillStyle = '#9ad8cc'; lc.fillRect(x, y - (t > 0.45 ? 1 : 0), t > 0.45 ? 2 : 1, 1); }
      else { lc.globalAlpha = 0.8 * (1 - (t - 0.7) / 0.3); lc.fillStyle = '#e0f4ee'; lc.fillRect(x - 1, y - 2, 1, 1); lc.fillRect(x + 2, y - 2, 1, 1); lc.fillRect(x, y - 3, 1, 1); }
    }
    // a cortina de vapor: lâminas que saem da fenda e se desfazem, um tremor claro correndo
    const Ct = dgPt(p, 'cortina'); if (Ct) for (let j = 0; j < Ct.length; j++) {
      const q = Ct[j];
      for (let k = 0; k < 2; k++) { const h = hash2(j * 3 + k, p.X, 17), t = (gameTime * (0.3 + h * 0.25) + h) % 1, w = 2 + Math.round(t * 5); lc.globalAlpha = 0.24 * (1 - t) * Math.min(1, t * 5); lc.fillStyle = k ? '#e2dcd2' : '#c4bcb2'; lc.fillRect(X + q.x + Math.round((h - 0.5) * q.w + Math.sin(t * 6 + j) * t * 3) - (w >> 1), Y + q.y - Math.round(t * 14), w, 1 + Math.round(t * 2)); }
      if (Math.sin(gameTime * 3.4 + j * 1.7 + p.X) > 0.75) { lc.globalAlpha = 0.18; lc.fillStyle = '#f0ece4'; lc.fillRect(X + q.x - (q.w >> 1) - 1, Y + q.y + Math.round(Math.sin(gameTime * 2 + j) * 2), q.w + 2, 1); }
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.dragao) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), hl = p.def.dgHalo[p.v], nv = p.def.dgLuz[p.v], A = p.def.anim, O = dgPt(p, 'ovo');
    let br = 0.9 + Math.sin(gameTime * 1.4 + p.X * 0.05) * 0.1;
    if (A && A.k === 'dg_fogo') br = 0.8 + Math.sin(gameTime * 9 + p.X) * 0.12 + Math.sin(gameTime * 23 + p.X) * 0.06;
    else if (A && A.k === 'dg_morno') br = 0.72 + 0.28 * Math.sin(gameTime * 0.8 + p.X * 0.07);
    if (O) br = 0.35 + 0.65 * dgPulse(p);
    if (hl) { lc.globalAlpha = 0.58 * br; lc.drawImage(hl, X - HR, Y - HR); }
    if (nv) { lc.globalAlpha = 0.45 * br; lc.drawImage(nv, X, Y); }
    const Vl = dgPt(p, 'vela'); if (Vl) for (let j = 0; j < Vl.length; j++) { const q = Vl[j]; lc.globalAlpha = 0.5 * dgFlick(p, j); lc.drawImage(dgGlowC(DG_COL.magma, 8), X + q.x - 8, Y + q.y - 7); }
    if (O) for (const q of O) { lc.globalAlpha = 0.2 + 0.45 * br; lc.drawImage(dgGlowC(DG_COL.brasa, q.r), X + q.x - q.r, Y + q.y - q.r); }
    const Gt = dgPt(p, 'gota'); if (Gt) for (let j = 0; j < Gt.length; j++) { const q = Gt[j], d = dgDrop(p, j); if (!d.sz) continue; lc.globalAlpha = 0.5 * d.sz * (1 - d.t * 0.6); lc.drawImage(dgGlowC(DG_COL.magma, 6), X + q.x - 6, Y + q.y + d.dy - 5); }
    if (A && A.k === 'dg_fogo') { const Fq = dgPt(p, 'fogo'); if (Fq) { const q = Fq[0]; lc.globalAlpha = 0.6 * br; lc.drawImage(dgGlowC('#ff8a20', 18), X + q.x + (q.w >> 1) - 18, Y + q.y - 22); } }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.dragao) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    // as chamas das velas de sebo: um fiapo âmbar que balança, o miolo claro
    const Vl = dgPt(p, 'vela'); if (Vl) for (let j = 0; j < Vl.length; j++) {
      const q = Vl[j], f = Math.floor(gameTime * 7 + p.X * 0.3 + j * 5) % 4, x = X + q.x, y = Y + q.y;
      lc.globalAlpha = 1; lc.fillStyle = FL[1]; lc.fillRect(x + (f === 3 ? 1 : 0), y - 2 - (f === 1 ? 1 : 0), 1, 1 + (f === 1 ? 1 : 0));
      lc.fillStyle = FL[2]; lc.fillRect(x, y - 1, 1, 1); lc.fillStyle = FL[3]; lc.fillRect(x, y, 1, 1);
    }
    // os reflexos do ouro e da olivina: raros, um de cada vez
    const St = dgPt(p, 'brilho'); if (St) for (let j = 0; j < St.length; j++) { const b = Math.sin(gameTime * (0.7 + hash2(j, p.X, 3) * 1.1) + j * 2.3 + p.X * 0.37); if (b < 0.93) continue; const lit = dgLit(p.X + p.sh + St[j].x, p.Y + St[j].y); if (!lit) continue; lc.globalAlpha = Math.min(1, (b - 0.93) * 15) * lit; lc.fillStyle = St[j].c || '#fff6c8'; lc.fillRect(X + St[j].x - 1, Y + St[j].y, 3, 1); lc.fillRect(X + St[j].x, Y + St[j].y - 1, 1, 3); }
    // o ovo: as rachas acendem por cima do escuro no alto do pulso
    if (dgPt(p, 'ovo')) { const nv = p.def.dgLuz[p.v], b = dgPulse(p); if (nv && b > 0.3) { lc.globalAlpha = (b - 0.3) * 0.9; lc.drawImage(nv, X, Y); } }
    // a gota de lava: incha na ponta, cai e esfria
    const Gt = dgPt(p, 'gota'); if (Gt) for (let j = 0; j < Gt.length; j++) {
      const q = Gt[j], d = dgDrop(p, j); if (!d.sz) continue; const x = X + q.x, y = Y + q.y + 1 + d.dy;
      lc.globalAlpha = 1 - d.t * 0.6; lc.fillStyle = d.fall ? (d.t < 0.5 ? FL[3] : FL[2]) : d.sz > 0.6 ? FL[3] : FL[2];
      lc.fillRect(x, y, 1, d.fall || d.sz > 0.6 ? 2 : 1); if (d.sz > 0.85 || d.fall) { lc.fillStyle = FL[1]; lc.fillRect(x, y - 1, 1, 1); }
    }
    const A = p.def.anim; if (!A || A.k !== 'dg_fogo') continue;
    // a fogueira: línguas âmbar que sobem e encolhem, o miolo claro embaixo, fagulhas subindo
    const Fq = dgPt(p, 'fogo'); if (!Fq) continue; const q = Fq[0], T = Math.floor(gameTime * 10);
    for (let c = 0; c < q.w; c++) {
      const env = Math.sin(Math.PI * (c + 0.5) / q.w), h = Math.round(env * (4 + (Math.sin(gameTime * 9 + c * 1.7 + p.X) + 1) * 2.2 + hash2(c, T, p.X) * 2.5));
      for (let j = 0; j < h; j++) { const t = j / Math.max(1, h); lc.globalAlpha = t > 0.85 ? 0.6 : 1; lc.fillStyle = t < 0.25 && env > 0.6 ? FL[3] : t < 0.55 ? FL[2] : t < 0.85 ? FL[1] : FL[0]; lc.fillRect(X + q.x + c, Y + q.y - j, 1, 1); }
    }
    for (let k = 0; k < 5; k++) { const h = hash2(k, p.X, 21), t = (gameTime * (0.5 + h * 0.4) + h) % 1; lc.globalAlpha = 1 - t; lc.fillStyle = k % 2 ? FL[2] : '#ffd050'; lc.fillRect(X + q.x + Math.round(h * q.w + Math.sin(t * 8 + k) * 2), Y + q.y - 6 - Math.round(t * 20), 1, 1); }
  }
  lc.globalAlpha = 1;
});
}
