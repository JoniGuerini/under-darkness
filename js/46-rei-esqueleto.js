'use strict';

/* ================= O Rei Esqueleto: the boss of the cathedral =================
   A dead king on a black throne, in a hall picked at random (from the seed) among the naves
   and cloisters. Walk in and he rises; iron gates drop over every way out until one of you falls.
     phase 1  mace smash (clear wind-up, long recovery), a leap that sends shockwaves along
              the floor (jump them), raises his dead templars out of bone piles
     phase 2  (half life) a shoulder charge that ends stunned against a wall; smashes crack the floor
     phase 3  the first time he falls he collapses into a heap, then pulls himself back together
              at half life: faster, and rows of bone spikes burst out of the floor toward you
   He drops his crown: Coroa do Rei Esqueleto, a legendary helmet that also shows on the hero.
   Everything is painted once and cached (pose frames, throne, spikes); per frame only drawImage.
   Plugs in by wrapping placeProps (the hall is dressed right before the props go in), hitEnemy,
   killEnemy, endBossFight, makeSave and newWorld, and through DRAW_E/EYES_E/WARN_E/HOOK. */

/* ---------- tuning ---------- */
const REI = {
  hp: 760, dmg: 20, xp: 320, lvl: 6,
  speed: [34, 42, 56],            // walk speed per phase
  wind: [0.62, 0.5, 0.42],        // smash wind-up
  rec: [0.7, 0.55, 0.45],         // recovery after a smash (the punish window)
  cd: [1.1, 0.85, 0.6],           // pause between attacks
  sumCap: [2, 3, 4], sumN: [2, 2, 3], sumCD: [14, 11, 9],
  p2: 0.55, revive: 0.5
};

/* ---------- art: letter grids (facing right), shaded with the hero's ramps ---------- */
// o bone (O far side) · x socket · z gap between teeth/ribs · f ermine fur · k ermine spot · i blackened iron
// g gold (G darker) · t royal tabard (T fold) · c cape (C fold) · r ruby · m mace iron (M darker) · h haft
const REI_BODY = [
  "......ooooo.......",
  ".....ooooooo......",
  "....ooooooooo.....",
  "....ooooooooo.....",
  "....oOxxooxxo.....",
  "....OoxxOoxxo.....",
  ".....oooOOooo.....",
  ".....Oozozozo.....",
  "......ozozozO.....",
  "......OoooooO.....",
  "...fFfffffffffFf..",
  ".gffkffffffffkffg.",
  "giiiiffoooooffiiig",
  "giIiiozzzoozzziIig",
  ".giiioooooooooiig.",
  "..ggiozzzoozzzigg.",
  ".....ooooooooo....",
  ".....ozzzoozzz....",
  "......oooooooo....",
  "......ozzoozzo....",
  ".....gggggGgggg...",
  ".....tttttgtttt...",
  "....ttttttgttttt..",
  "....tTttttgtttTt..",
  "....tttTttgttTtt..",
  "...ttTttttgttttTt.",
  "...ggggggggggggggg",
  "...t.tT..t..Tt.t.."
];
const REI_LEGS = {
  idle: ["....O....o....", "....O....o....", "...OO...oo....", "....O....o....", "....O....o....", "....I....i....", "...III..iii...", "...IIII.iiii.."],
  w0: ["....O....o....", "...O.....o....", "...OO.....o...", "..O........o..", "..O........o..", "..I........i..", ".III.......ii.", ".III.......iii"],
  w1: [".....O.o......", ".....O.o......", ".....OOoo.....", "......O.o.....", "......O.o.....", "......I.i.....", ".....II.ii....", ".....IIIiiii.."],
  w2: ["....o....O....", "...o.....O....", "...oo.....O...", "..o........O..", "..o........O..", "..i........I..", ".iii.......II.", ".iii.......III"],
  w3: [".....o.O......", ".....o.O......", ".....ooOO.....", "......o.O.....", "......o.O.....", "......i.I.....", ".....ii.II....", ".....iiiIIII.."],
  squat: ["...OO...oo....", "..O..O.o..o...", "...O.....o....", "...I.....i....", "..III...iii...", "..IIII..iiii.."],
  air: ["....O....o....", "...O....o.....", "..O....o......", "..OO...oo.....", "...O....o.....", "...I....i.....", "..III..iii....", ".............."],
  sit: [".....OOOOOOO..", "......oooooooo", "..........O.o.", "..........O.o.", "..........O.o.", "..........OOoo", "..........O.o.", "..........O.o.", "..........O.o.", "..........O.o.", "..........I.i.", ".........II.ii", "........III.ii", "........III.iii"]
};
const REI_CAPE = [
  [
    "......cccccc", ".....cccccCc", ".....ccccCcc", "....cccccccc", "....cccCcccc", "....cccccccc", "...ccCcccccc", "...ccccccccc",
    "...cccccCccc", "..cccccccccc", "..cCcccccccc", "..cccccccCcc", "..cccccccccc", ".ccCcccccccc", ".cccccccccc.", ".cccccCcccc.",
    ".gggggggggg.", ".c.cc.c.cc..", "c...c...c...", "............"
  ],
  [
    "......cccccc", ".....cccccCc", ".....ccccCcc", "....cccccccc", "....ccCccccc", "...ccccccccc", "...ccCcccccc", "...ccccccccc",
    "..cccccCcccc", "..cccccccccc", "..cCcccccccc", ".ccccccccCcc", ".ccccccccccc", ".ccCcccccccc", "cccccccccccc", "ccccccCcccc.",
    "ggggggggggg.", "c.cc.c.cc.c.", ".c...c...c..", "............"
  ]
];
// blown back behind a charge
const REI_CAPE_RUN = [
  "..........cc", ".......ccccc", "....cccccCcc", "..cccCcccccc", "cccccccccccc", ".ccCccccccCc", "cc.ccCcccccc", "...cccccccgc",
  ".c..ccccgg..", "....cggg.c..", ".....c......"
];
const REI_CROWN = ["r...r...r.", "g..ggg..g.", "gg.grg.gg.", "gggggggggg", "grgGgrgGgr"];
const REI_MACE = ["....m....", "..mmMmm..", ".mMmmmMm.", "mMmmmmmMm", ".mmmmmmM.", "mMmmmmmMm", ".mMmmmMm.", "..mmMmm..", "....m....", "...ggg...", "....h....", "....h....", "....h....", "....h....", "....h....", "....h....", "....h....", "....h....", "....g....", "....h....", "...ggg..."];
const REI_COL = { bone: '#d4c8a8', fur: '#d8d0c0', spot: '#1a1418', iron: '#4e505c', gold: '#c99a34', goldD: '#8e6420', tab: '#45285e', cape: '#7a1c28', ruby: '#d0283c', mace: '#62666f', haft: '#4a3020', socket: '#140c10' };
const reiM = (hex, grain = 0.1, o = {}) => Object.assign({ ramp: heroRamp(hex), grain }, o);
function reiMats() {
  const C = REI_COL;
  return {
    o: reiM(C.bone, 0.14), x: C.socket, z: '#2a1c1c', f: reiM(C.fur, 0.18, { under: true }), k: C.spot, i: reiM(C.iron, 0.16, { under: true }),
    g: reiM(C.gold, 0.06, { under: true }), t: reiM(C.tab, 0.2, { lip: true, under: true }), c: reiM(C.cape, 0.22, { under: true, lip: true }),
    r: C.ruby, m: reiM(C.mace, 0.18, { under: true }), h: reiM(C.haft, 0.25, { under: true })
  };
}
const REI_ART = {};
function reiArt() {
  if (REI_ART.body) return REI_ART;
  const M = reiMats(), P = (rows, s) => heroPaint(rows, L => M[L], s);
  REI_ART.body = P(REI_BODY, 41);
  REI_ART.legs = {}; for (const k in REI_LEGS) REI_ART.legs[k] = P(REI_LEGS[k], 43);
  REI_ART.cape = REI_CAPE.map(r => P(r, 47)); REI_ART.capeRun = P(REI_CAPE_RUN, 47);
  const MC = { g: reiM(REI_COL.gold, 0.05, { under: true }), G: reiM(REI_COL.goldD, 0.05, { under: true }), r: REI_COL.ruby };
  REI_ART.crown = heroPaint(REI_CROWN, L => MC[L], 49, null, true);
  REI_ART.mace = P(REI_MACE, 53);
  return REI_ART;
}
// a bone arm: thin capsule from the shoulder with a knuckle knob and a gold bracer near the wrist
function reiArm(ang, len, dark) {
  const N = 64, q = ((Math.round(ang / (Math.PI * 2) * N) % N) + N) % N, n = Math.max(0, Math.round(len));
  return cached('reia:' + q + ':' + n + ':' + (dark || 0), () => {
    const a = q / N * Math.PI * 2, dx = Math.sin(a), dy = -Math.cos(a), C = 11, c = mk(C * 2 + 1, C * 2 + 1), x = c.getContext('2d');
    const br = heroRamp(REI_COL.bone), gr = heroRamp(REI_COL.gold);
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
      const px = i + 0.5 - (C + 0.5), py = j + 0.5 - (C + 0.5);
      const t = clamp(px * dx + py * dy, 0, n), ex = px - dx * t, ey = py - dy * t;
      const bracer = t > n - 4 && t < n - 2, rr = t > n - 1.5 ? 0.9 : bracer ? 0.9 : t < 1.5 ? 1.0 : 0.35;
      if (ex * ex + ey * ey > rr) continue;
      const side = -ex * 0.6 - ey * 0.8;
      let v = 3 - (dark || 0) + (side > 0.3 ? 1 : side < -0.3 ? -1 : 0);
      if (Math.abs(t - n * 0.5) < 0.6) v += 1;
      x.fillStyle = (bracer ? gr : br)[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
    }
    return { img: c, C, hx: dx * n, hy: dy * n };
  });
}

/* ---------- composing a pose into a cached frame ---------- */
// frame canvas 84x64, feet centre at (42, 56); poses are laid out around (32, 52) and shifted in
const RF_W = 84, RF_H = 64, RF_X = 42, RF_Y = 56;
function reiFrame(P) {
  const key = 'reif:' + P.legs + '|' + P.lower + '|' + P.lean + '|' + P.cape + '|' + Math.round(P.back * 10) + '|' + Math.round(P.arm * 10) + '|' + Math.round(P.mace * 10) + '|' + (P.crown === false ? 0 : 1);
  return cached(key, () => {
    const A = reiArt(), c = mk(RF_W, RF_H), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.translate(RF_X - 32, RF_Y - 52);
    const by = 19 + P.lower, bx = 23 + P.lean;
    // cape behind everything
    if (P.cape === 'run') x.drawImage(A.capeRun, bx - 11, by + 11);
    else if (P.cape !== 'none') x.drawImage(A.cape[P.cape | 0], bx - 4, by + 11);
    // the far arm
    const sB = [bx + 1.5, by + 12.5], rb = reiArm(P.back, 10, 1);
    x.drawImage(rb.img, Math.round(sB[0] - 0.5) - rb.C, Math.round(sB[1] - 0.5) - rb.C);
    // legs, body, crown
    const lg = A.legs[P.legs];
    x.drawImage(lg, 25, P.legs === 'sit' ? 38 : P.legs === 'squat' ? 46 : 44);
    x.drawImage(A.body, bx, by);
    if (P.crown !== false) x.drawImage(A.crown, bx + 4, by - 4);
    // the near arm and the mace in its fist
    const sF = [bx + 15.5, by + 12.5], rf = reiArm(P.arm, 10, 0);
    const hx = sF[0] + rf.hx, hy = sF[1] + rf.hy;
    const drawMace = () => { x.save(); x.translate(Math.round(hx), Math.round(hy)); x.rotate(P.mace); x.drawImage(A.mace, -4.5, -18.5); x.restore(); };
    const behind = Math.cos(P.mace) > 0.2 && Math.sin(P.mace) < 0;   // raised back over the shoulder: the haft passes behind the skull
    if (behind) drawMace();
    x.drawImage(rf.img, Math.round(sF[0] - 0.5) - rf.C, Math.round(sF[1] - 0.5) - rf.C);
    if (!behind) drawMace();
    x.setTransform(1, 0, 0, 1, 0, 0); outline(x, RF_W, RF_H);
    return { r: c, l: null, wr: null, wl: null };
  });
}
function reiImg(F, facing, fl) {
  if (facing > 0) return fl ? (F.wr || (F.wr = whiteOf(F.r))) : F.r;
  if (!F.l) F.l = flip(F.r);
  return fl ? (F.wl || (F.wl = whiteOf(F.l))) : F.l;
}
const q6 = k => Math.round(clamp(k, 0, 1) * 6) / 6;
function reiPose(e) {
  const st = e.state, walking = e.onGround && Math.abs(e.vx) > 4, breathe = Math.floor(e.t * 1.6) % 2;
  const P = { legs: !e.onGround ? 'air' : walking ? WALK[Math.floor(e.t * (st === 'charge' ? 9 : 5)) % 4] : 'idle', lower: breathe, lean: 0, cape: Math.floor(e.t * 2.2) % 2, back: 3.0, arm: 2.5, mace: 2.75 };
  if (walking) { P.lower = Math.floor(e.t * 5) % 2; P.arm = 2.4; P.mace = 2.7; }
  const k = q6(1 - e.stateT / (e.stateMax || 1));
  if (st === 'wind' || st === 'raise') { const up = st === 'raise'; P.arm = lerp(2.5, up ? -0.1 : -0.35, easeOut(k)); P.mace = lerp(2.75, up ? -0.05 : -1.0, easeOut(k)); P.lean = -1; P.back = 2.6; }
  else if (st === 'smash') { P.arm = lerp(-0.35, 2.35, k); P.mace = lerp(-1.0, 2.6, k); P.lean = 2; P.legs = 'w0'; }
  else if (st === 'recover' || st === 'land') { P.arm = 2.35; P.mace = 2.6; P.lean = 1; P.legs = st === 'land' ? 'squat' : 'w0'; P.lower = st === 'land' ? 2 : 1; }
  else if (st === 'crouch') { P.legs = 'squat'; P.lower = 2; P.arm = 2.7; P.mace = 2.9; }
  else if (st === 'air') { P.arm = 0.3; P.mace = -0.3; P.back = 1.2; }
  else if (st === 'summon') { P.arm = -0.15; P.mace = 0; P.back = 0.5; P.lean = -1; }
  else if (st === 'chargeWind') { P.legs = 'w0'; P.lean = 2; P.lower = 1; P.arm = 2.0; P.mace = 1.9; }
  else if (st === 'charge') { P.lean = 2; P.arm = 1.7; P.mace = 1.65; P.cape = 'run'; P.back = 2.2; }
  else if (st === 'intro') { if (e.stateT > 1.1) return reiSitPose(); P.legs = 'squat'; P.lower = 2; P.arm = 2.0; P.mace = 0.3; }
  if (e.stun > 0) { P.arm = 2.9; P.mace = 3.0; P.lower = 2; P.back = 3.1; P.lean = -1; }
  return P;
}
function reiSitPose() { return { legs: 'sit', lower: -6, lean: 0, cape: 'none', back: 2.0, arm: 2.0, mace: 0.15 }; }

/* ---------- bone heap (collapse, and what is left at the end) ---------- */
const REI_PILE = [
  "..........ooo.........",
  ".........ooxoo........",
  "....o....oxzoO...o....",
  "...oOo..ccooOccoOo....",
  "..ooiiocccOocccooiio..",
  ".oOoiiOoccccccoOoiiOo.",
  "oOooOooOocCccooOoOooOo"
];
function reiPile(crown) {
  return cached('reip:' + (crown ? 1 : 0), () => {
    const M = reiMats(), c0 = heroPaint(REI_PILE, L => M[L], 61), c = mk(c0.width + 2, c0.height + 8), x = c.getContext('2d');
    x.drawImage(c0, 1, 7); if (crown) x.drawImage(reiArt().crown, 7, 4);
    outline(x, c.width, c.height);
    return { r: c, l: flip(c) };
  });
}

/* ---------- the throne (a prop baked into the chunk images) and the carpet ---------- */
function paintThrone() {
  const W = 30, H = 48, g = Array.from({ length: H }, () => Array(W).fill('.'));
  const F = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = ch; };
  // tall back with a pointed top and a skull finial
  for (let y = 5; y < 13; y++) { const h = Math.round((y - 5) * 0.55); F(6 - h, y, 7 + h, y, 'k'); }
  F(2, 13, 11, 36, 'k'); F(1, 13, 1, 34, 'K'); F(12, 14, 12, 35, 'K');
  F(4, 15, 9, 34, 'c'); F(3, 14, 10, 14, 'g'); F(3, 14, 3, 35, 'g'); F(10, 14, 10, 35, 'g');
  F(5, 1, 8, 4, 'o'); g[2][6] = 'x'; g[2][7] = 'x'; g[4][6] = 'z'; g[4][7] = 'z'; F(4, 5, 9, 5, 'g');
  for (const [sx, sy] of [[2, 13], [11, 13]]) { F(sx - 1, sy - 3, sx, sy - 1, 'o'); g[sy - 2][sx - 1] = 'x'; }
  // seat, cushion, armrest and front post
  F(8, 33, 23, 34, 'c'); F(7, 35, 24, 38, 'k'); F(7, 35, 24, 35, 'g');
  F(10, 26, 22, 27, 'k'); F(10, 25, 22, 25, 'g');
  F(21, 25, 23, 47, 'k'); F(21, 39, 23, 39, 'g'); F(20, 21, 24, 24, 'o'); g[22][22] = 'x'; g[22][23] = 'x'; g[24][21] = 'z'; g[24][23] = 'z';
  // base with a sunken panel and a gold band
  F(6, 39, 24, 47, 'k'); F(6, 39, 24, 39, 'g'); F(9, 41, 18, 46, 'K'); F(12, 42, 15, 44, 'r');
  F(5, 47, 25, 47, 'K');
  const M = { k: reiM('#2f2b34', 0.16, { under: true, lip: true }), K: reiM('#18161b', 0.1, { under: true }), c: reiM(REI_COL.cape, 0.2, { under: true }), g: reiM(REI_COL.gold, 0.06, { under: true }), o: reiM(REI_COL.bone, 0.14), x: REI_COL.socket, z: '#2a1c1c', r: reiM(REI_COL.ruby, 0.05, { under: true }) };
  const c0 = heroPaint(g.map(r => r.join('')), L => M[L], 71, null, true), c = mk(W + 2, H + 1), x = c.getContext('2d');
  x.drawImage(c0, 1, 1); outline(x, c.width, c.height);
  return c;
}
const REI_SEAT_X = 17;    // where the seated king's centre sits across the throne (facing right)
function paintCarpet(w) {
  const c = mk(w, 3), x = c.getContext('2d'), R = heroRamp(REI_COL.cape), G = heroRamp(REI_COL.gold);
  for (let i = 0; i < w; i++) {
    const n = hash2(i, 3, 777), worn = n < 0.08;
    x.fillStyle = G[worn ? 1 : 2]; x.fillRect(i, 0, 1, 1);
    x.fillStyle = R[worn ? 1 : n > 0.85 ? 3 : 2]; x.fillRect(i, 1, 1, 1);
    x.fillStyle = R[1]; x.fillRect(i, 2, 1, 1);
  }
  return c;
}

/* ---------- the throne hall: picked from the seed and dressed right before the props go in ---------- */
let THRONE = null;
const reiState = { dead: false };
const _reiPlaceProps = placeProps;
placeProps = function (occ) {
  THRONE = null;
  try { reiPickHall(); } catch (err) { console.error(err); THRONE = null; }
  _reiPlaceProps(occ);
  try { if (THRONE) reiDressHall(); } catch (err) { console.error(err); }
};
// a floor tile you can actually stand on: solid, not a grate or gate, open above (props only go on these)
function reiFloorOk(x, y) { const t = tileAt(x, y), u = tileAt(x, y - 1); return SOLID[t] === 1 && !SEETHRU[t] && t !== GATE && !SOLID[u] && u !== CHAIN; }
function reiPickHall() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, R = mulberry32(seed ^ 0x4e1c0a7);
  const ok = cathRooms.filter(Rm => (Rm.band === 1 || Rm.band === 2) && Rm.w >= 22 && Rm.w <= 46 && Rm.h >= 8 && W1(Rm.x0) > 3 && W1(Rm.x0) + Rm.w < WW - 4 && Rm.kind !== 'vestibulo');
  for (let j = ok.length - 1; j > 0; j--) { const q = (R() * (j + 1)) | 0; [ok[j], ok[q]] = [ok[q], ok[j]]; }
  const I = (x, y) => y * WW + W1(x);
  for (const Rm of ok) {
    const x0 = W1(Rm.x0), x1 = x0 + Rm.w - 1, fy = Rm.fy;
    // the dais needs 7 blocks of real floor (no shaft, hole or grate under it), as close to one end as it fits
    const run = xa => { for (let x = xa; x < xa + 7; x++) { const t = tiles[I(x, fy)]; if (!SOLID[t] || SEETHRU[t]) return false; } return true; };
    let side = R() < 0.5 ? -1 : 1, dx0 = -1;
    for (const s of [side, -side]) { for (let k = 0; k <= Rm.w - 11 && dx0 < 0; k++) { const xa = s < 0 ? x0 + 2 + k : x1 - 8 - k; if (k > (Rm.w >> 1) - 6) break; if (run(xa)) dx0 = xa; } if (dx0 >= 0) { side = s; break; } }
    if (dx0 < 0) continue;
    // clear the hall: decorations, columns and rubble go; chains and holes (the ways in) stay
    for (let k = 0; k < Rm.w; k++) for (let y = Rm.ceil[k]; y < fy; y++) { const i = I(x0 + k, y), t = tiles[i]; if (t !== AIR && t !== CHAIN) tiles[i] = AIR; }
    for (let k = 0; k < Rm.w; k++) { const i = I(x0 + k, fy); if (SOLID[tiles[i]] && !SEETHRU[tiles[i]]) tiles[i] = CT_MOSAICO; }
    for (let x = dx0; x < dx0 + 7; x++) tiles[I(x, fy - 1)] = CT_MARMORE_NEGRO;
    // candles at the foot of the dais, banners down the vault
    for (const x of [dx0 - 1, dx0 + 7]) if (reiFloorOk(x, fy)) tiles[I(x, fy - 1)] = CT_VELAS;
    for (let x = x0 + 3; x <= x1 - 3; x += 6) { const c = Rm.ceil[x - x0]; if (c < fy - 6 && SOLID[tiles[I(x, c - 1)]] && tiles[I(x, c)] === AIR && tiles[I(x, c + 1)] === AIR) { tiles[I(x, c)] = BANNER; tiles[I(x, c + 1)] = BANNER; } }
    Rm.kind = 'trono';
    const throneX = (dx0 + 3.5) * T;            // centre of the dais, px
    THRONE = { Rm, x0, x1, fy, top: Rm.top, ceil: Rm.ceil, side, dais: true, dx0, floorY: fy - 1, throneX, seatX: throneX, facing: -side };
    return;
  }
}
function reiDressHall() {
  const H = THRONE, def = (id, vars, o) => { defProp(id, Object.assign({ nome: id, variantes: vars }, o)); return PROP_DEFS[id]; };
  const sup = (xa, xb, y) => { const a = []; for (let x = xa; x <= xb; x++) a.push(y * WW + x); return a; };
  // the throne on the dais (it falls if the dais under it is broken)
  const tc = paintThrone(), throne = def('trono_rei', [H.facing > 0 ? tc : flip(tc)], { apoio: 'chao', camada: 'frente' });
  const tX = Math.round(H.seatX - (H.facing > 0 ? REI_SEAT_X : tc.width - REI_SEAT_X));
  addProp(throne, 0, tX, H.floorY * T - tc.height, sup(Math.floor(tX / T), Math.floor((tX + tc.width - 1) / T), H.floorY));
  // a worn carpet down the hall to the dais: one strip per stretch of real floor, broken where a shaft or grate cuts it
  const cx0 = H.side < 0 ? H.dx0 + 8 : H.x0 + 1, cx1 = H.side < 0 ? H.x1 - 1 : H.dx0 - 2, runs = [];
  for (let x = cx0, a = -1; x <= cx1 + 1; x++) { const good = x <= cx1 && reiFloorOk(x, H.fy); if (good && a < 0) a = x; if (!good && a >= 0) { if (x - a >= 2) runs.push([a, x - 1]); a = -1; } }
  if (runs.length) { const carpet = def('tapete_rei', runs.map(([a, b]) => paintCarpet((b - a + 1) * T)), { apoio: 'chao', camada: 'frente' }); runs.forEach(([a, b], v) => addProp(carpet, v, a * T, H.fy * T - 3, sup(a, b, H.fy))); }
  // tall candelabra just off the dais, on real floor
  const cand = PROP_DEFS.candelabro_pe;
  if (cand) for (const tx of [H.dx0 - 2, H.dx0 + 8]) {
    const V = cand.vars[0], tw = Math.ceil(V.w / T); let okc = true;
    for (let x = tx; x < tx + tw; x++) { if (!reiFloorOk(x, H.fy) || tileAt(x, H.fy - 1) !== AIR) okc = false; for (let y = H.fy - Math.ceil(V.h / T); y < H.fy; y++) if (SOLID[tileAt(x, y)]) okc = false; }
    if (okc) addProp(cand, 0, tx * T + ((tw * T - V.w) >> 1), H.fy * T - V.h, sup(tx, tx + tw - 1, H.fy));
  }
  // wall torches at eye height, either side of the throne, clear of each other and of the throne
  const torch = PROP_DEFS.tocheiro_parede;
  if (torch) for (const s of [-1, 1]) {
    const V = torch.vars[0], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T), tx = Math.round(H.throneX / T + s * 4.5 - tw / 2), y0 = H.fy - th - 2;
    let okt = true; for (let y = y0; y < y0 + th; y++) for (let x = tx; x < tx + tw; x++) if (SOLID[tileAt(x, y)] || !wallAt(x, y)) okt = false;
    if (okt) addProp(torch, 0, tx * T + ((tw * T - V.w) >> 1), y0 * T + ((th * T - V.h) >> 1), []);
  }
}
function inThroneHall(tx, ty, m = 0) { const H = THRONE; if (!H) return false; tx = wrapX(tx); return tx >= H.x0 + m && tx <= H.x1 - m && ty >= H.top - 1 && ty < H.fy; }

/* ---------- the crown ---------- */
ITEMS.coroa_rei = {
  name: 'Coroa do Rei Esqueleto', slot: 'head', rar: 4, def: 5, hp: 20, g: 1,
  art: ["..r..rr..r..", "..g..gg..g..", "..gg.gg.gg..", "..gGgrrgGg.."], oy: -3, pal: { r: REI_COL.ruby, g: '#e0b040', G: '#a07020' },
  legend: [['sanguinario', 0.02], ['furia', 0.08], ['carniceiro', 5]],
  desc: 'Ouro manchado de séculos. O rei que a usava não aceitou morrer.'
};
DROPS.rei = [['coroa_rei', 1], ['pocao', 1, 2, 4]];
const _reiIcon = makeIcon;
makeIcon = function (id) {
  if (id !== 'coroa_rei') return _reiIcon(id);
  const c = mk(13, 13), x = c.getContext('2d'), rows = ["r...r...r..", "g..ggg..g..", "gg.grg.gg..", "ggggggggg..", "gGgrgGgrgG.", "GGGGGGGGG.."].map(r => r.slice(0, 10));
  const MC = { g: reiM('#e0b040', 0.05, { under: true }), G: reiM('#a07020', 0.05, { under: true }), r: REI_COL.ruby };
  x.drawImage(heroPaint(rows, L => MC[L], 49, null, true), 1, 4);
  const o = outlined(c); let url = ''; try { url = o.toDataURL(); } catch (err) { }
  return { cv: o, url };
};

/* ---------- the boss itself ---------- */
ET.rei = { name: 'O Rei Esqueleto', w: 14, h: 31, hp: REI.hp, dmg: REI.dmg, xp: REI.xp, kb: 0, fly: false, blood: '#e8e0cc', boss: true };
if (typeof UV_STEP !== 'undefined') UV_STEP.rei = 1;
const reiFx = { waves: [], spikes: [], gates: [], remains: [], say: null };
let reiBoss = null;
function reiPhase(e) { return e.revived ? 2 : e.hp <= e.maxHp * REI.p2 ? 1 : 0; }
function reiSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; }
function reiSummons() { let n = 0; for (const m of enemies) if (m.reiMinion && !m.dead) n++; return n; }

function reiStart() {
  const H = THRONE;
  reiGates(true);
  const e = spawnEnemy('rei', H.seatX - 7, H.floorY * T - 31, 6);
  Object.assign(e, { boss: true, lvl: REI.lvl, hp: REI.hp, maxHp: REI.hp, dmg: REI.dmg, xp: REI.xp, gold: 0, facing: H.facing, cd: 1.0, sumCD: 5, revived: false, said: false });
  reiSet(e, 'intro', 2.4);
  reiBoss = e; bossFight = { e, rei: true };
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Rei Esqueleto'; bn.lastChild.textContent = 'senhor da catedral profanada'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  burst(e.x + 7, e.y + 6, 18, '#ffd27a', 60, -40, 0.8, 1, true);
  sfx.gate(); sfx.reiWake(); shake(3);
  showBanner('O Rei Esqueleto', 'senhor da catedral profanada');
}
function reiEnd(won) {
  const e = reiBoss; reiBoss = null; bossFight = null;
  reiGates(false);
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies) if (m.reiMinion && !m.dead) { m.dead = true; m.despawn = true; burst(m.x + m.w / 2, m.y + m.h - 6, 10, '#d8ccae', 60, 300, 0.5); }
  reiFx.waves.length = 0; reiFx.spikes.length = 0; reiFx.say = null;
  if (!won) { if (e) { const k = enemies.indexOf(e); if (k >= 0) enemies.splice(k, 1); } return; }
  reiState.dead = true;
  showBanner('Vitória', 'o Rei Esqueleto caiu');
  saveGame();
}
const _reiEndBoss = endBossFight;
endBossFight = function (won) { if (bossFight && bossFight.rei) return reiEnd(won); return _reiEndBoss(won); };

// iron gates over every gap in the ring around the hall (doorways, shafts, anything dug through)
function reiGates(on) {
  const H = THRONE; if (!H) return;
  if (on) {
    reiFx.gates.length = 0;
    const put = (x, y) => { const i = y * WW + wrapX(x), t = tiles[i]; if (SOLID[t] || t === LAVA) return; reiFx.gates.push([i, t]); tiles[i] = GATE; markDirty(wrapX(x), y); };
    let cMin = H.fy; for (const c of H.ceil) cMin = Math.min(cMin, c);
    for (let y = cMin - 1; y <= H.fy; y++) { put(H.x0 - 1, y); put(H.x1 + 1, y); }
    for (let k = 0; k < H.x1 - H.x0 + 1; k++) { put(H.x0 + k, H.ceil[k] - 1); put(H.x0 + k, H.fy); }
  } else {
    for (const [i, t] of reiFx.gates) if (tiles[i] === GATE) { tiles[i] = t; markDirty(i % WW, (i / WW) | 0); }
    reiFx.gates.length = 0;
  }
  mapVer++;
}

/* ---------- behaviour ---------- */
function reiFloorY(e) { return e.y + e.h; }
AI.rei = function (e, dt, dx, dy, dist) {
  const ph = reiPhase(e), adx = Math.abs(dx);
  e.stateT -= dt; e.cd -= dt; e.sumCD -= dt;
  const face = () => { e.facing = Math.sign(dx) || e.facing; };
  const stop = k => { e.vx = approach(e.vx, 0, (k || 900) * dt); };
  switch (e.state) {
    case 'intro':
      stop();
      if (!e.said && e.stateT < 1.6) { e.said = true; reiSay(e, 'Ajoelhe-se diante do seu rei.'); }
      if (e.stateT <= 0) { reiSet(e, 'walk', 0); sfx.roar(); shake(4); }
      return;
    case 'collapse':
      stop();
      if (e.stateT <= 0) { reiSet(e, 'reform', 1.4); sfx.rattle && sfx.rattle(); }
      return;
    case 'reform':
      stop(); e.hp = Math.round(e.maxHp * REI.revive * clamp(1 - e.stateT / 1.4, 0, 1));
      if (Math.random() < dt * 20) burst(e.x + e.w / 2 + rnd(-8, 8), e.y + e.h - 2, 1, '#d8ccae', 50, 300, 0.4);
      if (e.stateT <= 0) { e.hp = Math.round(e.maxHp * REI.revive); reiSet(e, 'walk', 0); e.cd = 0.6; e.sumCD = 2; reiSay(e, 'Eu sou eterno!'); sfx.roar(); shake(6); burst(e.x + 7, e.y - 2, 26, '#ffd27a', 90, -30, 0.9, 1, true); }
      return;
    case 'wind': case 'raise':
      stop();
      if (e.stateT <= 0) { reiSet(e, 'smash', 0.12); e.hitDone = false; }
      return;
    case 'smash': {
      stop();
      if (!e.hitDone && e.stateT <= 0.05) { e.hitDone = true; reiImpact(e, ph); }
      if (e.stateT <= 0) { reiSet(e, 'recover', REI.rec[ph] + (e.raiseSpikes ? 0.2 : 0)); e.raiseSpikes = false; }
      return;
    }
    case 'recover': case 'land':
      stop();
      if (e.stateT <= 0) { reiSet(e, 'walk', 0); e.cd = REI.cd[ph]; }
      return;
    case 'crouch':
      stop(); face();
      if (e.stateT <= 0) { reiSet(e, 'air', 2); e.vy = -330; e.vx = clamp(dx / 0.72, -210, 210); sfx.reiWhoosh(); }
      return;
    case 'air':
      if (e.onGround && e.stateT < 1.9) {
        reiSet(e, 'land', 0.55); e.vx = 0;
        const fx = e.x + e.w / 2, fy = reiFloorY(e);
        reiWave(fx, fy, -1, 165, REI.dmg * 0.6); reiWave(fx, fy, 1, 165, REI.dmg * 0.6);
        burst(fx, fy - 2, 26, '#8a8378', 120, 380, 0.7); shake(7); sfx.reiSlam(true);
        if (!pl.dead && Math.abs(pl.x + pl.w / 2 - fx) < 20 && Math.abs(pl.y + pl.h - fy) < 20) hurtPlayer(REI.dmg, fx, e, false);
      }
      return;
    case 'summon':
      stop();
      if (!e.summoned && e.stateT < e.stateMax - 0.45) { e.summoned = true; reiRaiseDead(e, ph); }
      if (e.stateT <= 0) { reiSet(e, 'walk', 0); e.cd = REI.cd[ph]; }
      return;
    case 'chargeWind':
      stop(); e.facing = e.chargeDir;
      if (Math.random() < dt * 30) burst(e.x + e.w / 2 - e.facing * 6, reiFloorY(e) - 1, 1, '#8a8378', 40, 300, 0.4);
      if (e.stateT <= 0) { reiSet(e, 'charge', ph === 2 ? 1.5 : 1.7); e.hitDone = false; sfx.roar(); }
      return;
    case 'charge': {
      e.vx = e.chargeDir * (ph === 2 ? 250 : 210); e.facing = e.chargeDir;
      if (Math.random() < dt * 40) parts.push({ x: e.x + e.w / 2 - e.facing * 4, y: reiFloorY(e) - 1, vx: -e.facing * rnd(20, 60), vy: rnd(-60, -20), g: 300, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ffd27a' : '#ff9a3c', size: 1, glow: true });
      if (!e.hitDone && !pl.dead && overlap(e, pl)) { e.hitDone = true; const r = hurtPlayer(Math.round(REI.dmg * 0.9), e.x + e.w / 2 - e.facing * 8, e, false); if (r === 'hit') { pl.vx = e.facing * 260; pl.vy = -170; } }
      if (e.hitWall) { e.vx = 0; reiSet(e, 'recover', 0.4); e.stun = 1.4; shake(7); sfx.reiSlam(true); burst(e.x + e.w / 2 + e.facing * 8, e.y + 8, 22, '#8a8378', 110, 360, 0.6); hitstop = Math.max(hitstop, 0.08); return; }
      if (e.stateT <= 0) { reiSet(e, 'recover', 0.5); }
      return;
    }
  }
  // walking: close in, then pick an attack
  face();
  const want = adx > 26 ? Math.sign(dx) : 0;
  e.vx = approach(e.vx, want * REI.speed[ph], 420 * dt);
  if (e.onGround && e.hitWall && want) e.vy = -240;
  if (Math.random() < dt * 2 && e.onGround && Math.abs(e.vx) > 10) sfx.reiStep && sfx.reiStep();
  if (e.cd > 0 || !e.onGround || pl.dead) return;
  const near = adx < 38 && Math.abs(dy) < 34;
  if (e.sumCD <= 0 && reiSummons() < REI.sumCap[ph] && (!near || Math.random() < 0.3)) { reiSet(e, 'summon', 1.15); e.summoned = false; sfx.reiCall(); return; }
  if (near) { reiSet(e, 'wind', REI.wind[ph]); sfx.reiGrunt(); return; }
  const r = Math.random();
  if (ph === 2 && adx > 40 && r < 0.35) { reiSet(e, 'raise', 0.5); e.raiseSpikes = true; sfx.reiGrunt(); return; }
  if (ph >= 1 && adx > 56 && r < 0.6) { e.chargeDir = Math.sign(dx) || e.facing; reiSet(e, 'chargeWind', 0.55); sfx.reiGrunt(); return; }
  if (adx > 60 && r < 0.85) { reiSet(e, 'crouch', 0.45); return; }
  e.cd = 0.3;
};
// the mace comes down: a heavy hit in front, the floor cracks (and from phase 2 throws out short waves)
function reiImpact(e, ph) {
  const f = e.facing, cx = e.x + e.w / 2, fy = reiFloorY(e), hx = cx + f * 20;
  burst(hx, fy - 2, 18, '#8a8378', 110, 420, 0.6); burst(hx, fy - 3, 8, '#ffd27a', 90, 200, 0.35, 1, true);
  shake(5); sfx.reiSlam(false); hitstop = Math.max(hitstop, 0.05);
  if (!pl.dead) {
    const px0 = pl.x, px1 = pl.x + pl.w, ax0 = Math.min(cx + f * 2, cx + f * 34), ax1 = Math.max(cx + f * 2, cx + f * 34);
    if (px1 > ax0 && px0 < ax1 && pl.y + pl.h > fy - 36 && pl.y < fy + 2) hurtPlayer(REI.dmg, cx, e, false);
  }
  if (ph >= 1) { reiWave(hx, fy, f, 150, REI.dmg * 0.5, 0.7); }
  if (e.raiseSpikes) reiSpikeRow(e, hx, fy, f);
}
function reiWave(x, y, dir, sp, dmg, life) { reiFx.waves.push({ x, y, dir, sp, dmg: Math.round(dmg), life: life || 1.15, max: life || 1.15, hit: false }); }
function reiSpikeRow(e, x, y, dir) {
  for (let i = 1; i <= 7; i++) reiFx.spikes.push({ x: x + dir * i * 15, y, t: -0.08 * i, hit: false, dmg: Math.round(REI.dmg * 0.7) });
  // and one right under you
  if (!pl.dead && pl.onGround) reiFx.spikes.push({ x: pl.x + pl.w / 2, y: pl.y + pl.h, t: -0.2, hit: false, dmg: Math.round(REI.dmg * 0.7) });
}
function reiRaiseDead(e, ph) {
  const H = THRONE, n = Math.min(REI.sumN[ph], REI.sumCap[ph] - reiSummons());
  for (let k = 0; k < n; k++) {
    for (let a = 0; a < 20; a++) {
      const tx = H.x0 + 1 + ((Math.random() * (H.x1 - H.x0 - 1)) | 0), px = tx * T + 2;
      if (Math.abs(px - (pl.x + pl.w / 2)) < 40 || Math.abs(px - (e.x + e.w / 2)) < 20) continue;
      let ty = H.fy - 1; while (ty > H.top && solidAt(tx, ty)) ty--;
      if (!solidAt(tx, ty + 1) || solidAt(tx, ty) || solidAt(tx, ty - 1)) continue;
      const m = spawnEnemy('skeleton', px, (ty + 1) * T - ET.skeleton.h, 6);
      m.reiMinion = true; m.xp = Math.max(1, Math.round(m.xp * 0.4)); m.gold = 0; m.state = 'rise'; m.stateT = typeof UV_RISE === 'number' ? UV_RISE : 0.9; m.facing = Math.sign(pl.x - px) || 1; m.memT = 6;
      burst(px + 4, (ty + 1) * T - 3, 14, '#7a2e8a', 50, -40, 0.7, 1, true);
      break;
    }
  }
  burst(e.x + e.w / 2, e.y - 6, 20, '#c890ff', 70, -30, 0.8, 1, true); shake(2);
}
function reiSay(e, text) { reiFx.say = { text, t: 2.6, e }; }

// a struck king in the middle of his intro or his collapse feels nothing; the first death is not the last
const _reiHit = hitEnemy;
hitEnemy = function (e, dir, mult, melee) {
  if (e.type === 'rei' && (e.state === 'intro' || e.state === 'collapse' || e.state === 'reform')) { burst(e.x + e.w / 2, e.y + e.h - 6, 3, '#d8ccae', 40, 300, 0.3); return; }
  return _reiHit(e, dir, mult, melee);
};
const _reiKill = killEnemy;
killEnemy = function (e) {
  if (e.type === 'rei' && !e.revived && !e.despawn) {
    e.revived = true; e.hp = 0; e.stun = 0; reiSet(e, 'collapse', 3.2); e.vx = 0;
    for (const m of enemies) if (m.reiMinion && !m.dead) { m.dead = true; m.despawn = true; burst(m.x + m.w / 2, m.y + m.h - 6, 12, '#d8ccae', 70, 300, 0.6); }
    reiFx.waves.length = 0; reiFx.spikes.length = 0;
    burst(e.x + e.w / 2, e.y + e.h / 2, 40, '#d8ccae', 140, 420, 0.8); shake(8); hitstop = Math.max(hitstop, 0.2); sfx.reiCollapse();
    return;
  }
  const r = _reiKill(e);
  if (e.type === 'rei' && !e.despawn) { reiFx.remains.push({ x: e.x + e.w / 2, y: e.y + e.h, t: 0, max: 14, facing: e.facing }); sfx.reiCollapse(); }
  return r;
};

/* ---------- every frame ---------- */
HOOK.update.push(dt => {
  if (!THRONE || !pl) return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (!reiState.dead && !bossFight && !pl.dead && state === 'play' && inThroneHall(ptx, pty, 3)) reiStart();
  const e = reiBoss;
  if (e && bossFight && bossFight.rei) {
    // the king left in a stun: whatever he was swinging is gone
    if (e.stun > 0 && (e.state === 'wind' || e.state === 'raise' || e.state === 'chargeWind' || e.state === 'charge' || e.state === 'crouch')) { reiSet(e, 'recover', 0.3); e.raiseSpikes = false; }
    // you got out some other way (dug through the wall): the fight resets
    if (!inThroneHall(ptx, pty, -3) && !pl.dead) endBossFight(false);
  }
  for (let i = reiFx.waves.length - 1; i >= 0; i--) {
    const w = reiFx.waves[i]; w.life -= dt; const nx = w.x + w.dir * w.sp * dt, tx = Math.floor(nx / T), ty = Math.floor((w.y - 1) / T);
    if (w.life <= 0 || solidAt(tx, ty) || !solidAt(tx, ty + 1)) { burst(w.x, w.y - 2, 5, '#8a8378', 50, 300, 0.4); reiFx.waves.splice(i, 1); continue; }
    w.x = nx;
    if (Math.random() < dt * 40) parts.push({ x: w.x + rnd(-2, 2), y: w.y - 2, vx: w.dir * rnd(10, 40), vy: rnd(-90, -40), g: 420, life: 0.35, max: 0.35, col: Math.random() < 0.6 ? '#8a8378' : '#c1b9aa', size: 1 });
    if (!w.hit && !pl.dead && pl.invuln <= 0 && pl.x < w.x + 4 && pl.x + pl.w > w.x - 4 && Math.abs(pl.y + pl.h - w.y) < 5) { w.hit = true; rawDamage(armorTaken(w.dmg), w.dir); }
  }
  for (let i = reiFx.spikes.length - 1; i >= 0; i--) {
    const s = reiFx.spikes[i], was = s.t; s.t += dt;
    if (s.t < 0) continue;
    if (was < 0) { if (solidAt(Math.floor(s.x / T), Math.floor((s.y - 1) / T)) || !solidAt(Math.floor(s.x / T), Math.floor(s.y / T))) { reiFx.spikes.splice(i, 1); continue; } }
    if (s.t < 0.45) { if (Math.random() < dt * 30) parts.push({ x: s.x + rnd(-4, 4), y: s.y - 1, vx: rnd(-10, 10), vy: rnd(-40, -10), g: 300, life: 0.3, max: 0.3, col: '#8a8378', size: 1 }); continue; }
    if (was < 0.45) { sfx.reiSpike(); burst(s.x, s.y - 3, 6, '#d8ccae', 60, 300, 0.4); }
    if (s.t < 0.75 && !s.hit && !pl.dead && pl.invuln <= 0 && pl.x < s.x + 4 && pl.x + pl.w > s.x - 4 && pl.y + pl.h > s.y - 18 && pl.y < s.y) { s.hit = true; rawDamage(armorTaken(s.dmg), Math.sign(pl.x + pl.w / 2 - s.x) || 1); pl.vy = -230; }
    if (s.t > 1.05) reiFx.spikes.splice(i, 1);
  }
  for (let i = reiFx.remains.length - 1; i >= 0; i--) { const r = reiFx.remains[i]; r.t += dt; if (r.t > r.max) reiFx.remains.splice(i, 1); }
  if (reiFx.say) { reiFx.say.t -= dt; if (reiFx.say.t <= 0 || reiFx.say.e.dead) reiFx.say = null; }
});

/* ---------- drawing ---------- */
DRAW_E.rei = function (e, fx, fy, fl) {
  if (e.state === 'collapse' || e.state === 'reform') {
    const p = reiPile(true), img = e.facing > 0 ? p.r : p.l;
    if (e.state === 'collapse') { const sh = e.stateT < 0.6 ? Math.round(Math.sin(e.t * 50)) : 0; lc.drawImage(img, fx - 12 + sh, fy - img.height + 1); return; }
    // pulled back up out of the heap, bottom first
    const k = clamp(1 - e.stateT / 1.4, 0, 1), F = reiFrame(reiPose(Object.assign({}, e, { state: 'walk', onGround: true, vx: 0, stun: 0 }))), src = reiImg(F, e.facing, false);
    lc.globalAlpha = 1 - k; lc.drawImage(img, fx - 12, fy - img.height + 1); lc.globalAlpha = 1;
    const showH = Math.round(lerp(4, 40, easeOut(k))), top = RF_Y - showH, jit = k < 0.85 ? Math.round(Math.sin(e.t * 45) * 0.7) : 0;
    lc.drawImage(src, 0, top, RF_W, showH + 2, fx - RF_X + jit, fy - RF_Y + top + Math.round((1 - k) * 4), RF_W, showH + 2);
    return;
  }
  const sit = e.state === 'intro' && e.stateT > 1.1, F = reiFrame(sit ? reiSitPose() : reiPose(e));
  lc.drawImage(reiImg(F, e.facing, fl), fx - RF_X, fy - RF_Y);
};
let REI_GLOW = null;
function reiGlows() { return REI_GLOW || (REI_GLOW = { eye: glow(4, '#ff3a2a'), crown: glow(12, '#ffcc55'), wave: glow(9, '#ffd27a'), spike: glow(8, '#c8b8ff'), purple: glow(14, '#a060ff') }); }
EYES_E.rei = function (e, fx, fy) {
  const G = reiGlows(), f = e.facing;
  if (e.state === 'collapse') return;
  const sit = e.state === 'intro' && e.stateT > 1.1, low = sit ? -6 : 0;
  const hot = e.state === 'wind' || e.state === 'raise' || e.state === 'chargeWind' || e.state === 'charge' || e.revived;
  lc.globalAlpha = (e.state === 'reform' ? 0.9 * clamp(1 - e.stateT / 1.4, 0, 1) : hot ? 0.8 : 0.45) * (sit ? clamp((2.4 - e.stateT) / 0.8, 0.2, 1) : 1);
  lc.drawImage(G.eye, fx + f * 1.5 - 4, fy - 28.5 + low - 4);
  if (e.revived || e.state === 'summon') { lc.globalAlpha = 0.35 + Math.sin(gameTime * 6) * 0.1; lc.drawImage(G.crown, fx + f * 0.5 - 12, fy - 35 + low - 12); }
  if (e.state === 'summon') { lc.globalAlpha = 0.5; lc.drawImage(G.purple, fx + f * 3 - 14, fy - 52 - 14); }
  lc.globalAlpha = 1;
};
WARN_E.rei = e => e.state === 'wind' || e.state === 'raise' || e.state === 'crouch' || e.state === 'chargeWind';
// the seated king before the fight, his leftover bones after it, the shockwaves and the spikes
HOOK.drawWorld.push((cx, cy) => {
  const H = THRONE; if (!H) return;
  if (!reiState.dead && !(bossFight && bossFight.rei)) {
    const fx = Math.round(H.seatX) - cx, fy = H.floorY * T - cy;
    if (fx > -60 && fx < VW + 60 && fy > -20 && fy < VH + 80) lc.drawImage(reiImg(reiFrame(reiSitPose()), H.facing, false), fx - RF_X, fy - RF_Y);
  }
  for (const r of reiFx.remains) {
    const p = reiPile(false), x = Math.round(r.x) - cx, y = Math.round(r.y) - cy;
    lc.globalAlpha = clamp((r.max - r.t) / 2, 0, 1); lc.drawImage(r.facing > 0 ? p.r : p.l, x - 12, y - p.r.height + 1);
  }
  lc.globalAlpha = 1;
  for (const s of reiFx.spikes) {
    if (s.t < 0) continue;
    const x = Math.round(s.x) - cx, y = Math.round(s.y) - cy;
    if (s.t < 0.45) { lc.fillStyle = '#140c10'; const n = Math.floor(s.t / 0.45 * 4); for (let k = 0; k <= n; k++) lc.fillRect(x - k - 1, y - 1, 1, 1), lc.fillRect(x + k, y - 1, 1, 1); continue; }
    const k = s.t < 0.55 ? (s.t - 0.45) / 0.1 : s.t < 0.8 ? 1 : 1 - (s.t - 0.8) / 0.25, hgt = Math.round(18 * clamp(k, 0, 1));
    if (hgt > 0) { const sp = reiSpikeArt(); lc.drawImage(sp, 0, 0, sp.width, hgt, x - (sp.width >> 1), y - hgt, sp.width, hgt); }
  }
  for (const w of reiFx.waves) {
    const x = Math.round(w.x) - cx, y = Math.round(w.y) - cy, a = clamp(w.life / w.max * 2, 0, 1), sp = reiShardArt();
    lc.globalAlpha = a; lc.drawImage(w.dir > 0 ? sp.r : sp.l, x - 5, y - sp.r.height); lc.globalAlpha = 1;
  }
});
HOOK.drawGlow.push((cx, cy) => {
  const G = reiGlows(), H = THRONE;
  if (H && !reiState.dead && !(bossFight && bossFight.rei)) {
    const fx = Math.round(H.seatX) - cx, fy = H.floorY * T - cy;
    if (fx > -40 && fx < VW + 40) { lc.globalAlpha = 0.25 + Math.sin(gameTime * 1.3) * 0.08; lc.drawImage(G.eye, fx + H.facing * 1.5 - 4, fy - 34.5 - 4); }
  }
  for (const w of reiFx.waves) { lc.globalAlpha = 0.55 * clamp(w.life / w.max * 2, 0, 1); lc.drawImage(G.wave, Math.round(w.x) - cx - 9, Math.round(w.y) - cy - 12); }
  for (const s of reiFx.spikes) if (s.t > 0.45 && s.t < 0.9) { lc.globalAlpha = 0.4; lc.drawImage(G.spike, Math.round(s.x) - cx - 8, Math.round(s.y) - cy - 18); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  const s = reiFx.say; if (!s || s.e.dead) return;
  const e = s.e, x = Math.round(e.x + e.w / 2) - cx, y = Math.round(e.y) - cy - 18;
  lc.globalAlpha = clamp(s.t / 0.4, 0, 1); lc.font = '8px "Jersey 10", monospace'; lc.textAlign = 'center';
  lc.fillStyle = '#140c10'; lc.fillText(s.text, x + 1, y + 1); lc.fillStyle = '#ffd27a'; lc.fillText(s.text, x, y);
  lc.textAlign = 'left'; lc.globalAlpha = 1;
});
function reiSpikeArt() {
  return cached('reispike', () => {
    const rows = ["...o...", "...o...", "..oO...", "..oO...", "..ooO..", "..ooO..", ".oooO..", ".oooOO.", ".ooooO.", ".ooxoO.", ".ooooO.", "oooooOO", "ooOooOO", "ooooooO", "oOoooOO", "ooooooO", "oooOoOO", "ooooooO"];
    const M = reiMats(), c0 = heroPaint(rows, L => M[L], 83), c = mk(c0.width + 2, c0.height + 1), x = c.getContext('2d'); x.drawImage(c0, 1, 1); outline(x, c.width, c.height); return c;
  });
}
function reiShardArt() {
  return cached('reishard', () => {
    const rows = ["......o..", "...o..oo.", "..ooo.ooo", ".oooooooo", "ooooooooo"];
    const M = { o: reiM('#a69e91', 0.25, { lip: true }) }, c0 = heroPaint(rows, L => M[L], 89), c = mk(c0.width + 2, c0.height + 1), x = c.getContext('2d'); x.drawImage(c0, 1, 1); outline(x, c.width, c.height);
    return { r: c, l: flip(c) };
  });
}
// the shockwaves light the floor as they run
const _reiPropLights = propLights;
propLights = function (addL, x0, y0, w, h) { _reiPropLights(addL, x0, y0, w, h); for (const wv of reiFx.waves) addL(wv.x, wv.y - 6, 0.55); };

/* ---------- sounds ---------- */
Object.assign(sfx, {
  reiWake() { tone(55, 1.4, 'sawtooth', 0.09, -10); tone(82, 1.2, 'triangle', 0.06, -20, 0.2); noise(1.0, 0.08, 400, 'lowpass', 0.1); },
  reiSlam(big) { tone(big ? 48 : 70, big ? 0.6 : 0.35, 'square', 0.14, -30); noise(big ? 0.5 : 0.3, 0.3, 380, 'lowpass'); },
  reiGrunt() { tone(110, 0.25, 'sawtooth', 0.07, -40); },
  reiWhoosh() { noise(0.35, 0.12, 900, 'bandpass', 0, 2); },
  reiCall() { tone(140, 0.9, 'sawtooth', 0.07, -50); tone(147, 0.9, 'triangle', 0.05, -48, 0.05); noise(0.8, 0.06, 1800, 'bandpass', 0.1, 4); },
  reiSpike() { noise(0.08, 0.12, 2400, 'bandpass', 0, 3); tone(260, 0.06, 'square', 0.04, 120); },
  reiCollapse() { for (let i = 0; i < 8; i++) noise(0.05, 0.1, 1800 + i * 200, 'bandpass', i * 0.06, 3); tone(60, 0.8, 'sawtooth', 0.08, -20); },
  reiStep() { noise(0.06, 0.08, 300, 'lowpass'); }
});

/* ---------- save: whether the king is dead; a new world puts him back on his throne ---------- */
const _reiMakeSave = makeSave;
makeSave = function () { const o = _reiMakeSave(); o.rei = { dead: reiState.dead }; return o; };
const _reiNewWorld = newWorld;
newWorld = function (sd, sv) {
  reiBoss = null; reiFx.waves.length = 0; reiFx.spikes.length = 0; reiFx.remains.length = 0; reiFx.gates.length = 0; reiFx.say = null;
  const r = _reiNewWorld(sd, sv);
  reiState.dead = !!(sv && sv.rei && sv.rei.dead);
  return r;
};
