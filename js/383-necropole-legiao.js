'use strict';

/* ================= a Necrópole: a legião do rei =================
   Cinco dos dez bichos da décima quarta camada (docs/camadas/14-necropole.md, seção 6; a corte está no 384). São os
   mortos que o Rei Eterno levantou com posto: ossos em armadura, de pé e em ordem. Todos com o corpo de 12 x 22 nos
   encaixes do herói (o pintor do 37, heroPaint, para o corpo e as pernas; braços e armas por cima com o pintor das
   cavernas). Os olhos de alma acendem verde-pálido; os avisos acendem no mesmo verde, mais claro.
   - o Legionário Eterno (legionario): marcha atrás do escudo de torre, que segura todo golpe de frente (pula-se por
     cima, bate-se por trás, ou apara-se a estocada). Recua a lança 0,5 s (a ponta acende) e ESTOCA 2 blocos à frente;
     depois baixa o escudo um instante;
   - o Cavaleiro da Morte (cavaleiro): pesado, quase não se atordoa. Ergue o montante acima da cabeça (0,9 s, a lâmina
     acende) e racha o chão: o golpe na frente e uma onda de alma correndo pelo chão (pula-se). A lâmina fica presa no
     chão um momento. Abaixo da metade da vida ergue mais rápido;
   - o Arauto do Rei (arauto): não luta de perto, foge. Ergue a trompa (0,8 s) e sopra: o anel de som se abre, empurra
     o herói para longe e manda os mortos em volta para a frente (mais rápidos e com menos espera por 6 s);
   - o Embalsamador (embalsamador): joga o pote de unguento em arco (0,6 s com o pote erguido); o unguento gruda (o
     herói fica preso um instante). E enfaixa os mortos caídos: vai até o monte de ossos, as faixas correm da mão dele
     para o monte (1,4 s) e o morto levanta de novo, com metade da vida. Bater nele corta o serviço;
   - o Coveiro (coveiro): anda por baixo da terra (só um risco de terra se mexendo). Para debaixo do herói, a terra
     estufa e a ponta da pá aparece (0,7 s) e ele sai de baixo com a pá para cima. Depois briga de pá (ergue 0,45 s e
     bate) e uma hora volta para baixo da terra.
   O 385 põe o nível (embrulha spawnEnemy por fora) e as tabelas de spawn. As peças comuns (NCB: o corpo, as tintas,
   faíscas, sons, os montes de ossos) ficam aqui e o 384 e o 387 usam. Prefixo nc1. */

Object.assign(ET, {
  legionario: { name: 'Legionário Eterno', w: 10, h: 22, hp: 160, dmg: 22, xp: 34, kb: 0.3, fly: false, blood: '#d8ccb0' },
  cavaleiro: { name: 'Cavaleiro da Morte', w: 12, h: 23, hp: 320, dmg: 34, xp: 60, kb: 0.08, fly: false, blood: '#d8ccb0' },
  arauto: { name: 'Arauto do Rei', w: 10, h: 22, hp: 120, dmg: 16, xp: 30, kb: 0.5, fly: false, blood: '#d8ccb0' },
  embalsamador: { name: 'Embalsamador', w: 10, h: 21, hp: 110, dmg: 18, xp: 30, kb: 0.5, fly: false, blood: '#a89070' },
  coveiro: { name: 'Coveiro', w: 10, h: 21, hp: 130, dmg: 22, xp: 30, kb: 0.45, fly: false, blood: '#5a4a38' }
});
const NC1_TYPES = ['legionario', 'cavaleiro', 'arauto', 'embalsamador', 'coveiro'];
// materiais, o metal e as bases do 388; filtradas agora e de novo a cada mundo
const NC1_DROPS = {
  legionario: [['cravo_caixao', 0.35, 1, 2], ['min_sepulcrita', 0.08], ['pocao', 0.08], ['alabarda_legiao', 0.02], ['escudo_tampa', 0.012]],
  cavaleiro: [['cravo_caixao', 0.4, 1, 3], ['cinza_alma', 0.2], ['min_sepulcrita', 0.14], ['pocao', 0.1], ['alabarda_legiao', 0.025], ['escudo_tampa', 0.025]],
  arauto: [['cravo_caixao', 0.25], ['cinza_alma', 0.2], ['min_sepulcrita', 0.06], ['pocao', 0.08], ['pocao_mana', 0.05]],
  embalsamador: [['unguento', 0.4], ['mortalha_pano', 0.3], ['min_sepulcrita', 0.06], ['pocao', 0.12], ['capuz_necromante', 0.012]],
  coveiro: [['cravo_caixao', 0.3, 1, 3], ['min_sepulcrita', 0.12], ['pocao', 0.08], ['escudo_tampa', 0.015]]
};
function nc1Tables() { for (const k of NC1_TYPES) DROPS[k] = NC1_DROPS[k].filter(([id]) => ITEMS[id]); }
nc1Tables();
Object.assign(NAV_WALKERS, { legionario: 1, cavaleiro: 1, arauto: 1, embalsamador: 1, coveiro: 1 });
Object.assign(CV_STEP, { legionario: 1, cavaleiro: 1, arauto: 1, embalsamador: 1, coveiro: 1 });

const NC1_TOMADA = 0.5, NC1_ERGUE = 0.9, NC1_ERGUE_F = 0.6, NC1_SOPRO = 0.8, NC1_MIRA = 0.6, NC1_ENFAIXA = 1.4, NC1_MONTE = 0.7, NC1_PA = 0.45;
const NC1_ONDA_SP = 150, NC1_ANEL = 8 * T, NC1_BUFF = 6;
// os mortos que podem ser levantados de novo pelo embalsamador (os de osso; ele mesmo, as mortalhas e os fátuos não)
const NC_LEVANTA = { legionario: 1, cavaleiro: 1, arauto: 1, coveiro: 1, necromante: 1, escriba: 1 };

/* ================= peças comuns (o 384 e o 387 usam) ================= */
const NCB = {};
{
const { cp, set } = CVB, cg = CVART.cg;
const toP = c => { const m = /rgb\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? pack(+m[1], +m[2], +m[3]) : ph(c); };
const RP = hex => heroRamp(hex).map(toP);
const R6 = hexes => hexes.map(h => ph(h));
const RI = {
  ferro: R6(['#121316', '#22252a', '#363a42', '#4e535c', '#6c727c', '#9aa0aa']),
  negro: R6(['#0a0a0d', '#15161b', '#22242b', '#30333c', '#42464f', '#5c606a']),
  madeira: R6(['#140c06', '#24180c', '#382614', '#4e381e', '#664a2a', '#80603a']),
  osso: R6(['#2a241c', '#4a4232', '#6e644e', '#968a6e', '#bcb092', '#e2d8bc']),
  alma: R6(['#1a3a2c', '#2e5e48', '#4a8a6a', '#7ad8a8', '#b8f0d0', '#eafff4']),
  barro: R6(['#1e140e', '#341f14', '#4c2e1c', '#664026', '#825434', '#a87048']),
  cera: R6(['#3a3428', '#5a5240', '#7c725a', '#a09676', '#c4ba98', '#e4dcc0']),
  latao: R6(['#2a1a06', '#46300c', '#664814', '#88621e', '#aa7e2c', '#d0a848']),
  ouro: R6(['#3a2a0c', '#5e4616', '#86662a', '#ae8a40', '#d4b060', '#f2d890']),
  pano: R6(['#1a1418', '#2c2228', '#40323a', '#58464e', '#6e5a62', '#8a747a']),
  rubro: R6(['#1a080a', '#300e12', '#4a161c', '#661e26', '#822a32', '#a03c42']),
  linho: R6(['#3e382c', '#5c5444', '#7c725e', '#9c927a', '#bcb298', '#d8d0b8']),
  terra: R6(['#17120e', '#261e17', '#362b21', '#47392b', '#5a4a38', '#705e48'])
};
// um membro por uma linha quebrada, o contorno escuro primeiro, a luz de cima à esquerda (como o 133)
function limb(P, pts, r, R, base, s, rimV = 0.5) {
  const each = fn => { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 2)); for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n); } };
  each((cx, cy) => { const rr = r + 0.6; for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rr) P.put(x, y, R, rimV); });
  each((cx, cy) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r; if (dx * dx + dy * dy > 1.3) continue; P.put(x, y, R, base + 0.6 - (dx + dy) * 0.8 + cg(x, y, s) * 0.4); } });
}
// a tela do heroPaint carimbada no pintor (getImageData só aqui, no preparo)
let scratch = null;
function stamp(P, cv, ox, oy) {
  if (!scratch) { const c = mk(40, 40); scratch = c.getContext('2d', { willReadFrequently: true }); }
  scratch.clearRect(0, 0, 40, 40); scratch.drawImage(cv, 0, 0);
  const d = scratch.getImageData(0, 0, cv.width, cv.height), u = new Uint32Array(d.data.buffer);
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) { const v = u[y * cv.width + x]; if (v >>> 24) { const X = x + ox, Y = y + oy; if (X >= 0 && Y >= 0 && X < P.w && Y < P.h) P.c[Y * P.w + X] = v; } }
}
const LEGS = {
  idle: ["...PP..pp...", "...PP..pp...", "...FF..ff...", "...FFF.fff.."],
  w0: ["...PP..pp...", "..PP....pp..", "..FF....ff..", ".FFF....fff."],
  w1: ["....Ppp.....", "....PPpp....", "....FFfff...", "...FFF......"],
  w2: ["...pp..PP...", "..pp....PP..", "..ff....FF..", ".fff....FFF."],
  w3: ["....pPP.....", "....ppPP....", "....ffFFF...", "...fff......"],
  wide: ["..PP....pp..", ".PP......pp.", ".FF......ff.", "FFF......fff"]
};
// as túnicas longas (necromante, escriba): a barra balança
const ROBE = {
  idle: ["..rrrrrrrr..", "..rrrrrrrr..", ".rrrrrrrrrr.", ".rRrrfrrRrf."],
  w0: ["..rrrrrrrr..", ".rrrrrrrrr..", ".rrrrrrrrrr.", "rrRrrr.frrr."],
  w1: ["..rrrrrrrr..", "..rrrrrrrr..", "..rrrrrrrrr.", ".rrRrrfrrrr."],
  w2: ["..rrrrrrrr..", "..rrrrrrrrr.", ".rrrrrrrrrr.", ".rrf.rrrRrrr"],
  w3: ["..rrrrrrrr..", "..rrrrrrrr..", ".rrrrrrrrr..", ".rrrrfrrRrr."],
  wide: [".rrrrrrrrrr.", ".rrrrrrrrrr.", "rrrrrrrrrrrr", "rRrrrffrrrRr"]
};
/* os corpos (12 x 18, olhando para a direita). Letras: s osso (o crânio), e a órbita, W o olho de alma, m a boca;
   h elmo ou chapéu, p a crista, o os chifres, c capuz ou capa, w as faixas de linho, n tabardo ou cachecol, r cota,
   placa, casaco ou túnica, q remendo ou friso, a avental, t bolso, b cinto, k fivela ou o brasão de ouro */
const BODIES = {
  legionario: [
    "....pp......", "...hppph....", "..hhhhhhh...", "..hhhhhhhh..", "..hhhhseWs..", "..hhhsssss..", "..hhhssmss..", "...hhhsss...",
    "....nssn....", "...rrrrrrr..", "..rrrrrrrrr.", "..rrnnnnrrr.", "..rrnnknnrr.", "..rrnnnnnrr.", "..bbbbbbkbb.", "..nnnnnnnnn.",
    "..nnrnnnrnn.", ".nnnnnnnnnnn"],
  cavaleiro: [
    "..o......o..", "..oo.hh.oo..", "...ohhhhho..", "..hhhhhhhhh.", "..hhhhhheWh.", "..hhhhhhhhh.", "..chhhhhhhh.", ".cc.hhhhhh..",
    ".ccrrrhhrr..", ".crrrrrrrrr.", "ccrrrrrrrrrr", "ccrrqrrrrrr.", "ccrrrrrqrrr.", "ccrrrrrrrrr.", "ccbbbbbbkbb.", "ccrrrrrrrrr.",
    "cccrrrrrrrr.", "cccrrrrrrrrr"],
  arauto: [
    "....ccc.....", "...ccccc....", "..ccccccc...", "..cccccccc..", "..cccsseWs..", "..ccssssss..", "..cccssmss..", "...ccssss...",
    "...cnnnnc...", "..rrrrrrrr..", "..rrnnnnrr..", "..rrnkknrr..", "..rrnkknrr..", "..rrnnnnrr..", "..bbbbbbbb..", "..rrnnnnrr..",
    "..rrnnnnrr..", ".rrrnnnnrrr."],
  embalsamador: [
    "....www.....", "...wwwww....", "..wwwwwww...", "..wwwwwwww..", "..wwwwweWw..", "..wwwwwwww..", "..wwwwwwmw..", "...wwwwww...",
    "....wwww....", "..rrrrrrrr..", "..rraaaarr..", "..rraaaarr..", "..rraaaarr..", "..bbbbbbkb..", "..raattaar..", "..raaaaaar..",
    "..raaaaaar..", ".raaaaaaaar."],
  coveiro: [
    "....hhhh....", "...hhhhhh...", "...hhhhhh...", "hhhhhhhhhhhh", "...ssseWs...", "...sssssss..", "...sssmss...", "....nnnn....",
    "...nnnnnn...", "..rrrrrrrr..", "..rqqrrrrr..", "..rqqrrrrr..", "..rrrrrrrr..", "..bbbbbbkb..", "..rrrrrrqr..", "..rrrrrrqr..",
    ".rrrrrrrrrr.", ".rRrrrrrrRr."],
  necromante: [
    "....ccc.....", "...ccccc....", "..ccccccc...", "..cccccccc..", "..cccceeWe..", "..cccsssss..", "..ccccsmsc..", "..cccccsc...",
    "..cccccccc..", "..cnrrrrnc..", "..cnrrrrrn..", "..cnrrkrrn..", "..cnrrrrrn..", "..cnbbbbbn..", "..cnrrrrrn..", "..cnrrrrrn..",
    ".ccnrrrrrnc.", ".cnrrrrrrrn."],
  escriba: [
    ".....hh.....", "....hhhh....", "....hhhh....", "...hhhhhh...", "..hhhhhhhh..", "...ssseWs...", "...sssssss..", "...sssmss...",
    "....nnnn....", "..rrrrrrrr..", "..rrqrrrrr..", "..rrqrrrrr..", "..rrqrrrrr..", "..bbbbbkbb..", "..rrqrrtrr..", "..rrqrrrrr..",
    ".rrrqrrrrrr.", ".rrrqrrrrrr."]
};
const OSSO = '#c8bca0';
const MATS = {
  legionario: { p: '#6a1e22', h: '#4a4e58', s: OSSO, n: '#3a2430', r: '#5c5444', b: '#2a2018', k: '#b08a3a', P: '#3e424a', F: '#24242a' },
  cavaleiro: { o: '#d8ccb0', h: '#2c2e36', c: '#2a1418', r: '#34363e', q: '#8a7030', b: '#1a1612', k: '#a88030', P: '#2c2e36', F: '#18181c' },
  arauto: { c: '#3a3040', s: OSSO, n: '#5a1a22', k: '#c8a040', r: '#2e2a30', b: '#2a2018', P: '#2e2a30', F: '#1e1a18' },
  embalsamador: { w: '#a89c80', r: '#7a6e58', a: '#4a3424', t: '#2e2016', b: '#2a1e14', k: '#9a8040', P: '#5a5044', F: '#2a2018' },
  coveiro: { h: '#2a2622', s: OSSO, n: '#4a3a2a', r: '#3e3a30', q: '#5a4e3a', b: '#1e1a14', k: '#6a5a3a', P: '#2e2a24', F: '#1a1612' },
  necromante: { c: '#1e1a26', s: OSSO, n: '#3a5a48', r: '#2a2432', k: '#7ad8a8', b: '#1a1418', R: '#2a2432', f: '#141018' },
  escriba: { h: '#3a2a20', s: OSSO, n: '#4a3a30', r: '#5a4a3a', q: '#8a7a5a', t: '#2e2418', b: '#2a1e14', k: '#b09048', R: '#5a4a3a', f: '#1e1812' }
};
const ROBED = { necromante: 1, escriba: 1 };
function kit(type, seed) {
  const C = MATS[type], M = {};
  for (const L in C) {
    if (L === 'P' || L === 'F' || L === 'R' || L === 'f') continue;
    M[L] = { ramp: heroRamp(C[L]), grain: L === 'r' || L === 'a' || L === 'w' ? 0.14 : L === 'c' ? 0.2 : L === 's' ? 0.1 : 0.06, lip: L !== 's', under: L === 'b' || L === 'k',
      tex: L === 'h' && (type === 'legionario' || type === 'cavaleiro') ? 'plate' : L === 'r' && type === 'legionario' ? 'mail' : L === 'r' && type === 'cavaleiro' ? 'plate' : L === 'w' ? 'hair' : undefined };
  }
  M.e = '#060806'; M.W = NC_COL.alma; M.m = '#2a2218';
  const body = heroPaint(BODIES[type], L => M[L], seed, null, false), legs = {};
  if (ROBED[type]) {
    const LM = { r: { ramp: heroRamp(C.R), grain: 0.14, lip: true }, f: { ramp: heroRamp(C.f), grain: 0.05, lip: true } };
    for (const k in ROBE) legs[k] = heroPaint(ROBE[k], L => LM[L], seed + 3);
  } else {
    const LM = { p: { ramp: heroRamp(C.P), grain: 0.1, tex: type === 'cavaleiro' || type === 'legionario' ? 'plate' : undefined }, f: { ramp: heroRamp(C.F), grain: 0.05, lip: true } };
    for (const k in LEGS) legs[k] = heroPaint(LEGS[k], L => LM[L], seed + 3);
  }
  const sl = C.r || C.c;
  return { type, seed, body, legs, sleeve: RP(type === 'embalsamador' ? C.r : type === 'necromante' ? C.c : sl), skin: RP(OSSO), extra: C };
}
// um braço do ombro pelos pontos dados (cotovelo, mão); a mão é um nó de osso; devolve a mão
function arm(P, K, sx, sy, pts, far) {
  const a = [[sx, sy], ...pts.map(([x, y]) => [sx + x, sy + y])], h = a[a.length - 1];
  limb(P, a, 0.8, K.sleeve, far ? 1.6 : 3, K.seed + (far ? 5 : 9), 0.9);
  P.put(h[0], h[1], K.skin, far ? 2 : 3.6); P.put(h[0] + 0.6, h[1] + 0.5, K.skin, far ? 1.4 : 2.6);
  return h;
}
/* uma pose: o = { legs, lean, bob, far / near: os pontos do braço a partir do ombro, behind(P, bx, by),
   farItem(P, mão), nearItem(P, mão), mid(P, bx, by), front(P, bx, by) }. A tela é 36 x 30: o corpo em x 12, y 7 (sobra
   lugar para o montante erguido e a lança esticada), as pernas em y 25 */
const FW = 36, FH = 30, BX = 12, BY = 7;
function man(K, o) {
  const P = cp(FW, FH), bx = BX + (o.lean || 0), by = BY + (o.bob || 0);
  if (o.behind) o.behind(P, bx, by);
  if (o.far) { const h = arm(P, K, bx + 4.5, by + 10.5, o.far, true); if (o.farItem) o.farItem(P, h); }
  stamp(P, K.legs[o.legs || 'idle'], BX, BY + 18);
  stamp(P, K.body, bx, by);
  if (o.mid) o.mid(P, bx, by);
  if (o.near) { const h = arm(P, K, bx + 7.5, by + 10.5, o.near, false); if (o.nearItem) o.nearItem(P, h); }
  if (o.front) o.front(P, bx, by);
  return set(P.done());
}
/* ---- as armas e as coisas na mão ---- */
const dirOf = a => [Math.cos(a), Math.sin(a)];
// a lança da legião: a haste de freixo, o ferro em folha; acesa, a ponta pega o verde da alma
function lanca(P, h, a, lit, back = 5, fwd = 11) {
  const [c, s] = dirOf(a), nx = -s, ny = c, [hx, hy] = h;
  P.line(hx - c * back, hy - s * back, hx + c * fwd, hy + s * fwd, RI.madeira, t => 3.4 - t * 0.6);
  P.put(hx - c * back, hy - s * back, RI.ferro, 3);
  for (let t = 0; t <= 4.2; t += 0.4) { const w = t < 1 ? 0.3 : t < 3 ? 0.9 : 0.4, x = hx + c * (fwd + t), y = hy + s * (fwd + t); P.put(x - nx * w, y - ny * w, lit ? RI.alma : RI.ferro, lit ? 3.4 : 2.4); P.put(x + nx * w, y + ny * w, lit ? RI.alma : RI.ferro, lit ? 5 : 4.6); P.put(x, y, lit ? RI.alma : RI.ferro, lit ? 4.2 : 3.6); }
  P.put(hx + c * (fwd + 4.6), hy + s * (fwd + 4.6), lit ? RI.alma : RI.ferro, 5.4);
}
// o escudo de torre: tábuas escuras em pé, aro de ferro, a caveira coroada do rei em ouro no meio; x, y o canto de cima
function escudo(P, x, y, w = 6, h = 14) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const rim = i === 0 || i === w - 1 || j === 0 || j === h - 1, v = rim ? 3.6 - i * 0.25 - (j === h - 1 ? 1.2 : 0) + (j === 0 ? 0.8 : 0) : 2.6 - i * 0.18 - j * 0.04 + (i % 2 ? -0.5 : 0) + cg(x + i, y + j, 991) * 0.5;
    P.put(x + i, y + j, rim ? RI.ferro : RI.madeira, v);
  }
  for (const j of [3, h - 4]) for (let i = 1; i < w - 1; i++) P.put(x + i, y + j, RI.ferro, 2.8 - i * 0.2);   // as cintas
  const cx = x + (w >> 1) - 1, cy = y + (h >> 1) - 1;
  P.put(cx, cy, RI.osso, 4.6); P.put(cx + 1, cy, RI.osso, 4); P.put(cx, cy + 1, RI.osso, 3.6); P.put(cx + 1, cy + 1, RI.osso, 3); P.put(cx + 1, cy, RI.negro, 0);
  P.put(cx, cy - 1, RI.ouro, 5); P.put(cx + 1, cy - 1, RI.ouro, 4.2); P.put(cx - 0.6, cy - 1.6, RI.ouro, 5.4); P.put(cx + 1.6, cy - 1.6, RI.ouro, 4.6);
}
// o montante do cavaleiro: o cabo de couro, a guarda larga, a lâmina comprida com o fio; aceso, o fio corre em alma
function montante(P, h, a, lit, L = 12) {
  const [c, s] = dirOf(a), nx = -s, ny = c, [hx, hy] = h;
  P.line(hx - c * 2.4, hy - s * 2.4, hx + c * 0.4, hy + s * 0.4, RI.madeira, 2.6);
  P.put(hx - c * 2.8, hy - s * 2.8, RI.ferro, 4);
  for (let k = -2.4; k <= 2.4; k += 0.5) P.put(hx + c * 1.2 + nx * k, hy + s * 1.2 + ny * k, RI.ferro, 3.6 - k * 0.3);
  for (let t = 1.8; t <= L; t += 0.4) {
    const w = t > L - 1.4 ? 0.3 : 0.9, x = hx + c * t, y = hy + s * t;
    P.put(x - nx * w, y - ny * w, RI.negro, 2.6); P.put(x, y, RI.negro, 3.4); P.put(x + nx * w, y + ny * w, lit ? RI.alma : RI.ferro, lit ? 4.6 : 4.4 - t * 0.05);
    if (t > 3 && t < L - 2 && Math.abs(t % 2.4) < 0.4) P.put(x, y, RI.ferro, 4.2);   // o canal da lâmina
  }
  P.put(hx + c * (L + 0.4), hy + s * (L + 0.4), lit ? RI.alma : RI.ferro, 5.4);
}
// a trompa de chifre do arauto, com o bocal de latão e a campana de prata velha
function trompa(P, h, a, lit) {
  const [c, s] = dirOf(a), nx = -s, ny = c, [hx, hy] = h;
  for (let t = -1; t <= 6; t += 0.4) { const bend = Math.sin((t + 1) / 7 * Math.PI) * 1.2, r = 0.4 + Math.max(0, t - 2) * 0.28, x = hx + c * t + nx * bend, y = hy + s * t + ny * bend;
    for (let k = -r; k <= r + 0.01; k += 0.5) P.put(x + nx * k, y + ny * k, t < 0 ? RI.latao : RI.osso, 3.4 - k * 0.8 + (t > 5 ? 0.8 : 0)); }
  const ex = hx + c * 6.4, ey = hy + s * 6.4; P.put(ex, ey, lit ? RI.alma : RI.ouro, lit ? 5.4 : 4.6);
}
// o pote de unguento: barro, a boca amarrada com pano; aceso, o unguento verde-âmbar escorre pela boca
function jarro(P, x, y, lit) {
  P.blob(x, y + 0.6, 1.6, 1.8, RI.barro, 801, 3.2); P.put(x - 0.6, y - 0.2, RI.barro, 5);
  P.put(x, y - 1.4, RI.linho, 4); P.put(x - 0.6, y - 1.4, RI.linho, 4.6); P.put(x + 0.6, y - 1.6, RI.linho, 3.4);
  if (lit) { P.put(x + 0.8, y - 0.8, RI.alma, 5); P.put(x + 1.2, y + 0.4, RI.alma, 4.2); }
}
// a pá do coveiro: o cabo de pau com a muleta, a folha de ferro gasta com a terra grudada
function pa(P, h, a) {
  const [c, s] = dirOf(a), nx = -s, ny = c, [hx, hy] = h;
  P.line(hx - c * 4.6, hy - s * 4.6, hx + c * 6.4, hy + s * 6.4, RI.madeira, t => 3.6 - t * 0.8);
  for (let k = -1; k <= 1; k += 0.5) P.put(hx - c * 4.8 + nx * k, hy - s * 4.8 + ny * k, RI.madeira, 3.4);   // a muleta
  for (let t = 6.4; t <= 10; t += 0.4) for (let k = -1.6; k <= 1.6; k += 0.5) {
    const x = hx + c * t + nx * k, y = hy + s * t + ny * k, dirt = t > 8.6 && hash2(Math.round(x), Math.round(y), 777) < 0.5;
    P.put(x, y, dirt ? RI.terra : RI.ferro, dirt ? 3 : 3.6 - k * 0.6 - (t - 6.4) * 0.2);
  }
}
// o cajado do necromante: pau torto, a gaiola de ferro com a chama de alma (o 384 desenha a chama ao vivo)
function cajado(P, h, a, L = 14) {
  const [c, s] = dirOf(a), nx = -s, ny = c, [hx, hy] = h;
  for (let t = -6; t <= L - 6; t += 0.4) { const w = Math.sin(t * 0.7) * 0.4; P.put(hx + c * t + nx * w, hy + s * t + ny * w, RI.madeira, 3.4 - t * 0.04 + (t > 4 ? -0.4 : 0)); }
  const ex = hx + c * (L - 6), ey = hy + s * (L - 6);
  for (const [dx, dy] of [[-1.4, -0.6], [1.4, -0.6], [-1.6, -2.2], [1.6, -2.2], [0, -3.4], [-1, -3], [1, -3]]) P.put(ex + dx, ey + dy - 0.6, RI.ferro, dy < -2.5 ? 4.4 : 3);
  return [ex, ey - 2];
}
// o livro da sentença: capa de couro escura, o fecho de latão, as folhas claras
function livro(P, x, y, open) {
  if (open) {
    for (let j = 0; j < 3; j++) for (let i = -3; i <= 3; i++) P.put(x + i, y + j - (i === 0 ? 0 : Math.abs(i) * 0.1), i === 0 ? RI.madeira : RI.cera, i === 0 ? 2 : 4.6 - Math.abs(i) * 0.2 - j * 0.4);
    for (let i = -3; i <= 3; i++) if (i) P.put(x + i, y + 3, RI.madeira, 2.6);
    P.put(x + 1.5, y + 1, RI.negro, 1); P.put(x + 2.5, y + 1, RI.negro, 1); P.put(x - 2, y + 1, RI.negro, 1);
  } else {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) P.put(x + i, y + j, RI.madeira, 3.2 - i * 0.4 - j * 0.2);
    P.put(x + 2, y + 1.5, RI.latao, 4.6);
  }
}
function pena(P, x, y) { P.line(x, y, x + 2.4, y - 3.6, RI.cera, 4.6); P.put(x + 2.8, y - 4.2, RI.cera, 5.6); P.put(x, y + 0.6, RI.negro, 0.6); }
// a bandeira do arauto nas costas: o mastro e o galhardete rubro rasgado com a coroa
function galhardete(P, bx, by) {
  for (let y = by - 6; y < by + 20; y++) P.put(bx + 2.4 - (y - by) * 0.04, y, RI.madeira, 3 - (y - by) * 0.02);
  P.put(bx + 2.2, by - 6.6, RI.ouro, 5);
  for (let y = by - 5; y < by + 1; y++) for (let x = bx - 3; x < bx + 2; x++) { const torn = y > by - 1 && (x + y) % 2 === 0; if (!torn) P.put(x, y, RI.rubro, 3.2 - (x - bx + 3) * -0.15 - (y - by + 5) * 0.2 + cg(x, y, 993) * 0.5); }
  P.put(bx - 1.4, by - 3.4, RI.ouro, 4.6); P.put(bx - 0.6, by - 3.8, RI.ouro, 5); P.put(bx + 0.2, by - 3.4, RI.ouro, 4.2);
}
// os potes no cinto do embalsamador, as faixas soltas
function potes(P, bx, by) { for (const [x, y] of [[2.6, 14.4], [4, 15]]) { P.blob(bx + x, by + y, 0.9, 1.1, RI.barro, 802, 3); P.put(bx + x, by + y - 1.2, RI.linho, 4); } }
function faixas(P, bx, by) { for (let k = 0; k < 4; k++) P.put(bx + 1.6 - k * 0.4, by + 9 + k * 1.4, RI.linho, 3.4 - k * 0.3); }
// a capa rasgada do cavaleiro voando atrás
function capa(P, bx, by, wave) {
  for (let y = by + 8; y < by + 22; y++) { const w = 2 + (y - by - 8) * 0.18 + Math.sin(y * 0.6 + wave) * 0.6; for (let x = bx + 1 - w; x < bx + 2; x++) { if (y > by + 18 && hash2(Math.round(x), y, 994 + wave) < 0.35) continue; P.put(x, y, RI.rubro, 1.6 + (x - bx) * 0.3 + cg(Math.round(x), y, 995) * 0.4); } }
}

/* ---- as poses ---- */
const W4 = ['w0', 'w1', 'w2', 'w3'];
const swF = k => [[-0.6 + k * 0.6, 3], [-1 + k * 1.2, 5.7]], swN = k => [[0.6 - k * 0.6, 3], [1.2 - k * 1.2, 5.6]];
function legionario(K) {
  const S = [], sh = (dx = 0, dy = 0) => (P, bx, by) => escudo(P, bx + 7 + dx, by + 6 + dy);
  const up = (P, h) => lanca(P, h, -1.42, false, 4, 10);
  S[0] = man(K, { far: [[0.6, 3], [2, 5.2]], farItem: up, near: [[1.2, 2.4], [2.4, 3.4]], front: sh() });
  for (let i = 0; i < 4; i++) { const k = i % 2 ? 0 : i === 0 ? 1 : -1; S[1 + i] = man(K, { legs: W4[i], far: [[0.6 + k * 0.4, 3], [2 + k * 0.6, 5.2]], farItem: up, near: [[1.2, 2.4], [2.4, 3.4]], front: sh(0, i % 2 ? 0 : -1) }); }
  S[5] = man(K, { lean: -1, legs: 'w2', far: [[-2, 2], [-4.2, 2.4]], farItem: (P, h) => lanca(P, h, 0.02, true, 3, 11), near: [[1.2, 2.4], [2.4, 3.4]], front: sh(0, 0) });          // recuou a lança (aviso)
  S[6] = man(K, { lean: 1, legs: 'wide', far: [[3, 0.4], [6.2, 0.6]], farItem: (P, h) => lanca(P, h, 0, true, 4, 9), near: [[1.4, 2.6], [2, 3.8]], front: sh(-1, 1) });           // a estocada
  S[7] = man(K, { far: [[1.2, 3], [3, 4.8]], farItem: (P, h) => lanca(P, h, 0.25, false, 4, 9), near: [[0.4, 3], [0.8, 5.4]], front: sh(-1, 4) });                                 // o escudo baixo
  return S;
}
function cavaleiro(K) {
  const S = [], cape = w => (P, bx, by) => capa(P, bx, by, w);
  const low = (P, h) => montante(P, h, 1.12, false, 13);
  for (let i = 0; i < 5; i++) {
    const k = i === 0 ? 0 : i % 2 ? 0 : i === 1 ? 1 : -1;
    S[i] = man(K, { legs: i ? W4[i - 1] : 'idle', behind: cape(i), far: [[1.4, 3], [3.4 + k * 0.3, 5]], near: [[1.6, 3], [3.8 + k * 0.3, 5.2]], nearItem: low });
  }
  S[5] = man(K, { legs: 'wide', behind: cape(2), far: [[0.6, -4], [0.2, -8.6]], near: [[0.8, -4.2], [0.6, -8.8]], nearItem: (P, h) => montante(P, h, -2.5, true, 13) });        // ergueu (aviso)
  S[6] = man(K, { lean: 1, legs: 'wide', behind: cape(3), far: [[2, 2], [4.6, 3.6]], near: [[2.2, 2.2], [5, 3.6]], nearItem: (P, h) => montante(P, h, 0.62, true, 12) });            // o golpe
  S[7] = man(K, { lean: 2, legs: 'wide', behind: cape(4), far: [[2, 2.6], [4.2, 4.6]], near: [[2.2, 2.8], [4.6, 4.8]], nearItem: (P, h) => montante(P, h, 0.95, false, 12) });       // a lâmina presa no chão
  return S;
}
function arauto(K) {
  const S = [], flag = (P, bx, by) => galhardete(P, bx, by), horn = (P, h) => trompa(P, h, 1.9, false);
  S[0] = man(K, { behind: flag, far: [[-0.3, 3], [0, 5.8]], near: [[0.6, 3], [1.6, 5.6]], nearItem: horn });
  for (let i = 0; i < 4; i++) { const k = i % 2 ? 0 : i === 0 ? 1 : -1; S[1 + i] = man(K, { legs: W4[i], behind: flag, far: swF(k), near: swN(k), nearItem: horn }); }
  S[5] = man(K, { legs: 'wide', behind: flag, far: [[-0.4, 3], [0.4, 5.6]], near: [[1.6, -1.2], [3, -3.4]], nearItem: (P, h) => trompa(P, h, -0.55, true) });                        // a trompa na boca (aviso)
  S[6] = man(K, { lean: -1, legs: 'wide', behind: flag, far: [[-0.4, 3], [0.4, 5.6]], near: [[1.8, -1.4], [3.4, -3.8]], nearItem: (P, h) => trompa(P, h, -0.75, true) });            // soprando
  return S;
}
function embalsamador(K) {
  const S = [], mid = (P, bx, by) => { potes(P, bx, by); faixas(P, bx, by); }, jar = lit => (P, h) => jarro(P, h[0] + 0.4, h[1] + 1.4, lit);
  S[0] = man(K, { mid, far: [[-0.3, 3], [0, 5.8]], near: [[0.6, 3], [1.6, 5.6]], nearItem: jar(false) });
  for (let i = 0; i < 4; i++) { const k = i % 2 ? 0 : i === 0 ? 1 : -1; S[1 + i] = man(K, { legs: W4[i], mid, far: swF(k), near: swN(k), nearItem: jar(false) }); }
  S[5] = man(K, { lean: -1, legs: 'w2', mid, far: [[1, 3], [2.6, 4.6]], near: [[-1, -3], [-2.4, -6]], nearItem: (P, h) => jarro(P, h[0], h[1] - 1.6, true) });                          // o pote erguido (aviso)
  S[6] = man(K, { lean: 1, legs: 'wide', mid, far: [[-0.6, 3], [-1, 5.4]], near: [[3, -0.6], [6.2, -1.4]] });                                                                           // jogou
  S[7] = man(K, { lean: 1, legs: 'idle', mid, far: [[2.4, 1.6], [5, 2.4]], near: [[2.6, 1.4], [5.4, 2]] });                                                                             // enfaixando
  return S;
}
function coveiro(K) {
  const S = [], shovel = (P, h) => pa(P, h, 1.38);
  S[0] = man(K, { far: [[-0.3, 3], [0, 5.8]], near: [[0.8, 3], [2, 5.4]], nearItem: shovel });
  for (let i = 0; i < 4; i++) { const k = i % 2 ? 0 : i === 0 ? 1 : -1; S[1 + i] = man(K, { legs: W4[i], far: swF(k), near: [[0.8, 3], [2 + k * 0.4, 5.4]], nearItem: (P, h) => pa(P, h, 1.38 - k * 0.1) }); }
  S[5] = man(K, { lean: -1, legs: 'w2', far: [[-1, 2.6], [-1.6, 4.6]], near: [[-1.4, -3], [-2.6, -6.4]], nearItem: (P, h) => pa(P, h, -2.3) });                                       // ergueu a pá (aviso)
  S[6] = man(K, { lean: 1, legs: 'wide', far: [[1.6, 2.4], [3.6, 3.6]], near: [[2.6, 1], [5.6, 2.6]], nearItem: (P, h) => pa(P, h, 0.35) });                                         // a pancada
  S[7] = man(K, { legs: 'wide', far: [[0.6, -4], [1, -8.4]], near: [[1, -4], [1.6, -8.8]], nearItem: (P, h) => pa(P, h, -1.35) });                                                    // saindo da terra, a pá para cima
  return S;
}
let built = null;
NCB.get = () => {
  if (built) return built;
  const K = {}; let s = 38801; for (const t in BODIES) K[t] = kit(t, s += 100);
  built = { K, legionario: legionario(K.legionario), cavaleiro: cavaleiro(K.cavaleiro), arauto: arauto(K.arauto), embalsamador: embalsamador(K.embalsamador), coveiro: coveiro(K.coveiro) };
  return built;
};
Object.assign(NCB, { RI, RP, R6, limb, stamp, kit, arm, man, dirOf, lanca, escudo, montante, trompa, jarro, pa, cajado, livro, pena, W4, swF, swN, FW, FH, BX, BY, cp, set, cg });
}

/* ---------- desenho comum: o quadro do herói na tela de 36 x 30 (o contorno soma 1) ---------- */
const NC_OX = 19, NC_OY = 30;
function ncBlit(S, e, fx, fy, fl, j = 0) {
  const img = cvPick(S, e, fl);
  if (e.ncRiseT > 0) {   // levantando do monte de ossos: sai do chão de baixo para cima
    const k = clamp(e.ncRiseT / 0.8, 0, 1), cut = Math.round(k * 24);
    lc.save(); lc.beginPath(); lc.rect(fx - NC_OX, fy - NC_OY, img.width, NC_OY); lc.clip(); lc.drawImage(img, fx - NC_OX + j, fy - NC_OY + cut); lc.restore(); return;
  }
  lc.drawImage(img, fx - NC_OX + j, fy - NC_OY);
}
const ncWalkK = e => e.onGround && Math.abs(e.vx) > 5 ? 1 + (Math.floor(e.t * (Math.abs(e.vx) > 45 ? 10 : 7)) % 4) : 0;
// o olho de alma: no quadro, o olho fica no x 8 e na linha 4 do corpo (alguns na 5)
const NC_EYE = { legionario: [8, 4], cavaleiro: [9, 4], arauto: [8, 4], embalsamador: [8, 4], coveiro: [7, 4], necromante: [8, 4], escriba: [7, 5] };
// um ponto (px, py) da tela de 36 x 30, sem o contorno, na tela do jogo
const ncPtC = (e, fx, fy, px, py) => [fx - NC_OX + (e.facing > 0 ? px + 1 : NCB.FW - px), fy - NC_OY + py + 1];
const ncEyePos = (e, fx, fy, lean = 0, bob = 0) => { const p = NC_EYE[e.type] || [8, 4]; return [fx + (p[0] + 0.5 - 6 + lean) * e.facing, fy - 23 + p[1] + bob + 0.5]; };

/* ---------- as faíscas acesas, o pó, os ossos ---------- */
const ncFx = [], ncFxGl = {};
function ncP(o) { if (ncFx.length < 500) ncFx.push(o); }
function ncSparks(x, y, n, cols, sp = 40, g = 0, life = 0.4, lit = true) {
  if (ncFx.length > 500) return;
  for (let i = 0; i < n; i++) ncP({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1, lit });
}
const NC_TERRAC = ['#47392b', '#5a4a38', '#362b21'], NC_OSSOC = ['#e2d8bc', '#bcb092', '#968a6e'], NC_ALMAC = ['#b8f0d0', '#eafff4', '#7ad8a8'];
const ncDust = (x, y, n, sp = 30, up = -40, cols = ['#6e6858', '#58534a', '#8a8472']) => { for (let i = 0; i < n; i++) ncP({ x: x + rnd(-3, 3), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(up, up * 0.2), g: 60, life: rnd(0.4, 0.9), max: 0.9, col: cols[i % cols.length], size: 1, lit: false }); };
HOOK.update.push(dt => { for (let i = ncFx.length - 1; i >= 0; i--) { const p = ncFx[i]; p.life -= dt; if (p.life <= 0) { ncFx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; } });
HOOK.drawGlow.push((cx, cy) => {
  for (const p of ncFx) { if (!p.lit) continue; const g = ncFxGl[p.col] || (ncFxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  lc.globalAlpha = 1;
});
HOOK.drawWorld.push((cx, cy) => {
  for (const p of ncFx) { if (p.lit) continue; lc.globalAlpha = Math.min(1, p.life / p.max * 2) * 0.85; lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of ncFx) { if (!p.lit) continue; lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  lc.globalAlpha = 1;
});
const ncNear = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const ncLive = e => e && !e.dead && enemies.includes(e);
function ncFloor(x, y, max = 10) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 0; k < max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T; return null; }
const NC_GLS = {};
const ncGl = (k, r, col) => NC_GLS[k] || (NC_GLS[k] = glow(r, col));
// o arauto mandou: o morto anda mais rápido e espera menos
const ncBuffed = e => (e.ncBuff || 0) > 0;
const NC_ALL = new Set(NC1_TYPES);   // o 384 soma a corte

/* ---------- os montes de ossos: onde um morto da legião caiu (o embalsamador levanta) ---------- */
const ncCorpos = [];
const NC_CORPO_T = 12;

/* ================= desenho dos cinco ================= */
DRAW_E.legionario = (e, fx, fy, fl) => {
  const S = NCB.get().legionario, st = e.state;
  const k = st === 'draw' ? 5 : st === 'lunge' ? 6 : st === 'recover' ? 7 : ncWalkK(e);
  ncBlit(S[k], e, fx, fy, fl, st === 'draw' && e.stateT < 0.15 ? Math.round(Math.sin(e.t * 60) * 0.6) : 0);
};
EYES_E.legionario = (e, fx, fy) => {
  const st = e.state, [x, y] = ncEyePos(e, fx, fy, st === 'draw' ? -1 : st === 'lunge' ? 1 : 0);
  lc.globalAlpha = ncBuffed(e) ? 0.75 : 0.4; lc.drawImage(ncGl('olho', 4, NC_COL.alma), Math.round(x) - 4, Math.round(y) - 4);
  if (st === 'draw') {   // a ponta da lança acesa
    const q = clamp(1 - e.stateT / (e.ncDraw || NC1_TOMADA), 0, 1), tx = fx + (-1 + 4.5 - 4.2 + 11 + 4.6 - 6) * e.facing, ty = fy - 23 + 10.5 + 2.4 + 0.5;
    lc.globalAlpha = 0.35 + 0.55 * q; lc.drawImage(ncGl('ponta', 7, NC_COL.almaB), Math.round(tx) - 7, Math.round(ty) - 7);
  }
};
WARN_E.legionario = e => e.state === 'draw';

DRAW_E.cavaleiro = (e, fx, fy, fl) => {
  const S = NCB.get().cavaleiro, st = e.state;
  const k = st === 'raise' ? 5 : st === 'cleave' ? 6 : st === 'stuck' ? 7 : ncWalkK(e);
  ncBlit(S[k], e, fx, fy, fl, st === 'raise' && e.stateT < 0.2 ? Math.round(Math.sin(e.t * 50) * 0.7) : 0);
};
EYES_E.cavaleiro = (e, fx, fy) => {
  const st = e.state, [x, y] = ncEyePos(e, fx, fy, st === 'cleave' ? 1 : st === 'stuck' ? 2 : 0);
  const fury = e.hp < e.maxHp * 0.5;
  lc.globalAlpha = fury ? 0.8 : ncBuffed(e) ? 0.7 : 0.45; lc.drawImage(ncGl('olhoV', 5, fury ? '#eafff4' : NC_COL.alma), Math.round(x) - 5, Math.round(y) - 5);
  if (st === 'raise') {   // a lâmina erguida acesa por inteiro
    const q = clamp(1 - e.stateT / (e.ncRaise || NC1_ERGUE), 0, 1);
    for (let t = 2; t <= 13; t += 3) { const bx = fx + (7.5 + 0.6 - 6 + Math.cos(-2.5) * t) * e.facing, by = fy - 23 + 10.5 - 8.8 + Math.sin(-2.5) * t; lc.globalAlpha = (0.2 + 0.5 * q) * (t / 13); lc.drawImage(ncGl('lamina', 6, NC_COL.alma), Math.round(bx) - 6, Math.round(by) - 6); }
  }
};
WARN_E.cavaleiro = e => e.state === 'raise';

DRAW_E.arauto = (e, fx, fy, fl) => {
  const S = NCB.get().arauto, st = e.state;
  ncBlit(S[st === 'blow' ? 5 : st === 'sound' ? 6 : ncWalkK(e)], e, fx, fy, fl);
};
EYES_E.arauto = (e, fx, fy) => {
  const [x, y] = ncEyePos(e, fx, fy, e.state === 'sound' ? -1 : 0);
  lc.globalAlpha = 0.4; lc.drawImage(ncGl('olho', 4, NC_COL.alma), Math.round(x) - 4, Math.round(y) - 4);
  if (e.state === 'blow') { const q = clamp(1 - e.stateT / NC1_SOPRO, 0, 1), bx = fx + (7.5 + 3 + Math.cos(-0.55) * 6.4 - 6) * e.facing, by = fy - 23 + 10.5 - 3.4 + Math.sin(-0.55) * 6.4; lc.globalAlpha = 0.3 + 0.6 * q; lc.drawImage(ncGl('campana', 8, NC_COL.almaB), Math.round(bx) - 8, Math.round(by) - 8); }
};
WARN_E.arauto = e => e.state === 'blow';

DRAW_E.embalsamador = (e, fx, fy, fl) => {
  const S = NCB.get().embalsamador, st = e.state;
  ncBlit(S[st === 'aim' ? 5 : st === 'throw' ? 6 : st === 'wrap' ? 7 : ncWalkK(e)], e, fx, fy, fl);
};
EYES_E.embalsamador = (e, fx, fy) => {
  const [x, y] = ncEyePos(e, fx, fy, e.state === 'aim' ? -1 : e.state === 'throw' || e.state === 'wrap' ? 1 : 0);
  lc.globalAlpha = 0.35; lc.drawImage(ncGl('olho', 4, NC_COL.alma), Math.round(x) - 4, Math.round(y) - 4);
  if (e.state === 'aim') { const q = clamp(1 - e.stateT / NC1_MIRA, 0, 1), bx = fx + (-1 + 7.5 - 2.4 - 6) * e.facing, by = fy - 23 + 10.5 - 6 - 1.6; lc.globalAlpha = 0.3 + 0.5 * q; lc.drawImage(ncGl('pote', 6, '#c8e8a0'), Math.round(bx) - 6, Math.round(by) - 6); }
};
WARN_E.embalsamador = e => e.state === 'aim' || e.state === 'wrap';

DRAW_E.coveiro = (e, fx, fy, fl) => {
  const st = e.state; if (st === 'under' || st === 'move' || st === 'mound') return;   // por baixo: só a terra (drawWorld)
  const S = NCB.get().coveiro;
  if (st === 'dig') {   // afundando
    const img = cvPick(S[0], e, fl), cut = Math.round(clamp(1 - e.stateT / 0.8, 0, 1) * 24);
    lc.save(); lc.beginPath(); lc.rect(fx - NC_OX, fy - NC_OY, img.width, NC_OY); lc.clip(); lc.drawImage(img, fx - NC_OX, fy - NC_OY + cut); lc.restore(); return;
  }
  ncBlit(S[st === 'pop' ? 7 : st === 'wind' ? 5 : st === 'swing' ? 6 : ncWalkK(e)], e, fx, fy, fl);
};
EYES_E.coveiro = (e, fx, fy) => {
  const st = e.state; if (st === 'under' || st === 'move' || st === 'mound' || st === 'dig') return;
  const [x, y] = ncEyePos(e, fx, fy, st === 'wind' ? -1 : st === 'swing' ? 1 : 0); lc.globalAlpha = ncBuffed(e) ? 0.7 : 0.4; lc.drawImage(ncGl('olho', 4, NC_COL.alma), Math.round(x) - 4, Math.round(y) - 4);
};
WARN_E.coveiro = e => e.state === 'wind' || e.state === 'mound';

/* ================= comportamento ================= */
const nc1Ondas = [], nc1Aneis = [], nc1Potes = [], nc1Pocas = [];
const ncHB = (e, reach, y0, h) => { const ecx = e.x + e.w / 2; return { x: e.facing > 0 ? ecx : ecx - reach, y: e.y + y0, w: reach, h }; };

/* ---------- o Legionário Eterno ---------- */
AI.legionario = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; const bf = ncBuffed(e);
  if (e.state === 'draw') {
    e.vx = approach(e.vx, 0, 900 * dt);
    if (e.stateT <= 0) { e.state = 'lunge'; e.stateT = 0.24; e.vx = e.facing * 200; e.hitThis = false; sfx.ncEstoca(Math.max(0.4, ncNear(e))); }
    return;
  }
  if (e.state === 'lunge') {
    e.vx = approach(e.vx, 0, 700 * dt);
    if (!e.hitThis && !pl.dead && overlap(ncHB(e, 30, 5, 10), pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, e.x + e.w / 2, e, false); if (r === 'hit') { pl.vx += e.facing * 90; ncSparks(pl.x + pl.w / 2, pl.y + 9, 4, NC_OSSOC, 50); } }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = bf ? 0.45 : 0.7; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = (bf ? 0.8 : 1.5) + Math.random() * 0.5; } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 2.4 * T ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? (bf ? 50 : 32) : 16, 600, 270, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  e.stepT = (e.stepT || 0) - dt; if (aggro && Math.abs(e.vx) > 10 && e.onGround && e.stepT <= 0) { e.stepT = 0.42; const v = ncNear(e, 200); if (v > 0.1) sfx.ncMarcha(v * 0.6); }
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (Math.abs(dx) < 3.4 * T && Math.abs(dy) < 1.6 * T && clearPath(e, pl)) { e.ncDraw = bf ? 0.36 : NC1_TOMADA; Object.assign(e, { state: 'draw', stateT: e.ncDraw, vx: 0 }); e.facing = Math.sign(dx) || e.facing; sfx.ncRecua(Math.max(0.4, ncNear(e))); }
};
// o escudo de torre segura o golpe de frente, menos de quem vem de cima
BLOCK_E.legionario = (e, dir) => (e.state === 'walk' || e.state === 'draw') && e.stun <= 0 && dir === -e.facing && !(pl.y + pl.h <= e.y + 6);

/* ---------- o Cavaleiro da Morte ---------- */
AI.cavaleiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; const bf = ncBuffed(e), fury = e.hp < e.maxHp * 0.5;
  if (e.state === 'raise') {
    e.vx = approach(e.vx, 0, 900 * dt);
    if (Math.random() < dt * 14) ncSparks(e.x + e.w / 2 - e.facing * 8, e.y - 6, 1, NC_ALMAC, 20, -20, 0.5);
    if (e.stateT <= 0) { e.state = 'cleave'; e.stateT = 0.22; e.hitThis = false; nc1Racha(e); }
    return;
  }
  if (e.state === 'cleave') {
    if (!e.hitThis && !pl.dead && overlap(ncHB(e, 32, -6, e.h + 6), pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, e.x + e.w / 2, e, false); if (r === 'hit') { pl.vx += e.facing * 140; pl.vy = Math.min(pl.vy, -120); } }
    if (e.stateT <= 0) { e.state = 'stuck'; e.stateT = fury ? 0.5 : 0.85; }
    return;
  }
  if (e.state === 'stuck') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = (bf || fury ? 1.1 : 1.8) + Math.random() * 0.6; sfx.ncArranca(Math.max(0.3, ncNear(e))); } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 2.2 * T ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? (bf || fury ? 38 : 24) : 12, 400, 260, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  e.stepT = (e.stepT || 0) - dt; if (Math.abs(e.vx) > 8 && e.onGround && e.stepT <= 0) { e.stepT = 0.55; const v = ncNear(e, 220); if (v > 0.1) sfx.ncPassoPesado(v * 0.7); }
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (Math.abs(dx) < 3.2 * T && Math.abs(dy) < 2 * T && clearPath(e, pl)) { e.ncRaise = fury || bf ? NC1_ERGUE_F : NC1_ERGUE; Object.assign(e, { state: 'raise', stateT: e.ncRaise, vx: 0 }); e.facing = Math.sign(dx) || e.facing; sfx.ncErgue(Math.max(0.4, ncNear(e))); }
};
function nc1Racha(e) {
  const x = e.x + e.w / 2 + e.facing * 22, g = ncFloor(x, e.y + e.h - 4, 4);
  shake(4); sfx.ncRacha(Math.max(0.4, ncNear(e)));
  if (g === null) return;
  ncDust(x, g, 12, 50); ncSparks(x, g - 2, 8, NC_ALMAC, 60, 120, 0.5);
  nc1Ondas.push({ x, y: g, dir: e.facing, run: 0, max: 7 * T, dmg: Math.round(e.dmg * 0.6), hit: false, t: 0 });
}

/* ---------- o Arauto do Rei ---------- */
AI.arauto = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'blow') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'sound'; e.stateT = 0.6; nc1Sopra(e); } return; }
  if (e.state === 'sound') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 4 + Math.random() * 1.5; } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const ad = Math.abs(dx); dir = ad < 4 * T ? -Math.sign(dx) : ad > 8 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 40 : 16, 600, 270, dy, aggro && dir === Math.sign(dx));
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (dist < 9 * T && e.sees) { Object.assign(e, { state: 'blow', stateT: NC1_SOPRO, vx: 0 }); e.facing = Math.sign(dx) || e.facing; sfx.ncInspira(Math.max(0.4, ncNear(e))); }
};
function nc1Sopra(e) {
  const x = e.x + e.w / 2 + e.facing * 8, y = e.y + 6;
  nc1Aneis.push({ x, y, r: 0, max: NC1_ANEL, dmg: Math.round(e.dmg * 0.5), hit: false, t: 0 });
  sfx.ncTrompa(Math.max(0.5, ncNear(e, 400)));
  // os mortos em volta vão para a frente
  for (const o of enemies) if (o !== e && !o.dead && NC_ALL.has(o.type) && o.type !== 'arauto' && Math.hypot(o.x - e.x, o.y - e.y) < 11 * T) { o.ncBuff = NC1_BUFF; o.atkCD = Math.min(o.atkCD, 0.4); ncSparks(o.x + o.w / 2, o.y + 4, 4, NC_ALMAC, 30, -30, 0.6); }
}
HOOK.update.push(dt => { for (const o of enemies) if (o.ncBuff > 0) o.ncBuff -= dt; });

/* ---------- o Embalsamador ---------- */
AI.embalsamador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'aim') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'throw'; e.stateT = 0.3; nc1Joga(e); } return; }
  if (e.state === 'throw') { if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2 + Math.random() * 0.8; } return; }
  if (e.state === 'wrap') {
    e.vx = approach(e.vx, 0, 900 * dt);
    const C = e.ncCorpo;
    if (!C || C.used || !ncCorpos.includes(C)) { e.state = 'walk'; e.atkCD = 1; return; }
    if (Math.random() < dt * 12) ncSparks(C.x + rnd(-4, 4), C.y - 3, 1, ['#d8d0b8', '#bcb298'], 15, -25, 0.6, false);
    if (e.stateT <= 0) { nc1Levanta(C, e); e.state = 'walk'; e.atkCD = 1.4; e.ncWrapCD = 6; }
    return;
  }
  e.state = 'walk'; e.ncWrapCD = (e.ncWrapCD || 0) - dt;
  // um monte de ossos perto: vai até ele e enfaixa
  let C = null;
  if (e.ncWrapCD <= 0) { let bd = 9 * T; for (const c of ncCorpos) { if (c.used || c.claim && c.claim !== e && ncLive(c.claim)) continue; const d = Math.hypot(c.x - (e.x + e.w / 2), c.y - (e.y + e.h)); if (d < bd) { bd = d; C = c; } } }
  let dir = 0;
  if (C) {
    C.claim = e; const cdx = C.x - (e.x + e.w / 2);
    if (Math.abs(cdx) < 2.2 * T && Math.abs(C.y - (e.y + e.h)) < 2 * T && e.onGround) { Object.assign(e, { state: 'wrap', stateT: NC1_ENFAIXA, vx: 0, ncCorpo: C }); e.facing = Math.sign(cdx) || e.facing; sfx.ncEnfaixa(Math.max(0.4, ncNear(e))); return; }
    dir = Math.sign(cdx); walk(e, dt, dir, 40, 600, 270, C.y - (e.y + e.h / 2), true); e.facing = dir || e.facing; return;
  }
  if (aggro) { const ad = Math.abs(dx); dir = ad < 4 * T ? -Math.sign(dx) : ad > 8 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 36 : 16, 600, 270, dy, aggro && dir === Math.sign(dx));
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (dist < 11 * T && dist > 2 * T && e.sees) { Object.assign(e, { state: 'aim', stateT: NC1_MIRA, vx: 0 }); e.facing = Math.sign(dx) || e.facing; sfx.ncPoteErgue(Math.max(0.4, ncNear(e))); }
};
function nc1Joga(e) {
  const x = e.x + e.w / 2 + e.facing * 4, y = e.y + 2, tx = pl.x + pl.w / 2, ty = pl.y + pl.h - 4, g = 520;
  const t = clamp(Math.hypot(tx - x, ty - y) / 170, 0.5, 1.2);
  nc1Potes.push({ x, y, vx: (tx - x) / t, vy: (ty - y - 0.5 * g * t * t) / t, g, dmg: e.dmg, t: 0, a: 0 });
  sfx.ncJoga(Math.max(0.4, ncNear(e)));
}
function nc1Quebra(S) {
  const g = ncFloor(S.x, S.y - 4, 3);
  nc1Pocas.push({ x: S.x, y: g !== null ? g : S.y, t: 0 });
  ncSparks(S.x, S.y, 10, ['#c8e8a0', '#a0c070', '#e8f4c0'], 60, 200, 0.5, false); ncSparks(S.x, S.y, 6, ['#825434', '#664026'], 50, 300, 0.5, false);
  sfx.ncQuebra(Math.max(0.3, clamp(1 - Math.hypot(pl.x - S.x, pl.y - S.y) / 300, 0, 1)));
  if (!pl.dead && Math.hypot(pl.x + pl.w / 2 - S.x, pl.y + pl.h / 2 - S.y) < 22) {
    const r = hurtPlayer(S.dmg, S.x, null, true);
    if (r === 'hit' && typeof elEnraizar === 'function') elEnraizar(0.7);   // o unguento gruda
  }
}
function nc1Levanta(C, by) {
  C.used = true; const D = ET[C.type]; if (!D) return;
  const e = spawnEnemy(C.type, C.x - D.w / 2, C.y - D.h, zoneAt(Math.floor(C.x / T), Math.floor((C.y - 2) / T)));
  if (!e || e.dead) return;
  e.ncRisen = true; e.hp = Math.max(1, Math.round(e.maxHp * 0.5)); e.xp = 1; e.gold = 0; e.ncRiseT = 0.8; e.stun = 0.8; e.facing = by ? -by.facing : e.facing;
  ncDust(C.x, C.y, 10, 30, -50); ncSparks(C.x, C.y - 8, 10, NC_ALMAC, 40, -40, 0.8); sfx.ncLevanta(Math.max(0.4, ncNear({ x: C.x, y: C.y })));
  const i = ncCorpos.indexOf(C); if (i >= 0) ncCorpos.splice(i, 1);
}
HOOK.update.push(dt => { for (const o of enemies) if (o.ncRiseT > 0) o.ncRiseT -= dt; });

/* ---------- o Coveiro ---------- */
function nc1Assenta(e) { const f = ncFloor(e.x + e.w / 2, e.y + e.h - 4, 6); if (f !== null) e.y = f - e.h; }
AI.coveiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const st = e.state;
  if (st === 'under' || st === 'move') {
    e.ncHidden = true; e.vx = 0; e.vy = 0;
    if (aggro && Math.abs(dy) < 3 * T && !pl.dead) {
      const cx = e.x + e.w / 2, d = pl.x + pl.w / 2 - cx, sp = (ncBuffed(e) ? 60 : 42) * dt, nx = e.x + clamp(d, -sp, sp);
      const ftx = Math.floor((nx + e.w / 2) / T), fty = Math.floor((e.y + e.h) / T);
      if (solidAt(ftx, fty) && !solidAt(ftx, fty - 1) && !solidAt(ftx, fty - 2)) { e.x = nx; e.state = 'move'; } else e.state = 'under';
      nc1Assenta(e);
      if (Math.random() < dt * 10) ncDust(e.x + e.w / 2 + rnd(-3, 3), e.y + e.h, 1, 10, -20, NC_TERRAC);
      if (Math.abs(d) < T && e.atkCD <= 0) { e.state = 'mound'; e.stateT = NC1_MONTE; sfx.ncTerra(Math.max(0.5, ncNear(e))); }
    } else e.state = 'under';
    return;
  }
  if (st === 'mound') {   // a terra estufa, a ponta da pá aparece
    e.vx = 0; e.vy = 0; nc1Assenta(e);
    if (Math.random() < dt * 30) ncDust(e.x + e.w / 2 + rnd(-6, 6), e.y + e.h, 1, 20, -50, NC_TERRAC);
    if (e.stateT <= 0) {
      e.state = 'pop'; e.stateT = 0.4; e.ncHidden = false; e.hitThis = false; e.vy = -150; sfx.ncSai(Math.max(0.5, ncNear(e)));
      ncDust(e.x + e.w / 2, e.y + e.h, 16, 60, -90, NC_TERRAC);
    }
    return;
  }
  e.ncHidden = false;
  if (st === 'pop') {   // sai de baixo com a pá para cima
    if (!e.hitThis && !pl.dead && Math.abs(pl.x + pl.w / 2 - (e.x + e.w / 2)) < 18 && pl.y + pl.h > e.y - 8 && pl.y < e.y + e.h) { e.hitThis = true; const r = hurtPlayer(e.dmg, e.x + e.w / 2, e, false); if (r === 'hit') pl.vy = Math.min(pl.vy, -240); }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.8; e.upT = 6 + Math.random() * 4; }
    return;
  }
  if (st === 'wind') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'swing'; e.stateT = 0.22; e.hitThis = false; sfx.ncPa(Math.max(0.4, ncNear(e))); } return; }
  if (st === 'swing') {
    if (!e.hitThis && !pl.dead && overlap(ncHB(e, 24, 6, 16), pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, e.x + e.w / 2, e, false); if (r === 'hit') pl.vx += e.facing * 120; }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = (ncBuffed(e) ? 0.7 : 1.3) + Math.random() * 0.5; }
    return;
  }
  if (st === 'dig') { e.vx = 0; if (e.stateT <= 0) { e.state = 'under'; e.ncHidden = true; e.atkCD = 1.6 + Math.random(); } return; }
  e.state = 'walk'; e.upT = (e.upT || 0) - dt;
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 1.6 * T ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? (ncBuffed(e) ? 52 : 38) : 16, 600, 270, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  // de volta para baixo da terra quando cansa (ou o herói foge para longe)
  if (e.onGround && (e.upT <= 0 || (!aggro && Math.random() < dt * 0.1)) && e.atkCD <= 0) { e.state = 'dig'; e.stateT = 0.8; sfx.ncCava(Math.max(0.3, ncNear(e))); ncDust(e.x + e.w / 2, e.y + e.h, 10, 40, -60, NC_TERRAC); return; }
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (Math.abs(dx) < 2.4 * T && Math.abs(dy) < 1.5 * T && clearPath(e, pl)) { Object.assign(e, { state: 'wind', stateT: NC1_PA, vx: 0 }); e.facing = Math.sign(dx) || e.facing; }
};

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.ncHidden) return;   // o coveiro debaixo da terra, a gaveta fechada, a mortalha longe: o golpe não chega
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !NC1_TYPES.includes(e.type)) return r;
  if (e.type === 'cavaleiro') { e.stun = e.parried > 0 ? e.stun : Math.min(e.stun, e.state === 'raise' ? 0 : 0.1); }
  if (e.type === 'legionario' && e.stun > 0 && e.state === 'draw') { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.8); }
  if (e.type === 'arauto' && e.stun > 0 && e.state === 'blow') { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 2); }
  if (e.type === 'embalsamador' && e.stun > 0 && (e.state === 'wrap' || e.state === 'aim')) { if (e.ncCorpo) e.ncCorpo.claim = null; e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1); e.ncWrapCD = 3; }
  if (e.type === 'coveiro' && e.stun > 0 && e.state === 'wind') { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.6); }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!NC_ALL.has(e.type)) return r;
  const cx = e.x + e.w / 2, v = Math.max(0.3, ncNear(e, 260));
  // fica o monte de ossos (os levantados de novo não deixam outro)
  if (NC_LEVANTA[e.type] && !e.ncRisen && !e.boss && !e.ncSummon) {
    const g = ncFloor(cx, e.y + e.h - 4, 4);
    if (g !== null) { ncCorpos.push({ type: e.type, x: cx, y: g, t: 0, used: false, seed: Math.random() * 9, claim: null }); if (ncCorpos.length > 14) ncCorpos.shift(); }
  }
  if (NC1_TYPES.includes(e.type)) sfx.ncDesmonta(v, e.type === 'cavaleiro' ? 0.7 : 1);
  return r;
}; }
// os levantados de novo não pagam de novo
{ const _rd = rollDrops; rollDrops = function (e) { if (e && (e.ncRisen || e.ncSummon)) return; return _rd(e); }; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !NC1_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'coveiro') { e.state = 'under'; e.ncHidden = true; nc1Assenta(e); }
  else e.state = 'walk';
  return e;
}; }

/* ---------- a cada quadro: as ondas, os anéis de som, os potes, os montes ---------- */
function nc1Update(dt) {
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // a onda de alma corre pelo chão: sobe e desce um degrau, para na parede ou na beirada
  for (let i = nc1Ondas.length - 1; i >= 0; i--) {
    const O = nc1Ondas[i]; O.t += dt;
    const step = NC1_ONDA_SP * dt, nx = O.x + O.dir * step;
    const g = ncFloor(nx, O.y - T - 2, 3);
    if (g === null || Math.abs(g - O.y) > T || solidAt(Math.floor(nx / T), Math.floor((g - 2) / T))) { O.run = O.max; }
    else { O.x = nx; O.y = g; O.run += step; }
    if (Math.random() < dt * 30) ncSparks(O.x, O.y - 2, 1, NC_ALMAC, 30, -60, 0.4);
    if (!O.hit && !pl.dead && Math.abs(pcx - O.x) < 7 && pl.y + pl.h > O.y - 9 && pl.y + pl.h <= O.y + 3) { const r = hurtPlayer(O.dmg, O.x - O.dir * 6, null, true); if (r !== 'none' || pl.invuln > 0) { O.hit = true; if (r === 'hit') pl.vy = Math.min(pl.vy, -150); } }
    if (O.run >= O.max) nc1Ondas.splice(i, 1);
  }
  // o anel de som: abre e empurra
  for (let i = nc1Aneis.length - 1; i >= 0; i--) {
    const A = nc1Aneis[i]; A.t += dt; A.r = A.max * Math.min(1, A.t / 0.55);
    const d = Math.hypot(pcx - A.x, pcy - A.y);
    if (!A.hit && !pl.dead && d < A.r + 6 && d > A.r - 14 && losClear(A.x, A.y, pcx, pcy)) {
      A.hit = true; const r = hurtPlayer(A.dmg, A.x, null, true);
      if (r === 'hit' || r === 'block') { const s = Math.sign(pcx - A.x) || 1; pl.vx = s * (r === 'block' ? 160 : 280); pl.vy = Math.min(pl.vy, -110); }
    }
    if (A.t > 0.8) nc1Aneis.splice(i, 1);
  }
  // os potes de unguento em arco
  for (let i = nc1Potes.length - 1; i >= 0; i--) {
    const S = nc1Potes[i]; S.t += dt; S.vy += S.g * dt; S.x += S.vx * dt; S.y += S.vy * dt; S.a += dt * 10;
    const hitH = !pl.dead && S.x > pl.x - 3 && S.x < pl.x + pl.w + 3 && S.y > pl.y - 3 && S.y < pl.y + pl.h + 3;
    if (hitH || solidAt(Math.floor(S.x / T), Math.floor(S.y / T)) || S.t > 3) { nc1Quebra(S); nc1Potes.splice(i, 1); }
  }
  for (let i = nc1Pocas.length - 1; i >= 0; i--) { nc1Pocas[i].t += dt; if (nc1Pocas[i].t > 2.5) nc1Pocas.splice(i, 1); }
  for (let i = ncCorpos.length - 1; i >= 0; i--) { const C = ncCorpos[i]; C.t += dt; if (C.t > NC_CORPO_T || C.used) ncCorpos.splice(i, 1); }
}
HOOK.update.push(nc1Update);
function clearNc1Fx() { ncFx.length = 0; nc1Ondas.length = 0; nc1Aneis.length = 0; nc1Potes.length = 0; nc1Pocas.length = 0; ncCorpos.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearNc1Fx(); nc1Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: só o que tem motivo (a lâmina erguida, a trompa soprando, a onda correndo)
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'cavaleiro' && e.state === 'raise') addL(e.x + e.w / 2 - e.facing * 6, e.y - 6, 0.4);
    else if (e.type === 'arauto' && (e.state === 'blow' || e.state === 'sound')) addL(e.x + e.w / 2 + e.facing * 10, e.y + 2, 0.3);
  }
  for (const O of nc1Ondas) addL(O.x, O.y - 4, 0.35);
  for (const C of ncCorpos) if (C.claim && ncLive(C.claim) && C.claim.state === 'wrap') addL(C.x, C.y - 4, 0.25);
}; }

HOOK.drawGlow.push((cx, cy) => {
  for (const O of nc1Ondas) { lc.globalAlpha = 0.6 * (1 - O.run / O.max * 0.5); lc.drawImage(ncGl('onda', 10, NC_COL.alma), Math.round(O.x - cx) - 10, Math.round(O.y - cy) - 13); }
  for (const A of nc1Aneis) { const f = 1 - A.t / 0.8; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; lc.globalAlpha = 0.25 * f; lc.drawImage(ncGl('anel', 5, NC_COL.almaB), Math.round(A.x + Math.cos(a) * A.r - cx) - 5, Math.round(A.y + Math.sin(a) * A.r - cy) - 5); } }
  for (const C of ncCorpos) if (C.claim && ncLive(C.claim) && C.claim.state === 'wrap') { lc.globalAlpha = 0.4 + 0.2 * Math.sin(gameTime * 8); lc.drawImage(ncGl('corpo', 9, NC_COL.alma), Math.round(C.x - cx) - 9, Math.round(C.y - cy) - 12); }
  for (const e of enemies) if (!e.dead && e.ncBuff > 0 && NC_ALL.has(e.type) && !e.ncHidden) { lc.globalAlpha = 0.18 + 0.06 * Math.sin(gameTime * 6 + e.seed); lc.drawImage(ncGl('buff', 12, NC_COL.alma), Math.round(e.x + e.w / 2 - cx) - 12, Math.round(e.y + e.h / 2 - cy) - 12); }
  lc.globalAlpha = 1;
});
// no mundo (com a luz): os montes de ossos, os potes voando, as poças, a terra do coveiro, as faixas
HOOK.drawWorld.push((cx, cy) => {
  const RI = NCB.RI;
  for (const C of ncCorpos) {
    const x = Math.round(C.x - cx), y = Math.round(C.y - cy); if (x < -20 || x > VW + 20 || y < -20 || y > VH + 20) continue;
    const fade = C.t > NC_CORPO_T - 1.5 ? (NC_CORPO_T - C.t) / 1.5 : 1; lc.globalAlpha = fade;
    // o monte: ossos cruzados, o crânio por cima, um pedaço de ferro
    const s = C.seed;
    for (let k = 0; k < 9; k++) { const ox = Math.round(Math.sin(s + k * 2.3) * 5), oy = -1 - (k % 3 === 0 ? 1 : 0); lc.fillStyle = k % 4 === 0 ? '#5a5e64' : k % 2 ? '#bcb092' : '#968a6e'; lc.fillRect(x + ox - 1, y + oy, 3, 1); }
    lc.fillStyle = '#e2d8bc'; lc.fillRect(x - 1, y - 4, 3, 2); lc.fillStyle = '#bcb092'; lc.fillRect(x - 1, y - 2, 3, 1); lc.fillStyle = '#060806'; lc.fillRect(x, y - 3, 1, 1);
  }
  lc.globalAlpha = 1;
  for (const S of nc1Potes) { const x = Math.round(S.x - cx), y = Math.round(S.y - cy); lc.fillStyle = '#1e140e'; lc.fillRect(x - 2, y - 2, 4, 5); lc.fillStyle = '#825434'; lc.fillRect(x - 1, y - 1, 2, 3); lc.fillStyle = '#a87048'; lc.fillRect(x - 1, y - 1, 1, 1); lc.fillStyle = '#bcb298'; lc.fillRect(x - 1, y - 2, 2, 1); }
  for (const P of nc1Pocas) { const x = Math.round(P.x - cx), y = Math.round(P.y - cy), f = Math.max(0, 1 - P.t / 2.5); lc.globalAlpha = f; lc.fillStyle = '#5a7040'; lc.fillRect(x - 8, y - 1, 16, 1); lc.fillStyle = '#88a858'; lc.fillRect(x - 5, y - 1, 9, 1); lc.fillStyle = '#b8d080'; lc.fillRect(x - 3, y - 2, 3, 1); lc.globalAlpha = 1; }
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'coveiro' && (e.state === 'under' || e.state === 'move' || e.state === 'mound')) {
      const x = Math.round(e.x + e.w / 2 - cx), y = Math.round(e.y + e.h - cy); if (x < -30 || x > VW + 30 || y < -20 || y > VH + 20) continue;
      if (e.state === 'mound') {   // o monte de terra estufando e a ponta da pá
        const k = clamp(1 - e.stateT / NC1_MONTE, 0, 1), H = Math.round(1 + k * 4);
        for (let j = -7; j <= 7; j++) { const h = Math.max(0, Math.round(H * (1 - (j * j) / 50))); lc.fillStyle = j & 1 ? '#362b21' : '#47392b'; lc.fillRect(x + j, y - h, 1, h); if (h) { lc.fillStyle = '#5a4a38'; lc.fillRect(x + j, y - h, 1, 1); } }
        const ty = y - H - Math.round(k * 4); lc.fillStyle = '#22252a'; lc.fillRect(x - 2, ty - 1, 4, 4); lc.fillStyle = '#6c727c'; lc.fillRect(x - 1, ty, 2, 3); lc.fillStyle = '#9aa0aa'; lc.fillRect(x - 1, ty, 1, 1);
      } else {   // o risco de terra andando
        for (let j = -4; j <= 4; j++) { const h = Math.max(0, Math.round(1.6 - Math.abs(j) / 3 + Math.sin(e.t * 4 + j) * 0.5)); if (!h) continue; lc.fillStyle = j & 1 ? '#362b21' : '#47392b'; lc.fillRect(x + j, y - h, 1, h); }
      }
    } else if (e.type === 'embalsamador' && e.state === 'wrap' && e.ncCorpo) {   // as faixas correndo da mão para o monte
      const C = e.ncCorpo, hx = e.x + e.w / 2 + e.facing * 8, hy = e.y + 12, n = 3;
      for (let s = 0; s < n; s++) {
        const ph0 = (gameTime * 1.6 + s / n) % 1;
        for (let k = 0; k <= 12; k++) { const t = k / 12, x = lerp(hx, C.x, t) + Math.sin(t * 6 + s * 2 + gameTime * 5) * 3, y = lerp(hy, C.y - 3, t) - Math.sin(t * Math.PI) * 6; if (t > ph0 + 0.4) break; lc.fillStyle = k % 3 ? '#bcb298' : '#d8d0b8'; lc.fillRect(Math.round(x - cx), Math.round(y - cy), 1, 1); }
      }
    }
  }
});
// por cima do escuro: a onda acesa no chão, o anel de som
HOOK.drawTop.push((cx, cy) => {
  for (const O of nc1Ondas) {
    const x = Math.round(O.x - cx), y = Math.round(O.y - cy);
    for (let j = 0; j < 10; j++) { const h = Math.max(1, Math.round(6 - j * 0.6 + Math.sin(gameTime * 30 + j) * 0.8)), xx = x - O.dir * j; lc.globalAlpha = 1 - j / 10; lc.fillStyle = j < 2 ? '#eafff4' : j < 5 ? '#b8f0d0' : '#7ad8a8'; lc.fillRect(xx, y - h, 1, h); }
  }
  for (const A of nc1Aneis) {
    const f = 1 - A.t / 0.8, n = Math.max(12, Math.round(A.r * 0.8));
    lc.globalAlpha = f * 0.8; lc.fillStyle = '#d8fff0';
    for (let k = 0; k < n; k++) { if (k % 5 === 4) continue; const a = k / n * Math.PI * 2; lc.fillRect(Math.round(A.x + Math.cos(a) * A.r - cx), Math.round(A.y + Math.sin(a) * A.r - cy), 1, 1); }
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  ncMarcha(v = 1) { noise(0.06, 0.05 * v, 300, 'lowpass'); noise(0.03, 0.02 * v, 2400, 'bandpass', 0.01, 3); },
  ncRecua(v = 1) { noise(0.12, 0.04 * v, 1800, 'bandpass', 0, 2); tone(420, 0.3, 'triangle', 0.012 * v, 200); },
  ncEstoca(v = 1) { noise(0.12, 0.09 * v, 2600, 'bandpass', 0, 1.4); tone(180, 0.1, 'square', 0.025 * v, -80); },
  ncPassoPesado(v = 1) { tone(55, 0.18, 'sine', 0.06 * v, -10); noise(0.08, 0.04 * v, 1600, 'bandpass', 0.02, 4); },
  ncErgue(v = 1) { tone(220, 0.8, 'sawtooth', 0.012 * v, 220); tone(330, 0.8, 'sine', 0.014 * v, 330); noise(0.5, 0.02 * v, 3000, 'highpass'); },
  ncRacha(v = 1) { tone(48, 0.6, 'sine', 0.14 * v, -14); noise(0.4, 0.13 * v, 260, 'lowpass'); noise(0.2, 0.06 * v, 2200, 'bandpass', 0.02, 2); },
  ncArranca(v = 1) { noise(0.2, 0.06 * v, 900, 'bandpass', 0, 2); tone(120, 0.2, 'square', 0.02 * v, 60); },
  ncInspira(v = 1) { noise(0.7, 0.03 * v, 700, 'bandpass', 0, 0.8); tone(110, 0.7, 'sine', 0.01 * v, 40); },
  ncTrompa(v = 1) { tone(146, 1.1, 'sawtooth', 0.05 * v, -6); tone(220, 1.1, 'sawtooth', 0.025 * v, -8); tone(73, 1.2, 'sine', 0.05 * v, 0); noise(1, 0.02 * v, 500, 'bandpass', 0, 1); },
  ncPoteErgue(v = 1) { noise(0.08, 0.04 * v, 1200, 'bandpass', 0, 3); tone(300, 0.15, 'triangle', 0.01 * v, 60); },
  ncJoga(v = 1) { noise(0.15, 0.05 * v, 800, 'bandpass', 0, 1); },
  ncQuebra(v = 1) { noise(0.12, 0.1 * v, 1800, 'bandpass', 0, 1.5); for (let k = 0; k < 4; k++) noise(0.03, 0.04 * v, 3000 + k * 400, 'bandpass', 0.03 + k * 0.03, 5); noise(0.3, 0.05 * v, 400, 'lowpass', 0.05); },
  ncEnfaixa(v = 1) { for (let k = 0; k < 6; k++) noise(0.18, 0.025 * v, 1400 + k * 90, 'bandpass', k * 0.2, 2); },
  ncLevanta(v = 1) { tone(90, 0.9, 'sawtooth', 0.03 * v, 60); for (let k = 0; k < 6; k++) noise(0.04, 0.05 * v, 2000 + k * 200, 'bandpass', k * 0.06, 4); },
  ncTerra(v = 1) { noise(0.7, 0.06 * v, 260, 'lowpass', 0, 0.5); tone(60, 0.7, 'sine', 0.04 * v, 10); },
  ncSai(v = 1) { noise(0.3, 0.13 * v, 500, 'lowpass'); tone(90, 0.2, 'square', 0.03 * v, 120); },
  ncPa(v = 1) { noise(0.1, 0.08 * v, 1200, 'bandpass', 0, 1.4); tone(240, 0.1, 'triangle', 0.03 * v, -100); },
  ncCava(v = 1) { for (let k = 0; k < 4; k++) noise(0.08, 0.05 * v, 500 + k * 80, 'lowpass', k * 0.18); },
  ncDesmonta(v = 1, p = 1) { for (let k = 0; k < 7; k++) noise(0.04, 0.06 * v, (1800 + k * 260) * p, 'bandpass', k * 0.04, 5); tone(70 * p, 0.3, 'sine', 0.05 * v, -20); }
});
Object.assign(NCB, { ncFx, ncP, ncSparks, ncDust, ncNear, ncLive, ncFloor, ncBlit, ncWalkK, ncEyePos, ncPtC, ncGl, ncBuffed, ncHB, NC_OX, NC_OY, NC_TERRAC, NC_OSSOC, NC_ALMAC, ncCorpos });
