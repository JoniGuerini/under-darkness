'use strict';

/* ================= Forma de Morcego, o segundo feitiço: os dados =================
   Funciona como o Arco Voltaico (js/63-arco-dados.js): um herói novo começa com mais um pergaminho não identificado;
   botão direito identifica, botão direito de novo aprende, e o feitiço fica na barra. Com ele na mão, o clique esquerdo
   gasta mana e o herói vira um morcego que voa livre, batendo as asas, por alguns segundos; depois volta a ser gente.
   Este arquivo só tem os dados (itens, números, ícones e o desenho do morcego) e carrega logo depois de 63-arco-dados,
   para a wiki ver também. As regras (aprender, transformar, voar, desenhar) ficam em js/66-morcego.js. */

// cost: mana · dur: segundos voando · cd: segundos depois de voltar até poder lançar de novo
// spd: velocidade máxima no ar (o herói anda a 82) · acc: aceleração · w/h: o corpo do morcego (cabe num buraco de 1 bloco)
const BAT = { cost: 10, dur: 5, cd: 1.5, spd: 125, acc: 900, w: 10, h: 10 };

Object.assign(ITEMS, {
  perg_selado_m: { name: 'Pergaminho Não Identificado', rar: 0, scroll: 1, icon: 'perg_selado_m', desc: 'Um rolo lacrado com cera escura. Cheira a pedra úmida e a asa.' },
  perg_morcego: { name: 'Pergaminho da Forma de Morcego', rar: 2, scroll: 2, icon: 'perg_morcego', desc: 'As runas tremem como asas. Lido em voz alta, ensina o feitiço e se desfaz.' },
  feitico_morcego: { name: 'Forma de Morcego', rar: 2, spell: true, icon: 'feitico_morcego', desc: 'O corpo se desfaz em fumaça e volta como um morcego, que voa para onde quiser até o feitiço passar.' }
});
const isBatItem = id => id === 'perg_selado_m' || id === 'perg_morcego' || id === 'feitico_morcego';

/* ---- ícones: o mesmo rolo do Arco, com lacre e runas da noite ---- */
const MORC_PAL = { roll: '#c9a978', sheet: '#d8c49a', ink: '#8a7458', rune: '#c84a8a', wax: '#4a2a5a', ribbon: '#2a2a3a', moon: '#e8d8a8', night: '#3a2448', bat: '#1a0e1c' };
function batPaintRows(rows, seed) {
  const c = mk(13, 13), x = c.getContext('2d');
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const m = SCROLL_MAT[rows[j][i]]; if (!m) continue;
    let v = m[1]; const g = hash2(i, j, seed);
    if (m[0] === 'sheet' || m[0] === 'roll') v += g < 0.16 ? -1 : g > 0.9 ? 1 : 0;   // fibras do papel
    x.fillStyle = heroRamp(MORC_PAL[m[0]])[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
// o feitiço: um morcego negro na frente de uma lua cheia com crateras, dentro de um aro de noite
const BAT_ICON = [
  ".............",
  ".............",
  ".............",
  ".....b.b.....",
  ".b...bbb...b.",
  ".bb.bebeb.bb.",
  ".bbbbbbbbbbb.",
  "..bbbbbbbbb..",
  "..bb..b..bb..",
  "..b...b...b..",
  ".............",
  ".............",
  "............."
];
function batPaintSpell() {
  const c = mk(13, 13), x = c.getContext('2d'), mo = heroRamp(MORC_PAL.moon), ni = heroRamp(MORC_PAL.night), bt = heroRamp(MORC_PAL.bat);
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const d = Math.hypot(i - 6, j - 6); if (d > 6.4) continue;
    const g = hash2(i, j, 83);
    let v, R;
    if (d > 5.3) { R = ni; v = j < 6 ? 4 : 2; }                                                  // aro escuro, claro em cima
    else { R = mo; v = 4 - (i + j > 13 ? 1 : 0) - (Math.hypot(i - 4, j - 8) < 1.3 || Math.hypot(i - 8.5, j - 3.5) < 1 ? 1 : 0); }   // lua com sombra e duas crateras
    if (g < 0.14) v -= 1; else if (g > 0.9) v += 1;
    x.fillStyle = R[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const ch = BAT_ICON[j][i]; if (ch === '.') continue;
    x.fillStyle = ch === 'e' ? '#ffcf5a' : bt[j < 5 ? 2 : 1]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
{
  const _makeIcon = makeIcon;
  makeIcon = function (id) {
    if (!isBatItem(id)) return _makeIcon(id);
    const src = id === 'feitico_morcego' ? batPaintSpell() : batPaintRows(id === 'perg_morcego' ? SCROLL_ID_ROWS : SCROLL_ROWS, id === 'perg_morcego' ? 37 : 35);
    const o = outlined(src); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}

/* ---- o morcego: 33 x 29 de frente, 4 batidas de asa, pintado uma vez nas rampas de 7 tons das cavernas ----
   Ossos do braço (ombro, cotovelo, pulso) e três dedos abrem a membrana; a borda de trás tem os recortes entre os dedos.
   Luz de cima à esquerda, membrana mais clara perto dos ossos, grão por pixel. Frame 0 asas no alto ... 3 asas embaixo. */
const BAT_W = 33, BAT_H = 29, BAT_CX = 16.5, BAT_CY = 15;   // BAT_CY: o centro do corpo, que fica no centro da caixa do morcego
const BAT_WING = [1.05, 0.42, -0.22, -0.7];
const BATR = {};
function batRamps() {
  if (BATR.fur) return BATR;
  const R7 = a => a.map(h => ph(h));
  BATR.fur = R7(['#0e0810', '#1a1018', '#2a1a26', '#3c2636', '#523446', '#6a4658', '#86606e']);
  BATR.mem = R7(['#0a0408', '#160810', '#26101c', '#3a1828', '#502234', '#6a3044', '#8a4458']);
  BATR.bone = R7(['#1e1218', '#342230', '#4e3646', '#6a4c5c', '#8a6874', '#ac8a92', '#ccb0b2']);
  BATR.eye = R7(['#3a1a04', '#6a3008', '#a85010', '#e08a1c', '#ffbe3a', '#ffe08a', '#fff6d0']);
  BATR.fang = R7(['#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6', '#f4ecd8']);
  return BATR;
}
function inPoly(px, py, P) {
  let ins = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function segDist(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / L, 0, 1);
  return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t);
}
function batFrame(k) {
  const R = batRamps(), P = CVB.cp(BAT_W, BAT_H), s = 6601 + k * 7, a = BAT_WING[k];
  const cx = BAT_CX, sy = BAT_CY - 2.5;
  for (const d of [-1, 1]) {
    const pt = (o, ang, len) => [o[0] + d * Math.cos(ang) * len, o[1] - Math.sin(ang) * len];
    const S = [cx + d * 2, sy], a1 = a * 0.8 + 0.25, a2 = a * 1.15;
    const E = pt(S, a1, 4.2), W = pt(E, a2, 4.4);
    const F = [pt(W, a2 + 0.22, 6.2), pt(W, a2 - 0.6, 6), pt(W, a2 - 1.4, 5.4)];
    const H = [cx + d * 1.6, BAT_CY + 3.4];
    const sag = (p, q, k2) => { const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; return [lerp(m[0], W[0], k2), lerp(m[1], W[1], k2)]; };   // a membrana entre dois dedos puxa para o pulso
    const poly = [S, E, W, F[0], sag(F[0], F[1], 0.24), F[1], sag(F[1], F[2], 0.24), F[2], [lerp(F[2][0], H[0], 0.5) - d * 0.2, lerp(F[2][1], H[1], 0.5) - 1.2], H];
    const bones = [[S, E], [E, W], [W, F[0]], [W, F[1]], [W, F[2]]];
    for (let y = 0; y < BAT_H; y++) for (let x = 0; x < BAT_W; x++) {
      const px = x + 0.5, py = y + 0.5; if (!inPoly(px, py, poly)) continue;
      let near = 9; for (const [p, q] of bones) near = Math.min(near, segDist(px, py, p, q));
      // perto do osso a pele estica e pega luz; longe dele fica fina e escura. Asa erguida: a luz de cima bate mais
      const v = 2.2 + (near < 1.2 ? 0.9 : near < 2.2 ? 0.4 : 0) + (a > 0.3 ? 0.4 : a < -0.4 ? -0.3 : 0) - d * 0.15 + (hash2(x, y, s) - 0.5) * 0.5;
      P.put(x, y, R.mem, v);
    }
    // os ossos por cima: braço grosso e claro, dedos finos
    P.line(S[0], S[1], E[0], E[1], R.bone, 3.8 - d * 0.3); P.line(E[0], E[1], W[0], W[1], R.bone, 3.6 - d * 0.3);
    for (const f of F) P.line(W[0], W[1], f[0], f[1], R.bone, (u) => 2.9 - d * 0.3 - u * 0.9);   // os dedos afinam e somem na pele
    P.put(W[0] + d * 0.4, W[1] - 1, R.fang, 4);   // a garra do polegar
  }
  // corpo peludo, cabeça e orelhas (a cabeça olha um pouco para a direita; o lado esquerdo é o mesmo desenho espelhado)
  P.blob(cx, BAT_CY + 0.4, 2.7, 3.5, R.fur, s, 3.1, (x, y) => (hash2(x, y, s + 3) < 0.22 ? 0.7 : 0));
  P.blob(cx + 0.4, BAT_CY - 4, 2.4, 2.1, R.fur, s + 1, 3.6);
  P.put(cx - 1.4, BAT_CY - 6.6, R.fur, 3.6); P.put(cx - 1.6, BAT_CY - 7.6, R.fur, 2.8);   // orelha de trás
  P.put(cx + 1.6, BAT_CY - 6.6, R.fur, 4.4); P.put(cx + 1.8, BAT_CY - 7.6, R.fur, 3.6); P.put(cx + 1.2, BAT_CY - 6.4, R.mem, 5);   // orelha da frente, com o miolo rosado
  P.put(cx - 0.7, BAT_CY - 4.2, R.eye, 4.6); P.put(cx + 1.4, BAT_CY - 4.2, R.eye, 5.4);   // olhos âmbar
  P.put(cx + 0.4, BAT_CY - 3, R.fur, 1.6); P.put(cx - 0.2, BAT_CY - 2.2, R.fang, 5); P.put(cx + 1, BAT_CY - 2.2, R.fang, 5);   // focinho e presas
  // as patas penduradas embaixo; com as asas no alto elas se encolhem
  const fy = BAT_CY + 3.8 + (a > 0.3 ? 0 : 0.8);
  P.line(cx - 1, BAT_CY + 2.8, cx - 1.4, fy, R.bone, 2.4); P.line(cx + 1, BAT_CY + 2.8, cx + 1.4, fy, R.bone, 2.6);
  P.put(cx - 1.6, fy + 0.6, R.fang, 3); P.put(cx + 1.6, fy + 0.6, R.fang, 3.4);
  return CVB.set(P.done());
}
// pintado na primeira vez que alguém precisa (CVB.cp só existe depois de 55-caverna-bichos)
let BAT_SPR = null;
const batSprites = () => BAT_SPR || (BAT_SPR = [0, 1, 2, 3].map(batFrame));
