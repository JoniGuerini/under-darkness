'use strict';

/* ================= a Colmeia: objetos de cena =================
   Tudo o que é maior que um bloco e veste A Colmeia (docs/camadas/09-colmeia.md, seção 5): 28 objetos.
   Na Brecha Tomada, os salões de baixo dos anões meio engolidos: a estátua anã com cera escorrendo do elmo, a bigorna
   coberta de cera, o barril de hidromel rachado, o carrinho de minério tomado, a porta de pedra selada com favo, o
   estandarte engolido, a runa anã ainda acesa (azul fraca) debaixo da cera e o lustre de ferro tomado por casulos.
   Nas Galerias de Cera, o trabalho da colmeia: um favo grande caído, um pote de mel rachado, um monte de cera
   mastigada, a carcaça de uma operária de patas para cima, o mural de favos com larvas acesas (âmbar, piscando
   devagar), o favo pendente e a gota de mel gigante que se forma e cai do teto. Nas Câmaras de Âmbar, o que a colmeia
   guarda: o anão preso no âmbar, em pé e de olhos abertos (âmbar), a fera das cavernas presa no âmbar, a parede de
   âmbar com a silhueta de um bicho enorme (fraca), a estalactite de resina grande, o bolhão de resina (âmbar) e o
   ninho de vespas de papel. No Berçário: o ovo grande que pulsa, o cacho de ovos, o casulo de pupa em pé, a pilha de
   cascas de larva, a larva gigante morta, a poça de geleia real num berço de cera rachado (rosada) e o cacho de casulos.
   O mesmo pintor do 122/132 (rampas de 6 tons da seção 12 da ficha mais as anãs: pedra cinza-azulada, bronze, ferro,
   madeira), luz de cima à esquerda, contorno escuro só onde o desenho toca o ar. O jogo é visto de lado: nada é disco
   deitado no chão; cada objeto fica no chão, pendurado no teto ou é uma peça plana da parede de fundo. Os presos no
   âmbar são pintados à parte com rampas misturadas ao âmbar (vê-se o anão através da resina, sem sangue).
   Luz só no que a ficha diz que brilha, sempre fraca (a camada é escura e morna): runa (azul), mural (âmbar), anão no
   âmbar (âmbar), parede de âmbar (fraca), bolhão (âmbar), geleia real (rosada). O lustre está apagado.
   Animados (ganchos no fim; `luz: []` faz o objeto entrar em visProps sem acender nada):
     anim { k: 'cm_gota' }    a gota de mel gigante: uma gota cresce na ponta, solta e cai até o chão (drawWorld);
     anim { k: 'cm_ovo' }     o ovo grande incha e cora devagar, como um coração lento (drawWorld);
     anim { k: 'cm_larvas' }  o mural: cada larva acesa pisca no seu ritmo (drawTop, e o brilho respira junto).
   Registrados com defProp (`colmeia: true`), postos pelo 195 a partir do CM_PROP_PLAN (o mesmo passeio do
   cdPlaceProps do 136). Peças de fundo em CM_BACK_FLOOR ficam em pé no chão; as outras de fundo, na altura dos olhos.
   Flags que o gerador respeita:
     brecha: true   só dentro dos salões anões da Brecha Tomada (piso de pedra), nunca nos túneis de inseto;
     camara: true   só dentro das câmaras de âmbar;
     ninho: true    só nas câmaras de ovos do Berçário;
     naoMel: true   nunca sobre poça de mel (todo objeto de chão já evita poça de mel, ovo, escada e fio: o 195 garante;
                    a flag fica no que tem pé largo e fino, para quem quiser conferir de novo).
   Nada daqui tem faixaV: as variações servem em qualquer faixa do objeto. */
const CM_PROP_PLAN = {};
// peças de fundo que ficam em pé no chão em vez de penduradas na altura dos olhos
const CM_BACK_FLOOR = { cm_estatua_ana: 1, cm_porta_ana: 1, cm_anao_ambar: 1, cm_fera_ambar: 1, cm_parede_ambar: 1 };
const cmOvoCv = [], cmOvoFl = [];   // o ovo grande e a sua "cor" quando pulsa (ganchos no fim)
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  // as rampas da ficha (seção 12)
  ceraV: ['#2a1c0c', '#4a3416', '#6e5022', '#94702e', '#b8923e', '#d8b45a'],
  ceraN: ['#5a4618', '#8a6e28', '#b8963a', '#d8b850', '#ecd27a', '#fae8a8'],
  mel: ['#3a1e04', '#6a3a08', '#a0600e', '#d08a1a', '#f0b030', '#ffd870'],
  resina: ['#1e0a06', '#3e160a', '#64260e', '#8a3c14', '#b05a1e', '#d07e34'],
  ambar: ['#4a2006', '#7a3a0a', '#b0600e', '#d88a1c', '#f4b03a', '#ffd878'],
  real: ['#3a2018', '#64382a', '#8e5a40', '#b8825a', '#dcae80', '#f4d6a8'],
  quitina: ['#0c120e', '#1a2620', '#2a3e32', '#3e5a48', '#5a7e64', '#8aac8e'],
  ambrita: ['#4a2a08', '#7a4a10', '#b0761c', '#dca032', '#f6c856', '#fff0a8'],
  // as anãs
  pedra: ['#1a1e24', '#2c323a', '#424a54', '#5c6670', '#7a8590', '#a0aab2'],
  pedraC: ['#262b32', '#3a414a', '#535c66', '#707a84', '#8e98a2', '#b4bcc4'],
  pedraE: ['#14171c', '#22272e', '#343a42', '#4a525c', '#646e78', '#868f98'],
  bronze: ['#2a1a0c', '#4a3016', '#6e4a20', '#946830', '#b88a44', '#d8b068'],
  ferro: ['#0c0e10', '#181c20', '#262c32', '#384046', '#4e585e', '#6a767a'],
  madeira: ['#140e0a', '#261a12', '#3a281a', '#4e3824', '#644a30', '#7c5e3e'],
  // os próprios dos objetos
  pele: ['#2a1a14', '#4a2e22', '#6e4634', '#94624a', '#b88262', '#d4a482'],
  barba: ['#1e120a', '#3a2010', '#5a3418', '#7c4a22', '#9c6430', '#b8803e'],
  couro: ['#150e0a', '#271a12', '#3a281c', '#4e3726', '#644832', '#7a5a40'],
  pano: ['#1e0a0a', '#3a1212', '#5a1c1a', '#7a2a24', '#9a3a30', '#b8503e'],
  olho: ['#2a2420', '#5a5048', '#8a8070', '#b8ae9a', '#ddd4c0', '#f4eee0'],
  runa: ['#06101e', '#0c2038', '#163a5e', '#2a5e8a', '#4a8ab4', '#8ac4e6'],
  papel: ['#1e1c18', '#34302a', '#4c463c', '#666052', '#82796a', '#a09684'],
  geleia: ['#4a2a30', '#7a4450', '#a8687a', '#d0909e', '#ecbcc4', '#fce4e6'],
  seda: ['#3a3428', '#5e5644', '#857a62', '#ab9f84', '#cfc4a8', '#ece4cc'],
  asa: ['#22221e', '#3a3a32', '#58564a', '#7a786a', '#a09e90', '#c8c6ba'],
  fera: ['#141210', '#26221e', '#3a342c', '#504638', '#6a5c4a', '#887660'],
  osso: ['#2a261e', '#463f34', '#665d4e', '#8a7f6a', '#aca088', '#c8bca2'],
  morta: ['#2a2420', '#4a3e34', '#6a5a4a', '#8a7862', '#a8967c', '#c4b49a'],
  sombraA: ['#2a1004', '#3c1808', '#52220a', '#6a2e0e', '#803a12', '#984818'],
  sombra: ['#030304', '#060607', '#09090b', '#0d0d10', '#121216', '#18181c']
};
// uma rampa vista através do âmbar: a cor do bicho misturada ao miolo do âmbar
const mixHex = (a, b, k) => { const A = rgb(a), B = rgb(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0')).join(''); };
const under = (hx, k = 0.5) => R6(hx.map((h, i) => mixHex(h, ['#3a1804', '#5a2a06', '#86460c', '#a8600e', '#c88018', '#e8a838'][i], k)));
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#060504');

/* ---- o pintor (o do 122/132: 6 tons, guarda o tom de cada pixel para uma mancha manter a luz) ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, ramps, idOf,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; },
    clear(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    is(x, y, R) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0 && ramps[rid[y * w + x]] === R; },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    box(x0, y0, rw, rh, R, s, base = 2.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.4 : j === 1 ? 0.5 : 0) + (i === 0 ? 0.6 : 0) - (j === rh - 1 ? 1.3 : 0) - (i === rw - 1 ? 0.9 : 0) + cg(x, y, s) * 0.5 + cn(x, y, 60, 60, s + 1) * 0.45); },
    blob(cx, cy, rx, ry, R, s, base = 2.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 - d * 0.5 + cg(x, y, s) * 0.4); } },
    line(x0, y0, x1, y1, R, v, wd = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < wd; k++) P.put(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), R, typeof v === 'function' ? v(i / n, k) : v); } },
    done(rim = true) {
      if (rim) {
        const src = c.slice(), sr = rid.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const k = y * w + x; if (src[k]) continue;
          let n = -1; if (x > 0 && src[k - 1]) n = k - 1; else if (x < w - 1 && src[k + 1]) n = k + 1; else if (y > 0 && src[k - w]) n = k - w; else if (y < h - 1 && src[k + w]) n = k + w;
          if (n < 0) continue; const r = sr[n]; c[k] = r >= 0 ? ramps[r][0] : OUTLINE;
        }
      }
      const cv = mk(w, h), x = cv.getContext('2d'), img = x.createImageData(w, h); new Uint32Array(img.data.buffer).set(c); x.putImageData(img, 0, 0); return cv;
    }
  };
  return P;
}
// cola o pintor Q em P em (ox, oy), girado de ang em volta do (px, py) de Q (pixel mais perto, tons guardados); map troca a rampa
function blit(P, Q, ox, oy, ang = 0, px = 0, py = 0, map = null, dv = 0) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.ceil(Math.hypot(Q.w, Q.h));
  for (let y = -m; y <= m; y++) for (let x = -m; x <= m; x++) {
    const dx = x + 0.5, dy = y + 0.5, u = Math.floor(dx * ca + dy * sa + px), v = Math.floor(-dx * sa + dy * ca + py);
    if (u < 0 || v < 0 || u >= Q.w || v >= Q.h) continue; const k = v * Q.w + u; if (!Q.c[k]) continue;
    const R = Q.ramps[Q.rid[k]]; P.put(ox + px + x, oy + py + y, map ? (map.get(R) || R) : R, Q.val[k] + dv);
  }
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
// pedra lavrada em fiadas: blocos com a beira de cima e da esquerda acesas, juntas escuras
function ashlar(P, x0, y0, w, h, R, s, ch = 4, cw = 9, keep = null, base = 2.5) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x0 + x, Y = y0 + y; if (keep && !keep(X, Y)) continue;
    const row = Math.floor(y / ch), off = (row % 2) * Math.floor(cw / 2), col = Math.floor((x + off) / cw), ly = y % ch, lx = (x + off) % cw;
    const joint = ly === ch - 1 || lx === cw - 1;
    P.put(X, Y, R, joint ? base - 1.2 : base + hash2(col, row, s) * 0.9 - 0.3 + (ly === 0 ? 0.8 : 0) + (lx === 0 ? 0.4 : 0) - x / w * 0.7 + cg(X, Y, s) * 0.55);
  }
}
// uma mancha por cima do pintado (cera fina, pó): por ruído, bias(x, y) engrossa; mantém o sombreado
function stain(P, R, cover, s, bias, lift = 0) {
  const me = P.idOf(R);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] === me) continue;
    const n = cn(x, y, 22, 22, s) + cn(x, y, 70, 70, s + 1) * 0.5 + (bias ? bias(x, y) : 0);
    if (n > 0.5 - cover) P.put(x, y, R, 0.8 + P.val[k] * 0.6 + cg(x, y, s + 2) * 0.6 + lift);
  }
}
// corrente de ferro pendurada: elos de frente e de lado
function chainV(P, x, y0, y1, R = RP.ferro, base = 3.6) {
  for (let y = y0; y < y1; y++) { const k = (y - y0) % 4; if (k < 2) { P.put(x, y, R, base + (k === 1 ? -1.4 : 0.5)); P.put(x + 1, y, R, base - 1 + (k === 1 ? -1.4 : 0)); } else P.put(x + (k === 2 ? 0 : 1), y, R, base + 0.3); }
}
// entulho na linha do chão
function rubble(P, x0, x1, by, hgt, R, s) {
  for (let k = 0; k < (x1 - x0) * 0.8; k++) { const x = x0 + hash2(k, 0, s) * (x1 - x0), t = (x - x0) / (x1 - x0), y = by - hash2(k, 1, s) * hgt * Math.sin(t * Math.PI); P.blob(x, y, 1 + hash2(k, 2, s) * 1.4, 0.8 + hash2(k, 3, s), R, s + k, 2.4); }
  for (let x = x0; x <= x1; x++) if (hash2(x, 4, s) < 0.7) P.put(x, by, R, 1.8 + hash2(x, 5, s));
}

/* ---- os da colmeia ---- */
const S3 = Math.sqrt(3);
// a grade de hexágonos (ponta para cima, raio r): a célula, o centro e e (0 no meio, 1 na parede)
function hexAt(x, y, r) {
  const fq = (S3 / 3 * x - y / 3) / r, fr = (2 / 3 * y) / r, fs = -fq - fr;
  let q = Math.round(fq), rr = Math.round(fr), ss = Math.round(fs);
  const dq = Math.abs(q - fq), dr = Math.abs(rr - fr), ds = Math.abs(ss - fs);
  if (dq > dr && dq > ds) q = -rr - ss; else if (dr > ds) rr = -q - ss;
  const hx = r * S3 * (q + rr / 2), hy = r * 1.5 * rr, ax = Math.abs(x - hx), ay = Math.abs(y - hy);
  return { q, r: rr, hx, hy, dx: x - hx, dy: y - hy, e: Math.max(ax, ax * 0.5 + ay * S3 / 2) / (r * S3 / 2) };
}
// favos: paredes de cera RW, cada célula vazia (o fundo escuro, a parede de baixo à direita acesa), de mel (brilho no
// alto à esquerda), tampada (cúpula de cera nova) ou com larva (acesa ou não); pick(q, r) escolhe; keep(x, y) recorta
// devolve os centros das células com larva acesa
function comb(P, x0, y0, w, h, r, RW, s, pick, keep = null, ox = 0, oy = 0) {
  const lit = [], seen = new Set(), wallE = 1 - 1.05 / (r * S3 / 2);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (keep && !keep(x, y)) continue;
    const H = hexAt(x + 0.5 + ox, y + 0.5 + oy, r);
    if (H.e > wallE) { P.put(x, y, RW, 3.5 - (x - x0) / w * 0.7 + (H.dy > 0 && Math.abs(H.dx) < r * 0.5 ? 0.5 : 0) + cg(x, y, s) * 0.4); continue; }
    const kind = pick(H.q, H.r), u = H.dx / r, v = H.dy / r, rimS = H.e > wallE - 0.3 && u + v < -0.2;   // a sombra da parede no alto à esquerda de dentro
    if (kind === 'mel') P.put(x, y, RP.mel, 2.3 - (u + v) * 0.8 + (u < -0.1 && v < -0.1 && u + v > -0.8 && !rimS ? 1.9 : 0) - (rimS ? 1 : 0) + cg(x, y, s) * 0.3);
    else if (kind === 'tampa') P.put(x, y, RP.ceraN, 2.2 - (u + v) * 0.9 - H.e * 0.5 - (rimS ? 0.9 : 0) + cg(x, y, s) * 0.3);
    else if (kind === 'larva' || kind === 'acesa') {
      const d = Math.hypot(u + 0.05, v - 0.05), ring = d < 0.62 && d > 0.18 && !(u > 0.1 && v < -0.05);   // um C enrolado
      if (ring) P.put(x, y, kind === 'acesa' ? RP.ambar : RP.real, (kind === 'acesa' ? 4.4 : 3.4) - (u + v) * 0.7 + cg(x, y, s) * 0.3);
      else P.put(x, y, RW, 0.5 + Math.max(0, u + v) * 1.4);
      if (kind === 'acesa') { const key = H.q + ',' + H.r; if (!seen.has(key)) { seen.add(key); lit.push({ x: Math.round(H.hx - ox), y: Math.round(H.hy - oy) }); } }
    } else P.put(x, y, RW, 0.4 + Math.max(0, u + v) * 1.5 + cg(x, y, s) * 0.3);
  }
  return lit;
}
// cera escorrendo do alto do que está pintado: em cada coluna uma lâmina que desce e termina numa gota
function waxOver(P, R, s, amt, x0 = 0, x1 = P.w - 1, lip = true) {
  for (let x = x0; x <= x1; x++) {
    let y0 = -1; for (let y = 0; y < P.h; y++) if (P.has(x, y)) { y0 = y; break; }
    if (y0 < 0) continue;
    const n = cn(x, 0, 40, 4, s) + 0.5, L = Math.floor(Math.max(0, n - 0.25) * amt * (0.6 + hash2(x, 1, s) * 0.8));
    if (lip && hash2(x, 2, s) < 0.75) P.put(x, y0 - 1, R, 4 + cg(x, y0, s) * 0.5);
    for (let j = 0; j <= L; j++) if (P.has(x, y0 + j)) P.put(x, y0 + j, R, 3.6 - j / (L + 1) * 1.2 - x / P.w * 0.6 + cg(x, y0 + j, s) * 0.4);
    if (L > 2 && P.has(x, y0 + L + 1)) { P.put(x, y0 + L + 1, R, 2.8); if (hash2(x, 3, s) < 0.5) P.put(x + 1, y0 + L, R, 2.4); }
  }
}
// um fio de cera (ou mel) descendo de (x, y) por len, com a gota no fim
function drip(P, x, y, len, R, s, base = 3.6) {
  for (let j = 0; j < len; j++) P.put(x, y + j, R, base - j / len * 0.8 + cg(x, y + j, s) * 0.3);
  P.put(x, y + len, R, base - 0.6); P.put(x + 1, y + len, R, base - 1.4); P.put(x, y + len + 1, R, base - 1.2);
}
// um inchaço de cera subindo do chão: corpo por ruído, cristas acesas
function waxMound(P, cx, by, rx, ry, R, s, base = 2.6) {
  for (let y = Math.floor(by - ry * 1.3); y <= by; y++) for (let x = Math.floor(cx - rx * 1.3); x <= cx + rx * 1.3; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - by) / ry, d = dx * dx + dy * dy + cn(x, y, 30, 30, s) * 0.9;
    if (d > 1) continue;
    P.put(x, y, R, base + 0.9 - (dx + dy) * 0.6 - d * 0.6 + Math.sin(y * 0.9 + dx * 2) * 0.35 + cg(x, y, s) * 0.4);
  }
}
// luz âmbar das paredes nas beiradas de cima de uma carapaça escura (onde há ar logo acima ou à esquerda)
function rimLight(P, R, L, v = 3) {
  const src = P.c.slice();
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!src[k] || P.ramps[P.rid[k]] !== R) continue;
    const thick = y < P.h - 2 && src[k + P.w] && src[k + 2 * P.w] && x > 0 && x < P.w - 1 && src[k - 1] && src[k + 1];
    if (thick && (y === 0 || !src[k - P.w])) P.put(x, y, L, v + P.val[k] * 0.25);
  }
}
// um ovo em pé (mais fino em cima), pele translúcida, brilho no alto à esquerda; inner(x, y) escurece o que há dentro
function egg(P, cx, by, rx, ry, R, s, inner = null) {
  for (let y = Math.floor(by - ry * 2); y <= by; y++) {
    const t = (by - y) / (ry * 2), hw = rx * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.47) / 0.53, 2))) * (1.04 - t * 0.22);
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const u = (x + 0.5 - cx) / Math.max(1, hw), sh = u < -0.2 && t > 0.55 && t < 0.82 && u > -0.7;
      let v = 3.5 - u * 1.1 - (1 - t) * 0.5 + (sh ? 1.5 : 0) + cg(x, y, s) * 0.3;
      if (inner) v -= inner(x, y, u, t);
      P.put(x, y, R, v);
    }
  }
}
// um casulo de seda em fuso, faixas enroladas em diagonal
function spindle(P, cx, y0, len, wd, R, s, shade = null) {
  for (let y = y0; y < y0 + len; y++) {
    const t = (y - y0) / len, hw = wd / 2 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.7);
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const u = (x + 0.5 - cx) / Math.max(1, hw), band = ((y + x * 0.6 + s) % 4 + 4) % 4 < 1;
      P.put(x, y, R, 3.4 - u * 1.2 - t * 0.4 + (band ? -0.7 : 0) - (shade ? shade(x, y, u, t) : 0) + cg(x, y, s) * 0.35);
    }
  }
}

/* ---- o anão (22 x 40 a partir de ox, oy): poses 'martelo', 'machado', 'lado', 'maos', 'picareta';
   M: { pele, barba, ferro, roupa, couro, bronze, olho } rampas; M.aberto: olhos abertos (brancos com a pupila no
   meio); M.grito: a boca aberta; M.estatua: olhos de pedra fundos ---- */
function dwarf(P, ox, oy, pose, M, s) {
  const put = (x, y, R, v) => P.put(ox + x, oy + y, R, v), g = (x, y) => cg(ox + x, oy + y, s);
  const arm = (ax, ay, bx, by, R, w = 3.6) => tube(P, t => [ox + ax + (bx - ax) * t, oy + ay + (by - ay) * t], () => w, R, s, 2.6);
  const hand = (x, y) => P.blob(ox + x, oy + y, 1.9, 1.7, M.pele, s, 3);
  // pernas e botas
  for (let y = 28; y < 36; y++) for (const lx of [5, 12]) for (let x = lx; x < lx + 5; x++) put(x, y, M.roupa, 2.6 - (x - lx) * 0.3 - (lx === 12 ? 0.5 : 0) + g(x, y) * 0.4);
  for (let y = 36; y < 40; y++) { for (let x = 3; x < 10; x++) put(x, y, M.couro, (y === 36 ? 3.6 : 2.6) - (x - 3) * 0.15 + g(x, y) * 0.4); for (let x = 11; x < 18; x++) put(x, y, M.couro, (y === 36 ? 3 : 2.1) - (x - 11) * 0.12 + g(x, y) * 0.4); }
  // braços atrás do corpo (lado, machado: o esquerdo)
  if (pose === 'lado' || pose === 'machado' || pose === 'picareta') { arm(3, 15, 1, 26, M.ferro); hand(1.5, 27.5); }
  if (pose === 'lado') { arm(19, 15, 21, 26, M.ferro); hand(20.5, 27.5); }
  // a cota de malha até o joelho, o cinto com fivela de bronze
  for (let y = 13; y < 31; y++) { const hw = 7.6 + (y - 13) * 0.12; for (let x = Math.floor(11 - hw); x <= 11 + hw; x++) { const u = (x + 0.5 - 11) / hw; put(x, y, M.ferro, 3 - u * 1.2 + ((x + y) % 2 ? -0.5 : 0.2) - (y === 30 ? 0.9 : 0) + g(x, y) * 0.3); } }
  for (let x = 3; x < 20; x++) { put(x, 25, M.couro, 3 - (x - 3) * 0.06); put(x, 26, M.couro, 1.8); }
  P.rect(ox + 10, oy + 25, 3, 2, M.bronze, (i, j) => 4.2 - i * 0.6 - j);
  // ombreiras
  P.blob(ox + 4, oy + 14, 3.3, 2.4, M.ferro, s, 3.1); P.blob(ox + 18, oy + 14, 3.3, 2.4, M.ferro, s + 1, 2.5);
  // a barba: larga, em mechas, terminando em trança
  for (let y = 10; y < 29; y++) {
    const hw = y < 20 ? 3.6 + (y - 10) * 0.45 : 8.1 - (y - 20) * 0.95; if (hw < 0.6) continue;
    for (let x = Math.floor(11 - hw); x <= 11 + hw; x++) { const u = (x + 0.5 - 11) / hw; put(x, y, M.barba, 3.3 - u * 1 + Math.sin(x * 2.2 + s) * 0.55 - (y - 10) * 0.04 + g(x, y) * 0.3); }
  }
  for (let y = 22; y < 29; y++) put(11, y, M.barba, 1.6 + (y % 2) * 0.8);   // a trança
  put(10, 28, M.bronze, 4); put(11, 28, M.bronze, 3.4);
  // o rosto: bochechas, nariz grande, sobrancelhas fartas, olhos
  for (let y = 7; y < 12; y++) for (let x = 6; x < 17; x++) put(x, y, M.pele, 3.4 - (x - 6) * 0.12 - (y === 11 ? 0.5 : 0) + g(x, y) * 0.3);
  for (let x = 6; x < 17; x++) if (x < 10 || x > 12) put(x, 7, M.barba, 3.6 - (x - 6) * 0.1 + g(x, 7) * 0.4);
  if (M.estatua) { for (const ex of [8, 14]) { put(ex, 8, M.pele, 1.2); put(ex - 1, 8, M.pele, 2); put(ex, 9, M.pele, 2.2); } }
  else for (const ex of [7, 13]) {
    for (let i = 0; i < 3; i++) put(ex + i, 8, M.olho, 4.6 - i * 0.3);
    put(ex + 1, 8, M.olho, 0.4); put(ex + 1, 9, M.olho, M.aberto ? 4.2 : 3);   // a pupila no meio, o branco embaixo dela: arregalado
    if (M.aberto) { put(ex, 9, M.olho, 3.2); put(ex + 2, 9, M.olho, 2.8); }
  }
  P.blob(ox + 11.5, oy + 10, 1.7, 1.6, M.pele, s + 2, 3.3);
  if (M.grito) for (let y = 12; y < 15; y++) for (let x = 10; x < 13 + (y === 13 ? 1 : 0); x++) put(x, y, M.olho, y === 12 ? 1 : 0.3);
  // o elmo: cúpula, aro, nasal, rebites de bronze
  for (let y = 0; y < 7; y++) { const hw = Math.sqrt(Math.max(0, 1 - Math.pow((6.5 - y) / 7, 2))) * 7.4; for (let x = Math.floor(11 - hw); x <= 11 + hw; x++) { const u = (x + 0.5 - 11) / Math.max(1, hw); put(x, y, M.ferro, 3.7 - u * 1.4 - (6 - y) * 0.05 + (Math.abs(x + 0.5 - 11.5) < 0.6 ? 0.8 : 0) + g(x, y) * 0.3); } }
  for (let x = 3; x < 20; x++) { put(x, 6, M.ferro, 4.2 - (x - 3) * 0.08); put(x, 7, M.ferro, 2.2 - (x - 3) * 0.04); }
  for (let y = 7; y < 10; y++) put(11, y, M.ferro, 3.8 - (y - 7) * 0.4);
  for (const x of [5, 9, 13, 17]) put(x, 6, M.bronze, 4.2 - x * 0.06);
  // os braços na frente, conforme a pose
  if (pose === 'martelo') {
    // as mãos juntas no cabo, o martelo de cabeça para baixo apoiado entre os pés
    for (let y = 17; y < 34; y++) { put(10, y, M.couro, 3.2); put(11, y, M.couro, 2.2); }
    P.rect(ox + 4, oy + 33, 14, 7, M.ferro, (i, j) => 3.4 - i * 0.12 + (j === 0 ? 1 : 0) - (j === 6 ? 1 : 0) + (i === 0 ? 0.6 : 0) + g(i, j) * 0.4);
    P.rect(ox + 9, oy + 35, 4, 3, M.bronze, (i, j) => 3.8 - i * 0.4 - j * 0.3);
    arm(4, 15, 9, 21, M.ferro); arm(18, 15, 12, 21, M.ferro); hand(10.5, 21.5);
  } else if (pose === 'machado') {
    for (let y = -5; y < 40; y++) { put(20, y, M.couro, 3.3); put(21, y, M.couro, 2.2); }
    for (let y = -4; y < 8; y++) { const t = (y + 4) / 11, wd = 6.5 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.5) / 0.55, 2))); for (let x = 22; x < 22 + wd; x++) put(x, y, M.ferro, 3.6 - (x - 22) * 0.12 - t * 0.6 + (x >= 21 + wd - 1 ? 1.2 : 0) + g(x, y) * 0.3); }
    for (let y = -2; y < 6; y++) put(19, y, M.ferro, 2.6);
    arm(18, 15, 20, 22, M.ferro); hand(20.5, 22);
  } else if (pose === 'maos') {
    // os dois braços para cima, as mãos espalmadas contra o que o prende
    arm(4, 14, 0.5, 2, M.ferro, 3.4); arm(18, 14, 21.5, 2, M.ferro, 3.4);
    for (const hx of [0.5, 21.5]) { P.blob(ox + hx, oy + 0.5, 2.2, 2, M.pele, s + 3, 3.1); for (let f = -1; f <= 1; f++) for (let j = 1; j < 3; j++) put(Math.round(hx) + f * 1, -1 - j + (f === 0 ? 0 : 1), M.pele, 3.4 - j * 0.3 - f * 0.3); }
  } else if (pose === 'picareta') {
    arm(18, 15, 19, 5, M.ferro, 3.4); hand(19.5, 4.5);
    P.line(ox + 22, oy + 11, ox + 17, oy - 5, M.couro, (t, k) => 3.2 - k, 2);
    for (let x = 7; x < 28; x++) { const t = (x - 7) / 20, y = -4 + Math.pow(t - 0.5, 2) * 12 - 1; put(x, Math.round(y), M.ferro, 3.8 - t * 0.8 + g(x, 0) * 0.3); put(x, Math.round(y) + 1, M.ferro, 2.2); }
  }
}
const STONE = { pele: RP.pedraC, barba: RP.pedra, ferro: RP.pedraE, roupa: RP.pedraE, couro: RP.pedra, bronze: RP.pedraC, olho: RP.pedra, estatua: true };
const PRESO = { pele: under(HX.pele, 0.42), barba: under(HX.barba, 0.45), ferro: under(HX.ferro, 0.5), roupa: under(HX.pano, 0.5), couro: under(HX.couro, 0.5), bronze: under(HX.bronze, 0.4), olho: under(HX.olho, 0.22), aberto: true };

// o âmbar por cima de quem está preso: inside(x, y) dá a massa; o preso (pintor Q) aparece mais escuro e quente
function amberLump(P, inside, Q, qx, qy, s, cx, cy) {
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    if (!inside(x, y)) continue;
    const d = Math.hypot((x + 0.5 - cx) / P.w, (y + 0.5 - cy) / P.h) * 2.2, k = Q ? (y - qy) * Q.w + (x - qx) : -1;
    const under_ = Q && x >= qx && y >= qy && x < qx + Q.w && y < qy + Q.h && Q.c[k];
    if (under_) { P.put(x, y, Q.ramps[Q.rid[k]], Q.val[k] * 0.95 + 0.15 - d * 0.25); continue; }
    P.put(x, y, RP.ambar, 3.2 - d * 1.1 - x / P.w * 0.5 + cn(x, y, 26, 26, s) * 0.8 + cg(x, y, s) * 0.25);
  }
  // a superfície: brilho escorrido na beira de cima à esquerda, bolhas presas, uma trinca
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    if (!inside(x, y)) continue;
    if (!inside(x - 2, y - 2) && inside(x + 2, y + 2) && hash2(x, y, s) < 0.7) P.put(x, y, RP.ambar, 4.8 + cg(x, y, s) * 0.4);
  }
  for (let k = 0; k < 12; k++) {
    const bx = 3 + hash2(k, 0, s) * (P.w - 6), by = 3 + hash2(k, 1, s) * (P.h - 6), big = hash2(k, 2, s) < 0.3;
    if (!inside(bx | 0, by | 0) || !inside((bx | 0) + 2, (by | 0) + 2)) continue;
    P.put(bx, by, RP.ambar, 5.2); if (big) { P.put(bx + 1, by, RP.ambar, 4.2); P.put(bx, by + 1, RP.ambar, 4); P.put(bx + 1, by + 1, RP.ambar, 2.4); }
  }
  // uma trinca fina descendo de uma beira
  { let x = P.w * (0.6 + hash2(1, 9, s) * 0.3) | 0, y = 0; while (y < P.h && !inside(x, y)) y++; for (let j = 0; j < P.h * 0.25 && inside(x, y); j++) { P.put(x, y, RP.ambar, 4.4); P.put(x + 1, y, RP.ambar, 1.6); y++; if (hash2(j, 3, s) < 0.35) x--; } }
}

/* =============================== BRECHA TOMADA =============================== */
function dwarfStatue(k) {   // 36 x 60: um anão de pedra no plinto (k 0: martelo apoiado entre os pés; k 1: machado em pé), a cera escorrendo do elmo e inchando do chão
  const W = 36, H = 60, P = painter(W, H), s = 19201 + k, yb = H - 1;
  ashlar(P, 3, 50, 30, 10, RP.pedra, s, 3, 10, null, 2.6); P.rect(2, 48, 32, 2, RP.pedra, (i, j) => 4.4 - j * 1.4 - i * 0.04 + cg(i, j, s) * 0.4);
  for (let x = 6; x < 30; x += 4) P.put(x, 54, RP.pedra, 1.2);   // runas na base, gastas
  dwarf(P, 7, 8, k ? 'machado' : 'martelo', STONE, s);
  // uma lasca faltando no ombro, uma trinca descendo a barba
  for (let y = 21; y < 33; y++) P.put(16 + Math.round(Math.sin(y * 0.8) * 0.8), y, RP.pedra, 1.1);
  // a cera: escorre do elmo e dos ombros, empoça no plinto, incha do chão e sobe pelo lado direito
  waxOver(P, RP.ceraV, s + 3, 10);
  waxMound(P, 31, yb, 8, 22, RP.ceraV, s + 4, 2.2); waxMound(P, 25, yb, 6, 8, RP.ceraV, s + 5, 2.6);
  for (const [x, y, l] of [[9, 20, 9], [16, 31, 7], [22, 22, 12], [12, 47, 4]]) drip(P, x, y, l, RP.ceraV, s + x);
  for (let x = 2; x < 34; x++) if (hash2(x, 9, s) < 0.6) P.put(x, 47, RP.ceraV, 3.8);
  return P.done();
}
function dwarfAnvil() {   // 32 x 22: a bigorna anã no seu cepo de pedra, o martelo largado em cima, metade engolida pela cera
  const P = painter(32, 22), s = 19221, yb = 21;
  ashlar(P, 8, 14, 16, 8, RP.pedra, s, 4, 8, null, 2.6);
  for (let y = 9; y < 14; y++) for (let x = 11; x < 21; x++) P.put(x, y, RP.ferro, 3 - (x - 11) * 0.18 + cg(x, y, s) * 0.3);
  // a mesa e o chifre afinando para a esquerda, o talão quadrado à direita
  for (let x = 0; x < 30; x++) { const top = x < 8 ? 5 + Math.round((8 - x) * 0.25) : 5, bot = x < 8 ? 8 - Math.round((8 - x) * 0.3) : x < 11 || x > 21 ? 8 : 9; for (let y = top; y <= bot; y++) P.put(x, y, RP.ferro, (y === top ? 4.6 : y === top + 1 ? 3.6 : 2.6) - x * 0.03 + cg(x, y, s) * 0.3); }
  P.put(24, 5, RP.sombra, 2); P.put(27, 5, RP.sombra, 2);   // furos do talão
  // o martelo deitado em cima: cabo e cabeça
  P.line(9, 3, 21, 4, RP.madeira, (t) => 3.6 - t * 0.6, 1); P.line(9, 4, 21, 5, RP.madeira, 2.2, 1);
  P.rect(5, 1, 5, 4, RP.ferro, (i, j) => 3.8 - i * 0.3 - j * 0.4);
  // a cera: um inchaço pela direita que cobre o talão e escorre pelo cepo
  waxMound(P, 27, 14, 7, 12, RP.ceraV, s + 2, 2.4); waxMound(P, 30, yb, 4, 6, RP.ceraV, s + 3, 2.2);
  waxOver(P, RP.ceraV, s + 4, 6, 12, 31);
  for (const [x, y, l] of [[22, 9, 8], [18, 9, 4], [13, 14, 5]]) drip(P, x, y, l, RP.ceraV, s + x);
  for (let x = 0; x < 32; x++) if (hash2(x, 6, s) < 0.35) P.put(x, yb, RP.pedra, 1.8 + hash2(x, 7, s));
  return P.done();
}
function barrel(P, x0, by, w, h, s, rot = 0, lying = false) {   // o barril do 132, com aros de bronze
  const L = lying ? w : h, D = lying ? h : w, c = D / 2;
  for (let a = 0; a < L; a++) {
    const t = a / (L - 1), hw = c * (0.74 + 0.26 * Math.sin(t * Math.PI)), hoop = [0.1, 0.9, 0.32, 0.68].some(q => Math.abs(t - q) < 0.5 / L + 0.01);
    for (let b = Math.floor(c - hw); b < c + hw; b++) {
      const u = (b + 0.5 - c) / hw, st = Math.floor((u + 1) * 2.6), edge = Math.abs(((u + 1) * 2.6) % 1) < 0.2;
      const x = lying ? x0 + a : x0 + b, y = lying ? by - h + 1 + b : by - h + 1 + a;
      if (rot && !hoop && hash2(st, 0, s) < rot * 0.6 && Math.abs(u) < 0.7 && t > 0.2 + hash2(st, 1, s) * 0.3 && t < 0.88) { P.put(x, y, RP.madeira, 0.5 + (u < 0 ? 0.5 : 0)); continue; }
      if (hoop) { P.put(x, y, RP.bronze, 3.4 - u * 1.4 + cg(x, y, s) * 0.3); continue; }
      P.put(x, y, RP.madeira, 3.4 - u * 1.5 + (edge ? -1 : 0) + (a === 0 && !lying ? 1.2 : 0) + cg(x, y, s + st) * 0.6);
    }
  }
}
function meadBarrel(k) {   // 22 x 24 ou 32 x 18: o barril de hidromel anão rachado, o hidromel escorrendo em fio até o chão (k 1: deitado, pingando pela torneira)
  const W = k ? 32 : 22, H = k ? 18 : 24, P = painter(W, H), s = 19241 + k, yb = H - 1;
  if (!k) {
    barrel(P, 2, yb, 17, 22, s, 0.12);
    for (let y = 6; y < 17; y++) P.put(9 + Math.round(Math.sin(y * 0.9)), y, RP.sombra, 2);   // a rachadura
    for (let y = 9; y < yb; y++) P.put(10, y, RP.mel, 4 - (y - 9) * 0.08); P.put(11, 14, RP.mel, 3);
    for (let x = 6; x < 18; x++) P.put(x, yb, RP.mel, 3.4 - Math.abs(x - 10) * 0.18);
    P.rect(7, 1, 7, 1, RP.bronze, (i) => 4 - i * 0.2);   // a marca da casa no tampo
    waxOver(P, RP.ceraV, s + 2, 5);
  } else {
    barrel(P, 1, yb - 1, 26, 16, s, 0.2, true);
    P.rect(26, 7, 3, 2, RP.bronze, (i, j) => 4 - i * 0.5 - j); P.put(29, 8, RP.bronze, 2.6);   // a torneira
    for (let y = 9; y < yb; y++) P.put(29, y, RP.mel, 4.2 - (y - 9) * 0.1);
    for (let x = 24; x < 32; x++) P.put(x, yb, RP.mel, 3.4 - Math.abs(x - 29) * 0.25);
    for (let x = 2; x < 26; x++) P.put(x, yb, RP.madeira, 1.6);   // a sombra sob o barril, tábua de calço
    P.rect(4, yb - 1, 3, 2, RP.madeira, (i, j) => 3 - i * 0.4 - j); P.rect(20, yb - 1, 3, 2, RP.madeira, (i, j) => 2.6 - i * 0.4 - j);
    waxOver(P, RP.ceraV, s + 2, 4, 0, 18);
  }
  return P.done();
}
function oreCart() {   // 42 x 28: o carrinho de minério anão nos trilhos, o minério ainda dentro, a cera engolindo a ponta esquerda
  const P = painter(42, 28), s = 19261, yb = 27;
  for (let x = 0; x < 42; x += 6) P.rect(x, 26, 4, 2, RP.madeira, (i, j) => 2.8 - i * 0.3 - j * 0.8);
  for (let x = 0; x < 42; x++) { P.put(x, 24, RP.ferro, 4.2 - x * 0.02); P.put(x, 25, RP.ferro, 2.2); }
  // as rodas (de lado, em pé): aro, raios, cubo
  for (const wx of [11, 31]) { const wy = 20, wr = 4; for (let a = 0; a < 6.3; a += 0.1) { P.put(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, RP.ferro, 3.4 - Math.cos(a + 0.8) * 1.2); P.put(wx + Math.cos(a) * (wr - 1), wy + Math.sin(a) * (wr - 1), RP.ferro, 2); } P.line(wx - 3, wy, wx + 3, wy, RP.ferro, 2.6); P.line(wx, wy - 3, wx, wy + 3, RP.ferro, 2.6); P.blob(wx, wy, 1.2, 1.2, RP.bronze, s, 3.4); }
  // a caçamba em trapézio, chapas rebitadas, cintas
  for (let y = 6; y < 19; y++) { const t = (y - 6) / 12, xa = 2 + Math.round(t * 4), xb = 39 - Math.round(t * 4); for (let x = xa; x <= xb; x++) P.put(x, y, RP.ferro, (y === 6 ? 4.4 : y === 7 ? 3.4 : 2.7) - (x - xa) / (xb - xa) * 0.9 + (x === xa ? 0.8 : 0) - (y === 18 ? 0.9 : 0) + cg(x, y, s) * 0.35); }
  for (const x of [10, 21, 31]) for (let y = 7; y < 18; y++) P.put(x, y, RP.ferro, 3.6);
  for (const x of [5, 10, 16, 21, 26, 31, 36]) { P.put(x, 9, RP.bronze, 4); P.put(x, 16, RP.bronze, 3.4); }
  // o minério acima da borda: pedras escuras com pontos de brilho
  for (let k = 0; k < 9; k++) P.blob(9 + k * 3.3, 5 - hash2(k, 0, s) * 2.6, 2 + hash2(k, 1, s) * 1.2, 1.8, RP.pedra, s + k, 2.2);
  for (let k = 0; k < 5; k++) P.put(11 + hash2(k, 2, s) * 24, 3 + hash2(k, 3, s) * 2, RP.ambrita, 4.2);
  // a cera: crosta grossa engolindo a ponta esquerda, favo novo por cima, fios escorrendo
  waxMound(P, 5, yb - 2, 8, 17, RP.ceraV, s + 2, 2.3);
  comb(P, 0, 4, 12, 12, 2.4, RP.ceraN, s + 3, (q, r) => hash2(q, r, s) < 0.5 ? 'tampa' : 'vazio', (x, y) => P.has(x, y) && P.is(x, y, RP.ceraV) && cn(x, y, 30, 30, s + 4) > -0.1);
  waxOver(P, RP.ceraV, s + 5, 9, 12, 26);
  for (const [x, l] of [[16, 9], [24, 5], [36, 7]]) drip(P, x, 7, l, RP.ceraV, s + x);
  return P.done();
}
function dwarfDoor() {   // 38 x 50: a porta anã de duas folhas de pedra entre pilares, runas no lintel, lacrada por um favo inteiro na junta
  const P = painter(38, 50), s = 19281, yb = 49;
  ashlar(P, 0, 6, 6, 44, RP.pedra, s, 4, 6, null, 2.8); ashlar(P, 32, 6, 6, 44, RP.pedra, s + 1, 4, 6, null, 2.2);
  P.rect(0, 0, 38, 7, RP.pedra, (i, j) => 3.4 - (j === 0 ? -1 : 0) - (j === 6 ? 1.3 : 0) - i * 0.03 + cg(i, j, s) * 0.5);
  for (let x = 6; x < 32; x += 5) { P.put(x, 2, RP.pedra, 1); P.put(x + 1, 3, RP.pedra, 1); P.put(x, 4, RP.pedra, 1); P.put(x + 2, 2, RP.pedra, 1.2); }   // runas cavadas
  // as folhas: lajes lisas, cintas de bronze, argolas
  for (let y = 7; y <= yb; y++) for (let x = 6; x < 32; x++) {
    const leaf = x < 19 ? 0 : 1, lx = leaf ? x - 19 : x - 6;
    P.put(x, y, RP.pedra, (leaf ? 2.3 : 2.9) - lx * 0.04 + (lx === 0 ? 0.7 : 0) + (lx === 12 ? -0.9 : 0) + ((y - 7) % 14 === 0 ? -0.8 : 0) + cg(x, y, s) * 0.45);
  }
  for (const y of [15, 36]) for (let x = 6; x < 32; x++) { P.put(x, y, RP.bronze, 3.8 - x * 0.04); P.put(x, y + 1, RP.bronze, 2.2); }
  for (const cx of [15, 22]) for (let a = 0; a < 6.3; a += 0.4) P.put(cx + Math.cos(a) * 2, 27 + Math.sin(a) * 2.4, RP.bronze, Math.cos(a + 2.4) > 0 ? 4.2 : 2.4);
  // o lacre: um favo de cera nova crescido na junta, espalhado, e escorrido do lintel
  const keep = (x, y) => { const dx = (x + 0.5 - 19) / 11, dy = (y + 0.5 - 30) / 17; return dx * dx + dy * dy + cn(x, y, 26, 26, s + 2) * 0.9 < 1 && y < yb + 1; };
  for (let y = 10; y <= yb; y++) for (let x = 4; x < 34; x++) if (keep(x, y) && !keep(x, y - 1)) P.put(x, y - 1, RP.ceraV, 3.8);
  comb(P, 4, 10, 30, 40, 2.6, RP.ceraV, s + 3, (q, r) => { const h = hash2(q, r, s); return h < 0.55 ? 'tampa' : h < 0.75 ? 'mel' : 'vazio'; }, keep);
  waxOver(P, RP.ceraV, s + 4, 7, 2, 36);
  return P.done();
}
function dwarfBanner() {   // 24 x 44: o estandarte anão na sua vara de bronze, martelo e bigorna bordados, a metade de baixo engolida por favo
  const P = painter(24, 44), s = 19301;
  for (let x = 0; x < 24; x++) { P.put(x, 1, RP.bronze, 4.2 - x * 0.05); P.put(x, 2, RP.bronze, 2.4); }
  P.blob(1, 1.5, 1.6, 1.6, RP.bronze, s, 3.4); P.blob(22.5, 1.5, 1.6, 1.6, RP.bronze, s, 2.8);
  // o pano: vermelho anão, rabo de andorinha, dobras, furos
  for (let x = 3; x < 21; x++) {
    const cut = 38 - Math.abs(x + 0.5 - 12) * 0.7 * -1 - 6, L = Math.round(x < 12 ? cut - (12 - x) * 0.6 + 6 : cut - (x - 12) * 0.6 + 6);
    for (let y = 3; y < Math.min(42, L); y++) { if (cn(x, y, 30, 30, s) + 0.5 < (y - 20) * 0.02) continue; P.put(x, y, RP.pano, 3 - (x - 3) * 0.05 + Math.sin(x * 1.1 + 1) * 0.6 - y * 0.015 + cg(x, y, s) * 0.4); }
  }
  for (let y = 3; y < 36; y++) { P.put(4, y, RP.bronze, 3.2); P.put(19, y, RP.bronze, 2.4); }
  // o bordado: o martelo sobre a bigorna
  P.rect(8, 9, 8, 3, RP.bronze, (i, j) => 4 - i * 0.2 - j * 0.4); for (let y = 12; y < 19; y++) { P.put(11, y, RP.bronze, 3.6); P.put(12, y, RP.bronze, 2.6); }
  P.rect(7, 20, 10, 2, RP.bronze, (i, j) => 3.8 - i * 0.15 - j * 0.5); P.rect(9, 22, 6, 2, RP.bronze, (i, j) => 3 - i * 0.2);
  // a colmeia comeu de baixo: favo subindo até o meio, cera escorrida da vara
  const keep = (x, y) => y > 26 + cn(x, y, 40, 40, s + 1) * 12 && P.has(x, y);
  comb(P, 0, 18, 24, 26, 2.4, RP.ceraV, s + 2, (q, r) => hash2(q, r, s) < 0.6 ? 'tampa' : 'vazio', keep);
  for (const [x, l] of [[6, 8], [14, 12], [18, 5]]) drip(P, x, 3, l, RP.ceraV, s + x);
  return P.done();
}
function dwarfRune(k) {   // 26 x 26: uma placa de pedra com uma runa anã cavada, os sulcos ainda acesos de azul debaixo de uma película de cera
  const P = painter(26, 26), s = 19321 + k;
  P.box(1, 1, 24, 24, RP.pedra, s, 2.5);
  for (let i = 0; i < 24; i++) { P.put(1 + i, 1, RP.pedra, 4.2); P.put(1, 1 + i, RP.pedra, 3.8); P.put(24, 1 + i, RP.pedra, 1.3); P.put(1 + i, 24, RP.pedra, 1.2); }
  // a runa: k 0, um tronco com dois ramos (a da forja); k 1, um losango com pés (a da casa)
  const strokes = k ? [[13, 4, 20, 12], [20, 12, 13, 20], [13, 20, 6, 12], [6, 12, 13, 4], [9, 17, 5, 22], [17, 17, 21, 22]] : [[10, 4, 10, 22], [10, 6, 18, 11], [10, 12, 18, 17], [16, 20, 20, 22]];
  const G = painter(26, 26);
  for (const [a, b, c, d] of strokes) G.line(a, b, c, d, RP.runa, 4.6, 2);
  // a película de cera: cobre a placa por manchas, escorrida para baixo; onde cobre a runa, a luz passa mais fraca
  const wax = (x, y) => cn(x, y, 30, 30, s + 1) + (y - 10) * 0.02 > 0.12;
  for (let y = 0; y < 26; y++) for (let x = 0; x < 26; x++) {
    if (!P.has(x, y)) continue;
    const groove = G.has(x, y), w = wax(x, y);
    if (groove) { P.put(x, y, RP.runa, w ? 3.1 + cg(x, y, s) * 0.4 : 4.4 - (G.has(x - 1, y - 1) ? 0 : 0.6) + cg(x, y, s) * 0.3); if (!w && !G.has(x + 1, y + 1)) P.put(x + 1, y + 1, RP.pedra, 1); }
    else if (w) P.put(x, y, RP.ceraV, 1.2 + P.val[y * 26 + x] * 0.4 + cg(x, y, s) * 0.4);
  }
  for (const [x, l] of [[5, 5], [12, 3], [19, 6]]) drip(P, x, 23, l, RP.ceraV, s + x, 2.8);
  return P.done();
}
function chandelier() {   // 42 x 40: o lustre anão de ferro na corrente, velas mortas nos copos, quatro casulos pendurados nele e fios de cera até o teto
  const P = painter(42, 40), s = 19341;
  chainV(P, 20, 0, 10);
  P.line(21, 10, 4, 16, RP.ferro, 3, 1); P.line(21, 10, 38, 16, RP.ferro, 2.4, 1); P.line(21, 10, 21, 16, RP.ferro, 2.8, 1);
  for (let x = 2; x < 41; x++) { P.put(x, 17, RP.ferro, 4 - x * 0.04); P.put(x, 18, RP.ferro, 3 - x * 0.04); P.put(x, 19, RP.ferro, 1.8); }
  for (const x of [3, 12, 21, 30, 39]) { P.rect(x - 1, 15, 3, 2, RP.bronze, (i, j) => 4 - i * 0.6 - j * 0.6); const h = 2 + (hash2(x, 0, s) * 4 | 0); for (let y = 15 - h; y < 15; y++) { P.put(x, y, RP.ceraN, 3.6); } P.put(x, 15 - h, RP.sombra, 2); }
  // os casulos: seda, cada um no seu fio
  for (const [x, top, len, wd] of [[7, 19, 16, 6], [16, 19, 19, 7], [26, 19, 12, 5], [35, 19, 17, 6]]) {
    for (let y = top; y < top + 2; y++) P.put(x, y, RP.seda, 3);
    spindle(P, x + 0.5, top + 2, len, wd, RP.seda, s + x, (xx, yy, u, t) => (u > 0.2 && t > 0.3 && t < 0.8 ? 0.8 : 0));
  }
  // fios de cera esticados do aro ao teto, um casulo pequeno na corrente
  P.line(2, 17, 0, 0, RP.ceraN, 2.6, 1); P.line(40, 17, 41, 0, RP.ceraN, 2.2, 1); P.line(12, 17, 9, 0, RP.ceraN, 2.4, 1);
  spindle(P, 23, 3, 7, 4, RP.seda, s + 7);
  return P.done();
}

/* =============================== GALERIAS DE CERA =============================== */
function combSlab(w, h, s, broken = true) {   // um pedaço de favo de frente: células cheias, tampadas e vazias, a beira direita quebrada
  const Q = painter(w, h);
  comb(Q, 0, 0, w, h, 3.3, RP.ceraN, s, (q, r) => { const v = hash2(q, r, s); return v < 0.42 ? 'mel' : v < 0.62 ? 'tampa' : 'vazio'; }, broken ? (x, y) => x < w - 3 - cn(x, y, 40, 40, s) * 10 && y > 0 : null);
  for (let x = 0; x < w; x++) if (Q.has(x, 0)) Q.put(x, 0, RP.ceraN, 4.6);
  return Q;
}
function fallenComb(k) {   // 40 x 28 ou 42 x 20: um favo grande caído, encostado no chão (k 1: deitado e partido em dois), mel escorrido no pé
  const W = 40 + k * 2, H = k ? 20 : 28, P = painter(W, H), s = 19401 + k, yb = H - 1;
  if (!k) { const Q = combSlab(34, 18, s); blit(P, Q, 3, 8, -0.36, 0, 18); }
  else { const A = combSlab(22, 12, s), B = combSlab(16, 10, s + 1); blit(P, A, 1, 6, -0.12, 0, 12); blit(P, B, 24, 9, 0.18, 0, 10); }
  for (let x = 2; x < W - 2; x++) if (hash2(x, 1, s) < 0.85 && (P.has(x, yb - 1) || hash2(x, 2, s) < 0.4)) P.put(x, yb, RP.mel, 3.6 - Math.abs(x - W / 2) * 0.04);
  for (const x of [8, 15, 24]) if (P.has(x, yb - 4)) drip(P, x, yb - 4, 2, RP.mel, s + x, 4);
  return P.done();
}
function honeyPot(k) {   // 22 x 24 ou 26 x 16: o pote de mel de cera, barrigudo, rachado, o mel transbordando (k 1: partido, a metade de baixo e cacos, o mel espalhado)
  const W = k ? 26 : 22, H = k ? 16 : 24, P = painter(W, H), s = 19421 + k, yb = H - 1, cx = k ? 11 : 11;
  const top = k ? 6 : 3;
  for (let y = top; y <= yb; y++) {
    const t = (y - 3) / (24 - 4), hw = y < 6 ? 5.2 : 9.6 * Math.sin(Math.PI * (0.12 + t * 0.8)) + 0.4;
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const u = (x + 0.5 - cx) / hw; if (k && y < 10 && hash2(x, y, s) < 0.5 + (10 - y) * 0.1) continue; P.put(x, y, RP.ceraN, 3.3 - u * 1.3 + (y === top ? 1 : 0) - (y >= yb - 1 ? 0.8 : 0) + Math.sin(y * 1.2) * 0.2 + cg(x, y, s) * 0.35); }
  }
  if (!k) {
    for (let x = 6; x < 17; x++) P.put(x, 2, RP.ceraN, 4.4 - (x - 6) * 0.1);
    for (let x = 7; x < 16; x++) P.put(x, 1, RP.mel, 4.6 - (x - 7) * 0.12);   // o mel no gargalo, cheio até a boca
    for (const [x, l] of [[7, 8], [15, 5]]) drip(P, x, 2, l, RP.mel, s + x, 4.2);
    for (let y = 8; y < 20; y++) P.put(13 + Math.round(Math.sin(y * 0.7) * 1.2), y, RP.mel, 2.8);   // a rachadura vazando
    for (let x = 4; x < 21; x++) P.put(x, yb, RP.mel, 3.4 - Math.abs(x - 13) * 0.15);
  } else {
    for (let x = 3; x < 20; x++) if (P.has(x, 9) || P.has(x, 8)) P.put(x, 8, RP.mel, 4.2);
    P.blob(21, yb - 1, 3, 1.6, RP.ceraN, s + 3, 2.6); P.blob(1.5, yb - 0.5, 1.6, 1.2, RP.ceraN, s + 4, 2.8);
    for (let x = 0; x < W; x++) P.put(x, yb, RP.mel, 3.6 - Math.abs(x - 12) * 0.12);
  }
  return P.done();
}
function chewedWax() {   // 32 x 14: um monte de cera mastigada, bolotas velhas e novas, marcas de mandíbula
  const P = painter(32, 14), s = 19441, yb = 13;
  for (let k = 0; k < 34; k++) {
    const x = 2 + hash2(k, 0, s) * 28, t = (x - 2) / 28, top = yb - Math.sin(t * Math.PI) * 10 * (0.6 + hash2(k, 1, s) * 0.4), y = top + hash2(k, 2, s) * (yb - top);
    P.blob(x, y, 1.6 + hash2(k, 3, s) * 1.4, 1.3 + hash2(k, 4, s), hash2(k, 5, s) < 0.35 ? RP.ceraN : RP.ceraV, s + k, 2.4);
  }
  for (let k = 0; k < 7; k++) { const x = 6 + hash2(k, 6, s) * 20, y = yb - 2 - hash2(k, 7, s) * 6; if (P.has(x, y)) { P.put(x, y, RP.ceraV, 0.6); P.put(x + 1, y, RP.ceraV, 1); } }
  for (let x = 0; x < 32; x++) if (hash2(x, 8, s) < 0.5) P.put(x, yb, RP.ceraV, 2 + hash2(x, 9, s));
  return P.done();
}
function workerCarcass() {   // 44 x 20: a carcaça de uma operária de patas para cima: abdômen, tórax, cabeça com mandíbulas, seis patas encolhidas, uma asa amassada
  const P = painter(44, 20), s = 19461, yb = 19;
  // a asa por baixo do corpo, amassada, translúcida
  for (let y = 5; y < 15; y++) for (let x = 24; x < 42; x++) { const t = (x - 24) / 18; if (y < 7 + t * 2 || y > 14 - t * 3 + Math.sin(x) * 0.8) continue; P.put(x, y, RP.asa, ((x * 3 + y * 5) % 7 === 0 ? 3.4 : 1.6 + t * 0.6) + cg(x, y, s) * 0.5); }
  // o corpo de lado, de costas no chão
  P.blob(31, 13.5, 10, 5.4, RP.quitina, s, 2.4);
  for (let x = 23; x < 41; x += 4) for (let y = 9; y < 19; y++) if (P.is(x, y, RP.quitina)) P.put(x, y, RP.quitina, 1.2);   // os anéis do abdômen
  P.line(19, 15, 22, 15, RP.quitina, 2.4, 2);
  P.blob(16, 14, 4.8, 4.2, RP.quitina, s + 1, 2.6);
  P.blob(7.5, 14.5, 4.4, 3.8, RP.quitina, s + 2, 2.4);
  P.put(7, 12, RP.ambar, 2.6); P.put(8, 12, RP.ambar, 1.6);   // o olho apagado
  // mandíbulas abertas, antenas largadas no chão
  P.line(4, 15, 0, 17, RP.quitina, 3, 1); P.line(4, 17, 1, 19, RP.quitina, 2.4, 1); P.put(0, 18, RP.quitina, 3.4);
  P.line(6, 11, 2, 6, RP.quitina, 2.8, 1); P.line(2, 6, 0, 10, RP.quitina, 2.4, 1);
  P.line(8, 11, 5, 4, RP.quitina, 2.4, 1); P.line(5, 4, 3, 5, RP.quitina, 2, 1);
  // as patas para cima, dobradas no joelho
  for (let i = 0; i < 3; i++) { const bx = 13 + i * 3.4, kx = 10 + i * 5, ky = 3 + (i % 2) * 2, fx = 14 + i * 5.5, fy = 1 + i % 2; P.line(bx, 10, kx, ky, RP.quitina, 2.8, 1); P.line(kx, ky, fx, fy, RP.quitina, 2.4, 1); P.put(fx + 1, fy, RP.quitina, 1.6); }
  rimLight(P, RP.quitina, RP.ambar, 2.4);
  for (let x = 2; x < 42; x++) if (hash2(x, 3, s) < 0.3) P.put(x, yb, RP.ceraV, 2 + hash2(x, 4, s));
  return P.done();
}
function larvaMural(k) {   // 44 x 34: um painel de favos na parede, moldura de cera velha; células tampadas, de mel, vazias e com larvas acesas (k 1: mais larvas, menos mel)
  const P = painter(44, 34), s = 19481 + k;
  const keep = (x, y) => { const dx = (x + 0.5 - 22) / 22, dy = (y + 0.5 - 17) / 17; return Math.pow(Math.abs(dx), 3) + Math.pow(Math.abs(dy), 3) + cn(x, y, 40, 40, s) * 0.5 < 0.95; };
  const inner = (x, y) => { const dx = (x + 0.5 - 22) / 19, dy = (y + 0.5 - 17) / 14; return Math.pow(Math.abs(dx), 3) + Math.pow(Math.abs(dy), 3) + cn(x, y, 40, 40, s) * 0.5 < 0.9; };
  for (let y = 0; y < 34; y++) for (let x = 0; x < 44; x++) if (keep(x, y) && !inner(x, y)) P.put(x, y, RP.ceraV, 3 - x / 44 * 0.8 - (y - 17) * 0.03 + Math.sin(x * 0.5 + y * 0.9) * 0.4 + cg(x, y, s) * 0.5);
  const lit = comb(P, 0, 0, 44, 34, 2.9, RP.ceraV, s + 1, (q, r) => { const v = hash2(q, r, s); return v < (k ? 0.3 : 0.22) ? 'acesa' : v < 0.5 ? 'tampa' : v < (k ? 0.58 : 0.7) ? 'mel' : v < 0.8 ? 'larva' : 'vazio'; }, inner);
  for (const [x, l] of [[9, 4], [27, 6], [35, 3]]) { let y = 33; while (y > 0 && !P.has(x, y)) y--; drip(P, x, y, l, RP.ceraV, s + x, 3); }
  return [P.done(), lit];
}
function hangingComb(k) {   // 30 x 42 ou 38 x 34: o favo pendente do teto, preso numa crosta de cera, afinando para baixo, mel pingando da ponta (k 1: duas folhas)
  const W = k ? 38 : 30, H = k ? 34 : 42, P = painter(W, H), s = 19501 + k;
  const sheet = (cx, hw0, len, sd, dv) => {
    const keep = (x, y) => { const t = y / len, hw = hw0 * Math.sqrt(Math.max(0, 1 - t * t)) * (1 - t * 0.15); return Math.abs(x + 0.5 - cx) < hw + cn(x, y, 50, 50, sd) * 2 && y < len; };
    const Q = painter(W, H);
    comb(Q, 0, 2, W, H - 2, 3, RP.ceraN, sd, (q, r) => { const v = hash2(q, r, sd); return v < 0.45 ? 'mel' : v < 0.75 ? 'tampa' : 'vazio'; }, keep);
    blit(P, Q, 0, 0, 0, 0, 0, null, dv);
    for (let x = Math.floor(cx - hw0 * 0.6); x < cx + hw0 * 0.6; x++) { let y = len; while (y > 2 && !Q.has(x, y)) y--; if (hash2(x, 0, sd) < 0.18) drip(P, x, y, 2 + (hash2(x, 1, sd) * 4 | 0), RP.mel, sd + x, 4); }
  };
  if (!k) sheet(15, 13, 37, s, 0); else { sheet(24, 11, 30, s + 1, -0.9); sheet(13, 11, 27, s, 0); }
  waxMound(P, W / 2, 0, W / 2, 3, RP.ceraV, s + 3, 2.2);
  for (let x = 0; x < W; x++) if (P.has(x, 1) || P.has(x, 3)) { P.put(x, 0, RP.ceraV, 2.6 + cg(x, 0, s)); P.put(x, 1, RP.ceraV, 3.2 + cg(x, 1, s)); }
  return P.done();
}
function giantDrop() {   // 16 x 36: a gota de mel gigante pendurada de um nó de cera no teto, o pescoço comprido e o bulbo lustroso (a gotinha que cai é desenhada ao vivo)
  const P = painter(16, 36), s = 19521;
  for (let y = 3; y < 35; y++) {
    const t = (y - 3) / 31, hw = t < 0.45 ? 1.6 + t * 2.4 : 2.7 + 3.4 * Math.sin(Math.min(1, (t - 0.45) / 0.55) * Math.PI * 0.62) * (t > 0.88 ? 1 - (t - 0.88) * 5 : 1);
    for (let x = Math.floor(8 - hw); x <= 8 + hw; x++) {
      const u = (x + 0.5 - 8) / Math.max(1, hw), sheen = u < -0.25 && u > -0.75;
      P.put(x, y, RP.mel, 3 - u * 1.2 + t * 0.3 + (sheen ? 1.6 : 0) + (sheen && t > 0.6 && t < 0.75 ? 0.8 : 0) + cg(x, y, s) * 0.2);
    }
  }
  P.blob(8, 2, 7, 3.2, RP.ceraV, s, 2.6); for (let x = 1; x < 15; x++) P.put(x, 0, RP.ceraV, 2.8);
  P.put(6, 3, RP.ceraV, 2.4); P.put(10, 4, RP.ceraV, 2.2);
  return P.done();
}

/* =============================== CÂMARAS DE ÂMBAR =============================== */
function amberDwarf(k) {   // 36 x 60: o anão preso no âmbar, em pé, de olhos abertos (k 0: as mãos espalmadas no alto; k 1: a picareta erguida e a boca aberta)
  const W = 36, H = 60, P = painter(W, H), s = 19601 + k, yb = H - 1;
  const Q = painter(30, 50); dwarf(Q, 4, 6, k ? 'picareta' : 'maos', Object.assign({}, PRESO, { grito: !!k }), s);
  const inside = (x, y) => { const dx = (x + 0.5 - 18) / 17, dy = (y + 0.5 - 31) / 30; return Math.pow(Math.abs(dx), 2.4) + Math.pow(Math.abs(dy), 2.8) + cn(x, y, 30, 30, s) * 0.35 < 1 && y <= yb; };
  amberLump(P, inside, Q, 3, 6, s, 13, 22);
  // o pé: resina escura escorrida que prende o bloco ao chão
  waxMound(P, 18, yb, 18, 5, RP.resina, s + 2, 2.2);
  return P.done();
}
function amberBeast() {   // 52 x 42: uma fera das cavernas presa no âmbar, curvada, a bocarra aberta e um olho arregalado
  const W = 52, H = 42, P = painter(W, H), s = 19621, yb = H - 1, F = under(HX.fera, 0.4), O = under(HX.osso, 0.3);
  const Q = painter(44, 30);
  // pernas de trás e da frente (as de longe mais escuras), o corpo, a corcova, a cabeça
  tube(Q, t => [30 + t * 3, 18 + t * 9], () => 3.6, F, s, 1.6); tube(Q, t => [14 + t * -2, 17 + t * 10], () => 3.8, F, s + 1, 1.6);
  Q.blob(26, 15, 13, 7.5, F, s + 2, 2.4); Q.blob(16, 11, 8, 7.5, F, s + 3, 2.6);
  for (let k = 0; k < 40; k++) { const x = 12 + hash2(k, 0, s) * 26, y = 6 + hash2(k, 1, s) * 14; if (Q.has(x, y)) Q.put(x, y, F, 1.6); }   // o pelo em tufos
  tube(Q, t => [35 + t * 4, 17 + t * 9], () => 3.8, F, s + 4, 2.2); tube(Q, t => [19 + t * 1, 16 + t * 11], () => 4, F, s + 5, 2.4);
  for (const [x, y] of [[39, 27], [20, 28], [33, 28], [12, 28]]) for (let i = -1; i < 3; i++) Q.put(x + i, y, O, 4);   // garras
  Q.blob(7, 13, 5.6, 4.4, F, s + 6, 2.6);
  for (let x = 1; x < 9; x++) { Q.put(x, 16, F, 2); Q.put(x, 19 - (x < 4 ? 1 : 0), F, 2.2); for (let y = 17; y < 19; y++) Q.put(x, y, F, 0.3); }   // a bocarra aberta
  for (const x of [2, 4, 6, 8]) { Q.put(x, 17, O, 4.4); Q.put(x - 1, 18, O, 3.6); }
  Q.put(6, 11, O, 5); Q.put(7, 11, O, 4.4); Q.put(6, 11, RP.sombra, 0); Q.put(7, 12, O, 3.6);   // o olho aberto
  Q.put(10, 7, F, 3.4); Q.put(11, 6, F, 3);
  const inside = (x, y) => { const dx = (x + 0.5 - 26) / 25, dy = (y + 0.5 - 22) / 20; return Math.pow(Math.abs(dx), 2.2) + Math.pow(Math.abs(dy), 2.6) + cn(x, y, 30, 30, s) * 0.4 < 1 && y <= yb; };
  amberLump(P, inside, Q, 4, 6, s, 18, 14);
  waxMound(P, 26, yb, 26, 4, RP.resina, s + 7, 2.2);
  return P.done();
}
function amberWall() {   // 50 x 60: uma parede de âmbar subindo do chão, e dentro a sombra de um bicho grande demais para caber: olho composto, antena, mandíbula, uma pata
  const W = 50, H = 60, P = painter(W, H), s = 19641, yb = H - 1, D = RP.sombraA;
  const Q = painter(W, H);
  tube(Q, t => [48 - t * 40, 34 + t * 26 - Math.sin(t * Math.PI) * 6], t => 7 - t * 2, D, s, 2);   // uma pata atravessando
  Q.blob(18, 41, 3, 3, D, s, 3);   // a junta
  for (let k = 0; k < 6; k++) { const x = 30 - k * 3.4, y = 48 + k * 1.6; Q.put(x, y, D, 4.4); Q.put(x, y - 1, D, 4.4); }   // espinhos da pata
  for (let y = 4; y < 36; y++) for (let x = 20; x < 50; x++) {   // o olho composto
    const d = Math.hypot((x + 0.5 - 38) / 12, (y + 0.5 - 18) / 13); if (d > 1) continue;
    const H2 = hexAt(x + 0.5, y + 0.5, 1.8); Q.put(x, y, D, (H2.e > 0.62 ? 0.6 : 2.6 - (H2.dx + H2.dy) * 0.3) - d * 0.9 + (Math.abs(d - 0.7) < 0.12 && x < 36 && y < 16 ? 1.6 : 0));
  }
  tube(Q, t => [30 - t * 26, 10 - Math.sin(t * Math.PI) * 9 - t * 2], () => 2, D, s + 1, 2.6);   // a antena saindo pela beira
  for (let t = 0; t < 1; t += 0.03) { const x = 32 - t * 20, y = 36 + Math.sin(t * Math.PI) * 6, w = 4 - t * 3; for (let j = 0; j < w; j++) Q.put(x, y + j, D, 3 - j * 0.6 + ((x | 0) % 3 === 0 && j === 0 ? -1.2 : 0)); }   // a mandíbula serrilhada
  const inside = (x, y) => { const top = 5 + cn(x, 0, 14, 4, s) * 8 + Math.abs(x - 24) * 0.1; return x >= 1 + cn(0, y, 4, 40, s) * 3 && x <= 48 - cn(0, y, 4, 40, s + 1) * 3 && y >= top && y <= yb; };
  amberLump(P, inside, Q, 0, 0, s, 20, 26);
  waxMound(P, 25, yb, 26, 4, RP.resina, s + 2, 2.2);
  return P.done();
}
function resinStalactite(k) {   // 22 x 50 ou 18 x 36: a estalactite de resina, anéis de escorrimento, um risco de brilho, a gota âmbar na ponta
  const W = k ? 18 : 22, H = k ? 36 : 50, P = painter(W, H), s = 19661 + k, cx = W / 2 - 0.5;
  for (let y = 0; y < H - 2; y++) {
    const t = y / (H - 2), hw = (W / 2 - 0.5) * Math.pow(1 - t, 0.85) * (1 + Math.sin(y * 0.55 + s) * 0.08) + 0.5;
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const u = (x + 0.5 - cx) / hw; P.put(x, y, RP.resina, 3 - u * 1.3 + (u > -0.7 && u < -0.4 ? 1.4 : 0) - t * 0.4 + ((y + Math.round(u * 2)) % 7 === 0 ? -0.7 : 0) + cg(x, y, s) * 0.3); }
  }
  P.put(Math.round(cx), H - 2, RP.ambar, 4.6); P.put(Math.round(cx), H - 1, RP.ambar, 3.6);
  for (let x = 0; x < W; x++) if (P.has(x, 1)) P.put(x, 0, RP.resina, 2 + cg(x, 0, s));
  return P.done();
}
function resinBubble() {   // 28 x 24: o bolhão de resina, uma cúpula translúcida com um miolo aceso, duas bolhas menores ao lado
  const P = painter(28, 24), s = 19681, yb = 23;
  const bub = (cx, cy, rx, ry, sd) => { for (let y = Math.floor(cy - ry); y <= yb; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
    const core = Math.hypot(dx + 0.15, dy + 0.1), rimL = d > 0.7 && dx < 0 && dy < 0;
    P.put(x, y, core < 0.45 ? RP.ambar : RP.resina, core < 0.45 ? 4.8 - core * 3 : 2 + (1 - d) * 2.2 + (rimL ? 1.8 : 0) - dx * 0.4 + cg(x, y, sd) * 0.25);
  } };
  bub(14, 15, 10, 10, s); bub(4, 21, 3.2, 3, s + 1); bub(24, 21.5, 2.6, 2.6, s + 2);
  for (let x = 0; x < 28; x++) P.put(x, yb, RP.resina, 2.2 + cg(x, 0, s));
  P.put(11, 8, RP.ambar, 5.6); P.put(10, 9, RP.ambar, 5);
  return P.done();
}
function waspNest() {   // 32 x 40: o ninho de vespas de papel pendurado por um talo, faixas de papel em escamas, a entrada embaixo, um rasgo mostrando os favos de dentro
  const P = painter(32, 40), s = 19701, cx = 16;
  for (let y = 0; y < 6; y++) { P.put(15, y, RP.papel, 3.4); P.put(16, y, RP.papel, 2.4); }
  for (let y = 4; y < 39; y++) {
    const t = (y - 4) / 35, hw = 13.4 * Math.sqrt(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 1.02)))) * (1 - Math.max(0, t - 0.75) * 0.6);
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const u = (x + 0.5 - cx) / Math.max(1, hw), band = ((y + Math.round(Math.sin(x * 0.8) * 1.5)) % 4 + 4) % 4; P.put(x, y, RP.papel, 3.3 - u * 1.2 - t * 0.3 + (band === 0 ? -1.1 : band === 1 ? 0.5 : 0) + cn(x, y, 20, 20, s) * 0.6 + cg(x, y, s) * 0.3); }
  }
  for (let y = 33; y < 38; y++) for (let x = 13; x < 20; x++) if (Math.hypot((x + 0.5 - 16) / 2.6, (y + 0.5 - 36) / 1.8) < 1) P.put(x, y, RP.sombra, 1);
  comb(P, 18, 14, 9, 10, 1.9, RP.papel, s + 2, (q, r) => (hash2(q, r, s) < 0.3 ? 'larva' : 'vazio'), (x, y) => Math.hypot((x + 0.5 - 22) / 4.2, (y + 0.5 - 19) / 4.8) < 1 + cn(x, y, 30, 30, s) * 0.4);
  return P.done();
}

/* =============================== O BERÇÁRIO =============================== */
function bigEgg(k) {   // 22 x 32: o ovo grande em pé, pele translúcida cor de cera real, a sombra enrolada do que está dentro, colado numa base de cera (k 1: veias mais escuras, mais perto de eclodir)
  const P = painter(22, 32), s = 19801 + k, yb = 31;
  egg(P, 11, yb - 1, 9.6, 15, RP.real, s, (x, y, u, t) => {
    const d = Math.hypot((x + 0.5 - 12) / 4.6, (y + 0.5 - 17) / 6.4), curl = d < 1 && !(x > 12 && y < 15 && y > 12);
    return curl ? 1.2 + (1 - d) * 0.6 : 0;
  });
  // veias: fios finos e tortos subindo da base
  for (let n = 0; n < 4 + k * 2; n++) { let x = 4 + hash2(n, 0, s) * 14, y = yb - 2; for (let j = 0; j < 10 + hash2(n, 1, s) * 12; j++) { if (P.is(x, y, RP.real)) P.put(x, y, RP.real, P.val[(y | 0) * 22 + (x | 0)] - 0.9 - k * 0.3); y--; x += Math.sin(j * 0.7 + n * 2) * 0.6 + (x < 11 ? -0.15 : 0.15); } }
  waxMound(P, 11, yb, 11, 3, RP.ceraN, s + 2, 2.4);
  const cv = P.done();
  // a cor do pulso: a mesma silhueta num tom mais quente, para o gancho desenhar por cima com alfa
  const F = painter(22, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 22; x++) if (P.is(x, y, RP.real)) F.put(x, y, RP.geleia, 3.4 - (P.val[y * 22 + x] < 2.4 ? 0.8 : 0)); cmOvoCv[k] = cv; cmOvoFl[k] = F.done(false);
  return cv;
}
function eggCluster(k) {   // 38 x 24: um cacho de ovos colados, deitados e em pé, ligados por cera
  const W = 38, H = 24, P = painter(W, H), s = 19821 + k, yb = H - 1;
  const one = (x, y, ang, rx, ry, sd) => { const Q = painter(Math.ceil(rx * 2 + 2), Math.ceil(ry * 2 + 2)); egg(Q, Q.w / 2, Q.h - 1, rx, ry, RP.real, sd, (xx, yy, u, t) => (Math.hypot(u, t - 0.45) < 0.4 ? 0.7 : 0)); blit(P, Q, x - Q.w / 2, y - Q.h, ang, Q.w / 2, Q.h); };
  const spots = k ? [[8, 23, -0.5, 4, 6], [16, 22, 0.1, 4.6, 7.4], [27, 23, 0.6, 4, 6], [21, 15, 0.25, 3.4, 5]] : [[6, 23, -0.9, 3.6, 5.6], [14, 23, -0.15, 4.4, 7], [23, 23, 0.2, 4.6, 7.2], [31, 23, 0.8, 3.8, 6], [18, 13, -0.3, 3.4, 5.2], [28, 14, 0.5, 3, 4.6]];
  spots.forEach(([x, y, a, rx, ry], i) => one(x, y, a, rx, ry, s + i));
  waxMound(P, 19, yb, 18, 3, RP.ceraN, s + 9, 2.3);
  for (let k2 = 0; k2 < 3; k2++) { const x = 9 + hash2(k2, 0, s) * 20; P.line(x, yb - 2, x + 1, yb - 6, RP.ceraN, 2.6, 1); }
  return P.done();
}
function pupaCocoon(k) {   // 20 x 42: o casulo de pupa em pé, colado no chão, faixas de seda em diagonal e a forma escura dentro (k 1: rachado em cima, uma perna dobrada aparecendo)
  const P = painter(20, 42), s = 19841 + k, yb = 41;
  spindle(P, 10, 1, 39, 15, RP.seda, s, (x, y, u, t) => { const d = Math.hypot((x + 0.5 - 11) / 4.2, (y + 0.5 - 20) / 13); return d < 1 ? 0.9 * (1 - d * 0.5) : 0; });
  if (k) { for (let y = 2; y < 13; y++) { P.put(9 + (y % 2), y, RP.sombra, 2); P.put(10 + (y % 2), y, RP.real, 1.6); } P.line(8, 7, 5, 4, RP.real, 2.6, 1); P.line(5, 4, 4, 7, RP.real, 2, 1); }
  waxMound(P, 10, yb, 9, 3.4, RP.ceraN, s + 2, 2.4);
  return P.done();
}
function larvaSkins() {   // 34 x 14: a pilha de cascas de larva, mudas vazias e enrugadas, translúcidas
  const P = painter(34, 14), s = 19861, yb = 13;
  const shell = (x0, y0, len, wd, ang, sd) => {
    const Q = painter(len + 2, wd + 2);
    for (let x = 0; x < len; x++) { const t = x / len, hw = wd / 2 * (0.6 + 0.4 * Math.sin(Math.PI * t)) * (1 - (x === len - 1 ? 0.3 : 0)); for (let y = Math.floor(wd / 2 - hw); y < wd / 2 + hw; y++) { const u = (y + 0.5 - wd / 2) / hw; Q.put(x + 1, y + 1, RP.real, (x % 3 === 0 ? 2.4 : 3.8) - u * 1.1 + (t < 0.12 ? -1.8 : 0) + cg(x, y, sd) * 0.6); } }
    blit(P, Q, x0, y0, ang, 0, Q.h / 2);
  };
  shell(1, 8, 16, 7, 0.12, s); shell(14, 9, 18, 7, -0.08, s + 1); shell(8, 3, 15, 6, -0.25, s + 2); shell(20, 3, 12, 6, 0.3, s + 3);
  for (let x = 0; x < 34; x++) if (hash2(x, 2, s) < 0.4) P.put(x, yb, RP.real, 2 + hash2(x, 3, s));
  return P.done();
}
function deadLarva() {   // 50 x 22: a larva gigante morta, deitada de lado e encolhida em C, anéis frouxos, a cabeça marrom com os ganchos da boca
  const P = painter(50, 22), s = 19881, yb = 21;
  const path = t => [44 - t * 36, 15 - Math.sin(t * Math.PI * 0.85) * 6 + t * 2], wd = t => 8 + Math.sin(Math.min(1, t * 1.2) * Math.PI) * 5;
  for (let i = 0; i <= 12; i++) { const t = i / 12, [x, y] = path(t), r = wd(t) / 2; P.blob(x, Math.min(y, yb - r + 0.5), r * 0.75, r, RP.morta, s + i, 2.6 - (i % 2) * 0.25); }
  for (let i = 1; i < 12; i++) { const [x, y] = path(i / 12 + 0.04); if (P.has(x, y + 1)) P.put(x, y + 1, RP.real, 3.6); }   // os espiráculos
  const [hx, hy] = path(1.04); P.blob(hx, hy + 1, 3.6, 3.2, RP.resina, s + 20, 2.4); P.put(hx - 3, hy + 3, RP.resina, 0.6); P.line(hx - 3, hy + 2, hx - 5, hy + 4, RP.resina, 3, 1); P.line(hx - 2, hy + 4, hx - 4, hy + 6, RP.resina, 2.4, 1);
  for (let x = 4; x < 48; x++) if (hash2(x, 4, s) < 0.35) P.put(x, yb, RP.ceraN, 2 + hash2(x, 5, s));
  return P.done();
}
function royalJelly() {   // 36 x 14: um berço de cera real rachado, a geleia real brilhando acima da borda e escorrendo pelos lados até o chão
  const P = painter(36, 14), s = 19901, yb = 13;
  for (let y = 5; y <= yb; y++) { const t = (y - 5) / 8, hw = 13.5 * Math.sqrt(1 - t * t * 0.7); for (let x = Math.floor(18 - hw); x <= 18 + hw; x++) { const u = (x + 0.5 - 18) / hw; P.put(x, y, RP.real, 3.3 - u * 1.2 - t * 0.5 + (y === 5 ? 1 : 0) + cg(x, y, s) * 0.35); } }
  P.line(24, 5, 22, 12, RP.real, 1.2, 1);   // a rachadura
  for (let x = 6; x < 31; x++) { const h = Math.round(2.2 - Math.pow((x - 18) / 12, 2) * 2 + Math.sin(x * 0.8) * 0.4); for (let y = 4 - h; y < 5; y++) P.put(x, y, RP.geleia, 4.2 - (x - 6) * 0.04 - (y - 4 + h) * 0.2 + (x > 9 && x < 14 && y === 4 - h ? 1.2 : 0)); }
  for (const [x, l] of [[6, 4], [11, 2], [27, 3], [30, 5]]) drip(P, x, 5, l, RP.geleia, s + x, 3.8);
  for (let x = 5; x < 32; x++) if (P.is(x, 5, RP.real)) P.put(x, 5, RP.real, 4.4);
  for (let x = 1; x < 35; x++) if (!P.has(x, yb) && (x < 9 || x > 27)) P.put(x, yb, RP.geleia, 3.4 - Math.abs(x - 18) * 0.04);
  return P.done();
}
function cocoonCluster(k) {   // 32 x 38: um cacho de casulos pendurado de uma crosta de cera no teto, cada um no seu fio (k 1: mais curtos e mais juntos)
  const P = painter(32, 38), s = 19921 + k;
  const L = k ? [[6, 3, 14, 6], [12, 2, 18, 7], [19, 4, 15, 6], [25, 2, 20, 7]] : [[5, 6, 20, 6], [12, 2, 26, 8], [20, 8, 18, 6], [27, 4, 24, 7]];
  for (const [x, top, len, wd] of L) { for (let y = 1; y < top + 1; y++) P.put(x, y, RP.seda, 3 - y * 0.05); spindle(P, x + 0.5, top + 1, len, wd, RP.seda, s + x, (xx, yy, u, t) => (u > 0.3 ? 0.6 : 0) + (Math.hypot(u, (t - 0.5) * 2) < 0.5 ? 0.5 : 0)); }
  waxMound(P, 16, 0, 16, 3, RP.ceraV, s + 2, 2.2);
  for (let x = 2; x < 30; x++) if (P.has(x, 2)) P.put(x, 0, RP.ceraV, 2.6 + cg(x, 0, s));
  return P.done();
}

/* =============================== registro =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes, colmeia: true }, extra || {}));
const AZUL = '#5a8cff', AMBAR = '#ffa838', AMBAR_F = '#e08a28', ROSA = '#ff9ab4', MURAL = '#ffb848';
// Brecha Tomada
def('cm_estatua_ana', 'Estátua anã com cera escorrendo', W, 'fundo', ['brecha'], [dwarfStatue(0), dwarfStatue(1)], { brecha: true });
def('cm_bigorna_ana', 'Bigorna anã coberta de cera', F, 'frente', ['brecha'], [dwarfAnvil()], { brecha: true });
def('cm_barril_hidromel', 'Barril de hidromel rachado', F, 'frente', ['brecha'], [meadBarrel(0), meadBarrel(1)]);
def('cm_carrinho_ana', 'Carrinho de minério tomado', F, 'frente', ['brecha'], [oreCart()], { brecha: true });
def('cm_porta_ana', 'Porta anã selada com cera', W, 'fundo', ['brecha'], [dwarfDoor()], { brecha: true });
def('cm_estandarte_ana', 'Estandarte anão engolido', W, 'fundo', ['brecha'], [dwarfBanner()], { brecha: true });
def('cm_runa_ana', 'Runa anã debaixo da cera', W, 'fundo', ['brecha'], [dwarfRune(0), dwarfRune(1)], { brecha: true, luz: [{ x: 13, y: 13, r: 0.25 }], brilho: AZUL });
def('cm_lustre_ana', 'Lustre anão tomado por casulos', C, 'frente', ['brecha'], [chandelier()], { brecha: true });
// Galerias de Cera
def('cm_favo_caido', 'Favo grande caído', F, 'frente', ['galerias'], [fallenComb(0), fallenComb(1)], { naoMel: true });
def('cm_pote_mel', 'Pote de mel rachado', F, 'frente', ['galerias'], [honeyPot(0), honeyPot(1)], { naoMel: true });
def('cm_cera_mastigada', 'Monte de cera mastigada', F, 'frente', ['galerias'], [chewedWax()]);
def('cm_carcaca_operaria', 'Carcaça de operária', F, 'frente', ['galerias'], [workerCarcass()]);
{ const A = larvaMural(0), B = larvaMural(1); def('cm_mural_favos', 'Mural de favos com larvas acesas', W, 'fundo', ['galerias'], [A[0], B[0]], { luz: [{ x: 22, y: 17, r: 0.35 }], brilho: MURAL, larvas: [A[1], B[1]], anim: { k: 'cm_larvas' } }); }
def('cm_favo_pendente', 'Favo pendente', C, 'frente', ['galerias'], [hangingComb(0), hangingComb(1)]);
def('cm_gota_gigante', 'Gota de mel gigante', C, 'frente', ['galerias'], [giantDrop()], { luz: [], anim: { k: 'cm_gota', x: 8, y: 35 } });
// Câmaras de Âmbar
def('cm_anao_ambar', 'Anão preso no âmbar', W, 'fundo', ['camaras'], [amberDwarf(0), amberDwarf(1)], { camara: true, luz: [{ x: 18, y: 26, r: 0.4 }], brilho: AMBAR });
def('cm_fera_ambar', 'Fera presa no âmbar', W, 'fundo', ['camaras'], [amberBeast()], { camara: true });
def('cm_parede_ambar', 'Parede de âmbar com silhueta', W, 'fundo', ['camaras'], [amberWall()], { camara: true, luz: [{ x: 22, y: 28, r: 0.22 }], brilho: AMBAR_F });
def('cm_estalactite_resina', 'Estalactite de resina grande', C, 'frente', ['camaras'], [resinStalactite(0), resinStalactite(1)]);
def('cm_bolhao_resina', 'Bolhão de resina', F, 'frente', ['camaras'], [resinBubble()], { naoMel: true, luz: [{ x: 13, y: 14, r: 0.4 }], brilho: AMBAR });
def('cm_ninho_vespas', 'Ninho de vespas de papel', C, 'frente', ['camaras'], [waspNest()]);
// O Berçário
def('cm_ovo_grande', 'Ovo grande pulsando', F, 'frente', ['bercario'], [bigEgg(0), bigEgg(1)], { ninho: true, luz: [], anim: { k: 'cm_ovo' } });
def('cm_cacho_ovos', 'Cacho de ovos', F, 'frente', ['bercario'], [eggCluster(0), eggCluster(1)], { ninho: true });
def('cm_casulo_pupa', 'Casulo de pupa', F, 'frente', ['bercario'], [pupaCocoon(0), pupaCocoon(1)]);
def('cm_cascas_larva', 'Pilha de cascas de larva', F, 'frente', ['bercario'], [larvaSkins()]);
def('cm_larva_morta', 'Larva gigante morta', F, 'frente', ['bercario'], [deadLarva()]);
def('cm_geleia_real', 'Poça de geleia real', F, 'frente', ['bercario'], [royalJelly()], { naoMel: true, luz: [{ x: 18, y: 3, r: 0.35 }], brilho: ROSA });
def('cm_cacho_casulos', 'Cacho de casulos', C, 'frente', ['bercario'], [cocoonCluster(0), cocoonCluster(1)]);

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(CM_PROP_PLAN, {
  brecha: { chao: [['cm_bigorna_ana', 0.08, 1], ['cm_barril_hidromel', 0.12, 1], ['cm_carrinho_ana', 0.07, 1]], teto: [['cm_lustre_ana', 0.1, 1]], fundo: [['cm_estatua_ana', 0.06, 1], ['cm_porta_ana', 0.05, 1], ['cm_estandarte_ana', 0.1, 1], ['cm_runa_ana', 0.12, 2]] },
  galerias: { chao: [['cm_favo_caido', 0.12, 1], ['cm_pote_mel', 0.12, 1], ['cm_cera_mastigada', 0.14, 1], ['cm_carcaca_operaria', 0.08, 1]], teto: [['cm_favo_pendente', 0.15, 1], ['cm_gota_gigante', 0.15, 2]], fundo: [['cm_mural_favos', 0.08, 1]] },
  camaras: { chao: [['cm_bolhao_resina', 0.12, 1]], teto: [['cm_estalactite_resina', 0.25, 2], ['cm_ninho_vespas', 0.1, 1]], fundo: [['cm_anao_ambar', 0.08, 1], ['cm_fera_ambar', 0.06, 1], ['cm_parede_ambar', 0.06, 1]] },
  bercario: { chao: [['cm_ovo_grande', 0.12, 1], ['cm_cacho_ovos', 0.15, 1], ['cm_casulo_pupa', 0.1, 1], ['cm_cascas_larva', 0.12, 1], ['cm_larva_morta', 0.06, 1], ['cm_geleia_real', 0.08, 1]], teto: [['cm_cacho_casulos', 0.2, 2]], fundo: [] }
});
}

/* ---------- os animados: a gota que cai, o ovo que pulsa, as larvas do mural que piscam ----------
   visProps só guarda objetos com luz; a gota e o ovo têm `luz: []` para entrar sem acender nada. O drawWorld vem
   antes da luz (a gota e o ovo escurecem com o lugar); as larvas são luz, então vão no drawTop por cima do escuro. */
const cmOvoBeat = t => Math.pow(Math.max(0, Math.sin(t * 1.9)), 3);
HOOK.drawWorld.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || !p.def.colmeia) continue;
    if (A.k === 'cm_ovo') {
      const b = cmOvoBeat(gameTime + p.X * 0.013), cv = cmOvoCv[p.v] || cmOvoCv[0], fl = cmOvoFl[p.v] || cmOvoFl[0]; if (b < 0.05 || !cv) continue;
      const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
      lc.globalAlpha = 0.3 * b; lc.drawImage(cv, 0, 0, cv.width, cv.height - 3, X - 1, Y - 1, cv.width + 2, cv.height - 2);   // incha um pixel
      lc.globalAlpha = 0.28 * b; lc.drawImage(fl, X, Y);
      lc.globalAlpha = 1;
    } else if (A.k === 'cm_gota') {
      const per = 3.6 + hash2(p.X, p.Y, 7) * 2.4, ph = ((gameTime + p.X * 0.37) / per) % 1, X = Math.round(p.X + p.sh + A.x - cx), Y0 = p.Y + A.y;
      if (p.cmFall === undefined) { const tx = Math.floor((p.X + A.x) / T); let ty = Math.floor(Y0 / T), n = 0; while (n < 40 && !solidAt(tx, ty)) { ty++; n++; } p.cmFall = Math.max(4, ty * T - Y0); }
      if (ph < 0.72) {   // a gota se forma na ponta: escorre, incha
        const g = ph / 0.72, L = Math.round(g * 3), Y = Math.round(Y0 - cy) - 1;
        lc.fillStyle = '#a0600e'; lc.fillRect(X, Y, 2, L + 1);
        if (g > 0.4) { lc.fillStyle = '#d08a1a'; lc.fillRect(X - (g > 0.75 ? 1 : 0), Y + L, g > 0.75 ? 3 : 2, 2); lc.fillStyle = '#ffd870'; lc.fillRect(X, Y + L, 1, 1); }
      } else {   // solta e cai até o chão; ao bater, espirra
        const tf = (ph - 0.72) * per, dy = 0.5 * 420 * tf * tf, Y = Math.round(Y0 - cy);
        if (dy < p.cmFall) { lc.fillStyle = '#d08a1a'; lc.fillRect(X, Y + Math.round(dy), 2, 3); lc.fillStyle = '#ffd870'; lc.fillRect(X, Y + Math.round(dy), 1, 1); }
        else if (dy < p.cmFall + 60) { const f = Math.min(1, (dy - p.cmFall) / 60), yy = Y + Math.round(p.cmFall) - 1; lc.fillStyle = '#a0600e'; lc.fillRect(X - 1 - Math.round(f * 2), yy, 4 + Math.round(f * 4), 1); if (f < 0.5) { lc.fillStyle = '#d08a1a'; lc.fillRect(X - 2 - Math.round(f * 4), yy - 2, 1, 1); lc.fillRect(X + 3 + Math.round(f * 4), yy - 2, 1, 1); } }
      }
    }
  }
});
let cmMuralGlow = null;
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || A.k !== 'cm_larvas') continue;
    if (!cmMuralGlow) cmMuralGlow = glow(10, '#ffb040');
    const L = p.def.larvas[p.v] || p.def.larvas[0];
    for (let j = 0; j < L.length; j++) { const b = 0.5 + 0.5 * Math.sin(gameTime * 0.9 + j * 1.7 + p.X * 0.01); lc.globalAlpha = 0.04 + 0.07 * b; lc.drawImage(cmMuralGlow, Math.round(p.X + p.sh + L[j].x - cx - 10), Math.round(p.Y + L[j].y - cy - 10)); }
  }
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || A.k !== 'cm_larvas') continue;
    const L = p.def.larvas[p.v] || p.def.larvas[0];
    for (let j = 0; j < L.length; j++) {
      const b = 0.5 + 0.5 * Math.sin(gameTime * 0.9 + j * 1.7 + p.X * 0.01), X = Math.round(p.X + p.sh + L[j].x - cx), Y = Math.round(p.Y + L[j].y - cy);
      lc.globalAlpha = 0.25 + 0.5 * b; lc.fillStyle = '#f4b03a'; lc.fillRect(X - 1, Y - 1, 2, 1); lc.fillRect(X - 2, Y, 1, 1);
      lc.globalAlpha = 0.15 + 0.6 * b; lc.fillStyle = '#ffe8a0'; lc.fillRect(X - 1, Y, 1, 1);
    }
  }
  lc.globalAlpha = 1;
});
