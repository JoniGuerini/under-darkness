'use strict';

/* ================= a Nave Caída: objetos de cena =================
   Tudo o que é maior que um bloco e veste A Nave Caída (docs/camadas/10-nave-caida.md, seção 5): 29 objetos.
   Na Cratera de Impacto, o que caiu junto com a nave: a cápsula de fuga caída e aberta, o foguete vermelho do adesivo
   enfiado de bico na rocha (ainda soltando fumaça), a placa do casco enfiada torta, a antena quebrada faiscando, a
   cratera fumegante de gosma, a bandeira de astronauta fincada e um pedaço da asa de um disco. No Casco: o disco voador
   estacionado (o do adesivo: disco preto e prata, cúpula branca, luzes correndo pela borda), o painel de controle
   piscando, o cartaz de neon com um ET acenando, o cartaz holográfico do planeta com anel, a porta hexagonal fechada,
   o ventilador grande girando, a luminária de neon pendurada, a escotilha com estrelas e as caixas de carga. Nos
   Laboratórios: a cápsula de espécime com um bicho das camadas de cima boiando na gosma (aranha, esqueleto, goblin,
   larva da colmeia, morcego), a mesa de exame com braços mecânicos, o tanque de gosma borbulhando, o microscópio de
   três oculares, o quadro com o diagrama de um humano, a lâmpada cirúrgica e o cérebro no pote. No Núcleo: o pilar de
   plasma arco-íris, o conduto de energia, o console do reator, o anel de contenção, o cristal de plasma grande e o
   olho de vigia pendurado, que segue o herói com a pupila.
   O pintor do 192 (rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar) com uma tinta a mais:
   o NEON. Um pixel de neon (P.N) é cor pura, não rampa; no fim cada variação assa duas imagens a mais: os pixels de
   neon sozinhos (somados por cima do escuro, para o neon não apagar com a luz do lugar) e o halo (um borrão macio
   somado em volta de cada pixel aceso, calculado uma vez). O drawGlow desenha os dois com 'lighter'; nada é relido
   por quadro. Alguns acendem e falham de vez em quando (`falha: true`: a nave é velha).
   Animados (ganchos no fim; todo objeto da nave tem `luz`, nem que vazia, para entrar em visProps):
     em todos, pelos pontos marcados no desenho (nvPts): 'botao' pisca no seu ritmo, 'laser' pulsa vermelho, 'estrela'
     cintila, 'faisca' solta rajadas de faíscas ciano (a antena, a placa do casco, a asa do disco) (drawGlow + drawTop);
     anim { k: 'nv_disco' }   as luzes da borda do disco correm em roda, a da cúpula pisca (drawGlow + drawTop);
     anim { k: 'nv_et' }      o ET do cartaz acena: o braço de neon sobe e desce (drawGlow + drawTop);
     anim { k: 'nv_vent' }    as pás do ventilador giram (drawWorld: escurecem com o lugar, ficam atrás do herói);
     anim { k: 'nv_bolhas' }  bolhas sobem na gosma do tanque, da cápsula, do pote e da cratera (que solta vapor) (drawTop);
     anim { k: 'nv_plasma' }  faixas claras sobem pelo tubo do pilar de plasma, nas cores do arco-íris (drawGlow + drawTop);
     anim { k: 'nv_olho' }    a íris amarela e a pupila preta do olho de vigia olham para o herói; a pálpebra pisca (drawWorld);
     anim { k: 'nv_fumaca' }  fumaça sobe do bocal do foguete (drawWorld);
     anim { k: 'nv_botoes', barras: true }  as barras de nível do console do reator sobem e descem (drawTop);
     anim { k: 'nv_pulso' }   pulsos de energia correm pelo conduto (drawGlow + drawTop);
     anim { k: 'nv_orbe' }    o orbe arco-íris do anel de contenção pulsa e as luzes do anel correm (drawGlow + drawTop).
   Registrados com defProp (`nave: true`), postos pelo 245 a partir do NV_PROP_PLAN (o nvPlaceProps é o cmPlaceProps
   do 195). Peças de fundo em NV_BACK_FLOOR ficam em pé no chão; as outras de fundo, na altura dos olhos.
   Flags que o gerador deve respeitar:
     hangar: true   só dentro dos hangares de discos do Casco (salas largas e altas): o disco estacionado;
     lab: true      só dentro dos laboratórios e da Galeria dos Espécimes (a mesa de exame, o quadro do humano);
     naoPoca: true  nunca em cima de Poça de Gosma (NV_POCA) nem do emissor ou do feixe do elevador (todo objeto de chão
                    já deveria evitar; a flag fica no que tem pé largo e fino, para quem quiser conferir de novo);
     alto: n        precisa de n blocos de ar livres acima do chão (o pilar de plasma, o disco, o anel de contenção):
                    o 245 pode pular o objeto onde o teto é mais baixo (o fits normal já recusa, é só para não gastar
                    tentativas).
   A cápsula de espécime tem `faixaV` só para deixar o 245 escolher o bicho por faixa se quiser (todas valem). */
const NV_PROP_PLAN = {};
// peças de fundo que ficam em pé no chão em vez de penduradas na altura dos olhos
const NV_HR = 9;   // a margem do halo assado em volta de cada objeto de neon
const NV_BACK_FLOOR = { nv_placa_casco: 1, nv_asa_disco: 1, nv_painel: 1, nv_porta_hex: 1, nv_capsula_especime: 1, nv_pilar_plasma: 1, nv_anel_contencao: 1 };
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  // as rampas da ficha (seção 12)
  vidroI: ['#06120c', '#0c2216', '#143422', '#1e4a30', '#2c6642', '#4a8a5e'],
  escoria: ['#0a0a0c', '#16161a', '#222228', '#303038', '#40404a', '#54545e'],
  casco: ['#14161c', '#20242c', '#2e3440', '#3e4654', '#525c6c', '#6c7888'],
  liga: ['#4a4660', '#6a6684', '#8e8aa8', '#b4b0cc', '#d6d2ea', '#f2f0ff'],
  gosma: ['#1a4a06', '#2e7a0c', '#4aa814', '#6cd422', '#94f03c', '#c8ff7a'],
  reator: ['#2a1a3a', '#3e2a56', '#563e78', '#7258a0', '#9478c8', '#c0a8f0'],
  // os dos objetos
  prata: ['#262a34', '#464c5a', '#6c7484', '#98a0b0', '#c4cad6', '#eef0f6'],
  negro: ['#050608', '#0a0c12', '#12141c', '#1a1e2a', '#262c3c', '#363e54'],
  branco: ['#4e5462', '#767c8c', '#9ea4b4', '#c4c8d4', '#e2e6ee', '#ffffff'],
  vidro: ['#06222c', '#0c3a48', '#145a6c', '#1e7e94', '#40aec4', '#9ae6f4'],
  verm: ['#300606', '#5a0c0c', '#8e1414', '#c4221e', '#ec4434', '#ff8a6a'],
  laranja: ['#3e1404', '#6e2a06', '#a84a0c', '#de7418', '#ffa236', '#ffd07e'],
  amarelo: ['#3e3004', '#6e5808', '#a68a12', '#d8bc22', '#ffe03a', '#fff4a0'],
  azul: ['#060a24', '#0c1440', '#142264', '#1e3488', '#3050b0', '#5878d4'],
  fuligem: ['#050403', '#0c0a08', '#14110e', '#1e1a16', '#2a2520', '#36302a'],
  cabo: ['#08080a', '#121216', '#1c1c22', '#28282f', '#36363e', '#46464f'],
  pele: ['#1a4a06', '#2e7a0c', '#4aa814', '#6cd422', '#94f03c', '#c8ff7a'],
  osso: ['#2a261e', '#463f34', '#665d4e', '#8a7f6a', '#aca088', '#c8bca2'],
  aranha: ['#08060a', '#120e14', '#1e1820', '#2c2430', '#3c3244', '#504458'],
  goblin: ['#1a220e', '#2c3818', '#425024', '#5a6a32', '#768842', '#94a656'],
  larva: ['#3a3020', '#5e5034', '#86744e', '#ac9a6e', '#d0c092', '#ece0b8'],
  morcego: ['#100a08', '#1e1410', '#2e2018', '#3e2c22', '#52402e', '#6a5440'],
  cerebro: ['#4a1a2a', '#7a2c44', '#a84460', '#d06a84', '#ec98ac', '#ffcad6'],
  olho: ['#4a4038', '#7a7064', '#a89e90', '#d0c8bc', '#ece6dc', '#fffcf6'],
  plasmaV: ['#1a0a2a', '#2e1248', '#4a1e70', '#6e2ea0', '#9a4dff', '#d0a8ff']
};
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#040406');
const N = NV_NEON_COL, ARCO = NV_ARCO;
const mixHex = (a, b, k) => { const A = rgb(a), B = rgb(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0')).join(''); };
const lite = (c, k = 0.55) => mixHex(c, '#ffffff', k);

/* ---- o pintor (o do 192) mais o neon: rid -2 marca um pixel de cor pura que acende ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, ramps, idOf, pts: {},
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; },
    N(x, y, hex) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = ph(hex); rid[k] = -2; val[k] = 5; },
    clear(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    isN(x, y) { return x >= 0 && y >= 0 && x < w && y < h && rid[(y | 0) * w + (x | 0)] === -2; },
    // mistura a cor de um pixel já pintado com hex (vidro, gosma por cima)
    tint(x, y, hex, k) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; if (!c[i]) return; const q = c[i], B = rgb(hex); c[i] = pack(Math.round((q & 255) + (B[0] - (q & 255)) * k), Math.round(((q >> 8) & 255) + (B[1] - ((q >> 8) & 255)) * k), Math.round(((q >> 16) & 255) + (B[2] - ((q >> 16) & 255)) * k)); },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    box(x0, y0, rw, rh, R, s, base = 2.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.4 : j === 1 ? 0.5 : 0) + (i === 0 ? 0.6 : 0) - (j === rh - 1 ? 1.3 : 0) - (i === rw - 1 ? 0.9 : 0) + cg(x, y, s) * 0.4 + cn(x, y, 60, 60, s + 1) * 0.3); },
    blob(cx, cy, rx, ry, R, s, base = 2.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 - d * 0.5 + cg(x, y, s) * 0.4); } },
    ell(cx, cy, rx, ry, fn) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d <= 1) fn(x, y, dx, dy, d); } },
    line(x0, y0, x1, y1, R, v, wd = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < wd; k++) P.put(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), R, typeof v === 'function' ? v(i / n, k) : v); } },
    // um tubo de neon: o miolo claro e a cor em volta (wd 1: só a cor)
    nline(x0, y0, x1, y1, col, core = true) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)), L = lite(col); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; P.N(x, y, core ? L : col); } if (core) { const vert = Math.abs(y1 - y0) > Math.abs(x1 - x0); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n + (vert ? 1 : 0), y = y0 + (y1 - y0) * i / n + (vert ? 0 : 1); P.N(x, y, col); } } },
    mark(name, x, y, extra) { (P.pts[name] || (P.pts[name] = [])).push(Object.assign({ x, y }, extra || {})); },
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
// cola Q em P em (ox, oy) girado de ang em volta de (px, py) de Q; o neon vai junto. Devolve a função que leva um
// ponto de Q para P (para as luzes animadas)
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
// chapa rebitada: placas de pw x ph com a beira de cima e a da esquerda acesas, juntas escuras e rebites nos cantos;
// keep(x, y) recorta
function plating(P, x0, y0, w, h, R, s, pw = 10, phh = 8, keep = null, base = 2.5) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x0 + x, Y = y0 + y; if (keep && !keep(X, Y)) continue;
    const row = Math.floor(y / phh), off = (row % 2) * Math.floor(pw / 2), col = Math.floor((x + off) / pw), ly = y % phh, lx = (x + off) % pw;
    const joint = ly === phh - 1 || lx === pw - 1, rivet = (ly === 1 || ly === phh - 3) && (lx === 1 || lx === pw - 3);
    P.put(X, Y, R, joint ? base - 1.3 : rivet ? base + 1.6 : base + hash2(col, row, s) * 0.7 - 0.2 + (ly === 0 ? 0.9 : 0) + (lx === 0 ? 0.4 : 0) - x / w * 0.6 + cg(X, Y, s) * 0.35);
    if (rivet) P.put(X + 1, Y + 1, R, base - 0.9);
  }
}
// cilindro em pé: sombreado pelo u (de -1 à esquerda a 1 à direita), o risco de brilho perto da esquerda
function cyl(P, x0, y0, w, h, R, s, base = 2.7, spec = 1.3) {
  P.rect(x0, y0, w, h, R, (i, j, x, y) => { const u = (i + 0.5) / w * 2 - 1; return base + 0.6 - u * 1.3 - u * u * 0.6 + (u > -0.62 && u < -0.32 ? spec : 0) + cg(x, y, s) * 0.25; });
}
// entulho na linha do chão: pedras e cacos (R) e, se gl, rachaduras verdes acesas na escória
function rubble(P, x0, x1, by, hgt, R, s, gl = false) {
  for (let k = 0; k < (x1 - x0) * 0.8; k++) { const x = x0 + hash2(k, 0, s) * (x1 - x0), t = (x - x0) / (x1 - x0), y = by - hash2(k, 1, s) * hgt * Math.sin(t * Math.PI); P.blob(x, y, 1 + hash2(k, 2, s) * 1.6, 0.9 + hash2(k, 3, s) * 1.1, hash2(k, 5, s) < 0.35 ? RP.vidroI : R, s + k, 2.3); }
  for (let x = x0; x <= x1; x++) if (hash2(x, 4, s) < 0.75) P.put(x, by, R, 1.6 + hash2(x, 5, s));
  // as rachaduras verdes acesas só por dentro da escória (nunca na beira, que leria como capim)
  if (gl) { const me = P.idOf(R); let n = 0; for (let k = 0; k < 60 && n < 2; k++) { const x = (x0 + 2 + hash2(k, 7, s) * (x1 - x0 - 4)) | 0, y = by - 1 - ((hash2(k, 8, s) * hgt) | 0), inner = (a, b) => P.has(a, b) && P.rid[b * P.w + a] === me && P.has(a, b - 1) && P.has(a - 1, b) && P.has(a + 1, b); if (!inner(x, y) || !inner(x + 1, y - 1)) continue; P.N(x, y, '#3aa81a'); P.N(x + 1, y - 1, N.verde); if (inner(x + 2, y - 1)) P.N(x + 2, y - 1, '#3aa81a'); n++; } }
}
// vidro por cima do que já está pintado dentro de inside(x, y): tinge de ciano, o risco de brilho no alto à esquerda
function glass(P, inside, x0, y0, w, h, col = '#5ac8dc', k = 0.28) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (!inside(x, y)) continue; const u = (x - x0) / w;
    if (P.has(x, y)) P.tint(x, y, col, k + u * 0.12); else P.put(x, y, RP.vidro, 1.2 - u * 0.5 + cg(x, y, 7) * 0.2);
    if (Math.abs(u - 0.18) < 0.5 / w + 0.04 && (y - y0) / h > 0.08 && (y - y0) / h < 0.75) P.tint(x, y, '#e8fbff', 0.6);
    if (u > 0.86) P.tint(x, y, '#06222c', 0.35);
  }
}
// fumaça de queimado: escurece o que está pintado por manchas de ruído, mais forte onde bias(x, y) diz
function scorch(P, s, bias, k = 0.7) {
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    if (!P.has(x, y) || P.isN(x, y)) continue; const n = cn(x, y, 14, 14, s) * 0.6 + cn(x, y, 40, 40, s + 1) * 0.5 + bias(x, y);
    if (n > 0.45) P.tint(x, y, '#0c0a08', Math.min(0.85, (n - 0.45) * 2.2 * k + 0.25));
  }
}
// uma estrelinha de 4 pontas do adesivo
function star4(P, x, y, col, big = false) { P.N(x, y, '#ffffff'); P.N(x - 1, y, col); P.N(x + 1, y, col); P.N(x, y - 1, col); P.N(x, y + 1, col); if (big) { P.N(x - 2, y, col); P.N(x + 2, y, col); P.N(x, y - 2, col); P.N(x, y + 2, col); } }
// dentro de um polígono (lista de [x, y])
const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
// as rampas de 6 tons de cada cor do arco-íris (para o cristal de plasma)
const ARCO_R = ARCO.map(c => R6([mixHex(c, '#0a0614', 0.82), mixHex(c, '#0a0614', 0.62), mixHex(c, '#0a0614', 0.38), mixHex(c, '#0a0614', 0.12), lite(c, 0.3), lite(c, 0.65)]));
// o corpo de um disco voador visto de lado: o fundo escuro com o emissor, a chapa prata com anéis, a faixa preta com
// 13 luzes (marcadas 'luz'); cy é o meio da faixa
function discBody(Q, cx, cy, rx, ry, s) {
  Q.ell(cx, cy + 2, rx * 0.68, ry * 0.78, (x, y, dx, dy, d) => { if (dy < 0) return; Q.put(x, y, RP.negro, 1.7 - dx * 0.7 - dy * 0.8 + cg(x, y, s) * 0.15 + (Math.abs(d - 0.55) < 0.06 ? 1.3 : 0)); });
  Q.ell(cx, cy, rx, ry, (x, y, dx, dy, d) => {
    if (dy > 0.35) return;
    const rr = Math.sqrt(dx * dx * 0.7 + dy * dy * 2.4), ring = Math.abs(((rr * 6) % 1) - 0.5) < 0.08;
    if (dy > 0.02) Q.put(x, y, RP.negro, 2.3 - dx * 0.5 + (dy < 0.1 ? 1.3 : 0) - (dy > 0.3 ? 0.8 : 0) + cg(x, y, s) * 0.12);
    else Q.put(x, y, RP.prata, 3.1 - dx * 1.2 + dy * 0.4 - d * 0.3 + (ring ? -0.8 : 0) + (dx < -0.15 && dx > -0.6 && dy < -0.35 ? 1.3 : 0) + (dy > -0.12 ? -0.5 : 0) + cg(x, y, s) * 0.12);
  });
  const L = [N.rosa, N.ciano, N.amarelo, N.verde];
  for (let i = 0; i < 13; i++) { const X = Math.round(cx - rx * 0.91 + i * (rx * 1.82 / 12)), Y = Math.round(cy + 1.4 + Math.sin(i / 12 * Math.PI) * ry * 0.18), col = L[i % 4]; Q.N(X, Y, lite(col, 0.35)); Q.N(X + 1, Y, col); Q.N(X, Y + 1, col); Q.mark('luz', X, Y, { c: col }); }
}
// o planeta com anel do adesivo: listras vermelhas e laranja, o anel inclinado na frente (r o raio)
function ringPlanet(P, cx, cy, r, neon = false) {
  const strip = ['#ff3b3b', '#ff9a2e', '#ffd07e', '#ff6a2a', '#c02a2a', '#ff9a2e', '#ff3b3b'];
  const ringA = -0.32, ca = Math.cos(ringA), sa = Math.sin(ringA), Rx = r * 1.9, Ry = r * 0.5;
  const inRing = (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = (dx * ca + dy * sa) / Rx, v = (-dx * sa + dy * ca) / Ry, d = u * u + v * v; return d <= 1 && d >= 0.55 ? { u, v, d } : null; };
  // o anel de trás
  for (let y = Math.floor(cy - r * 2); y <= cy + r * 2; y++) for (let x = Math.floor(cx - Rx - 1); x <= cx + Rx + 1; x++) { const R = inRing(x, y); if (R && R.v < 0) { if (neon) P.N(x, y, R.d > 0.8 ? '#ffb05a' : '#c8642a'); else P.put(x, y, RP.laranja, 2.2 + R.d); } }
  P.ell(cx, cy, r, r, (x, y, dx, dy, d) => {
    const band = Math.floor((dy * 0.92 + dx * 0.28 + 1) * 3.4), sh = -(dx + dy) * 0.9 - d * 0.6;
    const col = strip[clamp(band, 0, 6)];
    if (neon) P.N(x, y, sh > 0.1 ? lite(col, 0.2) : sh < -0.9 ? mixHex(col, '#2a0808', 0.45) : col);
    else P.put(x, y, band % 2 ? RP.laranja : RP.verm, 3 + sh);
  });
  for (let y = Math.floor(cy - r * 2); y <= cy + r * 2; y++) for (let x = Math.floor(cx - Rx - 1); x <= cx + Rx + 1; x++) { const R = inRing(x, y); if (R && R.v >= 0) { if (neon) P.N(x, y, R.d > 0.8 ? '#ffe0a0' : '#ff9a2e'); else P.put(x, y, RP.laranja, 3.4 + R.d); } }
}

/* =============================== A CRATERA DE IMPACTO =============================== */
function escapePod(k) {   // 50 x 30: a cápsula de fuga caída de lado, a escotilha aberta mostrando o banco e o painel aceso (k 1: em pé, torta e meio enterrada)
  const Q = painter(44, 24), s = 24201 + k;
  // o casco em pílula: liga branca, a faixa vermelha, a base queimada
  for (let y = 0; y < 24; y++) for (let x = 0; x < 44; x++) {
    const ex = x < 12 ? (12 - x - 0.5) / 12 : x > 31 ? (x + 0.5 - 32) / 12 : 0, dy = (y + 0.5 - 12) / 12;
    if (ex * ex + dy * dy > 1) continue;
    const u = dy, sh = 3.3 - u * 1.5 - u * u * 0.6 + (u > -0.7 && u < -0.45 ? 1.2 : 0) - ex * 0.6 + cg(x, y, s) * 0.3;
    Q.put(x, y, Math.abs(x - 30) < 2 ? RP.verm : RP.liga, sh);
  }
  // a escotilha aberta: o buraco escuro, o banco, o painel com três luzes verdes
  Q.ell(17, 11, 8.5, 7.5, (x, y, dx, dy, d) => Q.put(x, y, d > 0.72 ? RP.prata : RP.negro, d > 0.72 ? 3.6 - dy * 1.4 : 0.6 + d * 0.6 + (dx > 0.3 ? 0.8 : 0)));
  Q.rect(12, 12, 8, 4, RP.casco, (i, j) => 2.6 - j * 0.4 - i * 0.05); Q.rect(13, 6, 3, 7, RP.casco, (i, j) => 2.2 - i * 0.3);
  for (let i = 0; i < 3; i++) Q.N(21 + i * 1.5, 8, i === 1 ? N.ciano : N.verde);
  Q.N(20, 10, N.rosa); Q.N(21, 10, lite(N.rosa)); Q.mark('botao', 20, 10, { c: N.rosa });
  // a janelinha redonda e os rebites
  Q.ell(37, 9, 3, 3, (x, y, dx, dy, d) => Q.put(x, y, d > 0.55 ? RP.prata : RP.vidro, d > 0.55 ? 4 - dy : 2.4 - (dx + dy) + (dx < -0.2 && dy < -0.2 ? 2 : 0)));
  for (let x = 4; x < 42; x += 5) { Q.put(x, 20, RP.liga, 4.6); Q.put(x, 3, RP.liga, 4.6); }
  for (let x = 0; x < 44; x++) for (let y = 0; y < 24; y++) if (Q.has(x, y) && (x < 5 || y > 19)) Q.tint(x, y, '#100c08', 0.35 + hash2(x, y, s) * 0.3);
  scorch(Q, s, (x, y) => (x < 10 ? 0.4 : 0) + (y > 17 ? 0.3 : -0.2));
  const W = 50, H = 30, P = painter(W, H);
  if (!k) {
    blit(P, Q, 2, 4, 0.06, 22, 12);
    // a porta caída no chão, encostada
    P.ell(42, 25, 7, 3.4, (x, y, dx, dy, d) => P.put(x, y, d > 0.6 ? RP.prata : RP.liga, d > 0.6 ? 3.2 - dy : 3.6 - dy * 1.2 + cg(x, y, s) * 0.3));
    P.N(40, 24, N.verde);
    rubble(P, 0, 49, H - 1, 3, RP.escoria, s + 3, true);
  } else {
    blit(P, Q, 4, 2, -1.15, 22, 12);
    rubble(P, 0, 49, H - 1, 6, RP.escoria, s + 3, true);
    rubble(P, 8, 40, H - 1, 4, RP.vidroI, s + 5);
  }
  return P.done();
}
function rocket(k) {   // 46 x 76: o foguete vermelho do adesivo, enfiado de bico na rocha (k 0 quase reto, k 1 mais deitado); o bocal para cima solta fumaça
  const Q = painter(30, 66), s = 24221 + k, cx = 15;
  // o corpo: um cilindro vermelho que afina no bico (para baixo)
  for (let y = 10; y < 66; y++) {
    const t = (y - 10) / 56, hw = t < 0.62 ? 7.5 : 7.5 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.62) / 0.38, 2))) + 0.6;
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const u = (x + 0.5 - cx) / hw; Q.put(x, y, RP.verm, 3.2 - u * 1.4 - u * u * 0.7 + (u > -0.6 && u < -0.3 ? 1.4 : 0) + cg(x, y, s) * 0.3); }
  }
  // as faixas brancas e a janela redonda (aro prata, vidro azul, brilho)
  for (const yb of [16, 44]) for (let x = 7; x <= 23; x++) for (let j = 0; j < 2; j++) if (Q.has(x, yb + j)) { const u = (x + 0.5 - cx) / 7.5; Q.put(x, yb + j, RP.branco, 3.6 - u * 1.3 - j * 0.6); }
  Q.ell(cx, 29, 5.2, 5.2, (x, y, dx, dy, d) => { if (d > 0.62) Q.put(x, y, RP.prata, 3.8 - (dx + dy) * 1.1); else Q.put(x, y, RP.azul, 2.6 - (dx + dy) * 1.2 + (dx < -0.25 && dy < -0.25 && d > 0.15 ? 2.6 : 0)); });
  Q.put(cx - 2, 27, RP.branco, 5); Q.put(cx - 1, 26, RP.branco, 4.6);
  // as aletas: duas laterais laranja-amarelo e a do meio, de cima (a cauda está para cima)
  for (const sd of [-1, 1]) for (let j = 0; j < 16; j++) { const y = 8 + j, w = Math.round(j < 6 ? 2 + j * 0.9 : 7.4 - (j - 6) * 0.45); for (let i = 0; i < w; i++) { const x = cx + sd * (7 + i); Q.put(x, y, i > w - 3 ? RP.amarelo : RP.laranja, 3.2 - i * 0.12 - j * 0.05 + (sd < 0 ? 0.6 : -0.4) + (i === w - 1 ? 1 : 0)); } }
  for (let y = 8; y < 26; y++) { Q.put(cx, y, RP.laranja, 2.4); Q.put(cx + 1, y, RP.amarelo, 3.6); }
  // o bocal (prata escura) em cima, com a boca preta
  for (let y = 2; y < 10; y++) { const hw = 3 + (9 - y) * 0.45; for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const u = (x + 0.5 - cx) / hw; Q.put(x, y, RP.casco, 3.2 - u * 1.2 + (y === 2 ? 1 : 0)); } }
  for (let x = cx - 5; x <= cx + 5; x++) Q.put(x, 1, RP.negro, 1);
  Q.mark('bocal', cx + 0.5, 1);
  // queimado da chama: fuligem na cauda e nas aletas, um risco de calor laranja ainda aceso na boca
  scorch(Q, s, (x, y) => 0.75 - y / 22 + (Math.abs(x - cx) > 8 ? 0.25 : 0), 0.9);
  for (let x = cx - 3; x <= cx + 3; x++) Q.N(x, 2, x % 2 ? N.amarelo : '#ff7a2a');
  const W = k ? 60 : 46, H = 78, P = painter(W, H), ang = k ? 0.5 : 0.2, mc = k ? 13 : 19;
  blit(P, Q, k ? 8 : 8, k ? 8 : 6, ang, 15, 40);
  // a rocha rachada em volta do bico: escória e vidro de impacto, rachaduras verdes acesas
  for (let y = H - 14; y < H; y++) for (let x = 0; x < W; x++) { const t = (y - (H - 14)) / 14, hw = 7 + t * 13 + cn(x, y, 20, 20, s) * 5; if (Math.abs(x + 0.5 - mc) > hw) continue; P.put(x, y, hash2(x >> 2, y >> 2, s) < 0.3 ? RP.vidroI : RP.escoria, 2.4 + (1 - t) * 0.8 - (x - 10) * 0.03 + cg(x, y, s) * 0.6 + cn(x, y, 9, 9, s + 2) * 0.8); }
  rubble(P, 1, W - 2, H - 1, 8, RP.escoria, s + 3, true);
  return P.done();
}
function hullPlate(k) {   // 42 x 46: uma placa do casco enfiada torta no chão, a beira de cima rasgada em dentes, uma ponta dobrada para a frente, o tubo de neon meio aceso e faiscando onde partiu (k 1: mais larga, ciano)
  const W = 42, H = 46, P = painter(W, H), s = 24241 + k;
  const lean = k ? -0.12 : 0.16, L = (x, y) => [x + (44 - y) * lean, y];
  const pts = (k ? [[3, 45], [5, 18], [10, 13], [13, 19], [18, 11], [22, 16], [29, 7], [34, 12], [39, 45]] : [[6, 45], [8, 15], [12, 10], [15, 16], [19, 6], [23, 12], [27, 4], [33, 9], [35, 45]]).map(([x, y]) => L(x, y));
  const inside = (x, y) => inPoly(pts, x + 0.5, y + 0.5);
  plating(P, 0, 0, W, H, RP.casco, s, 11, 9, inside, 2.4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inside(x, y)) continue;
    if (!inside(x, y - 1)) { P.put(x, y, RP.prata, 4.4 - x * 0.03); if (inside(x, y + 1)) P.put(x, y + 1, RP.casco, 3.6); }
    else if (!inside(x - 1, y)) P.put(x, y, RP.casco, 4.2);
    else if (!inside(x + 1, y)) P.put(x, y, RP.casco, 1.2);
  }
  // a ponta dobrada para a frente: o avesso da chapa, mais claro e liso
  const f = (k ? [[29, 7], [34, 12], [31, 18], [26, 14]] : [[27, 4], [33, 9], [30, 15], [25, 11]]).map(([x, y]) => L(x, y));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inPoly(f, x + 0.5, y + 0.5)) P.put(x, y, RP.prata, 3.4 - (x + y - 30) * 0.06 + cg(x, y, s) * 0.15);
  // o tubo de neon numa calha: aceso até onde partiu, a ponta pendurada faiscando
  const nc = k ? N.ciano : N.rosa, ty = 24, xs = []; for (let x = 0; x < W; x++) if (inside(x, ty) && inside(x, ty + 2) && inside(x - 1, ty) && inside(x + 1, ty)) xs.push(x);
  if (xs.length) {
    const a = xs[0] + 1, bnd = a + Math.round((xs[xs.length - 1] - a) * 0.6), e = xs[xs.length - 1] - 1;
    for (let x = a - 1; x <= e + 1; x++) { P.put(x, ty - 1, RP.negro, 2.4); P.put(x, ty + 2, RP.negro, 1.2); }
    P.nline(a, ty, bnd, ty, nc);
    for (let x = bnd + 2; x <= e; x++) { P.put(x, ty, RP.negro, 1.4); P.put(x, ty + 1, RP.prata, 2.6); }
    P.N(bnd + 1, ty + 1, lite(nc, 0.3)); P.N(bnd + 1, ty + 2, nc); P.mark('faisca', bnd + 1, ty + 1);
  }
  // sinais alienígenas pintados (amarelo gasto): três glifos de traços
  for (let j = 0; j < 3; j++) { const x = 13 + j * 5 + (k ? -2 : 0) + Math.round((44 - 32) * lean), y = 31; if (!inside(x, y) || !inside(x + 2, y + 3)) continue; P.put(x, y, RP.amarelo, 2.8); P.put(x + 1, y, RP.amarelo, 2.6); P.put(x, y + 1, RP.amarelo, 2.4); P.put(x + (j % 2 ? 2 : 0), y + 2, RP.amarelo, 2.4); P.put(x + 1, y + 3, RP.amarelo, 2.2); }
  scorch(P, s, (x, y) => (y > H - 12 ? 0.35 : -0.25) + (x > 30 ? 0.15 : 0));
  rubble(P, 1, 41, H - 1, 5, RP.escoria, s + 3, true);
  return P.done();
}
function antenna(k) {   // 26 x 46: a antena quebrada: o pé com chapa, o mastro de treliça listrado de vermelho e branco, o prato amassado, fios soltos, o farol vermelho no alto; a ponta faísca (k 1: o mastro partido no meio, o prato no chão)
  const W = 26, H = 46, P = painter(W, H), s = 24261 + k;
  P.box(7, H - 6, 12, 6, RP.casco, s, 2.6); P.rect(9, H - 9, 8, 3, RP.casco, (i, j) => 3 - i * 0.2 + (j === 0 ? 1 : 0));
  const top = k ? [17, 18] : [16, 6];
  const mx0 = 13, my0 = H - 9, mast = (t, o) => [mx0 + o + (top[0] - mx0) * t, my0 + (top[1] - my0) * t];
  for (const o of [-1.5, 1.5]) tube(P, t => mast(t, o), () => 1.6, RP.branco, s, 2.6);
  for (let t = 0.08; t < 1; t += 0.13) { const [x, y] = mast(t, 0); P.line(x - 1.5, y, x + 1.5, y - 2.5, RP.prata, 2.4); }
  // as listras vermelhas do mastro
  { const me = P.idOf(RP.branco); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k2 = y * W + x; if (P.rid[k2] === me && Math.floor((y - top[1]) / 4) % 2 === 0) P.put(x, y, RP.verm, P.val[k2] - 0.2); } }
  if (!k) {
    // o prato amassado no alto, virado para a esquerda, com a haste do receptor
    P.ell(10, 8, 6, 7, (x, y, dx, dy, d) => { if (dx > 0.25) return; P.put(x, y, RP.branco, 3.6 - dy * 1.2 - (dx + 1) * 0.5 + (Math.abs(dx * 0.8 + dy * 0.4 + 0.1) < 0.1 ? -1.6 : 0) + cg(x, y, s) * 0.2); });
    P.line(10, 8, 4, 7, RP.prata, 3.4); P.blob(4, 7, 1.2, 1.2, RP.casco, s, 2);
    P.mark('faisca', 4, 7);
    P.N(16, 4, '#ff3b3b'); P.N(16, 3, '#ffb0a0'); P.mark('botao', 16, 4, { c: '#ff3b3b' });
  } else {
    // a ponta partida e o prato caído no chão
    for (let j = 0; j < 4; j++) P.put(top[0] + (j % 2), top[1] - 1 - j, RP.prata, 4 - j * 0.5);
    P.ell(5, H - 4, 5, 3, (x, y, dx, dy, d) => P.put(x, y, RP.branco, 3.2 - dy * 1.4 + cg(x, y, s) * 0.2));
    P.mark('faisca', top[0] + 1, top[1] - 4);
    P.N(22, H - 3, '#ff3b3b'); P.mark('botao', 22, H - 3, { c: '#ff3b3b' });
  }
  // os fios soltos pendurados
  for (const [x0, y0, l] of [[top[0] - 1, top[1] + 2, 8], [top[0] + 2, top[1] + 4, 12]]) for (let j = 0; j < l; j++) P.put(x0 + Math.round(Math.sin(j * 0.5) * 1.2) + (j > l / 2 ? 1 : 0), y0 + j, j % 7 < 4 ? RP.amarelo : RP.cabo, 3);
  P.N(10, H - 4, N.verde); P.N(15, H - 4, N.ciano);
  rubble(P, 2, 24, H - 1, 2, RP.escoria, s + 2, true);
  return P.done();
}
function gooCrater() {   // 52 x 22: a cratera fumegante de gosma: as duas bordas de escória e vidro, a poça verde acesa dentro da tigela, escorrendo pelas beiras, bolhas e vapor
  const W = 52, H = 22, P = painter(W, H), s = 24281, gt = [];
  for (let x = 0; x < W; x++) {
    const t = (x + 0.5) / W, lip = Math.max(Math.exp(-Math.pow((t - 0.12) / 0.09, 2)), Math.exp(-Math.pow((t - 0.88) / 0.09, 2))), h = Math.round(2 + lip * 11 + cn(x, 0, 8, 4, s) * 1.5);
    gt[x] = H - h;
    for (let y = H - h; y < H; y++) P.put(x, y, hash2(x >> 2, y >> 1, s) < 0.28 ? RP.vidroI : RP.escoria, 2.3 + (y === H - h ? 1.4 : 0) - t * 0.5 + (t > 0.5 && t < 0.88 ? 0.4 : 0) + cg(x, y, s) * 0.5 + cn(x, y, 7, 7, s + 1) * 0.5);
  }
  // a gosma enche a tigela até sy: a superfície acesa, o corpo em rampa
  const sy = H - 8;
  for (let x = 0; x < W; x++) { if (gt[x] <= sy + 1) continue; for (let y = sy; y < gt[x] + 1 && y < H; y++) { if (y === sy) P.N(x, y, x % 5 ? lite(N.verde, 0.3) : '#ffffff'); else if (y === sy + 1) P.N(x, y, N.verde); else P.put(x, y, RP.gosma, 4.2 - (y - sy) * 0.35 + cn(x, y, 6, 6, s + 4) * 0.5); } }
  // escorrendo pelas beiras de dentro e pingando por fora da borda direita
  for (const [x0, l, d] of [[8, 4, -1], [44, 5, 1]]) for (let j = 0; j < l; j++) { const x = x0 + d * Math.round(j * 0.5), y = gt[x0] + j; if (P.has(x, y)) P.N(x, y, j < l - 1 ? N.verde : lite(N.verde)); }
  for (const [x, r] of [[19, 2], [28, 1.5], [36, 2.5]]) P.ell(x, sy, r, r * 0.8, (xx, yy, dx, dy) => { if (dy < 0.1) P.N(xx, yy, dx + dy < -0.5 ? '#ffffff' : lite(N.verde, 0.45)); });
  P.mark('bolha', 12, sy, { w: 28, top: sy - 6 });
  rubble(P, 0, 51, H - 1, 2, RP.escoria, s + 2, true);
  return P.done();
}
function flag(k) {   // 24 x 42: a bandeira de astronauta fincada: o mastro, a barra de cima, o pano azul com o planeta com anel e estrelas (k 1: rasgada e caída, um capacete no pé)
  const W = 24, H = 42, P = painter(W, H), s = 24301 + k;
  for (let y = 2; y < H - 2; y++) { P.put(4, y, RP.prata, 4); P.put(5, y, RP.prata, 2.6); }
  P.put(4, 1, RP.prata, 5); P.put(5, 1, RP.prata, 4);
  const fy = 4, fh = 13;
  for (let x = 6; x < 22; x++) P.put(x, fy - 1, RP.prata, 3.6 - x * 0.05);
  for (let y = fy; y < fy + fh; y++) for (let x = 6; x < 22; x++) {
    const t = (x - 6) / 16, wave = Math.round(Math.sin(t * 5 + y * 0.2) * 0.7);
    if (k && (y - fy > fh - 4 + Math.round(Math.sin(x * 1.7) * 2) || (x > 17 && y - fy > 6))) continue;
    P.put(x, y + (k ? Math.round(t * t * 2) : 0), RP.azul, 2.8 + wave * 0.8 - t * 0.4 + cg(x, y, s) * 0.3);
  }
  // o emblema: o planeta com anel, estrelinhas
  { const Q = painter(14, 12); ringPlanet(Q, 7, 6, 3); blit(P, Q, 7, fy, 0, 0, 0); }
  for (const [x, y] of [[19, fy + 2], [8, fy + 10], [20, fy + 9]]) P.put(x, y, RP.branco, 5);
  // as pedrinhas em volta do pé
  rubble(P, 0, 12, H - 1, 3, RP.vidroI, s + 3);
  if (k) {
    P.ell(15, H - 5, 5, 4.5, (x, y, dx, dy, d) => { if (y > H - 2) return; if (d > 0.42 || dx < -0.5) P.put(x, y, RP.branco, 3.8 - (dx + dy) * 1.2 + cg(x, y, s) * 0.3); else P.put(x, y, RP.negro, 1.4 + (dx + dy < -0.5 ? 2.5 : 0)); });
    P.N(16, H - 6, N.rosa); P.N(17, H - 5, lite(N.ciano, 0.3));
  }
  return P.done();
}
function saucerWing() {   // 58 x 44: um pedaço da borda de um disco voador, um quarto de disco em pé enfiado no chão: a chapa prata com os anéis, a faixa preta da borda com as luzes apagadas (uma ainda pisca), a beira rasgada com a fiação faiscando
  const W = 58, H = 44, P = painter(W, H), s = 24321, cx = 54, cy = 48, R = 46;
  const torn = (x, y) => x < 47 + Math.round(Math.sin(y * 1.3) * 2 + (y % 4 === 0 ? 2 : 0)) && y > 2 + (x > 30 ? Math.round(Math.sin(x * 1.1) * 1.5 + (x % 5 === 0 ? 2 : 0)) : 0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); if (d > R || !torn(x, y)) continue;
    const a = Math.atan2(dy, dx), lit = Math.cos(a - Math.PI * 1.25);   // a luz vem de cima à esquerda
    if (d > R - 6) P.put(x, y, RP.negro, 1.6 + (d > R - 1.5 ? 1.6 : 0) + lit * 0.5 + cg(x, y, s) * 0.12);
    else P.put(x, y, RP.prata, 3 + lit * 0.9 + (Math.abs(d - (R - 15)) < 0.6 || Math.abs(d - (R - 26)) < 0.6 ? -1 : 0) + (Math.abs(d - (R - 8)) < 0.8 ? 1 : 0) + cg(x, y, s) * 0.12);
  }
  // as luzes da borda: só uma ainda acende
  for (let i = 0; i < 7; i++) { const a = Math.PI * 1.02 + i * 0.075, x = Math.round(cx + Math.cos(a) * (R - 3.2)), y = Math.round(cy + Math.sin(a) * (R - 3.2)); if (!P.has(x, y) || !torn(x, y)) continue; if (i === 4) { P.N(x, y, lite(N.amarelo, 0.35)); P.N(x + 1, y, N.amarelo); P.N(x, y + 1, N.amarelo); P.mark('botao', x, y, { c: N.amarelo }); } else { P.put(x, y, RP.cabo, 3.4); P.put(x + 1, y, RP.cabo, 2.4); P.put(x, y + 1, RP.cabo, 2); } }
  // a beira rasgada: a borda escura, as farpas e os fios saindo
  for (let y = 0; y < H; y++) for (let x = 1; x < W; x++) if (P.has(x - 1, y) && !P.has(x, y) && x > 30) { P.put(x - 1, y, RP.casco, 1); P.put(x - 2, y, RP.prata, 4.2); }
  for (const [y, c, l] of [[16, RP.verm, 5], [20, RP.amarelo, 4], [26, RP.cabo, 6]]) { let x0 = 40; while (x0 < W - 1 && P.has(x0 + 1, y)) x0++; for (let j = 1; j <= l; j++) P.put(x0 + j, y + (j > 3 ? 1 : 0), c, 3.2); if (y === 20) P.mark('faisca', x0 + l, y); }
  scorch(P, s, (x, y) => (x > 36 ? 0.35 : -0.2) + (y > 34 ? 0.2 : 0));
  rubble(P, 0, 57, H - 1, 6, RP.escoria, s + 3, true);
  return P.done();
}
/* =============================== O CASCO =============================== */
function saucer(k) {   // 92 x 50: o disco voador do adesivo estacionado: cúpula branca de vidro com a sombra de um ET dentro, o disco prata e preto, a faixa de luzes na borda, o emissor ciano embaixo, três pés (k 1: torto, um pé quebrado)
  const Q = painter(90, 44), s = 24401 + k, cx = 45;
  // os pés (atrás do disco): hastes prata e sapatas
  const legs = k ? [[22, 30, 16, 43], [68, 30, 74, 43]] : [[22, 30, 14, 43], [45, 32, 45, 43], [68, 30, 76, 43]];
  for (const [x0, y0, x1, y1] of legs) { tube(Q, t => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t], () => 2.4, RP.prata, s, 2.4); Q.rect(x1 - 3, y1, 7, 1, RP.casco, (i) => 3.4 - i * 0.2); Q.rect(x1 - 2, y1 - 1, 5, 1, RP.casco, (i) => 2.6); }
  discBody(Q, cx, 25, 44, 9, s);
  Q.ell(cx, 32, 7, 2.2, (x, y, dx, dy, d) => Q.N(x, y, d < 0.35 ? '#e8fbff' : d < 0.7 ? N.ciano : '#1a8aa0'));
  // a cúpula: vidro branco-azulado, a sombra do ET dentro (cabeça grande, olhos pretos), o brilho grande à esquerda
  Q.ell(cx, 18, 15, 13, (x, y, dx, dy, d) => {
    if (dy > 0.5) return;
    const et = Math.hypot((dx + 0.02) * 1.35, (dy + 0.22) * 1.05) < 0.4 || (Math.abs(dx) < 0.3 - (dy - 0.1) * 0.2 && dy > 0.12);
    let v = 4.4 - (dx + dy) * 0.8 - d * 0.7 - (et ? 1.2 : 0);
    Q.put(x, y, et ? RP.liga : RP.branco, v + cg(x, y, s) * 0.12);
    if (et && Math.abs(Math.abs(dx) - 0.16) < 0.1 && dy > -0.4 && dy < -0.2) Q.put(x, y, RP.negro, 1.2);
    if (dx < -0.42 && dx > -0.72 && dy < -0.12 && dy > -0.62) Q.put(x, y, RP.branco, 5);
  });
  for (let x = cx - 14; x <= cx + 14; x++) { Q.put(x, 24, RP.prata, 4 - (x - cx) * 0.06); Q.put(x, 23, RP.branco, 2.2 - (x - cx) * 0.03); }
  Q.N(cx, 5, '#ffffff'); Q.N(cx, 4, N.rosa); Q.mark('topo', cx, 4, { c: N.rosa });
  const W = 92, H = 50, P = painter(W, H);
  if (!k) blit(P, Q, 1, 6, 0, 0, 0);
  else { blit(P, Q, 1, 4, 0.09, 45, 30); rubble(P, 0, 30, H - 1, 3, RP.escoria, s + 3); P.line(66, 44, 75, 46, RP.prata, 2.6, 2); }
  return P.done();
}
function controlPanel(k) {   // 42 x 32: o painel de controle: a mesa inclinada com fileiras de botões de neon, a tela ciano com a onda, as alavancas (k 1: alto, com mostradores redondos)
  const W = 42, H = 32, P = painter(W, H), s = 24421 + k;
  if (!k) {
    // o pé e o corpo
    P.box(3, 14, 36, 18, RP.casco, s, 2.4);
    for (let x = 6; x < 37; x += 6) for (let y = 19; y < 30; y++) P.put(x, y, RP.casco, 1.4);
    // a mesa inclinada
    for (let y = 6; y < 15; y++) { const off = Math.round((14 - y) * 0.5); for (let x = 1 + off; x < 41 - off; x++) P.put(x, y, RP.casco, 3 + (y === 6 ? 1.2 : 0) - (x - 1) * 0.02 + cg(x, y, s) * 0.3); }
    for (let x = 1; x < 41; x++) P.put(x, 14, RP.prata, 3.6);
    // a tela
    P.rect(4, 0, 18, 7, RP.negro, (i, j) => 0.8 + (i === 0 || j === 0 ? 2 : 0));
    for (let x = 5; x < 21; x++) { const y = 3 + Math.round(Math.sin(x * 0.9) * 1.6 * Math.sin(x * 0.23 + 1)); P.N(x, y, N.ciano); if (x % 4 === 0) P.N(x, 5, '#1a8aa0'); }
    // os botões: três fileiras
    const cols = [N.rosa, N.verde, N.ciano, N.amarelo, N.violeta];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const x = 6 + i * 4 + r, y = 8 + r * 2; const c = cols[(i * 3 + r) % 5]; if ((i + r) % 3 === 2) { P.put(x, y, RP.cabo, 3); P.put(x + 1, y, RP.cabo, 2); } else { P.N(x, y, lite(c, 0.4)); P.N(x + 1, y, c); P.mark('botao', x, y, { c }); } }
    // as alavancas
    for (const x of [33, 36]) { P.line(x, 7, x - 1, 2, RP.prata, 3.6); P.blob(x - 1, 2, 1.2, 1.2, RP.verm, s, 3); }
    P.N(30, 9, N.verde);
  } else {
    P.box(6, 2, 30, 30, RP.casco, s, 2.4);
    for (let y = 2; y < 32; y += 10) for (let x = 6; x < 36; x++) P.put(x, y, RP.casco, 3.8);
    // dois mostradores redondos com ponteiro
    for (const [mx, my, c] of [[14, 10, N.verde], [28, 10, N.rosa]]) { P.ell(mx, my, 5, 5, (x, y, dx, dy, d) => { if (d > 0.7) P.put(x, y, RP.prata, 3.8 - (dx + dy)); else P.put(x, y, RP.negro, 1 + (dx + dy < -0.6 ? 1 : 0)); }); for (let a = Math.PI * 0.8; a < Math.PI * 2.2; a += 0.35) P.N(mx + Math.cos(a) * 2.8, my + Math.sin(a) * 2.8, mixHex(c, '#000000', 0.45)); P.line(mx, my, mx + 2.4, my - 2, RP.branco, 5); P.N(mx, my, c); }
    // a grade de botões e a fenda de cartão
    const cols = [N.ciano, N.amarelo, N.violeta, N.verde];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const x = 10 + i * 4, y = 19 + r * 3, c = cols[(i + r) % 4]; if ((i * r) % 4 === 1) { P.put(x, y, RP.cabo, 3); P.put(x + 1, y, RP.cabo, 2); } else { P.N(x, y, lite(c, 0.4)); P.N(x + 1, y, c); P.mark('botao', x, y, { c }); } }
    P.rect(16, 28, 10, 1, RP.negro, () => 0.4);
    for (let x = 0; x < 6; x++) { P.put(x, 20 + Math.round(Math.sin(x)), RP.cabo, 3); P.put(x + 36, 24 + Math.round(Math.cos(x)), RP.cabo, 3); }
  }
  return P.done();
}
function neonSign(k) {   // 52 x 40: o cartaz holográfico: a moldura escura, o tubo de neon rosa em volta, o ET do adesivo (cabeça verde enorme, olhos pretos amendoados) acenando (o braço é animado), estrelas; k 1: com um disquinho em cima soltando o feixe arco-íris
  const W = 52, H = 40, P = painter(W, H), s = 24441 + k;
  P.box(0, 0, W, H, RP.casco, s, 1.6);
  P.rect(3, 3, W - 6, H - 6, RP.negro, (i, j, x, y) => 0.6 + cn(x, y, 8, 8, s) * 0.3 + (j % 3 === 0 ? 0.4 : 0));   // linhas de varredura
  P.nline(4, 2, W - 5, 2, N.rosa); P.nline(4, H - 4, W - 5, H - 4, N.rosa); P.nline(2, 4, 2, H - 5, N.rosa); P.nline(W - 4, 4, W - 4, H - 5, N.rosa);
  P.N(3, 3, N.rosa); P.N(W - 4, 3, N.rosa); P.N(3, H - 4, N.rosa); P.N(W - 4, H - 4, N.rosa);
  // o ET: a silhueta cheia de verde escuro (holograma) com o contorno de neon
  const ex = 18, ey = 14, G = N.verde;
  const inET = (x, y) => {
    const dx = (x + 0.5 - ex) / 7.5, dy = (y + 0.5 - ey) / 7.4; if (dx * dx + dy * dy <= 1 && !(dy > 0.25 && Math.abs(dx) > 1 - (dy - 0.25) * 1.3)) return true;   // a cabeça em gota
    if (y >= ey + 7 && y < ey + 10 && Math.abs(x + 0.5 - ex) < 1.2) return true;                                                                          // o pescoço fino
    if (y >= ey + 10 && y < H - 6) { const hw = 2.4 + (y - ey - 10) * 0.32; return Math.abs(x + 0.5 - ex) < hw; }                                         // o corpinho
    return false;
  };
  for (let y = 3; y < H - 5; y++) for (let x = 3; x < 36; x++) {
    if (!inET(x, y)) continue;
    if (!inET(x - 1, y) || !inET(x + 1, y) || !inET(x, y - 1) || !inET(x, y + 1)) P.N(x, y, G);
    else P.put(x, y, RP.pele, 1.5 - (x - ex) * 0.06 - (y - ey) * 0.03 + (Math.hypot(x - ex + 3, y - ey + 3) < 2.6 ? 1 : 0));
  }
  // os olhos pretos amendoados, inclinados, com o ponto de brilho
  for (const sd of [-1, 1]) { P.ell(ex + sd * 3.3, ey + 1.2, 2.8, 1.7, (x, y, dx, dy) => { if (dx * sd * -0.8 + dy > 0.8) return; P.put(x, y, RP.negro, 0.3); }); P.N(ex + sd * 3.3 - 1, ey + 0.5, '#ffffff'); }
  P.put(ex, ey + 5, RP.pele, 0.3); P.put(ex - 1, ey + 5, RP.pele, 0.6);
  P.nline(ex - 3, ey + 12, ex - 7, ey + 18, G, false);   // o braço parado
  P.mark('braco', ex + 2, ey + 12);                      // o ombro do braço que acena
  // as estrelas do adesivo e, no k 1, o disquinho com o feixe
  star4(P, 41, 8, N.amarelo, true); star4(P, 33, 27, N.ciano); star4(P, 46, 31, N.rosa);
  if (k) {
    P.ell(40, 15, 7, 2, (x, y, dx, dy, d) => P.N(x, y, d > 0.6 ? N.ciano : '#c8f0ff')); P.ell(40, 13, 3, 2, (x, y, dx, dy) => { if (dy < 0.2) P.N(x, y, '#e8fbff'); });
    for (let j = 0; j < 14; j++) { const hw = 1 + j * 0.45; for (const sd of [-1, 1]) P.N(40 + sd * hw, 17 + j, ARCO[Math.floor(j / 2.4) % 6]); }
  } else { P.nline(34, 16, 46, 16, N.violeta, false); P.nline(34, 19, 43, 19, N.violeta, false); P.nline(34, 22, 45, 22, N.violeta, false); }
  return P.done(false);
}
function planetPoster() {   // 46 x 42: o cartaz holográfico do planeta com anel: moldura com cantos ciano, o planeta listrado do adesivo, estrelas que piscam
  const W = 46, H = 42, P = painter(W, H), s = 24461;
  P.box(0, 0, W, H, RP.casco, s, 1.6);
  P.rect(2, 2, W - 4, H - 4, RP.reator, (i, j, x, y) => 0.4 + cn(x, y, 10, 10, s) * 0.4 + (j % 3 === 0 ? 0.35 : 0) - j * 0.01);
  for (const [x, y, sx, sy] of [[2, 2, 1, 1], [W - 3, 2, -1, 1], [2, H - 3, 1, -1], [W - 3, H - 3, -1, -1]]) for (let i = 0; i < 6; i++) { P.N(x + sx * i, y, N.ciano); P.N(x, y + sy * i, N.ciano); }
  ringPlanet(P, 23, 21, 9, true);
  for (let k = 0; k < 10; k++) { const x = 5 + hash2(k, 0, s) * 36, y = 5 + hash2(k, 1, s) * 32; if (Math.hypot(x - 23, (y - 21) * 1.6) < 20) continue; P.N(x, y, k % 3 ? '#c8d8ff' : N.amarelo); P.mark('estrela', x | 0, y | 0); }
  star4(P, 8, 34, N.amarelo); star4(P, 39, 8, N.rosa);
  return P.done(false);
}
function hexDoor() {   // 40 x 48: a porta hexagonal fechada: a moldura grossa de chapa, as duas folhas com a costura de neon ciano, a trava redonda com a luz vermelha, listras de aviso embaixo
  const W = 40, H = 48, P = painter(W, H), s = 24481, cx = 20, cy = 24;
  const hexD = (x, y, r) => { const dx = Math.abs(x + 0.5 - cx), dy = Math.abs(y + 0.5 - cy); return Math.max(dx * 0.866 + dy * 0.5, dy) / r; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = hexD(x, y, 23); if (d > 1) continue;
    if (d > 0.8) { P.put(x, y, RP.casco, 3.4 - (x - 2) * 0.03 - (y - 2) * 0.03 + (d < 0.84 ? -1 : 0) + (d > 0.96 ? 0.6 : 0) + cg(x, y, s) * 0.3); continue; }
    P.put(x, y, RP.liga, 2.6 - (x + 0.5 - cx) * 0.03 - (y - cy) * 0.02 + (Math.abs(((y + 2) % 6) - 0) < 0.6 ? -0.8 : 0) + cg(x, y, s) * 0.25);
  }
  for (let y = 0; y < H; y++) if (hexD(cx, y, 23) < 0.8 && hexD(cx - 1, y, 23) < 0.8) { P.N(cx - 1, y, N.ciano); P.N(cx, y, lite(N.ciano, 0.5)); }
  // a trava
  P.ell(cx, cy, 6, 6, (x, y, dx, dy, d) => { if (d > 0.6) P.put(x, y, RP.prata, 3.8 - (dx + dy) * 1.1); else P.put(x, y, RP.casco, 1.6 - (dx + dy) * 0.6); });
  for (let a = 0; a < 6.28; a += 1.047) P.put(cx + Math.cos(a) * 4.4, cy + Math.sin(a) * 4.4, RP.negro, 1);
  P.N(cx - 1, cy, '#ff3b3b'); P.N(cx, cy, '#ffb0a0'); P.N(cx, cy - 1, '#ff3b3b'); P.mark('botao', cx - 1, cy, { c: '#ff3b3b' });
  // as listras de aviso (amarelo e preto) embaixo da porta
  for (let y = H - 9; y < H - 5; y++) for (let x = 0; x < W; x++) { if (hexD(x, y, 23) > 0.8) continue; P.put(x, y, ((x + y) >> 1) % 2 ? RP.amarelo : RP.negro, ((x + y) >> 1) % 2 ? 3.2 - x * 0.03 : 1.5); }
  return P.done();
}
function fan() {   // 38 x 38: o ventilador grande: a caixa quadrada de chapa, a boca redonda escura com o anel ciano, o cubo (as pás giram ao vivo)
  const W = 38, H = 38, P = painter(W, H), s = 24501, c = 19;
  plating(P, 0, 0, W, H, RP.casco, s, 19, 19, null, 2.5);
  P.ell(c, c, 16, 16, (x, y, dx, dy, d) => { if (d > 0.88) P.put(x, y, RP.prata, 3.2 + (dx + dy) * 1.2); else P.put(x, y, RP.negro, 0.4 + d * 0.8 + (dx + dy > 0.6 ? 0.8 : 0)); });
  for (let a = 0; a < 6.283; a += 0.06) P.N(c + Math.cos(a) * 14.2, c + Math.sin(a) * 14.2, (a * 10 | 0) % 7 === 0 ? '#e8fbff' : '#1a8aa0');
  for (const [x, y] of [[3, 3], [W - 4, 3], [3, H - 4], [W - 4, H - 4]]) { P.put(x, y, RP.prata, 5); P.put(x + 1, y + 1, RP.casco, 1); }
  return P.done();
}
function hangLamp(k) {   // 28 x 22: a luminária de neon pendurada por dois cabos (k 0 tubo rosa, k 1 tubo ciano, k 2 anel violeta)
  const W = 28, H = 22, P = painter(W, H), s = 24521 + k;
  P.rect(5, 0, 18, 2, RP.casco, (i, j) => 3 - j - i * 0.04);
  if (k < 2) {
    for (const x of [7, 20]) for (let y = 2; y < 13; y++) P.put(x, y, RP.cabo, 3);
    P.rect(2, 13, 24, 4, RP.casco, (i, j) => 3.4 - j * 0.6 - i * 0.03 + (j === 0 ? 0.8 : 0));
    const col = k ? N.ciano : N.rosa;
    P.nline(3, 17, 24, 17, col); P.N(3, 18, col); P.N(24, 18, col);
  } else {
    for (let y = 2; y < 8; y++) P.put(14, y, RP.cabo, 3);
    P.rect(12, 8, 4, 2, RP.prata, (i) => 3.6 - i * 0.4);
    P.ell(14, 15, 11, 4.6, (x, y, dx, dy, d) => { if (d > 0.62) P.N(x, y, d > 0.82 ? N.violeta : lite(N.violeta, 0.45)); });
  }
  return P.done();
}
function porthole(k) {   // 34 x 34: a escotilha redonda de aro grosso com parafusos; pelo vidro, o céu holográfico (k 0 um planetinha com anel, k 1 uma galáxia em espiral)
  const W = 34, H = 34, P = painter(W, H), s = 24541 + k, c = 17;
  P.ell(c, c, 16.5, 16.5, (x, y, dx, dy, d) => {
    if (d > 0.62) { P.put(x, y, RP.casco, 3.2 - (dx + dy) * 1.2 + (Math.abs(d - 0.8) < 0.04 ? -1 : 0) + cg(x, y, s) * 0.3); return; }
    P.put(x, y, RP.reator, 0.3 + (1 - d) * 0.5 + cn(x, y, 12, 12, s) * 0.6);
  });
  for (let a = 0.4; a < 6.6; a += 0.785) { const x = c + Math.cos(a) * 14.6, y = c + Math.sin(a) * 14.6; P.put(x, y, RP.prata, 5); P.put(x + 1, y + 1, RP.casco, 0.8); }
  for (let i = 0; i < 9; i++) { const a = hash2(i, 0, s) * 6.28, r = hash2(i, 1, s) * 10, x = c + Math.cos(a) * r, y = c + Math.sin(a) * r; P.N(x, y, i % 3 ? '#c8d8ff' : '#ffffff'); P.mark('estrela', x | 0, y | 0); }
  if (!k) { const Q = painter(20, 14); ringPlanet(Q, 10, 7, 3.2, true); blit(P, Q, c - 6, c - 5, 0, 0, 0); }
  else for (let t = 0; t < 1; t += 0.012) for (const sd of [0, Math.PI]) { const a = t * 9 + sd, r = t * 8.5; P.N(c + Math.cos(a) * r, c + Math.sin(a) * r * 0.65, t < 0.25 ? '#fff0e0' : t < 0.6 ? '#c88aff' : '#5a3ab0'); }
  // o reflexo do vidro
  for (let j = 0; j < 7; j++) P.tint(c - 7 + j, c - 3 - j, '#e8fbff', 0.35);
  return P.done();
}
function cargo(k) {   // 42 x 28: caixas de carga alienígenas: aro de chapa com os cantos chanfrados, o painel fundo, cantoneiras prata, faixa de neon, glifos (k 0 pilha de três, k 1 uma grande e um tambor)
  const W = 42, H = 28, P = painter(W, H), s = 24561 + k;
  const crate = (x0, y0, w, h, R, col, sd) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (x + y < 2 || (w - 1 - x) + y < 2 || x + (h - 1 - y) < 2 || (w - 1 - x) + (h - 1 - y) < 2) continue;
      const fr = x < 2 || y < 2 || x > w - 3 || y > h - 3, X = x0 + x, Y = y0 + y;
      P.put(X, Y, R, fr ? (y < 2 || x < 2 ? 4 - (x > w - 3 ? 1.5 : 0) : 1.6) : 2.3 - x / w * 0.5 + (y === 2 ? -0.8 : 0) + (x === 2 ? -0.5 : 0) + cg(X, Y, sd) * 0.2);
    }
    for (const [cx, cy] of [[1, 1], [w - 3, 1], [1, h - 3], [w - 3, h - 3]]) P.rect(x0 + cx, y0 + cy, 2, 2, RP.prata, (i, j) => 4.4 - i * 0.8 - j * 0.8);
    const ny = y0 + (h >> 1); P.nline(x0 + 4, ny, x0 + w - 5, ny, col);
    for (let j = 0; j < 3; j++) { P.put(x0 + 4 + j * 3, y0 + 4, RP.amarelo, 3.4); P.put(x0 + 5 + j * 3, y0 + 4 + (j % 2), RP.amarelo, 3); }
  };
  if (!k) { crate(1, 12, 20, 16, RP.casco, N.verde, s); crate(21, 14, 18, 14, RP.liga, N.rosa, s + 1); crate(8, 0, 18, 12, RP.casco, N.ciano, s + 2); }
  else {
    crate(1, 4, 26, 24, RP.casco, N.violeta, s);
    cyl(P, 29, 10, 11, 18, RP.liga, s + 1, 2.4); for (const y of [10, 12, 25, 27]) for (let x = 29; x < 40; x++) P.put(x, y, RP.casco, 3.2 - (x - 29) * 0.18);
    for (let y = 15; y < 22; y++) P.N(34, y, y % 2 ? N.amarelo : '#c8b41a');
  }
  return P.done();
}
/* =============================== OS LABORATÓRIOS =============================== */
// os bichos de cima que boiam nas cápsulas (cada um num pintor de 18 x 32, desenhado em pé no meio)
function specimen(kind, s) {
  const Q = painter(18, 32), c = 9;
  if (kind === 'aranha') {
    Q.ell(c, 18, 5, 6, (x, y, dx, dy, d) => Q.put(x, y, RP.aranha, 3 - (dx + dy) * 1 - d * 0.6 + (Math.abs(dx) < 0.12 && dy < 0.4 ? 1 : 0) + cg(x, y, s) * 0.3));
    Q.ell(c, 10, 3.5, 3, (x, y, dx, dy) => Q.put(x, y, RP.aranha, 3.2 - (dx + dy)));
    for (const sd of [-1, 1]) for (let l = 0; l < 4; l++) { const y0 = 9 + l * 1.4; tube(Q, t => [c + sd * (2.5 + t * 6), y0 + Math.sin(t * Math.PI) * -3 + t * (l * 3 + 2)], () => 1.2, RP.aranha, s + l, 2.6); }
    Q.put(c - 1, 9, RP.verm, 5); Q.put(c + 1, 9, RP.verm, 5); Q.put(c, 8, RP.verm, 4);
  } else if (kind === 'esqueleto') {
    Q.ell(c, 5, 3.6, 4, (x, y, dx, dy) => Q.put(x, y, RP.osso, 4 - (dx + dy)));
    Q.put(c - 1, 5, RP.negro, 0); Q.put(c - 2, 5, RP.negro, 0); Q.put(c + 1, 5, RP.negro, 0); Q.put(c + 2, 5, RP.negro, 0); Q.put(c, 7, RP.negro, 1);
    for (let x = c - 2; x <= c + 2; x++) Q.put(x, 9, RP.osso, 3);
    for (let y = 9; y < 22; y++) Q.put(c, y, RP.osso, 3.4);
    for (let r = 0; r < 4; r++) for (let x = 1; x <= 4; x++) { Q.put(c - x, 11 + r * 2 + (x > 3 ? 1 : 0), RP.osso, 3.6 - x * 0.2); Q.put(c + x, 11 + r * 2 + (x > 3 ? 1 : 0), RP.osso, 3 - x * 0.2); }
    Q.ell(c, 22, 3.5, 1.6, (x, y) => Q.put(x, y, RP.osso, 3));
    for (const sd of [-1, 1]) { Q.line(c + sd * 4, 10, c + sd * 6, 20, RP.osso, 3.4); Q.line(c + sd * 2, 23, c + sd * 3, 31, RP.osso, 3); }
  } else if (kind === 'goblin') {
    Q.ell(c, 7, 4.2, 4.4, (x, y, dx, dy) => Q.put(x, y, RP.goblin, 3.4 - (dx + dy)));
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { Q.put(c + sd * (4 + i), 6 - i * 0.5, RP.goblin, 3 - i * 0.3); Q.put(c + sd * (4 + i), 7 - i * 0.3, RP.goblin, 2.4); }
    Q.put(c - 2, 7, RP.amarelo, 4); Q.put(c + 2, 7, RP.amarelo, 4); Q.put(c, 10, RP.negro, 1);
    Q.ell(c, 17, 4.2, 6, (x, y, dx, dy) => Q.put(x, y, RP.goblin, 3 - (dx + dy) * 0.9));
    Q.rect(c - 4, 20, 9, 3, RP.morcego, (i, j) => 3 - j * 0.6);
    for (const sd of [-1, 1]) { tube(Q, t => [c + sd * (4 + t * 2), 13 + t * 8], () => 1.8, RP.goblin, s, 2.6); tube(Q, t => [c + sd * (2 + t), 23 + t * 8], () => 2, RP.goblin, s, 2.4); }
  } else if (kind === 'larva') {
    for (let i = 0; i < 9; i++) { const a = -0.6 + i / 8 * 3.4, x = c + Math.cos(a) * 5.5, y = 16 + Math.sin(a) * 9; Q.blob(x, y, 3.6 - i * 0.12, 3.2, RP.larva, s + i, 2.8 + (i % 2) * 0.5); }
    Q.blob(c + Math.cos(-0.6) * 5.5 + 1, 16 + Math.sin(-0.6) * 9 - 1, 2.6, 2.4, RP.morcego, s, 3.2);
  } else {   // morcego, de asas abertas
    Q.ell(c, 14, 2.6, 4.4, (x, y, dx, dy) => Q.put(x, y, RP.morcego, 3.4 - (dx + dy)));
    Q.ell(c, 9, 2.4, 2.2, (x, y, dx, dy) => Q.put(x, y, RP.morcego, 3.6 - (dx + dy)));
    Q.put(c - 2, 6, RP.morcego, 3); Q.put(c + 2, 6, RP.morcego, 2.6); Q.put(c - 1, 9, RP.verm, 4.6); Q.put(c + 1, 9, RP.verm, 4.6);
    for (const sd of [-1, 1]) for (let i = 0; i < 8; i++) { const top = 10 + Math.abs(Math.sin(i * 0.9)) * 1.5, bot = 15 + i * 0.4 - (i % 3 === 2 ? 2 : 0); for (let y = top; y < bot; y++) Q.put(c + sd * (2 + i), y, RP.morcego, 2.2 - i * 0.08 + (y < top + 1 ? 1 : 0)); }
  }
  return Q;
}
const NV_ESPECIMES = ['aranha', 'esqueleto', 'goblin', 'larva', 'morcego'];
function specimenPod(k) {   // 26 x 52: a cápsula de espécime: o pedestal com o anel de neon, o cilindro de vidro cheio de gosma, o bicho boiando, a tampa com os cabos
  const W = 26, H = 52, P = painter(W, H), s = 24601 + k, x0 = 4, x1 = 22, y0 = 9, y1 = 43;
  // a gosma por trás do bicho
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const u = (x - x0) / (x1 - x0); P.put(x, y, RP.gosma, 0.9 + (y - y0) / (y1 - y0) * 0.6 - Math.abs(u - 0.45) * 1.1 + cn(x, y, 10, 10, s) * 0.4); }
  blit(P, specimen(NV_ESPECIMES[k], s), 4, 10, Math.sin(k * 2.1) * 0.15, 9, 16);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { if (P.rid[y * W + x] === P.idOf(RP.gosma)) continue; P.tint(x, y, '#3ad44e', 0.2); }
  for (let x = x0; x < x1; x++) { P.N(x, y0 + 2, x % 3 ? N.verde : lite(N.verde)); }   // a superfície da gosma
  glass(P, (x, y) => y >= y0 && y < y1 && x >= x0 && x < x1, x0, y0, x1 - x0, y1 - y0, '#9aff7a', 0.08);
  // a tampa e o pedestal
  P.box(2, 4, 22, 5, RP.casco, s, 2.8); P.rect(5, 1, 16, 3, RP.casco, (i, j) => 3.2 - j * 0.5 - i * 0.05);
  for (const x of [8, 12, 17]) for (let y = 0; y < 2; y++) P.put(x, y, RP.cabo, 3);
  P.box(1, 43, 24, 9, RP.casco, s + 1, 2.6);
  P.nline(3, 46, 22, 46, N.verde);
  P.N(5, 49, N.rosa); P.N(8, 49, N.ciano); P.mark('botao', 5, 49, { c: N.rosa });
  P.mark('bolha', x0 + 1, y1 - 1, { w: x1 - x0 - 2, top: y0 + 3 });
  return P.done();
}
function examTable() {   // 52 x 34: a mesa de exame: o tampo branco no pé de chapa, as correias, o poste com dois braços mecânicos (a broca e o laser de ponta vermelha)
  const W = 52, H = 34, P = painter(W, H), s = 24621;
  P.box(14, 22, 18, 12, RP.casco, s, 2.4); P.rect(11, 31, 24, 3, RP.casco, (i, j) => 3 - j * 0.7 - i * 0.03);
  for (let x = 1; x < 44; x++) { P.put(x, 18, RP.liga, 4.6 - x * 0.03); for (let y = 19; y < 22; y++) P.put(x, y, RP.liga, 3.2 - (y - 19) * 0.6 - x * 0.02); }
  P.ell(5, 17, 4, 1.6, (x, y, dx, dy) => { if (dy < 0.3) P.put(x, y, RP.liga, 4.2 - dx); });   // o apoio da cabeça
  for (const x of [12, 24, 36]) for (let y = 17; y < 22; y++) P.put(x, y, RP.negro, 2 + (y === 17 ? 1 : 0));
  P.nline(2, 22, 42, 22, N.violeta, false);
  // o poste
  P.rect(45, 2, 5, 32, RP.casco, (i, j) => 3.4 - i * 0.5 + (j % 8 === 0 ? 1 : 0)); P.rect(43, 0, 9, 3, RP.casco, (i, j) => 3.4 - j * 0.6);
  const arm = (pts, tool) => { for (let i = 0; i < pts.length - 1; i++) tube(P, t => [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t], () => 3, RP.liga, s + i, 3.2); for (const q of pts.slice(0, -1)) { P.blob(q[0], q[1], 2.2, 2.2, RP.casco, s, 3.2); P.put(q[0], q[1], RP.prata, 4.6); } tool(pts[pts.length - 1]); };
  // a broca: cai em cima do meio da mesa
  arm([[45, 5], [33, 3], [27, 9]], ([x, y]) => { P.rect(x - 2, y, 5, 2, RP.casco, (i) => 3.2 - i * 0.4); for (let j = 0; j < 5; j++) { P.put(x, y + 2 + j, RP.prata, 4.2 - j * 0.5); if (j < 3) P.put(x + 1, y + 2 + j, RP.prata, 2.4); } });
  // o laser: mais comprido, para a cabeça
  arm([[45, 11], [30, 8], [16, 11]], ([x, y]) => { P.rect(x - 1, y, 3, 3, RP.casco, (i) => 3 - i * 0.4); P.N(x, y + 3, '#ff3b3b'); P.mark('laser', x, y + 3, { c: '#ff3b3b' }); });
  P.N(47, 20, N.verde); P.N(47, 24, N.amarelo); P.mark('botao', 47, 20, { c: N.verde });
  return P.done();
}
function gooTank(k) {   // 32 x 40: o tanque de gosma borbulhando: base, o vidro (k 0 redondo, k 1 quadrado com um olho boiando), os canos em cima
  const W = 32, H = 40, P = painter(W, H), s = 24641 + k;
  const inside = k ? (x, y) => x >= 5 && x < 27 && y >= 7 && y < 33 : (x, y) => { const dx = (x + 0.5 - 16) / 12, dy = (y + 0.5 - 20) / 14; return dx * dx + dy * dy <= 1 && y >= 7; };
  const lvl = 13;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!inside(x, y)) continue; if (y < lvl) P.put(x, y, RP.vidro, 0.6 + cn(x, y, 8, 8, s) * 0.3); else if (y === lvl) P.N(x, y, x % 4 ? N.verde : lite(N.verde)); else P.put(x, y, RP.gosma, 2.6 + (y - lvl) * 0.03 - Math.abs(x - 15) * 0.07 + cn(x, y, 9, 9, s) * 0.7); }
  if (k) P.ell(19, 23, 3.6, 3.6, (x, y, dx, dy, d) => { P.put(x, y, RP.olho, 3.6 - (dx + dy)); if (d < 0.35) P.put(x, y, d < 0.15 ? RP.negro : RP.amarelo, d < 0.15 ? 0 : 3.4); });
  for (let y = lvl + 1; y < H; y++) for (let x = 0; x < W; x++) if (inside(x, y) && hash2(x, y, s) < 0.03) P.N(x, y, '#c8ff7a');
  glass(P, inside, 4, 6, 24, 28, '#9aff7a', 0.05);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x, y) && !inside(x - 1, y)) P.put(x, y, RP.prata, 3.6);
  P.box(3, 33, 26, 7, RP.casco, s, 2.6); P.nline(5, 36, 26, 36, N.verde, false);
  P.box(8, 3, 16, 4, RP.casco, s + 1, 2.8);
  for (const x of [11, 20]) { for (let y = 0; y < 3; y++) { P.put(x, y, RP.prata, 3.6); P.put(x + 1, y, RP.prata, 2.4); } }
  P.mark('bolha', 7, 32, { w: 18, top: lvl + 1 });
  return P.done();
}
function microscope() {   // 20 x 28: o microscópio alienígena: base, o braço curvo, três oculares, a lâmina acesa em violeta
  const W = 20, H = 28, P = painter(W, H), s = 24661;
  P.box(2, 23, 16, 5, RP.liga, s, 2.8);
  tube(P, t => [14 - Math.sin(t * Math.PI) * 4, 23 - t * 18], () => 3, RP.liga, s, 2.6);
  P.rect(3, 15, 11, 2, RP.casco, (i, j) => 3.2 - j - i * 0.05);
  P.ell(8, 15.5, 3, 1, (x, y) => P.N(x, y, N.violeta)); P.N(8, 15, lite(N.violeta)); P.mark('botao', 8, 15, { c: N.violeta });
  tube(P, t => [10 - t * 2, 6 + t * 7], () => 3, RP.casco, s + 1, 2.8);
  for (let i = 0; i < 3; i++) { const x = 6 + i * 3, y = 1 + (i === 1 ? -1 : 0); P.rect(x, y + 1, 2, 4, RP.casco, (a, b) => 3 - a * 0.6); P.put(x, y + 1, RP.vidro, 4.4); P.put(x + 1, y + 1, RP.vidro, 3); }
  P.N(4, 25, N.verde);
  return P.done();
}
function humanChart() {   // 36 x 42: o quadro com o diagrama de um humano: moldura de liga, a tela escura, o humano em linhas ciano, setas e colunas de sinais verdes
  const W = 36, H = 42, P = painter(W, H), s = 24681;
  P.box(0, 0, W, H, RP.liga, s, 2.6);
  P.rect(2, 2, W - 4, H - 4, RP.negro, (i, j, x, y) => 0.8 + (j % 3 === 0 ? 0.3 : 0) + cn(x, y, 10, 10, s) * 0.3);
  const C = N.ciano, cx = 14;
  // a cabeça, o tronco, os braços abertos, as pernas
  for (let a = 0; a < 6.283; a += 0.25) P.N(cx + Math.cos(a) * 3, 8 + Math.sin(a) * 3.4, C);
  P.nline(cx, 12, cx, 25, C, false); P.nline(cx - 4, 14, cx + 4, 14, C, false);
  P.nline(cx - 4, 14, cx - 9, 21, C, false); P.nline(cx + 4, 14, cx + 9, 21, C, false);
  P.nline(cx - 3, 14, cx - 3, 24, C, false); P.nline(cx + 3, 14, cx + 3, 24, C, false); P.nline(cx - 3, 24, cx + 3, 24, C, false);
  P.nline(cx - 2, 25, cx - 4, 36, C, false); P.nline(cx + 2, 25, cx + 4, 36, C, false);
  // o coração (rosa) e o cérebro (amarelo), com setas para os sinais
  P.N(cx - 1, 17, N.rosa); P.N(cx, 17, N.rosa); P.N(cx - 1, 18, N.rosa); P.mark('botao', cx - 1, 17, { c: N.rosa });
  P.N(cx, 7, N.amarelo); P.N(cx + 1, 7, N.amarelo);
  P.nline(cx + 2, 7, 24, 6, N.amarelo, false); P.nline(cx + 1, 17, 24, 17, N.rosa, false);
  for (let r = 0; r < 9; r++) for (let i = 0; i < 3; i++) if (hash2(r, i, s) < 0.7) { const x = 26 + i * 2, y = 4 + r * 3.6; P.N(x, y, N.verde); if (hash2(r, i + 5, s) < 0.5) P.N(x, y + 1, N.verde); }
  return P.done(false);
}
function surgLamp() {   // 34 x 30: a lâmpada cirúrgica: o suporte do teto, o braço articulado, a cabeça redonda com sete lâmpadas brancas
  const W = 34, H = 30, P = painter(W, H), s = 24701;
  P.rect(12, 0, 10, 3, RP.casco, (i, j) => 3 - j * 0.7 - i * 0.04);
  tube(P, t => [17, 3 + t * 8], () => 2.6, RP.liga, s, 2.8); P.blob(17, 12, 2, 2, RP.casco, s, 3);
  tube(P, t => [17 + t * 2, 12 + t * 6], () => 2.4, RP.liga, s + 1, 2.8);
  P.ell(18, 23, 15, 6, (x, y, dx, dy, d) => { if (dy > 0.55) return; P.put(x, y, RP.liga, 3.4 - (dx + dy) * 1 - d * 0.5 + cg(x, y, s) * 0.3); });
  for (let x = 4; x < 33; x++) P.put(x, 26, RP.casco, 2.4);
  for (let i = 0; i < 7; i++) { const x = 6 + i * 4, y = 27 - (i === 0 || i === 6 ? 1 : 0); P.N(x, y, '#ffffff'); P.N(x + 1, y, '#e8fbff'); P.N(x, y + 1, '#c8f0ff'); }
  return P.done();
}
function brainJar() {   // 18 x 24: o cérebro no pote: o vidro com gosma verde, o cérebro rosado com as dobras boiando, a tampa com fios e uma luz
  const W = 18, H = 24, P = painter(W, H), s = 24721;
  const inside = (x, y) => x >= 2 && x < 16 && y >= 6 && y < 22;
  for (let y = 6; y < 22; y++) for (let x = 2; x < 16; x++) P.put(x, y, RP.gosma, 1.2 + cn(x, y, 6, 6, s) * 0.4 - Math.abs(x - 8) * 0.06);
  P.ell(9, 13.5, 5.2, 4.2, (x, y, dx, dy, d) => { const fold = Math.sin(x * 1.5 + Math.sin(y * 1.3) * 2) > 0.55 || Math.abs(dx) < 0.07; P.put(x, y, RP.cerebro, 4 - (dx + dy) * 0.9 - d * 0.4 - (fold ? 1.5 : 0)); });
  for (let y = 17; y < 21; y++) { P.put(9, y, RP.cerebro, 2.6); P.put(10, y, RP.cerebro, 1.8); }
  for (let y = 6; y < 22; y++) for (let x = 2; x < 16; x++) P.tint(x, y, '#3ad44e', 0.12);
  for (let x = 2; x < 16; x++) P.N(x, 7, x % 3 ? N.verde : lite(N.verde));
  glass(P, inside, 2, 6, 14, 16, '#9aff7a', 0.04);
  P.rect(1, 22, 16, 2, RP.casco, (i, j) => 3 - j - i * 0.05); P.rect(1, 3, 16, 3, RP.casco, (i, j) => 3.4 - j * 0.6 - i * 0.05);
  for (const [x, l] of [[5, 3], [12, 2]]) for (let j = 0; j < l; j++) P.put(x, j, RP.verm, 3);
  P.N(14, 4, N.rosa); P.mark('botao', 14, 4, { c: N.rosa });
  P.mark('bolha', 3, 21, { w: 11, top: 8 });
  return P.done();
}
/* =============================== O NÚCLEO =============================== */
function plasmaPillar(k) {   // 26 x 78 (k 1: 26 x 54): o pilar de plasma: base e capitel de metal do reator, o tubo de vidro com o plasma arco-íris (as faixas sobem ao vivo)
  const W = 26, H = k ? 54 : 78, P = painter(W, H), s = 24741 + k;
  const t0 = 9, t1 = H - 11;
  for (let y = t0; y < t1; y++) for (let x = 6; x < 20; x++) {
    const u = (x + 0.5 - 13) / 7, band = ARCO[Math.floor(((y - t0) / 5 + Math.abs(u) * 1.5)) % 6];
    const core = Math.abs(u) < 0.32;
    P.N(x, y, core ? lite(band, 0.6) : Math.abs(u) > 0.8 ? mixHex(band, '#1a0a2a', 0.5) : band);
  }
  glass(P, (x, y) => y >= t0 && y < t1 && x >= 6 && x < 20, 6, t0, 14, t1 - t0, '#ffffff', 0.0);
  for (let y = t0; y < t1; y++) { P.put(5, y, RP.reator, 3.2); P.put(20, y, RP.reator, 1.8); }
  for (let y = t0 + 8; y < t1 - 4; y += 12) for (let x = 4; x < 22; x++) P.put(x, y, RP.reator, 3.6 - (x - 4) * 0.12);
  const cap = (y0, h, up) => { for (let j = 0; j < h; j++) { const hw = up ? 9 + (j < 3 ? j * 1.3 : 3) : 13 - (j > h - 4 ? (j - h + 4) * 1.3 : 0) - (j < 2 ? 1 : 0); for (let x = Math.floor(13 - hw); x < 13 + hw; x++) P.put(x, y0 + j, RP.reator, 3.4 - (x - 13 + hw) / (2 * hw) * 1.6 + (j === 0 ? 1 : 0) + cg(x, y0 + j, s) * 0.3); } };
  cap(0, t0, false); cap(t1, H - t1, true);
  P.nline(3, 4, 22, 4, N.violeta, false); P.nline(2, H - 5, 23, H - 5, N.violeta, false);
  P.mark('tubo', 6, t0, { w: 14, h: t1 - t0 });
  return P.done();
}
function conduit(k) {   // 66 x 16: o conduto de energia: o cano de chapa com braçadeiras, a janela de vidro onde a energia corre (k 1: com uma caixa de junção no meio)
  const W = 66, H = 16, P = painter(W, H), s = 24761 + k;
  for (let y = 2; y < 14; y++) for (let x = 0; x < W; x++) { const v = (y - 2) / 11 * 2 - 1; P.put(x, y, RP.reator, 3 - v * 1.3 - v * v * 0.6 + (v > -0.65 && v < -0.4 ? 1.2 : 0) + cg(x, y, s) * 0.25); }
  for (let x = 1; x < W - 1; x++) for (let y = 6; y < 10; y++) P.N(x, y, y === 7 ? '#e8d0ff' : y === 8 ? '#c88aff' : '#6a2ad0');
  for (let x = 4; x < W; x += 15) P.rect(x, 0, 4, 16, RP.casco, (i, j) => 3.4 - i * 0.5 + (j === 0 ? 1 : 0) - (j === 15 ? 1.4 : 0));
  if (k) { P.box(24, 0, 18, 16, RP.casco, s, 2.6); P.N(28, 4, N.verde); P.N(31, 4, N.amarelo); P.N(34, 4, N.rosa); P.mark('botao', 28, 4, { c: N.verde }); P.mark('botao', 34, 4, { c: N.rosa }); P.nline(27, 11, 39, 11, N.violeta, false); }
  P.mark('cano', 1, 7, { w: W - 2, gap: k ? [24, 42] : null });
  return P.done();
}
function reactorConsole() {   // 46 x 30: o console do reator: o corpo largo, o mostrador redondo arco-íris, as barras de nível (animadas) e os botões
  const W = 46, H = 30, P = painter(W, H), s = 24781;
  P.box(1, 10, 44, 20, RP.reator, s, 2.4);
  for (let y = 4; y < 11; y++) { const off = Math.round((10 - y) * 0.6); for (let x = 1 + off; x < 45 - off; x++) P.put(x, y, RP.reator, 3.2 + (y === 4 ? 1 : 0) - x * 0.02 + cg(x, y, s) * 0.3); }
  for (let x = 1; x < 45; x++) P.put(x, 10, RP.liga, 4);
  // o mostrador arco-íris
  P.ell(11, 19, 7, 7, (x, y, dx, dy, d) => { if (d > 0.72) P.put(x, y, RP.liga, 3.6 - (dx + dy)); else P.put(x, y, RP.negro, 0.8); });
  for (let a = Math.PI * 0.75; a < Math.PI * 2.25; a += 0.07) { const i = Math.floor((a - Math.PI * 0.75) / (Math.PI * 1.5) * 6); P.N(11 + Math.cos(a) * 4.6, 19 + Math.sin(a) * 4.6, ARCO[clamp(i, 0, 5)]); }
  P.line(11, 19, 14, 16, RP.branco, 5); P.N(11, 19, '#ffffff');
  // as barras de nível (o fundo escuro; as barras são ao vivo)
  for (let i = 0; i < 6; i++) { P.rect(22 + i * 3, 13, 2, 12, RP.negro, () => 0.5); P.mark('barra', 22 + i * 3, 24, { c: ARCO[i], h: 11 }); }
  for (let i = 0; i < 5; i++) { const x = 6 + i * 7, c = [N.ciano, N.rosa, N.verde, N.amarelo, N.violeta][i]; P.N(x, 7, lite(c, 0.4)); P.N(x + 1, 7, c); P.mark('botao', x, 7, { c }); }
  P.rect(41, 13, 2, 14, RP.cabo, (i) => 3 - i);
  return P.done();
}
function containmentRing() {   // 58 x 58: o anel de contenção: o aro grosso de metal do reator em pé no chão, oito emissores, o orbe arco-íris no meio (pulsa ao vivo)
  const W = 58, H = 58, P = painter(W, H), s = 24801, c = 29, cy = 27;
  // o pé
  P.box(18, H - 6, 22, 6, RP.reator, s, 2.6); P.rect(24, H - 10, 10, 4, RP.reator, (i, j) => 3 - i * 0.15);
  P.ell(c, cy, 27, 27, (x, y, dx, dy, d) => { if (d < 0.6) return; P.put(x, y, RP.reator, 3.2 - (dx + dy) * 1.3 + (Math.abs(d - 0.8) < 0.04 ? -1 : 0) + cg(x, y, s) * 0.3); });
  for (let a = 0; a < 6.283; a += 0.04) P.N(c + Math.cos(a) * 20.2, cy + Math.sin(a) * 20.2, '#6a2ad0');
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 - Math.PI / 2, x = c + Math.cos(a) * 18, y = cy + Math.sin(a) * 18; P.blob(x, y, 2.2, 2.2, RP.liga, s + i, 3); P.N(x, y, N.violeta); P.mark('luz', Math.round(x), Math.round(y), { c: ARCO[i % 6] }); }
  // o orbe: o miolo branco, as bordas nas cores, um brilho
  P.ell(c, cy, 9, 9, (x, y, dx, dy, d) => { const a = Math.atan2(dy, dx), i = Math.floor((a + Math.PI) / (Math.PI * 2) * 6 + d * 2) % 6; P.N(x, y, d < 0.2 ? '#ffffff' : d < 0.5 ? lite(ARCO[i], 0.55) : ARCO[i]); });
  // os raios finos dos emissores até o orbe
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 - Math.PI / 2; for (let r = 10; r < 16; r += 1) if (r % 2) P.N(c + Math.cos(a) * r, cy + Math.sin(a) * r, '#c8a8ff'); }
  P.mark('orbe', c, cy);
  return P.done();
}
function plasmaCrystal(k) {   // 36 x 46: o cristal de plasma grande: prismas de cristal saindo da rocha, em faixas com as seis cores, uma face clara e uma escura, a aresta acesa (k 1: três pontas mais baixas e tortas)
  const W = 36, H = 46, P = painter(W, H), s = 24821 + k;
  const spikes = k ? [[26, 22, -0.75, 4.2, 2], [8, 24, 0.7, 4.4, 4], [17, 34, 0.08, 5.6, 0]] : [[7, 18, 1.0, 3.2, 3], [29, 22, -0.8, 4, 1], [11, 27, 0.5, 4.2, 5], [19, 40, 0.02, 6, 0]];
  for (const [bx, len, ang, wd, ph0] of spikes) {
    const ca = Math.cos(ang), sa = Math.sin(ang), by = H - 3;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - bx, dy = y + 0.5 - by, t = dx * sa - dy * ca, o = dx * ca + dy * sa;   // t ao longo da ponta, o atravessado
      if (t < -2 || t > len) continue;
      const hw = t < len * 0.72 ? wd : wd * (len - t) / (len * 0.28); if (Math.abs(o) > hw) continue;
      const i = ((Math.floor(t / len * 5.5) + ph0) % 6 + 6) % 6, R = ARCO_R[i], ridge = Math.abs(o + hw * 0.15) < 0.55;
      if (ridge && t > 1) { P.N(x, y, t > len - 2 ? '#ffffff' : lite(ARCO[i], 0.45)); continue; }
      P.put(x, y, R, o < 0 ? 3.7 + (o < -hw + 1 ? 0.8 : 0) - t / len * 0.3 : 2 - (o > hw - 1 ? 0.8 : 0) + cg(x, y, s) * 0.2);
    }
  }
  rubble(P, 0, 35, H - 1, 5, RP.reator, s + 3);
  return P.done();
}
function watcherEye() {   // 28 x 44: o olho de vigia pendurado: três cabos do teto, o soquete mecânico com garras, o olho branco do adesivo com veias vermelhas (a íris e a pupila são ao vivo)
  const W = 28, H = 44, P = painter(W, H), s = 24841, cx = 14, cy = 30, r = 9.5;
  P.rect(8, 0, 12, 3, RP.casco, (i, j) => 3.4 - j * 0.8 - i * 0.04);
  for (const [x0, x1] of [[10, 7], [14, 14], [18, 21]]) for (let y = 3; y < 20; y++) P.put(x0 + (x1 - x0) * (y - 3) / 16, y, RP.cabo, 3 + (y % 4 === 0 ? 0.8 : 0));
  P.rect(cx - 6, 18, 12, 3, RP.prata, (i, j) => 3.6 - j * 0.8 - i * 0.08);
  // o soquete: a taça de chapa atrás do olho, as garras por cima
  P.ell(cx, cy, r + 2.5, r + 2.5, (x, y, dx, dy, d) => P.put(x, y, RP.casco, 3.4 - (dx + dy) * 1.1 + cg(x, y, s) * 0.2));
  // o olho
  P.ell(cx, cy, r, r, (x, y, dx, dy, d) => P.put(x, y, RP.olho, 4.8 - (dx + dy) * 0.8 - d * 1.1 + (dx < -0.3 && dy < -0.3 && d < 0.75 && d > 0.35 ? 0.6 : 0)));
  for (let i = 0; i < 8; i++) { let a = i / 8 * 6.283 + 0.4, rr = r - 0.5, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; for (let j = 0; j < 4 + (i % 2) * 2; j++) { const a2 = a + (hash2(i, j, s) - 0.5) * 0.9, r2 = rr - 1.1, nx = cx + Math.cos(a2) * r2, ny = cy + Math.sin(a2) * r2; P.line(x, y, nx, ny, RP.verm, 3.4 - j * 0.3); x = nx; y = ny; a = a2; rr = r2; if (rr < 5) break; } }
  for (const sd of [-1, 1]) { tube(P, t => [cx + sd * (r + 1 - t * 2), cy - 6 + t * -4 + t * t * 10], () => 2, RP.prata, s, 2.8); }
  P.mark('olho', cx, cy, { r });
  return P.done();
}
/* =============================== registro =============================== */
// assa as camadas de neon de cada variação: os pixels de neon sozinhos e o halo em volta (pad HR)
const HR = NV_HR;
function bakeNeon(P) {
  const list = [];
  for (let k = 0; k < P.w * P.h; k++) if (P.rid[k] === -2) list.push(k);
  if (!list.length) return { nv: null, halo: null };
  const nv = mk(P.w, P.h), nx = nv.getContext('2d'), im = nx.createImageData(P.w, P.h), d32 = new Uint32Array(im.data.buffer);
  for (const k of list) d32[k] = P.c[k];
  nx.putImageData(im, 0, 0);
  const HW = P.w + HR * 2, HH = P.h + HR * 2, acc = new Float32Array(HW * HH * 3), ker = [], dens = clamp(Math.sqrt(90 / list.length), 0.22, 1);   // muito neon junto não vira um borrão branco
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
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, Ps, extra) => {
  const B = Ps.map(bakeNeon);
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), nave: true, nvNeon: B.map(b => b.nv), nvHalo: B.map(b => b.halo), nvPts: Ps.map(P => P.pts), luz: [] }, extra || {}));
};
// A Cratera de Impacto
def('nv_capsula_fuga', 'Cápsula de fuga caída', F, 'frente', ['cratera'], [escapePod(0), escapePod(1)], { luz: [{ x: 22, y: 12, r: 0.25 }], brilho: N.verde });
def('nv_foguete', 'Foguete vermelho enfiado na rocha', F, 'frente', ['cratera'], [rocket(0), rocket(1)], { naoPoca: true, luz: [{ x: 23, y: 66, r: 0.2 }], brilho: N.verde, anim: { k: 'nv_fumaca' } });
def('nv_placa_casco', 'Placa do casco enfiada', W, 'fundo', ['cratera', 'casco'], [hullPlate(0), hullPlate(1)], { luz: [{ x: 18, y: 20, r: 0.25 }], brilho: N.rosa, falha: true });
def('nv_antena', 'Antena quebrada faiscando', F, 'frente', ['cratera'], [antenna(0), antenna(1)], { luz: [{ x: 8, y: 8, r: 0.2 }], brilho: N.ciano });
def('nv_cratera_gosma', 'Cratera fumegante de gosma', F, 'frente', ['cratera', 'laboratorios'], [gooCrater()], { naoPoca: true, luz: [{ x: 23, y: 12, r: 0.6 }], brilho: N.verde, anim: { k: 'nv_bolhas', fumaca: true } });
def('nv_bandeira', 'Bandeira de astronauta', F, 'frente', ['cratera'], [flag(0), flag(1)]);
def('nv_asa_disco', 'Pedaço de asa de disco', W, 'fundo', ['cratera'], [saucerWing()], { luz: [{ x: 28, y: 14, r: 0.15 }], brilho: N.amarelo, falha: true });
// O Casco
def('nv_disco', 'Disco voador estacionado', F, 'frente', ['casco'], [saucer(0), saucer(1)], { hangar: true, alto: 5, naoPoca: true, luz: [{ x: 46, y: 22, r: 0.7 }, { x: 46, y: 40, r: 0.5 }], brilho: N.ciano, anim: { k: 'nv_disco' } });
def('nv_painel', 'Painel de controle piscando', W, 'fundo', ['casco', 'nucleo'], [controlPanel(0), controlPanel(1)], { luz: [{ x: 21, y: 8, r: 0.4 }], brilho: N.ciano });
def('nv_cartaz', 'Cartaz de neon com um ET acenando', W, 'fundo', ['casco'], [neonSign(0), neonSign(1)], { luz: [{ x: 26, y: 20, r: 0.7 }], brilho: N.rosa, falha: true, anim: { k: 'nv_et' } });
def('nv_cartaz_planeta', 'Cartaz holográfico do planeta com anel', W, 'fundo', ['casco', 'nucleo'], [planetPoster()], { luz: [{ x: 23, y: 21, r: 0.55 }], brilho: N.amarelo, falha: true });
def('nv_porta_hex', 'Porta hexagonal fechada', W, 'fundo', ['casco', 'laboratorios'], [hexDoor()], { luz: [{ x: 20, y: 24, r: 0.3 }], brilho: N.ciano });
def('nv_ventilador', 'Ventilador grande', W, 'fundo', ['casco', 'nucleo'], [fan()], { luz: [], anim: { k: 'nv_vent', x: 19, y: 19, r: 13 } });
def('nv_luminaria', 'Luminária de neon pendurada', C, 'frente', ['casco', 'laboratorios'], [hangLamp(0), hangLamp(1), hangLamp(2)], { luz: [{ x: 14, y: 18, r: 0.8 }], brilho: N.violeta, falha: true });
def('nv_escotilha', 'Escotilha com estrelas', W, 'fundo', ['casco'], [porthole(0), porthole(1)], { luz: [{ x: 17, y: 17, r: 0.2 }], brilho: N.violeta });
def('nv_caixas', 'Caixas de carga alienígenas', F, 'frente', ['casco', 'cratera'], [cargo(0), cargo(1)], { luz: [{ x: 20, y: 18, r: 0.15 }], brilho: N.verde });
// Os Laboratórios
def('nv_capsula_especime', 'Cápsula de espécime', W, 'fundo', ['laboratorios'], NV_ESPECIMES.map((n, k) => specimenPod(k)), { luz: [{ x: 13, y: 26, r: 0.55 }], brilho: N.verde, especime: NV_ESPECIMES.slice(), anim: { k: 'nv_bolhas' } });
def('nv_mesa_exame', 'Mesa de exame com braços mecânicos', F, 'frente', ['laboratorios'], [examTable()], { lab: true, naoPoca: true, luz: [{ x: 14, y: 16, r: 0.2 }], brilho: '#ff3b3b' });
def('nv_tanque_gosma', 'Tanque de gosma borbulhando', F, 'frente', ['laboratorios'], [gooTank(0), gooTank(1)], { naoPoca: true, luz: [{ x: 16, y: 20, r: 0.6 }], brilho: N.verde, anim: { k: 'nv_bolhas' } });
def('nv_microscopio', 'Microscópio alienígena', F, 'frente', ['laboratorios'], [microscope()], { luz: [{ x: 8, y: 15, r: 0.15 }], brilho: N.violeta });
def('nv_quadro_humano', 'Quadro com o diagrama de um humano', W, 'fundo', ['laboratorios'], [humanChart()], { lab: true, luz: [{ x: 16, y: 20, r: 0.35 }], brilho: N.ciano });
def('nv_lampada_cirurgica', 'Lâmpada cirúrgica', C, 'frente', ['laboratorios'], [surgLamp()], { luz: [{ x: 18, y: 28, r: 0.9 }], brilho: '#e8fbff' });
def('nv_cerebro_pote', 'Cérebro num pote', F, 'frente', ['laboratorios'], [brainJar()], { luz: [{ x: 9, y: 14, r: 0.2 }], brilho: N.verde, anim: { k: 'nv_bolhas' } });
// O Núcleo
def('nv_pilar_plasma', 'Pilar de plasma arco-íris', W, 'fundo', ['nucleo'], [plasmaPillar(0), plasmaPillar(1)], { alto: 7, luz: [{ x: 13, y: 24, r: 0.9 }, { x: 13, y: 48, r: 0.8 }], brilho: '#d8a8ff', anim: { k: 'nv_plasma' } });
def('nv_conduto', 'Conduto de energia', W, 'fundo', ['nucleo', 'casco'], [conduit(0), conduit(1)], { luz: [{ x: 33, y: 8, r: 0.35 }], brilho: N.violeta, anim: { k: 'nv_pulso' } });
def('nv_console_reator', 'Console do reator', F, 'frente', ['nucleo'], [reactorConsole()], { naoPoca: true, luz: [{ x: 22, y: 14, r: 0.4 }], brilho: N.violeta, anim: { k: 'nv_botoes', barras: true } });
def('nv_anel_contencao', 'Anel de contenção', W, 'fundo', ['nucleo'], [containmentRing()], { alto: 5, luz: [{ x: 29, y: 27, r: 0.85 }], brilho: '#e0c8ff', anim: { k: 'nv_orbe' } });
def('nv_cristal_plasma', 'Cristal de plasma grande', F, 'frente', ['nucleo'], [plasmaCrystal(0), plasmaCrystal(1)], { luz: [{ x: 17, y: 24, r: 0.7 }], brilho: '#ffb8f0' });
def('nv_olho_vigia', 'Olho de vigia pendurado', C, 'frente', ['nucleo', 'casco'], [watcherEye()], { luz: [{ x: 14, y: 30, r: 0.15 }], brilho: '#ff3b3b', anim: { k: 'nv_olho' } });

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(NV_PROP_PLAN, {
  cratera: { chao: [['nv_capsula_fuga', 0.08, 1], ['nv_foguete', 0.05, 1], ['nv_antena', 0.1, 1], ['nv_cratera_gosma', 0.1, 1], ['nv_bandeira', 0.07, 1], ['nv_caixas', 0.06, 1]], teto: [], fundo: [['nv_placa_casco', 0.1, 1], ['nv_asa_disco', 0.07, 1]] },
  casco: { chao: [['nv_disco', 0.1, 1], ['nv_caixas', 0.14, 2]], teto: [['nv_luminaria', 0.25, 2], ['nv_olho_vigia', 0.05, 1]], fundo: [['nv_painel', 0.1, 1], ['nv_cartaz', 0.08, 1], ['nv_cartaz_planeta', 0.06, 1], ['nv_porta_hex', 0.06, 1], ['nv_ventilador', 0.07, 1], ['nv_escotilha', 0.1, 2], ['nv_placa_casco', 0.04, 1], ['nv_conduto', 0.05, 1]] },
  laboratorios: { chao: [['nv_mesa_exame', 0.1, 1], ['nv_tanque_gosma', 0.12, 1], ['nv_microscopio', 0.12, 1], ['nv_cerebro_pote', 0.12, 2], ['nv_cratera_gosma', 0.03, 1]], teto: [['nv_lampada_cirurgica', 0.15, 1], ['nv_luminaria', 0.15, 2]], fundo: [['nv_capsula_especime', 0.22, 3], ['nv_quadro_humano', 0.07, 1], ['nv_porta_hex', 0.05, 1]] },
  nucleo: { chao: [['nv_console_reator', 0.1, 1], ['nv_cristal_plasma', 0.14, 2]], teto: [['nv_olho_vigia', 0.12, 1]], fundo: [['nv_pilar_plasma', 0.1, 2], ['nv_conduto', 0.12, 2], ['nv_anel_contencao', 0.05, 1], ['nv_painel', 0.05, 1], ['nv_ventilador', 0.04, 1], ['nv_cartaz_planeta', 0.04, 1]] }
});
}

/* ---------- o neon e os animados ----------
   visProps só guarda objetos com luz (todos os da nave têm `luz`, nem que vazia). drawWorld vem antes da luz e do
   herói (as pás, a pupila e a fumaça escurecem com o lugar e ficam atrás dele); o neon, o halo e as luzinhas vão no
   drawGlow (somados) e no drawTop (por cima do escuro). */
const nvFalha = p => { if (!p.def.falha) return 1; const h = hash2(p.X, p.Y, 31), ph = (gameTime * (0.11 + h * 0.08) + h) % 1; return ph < 0.025 ? (Math.floor(gameTime * 30) % 2 ? 0.15 : 0.55) : 0.94 + Math.sin(gameTime * 9 + h * 20) * 0.04; };
const nvBlink = (q, p, j) => { const h = hash2(p.X + j * 7, p.Y, 41); return Math.sin(gameTime * (1.2 + h * 2.6) + h * 30) > -0.35 + h * 0.5; };
const nvPt = (p, nm) => { const P = p.def.nvPts && p.def.nvPts[p.v]; return P && P[nm] ? P[nm] : null; };
let nvGl = null;
const nvGlow = () => nvGl || (nvGl = { s: glow(5, '#ffffff'), m: glow(10, '#ffffff'), v: glow(7, '#7dff3a'), r: glow(6, '#ff3b3b'), c: {} });
const nvGlowC = (c, r) => { const G = nvGlow().c, k = c + r; return G[k] || (G[k] = glow(r, c)); };
HOOK.drawWorld.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || !p.def.nave) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    if (A.k === 'nv_vent') {   // quatro pás largas girando, a sombra embaixo de cada uma
      const a0 = gameTime * 7 + p.X * 0.01;
      for (let b = 0; b < 4; b++) { const a = a0 + b * Math.PI / 2; for (let r = 2; r < A.r; r++) { const w = r < 4 ? 1 : r < A.r - 3 ? 3 : 2; for (let o = 0; o < w; o++) { const aa = a + o * 0.09; lc.fillStyle = o === 0 ? '#aab2c2' : o === 1 ? '#6c7888' : '#3e4654'; lc.fillRect(X + A.x + Math.round(Math.cos(aa) * r), Y + A.y + Math.round(Math.sin(aa) * r), 1, 1); } } }
      lc.fillStyle = '#525c6c'; lc.fillRect(X + A.x - 2, Y + A.y - 2, 4, 4); lc.fillStyle = '#c8ccd8'; lc.fillRect(X + A.x - 1, Y + A.y - 1, 1, 1);
    } else if (A.k === 'nv_olho') {   // a íris amarela e a pupila preta olhando para o herói
      const O = nvPt(p, 'olho'); if (!O) continue; const o = O[0];
      const ex = p.X + p.sh + o.x, ey = p.Y + o.y, dx = pl.x + pl.w / 2 - ex, dy = pl.y + 6 - ey, d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 60) * 3.6;
      const ix = Math.round(X + o.x + dx / d * m), iy = Math.round(Y + o.y + dy / d * m);
      lc.fillStyle = '#b08a10'; lc.fillRect(ix - 3, iy - 2, 7, 5); lc.fillRect(ix - 2, iy - 3, 5, 7);
      lc.fillStyle = '#ffd23a'; lc.fillRect(ix - 2, iy - 2, 5, 4); lc.fillRect(ix - 1, iy - 3, 3, 1);
      const pp = 1 + (Math.sin(gameTime * 0.7 + p.X) > 0.8 ? 1 : 0);
      lc.fillStyle = '#0c0a10'; lc.fillRect(ix - pp, iy - pp, 1 + pp * 2 - 1, 1 + pp * 2 - 1); lc.fillRect(ix, iy - 1, 1, 3); lc.fillRect(ix - 1, iy, 3, 1);
      lc.fillStyle = '#ffffff'; lc.fillRect(ix - 2, iy - 2, 1, 1);
      // a piscada: a pálpebra violeta desce de vez em quando
      const ph = (gameTime * 0.23 + p.X * 0.0071) % 1; if (ph < 0.03) { const sh = 1 - Math.abs(ph / 0.03 - 0.5) * 2, r = o.r; for (let x = -r; x <= r; x++) { const hh = Math.sqrt(Math.max(0, r * r - x * x)), lid = Math.round(hh * 2 * sh); lc.fillStyle = '#563e78'; lc.fillRect(X + o.x + x, Y + o.y - Math.round(hh), 1, lid); } }
    } else if (A.k === 'nv_fumaca') {   // fumaça cinza subindo do bocal, uma brasa de vez em quando
      const B = nvPt(p, 'bocal'); if (!B) continue; const b = B[0];
      for (let k = 0; k < 7; k++) { const t = ((gameTime * 0.35 + k / 7 + hash2(p.X, k, 3)) % 1), x = X + b.x + Math.round(Math.sin(t * 5 + k) * (1 + t * 4)), y = Y + b.y - Math.round(t * 26); lc.globalAlpha = 0.5 * (1 - t); lc.fillStyle = k % 2 ? '#3a3e48' : '#262a34'; lc.fillRect(x, y, 2 + Math.round(t * 2), 2 + Math.round(t * 2)); }
      lc.globalAlpha = 1;
    }
  }
});
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  const G = nvGlow();
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.nave) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), f = nvFalha(p), hl = p.def.nvHalo[p.v], nv = p.def.nvNeon[p.v];
    if (hl) { lc.globalAlpha = 0.62 * f; lc.drawImage(hl, X - NV_HR, Y - NV_HR); }
    if (nv) { lc.globalAlpha = 0.5 * f; lc.drawImage(nv, X, Y); }
    const Fq = nvPt(p, 'faisca'); if (Fq && (gameTime * 1.3 + hash2(p.X, 0, 5)) % 1 < 0.18) { lc.globalAlpha = 0.7; lc.drawImage(nvGlowC(NV_NEON_COL.ciano, 8), X + Fq[0].x - 8, Y + Fq[0].y - 8); }
    const A = p.def.anim; if (!A) continue;
    if (A.k === 'nv_disco') {   // a luz que corre pela borda acende um halo próprio
      const L = nvPt(p, 'luz'); if (!L) continue; const j = Math.floor(gameTime * 9 + p.X * 0.1) % L.length, q = L[j];
      lc.globalAlpha = 0.8; lc.drawImage(nvGlowC(q.c, 7), X + q.x - 7, Y + q.y - 7);
      const T0 = nvPt(p, 'topo'); if (T0 && Math.sin(gameTime * 4) > 0) { lc.globalAlpha = 0.6; lc.drawImage(nvGlowC(T0[0].c, 6), X + T0[0].x - 6, Y + T0[0].y - 6); }
    } else if (A.k === 'nv_plasma') {   // o tubo pulsa
      const Tb = nvPt(p, 'tubo'); if (!Tb) continue; const t = Tb[0];
      for (let y = 0; y < t.h; y += 8) { const c = NV_ARCO[Math.floor((y - gameTime * 22) / 8 % 6 + 6) % 6]; lc.globalAlpha = 0.3; lc.drawImage(nvGlowC(c, 10), X + t.x + (t.w >> 1) - 10, Y + t.y + y - 10); }
    } else if (A.k === 'nv_orbe') {
      const O = nvPt(p, 'orbe'); if (!O) continue; const b = 0.5 + 0.5 * Math.sin(gameTime * 2.6 + p.X);
      lc.globalAlpha = 0.35 + 0.35 * b; lc.drawImage(G.m, X + O[0].x - 10, Y + O[0].y - 10); lc.drawImage(nvGlowC(NV_ARCO[Math.floor(gameTime * 2) % 6], 16), X + O[0].x - 16, Y + O[0].y - 16);
    } else if (A.k === 'nv_et') {
      const Bq = nvPt(p, 'braco'); if (!Bq) continue; const b = Bq[0], a = -1.9 + Math.sin(gameTime * 5 + p.X) * 0.55;
      lc.globalAlpha = 0.5 * f; lc.drawImage(nvGlowC(NV_NEON_COL.verde, 6), X + b.x + Math.round(Math.cos(a) * 7) - 6, Y + b.y + Math.round(Math.sin(a) * 7) - 6);
    } else if (A.k === 'nv_pulso') {
      const Cn = nvPt(p, 'cano'); if (!Cn) continue; const c = Cn[0];
      for (let k = 0; k < 3; k++) { const x = (gameTime * 40 + k * c.w / 3 + p.X) % c.w; lc.globalAlpha = 0.5; lc.drawImage(nvGlowC('#d0a8ff', 7), X + c.x + Math.round(x) - 7, Y + c.y - 6); }
    } else if (A.k === 'nv_olho') { lc.globalAlpha = 0.18 + 0.08 * Math.sin(gameTime * 3); const O = nvPt(p, 'olho'); if (O) lc.drawImage(G.r, X + O[0].x - 6, Y + O[0].y - 6); }

  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.nave) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    // em todos: os botões piscam cada um no seu ritmo, o laser pulsa, as estrelas cintilam, a ponta partida faísca
    const Bt = nvPt(p, 'botao'); if (Bt) for (let j = 0; j < Bt.length; j++) { const q = Bt[j]; lc.globalAlpha = 0.9; lc.fillStyle = nvBlink(q, p, j) ? q.c : '#1a1e2a'; lc.fillRect(X + q.x, Y + q.y, 2, 1); }
    const Lz = nvPt(p, 'laser'); if (Lz) for (const q of Lz) { const on = Math.sin(gameTime * 6 + p.X) > 0.3; lc.globalAlpha = 1; lc.fillStyle = on ? '#ffd0d0' : '#ff3b3b'; lc.fillRect(X + q.x, Y + q.y, 1, 1); if (on) { lc.globalAlpha = 0.7; lc.fillStyle = '#ff3b3b'; for (let k = 1; k < 4; k++) lc.fillRect(X + q.x, Y + q.y + k, 1, 1); } }
    const St = nvPt(p, 'estrela'); if (St) for (let j = 0; j < St.length; j++) { const b = Math.sin(gameTime * (1.5 + hash2(j, p.X, 3) * 2) + j * 2.3); if (b < 0.6) continue; lc.globalAlpha = (b - 0.6) * 2.2; lc.fillStyle = '#ffffff'; lc.fillRect(X + St[j].x - 1, Y + St[j].y, 3, 1); lc.fillRect(X + St[j].x, Y + St[j].y - 1, 1, 3); }
    const Fq = nvPt(p, 'faisca'); if (Fq) { const q = Fq[0], ph = (gameTime * 1.3 + hash2(p.X, 0, 5)) % 1; if (ph < 0.3) for (let k = 0; k < 6; k++) { const h = hash2(k, Math.floor(gameTime * 1.3 + hash2(p.X, 0, 5)), 7), t = ph / 0.3, a = -Math.PI / 2 + (h - 0.5) * 2.6, r = t * (6 + h * 8); lc.globalAlpha = 1 - t; lc.fillStyle = k % 2 ? '#ffffff' : NV_NEON_COL.ciano; lc.fillRect(X + q.x + Math.round(Math.cos(a) * r), Y + q.y + Math.round(Math.sin(a) * r + t * t * 6), 1, 1); } }
    const A = p.def.anim; if (!A) continue;
    if (A.k === 'nv_disco') {   // as luzes da borda: uma corre, as outras ficam meio acesas
      const L = nvPt(p, 'luz'); if (!L) continue; const j0 = Math.floor(gameTime * 9 + p.X * 0.1) % L.length;
      for (let j = 0; j < L.length; j++) { const q = L[j], on = j === j0 || j === (j0 + L.length - 1) % L.length; lc.globalAlpha = on ? 1 : 0.35; lc.fillStyle = on ? '#ffffff' : q.c; lc.fillRect(X + q.x, Y + q.y, 2, 2); if (on) { lc.fillStyle = q.c; lc.fillRect(X + q.x - 1, Y + q.y, 1, 2); lc.fillRect(X + q.x + 2, Y + q.y, 1, 2); } }
    } else if (A.k === 'nv_botoes') {
      if (A.barras) { const Bs = nvPt(p, 'barra') || []; for (let j = 0; j < Bs.length; j++) { const q = Bs[j], h = Math.round(q.h * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(gameTime * (1.4 + j * 0.37) + j * 2.1)))); lc.globalAlpha = 0.95; lc.fillStyle = q.c; lc.fillRect(X + q.x, Y + q.y - h + 1, 2, h); lc.fillStyle = '#ffffff'; lc.fillRect(X + q.x, Y + q.y - h + 1, 2, 1); } }
    } else if (A.k === 'nv_bolhas') {   // bolhas subindo na gosma e estourando na superfície (a cratera também solta vapor verde)
      const Bb = nvPt(p, 'bolha'); if (!Bb) continue; const b = Bb[0], top = b.top !== undefined ? b.top : b.y - 6;
      for (let k = 0; k < 6; k++) {
        const h = hash2(p.X + k, p.Y, 9), t = (gameTime * (0.35 + h * 0.4) + h) % 1, x = X + b.x + Math.round(h * b.w + Math.sin(t * 9 + k) * 0.8), y = Y + Math.round(b.y - t * (b.y - top));
        lc.globalAlpha = 0.85; lc.fillStyle = '#c8ff7a'; lc.fillRect(x, y, 1, 1); if (h > 0.5) { lc.fillStyle = '#7dff3a'; lc.fillRect(x + 1, y, 1, 1); lc.fillRect(x, y + 1, 1, 1); }
      }
      if (A.fumaca) for (let k = 0; k < 5; k++) { const t = (gameTime * 0.3 + k / 5) % 1, x = X + b.x + 4 + k * 4 + Math.round(Math.sin(t * 6 + k) * 2), y = Y + b.y - Math.round(t * 18); lc.globalAlpha = 0.28 * (1 - t); lc.fillStyle = '#94f03c'; lc.fillRect(x, y, 2, 1); }
    } else if (A.k === 'nv_plasma') {   // faixas claras subindo pelo tubo
      const Tb = nvPt(p, 'tubo'); if (!Tb) continue; const t = Tb[0];
      for (let k = 0; k < 4; k++) { const y = t.h - 1 - Math.round((gameTime * 26 + k * t.h / 4 + p.X) % t.h); lc.globalAlpha = 0.75; lc.fillStyle = '#ffffff'; lc.fillRect(X + t.x + 3, Y + t.y + y, t.w - 6, 1); lc.globalAlpha = 0.5; lc.fillStyle = NV_ARCO[k % 6]; lc.fillRect(X + t.x + 1, Y + t.y + y + 1, t.w - 2, 1); }
      for (let k = 0; k < 5; k++) { const h = hash2(p.X, k, 11), y = t.h - 1 - Math.round((gameTime * (30 + h * 20) + h * t.h) % t.h); lc.globalAlpha = 0.9; lc.fillStyle = '#ffffff'; lc.fillRect(X + t.x + 2 + Math.round(h * (t.w - 4)), Y + t.y + y, 1, 2); }
    } else if (A.k === 'nv_et') {   // o braço que acena: um traço de neon do ombro até a mão, a mão com três dedos
      const Bq = nvPt(p, 'braco'); if (!Bq) continue; const b = Bq[0], a = -1.9 + Math.sin(gameTime * 5 + p.X) * 0.55, f = nvFalha(p);
      lc.globalAlpha = 0.95 * f; lc.fillStyle = NV_NEON_COL.verde;
      for (let r = 0; r <= 7; r++) lc.fillRect(X + b.x + Math.round(Math.cos(a) * r), Y + b.y + Math.round(Math.sin(a) * r), 1, 1);
      const hx = X + b.x + Math.round(Math.cos(a) * 8), hy = Y + b.y + Math.round(Math.sin(a) * 8);
      lc.fillStyle = '#d4ffb0'; lc.fillRect(hx, hy, 1, 1); lc.fillStyle = NV_NEON_COL.verde; lc.fillRect(hx - 1, hy - 1, 1, 1); lc.fillRect(hx + 1, hy - 1, 1, 1); lc.fillRect(hx, hy - 2, 1, 1);
    } else if (A.k === 'nv_pulso') {
      const Cn = nvPt(p, 'cano'); if (!Cn) continue; const c = Cn[0];
      for (let k = 0; k < 3; k++) { const x = Math.round((gameTime * 40 + k * c.w / 3 + p.X) % c.w); if (c.gap && x + c.x >= c.gap[0] && x + c.x < c.gap[1]) continue; lc.globalAlpha = 0.9; lc.fillStyle = '#ffffff'; lc.fillRect(X + c.x + x, Y + c.y, 3, 2); lc.fillStyle = '#d0a8ff'; lc.fillRect(X + c.x + x - 2, Y + c.y, 2, 2); }
    } else if (A.k === 'nv_orbe') {
      const L = nvPt(p, 'luz') || [], j0 = Math.floor(gameTime * 6) % Math.max(1, L.length);
      for (let j = 0; j < L.length; j++) { const q = L[j]; lc.globalAlpha = j === j0 ? 1 : 0.4; lc.fillStyle = j === j0 ? '#ffffff' : q.c; lc.fillRect(X + q.x - (j === j0 ? 1 : 0), Y + q.y, j === j0 ? 3 : 1, 1); if (j === j0) lc.fillRect(X + q.x, Y + q.y - 1, 1, 3); }
    }
  }
  lc.globalAlpha = 1;
});
