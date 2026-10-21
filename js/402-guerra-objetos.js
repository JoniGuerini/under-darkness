'use strict';

/* ================= O Campo da Última Guerra: objetos de cena =================
   Tudo o que é maior que um bloco e veste O Campo (docs/camadas/17-campo-guerra.md, seção 5): 13 objetos.
   No chão: o esqueleto de cavalo de guerra (ainda com a barda de ferro), o monte de armas (espadas, lanças, um escudo,
   um elmo), o cavaleiro morto ajoelhado sobre a espada, o braço de trabuco quebrado, a estátua de anjo quebrada (as
   asas partidas, a cabeça no chão), o altar de campanha dos anjos (a pena acesa no meio), o crânio de demônio com os
   chifres e as órbitas em brasa, o tambor de guerra rasgado. No teto: o estandarte rasgado e a gaiola de forca. Na
   parede: os escudos pendurados, a asa petrificada e as flechas cravadas.
   O pintor é o do 401 (GUART.painter, o mesmo do 252/272: rampas de 6 tons, luz de cima à esquerda, contorno escuro só
   onde toca o ar, juntas por P.z) com a tinta acesa (P.N): a brasa das órbitas e a pena. Cada variação assa os pixels
   acesos e o halo uma vez (bakeLuz); o drawGlow desenha os dois somados; nada é relido por quadro. A luz é só a que a
   ficha deixa: a pena de anjo, a brasa e o ouro que reflete.
   Animados pelos pontos marcados (guPts): 'brilho' (um reflexo de ouro ou de aço cintila de vez em quando, só onde a
   luz bate), 'brasa' (o brilho respira devagar), 'pena' (a luz fria da pena treme pouco).
   Registrados com defProp (`guerra: true`), postos pelo 405 a partir do GU_PROP_PLAN. GU_BACK_FLOOR: peças de fundo que
   ficam em pé no chão. Flags: forte (só nos salões dos bastiões), campo (só nos campos abertos). */
const GU_PROP_PLAN = {};
const GU_BACK_FLOOR = { gu_asa_pedra: 1 };
{
const { painter, tube, lin, bez, poly, seams, grime, bakeLuz, toCv, HR, RP, cg, cn } = GUART;
const BR = { fundo: '#7a1a04', laranja: '#e06010', ambar: '#ff9a30', claro: '#ffd070', miolo: '#fff0c0' };
const PE = { a: '#fff8e8', b: '#ffe8b8', c: '#f0d090' };
const dirOf = a => [Math.cos(a), Math.sin(a)];

// uma espada solta: a lâmina de x0,y0 até a ponta, a guarda, o cabo
function sword(P, x0, y0, a, L, s, R = RP.aco, G = RP.ferro) {
  const [c, sn] = dirOf(a), nx = -sn, ny = c;
  for (let t = 0; t <= L; t += 0.4) { const w = t > L - 2 ? 0.2 : 0.7; P.put(x0 + c * t - nx * w, y0 + sn * t - ny * w, R, 4.6 - t * 0.04 + cg(Math.round(t), 1, s) * 0.3); P.put(x0 + c * t + nx * w, y0 + sn * t + ny * w, R, 2.4); }
  for (let k = -2.5; k <= 2.5; k += 0.5) P.put(x0 - c * 0.6 + nx * k, y0 - sn * 0.6 + ny * k, G, k < 0 ? 4.4 : 2.6);
  for (let t = 1; t <= 4; t += 0.5) P.put(x0 - c * t, y0 - sn * t, RP.couro, (t * 2) % 2 ? 3.6 : 2.4);
  P.put(x0 - c * 4.6, y0 - sn * 4.6, G, 4.6);
  P.mark('brilho', x0 + c * L * 0.6 - nx * 0.7, y0 + sn * L * 0.6 - ny * 0.7);
}
function spear(P, x0, y0, a, L, s) {
  const [c, sn] = dirOf(a);
  P.line(x0, y0, x0 + c * (L - 3), y0 + sn * (L - 3), RP.madeira, t => 3.6 - t * 0.6);
  for (let t = L - 4; t <= L; t += 0.4) { const w = (L - t) * 0.4; P.put(x0 + c * t + sn * w, y0 + sn * t - c * w, RP.ferro, 4.6); P.put(x0 + c * t - sn * w, y0 + sn * t + c * w, RP.ferro, 2.4); }
}
function roundShield(P, cx, cy, rx, ry, s, F = RP.pano) {
  P.ell(cx, cy, rx, ry, (x, y, dx, dy, d) => { const rim = d > 0.72; P.put(x, y, rim ? RP.ferro : (Math.abs(dx + dy * 0.3) < 0.18 ? RP.ouro : F), rim ? 4.4 - (dx + dy) * 1.4 : 3 - (dx + dy) * 1 + cg(x, y, s) * 0.5); });
  P.blob(cx - 0.3, cy - 0.3, 1.6, 1.4, RP.ferro, s + 1, 3.4);
}
function bone(P, x0, y0, x1, y1, wd, s) { tube(P, lin(x0, y0, x1, y1), () => wd, RP.osso, s, 3); P.blob(x0, y0, wd * 0.8, wd * 0.8, RP.osso, s + 1, 3.2); P.blob(x1, y1, wd * 0.8, wd * 0.8, RP.osso, s + 2, 2.8); }
function dirt(P, x0, x1, by, s, R = RP.terra) { for (let x = x0; x <= x1; x++) { const h = 1 + Math.round(2 * Math.sin((x - x0) / (x1 - x0 + 1) * Math.PI) + cn(x, 0, 6, 6, s)); for (let j = 0; j < h; j++) P.put(x, by - j, R, 2.6 + (j === h - 1 ? 0.9 : 0) + cg(x, j, s) * 0.5); } }

/* ---------- no chão ---------- */
function horseSkeleton(k) {   // 52 x 24: o esqueleto do cavalo de guerra deitado de lado, as costelas em arco, o crânio comprido, a barda de ferro rasgada ainda presa no pescoço (k 1: só a metade da frente, a barda inteira por cima da cabeça)
  const P = painter(52, 24), s = 40701 + k, by = 23;
  dirt(P, 0, 51, by, s);
  P.z = 1;
  // a espinha: uma fileira de vértebras de lado
  const sx0 = k ? 22 : 8, sx1 = 40;
  for (let x = sx0; x <= sx1; x += 2) { P.blob(x, 12 + Math.sin((x - sx0) * 0.12) * 1.2, 1.2, 1.1, RP.osso, s + x, 3.2); P.put(x, 10.5 + Math.sin((x - sx0) * 0.12), RP.osso, 4.4); }
  // as costelas: arcos do espinhaço até o chão
  for (let j = 0; j < 7; j++) { const x = 18 + j * 3; if (x < sx0) continue; tube(P, bez([x, 13], [x - 3, 16], [x - 3, 20], [x - 1, by - 1]), t => 1.6 - t * 0.5, RP.osso, s + 20 + j, 2.6 + (j % 2) * 0.4); }
  if (!k) { bone(P, 8, 14, 3, 21, 1.4, s + 30); bone(P, 11, 15, 12, 22, 1.3, s + 31); }   // as patas de trás
  bone(P, 38, 16, 34, 22, 1.4, s + 32); bone(P, 40, 16, 44, 22, 1.3, s + 33);
  // o crânio comprido, de lado, o focinho no chão
  P.z = 2;
  poly(P, [[40, 9], [45, 7], [51, 15], [51, 19], [47, 20], [42, 16]], RP.osso, (x, y) => 3.6 - (x - 40) * 0.05 - (y - 7) * 0.12 + cg(x, y, s + 40) * 0.5);
  P.blob(44.5, 10.5, 1.4, 1.2, RP.osso, s + 41, 0.4); P.put(44, 10, RP.osso, 0);   // a órbita
  for (let x = 46; x < 51; x++) P.put(x, 18.6, RP.osso, x % 2 ? 5 : 1.4);           // os dentes
  // a barda: placas de ferro com rebites e a borda de pano vinho rasgada
  P.z = 3;
  const bx0 = k ? 36 : 34, bx1 = k ? 48 : 44;
  poly(P, [[bx0, 7], [bx1, 5], [bx1 + 1, 11], [bx0 + 2, 14]], RP.ferro, (x, y) => 3.4 - (x - bx0) * 0.08 + (y % 3 === 0 ? -0.8 : 0) + cg(x, y, s + 50) * 0.5);
  for (let x = bx0 + 1; x < bx1; x += 3) P.put(x, 8 + (x - bx0) * -0.15, RP.ferro, 5.4);
  for (let x = bx0; x < bx1 + 1; x++) { const h = 1 + ((hash2(x, 0, s) * 3) | 0); for (let j = 0; j < h; j++) P.put(x, 13 - (x - bx0) * 0.25 + j, RP.vinho, 3.4 - j * 0.6); }
  P.mark('brilho', bx0 + 3, 7);
  seams(P); grime(P, 0.6, 0.3, s + 60);
  return P.done();
}
function weaponPile(k) {   // 40 x 28: o monte de armas: espadas, lanças e uma maça jogadas umas por cima das outras, um escudo redondo encostado, um elmo no alto (k 1: mais baixo e comprido, uma lança espetada no meio)
  const P = painter(40, 28), s = 40711 + k, by = 27;
  dirt(P, 0, 39, by, s);
  P.z = 1;
  spear(P, 2, 24, -0.15, 34, s); spear(P, 38, 25, Math.PI + 0.25, 30, s + 1);
  sword(P, 8, 22, -0.4, 16, s + 2); sword(P, 33, 23, Math.PI + 0.55, 14, s + 3);
  P.z = 2;
  // a pilha: um morrinho de lâminas e ferro velho
  for (let x = 5; x < 36; x++) { const h = Math.round((k ? 5 : 8) * Math.sin((x - 5) / 31 * Math.PI) + hash2(x, 0, s) * 2); for (let j = 0; j < h; j++) { const v = (x + j * 2) % 5 === 0 ? 5 : 2.4 + cg(x, j, s) * 1.2 + (j === h - 1 ? 1 : 0); P.put(x, by - 2 - j, (x * 3 + j) % 7 < 2 ? RP.ferrugem : RP.ferro, v); } }
  P.z = 3;
  roundShield(P, k ? 30 : 11, k ? 21 : 18, 6, 6.4, s + 4, k ? RP.vinho : RP.pano);
  if (k) spear(P, 20, 24, -Math.PI / 2 + 0.1, 24, s + 5);
  else { P.blob(24, 13, 4, 3.4, RP.ferro, s + 6, 3); for (let x = 21; x < 28; x++) P.put(x, 13.5, RP.ferro, 0.4); P.put(23, 11, RP.ferro, 5.4); P.mark('brilho', 22, 11); }
  P.mark('brilho', 16, 14);
  seams(P); grime(P, 0.5, 0.35, s + 7);
  return P.done();
}
function deadKnight(k) {   // 26 x 32: o cavaleiro morto ajoelhado, as duas mãos no cabo da espada fincada, a cabeça baixa no elmo fechado, a capa vinho rasgada caindo no chão, o ouro da armadura sem brilho (k 1: caído para a frente, apoiado no escudo)
  const P = painter(26, 32), s = 40721 + k, by = 31;
  dirt(P, 0, 25, by, s);
  P.z = 1;
  // a capa atrás
  poly(P, [[7, 11], [14, 10], [17, 30], [3, 31], [2, 26]], RP.vinho, (x, y) => 2.6 - (x - 7) * 0.08 + Math.sin(x * 1.3 + y * 0.2) * 0.5 + (hash2(x, y, s) < 0.06 ? -2 : 0));
  for (let x = 2; x < 17; x++) if (hash2(x, 0, s) < 0.4) P.put(x, 31, RP.vinho, 1.4);
  P.z = 2;
  if (!k) {
    // as pernas dobradas, o joelho no chão
    tube(P, lin(10, 22, 16, 26), () => 4, RP.ferro, s + 1, 2.6); tube(P, lin(16, 26, 14, 30), () => 3.4, RP.ferro, s + 2, 2.2);
    tube(P, lin(9, 23, 7, 30), () => 3.6, RP.ferro, s + 3, 2.4); P.blob(5.5, 30.4, 2.6, 1, RP.ferro, s + 4, 2);
    // o tronco curvado e o peitoral
    P.blob(10.5, 17, 4.4, 6, RP.ferro, s + 5, 3); for (let y = 13; y < 22; y += 3) for (let x = 7; x < 14; x++) P.put(x, y, RP.ferro, 1.6);
    P.put(9, 14, RP.ouro, 4); P.put(10, 14, RP.ouro, 3);
    // o elmo baixo, a viseira em fenda
    P.blob(13.5, 9.5, 3.2, 3.4, RP.ferro, s + 6, 3.2); for (let x = 12; x < 17; x++) P.put(x, 10, RP.ferro, 0.2);
    tube(P, bez([12, 6], [10, 3], [8, 4], [7, 7]), t => 1.4 - t * 0.6, RP.vinho, s + 7, 3.2);   // a pluma caída
    // a espada fincada e as mãos
    P.z = 3;
    sword(P, 19, 18, Math.PI / 2, 13, s + 8);
    P.blob(18.5, 16, 1.8, 1.6, RP.ferro, s + 9, 3.4); tube(P, lin(13, 14, 18, 16), () => 2.4, RP.ferro, s + 10, 3);
  } else {
    roundShield(P, 17, 25, 6, 5.4, s + 11, RP.vinho);
    tube(P, lin(6, 24, 11, 21), () => 4.4, RP.ferro, s + 12, 2.4); P.blob(4, 28, 3, 2.4, RP.ferro, s + 13, 2.2);
    P.blob(11, 18, 5, 4.2, RP.ferro, s + 14, 3); P.blob(16, 17, 3.2, 3, RP.ferro, s + 15, 3.2); for (let x = 15; x < 19; x++) P.put(x, 17.5, RP.ferro, 0.2);
    sword(P, 3, 29, -0.1, 18, s + 16);
  }
  seams(P); grime(P, 0.6, 0.35, s + 17);
  return P.done();
}
function trebuchetArm(k) {   // 56 x 34: o braço de trabuco quebrado: a viga grossa partida no meio caída de través sobre o cavalete, a ponta lascada, as cintas de ferro, a corda solta, uma pedra redonda no pé (k 1: só o cavalete em pé e o braço caído no chão)
  const P = painter(56, 34), s = 40731 + k, by = 33;
  dirt(P, 0, 55, by, s);
  P.z = 1;
  // o cavalete: duas pernas em A e o eixo
  for (const [a, b] of [[[14, 33], [22, 12]], [[30, 33], [22, 12]]]) tube(P, lin(a[0], a[1], b[0], b[1]), () => 3.2, RP.madeira, s + a[0], 2.8);
  tube(P, lin(16, 26, 28, 26), () => 2.2, RP.madeira, s + 2, 2.4);
  P.blob(22, 12, 2.2, 2.2, RP.ferro, s + 3, 3.4);
  P.z = 2;
  const a0 = k ? [6, 30] : [3, 28], a1 = k ? [46, 31] : [52, 4];
  tube(P, lin(a0[0], a0[1], a1[0], a1[1]), t => 4.2 - t * 0.8, RP.madeira, s + 4, 3);
  // as cintas de ferro e a ponta lascada
  for (const t of [0.2, 0.45, 0.7]) { const x = a0[0] + (a1[0] - a0[0]) * t, y = a0[1] + (a1[1] - a0[1]) * t; for (let j = -2; j <= 2; j++) P.put(x + j * 0.3, y + j * 0.6 * (k ? 1 : 0.4) - (k ? 0 : j * 0.3), RP.ferro, 4.4 - j * 0.4); }
  for (let j = 0; j < 4; j++) P.put(a1[0] + j * (k ? 0.6 : 0.3) - 1, a1[1] - 1 + j * 0.5 * (k ? 0 : 1), RP.madeira, 5 - j * 0.7);
  // a corda solta
  tube(P, bez([a0[0] + 2, a0[1] - 1], [a0[0] - 2, a0[1] + 4], [a0[0] + 6, by], [a0[0] + 10, by - 1]), () => 1, RP.linho, s + 5, 3);
  P.z = 3;
  P.blob(k ? 32 : 40, by - 3.5, 4, 3.6, RP.cinza, s + 6, 3);   // a pedra de arremesso
  seams(P); grime(P, 0.5, 0.3, s + 7);
  return P.done();
}
function angelStatue(k) {   // 32 x 46: a estátua de anjo quebrada no pedestal de cantaria: de pé, as mãos postas, as asas partidas em tocos, sem cabeça (a cabeça no chão do lado), os veios de ouro, um rasgo de golpe no peito (k 1: ajoelhada, uma asa inteira ainda erguida)
  const P = painter(32, 46), s = 40741 + k, by = 45;
  // o pedestal
  P.rect(5, 38, 22, 8, RP.marmore, (i, j) => j === 0 ? 4.6 : j === 7 ? 1.6 : 3 - i * 0.04 + (i === 0 ? 0.8 : 0) + cg(i, j, s) * 0.4);
  for (let x = 7; x < 25; x += 2) P.put(x, 40, RP.ouro, 3.4);
  P.z = 1;
  // as asas atrás
  if (k) tube(P, bez([12, 20], [6, 12], [3, 4], [4, 0]), t => 6 - t * 4, RP.pena, s + 1, 3);
  else tube(P, bez([12, 20], [8, 16], [6, 14], [5, 11]), t => 6 - t * 2, RP.pena, s + 1, 3);
  tube(P, bez([20, 20], [24, 16], [26, 14], [27, 12]), t => 6 - t * 2, RP.pena, s + 2, 2.6);
  P.z = 2;
  // o corpo: a túnica em dobras compridas
  const top = k ? 20 : 14, foot = 38;
  for (let y = top; y < foot; y++) { const hw = 3 + (y - top) * 0.18; for (let x = Math.round(16 - hw); x <= 16 + hw; x++) P.put(x, y, RP.marmore, 3.4 - (x - 16) * 0.22 + Math.sin(x * 1.6) * 0.5 + cg(x, y, s + 3) * 0.3); }
  if (k) for (let x = 11; x < 22; x++) for (let y = 32; y < 38; y++) P.put(x, y, RP.marmore, 3 - (y - 32) * 0.2 + Math.sin(x * 1.4) * 0.4);
  // as mãos postas e o pescoço quebrado
  P.blob(16, top + 5, 1.6, 2, RP.marmore, s + 4, 4); P.rect(14, top - 2, 5, 2, RP.marmore, (i, j) => 2.4 + (hash2(i, j, s) < 0.4 ? 1.4 : 0));
  // o veio de ouro e o rasgo do golpe
  for (let y = top + 2; y < foot; y += 1) P.put(13 + Math.round(Math.sin(y * 0.4) * 1.2), y, RP.ouro, 3.6);
  for (let j = 0; j < 6; j++) P.put(17 + j * 0.6, top + 8 + j, RP.marmore, 0.4);
  P.z = 3;
  // a cabeça no chão ao lado, de perfil
  P.blob(k ? 26 : 5, 43.4, 2.8, 2.6, RP.marmore, s + 5, 3.4); P.put(k ? 25 : 4, 43, RP.marmore, 1);
  P.ell(k ? 26 : 5, 41.2, 2.4, 0.7, (x, y) => P.put(x, y, RP.ouro, 3.8));
  P.mark('brilho', k ? 25 : 4, 41);
  seams(P); grime(P, 0.5, 0.25, s + 6);
  return P.done();
}
function fieldAltar(k) {   // 36 x 26: o altar de campanha dos anjos: uma pedra lavrada coberta com o pano de linho rasgado, o cálice tombado, o livro aberto; no meio uma pena de anjo enfiada numa fresta, ainda acesa (k 1: o altar partido ao meio, a pena caída na beira)
  const P = painter(36, 26), s = 40751 + k, by = 25;
  P.rect(5, 14, 26, 12, RP.marmore, (i, j) => j === 0 ? 4.4 : 2.8 - i * 0.03 + (i === 0 ? 0.8 : i === 25 ? -0.8 : 0) + (j % 6 === 5 ? -1 : 0) + cg(i, j, s) * 0.4);
  if (k) for (let y = 14; y < 26; y++) P.put(17 + Math.round(Math.sin(y) * 0.8), y, RP.marmore, 0.2);
  P.z = 1;
  // o pano
  for (let x = 4; x < 32; x++) { const h = 3 + ((x === 4 || x === 31) ? 4 + ((hash2(x, 0, s) * 3) | 0) : 0); for (let j = 0; j < h; j++) P.put(x, 13 + j, RP.linho, 3.8 - j * 0.3 + Math.sin(x * 1.1) * 0.3); }
  for (let x = 5; x < 31; x += 4) P.put(x, 14, RP.ouro, 3.4);
  P.z = 2;
  // o cálice tombado e o livro
  P.blob(9, 11.6, 1.6, 1.2, RP.ouro, s + 1, 3.4); P.line(10, 12, 12, 12, RP.ouro, 3); P.mark('brilho', 8, 11);
  P.rect(22, 10, 7, 3, RP.linho, (i, j) => j === 0 ? 4.6 : 3.2 - (i === 3 ? 1.4 : 0)); P.rect(22, 12, 7, 1, RP.couro, () => 2.6);
  // a pena acesa
  const px = k ? 30 : 17, py = k ? 12 : 5;
  if (k) for (let j = 0; j < 9; j++) { P.N(px - j, py + j * 0.1, j < 2 ? PE.a : j < 6 ? PE.b : PE.c); P.N(px - j, py + 0.9 + j * 0.1, PE.c); }
  else for (let j = 0; j < 9; j++) { const w = j < 2 ? 0 : 1; for (let q = -w; q <= w; q++) P.N(px + q + j * 0.25, py + j, j < 3 ? PE.a : q ? PE.c : PE.b); }
  P.mark('pena', k ? px - 4 : px + 1, k ? py : py + 4);
  seams(P); grime(P, 0.4, 0.25, s + 2);
  return P.done();
}
function demonSkull(k) {   // 40 x 26: o crânio de demônio meio enterrado: largo e chato, os chifres grossos em espiral para trás, as presas, as órbitas fundas com a brasa que ainda não apagou (k 1: um chifre quebrado no toco, a mandíbula solta na frente)
  const P = painter(40, 26), s = 40761 + k, by = 25;
  dirt(P, 0, 39, by, s, RP.escoria);
  P.z = 1;
  // os chifres
  tube(P, bez([12, 11], [6, 4], [2, 8], [4, 14]), t => 5 - t * 4, RP.chifre, s + 1, 3);
  if (k) tube(P, lin(28, 11, 32, 6), t => 5 - t * 1.4, RP.chifre, s + 2, 2.6);
  else tube(P, bez([28, 11], [34, 4], [38, 8], [36, 14]), t => 5 - t * 4, RP.chifre, s + 2, 2.6);
  P.z = 2;
  // o crânio
  P.ell(20, 15, 10, 8, (x, y, dx, dy, d) => P.put(x, y, RP.osso, 3.4 - (dx + dy) * 1.2 - d * 0.5 + cg(x, y, s + 3) * 0.4 + (Math.abs(dx) < 0.08 && dy < 0 ? 0.8 : 0)));
  // as órbitas com a brasa
  for (const ox of [15, 25]) { P.ell(ox, 14, 2.6, 2, (x, y) => P.put(x, y, RP.osso, 0.2)); P.N(ox, 14.5, BR.ambar); P.N(ox - 1, 14.5, BR.laranja); P.N(ox, 13.5, BR.claro); P.mark('brasa', ox, 14); }
  // o nariz e as presas
  P.put(20, 18, RP.osso, 0.2); P.put(20, 19, RP.osso, 0.6);
  for (let x = 13; x <= 27; x += 2) { const L = x === 15 || x === 25 ? 4 : 2; for (let j = 0; j < L; j++) P.put(x, 21 + j, RP.osso, 4.6 - j * 0.6); }
  if (k) { P.z = 3; P.rect(12, 23, 16, 2, RP.osso, (i, j) => 3 - j + cg(i, j, s) * 0.4); }
  seams(P); grime(P, 0.6, 0.3, s + 4);
  return P.done();
}
function warDrum(k) {   // 28 x 28: o tambor de guerra: o casco de madeira com as cintas de ferro, o couro rasgado em cima, as cordas em zigue-zague, uma baqueta caída (k 1: tombado de lado, o couro furado aparecendo)
  const P = painter(28, 28), s = 40771 + k, by = 27;
  if (!k) {
    P.rect(5, 9, 18, 18, RP.madeira, (i, j) => 3.4 - Math.abs(i - 6) * 0.15 + (i < 2 ? 0.6 : i > 15 ? -0.8 : 0) + Math.sin(i * 2.2) * 0.25 + cg(i, j, s) * 0.3);
    for (const y of [10, 26]) for (let x = 5; x < 23; x++) P.put(x, y, RP.ferro, 4 - (x - 5) * 0.1);
    for (let j = 0; j < 8; j++) { P.line(6 + j * 2, 11, 8 + j * 2, 25, RP.linho, 3.6); }
    P.z = 1; P.ell(14, 9, 9.2, 2.4, (x, y, dx, dy) => P.put(x, y, RP.linho, 4.2 - dx * 0.8 + (hash2(x, y, s) < 0.12 ? -2.6 : 0)));
    for (let j = 0; j < 4; j++) P.put(14 + j, 8 + j * 0.3, RP.linho, 0.4);   // o rasgo
  } else {
    P.ell(10, 18, 6, 8.6, (x, y, dx, dy, d) => P.put(x, y, d > 0.65 ? RP.ferro : RP.linho, d > 0.65 ? 3.4 - dy : 3.6 - dx * 0.8 + (d < 0.2 ? -3 : 0)));
    P.rect(10, 9, 15, 18, RP.madeira, (i, j) => 3 - j * 0.04 + (j < 2 ? 0.8 : j > 15 ? -0.9 : 0) + Math.sin(j * 2.2) * 0.25 + cg(i, j, s) * 0.3);
    for (const x of [11, 24]) for (let y = 9; y < 27; y++) P.put(x, y, RP.ferro, 3.6 - (y - 9) * 0.08);
  }
  P.z = 2; tube(P, lin(k ? 2 : 20, by - 1, k ? 12 : 27, by - 3), () => 1.4, RP.madeira, s + 2, 3.4); P.blob(k ? 12 : 27, by - 3, 1.4, 1.4, RP.couro, s + 3, 3);
  seams(P); grime(P, 0.5, 0.3, s + 4);
  return P.done();
}

/* ---------- no teto ---------- */
function tornBanner(k) {   // 26 x 54: o estandarte rasgado: a haste de través presa por duas correntes, o pano vinho comprido em dobras, a borda de ouro, a asa de ouro bordada (o exército dos anjos), rasgado em tiras embaixo, furos de flecha (k 1: o pano preto com o chifre vermelho bordado: o exército dos demônios)
  const P = painter(26, 54), s = 40781 + k, F = k ? RP.penaN : RP.vinho, E = k ? RP.pano : RP.ouro;
  for (const x of [5, 20]) for (let y = 0; y < 5; y++) P.put(x, y, RP.ferro, y % 2 ? 2 : 4.4);
  P.line(1, 5, 24, 5, RP.madeira, 3.8, 2); P.put(0, 5, RP.ferro, 4.6); P.put(25, 5, RP.ferro, 3.2);
  P.z = 1;
  for (let x = 3; x < 23; x++) {
    const tear = 30 + ((hash2(x >> 2, 0, s) * 18) | 0) + (x % 4 === 0 ? -4 : 0), len = Math.min(52, tear);
    for (let y = 7; y < len; y++) {
      if (hash2(x, y, s + 1) < 0.012) continue;   // furo de flecha
      const edge = x === 3 || x === 22, fold = Math.sin(x * 0.9 + y * 0.05) * 0.7;
      P.put(x, y, edge ? E : F, edge ? 4 : 3 + fold - (x - 3) * 0.04 + (y > len - 3 ? -1 : 0) + cg(x, y, s + 2) * 0.3);
    }
  }
  // o emblema
  if (!k) { for (let j = 0; j < 7; j++) { P.put(9 + j, 18 - j * 0.6, E, 4.4); P.put(9 + j, 19 - j * 0.3, E, 3.4); P.put(17 - j * 0.4, 13 + j * 0.9, E, 3.8); } P.mark('brilho', 12, 16); }
  else tube(P, bez([10, 22], [9, 16], [12, 13], [15, 12]), t => 3 - t * 2.4, E, s + 3, 3.4);
  seams(P); grime(P, 0.4, 0.3, s + 4);
  return P.done();
}
function gibbetCage(k) {   // 22 x 40: a gaiola de forca: a corrente do teto, o gancho, a gaiola de barras de ferro em forma de gente, os ossos de um cavaleiro lá dentro, o elmo caído sobre o peito (k 1: a gaiola vazia e aberta, a porta pendurada)
  const P = painter(22, 40), s = 40791 + k;
  for (let y = 0; y < 10; y++) P.put(11, y, RP.ferro, y % 3 === 1 ? 1.6 : 4.4);
  P.blob(11, 10.5, 1.6, 1.4, RP.ferro, s, 3.6);
  P.z = 1;
  if (!k) { bone(P, 9, 20, 12, 30, 1.2, s + 1); P.blob(11, 17, 2.6, 2.6, RP.osso, s + 2, 3.4); P.put(10, 17, RP.osso, 0.4); P.put(12, 17, RP.osso, 0.4); for (let j = 0; j < 4; j++) P.line(8, 21 + j * 2, 14, 21 + j * 2, RP.osso, 3.4); }
  P.z = 2;
  // as barras: o contorno de um corpo
  const prof = y => y < 16 ? 3.4 : y < 30 ? 5.4 : 4.4;
  for (let y = 12; y < 38; y++) { const hw = prof(y); for (const x of [11 - hw, 11 + hw]) P.put(x, y, RP.ferro, x < 11 ? 4.4 : 2.6); if (y % 6 === 0) for (let x = Math.round(11 - hw); x <= 11 + hw; x++) P.put(x, y, RP.ferro, 3.6); }
  for (let x = 6; x <= 16; x++) P.put(x, 38, RP.ferro, 3);
  if (k) { P.line(16.4, 18, 21, 30, RP.ferro, 3.4); P.line(16.4, 30, 21, 30, RP.ferro, 2.6); }
  else { P.z = 3; P.blob(11, 22, 3, 2.4, RP.ferro, s + 3, 3); for (let x = 9; x < 14; x++) P.put(x, 22, RP.ferro, 0.4); }
  P.mark('brilho', 7, 20);
  seams(P); grime(P, 0.6, 0.3, s + 4);
  return P.done();
}

/* ---------- na parede ---------- */
function wallShields(k) {   // 46 x 24: os escudos pendurados: três escudos de exércitos diferentes presos em cravos, um com a flecha cravada, um rachado; um trapo pendurado entre eles (k 1: dois escudos e uma espada cruzada atrás)
  const P = painter(46, 24), s = 40801 + k;
  if (k) { P.z = 0; sword(P, 4, 20, -0.42, 34, s); sword(P, 42, 20, Math.PI + 0.42, 34, s + 1); }
  P.z = 1;
  const L = k ? [[13, 12, RP.vinho], [33, 12, RP.penaN]] : [[8, 12, RP.vinho], [23, 11, RP.pano], [38, 12, RP.penaN]];
  for (const [cx, cy, F] of L) { roundShield(P, cx, cy, 6.6, 7.4, s + cx, F); P.put(cx, cy - 8.6, RP.ferro, 4.6); }
  if (!k) { P.z = 2; P.line(19, 4, 26, 13, RP.madeira, 4, 1); P.put(18.5, 3.5, RP.pena, 5); P.put(18, 4.5, RP.pena, 3.4); for (let j = 0; j < 6; j++) P.put(36 + j * 0.3, 7 + j, RP.ferro, 0.4); }
  P.mark('brilho', L[0][0] - 3, L[0][1] - 4);
  seams(P); grime(P, 0.5, 0.3, s + 2);
  return P.done();
}
function stoneWing(k) {   // 52 x 42: a asa petrificada: uma asa de anjo enorme que caiu e virou pedra, encostada na parede de pé no chão, as penas compridas em camadas, a ponta quebrada, rachas de cima a baixo (k 1: dobrada, só as penas de cima)
  const P = painter(52, 42), s = 40811 + k, by = 41;
  const root = [8, by - 2], tip = k ? [44, 18] : [48, 2];
  // as penas: da raiz até a ponta, cada uma uma faixa comprida inclinada
  const n = k ? 7 : 10;
  for (let j = 0; j < n; j++) {
    const t = j / (n - 1), bx = root[0] + (tip[0] - root[0]) * t * 0.85, bY = root[1] + (tip[1] - root[1]) * t * 0.85, L = 18 + t * 8 - (k ? 6 : 0);
    P.z = n - j;
    tube(P, lin(bx, bY, bx + 6 - t * 10, Math.min(by, bY + L)), u => 5 - u * 3, RP.pena, s + j, 3.2 - t * 0.4);
    P.line(bx + 0.5, bY + 1, bx + 5.5 - t * 10, Math.min(by - 1, bY + L - 1), RP.pena, 4.6);   // a raque
  }
  P.z = 20;
  tube(P, lin(root[0], root[1], tip[0], tip[1]), u => 6 - u * 4, RP.pena, s + 30, 3.4);   // o osso de cima da asa
  for (let j = 0; j < 3; j++) { const x = 18 + j * 9; for (let y = 6 + j * 4; y < by - 4; y += 1) if (hash2(x, y, s) < 0.7) P.put(x + Math.round(Math.sin(y * 0.4) * 1.4), y, RP.pena, 0.6); }
  seams(P, 0.8); grime(P, 0.6, 0.35, s + 31);
  return P.done();
}
function wallArrows(k) {   // 36 x 28: as flechas cravadas na parede: uma chuva de flechas de haste escura com as penas cinzentas, algumas quebradas, em ângulos parecidos (todas vieram do mesmo lado) (k 1: menos, e uma lança grossa cravada no meio)
  const P = painter(36, 28), s = 40821 + k, n = k ? 6 : 11;
  for (let j = 0; j < n; j++) {
    const x = 3 + hash2(j, 1, s) * 30, y = 4 + hash2(j, 2, s) * 20, a = 0.55 + (hash2(j, 3, s) - 0.5) * 0.25, L = hash2(j, 4, s) < 0.25 ? 4 : 9;
    const [c, sn] = dirOf(a);
    P.z = j;
    P.line(x, y, x - c * L, y - sn * L, RP.madeira, 3.6);
    P.put(x + 0.5, y + 0.3, RP.cinza, 0.6);
    if (L > 5) { P.put(x - c * L, y - sn * L, RP.cinza, 4.4); P.put(x - c * (L - 1) - 0.8, y - sn * (L - 1) + 0.6, RP.cinza, 3.4); P.put(x - c * (L - 1) + 0.8, y - sn * (L - 1) - 0.6, RP.cinza, 4.8); }
  }
  if (k) { P.z = 20; spear(P, 4, 4, 0.6, 30, s + 9); }
  seams(P); grime(P, 0.3, 0.3, s + 10);
  return P.done();
}

/* =============================== registro =============================== */
const F = 'chao', C = 'teto', Wl = 'parede';
const def = (id, nome, apoio, camada, faixas, Ps, extra) => {
  const B = Ps.map(bakeLuz);
  defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes: Ps.map(toCv), guerra: true, guLuz: B.map(b => b.nv), guHalo: B.map(b => b.halo), guPts: Ps.map(P => P.pts), luz: [], brilho: GU_COL.ouro }, extra || {}));
};
def('gu_cavalo', 'Esqueleto de cavalo de guerra', F, 'frente', ['laminas', 'estandarte'], [horseSkeleton(0), horseSkeleton(1)]);
def('gu_monte_armas', 'Monte de armas', F, 'frente', ['laminas', 'brecha', 'estandarte'], [weaponPile(0), weaponPile(1)]);
def('gu_cavaleiro_morto', 'Cavaleiro morto', F, 'frente', ['laminas', 'bastioes', 'estandarte'], [deadKnight(0), deadKnight(1)]);
def('gu_trabuco', 'Braço de trabuco quebrado', F, 'frente', ['laminas', 'estandarte'], [trebuchetArm(0), trebuchetArm(1)], { campo: true, alto: 3 });
def('gu_anjo_estatua', 'Estátua de anjo quebrada', F, 'frente', ['bastioes'], [angelStatue(0), angelStatue(1)], { alto: 4 });
def('gu_altar', 'Altar de campanha', F, 'frente', ['bastioes'], [fieldAltar(0), fieldAltar(1)], { forte: true, luz: [{ x: 18, y: 9, r: 0.45 }], brilho: GU_COL.luz, anim: { k: 'gu_pena' } });
def('gu_cranio_demonio', 'Crânio de demônio', F, 'frente', ['brecha', 'estandarte'], [demonSkull(0), demonSkull(1)], { luz: [{ x: 20, y: 14, r: 0.3 }], brilho: GU_COL.brasa, anim: { k: 'gu_brasa' } });
def('gu_tambor', 'Tambor de guerra', F, 'frente', ['brecha', 'estandarte', 'laminas'], [warDrum(0), warDrum(1)]);
def('gu_estandarte', 'Estandarte rasgado', C, 'frente', ['bastioes', 'estandarte', 'brecha'], [tornBanner(0), tornBanner(1)], { alto: 5 });
def('gu_gaiola', 'Gaiola de forca', C, 'frente', ['brecha', 'estandarte'], [gibbetCage(0), gibbetCage(1)], { alto: 4 });
def('gu_escudos_parede', 'Escudos pendurados', Wl, 'fundo', ['laminas', 'bastioes', 'estandarte'], [wallShields(0), wallShields(1)]);
def('gu_asa_pedra', 'Asa petrificada', Wl, 'fundo', ['bastioes', 'laminas'], [stoneWing(0), stoneWing(1)], { alto: 4 });
def('gu_flechas_parede', 'Flechas cravadas', Wl, 'fundo', ['laminas', 'brecha', 'estandarte'], [wallArrows(0), wallArrows(1)]);

// o que cada faixa recebe por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
Object.assign(GU_PROP_PLAN, {
  laminas: { chao: [['gu_cavalo', 0.1, 1], ['gu_monte_armas', 0.1, 1], ['gu_cavaleiro_morto', 0.08, 1], ['gu_trabuco', 0.06, 1], ['gu_tambor', 0.03, 1]], teto: [], fundo: [['gu_flechas_parede', 0.12, 2], ['gu_escudos_parede', 0.06, 1], ['gu_asa_pedra', 0.03, 1]] },
  bastioes: { chao: [['gu_altar', 0.3, 1], ['gu_anjo_estatua', 0.12, 1], ['gu_cavaleiro_morto', 0.06, 1]], teto: [['gu_estandarte', 0.14, 1]], fundo: [['gu_asa_pedra', 0.07, 1], ['gu_escudos_parede', 0.08, 1]] },
  brecha: { chao: [['gu_cranio_demonio', 0.12, 1], ['gu_monte_armas', 0.06, 1], ['gu_tambor', 0.06, 1]], teto: [['gu_gaiola', 0.1, 1], ['gu_estandarte', 0.05, 1]], fundo: [['gu_flechas_parede', 0.08, 1]] },
  estandarte: { chao: [['gu_cavalo', 0.1, 1], ['gu_cavaleiro_morto', 0.1, 1], ['gu_monte_armas', 0.08, 1], ['gu_trabuco', 0.06, 1], ['gu_cranio_demonio', 0.05, 1], ['gu_tambor', 0.04, 1]], teto: [['gu_estandarte', 0.1, 1], ['gu_gaiola', 0.05, 1]], fundo: [['gu_escudos_parede', 0.08, 1], ['gu_flechas_parede', 0.08, 1]] }
});

/* ---------- a luz e os animados (só os objetos na tela) ---------- */
const guPt = (p, nm) => { const P = p.def.guPts && p.def.guPts[p.v]; return P && P[nm] ? P[nm] : null; };
const guLit = (wx, wy) => { if (typeof LB === 'undefined' || !LB) return 1; const i = Math.floor(wx / T) - LX0, j = Math.floor(wy / T) - LY0; return i >= 0 && j >= 0 && i < LW && j < LH ? clamp((LB[j * LW + i] - 0.06) * 3, 0, 1) : 0; };
const GL = {};
const glowC = (c, r) => GL[c + r] || (GL[c + r] = glow(r, c));
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.guerra) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy), hl = p.def.guHalo[p.v], nv = p.def.guLuz[p.v], A = p.def.anim;
    let br = 0.9 + Math.sin(gameTime * 1.4 + p.X * 0.05) * 0.1;
    if (A && A.k === 'gu_brasa') br = 0.6 + 0.4 * Math.sin(gameTime * 0.9 + p.X * 0.07);
    else if (A && A.k === 'gu_pena') br = 0.85 + Math.sin(gameTime * 2.1 + p.X) * 0.08 + Math.sin(gameTime * 5.3 + p.X) * 0.04;
    if (hl) { lc.globalAlpha = 0.55 * br; lc.drawImage(hl, X - HR, Y - HR); }
    if (nv) { lc.globalAlpha = 0.45 * br; lc.drawImage(nv, X, Y); }
    const Pn = guPt(p, 'pena'); if (Pn) for (const q of Pn) { lc.globalAlpha = 0.32 * br; lc.drawImage(glowC(GU_COL.luz, 22), X + q.x - 22, Y + q.y - 22); }
    const Bs = guPt(p, 'brasa'); if (Bs) for (const q of Bs) { lc.globalAlpha = 0.3 * br; lc.drawImage(glowC(GU_COL.brasa, 8), X + q.x - 8, Y + q.y - 8); }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i]; if (!p.def.guerra) continue;
    const X = Math.round(p.X + p.sh - cx), Y = Math.round(p.Y - cy);
    // os reflexos do ouro e do aço: raros, um de cada vez, só onde a luz bate
    const St = guPt(p, 'brilho'); if (St) for (let j = 0; j < St.length; j++) { const b = Math.sin(gameTime * (0.7 + hash2(j, p.X, 3) * 1.1) + j * 2.3 + p.X * 0.37); if (b < 0.94) continue; const lit = guLit(p.X + p.sh + St[j].x, p.Y + St[j].y); if (!lit) continue; lc.globalAlpha = Math.min(1, (b - 0.94) * 16) * lit; lc.fillStyle = '#fff6d8'; lc.fillRect(X + St[j].x - 1, Y + St[j].y, 3, 1); lc.fillRect(X + St[j].x, Y + St[j].y - 1, 1, 3); }
    // a brasa das órbitas por cima do escuro, no alto da respiração
    const Bs = guPt(p, 'brasa'); if (Bs) { const nv = p.def.guLuz[p.v], b = 0.5 + 0.5 * Math.sin(gameTime * 0.9 + p.X * 0.07); if (nv && b > 0.4) { lc.globalAlpha = (b - 0.4) * 0.8; lc.drawImage(nv, X, Y); } }
    const Pn = guPt(p, 'pena'); if (Pn) { const nv = p.def.guLuz[p.v]; if (nv) { lc.globalAlpha = 0.7; lc.drawImage(nv, X, Y); } }
  }
  lc.globalAlpha = 1;
});
}
