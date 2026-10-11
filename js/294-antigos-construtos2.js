'use strict';

/* ================= a Cidade dos Antigos: os construtos, parte dois =================
   Cinco dos dez construtos e vigias da décima quinta camada (docs/camadas/13-cidade-antigos.md, seção 6; os outros
   cinco estão no 293). Nada aqui respira nem sangra: o sangue é pó de pedra ou faísca branca. Tudo se mexe em ângulo
   reto ou em curva perfeita; a luz é fria (o ciano dos glifos, o branco da estrela) e os avisos são vermelhos ou brancos.
   - o Cubo Errante (cuboerrante), um cubo de pedra lisa de 2 x 2 blocos com um glifo no meio; anda tombando sobre as
     arestas, um giro de verdade em volta da aresta de baixo, e para entre um tombo e outro. Não pula: degrau de até 2
     blocos ele vence num tombo só; parede mais alta ele sobe tombando por ela, devagar. Aviso: o canal das arestas
     acende em vermelho e ele se inclina para o lado do herói (0,75 s); depois tomba em cima dele. Na arena do Arquiteto
     a gravidade pode apontar para os 4 lados: e.gdir (0 baixo, 1 esquerda, 2 cima, 3 direita) diz qual lado é o chão;
     o chefe chama os seus com at2Cubo (vida pela metade) e eles seguem a gravidade da sala sozinhos (at2CuboGrav força);
   - o Êmbolo (embolo), um pistão que mora dentro da laje das ruas e dos corredores; da parede só se vê o glifo da ponta.
     Aviso: o glifo acende e uma fileira de pontos vermelhos marca o caminho de um lado ao outro do corredor (0,8 s); o
     pistão atravessa e empurra o herói (atEmpurrar). Só leva golpe com o pistão para fora (2 s); depois recolhe e anda
     por dentro da laje (um brilho correndo na pedra) até outro ponto do corredor. Não entra em pedra natural;
   - o Astrolábio (astrolabio), um núcleo de ferro estelar com três anéis girando em volta, em órbita lenta e redonda em
     volta de um ponto que segue o herói. Aviso: os anéis param, ficam de lado e se alinham, brilhando (0,9 s); saem três
     tiros pelos planos dos anéis;
   - o Obreiro (obreiro), o construto grande e lento de chapa e laje, um olho de fresta no bloco da cabeça. Arranca blocos
     de laje da sala e arremessa (aviso: o contorno do bloco pisca, 0,9 s; ele ergue o bloco acima da cabeça); monta muros
     de laje comum entre ele e o herói (aviso: o contorno dos blocos pisca em ciano; até 6 blocos por muro, quebram, somem
     quando ele morre); de perto, o pisão (aviso: o chão racha em volta dele, 0,85 s);
   - o Estilhaço da Estrela (estilhaco), uma lasca de luz que voa reto em diagonal e quica nas paredes como um raio
     refletido. Aviso: para, fica branca e mostra a linha pontilhada do trajeto com um ricochete (0,85 s); depois dispara
     por ela.
   Ninguém entra na arena nem nas Salas de Prumo (atNoGo é parede), a não ser os cubos chamados lá dentro; o Êmbolo e o
   Obreiro nunca mexem em bloco onde atNoGo, atKeep ou inAtLand valem. O 295 põe o nível (embrulha spawnEnemy por fora) e
   as tabelas de spawn. O pincel é o do 55 (cp, contorno), rampas de 6 tons da seção 12 com luz de cima à esquerda; as
   poses são assadas uma vez (o cubo em 18 ângulos, a lasca em 16 rumos). Materiais e bases do 298 (filtrados). Prefixo at2. */

/* ---------- números ---------- */
Object.assign(ET, {
  cuboerrante: { name: 'Cubo Errante', w: 24, h: 24, hp: 180, dmg: 26, xp: 48, kb: 0, fly: true, phase: true, blood: '#7c8898' },
  embolo: { name: 'Êmbolo', w: 12, h: 12, hp: 140, dmg: 28, xp: 42, kb: 0, fly: true, phase: true, blood: '#b0bccc' },
  astrolabio: { name: 'Astrolábio', w: 14, h: 14, hp: 80, dmg: 18, xp: 30, kb: 0.5, fly: true, blood: '#e8f0ff' },
  obreiro: { name: 'Obreiro', w: 16, h: 28, hp: 280, dmg: 30, xp: 62, kb: 0.1, fly: false, blood: '#7c8898' },
  estilhaco: { name: 'Estilhaço da Estrela', w: 8, h: 8, hp: 50, dmg: 20, xp: 26, kb: 0.7, fly: true, blood: '#f0f4ff' }
});
const AT2_TYPES = ['cuboerrante', 'embolo', 'astrolabio', 'obreiro', 'estilhaco'];
const AT2_SET = { cuboerrante: 1, embolo: 1, astrolabio: 1, obreiro: 1, estilhaco: 1 };
// materiais e bases do 298; filtradas agora e de novo a cada mundo
const AT2_BASES = [['lanca_compasso', 0.005], ['elmo_prumo', 0.005], ['couraca_tesselas', 0.005]];
const AT2_DROPS = {
  cuboerrante: [['nucleo_estelar', 0.45], ['min_ferro_estelar', 0.08], ['pocao', 0.07], ...AT2_BASES],
  embolo: [['nucleo_estelar', 0.25], ['min_ferro_estelar', 0.08], ['pocao', 0.07], ...AT2_BASES],
  astrolabio: [['po_estelar', 0.5, 1, 2], ['min_ferro_estelar', 0.08], ['pocao', 0.07], ...AT2_BASES],
  obreiro: [['nucleo_estelar', 0.55], ['min_ferro_estelar', 0.14, 1, 2], ['pocao', 0.08], ...AT2_BASES],
  estilhaco: [['po_estelar', 0.55, 1, 2], ['min_ferro_estelar', 0.07], ['pocao', 0.07], ...AT2_BASES]
};
function at2Tables() { for (const k of AT2_TYPES) DROPS[k] = AT2_DROPS[k].filter(([id]) => ITEMS[id]); }
at2Tables();
Object.assign(NAV_WALKERS, { obreiro: 1 });
Object.assign(CV_STEP, { obreiro: 1 });

const AT2_Q = Math.PI / 2;
const AT2_INCLINA = 0.75, AT2_LEAN = 0.3, AT2_ESMAGA = 0.2, AT2_TOMBO = 0.5, AT2_ESCALA = 1.3;   // o cubo: aviso, inclinação, tombo em cima, tombo comum, subida
const AT2_GLIFO_W = 0.8, AT2_EM_SAI = 0.14, AT2_EM_FORA = 2, AT2_EM_VOLTA = 0.35, AT2_EM_MAX = 8, AT2_EM_VEL = 44;   // o êmbolo
const AT2_ALINHA = 0.9, AT2_ABRE = 0.42, AT2_RAIO_SP = 150;                     // o astrolábio: aviso, abertura entre os tiros, velocidade
const AT2_MARCA = 0.9, AT2_ERGUE = 0.45, AT2_RACHA = 0.85, AT2_PLANO = 0.6, AT2_BLOCO_G = 520;   // o obreiro
const AT2_MIRA = 0.85, AT2_DISPARO = 330;                                       // o estilhaço

// as poses do Obreiro (o desenho de 34 x 36 está na arte; o EYES_E e o drawTop usam as mesmas mãos e o mesmo olho)
const OB = [
  { lean: 0, low: 0, hN: [24, 24], hF: [7, 24], fN: 0, fF: 0, lift: 0 },
  { lean: 0.5, low: 0, hN: [25, 23], hF: [7, 25], fN: 2, fF: -2, lift: 0 },
  { lean: 0.5, low: 0, hN: [23, 25], hF: [9, 23], fN: -2, fF: 2, lift: 0 },
  { lean: -0.6, low: 0, hN: [20, 0], hF: [12, 0], fN: 1, fF: -1, lift: 0 },
  { lean: 2, low: 1, hN: [31, 12], hF: [27, 14], fN: 3, fF: -2, lift: 0 },
  { lean: -1, low: 0, hN: [27, 17], hF: [5, 17], fN: 1, fF: -1, lift: 6 },
  { lean: 1, low: 3, hN: [27, 28], hF: [6, 28], fN: 3, fF: -2, lift: 0 },
  { lean: 1.5, low: 1, hN: [30, 23], hF: [26, 25], fN: 2, fF: -1, lift: 0 }
];
const OBX = 15;

/* ================= arte ================= */
const AT2 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
// as rampas da seção 12 (escuro para claro) e o branco da estrela
const HX = {
  pedra: ['#12161e', '#1e2632', '#2e3a4a', '#46566a', '#6a7e94', '#a4b6c8'],
  laje: ['#161a20', '#262c36', '#3a4250', '#56606e', '#7c8898', '#b0bccc'],
  glifo: ['#0a2a30', '#145058', '#2a8a94', '#4ac8d0', '#9af0f0', '#e8ffff'],
  ferro: ['#14121e', '#2a2840', '#4a4870', '#7a7ab0', '#b4b8e8', '#f0f4ff'],
  chapa: ['#141814', '#222a24', '#344038', '#4c5a50', '#6a7c70', '#9cb0a2'],
  estrela: ['#3a4060', '#6a76a8', '#a4b0e0', '#d0daf8', '#eef4ff', '#ffffff']
};
const RP = R6(HX.pedra), RL = R6(HX.laje), RG = R6(HX.glifo), RF = R6(HX.ferro), RC = R6(HX.chapa), RS = R6(HX.estrela);
AT2.HX = HX;
const setO = cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
// um bloco reto com as bordas biseladas, a luz de cima à esquerda; f(x, y) soma ao tom
function caixa(P, x0, y0, x1, y1, R, base, s, f) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let v = base + cg(x, y, s) * 0.25 - (y - y0) / Math.max(1, y1 - y0) * 0.5;
    if (y === y0) v += 1.3; else if (y === y1) v -= 1.1;
    if (x === x0) v += 0.7; else if (x === x1) v -= 0.8;
    if (f) v += f(x, y) || 0;
    P.put(x, y, R, v);
  }
}
function tubo(P, x0, y0, x1, y1, r, R, base, s) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    for (let oy = -r; oy <= r + 0.01; oy += 0.5) for (let ox = -r; ox <= r + 0.01; ox += 0.5) {
      if (Math.max(Math.abs(ox), Math.abs(oy)) > r) continue;   // de seção quadrada: aqui nada é redondo sem querer
      P.put(x + ox, y + oy, R, base - (oy / r) * 1.1 - (ox / r) * 0.6 + cg(x + ox | 0, y + oy | 0, s) * 0.25);
    }
  }
}
// gira um desenho em passos de 90° (sem perder pixel)
function rot90(cv, k) {
  k &= 3; if (!k) return cv;
  const c = mk(k & 1 ? cv.height : cv.width, k & 1 ? cv.width : cv.height), x = c.getContext('2d');
  x.translate(c.width / 2, c.height / 2); x.rotate(k * AT2_Q); x.drawImage(cv, -cv.width / 2, -cv.height / 2); return c;
}

/* ---------- o Cubo Errante, 24 x 24 girado: um quadro a cada 5° de 0 a 85 (o quadrado é igual a cada 90°) ----------
   a face de pedra lisa com o quadrado gravado, o anel do glifo, os quatro raios e o olho no meio; o canal fino junto
   das arestas (que acende no aviso); o bisel com a luz do mundo (de cima à esquerda, gire como girar). O granulado é
   simétrico nas 8 direções para o quadro 0 casar com o fim de um tombo. */
function cubo(a) {
  const N = 36, P = cp(N, N), c = N / 2, ca = Math.cos(a), sa = Math.sin(a), H = 12;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = x + 0.5 - c, py = y + 0.5 - c, u = px * ca + py * sa, v = -px * sa + py * ca, au = Math.abs(u), av = Math.abs(v);
    if (au > H || av > H) continue;
    const m = Math.max(au, av), ed = H - m, r = Math.hypot(u, v);
    const g0 = Math.floor(Math.min(au, av)), g1 = Math.floor(m), gr = (hash2(g0, g1, 29401) - 0.5) * 0.4;
    const lit = -(px * 0.6 + py * 0.8) / H * 0.55;
    if (ed < 2) {   // o bisel: a normal da aresta girada, contra a luz
      const nlx = au >= av ? Math.sign(u) : 0, nly = au >= av ? 0 : Math.sign(v);
      const nx = nlx * ca - nly * sa, ny = nlx * sa + nly * ca, L = -(nx * 0.6 + ny * 0.8);
      P.put(x, y, RP, 2.7 + L * 2 + (ed < 1 ? -0.3 : 0.25) + gr); continue;
    }
    if (ed < 3) { P.put(x, y, RP, 1.1 + gr * 0.5); continue; }
    if (r < 1.7) { P.put(x, y, RG, 2.8); continue; }
    if (r >= 3.2 && r < 4.4) { P.put(x, y, RG, 1.7 + lit); continue; }
    if (m >= 7 && m < 8) { P.put(x, y, RP, 1.4 + gr); continue; }
    if (m >= 8 && m < 8.8) { P.put(x, y, RP, 3.5 + lit * 1.5 + gr); continue; }
    if ((au < 0.7 || av < 0.7) && r >= 4.4 && m < 7) { P.put(x, y, RP, 1.5 + gr); continue; }
    P.put(x, y, RP, 2.8 + lit + gr);
  }
  const o = outlined(P.done()); return { r: o, w: whiteOf(o) };
}

/* ---------- o Êmbolo: a cabeça (7 de fundo x 12, a face batendo para a direita) e um gomo da haste (12 x 6) ---------- */
function emCabeca() {
  const P = cp(7, 12), s = 29451;
  caixa(P, 0, 0, 6, 11, RL, 2.8, s);
  for (let y = 2; y <= 9; y++) P.put(5, y, RG, y === 2 || y === 9 ? 1.6 : 2.4);   // o glifo da ponta (acende pelo EYES_E)
  for (const y of [4, 7]) { P.put(4, y, RG, 2); P.put(3, y, RG, 1.4); }
  P.put(5, 5, RG, 3.6); P.put(5, 6, RG, 3.6);
  for (let y = 1; y <= 10; y++) P.put(1, y, RL, 1.2);                                // a junta da placa de trás
  return outlined(P.done());
}
function emHaste() {
  const P = cp(12, 6), s = 29461;
  for (let x = 0; x < 12; x++) for (let y = 1; y <= 4; y++) P.put(x, y, RC, 3.2 - (y - 1) * 0.7 + cg(x, y, s) * 0.25 + (y === 1 ? 1 : 0));
  for (const x of [0, 1, 10, 11]) for (let y = 0; y <= 5; y++) P.put(x, y, RF, y === 0 ? 4.2 : y === 5 ? 0.6 : 3.2 - y * 0.4 - (x === 1 || x === 11 ? 0.8 : 0));
  return P.done();
}

/* ---------- o Astrolábio: o núcleo (uma esfera de ferro estelar, 12 x 12) com o olho de glifo ----------
   os anéis são desenhados a cada quadro (pontos de 1 pixel numa elipse girada: são só três). */
function astroNucleo() {
  const P = cp(12, 12), s = 29471, c = 6, r = 5;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const dx = (x + 0.5 - c) / r, dy = (y + 0.5 - c) / r, d = dx * dx + dy * dy; if (d > 1) continue;
    const band = Math.abs(dy) < 0.12 || Math.abs(dx) < 0.12;   // os dois meridianos gravados
    P.put(x, y, RF, 3 + 1.3 - (dx * 0.6 + dy * 0.8) * 1.6 - d * 0.9 + cg(x, y, s) * 0.3 + (band ? -1 : 0));
  }
  P.put(5, 5, RG, 4); P.put(6, 5, RG, 3.4); P.put(5, 6, RG, 3.4); P.put(6, 6, RG, 2.6);
  const o = outlined(P.done()); return { r: o, w: whiteOf(o) };
}

/* ---------- o Obreiro, 34 x 36 de frente para a direita (o corpo no x 15, os pés na linha 35) ----------
   0 parado, 1-2 andando, 3 o bloco erguido acima da cabeça, 4 o arremesso, 5 a perna erguida (aviso do pisão),
   6 o pisão, 7 montando o muro (as mãos para a frente, espalmadas) */
function obreiro(k) {
  const o = OB[k], P = cp(34, 36), s = 29501 + k * 7, BX = OBX, L = o.lean, lw = o.low;
  const shN = [BX + 8 + L, 12 + lw], shF = [BX - 7 + L, 12 + lw];
  // o braço de longe
  tubo(P, shF[0], shF[1], (shF[0] + o.hF[0]) / 2 - 1, (shF[1] + o.hF[1]) / 2 + 1, 1.5, RC, 1.6, s);
  tubo(P, (shF[0] + o.hF[0]) / 2 - 1, (shF[1] + o.hF[1]) / 2 + 1, o.hF[0], o.hF[1], 1.5, RC, 1.4, s + 1);
  caixa(P, o.hF[0] - 2, o.hF[1] - 2, o.hF[0] + 1, o.hF[1] + 1, RF, 1.8, s + 2);
  caixa(P, shF[0] - 3, shF[1] - 3, shF[0] + 2, shF[1] + 2, RC, 1.8, s + 3);
  // as pernas: pilares de chapa, os joelhos de ferro, os pés de laje
  const leg = (x0, fo, lift, base, ss) => {
    const top = 25 + lw, bot = 33 - lift;
    caixa(P, x0 + fo * 0.5, top, x0 + 4 + fo * 0.5, (top + bot) / 2, RC, base, ss);
    caixa(P, x0 + fo, (top + bot) / 2 + 1, x0 + 4 + fo, bot, RC, base - 0.2, ss + 1);
    P.line(x0 + fo * 0.7, (top + bot) / 2 + 0.5, x0 + 4 + fo * 0.7, (top + bot) / 2 + 0.5, RF, base + 0.8);
    caixa(P, x0 - 1 + fo, bot + 1, x0 + 5 + fo, bot + 2, RL, base - 0.2, ss + 2);
  };
  leg(BX - 6, o.fF, 0, 2.1, s + 4);
  leg(BX + 1, o.fN, o.lift, 3.1, s + 5);
  // a bacia, o tronco (um bloco de laje com o glifo do núcleo), a cabeça (o olho de fresta)
  caixa(P, BX - 6 + L * 0.5, 22 + lw, BX + 6 + L * 0.5, 25 + lw, RC, 2.4, s + 6);
  caixa(P, BX - 8 + L, 9 + lw, BX + 8 + L, 22 + lw, RL, 3.1, s + 7, (x, y) => {
    const u = x - (BX + L), v = y - (15.5 + lw), m = Math.max(Math.abs(u + 0.5), Math.abs(v));
    if (m >= 3 && m < 4) return -1.4;                     // o quadrado gravado em volta do núcleo
    if (y === Math.round(18.5 + lw) && Math.abs(u) > 5) return -1;   // a junta das placas
    return 0;
  });
  for (let y = -1; y <= 1; y++) for (let x = -1; x <= 0; x++) P.put(BX + L + x, 15.5 + lw + y, RG, 2.2 + (y === 0 ? 0.8 : 0));
  const hx = BX + L * 1.3;
  caixa(P, hx - 3, 2 + lw, hx + 5, 8 + lw, RL, 3.1, s + 8);
  for (let x = 0; x <= 4; x++) P.put(hx + 0.5 + x, 5 + lw, RG, x === 4 ? 2.2 : 3.2);   // a fresta (o EYES_E acende)
  P.line(hx - 2, 8.6 + lw, hx + 4, 8.6 + lw, RC, 1.2);
  // o ombro e o braço de perto
  caixa(P, shN[0] - 3, shN[1] - 3, shN[0] + 3, shN[1] + 2, RC, 3.2, s + 9);
  const eN = [(shN[0] + o.hN[0]) / 2 + 0.5, (shN[1] + o.hN[1]) / 2 + 1];
  tubo(P, shN[0], shN[1] + 1, eN[0], eN[1], 1.6, RC, 3, s + 10);
  tubo(P, eN[0], eN[1], o.hN[0], o.hN[1], 1.5, RC, 2.8, s + 11);
  caixa(P, eN[0] - 1, eN[1] - 1, eN[0] + 1, eN[1] + 1, RF, 3.4, s + 12);
  caixa(P, o.hN[0] - 2, o.hN[1] - 2, o.hN[0] + 2, o.hN[1] + 2, RF, 3, s + 13);
  return setO(P.done());
}
// o bloco de laje arrancado (12 x 12)
function bloco() {
  const P = cp(12, 12), s = 29581;
  caixa(P, 0, 0, 11, 11, RL, 2.9, s, (x, y) => (x === 6 && y > 1 && y < 10) ? -1.2 : 0);
  return outlined(P.done());
}

/* ---------- o Estilhaço da Estrela: uma lasca de luz em losango comprido, 16 rumos (15 x 15) ---------- */
function lasca(a) {
  const N = 15, P = cp(N, N), c = N / 2, ca = Math.cos(a), sa = Math.sin(a);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = x + 0.5 - c, py = y + 0.5 - c, u = px * ca + py * sa, v = -px * sa + py * ca, k = Math.abs(u) / 6.6 + Math.abs(v) / 2.5;
    if (k > 1) continue;
    P.put(x, y, RS, 2.6 + (1 - k) * 2.6 + (v < 0 ? 0.5 : -0.7) - (px * 0.6 + py * 0.8) / 7 * 0.6 + (u > 2.5 ? 0.4 : 0));
  }
  const o = outlined(P.done()); return { r: o, w: whiteOf(o) };
}

AT2.get = () => AT2.ready || (AT2.ready = {
  cubo: Array.from({ length: 18 }, (_, k) => cubo(k * 5 * Math.PI / 180)),
  emH: [0, 1, 2, 3].map(k => rot90(emCabeca(), k)), emS: [0, 1, 2, 3].map(k => rot90(emHaste(), k)),
  nucleo: astroNucleo(),
  ob: OB.map((_, k) => obreiro(k)), bloco: bloco(),
  lasca: Array.from({ length: 16 }, (_, k) => lasca(k * Math.PI / 8))
});
AT2.GL = {
  glifo: glow(5, '#4ac8d0'), glifoG: glow(10, '#4ac8d0'), glifoM: glow(16, '#9af0f0'),
  branco: glow(6, '#f0f4ff'), brancoG: glow(12, '#f0f4ff'), brancoM: glow(18, '#e8f0ff'),
  aviso: glow(8, '#ff4a5a'), avisoG: glow(14, '#ff4a5a'), violeta: glow(10, '#b4b8e8')
};
}

/* ================= ajudas ================= */
const AT2_PO = ['#56606e', '#7c8898', '#3a4250', '#b0bccc'], AT2_FAIS = ['#f0f4ff', '#e8ffff', '#9af0f0'], AT2_CIANO = ['#4ac8d0', '#9af0f0', '#e8ffff'], AT2_ESTR = ['#ffffff', '#eef4ff', '#d0daf8'];
const at2Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const at2NearP = (x, y, r = 220) => clamp(1 - Math.hypot(pl.x + pl.w / 2 - x, pl.y + pl.h / 2 - y) / r, 0, 1);
const at2Ang = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
// onde nenhum construto mexe em bloco: a arena, as Salas de Prumo, os postos guardados da geração, os pousos
const at2Proibido = (tx, ty) => atNoGo(tx, ty) || atKeep.has(ty * WW + wrapX(tx)) || inAtLand(tx, ty, 1);
const at2Laje = t => t === AT_LAJE || t === AT_GLIFO;
// faíscas frias acesas (com o brilho da cor delas) e pó de pedra (as partículas comuns, com peso)
const at2Fx = [], at2FxGl = {};
function at2P(o) { if (at2Fx.length < 400) at2Fx.push(o); }
function at2Sparks(x, y, n, cols, sp = 40, g = 0, life = 0.4) {
  if (at2Fx.length > 380) return;
  for (let i = 0; i < n; i++) at2P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[(Math.random() * cols.length) | 0], size: 1 });
}
function at2Po(x, y, n, sp = 50, g = 260, life = 0.5) { for (let i = 0; i < n; i++) burst(x, y, 1, AT2_PO[(Math.random() * 4) | 0], sp, g, life); }
// um ponto da linha a < meio pixel: o desenho fica só em fillRect de 1 x 1
const at2Dot = (x, y, cx, cy, sz = 1) => lc.fillRect(Math.round(x - cx), Math.round(y - cy), sz, sz);
function at2Linha(x0, y0, x1, y1, cx, cy, step = 1) { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step)); for (let i = 0; i <= n; i++) at2Dot(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, cx, cy); }
function at2SegDist(px, py, x0, y0, x1, y1) { const vx = x1 - x0, vy = y1 - y0, L = vx * vx + vy * vy || 1, u = clamp(((px - x0) * vx + (py - y0) * vy) / L, 0, 1); return Math.hypot(px - x0 - vx * u, py - y0 - vy * u); }
// a câmera a partir do (fx, fy) que o desenho recebe
const at2Cam = (e, fx, fy) => [Math.round(e.x + e.w / 2) - fx, Math.round(e.y + e.h) - fy];

/* ================= o Cubo Errante =================
   O cubo fica sempre alinhado na grade quando parado (os 2 x 2 blocos certinhos). Em volta do centro, o "chão" é o lado
   para onde a gravidade dele puxa (AT_GDIR[gdir].gx, gy) e a "direita" é (rx, ry): as contas são feitas nesse referencial,
   em blocos a partir do centro (a, b; a ao longo do chão, b para cima), e valem para as 4 gravidades. */
function at2CuboG(e) { return e.gfix != null ? e.gfix : e.arena && AT_GRAV.length ? atGravAt(e.x + 12, e.y + 12) : 0; }
// o chefe força a gravidade de um cubo (dir 0..3; null volta a seguir a sala)
function at2CuboGrav(e, dir) { if (!e || e.type !== 'cuboerrante') return; e.arena = true; e.gfix = dir == null ? null : dir & 3; }
// o chefe chama um cubo na arena: vida pela metade, livre para andar lá dentro, a gravidade da sala (ou a dada)
function at2Cubo(px, py, dir = null, zone = AT_ZONE0 + 3, half = true) {
  const e = spawnEnemy('cuboerrante', px, py, zone); if (!e) return null;
  e.arena = true; if (dir != null) e.gfix = dir & 3;
  if (half) { e.maxHp = Math.max(1, Math.round(e.maxHp / 2)); e.hp = e.maxHp; }
  e.gd = -1; e.state = 'fall'; e.fv = 0; e.memT = 6;
  return e;
}
function at2Cel(e, G, cx, cy, a, b) {
  const tx = Math.floor((cx + (G.rx * a - G.gx * b) * T) / T), ty = Math.floor((cy + (G.ry * a - G.gy * b) * T) / T);
  return solidAt(tx, ty) || (!e.arena && atNoGo(tx, ty));
}
const at2W = (G, cx, cy, a, b) => [cx + (G.rx * a - G.gx * b) * T, cy + (G.ry * a - G.gy * b) * T];
// o próximo tombo para o lado s: rolar (por cima de um degrau de até 2), subir pela parede, ou nada
function at2CuboPlan(e, G, s, maxDrop, climb) {
  const cx = e.x + 12, cy = e.y + 12, C = (a, b) => at2Cel(e, G, cx, cy, a, b);
  const ahead = b => C(s * 1.5, b) || C(s * 2.5, b), head = b => C(s * 0.5, b) || C(s * 1.5, b);
  let h = -1;
  for (let k = 0; k <= 2; k++) {
    if (head(k + 1.5) || (k > 0 && C(-s * 0.5, k + 0.5))) break;   // o canto de cima precisa de vão para passar
    if (!ahead(k - 0.5) && !ahead(k + 0.5)) { h = k; break; }
  }
  const mkM = (kind, ex, ey, p0, p1) => {
    const v0x = cx - p0[0], v0y = cy - p0[1], v1x = ex - p1[0], v1y = ey - p1[1];
    return { kind, s, cx, cy, ex, ey, p0x: p0[0], p0y: p0[1], p1x: p1[0], p1y: p1[1], sg: Math.sign(v0x * v1y - v0y * v1x) || 1, t: 0, hit: false };
  };
  if (h >= 0) {
    let drop = 0; while (drop <= maxDrop && !C(s * 1.5, h - 1.5 - drop) && !C(s * 2.5, h - 1.5 - drop)) drop++;
    if (drop > maxDrop) return null;
    const [ex, ey] = at2W(G, cx, cy, 2 * s, h);
    return mkM('roll', ex, ey, at2W(G, cx, cy, s, -1), at2W(G, cx, cy, s, h - 1));
  }
  // parede colada e alta: sobe tombando por ela (em volta da aresta de cima)
  if (climb && (C(s * 1.5, -0.5) || C(s * 1.5, 0.5)) && !C(-0.5, 1.5) && !C(0.5, 1.5) && !C(-0.5, 2.5) && !C(0.5, 2.5)) {
    const [ex, ey] = at2W(G, cx, cy, 0, 2), p = at2W(G, cx, cy, s, 1);
    return mkM('climb', ex, ey, p, p);
  }
  return null;
}
// o centro e o ângulo do desenho agora
function at2CuboPose(e) {
  const M = e.mv; if (!M) return [e.x + 12, e.y + 12, 0];
  const f = Math.min(1, e.ang / AT2_Q), px = lerp(M.p0x, M.p1x, f), py = lerp(M.p0y, M.p1y, f), a = M.sg * e.ang, ca = Math.cos(a), sa = Math.sin(a);
  const vx = M.cx - M.p0x, vy = M.cy - M.p0y;
  return [px + vx * ca - vy * sa, py + vx * sa + vy * ca, a];
}
function at2CuboBate(e, x, y) {
  if (rectSolid(x, y, 24, 24)) return true;
  if (e.arena) return false;
  const x0 = Math.floor(x / T), x1 = Math.floor((x + 23.9) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + 23.9) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (atNoGo(tx, ty)) return true;
  return false;
}
// a pancada no chão: pó ao longo da aresta, o baque, um tremor se perto
function at2CuboBaque(e, G, k = 1) {
  const cx = e.x + 12, cy = e.y + 12, v = at2Near(e, 260);
  for (const a of [-1, -0.4, 0.4, 1]) { const [x, y] = at2W(G, cx, cy, a, -1); at2Po(x, y, 2, 40 * k, 200, 0.5); }
  if (v > 0.05) sfx.at2Tomba(Math.max(0.25, v) * Math.min(1.4, k));
  if (v > 0.55) shake(1.2 + k);
}
function at2CuboCai(e, G, dt) {
  e.fv = Math.min((e.fv || 0) + GRAV * dt, MAXFALL);
  const d = e.fv * dt, n = Math.max(1, Math.ceil(d / 4)), st = d / n;
  for (let i = 0; i < n; i++) {
    const nx = e.x + G.gx * st, ny = e.y + G.gy * st;
    if (at2CuboBate(e, nx, ny)) {
      if (G.gx > 0) e.x = Math.floor((nx + 24) / T) * T - 24; else if (G.gx < 0) e.x = Math.ceil(nx / T) * T;
      if (G.gy > 0) e.y = Math.floor((ny + 24) / T) * T - 24; else if (G.gy < 0) e.y = Math.ceil(ny / T) * T;
      at2CuboBaque(e, G, clamp(e.fv / 260, 0.5, 1.6)); e.fv = 0; e.state = 'rest'; e.stateT = 0.5; return;
    }
    e.x = nx; e.y = ny;
  }
}
// preso dentro de bloco (um módulo da arena que deslizou): sai para cima, ou para os lados
function at2CuboSolta(e, G) {
  if (!rectSolid(e.x + 1, e.y + 1, 22, 22)) return;
  for (let k = 1; k <= 4; k++) for (const [a, b] of [[0, k], [k, 0], [-k, 0], [0, -k]]) {
    const x = e.x + (G.rx * a - G.gx * b) * T, y = e.y + (G.ry * a - G.gy * b) * T;
    if (!rectSolid(x, y, 24, 24)) { e.x = x; e.y = y; return; }
  }
}
AI.cuboerrante = function (e, dt, dx, dy, dist, aggro) {
  e.vx = 0; e.vy = 0; e.stateT -= dt; e.stun = 0; e.giveUp = (e.giveUp || 0) - dt;
  const gd = at2CuboG(e), G = AT_GDIR[gd];
  if (gd !== e.gd) {   // a gravidade virou: larga o tombo no meio e cai para o chão novo
    if (e.mv) { e.x = e.mv.cx - 12; e.y = e.mv.cy - 12; e.mv = null; }
    if (e.gd !== undefined) { e.state = 'fall'; e.fv = 0; }
    e.gd = gd; e.cling = 0; e.ang = 0;
  }
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'fall') { at2CuboCai(e, G, dt); return; }
  const M = e.mv;
  if (M) {
    M.t += dt;
    if (e.state === 'lean') {   // inclinado para o herói, as arestas acesas; treme no fim
      const q = clamp(M.t / AT2_INCLINA, 0, 1); e.ang = AT2_LEAN * easeOut(q) + (q > 0.7 ? Math.sin(e.t * 60) * 0.02 : 0);
      if (Math.random() < dt * 16) { const [x, y] = at2W(G, M.cx, M.cy, M.s * 1, -1); at2Po(x, y, 1, 20, 120, 0.4); }
      if (M.t >= AT2_INCLINA) { e.state = 'crush'; M.t = 0; M.a0 = AT2_LEAN; }
    } else if (e.state === 'crush') {   // tomba em cima: o golpe vale da metade do giro para frente
      const q = clamp(M.t / AT2_ESMAGA, 0, 1); e.ang = M.a0 + (AT2_Q - M.a0) * q * q;
      if (!M.hit && e.ang > 0.9 && !pl.dead && overlap({ x: M.ex - 12, y: M.ey - 12, w: 24, h: 24 }, pl)) {
        M.hit = true; const r = hurtPlayer(e.dmg, M.cx, null, false), k = r === 'hit' ? 1 : r === 'none' ? 0 : 0.6;
        if (k) atEmpurrar((G.rx * M.s * 240 - G.gx * 200) * k, (G.ry * M.s * 240 - G.gy * 200) * k);
        if (r === 'hit') at2Sparks(pcx, pcy, 8, AT2_FAIS, 60);
      }
    } else {   // o tombo comum (acelera como quem cai), a subida devagar
      const q = clamp(M.t / M.dur, 0, 1); e.ang = AT2_Q * (M.kind === 'climb' ? q * q * (3 - 2 * q) : q * q);
    }
    const [x, y] = at2CuboPose(e); e.x = x - 12; e.y = y - 12;
    if (e.ang >= AT2_Q - 1e-6) {   // assentou
      const k = M.kind === 'climb' ? 0.6 : e.state === 'crush' ? 1.4 : 1;
      e.x = M.ex - 12; e.y = M.ey - 12; e.ang = 0; e.mv = null; e.cling = M.kind === 'climb' ? M.s : 0;
      e.state = 'rest'; e.stateT = aggro ? 0.42 : 1.1; at2CuboBaque(e, G, k);
    }
    return;
  }
  at2CuboSolta(e, G);
  const cx = e.x + 12, cy = e.y + 12, C = (a, b) => at2Cel(e, G, cx, cy, a, b);
  // apoiado? o chão do lado da gravidade, ou a parede por onde está subindo
  if (C(-0.5, -1.5) || C(0.5, -1.5)) e.cling = 0;
  else if (!(e.cling && (C(e.cling * 1.5, -0.5) || C(e.cling * 1.5, 0.5)))) { if (e.cling) e.giveUp = 4; e.cling = 0; e.state = 'fall'; e.fv = 0; return; }
  if (e.stateT > 0) return;
  const al = (pcx - cx) * G.rx + (pcy - cy) * G.ry;
  let s;
  if (e.cling) s = e.cling;
  else if (aggro) s = Math.abs(al) < 8 ? 0 : Math.sign(al);
  else { if (!(e.wn > 0)) { e.wdir = Math.random() < 0.35 ? 0 : Math.random() < 0.5 ? -1 : 1; e.wn = 1 + ((Math.random() * 3) | 0); } e.wn--; s = e.wdir; }
  if (!s) { e.stateT = aggro ? 0.25 : 1.4; return; }
  const P = at2CuboPlan(e, G, s, aggro ? 12 : 3, e.giveUp <= 0);
  if (!P) { if (e.cling) { e.cling = 0; e.giveUp = 4; e.state = 'fall'; e.fv = 0; } else if (!aggro) e.wdir = -e.wdir; e.stateT = aggro ? 0.5 : 1; return; }
  e.mv = P; e.ang = 0; e.facing = s * (G.rx || -G.ry) || e.facing;
  if (P.kind === 'roll' && aggro && !pl.dead && overlap({ x: P.ex - 15, y: P.ey - 15, w: 30, h: 30 }, pl)) {
    e.state = 'lean'; sfx.at2Aresta(Math.max(0.4, at2Near(e)));
  } else {
    e.state = 'tip'; P.dur = P.kind === 'climb' ? AT2_ESCALA : AT2_TOMBO;
    if (P.kind === 'climb') { const v = at2Near(e, 240); if (v > 0.05) sfx.at2Range(v); }
  }
};
// desenho: o quadro do ângulo, no centro da pose; a câmera sai do (fx, fy)
DRAW_E.cuboerrante = (e, fx, fy, fl) => {
  const [cx, cy] = at2Cam(e, fx, fy), [x, y, a] = at2CuboPose(e), Q = AT2_Q;
  const k = Math.round((((a % Q) + Q) % Q) / (5 * Math.PI / 180)) % 18, S = AT2.get().cubo[k], img = fl ? S.w : S.r;
  lc.drawImage(img, Math.round(x - cx - img.width / 2), Math.round(y - cy - img.height / 2));
};
EYES_E.cuboerrante = (e, fx, fy) => {
  const [cx, cy] = at2Cam(e, fx, fy), [x, y] = at2CuboPose(e), G = AT2.GL;
  const w = e.state === 'lean' ? clamp(e.mv ? e.mv.t / AT2_INCLINA : 0, 0, 1) : e.state === 'crush' ? 1 : 0;
  lc.globalAlpha = 0.3 + 0.08 * Math.sin(gameTime * 2.4); lc.drawImage(G.glifo, Math.round(x - cx) - 5, Math.round(y - cy) - 5);
  if (w) { lc.globalAlpha = 0.25 + 0.4 * w; lc.drawImage(G.avisoG, Math.round(x - cx) - 14, Math.round(y - cy) - 14); }
};
WARN_E.cuboerrante = e => e.state === 'lean';
// por cima do escuro: o olho do glifo e, no aviso, o canal das arestas aceso
function at2CuboTop(e, cx, cy) {
  const [x, y, a] = at2CuboPose(e), ca = Math.cos(a), sa = Math.sin(a);
  lc.globalAlpha = 0.85; lc.fillStyle = '#9af0f0'; lc.fillRect(Math.round(x - cx) - 1, Math.round(y - cy) - 1, 2, 2);
  if (e.state !== 'lean' && e.state !== 'crush') return;
  const q = e.state === 'crush' ? 1 : clamp(e.mv.t / AT2_INCLINA, 0, 1), r = 9.5;
  const pt = (u, v) => [x + u * ca - v * sa, y + u * sa + v * ca], C = [pt(-r, -r), pt(r, -r), pt(r, r), pt(-r, r)];
  lc.globalAlpha = 0.45 + 0.55 * q; lc.fillStyle = q > 0.7 && Math.floor(gameTime * 14) % 2 ? '#ffffff' : AT_COL.aviso;
  for (let i = 0; i < 4; i++) at2Linha(C[i][0], C[i][1], C[(i + 1) % 4][0], C[(i + 1) % 4][1], cx, cy);
}

/* ================= o Êmbolo =================
   e.spot = { x, y, d, L }: a laje onde ele está (x, y), o rumo para o corredor (d: 0 direita, 1 baixo, 2 esquerda,
   3 cima) e quantos blocos de ar o pistão atravessa até a parede do outro lado (2 a 8). e.ext: quanto está para fora. */
const AT2_D4 = [[1, 0], [0, 1], [-1, 0], [0, -1]];
function at2EmLinha(tx, ty, d) {
  const [ux, uy] = AT2_D4[d];
  for (let k = 1; k <= AT2_EM_MAX + 1; k++) {
    const x = tx + ux * k, y = ty + uy * k;
    if (solidAt(x, y)) return k >= 3 ? k - 1 : 0;
    if (atNoGo(x, y)) return 0;
  }
  return 0;
}
// o retângulo do pistão para fora (ext px) a partir da face da laje
function at2EmRect(S, ext) {
  const [ux, uy] = AT2_D4[S.d];
  if (ux) return { x: ux > 0 ? (S.x + 1) * T : S.x * T - ext, y: S.y * T + 1, w: Math.max(1, ext), h: 10 };
  return { x: S.x * T + 1, y: uy > 0 ? (S.y + 1) * T : S.y * T - ext, w: 10, h: Math.max(1, ext) };
}
// o quanto o herói está fora da linha do pistão (px; 0 = em cima dela)
function at2EmLonge(S) {
  const R = at2EmRect(S, S.L * T), pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  return Math.max(0, Math.max(R.x - pcx, pcx - R.x - R.w) - pl.w / 2) + Math.max(0, Math.max(R.y - pcy, pcy - R.y - R.h) - pl.h / 2);
}
// busca por dentro da laje (laje e laje de glifo, nunca pedra natural) o ponto de onde a linha passa mais perto do herói
// outro êmbolo já está (ou vai) ali do lado?
const at2EmOcupado = (e, x, y) => enemies.some(o => o !== e && !o.dead && o.type === 'embolo' && [o.spot, o.dest].some(S => S && Math.abs(wdx(S.x - x)) <= 1 && Math.abs(S.y - y) <= 1));
function at2EmBusca(sx, sy, porHeroi, e = null) {
  const R = 12, seen = new Set([sx * 4096 + sy]), q = [[sx, sy, 0, -1]];
  let best = null, bs = 1e9;
  for (let i = 0; i < q.length && i < 500; i++) {
    const [x, y, n] = q[i];
    for (let d = 0; d < 4; d++) {
      const L = at2EmLinha(x, y, d); if (!L || (e && n && at2EmOcupado(e, x, y))) continue;
      const sc = porHeroi ? at2EmLonge({ x, y, d, L }) + n * 1.5 : n;
      if (sc < bs) { bs = sc; best = { x, y, d, L, i, sc }; }
    }
    for (const [ux, uy] of AT2_D4) {
      const nx = x + ux, ny = y + uy, k = nx * 4096 + ny;
      if (Math.abs(nx - sx) > R || Math.abs(ny - sy) > R || seen.has(k)) continue;
      seen.add(k);
      if (!at2Laje(tileAt(nx, ny)) || at2Proibido(nx, ny)) continue;
      q.push([nx, ny, n + 1, i]);
    }
  }
  if (!best) return null;
  const path = []; for (let i = best.i; i >= 0; i = q[i][3]) path.push([q[i][0], q[i][1]]);
  best.path = path.reverse(); return best;
}
// onde ele nasce: a laje mais perto do ponto pedido (num raio de 6) que dê um corredor; sem nenhuma, ele não nasce
function at2EmNasce(e) {
  const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h / 2) / T);
  let best = null, bd = 1e9;
  for (let y = ty - 6; y <= ty + 6; y++) for (let x = tx - 6; x <= tx + 6; x++) {
    if (!at2Laje(tileAt(x, y)) || at2Proibido(x, y) || at2EmOcupado(e, x, y)) continue;
    for (let d = 0; d < 4; d++) {   // a linha que passa mais perto do ponto pedido (o corredor certo, não o do lado)
      const L = at2EmLinha(x, y, d); if (!L) continue;
      const R = at2EmRect({ x, y, d, L }, L * T), px = e.x + e.w / 2, py = e.y + e.h / 2;
      const dd = Math.max(0, R.x - px, px - R.x - R.w) + Math.max(0, R.y - py, py - R.y - R.h) + (Math.abs(x - tx) + Math.abs(y - ty)) * 0.5;
      if (dd < bd) { best = { x: wrapX(x), y, d, L }; bd = dd; }
    }
  }
  if (!best) { e.dead = true; e.despawn = true; return; }
  e.spot = best; e.ext = 0; e.state = 'hide'; e.stateT = 0.5; at2EmCaixa(e);
}
function at2EmCaixa(e) {
  const S = e.spot;
  if (e.ext > 0.5) { const R = at2EmRect(S, e.ext); e.x = R.x; e.y = R.y; e.w = R.w; e.h = R.h; }
  else { e.x = S.x * T; e.y = S.y * T; e.w = 12; e.h = 12; }
}
const at2EmFora = e => e.state === 'thrust' || e.state === 'out' || e.state === 'retract';
AI.embolo = function (e, dt, dx, dy, dist, aggro) {
  e.vx = 0; e.vy = 0; e.stateT -= dt; e.stun = 0;
  const S = e.spot; if (!S) { e.dead = true; e.despawn = true; return; }
  const full = S.L * T, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'travel') {   // anda por dentro da laje: um brilho correndo na pedra
    const P = e.path; e.tp += dt * AT2_EM_VEL / T;
    const i = Math.min(P.length - 1, Math.floor(e.tp)), j = Math.min(P.length - 1, i + 1), f = e.tp - i;
    e.x = lerp(P[i][0], P[j][0], f) * T; e.y = lerp(P[i][1], P[j][1], f) * T; e.w = 12; e.h = 12;
    e.scrT = (e.scrT || 0) - dt; if (e.scrT <= 0) { e.scrT = 0.45; const v = at2Near(e, 200); if (v > 0.05) sfx.at2Desliza(v); }
    if (e.tp >= P.length - 1) { e.spot = e.dest; e.dest = null; e.path = null; e.state = 'hide'; e.stateT = 0.6; e.atkCD = Math.min(e.atkCD, 0.3); at2EmCaixa(e); }
    return;
  }
  // a laje dele foi quebrada: procura outra; sem nenhuma, desaba
  if (!at2Laje(tileAt(S.x, S.y))) {
    const f = at2EmBusca(S.x, S.y, false, e);
    if (f && f.path.length > 1) { e.ext = 0; e.dest = { x: wrapX(f.x), y: f.y, d: f.d, L: f.L }; e.path = f.path; e.tp = 0; e.state = 'travel'; }
    else killEnemy(e);
    return;
  }
  if (e.state === 'warn') {   // o glifo acende, os pontos marcam o caminho
    if (Math.random() < dt * 14) { const R = at2EmRect(S, 2); at2Sparks(R.x + R.w / 2, R.y + R.h / 2, 1, AT2_CIANO, 15, 0, 0.35); }
    if (e.stateT <= 0) { e.state = 'thrust'; e.stateT = AT2_EM_SAI; e.swingHit = false; sfx.at2Pistao(Math.max(0.4, at2Near(e, 260))); }
    return;
  }
  if (e.state === 'thrust') {   // atravessa o corredor de uma vez; quem estiver no caminho é empurrado
    e.ext = full * clamp(1 - e.stateT / AT2_EM_SAI, 0, 1); at2EmCaixa(e);
    if (!e.swingHit && !pl.dead && e.ext > 3 && overlap(e, pl)) {
      e.swingHit = true;
      const [ux, uy] = AT2_D4[S.d], fxp = ux ? (ux > 0 ? (S.x + 1) * T : S.x * T) : pcx;
      const r = hurtPlayer(e.dmg, fxp, null, false), k = r === 'hit' ? 1 : r === 'none' ? 0.4 : 0.6;
      if (ux) atEmpurrar(ux * 360 * k, -150 * k); else atEmpurrar((Math.sign(pcx - (S.x * T + 6)) || 1) * 150 * k, uy * 320 * k);
      if (r === 'hit') { at2Sparks(pcx, pcy, 8, AT2_FAIS, 70); shake(3); }
    }
    if (e.stateT <= 0) { e.state = 'out'; e.stateT = AT2_EM_FORA; e.ext = full; at2EmCaixa(e); const R = at2EmRect(S, full); at2Po(R.x + R.w / 2 + AT2_D4[S.d][0] * R.w / 2, R.y + R.h / 2 + AT2_D4[S.d][1] * R.h / 2, 6, 50); if (at2Near(e) > 0.5) shake(1.5); }
    return;
  }
  if (e.state === 'out') { if (e.stateT <= 0) { e.state = 'retract'; e.stateT = AT2_EM_VOLTA; const v = at2Near(e, 240); if (v > 0.05) sfx.at2Recolhe(v); } return; }
  if (e.state === 'retract') {
    e.ext = full * clamp(e.stateT / AT2_EM_VOLTA, 0, 1); at2EmCaixa(e);
    if (e.stateT <= 0) { e.ext = 0; at2EmCaixa(e); e.state = 'hide'; e.stateT = 0.2; e.atkCD = 1.1 + Math.random() * 0.5; e.moveNow = true; }
    return;
  }
  // escondido: só o glifo na laje
  e.state = 'hide'; e.ext = 0; at2EmCaixa(e);
  const near = !pl.dead && Math.abs(pcx - (S.x * T + 6)) < 16 * T && Math.abs(pcy - (S.y * T + 6)) < 12 * T;
  if (near && e.atkCD <= 0 && at2EmLonge(S) < 5) { e.state = 'warn'; e.stateT = AT2_GLIFO_W; sfx.at2Glifo(Math.max(0.4, at2Near(e, 260))); return; }
  if (e.stateT > 0) return;
  e.stateT = 0.9 + Math.random() * 0.8;
  if (near) {   // muda de ponto quando outro pega o herói melhor (e sempre depois de recolher)
    const cur = at2EmLonge(S), f = at2EmBusca(S.x, S.y, true, e);
    if (f && f.path.length > 1 && (f.sc < cur - T || (e.moveNow && f.sc < cur + T))) { e.dest = { x: wrapX(f.x), y: f.y, d: f.d, L: f.L }; e.path = f.path; e.tp = 0; e.state = 'travel'; }
  } else if (Math.random() < 0.15) {   // à toa: de vez em quando troca de ponto
    const f = at2EmBusca(S.x, S.y, false, e);
    if (f && f.path.length > 1 && Math.random() < 0.5) { e.dest = { x: wrapX(f.x), y: f.y, d: f.d, L: f.L }; e.path = f.path; e.tp = 0; e.state = 'travel'; }
  }
  e.moveNow = false;
};
// o pistão para fora: os gomos da haste e a cabeça na ponta
DRAW_E.embolo = (e, fx, fy, fl) => {
  if (!e.spot || !(e.ext > 0.5)) return;
  const [cx, cy] = at2Cam(e, fx, fy), S = e.spot, [ux, uy] = AT2_D4[S.d], B = AT2.get(), sh = B.emS[S.d], hd = B.emH[S.d];
  const ext = Math.round(e.ext), x0 = ux > 0 ? (S.x + 1) * T : S.x * T, y0 = uy > 0 ? (S.y + 1) * T : S.y * T, mx = S.x * T + 6, my = S.y * T + 6;
  const body = ext - 7;
  if (fl) lc.filter = 'brightness(2.2)';
  for (let s = 0; s < body; s += 12) {
    const l = Math.min(12, body - s);
    if (ux > 0) lc.drawImage(sh, 0, 0, l, 6, x0 + s - cx, my - 3 - cy, l, 6);
    else if (ux < 0) lc.drawImage(sh, 12 - l, 0, l, 6, x0 - s - l - cx, my - 3 - cy, l, 6);
    else if (uy > 0) lc.drawImage(sh, 0, 0, 6, l, mx - 3 - cx, y0 + s - cy, 6, l);
    else lc.drawImage(sh, 0, 12 - l, 6, l, mx - 3 - cx, y0 - s - l - cy, 6, l);
  }
  const tx = x0 + ux * ext, ty = y0 + uy * ext;
  const hx = ux > 0 ? tx - hd.width + 1 : ux < 0 ? tx - 1 : mx - hd.width / 2, hy = uy > 0 ? ty - hd.height + 1 : uy < 0 ? ty - 1 : my - hd.height / 2;
  lc.drawImage(hd, Math.round(hx - cx), Math.round(hy - cy));
  if (fl) lc.filter = 'none';
};
EYES_E.embolo = (e, fx, fy) => {
  if (!e.spot) return;
  const [cx, cy] = at2Cam(e, fx, fy), S = e.spot, [ux, uy] = AT2_D4[S.d], G = AT2.GL;
  if (e.state === 'travel') { lc.globalAlpha = 0.25; lc.drawImage(G.glifo, Math.round(e.x + 6 - cx) - 5, Math.round(e.y + 6 - cy) - 5); return; }
  const tip = at2EmTip(e), q = e.state === 'warn' ? clamp(1 - e.stateT / AT2_GLIFO_W, 0, 1) : at2EmFora(e) ? 0.6 : 0;
  lc.globalAlpha = 0.18 + q * 0.6; lc.drawImage(q > 0.4 ? G.glifoG : G.glifo, Math.round(tip[0] - cx) - (q > 0.4 ? 10 : 5), Math.round(tip[1] - cy) - (q > 0.4 ? 10 : 5));
};
WARN_E.embolo = e => e.state === 'warn';
// a ponta (o glifo): na face da laje quando escondido, na cabeça quando fora
function at2EmTip(e) {
  const S = e.spot, [ux, uy] = AT2_D4[S.d], mx = S.x * T + 6, my = S.y * T + 6, ext = e.ext || 0;
  return [mx + ux * (6 + ext - 2), my + uy * (6 + ext - 2)];
}
function at2EmTop(e, cx, cy) {
  const S = e.spot; if (!S) return;
  const now = gameTime;
  if (e.state === 'travel') {   // o brilho na pedra
    lc.globalAlpha = 0.35 + 0.15 * Math.sin(now * 9); lc.fillStyle = '#4ac8d0'; lc.fillRect(Math.round(e.x + 5 - cx), Math.round(e.y + 5 - cy), 2, 2);
    return;
  }
  const [ux, uy] = AT2_D4[S.d], warn = e.state === 'warn', q = warn ? clamp(1 - e.stateT / AT2_GLIFO_W, 0, 1) : 0;
  if (!at2EmFora(e)) {
    // o glifo na laje: um quadradinho com o ponto no meio, puxado para a face
    const gx = S.x * T + 3 + ux * 2, gy = S.y * T + 3 + uy * 2, on = warn && Math.floor(now * 12) % 2;
    lc.globalAlpha = warn ? 0.6 + 0.4 * q : 0.32 + 0.06 * Math.sin(now * 2.4); lc.fillStyle = on ? '#ffffff' : warn ? '#9af0f0' : '#2a8a94';
    const X = Math.round(gx - cx), Y = Math.round(gy - cy);
    lc.fillRect(X, Y, 6, 1); lc.fillRect(X, Y + 5, 6, 1); lc.fillRect(X, Y + 1, 1, 4); lc.fillRect(X + 5, Y + 1, 1, 4); lc.fillRect(X + 2, Y + 2, 2, 2);
  }
  if (warn) {   // a fileira de pontos vermelhos de um lado ao outro, acendendo da laje para a outra parede
    const R = at2EmRect(S, S.L * T), n = S.L * 2;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = ux ? (ux > 0 ? R.x + t * R.w : R.x + R.w - t * R.w) : R.x + 4, y = uy ? (uy > 0 ? R.y + t * R.h : R.y + R.h - t * R.h) : R.y + 4;
      const lit = t < q * 1.4;
      lc.globalAlpha = lit ? 0.95 : 0.35; lc.fillStyle = lit && q > 0.75 && (i + Math.floor(now * 16)) % 2 ? '#ffffff' : AT_COL.aviso;
      lc.fillRect(Math.round(x - cx) - 1, Math.round(y - cy) - 1, 2, 2);
    }
  } else if (at2EmFora(e) && e.ext > 4) {   // a face da cabeça acesa
    const [x, y] = at2EmTip(e); lc.globalAlpha = 0.9; lc.fillStyle = '#9af0f0';
    if (ux) lc.fillRect(Math.round(x - cx), Math.round(y - cy) - 3, 1, 6); else lc.fillRect(Math.round(x - cx) - 3, Math.round(y - cy), 6, 1);
  }
}

/* ================= o Astrolábio =================
   três anéis (raios 7, 9,5 e 12) em volta do núcleo: cada um tem o plano (phi, o rumo da linha que ele vira quando fica
   de lado) e o giro (psi: 0 de frente, um círculo; pi/2 de lado, uma linha). */
function at2AstroNasce(e) {
  e.rg = [{ r: 7, phi: 0.3, psi: 0, wf: 0.35, ws: 2.3 }, { r: 9.5, phi: 1.4, psi: 1, wf: -0.5, ws: -1.7 }, { r: 12, phi: 2.5, psi: 2, wf: 0.22, ws: 2.9 }];
  e.ax = e.x + e.w / 2; e.ay = e.y + e.h / 2; e.orb = Math.random() * 6.28; e.odir = Math.random() < 0.5 ? 1 : -1; e.state = 'orbit';
}
AI.astrolabio = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.revT = (e.revT || 0) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, RG = e.rg;
  const drag = k => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  if (e.state === 'align') {   // os anéis param, ficam de lado e se alinham com os rumos dos tiros
    drag(0.02);
    if (e.stateT > 0.25) e.aim = Math.atan2(pcy - ecy, pcx - ecx);
    const k = Math.min(1, dt * 7);
    for (let i = 0; i < 3; i++) {
      const g = RG[i], tp = Math.round((g.psi - AT2_Q) / Math.PI) * Math.PI + AT2_Q, tf = e.aim + (i - 1) * AT2_ABRE;
      g.psi += (tp - g.psi) * k; g.phi += at2Ang(tf - g.phi) * k;
    }
    if (Math.random() < dt * 18) { const g = RG[(Math.random() * 3) | 0], s = Math.random() < 0.5 ? -1 : 1; at2Sparks(ecx + Math.cos(g.phi) * g.r * s, ecy + Math.sin(g.phi) * g.r * s, 1, AT2_CIANO, 10, 0, 0.35); }
    if (e.stateT <= 0) {
      for (let i = 0; i < 3; i++) { const a = e.aim + (i - 1) * AT2_ABRE; if (at2Raios.length < 60) at2Raios.push({ x: ecx + Math.cos(a) * 12, y: ecy + Math.sin(a) * 12, vx: Math.cos(a) * AT2_RAIO_SP, vy: Math.sin(a) * AT2_RAIO_SP, t: 0, dmg: e.dmg }); }
      e.state = 'after'; e.stateT = 0.5; e.atkCD = 3.2 + Math.random() * 0.8;
      sfx.at2Raio(Math.max(0.4, at2Near(e, 280)));
    }
    return;
  }
  // os anéis giram (devagar logo depois dos tiros)
  const spin = e.state === 'after' ? 0.3 : 1;
  for (const g of RG) { g.psi += g.ws * dt * spin; g.phi += g.wf * dt * spin; }
  if (e.state === 'after') { drag(0.2); if (e.stateT <= 0) e.state = 'orbit'; return; }
  e.state = 'orbit';
  // o centro da órbita segue o herói devagar; o astrolábio corre num círculo em volta dele (e inverte se bate)
  const tx0 = aggro ? pcx : e.homeX ?? ecx, ty0 = aggro ? pcy - 1.5 * T : e.homeY ?? ecy;
  e.ax += (tx0 - e.ax) * Math.min(1, dt * 0.7); e.ay += (ty0 - e.ay) * Math.min(1, dt * 0.7);
  const r = aggro ? 5.5 * T : 3 * T; e.orb += e.odir * (aggro ? 0.42 : 0.25) * dt;
  const tx = e.ax + Math.cos(e.orb) * r, ty = e.ay + Math.sin(e.orb) * r;
  const k = Math.min(1, dt * 2.2), sp = aggro ? 70 : 34;
  e.vx = lerp(e.vx, clamp((tx - ecx) * 1.8, -sp, sp), k); e.vy = lerp(e.vy, clamp((ty - ecy) * 1.8, -sp, sp), k);
  const nx = Math.floor((ecx + Math.sign(e.vx) * 10) / T), ny = Math.floor((ecy + Math.sign(e.vy) * 10) / T);
  if (atNoGo(nx, Math.floor(ecy / T))) e.vx = -e.vx * 0.5;
  if (atNoGo(Math.floor(ecx / T), ny)) e.vy = -e.vy * 0.5;
  if ((e.hitWall || e.hitCeil || e.onGround || atNoGo(nx, ny)) && e.revT <= 0) { e.odir = -e.odir; e.revT = 1.2; }
  e.facing = Math.sign(dx) || e.facing;
  e.humT = (e.humT ?? Math.random() * 3) - dt;
  if (e.humT <= 0) { e.humT = 2.6 + Math.random() * 2; const v = at2Near(e, 200); if (v > 0.05) sfx.at2Zumbido(v); }
  if (aggro && e.atkCD <= 0 && e.sees && dist < 11 * T && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'align'; e.stateT = AT2_ALINHA; e.aim = Math.atan2(pcy - ecy, pcx - ecx); sfx.at2Aneis(Math.max(0.4, at2Near(e, 280)));
  }
};
// os pontos de um anel; f(x, y, z) para cada um (z > 0 na frente do núcleo)
function at2Anel(g, x0, y0, f) {
  const n = Math.max(22, Math.round(g.r * 4.4)), cp = Math.cos(g.phi), sp = Math.sin(g.phi), cs = Math.cos(g.psi), ss = Math.sin(g.psi);
  for (let i = 0; i < n; i++) {
    const t = i / n * 6.2832, a = Math.cos(t) * g.r, b = Math.sin(t) * g.r * cs;
    f(x0 + a * cp - b * sp, y0 + a * sp + b * cp, Math.sin(t) * ss, i, n);
  }
}
DRAW_E.astrolabio = (e, fx, fy, fl) => {
  if (!e.rg) return;
  const cx = fx, cy = fy - e.h / 2, H = AT2.HX.ferro, B = AT2.get().nucleo;
  const ring = front => { for (const g of e.rg) at2Anel(g, cx, cy, (x, y, z) => {
    if ((z > 0) !== front) return;
    const v = clamp(Math.round(2.6 + z * 1.2 - ((x - cx) * 0.6 + (y - cy) * 0.8) / g.r * 1.1), 0, 5);
    lc.fillStyle = fl ? '#ffffff' : H[v]; lc.fillRect(Math.round(x), Math.round(y), 1, 1);
  }); };
  ring(false);
  const img = fl ? B.w : B.r; lc.drawImage(img, Math.round(cx - img.width / 2), Math.round(cy - img.height / 2));
  ring(true);
};
EYES_E.astrolabio = (e, fx, fy) => {
  const G = AT2.GL, cy = fy - e.h / 2, q = e.state === 'align' ? clamp(1 - e.stateT / AT2_ALINHA, 0, 1) : 0;
  lc.globalAlpha = 0.35 + 0.08 * Math.sin(gameTime * 2.4) + q * 0.4; lc.drawImage(q > 0.3 ? G.glifoG : G.glifo, Math.round(fx) - (q > 0.3 ? 10 : 5), Math.round(cy) - (q > 0.3 ? 10 : 5));
  if (q) { lc.globalAlpha = 0.3 * q; lc.drawImage(G.violeta, Math.round(fx) - 10, Math.round(cy) - 10); }
};
WARN_E.astrolabio = e => e.state === 'align';
function at2AstroTop(e, cx, cy) {
  if (!e.rg) return;
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2, q = e.state === 'align' ? clamp(1 - e.stateT / AT2_ALINHA, 0, 1) : 0;
  // os dois botões de glifo de cada anel, acesos por cima do escuro
  for (const g of e.rg) {
    const cp = Math.cos(g.phi), sp = Math.sin(g.phi);
    for (const s of [-1, 1]) { lc.globalAlpha = 0.7; lc.fillStyle = '#4ac8d0'; at2Dot(ex + cp * g.r * s, ey + sp * g.r * s, cx, cy); }
  }
  lc.fillStyle = '#9af0f0'; lc.globalAlpha = 0.9; at2Dot(ex, ey, cx, cy);
  if (!q) return;
  // no aviso: os anéis brilham inteiros, e cada um aponta o rumo do tiro com uma linha fina
  for (let i = 0; i < 3; i++) {
    const g = e.rg[i];
    at2Anel(g, ex, ey, (x, y, z, j) => { if (j % 2) return; lc.globalAlpha = q * (z > 0 ? 0.9 : 0.4); lc.fillStyle = q > 0.75 && Math.floor(gameTime * 14) % 2 ? '#ffffff' : '#9af0f0'; at2Dot(x, y, cx, cy); });
    const a = e.aim + (i - 1) * AT2_ABRE;
    lc.globalAlpha = q * 0.55; lc.fillStyle = '#e8ffff';
    for (let d = 14; d < 14 + q * 30; d += 3) at2Dot(ex + Math.cos(a) * d, ey + Math.sin(a) * d, cx, cy);
  }
}

/* ================= o Obreiro ================= */
const at2Muros = [];   // { e, cells: [{ x, y }] } os muros de cada obreiro (somem quando ele some)
function at2MuroDe(e) { let M = at2Muros.find(m => m.e === e); if (!M) { M = { e, cells: [] }; at2Muros.push(M); } return M; }
// desfaz os muros de um obreiro: só os blocos que ainda são laje
function at2Desfaz(M) {
  let n = 0;
  for (const c of M.cells) if (tileAt(c.x, c.y) === AT_LAJE) { setTile(c.x, c.y, AIR); n++; if (n < 8) at2Po(c.x * T + 6, c.y * T + 6, 3, 40, 160, 0.6); at2Sparks(c.x * T + 6, c.y * T + 6, 1, AT2_CIANO, 15, -20, 0.5); }
  M.cells.length = 0;
  if (n) { const v = at2NearP(M.e.x, M.e.y, 300); if (v > 0.05) sfx.at2Some(v); }
}
// o herói ou o próprio obreiro de pé em cima deste bloco?
function at2Pisado(x, y, e) {
  for (const a of [pl, e]) { const x0 = Math.floor(a.x / T) - 1, x1 = Math.floor((a.x + a.w - 1) / T) + 1, f = Math.floor((a.y + a.h + 1) / T); if ((y === f || y === f + 1) && wdx(x - x0) >= 0 && wdx(x1 - x) >= 0) return true; }
  return false;
}
// o bloco que ele arranca: primeiro dos muros dele, depois a laje da sala exposta ao ar e à vista, perto
function at2Arrancavel(e) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, cx = Math.floor(ecx / T), cy = Math.floor(ecy / T);
  const M = at2Muros.find(m => m.e === e);
  if (M) for (const c of M.cells) if (tileAt(c.x, c.y) === AT_LAJE && !at2Pisado(c.x, c.y, e)) return { x: c.x, y: c.y };
  let best = null, bd = 1e9;
  for (let y = cy - 5; y <= cy + 4; y++) for (let x = cx - 6; x <= cx + 6; x++) {
    if (tileAt(x, y) !== AT_LAJE || at2Proibido(x, y) || at2Pisado(x, y, e)) continue;
    if (solidAt(x - 1, y) && solidAt(x + 1, y) && solidAt(x, y - 1) && solidAt(x, y + 1)) continue;
    const bx = x * T + 6, by = y * T + 6, L = Math.hypot(ecx - bx, ecy - by) || 1;
    if (!losClear(ecx, e.y + 4, bx + (ecx - bx) / L * 8, by + (ecy - by) / L * 8)) continue;
    const d = Math.abs(x - cx) + Math.abs(y - cy) + hash2(x, y, (gameTime * 3) | 0) * 2 + (solidAt(x, y - 1) ? 0 : 5);   // o chão por último
    if (d < bd) { bd = d; best = { x: wrapX(x), y }; }
  }
  return best;
}
// o muro entre ele e o herói: 2 a 3 blocos de frente para ele, do chão para cima (4 de alto, ou 2 x 3); nunca fecha o vão
function at2PlanoMuro(e, dir) {
  const ecx = e.x + e.w / 2, col = Math.floor((ecx + dir * 2.6 * T) / T), foot = Math.floor((e.y + e.h + 1) / T);
  let fy = -1; for (let k = -2; k <= 3; k++) if (solidAt(col, foot + k) && !solidAt(col, foot + k - 1)) { fy = foot + k; break; }
  if (fy < 0) return null;
  let room = 0; while (room < 8 && !solidAt(col, fy - 1 - room)) room++;
  const hgt = Math.min(4, room - 2); if (hgt < 2) return null;
  const wide = hgt <= 3 ? 2 : 1, cells = [];
  for (let j = 1; j <= hgt; j++) for (let i = 0; i < wide; i++) {
    const x = col + i * dir, y = fy - j;
    if (tileAt(x, y) !== AIR || at2Proibido(x, y) || (j === 1 && !solidAt(x, fy))) continue;
    const R = { x: x * T, y: y * T, w: T, h: T };
    if (overlap(R, pl) || enemies.some(o => !o.dead && overlap(R, o))) continue;
    cells.push({ x: wrapX(x), y });
  }
  return cells.length >= 2 ? cells.slice(0, 6) : null;
}
const at2ObMao = e => [e.x + e.w / 2 + e.facing * 1, e.y - 9];   // o bloco erguido, acima da cabeça
AI.obreiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.buildCD = (e.buildCD || 0) - dt; e.stompCD = (e.stompCD || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const stop = () => { e.vx = approach(e.vx, 0, 600 * dt); };
  if (e.state === 'mark') {   // o contorno do bloco pisca
    stop(); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) {
      const K = e.mark; e.mark = null;
      if (K && tileAt(K.x, K.y) === AT_LAJE && !at2Proibido(K.x, K.y) && !at2Pisado(K.x, K.y, e)) {
        setTile(K.x, K.y, AIR); at2Po(K.x * T + 6, K.y * T + 6, 8, 60, 220, 0.6);
        const M = at2Muros.find(m => m.e === e); if (M) { const i = M.cells.findIndex(c => c.x === K.x && c.y === K.y); if (i >= 0) M.cells.splice(i, 1); }
        e.carry = { x0: K.x * T + 6, y0: K.y * T + 6, x: K.x * T + 6, y: K.y * T + 6 };
        e.state = 'lift'; e.stateT = AT2_ERGUE; sfx.at2Arranca(Math.max(0.4, at2Near(e, 260)));
      } else { e.state = 'recover'; e.stateT = 0.3; }
    }
    return;
  }
  if (e.state === 'lift') {   // o bloco voa para as mãos, acima da cabeça; depois o arremesso em arco
    stop(); e.facing = Math.sign(dx) || e.facing;
    const C = e.carry, q = clamp(1 - e.stateT / (AT2_ERGUE * 0.7), 0, 1), [hx, hy] = at2ObMao(e);
    C.x = lerp(C.x0, hx, easeOut(q)); C.y = lerp(C.y0, hy, easeOut(q));
    if (e.stateT <= 0) {
      const tf = clamp(dist / 170, 0.45, 1), g = AT2_BLOCO_G;
      if (at2Blocos.length < 16) at2Blocos.push({ x: C.x, y: C.y, vx: (pcx - C.x) / tf, vy: (pcy - C.y) / tf - 0.5 * g * tf, t: 0, dmg: e.dmg });
      e.carry = null; e.state = 'throw'; e.stateT = 0.35; e.atkCD = 2.8 + Math.random() * 0.8;
      sfx.at2Arremesso(Math.max(0.4, at2Near(e, 260)));
    }
    return;
  }
  if (e.state === 'throw') { stop(); if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.4; } return; }
  if (e.state === 'crack') {   // a perna erguida; o chão racha em volta
    stop();
    if (Math.random() < dt * 10) at2Po(e.crk.x + rnd(-3, 3) * T, e.crk.y, 1, 15, 100, 0.4);
    if (e.stateT <= 0) {
      e.state = 'stomp'; e.stateT = 0.3; const v = at2Near(e, 300);
      sfx.at2Pisao(Math.max(0.4, v)); if (v > 0.2) shake(4);
      for (let k = -3; k <= 3; k++) at2Po(e.crk.x + k * T, e.crk.y, 2, 50, 260, 0.6);
      const feet = pl.y + pl.h;
      if (!pl.dead && pl.onGround && Math.abs(pcx - e.crk.x) < 3.6 * T && Math.abs(feet - e.crk.y) < 8) {
        const r = hurtPlayer(e.dmg, ecx, e, false);
        if (r === 'hit') { atEmpurrar((Math.sign(dx) || e.facing) * 200, -280); at2Sparks(pcx, feet - 2, 8, AT2_FAIS, 60); }
      }
    }
    return;
  }
  if (e.state === 'stomp') { stop(); if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.7; e.crk = null; } return; }
  if (e.state === 'plan') {   // o contorno do muro pisca em ciano
    stop(); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) { e.state = 'build'; e.stateT = 0; e.bi = 0; }
    return;
  }
  if (e.state === 'build') {   // os blocos sobem um a um do chão
    stop();
    if (e.stateT <= 0) {
      const c = e.plan[e.bi++];
      if (c && tileAt(c.x, c.y) === AIR && !at2Proibido(c.x, c.y)) {
        const R = { x: c.x * T, y: c.y * T, w: T, h: T };
        if (!overlap(R, pl) && !enemies.some(o => !o.dead && overlap(R, o))) {
          setTile(c.x, c.y, AT_LAJE); at2MuroDe(e).cells.push({ x: c.x, y: c.y });
          at2Po(c.x * T + 6, c.y * T + 12, 3, 30, 160, 0.4); at2Sparks(c.x * T + 6, c.y * T + 6, 2, AT2_CIANO, 15, 0, 0.4);
          const v = at2Near(e, 260); if (v > 0.05) sfx.at2Muro(v);
        }
      }
      e.stateT = 0.11;
      if (e.bi >= e.plan.length) { e.plan = null; e.state = 'recover'; e.stateT = 0.45; }
    }
    return;
  }
  if (e.state === 'recover') { stop(); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  let dir = 0;
  const adx = Math.abs(dx);
  if (aggro) dir = adx > 2.6 * T ? Math.sign(dx) : 0;
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 17 + e.lvl * 0.2 : 10, 260, 230, dy, aggro && dir !== 0);
  // a arena e as Salas de Prumo são parede para ele
  if (e.vx) { const ft = Math.floor((e.vx > 0 ? e.x + e.w + 2 : e.x - 2) / T), r0 = Math.floor((e.y + 2) / T), r1 = Math.floor((e.y + e.h - 2) / T); for (let r = r0; r <= r1; r++) if (atNoGo(ft, r)) { e.vx = 0; if (!aggro) e.wander = -e.wander; break; } }
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  if (e.onGround && Math.abs(e.vx) > 3) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.62; const v = at2Near(e, 200); if (v > 0.05) sfx.at2Passo(v); } }
  if (!aggro || !e.onGround || pl.dead) return;
  const foot = Math.floor((e.y + e.h + 1) / T);
  if (e.stompCD <= 0 && adx < 3.2 * T && Math.abs(dy) < 1.5 * T && solidAt(Math.floor(ecx / T), foot)) {
    e.state = 'crack'; e.stateT = AT2_RACHA; e.stompCD = 3.2; e.vx = 0;
    e.crk = { x: ecx, y: foot * T, seed: (Math.random() * 1e4) | 0, n: at2Rachas(foot, ecx) };
    sfx.at2Racha(Math.max(0.4, at2Near(e))); return;
  }
  if (e.atkCD > 0) return;
  const M = at2Muros.find(m => m.e === e), mine = M ? M.cells.length : 0;
  if (e.buildCD <= 0 && e.sees && adx > 4 * T && adx < 10 * T && Math.abs(dy) < 3 * T && mine < 12) {
    const P = at2PlanoMuro(e, Math.sign(dx));
    e.buildCD = P ? 10 + Math.random() * 3 : 2;
    if (P) { e.plan = P; e.state = 'plan'; e.stateT = AT2_PLANO; e.vx = 0; sfx.at2Plano(Math.max(0.4, at2Near(e, 260))); return; }
  }
  if (dist < 11 * T && (e.sees || mine)) {
    const K = at2Arrancavel(e);
    if (K) { e.mark = K; e.state = 'mark'; e.stateT = AT2_MARCA; e.vx = 0; e.atkCD = 3; sfx.at2Marca(Math.max(0.4, at2Near(e, 260))); }
    else e.atkCD = 1;
  }
};
// as rachaduras do pisão: um traço que sai dele pelos dois lados, pelo chão, com galhos que descem
function at2Rachas(foot, x0) {
  const out = [];
  for (const s of [-1, 1]) {
    let y = 0, x = 0;
    for (let i = 0; i < 44; i++) {
      x += 1; if (Math.random() < 0.35) y = clamp(y + (Math.random() < 0.5 ? 1 : -1), 0, 2);
      const col = Math.floor((x0 + s * x) / T);
      if (!solidAt(col, foot) || solidAt(col, foot - 1)) continue;   // só no chão de verdade
      out.push([s * x, y, i / 44]);
      if (i % 9 === 4) for (let k = 1; k <= 2; k++) out.push([s * (x + k * 0.6), y + k, i / 44]);
    }
  }
  return out;
}
const at2ObPose = e => e.state === 'lift' ? 3 : e.state === 'throw' ? 4 : e.state === 'crack' ? 5 : e.state === 'stomp' ? 6 : e.state === 'plan' || e.state === 'build' ? 7 : e.state === 'mark' ? 0 : e.onGround && Math.abs(e.vx) > 3 ? 1 + Math.floor(e.t * 3.2) % 2 : 0;
DRAW_E.obreiro = (e, fx, fy, fl) => {
  const img = cvPick(AT2.get().ob[at2ObPose(e)], e, fl), j = e.state === 'crack' && e.stateT < 0.35 ? Math.round(Math.sin(e.t * 50) * 0.7) : 0;
  lc.drawImage(img, Math.round((e.facing > 0 ? fx - (OBX + 1) : fx - (img.width - OBX - 1)) + j), fy - 37);
};
EYES_E.obreiro = (e, fx, fy) => {
  const o = OB[at2ObPose(e)], G = AT2.GL, hot = e.state === 'mark' || e.state === 'plan' || e.state === 'crack';
  const ex = fx + (OBX + o.lean * 1.3 + 3 - OBX) * e.facing, ey = fy - 1 - (35 - (5 + o.low));
  lc.globalAlpha = hot ? 0.75 : 0.4; lc.drawImage(hot ? G.glifoG : G.glifo, Math.round(ex) - (hot ? 10 : 5), Math.round(ey) - (hot ? 10 : 5));
  const kx = fx + o.lean * e.facing, ky = fy - 1 - (35 - (15.5 + o.low));
  lc.globalAlpha = 0.3; lc.drawImage(G.glifo, Math.round(kx) - 5, Math.round(ky) - 5);
};
WARN_E.obreiro = e => e.state === 'mark' || e.state === 'crack' || e.state === 'plan';
function at2ObTop(e, cx, cy) {
  const o = OB[at2ObPose(e)], now = gameTime;
  // a fresta do olho
  const ex = e.x + e.w / 2 + (o.lean * 1.3 + 0.5) * e.facing, ey = e.y + e.h - 1 - (35 - (5 + o.low));
  lc.globalAlpha = 0.9; lc.fillStyle = '#9af0f0'; for (let x = 0; x < 4; x++) at2Dot(ex + x * e.facing, ey, cx, cy);
  if (e.state === 'mark' && e.mark) {   // o contorno do bloco que vai sair, piscando
    const q = clamp(1 - e.stateT / AT2_MARCA, 0, 1), on = Math.floor(now * (8 + q * 10)) % 2;
    lc.globalAlpha = 0.6 + 0.4 * q; lc.fillStyle = on ? '#ffffff' : AT_COL.aviso;
    const X = Math.round(e.mark.x * T - cx), Y = Math.round(e.mark.y * T - cy);
    lc.fillRect(X, Y, T, 1); lc.fillRect(X, Y + T - 1, T, 1); lc.fillRect(X, Y + 1, 1, T - 2); lc.fillRect(X + T - 1, Y + 1, 1, T - 2);
  }
  if (e.state === 'plan' && e.plan) {   // o contorno do muro, em ciano tracejado
    const on = Math.floor(now * 10) % 2;
    lc.globalAlpha = 0.85; lc.fillStyle = on ? '#e8ffff' : '#4ac8d0';
    for (const c of e.plan) { const X = Math.round(c.x * T - cx), Y = Math.round(c.y * T - cy); for (let i = 0; i < T; i += 2) { lc.fillRect(X + i, Y, 1, 1); lc.fillRect(X + i + 1, Y + T - 1, 1, 1); lc.fillRect(X, Y + i + 1, 1, 1); lc.fillRect(X + T - 1, Y + i, 1, 1); } }
  }
  if ((e.state === 'crack' || e.state === 'stomp') && e.crk) {   // o chão rachando, de dentro para fora
    const q = e.state === 'stomp' ? 1 : clamp(1 - e.stateT / AT2_RACHA, 0, 1), C = e.crk;
    lc.globalAlpha = e.state === 'stomp' ? 1 : 0.55 + 0.45 * q; lc.fillStyle = q > 0.8 && Math.floor(now * 16) % 2 ? '#ffffff' : AT_COL.aviso;
    for (const [x, y, t] of C.n) if (t <= q) at2Dot(C.x + x, C.y + y, cx, cy);
  }
}

/* ================= o Estilhaço da Estrela ================= */
// o trajeto de um raio refletido: até a parede, um ricochete, até a próxima parede (ou maxL px)
function at2Traco(x, y, a, maxL) {
  let dx = Math.cos(a), dy = Math.sin(a), L = 0, bounced = false;
  const pts = [[x, y]], blk = (px, py) => { const tx = Math.floor(px / T), ty = Math.floor(py / T); return solidAt(tx, ty) || atNoGo(tx, ty); };
  while (L < maxL) {
    const nx = x + dx * 2, ny = y + dy * 2;
    if (blk(nx, ny)) {
      if (bounced) break;
      const bx = blk(nx, y), by = blk(x, ny);
      if (bx) dx = -dx; if (by) dy = -dy; if (!bx && !by) { dx = -dx; dy = -dy; }
      bounced = true; pts.push([x, y]); continue;
    }
    x = nx; y = ny; L += 2;
  }
  pts.push([x, y]); return pts;
}
// a mira: reto no herói quando há linha; senão, uma tabela numa parede cujo segundo trecho passa por ele
function at2Mira(e) {
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, maxL = 20 * T;
  if (losClear(ex, ey, pcx, pcy)) return at2Traco(ex, ey, Math.atan2(pcy - ey, pcx - ex), maxL);
  let best = null, bl = 1e9;
  for (let i = 0; i < 32; i++) {
    const P = at2Traco(ex, ey, i / 32 * Math.PI * 2, maxL); if (P.length < 3) continue;
    if (at2SegDist(pcx, pcy, P[1][0], P[1][1], P[2][0], P[2][1]) > 8) continue;
    const l = Math.hypot(P[1][0] - ex, P[1][1] - ey); if (l < bl) { bl = l; best = P; }
  }
  return best;
}
const at2Diag = () => Math.random() < 0.5 ? -Math.SQRT1_2 : Math.SQRT1_2;
AI.estilhaco = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.dirX === undefined) { e.dirX = at2Diag(); e.dirY = at2Diag(); }
  if (e.state === 'aim') {   // parado, branco; o trajeto pontilhado (segue o herói até 0,3 s do fim)
    e.vx = 0; e.vy = 0;
    if (e.stateT > 0.3) { e.reT = (e.reT || 0) - dt; if (e.reT <= 0) { e.reT = 0.1; const P = at2Mira(e); if (P) e.path = P; } }
    if (e.path) e.ang = Math.atan2(e.path[1][1] - e.path[0][1], e.path[1][0] - e.path[0][0]);
    if (e.stateT <= 0) { e.state = 'dash'; e.pi = 0; e.pd = 0; e.swingHit = false; sfx.at2Disparo(Math.max(0.4, at2Near(e, 300))); }
    return;
  }
  if (e.state === 'dash') {   // corre o trajeto, quica uma vez
    e.vx = 0; e.vy = 0;
    const P = e.path; let rem = AT2_DISPARO * dt, x = ecx, y = ecy;
    while (rem > 0 && e.pi < P.length - 1) {
      const [x0, y0] = P[e.pi], [x1, y1] = P[e.pi + 1], L = Math.hypot(x1 - x0, y1 - y0) || 0.01, left = L - e.pd;
      if (rem < left) { e.pd += rem; rem = 0; } else { rem -= left; e.pi++; e.pd = 0; if (e.pi < P.length - 1) { at2Sparks(x1, y1, 6, AT2_ESTR, 50); const v = at2NearP(x1, y1, 260); if (v > 0.05) sfx.at2Quica(v); } }
      const k = e.pi < P.length - 1 ? e.pd / L : 1, a = P[Math.min(e.pi, P.length - 2)], b = P[Math.min(e.pi + 1, P.length - 1)];
      x = e.pi < P.length - 1 ? lerp(a[0], b[0], k) : P[P.length - 1][0]; y = e.pi < P.length - 1 ? lerp(a[1], b[1], k) : P[P.length - 1][1];
      e.ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    }
    e.x = x - e.w / 2; e.y = y - e.h / 2;
    if (Math.random() < dt * 40) at2P({ x, y, vx: rnd(-6, 6), vy: rnd(-6, 6), g: 0, life: 0.35, max: 0.35, col: AT2_ESTR[(Math.random() * 3) | 0], size: 1 });
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 4 }, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, x - Math.cos(e.ang) * 10, null, true); if (r === 'hit') at2Sparks(pcx, pcy, 8, AT2_ESTR, 70); }
    if (e.pi >= P.length - 1) { e.state = 'recover'; e.stateT = 0.6; e.atkCD = 2.6 + Math.random() * 0.8; e.dirX = -Math.sign(Math.cos(e.ang) || 1) * Math.SQRT1_2; e.dirY = -Math.sign(Math.sin(e.ang) || 1) * Math.SQRT1_2; e.path = null; }
    return;
  }
  if (e.state === 'recover') { e.vx *= Math.pow(0.05, dt); e.vy *= Math.pow(0.05, dt); if (e.stateT <= 0) e.state = 'drift'; return; }
  e.state = 'drift';
  // reto em diagonal; na parede, reflete (só a componente que bateu)
  let bounce = false;
  if (e.hitWall) { e.dirX = -e.dirX; bounce = true; }
  if (e.hitCeil || e.onGround) { e.dirY = -e.dirY; bounce = true; }
  if (atNoGo(Math.floor((ecx + e.dirX * 8) / T), Math.floor(ecy / T))) { e.dirX = -e.dirX; bounce = true; }
  if (atNoGo(Math.floor(ecx / T), Math.floor((ecy + e.dirY * 8) / T))) { e.dirY = -e.dirY; bounce = true; }
  if (bounce) { const v = at2Near(e, 160); if (v > 0.2) sfx.at2Quica(v * 0.5); at2Sparks(ecx, ecy, 2, AT2_ESTR, 25); }
  // caçando: a cada pouco vira em ângulo reto para o quadrante certo (perto demais, para longe)
  e.turnT = (e.turnT ?? 2) - dt;
  if (aggro && e.turnT <= 0) {
    e.turnT = 1.8 + Math.random() * 1.2;
    const away = dist < 4 * T ? -1 : dist > 8 * T ? 1 : 0;
    if (away) { e.dirX = (Math.sign(dx) || 1) * away * Math.SQRT1_2; e.dirY = (Math.sign(dy) || 1) * away * Math.SQRT1_2; }
  }
  const sp = aggro ? 62 : 36;
  e.vx = e.dirX * sp; e.vy = e.dirY * sp; e.ang = Math.atan2(e.dirY, e.dirX);
  if (Math.random() < dt * 6) at2P({ x: ecx, y: ecy, vx: rnd(-3, 3), vy: rnd(-3, 3), g: 0, life: 0.5, max: 0.5, col: AT2_ESTR[(Math.random() * 3) | 0], size: 1 });
  if (aggro && e.atkCD <= 0 && dist < 13 * T && (e.sees || dist < 9 * T)) {
    const P = at2Mira(e);
    if (P) { e.path = P; e.state = 'aim'; e.stateT = AT2_MIRA; e.reT = 0.1; e.vx = 0; e.vy = 0; sfx.at2Mira(Math.max(0.4, at2Near(e, 300))); }
    else e.atkCD = 0.6;
  }
};
const at2LascaImg = (e, fl) => { const k = ((Math.round((e.ang || 0) / (Math.PI / 8)) % 16) + 16) % 16, S = AT2.get().lasca[k]; return fl || e.state === 'aim' ? S.w : S.r; };
DRAW_E.estilhaco = (e, fx, fy, fl) => { const img = at2LascaImg(e, fl); lc.drawImage(img, Math.round(fx - img.width / 2), Math.round(fy - e.h / 2 - img.height / 2)); };
EYES_E.estilhaco = (e, fx, fy) => {
  const G = AT2.GL, cy = fy - e.h / 2, q = e.state === 'aim' ? clamp(1 - e.stateT / AT2_MIRA, 0, 1) : e.state === 'dash' ? 1 : 0;
  lc.globalAlpha = 0.45 + 0.4 * q; lc.drawImage(q > 0.3 ? G.brancoM : G.brancoG, Math.round(fx) - (q > 0.3 ? 18 : 12), Math.round(cy) - (q > 0.3 ? 18 : 12));
};
WARN_E.estilhaco = e => e.state === 'aim';
function at2LascaTop(e, cx, cy) {
  // a lasca é luz: aparece por cima do escuro
  const img = at2LascaImg(e, e.flash > 0); lc.globalAlpha = 0.9;
  lc.drawImage(img, Math.round(e.x + e.w / 2 - cx - img.width / 2), Math.round(e.y + e.h / 2 - cy - img.height / 2));
  if (e.state !== 'aim' || !e.path) return;
  // o trajeto pontilhado, marchando; o ricochete marcado com um X vermelho
  const q = clamp(1 - e.stateT / AT2_MIRA, 0, 1), P = e.path, ph = (gameTime * 24) % 5;
  for (let i = 0; i < P.length - 1; i++) {
    const [x0, y0] = P[i], [x1, y1] = P[i + 1], L = Math.hypot(x1 - x0, y1 - y0) || 1;
    for (let d = ph; d < L; d += 5) { lc.globalAlpha = (0.45 + 0.5 * q) * (i ? 0.85 : 1); lc.fillStyle = q > 0.7 && Math.floor(gameTime * 14) % 2 ? AT_COL.aviso : '#ffffff'; at2Dot(x0 + (x1 - x0) * d / L, y0 + (y1 - y0) * d / L, cx, cy); }
  }
  if (P.length > 2) { const [x, y] = P[1]; lc.globalAlpha = 0.6 + 0.4 * q; lc.fillStyle = AT_COL.aviso; for (let k = -2; k <= 2; k++) { at2Dot(x + k, y + k, cx, cy); at2Dot(x + k, y - k, cx, cy); } }
}

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  // o êmbolo escondido: o golpe bate na laje
  if (e && !e.dead && e.type === 'embolo' && !at2EmFora(e)) {
    const [x, y] = e.spot ? at2EmTip(e) : [e.x + 6, e.y + 6];
    at2Sparks(x, y, 4, AT2_FAIS, 50, 60, 0.3); sfx.at2Tink(); e.memT = 4; return;
  }
  const r = _hit(e, dir, mult, melee);
  if (!e || !AT2_SET[e.type]) return r;
  if (!e.dead) {
    if (e.type === 'cuboerrante' || e.type === 'embolo') { e.vx = 0; e.vy = 0; e.stun = 0; }
    else if (e.type === 'obreiro') e.stun = e.state === 'walk' ? Math.min(e.stun, 0.12) : 0;
    else if (e.type === 'estilhaco' && (e.state === 'dash' || e.state === 'aim')) { e.stun = 0; e.vx = 0; e.vy = 0; }
    else if (e.type === 'astrolabio' && e.state === 'align') e.stun = Math.min(e.stun, 0.1);
    // nada sangra: faísca branca (os de luz) ou pó de pedra (os de pedra)
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'estilhaco' || e.type === 'astrolabio') at2Sparks(cx, cy, 6, AT2_FAIS, 60, 0, 0.35);
    else { at2Po(cx, cy, 3, 50); at2Sparks(cx, cy, 3, AT2_FAIS, 50, 80, 0.3); }
  }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!AT2_SET[e.type]) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, at2Near(e, 280));
  if (e.type === 'cuboerrante') { for (let i = 0; i < 4; i++) at2Po(cx + rnd(-10, 10), cy + rnd(-10, 10), 4, 80, 300, 0.8); at2Sparks(cx, cy, 10, AT2_CIANO, 50, -10, 0.8); sfx.at2Desaba(v); shake(2); }
  else if (e.type === 'embolo') { const [x, y] = e.spot ? at2EmTip(e) : [cx, cy]; at2Po(x, y, 10, 70); at2Sparks(x, y, 10, AT2_CIANO, 50, -10, 0.7); sfx.at2Desaba(v * 0.8); }
  else if (e.type === 'astrolabio') { if (e.rg) for (const g of e.rg) at2Anel(g, cx, cy, (x, y, z, i) => { if (i % 4 === 0) at2P({ x, y, vx: (x - cx) * 4, vy: (y - cy) * 4, g: 40, life: 0.8, max: 0.8, col: AT2_ESTR[i % 3], size: 1 }); }); sfx.at2Desaba(v * 0.7, 1.6); }
  else if (e.type === 'obreiro') { for (let i = 0; i < 6; i++) at2Po(cx + rnd(-8, 8), e.y + rnd(0, e.h), 4, 80, 300, 0.9); at2Sparks(cx, e.y + 6, 10, AT2_CIANO, 40, -10, 0.8); const M = at2Muros.find(m => m.e === e); if (M) at2Desfaz(M); sfx.at2Desaba(v); shake(3); }
  else if (e.type === 'estilhaco') { at2Sparks(cx, cy, 18, AT2_ESTR, 90, 0, 0.7); sfx.at2Desaba(v * 0.6, 2.2); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !AT2_SET[type]) return e;
  e.atkCD = 0.8 + Math.random() * 0.8; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'cuboerrante') {   // alinha na grade; nasce livre (sobe se preciso) e cai até o chão
    e.x = Math.round(e.x / T) * T; e.y = Math.round(e.y / T) * T;
    for (let k = 0; k < 4 && rectSolid(e.x, e.y, 24, 24); k++) e.y -= T;
    e.arena = !!(typeof inAtHall === 'function' && inAtHall(Math.floor((e.x + 12) / T), Math.floor((e.y + 12) / T)));
    e.state = 'fall'; e.fv = 0; e.ang = 0; e.mv = null; e.cling = 0;
  } else if (type === 'embolo') at2EmNasce(e);
  else if (type === 'astrolabio') { for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T; at2AstroNasce(e); }
  else if (type === 'estilhaco') { for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T; e.state = 'drift'; e.dirX = at2Diag(); e.dirY = at2Diag(); }
  else { for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T; e.state = 'walk'; }
  return e;
}; }

/* ---------- a cada quadro: os tiros do astrolábio, os blocos arremessados, os muros órfãos, as faíscas ---------- */
const at2Raios = [], at2Blocos = [];
function at2Update(dt) {
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  for (let i = at2Raios.length - 1; i >= 0; i--) {
    const O = at2Raios[i]; O.t += dt; O.x += O.vx * dt; O.y += O.vy * dt;
    let gone = O.t > 3 || solidAt(Math.floor(O.x / T), Math.floor(O.y / T));
    if (!gone && !pl.dead && O.x > pl.x - 2 && O.x < pl.x + pl.w + 2 && O.y > pl.y - 2 && O.y < pl.y + pl.h + 2) {
      const r = hurtPlayer(O.dmg, O.x - O.vx * 0.1, null, true); if (r !== 'none' || pl.invuln > 0) gone = true;
      if (r === 'hit') at2Sparks(pcx, pcy, 6, AT2_CIANO, 50);
    }
    if (gone) { at2Sparks(O.x, O.y, 5, AT2_CIANO, 40, 0, 0.35); at2Raios.splice(i, 1); }
  }
  for (let i = at2Blocos.length - 1; i >= 0; i--) {
    const B = at2Blocos[i]; B.t += dt; B.vy = Math.min(B.vy + AT2_BLOCO_G * dt, 500); B.x += B.vx * dt; B.y += B.vy * dt;
    let gone = B.t > 4 || (B.t > 0.05 && solidAt(Math.floor(B.x / T), Math.floor(B.y / T)));
    if (!gone && !pl.dead && overlap({ x: B.x - 5, y: B.y - 5, w: 10, h: 10 }, pl)) {
      const r = hurtPlayer(B.dmg, B.x - B.vx * 0.05, null, true); gone = true;
      if (r === 'hit') atEmpurrar(Math.sign(B.vx) * 150, -120);
    }
    if (gone) { at2Po(B.x, B.y, 12, 80, 300, 0.7); at2Blocos.splice(i, 1); const v = at2NearP(B.x, B.y, 260); if (v > 0.05) sfx.at2Estilhaca(v); }
  }
  // os muros de um obreiro que morreu ou sumiu de vista
  for (let i = at2Muros.length - 1; i >= 0; i--) { const M = at2Muros[i]; if (M.e.dead || !enemies.includes(M.e)) { at2Desfaz(M); at2Muros.splice(i, 1); } else if (!M.cells.length && M.e.state === 'walk') at2Muros.splice(i, 1); }
  for (let i = at2Fx.length - 1; i >= 0; i--) { const p = at2Fx[i]; p.life -= dt; if (p.life <= 0) { at2Fx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
}
HOOK.update.push(at2Update);
function clearAt2Fx() { at2Fx.length = 0; at2Raios.length = 0; at2Blocos.length = 0; at2Muros.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearAt2Fx(); at2Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: o glifo do cubo, a ponta do êmbolo, o núcleo e os anéis, o olho do obreiro, a lasca, os tiros
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !AT2_SET[e.type]) continue;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'cuboerrante') addL(cx, cy, e.state === 'lean' || e.state === 'crush' ? 0.45 : 0.22);
    else if (e.type === 'embolo') { if (!e.spot || e.state === 'travel') continue; const [x, y] = at2EmTip(e); addL(x, y, e.state === 'warn' ? 0.5 : at2EmFora(e) ? 0.4 : 0.12); }
    else if (e.type === 'astrolabio') addL(cx, cy, e.state === 'align' ? 0.6 : 0.32);
    else if (e.type === 'obreiro') addL(cx, e.y + 6, e.state === 'mark' || e.state === 'plan' || e.state === 'crack' ? 0.45 : 0.25);
    else addL(cx, cy, e.state === 'aim' || e.state === 'dash' ? 0.75 : 0.5);
  }
  for (const O of at2Raios) addL(O.x, O.y, 0.45);
  for (const B of at2Blocos) addL(B.x, B.y, 0.2);
}; }

// no mundo (com o escuro por cima): os blocos arremessados e o que o obreiro carrega
HOOK.drawWorld.push((cx, cy) => {
  const img = AT2.get().bloco;
  for (const B of at2Blocos) lc.drawImage(img, Math.round(B.x - cx - 7), Math.round(B.y - cy - 7));
  for (const e of enemies) if (!e.dead && e.type === 'obreiro' && e.carry) lc.drawImage(img, Math.round(e.carry.x - cx - 7), Math.round(e.carry.y - cy - 7));
});
// a luz aditiva: os tiros, as faíscas
HOOK.drawGlow.push((cx, cy) => {
  const G = AT2.GL;
  for (const O of at2Raios) { lc.globalAlpha = 0.6; lc.drawImage(G.glifoG, Math.round(O.x - cx) - 10, Math.round(O.y - cy) - 10); }
  for (const p of at2Fx) { const g = at2FxGl[p.col] || (at2FxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
// por cima do escuro: os avisos (arestas, pontos, contornos, rachaduras, trajetos), os glifos, as lascas, os tiros
HOOK.drawTop.push((cx, cy) => {
  for (const e of enemies) {
    if (e.dead || !AT2_SET[e.type]) continue;
    const sx = e.x + e.w / 2 - cx, sy = e.y + e.h / 2 - cy, m = e.type === 'embolo' ? 120 : 60;
    if (sx < -m || sx > VW + m || sy < -m || sy > VH + m) continue;
    if (e.type === 'cuboerrante') at2CuboTop(e, cx, cy);
    else if (e.type === 'embolo') at2EmTop(e, cx, cy);
    else if (e.type === 'astrolabio') at2AstroTop(e, cx, cy);
    else if (e.type === 'obreiro') at2ObTop(e, cx, cy);
    else at2LascaTop(e, cx, cy);
  }
  for (const O of at2Raios) {
    const sp = Math.hypot(O.vx, O.vy) || 1, ux = O.vx / sp, uy = O.vy / sp;
    for (let k = 0; k < 5; k++) { lc.globalAlpha = 1 - k * 0.18; lc.fillStyle = k === 0 ? '#ffffff' : k < 2 ? '#e8ffff' : '#4ac8d0'; at2Dot(O.x - ux * k, O.y - uy * k, cx, cy); }
  }
  for (const p of at2Fx) { lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});

/* ---------- sons (frios: senos, triângulos, ruído filtrado; nada de rosnado) ---------- */
Object.assign(sfx, {
  // o cubo: o baque de pedra com o estalo de vidro, as arestas acendendo, a subida rangendo
  at2Tomba(v = 1) { noise(0.26, 0.09 * v, 220, 'lowpass'); tone(70, 0.28, 'sine', 0.05 * v, -30); tone(1400, 0.07, 'sine', 0.006 * v, -400, 0.02); },
  at2Aresta(v = 1) { tone(440, 0.75, 'sine', 0.014 * v, 440); tone(660, 0.75, 'triangle', 0.006 * v, 660); noise(0.6, 0.01 * v, 4000, 'bandpass', 0, 6); },
  at2Range(v = 1) { noise(1.2, 0.03 * v, 300, 'bandpass', 0, 2); tone(55, 1.2, 'sawtooth', 0.008 * v, 20); },
  // o êmbolo: o glifo acendendo, o tiro do pistão, a volta, a pedra raspando por dentro, o golpe na laje
  at2Glifo(v = 1) { tone(1320, 0.5, 'sine', 0.012 * v); tone(1980, 0.4, 'sine', 0.006 * v, 0, 0.12); tone(990, 0.6, 'triangle', 0.006 * v, 330, 0.2); },
  at2Pistao(v = 1) { noise(0.18, 0.1 * v, 900, 'bandpass', 0, 0.8); tone(160, 0.18, 'square', 0.022 * v, -80); tone(2400, 0.05, 'sine', 0.01 * v, -900); },
  at2Recolhe(v = 1) { noise(0.32, 0.03 * v, 600, 'bandpass', 0, 1.5); tone(220, 0.3, 'sine', 0.012 * v, -120); },
  at2Desliza(v = 1) { noise(0.4, 0.012 * v, 700, 'bandpass', 0, 3); },
  at2Tink() { tone(2600, 0.12, 'sine', 0.025, -600); tone(3900, 0.06, 'triangle', 0.01, -800); },
  // o astrolábio: o zumbido, os anéis se alinhando (três sinos), os tiros
  at2Zumbido(v = 1) { tone(110, 0.9, 'sine', 0.01 * v); tone(165, 0.9, 'sine', 0.005 * v); },
  at2Aneis(v = 1) { for (let k = 0; k < 3; k++) tone(880 * [1, 1.25, 1.5][k], 0.6, 'sine', 0.012 * v, 0, k * 0.18); },
  at2Raio(v = 1) { for (let k = 0; k < 3; k++) tone(1760 - k * 220, 0.18, 'sine', 0.018 * v, -900, k * 0.03); noise(0.12, 0.03 * v, 5000, 'highpass'); },
  // o obreiro: o passo, o bloco marcado, arrancado, arremessado, estilhaçando; a racha, o pisão; o muro subindo
  at2Passo(v = 1) { noise(0.1, 0.04 * v, 260, 'lowpass'); tone(80, 0.1, 'sine', 0.025 * v, -20); },
  at2Marca(v = 1) { for (let k = 0; k < 3; k++) tone(1200, 0.06, 'square', 0.006 * v, 0, k * 0.22); },
  at2Arranca(v = 1) { noise(0.3, 0.08 * v, 500, 'lowpass'); tone(90, 0.3, 'sawtooth', 0.018 * v, -40); },
  at2Arremesso(v = 1) { noise(0.25, 0.05 * v, 1200, 'bandpass', 0, 0.8); },
  at2Estilhaca(v = 1) { noise(0.3, 0.08 * v, 1600, 'bandpass', 0, 0.7); tone(300, 0.15, 'square', 0.01 * v, -150); },
  at2Racha(v = 1) { noise(0.85, 0.03 * v, 2600, 'highpass'); tone(140, 0.85, 'sawtooth', 0.007 * v, 60); for (let k = 0; k < 4; k++) noise(0.04, 0.03 * v, 3000, 'bandpass', k * 0.2, 4); },
  at2Pisao(v = 1) { noise(0.45, 0.12 * v, 160, 'lowpass'); tone(48, 0.45, 'sine', 0.07 * v, -20); },
  at2Plano(v = 1) { tone(660, 0.5, 'triangle', 0.01 * v, 220); tone(990, 0.4, 'sine', 0.005 * v, 330, 0.1); },
  at2Muro(v = 1) { tone(180, 0.1, 'square', 0.01 * v, -60); noise(0.1, 0.04 * v, 700, 'bandpass', 0, 2); },
  at2Some(v = 1) { noise(0.4, 0.04 * v, 900, 'bandpass', 0, 1); tone(1320, 0.4, 'sine', 0.006 * v, -600); },
  // o estilhaço: a mira subindo, o disparo, o ricochete
  at2Mira(v = 1) { tone(1200, 0.85, 'sine', 0.012 * v, 1800); tone(2400, 0.85, 'sine', 0.004 * v, 3600); },
  at2Disparo(v = 1) { tone(3200, 0.25, 'sine', 0.025 * v, -2600); noise(0.2, 0.05 * v, 5000, 'highpass'); },
  at2Quica(v = 1) { tone(2800, 0.1, 'triangle', 0.015 * v, 400); },
  // um construto desfeito: a pedra caindo e os sinos frios descendo (p sobe o tom dos menores)
  at2Desaba(v = 1, p = 1) { noise(0.7, 0.09 * v / p, 400 * p, 'lowpass'); for (let k = 0; k < 3; k++) tone((1600 - k * 300) * p, 0.3, 'sine', 0.01 * v, -400 * p, k * 0.08); }
});
