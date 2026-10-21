'use strict';

/* ================= a Necrópole: a corte dos mortos =================
   Os outros cinco bichos da camada (docs/camadas/14-necropole.md, seção 6; a legião está no 383): os que servem o rei
   sem armadura. As peças comuns (NCB: o corpo nos encaixes do herói, faíscas, sons, montes de ossos) vêm do 383.
   - o Necromante (necromante): de longe, com o cajado da chama de alma. Ergue as mãos (0,9 s) e um selo verde se acende
     no chão debaixo do herói, seguindo-o por meio segundo e depois parando; no fim, espinhos de osso saem do selo. Se o
     herói chega perto e bate, ele some numa fumaça verde e reaparece longe (a fumaça aparece antes onde ele vai sair);
   - o Escriba da Sentença (escriba): escreve o nome do herói no livro (1,2 s, a pena risca e o livro acende). Então o
     herói fica MARCADO (o selo da sentença em cima da cabeça, 2,2 s). Se o escriba ainda o vê quando a marca acaba, a
     coluna da sentença desenha-se no chão onde o herói está e cai meio segundo depois. Quebrar a linha de visão (atrás
     de uma parede, de uma coluna) apaga a marca;
   - a Mortalha (ncMortalha; o id "mortalha" já é do Escuro, 225): um sudário que voa rente ao teto. Para em cima do herói, treme e a sombra dela escurece no
     chão (0,7 s) e cai reta. Se pega, ENVOLVE o herói (fica preso e perde vida aos poucos); envolvendo, apanha em
     dobro. Se erra, fica estendida no chão um instante;
   - a Gaveta (gaveta): um nicho do columbário que ainda tem dono. Fica fechada na parede (o golpe não entra); quando o
     herói passa na frente, a tampa corre e os olhos acendem (0,6 s), e o braço de osso sai 4 blocos e PUXA quem pegar.
     Depois fica aberta um tempo (é quando se bate) e fecha;
   - o Fogo-fátuo (ncFatuo; o id "fatuo" já é dos Elfos, 253): chamas de alma em bando de 4 a 6, rodando em volta do herói. Uma de cada vez acende, treme
     (0,5 s) e dispara reto para onde o herói estava; erra e volta para a roda.
   Prefixo nc2. */

Object.assign(ET, {
  necromante: { name: 'Necromante', w: 10, h: 22, hp: 100, dmg: 24, xp: 34, kb: 0.6, fly: false, blood: '#d8ccb0' },
  escriba: { name: 'Escriba da Sentença', w: 10, h: 22, hp: 90, dmg: 30, xp: 32, kb: 0.6, fly: false, blood: '#d8ccb0' },
  ncMortalha: { name: 'Mortalha', w: 14, h: 14, hp: 70, dmg: 14, xp: 22, kb: 0.9, fly: true, blood: '#9a9488' },
  gaveta: { name: 'Gaveta do Columbário', w: 12, h: 12, hp: 90, dmg: 20, xp: 24, kb: 0, fly: true, phase: true, blood: '#d8ccb0' },
  ncFatuo: { name: 'Fogo-fátuo', w: 6, h: 6, hp: 18, dmg: 9, xp: 5, kb: 1, fly: true, blood: '#b8f0d0' }
});
const NC2_TYPES = ['necromante', 'escriba', 'ncMortalha', 'gaveta', 'ncFatuo'];
for (const t of NC2_TYPES) NC_ALL.add(t);
const NC2_DROPS = {
  necromante: [['cinza_alma', 0.35], ['min_sepulcrita', 0.08], ['pocao_mana', 0.12], ['pocao', 0.06], ['capuz_necromante', 0.02]],
  escriba: [['tinta_sentenca', 0.4], ['cinza_alma', 0.15], ['min_sepulcrita', 0.06], ['pocao_mana', 0.08], ['capuz_necromante', 0.012]],
  ncMortalha: [['mortalha_pano', 0.6, 1, 2], ['cinza_alma', 0.1]],
  gaveta: [['cravo_caixao', 0.3], ['min_sepulcrita', 0.1], ['pocao', 0.06], ['escudo_tampa', 0.012]],
  ncFatuo: [['cinza_alma', 0.25]]
};
function nc2Tables() { for (const k of NC2_TYPES) DROPS[k] = NC2_DROPS[k].filter(([id]) => ITEMS[id]); }
nc2Tables();
Object.assign(NAV_WALKERS, { necromante: 1, escriba: 1 });
Object.assign(CV_STEP, { necromante: 1, escriba: 1 });

const NC2_CONJURA = 0.9, NC2_SEGUE = 0.55, NC2_ESCREVE = 1.2, NC2_MARCA = 2.2, NC2_COLUNA = 0.5, NC2_TREME = 0.7, NC2_ABRE = 0.6, NC2_ACENDE = 0.5;
const NC2_BRACO = 4 * T;

/* ================= arte ================= */
const NC2 = {};
{
const { RI, man, cajado, livro, pena, W4, swF, swN, cp, set, cg } = NCB;
let tops = [];
function necromante(K) {
  const S = []; tops = [];
  const staff = (a, k) => (P, h) => { tops[k] = cajado(P, h, a, 15); };
  S[0] = man(K, { legs: 'idle', far: [[0.4, 3], [1.4, 5.4]], farItem: staff(-1.5, 0), near: [[0.6, 3], [1.6, 5.6]] });
  for (let i = 0; i < 4; i++) { const k = i % 2 ? 0 : i === 0 ? 1 : -1; S[1 + i] = man(K, { legs: W4[i], far: [[0.4 + k * 0.3, 3], [1.4 + k * 0.4, 5.4]], farItem: staff(-1.5 + k * 0.05, 1 + i), near: swN(k) }); }
  S[5] = man(K, { legs: 'wide', far: [[1.6, -1.6], [3, -4]], farItem: staff(-1.1, 5), near: [[2.2, -2.2], [4.4, -4.6]] });   // as mãos erguidas (aviso)
  return { S, tops: tops.slice() };
}
function escriba(K) {
  const S = [], open = (P, h) => livro(P, h[0] - 1, h[1] - 1, true), shut = (P, h) => livro(P, h[0] - 1, h[1] - 2, false);
  S[0] = man(K, { far: [[1, 2.6], [2.6, 3.8]], farItem: shut, near: [[0.6, 3], [1.6, 5.6]] });
  for (let i = 0; i < 4; i++) { const k = i % 2 ? 0 : i === 0 ? 1 : -1; S[1 + i] = man(K, { legs: W4[i], far: [[1, 2.6], [2.6, 3.8]], farItem: shut, near: swN(k) }); }
  for (let j = 0; j < 2; j++) S[5 + j] = man(K, { far: [[1.6, 1.6], [3.6, 2.2]], farItem: open, near: [[2, 0.6], [3.6 + j * 0.8, 0.8 - j * 0.6]], nearItem: (P, h) => pena(P, h[0], h[1]) });   // escrevendo (aviso)
  S[7] = man(K, { legs: 'wide', far: [[1.6, 1.6], [3.6, 2.2]], farItem: open, near: [[1.4, -3], [2.6, -7]], nearItem: (P, h) => pena(P, h[0], h[1]) });   // a pena erguida: a sentença
  return S;
}
/* a Mortalha, 20 x 20: o sudário dobrado com o rosto marcado no pano, a barra rasgada; k 0-1 voando, 2 aberta (caindo),
   3 enrolada (envolvendo) */
const MR = RI.linho, MS = R6m(['#1e1c1a', '#34312c', '#4c4842', '#66615a', '#827c74', '#a09a90']);
function R6m(h) { return h.map(c => ph(c)); }
function mortalha(k) {
  const P = cp(20, 20), s = 38901 + k * 7;
  if (k === 3) {   // enrolada: um casulo de pano em volta de uma forma
    for (let y = 1; y < 19; y++) for (let x = 3; x < 17; x++) { const u = (x + 0.5 - 10) / 7, v = (y + 0.5 - 10) / 9; if (u * u + v * v > 1) continue; const band = ((y + x * 0.5) % 4) < 1; P.put(x, y, MR, 3.2 - u * 1.2 - v * 0.8 + (band ? -1.2 : 0) + cg(x, y, s) * 0.5); }
    return set(P.done());
  }
  const wide = k === 2;
  for (let y = 0; y < 20; y++) {
    const v = y / 19, half = (wide ? 9.4 : 6.6) * (0.5 + 0.5 * Math.sin(Math.min(1, v * 1.6) * Math.PI / 2)) + (wide ? 0 : Math.sin(y * 0.7 + k * 2) * 0.8);
    for (let x = Math.floor(10 - half); x <= Math.ceil(10 + half); x++) {
      const u = (x + 0.5 - 10) / Math.max(1, half); if (Math.abs(u) > 1) continue;
      if (y > 14 && hash2(x, y + k * 3, s) < (y - 14) * 0.16) continue;   // a barra rasgada
      const fold = Math.sin(u * 4 + y * 0.25 + k) * 0.6;
      P.put(x, y, MR, 3.4 - u * 1.4 - v * 1.2 + fold + cg(x, y, s) * 0.45);
    }
  }
  // o rosto marcado no pano (as órbitas e o nariz escuros, a testa clara)
  const fx = 11, fy = 5; P.put(fx - 1.6, fy, MS, 0); P.put(fx + 1.4, fy, MS, 0); P.put(fx - 1.6, fy + 0.6, MS, 1); P.put(fx + 1.4, fy + 0.6, MS, 1); P.put(fx, fy + 2, MS, 1.4); P.put(fx - 1, fy + 3.6, MS, 1.6); P.put(fx + 1, fy + 3.6, MS, 1.6);
  for (let x = fx - 2; x <= fx + 2; x++) P.put(x, fy - 2, MR, 5);
  if (wide) for (const sx of [-1, 1]) for (let j = 0; j < 4; j++) P.put(10 + sx * (8 + j * 0.3), 6 + j, MS, 2.4);   // os dedos por baixo do pano
  return set(P.done());
}
/* a Gaveta, 16 x 14: a tampa de pedra com a placa do nome; k 0 fechada (só a tampa), 1 aberta (a caixa escura, o morto
   deitado dentro), o braço é desenhado ao vivo */
const NI = R6m(['#201c18', '#332d27', '#494137', '#61574a', '#7b6f5e', '#978a74']), IV = R6m(['#6e6656', '#958c78', '#bab09a', '#dcd4bc', '#f4eedc', '#ffffff']);
function gaveta(k) {
  const P = cp(16, 14), s = 38951 + k;
  const depth = k ? 9 : 2;   // quanto sai da parede (a parede fica à esquerda do desenho: x 0)
  for (let y = 1; y < 13; y++) for (let x = 0; x < depth; x++) P.put(x, y, NI, 2.4 - x * 0.12 + (y === 1 ? 1.2 : 0) + (y === 12 ? -1 : 0) + cg(x, y, s) * 0.4);   // as laterais
  if (k) for (let y = 3; y < 11; y++) for (let x = 0; x < depth - 1; x++) P.put(x, y, NI, 0.2);   // o fundo escuro da caixa
  if (k) { for (let x = 1; x < depth - 1; x++) P.put(x, 9, RI.osso, 3.6 - x * 0.1); P.put(depth - 3, 6, RI.osso, 4.4); P.put(depth - 2, 6, RI.osso, 3.6); P.put(depth - 3, 7, RI.osso, 3); }   // o morto deitado dentro
  // a tampa: a face de pedra com moldura, a placa clara com o nome em riscos
  const tx = depth;
  for (let y = 0; y < 14; y++) for (let x = tx; x < tx + 3; x++) P.put(x, y, NI, 3.4 - (x - tx) * 0.6 + (y === 0 ? 1 : 0) - (y === 13 ? 1.4 : 0) + cg(x, y, s + 1) * 0.4);
  for (let y = 4; y < 10; y++) P.put(tx + 1, y, IV, y === 4 ? 4 : 2.6);
  for (const y of [5.5, 7.5]) P.put(tx + 1, y, NI, 1);
  return set(P.done());
}
/* o Fogo-fátuo, 9 x 12: a chama fina de alma, 4 quadros */
const AL = RI.alma;
function fatuo(k) {
  const P = cp(9, 12), s = 38971 + k;
  for (let y = 0; y < 12; y++) {
    const v = y / 11, sway = Math.sin(v * 3 + k * 1.6) * (1 - v) * 1.4, half = (v < 0.35 ? v / 0.35 * 2.4 : 2.4 * (1 - (v - 0.35) / 0.65 * 0.3)) + 0.3;
    for (let x = Math.floor(4.5 + sway - half); x <= Math.ceil(4.5 + sway + half); x++) { const u = (x + 0.5 - 4.5 - sway) / half; if (Math.abs(u) > 1) continue; P.put(x, y, AL, 2 + v * 2.6 - Math.abs(u) * 1.6 + (Math.abs(u) < 0.3 && v > 0.45 ? 1.4 : 0) + cg(x, y, s) * 0.3); }
  }
  return set(P.done());
}
let built = null;
NC2.get = () => {
  if (built) return built;
  const B = NCB.get(), n = necromante(B.K.necromante);
  built = { necromante: n.S, nTops: n.tops, escriba: escriba(B.K.escriba), mortalha: [0, 1, 2, 3].map(mortalha), gaveta: [0, 1].map(gaveta), fatuo: [0, 1, 2, 3].map(fatuo) };
  return built;
};
}

/* ================= desenho ================= */
DRAW_E.necromante = (e, fx, fy, fl) => {
  const S = NC2.get().necromante, st = e.state;
  if (st === 'blink') { const a = e.stateT > 0.25 ? (e.stateT - 0.25) / 0.25 : 0; if (a <= 0) return; lc.globalAlpha = a; ncBlit(S[0], e, fx, fy, fl); lc.globalAlpha = 1; return; }
  if (st === 'appear') { lc.globalAlpha = clamp(1 - e.stateT / 0.3, 0, 1); ncBlit(S[0], e, fx, fy, fl); lc.globalAlpha = 1; return; }
  ncBlit(S[st === 'cast' ? 5 : ncWalkK(e)], e, fx, fy, fl, st === 'cast' && e.stateT < 0.2 ? Math.round(Math.sin(e.t * 50) * 0.6) : 0);
};
const nc2NTop = (e, fx, fy) => { const B = NC2.get(), k = e.state === 'cast' ? 5 : ncWalkK(e), t = B.nTops[k] || B.nTops[0]; return ncPtC(e, fx, fy, t[0], t[1]); };
EYES_E.necromante = (e, fx, fy) => {
  if (e.state === 'blink' && e.stateT < 0.25) return;
  const a = e.state === 'appear' ? clamp(1 - e.stateT / 0.3, 0, 1) : e.state === 'blink' ? (e.stateT - 0.25) / 0.25 : 1;
  const [x, y] = ncEyePos(e, fx, fy); lc.globalAlpha = 0.55 * a; lc.drawImage(ncGl('olho', 4, NC_COL.alma), Math.round(x) - 4, Math.round(y) - 4);
  const [tx, ty] = nc2NTop(e, fx, fy), f = 0.85 + Math.sin(e.t * 7) * 0.1 + (e.state === 'cast' ? 0.3 : 0);
  lc.globalAlpha = 0.35 * f * a; lc.drawImage(ncGl('cajB', 14, NC_COL.alma), Math.round(tx) - 14, Math.round(ty) - 14);
  lc.globalAlpha = a; lc.fillStyle = '#7ad8a8'; lc.fillRect(Math.round(tx) - 1, Math.round(ty), 2, 2); lc.fillStyle = '#eafff4'; lc.fillRect(Math.round(tx) - (Math.floor(e.t * 6) % 2), Math.round(ty) - 1, 1, 1);
};
WARN_E.necromante = e => e.state === 'cast';

DRAW_E.escriba = (e, fx, fy, fl) => {
  const S = NC2.get().escriba, st = e.state;
  ncBlit(S[st === 'write' ? 5 + (Math.floor(e.t * 9) % 2) : st === 'sentence' ? 7 : ncWalkK(e)], e, fx, fy, fl);
};
EYES_E.escriba = (e, fx, fy) => {
  const [x, y] = ncEyePos(e, fx, fy); lc.globalAlpha = 0.4; lc.drawImage(ncGl('olho', 4, NC_COL.alma), Math.round(x) - 4, Math.round(y) - 4);
  if (e.state === 'write') { const q = clamp(1 - e.stateT / NC2_ESCREVE, 0, 1), [bx, by] = ncPtC(e, fx, fy, NCB.BX + 4.5 + 3.6 - 1, NCB.BY + 10.5 + 2.2); lc.globalAlpha = 0.25 + 0.5 * q; lc.drawImage(ncGl('livro', 9, '#e8dcc0'), Math.round(bx) - 9, Math.round(by) - 9); }
};
WARN_E.escriba = e => e.state === 'write';

DRAW_E.ncMortalha = (e, fx, fy, fl) => {
  const B = NC2.get().mortalha, st = e.state;
  const k = st === 'wrap' ? 3 : st === 'drop' || st === 'sprawl' ? 2 : Math.floor(e.t * 3) % 2;
  const img = cvPick(B[k], e, fl), j = st === 'flutter' ? Math.round(Math.sin(e.t * 50)) : 0, bob = st === 'float' || st === 'idle' ? Math.round(Math.sin(e.t * 2 + e.seed) * 1.4) : 0;
  if (st === 'sprawl') { lc.save(); lc.translate(fx, fy - 3); lc.scale(1.3, 0.45); lc.drawImage(img, -img.width / 2, -img.height + 3); lc.restore(); return; }
  lc.drawImage(img, Math.round(fx - img.width / 2) + j, fy - img.height + 2 + bob);
};
EYES_E.ncMortalha = (e, fx, fy) => { if (e.state === 'wrap') return; lc.globalAlpha = e.state === 'flutter' ? 0.6 : 0.22; lc.drawImage(ncGl('olhoM', 3, NC_COL.alma), Math.round(fx + 1 * e.facing) - 3, Math.round(fy - 15) - 3); };
WARN_E.ncMortalha = e => e.state === 'flutter';

DRAW_E.gaveta = (e, fx, fy, fl) => {
  const B = NC2.get().gaveta, open = e.state !== 'shut', S = B[open ? 1 : 0];
  // o desenho tem a parede à esquerda; a gaveta olha para o lado oposto da parede (e.side é o lado da parede)
  const img = e.side < 0 ? (fl ? S.wr : S.r) : (fl ? S.wl : S.l), slide = e.state === 'open' ? Math.round(clamp(1 - e.stateT / NC2_ABRE, 0, 1) * 2) : 0;
  const x = e.side < 0 ? Math.round(fx - e.w / 2) - 1 + slide : Math.round(fx + e.w / 2) - img.width + 1 - slide;
  lc.drawImage(img, x, fy - img.height + 1);
};
EYES_E.gaveta = (e, fx, fy) => {
  if (e.state === 'shut') return;
  const out = -e.side, x = fx + out * 1, y = fy - 8;
  lc.globalAlpha = e.state === 'open' ? 0.5 + 0.4 * clamp(1 - e.stateT / NC2_ABRE, 0, 1) : 0.45; lc.drawImage(ncGl('olhoG', 4, NC_COL.alma), Math.round(x) - 4, Math.round(y) - 4);
  lc.globalAlpha = 1; lc.fillStyle = '#eafff4'; lc.fillRect(Math.round(x) - 1, Math.round(y), 1, 1); lc.fillRect(Math.round(x) + 1, Math.round(y), 1, 1);
};
WARN_E.gaveta = e => e.state === 'open';

DRAW_E.ncFatuo = (e, fx, fy, fl) => { };   // a chama vai por cima do escuro (EYES_E)
EYES_E.ncFatuo = (e, fx, fy) => {
  const B = NC2.get().fatuo, k = Math.floor(e.t * 10 + e.seed) % 4, img = cvPick(B[k], e, false), j = e.state === 'flare' ? Math.round(Math.sin(e.t * 60)) : 0;
  const hot = e.state === 'flare' || e.state === 'dart';
  lc.globalAlpha = hot ? 0.55 : 0.3; lc.drawImage(ncGl(hot ? 'fatuoQ' : 'ncFatuo', hot ? 12 : 9, NC_COL.alma), Math.round(fx) - (hot ? 12 : 9), Math.round(fy - 4) - (hot ? 12 : 9));
  lc.globalAlpha = e.flash > 0 ? 1 : hot ? 1 : 0.8; lc.drawImage(e.flash > 0 ? B[k].wr : img, Math.round(fx - img.width / 2) + j, fy - img.height + 2);
};
WARN_E.ncFatuo = e => e.state === 'flare';

/* ================= comportamento ================= */
const nc2Selos = [], nc2Espinhos = [], nc2Colunas = [], nc2Fumacas = [];
let nc2Marca = null;   // { owner, t, dmg }: a marca da sentença no herói (uma de cada vez)

/* ---------- o Necromante ---------- */
// um lugar de chão firme, longe uns blocos, de onde ele ainda vê o herói
function nc2Destino(e) {
  const ex = e.x + e.w / 2, side = Math.sign(ex - (pl.x + pl.w / 2)) || 1;
  for (let k = 0; k < 14; k++) {
    const d = (6 + Math.random() * 4) * T * (k < 8 ? side : -side), x = ex + d;
    const g = ncFloor(x, e.y - 3 * T, 8); if (g === null) continue;
    const tx = Math.floor(x / T), ty = g / T;
    if (solidAt(tx, ty - 1) || solidAt(tx, ty - 2) || solidAt(tx - 1, ty - 1) && solidAt(tx + 1, ty - 1)) continue;
    if (typeof ncSafe === 'function' && ncSafe(tx, ty - 1)) continue;
    if (typeof inNcHall === 'function' && !e.ncSummon && inNcHall(tx, ty, 3)) continue;
    return [x, g];
  }
  return null;
}
AI.necromante = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'cast') {
    e.vx = approach(e.vx, 0, 900 * dt);
    const S = e.ncSelo;
    if (S && !S.lock && e.stateT <= NC2_CONJURA - NC2_SEGUE) S.lock = true;
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2.4 + Math.random() * 0.8; e.ncSelo = null; }
    return;
  }
  if (e.state === 'blink') {
    e.vx = 0;
    if (e.stateT <= 0) { const D = e.ncDest; if (D) { e.x = D[0] - e.w / 2; e.y = D[1] - e.h; e.vy = 0; } e.state = 'appear'; e.stateT = 0.3; sfx.ncAparece(Math.max(0.3, ncNear(e))); }
    return;
  }
  if (e.state === 'appear') { if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.6); } return; }
  e.state = 'walk'; e.blinkCD = (e.blinkCD || 0) - dt;
  if (e.ncBlinkNow) { e.ncBlinkNow = false; const D = nc2Destino(e); if (D) { e.ncDest = D; e.state = 'blink'; e.stateT = 0.5; e.blinkCD = 4; nc2Fumacas.push({ x: D[0], y: D[1], t: 0, dur: 0.8 }); ncSparks(e.x + e.w / 2, e.y + 10, 10, ['#3a9a70', '#2e5e48', '#7ad8a8'], 30, -40, 0.7, false); sfx.ncSome(Math.max(0.3, ncNear(e))); return; } }
  let dir = 0;
  if (aggro) { const ad = Math.abs(dx); dir = ad < 5 * T ? -Math.sign(dx) : ad > 9 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 34 : 14, 600, 270, dy, aggro && dir === Math.sign(dx));
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead) return;
  if (dist < 12 * T && e.sees) {
    const g = ncFloor(pl.x + pl.w / 2, pl.y + pl.h - 4, 6); if (g === null) return;
    const S = { x: pl.x + pl.w / 2, y: g, t: 0, dur: NC2_CONJURA, lock: false, owner: e, dmg: e.dmg, done: false };
    nc2Selos.push(S); e.ncSelo = S;
    Object.assign(e, { state: 'cast', stateT: NC2_CONJURA, vx: 0 }); e.facing = Math.sign(dx) || e.facing; sfx.ncConjura(Math.max(0.4, ncNear(e)));
  }
};

/* ---------- o Escriba da Sentença ---------- */
AI.escriba = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'write') {
    e.vx = approach(e.vx, 0, 900 * dt);
    e.scratchT = (e.scratchT || 0) - dt; if (e.scratchT <= 0) { e.scratchT = 0.16; sfx.ncRisca(Math.max(0.3, ncNear(e))); }
    if (e.stateT <= 0) {
      if (!nc2Marca && !pl.dead && e.sees) { nc2Marca = { owner: e, t: 0, dmg: e.dmg }; sfx.ncMarca(1); }
      e.state = 'sentence'; e.stateT = 0.6;
    }
    return;
  }
  if (e.state === 'sentence') { if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 3.2 + Math.random(); } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const ad = Math.abs(dx); dir = ad < 6 * T ? -Math.sign(dx) : ad > 10 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 34 : 14, 600, 270, dy, aggro && dir === Math.sign(dx));
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead || nc2Marca) return;
  if (dist < 13 * T && e.sees) { Object.assign(e, { state: 'write', stateT: NC2_ESCREVE, vx: 0 }); e.facing = Math.sign(dx) || e.facing; }
};
const nc2Ve = (e) => { const ex = e.x + e.w / 2, ey = e.y + 5; return losClear(ex, ey, pl.x + pl.w / 2, pl.y + 6) || losClear(ex, ey, pl.x + pl.w / 2, pl.y + pl.h - 4); };

/* ---------- a Mortalha ---------- */
AI.ncMortalha = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, ecx = e.x + e.w / 2;
  if (e.state === 'flutter') {
    e.vx *= Math.pow(0.01, dt); e.vy *= Math.pow(0.01, dt);
    if (Math.random() < dt * 8) ncSparks(ecx + rnd(-5, 5), e.y + e.h, 1, ['#9c927a', '#7c725e'], 10, 30, 0.6, false);
    if (e.stateT <= 0) { e.state = 'drop'; e.stateT = 1.4; e.vx = 0; e.vy = 60; sfx.ncCai(Math.max(0.4, ncNear(e))); }
    return;
  }
  if (e.state === 'drop') {
    e.vy = Math.min(320, e.vy + 900 * dt); e.vx = 0;
    if (!pl.dead && overlap(e, pl) && pl.invuln <= 0) {
      const r = hurtPlayer(Math.round(e.dmg * 0.6), ecx, e, false);
      if (r === 'hit') { e.state = 'wrap'; e.stateT = 1.4; e.tick = 0.45; sfx.ncEnvolve(1); if (typeof elEnraizar === 'function') elEnraizar(1.4); }
      else { e.state = 'rise'; e.stateT = 1; e.atkCD = 2; }
      return;
    }
    if (e.hitCeil || e.onGround || solidAt(Math.floor(ecx / T), Math.floor((e.y + e.h + 1) / T)) || e.stateT <= 0) { e.state = 'sprawl'; e.stateT = 0.9; e.vy = 0; ncDust(ecx, e.y + e.h, 6, 30, -20); }
    return;
  }
  if (e.state === 'wrap') {   // envolve: segue o herói, aperta aos poucos
    if (!pl.dead) { e.x = pl.x + pl.w / 2 - e.w / 2; e.y = pl.y + pl.h / 2 - e.h / 2; e.vx = 0; e.vy = 0; if (typeof elEnraizar === 'function') elEnraizar(0.2); }
    e.tick -= dt; if (e.tick <= 0 && !pl.dead) { e.tick = 0.45; pl.invuln = 0; hurtPlayer(Math.round(e.dmg * 0.4), ecx + e.facing, null, true); sfx.ncAperta(0.6); }
    if (e.stateT <= 0 || pl.dead) { e.state = 'rise'; e.stateT = 1.2; e.atkCD = 3; e.vy = -120; }
    return;
  }
  if (e.state === 'sprawl') { e.vx = 0; e.vy = 0; if (e.stateT <= 0) { e.state = 'rise'; e.stateT = 1.2; e.atkCD = 2.2; } return; }
  if (e.state === 'rise') { e.vy = approach(e.vy, -70, 300 * dt); e.vx *= Math.pow(0.2, dt); if (e.stateT <= 0 || e.hitCeil) e.state = 'float'; return; }
  // voa rente ao teto: a altura que quer é a do teto em cima do herói, menos um bloco (até 6 blocos acima dele)
  let tx, ty;
  if (!aggro) { cvWander(e, dt); tx = ecx + (e.wander || 0) * 40; ty = (e.homeY || e.y) + Math.sin(e.t) * 6; e.state = 'idle'; }
  else {
    e.state = 'float';
    let cy = pl.y; const ptx = Math.floor(pcx / T); for (let k = 1; k <= 6; k++) { if (solidAt(ptx, Math.floor(pl.y / T) - k)) break; cy = pl.y - k * T; }
    tx = pcx + Math.sin(e.t * 0.7 + e.seed) * 10; ty = Math.min(cy + 2, pl.y - 2 * T);
  }
  const ax = tx - ecx, ay = ty - (e.y + e.h / 2), sp = aggro ? 75 : 30;
  e.vx = approach(e.vx, clamp(ax * 2.4, -sp, sp), 260 * dt); e.vy = approach(e.vy, clamp(ay * 2.4, -sp, sp), 260 * dt);
  e.facing = Math.sign(e.vx) || e.facing;
  if (!aggro || e.atkCD > 0 || pl.dead) return;
  if (Math.abs(pcx - ecx) < 10 && e.y + e.h < pl.y - 8 && losClear(ecx, e.y + e.h, pcx, pl.y)) { e.state = 'flutter'; e.stateT = NC2_TREME; sfx.ncTreme(Math.max(0.4, ncNear(e))); }
};

/* ---------- a Gaveta ---------- */
function nc2Encosta(e) {
  // o lado da parede mais perto (até 3 blocos), na altura do meio dela; a gaveta encosta a tampa na face da parede
  const cy = Math.floor((e.y + e.h / 2) / T), cx = Math.floor((e.x + e.w / 2) / T);
  for (let k = 0; k <= 3; k++) for (const s of [-1, 1]) {
    const tx = cx + s * k; if (!solidAt(tx, cy) || !solidAt(tx, cy - 1) && !solidAt(tx, cy + 1)) continue;
    if (solidAt(tx - s, cy)) continue;   // a face de fora tem que dar para o ar
    e.side = s; e.facing = -s; e.x = s > 0 ? tx * T - e.w : (tx + 1) * T; e.y = cy * T; return true;
  }
  return false;
}
AI.gaveta = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.vx = 0; e.vy = 0;
  const out = -e.side, fx = out > 0 ? e.x + e.w : e.x, fy = e.y + e.h / 2;
  if (e.state === 'shut') {
    e.ncHidden = true;
    if (!pl.dead && aggro && e.atkCD <= 0 && Math.sign(pl.x + pl.w / 2 - fx) === out && Math.abs(pl.x + pl.w / 2 - fx) < NC2_BRACO + 6 && Math.abs(pl.y + pl.h / 2 - fy) < 1.5 * T) { e.state = 'open'; e.stateT = NC2_ABRE; e.ncHidden = false; sfx.ncTampa(Math.max(0.4, ncNear(e))); }
    return;
  }
  e.ncHidden = false;
  if (e.state === 'open') { if (e.stateT <= 0) { e.state = 'reach'; e.stateT = 0.35; e.armL = 0; e.hitThis = false; sfx.ncBraco(Math.max(0.4, ncNear(e))); } return; }
  if (e.state === 'reach') {
    e.armL = Math.min(NC2_BRACO, e.armL + dt * NC2_BRACO / 0.2);
    const hb = { x: out > 0 ? fx : fx - e.armL, y: fy - 5, w: e.armL, h: 10 };
    if (!e.hitThis && !pl.dead && overlap(hb, pl)) {
      e.hitThis = true; const r = hurtPlayer(Math.round(e.dmg * 0.6), fx, e, false);
      if (r === 'hit') { e.state = 'pull'; e.stateT = 1; e.grab = true; sfx.ncAgarra(1); return; }
    }
    if (e.stateT <= 0) { e.state = 'retract'; e.stateT = 0.4; }
    return;
  }
  if (e.state === 'pull') {   // puxa o herói até a boca do nicho
    const px = pl.x + pl.w / 2, d = Math.abs(px - fx);
    e.armL = Math.max(4, Math.min(NC2_BRACO, d));
    if (!pl.dead) { if (typeof elEnfeiticar === 'function') elEnfeiticar(0.2, fx, fy, 150); pl.vx = approach(pl.vx, -out * 120, 900 * dt); }
    if (e.stateT <= 0 || pl.dead || d < 8) { if (!pl.dead && d < 14) { pl.invuln = 0; hurtPlayer(Math.round(e.dmg * 0.7), fx, null, true); pl.vx = out * 160; sfx.ncMorde(1); } e.state = 'retract'; e.stateT = 0.4; }
    return;
  }
  if (e.state === 'retract') { e.armL = Math.max(0, e.armL - dt * NC2_BRACO / 0.3); if (e.stateT <= 0) { e.state = 'gape'; e.stateT = 1.3; e.armL = 0; } return; }
  if (e.state === 'gape') { if (e.stateT <= 0) { e.state = 'shut'; e.atkCD = 2.4 + Math.random(); sfx.ncTampa(Math.max(0.3, ncNear(e)) * 0.7); } return; }
  e.state = 'shut';
};

/* ---------- o Fogo-fátuo ---------- */
const nc2Bandos = new Map();   // id do bando -> a espera até o próximo disparo
let nc2BandoN = 0, nc2NoBando = false;
AI.ncFatuo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  if (e.state === 'flare') { e.vx *= Math.pow(0.02, dt); e.vy *= Math.pow(0.02, dt); if (e.stateT <= 0) { e.state = 'dart'; e.stateT = 0.6; const a = Math.atan2(e.aimY - ecy, e.aimX - ecx); e.vx = Math.cos(a) * 250; e.vy = Math.sin(a) * 250; e.hitThis = false; sfx.ncDispara(Math.max(0.3, ncNear(e))); } return; }
  if (e.state === 'dart') {
    if (!e.hitThis && !pl.dead && overlap(e, pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') ncSparks(pcx, pcy, 6, NC_ALMAC, 50); e.state = 'back'; e.stateT = 1; }
    if (e.stateT <= 0 || e.hitWall || e.hitCeil || e.onGround) { e.state = 'back'; e.stateT = 1; }
    return;
  }
  let tx, ty;
  if (!aggro) { tx = (e.homeX || ecx) + Math.cos(e.t * 0.9 + e.seed) * 20; ty = (e.homeY || ecy) + Math.sin(e.t * 1.3 + e.seed) * 10; e.state = 'idle'; }
  else {
    if (e.state !== 'back' || e.stateT <= 0) e.state = 'orbit';
    const a = e.t * 0.9 + e.seed, r = 4 * T + Math.sin(e.t * 1.7 + e.seed) * 10;
    tx = pcx + Math.cos(a) * r; ty = pcy - T + Math.sin(a) * r * 0.55;
  }
  const ax = tx - ecx, ay = ty - ecy, sp = aggro ? 95 : 30;
  e.vx = approach(e.vx, clamp(ax * 2, -sp, sp), 300 * dt); e.vy = approach(e.vy, clamp(ay * 2, -sp, sp), 300 * dt);
  e.facing = Math.sign(e.vx) || e.facing;
  if (!aggro || e.state !== 'orbit' || e.atkCD > 0 || pl.dead || dist > 7 * T || !e.sees) return;
  const id = e.ncBando || 0, w = nc2Bandos.get(id) || 0;
  if (w > gameTime) return;
  nc2Bandos.set(id, gameTime + 0.9 + Math.random() * 0.5);
  e.state = 'flare'; e.stateT = NC2_ACENDE; e.aimX = pcx; e.aimY = pcy; e.atkCD = 2.4 + Math.random(); sfx.ncAcende(Math.max(0.4, ncNear(e)));
};

/* ---------- golpes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'ncMortalha' && e.state === 'wrap') mult *= 2;   // envolvendo, apanha em dobro
  if (e && e.type === 'necromante' && (e.state === 'blink' || e.state === 'appear')) return;
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !NC2_TYPES.includes(e.type)) return r;
  if (e.type === 'necromante' && melee && e.blinkCD <= 0 && Math.hypot(pl.x - e.x, pl.y - e.y) < 3.5 * T) { e.ncBlinkNow = true; e.stun = Math.min(e.stun, 0.05); }
  if (e.type === 'necromante' && e.stun > 0 && e.state === 'cast') { e.state = 'walk'; if (e.ncSelo) e.ncSelo.cancel = true; e.ncSelo = null; e.atkCD = Math.max(e.atkCD, 1.2); }
  if (e.type === 'escriba' && e.stun > 0 && e.state === 'write') { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1.5); }
  if (e.type === 'ncMortalha' && e.state === 'wrap' && e.hp < e.maxHp * 0.5) { e.state = 'rise'; e.stateT = 1.2; e.atkCD = 3; e.vy = -140; }
  if (e.type === 'ncMortalha' && e.state === 'flutter' && e.stun > 0) { e.state = 'float'; e.atkCD = 1.2; }
  if (e.type === 'gaveta') { e.vx = 0; e.vy = 0; e.stun = 0; }
  if (e.type === 'ncFatuo' && e.state === 'flare') { e.state = 'back'; e.stateT = 0.8; }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !NC2_TYPES.includes(type)) return e;
  if (type === 'necromante' || type === 'escriba') { for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T; }
  e.atkCD = 0.8 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'gaveta') { if (!nc2Encosta(e)) { e.dead = true; e.despawn = true; e.ncVoid = true; return e; } e.state = 'shut'; e.ncHidden = true; }
  else if (type === 'ncMortalha') e.state = 'idle';
  else if (type === 'ncFatuo') {
    e.state = 'idle';
    if (!nc2NoBando) {   // o bando: mais 3 a 5 em volta (o spawnEnemy de fora põe o nível de cada um)
      const id = ++nc2BandoN; e.ncBando = id; nc2NoBando = true;
      try {
        for (let k = 0, n = Math.min(3 + ((Math.random() * 3) | 0), Math.max(1, 11 - enemies.length)); k < n; k++) {   // o bando não estoura o teto da zona
          const a = Math.random() * Math.PI * 2, x = px + Math.cos(a) * 18, y = py + Math.sin(a) * 12;
          if (rectSolid(x, y, e.w, e.h)) continue;
          const o = spawnEnemy('ncFatuo', x, y, zone); if (o && !o.dead) o.ncBando = id;
        }
      } finally { nc2NoBando = false; }
    }
  } else e.state = 'walk';
  return e;
}; }

/* ---------- a cada quadro: os selos, os espinhos, a marca da sentença, a coluna, a fumaça ---------- */
function nc2Update(dt) {
  const pcx = pl.x + pl.w / 2;
  for (let i = nc2Selos.length - 1; i >= 0; i--) {
    const S = nc2Selos[i]; S.t += dt;
    if (S.cancel) { nc2Selos.splice(i, 1); continue; }
    if (!S.lock && !pl.dead) { const g = ncFloor(pcx, pl.y + pl.h - 4, 6); S.x = approach(S.x, pcx, 160 * dt); if (g !== null) S.y = g; }
    if (!S.done && S.t >= S.dur) {
      S.done = true; nc2Espinhos.push({ x: S.x, y: S.y, t: 0, seed: Math.random() * 9, hit: false, dmg: S.dmg });
      sfx.ncEspinhos(Math.max(0.3, clamp(1 - Math.hypot(pl.x - S.x, pl.y - S.y) / 280, 0, 1))); ncDust(S.x, S.y, 8, 40);
    }
    if (S.done) nc2Selos.splice(i, 1);
  }
  for (let i = nc2Espinhos.length - 1; i >= 0; i--) {
    const S = nc2Espinhos[i]; S.t += dt;
    if (!S.hit && S.t > 0.04 && S.t < 0.5 && !pl.dead && Math.abs(pcx - S.x) < 15 && pl.y + pl.h > S.y - 22 && pl.y < S.y) {
      const r = hurtPlayer(S.dmg, S.x, null, true); if (r !== 'none' || pl.invuln > 0) { S.hit = true; if (r === 'hit') pl.vy = Math.min(pl.vy, -170); }
    }
    if (S.t > 1.1) nc2Espinhos.splice(i, 1);
  }
  // a marca: dura 2,2 s; o escriba tem que ver o herói o tempo todo (sem linha de visão por 0,25 s, apaga)
  if (nc2Marca) {
    const M = nc2Marca; M.t += dt;
    if (pl.dead || !ncLive(M.owner)) nc2Marca = null;
    else {
      if (!nc2Ve(M.owner)) M.lost = (M.lost || 0) + dt; else M.lost = 0;
      if (M.lost > 0.25) { nc2Marca = null; sfx.ncApaga(0.6); ncSparks(pcx, pl.y - 8, 8, ['#e8dcc0', '#c4ba98'], 30, 40, 0.6, false); }
      else if (M.t >= NC2_MARCA) {
        const g = ncFloor(pcx, pl.y + pl.h - 4, 6);
        nc2Colunas.push({ x: pcx, y: g !== null ? g : pl.y + pl.h, t: 0, dmg: M.dmg, hit: false });
        nc2Marca = null; sfx.ncSentenca(1);
      }
    }
  }
  for (let i = nc2Colunas.length - 1; i >= 0; i--) {
    const C = nc2Colunas[i]; C.t += dt;
    if (C.t >= NC2_COLUNA && !C.fell) { C.fell = true; shake(4); sfx.ncColuna(Math.max(0.4, clamp(1 - Math.hypot(pl.x - C.x, pl.y - C.y) / 300, 0, 1))); ncDust(C.x, C.y, 14, 60, -40); ncSparks(C.x, C.y - 10, 10, ['#e8dcc0', '#fff4d8', '#c4ba98'], 60, 60, 0.6); }
    if (C.fell && !C.hit && C.t < NC2_COLUNA + 0.15 && !pl.dead && Math.abs(pcx - C.x) < 12 && pl.y + pl.h > C.y - 6 * T) { C.hit = true; hurtPlayer(C.dmg, C.x, null, true); }
    if (C.t > NC2_COLUNA + 0.8) nc2Colunas.splice(i, 1);
  }
  for (let i = nc2Fumacas.length - 1; i >= 0; i--) { const F = nc2Fumacas[i]; F.t += dt; if (Math.random() < dt * 30) ncSparks(F.x + rnd(-5, 5), F.y - rnd(0, 18), 1, ['#3a9a70', '#2e5e48', '#7ad8a8'], 12, -30, 0.6, false); if (F.t > F.dur) nc2Fumacas.splice(i, 1); }
  for (const [id, w] of nc2Bandos) if (w < gameTime - 30) nc2Bandos.delete(id);
}
HOOK.update.push(nc2Update);
function clearNc2Fx() { nc2Selos.length = 0; nc2Espinhos.length = 0; nc2Colunas.length = 0; nc2Fumacas.length = 0; nc2Marca = null; nc2Bandos.clear(); }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearNc2Fx(); nc2Tables(); return _nw(sd, sv); }; }
{ const _die = die; die = function () { nc2Marca = null; return _die.apply(this, arguments); }; }

{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'necromante' && e.state !== 'blink') addL(e.x + e.w / 2 + e.facing * 3, e.y - 4, e.state === 'cast' ? 0.45 : 0.28);
    else if (e.type === 'ncFatuo') addL(e.x + e.w / 2, e.y + e.h / 2, e.state === 'flare' || e.state === 'dart' ? 0.35 : 0.2);
  }
  for (const S of nc2Selos) addL(S.x, S.y - 4, 0.3);
  for (const C of nc2Colunas) addL(C.x, C.y - 30, 0.5);
}; }

HOOK.drawGlow.push((cx, cy) => {
  for (const S of nc2Selos) { const q = clamp(S.t / S.dur, 0, 1); lc.globalAlpha = 0.25 + 0.45 * q; lc.drawImage(ncGl('selo', 14, NC_COL.alma), Math.round(S.x - cx) - 14, Math.round(S.y - cy) - 16); }
  if (nc2Marca) { const q = clamp(nc2Marca.t / NC2_MARCA, 0, 1); lc.globalAlpha = 0.3 + 0.4 * q; lc.drawImage(ncGl('marca', 10, '#fff4d8'), Math.round(pl.x + pl.w / 2 - cx) - 10, Math.round(pl.y - 9 - cy) - 10); }
  for (const C of nc2Colunas) { const f = C.fell ? Math.max(0, 1 - (C.t - NC2_COLUNA) / 0.8) : C.t / NC2_COLUNA * 0.5; lc.globalAlpha = 0.5 * f; for (let k = 0; k < 6; k++) lc.drawImage(ncGl('coluna', 12, '#fff4d8'), Math.round(C.x - cx) - 12, Math.round(C.y - cy - k * 12) - 14); }
  lc.globalAlpha = 1;
});
// no mundo: os espinhos, o braço da gaveta
HOOK.drawWorld.push((cx, cy) => {
  for (const S of nc2Espinhos) {
    const up = S.t < 0.07 ? S.t / 0.07 : S.t > 0.75 ? Math.max(0, 1 - (S.t - 0.75) / 0.35) : 1;
    for (let j = 0; j < 5; j++) {
      const ox = (j - 2) * 5 + Math.sin(S.seed + j * 2.1) * 1.2, H = (9 + ((j * 7 + (S.seed | 0) * 3) % 7) + (j === 2 ? 7 : 0)) * up, lean = (j - 2) * 0.16;
      for (let y = 0; y < H; y++) {
        const t = y / Math.max(1, H), w = Math.max(0, Math.round((1 - t) * 1.6)), x = Math.round(S.x - cx + ox + lean * y), yy = Math.round(S.y - cy - y - 1);
        lc.fillStyle = '#2a241c'; lc.fillRect(x - w - 1, yy, w * 2 + 3, 1);
        lc.fillStyle = t > 0.8 ? '#f4eedc' : (y % 4 === 1 ? '#968a6e' : '#bcb092'); lc.fillRect(x - w, yy, w * 2 + 1, 1);
        if (w > 0) { lc.fillStyle = '#e2d8bc'; lc.fillRect(x - w, yy, 1, 1); }
      }
    }
  }
  for (const e of enemies) {
    if (e.dead || e.type !== 'gaveta' || !(e.armL > 0)) continue;
    const out = -e.side, x0 = Math.round((out > 0 ? e.x + e.w : e.x) - cx), y0 = Math.round(e.y + e.h / 2 - cy), L = Math.round(e.armL);
    // o braço de osso: rádio e ulna, as juntas, a mão aberta com os dedos compridos
    for (let k = 0; k < L; k++) { const x = x0 + out * k, wob = Math.round(Math.sin(k * 0.5 + e.t * 9) * 0.5); lc.fillStyle = '#2a241c'; lc.fillRect(x, y0 - 2 + wob, 1, 4); lc.fillStyle = k % 9 === 4 ? '#e2d8bc' : '#bcb092'; lc.fillRect(x, y0 - 1 + wob, 1, 1); lc.fillStyle = '#968a6e'; lc.fillRect(x, y0 + wob, 1, 1); }
    const hx = x0 + out * L;
    for (const [dx, dy] of [[1, -3], [2, -2], [3, -1], [3, 1], [2, 2], [1, 3]]) { lc.fillStyle = '#2a241c'; lc.fillRect(hx + out * dx - 1, y0 + dy - 1, 3, 3); }
    for (const [dx, dy] of [[1, -3], [2, -2], [3, -1], [3, 1], [2, 2], [1, 3]]) { lc.fillStyle = e.grab && e.state === 'pull' ? '#e2d8bc' : '#bcb092'; lc.fillRect(hx + out * dx, y0 + dy, 1, 1); }
  }
});
// por cima do escuro: o selo no chão, a marca na cabeça do herói, a coluna da sentença, a sombra da mortalha
HOOK.drawTop.push((cx, cy) => {
  for (const S of nc2Selos) {
    const x = Math.round(S.x - cx), y = Math.round(S.y - cy), q = clamp(S.t / S.dur, 0, 1), r = 7 + Math.round(q * 6), rot = S.t * 2;
    lc.globalAlpha = 0.5 + 0.5 * q;
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 + rot; lc.fillStyle = k % 4 === 0 ? '#eafff4' : '#7ad8a8'; lc.fillRect(x + Math.round(Math.cos(a) * r), y - 1 + Math.round(Math.sin(a) * r * 0.25), 1, 1); }
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 - rot * 1.5; lc.fillStyle = '#b8f0d0'; lc.fillRect(x + Math.round(Math.cos(a) * r * 0.5), y - 1 + Math.round(Math.sin(a) * r * 0.12), 1, 1); }
    if (S.lock) { lc.fillStyle = '#eafff4'; lc.fillRect(x - 1, y - 2, 3, 1); }
  }
  if (nc2Marca) {   // o selo da sentença: um círculo com o risco da pena, o anel que fecha conforme o tempo acaba
    const x = Math.round(pl.x + pl.w / 2 - cx), y = Math.round(pl.y - 9 - cy), q = clamp(nc2Marca.t / NC2_MARCA, 0, 1), n = 14;
    lc.globalAlpha = 1;
    for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + k / n * Math.PI * 2; lc.fillStyle = k / n < q ? '#fff4d8' : '#6e6656'; lc.fillRect(x + Math.round(Math.cos(a) * 4), y + Math.round(Math.sin(a) * 4), 1, 1); }
    lc.fillStyle = q > 0.7 && Math.floor(gameTime * 10) % 2 ? '#ffffff' : '#e8dcc0'; lc.fillRect(x - 1, y - 1, 1, 1); lc.fillRect(x, y, 1, 1); lc.fillRect(x + 1, y + 1, 1, 1); lc.fillRect(x - 1, y + 1, 1, 1); lc.fillRect(x + 1, y - 1, 1, 1);
  }
  for (const C of nc2Colunas) {
    const x = Math.round(C.x - cx), y = Math.round(C.y - cy), H = 6 * T;
    if (!C.fell) {   // o contorno da coluna desenhado no ar, de baixo para cima
      const k = clamp(C.t / NC2_COLUNA, 0, 1), h = Math.round(H * k);
      lc.globalAlpha = 0.85; lc.fillStyle = '#fff4d8'; lc.fillRect(x - 6, y - h, 1, h); lc.fillRect(x + 5, y - h, 1, h); lc.fillRect(x - 6, y - 1, 12, 1);
    } else {   // a coluna de luz batendo e sumindo
      const f = Math.max(0, 1 - (C.t - NC2_COLUNA) / 0.8);
      lc.globalAlpha = f; lc.fillStyle = '#e8dcc0'; lc.fillRect(x - 5, y - H, 10, H); lc.fillStyle = '#fff4d8'; lc.fillRect(x - 3, y - H, 6, H); lc.fillStyle = '#ffffff'; lc.fillRect(x - 1, y - H, 2, H);
    }
  }
  for (const e of enemies) {   // a sombra da mortalha no chão, que escurece quando ela treme
    if (e.dead || e.type !== 'ncMortalha' || (e.state !== 'flutter' && e.state !== 'drop' && e.state !== 'float')) continue;
    const g = ncFloor(e.x + e.w / 2, e.y + e.h, 12); if (g === null) continue;
    const x = Math.round(e.x + e.w / 2 - cx), y = Math.round(g - cy), q = e.state === 'flutter' ? 0.25 + 0.4 * clamp(1 - e.stateT / NC2_TREME, 0, 1) : e.state === 'drop' ? 0.6 : 0.12;
    lc.globalAlpha = q; lc.fillStyle = '#000000'; lc.fillRect(x - 7, y - 1, 14, 1); lc.fillRect(x - 5, y - 2, 10, 1);
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  ncConjura(v = 1) { tone(110, 0.9, 'sawtooth', 0.02 * v, 30); tone(165, 0.9, 'sine', 0.02 * v, 50); noise(0.8, 0.02 * v, 600, 'bandpass', 0, 2); },
  ncEspinhos(v = 1) { for (let k = 0; k < 6; k++) noise(0.05, 0.06 * v, 1700 + k * 300, 'bandpass', k * 0.025, 4); tone(140, 0.15, 'square', 0.02 * v, 70); },
  ncSome(v = 1) { noise(0.4, 0.05 * v, 900, 'bandpass', 0, 0.8); tone(300, 0.4, 'sine', 0.015 * v, -200); },
  ncAparece(v = 1) { noise(0.3, 0.04 * v, 900, 'bandpass', 0, 0.8); tone(150, 0.3, 'sine', 0.015 * v, 200); },
  ncRisca(v = 1) { noise(0.06, 0.025 * v, 3600, 'highpass'); },
  ncMarca(v = 1) { tone(660, 0.5, 'sine', 0.02 * v, -40); tone(990, 0.5, 'triangle', 0.01 * v, -60); },
  ncApaga(v = 1) { tone(500, 0.3, 'sine', 0.012 * v, -300); },
  ncSentenca(v = 1) { tone(440, 0.4, 'triangle', 0.02 * v, 220); noise(0.3, 0.02 * v, 4000, 'highpass'); },
  ncColuna(v = 1) { tone(52, 0.7, 'sine', 0.14 * v, -12); noise(0.4, 0.12 * v, 300, 'lowpass'); noise(0.2, 0.06 * v, 3000, 'bandpass', 0, 2); },
  ncTreme(v = 1) { for (let k = 0; k < 5; k++) noise(0.08, 0.03 * v, 600 + k * 50, 'bandpass', k * 0.12, 2); },
  ncCai(v = 1) { noise(0.3, 0.05 * v, 500, 'lowpass', 0, 0.8); },
  ncEnvolve(v = 1) { noise(0.4, 0.06 * v, 700, 'bandpass', 0, 1); tone(90, 0.4, 'sawtooth', 0.02 * v, -30); },
  ncAperta(v = 1) { noise(0.12, 0.03 * v, 900, 'bandpass', 0, 3); },
  ncTampa(v = 1) { noise(0.35, 0.07 * v, 400, 'lowpass', 0, 0.8); noise(0.25, 0.03 * v, 1800, 'bandpass', 0.05, 3); },
  ncBraco(v = 1) { for (let k = 0; k < 4; k++) noise(0.03, 0.05 * v, 2200 + k * 300, 'bandpass', k * 0.04, 5); },
  ncAgarra(v = 1) { noise(0.15, 0.08 * v, 1200, 'bandpass', 0, 2); tone(160, 0.2, 'square', 0.02 * v, -60); },
  ncMorde(v = 1) { noise(0.1, 0.1 * v, 900, 'bandpass', 0, 1.5); tone(80, 0.15, 'sine', 0.05 * v, -30); },
  ncAcende(v = 1) { tone(880, 0.4, 'sine', 0.012 * v, 400); noise(0.3, 0.015 * v, 3000, 'highpass'); },
  ncDispara(v = 1) { noise(0.15, 0.04 * v, 2400, 'bandpass', 0, 1); tone(600, 0.15, 'triangle', 0.012 * v, -300); }
});
Object.assign(NCB, { nc2Selos, nc2Espinhos, nc2Colunas, NC2 });
