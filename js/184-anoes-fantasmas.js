'use strict';

/* ================= os fantasmas dos anões (a Fortaleza dos Anões) =================
   Os quatro fantasmas de Brasafunda (docs/camadas/08-fortaleza-anoes.md, seções 6, 12 e 14). Azulados e meio
   transparentes (a rampa da runa acesa a uns 50%), barbas compridas; não sangram: soltam fiapos frios que sobem.
   Nenhum tem dano de contato: todo golpe tem aviso.
   - besteiroan, o Besteiro Fantasma: só existe nas seteiras (AN_SETEIRA, a lista anSlits do 185). Escolhe uma
     seteira da sala dele com vista para o herói, a fenda acende azul e se ouve o clique da besta (0,8 s); o virote
     atravessa 1 bloco de parede. Some e reaparece em outra seteira da mesma sala. Nascido longe de seteira (12
     blocos), some calado;
   - ferreirofant, o Ferreiro Fantasma: preso à bigorna de runas (o objeto an_bigorna_runas do 182 ou, sem ele, o
     bloco AN_BIGORNA). Flutua a até 8 blocos dela, atravessando parede; ergue o malho, a runa do malho brilha (0,7 s)
     e ele arremessa: o malho vai e volta como bumerangue (acerta na ida e na volta). Bigorna quebrada: ele se apaga;
   - barbaferro, o Barba-de-Ferro: atravessa a parede em linha reta até a carcaça de autômato mais perto
     (an_carcaca), deixando um rastro azul até ela (o aviso); 1,5 s dentro dela e a carcaça acorda como Soldado de
     Bronze (anSoldierAt do 183; o soldado leva e.anPossuido = true, que o 185 conta no máximo da faixa). O
     fantasma se gasta; morto o soldado, a carcaça não volta. Sem carcaça, só um toque gelado fraco (0,6 s de aviso);
   - juramentado, o Juramentado: guerreiro que anda no chão, sempre de frente, sem atravessar parede. Quando vê o
     herói, finca o machado e desenha o círculo de duelo (seção 14): 7 blocos de raio em volta dos dois; o herói não
     sai até um cair ou passarem 12 s (barreira desenhada, não bloco: o updatePlayer empurra de volta). Dentro, o
     círculo pulsa antes de cada golpe giratório. Some com a morte de um dos dois, no tempo, ou se o herói for
     levado longe (portal, teleporte).
   Pincel do 55 (cp, set, ramps), pintado uma vez e guardado; o 49 (BAL) escala os números de ET, por isso as Vidas
   e Danos aqui são os da ficha. Carrega depois do 183 e antes do 185. */

/* ---------- números ---------- */
Object.assign(ET, {
  besteiroan: { name: 'Besteiro Fantasma', w: 10, h: 14, hp: 45, dmg: 22, xp: 14, kb: 0.6, fly: true, phase: true, blood: '#7ad0f0' },
  ferreirofant: { name: 'Ferreiro Fantasma', w: 10, h: 16, hp: 70, dmg: 19, xp: 18, kb: 0.5, fly: true, phase: true, blood: '#7ad0f0' },
  barbaferro: { name: 'Barba-de-Ferro', w: 10, h: 15, hp: 60, dmg: 10, xp: 12, kb: 0.7, fly: true, phase: true, blood: '#7ad0f0' },
  juramentado: { name: 'Juramentado', w: 10, h: 18, hp: 150, dmg: 24, xp: 28, kb: 0.3, fly: false, blood: '#7ad0f0' }
});
const ANF_TYPES = ['besteiroan', 'ferreirofant', 'barbaferro', 'juramentado'];
// a barba de todos; a runa de vez em quando; as bases raras (o rollDrops multiplica equipamento por 0,1: 0,15 = 1,5%)
const ANF_DROPS = {
  besteiroan: [['barba_espectral', 0.4], ['runa_gravada', 0.12], ['pocao', 0.08], ['elmo_cla', 0.15]],
  ferreirofant: [['barba_espectral', 0.45], ['runa_gravada', 0.2], ['pocao', 0.08], ['elmo_cla', 0.15]],
  barbaferro: [['barba_espectral', 0.5], ['runa_gravada', 0.1], ['pocao', 0.06]],
  juramentado: [['barba_espectral', 0.55], ['runa_gravada', 0.15], ['pocao', 0.12], ['machado_cla', 0.15]]
};
function anfTables() { for (const k of ANF_TYPES) DROPS[k] = ANF_DROPS[k].filter(([id]) => ITEMS[id]); }
anfTables();
Object.assign(NAV_WALKERS, { juramentado: 1 });
Object.assign(CV_STEP, { juramentado: 1 });

const ANF_TELL = 0.8, ANF_RAISE = 0.7, ANF_POSSESS = 1.5, ANF_CHILL = 0.6, ANF_WIND = 0.7, ANF_SPIN = 0.45;
const ANF_SLIT_R = 12, ANF_ANVIL_R = 12, ANF_LEASH = 8 * T, ANF_CIRCLE_R = 7 * T, ANF_CIRCLE_T = 12;
const ANF_ALPHA = 0.55;   // o fantasma no mundo; por cima do escuro vai outra passada fraca (anfTop)

/* ================= arte ================= */
const ANF = {};
{
const { cp, set } = CVB;
const cg = CVART.cg;
const R6 = hexes => hexes.map(h => ph(h));
// a runa acesa (seção 12) e, para a roupa, a mesma rampa um degrau mais funda
const RR = {
  runa: R6(['#0e2a3a', '#145070', '#1e7aa8', '#3aa8d8', '#7ad0f0', '#d0f4ff']),
  veu: R6(['#08161f', '#0e2a3a', '#163f58', '#1e5a7e', '#2e7aa4', '#4a9cc4']),
  olho: R6(['#3aa8d8', '#7ad0f0', '#a8e4f8', '#d0f4ff', '#e8fbff', '#ffffff'])
};
const gp = (P, x, y, R, v, s) => P.put(x, y, R, v + cg(x | 0, y | 0, s) * 0.6);
function limb(P, x0, y0, x1, y1, r0, r1, R, v, s) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * t;
    for (let oy = -r; oy <= r + 0.01; oy += 0.5) for (let ox = -r; ox <= r + 0.01; ox += 0.5) if (ox * ox + oy * oy <= r * r + 0.1) P.put(x + ox, y + oy, R, v + (oy < 0 ? 0.7 : -0.5) + (ox < 0 ? 0.3 : 0) + cg(x + ox | 0, y + oy | 0, s) * 0.5);
  }
}
// a barba: do queixo (cx, y0) até y1, larga no meio, em mechas claras e escuras, pontas desfiadas; sway curva a ponta
function barba(P, cx, y0, y1, wid, sway, s, braid) {
  const L = y1 - y0;
  for (let y = Math.floor(y0); y <= y1; y++) {
    const t = (y - y0) / L, half = wid * (t < 0.25 ? 0.75 + t : 1 - (t - 0.25) * 0.85) + 0.3, c = cx + sway * t * t;
    for (let x = Math.floor(c - half); x <= c + half; x++) {
      const dx = (x + 0.5 - c) / half;
      if (t > 0.6 && hash2(x, y, s) < (t - 0.6) * 1.4 * Math.abs(dx) + (t > 0.9 ? 0.3 : 0)) continue;   // as pontas
      const mecha = Math.sin((x - c) * 2.3 + y * 0.35) > 0.35 ? 0.6 : -0.3;
      let v = 5.0 - Math.abs(dx) * 1.1 - t * 1.2 - dx * 0.4 + mecha;
      if (braid && (y - Math.floor(y0)) % 4 === 2 && Math.abs(dx) < 0.5) v = 2.2;   // os anéis de ferro na trança
      gp(P, x, y, RR.runa, v, s);
    }
  }
}
// a cabeça de anão virada para a direita: rosto largo, nariz grande, sobrancelha pesada; o olho é o ponto mais claro
function cabeca(P, hx, hy, s, elmo) {
  for (let y = Math.floor(hy - 3); y <= hy + 2; y++) for (let x = Math.floor(hx - 3); x <= hx + 2.6; x++) {   // o rosto, mais apagado que a barba
    const dx = (x + 0.5 - hx) / 3, dy = (y + 0.5 - hy) / 3; if (dx * dx + dy * dy > 1.1) continue;
    gp(P, x, y, RR.runa, 2.6 - dx * 0.7 - dy * 0.8, s);
  }
  gp(P, hx + 1, hy - 1.6, RR.runa, 4.2, s); gp(P, hx + 2, hy - 1.6, RR.runa, 4, s); gp(P, hx, hy - 1.4, RR.runa, 3.6, s);   // a sobrancelha pesada
  P.put(hx + 0.6, hy - 0.6, RR.runa, 0.4); P.put(hx + 1.6, hy - 0.6, RR.olho, 4.6);   // a órbita e o olho
  P.put(hx + 2.8, hy - 0.4, RR.runa, 3.4); P.put(hx + 3.4, hy + 0.4, RR.runa, 3.8); P.put(hx + 2.6, hy + 0.4, RR.runa, 3.2); P.put(hx + 3.2, hy + 1.2, RR.runa, 2.6);   // o nariz grande
  P.put(hx + 2.4, hy + 1.2, RR.runa, 0.8); P.put(hx - 1.6, hy + 0.2, RR.runa, 1.4);   // a sombra sob o nariz; a orelha
  for (let k = 0; k < 4; k++) gp(P, hx + 3 - k, hy + 1.8 + (k > 2 ? 0.8 : 0), RR.runa, 4.8 - k * 0.2, s + 1);   // o bigode caindo
  if (elmo === 'elmo') {   // elmo redondo de borda grossa, com nasal
    for (let y = hy - 4; y <= hy - 1; y++) for (let x = hx - 3.4; x <= hx + 3.2; x++) {
      const dx = (x + 0.5 - hx) / 3.4, dy = (y + 0.5 - (hy - 1)) / 3.4; if (dx * dx + dy * dy > 1.05) continue;
      gp(P, x, y, RR.runa, 3.4 - dx * 0.9 - dy * 1.1, s + 2);
    }
    for (let x = hx - 3.6; x <= hx + 3.4; x++) gp(P, x, hy - 1, RR.runa, x < hx ? 3.8 : 3, s + 3);
    P.put(hx + 2.2, hy, RR.runa, 3.6); P.put(hx + 2.2, hy + 0.8, RR.runa, 3);
  } else if (elmo === 'capuz') {   // o gorro de couro do besteiro, caindo na nuca
    for (let y = hy - 4; y <= hy + 1; y++) for (let x = hx - 3.8; x <= hx + 2.6; x++) {
      const dx = (x + 0.5 - hx) / 3.6, dy = (y + 0.5 - (hy - 1)) / 3.4; if (dx * dx + dy * dy > 1.05 || (dy > 0 && dx > -0.4)) continue;
      gp(P, x, y, RR.veu, 4 - dx * 0.8 - dy * 1.2, s + 2);
    }
  } else if (elmo === 'chifre') {   // o elmo de guerra do juramentado, com crista
    for (let y = hy - 4; y <= hy - 1; y++) for (let x = hx - 3.4; x <= hx + 3.2; x++) {
      const dx = (x + 0.5 - hx) / 3.4, dy = (y + 0.5 - (hy - 1)) / 3.4; if (dx * dx + dy * dy > 1.05) continue;
      gp(P, x, y, RR.runa, 3.6 - dx * 0.9 - dy * 1.1, s + 2);
    }
    for (let k = 0; k < 4; k++) P.put(hx - 1 + k * 0.4, hy - 5 - k * 0.5, RR.runa, 4.6 - k * 0.3);   // a crista
    for (let y = hy - 1; y <= hy + 1; y++) P.put(hx - 3, y, RR.runa, 2.4);   // a proteção da nuca
    P.put(hx + 2.2, hy, RR.runa, 3.8); P.put(hx + 2.2, hy + 0.8, RR.runa, 3.2); P.put(hx + 2.2, hy + 1.6, RR.runa, 2.6);
  } else {   // calvo: o ferreiro, a careca reluzindo
    P.put(hx - 0.6, hy - 2.4, RR.runa, 4.4); P.put(hx + 0.4, hy - 2.6, RR.runa, 4);
    for (let y = hy - 1; y <= hy + 1; y++) P.put(hx - 2.8, y, RR.runa, 3.6);   // o cabelo dos lados
  }
}
// o tronco largo (cota, avental ou túnica) e, para os que flutuam, a cauda de fumaça que some
function tronco(P, cx, y0, y1, half, s, R) {
  for (let y = y0; y <= y1; y++) for (let x = Math.floor(cx - half); x <= cx + half; x++) {
    const dx = (x + 0.5 - cx) / half; if (dx * dx > 1.1) continue;
    gp(P, x, y, R, 2.8 - dx * 1.2 - (y - y0) / (y1 - y0) * 0.7 + (y === y0 ? 0.6 : 0), s);
  }
}
function cauda(P, cx, y0, y1, half, ph, s) {
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / (y1 - y0), hw = half * (1 - t * 0.8) + 0.3, c = cx - t * 2 + Math.sin(t * 4 + ph) * t * 1.6;
    for (let x = Math.floor(c - hw); x <= c + hw; x++) { if (hash2(x, y, s) < t * 0.7) continue; gp(P, x, y, RR.veu, 2.6 - (x + 0.5 - c) / hw * 0.8 - t * 1.6, s); }
  }
}
function cinto(P, x0, x1, y, s) { for (let x = x0; x <= x1; x++) gp(P, x, y, RR.runa, x === Math.round((x0 + x1) / 2) ? 4.8 : 2, s); }

/* ---------- o Besteiro, 18 x 18 virado para a direita: só o busto aparece na seteira ----------
   0 parado com a besta no peito, 1 a besta erguida na altura do olho (o aviso e o tiro) */
function besteiro(pose) {
  const P = cp(18, 18), s = 18401 + pose * 7, ph = pose * 1.3, aim = pose === 1;
  cauda(P, 7, 13, 17, 4, ph, s);
  tronco(P, 7, 9, 13, 4, s + 1, RR.veu);
  cinto(P, 4, 10, 12, s + 2);
  limb(P, 5.4, 9.6, 6.6, 12.4, 1, 0.9, RR.veu, 2, s + 3);   // o braço de trás
  cabeca(P, 7.4, 5.6, s + 4, 'capuz');
  barba(P, 8.4, 7.6, 15, 2.4, -1.2, s + 5);
  // a besta: a coronha, o arco atravessado na frente e o virote
  const by = aim ? 5.6 : 10.6, bx = aim ? 9.4 : 8.6;
  P.line(bx - 3, by + (aim ? 0.6 : 1.4), bx + 6, by, RR.runa, 2.6);
  for (let k = -3; k <= 3; k++) P.put(bx + 6 - Math.abs(k) * 0.35, by + k, RR.runa, 3.6 - Math.abs(k) * 0.3);
  P.line(bx + 1, by - 0.6, bx + 7.6, by - 0.6, RR.runa, 4.6);
  limb(P, 8.4, 9.8, bx + 1.6, by + 0.8, 1, 0.9, RR.veu, 3.2, s + 6);   // o braço da frente
  P.put(bx + 1.6, by + 0.8, RR.runa, 3.8);
  return set(P.done());
}

/* ---------- o Ferreiro, 22 x 22: avental de couro, braços grossos, careca ----------
   0-1 flutuando com o malho baixo, 2 o malho erguido sobre a cabeça (o aviso), 3 o arremesso (mão à frente, vazia),
   4 de mão vazia esperando o malho voltar */
function malho(P, x, y, ang, s) {   // cabo e cabeça do malho; a runa da cabeça é o ponto claro
  const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  P.line(x, y, x + ux * 6, y + uy * 6, RR.veu, 3.4);
  for (let a = -2; a <= 2; a++) for (let b = -1.5; b <= 1.5; b++) P.put(x + ux * (7 + b) + nx * a, y + uy * (7 + b) + ny * a, RR.runa, 3.2 - b * 0.4 - a * 0.25 + cg(a + 9, b | 0, s) * 0.5);
  P.put(x + ux * 7, y + uy * 7, RR.olho, 4.4);
}
function ferreiro(pose) {
  const P = cp(22, 26), s = 18431 + pose * 7, ph = pose * 1.6, Y = 4;   // 4 linhas de folga em cima para o malho erguido
  cauda(P, 9, 15 + Y, 21 + Y, 4.6, ph, s);
  tronco(P, 9, 10 + Y, 15 + Y, 4.6, s + 1, RR.veu);
  for (let y = 11 + Y; y <= 17 + Y; y++) for (let x = 8; x <= 12; x++) if (y < 16 + Y || hash2(x, y, s) > 0.4) gp(P, x, y, RR.veu, 1.4 + (x === 8 ? 0.6 : 0), s + 2);   // o avental
  for (let x = 8; x <= 12; x++) P.put(x, 11 + Y, RR.runa, 2.6);   // a borda do avental
  const sh = [7, 11 + Y], sf = [11, 11 + Y];
  if (pose === 2) { limb(P, sh[0], sh[1], 8, 4 + Y, 1.3, 1.1, RR.veu, 2.2, s + 3); limb(P, sf[0], sf[1], 9.4, 4.6 + Y, 1.4, 1.2, RR.veu, 3, s + 6); malho(P, 8.6, 4 + Y, -Math.PI / 2 - 0.35, s); }
  else limb(P, sh[0], sh[1], 6.4, 14 + Y, 1.3, 1.1, RR.veu, 2, s + 3);
  cabeca(P, 10, 6.4 + Y, s + 4, 'calvo');
  barba(P, 11, 8.6 + Y, 18 + Y, 2.8, pose === 3 ? -2 : -0.8 - Math.sin(ph) * 0.6, s + 5, true);
  if (pose === 2) { /* os dois braços já estão no alto */ }
  else if (pose === 3) { limb(P, sf[0], sf[1], 15, 10 + Y, 1.4, 1.2, RR.veu, 3, s + 6); limb(P, 15, 10 + Y, 18.4, 8.6 + Y, 1.2, 1, RR.veu, 3.2, s + 7); }
  else if (pose === 4) { limb(P, sf[0], sf[1], 14, 13.4 + Y, 1.4, 1.2, RR.veu, 3, s + 6); limb(P, 14, 13.4 + Y, 16.6, 12 + Y, 1.2, 1, RR.veu, 3.2, s + 7); }
  else { limb(P, sf[0], sf[1], 13.6, 14.4 + Y, 1.4, 1.2, RR.veu, 3, s + 6); malho(P, 14, 15 + Y, -0.3 + Math.sin(ph) * 0.15, s); }
  return set(P.done());
}
// o malho voando, 11 x 11 em volta do centro (o desenho gira com transform)
function malhoSolto() { const P = cp(11, 11); malho(P, 1.4, 5.5, 0, 18461); return P.done(); }
// o virote fantasma, 10 x 3
function virote() {
  const P = cp(10, 3);
  P.line(1, 1, 7, 1, RR.runa, 3.4); P.put(8, 1, RR.runa, 5); P.put(9, 1, RR.olho, 4); P.put(8, 0, RR.runa, 3.6); P.put(8, 2, RR.runa, 2.6);
  P.put(0, 0, RR.runa, 4); P.put(0, 2, RR.runa, 3); P.put(1, 0, RR.runa, 3.2);
  return P.done();
}

/* ---------- o Barba-de-Ferro, 20 x 22: a barba trançada com anéis de ferro, maior que ele; braços estendidos ----------
   0-1 deslizando, 2 as mãos à frente, geladas (o aviso do toque) */
function barbaFerro(pose) {
  const P = cp(20, 22), s = 18471 + pose * 5, ph = pose * 1.9, reach = pose === 2;
  cauda(P, 8, 14, 21, 4, ph, s);
  tronco(P, 8, 9, 14, 4, s + 1, RR.veu);
  limb(P, 6, 10, reach ? 12 : 5.4, reach ? 9 : 13.6, 1, 0.9, RR.veu, 2, s + 2);
  cabeca(P, 9, 5.4, s + 3, 'elmo');
  barba(P, 10, 7.6, 21, 3.4, -2.4 - Math.sin(ph) * 1.4, s + 4, true);
  if (reach) { limb(P, 10, 10, 14.6, 9.4, 1.1, 1, RR.veu, 3.2, s + 5); for (const o of [-1, 0, 1]) P.line(14.6, 9.4, 17.6, 9.4 + o * 0.9, RR.runa, 4.4); }
  else limb(P, 10, 10, 12.4, 13.6 + Math.sin(ph) * 0.6, 1.1, 1, RR.veu, 3.2, s + 5);
  return set(P.done());
}

/* ---------- o Juramentado, 30 x 26: cota de malha, elmo com crista, o machado de duas mãos; pernas de verdade ----------
   0-3 andando, 4 parado, 5 fincando o machado (o círculo), 6 o machado puxado para trás (o aviso do giro),
   7 o giro (o machado esticado na horizontal; desenhado virando de lado a lado) */
function machado(P, x, y, ang, s) {
  const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  P.line(x - ux * 3, y - uy * 3, x + ux * 13, y + uy * 13, RR.veu, 3.4);
  P.line(x - ux * 3 + nx * 0.5, y - uy * 3 + ny * 0.5, x + ux * 13 + nx * 0.5, y + uy * 13 + ny * 0.5, RR.veu, 2.2);
  for (let a = -4; a <= 4; a += 0.5) for (let b = 0; b <= 5; b += 0.5) {   // a lâmina larga de um lado só, em meia-lua
    if (Math.abs(a) > 1.6 + b * 0.55) continue;
    P.put(x + ux * (10.5 + a) + nx * (0.8 + b), y + uy * (10.5 + a) + ny * (0.8 + b), RR.runa, 3.2 + (b > 4.2 ? 1.6 : 0) - a * 0.18 + cg(a * 2 + 9 | 0, b * 2 | 0, s) * 0.5);
  }
  for (let a = -1; a <= 1; a++) P.put(x + ux * (13.6 + a * 0.3) + nx * a, y + uy * (13.6 + a * 0.3) + ny * a, RR.runa, 3.8);   // a ponta do cabo
  P.put(x + ux * 10.5 + nx * 2.6, y + uy * 10.5 + ny * 2.6, RR.olho, 3.6);   // a runa da lâmina
}
function juramentado(pose) {
  const P = cp(34, 30), s = 18491 + pose * 7, walk = pose < 4, ox = 11;
  { const put0 = P.put; P.put = (x, y, R, v) => put0(x + 5, y + 4, R, v); }   // folga para o machado: tudo 5 à direita e 4 abaixo
  // as pernas: curtas e grossas, botas largas
  const L = walk ? [[-1.4, 0.4], [0.4, -1.2], [1.4, -0.4], [-0.4, 1.2]][pose] : pose === 7 ? [-1.6, 1.6] : [-1, 1];
  limb(P, ox - 1.2, 18, ox - 1.2 + L[0], 23.6, 1.3, 1.1, RR.veu, 1.8, s + 1); P.put(ox - 1 + L[0] + 1, 24.4, RR.veu, 2.4); P.put(ox - 2 + L[0], 24.4, RR.veu, 2);
  limb(P, ox + 1.2, 18, ox + 1.2 + L[1], 23.6, 1.3, 1.1, RR.veu, 2.6, s + 2); P.put(ox + 2.2 + L[1], 24.4, RR.veu, 3); P.put(ox + 1 + L[1], 24.4, RR.veu, 2.6);
  // a cota: túnica de malha até os joelhos (pontinhos de anel)
  for (let y = 10; y <= 19; y++) for (let x = ox - 4.6; x <= ox + 4.6; x++) {
    const dx = (x + 0.5 - ox) / 4.6; if (dx * dx > 1.05) continue;
    gp(P, x, y, RR.veu, 3.2 - dx * 1.2 - (y - 10) * 0.08 + ((x + y) % 2 ? 0.5 : -0.2), s + 3);
  }
  cinto(P, ox - 4, ox + 4, 15, s + 4);
  for (let x = ox - 4; x <= ox + 4; x++) gp(P, x, 10, RR.runa, 3.6, s + 5);   // a gola de couro
  const hx = ox + 0.6, hy = 6;
  let back, axe, hand;
  if (pose === 5) { back = [ox + 6, 15]; hand = [ox + 6.4, 14.6]; axe = [ox + 7, 13, Math.PI / 2 - 0.15]; }   // fincado no chão, as duas mãos no cabo
  else if (pose === 6) { back = [ox - 4.6, 7]; hand = [ox - 3.4, 7.6]; axe = [ox - 3, 8, -Math.PI + 0.7]; }      // puxado para trás do ombro
  else if (pose === 7) { back = [ox + 5.6, 12]; hand = [ox + 6.6, 12]; axe = [ox + 6, 12, -0.08]; }              // esticado, girando
  else { const sw = walk ? Math.sin(pose * Math.PI / 2) * 0.6 : 0; back = [ox + 3.4, 14 + sw]; hand = [ox + 4.6, 13.6 + sw]; axe = [ox + 4, 14 + sw, -1.15]; }   // no ombro
  limb(P, ox - 2.4, 11, back[0], back[1], 1.3, 1.1, RR.veu, 2, s + 6);
  machado(P, axe[0], axe[1], axe[2], s);
  cabeca(P, hx, hy, s + 7, 'chifre');
  barba(P, hx + 1, 8.2, 17.4, 2.8, pose === 7 ? -2.6 : -1, s + 8, false);
  limb(P, ox + 2.4, 11, hand[0], hand[1], 1.4, 1.2, RR.veu, 3.2, s + 9);
  P.put(hand[0], hand[1], RR.runa, 3.8);
  return set(P.done());
}
ANF.get = () => ANF.ready || (ANF.ready = {
  best: [0, 1].map(besteiro),
  ferr: [0, 1, 2, 3, 4].map(ferreiro),
  barb: [0, 1, 2].map(barbaFerro),
  jur: [0, 1, 2, 3, 4, 5, 6, 7].map(juramentado),
  malho: malhoSolto(), virote: virote()
});
ANF.GL = { olho: glow(4, '#a8e4f8'), runa: glow(8, '#3aa8d8'), grande: glow(20, '#1e7aa8'), fenda: glow(12, '#7ad0f0') };
ANF.RR = RR;
}

/* ================= desenho ================= */
const anfBob = e => Math.round(Math.sin(e.t * 2 + e.seed) * 1.2);
// o quadro de cada um (o mesmo serve à passada de cima)
function anfFrame(e) {
  const B = ANF.get(), st = e.state;
  if (e.type === 'besteiroan') return { set: B.best[st === 'tell' || st === 'shot' ? 1 : 0], ox: 9, oy: 16, bob: 0 };
  if (e.type === 'ferreirofant') return { set: B.ferr[st === 'raise' ? 2 : st === 'throw' ? (e.stateT > 0.75 ? 3 : 4) : st === 'catch' ? 4 : Math.floor(e.t * 2) % 2], ox: 11, oy: 24, bob: anfBob(e) };
  if (e.type === 'barbaferro') return { set: B.barb[st === 'chill' || st === 'touch' ? 2 : Math.floor(e.t * 2.5) % 2], ox: 10, oy: 19, bob: anfBob(e) };
  const k = st === 'plant' ? 5 : st === 'wind' ? 6 : st === 'spin' ? 7 : e.onGround && Math.abs(e.vx) > 3 ? Math.floor(e.t * 6) % 4 : 4;
  return { set: B.jur[k], ox: 17, oy: 29, bob: 0 };
}
// quão visível ele está agora (0..1): o besteiro aparece e some, o barba-de-ferro entra na carcaça, o ferreiro se apaga
function anfVis(e) { return e.vis === undefined ? 1 : e.vis; }
function anfFacing(e) { return e.type === 'juramentado' && e.state === 'spin' ? (Math.floor(e.t * 14) % 2 ? 1 : -1) * e.facing : e.facing; }
function anfDraw(e, fx, fy, fl, a) {
  const F = anfFrame(e), v = anfVis(e); if (v <= 0.01) return;
  const j = (e.state === 'tell' || e.state === 'raise' || e.state === 'chill' || e.state === 'wind') ? Math.round(Math.sin(e.t * 40) * 0.6) : 0;
  const img = cvPick(F.set, { facing: anfFacing(e) }, fl);
  const a0 = lc.globalAlpha; lc.globalAlpha = a0 * (fl ? 0.9 : a * v);
  const ox = anfFacing(e) > 0 ? F.ox : img.width - F.ox;
  lc.drawImage(img, fx - ox + j, fy - F.oy + F.bob);
  lc.globalAlpha = a0;
}
for (const t of ANF_TYPES) {
  DRAW_E[t] = (e, fx, fy, fl) => anfDraw(e, fx, fy, fl, ANF_ALPHA);
  EYES_E[t] = (e, fx, fy) => {
    const F = anfFrame(e), v = anfVis(e), hot = WARN_E[t](e);
    lc.globalAlpha = v * (hot ? 0.85 : 0.45);
    const hx = e.type === 'juramentado' ? 2 : e.type === 'ferreirofant' ? 1 : 1;
    const hy = e.type === 'besteiroan' ? 10 : e.type === 'ferreirofant' ? 14 : e.type === 'barbaferro' ? 14 : 19;
    lc.drawImage(ANF.GL.olho, fx + anfFacing(e) * hx - 4, fy - hy + F.bob - 4);
  };
}
WARN_E.besteiroan = e => e.state === 'tell';
WARN_E.ferreirofant = e => e.state === 'raise';
WARN_E.barbaferro = e => e.state === 'chill' || e.state === 'possess';
WARN_E.juramentado = e => e.state === 'wind' || e.state === 'plant';

/* ================= comportamento ================= */
const anfBolts = [], anfHammers = [];
let anfCircle = null;   // o círculo de duelo (um de cada vez): { x, y, r, t, life, owner, grow, pulse, touchA, touchT, fade }
// os fiapos frios: partículas próprias, desenhadas por cima do escuro (as de brilho do jogo têm halo de faísca, laranja)
const anfWisps = [];
const anfWisp = (x, y, n = 1, sp = 1) => { for (let i = 0; i < n && anfWisps.length < 320; i++) anfWisps.push({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), vx: rnd(-6, 6) * sp, vy: rnd(-22, -8) * sp, t: 0, life: 0.5 + Math.random() * 0.4, c: Math.random() < 0.3 ? 2 : Math.random() < 0.5 ? 1 : 0 }); };
const anfDrift = (e, tx, ty, sp, k) => { const d = Math.hypot(tx, ty) || 1, q = Math.min(1, k); e.vx = lerp(e.vx, tx / d * sp, q); e.vy = lerp(e.vy, ty / d * sp, q); };

/* ---------- o Besteiro: as seteiras ---------- */
// quantos blocos sólidos a linha cruza fora a própria seteira (o virote passa 1)
function anfWallsOn(x0, y0, x1, y1, sx, sy) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 4); let w = 0, lx = -1e9, ly = -1e9;
  for (let i = 1; i < n; i++) {
    const t = i / n, cx = Math.floor((x0 + (x1 - x0) * t) / T), cy = Math.floor((y0 + (y1 - y0) * t) / T);
    if ((cx === sx && cy === sy) || (cx === lx && cy === ly)) continue;
    if (solidAt(cx, cy)) { w++; lx = cx; ly = cy; if (w > 1) return w; }
  }
  return w;
}
function anfSlitNear(px, py, r) {
  let best = null, bd = r * T;
  for (const s of anSlits) { const d = Math.hypot(wdx(s.x - Math.floor(px / T)) * T, (s.y + 0.5) * T - py); if (d < bd) { bd = d; best = s; } }
  return best;
}
function anfPickSlit(e) {
  const pcx = pl.x + pl.w / 2, pcy = pl.y + 9, ok = [];
  for (const s of anSlits) {
    if (s.room !== e.room) continue;
    const sx = (s.x + 0.5) * T, sy = (s.y + 0.5) * T, d = Math.hypot(pcx - sx, pcy - sy);
    if (d > 22 * T || d < 2 * T) continue;
    if (anfWallsOn(sx, sy, pcx, pcy, s.x, s.y) > 1) continue;
    ok.push(s);
  }
  if (!ok.length) return null;
  const other = ok.filter(s => s !== e.slit);
  const L = other.length ? other : ok;
  return L[(Math.random() * L.length) | 0];
}
function anfAt(e, s) { e.slit = s; e.x = (s.x + 0.5) * T - e.w / 2; e.y = (s.y + 0.5) * T - e.h / 2 - 1; e.vx = 0; e.vy = 0; }
AI.besteiroan = function (e, dt, dx, dy, dist) {
  e.stateT -= dt; e.vx = 0; e.vy = 0;
  if (e.slit) { e.x = (e.slit.x + 0.5) * T - e.w / 2; e.y = (e.slit.y + 0.5) * T - e.h / 2 - 1; }
  const pcx = pl.x + pl.w / 2, pcy = pl.y + 9;
  if (e.state === 'tell') {   // a fenda acende, o clique; ele toma forma e mira até o último instante
    e.vis = approach(e.vis, 1, dt / 0.35); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.15) e.aim = Math.atan2(pcy - (e.y + 6), pcx - (e.x + e.w / 2));
    if (Math.random() < dt * 10) anfWisp(e.x + e.w / 2, e.y + 4, 1, 0.5);
    if (e.stateT <= 0) {
      const ox = e.x + e.w / 2, oy = e.y + 6, a = e.aim, sp = 250;
      anfBolts.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, a, t: 0, dmg: e.dmg, sx: e.slit.x, sy: e.slit.y, walls: 0, lx: -1e9, ly: -1e9 });
      sfx.anfTwang(); e.state = 'shot'; e.stateT = 0.55;
    }
    return;
  }
  if (e.state === 'shot') { if (e.stateT <= 0) { e.state = 'fade'; e.stateT = 0.4; } return; }
  if (e.state === 'fade') { e.vis = approach(e.vis, 0, dt / 0.4); if (e.stateT <= 0) { e.vis = 0; e.state = 'hidden'; e.stateT = 1.2 + Math.random(); } return; }
  // escondido: espera, escolhe outra seteira da sala com vista para o herói
  e.state = 'hidden'; e.vis = approach(e.vis || 0, 0, dt * 3); e.showHp = 0;
  if (e.stateT > 0 || pl.dead || dist > 24 * T) return;
  const s = anfPickSlit(e);
  if (!s) { e.stateT = 0.6; return; }
  anfAt(e, s); e.state = 'tell'; e.stateT = ANF_TELL; e.facing = Math.sign(pcx - (s.x + 0.5) * T) || 1; e.aim = Math.atan2(pcy - (s.y + 0.5) * T, pcx - (s.x + 0.5) * T);
  sfx.anfClick();
};
// o virote: reto e rápido; passa um bloco de parede (fora a seteira de onde saiu) e se desfaz no segundo
function anfBoltTick(dt) {
  for (let i = anfBolts.length - 1; i >= 0; i--) {
    const b = anfBolts[i]; b.t += dt;
    const n = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 4)), sx = b.vx * dt / n, sy = b.vy * dt / n;
    let gone = b.t > 2;
    for (let k = 0; k < n && !gone; k++) {
      b.x += sx; b.y += sy;
      if (!pl.dead && b.x > pl.x - 1 && b.x < pl.x + pl.w + 1 && b.y > pl.y && b.y < pl.y + pl.h) { hurtPlayer(b.dmg, b.x - sx * 4, null, true); anfWisp(b.x, b.y, 5); gone = true; break; }
      const cx = Math.floor(b.x / T), cy = Math.floor(b.y / T);
      if ((cx !== b.sx || cy !== b.sy) && (cx !== b.lx || cy !== b.ly) && solidAt(cx, cy)) {
        b.walls++; b.lx = cx; b.ly = cy;
        if (b.walls > 1) { anfWisp(b.x - sx * 2, b.y - sy * 2, 6); sfx.anfFizz(); gone = true; }
        else anfWisp(b.x, b.y, 2, 0.6);   // atravessando
      }
    }
    if (gone) anfBolts.splice(i, 1);
  }
}

/* ---------- o Ferreiro: a bigorna ---------- */
function anfAnvilNear(px, py) {
  let best = null, bd = ANF_ANVIL_R * T;
  for (const p of PROPS) {
    if (p.gone || !p.def || p.def.id !== 'an_bigorna_runas') continue;
    const d = Math.hypot(p.X + p.w / 2 - px, p.Y + p.h / 2 - py); if (d < bd) { bd = d; best = { p, x: p.X + p.w / 2, y: p.Y + 2 }; }
  }
  if (best) return best;
  const tx = Math.floor(px / T), ty = Math.floor(py / T);
  for (let r = 0; r <= ANF_ANVIL_R; r++) for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
    if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r) continue;
    if (tileAt(x, y) === AN_BIGORNA) return { tx: x, ty: y, x: (x + 0.5) * T, y: y * T + 2 };
  }
  return null;
}
const anfAnvilGone = A => !A || (A.p ? A.p.gone : tileAt(A.tx, A.ty) !== AN_BIGORNA);
AI.ferreirofant = function (e, dt, dx, dy, dist) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, A = e.anvil, hunt = !pl.dead && dist < 210;
  if (e.state === 'vanish') {   // a bigorna se foi: ele se apaga
    e.vis = approach(e.vis, 0, dt / 0.9); e.vx *= Math.pow(0.1, dt); e.vy = -8;
    if (Math.random() < dt * 20) anfWisp(ecx, ecy, 1);
    if (e.stateT <= 0) { e.dead = true; e.despawn = true; anfWisp(ecx, ecy, 10); }
    return;
  }
  if (anfAnvilGone(A)) { e.state = 'vanish'; e.stateT = 0.9; sfx.anfSigh(0.8); for (const h of anfHammers) if (h.e === e) h.drop = true; return; }
  const hand = () => ({ x: ecx + e.facing * 6, y: e.y + 6 });
  if (e.state === 'raise') {   // o malho sobe, a runa dele brilha
    const k = Math.pow(0.05, dt); e.vx *= k; e.vy *= k; e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) {
      const h = hand(), pcx = pl.x + pl.w / 2, pcy = pl.y + 9, a = Math.atan2(pcy - h.y, pcx - h.x), L = clamp(dist + 24, 4 * T, 10 * T);
      anfHammers.push({ e, x: h.x, y: h.y, x0: h.x, y0: h.y, ux: Math.cos(a), uy: Math.sin(a), L, t: 0, out: true, spin: 0, hitOut: false, hitBack: false, dmg: e.dmg });
      e.state = 'throw'; e.stateT = 1; sfx.anfWhoosh();
    }
    return;
  }
  if (e.state === 'throw') { const k = Math.pow(0.2, dt); e.vx *= k; e.vy *= k; return; }   // espera o malho voltar (anfHammerTick o devolve)
  if (e.state === 'catch') { e.vx *= Math.pow(0.1, dt); e.vy *= Math.pow(0.1, dt); if (e.stateT <= 0) { e.state = 'float'; e.atkCD = 1.4 + Math.random() * 0.8; } return; }
  e.state = 'float';
  // onde: perto do herói, um pouco acima e de lado, mas nunca além da corrente da bigorna
  let tx, ty;
  if (hunt) { if (e.side === undefined || Math.random() < dt * 0.2) e.side = Math.sign(ecx - pl.x) || 1; tx = pl.x + pl.w / 2 + e.side * 46 - ecx; ty = pl.y - 14 + Math.sin(e.t * 0.8) * 6 - ecy; }
  else { tx = A.x + Math.cos(e.t * 0.3 + e.seed) * 40 - ecx; ty = A.y - 20 + Math.sin(e.t * 0.5 + e.seed) * 12 - ecy; }
  const gx = ecx + tx - A.x, gy = ecy + ty - A.y, gd = Math.hypot(gx, gy);
  if (gd > ANF_LEASH - 6) { tx = A.x + gx / gd * (ANF_LEASH - 6) - ecx; ty = A.y + gy / gd * (ANF_LEASH - 6) - ecy; }
  anfDrift(e, tx, ty, Math.min(36, Math.hypot(tx, ty) * 1.4), dt * 2);
  if (Math.abs(dx) > 3) e.facing = hunt ? Math.sign(dx) : Math.sign(e.vx) || e.facing;
  if (Math.random() < dt * 5) anfWisp(ecx - e.facing * 2, e.y + e.h + 2, 1, 0.4);
  const h = hand();
  if (hunt && e.atkCD <= 0 && dist < 9 * T && dist > 20 && losClear(h.x, h.y, pl.x + pl.w / 2, pl.y + 9)) { e.state = 'raise'; e.stateT = ANF_RAISE; sfx.anfRaise(); }
};
// a corrente invisível: depois de mover, ele nunca passa de 8 blocos da bigorna
function anfLeash() {
  for (const e of enemies) {
    if (e.dead || e.type !== 'ferreirofant' || !e.anvil) continue;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2, ddx = cx - e.anvil.x, ddy = cy - e.anvil.y, d = Math.hypot(ddx, ddy);
    if (d > ANF_LEASH) { e.x -= ddx / d * (d - ANF_LEASH); e.y -= ddy / d * (d - ANF_LEASH); }
  }
}
// o malho: sai freando até o fim do alcance e volta acelerando para a mão; acerta uma vez na ida e uma na volta
function anfHammerTick(dt) {
  for (let i = anfHammers.length - 1; i >= 0; i--) {
    const h = anfHammers[i], e = h.e; h.t += dt; h.spin += dt * 18;
    if (h.drop || e.dead || !enemies.includes(e)) { anfWisp(h.x, h.y, 6); anfHammers.splice(i, 1); continue; }
    if (h.out) {
      const k = clamp(h.t / 0.6, 0, 1), s = h.L * easeOut(k);
      h.x = h.x0 + h.ux * s; h.y = h.y0 + h.uy * s;
      if (k >= 1) { h.out = false; h.t = 0; }
    } else {
      const tx = e.x + e.w / 2 + e.facing * 6, ty = e.y + 6, ddx = tx - h.x, ddy = ty - h.y, d = Math.hypot(ddx, ddy), sp = Math.min(320, 60 + h.t * 420);
      if (d < 6) { anfHammers.splice(i, 1); e.state = 'catch'; e.stateT = 0.35; sfx.anfCatch(); continue; }
      h.x += ddx / d * Math.min(d, sp * dt); h.y += ddy / d * Math.min(d, sp * dt);
      if (h.t > 3) { h.x = tx; h.y = ty; }
    }
    if (Math.random() < dt * 30) anfWisp(h.x, h.y, 1, 0.3);
    const flag = h.out ? 'hitOut' : 'hitBack';
    if (!h[flag] && !pl.dead && overlap({ x: h.x - 5, y: h.y - 5, w: 10, h: 10 }, pl)) { h[flag] = true; hurtPlayer(h.dmg, h.x, null, true); anfWisp(h.x, h.y, 5); }
  }
}

/* ---------- o Barba-de-Ferro: as carcaças ---------- */
function anfCarcass(px, py, r) {
  let best = null, bd = r * T;
  for (const p of PROPS) {
    if (p.gone || !p.def || p.def.id !== 'an_carcaca' || (p.anfClaim && !p.anfClaim.dead && p.anfClaim !== null)) continue;
    const d = Math.hypot(p.X + p.w / 2 - px, p.Y + p.h / 2 - py); if (d < bd) { bd = d; best = p; }
  }
  return best;
}
function anfClaim(e, p) { if (e.carc && e.carc !== p && e.carc.anfClaim === e) e.carc.anfClaim = null; e.carc = p; if (p) { p.anfClaim = e; e.trail = []; } }
// a carcaça acorda: some o objeto, nasce o soldado no mesmo lugar (pés no chão da carcaça); o fantasma se gasta
function anfWake(e) {
  const p = e.carc, D = ET.soldbronze;
  const w = D ? D.w : 10, h = D ? D.h : 22, px = p.X + p.w / 2 - w / 2, py = p.Y + p.h - h, zone = typeof zoneAt === 'function' ? zoneAt(Math.floor(px / T), Math.floor(py / T)) : 0;
  let s = null;
  if (typeof anSoldierAt === 'function') s = anSoldierAt(px, py, zone);
  else if (D && AI.soldbronze) s = spawnEnemy('soldbronze', px, py, zone);
  if (!s) return false;
  s.anPossuido = true;   // o 185 conta este soldado no máximo da faixa
  p.gone = true; propGone.add(p.key); propDirty(p); p.anfClaim = null;
  anfWisp(p.X + p.w / 2, p.Y + p.h / 2, 18, 1.6); shake(2); sfx.anfWake();
  e.dead = true; e.despawn = true;
  return true;
}
AI.barbaferro = function (e, dt, dx, dy, dist) {
  e.stateT -= dt; e.lookT = (e.lookT || 0) - dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  if (e.state === 'possess') {   // dentro da carcaça: 1,5 s e ela acorda
    const p = e.carc;
    if (!p || p.gone) { anfClaim(e, null); e.state = 'roam'; e.vis = 1; return; }
    const cx = p.X + p.w / 2, cy = p.Y + p.h / 2;
    e.x = lerp(e.x, cx - e.w / 2, Math.min(1, dt * 6)); e.y = lerp(e.y, cy - e.h / 2, Math.min(1, dt * 6)); e.vx = 0; e.vy = 0;
    e.vis = clamp(e.stateT / ANF_POSSESS, 0.25, 1);
    if (Math.random() < dt * 14) anfWisp(cx + rnd(-p.w / 2, p.w / 2), cy + rnd(-4, 4), 1, 0.5);
    if (e.stateT <= 0 && !anfWake(e)) { anfClaim(e, null); e.state = 'roam'; e.vis = 1; e.lookT = 3; }
    return;
  }
  if (e.state === 'chill') {   // as mãos à frente, a geada juntando
    const k = Math.pow(0.03, dt); e.vx *= k; e.vy *= k; e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 18) anfWisp(ecx + e.facing * 8, e.y + 7, 1, 0.3);
    if (e.stateT <= 0) { e.state = 'touch'; e.stateT = 0.3; e.swingHit = false; const d = dist || 1; e.vx = dx / d * 120; e.vy = dy / d * 120; sfx.anfSigh(0.6); }
    return;
  }
  if (e.state === 'touch') {
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 3, y: e.y, w: e.w + 6, h: e.h }, pl)) { e.swingHit = true; if (hurtPlayer(e.dmg, ecx, e, false) === 'hit') anfWisp(pl.x + pl.w / 2, pl.y + 8, 6); }
    e.vx *= Math.pow(0.1, dt); e.vy *= Math.pow(0.1, dt);
    if (e.stateT <= 0) { e.state = 'roam'; e.retreat = 0.8; e.atkCD = 1.6 + Math.random() * 0.8; }
    return;
  }
  // indo para a carcaça: reto, atravessando a pedra, deixando o rastro
  if (e.carc && (e.carc.gone || (e.carc.anfClaim && e.carc.anfClaim !== e))) anfClaim(e, null);
  if (!e.carc && e.lookT <= 0) { e.lookT = 2; const p = anfCarcass(ecx, ecy, 40); if (p) { anfClaim(e, p); sfx.anfSigh(0.5); } }
  if (e.carc) {
    e.state = 'seek';
    const p = e.carc, tx = p.X + p.w / 2 - ecx, ty = p.Y + p.h / 2 - ecy, d = Math.hypot(tx, ty) || 1;
    e.vx = tx / d * 40; e.vy = ty / d * 40; e.facing = tx >= 0 ? 1 : -1;
    const tr = e.trail, last = tr[tr.length - 1];
    if (!last || Math.hypot(last.x - ecx, last.y - ecy) > 5) { tr.push({ x: ecx, y: ecy + 3, t: gameTime }); if (tr.length > 80) tr.shift(); }
    if (d < 5) { e.state = 'possess'; e.stateT = ANF_POSSESS; e.vx = 0; e.vy = 0; sfx.anfPossess(); }
    return;
  }
  // sozinho: atrás do herói, e o toque gelado
  e.state = 'roam';
  let tx, ty;
  if (e.retreat > 0) { e.retreat -= dt; tx = -Math.sign(dx) * 50; ty = -20; }
  else if (!pl.dead && dist < 200) { tx = dx; ty = dy - 4 + Math.sin(e.t * 1.3) * 8; }
  else { tx = Math.cos(e.t * 0.4 + e.seed) * 40; ty = Math.sin(e.t * 0.6 + e.seed) * 20; }
  anfDrift(e, tx, ty, !pl.dead && dist < 200 ? 30 : 12, dt * 1.6);
  if (Math.abs(e.vx) > 3) e.facing = Math.sign(e.vx);
  if (!pl.dead && e.atkCD <= 0 && e.retreat <= 0 && dist < 22) { e.state = 'chill'; e.stateT = ANF_CHILL; sfx.anfSigh(0.8); }
};

/* ---------- o Juramentado e o círculo de duelo ---------- */
function anfCircleEnd(fade = true) {
  const C = anfCircle; if (!C) return;
  if (C.owner) C.owner.circleCD = 6;
  anfCircle = null;
  if (fade) { anfFading.push({ x: C.x, y: C.y, r: C.r, t: 0 }); sfx.anfCircleOff(); }
}
const anfFading = [];
AI.juramentado = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.circleCD = (e.circleCD || 0) - dt;
  const ecx = e.x + e.w / 2, C = anfCircle, mine = C && C.owner === e;
  if (Math.random() < dt * 3) anfWisp(ecx + rnd(-4, 4), e.y + e.h - 2, 1, 0.3);
  if (e.state === 'plant') {   // finca o machado: o círculo se desenha em volta dos dois
    e.vx = approach(e.vx, 0, 800 * dt);
    if (e.stateT <= 0) {
      if (!anfCircle && !pl.dead) {
        const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
        anfCircle = { x: (ecx + pcx) / 2, y: (e.y + e.h / 2 + pcy) / 2, r: ANF_CIRCLE_R, t: 0, life: ANF_CIRCLE_T, owner: e, grow: 0, pulse: 1, touchA: 0, touchT: 0 };
        sfx.anfCircleOn();
      }
      e.state = 'recover'; e.stateT = 0.4;
    }
    return;
  }
  if (e.state === 'wind') {   // o machado vai para trás do ombro; o círculo pulsa
    e.vx = approach(e.vx, 0, 700 * dt); if (mine) C.pulse = Math.max(C.pulse, 1 - e.stateT / ANF_WIND);
    if (e.stateT <= 0) { e.state = 'spin'; e.stateT = ANF_SPIN; e.swingHit = false; sfx.anfSpin(); }
    return;
  }
  if (e.state === 'spin') {   // o giro: acerta dos dois lados
    e.vx = e.facing * 20;
    const k = 1 - e.stateT / ANF_SPIN;
    if (!e.swingHit && k > 0.25) { e.swingHit = true; const hb = { x: ecx - 26, y: e.y - 4, w: 52, h: e.h + 6 }; if (overlap(hb, pl) && clearPath(e, pl)) hurtPlayer(e.dmg, ecx, e, false); }
    if (Math.random() < dt * 40) anfWisp(ecx + Math.cos(e.t * 20) * 18, e.y + 9, 1, 0.4);
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.8 + Math.random() * 0.6); } return; }
  // andando: sempre de frente para onde vai (nunca de costas); parado, encara o herói
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) > 12 ? Math.sign(dx) : 0;
  else { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } dir = e.wander; }
  dir = walk(e, dt, dir, aggro ? 30 + e.lvl * 0.5 : 14, 300, 270, dy, aggro);
  if (dir) e.facing = dir; else if (aggro) e.facing = Math.sign(dx) || e.facing;
  if (!aggro || pl.dead || !e.onGround) return;
  if (!anfCircle && e.circleCD <= 0 && e.sees && dist < 6 * T) { e.state = 'plant'; e.stateT = 0.9; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.anfPlant(); return; }
  if (e.atkCD <= 0 && Math.abs(dx) < 26 && Math.abs(dy) < 22 && clearPath(e, pl)) { e.state = 'wind'; e.stateT = ANF_WIND; e.facing = Math.sign(dx) || e.facing; sfx.anfSigh(0.5); }
};
function anfCircleTick(dt) {
  const C = anfCircle;
  for (let i = anfFading.length - 1; i >= 0; i--) { anfFading[i].t += dt; if (anfFading[i].t > 0.6) anfFading.splice(i, 1); }
  if (!C) return;
  C.t += dt; C.grow = Math.min(1, C.grow + dt / 0.35); C.pulse = Math.max(0, C.pulse - dt * 1.6); C.touchT = Math.max(0, C.touchT - dt);
  const o = C.owner, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (!o || o.dead || !enemies.includes(o) || pl.dead || C.t > C.life || Math.hypot(pcx - C.x, pcy - C.y) > C.r + 4 * T) { anfCircleEnd(); return; }
  if (C.t > C.life - 1.5 && Math.floor(C.t * 8) % 2 === 0) C.flick = true; else C.flick = false;   // o fim avisa piscando
}
// o herói não sai do círculo: depois do passo dele, é puxado de volta para dentro da borda
{ const _up = updatePlayer; updatePlayer = function (dt) {
  const r = _up(dt), C = anfCircle;
  if (!C || pl.dead) return r;
  const hx = pl.x + pl.w / 2, hy = pl.y + pl.h / 2, ddx = hx - C.x, ddy = hy - C.y, d = Math.hypot(ddx, ddy), lim = C.r - 6;
  if (d <= lim || d > C.r + 4 * T) return r;   // dentro; ou levado longe (portal, teleporte): o anfCircleTick desfaz
  const ux = ddx / d, uy = ddy / d, nx = C.x + ux * lim - pl.w / 2, ny = C.y + uy * lim - pl.h / 2;
  if (!rectSolid(nx, ny, pl.w, pl.h)) { pl.x = nx; pl.y = ny; }
  else if (!rectSolid(nx, pl.y, pl.w, pl.h)) pl.x = nx;
  else if (!rectSolid(pl.x, ny, pl.w, pl.h)) pl.y = ny;
  const vr = pl.vx * ux + pl.vy * uy;
  if (vr > 0) { pl.vx -= vr * ux * 1.3; pl.vy -= vr * uy * 1.3; }
  if (uy > 0.5) { pl.vy = Math.min(pl.vy, 0); pl.onGround = true; }   // a borda de baixo segura como chão
  if (C.touchT <= 0.1) { sfx.anfBarrier(); anfWisp(C.x + ux * C.r, C.y + uy * C.r, 4, 0.5); }
  C.touchA = Math.atan2(uy, ux); C.touchT = 0.45;
  return r;
}; }

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead && ANF_TYPES.includes(e.type)) {
    // ainda sem forma (o besteiro escondido, o ferreiro se apagando): a lâmina atravessa
    if (anfVis(e) < 0.5 && e.state !== 'possess') { anfWisp(e.x + e.w / 2, e.y + e.h / 2, 2); return; }
    const n0 = parts.length, st = e.state, r = _hit(e, dir, mult, melee);
    anfNoBlood(n0);
    if (!e.dead) {
      if (e.type === 'juramentado' && (st === 'wind' || st === 'spin')) { e.stun = 0; e.vx = 0; }   // jurado: não se dobra no meio do golpe
      if (e.type === 'besteiroan' || e.state === 'possess') { e.stun = 0; e.vx = 0; e.vy = 0; }
    }
    return r;
  }
  return _hit(e, dir, mult, melee);
}; }
// não sangram: as gotas que a pancada soltou viram fiapos frios subindo
function anfNoBlood(n0) { for (let i = parts.length - 1; i >= n0; i--) { const p = parts[i]; if (p.col !== '#7ad0f0' && p.col !== '#ffffff') continue; if (p.col === '#7ad0f0' && anfWisps.length < 320) anfWisps.push({ x: p.x, y: p.y, vx: p.vx * 0.3, vy: -Math.abs(p.vy) * 0.25 - 8, t: 0, life: 0.5 + Math.random() * 0.5, c: i % 3 }); parts.splice(i, 1); } }
{ const _k = killEnemy; killEnemy = function (e) {
  if (!ANF_TYPES.includes(e.type)) return _k(e);
  if (e.carc && e.carc.anfClaim === e) e.carc.anfClaim = null;
  const n0 = parts.length, r = _k(e); anfNoBlood(n0);
  anfWisp(e.x + e.w / 2, e.y + e.h / 2, 12, 1.4); sfx.anfSigh(1);
  return r;
}; }
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const r = _hp(dmg, srcX, src, isProj);
  if (src && (r === 'block' || r === 'parry')) {
    if (src.type === 'barbaferro') { src.state = 'roam'; src.retreat = 1; }
    else if (src.type === 'juramentado' && src.state === 'spin') { src.state = 'recover'; src.stateT = r === 'parry' ? 1.2 : 0.6; }
  }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !ANF_TYPES.includes(type)) return e;
  const cx = px + e.w / 2, cy = py + e.h / 2;
  if (type === 'besteiroan') {   // só existe nas seteiras
    const s = anfSlitNear(cx, cy, ANF_SLIT_R);
    if (!s) { e.dead = true; e.despawn = true; return e; }
    e.room = s.room; anfAt(e, s); e.vis = 0; e.state = 'hidden'; e.stateT = 0.5 + Math.random();
  } else if (type === 'ferreirofant') {   // só perto de uma bigorna
    const A = anfAnvilNear(cx, cy);
    if (!A) { e.dead = true; e.despawn = true; return e; }
    e.anvil = A; e.vis = 1; e.state = 'float'; e.atkCD = 1 + Math.random();
  } else if (type === 'barbaferro') { e.vis = 1; e.state = 'roam'; e.lookT = 0; e.retreat = 0; }
  else { e.state = 'walk'; e.circleCD = 1; for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T; }
  return e;
}; }

/* ---------- o tempo ---------- */
HOOK.update.push(dt => {
  for (let i = anfWisps.length - 1; i >= 0; i--) { const w = anfWisps[i]; w.t += dt; if (w.t > w.life) { anfWisps[i] = anfWisps[anfWisps.length - 1]; anfWisps.pop(); continue; } w.x += (w.vx + Math.sin(w.t * 7 + i) * 4) * dt; w.y += w.vy * dt; w.vx *= Math.pow(0.4, dt); }
  if (!anfBolts.length && !anfHammers.length && !anfCircle && !anfFading.length && !enemies.length) return;
  anfBoltTick(dt); anfHammerTick(dt); anfLeash(); anfCircleTick(dt);
});

/* ---------- o desenho do mundo: virotes, malhos, o rastro, o círculo ---------- */
const ANF_GLYPH = [[0, 0, 1, 0, 1, 1, 0, 2], [0, 0, 2, 0, 1, 1, 1, 2], [0, 0, 0, 2, 1, 1, 2, 2], [1, 0, 0, 1, 2, 1, 1, 2], [0, 0, 2, 2, 0, 2, 2, 0]];
function anfRing(C, cx, cy, k, a) {   // a borda (pontos) e as runas em volta
  const r = C.r * k, x0 = C.x - cx, y0 = C.y - cy, n = Math.max(12, Math.round(r * Math.PI));   // um ponto a cada 2 px
  lc.globalAlpha = a;
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2 + gameTime * 0.15, x = Math.round(x0 + Math.cos(t) * r), y = Math.round(y0 + Math.sin(t) * r);
    if (x < -2 || x > VW + 2 || y < -2 || y > VH + 2) continue;
    if (i % 9 === 4) continue;   // a borda gasta, com falhas
    lc.fillStyle = (i + Math.floor(gameTime * 12)) % 11 === 0 ? '#d0f4ff' : i % 3 ? '#3aa8d8' : '#7ad0f0'; lc.fillRect(x, y, 1, 1);
  }
  for (let i = 0; i < 24; i++) {   // as 24 runas, um pouco para dentro
    const t = i / 24 * Math.PI * 2 - gameTime * 0.1, x = Math.round(x0 + Math.cos(t) * (r - 5)) - 1, y = Math.round(y0 + Math.sin(t) * (r - 5)) - 1, G = ANF_GLYPH[i % 5];
    if (x < -4 || x > VW + 4 || y < -4 || y > VH + 4) continue;
    lc.fillStyle = (i + Math.floor(gameTime * 3)) % 6 === 0 ? '#d0f4ff' : '#7ad0f0';
    for (let j = 0; j < 8; j += 2) lc.fillRect(x + G[j], y + G[j + 1], 1, 1);
  }
  lc.globalAlpha = 1;
}
HOOK.drawWorld.push((cx, cy) => {
  if (!anfBolts.length && !anfHammers.length) return;
  const B = ANF.get();
  for (const b of anfBolts) {
    const x = Math.round(b.x) - cx, y = Math.round(b.y) - cy; if (x < -12 || x > VW + 12 || y < -12 || y > VH + 12) continue;
    lc.save(); lc.translate(x, y); lc.rotate(b.a); lc.globalAlpha = b.walls ? 0.55 : 0.85; lc.drawImage(B.virote, -8, -1); lc.restore();
  }
  for (const h of anfHammers) {
    const x = Math.round(h.x) - cx, y = Math.round(h.y) - cy; if (x < -12 || x > VW + 12 || y < -12 || y > VH + 12) continue;
    lc.save(); lc.translate(x, y); lc.rotate(h.spin); lc.globalAlpha = 0.8; lc.drawImage(B.malho, -5.5, -5.5); lc.restore();
  }
  lc.globalAlpha = 1;
});
// por cima do escuro: a passada fraca dos fantasmas (eles mesmos brilham), o rastro, a fenda acesa, o círculo
const ANF_WCOL = ['#3aa8d8', '#7ad0f0', '#d0f4ff'];
HOOK.drawTop.push((cx, cy) => {
  for (const w of anfWisps) {
    const x = Math.round(w.x) - cx, y = Math.round(w.y) - cy; if (x < 0 || x >= VW || y < 0 || y >= VH) continue;
    lc.globalAlpha = Math.min(1, (w.life - w.t) * 3) * 0.75; lc.fillStyle = ANF_WCOL[w.c]; lc.fillRect(x, y, 1, 1);
  }
  lc.globalAlpha = 1;
  for (const e of enemies) {
    if (e.dead || !ANF_TYPES.includes(e.type)) continue;
    const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
    if (fx < -40 || fx > VW + 40 || fy < -40 || fy > VH + 60) continue;
    anfDraw(e, fx, fy, false, 0.3);
    if (e.type === 'barbaferro' && e.trail && (e.state === 'seek' || e.state === 'possess')) {
      // o rastro azul até a carcaça: o caminho feito, e a linha tracejada que falta
      for (const p of e.trail) { const a = clamp(1 - (gameTime - p.t) / 4, 0, 1); if (a <= 0) continue; lc.globalAlpha = a * 0.7; lc.fillStyle = '#7ad0f0'; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, 1, 1); }
      const p = e.carc;
      if (p && e.state === 'seek') {
        const x0 = e.x + e.w / 2, y0 = e.y + e.h / 2 + 3, x1 = p.X + p.w / 2, y1 = p.Y + p.h / 2, d = Math.hypot(x1 - x0, y1 - y0), off = (gameTime * 24) % 6;
        lc.fillStyle = '#3aa8d8';
        for (let s = off; s < d; s += 6) { lc.globalAlpha = 0.35 + 0.3 * Math.sin(gameTime * 6 + s * 0.1); lc.fillRect(Math.round(x0 + (x1 - x0) * s / d) - cx, Math.round(y0 + (y1 - y0) * s / d) - cy, 2, 1); }
      }
      lc.globalAlpha = 1;
    }
    if (e.type === 'besteiroan' && e.state === 'tell' && e.slit) {   // a fenda acesa
      const k = clamp(1 - e.stateT / ANF_TELL, 0, 1), x = e.slit.x * T - cx, y = e.slit.y * T - cy;
      lc.globalAlpha = 0.3 + k * 0.45; lc.fillStyle = k > 0.7 && Math.floor(gameTime * 20) % 2 ? '#d0f4ff' : '#7ad0f0';
      lc.fillRect(x + 5, y + 2, 1, 8); lc.globalAlpha = 0.25 + k * 0.3; lc.fillRect(x + 6, y + 3, 1, 6);
      lc.globalAlpha = 1;
    }
  }
  const C = anfCircle;
  if (C && !C.flick) {
    const k = easeOut(C.grow), a = 0.55 + C.pulse * 0.45;
    anfRing(C, cx, cy, k * (1 + C.pulse * 0.03 * Math.sin(gameTime * 40)), a);
    if (C.touchT > 0) {   // onde o herói bateu na barreira
      const x = Math.round(C.x + Math.cos(C.touchA) * C.r) - cx, y = Math.round(C.y + Math.sin(C.touchA) * C.r) - cy, w = C.touchT / 0.45;
      lc.globalAlpha = w; lc.fillStyle = '#d0f4ff';
      for (let i = -3; i <= 3; i++) { const t = C.touchA + Math.PI / 2, q = i * 2; lc.fillRect(x + Math.round(Math.cos(t) * q), y + Math.round(Math.sin(t) * q), 1, 1 + (i === 0 ? 1 : 0)); }
      lc.globalAlpha = 1;
    }
  }
  for (const f of anfFading) anfRing(f, cx, cy, 1 + f.t * 0.15, (1 - f.t / 0.6) * 0.5);
});
HOOK.drawGlow.push((cx, cy) => {
  const G = ANF.GL;
  for (const e of enemies) {
    if (e.dead || !ANF_TYPES.includes(e.type)) continue;
    const v = anfVis(e), x = e.x + e.w / 2 - cx, y = e.y + e.h / 2 - cy;
    if (x < -40 || x > VW + 40 || y < -40 || y > VH + 40) continue;
    lc.globalAlpha = 0.18 * v; lc.drawImage(G.grande, x - 20, y - 20);
    if (e.type === 'ferreirofant' && e.state === 'raise') { const k = clamp(1 - e.stateT / ANF_RAISE, 0, 1); lc.globalAlpha = 0.4 + k * 0.6; lc.drawImage(G.runa, x - e.facing * 1 - 8, e.y - cy - 4 - 8); }
    if (e.type === 'besteiroan' && e.state === 'tell' && e.slit) { const k = clamp(1 - e.stateT / ANF_TELL, 0, 1); lc.globalAlpha = 0.35 + k * 0.6; lc.drawImage(G.fenda, (e.slit.x + 0.5) * T - cx - 12, (e.slit.y + 0.5) * T - cy - 12); }
    if (e.type === 'barbaferro' && e.state === 'possess' && e.carc) {   // a carcaça acendendo
      const p = e.carc, k = clamp(1 - e.stateT / ANF_POSSESS, 0, 1); lc.globalAlpha = (0.3 + k * 0.6) * (0.8 + 0.2 * Math.sin(gameTime * 14));
      lc.drawImage(G.grande, p.X + p.w / 2 - cx - 20, p.Y + p.h / 2 - cy - 20);
    }
  }
  for (const h of anfHammers) { lc.globalAlpha = 0.6; lc.drawImage(G.runa, h.x - cx - 8, h.y - cy - 8); }
  for (const b of anfBolts) { lc.globalAlpha = 0.5; lc.drawImage(G.olho, b.x - cx - 4, b.y - cy - 4); }
  const C = anfCircle;
  if (C) {   // a borda brilha fraco; antes do giro, acende inteira
    lc.globalAlpha = (0.12 + C.pulse * 0.5) * C.grow;
    const r = C.r * easeOut(C.grow); for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; lc.drawImage(G.runa, C.x + Math.cos(t) * r - cx - 8, C.y + Math.sin(t) * r - cy - 8); }
  }
  lc.globalAlpha = 1;
});
function clearAnfFx() { anfWisps.length = 0; anfBolts.length = 0; anfHammers.length = 0; anfFading.length = 0; anfCircle = null; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearAnfFx(); anfTables(); return _nw(sd, sv); }; }

/* ---------- sons ---------- */
Object.assign(sfx, {
  // o clique seco da besta engatilhando (o aviso do besteiro)
  anfClick() { noise(0.04, 0.08, 2600, 'bandpass', 0, 4); tone(900, 0.03, 'square', 0.02, -300); noise(0.03, 0.06, 3200, 'bandpass', 0.07, 5); },
  anfTwang() { tone(220, 0.14, 'square', 0.04, -150); noise(0.12, 0.05, 2000, 'bandpass', 0, 1.5); tone(1400, 0.2, 'sine', 0.01, -800); },
  anfFizz() { noise(0.2, 0.03, 3000, 'highpass'); },
  // o suspiro gelado dos fantasmas
  anfSigh(v = 1) { noise(0.7, 0.03 * v, 900, 'bandpass', 0, 1.5); tone(330, 0.7, 'sine', 0.012 * v, -120); tone(495, 0.6, 'sine', 0.008 * v, -160, 0.08); },
  anfRaise() { tone(400, 0.6, 'sine', 0.018, 500); noise(0.4, 0.02, 1600, 'bandpass', 0, 2); },
  anfWhoosh() { noise(0.35, 0.05, 900, 'bandpass', 0, 1); tone(180, 0.3, 'triangle', 0.02, 120); },
  anfCatch() { tone(260, 0.08, 'triangle', 0.03, -40); noise(0.05, 0.04, 1200, 'bandpass'); },
  anfPossess() { tone(110, 1.4, 'sine', 0.02, 60); noise(1.2, 0.025, 600, 'bandpass', 0, 2); },
  anfWake() { tone(70, 0.4, 'sawtooth', 0.04, 40); noise(0.2, 0.06, 1800, 'bandpass', 0.1, 3); tone(620, 0.3, 'triangle', 0.02, 300, 0.2); },
  anfPlant() { tone(60, 0.25, 'sine', 0.06, -20); noise(0.18, 0.06, 500, 'lowpass'); },
  anfCircleOn() { tone(196, 1.2, 'sine', 0.02, 0); tone(294, 1.1, 'sine', 0.015, 0, 0.05); tone(392, 1, 'triangle', 0.008, 0, 0.1); },
  anfCircleOff() { tone(294, 0.5, 'sine', 0.012, -150); },
  anfSpin() { noise(0.4, 0.06, 1200, 'bandpass', 0, 1); noise(0.3, 0.05, 1600, 'bandpass', 0.15, 1); },
  anfBarrier() { tone(880, 0.12, 'sine', 0.02, -200); noise(0.08, 0.02, 3000, 'highpass'); }
});
