'use strict';

/* ================= a Nave Caída: os Visitantes, parte dois =================
   Cinco dos dez bichos da décima camada (docs/camadas/10-nave-caida.md, seção 6; os outros cinco estão no 243):
   - os olhudinhos (olhudos), bolinhas verdes de três olhos e tentáculos, como no adesivo; vêm em grupos de 4 a 6
     (nv2Grupo). Os três olhos de todos piscam juntos (0,4 s) e o grupo inteiro pula no herói; mordem por toque
     (os únicos daqui com `touch`, junto com a gosma do 243);
   - o astronauta perdido (astronauta), traje branco, tanque nas costas e a gosma verde acesa por dentro do visor;
     anda devagar e pula como na lua (a gravidade dele é 45%). Agacha e o visor acende verde (0,8 s): um pulo enorme
     em arco que cai em cima do herói, com uma onda de choque pelo chão para os dois lados (o anel aparece no chão).
     Ao morrer o tanque de oxigênio cai, chia (1 s, o raio aparece) e estoura;
   - o cabeção (cabecao), a cabeça cinza enorme de olhos pretos brilhantes, flutuando baixo, com um escudo psíquico
     violeta na frente: só leva dano por trás ou de cima. Os olhos acendem violeta e um destroço do chão sobe
     tremendo (1 s); a telecinese arremessa o destroço no herói. A cada 3 arremessos puxa o herói 3 blocos;
   - o hipnotizador (hipnotico), o ET de pescoço comprido do sinal de paz; fica atrás dos outros e foge de perto.
     Faz o "V" e anéis arco-íris crescem da mão (1 s); a onda que sai hipnotiza por 3 s (nvHipnotizar, 240; o 249
     troca os controles). Não tem outro golpe (dano 0); o escudo erguido de frente para ele segura a onda;
   - o foguete errante (foguete), o foguetinho vermelho de nariz redondo e escotilha (o olho dele); dorme grudado
     no teto ou na parede. A chama acende, a fumaça sai e uma seta laranja mira o herói (0,7 s); dispara reto e
     explode no que bater (raio de 2 blocos). Se passar do herói, faz a curva e tenta mais uma vez.
   Arte: o pincel do 55 (cp, contorno, cache), rampas de 6 tons com luz de cima à esquerda; o neon são pixels claros
   por cima do escuro (drawTop) e brilhos pelo HOOK.drawGlow. Sons pelo sfx (nv2...).
   O 245 põe o nível e o spawn (embrulha spawnEnemy por fora); as bases e materiais vêm do 247 (filtrados).
   Prefixo de função e variável: nv2. */

/* ---------- números ---------- */
Object.assign(ET, {
  olhudos: { name: 'Olhudinho', w: 9, h: 8, hp: 30, dmg: 9, xp: 9, kb: 1.1, fly: false, touch: 1, blood: '#7dff3a' },
  astronauta: { name: 'Astronauta Perdido', w: 10, h: 22, hp: 280, dmg: 30, xp: 46, kb: 0.3, fly: false, blood: '#9aff5a' },
  cabecao: { name: 'Cabeção', w: 18, h: 18, hp: 200, dmg: 26, xp: 42, kb: 0.25, fly: true, blood: '#b88aff' },
  hipnotico: { name: 'Hipnotizador', w: 8, h: 26, hp: 70, dmg: 0, xp: 24, kb: 0.8, fly: false, blood: '#7dff3a' },
  foguete: { name: 'Foguete Errante', w: 9, h: 9, hp: 50, dmg: 28, xp: 22, kb: 0.5, fly: true, blood: '#ff9a2e' }
});
const NV2_TYPES = ['olhudos', 'astronauta', 'cabecao', 'hipnotico', 'foguete'];
// os materiais e as bases vêm do 247 (seção 8); filtradas agora e de novo a cada mundo
const NV2_DROPS = {
  olhudos: [['gosma_verde', 0.35], ['min_xenita', 0.04], ['pocao', 0.04]],
  astronauta: [['oxigenio', 0.6, 1, 2], ['chip_alien', 0.15], ['min_xenita', 0.08], ['pocao', 0.08], ['capacete_astronauta', 0.01]],
  cabecao: [['chip_alien', 0.45, 1, 2], ['cristal_plasma', 0.12], ['min_xenita', 0.1], ['pocao', 0.08]],
  hipnotico: [['chip_alien', 0.35], ['gosma_verde', 0.15], ['min_xenita', 0.07], ['pocao', 0.08]],
  foguete: [['chip_alien', 0.3], ['min_xenita', 0.06], ['pocao', 0.05]]
};
function nv2Tables() { for (const k of NV2_TYPES) DROPS[k] = NV2_DROPS[k].filter(([id]) => ITEMS[id]); }
nv2Tables();
Object.assign(NAV_WALKERS, { olhudos: 1, astronauta: 1, hipnotico: 1 });
if (typeof CV_STEP !== 'undefined') Object.assign(CV_STEP, { olhudos: 1, astronauta: 1, hipnotico: 1 });

const NV2_BLINK = 0.4, NV2_CROUCH = 0.8, NV2_LIFT = 1, NV2_V = 1, NV2_IGN = 0.7, NV2_HISS = 1;
const NV2_LUA = 0.55;                                   // quanto da gravidade o astronauta não sente
const NV2_WAVE_R = 4 * T, NV2_WAVE_T = 0.45, NV2_TANK_R = 2.5 * T, NV2_BOOM_R = 2 * T, NV2_HIP_R = 7 * T, NV2_HIP_T = 0.7;
const NV2_PULL = 3 * T, NV2_ROCK_SP = 200, NV2_ROCKET_SP = 240;

/* ================= arte ================= */
const NV2 = {};
{
const { cp, set } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const RN = {
  verde: R6(['#0c2606', '#1a460c', '#2c7214', '#46a01e', '#6ccc2e', '#a8f466']),      // os olhudinhos: verde-neon do adesivo
  branco: R6(['#4a5650', '#76847c', '#a4b2aa', '#cad6ce', '#e8f0ec', '#ffffff']),     // o branco dos olhos
  preto: R6(['#020206', '#05060c', '#0a0c16', '#121626', '#1e2438', '#38426a']),      // pupilas e olhos de vidro preto
  traje: R6(['#363a46', '#585e6c', '#7e8694', '#a8b0bc', '#ccd4dc', '#eef3f7']),      // o traje do astronauta
  luva: R6(['#22242a', '#363a42', '#4c525c', '#666e7a', '#86909c', '#a8b2bc']),
  visor: R6(['#010304', '#03080a', '#061012', '#0a1a1a', '#0e2824', '#163a30']),
  gosma: R6(['#1a4a0a', '#2e7414', '#4aa81e', '#7dff3a', '#b8ff7a', '#eaffc8']),
  cinza: R6(['#24262c', '#3a3c46', '#545862', '#72767f', '#9296a0', '#b6bac4']),      // o cabeção
  violeta: R6(['#1a0630', '#340c5c', '#561a8e', '#7c2ec6', '#a64dff', '#dcb0ff']),
  pele: R6(['#0e240c', '#1c3e18', '#2c6026', '#44863a', '#64ac50', '#92d276']),        // o hipnotizador: verde mais frio
  vermelho: R6(['#3a0606', '#680c0c', '#9c1614', '#cc2c1e', '#ee5636', '#ff9070']),   // o foguete
  metal: R6(['#181c22', '#2a3038', '#424a54', '#606a76', '#8a94a0', '#bac4ce']),
  ciano: R6(['#062a32', '#0c4a58', '#14788a', '#24b4c8', '#36f0ff', '#c4fcff']),
  rosa: R6(['#3a0626', '#6a0c46', '#a01a6a', '#d42a94', '#ff3ec8', '#ffa8e6']),
  fogo: R6(['#5a1a02', '#a03a04', '#e06a0a', '#ff9a2e', '#ffd23a', '#fff4b0'])
};
// elipse girada com luz de cima à esquerda; pick(u, v, x, y) devolve [rampa, ajuste] ou null (pula o pixel)
function ell(P, cx, cy, rx, ry, ang, R, s, base, pick) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - m); y <= cy + m; y++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
    const px = x + 0.5 - cx, py = y + 0.5 - cy, u = (px * ca + py * sa) / rx, v = (-px * sa + py * ca) / ry, d = u * u + v * v;
    if (d > 1) continue;
    let RR = R, dv = 0;
    if (pick) { const p = pick(u, v, x, y); if (!p) continue; RR = p[0]; dv = p[1]; }
    P.put(x, y, RR, base + 1 - (px / m * 0.8 + py / m) * 1.6 - d * 0.9 + cg(x, y, s) * 0.45 + dv);
  }
}
// um tubo afinando de (x0, y0, r0) a (x1, y1, r1): braços e pernas fofos do traje, o pescoço
function tubo(P, x0, y0, x1, y1, r0, r1, R, base, s) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * t;
    for (let oy = -r; oy <= r + 0.01; oy += 0.5) for (let ox = -r; ox <= r + 0.01; ox += 0.5) {
      if (ox * ox + oy * oy > r * r + 0.05) continue;
      P.put(x + ox, y + oy, R, base - (oy / Math.max(0.5, r)) * 1.2 - (ox / Math.max(0.5, r)) * 0.6 + cg(x + ox | 0, y + oy | 0, s) * 0.35);
    }
  }
}
// um olho redondo de bolinha: o branco, a pupila preta olhando para a frente e o brilho
function olhinho(P, x, y, r, s, closed, look = 0.7) {
  for (let yy = Math.floor(y - r - 1); yy <= y + r + 1; yy++) for (let xx = Math.floor(x - r - 1); xx <= x + r + 1; xx++) {
    const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
    if (d > r + 0.6) continue;
    if (d > r - 0.35) { P.put(xx, yy, RN.verde, 0.6); continue; }   // a borda funda em volta do olho
    if (closed) { P.put(xx, yy, RN.verde, yy + 0.5 < y ? 4 : yy + 0.5 < y + 0.9 ? 1 : 3); continue; }   // pálpebra, a linha dos cílios
    P.put(xx, yy, RN.branco, 4.6 - (yy + 0.5 - y) / r * 1.4 - (xx + 0.5 - x) / r * 0.5);
  }
  if (closed) return;
  const px = x + look * r * 0.4, py = y + 0.3, big = r >= 2.2;
  for (const [ox, oy] of big ? [[0, 0], [-1, 0], [0, -1], [-1, -1]] : [[0, 0], [0, -1]]) P.put(px + ox, py + oy, RN.preto, oy ? 2 : 0);
  if (big) P.put(px - 1, py - 1, RN.branco, 5);   // o brilho na pupila
}

/* ---------- o olhudinho, 15 x 13 de frente para a direita ----------
   0-1 respirando, 2 os olhos fechados, 3 o pulo (esticado, boca aberta), 4 agachado (antes do pulo e na queda) */
function olhudo(k) {
  const P = cp(18, 15), s = 24401 + k * 7, sq = k === 4 ? 1 : k === 3 ? -1 : k === 1 ? 0.35 : 0;
  const cx = 8.6, rx = 6.4 + sq * 0.9, ry = 4.6 - sq * 0.9, cy = 13.4 - ry - (k === 3 ? 1.4 : 0.6);
  // os tentáculos: quatro pontas enroladas embaixo; no pulo ficam penduradas
  for (let i = 0; i < 4; i++) {
    const x0 = cx - 3.9 + i * 2.6, side = i < 2 ? -1 : 1, by = cy + ry - 1.2;
    if (k === 3) { P.line(x0, by, x0 - side * 0.6, 14.2, RN.verde, 1.6); P.put(x0 - side * 1.3, 14.4, RN.verde, 2.4); }
    else { P.line(x0, by, x0 + side * 0.9, 13.8, RN.verde, 1.8); P.put(x0 + side * 1.8, 13.4, RN.verde, 2.8); P.put(x0 + side * 2.2, 12.8, RN.verde, 3.4); }
  }
  // o corpo de gelatina: pintinhas mais escuras, a barriga mais clara, um reflexo em cima
  P.blob(cx, cy, rx, ry, RN.verde, s, 2.5, (x, y, dx, dy) => (hash2(x, y, s) < 0.09 ? -0.9 : 0) + (dy > 0.45 && Math.abs(dx) < 0.6 ? 0.5 : 0));
  // os três olhos saltados por cima, o do meio maior e mais alto
  const closed = k === 2, ey = cy - ry * 0.55;
  olhinho(P, cx - 4, ey + 1, 2.05, s + 1, closed, 0.1);
  olhinho(P, cx + 5.2, ey + 1, 2.05, s + 3, closed, 0.1);
  olhinho(P, cx + 0.6, ey - 0.7, 2.6, s + 2, closed);
  P.put(cx - rx * 0.75, cy - ry * 0.1, RN.verde, 5);
  // a boca: um risco; no pulo, aberta com dois dentinhos
  const my = cy + ry * 0.45;
  if (k === 3) { for (let x = cx - 1.4; x <= cx + 3; x++) { P.put(x, my + 0.6, RN.preto, 1); P.put(x, my + 1.4, RN.preto, 0); } P.put(cx - 0.6, my + 0.6, RN.branco, 5); P.put(cx + 2.2, my + 0.6, RN.branco, 5); }
  else { P.line(cx + 0.4, my, cx + 2.8, my - 0.3, RN.verde, 0.2); P.put(cx + 3.2, my - 0.9, RN.verde, 0.6); }
  return set(P.done());
}

/* ---------- o astronauta perdido, 20 x 27 de frente para a direita ----------
   0-3 andando, 4 agachado (o aviso), 5 no ar (braços para cima, pernas dobradas), 6 a queda (agachado largo) */
function astronauta(k) {
  const P = cp(20, 27), s = 24431 + k * 9, walk = k < 4 ? [0, 1, 0, -1][k] : 0;
  const low = k === 4 ? 3 : k === 6 ? 4 : k === 5 ? -1 : (k === 1 || k === 3 ? 0.6 : 0), by = 26;
  const hipY = 17.6 + low, hx = 10.2;
  // a perna de longe (na sombra)
  if (k === 5) { tubo(P, hx - 1, hipY, hx - 3, hipY + 3.6, 1.9, 1.7, RN.traje, 1.8, s); tubo(P, hx - 3, hipY + 3.6, hx - 2, hipY + 6.2, 1.7, 1.6, RN.luva, 1.6, s); }
  else if (low >= 3) { tubo(P, hx - 1, hipY, hx - 4.4, by - 4.6, 1.9, 1.8, RN.traje, 1.8, s); tubo(P, hx - 4.4, by - 4.6, hx - 4.2, by - 1, 1.8, 1.6, RN.traje, 1.6, s); P.blob(hx - 3.8, by - 0.6, 2.2, 1.3, RN.luva, s, 1.8); }
  else { const fx = hx - 1 - walk * 2.4; tubo(P, hx - 1, hipY, fx, by - 2, 2, 1.8, RN.traje, 1.8, s); P.blob(fx + 0.4, by - 0.8, 2.3, 1.3, RN.luva, s, 1.8); }
  // o braço de longe
  if (k === 5) tubo(P, 9, 10.4 + low, 6.8, 4.6 + low, 1.6, 1.4, RN.traje, 1.6, s + 1);
  else tubo(P, 9, 10.6 + low, 7.6 - walk, 16 + low, 1.7, 1.5, RN.traje, 1.6, s + 1);
  // o tanque de oxigênio nas costas: cilindro claro com faixa e a válvula vermelha
  for (let y = Math.floor(8.4 + low); y <= 17 + low; y++) for (let x = 2; x <= 6; x++) {
    const u = (x - 2) / 4, top = y < 9.4 + low || y > 16 + low;
    if (top && (x === 2 || x === 6)) continue;
    P.put(x, y, RN.metal, 4.4 - Math.abs(u - 0.3) * 3.4 - (y > 15 + low ? 0.8 : 0) + (Math.abs(y - (12.6 + low)) < 0.6 ? -1.6 : 0) + cg(x, y, s + 2) * 0.4);
  }
  P.put(4, 7.6 + low, RN.vermelho, 3); P.put(3.4, 7.2 + low, RN.vermelho, 5); P.put(5, 7.4 + low, RN.metal, 3);
  // a mangueira do tanque ao capacete
  P.line(5.4, 9 + low, 6.6, 7.4 + low, RN.luva, 2.4); P.line(6.6, 7.4 + low, 7.6, 7.2 + low, RN.luva, 3);
  // o tronco fofo e o painel do peito (luzinhas)
  ell(P, 10.4, 13.4 + low, 4.3, 4.9, 0, RN.traje, s + 3, 3.1, (u, v) => [RN.traje, Math.abs(v - 0.15) < 0.12 ? -0.9 : 0]);
  for (let y = Math.floor(11.6 + low); y <= 13.6 + low; y++) for (let x = 11.6; x <= 14; x++) P.put(x, y, RN.luva, 2.2);
  P.put(12, 12 + low, RN.vermelho, 5); P.put(13, 12 + low, RN.ciano, 5); P.put(12, 13 + low, RN.gosma, 4); P.put(13, 13 + low, RN.fogo, 4);
  // a bandeirinha costurada no ombro (um borrão azul e vermelho)
  P.put(8.6, 11 + low, RN.vermelho, 3); P.put(9.4, 11 + low, RN.ciano, 2);
  // a perna de perto
  if (k === 5) { tubo(P, hx + 1.4, hipY, hx + 3.6, hipY + 2.6, 2, 1.8, RN.traje, 2.8, s + 4); tubo(P, hx + 3.6, hipY + 2.6, hx + 2.6, hipY + 5.6, 1.8, 1.6, RN.traje, 2.6, s + 4); P.blob(hx + 3, hipY + 6.2, 2.2, 1.3, RN.luva, s + 4, 2.6); }
  else if (low >= 3) { tubo(P, hx + 1.4, hipY, hx + 4.8, by - 4.8, 2, 1.9, RN.traje, 2.8, s + 4); tubo(P, hx + 4.8, by - 4.8, hx + 4.4, by - 1.2, 1.9, 1.7, RN.traje, 2.6, s + 4); P.blob(hx + 5.2, by - 0.7, 2.4, 1.3, RN.luva, s + 4, 2.6); }
  else { const fx = hx + 1.4 + walk * 2.4; tubo(P, hx + 1.4, hipY, fx, by - 2, 2.1, 1.9, RN.traje, 2.8, s + 4); P.blob(fx + 0.8, by - 0.8, 2.4, 1.3, RN.luva, s + 4, 2.6); }
  // o capacete: a bola branca, o visor escuro com a gosma verde acesa lá dentro e o reflexo
  const hy = 5.6 + low * 0.9;
  P.blob(11.2, hy, 4.9, 4.9, RN.traje, s + 5, 3.1);
  ell(P, 13.1, hy + 0.4, 3.1, 3, 0, RN.visor, s + 6, 2.6, (u, v, x, y) => {
    if (v > 0.15 && hash2(x, y, s + 7) < 0.75) return [RN.gosma, 0.6 + v * 1.6];   // a gosma no fundo do visor
    if (v > -0.25 && v <= 0.15 && hash2(x, y, s + 8) < 0.25) return [RN.gosma, -1.2];  // um fio dela subindo
    return [RN.visor, 0];
  });
  P.put(12.1, hy - 1.6, RN.branco, 5); P.put(12.9, hy - 2.2, RN.branco, 4); P.put(14.8, hy - 1, RN.traje, 4);
  P.put(16, hy + 0.4, RN.traje, 3.6);   // a borda do visor
  // o braço de perto (com a luva cinza)
  if (k === 5) { tubo(P, 11.6, 10.6 + low, 14.2, 4.4 + low, 1.8, 1.6, RN.traje, 3, s + 9); P.blob(14.6, 3.6 + low, 1.6, 1.6, RN.luva, s + 9, 2.8); }
  else if (k === 4) { tubo(P, 11.4, 10.8 + low, 8.6, 15.8 + low, 1.8, 1.6, RN.traje, 3, s + 9); P.blob(8.2, 16.6 + low, 1.6, 1.5, RN.luva, s + 9, 2.6); }
  else if (k === 6) { tubo(P, 11.6, 10.8 + low, 15.6, 13.6 + low, 1.8, 1.6, RN.traje, 3, s + 9); P.blob(16.4, 14 + low, 1.6, 1.5, RN.luva, s + 9, 2.6); }
  else { const hx2 = 12.8 + walk * 1.2; tubo(P, 11.6, 10.8 + low, hx2, 16 + low, 1.8, 1.6, RN.traje, 3, s + 9); P.blob(hx2 + 0.2, 16.8 + low, 1.6, 1.5, RN.luva, s + 9, 2.6); }
  return set(P.done());
}
// o tanque solto (quando o astronauta morre), 11 x 6 deitado
function tanque() {
  const P = cp(11, 6), s = 24481;
  for (let y = 0; y < 6; y++) for (let x = 1; x < 10; x++) { if ((y === 0 || y === 5) && (x === 1 || x === 9)) continue; P.put(x, y, RN.metal, 4.6 - Math.abs(y - 1.6) * 0.9 + (x === 5 ? -1.6 : 0) + cg(x, y, s) * 0.4); }
  P.put(0, 2, RN.vermelho, 3); P.put(0, 3, RN.vermelho, 2); P.put(10, 3, RN.metal, 2);
  return set(P.done());
}

/* ---------- o cabeção, 28 x 26 de frente para a direita (três quartos) ----------
   0 parado, 1 os olhos acesos de violeta (a telecinese) */
function cabecao(k) {
  const P = cp(28, 26), s = 24501 + k * 5, cast = k === 1;
  // o crânio enorme afinando até o queixo pequeno (o queixo puxa para o lado de onde ele olha)
  for (let y = 0; y < 25; y++) {
    let hw, c;
    if (y <= 11) { const t = (y - 10.6) / 10.2; hw = 11 * Math.sqrt(Math.max(0, 1 - t * t)); c = 13.6; }
    else { const t = (y - 11) / 13; hw = 11 * Math.pow(Math.max(0, 1 - t), 0.85) * (1 - t * 0.25); c = 13.6 + (y - 11) * 0.2; }
    for (let x = Math.floor(c - hw); x <= c + hw; x++) {
      const dx = (x + 0.5 - c) / Math.max(1, hw), dy = (y - 11) / 13;
      // dobras do cérebro no alto da cabeça e uma veia na têmpora
      const fold = y < 9 && Math.abs(Math.sin(x * 0.75 + y * 0.45 + Math.sin(y * 0.9 + x * 0.2) * 1.6)) < 0.2 ? -1.4 : 0;
      const vein = Math.abs(y - (9 + Math.sin(x * 0.7) * 1.2)) < 0.5 && x > c + 4 && x < c + 9 ? -0.7 : 0;
      P.put(x, y, RN.cinza, 3 - dx * 1.1 - dy * 1.3 - dx * dx * 0.8 + fold + vein + cg(x, y, s) * 0.5);
    }
  }
  // os olhos: amêndoas enormes de vidro preto, inclinadas; o de perto maior
  const eye = (x, y, rx, ry, a, sx) => ell(P, x, y, rx, ry, a, cast ? RN.violeta : RN.preto, s + sx, cast ? 2 : 1.6, (u, v) => [cast ? RN.violeta : RN.preto, (v > 0.3 ? 0.6 : 0) - (u * u) * 0.6]);
  eye(19.4, 13.6, 5.6, 3.1, -0.5, 1);
  eye(9.2, 13.4, 4.4, 2.8, 0.55, 2);
  // o brilho do vidro: um reflexo branco em cima, um ciano embaixo
  for (const [x, y, v] of [[16.8, 11.8, 5], [17.8, 11.2, 5], [18.8, 10.8, 4], [22.6, 15.4, 3], [21.8, 15.8, 3], [7.8, 11.8, 5], [8.8, 11.4, 4], [11.2, 15, 3]]) P.put(x, y, v === 3 ? (cast ? RN.violeta : RN.ciano) : RN.branco, v);
  // o nariz (dois furinhos) e a boca (um risco)
  P.put(16.6, 18.4, RN.cinza, 0.6); P.put(18, 18.2, RN.cinza, 0.6);
  P.line(15.6, 20.8, 18.2, 20.5, RN.cinza, 0.4);
  // o toco do pescoço sumindo
  for (let y = 23; y < 26; y++) for (let x = 15; x <= 18; x++) if (hash2(x, y, s) < 0.9 - (y - 23) * 0.3) P.put(x, y, RN.cinza, 1.6 - (y - 23) * 0.4);
  return set(P.done());
}
// o destroço que ele levanta: um pedaço de chapa do casco com um filete verde aceso, 9 x 7
function destroco() {
  const P = cp(9, 7), s = 24521;
  for (let y = 0; y < 7; y++) for (let x = 0; x < 9; x++) {
    const d = Math.abs(x - 4.2) / 4.4 + Math.abs(y - 3.2) / 3.6; if (d > 1.15 || hash2(x, y, s) < (d > 0.9 ? 0.5 : 0)) continue;
    P.put(x, y, RN.metal, 3.4 - (x - 4) * 0.25 - (y - 3) * 0.4 + cg(x, y, s) * 0.8 + (x === 6 ? -1.4 : 0));
  }
  P.line(1.6, 4.2, 6.2, 2.6, RN.gosma, 4); P.put(2, 2, RN.metal, 5);
  return set(P.done());
}

/* ---------- o hipnotizador, 18 x 34 de frente para a direita ----------
   0-1 andando, 2 parado, 3 o sinal de paz (a mão em V lá no alto), 4 fugindo (inclinado, braços para trás) */
function hipnotico(k) {
  const P = cp(21, 34), s = 24541 + k * 7, step = k === 0 ? 1 : k === 1 ? -1 : 0, run = k === 4, lean = run ? 1.6 : 0;
  const R = RN.pele;
  // as pernas finas
  tubo(P, 8.4, 25, 7.6 - step * 1.6 - (run ? 2 : 0), 32.4, 0.9, 0.8, R, 1.6, s);
  tubo(P, 9.6, 25, 10.4 + step * 1.6 + (run ? 2 : 0), 32.4, 0.9, 0.8, R, 2.6, s + 1);
  P.put(10.8 + step * 1.6 + (run ? 2 : 0), 33, R, 2.4); P.put(8 - step * 1.6 - (run ? 2 : 0), 33, R, 1.4);
  // o braço de longe
  tubo(P, 8.4, 19.4, run ? 5 : 7.2, run ? 23 : 25, 0.8, 0.7, R, 1.4, s + 2);
  // o corpinho em pera, a barriga mais clara
  ell(P, 9 + lean * 0.3, 21.6, 2.9, 4.2, 0, R, s + 3, 2.6, (u, v) => [R, v > 0.2 && u > -0.3 ? 0.6 : 0]);
  // o pescoço comprido com anéis
  for (let i = 0; i <= 18; i++) { const t = i / 18, x = 9.6 + lean * 0.5 + t * (1 + lean), y = 18.4 - t * 8.4; P.put(x, y, R, 2.6 + (i % 4 === 0 ? -1 : 0)); P.put(x + 1, y, R, 3.6 + (i % 4 === 0 ? -1 : 0)); }
  // a cabeça: oval grande, queixo fino, os olhos pretos de amêndoa e duas anteninhas de ponta rosa
  const hx = 11.2 + lean * 1.4, hy = 6.4;
  ell(P, hx, hy, 4.4, 4.8, 0.15, R, s + 4, 2.9, (u, v) => (v > 0.55 && Math.abs(u) > 0.6 - (v - 0.55) ? null : [R, 0]));
  ell(P, hx + 2.3, hy + 0.6, 1.9, 1.1, -0.45, RN.preto, s + 5, 1.6);
  ell(P, hx - 1.4, hy + 0.7, 1.4, 0.9, 0.4, RN.preto, s + 6, 1.4);
  P.put(hx + 1.6, hy + 0.2, RN.branco, 5); P.put(hx - 1.8, hy + 0.3, RN.branco, 3);
  P.put(hx + 1.6, hy + 3.2, R, 0.8); P.put(hx + 2.4, hy + 3, R, 0.8);   // a boca, um sorriso de canto
  P.line(hx - 0.6, hy - 4.4, hx - 1.8, hy - 6.6, R, 2.4); P.put(hx - 2, hy - 7.2, RN.rosa, 5);
  P.line(hx + 1.4, hy - 4.4, hx + 2.6, hy - 6.4, R, 3.4); P.put(hx + 2.8, hy - 7, RN.rosa, 5);
  // o braço de perto: no V, levantado com dois dedos abertos
  if (k === 3) { tubo(P, 10.2, 19.2, 14.6, 16.4, 0.9, 0.8, R, 3.2, s + 7); tubo(P, 14.6, 16.4, 17.4, 11.6, 0.8, 0.8, R, 3.4, s + 7); P.blob(17.6, 11, 1.1, 1.1, R, s + 8, 3.4); P.line(17.2, 10.4, 16.6, 7.2, R, 4.4); P.line(18.2, 10.4, 19.8, 7.6, R, 4.4); P.put(16.6, 6.8, R, 5); P.put(19.9, 7.2, R, 5); P.put(18.4, 11.6, R, 1.6); }
  else if (run) tubo(P, 10, 19.4, 6.6, 22.6, 0.9, 0.8, R, 3, s + 7);
  else tubo(P, 10.2, 19.4, 10.6 + step * 0.8, 25.2, 0.9, 0.8, R, 3, s + 7);
  return set(P.done());
}

/* ---------- o foguete errante, 13 x 22 com o nariz para cima ----------
   0 dormindo (a pálpebra da escotilha meio fechada), 1 acordado (o olho na escotilha) */
function foguete(k) {
  const P = cp(13, 22), s = 24571 + k * 5, cx = 6.5;
  // as aletas: duas dos lados e uma no meio, vermelho-escuro
  for (const sd of [-1, 1]) { for (let i = 0; i <= 10; i++) { const t = i / 10, x = cx + sd * (3.6 + t * 2.4), y = 12.4 + t * 6; P.put(x, y, RN.vermelho, 1.6 + (sd < 0 ? 0.8 : 0)); P.put(x - sd, y + 0.4, RN.vermelho, 2.2 + (sd < 0 ? 0.6 : 0)); } P.line(cx + sd * 3.4, 18.6, cx + sd * 6, 18.6, RN.vermelho, 1.2); }
  P.line(cx, 16, cx, 20, RN.vermelho, 1);
  // o bocal de metal
  for (let y = 16; y <= 19; y++) { const hw = 1.6 + (y - 16) * 0.5; for (let x = Math.floor(cx - hw); x <= cx + hw; x++) P.put(x, y, RN.metal, 3.2 - (x - cx) * 0.5 - (y === 19 ? 1.6 : 0)); }
  // o corpo: cilindro vermelho (claro à esquerda), o nariz redondo e uma faixa branca
  for (let y = 1; y <= 16; y++) {
    const hw = y < 6 ? 4 * Math.sqrt(Math.max(0, 1 - ((6 - y) / 5.2) ** 2)) : 4 - Math.max(0, y - 14) * 0.6;
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const u = (x + 0.5 - cx) / Math.max(1, hw);
      const band = y === 13 || y === 14;
      P.put(x, y, band ? RN.traje : RN.vermelho, 3.4 - (u + 0.35) * (u + 0.35) * 1.6 - (y < 3 ? -0.4 : 0) + cg(x, y, s) * 0.4 + (band ? 0.6 : 0));
    }
  }
  P.put(cx - 1.6, 3, RN.vermelho, 5); P.put(cx - 2.2, 5, RN.vermelho, 5);   // o brilho do nariz
  // a escotilha: aro de metal, vidro ciano, o olho preto dentro
  ell(P, cx, 9, 2.6, 2.6, 0, RN.metal, s + 1, 3.2);
  ell(P, cx, 9, 1.7, 1.7, 0, RN.ciano, s + 2, 2.6);
  if (k === 1) { P.put(cx + 0.4, 9.2, RN.preto, 0); P.put(cx + 0.4, 8.4, RN.preto, 1); P.put(cx - 0.8, 8.2, RN.branco, 5); }
  else { for (let x = cx - 1.6; x <= cx + 1.6; x++) { P.put(x, 8.2, RN.vermelho, 2.6); P.put(x, 9, RN.vermelho, 1.6); } P.put(cx, 9.8, RN.preto, 1); }
  // rebites
  for (const y of [6.4, 11.6]) P.put(cx + 3, y, RN.metal, 4);
  return set(P.done());
}
NV2.get = () => NV2.ready || (NV2.ready = {
  olh: [0, 1, 2, 3, 4].map(olhudo),
  ast: [0, 1, 2, 3, 4, 5, 6].map(astronauta), tanque: tanque(),
  cab: [0, 1].map(cabecao), pedra: destroco(),
  hip: [0, 1, 2, 3, 4].map(hipnotico),
  fog: [0, 1].map(foguete)
});
NV2.GL = { verde: glow(4, '#7dff3a'), verdeG: glow(10, '#7dff3a'), violeta: glow(6, '#a64dff'), violetaG: glow(14, '#a64dff'),
  laranja: glow(6, '#ff9a2e'), fogo: glow(10, '#ffb04a'), boom: glow(30, '#ffb04a'), rosa: glow(5, '#ff3ec8'), ciano: glow(4, '#36f0ff'), vermelho: glow(4, '#ff3b3b') };
}

/* ================= desenho ================= */
function nv2Foot(img, fx, fy, j = 0, oy = 0) { lc.drawImage(img, Math.round(fx - img.width / 2 + j), Math.round(fy - img.height + 1 + oy)); }
const nv2Jit = (e, on, k = 50) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;

DRAW_E.olhudos = (e, fx, fy, fl) => {
  const S = NV2.get().olh, st = e.state;
  let k = Math.floor(e.t * 2.4 + e.seed) % 2;
  if (st === 'blink') k = e.stateT < 0.1 ? 4 : (Math.floor((NV2_BLINK - e.stateT) * 12) % 2 ? 0 : 2);
  else if (st === 'hop') k = e.vy < 40 ? 3 : 4;
  else if (!e.onGround) k = 3;
  nv2Foot(cvPick(S[k], e, fl), fx, fy, nv2Jit(e, st === 'blink' && e.stateT < 0.15, 60), 1);
};
EYES_E.olhudos = (e, fx, fy) => {
  if (e.state !== 'blink') return;
  lc.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(e.t * 26)); lc.drawImage(NV2.GL.verde, fx + e.facing * 1 - 4, fy - 9);
};
WARN_E.olhudos = e => e.state === 'blink';

const nv2AstPose = e => e.state === 'crouch' ? 4 : e.state === 'leap' ? 5 : e.state === 'land' ? 6 : !e.onGround ? 5 : Math.abs(e.vx) > 3 ? Math.floor(e.t * 5) % 4 : 0;
DRAW_E.astronauta = (e, fx, fy, fl) => { const k = nv2AstPose(e); nv2Foot(cvPick(NV2.get().ast[k], e, fl), fx, fy, nv2Jit(e, e.state === 'crouch' && e.stateT < 0.4, 46), 1); };
// o visor: a gosma lá dentro sempre brilha um pouco; agachado, acende forte
const nv2Visor = (e, fx, fy) => { const k = nv2AstPose(e), low = k === 4 ? 3 : k === 6 ? 4 : k === 5 ? -1 : 0; return [fx + e.facing * 3, fy - 27 + 6.4 + low * 0.9]; };
EYES_E.astronauta = (e, fx, fy) => {
  const [x, y] = nv2Visor(e, fx, fy), on = e.state === 'crouch' ? clamp(1 - e.stateT / NV2_CROUCH, 0, 1) : 0;
  lc.globalAlpha = 0.2 + 0.08 * Math.sin(e.t * 3) + on * 0.6; lc.drawImage(on > 0.2 ? NV2.GL.verdeG : NV2.GL.verde, Math.round(x) - (on > 0.2 ? 10 : 4), Math.round(y) - (on > 0.2 ? 10 : 4));
};
WARN_E.astronauta = e => e.state === 'crouch';

DRAW_E.cabecao = (e, fx, fy, fl) => {
  const B = NV2.get(), cast = e.state === 'lift', img = cvPick(B.cab[cast ? 1 : 0], e, fl), bob = Math.round(Math.sin(e.t * 2 + e.seed) * 1.2);
  lc.drawImage(img, Math.round(fx - img.width / 2 + nv2Jit(e, cast && e.stateT < 0.4, 40)), Math.round(fy - e.h / 2 - img.height / 2 + bob - 1));
};
EYES_E.cabecao = (e, fx, fy) => {
  const cast = e.state === 'lift' || e.state === 'pull', bob = Math.round(Math.sin(e.t * 2 + e.seed) * 1.2), y = fy - e.h / 2 + bob + 1;
  lc.globalAlpha = cast ? 0.55 + 0.3 * Math.abs(Math.sin(e.t * 18)) : 0.12;
  for (const ox of [5.5, -4]) lc.drawImage(NV2.GL.violeta, Math.round(fx + e.facing * ox) - 6, Math.round(y) - 6);
};
WARN_E.cabecao = e => e.state === 'lift';

const nv2HipPose = e => e.state === 'cast' ? 3 : e.state === 'flee' ? 4 : e.onGround && Math.abs(e.vx) > 4 ? Math.floor(e.t * 6) % 2 : 2;
DRAW_E.hipnotico = (e, fx, fy, fl) => nv2Foot(cvPick(NV2.get().hip[nv2HipPose(e)], e, fl), fx, fy, 0, 1);
// a mão do V (onde os anéis nascem)
const nv2Hand = e => [e.x + e.w / 2 + e.facing * 8, e.y + e.h - 33 + 8];
EYES_E.hipnotico = (e, fx, fy) => {
  lc.globalAlpha = 0.3 + 0.15 * Math.sin(e.t * 5); for (const ox of [-2.5, 2.5]) lc.drawImage(NV2.GL.rosa, Math.round(fx + e.facing * 3 + ox) - 5, fy - 40);
  if (e.state === 'cast') { const k = clamp(1 - e.stateT / NV2_V, 0, 1); lc.globalAlpha = 0.3 + 0.5 * k; lc.drawImage(NV2.GL.rosa, Math.round(fx + e.facing * 8) - 5, fy - 25 - 5); }
};
WARN_E.hipnotico = e => e.state === 'cast';

// o foguete: centro do desenho, o ângulo do nariz
DRAW_E.foguete = (e, fx, fy, fl) => {
  const S = NV2.get().fog[e.state === 'sleep' ? 0 : 1], j = e.state === 'ignite' ? rnd(-0.8, 0.8) : 0;
  cvRot(fl ? S.wr : S.r, Math.round(fx + j), Math.round(fy - e.h / 2 + j), (e.ang ?? -Math.PI / 2) + Math.PI / 2);
};
EYES_E.foguete = (e, fx, fy) => {
  const a = e.ang ?? -Math.PI / 2, cx = fx, cy = fy - e.h / 2;
  // a escotilha (2 px à frente do centro) e a chama (10 px atrás)
  lc.globalAlpha = e.state === 'sleep' ? 0.12 : 0.4; lc.drawImage(NV2.GL.ciano, Math.round(cx + Math.cos(a) * 1.5) - 4, Math.round(cy + Math.sin(a) * 1.5) - 4);
  if (e.state !== 'sleep' && e.state !== 'seek') { const f = e.state === 'ignite' ? 0.35 + 0.3 * clamp(1 - e.stateT / NV2_IGN, 0, 1) : 0.85; lc.globalAlpha = f * (0.8 + 0.2 * Math.sin(e.t * 40)); lc.drawImage(NV2.GL.fogo, Math.round(cx - Math.cos(a) * 12) - 10, Math.round(cy - Math.sin(a) * 12) - 10); }
};
WARN_E.foguete = e => e.state === 'ignite';

/* ================= comportamento ================= */
const nv2Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const nv2Ang = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const nv2Groups = [], nv2Waves = [], nv2Tanks = [], nv2Rocks = [], nv2Rings = [], nv2Blasts = [];
let nv2Grouping = false, nv2PullBy = null, nv2PullLeft = 0;
function nv2Spark(x, y, n, cols, sp = 50, g = 60, life = 0.6) {
  if (parts.length > 640) return;
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = sp * (0.3 + Math.random() * 0.8); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.2, g, life: life * (0.6 + Math.random() * 0.6), max: life, col: cols[i % cols.length], size: 1, glow: true }); }
}
function nv2Smoke(x, y, n, vx = 0, vy = -14) {
  if (parts.length > 640) return;
  for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-1.5, 1.5), y: y + rnd(-1.5, 1.5), vx: vx + rnd(-8, 8), vy: vy + rnd(-6, 4), g: -6, life: rnd(0.6, 1.1), max: 1.1, col: Math.random() < 0.5 ? '#8a8e96' : '#5a5e66', size: 1, smoke: true });
}
// o chão logo abaixo de (x, y) em pixels (a linha de cima do bloco), até max blocos
function nv2Floor(x, y, max = 12) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 0; k < max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T; return null; }
// ar livre acima da cabeça de e (px, até max blocos)
function nv2Room(e, max = 9) { const x0 = Math.floor((e.x + 1) / T), x1 = Math.floor((e.x + e.w - 1) / T), ty = Math.floor(e.y / T); for (let k = 1; k <= max; k++) for (let x = x0; x <= x1; x++) if (solidAt(x, ty - k)) return (k - 1) * T + (e.y - ty * T); return max * T; }

/* ---------- os olhudinhos: o grupo pisca e pula junto ---------- */
AI.olhudos = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.nvAggro = aggro;
  if (e.state === 'blink') { e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing; return; }
  if (e.state === 'hop') {
    e.airT = (e.airT || 0) + dt;
    if (e.onGround && e.airT > 0.12) { e.state = 'walk'; e.vx *= 0.3; if (nv2Near(e) > 0.1) sfx.nv2Splat(nv2Near(e)); burst(e.x + e.w / 2, e.y + e.h, 3, '#46a01e', 30, 300, 0.3); }
    return;
  }
  e.state = 'walk';
  let dir = 0, chase = false, sp = 30 + e.lvl * 0.6;
  if (aggro) {
    // espera o pulo do grupo a uns 2 a 4 blocos, rodeando; longe, segue o caminho
    const adx = Math.abs(dx), want = 28 + (e.seed % 1) * 22;
    if (adx > want + 10 || !e.sees) { dir = Math.sign(dx); chase = true; }
    else if (adx < want - 10) dir = -Math.sign(dx);
    else { e.dz = (e.dz || 0) - dt; if (e.dz <= 0) { e.dz = 0.4 + Math.random() * 0.5; e.dzDir = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); } dir = e.dzDir || 0; sp *= 0.5; }
  } else { cvWander(e, dt); dir = e.wander; sp = 18; }
  if (dir && !chase && solidAt(Math.floor((dir > 0 ? e.x + e.w + 2 : e.x - 2) / T), Math.floor((e.y + e.h - 2) / T))) dir = 0;   // parede atrás: fica
  walk(e, dt, dir, sp, 400, chase ? 230 : 0, dy, chase);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  // anda aos pulinhos
  if (e.onGround && dir && Math.random() < dt * 3) { e.vy = -95 - Math.random() * 40; }
  e.chirpT = (e.chirpT ?? Math.random() * 3) - dt;
  if (e.chirpT <= 0) { e.chirpT = 1.6 + Math.random() * 2.6; const v = nv2Near(e, 200); if (v > 0.05) sfx.nv2Chirp(v); }
};
// a cada quadro: quem do grupo está perto o bastante faz todo mundo piscar; 0,4 s depois o grupo inteiro pula
function nv2GroupTick(G, dt) {
  G.m = G.m.filter(o => !o.dead && enemies.includes(o));
  if (!G.m.length) return false;
  if (G.ph === 'blink') {
    G.t -= dt;
    if (G.t <= 0) {
      G.ph = 'idle'; G.cd = 2.2 + Math.random() * 1.4;
      for (const o of G.m) if (o.state === 'blink') nv2Hop(o);
      if (G.m.some(o => nv2Near(o) > 0.05)) sfx.nv2Hop(Math.max(...G.m.map(o => nv2Near(o))));
    }
    return true;
  }
  G.cd -= dt;
  if (G.cd > 0 || pl.dead) return true;
  const go = G.m.find(o => o.nvAggro && o.sees && o.onGround && o.stun <= 0 && Math.abs(pl.x - o.x) < 70 && Math.abs(pl.y + pl.h - o.y - o.h) < 40);
  if (!go) return true;
  G.ph = 'blink'; G.t = NV2_BLINK;
  for (const o of G.m) if (o.onGround && o.stun <= 0 && o.state !== 'hop' && Math.hypot(o.x - go.x, o.y - go.y) < 10 * T) { o.state = 'blink'; o.stateT = NV2_BLINK; }
  sfx.nv2Blink(nv2Near(go));
  return true;
}
// o pulo: um arco que cai onde o herói está agora (um pouco espalhado)
function nv2Hop(e) {
  const ex = e.x + e.w / 2, ey = e.y + e.h, tx = pl.x + pl.w / 2 + rnd(-10, 10), ty = pl.y + pl.h, v0 = 250, d = ty - ey;
  const disc = v0 * v0 + 2 * GRAV * d, t = disc > 0 ? (v0 + Math.sqrt(disc)) / GRAV : 0.5;
  e.vy = -v0; e.vx = clamp((tx - ex) / Math.max(0.3, t), -200, 200); e.onGround = false; e.state = 'hop'; e.airT = 0; e.atkCD = 0;
  e.facing = Math.sign(e.vx) || e.facing;
}

/* ---------- o astronauta perdido ---------- */
AI.astronauta = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (!e.onGround) e.vy -= GRAV * NV2_LUA * dt;   // a lua: a gravidade que sobra é 45%
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'crouch') {   // agacha, o visor acende verde; mira até o último instante
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.15) { e.tgX = pcx; e.tgY = pl.y + pl.h; }
    if (Math.random() < dt * 10) nv2Spark(ecx + e.facing * 3, e.y + 6, 1, ['#7dff3a', '#b8ff7a'], 14, -10, 0.5);
    if (e.stateT <= 0) nv2Leap(e);
    return;
  }
  if (e.state === 'leap') {
    e.airT += dt;
    // cair em cima do herói machuca (o pé no peito)
    if (!e.swingHit && e.vy > 0 && !pl.dead && overlap({ x: e.x - 2, y: e.y + e.h - 8, w: e.w + 4, h: 10 }, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.onGround && e.airT > 0.15) nv2Land(e);
    else if (e.airT > 3) { e.state = 'walk'; e.atkCD = 1.5; }
    return;
  }
  if (e.state === 'land') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 16 ? 0 : Math.sign(dx); else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 20 + e.lvl * 0.4 : 12, 260, 250, dy, aggro);
  if (dir) e.facing = dir;
  // de vez em quando um pulo de lua para a frente
  if (aggro && e.onGround && dir && dist > 90 && Math.random() < dt * 0.35 && nv2Room(e) > 3 * T) { e.vy = -200; e.vx = dir * 55; e.onGround = false; if (nv2Near(e) > 0.1) sfx.nv2Puff(nv2Near(e)); }
  // o rádio do capacete chiando
  e.radioT = (e.radioT ?? Math.random() * 4) - dt;
  if (e.radioT <= 0) { e.radioT = 3.5 + Math.random() * 4; const v = nv2Near(e, 240); if (v > 0.05) sfx.nv2Radio(v); }
  if (e.onGround && Math.abs(e.vx) > 4) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.55; const v = nv2Near(e, 180); if (v > 0.05) sfx.nv2Step(v); } }
  if (aggro && e.atkCD <= 0 && e.onGround && e.sees && dist < 150 && Math.abs(dy) < 6 * T && nv2Room(e) > 2 * T) {
    e.state = 'crouch'; e.stateT = NV2_CROUCH; e.vx = 0; e.tgX = pcx; e.tgY = pl.y + pl.h; sfx.nv2Crouch(Math.max(0.4, nv2Near(e)));
  }
};
// o pulo enorme em arco até onde o herói estava; o teto baixo encurta o arco
function nv2Leap(e) {
  const g = GRAV * (1 - NV2_LUA), ex = e.x + e.w / 2, ey = e.y + e.h, ddx = e.tgX - ex, ddy = e.tgY - ey;
  const t = clamp(Math.abs(ddx) / 120, 0.8, 1.35);
  let vy = ddy / t - 0.5 * g * t;
  const room = nv2Room(e, 10), maxVy = Math.sqrt(2 * g * Math.max(T, room - 4));
  if (-vy > maxVy) vy = -maxVy;
  e.vx = clamp(ddx / t, -170, 170); e.vy = vy; e.onGround = false; e.state = 'leap'; e.airT = 0; e.swingHit = false;
  e.facing = Math.sign(ddx) || e.facing;
  burst(ex, ey, 8, '#8a8e96', 50, 200, 0.5);
  if (nv2Near(e) > 0.05) sfx.nv2Jump(nv2Near(e));
}
// a queda: a onda de choque corre pelo chão para os dois lados
function nv2Land(e) {
  const ex = e.x + e.w / 2, ey = e.y + e.h;
  e.state = 'land'; e.stateT = 0.6; e.atkCD = 2.6 + Math.random(); e.vx = 0;
  nv2Waves.push({ x: ex, y: ey, r: 0, t: 0, hit: e.swingHit, dmg: Math.max(1, Math.round(e.dmg * 0.7)) });
  burst(ex, ey - 1, 14, '#8a8e96', 90, 300, 0.6); nv2Spark(ex, ey - 2, 6, ['#7dff3a', '#e8ffc8'], 60, 200, 0.5);
  const v = nv2Near(e, 300); if (v > 0.02) { sfx.nv2Thud(v); shake(3 * v + 1); }
}

/* ---------- o cabeção ---------- */
AI.cabecao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // a altura em que flutua: uns 2 blocos acima do chão embaixo dele
  e.floorT = (e.floorT || 0) - dt;
  if (e.floorT <= 0) { e.floorT = 0.4; const f = nv2Floor(ecx, ecy, 10); e.altY = f === null ? null : f - 2.2 * T - e.h / 2; }
  // vira devagar: dá tempo de passar por trás
  const want = Math.sign(dx) || e.facing;
  if (want !== e.facing && aggro) { e.turnT = (e.turnT || 0) + dt; if (e.turnT > 1.1) { e.facing = want; e.turnT = 0; if (nv2Near(e) > 0.1) sfx.nv2Turn(nv2Near(e)); } } else e.turnT = 0;
  const glide = (tx, ty, sp) => { const k = Math.min(1, dt * 2); e.vx = lerp(e.vx, clamp((tx - ecx) * 1.4, -sp, sp), k); e.vy = lerp(e.vy, clamp((ty - ecy) * 1.6, -sp, sp), k) + Math.sin(e.t * 2 + e.seed) * 3 * dt; };
  if (e.state === 'lift') {   // os olhos acendem, o destroço sobe tremendo
    glide(ecx, e.altY ?? ecy, 10);
    const R = e.rock;
    if (R) { const k = clamp(1 - e.stateT / NV2_LIFT, 0, 1); R.x = R.x0 + rnd(-1, 1) * k; R.y = lerp(R.y0, ecy - 6, Math.min(1, k * 1.3)) + rnd(-1, 1) * k; R.a += dt * 2; }
    if (e.stateT <= 0) nv2Throw(e);
    return;
  }
  if (e.state === 'pull') { glide(ecx, e.altY ?? ecy, 10); if (e.stateT <= 0) { e.state = 'hover'; } return; }
  e.state = 'hover';
  e.humT = (e.humT ?? Math.random() * 2) - dt;
  if (e.humT <= 0) { e.humT = 2.4 + Math.random() * 1.5; const v = nv2Near(e, 220); if (v > 0.05) sfx.nv2Hum(v); }
  if (!aggro) { glide((e.homeX ?? ecx) + Math.sin(e.t * 0.3 + e.seed) * 30, e.altY ?? (e.homeY ?? ecy), 18); if (Math.abs(e.vx) > 3) e.facing = Math.sign(e.vx); return; }
  // fica a uns 6 blocos do herói, do lado em que já está, baixo
  const side = Math.sign(ecx - pcx) || 1, tx = pcx + side * 6 * T, ty = e.altY ?? (pcy - T);
  glide(tx, ty, 34);
  if (e.hitWall) e.vx = 0;
  if (e.atkCD <= 0 && e.sees && dist < 180 && losClear(ecx, ecy, pcx, pcy)) nv2Lift(e);
};
// o destroço nasce no chão um pouco à frente dele (sem chão, do ar)
function nv2Lift(e) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, x = ecx + e.facing * 17, f = nv2Floor(x, ecy, 8);
  const y0 = f === null ? ecy + 8 : f - 3;
  const R = { x, y: y0, x0: x, y0, a: Math.random() * 6, va: 0, vx: 0, vy: 0, ph: 'lift', owner: e, dmg: e.dmg, t: 0 };
  nv2Rocks.push(R); e.rock = R; e.state = 'lift'; e.stateT = NV2_LIFT;
  if (f !== null) burst(x, f - 1, 6, '#626a76', 40, 260, 0.4);
  sfx.nv2Lift(Math.max(0.4, nv2Near(e)));
}
// arremessa no herói; o terceiro arremesso também puxa o herói 3 blocos
function nv2Throw(e) {
  const R = e.rock; e.rock = null;
  e.state = 'hover'; e.atkCD = 2.2 + Math.random() * 0.8;
  if (R && !R.dead) {
    const a = Math.atan2(pl.y + pl.h / 2 - R.y, pl.x + pl.w / 2 - R.x);
    R.ph = 'fly'; R.vx = Math.cos(a) * NV2_ROCK_SP; R.vy = Math.sin(a) * NV2_ROCK_SP; R.va = 9 * (Math.cos(a) >= 0 ? 1 : -1); R.t = 0;
    sfx.nv2Throw(Math.max(0.4, nv2Near(e)));
  }
  e.throws = (e.throws || 0) + 1;
  if (e.throws % 3 === 0 && !pl.dead && !nv2PullBy) { e.state = 'pull'; e.stateT = 0.5; nv2PullBy = e; nv2PullLeft = NV2_PULL; sfx.nv2Pull(Math.max(0.4, nv2Near(e))); }
}

/* ---------- o hipnotizador ---------- */
AI.hipnotico = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'cast') {   // o V, os anéis crescendo da mão
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) { const [hx, hy] = nv2Hand(e); nv2Rings.push({ x: hx, y: hy, r: 0, t: 0, hit: false }); e.state = 'after'; e.stateT = 0.5; e.atkCD = 4.5 + Math.random() * 1.5; sfx.nv2Hipno(Math.max(0.4, nv2Near(e))); }
    return;
  }
  if (e.state === 'after') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  let dir = 0, sp = 26 + e.lvl * 0.4, chase = false;
  if (aggro && dist < 4 * T && Math.abs(dy) < 3 * T) { e.state = 'flee'; dir = -Math.sign(dx) || -e.facing; sp = 52; }
  else if (aggro) {
    e.state = 'walk';
    // atrás de um aliado (do lado de lá dele, longe do herói); sozinho, a uns 5 blocos e meio
    e.allyT = (e.allyT || 0) - dt;
    if (e.allyT <= 0) { e.allyT = 0.6; let best = null, bd = 12 * T; for (const o of enemies) { if (o === e || o.dead || o.type === 'hipnotico' || o.boss) continue; const d = Math.hypot(o.x - e.x, o.y - e.y); if (d < bd) { bd = d; best = o; } } e.ally = best; }
    const A = e.ally && !e.ally.dead ? e.ally : null;
    const tx = A ? A.x + A.w / 2 + (Math.sign(A.x + A.w / 2 - pcx) || 1) * 2.5 * T : pcx + (Math.sign(ecx - pcx) || 1) * 5.5 * T;
    dir = Math.abs(tx - ecx) < 8 ? 0 : Math.sign(tx - ecx); chase = !e.sees;
  } else { e.state = 'walk'; cvWander(e, dt); dir = e.wander; sp = 14; }
  walk(e, dt, dir, sp, 400, 240, dy, chase);
  e.facing = aggro && e.state !== 'flee' ? (Math.sign(dx) || e.facing) : (dir || e.facing);
  e.dreamT = (e.dreamT ?? Math.random() * 3) - dt;
  if (e.dreamT <= 0) { e.dreamT = 3 + Math.random() * 3; const v = nv2Near(e, 220); if (v > 0.05 && e.state !== 'flee') sfx.nv2Dream(v * 0.6); }
  if (aggro && e.state === 'walk' && e.atkCD <= 0 && e.onGround && e.sees && dist < NV2_HIP_R - 4 && dist > 3 * T) { e.state = 'cast'; e.stateT = NV2_V; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.nv2Dream(Math.max(0.5, nv2Near(e))); }
};

/* ---------- o foguete errante ---------- */
// gruda no teto ou na parede mais perto (nariz para fora); sem nada perto, sobe até achar o teto
function nv2Perch(e) {
  const cx = Math.floor((e.x + e.w / 2) / T), cy = Math.floor((e.y + e.h / 2) / T);
  let best = null;
  for (let k = 0; k <= 7; k++) if (solidAt(cx, cy - k - 1)) { best = { k, side: 'up' }; break; }
  for (const s of [-1, 1]) for (let k = 0; k <= 6; k++) { if (solidAt(cx + s * (k + 1), cy)) { if (!best || k < best.k) best = { k, side: s < 0 ? 'left' : 'right' }; break; } }
  if (!best) { e.state = 'seek'; e.ang = -Math.PI / 2; return false; }
  const ccx = cx * T + T / 2, ccy = cy * T + T / 2;
  if (best.side === 'up') { const sy = (cy - best.k) * T; e.x = ccx - e.w / 2; e.y = sy + 6; e.ang = Math.PI / 2; }
  else if (best.side === 'left') { const sx = (cx - best.k) * T; e.x = sx + 6; e.y = ccy - e.h / 2; e.ang = 0; }
  else { const sx = (cx + best.k + 1) * T; e.x = sx - 6 - e.w; e.y = ccy - e.h / 2; e.ang = Math.PI; }
  e.side = best.side; e.state = 'sleep'; e.vx = 0; e.vy = 0;
  return true;
}
AI.foguete = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const back = (k = 11) => [ecx - Math.cos(e.ang) * k, ecy - Math.sin(e.ang) * k];
  if (e.state === 'seek') { e.vx = 0; e.vy = -40; if (e.hitCeil) nv2Perch(e); else if (e.stateT < -6) nv2Perch(e); return; }
  if (e.state === 'sleep') {
    e.vx = 0; e.vy = 0;
    if (Math.random() < dt * 0.4) { const [bx, by] = back(); nv2Smoke(bx, by, 1, 0, -6); }
    // acorda quando vê o herói do lado de fora da parede
    const out = [Math.cos(e.ang), Math.sin(e.ang)], dot = (dx * out[0] + dy * out[1]) / (dist || 1);
    if (aggro && e.atkCD <= 0 && e.sees && dist < 13 * T && dot > 0.15) { e.state = 'ignite'; e.stateT = NV2_IGN; e.aim = Math.atan2(dy, dx); sfx.nv2Ignite(Math.max(0.4, nv2Near(e))); }
    return;
  }
  if (e.state === 'ignite') {   // a chama acende, a fumaça sai, a seta mira; o nariz vira devagar para o herói
    e.vx = 0; e.vy = 0;
    if (e.stateT > 0.15) e.aim = Math.atan2(dy, dx);
    e.ang += clamp(nv2Ang(e.aim - e.ang), -6 * dt, 6 * dt);
    const [bx, by] = back(); if (Math.random() < dt * 30) nv2Smoke(bx, by, 1, -Math.cos(e.ang) * 20, -Math.sin(e.ang) * 20 - 6);
    if (Math.random() < dt * 20) nv2Spark(bx, by, 1, ['#ffd23a', '#ff9a2e'], 25, 40, 0.3);
    if (e.stateT <= 0) { e.ang = e.aim; e.state = 'dash'; e.dashT = 0; e.tries = 0; e.minD = dist; e.side = null; sfx.nv2Launch(Math.max(0.4, nv2Near(e))); }
    return;
  }
  if (e.state === 'dash' || e.state === 'curve') {
    e.dashT += dt;
    if (e.state === 'curve') {   // fez a curva: vira para o herói e tenta mais uma vez
      e.ang += clamp(nv2Ang(Math.atan2(dy, dx) - e.ang), -5.5 * dt, 5.5 * dt);
      if (Math.abs(nv2Ang(Math.atan2(dy, dx) - e.ang)) < 0.15 || e.dashT > 0.9) { e.state = 'dash'; e.dashT = 0; e.minD = dist; }
    }
    const sp = e.state === 'curve' ? 160 : NV2_ROCKET_SP;
    e.vx = Math.cos(e.ang) * sp; e.vy = Math.sin(e.ang) * sp; e.facing = Math.sign(e.vx) || e.facing;
    const [bx, by] = back(10);
    if (Math.random() < dt * 40) nv2Smoke(bx, by, 1, -e.vx * 0.1, -e.vy * 0.1);
    if (Math.random() < dt * 50) nv2Spark(bx, by, 1, ['#fff4b0', '#ffd23a', '#ff9a2e'], 30, 0, 0.25);
    e.hissT = (e.hissT || 0) - dt; if (e.hissT <= 0) { e.hissT = 0.3; const v = nv2Near(e, 240); if (v > 0.05) sfx.nv2Rocket(v); }
    if (!pl.dead && overlap({ x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 4 }, pl)) { nv2Explode(e); return; }
    if (e.hitWall || e.hitCeil || e.onGround) { nv2Explode(e); return; }
    if (e.state === 'dash') {
      e.minD = Math.min(e.minD, dist);
      // vai bater longe do herói: arremete antes da parede e faz a curva (só na primeira vez)
      const ahead = solidAt(Math.floor((ecx + Math.cos(e.ang) * 1.6 * T) / T), Math.floor((ecy + Math.sin(e.ang) * 1.6 * T) / T));
      if (e.tries === 0 && ahead && dist > NV2_BOOM_R + 14) { e.state = 'curve'; e.tries = 1; e.dashT = 0; e.ang += (nv2Ang(Math.atan2(dy, dx) - e.ang) >= 0 ? 1 : -1) * 0.6; return; }
      if (e.tries === 0 && e.dashT > 0.2 && dist > e.minD + 14 && e.minD < 5 * T) { e.state = 'curve'; e.tries = 1; e.dashT = 0; }
      else if (e.dashT > (e.tries ? 1.8 : 2.6)) nv2Explode(e);
    }
    return;
  }
  e.state = 'sleep';
};
// explode sozinho (sem XP nem loot): o clarão de 2 blocos
function nv2Explode(e) {
  if (e.dead) return;
  e.dead = true; e.nv2Gone = true;
  nv2Boom(e.x + e.w / 2, e.y + e.h / 2, e.dmg, NV2_BOOM_R);
}
function nv2Boom(x, y, dmg, r) {
  nv2Blasts.push({ x, y, r, t: 0 });
  burst(x, y, 18, '#ff9a2e', 140, 120, 0.5, 1, true); burst(x, y, 10, '#fff4b0', 90, 60, 0.35, 1, true); nv2Smoke(x, y, 10, 0, -20);
  for (let i = 0; i < 6; i++) burst(x, y, 1, '#3a3e46', 160, 500, 0.8);
  // o herói: o ponto dele mais perto do centro dentro do raio, sem pedra no meio
  if (!pl.dead) {
    const nx = clamp(x, pl.x, pl.x + pl.w), ny = clamp(y, pl.y, pl.y + pl.h);
    if (Math.hypot(nx - x, ny - y) <= r && (losClear(x, y, pl.x + pl.w / 2, pl.y + pl.h / 2) || losClear(x, y, nx, ny))) {
      const res = hurtPlayer(dmg, x, null, true);
      if (res === 'hit') { const d = Math.sign(pl.x + pl.w / 2 - x) || 1; pl.vx = d * 220; pl.vy = -200; pl.onGround = false; }
    }
  }
  const v = clamp(1 - Math.hypot(pl.x - x, pl.y - y) / 320, 0, 1);
  if (v > 0.02) { sfx.nv2Boom(v); shake(2 + 4 * v); }
}

/* ---------- golpes, mortes, nascimento ---------- */
const nv2Above = e => pl.y + pl.h <= e.y + 4;   // o herói por cima da cabeça
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  // o escudo psíquico do cabeção: de frente não passa nada (por trás ou de cima, sim)
  if (e && !e.dead && e.type === 'cabecao' && dir === -e.facing && !nv2Above(e)) {
    e.shieldHit = 0.35; e.memT = 4;
    const sx = e.x + e.w / 2 + e.facing * 13, sy = e.y + e.h / 2;
    nv2Spark(sx, sy, 10, ['#a64dff', '#dcb0ff', '#ff3ec8'], 70, 40, 0.4);
    floatText(e.x + e.w / 2, e.y - 6, 'BLOQUEADO', '#c89aff', 0.8);
    sfx.nv2Shield(); shake(1); if (melee) pl.vx -= dir * 70;
    return;
  }
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !NV2_TYPES.includes(e.type)) return r;
  if (e.type === 'foguete' && e.state === 'sleep') { e.atkCD = 0; e.memT = 4; }   // acordou com o golpe
  if (e.type === 'hipnotico' && e.state === 'cast' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1.2); }   // o golpe corta o V
  if (e.type === 'astronauta') e.stun = Math.min(e.stun, e.state === 'leap' ? 0 : 0.12);   // pesado: mal balança
  if (e.type === 'cabecao') { e.stun = Math.min(e.stun, 0.15); if (e.rock && e.rock.ph === 'lift') { e.rock.ph = 'drop'; e.rock = null; e.state = 'hover'; e.atkCD = Math.max(e.atkCD, 1); } }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && NV2_TYPES.includes(e.type)) {
    if (e.type === 'foguete' && (e.state === 'dash' || e.state === 'curve')) nv2Boom(e.x + e.w / 2, e.y + e.h / 2, e.dmg, NV2_BOOM_R);
    if (e.type === 'cabecao' && e.rock) { e.rock.ph = 'drop'; e.rock = null; }
    if (nv2PullBy === e) nv2PullBy = null;
  }
  const r = _k(e);
  if (!NV2_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  if (e.type === 'astronauta') { nv2Tanks.push({ x: cx - e.facing * 4, y: e.y + 10, vx: -e.facing * 30, vy: -90, t: 0, dmg: Math.round(e.dmg * 0.9), ok: false }); sfx.nv2Radio(0.8); }
  else if (e.type === 'olhudos') { burst(cx, cy, 8, '#7dff3a', 60, 300, 0.5); if (nv2Near(e) > 0.05) sfx.nv2Splat(1); }
  else if (e.type === 'hipnotico') nv2Spark(cx, e.y + 6, 12, NV_ARCO, 50, 20, 0.8);
  else if (e.type === 'cabecao') nv2Spark(cx, cy, 14, ['#a64dff', '#dcb0ff'], 60, 20, 0.8);
  else if (e.type === 'foguete' && e.state !== 'dash' && e.state !== 'curve') { nv2Smoke(cx, cy, 6); burst(cx, cy, 6, '#ff9a2e', 50, 200, 0.4, 1, true); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !NV2_TYPES.includes(type)) return e;
  for (let k = 0; k < 4 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.8 + Math.random(); e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'olhudos') {
    e.state = 'walk'; e.atkCD = 0;
    if (!nv2Grouping) {   // o grupo: 4 a 6 bolinhas juntas, pulando juntas
      const G = { m: [e], ph: 'idle', cd: 1.2 + Math.random(), t: 0 }; nv2Groups.push(G); e.grp = G;
      nv2Grouping = true;
      try {
        const n = 3 + Math.floor(Math.random() * 3), fy = Math.floor((e.y + e.h + 1) / T);
        for (let i = 0, made = 0; i < 16 && made < n; i++) {
          const x = e.x + (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 30);
          if (rectSolid(x, e.y, e.w, e.h) || !solidAt(Math.floor((x + e.w / 2) / T), fy)) continue;
          const o = spawnEnemy('olhudos', x, e.y, zone);
          if (o && !o.dead) { o.grp = G; G.m.push(o); made++; }
        }
      } finally { nv2Grouping = false; }
    }
  } else if (type === 'astronauta') e.state = 'walk';
  else if (type === 'cabecao') { e.state = 'hover'; e.y -= T; if (rectSolid(e.x, e.y, e.w, e.h)) e.y += T; e.homeY = e.y + e.h / 2; }
  else if (type === 'hipnotico') { e.state = 'walk'; e.atkCD = 2 + Math.random(); }
  else if (type === 'foguete') { e.atkCD = 0.6; e.stateT = 0; nv2Perch(e); }
  return e;
}; }

/* ---------- a cada quadro: o grupo, as ondas, o tanque, os destroços, os anéis, o puxão ---------- */
function nv2Update(dt) {
  for (let i = nv2Groups.length - 1; i >= 0; i--) if (!nv2GroupTick(nv2Groups[i], dt)) nv2Groups.splice(i, 1);
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, pfy = pl.y + pl.h;
  // a onda de choque do astronauta: corre pelo chão; quem estiver no chão quando ela passa leva (pular salva)
  for (let i = nv2Waves.length - 1; i >= 0; i--) {
    const w = nv2Waves[i]; w.t += dt; w.r = NV2_WAVE_R * Math.min(1, w.t / NV2_WAVE_T);
    if (!w.hit && !pl.dead) {
      const ad = Math.abs(pcx - w.x);
      if (ad <= w.r + 5 && ad <= NV2_WAVE_R + 5 && Math.abs(pfy - w.y) < 8 && pl.onGround && losClear(w.x, w.y - 4, pcx, pfy - 4)) {
        w.hit = true; const r = hurtPlayer(w.dmg, w.x, null, true); if (r === 'hit') { pl.vx = (Math.sign(pcx - w.x) || 1) * 200; pl.vy = -170; }
      }
    }
    if (w.t > 0.7) nv2Waves.splice(i, 1);
  }
  // o tanque solto: cai, chia 1 s e estoura
  for (let i = nv2Tanks.length - 1; i >= 0; i--) {
    const k = nv2Tanks[i]; k.t += dt;
    k.vy = Math.min(k.vy + GRAV * 0.6 * dt, MAXFALL);
    const nx = k.x + k.vx * dt, ny = k.y + k.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(k.y / T))) k.vx = 0; else k.x = nx;
    if (solidAt(Math.floor(k.x / T), Math.floor((ny + 3) / T))) { k.vy = 0; k.vx *= 0.8; k.y = Math.floor((ny + 3) / T) * T - 3; } else k.y = ny;
    if (!k.ok) { k.ok = true; if (Math.hypot(k.x - pcx, k.y - pcy) < 320) sfx.nv2Hiss(); }
    if (Math.random() < dt * 40) parts.push({ x: k.x - 5, y: k.y - 1, vx: rnd(-40, -20), vy: rnd(-20, 5), g: -10, life: 0.45, max: 0.45, col: Math.random() < 0.5 ? '#eef3f7' : '#bac4ce', size: 1 });
    if (k.t >= NV2_HISS) { nv2Tanks.splice(i, 1); nv2Boom(k.x, k.y - 2, k.dmg, NV2_TANK_R); }
  }
  // os destroços: subindo (o 'lift' é posto pelo cabeção), voando reto, ou caindo à toa
  for (let i = nv2Rocks.length - 1; i >= 0; i--) {
    const R = nv2Rocks[i]; R.t += dt;
    if (R.ph === 'lift') { if (!R.owner || R.owner.dead || R.owner.rock !== R) R.ph = 'drop'; continue; }
    if (R.ph === 'drop') { R.vy = Math.min(R.vy + GRAV * dt, MAXFALL); R.x += R.vx * dt; R.y += R.vy * dt; R.a += dt * 3; if (solidAt(Math.floor(R.x / T), Math.floor((R.y + 3) / T)) || R.t > 4) { nv2RockBreak(R); nv2Rocks.splice(i, 1); } continue; }
    R.x += R.vx * dt; R.y += R.vy * dt; R.a += R.va * dt;
    if (Math.random() < dt * 30) nv2Spark(R.x, R.y, 1, ['#a64dff', '#dcb0ff'], 10, 0, 0.35);
    let gone = R.t > 2.5 || solidAt(Math.floor(R.x / T), Math.floor(R.y / T));
    if (!gone && !pl.dead && R.x > pl.x - 3 && R.x < pl.x + pl.w + 3 && R.y > pl.y - 3 && R.y < pl.y + pl.h + 3) {
      const r = hurtPlayer(R.dmg, R.x - Math.sign(R.vx || 1) * 8, null, true);
      if (r !== 'none' || pl.invuln > 0) gone = true;
    }
    if (gone) { nv2RockBreak(R); nv2Rocks.splice(i, 1); }
  }
  // os anéis do hipnotizador: crescem até 7 blocos; o escudo erguido de frente para eles segura
  for (let i = nv2Rings.length - 1; i >= 0; i--) {
    const g = nv2Rings[i]; g.t += dt; g.r = NV2_HIP_R * Math.min(1, g.t / NV2_HIP_T);
    if (!g.hit && !pl.dead) {
      const d = Math.hypot(pcx - g.x, pcy - g.y);
      if (d <= g.r + 6 && d <= NV2_HIP_R + 6 && losClear(g.x, g.y, pcx, pcy)) {
        g.hit = true;
        const rel = g.x - pcx, front = Math.abs(rel) < 3 || Math.sign(rel) === pl.facing;
        if (pl.shieldK >= 0.6 && front) { nv2Spark(pcx + pl.facing * 9, pl.y + 8, 10, NV_ARCO, 60, 40, 0.4); sfx.nv2Shield(); }
        else { if (typeof nvHipnotizar === 'function') nvHipnotizar(3); nv2Spark(pcx, pl.y + 2, 14, NV_ARCO, 40, -10, 0.9); sfx.nv2Hipnotizado(); }
      }
    }
    if (g.t > NV2_HIP_T + 0.35) nv2Rings.splice(i, 1);
  }
  // o puxão do cabeção: 3 blocos na direção dele, parando na parede
  if (nv2PullBy) {
    const e = nv2PullBy;
    if (e.dead || pl.dead || nv2PullLeft <= 0) nv2PullBy = null;
    else {
      const dir = Math.sign(e.x + e.w / 2 - pcx), step = Math.min(nv2PullLeft, 120 * dt);
      if (!dir || Math.abs(e.x + e.w / 2 - pcx) < 20) nv2PullBy = null;
      else if (!rectSolid(pl.x + dir * step, pl.y, pl.w, pl.h)) { pl.x += dir * step; pl.vx = 0; nv2PullLeft -= step; if (Math.random() < dt * 30) nv2Spark(pcx, pcy, 1, ['#a64dff', '#dcb0ff'], 20, 0, 0.3); }
      else if (pl.onGround && !rectSolid(pl.x + dir * step, pl.y - T, pl.w, pl.h)) pl.y -= 2;   // degrau: sobe um pouco
      else nv2PullBy = null;
    }
  }
}
HOOK.update.push(nv2Update);
function nv2RockBreak(R) {
  burst(R.x, R.y, 8, '#606a76', 70, 300, 0.5); nv2Spark(R.x, R.y, 5, ['#7dff3a', '#a64dff'], 50, 100, 0.4);
  const v = clamp(1 - Math.hypot(pl.x - R.x, pl.y - R.y) / 220, 0, 1); if (v > 0.05) sfx.nv2Clang(v);
}
// os que explodiram sozinhos saem da lista sem XP (updateEnemies tira os mortos)

/* ---------- desenho do que voa sozinho ---------- */
// no mundo (com a luz): o tanque solto e os destroços
HOOK.drawWorld.push((cx, cy) => {
  const B = NV2.get();
  for (const k of nv2Tanks) { const img = Math.floor(k.t * 14) % 2 && k.t > 0.6 ? B.tanque.wr : B.tanque.r; lc.drawImage(img, Math.round(k.x - cx - img.width / 2 + rnd(-0.6, 0.6) * k.t), Math.round(k.y - cy - img.height + 3)); }
  for (const R of nv2Rocks) cvRot(B.pedra.r, Math.round(R.x - cx), Math.round(R.y - cy), R.a);
});
// por cima do escuro: anéis no chão, o raio do tanque, o escudo, a seta, os anéis arco-íris, o fio do puxão, os clarões
const NV2_SHIELD = ['#5a1a9e', '#a64dff', '#dcb0ff', '#ff3ec8'];
function nv2Dot(x, y, cx, cy, sz = 1) { if (solidAt(Math.floor(x / T), Math.floor(y / T))) return; lc.fillRect(Math.round(x - cx), Math.round(y - cy), sz, sz); }
HOOK.drawTop.push((cx, cy) => {
  // a onda de choque: um anel achatado no chão, verde-branco, com a poeira
  for (const w of nv2Waves) {
    const f = 1 - w.t / 0.7;
    for (let ring = 0; ring < 2; ring++) {
      const r = w.r - ring * 4; if (r < 1) continue;
      const n = Math.max(20, Math.round(r * 2.2)), ry = 2 + r * 0.06;
      lc.globalAlpha = f * (ring ? 0.45 : 0.9); lc.fillStyle = ring ? '#7dff3a' : '#eaffc8';
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; nv2Dot(w.x + Math.cos(a) * r, w.y - 2 + Math.sin(a) * ry, cx, cy, ring ? 1 : (Math.abs(Math.cos(a)) > 0.9 ? 2 : 1)); }
    }
    // as cristas da onda dos dois lados
    lc.globalAlpha = f; lc.fillStyle = '#ffffff';
    for (const s of [-1, 1]) { const x = w.x + s * w.r; nv2Dot(x, w.y - 3, cx, cy, 1); nv2Dot(x, w.y - 4, cx, cy, 1); }
  }
  // o tanque chiando: a luz vermelha pisca cada vez mais rápido e o raio da explosão aparece tracejado
  for (const k of nv2Tanks) {
    const p = clamp(k.t / NV2_HISS, 0, 1), blink = Math.floor(k.t * (6 + p * 18)) % 2;
    if (blink) { lc.globalAlpha = 1; lc.fillStyle = '#ff3b3b'; lc.fillRect(Math.round(k.x - cx - 5), Math.round(k.y - cy - 4), 1, 1); }
    const n = 48; lc.globalAlpha = 0.5 + 0.5 * p; lc.fillStyle = blink ? '#ff3b3b' : '#ffd23a';
    for (let i = 0; i < n; i++) { if ((i + Math.floor(gameTime * 8)) % 4 === 0) continue; const a = i / n * Math.PI * 2; nv2Dot(k.x + Math.cos(a) * NV2_TANK_R, k.y - 2 + Math.sin(a) * NV2_TANK_R, cx, cy, i % 2 ? 1 : 2); }
  }
  for (const e of enemies) {
    if (e.dead) continue;
    const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
    if (e.type === 'cabecao') {
      // o escudo: um arco de favos violeta na frente do rosto, piscando mais forte quando apanha
      const hitK = e.shieldHit > 0 ? e.shieldHit / 0.35 : 0, bob = Math.round(Math.sin(e.t * 2 + e.seed) * 1.2), r = 14;
      for (let i = -9; i <= 9; i++) {
        const a = (e.facing > 0 ? 0 : Math.PI) + i * 0.13, x = ecx + Math.cos(a) * r, y = ecy + bob + Math.sin(a) * r * 1.05;
        const fl = 0.5 + 0.5 * Math.sin(gameTime * 7 + i * 1.3);
        lc.globalAlpha = Math.min(1, (0.5 + 0.35 * fl + hitK * 0.4) * (1.15 - Math.abs(i) / 10)); lc.fillStyle = NV2_SHIELD[(i + 20 + Math.floor(gameTime * 6)) % 3 + (hitK > 0.3 ? 1 : 0)];
        nv2Dot(x, y, cx, cy); lc.globalAlpha *= 0.55; nv2Dot(x - Math.cos(a), y - Math.sin(a), cx, cy);
        if ((i + 30) % 3 === 0) { lc.fillStyle = '#dcb0ff'; nv2Dot(x - Math.cos(a) * 2.5, y - Math.sin(a) * 2.5, cx, cy); }
      }
      // o fio violeta do puxão
      if (nv2PullBy === e && !pl.dead) {
        const px = pl.x + pl.w / 2, py = pl.y + pl.h / 2, n = Math.ceil(Math.hypot(px - ecx, py - ecy) / 3);
        lc.globalAlpha = 0.85;
        for (let j = 0; j <= n; j++) { const t = j / n, w = Math.sin(t * 12 - gameTime * 20) * 2 * Math.sin(t * Math.PI); lc.fillStyle = j % 2 ? '#a64dff' : '#dcb0ff'; nv2Dot(lerp(ecx, px, t), lerp(ecy, py, t) + w, cx, cy); }
      }
      if (e.state === 'lift' && e.rock) {   // o destroço aceso: pontinhos violeta girando em volta
        const R = e.rock; lc.globalAlpha = 0.9;
        for (let j = 0; j < 6; j++) { const a = gameTime * 5 + j * 1.05; lc.fillStyle = j % 2 ? '#a64dff' : '#dcb0ff'; lc.fillRect(Math.round(R.x - cx + Math.cos(a) * 6), Math.round(R.y - cy + Math.sin(a) * 4), 1, 1); }
      }
    } else if (e.type === 'foguete' && e.state === 'ignite') {
      // a seta laranja: chevrons do foguete até perto do herói
      const k = clamp(1 - e.stateT / NV2_IGN, 0, 1), a = e.aim, L = Math.min(Math.hypot(pl.x + pl.w / 2 - ecx, pl.y + pl.h / 2 - ecy), 9 * T) - 6;
      lc.globalAlpha = 0.45 + 0.5 * k; lc.fillStyle = '#ff9a2e';
      for (let d = 12; d < L; d += 3) { if ((d / 3 + Math.floor(gameTime * 14)) % 4 === 0) continue; nv2Dot(ecx + Math.cos(a) * d, ecy + Math.sin(a) * d, cx, cy); }
      const tx = ecx + Math.cos(a) * L, ty = ecy + Math.sin(a) * L;
      lc.fillStyle = '#ffd23a';
      for (let j = 1; j <= 4; j++) for (const s of [-1, 1]) nv2Dot(tx - Math.cos(a + s * 0.6) * j * 1.5, ty - Math.sin(a + s * 0.6) * j * 1.5, cx, cy);
      nv2Dot(tx, ty, cx, cy, 1);
    } else if (e.type === 'foguete' && (e.state === 'dash' || e.state === 'curve')) {
      // a chama: miolo branco, amarelo, laranja, tremendo
      const a = e.ang;
      for (let d = 0; d < 7; d++) { const x = ecx - Math.cos(a) * (10 + d), y = ecy - Math.sin(a) * (10 + d), w = d < 2 ? 1 : 0; lc.globalAlpha = 1; lc.fillStyle = d < 2 ? '#fff4b0' : d < 4 ? '#ffd23a' : '#ff9a2e'; if (Math.random() < 0.85 - d * 0.08) { lc.fillRect(Math.round(x - cx), Math.round(y - cy), 1, 1); if (w) lc.fillRect(Math.round(x - cx - Math.sin(a)), Math.round(y - cy + Math.cos(a)), 1, 1); } }
    } else if (e.type === 'hipnotico' && e.state === 'cast') {
      // anéis arco-íris pequenos saindo da mão em V, maiores a cada instante
      const [hx, hy] = nv2Hand(e), k = clamp(1 - e.stateT / NV2_V, 0, 1);
      for (let j = 0; j < 3; j++) {
        const p = (gameTime * 1.8 + j / 3) % 1, r = 2 + p * (4 + 12 * k), n = Math.max(10, Math.round(r * 3));
        for (let c = 0; c < 3; c++) { lc.globalAlpha = (1 - p) * (0.4 + 0.55 * k); lc.fillStyle = NV_ARCO[(c * 2 + j) % 6]; const rr = r - c; if (rr < 1) continue; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; nv2Dot(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr, cx, cy); } }
      }
    } else if (e.type === 'astronauta' && e.state === 'crouch') {
      // o visor aceso: pixels verdes vivos por cima do escuro
      const [vx, vy] = nv2Visor(e, Math.round(ecx) - cx, Math.round(e.y + e.h) - cy);
      lc.globalAlpha = 0.6 + 0.4 * Math.sin(e.t * 30); lc.fillStyle = '#b8ff7a';
      lc.fillRect(Math.round(vx) - 1, Math.round(vy) + 1, 3, 1); lc.fillStyle = '#eaffc8'; lc.fillRect(Math.round(vx), Math.round(vy), 1, 1);
    }
  }
  // a onda hipnótica: seis anéis arco-íris crescendo juntos
  for (const g of nv2Rings) {
    const f = g.t < NV2_HIP_T ? 1 : 1 - (g.t - NV2_HIP_T) / 0.35;
    for (let c = 0; c < 6; c++) {
      const r = g.r - c * 2; if (r < 1) continue;
      const n = Math.max(16, Math.round(r * 1.6)), off = gameTime * 2 + c;
      lc.globalAlpha = f * 0.85; lc.fillStyle = NV_ARCO[c];
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + off * 0.1; nv2Dot(g.x + Math.cos(a) * r, g.y + Math.sin(a) * r, cx, cy); }
    }
  }
  // os clarões: o raio da explosão marcado e o miolo branco
  for (const b of nv2Blasts) {
    const p = b.t / 0.4, r = b.r * Math.min(1, b.t / 0.12), n = Math.max(24, Math.round(r * 2.5));
    lc.globalAlpha = Math.max(0, 1 - p);
    for (let ring = 0; ring < 3; ring++) { lc.fillStyle = ['#fff4b0', '#ffd23a', '#ff6a1a'][ring]; const rr = r - ring * 2; if (rr < 1) continue; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; nv2Dot(b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr, cx, cy, ring ? 1 : 2); } }
    if (b.t < 0.1) { lc.globalAlpha = 0.7; lc.fillStyle = '#fff8e0'; const q = Math.round(r * 0.5); lc.fillRect(Math.round(b.x - cx - q / 2), Math.round(b.y - cy - q / 2), q, q); }
  }
  lc.globalAlpha = 1;
});
// a luz: destroços, o escudo, a onda, os anéis, o clarão
HOOK.drawGlow.push((cx, cy) => {
  const G = NV2.GL;
  for (const R of nv2Rocks) if (R.ph !== 'drop') { lc.globalAlpha = R.ph === 'lift' ? 0.6 : 0.45; lc.drawImage(G.violeta, Math.round(R.x - cx) - 6, Math.round(R.y - cy) - 6); }
  for (const e of enemies) {
    if (e.dead) continue;
    const ecx = e.x + e.w / 2 - cx, ecy = e.y + e.h / 2 - cy;
    if (e.type === 'cabecao') { lc.globalAlpha = 0.24 + (e.shieldHit > 0 ? 0.4 : 0) + (e.state === 'lift' ? 0.15 : 0); lc.drawImage(G.violetaG, Math.round(ecx + e.facing * 12) - 14, Math.round(ecy) - 14); }
    else if (e.type === 'hipnotico' && e.state === 'cast') { const [hx, hy] = nv2Hand(e); lc.globalAlpha = 0.25 + 0.3 * clamp(1 - e.stateT / NV2_V, 0, 1); lc.drawImage(G.violetaG, Math.round(hx - cx) - 14, Math.round(hy - cy) - 14); }
    else if (e.type === 'foguete' && (e.state === 'dash' || e.state === 'curve')) { lc.globalAlpha = 0.5; lc.drawImage(G.fogo, Math.round(ecx - Math.cos(e.ang) * 13) - 10, Math.round(ecy - Math.sin(e.ang) * 13) - 10); }
  }
  for (const w of nv2Waves) { const f = 1 - w.t / 0.7; lc.globalAlpha = 0.35 * f; for (const s of [-1, 1]) lc.drawImage(G.verdeG, Math.round(w.x + s * w.r - cx) - 10, Math.round(w.y - cy) - 12); }
  for (const k of nv2Tanks) { lc.globalAlpha = 0.2 + 0.4 * clamp(k.t / NV2_HISS, 0, 1); lc.drawImage(G.vermelho, Math.round(k.x - cx) - 9, Math.round(k.y - cy) - 7); }
  for (const g of nv2Rings) { lc.globalAlpha = 0.25 * (g.t < NV2_HIP_T ? 1 : 0.4); lc.drawImage(G.violetaG, Math.round(g.x - cx) - 14, Math.round(g.y - cy) - 14); }
  for (const b of nv2Blasts) { lc.globalAlpha = Math.max(0, 0.9 - b.t * 2); lc.drawImage(G.boom, Math.round(b.x - cx) - 30, Math.round(b.y - cy) - 30); }
  lc.globalAlpha = 1;
});
// relógios que não dependem do quadro do bicho
HOOK.update.push(dt => {
  for (let i = nv2Blasts.length - 1; i >= 0; i--) { nv2Blasts[i].t += dt; if (nv2Blasts[i].t > 0.4) nv2Blasts.splice(i, 1); }
  for (const e of enemies) if (e.shieldHit > 0) e.shieldHit -= dt;
});
function clearNv2Fx() { nv2Groups.length = 0; nv2Waves.length = 0; nv2Tanks.length = 0; nv2Rocks.length = 0; nv2Rings.length = 0; nv2Blasts.length = 0; nv2PullBy = null; nv2PullLeft = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearNv2Fx(); nv2Tables(); return _nw(sd, sv); }; }

/* ---------- sons ---------- */
Object.assign(sfx, {
  // os olhudinhos: piados agudos de borracha
  nv2Chirp(v = 1) { const f = 1700 + Math.random() * 700; tone(f, 0.06, 'square', 0.008 * v, 900); tone(f * 1.3, 0.05, 'sine', 0.014 * v, -700, 0.07); },
  nv2Blink(v = 1) { v = Math.max(0.35, v); for (let k = 0; k < 3; k++) tone(2600 + k * 300, 0.03, 'sine', 0.02 * v, 400, k * 0.12); noise(0.3, 0.008 * v, 5000, 'highpass', 0.05, 2); },
  nv2Hop(v = 1) { tone(420, 0.14, 'sine', 0.03 * v, 760); for (let k = 0; k < 4; k++) tone(1900 + Math.random() * 900, 0.04, 'square', 0.006 * v, 600, k * 0.03); },
  nv2Splat(v = 1) { noise(0.08, 0.04 * v, 700, 'lowpass'); tone(260, 0.06, 'sine', 0.02 * v, -140); },
  // o astronauta: o chiado do rádio, os passos de bota pesada, o baque da queda
  nv2Radio(v = 1) { noise(0.45, 0.025 * v, 2400, 'bandpass', 0, 0.7); for (let k = 0; k < 3; k++) tone(1150 + k * 40, 0.04, 'square', 0.006 * v, 0, 0.08 + k * 0.11); tone(700, 0.08, 'sine', 0.01 * v, -200, 0.38); },
  nv2Step(v = 1) { noise(0.07, 0.035 * v, 380, 'lowpass'); tone(90, 0.06, 'sine', 0.02 * v, -30); },
  nv2Puff(v = 1) { noise(0.25, 0.03 * v, 900, 'bandpass', 0, 1); tone(160, 0.2, 'sine', 0.02 * v, 80); },
  nv2Crouch(v = 1) { tone(180, 0.8, 'triangle', 0.025 * v, 480); tone(184, 0.8, 'sawtooth', 0.006 * v, 470); noise(0.8, 0.02 * v, 2600, 'bandpass', 0, 0.8); },
  nv2Jump(v = 1) { noise(0.3, 0.06 * v, 600, 'lowpass'); tone(120, 0.35, 'sine', 0.04 * v, 160); },
  nv2Thud(v = 1) { tone(62, 0.5, 'sine', 0.12 * v, -28); noise(0.35, 0.14 * v, 260, 'lowpass'); noise(0.2, 0.04 * v, 1800, 'bandpass', 0.03, 1.5); },
  nv2Hiss() { noise(NV2_HISS, 0.06, 5200, 'highpass', 0, 0.6); tone(3200, NV2_HISS, 'sine', 0.004, 900); },
  // o cabeção: um zumbido grave de cabeça, a pedra subindo, o arremesso, o puxão, o escudo
  nv2Hum(v = 1) { tone(66, 1.2, 'sine', 0.03 * v, 4); tone(99, 1.2, 'triangle', 0.012 * v, -3); tone(133, 1.2, 'sine', 0.006 * v, 6); },
  nv2Turn(v = 1) { tone(140, 0.3, 'sine', 0.02 * v, -40); },
  nv2Lift(v = 1) { tone(110, NV2_LIFT, 'sawtooth', 0.012 * v, 220); tone(55, NV2_LIFT, 'sine', 0.04 * v, 30); noise(NV2_LIFT, 0.025 * v, 420, 'lowpass', 0, 1); },
  nv2Throw(v = 1) { noise(0.18, 0.07 * v, 900, 'bandpass', 0, 1); tone(330, 0.18, 'sine', 0.03 * v, -220); },
  nv2Pull(v = 1) { tone(80, 0.5, 'sawtooth', 0.03 * v, -30); tone(160, 0.5, 'sine', 0.02 * v, 120); },
  nv2Clang(v = 1) { tone(620, 0.12, 'square', 0.02 * v, -300); noise(0.12, 0.06 * v, 2400, 'bandpass', 0, 2); },
  nv2Shield() { tone(880, 0.16, 'sine', 0.035, -340); tone(1320, 0.1, 'triangle', 0.015, -500); noise(0.1, 0.03, 4000, 'highpass'); },
  // o hipnotizador: um acorde de sonho que balança; a onda; o herói pego
  nv2Dream(v = 1) { for (const [f, d] of [[392, 0], [494, 0.08], [587, 0.16], [740, 0.24]]) { tone(f, 1.0, 'sine', 0.012 * v, 18, d); tone(f * 1.01, 1.0, 'triangle', 0.005 * v, -14, d); } },
  nv2Hipno(v = 1) { for (let k = 0; k < 6; k++) tone(520 + k * 130, 0.5, 'sine', 0.012 * v, 260, k * 0.04); noise(0.5, 0.02 * v, 3000, 'bandpass', 0, 3); },
  nv2Hipnotizado() { for (let k = 0; k < 4; k++) tone(880 - k * 90, 0.35, 'sine', 0.02, -120, k * 0.07); },
  // o foguete: o chiado subindo, a partida, o assobio e o estouro
  nv2Ignite(v = 1) { noise(NV2_IGN, 0.05 * v, 2200, 'bandpass', 0, 0.8); tone(200, NV2_IGN, 'sawtooth', 0.01 * v, 700); },
  nv2Launch(v = 1) { noise(0.35, 0.09 * v, 1400, 'bandpass', 0, 0.6); tone(300, 0.3, 'square', 0.012 * v, 500); },
  nv2Rocket(v = 1) { noise(0.32, 0.03 * v, 3000, 'highpass', 0, 0.7); },
  nv2Boom(v = 1) { noise(0.7, 0.26 * v, 380, 'lowpass'); tone(58, 0.55, 'sine', 0.13 * v, -26); noise(0.22, 0.09 * v, 2400, 'bandpass', 0, 1); tone(120, 0.25, 'square', 0.02 * v, -80, 0.02); }
});
