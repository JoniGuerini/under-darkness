'use strict';

/* ================= quatro monstros novos da Catedral (a camada fica com 10) =================
   A gárgula, que fica parada como estátua até o herói passar perto, acorda, voa e mergulha nele, e leva pouco dano
   de golpe (pedra). O acólito profano, que fica longe, atira bolas de fogo roxo e levanta esqueletos das pilhas de
   ossos. O carniçal, morto-vivo de quatro patas que pula de longe e deixa o herói sangrando. A abominação, uma pilha
   de cadáveres costurados, lenta, com um gancho que pega dos dois lados e joga longe; ao morrer, dois zumbis saem
   de dentro dela.
   Arte pintada com o mesmo pincel do 55 (cp, rampas, contorno, cache). Carrega depois do 76 e antes do 49 (BAL). */

/* ---------- números ---------- */
Object.assign(ET, {
  gargula: { name: 'Gárgula', w: 14, h: 14, hp: 70, dmg: 13, xp: 22, kb: 0.3, fly: true, blood: '#8a8a84' },
  acolito: { name: 'Acólito Profano', w: 8, h: 20, hp: 50, dmg: 12, xp: 26, kb: 0.7, fly: false, blood: '#7a2a3a' },
  carnical: { name: 'Carniçal', w: 14, h: 10, hp: 55, dmg: 12, xp: 24, kb: 0.6, fly: false, blood: '#5a6a3a' },
  abominacao: { name: 'Abominação', w: 18, h: 30, hp: 260, dmg: 22, xp: 70, kb: 0.08, fly: false, blood: '#8a3a3a' }
});

/* ---------- materiais ---------- */
Object.assign(ICON_ART, {
  stoneDust: [["...ss....", "..sSSs...", ".sSWSSs..", "sSSSSSSs.", "sSSsSSSs.", ".sSSSSs..", "..ssss...", "........."], { s: '#3a3a38', S: '#8a8a84', W: '#d8d8d0' }],
  page: [[".ppppppp.", ".pPPPPPp.", ".pPvPvPp.", ".pPPPPPp.", ".pPvvvPp.", ".pPPPPPp.", ".pPPvPPp.", ".ppppppp."], { p: '#4a3a2a', P: '#c8b890', v: '#8a3ac8' }],
  claw: [["......kk.", ".....kKk.", "....kKk..", "...kKk...", "..kKk.k..", ".kKk.kKk.", "kKk.kKk..", "kk..kk..."], { k: '#2a2418', K: '#c8c0a0' }],
  hook: [["...mm....", "...mM....", "...mM....", "...mM....", ".m.mM....", "mM.mM....", "mMmMm....", ".mmm....."], { m: '#2a2a2e', M: '#8a8e96' }]
});
Object.assign(ITEMS, {
  po_gargula: { name: 'Pó de Gárgula', rar: 1, stack: 99, icon: 'stoneDust', desc: 'Pedra que ainda está morna. O Grimaldo mistura no aço. Material.' },
  pagina_profana: { name: 'Página Profana', rar: 1, stack: 99, icon: 'page', desc: 'Letras que se mexem quando ninguém olha. Material.' },
  garra_carnical: { name: 'Garra de Carniçal', rar: 0, stack: 99, icon: 'claw', desc: 'Comprida e suja. Não encoste num corte. Material.' },
  gancho: { name: 'Gancho de Açougue', rar: 2, stack: 99, icon: 'hook', desc: 'Ferro bom debaixo da ferrugem e do resto. Material.' }
});
Object.assign(DROPS, {
  gargula: [['po_gargula', 0.55, 1, 2], ['pocao', 0.08], ['elmo_ferro', 0.04], ['escudo_osso', 0.03], ['armadura_placas', 0.015]],
  acolito: [['pagina_profana', 0.5], ['pocao', 0.12], ['manto_espectral', 0.025], ['pedra_lunar', 0.015], ['amuleto', 0.02]],
  carnical: [['garra_carnical', 0.55, 1, 2], ['carne', 0.25], ['pocao', 0.08], ['cutelo', 0.04], ['botas_ferro', 0.03]],
  abominacao: [['gancho', 0.6], ['carne', 0.6, 1, 3], ['pocao', 0.25], ['machado_ferro', 0.05], ['cota', 0.04], ['armadura_placas', 0.03]]
});
Object.assign(NAV_WALKERS, { acolito: 1, carnical: 1, abominacao: 1 });
Object.assign(CV_STEP, { acolito: 1, carnical: 1, abominacao: 1 });

/* ================= arte ================= */
// um polígono cheio, sombreado de cima (claro) para baixo (escuro): asas, mantos
function udPoly(P, pts, R, v0, v1, s) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5; let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins; }
    if (ins) P.put(x, y, R, lerp(v0, v1, (py - y0) / Math.max(1, y1 - y0)) + CVART.cg(x, y, s) * 0.35);
  }
}
const CTN = {};
{
const { RB, cp, set } = CVB;
const R7 = hexes => hexes.map(h => ph(h));
const RC = {
  pedra: R7(['#141412', '#262624', '#3c3c38', '#56564f', '#727069', '#908e86', '#b2b0a6']),
  pedraE: R7(['#0a0a0a', '#161614', '#22221f', '#30302c', '#403f3a', '#52514b', '#66655e']),
  manto: R7(['#140406', '#24080c', '#3a0e14', '#54161e', '#701e28', '#8e2a34', '#ac3c44']),
  capuz: R7(['#0c0204', '#180608', '#280a0e', '#3a1016', '#4e1820', '#64222a', '#7a2e36']),
  roxo: R7(['#1a0828', '#2e1046', '#4a1a6e', '#6a2a98', '#9040c8', '#b870ec', '#e0b0ff']),
  livro: R7(['#120a04', '#22140a', '#362212', '#4c321c', '#644428', '#7e5836', '#9a6e48']),
  carne: R7(['#1e1c12', '#2e2c1c', '#444128', '#5c5836', '#767044', '#908a56', '#aea670']),
  podre: R7(['#200c0c', '#381616', '#542424', '#6e3434', '#8a4a46', '#a6645c', '#c48478']),
  verde: R7(['#121a0c', '#1e2a14', '#2e3e1e', '#405428', '#546c34', '#6c8642', '#8aa458']),
  ferro: R7(['#101012', '#1c1c20', '#2c2c32', '#404048', '#585862', '#74747e', '#94949e']),
  costura: R7(['#0a0606', '#140c0a', '#20140e', '#2e1e16', '#3e2a1e', '#503828', '#664834']),
  palido: R7(['#141812', '#242a20', '#384030', '#4e5844', '#68725a', '#848e74', '#a4ac92']),
  cadaver: R7(['#1c1618', '#2e2428', '#44363a', '#5c4a4c', '#766062', '#927a7a', '#b09898'])
};

/* a gárgula, 22 x 18 de frente para a direita: 0 pousada (sentada, asas fechadas para cima), 1 asas em cima, 2 asas embaixo, 3 mergulho */
function gargoyle(pose) {
  const P = cp(22, 18), s = 8101 + pose * 5, perch = pose === 0, dive = pose === 3;
  const wing = (pts, v0, v1) => { udPoly(P, pts, RC.pedraE, v0 + 1.6, v1 + 1.2, s + 9); for (let i = 1; i < pts.length - 1; i += 2) P.line(pts[0][0], pts[0][1], pts[i][0], pts[i][1], RC.pedra, 4.8); };   // membrana com os ossos dos dedos
  if (perch) {
    wing([[9, 8], [4, 0], [5, 4], [2, 3], [4, 8], [2, 9], [6, 12], [10, 12]], 3.2, 1.8);   // asa fechada, as pontas acima da cabeça
    P.line(7, 15, 3.4, 16, RC.pedra, 3); P.line(3.4, 16, 1.6, 13.6, RC.pedra, 3.4);   // o rabo
    P.blob(10.6, 11.6, 3.8, 4.6, RC.pedra, s, 3.8, (x, y) => hash2(x, y, s) < 0.1 ? -1.6 : 0);   // sentada, o peito para a frente
    P.line(9, 15, 8.4, 17.4, RC.pedra, 2.6); P.line(12.6, 15, 13.4, 17.4, RC.pedra, 3.4); P.line(12.4, 17.4, 15, 17.4, RC.pedra, 4); P.line(7.4, 17.4, 9.6, 17.4, RC.pedra, 3);   // patas e garras no parapeito
    P.line(13, 10, 14.4, 15.6, RC.pedra, 3.6); P.put(14.8, 16.2, RC.pedra, 4.6);   // braço apoiado
  } else {
    const by = dive ? 9.6 : 9;
    if (pose === 1) wing([[10, 7], [3, 0], [6, 3], [0, 2], [4, 6], [0, 7], [5, 9], [10, 10]], 4.4, 2.6);
    if (pose === 2) wing([[10, 7], [5, 17], [5, 13], [1, 16], [3, 11], [0, 11], [5, 8], [10, 10]], 4, 2.2);
    if (dive) wing([[11, 7], [1, 3], [4, 6], [0, 7], [4, 9], [1, 11], [10, 11]], 4.2, 2.4);
    P.line(6.6, by + 2, 2.4, by + 4.6, RC.pedra, 3); P.line(2.4, by + 4.6, 0.8, by + 2.4, RC.pedra, 3.4);   // o rabo
    P.blob(11, by + 1, dive ? 5.2 : 4.4, dive ? 2.8 : 3.4, RC.pedra, s, 3.8, (x, y) => hash2(x, y, s) < 0.1 ? -1.6 : 0);
    P.line(9, by + 3.6, 8.4, by + 7, RC.pedra, 2.6); P.line(12.4, by + 3.6, 13, by + 7, RC.pedra, 3.2);   // patas penduradas
    P.line(14, by, 17, by + 2.6, RC.pedra, 3.4); P.put(17.4, by + 3, RC.pedra, 4.6);
  }
  const hx = dive ? 17.6 : perch ? 13.6 : 15.8, hy = dive ? 9.6 : perch ? 5.6 : 5.4;
  P.blob(hx, hy, 2.6, 2.4, RC.pedra, s + 1, 4.2);   // a cabeça
  P.line(hx - 0.8, hy - 1.8, hx - 3.2, hy - 3.2, RC.pedra, 4.8); P.put(hx - 3.6, hy - 2.6, RC.pedra, 4); P.line(hx + 0.4, hy - 2, hx - 1.4, hy - 4.2, RC.pedra, 5.2); P.put(hx - 2, hy - 3.8, RC.pedra, 4.4);   // chifres curvos para trás
  P.put(hx + 2.6, hy + 0.6, RC.pedra, 4.6); P.put(hx + 2.4, hy + 1.6, RB.osso, 4.6); P.put(hx + 1.4, hy + 1.8, RB.osso, 4);   // focinho e presas
  P.put(hx + 1, hy - 0.4, RC.pedraE, 0.4);   // o olho (acende por fora)
  return set(P.done());
}
/* o acólito, 12 x 21 de frente para a direita: 0 parado, 1-2 andando, 3 conjurando (mão na frente) */
function acolyte(pose) {
  const P = cp(12, 21), s = 8201 + pose, sw = pose === 1 ? 0.6 : pose === 2 ? -0.6 : 0;
  for (let y = 8; y <= 20; y++) {   // a batina, mais larga embaixo, balançando na barra
    const t = (y - 8) / 12, hw = 2.6 + t * 2.2, cx = 6 + t * sw;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) { const k = (x + 0.5 - cx) / hw; if (Math.abs(k) > 1) continue; P.put(x, y, RC.manto, 4 - k * 1.2 - t * 0.9 + (Math.abs(k - 0.3) < 0.12 ? -1.2 : 0) + CVART.cg(x, y, s) * 0.4 - (y === 20 ? 1 : 0)); }
  }
  for (let x = 4; x <= 8; x++) P.put(x, 12, RC.livro, 3.6);   // cordão
  P.put(5, 13, RC.livro, 3); P.put(5, 14, RC.livro, 2.6);
  P.blob(6.2, 5, 3.3, 3.8, RC.capuz, s, 3.6);   // o capuz
  P.blob(7.6, 5.8, 1.7, 2.2, RC.capuz, s + 1, -1);   // o escuro dentro do capuz
  P.put(8.4, 5.2, RC.roxo, 6); P.put(7.2, 5.4, RC.roxo, 5);   // olhos
  if (pose === 3) { P.line(6.6, 9.6, 10.6, 9, RC.manto, 4.2); P.put(11, 8.6, RC.roxo, 6); P.put(11, 9.6, RC.roxo, 5); P.put(10.4, 7.8, RC.roxo, 4.6); }
  else { P.line(6.4, 9.4, 7.8, 11.6, RC.manto, 3.6); P.blob(8.8, 12, 1.7, 1.5, RC.livro, s + 2, 3.6); P.put(9, 11.6, RC.roxo, 5.6); }   // o livro com a runa que brilha
  return set(P.done());
}
/* o carniçal, 20 x 12 de frente para a direita, de quatro: 0-1 andando, 2 agachado (vai pular), 3 no pulo */
function ghoul(pose) {
  const P = cp(20, 12), s = 8301 + pose * 3, low = pose === 2 ? 1.4 : 0, leap = pose === 3, ph = pose === 1 ? 1 : -1;
  const L = RC.palido;
  if (leap) { P.line(6, 6.6, 1, 8.6, L, 2.4); P.line(5, 6.6, 0.6, 6.4, L, 2); }   // pernas esticadas para trás
  else { P.line(5.6, 6.6 + low, 3.4 + ph, 8.6, L, 2.2); P.line(3.4 + ph, 8.6, 4.4 + ph, 11.4, L, 2.2); P.line(7.4, 6.6 + low, 5.6 - ph, 9, L, 3); P.line(5.6 - ph, 9, 6.6 - ph, 11.4, L, 3); }   // pernas de trás, magras, dobradas
  P.blob(9.4, 5.6 + low, 5.2, 2.4, L, s, 3.8, (x, y, dx, dy) => (dy > 0.2 && (x % 2) ? -1.4 : 0) + (hash2(x, y, s) < 0.1 ? -1 : 0));   // as costas curvadas, as costelas marcando embaixo
  for (let x = 5; x <= 13; x += 2) P.put(x, 3.2 + low + Math.abs(x - 9.4) * 0.12, RB.osso, 5);   // a espinha
  if (leap) { P.line(13, 6, 19, 4.6, L, 3.6); P.line(13, 7, 19, 7.6, L, 3); for (const y of [4, 7]) P.line(19, y, 20, y + 0.6, RB.osso, 6); }   // braços esticados, garras na frente
  else { P.line(13, 6.4 + low, 15 - ph, 9, L, 3.6); P.line(15 - ph, 9, 15.6 - ph, 11.4, L, 3.6); P.line(12, 7 + low, 12.4 + ph, 11.4, L, 2.6); P.line(15.6 - ph, 11.4, 17 - ph, 11.4, RB.osso, 5.6); }   // braços compridos, garras no chão
  const hx = leap ? 16.2 : 16, hy = (leap ? 4.6 : 5.6) + low * 0.7;
  P.blob(hx, hy, 2.4, 1.8, L, s + 1, 4.2);   // a cabeça, baixa e pontuda
  P.line(hx - 1.6, hy - 1.2, hx - 2.6, hy - 3, L, 3.4);   // orelha
  P.line(hx + 1.6, hy + 0.4, hx + 3.2, hy + 1, L, 3.6);   // o focinho
  P.line(hx + 0.4, hy + 1.4, hx + 3, hy + 1.8, RC.podre, 0.8); P.put(hx + 1.4, hy + 1.2, RB.osso, 6); P.put(hx + 2.4, hy + 1.4, RB.osso, 5.4);   // a boca rasgada e os dentes
  P.put(hx + 0.8, hy - 0.6, RB.olho, 5.8);
  return set(P.done());
}
/* a abominação, 28 x 34 de frente para a direita: 0-1 andando, 2 gancho erguido, 3 pancada */
function abomination(pose) {
  const P = cp(28, 34), s = 8401 + pose * 3, ph = pose === 1 ? 1 : 0, C = RC.cadaver;
  P.line(7, 13, 4, 21, C, 3); P.blob(3.6, 21.8, 1.5, 1.3, C, s + 9, 2.6);   // o braço miúdo do outro lado
  P.line(11, 26, 10 - ph, 32.4, C, 3); P.line(12.4, 26, 11.4 - ph, 32.4, C, 2.6); P.line(17, 26, 18 + ph, 32.4, C, 3.6); P.line(18.4, 26, 19.4 + ph, 32.4, C, 3.2);   // pernas grossas
  P.blob(10.4 - ph, 33, 2.2, 0.9, RC.costura, s + 7, 3); P.blob(18.8 + ph, 33, 2.2, 0.9, RC.costura, s + 8, 3);   // pés
  P.blob(14, 20.6, 9.4, 7.6, C, s, 3.4, (x, y, dx, dy) => (hash2(x >> 1, y >> 1, s) < 0.16 ? -0.9 : 0) + (dy > 0.5 ? -0.8 : 0));   // a pança
  P.blob(14.8, 12.4, 8.4, 5.6, C, s + 4, 3.8, (x, y) => hash2(x >> 1, y >> 1, s + 4) < 0.16 ? -0.9 : 0);   // os ombros, curvados para a frente
  P.blob(9.4, 21, 3.6, 3.2, RC.verde, s + 1, 3.1);   // um retalho de outro morto
  P.blob(19.4, 11, 3, 2.6, RC.podre, s + 2, 3.4);   // e outro
  for (const [a, b, c, d] of [[6, 14, 13, 12.6], [8.6, 25, 19, 25.4], [15.6, 9, 20, 17], [6.6, 18.4, 12.6, 21.6]]) { P.line(a, b, c, d, RC.costura, 1); const n = Math.hypot(c - a, d - b) / 2; for (let i = 1; i < n; i++) { const x = a + (c - a) * i / n, y = b + (d - b) * i / n; P.put(x, y - 1, RC.costura, 2.2); P.put(x, y + 1, RC.costura, 2.2); } }   // costuras
  P.line(21.6, 21, 24, 19, RB.osso, 5.6); P.line(8, 9.4, 6, 7.4, RB.osso, 5);   // ossos saindo
  P.blob(18.2, 9, 2.8, 2.6, C, s + 3, 4.2);   // a cabeça, afundada entre os ombros, para a frente
  P.put(19.6, 8.4, RB.olho, 5.4); P.line(16.8, 7.6, 18, 9.2, RC.costura, 1.2);   // um olho e um costurado
  P.line(17.4, 10.6, 20.4, 10.4, RC.costura, 0.8); P.put(19, 10.8, RB.osso, 5);   // a boca
  let hx, hy;
  if (pose === 2) { P.line(21, 11, 23.6, 3.4, C, 4.4); P.line(21.6, 11.4, 24.2, 4, C, 3.6); hx = 24.4; hy = 1.6; }   // o braço com o gancho, erguido
  else if (pose === 3) { P.line(21, 12, 25.6, 21, C, 4.4); P.line(21.6, 12.6, 26, 21.4, C, 3.6); hx = 26.2; hy = 23; }
  else { P.line(21.6, 12, 23.6, 20.6 + ph * 0.6, C, 4.2); P.line(22.4, 12.4, 24.2, 20.8, C, 3.4); hx = 24.2; hy = 22.6 + ph * 0.6; }
  P.blob(hx - 0.2, hy - 1.4, 1.4, 1.2, C, s + 5, 3.6);   // a mão
  P.line(hx, hy - 1, hx, hy + 2.4, RC.ferro, 5.2); P.line(hx, hy + 2.4, hx - 1.6, hy + 3.6, RC.ferro, 4.8); P.put(hx - 2.2, hy + 2.6, RC.ferro, 5.6);   // o gancho
  return set(P.done());
}
CTN.get = () => CTN.ready || (CTN.ready = {
  garg: [0, 1, 2, 3].map(gargoyle),
  aco: [0, 1, 2, 3].map(acolyte),
  carn: [0, 1, 2, 3].map(ghoul),
  abom: [0, 1, 2, 3].map(abomination)
});
Object.assign(CTN, { RC });
}

/* ================= desenho ================= */
DRAW_E.gargula = (e, fx, fy, fl) => {
  const B = CTN.get().garg, k = e.state === 'perch' || e.state === 'wake' ? 0 : e.state === 'dive' ? 3 : 1 + (Math.floor(e.t * 7) % 2);
  const j = e.state === 'wake' ? Math.round(Math.sin(e.t * 45) * 0.7) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 12 + j, fy - 19);
};
DRAW_E.acolito = (e, fx, fy, fl) => {
  const B = CTN.get().aco, k = e.state === 'cast' || e.state === 'summon' ? 3 : Math.abs(e.vx) > 6 && e.onGround ? 1 + (Math.floor(e.t * 7) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 7, fy - 22 + (k === 0 ? Math.round(Math.sin(e.t * 2) * 0.4) : 0));
};
DRAW_E.carnical = (e, fx, fy, fl) => {
  const B = CTN.get().carn, k = e.state === 'crouch' ? 2 : e.state === 'leap' || !e.onGround ? 3 : Math.abs(e.vx) > 8 ? Math.floor(e.t * 12) % 2 : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 11, fy - 13);
};
DRAW_E.abominacao = (e, fx, fy, fl) => {
  const B = CTN.get().abom, k = e.state === 'wind' ? 2 : e.state === 'smash' || e.state === 'recover' ? 3 : Math.abs(e.vx) > 3 ? Math.floor(e.t * 3) % 2 : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 15, fy - 35 + (k < 2 ? Math.round(Math.abs(Math.sin(e.t * 3))) : 0));
};
const CTN_GLOW = { roxo: glow(9, '#b060ff'), bolt: glow(12, '#a040ff') };
EYES_E.gargula = (e, fx, fy) => { if (e.state === 'perch') return; lc.globalAlpha = e.state === 'wake' ? 0.5 + Math.sin(e.t * 30) * 0.3 : 0.8; const hx = e.state === 'dive' ? 7 : 5; lc.drawImage(SPR.glow.eye, fx + e.facing * hx - 6, fy - (e.state === 'dive' ? 15 : e.state === 'wake' ? 19 : 19)); };
EYES_E.acolito = (e, fx, fy) => { lc.globalAlpha = 0.6; lc.drawImage(CTN_GLOW.roxo, fx + e.facing * 2 - 9, fy - 26); };
EYES_E.carnical = (e, fx, fy) => { lc.globalAlpha = 0.45; lc.drawImage(SPR.glow.eye, fx + e.facing * 6 - 6, fy - 13); };
EYES_E.abominacao = (e, fx, fy) => { lc.globalAlpha = 0.4; lc.drawImage(SPR.glow.eye, fx + e.facing * 4 - 6, fy - 36); };
WARN_E.gargula = e => e.state === 'wake';
WARN_E.acolito = e => e.state === 'cast' || e.state === 'summon';
WARN_E.carnical = e => e.state === 'crouch';
WARN_E.abominacao = e => e.state === 'wind';

/* ================= comportamento ================= */
function ctWander(e, dt) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.45 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }

// a gárgula: estátua até o herói chegar perto; voa por cima dele e mergulha; sem ninguém por perto, pousa de novo
AI.gargula = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'perch') { e.vx = 0; e.vy = e.onGround ? 0 : 90; if (!pl.dead && (dist < 44 || dist < 90 && e.sees)) { e.state = 'wake'; e.stateT = 0.55; e.facing = Math.sign(dx) || e.facing; sfx.ggWake(); } return; }
  if (e.state === 'wake') { e.vx = 0; e.vy = 0; if (Math.random() < dt * 30) burst(ecx + rnd(-6, 6), e.y + rnd(0, e.h), 1, '#8a8a84', 40, 300, 0.4); if (e.stateT <= 0) { e.state = 'fly'; e.stateT = 0.9 + Math.random() * 0.6; e.vy = -110; } return; }
  if (e.state === 'dive') {
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.swingHit || e.hitWall || e.hitCeil || e.onGround || e.stateT <= 0) { e.state = 'fly'; e.stateT = 1.3 + Math.random() * 0.8; e.vy = -130; e.vx *= -0.4; if (e.onGround) burst(ecx, e.y + e.h, 6, '#6a6a64', 60, 300, 0.4); }
    return;
  }
  if (e.state === 'settle') { e.vx = approach(e.vx, 0, 200 * dt); e.vy = 100; if (aggro && dist < 90) { e.state = 'fly'; e.stateT = 0.6; } else if (e.onGround) { e.state = 'perch'; e.vy = 0; } return; }
  // voando: fica por cima e para trás do herói, batendo as asas
  const hx = pl.x + pl.w / 2 + (ecx < pl.x + pl.w / 2 ? -42 : 42), hy = pl.y - 44;
  e.vx = approach(e.vx, clamp((hx - ecx) * 2.6, -120, 120), 420 * dt); e.vy = approach(e.vy, clamp((hy - e.y) * 2.6, -110, 110) + Math.sin(e.t * 7) * 20, 420 * dt);
  e.facing = Math.sign(dx) || e.facing;
  if (!aggro) { e.calmT = (e.calmT || 0) + dt; if (e.calmT > 3) { e.state = 'settle'; e.calmT = 0; } return; }
  e.calmT = 0;
  if (e.stateT <= 0 && e.atkCD <= 0 && dist < 150 && losClear(ecx, e.y + e.h / 2, pl.x + pl.w / 2, pl.y + pl.h / 2)) {
    e.state = 'dive'; e.stateT = 0.85; e.swingHit = false; const d = Math.max(1, dist); e.vx = dx / d * 240; e.vy = dy / d * 240; e.atkCD = 0.6; sfx.ggDive();
  }
};
// o acólito: fica longe, atira fogo roxo e levanta esqueletos (no máximo 2 vivos por acólito)
const acBolts = [];
AI.acolito = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.sumCD = (e.sumCD === undefined ? 3 : e.sumCD) - dt;
  if (e.state === 'cast') { e.vx = approach(e.vx, 0, 800 * dt); e.facing = Math.sign(dx) || e.facing; if (Math.random() < dt * 25) burst(e.x + e.w / 2 + e.facing * 6, e.y + 8, 1, '#b870ec', 30, -30, 0.4, 1, true); if (e.stateT <= 0) { acShoot(e); e.state = 'recover'; e.stateT = 0.4; e.atkCD = 1.8 + Math.random(); } return; }
  if (e.state === 'summon') { e.vx = 0; if (Math.random() < dt * 30) burst(e.x + e.w / 2, e.y + 4, 1, '#9040c8', 40, -40, 0.6, 1, true); if (e.stateT <= 0) { acRaise(e); e.state = 'recover'; e.stateT = 0.5; e.sumCD = 7 + Math.random() * 3; } return; }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  if (!aggro) ctWander(e, dt);
  const adx = Math.abs(dx), dir = aggro ? (adx > 170 ? Math.sign(dx) : adx < 80 ? -Math.sign(dx) || 1 : 0) : e.wander;
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  walk(e, dt, dir, 34 + e.lvl, 500, 250, dy, aggro && dir === Math.sign(dx));
  if (!aggro || !e.onGround) return;
  const mine = enemies.filter(m => m.acoBy === e && !m.dead).length;
  if (e.sumCD <= 0 && mine < 2 && dist < 200) { e.state = 'summon'; e.stateT = 1; sfx.acChant(); }
  else if (e.atkCD <= 0 && dist < 200 && losClear(e.x + e.w / 2, e.y + 6, pl.x + pl.w / 2, pl.y + 8)) { e.state = 'cast'; e.stateT = 0.65; sfx.acCharge(); }
};
function acShoot(e) {
  const ox = e.x + e.w / 2 + e.facing * 6, oy = e.y + 8, a = Math.atan2(pl.y + pl.h / 2 - oy, pl.x + pl.w / 2 - ox);
  acBolts.push({ x: ox, y: oy, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, dmg: e.dmg, life: 2.6 }); sfx.acBolt();
}
function acRaise(e) {   // um esqueleto se levanta de uma pilha de ossos no chão, perto do herói
  for (let a = 0; a < 24; a++) {
    const tx = Math.floor((pl.x + pl.w / 2) / T) + ((Math.random() * 13) | 0) - 6, ptx = Math.floor((pl.x + pl.w / 2) / T); if (Math.abs(tx - ptx) < 2) continue;
    let ty = Math.floor((pl.y + pl.h - 1) / T) - 3; for (let k = 0; k < 8 && !solidAt(tx, ty + 1); k++) ty++;
    if (!solidAt(tx, ty + 1) || solidAt(tx, ty) || solidAt(tx, ty - 1)) continue;
    const px = tx * T + 2, py = (ty + 1) * T - ET.skeleton.h;
    if (rectSolid(px, py, ET.skeleton.w, ET.skeleton.h)) continue;
    const m = spawnEnemy('skeleton', px, py, zoneAt(tx, ty));
    m.acoBy = e; m.reiMinion = m.reiMinion || false; m.xp = Math.max(1, Math.round(m.xp * 0.4)); m.gold = 0; m.state = 'rise'; m.stateT = typeof UV_RISE === 'number' ? UV_RISE : 0.9; m.facing = Math.sign(pl.x - px) || 1; m.memT = 6;
    burst(px + 4, (ty + 1) * T - 3, 14, '#9040c8', 50, -40, 0.7, 1, true);
    return;
  }
}
// o carniçal: corre de quatro, se agacha e pula de longe; a mordida faz sangrar
let cnBleedT = 0, cnBleedDmg = 1, cnTick = 0;
AI.carnical = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'crouch') { e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { e.state = 'leap'; e.stateT = 0.9; e.swingHit = false; e.vy = -230; e.vx = e.facing * clamp(Math.abs(dx) * 2.2, 110, 230); sfx.cnHiss(); } return; }
  if (e.state === 'leap' || e.state === 'bite') {
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') cnBleed(Math.max(1, Math.round(e.dmg * 0.25))); }
    if ((e.onGround && e.stateT < (e.state === 'leap' ? 0.75 : 0.3)) || e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.45; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 800 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.9 + Math.random() * 0.6; } return; }
  if (!aggro) ctWander(e, dt);
  let dir = aggro ? (Math.sign(dx) || 1) : e.wander;
  if (aggro && Math.abs(dx) < 8) dir = 0;
  if (dir) e.facing = dir; walk(e, dt, dir, 70 + e.lvl * 3, 900, 270, dy, aggro);
  if (!aggro || e.atkCD > 0 || !e.onGround) return;
  const adx = Math.abs(dx);
  if (adx > 44 && adx < 120 && Math.abs(dy) < 30 && clearPath(e, pl)) { e.state = 'crouch'; e.stateT = 0.35; }
  else if (adx < 22 && Math.abs(dy) < 14) { e.state = 'bite'; e.stateT = 0.4; e.swingHit = false; e.vy = -90; e.vx = e.facing * 90; }
};
function cnBleed(d) { if (cnBleedT <= 0) floatText(pl.x + pl.w / 2, pl.y - 8, 'SANGRANDO', '#e04040', 0.8); cnBleedT = 3; cnBleedDmg = Math.max(cnBleedDmg, d); }
// a abominação: lenta; ergue o gancho e bate com tudo, pegando dos dois lados e jogando longe
AI.abominacao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'smash'; e.stateT = 0.3; abSmash(e); } return; }
  if (e.state === 'smash') { e.vx = 0; if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.9; } return; }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.8; } return; }
  if (!aggro) ctWander(e, dt);
  let dir = aggro ? (Math.sign(dx) || 1) : e.wander;
  if (aggro && Math.abs(dx) < 16) dir = 0;
  if (dir) e.facing = dir; walk(e, dt, dir, 18 + e.lvl, 300, 250, dy, aggro);
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 38 && Math.abs(dy) < 30) { e.state = 'wind'; e.stateT = 0.8; e.facing = Math.sign(dx) || e.facing; sfx.abGroan(); }
};
function abSmash(e) {
  const ecx = e.x + e.w / 2, hb = { x: ecx - 36, y: e.y + 6, w: 72, h: e.h - 4 };
  if (!pl.dead && overlap(hb, pl)) { const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { pl.vx = (Math.sign(pl.x + pl.w / 2 - ecx) || e.facing) * 320; pl.vy = -210; } }
  shake(5); sfx.abSmash(); burst(ecx + e.facing * 16, e.y + e.h - 2, 16, '#6a5a4a', 110, 360, 0.5); burst(ecx - e.facing * 16, e.y + e.h - 2, 10, '#6a5a4a', 90, 360, 0.5);
}
// ao morrer, a abominação se abre e dois zumbis saem de dentro
{ const _k = killEnemy; killEnemy = function (e) {
  const was = e && !e.dead && e.type === 'abominacao';
  const r = _k.apply(this, arguments);
  if (was && !e.despawn) {
    for (const d of [-1, 1]) { const px = e.x + e.w / 2 + d * 8 - ET.zombie.w / 2, py = e.y + e.h - ET.zombie.h - 0.5; if (rectSolid(px, py, ET.zombie.w, ET.zombie.h)) continue; const z = spawnEnemy('zombie', px, py, zoneAt(Math.floor(px / T), Math.floor(py / T))); z.vx = d * 80; z.vy = -120; z.facing = d; z.memT = 6; z.xp = Math.max(1, Math.round(z.xp * 0.5)); }
    burst(e.x + e.w / 2, e.y + e.h / 2, 30, '#8a3a3a', 120, 380, 0.7); shake(4);
  }
  return r;
}; }

/* ---------- golpes no herói, projéteis e o sangramento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'gargula') { mult *= e.state === 'perch' ? 0.35 : 0.65; if (e.state === 'perch') { e.state = 'wake'; e.stateT = 0.3; } }
  return _hit(e, dir, mult, melee);
}; }
function ctnUpdate(dt) {
  for (let i = acBolts.length - 1; i >= 0; i--) {
    const b = acBolts[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (Math.random() < dt * 30) parts.push({ x: b.x + rnd(-1, 1), y: b.y + rnd(-1, 1), vx: rnd(-10, 10), vy: rnd(-20, 0), g: -20, life: 0.35, max: 0.35, col: Math.random() < 0.5 ? '#b870ec' : '#e0b0ff', size: 1, glow: true });
    let gone = b.life <= 0;
    if (!gone && !pl.dead && b.x > pl.x - 2 && b.x < pl.x + pl.w + 2 && b.y > pl.y - 2 && b.y < pl.y + pl.h + 2) { const r = hurtPlayer(b.dmg, b.x - Math.sign(b.vx) * 4, null, true); if (r !== 'none' || pl.invuln > 0) gone = true; }
    if (!gone && solidAt(Math.floor(b.x / T), Math.floor(b.y / T))) gone = true;
    if (gone) { acBolts.splice(i, 1); burst(b.x, b.y, 10, '#b870ec', 70, 0, 0.4, 1, true); }
  }
  if (cnBleedT > 0 && !pl.dead) {
    cnBleedT -= dt; cnTick -= dt;
    if (cnTick <= 0) {
      cnTick = 0.6;
      if (!(typeof modoDeus !== 'undefined' && modoDeus)) {
        pl.hp -= cnBleedDmg; pl.hurtFlash = 0.08; pl.lastHurt = gameTime; pl.regen = 0;
        floatText(pl.x + pl.w / 2, pl.y - 6, '-' + cnBleedDmg, '#e04040', 0.9); burst(pl.x + pl.w / 2, pl.y + 10, 3, '#c8323c', 40, 400, 0.4);
        if (pl.hp <= 0) { pl.hp = 0; die(); }
      }
    }
    if (cnBleedT <= 0) cnBleedDmg = 1;
  } else cnTick = 0;
}
HOOK.update.push(ctnUpdate);
HOOK.drawTop.push((cx, cy) => {
  for (const b of acBolts) { const x = Math.round(b.x) - cx, y = Math.round(b.y) - cy; lc.fillStyle = '#4a1a6e'; lc.fillRect(x - 2, y - 2, 4, 4); lc.fillStyle = '#b870ec'; lc.fillRect(x - 1, y - 2, 2, 4); lc.fillRect(x - 2, y - 1, 4, 2); lc.fillStyle = '#f0d8ff'; lc.fillRect(x - 1, y - 1, 1, 1); }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const b of acBolts) { lc.globalAlpha = 0.8; lc.drawImage(CTN_GLOW.bolt, b.x - cx - 12, b.y - cy - 12); }
  lc.globalAlpha = 1;
});
function clearCtnFx() { acBolts.length = 0; cnBleedT = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearCtnFx(); return _nw(sd, sv); }; }
{ const _d = die; die = function () { cnBleedT = 0; return _d.apply(this, arguments); }; }
// a gárgula nasce pousada, parecendo estátua
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type === 'gargula') { e.state = 'perch'; e.vy = 60; }
  return e;
}; }

/* ---------- sons ---------- */
Object.assign(sfx, {
  ggWake() { noise(0.5, 0.08, 400, 'lowpass'); tone(90, 0.4, 'sawtooth', 0.03, 40); },
  ggDive() { noise(0.35, 0.06, 1600, 'bandpass', 0, 2); tone(500, 0.3, 'triangle', 0.03, -300); },
  acCharge() { tone(320, 0.5, 'sine', 0.03, 260); },
  acChant() { tone(110, 0.9, 'sawtooth', 0.025, -10); tone(165, 0.9, 'sine', 0.02, -15, 0.05); },
  acBolt() { noise(0.25, 0.05, 2400, 'bandpass', 0, 3); tone(700, 0.2, 'sine', 0.03, -400); },
  cnHiss() { noise(0.25, 0.07, 3000, 'highpass'); tone(240, 0.12, 'sawtooth', 0.02, 120); },
  abGroan() { tone(70, 0.7, 'sawtooth', 0.05, -20); noise(0.6, 0.04, 300, 'lowpass'); },
  abSmash() { noise(0.4, 0.2, 200, 'lowpass'); tone(55, 0.4, 'sine', 0.1, -20); }
});

/* ---------- onde nascem: cada faixa da Catedral fica com 4 a 6 ---------- */
Object.assign(CATH_SPAWN, {
  5: [[['zombie', 0.45], ['skeleton', 0.3], ['archer', 0.12], ['gargula', 0.22]], 6],
  6: [[['zombie', 0.25], ['vomit', 0.12], ['skeleton', 0.23], ['archer', 0.18], ['gargula', 0.14], ['acolito', 0.12]], 8],
  7: [[['vomit', 0.12], ['skeleton', 0.2], ['guard', 0.2], ['ghost', 0.16], ['acolito', 0.14], ['carnical', 0.18]], 9],
  8: [[['zombie', 0.13], ['skeleton', 0.18], ['guard', 0.2], ['ghost', 0.22], ['carnical', 0.17], ['abominacao', 0.1]], 10]
});

/* ---------- o vilarejo ---------- */
Object.assign(MAT_VAL, { po_gargula: 9, pagina_profana: 12, garra_carnical: 6, gancho: 18 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'pagina_profana'; c.hint = c.hint.replace(/\.$/, '') + ', páginas profanas.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['po_gargula', 'garra_carnical', 'gancho'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', pó de gárgula, garras e ganchos.'; }
BOUNTIES.push(
  [3, 'po_gargula', 5, 'Pó de gárgula. O Grimaldo diz que aço temperado com ele não enferruja nunca.', 'Aço de pedra'],
  [3, 'pagina_profana', 3, 'Páginas profanas. O Caetano quer queimar todas, uma por uma, rezando.', 'Fogueira de páginas']
);
