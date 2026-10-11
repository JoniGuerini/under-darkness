'use strict';

/* ================= o Reino Élfico: objetos de cena =================
   Tudo o que é maior que um bloco e veste O Reino Élfico (docs/camadas/11-reino-elfico.md, seção 5): 29 objetos.
   Na Mata de Prata, o que os guardiões deixaram entre as árvores: a escultura de cervo branco (de cabeça erguida ou
   pastando), a pedra de vigia com o olho élfico aceso (que segue o herói), a harpa abandonada (de pé ou caída, as cordas
   partidas), o arco e a aljava num gancho, a lanterna de pé alta (uma ou duas gotas acesas), o banco de raiz, a casa
   de flet pendurada do teto (o quartinho de tábua com o telhado de folhas, a janela acesa, a escada de corda) e a
   guirlanda de flores-da-lua. Nos Salões do Rei: a estátua do rei élfico com a espada apontada para baixo (a dos
   Argonath: numa, a mão erguida), a armadura élfica no cabide, a estante de pergaminhos, a fonte de prata (a água corre
   ao vivo), a tapeçaria da lua, o lustre de galhos com velas azuis, o vitral de folha e a mesa longa com cálices. Na
   Corte Desterrada, a mesma corte apodrecida: a estátua do rei quebrada com a cabeça coroada no chão, o altar de mana
   sangrenta com o cristal girando no ar, a gaiola de magíster pendurada, a tapeçaria rasgada carmesim e ouro, a árvore
   morta pequena, a mesa de alquimia derrubada e o braseiro vil de fogo carmesim. No Poço da Lua: o poço da lua de
   pedra (a água acesa tremendo), a estátua da Dama coberta de musgo, o arco de raízes, o cristal lunar grande, a
   lanterna flutuante (uma gota de vidro acesa que sobe e desce debaixo de um nó de raiz) e a raiz-mãe grossa
   atravessando a parede.
   O pintor do 182 (rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, juntas por P.z, grão)
   com a tinta do 242: o LUAR. Um pixel de luar (P.N) é cor pura, não rampa; no fim cada variação assa duas imagens a
   mais: os pixels de luar sozinhos (somados por cima do escuro: chama de vela, água do poço, olho da pedra, runas, seiva
   azul, cristal, a janela do flet) e o halo (um borrão macio somado em volta, calculado uma vez). O drawGlow desenha os
   dois com 'lighter'; nada é relido por quadro.
   Animados (ganchos no fim; todo objeto élfico tem `luz`, nem que vazia, para entrar em visProps), pelos pontos
   marcados no desenho (elPts):
     'vela'   a chama de vela ou de lanterna treme (azul no Reino) e o brilho dela respira (drawGlow + drawTop);
     'brilho' cintila de vez em quando (flores, cristais, o espelhinho da Dama) (drawTop);
     'olho'   o olho élfico da pedra de vigia: a íris acesa escorrega para o lado do herói (drawGlow + drawTop);
     'jato'   um fio d'água caindo da fonte, com o respingo (drawTop); 'agua' o espelho d'água tremendo (drawTop);
     'mote'   pontinhos de luar subindo da água do poço (drawTop);
     'fogo'   as línguas do fogo carmesim do braseiro vil e as brasas subindo (drawGlow + drawTop);
     'cristal' o cristal de mana sangrenta do altar, girando e flutuando (drawGlow + drawTop);
     'flut'   a gota de vidro da lanterna flutuante, subindo e descendo (drawWorld: escurece com o lugar; a chama no
              drawTop e o halo no drawGlow vão junto).
   Registrados com defProp (`elfos: true`), postos pelo 255 a partir do EL_PROP_PLAN (o elPlaceProps é o nvPlaceProps
   do 245). Peças de fundo em EL_BACK_FLOOR ficam em pé no chão; as outras de fundo, na altura dos olhos.
   Flags que o gerador deve respeitar (poucas: quase tudo serve em qualquer lugar da sua faixa):
     clareira: true  só dentro das clareiras da Mata (elGlades): a casa de flet pendurada (precisa do teto alto da copa);
     salao: true     só dentro dos salões lavrados dos Salões (elHalls sem ruin): a estátua do rei;
     ruina: true     só dentro dos salões em ruína da Corte (elHalls com ruin): a estátua do rei quebrada;
     gruta: true     só dentro das grutas da lua do Poço (elGrottos): a estátua da Dama;
     alto: n         precisa de n blocos de ar livres (as estátuas, o arco de raízes, a casa de flet, a lanterna alta). */
const EL_PROP_PLAN = {};
const EL_HR = 9;   // a margem do halo assado em volta de cada objeto com luar
// peças de fundo que ficam em pé no chão em vez de penduradas na altura dos olhos
const EL_BACK_FLOOR = { el_rei_estatua: 1, el_dama_estatua: 1, el_arco_raizes: 1 };
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  // o Reino: prata, mármore-lua, madeira prateada, tábua clara, folha azul-verde, tecido azul, ouro claro
  prata: ['#222836', '#3e485c', '#626e86', '#8e9ab2', '#bcc6d8', '#e8eef8'],
  marmore: ['#2c3344', '#4a5468', '#6e7a92', '#95a1b8', '#bec8da', '#e6edf8'],
  pedra: ['#1c222c', '#2e3642', '#444e5c', '#5e6a78', '#7c8896', '#a0aab6'],
  madeira: ['#2a2824', '#48443e', '#6c665c', '#948c80', '#bab2a4', '#dcd6ca'],
  tabua: ['#30261c', '#4e3e2e', '#705a44', '#94785c', '#b49a7a', '#d4be9e'],
  folha: ['#0c2026', '#14363e', '#1e505a', '#2e7076', '#4a9696', '#7cc0bc'],
  musgo: ['#0e1c12', '#16301c', '#20462a', '#2e5e38', '#42784a', '#5e9660'],
  tecido: ['#0a1030', '#121c4c', '#1c2c6e', '#2a4294', '#3e60b8', '#6488d8'],
  ouro: ['#3a2c10', '#5e4a1c', '#8a6e2c', '#b89640', '#dcbe5e', '#f8e49c'],
  couro: ['#1c120c', '#30201a', '#4a3226', '#644632', '#7e5c42', '#9a7656'],
  papel: ['#3a3226', '#5a4e3c', '#7e7056', '#a29274', '#c4b694', '#e2d8bc'],
  cera: ['#4a5060', '#727a8c', '#9aa2b4', '#c0c8d6', '#dee4ee', '#f8faff'],
  petala: ['#3a4a66', '#5e7090', '#8498b8', '#acc0dc', '#d4e2f4', '#f6faff'],
  vidro: ['#081428', '#10243e', '#1a3858', '#2a5278', '#44749c', '#78a8cc'],
  agua: ['#061a30', '#0c2c4c', '#164470', '#245e94', '#3a82b8', '#6cb0dc'],
  cristal: ['#1c2c4c', '#2e4874', '#486a9e', '#6e92c8', '#a0c2e8', '#e2f0ff'],
  raiz: ['#16181e', '#262a32', '#3a404a', '#525a66', '#6e7884', '#929ca8'],
  poco: ['#0a1418', '#12242a', '#1c363e', '#284a54', '#38626c', '#4e7e88'],
  corda: ['#2a2620', '#45403a', '#625c52', '#80786c', '#9e9688', '#bcb4a6'],
  // a Corte: mármore profanado, vinho, carmesim, ouro velho, madeira morta, cristal de mana sangrenta
  profano: ['#221a20', '#382c34', '#52444c', '#6e5e66', '#8c7a80', '#ac9a9e'],
  vinho: ['#1a060c', '#2e0c16', '#481422', '#641e30', '#842c40', '#a84458'],
  carmesim: ['#2a0608', '#4a0c12', '#721820', '#a0242e', '#cc3a42', '#f07070'],
  ouroV: ['#24180a', '#3e2a10', '#5e4218', '#845e24', '#aa8034', '#cca452'],
  morta: ['#0a0808', '#141010', '#201a1a', '#2e2626', '#3e3434', '#524646'],
  sangue: ['#2a040a', '#500a14', '#801422', '#b42032', '#e0404a', '#ff9090'],
  cobre: ['#2a1408', '#4a2410', '#6e381a', '#945028', '#b86c3a', '#d89058'],
  osso: ['#2a261e', '#463f34', '#665d4e', '#8a7f6a', '#aca088', '#c8bca2'],
  sombra: ['#030304', '#060708', '#0a0b0e', '#0e1014', '#13161a', '#1a1d22']
};
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#040508');
// as cores puras do luar e do carmesim aceso
const MO = { miolo: '#ffffff', palido: '#d8ecff', lua: '#9cc8ff', funda: '#4a7ad0', escura: '#24407a' };
const CR = { miolo: '#ffe2d4', claro: '#ff8a7a', carm: '#e0303e', fundo: '#7a1018' };
const mixHex = (a, b, k) => { const A = rgb(a), B = rgb(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0')).join(''); };

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
// casca em tubo: o cilindro sombreado pela normal (o lado de cima à esquerda aceso), sulcos ao comprido; com sap, a seiva
// acesa (luar) em alguns sulcos; opt { base, sulcos, seiva, cor }
function bark(P, fn, wd, R, s, opt = {}) {
  let L = 0; { let [px, py] = fn(0); for (let i = 1; i <= 60; i++) { const [x, y] = fn(i / 60); L += Math.hypot(x - px, y - py); px = x; py = y; } }
  const n = Math.ceil(L * 2.5) + 4, base = opt.base !== undefined ? opt.base : 2.6, G = opt.sulcos || 0, sap = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = fn(t), [x2, y2] = fn(Math.min(1, t + 0.01)), [x1, y1] = fn(Math.max(0, t - 0.01));
    let tx = x2 - x1, ty = y2 - y1; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx, r = Math.max(0.6, wd(t) / 2), lit = -(nx + ny) * 0.707;
    for (let o = -r; o <= r; o += 0.5) {
      const X = Math.floor(x + nx * o), Y = Math.floor(y + ny * o), q = o / r;
      let v = base + 0.5 + q * lit * 1.4 - q * q * 0.9 + cg(X, Y, s) * 0.28;
      if (G) {
        const g = (((q + 1) * G * 0.5 + Math.sin(t * L * 0.11 + s) * 0.3 + cn(X, Y, 14, 14, s) * 0.22) % 1 + 1) % 1;
        if (g < 0.17) { v -= 1.3; if (opt.seiva && Math.abs(q) < 0.7 && hash2(Math.floor(t * L / 3.5), Math.floor((q + 1) * G), s) < opt.seiva) sap.push(X, Y); }
        else if (g < 0.27) v += 0.5;
      }
      P.put(X, Y, R, v);
    }
  }
  const col = opt.cor || MO.funda;
  for (let i = 0; i < sap.length; i += 2) P.N(sap[i], sap[i + 1], hash2(sap[i] >> 1, sap[i + 1] >> 1, s) < 0.18 ? (opt.cor2 || MO.lua) : col);
}
// uma folha élfica: comprida e pontuda, a nervura do meio clara, o lado de cima à esquerda aceso
function leaf(P, cx, cy, ang, len, wd, R, s, base = 2.8, vein = true) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.ceil(len / 2 + wd);
  for (let y = Math.floor(cy - m); y <= cy + m; y++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = (dx * ca + dy * sa) / len + 0.5, o = -dx * sa + dy * ca;
    if (u < 0 || u > 1) continue; const hw = wd / 2 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.8); if (Math.abs(o) > hw + 0.05) continue;
    const sg = o < 0 ? -1 : 1, lit = -(-sa * sg + ca * sg) * 0.707;
    let v = base + lit * (Math.abs(o) / Math.max(0.5, hw)) * 1.3 + (0.5 - u) * 0.5 + cg(x, y, s) * 0.3;
    if (vein && Math.abs(o) < 0.45 && u > 0.1 && u < 0.85) v += 1;
    P.put(x, y, R, v);
  }
}
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
// as runas élficas: 3 x 5, curvas (laços e ganchos, nunca a cunha reta dos anões)
const EGLYPH = [
  ['.x.', 'x.x', 'x.x', '.xx', '..x'], ['xx.', '..x', '.x.', 'x..', '.xx'], ['x.x', 'x.x', '.x.', '.x.', 'x..'], ['.xx', 'x..', 'xx.', 'x..', '.xx'],
  ['x..', 'x.x', 'xxx', '..x', '..x'], ['.x.', 'x..', '.x.', '..x', '.x.'], ['xxx', 'x.x', '.x.', '.x.', 'x.x'], ['..x', '.x.', 'xx.', '.xx', 'x..']
];
const eOn = (k, i, j) => i >= 0 && j >= 0 && i < 3 && j < 5 && EGLYPH[k % EGLYPH.length][j][i] === 'x';
// runa gravada: o sulco escuro, o lábio de baixo aceso
function carve(P, x, y, k, R, base = 2.6) { for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (eOn(k, i, j)) { P.put(x + i, y + j, R, base - 1.5); if (!eOn(k, i, j + 1)) P.put(x + i, y + j + 1, R, base + 1.3); } }
// runa acesa (luar ou carmesim)
function runeN(P, x, y, k, col, core) { for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (eOn(k, i, j)) P.N(x + i, y + j, core && j === 2 ? core : col); }
// uma flor-da-lua: o talo, cinco pétalas brancas, o miolo aceso; marca o brilho
function moonFlower(P, x, y, s, stem = 2) {
  for (let j = 0; j < stem; j++) P.put(x, y - j, RP.folha, 2.6 - j * 0.2);
  const fy = y - stem; leaf(P, x + 1.6, y - 1, -0.5, 3, 1.4, RP.folha, s, 2.6, false);
  P.put(x - 1, fy, RP.petala, 4.2); P.put(x + 1, fy, RP.petala, 3.2); P.put(x, fy - 1, RP.petala, 4.6); P.put(x - 1, fy - 1, RP.petala, 3.8); P.put(x + 1, fy - 1, RP.petala, 2.8);
  P.N(x, fy, MO.lua); P.mark('brilho', x, fy - 1);
}
// a gota de uma lanterna élfica: a tampa de prata com a folhinha, o vidro azulado em gota, a chama acesa dentro, a
// pontinha embaixo. (cx, y0): o topo da tampa; marca a chama
function lanternDrop(P, cx, y0, s, big = false, mark = true) {
  const hg = big ? 12 : 10, r = big ? 4.2 : 3.4, g0 = y0 + 3;
  for (let y = g0; y < g0 + hg; y++) {
    const j = (y - g0 + 0.5) / hg, hw = j < 0.6 ? 0.8 + (r - 0.8) * Math.pow(Math.sin(j / 0.6 * Math.PI / 2), 0.9) : r * Math.sqrt(Math.max(0, 1 - Math.pow((j - 0.6) / 0.42, 2)));
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw) - 1; x++) {
      const u = (x + 0.5 - cx) / Math.max(1, hw);
      P.put(x, y, RP.vidro, 2.3 - u * 1.1 - Math.abs(u) * 0.6 + (u < -0.35 && u > -0.8 && j > 0.3 && j < 0.8 ? 2.6 : 0) + (j > 0.85 ? -0.4 : 0));
    }
  }
  // as duas costelas de prata em volta do vidro
  for (let y = g0 + 1; y < g0 + hg - 1; y++) { const j = (y - g0) / hg; if (j > 0.35 && j < 0.85) { P.put(Math.floor(cx - r * 0.95), y, RP.prata, 3.6); P.put(Math.ceil(cx + r * 0.95) - 1, y, RP.prata, 2.2); } }
  // a tampa e a folhinha em cima, a pontinha embaixo
  P.rect(Math.floor(cx) - 2, y0 + 1, 4, 2, RP.prata, (i, j) => 4.2 - i * 0.5 - j * 0.8); P.put(Math.floor(cx) - 1, y0, RP.prata, 4.6); P.put(Math.floor(cx), y0, RP.prata, 3.4);
  P.put(Math.floor(cx) - 1, g0 + hg, RP.prata, 3.8); P.put(Math.floor(cx), g0 + hg, RP.prata, 2.8); P.put(Math.floor(cx), g0 + hg + 1, RP.prata, 3);
  // a chama: o miolo branco, o azul em volta
  const fx = Math.floor(cx) - (big ? 0 : 0), fy = g0 + Math.round(hg * 0.62);
  P.N(fx, fy, MO.miolo); P.N(fx - 1, fy, MO.palido); P.N(fx, fy - 1, MO.palido); P.N(fx, fy - 2, MO.lua); P.N(fx - 1, fy + 1, MO.lua); P.N(fx, fy + 1, MO.lua);
  if (big) { P.N(fx + 1, fy, MO.lua); P.N(fx - 1, fy - 1, MO.lua); P.N(fx, fy + 2, MO.funda); }
  P.N(fx - 2, fy + 1, MO.funda); P.N(fx + 1, fy + 1, MO.funda);
  if (mark) P.mark('vela', fx, fy - 2, { c: MO.lua, l: true });
}
// a cabeça de um rei élfico de pedra, de frente: o rosto comprido, o cabelo caindo dos lados, o elmo alto com a ponta
// em folha e as duas asas. (ox, oy) o canto de uma caixa de 17 x 24; o queixo em oy + 23. inlay: o fio de prata no elmo
function kingHead(Q, ox, oy, R, s, inlay = RP.prata, crown = false) {
  const cx = ox + 8.5;
  // o cabelo atrás, liso, caindo dos dois lados até o ombro
  for (let y = oy + 11; y < oy + 24; y++) for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) { const x = Math.floor(cx + sd * (4.5 + i + (y - oy - 11) * 0.06)); Q.put(x, y, R, (sd < 0 ? 3.3 : 2) - i * 0.4 + ((y + i) % 3 === 0 ? -0.7 : 0) - (y - oy - 11) * 0.04); }
  // o rosto
  Q.ell(cx, oy + 16.5, 4.3, 6.8, (x, y, dx, dy, d) => Q.put(x, y, R, 3.8 - dx * 1.3 - dy * 0.3 - d * 0.6 + cg(x, y, s) * 0.25));
  const fx = Math.floor(cx);
  for (let x = fx - 3; x <= fx + 2; x++) Q.put(x, oy + 13, R, x < fx ? 4.4 : 3);                  // a sobrancelha
  for (const ex of [fx - 2, fx + 1]) { Q.put(ex, oy + 14, R, 1.3); Q.put(ex + (ex < fx ? 1 : -1) * 0, oy + 15, R, 2.6); }   // os olhos fundos
  for (let y = oy + 14; y < oy + 19; y++) { Q.put(fx, y, R, 4.5); Q.put(fx + 1, y, R, 2.3); }   // o nariz comprido
  Q.put(fx - 1, oy + 19, R, 2); Q.put(fx + 1, oy + 19, R, 1.6);
  Q.put(fx - 1, oy + 21, R, 1.8); Q.put(fx, oy + 21, R, 1.6); Q.put(fx + 1, oy + 21, R, 2);        // a boca
  Q.put(fx, oy + 22, R, 4.2);                                                                      // o queixo aceso
  if (crown) {   // a coroa de pontas de ouro velho em cima do cabelo, a pedra de mana no meio
    Q.ell(cx, oy + 11, 5, 3.6, (x, y, dx, dy) => { if (dy > 0.3) return; Q.put(x, y, R, 3.4 - dx * 1.3 - dy * 0.6 + ((x + y) % 3 === 0 ? -0.6 : 0)); });
    for (let x = fx - 5; x <= fx + 5; x++) { Q.put(x, oy + 10, inlay, 4.4 - (x - fx + 5) * 0.2); Q.put(x, oy + 11, inlay, 3.2 - (x - fx + 5) * 0.15); }
    for (const [dx, h] of [[-5, 2], [-3, 4], [0, 5], [3, 4], [5, 2]]) for (let j = 1; j <= h; j++) { Q.put(fx + dx, oy + 10 - j, inlay, 4.2 - j * 0.15 - (dx > 0 ? 0.8 : 0)); if (j < h - 1 && dx) Q.put(fx + dx + 1, oy + 10 - j, inlay, 2.6); }
    Q.put(fx, oy + 10, RP.sangue, 4.6); Q.put(fx - 3, oy + 10, RP.sangue, 3.6); Q.put(fx + 3, oy + 10, RP.sangue, 3.4);
    return;
  }
  // o elmo: a calota, a faixa com o fio de prata e a pedra no meio, a ponta em folha, as asas
  Q.ell(cx, oy + 11, 5.4, 4.6, (x, y, dx, dy, d) => { if (dy > 0.25) return; Q.put(x, y, R, 3.6 - dx * 1.3 - dy * 0.9 + cg(x, y, s) * 0.25); });
  for (let x = fx - 5; x <= fx + 5; x++) { Q.put(x, oy + 12, R, 4.4 - (x - fx + 5) * 0.2); Q.put(x, oy + 11, inlay, 4.6 - (x - fx + 5) * 0.18); }
  leaf(Q, cx, oy + 4.5, -Math.PI / 2, 9, 4.2, R, s + 1, 3);
  for (const sd of [-1, 1]) for (let q = 0; q < 6; q++) { const x = Math.floor(cx + sd * (5 + q * 0.75)), y = oy + 10 - q * 1.3; Q.put(x, y, R, (sd < 0 ? 4 : 2.5) - q * 0.15); Q.put(x, y + 1, R, (sd < 0 ? 3 : 1.8)); if (q < 4) Q.put(x - sd, y + 1, R, sd < 0 ? 3.4 : 2.1); }
}

/* =============================== A MATA DE PRATA =============================== */
function stag(k) {   // 48 x 62: a escultura de cervo branco num laje de pedra com musgo (k 0 de cabeça erguida, galhada alta; k 1 pastando, a cabeça baixa)
  const W = 48, H = 62, P = painter(W, H), s = 25201 + k, R = RP.marmore, top = 52;
  // a laje de pedra natural
  for (let x = 2; x < 46; x++) { const t = (x - 2) / 43, tt = top + (t < 0.05 || t > 0.95 ? 1 : 0) + (hash2(x >> 2, 0, s) < 0.3 ? 1 : 0); for (let y = tt; y < H; y++) P.put(x, y, RP.pedra, 3 + (y === tt ? 1.3 : y === tt + 1 ? 0.4 : 0) - t * 0.9 - (y - tt) * 0.12 + cg(x, y, s) * 0.5 + cn(x, y, 7, 7, s + 1) * 0.6); }
  const legs = (x0, x1, x2, base, wdA) => { tube(P, t => [x0 + (x1 - x0) * t, 40 + t * 6], () => wdA, R, s, base); tube(P, t => [x1 + (x2 - x1) * t, 46 + t * 5], t => 1.9 - t * 0.3, R, s + 1, base - 0.2); P.put(x2 - 1, 51, R, 1.2); P.put(x2, 51, R, 1); };
  const antler = (bx, by, dir, base, sc = 1) => {   // o galho: o tronco curvo para trás e as pontas para cima
    const q = t => [bx - 8 * t * sc * dir, by - 13 * t * sc + 3.5 * t * t * sc];
    for (let i = 0; i <= 24; i++) { const [x, y] = q(i / 24); P.put(x, y, R, base + 0.8 - i * 0.02); P.put(x + 1, y, R, base - 0.4); }
    for (const [t, dx, dy] of [[0.22, 2.5, -4.5], [0.52, 1.5, -5], [0.82, -0.5, -4.5], [1, -3.5, -2]]) { const [x, y] = q(t); P.line(x, y, x + dx * dir * sc, y + dy * sc, R, base + 1.1); }
  };
  P.z = 1;
  legs(18, 16, 17, 2.1, 2.6); legs(33, 35, 35, 2.1, 2.4);   // as pernas de trás (do outro lado)
  if (!k) antler(38, 16, 1, 2.2, 0.95);
  else antler(41, 42, -0.25, 2.2, 0.7);
  P.z = 2;
  // o corpo: o tronco, a anca e o peito
  P.ell(22, 36, 11.5, 6.4, (x, y, dx, dy, d) => P.put(x, y, R, 3.9 - dx * 0.7 - dy * 1.3 - d * 0.5 + (dy > 0.55 ? -0.6 : 0) + cg(x, y, s) * 0.3));
  P.blob(13.5, 36, 4.6, 5.6, R, s + 2, 3.2); P.blob(31, 37, 4, 4.2, R, s + 3, 3);
  P.blob(10, 32.5, 1.6, 2, R, s + 4, 3.4);   // o rabinho
  P.z = 3;
  legs(13, 11, 12, 3.3, 2.8); legs(30, 31, 31, 3.3, 2.5);
  if (!k) {
    // o pescoço erguido, a cabeça de perfil para a direita, a orelha, o focinho
    tube(P, t => [30 + t * 6, 33 - t * 12], t => 6.2 - t * 2, R, s + 5, 3.1);
    P.z = 4;
    P.ell(38, 19, 4.2, 3, (x, y, dx, dy, d) => P.put(x, y, R, 4 - dx * 0.8 - dy * 1.2 - d * 0.5 + cg(x, y, s) * 0.25));
    P.ell(41.6, 20.6, 2.8, 1.9, (x, y, dx, dy, d) => P.put(x, y, R, 3.6 - dx * 0.6 - dy * 1.2 - d * 0.4));
    P.put(44, 20, R, 1.2); P.put(38, 18, R, 0.9); P.put(37, 17, R, 4.6); P.put(41, 22, R, 1.8);
    leaf(P, 33.6, 16.6, -2.55, 6, 2.6, R, s + 6, 3.2);
    antler(36, 16, 1, 3.1);
  } else {
    // pastando: o pescoço desce para a frente, o focinho encosta no musgo
    tube(P, t => [30 + t * 8, 34 + t * 9], t => 6 - t * 1.8, R, s + 5, 3.1);
    P.z = 4;
    P.ell(40, 46.5, 3.4, 4.2, (x, y, dx, dy, d) => P.put(x, y, R, 3.8 - dx * 0.9 - dy * 0.9 - d * 0.5 + cg(x, y, s) * 0.25));
    P.ell(41.5, 50, 2.2, 1.8, (x, y, dx, dy) => P.put(x, y, R, 3.2 - dx - dy * 0.6));
    P.put(41, 46, R, 0.9); P.put(40, 45, R, 4.6);
    leaf(P, 36, 43, -2.9, 5.5, 2.4, R, s + 6, 3.2);
    antler(39, 42, -0.3, 3.1, 0.75);
  }
  seams(P);
  grime(P, 0.9, 0.0, s + 7, (x, y) => (y > 40 ? 0.15 : -0.15), [R]);
  P.z = 0; moss(P, 0.18, s + 8, (x, y) => (y > top + 2 ? -0.3 : 0.3), [RP.pedra]);
  moonFlower(P, 6, top - 1, s + 9, 3); moonFlower(P, 44, top - 1, s + 10, 2);
  for (const x of [4, 9, 25, 40]) leaf(P, x, top - 1.5, -1.9 + hash2(x, 1, s) * 0.8, 4, 1.6, RP.folha, s + x, 2.6);
  chip(P, 0.15, s, [RP.pedra]);
  return P.done();
}
function watchStone(k) {   // 26 x 46: a pedra de vigia: um menir de pedra cinza-azulada com o olho élfico gravado, aceso em azul, e três runas embaixo; musgo e samambaias no pé (k 1: mais baixa, torta, rachada, com hera)
  const W = 26, H = 46, P = painter(W, H), s = 25221 + k, R = RP.pedra, y0 = k ? 12 : 3, lean = k ? 0.09 : 0;
  const cxAt = y => 13 + (H - 1 - y) * lean;
  for (let y = y0; y < H; y++) {
    const a = y - y0, hw = a < 10 ? 8.6 * Math.sqrt(Math.max(0, 1 - Math.pow((10 - a) / 10.5, 2))) + 0.6 : 8.6 + (a - 10) * 0.05, cx = cxAt(y);
    for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw; P.put(x, y, R, 3.1 - u * 1.25 - u * u * 0.5 + (a < 3 ? 0.6 : 0) + (Math.abs(u + 0.35) < 0.07 ? 0.5 : 0) + cg(x, y, s) * 0.5 + cn(x, y, 8, 8, s + 1) * 0.5); }
  }
  // o olho: a amêndoa gravada (sulco escuro, lábio de baixo aceso), os três raios em cima, a íris acesa
  const ey = y0 + 12, ex = Math.round(cxAt(ey));
  for (let x = -6; x <= 6; x++) { const yo = 2.8 * (1 - Math.pow(x / 6.4, 2)); for (const sg of [-1, 1]) { const y = Math.round(ey + sg * yo); P.put(ex + x, y, R, 1.2); P.put(ex + x, y + 1, R, sg < 0 ? 2.4 : 4.2); } }
  P.put(ex - 7, ey, R, 1.2); P.put(ex + 7, ey, R, 1.2);
  for (const [dx, l] of [[-4, 2], [0, 3], [4, 2]]) for (let j = 0; j < l; j++) { P.put(ex + dx + (dx ? Math.sign(dx) * (j >> 1) : 0), ey - 5 - j, R, 1.4); P.put(ex + dx + 1 + (dx ? Math.sign(dx) * (j >> 1) : 0), ey - 5 - j, R, 3.8); }
  P.ell(ex + 0.5, ey + 0.5, 2.2, 2.2, (x, y, dx, dy, d) => P.N(x, y, d < 0.25 ? MO.miolo : d < 0.6 ? MO.lua : MO.funda));
  P.mark('olho', ex, ey);
  // as runas gravadas, em coluna
  for (let q = 0; q < 3; q++) { const y = ey + 8 + q * 7; if (y + 6 < H - 3) carve(P, Math.round(cxAt(y)) - 1, y, q * 3 + k, R, 2.8); }
  if (k) {   // a rachadura e a hera
    let x = cxAt(y0 + 4) + 2; for (let y = y0 + 3; y < H - 6; y++) { x += (hash2(y, 3, s) - 0.45) * 1.4; P.put(x, y, R, 0.8); P.put(x + 1, y, R, 3.8); }
    for (let j = 0; j < 22; j++) { const y = H - 3 - j, x = cxAt(y) - 7 + Math.sin(j * 0.5) * 2 + j * 0.15; P.put(x, y, RP.folha, 2); if (j % 3 === 0) leaf(P, x + (j % 2 ? 2 : -2), y, j % 2 ? -0.4 : -2.7, 4, 2, RP.folha, s + j, 2.8); }
  }
  moss(P, 0.12, s + 4, (x, y) => (y > H - 9 ? 0.5 : y < y0 + 5 ? 0.3 : -0.25), [R]);
  // o pé: terra, samambaias, uma flor-da-lua
  for (let x = 1; x < W - 1; x++) P.put(x, H - 1, RP.pedra, 1.4 + hash2(x, 0, s));
  for (const [x, a] of [[3, -2.2], [5, -1.7], [21, -1.2], [23, -0.9], [19, -1.6]]) leaf(P, x, H - 4, a, 7, 2.4, RP.folha, s + x, 2.7);
  moonFlower(P, k ? 21 : 3, H - 2, s + 7, 3);
  return P.done();
}
function harp(k) {   // 30 x 40 (k 1: 46 x 26): a harpa élfica abandonada: a coluna clara com a voluta, o pescoço em curva de cisne, a caixa de ressonância com o filete de prata, as cordas (k 1: caída de costas, cordas partidas e enroladas)
  const Q = painter(30, 40), s = 25241 + k, R = RP.madeira;
  const sb = t => [9 + 15 * t, 37 - 29 * t], nk = bez([5, 7], [10, -1], [18, 11], [24, 7]);
  // as cordas, atrás de tudo
  const strings = [];
  for (let i = 0; i < 9; i++) {
    const [nx, ny] = nk(0.1 + i * 0.095), X = Math.round(nx), s2 = (X - 9) / 15; if (X < 7 || s2 > 1) continue;
    if (k) { strings.push([X, Math.round(ny) + 1, Math.round(37 - 29 * Math.max(0, s2)) - 2, i]); continue; }
    const yb = Math.round(37 - 29 * Math.max(0, s2)) - 2, broken = k && i % 3 !== 0;
    for (let y = Math.round(ny) + 1; y <= yb; y++) { if (broken && y > ny + 4 + i) { Q.put(X + Math.round(Math.sin(y) * 1.2), y, RP.prata, 4); if (y > ny + 8 + i) break; continue; } Q.put(X, y, RP.prata, i % 3 === 0 ? 4.8 : 4.2); }
  }
  Q.z = 1;
  tube(Q, t => sb(t), t => 6 - t * 2.6, R, s, 2.8);
  for (let t = 0.06; t < 0.96; t += 0.045) { const [x, y] = sb(t); Q.put(x + 0.5, y, RP.prata, 4.6); }   // o filete de prata
  for (let t = 0.15; t < 0.9; t += 0.25) { const [x, y] = sb(t); Q.put(x + 2, y + 1, R, 0.9); Q.put(x + 2, y + 2, R, 1.2); }   // os furos
  Q.z = 2;
  tube(Q, t => [8 - 3 * t - Math.sin(t * Math.PI) * 1.4, 37 - 30 * t], t => 3 - t * 0.6, R, s + 1, 3.1);
  tube(Q, nk, t => 2.6 - Math.sin(t * Math.PI) * 0.6, R, s + 2, 3.2);
  // a voluta no alto da coluna e a folha de prata
  Q.ell(3.5, 5.5, 2.4, 2.4, (x, y, dx, dy, d) => Q.put(x, y, R, d < 0.3 ? 1.6 : 3.8 - (dx + dy)));
  leaf(Q, 6, 2.5, -0.9, 5, 2, RP.prata, s + 3, 3.4);
  Q.rect(5, 37, 8, 2, R, (i, j) => 3.4 - j * 1.2 - i * 0.1);   // o pé
  seams(Q);
  if (!k) { const P = painter(30, 40); blit(P, Q, 0, 0); for (let x = 4; x < 14; x++) P.put(x, 39, RP.pedra, 1.8 + hash2(x, 1, s)); return P.done(); }
  const P = painter(46, 26), map = blit(P, Q, 3, -6, -1.32, 15, 22);
  // depois de deitada: só três cordas inteiras, retas; as outras partidas, um caracol de fio perto do pescoço
  for (const [X, ya, yb, i] of strings) { const [ax, ay] = map(X + 0.5, ya + 0.5), [bx, by] = map(X + 0.5, yb + 0.5); if (i % 3 === 0) P.line(ax, ay, bx, by, RP.prata, 4.4); else { P.put(ax, ay, RP.prata, 4.2); P.put(ax + 1, ay + 1, RP.prata, 3.6); P.put(ax + 1, ay + 2, RP.prata, 3); } }
  for (let x = 2; x < 44; x++) if (hash2(x, 2, s) < 0.5) P.put(x, 25, RP.folha, 2 + hash2(x, 3, s));
  for (const [x, a] of [[4, -2.2], [40, -1]]) leaf(P, x, 23, a, 5, 2, RP.folha, s + x, 2.8);
  return P.done();
}
function bowQuiver(k) {   // 28 x 44: o arco e a aljava num gancho de prata na parede (k 1: o arco e uma trompa de caça)
  const W = 28, H = 44, P = painter(W, H), s = 25261 + k;
  // o gancho
  P.rect(12, 0, 4, 3, RP.prata, (i, j) => 4 - i * 0.6 - j * 0.5); for (let j = 0; j < 4; j++) { P.put(13, 3 + j, RP.prata, 3.8); P.put(14, 3 + j, RP.prata, 2.4); } P.put(15, 6, RP.prata, 4); P.put(16, 5, RP.prata, 3.6);
  // a alça de couro do arco e da aljava, do gancho
  P.line(13, 6, 7, 21, RP.couro, 2.6); P.line(14, 6, 21, 12, RP.couro, 2.4);
  // o arco: as pás curvas, a empunhadura de couro, as pontas de prata recurvadas, a corda reta
  const bx = y => 9.5 - 5 * (1 - Math.pow((y - 23) / 19, 2));
  for (let y = 5; y <= 41; y++) { P.put(10, y, RP.cera, 4.2); }
  P.z = 1;
  tube(P, t => [bx(4 + t * 38), 4 + t * 38], t => 2.6 - Math.abs(t - 0.5) * 1.6, RP.madeira, s, 3);
  for (let y = 20; y < 27; y++) { P.put(bx(y) - 1, y, RP.couro, 3.4 - (y % 2) * 0.8); P.put(bx(y), y, RP.couro, 2.6 - (y % 2) * 0.8); }
  for (const [y, d] of [[4, -1], [42, 1]]) { P.put(10, y, RP.prata, 4.6); P.put(11, y + d, RP.prata, 4); P.put(9, y - d, RP.prata, 3.6); }
  for (let y = 9; y < 38; y += 4) if (y < 20 || y > 26) P.put(bx(y) - 0.5, y, RP.prata, 4.4);
  P.z = 2;
  if (!k) {
    // a aljava: couro com duas cintas de prata e a folha gravada, as flechas com penas brancas e azuis saindo em cima
    for (let i = 0; i < 4; i++) { const x = 17 + i * 1.6, y0 = 3 + (i % 2) * 2; for (let y = y0 + 4; y < 16; y++) P.put(x, y, RP.madeira, 3.6); P.put(x - 1, y0 + 1, i % 2 ? RP.tecido : RP.cera, 4); P.put(x - 1, y0 + 2, i % 2 ? RP.tecido : RP.cera, 3.2); P.put(x + 1, y0 + 1, i % 2 ? RP.tecido : RP.cera, 3.4); P.put(x + 1, y0 + 2, i % 2 ? RP.tecido : RP.cera, 2.6); P.put(x, y0 + 3, RP.cera, 3); P.put(x, y0, RP.cera, 4.6); }
    tube(P, t => [19.5 + t * 2.5, 14 + t * 26], () => 5.6, RP.couro, s + 1, 2.8);
    for (const t of [0.06, 0.88]) for (let i = -2; i <= 2; i++) P.put(19.5 + t * 2.5 + i, 14 + t * 26 + i * 0.12, RP.prata, 4.2 - (i + 2) * 0.35);
    leaf(P, 20.8, 27, -1.4, 7, 2.6, RP.couro, s + 2, 1.6);
  } else {
    // a trompa de caça: chifre claro com bocal e boca de prata, pendurada pelo cordão
    P.line(14, 7, 18, 22, RP.corda, 3);
    tube(P, bez([16, 24], [18, 34], [24, 34], [25, 22]), t => 1.6 + t * 3.6, RP.osso, s + 3, 3.2);
    P.ell(25.2, 21.5, 2.4, 1.3, (x, y, dx, dy) => P.put(x, y, RP.prata, 4 - dx - dy)); P.put(15, 23, RP.prata, 4.4); P.put(16, 24, RP.prata, 3);
    for (const t of [0.35, 0.65]) { const [x, y] = bez([16, 24], [18, 34], [24, 34], [25, 22])(t); P.put(x, y - 1, RP.prata, 4.4); P.put(x, y, RP.prata, 3.6); P.put(x, y + 1, RP.prata, 2.6); }
  }
  seams(P);
  return P.done();
}
function standLamp(k) {   // 18 x 60 (k 1: 30 x 60): a lanterna de pé alta: três folhas de prata no pé, a haste fina com nós de folha, o gancho curvo no alto e a gota acesa pendurada (k 1: a haste se abre em duas, duas gotas)
  const W = k ? 30 : 18, H = 60, P = painter(W, H), s = 25281 + k, R = RP.prata, cx = k ? 15 : 7;
  for (const [a, l] of [[-2.7, 8], [-0.45, 8], [-1.57, 5]]) leaf(P, cx + 0.5 + Math.cos(a) * l * 0.45, H - 2 + Math.sin(a) * l * 0.3, a, l, 3, R, s, 3);
  P.rect(cx - 2, H - 3, 5, 3, R, (i, j) => 3.6 - i * 0.4 - j * 0.6);
  const stem = t => [cx + 0.5 + Math.sin(t * 5) * 0.6, H - 3 - t * 41];
  tube(P, stem, () => 2.2, R, s + 1, 2.6);
  for (const t of [0.12, 0.45, 0.78]) { const [x, y] = stem(t); P.rect(Math.round(x) - 2, Math.round(y), 4, 1, R, (i) => 4.4 - i * 0.7); P.rect(Math.round(x) - 1, Math.round(y) + 1, 3, 1, R, (i) => 2.6 - i * 0.5); }
  { const [x, y] = stem(0.3); leaf(P, x + 2.6, y - 3, -0.9, 5, 2, RP.folha, s + 2, 2.8); const [x2, y2] = stem(0.62); leaf(P, x2 - 2.4, y2 - 3, -2.3, 5, 2, RP.folha, s + 3, 3.1); }
  const hook = (dir) => {   // da ponta da haste, o gancho curvo e a gota pendurada
    const [x0, y0] = stem(1), hx = x0 + dir * 6;
    tube(P, bez([x0, y0], [x0, y0 - 6], [hx, y0 - 8], [hx, y0 - 3]), () => 1.8, R, s + 4, 3);
    leaf(P, x0 - dir * 1.5, y0 - 8, dir > 0 ? -2.2 : -0.9, 5, 1.8, R, s + 5, 3.4);
    lanternDrop(P, hx, y0 - 3, s + 6);
  };
  if (!k) hook(1);
  else {
    const [x0, y0] = stem(1);
    for (const dir of [-1, 1]) { tube(P, bez([x0, y0 + 2], [x0 + dir * 2, y0 - 6], [x0 + dir * 9, y0 - 9], [x0 + dir * 9, y0 - 3]), () => 1.8, R, s + 4 + dir, 3); lanternDrop(P, x0 + dir * 9, y0 - 3, s + 6 + dir); }
    leaf(P, x0, y0 - 6, -Math.PI / 2, 6, 2.4, R, s + 9, 3.4);
  }
  return P.done();
}
function rootBench(k) {   // 42 x 22 (k 1: 42 x 30): o banco de raiz: o assento de raiz viva alisada, as pernas de raiz que se abrem pelo chão, folhinhas nas pontas (k 1: com o encosto de raízes trançadas em arco)
  const W = 42, H = k ? 30 : 22, P = painter(W, H), s = 25301 + k, R = RP.madeira, sy = H - 13;
  if (k) {
    // o encosto: duas raízes que sobem das pontas e se trançam no meio
    bark(P, bez([4, sy + 2], [3, -2], [24, 0], [37, sy + 1]), t => 2.4 - Math.sin(t * Math.PI) * 0.6, R, s, { base: 2.1, sulcos: 2 });
    bark(P, bez([38, sy + 2], [40, -1], [16, 1], [5, sy + 1]), t => 2.2 - Math.sin(t * Math.PI) * 0.5, R, s + 1, { base: 1.9, sulcos: 2 });
    for (const x of [12, 21, 30]) leaf(P, x, 3 + Math.abs(x - 21) * 0.2, -1.2 + (x - 21) * 0.05, 4, 1.8, RP.folha, s + x, 2.8);
  }
  P.z = 1;
  // as pernas: raízes do assento até o chão, abrindo em raizinhas
  for (const [x, d] of [[7, -1], [34, 1]]) {
    bark(P, bez([x, sy + 3], [x, sy + 7], [x + d * 1, H - 4], [x + d * 4, H - 1]), t => 4.2 - t * 1.8, R, s + x, { base: 2.4, sulcos: 2 });
    bark(P, bez([x, sy + 4], [x - d, sy + 8], [x - d * 3, H - 2], [x - d * 7, H - 1]), t => 2.6 - t * 1.6, R, s + x + 1, { base: 2.1 });
  }
  P.z = 2;
  // o assento: uma raiz grossa, achatada em cima e lisa de tanto uso
  bark(P, t => [3 + t * 36, sy + 1.5 + Math.sin(t * Math.PI) * -0.8], t => 5.2 - Math.abs(t - 0.5) * 1.4, R, s + 2, { base: 2.6, sulcos: 2 });
  for (let x = 4; x < 38; x++) { const y = Math.round(sy - 1 - Math.sin((x - 3) / 36 * Math.PI) * 0.8); P.put(x, y, R, 4.4 - (x - 4) * 0.02); P.put(x, y + 1, R, 3.6 - (x - 4) * 0.02); }
  P.ell(2.5, sy + 1.5, 2, 2.6, (x, y, dx, dy, d) => P.put(x, y, R, d < 0.35 ? 1.4 : 3.4 - dx - dy));   // o toco cortado
  leaf(P, 40, sy - 1, -0.5, 5, 2, RP.folha, s + 3, 3); leaf(P, 40, sy + 2, 0.3, 4, 1.8, RP.folha, s + 4, 2.4);
  seams(P);
  moss(P, 0.0, s + 5, (x, y) => (y > H - 4 ? 0.2 : -0.2), [R]);
  for (let x = 1; x < W - 1; x++) if (hash2(x, 6, s) < 0.6) P.put(x, H - 1, RP.folha, 1.6 + hash2(x, 7, s) * 1.4);
  return P.done();
}
function fletHouse(k) {   // 52 x 64 (k 1: 42 x 54): a casa de flet pendurada: as cordas do teto, o telhado de folhas em escamas, o quartinho de tábua com a janela redonda acesa e a porta, o piso de tábua passando das paredes, a escada de corda (k 1: um casulo redondo de folhas com a janela)
  const W = k ? 42 : 52, H = k ? 54 : 64, P = painter(W, H), s = 25321 + k, cx = W / 2;
  const rope = (x0, y0, x1, y1) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; P.put(x, y, RP.corda, (i % 3 === 0 ? 4.2 : 2.8)); } };
  if (!k) {
    rope(14, 0, 9, 22); rope(38, 0, 43, 22); rope(26, 0, 26, 9);
    // a parede: tábuas em pé, a janela redonda acesa com a cruz de prata, a porta em arco
    for (let x = 9; x < 44; x++) for (let y = 26; y < 48; y++) { const pl = (x - 9) % 4, v = 2.4 + (pl === 0 ? 0.9 : pl === 3 ? -0.9 : 0) + Math.sin(y * 0.5 + x) * 0.25 - (x - 9) * 0.025 + cg(x, y, s) * 0.45; P.put(x, y, RP.tabua, v); }
    P.ell(18.5, 35.5, 4.6, 4.6, (x, y, dx, dy, d) => { if (d > 0.62) P.put(x, y, RP.prata, 3.8 - (dx + dy) * 1.2); else if (d < 0.22) P.N(x, y, MO.palido); else if (d < 0.4 && (x + y) % 2) P.N(x, y, MO.funda); else P.put(x, y, RP.vidro, 4.2 - d * 2 - dx * 0.5); });
    for (let j = -2; j <= 2; j++) { P.put(18 + j, 35, RP.prata, 3.4); P.put(18, 35 + j, RP.prata, 3.4); }
    for (let y = 32; y < 48; y++) for (let x = 31; x < 39; x++) { const dx = x + 0.5 - 35, top = 32 + (Math.abs(dx) > 2 ? (Math.abs(dx) - 2) * 0.9 : 0); if (y < top) continue; const edge = y < top + 1 || Math.abs(dx) > 3.4; P.put(x, y, edge ? RP.madeira : RP.sombra, edge ? 3.6 - dx * 0.2 : 2.4 - (y - 32) * 0.05); }
    P.put(37, 41, RP.prata, 4.6);
    P.mark('brilho', 18, 34);
    // o piso do flet: tábuas deitadas, as vigas por baixo, a ponta passando das paredes
    for (let x = 1; x < 51; x++) for (let y = 48; y < 51; y++) P.put(x, y, RP.tabua, 3.2 + (y === 48 ? 1 : y === 50 ? -1.2 : 0) + ((x + 3) % 7 === 0 ? -1.2 : 0) + cg(x, y, s) * 0.4 - (x - 1) * 0.015);
    for (const x of [8, 25, 42]) P.rect(x, 51, 3, 2, RP.madeira, (i, j) => 2.6 - i * 0.5 - j * 0.6);
    // a escada de corda descendo da ponta direita
    for (let y = 51; y < 64; y++) { P.put(45, y, RP.corda, 3); P.put(49, y, RP.corda, 2.4); if ((y - 51) % 4 === 2) for (let x = 46; x < 49; x++) P.put(x, y, RP.tabua, 3.6 - (x - 46) * 0.4); }
  } else {
    rope(cx, 0, cx, 8); rope(10, 0, 8, 20); rope(32, 0, 34, 20);
    // o casulo: tábuas curvas em gomos, a janela redonda
    P.ell(cx, 31, 15, 14, (x, y, dx, dy, d) => { if (dy < -0.45) return; const g = ((Math.asin(clamp(dx, -1, 1)) / Math.PI + 0.5) * 7) % 1; P.put(x, y, RP.tabua, 3 - dx * 1.2 - dy * 0.6 - d * 0.5 + (g < 0.14 ? -1.2 : g < 0.3 ? 0.4 : 0) + cg(x, y, s) * 0.4); });
    P.ell(cx - 3, 33, 4, 4, (x, y, dx, dy, d) => { if (d > 0.6) P.put(x, y, RP.prata, 3.8 - (dx + dy) * 1.2); else if (d < 0.22) P.N(x, y, MO.palido); else if (d < 0.4 && (x + y) % 2) P.N(x, y, MO.funda); else P.put(x, y, RP.vidro, 4.2 - d * 2 - dx * 0.5); });
    for (let j = -1; j <= 1; j++) { P.put(cx - 3 + j, 33, RP.prata, 3.4); P.put(cx - 3, 33 + j, RP.prata, 3.4); }
    P.mark('brilho', cx - 3, 32);
    for (let x = 9; x < 34; x++) P.put(x, 44, RP.prata, 3.6 - (x - 9) * 0.06);
    for (let y = 45; y < 54; y++) { P.put(cx + 3, y, RP.corda, 3); P.put(cx + 6, y, RP.corda, 2.4); if ((y - 45) % 4 === 2) for (let x = cx + 4; x < cx + 6; x++) P.put(x, y, RP.tabua, 3.4); }
  }
  // o telhado: escamas de folha em fileiras, cada folha acesa no alto à esquerda, as pontas caindo na beira
  const rx0 = k ? 6 : 3, rx1 = k ? 36 : 49, ry0 = k ? 6 : 9, ry1 = k ? 26 : 28, rcx = (rx0 + rx1) / 2;
  for (let row = 0; row * 3 + ry0 < ry1 + 1; row++) {
    const y = ry0 + row * 3, t = (y - ry0) / (ry1 - ry0), hw = (rx1 - rx0) / 2 * Math.pow(t, k ? 0.5 : 0.7) + 1.5;
    for (let x = rcx - hw + (row % 2) * 2; x <= rcx + hw; x += 4) leaf(P, x, y + 1.8, Math.PI / 2 - (x - rcx) / Math.max(4, hw) * 0.55, 5.6, 4.4, RP.folha, s + row * 31 + Math.round(x), 3.1 - t * 0.5 - (x - rcx) / hw * 0.6 + hash2(row, Math.round(x), s) * 0.4);
  }
  for (let x = rx0; x <= rx1; x += 3) leaf(P, x + 1, ry1 + 2.5, Math.PI / 2 + 0.2, 4.5, 2.2, RP.folha, s + x, 1.9);
  leaf(P, rcx, ry0 - 2, -Math.PI / 2, 6, 2.6, RP.folha, s + 77, 3.6);
  return P.done();
}
function garland(k) {   // 50 x 22 (k 1: 34 x 24): a guirlanda de flores-da-lua: o cipó caído em arco entre dois pregos de prata, folhas alternadas, as flores brancas com o miolo aceso, fiapos pendentes com botões (k 1: menor, três fiapos)
  const W = k ? 34 : 50, H = k ? 24 : 22, P = painter(W, H), s = 25341 + k, sag = k ? 8 : 12;
  const vy = x => 1.5 + sag * (1 - Math.pow((x - (W - 1) / 2) / ((W - 2) / 2), 2));
  for (const x of [1, W - 2]) { P.put(x, 0, RP.prata, 4.4); P.put(x + 1, 0, RP.prata, 3); P.put(x, 1, RP.prata, 3.4); }
  // os fiapos pendentes, atrás
  const strands = k ? [9, 17, 25] : [12, 25, 38];
  for (const x0 of strands) { const y0 = vy(x0), l = (k ? 9 : 6) + hash2(x0, 1, s) * 4; for (let j = 0; j < l; j++) P.put(x0 + Math.sin(j * 0.6) * 0.8, y0 + j, RP.folha, 2.2); P.put(x0, y0 + l, RP.petala, 4.2); P.put(x0, y0 + l + 1, RP.petala, 3); P.N(x0 + 1, y0 + l, MO.lua); P.mark('brilho', x0, y0 + l); }
  P.z = 1;
  tube(P, t => [1.5 + t * (W - 3), vy(1.5 + t * (W - 3))], () => 1.8, RP.folha, s, 2.2);
  for (let x = 4, i = 0; x < W - 3; x += 3.2, i++) { const y = vy(x), up = i % 2; leaf(P, x + 1, y + (up ? -1.6 : 1.8), up ? -0.6 - (x - W / 2) * 0.01 : 0.9, 4.6, 2.3, RP.folha, s + i, 2.9); }
  P.z = 2;
  // as flores: cinco pétalas brancas em estrela, o miolo aceso
  for (let x = 6, i = 0; x < W - 4; x += k ? 7 : 8, i++) {
    const y = Math.round(vy(x)) + 1, X = Math.round(x);
    for (const [dx, dy, v] of [[0, -2, 4.8], [-2, -1, 4.4], [2, -1, 3.4], [-1, 1, 3.6], [1, 1, 2.8], [-1, -1, 4.2], [1, -1, 3.8], [0, 1, 3.2], [-1, 0, 4], [1, 0, 3]]) P.put(X + dx, y + dy, RP.petala, v);
    P.N(X, y, MO.miolo); P.N(X, y - 1, MO.lua); P.mark('brilho', X, y - 1);
  }
  return P.done();
}

/* =============================== OS SALÕES DO REI =============================== */
function kingStatue(k, R = RP.marmore, noHead = false, inlay = RP.prata) {   // 46 x 104: o rei élfico de mármore-lua no plinto, a dos Argonath: elmo alto de asas, o manto atrás, a cota longa e o cinto; k 0: as duas mãos no pomo da espada apontada para baixo; k 1: a mão esquerda erguida de palma aberta, a espada de ponta para baixo na direita
  const W = 46, H = 104, P = painter(W, H), s = 25401 + k, cx = 23, py = 90;
  // o plinto: duas fiadas, a cornija acesa, uma faixa de folhas lavradas
  ashlar(P, 4, py + 3, 38, 11, R, s, 4, 13, null, 2.4); P.rect(3, py, 40, 3, R, (i, j) => 4.4 - j * 1.2 - i * 0.03);
  for (let x = 6; x < 40; x += 4) leaf(P, x + 1.5, py + 7.5, -0.5 + (x % 8 ? 0 : 1), 4, 1.8, R, s + x, 2.2);
  for (let x = 6; x < 40; x++) P.put(x, py + 5, inlay, 3.8 - (x - 6) * 0.04);
  P.z = 1;
  // o manto atrás: mais largo, caindo dos ombros ao plinto em dobras
  for (let y = 31; y < py; y++) { const hw = 12 + (y - 31) * 0.05; for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw, fold = Math.sin(u * 9 + y * 0.03) * 0.5; P.put(x, y, R, 2.2 - u * 1 + fold + cg(x, y, s) * 0.3); } }
  P.z = 2;
  // a cota longa: do peito à barra, as dobras verticais, a barra acesa
  for (let y = 31; y < py; y++) {
    const hw = y < 52 ? 8.6 - (y - 31) * 0.03 : 8 + (y - 52) * 0.07;
    for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw, fold = y > 52 ? Math.sin(u * 7.5) * 0.55 : 0; P.put(x, y, R, 3.3 - u * 1.3 - u * u * 0.4 + fold + (y === py - 1 ? -0.8 : 0) + cg(x, y, s) * 0.3); }
  }
  for (let x = cx - 8; x < cx + 9; x++) { P.put(x, 51, R, 4.4 - (x - cx + 8) * 0.12); P.put(x, 52, R, 2.2 - (x - cx + 8) * 0.05); P.put(x, 53, RP.prata, 3.6 - (x - cx + 8) * 0.1); }   // o cinto
  for (let y = 33; y < 50; y += 3) for (let x = cx - 6; x < cx + 6; x++) if ((x + (y >> 1)) % 4 === 0) P.put(x, y, R, 2.4);   // a malha do peito
  P.z = 3;
  // os ombros: ombreiras em folha
  leaf(P, cx - 9, 32, -0.25, 11, 6, R, s + 2, 3.4); leaf(P, cx + 9, 32, Math.PI + 0.25, 11, 6, R, s + 3, 2.6);
  P.rect(cx - 2, 27, 4, 4, R, (i, j) => 3.4 - i * 0.5);   // o pescoço
  P.z = 4;
  if (!noHead) { kingHead(P, cx - 8.5, 5, R, s + 4, inlay); if (inlay === RP.prata) P.N(cx, 16, MO.lua); }   // a pedra-da-lua no elmo
  P.z = 5;
  // a espada: lâmina comprida de ponta para baixo, o fio do meio aceso, a guarda com as pontas em folha caídas
  const sword = (sx, gy, tip) => {
    for (let y = gy + 3; y < tip; y++) { const t = (y - gy - 3) / (tip - gy - 3), hw = t < 0.85 ? 2 : 2 * (1 - (t - 0.85) / 0.15) + 0.2; for (let x = Math.floor(sx - hw); x < sx + hw; x++) { const u = (x + 0.5 - sx) / Math.max(0.5, hw); P.put(x, y, RP.prata, Math.abs(u) < 0.3 ? 4.8 : u < 0 ? 4 : 2.6); } }
    for (let x = sx - 6; x < sx + 6; x++) { const d = Math.abs(x + 0.5 - sx); P.put(x, gy + 1 + Math.round(Math.max(0, d - 2) * 0.4), RP.prata, 4.2 - (x - sx + 6) * 0.15); P.put(x, gy + 2 + Math.round(Math.max(0, d - 2) * 0.4), RP.prata, 2.6); }
    for (let y = gy - 5; y < gy + 1; y++) { P.put(sx - 1, y, R, 3.8); P.put(sx, y, R, 2.6); }
    P.ell(sx, gy - 6, 1.6, 1.6, (x, y, dx, dy) => P.put(x, y, RP.prata, 4.4 - dx - dy));
  };
  if (!k) {
    sword(cx, 46, py);
    // os braços dobrados, as mãos uma sobre a outra no pomo
    tube(P, bez([cx - 10, 35], [cx - 12, 41], [cx - 6, 44], [cx - 2, 42]), () => 4.2, R, s + 5, 3.2);
    tube(P, bez([cx + 10, 35], [cx + 12, 41], [cx + 6, 44], [cx + 2, 42]), () => 4.2, R, s + 6, 2.4);
    P.z = 6; P.blob(cx - 1.5, 41.5, 2.6, 2.2, R, s + 7, 3.6); P.blob(cx + 1.5, 43, 2.6, 2.2, R, s + 8, 3);
    for (let x = cx - 3; x < cx + 4; x++) P.put(x, 44, R, 1.6);
  } else {
    sword(cx + 11, 50, py);
    tube(P, bez([cx + 10, 35], [cx + 13, 42], [cx + 12, 46], [cx + 11, 47]), () => 4, R, s + 6, 2.4);
    P.z = 6; P.blob(cx + 11, 46, 2.4, 2.4, R, s + 8, 3);
    // o braço esquerdo erguido, a palma aberta para a frente, os dedos juntos
    P.z = 6; tube(P, bez([cx - 10, 34], [cx - 15, 28], [cx - 15, 20], [cx - 14, 14]), t => 4.4 - t * 1.2, R, s + 5, 3.4);
    P.ell(cx - 14, 11, 2.6, 3.4, (x, y, dx, dy, d) => P.put(x, y, R, 4 - dx - dy * 0.6 - d * 0.4));
    for (let f = 0; f < 4; f++) for (let j = 0; j < 3 + (f === 1 || f === 2 ? 1 : 0); j++) P.put(cx - 16 + f + (f > 1 ? 0 : 0), 7 - j, R, 4 - f * 0.4 - j * 0.1);
    P.put(cx - 17, 10, R, 3.6); P.put(cx - 18, 9, R, 3.2);   // o polegar
  }
  seams(P);
  grime(P, 0.8, -0.05, s + 9, (x, y) => (y > py ? 0.25 : -0.1), [R]);
  chip(P, 0.08, s, [R]);
  return P.done();
}
function armorStand(k) {   // 28 x 48 (k 1: 34 x 48): a armadura élfica no cabide: o elmo de crista em folha, as ombreiras em folha, o peitoral de prata com a lua em azul, a fralda de escamas, o manto azul atrás (k 1: com o escudo em folha encostado)
  const W = k ? 34 : 28, H = 48, P = painter(W, H), s = 25421 + k, cx = 14;
  // o cabide: pé, haste e travessa de madeira clara
  P.rect(cx - 7, H - 3, 15, 3, RP.madeira, (i, j) => 3.6 - j * 0.9 - i * 0.06); P.rect(cx - 1, 9, 2, H - 12, RP.madeira, (i) => 3.4 - i * 1.2);
  P.z = 1;
  // o manto azul atrás, dos ombros para baixo, com a barra de prata
  for (let y = 15; y < 44; y++) { const hw = 9 + (y - 15) * 0.1; for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const x = Math.floor(cx + sd * (hw - i)) - (sd > 0 ? 1 : 0); P.put(x, y, y > 41 ? RP.prata : RP.tecido, (sd < 0 ? 3 : 1.8) + (i === 0 ? -0.6 : 0) + Math.sin(y * 0.3 + i) * 0.3); } }
  P.z = 2;
  // a fralda: escamas em folha, três fileiras
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5 - (r === 2 ? 1 : 0); i++) leaf(P, cx - 5.5 + i * 2.8 + (r % 2) * 1.4, 32 + r * 3.4, Math.PI / 2, 5, 3, RP.prata, s + r * 7 + i, 2.9 - r * 0.3 - i * 0.15);
  // o peitoral: prata sombreada em cilindro, o filete, a lua crescente em azul
  for (let y = 15; y < 31; y++) { const hw = y < 18 ? 6 + (y - 15) * 0.5 : 7.4 - (y - 18) * 0.12; for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw; P.put(x, y, RP.prata, 3.4 - u * 1.4 - u * u * 0.5 + (y === 15 ? 1 : 0) + (Math.abs(u) < 0.06 && y > 17 ? 0.8 : 0) + cg(x, y, s) * 0.2); } }
  for (let x = cx - 6; x < cx + 6; x++) P.put(x, 30, RP.tecido, 3 - (x - cx + 6) * 0.1);
  P.ell(cx - 0.5, 22.5, 3.2, 3.2, (x, y, dx, dy, d) => { const inner = Math.hypot(dx - 0.45, dy + 0.15) < 0.82; if (!inner) P.put(x, y, RP.tecido, 4.4 - (dx + dy) * 0.9); });
  P.z = 3;
  leaf(P, cx - 7, 16, -0.35, 10, 6, RP.prata, s + 1, 3.3); leaf(P, cx + 7, 16, Math.PI + 0.35, 10, 6, RP.prata, s + 2, 2.6);
  P.z = 4;
  // o elmo: a calota alta, a abertura do rosto em T, a crista de folha caindo para trás
  P.ell(cx, 8, 4.8, 6, (x, y, dx, dy, d) => { if (dy > 0.75) return; P.put(x, y, RP.prata, 3.7 - dx * 1.3 - dy * 0.8 - d * 0.4 + cg(x, y, s) * 0.2); });
  P.rect(cx - 2, 8, 4, 2, RP.sombra, () => 1.5); P.rect(cx - 1, 10, 2, 3, RP.sombra, () => 1.2);
  for (let x = cx - 5; x <= cx + 4; x++) P.put(x, 13, RP.prata, 3.6 - (x - cx + 5) * 0.15);
  leaf(P, cx - 2, 2.5, -2.7, 11, 3.2, RP.prata, s + 3, 3.8); P.N(cx, 5, MO.lua);
  if (k) {   // o escudo em folha encostado no pé do cabide
    P.z = 5; leaf(P, 26.5, 34, -1.45, 26, 12, RP.prata, s + 4, 3);
    for (let y = 24; y < 45; y++) P.put(26 + (y - 34) * -0.12, y, RP.tecido, 3.2);
    P.ell(26.4, 32, 2.2, 2.2, (x, y, dx, dy) => P.put(x, y, RP.tecido, 4 - dx - dy));
  }
  seams(P);
  return P.done();
}
function scrollShelf(k) {   // 40 x 48: a estante de pergaminhos: madeira clara com o arco lavrado em cima, três prateleiras com rolos deitados em pilha (as pontas de madeira, as fitas azuis e de ouro), livros em pé, um pergaminho aberto caindo da beira (k 1: meio vazia, rolos caídos no chão)
  const W = 40, H = 48, P = painter(W, H), s = 25441 + k, R = RP.madeira;
  P.rect(4, 7, 32, 39, RP.tabua, (i, j, x, y) => 1.1 + (i % 6 === 0 ? -0.4 : 0) + cg(x, y, s) * 0.3);
  P.z = 1;
  for (const x0 of [2, 35]) P.rect(x0, 6, 3, 42, R, (i, j, x, y) => 3.2 - i * 0.7 + (x0 > 10 ? -0.8 : 0) + cg(x, y, s) * 0.4);
  for (let x = 1; x < 39; x++) { const a = 6 - Math.round(Math.sin((x - 1) / 37 * Math.PI) * 5); for (let y = a; y < 9; y++) P.put(x, y, R, 3.4 + (y === a ? 1 : 0) - (x - 1) * 0.03 + cg(x, y, s) * 0.3); }
  leaf(P, 20, 4.5, 0, 9, 3.2, R, s + 1, 2.2); P.put(16, 4, RP.prata, 4.4); P.put(24, 4, RP.prata, 4);
  const shelves = [18, 30, 42];
  for (const y of shelves) plank(P, 3, y, 34, 2, R, s + y, false, 3.2);
  P.rect(2, H - 2, 36, 2, R, (i, j) => 2.6 - j - i * 0.02);
  P.z = 2;
  // um rolo deitado: o papel em cilindro (claro em cima), a ponta enrolada à esquerda, os pinos de madeira, a fita
  const roll = (x, y, len, tie) => {
    for (let i = 0; i < len; i++) for (let j = 0; j < 3; j++) P.put(x + i, y + j, RP.papel, (j === 0 ? 4.3 : j === 1 ? 3.4 : 2.1) - i * 0.04 + cg(x + i, y + j, s) * 0.3);
    P.put(x, y + 1, RP.papel, 2.4); P.put(x, y, RP.papel, 3.6); P.put(x + len - 1, y + 1, RP.papel, 1.8);
    P.put(x - 1, y + 1, RP.madeira, 3.4); P.put(x + len, y + 1, RP.madeira, 2.2);
    if (tie) { const tx = x + (len >> 1); for (let j = 0; j < 3; j++) P.put(tx, y + j, tie, 3.6 - j * 0.7); }
  };
  const book = (x, y1, h, R2, v) => { for (let y = y1 - h; y < y1; y++) { P.put(x, y, R2, v + 0.8); P.put(x + 1, y, R2, v); P.put(x + 2, y, R2, v - 0.7); } P.put(x + 1, y1 - h + 2, RP.ouro, 4); P.put(x + 1, y1 - 3, RP.ouro, 3.2); };
  const fill = (y1, n, seed) => {
    let x = 6;
    for (let i = 0; i < n && x < 31; i++) {
      const h = hash2(i, 0, seed);
      if (h < 0.6) { const len = 8 + Math.round(hash2(i, 1, seed) * 3), rows = 1 + Math.round(hash2(i, 2, seed) * 2); if (x + len > 34) break; for (let r = 0; r < rows; r++) { const off = r % 2 ? 1 : 0; roll(x + off, y1 - 3 - r * 3, len - off * 2, hash2(i, r + 5, seed) < 0.5 ? (hash2(i, r, seed) < 0.5 ? RP.tecido : RP.ouro) : null); } x += len + 3; }
      else { book(x, y1, 7 + Math.round(h * 3), [RP.tecido, RP.folha, RP.vinho, RP.couro][i % 4], 2.8); x += 4; }
    }
  };
  if (!k) { fill(18, 5, s + 2); fill(30, 4, s + 3); fill(42, 5, s + 4); }
  else { fill(18, 1, s + 2); fill(30, 2, s + 3); }
  P.z = 3;
  // o pergaminho aberto pendurado da beira da prateleira do meio, com as linhas da escrita
  const pl = k ? 46 : 39;
  for (let y = 30; y < pl; y++) for (let x = 25; x < 31; x++) { P.put(x, y, RP.papel, 4 - (x - 25) * 0.15 - (y - 30) * 0.03 + (x === 25 ? 0.4 : 0)); if ((y - 31) % 2 === 0 && x > 25 && x < 30 && hash2(x, y, s) < 0.7) P.put(x, y, RP.papel, 1.6); }
  roll(25, pl, 6, null);
  if (k) for (const [x, y] of [[8, H - 5], [13, H - 5], [10, H - 8]]) roll(x, y, 9, RP.tecido);
  seams(P);
  return P.done();
}
function fountain() {   // 46 x 46: a fonte de prata: a bacia larga de mármore com a borda de prata, o pé, a bacia de cima, a flor de prata no alto de onde a água sai; a água corre ao vivo
  const W = 46, H = 46, P = painter(W, H), s = 25461, R = RP.marmore, cx = 22.5;
  // a água da bacia de baixo, aparecendo por cima da borda
  for (let x = 6; x < 40; x++) { const u = (x + 0.5 - cx) / 17; P.put(x, 29, RP.agua, 3.6 - u * 0.8); P.put(x, 30, RP.agua, 2.8 - u * 0.6); }
  for (let x = 8; x < 38; x += 5) P.N(x + (x % 3), 29, MO.palido);
  P.z = 1;
  // a bacia de baixo: o corpo afinando para baixo, a borda de prata grossa
  for (let y = 31; y < 40; y++) { const t = (y - 31) / 8, hw = 19 - t * t * 8; for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw; P.put(x, y, R, 3.2 - u * 1.3 - u * u * 0.5 - t * 0.6 + (Math.abs(((u + 1) * 6) % 1 - 0.5) < 0.08 ? -0.9 : 0) + cg(x, y, s) * 0.3); } }
  for (let x = 3; x < 42; x++) { const u = (x + 0.5 - cx) / 19.5; P.put(x, 30, RP.prata, 4.6 - u * 0.9); P.put(x, 31, RP.prata, 3.4 - u * 1.2); }
  for (let x = Math.floor(cx - 15); x < cx + 15; x += 6) leaf(P, x + 2, 35.5, 0, 5, 2.2, R, s + x, 2.4);
  // o pé e a base
  for (let y = 40; y < 44; y++) for (let x = Math.floor(cx - 4); x < cx + 4; x++) P.put(x, y, R, 3 - (x - cx + 4) * 0.25);
  P.rect(Math.floor(cx) - 9, 44, 19, 2, R, (i, j) => 3.8 - j * 1.2 - i * 0.08);
  // a coluna do meio até a bacia de cima
  for (let y = 18; y < 30; y++) for (let x = Math.floor(cx - 2); x < cx + 2; x++) { const u = (x + 0.5 - cx) / 2; P.put(x, y, R, 3.4 - u * 1.4 + (u > -0.6 && u < -0.2 ? 0.8 : 0)); }
  P.z = 2;
  // a bacia de cima com a água
  for (let x = Math.floor(cx - 7); x < cx + 7; x++) P.put(x, 15, RP.agua, 3.4 - (x - cx) * 0.06);
  for (let y = 16; y < 20; y++) { const t = (y - 16) / 3, hw = 9 - t * t * 4.5; for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw; P.put(x, y, y === 16 ? RP.prata : R, (y === 16 ? 4.4 : 3.2) - u * 1.2 - t * 0.4); } }
  // a flor de prata no alto: o talo e a taça de pétalas de onde a água brota
  for (let y = 8; y < 15; y++) { P.put(cx - 1, y, RP.prata, 3.8); P.put(cx, y, RP.prata, 2.6); }
  for (const [a, l] of [[-2.5, 6], [-0.65, 6], [-1.57, 5], [-2.0, 5], [-1.15, 5]]) leaf(P, cx + Math.cos(a) * 2.6, 8 + Math.sin(a) * 2.2, a, l, 2.6, RP.prata, s + Math.round(a * 10), 3.4);
  P.N(cx - 0.5, 6, MO.palido); P.N(cx - 0.5, 5, '#ffffff');
  P.mark('jato', cx - 3, 8, { len: 7 }); P.mark('jato', cx + 2, 8, { len: 7 });
  P.mark('jato', cx - 9, 17, { len: 12 }); P.mark('jato', cx + 8, 17, { len: 12 });
  P.mark('agua', cx - 15, 29, { w: 30 }); P.mark('agua', cx - 6, 15, { w: 12 });
  seams(P);
  return P.done();
}
function moonTapestry(k) {   // 34 x 56: a tapeçaria da lua: a vara de prata com as pontas em folha, o pano azul fundo em dobras, a barra de prata, a lua crescente e a árvore de prata com as estrelas, a cauda em três pontas com borlas (k 1: a Árvore-Mãe com a Lua Presa nas raízes)
  const W = 34, H = 56, P = painter(W, H), s = 25481 + k, x0 = 3, x1 = 31, y0 = 3;
  const bot = x => 46 + Math.round(4 - Math.abs(((x - x0) / (x1 - x0)) * 3 % 1 - 0.5) * 8);
  for (let x = x0; x < x1; x++) for (let y = y0; y < bot(x); y++) {
    const fold = Math.sin((x - x0) * 0.7) * 0.45, border = x < x0 + 2 || x > x1 - 3 || y < y0 + 2 || y > bot(x) - 3;
    if (border) P.put(x, y, RP.prata, 3.2 + fold - (x - x0) * 0.04 + (y === y0 ? 1 : 0));
    else P.put(x, y, RP.tecido, 1.9 + fold - (y - y0) * 0.008 + cg(x, y, s) * 0.35 + ((x + y) % 4 === 0 ? -0.25 : 0));
  }
  // as borlas de ouro nas três pontas
  for (const x of [x0 + 4, (x0 + x1) / 2, x1 - 5]) { const b = bot(Math.round(x)); for (let j = 0; j < 5; j++) { P.put(x, b + j, RP.ouro, 4 - j * 0.4); P.put(x + 1, b + j, RP.ouro, 2.8 - j * 0.3); } }
  // a vara
  for (let x = 0; x < W; x++) { P.put(x, 1, RP.prata, 4.4 - x * 0.04); P.put(x, 2, RP.prata, 2.6 - x * 0.03); }
  leaf(P, 1, 1.5, Math.PI, 4, 2.2, RP.prata, s, 3.6); leaf(P, 33, 1.5, 0, 4, 2.2, RP.prata, s + 1, 3);
  const st = (x, y) => { P.put(x, y, RP.cera, 4.6); };
  if (!k) {
    // a lua crescente
    P.ell(17, 12, 5, 5, (x, y, dx, dy, d) => { if (Math.hypot(dx - 0.45, dy + 0.2) > 0.85) P.put(x, y, RP.prata, 4.6 - (dx + dy) * 0.6); });
    // a árvore de prata: tronco, galhos em leque, folhas em pontos
    for (let y = 22; y < 42; y++) { P.put(17, y, RP.prata, 3.8); P.put(18, y, RP.prata, 2.8); }
    for (const [a, l] of [[-2.4, 8], [-0.75, 8], [-2.0, 6], [-1.15, 6]]) { const yb = 30 - (l === 6 ? 4 : 0); P.line(17.5, yb, 17.5 + Math.cos(a) * l, yb + Math.sin(a) * l, RP.prata, 3.6); }
    for (let i = 0; i < 26; i++) { const a = -Math.PI + hash2(i, 0, s) * Math.PI, r = 4 + hash2(i, 1, s) * 7, x = 17.5 + Math.cos(a) * r, y = 26 + Math.sin(a) * r * 0.75; P.put(x, y, hash2(i, 2, s) < 0.4 ? RP.cera : RP.prata, 3.4 + hash2(i, 3, s)); }
    for (const [x, y] of [[6, 7], [27, 9], [8, 18], [26, 20], [7, 32], [27, 34]]) { st(x, y); P.put(x - 1, y, RP.prata, 3); P.put(x + 1, y, RP.prata, 3); P.put(x, y - 1, RP.prata, 3); P.put(x, y + 1, RP.prata, 3); }
    for (let x = 9; x < 27; x++) if (x % 3) P.put(x, 42, RP.prata, 3.4);   // o chão
  } else {
    // a Árvore-Mãe: o tronco largo, a copa em arco de folhas, as raízes abraçando a lua presa embaixo
    for (let y = 14; y < 34; y++) { const hw = 1.4 + Math.max(0, y - 26) * 0.35; for (let x = Math.floor(17.5 - hw); x < 17.5 + hw; x++) P.put(x, y, RP.prata, 4 - (x + 0.5 - 17.5 + hw) / (2 * hw) * 2); }
    for (const [a, l] of [[-2.5, 8], [-0.65, 8], [-2.0, 6], [-1.15, 6], [-1.57, 7]]) P.line(17.5, 22, 17.5 + Math.cos(a) * l, 20 + Math.sin(a) * l, RP.prata, 3.6);
    for (let i = 0; i < 40; i++) { const a = -Math.PI + hash2(i, 0, s) * Math.PI, r = 4 + hash2(i, 1, s) * 9, x = 17.5 + Math.cos(a) * r * 1.15, y = 17 + Math.sin(a) * r * 0.75; P.put(x, y, hash2(i, 2, s) < 0.45 ? RP.cera : RP.petala, 3.2 + hash2(i, 3, s) * 1.6); }
    P.ell(17.5, 39, 4, 4, (x, y, dx, dy, d) => P.put(x, y, RP.cera, 4.8 - d * 1.2 - (dx + dy) * 0.4));
    for (const sd of [-1, 1]) { P.line(17.5 + sd, 33, 17.5 + sd * 6, 38, RP.prata, 3.2); P.line(17.5 + sd * 6, 38, 17.5 + sd * 4, 43, RP.prata, 2.8); P.line(17.5 + sd * 2, 34, 17.5 + sd * 4, 39, RP.prata, 3.4); }
    for (const [x, y] of [[6, 8], [28, 7], [7, 26], [27, 28]]) st(x, y);
    for (let q = 0; q < 3; q++) { const X = 8 + q * 8; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (eOn(q + 2, i, j)) P.put(X + i, 44 + j - 2, RP.prata, 3.6); }
  }
  return P.done();
}
function chandelier() {   // 56 x 40: o lustre de galhos: a corrente de prata do teto, o nó lavrado, quatro galhos claros abertos como galhada, velas brancas com a chama azul nas pontas, folhinhas, um pingente de cristal
  const W = 56, H = 40, P = painter(W, H), s = 25501, cx = 28;
  for (let y = 0; y < 12; y++) { const k = y % 4; P.put(cx - 1 + (k === 2 ? 1 : 0), y, RP.prata, k < 2 ? 4 - k * 1.2 : 3.2); if (k < 2) P.put(cx, y, RP.prata, 2.4); }
  const tips = [];
  const arm = (pts, w0, s2) => { tube(P, bez(...pts), t => w0 - t * (w0 - 1.4), RP.madeira, s2, 3); const e = pts[3]; tips.push(e); };
  arm([[cx, 15], [cx - 8, 22], [cx - 18, 24], [cx - 23, 17]], 3, s); arm([[cx, 15], [cx + 8, 22], [cx + 18, 24], [cx + 23, 17]], 3, s + 1);
  arm([[cx, 16], [cx - 4, 26], [cx - 10, 28], [cx - 12, 21]], 2.6, s + 2); arm([[cx, 16], [cx + 4, 26], [cx + 10, 28], [cx + 12, 21]], 2.6, s + 3);
  // forquilhas de cima nos galhos de fora
  for (const sd of [-1, 1]) { tube(P, bez([cx + sd * 15, 23], [cx + sd * 15, 18], [cx + sd * 16, 15], [cx + sd * 17, 11]), t => 2 - t * 0.6, RP.madeira, s + 4 + sd, 3.2); tips.push([cx + sd * 17, 11]); }
  // o nó do meio e o pingente de cristal
  P.blob(cx, 15, 3.6, 3.2, RP.madeira, s + 6, 3.2); P.rect(cx - 1, 11, 3, 2, RP.prata, (i) => 4 - i);
  for (let y = 19; y < 25; y++) P.put(cx, y, RP.prata, 3);
  for (let j = 0; j < 6; j++) { const hw = j < 3 ? j * 0.7 : (6 - j) * 0.7; for (let x = Math.floor(cx - hw); x <= cx + hw; x++) P.N(x, 25 + j, x < cx ? MO.palido : MO.lua); }
  P.mark('brilho', cx, 27);
  // as folhinhas pelos galhos
  for (let i = 0; i < 10; i++) { const sd = i % 2 ? 1 : -1, x = cx + sd * (5 + (i >> 1) * 3.6), y = 22 + Math.sin(i) * 2; leaf(P, x, y + 2, Math.PI / 2 + sd * 0.4, 4, 1.8, RP.folha, s + 10 + i, 2.6); }
  // as velas: o pratinho de prata, a vela branca, o pavio; a chama é ao vivo
  for (const [x, y] of tips) {
    const X = Math.round(x), Y = Math.round(y);
    P.rect(X - 2, Y - 1, 4, 1, RP.prata, (i) => 4.2 - i * 0.6);
    for (let j = 0; j < 5; j++) { P.put(X - 1, Y - 2 - j, RP.cera, 4.4); P.put(X, Y - 2 - j, RP.cera, 3.2); }
    P.put(X - 1, Y - 7, RP.cera, 2.4); P.put(X - 1, Y - 8, RP.sombra, 2);
    P.N(X - 1, Y - 9, MO.lua);
    P.mark('vela', X - 1, Y - 9, { c: MO.lua });
  }
  seams(P);
  return P.done();
}
function leafWindow(k) {   // 32 x 52: o vitral de folha: o arco ogival de mármore-lua, o chumbo escuro, os vidros azuis acesos por trás e a grande folha verde-azul com as nervuras (k 1: a lua crescente sobre a árvore de prata)
  const W = 32, H = 52, P = painter(W, H), s = 25521 + k, x0 = 3, x1 = 29, sy = 17, yb = 48;
  const rr = (x1 - x0) * 0.82;
  const inArch = (x, y, m) => { const X = x + 0.5, Y = y + 0.5; if (X < x0 - m || X > x1 + m || Y > yb + m) return false; if (Y >= sy) return true; return Math.hypot(X - (x0 + rr), Y - sy) <= rr + m && Math.hypot(X - (x1 - rr), Y - sy) <= rr + m; };
  // a moldura de mármore
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inArch(x, y, 3) && !inArch(x, y, 0)) P.put(x, y, RP.marmore, 3.2 - (x - 16) * 0.05 - (y - 26) * 0.01 + (inArch(x, y, 1) ? -0.8 : inArch(x, y, 2) ? 0.4 : 0.9) + cg(x, y, s) * 0.3);
  P.rect(0, yb + 1, W, 3, RP.marmore, (i, j) => 4.2 - j * 1.1 - i * 0.03);
  // o vidro: células irregulares pelo ruído; cada uma um tom, o chumbo entre elas
  const cellOf = (x, y) => { const a = Math.floor((x + cn(x, y, 7, 7, s) * 5) / 6), b = Math.floor((y + cn(x, y, 7, 7, s + 1) * 5) / 7); return a * 31 + b; };
  const leafAt = (x, y) => { const dx = x + 0.5 - 16, dy = y + 0.5 - 28, u = (dy + 15) / 30, hw = 8 * Math.pow(Math.sin(Math.PI * clamp(u, 0, 1)), 0.8); return u > 0 && u < 1 && Math.abs(dx - Math.sin(u * 3) * 1.2) < hw; };
  const moonAt = (x, y) => { const dx = x + 0.5 - 16, dy = y + 0.5 - 15; return Math.hypot(dx, dy) < 6 && Math.hypot(dx - 2.8, dy - 1.2) > 5; };
  const treeAt = (x, y) => (Math.abs(x + 0.5 - 16) < 1.3 && y > 26 && y < 46) || (y > 22 && y < 36 && Math.abs(x + 0.5 - 16) < (36 - y) * 0.6 && ((x + y) % 3 !== 0));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inArch(x, y, 0)) continue;
    const c = cellOf(x, y), lead = cellOf(x + 1, y) !== c || cellOf(x, y + 1) !== c, h = hash2(c, 0, s), tv = (y - 4) / 44;
    if (!k && leafAt(x, y)) {
      const dx = x + 0.5 - 16 - Math.sin(((y + 0.5 - 28) + 15) / 30 * 3) * 1.2, vein = Math.abs(dx) < 0.6 || (Math.abs(Math.abs(dx) - ((y + 30) % 6) * 0.9) < 0.5 && Math.abs(dx) < 6);
      if (vein) { P.put(x, y, RP.sombra, 2); continue; }
      P.put(x, y, RP.folha, 4 - Math.abs(dx) * 0.2 - tv * 0.6 + (dx < 0 ? 0.5 : 0) + cg(x, y, s) * 0.3);
      if (Math.abs(dx) < 2.5 && hash2(x, y, s) < 0.18) P.N(x, y, '#7cc8c0');
      continue;
    }
    if (k && moonAt(x, y)) { const e = !moonAt(x + 1, y) || !moonAt(x, y + 1) || !moonAt(x - 1, y); if (e && (x + y) % 2) P.N(x, y, MO.palido); else P.put(x, y, RP.cera, 4.6 - (x - 11) * 0.12 - (y - 9) * 0.06); continue; }
    if (k && treeAt(x, y)) { P.put(x, y, RP.prata, 3.6 - (x - 16) * 0.15); continue; }
    if (lead) { P.put(x, y, RP.sombra, 2.6); continue; }
    P.put(x, y, RP.tecido, 2.6 + h * 1.6 - tv * 0.8 + cg(x, y, s) * 0.3);
    if (h > 0.8 && hash2(x, y, s + 1) < 0.25) P.N(x, y, h > 0.92 ? MO.lua : MO.funda);
  }
  // o brilho de luar atravessando o vidro: um risco diagonal claro
  for (let y = 6; y < 44; y++) { const x = 8 + (y - 6) * 0.28; if (inArch(x, y, 0) && hash2(y, 3, s) < 0.6) P.tint(x, y, '#e8f4ff', 0.35); }
  P.mark('brilho', 12, 9);
  return P.done();
}
function longTable(k) {   // 68 x 26: a mesa longa: o tampo de madeira clara com a borda lavrada, as pernas em raiz, o caminho azul com as pontas caindo, cálices de prata, uma jarra, a fruteira (k 1: cálices tombados, um no chão, a toalha arrastada)
  const W = 68, H = 26, P = painter(W, H), s = 25541 + k, R = RP.madeira, ty = 12;
  // as pernas em raiz e a travessa
  for (const x of [7, 59]) { bark(P, bez([x, ty + 2], [x - 1, ty + 6], [x + 1, H - 5], [x - 2, H - 1]), t => 3.4 - t * 0.8, R, s + x, { base: 2.4, sulcos: 2 }); bark(P, bez([x + 1, H - 3], [x + 2, H - 2], [x + 4, H - 1], [x + 5, H - 1]), () => 1.6, R, s + x + 1, { base: 2 }); }
  for (let x = 9; x < 58; x++) { P.put(x, H - 6, R, 2.8 - x * 0.01); P.put(x, H - 5, R, 1.8); }
  P.z = 1;
  plank(P, 1, ty, 66, 3, R, s, false, 3.2);
  for (let x = 2; x < 66; x++) if (x % 4 === 0) P.put(x, ty + 2, R, 1.8);
  // o caminho de mesa azul, com as pontas caindo nas beiras
  const run0 = 14, run1 = k ? 44 : 54;
  for (let x = run0; x < run1; x++) P.put(x, ty, RP.tecido, 3.4 + (x % 3 === 0 ? 0.4 : 0));
  for (let y = ty + 1; y < ty + 7; y++) for (let x = run0; x < run0 + 4; x++) P.put(x, y, RP.tecido, 3 - (x - run0) * 0.3 - (y - ty) * 0.05);
  if (!k) for (let y = ty + 1; y < ty + 7; y++) for (let x = run1 - 4; x < run1; x++) P.put(x, y, RP.tecido, 2.6 - (x - run1 + 4) * 0.3);
  else for (let y = ty + 1; y < H; y++) for (let x = run1; x < run1 + 4 + (y > H - 3 ? (y - H + 3) * 3 : 0); x++) P.put(x, y, RP.tecido, 2.6 - (x - run1) * 0.15 + (y === H - 1 ? -0.4 : 0));
  for (const x of [run0, run0 + 3, run1 - 4, run1 - 1]) if (!k || x < run1 - 4) P.put(x, ty + 7, RP.prata, 4);
  P.z = 2;
  // os cálices: taça, haste, pé, o brilho na borda
  const cup = (x, by, tip = 0) => {
    const Q = painter(7, 9);
    Q.ell(3.5, 2.5, 3, 2.6, (xx, yy, dx, dy) => { if (dy < -0.35) return; Q.put(xx, yy, RP.prata, 3.6 - dx * 1.4 - dy * 0.5); });
    for (let xx = 1; xx < 6; xx++) Q.put(xx, 1, RP.prata, xx < 3 ? 4.8 : 3.8);
    Q.put(3, 5, RP.prata, 3.6); Q.put(3, 6, RP.prata, 3.2); Q.rect(1, 7, 5, 1, RP.prata, (i) => 4.2 - i * 0.5); Q.put(2, 2, RP.cera, 5);
    if (tip) blit(P, Q, x - 3, by - 6, tip, 3.5, 4); else blit(P, Q, x - 3, by - 8, 0, 0, 0);
  };
  for (const x of [5, 20, 34, 47, 62]) { if (k && x === 34) cup(x + 1, ty - 1, 1.57); else if (k && x === 62) cup(x - 2, H - 1, -1.2); else cup(x, ty); }
  if (k) for (let x = 36; x < 42; x++) P.put(x, ty, RP.vinho, 3.4 - (x - 36) * 0.3);
  // a jarra de vidro claro com o vinho de amora
  P.ell(27, ty - 5, 3.6, 4.2, (x, y, dx, dy, d) => P.put(x, y, dy > -0.2 ? RP.vinho : RP.vidro, (dy > -0.2 ? 3.4 : 3.8) - dx * 1.3 - dy * 0.4 + (dx < -0.3 && dx > -0.7 && dy < 0.4 ? 1.4 : 0)));
  for (let y = ty - 13; y < ty - 8; y++) { P.put(26, y, RP.vidro, 4.2); P.put(27, y, RP.vidro, 3); }
  P.rect(25, ty - 14, 4, 1, RP.prata, (i) => 4.4 - i * 0.6); leaf(P, 30.5, ty - 10, 0.9, 4, 1.6, RP.prata, s + 3, 3.4);
  // a fruteira de prata com frutas-da-lua (azul-pálidas) e uma folha
  if (!k) {
    P.ell(55, ty - 2, 5, 2.4, (x, y, dx, dy) => { if (dy < -0.1) return; P.put(x, y, RP.prata, 3.8 - dx * 1.2); });
    for (const [x, y, r] of [[52.5, ty - 4.5, 2], [56, ty - 5, 2.2], [54.5, ty - 7.6, 1.8], [58.2, ty - 3.5, 1.4]]) P.ell(x, y, r, r, (xx, yy, dx, dy, d) => P.put(xx, yy, RP.petala, 3.8 - (dx + dy) * 1.1 - d * 0.6 + (dx < -0.3 && dy < -0.3 && d < 0.5 ? 1.2 : 0)));
    leaf(P, 51, ty - 8, -2.4, 5, 2, RP.folha, s + 4, 3);
  }
  seams(P);
  return P.done();
}

/* =============================== A CORTE DESTERRADA =============================== */
function brokenKing(k) {   // 64 x 80: o rei dos Salões em mármore profanado, quebrado na diagonal (do ombro esquerdo à cintura direita): sobram o plinto rachado, o ombro e o braço esquerdo, as mãos no pomo, a espada de ponta para baixo; a cabeça coroada caída no chão ao lado do plinto; veios de ouro velho, manchas de vinho, o espinheiro subindo (k 1: quebrado nos joelhos, só a barra da cota e a lâmina partida; a cabeça tombada do outro jeito)
  const W = 64, H = 80, P = painter(W, H), s = 25601 + k, R = RP.profano, oy = H - 104;
  const Q = kingStatue(0, R, true, RP.ouroV);
  const brk = x => k ? 74 + Math.round(Math.abs(Math.sin(x * 1.3 + 2)) * 4 + (x - 23) * 0.1) : 36 + Math.round((x - 23) * 0.55 + Math.abs(Math.sin(x * 1.7 + s)) * 3 + (x % 4 === 0 ? 1.5 : 0));
  const isSword = (x, y) => Math.abs(x + 0.5 - 23) < 2.5 && y > 46;
  for (let y = 0; y < 104; y++) for (let x = 0; x < 46; x++) {
    const kk = y * 46 + x; if (!Q.c[kk] || Q.rid[kk] < 0) continue;
    const b = k && isSword(x, y) ? 66 + (x % 2) : brk(x); if (y < b) continue;
    const RR = Q.ramps[Q.rid[kk]] === RP.prata ? R : Q.ramps[Q.rid[kk]]; P.z = Q.zb[kk]; P.put(x, y + oy, RR, Q.val[kk] + (RR !== Q.ramps[Q.rid[kk]] ? -0.2 : 0) + (y - b < 2 ? 1.1 + hash2(x, y, s) * 0.6 : 0));
  }
  P.z = 1;
  // a rachadura que desce o plinto e os veios de ouro que descem da quebra
  { let x = 30; for (let y = 90 + oy; y < H; y++) { x += (hash2(y, 0, s) - 0.5) * 1.6; P.put(x, y, RP.vinho, 1); P.put(x + 1, y, R, 3.9); } }
  for (let q = 0; q < 4; q++) { let x = 12 + q * 7, y = brk(12 + q * 7) + oy + 3; for (let j = 0; j < 22; j++) { x += (hash2(j, q, s) - 0.5) * 1.8; y += 1; if (P.is(x, y, R)) P.put(x, y, q % 2 ? RP.vinho : RP.ouroV, q % 2 ? 1.4 : 4); } }
  stain(P, RP.vinho, -0.08, s + 2, (x, y) => (y > H - 22 ? 0.25 : -0.1), 0.3, [R]);
  P.z = 8;
  // a cabeça coroada caída, de pé sobre o toco do pescoço, tombada
  const Hd = painter(18, 25); kingHead(Hd, 0.5, 0, R, s + 3, RP.ouroV, true);
  for (let x = 6; x < 12; x++) Hd.put(x, 23, R, 1.6 + hash2(x, 2, s) * 2), Hd.put(x, 24, R, 1.2);
  for (let y = 0; y < 25; y++) for (let x = 0; x < 18; x++) if (Hd.is(x, y, R) && (x < 5 || x > 12 || y > 19) && cn(x, y, 5, 5, s) > 0.72) Hd.put(x, y, RP.vinho, 1.4 + Hd.v(x, y) * 0.35);
  if (!k) blit(P, Hd, 45, H - 27, 0.32, 9, 12); else blit(P, Hd, 44, H - 25, -0.55, 9, 12);
  rubble(P, 40, 63, H - 1, 3, R, s + 4); rubble(P, 46, 60, H - 1, 2, RP.ouroV, s + 5);
  if (k) { rubble(P, 2, 44, 90 + oy - 1, 3, R, s + 6); }
  // o espinheiro subindo pelo plinto
  P.z = 9;
  for (let j = 0; j < 34; j++) { const y = H - 1 - j * 0.9, x = 2 + Math.sin(j * 0.45) * 2.2 + j * 0.12; P.put(x, y, RP.morta, 3); if (j % 3 === 0) P.put(x + (j % 2 ? 1 : -1), y - 1, RP.morta, 4.2); if (j % 5 === 2) { P.put(x + 1, y + 1, RP.carmesim, 4.6); P.put(x + 2, y + 1, RP.carmesim, 3); } }
  seams(P);
  chip(P, 0.18, s, [R]);
  return P.done();
}
function bloodAltar() {   // 36 x 44: o altar de mana sangrenta: base em degraus de mármore profanado, o corpo com runas carmesim acesas, o tampo de ouro velho, o pano carmesim com franja, três garras de ouro segurando no ar o cristal (o cristal gira ao vivo)
  const W = 36, H = 44, P = painter(W, H), s = 25621, R = RP.profano;
  P.rect(1, H - 4, 34, 4, R, (i, j, x, y) => 3.4 + (j === 0 ? 1 : 0) - j * 0.4 - i * 0.04 + cg(x, y, s) * 0.4);
  P.rect(3, H - 7, 30, 3, R, (i, j, x, y) => 3.6 + (j === 0 ? 0.9 : 0) - i * 0.04 + cg(x, y, s) * 0.4);
  ashlar(P, 6, 25, 24, 12, R, s, 4, 8, null, 2.4);
  for (let q = 0; q < 2; q++) runeN(P, 8 + q * 17, 29, q + 4, CR.carm, CR.claro);
  P.z = 1;
  // o tampo de ouro velho
  P.rect(3, 22, 30, 3, RP.ouroV, (i, j) => 4.2 - j * 1.1 - i * 0.05 + (i % 5 === 0 && j === 1 ? 0.8 : 0));
  // o pano carmesim caindo na frente, ponta em V, a franja de ouro, a fênix bordada
  for (let y = 24; y < 36; y++) for (let x = 12; x < 24; x++) { const dx = Math.abs(x + 0.5 - 18), bot = 34 - dx * 0.5; if (y > bot) continue; P.put(x, y, RP.carmesim, 2.8 - (x - 12) * 0.08 + Math.sin(x * 1.2) * 0.3 + cg(x, y, s) * 0.3); if (y > bot - 1) P.put(x, y + 1, RP.ouro, 4 - (x - 12) * 0.1); }
  for (const [x, y] of [[18, 26], [17, 27], [18, 27], [19, 27], [16, 28], [20, 28], [15, 27], [21, 27], [18, 28], [18, 29], [17, 30], [19, 30]]) P.put(x, y, RP.ouroV, 4.2 - (x - 15) * 0.15);
  P.z = 2;
  // as três garras de ouro: sobem do tampo e se curvam para o cristal
  tube(P, t => [18, 22 - t * 6], t => 3 - t, RP.ouroV, s + 3, 2.6);
  for (const sd of [-1, 1]) { tube(P, bez([18 + sd * 9, 22], [18 + sd * 14, 14], [18 + sd * 10, 4], [18 + sd * 4, 3]), t => 3 - t * 2.2, RP.ouroV, s + sd, sd < 0 ? 3.4 : 2.4); tube(P, bez([18 + sd * 5, 22], [18 + sd * 8, 18], [18 + sd * 7, 14], [18 + sd * 4, 14]), t => 2.2 - t * 1.4, RP.ouroV, s + 5 + sd, sd < 0 ? 3.2 : 2.2); }
  // lascas de cristal de mana no tampo
  for (const [x, h] of [[9, 3], [26, 4], [28, 2]]) for (let j = 0; j < h; j++) { P.put(x, 21 - j, RP.sangue, 4 - j * 0.3); P.put(x + 1, 21 - j, RP.sangue, 2.6); }
  P.N(9, 19, CR.claro); P.N(26, 18, CR.claro);
  P.mark('cristal', 18, 8);
  seams(P);
  grime(P, 0.7, 0.05, s + 1, (x, y) => (y > 36 ? 0.3 : 0), [R]);
  return P.done();
}
function magisterCage(k) {   // 26 x 56: a gaiola de magíster pendurada: a corrente de ouro velho, a cúpula com o florão, as barras em roda (as da frente claras, as de trás escuras), três aros, a base com a ponta (k 0: um orbe de mana carmesim preso dentro; k 1: a portinhola arrancada, o esqueleto de um elfo encolhido no fundo)
  const W = 26, H = 56, P = painter(W, H), s = 25641 + k, R = RP.ouroV, cx = 13;
  for (let y = 0; y < 12; y++) { const q = y % 4; P.put(cx - 1 + (q === 2 ? 1 : 0), y, R, q < 2 ? 4 - q : 3); if (q < 2) P.put(cx, y, R, 2.4); }
  const y0 = 18, y1 = 46, rx = 9.5;
  // as barras de trás, escuras
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, x = cx + Math.sin(a) * rx, front = Math.cos(a) > 0; if (front) continue; for (let y = y0; y < y1; y++) P.put(x, y, R, 1.4); }
  P.z = 1;
  if (!k) {
    P.ell(cx, 32, 4.2, 4.2, (x, y, dx, dy, d) => P.N(x, y, d < 0.2 ? CR.miolo : d < 0.5 ? CR.claro : d < 0.8 ? CR.carm : CR.fundo));
    P.mark('brilho', cx - 1, 31);
  } else {
    // o esqueleto encolhido: o crânio caído, as costelas, os ossos dos braços e das pernas
    P.ell(cx - 3, 40, 2.6, 2.4, (x, y, dx, dy) => P.put(x, y, RP.osso, 4 - dx - dy)); P.put(cx - 4, 40, RP.sombra, 1); P.put(cx - 2, 40, RP.sombra, 1);
    for (let r = 0; r < 3; r++) for (let x = 0; x < 5; x++) P.put(cx - 1 + x, 37 + r * 2, RP.osso, 3.6 - x * 0.3);
    P.line(cx + 1, 36, cx + 2, 44, RP.osso, 3.2); P.line(cx + 4, 43, cx - 2, 45, RP.osso, 3.4); P.line(cx + 5, 38, cx + 7, 44, RP.osso, 3);
  }
  P.z = 2;
  // as barras da frente e os aros
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, x = cx + Math.sin(a) * rx, c = Math.cos(a); if (c <= 0) continue; if (k && i === 1) continue; for (let y = y0; y < y1; y++) P.put(x, y, R, 2.6 + c * 1.2 - Math.sin(a) * 0.8); }
  for (const y of [y0, 32, y1 - 1]) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const u = (x - cx) / rx; P.put(x, y, R, 3.8 - u * 1.4); P.put(x, y + 1, R, 2.2 - u * 0.8); }
  if (k) { for (let j = 0; j < 12; j++) P.put(cx + rx + 2 + j * 0.3, y0 + 6 + j, R, 2.8); for (let j = 0; j < 12; j++) P.put(cx + rx + 5 + j * 0.3, y0 + 5 + j, R, 2.2); }
  // a cúpula com o florão e a base com a ponta
  P.ell(cx, y0, rx + 0.5, 6, (x, y, dx, dy, d) => { if (dy > 0) return; P.put(x, y, R, 3.4 - dx * 1.3 - dy * 0.6 + (Math.abs(((dx + 1) * 4) % 1 - 0.5) < 0.12 ? -0.8 : 0)); });
  P.blob(cx, y0 - 7, 1.8, 1.8, R, s, 3.4);
  P.rect(cx - rx, y1, Math.ceil(rx * 2) + 1, 3, R, (i, j) => 3.8 - j * 1 - i * 0.08);
  for (let j = 0; j < 6; j++) { const hw = 3 - j * 0.5; for (let x = Math.floor(cx - hw); x < cx + hw; x++) P.put(x, y1 + 3 + j, R, 3.4 - (x - cx) * 0.4); }
  P.put(cx - 1, y0 - 3, RP.sangue, 4.4); P.N(cx, y0 - 3, CR.claro);
  seams(P);
  grime(P, 0.6, 0.0, s + 2, null, [R]);
  return P.done();
}
function tornTapestry(k) {   // 34 x 58: a tapeçaria rasgada carmesim e ouro: a vara de ouro velho com uma ponta quebrada, o pano carmesim com a barra de ouro, a fênix bordada de asas abertas, rasgos, a barra de baixo em farrapos, queimado nas beiras (k 1: a vara caída de um lado, o pano pendurado torto, rasgado ao meio)
  const W = 34, H = 58, P = painter(W, H), s = 25661 + k, x0 = 3, x1 = 31;
  const sl = k ? 0.32 : 0;
  const bot = x => 40 + Math.round(cn(x, 0, 3, 3, s) * 12 + hash2(x, 1, s) * 4) + Math.round((x - x0) * sl);
  const hole = (x, y) => cn(x, y, 7, 9, s + 2) + (k && Math.abs(x - 19 + (y - 20) * 0.15) < 1.6 && y > 18 ? 1 : 0) > 0.86;
  for (let x = x0; x < x1; x++) for (let y = 3 + Math.round((x - x0) * sl); y < bot(x); y++) {
    if (hole(x, y)) continue;
    const yy = y - Math.round((x - x0) * sl), fold = Math.sin((x - x0) * 0.75) * 0.5, border = x < x0 + 2 || x > x1 - 3 || yy < 5 || (yy > 34 && yy < 37);
    let v = (border ? 3.2 : 2.4) + fold - (x - x0) * 0.03 + cg(x, y, s) * 0.35 + ((x + yy) % 4 === 0 && !border ? -0.3 : 0);
    const nearHole = hole(x + 1, y) || hole(x - 1, y) || hole(x, y + 1) || hole(x, y - 1) || y > bot(x) - 3;
    if (nearHole) v -= 1.3;
    P.put(x, y, border ? RP.ouroV : RP.carmesim, v);
  }
  // a fênix de ouro: o corpo, as asas abertas em penas, a cauda, a cabeça erguida
  const fx = 17, fy = 20 + (k ? 5 : 0);
  const PHX = ['.......x.......', '......xxx......', 'x.....xx......x', 'xx....xx.....xx', '.xx...xxx...xx.', '.xxx.xxxxx.xxx.', '..xxxxxxxxxxx..', '...xxxxxxxxx...', '.....xxxxx.....', '......xxx......', '.....x.x.x.....', '....x..x..x....', '...x...x...x...', '..x....x....x..'];
  for (let j = 0; j < PHX.length; j++) for (let i = 0; i < 15; i++) {
    if (PHX[j][i] !== 'x') continue; const x = fx - 7 + i, y = fy - 7 + j + Math.round((x - x0) * sl); if (!P.has(x, y)) continue;
    const up = j > 0 && PHX[j - 1][i] === 'x', lf = i > 0 && PHX[j][i - 1] === 'x';
    P.put(x, y, RP.ouro, 3.3 + (up ? 0 : 0.9) + (lf ? 0 : 0.5) - i * 0.06 - j * 0.03 + ((i + j) % 3 === 0 ? -0.5 : 0));
  }
  // a vara
  if (!k) { for (let x = 0; x < 26; x++) { P.put(x, 1, RP.ouroV, 4.2 - x * 0.04); P.put(x, 2, RP.ouroV, 2.4); } P.blob(1.5, 1.5, 1.8, 1.8, RP.ouroV, s, 3.2); for (let x = 26; x < 29; x++) P.put(x, 2 + (x - 26), RP.ouroV, 2.6); }
  else for (let x = 0; x < W; x++) { const y = 1 + Math.round(x * sl); P.put(x, y, RP.ouroV, 4.2 - x * 0.04); P.put(x, y + 1, RP.ouroV, 2.4); }
  // os fios soltos embaixo
  for (let x = x0 + 1; x < x1 - 1; x += 3) { const b = bot(x); if (!P.has(x, b - 1)) continue; for (let j = 0; j < 3 + (x % 4); j++) P.put(x + (j > 2 ? 1 : 0), b + j, j % 2 ? RP.ouroV : RP.carmesim, 2.4); }
  return P.done();
}
function deadTree(k) {   // 46 x 60 (k 1: 38 x 46): a árvore morta pequena: o tronco preto retorcido saindo das raízes, galhos em garra afinando em ponta, a seiva carmesim acesa nas rachaduras, espinhos, um oco escuro (k 1: menor, o tronco partido no alto)
  const W = k ? 38 : 46, H = k ? 46 : 60, P = painter(W, H), s = 25681 + k, R = RP.morta, cx = W / 2;
  const br = (x, y, ang, len, wd, depth, sd) => {
    const bend = (hash2(depth, Math.round(x * 7), sd) - 0.5) * 1.1, ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, mx = (x + ex) / 2 + Math.cos(ang + Math.PI / 2) * bend * len * 0.3, my = (y + ey) / 2 + Math.sin(ang + Math.PI / 2) * bend * len * 0.3;
    const end = depth <= 0 ? 0.15 : 0.6;
    bark(P, bez([x, y], [mx, my], [mx, my], [ex, ey]), t => Math.max(0.9, wd * (1 - t * (1 - end))), R, sd, { base: 2.5, sulcos: wd > 3 ? 2 : 0, seiva: wd > 3 ? 0.22 : 0, cor: CR.fundo, cor2: CR.carm });
    for (let i = 1; i < 4; i++) { if (hash2(i, depth, sd) < 0.5) continue; const t = i / 4, px = x + (ex - x) * t, py = y + (ey - y) * t, sg = i % 2 ? 1 : -1; P.put(px + Math.cos(ang + sg * 1.3) * (wd * 0.5 + 1), py + Math.sin(ang + sg * 1.3) * (wd * 0.5 + 1), R, 3.4); }
    if (depth <= 0) return;
    const n = 2;
    for (let i = 0; i < n; i++) br(ex, ey, ang + (i - 0.5) * (0.8 + hash2(i, depth, sd) * 0.35) + (hash2(i, depth + 3, sd) - 0.5) * 0.35, len * (0.66 + hash2(i, depth + 7, sd) * 0.12), Math.max(1, wd * end * 0.95), depth - 1, sd + i * 13 + depth);
  };
  for (const [a, l] of [[2.9, 12], [0.25, 12], [2.4, 7], [0.7, 8]]) bark(P, bez([cx, H - 5], [cx + Math.cos(a) * l * 0.4, H - 3], [cx + Math.cos(a) * l * 0.8, H - 1.5], [cx + Math.cos(a) * l, H - 1]), t => 4.4 - t * 3.4, R, s + Math.round(a * 10), { base: 2.3 });
  const top = k ? 18 : 26, trunk = bez([cx, H - 2], [cx - 4, H - 14], [cx + 5, top + 10], [cx - 1, top]);
  bark(P, trunk, t => 8.5 - t * 4, R, s, { base: 2.5, sulcos: 3, seiva: 0.3, cor: CR.fundo, cor2: CR.carm });
  if (!k) { br(cx - 1, top + 1, -Math.PI / 2 - 0.55, 12, 4.4, 2, s + 1); br(cx, top + 1, -Math.PI / 2 + 0.6, 12, 4, 2, s + 2); br(cx + 2, top + 13, -0.3, 9, 2.8, 1, s + 3); br(cx - 2, top + 18, Math.PI + 0.35, 7, 2.2, 1, s + 4); }
  else { br(cx - 1, top + 2, -Math.PI / 2 - 0.9, 10, 3.4, 1, s + 1); br(cx + 1, top + 8, -0.4, 9, 2.8, 1, s + 2); for (let x = -3; x <= 3; x++) P.put(cx - 1 + x, top - 1 - Math.abs(Math.sin(x * 2.1)) * 3, R, 3.2); }
  P.ell(cx + 1, H - 15, 1.8, 2.6, (x, y, dx, dy, d) => P.put(x, y, RP.sombra, d > 0.6 ? 3 : 1));
  for (let x = 2; x < W - 2; x++) if (hash2(x, 9, s) < 0.6) P.put(x, H - 1, RP.morta, 1.6 + hash2(x, 8, s));
  return P.done();
}
function alchemyTable(k) {   // 56 x 32: a mesa de alquimia derrubada: o tampo de cabeça para baixo no chão, as quatro pernas para o ar (uma partida), frascos quebrados, o alambique de cobre caído, a poça de mana carmesim acesa, pergaminhos (k 1: em pé mas com uma perna quebrada, o tampo inclinado, tudo escorregando)
  const W = 56, H = 32, P = painter(W, H), s = 25701 + k, R = RP.couro;
  const flask = (x, by, r, tall, lv) => {   // um frasco redondo de vidro com o líquido carmesim (lv: até onde vai o líquido, de 0 a 1)
    P.ell(x, by - r, r, r, (xx, yy, dx, dy, d) => { const liq = (dy + 1) / 2 > 1 - lv; if (liq) P.put(xx, yy, RP.sangue, 3.4 - dx * 1.2 - dy * 0.3); else P.put(xx, yy, RP.vidro, 2.2 - dx * 0.9); if (dx < -0.3 && dx > -0.7 && dy < 0 && dy > -0.7) P.tint(xx, yy, '#e8f0ff', 0.55); });
    for (let j = 0; j < tall; j++) { P.put(x - 1, by - 2 * r - j, RP.vidro, 3.6); P.put(x, by - 2 * r - j, RP.vidro, 2.4); }
    P.put(x - 1, by - 2 * r - tall, RP.couro, 3.4); P.put(x, by - 2 * r - tall, RP.couro, 2.4);
  };
  if (!k) {
    // as pernas para o ar (atrás do tampo), torneadas, uma partida; a travessa
    for (const [x, l, lean] of [[6, 16, -0.12], [12, 17, 0.05], [33, 9, 0.1], [39, 16, 0.18]]) bark(P, t => [x + t * l * lean, H - 6 - t * l], t => 2.6 + Math.sin(t * Math.PI * 3) * 0.5, R, s + x, { base: x > 30 ? 2.2 : 2.7 });
    for (let x = 34; x < 37; x++) P.put(x, H - 16, R, 1.4 + hash2(x, 1, s) * 2.4);
    for (let x = 7; x < 40; x++) { P.put(x, H - 13, R, 2.9 - x * 0.02); P.put(x, H - 12, R, 1.6); }
    P.z = 1;
    // o tampo virado: a tábua grossa no chão, a quina aparecendo, inclinado numa pedra
    for (let x = 2; x < 44; x++) { const y0 = H - 6 + Math.round((x - 2) * 0.03); for (let y = y0; y < y0 + 4; y++) P.put(x, y, R, 3.4 + (y === y0 ? 0.9 : y === y0 + 3 ? -1.1 : 0) + ((x + 2) % 9 === 0 ? -1.1 : 0) - x * 0.02 + cg(x, y, s) * 0.4); }
    for (let x = 4; x < 42; x += 9) P.put(x, H - 4, RP.ouroV, 4);
    P.z = 2;
    // a poça de mana derramada, acesa
    for (let x = 40; x < 55; x++) { const t = (x - 40) / 15, hgt = Math.round(Math.sin(t * Math.PI) * 1.4); for (let j = 0; j <= hgt; j++) P.N(x, H - 1 - j, j === hgt ? (x % 4 ? CR.claro : CR.miolo) : CR.carm); }
    flask(48, H - 2, 3, 3, 0.35);
    { const Q = painter(14, 10); Q.ell(4, 5, 3.4, 3.4, (xx, yy, dx, dy) => Q.put(xx, yy, RP.vidro, 2.4 - dx - dy * 0.5)); for (let j = 0; j < 5; j++) { Q.put(8 + j, 4, RP.vidro, 3.6); Q.put(8 + j, 5, RP.vidro, 2.4); } blit(P, Q, 17, H - 15, 0.1, 0, 0); }
    for (const [x, y] of [[45, H - 3], [53, H - 2], [30, H - 7], [26, H - 7]]) { P.put(x, y, RP.vidro, 4.4); P.put(x + 1, y, RP.vidro, 2.6); }
    // o alambique de cobre caído em cima, o bico para fora
    P.ell(30, H - 10, 4.4, 3.8, (x, y, dx, dy, d) => P.put(x, y, RP.cobre, 3.4 - (dx + dy) * 1.1 - d * 0.4 + cg(x, y, s) * 0.3));
    tube(P, bez([33, H - 13], [37, H - 16], [41, H - 16], [44, H - 13]), () => 1.6, RP.cobre, s + 4, 3);
    P.rect(4, H - 8, 9, 2, RP.papel, (i, j) => 3.8 - j * 0.8 - i * 0.05); P.ell(13, H - 7, 1.6, 1.6, (x, y, dx, dy, d) => P.put(x, y, RP.papel, d < 0.3 ? 1.4 : 3.4));
    P.mark('brilho', 47, H - 2);
  } else {
    const tilt = x => 12 + (x - 4) * 0.16;
    bark(P, t => [8, tilt(8) + 3 + t * (H - tilt(8) - 4)], () => 2.6, R, s + 1, { base: 2.8 });
    bark(P, t => [46, tilt(46) + 3 + t * 6], () => 2.6, R, s + 2, { base: 2.4 }); for (let x = 45; x < 48; x++) P.put(x, tilt(46) + 10, R, 1.4 + hash2(x, 3, s) * 2);
    P.z = 1;
    for (let x = 4; x < 52; x++) for (let j = 0; j < 3; j++) P.put(x, tilt(x) + j, R, 3.4 + (j === 0 ? 0.8 : j === 2 ? -1 : 0) - (x - 4) * 0.01 + cg(x, j, s) * 0.4);
    bark(P, t => [36 + t * 12, H - 2 - t * 0.5], () => 2.4, R, s + 3, { base: 2.2 });
    flask(14, tilt(14), 3, 4, 0.55); flask(24, tilt(24), 2.6, 6, 0.7); flask(33, tilt(33) - 0.5, 2.4, 2, 0.3);
    for (let x = 30; x < 48; x++) if (x < 40 || hash2(x, 5, s) < 0.5) P.N(x, Math.round(tilt(x)) - 1, x % 3 ? CR.carm : CR.claro);
    for (let j = 0; j < 7; j++) if (j % 2 === 0) P.N(51, tilt(51) + 4 + j * 1.8, CR.carm);
    for (let x = 47; x < 55; x++) P.N(x, H - 1, x % 3 ? CR.carm : CR.claro);
    P.ell(41, tilt(41) - 3, 3.4, 3, (x, y, dx, dy, d) => P.put(x, y, RP.cobre, 3.4 - (dx + dy) * 1.1 - d * 0.4));
    tube(P, bez([43, tilt(41) - 5], [46, tilt(41) - 9], [49, tilt(41) - 9], [51, tilt(41) - 6]), () => 1.4, RP.cobre, s + 4, 3);
    P.mark('brilho', 50, H - 2);
  }
  seams(P);
  return P.done();
}
function felBrazier(k) {   // 26 x 34 (k 1: 22 x 44): o braseiro vil: a bacia de ouro velho com a faixa lavrada, as brasas carmesim, três pernas em garra (k 1: no alto de um pilar de mármore profanado); o fogo carmesim é ao vivo
  const W = k ? 22 : 26, H = k ? 44 : 34, P = painter(W, H), s = 25721 + k, R = RP.ouroV, cx = W / 2, by = k ? 10 : 13;
  if (!k) {
    for (const [x0, x1] of [[cx - 4, cx - 10], [cx + 4, cx + 10], [cx, cx]]) tube(P, bez([x0, by + 6], [x0 + (x1 - x0) * 0.2, by + 12], [x1, H - 8], [x1, H - 2]), () => (x0 === cx ? 1.8 : 2.2), R, s + x0, x0 === cx ? 2.2 : 3);
    for (const x of [cx - 10, cx + 10, cx]) P.rect(x - 1.5, H - 2, 4, 2, R, (i, j) => 3.4 - i * 0.5 - j);
  } else {
    ashlar(P, cx - 6, by + 8, 12, H - by - 11, RP.profano, s, 5, 6, null, 2.5);
    P.rect(cx - 8, H - 3, 16, 3, RP.profano, (i, j) => 3.6 - j - i * 0.05); P.rect(cx - 7, by + 6, 14, 2, RP.profano, (i, j) => 4 - j * 1.2 - i * 0.05);
    for (let y = by + 10; y < H - 4; y += 6) runeN(P, cx - 1.5, y, y, CR.fundo, CR.carm);
  }
  // as brasas
  for (let x = Math.floor(cx - 8); x < cx + 8; x++) { const t = (x - cx + 8) / 16, h = Math.round(1 + Math.sin(t * Math.PI) * 1.5 + hash2(x, 0, s)); for (let j = 0; j < h; j++) { const v = hash2(x, j, s); if (v < 0.3) P.N(x, by - j, v < 0.12 ? CR.claro : CR.carm); else P.put(x, by - j, RP.morta, 2.4 + v * 1.5); } }
  // a bacia: meia elipse, a borda acesa, a faixa lavrada com losangos
  P.ell(cx, by, 9.5, 6.5, (x, y, dx, dy, d) => { if (dy < 0) return; P.put(x, y, R, 3.4 - dx * 1.3 - dy * 0.8 + (Math.abs(dy - 0.4) < 0.1 ? 0.9 : 0) + ((x + y) % 4 === 0 && Math.abs(dy - 0.55) < 0.2 ? -1 : 0) + cg(x, y, s) * 0.3); });
  for (let x = Math.floor(cx - 10); x < cx + 10; x++) { const u = (x + 0.5 - cx) / 10; P.put(x, by, R, 4.4 - u * 1.2); }
  P.put(cx - 10, by - 1, R, 4); P.put(cx + 9, by - 1, R, 3);
  P.mark('fogo', cx - 7, by - 1, { w: 14 });
  seams(P);
  return P.done();
}

/* =============================== O POÇO DA LUA =============================== */
function moonWell() {   // 58 x 30: o poço da lua: a mureta redonda de pedra-do-poço (vista de lado), a beira de mármore com crescentes de prata, runas azuis acesas fracas, a água acesa aparecendo por cima da beira, dois pilaretes com crescentes; musgo e cogumelos-de-luar no pé
  const W = 58, H = 30, P = painter(W, H), s = 25801, R = RP.poco, cx = 29;
  // a beira de trás do poço e a água: a lâmina clara de cima com reflexos acesos, o fundo azul
  for (let x = 6; x < 52; x++) P.put(x, 9, R, 3.3 - (x - 6) * 0.02);
  for (let x = 6; x < 52; x++) { const u = (x + 0.5 - cx) / 23; P.put(x, 10, RP.agua, 4.8 - Math.abs(u) * 0.8); P.put(x, 11, RP.agua, 3.6 - u * 0.6); P.put(x, 12, RP.agua, 2.3 - u * 0.5); if (hash2(x, 1, s) < 0.35) P.N(x, 10, hash2(x, 2, s) < 0.3 ? MO.miolo : MO.palido); else if (hash2(x, 3, s) < 0.25) P.N(x, 11, MO.lua); }
  P.z = 1;
  ashlar(P, 4, 14, 50, 16, R, s, 4, 9, null, 2.4);
  for (let y = 14; y < H; y++) for (let x = 4; x < 54; x++) { const u = (x + 0.5 - cx) / 25; if (P.is(x, y, R)) P.put(x, y, R, P.v(x, y) - u * 1.1 - u * u * 0.6); }
  for (let x = 3; x < 55; x++) { const u = (x + 0.5 - cx) / 26; P.put(x, 13, RP.marmore, 3.6 - u * 1.2); P.put(x, 14, RP.marmore, 2.4 - u * 1); }
  for (let x = 8; x < 52; x += 11) P.ell(x, 13.5, 1.6, 0.9, (xx, yy, dx) => { if (dx < 0.4) P.put(xx, yy, RP.prata, 4.6); });
  for (let q = 0; q < 4; q++) { const X = 11 + q * 11; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (eOn(q + 1, i, j)) { P.put(X + i, 19 + j, R, 0.8); if ((i + j + q) % 3) P.N(X + i, 19 + j, j === 2 ? MO.funda : MO.escura); } }
  for (const x0 of [0, 54]) { ashlar(P, x0, 5, 4, 25, R, s + x0, 5, 4, null, 2.7 - (x0 ? 0.5 : 0)); P.rect(x0, 3, 4, 2, RP.marmore, (i, j) => 4 - i * 0.4 - j); P.ell(x0 + 2, 1.5, 1.8, 1.8, (x, y, dx, dy) => { if (Math.hypot(dx - 0.5, dy + 0.2) > 0.8) P.put(x, y, RP.prata, 4.6 - dy); }); P.N(x0 + 1, 1, MO.palido); P.mark('brilho', x0 + 1, 1); }
  P.mark('agua', 7, 10, { w: 44 }); P.mark('mote', 8, 10, { w: 42 });
  moss(P, 0.12, s + 2, (x, y) => (y > H - 6 ? 0.45 : y < 15 ? 0.25 : -0.2), [R, RP.marmore]);
  for (const x of [7, 49]) { P.put(x, H - 2, RP.cera, 3.6); P.put(x, H - 1, RP.cera, 3); P.N(x - 1, H - 3, MO.funda); P.N(x, H - 3, MO.lua); P.put(x + 1, H - 3, RP.cristal, 2.6); }
  return P.done();
}
function ladyStatue(k) {   // 42 x 92: a estátua da Dama: alta, de túnica longa até o plinto redondo, o cabelo comprido, o diadema, as mangas largas caindo; coberta de musgo e hera (k 0: as mãos no peito segurando o espelhinho redondo, que brilha; k 1: a cabeça baixa, as mãos estendidas com a tigela d'água acesa)
  const W = 42, H = 92, P = painter(W, H), s = 25821 + k, R = RP.marmore, cx = 21, py = 82;
  // o plinto redondo, em dois degraus
  for (let y = py; y < H; y++) { const hw = y < py + 3 ? 14 : 17; for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw; P.put(x, y, RP.poco, 3.2 - u * 1.3 - u * u * 0.5 + (y === py || y === py + 3 ? 1.1 : 0) - (y - py) * 0.05 + cg(x, y, s) * 0.4); } }
  P.z = 1;
  // a túnica: abre embaixo e arrasta no plinto; dobras fundas
  for (let y = 30; y < py; y++) { const t = (y - 30) / (py - 30), hw = 6.5 + t * t * 7 + (y > py - 3 ? 1.5 : 0); for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw, fold = Math.sin(u * (5 + t * 4) + t * 2) * (0.3 + t * 0.5); P.put(x, y, R, 3.2 - u * 1.3 - u * u * 0.4 + fold + cg(x, y, s) * 0.3); } }
  // o cabelo comprido atrás dos ombros até a cintura
  P.z = 2;
  const hy = k ? 16 : 13, hx = cx + (k ? 1 : 0);
  for (let y = hy; y < 50; y++) for (const sd of [-1, 1]) { const w = 2.6 + (y - hy) * 0.03; for (let i = 0; i < w; i++) { const x = Math.floor(hx + sd * (4.2 + i + (y - hy) * 0.04)) - (sd > 0 ? 1 : 0); P.put(x, y, R, (sd < 0 ? 3.4 : 2) - i * 0.25 + ((y + i * 2) % 4 === 0 ? -0.7 : 0)); } }
  // o corpo de cima e os ombros
  for (let y = hy + 12; y < 34; y++) { const hw = y < hy + 15 ? 4 + (y - hy - 12) * 1.6 : 8.4 - (y - hy - 15) * 0.15; for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw; P.put(x, y, R, 3.5 - u * 1.3 - u * u * 0.4 + cg(x, y, s) * 0.3); } }
  for (let x = cx - 6; x < cx + 7; x++) P.put(x, 34, R, 2.2);   // o cinto fino
  P.z = 3;
  // a cabeça: o rosto oval, o diadema com a pedra
  P.ell(hx, hy + 6, 3.8, 5.4, (x, y, dx, dy, d) => P.put(x, y, R, 3.9 - dx * 1.3 - dy * 0.4 - d * 0.5 + cg(x, y, s) * 0.2));
  const fx = Math.floor(hx);
  P.put(fx - 2, hy + 6, R, 1.6); P.put(fx + 1, hy + 6, R, 1.8); for (let y = hy + 6; y < hy + 9; y++) P.put(fx, y, R, 4.4); P.put(fx, hy + 10, R, 2);
  P.ell(hx, hy + 2.4, 4.4, 3.4, (x, y, dx, dy) => { if (dy > 0.3) return; P.put(x, y, R, 3.6 - dx * 1.3 - dy); });
  for (let x = fx - 4; x <= fx + 4; x++) P.put(x, hy + 3, RP.prata, 4.4 - (x - fx + 4) * 0.25);
  P.N(fx, hy + 2, MO.lua);
  P.z = 4;
  if (!k) {
    // as mangas largas, as mãos no peito segurando o espelhinho
    for (const sd of [-1, 1]) tube(P, bez([cx + sd * 7, hy + 15], [cx + sd * 9, hy + 22], [cx + sd * 6, hy + 26], [cx + sd * 2, hy + 24]), t => 3.6 + t * 1.6, R, s + sd, sd < 0 ? 3.3 : 2.4);
    for (const sd of [-1, 1]) for (let j = 0; j < 14; j++) { const x = cx + sd * (5 + j * 0.15), y = hy + 25 + j; for (let i = 0; i < 3 - (j > 10 ? 1 : 0); i++) P.put(x + sd * i, y, R, (sd < 0 ? 3 : 2) - i * 0.4 - j * 0.04); }
    P.ell(cx, hy + 21, 3, 3.6, (x, y, dx, dy, d) => { if (d > 0.62) P.put(x, y, RP.prata, 4 - (dx + dy)); else if (dx + dy < -0.5) P.N(x, y, MO.palido); else P.put(x, y, RP.cristal, 4 - d * 2 - dx); });
    P.blob(cx - 2.6, hy + 23.5, 1.8, 1.6, R, s + 5, 3.6); P.blob(cx + 2.4, hy + 23.5, 1.8, 1.6, R, s + 6, 2.8);
    P.mark('brilho', cx - 1, hy + 20);
  } else {
    // as mãos estendidas para a frente (vistas de frente: os antebraços curtos) com a tigela de pedra-do-poço e a água acesa
    for (const sd of [-1, 1]) tube(P, bez([cx + sd * 7, hy + 14], [cx + sd * 10, hy + 22], [cx + sd * 8, hy + 28], [cx + sd * 5, hy + 30]), t => 3.8 + t * 1.6, R, s + sd, sd < 0 ? 3.3 : 2.4);
    for (const sd of [-1, 1]) for (let j = 0; j < 12; j++) { const x = cx + sd * (8 + j * 0.2), y = hy + 28 + j; for (let i = 0; i < 3; i++) P.put(x + sd * i, y, R, (sd < 0 ? 3 : 2) - i * 0.4 - j * 0.05); }
    P.ell(cx, hy + 31, 7, 3.4, (x, y, dx, dy) => { if (dy < -0.15) return; P.put(x, y, RP.poco, 3.6 - dx * 1.3 - dy * 0.6); });
    for (let x = cx - 6; x < cx + 6; x++) { P.N(x, hy + 30, x % 3 ? MO.lua : MO.palido); P.put(x, hy + 31, RP.poco, 4.2 - (x - cx + 6) * 0.15); }
    P.blob(cx - 5.5, hy + 31.5, 1.8, 1.6, R, s + 5, 3.4); P.blob(cx + 5.5, hy + 31.5, 1.8, 1.6, R, s + 6, 2.6);
    P.mark('mote', cx - 5, hy + 30, { w: 10, n: 3 });
  }
  seams(P);
  // o musgo pesado: nos ombros, na cabeça, nas dobras e no plinto; a hera subindo
  moss(P, 0.22, s + 7, (x, y) => (y > py - 4 ? 0.35 : y < hy + 6 ? 0.3 : 0) + (x > cx + 4 ? 0.1 : 0), [R, RP.poco]);
  for (let j = 0; j < 40; j++) { const y = py - 1 - j, x = cx + 9 - j * 0.12 + Math.sin(j * 0.4) * 1.6; if (!P.has(x, y)) continue; P.put(x, y, RP.musgo, 2.4); if (j % 4 === 0) leaf(P, x + (j % 8 ? 1.5 : -1.5), y, j % 8 ? -0.3 : -2.8, 3.5, 1.8, RP.folha, s + j, 3); }
  chip(P, 0.08, s, [R]);
  return P.done();
}
function rootArch() {   // 62 x 60: o arco de raízes: duas raízes grossas da Árvore-Mãe saindo do chão e se cruzando no alto, a seiva azul acesa nos sulcos, raízes finas acompanhando, raizinhas penduradas do arco, cogumelos-de-luar no pé
  const W = 62, H = 60, P = painter(W, H), s = 25841, R = RP.raiz;
  // as raizinhas penduradas do alto do arco (atrás)
  for (let i = 0; i < 9; i++) { const x0 = 16 + i * 3.6 + hash2(i, 0, s) * 2, y0 = 8 + Math.abs(x0 - 31) * 0.22, l = 6 + hash2(i, 1, s) * 14; for (let j = 0; j < l; j++) P.put(x0 + Math.sin(j * 0.35 + i) * 0.9, y0 + j, R, 2.2 - j * 0.04); }
  P.z = 1;
  // as raízes finas que acompanham
  bark(P, bez([4, 59], [1, 26], [18, 6], [40, 7]), t => 3 - t * 1.4, R, s, { base: 2, sulcos: 2 });
  bark(P, bez([58, 59], [61, 28], [46, 7], [24, 10]), t => 2.8 - t * 1.4, R, s + 1, { base: 1.8, sulcos: 2 });
  P.z = 2;
  // as duas raízes grossas, cruzando no alto
  bark(P, bez([12, 60], [6, 20], [28, 1], [52, 16]), t => 9.5 - t * 6, R, s + 2, { base: 2.6, sulcos: 4, seiva: 0.2 });
  P.z = 3;
  bark(P, bez([50, 60], [57, 22], [34, 1], [10, 17]), t => 9 - t * 5.6, R, s + 3, { base: 2.6, sulcos: 4, seiva: 0.2 });
  // as pontas que caem depois de cruzar
  P.z = 4;
  for (const [x, d] of [[52, 1], [10, -1]]) bark(P, bez([x, 16], [x + d * 2, 20], [x + d * 2, 26], [x + d * 1, 32]), t => 3.6 - t * 2.8, R, s + x, { base: 2.3, sulcos: 2 });
  // o pé: a terra e as pedrinhas, cogumelos-de-luar
  for (let x = 2; x < 60; x++) if (hash2(x, 3, s) < 0.7) P.put(x, H - 1, RP.poco, 1.6 + hash2(x, 4, s) * 1.4);
  for (const [x, y] of [[20, H - 2], [24, H - 2], [42, H - 2], [6, 42], [56, 44]]) { P.put(x, y, RP.cera, 3.4); P.put(x, y - 1, RP.cera, 3.8); P.N(x - 1, y - 2, MO.lua); P.N(x, y - 2, MO.palido); P.N(x + 1, y - 2, MO.funda); P.mark('brilho', x, y - 2); }
  moss(P, 0.0, s + 5, (x, y) => (y > H - 12 ? 0.3 : -0.15), [R]);
  return P.done();
}
function moonCrystal(k) {   // 38 x 48 (k 1: 34 x 36): o cristal lunar grande: prismas branco-azulados saindo da pedra-do-poço, os de trás mais escuros, uma face clara e uma escura, a aresta acesa, o miolo leitoso (k 1: três pontas baixas e tortas)
  const W = k ? 34 : 38, H = k ? 36 : 48, P = painter(W, H), s = 25861 + k, R = RP.cristal;
  const spikes = k ? [[16, 28, 0.08, 5.2, 0], [24, 18, -0.75, 4, -0.3], [8, 20, 0.7, 4.2, 0]] : [[21, 42, 0.03, 6.2, -0.4], [26, 22, -0.4, 3, -0.6], [30, 24, -0.8, 4, 0], [8, 20, 0.95, 3.4, 0], [13, 27, 0.45, 4.4, 0.2]];
  spikes.forEach(([bx, len, ang, wd, dv], zi) => {
    P.z = zi + 1;
    const ca = Math.cos(ang), sa = Math.sin(ang), by = H - 3;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - bx, dy = y + 0.5 - by, t = dx * sa - dy * ca, o = dx * ca + dy * sa;
      if (t < -2 || t > len) continue;
      const hw = t < len * 0.72 ? wd : wd * (len - t) / (len * 0.28); if (Math.abs(o) > hw) continue;
      const ridge = Math.abs(o + hw * 0.15) < 0.55;
      if (ridge && t > 1) { if (t > len * 0.45) P.N(x, y, t > len - 3 ? MO.miolo : MO.palido); else P.put(x, y, R, 5); continue; }
      P.put(x, y, R, dv + (o < 0 ? 3.7 + (o < -hw + 1 ? 0.8 : 0) - t / len * 0.3 + Math.sin(t * 0.8) * 0.2 : 1.9 - (o > hw - 1 ? 0.7 : 0) + t / len * 0.5) + cg(x, y, s) * 0.2);
      if (Math.abs(o) < hw * 0.4 && Math.abs(o + hw * 0.15) > 0.6 && hash2(x, y, s) < 0.035) P.N(x, y, MO.lua);
    }
    P.mark('brilho', Math.round(bx + sa * len * 0.9), Math.round(by - ca * len * 0.9));
  });
  seams(P, 1.3);
  P.z = 9; rubble(P, 0, W - 1, H - 1, 5, RP.poco, s + 3);
  moss(P, 0.0, s + 4, (x, y) => (y > H - 4 ? 0.3 : -0.4), [RP.poco]);
  return P.done();
}
function floatLantern(k) {   // 20 x 46: a lanterna flutuante: o nó de raiz no teto com raizinhas e folhinhas (a gota de vidro acesa flutua embaixo, ao vivo, subindo e descendo)
  const W = 20, H = 46, P = painter(W, H), s = 25881 + k, R = RP.raiz;
  P.ell(10, 0.5, 7.5, 4, (x, y, dx, dy, d) => P.put(x, y, R, 2.6 - dx * 1.1 - dy * 0.6 + cg(x, y, s) * 0.4));
  const rl = k ? [[6, 9], [10, 13], [14, 7], [12, 5]] : [[5, 7], [9, 11], [13, 14], [15, 6]];
  for (const [x0, l] of rl) bark(P, t => [x0 + Math.sin(t * 3 + x0) * 1.2, 3 + t * l], t => 2 - t * 1.4, R, s + x0, { base: 2.4 });
  for (const [x, y, a] of [[4, 4, 2.6], [16, 4, 0.5], [9, 9, 1.9]]) leaf(P, x, y, a, 4, 1.8, RP.folha, s + x, 2.8);
  P.N(10, 13, MO.funda); P.N(13, 14, MO.lua);
  P.mark('flut', 10, 30, { a: 3 });
  return P.done();
}
function motherRoot(k) {   // 88 x 36 (k 1: 66 x 56): a raiz-mãe grossa atravessando a parede: sai de um buraco na pedra, engorda, e entra em outro, a casca prateada em sulcos com a seiva azul acesa, raizinhas (k 1: desce na diagonal do alto e mergulha embaixo)
  const W = k ? 66 : 88, H = k ? 56 : 36, P = painter(W, H), s = 25901 + k, R = RP.raiz;
  const holeAt = (cx, cy, rx, ry) => P.ell(cx, cy, rx, ry, (x, y, dx, dy, d) => P.put(x, y, d > 0.62 ? RP.poco : RP.sombra, d > 0.62 ? 3.4 + (dy < 0 ? 0.6 : -0.8) - dx * 0.4 : 1.4 - d));
  const path = k ? bez([10, -2], [30, 18], [28, 36], [54, 48]) : bez([7, 21], [26, -2], [56, 36], [81, 15]);
  if (!k) { holeAt(6, 20, 6.5, 13); holeAt(82, 16, 6, 12); }
  else holeAt(54, 48, 9, 7);
  P.z = 1;
  // as raizinhas que saem da grossa
  for (let i = 0; i < 6; i++) { const t = 0.15 + i * 0.13, [x, y] = path(t), dir = i % 2 ? 1 : -1; bark(P, bez([x, y], [x + 3, y + dir * 5], [x + 6, y + dir * 8], [x + 4 + hash2(i, 0, s) * 5, y + dir * (10 + hash2(i, 1, s) * 6)]), t2 => 2.6 - t2 * 2, R, s + i, { base: 2.1 }); }
  P.z = 2;
  bark(P, path, t => (k ? 13 : 14) + Math.sin(t * Math.PI) * 4, R, s, { base: 2.6, sulcos: 5, seiva: 0.16 });
  // os nós e os brilhos de seiva maiores
  for (const t of [0.3, 0.62]) { const [x, y] = path(t); P.ell(x, y, 2.4, 2, (xx, yy, dx, dy, d) => P.put(xx, yy, R, d < 0.4 ? 1.2 : 3.8 - dx - dy)); }
  P.mark('brilho', ...path(0.45));
  moss(P, 0.0, s + 3, null, [R]);
  return P.done();
}

/* =============================== registro =============================== */
// assa as camadas de luar de cada variação: os pixels de luar sozinhos e o halo em volta (pad HR)
const HR = EL_HR;
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
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), elfos: true, elLuz: B.map(b => b.nv), elHalo: B.map(b => b.halo), elPts: Ps.map(P => P.pts), luz: [] }, extra || {}));
};
// A Mata de Prata
def('el_cervo', 'Escultura de cervo branco', F, 'frente', ['mata'], [stag(0), stag(1)], { luz: [{ x: 6, y: 48, r: 0.12 }], brilho: EL_COL.lua });
def('el_pedra_vigia', 'Pedra de vigia com o olho élfico', F, 'frente', ['mata', 'saloes'], [watchStone(0), watchStone(1)], { luz: [{ x: 13, y: 15, r: 0.3 }], brilho: EL_COL.lua, anim: { k: 'el_olho' } });
def('el_harpa', 'Harpa abandonada', F, 'frente', ['mata'], [harp(0), harp(1)]);
def('el_arco_aljava', 'Arco e aljava num gancho', Wl, 'fundo', ['mata', 'saloes'], [bowQuiver(0), bowQuiver(1)]);
def('el_lanterna_pe', 'Lanterna de pé alta', F, 'frente', ['mata', 'saloes'], [standLamp(0), standLamp(1)], { alto: 6, luz: [{ x: 14, y: 22, r: 0.8 }], brilho: EL_COL.lua });
def('el_banco_raiz', 'Banco de raiz', F, 'frente', ['mata'], [rootBench(0), rootBench(1)]);
def('el_flet_casa', 'Casa de flet pendurada', C, 'frente', ['mata'], [fletHouse(0), fletHouse(1)], { clareira: true, alto: 8, luz: [{ x: 18, y: 35, r: 0.45 }], brilho: EL_COL.lua });
def('el_guirlanda', 'Guirlanda de flores-da-lua', C, 'frente', ['mata', 'poco'], [garland(0), garland(1)], { luz: [{ x: 24, y: 10, r: 0.4 }], brilho: EL_COL.lua });
// Os Salões do Rei
def('el_rei_estatua', 'Estátua do rei élfico', Wl, 'fundo', ['saloes'], [kingStatue(0), kingStatue(1)], { salao: true, alto: 9 });
def('el_armadura', 'Armadura élfica no cabide', F, 'frente', ['saloes'], [armorStand(0), armorStand(1)]);
def('el_estante', 'Estante de pergaminhos', F, 'frente', ['saloes'], [scrollShelf(0), scrollShelf(1)]);
def('el_fonte', 'Fonte de prata', F, 'frente', ['saloes'], [fountain()], { luz: [{ x: 22, y: 26, r: 0.15 }], brilho: EL_COL.lua, anim: { k: 'el_agua' } });
def('el_tapecaria_lua', 'Tapeçaria da lua', Wl, 'fundo', ['saloes'], [moonTapestry(0), moonTapestry(1)]);
def('el_lustre', 'Lustre de galhos com velas azuis', C, 'frente', ['saloes'], [chandelier()], { luz: [{ x: 28, y: 14, r: 0.9 }], brilho: EL_COL.lua });
def('el_vitral', 'Vitral de folha', Wl, 'fundo', ['saloes'], [leafWindow(0), leafWindow(1)], { luz: [{ x: 16, y: 26, r: 0.55 }], brilho: EL_COL.lua });
def('el_mesa_calices', 'Mesa longa com cálices', F, 'frente', ['saloes'], [longTable(0), longTable(1)]);
// A Corte Desterrada
def('el_rei_quebrado', 'Estátua do rei quebrada', F, 'frente', ['corte'], [brokenKing(0), brokenKing(1)], { ruina: true });
def('el_altar_sangue', 'Altar de mana sangrenta', F, 'frente', ['corte'], [bloodAltar()], { luz: [{ x: 18, y: 10, r: 0.85 }], brilho: EL_COL.carmesim, anim: { k: 'el_cristal' } });
def('el_gaiola', 'Gaiola de magíster pendurada', C, 'frente', ['corte'], [magisterCage(0), magisterCage(1)], { luz: [{ x: 13, y: 32, r: 0.3 }], brilho: EL_COL.carmesim });
def('el_tapecaria_rasgada', 'Tapeçaria rasgada carmesim e ouro', Wl, 'fundo', ['corte'], [tornTapestry(0), tornTapestry(1)]);
def('el_arvore_morta', 'Árvore morta pequena', F, 'frente', ['corte'], [deadTree(0), deadTree(1)], { luz: [{ x: 23, y: 40, r: 0.1 }], brilho: EL_COL.carmesim });
def('el_mesa_alquimia', 'Mesa de alquimia derrubada', F, 'frente', ['corte'], [alchemyTable(0), alchemyTable(1)], { luz: [{ x: 30, y: 28, r: 0.3 }], brilho: EL_COL.carmesim });
def('el_braseiro_vil', 'Braseiro vil', F, 'frente', ['corte'], [felBrazier(0), felBrazier(1)], { luz: [{ x: 12, y: 6, r: 0.9 }], brilho: EL_COL.carmesim, anim: { k: 'el_fogo' } });
// O Poço da Lua
def('el_poco_lua', 'Poço da lua', F, 'frente', ['poco'], [moonWell()], { luz: [{ x: 29, y: 10, r: 0.85 }], brilho: EL_COL.lua, anim: { k: 'el_agua' } });
def('el_dama_estatua', 'Estátua da Dama', Wl, 'fundo', ['poco'], [ladyStatue(0), ladyStatue(1)], { gruta: true, alto: 8, luz: [{ x: 21, y: 35, r: 0.3 }], brilho: EL_COL.lua, anim: { k: 'el_agua' } });
def('el_arco_raizes', 'Arco de raízes', Wl, 'fundo', ['poco'], [rootArch()], { alto: 6, luz: [{ x: 31, y: 20, r: 0.3 }], brilho: EL_COL.lua });
def('el_cristal_lunar', 'Cristal lunar grande', F, 'frente', ['poco'], [moonCrystal(0), moonCrystal(1)], { luz: [{ x: 19, y: 26, r: 0.75 }], brilho: '#cfe6ff' });
def('el_lanterna_flutuante', 'Lanterna flutuante', C, 'frente', ['poco', 'mata'], [floatLantern(0), floatLantern(1)], { luz: [{ x: 10, y: 30, r: 0.75 }], brilho: EL_COL.lua, anim: { k: 'el_flut' } });
def('el_raiz_mae', 'Raiz-mãe atravessando a parede', Wl, 'fundo', ['poco'], [motherRoot(0), motherRoot(1)], { luz: [{ x: 44, y: 18, r: 0.25 }], brilho: EL_COL.lua });

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(EL_PROP_PLAN, {
  mata: { chao: [['el_cervo', 0.06, 1], ['el_pedra_vigia', 0.08, 1], ['el_harpa', 0.05, 1], ['el_lanterna_pe', 0.16, 2], ['el_banco_raiz', 0.1, 1]], teto: [['el_flet_casa', 0.06, 1], ['el_guirlanda', 0.22, 2], ['el_lanterna_flutuante', 0.04, 1]], fundo: [['el_arco_aljava', 0.08, 1]] },
  saloes: { chao: [['el_armadura', 0.1, 1], ['el_estante', 0.1, 1], ['el_fonte', 0.06, 1], ['el_mesa_calices', 0.07, 1], ['el_lanterna_pe', 0.07, 1], ['el_pedra_vigia', 0.03, 1]], teto: [['el_lustre', 0.16, 2]], fundo: [['el_rei_estatua', 0.07, 1], ['el_tapecaria_lua', 0.14, 2], ['el_vitral', 0.1, 2], ['el_arco_aljava', 0.04, 1]] },
  corte: { chao: [['el_rei_quebrado', 0.07, 1], ['el_altar_sangue', 0.06, 1], ['el_arvore_morta', 0.1, 1], ['el_mesa_alquimia', 0.08, 1], ['el_braseiro_vil', 0.14, 2]], teto: [['el_gaiola', 0.12, 1]], fundo: [['el_tapecaria_rasgada', 0.14, 2]] },
  poco: { chao: [['el_poco_lua', 0.06, 1], ['el_cristal_lunar', 0.14, 2]], teto: [['el_lanterna_flutuante', 0.2, 2], ['el_guirlanda', 0.05, 1]], fundo: [['el_dama_estatua', 0.06, 1], ['el_arco_raizes', 0.06, 1], ['el_raiz_mae', 0.1, 1]] }
});

/* ---------- o luar e os animados ----------
   visProps só guarda objetos com luz (todos os élficos têm `luz`, nem que vazia). drawWorld vem antes da luz e do
   herói (a gota da lanterna flutuante escurece com o lugar e fica atrás dele); o luar, o halo e as chamas vão no
   drawGlow (somados) e no drawTop (por cima do escuro). */
// a gota de vidro da lanterna flutuante: assada uma vez (sem a chama, que é ao vivo por cima)
const GOTA = (() => { const Q = painter(13, 20); lanternDrop(Q, 6.5, 1, 25899, true, false); Q.done(); return { cv: toCv(Q), w: 13, h: 20, fx: 6, fy: 11 }; })();
const elPt = (p, nm) => { const P = p.def.elPts && p.def.elPts[p.v]; return P && P[nm] ? P[nm] : null; };
const elBob = p => Math.round(Math.sin(gameTime * 1.3 + p.X * 0.013) * 3);
const elFlick = (p, j) => 0.8 + Math.sin(gameTime * 11 + j * 2.3 + p.X) * 0.1 + Math.sin(gameTime * 23 + j) * 0.08;
let elGl = null;
const elGlowC = (c, r) => { const G = elGl || (elGl = {}), k = c + r; return G[k] || (G[k] = glow(r, c)); };
const FL_LUA = ['#24407a', '#4a7ad0', '#9cc8ff', '#ffffff'], FL_CARM = ['#5a0812', '#b01a2a', '#ff5a4a', '#ffd0a0'];
HOOK.drawWorld.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || !p.def.elfos || A.k !== 'el_flut') continue;
    const Fq = elPt(p, 'flut'); if (!Fq) continue;
    lc.drawImage(GOTA.cv, Math.round(p.X + p.sh - cx) + Fq[0].x - GOTA.fx, Math.round(p.Y - cy) + Fq[0].y - GOTA.fy + elBob(p));
  }
});
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.elfos) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), hl = p.def.elHalo[p.v], nv = p.def.elLuz[p.v], A = p.def.anim;
    const br = A && A.k === 'el_fogo' ? 0.8 + Math.sin(gameTime * 9 + p.X) * 0.12 : 0.9 + Math.sin(gameTime * 1.4 + p.X * 0.05) * 0.1;
    if (hl) { lc.globalAlpha = 0.58 * br; lc.drawImage(hl, X - EL_HR, Y - EL_HR); }
    if (nv) { lc.globalAlpha = 0.45 * br; lc.drawImage(nv, X, Y); }
    const V = elPt(p, 'vela'); if (V) for (let j = 0; j < V.length; j++) { const q = V[j]; lc.globalAlpha = (q.l ? 0.55 : 0.45) * elFlick(p, j); lc.drawImage(elGlowC(q.c, q.l ? 9 : 7), X + q.x - (q.l ? 9 : 7), Y + q.y - (q.l ? 8 : 6)); }
    if (!A) continue;
    if (A.k === 'el_fogo') { const Fq = elPt(p, 'fogo'); if (Fq) { const q = Fq[0]; lc.globalAlpha = 0.55 * br; lc.drawImage(elGlowC('#ff3040', 16), X + q.x + (q.w >> 1) - 16, Y + q.y - 20); } }
    else if (A.k === 'el_cristal') { const Cq = elPt(p, 'cristal'); if (Cq) { const q = Cq[0], b = 0.5 + 0.5 * Math.sin(gameTime * 2.2 + p.X); lc.globalAlpha = 0.4 + 0.3 * b; lc.drawImage(elGlowC('#ff3a4a', 14), X + q.x - 14, Y + q.y - 14 + Math.round(Math.sin(gameTime * 1.7) * 1.5)); } }
    else if (A.k === 'el_flut') { const Fq = elPt(p, 'flut'); if (Fq) { lc.globalAlpha = 0.6 * elFlick(p, 0); lc.drawImage(elGlowC(EL_COL.lua, 12), X + Fq[0].x - 12, Y + Fq[0].y - 12 + elBob(p)); } }
    else if (A.k === 'el_olho') { const O = elPt(p, 'olho'); if (O) { lc.globalAlpha = 0.3 + 0.15 * Math.sin(gameTime * 2 + p.X); lc.drawImage(elGlowC(EL_COL.lua, 7), X + O[0].x - 7, Y + O[0].y - 7); } }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.elfos) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    // as chamas de vela e de lanterna: um fiapo azul que balança, o miolo branco
    const V = elPt(p, 'vela'); if (V) for (let j = 0; j < V.length; j++) {
      const q = V[j], f = Math.floor(gameTime * 7 + p.X * 0.3 + j * 5) % 4, x = X + q.x, y = Y + q.y;
      lc.globalAlpha = 1;
      if (q.l) { lc.fillStyle = FL_LUA[3]; lc.fillRect(x, y + 2, 1, 1); lc.fillStyle = FL_LUA[2]; lc.fillRect(x, y + 1, 1, 1); if (f) { lc.fillRect(x, y, 1, 1); } continue; }
      lc.fillStyle = FL_LUA[1]; lc.fillRect(x + (f === 3 ? 1 : 0), y - 2 - (f === 1 ? 1 : 0), 1, 1 + (f === 1 ? 1 : 0));
      lc.fillStyle = FL_LUA[2]; lc.fillRect(x, y - 1, 1, 1); lc.fillStyle = FL_LUA[3]; lc.fillRect(x, y, 1, 1);
    }
    // os brilhos que cintilam
    const St = elPt(p, 'brilho'); if (St) for (let j = 0; j < St.length; j++) { const b = Math.sin(gameTime * (1.1 + hash2(j, p.X, 3) * 1.6) + j * 2.3 + p.X); if (b < 0.75) continue; lc.globalAlpha = (b - 0.75) * 4; lc.fillStyle = '#ffffff'; lc.fillRect(X + St[j].x - 1, Y + St[j].y, 3, 1); lc.fillRect(X + St[j].x, Y + St[j].y - 1, 1, 3); }
    // o espelho d'água tremendo: riscos claros correndo pela superfície
    const Ag = elPt(p, 'agua'); if (Ag) for (const q of Ag) for (let k = 0; k < 4; k++) { const h = hash2(k, p.X, 7), x = Math.round((gameTime * (5 + h * 6) + h * q.w + k * q.w / 4) % q.w), l = 2 + ((gameTime * 2 + h * 9) | 0) % 3; lc.globalAlpha = 0.55 + 0.3 * Math.sin(gameTime * 3 + k); lc.fillStyle = k % 2 ? '#e8f6ff' : '#9cc8ff'; lc.fillRect(X + q.x + x, Y + q.y, Math.min(l, q.w - x), 1); }
    // os fios d'água da fonte: tracejado descendo, o respingo embaixo
    const Jt = elPt(p, 'jato'); if (Jt) for (let j = 0; j < Jt.length; j++) { const q = Jt[j]; for (let k = 0; k < q.len; k++) { const ph = ((k - gameTime * 22 + j * 3) % 4 + 4) % 4; lc.globalAlpha = 0.75; lc.fillStyle = ph < 1 ? '#e8f6ff' : ph < 2.5 ? '#6cb0dc' : '#3a82b8'; lc.fillRect(X + q.x + (k > q.len * 0.5 ? (q.x > 20 ? 1 : 0) : 0), Y + q.y + k, 1, 1); } const sp = (gameTime * 3 + j) % 1; lc.globalAlpha = 0.7 * (1 - sp); lc.fillStyle = '#cfe8ff'; lc.fillRect(X + q.x - 1 - Math.round(sp * 2), Y + q.y + q.len - Math.round(Math.sin(sp * Math.PI) * 2), 1, 1); lc.fillRect(X + q.x + 1 + Math.round(sp * 2), Y + q.y + q.len - Math.round(Math.sin(sp * Math.PI) * 2), 1, 1); }
    // os pontinhos de luar subindo da água
    const Mt = elPt(p, 'mote'); if (Mt) for (const q of Mt) for (let k = 0; k < (q.n || 6); k++) { const h = hash2(k, p.X, 13), t = (gameTime * (0.18 + h * 0.15) + h) % 1; lc.globalAlpha = 0.85 * (1 - t) * Math.min(1, t * 6); lc.fillStyle = k % 3 ? '#cfe6ff' : '#ffffff'; lc.fillRect(X + q.x + Math.round(h * q.w + Math.sin(t * 7 + k) * 1.5), Y + q.y - Math.round(t * 26), 1, 1); }
    const A = p.def.anim; if (!A) continue;
    if (A.k === 'el_fogo') {   // as línguas carmesim: colunas que sobem e encolhem, o miolo claro embaixo, brasas subindo
      const Fq = elPt(p, 'fogo'); if (!Fq) continue; const q = Fq[0], T = Math.floor(gameTime * 10);
      for (let c = 0; c < q.w; c++) {
        const env = Math.sin(Math.PI * (c + 0.5) / q.w), h = Math.round(env * (5 + (Math.sin(gameTime * 9 + c * 1.7 + p.X) + 1) * 2.2 + hash2(c, T, p.X) * 2.5));
        for (let j = 0; j < h; j++) { const t = j / Math.max(1, h); lc.globalAlpha = t > 0.85 ? 0.6 : 1; lc.fillStyle = t < 0.25 && env > 0.6 ? FL_CARM[3] : t < 0.55 ? FL_CARM[2] : t < 0.85 ? FL_CARM[1] : FL_CARM[0]; lc.fillRect(X + q.x + c, Y + q.y - j, 1, 1); }
      }
      for (let k = 0; k < 4; k++) { const h = hash2(k, p.X, 21), t = (gameTime * (0.5 + h * 0.4) + h) % 1; lc.globalAlpha = 1 - t; lc.fillStyle = k % 2 ? '#ff8a6a' : '#ffd0a0'; lc.fillRect(X + q.x + Math.round(h * q.w + Math.sin(t * 8 + k) * 2), Y + q.y - 6 - Math.round(t * 18), 1, 1); }
    } else if (A.k === 'el_cristal') {   // o cristal de quatro faces girando no ar entre as garras
      const Cq = elPt(p, 'cristal'); if (!Cq) continue; const q = Cq[0], a = gameTime * 1.8 + p.X, oy = Math.round(Math.sin(gameTime * 1.7) * 1.5), hc = 4, hp = 7, Wd = 4.2, R = ['#500a14', '#801422', '#b42032', '#e0404a', '#ff9090', '#ffe0e0'];
      lc.globalAlpha = 1;
      for (let j = -hc; j <= hp; j++) {
        const hw = j < 0 ? Wd * (1 + j / (hc + 0.5)) : Wd * (1 - j / (hp + 0.5)); if (hw <= 0.2) continue;
        for (let f = 0; f < 4; f++) {
          const t0 = a + f * Math.PI / 2, nA = t0 + Math.PI / 4; if (Math.cos(nA) <= 0) continue;
          const xa = Math.sin(t0) * hw, xb = Math.sin(t0 + Math.PI / 2) * hw, x0 = Math.round(Math.min(xa, xb)), x1 = Math.round(Math.max(xa, xb)); if (x1 <= x0) continue;
          const lit = 0.5 - 0.5 * Math.sin(nA) + (j < 0 ? 0.15 : 0); lc.fillStyle = R[clamp(Math.round(lit * 4 + 0.5), 0, 5)];
          lc.fillRect(X + q.x + x0, Y + q.y + oy + j, x1 - x0, 1);
        }
      }
      lc.fillStyle = '#ffe0e0'; lc.fillRect(X + q.x + Math.round(Math.sin(a + Math.PI) * 2), Y + q.y + oy - 1, 1, 2);
    } else if (A.k === 'el_flut') {   // a chama da gota flutuante
      const Fq = elPt(p, 'flut'); if (!Fq) continue; const x = X + Fq[0].x, y = Y + Fq[0].y + elBob(p), f = Math.floor(gameTime * 7 + p.X) % 4;
      lc.globalAlpha = 1; lc.fillStyle = FL_LUA[1]; lc.fillRect(x - 1, y - 1, 3, 3); lc.fillStyle = FL_LUA[2]; lc.fillRect(x, y - 2 - (f === 1 ? 1 : 0), 1, 3 + (f === 1 ? 1 : 0)); lc.fillRect(x - 1, y, 3, 1); lc.fillStyle = '#ffffff'; lc.fillRect(x, y, 1, 1);
    } else if (A.k === 'el_olho') {   // a íris acesa escorrega um pixel para o lado do herói
      const O = elPt(p, 'olho'); if (!O) continue; const o = O[0], dx = pl.x + pl.w / 2 - (p.X + p.sh + o.x), dy = pl.y + 8 - (p.Y + o.y), d = Math.hypot(dx, dy) || 1;
      if (d > 220) continue; const ix = X + o.x + Math.round(dx / d * 1.4), iy = Y + o.y + Math.round(dy / d * 0.8);
      lc.globalAlpha = 0.9; lc.fillStyle = '#9cc8ff'; lc.fillRect(ix - 1, iy, 2, 1); lc.fillRect(ix, iy - 1, 1, 2); lc.fillStyle = '#ffffff'; lc.fillRect(ix, iy, 1, 1);
    }
  }
  lc.globalAlpha = 1;
});
}
