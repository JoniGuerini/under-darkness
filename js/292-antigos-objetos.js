'use strict';

/* ================= a Cidade dos Antigos: objetos de cena =================
   Tudo o que é maior que um bloco e veste A Cidade dos Antigos (docs/camadas/13-cidade-antigos.md, seção 5): 28 objetos.
   Nas Escadarias e na Cidade Inversa: o obelisco de medida (as riscas marcam a altura de cada bloco a partir do chão), a
   estátua de Antigo (alta, quatro braços, as mãos em ângulo reto), o mural de glifos, a porta selada sem maçaneta, a
   janela para lugar nenhum (um céu estrelado que não existe), o lustre de anéis concêntricos e o olho de vigia apagado.
   Na Cidade Inversa, mais: a esfera armilar, a prancheta com a planta gravada, a escada que sobe para o nada, o relevo de
   órbitas, o mapa estelar e o prédio invertido pendurado do teto (a porta e as janelas de cabeça para baixo). Nas
   Máquinas: a máquina de engrenagens, a bobina de luz, a bancada com um construto pela metade, o painel de mostradores,
   o conduto pendurado (um brilho corre por ele a intervalos certos), o pistão gigante (sobe e desce devagar) e a
   engrenagem de parede gigante (gira, um dente por compasso). Na Cratera: a lasca grande da estrela, a pedra fundida
   em gota, o meteorito cravado no chão, a bacia de vidro, a rachadura radial acesa e a estalactite de vidro grande. O
   poliedro flutuante (gira sobre o pedestal) e o construto desligado, ajoelhado, aparecem em várias faixas.
   O pintor do 252 (rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, juntas por P.z), mas
   medido com régua: arestas retas, ângulos retos, círculos perfeitos, grão fino (quase nenhum ruído). Um pixel de luz
   (P.N) é cor pura: o ciano dos glifos e o branco da estrela, nada quente. Cada variação assa duas imagens a mais: os
   pixels de luz sozinhos e o halo em volta (calculado uma vez); o drawGlow soma os dois.
   Tudo aqui pulsa no MESMO compasso (RITMO segundos, a mesma fase para o mundo inteiro): o halo, o brilho das luzes, o
   poliedro que sobe e desce, o pistão, o dente da engrenagem, o brilho que corre no conduto. Nada pisca à toa.
   Animados (só os que estão em visProps, ou seja, perto da tela; nada relido por quadro):
     'poli'   o poliedro: 12 quadros de um quarto de volta assados na primeira vez, desenhado logo depois dos pedaços do
              mundo (a luz escurece junto, o herói passa na frente); um pontinho de luz no miolo por cima do escuro;
     'pistao' o êmbolo e a haste do pistão gigante (a haste aparece só do teto do poço até o êmbolo);
     'roda'   a engrenagem de parede: 6 quadros de um dente, um quadro a cada sexto de compasso;
     'corre'  o brilho que corre no vidro do conduto (drawTop), pelos pontos marcados no desenho.
   Registrados com defProp (`antigos: true`, `luz: []` para entrar em visProps; a luz de verdade fica em `atLuzV`, uma
   lista por variação, e o propLights embrulhado a acende). O 295 põe a partir do AT_PROP_PLAN (o elPlaceProps do 255).
   Peças de fundo em AT_BACK_FLOOR ficam em pé no chão; AT_BACK_WINDOW (a janela) pede uma altura só para todas da sala;
   as outras de fundo, na altura dos olhos.
   Flags que o gerador deve respeitar (como clareira/salao/ruina/gruta do 255):
     terraco: true     só dentro dos terraços e câmaras das Escadarias (atTerraces): a estátua de Antigo;
     quarteirao: true  só dentro dos quarteirões da Cidade Inversa (atBlocks): o prédio invertido, a escada para o nada;
     maquina: true     só dentro dos salões das Máquinas (atHalls): o pistão, a engrenagem de parede, a bancada;
     cratera: true     só dentro das crateras (atCraters): a lasca grande, o meteorito, a bacia, a estalactite de vidro. */
const AT_PROP_PLAN = {};
// peças de fundo que ficam em pé no chão em vez de penduradas na altura dos olhos
const AT_BACK_FLOOR = { at_escada_nada: 1, at_pistao: 1, at_engrenagem: 1, at_porta: 1 };
// a janela para lugar nenhum: todas da mesma sala na mesma altura (o topo 1 bloco abaixo do teto, como as janelas do 45)
const AT_BACK_WINDOW = { at_janela: 1 };
{
const cg = CVART.cg;
// o compasso da cidade, em segundos: o do 291 (AT_BEAT / atPulse), para os blocos e os objetos pulsarem juntos
const RITMO = typeof AT_BEAT !== 'undefined' ? AT_BEAT : 2.0;
const pulso = () => typeof atPulse === 'function' ? atPulse(gameTime) : 0.5 - 0.5 * Math.cos(gameTime * 6.283185 / RITMO);   // 0..1, a mesma fase em toda parte
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  // a ficha (seção 12): pedra lisa, laje, luz de glifo, vidro de cratera, ferro estelar, chapa antiga
  pedra: ['#12161e', '#1e2632', '#2e3a4a', '#46566a', '#6a7e94', '#a4b6c8'],
  laje: ['#161a20', '#262c36', '#3a4250', '#56606e', '#7c8898', '#b0bccc'],
  glifo: ['#0a2a30', '#145058', '#2a8a94', '#4ac8d0', '#9af0f0', '#e8ffff'],
  vidro: ['#060a08', '#0e1a16', '#183028', '#24483c', '#3e6e5c', '#7ab0a0'],
  estelar: ['#14121e', '#2a2840', '#4a4870', '#7a7ab0', '#b4b8e8', '#f0f4ff'],
  chapa: ['#141814', '#222a24', '#344038', '#4c5a50', '#6a7c70', '#9cb0a2'],
  // e o que a camada pede a mais: a rocha fundida (preta, lustrosa), o corpo branco da lasca, o céu que não existe, o
  // escuro de dentro (vãos, janelas, o fundo do poço)
  fundida: ['#060608', '#0e0e12', '#18181e', '#262630', '#3a3a48', '#5a5a70'],
  estrela: ['#30344a', '#4e5470', '#787e9e', '#a8aeca', '#d6dcf0', '#fbfcff'],
  ceu: ['#04040c', '#080a1a', '#0e1228', '#161c3a', '#20284e', '#2e3866'],
  vazio: ['#040508', '#08090e', '#0d1016', '#13171f', '#1a1f2a', '#222936']
};
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#030406');
// as cores puras: o glifo aceso e a estrela
const GL = { miolo: '#e8ffff', claro: '#9af0f0', ciano: '#4ac8d0', fundo: '#2a8a94', escuro: '#145058' };
const ST = { miolo: '#ffffff', branco: '#f0f4ff', palido: '#d4dcf4', violeta: '#b4b8e8', fundo: '#7a7ab0' };

/* ---- o pintor do 252: rid -2 marca um pixel de cor pura que acende ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), zb = new Uint8Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, zb, ramps, idOf, z: 0, pts: {},
    put(x, y, R, v) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; zb[k] = P.z; },
    N(x, y, hex) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = ph(hex); rid[k] = -2; val[k] = 5; zb[k] = P.z; },
    clear(x, y) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    ell(cx, cy, rx, ry, fn) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d <= 1) fn(x, y, dx, dy, d); } },
    line(x0, y0, x1, y1, R, v) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) P.put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, R, typeof v === 'function' ? v(i / n) : v); },
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
// as juntas entre peças: a parte de P.z maior fica na frente; a de trás ganha sombra onde encosta
function seams(P, amt = 1) {
  const d = new Float32Array(P.w * P.h);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0) continue; const z = P.zb[k];
    const fz = (xx, yy) => xx >= 0 && yy >= 0 && xx < P.w && yy < P.h && P.c[yy * P.w + xx] && P.zb[yy * P.w + xx] > z;
    if (fz(x - 1, y) || fz(x, y - 1)) d[k] = amt; else if (fz(x + 1, y) || fz(x, y + 1)) d[k] = amt * 0.45;
  }
  const oz = P.z;
  for (let k = 0; k < d.length; k++) if (d[k]) { P.z = P.zb[k]; P.put(k % P.w, (k / P.w) | 0, P.ramps[P.rid[k]], P.val[k] - d[k]); }
  P.z = oz;
}

/* ---- as ferramentas da régua ---- */
// a face lisa: a aresta de cima e a da esquerda acesas, a de baixo e a da direita escuras, o grão fino
function face(P, x0, y0, w, h, R, s, base = 2.8, grain = 0.2) {
  P.rect(x0, y0, w, h, R, (i, j, x, y) => base + (j === 0 ? 1.3 : j === 1 && h > 4 ? 0.3 : 0) + (i === 0 ? 0.7 : 0) - (j === h - 1 ? 1.1 : 0) - (i === w - 1 && w > 2 ? 0.9 : 0) - j / h * 0.35 - i / w * 0.3 + cg(x, y, s) * grain);
}
// fiadas de laje: blocos perfeitos, a junta de 1 px reta, a quina de cima e da esquerda de cada bloco acesa
function courses(P, x0, y0, w, h, R, s, ch = 6, cw = 12, base = 2.7, keep = null) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x0 + x, Y = y0 + y; if (keep && !keep(X, Y)) continue;
    const row = Math.floor(y / ch), off = (row % 2) * (cw >> 1), lx = (x + off) % cw, ly = y % ch, col = Math.floor((x + off) / cw);
    const joint = ly === ch - 1 || lx === cw - 1;
    P.put(X, Y, R, (joint ? base - 1.15 : base + (ly === 0 ? 0.65 : 0) + (lx === 0 ? 0.3 : 0) + hash2(col, row, s) * 0.3 - 0.15) + (y === 0 ? 0.9 : 0) + (x === 0 ? 0.4 : 0) - (x === w - 1 ? 0.7 : 0) - x / w * 0.45 - y / h * 0.2 + cg(X, Y, s) * 0.16);
  }
}
// uma barra reta (braço, haste, trilho): deitada, o topo aceso e a base escura; em pé, a esquerda acesa e a direita escura
function bar(P, x0, y0, w, h, R, s, base = 2.8) {
  const vert = h > w;
  P.rect(x0, y0, w, h, R, (i, j, x, y) => { const q = vert ? (w > 1 ? i / (w - 1) : 0.5) : (h > 1 ? j / (h - 1) : 0.5); return base + 1.1 - q * 2 + (vert ? (j === 0 ? 0.5 : 0) : (i === 0 ? 0.4 : 0)) + cg(x, y, s) * 0.14; });
}
// qualquer forma: inside(x, y) diz o que é dela; a quina com ar em cima ou à esquerda acende, com ar embaixo ou à direita escurece
function shape(P, x0, y0, x1, y1, inside, R, s, base = 2.8, grain = 0.16, tone = null) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!inside(x, y)) continue;
    let v = base + (tone ? tone(x, y) : 0) + cg(x, y, s) * grain;
    if (!inside(x - 1, y) || !inside(x, y - 1)) v += 1.1; else if (!inside(x + 1, y) || !inside(x, y + 1)) v -= 0.95;
    P.put(x, y, R, v);
  }
}
const inPoly = (x, y, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
// uma faceta plana: o tom fixo e um gradiente leve (gx da esquerda para a direita, gy de cima para baixo)
function facet(P, pts, R, s, v, gx = 0, gy = 0) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) if (inPoly(x + 0.5, y + 0.5, pts)) P.put(x, y, R, v + gx * (x - x0) / Math.max(1, x1 - x0) + gy * (y - y0) / Math.max(1, y1 - y0) + cg(x, y, s) * 0.12);
}
// disco perfeito: a cúpula rasa acesa em cima à esquerda, o fio de borda escuro embaixo à direita
function orb(P, cx, cy, r, R, s, base = 2.8, dome = 1) {
  P.ell(cx, cy, r, r, (x, y, dx, dy, d) => P.put(x, y, R, base - (dx + dy) * 0.9 * dome + (d > 0.7 ? (dx + dy < 0 ? 0.6 : -0.8) : 0) + cg(x, y, s) * 0.12));
}
// anel perfeito (ou elipse girada de rot): th de espessura; part(a) escolhe a metade (a é o ângulo na elipse: sin(a) > 0 é a
// metade da frente de um anel deitado visto um pouco de cima)
function ring(P, cx, cy, rx, ry, th, R, s, base = 2.8, part = null, rot = 0) {
  const m = Math.max(rx, ry) + th + 1, cr = Math.cos(rot), sr = Math.sin(rot);
  for (let y = Math.floor(cy - m); y <= cy + m; y++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
    const X = x + 0.5 - cx, Y = y + 0.5 - cy, dx = X * cr + Y * sr, dy = -X * sr + Y * cr;
    const F = (dx / rx) ** 2 + (dy / ry) ** 2, G = Math.hypot(2 * dx / (rx * rx), 2 * dy / (ry * ry)); if (G < 1e-6) continue;
    const d = (F - 1) / G; if (Math.abs(d) > th / 2) continue;
    const a = Math.atan2(dy / ry, dx / rx); if (part && !part(a)) continue;
    const sa = Math.atan2(Y, X), lit = -(Math.cos(sa) + Math.sin(sa)) * 0.707;
    P.put(x, y, R, base + lit * 1.1 - d / th * 0.9 + cg(x, y, s) * 0.1);
  }
}
// sulco num círculo (relevo): o fundo escuro e o lábio de baixo à direita aceso
function groove(P, cx, cy, r, R, base = 2.8) {
  P.ell(cx, cy, r + 1.2, r + 1.2, (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); if (Math.abs(d - r) < 0.55) P.put(x, y, R, base - 1.6); else if (d - r >= 0.55 && d - r < 1.45 && dx + dy > -d * 0.3) P.put(x, y, R, base + 1.1); });
}
// sulco reto (horizontal ou vertical): o lábio aceso embaixo ou à direita
function cut(P, x0, y0, x1, y1, R, base = 2.8) {
  if (y0 === y1) for (let x = x0; x <= x1; x++) { P.put(x, y0, R, base - 1.6); P.put(x, y0 + 1, R, base + 1); }
  else for (let y = y0; y <= y1; y++) { P.put(x0, y, R, base - 1.6); P.put(x0 + 1, y, R, base + 1); }
}
// os glifos dos Antigos: retas e ângulos retos (5 x 5), e os pequenos (3 x 3)
const AGLYPH = [
  ['xxxxx', 'x...x', 'x.x.x', 'x...x', 'xxxxx'], ['xxx..', '..x..', '..xxx', '....x', 'xxxxx'], ['.xxx.', 'x...x', 'x.x.x', 'x...x', '.xxx.'],
  ['x.xxx', 'x...x', 'xxx.x', 'x...x', 'xxx.x'], ['xxxxx', '....x', 'xxx.x', 'x...x', 'x.xxx'], ['x...x', 'x...x', 'xxxxx', '..x..', '..x..'],
  ['xxxxx', 'x....', 'xxxxx', '....x', 'xxxxx'], ['..x..', '..x..', 'xxxxx', 'x...x', 'xxxxx'], ['xxxxx', '.x.x.', '.x.x.', '.x.x.', 'xxxxx'],
  ['x....', 'xxx..', '..x..', '..xxx', '....x']
];
const AGL3 = [['xxx', 'x.x', 'xxx'], ['x..', 'xxx', '..x'], ['xxx', '.x.', '.x.'], ['x.x', 'xxx', 'x.x'], ['.x.', 'xxx', '.x.'], ['xx.', '.x.', '.xx']];
const gOn = (k, i, j, sm) => { const G = sm ? AGL3[k % AGL3.length] : AGLYPH[k % AGLYPH.length], n = sm ? 3 : 5; return i >= 0 && j >= 0 && i < n && j < n && G[j][i] === 'x'; };
// glifo gravado: o sulco escuro, o lábio de baixo aceso
function gcarve(P, x, y, k, R, base = 2.8, sm = false) { const n = sm ? 3 : 5; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (gOn(k, i, j, sm)) { P.put(x + i, y + j, R, base - 1.7); if (!gOn(k, i, j + 1, sm)) P.put(x + i, y + j + 1, R, base + 1); } }
// glifo aceso (ciano)
function glit(P, x, y, k, col = GL.claro, sm = false) { const n = sm ? 3 : 5; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (gOn(k, i, j, sm)) P.N(x + i, y + j, col); }
// engrenagem de dentes retos (paralelos): n dentes, td de altura, tw de largura; ns raios retos com vãos entre eles
function gearIn(cx, cy, r, n, ang, o = {}) {
  const td = o.td || Math.max(2, Math.round(r * 0.13)), tw = o.tw || Math.max(2, 2 * Math.PI * r / n * 0.48), rim = o.rim || Math.max(2, Math.round(r * 0.15)), hub = o.hub || Math.max(2, r * 0.24), ns = o.ns === undefined ? 6 : o.ns, sw = o.sw || Math.max(2, r * 0.16), st = 2 * Math.PI / n;
  return (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); if (d > r) return 0;
    const a = Math.atan2(dy, dx);
    if (d > r - td) { const q = a - ang - Math.round((a - ang) / st) * st; return Math.abs(d * Math.sin(q)) <= tw / 2 ? 1 : 0; }
    if (!ns || d <= hub || d >= r - td - rim) return 1;
    for (let j = 0; j < ns / 2; j++) { const la = ang + j * 2 * Math.PI / ns; if (Math.abs(dx * Math.sin(la) - dy * Math.cos(la)) <= sw / 2) return 1; }
    return 0;
  };
}
function gear(P, cx, cy, r, n, ang, R, s, base = 2.8, o = {}) {
  const IN = gearIn(cx, cy, r, n, ang, o), hub = o.hub || Math.max(2, r * 0.24);
  shape(P, Math.floor(cx - r - 1), Math.floor(cy - r - 1), Math.ceil(cx + r + 1), Math.ceil(cy + r + 1), IN, R, s, base, 0.12, (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); return -(dx + dy) / (2 * r) * 0.9 + (d < hub ? 0.3 : 0); });
  if (o.cubo !== false) { orb(P, cx, cy, Math.max(1.5, hub * 0.6), o.cuboR || RP.estelar, s + 1, 3); }
}

/* =============================== AS ESCADARIAS E A CIDADE INVERSA =============================== */
function obelisk(k) {   // 22 x 62 (k 1: 22 x 48, com a janela quadrada; k 2: 22 x 76, com a gola): o obelisco de medida: a base em dois degraus, o fuste quadrado de pedra lisa com a lateral na sombra, o piramidião de 45 graus com a ponta de glifo; na aresta da frente, uma risca a cada 3 px e a risca longa acesa a cada bloco de altura (12 px, contados do chão), e a coluna de glifos gravados
  const W = 22, H = [62, 48, 76][k], P = painter(W, H), s = 29201 + k, R = RP.pedra, L = RP.laje;
  const sx0 = 4, sw = 14, fw = 12, cx = sx0 + sw / 2, tp = 7, fb = H - 8;
  face(P, 0, H - 4, W, 4, L, s, 2.6); face(P, 2, H - 8, W - 4, 4, L, s + 1, 2.9);
  P.z = 1;
  face(P, sx0, tp, fw, fb - tp, R, s + 2, 3.1, 0.14);
  P.rect(sx0 + fw, tp, 2, fb - tp, R, (i, j, x, y) => (j === 0 ? 2.8 : 1.8) - i * 0.6 + cg(x, y, s) * 0.1);
  for (let j = 0; j < tp; j++) { const hw = j + 1; for (let x = Math.floor(cx - hw); x < cx + hw; x++) P.put(x, j, R, x < cx ? 4.4 - j * 0.08 - (x === Math.floor(cx - hw) ? 0 : 0.2) : 2.1 - (x === Math.ceil(cx + hw) - 1 ? 0.5 : 0)); }
  P.N(cx - 1, 0, GL.claro); P.N(cx, 0, GL.ciano);
  if (k === 2) { face(P, sx0 - 1, 30, sw + 2, 3, R, s + 4, 3.4); }   // a gola no meio do fuste
  // as riscas de medida
  for (let m = 0; fb - 1 - m * 3 > tp + 2; m++) {
    const y = fb - 1 - m * 3, lg = m % 4 === 0; if (k === 2 && y >= 29 && y <= 33) continue;
    for (let i = 1; i <= (lg ? 3 : 2); i++) { P.put(sx0 + i, y, R, 1.4); P.put(sx0 + i, y + 1, R, 4.1); }
    if (lg && m) P.N(sx0 + 3, y, GL.ciano);
  }
  // a janela quadrada atravessando o fuste (k 1): a parede de cima e a da esquerda na sombra, as outras acesas
  let gy = tp + 3;
  if (k === 1) { const hx = sx0 + 5, hy = tp + 3; for (let j = -1; j <= 5; j++) for (let i = -1; i <= 5; i++) { if (i >= 0 && j >= 0 && i < 5 && j < 5) P.clear(hx + i, hy + j); else if (i === -1 || j === -1) P.put(hx + i, hy + j, R, i === -1 && j === -1 ? 1 : (j === -1 ? 1.2 : 1.6)); else P.put(hx + i, hy + j, R, 4.2); } gy = hy + 9; }
  for (let y = gy, n = 0; y + 6 < fb; y += 8, n++) { if (k === 2 && y + 6 >= 29 && y <= 33) continue; gcarve(P, sx0 + 5, y, (n * 3 + k) % AGLYPH.length, R, 3.1); }
  seams(P);
  return P.done();
}
function ancientStatue(k) {   // 44 x 96: a estátua de um Antigo no plinto de laje: alta e esguia, a cabeça comprida sem rosto (só o olho redondo gravado), a crista chata, o manto reto de caneluras; quatro braços em ângulo reto (k 0: os de cima erguidos com as palmas abertas para fora, os de baixo descidos; k 1: os de cima fecham um quadro em volta da cabeça, os de baixo seguram o disco de ferro estelar)
  const W = 44, H = 96, P = painter(W, H), s = 29211 + k, R = RP.pedra, L = RP.laje, cx = 22;
  const xr = (sd, a, w) => sd ? 2 * cx - a - w : a;   // espelha uma faixa [a, a + w) do lado esquerdo para o direito
  courses(P, 4, 85, 36, 11, L, s, 5, 12, 2.6); face(P, 2, 82, 40, 3, L, s + 1, 3.3);
  P.z = 1;
  for (let y = 47; y < 82; y++) { const hw = 7 + Math.floor((y - 47) / 12); for (let x = cx - hw; x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw, fl = (((x - cx) % 3) + 3) % 3 === 1 ? -0.7 : 0; P.put(x, y, R, 3.6 - u * 1.1 + fl + (x === cx - hw ? 0.8 : 0) + (y === 81 ? -0.6 : 0) + cg(x, y, s) * 0.12); } }
  P.z = 2;
  face(P, cx - 8, 26, 16, 7, R, s + 2, 3.7, 0.12); face(P, cx - 6, 33, 12, 13, R, s + 3, 3.4, 0.12); face(P, cx - 7, 45, 14, 3, L, s + 4, 3.4);
  for (let x = cx - 4; x < cx + 4; x++) { P.put(x, 29, R, 1.7); P.put(x, 36, R, 4.2); } for (let y = 29; y < 37; y++) { P.put(cx - 4, y, R, 1.7); P.put(cx + 3, y, R, 4); }   // o quadro do peito
  gcarve(P, cx - 2, 31, k ? 2 : 0, R, 3.2, true);
  face(P, cx - 2, 22, 4, 4, R, s + 5, 2.6);
  P.z = 3;
  // a cabeça comprida, as quinas de cima cortadas, o olho redondo gravado, os dois riscos da boca; a crista chata
  face(P, cx - 5, 8, 10, 14, R, s + 6, 3.8, 0.1); P.clear(cx - 5, 8); P.clear(cx + 4, 8);
  groove(P, cx, 13.5, 2, R, 3.4); for (const yy of [18, 20]) for (let x = cx - 3; x < cx + 3; x++) { P.put(x, yy, R, 1.9); P.put(x, yy + 1, R, 4.2); }
  face(P, cx - 2, 1, 4, 7, R, s + 7, 3.8);
  P.z = 4;
  for (const sd of [0, 1]) {
    const B = (a, y, w, h, base) => bar(P, xr(sd, a, w), y, w, h, R, s + 10 + sd, base + 0.4 - (sd ? 0.5 : 0));
    // o par de cima: o braço deitado sai do ombro
    B(cx - 17, 27, 9, 3, 3.3);
    if (!k) {
      B(cx - 19, 12, 3, 18, 3.3);                                   // o antebraço em pé
      B(cx - 20, 8, 5, 4, 3.6);                                     // a palma
      for (const f of [0, 2, 4]) B(cx - 20 + f, 4, 1, 4, 3.6);       // três dedos retos
      B(cx - 15, 9, 3, 1, 3.4);                                     // o polegar em ângulo reto, para dentro
      // o par de baixo: sai da cintura, desce
      B(cx - 14, 41, 8, 3, 3);
      B(cx - 15, 41, 3, 19, 3);
      B(cx - 16, 60, 5, 4, 3.2);
      for (const f of [0, 2, 4]) B(cx - 16 + f, 64, 1, 4, 3);
      B(cx - 11, 62, 3, 1, 3);
    } else {
      B(cx - 16, 6, 3, 24, 3.3);                                    // o antebraço sobe até acima da cabeça
      B(cx - 16, 3, 9, 3, 3.6);                                     // a mão deitada, os dedos juntos para dentro: o quadro
      B(cx - 7, 4, 4, 1, 3.4);
      B(cx - 13, 41, 6, 3, 3);
      B(cx - 13, 41, 3, 12, 3);                                     // desce
      B(cx - 13, 52, 6, 3, 3.1);                                    // e volta para dentro, segurando o disco
    }
  }
  if (k) { P.z = 5; orb(P, cx, 53.5, 5, RP.estelar, s + 20, 3); ring(P, cx, 53.5, 3.2, 3.2, 1, RP.estelar, s + 21, 1.8); P.N(cx - 1, 53, GL.ciano); }
  seams(P);
  return P.done();
}
function polyPedestal(k) {   // 24 x 48: o pedestal do poliedro flutuante: o pé, o fuste quadrado com a lateral na sombra, o capitel com a fenda de glifo acesa (k 0 laje com um glifo gravado; k 1 chapa antiga com os painéis; k 2 vidro de cratera escorrido de rocha fundida). O poliedro gira ao vivo em cima
  const W = 24, H = 48, P = painter(W, H), s = 29221 + k, R = [RP.laje, RP.chapa, RP.vidro][k];
  face(P, 1, H - 4, 22, 4, R, s, 2.6);
  P.z = 1;
  face(P, 5, 30, 12, H - 34, R, s + 1, 3.1); P.rect(17, 30, 2, H - 34, R, (i, j, x, y) => 1.7 - i * 0.6 + cg(x, y, s) * 0.1);
  P.z = 2;
  face(P, 3, 26, 18, 4, R, s + 2, 3.3);
  for (let x = 7; x < 17; x++) P.N(x, 26, x < 8 || x > 15 ? GL.fundo : x < 12 ? GL.claro : GL.ciano);
  if (k === 0) { gcarve(P, 8, 34, 6, R, 3.1); cut(P, 6, 41, 15, 41, R, 3.1); }
  else if (k === 1) { for (const x of [8, 13]) for (let y = 31; y < H - 5; y++) { P.put(x, y, R, 1.6); P.put(x + 1, y, R, 3.8); } P.N(10, 36, GL.ciano); P.N(11, 36, GL.fundo); }
  else { for (const [x, l] of [[3, 3], [4, 6], [19, 4], [20, 2], [10, 2]]) for (let j = 0; j < l; j++) P.put(x, 30 + j, RP.fundida, 3 - j * 0.3); P.N(4, 33, ST.palido); P.N(19, 31, ST.branco); for (let y = 32; y < 42; y++) P.put(7, y, R, 4.6); }
  seams(P);
  return P.done();
}
function armillary(k) {   // 38 x 50: a esfera armilar de ferro estelar: o pé em dois degraus, a haste, o berço de meia-volta, o meridiano, o equador e a eclíptica (as metades de trás atrás da esferinha, as da frente na frente), a esferinha de glifo no miolo (k 1: o pé de chapa, o coluro em pé no lugar da eclíptica)
  const W = 38, H = 50, P = painter(W, H), s = 29231 + k, M = RP.estelar, B = k ? RP.chapa : RP.laje, cx = 19, cy = 19;
  face(P, 7, H - 5, 24, 5, B, s, 2.6); face(P, 10, H - 8, 18, 3, B, s + 1, 3);
  bar(P, 18, 35, 3, H - 8 - 35, M, s + 2, 2.6);
  ring(P, cx, cy, 17, 17, 2, M, s, 2.4, a => Math.sin(a) > 0.62);
  P.z = 1;
  ring(P, cx, cy, 14, 4.5, 1.6, M, s + 3, 2, a => Math.sin(a) < 0);
  if (!k) ring(P, cx, cy, 14, 4.5, 1.6, M, s + 4, 2, a => Math.sin(a) < 0, 0.5);
  else ring(P, cx, cy, 6, 14, 1.6, M, s + 4, 2, a => Math.cos(a) < 0);
  P.z = 2;
  ring(P, cx, cy, 14, 14, 2.1, M, s + 5, 3.1);
  orb(P, cx, cy, 4.2, RP.glifo, s + 6, 2.2); P.N(cx - 1, cy - 1, GL.claro); P.N(cx - 2, cy - 1, GL.ciano); P.N(cx - 1, cy - 2, GL.ciano);
  P.z = 3;
  ring(P, cx, cy, 14, 4.5, 1.6, M, s + 3, 3.3, a => Math.sin(a) >= 0);
  if (!k) ring(P, cx, cy, 14, 4.5, 1.6, M, s + 4, 3.3, a => Math.sin(a) >= 0, 0.5);
  else ring(P, cx, cy, 6, 14, 1.6, M, s + 4, 3.3, a => Math.cos(a) >= 0);
  for (const [x, y] of [[cx, cy - 15], [cx, cy + 15]]) orb(P, x, y, 1.6, M, s + 7, 3.4);
  seams(P);
  return P.done();
}
function draftBoard(k) {   // 40 x 32: a prancheta: o tampo de pedra lisa inclinado para trás, a borda grossa embaixo, dois pés quadrados com a travessa, a sapata; a planta gravada no tampo com os cantos acesos (k 0 uma casa de salas retas; k 1 a cidade redonda, anéis e ruas em cruz)
  const W = 40, H = 32, P = painter(W, H), s = 29241 + k, L = RP.laje, R = RP.pedra;
  face(P, 3, H - 3, 34, 3, L, s, 2.5);
  bar(P, 8, 19, 3, H - 22, L, s + 1, 2.8); bar(P, 29, 19, 3, H - 22, L, s + 2, 2.4); bar(P, 11, 24, 18, 2, L, s + 3, 2.3);
  P.z = 1;
  const sh = y => Math.round((18 - y) * 0.25), X = (u, y) => u + sh(y);
  shape(P, 0, 0, W - 1, 20, (x, y) => y >= 2 && y <= 19 && x >= 2 + sh(y) && x < 36 + sh(y), R, s + 4, 3.1, 0.12, (x, y) => -(x - sh(y)) / W * 0.5 + (y >= 17 ? -1 : 0));
  const eng = (u, y) => { P.put(X(u, y), y, R, 1.5); }, lip = (u, y) => { P.put(X(u, y), y, R, 4.2); };
  const hl = (u0, u1, y) => { for (let u = u0; u <= u1; u++) { eng(u, y); lip(u, y + 1); } }, vl = (u, y0, y1) => { for (let y = y0; y <= y1; y++) { eng(u, y); lip(u + 1, y); } };
  if (!k) {
    hl(6, 31, 4); hl(6, 31, 14); vl(6, 4, 14); vl(31, 4, 14); vl(15, 4, 9); vl(15, 12, 14); hl(15, 31, 9); vl(24, 9, 14); hl(6, 11, 10);
    for (const [u, y, c] of [[6, 4, GL.fundo], [31, 4, GL.fundo], [6, 14, GL.fundo], [31, 14, GL.ciano], [15, 9, GL.claro], [24, 9, GL.fundo]]) P.N(X(u, y), y, c);
  } else {
    const cu = 18, cy = 9;
    for (let y = 3; y < 17; y++) for (let u = 6; u < 31; u++) { const d = Math.hypot(u + 0.5 - cu, (y + 0.5 - cy) * 1.15); if (Math.abs(d - 6.5) < 0.5 || Math.abs(d - 3.5) < 0.5) eng(u, y); else if ((d - 6.5 >= 0.5 && d - 6.5 < 1.3) || (d - 3.5 >= 0.5 && d - 3.5 < 1.3)) lip(u, y); }
    hl(9, 27, cy); vl(cu, 3, 15);
    P.N(X(cu, cy), cy, GL.claro); for (const [u, y] of [[cu - 7, cy], [cu + 6, cy], [cu, 3], [cu, 15]]) P.N(X(u, y), y, GL.fundo);
  }
  seams(P);
  return P.done();
}
function construct(k) {   // 32 x 34: o construto desligado, ajoelhado: chapa antiga verde-cinza, a cabeça um cubo de laje com a fenda do olho apagada, o núcleo do peito escuro; o braço de trás pende até o chão, o da frente apoia no joelho (k 1: mais caído, a cabeça mais baixa, as duas mãos no chão)
  const W = 32, H = 34, P = painter(W, H), s = 29251 + k, C = RP.chapa, Hd = RP.laje, J = RP.vazio;
  bar(P, 9, 10, 3, 19, C, s, 1.8); face(P, 7, 29, 6, 4, C, s + 1, 1.9);
  bar(P, 12, 20, 5, 10, C, s + 2, 2.2); face(P, 3, 29, 15, 4, C, s + 3, 2.5); face(P, 1, 26, 3, 7, C, s + 4, 2.3);
  P.z = 1;
  face(P, 14, 19, 12, 5, C, s + 5, 3); bar(P, 22, 23, 5, 8, C, s + 6, 2.9); face(P, 21, 30, 9, 3, C, s + 7, 2.7);
  orb(P, 24.5, 21.5, 2.4, RP.estelar, s + 8, 2.6);
  P.z = 2;
  const ty = k ? 7 : 6;
  face(P, 8, ty, 12, 10, C, s + 9, 3.2); face(P, 10, ty + 10, 8, 4, C, s + 10, 2.6);
  orb(P, 13.5, ty + 5, 2.2, RP.glifo, s + 11, 1.1, 0.6); P.put(12, ty + 4, RP.glifo, 2.2);
  for (let x = 9; x < 19; x++) P.put(x, ty + 8, C, 1.6);
  P.z = 3;
  const hx = 16 + k, hy = k ? 4 : 1;
  face(P, hx, hy, 8, 7, Hd, s + 12, 3.4); for (let x = hx + 3; x < hx + 7; x++) P.put(x, hy + 4, J, 1.4); P.put(hx + 7, hy + 4, J, 1);
  P.z = 4;
  orb(P, 15, ty + 2, 2.4, C, s + 13, 3.3);
  if (!k) { bar(P, 14, ty + 2, 3, 10, C, s + 14, 3.1); face(P, 14, 16, 11, 3, C, s + 15, 3.1); face(P, 24, 14, 4, 5, C, s + 16, 3.2); }
  else { bar(P, 15, ty + 2, 3, 22, C, s + 14, 3.1); face(P, 14, 29, 6, 4, C, s + 15, 3); }
  seams(P);
  return P.done();
}

/* =============================== AS MÁQUINAS =============================== */
function gearMachine(k) {   // 52 x 40 (k 1: 40 x 48): a máquina de engrenagens: a armação de chapa (viga em cima, dois montantes, a base), o fundo escuro, três engrenagens de pedra engrenadas com os cubos de ferro estelar, a viga com glifos e uma lâmpada (k 1: alta, duas rodas empilhadas e a alavanca em esquadro)
  const W = k ? 40 : 52, H = k ? 48 : 40, P = painter(W, H), s = 29261 + k, C = RP.chapa, L = RP.laje, V = RP.vazio;
  P.rect(5, 6, W - 10, H - 10, V, (i, j, x, y) => 2.4 - (i < 2 || j < 2 ? 0.7 : 0) + ((x - 5) % 8 === 0 ? 0.4 : 0) + cg(x, y, s) * 0.1);
  face(P, 0, 1, W, 5, C, s, 3.2); face(P, 1, 6, 5, H - 10, C, s + 1, 3); face(P, W - 6, 6, 5, H - 10, C, s + 2, 2.6); face(P, 0, H - 4, W, 4, C, s + 3, 2.8);
  for (let x = 4, n = 0; x + 3 < W - 4; x += 5, n++) if (n % 3 !== 1) gcarve(P, x, 2, n + k, C, 3.2, true); else { P.N(x + 1, 3, GL.ciano); P.N(x + 2, 3, GL.fundo); }
  P.z = 1;
  if (!k) {
    gear(P, 18, 21, 12, 12, 0.1, L, s + 4, 3.5, { ns: 4 });
    P.z = 2; gear(P, 35, 15, 8, 9, 0.35, L, s + 5, 3.7, { ns: 0 });
    P.z = 3; gear(P, 37, 29, 5.5, 7, 0.2, L, s + 6, 3.4, { ns: 0 });
  } else {
    gear(P, 20, 15, 10, 10, 0.2, L, s + 4, 3.6, { ns: 4 });
    P.z = 2; gear(P, 20, 33, 9, 9, 0.5, L, s + 5, 3.4, { ns: 4 });
    P.z = 3; bar(P, W - 5, 12, 3, 12, RP.estelar, s + 6, 2.8); bar(P, W - 5, 10, 8, 3, RP.estelar, s + 7, 3.2); orb(P, W - 4, 24, 2.2, RP.estelar, s + 8, 3);
  }
  seams(P);
  return P.done();
}
function coil(k) {   // 24 x 46 (k 1: 34 x 46): a bobina de luz: a base de laje, o núcleo de chapa, o fio de luz enrolado em voltas (ciano aceso, o lado da esquerda mais claro como um cilindro), as golas de ferro estelar e a esfera no alto (k 1: duas colunas ligadas pela barra de cima)
  const W = k ? 34 : 24, H = 46, P = painter(W, H), s = 29271 + k, L = RP.laje, C = RP.chapa, M = RP.estelar;
  courses(P, 1, H - 6, W - 2, 6, L, s, 3, 8, 2.6); face(P, 0, H - 8, W, 2, L, s + 1, 3.3);
  const WIRE = [GL.miolo, GL.claro, GL.claro, GL.ciano, GL.ciano, GL.ciano, GL.fundo, GL.fundo, GL.escuro, GL.escuro], WIRE2 = [GL.claro, GL.ciano, GL.ciano, GL.fundo, GL.fundo, GL.fundo, GL.escuro, GL.escuro, GL.escuro, GL.escuro];
  const col = (cx, y0, y1, ss) => {
    P.z = 1; bar(P, cx - 3, y0, 6, y1 - y0, C, ss, 2);
    P.z = 2;
    for (let y = y0 + 3; y < y1 - 3; y++) { const r = (y - y0 - 3) % 3; if (r === 2) continue; for (let i = 0; i < 10; i++) P.N(cx - 5 + i, y, (r ? WIRE2 : WIRE)[i]); }
    face(P, cx - 6, y0, 12, 3, M, ss + 1, 3.3); face(P, cx - 6, y1 - 3, 12, 3, M, ss + 2, 2.9);
    P.z = 3; orb(P, cx, y0 - 4.5, 4.2, M, ss + 3, 3.1); P.N(cx - 2, y0 - 7, ST.branco); P.N(cx - 1, y0 - 7, ST.palido);
  };
  if (!k) col(12, 11, H - 8, s + 2);
  else { col(9, 13, H - 8, s + 2); col(25, 13, H - 8, s + 6); P.z = 4; bar(P, 9, 3, 17, 3, M, s + 9, 3); for (let x = 13; x < 22; x++) P.N(x, 4, x % 3 ? GL.ciano : GL.claro); }
  seams(P);
  return P.done();
}
function workbench(k) {   // 54 x 34 (k 1: 54 x 40): a bancada de laje: o tampo, dois pés e a prateleira; em cima, um construto pela metade (k 0: deitado, o peito aberto mostrando os fios de glifo apagados, a cabeça solta, um braço solto, o esquadro de ferro estelar em pé; k 1: sentado, sem pernas, um braço só, o peito aberto, a cabeça torta)
  const by = k ? 24 : 18, W = 54, H = by + 16, P = painter(W, H), s = 29281 + k, L = RP.laje, C = RP.chapa, V = RP.vazio, M = RP.estelar;
  face(P, 3, by + 4, 7, 12, L, s, 2.6); face(P, 44, by + 4, 7, 12, L, s + 1, 2.3); face(P, 10, by + 10, 34, 2, L, s + 2, 2.4);
  for (const [x, y] of [[16, by + 8], [26, by + 9], [36, by + 8]]) face(P, x, y, 4, 2, C, s + x, 2.6);
  P.z = 1; face(P, 0, by, 54, 4, L, s + 3, 3.3); gcarve(P, 22, by + 1, 3, L, 3.1, true); gcarve(P, 27, by + 1, 1, L, 3.1, true);
  P.z = 2;
  const chest = (x0, y0, w, h) => { P.rect(x0, y0, w, h, V, (i, j) => 1.3 - (i === 0 || j === 0 ? 0.6 : 0)); for (let y = y0 + 1; y < y0 + h - 1; y += 2) for (let x = x0 + 1; x < x0 + w - 1; x++) if ((x + y) % 5) P.put(x, y, RP.glifo, 1.4 + (x === x0 + 1 ? 0.4 : 0)); orb(P, x0 + (w >> 1), y0 + (h >> 1), 1.6, RP.glifo, s, 1.1, 0.5); };
  if (!k) {
    bar(P, 3, by - 10, 2, 10, M, s + 4, 3.2); bar(P, 3, by - 2, 9, 2, M, s + 5, 3.4); for (let y = by - 9; y < by - 2; y += 2) P.put(4, y, M, 1.6);
    face(P, 13, by - 9, 18, 9, C, s + 6, 3); chest(16, by - 7, 11, 6);
    face(P, 33, by - 7, 7, 7, L, s + 7, 3.4); for (let x = 35; x < 39; x++) P.put(x, by - 4, V, 1.4);
    bar(P, 41, by - 3, 9, 3, C, s + 8, 3); face(P, 50, by - 4, 3, 4, C, s + 9, 3.2);
  } else {
    face(P, 18, by - 4, 16, 4, C, s + 6, 2.8);
    face(P, 19, by - 18, 14, 14, C, s + 7, 3.1); chest(22, by - 15, 8, 8);
    orb(P, 20, by - 16, 2.4, C, s + 8, 3.2); bar(P, 13, by - 16, 7, 3, C, s + 9, 3.1); bar(P, 13, by - 16, 3, 12, C, s + 10, 3); face(P, 12, by - 4, 5, 4, C, s + 11, 3.1);
    P.z = 3; face(P, 22, by - 24, 7, 6, L, s + 12, 3.4); for (let x = 24; x < 28; x++) P.put(x, by - 21, V, 1.4);
    bar(P, 40, by - 3, 10, 3, M, s + 13, 3.2); for (let x = 41; x < 49; x += 2) P.put(x, by - 3, M, 1.6);
  }
  seams(P);
  return P.done();
}
function pistonFrame() {   // 40 x 98: o pistão gigante em pé no chão: a caixa de cima em fiadas de laje com a fenda da haste, os dois trilhos de chapa, o fundo do poço escuro com as riscas de medida em glifo apagado, a base e a placa de bater; o êmbolo e a haste são ao vivo
  const W = 40, H = 98, P = painter(W, H), s = 29321, L = RP.laje, C = RP.chapa, V = RP.vazio;
  P.rect(7, 14, 26, 72, V, (i, j, x, y) => 1.7 - (i < 2 ? 0.7 : 0) - (j < 3 ? 0.6 : 0) + ((y - 14) % 12 === 11 ? -0.6 : 0) + cg(x, y, s) * 0.08);
  for (let y = 18, n = 0; y < 82; y += 6, n++) { const lg = n % 2 === 0; for (let i = 0; i < (lg ? 4 : 2); i++) { P.put(8 + i, y, RP.glifo, lg ? 1.6 : 1.1); P.put(31 - i, y, RP.glifo, lg ? 1.3 : 1); } }
  bar(P, 2, 14, 5, 72, C, s + 1, 3); bar(P, 33, 14, 5, 72, C, s + 2, 2.8);
  for (let y = 16; y < 86; y++) { P.put(5, y, C, 1.6); P.put(34, y, C, 1.4); }
  P.z = 1;
  courses(P, 0, 0, 40, 14, L, s + 3, 7, 10, 2.8); P.rect(15, 12, 10, 2, V, (i, j) => 0.6 + j * 0.5);
  gcarve(P, 3, 3, 4, L, 3, true); gcarve(P, 34, 3, 2, L, 2.8, true);
  courses(P, 0, 86, 40, 12, L, s + 4, 6, 10, 2.7);
  P.z = 2; face(P, 7, 82, 26, 4, C, s + 5, 3.1); for (let x = 17; x < 23; x++) P.put(x, 83, RP.glifo, 1.3);
  seams(P);
  return P.done();
}
const PIST = { x: 7, rx: 16, y0: 14, top: 20, bot: 66 };
// o êmbolo (26 x 16) e a haste (8 x 56), assados uma vez
function pistonRam() {
  const P = painter(26, 16), s = 29331, M = RP.estelar, C = RP.chapa;
  face(P, 0, 0, 26, 12, C, s, 3.1); face(P, 1, 12, 24, 4, M, s + 1, 2.6);
  for (let x = 3, n = 0; x + 3 < 24; x += 5, n++) gcarve(P, x, 4, n + 2, C, 3.1, true);
  P.done(); return P;
}
function pistonRod() {
  const P = painter(8, 56), V = [4.6, 5, 4, 3.3, 2.8, 2.3, 1.7, 1.2];
  P.rect(0, 0, 8, 56, RP.estelar, (i, j, x, y) => V[i] - ((55 - j) % 12 === 0 ? 1.2 : 0) + cg(x, y, 29341) * 0.08);
  P.done(false); return P;
}
function wallGearSocket() {   // 78 x 84: a engrenagem de parede gigante: o encaixe redondo e fundo na parede (a borda de cima à esquerda na sombra), a gola de laje em volta, o berço de laje no chão; a roda gira ao vivo dentro
  const W = 78, H = 84, P = painter(W, H), s = 29351, L = RP.laje, V = RP.vazio, cx = 39, cy = 39;
  P.ell(cx, cy, 36, 36, (x, y, dx, dy, d) => P.put(x, y, V, 1.6 + (dx + dy) * 0.5 + (d > 0.8 ? (dx + dy < 0 ? -0.8 : 0.9) : 0) + cg(x, y, s) * 0.1));
  orb(P, cx, cy, 9, RP.estelar, s + 1, 1.8);
  ring(P, cx, cy, 37.5, 37.5, 2.6, L, s + 2, 2.9);
  P.z = 1;
  courses(P, 22, 75, 34, 9, L, s + 3, 5, 9, 2.8, (x, y) => y > 75 || Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > 36);
  face(P, 20, 74, 4, 10, L, s + 4, 3.1); face(P, 54, 74, 4, 10, L, s + 5, 2.6);
  seams(P);
  return P.done();
}
function dialPanel(k) {   // 50 x 32 (k 1: 44 x 34): o painel de mostradores: a chapa com a aresta de cima acesa, três mostradores redondos (aro de ferro estelar, o fundo escuro, as riscas e o ponteiro acesos em ciano) e a fileira de lâmpadas quadradas embaixo (k 1: um mostrador grande e três réguas de nível)
  const W = k ? 44 : 50, H = k ? 34 : 32, P = painter(W, H), s = 29361 + k, C = RP.chapa, M = RP.estelar, V = RP.vazio;
  face(P, 0, 0, W, H, C, s, 2.9); for (let x = 2; x < W - 2; x++) { P.put(x, 2, C, 1.7); P.put(x, H - 3, C, 3.8); }
  const dial = (cx, cy, r, ang, ss) => {
    P.z = 1; orb(P, cx, cy, r, V, ss, 1.5, 0.5); ring(P, cx, cy, r + 0.6, r + 0.6, 1.8, M, ss + 1, 3);
    for (let t = 0; t < 8; t++) { const a = t * Math.PI / 4; P.N(cx + Math.cos(a) * (r - 1.6) - 0.5, cy + Math.sin(a) * (r - 1.6) - 0.5, t % 2 ? GL.escuro : GL.fundo); }
    P.nline(cx - 0.5, cy - 0.5, cx - 0.5 + Math.cos(ang) * (r - 2), cy - 0.5 + Math.sin(ang) * (r - 2), t => t > 0.6 ? GL.claro : GL.ciano); P.N(cx - 0.5, cy - 0.5, GL.miolo);
  };
  if (!k) {
    dial(11, 13, 6, -2.2, s + 2); dial(25, 13, 6, -0.9, s + 4); dial(39, 13, 6, 0.4, s + 6);
    for (let i = 0; i < 6; i++) { const x = 8 + i * 6; P.z = 2; for (let j = 0; j < 2; j++) for (let q = 0; q < 2; q++) P.N(x + q, 24 + j, i % 3 === 1 ? (q || j ? GL.ciano : GL.claro) : (q || j ? GL.escuro : GL.fundo)); P.put(x - 1, 24, C, 1.6); P.put(x + 2, 26, C, 3.8); }
  } else {
    dial(14, 16, 10, -1.8, s + 2);
    for (let i = 0; i < 3; i++) { const x = 29 + i * 5, lv = [6, 11, 3][i]; P.z = 2; P.rect(x, 5, 3, 22, V, (q, j) => 1.2 - (q === 0 ? 0.4 : 0)); for (let j = 0; j < lv; j++) for (let q = 0; q < 2; q++) P.N(x + q, 25 - j, j === lv - 1 ? GL.claro : q ? GL.fundo : GL.ciano); P.put(x - 1, 5, C, 1.5); }
    for (let x = 4; x < 25; x += 4) gcarve(P, x, H - 7, x, C, 2.9, true);
  }
  seams(P);
  return P.done();
}
function hangConduit(k) {   // 66 x 26 (k 1: 46 x 30): o conduto pendurado: as duas alças de ferro estelar do teto, o tubo de chapa (cilindro, o lado de cima aceso), o vidro correndo ao comprido com a luz ciano por dentro, as luvas a cada 16 px, as flanges das pontas (k 1: o cotovelo sobe e entra no teto)
  const W = k ? 46 : 66, H = k ? 30 : 26, P = painter(W, H), s = 29371 + k, C = RP.chapa, M = RP.estelar, ty = H - 18, x0 = k ? 12 : 0;
  const TV = [4.4, 4, 3.6, 3.3, 3, 2.8, 2.6, 2.4, 2.1, 1.8, 1.5, 1.1];
  for (const sx of (k ? [30] : [10, 54])) { bar(P, sx - 1, 0, 3, ty, M, s + sx, 2.8); }
  if (k) { P.rect(0, 0, 12, ty + 12, C, (i, j, x, y) => [4, 4.3, 3.8, 3.4, 3.1, 2.8, 2.5, 2.2, 2, 1.7, 1.4, 1][i] + cg(x, y, s) * 0.1); face(P, -1, 0, 14, 3, M, s + 1, 3.2); }
  P.z = 1;
  P.rect(x0, ty, W - x0, 12, C, (i, j, x, y) => TV[j] + cg(x, y, s) * 0.1 - (k && i < 3 ? 0.6 - i * 0.2 : 0));
  for (let x = x0 + 3; x < W - 3; x++) { P.N(x, ty + 4, GL.escuro); P.N(x, ty + 5, GL.fundo); P.N(x, ty + 6, GL.escuro); P.put(x, ty + 3, C, 1.6); P.put(x, ty + 7, C, 4.2); P.mark('corre', x, ty + 5); }
  P.z = 2;
  for (let x = x0 + 14; x < W - 6; x += 16) P.rect(x, ty - 1, 3, 14, M, (i, j) => (i === 0 ? 4.3 : i === 1 ? 3.3 : 2.2) - j * 0.08 + (j === 0 ? 0.6 : 0));
  if (!k) P.rect(0, ty - 2, 3, 16, M, (i, j) => (i === 0 ? 4.4 : 3) - j * 0.1);
  P.rect(W - 3, ty - 2, 3, 16, M, (i, j) => (i === 0 ? 3.6 : 2.2) - j * 0.1);
  if (k) P.rect(0, ty + 12, 12, 2, M, (i) => 3.6 - i * 0.12);
  seams(P);
  return P.done();
}

/* =============================== A CRATERA DA ESTRELA =============================== */
// a rocha fundida no pé: um monte liso e lustroso, veios brancos acesos
function meltBase(P, cx, by, rx, ry, s) {
  shape(P, Math.floor(cx - rx - 1), Math.floor(by - ry - 1), Math.ceil(cx + rx + 1), by, (x, y) => y <= by && ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - by) / ry) ** 2 <= 1 + cg(x >> 2, 0, s) * 0.12, RP.fundida, s, 2.4, 0.15, (x, y) => -(x - cx) / rx * 0.7);
  for (let i = 0; i < 4; i++) { const x = cx + (hash2(i, 1, s) - 0.5) * rx * 1.4, y = by - 1 - hash2(i, 2, s) * ry * 0.5; P.N(x, y, i % 2 ? ST.violeta : ST.palido); }
}
function starShard(k) {   // 34 x 46 (k 1: 40 x 40; k 2: 44 x 30): a lasca grande da estrela: o prisma branco-violeta cravado na rocha fundida, a face da esquerda acesa e a da direita na sombra, a aresta do meio clara, o veio de luz branca por dentro e a ponta acesa (k 1: duas em V; k 2: deitada na diagonal)
  const W = [34, 40, 44][k], H = [46, 40, 30][k], P = painter(W, H), s = 29401 + k, S = RP.estrela;
  const prism = (A, tip, B, foot, core) => {   // A e B as quinas de baixo, tip a ponta, foot o pé da aresta do meio
    facet(P, [A, tip, foot], S, s, 4, -0.6, 0.3); facet(P, [tip, B, foot], S, s + 1, 2.2, -0.4, 0.4);
    P.line(tip[0], tip[1], foot[0], foot[1], S, 5);
    for (let i = 0; i <= 12; i++) { const t = 0.12 + i / 12 * 0.7, x = tip[0] + (foot[0] - tip[0]) * t - (foot[0] - A[0]) * 0.35 * t, y = tip[1] + (foot[1] - tip[1]) * t; P.N(x, y, t < 0.4 ? ST.miolo : t < 0.65 ? ST.branco : ST.palido); }
    P.N(tip[0], tip[1], ST.miolo);
  };
  if (k === 0) { meltBase(P, 17, 45, 15, 6, s); P.z = 1; prism([10, 42], [15, 1], [26, 42], [19, 42]); P.z = 2; prism([24, 43], [29, 24], [32, 43], [29.5, 43]); }
  else if (k === 1) { meltBase(P, 20, 39, 18, 6, s); P.z = 1; prism([8, 37], [3, 4], [17, 37], [12, 37]); P.z = 2; prism([18, 37], [35, 3], [28, 37], [24, 37]); }
  else { meltBase(P, 16, 29, 15, 5, s); P.z = 1; facet(P, [[4, 27], [37, 2], [24, 27]], S, s, 3.9, 0, 0.4); facet(P, [[37, 2], [41, 6], [30, 28], [24, 27]], S, s + 1, 2.1); P.line(37, 2, 24, 27, S, 5); P.nline(33, 8, 18, 24, t => t < 0.4 ? ST.miolo : ST.branco); P.N(37, 2, ST.miolo); }
  seams(P);
  return P.done();
}
function meltDrop(k) {   // 26 x 28: a pedra fundida em gota: um bloco de laje perfeito em cima que derreteu embaixo numa gota de rocha fundida lustrosa, a poça no chão, os veios brancos (k 1: o bloco caiu de lado e só a metade da direita derreteu)
  const W = 26, H = 28, P = painter(W, H), s = 29411 + k, L = RP.laje, F = RP.fundida;
  if (!k) {
    courses(P, 4, 0, 18, 12, L, s, 6, 9, 2.9);
    P.z = 1;
    const hw = y => { const t = (y - 10) / 15; return 9 * (1 - t * 0.55) + Math.sin(t * Math.PI) * 2.5; };
    shape(P, 0, 10, W - 1, H - 1, (x, y) => y >= 10 && y < H && (Math.abs(x + 0.5 - 13) <= hw(y) || (y >= H - 3 && Math.abs(x + 0.5 - 13) <= 12 - (H - 1 - y) * 2.5)), F, s + 1, 3, 0.1, (x, y) => -(x + 0.5 - 13) / 10 * 1.3);
    for (const x of [5, 9, 20]) for (let j = 0; j < (x === 9 ? 4 : 2); j++) P.put(x, 9 - j * 0, F, 2.4);
    for (let y = 13; y < 22; y++) P.put(13 - hw(y) * 0.55, y, F, 5);
    P.nline(15, 12, 17, 20, t => t < 0.5 ? ST.palido : ST.violeta); P.N(10, 25, ST.palido);
  } else {
    courses(P, 2, 8, 13, 19, L, s, 6, 7, 2.8);
    P.z = 1;
    shape(P, 8, 6, W - 1, H - 1, (x, y) => inPoly(x + 0.5, y + 0.5, [[13, 8], [19, 10], [23, 18], [25, 27], [9, 27], [12, 20]]), F, s + 1, 3, 0.1, (x, y) => -(x - 13) / 12 * 1.1);
    for (let y = 12; y < 20; y++) P.put(15 + (y - 12) * 0.4, y, F, 5);
    P.nline(17, 14, 21, 24, ST.palido); P.N(14, 25, ST.violeta);
  }
  seams(P);
  return P.done();
}
function meteorite(k) {   // 44 x 32 (k 1: 36 x 26): o meteorito cravado no chão: o corpo de ferro estelar violeta-prata, liso e pontilhado de cavidades, enterrado até a metade, os veios brancos acesos; em volta, o respingo de rocha fundida e vidro que o choque fez (k 1: menor e inclinado)
  const W = k ? 36 : 44, H = k ? 26 : 32, P = painter(W, H), s = 29421 + k, M = RP.estelar, cx = W / 2, by = H - 3;
  shape(P, 0, by - 4, W - 1, H - 1, (x, y) => ((x + 0.5 - cx) / (W / 2 - 0.5)) ** 2 + ((y + 0.5 - (H - 1)) / 4.5) ** 2 <= 1, RP.fundida, s, 2.2, 0.12, (x, y) => -(x - cx) / W * 0.8);
  for (let i = 0; i < 6; i++) P.put(2 + hash2(i, 3, s) * (W - 4), H - 2 - (i % 2), RP.vidro, 4.5);
  P.z = 1;
  const rx = k ? 11 : 15, ry = k ? 9 : 12, ccy = by - ry * 0.55, rot = k ? -0.5 : 0.12, cr = Math.cos(rot), sr = Math.sin(rot);
  const pits = []; for (let i = 0; i < 7; i++) { const a = hash2(i, 0, s) * 6.28, r = Math.sqrt(hash2(i, 1, s)) * 0.75; pits.push([cx + Math.cos(a) * rx * r, ccy + Math.sin(a) * ry * r, 1.6 + hash2(i, 2, s) * 1.4]); }
  const IN = (x, y) => { if (y > by) return 0; const X = x + 0.5 - cx, Y = y + 0.5 - ccy, u = X * cr + Y * sr, v = -X * sr + Y * cr; return (u / rx) ** 2 + (v / ry) ** 2 <= 1 + Math.sin(Math.atan2(v, u) * 5 + s) * 0.05; };
  shape(P, 0, 0, W - 1, by, IN, M, s + 1, 2.4, 0.14, (x, y) => { let t = -((x - cx) / rx + (y - ccy) / ry) * 0.7; for (const [px, py, pr] of pits) { const d = Math.hypot(x + 0.5 - px, (y + 0.5 - py) * 1.3); if (d < pr) t -= 1.2; else if (d < pr + 1 && x + y > px + py) t += 0.8; } return t; });
  P.nline(cx - rx * 0.3, ccy - ry * 0.2, cx + rx * 0.2, ccy + ry * 0.5, t => t < 0.5 ? ST.palido : ST.violeta); P.N(cx - rx * 0.5, ccy - ry * 0.5, ST.branco); P.N(cx + rx * 0.4, ccy - ry * 0.1, ST.violeta);
  seams(P);
  return P.done();
}
function glassBasin(k) {   // 46 x 26: a bacia de vidro de cratera: a tigela rasa sobre o pé curto, a boca em elipse com a borda acesa, o fundo escuro com pó de estrela, o reflexo verde em risca na esquerda (k 1: mais funda, as paredes em caneluras retas)
  const W = 46, H = 26, P = painter(W, H), s = 29431 + k, V = RP.vidro, cx = 23, ty = 6, ry = k ? 16 : 14;
  face(P, 16, 20, 14, 6, V, s, 2.2); face(P, 13, H - 2, 20, 2, V, s + 1, 2);
  P.z = 1;
  shape(P, 0, ty, W - 1, 21, (x, y) => y >= ty && y < 21 && ((x + 0.5 - cx) / 21) ** 2 + ((y + 0.5 - ty) / ry) ** 2 <= 1, V, s + 2, 2.3, 0.08, (x, y) => -(x + 0.5 - cx) / 21 * 1.2 + (k && ((x - cx) % 4 + 4) % 4 === 0 ? (x < cx ? 0.8 : -0.8) : 0));
  for (let y = ty + 3; y < 17; y++) { P.put(cx - 15, y, V, 5); P.put(cx - 14, y, V, 4); }
  P.put(cx + 16, ty + 4, V, 4.5);
  P.z = 2;
  P.ell(cx, ty, 20, 2.6, (x, y) => P.put(x, y, V, 0.6 + (y + 0.5 - ty) * 0.3));
  ring(P, cx, ty, 20.5, 3, 1.3, V, s + 3, 3.6);
  for (let i = 0; i < 6; i++) P.N(cx - 14 + i * 5.5 + hash2(i, 0, s) * 2, ty + (i % 2 ? 0 : 1), i % 3 ? ST.violeta : ST.palido);
  seams(P);
  return P.done();
}
function radialCrack(k) {   // 56 x 48 (k 1: 66 x 40): a rachadura radial acesa na parede: raios retos de rocha fundida saindo de um ponto derretido, o miolo branco aceso dentro de cada um (mais claro perto do centro), ramos pequenos (só a rachadura: a parede é a da sala)
  const W = k ? 66 : 56, H = k ? 40 : 48, P = painter(W, H), s = 29441 + k, F = RP.fundida, cx = W / 2, cy = H / 2;
  const n = k ? 8 : 7, rays = [];
  for (let i = 0; i < n; i++) { const a = (i + hash2(i, 0, s) * 0.6) / n * 6.283, L = (k ? 16 : 13) + hash2(i, 1, s) * (k ? 16 : 10); rays.push([a, L]); if (hash2(i, 2, s) < 0.6) rays.push([a + (hash2(i, 3, s) - 0.5) * 0.9, L * 0.45, L * 0.4]); }
  const core = [];
  for (const [a, L, st] of rays) {
    const ax = Math.cos(a) * (k ? 1.3 : 1), ay = Math.sin(a), s0 = st || 0;
    for (let t = s0; t <= L; t += 0.5) {
      const j = Math.round((hash2(Math.floor(t / 4), Math.floor(a * 10), s) - 0.5) * 1.6), x = cx + ax * t - ay * j * 0.6, y = cy + ay * t + ax * j * 0.6, wd = Math.max(1, 3.2 * (1 - t / (L + 2)) * (st ? 0.6 : 1));
      P.ell(x, y, wd / 2 + 0.3, wd / 2 + 0.3, (xx, yy) => { if (!P.has(xx, yy)) P.put(xx, yy, F, 1.4 + cg(xx, yy, s) * 0.3); });
      if (wd > 1.4) core.push(x, y, t / L);
    }
  }
  for (let i = 0; i < core.length; i += 3) P.N(core[i], core[i + 1], core[i + 2] < 0.25 ? ST.miolo : core[i + 2] < 0.55 ? ST.branco : core[i + 2] < 0.8 ? ST.palido : ST.violeta);
  P.ell(cx, cy, 4, 4, (x, y, dx, dy, d) => { if (d < 0.35) P.N(x, y, ST.miolo); else if (d < 0.6) P.N(x, y, ST.branco); else P.put(x, y, F, 2.2 - (dx + dy) * 0.8); });
  return P.done();
}
function glassStalactite(k) {   // 26 x 52 (k 1: 30 x 46): a estalactite de vidro grande: o pé de vidro preso no teto e o cone de três facetas retas descendo até a ponta (a da esquerda acesa, a do meio no meio-tom, a da direita escura), as arestas claras, o reflexo verde (k 1: duas, uma grande e uma menor)
  const W = k ? 30 : 26, H = k ? 46 : 52, P = painter(W, H), s = 29451 + k, V = RP.vidro;
  const cone = (x0, x1, tip, hb, ss) => {
    const a = x0 + (x1 - x0) * 0.36, b = x0 + (x1 - x0) * 0.68;
    facet(P, [[x0, hb], [a, hb], tip], V, ss, 3.8, 0, -0.6); facet(P, [[a, hb], [b, hb], tip], V, ss + 1, 2.7, 0, -0.5); facet(P, [[b, hb], [x1, hb], tip], V, ss + 2, 1.6, 0, -0.4);
    P.line(a, hb, tip[0], tip[1], V, 5); P.line(b, hb, tip[0], tip[1], V, 3.6);
    for (let t = 0.15; t < 0.6; t += 0.04) P.put(x0 + (a - x0) * 0.45 + (tip[0] - x0 - (a - x0) * 0.45) * t, hb + (tip[1] - hb) * t, V, 4.6);
  };
  shape(P, 0, 0, W - 1, 4, (x, y) => y <= 4 && Math.abs(x + 0.5 - W / 2) <= W / 2 - 1 - y * 0.4, V, s, 2.2, 0.12);
  P.z = 1;
  if (!k) cone(2, 24, [13, H - 1], 4, s + 1);
  else { cone(1, 18, [9, H - 1], 4, s + 1); P.z = 2; cone(17, 29, [24, 30], 4, s + 5); }
  seams(P);
  return P.done();
}

/* =============================== FUNDO E JANELA =============================== */
function stairsNowhere(k) {   // 60 x 88: a escada que sobe para o nada: nove degraus de laje de 6 x 9, o banzo de baixo numa reta só, quadradinhos gravados no banzo, e nada depois do último degrau (um cubinho solto parado no ar); k 0 sobe para a direita, k 1 para a esquerda
  const W = 60, H = 88, P = painter(W, H), s = 29501 + k, L = RP.laje, n = 9, sw = 6, rise = 9;
  const U = x => k ? W - 1 - x : x;
  const IN = (x, y) => { const u = U(x); if (u < 0 || u >= n * sw || y < 0 || y >= H) return 0; const i = Math.floor(u / sw), top = H - (i + 1) * rise, under = H + 7 - Math.floor(u * rise / sw); return y >= top && y <= Math.min(H - 1, under) ? 1 : 0; };
  shape(P, 0, 0, W - 1, H - 1, IN, L, s, 3.4, 0.14, (x, y) => { const u = U(x), i = Math.floor(u / sw), top = H - (i + 1) * rise; return (u % sw === (k ? sw - 1 : 0) && y > top + 1 ? -1 : 0) + (y - top === 1 ? 0.4 : 0) - u / W * 0.4; });
  for (let i = 0; i < n; i++) { const top = H - (i + 1) * rise, u = i * sw + 2, x = k ? W - 1 - u - 1 : u; for (let j = 0; j < 2; j++) { P.put(x, top + 6 + j, L, 1.5); P.put(x + 1, top + 6 + j, L, 1.5); } P.put(x, top + 8, L, 4); P.put(x + 1, top + 8, L, 4); }
  const cxq = k ? 2 : W - 5; face(P, cxq, 1, 3, 3, L, s + 1, 3);
  seams(P);
  return P.done();
}
function sealedDoor(k) {   // 40 x 66: a porta selada dos Antigos: o marco de fiadas de laje com glifos na verga, dois recuos em degrau (a face da esquerda e a de cima na sombra, a da direita acesa), a folha de pedra lisa sem maçaneta, a junta reta no meio e o selo redondo gravado em cima dela com quatro pontos de glifo (k 1: a porta redonda de cofre, anéis e juntas em raio)
  const W = 40, H = 66, P = painter(W, H), s = 29511 + k, L = RP.laje, R = RP.pedra;
  courses(P, 0, 0, W, H, L, s, 6, 10, 2.8, (x, y) => !(x >= 4 && x < 36 && y >= 7));
  for (let x = 2, i = 0; x + 3 < W - 1; x += 4, i++) gcarve(P, x, 2, i * 2 + 1, L, 3, true);
  P.z = 1;
  const recess = (x0, y0, x1, d, base) => { for (let y = y0; y < H; y++) for (let x = x0; x < x1; x++) { const l = x - x0 < d, t = y - y0 < d, r = x1 - 1 - x < d; P.put(x, y, L, t && !(r && y - y0 >= x1 - 1 - x) ? base - 1.4 : l ? base - 1 : r ? base + 0.9 : base); } };
  recess(4, 7, 36, 3, 2.6); P.z = 2; recess(7, 10, 33, 2, 2.3);
  P.z = 3;
  if (!k) {
    face(P, 9, 12, 22, H - 12, R, s + 1, 3.1, 0.12);
    for (let y = 13; y < H; y++) { P.put(19, y, R, 1.5); P.put(20, y, R, 4); }
    for (const y of [20, 46]) cut(P, 10, y, 29, y, R, 3);
    groove(P, 20, 33, 6.5, R, 3.2); gcarve(P, 18, 31, 2, R, 3.2);
    for (const [x, y] of [[20, 26], [20, 40], [13, 33], [27, 33]]) P.N(x - (x === 20 ? 1 : 0), y, GL.ciano);
  } else {
    P.rect(9, 12, 22, H - 12, L, (i, j) => 1.7 - (i < 2 || j < 2 ? 0.6 : 0));
    orb(P, 20, 38, 13, R, s + 1, 3.1, 0.6);
    for (const r of [9, 5]) groove(P, 20, 38, r, R, 3);
    for (let t = 0; t < 8; t++) { const a = t * Math.PI / 4 + Math.PI / 8; for (let q = 6; q < 13; q += 0.5) P.put(20 + Math.cos(a) * q - 0.5, 38 + Math.sin(a) * q - 0.5, R, 1.7); }
    P.N(19, 37, GL.claro); P.N(20, 37, GL.ciano); P.N(19, 38, GL.ciano); P.N(20, 38, GL.fundo);
  }
  seams(P);
  return P.done();
}
function glyphMural(k) {   // 64 x 34: o mural de glifos: a moldura de laje e o painel de pedra lisa rebaixado, três linhas de glifos gravados entre pautas finas, um glifo aceso no meio (k 1: à esquerda, um Antigo de quatro braços em traço gravado, os glifos à direita)
  const W = 64, H = 34, P = painter(W, H), s = 29521 + k, L = RP.laje, R = RP.pedra;
  face(P, 0, 0, W, H, L, s, 2.8);
  P.z = 1; P.rect(3, 3, W - 6, H - 6, R, (i, j, x, y) => 3 - (i === 0 || j === 0 ? 1.1 : 0) + (i === W - 7 || j === H - 7 ? 0.9 : 0) - i / W * 0.4 + cg(x, y, s) * 0.12);
  for (const y of [5, 13, 21, 29]) for (let x = 5; x < W - 5; x++) P.put(x, y, R, 2.3);
  const c0 = k ? 4 : 0;
  for (let r = 0; r < 3; r++) for (let c = c0; c < 8; c++) { const x = 6 + c * 7, y = 7 + r * 8; if (r === 1 && c === 5) glit(P, x, y, 7, GL.claro); else gcarve(P, x, y, (c * 7 + r * 3 + k) % AGLYPH.length, R, 3); }
  if (k) {
    const vl = (x, y0, y1) => { for (let y = y0; y <= y1; y++) { P.put(x, y, R, 1.4); P.put(x + 1, y, R, 4); } }, hl = (x0, x1, y) => { for (let x = x0; x <= x1; x++) { P.put(x, y, R, 1.4); P.put(x, y + 1, R, 4); } };
    hl(14, 18, 5); vl(14, 5, 10); vl(18, 5, 10); hl(14, 18, 10); vl(16, 11, 26); hl(10, 22, 13); vl(10, 7, 13); vl(22, 7, 13); hl(11, 21, 18); vl(11, 18, 24); vl(21, 18, 24); hl(13, 19, 26);
    P.N(16, 7, GL.ciano);
  }
  seams(P);
  return P.done();
}
function orbitRelief(k) {   // 44 x 44: o relevo de órbitas: o painel quadrado de pedra lisa na moldura de laje, as órbitas gravadas em círculos perfeitos, a estrela do meio em relevo e os mundos em relevo cada um na sua órbita (k 1: duas elipses cruzadas girando em volta do mesmo centro)
  const W = 44, H = 44, P = painter(W, H), s = 29531 + k, L = RP.laje, R = RP.pedra, M = RP.estelar, cx = 22, cy = 22;
  face(P, 0, 0, W, H, L, s, 2.8);
  P.z = 1; face(P, 3, 3, W - 6, H - 6, R, s + 1, 3, 0.1);
  P.z = 2;
  if (!k) { for (const r of [6, 11, 15.5]) groove(P, cx, cy, r, R, 3); for (const [r, a, pr] of [[6, 2.2, 1.6], [11, -0.7, 2.2], [15.5, 3.6, 1.8]]) orb(P, cx + Math.cos(a) * r, cy + Math.sin(a) * r, pr, R, s + r, 3.6); }
  else { for (const rot of [0.6, -0.6]) { ring(P, cx, cy, 16, 6, 1, R, s, 1.4, null, rot); } orb(P, cx + 13.5, cy + 8.5, 2, R, s + 2, 3.6); orb(P, cx - 9, cy + 9.6, 1.6, R, s + 3, 3.6); }
  orb(P, cx, cy, 3.4, M, s + 4, 3.4); P.N(cx - 1, cy - 1, ST.palido);
  seams(P);
  return P.done();
}
function starMap(k) {   // 48 x 36: o mapa estelar: a moldura de laje, o céu fundo de ferro e anil com a pauta de coordenadas, as estrelas acesas (brancas e violeta, as grandes em cruz) e as constelações em traço de ferro estelar (k 1: o planisfério redondo com o aro graduado)
  const W = 48, H = 36, P = painter(W, H), s = 29541 + k, L = RP.laje, C = RP.ceu, M = RP.estelar, cx = 24, cy = 18;
  face(P, 0, 0, W, H, L, s, 2.8);
  P.z = 1;
  const inSky = (x, y) => k ? Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= 14 : x >= 3 && y >= 3 && x < W - 3 && y < H - 3;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inSky(x, y)) P.put(x, y, C, 1.4 + y / H * 1.6 + (k ? 0 : (x - 3) % 10 === 0 || (y - 3) % 10 === 0 ? 0.7 : 0) + cg(x, y, s) * 0.35);
  if (k) { ring(P, cx, cy, 15.2, 15.2, 2.4, M, s + 1, 3); for (let t = 0; t < 24; t++) { const a = t * Math.PI / 12; P.put(cx + Math.cos(a) * 13.6 - 0.5, cy + Math.sin(a) * 13.6 - 0.5, C, t % 6 ? 3.8 : 5); } }
  const stars = []; for (let i = 0; i < 18; i++) { let x, y, tr = 0; do { x = 5 + Math.floor(hash2(i, tr, s) * (W - 10)); y = 5 + Math.floor(hash2(i, tr + 50, s) * (H - 10)); tr++; } while (!inSky(x, y) || (k && Math.hypot(x - cx, y - cy) > 11)); stars.push([x, y]); }
  for (let i = 0; i < 5; i++) { const [ax, ay] = stars[i * 2], [bx, by] = stars[i * 2 + 1]; P.line(ax, ay, bx, by, M, 2.6); }
  stars.forEach(([x, y], i) => { const c = i % 4 === 0 ? ST.miolo : i % 4 === 1 ? ST.violeta : i % 4 === 2 ? ST.palido : ST.fundo; P.N(x, y, c); if (i % 6 === 0) { P.N(x - 1, y, ST.fundo); P.N(x + 1, y, ST.fundo); P.N(x, y - 1, ST.fundo); P.N(x, y + 1, ST.fundo); } });
  seams(P);
  return P.done();
}
function nowhereWindow(k) {   // 32 x 40 (k 1: 26 x 48): a janela para lugar nenhum: o marco fundo de laje (o recuo de cima e da esquerda na sombra, o peitoril aceso), o céu de um lugar que não existe (anil escuro em cima, violeta perto do horizonte), estrelas paradas e um mundo anelado ao longe (k 1: estreita e alta, com o montante no meio e duas luas)
  const W = k ? 26 : 32, H = k ? 48 : 40, P = painter(W, H), s = 29551 + k, L = RP.laje, C = RP.ceu, M = RP.estelar;
  const x0 = 5, y0 = 5, x1 = W - 5, y1 = H - 7;
  courses(P, 0, 0, W, H - 3, L, s, 6, 8, 2.8, (x, y) => !(x >= x0 - 2 && x < x1 + 2 && y >= y0 - 2 && y < y1 + 1));
  face(P, 0, H - 4, W, 4, L, s + 1, 3.3);
  for (let y = y0 - 2; y < y1 + 1; y++) for (let x = x0 - 2; x < x1 + 2; x++) { const l = x < x0, t = y < y0, r = x >= x1, b = y >= y1; if (!(l || t || r || b)) continue; P.put(x, y, L, t ? 1.2 : l ? 1.6 : r ? 3.6 : 4); }
  P.z = 1;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const t = (y - y0) / (y1 - y0); P.put(x, y, C, 0.6 + t * t * 3.6 + cg(x, y, s) * 0.3 - ((x + y) % 2 && t > 0.75 && t < 0.85 ? 0.5 : 0)); }
  const sky = (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1;
  if (!k) {
    P.ell(20, 14, 3.6, 3.6, (x, y, dx, dy, d) => P.put(x, y, M, 2.4 - (dx + dy) * 1.2));
    ring(P, 20, 14, 7, 1.6, 0.9, M, s + 2, 3.2, a => Math.sin(a) > 0 || Math.hypot(Math.cos(a) * 7, Math.sin(a) * 1.6) > 3.6, -0.25);
    P.N(18, 12, ST.palido);
  } else {
    P.ell(9, 13, 2.6, 2.6, (x, y, dx, dy) => P.put(x, y, M, 2.6 - (dx + dy) * 1.2)); P.N(8, 12, ST.palido);
    P.ell(17, 22, 1.6, 1.6, (x, y, dx, dy) => P.put(x, y, M, 2 - (dx + dy)));
  }
  for (let i = 0; i < (k ? 12 : 16); i++) { const x = x0 + Math.floor(hash2(i, 1, s) * (x1 - x0)), y = y0 + Math.floor(Math.pow(hash2(i, 2, s), 1.4) * (y1 - y0) * 0.8); if (!sky(x, y)) continue; if (P.rid[y * W + x] >= 0 && P.ramps[P.rid[y * W + x]] === M) continue; P.N(x, y, i % 5 === 0 ? ST.miolo : i % 3 === 0 ? ST.violeta : i % 2 ? ST.palido : ST.fundo); }
  if (k) { P.z = 2; bar(P, (W >> 1) - 1, y0, 2, y1 - y0, L, s + 3, 2.8); face(P, x0, (y0 + y1) >> 1, x1 - x0, 2, L, s + 4, 3); }
  seams(P);
  return P.done();
}

/* =============================== TETO =============================== */
function ringLamp(k) {   // 54 x 40 (k 1: 44 x 44): o lustre de anéis concêntricos: a placa do teto, a haste, o cubo; três anéis de ferro estelar um dentro do outro, cada um mais baixo, pendurados por fios retos; as luzes de glifo nos anéis (as da frente na frente) e a gota de glifo no meio (k 1: anéis em pé cruzados como um giroscópio, as luzes nos cruzamentos)
  const W = k ? 44 : 54, H = k ? 44 : 40, P = painter(W, H), s = 29601 + k, M = RP.estelar, L = RP.laje, cx = W / 2;
  face(P, cx - 6, 0, 12, 2, L, s, 3); bar(P, cx - 1.5, 2, 3, 10, M, s + 1, 2.8); face(P, cx - 3, 12, 6, 4, M, s + 2, 3.2);
  if (!k) {
    const RS = [[22, 5, 30], [15, 3.5, 25], [8, 2.2, 20]];
    for (const [rx, , y] of RS) { P.line(cx - 1.5, 15, cx - rx, y, M, 2.2); P.line(cx + 0.5, 15, cx + rx - 1, y, M, 1.8); }
    P.z = 1; for (const [rx, ry, y] of RS) ring(P, cx, y, rx, ry, 1.6, M, s + rx, 2.2, a => Math.sin(a) < 0);
    P.z = 2; bar(P, cx - 1, 16, 2, 12, M, s + 3, 2.6); for (let j = 0; j < 4; j++) for (let i = -j; i <= j; i++) P.N(cx - 0.5 + i, 28 + j, j === 0 ? GL.miolo : i < 0 ? GL.claro : GL.ciano); for (let j = 0; j < 3; j++) for (let i = -2 + j; i <= 2 - j; i++) P.N(cx - 0.5 + i, 32 + j, i < 0 ? GL.ciano : GL.fundo);
    P.z = 3;
    for (const [rx, ry, y] of RS) {
      ring(P, cx, y, rx, ry, 1.6, M, s + rx + 1, 3.4, a => Math.sin(a) >= 0);
      const nl = Math.round(rx / 3.5); for (let i = 0; i <= nl; i++) { const a = Math.PI * (i + 0.5) / (nl + 1), x = cx + Math.cos(a) * rx - 0.5, yy = y + Math.sin(a) * ry; P.N(x, yy, GL.claro); P.N(x, yy + 1, GL.fundo); }
      for (let i = 0; i < 3; i++) { const a = -Math.PI * (i + 0.5) / 3; P.N(cx + Math.cos(a) * rx - 0.5, y + Math.sin(a) * ry, GL.fundo); }
    }
  } else {
    const cy = 28;
    P.z = 1; ring(P, cx, cy, 12, 4, 1.6, M, s, 2.2, a => Math.sin(a) < 0); ring(P, cx, cy, 4, 12, 1.6, M, s + 1, 2.2, a => Math.cos(a) < 0);
    P.z = 2; ring(P, cx, cy, 12.5, 12.5, 2, M, s + 2, 3.1); bar(P, cx - 1, 16, 2, 2, M, s, 3);
    orb(P, cx, cy, 3, RP.glifo, s + 3, 2.4); P.N(cx - 1, cy - 1, GL.miolo); P.N(cx, cy - 1, GL.claro); P.N(cx - 1, cy, GL.claro);
    P.z = 3; ring(P, cx, cy, 12, 4, 1.6, M, s + 4, 3.4, a => Math.sin(a) >= 0); ring(P, cx, cy, 4, 12, 1.6, M, s + 5, 3.4, a => Math.cos(a) >= 0);
    for (const [dx, dy] of [[-12, 0], [12, 0], [0, 12], [0, -12], [-4, 0], [4, 0], [0, 4]]) { P.N(cx + dx - 0.5, cy + dy - 0.5, Math.abs(dx) + Math.abs(dy) > 8 ? GL.claro : GL.ciano); }
  }
  seams(P);
  return P.done();
}
function invertedHouse(k) {   // 60 x 60 (k 1: 40 x 74): o prédio invertido pequeno, pendurado do teto: o alicerce colado no teto, as paredes em fiadas de laje, a porta de cabeça para baixo junto do alicerce (a verga embaixo), as janelas de cabeça para baixo (o peitoril em cima), a cornija e o telhado em degraus apontando para baixo com a ponta de glifo; uma janela tem um glifo aceso lá dentro (k 1: uma torre estreita, três janelas)
  const W = k ? 40 : 60, H = k ? 74 : 60, P = painter(W, H), s = 29611 + k, L = RP.laje, V = RP.vazio, cx = W / 2;
  const wb = k ? 36 : 42;   // a linha de baixo das paredes
  face(P, 1, 0, W - 2, 4, L, s, 2.4);
  P.z = 1;
  courses(P, 5, 4, W - 10, wb - 4, L, s + 1, 6, 12, 2.8);
  const hole = (x0, y0, w, h, sillTop) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) P.put(x, y, V, 1.5 - (x === x0 ? 0.6 : 0) - (y === y0 + h - 1 ? 0.5 : 0) + (y - y0) / h * 0.4);
    if (sillTop) { P.z = 2; face(P, x0 - 1, y0 - 2, w + 2, 2, L, s + x0, 3.2); P.z = 1; }
    for (let x = x0 - 1; x <= x0 + w; x++) P.put(x, y0 + h, L, 1.6);
  };
  const dw = 8; hole(cx - dw / 2, 4, dw, 15, false); for (let x = cx - dw / 2 - 1; x <= cx + dw / 2; x++) { P.put(x, 19, L, 3.8); P.put(x, 20, L, 3.1); } P.put(cx - dw / 2 + 1, 15, RP.estelar, 2);
  if (!k) { hole(12, 14, 6, 8, true); hole(42, 14, 6, 8, true); hole(12, 30, 6, 6, true); hole(42, 30, 6, 6, true); P.N(44, 18, GL.fundo); P.N(45, 18, GL.ciano); P.N(45, 17, GL.fundo); }
  else { hole(cx - 3, 24, 6, 6, true); hole(9, 14, 4, 6, true); hole(27, 14, 4, 6, true); P.N(cx, 27, GL.ciano); P.N(cx - 1, 27, GL.fundo); }
  P.z = 2;
  face(P, 2, wb, W - 4, 3, L, s + 2, 3.2);
  const steps = k ? [[6, 4], [10, 4], [14, 4], [17, 5], [19, 6]] : [[8, 4], [14, 4], [20, 4], [26, 4]];
  let y = wb + 3; for (const [ins, h] of steps) { face(P, ins, y, W - ins * 2, h, L, s + ins, 2.7 - ins * 0.02); y += h; }
  if (y < H - 1) bar(P, cx - 1, y, 2, H - y - 2, RP.estelar, s + 9, 3);
  P.N(cx - 1, H - 2, GL.claro); P.N(cx, H - 2, GL.ciano); P.N(cx - 1, H - 1, GL.fundo);
  seams(P);
  return P.done();
}
function watchEye(k) {   // 22 x 34 (k 1: 26 x 32): o olho de vigia apagado: a placa no teto, a haste, o aro grosso de ferro estelar e a lente escura de vidro com a íris de glifo apagada e um reflexo fosco (k 1: a lente numa caixa quadrada com duas aletas em ângulo reto)
  const W = k ? 26 : 22, H = k ? 32 : 34, P = painter(W, H), s = 29621 + k, M = RP.estelar, cx = W / 2, cy = k ? 19 : 21;
  face(P, cx - 4, 0, 8, 2, RP.laje, s, 3); bar(P, cx - 1.5, 2, 3, cy - 10, M, s + 1, 2.8);
  P.z = 1;
  if (!k) { ring(P, cx, cy, 8.5, 8.5, 3, M, s + 2, 3); face(P, cx - 3, cy + 9, 6, 3, M, s + 3, 2.8); }
  else { face(P, cx - 10, cy - 10, 20, 20, M, s + 2, 3, 0.1); bar(P, cx - 13, cy - 4, 3, 8, M, s + 3, 3); bar(P, cx + 10, cy - 4, 3, 8, M, s + 4, 2.4); }
  P.z = 2;
  P.ell(cx, cy, 6.6, 6.6, (x, y, dx, dy, d) => P.put(x, y, RP.vazio, 2.6 + (dx + dy) * 0.9 - d * 0.6));
  ring(P, cx, cy, 3.2, 3.2, 1.2, RP.glifo, s + 5, 1.2);
  P.ell(cx, cy, 1.5, 1.5, (x, y) => P.put(x, y, RP.vazio, 0.3));
  P.put(cx - 4, cy - 4, RP.glifo, 2.6); P.put(cx - 3, cy - 4, RP.glifo, 2); P.put(cx - 4, cy - 3, RP.glifo, 2);
  seams(P);
  return P.done();
}

/* =============================== registro =============================== */
// assa as camadas de luz de cada variação: os pixels de luz sozinhos e o halo em volta (pad HR)
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
const CY = AT_COL.glifo, BR = AT_COL.estrela;
const def = (id, nome, apoio, camada, faixas, Ps, extra) => {
  const B = Ps.map(bakeLuz);
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), antigos: true, atLuz: B.map(b => b.nv), atHalo: B.map(b => b.halo), atPts: Ps.map(P => P.pts), luz: [], brilho: CY }, extra || {}));
};
const ALL = ['escadarias', 'inversa', 'maquinas', 'cratera'];
// o chão
def('at_obelisco', 'Obelisco de medida', F, 'frente', ['escadarias', 'inversa'], [obelisk(0), obelisk(1), obelisk(2)]);
def('at_estatua', 'Estátua de Antigo', F, 'frente', ['escadarias', 'inversa'], [ancientStatue(0), ancientStatue(1)], { terraco: true });
def('at_poliedro', 'Poliedro flutuante', F, 'frente', ALL, [polyPedestal(0), polyPedestal(1), polyPedestal(2)], { faixaV: { escadarias: [0], inversa: [0], maquinas: [1], cratera: [2] }, atLuzV: [[{ x: 12, y: 13, r: 0.7 }], [{ x: 12, y: 13, r: 0.7 }], [{ x: 12, y: 13, r: 0.7 }]], atVivo: { k: 'poli', x: 12, y: 13 } });
def('at_armilar', 'Esfera armilar', F, 'frente', ['inversa', 'maquinas'], [armillary(0), armillary(1)], { faixaV: { inversa: [0], maquinas: [1] } });
def('at_prancheta', 'Prancheta com a planta gravada', F, 'frente', ['inversa'], [draftBoard(0), draftBoard(1)]);
def('at_construto', 'Construto desligado, ajoelhado', F, 'frente', ['escadarias', 'inversa', 'maquinas'], [construct(0), construct(1)]);
def('at_maquina', 'Máquina de engrenagens', F, 'frente', ['maquinas'], [gearMachine(0), gearMachine(1)]);
def('at_bobina', 'Bobina de luz', F, 'frente', ['maquinas'], [coil(0), coil(1)], { atLuzV: [[{ x: 12, y: 24, r: 0.75 }], [{ x: 17, y: 24, r: 0.8 }]] });
def('at_bancada', 'Bancada com um construto pela metade', F, 'frente', ['maquinas'], [workbench(0), workbench(1)], { maquina: true });
def('at_lasca', 'Lasca grande da estrela', F, 'frente', ['cratera'], [starShard(0), starShard(1), starShard(2)], { cratera: true, brilho: BR, atLuzV: [[{ x: 16, y: 18, r: 0.8 }], [{ x: 20, y: 16, r: 0.85 }], [{ x: 24, y: 14, r: 0.75 }]] });
def('at_gota', 'Pedra fundida em gota', F, 'frente', ['cratera'], [meltDrop(0), meltDrop(1)]);
def('at_meteorito', 'Meteorito cravado no chão', F, 'frente', ['cratera'], [meteorite(0), meteorite(1)], { cratera: true });
def('at_bacia', 'Bacia de vidro', F, 'frente', ['cratera'], [glassBasin(0), glassBasin(1)], { cratera: true });
// o fundo com pé no chão
def('at_escada_nada', 'Escada que sobe para o nada', Wl, 'fundo', ['inversa'], [stairsNowhere(0), stairsNowhere(1)], { quarteirao: true });
def('at_pistao', 'Pistão gigante', Wl, 'fundo', ['maquinas'], [pistonFrame()], { maquina: true, atVivo: { k: 'pistao' } });
def('at_engrenagem', 'Engrenagem de parede gigante', Wl, 'fundo', ['maquinas'], [wallGearSocket()], { maquina: true, atVivo: { k: 'roda', x: 2, y: 2 } });
def('at_porta', 'Porta selada dos Antigos', Wl, 'fundo', ['escadarias', 'inversa', 'maquinas'], [sealedDoor(0), sealedDoor(1)]);
// o fundo na altura dos olhos e a janela
def('at_mural', 'Mural de glifos', Wl, 'fundo', ['escadarias', 'inversa'], [glyphMural(0), glyphMural(1)]);
def('at_orbitas', 'Relevo de órbitas', Wl, 'fundo', ['inversa'], [orbitRelief(0), orbitRelief(1)]);
def('at_mostradores', 'Painel de mostradores', Wl, 'fundo', ['maquinas'], [dialPanel(0), dialPanel(1)], { atLuzV: [[{ x: 25, y: 14, r: 0.45 }], [{ x: 22, y: 16, r: 0.45 }]] });
def('at_mapa', 'Mapa estelar', Wl, 'fundo', ['inversa', 'maquinas', 'cratera'], [starMap(0), starMap(1)], { brilho: BR, faixaV: { cratera: [1] } });
def('at_rachadura', 'Rachadura radial acesa', Wl, 'fundo', ['cratera'], [radialCrack(0), radialCrack(1)], { brilho: BR, atLuzV: [[{ x: 28, y: 24, r: 0.55 }], [{ x: 33, y: 20, r: 0.55 }]] });
def('at_janela', 'Janela para lugar nenhum', Wl, 'fundo', ['escadarias', 'inversa'], [nowhereWindow(0), nowhereWindow(1)], { janela: true, brilho: ST.violeta, atLuzV: [[{ x: 16, y: 18, r: 0.28 }], [{ x: 13, y: 22, r: 0.28 }]] });
// o teto
def('at_lustre', 'Lustre de anéis concêntricos', C, 'frente', ['escadarias', 'inversa'], [ringLamp(0), ringLamp(1)], { atLuzV: [[{ x: 27, y: 26, r: 0.85 }], [{ x: 22, y: 28, r: 0.8 }]] });
def('at_predio', 'Prédio invertido pequeno', C, 'frente', ['inversa'], [invertedHouse(0), invertedHouse(1)], { quarteirao: true });
def('at_olho', 'Olho de vigia apagado', C, 'frente', ['escadarias', 'inversa', 'maquinas'], [watchEye(0), watchEye(1)]);
def('at_conduto', 'Conduto pendurado', C, 'frente', ['maquinas'], [hangConduit(0), hangConduit(1)], { atLuzV: [[{ x: 33, y: 13, r: 0.55 }], [{ x: 29, y: 17, r: 0.5 }]], atVivo: { k: 'corre' } });
def('at_estalactite', 'Estalactite de vidro grande', C, 'frente', ['cratera'], [glassStalactite(0), glassStalactite(1)], { cratera: true });

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(AT_PROP_PLAN, {
  escadarias: { chao: [['at_obelisco', 0.14, 2], ['at_estatua', 0.07, 1], ['at_poliedro', 0.07, 1], ['at_construto', 0.06, 1]], teto: [['at_lustre', 0.14, 2], ['at_olho', 0.08, 1]], fundo: [['at_porta', 0.07, 1], ['at_mural', 0.12, 2], ['at_janela', 0.1, 2]] },
  inversa: { chao: [['at_obelisco', 0.06, 1], ['at_estatua', 0.04, 1], ['at_poliedro', 0.06, 1], ['at_armilar', 0.08, 1], ['at_prancheta', 0.08, 1], ['at_construto', 0.05, 1]], teto: [['at_predio', 0.12, 1], ['at_lustre', 0.1, 1], ['at_olho', 0.08, 1]], fundo: [['at_escada_nada', 0.06, 1], ['at_porta', 0.06, 1], ['at_mural', 0.08, 1], ['at_orbitas', 0.08, 1], ['at_mapa', 0.06, 1], ['at_janela', 0.1, 2]] },
  maquinas: { chao: [['at_maquina', 0.12, 2], ['at_bobina', 0.12, 2], ['at_bancada', 0.07, 1], ['at_armilar', 0.04, 1], ['at_construto', 0.08, 1], ['at_poliedro', 0.04, 1]], teto: [['at_conduto', 0.18, 2], ['at_olho', 0.1, 1]], fundo: [['at_pistao', 0.07, 1], ['at_engrenagem', 0.06, 1], ['at_mostradores', 0.12, 2], ['at_porta', 0.05, 1], ['at_mapa', 0.04, 1]] },
  cratera: { chao: [['at_lasca', 0.14, 2], ['at_meteorito', 0.07, 1], ['at_gota', 0.12, 2], ['at_bacia', 0.06, 1], ['at_poliedro', 0.04, 1]], teto: [['at_estalactite', 0.2, 2]], fundo: [['at_rachadura', 0.1, 1], ['at_mapa', 0.04, 1]] }
});

/* ---------- a luz, o compasso e os animados ----------
   `luz: []` põe os objetos em visProps; a luz de cada variação (atLuzV) entra aqui no mapa de luz, com um respiro de 8%
   no compasso. No drawGlow (somado): o halo assado e os pixels de luz, e o brilho redondo de cada ponto de luz, todos no
   mesmo compasso; o poliedro leva o brilho dele junto. */
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const b = pulso();
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], LV = p.def.atLuzV; if (!LV || p.gone) continue;
    const ls = LV[p.v] || LV[0]; for (let j = 0; j < ls.length; j++) addL(p.X + p.sh + ls[j].x, p.Y + ls[j].y, ls[j].r * (0.92 + 0.08 * b));
  }
}; }
const atGl = {};
const glowC = (c, r) => atGl[c + r] || (atGl[c + r] = glow(r, c));
const bob = () => Math.round(Math.sin(gameTime * 6.283185 / RITMO) * 1.5);
// o poliedro: uma bipirâmide quadrada de vidro de glifo, um pouco inclinada para a frente; 12 quadros de um quarto de volta
let POLI = null;
function polyFrames() {
  const out = [], Wf = 17, Hf = 23, cx = 8.5, cy = 11.5, S = 6.2, tl = 0.32, Lx = -0.55, Ly = -0.65, Lz = 0.52;
  for (let f = 0; f < 12; f++) {
    const P = painter(Wf, Hf), a0 = f / 12 * Math.PI / 2, V = [[0, -1.45, 0], [0, 1.45, 0]];
    for (let q = 0; q < 4; q++) { const a = a0 + q * Math.PI / 2; V.push([Math.cos(a), 0, Math.sin(a)]); }
    const T3 = ([x, y, z]) => [x, y * Math.cos(tl) - z * Math.sin(tl), y * Math.sin(tl) + z * Math.cos(tl)];
    const VV = V.map(T3), faces = [];
    for (let q = 0; q < 4; q++) { const e0 = 2 + q, e1 = 2 + (q + 1) % 4; faces.push([0, e0, e1], [1, e1, e0]); }
    for (const fc of faces) {
      const [A, B, Cc] = fc.map(i => VV[i]), u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const m = Math.hypot(...n); n = n.map(t => t / m);
      const cen = [(A[0] + B[0] + Cc[0]) / 3, (A[1] + B[1] + Cc[1]) / 3, (A[2] + B[2] + Cc[2]) / 3]; if (n[0] * cen[0] + n[1] * cen[1] + n[2] * cen[2] < 0) n = n.map(t => -t);
      if (n[2] <= 0.02) continue;
      const pts = [A, B, Cc].map(p => [cx + p[0] * S, cy + p[1] * S]), lit = Math.max(0, n[0] * Lx + n[1] * Ly + n[2] * Lz);
      for (let y = 0; y < Hf; y++) for (let x = 0; x < Wf; x++) {
        if (!inPoly(x + 0.5, y + 0.5, pts)) continue;
        let edge = 9; for (let e = 0; e < 3; e++) { const [ax, ay] = pts[e], [bx, by] = pts[(e + 1) % 3], dx = bx - ax, dy = by - ay; edge = Math.min(edge, Math.abs((x + 0.5 - ax) * dy - (y + 0.5 - ay) * dx) / Math.hypot(dx, dy)); }
        P.put(x, y, RP.glifo, 1.3 + lit * 3.4 + (edge < 0.75 ? 1.2 : 0));
      }
    }
    P.done(); out.push({ cv: toCv(P), w: Wf, h: Hf, cx: 8, cy: 11 });
  }
  return out;
}
// a roda da engrenagem de parede: 6 quadros de um dente (20 dentes), assados na primeira vez
let RODA = null;
function wheelFrames() {
  const out = [], r = 35, n = 20, st = 2 * Math.PI / n;
  for (let f = 0; f < 6; f++) {
    const P = painter(74, 74), ang = f / 6 * st;
    gear(P, 37, 37, r, n, ang, RP.laje, 29361, 3.5, { td: 4, tw: 5, rim: 5, hub: 8, ns: 6, sw: 5, cubo: false });
    for (let t = 0; t < n; t++) { const a = ang + t * st + st / 2; for (let q = r - 8; q < r - 5.5; q += 0.5) P.put(37 + Math.cos(a) * q - 0.5, 37 + Math.sin(a) * q - 0.5, RP.laje, 1.7); }
    P.z = 1; orb(P, 37, 37, 6, RP.estelar, 29362, 3); ring(P, 37, 37, 3, 3, 1, RP.estelar, 29363, 1.6);
    for (let q = 0; q < 4; q++) { const a = ang + q * Math.PI / 2 + Math.PI / 4; P.put(37 + Math.cos(a) * 4.6 - 0.5, 37 + Math.sin(a) * 4.6 - 0.5, RP.estelar, 4.6); }
    P.done(); out.push(toCv(P));
  }
  return out;
}
let RAM = null, ROD = null;
const onScreen = (X, Y, p) => X + p.w > -8 && X < VW + 8 && Y + p.h > -8 && Y < VH + 8;
// logo depois dos pedaços do mundo: a luz escurece junto, os monstros e o herói passam na frente
{ const _dc = drawChunks; drawChunks = function (cx, cy) {
  _dc(cx, cy);
  if (typeof visProps === 'undefined' || !visProps.length) return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.atVivo; if (!A || p.gone || !p.def.antigos) continue;
    const X = Math.round(p.X + (p.sh || 0) - cx), Y = Math.round(p.Y - cy); if (!onScreen(X, Y, p)) continue;
    if (A.k === 'poli') {
      if (!POLI) POLI = polyFrames();
      const Fr = POLI[Math.floor(gameTime / RITMO * 12) % 12];
      lc.drawImage(Fr.cv, X + A.x - Fr.cx, Y + A.y - Fr.cy + bob());
    } else if (A.k === 'pistao') {
      if (!RAM) { RAM = toCv(pistonRam()); ROD = toCv(pistonRod()); }
      const t = 0.5 - 0.5 * Math.cos(gameTime * 6.283185 / (RITMO * 2)), top = Math.round(PIST.top + (PIST.bot - PIST.top) * t), vis = top - PIST.y0;
      if (vis > 0) lc.drawImage(ROD, 0, ROD.height - vis, 8, vis, X + PIST.rx, Y + PIST.y0, 8, vis);
      lc.drawImage(RAM, X + PIST.x, Y + top);
    } else if (A.k === 'roda') {
      if (!RODA) RODA = wheelFrames();
      lc.drawImage(RODA[Math.floor(gameTime / (RITMO / 6)) % 6], X + A.x, Y + A.y);
    }
  }
}; }
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  const b = pulso();
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], D = p.def; if (!D.antigos || p.gone) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy); if (!onScreen(X, Y, p)) continue;
    const hl = D.atHalo[p.v], nv = D.atLuz[p.v];
    if (hl) { lc.globalAlpha = 0.4 + 0.25 * b; lc.drawImage(hl, X - HR, Y - HR); }
    if (nv) { lc.globalAlpha = 0.32 + 0.22 * b; lc.drawImage(nv, X, Y); }
    const LV = D.atLuzV && (D.atLuzV[p.v] || D.atLuzV[0]);
    if (LV) for (let j = 0; j < LV.length; j++) { const L = LV[j]; lc.globalAlpha = 0.24 * L.r * (0.75 + 0.35 * b); lc.drawImage(glowC(D.brilho, 30), X + L.x - 30, Y + L.y - 30); }
    const A = D.atVivo; if (A && A.k === 'poli') { lc.globalAlpha = 0.3 + 0.25 * b; lc.drawImage(glowC(GL.ciano, 13), X + A.x - 13, Y + A.y - 13 + bob()); }
  }
  lc.globalAlpha = 1;
});
// por cima do escuro: o miolo do poliedro e o brilho que corre no conduto (uma vez por compasso, da esquerda para a direita)
const CORRE = [GL.miolo, GL.claro, GL.claro, GL.ciano, GL.ciano, GL.fundo];
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  const ph = (gameTime % RITMO) / RITMO;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.atVivo; if (!A || !p.def.antigos || p.gone) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy); if (!onScreen(X, Y, p)) continue;
    if (A.k === 'poli') { lc.globalAlpha = 0.6 + 0.4 * pulso(); lc.fillStyle = GL.miolo; lc.fillRect(X + A.x - 1, Y + A.y - 1 + bob(), 1, 1); lc.fillStyle = GL.claro; lc.fillRect(X + A.x, Y + A.y - 1 + bob(), 1, 1); lc.fillRect(X + A.x - 1, Y + A.y + bob(), 1, 1); }
    else if (A.k === 'corre') {
      const Q = p.def.atPts[p.v] && p.def.atPts[p.v].corre; if (!Q) continue;
      const head = Math.floor(ph * (Q.length + 40)) - 6;
      for (let j = 0; j < CORRE.length; j++) { const q = Q[head - j]; if (!q) continue; lc.globalAlpha = 1 - j * 0.12; lc.fillStyle = CORRE[j]; lc.fillRect(X + q.x, Y + q.y - (j < 2 ? 1 : 0), 1, j < 2 ? 3 : 1); }
    }
  }
  lc.globalAlpha = 1;
});
}
