'use strict';

/* ================= os autômatos de runa da Fortaleza dos Anões =================
   Os seis autômatos de Brasafunda (docs/camadas/08-fortaleza-anoes.md, seção 6). Bronze com runas azuis, cumprindo a
   última ordem (guardar). Não sangram: soltam faíscas e óleo. Nenhum tem dano de contato, menos a serra do enxame.
   - soldbronze, o Soldado de Bronze: marcha rígida em passos fixos (passo metálico duplo), só vira parado e leva 0,5 s
     para isso; o escudo fica sempre do lado do herói e bloqueia de frente (BLOCK_E): é preciso pular por cima ou bater
     nas costas. A runa do peito fica vermelha (0,6 s) e ele estoca com a lança por trás do escudo, 3 blocos.
     anSoldierAt(px, py, zone) acorda um soldado (a carcaça possuída pelo Barba-de-Ferro do 184);
   - engrenagens, o Enxame de Engrenagens: um spawn são 5 rodinhas, cada uma um inimigo, que rolam e sobem degraus de
     1 bloco. Quando 3 ou mais se encostam, encaixam (clique e faíscas, 0,6 s) e viram uma serra que corre reta pelo
     chão (o dano dela é o único de contato da camada) até bater na parede e se desmontar. As 4 que nascem junto com a
     primeira levam e.anFollower: o 185 conta o enxame como 1 no máximo da faixa (como o cdFollower do 134/136);
   - fornalhaamb, a Fornalha Ambulante: lenta e pesada, com combustível (o medidor no flanco). Vazia, vai até a lava
     mais perto e fica 2 s de costas reabastecendo. A porta brilha e o fole incha (1 s): jato de brasa em cone de 4
     blocos. Com a porta aberta toma o dobro de dano;
   - runaviva, a Runa Viva: uma placa de granito com a runa gravada, achatada no chão, na parede ou no teto, que
     desliza como um adesivo. As bordas descolam e um zumbido sobe (0,7 s); ela salta girando como disco em linha reta
     e gruda de novo onde bater;
   - coruja, a Coruja de Corda: voa em círculos largos em volta do herói; os olhos piscam 3 vezes e sai uma rajada de
     3 pregos de latão. A cada 3 voltas pousa e dá corda (a chave gira nas costas, 2 s parada, vulnerável);
   - bombalava, a Bomba de Lava: anda ao longo dos canais e nunca se afasta mais de 10 blocos da lava. O tanque fica
     laranja e o bico treme (1 s); cospe uma bolha de lava em arco que vira poça de pedra quente (queima 2 s: anQueimar
     do 180) e esfria num bloco AN_PEDRA_QUENTE que some em 20 s. A pedra vai direto nos tiles, nunca nos `diffs`.
   Vida e dano são os de nível 1 (o 49 aplica o BAL; o 185 põe o nível da camada no embrulho do spawnEnemy).
   Mesmo pincel do 55/123/135 (cp, rampas de 6 tons, contorno, tudo assado uma vez). Carrega depois do 182 e antes do
   49. */

/* ---------- números ---------- */
Object.assign(ET, {
  soldbronze: { name: 'Soldado de Bronze', w: 10, h: 22, hp: 120, dmg: 20, xp: 22, kb: 0.2, fly: false, blood: '#2a2016' },
  engrenagens: { name: 'Enxame de Engrenagens', w: 7, h: 7, hp: 14, dmg: 7, xp: 4, kb: 1.2, fly: false, blood: '#2a2016' },
  fornalhaamb: { name: 'Fornalha Ambulante', w: 14, h: 26, hp: 300, dmg: 28, xp: 32, kb: 0.1, fly: false, blood: '#2a2016' },
  runaviva: { name: 'Runa Viva', w: 12, h: 6, hp: 40, dmg: 24, xp: 14, kb: 0, fly: true, phase: true, blood: '#3aa8d8' },   // phase: anda célula a célula colada na rocha
  coruja: { name: 'Coruja de Corda', w: 10, h: 10, hp: 55, dmg: 13, xp: 16, kb: 0.9, fly: true, blood: '#2a2016' },
  bombalava: { name: 'Bomba de Lava', w: 12, h: 17, hp: 140, dmg: 20, xp: 20, kb: 0.4, fly: false, blood: '#2a2016' }
});
const AN_AUTO = ['soldbronze', 'engrenagens', 'fornalhaamb', 'runaviva', 'coruja', 'bombalava'];
const AN_IS_AUTO = t => AN_AUTO.includes(t);

/* ---------- drops: os materiais do 187, carvão, poções; as bases raras (o sorteio de equipamento multiplica por 0,1,
   então 0,15 aqui dá 1,5%) ---------- */
const AN_DROPS = {
  soldbronze: [['runa_gravada', 0.45], ['min_mithril', 0.12, 1, 2], ['pocao', 0.08], ['machado_cla', 0.15], ['escudo_runico', 0.15]],
  engrenagens: [['mola_runica', 0.22], ['min_mithril', 0.03], ['pocao', 0.02]],
  fornalhaamb: [['brasa_domada', 0.6, 1, 2], ['carvao', 0.5, 1, 3], ['min_mithril', 0.14, 1, 2], ['pocao', 0.1], ['escudo_runico', 0.15]],
  runaviva: [['runa_gravada', 0.55], ['min_mithril', 0.08], ['pocao', 0.06]],
  coruja: [['mola_runica', 0.5], ['runa_gravada', 0.25], ['pocao', 0.06]],
  bombalava: [['brasa_domada', 0.55, 1, 2], ['carvao', 0.35, 1, 2], ['min_mithril', 0.1], ['pocao', 0.08]]
};
let anLateOk = false;
function anTables() { for (const k of AN_AUTO) DROPS[k] = AN_DROPS[k].filter(([id]) => ITEMS[id]); }
function anLate() {   // o que carrega depois (101: tipos de dano)
  if (anLateOk) return; anLateOk = true;
  anTables();
  if (typeof DMG_KIND !== 'undefined') Object.assign(DMG_KIND, { fornalhaamb: 'fogo', bombalava: 'fogo' });
}
anTables();
{ const _rd = rollDrops; rollDrops = function (e) { anLate(); return _rd.apply(this, arguments); }; }
Object.assign(CV_STEP, { soldbronze: 1, engrenagens: 1, fornalhaamb: 1, bombalava: 1 });

const AN_WAKE = 1.4, AN_SOLD_WIND = 0.6, AN_SOLD_TURN = 0.5, AN_SOLD_THRUST = 0.18;
const AN_LOCK = 0.6, AN_SAW_SP = 150, AN_SAW_MAX = 4;
const AN_FORN_CHARGE = 1, AN_FORN_BREATH = 0.5, AN_FORN_CONE = 4 * T, AN_FORN_REFUEL = 2;
const AN_PEEL = 0.7, AN_DISC_SP = 210;
const AN_OWL_R = 64, AN_OWL_WIND = 2, AN_OWL_BLINK = 0.9;
const AN_BOMB_CHARGE = 1, AN_POCA = 2, AN_PEDRA_T = 20, AN_LAVA_R = 10;

/* ================= arte ================= */
const ANA = {};
{
const { cp, set } = CVB;
const cg = CVART.cg;
const R6 = hexes => hexes.map(h => ph(h));
// as rampas da ficha (seção 12) e as que faltavam no mesmo espírito
const RA = {
  bz: R6(['#2a1a0c', '#4a2e14', '#70461e', '#9a6a2c', '#c49448', '#e8c27a']),       // bronze
  pa: R6(['#1a2a24', '#264036', '#345a4a', '#4a7a62', '#6a9a7e', '#94bca0']),       // pátina
  ru: R6(['#0e2a3a', '#145070', '#1e7aa8', '#3aa8d8', '#7ad0f0', '#d0f4ff']),       // runa acesa
  rv: R6(['#2a0a08', '#5a1410', '#8a2018', '#c83a24', '#f07a4a', '#ffd0b0']),       // a runa do peito em vermelho
  lv: R6(['#3a0c04', '#7a1e06', '#b8400a', '#e8700e', '#ffa62a', '#ffe08a']),       // lava dos canais
  tj: R6(['#3a2a18', '#5a4024', '#7a5832', '#9a7444', '#bc9660', '#dcbc88']),       // tijolo refratário
  gr: R6(['#1e2228', '#2e343c', '#424a54', '#5a646e', '#7a848c', '#9ea6ac']),       // granito anão
  fe: R6(['#0c0b0b', '#171514', '#24201e', '#34302c', '#4a443e', '#625a52']),       // ferro das juntas
  co: R6(['#140c08', '#24160e', '#382214', '#4e301c', '#664026', '#7e5232']),       // couro do fole, cabo da lança
  lt: R6(['#2e220a', '#4e3a10', '#7a5e1a', '#a8862a', '#d4b048', '#f2dc8a'])        // latão da coruja e dos pregos
};
// bronze com pátina nos fundos: onde o tom é escuro, o verde toma conta aos pedaços
const bz = (P, x, y, v, s) => { if (v < 2.4 && hash2((x | 0) >> 1, (y | 0) >> 1, s) < 0.3 + (2.4 - v) * 0.25) P.put(x, y, RA.pa, v + 0.5); else P.put(x, y, RA.bz, v); };
// uma placa retangular chanfrada, luz de cima à esquerda, riscos de uso
function plate(P, x0, y0, x1, y1, s, base = 2.8, R) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let v = base + (y === y0 ? 1.3 : y === y0 + 1 ? 0.4 : 0) + (x === x0 ? 0.6 : 0) - (y === y1 ? 1.1 : 0) - (x === x1 ? 0.8 : 0) + cg(x, y, s) * 0.55;
    if (hash2(x, y, s + 1) < 0.05) v += 1; else if (hash2(x, y, s + 2) < 0.04) v -= 1;
    if (R) P.put(x, y, R, v); else bz(P, x, y, v, s);
  }
}
// uma forma arredondada (elipse) sombreada como as do 55, em bronze com pátina ou numa rampa
function orb(P, cx, cy, rx, ry, s, base = 2.8, R, f) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
    const v = base + 1.2 - (dx * 0.8 + dy) * 1.3 - d * 0.6 + cg(x, y, s) * 0.5 + (f ? f(x, y, dx, dy) : 0);
    if (R) P.put(x, y, R, v); else bz(P, x, y, v, s);
  }
}
const rivet = (P, x, y) => { P.put(x, y, RA.bz, 5); P.put(x + 1, y + 1, RA.bz, 1); };

/* ---------- o Soldado de Bronze, 22 x 27 virado para a direita, pés na linha 26, centro em x 11 ----------
   o: { lg passo (-1..1), lean inclinação para a frente, rune 0 apagada / 1 azul / 2 vermelha, slump 0..1 caído (acordando) } */
function soldado(o) {
  const W = 22, H = 27, P = cp(W, H), s = 18301 + Math.round((o.lg || 0) * 3 + (o.lean || 0) * 7 + (o.rune || 0) * 11 + (o.slump || 0) * 13);
  const sl = o.slump || 0, lean = (o.lean || 0) + sl * 2.4, drop = Math.round(sl * 4);
  const ox = y => Math.round(lean * (19 - y) / 19), dy = y => y < 18 ? drop : 0;
  // pernas: grevas retas de bronze, a de trás na sombra; no passo uma vai à frente
  const lg = o.lg || 0;
  const leg = (x0, back) => {
    const sh = back ? 1.4 : 0;
    plate(P, x0, 19, x0 + 2, 22, s + (back ? 1 : 2), 2.6 - sh);
    plate(P, x0, 22, x0 + 2, 24, s + (back ? 3 : 4), 2.9 - sh);
    P.put(x0 + 1, 22, RA.fe, 1);   // a junta do joelho
    plate(P, x0, 25, x0 + 3, 26, s + (back ? 5 : 6), 2.4 - sh);   // o sabatão
  };
  if (sl > 0.5) { plate(P, 6, 23, 11, 24, s + 1, 1.6); plate(P, 7, 25, 13, 26, s + 2, 2.4); }   // ajoelhado
  else { leg(7 - Math.round(lg), true); leg(10 + Math.round(lg), false); }
  // a saia de lâminas do quadril
  for (let y = 17; y <= 19; y++) for (let x = 6; x <= 14; x++) bz(P, x + ox(y), y + dy(y) + (sl > 0.5 ? 3 : 0), 2.6 + (x % 2 ? -0.6 : 0.4) - (y - 17) * 0.4 + cg(x, y, s) * 0.4, s);
  // o tronco: couraça em barril, cinto de ferro
  for (let y = 9; y <= 16; y++) {
    const hw = y < 11 ? 3.6 + (y - 9) * 0.5 : y > 14 ? 4.2 - (y - 14) * 0.4 : 4.6;
    for (let x = Math.floor(10.5 - hw); x <= Math.ceil(10.5 + hw) - 1; x++) {
      const dx = (x + 0.5 - 10.5) / hw;
      bz(P, x + ox(y), y + dy(y), 3 + (y < 11 ? 0.9 : 0) - dx * 0.9 - (y - 12) * 0.12 - dx * dx * 0.9 + cg(x, y, s + 7) * 0.5 + (x === 10 && y > 10 ? 0.7 : 0), s + 7);
    }
  }
  for (let x = 7; x <= 14; x++) P.put(x + ox(16), 16 + dy(16), RA.fe, x === 10 ? 4.6 : 2);
  // a runa do peito
  const RR = o.rune === 2 ? RA.rv : RA.ru, rv = o.rune ? 4.2 : 1.8;
  for (const [x, y, k] of [[10, 11, 0], [12, 11, 0], [11, 12, 1], [10, 13, 0], [11, 13, 1], [12, 13, 0], [11, 14, 0]]) P.put(x + ox(y), y + dy(y), RR, rv + k * 0.8);
  // a ombreira de trás
  orb(P, 7 + ox(9), 9.6 + dy(9), 2.6, 2, s + 8, 2.4);
  rivet(P, 7 + ox(9), 9 + dy(9));
  // o pescoço e o elmo: cúpula com crista de pátina e a fenda da viseira
  for (let x = 8; x <= 12; x++) P.put(x + ox(8), 8 + dy(8), RA.fe, 2 + (x === 9 ? 1 : 0));
  const hx = 10.5 + ox(4) + sl * 1.5, hy = 4.6 + drop + sl * 1;
  orb(P, hx, hy, 3.4, 3.7, s + 9, 2.9);
  for (let k = 0; k < 5; k++) P.put(hx - 2 + k, hy - 3.6 + Math.abs(k - 2) * 0.35, RA.pa, 4 - Math.abs(k - 2) * 0.6);   // a crista
  for (let x = Math.floor(hx); x <= Math.floor(hx) + 3; x++) P.put(x, Math.floor(hy), RA.fe, 0.4);   // a fenda
  P.put(Math.floor(hx) + 2, Math.floor(hy), RA.ru, o.rune === 0 ? 1.4 : 4.4);   // o olho atrás da fenda
  P.put(Math.floor(hx) - 2, Math.floor(hy) + 2, RA.bz, 5); P.put(Math.floor(hx) + 3, Math.floor(hy) + 2, RA.bz, 1.4);
  // o escudo-torre na frente: placa curva, borda de pátina, a runa de guarda no centro
  const sx = 14 + ox(12), sy0 = 6 + drop + (sl > 0.5 ? 2 : 0), sy1 = Math.min(23, 22 + Math.round(drop * 0.5));
  for (let y = sy0; y <= sy1; y++) for (let x = sx; x <= sx + 4; x++) {
    const ex = (y - sy0) / (sy1 - sy0), edge = y === sy0 || y === sy1 || x === sx + 4;
    let v = 3.3 - (x - sx) * 0.25 - ex * 0.9 + cg(x, y, s + 10) * 0.5 + (x === sx ? -1.6 : 0) + (y === sy0 ? 1 : 0);
    if (edge) P.put(x, y, RA.pa, v + 0.4); else bz(P, x, y, v, s + 10);
  }
  const by = Math.round((sy0 + sy1) / 2);
  P.put(sx + 2, by - 1, RA.ru, rv); P.put(sx + 1, by, RA.ru, rv - 0.6); P.put(sx + 3, by, RA.ru, rv - 0.6); P.put(sx + 2, by + 1, RA.ru, rv); P.put(sx + 2, by, RA.bz, 5);
  rivet(P, sx + 1, sy0 + 2); rivet(P, sx + 1, sy1 - 3);
  return set(P.done());
}
// a lança: haste escura com virola, lâmina larga em folha (30 x 3, a ponta à direita)
function lanca() {
  const P = cp(30, 3), s = 18361;
  for (let x = 0; x <= 21; x++) { P.put(x, 1, RA.co, 2.6 + cg(x, 1, s) * 0.8 + (x % 5 === 0 ? -0.8 : 0)); }
  for (let x = 19; x <= 21; x++) P.put(x, 1, RA.bz, 4);
  for (let x = 22; x <= 29; x++) { const w = x < 26 ? 1 : x < 28 ? 0.6 : 0; P.put(x, 1, RA.bz, 4.6 - (x - 22) * 0.1); if (w >= 1 || (w > 0 && x % 2)) { P.put(x, 0, RA.bz, 5.2); P.put(x, 2, RA.bz, 2.2); } }
  P.put(29, 1, RA.bz, 5.6);
  return set(P.done());
}

/* ---------- as engrenagens: a rodinha 9 x 9 (8 dentes) e a serra 17 x 17 (14 dentes inclinados) ---------- */
function gear(W, R0, R1, teeth, s, saw) {
  const P = cp(W, W), c = W / 2;
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    let ph = ((a / (2 * Math.PI)) * teeth % 1 + 1) % 1;
    const tooth = saw ? r < R0 + (1 - ph) * (R1 - R0) : (ph > 0.25 && ph < 0.75 ? r < R1 : r < R0);
    if (!tooth) continue;
    let v = 3 - (dx + dy) / c * 0.9 + cg(x, y, s) * 0.5;
    if (r > R0 - 0.9) v += saw ? 1.2 : -0.5;                              // a borda dos dentes
    if (!saw && r < R0 - 0.5 && r > R0 - 1.6) v -= 0.8;                   // o aro
    if (saw && Math.abs(r - R0 * 0.62) < 0.6) v -= 1.4;                   // o círculo onde as rodinhas se encaixaram
    const hole = !saw && r > 1.4 && r < 2.6 && Math.cos(a * 4) > 0.6;      // os furos entre os raios
    if (hole) continue;
    if (r < (saw ? 2.2 : 1.4)) { P.put(x, y, RA.fe, 2 - r * 0.4); continue; }   // o eixo
    if (saw && r > R0) P.put(x, y, RA.fe, 3.6 + (1 - ph) * 2); else bz(P, x, y, v, s);
  }
  P.put(Math.floor(c), Math.floor(c), RA.ru, 4.4);   // a runa no eixo
  if (saw) for (let k = 0; k < 3; k++) { const a = k * 2.094; P.put(c + Math.cos(a) * 4 - 0.5, c + Math.sin(a) * 4 - 0.5, RA.ru, 3.6); }
  return set(P.done());
}

/* ---------- a Fornalha Ambulante, 30 x 30 virada para a direita, pés na linha 29, centro em x 15 ----------
   em camadas do mesmo tamanho (o espelho fica certo): o fole atrás (3 graus de inchaço), o corpo (2 passos), a porta
   (0 fechada, 1 brilhando, 2 aberta) */
function forFole(k) {
  const P = cp(30, 30), s = 18401 + k, sw = k * 1.3;
  const x0 = Math.round(4 - sw), x1 = 10;
  for (let y = 10; y <= 21; y++) for (let x = x0; x <= x1; x++) {
    const pleat = (y - 10) % 3, v = 2.4 + (pleat === 0 ? 1 : pleat === 2 ? -0.9 : 0) - (x - x0) * 0.08 + cg(x, y, s) * 0.5 + (x === x0 ? -0.7 : 0);
    if (x === x0 && (y < 11 || y > 20)) continue;
    P.put(x, y, RA.co, v + k * 0.15);
  }
  plate(P, x0 - 1, 9, x1, 9, s + 1, 3); plate(P, x0 - 1, 22, x1, 22, s + 2, 2);   // as tábuas de bronze
  P.put(x0 - 1, 15, RA.bz, 4); P.put(x0 - 2, 15, RA.bz, 3);                         // o bico do fole
  return set(P.done());
}
function forCorpo(step) {
  const P = cp(30, 30), s = 18411 + step;
  // pernas grossas e curtas; no passo uma sobe
  const lift = [step ? 1 : 0, step ? 0 : 1];
  plate(P, 9, 25 - lift[0], 12, 28 - lift[0], s, 1.6); plate(P, 8, 28 - lift[0], 13, 29 - lift[0], s + 1, 1.8);
  plate(P, 17, 25 - lift[1], 20, 28 - lift[1], s + 2, 2.8); plate(P, 16, 28 - lift[1], 22, 29 - lift[1], s + 3, 3);
  // a chaminé
  plate(P, 11, 2, 13, 8, s + 4, 2.8); plate(P, 10, 1, 14, 2, s + 5, 3.2);
  // o corpo: tijolo refratário em fiadas desencontradas, cintas de bronze
  for (let y = 9; y <= 24; y++) for (let x = 8; x <= 23; x++) {
    const row = Math.floor((y - 9) / 3), off = row % 2 ? 2 : 0, lx = (x - 8 + off) % 5, ly = (y - 9) % 3;
    const mort = ly === 2 || lx === 4, d = (x - 8) / 15;
    let v = 2.6 - d * 1.1 + (y < 12 ? 0.5 : 0) - (y > 21 ? 0.6 : 0) + cg(x, y, s + 6) * 0.6 + (hash2(Math.floor((x + off) / 5), row, s) - 0.5) * 0.8;
    if (mort) v -= 1.3; if (ly === 0 && !mort) v += 0.5;
    if (x === 8 || x === 23) v -= 0.8;
    P.put(x, y, RA.tj, v);
  }
  for (const y of [9, 10]) for (let x = 8; x <= 23; x++) bz(P, x, y, 3.6 - (y - 9) * 1.2 - (x - 8) * 0.06 + cg(x, y, s) * 0.4, s + 7);
  for (const y of [23, 24]) for (let x = 8; x <= 23; x++) bz(P, x, y, 2.6 - (y - 23) * 1 - (x - 8) * 0.06 + cg(x, y, s) * 0.4, s + 8);
  for (let y = 9; y <= 24; y++) { bz(P, 8, y, 3.2, s + 9); bz(P, 23, y, 1.8, s + 9); }
  for (const [x, y] of [[9, 9], [15, 9], [21, 9], [9, 23], [15, 23], [21, 23]]) rivet(P, x, y);
  // a cabeça: uma cúpula pequena com o olho azul, presa na frente de cima
  orb(P, 20.5, 6.8, 2.8, 2.4, s + 10, 2.8);
  P.put(22, 6, RA.ru, 4.6); P.put(21, 6, RA.fe, 0.6);
  // o mostrador do combustível no flanco (o ponteiro é desenhado por cima)
  orb(P, 12.5, 17.5, 2.2, 2.2, s + 11, 3.4, RA.bz); orb(P, 12.5, 17.5, 1.4, 1.4, s + 12, 1.6, RA.fe);
  return set(P.done());
}
function forPorta(k) {
  const P = cp(30, 30), s = 18431 + k;
  if (k === 2) {   // aberta: a boca de lava e a porta virada na dobradiça
    orb(P, 18.5, 17, 3.2, 3.8, s, 3.8, RA.lv, (x, y, dx, dy) => (Math.abs(dx) > 0.75 || Math.abs(dy) > 0.8 ? -1.6 : 0.6));
    for (let y = 13; y <= 21; y++) { bz(P, 23, y, 3.4 - (y - 13) * 0.15, s); bz(P, 24, y, 2.2, s); }
    return set(P.done());
  }
  plate(P, 15, 13, 22, 21, s, 3);
  for (const y of [15, 17, 19]) for (let x = 16; x <= 21; x++) P.put(x, y, RA.lv, k === 1 ? 4.2 - Math.abs(x - 18.5) * 0.3 : 1.2 + (x % 2) * 0.4);   // a grelha
  P.put(22, 17, RA.bz, 5);   // a tranca
  return set(P.done());
}

/* ---------- a Runa Viva, 14 x 5: uma lápide fina de granito com a runa gravada na face ----------
   0 colada, 1-2 as bordas descolando (o aviso) */
function runa(k) {
  const P = cp(14, 6), s = 18501 + k;
  for (let x = 0; x <= 13; x++) {
    const e = Math.min(x, 13 - x), lift = e < 2 ? (2 - e) * k * 0.6 : 0, top = Math.round(2 - lift);
    for (let y = top; y <= top + 2; y++) P.put(x, y, RA.gr, (y === top ? 4.4 : 2.6 - (y - top) * 0.6) + cg(x, y, s) * 0.6 - (x === 13 ? 0.6 : 0) + (x === 0 ? 0.4 : 0));
    if (lift > 0.5) P.put(x, top + 3, RA.gr, 0.6);   // a sombra embaixo da borda que descolou
  }
  // a runa: traços azuis na face (e uma linha no tampo)
  for (const [x, y] of [[4, 3], [5, 4], [6, 3], [7, 3], [7, 4], [8, 3], [9, 4], [10, 3]]) P.put(x, y, RA.ru, 3.6 + k * 0.5);
  for (let x = 3; x <= 10; x += 2) P.put(x, 2, RA.ru, 2.4 + k * 0.6);
  return set(P.done());
}

/* ---------- a Coruja de Corda, 17 x 15 virada para a direita ----------
   0-2 bater de asa (cima, meio, baixo), 3 pousada, 4 pousada de olho fechado, 5 asa no meio de olho fechado */
function coruja(pose) {
  const P = cp(17, 15), s = 18601 + pose, perched = pose >= 3 && pose <= 4, shut = pose === 4 || pose === 5;
  const wing = perched ? -1 : pose === 5 ? 1 : pose;
  // a asa de trás (só no voo), mais escura
  const wingPts = w => w === 0 ? [[6, 6], [3, 1], [0, 0]] : w === 1 ? [[6, 7], [2, 6], [0, 7]] : w === 2 ? [[6, 8], [3, 12], [1, 14]] : null;
  const drawWing = (pts, dark, off) => {
    if (!pts) return;
    for (let k = 0; k < 5; k++) {   // cinco penas de bronze em leque
      const t = k / 4, tx = lerp(pts[1][0], pts[2][0], t) + off, ty = lerp(pts[1][1], pts[2][1], t) + (k - 2) * 0.6;
      const n = 10; for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(pts[0][0] + off, tx, u), y = lerp(pts[0][1], ty, u); bz(P, x, y, 3.4 - u * 0.8 - dark + (k % 2 ? -0.4 : 0.3) + cg(x | 0, y | 0, s) * 0.4, s + k); }
    }
  };
  drawWing(wingPts(wing), 1.4, 1.5);
  // o corpo: ovo de latão com escamas de pena
  orb(P, 8.5, 8.6, 4.2, 4.4, s, 3, RA.bz, (x, y) => ((x + (y % 2) * 1.5) % 3 < 1 ? -0.8 : 0) + (y % 2 ? 0 : 0.3));
  for (let y = 7; y <= 11; y++) for (let x = 9; x <= 11; x++) if ((x + y) % 2 === 0) P.put(x, y, RA.lt, 3.6 - (y - 7) * 0.3);   // o peito de latão em escamas
  // a cabeça com as orelhas e os olhos de vidro azul
  orb(P, 10.2, 4.4, 3.4, 3, s + 1, 3, RA.bz);
  P.put(7.6, 1, RA.bz, 3.4); P.put(7.2, 0, RA.bz, 4); P.put(12.4, 1, RA.bz, 3); P.put(12.8, 0, RA.bz, 3.6);
  for (const [cx, r, b] of [[9, 1.2, -0.8], [12, 1.5, 0]]) {
    for (let y = 2; y <= 7; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - 4.6); if (d > r + 0.6) continue;
      if (d > r - 0.1) P.put(x, y, RA.bz, 1.6); else if (shut) P.put(x, y, RA.bz, 3.4 - (y - 3) * 0.3 + b); else P.put(x, y, RA.ru, 4 + b - d * 0.8 + (x < cx && y < 4.6 ? 1 : 0));
    }
  }
  P.put(14, 6, RA.lt, 1.8); P.put(14, 5, RA.lt, 4); P.put(15, 6, RA.lt, 2.4);   // o bico
  // a asa da frente e as garras
  drawWing(wingPts(wing), 0, 0);
  if (perched) {
    for (let x = 5; x <= 9; x++) bz(P, x, 9 + Math.abs(x - 7) * 0.3, 3.2 - (x - 5) * 0.2, s + 9);   // a asa fechada no flanco
    for (const x of [6, 10]) { P.put(x, 13, RA.fe, 3); P.put(x - 1, 14, RA.fe, 2.4); P.put(x + 1, 14, RA.fe, 3.6); }
  } else { P.put(7, 13, RA.fe, 2.6); P.put(9, 13, RA.fe, 3.2); }
  return set(P.done());
}
// a chave de corda nas costas, girando: 7 x 5, 4 quadros (de frente, meio, de lado, meio)
function chave(k) {
  const P = cp(7, 5), w = [3, 2, 0, 2][k];
  P.put(3, 4, RA.fe, 2); P.put(3, 3, RA.lt, 3);
  for (let x = -w; x <= w; x++) { P.put(3 + x, 1, RA.lt, 4 - Math.abs(x) * 0.3); P.put(3 + x, 2, RA.lt, 2.6); if (Math.abs(x) === w && w) P.put(3 + x, 0, RA.lt, 3.6); }
  P.put(3, 0, RA.lt, 5);
  return set(P.done());
}

/* ---------- a Bomba de Lava, 24 x 22 virada para a direita, pés na linha 21, centro em x 12 ----------
   0-1 passo, 2 o tanque em brasa (o aviso) */
function bomba(pose) {
  const P = cp(24, 22), s = 18701 + pose, hot = pose === 2, step = pose === 1 ? 1 : 0;
  // as pernas
  plate(P, 8, 17 - step, 10, 20 - step, s, 1.8); plate(P, 7, 20 - step, 11, 21 - step, s + 1, 2);
  plate(P, 13, 17 - (1 - step) * (pose === 2 ? 0 : 1), 15, 20 - (1 - step) * (pose === 2 ? 0 : 1), s + 2, 2.8);
  plate(P, 13, 20 - (pose === 2 ? 0 : 1 - step), 17, 21 - (pose === 2 ? 0 : 1 - step), s + 3, 3);
  // o tanque nas costas: cilindro de pé, cintas, a janela de vidro com a lava dentro
  for (let y = 3; y <= 16; y++) for (let x = 1; x <= 8; x++) {
    const dx = (x + 0.5 - 4.5) / 3.6, top = y < 5 ? Math.abs(dx) > (y - 2) * 0.45 : false; if (top) continue;
    bz(P, x, y, 3 - dx * 1.1 - dx * dx * 0.6 + (y < 5 ? 0.8 : 0) + cg(x, y, s + 4) * 0.5 + (y === 6 || y === 14 ? -0.9 : y === 7 || y === 15 ? 0.6 : 0), s + 4);
  }
  for (let y = 8; y <= 13; y++) for (let x = 3; x <= 5; x++) P.put(x, y, RA.lv, (hot ? 4.4 : 2.4) - (y - 8) * 0.15 + (x === 3 ? 0.6 : 0) + (y === 8 ? -1.2 : 0));
  P.put(4, 2, RA.bz, 4.4); P.put(4, 1, RA.fe, 3);   // a válvula no topo
  // o corpo: caixa de bronze rebitada
  plate(P, 7, 9, 17, 17, s + 5, 3);
  for (const [x, y] of [[8, 10], [16, 10], [8, 15], [16, 15]]) rivet(P, x, y);
  for (let x = 9; x <= 15; x++) P.put(x, 13, RA.fe, 1.6);   // a fresta da bomba
  // o cano do tanque ao bico, e o bico virado para cima, com a boca larga
  for (let x = 8; x <= 17; x++) bz(P, x, 8 - (x > 14 ? (x - 14) * 0.6 : 0), 3.6 - (x - 8) * 0.05, s + 6);
  for (let k = 0; k < 6; k++) { const x = 17 + k, y = 7.6 - k * 0.7; bz(P, x, y, 3.8, s + 7); bz(P, x, y + 1, 2.2, s + 7); }
  orb(P, 22.4, 3.4, 1.6, 1.8, s + 8, 3.2); P.put(23, 3, RA.lv, hot ? 4.6 : 1.4);
  // a cabeça
  orb(P, 13.5, 6.6, 2.6, 2.4, s + 9, 3);
  P.put(15, 6, RA.ru, 4.6); P.put(14, 6, RA.fe, 0.6);
  return set(P.done());
}

const GL = { ru: glow(7, '#3aa8d8'), ruS: glow(4, '#7ad0f0'), rv: glow(8, '#f05a3a'), lv: glow(12, '#ff8a1a'), lvS: glow(6, '#ffa62a'), lvB: glow(18, '#ff7a14'), spark: glow(5, '#ffd27a') };
ANA.get = () => ANA.ready || (ANA.ready = {
  sold: {
    stand: soldado({}), s0: soldado({ lg: 1 }), s1: soldado({ lg: -1 }),
    wind: soldado({ lean: -0.6, rune: 2 }), thrust: soldado({ lean: 1.2, rune: 2, lg: 1 }),
    w0: soldado({ slump: 1, rune: 0 }), w1: soldado({ slump: 0.55, rune: 1 })
  },
  lanca: lanca(),
  cog: gear(9, 3.3, 4.4, 8, 18341, false), saw: gear(17, 6.2, 8.5, 14, 18351, true),
  fole: [0, 1, 2].map(forFole), forno: [0, 1].map(forCorpo), porta: [0, 1, 2].map(forPorta),
  runa: [0, 1, 2].map(runa),
  owl: [0, 1, 2, 3, 4, 5].map(coruja), chave: [0, 1, 2, 3].map(chave),
  bomba: [0, 1, 2].map(bomba)
});
ANA.GL = GL; ANA.RA = RA;
}

/* ================= ajudantes ================= */
function anWand(e, dt) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
// faíscas (o "sangue" deles) e gotas de óleo
function anSpark(x, y, n, sp = 70) {
  if (parts.length > 650) return;
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random() * 0.8); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.4, g: 380, life: 0.25 + Math.random() * 0.3, max: 0.5, col: Math.random() < 0.4 ? '#fff1b8' : '#ffb84a', size: 1, glow: true }); }
}
function anOil(x, y, n) {
  if (parts.length > 650) return;
  for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), vx: rnd(-40, 40), vy: rnd(-70, -10), g: 460, life: 0.6, max: 0.6, col: Math.random() < 0.6 ? '#1a1410' : '#3a2e1e', size: 1 });
}
function anEmber(x, y, vx, vy, life = 0.5) {
  if (parts.length > 680) return;
  parts.push({ x, y, vx, vy, g: -30, life, max: life, col: Math.random() < 0.3 ? '#ffe08a' : Math.random() < 0.6 ? '#ffa62a' : '#e8700e', size: 1, glow: true });
}
const anNearHero = (e, r = 170) => Math.abs(e.x - pl.x) < r && Math.abs(e.y - pl.y) < r;
// lava logo à frente dos pés: na altura do corpo ou no fundo do buraco à frente
function anLavaAhead(e, dir) {
  const fx = Math.floor((dir > 0 ? e.x + e.w + 3 : e.x - 3) / T), fy = Math.floor((e.y + e.h + 1) / T);
  if (tileAt(fx, fy - 1) === LAVA) return true;
  for (let k = 0; k < 6; k++) { if (tileAt(fx, fy + k) === LAVA) return true; if (solidAt(fx, fy + k)) return false; }   // o buraco à frente acaba em lava
  return false;
}
// anda no chão sem nunca pular, sem cair de penhasco e sem entrar na lava (os pesados)
function anGround(e, dt, dir, sp, acc = 300) {
  if (dir && e.onGround) {
    if (anLavaAhead(e, dir)) dir = 0;
    else if (ledgeAhead(e, dir, 0, false) === 'stop') dir = 0;
  }
  e.vx = approach(e.vx, dir * sp, acc * dt);
  return dir;
}
// a lava mais perto de (tx, ty): { x, y } ou null; varre colunas para fora, até r de lado e h para cima e para baixo
function anFindLava(tx, ty, r, h) {
  for (let k = 0; k <= r; k++) for (const sd of k ? [-1, 1] : [1]) {
    const x = tx + sd * k;
    for (let d = 0; d <= h; d++) for (const sy of d ? [1, -1] : [1]) if (tileAt(x, ty + sy * d) === LAVA) return { x: wrapX(x), y: ty + sy * d };
  }
  return null;
}
// tem lava encostada no corpo (do lado, ou embaixo dos pés até 3 blocos: canal com grade)?
function anLavaNear(e, r) {
  const x0 = Math.floor(e.x / T) - r, x1 = Math.floor((e.x + e.w) / T) + r, y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h) / T) + 3;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileAt(x, y) === LAVA) return { x: wrapX(x), y };
  return null;
}

/* ================= o Soldado de Bronze ================= */
// o golpe de frente bate no escudo: menos quando ele está acordando, atordoado de verdade ou o herói vem de cima
BLOCK_E.soldbronze = (e, dir) => e.state !== 'waking' && e.stun <= 0.3 && dir === -e.facing && !(pl.y + pl.h <= e.y + 4);
AI.soldbronze = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'waking') {   // a carcaça se levanta: faíscas nas juntas, a runa acende
    e.vx = approach(e.vx, 0, 600 * dt);
    if (Math.random() < dt * 14) anSpark(ecx + rnd(-5, 5), e.y + rnd(4, 18), 1, 40);
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.6; e.stepT = 0.2; sfx.anStep(); }
    return;
  }
  if (e.state === 'turn') {   // vira no lugar, em 0,5 s, com rangido
    e.vx = 0;
    if (e.stateT <= 0) { e.facing = -e.facing; e.state = 'walk'; e.stepT = 0.25; sfx.anStep(0.6); }
    return;
  }
  if (e.state === 'wind') {   // a runa do peito fica vermelha: a estocada vem
    e.vx = 0; e.reach = lerp(0, -4, easeOut(clamp(1 - e.stateT / AN_SOLD_WIND, 0, 1)));
    if (e.stateT <= 0) { e.state = 'thrust'; e.stateT = AN_SOLD_THRUST; e.swingHit = false; sfx.anThrust(); }
    return;
  }
  if (e.state === 'thrust') {
    const k = clamp(1 - e.stateT / AN_SOLD_THRUST, 0, 1); e.reach = lerp(-4, 16, easeOut(k)); e.vx = 0;
    if (!e.swingHit && k > 0.3) {
      e.swingHit = true;
      const hb = { x: e.facing > 0 ? ecx : ecx - 40, y: e.y + 7, w: 40, h: 10 };
      if (!pl.dead && overlap(hb, pl) && clearPath(e, pl)) { const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'block' || r === 'parry') { anSpark(e.x + e.w / 2 + e.facing * 30, e.y + 12, 6); e.state = 'recover'; e.stateT = r === 'parry' ? 1.2 : 0.7; return; } }
    }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; }
    return;
  }
  if (e.state === 'recover') { e.vx = 0; e.reach = lerp(e.reach || 0, 0, Math.min(1, dt * 6)); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.6; } return; }
  // a marcha: um passo de 0,28 s, uma parada; só vira quando está parado
  e.state = 'walk'; e.reach = 0;
  let want = 0;
  if (aggro) want = Math.abs(dx) > 22 ? Math.sign(dx) : 0;
  else { anWand(e, dt); want = e.wander; }
  const side = aggro ? Math.sign(dx) || e.facing : want || e.facing;
  e.stepT = (e.stepT || 0) - dt; e.moveT = (e.moveT || 0) - dt;
  if (e.moveT > 0) {
    let dir = e.facing;
    if (e.onGround && (ledgeAhead(e, dir, dy, false) === 'stop' || anLavaAhead(e, dir))) { dir = 0; if (!aggro) e.wander = 0; }
    e.vx = dir * (28 + e.lvl * 0.4);
    if (e.onGround && e.hitWall && dir) { e.moveT = 0; }   // parede alta: espera
  } else {
    e.vx = 0;
    if (side !== e.facing && (aggro ? Math.abs(dx) > 6 : true) && e.onGround) { e.state = 'turn'; e.stateT = AN_SOLD_TURN; sfx.anGrind(); return; }
    if (e.stepT <= 0 && want === e.facing) { e.stepT = 0.55; e.moveT = 0.28; e.stepN = (e.stepN || 0) + 1; if (anNearHero(e)) sfx.anStep(); }
  }
  if (aggro && e.moveT <= 0 && e.atkCD <= 0 && Math.abs(dx) < 34 && Math.abs(dy) < 20 && Math.sign(dx) === e.facing && e.onGround && clearPath(e, pl)) {
    e.state = 'wind'; e.stateT = AN_SOLD_WIND; e.vx = 0; sfx.anRune();
  }
};
// acorda um Soldado de Bronze (a carcaça possuída do 184): px, py como no spawnEnemy (canto de cima à esquerda)
function anSoldierAt(px, py, zone) {
  if (rectSolid(px, py, ET.soldbronze.w, ET.soldbronze.h)) return null;
  const e = spawnEnemy('soldbronze', px, py, zone);
  if (!e || e.dead) return null;
  e.state = 'waking'; e.stateT = AN_WAKE; e.vx = 0; e.atkCD = AN_WAKE + 0.4; e.anWoke = true;
  anSpark(px + e.w / 2, py + e.h / 2, 10, 60); sfx.anWake();
  return e;
}

/* ================= o Enxame de Engrenagens ================= */
AI.engrenagens = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.anAggro = aggro;
  const ecx = e.x + e.w / 2;
  if (e.state === 'join') {   // puxada para a rodinha líder: desliza até ela
    const L = e.anLead;
    if (!L || L.dead || L.state !== 'lock') { e.state = 'roll'; e.anLead = null; return; }
    const tx = L.x + L.w / 2 + (e.joinOff || 0);
    e.vx = (tx - ecx) * 8; e.rot = (e.rot || 0) + dt * 6;
    if (Math.abs(tx - ecx) < 1) e.vx = 0;
    if (Math.random() < dt * 8) anSpark(ecx, e.y + e.h / 2, 1, 40);
    return;
  }
  if (e.state === 'lock') {   // encaixando: as rodinhas se juntam, faíscas e cliques (o aviso)
    e.vx = 0; e.rot = (e.rot || 0) + dt * (4 + (1 - e.stateT / AN_LOCK) * 30);
    if (Math.random() < dt * 20) anSpark(ecx + rnd(-6, 6), e.y + e.h / 2, 1, 60);
    e.lockClick = (e.lockClick || 0) - dt; if (e.lockClick <= 0) { e.lockClick = 0.15; sfx.anClick(); }
    if (e.stateT <= 0) anSawForm(e);
    return;
  }
  if (e.state === 'saw') {   // a serra corre reta pelo chão até bater na parede
    if (e.hitWall || e.stateT <= 0 || (e.onGround && anLavaAhead(e, e.sawDir))) { anSawBreak(e); return; }   // a parede, ou a beira da lava
    e.vx = approach(e.vx, e.sawDir * AN_SAW_SP, 600 * dt); e.rot = (e.rot || 0) + e.sawDir * dt * 30; e.facing = e.sawDir;
    e.sawHitT = (e.sawHitT || 0) - dt;
    if (e.onGround && Math.random() < dt * 30) anSpark(ecx - e.sawDir * 4, e.y + e.h, 1, 50);
    if (!pl.dead && e.sawHitT <= 0 && overlap(e, pl)) {
      e.sawHitT = 0.6;
      const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'block' || r === 'parry') { e.stun = 0; anSawBreak(e); return; }   // o escudo desmonta a serra
    }
    return;
  }
  // rolando, cada uma por si: no herói de longe; perto dele, para a irmã mais próxima que ainda não encostou
  e.state = 'roll';
  let dir = 0;
  if (aggro) {
    let tx = ecx + dx;
    if (dist < 60) {
      let best = null, bd = 60;
      for (const o of enemies) { if (o === e || o.dead || o.type !== 'engrenagens' || o.state !== 'roll') continue; const d = Math.abs(o.x - e.x) + Math.abs(o.y - e.y); if (d > 8 && d < bd) { bd = d; best = o; } }
      if (best) tx = best.x + best.w / 2;
    }
    dir = Math.abs(tx - ecx) > 3 ? Math.sign(tx - ecx) : 0;
  } else { anWand(e, dt); dir = e.wander; }
  if (dir && e.onGround && (ledgeAhead(e, dir, dy, aggro) === 'stop' || anLavaAhead(e, dir))) dir = 0;
  if (dir) e.facing = dir;
  e.vx = approach(e.vx, dir * (24 + e.lvl * 0.5 + (e.seed % 1) * 8), 200 * dt);
  e.rot = (e.rot || 0) + e.vx * dt / 4;
};
// encaixe: as rodinhas que se tocam (3 ou mais) viram uma; checado algumas vezes por segundo para todo o enxame
let anLockT = 0;
function anLockScan(dt) {
  if ((anLockT -= dt) > 0) return; anLockT = 0.2;
  const R = [];
  for (const e of enemies) if (!e.dead && e.type === 'engrenagens' && e.state === 'roll' && e.onGround && e.stun <= 0 && e.anAggro && e.atkCD <= 0) R.push(e);
  if (R.length < 3) return;
  const used = new Set();
  for (const a of R) {
    if (used.has(a)) continue;
    const C = [a]; used.add(a);
    for (let i = 0; i < C.length; i++) for (const b of R) { if (used.has(b)) continue; if (Math.abs(b.x - C[i].x) < 9 && Math.abs(b.y - C[i].y) < 6) { used.add(b); C.push(b); } }
    if (C.length < 3) continue;
    // a líder: uma que não seja seguidora (o enxame continua contando como 1), a mais perto do herói
    let L = C.find(o => !o.anFollower) || C[0];
    if (!C.find(o => !o.anFollower)) { let bd = 1e9; for (const o of C) { const d = Math.abs(o.x - pl.x); if (d < bd) { bd = d; L = o; } } }
    L.state = 'lock'; L.stateT = AN_LOCK; L.anMembers = C.filter(o => o !== L); L.vx = 0; L.facing = Math.sign(pl.x - L.x) || L.facing;
    L.anMembers.forEach((o, i) => { o.state = 'join'; o.anLead = L; o.joinOff = (i % 2 ? 1 : -1) * (1 + (i >> 1)); });
    sfx.anClick();
  }
}
function anSawForm(L) {
  const M = (L.anMembers || []).filter(o => !o.dead && o.anLead === L);
  if (M.length < 2) { L.state = 'roll'; L.atkCD = 1; for (const o of M) { o.state = 'roll'; o.anLead = null; } return; }
  let hp = L.hp, mx = L.maxHp;
  for (const o of M) { hp += o.hp; mx += o.maxHp; o.dead = true; o.despawn = true; o.anMerged = true; }
  const n = M.length + 1, cx = L.x + L.w / 2, by = L.y + L.h;
  L.anN = n; L.anCogDmg = L.anCogDmg || L.dmg; L.hp = hp; L.maxHp = mx; L.dmg = Math.round(L.anCogDmg * (1 + 0.5 * (n - 1)));
  L.w = 14; L.h = 14; L.x = cx - 7; L.y = by - 14;
  for (let k = 0; k < 4 && rectSolid(L.x, L.y, L.w, L.h); k++) L.y -= 4;
  L.state = 'saw'; L.stateT = AN_SAW_MAX; L.sawDir = Math.sign(pl.x + pl.w / 2 - cx) || L.facing; L.vx = 0; L.sawHitT = 0; L.anMembers = null;
  anSpark(cx, by - 7, 14, 90); sfx.anLock(); sfx.anSaw();
}
// a serra bate e se desmonta: as rodinhas saem voando e ficam tontas um instante
function anSawBreak(L) {
  const n = L.anN || 1, cx = L.x + L.w / 2, by = L.y + L.h, each = Math.max(1, Math.ceil(L.hp / n)), eachMax = Math.max(1, Math.round(L.maxHp / n));
  L.w = 7; L.h = 7; L.x = cx - 3.5; L.y = by - 7; L.hp = each; L.maxHp = eachMax; L.dmg = L.anCogDmg || L.dmg; L.anN = 1;
  L.state = 'roll'; L.stun = 1; L.vx = -L.sawDir * 60; L.vy = -140; L.atkCD = 3;
  anPacking = true;
  for (let i = 1; i < n; i++) {
    const o = spawnEnemy('engrenagens', cx - 3.5, by - 7, zoneAt(Math.floor(cx / T), Math.floor(by / T) - 1));
    if (!o || o.dead) continue;
    Object.assign(o, { anFollower: true, anNoPack: true, lvl: L.lvl, hp: each, maxHp: eachMax, dmg: L.dmg, xp: L.xp, gold: L.gold, state: 'roll', stun: 1, atkCD: 3, vx: rnd(-90, 90), vy: rnd(-180, -100), anAggro: true });
  }
  anPacking = false;
  anSpark(cx, by - 5, 16, 110); anOil(cx, by - 5, 4); sfx.anClatter();
  shake(1.5);
}

/* ================= a Fornalha Ambulante ================= */
AI.fornalhaamb = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.lavaT = 9;   // é feita de fogo: a lava não a queima
  const ecx = e.x + e.w / 2;
  e.fuel = Math.max(0, (e.fuel ?? 1) - dt * 0.006);
  if (Math.random() < dt * 2.5) parts.push({ x: e.x + e.w / 2 + e.facing * -3, y: e.y - 3, vx: rnd(-4, 4), vy: rnd(-16, -8), g: -6, life: 1.4, max: 1.4, col: Math.random() < 0.5 ? '#2a2420' : '#3a322c', size: 1, smoke: true });   // a fumaça da chaminé
  if (e.state === 'charge') {   // a porta brilha, o fole incha
    e.vx = approach(e.vx, 0, 500 * dt);
    if (Math.random() < dt * 12) anEmber(ecx + e.facing * 6, e.y + 13, e.facing * rnd(5, 20), rnd(-20, 0), 0.4);
    if (e.stateT <= 0) { e.state = 'breath'; e.stateT = AN_FORN_BREATH; e.swingHit = false; e.fuel = Math.max(0, e.fuel - 0.34); sfx.anRoar(); }
    return;
  }
  if (e.state === 'breath') {   // o jato de brasa: cone de 4 blocos
    e.vx = 0;
    const ox = ecx + e.facing * 7, oy = e.y + 13, a0 = e.aim;
    for (let i = 0; i < 4; i++) { const a = a0 + rnd(-0.42, 0.42), v = rnd(110, 190); anEmber(ox, oy, Math.cos(a) * v, Math.sin(a) * v, AN_FORN_CONE / v * rnd(0.7, 1.05)); }
    if (!e.swingHit && !pl.dead) {
      const px = pl.x + pl.w / 2 - ox, py = pl.y + pl.h / 2 - oy, d = Math.hypot(px, py);
      let da = Math.atan2(py, px) - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      if (d < AN_FORN_CONE + 6 && Math.abs(da) < 0.5 + 6 / Math.max(8, d) && losClear(ox, oy, pl.x + pl.w / 2, pl.y + pl.h / 2)) {
        e.swingHit = true;
        const r = hurtPlayer(e.dmg, ecx, e, false);
        if (r === 'hit') anQueimar(1.5, Math.max(1, Math.round(e.dmg * 0.15)));
      }
    }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.8; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2 + Math.random(); } return; }
  if (e.state === 'refuel') {   // de costas para o mundo, puxando a lava pelo fole
    e.vx = 0;
    const L = e.lavaAt;
    if (L && Math.random() < dt * 30) { const sx = (L.x + 0.5) * T, sy = (L.y + 0.2) * T, tx = ecx - e.facing * 6, ty = e.y + 14; anEmber(sx + rnd(-4, 4), sy, (tx - sx) * 2.2, (ty - sy) * 2.2, 0.45); }
    e.gulpT = (e.gulpT || 0) - dt; if (e.gulpT <= 0) { e.gulpT = 0.5; sfx.anGlug(); }
    e.fuel = Math.min(1, e.fuel + dt / AN_FORN_REFUEL);
    if (e.stateT <= 0) { e.state = 'walk'; e.fuel = 1; e.atkCD = 0.6; sfx.anBellows(); }
    return;
  }
  if (e.state === 'cool') {   // sem lava por perto: esfria parada, soltando fumaça, e volta com meia carga
    e.vx = approach(e.vx, 0, 400 * dt);
    if (e.stateT <= 0) { e.state = 'walk'; e.fuel = 0.6; }
    return;
  }
  // sem combustível: vai até a lava mais perto
  if (e.fuel < 0.05) {
    e.state = 'seek';
    const near = anLavaNear(e, 1);
    if (near && e.onGround) { e.state = 'refuel'; e.stateT = AN_FORN_REFUEL; e.lavaAt = near; e.facing = Math.sign((near.x + 0.5) * T - ecx) || e.facing; e.vx = 0; sfx.anBellows(); return; }
    e.lavaScanT = (e.lavaScanT || 0) - dt;
    if (e.lavaScanT <= 0) { e.lavaScanT = 1; e.lavaGoal = anFindLava(Math.floor(ecx / T), Math.floor((e.y + e.h - 1) / T), 26, 8); e.seekT = (e.seekT || 0) + 1; }
    if (!e.lavaGoal || e.seekT > 14) { e.state = 'cool'; e.stateT = 4; e.seekT = 0; return; }
    const tx = (e.lavaGoal.x + 0.5) * T; let ddx = tx - ecx; const WPX = WW * T; if (ddx > WPX / 2) ddx -= WPX; else if (ddx < -WPX / 2) ddx += WPX;
    const dir = anGround(e, dt, Math.sign(ddx), 20 + e.lvl * 0.3);
    if (dir) e.facing = dir; else if (e.onGround && Math.abs(e.vx) < 1) { e.stuckT = (e.stuckT || 0) + dt; if (e.stuckT > 2) { e.stuckT = 0; e.state = 'cool'; e.stateT = 4; e.fuel = 0.02; } }
    return;
  }
  e.state = 'walk'; e.seekT = 0;
  let dir = 0;
  if (aggro) { dir = Math.abs(dx) > 30 ? Math.sign(dx) : 0; if (Math.abs(dx) > 4) e.facing = Math.sign(dx); }
  else { anWand(e, dt); dir = e.wander; }
  dir = anGround(e, dt, dir, 13 + e.lvl * 0.3, 200);
  if (dir && !aggro) e.facing = dir;
  e.stepK = (e.stepK || 0) + Math.abs(e.vx) * dt;
  if (e.stepK > 7) { e.stepK = 0; if (anNearHero(e)) sfx.anThud(); }
  if (aggro && e.atkCD <= 0 && e.fuel > 0.05 && Math.abs(dx) < 54 && Math.abs(dy) < 26 && e.onGround && losClear(ecx + e.facing * 7, e.y + 13, pl.x + pl.w / 2, pl.y + pl.h / 2)) {
    e.facing = Math.sign(dx) || e.facing; e.state = 'charge'; e.stateT = AN_FORN_CHARGE; e.vx = 0;
    const a = Math.atan2(pl.y + pl.h / 2 - (e.y + 13), pl.x + pl.w / 2 - (ecx + e.facing * 7));
    e.aim = e.facing > 0 ? clamp(a, -0.5, 0.5) : (a > 0 ? clamp(a, Math.PI - 0.5, Math.PI) : clamp(a, -Math.PI, -Math.PI + 0.5));
    sfx.anBellows();
  }
};
const anDoorOpen = e => e.state === 'charge' || e.state === 'breath' || e.state === 'recover';

/* ================= a Runa Viva =================
   Como o tapete do 123: vive numa célula livre, colada num dos quatro lados (cur = { x, y, s }; s: 0 chão, 1 parede à
   direita, 2 teto, 3 parede à esquerda) e desliza de célula em célula pela superfície. */
const AN_SD = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const AN_ANG = [0, -Math.PI / 2, Math.PI, Math.PI / 2];
const anSideOf = (x, y) => y > 0 ? 0 : x > 0 ? 1 : y < 0 ? 2 : 3;
const anPatchPt = c => [(c.x + 0.5 + AN_SD[c.s][0] * 0.3) * T, (c.y + 0.5 + AN_SD[c.s][1] * 0.3) * T];
function anNext(c, mx, my) {
  const [sx, sy] = AN_SD[c.s];
  if (solidAt(c.x + mx, c.y + my)) return { x: c.x, y: c.y, s: anSideOf(mx, my), dur: 0.45, kind: 'in' };
  if (solidAt(c.x + mx + sx, c.y + my + sy)) return { x: c.x + mx, y: c.y + my, s: c.s, dur: 0.62, kind: 'on' };
  return { x: c.x + mx + sx, y: c.y + my + sy, s: anSideOf(-mx, -my), dur: 0.8, kind: 'out', mx, my };
}
function anRunePlace(e) {
  const c = e.cur, n = e.nxt, p = e.prog || 0;
  let [x, y] = anPatchPt(c), a = AN_ANG[c.s], s = c.s;
  if (n) {
    const [x1, y1] = anPatchPt(n), a1 = AN_ANG[n.s];
    let da = a1 - a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    if (n.kind === 'out') {
      const kx = x + n.mx * 0.7 * T, ky = y + n.my * 0.7 * T;
      if (p < 0.5) { x = lerp(x, kx, p * 2); y = lerp(y, ky, p * 2); a += da * Math.max(0, p - 0.3) * 1.25; }
      else { x = lerp(kx, x1, p * 2 - 1); y = lerp(ky, y1, p * 2 - 1); a += da * Math.min(1, (p - 0.3) * 1.25); }
    } else { x = lerp(x, x1, p); y = lerp(y, y1, p); a += da * p; }
    if (p > 0.5) s = n.s;
  }
  const flat = s === 0 || s === 2;
  e.w = flat ? 12 : 6; e.h = flat ? 6 : 12; e.x = x - e.w / 2; e.y = y - e.h / 2; e.ang = a; e.side = s;
}
function anRuneAttach(e, prefer) {
  const tx = Math.floor((e.x + e.w / 2) / T); let ty = Math.floor((e.y + e.h / 2) / T);
  for (let k = 0; k < 4 && solidAt(tx, ty); k++) ty--;
  let fl = ty; while (fl < ty + 8 && !solidAt(tx, fl + 1)) fl++;
  let ce = ty; while (ce > ty - 8 && !solidAt(tx, ce - 1)) ce--;
  const hasF = solidAt(tx, fl + 1) && !solidAt(tx, fl), hasC = solidAt(tx, ce - 1) && !solidAt(tx, ce);
  e.nxt = null; e.prog = 0; e.vx = 0; e.vy = 0;
  if (hasC && (prefer === 'up' || (!hasF && prefer !== 'down'))) e.cur = { x: tx, y: ce, s: 2 };
  else if (hasF) e.cur = { x: tx, y: fl, s: 0 };
  else if (hasC) e.cur = { x: tx, y: ce, s: 2 };
  else { e.state = 'fall'; e.cur = null; return; }
  e.state = 'walk'; anRunePlace(e);
}
// gruda na célula livre (fx, fy), do lado da rocha que ela acabou de bater (hx, hy)
function anRuneStick(e, fx, fy, hx, hy) {
  const ddx = Math.sign(hx - fx), ddy = Math.sign(hy - fy);
  let s = -1;
  if (ddy > 0 && solidAt(fx, fy + 1)) s = 0; else if (ddy < 0 && solidAt(fx, fy - 1)) s = 2;
  else if (ddx > 0 && solidAt(fx + 1, fy)) s = 1; else if (ddx < 0 && solidAt(fx - 1, fy)) s = 3;
  else for (let k = 0; k < 4; k++) if (solidAt(fx + AN_SD[k][0], fy + AN_SD[k][1])) { s = k; break; }
  if (s < 0) { e.state = 'fall'; e.cur = null; e.fvy = 0; return; }
  e.cur = { x: fx, y: fy, s }; e.nxt = null; e.prog = 0; e.state = 'rest'; e.stateT = 0.7; e.atkCD = 1.4 + Math.random() * 0.6;
  anRunePlace(e);
  anSpark(e.x + e.w / 2, e.y + e.h / 2, 6, 60); sfx.anStick();
}
AI.runaviva = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.seenT = (e.seenT || 0) - dt; e.vx = 0; e.vy = 0;
  if (e.state === 'fall') {
    e.fvy = Math.min((e.fvy || 0) + GRAV * dt, MAXFALL);
    const ny = e.y + e.fvy * dt;
    if (rectSolid(e.x, ny, e.w, e.h)) { e.y = Math.floor((ny + e.h) / T) * T - e.h; e.fvy = 0; anRuneAttach(e, 'down'); }
    else e.y = ny;
    return;
  }
  if (e.state === 'leap') {   // o disco: reto, girando, até bater em rocha (ou no herói, e segue)
    e.ang += dt * 24 * (e.discDir || 1);
    const n = Math.max(1, Math.ceil(AN_DISC_SP * dt / 3)), sx = e.dvx * dt / n, sy = e.dvy * dt / n;
    for (let i = 0; i < n; i++) {
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2, nx = cx + sx, ny = cy + sy;
      const fx = Math.floor(cx / T), fy = Math.floor(cy / T), hx = Math.floor(nx / T), hy = Math.floor(ny / T);
      if (solidAt(hx, hy)) { anRuneStick(e, fx, fy, hx, hy); return; }
      e.x += sx; e.y += sy;
      if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, e.x + e.w / 2 - sx * 4, e, false); anSpark(e.x + e.w / 2, e.y + e.h / 2, 4); }
    }
    if (e.stateT <= 0) { e.state = 'fall'; e.cur = null; e.fvy = 0; }
    return;
  }
  const c = e.cur;
  if (!c || solidAt(c.x, c.y) || !solidAt(c.x + AN_SD[c.s][0], c.y + AN_SD[c.s][1])) { e.state = 'fall'; e.cur = null; e.nxt = null; e.w = 12; e.h = 6; e.fvy = 0; return; }
  if (e.nxt && solidAt(e.nxt.x, e.nxt.y)) { e.nxt = null; e.prog = 0; }
  if (e.state === 'peel') {   // as bordas descolam e o zumbido sobe
    anRunePlace(e);
    if (Math.random() < dt * 10) anSpark(e.x + e.w / 2 + rnd(-5, 5), e.y + e.h / 2, 1, 30);
    if (e.stateT > 0.12) { const cx = e.x + e.w / 2, cy = e.y + e.h / 2; e.aimA = Math.atan2(pl.y + pl.h / 2 - cy, pl.x + pl.w / 2 - cx); }
    if (e.stateT <= 0) {
      e.state = 'leap'; e.stateT = 2.4; e.swingHit = false; e.dvx = Math.cos(e.aimA) * AN_DISC_SP; e.dvy = Math.sin(e.aimA) * AN_DISC_SP; e.discDir = Math.cos(e.aimA) >= 0 ? 1 : -1;
      // desgruda: o disco sai do centro da célula, um pouco para longe da rocha
      const [px, py] = anPatchPt(e.cur), [sx, sy] = AN_SD[e.cur.s];
      e.w = 8; e.h = 8; e.x = px - sx * 3 - 4; e.y = py - sy * 3 - 4; e.cur = null; e.seenT = 3;
      sfx.anWhirr();
    }
    return;
  }
  if (e.state === 'rest') { anRunePlace(e); if (e.stateT <= 0) e.state = 'walk'; return; }
  // deslizando
  e.state = 'walk';
  if (e.nxt) { e.prog += dt / e.nxt.dur; if (e.prog >= 1) { e.cur = e.nxt; e.nxt = null; e.prog = 0; } }
  if (!e.nxt) {
    const [sx, sy] = AN_SD[e.cur.s], opts = sx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
    let m = null;
    if (aggro && dist < 170) {   // o lado que a deixa mais perto do herói, mas sem subir em cima dele
      const gx = pl.x + pl.w / 2, gy = pl.y + pl.h / 2; let bd = 1e9;
      const [cx0, cy0] = anPatchPt(e.cur), here = Math.hypot(cx0 - gx, cy0 - gy);
      for (const o of opts) { const n = anNext(e.cur, o[0], o[1]); if (solidAt(n.x, n.y)) continue; const [x, y] = anPatchPt(n), d = Math.abs(Math.hypot(x - gx, y - gy) - 50) - (e.mv && e.mv[0] === o[0] && e.mv[1] === o[1] ? 4 : 0); if (d < bd) { bd = d; m = o; } }
      if (Math.abs(here - 50) < 8) m = null;
    } else {
      e.wtimer -= dt;
      if (!e.mv || e.wtimer <= 0) { e.mv = opts[Math.random() < 0.5 ? 0 : 1]; e.wtimer = 3 + Math.random() * 4; }
      m = opts.find(o => o[0] === e.mv[0] && o[1] === e.mv[1]) || opts[0];
    }
    if (m) { const n = anNext(e.cur, m[0], m[1]); if (!solidAt(n.x, n.y)) { e.nxt = n; e.prog = 0; e.mv = m; if (m[0]) e.facing = m[0]; } else e.mv = [-m[0], -m[1]]; }
  }
  anRunePlace(e);
  if (aggro && e.atkCD <= 0 && dist < 110) {
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (losClear(cx, cy, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.nxt = null; e.prog = 0; anRunePlace(e); e.state = 'peel'; e.stateT = AN_PEEL; e.seenT = 3; sfx.anHum(); }
  }
};

/* ================= a Coruja de Corda ================= */
const anNails = [];
function anOwlGround(e) {   // o chão logo abaixo dela (até 10 blocos): { x, y } em pixels do topo do chão, ou null
  const tx = Math.floor((e.x + e.w / 2) / T); let ty = Math.floor((e.y + e.h) / T);
  for (let k = 0; k < 10; k++, ty++) if (solidAt(tx, ty) && !solidAt(tx, ty - 1)) return { x: (tx + 0.5) * T, y: ty * T };
  return null;
}
AI.coruja = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  const drag = k => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  if (e.state === 'blink') {   // parada no ar, os olhos piscam 3 vezes
    drag(0.02); e.facing = Math.sign(dx) || e.facing;
    const k = Math.floor((1 - e.stateT / AN_OWL_BLINK) * 6); if (k !== e.blinkK) { e.blinkK = k; if (k % 2) sfx.anBlink(); }
    if (e.stateT <= 0) { e.state = 'shoot'; e.stateT = 0.36; e.nailN = 0; }
    return;
  }
  if (e.state === 'shoot') {   // a rajada: 3 pregos de latão
    drag(0.02);
    const want = Math.floor((0.36 - e.stateT) / 0.12) + 1;
    while (e.nailN < Math.min(3, want)) {
      e.nailN++;
      const ox = ecx + e.facing * 4, oy = ecy - 1, a = Math.atan2(pcy - oy, pcx - ox) + (e.nailN - 2) * 0.06;
      anNails.push({ x: ox, y: oy, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, a, t: 0, dmg: e.dmg, stuck: false });
      sfx.anNail();
    }
    if (e.stateT <= 0) { e.state = 'circle'; e.atkCD = 2.4 + Math.random(); }
    return;
  }
  if (e.state === 'land') {   // desce até o chão de baixo
    const G = e.landAt;
    if (!G) { e.state = 'circle'; e.laps = 0; return; }
    const tx = G.x, ty = G.y - e.h / 2; const ux = tx - ecx, uy = ty - ecy, d = Math.hypot(ux, uy) || 1;
    e.vx = lerp(e.vx, ux / d * 70, Math.min(1, dt * 4)); e.vy = lerp(e.vy, uy / d * 70, Math.min(1, dt * 4));
    if (e.onGround || d < 3 || e.stateT <= 0) {
      if (!e.onGround) { const g = anOwlGround(e); if (g) e.y = g.y - e.h; }
      e.state = 'wind'; e.stateT = AN_OWL_WIND; e.vx = 0; e.vy = 0; e.windK = 0; sfx.anWind();
    }
    return;
  }
  if (e.state === 'wind') {   // pousada, dando corda: a chave gira nas costas, 2 s parada
    e.vx = 0; e.vy = 0; e.windK = (e.windK || 0) + dt;
    if (e.stateT <= 0) { e.state = 'takeoff'; e.stateT = 0.45; e.laps = 0; e.atkCD = Math.max(e.atkCD, 0.6); }
    return;
  }
  if (e.state === 'takeoff') { e.vy = approach(e.vy, -80, 400 * dt); e.vx = approach(e.vx, 0, 100 * dt); if (e.stateT <= 0) e.state = 'circle'; return; }
  // os círculos largos em volta do herói (uma elipse achatada acima dele)
  e.state = 'circle';
  if (!e.cdir) e.cdir = Math.random() < 0.5 ? 1 : -1;
  let tx, ty;
  if (aggro) {
    if (e.ang === undefined) e.ang = Math.atan2(ecy - pcy, ecx - pcx);
    const w = 1.4 * e.cdir; e.ang += w * dt; e.laps = (e.laps || 0) + Math.abs(w) * dt / (Math.PI * 2);
    tx = pcx + Math.cos(e.ang) * AN_OWL_R; ty = pcy - 26 + Math.sin(e.ang) * AN_OWL_R * 0.5;
  } else {
    if (e.homeX === undefined) { e.homeX = ecx; e.homeY = ecy; }
    tx = e.homeX + Math.cos(e.t * 0.5 + e.seed) * 40; ty = e.homeY + Math.sin(e.t * 0.9 + e.seed) * 14;
  }
  const ux = tx - ecx, uy = ty - ecy, d = Math.hypot(ux, uy) || 1, sp = Math.min(aggro ? 95 : 40, d * 3), k = Math.min(1, dt * 3);
  e.vx = lerp(e.vx, ux / d * sp, k); e.vy = lerp(e.vy, uy / d * sp + Math.sin(e.t * 7) * 6, k);
  if (e.hitWall) { e.cdir = -e.cdir; e.vx = -e.vx * 0.5; }
  if (e.hitCeil) e.vy = Math.abs(e.vy) * 0.5 + 10;
  if (e.onGround) e.vy = -Math.abs(e.vy) * 0.5 - 20;
  e.facing = Math.abs(e.vx) > 6 ? Math.sign(e.vx) : Math.sign(dx) || e.facing;
  e.flapT = (e.flapT || 0) - dt; if (aggro && e.flapT <= 0 && anNearHero(e, 140)) { e.flapT = 0.75; sfx.anFlap(); }
  if (aggro && e.laps >= 3) { const g = anOwlGround(e); if (g) { e.state = 'land'; e.stateT = 2.5; e.landAt = g; return; } e.laps = 2.5; }
  if (aggro && e.atkCD <= 0 && dist < 150 && losClear(ecx, ecy, pcx, pcy)) { e.state = 'blink'; e.stateT = AN_OWL_BLINK; e.blinkK = -1; e.facing = Math.sign(dx) || e.facing; }
};
const anOwlShut = e => e.state === 'blink' && (Math.floor((1 - e.stateT / AN_OWL_BLINK) * 6) % 2 === 1);
function anNailTick(dt) {
  for (let i = anNails.length - 1; i >= 0; i--) {
    const b = anNails[i]; b.t += dt;
    if (b.stuck) { if (b.t > 1.2) anNails.splice(i, 1); continue; }
    const n = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 4)), sx = b.vx * dt / n, sy = b.vy * dt / n;
    let gone = false;
    for (let k = 0; k < n; k++) {
      b.x += sx; b.y += sy;
      if (!pl.dead && b.x > pl.x - 1 && b.x < pl.x + pl.w + 1 && b.y > pl.y && b.y < pl.y + pl.h) { hurtPlayer(b.dmg, b.x - sx * 4, null, true); burst(b.x, b.y, 4, '#d4b048', 50, 300, 0.3); gone = true; break; }
      if (solidAt(Math.floor(b.x / T), Math.floor(b.y / T))) { b.stuck = true; b.t = 0; b.x -= sx; b.y -= sy; burst(b.x, b.y, 3, '#a8862a', 40, 300, 0.3); if (anNearHero(b, 140)) sfx.anTink(); break; }
    }
    if (gone || b.t > 2) anNails.splice(i, 1);
  }
}

/* ================= a Bomba de Lava ================= */
const anBlobs = [], anPocas = [], anPedras = [];
AI.bombalava = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.lavaT = 9;
  const ecx = e.x + e.w / 2, tx = Math.floor(ecx / T);
  // a lava de casa: a mais perto, procurada de tempo em tempo
  e.lavaScanT = (e.lavaScanT || 0) - dt;
  if (e.lavaScanT <= 0) { e.lavaScanT = 2; const L = anFindLava(tx, Math.floor((e.y + e.h - 1) / T), AN_LAVA_R, 6); if (L) e.lavaX = L.x; }
  if (e.state === 'charge') {   // o tanque fica laranja e o bico treme
    e.vx = approach(e.vx, 0, 500 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 8) anEmber(ecx + e.facing * 10, e.y + 3, rnd(-10, 10), rnd(-30, -10), 0.4);
    if (e.stateT <= 0) { anSpit(e); e.state = 'recover'; e.stateT = 0.6; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2.4 + Math.random() * 1.2; } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const adx = Math.abs(dx); dir = adx < 50 ? -Math.sign(dx) : adx > 110 ? Math.sign(dx) : 0; }
  else { anWand(e, dt); dir = e.wander; }
  // nunca mais de 10 blocos longe da lava
  if (dir && e.lavaX !== undefined) { const nx = Math.floor((ecx + dir * (e.w / 2 + 4)) / T); if (Math.abs(wdx(nx - e.lavaX)) > AN_LAVA_R) { dir = 0; if (!aggro) e.wander = -e.wander; } }
  dir = anGround(e, dt, dir, 22 + e.lvl * 0.4, 260);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (aggro && e.atkCD <= 0 && dist < 170 && dist > 24 && Math.abs(dy) < 90 && e.onGround && losClear(ecx + e.facing * 10, e.y + 3, pl.x + pl.w / 2, pl.y + 4)) {
    e.state = 'charge'; e.stateT = AN_BOMB_CHARGE; e.vx = 0; sfx.anGurgle();
  }
};
const AN_BLOB_G = 420;
function anSpit(e) {
  const ox = e.x + e.w / 2 + e.facing * 11, oy = e.y + 2, gx = pl.x + pl.w / 2 + pl.vx * 0.25, gy = pl.y + pl.h - 3;
  const ddx = gx - ox, ddy = gy - oy, tt = clamp(Math.abs(ddx) / 130, 0.55, 1.15);
  anBlobs.push({ x: ox, y: oy, vx: ddx / tt, vy: (ddy - 0.5 * AN_BLOB_G * tt * tt) / tt, t: 0, dmg: e.dmg, dps: Math.max(1, Math.round(e.dmg * 0.25)) });
  for (let k = 0; k < 6; k++) anEmber(ox, oy, e.facing * rnd(10, 40), rnd(-50, -10), 0.35);
  sfx.anSpit();
}
const anCellIdx = (x, y) => y * WW + wrapX(x);
// a bolha cai: vira poça no chão de baixo da última célula livre
function anBlobLand(b, fx, fy) {
  let y = fy;
  for (let k = 0; k < 8 && !solidAt(fx, y + 1) && tileAt(fx, y + 1) !== LAVA; k++) y++;
  if (tileAt(fx, y) === LAVA || tileAt(fx, y + 1) === LAVA || !solidAt(fx, y + 1) || solidAt(fx, y)) { burst(b.x, b.y, 8, '#ff8a2a', 60, 200, 0.4, 1, true); sfx.anSizzle(); return; }
  const i = anCellIdx(fx, y);
  if (anPocas.some(p => p.i === i)) return;
  anPocas.push({ x: wrapX(fx), y, i, t: AN_POCA, dps: b.dps, wait: 0 });
  burst((fx + 0.5) * T, (y + 1) * T - 2, 10, '#ffa62a', 70, 300, 0.4, 1, true); sfx.anSizzle();
}
function anBlobTick(dt) {
  for (let i = anBlobs.length - 1; i >= 0; i--) {
    const b = anBlobs[i]; b.t += dt; b.vy = Math.min(b.vy + AN_BLOB_G * dt, 400);
    const n = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 3)), sx = b.vx * dt / n, sy = b.vy * dt / n;
    let gone = false;
    for (let k = 0; k < n; k++) {
      const fx = Math.floor(b.x / T), fy = Math.floor(b.y / T);
      b.x += sx; b.y += sy;
      if (!pl.dead && b.x > pl.x - 2 && b.x < pl.x + pl.w + 2 && b.y > pl.y - 2 && b.y < pl.y + pl.h + 2) {
        const o = typeof dmgCtx !== 'undefined' ? dmgCtx : null; if (typeof dmgCtx !== 'undefined') dmgCtx = 'fogo';
        let r; try { r = hurtPlayer(b.dmg, b.x - sx * 4, null, true); } finally { if (typeof dmgCtx !== 'undefined') dmgCtx = o; }
        if (r === 'hit') anQueimar(2, b.dps);
        burst(b.x, b.y, 10, '#ffa62a', 70, 200, 0.4, 1, true); sfx.anSizzle(); gone = true; break;
      }
      const hx = Math.floor(b.x / T), hy = Math.floor(b.y / T);
      if (tileAt(hx, hy) === LAVA) { burst(b.x, b.y, 6, '#ff8a2a', 50, 200, 0.3, 1, true); gone = true; break; }
      if (solidAt(hx, hy)) { anBlobLand(b, fx, fy); gone = true; break; }
    }
    if (Math.random() < dt * 30) anEmber(b.x, b.y, rnd(-10, 10), rnd(-10, 10), 0.3);
    if (gone || b.t > 4) anBlobs.splice(i, 1);
  }
  // a poça: queima 2 s; depois esfria num bloco de pedra quente (se ninguém estiver em cima da célula)
  for (let i = anPocas.length - 1; i >= 0; i--) {
    const p = anPocas[i];
    const box = { x: p.x * T, y: p.y * T + 4, w: T, h: T - 4 };
    if (p.t > 0) {
      p.t -= dt;
      if (!pl.dead && overlap(box, pl)) anQueimar(1, p.dps);
      if (Math.random() < dt * 6) anEmber((p.x + Math.random()) * T, (p.y + 1) * T - 2, rnd(-4, 4), rnd(-24, -10), 0.6);
      continue;
    }
    const cell = { x: p.x * T, y: p.y * T, w: T, h: T };
    const busy = overlap(cell, pl) || enemies.some(e => !e.dead && !ET[e.type].phase && overlap(cell, e));
    if (busy && (p.wait += dt) < 3) continue;
    anPocas.splice(i, 1);
    if (busy || tiles[p.i] !== AIR) continue;
    anPedraPut(p.x, p.y);
  }
  // as pedras somem em 20 s
  for (let i = anPedras.length - 1; i >= 0; i--) {
    const s = anPedras[i]; s.t -= dt;
    if (s.t > 0) continue;
    anPedras.splice(i, 1); anPedraGone(s, true);
  }
}
function anPedraPut(x, y) {
  const i = anCellIdx(x, y);
  tiles[i] = AN_PEDRA_QUENTE; markDirty(wrapX(x), y); mapVer++;   // direto nos tiles: nunca nos diffs, nunca no save
  anPedras.push({ x: wrapX(x), y, i, t: AN_PEDRA_T });
  while (anPedras.length > 48) anPedraGone(anPedras.shift(), false);
  burst((x + 0.5) * T, (y + 0.5) * T, 8, '#4a3a30', 40, 100, 0.8); sfx.anSizzle(0.5);
}
function anPedraGone(s, loud) {
  if (tiles[s.i] !== AN_PEDRA_QUENTE) return;
  tiles[s.i] = AIR; markDirty(s.x, s.y); mapVer++;
  if (diffs.get(s.i) === AN_PEDRA_QUENTE) diffs.delete(s.i);
  if (loud) { burst((s.x + 0.5) * T, (s.y + 0.5) * T, 10, '#3a3430', 50, 300, 0.6); if (Math.abs(s.x * T - pl.x) < 200) sfx.anCrumble(); }
}
// a pedra quente nunca vai para o save
{ const _ms = makeSave; makeSave = function () {
  const v = _ms.apply(this, arguments);
  if (v && Array.isArray(v.diffs)) v.diffs = v.diffs.filter(([i, t]) => t !== AN_PEDRA_QUENTE && !(t === AIR && anPedras.some(s => s.i === i)));
  return v;
}; }

/* ================= desenho ================= */
DRAW_E.soldbronze = (e, fx, fy, fl) => {
  const S = ANA.get(), D = S.sold, st = e.state;
  let img = D.stand, j = 0;
  if (st === 'waking') { const k = 1 - e.stateT / AN_WAKE; img = k < 0.45 ? D.w0 : k < 0.85 ? D.w1 : D.stand; j = k < 0.85 && Math.floor(e.t * 20) % 3 === 0 ? 1 : 0; }
  else if (st === 'wind') { img = D.wind; j = Math.round(Math.sin(e.t * 40) * 0.5); }
  else if (st === 'thrust' || (st === 'recover' && (e.reach || 0) > 4)) img = D.thrust;
  else if (st === 'turn') { img = D.stand; j = Math.floor(e.t * 16) % 2; }
  else if ((e.moveT || 0) > 0) img = Math.floor((e.stepN || 0)) % 2 ? D.s0 : D.s1;
  // a lança por trás do corpo: sai pela borda do escudo
  if (st !== 'waking') {
    const L = cvPick(S.lanca, e, fl), r = Math.round(e.reach || 0);
    lc.drawImage(L, e.facing > 0 ? fx - 10 + r + j : fx + 10 - L.width - r + j, fy - 15);
  }
  lc.drawImage(cvPick(img, e, fl), fx - 11 + j, fy - 27);
};
EYES_E.soldbronze = (e, fx, fy) => {
  const G = ANA.GL, wake = e.state === 'waking' ? clamp(1 - e.stateT / AN_WAKE, 0, 1) : 1;
  if (e.state === 'wind' || e.state === 'thrust') { lc.globalAlpha = 0.6 + 0.3 * Math.sin(e.t * 30); lc.drawImage(G.rv, fx + e.facing * 1 - 8, fy - 15 - 8); }
  else { lc.globalAlpha = 0.25 * wake; lc.drawImage(G.ruS, fx + e.facing * 1 - 4, fy - 15 - 4); }
  lc.globalAlpha = 0.4 * wake; lc.drawImage(G.ruS, fx + e.facing * 2 - 4, fy - 22 - 4);
};
WARN_E.soldbronze = e => e.state === 'wind';

DRAW_E.engrenagens = (e, fx, fy, fl) => {
  const S = ANA.get();
  if (e.state === 'saw') { cvRot(fl ? S.saw.wr : S.saw.r, fx, fy - 7, e.rot || 0); return; }
  const j = e.state === 'lock' ? Math.round(Math.sin(e.t * 50) * 0.6) : 0;
  cvRot(fl ? S.cog.wr : S.cog.r, fx + j, fy - 3.5, e.rot || 0);
};
EYES_E.engrenagens = (e, fx, fy) => {
  if (e.state === 'saw') { lc.globalAlpha = 0.5; lc.drawImage(ANA.GL.ru, fx - 7, fy - 7 - 7); }
  else if (e.state === 'lock') { lc.globalAlpha = 0.6; lc.drawImage(ANA.GL.spark, fx - 5, fy - 4 - 5); }
  else { lc.globalAlpha = 0.25; lc.drawImage(ANA.GL.ruS, fx - 4, fy - 4 - 4); }
};
WARN_E.engrenagens = e => e.state === 'lock';

DRAW_E.fornalhaamb = (e, fx, fy, fl) => {
  const S = ANA.get(), st = e.state;
  const fole = st === 'charge' ? (e.stateT > 0.5 ? 1 : 2) : st === 'breath' ? 0 : st === 'refuel' ? 1 + (Math.floor(e.t * 3) % 2) : 0;
  const door = st === 'charge' ? 1 : st === 'breath' || st === 'recover' ? 2 : 0;
  const step = e.onGround && Math.abs(e.vx) > 2 ? Math.floor(e.t * 3) % 2 : 0, bob = step ? 1 : 0;
  const j = st === 'charge' ? Math.round(Math.sin(e.t * 36) * 0.5) : 0, x = fx - 15 + j, y = fy - 30 + bob;
  lc.drawImage(cvPick(S.fole[fole], e, fl), x, y);
  lc.drawImage(cvPick(S.forno[step], e, fl), x, y - bob);
  lc.drawImage(cvPick(S.porta[door], e, fl), x, y);
  // o ponteiro do combustível no mostrador do flanco
  if (!fl) {
    const a = Math.PI * (0.85 - (e.fuel ?? 1) * 1.7), cx = fx + (e.facing > 0 ? -3 : 3) + j, cy = fy - 30 + 18.5;
    lc.fillStyle = (e.fuel ?? 1) < 0.15 ? '#ff5a2a' : '#e8c27a'; lc.fillRect(Math.round(cx + Math.cos(a) * e.facing), Math.round(cy - Math.sin(a)), 1, 1);
  }
};
EYES_E.fornalhaamb = (e, fx, fy) => {
  const G = ANA.GL, st = e.state, open = st === 'breath' || st === 'recover', hot = st === 'charge';
  const k = open ? 0.9 : hot ? 0.35 + 0.5 * clamp(1 - e.stateT / AN_FORN_CHARGE, 0, 1) : 0.15 + 0.15 * (e.fuel ?? 1);
  lc.globalAlpha = k; lc.drawImage(open ? G.lvB : G.lv, fx + e.facing * 4 - (open ? 18 : 12), fy - 13 - (open ? 18 : 12));
  lc.globalAlpha = 0.4; lc.drawImage(G.ruS, fx + e.facing * 7 - 4, fy - 24 - 4);
};
WARN_E.fornalhaamb = e => e.state === 'charge';

DRAW_E.runaviva = (e, fx, fy, fl) => {
  const S = ANA.get().runa, st = e.state;
  const k = st === 'peel' ? (e.stateT > AN_PEEL / 2 ? 1 : 2) : st === 'leap' ? 2 : 0;
  const a = e.ang || 0, cx = fx, cy = fy - e.h / 2;
  const j = st === 'peel' ? Math.round(Math.sin(e.t * 60) * 0.5) : 0;
  const hid = (st === 'walk' || st === 'rest') && e.seenT <= 0 && !fl, a0 = lc.globalAlpha;
  if (hid) lc.globalAlpha = a0 * 0.55;
  if (st === 'leap' || st === 'fall') cvRot(fl ? S[k].wr : S[k].r, cx, cy, a);
  else cvRot(fl ? S[k].wr : S[k].r, Math.round(cx - Math.sin(a) * 1) + j, Math.round(cy + Math.cos(a) * 1), a);
  lc.globalAlpha = a0;
};
EYES_E.runaviva = (e, fx, fy) => {
  const st = e.state, k = st === 'peel' ? 0.4 + 0.5 * clamp(1 - e.stateT / AN_PEEL, 0, 1) : st === 'leap' ? 0.7 : 0.12 + 0.06 * Math.sin(e.t * 2 + e.seed);
  lc.globalAlpha = k; lc.drawImage(ANA.GL.ru, fx - 7, fy - e.h / 2 - 7);
};
WARN_E.runaviva = e => e.state === 'peel';

DRAW_E.coruja = (e, fx, fy, fl) => {
  const S = ANA.get(), st = e.state, perched = st === 'wind' || (st === 'land' && e.onGround);
  let k;
  if (perched) k = 3;
  else if (st === 'blink' || st === 'shoot') k = anOwlShut(e) ? 5 : [0, 1, 2, 1][Math.floor(e.t * 16) % 4];
  else k = [0, 1, 2, 1][Math.floor(e.t * (st === 'land' ? 6 : 10)) % 4];
  const bob = perched ? 0 : Math.round(Math.sin(e.t * 5 + e.seed) * 1), x = fx - 8, y = fy - 13 + bob;
  if (perched) {   // a chave gira nas costas
    const K = S.chave[Math.floor((e.windK || 0) * 8) % 4];
    lc.drawImage(cvPick(K, e, fl), e.facing > 0 ? fx - 10 : fx + 10 - 8, y + 3);
  }
  lc.drawImage(cvPick(S.owl[k], e, fl), x, y);
};
EYES_E.coruja = (e, fx, fy) => {
  if (anOwlShut(e)) return;
  const perched = e.state === 'wind', bob = perched ? 0 : Math.round(Math.sin(e.t * 5 + e.seed) * 1);
  lc.globalAlpha = e.state === 'blink' || e.state === 'shoot' ? 0.85 : perched ? 0.2 : 0.4;
  lc.drawImage(ANA.GL.ruS, fx + e.facing * 3.5 - 4, fy - 13 + bob + 4 - 3);
};
WARN_E.coruja = e => e.state === 'blink';

DRAW_E.bombalava = (e, fx, fy, fl) => {
  const S = ANA.get().bomba, st = e.state;
  const k = st === 'charge' ? 2 : e.onGround && Math.abs(e.vx) > 3 ? Math.floor(e.t * 5) % 2 : 0;
  const j = st === 'charge' ? Math.round(Math.sin(e.t * 55) * 0.7) : 0;
  lc.drawImage(cvPick(S[k], e, fl), fx - 12 + j, fy - 22);
};
EYES_E.bombalava = (e, fx, fy) => {
  const G = ANA.GL, hot = e.state === 'charge' ? 0.4 + 0.5 * clamp(1 - e.stateT / AN_BOMB_CHARGE, 0, 1) : 0.15;
  lc.globalAlpha = hot; lc.drawImage(G.lv, fx - e.facing * 8 - 12, fy - 11 - 12);
  if (e.state === 'charge') { lc.globalAlpha = hot * 0.8; lc.drawImage(G.lvS, fx + e.facing * 10 - 6, fy - 19 - 6); }
  lc.globalAlpha = 0.35; lc.drawImage(G.ruS, fx + e.facing * 3 - 4, fy - 16 - 4);
};
WARN_E.bombalava = e => e.state === 'charge';

// no mundo: as bolhas de lava, as poças, os pregos
HOOK.drawWorld.push((cx, cy) => {
  for (const p of anPocas) {
    const x = p.x * T - cx, y = (p.y + 1) * T - cy; if (x < -T || x > VW + T || y < -T || y > VH + T) continue;
    const k = clamp(p.t / AN_POCA, 0, 1);
    for (let i = 0; i < T; i++) {
      const h = 2 + ((i * 7 + p.x) % 3 === 0 ? 1 : 0) - (i === 0 || i === T - 1 ? 1 : 0);
      for (let r = 0; r < h; r++) {
        const v = k > 0 ? 2 + k * 3 - r * 0.8 + (((i + Math.floor(gameTime * 6)) % 5 === 0) ? 1 : 0) : 0.6 + r * 0.2;
        lc.fillStyle = PALH_AN_LAVA[clamp(Math.round(v), 0, 5)]; lc.fillRect(x + i, y - 1 - r, 1, 1);
      }
    }
  }
  for (const b of anBlobs) {
    const x = Math.round(b.x) - cx, y = Math.round(b.y) - cy; if (x < -8 || x > VW + 8 || y < -8 || y > VH + 8) continue;
    lc.fillStyle = '#7a1e06'; lc.fillRect(x - 2, y - 1, 5, 3); lc.fillRect(x - 1, y - 2, 3, 5);
    lc.fillStyle = '#e8700e'; lc.fillRect(x - 1, y - 1, 3, 3);
    lc.fillStyle = '#ffe08a'; lc.fillRect(x - 1, y - 1, 1, 1);
  }
  for (const b of anNails) {
    const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.stuck ? Math.cos(b.a) : b.vx / sp, uy = b.stuck ? Math.sin(b.a) : b.vy / sp, ax = b.x - cx, ay = b.y - cy;
    if (ax < -10 || ax > VW + 10 || ay < -10 || ay > VH + 10) continue;
    lc.globalAlpha = b.stuck ? Math.min(1, (1.2 - b.t) * 3) : 1;
    for (let k = 0; k < 5; k++) { lc.fillStyle = k === 0 ? '#f2dc8a' : k === 4 ? '#7a5e1a' : '#a8862a'; lc.fillRect(Math.round(ax - ux * k), Math.round(ay - uy * k), 1, 1); }
    lc.fillStyle = '#d4b048'; lc.fillRect(Math.round(ax - ux * 4 - uy), Math.round(ay - uy * 4 + ux), 1, 1);   // a cabeça do prego
    lc.globalAlpha = 1;
  }
});
const PALH_AN_LAVA = ['#3a0c04', '#7a1e06', '#b8400a', '#e8700e', '#ffa62a', '#ffe08a'];
HOOK.drawGlow.push((cx, cy) => {
  const G = ANA.GL;
  for (const b of anBlobs) { lc.globalAlpha = 0.55; lc.drawImage(G.lv, Math.round(b.x) - cx - 12, Math.round(b.y) - cy - 12); }
  for (const p of anPocas) if (p.t > 0) { lc.globalAlpha = 0.25 + 0.3 * clamp(p.t / AN_POCA, 0, 1); lc.drawImage(G.lv, (p.x + 0.5) * T - cx - 12, (p.y + 1) * T - cy - 14); }
  for (const s of anPedras) if (s.t > AN_PEDRA_T - 6) { lc.globalAlpha = 0.18 * (s.t - (AN_PEDRA_T - 6)) / 6; lc.drawImage(G.lvS, (s.x + 0.5) * T - cx - 6, (s.y + 0.5) * T - cy - 6); }
  lc.globalAlpha = 1;
});
// a luz: a boca da fornalha, o tanque da bomba, as poças
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'fornalhaamb') addL(e.x + e.w / 2 + e.facing * 4, e.y + 13, anDoorOpen(e) ? 0.62 : 0.3 + 0.12 * (e.fuel ?? 1));
    else if (e.type === 'bombalava') addL(e.x + e.w / 2, e.y + 6, e.state === 'charge' ? 0.5 : 0.28);
  }
  for (const b of anBlobs) addL(b.x, b.y, 0.55);
  for (const p of anPocas) if (p.t > 0) addL((p.x + 0.5) * T, (p.y + 0.6) * T, 0.5);
}; }

/* ================= golpes, mortes, nascimento ================= */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead && AN_IS_AUTO(e.type)) {
    if (e.type === 'fornalhaamb' && anDoorOpen(e)) mult *= 2;   // a porta aberta: o dobro
    if (e.type === 'coruja' && e.state === 'wind') mult *= 1.5;   // dando corda, sem guarda
  }
  const st = e && e.state, hp0 = e ? e.hp : 0, vx0 = e ? e.vx : 0, r = _hit(e, dir, mult, melee);
  if (e && AN_IS_AUTO(e.type)) {
    if (e.hp < hp0) { anSpark(e.x + e.w / 2, e.y + e.h / 2, 5, 70); anOil(e.x + e.w / 2, e.y + e.h / 2, 2); if (anNearHero(e)) sfx.anClank(); }
    if (!e.dead) {
      if (e.type === 'runaviva') { e.vx = 0; e.vy = 0; e.seenT = 3; if (st === 'leap') e.stun = 0; }
      else if (e.type === 'engrenagens' && (st === 'saw' || st === 'lock' || st === 'join')) { e.stun = 0; e.vx = st === 'saw' ? vx0 : 0; e.vy = 0; }
      else if (e.type === 'fornalhaamb' && (st === 'charge' || st === 'breath' || st === 'refuel')) { e.stun = 0; e.vx = 0; }
      else if (e.type === 'soldbronze' && (st === 'wind' || st === 'thrust' || st === 'waking')) { e.stun = 0; e.vx = 0; }
      else if (e.type === 'coruja' && st === 'wind') { e.vx = 0; e.vy = 0; }
    }
  }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (AN_IS_AUTO(e.type)) {
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    anSpark(cx, cy, 18, 120); anOil(cx, cy, 10);
    burst(cx, cy, 8, '#9a6a2c', 90, 420, 0.7); burst(cx, cy, 5, '#345a4a', 80, 420, 0.7);   // lascas de bronze e pátina
    if (e.type === 'fornalhaamb') for (let i = 0; i < 14; i++) anEmber(cx, cy, rnd(-60, 60), rnd(-90, -20), 0.6);
    if (e.type === 'runaviva') burst(cx, cy, 8, '#5a646e', 60, 380, 0.6);
    sfx.anClatter();
  }
  return r;
}; }
// o enxame: a primeira rodinha traz as outras 4 no quadro seguinte (se o 185 não a tiver anulado)
const anPackQ = [];
let anPacking = false;   // as rodinhas que vêm junto não puxam outro enxame
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !AN_IS_AUTO(type)) return e;
  if (type === 'soldbronze') { e.state = 'walk'; e.stepT = Math.random() * 0.5; e.reach = 0; }
  else if (type === 'engrenagens') { e.state = 'roll'; e.rot = Math.random() * 6; e.atkCD = 1.5; if (!anPacking && !e.anFollower && !e.anNoPack) anPackQ.push(e); }
  else if (type === 'fornalhaamb') { e.state = 'walk'; e.fuel = 0.7 + Math.random() * 0.3; }
  else if (type === 'runaviva') { e.seenT = 0; anRuneAttach(e, Math.random() < 0.3 ? 'up' : 'down'); }
  else if (type === 'coruja') { e.state = 'circle'; e.laps = Math.random(); e.cdir = Math.random() < 0.5 ? 1 : -1; }
  else if (type === 'bombalava') { e.state = 'walk'; const L = anFindLava(Math.floor((px + e.w / 2) / T), Math.floor((py + e.h - 1) / T), AN_LAVA_R, 6); if (L) e.lavaX = L.x; }
  return e;
}; }
function anPackTick() {
  while (anPackQ.length) {
    const L = anPackQ.shift();
    if (L.dead || !enemies.includes(L)) continue;
    const zone = zoneAt(Math.floor((L.x + L.w / 2) / T), Math.floor((L.y + L.h / 2) / T));
    anPacking = true;
    try { for (let i = 1; i <= 4; i++) {
      let x = L.x + (i % 2 ? -1 : 1) * Math.ceil(i / 2) * 9;
      if (rectSolid(x, L.y, L.w, L.h)) x = L.x;
      const o = spawnEnemy('engrenagens', x, L.y, zone);
      if (!o || o.dead) continue;
      o.anFollower = true; o.atkCD = 1.5 + Math.random();
      if (o.lvl !== L.lvl) Object.assign(o, { lvl: L.lvl, hp: L.maxHp, maxHp: L.maxHp, dmg: L.dmg, xp: L.xp, gold: L.gold });
    } } finally { anPacking = false; }
  }
}
function anUpdate(dt) {
  anPackTick(); anLockScan(dt); anNailTick(dt); anBlobTick(dt);
  // a rodinha de uma serra que sumiu volta a rolar
  for (const e of enemies) if (!e.dead && e.type === 'engrenagens' && e.state === 'join' && (!e.anLead || e.anLead.dead)) { e.state = 'roll'; e.anLead = null; }
}
HOOK.update.push(anUpdate);
function clearAnFx() {
  // o mundo novo é gerado de novo (as pedras quentes somem com ele): só as listas
  anNails.length = 0; anBlobs.length = 0; anPocas.length = 0; anPackQ.length = 0; anPedras.length = 0;
}
{ const _nw = newWorld; newWorld = function (sd, sv) { anLate(); clearAnFx(); return _nw(sd, sv); }; }

/* ---------- sons ---------- */
Object.assign(sfx, {
  // passo metálico duplo: o calcanhar e a ponta da greva
  anStep(v = 1) { tone(170, 0.05, 'square', 0.025 * v, -60); noise(0.04, 0.035 * v, 2400, 'bandpass', 0, 3); tone(140, 0.05, 'square', 0.02 * v, -50, 0.08); noise(0.04, 0.03 * v, 2000, 'bandpass', 0.08, 3); },
  anGrind() { noise(0.45, 0.03, 900, 'bandpass', 0, 4); tone(95, 0.4, 'sawtooth', 0.015, 25); },
  anRune() { tone(220, 0.6, 'sine', 0.03, 260); tone(330, 0.55, 'triangle', 0.012, 400, 0.05); },
  anThrust() { noise(0.12, 0.07, 1600, 'bandpass', 0, 1.2); tone(300, 0.08, 'sawtooth', 0.03, -200); },
  anWake() { tone(55, 0.9, 'sawtooth', 0.03, 90); noise(0.6, 0.04, 600, 'bandpass', 0, 3); for (let k = 0; k < 4; k++) tone(900 + k * 150, 0.03, 'square', 0.012, -300, 0.2 + k * 0.18); },
  anClank() { tone(620 + Math.random() * 300, 0.05, 'square', 0.02, -250); noise(0.05, 0.03, 3000, 'bandpass', 0, 2); },
  // clique de encaixe das engrenagens
  anClick() { tone(1800, 0.025, 'square', 0.02, -600); tone(1250, 0.03, 'square', 0.016, -400, 0.04); },
  anLock() { tone(900, 0.06, 'square', 0.035, -500); noise(0.12, 0.06, 3200, 'bandpass', 0, 2); tone(120, 0.12, 'square', 0.03, -40, 0.02); },
  anSaw() { noise(0.7, 0.05, 3200, 'bandpass', 0, 3); tone(480, 0.7, 'sawtooth', 0.012, 260); },
  anClatter() { for (let k = 0; k < 5; k++) tone(500 + Math.random() * 1100, 0.05, 'square', 0.016, -300, k * 0.05); noise(0.3, 0.05, 2200, 'bandpass', 0, 1); },
  // o fole: ar puxado e soprado
  anBellows() { noise(0.7, 0.05, 260, 'lowpass', 0, 1); noise(0.45, 0.035, 650, 'bandpass', 0.45, 2); },
  anRoar() { noise(0.55, 0.09, 900, 'lowpass'); noise(0.45, 0.05, 2400, 'bandpass', 0.05, 1.5); tone(80, 0.4, 'sawtooth', 0.02, -20); },
  anGlug() { tone(70 + Math.random() * 30, 0.14, 'sine', 0.04, -25); noise(0.1, 0.02, 400, 'lowpass'); },
  anThud() { tone(55, 0.12, 'sine', 0.05, -15); noise(0.08, 0.03, 300, 'lowpass'); tone(260, 0.04, 'square', 0.008, -100, 0.02); },
  anHum() { tone(140, 0.7, 'sine', 0.03, 300); tone(280, 0.7, 'triangle', 0.012, 600); },
  anWhirr() { noise(0.35, 0.05, 1800, 'bandpass', 0, 5); tone(600, 0.3, 'sine', 0.015, -200); },
  anStick() { noise(0.06, 0.06, 700, 'lowpass'); tone(380, 0.05, 'square', 0.02, -200); },
  // a corda dando volta: catraca por 2 s
  anWind() { for (let k = 0; k < 8; k++) { tone(1500 + (k % 2) * 260, 0.022, 'square', 0.014, -400, k * 0.25); noise(0.02, 0.02, 4000, 'highpass', k * 0.25 + 0.01); } },
  anFlap() { noise(0.12, 0.012, 700, 'bandpass', 0, 2); tone(900, 0.02, 'square', 0.004, -200, 0.06); },
  anBlink() { tone(1700, 0.03, 'sine', 0.014); },
  anNail() { noise(0.05, 0.05, 3600, 'highpass'); tone(720, 0.04, 'square', 0.018, -300); },
  anTink() { tone(2400, 0.04, 'square', 0.01, -800); },
  anGurgle() { tone(90, 1, 'sawtooth', 0.018, 70); noise(1, 0.035, 480, 'bandpass', 0, 3); for (let k = 0; k < 4; k++) tone(140 + Math.random() * 90, 0.06, 'sine', 0.02, 120, 0.15 + k * 0.2); },
  anSpit() { noise(0.2, 0.07, 600, 'lowpass'); tone(160, 0.15, 'sine', 0.04, -90); },
  anSizzle(v = 1) { noise(0.4, 0.05 * v, 4200, 'highpass'); },
  anCrumble() { noise(0.3, 0.05, 500, 'lowpass'); tone(70, 0.15, 'sine', 0.03, -20); }
});
