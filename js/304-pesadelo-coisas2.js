'use strict';

/* ================= os Salões do Pesadelo: as coisas do pesadelo, parte dois =================
   As outras cinco (docs/camadas/14-saloes-pesadelo.md, seção 6; as primeiras estão no 303):
   - a Mariposa do Sono (mariposaon), grande, de asas cinza-lilás com dois olhos pintados; voa em zigue-zague. Abre as
     asas e os olhos pintados aparecem (0,6 s), depois sacode um cone de pó: quem respira cochila (psCochilar 1,5 s);
   - a Bailarina da Caixinha (bailarina), na ponta dos pés, girando devagar; mantém distância. Gira mais rápido e a
     melodia de caixinha acelera (0,8 s): solta cinco notas que saem em espiral (ps2Notas, a lista dela);
   - o Cavalo de Balanço (cavalinho), de madeira pintada, crina de lã, olhos de botão; anda balançando aos pulinhos.
     Inclina para trás até quase cair, rangendo (0,9 s), e esmaga para a frente;
   - a Sombra Errada (sombraerrada), uma sombra de gente na parede de fundo que não bate com ninguém; só anda onde há
     parede atrás (fase: atravessa o chão) e só leva dano com luz em cima dela (psLightAt; no escuro o golpe passa). Se
     estica pela parede (0,6 s) e agarra;
   - o Relógio Mole (relogiomole), um relógio de bolso derretido que flutua com um pêndulo; os ponteiros disparam e o
     tique fica alto (0,8 s), o pêndulo varre: quem leva volta 2 s no tempo (psVoltar) e leva um golpe leve.
   Pincel do 303 (PS1). Prefixo ps2. */

Object.assign(ET, {
  mariposaon: { name: 'Mariposa do Sono', w: 14, h: 10, hp: 55, dmg: 14, xp: 30, kb: 1, fly: true, blood: '#c8bcd8' },
  bailarina: { name: 'Bailarina da Caixinha', w: 7, h: 18, hp: 80, dmg: 18, xp: 34, kb: 0.8, fly: false, blood: '#f0d8e0' },
  cavalinho: { name: 'Cavalo de Balanço', w: 20, h: 16, hp: 300, dmg: 30, xp: 52, kb: 0.1, fly: false, blood: '#b46246' },
  sombraerrada: { name: 'Sombra Errada', w: 9, h: 22, hp: 70, dmg: 20, xp: 36, kb: 0, fly: true, phase: true, blood: '#141018' },
  relogiomole: { name: 'Relógio Mole', w: 14, h: 14, hp: 100, dmg: 12, xp: 34, kb: 0.6, fly: true, blood: '#d4ae4a' }
});
const PS2_TYPES = ['mariposaon', 'bailarina', 'cavalinho', 'sombraerrada', 'relogiomole'];
const PS2_DROPS = {
  mariposaon: [['po_de_sono', 0.5], ['min_onirita', 0.03], ['pocao', 0.06], ['capuz_lencol', 0.03]],
  bailarina: [['corda_caixinha', 0.4], ['porcelana', 0.2], ['min_onirita', 0.04], ['pocao', 0.07], ['pantufas_sonambulo', 0.036]],
  cavalinho: [['corda_caixinha', 0.25], ['min_onirita', 0.07], ['pocao', 0.1], ['tesoura_costura', 0.04]],
  sombraerrada: [['po_de_sono', 0.3], ['min_onirita', 0.05], ['pocao', 0.07], ['capuz_lencol', 0.036]],
  relogiomole: [['ponteiro_mole', 0.5], ['min_onirita', 0.05], ['pocao', 0.07], ['pantufas_sonambulo', 0.03]]
};
function ps2Tables() { for (const k of PS2_TYPES) DROPS[k] = PS2_DROPS[k].filter(([id]) => ITEMS[id]); }
ps2Tables();
Object.assign(NAV_WALKERS, { bailarina: 1, cavalinho: 1 });
Object.assign(CV_STEP, { bailarina: 1, cavalinho: 1 });

const PS2_ASAS = 0.6, PS2_GIRO = 0.8, PS2_BALANCO = 0.9, PS2_ESTICA = 0.6, PS2_TIQUE = 0.8;

/* ================= arte ================= */
const PS2 = {};
{
const { cp } = CVB, { cg } = CVART, { PR, tubo, poly, setO } = PS1;
const R7 = a => a.map(h => ph(h));
const Q = {
  asa: R7(['#2a2432', '#463e52', '#665c74', '#887e96', '#a89eb6', '#c8bed4', '#e6def0']),
  olho: R7(['#1a0a10', '#3a1420', '#6a2436', '#a84060', '#d87090', '#f4a8c0', '#ffe0ea']),
  tutu: R7(['#5a3a4a', '#86566c', '#b07890', '#d29eb2', '#ecc4d2', '#f8e2ea', '#ffffff']),
  pintura: R7(['#0a1a2a', '#14304a', '#1e4a6e', '#2e6a96', '#4a8ebc', '#78b4dc', '#b4dcf4']),
  la: R7(['#2a1a10', '#4a2e1a', '#6e4626', '#966236', '#bc824a', '#dcaa6a', '#f4d098']),
  sombra: R7(['#020204', '#060608', '#0c0a10', '#141018', '#1c1622', '#241e2c', '#2e2638'])
};

/* ---------- a Mariposa do Sono, 26 x 18 (o corpo no x 13, a base na linha 17) ----------
   0-1 batendo asas, 2 as asas abertas com os olhos pintados (o aviso), 3 sacudindo o pó */
function mariposa(k) {
  const P = cp(26, 18), s = 30401 + k, cx = 13, open = k >= 2, up = k === 0 ? -1 : k === 1 ? 1 : 0;
  for (const sd of [-1, 1]) {
    const tipY = open ? 2 : 4 + up * 3, tipX = cx + sd * (open ? 12 : 10);
    poly(P, [[cx + sd * 1, 7], [tipX, tipY], [cx + sd * (open ? 12 : 9), 11 + (open ? 1 : up)], [cx + sd * 5, 14], [cx + sd * 1, 11]], Q.asa,
      (x, y) => 3.2 - Math.abs(x - cx) * 0.06 + (Math.abs(Math.sin((x - cx) * 0.9 + y * 0.4)) < 0.2 ? -1 : 0) + cg(x, y, s) * 0.45);
    if (open) { P.blob(cx + sd * 7, 7, 2.2, 2.2, Q.olho, s + 2, 3.6); P.blob(cx + sd * 7, 7, 1, 1, Q.sombra, s + 3, 1); P.put(cx + sd * 6.6, 6.4, Q.olho, 6.4); }
    else P.put(cx + sd * 6, 8 + up, Q.olho, 3);
  }
  P.blob(cx, 9, 1.6, 4.4, Q.asa, s + 4, 2.4, (x, y) => (y % 2 ? -0.6 : 0.4));   // o corpo peludo, listrado
  P.line(cx - 1, 4.6, cx - 3.4, 1.4, Q.asa, 4.6); P.line(cx + 1, 4.6, cx + 3.4, 1.4, Q.asa, 4.6);   // as antenas penteadas
  P.put(cx - 0.8, 5.4, Q.olho, 5); P.put(cx + 0.8, 5.4, Q.olho, 5);
  return setO(P.done());
}

/* ---------- a Bailarina da Caixinha, 14 x 22 (o corpo no x 7, a ponta do pé na linha 21) ----------
   0-1 girando (de frente / de lado), 2 o giro rápido (os braços em arco, o aviso), 3 soltando as notas */
function bailarina(k) {
  const P = cp(14, 22), s = 30411 + k, cx = 7, side = k === 1;
  P.line(cx, 13, cx, 21, PR.porcelana, 4.4); if (!side) P.line(cx + 0.6, 14, cx + 3, 16, PR.porcelana, 3.4);   // a perna de apoio e a outra dobrada
  for (let r = 0; r < 4; r++) for (let x = -5 + r * 0.5; x <= 5 - r * 0.5; x += 0.5) P.put(cx + x * (side ? 0.6 : 1), 12 - r * 0.5, Q.tutu, 4.6 - r * 0.6 + (Math.abs(x) > 4 ? -1 : 0) + cg(cx + x | 0, 12, s) * 0.4);   // o tutu
  poly(P, [[cx - 1.4, 6.6], [cx + 1.4, 6.6], [cx + 1, 11], [cx - 1, 11]], Q.tutu, (x, y) => 4 - (x - cx) * 0.4);
  if (k >= 2) { P.line(cx - 1.4, 7, cx - 3.4, 2.4, PR.porcelana, 4); P.line(cx + 1.4, 7, cx + 3.4, 2.4, PR.porcelana, 4.6); P.line(cx - 3.4, 2.4, cx + 3.4, 2.4, PR.porcelana, 5); }
  else { P.line(cx - 1.4, 7, cx - 4 * (side ? 0.4 : 1), 9.4, PR.porcelana, 4); P.line(cx + 1.4, 7, cx + 4 * (side ? 0.4 : 1), 9.4, PR.porcelana, 4.6); }
  P.blob(cx, 4.4, 1.8, 2, PR.porcelana, s + 1, 4.6);
  P.blob(cx, 2.6, 1.4, 1.1, PR.cabelo, s + 2, 3);   // o coque
  if (!side) { P.put(cx - 0.6, 4.4, Q.sombra, 1); P.put(cx + 0.6, 4.4, Q.sombra, 1); P.put(cx, 5.6, Q.olho, 4); }
  // a rachadura da porcelana no rosto
  P.line(cx + 0.6, 3.2, cx + 1.4, 5.6, PR.boca, 1.4);
  return setO(P.done());
}

/* ---------- o Cavalo de Balanço, 30 x 24 (o centro no x 14, a base dos arcos na linha 23) ----------
   0 em pé, 1 o balanço para a frente, 2 inclinado para trás até quase cair (o aviso), 3 o esmagar (para a frente) */
const CB = [0, 0.18, -0.42, 0.34];
function cavalinho(k) {
  const P = cp(30, 24), s = 30421 + k, a = CB[k], cx = 14, cy = 21;
  const rot = (x, y) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];
  const at = (x, y, R, t) => { const [rx, ry] = rot(x, y); P.put(rx, ry, R, t); };
  // os arcos de balanço (madeira escura)
  for (let x = 2; x <= 26; x += 0.4) { const y = 21 + ((x - 14) / 12) ** 2 * -2.6 + 1.6; at(x, y, PR.verniz, 2.4); at(x, y + 0.6, PR.verniz, 1.4); }
  // as pernas de pau
  for (const lx of [7, 10, 18, 21]) for (let y = 13; y <= 21; y += 0.5) at(lx + (lx < 14 ? (21 - y) * -0.15 : (21 - y) * 0.15), y, Q.pintura, lx === 10 || lx === 21 ? 2.4 : 3.6);
  // o corpo pintado (azul desbotado com manchas brancas lascadas)
  for (let y = 8; y <= 13.5; y += 0.5) for (let x = 6; x <= 22; x += 0.5) {
    const e = ((x - 14) / 8.4) ** 2 + ((y - 10.8) / 3) ** 2; if (e > 1) continue;
    const chip = cg(x | 0, y | 0, s + 9) > 0.62;
    at(x, y, chip ? PR.porcelana : Q.pintura, (chip ? 3.6 : 3.8) - (y - 10.8) * 0.5 + cg(x | 0, y | 0, s) * 0.3);
  }
  // o pescoço e a cabeça, a crina de lã, o olho de botão
  for (let t = 0; t <= 1; t += 0.05) for (let r = -1.4; r <= 1.4; r += 0.5) at(20 + t * 4 + r * 0.6, 9 - t * 5.4 + r * 0.4, Q.pintura, 4 + r * 0.5);
  for (let y = 2; y <= 6; y += 0.5) for (let x = 23; x <= 28; x += 0.5) { if (((x - 25.4) / 2.8) ** 2 + ((y - 4) / 2) ** 2 > 1) continue; at(x, y, Q.pintura, 4.2 - (y - 4) * 0.4); }
  for (let t = 0; t <= 1; t += 0.06) { at(20.4 + t * 3.6, 8 - t * 5.6, Q.la, 4 + Math.sin(t * 20) * 1.4); at(19.4 + t * 3.6, 8.6 - t * 5.6, Q.la, 3); }
  at(25, 3.4, Q.sombra, 2); at(24.6, 3, PR.porcelana, 6);
  at(28, 5, PR.boca, 2);
  // a sela vermelha e o rabo de lã
  for (let x = 11; x <= 16; x += 0.5) { at(x, 7.8, PR.verniz, 4.6); at(x, 8.4, PR.verniz, 3.4); }
  for (let t = 0; t <= 1; t += 0.08) at(6 - t * 3, 9 + t * 5 + Math.sin(t * 9) * 0.6, Q.la, 3.6);
  return setO(P.done());
}

/* ---------- a Sombra Errada, 16 x 26 (a base na linha 25) ----------
   uma silhueta chapada que não bate com ninguém: a cabeça torta, um braço a mais. 0-1 andando, 2 esticada (o aviso),
   3 o bote (os braços compridos) */
function sombra(k) {
  const P = cp(16, 26), s = 30431 + k, cx = 7, st = k === 2 ? 4 : 0;
  const R = Q.sombra, tone = (x, y) => 3 + cg(x, y, s) * 0.5;
  P.line(cx - 1, 15, cx - 2 - (k === 1 ? 2 : 0), 25, R, 3); P.line(cx + 1, 15, cx + 2 + (k === 0 ? 2 : 0), 25, R, 3);
  poly(P, [[cx - 2.6, 6 - st], [cx + 2.4, 6 - st], [cx + 2, 16], [cx - 2, 16]], R, tone);
  P.blob(cx + 1.6, 3 - st, 2.2, 2.4, R, s, 3);   // a cabeça fora do lugar
  if (k === 3) { P.line(cx + 2, 7, cx + 9, 6, R, 3); P.line(cx + 2, 9, cx + 9, 10, R, 3); P.line(cx + 2, 8, cx + 8.4, 8, R, 3.4); }
  else { P.line(cx + 2, 7 - st, cx + 4, 14, R, 3); P.line(cx - 2, 7 - st, cx - 4, 14, R, 3); P.line(cx - 2, 9 - st, cx - 5, 12 + st, R, 2.6); }   // o braço a mais
  return setO(P.done());
}

/* ---------- o Relógio Mole, 22 x 28 (o centro do mostrador no x 10, y 8) ----------
   0 boiando, 1 os ponteiros disparados (o aviso), o pêndulo é desenhado à parte (balança em transform de cena) */
function relogio(k) {
  const P = cp(22, 28), s = 30441 + k, cx = 10, cy = 8;
  // a caixa dourada derretendo para baixo, escorrendo à esquerda
  for (let y = 0; y < 20; y += 0.5) for (let x = 0; x < 22; x += 0.5) {
    const dy = y - cy, dx = x - cx, sag = Math.max(0, dy) * (1 + Math.max(0, -dx) * 0.08);
    const r = Math.hypot(dx * (1 - Math.max(0, dy) * 0.02), dy - sag * 0.35);
    if (r > 7.4 + (dy > 0 && dx < -2 ? dy * 0.4 : 0)) continue;
    const rim = r > 6;
    P.put(x, y, rim ? PR.ouro : PR.porcelana, rim ? 3.4 - dy * 0.12 + cg(x | 0, y | 0, s) * 0.4 : 5 - r * 0.12 - Math.max(0, dy) * 0.08);
  }
  // os números são tracinhos; os ponteiros (pretos, curvos)
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P.put(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5 * (a > 0 && a < Math.PI ? 1.25 : 1), Q.sombra, 2); }
  const h = k ? [[cx + 1, cy - 4.4], [cx - 3.6, cy + 2]] : [[cx + 0.4, cy - 4.6], [cx + 3, cy + 1.4]];
  for (const [hx, hy] of h) P.line(cx, cy, hx, hy, Q.sombra, 1.6);
  P.put(cx, cy, PR.ouro, 5);
  P.blob(cx, -0.4, 1.4, 1, PR.ouro, s + 2, 4.4);   // a coroa de dar corda
  return setO(P.done());
}

PS2.get = () => PS2.ready || (PS2.ready = {
  mp: [0, 1, 2, 3].map(mariposa), ba: [0, 1, 2, 3].map(bailarina), cb: [0, 1, 2, 3].map(cavalinho),
  so: [0, 1, 2, 3].map(sombra), rm: [0, 1].map(relogio)
});
PS2.GL = { po: glow(8, '#c09ae0'), nota: glow(6, '#f0a0c8'), ouro: glow(9, '#f4dc8a'), olho: glow(6, '#f4a8c0') };
PS2.Q = Q;
}

/* ================= desenho ================= */
const ps2Blit = (img, e, fx, fy, ax, ay, jx = 0, jy = 0) => lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), Math.round(fy - ay + jy));

const ps2MpPose = e => e.state === 'open' ? 2 : e.state === 'dust' ? 3 : Math.floor(e.t * 12) % 2;
DRAW_E.mariposaon = (e, fx, fy, fl) => ps2Blit(cvPick(PS2.get().mp[ps2MpPose(e)], e, fl), e, fx, fy, 13, 18, 0, Math.sin(e.t * 5) * 1.2);
EYES_E.mariposaon = (e, fx, fy) => { if (e.state !== 'open' && e.state !== 'dust') return; lc.globalAlpha = 0.35; for (const sd of [-1, 1]) lc.drawImage(PS2.GL.olho, Math.round(fx + sd * 7) - 6, fy - 11 - 6); };
WARN_E.mariposaon = e => e.state === 'open';

const ps2BaPose = e => e.state === 'spin' ? 2 : e.state === 'cast' ? 3 : Math.floor(e.t * 3) % 2;
DRAW_E.bailarina = (e, fx, fy, fl) => {
  const pose = ps2BaPose(e), set = PS2.get().ba[pose];
  // gira: o desenho espelha de tempos em tempos (de frente, de lado, de costas)
  const turn = e.state === 'spin' ? Math.floor(e.t * 14) % 2 : Math.floor(e.t * 2) % 2;
  lc.drawImage(fl ? (turn ? set.wl : set.wr) : (turn ? set.l : set.r), Math.round(fx - 7), fy - 23);
};
EYES_E.bailarina = () => {};
WARN_E.bailarina = e => e.state === 'spin';

const ps2CbPose = e => e.state === 'back' ? 2 : e.state === 'crush' ? 3 : e.onGround ? 0 : 1;
DRAW_E.cavalinho = (e, fx, fy, fl) => ps2Blit(cvPick(PS2.get().cb[ps2CbPose(e)], e, fl), e, fx, fy, 15, 25, e.state === 'back' ? Math.round(Math.sin(e.t * 26) * 0.6) : 0);
EYES_E.cavalinho = () => {};
WARN_E.cavalinho = e => e.state === 'back';

const ps2SoPose = e => e.state === 'stretch' ? 2 : e.state === 'grab' ? 3 : Math.abs(e.vx) > 3 ? Math.floor(e.t * 4) % 2 : 0;
DRAW_E.sombraerrada = (e, fx, fy, fl) => {
  // é uma sombra: desenhada chapada, meio transparente, mais visível onde há luz
  const lit = ps2Lit(e);
  lc.globalAlpha = fl ? 1 : 0.62 + (lit ? 0.3 : 0);
  ps2Blit(cvPick(PS2.get().so[ps2SoPose(e)], e, fl), e, fx, fy, 8, 27);
  lc.globalAlpha = 1;
};
EYES_E.sombraerrada = () => {};
WARN_E.sombraerrada = e => e.state === 'stretch';

DRAW_E.relogiomole = (e, fx, fy, fl) => {
  const set = PS2.get().rm[e.state === 'tick' ? 1 : 0], img = fl ? set.wr : set.r, bob = Math.round(Math.sin(e.t * 2) * 1.5);
  // o pêndulo por baixo, balançando
  const a = e.state === 'swing' ? Math.sin((1 - e.stateT / 0.5) * Math.PI * 2) * 1.1 : Math.sin(e.t * 2.4) * 0.35;
  const px = Math.round(fx), py = fy - 6 + bob, L = e.state === 'swing' ? 15 : 9;
  for (let i = 0; i <= L; i++) { lc.fillStyle = i % 3 ? '#a8822e' : '#d4ae4a'; lc.fillRect(Math.round(px + Math.sin(a) * i), Math.round(py + Math.cos(a) * i), 1, 1); }
  const bx = Math.round(px + Math.sin(a) * L), by = Math.round(py + Math.cos(a) * L);
  lc.fillStyle = '#4a3612'; lc.fillRect(bx - 2, by - 1, 5, 4); lc.fillStyle = '#d4ae4a'; lc.fillRect(bx - 1, by, 3, 2); lc.fillStyle = '#fffad0'; lc.fillRect(bx - 1, by, 1, 1);
  lc.drawImage(img, Math.round(fx - 10), fy - 20 + bob);
};
EYES_E.relogiomole = (e, fx, fy) => { if (e.state !== 'tick') return; lc.globalAlpha = 0.3; lc.drawImage(PS2.GL.ouro, Math.round(fx) - 9, fy - 12 - 9); };
WARN_E.relogiomole = e => e.state === 'tick';

/* ================= comportamento ================= */
const ps2Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const ps2Ecx = e => e.x + e.w / 2, ps2Ecy = e => e.y + e.h / 2;
// luz em cima da sombra (a luz do mundo, a tocha do herói conta: o LB já tem tudo)
function ps2Lit(e) { const L = typeof psLightAt === 'function' ? psLightAt(Math.floor(ps2Ecx(e) / T), Math.floor(ps2Ecy(e) / T)) : 1; return L >= 0.25; }
// voo de mariposa / relógio: vai até (tx, ty) com acelaração limitada, desviando um pouco
function ps2Fly(e, dt, tx, ty, sp, acc) {
  const dx = tx - ps2Ecx(e), dy = ty - ps2Ecy(e), d = Math.hypot(dx, dy) || 1;
  e.vx = approach(e.vx, dx / d * sp, acc * dt); e.vy = approach(e.vy, dy / d * sp, acc * dt);
  if (Math.abs(dx) > 3) e.facing = Math.sign(dx);
}

/* ---------- a Mariposa do Sono ---------- */
AI.mariposaon = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'open') { e.vx = approach(e.vx, 0, 300 * dt); e.vy = approach(e.vy, 0, 300 * dt); if (e.stateT <= 0) { e.state = 'dust'; e.stateT = 0.5; e.dusted = false; sfx.ps2Po(Math.max(0.4, ps2Near(e))); } return; }
  if (e.state === 'dust') {
    e.vx = approach(e.vx, 0, 300 * dt); e.vy = approach(e.vy, 0, 300 * dt);
    // o cone de pó para a frente e para baixo
    for (let i = 0; i < 3; i++) { const a = (e.facing > 0 ? 0 : Math.PI) + (e.facing > 0 ? 1 : -1) * rnd(-0.2, 0.7); parts.push({ x: ps2Ecx(e) + e.facing * 4, y: ps2Ecy(e), vx: Math.cos(a) * rnd(40, 90), vy: Math.sin(Math.abs(a - (e.facing > 0 ? 0 : Math.PI))) * rnd(20, 60), g: 6, life: rnd(0.6, 1.1), max: 1.1, col: Math.random() < 0.5 ? '#c09ae0' : '#e6def0', size: 1, smoke: true }); }
    const rx = (pcx - ps2Ecx(e)) * e.facing, ry = pcy - ps2Ecy(e);
    if (!e.dusted && !pl.dead && rx > -4 && rx < 4.5 * T && Math.abs(ry) < 10 + rx * 0.7) {
      e.dusted = true;
      const r = hurtPlayer(Math.round(e.dmg * 0.5), ps2Ecx(e), e, false);
      if (r === 'hit' || r === 'block') psCochilar(1.5);
    }
    if (e.stateT <= 0) { e.state = 'fly'; e.atkCD = 3.5 + Math.random() * 1.5; }
    return;
  }
  e.state = 'fly';
  // zigue-zague: um ponto que gira em volta do alvo
  e.zz = (e.zz || Math.random() * 6) + dt * 2.4;
  if (aggro) ps2Fly(e, dt, pcx - Math.sign(dx || 1) * 3.4 * T + Math.cos(e.zz) * 18, pcy - 2.4 * T + Math.sin(e.zz * 1.7) * 14, 64, 220);
  else { e.wa = (e.wa || Math.random() * 6) + dt * (Math.random() - 0.5) * 3; ps2Fly(e, dt, ps2Ecx(e) + Math.cos(e.wa) * 40, ps2Ecy(e) + Math.sin(e.wa) * 20, 22, 90); }
  e.flapT = (e.flapT || 0) - dt; if (e.flapT <= 0) { e.flapT = 0.25; const v = ps2Near(e, 140); if (v > 0.1) sfx.ps2Asa(v * 0.4); }
  if (aggro && e.atkCD <= 0 && dist < 5 * T && Math.abs(dx) > 1.2 * T && e.sees) { e.state = 'open'; e.stateT = PS2_ASAS; e.facing = Math.sign(dx) || e.facing; sfx.ps2Asa(1, 1.6); }
};

/* ---------- a Bailarina da Caixinha: notas em espiral ---------- */
const ps2Notas = [];
AI.bailarina = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'spin') {
    e.vx = approach(e.vx, 0, 500 * dt);
    e.toneT = (e.toneT || 0) - dt; if (e.toneT <= 0) { e.toneT = 0.11; sfx.ps2Caixinha(Math.max(0.3, ps2Near(e)), 1 + (1 - e.stateT / PS2_GIRO) * 0.6); }
    if (e.stateT <= 0) {
      e.state = 'cast'; e.stateT = 0.35;
      const base = Math.atan2(dy, dx), dmg = Math.round(e.dmg * 0.8);
      for (let i = 0; i < 5; i++) ps2Notas.push({ x: ps2Ecx(e), y: e.y + 8, a: base + (i - 2) * 0.32, r: 0, sp: 62, spin: (i % 2 ? 1 : -1) * 1.6, life: 3.2, dmg, k: i % 3 });
    }
    return;
  }
  if (e.state === 'cast') { if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2.4 + Math.random(); } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const want = 6 * T; dir = Math.abs(dx) < want - 16 ? -Math.sign(dx) : Math.abs(dx) > want + 16 ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 34 : 12, 400, 220, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (aggro && e.atkCD <= 0 && e.onGround && dist < 10 * T && e.sees) { e.state = 'spin'; e.stateT = PS2_GIRO; e.vx = 0; }
};
function ps2NotasUpdate(dt) {
  for (let i = ps2Notas.length - 1; i >= 0; i--) {
    const n = ps2Notas[i]; n.life -= dt;
    // espiral: o rumo gira devagar enquanto anda
    n.a += n.spin * dt * Math.max(0, 1 - n.r / 220); n.spin *= Math.pow(0.6, dt);
    n.x += Math.cos(n.a) * n.sp * dt; n.y += Math.sin(n.a) * n.sp * dt; n.r += n.sp * dt;
    let dead = n.life <= 0 || solidAt(Math.floor(n.x / T), Math.floor(n.y / T));
    if (!dead && !pl.dead && n.x > pl.x - 2 && n.x < pl.x + pl.w + 2 && n.y > pl.y - 2 && n.y < pl.y + pl.h + 2) {
      const r = hurtPlayer(n.dmg, n.x - Math.cos(n.a) * 10, null, true);
      if (r !== 'none' || pl.invuln > 0) dead = true;
    }
    if (dead) { burst(n.x, n.y, 5, '#f0a0c8', 40, 0, 0.3, 1, true); ps2Notas.splice(i, 1); }
  }
}
// uma colcheia de 5 x 7, rosada
const PS2_NOTA = [[0, 1, 1, 1, 0], [0, 1, 0, 1, 1], [0, 1, 0, 0, 1], [0, 1, 0, 0, 0], [1, 1, 0, 0, 0], [1, 1, 0, 0, 0], [0, 0, 0, 0, 0]];
function ps2NotasDraw(cx, cy) {
  for (const n of ps2Notas) {
    const x = Math.round(n.x) - cx - 2, y = Math.round(n.y) - cy - 3;
    lc.globalAlpha = 0.5; lc.drawImage(PS2.GL.nota, x - 4, y - 3);
    lc.globalAlpha = 1;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (PS2_NOTA[r][c]) { lc.fillStyle = '#2a0e1a'; lc.fillRect(x + c + 1, y + r + 1, 1, 1); }
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (PS2_NOTA[r][c]) { lc.fillStyle = r < 2 ? '#ffe0ea' : '#f0a0c8'; lc.fillRect(x + c, y + r, 1, 1); }
  }
}
HOOK.update.push(ps2NotasUpdate);
HOOK.drawTop.push(ps2NotasDraw);

/* ---------- o Cavalo de Balanço ---------- */
AI.cavalinho = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = ps2Ecx(e);
  if (e.state === 'back') { e.vx = approach(e.vx, -e.facing * 12, 300 * dt); if (e.stateT <= 0) { e.state = 'crush'; e.stateT = 0.42; e.vx = e.facing * 230; e.vy = -110; e.onGround = false; e.swingHit = false; sfx.ps2Pancada(Math.max(0.4, ps2Near(e))); } return; }
  if (e.state === 'crush') {
    const hb = { x: e.facing > 0 ? ecx : ecx - 18, y: e.y, w: 18, h: e.h + 2 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.stateT <= 0 && e.onGround) { e.state = 'walk'; e.vx = 0; e.atkCD = 1.8 + Math.random() * 0.8; shake(2); sfx.ps2Pancada(Math.max(0.3, ps2Near(e)) * 0.7); }
    return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 14 ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  // anda aos pulinhos de balanço: um impulso para cima a cada passo
  e.hopT = (e.hopT || 0) - dt;
  walk(e, dt, dir, aggro ? 60 : 24, 500, 260, dy, aggro);
  if (e.onGround && Math.abs(e.vx) > 8 && e.hopT <= 0) { e.hopT = 0.5; e.vy = -70; e.onGround = false; if (ps2Near(e, 160) > 0.1) sfx.ps2Range(ps2Near(e, 160) * 0.5); }
  if (dir && !e.nav) e.facing = dir;
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 3.2 * T && Math.abs(dy) < 20) { e.state = 'back'; e.stateT = PS2_BALANCO; e.facing = Math.sign(dx) || e.facing; sfx.ps2Range(Math.max(0.5, ps2Near(e)), 1.6); }
};

/* ---------- a Sombra Errada: só onde há parede atrás ---------- */
const ps2Wall = (x, y) => wallAt(Math.floor(x / T), Math.floor(y / T)) !== 0;
AI.sombraerrada = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = ps2Ecx(e), ecy = ps2Ecy(e);
  if (e.state === 'stretch') { e.vx = e.vy = 0; if (e.stateT <= 0) { e.state = 'grab'; e.stateT = 0.3; e.swingHit = false; sfx.ps2Sussurro(Math.max(0.4, ps2Near(e)), 1.4); } return; }
  if (e.state === 'grab') {
    const hb = { x: e.facing > 0 ? ecx : ecx - 16, y: e.y + 2, w: 16, h: 12 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') psAgarrar(e, 1.2); }
    if (e.stateT <= 0) { e.state = 'drift'; e.atkCD = 1.6 + Math.random(); }
    return;
  }
  e.state = 'drift';
  let tx, ty, sp;
  if (aggro) { tx = pl.x + pl.w / 2; ty = pl.y + pl.h / 2; sp = 46; }
  else { e.wa = (e.wa || Math.random() * 6) + dt * (Math.random() - 0.5) * 2; tx = ecx + Math.cos(e.wa) * 40; ty = ecy + Math.sin(e.wa) * 10; sp = 16; }
  ps2Fly(e, dt, tx, ty, sp, 200);
  // nunca sai da parede: o passo que deixaria a sombra sem parede atrás é desfeito
  const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
  if (!ps2Wall(nx + e.w / 2, ny + e.h / 2) || !ps2Wall(nx + e.w / 2, ny + 3) || !ps2Wall(nx + e.w / 2, ny + e.h - 2)) {
    if (ps2Wall(nx + e.w / 2, e.y + e.h / 2) && ps2Wall(nx + e.w / 2, e.y + 3)) e.vy = 0;
    else if (ps2Wall(e.x + e.w / 2, ny + e.h / 2)) e.vx = 0;
    else { e.vx = 0; e.vy = 0; }
  }
  e.whT = (e.whT || 0) - dt; if (e.whT <= 0) { e.whT = 5 + Math.random() * 4; const v = ps2Near(e, 150); if (v > 0.1) sfx.ps2Sussurro(v * 0.5); }
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 2.2 * T && Math.abs(dy) < 16) { e.state = 'stretch'; e.stateT = PS2_ESTICA; e.facing = Math.sign(dx) || e.facing; }
};
// no escuro o golpe passa por dentro dela
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && e.type === 'sombraerrada' && !e.dead && !ps2Lit(e)) { burst(ps2Ecx(e), ps2Ecy(e), 3, '#2e2638', 30, 0, 0.3, 1, true); e.memT = 4; return; }
  return _hit.apply(this, arguments);
}; }

/* ---------- o Relógio Mole ---------- */
AI.relogiomole = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  e.tkT = (e.tkT || 0) - dt;
  if (e.state === 'tick') {
    e.vx = approach(e.vx, 0, 200 * dt); e.vy = approach(e.vy, 0, 200 * dt);
    if (e.tkT <= 0) { e.tkT = 0.1; sfx.ps2Tique(Math.max(0.4, ps2Near(e)), 1.4); }
    if (e.stateT <= 0) { e.state = 'swing'; e.stateT = 0.5; e.swingHit = false; }
    return;
  }
  if (e.state === 'swing') {
    // o pêndulo varre de 15 px por baixo do mostrador
    const hb = { x: ps2Ecx(e) - 15, y: e.y + 6, w: 30, h: 18 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ps2Ecx(e), e, false); if (r === 'hit' && psVoltar()) sfx.ps2Volta(); }
    if (e.stateT <= 0) { e.state = 'float'; e.atkCD = 2.8 + Math.random(); }
    return;
  }
  e.state = 'float';
  if (e.tkT <= 0) { e.tkT = 1; const v = ps2Near(e, 120); if (v > 0.1) sfx.ps2Tique(v * 0.4); }
  if (aggro) ps2Fly(e, dt, pcx, pcy - 22, 36, 120);
  else { e.wa = (e.wa || Math.random() * 6) + dt * 0.4; ps2Fly(e, dt, ps2Ecx(e) + Math.cos(e.wa) * 30, ps2Ecy(e) + Math.sin(e.wa * 1.3) * 12, 12, 60); }
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 20 && dy > 6 && dy < 34) { e.state = 'tick'; e.stateT = PS2_TIQUE; }
};

/* ---------- sons ---------- */
Object.assign(sfx, {
  ps2Po(v = 1) { noise(0.5, 0.06 * v, 1800, 'highpass', 0, 0.7); noise(0.4, 0.03 * v, 600, 'bandpass', 0.1, 1); },
  ps2Asa(v = 1, k = 1) { noise(0.07 * k, 0.03 * v, 500, 'lowpass'); },
  ps2Caixinha(v = 1, k = 1) { const N = [1047, 1319, 1568, 1319, 1175, 1568, 1397, 1047]; ps2Caixinha.i = (ps2Caixinha.i + 1) % N.length; tone(N[ps2Caixinha.i] * k * 0.5, 0.18, 'sine', 0.03 * v); tone(N[ps2Caixinha.i] * k, 0.08, 'triangle', 0.012 * v); },
  ps2Range(v = 1, k = 1) { tone(260 / k, 0.25 * k, 'sawtooth', 0.02 * v, -60); },
  ps2Pancada(v = 1) { noise(0.18, 0.14 * v, 260, 'lowpass'); tone(90, 0.2, 'sine', 0.1 * v, -40); },
  ps2Sussurro(v = 1, k = 1) { noise(0.8 * k, 0.025 * v, 2600, 'bandpass', 0, 4); noise(0.6 * k, 0.02 * v, 3200, 'bandpass', 0.2, 4); },
  ps2Tique(v = 1, k = 1) { noise(0.02, 0.07 * v, 3600 * k, 'bandpass', 0, 6); },
  ps2Volta() { tone(660, 0.5, 'sine', 0.04, -500); tone(990, 0.4, 'sine', 0.025, -700, 0.05); noise(0.3, 0.03, 2000, 'bandpass', 0, 2); }
});
const ps2Caixinha = { i: 0 };
