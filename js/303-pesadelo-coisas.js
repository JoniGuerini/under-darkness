'use strict';

/* ================= os Salões do Pesadelo: as coisas do pesadelo, parte um =================
   Cinco das dez coisas da camada (docs/camadas/14-saloes-pesadelo.md, seção 6; as outras cinco estão no 304). Nenhuma
   sangra: o que sai delas é pena, poeira e caco. Cada uma é um medo de sonho com uma regra própria:
   - o Sonâmbulo (sonambulo), de camisola, olhos fechados, braços para a frente; não enxerga: segue o barulho (golpe,
     corrida, pulo; ps1Ruido) e perde o herói se ele ficar parado. Levanta os braços murmurando (1 s) e agarra:
     segura e aperta até o herói bater nele (psAgarrar, o 306 prende);
   - O Que Corre Atrás (perseguidor), de quatro, cinza e comprido; corre na velocidade do herói, um pouco mais, e
     atravessa as portas de par atrás dele (o 306 o leva). A respiração fica alta e ele se estica (0,6 s): bote curto
     a 2 blocos;
   - o Homem Alto (homemalto) só anda quando o herói está de costas para ele (ou longe de um espelho de parede, onde ele
     se vê e para); olhando, fica parado como móvel. Inclina a cabeça com um rangido (0,7 s) e varre com o braço
     comprido demais;
   - a Porta Faminta (portafaminta) é uma porta na parede de fundo, igual às outras, e não sai do lugar. A maçaneta
     gira e sai luz por baixo (0,8 s); a porta abre e um braço puxa o herói para perto, mordendo;
   - as Bonecas de Porcelana (bonecas) andam em grupos de 5 em quadros soltos: somem e aparecem 1 bloco à frente, só
     com o herói longe ou de costas. As cabeças giram para trás com um estalo (0,5 s): pulam e mordem. O grupo conta
     como 1 no máximo de monstros (ps1Spawn).
   O 305 põe o nível e as tabelas de spawn. O pincel é o do 55 (cp, contorno, cache), rampas de 7 tons com luz de
   cima à esquerda. Materiais e bases do 308 (filtrados). Prefixo ps1. */

Object.assign(ET, {
  sonambulo: { name: 'Sonâmbulo', w: 9, h: 22, hp: 160, dmg: 26, xp: 40, kb: 0.6, fly: false, blood: '#dcd6e4' },
  perseguidor: { name: 'O Que Corre Atrás', w: 18, h: 10, hp: 90, dmg: 22, xp: 34, kb: 0.8, fly: false, blood: '#8a8890' },
  homemalto: { name: 'Homem Alto', w: 9, h: 32, hp: 200, dmg: 30, xp: 48, kb: 0.3, fly: false, blood: '#4a4652' },
  portafaminta: { name: 'Porta Faminta', w: 20, h: 36, hp: 240, dmg: 28, xp: 46, kb: 0, fly: true, blood: '#6e4c36' },
  bonecas: { name: 'Boneca de Porcelana', w: 7, h: 12, hp: 22, dmg: 8, xp: 8, kb: 1, fly: false, blood: '#ece6e2' }
});
const PS1_TYPES = ['sonambulo', 'perseguidor', 'homemalto', 'portafaminta', 'bonecas'];
const PS1_DROPS = {
  sonambulo: [['po_de_sono', 0.45], ['min_onirita', 0.04], ['pocao', 0.07], ['pantufas_sonambulo', 0.036]],
  perseguidor: [['po_de_sono', 0.25], ['min_onirita', 0.04], ['pocao', 0.07], ['capuz_lencol', 0.036]],
  homemalto: [['ponteiro_mole', 0.2], ['min_onirita', 0.06], ['pocao', 0.1], ['tesoura_costura', 0.036]],
  portafaminta: [['corda_caixinha', 0.2], ['min_onirita', 0.06], ['pocao', 0.1], ['capuz_lencol', 0.036]],
  bonecas: [['porcelana', 0.35], ['min_onirita', 0.015], ['pocao', 0.03], ['tesoura_costura', 0.01]]
};
function ps1Tables() { for (const k of PS1_TYPES) DROPS[k] = PS1_DROPS[k].filter(([id]) => ITEMS[id]); }
ps1Tables();
Object.assign(NAV_WALKERS, { sonambulo: 1, perseguidor: 1, homemalto: 1 });
Object.assign(CV_STEP, { sonambulo: 1, perseguidor: 1, homemalto: 1, bonecas: 1 });

const PS1_BRACOS = 1.0, PS1_ESTICA = 0.6, PS1_INCLINA = 0.7, PS1_MACANETA = 0.8, PS1_ESTALO = 0.5;

/* ---------- o barulho do herói (o Sonâmbulo ouve): golpe, corrida, pulo, levar dano. As Pantufas do Sonâmbulo
   calam os passos ---------- */
const ps1Ruido = { x: 0, y: 0, t: -99 };
function ps1Ouve() {
  if (!pl || pl.dead) return;
  const quiet = typeof psPantufas === 'function' && psPantufas();
  const loud = gameTime - (pl.atkAt || -9) < 0.25 || gameTime - (pl.lastHurt || -9) < 0.3 || (!quiet && (Math.abs(pl.vx) > 70 || (!pl.onGround && pl.vy < -40)));
  if (loud) { ps1Ruido.x = pl.x + pl.w / 2; ps1Ruido.y = pl.y + pl.h / 2; ps1Ruido.t = gameTime; }
}

/* ================= arte ================= */
const PS1 = {};
{
const { cp } = CVB, { cg } = CVART;
const R7 = a => a.map(h => ph(h));
const PR = {
  pele: R7(['#3a3236', '#5e5458', '#8a7e80', '#b2a6a6', '#d0c6c4', '#e8e0dc', '#fbf6f2']),        // a pele pálida de quem dorme
  camisola: R7(['#3a3844', '#5a5866', '#7e7c8c', '#a4a2b0', '#c6c4d0', '#e2e0ea', '#fafaff']),
  cinza: R7(['#121216', '#22222a', '#36363e', '#4c4c56', '#64646e', '#7e7e88', '#9c9ca6']),      // O Que Corre Atrás
  terno: R7(['#060608', '#0e0e12', '#18181e', '#24242c', '#32323c', '#42424e', '#545462']),      // o Homem Alto
  porta: R7(['#1e140e', '#352418', '#503626', '#6e4c36', '#92684a', '#b88c66', '#dcb48a']),
  verniz: R7(['#1c0c08', '#341810', '#52261a', '#723626', '#944a34', '#b46246', '#d48060']),
  ouro: R7(['#2a1e0a', '#4a3612', '#7a5a1e', '#a8822e', '#d4ae4a', '#f4dc8a', '#fffad0']),
  porcelana: R7(['#5a5250', '#867c78', '#b0a6a0', '#d4ccc6', '#ece6e2', '#faf6f4', '#ffffff']),
  vestido: R7(['#2a0e1a', '#48182c', '#6e2842', '#963e5c', '#ba5a7a', '#d888a0', '#f4bcc8']),
  cabelo: R7(['#1a0e06', '#2e1a0c', '#4a2c14', '#6a4220', '#8e5c2e', '#b07a40', '#d4a060']),
  boca: R7(['#0a0204', '#1e0608', '#3a0c10', '#5e1418', '#8a2024', '#b43a3a', '#e07070'])
};
const setO = cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
// um tubo afinando (braços, pernas)
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
// polígono cheio
function poly(P, pts, R, f) {
  let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const py = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= py) !== (by <= py)) xs.push(ax + (py - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) P.put(x, y, R, f(x, y));
  }
}

/* ---------- o Sonâmbulo, 22 x 28 (o corpo no x 10, os pés na linha 27) ----------
   poses: 0-1 andando de braços estendidos, 2 os braços levantados (o aviso), 3 o bote (braços abertos), 4 segurando */
const SN = [
  { arm: [[17, 12], [18, 13]], lean: 0.6, step: 1 }, { arm: [[17, 13], [18, 12]], lean: 0.6, step: -1 },
  { arm: [[15, 3], [17, 4]], lean: -0.3, step: 0 }, { arm: [[20, 9], [21, 15]], lean: 1.4, step: 1 }, { arm: [[15, 12], [16, 14]], lean: 0.4, step: 0 }
];
function sonambulo(k) {
  const o = SN[k], P = cp(24, 28), s = 30301 + k * 5, cx = 10 + o.lean;
  // a perna de trás e o braço de trás, mais escuros
  tubo(P, cx - 0.5, 19, cx - 1 - o.step * 1.5, 26.5, 1, 0.9, PR.pele, 1.8, s);
  tubo(P, cx + 0.5, 9.5, o.arm[1][0], o.arm[1][1], 0.9, 0.8, PR.pele, 2, s + 1);
  // a camisola comprida até a canela, as pregas
  poly(P, [[cx - 2.6, 8.6], [cx + 2.4, 8.6], [cx + 4.2, 23.5], [cx - 4.6, 23.5]], PR.camisola, (x, y) => 3.4 - (x - cx) * 0.18 + (Math.abs(Math.sin(x * 1.4 + y * 0.12)) < 0.28 ? -1 : 0) - (y > 22 ? 0.6 : 0) + cg(x, y, s) * 0.3);
  tubo(P, cx + 0.5, 22, cx + 1 + o.step * 1.5, 26.5, 0.9, 0.8, PR.pele, 3, s + 2);
  P.line(cx + 0.5 + o.step * 1.5, 27, cx + 2.6 + o.step * 1.5, 27, PR.pele, 3.4);
  // a cabeça caída um pouco para a frente, o cabelo bagunçado, os olhos fechados (dois tracinhos)
  P.blob(cx + 0.8, 5.2, 2.8, 3.2, PR.pele, s + 3, 3.8);
  for (let x = cx - 2.4; x <= cx + 2; x += 0.5) P.put(x, 2.4 + Math.sin(x * 2.1) * 0.6, PR.cabelo, 3);
  for (let y = 2.5; y < 7; y += 0.5) P.put(cx - 2.2, y, PR.cabelo, 2.2);
  P.put(cx + 2, 5, PR.pele, 1.2); P.put(cx + 2.6, 5, PR.pele, 1.2); P.put(cx + 2.6, 7, PR.pele, 1.8);
  // o braço da frente estendido
  tubo(P, cx + 1, 9.6, o.arm[0][0], o.arm[0][1], 1, 0.85, PR.pele, 3.4, s + 4);
  return setO(P.done());
}

/* ---------- O Que Corre Atrás, 30 x 16 (o corpo no x 14, os pés na linha 15) ----------
   poses: 0 agachado, 1-2 correndo, 3 esticado (o aviso), 4 o bote */
const PG = [
  { sp: 0, low: 1.5, head: [24, 6], f: [[20, 15], [8, 15]], b: [[18, 15], [6, 15]] },
  { sp: 1, low: 0, head: [25, 5], f: [[24, 14], [3, 13]], b: [[16, 15], [10, 15]] },
  { sp: -1, low: 0.5, head: [25, 6], f: [[17, 15], [11, 14]], b: [[22, 13], [4, 15]] },
  { sp: 0, low: -1, head: [27, 4], f: [[22, 15], [5, 15]], b: [[20, 15], [3, 15]] },
  { sp: 2, low: 0, head: [28, 7], f: [[28, 11], [2, 12]], b: [[26, 12], [4, 13]] }
];
function perseguidor(k) {
  const o = PG[k], P = cp(30, 16), s = 30311 + k * 5, by = 7 + o.low;
  // os membros de trás (longe) mais escuros
  for (const [fx, fy] of o.b) { const hx = fx > 14 ? 19 : 9; tubo(P, hx, by + 1, (hx + fx) / 2 + (fx > hx ? -1 : 1), by - 2, 0.8, 0.7, PR.cinza, 1.6, s); tubo(P, (hx + fx) / 2 + (fx > hx ? -1 : 1), by - 2, fx, fy, 0.7, 0.6, PR.cinza, 1.6, s + 1); }
  // o corpo comprido e magro, as costelas
  P.blob(14, by, 8.4, 2.6, PR.cinza, s + 2, 3.2, (x, y) => (x % 2 === 0 && y > by - 1 && x > 9 && x < 19 ? -0.8 : 0));
  for (let x = 6; x < 22; x += 2) P.put(x, by - 2.4, PR.cinza, 4.6);   // a espinha
  // a cabeça baixa, comprida, sem nariz, a boca riscada
  P.blob(o.head[0], o.head[1] + by - 7, 3, 2.2, PR.cinza, s + 3, 3.8);
  P.line(o.head[0] + 0.5, o.head[1] + by - 6, o.head[0] + 3, o.head[1] + by - 6.5, PR.boca, 2);
  P.put(o.head[0] + 1.5, o.head[1] + by - 8, PR.pele, 6);   // o olho branco
  for (const [fx, fy] of o.f) { const hx = fx > 14 ? 20 : 8; tubo(P, hx, by + 1, (hx + fx) / 2 + (fx > hx ? -1.4 : 1.4), by - 3, 0.9, 0.8, PR.cinza, 3, s + 4); tubo(P, (hx + fx) / 2 + (fx > hx ? -1.4 : 1.4), by - 3, fx, fy, 0.8, 0.6, PR.cinza, 3, s + 5); P.put(fx + 1, fy, PR.cinza, 4); }
  return setO(P.done());
}

/* ---------- o Homem Alto, 36 x 40 (o corpo no x 12, os pés na linha 39) ----------
   poses: 0 parado como móvel, 1-2 andando, 3 a cabeça inclinada (o aviso), 4 a varrida (o braço comprido estendido) */
const HA = [{ tilt: 0, step: 0, arm: [13, 30] }, { tilt: 0, step: 1, arm: [14, 30] }, { tilt: 0, step: -1, arm: [12, 30] }, { tilt: 1, step: 0, arm: [6, 12] }, { tilt: 0.4, step: 1, arm: [35, 20] }];
function homemAlto(k) {
  const o = HA[k], P = cp(36, 40), s = 30321 + k * 5, cx = 12;
  // as pernas finas e compridas, a calça escura
  tubo(P, cx - 0.6, 24, cx - 1 - o.step * 2, 38.5, 1, 0.8, PR.terno, 1.6, s);
  tubo(P, cx + 0.6, 24, cx + 1 + o.step * 2, 38.5, 1, 0.8, PR.terno, 3, s + 1);
  P.line(cx + 1 + o.step * 2, 39, cx + 3.6 + o.step * 2, 39, PR.terno, 4);
  // o terno estreito, ombros altos
  poly(P, [[cx - 3, 9], [cx + 3, 9], [cx + 2.4, 25], [cx - 2.6, 25]], PR.terno, (x, y) => 3 - (x - cx) * 0.3 + (x === cx ? 1.2 : 0) + cg(x, y, s) * 0.3);
  P.put(cx, 10, PR.pele, 6); P.put(cx, 11, PR.pele, 5);   // a camisa branca
  // a cabeça pequena demais, careca, sem expressão, inclinada no aviso
  const hx = cx + o.tilt * 2, hy = 5.5 + o.tilt;
  P.blob(hx, hy, 2.2, 3, PR.pele, s + 2, 3.2);
  P.put(hx + 1.2, hy - 0.4, PR.terno, 0.8); P.put(hx + 1.2, hy + 1.6, PR.terno, 2);
  P.line(cx, 8, hx, hy + 2.4, PR.pele, 2.6);   // o pescoço comprido
  // o braço comprido demais, até o joelho (na varrida, para a frente)
  tubo(P, cx + 1.5, 10, (cx + 1.5 + o.arm[0]) / 2 + 1, (10 + o.arm[1]) / 2, 0.8, 0.7, PR.terno, 2.6, s + 3);
  tubo(P, (cx + 1.5 + o.arm[0]) / 2 + 1, (10 + o.arm[1]) / 2, o.arm[0], o.arm[1], 0.7, 0.6, PR.terno, 2.8, s + 4);
  for (let f = 0; f < 3; f++) P.line(o.arm[0], o.arm[1], o.arm[0] + (o.arm[0] > cx + 6 ? 2.4 : 0.4 * (f - 1)), o.arm[1] + (o.arm[0] > cx + 6 ? f - 1 : 2.6), PR.pele, 2.4);   // os dedos compridos
  return setO(P.done());
}

/* ---------- a Porta Faminta, 26 x 40 (a porta inteira; a base na linha 39) ----------
   0 fechada (igual às outras), 1 a maçaneta girando e luz por baixo (o aviso), 2 aberta: o escuro e a boca de dentes */
function portaFaminta(k) {
  const P = cp(26, 40), s = 30331 + k, R = PR.verniz;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 26; x++) if (x < 2 || x > 23 || y < 2) P.put(x, y, PR.porta, (x < 2 || y < 2 ? 4 : 2.6) + cg(x, y, s) * 0.3);
  if (k < 2) {
    for (let y = 2; y < 40; y++) for (let x = 2; x < 24; x++) P.put(x, y, R, 3 + (x === 2 ? 0.8 : x === 23 ? -0.9 : 0) + cg(x, y, s) * 0.35);
    for (const [x0, y0, h] of [[5, 5, 13], [14, 5, 13], [5, 22, 14], [14, 22, 14]]) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + 7; x++) if (x === x0 || y === y0) P.put(x, y, R, 1.4); else if (x === x0 + 6 || y === y0 + h - 1) P.put(x, y, R, 4.4);
    if (k === 0) P.blob(20, 21, 1.4, 1.4, PR.ouro, s, 4);
    else { P.line(19, 21, 21.5, 22.5, PR.ouro, 4.6); P.put(20, 21, PR.ouro, 5.6); }   // a maçaneta girada
  } else {
    // aberta: a folha virada para o lado (fina), o vão preto e, dentro, a boca de dentes
    for (let y = 2; y < 40; y++) for (let x = 2; x < 6; x++) P.put(x, y, R, 2 + (x === 2 ? 1.4 : 0));
    for (let y = 2; y < 40; y++) for (let x = 6; x < 24; x++) P.put(x, y, PR.boca, 0.3 + (y > 36 ? 0.4 : 0));
    for (let i = 0; i < 6; i++) { const x = 8 + i * 2.8; for (let j = 0; j < 4; j++) { P.put(x + j * 0.3, 14 + j, PR.porcelana, 5 - j * 0.6); P.put(x + j * 0.3, 30 - j, PR.porcelana, 4.6 - j * 0.6); } }
    for (let x = 8; x < 23; x++) P.put(x, 22 + Math.sin(x * 0.8) * 1.5, PR.boca, 3.4);   // a língua
  }
  return setO(P.done());
}

/* ---------- a Boneca de Porcelana, 12 x 14 (o corpo no x 5, os pés na linha 13) ----------
   0 em pé (rosto para a frente), 1 a cabeça girada para trás (o aviso: a nuca de cabelo e a fenda), 2 o pulo */
function boneca(k) {
  const P = cp(12, 14), s = 30341 + k, cx = 5;
  if (k === 2) { tubo(P, cx - 0.5, 9, cx - 3, 12, 0.6, 0.5, PR.porcelana, 3.4, s); tubo(P, cx + 0.5, 9, cx + 3, 11, 0.6, 0.5, PR.porcelana, 4, s); }
  else { P.line(cx - 1, 10, cx - 1, 13, PR.porcelana, 3.6); P.line(cx + 1, 10, cx + 1, 13, PR.porcelana, 4.4); }
  poly(P, [[cx - 1.8, 5.5], [cx + 1.8, 5.5], [cx + 3.2, 10.5], [cx - 3.2, 10.5]], PR.vestido, (x, y) => 3.4 - (x - cx) * 0.4 + (y === 10 ? 1.4 : 0) + cg(x, y, s) * 0.3);
  for (let x = cx - 3; x <= cx + 3; x += 2) P.put(x, 10.5, PR.camisola, 5.4);   // a renda
  if (k === 2) { P.line(cx - 1.4, 6, cx - 3, 2.4, PR.porcelana, 4); P.line(cx + 1.4, 6, cx + 3, 2.4, PR.porcelana, 4.4); }
  else { P.line(cx - 1.6, 6, cx - 2.2, 9, PR.porcelana, 4); P.line(cx + 1.6, 6, cx + 2.2, 9, PR.porcelana, 4.6); }
  P.blob(cx, 3, 2.4, 2.6, PR.porcelana, s + 1, 4.4);
  if (k === 1) {   // de costas: o cabelo inteiro, e a rachadura atravessando a nuca
    P.blob(cx, 2.6, 2.6, 2.6, PR.cabelo, s + 2, 3.6);
    P.line(cx - 1, 1, cx + 1, 4.6, PR.boca, 1.6);
  } else {
    for (let x = cx - 2.4; x <= cx + 2.4; x += 0.5) P.put(x, 0.8 + Math.abs(x - cx) * 0.3, PR.cabelo, 3.4);
    P.put(cx + 1, 2.8, PR.terno, 0.6); P.put(cx - 0.6, 2.8, PR.terno, 0.6);   // os olhos pretos de vidro
    P.put(cx + 0.4, 4.2, PR.vestido, 4.6);   // a boquinha pintada
    P.put(cx + 1.6, 3.6, PR.vestido, 5.6);   // a bochecha
  }
  return setO(P.done());
}

PS1.get = () => PS1.ready || (PS1.ready = {
  sn: SN.map((_, k) => sonambulo(k)), pg: PG.map((_, k) => perseguidor(k)), ha: HA.map((_, k) => homemAlto(k)),
  pf: [0, 1, 2].map(portaFaminta), bo: [0, 1, 2].map(boneca)
});
PS1.GL = { luz: glow(14, '#ffd27a'), olho: glow(5, '#e8f0ff'), boca: glow(10, '#ff6a4a'), frio: glow(8, '#dcf0f4') };
PS1.SN = SN; PS1.HA = HA; PS1.tubo = tubo; PS1.poly = poly; PS1.PR = PR; PS1.setO = setO;
}

/* ================= desenho ================= */
function ps1Blit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const ps1Jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
const ps1Pt = (e, x, y, bx, by) => [e.x + e.w / 2 + (x - bx) * e.facing, e.y + e.h - 1 - (by - y)];

const ps1SnPose = e => e.state === 'raise' ? 2 : e.state === 'lunge' ? 3 : e.state === 'hold' ? 4 : e.onGround && Math.abs(e.vx) > 3 ? Math.floor(e.t * 3) % 2 : 0;
DRAW_E.sonambulo = (e, fx, fy, fl) => ps1Blit(cvPick(PS1.get().sn[ps1SnPose(e)], e, fl), e, fx, fy, 11, 29, ps1Jit(e, e.state === 'raise', 20));
EYES_E.sonambulo = () => {};
WARN_E.sonambulo = e => e.state === 'raise';

const ps1PgPose = e => e.state === 'stretch' ? 3 : e.state === 'pounce' ? 4 : e.onGround && Math.abs(e.vx) > 8 ? 1 + Math.floor(e.t * (Math.abs(e.vx) > 90 ? 14 : 8)) % 2 : 0;
DRAW_E.perseguidor = (e, fx, fy, fl) => { if (e.psHide > 0) return; ps1Blit(cvPick(PS1.get().pg[ps1PgPose(e)], e, fl), e, fx, fy, 15, 17, ps1Jit(e, e.state === 'stretch', 30)); };
EYES_E.perseguidor = (e, fx, fy) => { if (e.psHide > 0) return; const o = [24, 25, 25, 27, 28][ps1PgPose(e)]; lc.globalAlpha = 0.35; lc.drawImage(PS1.GL.olho, Math.round(fx + (o + 1.5 - 14) * e.facing) - 5, fy - 12 - 5); };
WARN_E.perseguidor = e => e.state === 'stretch';

const ps1HaPose = e => e.state === 'tilt' ? 3 : e.state === 'sweep' ? 4 : e.onGround && Math.abs(e.vx) > 3 ? 1 + Math.floor(e.t * 4) % 2 : 0;
DRAW_E.homemalto = (e, fx, fy, fl) => ps1Blit(cvPick(PS1.get().ha[ps1HaPose(e)], e, fl), e, fx, fy, 13, 41, ps1Jit(e, e.state === 'tilt', 18));
EYES_E.homemalto = () => {};
WARN_E.homemalto = e => e.state === 'tilt';

const ps1PfPose = e => e.state === 'turn' ? 1 : e.state === 'bite' || e.state === 'pull' ? 2 : 0;
DRAW_E.portafaminta = (e, fx, fy, fl) => {
  const img = (fl ? PS1.get().pf[ps1PfPose(e)].wr : PS1.get().pf[ps1PfPose(e)].r);
  lc.drawImage(img, Math.round(fx - 14), fy - 41);
  if (e.state === 'pull' && e.armTo) {   // o braço comprido saindo do escuro até o herói
    const ax = Math.round(fx), ay = fy - 20, bx = Math.round(e.armTo[0] - (e.x + e.w / 2) + fx), by = Math.round(e.armTo[1] - (e.y + e.h) + fy);
    const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay)));
    for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(ax + (bx - ax) * t), y = Math.round(ay + (by - ay) * t + Math.sin(t * 9 + e.t * 6) * 1.2); lc.fillStyle = '#1a1416'; lc.fillRect(x, y - 1, 1, 3); lc.fillStyle = '#5e5458'; lc.fillRect(x, y - 1, 1, 1); }
    lc.fillStyle = '#b2a6a6'; lc.fillRect(bx - 2, by - 2, 4, 3); lc.fillStyle = '#e8e0dc'; lc.fillRect(bx - 2, by - 2, 1, 1);
  }
};
EYES_E.portafaminta = (e, fx, fy) => {
  if (e.state === 'turn') { const q = clamp(1 - e.stateT / PS1_MACANETA, 0, 1); lc.globalAlpha = 0.25 + 0.5 * q; lc.drawImage(PS1.GL.luz, Math.round(fx) - 14, fy - 14); }
  else if (e.state === 'bite' || e.state === 'pull') { lc.globalAlpha = 0.45; lc.drawImage(PS1.GL.boca, Math.round(fx) - 10, fy - 30); }
};
WARN_E.portafaminta = e => e.state === 'turn';
HOOK.drawTop.push((cx, cy) => {   // a luz por baixo da porta no aviso: uma faixa amarela no chão
  for (const e of enemies) {
    if (e.type !== 'portafaminta' || e.dead || e.state !== 'turn') continue;
    const q = clamp(1 - e.stateT / PS1_MACANETA, 0, 1), x = Math.round(e.x + e.w / 2 - cx) - 11, y = Math.round(e.y + e.h - cy) - 1;
    lc.globalAlpha = 0.4 + 0.5 * q; lc.fillStyle = '#ffd27a'; lc.fillRect(x, y, 22, 1); lc.fillStyle = '#fff0c0'; lc.fillRect(x + 4, y, 14, 1); lc.globalAlpha = 1;
  }
});

const ps1BoPose = e => e.state === 'snap' ? 1 : e.state === 'leap' ? 2 : 0;
DRAW_E.bonecas = (e, fx, fy, fl) => { if (e.psBlink > 0) return; ps1Blit(cvPick(PS1.get().bo[ps1BoPose(e)], e, fl), e, fx, fy, 6, 15); };
EYES_E.bonecas = () => {};
WARN_E.bonecas = e => e.state === 'snap';

/* ================= comportamento ================= */
const ps1Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const ps1Dust = (x, y, n, col = '#dcd6e4', sp = 40) => { for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), vx: rnd(-sp, sp), vy: rnd(-sp, sp * 0.4), g: 30, life: rnd(0.4, 0.8), max: 0.8, col, size: 1 }); };
// o herói de costas para e: virado para o outro lado
const ps1Costas = e => (pl.facing > 0) !== (e.x + e.w / 2 > pl.x + pl.w / 2);
// um espelho de parede perto de e (o Homem Alto se vê)
function ps1Espelho(e, r = 5 * T) {
  if (typeof visProps === 'undefined') return false;
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  for (const p of visProps) if (p.def.espelho && Math.abs(p.X + p.w / 2 - ex) < r && Math.abs(p.Y + p.h / 2 - ey) < r) return true;
  return false;
}

/* ---------- o Sonâmbulo ---------- */
AI.sonambulo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'raise') {   // os braços sobem, o murmúrio
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) { e.state = 'lunge'; e.stateT = 0.3; e.vx = e.facing * 110; e.swingHit = false; sfx.ps1Agarra(Math.max(0.4, ps1Near(e))); }
    return;
  }
  if (e.state === 'lunge') {
    const hb = { x: e.facing > 0 ? ecx : ecx - 16, y: e.y + 4, w: 16, h: 14 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) {
      e.swingHit = true;
      const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') { psAgarrar(e, 3.5); e.state = 'hold'; e.stateT = 3.5; e.squeezeT = 0.9; return; }
    }
    e.vx = approach(e.vx, 0, 400 * dt);
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.6; }
    return;
  }
  if (e.state === 'hold') {   // segura e aperta até o herói bater (o 306 solta pl.psAgarraT)
    e.vx = 0; e.squeezeT -= dt;
    if (!(pl.psAgarraT > 0) || pl.psAgarraE !== e || pl.dead) { e.state = 'walk'; e.atkCD = 1.4; e.stun = 0.6; return; }
    pl.x = approach(pl.x, e.x + e.w / 2 + e.facing * 7 - pl.w / 2, 120 * dt);
    if (e.squeezeT <= 0) { e.squeezeT = 0.9; if (pl.invuln <= 0) rawDamage(Math.max(1, Math.round(armorTaken(e.dmg * 0.35))), e.facing); sfx.ps1Aperta(); }
    return;
  }
  e.state = 'walk';
  // não enxerga: só anda para onde ouviu barulho nos últimos 2,5 s
  const heard = gameTime - ps1Ruido.t < 2.5 && Math.abs(ps1Ruido.x - ecx) < 16 * T && Math.abs(ps1Ruido.y - (e.y + e.h / 2)) < 7 * T;
  let dir = 0;
  if (heard) { const ddx = wdx(Math.round((ps1Ruido.x - ecx) / T)) * T; dir = Math.abs(ddx) < 8 ? 0 : Math.sign(ddx); }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, heard ? 34 + (e.lvl || 1) * 0.4 : 14, 300, 250, dy, heard);
  if (dir) e.facing = dir;
  e.murmT = (e.murmT || 0) - dt; if (e.murmT <= 0) { e.murmT = 4 + Math.random() * 4; const v = ps1Near(e, 160); if (v > 0.1) sfx.ps1Murmura(v * 0.5); }
  if (heard && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 22 && Math.abs(dy) < 18) { e.state = 'raise'; e.stateT = PS1_BRACOS; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.ps1Murmura(Math.max(0.5, ps1Near(e)), 1.3); }
};

/* ---------- O Que Corre Atrás ---------- */
AI.perseguidor = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; if (e.psHide > 0) { e.psHide -= dt; e.vx = 0; return; }
  const ecx = e.x + e.w / 2;
  e.breathT = (e.breathT || 0) - dt;
  if (aggro && e.breathT <= 0) { e.breathT = Math.max(0.35, 1.4 - (1 - dist / 200) * 1); sfx.ps1Respira(Math.max(0.15, ps1Near(e, 260)) * 0.7); }
  if (e.state === 'stretch') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'pounce'; e.stateT = 0.32; e.vx = e.facing * 260; e.vy = -90; e.onGround = false; e.swingHit = false; sfx.ps1Bote(Math.max(0.4, ps1Near(e))); } return; }
  if (e.state === 'pounce') {
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.stateT <= 0 && e.onGround) { e.state = 'walk'; e.atkCD = 1 + Math.random() * 0.6; }
    return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 10 ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  // a velocidade exata do herói, um pouco mais
  const sp = aggro ? Math.max(70, Math.abs(pl.vx) * 1.06 + 8, (typeof PSPEED !== 'undefined' ? PSPEED : 90) * 0.92) : 30;
  walk(e, dt, dir, sp, 1200, 300, dy, aggro);
  if (dir) e.facing = dir;
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 2.4 * T && Math.abs(dy) < 14 && clearPath(e, pl)) { e.state = 'stretch'; e.stateT = PS1_ESTICA; e.facing = Math.sign(dx) || e.facing; sfx.ps1Respira(1, 1.6); }
};

/* ---------- o Homem Alto ---------- */
AI.homemalto = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'tilt') { e.vx = 0; if (e.stateT <= 0) { e.state = 'sweep'; e.stateT = 0.28; e.swingHit = false; sfx.ps1Varre(Math.max(0.4, ps1Near(e))); } return; }
  if (e.state === 'sweep') {
    const reach = 26, hb = { x: e.facing > 0 ? ecx : ecx - reach, y: e.y + 8, w: reach, h: e.h - 8 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.6 + Math.random() * 0.8; }
    return;
  }
  e.state = 'walk';
  // olhando para ele, ou com um espelho de parede perto: fica parado como móvel
  const frozen = aggro && (!ps1Costas(e) || ps1Espelho(e));
  let dir = 0;
  if (aggro) dir = frozen ? 0 : (Math.abs(dx) < 12 ? 0 : Math.sign(dx));
  else { cvWander(e, dt); dir = e.wander; }
  if (frozen) { e.vx = 0; return; }
  walk(e, dt, dir, aggro ? 52 + (e.lvl || 1) * 0.6 : 16, 900, 260, dy, aggro);
  if (dir) e.facing = dir;
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 26 && Math.abs(dy) < 22) { e.state = 'tilt'; e.stateT = PS1_INCLINA; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.ps1Rangido(Math.max(0.4, ps1Near(e))); }
};

/* ---------- a Porta Faminta: presa na parede de fundo ---------- */
AI.portafaminta = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.vx = 0; e.vy = 0;
  if (e.ax === undefined) { e.ax = e.x; e.ay = e.y; }
  e.x = e.ax; e.y = e.ay;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  if (e.state === 'turn') { if (e.stateT <= 0) { e.state = 'pull'; e.stateT = 0.5; e.swingHit = false; e.armTo = [pl.x + pl.w / 2, pl.y + pl.h / 2]; sfx.ps1PortaAbre(Math.max(0.4, ps1Near(e))); } return; }
  if (e.state === 'pull') {   // o braço vai até onde o herói estava; se pegar, puxa para a boca
    e.armTo[0] = approach(e.armTo[0], pl.x + pl.w / 2, 140 * dt); e.armTo[1] = approach(e.armTo[1], pl.y + pl.h / 2, 140 * dt);
    if (!e.swingHit && !pl.dead && Math.hypot(e.armTo[0] - pl.x - pl.w / 2, e.armTo[1] - pl.y - pl.h / 2) < 9) {
      e.swingHit = true;
      const r = hurtPlayer(Math.round(e.dmg * 0.5), ecx, e, false);
      if (r === 'hit') { pl.vx = Math.sign(ecx - pl.x - pl.w / 2) * 220; pl.vy = -60; e.state = 'bite'; e.stateT = 0.35; return; }
    }
    if (e.stateT <= 0) { e.state = 'shut'; e.stateT = 0.4; e.armTo = null; sfx.ps1PortaFecha(Math.max(0.3, ps1Near(e))); }
    return;
  }
  if (e.state === 'bite') {
    if (!pl.dead && Math.abs(pl.x + pl.w / 2 - ecx) < 18 && Math.abs(pl.y + pl.h / 2 - ecy) < 24 && !e.bit) { e.bit = true; hurtPlayer(e.dmg, ecx, e, false); sfx.ps1Morde(); }
    if (e.stateT <= 0) { e.state = 'shut'; e.stateT = 0.5; e.bit = false; e.armTo = null; sfx.ps1PortaFecha(Math.max(0.3, ps1Near(e))); }
    return;
  }
  if (e.state === 'shut') { if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.8 + Math.random(); } return; }
  e.state = 'walk';
  if (aggro && e.atkCD <= 0 && dist < 5.5 * T && Math.abs(dy) < 3 * T) { e.state = 'turn'; e.stateT = PS1_MACANETA; sfx.ps1Macaneta(Math.max(0.4, ps1Near(e))); }
};
// a porta não leva empurrão e só recebe golpe aberta ou no aviso (fechada é madeira: o golpe bate e volta)
BLOCK_E.portafaminta = e => e.state === 'walk' || e.state === 'shut';

/* ---------- as Bonecas de Porcelana: quadro a quadro ---------- */
AI.bonecas = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.psBlink = Math.max(0, (e.psBlink || 0) - dt);
  const ecx = e.x + e.w / 2;
  if (e.state === 'snap') { e.vx = 0; if (e.stateT <= 0) { e.state = 'leap'; e.stateT = 0.6; e.vy = -200; e.vx = e.facing * 120; e.onGround = false; e.swingHit = false; } return; }
  if (e.state === 'leap') {
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); sfx.ps1Morde(0.5); }
    if (e.onGround && e.stateT < 0.45) { e.state = 'walk'; e.vx = 0; e.atkCD = 1.4 + Math.random(); }
    return;
  }
  e.state = 'walk'; e.vx = 0;
  // só se mexem com o herói longe ou de costas: somem e aparecem um bloco à frente
  e.stepT = (e.stepT || 0) - dt;
  const may = !aggro || dist > 7 * T || ps1Costas(e);
  if (may && e.stepT <= 0 && e.onGround) {
    e.stepT = 0.45 + Math.random() * 0.35;
    const dir = aggro ? Math.sign(dx) || e.facing : (Math.random() < 0.5 ? -1 : 1), nx = e.x + dir * T;
    if (!rectSolid(nx, e.y, e.w, e.h) && solidAt(Math.floor((nx + e.w / 2) / T), Math.floor((e.y + e.h + 1) / T))) { e.x = nx; e.facing = dir; e.psBlink = 0.08; if (Math.random() < 0.3) sfx.ps1Passinho(ps1Near(e, 150) * 0.6); }
    else if (!rectSolid(nx, e.y - T, e.w, e.h) && solidAt(Math.floor((nx + e.w / 2) / T), Math.floor((e.y + e.h + 1 - T) / T))) { e.x = nx; e.y -= T; e.facing = dir; e.psBlink = 0.08; }
  }
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 3 * T && Math.abs(dy) < 16) { e.state = 'snap'; e.stateT = PS1_ESTALO; e.facing = Math.sign(dx) || e.facing; sfx.ps1Estalo(Math.max(0.4, ps1Near(e))); }
};

/* ---------- o bando de bonecas nasce junto e conta como 1; as portas famintas grudam na parede ---------- */
let ps1Bando = 0;
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || e.psBando || type !== 'bonecas' || ps1Bando) return e;
  ps1Bando++;
  try {
    e.psLead = true; e.psBando = e;
    for (let k = 1; k < 5; k++) {
      const x = px + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 10;
      if (rectSolid(x, py, e.w, e.h)) continue;
      const m = spawnEnemy('bonecas', x, py, zone); if (m) { m.psBando = e; m.psSeg = true; m.atkCD = 0.5 + k * 0.3; }
    }
  } finally { ps1Bando--; }
  return e;
}; }
{ const _ts = trySpawn; trySpawn = function () {
  // as bonecas que não lideram saem da conta do máximo enquanto o spawn decide
  const off = []; for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].psSeg && !enemies[i].dead) off.push(enemies.splice(i, 1)[0]);
  try { return _ts.apply(this, arguments); } finally { for (let i = off.length - 1; i >= 0; i--) enemies.push(off[i]); }
}; }
HOOK.update.push(ps1Ouve);

/* ---------- sons: nada de música, só a casa ---------- */
Object.assign(sfx, {
  ps1Murmura(v = 1, k = 1) { tone(140 * k, 0.7, 'sine', 0.025 * v, -20); tone(150 * k, 0.5, 'sine', 0.018 * v, 15, 0.25); noise(0.6, 0.02 * v, 500, 'bandpass', 0.05, 3); },
  ps1Agarra(v = 1) { noise(0.15, 0.08 * v, 900, 'bandpass', 0, 1.5); tone(110, 0.2, 'triangle', 0.05 * v, -30); },
  ps1Aperta() { noise(0.25, 0.05, 300, 'lowpass'); tone(80, 0.25, 'sine', 0.05, -20); },
  ps1Respira(v = 1, k = 1) { noise(0.35 * k, 0.05 * v, 900, 'bandpass', 0, 2); noise(0.3 * k, 0.04 * v, 600, 'bandpass', 0.38 * k, 2); },
  ps1Bote(v = 1) { noise(0.12, 0.09 * v, 1600, 'highpass'); tone(200, 0.12, 'sawtooth', 0.04 * v, -120); },
  ps1Rangido(v = 1) { tone(320, 0.6, 'sawtooth', 0.025 * v, -140); tone(330, 0.5, 'square', 0.012 * v, -150, 0.05); },
  ps1Varre(v = 1) { noise(0.22, 0.08 * v, 700, 'bandpass', 0, 0.8); },
  ps1Macaneta(v = 1) { tone(900, 0.06, 'square', 0.03 * v, -200); tone(700, 0.06, 'square', 0.03 * v, -200, 0.12); tone(1100, 0.05, 'square', 0.02 * v, 0, 0.3); },
  ps1PortaAbre(v = 1) { tone(180, 0.7, 'sawtooth', 0.03 * v, 120); noise(0.6, 0.02 * v, 400, 'lowpass'); },
  ps1PortaFecha(v = 1) { noise(0.12, 0.12 * v, 200, 'lowpass'); tone(70, 0.15, 'sine', 0.08 * v, -20); },
  ps1Morde(v = 1) { noise(0.08, 0.1 * v, 2400, 'bandpass', 0, 2); noise(0.08, 0.08 * v, 1800, 'bandpass', 0.09, 2); },
  ps1Estalo(v = 1) { noise(0.04, 0.12 * v, 4000, 'highpass'); tone(2400, 0.05, 'square', 0.02 * v, -1200, 0.02); },
  ps1Passinho(v = 1) { noise(0.03, 0.04 * v, 3000, 'highpass'); }
});
