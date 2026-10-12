'use strict';

/* ================= o Mar Sem Sol: os bichos do fundo, parte dois =================
   Cinco dos dez bichos da décima segunda camada (docs/camadas/10-mar-sem-sol.md, seção 6; os outros cinco estão no
   263). Todos só nadam (ET swim): sem gravidade do laço (levam fly também), andam livres em 2D só pelas células com
   água, e a busca de caminho deles só passa por água (ms2Rota). Fora da água se debatem de volta para ela (o dano de
   10% por segundo é do 269). Quase pretos, com o que brilha em ciano e rosa.
   - o Tubarão-Cego (tubarao), cinza-chumbo de barriga clara e olho leitoso; circula o herói longe, fechando o
     círculo, e na superfície só a barbatana fica de fora. Abaixo de metade da vida do herói, circula mais perto.
     Vira o corpo de lado e bate a cauda com um chiado, deixando um rastro de espuma (0,7 s): investida reta com
     mordida. O Leviatã (266) chama dois deles (e.msMinion): nascem em qualquer água e funcionam igual;
   - a Medusa Abissal (medusa), em bandos (o 265 põe o bando); o sino contrai e ela sobe, depois afunda devagar.
     Tentáculos de 3 blocos. Os tentáculos acendem de cima para baixo (0,8 s) e dão choque em quem estiver neles. É
     o único bicho com `touch`, e só nos tentáculos (o sino não queima). Brilha: é luz;
   - a Enguia-Trovão (enguia), comprida, em segmentos, nadando em ondas e passando rente ao herói. O corpo acende
     segmento a segmento com estalos (1 s): descarga em toda a água ligada a ela num raio de 5 blocos. Fora da água
     não pega;
   - o Baiacu-de-Espinhos (baiacu), pintado de marrom; boia devagar, incha ao ver o herói e, murcho, foge. Incha, os
     espinhos sobem e ele assobia (0,8 s): 8 espinhos para todos os lados; depois fica murcho e lento 2 s;
   - o Diabo-Marinho (diabomar), quase preto; parado no escuro, só a isca de luz aparece, balançando como um brilho
     de loot. A isca para e cai e o contorno dos dentes aparece (0,6 s): bocada enorme em arco. Errou, fica 1 s parado.
   O 265 põe o nível (embrulha spawnEnemy por fora), as tabelas de spawn e os bandos de medusa. O pincel é o do 55
   (cp, contorno, cache), rampas de 6 tons com luz de cima à esquerda; brilhos pelo EYES_E e HOOK.drawGlow, os
   pontinhos acesos por cima do escuro (HOOK.drawTop). Materiais e bases do 267 (filtrados a cada mundo). Prefixo ms2. */

/* ---------- números ---------- */
Object.assign(ET, {
  tubarao: { name: 'Tubarão-Cego', w: 30, h: 11, hp: 180, dmg: 30, xp: 40, kb: 0.35, fly: true, swim: true, blood: '#3a6a5a' },
  // touch: só nos tentáculos (a IA faz o toque; o sino nunca queima)
  medusa: { name: 'Medusa Abissal', w: 10, h: 9, hp: 40, dmg: 14, xp: 14, kb: 0.9, fly: true, swim: true, touch: 0.5, blood: '#ff8ab0' },
  enguia: { name: 'Enguia-Trovão', w: 14, h: 8, hp: 100, dmg: 24, xp: 32, kb: 0.5, fly: true, swim: true, blood: '#3a6a5a' },
  baiacu: { name: 'Baiacu-de-Espinhos', w: 12, h: 11, hp: 70, dmg: 16, xp: 24, kb: 0.9, fly: true, swim: true, blood: '#8a7a48' },
  diabomar: { name: 'Diabo-Marinho', w: 24, h: 18, hp: 160, dmg: 28, xp: 44, kb: 0.25, fly: true, swim: true, blood: '#2a3a4a' }
});
const MS2_TYPES = ['tubarao', 'medusa', 'enguia', 'baiacu', 'diabomar'];
// materiais e bases do 267; filtradas agora e de novo a cada mundo
const MS2_DROPS = {
  tubarao: [['escama_abissal', 0.35], ['peixe_cego', 0.4], ['min_oricalco', 0.08], ['pocao', 0.08]],
  medusa: [['isca_viva', 0.3], ['pocao', 0.04]],
  enguia: [['min_oricalco', 0.08], ['pocao', 0.07]],
  baiacu: [['peixe_cego', 0.4], ['min_oricalco', 0.06], ['pocao', 0.06], ['escudo_carapaca', 0.01]],
  diabomar: [['isca_viva', 0.6], ['min_oricalco', 0.1], ['pocao', 0.08]]
};
function ms2Tables() { for (const k of MS2_TYPES) DROPS[k] = MS2_DROPS[k].filter(([id]) => ITEMS[id]); }
ms2Tables();

const MS2_CAUDA = 0.7, MS2_ACENDE = 0.8, MS2_ESTALA = 1, MS2_INCHA = 0.8, MS2_DENTES_T = 0.6;
const MS2_TENT = 3 * T;            // os tentáculos da medusa
const MS2_RAIO = 5;                // a descarga da enguia, em blocos
const MS2_SEGS = 10, MS2_SEG0 = 7, MS2_SEG_D = 4.4;   // a enguia: segmentos, a distância do primeiro e entre eles
const MS2_SEG_R = [3.6, 3.6, 3.4, 3.2, 3, 2.7, 2.4, 2, 1.6, 1.2];
const MS2_ESP_SP = 150, MS2_ESP_VIDA = 1.3;           // os espinhos do baiacu
// âncoras dos desenhos: o ponto do desenho que fica no centro do corpo
const MS2_TBA = [24, 12], MS2_MDA = [10, 12], MS2_BCA = [14, 14], MS2_DBA = [22, 18];

/* ================= arte ================= */
const MS2 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const MR = {
  tub: R6(['#07090c', '#10161c', '#1c262e', '#2c3a44', '#44545e', '#66767e']),
  tubB: R6(['#1e2428', '#363e42', '#545c60', '#7a8286', '#a4acae', '#ced4d4']),       // a barriga clara
  gengiva: R6(['#1a060a', '#3a1018', '#5e2028', '#8a3a40', '#b4605e', '#e09a90']),
  dente: R6(['#3a362e', '#6a6454', '#9a9480', '#c6c0aa', '#e8e2ce', '#fffaf0']),
  cego: R6(['#3a4448', '#62707a', '#8ea0a8', '#b8c8cc', '#dce8ea', '#f6ffff']),       // o olho cego, leitoso
  sino: R6(['#1c0820', '#3a1240', '#622068', '#90388e', '#c060b4', '#f0a0e0']),       // o sino rosa da medusa
  sinoC: R6(['#04161c', '#0a2e36', '#14505a', '#2a8088', '#5ab8b8', '#a8f0e8']),      // a borda ciano
  enguia: R6(['#040607', '#0a0e10', '#12191c', '#1c272a', '#2a383a', '#3e5052']),
  enguiaV: R6(['#1a1a06', '#32320c', '#545414', '#7a7a22', '#a8a83a', '#e0e070']),    // a barriga amarelada
  baiacu: R6(['#140f08', '#261c0e', '#3e2e16', '#5a4422', '#7a6034', '#a0844e']),
  baiacuB: R6(['#3a3428', '#5e5644', '#847a62', '#aaa084', '#d0c6a6', '#f0e8cc']),
  espinho: R6(['#2a2418', '#4a4230', '#6e644a', '#948a6a', '#bab090', '#e0d8b8']),
  diabo: R6(['#010102', '#040407', '#08080d', '#0e0e15', '#16161f', '#22222e'])
};
const setO = cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
// elipse girada com luz de cima à esquerda; pick(u, v, x, y) -> [rampa, ajuste] ou null (pula)
function ell(P, cx, cy, rx, ry, ang, R, s, base, pick) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - m); y <= cy + m; y++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
    const px = x + 0.5 - cx, py = y + 0.5 - cy, u = (px * ca + py * sa) / rx, v = (-px * sa + py * ca) / ry, d = u * u + v * v;
    if (d > 1) continue;
    let RR = R, dv = 0;
    if (pick) { const p = pick(u, v, x, y); if (!p) continue; RR = p[0]; dv = p[1]; }
    P.put(x, y, RR, base + 1 - (px / m * 0.8 + py / m) * 1.5 - d * 0.8 + cg(x, y, s) * 0.45 + dv);
  }
}
function tubo(P, x0, y0, x1, y1, r0, r1, R, base, s) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * t;
    for (let oy = -r; oy <= r + 0.01; oy += 0.5) for (let ox = -r; ox <= r + 0.01; ox += 0.5) {
      if (ox * ox + oy * oy > r * r + 0.05) continue;
      P.put(x + ox, y + oy, R, base - (oy / Math.max(0.5, r)) * 1.1 - (ox / Math.max(0.5, r)) * 0.6 + cg(x + ox | 0, y + oy | 0, s) * 0.35);
    }
  }
}
// polígono cheio (par-ímpar); f(x, y) -> o tom (na rampa R) ou [rampa, tom] ou null
function poly(P, pts, R, f) {
  let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const py = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= py) !== (by <= py)) xs.push(ax + (py - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) {
      const v = f(x, y); if (v === null) continue;
      if (typeof v === 'number') P.put(x, y, R, v); else P.put(x, y, v[0], v[1]);
    }
  }
}

/* ---------- o Tubarão-Cego, 48 x 22 de frente para a direita ----------
   0-1 nadando (a cauda de um lado e do outro), 2 virado de lado batendo a cauda (aviso: a barriga aparece, a
   barbatana deita), 3 a mordida (a boca aberta, as fileiras de dentes) */
function tubarao(k) {
  const P = cp(48, 22), s = 26401 + k * 7, turn = k === 2, bite = k === 3, tail = [0, 2.2, -3.6, 1][k], bT = turn ? -0.15 : 0.3;
  // a cauda: o lobo de cima comprido (como o dos tubarões de verdade), o de baixo curto
  poly(P, [[5.6, 10.4], [0.6, 2.4 + tail], [2.4, 2.2 + tail], [7.4, 9.6]], MR.tub, (x, y) => 2.4 + (y < 4 + tail ? 0.8 : 0) + cg(x, y, s) * 0.4);
  poly(P, [[5.6, 12.4], [1.2, 17.6 + tail * 0.5], [2.8, 18 + tail * 0.5], [7.4, 12.8]], MR.tub, (x, y) => 1.6 + cg(x, y, s) * 0.4);
  // a nadadeira peitoral de longe, no escuro
  poly(P, [[29, 15], [25.8, 19.6], [27.4, 19.8], [31.6, 15.4]], MR.tub, () => 1);
  tubo(P, 12, 12, 5.2, 11.4 + tail * 0.15, 3, 1.3, MR.tub, 2.6, s + 1);   // o pedúnculo
  // a barbatana de cima (a que fica de fora na superfície) e a segunda, pequena
  const dl = turn ? 2.4 : 0;
  poly(P, [[19, 8], [23.4 + dl, 0.6 + dl], [25.2, 0.8 + dl], [28.8, 7.8]], MR.tub, (x, y) => 3.2 - (x - 22) * 0.22 + (x < 22 + dl * 0.5 ? 0.6 : 0) + cg(x, y, s + 2) * 0.35);
  poly(P, [[10.4, 9.8], [10, 7.2], [11.2, 7.4], [13.2, 9.8]], MR.tub, () => 2.6);
  // o corpo e a cabeça, a barriga clara (virado de lado, a barriga sobe)
  ell(P, 24, 12, 17, turn ? 5.8 : 5, 0, MR.tub, s + 3, 2.5, (u, v) => v > bT ? [MR.tubB, 1.2 - (v - bT) * 1.4] : [MR.tub, Math.abs(v - bT) < 0.12 ? 0.5 : 0]);
  ell(P, 38.4, 12.2, 7.4, turn ? 4.6 : 4, 0.04, MR.tub, s + 4, 2.8, (u, v) => v > bT + 0.1 ? [MR.tubB, 1.6] : [MR.tub, u > 0.7 ? -0.3 : 0]);
  for (let i = 0; i < 3; i++) P.line(31.4 + i * 1.6, 10.6, 31.8 + i * 1.6, 13.4, MR.tub, 1.5);   // as guelras
  // a nadadeira peitoral de perto (virado de lado, aberta)
  poly(P, turn ? [[30.4, 14.8], [25, 20.6], [27.4, 21.4], [34, 15.4]] : [[30.4, 15.2], [26.6, 21.2], [28.6, 21.6], [33.6, 15.6]], MR.tub, (x, y) => 2.6 - (y - 15) * 0.15 + cg(x, y, s + 5) * 0.3);
  // o olho cego, leitoso
  P.put(40.6, 10.4, MR.cego, 3.4); P.put(41.4, 10.4, MR.cego, 2.4); P.put(40.6, 9.6, MR.cego, 4.8);
  if (!bite) {
    P.line(45.4, 13.4, 38.4, 14.8, MR.gengiva, 0.6);
    for (let x = 39.2; x < 45; x += 1.6) P.put(x, 14.4 - (x - 39) * 0.15, MR.dente, 2.4);
  } else {
    // a boca aberta: a mandíbula de baixo cai, a goela escura, as fileiras de dentes
    poly(P, [[46.6, 12.4], [36.6, 14], [44.4, 20]], MR.gengiva, (x, y) => 0.6 + (y > 17 ? 1.2 : 0) + cg(x, y, s + 6) * 0.4);
    tubo(P, 36.4, 15.6, 44.6, 19.6, 1.6, 1, MR.tub, 2.2, s + 6);
    for (let q = 0; q <= 1; q += 0.16) { const x = lerp(46, 38, q), y = lerp(12.8, 14, q); P.put(x, y + 1, MR.dente, 4.4); P.put(x, y + 2, MR.dente, 3); }
    for (let q = 0.1; q <= 1; q += 0.18) { const x = lerp(44.2, 37.6, q), y = lerp(18.6, 15.2, q); P.put(x, y - 1, MR.dente, 4); P.put(x - 0.6, y - 2, MR.dente, 2.8); }
  }
  return setO(P.done());
}

/* ---------- a Medusa Abissal, 20 x 18: só o sino e os braços curtos (os tentáculos são desenhados ao vivo) ----------
   0 aberta (larga e baixa), 1 contraída (estreita e alta: é quando sobe) */
function medusa(k) {
  const P = cp(20, 18), s = 26451 + k * 5, cx = 10, rim = 12, rx = k ? 5.6 : 7.6, ry = k ? 9.8 : 7.4;
  // os braços da boca, franjados, debaixo do sino
  for (const ox of [-2.2, 0.2, 2.6]) for (let j = 0; j < 5; j++) P.put(cx + ox + Math.sin(j * 1.3 + ox) * 0.8, rim + 1 + j, MR.sino, 3 - j * 0.35);
  // o sino: a cúpula translúcida, os canais em raio, os quatro lobos acesos dentro, a borda ciano
  ell(P, cx, rim, rx, ry, 0, MR.sino, s, 2.2, (u, v) => {
    if (v > 0.02) return null;
    const lob = Math.hypot(u * 1.5, (v + 0.42) * 1.8), ang = Math.atan2(v + 0.42, u);
    if (lob < 0.5 && Math.abs(Math.sin(ang * 2)) > 0.45) return [MR.sino, 1.8];
    if (-v < 0.14) return [MR.sinoC, 1.4];
    return [MR.sino, -0.3 + (Math.abs(Math.sin(u * 8)) < 0.22 ? 0.8 : 0) + (-v > 0.8 ? 0.6 : 0)];
  });
  for (let x = cx - rx + 0.6; x < cx + rx; x += 1.5) P.put(x, rim + 0.4, MR.sinoC, 3.2);   // as franjas da borda
  return setO(P.done());
}

/* ---------- a Enguia-Trovão: a cabeça (18 x 12, 0 fechada, 1 aberta soltando a descarga) e os segmentos ---------- */
function enguiaCab(k) {
  const P = cp(18, 12), s = 26501 + k * 3;
  P.line(0, 3.6, 8, 2.8, MR.enguia, 2.4);   // a crista das costas
  ell(P, 7.5, 6, 7, 3.4, 0.04, MR.enguia, s, 2.4, (u, v) => v > 0.35 ? [MR.enguiaV, 0.2] : [MR.enguia, 0]);
  ell(P, 13, 6.3, 3.8, 2.4, 0.12, MR.enguia, s + 1, 2.8, (u, v) => v > 0.3 ? [MR.enguiaV, 0.5] : [MR.enguia, 0]);
  if (k) poly(P, [[17.4, 5.8], [11.4, 7.2], [16.4, 10.2]], MR.gengiva, () => 1.2);
  else P.line(16.6, 7.2, 11.6, 7.5, MR.enguia, 0.2);
  P.put(12.8, 5, MR.enguiaV, 4.6); P.put(13.6, 5, MR.enguia, 0.4);   // o olho pequeno
  for (const [x, y] of [[3, 6.4], [6, 6.8], [9, 6.8]]) P.put(x, y, MR.enguiaV, 3);   // os órgãos de luz apagados
  return setO(P.done());
}
function enguiaSeg(r) {
  const n = Math.ceil(r * 2 + 4), P = cp(n, n), c = n / 2;
  ell(P, c, c + 0.4, r, r * 0.92, 0, MR.enguia, 26511 + r * 10, 2.4, (u, v) => v > 0.4 ? [MR.enguiaV, -0.2] : [MR.enguia, 0]);
  if (r > 1.5) { P.put(c - 0.5, c - r - 0.2, MR.enguia, 3.4); P.put(c - 1, c - r + 0.4, MR.enguia, 2.4); }   // a crista
  P.put(c, c + 0.4, MR.enguiaV, 2.6);   // o órgão de luz (aceso por cima no aviso)
  return outlined(P.done());
}

/* ---------- o Baiacu-de-Espinhos, 28 x 28 ----------
   0-1 murcho nadando (a cauda bate), 2 meio inchado, 3 inchado com os espinhos de pé (assobiando), 4 murcho e mole */
const MS2_BCR = [[6.6, 5.2], [6.6, 5.2], [8.8, 8.2], [10.4, 10.2], [7, 4.4]];
function baiacu(k) {
  const P = cp(28, 28), s = 26551 + k * 5, c = 14, [rx, ry] = MS2_BCR[k], sp = [0, 0, 2.2, 3.8, 0][k], cy = c + (k === 4 ? 1.2 : 0);
  const tf = k === 1 ? 1.2 : 0;
  if (!sp) poly(P, [[c - rx + 1, cy], [c - rx - 3.8, cy - 3 + tf], [c - rx - 3.2, cy + 3 + tf]], MR.baiacu, (x, y) => 2.2 + cg(x, y, s) * 0.4);
  else poly(P, [[c - rx + 1, cy], [c - rx - 2.4, cy - 2], [c - rx - 2.2, cy + 2]], MR.baiacu, () => 2);
  // os espinhos de pé, em volta (atrás do corpo)
  if (sp) for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2 + 0.14, ca = Math.cos(a), sa = Math.sin(a), l = sp + (i % 2) * 0.8;
    P.line(c + ca * rx * 0.85, cy + sa * ry * 0.85, c + ca * (rx + l), cy + sa * (ry + l), MR.espinho, q => 2.4 + q * 1.8 - (sa > 0.3 ? 0.9 : 0) - (ca > 0.3 ? 0.3 : 0));
  }
  ell(P, c, cy, rx, ry, 0, MR.baiacu, s + 1, 2.6, (u, v, x, y) => {
    if (v > 0.28) return [MR.baiacuB, -0.1 + (k === 4 && Math.abs(Math.sin(x * 1.5 + y * 0.5)) < 0.2 ? -0.6 : 0)];
    return [MR.baiacu, hash2(x >> 1, y >> 1, s + 2) < 0.24 ? -1.2 : 0];
  });
  if (!sp) for (let i = 0; i < 7; i++) { const a = -2.7 + i * 0.4; P.put(c + Math.cos(a) * rx * 0.75, cy + Math.sin(a) * ry * 0.7, MR.espinho, 2.2); }   // os espinhos deitados
  if (k === 4) for (let i = 0; i < 3; i++) P.line(c - 3 + i * 2.6, cy - 2, c - 2.4 + i * 2.6, cy + 1, MR.baiacu, 1.4);   // as rugas da pele mole
  // o olho grande, saltado, e o bico (aberto em O no assobio)
  const ex = c + rx * 0.46, ey = cy - ry * 0.34;
  P.put(ex, ey, MR.baiacuB, 4.8); P.put(ex + 1, ey, MR.baiacuB, 3.8); P.put(ex, ey + 1, MR.baiacuB, 3.6); P.put(ex + 1, ey + 1, MR.diabo, 0); P.put(ex + 1, ey - 1, MR.baiacu, 1);
  P.put(c + rx - 0.2, cy + ry * 0.15, MR.baiacuB, 3.6); P.put(c + rx - 0.2, cy + ry * 0.15 + 1, MR.baiacuB, 2.4);
  if (k === 2 || k === 3) { P.put(c + rx + 0.6, cy + ry * 0.15, MR.gengiva, 0.6); P.put(c + rx + 0.6, cy + ry * 0.15 + 1, MR.baiacuB, 3.4); }
  if (!sp) poly(P, [[c + 1, cy + 0.6], [c - 1.8, cy + 3.6 - tf], [c - 0.4, cy + 4 - tf], [c + 2.4, cy + 1.2]], MR.baiacu, () => 3.2);   // a peitoral
  return setO(P.done());
}

/* ---------- o Diabo-Marinho, 46 x 36 ----------
   0 fechado (os dentes de agulha passam por fora), 1 a boca entreaberta (aviso), 2 a bocada (aberta, enorme).
   Os dentes ficam guardados (MS2.DENTES[k]) para o contorno aceso do aviso. A haste da isca é desenhada ao vivo. */
const DENTES = [];
function diabo(k) {
  const P = cp(46, 36), s = 26601 + k * 7, op = [0, 2.4, 6.8][k], den = DENTES[k] = [];
  tubo(P, 12, 19, 4.4, 18.4, 5.2, 1.6, MR.diabo, 2.4, s);   // o rabo curto
  poly(P, [[5, 18.4], [0.4, 12.6], [1.6, 18.6], [0.4, 24.4]], MR.diabo, (x, y) => 2 + cg(x, y, s) * 0.6);
  poly(P, [[16, 26], [12.4, 31.6], [15.6, 31], [19.6, 27]], MR.diabo, () => 1.2);   // a nadadeira de longe
  // o corpo: uma cabeça redonda enorme, a pele de verrugas
  ell(P, 22, 18, 13, 11.6, 0, MR.diabo, s + 1, 2.8, (u, v, x, y) => [MR.diabo, (hash2(x, y, s + 2) < 0.06 ? 1.4 : 0) + (v > 0.5 ? -0.5 : 0)]);
  // a boca: o lábio de cima, o de baixo (a mandíbula sai para a frente), a goela escura
  const up = x => lerp(18.4, 15 - op * 0.55, (x - 26) / 16), lo = x => lerp(21, 18.4 + op * 0.45, (x - 26) / 17.6);
  poly(P, [[25, 9.6], [33, 8.2], [39.6, 10.4 - op * 0.5], [42.6, 13.6 - op * 0.55], [42, 15.2 - op * 0.55], [26, 18.6]], MR.diabo, (x, y) => 3 - (y - 9) * 0.12 - (x - 30) * 0.05 + (hash2(x, y, s + 6) < 0.06 ? 1.2 : 0) + cg(x, y, s + 6) * 0.45);   // o focinho
  poly(P, [[24, 21], [43.6, 18.4 + op * 0.45], [44.6, 20.6 + op * 0.45], [36, 27.6 + op * 0.4], [23, 27.4]], MR.diabo, (x, y) => 2.4 - (y - 21) * 0.18 + cg(x, y, s + 3) * 0.4);
  if (op) poly(P, [[26, 18.6], [42, 15 - op * 0.55], [43.6, 18.4 + op * 0.45], [26, 20.8]], MR.gengiva, (x, y) => 0.4 + (y > 18 ? 0.8 : 0) + cg(x, y, s + 4) * 0.5);
  else P.line(42, 15.6, 26, 19, MR.diabo, 0.4);
  // os dentes de agulha: os de cima descem, os de baixo sobem, tortos, compridos
  for (let i = 0; i < 7; i++) {
    const x = lerp(41.4, 28, i / 6), y = up(x), L = 2.4 + (i % 2) * 1.4 + (k === 2 ? 0.8 : 0), lean = (i % 3 - 1) * 0.4;
    for (let t = 0; t <= L; t += 0.5) { P.put(x + lean * t / L, y + t, MR.dente, 0.6 + (1 - t / L) * 0.9); }
    den.push([Math.floor(x + lean), Math.floor(y + L)], [Math.floor(x), Math.floor(y + 1)]);
  }
  for (let i = 0; i < 6; i++) {
    const x = lerp(43, 30, i / 5), y = lo(x), L = 2.8 + (i % 2) * 1.6, lean = ((i + 1) % 3 - 1) * 0.5;
    for (let t = 0; t <= L; t += 0.5) P.put(x + lean * t / L, y - t, MR.dente, 0.6 + (1 - t / L) * 0.9);
    den.push([Math.floor(x + lean), Math.floor(y - L)], [Math.floor(x), Math.floor(y - 1)]);
  }
  P.put(30, 11, MR.cego, 1.6); P.put(30.6, 11, MR.diabo, 0);   // o olho pequeno, morto
  poly(P, [[19, 22], [14.6, 28.4], [17.4, 28.8], [22.4, 23.4]], MR.diabo, (x, y) => 2.6 + cg(x, y, s + 5) * 0.4);   // a peitoral de perto
  P.put(29, 6.4, MR.diabo, 4); P.put(28.4, 7, MR.diabo, 3.4);   // o pé da haste da isca
  return setO(P.done());
}

MS2.get = () => MS2.ready || (MS2.ready = {
  tb: [0, 1, 2, 3].map(tubarao),
  md: [0, 1].map(medusa),
  ec: [0, 1].map(enguiaCab), es: MS2_SEG_R.map(enguiaSeg),
  bc: [0, 1, 2, 3, 4].map(baiacu),
  db: [0, 1, 2].map(diabo)
});
MS2.DENTES = DENTES;
MS2.GL = {
  rosa: glow(10, '#ff8ab0'), rosaP: glow(5, '#ffb8e0'), ciano: glow(6, '#6ae8d8'), cianoG: glow(12, '#6ae8d8'),
  trovao: glow(6, '#c8f0ff'), trovaoG: glow(12, '#9ad8ff'), isca: glow(8, '#8ae8d8'), iscaP: glow(3, '#e0fff8'),
  osso: glow(4, '#e0d8b8')
};
}

/* ================= ajudantes: nadar só pela água ================= */
const ms2Molhado = (tx, ty) => !!aguaAt(tx, ty) && !solidAt(tx, ty);
const ms2NaAgua = e => ms2Molhado(Math.floor((e.x + e.w / 2) / T), Math.floor((e.y + e.h / 2) / T));
const ms2HeroiMolhado = () => !pl.dead && aguaIn(pl.x, pl.y, pl.w, pl.h) > 0.2;
const ms2Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
// uma linha reta só por água
function ms2LinhaAgua(x0, y0, x1, y1) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6));
  for (let i = 1; i <= n; i++) { const t = i / n; if (!ms2Molhado(Math.floor((x0 + (x1 - x0) * t) / T), Math.floor((y0 + (y1 - y0) * t) / T))) return false; }
  return true;
}
// a linha (px) onde começa a água na coluna tx, subindo de ty
function ms2Topo(tx, ty) { let y = ty; for (let k = 0; k < 40 && ms2Molhado(tx, y - 1); k++) y--; return y * T; }
// a busca de caminho de quem nada: em largura, só por células com água, num quadrado de 45 x 45 em volta. Devolve
// o centro (px) da célula mais longe do caminho que ainda se vê em linha reta pela água; se o alvo está fora da
// água, vai para a água mais perto dele
const MS2_R = 22, MS2_W = MS2_R * 2 + 1, ms2Prev = new Int32Array(MS2_W * MS2_W), ms2Marca = new Uint32Array(MS2_W * MS2_W), ms2Fila = new Int32Array(MS2_W * MS2_W);
let ms2Selo = 0;
function ms2Rota(e, gx, gy) {
  const sx = Math.floor((e.x + e.w / 2) / T), sy = Math.floor((e.y + e.h / 2) / T), tx = Math.floor(gx / T), ty = Math.floor(gy / T);
  if (!ms2Molhado(sx, sy)) return null;
  ms2Selo++; if (ms2Selo > 4e9) { ms2Selo = 1; ms2Marca.fill(0); }
  const k0 = MS2_R * MS2_W + MS2_R; let h = 0, n = 0, best = k0, bestD = Math.abs(sx - tx) + Math.abs(sy - ty);
  ms2Marca[k0] = ms2Selo; ms2Prev[k0] = -1; ms2Fila[n++] = k0;
  while (h < n && h < 1600) {
    const k = ms2Fila[h++], cx = k % MS2_W, cy = (k / MS2_W) | 0, x = sx + cx - MS2_R, y = sy + cy - MS2_R;
    const d = Math.abs(x - tx) + Math.abs(y - ty);
    if (d < bestD) { bestD = d; best = k; if (!d) break; }
    for (let j = 0; j < 4; j++) {
      const nx = cx + (j === 0 ? 1 : j === 1 ? -1 : 0), ny = cy + (j === 2 ? 1 : j === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= MS2_W || ny >= MS2_W) continue;
      const q = ny * MS2_W + nx; if (ms2Marca[q] === ms2Selo) continue;
      ms2Marca[q] = ms2Selo;
      if (!ms2Molhado(sx + nx - MS2_R, sy + ny - MS2_R)) continue;
      ms2Prev[q] = k; ms2Fila[n++] = q;
    }
  }
  if (best === k0) return null;
  const path = []; for (let k = best; k !== -1 && k !== k0; k = ms2Prev[k]) path.push(k);
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  let pick = path[path.length - 1];
  for (let i = path.length - 1, m = 0; i >= 0 && m < 10; i--, m++) {
    const k = path[i], px = (sx + k % MS2_W - MS2_R + 0.5) * T, py = (sy + ((k / MS2_W) | 0) - MS2_R + 0.5) * T;
    if (ms2LinhaAgua(ecx, ecy, px, py)) pick = k; else break;
  }
  return [(sx + pick % MS2_W - MS2_R + 0.5) * T, (sy + ((pick / MS2_W) | 0) - MS2_R + 0.5) * T];
}
// não sai pela superfície: o alto do corpo (e.y + top) fica dentro da água; o tubarão usa top pequeno e deixa a
// barbatana de fora
function ms2Teto(e, top) {
  const tx = Math.floor((e.x + e.w / 2) / T), y = e.y + top, ty = Math.floor(y / T);
  if (solidAt(tx, ty)) return;
  if (!aguaAt(tx, ty)) { e.vy = Math.max(e.vy, Math.min(40, ((ty + 1) * T - y) * 4)); return; }
  if (e.vy < 0 && !aguaAt(tx, ty - 1) && !solidAt(tx, ty - 1)) e.vy = Math.max(e.vy, -(y - ty * T) * 5);
}
// nada até (tx, ty): reto quando a água deixa, senão pela rota; onda > 0 balança de lado (a enguia)
function ms2Nada(e, dt, tx, ty, sp, k = 2.5, top = 2, onda = 0) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  let gx = tx, gy = ty;
  if (!ms2LinhaAgua(ecx, ecy, tx, ty)) {
    e.rotaT = (e.rotaT || 0) - dt;
    if (e.rotaT <= 0) { e.rotaT = 0.4 + Math.random() * 0.2; e.rota = ms2Rota(e, tx, ty); }
    if (e.rota) { gx = e.rota[0]; gy = e.rota[1]; if (Math.hypot(gx - ecx, gy - ecy) < 5) e.rotaT = 0; }
  } else { e.rota = null; e.rotaT = 0; }
  const dx = gx - ecx, dy = gy - ecy, d = Math.hypot(dx, dy) || 1, v = Math.min(sp, d * 2.5), q = Math.min(1, dt * k);
  let wx = dx / d * v, wy = dy / d * v;
  if (onda) { const w = Math.sin(e.t * 3.4 + e.seed) * onda * v; wx += -dy / d * w; wy += dx / d * w; }
  e.vx = lerp(e.vx, wx, q); e.vy = lerp(e.vy, wy, q);
  if (e.hitWall) e.vy += (dy > 0 ? 1 : -1) * 20;
  ms2Teto(e, top);
}
// fora da água: cai, se debate e pula de volta para o lado da água
function ms2LadoAgua(e) {   // a água mais perto por onde dá para chegar (em largura, pelo que não é pedra)
  const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h / 2) / T), seen = new Set([0]), q = [[tx, ty]];
  for (let i = 0; i < q.length && i < 500; i++) {
    const [x, y] = q[i];
    if (aguaAt(x, y)) return Math.sign(x - tx);
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ax, ny = y + ay, k = (nx - tx) * 64 + (ny - ty);
      if (seen.has(k) || Math.abs(nx - tx) > 14 || Math.abs(ny - ty) > 10 || solidAt(nx, ny)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return 0;
}
function ms2Debate(e, dt) {
  e.debate = 0.3;
  e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
  e.aguaT = (e.aguaT || 0) - dt;
  if (e.aguaT <= 0) { e.aguaT = 0.5; e.aguaDir = ms2LadoAgua(e); }
  if (e.onGround) {
    e.vx = approach(e.vx, 0, 400 * dt); e.flopT = (e.flopT || 0) - dt;
    if (e.flopT <= 0) {
      e.flopT = 0.3 + Math.random() * 0.35; e.vy = -(100 + Math.random() * 70);
      e.vx = (e.aguaDir || (Math.random() < 0.5 ? -1 : 1)) * (40 + Math.random() * 40); e.facing = -e.facing;
      const v = ms2Near(e, 200); if (v > 0.05) sfx.ms2Debate(v);
    }
  }
  if (e.hitWall) e.vx *= -0.4;
}
const ms2Pt = (e, x, y, a) => [e.x + e.w / 2 + (x - a[0]) * e.facing, e.y + e.h / 2 + (y - a[1])];

/* ================= desenho ================= */
// a âncora (ax, ay) do desenho no centro do corpo (fx, cy); +1 do contorno
function ms2Blit(img, e, fx, cy, a, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - (a[0] + 1) : fx - (img.width - (a[0] + 1))) + jx), Math.round(cy - (a[1] + 1))); }
const ms2Jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;

// o tubarão: a cauda vai e vem; inclina com a direção do nado; na investida, gira para onde vai
const ms2TbPose = e => e.state === 'turn' ? 2 : e.state === 'charge' ? 3 : e.debate > 0 ? (Math.floor(e.t * 10) % 2 ? 2 : 0) : Math.floor(e.t * (e.state === 'swim' && Math.abs(e.vx) > 50 ? 6 : 3.5) + e.seed) % 2;
DRAW_E.tubarao = (e, fx, fy, fl) => {
  const k = ms2TbPose(e), img = cvPick(MS2.get().tb[k], e, fl), cy = fy - e.h / 2;
  const a = e.debate > 0 ? 0 : clamp(Math.atan2(e.vy, Math.abs(e.vx) + 40), -0.4, 0.4) * e.facing;
  if (Math.abs(a) > 0.12) { lc.save(); lc.translate(Math.round(fx), Math.round(cy)); lc.rotate(a); ms2Blit(img, e, 0, 0, MS2_TBA); lc.restore(); return; }
  ms2Blit(img, e, fx, cy, MS2_TBA, ms2Jit(e, k === 2 && e.state === 'turn', 50));
};
EYES_E.tubarao = () => { };
WARN_E.tubarao = e => e.state === 'turn';

// a medusa: os tentáculos balançam (ao vivo, poucos pixels), o sino pulsa
const MS2_TX = [-4, -2, 0, 2, 4];
const ms2TentX = (e, i, y) => MS2_TX[i] * (1 - y / 80) + Math.sin(gameTime * 2.1 + e.seed + i * 1.7 + y * 0.18) * (0.5 + y / MS2_TENT * 2) - clamp(e.vx, -20, 20) * 0.15 * (y / MS2_TENT);
const ms2Borda = e => e.y + e.h - 1;   // a linha de onde os tentáculos saem
DRAW_E.medusa = (e, fx, fy, fl) => {
  const rim = fy - 1;
  lc.fillStyle = fl ? '#ffffff' : '#4a1a4a';
  for (let i = 0; i < 5; i++) for (let y = 0; y < MS2_TENT; y += 1) { if (y > MS2_TENT - 6 && (i + y) % 2) continue; lc.fillRect(Math.round(fx + ms2TentX(e, i, y)), rim + y, 1, 1); }
  const img = cvPick(MS2.get().md[e.contra > 0 ? 1 : 0], e, fl);
  lc.globalAlpha = fl ? 1 : 0.88; ms2Blit(img, e, fx, rim, MS2_MDA); lc.globalAlpha = 1;
};
EYES_E.medusa = (e, fx, fy) => {
  const G = MS2.GL, cy = fy - 6, lit = e.state === 'light' ? clamp(1 - e.stateT / MS2_ACENDE, 0, 1) : e.state === 'shock' ? 1 : 0;
  lc.globalAlpha = 0.32 + 0.1 * Math.sin(e.t * 3 + e.seed) + (e.contra > 0 ? 0.12 : 0); lc.drawImage(G.rosa, Math.round(fx) - 10, Math.round(cy) - 10);
  lc.globalAlpha = 0.5; lc.drawImage(G.rosaP, Math.round(fx) - 5, Math.round(cy) - 5);
  for (let j = 0; j < 3; j++) { const y = fy + 6 + j * 12, on = lit * MS2_TENT > j * 12; lc.globalAlpha = on ? (e.state === 'shock' ? 0.7 : 0.45) : 0.1; lc.drawImage(on ? G.cianoG : G.ciano, Math.round(fx) - (on ? 12 : 6), y - (on ? 12 : 6)); }
};
WARN_E.medusa = e => e.state === 'light';

// a enguia: os segmentos seguem o rastro da cabeça; desenhados do rabo para a cabeça
const ms2EcPose = e => e.state === 'charge' || e.state === 'zap' ? 1 : 0;
DRAW_E.enguia = (e, fx, fy, fl) => {
  const B = MS2.get(), ox = Math.round(e.x + e.w / 2) - fx, oy = Math.round(e.y + e.h) - fy;
  if (e.segs) for (let i = MS2_SEGS - 1; i >= 0; i--) {
    const S = e.segs[i], img = fl ? (B.esW || (B.esW = B.es.map(whiteOf)))[i] : B.es[i];
    lc.drawImage(img, Math.round(S[0] - ox - img.width / 2), Math.round(S[1] - oy - img.height / 2));
  }
  const img = cvPick(B.ec[ms2EcPose(e)], e, fl);
  ms2Blit(img, e, fx, fy - e.h / 2, [8, 6], ms2Jit(e, e.state === 'charge', 60));
};
EYES_E.enguia = (e, fx, fy) => {
  const G = MS2.GL, ox = Math.round(e.x + e.w / 2) - fx, oy = Math.round(e.y + e.h) - fy;
  lc.globalAlpha = 0.35; lc.drawImage(G.osso, Math.round(fx + 5 * e.facing) - 4, Math.round(fy - e.h / 2 - 1) - 4);
  const n = ms2Acesos(e);
  if (n && e.segs) for (let i = 0; i < n; i++) { const S = e.segs[i]; lc.globalAlpha = e.state === 'zap' ? 0.7 : 0.35 + 0.2 * Math.sin(gameTime * 30 + i); lc.drawImage(G.trovao, Math.round(S[0] - ox) - 6, Math.round(S[1] - oy) - 6); }
};
WARN_E.enguia = e => e.state === 'charge';
// quantos segmentos estão acesos (no aviso acendem um a um, da cabeça para o rabo)
const ms2Acesos = e => e.state === 'charge' ? Math.min(MS2_SEGS, Math.floor(clamp(1 - e.stateT / MS2_ESTALA, 0, 1) * (MS2_SEGS + 1))) : e.state === 'zap' ? MS2_SEGS : 0;

// o baiacu: incha no aviso
const ms2BcPose = e => e.state === 'puff' ? (e.stateT > MS2_INCHA * 0.55 ? 2 : 3) : e.state === 'shoot' ? 3 : e.state === 'slack' ? 4 : Math.floor(e.t * (e.state === 'flee' ? 9 : 5) + e.seed) % 2;
DRAW_E.baiacu = (e, fx, fy, fl) => {
  const k = ms2BcPose(e), bob = k < 2 ? Math.round(Math.sin(e.t * 2.4 + e.seed) * 0.8) : 0;
  ms2Blit(cvPick(MS2.get().bc[k], e, fl), e, fx, fy - e.h / 2 + bob, MS2_BCA, ms2Jit(e, e.state === 'puff', 50));
};
EYES_E.baiacu = (e, fx, fy) => { if (e.state !== 'puff' && e.state !== 'shoot') return; lc.globalAlpha = 0.25 + 0.3 * (e.state === 'shoot' ? 1 : clamp(1 - e.stateT / MS2_INCHA, 0, 1)); lc.drawImage(MS2.GL.osso, Math.round(fx) - 4, Math.round(fy - e.h / 2) - 4); };
WARN_E.baiacu = e => e.state === 'puff';

// o diabo-marinho: o corpo quase preto (no escuro some), a haste da isca; a isca e os dentes acesos vão no drawTop
const ms2DbPose = e => e.state === 'tell' ? 1 : e.state === 'bite' || e.state === 'miss' ? 2 : 0;
function ms2Isca(e) {
  const [bx, by] = ms2Pt(e, 29, 6.4, MS2_DBA);
  let ox = 9, oy = -7;
  if (e.state === 'tell') { const q = clamp(1 - e.stateT / MS2_DENTES_T, 0, 1), qq = q * q; ox = 9 + qq * 5; oy = -7 + qq * 15; }
  else if (e.state === 'lurk') { ox += Math.sin(e.t * 1.1 + e.seed) * 1.5; oy += Math.sin(e.t * 1.7 + e.seed) * 2 + Math.sin(e.t * 0.37) * 1; }
  return [bx + ox * e.facing, by + oy, bx, by];
}
DRAW_E.diabomar = (e, fx, fy, fl) => {
  const k = ms2DbPose(e), cy = fy - e.h / 2;
  ms2Blit(cvPick(MS2.get().db[k], e, fl), e, fx, cy, MS2_DBA, ms2Jit(e, e.state === 'tell' && e.stateT < 0.3, 40));
  // a haste: uma curva fina da testa até a isca
  const ox = Math.round(e.x + e.w / 2) - fx, oy = Math.round(e.y + e.h) - fy, [ix, iy, bx, by] = ms2Isca(e), mx = bx + 2 * e.facing, my = by - 9;
  lc.fillStyle = fl ? '#ffffff' : '#1e1e28';
  for (let i = 1; i < 12; i++) { const t = i / 12, u = 1 - t, x = u * u * bx + 2 * u * t * mx + t * t * ix, y = u * u * by + 2 * u * t * my + t * t * iy; lc.fillRect(Math.round(x - ox), Math.round(y - oy), 1, 1); }
};
EYES_E.diabomar = (e, fx, fy) => {
  const ox = Math.round(e.x + e.w / 2) - fx, oy = Math.round(e.y + e.h) - fy, [ix, iy] = ms2Isca(e), G = MS2.GL;
  lc.globalAlpha = e.state === 'lurk' ? 0.42 + 0.12 * Math.sin(e.t * 4 + e.seed) : 0.3; lc.drawImage(G.isca, Math.round(ix - ox) - 8, Math.round(iy - oy) - 8);
};
WARN_E.diabomar = e => e.state === 'tell';

/* ================= comportamento ================= */
const ms2Espinhos = [], ms2Descargas = [], ms2Arcos = [];
const MS2_ESPUMA = ['#e0f4ff', '#c8e4f0', '#ffffff'], MS2_ROSA = ['#ff8ab0', '#ffb8e0', '#ffffff'], MS2_CIANO = ['#6ae8d8', '#a8f0e8', '#ffffff'], MS2_RAIO_C = ['#c8f0ff', '#ffffff', '#9ad8ff', '#f0ff8a'];
function ms2Sparks(x, y, n, cols, sp = 40, g = 0, life = 0.4, glowy = true) {
  for (let i = 0; i < n; i++) ms2P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1, gl: glowy });
}

/* ---------- o Tubarão-Cego ---------- */
AI.tubarao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.debate = (e.debate || 0) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (!ms2NaAgua(e)) { if (e.state !== 'swim') { e.state = 'swim'; e.atkCD = Math.max(e.atkCD, 1.5); } ms2Debate(e, dt); return; }
  const drag = k => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  if (e.state === 'turn') {   // vira de lado e bate a cauda; a espuma fica para trás; mira até o fim
    drag(0.03); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.12) { e.tgX = pcx; e.tgY = pcy; }
    if (Math.random() < dt * 40) { const [x, y] = ms2Pt(e, 2 + rnd(0, 6), 10 + rnd(-6, 6), MS2_TBA); ms2P({ x, y, vx: rnd(-14, 14) - e.facing * 20, vy: rnd(-14, 6), g: -6, life: rnd(0.6, 1.1), max: 1.1, col: MS2_ESPUMA[(Math.random() * 3) | 0], size: 1, gl: false }); }
    if (!e.slap2 && e.stateT < MS2_CAUDA * 0.45) { e.slap2 = true; sfx.ms2Cauda(Math.max(0.4, ms2Near(e, 260)), 1.2); }
    if (e.stateT <= 0) {
      const a = Math.atan2(e.tgY - ecy, e.tgX - ecx), sp = 290;
      e.state = 'charge'; e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; e.chD = Math.hypot(e.tgX - ecx, e.tgY - ecy) + 3 * T; e.chL = 0; e.swingHit = false;
      e.facing = Math.sign(e.vx) || e.facing; sfx.ms2Investida(Math.max(0.4, ms2Near(e, 260)));
    }
    return;
  }
  if (e.state === 'charge') {   // reto; a mordida na frente do focinho; para na pedra, na superfície ou passado o alvo
    e.chL += Math.hypot(e.vx, e.vy) * dt;
    const front = e.facing > 0 ? e.x + e.w - 10 : e.x - 4;
    if (!e.swingHit && !pl.dead && overlap({ x: front, y: e.y - 2, w: 14, h: e.h + 4 }, pl)) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') { sfx.ms2Mordida(1); ms2Sparks(pcx, pcy, 6, ['#c84a4a', '#8a2a2a', '#e0f4ff'], 50, 0, 0.4, false); }
      e.stateT = 0; e.chL = e.chD;
    }
    if (Math.random() < dt * 30) ms2P({ x: ecx - e.facing * 14 + rnd(-2, 2), y: ecy + rnd(-3, 3), vx: rnd(-8, 8), vy: rnd(-20, -6), g: -10, life: 0.7, max: 0.7, col: '#c8e4f0', size: 1, gl: false });
    const tx = Math.floor(ecx / T), ty = Math.floor((e.y + 1 + e.vy * 0.05) / T);
    if (e.vy < 0 && !aguaAt(tx, ty) && !solidAt(tx, ty)) e.vy = 0;
    if (e.hitWall || e.hitCeil || e.onGround || e.chL > e.chD) { e.state = 'recover'; e.stateT = 0.7; e.atkCD = 2.2 + Math.random(); e.circR = null; if (e.hitWall) burst(ecx + e.facing * 14, ecy, 6, '#3a4a54', 50, 200, 0.4); }
    return;
  }
  if (e.state === 'recover') { drag(0.15); if (e.stateT <= 0) e.state = 'swim'; return; }
  e.state = 'swim';
  if (aggro) {
    // o círculo: começa largo e vai fechando; com o herói fraco, fecha mais perto
    const low = pl.hp < pl.maxHp * 0.5, rMin = (low ? 2.5 : 4.2) * T, r0 = (low ? 6 : 8.5) * T;
    if (e.circR == null) { e.circR = r0; e.circA = Math.atan2(ecy - pcy, ecx - pcx); e.circS = Math.random() < 0.5 ? 1 : -1; e.circT = 0; }
    e.circR = clamp(Math.min(e.circR, r0) - dt * 0.55 * T, rMin, r0); e.circT += dt;
    const sp = 92 + e.lvl * 0.3; e.circA += e.circS * dt * sp / Math.max(e.circR, 2 * T);
    ms2Nada(e, dt, pcx + Math.cos(e.circA) * e.circR, pcy + Math.sin(e.circA) * e.circR * 0.55, sp, 2.2, 1);
    if (Math.abs(e.vx) > 6) e.facing = Math.sign(e.vx);
    if (e.hitWall) e.circS = -e.circS;
    // a barbatana corta a superfície
    const tx = Math.floor(ecx / T), ty = Math.floor((e.y - 2) / T);
    if (!aguaAt(tx, ty) && !solidAt(tx, ty)) { e.finT = (e.finT || 0) - dt; if (e.finT <= 0) { e.finT = 0.9 + Math.random() * 0.6; const v = ms2Near(e, 240); if (v > 0.05) sfx.ms2Barbatana(v); } }
    if (e.atkCD <= 0 && (e.circR <= rMin + 4 || e.circT > 6) && dist < 9.5 * T && dist > 2 * T && ms2HeroiMolhado() && ms2LinhaAgua(ecx, ecy, pcx, pcy)) {
      e.state = 'turn'; e.stateT = MS2_CAUDA; e.tgX = pcx; e.tgY = pcy; e.slap2 = false; e.facing = Math.sign(dx) || e.facing;
      sfx.ms2Cauda(Math.max(0.4, ms2Near(e, 260)));
    }
  } else {
    e.circR = null;
    ms2Nada(e, dt, (e.homeX ?? ecx) + Math.sin(e.t * 0.3 + e.seed) * 70, (e.homeY ?? ecy) + Math.sin(e.t * 0.7 + e.seed) * 14, 36, 1.5, 1);
    if (Math.abs(e.vx) > 4) e.facing = Math.sign(e.vx);
  }
};

/* ---------- a Medusa Abissal ---------- */
// os tentáculos: um retângulo debaixo do sino
const ms2Tent = (e, m = 0) => ({ x: e.x + e.w / 2 - 6 - m, y: ms2Borda(e), w: 12 + 2 * m, h: MS2_TENT + m });
AI.medusa = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.debate = (e.debate || 0) - dt;
  e.atkCD = Math.max(e.atkCD, 0.1);   // o toque do laço (o sino) nunca dispara: quem queima são os tentáculos, aqui
  e.shockCD = (e.shockCD || 0) - dt; e.toqueT = (e.toqueT || 0) - dt; e.contra = (e.contra || 0) - dt;
  if (!ms2NaAgua(e)) { e.state = 'drift'; ms2Debate(e, dt); return; }
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, D = ET.medusa;
  // pulsa: contrai e sobe, depois afunda devagar; atrás do herói, sobe para ficar por cima dele
  e.pulT = (e.pulT ?? Math.random() * 2) - dt;
  const want = aggro ? pcy - 2 * T : (e.homeY ?? e.y);
  if (e.pulT <= 0 && e.state !== 'shock') {
    e.pulT = (aggro && e.y > want ? 1.1 : 1.9) + Math.random() * 0.7;
    if (e.y > want) { e.contra = 0.35; e.vy = -44; e.vx += clamp(dx, -1, 1) * (aggro ? 10 : 3); const v = ms2Near(e, 160); if (v > 0.1) sfx.ms2Pulso(v); }
  }
  if (e.contra <= 0) e.vy = approach(e.vy, 9, 34 * dt);
  e.vx = approach(e.vx, aggro ? clamp(dx * 0.25, -13, 13) : Math.sin(e.t * 0.2 + e.seed) * 4, 16 * dt);
  ms2Teto(e, 1);
  if (e.hitWall) e.vx = -e.vx * 0.5;
  // o toque nos tentáculos (fraco) e o choque (o golpe)
  const hot = !pl.dead && overlap(ms2Tent(e), pl);
  if (hot && e.toqueT <= 0 && e.state !== 'shock') { e.toqueT = 0.9; hurtPlayer(Math.max(1, Math.round(e.dmg * D.touch)), ecx, e, false); }
  if (e.state === 'light') {   // acendem de cima para baixo
    if (Math.random() < dt * 20) { const y = clamp(1 - e.stateT / MS2_ACENDE, 0, 1) * MS2_TENT, i = (Math.random() * 5) | 0; ms2Sparks(ecx + ms2TentX(e, i, y), ms2Borda(e) + y, 1, MS2_CIANO, 10, 0, 0.3); }
    if (e.stateT <= 0) {
      e.state = 'shock'; e.stateT = 0.3; e.shockCD = 2.6 + Math.random();
      sfx.ms2Choque(Math.max(0.4, ms2Near(e, 220)));
      for (let i = 0; i < 5; i++) ms2Sparks(ecx + ms2TentX(e, i, 20), ms2Borda(e) + rnd(4, MS2_TENT), 2, MS2_CIANO, 40, 0, 0.35);
      if (hot) { const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') ms2Sparks(pcx, pcy, 8, MS2_CIANO, 60, 0, 0.4); e.toqueT = 0.9; }
    }
    return;
  }
  if (e.state === 'shock') { if (e.stateT <= 0) e.state = 'drift'; return; }
  e.state = 'drift';
  if (aggro && e.shockCD <= 0 && !pl.dead && overlap(ms2Tent(e, 10), pl)) { e.state = 'light'; e.stateT = MS2_ACENDE; sfx.ms2Acende(Math.max(0.4, ms2Near(e, 200))); }
};

/* ---------- a Enguia-Trovão ---------- */
// o rastro da cabeça e os segmentos ao longo dele
function ms2Rastro(e) {
  const hx = e.x + e.w / 2, hy = e.y + e.h / 2, R = e.rastro, L = R[R.length - 1];
  if (!L || Math.hypot(hx - L[0], hy - L[1]) >= 2) { R.push([hx, hy]); if (R.length > 60) R.shift(); }
  let need = MS2_SEG0, px = hx, py = hy, n = 0;
  for (let j = R.length - 1; j >= 0 && n < MS2_SEGS; j--) {
    const x = R[j][0], y = R[j][1]; let d = Math.hypot(x - px, y - py);
    while (d >= need && n < MS2_SEGS) { const t = need / d; px += (x - px) * t; py += (y - py) * t; e.segs[n][0] = px; e.segs[n][1] = py; n++; d -= need; need = MS2_SEG_D; }
    need -= d; px = x; py = y;
  }
  for (; n < MS2_SEGS; n++) { e.segs[n][0] = px; e.segs[n][1] = py; }
}
// a água ligada à enguia num raio de 5 blocos (em largura, só por água)
function ms2Ligada(tx, ty) {
  const out = [], seen = new Set([tx * 16384 + ty]), q = [[tx, ty]];
  if (!ms2Molhado(tx, ty)) return out;
  for (let i = 0; i < q.length && i < 200; i++) {
    const [x, y] = q[i]; out.push(q[i]);
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ax, ny = y + ay, k = nx * 16384 + ny;
      if (seen.has(k)) continue; seen.add(k);
      if ((nx - tx) ** 2 + (ny - ty) ** 2 > MS2_RAIO * MS2_RAIO || !ms2Molhado(nx, ny)) continue;
      q.push([nx, ny]);
    }
  }
  return out;
}
AI.enguia = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.debate = (e.debate || 0) - dt;
  ms2Rastro(e);
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (!ms2NaAgua(e)) { if (e.state !== 'swim') { e.state = 'swim'; e.atkCD = Math.max(e.atkCD, 1.5); } ms2Debate(e, dt); return; }
  const drag = k => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  if (e.state === 'charge') {   // os segmentos acendem um a um, estalando
    drag(0.08);
    const n = ms2Acesos(e);
    if (n > (e.lit || 0)) { e.lit = n; const S = e.segs[Math.min(n, MS2_SEGS) - 1]; ms2Sparks(S[0], S[1], 3, MS2_RAIO_C, 30, 0, 0.25); sfx.ms2Estalo(Math.max(0.3, ms2Near(e, 220))); }
    if (Math.random() < dt * 25) { const S = e.segs[(Math.random() * Math.max(1, e.lit || 1)) | 0]; ms2Sparks(S[0], S[1], 1, MS2_RAIO_C, 20, 0, 0.2); }
    if (e.stateT <= 0) {
      // a descarga: toda a água ligada num raio de 5 blocos; quem está fora da água não leva
      const cells = ms2Ligada(Math.floor(ecx / T), Math.floor(ecy / T)), set = new Set(cells.map(c => c[0] * 16384 + c[1]));
      ms2Descargas.push({ x: ecx, y: ecy, cells, t: 0 });
      let pega = false;
      if (ms2HeroiMolhado()) {
        const x0 = Math.floor(pl.x / T), x1 = Math.floor((pl.x + pl.w - 0.01) / T), y0 = Math.floor(pl.y / T), y1 = Math.floor((pl.y + pl.h - 0.01) / T);
        for (let y = y0; y <= y1 && !pega; y++) for (let x = x0; x <= x1; x++) if (set.has(x * 16384 + y)) { pega = true; break; }
      }
      if (pega) { const r = hurtPlayer(e.dmg, pcx - pl.facing * 12, null, true); if (r === 'hit') ms2Sparks(pcx, pcy, 10, MS2_RAIO_C, 70, 0, 0.4); }   // vem da água em volta: o escudo não segura
      e.state = 'zap'; e.stateT = 0.35; e.atkCD = 3.2 + Math.random() * 1.2; e.lit = 0;
      sfx.ms2Descarga(Math.max(0.5, ms2Near(e, 300))); if (ms2Near(e, 160) > 0) shake(2);
    }
    return;
  }
  if (e.state === 'zap') { drag(0.1); if (e.stateT <= 0) { e.state = 'swim'; e.passo = null; } return; }
  e.state = 'swim';
  let tx, ty, sp;
  if (aggro) {
    // passa rente ao herói: mira um ponto do outro lado dele e, chegando, escolhe outro
    e.passoT = (e.passoT || 0) - dt;
    if (!e.passo || e.passoT <= 0 || Math.hypot(e.passo[0] - ecx, e.passo[1] - ecy) < 12) {
      const sd = -(Math.sign(ecx - pcx) || 1);
      e.passo = [pcx + sd * (5 + Math.random() * 2) * T, pcy + rnd(-1.4, 1.4) * T]; e.passoT = 4;
    }
    [tx, ty] = e.passo; sp = 82 + e.lvl * 0.3;
  } else { tx = (e.homeX ?? ecx) + Math.sin(e.t * 0.25 + e.seed) * 80; ty = (e.homeY ?? ecy) + Math.sin(e.t * 0.6 + e.seed) * 16; sp = 40; }
  ms2Nada(e, dt, tx, ty, sp, 2, 2, 0.5);
  if (Math.abs(e.vx) > 5) e.facing = Math.sign(e.vx);
  if (e.hitWall) e.passo = null;
  if (aggro && e.atkCD <= 0 && dist < 4.5 * T && ms2HeroiMolhado() && ms2LinhaAgua(ecx, ecy, pcx, pcy)) {
    e.state = 'charge'; e.stateT = MS2_ESTALA; e.lit = 0; sfx.ms2Estalo(Math.max(0.5, ms2Near(e, 220)));
  }
};

/* ---------- o Baiacu-de-Espinhos ---------- */
AI.baiacu = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.debate = (e.debate || 0) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (!ms2NaAgua(e)) { e.state = 'drift'; ms2Debate(e, dt); return; }
  const drag = k => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  if (e.state === 'puff') {   // incha, os espinhos sobem, assobia
    drag(0.05); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) {
      const a0 = Math.atan2(pcy - ecy, pcx - ecx);   // um dos oito vai direto no herói
      for (let i = 0; i < 8; i++) { const a = a0 + i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); ms2Espinhos.push({ x: ecx + c * 9, y: ecy + s * 9, vx: c * MS2_ESP_SP, vy: s * MS2_ESP_SP, t: 0, dmg: e.dmg, done: 0 }); }
      e.state = 'shoot'; e.stateT = 0.3; e.atkCD = 2.3 + 2 + Math.random() * 1.2;
      sfx.ms2Espinhos(Math.max(0.4, ms2Near(e, 240)));
    }
    return;
  }
  if (e.state === 'shoot') { drag(0.05); if (e.stateT <= 0) { e.state = 'slack'; e.stateT = 2; sfx.ms2Murcha(Math.max(0.3, ms2Near(e, 200))); } return; }
  if (e.state === 'slack') { e.vx = approach(e.vx, 0, 60 * dt); e.vy = approach(e.vy, 6, 30 * dt); ms2Teto(e, 1); if (e.stateT <= 0) e.state = 'drift'; return; }
  // murcho: foge enquanto não pode inchar de novo; pronto, chega perto; sem herói, boia
  let tx, ty, sp;
  if (aggro && e.atkCD > 0 && dist < 7 * T) { e.state = 'flee'; const d = dist || 1; tx = ecx - dx / d * 6 * T; ty = ecy - dy / d * 4 * T; sp = 46; }
  else if (aggro) { e.state = 'drift'; const k = dist > 5.5 * T ? 1 : 0; tx = k ? pcx : ecx; ty = k ? pcy - T : ecy; sp = 24; }
  else { e.state = 'drift'; tx = (e.homeX ?? ecx) + Math.sin(e.t * 0.2 + e.seed) * 30; ty = (e.homeY ?? ecy) + Math.sin(e.t * 0.5 + e.seed) * 8; sp = 12; }
  ms2Nada(e, dt, tx, ty, sp, 1.6, 1);
  e.facing = aggro && e.state !== 'flee' ? (Math.sign(dx) || e.facing) : Math.abs(e.vx) > 3 ? Math.sign(e.vx) : e.facing;
  if (aggro && e.atkCD <= 0 && e.sees && dist < 7 * T) { e.state = 'puff'; e.stateT = MS2_INCHA; e.vx *= 0.3; e.vy *= 0.3; sfx.ms2Assobio(Math.max(0.4, ms2Near(e, 240))); }
};

/* ---------- o Diabo-Marinho ---------- */
AI.diabomar = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.debate = (e.debate || 0) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (!ms2NaAgua(e)) { e.state = 'lurk'; ms2Debate(e, dt); return; }
  const drag = k => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  if (e.state === 'tell') {   // a isca para e cai, os dentes aparecem; mira até o último instante
    drag(0.02);
    if (e.stateT > 0.1) { e.tgX = pcx; e.tgY = pcy; }
    if (e.stateT <= 0) {
      const [mx, my] = ms2Pt(e, 42, 18, MS2_DBA), a = Math.atan2(e.tgY - my, e.tgX - mx), sp = 300;
      e.state = 'bite'; e.stateT = 0.3; e.swingHit = false; e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; e.biteA = a;
      ms2Arcos.push({ e, t: 0, a });
      sfx.ms2Bocada(Math.max(0.5, ms2Near(e, 260)));
    }
    return;
  }
  if (e.state === 'bite') {   // a bocada em arco na frente da boca
    const [mx, my] = ms2Pt(e, 40, 18, MS2_DBA), R = 22;
    if (!e.swingHit && !pl.dead && overlap({ x: mx - R + e.facing * 6, y: my - R, w: R * 2, h: R * 2 }, pl)) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') ms2Sparks(pcx, pcy, 8, ['#c84a4a', '#8a2a2a', '#e0d8b8'], 60, 0, 0.4, false);
    }
    drag(0.004);
    if (e.stateT <= 0) { e.state = e.swingHit ? 'recover' : 'miss'; e.stateT = e.swingHit ? 0.5 : 1; e.atkCD = 1.6 + Math.random() * 0.8; }
    return;
  }
  if (e.state === 'miss') { e.vx = 0; e.vy = 0; if (e.stateT <= 0) e.state = 'lurk'; return; }   // errou: parado 1 s, a boca aberta
  if (e.state === 'recover') { drag(0.05); if (e.stateT <= 0) e.state = 'lurk'; return; }
  e.state = 'lurk';
  // parado no escuro, só a isca balança; com o herói por perto e longe da boca, chega bem devagar
  if (aggro && dist > 5 * T && dist < 12 * T) ms2Nada(e, dt, pcx, pcy, 10, 1, 2);
  else { drag(0.2); e.vy += Math.sin(e.t * 0.8 + e.seed) * 2 * dt; ms2Teto(e, 2); }
  e.turnT = (e.turnT || 0) - dt;
  if (aggro && e.turnT <= 0) { e.turnT = 1.4; if (Math.sign(dx) && Math.sign(dx) !== e.facing) e.facing = Math.sign(dx); }
  if (aggro && e.atkCD <= 0 && dist < 4.6 * T && Math.sign(dx) === e.facing && ms2HeroiMolhado() && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'tell'; e.stateT = MS2_DENTES_T; e.tgX = pcx; e.tgY = pcy; sfx.ms2Isca(Math.max(0.5, ms2Near(e, 220)));
  }
};

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const mine = e && MS2_TYPES.includes(e.type), keep = mine && (e.state === 'charge' && e.type === 'tubarao' || e.state === 'bite') ? [e.vx, e.vy] : null;
  const r = _hit(e, dir, mult, melee);
  if (!mine || e.dead) return r;
  if (keep) { e.vx = keep[0]; e.vy = keep[1]; }                                     // o golpe não desvia a investida nem a bocada
  if (!ms2NaAgua(e)) e.stun = 0;                                                     // fora da água continua se debatendo (e caindo)
  if (e.type === 'tubarao' && e.state === 'charge') e.stun = 0;                      // na investida não para
  if (e.type === 'enguia' && e.state === 'charge') e.stun = 0;                       // carregando, não se encolhe
  if (e.type === 'diabomar' && (e.state === 'bite' || e.state === 'tell')) e.stun = 0;
  if (e.type === 'baiacu' && (e.state === 'puff' || e.state === 'shoot')) { e.stun = 0; e.vx *= 0.3; e.vy *= 0.3; }
  if (e.type === 'diabomar' && e.state === 'lurk') e.atkCD = Math.min(e.atkCD, 0.3);   // acordado, morde logo
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!MS2_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, ms2Near(e, 260));
  if (e.type === 'medusa') { ms2Sparks(cx, cy, 10, MS2_ROSA, 30, -10, 1); for (let i = 0; i < 5; i++) ms2Sparks(cx + ms2TentX(e, i, 18), ms2Borda(e) + rnd(4, MS2_TENT), 2, MS2_CIANO, 15, 10, 0.8); sfx.ms2Pulso(v); }
  else if (e.type === 'enguia') { if (e.segs) for (const S of e.segs) ms2Sparks(S[0], S[1], 2, MS2_RAIO_C, 30, 0, 0.4); sfx.ms2Estalo(v); }
  else if (e.type === 'baiacu') { ms2Sparks(cx, cy, 10, ['#e0d8b8', '#bab090', '#948a6a'], 50, 40, 0.6, false); sfx.ms2Murcha(v); }
  else if (e.type === 'diabomar') { const [ix, iy] = ms2Isca(e); ms2Sparks(ix, iy, 10, MS2_CIANO, 25, 10, 1.2); sfx.ms2Isca(v); }
  else { for (let i = 0; i < 10; i++) ms2P({ x: cx + rnd(-12, 12), y: cy + rnd(-4, 4), vx: rnd(-10, 10), vy: rnd(-25, -8), g: -6, life: rnd(0.6, 1.2), max: 1.2, col: '#c8e4f0', size: 1, gl: false }); sfx.ms2Cauda(v, 0.7); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !MS2_TYPES.includes(type)) return e;
  e.atkCD = 0.8 + Math.random() * 0.8; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'tubarao') { e.state = 'swim'; e.circR = null; }
  else if (type === 'medusa') { e.state = 'drift'; e.shockCD = 0.6 + Math.random(); e.pulT = Math.random() * 1.8; e.contra = 0; }
  else if (type === 'enguia') {
    e.state = 'swim'; e.rastro = []; e.segs = MS2_SEG_R.map(() => [0, 0]);
    for (let i = 24; i >= 0; i--) e.rastro.push([e.x + e.w / 2 - e.facing * i * 2.5, e.y + e.h / 2]);
    ms2Rastro(e);
  }
  else if (type === 'baiacu') e.state = 'drift';
  else e.state = 'lurk';
  return e;
}; }

/* ---------- a cada quadro: os espinhos, as descargas, os arcos da bocada ---------- */
function ms2Update(dt) {
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  for (let i = ms2Espinhos.length - 1; i >= 0; i--) {
    const S = ms2Espinhos[i]; S.t += dt;
    if (S.done) { S.done += dt; if (S.done > 0.6) ms2Espinhos.splice(i, 1); continue; }
    const f = Math.pow(0.55, dt); S.vx *= f; S.vy *= f; S.x += S.vx * dt; S.y += S.vy * dt;
    if (solidAt(Math.floor(S.x / T), Math.floor(S.y / T))) { S.done = 0.01; S.x -= S.vx * dt; S.y -= S.vy * dt; continue; }
    if (!pl.dead && S.x > pl.x - 1 && S.x < pl.x + pl.w + 1 && S.y > pl.y - 1 && S.y < pl.y + pl.h + 1) {
      const r = hurtPlayer(S.dmg, S.x - S.vx * 0.1, null, true);
      if (r !== 'none' || pl.invuln > 0) { ms2Espinhos.splice(i, 1); continue; }
    }
    if (S.t > MS2_ESP_VIDA) ms2Espinhos.splice(i, 1);
  }
  for (let i = ms2Descargas.length - 1; i >= 0; i--) { const Z = ms2Descargas[i]; Z.t += dt; if (Z.t > 0.45) ms2Descargas.splice(i, 1); }
  for (let i = ms2Arcos.length - 1; i >= 0; i--) { const A = ms2Arcos[i]; A.t += dt; if (A.t > 0.28 || A.e.dead) ms2Arcos.splice(i, 1); }
}
HOOK.update.push(ms2Update);
function clearMs2Fx() { ms2Fx.length = 0; ms2Espinhos.length = 0; ms2Descargas.length = 0; ms2Arcos.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearMs2Fx(); ms2Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: as medusas (são as lâmpadas do mar), a enguia carregando, a descarga. O diabo-marinho não
// ilumina nada: a isca só brilha
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'medusa') {
      const cx = e.x + e.w / 2, lit = e.state === 'light' ? 0.2 : e.state === 'shock' ? 0.35 : 0;
      addL(cx, e.y + e.h / 2, 0.45 + lit); addL(cx, ms2Borda(e) + 18, 0.3 + lit);
    } else if (e.type === 'enguia' && e.segs && (e.state === 'charge' || e.state === 'zap')) {
      const n = ms2Acesos(e); for (let i = 0; i < n; i += 3) addL(e.segs[i][0], e.segs[i][1], e.state === 'zap' ? 0.7 : 0.45);
    }
  }
  for (const Z of ms2Descargas) { const f = 1 - Z.t / 0.45; for (let i = 0; i < Z.cells.length; i += 4) addL((Z.cells[i][0] + 0.5) * T, (Z.cells[i][1] + 0.5) * T, 0.65 * f); }
}; }

// a luz aditiva: a descarga na água
HOOK.drawGlow.push((cx, cy) => {
  const G = MS2.GL;
  for (const Z of ms2Descargas) {
    const f = 1 - Z.t / 0.45;
    for (let i = 0; i < Z.cells.length; i += 3) { const [x, y] = Z.cells[i]; lc.globalAlpha = 0.35 * f * (0.6 + 0.4 * Math.sin(gameTime * 50 + i)); lc.drawImage(G.trovaoG, Math.round((x + 0.5) * T - cx) - 12, Math.round((y + 0.5) * T - cy) - 12); }
  }
  lc.globalAlpha = 1;
});
// por cima do escuro: os tentáculos acesos, os órgãos da enguia, a isca e os dentes, a espuma da barbatana, os
// espinhos, os raios da descarga, o arco da bocada
function ms2Dot(x, y, cx, cy, sz = 1) { lc.fillRect(Math.round(x - cx), Math.round(y - cy), sz, sz); }
HOOK.drawTop.push((cx, cy) => {
  const now = gameTime;
  for (const e of enemies) {
    if (e.dead || !MS2_TYPES.includes(e.type)) continue;
    const sx = e.x + e.w / 2 - cx, sy = e.y + e.h / 2 - cy;
    if (sx < -70 || sx > VW + 70 || sy < -70 || sy > VH + 70) continue;
    const ecx = e.x + e.w / 2;
    if (e.type === 'medusa') {
      // os tentáculos: um brilho fraco sempre; no aviso acendem de cima para baixo; no choque, tudo branco e tremendo
      const rim = ms2Borda(e), lit = e.state === 'light' ? clamp(1 - e.stateT / MS2_ACENDE, 0, 1) * MS2_TENT : e.state === 'shock' ? MS2_TENT : 0;
      for (let i = 0; i < 5; i++) for (let y = 1; y < MS2_TENT; y += lit > y ? 1 : 3) {
        const on = lit > y, j = e.state === 'shock' ? Math.round(Math.sin(now * 60 + y + i * 3)) : 0;
        lc.globalAlpha = on ? (lit - y < 4 ? 1 : 0.8) : 0.22 + 0.12 * Math.sin(now * 2 + y * 0.3 + i);
        lc.fillStyle = on ? (lit - y < 3 || e.state === 'shock' && (y + i + Math.floor(now * 20)) % 4 === 0 ? '#ffffff' : '#a8f0e8') : (i % 2 ? '#ff8ab0' : '#6ae8d8');
        ms2Dot(ecx + ms2TentX(e, i, y) + j, rim + y, cx, cy);
      }
      // a borda do sino, uns pontinhos rosa
      lc.globalAlpha = 0.55; lc.fillStyle = '#ffb8e0';
      const rx = e.contra > 0 ? 5 : 7;
      for (let x = -rx; x <= rx; x += 2) ms2Dot(ecx + x, rim - 1 + (x & 2 ? 0 : 1) - 0.2, cx, cy);
    } else if (e.type === 'enguia' && e.segs) {
      const n = ms2Acesos(e);
      for (let i = 0; i < MS2_SEGS; i++) {
        const S = e.segs[i], on = i < n;
        lc.globalAlpha = on ? 0.9 : 0.18; lc.fillStyle = on ? ((i + Math.floor(now * 24)) % 3 ? '#c8f0ff' : '#ffffff') : '#f0ff8a';
        ms2Dot(S[0], S[1] + 0.5, cx, cy);
        if (on && i > 0 && Math.random() < 0.5) { const P = e.segs[i - 1]; lc.fillStyle = '#9ad8ff'; ms2Dot((S[0] + P[0]) / 2 + rnd(-1.5, 1.5), (S[1] + P[1]) / 2 + rnd(-2, 2), cx, cy); }
      }
      lc.globalAlpha = 0.7; lc.fillStyle = '#f0ff8a'; const [ex, ey] = ms2Pt(e, 12.8, 5, [8, 6]); ms2Dot(ex, ey, cx, cy);
    } else if (e.type === 'diabomar') {
      // a isca: um ponto claro com a cruz de brilho de vez em quando, como o loot no escuro
      const [ix, iy] = ms2Isca(e);
      lc.globalAlpha = 1; lc.fillStyle = '#e0fff8'; ms2Dot(ix, iy, cx, cy);
      lc.fillStyle = '#6ae8d8'; lc.globalAlpha = 0.8; ms2Dot(ix - 1, iy, cx, cy); ms2Dot(ix + 1, iy, cx, cy); ms2Dot(ix, iy - 1, cx, cy); ms2Dot(ix, iy + 1, cx, cy);
      const tw = (now * 0.7 + e.seed) % 1.6;
      if (e.state === 'lurk' && tw < 0.25) { const r = 2 + Math.round(Math.sin(tw / 0.25 * Math.PI) * 2); lc.globalAlpha = 0.7; lc.fillStyle = '#ffffff'; for (let k = 2; k <= r; k++) { ms2Dot(ix - k, iy, cx, cy); ms2Dot(ix + k, iy, cx, cy); ms2Dot(ix, iy - k, cx, cy); ms2Dot(ix, iy + k, cx, cy); } }
      // os dentes: o contorno aparece no aviso; na bocada e parado depois, fracos
      const k = ms2DbPose(e), q = e.state === 'tell' ? clamp(1 - e.stateT / MS2_DENTES_T, 0, 1) : e.state === 'bite' ? 1 : e.state === 'miss' ? 0.4 : 0;
      if (q > 0) { const D = MS2.DENTES[k]; lc.fillStyle = '#dfe8ff'; for (let j = 0; j < D.length; j++) { const [x, y] = ms2Pt(e, D[j][0] + 0.5, D[j][1] + 0.5, MS2_DBA); lc.globalAlpha = q * (j % 2 ? 0.55 : 0.95); ms2Dot(x - (e.facing < 0 ? 1 : 0), y, cx, cy); } }
    } else if (e.type === 'tubarao') {
      // a barbatana fora da água: o fio dela pega a pouca luz e a espuma corta a superfície
      const tx = Math.floor(ecx / T), ty = Math.floor((e.y + 1) / T);
      if (aguaAt(tx, ty) && !aguaAt(tx, ty - 1) && !solidAt(tx, ty - 1)) {
        const sY = ty * T, fin = e.state === 'turn' ? [[19, 8], [25.8, 3], [28.8, 7.8]] : [[19, 8], [23.4, 0.6], [25.2, 0.8], [28.8, 7.8]];
        lc.fillStyle = '#8a9aa2';
        for (let s = 0; s + 1 < fin.length; s++) for (let t = 0; t <= 1; t += 0.12) {
          const [x, y] = ms2Pt(e, lerp(fin[s][0], fin[s + 1][0], t), lerp(fin[s][1], fin[s + 1][1], t), MS2_TBA);
          if (y < sY - 0.5) { lc.globalAlpha = s === 0 ? 0.55 : 0.3; ms2Dot(x, y, cx, cy); }
        }
        const [fx0] = ms2Pt(e, 24, 0, MS2_TBA);
        lc.fillStyle = '#e0f4ff';
        for (let j = 0; j < 7; j++) { const x = fx0 - e.facing * (j * 2 - 3), a = 0.6 - j * 0.07 + 0.2 * Math.sin(now * 9 + j); if (a <= 0) continue; lc.globalAlpha = a; ms2Dot(x, sY - (j % 2), cx, cy); }
      }
    } else if (e.type === 'baiacu' && (e.state === 'puff' || e.state === 'shoot')) {
      // as pontas dos espinhos pegam luz
      const q = e.state === 'shoot' ? 1 : clamp(1 - e.stateT / MS2_INCHA, 0, 1), r = 9 + q * 4;
      lc.fillStyle = '#e0d8b8';
      for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + 0.14; lc.globalAlpha = 0.35 + 0.4 * q; ms2Dot(ecx + Math.cos(a) * r, e.y + e.h / 2 + Math.sin(a) * r, cx, cy); }
    }
  }
  // os espinhos voando: uma agulha clara de 3 pixels com a ponta branca
  for (const S of ms2Espinhos) {
    const sp = Math.hypot(S.vx, S.vy) || 1, ux = S.vx / sp, uy = S.vy / sp, f = S.done ? 1 - S.done / 0.6 : 1;
    for (let k = 0; k < 4; k++) { lc.globalAlpha = f * (k ? 0.8 : 1); lc.fillStyle = k === 0 ? '#fffaf0' : k < 3 ? '#bab090' : '#6e644a'; ms2Dot(S.x - ux * k, S.y - uy * k, cx, cy); }
  }
  // a descarga: raios curtos tremendo por toda a água ligada
  for (const Z of ms2Descargas) {
    const f = 1 - Z.t / 0.45;
    for (let i = 0; i < Z.cells.length; i += 2) {
      if (Math.random() > 0.5) continue;
      const [x, y] = Z.cells[i]; let px = (x + Math.random()) * T, py = (y + Math.random()) * T;
      lc.globalAlpha = f; lc.fillStyle = Math.random() < 0.3 ? '#ffffff' : '#9ad8ff';
      for (let k = 0; k < 4; k++) { ms2Dot(px, py, cx, cy); px += rnd(-2.5, 2.5); py += rnd(-2.5, 2.5); }
    }
    if (Z.t < 0.15) { lc.globalAlpha = 1 - Z.t / 0.15; lc.fillStyle = '#ffffff'; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28 + now * 7, r = 3 + Z.t * 60; ms2Dot(Z.x + Math.cos(a) * r, Z.y + Math.sin(a) * r, cx, cy); } }
  }
  // a bocada: um arco claro de dentes na frente da boca
  for (const A of ms2Arcos) {
    const e = A.e, [mx, my] = ms2Pt(e, 40, 18, MS2_DBA), p = A.t / 0.28, R = 14 + p * 10;
    lc.fillStyle = '#dfe8ff';
    for (let i = -7; i <= 7; i++) { const a = A.a + i * 0.17; lc.globalAlpha = (1 - p) * (1 - Math.abs(i) / 9); ms2Dot(mx + Math.cos(a) * R, my + Math.sin(a) * R, cx, cy); if (i % 2 === 0) ms2Dot(mx + Math.cos(a) * (R - 2), my + Math.sin(a) * (R - 2), cx, cy); }
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  // o tubarão: a cauda batendo com chiado, a investida, a mordida, a barbatana cortando a água
  ms2Cauda(v = 1, p = 1) { noise(0.12, 0.09 * v, 600 * p, 'lowpass'); noise(0.45, 0.035 * v, 4200, 'highpass', 0.04); tone(90 * p, 0.15, 'sine', 0.03 * v, -30); },
  ms2Investida(v = 1) { noise(0.45, 0.07 * v, 700, 'bandpass', 0, 0.7); tone(70, 0.4, 'sine', 0.03 * v, -20); },
  ms2Mordida(v = 1) { noise(0.08, 0.1 * v, 1400, 'bandpass', 0, 1.5); tone(160, 0.1, 'square', 0.02 * v, -80); },
  ms2Barbatana(v = 1) { noise(0.35, 0.02 * v, 2400, 'bandpass', 0, 2); },
  // a medusa: o pulso mole, os tentáculos acendendo, o choque
  ms2Pulso(v = 1) { noise(0.25, 0.012 * v, 500, 'lowpass'); tone(220, 0.25, 'sine', 0.006 * v, 60); },
  ms2Acende(v = 1) { tone(300, 0.8, 'sine', 0.012 * v, 900); tone(600, 0.8, 'triangle', 0.005 * v, 1400); },
  ms2Choque(v = 1) { noise(0.25, 0.08 * v, 3000, 'highpass'); tone(120, 0.25, 'sawtooth', 0.03 * v, 60); },
  // a enguia: os estalos e a descarga
  ms2Estalo(v = 1) { noise(0.04, 0.05 * v, 5000, 'highpass'); tone(1800 + Math.random() * 900, 0.03, 'square', 0.01 * v); },
  ms2Descarga(v = 1) { noise(0.5, 0.12 * v, 2500, 'bandpass', 0, 0.5); tone(80, 0.45, 'sawtooth', 0.05 * v, 40); tone(60, 0.5, 'square', 0.02 * v, -20); },
  // o baiacu: o assobio de inchar, os espinhos, o murchar
  ms2Assobio(v = 1) { tone(900, 0.8, 'sine', 0.018 * v, 1300); noise(0.5, 0.01 * v, 3000, 'bandpass', 0, 4); },
  ms2Espinhos(v = 1) { for (let k = 0; k < 3; k++) noise(0.06, 0.05 * v, 2600, 'bandpass', k * 0.03, 2); tone(500, 0.12, 'triangle', 0.02 * v, -300); },
  ms2Murcha(v = 1) { noise(0.5, 0.03 * v, 900, 'bandpass', 0, 1); tone(400, 0.5, 'sine', 0.01 * v, -300); },
  // o diabo-marinho: o aviso (um rangido grave) e a bocada
  ms2Isca(v = 1) { tone(55, 0.6, 'sine', 0.03 * v, -10); noise(0.4, 0.015 * v, 300, 'lowpass'); },
  ms2Bocada(v = 1) { noise(0.18, 0.12 * v, 900, 'lowpass'); tone(110, 0.2, 'square', 0.03 * v, -60); noise(0.08, 0.06 * v, 2000, 'bandpass', 0.12, 2); },
  // qualquer um fora da água, se debatendo
  ms2Debate(v = 1) { noise(0.1, 0.05 * v, 1600, 'bandpass', 0, 1.2); }
});

/* ---------- as faíscas e a espuma (com o brilho da cor delas; a espuma sem brilho) ---------- */
const ms2Fx = [], ms2FxGl = {};
function ms2P(o) { if (ms2Fx.length < 500) ms2Fx.push(o); }
HOOK.update.push(dt => {
  for (let i = ms2Fx.length - 1; i >= 0; i--) { const p = ms2Fx[i]; p.life -= dt; if (p.life <= 0) { ms2Fx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const p of ms2Fx) { if (!p.gl) continue; const g = ms2FxGl[p.col] || (ms2FxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of ms2Fx) { lc.globalAlpha = Math.min(1, p.life / p.max * 2) * (p.gl ? 1 : 0.7); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
