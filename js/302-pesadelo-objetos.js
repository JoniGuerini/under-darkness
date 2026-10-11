'use strict';

/* ================= os Salões do Pesadelo: objetos de cena =================
   Tudo o que é maior que um bloco e veste os Salões do Pesadelo (docs/camadas/14-saloes-pesadelo.md, seção 5): 28
   objetos. Móveis de uma casa que alguém sonhou, no tamanho errado e sem ninguém. Na Casa que Não Era: a mesa posta
   para ninguém (os pratos limpos, as cadeiras puxadas), a cadeira grande demais, o piano sem teclas, a pilha de cartas
   nunca enviadas, o guarda-roupa entreaberto com o escuro dentro, o relógio de pêndulo andando para trás, o quadro de
   família sem rostos, o papel de parede descascado mostrando outro papel por baixo, a janela com uma noite parada e
   uma lua grande demais, o lustre coberto de pano. Nos Corredores Sem Fim: a banheira no meio do corredor, a escada
   que desce para dentro do chão, as placas de número de quarto (todas iguais), a gaiola com um pássaro de papel e a
   lâmpada pendurada num fio comprido. Nos Quartos Esquecidos: a cama (onde dorme o Adormecido, desenhado ao vivo pelo
   306), o berço vazio, a casa de bonecas com uma luz acesa dentro, o ursinho gigante sentado, os desenhos de criança,
   os lençóis pendurados e o móbile de berço que gira. Na Galeria dos Espelhos: a moldura de espelho grande, os cacos
   grandes de espelho e a mancha de queimado na parede (perto das Portas Quentes). Em todas: o espelho de parede
   pequeno (o Homem Alto se vê nele e para) e a porta solta (as portas que levam longe, postas pelo 306). O Quadro
   Torto também está aqui, mas quem o põe é o 306 (só nos laços, a partir da segunda volta).
   O pintor é o do 252 (rampas de 6 tons, luz de cima à esquerda, contorno escuro só onde toca o ar, P.N marca um pixel
   de cor pura que acende: abajur, janela, lua, a luz da casa de bonecas, o vermelho do queimado); cada variação assa
   a camada acesa e o halo uma vez, somados no drawGlow com 'lighter'. Animados pelos pontos marcados (psPts):
   'ponteiro' os ponteiros que andam para trás (drawTop), 'bulbo' a lâmpada no fio balançando (drawTop + drawGlow),
   'mobile' as figurinhas que giram (drawTop), 'reflexo' um brilho frio que corre devagar (drawTop).
   Registrados com defProp (`pesadelo: true`); o 305 põe pelo PS_PROP_PLAN (psPlaceProps). Peças de fundo em
   PS_BACK_FLOOR ficam em pé no chão; as outras de fundo, na altura dos olhos.
   Flags para o gerador: quarto (só nos quartos com cama: berço, ursinho, casa de bonecas, móbile), comodo (só nos
   cômodos da Casa: mesa posta, piano, lustre, janela), alto: n (precisa de n blocos de ar). */
const PS_PROP_PLAN = {};
const PS_HR = 8;   // a margem do halo assado
const PS_BACK_FLOOR = { ps_guarda_roupa: 1, ps_relogio: 1, ps_moldura_espelho: 1, ps_mancha_queimado: 1 };
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const HX = {
  madeira: ['#1e140e', '#352418', '#503626', '#6e4c36', '#92684a', '#b88c66'],
  escura: ['#100a08', '#1c120e', '#2a1c16', '#3a2820', '#4c362a', '#604636'],
  verniz: ['#24100c', '#3e1c14', '#5c2c1e', '#7c3e2a', '#9e5638', '#c4744c'],
  pano: ['#3a3640', '#5a5462', '#7e7888', '#a29cac', '#c6c0ce', '#e4e0ea'],
  lencol: ['#4a4652', '#6e6a78', '#948f9e', '#bab6c4', '#dcd8e4', '#f6f4fa'],
  rosa: ['#3a1a24', '#5e2a3a', '#844052', '#aa5a6e', '#cc7e90', '#eeaab8'],
  azul: ['#0e1830', '#182a4e', '#243e70', '#345894', '#4e78b6', '#7aa0d4'],
  amarelo: ['#3a2a0a', '#5e4614', '#8a6a20', '#b8922e', '#dcba48', '#f8e08a'],
  ouro: ['#2a1e0a', '#4a3612', '#7a5a1e', '#a8822e', '#d4ae4a', '#f4dc8a'],
  lata: ['#1a1a1e', '#2e2e36', '#4a4a56', '#6e6e7c', '#9a9aa8', '#c8c8d4'],
  porcelana: ['#4e4a4a', '#7a7474', '#a8a0a0', '#cec6c4', '#ece6e2', '#ffffff'],
  papel: ['#3a3226', '#5a4e3c', '#7e7056', '#a29274', '#c4b694', '#e2d8bc'],
  forrada: ['#2a1e24', '#43303a', '#5e4652', '#7e6470', '#a48a94', '#cbb4ba'],
  forrada2: ['#14202a', '#203444', '#2e4a5e', '#42647a', '#5e8298', '#86a6ba'],
  pelucia: ['#2a1a10', '#46301c', '#664828', '#8a6638', '#ae884e', '#d0ac70'],
  espelho: ['#0e1418', '#1c2a32', '#34505c', '#5a808e', '#94b8c4', '#dcf0f4'],
  ceramica: ['#1e2c2a', '#30443e', '#486258', '#648276', '#86a69a', '#b0ccc0'],
  queimado: ['#0a0404', '#160806', '#220c08', '#30100a', '#40140c', '#521a0e'],
  sombra: ['#030304', '#060608', '#0a0a0e', '#0e0e14', '#13131a', '#191922'],
  noite: ['#04060e', '#080c1a', '#0e1428', '#162038', '#1e2c4c', '#2c3e64']
};
const RP = {};
for (const k in HX) RP[k] = R6(HX[k]);
const OUTLINE = ph('#050306');
const LUZ = { miolo: '#fffbe8', abajur: '#ffd27a', quente: '#ffb860', lua: '#fff4d0', luaF: '#e8d8a0', frio: '#dcf0f4', vermelho: '#e0401a', brasa: '#ff8a3a' };

/* ---- o pintor do 252 (P.N: um pixel de cor pura que acende) ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, ramps, pts: {},
    put(x, y, R, v) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; },
    N(x, y, hex) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = ph(hex); rid[k] = -2; val[k] = 5; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    box(x0, y0, rw, rh, R, s, base = 2.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.3 : j === 1 ? 0.4 : 0) + (i === 0 ? 0.6 : 0) - (j === rh - 1 ? 1.2 : 0) - (i === rw - 1 ? 0.9 : 0) + cg(x, y, s) * 0.4 + cn(x, y, 40, 40, s + 1) * 0.35); },
    blob(cx, cy, rx, ry, R, s, base = 2.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 - d * 0.5 + cg(x, y, s) * 0.4); } },
    line(x0, y0, x1, y1, R, v, wd = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < wd; k++) P.put(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), R, typeof v === 'function' ? v(i / n, k) : v); } },
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
// uma tábua com veio
function plank(P, x0, y0, len, th, R, s, vert = false, base = 2.6) {
  for (let a = 0; a < len; a++) for (let b = 0; b < th; b++) {
    const x = vert ? x0 + b : x0 + a, y = vert ? y0 + a : y0 + b;
    P.put(x, y, R, base + (b === 0 ? 0.9 : b === th - 1 ? -0.9 : 0) + Math.sin(a * 0.45 + b * 1.9 + s) * 0.3 + cg(x, y, s) * 0.45);
  }
}
// um pano caindo em dobras (lençol, toalha, capa): de y0 a y1, largura que abre de w0 a w1, a barra irregular
function drape(P, cx, y0, y1, w0, w1, R, s, base = 3) {
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0), hw = (w0 + (w1 - w0) * t) / 2, bot = y1 - (hash2(Math.round(cx), y, s) < 0.3 ? 1 : 0);
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      if (y > bot && hash2(x, 1, s) < 0.5) continue;
      const u = (x + 0.5 - cx) / Math.max(1, hw), fold = Math.sin(u * 5 + s + t * 1.5);
      P.put(x, y, R, base + 0.4 - u * 0.6 + fold * 0.7 + (fold < -0.7 ? -0.8 : 0) + cg(x, y, s) * 0.3);
    }
  }
}
// um rosto liso, sem olhos, boca ou nariz (os quadros, os bonecos)
function lisa(P, cx, cy, rx, ry, R, s) { P.blob(cx, cy, rx, ry, R, s, 3.2); }

/* ================= a Casa que Não Era ================= */
function mesaPosta(v) {   // a mesa comprida com a toalha, quatro pratos limpos e talheres, duas cadeiras puxadas
  const W = 52, H = 26, P = painter(W, H), s = 30801 + v;
  for (let y = 10; y < 26; y++) for (const x of [6, 7, 44, 45]) P.put(x, y, RP.verniz, x & 1 ? 1.8 : 3.4);
  for (let y = 8; y < 15; y++) for (let x = 3; x < 49; x++) { const fold = y > 9 && (x % 7 === 0); P.put(x, y, RP.lencol, (y === 8 ? 4.6 : 3.6) - (y > 12 ? 0.8 : 0) - (fold ? 0.9 : 0) + cg(x, y, s) * 0.3); }
  for (let x = 3; x < 49; x += 2) P.put(x, 15, RP.lencol, 2.4);   // a barra rendada
  for (let k = 0; k < 4; k++) { const px = 9 + k * 10; for (let x = px - 3; x <= px + 3; x++) P.put(x, 7, RP.porcelana, x === px - 3 ? 4.6 : 3.8 - Math.abs(x - px) * 0.2); P.put(px - 5, 6, RP.lata, 4.4); P.put(px - 5, 7, RP.lata, 3); P.put(px + 5, 6, RP.lata, 4.4); P.put(px + 5, 7, RP.lata, 3); }
  // as duas cadeiras puxadas para longe da mesa, uma caída de lado se v = 1
  for (const [cx, side] of [[0, -1], [W - 4, 1]]) {
    if (v && side > 0) { plank(P, cx - 6, 22, 10, 2, RP.verniz, s + 3); for (let y = 16; y < 22; y++) P.put(cx - 6, y, RP.verniz, 3); continue; }
    for (let y = 4; y < 26; y++) P.put(cx + (side < 0 ? 0 : 3), y, RP.verniz, 3.2 - (y > 15 ? 0.6 : 0));
    plank(P, cx, 16, 4, 2, RP.verniz, s + 4); for (let y = 18; y < 26; y++) P.put(cx + (side < 0 ? 3 : 0), y, RP.verniz, 2.2);
  }
  return P.done();
}
function cadeiraGrande(v) {   // uma cadeira de criança, o dobro do tamanho de uma de adulto: assento alto, encosto de ripas
  const W = 26, H = 44, P = painter(W, H), s = 30811 + v, R = v ? RP.azul : RP.verniz;
  for (const x of [3, 4, 20, 21]) for (let y = 0; y < 44; y++) { if (x > 15 && y < 22) continue; P.put(x, y, R, (x & 1 ? 2 : 3.6) + cg(x, y, s) * 0.3); }
  for (let k = 0; k < 4; k++) plank(P, 3, 3 + k * 5, 4 + (k === 0 ? 0 : 0), 2, R, s + k);   // as ripas do encosto (só a de trás)
  for (let k = 0; k < 4; k++) for (let x = 4; x < 7; x++) P.put(x, 4 + k * 5, R, 4);
  plank(P, 1, 22, 24, 3, R, s + 5, false, 2.9);
  plank(P, 4, 34, 18, 2, R, s + 6, false, 2.2);   // a travessa de baixo
  if (v) for (let x = 7; x < 20; x += 3) P.put(x, 23, RP.amarelo, 4.6);   // as bolinhas pintadas
  return P.done();
}
function pianoSemTeclas(v) {   // o piano de parede: o tampo, a frente com os painéis, e onde deviam estar as teclas um vão liso
  const W = 40, H = 34, P = painter(W, H), s = 30821 + v;
  P.box(2, 0, 36, 18, RP.escura, s, 2.4);
  for (const x0 of [6, 22]) for (let y = 4; y < 14; y++) for (let x = x0; x < x0 + 12; x++) P.put(x, y, RP.escura, (x === x0 || y === 4 ? 1.4 : 2.8) + cg(x, y, s) * 0.3);
  P.box(0, 18, 40, 4, RP.escura, s + 1, 3.2);
  for (let x = 2; x < 38; x++) P.put(x, 19, RP.sombra, 1.2 + (hash2(x, 0, s) < 0.1 ? 1 : 0));   // o vão das teclas: liso e escuro
  P.box(2, 22, 36, 9, RP.escura, s + 2, 2.2);
  for (const x of [4, 34]) for (let y = 22; y < 34; y++) P.put(x, y, RP.escura, 3.2);
  for (const x of [10, 14]) { P.put(x, 32, RP.ouro, 4); P.put(x, 33, RP.ouro, 2.6); }   // os pedais
  if (v) { P.box(14, -2 + 2, 10, 2, RP.papel, s + 3, 3.4); for (let x = 15; x < 23; x += 2) P.put(x, 1, RP.papel, 1.6); }   // uma partitura em branco
  return P.done();
}
function cartas(v) {   // a pilha de cartas nunca enviadas, amarrada com barbante, umas escorregadas para o lado, o selo vermelho
  const W = 22, H = 14, P = painter(W, H), s = 30831 + v;
  for (let k = 0; k < 7; k++) { const y = 12 - k * 1.6, x = 3 + Math.sin(k * 1.7 + v) * 2; for (let i = 0; i < 14; i++) { P.put(x + i, y, RP.papel, 4 - k * 0.1 + (i === 0 ? 0.6 : 0)); P.put(x + i, y + 1, RP.papel, 2.2); } P.put(x + 11, y, RP.rosa, 3.6); }
  for (let y = 2; y < 14; y++) P.put(10, y, RP.pelucia, 3.2);
  if (v) for (let i = 0; i < 10; i++) { P.put(13 + i * 0.6, 12 - i * 0.2, RP.papel, 3.8); P.put(13 + i * 0.6, 13 - i * 0.2, RP.papel, 2.4); }
  return P.done();
}
function guardaRoupa(v) {   // o guarda-roupa alto: as duas portas, uma entreaberta com o escuro dentro (e nada nele... quase)
  const W = 34, H = 50, P = painter(W, H), s = 30841 + v;
  P.box(0, 0, 34, 4, RP.verniz, s, 3.2);
  P.box(1, 4, 32, 42, RP.verniz, s + 1, 2.4);
  for (let y = 46; y < 50; y++) for (const x of [2, 3, 30, 31]) P.put(x, y, RP.verniz, 2.6);
  for (let y = 6; y < 44; y++) { P.put(16, y, RP.verniz, 1); P.put(17, y, RP.verniz, 3.6); }
  for (const x0 of [4, 20]) for (let y = 9; y < 40; y++) for (let x = x0; x < x0 + 10; x++) if (x === x0 || x === x0 + 9 || y === 9 || y === 39) P.put(x, y, RP.verniz, x === x0 || y === 9 ? 1.4 : 3.4);
  P.put(14, 24, RP.ouro, 4.6); P.put(19, 24, RP.ouro, 4.6);
  // a porta da direita entreaberta: a fresta preta, a porta virada para fora mais escura
  const gap = v ? 5 : 3;
  for (let y = 6; y < 44; y++) for (let x = 18; x < 18 + gap; x++) P.put(x, y, RP.sombra, 0.4 + (y > 40 ? 0.6 : 0));
  if (v) { P.put(19, 20, RP.sombra, 4.2); P.put(21, 20, RP.sombra, 4.2); }   // dois pontinhos lá dentro
  return P.done();
}
function relogio(v) {   // o relógio de pêndulo: a caixa alta, o mostrador (os ponteiros andam para trás, ao vivo), o pêndulo parado
  const W = 18, H = 52, P = painter(W, H), s = 30851 + v;
  P.box(1, 0, 16, 3, RP.escura, s, 3.4);
  P.box(2, 3, 14, 16, RP.escura, s + 1, 2.4);
  for (let y = 5; y < 17; y++) for (let x = 3; x < 15; x++) { const d = Math.hypot(x + 0.5 - 9, y + 0.5 - 11); if (d < 5.6) P.put(x, y, RP.porcelana, d > 4.8 ? 2.4 : 4.4 - d * 0.1); }
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; P.put(9 + Math.sin(a) * 4.2, 11 - Math.cos(a) * 4.2, RP.sombra, 1.6); }
  P.mark('ponteiro', 9, 11, { r: 4, r2: 2.4 });
  P.box(4, 19, 10, 28, RP.escura, s + 2, 2.2);
  for (let y = 21; y < 44; y++) for (let x = 6; x < 12; x++) P.put(x, y, RP.sombra, 0.8);   // o vidro escuro da caixa
  for (let y = 21; y < 38; y++) P.put(9, y, RP.ouro, 3);
  P.blob(9, 39, 2.4, 2.4, RP.ouro, s + 3, 3.4);
  P.box(2, 47, 14, 5, RP.escura, s + 4, 2.8);
  return P.done();
}
function quadroFamilia(v) {   // o quadro de família sem rostos: moldura dourada, três ou quatro figuras de roupa escura, os rostos lisos
  const W = 30, H = 24, P = painter(W, H), s = 30861 + v;
  for (let y = 0; y < 24; y++) for (let x = 0; x < 30; x++) {
    const edge = x < 2 || x > 27 || y < 2 || y > 21;
    if (edge) P.put(x, y, RP.ouro, 3.2 + (x === 0 || y === 0 ? 1.2 : x === 29 || y === 23 ? -1.2 : 0) + ((x + y) % 3 === 0 ? 0.5 : 0));
    else P.put(x, y, RP.noite, 2 + cn(x, y, 20, 20, s) * 1.4);
  }
  const n = v ? 4 : 3;
  for (let k = 0; k < n; k++) {
    const cx = 6 + k * (18 / (n - 1)), tall = k === 0 ? 1 : k === n - 1 && v ? -3 : 0, top = 8 - tall;
    for (let y = top + 4; y < 22; y++) for (let x = Math.round(cx - 2.5); x <= cx + 2.5; x++) P.put(x, y, RP.escura, 2 + (x < cx ? 0.6 : 0));
    lisa(P, cx, top + 1.5, 2, 2.4, RP.porcelana, s + k);
  }
  return P.done();
}
function papelDescascado(v) {   // o papel de parede descascado: uma tira enrolada, e por baixo outro papel, de outra casa
  const W = 24, H = 30, P = painter(W, H), s = 30871 + v;
  const hole = (x, y) => { const dx = (x - 12) / 9, dy = (y - 15) / 12; return dx * dx + dy * dy + Math.sin(x * 0.9 + y * 0.5) * 0.15 < 1; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!hole(x, y)) continue;
    // o papel de baixo: azul, listras e um passarinho repetido
    const st = x % 6 === 0, bird = (x % 6 === 3 && y % 8 === 4) || (x % 6 === 2 && y % 8 === 3) || (x % 6 === 4 && y % 8 === 3);
    P.put(x, y, RP.forrada2, bird ? 4.4 : st ? 1.8 : 3 + cg(x, y, s) * 0.3);
  }
  // a borda rasgada clara e a tira enrolada caindo
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!hole(x, y) && (hole(x - 1, y) || hole(x + 1, y) || hole(x, y - 1) || hole(x, y + 1))) P.put(x, y, RP.papel, 4.4);
  for (let y = 22; y < 30; y++) { const x = 14 + Math.sin(y * 0.7) * 1.5; P.put(x, y, RP.forrada, 4 - (y - 22) * 0.2); P.put(x + 1, y, RP.forrada, 2.4); }
  return P.done(false);
}
function janelaLua(v) {   // a janela: o caixilho em cruz, uma noite parada atrás com uma lua grande demais, a cortina de um lado
  const W = 30, H = 36, P = painter(W, H), s = 30881 + v;
  for (let y = 2; y < 32; y++) for (let x = 3; x < 27; x++) P.put(x, y, RP.noite, 1.4 + (32 - y) * 0.06 + cg(x, y, s) * 0.2);
  const mx = v ? 18 : 12, my = 14;
  for (let y = 2; y < 32; y++) for (let x = 3; x < 27; x++) { const d = Math.hypot(x + 0.5 - mx, y + 0.5 - my); if (d < 9) { const cr = Math.hypot(x - mx + 3, y - my - 2) < 2 || Math.hypot(x - mx - 2, y - my + 3) < 1.5; P.N(x, y, cr ? LUZ.luaF : d > 8.2 ? '#d8c890' : LUZ.lua); } }
  for (let k = 0; k < 6; k++) P.N(4 + hash2(k, 1, s) * 21, 3 + hash2(k, 2, s) * 10, '#c8d0e8');   // estrelas paradas
  for (let y = 0; y < 34; y++) for (let x = 0; x < 30; x++) if (x < 3 || x > 26 || y < 2 || y > 31 || x === 14 || x === 15 || y === 16) P.put(x, y, RP.madeira, (x < 3 || y < 2 ? 4 : 2.6) + cg(x, y, s) * 0.3);
  for (let x = 0; x < 30; x++) { P.put(x, 32, RP.madeira, 4.4); P.put(x, 33, RP.madeira, 2); }   // o peitoril
  drape(P, v ? 4 : 25, 0, 34, 6, 9, RP.rosa, s + 1, 2.8);
  return P.done();
}
function lustrePano(v) {   // o lustre coberto de pano: a corrente, o lençol jogado por cima caindo em pontas, o contorno dos braços por baixo
  const W = 36, H = 30, P = painter(W, H), s = 30891 + v;
  for (let y = 0; y < 8; y++) P.put(18, y, RP.lata, y & 1 ? 2 : 3.6);
  for (let y = 8; y < 28; y++) {
    const t = (y - 8) / 20, hw = 4 + Math.sin(t * Math.PI * 0.9) * 13;
    for (let x = Math.floor(18 - hw); x <= 18 + hw; x++) {
      const u = (x + 0.5 - 18) / hw, tip = y > 22 && Math.abs(Math.sin(u * 7 + v)) < 0.5;
      if (y > 24 && !tip) continue;
      P.put(x, y, RP.pano, 3.4 - u * 0.8 + Math.sin(u * 7 + s) * 0.7 - t * 0.6 + cg(x, y, s) * 0.3);
    }
  }
  for (const x of [8, 14, 22, 28]) P.put(x, 17, RP.pano, 4.8);   // os braços marcando o pano
  return P.done();
}

/* ================= os Corredores Sem Fim ================= */
function banheira(v) {   // a banheira de pés de leão no meio do corredor, cheia até a borda de uma água parada e escura
  const W = 40, H = 20, P = painter(W, H), s = 30901 + v;
  for (let y = 2; y < 16; y++) { const t = (y - 2) / 14, inset = Math.round(t * t * 4); for (let x = 1 + inset; x < 39 - inset; x++) P.put(x, y, RP.porcelana, 4.2 - t * 1.4 - (x - 20) / 40 * 0.8 + cg(x, y, s) * 0.25); }
  for (let x = 1; x < 39; x++) { P.put(x, 1, RP.porcelana, 5); P.put(x, 2, RP.porcelana, 3.8); }
  for (let x = 3; x < 37; x++) P.put(x, 3, v ? RP.sombra : RP.ceramica, v ? 1 : 2.2 + Math.sin(x * 0.4) * 0.4);   // a água parada
  for (const x of [5, 33]) { P.put(x, 16, RP.ouro, 4); P.put(x + 1, 17, RP.ouro, 3.4); P.put(x, 18, RP.ouro, 2.8); P.put(x - 1, 19, RP.ouro, 3); P.put(x + 1, 19, RP.ouro, 2.2); }
  P.put(36, 0, RP.lata, 4); P.put(37, 0, RP.lata, 3); for (let y = -1; y < 1; y++) P.put(37, y, RP.lata, 4);
  return P.done();
}
function escadaChao(v) {   // a escada que desce para dentro do chão: o corrimão, os degraus sumindo no assoalho
  const W = 30, H = 22, P = painter(W, H), s = 30911 + v;
  for (let k = 0; k < 6; k++) { const x0 = 2 + k * 4, y0 = 4 + k * 3; plank(P, x0, y0, 6, 2, RP.madeira, s + k, false, 3.2 - k * 0.3); for (let y = y0 + 2; y < 22; y++) for (let x = x0; x < x0 + 4; x++) P.put(x, y, RP.escura, 1.6 - k * 0.15); }
  for (let k = 0; k <= 28; k++) { const x = 1 + k, y = 1 + k * 0.72; P.put(x, y, RP.verniz, 3.8); }
  for (const x of [1, 12, 22]) for (let y = 1 + (x - 1) * 0.72; y < 4 + (x - 1) * 0.72 + 3; y++) P.put(x, y, RP.verniz, 2.6);
  for (let x = 20; x < 30; x++) P.put(x, 21, RP.sombra, 0.6);   // onde o chão engole a escada
  return P.done();
}
function placasQuarto(v) {   // três plaquinhas de latão com o mesmo número: 7, 7, 7 (ou 13)
  const W = 34, H = 10, P = painter(W, H), s = 30921 + v;
  const D7 = ['###', '..#', '.#.', '.#.', '.#.'], D13 = ['.#.###', '##...#', '.#.##.', '.#...#', '.#.###'];
  for (let k = 0; k < 3; k++) {
    const x0 = k * 12; P.box(x0, 0, 10, 10, RP.ouro, s + k, 2.8);
    const G = v ? D13 : D7, gw = G[0].length, ox = x0 + ((10 - gw) >> 1);
    for (let j = 0; j < 5; j++) for (let i = 0; i < gw; i++) if (G[j][i] === '#') P.put(ox + i, 2 + j, RP.escura, 1);
  }
  return P.done();
}
function gaiolaPapel(v) {   // a gaiola de arame pendurada, a portinha aberta, um passarinho de papel dobrado lá dentro
  const W = 18, H = 30, P = painter(W, H), s = 30931 + v;
  for (let y = 0; y < 8; y++) P.put(9, y, RP.lata, 3);
  for (let y = 8; y < 28; y++) { const t = y < 12 ? (y - 8) / 4 : 1, hw = 2 + t * 6; for (const x of [9 - hw, 9 + hw, 9 - hw / 2, 9 + hw / 2]) P.put(x, y, RP.lata, 3.6 - (x > 9 ? 1 : 0)); }
  for (let x = 2; x < 17; x++) { P.put(x, 27, RP.lata, 3.8); P.put(x, 28, RP.lata, 2); }
  for (let x = 2; x < 17; x++) P.put(x, 19, RP.lata, 2.6);   // o poleiro
  // o passarinho de papel: um losango dobrado com a asa em pé
  for (const [dx, dy, l] of [[0, 0, 4.6], [1, 0, 4], [2, 0, 3.2], [-1, 1, 3.6], [0, 1, 4.2], [1, 1, 3.4], [2, 1, 2.6], [1, -1, 4.8], [1, -2, 4.4], [3, 0, 2.8], [-2, 1, 2.4]]) P.put(8 + dx, 17 + dy, RP.papel, l);
  if (v) for (let y = 21; y < 27; y++) P.put(16 + (y - 21) * 0.3, y, RP.lata, 3.2);   // a portinha aberta
  return P.done();
}
function lampadaFio(v) {   // a lâmpada pendurada num fio comprido (o bulbo e o balanço são ao vivo, no ponto 'bulbo')
  const H = v ? 28 : 20, P = painter(8, H), s = 30941 + v;
  for (let y = 0; y < H - 3; y++) P.put(4, y, RP.sombra, 3 + (y & 1) * 0.6);
  P.put(3, H - 3, RP.lata, 3.6); P.put(4, H - 3, RP.lata, 4.4); P.put(5, H - 3, RP.lata, 2.6);
  P.mark('bulbo', 4, H - 2, { len: H - 3 });
  return P.done(false);
}

/* ================= os Quartos Esquecidos ================= */
function cama(v) {   // a cama de criança: cabeceira de madeira com bolas nos pés, o colchão alto, o travesseiro e o cobertor dobrado
  const W = 44, H = 24, P = painter(W, H), s = 30951 + v, Cb = v ? RP.azul : RP.rosa;
  for (let y = 0; y < 24; y++) for (const x of [1, 2]) P.put(x, y, RP.madeira, x === 1 ? 4 : 2.4);
  for (let y = 8; y < 24; y++) for (const x of [41, 42]) P.put(x, y, RP.madeira, x === 41 ? 4 : 2.4);
  P.blob(1.5, 0.5, 2, 2, RP.madeira, s, 3.4); P.blob(41.5, 7.5, 2, 2, RP.madeira, s + 1, 3.4);
  for (let k = 0; k < 3; k++) for (let x = 3; x < 41; x += 1) P.put(x, 4 + k * 3, RP.madeira, k === 0 && x < 8 ? 3.6 : -1);   // as grades da cabeceira (escondidas pelo colchão no meio)
  for (let x = 3; x < 8; x++) for (let y = 1; y < 12; y += 3) P.put(x, y, RP.madeira, 3.2);
  P.box(3, 12, 38, 6, RP.lencol, s + 2, 3.2);
  P.blob(9, 10.5, 5.5, 2.6, RP.lencol, s + 3, 3.8);   // o travesseiro
  for (let y = 11; y < 18; y++) for (let x = 15; x < 41; x++) P.put(x, y, Cb, 3 + (y === 11 ? 1 : 0) + (x % 6 === 0 ? -0.7 : 0) + cg(x, y, s) * 0.25);   // o cobertor
  for (let x = 15; x < 41; x += 3) P.put(x, 18, Cb, 2);
  for (let x = 3; x < 41; x++) { P.put(x, 18, RP.madeira, 3.4); P.put(x, 19, RP.madeira, 2); }
  for (const x of [4, 39]) for (let y = 20; y < 24; y++) P.put(x, y, RP.madeira, 2.8);
  P.mark('sono', 9, 10, {}); P.mark('corpo', 26, 11, {});   // onde o 306 desenha a cabeça e o volume debaixo do cobertor
  return P.done();
}
function berco(v) {   // o berço vazio de grades, o cobertorzinho caído de um lado, os pés de balanço
  const W = 34, H = 26, P = painter(W, H), s = 30961 + v;
  for (let x = 2; x < 32; x++) { P.put(x, 2, RP.porcelana, 4.6); P.put(x, 3, RP.porcelana, 3); P.put(x, 16, RP.porcelana, 3.8); P.put(x, 17, RP.porcelana, 2.2); }
  for (let x = 2; x < 32; x += 3) for (let y = 4; y < 16; y++) P.put(x, y, RP.porcelana, 3.4);
  for (const x of [1, 32]) for (let y = 0; y < 22; y++) P.put(x, y, RP.porcelana, x === 1 ? 4 : 2.6);
  for (let x = 0; x < 34; x++) { const y = 22 + Math.round(Math.pow((x - 17) / 17, 2) * 3); P.put(x, y, RP.porcelana, 3.6); P.put(x, y + 1, RP.porcelana, 2); }   // o balanço
  drape(P, v ? 28 : 6, 4, 14, 4, 6, RP.azul, s, 3);
  return P.done();
}
function casaBonecas(v) {   // a casa de bonecas: o telhado pontudo, dois andares abertos com quartinhos, uma janelinha acesa dentro
  const W = 32, H = 34, P = painter(W, H), s = 30971 + v;
  for (let y = 0; y < 10; y++) { const hw = y * 1.6; for (let x = Math.floor(16 - hw); x <= 16 + hw; x++) P.put(x, y, RP.verniz, 3.4 - (x - 16) / 16 + (y % 3 === 0 ? 0.6 : 0)); }
  P.box(2, 10, 28, 24, RP.rosa, s, 2.8);
  for (const [x0, y0] of [[4, 12], [17, 12], [4, 23], [17, 23]]) for (let y = y0; y < y0 + 9; y++) for (let x = x0; x < x0 + 11; x++) P.put(x, y, RP.forrada, 1.6 + (y === y0 ? -0.6 : 0) + ((x + y) % 4 === 0 ? 0.6 : 0));
  // os moveizinhos: uma caminha, uma mesinha, uma escadinha
  for (let x = 5; x < 11; x++) P.put(x, 30, RP.lencol, 4); P.put(5, 29, RP.lencol, 4.4);
  for (let x = 19; x < 25; x++) P.put(x, 19, RP.madeira, 3.6); for (const x of [19, 24]) for (let y = 20; y < 21; y++) P.put(x, y, RP.madeira, 2.4);
  for (let k = 0; k < 4; k++) P.put(26 - k, 31 - k * 2, RP.madeira, 3.4);
  // a janelinha acesa: o quartinho de cima à esquerda tem uma luz dentro (e uma sombrinha na frente)
  for (let y = 14; y < 19; y++) for (let x = 6; x < 11; x++) P.N(x, y, (x === 8 && y > 15) ? '#a07040' : LUZ.abajur);
  P.N(8, 14, LUZ.miolo);
  return P.done();
}
function ursinho(v) {   // o ursinho gigante sentado, a cabeça caída para o lado, um botão no lugar de um olho, a costura aberta
  const W = 36, H = 40, P = painter(W, H), s = 30981 + v, U = RP.pelucia;
  P.blob(18, 28, 12, 11, U, s, 2.6);
  P.blob(8, 36, 6, 4, U, s + 1, 2.4); P.blob(28, 36, 6, 4, U, s + 2, 2.2);
  P.blob(8, 37, 3, 2.4, RP.pano, s + 3, 3.4); P.blob(28, 37, 3, 2.4, RP.pano, s + 4, 3);
  P.blob(5, 24, 4, 7, U, s + 5, 2.6); P.blob(31, 25, 4, 7, U, s + 6, 2.2);
  const hx = v ? 15 : 21, tilt = v ? -1 : 1;
  P.blob(hx, 11, 10, 9, U, s + 7, 2.8);
  P.blob(hx - 8 + tilt, 3 + tilt, 3.4, 3.4, U, s + 8, 2.8); P.blob(hx + 8 + tilt, 4 - tilt, 3.4, 3.4, U, s + 9, 2.4);
  P.blob(hx + tilt, 15, 4.6, 3.4, RP.pano, s + 10, 3.4);
  P.put(hx + tilt, 13, RP.sombra, 0.4); P.put(hx + tilt + 1, 13, RP.sombra, 0.4);
  P.blob(hx - 4, 9 + tilt * 0.5, 1.4, 1.4, RP.sombra, s + 11, 0.8);
  P.blob(hx + 4, 9 - tilt * 0.5, 1.8, 1.8, RP.azul, s + 12, 3); P.put(hx + 4, 9 - tilt * 0.5, RP.sombra, 0.4);   // o botão
  for (let k = 0; k < 5; k++) P.put(16 + k, 22 + (k & 1), RP.lencol, 4.4);   // a costura aberta com o enchimento saindo
  P.blob(18, 23.5, 2.4, 1.6, RP.lencol, s + 13, 4.2);
  return P.done();
}
function desenhos(v) {   // desenhos de criança presos na parede: a casa com sol, uma família de palito, e um homem alto sem rosto
  const W = 34, H = 16, P = painter(W, H), s = 30991 + v;
  for (let k = 0; k < 3; k++) {
    const x0 = k * 11 + (k === 1 ? 1 : 0), y0 = k === 1 ? 2 : 0, tilt = (k - 1) * 0.04;
    for (let y = 0; y < 13; y++) for (let x = 0; x < 10; x++) P.put(x0 + x, y0 + y + Math.round(x * tilt * 4), RP.papel, 4.4 + cg(x, y, s + k) * 0.2);
    P.put(x0 + 5, y0, RP.rosa, 3);   // o durex
    const col = [RP.amarelo, RP.azul, RP.sombra][k];
    if (k === 0) { P.blob(x0 + 7, y0 + 3, 1.6, 1.6, RP.amarelo, s, 4); for (let x = 1; x < 6; x++) P.put(x0 + x, y0 + 8, RP.rosa, 3); for (let y = 8; y < 12; y++) { P.put(x0 + 1, y0 + y, RP.rosa, 3); P.put(x0 + 5, y0 + y, RP.rosa, 3); } P.put(x0 + 3, y0 + 6, RP.rosa, 3); P.put(x0 + 2, y0 + 7, RP.rosa, 3); P.put(x0 + 4, y0 + 7, RP.rosa, 3); }
    else for (let f = 0; f < (k === 1 ? 3 : 1); f++) {
      const fx = x0 + (k === 1 ? 2 + f * 3 : 5), top = k === 2 ? 1 : 5 + (f === 2 ? 2 : 0);
      P.blob(fx, y0 + top + 1, 1, 1, col, s + f, k === 2 ? 0.6 : 2.6);
      for (let y = top + 2; y < 11; y++) P.put(fx, y0 + y, col, k === 2 ? 0.4 : 2.4);
      P.put(fx - 1, y0 + 11, col, 2); P.put(fx + 1, y0 + 11, col, 2);
      if (k === 2) for (let a = 1; a < 5; a++) { P.put(fx - a, y0 + 4 + a, col, 0.4); P.put(fx + a, y0 + 4 + a, col, 0.4); }   // os braços compridos demais
    }
  }
  return P.done();
}
function lencois(v) {   // lençóis pendurados num varal invisível do teto: dois panos brancos caindo até perto do chão
  const W = 36, H = v ? 44 : 34, P = painter(W, H), s = 31001 + v;
  for (let x = 0; x < 36; x++) P.put(x, 0, RP.lata, 2.4);
  drape(P, 10, 1, H - 3, 14, 16, RP.lencol, s, 3.2);
  drape(P, 27, 1, H - 8, 12, 13, RP.lencol, s + 1, 2.8);
  return P.done();
}
function mobile(v) {   // o móbile de berço: o arame em cruz pendurado; as figurinhas (lua, estrela, nuvem, peixe) giram ao vivo
  const W = 30, H = 22, P = painter(W, H), s = 31011 + v;
  for (let y = 0; y < 8; y++) P.put(15, y, RP.lata, 3);
  for (let x = 2; x < 28; x++) P.put(x, 8, RP.lata, 3.8 - Math.abs(x - 15) * 0.05);
  P.mark('mobile', 15, 8, { r: 12 });
  return P.done(false);
}

/* ================= a Galeria dos Espelhos ================= */
function molduraEspelho(v) {   // a moldura de espelho grande, encostada na parede: ornamento dourado, o vidro frio (o reflexo corre ao vivo)
  const W = 30, H = 48, P = painter(W, H), s = 31021 + v;
  for (let y = 0; y < 48; y++) for (let x = 0; x < 30; x++) {
    const ex = x < 3 || x > 26 || y < 3 || y > 44, top = y < 8 && Math.abs(x - 15) < 8 - y * 0.6;
    if (ex) P.put(x, y, RP.ouro, 3 + (x < 3 || y < 3 ? 1.2 : -0.8) + (Math.sin(x * 1.3 + y * 0.9) > 0.6 ? 0.8 : 0) + cg(x, y, s) * 0.3);
    else if (top && !ex) P.put(x, y, RP.ouro, 3.4);
    else P.put(x, y, RP.espelho, 2.2 + (x - y * 0.3) * 0.02 + cn(x, y, 30, 30, s) * 1.2);
  }
  if (v) for (let k = 0; k < 14; k++) P.put(8 + k * 0.9, 12 + k * 1.8 + Math.sin(k) * 1.2, RP.espelho, 5);   // uma trinca
  P.mark('reflexo', 4, 9, { w: 22, h: 34 });
  return P.done();
}
function cacosGrandes(v) {   // cacos grandes de espelho no chão, uns em pé como facas, com o brilho frio nas arestas
  const W = 30, H = 18, P = painter(W, H), s = 31031 + v;
  for (let k = 0; k < 5; k++) {
    const cx = 3 + k * 6 + hash2(k, v, s) * 3, h = 4 + hash2(k, 1, s) * (k === 2 ? 12 : 7), lean = (hash2(k, 2, s) - 0.5) * 6, wB = 2 + hash2(k, 3, s) * 2;
    for (let y = 0; y < h; y++) { const t = y / h, w = wB * (1 - t), x0 = cx + lean * t; for (let x = Math.floor(x0 - w); x <= x0 + w; x++) P.put(x, 17 - y, RP.espelho, 3 + (x < x0 ? 1.2 : -0.6) + t); }
    P.N(cx + lean, 17 - h + 1, LUZ.frio);
  }
  return P.done();
}
function manchaQueimado(v) {   // a mancha de queimado na parede: uma porta que não está mais lá, o contorno preto, a luz vermelha por baixo
  const W = 30, H = 44, P = painter(W, H), s = 31041 + v;
  for (let y = 0; y < 44; y++) for (let x = 0; x < 30; x++) {
    const dx = (x - 15) / 14, dy = (y - 26) / 20, d = dx * dx + dy * dy + cn(x, y, 14, 14, s) * 0.5;
    if (d > 1) continue;
    P.put(x, y, RP.queimado, 3 - d * 2.4 + cg(x, y, s) * 0.5);
  }
  for (let y = 8; y < 44; y++) for (const x of [8, 22]) P.put(x, y, RP.sombra, 0.6);
  for (let x = 8; x <= 22; x++) P.put(x, 8, RP.sombra, 0.6);
  for (let x = 9; x < 22; x++) { P.N(x, 43, x % 3 ? LUZ.vermelho : LUZ.brasa); if (hash2(x, 0, s) < 0.5) P.N(x, 42, LUZ.vermelho); }   // a luz por baixo da porta que não existe
  for (let k = 0; k < 6; k++) P.N(10 + hash2(k, 1, s) * 10, 20 + hash2(k, 2, s) * 20, LUZ.vermelho);
  return P.done(false);
}

/* ================= em todas ================= */
function espelhoParede(v) {   // o espelho de parede pequeno: oval, moldura de madeira escura, um reflexo que não é o do quarto
  const W = 16, H = 22, P = painter(W, H), s = 31051 + v;
  for (let y = 0; y < 22; y++) for (let x = 0; x < 16; x++) {
    const dx = (x + 0.5 - 8) / 8, dy = (y + 0.5 - 11) / 11, d = dx * dx + dy * dy; if (d > 1) continue;
    if (d > 0.7) P.put(x, y, RP.verniz, 3 - dx - dy + cg(x, y, s) * 0.4);
    else P.put(x, y, RP.espelho, 2.4 - dy * 0.8 + cn(x, y, 10, 10, s) * 1.2);
  }
  if (v) P.blob(8, 10, 2, 2.6, RP.sombra, s, 0.6);   // alguém atrás de você
  P.mark('reflexo', 4, 4, { w: 8, h: 14 });
  return P.done();
}
function porta(v) {   // a porta de casa solta: batente, almofadas, maçaneta de latão; v = 1 a porta de lugar nenhum (pintada de azul)
  const W = 24, H = 38, P = painter(W, H), s = 31061 + v, R = v ? RP.azul : RP.verniz;
  for (let y = 0; y < 38; y++) for (let x = 0; x < 24; x++) if (x < 2 || x > 21 || y < 2) P.put(x, y, RP.madeira, (x < 2 || y < 2 ? 3.8 : 2.4) + cg(x, y, s) * 0.3);
  P.box(2, 2, 20, 36, R, s + 1, 2.6);
  for (const [x0, y0, h] of [[5, 5, 12], [13, 5, 12], [5, 21, 13], [13, 21, 13]]) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + 6; x++) if (x === x0 || y === y0) P.put(x, y, R, 1.4); else if (x === x0 + 5 || y === y0 + h - 1) P.put(x, y, R, 3.8);
  P.blob(18.5, 20.5, 1.4, 1.4, RP.ouro, s + 2, 4);
  return P.done();
}
function quadroTorto(v) {   // o Quadro Torto: o mesmo quadro de família, pendurado de lado (o 306 desenha girado)
  const P = quadroFamilia(v ? 1 : 0); return P;
}

/* =============================== registro =============================== */
const HR = PS_HR;
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
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), pesadelo: true, psLuz: B.map(b => b.nv), psHalo: B.map(b => b.halo), psPts: Ps.map(P => P.pts), luz: [] }, extra || {}));
};
// A Casa que Não Era
def('ps_mesa_posta', 'Mesa posta para ninguém', F, 'frente', ['casa'], [mesaPosta(0), mesaPosta(1)], { comodo: true });
def('ps_cadeira_grande', 'Cadeira grande demais', F, 'frente', ['casa', 'corredores'], [cadeiraGrande(0), cadeiraGrande(1)], { alto: 4 });
def('ps_piano', 'Piano sem teclas', F, 'frente', ['casa'], [pianoSemTeclas(0), pianoSemTeclas(1)], { comodo: true });
def('ps_cartas', 'Pilha de cartas nunca enviadas', F, 'frente', ['casa', 'corredores'], [cartas(0), cartas(1)]);
def('ps_guarda_roupa', 'Guarda-roupa entreaberto', Wl, 'fundo', ['casa'], [guardaRoupa(0), guardaRoupa(1)], { alto: 5 });
def('ps_relogio', 'Relógio de pêndulo', Wl, 'fundo', ['casa', 'corredores'], [relogio(0), relogio(1)], { alto: 5 });
def('ps_quadro_familia', 'Quadro de família sem rostos', Wl, 'fundo', ['casa', 'corredores'], [quadroFamilia(0), quadroFamilia(1)]);
def('ps_papel_descascado', 'Papel de parede descascado', Wl, 'fundo', ['casa', 'corredores'], [papelDescascado(0), papelDescascado(1)]);
def('ps_janela_lua', 'Janela com uma lua grande demais', Wl, 'fundo', ['casa'], [janelaLua(0), janelaLua(1)], { comodo: true, luz: [{ x: 15, y: 14, r: 0.45 }], brilho: LUZ.lua });
def('ps_lustre_pano', 'Lustre coberto de pano', C, 'frente', ['casa'], [lustrePano(0), lustrePano(1)], { comodo: true });
// Os Corredores Sem Fim
def('ps_banheira', 'Banheira no meio do corredor', F, 'frente', ['corredores'], [banheira(0), banheira(1)]);
def('ps_escada_chao', 'Escada que desce para dentro do chão', F, 'frente', ['corredores'], [escadaChao(0), escadaChao(1)]);
def('ps_placas', 'Placas de número de quarto', Wl, 'fundo', ['corredores'], [placasQuarto(0), placasQuarto(1)]);
def('ps_gaiola_papel', 'Gaiola com um pássaro de papel', C, 'frente', ['corredores'], [gaiolaPapel(0), gaiolaPapel(1)]);
def('ps_lampada_fio', 'Lâmpada nua num fio comprido', C, 'frente', ['casa', 'corredores'], [lampadaFio(0), lampadaFio(1)], { luz: [{ x: 4, y: 22, r: 0.85 }], brilho: LUZ.abajur, anim: { k: 'ps_bulbo' } });
// Os Quartos Esquecidos
def('ps_cama', 'Cama', F, 'frente', ['quartos'], [cama(0), cama(1)], { cama: true });
def('ps_berco', 'Berço vazio', F, 'frente', ['quartos'], [berco(0), berco(1)], { quarto: true });
def('ps_casa_bonecas', 'Casa de bonecas', F, 'frente', ['quartos'], [casaBonecas(0), casaBonecas(1)], { quarto: true, luz: [{ x: 8, y: 16, r: 0.35 }], brilho: LUZ.abajur });
def('ps_ursinho', 'Ursinho gigante sentado', F, 'frente', ['quartos'], [ursinho(0), ursinho(1)], { quarto: true, alto: 4 });
def('ps_desenhos', 'Desenhos de criança', Wl, 'fundo', ['quartos'], [desenhos(0), desenhos(1)]);
def('ps_lencois', 'Lençóis pendurados', C, 'frente', ['quartos'], [lencois(0), lencois(1)], { alto: 5 });
def('ps_mobile', 'Móbile de berço', C, 'frente', ['quartos'], [mobile(0)], { quarto: true, anim: { k: 'ps_mobile' }, luz: [] });
// A Galeria dos Espelhos
def('ps_moldura_espelho', 'Moldura de espelho grande', Wl, 'fundo', ['galeria'], [molduraEspelho(0), molduraEspelho(1)], { alto: 5 });
def('ps_cacos_grandes', 'Cacos grandes de espelho', F, 'frente', ['galeria'], [cacosGrandes(0), cacosGrandes(1)], { brilho: LUZ.frio });
def('ps_mancha_queimado', 'Mancha de queimado', Wl, 'fundo', ['galeria'], [manchaQueimado(0), manchaQueimado(1)], { fundoCamada: true, luz: [{ x: 15, y: 42, r: 0.4 }], brilho: LUZ.vermelho });
// em todas
def('ps_espelho_parede', 'Espelho de parede pequeno', Wl, 'fundo', ['casa', 'corredores', 'quartos', 'galeria'], [espelhoParede(0), espelhoParede(1)], { espelho: true });
def('ps_porta', 'Porta solta', F, 'frente', [], [porta(0), porta(1)], { porta: true });
def('ps_quadro_torto', 'Quadro Torto', Wl, 'fundo', [], [quadroTorto(0)]);

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(PS_PROP_PLAN, {
  casa: { chao: [['ps_mesa_posta', 0.1, 1], ['ps_cadeira_grande', 0.08, 1], ['ps_piano', 0.07, 1], ['ps_cartas', 0.12, 1]], teto: [['ps_lustre_pano', 0.14, 1], ['ps_lampada_fio', 0.12, 2]], fundo: [['ps_guarda_roupa', 0.1, 1], ['ps_relogio', 0.08, 1], ['ps_quadro_familia', 0.16, 2], ['ps_papel_descascado', 0.14, 2], ['ps_janela_lua', 0.12, 1], ['ps_espelho_parede', 0.07, 1]] },
  corredores: { chao: [['ps_banheira', 0.05, 1], ['ps_escada_chao', 0.05, 1], ['ps_cadeira_grande', 0.04, 1], ['ps_cartas', 0.08, 1]], teto: [['ps_lampada_fio', 0.25, 2], ['ps_gaiola_papel', 0.08, 1]], fundo: [['ps_placas', 0.16, 2], ['ps_quadro_familia', 0.1, 1], ['ps_relogio', 0.06, 1], ['ps_papel_descascado', 0.1, 1], ['ps_espelho_parede', 0.08, 1]] },
  quartos: { chao: [['ps_berco', 0.1, 1], ['ps_casa_bonecas', 0.1, 1], ['ps_ursinho', 0.08, 1]], teto: [['ps_lencois', 0.2, 2], ['ps_mobile', 0.1, 1]], fundo: [['ps_desenhos', 0.2, 2], ['ps_espelho_parede', 0.06, 1]] },
  galeria: { chao: [['ps_cacos_grandes', 0.18, 2]], teto: [], fundo: [['ps_moldura_espelho', 0.2, 2], ['ps_espelho_parede', 0.12, 1]] }
});

/* ---------- a luz e os animados ---------- */
const psPt = (p, nm) => { const P = p.def.psPts && p.def.psPts[p.v]; return P && P[nm] ? P[nm] : null; };
let psGl = null;
const psGlowC = (c, r) => { const G = psGl || (psGl = {}), k = c + r; return G[k] || (G[k] = glow(r, c)); };
const swing = p => Math.sin(gameTime * 1.2 + p.X * 0.017) * 2.2;
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  const br = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(gameTime * Math.PI * 2 / 8));   // a respiração (8 s)
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.pesadelo) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), hl = p.def.psHalo[p.v], nv = p.def.psLuz[p.v];
    if (hl) { lc.globalAlpha = 0.55 * br; lc.drawImage(hl, X - PS_HR, Y - PS_HR); }
    if (nv) { lc.globalAlpha = 0.45 * br; lc.drawImage(nv, X, Y); }
    const B = psPt(p, 'bulbo'); if (B) { const q = B[0], sw = swing(p); lc.globalAlpha = 0.32 * br; lc.drawImage(psGlowC('#ffe0a0', 40), X + q.x + sw - 40, Y + q.y + 3 - 40); lc.globalAlpha = 0.5 * br; lc.drawImage(psGlowC('#fffbe0', 8), X + q.x + sw - 8, Y + q.y + 3 - 8); }
  }
  lc.globalAlpha = 1;
});
const MOB = [['#f8e08a', 'lua'], ['#7aa0d4', 'peixe'], ['#eeaab8', 'estrela'], ['#dcd8e4', 'nuvem']];
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.pesadelo) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    const Pn = psPt(p, 'ponteiro'); if (Pn) for (const q of Pn) {   // para trás: o grande uma volta a cada 8 s, o pequeno a cada 96
      const a1 = -gameTime * Math.PI * 2 / 8 + p.X, a2 = -gameTime * Math.PI * 2 / 96 + p.Y;
      lc.fillStyle = '#1a1416';
      for (let k = 1; k <= q.r; k++) lc.fillRect(Math.round(X + q.x + Math.sin(a1) * k), Math.round(Y + q.y - Math.cos(a1) * k), 1, 1);
      for (let k = 1; k <= q.r2; k++) lc.fillRect(Math.round(X + q.x + Math.sin(a2) * k), Math.round(Y + q.y - Math.cos(a2) * k), 1, 1);
    }
    const B = psPt(p, 'bulbo'); if (B) { const q = B[0], sw = Math.round(swing(p)), bx = X + q.x + sw, by = Y + q.y; lc.fillStyle = '#a08840'; lc.fillRect(bx - 1, by, 2, 1); lc.fillStyle = '#fff4c0'; lc.fillRect(bx - 2, by + 1, 4, 3); lc.fillStyle = '#ffffff'; lc.fillRect(bx - 1, by + 1, 1, 2); lc.fillStyle = '#e0c450'; lc.fillRect(bx - 1, by + 4, 2, 1); }
    const Mb = psPt(p, 'mobile'); if (Mb) { const q = Mb[0]; for (let k = 0; k < 4; k++) {   // as figurinhas girando em volta do eixo
      const a = gameTime * 0.6 + k * Math.PI / 2, x = X + q.x + Math.round(Math.cos(a) * q.r), dep = Math.sin(a), y = Y + q.y + 7 + (k & 1) * 3;
      lc.fillStyle = '#4a4a56'; lc.fillRect(x, Y + q.y, 1, y - Y - q.y);
      lc.globalAlpha = dep < 0 ? 0.6 : 1; lc.fillStyle = MOB[k][0];
      const w = Math.max(1, Math.round(Math.abs(Math.cos(a)) * 3) + 1);
      lc.fillRect(x - (w >> 1), y, w, 3); lc.fillStyle = '#ffffff'; lc.fillRect(x - (w >> 1), y, 1, 1); lc.globalAlpha = 1;
    } }
    const Rf = psPt(p, 'reflexo'); if (Rf) for (const q of Rf) {   // o brilho frio correndo devagar na diagonal
      const ph0 = (gameTime * 0.09 + p.X * 0.001) % 1; if (ph0 > 0.5) continue;
      const t = ph0 / 0.5, y0 = Y + q.y + Math.round(t * q.h);
      lc.globalAlpha = Math.sin(t * Math.PI) * 0.4; lc.fillStyle = '#eefaff';
      for (let k = 0; k < Math.min(q.w, 6); k++) { const yy = y0 - k; if (yy < Y + q.y || yy >= Y + q.y + q.h) continue; lc.fillRect(X + q.x + k + 1, yy, 1, 1); }
      lc.globalAlpha = 1;
    }
  }
});
PSART.painter = painter; PSART.RP = RP; PSART.drape = drape; PSART.plank = plank; PSART.porta = porta; PSART.psPt = psPt;
}
