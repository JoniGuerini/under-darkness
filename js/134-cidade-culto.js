'use strict';

/* ================= the cult of the Well (A Cidade Afundada) =================
   The four cultists of the Grande Poço (docs/camadas/06-cidade-afundada.md, sections 6 and 13). Living people: they
   call humanStep (133) first whenever they are not in the middle of a blow, so they flee, drink, answer alarms and
   use ladders like the others. None of them moves like another:
   - the novices walk in a procession of 4 to 6, each with a candle, the line following the first one slowly and
     singing one note; they raise the candles and the song rises (0.6 s), then all run at once and strike with the
     candlesticks. Kill the one in front and the procession breaks: the others run away;
   - the preacher keeps far back, behind the other humans, walking backwards; he points at the hero and a dark ring
     closes round him (1 s): marked for 6 s (cdMarcar, 130). Alone, he lobs a flask of Well water (an arc you can
     see) that leaves a dark puddle that slows (fungLentidao, 120);
   - the penitent is a huge man dragging a well stone chained to his back; slow, no ladders. The chain creaks while he
     starts it turning (1 s), then the stone sweeps round him for 3 s, wider and wider, and he is dizzy for 1.5 s.
     He also lifts it and drops it: plank floor and roof tiles under him break and he goes through;
   - the mason doesn't chase: he runs to the narrowest passage (up to 3 tall) on his side of the hero, plants himself
     beyond it and walls it up with fresh mortar, one row at a time, the row's outline showing for a second first.
     Up close he lifts a brick over his head (0.6 s) and lobs it.
   The Parede Fresca (CD_PAREDE_FRESCA, 314; texture from 131): one pickaxe strike or two weapon blows, no drop,
   crumbles by itself 30 s after it was laid, and never reaches the save (it is written straight into `tiles`,
   never into `diffs`, and makeSave filters it as well).
   Same brush as 123/124 (cp, ramps, outline, cache). Loads after 133 and before 49 (BAL); 136 sets the level and the
   spawn tables (a procession counts once: its followers carry e.cdFollower). */

/* ---------- stats (life and damage are level-1 bases: BAL and 136's level do the rest) ---------- */
Object.assign(ET, {
  novicos: { name: 'Noviços do Poço', w: 8, h: 21, hp: 14, dmg: 6, xp: 5, kb: 1.0, fly: false, human: true, blood: '#7a2620' },
  pregador: { name: 'Pregador do Poço', w: 8, h: 21, hp: 70, dmg: 14, xp: 22, kb: 0.6, fly: false, human: true, blood: '#7a2620' },
  penitente: { name: 'Penitente', w: 16, h: 32, hp: 290, dmg: 30, xp: 40, kb: 0.1, fly: false, human: true, noFlee: true, noLadder: true, blood: '#7a2620' },
  emparedador: { name: 'Emparedador', w: 8, h: 21, hp: 90, dmg: 15, xp: 24, kb: 0.5, fly: false, human: true, blood: '#7a2620' }
});
const CDC_TYPES = ['novicos', 'pregador', 'penitente', 'emparedador'];

/* ---------- drops (138's materials; the three bases of the layer are rare: the core takes gear chances x0.1) ---------- */
const CDC_BASES = [['facao_saqueador', 0.034], ['capuz_poco', 0.034], ['couraca_guarda', 0.034]];
const CDC_DROPS = {
  novicos: [['cera_poco', 0.4], ['pocao', 0.08], ['min_prata', 0.05], ...CDC_BASES],
  pregador: [['cera_poco', 0.5, 1, 2], ['pocao', 0.08], ['min_prata', 0.08], ...CDC_BASES],
  penitente: [['perola_negra', 0.3], ['pocao', 0.08], ['min_prata', 0.12, 1, 2], ['facao_saqueador', 0.1], ['capuz_poco', 0.1], ['couraca_guarda', 0.1]],
  emparedador: [['cera_poco', 0.45], ['pocao', 0.08], ['min_prata', 0.1], ...CDC_BASES]
};
for (const k of CDC_TYPES) DROPS[k] = CDC_DROPS[k].filter(([id]) => ITEMS[id]);
Object.assign(NAV_WALKERS, { novicos: 1, pregador: 1, penitente: 1, emparedador: 1 });
Object.assign(CV_STEP, { novicos: 1, pregador: 1, penitente: 1, emparedador: 1 });

/* ---------- the Parede Fresca: 131 paints it; the rules are here ---------- */
SOLID[CD_PAREDE_FRESCA] = 1; BLOCKY[CD_PAREDE_FRESCA] = 1;
DIG[CD_PAREDE_FRESCA] = MINE_P;          // one pickaxe strike
delete BLOCK_DROP[CD_PAREDE_FRESCA];     // drops nothing
if (!PCOL[CD_PAREDE_FRESCA]) PCOL[CD_PAREDE_FRESCA] = '#925a4c';
if (!MAT[CD_PAREDE_FRESCA]) {            // only if 131 left it out: fresh city brick, wet grey mortar oozing from the joints
  pal('cdcFresca', ['#24120e', '#3c1e16', '#58302a', '#74443a', '#925a4c', '#b07a68']);
  const { cg } = CVART, w = v => ((v % TP) + TP) % TP;
  MAT[CD_PAREDE_FRESCA] = [PALS.cdcFresca, bake((x, y) => {
    const row = Math.floor(w(y) / 6), ly = w(y) % 6, lx = w(x + (row % 2 ? 6 : 0)) % 12, bk = Math.floor(w(x + (row % 2 ? 6 : 0)) / 12);
    if (ly === 5 || lx === 11) return 2.2 + cg(x, y, 13401) * 0.6 + (hash2(x, y, 13402) < 0.3 ? 1 : 0);   // mortar, still wet
    if (ly === 4 && hash2(x, row, 13403) < 0.25) return 2.4;                                                // a drip of mortar
    return 3 + (hash2(bk, row, 13404) - 0.5) * 1.2 + (ly === 0 ? 0.9 : ly === 3 ? -0.5 : 0) + (lx === 0 ? 0.5 : 0) + cg(x, y, 13405) * 0.5;
  })];
}

/* ================= art ================= */
const CDC = {};
{
const { cp, set } = CVB;
const cg = CVART.cg;
const R7 = hexes => hexes.map(h => ph(h));
const RC = {
  cera: R7(['#16110c', '#2a2218', '#433828', '#5e503a', '#7c6c50', '#9c8a68', '#b8a682']),       // dirty wax: the hoods
  ceraN: R7(['#100d0a', '#1e1813', '#2e261d', '#403528', '#544636', '#6a5a45', '#7e6d55']),      // the novices' robes, a shade down
  burel: R7(['#0c0a09', '#171311', '#231d19', '#302822', '#3e342c', '#4e4237', '#5e5044']),      // dark wool
  pele: R7(['#1a1210', '#2e211c', '#463328', '#5e4636', '#785c48', '#92745c', '#a88a70']),       // skin that hasn't seen day
  boca: R7(['#080404', '#120808', '#1c0c0c', '#281212', '#341818', '#422020', '#502a28']),
  ferro: R7(['#100c06', '#20180c', '#342814', '#4c3c1e', '#68542a', '#86703a', '#a48c52']),      // tarnished brass candlesticks
  vela: R7(['#3a2e22', '#52442f', '#6a5a44', '#8a7a5c', '#a89470', '#c0ae88', '#d8c8a0']),
  couro: R7(['#0e0806', '#1a100a', '#2a1a10', '#3c2618', '#503422', '#66442e', '#7c563a']),
  tijolo: R7(['#24120e', '#3c1e16', '#58302a', '#74443a', '#925a4c', '#b07a68', '#c08a78']),
  arg: R7(['#1c1a18', '#2e2b28', '#45413c', '#5e5952', '#7a746b', '#968f84', '#aea79a']),       // mortar
  madeira: R7(['#0e0a06', '#1a130c', '#2a1f14', '#3a2c1c', '#4c3a26', '#5e4932', '#70583e']),
  pedra: R7(['#050608', '#0a0c10', '#101318', '#171b22', '#20252e', '#2c323c', '#3a414c']),     // the Well's stone
  corr: R7(['#0e0f12', '#1c1e22', '#2c2f34', '#3e4248', '#555a62', '#6e747c', '#8a9098']),      // chain iron
  vidro: R7(['#06080a', '#0c1014', '#141a1e', '#1e262a', '#2c363a', '#3e4a4e', '#56646a']),
  aco: R7(['#16181c', '#2a2e34', '#454a52', '#646a74', '#868c96', '#a6acb4', '#c2c8ce'])
};
// a thick limb along a polyline: a dark rim one pixel wider, then the limb lit from the top left (as 106, 123)
function limb(P, pts, r, R, base, s, rimV = 0.5) {
  const each = fn => { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 2)); for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n); } };
  each((cx, cy) => { const rr = r + 0.8; for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rr) P.put(x, y, R, rimV); });
  each((cx, cy) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r; if (dx * dx + dy * dy > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 + cg(x, y, s) * 0.5 + (hash2(x, y, s) < 0.08 ? -0.9 : 0)); } });
}
const hand = (P, [x, y], s, v = 3.4) => P.blob(x, y, 0.95, 0.95, RC.pele, s, v);

/* a cultist, 20 x 30 facing right: the hero's 12 x 22 frame at x 4, y 8 (shoulders x 8.6 / 11.6, row 18; feet on row
   29). o: robe and hood ramps, step (-1..1), lean, far and near arm polylines, open mouth, hem row, and two painters
   for what is carried (back: before the body; front: after the near arm) */
function cultist(o, s) {
  const P = cp(20, 30), lean = o.lean || 0, st = o.st || 0, hem = o.hem || 27.6;
  if (o.back) o.back(P);
  limb(P, o.far, 0.75, o.robe, 1.1, s + 1); hand(P, o.far[o.far.length - 1], s + 2, 2.2);
  // legs: wrapped shins and worn shoes under the hem, the far one in shadow
  limb(P, [[9.4 + lean * 0.4, 24], [9 - st * 1.6 + lean * 0.3, 27], [8.8 - st * 2.4 + lean * 0.3, 28.4]], 0.7, RC.burel, 1.4, s + 3);
  P.blob(9 - st * 2.4 + lean * 0.3, 29.1, 1.5, 0.8, RC.couro, s + 4, 1.2);
  limb(P, [[11 + lean * 0.4, 24], [11.4 + st * 1.6 + lean * 0.3, 27], [11.8 + st * 2.4 + lean * 0.3, 28.4]], 0.75, RC.burel, 2.6, s + 5);
  P.blob(12.2 + st * 2.4 + lean * 0.3, 29.1, 1.6, 0.8, RC.couro, s + 6, 2.2);
  // the robe: a bell of heavy cloth from the shoulders, folds down it, a ragged hem that swings with the step
  for (let y = 16; y <= hem; y++) {
    const t = (y - 16) / (hem - 16), half = 2.5 + t * 2.1 + (o.flare || 0) * t, cx = 10.2 + lean * (1 - t * 0.7) - st * t * 0.7;
    for (let x = Math.floor(cx - half); x <= cx + half; x++) {
      if (y >= hem - 1 && hash2(x, y + Math.round(st * 2), s) < 0.4) continue;
      const u = (x + 0.5 - (cx - half)) / (2 * half), fold = (x + Math.round(t * 2 * st)) % 3 === 0 ? -0.9 : 0;
      P.put(x, y, o.robe, 4.4 - u * 2.4 - t * 0.6 + fold + cg(x, y, s) * 0.5);
    }
  }
  if (o.belt !== false) for (let x = 7.6; x <= 12.8; x++) P.put(x + lean * 0.8, 21.4, RC.cera, x < 9 ? 1.6 : 3 + (x === 11.6 ? 1.6 : 0));   // a rope belt
  if (o.body) o.body(P);
  // the hood, the colour of dirty wax: a peak at the back, a deep face opening in shadow, a short cape on the shoulders
  const hx = 11.6 + lean * 1.1, hy = 12.4 + (o.hy || 0);
  P.blob(hx - 1.2, hy + 4.4, 3.8, 1.8, o.hood, s + 7, 3.2, (x, y, dx, dy) => (dy > 0.5 ? -0.8 : 0) + ((x * 2 + y) % 5 === 0 ? -0.6 : 0));
  P.blob(hx - 0.6, hy, 3.4, 3.8, o.hood, s + 8, 3.4, (x, y, dx, dy) => (x % 3 === 0 && dy > -0.2 ? -0.5 : 0));
  for (let k = 0; k < 3; k++) P.put(hx - 3.4 - k * 0.5, hy - 1.6 + k * 0.4, o.hood, 2.6 - k * 0.4);   // the peak falling back
  for (let y = Math.floor(hy - 1.6); y <= hy + 2.6; y++) for (let x = Math.floor(hx + 0.4); x <= hx + 3; x++) {
    const dx = (x + 0.5 - (hx + 1.9)) / 1.6, dy = (y + 0.5 - (hy + 0.6)) / 2.3; if (dx * dx + dy * dy > 1) continue;
    P.put(x, y, RC.pele, 2.6 + dx * 0.8 + dy * 0.6 - (dx < -0.3 ? 1.2 : 0));   // the face, deep in the hood
  }
  for (let y = Math.floor(hy - 1.8); y <= hy + 1; y++) P.put(hx + 0.6 + (y < hy - 0.6 ? 0.6 : 0), y, RC.boca, 1.2);   // the shadow inside the opening
  P.put(hx + 2.2, hy + 0.2, RC.boca, 0.8);                                     // an eye in shadow
  P.put(hx + 2.6, hy + 2.2, RC.boca, o.open ? 0.2 : 2.4); if (o.open) P.put(hx + 2.6, hy + 2.9, RC.boca, 0.6);
  for (let y = Math.floor(hy - 2); y <= hy + 3; y++) P.put(hx + 3.1 + (y > hy + 1 ? -0.3 : 0), y, o.hood, 4.6 - (y - hy) * 0.3);   // the lit rim of the opening
  limb(P, o.near, 0.8, o.robe, 2.7, s + 9); hand(P, o.near[o.near.length - 1], s + 10, 3.6);
  if (o.front) o.front(P);
  return set(P.done());
}
const SHF = [8.6, 18], SHN = [11.6, 18.2];   // far and near shoulder (before lean)
const sh = (S, lean) => [S[0] + lean * 0.9, S[1]];

/* the novices: 0 standing, 1-2 walking in the procession, 3 candle raised (the song rising), 4-5 the run, 6 the blow,
   7 running away. NOV_TIP: where the flame sits (drawn live) */
const NOV_TIP = [];
function novico(pose) {
  const s = 13101 + pose * 7, lean = pose === 4 || pose === 5 ? 1.4 : pose === 6 ? 1.8 : pose === 7 ? 1.6 : 0;
  const st = pose === 1 || pose === 4 ? 1 : pose === 2 || pose === 5 ? -1 : pose === 7 ? 1 : 0;
  const F = sh(SHF, lean), N = sh(SHN, lean);
  let far, near, stick;
  if (pose === 3) { far = [F, [7.2, 15.6], [7.6, 12.6]]; near = [N, [13.2, 14.6], [14.2, 11]]; stick = [[14.2, 11.6], [14.2, 6.4]]; }
  else if (pose === 4 || pose === 5) { far = [F, [8.4 + lean, 21.4 + st * 0.6], [9.4 + lean, 23.4]]; near = [N, [14.4, 19.4], [15.6, 18.6]]; stick = [[15.4, 19.4], [17.4, 15.4]]; }
  else if (pose === 6) { far = [F, [9.4 + lean, 21.6], [11 + lean, 23]]; near = [N, [15.2, 19.8], [17.2, 21.2]]; stick = [[16.8, 21.2], [19.4, 24.6]]; }
  else if (pose === 7) { far = [F, [12.4, 16.6], [14.2, 14.2]]; near = [N, [9.6, 20.6], [7.4, 21.2]]; stick = [[7.6, 21.6], [5, 17.4]]; }
  else { const sw = st * 0.5; far = [F, [8.2 - sw, 21.2], [9.2 - sw, 23]]; near = [N, [12.8 + sw, 21], [14 + sw, 22.4]]; stick = [[14 + sw, 23.4], [14 + sw, 18.4]]; }
  const [a, b] = stick, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  NOV_TIP[pose] = [b[0] + ux * 3.4, b[1] + uy * 3.4];
  return cultist({
    robe: RC.ceraN, hood: RC.cera, st, lean, far, near, open: pose === 3 || pose === 7 || pose === 4, hem: 27.4,
    front: P => {
      P.line(a[0], a[1], b[0], b[1], RC.ferro, 3.6);                                               // the candlestick
      P.put(a[0] - ux * 0.8, a[1] - uy * 0.8, RC.ferro, 2.4);
      for (const o of [-1, 0, 1]) P.put(b[0] - uy * o, b[1] + ux * o, RC.ferro, o < 0 ? 5 : 3.4);   // the drip tray
      P.line(b[0] + ux * 0.8, b[1] + uy * 0.8, b[0] + ux * 2.8, b[1] + uy * 2.8, RC.vela, 5.6);    // the candle, burnt low
      P.put(b[0] + ux * 1.6 - uy * 0.9, b[1] + uy * 1.6 + ux * 0.9, RC.vela, 2.6);                   // wax run down its side
    }
  }, s);
}

/* the preacher: a longer, darker robe, a stole of wax-coloured cloth, a book of the Well. 0 standing, 1-2 walking,
   3 pointing, 4 the flask drawn back, 5 the throw */
function pregador(pose) {
  const s = 13201 + pose * 7, st = pose === 1 ? 1 : pose === 2 ? -1 : 0, lean = pose === 3 ? 0.6 : pose === 4 ? -0.8 : pose === 5 ? 1.2 : 0;
  const F = sh(SHF, lean), N = sh(SHN, lean);
  let far = [F, [10.2, 21], [12.6, 21.4]], near = [N, [12.6, 21.2], [13.2, 21.6]], book = [12.8, 20.6], flask = null;
  if (pose === 3) { near = [N, [15.2, 16.6], [18.2, 15.6]]; }
  else if (pose === 4) { near = [N, [9.6, 15], [8, 11.8]]; far = [F, [10.6, 20.6], [13, 20.4]]; flask = [7.6, 9.8]; }
  else if (pose === 5) { near = [N, [14.6, 15.4], [17.6, 14.2]]; far = [F, [8.2, 21.4], [8.6, 23.4]]; book = null; }
  return cultist({
    robe: RC.burel, hood: RC.cera, st, lean, far, near, open: pose === 3, hem: 28.4, flare: 0.6,
    body: P => {
      for (let y = 17; y <= 27; y++) { const x = 11.6 + lean * (1 - (y - 16) / 12 * 0.7) + (y > 22 ? -st * 0.4 : 0); P.put(x, y, RC.cera, 3.6 - (y - 17) * 0.12); P.put(x + 1, y, RC.cera, 2.4); }   // the stole
      P.blob(8, 23.4, 1, 1.3, RC.vidro, s + 11, 3.6); P.put(7.6, 21.8, RC.vela, 3);                 // a flask at the belt
    },
    front: P => {
      if (book) { P.blob(book[0], book[1], 1.8, 1.4, RC.couro, s + 12, 2.6); P.put(book[0] + 1, book[1] - 0.8, RC.vela, 3.4); }
      if (pose === 3) { P.put(19.2, 15.2, RC.pele, 3.6); P.put(19.9, 15, RC.pele, 2.8); }           // the finger
      if (flask) { P.blob(flask[0], flask[1], 1.3, 1.7, RC.vidro, s + 13, 3.6); P.put(flask[0] - 0.4, flask[1] - 0.8, RC.vidro, 6); P.put(flask[0], flask[1] - 2.2, RC.vela, 3.4); }
    }
  }, s);
}

/* the mason: a short hood, a leather apron, a wooden hod of bricks on his back, a trowel. 0 standing, 1-2 running,
   3 laying (the trowel out), 4 a brick over his head, 5 the throw */
function emparedador(pose) {
  const s = 13301 + pose * 7, st = pose === 1 ? 1 : pose === 2 ? -1 : 0, lean = pose === 1 || pose === 2 ? 1.2 : pose === 3 ? 1 : pose === 5 ? 1.4 : 0;
  const F = sh(SHF, lean), N = sh(SHN, lean);
  let far = [F, [8.4 - st * 0.6, 21], [9 - st * 0.6, 23]], near = [N, [12.8 + st * 0.6, 21], [13.4 + st * 0.6, 22.8]], trowel = [13.6, 23.6, 1], brick = null;
  if (pose === 3) { near = [N, [14.6, 20.6], [16.4, 21.6]]; trowel = [17, 21.8, 0]; far = [F, [10.4, 21.4], [12, 22.6]]; }
  else if (pose === 4) { near = [N, [13.4, 14.4], [12.6, 10.4]]; far = [F, [9.4, 14.4], [10.4, 10.6]]; trowel = null; brick = [11.6, 8.6]; }
  else if (pose === 5) { near = [N, [15, 15.2], [17.8, 14]]; far = [F, [8, 21.4], [8.4, 23.2]]; trowel = null; }
  return cultist({
    robe: RC.burel, hood: RC.cera, st, lean, far, near, hem: 26.6, hy: 0.6,
    back: P => {
      const x0 = 4.6 + lean * 0.4;
      for (let y = 13; y <= 24; y++) { P.put(x0, y, RC.madeira, 2.6); P.put(x0 + 3.8, y, RC.madeira, 1.6); }   // the hod's frame
      for (let k = 0; k < 4; k++) { const y = 15 + k * 2.4, x = x0 + 0.6 + (k % 2) * 0.4; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) P.put(x + i, y + j, RC.tijolo, 4.2 - j * 1.2 - i * 0.3 + (hash2(i, k, s) < 0.2 ? -1 : 0)); P.put(x, y + 1.8, RC.arg, 3); }
      P.line(x0 - 0.4, 24, x0 + 4.2, 24, RC.madeira, 3);
    },
    body: P => {
      for (let y = 21; y <= 26; y++) for (let x = 9.8; x <= 13.4; x++) P.put(x + lean * (1 - (y - 16) / 11 * 0.7), y, RC.couro, 3.4 - (y - 21) * 0.2 - (x > 12.6 ? 1.2 : 0) + cg(x, y, s + 14) * 0.5 + (hash2(x, y, s) < 0.1 ? 1.4 : 0));   // the apron, mortar-splashed
      for (let k = 0; k < 3; k++) P.put(10 + hash2(k, 1, s) * 3 + lean * 0.6, 22 + hash2(k, 2, s) * 4, RC.arg, 3.4);
    },
    front: P => {
      if (trowel) { const [x, y, down] = trowel; P.line(x - 1, y - (down ? 1 : 0), x, y, RC.madeira, 3); for (let i = 0; i < 3; i++) for (let j = 0; j <= i; j++) P.put(x + 1 + i, y - 0.6 + j * (down ? 1 : 0.5) - (down ? 0 : i * 0.2), RC.aco, 4.6 - i * 0.6); }
      if (brick) for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) P.put(brick[0] - 2.4 + i, brick[1] - 1 + j, j === 2 ? RC.arg : RC.tijolo, 4.4 - j * 1.1 - i * 0.25 + cg(i, j, s) * 0.4);
    }
  }, s);
}

/* the penitent, 36 x 40 facing right (feet on row 39; a 16 x 32 body): a huge man, bare scarred back, a sack hood of dirty wax with
   one eye hole, chains crossed on his chest. 0 standing, 1-2 dragging, 3 braced (the chain in both hands), 4 dizzy,
   5 the stone over his head, 6 the drop. PEN_HOOK: where the chain starts (his back, or his hands) */
const PEN_HOOK = [];
function penitente(pose) {
  const P = cp(36, 40), SX = 1.3, SY = 1.2, X = x => (x - 15) * SX + 18, Y = y => (y - 33) * SY + 39;
  // drawn on the old 30 x 34 grid and scaled out at paint time: broad and tall, every stroke still one pixel
  const Q = { put: (x, y, R, v) => P.put(X(x), Y(y), R, v), blob: (cx, cy, rx, ry, R, s2, b, f) => P.blob(X(cx), Y(cy), rx * SX, ry * SY, R, s2, b, f) };
  const L = (pts, r, R, base, s2) => limb(P, pts.map(([x, y]) => [X(x), Y(y)]), r * SX, R, base, s2);
  const s = 13401 + pose * 7, st = pose === 1 ? 1 : pose === 2 ? -1 : 0;
  const lean = pose === 1 || pose === 2 ? 1.4 : pose === 3 ? -1 : pose === 4 ? -0.6 : pose === 6 ? 3 : pose === 5 ? -0.4 : 0;
  const F = [12.6 + lean * 0.8, 14 + (pose === 6 ? 1 : 0)], N = [18.2 + lean * 0.8, 14.2 + (pose === 6 ? 1 : 0)];
  let far = [F, [11.8, 18.4], [12.4, 22]], near = [N, [19.6, 18.4], [20, 22]];
  if (pose === 1 || pose === 2) { far = [F, [13 - st, 18.6], [13.6 - st * 1.4, 22]]; near = [N, [20.4 + st, 18.4], [21.4 + st * 1.4, 21.6]]; }
  else if (pose === 3) { far = [F, [15.4, 18], [20.4, 19.6]]; near = [N, [21, 17.2], [23.4, 19]]; }
  else if (pose === 4) { far = [F, [10.6, 18.4], [9.6, 22.4]]; near = [N, [20.4, 18.6], [21.6, 22.6]]; }
  else if (pose === 5) { far = [F, [13, 9.4], [14.6, 4.8]]; near = [N, [17.4, 9.6], [17.6, 4.6]]; }
  else if (pose === 6) { far = [F, [17.4, 19.6], [21, 23.4]]; near = [N, [22.4, 19.4], [24.6, 23.6]]; }
  PEN_HOOK[pose] = pose === 3 ? [22.4, 19.4] : pose === 5 ? [16.8, 4.6] : pose === 6 ? [23, 24] : [9.6 + lean * 0.8, 17.6];
  L(far, 1.45, RC.pele, 1.6, s + 1); Q.blob(far[2][0], far[2][1], 1.6, 1.5, RC.pele, s + 2, 2);
  // legs: thick, ragged wool to the knee, bare feet
  const lg = (hx, d, base, k) => { const kx = hx + d * st * 1.4 + lean * 0.2, fx = hx + d * st * 2.6 + lean * 0.2; L([[hx + lean * 0.4, 24.4], [kx, 28.6], [fx, 32]], 1.4, RC.pele, base, s + k); L([[hx + lean * 0.4, 24], [kx, 28.4]], 1.6, RC.burel, base, s + k + 1); Q.blob(fx + 0.8, 33, 2.2, 0.9, RC.pele, s + k + 2, base); };
  lg(13.4, -1, 1.2, 3); lg(16.8, 1, 2.6, 6);
  // the loincloth and the body: a great slab of a back, lash scars on it
  Q.blob(15.2 + lean * 0.5, 23.6, 4.6, 2.2, RC.burel, s + 9, 2.6, (x, y) => ((x + y) % 3 === 0 ? -0.8 : 0));
  const bx = 15.4 + lean * 0.7, by = 18;
  Q.blob(bx - 0.6, by - 4.2, 5, 2.8, RC.pele, s + 16, 3.6);   // the hump of the shoulders
  Q.blob(bx, by, 6, 6.2, RC.pele, s + 10, 3.2, (x, y, dx, dy) => (dy > 0.6 ? -0.7 : 0) + (Math.abs(dx - 0.25) < 0.06 && dy < 0.2 ? -0.8 : 0));
  for (const [x, y, l] of [[11, 14.6, 4], [10.6, 17.4, 5], [11.4, 20, 4], [12.6, 15.6, 3]]) for (let j = 0; j < l; j++) Q.put(x + j * 0.7 + lean * 0.6, y + j * 0.5, RC.boca, (j % 2) ? 4 : 2.6);   // the scars
  for (let k = 0; k < 12; k++) { const t = k / 11; Q.put(lerp(12.4, 20.2, t) + lean * 0.7, lerp(13.4, 23, t), RC.corr, k % 2 ? 2.2 : 5); }   // a chain across the chest
  for (let k = 0; k < 9; k++) { const t = k / 8; Q.put(lerp(19.4, 12, t) + lean * 0.7, lerp(13.8, 22.4, t), RC.corr, k % 2 ? 1.8 : 4.4); }
  Q.blob(9.6, 17.6, 1.2, 1.2, RC.corr, s + 11, 4.2);   // the iron ring on his back
  // the hood: a sack of dirty wax pulled down to the shoulders, one torn eye hole, tied at the neck
  const hx = 19.8 + lean * 1.2 + (pose === 4 ? -1 : pose === 5 ? 1.2 : 0), hy = 9.6 + (pose === 6 ? 3.4 : pose === 5 ? 1.2 : 0) + (pose === 4 ? 0.6 : 0);
  Q.blob(hx - 0.8, hy + 2.8, 4.2, 2.4, RC.cera, s + 12, 3, (x, y, dx, dy) => (dy > 0.4 ? -0.8 : 0));
  Q.blob(hx, hy, 3.2, 3.6, RC.cera, s + 13, 3.4, (x, y) => ((x * 3 + y) % 7 === 0 ? -0.8 : 0) + (hash2(x, y, s) < 0.1 ? -0.7 : 0));
  Q.put(hx - 0.6, hy - 3.8, RC.cera, 4.4); Q.put(hx - 1.2, hy - 4.4, RC.cera, 3.6);   // the knot of the sack on top
  Q.put(hx + 1.6, hy - 0.4, RC.boca, 0.2); Q.put(hx + 2.2, hy - 0.4, RC.boca, 0.8); Q.put(hx + 1.8, hy + 0.3, RC.boca, 1.2);
  for (let x = hx - 3; x <= hx + 2.4; x++) Q.put(x, hy + 3.2, RC.corr, 2.4);   // the cord at the neck
  L(near, 1.55, RC.pele, 3, s + 14); Q.blob(near[2][0], near[2][1], 1.7, 1.6, RC.pele, s + 15, 3.4);
  if (pose === 3) for (let k = 0; k < 4; k++) Q.put(20.6 + k * 0.8, 19.2 + (k % 2) * 0.3, RC.corr, k % 2 ? 2.4 : 5);   // the chain in his fists
  PEN_HOOK[pose] = [X(PEN_HOOK[pose][0]), Y(PEN_HOOK[pose][1])];
  return set(P.done());
}
// the well stone, 19 x 19: a round black millstone with a carved ring and an iron eye; k turns the carving
function stone(k) {
  const P = cp(19, 19), s = 13501 + k, a = k * Math.PI / 4;
  P.blob(9.5, 9.5, 8.5, 8.5, RC.pedra, s, 3.4, (x, y, dx, dy) => { const d = Math.hypot(dx, dy); return (Math.abs(d - 0.62) < 0.08 ? -1.6 : 0) + (Math.abs(d - 0.7) < 0.06 ? 1 : 0) + (hash2(x, y, s) < 0.08 ? -1 : 0); });
  for (let i = 0; i < 3; i++) { const b = a + i * 2.1; P.put(9.5 + Math.cos(b) * 4, 9.5 + Math.sin(b) * 4, RC.pedra, 6); P.put(9.5 + Math.cos(b + 0.2) * 4.2, 9.5 + Math.sin(b + 0.2) * 4.2, RC.pedra, 5); }   // worn carvings
  P.blob(9.5, 9.5, 1.8, 1.8, RC.corr, s + 1, 4);   // the iron eye in the middle
  return set(P.done());
}
// the brick he throws, 6 x 4, and the flask, 5 x 7
function brickImg() { const P = cp(6, 4), s = 13511; for (let x = 0; x < 6; x++) for (let y = 0; y < 4; y++) P.put(x, y, y === 3 ? RC.arg : RC.tijolo, 4.4 - y * 0.9 - x * 0.2 + cg(x, y, s) * 0.5); return set(P.done()); }
function flaskImg() { const P = cp(5, 7), s = 13521; P.blob(2.5, 4.4, 2, 2.3, RC.vidro, s, 3.6); P.put(1.6, 3.4, RC.vidro, 6); P.put(2.5, 1.4, RC.vidro, 3); P.put(2.5, 0.4, RC.vela, 4); return set(P.done()); }
const GL = { vela: glow(10, '#ffb84a'), velaS: glow(5, '#fff0b0') };
CDC.get = () => CDC.ready || (CDC.ready = {
  nov: [0, 1, 2, 3, 4, 5, 6, 7].map(novico),
  pre: [0, 1, 2, 3, 4, 5].map(pregador),
  emp: [0, 1, 2, 3, 4, 5].map(emparedador),
  pen: [0, 1, 2, 3, 4, 5, 6].map(penitente),
  stone: [0, 1, 2, 3].map(stone),
  brick: brickImg(), flask: flaskImg()
});
Object.assign(CDC, { RC, GL, NOV_TIP, PEN_HOOK });
}

/* ================= helpers ================= */
const cdcHuman = e => !!(ET[e.type] && ET[e.type].human);
const cdcNeutral = e => e.state === 'walk' || e.state === 'guard' || e.state === 'goto' || e.state === 'lost';
function cdcHumanStep(e, dt, dx, dy, dist, aggro) { return typeof humanStep === 'function' && cdcNeutral(e) && !!humanStep(e, dt, dx, dy, dist, aggro); }
function cdcWand(e, dt, lo = 2, hi = 3) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.35 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = lo + Math.random() * hi; } }
// walk toward dir without the hero's path overriding it (followers, the mason going to his passage)
function cdcWalkTo(e, dt, dir, sp, acc = 500) { const nv = e.nav; e.nav = null; walk(e, dt, dir, sp, acc, 260, 0, true); e.nav = nv; }
// the other living humans within r px of e (the nearest one, and how many)
function cdcAllies(e, r) {
  let n = 0, best = null, bd = r;
  for (const o of enemies) { if (o === e || o.dead || !cdcHuman(o) || (o.type === 'novicos' && o.state === 'flee')) continue; const d = Math.hypot(o.x - e.x, o.y - e.y); if (d < r) { n++; if (d < bd) { bd = d; best = o; } } }
  return { n, best };
}
// the boss halls are never touched (a future inCdHall too)
function cdcSafeCell(tx, ty) {
  for (const f of ['inThroneHall', 'inTeiaHall', 'inYetiHall', 'inRgHall', 'inMaeHall', 'inAbHall', 'inCdHall']) { const fn = window[f]; if (typeof fn === 'function' && fn(tx, ty)) return false; }
  return !(typeof inVillage === 'function' && inVillage(tx, ty));
}
const cdcWet = (tx, ty) => typeof aguaAt === 'function' && !!aguaAt(tx, ty);
const cdcDust = (x, y, vx, vy, col, life = 0.6, g = 300) => { if (parts.length < 700) parts.push({ x, y, vx, vy, g, life, max: life, col, size: 1 }); };
// a lobbed throw from (ox, oy) to land on (tx, ty)
function cdcLob(ox, oy, tx, ty, G) { const t = clamp(Math.hypot(tx - ox, ty - oy) / 150, 0.45, 1.1); return [(tx - ox) / t, (ty - oy - 0.5 * G * t * t) / t]; }

/* ================= the novices ================= */
// the leader brings its procession with it on its first step (so the generator's placement holds)
function cdcProcInit(e) {
  e.cdInit = true; if (e.cdFollower) return;
  e.cdProc = []; e.noFlee = true; e.chantT = Math.random() * 2;
  const n = 3 + Math.floor(Math.random() * 3), D = ET.novicos;
  let lx = e.x, ly = e.y;
  for (let i = 1; i <= n; i++) {
    let px = e.x - e.facing * i * 13, py = null;
    for (const o of [0, -T, T, -2 * T, 2 * T]) {
      const y = e.y + o, ftx = Math.floor((px + D.w / 2) / T), fty = Math.floor((y + D.h + 1) / T);
      if (!rectSolid(px, y, D.w, D.h) && solidAt(ftx, fty) && Math.abs(ftx - Math.floor((lx + D.w / 2) / T)) <= 2) { py = y; break; }
    }
    if (py === null) { px = lx; py = ly; } else { lx = px; ly = py; }
    const f = spawnEnemy('novicos', px, py, zoneAt(Math.floor(px / T), Math.floor(py / T)));
    if (!f) continue;
    Object.assign(f, { cdFollower: true, cdLead: e, cdInit: true, facing: e.facing, noFlee: true, lvl: e.lvl, hp: e.hp, maxHp: e.maxHp, dmg: e.dmg, xp: e.xp, gold: e.gold });
    e.cdProc.push(f);
  }
}
const cdcProc = lead => { const L = [lead]; if (lead.cdProc) for (const f of lead.cdProc) if (!f.dead) L.push(f); return L; };
function cdcBreak(lead) {   // the one in front is dead: the others drop the song and run
  let any = false;
  if (lead.cdProc) for (const f of lead.cdProc) if (!f.dead) { f.cdLead = null; f.noFlee = false; f.state = 'flee'; f.stateT = 4 + Math.random() * 3; f.memT = 0; any = true; }
  lead.cdProc = null;
  if (any) { sfx.cdcScream(); if (typeof cdAlarme === 'function') cdAlarme(lead.x + lead.w / 2, lead.y + 4, 14); }
}
AI.novicos = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (!e.cdInit) cdcProcInit(e);
  const ecx = e.x + e.w / 2, lead = e.cdFollower ? e.cdLead : e;
  if (e.cdFollower && lead && lead.dead) { if (lead.despawn) { e.dead = true; e.despawn = true; return; } cdcBreak(lead); }
  const st = e.state;
  if (st === 'raise') { e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { e.state = 'run'; e.stateT = 1.5; e.swingHit = false; } return; }
  if (st === 'run') {   // all at once, candlesticks up
    walk(e, dt, Math.abs(dx) < 4 ? 0 : Math.sign(dx), 92 + e.lvl, 900, 270, dy, true);
    if (Math.abs(dx) < 13 && Math.abs(dy) < 18) { e.state = 'swing'; e.stateT = 0.28; e.facing = Math.sign(dx) || e.facing; e.swingHit = false; return; }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; }
    return;
  }
  if (st === 'swing') {
    e.vx = approach(e.vx, 0, 600 * dt);
    if (!e.swingHit && e.stateT < 0.18) {
      e.swingHit = true;
      const hb = { x: e.facing > 0 ? ecx - 2 : ecx - 14, y: e.y + 2, w: 16, h: 18 };
      if (!pl.dead && overlap(hb, pl)) { hurtPlayer(e.dmg, ecx, e, false); sfx.cdcClang(); }
      else sfx.cdcSwish();
    }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; }
    return;
  }
  if (st === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = e.cdFollower && !e.cdLead ? 'lost' : 'walk'; if (lead === e) e.atkCD = 2.4 + Math.random() * 1.2; } return; }
  if (st === 'flee') {   // the procession broke: away from the hero, as fast as the robe lets them
    walk(e, dt, -(Math.sign(dx) || e.facing), 70, 700, 260, 0, false); e.facing = Math.sign(e.vx) || e.facing;
    if (e.hitWall && e.onGround) e.vy = -260;
    if (e.stateT <= 0) e.state = 'lost';
    return;
  }
  if (cdcHumanStep(e, dt, dx, dy, dist, aggro)) return;
  if (st === 'lost') {   // a novice without its procession: wanders, and runs again if the hero comes near
    cdcWand(e, dt); walk(e, dt, e.wander, 14, 300, 250, dy, false); if (e.wander) e.facing = e.wander;
    if (!pl.dead && dist < 130) { e.state = 'flee'; e.stateT = 3; }
    return;
  }
  // the procession
  if (lead === e) {
    const P = cdcProc(e);
    let pAggro = aggro; for (const f of P) if (f !== e && f.memT > 0 && Math.hypot(f.x - pl.x, f.y - pl.y) < 240) pAggro = !pl.dead;
    if (pAggro) {
      if (Math.abs(dx) > 40) walk(e, dt, Math.sign(dx), 22 + e.lvl * 0.5, 400, 260, dy, true);
      else { e.vx = approach(e.vx, 0, 400 * dt); e.facing = Math.sign(dx) || e.facing; }
      // the song rises when any of them is close enough to reach the hero in a run
      if (e.atkCD <= 0) for (const f of P) {
        const fdx = pl.x + pl.w / 2 - (f.x + f.w / 2), fdy = pl.y + pl.h / 2 - (f.y + f.h / 2);
        if (Math.abs(fdx) < 84 && Math.abs(fdy) < 30 && f.onGround && clearPath(f, pl)) {
          for (const g of P) if (g.state === 'walk' && g.stun <= 0) { g.state = 'raise'; g.stateT = 0.6; g.vx = 0; }
          e.atkCD = 3; sfx.cdcRise(P.length); break;
        }
      }
    } else {
      cdcWand(e, dt, 3, 4); if (e.wander === 0 && Math.random() < 0.5) e.wander = e.facing;
      walk(e, dt, e.wander, 12, 200, 250, dy, false); if (e.wander) e.facing = e.wander;
      if (e.hitWall) { e.wander = -e.wander; e.wtimer = 3; }
    }
    e.chantT -= dt;
    if (e.chantT <= 0) { e.chantT = 2.4 + Math.random() * 0.4; if (dist < 230) sfx.cdcChant(P.length, dist); }
    return;
  }
  // a follower: keeps 13 px behind the one ahead of it in the line
  const L = lead.cdProc, i = L.indexOf(e);
  let ahead = lead; for (let k = i - 1; k >= 0; k--) if (!L[k].dead) { ahead = L[k]; break; }
  const gap = ahead.x - e.x;
  if (Math.abs(gap) > 14) cdcWalkTo(e, dt, Math.sign(gap), Math.min(46, 12 + (Math.abs(gap) - 14) * 1.6), 400);
  else { e.vx = approach(e.vx, 0, 300 * dt); e.facing = ahead.facing; }
  if (Math.abs(e.vx) > 2) e.facing = Math.sign(e.vx);
  if (aggro && lead.memT < 1) lead.memT = 2.5;
};

/* ================= the preacher ================= */
const cdcFlasks = [], cdcPuddles = [];
AI.pregador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'point') {   // the finger on the hero; the ring closes round him
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (!losClear(ecx, e.y + 6, pcx, pl.y + pl.h / 2)) e.blindT = (e.blindT || 0) + dt;
    if (e.blindT > 0.35 || pl.dead) { e.state = 'walk'; e.atkCD = 1.5; return; }
    if (e.stateT <= 0) { cdMarcar(6); sfx.cdcMark(); e.state = 'walk'; e.atkCD = 4 + Math.random(); }
    return;
  }
  if (e.state === 'aimF') { e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { cdcThrowFlask(e); e.state = 'throw'; e.stateT = 0.3; } return; }
  if (e.state === 'throw') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2.4 + Math.random() * 0.8; } return; }
  if (cdcHumanStep(e, dt, dx, dy, dist, aggro)) return;
  if (!aggro) { cdcWand(e, dt); walk(e, dt, e.wander, 14, 300, 250, dy, false); if (e.wander) e.facing = e.wander; return; }
  // far off and behind the others; with nobody to hide behind, at a good distance
  e.allyT = (e.allyT || 0) - dt; if (e.allyT <= 0) { e.allyT = 0.4; e.al = cdcAllies(e, 240); }
  const A = e.al;
  let side = Math.sign(ecx - pcx) || -e.facing, want;
  if (A.best) { side = Math.sign(A.best.x + A.best.w / 2 - pcx) || side; want = A.best.x + A.best.w / 2 + side * 40; }
  else want = pcx + side * 125;
  if (Math.abs(want - pcx) < 96) want = pcx + side * 96;
  const ddx = want - ecx, dir = Math.abs(ddx) > 10 ? Math.sign(ddx) : 0;
  cdcWalkTo(e, dt, dir, dir === Math.sign(dx) ? 30 : 24, 400);   // backwards he goes a little slower
  e.facing = Math.sign(dx) || e.facing;
  e.backing = dir !== 0 && dir !== e.facing;
  if (e.atkCD <= 0 && e.onGround && dist < 220 && losClear(ecx, e.y + 6, pcx, pl.y + pl.h / 2)) {
    if (A.n > 0 && !(pl.cdMarcaT > 0)) { e.state = 'point'; e.stateT = 1; e.blindT = 0; e.vx = 0; sfx.cdcPreach(); }
    else if (A.n === 0 && dist > 36 && dist < 190) { e.state = 'aimF'; e.stateT = 0.6; e.vx = 0; sfx.cdcGrunt(); }
  }
};
function cdcThrowFlask(e) {
  const ox = e.x + e.w / 2 - e.facing * 2, oy = e.y - 2, tx = pl.x + pl.w / 2 + clamp(pl.vx, -80, 80) * 0.25, ty = pl.y + pl.h - 4, G = 420;
  const [vx, vy] = cdcLob(ox, oy, tx, ty, G);
  cdcFlasks.push({ x: ox, y: oy, vx, vy, G, dmg: e.dmg, src: e, rot: 0 });
  sfx.cdcToss();
}
// a dark puddle of Well water on the floor under (x, y): up to 3 blocks wide
function cdcPuddle(x, y) {
  const tx = Math.floor(x / T); let ty = Math.floor(y / T), k = 0;
  while (k < 8 && !solidAt(tx, ty)) { ty++; k++; }
  if (!solidAt(tx, ty) || solidAt(tx, ty - 1)) { if (solidAt(tx, ty - 1) && !solidAt(tx, ty - 2)) ty--; else return; }
  let x0 = tx, x1 = tx;
  if (solidAt(tx - 1, ty) && !solidAt(tx - 1, ty - 1)) x0--;
  if (solidAt(tx + 1, ty) && !solidAt(tx + 1, ty - 1)) x1++;
  cdcPuddles.push({ x0: x0 * T + 1, x1: (x1 + 1) * T - 1, y: ty * T, t: 0, life: 8, seed: Math.random() * 100 });
}

/* ================= the penitent ================= */
const cdcPlank = t => t === CD_MADEIRAME || t === CD_TELHA;
// the plank or roof cells under his feet that a dropped stone breaks
function cdcUnderFeet(e) {
  const fy = Math.floor((e.y + e.h + 1) / T), out = [];
  for (let x = Math.floor((e.x - 4) / T); x <= Math.floor((e.x + e.w + 3) / T); x++) if (cdcPlank(tileAt(x, fy)) && cdcSafeCell(x, fy)) out.push(x);
  return { fy, xs: out };
}
const CDC_SR = 9;   // the stone's radius (px)
function cdcStoneRest(e) { return [e.x + e.w / 2 - e.facing * (e.w / 2 + 13), e.y + e.h - CDC_SR]; }
AI.penitente = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.hitCD = (e.hitCD || 0) - dt;
  const ecx = e.x + e.w / 2, chest = e.y + 13;
  if (e.stX === undefined) { [e.stX, e.stY] = cdcStoneRest(e); e.stA = 0; e.stR = 0; }
  const st = e.state;
  if (st === 'creak' || st === 'spin') {
    const k = st === 'creak' ? 1 - e.stateT / 1 : 1 - e.stateT / 3;
    if (st === 'creak') { e.vx = approach(e.vx, 0, 600 * dt); e.stR = lerp(e.stR, 16, dt * 4); e.stA += (1.2 + k * 4) * dt * e.facing; }
    else {
      e.stR = 18 + 34 * k; const w = 12.5 * e.facing, a0 = e.stA; e.stA += w * dt;
      if (Math.floor(a0 / (Math.PI * 2)) !== Math.floor(e.stA / (Math.PI * 2)) && dist < 220) sfx.cdcWhoosh();
      walk(e, dt, Math.abs(dx) > 8 ? Math.sign(dx) : 0, 9, 200, 0, 0, false); e.facing = e.facing;
    }
    e.stX = ecx + Math.cos(e.stA) * e.stR; e.stY = chest + Math.sin(e.stA) * e.stR * 0.32;
    if (st === 'spin' && e.hitCD <= 0 && !pl.dead && cdcCircleHits(e.stX, e.stY, CDC_SR, pl)) { e.hitCD = 0.8; hurtPlayer(e.dmg, e.stX, e, false); sfx.cdcThud(); }
    if (e.stateT <= 0) {
      if (st === 'creak') { e.state = 'spin'; e.stateT = 3; e.stA = Math.atan2((e.stY - chest) / 0.32, e.stX - ecx); }
      else { e.state = 'dizzy'; e.stateT = 1.5; e.stFall = 1; sfx.cdcThud(); burst(e.stX, e.y + e.h - 2, 8, '#2c323c', 60, 300, 0.4); }
    }
    return;
  }
  if (st === 'dizzy') {   // the stone thrown down beside him, the world turning
    e.vx = approach(e.vx, 0, 500 * dt);
    if (e.stFall) { e.stY = Math.min(e.stY + 160 * dt, e.y + e.h - CDC_SR); if (e.stY >= e.y + e.h - CDC_SR) e.stFall = 0; }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.4 + Math.random() * 0.8; }
    return;
  }
  if (st === 'lift') {   // the stone up over his head
    e.vx = approach(e.vx, 0, 600 * dt);
    const k = 1 - e.stateT / 0.8, hx = ecx + e.facing * 2, hy = e.y - 9;
    e.stX = lerp(e.stX, hx, Math.min(1, dt * 8 * (0.4 + k))); e.stY = lerp(e.stY, hy, Math.min(1, dt * 8 * (0.4 + k)));
    if (e.stateT <= 0) { e.state = 'slam'; e.stateT = 0.6; cdcSlam(e); }
    return;
  }
  if (st === 'slam') { e.vx = approach(e.vx, 0, 600 * dt); e.stX = ecx + e.facing * 13; e.stY = Math.min(e.stY + 400 * dt, e.y + e.h - CDC_SR); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2 + Math.random(); } return; }
  if (cdcHumanStep(e, dt, dx, dy, dist, aggro)) { cdcDrag(e, dt, dist); return; }
  // walking: slow and heavy, the stone dragging behind on its chain
  if (!aggro) { cdcWand(e, dt, 3, 3); walk(e, dt, e.wander, 10, 200, 0, dy, false); if (e.wander) e.facing = e.wander; }
  else walk(e, dt, Math.abs(dx) > 18 ? Math.sign(dx) : 0, 17 + e.lvl * 0.4, 260, 200, dy, true);
  if (Math.abs(e.vx) > 2) e.facing = Math.sign(e.vx);
  cdcDrag(e, dt, dist);
  if (aggro && e.atkCD <= 0 && e.onGround && !pl.dead) {
    const below = dy > 30 && Math.abs(dx) < 70 && cdcUnderFeet(e).xs.length > 0;
    if (below || (Math.abs(dx) < 66 && Math.abs(dy) < 30 && clearPath(e, pl))) {
      e.facing = Math.sign(dx) || e.facing;
      if (below || Math.random() < 0.38) { e.state = 'lift'; e.stateT = 0.8; sfx.cdcGrunt(true); }
      else { e.state = 'creak'; e.stateT = 1; e.stA = Math.atan2((e.stY - chest) / 0.32, e.stX - ecx); e.stR = Math.min(20, Math.hypot(e.stX - ecx, e.stY - chest)); sfx.cdcChain(); }
    }
  }
};
function cdcDrag(e, dt, dist) {
  const [tx, ty] = cdcStoneRest(e), d = Math.hypot(tx - e.stX, ty - e.stY);
  if (d > 36) { e.stX = tx + (e.stX - tx) * 36 / d; e.stY = ty + (e.stY - ty) * 36 / d; }
  e.stX = approach(e.stX, tx, Math.max(20, Math.abs(e.vx) * 1.2) * dt); e.stY = approach(e.stY, ty, 120 * dt);
  if (Math.abs(e.vx) > 4) {
    e.dragT = (e.dragT || 0) - dt; e.stRoll = (e.stRoll || 0) + Math.abs(e.vx) * dt / 7;
    if (e.dragT <= 0) { e.dragT = 0.7; if (dist < 200) sfx.cdcDrag(); }
    if (Math.random() < dt * 6) cdcDust(e.stX + rnd(-4, 4), e.y + e.h - 1, rnd(-10, 10), rnd(-20, -6), '#3a3228', 0.4);
  }
}
const cdcCircleHits = (x, y, r, b) => { const nx = clamp(x, b.x, b.x + b.w), ny = clamp(y, b.y, b.y + b.h); return (nx - x) ** 2 + (ny - y) ** 2 <= r * r; };
// the drop: the floor shakes round him, and planks or roof tiles under him give way
function cdcSlam(e) {
  const ecx = e.x + e.w / 2, fyPx = e.y + e.h;
  shake(3.5); sfx.cdcSlam();
  burst(ecx + e.facing * 13, fyPx - 2, 18, '#3a3228', 90, 350, 0.6);
  if (!pl.dead && Math.abs(pl.x + pl.w / 2 - ecx) < 40 && pl.y + pl.h > fyPx - 20 && pl.y + pl.h < fyPx + 6 && pl.onGround) hurtPlayer(e.dmg, ecx, e, false);
  const U = cdcUnderFeet(e);
  if (U.xs.length) {
    for (const x of U.xs) {
      const t = tileAt(x, U.fy); setTile(x, U.fy, AIR);
      burst((x + 0.5) * T, (U.fy + 0.5) * T, 10, PCOL[t] || '#4c3a26', 80, 380, 0.6);
      for (let k = 0; k < 3; k++) cdcDust((x + Math.random()) * T, (U.fy + 0.5) * T, rnd(-30, 30), rnd(-40, 20), t === CD_TELHA ? '#3e4652' : '#5e4932', 0.9, 420);
    }
    sfx.cdcCrack();
  }
}

/* ================= the mason and the fresh wall ================= */
const cdcFresh = [];    // laid cells { x, y, i, prev, t (s left), hits }
const cdcGhosts = [];   // rows about to be laid { x, y, t (0..1), e }
const cdcBricks = [];
const cdcFreshAt = i => { for (const f of cdcFresh) if (f.i === i) return f; return null; };
function cdcLay(x, y) {
  x = wrapX(x); const i = y * WW + x;
  cdcFresh.push({ x, y, i, prev: tiles[i], t: 30, hits: 0 });
  tiles[i] = CD_PAREDE_FRESCA; markDirty(x, y); mapVer++;   // straight into the tiles: never into diffs, never saved
  for (let k = 0; k < 6; k++) cdcDust((x + Math.random()) * T, (y + Math.random()) * T, rnd(-20, 20), rnd(-30, 0), Math.random() < 0.5 ? '#7a746b' : '#925a4c', 0.5);
}
function cdcCrumble(f, loud = true) {
  const k = cdcFresh.indexOf(f); if (k >= 0) cdcFresh.splice(k, 1);
  if (tiles[f.i] !== CD_PAREDE_FRESCA) return;
  tiles[f.i] = f.prev === CD_PAREDE_FRESCA ? AIR : f.prev; markDirty(f.x, f.y); mapVer++;
  if (diffs.get(f.i) === CD_PAREDE_FRESCA) diffs.delete(f.i);
  const cx = (f.x + 0.5) * T, cy = (f.y + 0.5) * T;
  burst(cx, cy, 10, '#7a746b', 50, 200, 0.8); burst(cx, cy, 6, '#74443a', 70, 380, 0.5);
  for (let n = 0; n < 8; n++) cdcDust(cx + rnd(-6, 6), cy + rnd(-6, 6), rnd(-14, 14), rnd(-24, -4), '#5e5952', 1.2, 30);   // dust hanging in the air
  if (loud) sfx.cdcCrumble();
}
// the narrowest passage (2 or 3 tall) on the mason's side of the hero, following the floor out from the hero's feet
function cdcFindPassage(e) {
  const pcx = pl.x + pl.w / 2, hx = Math.floor(pcx / T), s = Math.sign(e.x + e.w / 2 - pcx) || -e.facing || 1;
  let y = Math.floor((pl.y + pl.h + 1) / T);
  for (let k = 0; k < 6 && !solidAt(hx, y); k++) y++;
  if (!solidAt(hx, y)) return null;
  for (let k = 1; k <= 22; k++) {
    const x = hx + s * k;
    if (solidAt(x, y - 1)) { if (!solidAt(x, y - 2) && !solidAt(x, y - 3)) y--; else return null; }
    else if (!solidAt(x, y)) { if (solidAt(x, y + 1)) y++; else return null; }
    let h = 0; while (h < 5 && !solidAt(x, y - 1 - h)) h++;
    if (k < 3 || h < 2 || h > 3 || e.banX === x) continue;
    let ok = true;
    for (let r = 1; r <= h; r++) if (tileAt(x, y - r) !== AIR || cdcWet(x, y - r) || !cdcSafeCell(x, y - r)) ok = false;
    // somewhere for him to stand just beyond it
    const sx = x + s; let sy = -1;
    for (const d of [0, -1, 1]) if (navStand(sx, y + d, 2)) { sy = y + d; break; }
    if (ok && sy >= 0) return { x, y0: y - h, y1: y - 1, h, sx, sy, s };
  }
  return null;
}
const cdcCellBusy = (x, y) => { const r = { x: x * T + 0.5, y: y * T + 0.5, w: T - 1, h: T - 1 }; if (!pl.dead && overlap(r, pl)) return true; for (const o of enemies) if (!o.dead && overlap(r, o)) return true; return false; };
const cdcPlanUp = p => { for (let y = p.y0; y <= p.y1; y++) if (tileAt(p.x, y) !== CD_PAREDE_FRESCA) return false; return true; };
function cdcDropGhost(e) { for (let i = cdcGhosts.length - 1; i >= 0; i--) if (cdcGhosts[i].e === e) cdcGhosts.splice(i, 1); }
AI.emparedador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.planT = (e.planT || 0) - dt; e.banT = (e.banT || 0) - dt; if (e.banT <= 0) e.banX = -1;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'raise') { e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { cdcThrowBrick(e); e.state = 'throw'; e.stateT = 0.3; } return; }
  if (e.state === 'throw') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = e.plan ? 'goto' : 'walk'; e.atkCD = 1.6 + Math.random() * 0.6; } return; }
  // up close, a brick over his head (also between rows)
  const near = aggro && e.atkCD <= 0 && e.onGround && dist < 84 && dist > 14 && Math.abs(dy) < 50 && losClear(ecx, e.y + 2, pcx, pl.y + pl.h / 2);
  if (e.state === 'build') {
    const p = e.plan; e.vx = approach(e.vx, 0, 600 * dt); e.facing = p.s < 0 ? 1 : -1;
    if (near && dist < 40) { cdcDropGhost(e); e.state = 'raise'; e.stateT = 0.6; sfx.cdcGrunt(); return; }
    if (Math.abs(ecx - (p.sx + 0.5) * T) > 12) { cdcDropGhost(e); e.state = 'goto'; return; }   // knocked off his spot
    const y = p.y1 - e.row; let g = null; for (const q of cdcGhosts) if (q.e === e) g = q;
    if (!g) { g = { x: p.x, y, t: 0, e }; cdcGhosts.push(g); e.waitT = 0; }
    e.trowT = (e.trowT || 0) - dt; if (e.trowT <= 0) { e.trowT = 0.32; if (dist < 220) sfx.cdcTrowel(); }
    g.t = Math.min(1, g.t + dt);   // the row's outline, a second before the bricks
    if (g.t >= 1) {
      if (tileAt(p.x, y) !== AIR && tileAt(p.x, y) !== CD_PAREDE_FRESCA) { cdcDropGhost(e); e.plan = null; e.state = 'walk'; return; }
      if (cdcCellBusy(p.x, y)) { e.waitT += dt; if (e.waitT > 3) { cdcDropGhost(e); e.banX = p.x; e.banT = 6; e.plan = null; e.state = 'walk'; } return; }   // never on anyone's cells
      cdcDropGhost(e);
      if (tileAt(p.x, y) === AIR) { cdcLay(p.x, y); sfx.cdcLay(); }
      e.row++;
      if (e.row >= p.h) { e.state = 'guard'; e.stateT = 2; }
    }
    return;
  }
  if (cdcHumanStep(e, dt, dx, dy, dist, aggro)) return;
  if (near && e.state !== 'guard') { e.state = 'raise'; e.stateT = 0.6; sfx.cdcGrunt(); return; }
  if (!aggro) { if (e.state === 'goto') e.state = 'walk'; e.plan = null; cdcWand(e, dt); walk(e, dt, e.wander, 14, 300, 250, dy, false); if (e.wander) e.facing = e.wander; return; }
  if (e.state === 'guard') {   // planted beyond his wall, watching it
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (near && clearPath(e, pl)) { e.state = 'raise'; e.stateT = 0.6; sfx.cdcGrunt(); return; }
    if (e.stateT <= 0 && (!e.plan || !cdcPlanUp(e.plan))) { e.state = 'walk'; e.plan = null; e.planT = 0; }
    else if (e.stateT <= 0) e.stateT = 1;
    return;
  }
  if (!e.plan || e.planT <= 0) { e.plan = cdcFindPassage(e); e.planT = 1.5; if (e.plan) { e.state = 'goto'; e.gotoT = 0; } else e.state = 'walk'; }
  if (e.state === 'goto' && e.plan) {   // runs to the far side of the passage and plants himself
    const p = e.plan, ddx = (p.sx + 0.5) * T - ecx;
    e.gotoT += dt;
    if (Math.abs(ddx) < 3 && e.onGround) { e.state = 'build'; e.row = 0; e.vx = 0; e.waitT = 0; return; }
    cdcWalkTo(e, dt, Math.sign(ddx), 64, 700); if (Math.abs(e.vx) > 2) e.facing = Math.sign(e.vx);
    if (e.gotoT > 5) { e.banX = p.x; e.banT = 6; e.plan = null; e.state = 'walk'; }
    return;
  }
  // nothing to wall up: keeps his distance and waits
  const dir = dist < 70 ? -Math.sign(dx) : 0;
  cdcWalkTo(e, dt, dir, 34, 400); e.facing = Math.sign(dx) || e.facing;
};
function cdcThrowBrick(e) {
  const ox = e.x + e.w / 2, oy = e.y - 4, tx = pl.x + pl.w / 2 + clamp(pl.vx, -80, 80) * 0.2, ty = pl.y + pl.h / 2, G = 460;
  const [vx, vy] = cdcLob(ox, oy, tx, ty, G);
  cdcBricks.push({ x: ox, y: oy, vx, vy, G, dmg: e.dmg, rot: 0 });
  sfx.cdcToss();
}

/* ================= drawing ================= */
const cdcCam = (e, fx, fy) => [Math.round(e.x + e.w / 2) - fx, Math.round(e.y + e.h) - fy];
function cdcFlame(x, y, raised) {   // a candle flame, a few live pixels
  const f = Math.sin(gameTime * 23 + x * 0.7) > 0.2 ? 1 : 0;
  lc.fillStyle = '#ffb84a'; lc.fillRect(x, y - 1 - f, 1, 2 + f);
  lc.fillStyle = '#fff0b0'; lc.fillRect(x, y, 1, 1);
  if (raised) { lc.fillStyle = '#ffb84a'; lc.fillRect(x, y - 3 - f, 1, 1); }
}
DRAW_E.novicos = (e, fx, fy, fl) => {
  const B = CDC.get().nov, st = e.state;
  const k = st === 'raise' ? 3 : st === 'run' ? 4 + (Math.floor(e.t * 10) % 2) : st === 'swing' ? 6 : st === 'flee' ? 7 : st === 'recover' ? 0 : Math.abs(e.vx) > 3 && e.onGround ? 1 + (Math.floor(e.t * (st === 'lost' ? 5 : 3)) % 2) : 0;
  const j = st === 'raise' ? Math.round(Math.sin(e.t * 30) * 0.5) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 10 + j, fy - 30);
  const [tx, ty] = CDC.NOV_TIP[k];
  e.tipX = e.facing > 0 ? fx - 10 + Math.round(tx) + j : fx + 9 - Math.round(tx) + j; e.tipY = fy - 30 + Math.round(ty); e.tipT = gameTime;
};
DRAW_E.pregador = (e, fx, fy, fl) => {
  const B = CDC.get().pre, st = e.state;
  const k = st === 'point' ? 3 : st === 'aimF' ? 4 : st === 'throw' ? 5 : Math.abs(e.vx) > 3 && e.onGround ? 1 + (Math.floor(e.t * (e.backing ? 3 : 4)) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 10, fy - 30);
};
DRAW_E.emparedador = (e, fx, fy, fl) => {
  const B = CDC.get().emp, st = e.state;
  const k = st === 'build' ? 3 : st === 'raise' ? 4 : st === 'throw' ? 5 : Math.abs(e.vx) > 3 && e.onGround ? 1 + (Math.floor(e.t * 8) % 2) : 0;
  const j = st === 'build' ? Math.round(Math.sin(e.t * 14)) : 0;   // the trowel working
  lc.drawImage(cvPick(B[k], e, fl), fx - 10, fy - 30 + (j > 0 ? 1 : 0));
};
function cdcChainLine(x0, y0, x1, y1, sag) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 1.5));
  for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(lerp(x0, x1, t)), y = Math.round(lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag); lc.fillStyle = i % 2 ? '#3e4248' : '#6e747c'; lc.fillRect(x, y, 1, 1); }
}
DRAW_E.penitente = (e, fx, fy, fl) => {
  const D = CDC.get(), st = e.state;
  const k = st === 'creak' || st === 'spin' ? 3 : st === 'dizzy' ? 4 : st === 'lift' ? 5 : st === 'slam' ? 6 : Math.abs(e.vx) > 2 && e.onGround ? 1 + (Math.floor(e.t * 2.5) % 2) : 0;
  const sway = st === 'dizzy' ? Math.round(Math.sin(e.t * 5) * 1.4) : 0;
  const [camX, camY] = cdcCam(e, fx, fy), sx = Math.round(e.stX) - camX, sy = Math.round(e.stY) - camY;
  const H = CDC.PEN_HOOK[k], hx = e.facing > 0 ? fx - 18 + H[0] + sway : fx + 17 - H[0] + sway, hy = fy - 40 + H[1];
  const behind = (st === 'spin' || st === 'creak') ? Math.sin(e.stA) < 0 : st !== 'lift';
  const sImg = cvPick(D.stone[Math.floor(st === 'spin' || st === 'creak' ? e.stA * 2 : (e.stRoll || 0)) & 3], e, false);
  const sag = st === 'walk' ? Math.max(0, 6 - Math.hypot(sx - hx, sy - hy) * 0.15) : 0;
  if (behind) { cdcChainLine(hx, hy, sx, sy, sag); lc.drawImage(sImg, sx - 9, sy - 9); }
  lc.drawImage(cvPick(D.pen[k], e, fl), fx - 18 + sway, fy - 40);
  if (!behind) { cdcChainLine(hx, hy, sx, sy, sag); lc.drawImage(sImg, sx - 9, sy - 9); }
  if (st === 'dizzy') for (let i = 0; i < 3; i++) { const a = e.t * 5 + i * 2.1; lc.fillStyle = i ? '#8a7a5c' : '#c0ae88'; lc.fillRect(Math.round(fx + 4 * e.facing + Math.cos(a) * 5), Math.round(fy - 39 + Math.sin(a) * 1.5), 1, 1); }
};
for (const t of CDC_TYPES) EYES_E[t] = () => { };
WARN_E.novicos = e => e.state === 'raise';
WARN_E.pregador = e => e.state === 'point' || e.state === 'aimF';
WARN_E.penitente = e => e.state === 'creak' || e.state === 'lift';
WARN_E.emparedador = e => e.state === 'raise';

/* ---------- blows, the mark, the wall, the projectiles ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const st = e && e.state, r = _hit(e, dir, mult, melee);
  if (e && !e.dead) {
    if (e.type === 'penitente' && (st === 'creak' || st === 'spin' || st === 'lift' || st === 'slam')) { e.vx = 0; e.vy = 0; e.stun = 0; }   // too heavy to stagger mid-swing
    else if (e.type === 'pregador' && st === 'point') { e.state = 'walk'; e.atkCD = 1.5; }                                            // a blow breaks the sermon
    else if (e.type === 'novicos') { const L = e.cdFollower ? e.cdLead : e; if (L && !L.dead) L.memT = 4; }
  }
  return r;
}; }
{ const _ke = killEnemy; killEnemy = function (e) {
  const r = _ke(e);
  if (e.type === 'novicos' && !e.cdFollower && e.cdProc) cdcBreak(e);
  if (e.type === 'emparedador') cdcDropGhost(e);
  if (CDC_TYPES.includes(e.type) && Math.random() < 0.7) sfx.cdcDie();
  return r;
}; }
// the pickaxe: one strike and the wet bricks fall out, nothing to pick up
{ const _bt = breakTile; breakTile = function (tx, ty) {
  if (tileAt(tx, ty) === CD_PAREDE_FRESCA) { const i = ty * WW + wrapX(tx), f = cdcFreshAt(i) || { x: wrapX(tx), y: ty, i, prev: AIR }; cdcCrumble(f); return; }
  return _bt(tx, ty);
}; }
// the weapon: two blows (each swing counts once per cell)
{ const _bs = bladeSweep; bladeSweep = function () {
  const pts = _bs.apply(this, arguments);
  if (cdcFresh.length && pl.atkHit) for (const q of pts) {
    const tx = Math.floor(q[0] / T), ty = Math.floor(q[1] / T); if (tileAt(tx, ty) !== CD_PAREDE_FRESCA) continue;
    const i = ty * WW + wrapX(tx), key = 'cdc' + i; if (pl.atkHit.has(key)) continue;
    pl.atkHit.add(key);
    const f = cdcFreshAt(i) || { x: wrapX(tx), y: ty, i, prev: AIR, hits: 0, t: 30 };
    f.hits++; sfx.cdcBrickHit(); burst(q[0], q[1], 5, '#7a746b', 60, 300, 0.35); shake(1);
    if (f.hits >= 2) cdcCrumble(f);
  }
  return pts;
}; }
// fresh mortar never reaches the save
{ const _ms = makeSave; makeSave = function () {
  const v = _ms.apply(this, arguments);
  if (v && Array.isArray(v.diffs)) v.diffs = v.diffs.filter(([i, t]) => t !== CD_PAREDE_FRESCA && !(cdcFreshAt(i) && tiles[i] === CD_PAREDE_FRESCA && t === CD_PAREDE_FRESCA));
  return v;
}; }
// the hero is marked (pl.cdMarcaT, 130/136): everything of the city near him comes straight at him
function cdcMarked() { return !pl.dead && pl.cdMarcaT > 0; }
function cdcUpdate(dt) {
  if (cdcMarked()) for (const e of enemies) {
    if (e.dead || e.boss) continue;
    if (cdcHuman(e) || inCidade(Math.floor((e.y + e.h / 2) / T))) { if (!(e.type === 'novicos' && (e.state === 'flee' || e.state === 'lost'))) e.memT = Math.max(e.memT || 0, 0.6); }
  }
  // the fresh wall: 30 s and it falls to dust (the last seconds it sheds grit)
  for (let i = cdcFresh.length - 1; i >= 0; i--) {
    const f = cdcFresh[i];
    if (tiles[f.i] !== CD_PAREDE_FRESCA) { cdcFresh.splice(i, 1); continue; }
    f.t -= dt;
    if (f.t < 3 && Math.random() < dt * 6) cdcDust((f.x + Math.random()) * T, (f.y + 1) * T, rnd(-4, 4), 10, '#5e5952', 0.6, 200);
    if (f.t <= 0) cdcCrumble(f, true);
  }
  for (const g of cdcGhosts) if (g.e.dead) g.e = null;
  for (let i = cdcGhosts.length - 1; i >= 0; i--) if (!cdcGhosts[i].e) cdcGhosts.splice(i, 1);
  // flasks of Well water
  for (let i = cdcFlasks.length - 1; i >= 0; i--) {
    const p = cdcFlasks[i]; p.vy = Math.min(p.vy + p.G * dt, 420); p.rot += dt * 12;
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    const hitPl = !pl.dead && cdcCircleHits(nx, ny, 3, pl), hitW = solidAt(Math.floor(nx / T), Math.floor(ny / T));
    if (hitPl || hitW || ny > WH * T) {
      if (hitPl) hurtPlayer(p.dmg, nx, null, true);
      sfx.cdcGlass(); burst(nx, ny, 10, '#121418', 70, 300, 0.5); burst(nx, ny, 4, '#56646a', 80, 300, 0.3);
      cdcPuddle(hitW ? p.x : nx, hitW ? p.y : ny);
      cdcFlasks.splice(i, 1); continue;
    }
    p.x = nx; p.y = ny;
    if (Math.random() < dt * 20) cdcDust(p.x, p.y, rnd(-5, 5), rnd(-5, 5), '#22262c', 0.3, 100);
  }
  // the puddles: slow while standing in them
  for (let i = cdcPuddles.length - 1; i >= 0; i--) {
    const q = cdcPuddles[i]; q.t += dt;
    if (q.t > q.life) { cdcPuddles.splice(i, 1); continue; }
    const fx = pl.x + pl.w / 2, fyy = pl.y + pl.h;
    if (!pl.dead && fx > q.x0 - 2 && fx < q.x1 + 2 && Math.abs(fyy - q.y) < 3 && typeof fungLentidao === 'function') fungLentidao(0.45, 0.35);
  }
  // bricks
  for (let i = cdcBricks.length - 1; i >= 0; i--) {
    const b = cdcBricks[i]; b.vy = Math.min(b.vy + b.G * dt, 420); b.rot += dt * 10;
    const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    const hitPl = !pl.dead && cdcCircleHits(nx, ny, 3, pl), hitW = solidAt(Math.floor(nx / T), Math.floor(ny / T));
    if (hitPl || hitW || ny > WH * T) {
      if (hitPl) hurtPlayer(b.dmg, nx, null, true);
      sfx.cdcBrickBreak(); burst(nx, ny, 8, '#74443a', 80, 380, 0.45); burst(nx, ny, 4, '#7a746b', 50, 300, 0.4);
      cdcBricks.splice(i, 1); continue;
    }
    b.x = nx; b.y = ny;
  }
}
HOOK.update.push(cdcUpdate);
HOOK.drawWorld.push((cx, cy) => {
  const D = CDC.get(), a0 = lc.globalAlpha;
  // the rows about to be laid: a translucent outline of bricks
  for (const g of cdcGhosts) {
    const x = g.x * T - cx, y = g.y * T - cy, a = 0.2 + g.t * 0.35 + Math.sin(gameTime * 14) * 0.06;
    lc.globalAlpha = a0 * a; lc.fillStyle = '#b07a68';
    lc.fillRect(x, y, T, 1); lc.fillRect(x, y + T - 1, T, 1); lc.fillRect(x, y, 1, T); lc.fillRect(x + T - 1, y, 1, T);
    lc.fillRect(x, y + 6, T, 1); lc.fillRect(x + 6, y, 1, 6);
    lc.globalAlpha = a0 * a * 0.35; lc.fillStyle = '#74443a'; lc.fillRect(x + 1, y + 1, T - 2, T - 2);
  }
  lc.globalAlpha = a0;
  // cracks on the fresh bricks already struck
  for (const f of cdcFresh) if (f.hits > 0) {
    const x = f.x * T - cx, y = f.y * T - cy; lc.fillStyle = '#1c0e0a';
    for (let k = 0; k < 7; k++) lc.fillRect(x + 3 + k + (k > 3 ? 1 : 0), y + 2 + Math.round(Math.abs(Math.sin(k * 1.7 + f.i)) * 6) + (k > 4 ? 2 : 0), 1, 1);
  }
  // the puddles of black Well water
  for (const q of cdcPuddles) {   // a flat film of black water lying on the floor line, soaking its top edge
    const fade = q.t > q.life - 1 ? q.life - q.t : Math.min(1, q.t * 4), x0 = Math.round(q.x0) - cx, w = Math.round(q.x1 - q.x0), y = Math.round(q.y) - cy;
    lc.globalAlpha = a0 * fade;
    lc.fillStyle = '#060709'; lc.fillRect(x0 + 1, y - 1, w - 2, 1);
    lc.fillStyle = '#0a0c0f'; lc.fillRect(x0, y, w, 1);
    lc.globalAlpha = a0 * fade * 0.55; lc.fillStyle = '#060709'; lc.fillRect(x0 + 2, y + 1, w - 4, 1);
  }
  lc.globalAlpha = a0;
  for (const p of cdcFlasks) cvRot(D.flask.r, Math.round(p.x) - cx, Math.round(p.y) - cy, p.rot);
  for (const b of cdcBricks) cvRot(D.brick.r, Math.round(b.x) - cx, Math.round(b.y) - cy, b.rot);
  lc.globalAlpha = a0;
});
// over the light: the candle flames, and the preacher's dark ring closing round the hero (and the mark while it lasts)
HOOK.drawTop.push((cx, cy) => {
  for (const e of enemies) if (!e.dead && e.type === 'novicos' && e.tipT === gameTime) cdcFlame(e.tipX, e.tipY, e.state === 'raise');   // the flames over the dark
  for (const q of cdcPuddles) {   // over the dark: the film covers the floor's lit lip, a glossy top edge, a faint ripple from the middle
    const fade = q.t > q.life - 1 ? q.life - q.t : Math.min(1, q.t * 4), x0 = Math.round(q.x0) - cx, w = Math.round(q.x1 - q.x0), y = Math.round(q.y) - cy;
    lc.globalAlpha = fade * 0.9; lc.fillStyle = '#07080b'; lc.fillRect(x0 + 1, y - 1, w - 2, 2); lc.fillRect(x0, y, w, 1);
    lc.globalAlpha = fade * 0.75; lc.fillStyle = '#2c323c'; lc.fillRect(x0 + 2, y - 2, w - 4, 1);
    for (let x = 3; x < w - 3; x++) { const g = hash2(x + Math.floor(gameTime * 1.2), 3, q.seed | 0); if (g < 0.8) continue; lc.globalAlpha = fade * 0.6; lc.fillStyle = '#6e7a88'; lc.fillRect(x0 + x, y - 2, 1, 1); }
    const ph = ((gameTime * 0.7 + q.seed) % 1.6) / 1.6, mid = x0 + (w >> 1), d = Math.round(ph * (w / 2 - 3));
    lc.globalAlpha = fade * 0.75 * (1 - ph); lc.fillStyle = '#8a9098';
    lc.fillRect(mid - d - 2, y - 2, 2, 1); lc.fillRect(mid + d, y - 2, 2, 1);
    if (ph < 0.12) { lc.globalAlpha = fade * 0.6; lc.fillRect(mid, y - 3, 1, 1); }   // the drop that set it off
  }
  lc.globalAlpha = 1;
  if (pl.dead) return;
  const hx = Math.round(pl.x + pl.w / 2) - cx, hy = Math.round(pl.y + pl.h / 2) - cy;
  let p = -1; for (const e of enemies) if (!e.dead && e.type === 'pregador' && e.state === 'point') p = Math.max(p, 1 - e.stateT);
  if (p >= 0) cdcRing(hx, hy, 24 - 10 * p, 0.45 + 0.5 * p, 64);
  else if (pl.cdMarcaT > 0) cdcRing(hx, hy, 14 + Math.sin(gameTime * 4) * 0.8, Math.min(1, pl.cdMarcaT) * 0.6, 40);
});
function cdcRing(x, y, r, a, n) {
  const a0 = lc.globalAlpha;
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2 + gameTime * 0.6, px = Math.round(x + Math.cos(t) * r), py = Math.round(y + Math.sin(t) * r * 0.8);
    lc.globalAlpha = a0 * a; lc.fillStyle = i % 3 ? '#050608' : '#101318'; lc.fillRect(px, py, 2, 2);
    lc.globalAlpha = a0 * a * 0.45; lc.fillStyle = '#7c6c50'; lc.fillRect(px + (px < x ? 2 : -1), py + (py < y ? 2 : -1), 1, 1);   // a faint wax-coloured inner edge
  }
  lc.globalAlpha = a0;
}
HOOK.drawGlow.push((cx, cy) => {
  const G = CDC.GL;
  for (const e of enemies) {
    if (e.dead || e.type !== 'novicos' || e.tipT !== gameTime) continue;   // the flame's screen spot, from this frame's draw
    const fl = 0.42 + Math.sin(gameTime * 17 + e.seed) * 0.06 + (e.state === 'raise' ? 0.2 : 0);
    lc.globalAlpha = fl; lc.drawImage(G.vela, e.tipX - 10, e.tipY - 11);
    lc.globalAlpha = 0.7; lc.drawImage(G.velaS, e.tipX - 5, e.tipY - 6);
  }
  lc.globalAlpha = 1;
});
// the novices' candles are the only light the cult carries
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) if (!e.dead && e.type === 'novicos') addL(e.x + e.w / 2 + e.facing * 4, e.y + (e.state === 'raise' ? -6 : 4), e.state === 'raise' ? 0.4 : 0.3);
}; }
function clearCdcFx() { cdcFresh.length = 0; cdcGhosts.length = 0; cdcBricks.length = 0; cdcFlasks.length = 0; cdcPuddles.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearCdcFx(); return _nw(sd, sv); }; }

/* ---------- sounds: voices, never words ---------- */
Object.assign(sfx, {
  // the procession's one note: unison voices a hair apart, a breath under them
  cdcChant(n, d) { const v = (0.008 + Math.min(6, n) * 0.0025) * clamp(1.2 - d / 230, 0.2, 1); tone(147, 1.9, 'triangle', v); tone(147.9, 1.9, 'sine', v * 0.8, 0, 0.06); tone(294.5, 1.8, 'sine', v * 0.25, 0, 0.1); noise(1.6, v * 0.5, 650, 'bandpass', 0.05, 6); },
  cdcRise(n) { const v = 0.014 + Math.min(6, n) * 0.003; tone(147, 0.62, 'triangle', v, 150); tone(148, 0.62, 'sawtooth', v * 0.3, 152); tone(294, 0.6, 'sine', v * 0.4, 300); noise(0.6, v * 0.5, 900, 'bandpass', 0, 5); },
  cdcClang() { tone(620, 0.12, 'square', 0.025, -220); noise(0.1, 0.06, 2400, 'bandpass', 0, 2); },
  cdcSwish() { noise(0.1, 0.03, 1600, 'bandpass', 0, 1.5); },
  cdcScream() { tone(560, 0.4, 'sawtooth', 0.02, -280); tone(470, 0.35, 'sawtooth', 0.016, -240, 0.08); noise(0.35, 0.03, 1400, 'bandpass', 0, 3); },
  cdcPreach() { for (let k = 0; k < 5; k++) { tone(104 + (k % 2) * 14 - (k === 4 ? 10 : 0), 0.15, 'sawtooth', 0.013, -12, k * 0.19); noise(0.12, 0.016, 520 + (k % 2) * 160, 'bandpass', k * 0.19, 5); } },
  cdcMark() { tone(68, 0.9, 'sine', 0.06, -18); tone(102, 0.7, 'triangle', 0.015, -30, 0.05); noise(0.7, 0.03, 300, 'lowpass'); },
  cdcToss() { noise(0.12, 0.04, 1400, 'bandpass', 0, 1.5); },
  cdcGlass() { tone(2300, 0.06, 'square', 0.015, -900); tone(3100, 0.05, 'triangle', 0.012, -700, 0.02); noise(0.12, 0.06, 4200, 'highpass'); noise(0.3, 0.05, 480, 'lowpass', 0.03); },
  cdcGrunt(big) { tone(big ? 72 : 96, 0.2, 'sawtooth', 0.022, -25); noise(0.16, 0.03, big ? 380 : 520, 'bandpass', 0, 3); },
  cdcDie() { tone(130, 0.3, 'sawtooth', 0.02, -60); noise(0.25, 0.03, 600, 'bandpass', 0, 3); },
  // the penitent's chain creaking as it starts to turn, link by link
  cdcChain() { for (let k = 0; k < 5; k++) { tone(380 + k * 45, 0.13, 'sawtooth', 0.012, 120, k * 0.19); noise(0.1, 0.035, 2700, 'bandpass', k * 0.19, 6); } },
  cdcWhoosh() { noise(0.24, 0.05, 650, 'bandpass', 0, 1.4); },
  cdcDrag() { noise(0.45, 0.022, 320, 'lowpass', 0, 1); noise(0.2, 0.012, 2600, 'bandpass', 0.1, 8); },
  cdcThud() { tone(60, 0.18, 'sine', 0.06, -20); noise(0.15, 0.06, 300, 'lowpass'); },
  cdcSlam() { tone(52, 0.35, 'sine', 0.09, -18); noise(0.4, 0.1, 240, 'lowpass'); noise(0.2, 0.04, 1600, 'bandpass', 0.04, 2); },
  cdcCrack() { noise(0.3, 0.09, 900, 'bandpass', 0, 2); tone(150, 0.14, 'square', 0.03, -90); noise(0.2, 0.05, 500, 'lowpass', 0.12); },
  // the mason's trowel scraping mortar, the wet slap of a row laid, the wall falling to dust
  cdcTrowel() { noise(0.16, 0.03, 3200, 'bandpass', 0, 5); noise(0.12, 0.022, 2300, 'bandpass', 0.15, 5); },
  cdcLay() { noise(0.1, 0.06, 480, 'lowpass'); tone(118, 0.08, 'sine', 0.04, -40); },
  cdcCrumble() { noise(0.55, 0.06, 650, 'lowpass', 0, 1); noise(0.35, 0.03, 2000, 'bandpass', 0.1, 2); },
  cdcBrickHit() { noise(0.08, 0.06, 900, 'bandpass', 0, 1.5); tone(210, 0.06, 'square', 0.02, -80); },
  cdcBrickBreak() { noise(0.16, 0.07, 1200, 'bandpass', 0, 1.5); tone(170, 0.08, 'square', 0.025, -70); }
});
