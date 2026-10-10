'use strict';

/* ================= A Mãe-Esporo: the boss of the fungal mines =================
   The Gruta da Mãe, the hall 125-fungo-mundo digs in the Coração do Micélio across the world from the shafts
   (64 x 28): a flooded cave the fungus took, a floor of mud under two blocks of water, five mushroom caps at
   different heights, two mycelium cords, and on the back wall her: a 40 x 24 block mass of fungus painted on the
   wall plane with the body of the first colonist of Ferroalto in the middle, arms open. She does not move. Only the
   bulbs take damage (glowing sacs that open in 6 places, 3 at a time; a blow anywhere else on the wall just
   sparks); her life is what the bulbs give up. Step in and walls of mycelium close both doors (leaving the hall,
   by portal or by dying, resets the fight). Three phases, every blow shown before it lands:
     1. an arm of mycelium (the wall swells and glows in a line at your height, then it lashes out 14 blocks),
        spore rain (clusters on the roof light up, circles on the floor, clouds fall), brotos from a bulb every 20 s
     2. under 60%: the floor turns to living mycelium (slow), the water rises to 5 rows and goes bad (it hurts),
        roots crack along the mud and spike up, she breathes in (dust runs to her, then she pulls you to her; a
        cord holds you), and the arm comes twice
     3. under 30%: the cave goes dark (only the bulbs and her chest glow), the water reaches 8 rows (breath counts),
        the caps tremble and sink one by one until two are left, her chest opens (the last weak point), moths come
   Drops the Lampião da Mãe-Esporo (legendary accessory: a cyan light, life back while standing still, whoever hits
   you up close gets spored) and, the first time, one of the layer's three bases. Her death is saved (maeEsporo).
   Plugs in like the Rei Goblin (85): fungDress (125 calls it), spawnEnemy, endBossFight, hitEnemy, killEnemy,
   hurtPlayer, recalc, breakTile, paintProps (the wall is painted into the chunks), propLights, makeSave and
   newWorld are wrapped; the rest through DRAW_E/HOOK. Loads before 49 (BAL scaling) and before 171 (the water). */

// level from the layer's place in the list (129: 2n + 3, 13 as the 5th); written numbers like the monsters', 49 scales
const MAE_L = layerBossLvl('fungo');
const MAE = { hp: Math.round(330 * (1 + 0.3 * (MAE_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (MAE_L - 1))), xp: 400, p2: 0.6, p3: 0.3, bulb: 0.11 };
const maeState = { dead: false };
const maeFx = { gates: [], arms: [], spores: [], roots: [], inhale: null, sink: null, vivo: null, spark: null, bulbHit: -1, frame: 0, dark: 0 };
const maeWater = { cur: 2, target: 2, t: 0, tipo: 0 };
const maeSlots = [];   // the 6 bulb places: { e, cd }
let maeBoss = null, maeChest = null, maeCapT = [], maeG0 = null, maeGeoC = null;
ET.maeesporo = { name: 'A Mãe-Esporo', w: 480, h: 288, hp: MAE.hp, dmg: MAE.dmg, xp: MAE.xp, kb: 0, fly: true, phase: true, blood: '#a0686c', boss: true };
ET.maebulbo = { name: 'Bulbo', w: 22, h: 22, hp: 40, dmg: 0, xp: 0, kb: 0, fly: true, phase: true, blood: '#8ad86a', boss: true };
const MAE_DROPS = [['lampiao_mae', 1], ['pocao', 1, 2, 4], ['min_esporita', 1, 6, 10], ['fio_micelio', 1, 4, 8], ['chapeu_lanterna', 1, 2, 4], ['po_mariposa', 1, 2, 4]];
DROPS.maeesporo = []; DROPS.maebulbo = [];

/* ---------- the hall's layout (columns from the hall's centre, rows from its floor) ---------- */
const MAE_CAPS = [[-28, -23, -3], [-20, -15, -5], [-11, -6, -8], [-4, 4, -11], [6, 12, -8]];   // a, b, top row (stand on it)
const MAE_SINK = [2, 1, 0];                                    // in the third phase these sink, in this order (two stay)
const MAE_CORDS = [[13, -1], [-9, -9]];                         // column, lowest row
const MAE_DEATH_CORD = 22;
const MAE_SLOTS = [[-12, -3.5, 0], [17, -3.5, 0], [-14, -10, 1], [14, -11, 1], [-7, -16, 2], [7, -16, 2]];   // bulb centres, height class
const MAE_CHEST = [0, -14];
const MAE_CORE = { x0: 226, y0: 78, x1: 254, y1: 160 };        // her body, in wall pixels: touching it while she breathes in hurts
const MAE_AW = 480, MAE_AH = 288, MAE_ACX = 240, MAE_ACY = 120;  // the wall art, her chest in it

// geometry in tiles, unwrapped round the hall's centre
function maeGeo() {
  const B = fungBoss; if (!B) return null;
  if (maeGeoC && maeG0 === B) return maeGeoC;
  maeG0 = B;
  return maeGeoC = { cx: B.cx, fy: B.fy, top: B.top, x0: B.cx - (B.w >> 1), x1: B.cx - (B.w >> 1) + B.w - 1, ax0: B.cx - 20, ay0: B.fy - 24 };
}
// a world x (px) on the same lap of the ring as the hero
const maeLap = x => { const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
function inMaeHall(tx, ty, m = 0) {
  const B = fungBoss; if (!B) return false;
  const e = Math.max(0, -m);
  return Math.abs(wdx(wrapX(tx) - B.cx)) <= (B.w >> 1) - m && ty >= B.top - 1 - e && ty < B.fy + e;
}
// the hall with its shell: what nothing may break while she fights
function maeGuard(tx, ty) { const B = fungBoss; if (!B) return false; return Math.abs(wdx(wrapX(tx) - B.cx)) <= (B.w >> 1) + 3 && ty >= B.top - 4 && ty <= B.fy + 2; }
function maeDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }

/* ---------- the dressing (125 calls fungDress during the build) ---------- */
function maeCapCells(k, t) {
  const G = maeGeo(), [a, b] = MAE_CAPS[k], out = [];
  for (let x = a + 1; x < b; x++) out.push([G.cx + x, G.fy + t]);
  for (let x = a; x <= b; x++) out.push([G.cx + x, G.fy + t + 1]);
  return out;
}
function maeCordPut(col, bot) {
  const G = maeGeo(), x = wrapX(G.cx + col);
  let y = G.fy - 12; while (y > G.top - 6 && !SOLID[tiles[y * WW + x]]) y--;
  const cells = [];
  for (let yy = y + 1; yy <= G.fy + bot; yy++) { const i = yy * WW + x; if (SOLID[tiles[i]]) break; tiles[i] = FG_CORDAO; cells.push(i); }
  return cells;
}
function fungDress() {
  const G = maeGeo(); if (!G) return;
  maeGeoC = null; const g = maeGeo();
  const I = (x, y) => y * WW + wrapX(x), keep = i => fungKeep.add(i);
  // the inside: nothing loose, a wall of flesh behind
  for (let y = g.top - 2; y < g.fy; y++) for (let x = g.x0; x <= g.x1; x++) {
    const i = I(x, y), t = tiles[i];
    if (t !== AIR && !SOLID[t]) tiles[i] = AIR;
    if (!SOLID[tiles[i]]) walls[i] = WFG_CARNE;
  }
  // a mud floor, solid under it
  for (let x = g.x0 - 1; x <= g.x1 + 1; x++) { tiles[I(x, g.fy)] = FG_LODO; keep(I(x, g.fy)); const j = I(x, g.fy + 1); if (!SOLID[tiles[j]]) tiles[j] = FG_LODO; }
  // a door on each side at floor level: a sill two blocks high (keeps the water in), four rows of air over it, cut
  // through to the first open tunnel
  for (const d of [-1, 1]) {
    const wx = d < 0 ? g.x0 - 1 : g.x1 + 1;
    let xb = wx;
    for (let k = 0; k < 18; k++) {
      const x = wx + d * k; let air = 0; xb = x;
      for (let y = g.fy - 6; y <= g.fy - 3; y++) { const i = I(x, y); if (!SOLID[tiles[i]]) air++; else if (tiles[i] !== BEDROCK) tiles[i] = AIR; if (!walls[i]) walls[i] = WFG_CARNE; keep(i); }
      // a flat floor level with the sill all the way through (no pit the hero can't jump out of)
      for (let y = g.fy - 2; y <= g.fy + 2; y++) { const i = I(x, y); if (k < 2 || !SOLID[tiles[i]]) { tiles[i] = FG_LODO; keep(i); } }
      if (k > 1 && air >= 3) break;
    }
    // and a few steps down into the tunnel past it
    for (let j = 1; j <= 3; j++) for (let y = g.fy - 2 + j; y <= g.fy + 2; y++) { const i = I(xb + d * j, y); if (!SOLID[tiles[i]]) { tiles[i] = FG_LODO; keep(i); } }
    // the sill against the hall, the whole height of the water
    for (let y = g.fy - 2; y <= g.fy; y++) { tiles[I(wx, y)] = FG_LODO; keep(I(wx, y)); }
  }
  // the caps and the cords
  maeCapsAll();
  for (const [c, bot] of MAE_CORDS) for (const i of maeCordPut(c, bot)) keep(i);
  if (maeState.dead) maeCordPut(MAE_DEATH_CORD, -1);
  for (let k = 0; k < MAE_CAPS.length; k++) for (const [x, y] of maeCapCells(k, MAE_CAPS[k][2])) keep(I(x, y));
  // nothing of the generic dressing stays in it
  for (let n = PROPS.length - 1; n >= 0; n--) { const p = PROPS[n]; if (inMaeHall(Math.floor((p.X + p.w / 2) / T), Math.floor((p.Y + p.h / 2) / T), -2)) fungDropProp(p); }
  // the water: two rows over the mud, filled with the other basins (fungWater, at the end of the build)
  // what the dressing laid, to lay again over the ash the abyss (108) creeps up into the last rows of the layer
  const X0 = g.x0 - 20, n = g.x1 - g.x0 + 41, Y0 = g.top - 6, m = g.fy + 2 - Y0;
  maeSnap = { X0, Y0, n, m, t: new Uint16Array(n * m), w: new Uint16Array(n * m) };
  for (let y = 0; y < m; y++) for (let x = 0; x < n; x++) { const i = I(X0 + x, Y0 + y); maeSnap.t[y * n + x] = tiles[i]; maeSnap.w[y * n + x] = walls[i]; }
  fungBasins.push({ x: g.cx - 30, y: g.fy - 1, nivel: g.fy - 2, tipo: maeState.dead ? AGUA_LIMPA : AGUA_PLANCTON, max: 2 * (g.x1 - g.x0 + 1) + 60, box: [wrapX(g.x0), wrapX(g.x1), g.fy - 2, g.fy - 1], plugged: true, mae: true });
}
let maeSnap = null;
function maeUnash() {
  const S = maeSnap; if (!S || typeof AB_SOILS === 'undefined') return;
  for (let y = 0; y < S.m; y++) for (let x = 0; x < S.n; x++) {
    const i = (S.Y0 + y) * WW + wrapX(S.X0 + x), k = y * S.n + x;
    if (AB_SOILS[tiles[i]] && !AB_SOILS[S.t[k]] && SOLID[S.t[k]]) tiles[i] = S.t[k];
    if (walls[i] !== S.w[k] && typeof WAB_CINZA !== 'undefined' && walls[i] === WAB_CINZA) walls[i] = S.w[k];
  }
}
// 128 fills the basins again at the very end of the build, after the abyss: the hall is put back first
{ const _fw = fungWater; fungWater = function () { try { maeUnash(); } catch (err) { console.error(err); } return _fw.apply(this, arguments); }; }
// the five caps where the layout puts them (anything else of cap inside goes)
function maeCapsAll() {
  const g = maeGeo(); if (!g) return;
  for (let y = g.top; y < g.fy; y++) for (let x = g.x0; x <= g.x1; x++) { const i = y * WW + wrapX(x); if (tiles[i] === FG_CHAPEU) tiles[i] = AIR; }
  maeCapT = MAE_CAPS.map(c => c[2]);
  for (let k = 0; k < MAE_CAPS.length; k++) maeCapPut(k, maeCapT[k], true);
}
function maeCapPut(k, t, on) {
  for (const [x, y] of maeCapCells(k, t)) {
    const gx = wrapX(x), i = y * WW + gx;
    if (on) {
      if (SOLID[tiles[i]]) continue;
      if (pl && !pl.dead && state === 'play' && overlap({ x: maeLap(gx * T), y: y * T, w: T, h: T }, pl)) continue;   // never inside the hero
      tiles[i] = FG_CHAPEU; if (agua.length) agua[i] = 0;
    } else if (tiles[i] === FG_CHAPEU) tiles[i] = AIR;
    if (chunks.size) markDirty(gx, y);
  }
}

/* ---------- the water: written row by row (171's `agua`), one row every 0.3 s ---------- */
function maeWaterSet() {
  const g = maeGeo(); if (!g || !agua.length) return;
  const tipo = maeWater.tipo || (maeState.dead ? AGUA_LIMPA : AGUA_PLANCTON), lim = g.fy - maeWater.cur;
  for (let y = g.top - 1; y < g.fy; y++) for (let x = g.x0; x <= g.x1; x++) {
    const i = y * WW + wrapX(x);
    if (y >= lim && aguaCabe(i)) agua[i] = tipo; else if (agua[i]) agua[i] = AGUA_SECO;
  }
}
function maeWaterTick(dt) {
  if (maeWater.cur === maeWater.target) return;
  if ((maeWater.t -= dt) > 0) return;
  maeWater.t = 0.3; maeWater.cur += Math.sign(maeWater.target - maeWater.cur);
  maeWaterSet();
  const g = maeGeo(); if (g && Math.abs(wdx(Math.floor((pl.x + pl.w / 2) / T) - g.cx)) < 50) sfx.maeAgua(maeWater.target > maeWater.cur || maeWater.cur === maeWater.target);
}

/* ---------- the doors: walls of mycelium over every way out while she fights ---------- */
function maeGates(on) {
  const g = maeGeo(); if (!g) return;
  if (on) {
    maeFx.gates.length = 0;
    const inBox = (x, y) => x >= g.x0 && x <= g.x1 && y >= g.top - 2 && y < g.fy, seen = new Set();
    for (let y = g.top - 2; y < g.fy; y++) for (let x = g.x0; x <= g.x1; x++) {
      if (SOLID[tiles[y * WW + wrapX(x)]]) continue;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (inBox(nx, ny)) continue;
        const i = ny * WW + wrapX(nx), t = tiles[i]; if (SOLID[t] || seen.has(i)) continue;
        seen.add(i); maeFx.gates.push([i, t]); tiles[i] = FG_BARREIRA; if (agua.length) agua[i] = 0; markDirty(wrapX(nx), ny);
        burst(maeLap(wrapX(nx) * T + 6), ny * T + 6, 3, '#d6caa8', 30, 60, 0.5);
      }
    }
    sfx.maeMuralha();
  } else {
    for (const [i, t] of maeFx.gates) if (tiles[i] === FG_BARREIRA) { tiles[i] = t; markDirty(i % WW, (i / WW) | 0); burst(maeLap((i % WW) * T + 6), ((i / WW) | 0) * T + 6, 5, '#b0a286', 40, 160, 0.6); }
    maeFx.gates.length = 0;
  }
  mapVer++;
}
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type !== 'maeesporo' && type !== 'maebulbo' && fungBoss && !(bossFight && bossFight.mae) && inMaeHall(Math.floor((px + e.w / 2) / T), Math.floor((py + e.h / 2) / T), -2)) maeDrop(e);
  return e;
}; }
// nothing breaks the hall while she fights in it
{ const _bt = breakTile; breakTile = function (tx, ty) { if (bossFight && bossFight.mae && maeGuard(tx, ty)) return; return _bt(tx, ty); }; }

/* ---------- the lantern ---------- */
STAT_DEF.lgParado = { t: 'Parado por 1 s, restaura X de vida por segundo' };
STAT_DEF.lgEsporo = { t: 'Quem te acerta de perto fica esporado', flag: 1 };
STAT_KEYS.push('lgParado', 'lgEsporo');
ICON_ART.maeLamp = [["....k....", "...kWk...", "..kmmmk..", ".kmCcCmk.", ".kCcWcCk.", ".kcWWWck.", ".kCcWcCk.", ".kmCcCmk.", "..kmmmk..", "...kkk..."], { k: '#1a2024', m: '#a89c7e', C: '#1e7a6a', c: '#6ad4b4', W: '#c8fce8' }];
ITEMS.lampiao_mae = {
  name: 'Lampião da Mãe-Esporo', slot: 'acc', rar: 4, hp: 15, icon: 'maeLamp',
  legend: [['light', 4], ['lgParado', 2], ['lgEsporo', 1]],
  desc: 'O coração da primeira colona, preso numa gaiola de micélio. A luz é fria e não apaga.'
};
BASE_INFO.lampiao_mae = [MAE_L];
ITEM_G.lampiao_mae = 0; ITEMS.lampiao_mae.g = 0;
DROPS.maeesporo = MAE_DROPS.filter(([id]) => ITEMS[id]);
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let p = 0, s = 0;
  for (const k of EQ_SLOTS) if (equip[k]) { const st = itemStats(equip[k]); p += st.lgParado || 0; s += st.lgEsporo || 0; }
  if (pl.lg) { pl.lg.maeParado = p; pl.lg.maeEsporo = s > 0; }
  return r;
}; }
// whoever hits you up close gets spored: a slow damage for 3 s
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const r = _hp(dmg, srcX, src, isProj);
  if (r === 'hit' && src && !isProj && !src.dead && pl.lg && pl.lg.maeEsporo && src.type !== 'maeesporo') { src.maeSpT = 3; src.maeSpD = Math.max(1, Math.round((pl.dmgMin + pl.dmgMax) * 0.1)); burst(src.x + src.w / 2, src.y + src.h / 2, 8, '#9ae06a', 40, -20, 0.8, 1, true); }
  return r;
}; }
HOOK.update.push(dt => {
  if (!pl || state !== 'play') return;
  // spored monsters
  for (const e of enemies) {
    if (!(e.maeSpT > 0) || e.dead) continue;
    e.maeSpT -= dt; e.maeSpA = (e.maeSpA || 0) + e.maeSpD * dt;
    if (Math.random() < dt * 8) parts.push({ x: e.x + rnd(0, e.w), y: e.y + rnd(0, e.h), vx: rnd(-6, 6), vy: rnd(-16, -6), g: -6, life: 0.8, max: 0.8, col: Math.random() < 0.5 ? '#9ae06a' : '#d8f0a0', size: 1, glow: true });
    if (e.maeSpA >= 1) { const d = Math.floor(e.maeSpA); e.maeSpA -= d; e.hp -= d; e.flash = 0.05; e.showHp = 2; floatText(e.x + e.w / 2, e.y - 4, String(d), '#9ae06a', 0.75); if (e.hp <= 0) killEnemy(e); }
  }
  // standing still a second: life back
  if (!pl.lg || !pl.lg.maeParado || pl.dead) { pl.maeStill = 0; return; }
  const still = pl.onGround && Math.abs(pl.vx) < 4 && pl.atkT < 0 && !pl.mining && !(pl.useT > 0);
  pl.maeStill = still ? (pl.maeStill || 0) + dt : 0;
  if (pl.maeStill >= 1 && pl.hp < pl.maxHp) {
    pl.maeRg = (pl.maeRg || 0) + pl.lg.maeParado * dt;
    if (pl.maeRg >= 1) { const h = Math.floor(pl.maeRg); pl.maeRg -= h; pl.hp = Math.min(pl.maxHp, pl.hp + h); }
    if (Math.random() < dt * 6) parts.push({ x: pl.x + rnd(0, pl.w), y: pl.y + pl.h - rnd(0, 6), vx: rnd(-4, 4), vy: rnd(-24, -10), g: -4, life: 0.9, max: 0.9, col: Math.random() < 0.5 ? '#6ad4b4' : '#c8fce8', size: 1, glow: true });
  }
});

/* ---------- art ---------- */
const MAEA = {};
{
const { cg } = FGART;
const RAMPS = [];
const R6 = hexes => { const R = hexes.map(h => ph(h)); R.k = RAMPS.length; RAMPS.push(R); return R; };
const PAL = {
  vivo: {
    carne: R6(['#2a1a20', '#4a2c34', '#74464e', '#a0686c', '#c89490', '#ecc8bc']),
    veia: R6(['#2a141c', '#4a2230', '#6e3442', '#8a4a58', '#b87480', '#d8a0a4']),
    myc: R6(['#2e2a22', '#4a4436', '#7a705a', '#a89c7e', '#cabf9c', '#e2d8b6']),
    tom: R6(['#1a2024', '#2e383a', '#4a5652', '#74807a', '#a8b2a6', '#d8e0d0']),
    esp: R6(['#0c2a2a', '#145048', '#1e7a6a', '#34a890', '#6ad4b4', '#c8fce8']),
    chap: R6(['#0e2a2e', '#16444a', '#1e6a6e', '#3a9a94', '#7accc0', '#c4f4e6']),
    tron: R6(['#2a2a26', '#48463e', '#6e6a5c', '#9a9480', '#c4bca2', '#e6dec4']),
    sac: R6(['#1a1912', '#33311f', '#524f30', '#7a7648', '#a39e6a', '#ccc496']),
    pele: R6(['#2a1e1a', '#4a3630', '#6e5448', '#927262', '#b2927c', '#ccb09a']),
    roupa: R6(['#1a1418', '#2c2228', '#40323a', '#564450', '#6c5864', '#84707a']),
    avental: R6(['#1c1c18', '#302e28', '#48453c', '#626052', '#7c796a', '#969282']),
    cabelo: R6(['#100a08', '#1c130e', '#2a1d15', '#3a291d', '#4c3726', '#5e4632'])
  },
  morto: {
    carne: R6(['#121110', '#1e1c1a', '#2e2b27', '#403c36', '#55504a', '#6c665e']),
    veia: R6(['#100f0e', '#1a1816', '#26231f', '#33302a', '#433f38', '#555048']),
    myc: R6(['#181715', '#262420', '#38352f', '#4c4840', '#625d53', '#7a7468']),
    tom: R6(['#141414', '#202121', '#2f3130', '#424543', '#575b58', '#6e726e']),
    esp: R6(['#0e1110', '#171c1a', '#222927', '#2e3734', '#3c4642', '#4c5752']),
    chap: R6(['#0f1212', '#181d1d', '#232a2a', '#303838', '#3f4848', '#505a5a']),
    tron: R6(['#161614', '#24231f', '#35332d', '#48453e', '#5d5950', '#746f64']),
    sac: R6(['#121210', '#1d1c18', '#2a2822', '#38362e', '#48453c', '#5a564a']),
    pele: R6(['#141312', '#211f1d', '#312e2a', '#433f3a', '#58534c', '#6e685f']),
    roupa: R6(['#121112', '#1d1b1d', '#2b282b', '#3b373a', '#4d484b', '#615b5e']),
    avental: R6(['#131312', '#1f1e1c', '#2d2c28', '#3e3c37', '#514e48', '#66625a']),
    cabelo: R6(['#0c0a09', '#15120f', '#1f1a16', '#2a231e', '#362e27', '#433930'])
  }
};
// value noise without a period (the wall is wider than the 240 px textures), -0.5..0.5
const sm = t => t * t * (3 - 2 * t);
function nz(x, y, sc, s) {
  const fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy), ux = sm(fx - ix), uy = sm(fy - iy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy - 0.5;
}
// cells: nearest and second nearest feature point on a jittered grid
const VC = { d1: 0, d2: 0, id: 0, ox: 0, oy: 0, cx: 0, cy: 0 };
function vor(x, y, cs, s) {
  const gx = Math.floor(x / cs), gy = Math.floor(y / cs); let d1 = 1e9, d2 = 1e9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = gx + i, cy = gy + j, px = (cx + hash2(cx, cy, s)) * cs, py = (cy + hash2(cx, cy, s + 1)) * cs, d = Math.hypot(x - px, y - py);
    if (d < d1) { d2 = d1; d1 = d; VC.id = hash2(cx, cy, s + 2); VC.ox = x - px; VC.oy = y - py; VC.cx = px; VC.cy = py; } else if (d < d2) d2 = d;
  }
  VC.d1 = d1; VC.d2 = d2; return VC;
}
// the painter: each ramp remembers its index, so the outline can take the darkest tone of what it rims
function pp(w, h) {
  const c = new Uint32Array(w * h), rid = new Int16Array(w * h).fill(-1);
  const P = {
    w, h, c, rid,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; c[i] = R[v < 0 ? 0 : v > 5 ? 5 : v | 0]; rid[i] = R.k; },
    has(x, y) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0; },
    blob(cx, cy, rx, ry, R, s, base = 2.6, f) {
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
        const e = f ? f(x, y, dx, dy) : 0; if (e === null) continue;
        P.put(x, y, R, base + 1.2 - (dx * 0.8 + dy) * 1.3 - d * 0.7 + cg(x, y, s) * 0.5 + e);
      }
    },
    tube(ax, ay, bx, by, r0, r1, R, s, base = 2.4, f) {
      const m = Math.max(r0, r1) + 1, x0 = Math.floor(Math.min(ax, bx) - m), x1 = Math.ceil(Math.max(ax, bx) + m), y0 = Math.floor(Math.min(ay, by) - m), y1 = Math.ceil(Math.max(ay, by) + m);
      const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5, t = clamp(((px - ax) * vx + (py - ay) * vy) / L2, 0, 1), qx = ax + vx * t, qy = ay + vy * t, r = r0 + (r1 - r0) * t;
        const nx = (px - qx) / r, ny = (py - qy) / r, d = nx * nx + ny * ny; if (d > 1) continue;
        const e = f ? f(x, y, t, nx, ny) : 0; if (e === null) continue;
        P.put(x, y, R, base + 0.9 - (nx * 0.8 + ny) * 1.4 - d * 0.8 + cg(x, y, s) * 0.5 + e);
      }
    },
    // the darkest tone of each ramp where the sprite meets air (mask: only these pixels)
    outline(mask) {
      const o = c.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!c[i] || (mask && !mask[i])) continue;
        const air = (x > 0 && !c[i - 1]) || (x < w - 1 && !c[i + 1]) || (y > 0 && !c[i - w]) || (y < h - 1 && !c[i + w]);
        if (air) o[i] = RAMPS[rid[i]][0];
      }
      c.set(o);
    },
    canvas() { const cv = mk(w, h), x = cv.getContext('2d'), im = x.createImageData(w, h); new Uint32Array(im.data.buffer).set(c); x.putImageData(im, 0, 0); return cv; }
  };
  return P;
}
const flipC = cv => { const o = mk(cv.width, cv.height), x = o.getContext('2d'); x.translate(cv.width, 0); x.scale(-1, 1); x.drawImage(cv, 0, 0); return o; };
// the mass's density: > 0 inside. A wide mound sitting on the floor, lumpy along the top
function mass(x, y, dead) {
  const dx = (x - MAE_ACX) / 230, dy = (y - 170) / (y < 170 ? 164 : 120);
  let d = dx * dx + dy * dy;
  const fl = Math.max(0, (y - 210) / 78); d -= fl * fl * 1.1;
  d += nz(x, y, 56, 7101) * 0.62 + nz(x, y, 20, 7102) * 0.26 + nz(x, y, 7, 7103) * 0.07;
  return 1 - d - (dead ? 0.07 : 0);
}
/* the wall: 480 x 288, her chest at (240, 120). Flesh in soft lumps lit from the top left, cords of mycelium
   running in to her from every side, veins, pores, plates of esporita, mushrooms and spore sacs on the rim, the six
   puckered scars where the bulbs open, and her: the first colonist, arms open, eaten by the cream threads */
function paintWall(dead) {
  const P = pp(MAE_AW, MAE_AH), Q = dead ? PAL.morto : PAL.vivo, S = dead ? 7300 : 7200, spots = [];
  const plates = new Set();
  for (let y = 0; y < MAE_AH; y++) for (let x = 0; x < MAE_AW; x++) {
    const m = mass(x, y, dead);
    const a = Math.atan2(y - MAE_ACY, x - MAE_ACX), r = Math.hypot(x - MAE_ACX, (y - MAE_ACY) * 1.15);
    // the cords: bands of angle round her, broken along their length
    const NB = 20, band = a * NB / Math.PI + nz(x, y, 70, 7104) * 2.6 + nz(x, y, 22, 7114) * 0.7 + Math.sin(r * 0.05 + a * 3) * 0.25, bi = Math.round(band);
    const ov = nz(bi * 300 + 17, r, 34, 7106) - (r < 120 ? -0.32 : -0.06), tap = clamp(ov * 7, 0, 1);   // broken along its length, tapering to the breaks
    const bpx = Math.max(1, r * Math.PI / NB), hw = clamp(3.6 - r / 110, 1.3, 3.4) * (0.7 + 0.6 * hash2(bi, 3, 7105)) * (0.35 + 0.65 * tap), f = (band - bi) * bpx / hw;
    const wc = 1, on = ov > 0 && hash2(bi, 9, 7115) < 0.8;
    const cord = r > 50 && Math.abs(f) < wc && on;
    if (m <= 0) {
      // threads reaching past the rim over the bare wall
      if (cord && m > -0.28 && Math.abs(f) < 0.5 + (1 + m * 3) * 0.5 && !(dead && hash2(x >> 2, y >> 2, 7107) < 0.4)) {
        const t = f / wc, L = (Math.sin(a) - Math.cos(a)) * 0.7;
        P.put(x, y, Q.myc, 2.6 + t * L * 1.4 - t * t * 0.8 + cg(x, y, S) * 0.5 + m * 3);
      }
      continue;
    }
    if (dead && nz(x, y, 13, 7108) > 0.27 && m < 0.55) continue;   // withered: it fell away in places
    let R = Q.carne, v;
    // soft lumps of flesh, each lit from the top left
    const c = vor(x + nz(x, y, 18, S + 5) * 10, y + nz(x, y, 18, S + 6) * 10, 15, S + 1), e = c.d2 - c.d1;
    const rr = c.d1 / (c.d1 + c.d2) * 2;   // 0 in the middle of a lump, 1 on its rim
    v = 2.9 - (c.ox + c.oy) / 14 * 1.1 - rr * rr * 1.3 + nz(x, y, 30, S + 2) * 0.9 + cg(x, y, S + 3) * 0.55;
    if (e < 0.9) v -= 1.0;
    v += -(x - MAE_ACX) / MAE_AW * 0.8 - (y - 140) / MAE_AH * 0.9;   // the light falls from the top left
    v -= Math.max(0, 0.3 - m) * 4;                                    // thinner and darker at the rim
    if (r < 90) v -= (90 - r) / 90 * 0.6;                             // the hollow round her
    // veins
    const vn = Math.abs(nz(x, y, 26, S + 7));
    if (vn < 0.009 && !cord) { R = Q.veia; v = vn < 0.004 ? 1.4 : 2.4; }
    else if (vn < 0.016 && !cord) v -= 0.6;
    // pores
    const p = vor(x + 500, y, 9, S + 9);
    if (!cord && p.id < 0.1 && p.d1 < 1.5) v = p.oy < 0 ? 0.6 : v + 0.6;
    if (cord) {   // a round cord, cream, lit on the side facing the top left
      const t = f / wc, L = (Math.sin(a) - Math.cos(a)) * 0.7;
      R = hash2(bi, 5, 7109) < 0.25 ? Q.tom : Q.myc;
      v = 3.0 + t * L * 1.5 - t * t * 1.1 + cg(x, y, S + 4) * 0.5 - Math.max(0, 0.3 - m) * 3 + (Math.sin(r * 0.55 + bi) > 0.8 ? -0.7 : 0);
    }
    // plates of esporita stuck in the flesh
    const q = vor(x + 900, y + 300, 30, S + 11);
    if (q.id < 0.16 && !cord && m > 0.12) {
      const sz = 3 + q.id * 22, ax = Math.abs(q.ox), ay = Math.abs(q.oy);
      if (ax * 0.7 + ay < sz && ax < sz * 1.1) {
        R = Q.esp; v = 3.2 - (q.ox + q.oy) / sz * 1.1 + cg(x, y, S + 12) * 0.4;
        if (ax * 0.7 + ay > sz - 1) v -= 1.4; else if (q.ox + q.oy < -sz * 0.6) v += 1.2;
        if (!dead) { const key = Math.round(q.cx) * 1000 + Math.round(q.cy); if (!plates.has(key)) { plates.add(key); spots.push([q.cx, q.cy, sz]); } }
      }
    }
    if (dead && Math.abs(nz(x, y, 30, 7110)) < 0.008) v = 0.3;      // cracks
    if (!dead && R === Q.carne && hash2(x, y, S + 13) < 0.0015 && v > 3) v = 5;   // a wet glint
    P.put(x, y, R, v);
  }
  // mushrooms in clumps on the rim, spore sacs
  for (let n = 0; n < 70; n++) {
    const x = hash2(n, 1, S + 20) * MAE_AW, y = hash2(n, 2, S + 20) * 250, m = mass(x, y, dead);
    if (m < 0.02 || m > 0.3 || !P.has(x, y)) continue;
    const k = 1 + ((hash2(n, 3, S + 20) * 3) | 0);
    for (let j = 0; j < k; j++) {
      const sx = x + (j - (k - 1) / 2) * 5 + hash2(n, 10 + j, S) * 3, s = 2.2 + hash2(n, 20 + j, S) * 3, hgt = s * (0.8 + hash2(n, 30 + j, S) * 0.8), lean = (sx - MAE_ACX) / 260 * 2;
      P.tube(sx, y, sx + lean, y - hgt, 0.9, 0.8, Q.tron, S + n, 2.6);
      const cx = sx + lean, cy = y - hgt;
      for (let yy = Math.floor(cy - s * 0.65); yy <= cy + 0.5; yy++) for (let xx = Math.floor(cx - s); xx <= cx + s; xx++) {
        const dx = (xx + 0.5 - cx) / s, dy = (yy + 0.5 - cy) / (s * 0.65); if (dx * dx + dy * dy > 1 || dy > 0.2) continue;
        P.put(xx, yy, Q.chap, 3.6 - (dx * 0.8 + dy) * 1.3 + cg(xx, yy, S + 21) * 0.5);
      }
      for (let xx = Math.floor(cx - s + 1); xx <= cx + s - 1; xx++) P.put(xx, cy + 1, Q.chap, (xx & 1) ? 4.4 : 2.2);   // the gills
      if (!dead && s > 3.2) spots.push([cx, cy, 4]);
    }
  }
  for (let n = 0; n < 16; n++) {
    const x = hash2(n, 4, S + 22) * MAE_AW, y = 40 + hash2(n, 5, S + 22) * 200, m = mass(x, y, dead);
    if (m < 0.15 || Math.abs(x - MAE_ACX) < 60 || !P.has(x, y)) continue;
    const r = 3 + hash2(n, 6, S + 22) * 3;
    P.blob(x, y, r, r * 0.9, Q.sac, S + 30 + n, 2.4, (xx, yy, dx, dy) => Math.hypot(dx + 0.4, dy + 0.4) < 0.25 ? 2 : (hash2(xx, yy, 7111) < 0.08 && dx * dx + dy * dy < 0.5 ? -2 : 0));
  }
  // the six scars where the bulbs open: a puckered ring, creases running in, a dark slit
  for (const [dc, dr] of MAE_SLOTS) {
    const bx = (dc + 20) * 12, by = (dr + 24) * 12;
    for (let y = by - 12; y <= by + 12; y++) for (let x = bx - 12; x <= bx + 12; x++) {
      const dx = x + 0.5 - bx, dy = y + 0.5 - by, d = Math.hypot(dx, dy * 1.15) / 11; if (d > 1 || !P.has(x, y)) continue;
      const an = Math.atan2(dy, dx), crease = Math.sin(an * 9 + d * 3) > 0.55;
      let v = 2.4 + (d > 0.55 ? (0.9 - Math.abs(d - 0.75) * 4) : -0.4 - (0.55 - d) * 2) - (dx + dy) / 11 * 0.9 + cg(x, y, S + 40) * 0.4;
      if (crease && d < 0.85) v -= 1.1;
      P.put(x, y, d < 0.5 ? Q.veia : Q.carne, v);
    }
    for (let x = bx - 4; x <= bx + 4; x++) P.put(x, by, Q.veia, 0);
    if (!dead) { P.put(bx - 1, by - 1, Q.esp, 3); P.put(bx + 2, by + 1, Q.esp, 2); }
  }
  const body = paintHer(P, Q, S, dead);
  P.outline();
  // her outline against the flesh, so she reads
  const o = P.c;
  for (let y = 1; y < MAE_AH - 1; y++) for (let x = 1; x < MAE_AW - 1; x++) {
    const i = y * MAE_AW + x; if (!body[i]) continue;
    if (!body[i - 1] || !body[i + 1] || !body[i - MAE_AW] || !body[i + MAE_AW]) o[i] = RAMPS[P.rid[i]][0];
  }
  return { c: P.c, cv: P.canvas(), spots };
}
/* her: hair, the colony dress and apron, sleeves rolled up, arms open with the hands swallowed by knots of
   mycelium, eyes shut, little mushrooms out of her hair and shoulder, the seam over her chest. Returns the mask */
function paintHer(P, Q, S, dead) {
  const W = MAE_AW, mask = new Uint8Array(W * MAE_AH), cx = MAE_ACX;
  const put0 = P.put;
  let marking = true;
  P.put = (x, y, R, v) => {   // the threads creep over her: more of them lower down and toward the hands
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= MAE_AH) return;
    // threads running down her in streaks, thicker low on the dress and out along the arms
    const amt = (y - 112) / 60 + Math.max(0, Math.abs(x - cx) - 30) / 70, th = nz(x * 1.6, y * 0.3, 3, S + 50) + nz(x, y, 9, S + 52) * 0.5;
    if (R !== Q.myc && amt > 0 && th + amt * 0.35 > 0.3) { R = Q.myc; v = 3.0 + nz(x * 1.6, y * 0.3, 1.6, S + 53) * 2.4 + cg(x, y, S + 51) * 0.5; }
    put0(x, y, R, v); if (marking) mask[y * W + x] = 1;
  };
  // hair behind, long and lank, threads in it
  P.blob(cx, 100, 9.5, 15, Q.cabelo, S + 60, 1.8, (x) => (Math.sin(x * 1.4) > 0.5 ? 0.7 : 0));
  // the arms: sleeve from the shoulder to the elbow, then skin; wrists bound in knots
  for (const sd of [-1, 1]) {
    const sx = cx + sd * 12, ex = cx + sd * 46, wx = cx + sd * 80;
    P.tube(sx, 104, ex, 100, 4.6, 3.8, Q.roupa, S + 61 + sd, 2.4, (x, y, t) => Math.sin(t * 20) > 0.7 ? -0.6 : 0);
    P.tube(ex, 100, wx, 96, 3.3, 2.7, Q.pele, S + 63 + sd, 2.6);
    P.blob(cx + sd * 87, 95.5, 4.4, 3.6, Q.pele, S + 65 + sd, 2.7);
    for (let k = 0; k < 4; k++) { const a = -0.9 + k * 0.5; P.tube(cx + sd * 89, 95, cx + sd * (89 + Math.cos(a) * 6), 95 + Math.sin(a) * 6, 1.1, 0.8, Q.pele, S + 66 + k, 2.8); }   // fingers spread
    marking = false;
    P.blob(cx + sd * 81, 96.5, 5.5, 5, Q.myc, S + 67 + sd, 2.8, (x, y) => (Math.sin(x * 1.3 + y * 0.9) > 0.3 ? 0.8 : -0.4));   // the knot round the wrist
    P.blob(cx + sd * 47, 101, 3.4, 4.2, Q.myc, S + 69 + sd, 2.6);   // and one at the elbow
    marking = true;
  }
  // neck, the dress, the apron, the belt
  P.tube(cx, 96, cx, 104, 2.6, 3, Q.pele, S + 70, 2.3);
  for (let y = 102; y < 182; y++) {
    const k = (y - 102) / 38, hw = y < 140 ? 14 - k * 4.5 : 9.5 + (y - 140) * 0.32;
    if (y > 150 && nz(cx, y, 6, S + 71) + (y - 150) / 34 > 0.75) continue;
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      if (y > 150 && nz(x, y, 6, S + 72) + (y - 150) / 40 > 0.6) continue;   // the dress goes into the mass
      const u = (x + 0.5 - cx) / hw, fold = Math.sin((x - cx) * 0.75 + y * 0.05);
      let R = Q.roupa, v = 2.8 - u * 1.0 - (y - 102) / 80 + fold * 0.45 + cg(x, y, S + 73) * 0.45 - u * u * 0.8;
      if (Math.abs(x - cx) < 7.5 && y > 126) { R = Q.avental; v = 3.0 - u * 1.4 + fold * 0.3 + cg(x, y, S + 74) * 0.4 - (y - 126) / 70; }
      if (y >= 124 && y <= 126) { R = Q.cabelo; v = y === 124 ? 3.4 : 2; }
      P.put(x, y, R, v);
    }
  }
  // the chest: a seam of flesh down the bodice, lips, a faint light inside
  marking = false;
  for (let y = 108; y <= 131; y++) {
    const w = 1.2 + Math.sin((y - 108) / 23 * Math.PI) * 2.4;
    for (let x = Math.floor(cx - w); x <= cx + w; x++) { const u = (x + 0.5 - cx) / w; P.put(x, y, Math.abs(u) < 0.34 ? (dead ? Q.carne : Q.esp) : Q.carne, Math.abs(u) < 0.34 ? (dead ? 0.5 : 2 + ((y & 1) ? 1.5 : 0)) : 3.6 - u * 1.2); }
  }
  marking = true;
  // the head: hair over the top, eyes shut, the mouth a little open
  P.blob(cx, 90, 6.6, 7.6, Q.pele, S + 80, 2.6);
  P.blob(cx - 0.4, 85.2, 7.4, 4.6, Q.cabelo, S + 81, 2.4, (x, y, dx, dy) => dy > 0.6 && Math.abs(dx) < 0.55 ? null : (x === cx ? -1.2 : 0));
  for (const sd of [-1, 1]) for (let y = 86; y < 104; y++) P.put(cx + sd * (6 + (y - 86) * 0.12), y, Q.cabelo, 2.2 + (y & 1));   // locks down the sides
  P.put(cx - 3, 90, Q.cabelo, 0); P.put(cx - 2, 90, Q.cabelo, 0); P.put(cx + 2, 90, Q.cabelo, 0); P.put(cx + 3, 90, Q.cabelo, 0);   // eyes shut
  P.put(cx - 3, 89, Q.pele, 1.6); P.put(cx + 3, 89, Q.pele, 1.6);
  P.put(cx, 92, Q.pele, 1.4); P.put(cx - 1, 95, Q.carne, 0); P.put(cx, 95, Q.carne, 0.4); P.put(cx + 1, 95, Q.carne, 0);
  // little mushrooms out of her hair and her right shoulder
  marking = false;
  for (const [mx, my, s] of [[cx - 5, 82, 2.6], [cx - 8, 85, 1.8], [cx + 16, 101, 2.8], [cx + 19, 103, 1.9]]) {
    P.tube(mx, my + 2.5, mx, my, 0.7, 0.6, Q.tron, S + 82, 2.8);
    for (let yy = Math.floor(my - s * 0.7); yy <= my; yy++) for (let xx = Math.floor(mx - s); xx <= mx + s; xx++) { const dx = (xx + 0.5 - mx) / s, dy = (yy + 0.5 - my) / (s * 0.7); if (dx * dx + dy * dy <= 1 && dy <= 0.25) P.put(xx, yy, Q.chap, 3.8 - (dx * 0.8 + dy) * 1.3); }
  }
  marking = true;
  P.put = put0;
  return mask;
}
/* a bulb, 28 x 28: lips of flesh opening on a glowing sac with the spores dark inside. k 0..1 how far open;
   p the swell of the pulse; fl a hit flash */
function paintBulb(k, p, fl) {
  const P = pp(28, 28), Q = PAL.vivo, S = 7400;
  const open = 3 + k * 7.5, sr = (2 + k * 7.5) * (1 + p * 0.08);
  for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) {
    const dx = x + 0.5 - 14, dy = y + 0.5 - 14, d = Math.hypot(dx, dy * 1.1);
    if (d < sr) {   // the sac
      const nx = dx / sr, ny = dy / sr, dd = nx * nx + ny * ny;
      let v = 4.3 - (nx * 0.8 + ny) * 1.3 - dd * 1.1 + cg(x, y, S) * 0.4 + p * 0.4;
      if (Math.hypot(nx + 0.4, ny + 0.45) < 0.22) v = 5.6;
      if (dd < 0.6 && dd > 0.08 && hash2(x, y, S + 1) < 0.1) { P.put(x, y, Q.sac, 0.5); continue; }
      P.put(x, y, fl ? Q.myc : Q.esp, fl ? v + 1 : v); continue;
    }
    if (d < open + 3.6 && d > open - 0.6) {   // the lips
      const u = (d - open) / 4, an = Math.atan2(dy, dx);
      let v = 3.3 - Math.abs(u - 0.2) * 3 - (dx + dy) / 14 * 1.1 + cg(x, y, S + 2) * 0.5;
      if (Math.sin(an * 8 + d) > 0.7) v -= 0.9;
      P.put(x, y, fl ? Q.myc : Q.carne, fl ? v + 1.4 : v);
    } else if (d < open - 0.6) P.put(x, y, Q.veia, 0.6);
  }
  P.outline();
  return P.canvas();
}
// her open chest, 34 x 40: the seam torn open, ribs of mycelium across, the heart-sac glowing behind them
function paintChest(p) {
  const P = pp(34, 40), Q = PAL.vivo, S = 7500;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 34; x++) {
    const dx = (x + 0.5 - 17) / 15, dy = (y + 0.5 - 20) / 19, d = dx * dx + dy * dy; if (d > 1) continue;
    const hole = Math.abs(dx) < 0.62 * Math.sqrt(Math.max(0, 1 - dy * dy * 1.1));
    if (!hole) { P.put(x, y, Q.carne, 3.5 - dx * 1.4 * Math.sign(dx) * -1 - Math.abs(dx) * 1.2 - dy * 0.6 + cg(x, y, S) * 0.5); continue; }
    const hx = (x + 0.5 - 17) / (9 + p), hy = (y + 0.5 - 21) / (11 + p), hd = hx * hx + hy * hy;
    if (hd < 1) { let v = 4.4 - (hx * 0.8 + hy) * 1.3 - hd * 1.2 + p * 0.5 + cg(x, y, S + 1) * 0.4; if (Math.hypot(hx + 0.4, hy + 0.45) < 0.2) v = 5.6; if (hd > 0.15 && hash2(x, y, S + 2) < 0.07) { P.put(x, y, Q.sac, 0.6); continue; } P.put(x, y, Q.esp, v); }
    else P.put(x, y, Q.veia, 0.5 + cg(x, y, S + 3));
  }
  for (const ry of [9, 15, 21, 27, 33]) for (let x = 6; x <= 28; x++) { const yy = ry + Math.abs(x - 17) * 0.18; if (Math.abs(x - 17) < 1) continue; P.put(x, yy, Q.myc, 3.8 - Math.abs(x - 17) * 0.06); P.put(x, yy + 1, Q.myc, 2); }
  P.outline();
  return P.canvas();
}
// an arm: a braid of three cords (one of flesh), 12 px that repeat; the tip three hooked fingers
function paintArmSeg() {
  const P = pp(12, 14), Q = PAL.vivo;
  for (let c = 0; c < 3; c++) for (let x = 0; x < 12; x++) {
    const yc = 7 + Math.sin(x / 12 * Math.PI * 2 + c * 2.094) * 3.1, front = Math.cos(x / 12 * Math.PI * 2 + c * 2.094) > 0;
    for (let y = Math.floor(yc - 2.4); y <= yc + 2.4; y++) {
      const ny = (y + 0.5 - yc) / 2.4; if (Math.abs(ny) > 1) continue;
      if (!front && P.has(x, y)) continue;
      P.put(x, y, c === 2 ? Q.carne : Q.myc, 3.4 - ny * 1.6 - ny * ny * 0.8 + (front ? 0.3 : -0.8) + cg(x, y, 7600 + c) * 0.5);
    }
  }
  return P.canvas();
}
function paintArmTip() {
  const P = pp(22, 18), Q = PAL.vivo;
  P.blob(4, 9, 5, 5.5, Q.myc, 7610, 2.6);
  P.tube(4, 7, 16, 2, 2.2, 0.6, Q.myc, 7611, 2.8); P.tube(16, 2, 20, 4.5, 0.7, 0.4, Q.tom, 7612, 3.4);
  P.tube(5, 9, 19, 9, 2.4, 0.6, Q.carne, 7613, 2.8); P.tube(19, 9, 21.5, 11, 0.7, 0.4, Q.tom, 7614, 3.4);
  P.tube(4, 11, 16, 16, 2.2, 0.6, Q.myc, 7615, 2.4); P.tube(16, 16, 20, 14, 0.7, 0.4, Q.tom, 7616, 3.2);
  P.outline();
  return P.canvas();
}
const GL = { cyan: glow(28, '#5ae0d0'), green: glow(16, '#8ad870'), pink: glow(20, '#e0a0a8'), core: glow(30, '#6ad4b4'), spot: glow(14, '#34c8a0'), lamp: glow(40, '#5ae0d0') };
const PUFF = (() => { const r = 16, c = mk(r * 2, r * 2), x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, 'rgba(118,150,72,0.95)'); g.addColorStop(0.5, 'rgba(84,112,52,0.7)'); g.addColorStop(1, 'rgba(60,80,40,0)'); x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c; })();
MAEA.wall = dead => { const k = dead ? 'dead' : 'live'; return MAEA[k] || (MAEA[k] = paintWall(dead)); };
MAEA.get = () => MAEA.ready || (MAEA.ready = (() => {
  const seg = paintArmSeg(), tip = paintArmTip();
  return {
    bulb: [0.15, 0.45, 0.75, 1].map(k => paintBulb(k, 0, false)), bulbP: paintBulb(1, 1, false), bulbF: paintBulb(1, 0, true),
    chest: [paintChest(0), paintChest(1)], seg: { r: seg, l: flipC(seg) }, tip: { r: tip, l: flipC(tip) }
  };
})());
Object.assign(MAEA, { GL, PUFF });
}

/* ---------- the wall in the chunks: painted over the back wall wherever the cell is open ---------- */
{ const _pp = paintProps; paintProps = function (ccx, ccy, buf, SZ) {
  try { maePaintChunk(ccx, ccy, buf, SZ); } catch (err) { console.error(err); }
  return _pp(ccx, ccy, buf, SZ);
}; }
function maePaintChunk(ccx, ccy, buf, SZ) {
  const g = maeGeo(); if (!g || typeof FUNGO === 'undefined' || !FUNGO) return;
  const ty0 = ccy * CH, ty1 = ty0 + CH - 1; if (ty1 < g.ay0 || ty0 > g.ay0 + 23) return;
  const dc0 = wdx(ccx * CH - g.ax0); if (dc0 > 40 || dc0 < -CH) return;
  const A = MAEA.wall(maeState.dead).c;
  for (let ty = Math.max(ty0, g.ay0); ty <= Math.min(ty1, g.ay0 + 23); ty++) for (let k = 0; k < CH; k++) {
    const dc = dc0 + k; if (dc < 0 || dc >= 40) continue;
    const gx = ccx * CH + k; if (gx >= WW) break;
    const i = ty * WW + gx, t = tiles[i]; if ((t !== AIR && (SOLID[t] || !DECO[t])) || !walls[i]) continue;
    const su = solidAt(gx, ty - 1), sd = solidAt(gx, ty + 1), sl = solidAt(gx - 1, ty), sr = solidAt(gx + 1, ty);
    const ao = su || sd || sl || sr, o = (ty - ty0) * T * SZ + k * T, a0 = (ty - g.ay0) * T * MAE_AW + dc * T;
    for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
      let c = A[a0 + py * MAE_AW + px]; if (!c) continue;
      if (ao) {
        let d = 9; if (su) d = Math.min(d, py); if (sd) d = Math.min(d, T - 1 - py); if (sl) d = Math.min(d, px); if (sr) d = Math.min(d, T - 1 - px);
        if (d < 4) { const f = 0.55 + d * 0.11; c = (255 << 24) | ((((c >> 16) & 255) * f) << 16) | ((((c >> 8) & 255) * f) << 8) | ((c & 255) * f); }
      }
      buf[o + py * SZ + px] = c >>> 0;
    }
    if (t !== AIR) { const sp = decoSprite(t, gx, ty, DECO[t]); if (sp) for (let q = 0; q < T * T; q++) if (sp[q]) buf[o + ((q / T) | 0) * SZ + (q % T)] = sp[q]; }
  }
}
function maeRepaint() {
  const g = maeGeo(); if (!g || !chunks.size) return;
  for (let y = g.ay0; y < g.ay0 + 24; y += 3) for (let x = g.ax0; x < g.ax0 + 40; x += 3) markDirty(wrapX(x), y);
}

/* ---------- light ---------- */
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const g = maeGeo(); if (!g || maeState.dead) return;
  if (Math.abs(wdx(g.cx - (x0 + w / 2))) > w / 2 + 40 || g.fy < y0 - 4 || g.top > y0 + h + 4) return;
  const ax = maeLap(g.ax0 * T), ay = g.ay0 * T, dark = maeFx.dark;
  if (dark < 0.5) {
    for (const [x, y, s] of MAEA.wall(false).spots) if (s > 6) addL(ax + x, ay + y, 0.62 - dark * 0.4);
    for (const [x, y] of maeFill()) addL(ax + x, ay + y, 0.4);   // a dim glow over the whole mass
  }
  const H = maeFx.inhale; if (H) addL(ax + MAE_ACX, ay + 96, 0.8);
  if (!maeChest) addL(ax + MAE_ACX, ay + MAE_ACY, 0.55);
  for (const a of maeFx.arms) if (a.t < 0.85) for (let k = 0; k <= 14; k += 2) addL(a.ox + a.dir * k * T, a.y, 0.55);
  for (const s of maeFx.spores) addL(s.x, s.land - 4, 0.5);
  for (const r of maeFx.roots) addL((r.x0 + r.x1) / 2, r.y - 4, 0.5);
}; }

// points over the mass for its own dim light
let maeFillC = null;
function maeFill() {
  if (maeFillC) return maeFillC;
  const A = MAEA.wall(false).c; maeFillC = [];
  for (let y = 18; y < MAE_AH; y += 36) for (let x = 18; x < MAE_AW; x += 36) if (A[y * MAE_AW + x]) maeFillC.push([x, y]);
  return maeFillC;
}

/* ---------- drawing ---------- */
DRAW_E.maeesporo = () => {};
EYES_E.maeesporo = () => {}; WARN_E.maeesporo = () => false;
DRAW_E.maebulbo = (e, fx, fy, fl) => {
  const A = MAEA.get();
  if (e.maeKind === 'chest') { const img = A.chest[Math.sin(gameTime * 4) > 0 ? 1 : 0]; lc.drawImage(img, fx - 17, fy - e.h / 2 - 20); if (fl) { lc.globalAlpha = 0.5; lc.globalCompositeOperation = 'lighter'; lc.drawImage(img, fx - 17, fy - e.h / 2 - 20); lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = 1; } return; }
  const k = e.openT || 0, img = fl ? A.bulbF : k < 1 ? A.bulb[Math.min(3, Math.floor(k * 4))] : Math.sin(e.t * 5) > 0.3 ? A.bulbP : A.bulb[3];
  lc.drawImage(img, fx - 14, fy - e.h / 2 - 14);
};
EYES_E.maebulbo = () => {}; WARN_E.maebulbo = () => false;
// arms, the cracks of the roots and their spikes, the circles under the spores, the caps that tremble
HOOK.drawWorld.push((cx, cy) => {
  if (!fungBoss || (!maeBoss && !maeFx.arms.length)) return;
  const A = MAEA.get();
  for (const a of maeFx.arms) {
    if (a.t < -0.8) continue;   // the second arm waits its turn
    if (a.t < 0) {   // the wall swells where it will come from
      const k = 1 + a.t / 0.8, s = Math.round(4 + k * 6), x = Math.round(a.ox) - cx, y = Math.round(a.y) - cy;
      lc.globalAlpha = 0.5 + k * 0.5; lc.drawImage(A.bulb[Math.min(3, Math.floor(k * 3))], x - 14, y - 14); lc.globalAlpha = 1;
      if (Math.random() < 0.3) parts.push({ x: a.ox + rnd(-s, s), y: a.y + rnd(-s, s), vx: rnd(-10, 10), vy: rnd(-10, 10), g: 0, life: 0.4, max: 0.4, col: '#c8fce8', size: 1, glow: true });
      continue;
    }
    const L = maeArmLen(a); if (L < 4) continue;
    const S = a.dir > 0 ? A.seg.r : A.seg.l, Tp = a.dir > 0 ? A.tip.r : A.tip.l, y = Math.round(a.y) - cy;
    const n = Math.max(0, Math.floor((L - 18) / 12));
    for (let k = 0; k < n; k++) { const x = a.dir > 0 ? a.ox + k * 12 : a.ox - (k + 1) * 12; lc.drawImage(S, Math.round(x) - cx, y - 7 + Math.round(Math.sin(k * 0.9 + gameTime * 8) * 1)); }
    const tx = a.dir > 0 ? a.ox + n * 12 : a.ox - n * 12 - 22;
    lc.drawImage(Tp, Math.round(tx) - cx, y - 9);
  }
  for (const r of maeFx.roots) {
    const y = r.y - cy;
    if (r.t < 0) {   // the mud cracks along the line
      const k = 1 + r.t / 0.9;
      for (let i = 0; i < r.j.length; i++) { const x = Math.round(r.x0 + i * 4) - cx; if (i / r.j.length > k + 0.15) break; lc.fillStyle = '#0c0808'; lc.fillRect(x, y - 2 + r.j[i], 4, 2); lc.fillStyle = k > 0.5 && (i + Math.floor(gameTime * 12)) % 3 === 0 ? '#c8fce8' : '#6ad4b4'; lc.globalAlpha = 0.6 + k * 0.4; lc.fillRect(x, y - 3 + r.j[i], 4, 1); lc.globalAlpha = 1; }
      continue;
    }
    const up = r.t < 0.12 ? r.t / 0.12 : r.t < 0.62 ? 1 : Math.max(0, 1 - (r.t - 0.62) / 0.28);
    for (let i = 0; i < r.j.length; i += 2) {
      const h = Math.round(up * (16 + ((i * 7) % 5) * 4)), x = Math.round(r.x0 + i * 4) - cx;
      for (let k = 0; k < h; k++) { const w = Math.max(1, Math.round(3.4 * (1 - k / h))); lc.fillStyle = k > h - 3 ? '#e2d8b6' : k > h * 0.6 ? '#a89c7e' : (k & 1) ? '#74464e' : '#a0686c'; lc.fillRect(x + 2 - (w >> 1), y - 1 - k, w, 1); }
    }
  }
  for (const s of maeFx.spores) {
    if (s.t >= 0) continue;
    const k = 1 + s.t / 1.0, x = Math.round(s.x) - cx, y = Math.round(s.land) - cy, rr = 9 + k * 5;
    lc.globalAlpha = 0.3 + k * 0.5; lc.strokeStyle = (Math.floor(gameTime * 10) & 1) ? '#9ae06a' : '#c4ecaa'; lc.lineWidth = 1;
    lc.beginPath(); lc.ellipse(x + 0.5, y - 1.5, rr, rr * 0.3, 0, 0, Math.PI * 2); lc.stroke(); lc.globalAlpha = 1;
  }
  const S = maeFx.sink;
  if (S && S.t > 0) for (const [x, y] of maeCapCells(S.k, maeCapT[S.k])) if (Math.random() < 0.25) { const X = maeLap(wrapX(x) * T); lc.fillStyle = '#0e2a2e'; lc.fillRect(X + ((Math.random() * 11) | 0) - cx, y * T + ((Math.random() * 11) | 0) - cy, 1, 2); }
});
HOOK.drawGlow.push((cx, cy) => {
  const g = maeGeo(); if (!g) return;
  const G = MAEA.GL;
  if (pl.lg && pl.lg.maeParado && !pl.dead) { lc.globalAlpha = 0.26 + Math.sin(gameTime * 1.7) * 0.04; lc.drawImage(G.lamp, Math.round(pl.x + pl.w / 2) - cx - 40, Math.round(pl.y + pl.h / 2) - cy - 40); }
  if (maeState.dead || Math.abs(wdx(g.cx - Math.floor((cx + VW / 2) / T))) > 60) { lc.globalAlpha = 1; return; }
  const ax = maeLap(g.ax0 * T) - cx, ay = g.ay0 * T - cy, dark = maeFx.dark;
  if (dark < 1) for (const [x, y, s] of MAEA.wall(false).spots) { lc.globalAlpha = (s > 6 ? 0.22 : 0.12) * (1 - dark) * (0.8 + Math.sin(gameTime * 1.2 + x * 0.05) * 0.2); lc.drawImage(G.spot, ax + x - 14, ay + y - 14); }
  lc.globalAlpha = (0.2 + Math.sin(gameTime * 1.6) * 0.06) * (maeChest ? 1.6 : 1); lc.drawImage(G.core, ax + MAE_ACX - 30, ay + MAE_ACY - 30);
  for (const s of maeSlots) { const e = s.e; if (!e || e.dead) continue; lc.globalAlpha = (0.35 + Math.sin(e.t * 5) * 0.12) * (e.openT || 0); lc.drawImage(G.cyan, e.x + e.w / 2 - cx - 28, e.y + e.h / 2 - cy - 28); }
  for (const a of maeFx.arms) if (a.t < 0 && a.t >= -0.8) {   // the glowing line at the hero's height: where the arm will come
    const k = 1 + a.t / 0.8, x0 = Math.round(a.dir > 0 ? a.ox : a.ox - 14 * T) - cx, y = Math.round(a.y) - cy;
    lc.globalAlpha = 0.25 + k * 0.5 + Math.sin(gameTime * 30) * 0.08; lc.fillStyle = '#6ad4b4'; lc.fillRect(x0, y - 1, 14 * T, 3);
    lc.globalAlpha = 0.6; lc.fillStyle = '#c8fce8'; lc.fillRect(x0, y, 14 * T, 1);
    for (let i = 0; i <= 14; i += 2) { lc.globalAlpha = 0.18 + k * 0.2; lc.drawImage(G.spot, x0 + i * T - 14, y - 14); }
  }
  for (const s of maeFx.spores) if (s.t < 0) { lc.globalAlpha = 0.25 + (1 + s.t) * 0.3; lc.drawImage(G.green, Math.round(s.x) - cx - 16, Math.round(s.y0) - cy - 16); lc.drawImage(G.green, Math.round(s.x) - cx - 16, Math.round(s.land) - cy - 18); }
  for (const r of maeFx.roots) if (r.t < 0) { const k = 1 + r.t / 0.9; for (let x = r.x0; x <= r.x1; x += 12) { if ((x - r.x0) / (r.x1 - r.x0) > k + 0.15) break; lc.globalAlpha = 0.25 + 0.4 * k; lc.drawImage(G.spot, Math.round(x) - cx - 14, r.y - cy - 15); } }
  if (maeFx.inhale) { const t = maeFx.inhale.t, k = t < 0 ? 1 + t : 1; lc.globalAlpha = 0.25 + 0.35 * k + Math.sin(gameTime * 20) * 0.06; const s = 40 + k * 30; lc.drawImage(G.core, ax + MAE_ACX - s, ay + 96 - s, s * 2, s * 2); }
  lc.globalAlpha = 1;
});
// over everything: the spore clouds, the bad water's tint, the breath
HOOK.drawTop.push((cx, cy) => {
  const g = maeGeo(); if (!g || !maeBoss) return;
  const P = MAEA.PUFF;
  for (const s of maeFx.spores) {
    if (s.t < 0) continue;
    const linger = s.landed ? s.lt / 1.6 : 0, r = s.landed ? 12 + linger * 12 : 9, a = s.landed ? 0.85 * (1 - linger * linger) : 0.9;
    lc.globalAlpha = Math.max(0, a);
    for (let j = 0; j < 6; j++) { const an = j * 2.39 + s.seed, rr = j ? r * 0.6 : 0, px = s.x + Math.cos(an) * rr, py = s.cy + Math.sin(an) * rr * 0.6 - (s.landed ? 6 : 0), sz = r * 0.8; lc.drawImage(P, Math.round(px - cx - sz), Math.round(py - cy - sz), sz * 2, sz * 2); }
  }
  if (maeBoss.ph === 1 && maeWater.cur > 0) {   // the water gone bad: a green murk over it
    const x = maeLap(g.x0 * T) - cx, y = (g.fy - maeWater.cur) * T - cy;
    lc.globalAlpha = 0.14; lc.fillStyle = '#6a8a30'; lc.fillRect(x, y + 2, (g.x1 - g.x0 + 1) * T, maeWater.cur * T - 2);
  }
  lc.globalAlpha = 1;
});

/* ---------- the fight ---------- */
const maeTell = () => maeBoss && maeBoss.state !== 'intro';
function maeStart() {
  const g = maeGeo(); maeGates(true);
  const D = ET.maeesporo, e = spawnEnemy('maeesporo', maeLap(g.ax0 * T), g.ay0 * T, FG_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: MAE_L, hp: D.hp, maxHp: D.hp, pool: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, facing: 1, cd: 2, ph: 0, brotoT: 12, mothT: 0, sinkT: 15, sunk: 0, openCD: 0, px: e.x, py: e.y });
  e.state = 'intro'; e.stateT = 2.6;
  maeBoss = e; bossFight = { e, mae: true };
  maeSlots.length = 0; for (let k = 0; k < MAE_SLOTS.length; k++) maeSlots.push({ e: null, cd: 0 });
  maeChest = null; maeFx.dark = 0; maeWater.tipo = 0; maeWater.target = 2;
  DROPS.maeesporo = MAE_DROPS.filter(([id]) => ITEMS[id]);
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'A Mãe-Esporo'; bn.lastChild.textContent = 'a primeira de Ferroalto'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('A Mãe-Esporo', 'a primeira de Ferroalto');
  sfx.maeRugido(); shake(4);
}
function maeEnd(won) {
  const e = maeBoss; maeBoss = null; bossFight = null;
  maeGates(false);
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) if ((m.maeMinion || m.type === 'maebulbo') && !m.dead) { if (m.maeMinion) burst(m.x + m.w / 2, m.y + m.h / 2, 6, '#c4bca2', 50, 200, 0.4); maeDrop(m); }
  maeSlots.length = 0; maeChest = null;
  maeFx.arms.length = 0; maeFx.spores.length = 0; maeFx.roots.length = 0; maeFx.inhale = null; maeFx.sink = null; maeFx.vivo = null; maeFx.spark = null; maeFx.dark = 0;
  maeRestore();
  if (!won) { if (e) maeDrop(e); maeWater.tipo = 0; maeWater.target = 2; maeWaterSet(); return; }
  // she withers: grey and dry for good, the water clears, a cord hangs from the roof
  maeState.dead = true; maeWater.tipo = AGUA_LIMPA; maeWater.target = 2; maeWaterSet();
  maeCordPut(MAE_DEATH_CORD, -1); { const g = maeGeo(), x = wrapX(g.cx + MAE_DEATH_CORD); for (let y = g.top - 4; y < g.fy; y++) markDirty(x, y); }
  maeRepaint();
  const g = maeGeo(), ax = maeLap(g.ax0 * T), ay = g.ay0 * T;
  for (let k = 0; k < 40; k++) burst(ax + rnd(40, 440), ay + rnd(30, 260), 3, Math.random() < 0.5 ? '#6c665e' : '#a89c7e', 50, 60, 1.6, 2);
  // the first time: one of the layer's bases too
  const bases = ['capacete_lanterna', 'botas_seiva', 'gancho_colheita'].filter(id => ITEMS[id]);
  if (bases.length) { const x = ax + MAE_ACX, y = ay + MAE_ACY; dropGear(x, y, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T))); }
  sfx.maeMorte();
  showBanner('Vitória', 'a Mãe-Esporo secou');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.mae) return maeEnd(won); return _eb(won); }; }
// the hall back as it was: the caps, the mud floor
function maeRestore() {
  const g = maeGeo(); if (!g) return;
  for (let x = g.x0; x <= g.x1; x++) { const i = g.fy * WW + wrapX(x); if (tiles[i] === FG_VIVO) { tiles[i] = FG_LODO; markDirty(wrapX(x), g.fy); } }
  for (let y = g.top; y < g.fy; y++) for (let x = g.x0; x <= g.x1; x++) { const i = y * WW + wrapX(x); if (tiles[i] === FG_CHAPEU) { tiles[i] = AIR; markDirty(wrapX(x), y); } }
  maeCapT = MAE_CAPS.map(c => c[2]);
  for (let k = 0; k < MAE_CAPS.length; k++) maeCapPut(k, maeCapT[k], true);
  maeWaterSet();
}
const maePhaseOf = e => e.pool <= e.maxHp * MAE.p3 ? 2 : e.pool <= e.maxHp * MAE.p2 ? 1 : 0;
function maeSlotXY(s) { const g = maeGeo(); return [maeLap((g.cx + s[0]) * T), (g.fy + s[1]) * T]; }
// a bulb opens: low and middle ones first, higher ones once she is hurt
function maeOpenBulb(e) {
  const W = e.ph === 0 ? [3, 2, 1] : [0.3, 2, 3], cand = [];
  for (let k = 0; k < maeSlots.length; k++) { const s = maeSlots[k]; if (!s.e && s.cd <= 0) cand.push([k, W[MAE_SLOTS[k][2]]]); }
  if (!cand.length) return false;
  let tot = 0; for (const c of cand) tot += c[1]; let r = Math.random() * tot, pick = cand[0][0];
  for (const c of cand) { if ((r -= c[1]) <= 0) { pick = c[0]; break; } }
  const [x, y] = maeSlotXY(MAE_SLOTS[pick]), D = ET.maebulbo;
  const b = spawnEnemy('maebulbo', x - D.w / 2, y - D.h / 2, FG_ZONE0 + 3), hp = Math.max(1, Math.round(Math.min(e.maxHp * MAE.bulb, e.pool)));
  Object.assign(b, { boss: true, lvl: MAE_L, hp, maxHp: hp, hp1: hp, dmg: 0, xp: 0, gold: 0, openT: 0, px: b.x, py: b.y, slot: pick });
  b.state = 'intro';
  maeSlots[pick].e = b; sfx.maeAbre(); burst(x, y, 10, '#a0686c', 60, 120, 0.5);
  return true;
}
function maeOpenChest(e) {
  const [x, y] = maeSlotXY(MAE_CHEST);
  const c = spawnEnemy('maebulbo', x - 12, y - 15, FG_ZONE0 + 3);
  Object.assign(c, { w: 24, h: 30, boss: true, lvl: MAE_L, hp: 99999, maxHp: 99999, hp1: 99999, dmg: 0, xp: 0, gold: 0, openT: 0, px: c.x, py: c.y, maeKind: 'chest' });
  c.state = 'intro'; maeChest = c;
  burst(x, y, 30, '#a0686c', 120, 200, 0.7); burst(x, y, 16, '#6ad4b4', 80, -20, 0.8, 1, true); shake(6); sfx.maeAbre(); sfx.maeRugido();
}
// keep the bulbs where they grow (the ring moves things a lap, blows push them)
AI.maebulbo = function (e, dt) {
  const W = WW * T, d = e.x - e.px; if (Math.abs(d) > W / 2) e.px += Math.sign(d) * W;
  e.x = e.px; e.y = e.py; e.vx = e.vy = 0;
  if (e.openT < 1) { e.openT = Math.min(1, e.openT + dt * 1.5); if (e.openT >= 1) e.state = 'walk'; }
};
AI.maeesporo = function (e) { const W = WW * T, d = e.x - e.px; if (Math.abs(d) > W / 2) e.px += Math.sign(d) * W; e.x = e.px; e.y = e.py; e.vx = e.vy = 0; };
// only the bulbs bleed; the rest of the wall gives a spark
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && e.type === 'maeesporo') {
    if (!e.dead) maeFx.spark = { f: maeFx.frame, x: pl.x + pl.w / 2 + pl.facing * 14, y: pl.y + 8 };
    return;
  }
  if (e && e.type === 'maebulbo') {
    maeFx.bulbHit = maeFx.frame;
    if (e.maeKind === 'chest') mult = (mult || 1) * 1.25;
    const r = _hit(e, dir, mult, melee);
    e.x = e.px; e.y = e.py; e.vx = e.vy = 0; e.stun = 0;
    return r;
  }
  return _hit(e, dir, mult, melee);
}; }
// a bulb that bursts: her life goes, nothing drops, another opens somewhere else after a while
{ const _k = killEnemy; killEnemy = function (e) {
  if (e.type !== 'maebulbo') return _k(e);
  if (e.dead) return;
  const B = maeBoss;
  if (B && e.maeKind !== 'chest') { B.pool -= Math.max(0, e.hp1); e.hp1 = 0; }
  else if (B) { B.pool -= Math.max(0, e.hp1 - Math.max(0, e.hp)); e.hp1 = Math.max(0, e.hp); e.hp = Math.max(1, e.hp); return; }   // the chest never bursts
  e.dead = true; maeDrop(e);
  const x = e.x + e.w / 2, y = e.y + e.h / 2;
  burst(x, y, 26, '#6ad4b4', 140, 260, 0.7, 1, true); burst(x, y, 16, '#a0686c', 110, 380, 0.6); burst(x, y, 10, '#c4ecaa', 40, -10, 1.4, 2);
  shake(3); hitstop = Math.max(hitstop, 0.06); sfx.maeEstoura();
  if (e.slot != null && maeSlots[e.slot]) { maeSlots[e.slot].e = null; maeSlots[e.slot].cd = 4; }
  if (B) B.openCD = 2.2;
}; }
function maeMinionCount() { let n = 0; for (const m of enemies) if (m.maeMinion && !m.dead) n++; return n; }
function maeMinion(type, x, y) {
  if (!ET[type] || maeMinionCount() >= 4) return null;
  const m = spawnEnemy(type, x - ET[type].w / 2, y - ET[type].h / 2);
  if (!m || m.dead) return null;
  if (enemies.indexOf(m) < 0) enemies.push(m);
  m.maeMinion = true; m.memT = 8; m.xp = 1; m.gold = 0;
  return m;
}

/* the attacks */
const maeArmLen = a => a.t < 0 ? 0 : a.t < 0.14 ? a.len * a.t / 0.14 : a.t < 0.5 ? a.len : a.t < 0.85 ? a.len * (1 - (a.t - 0.5) / 0.35) : 0;
function maeArm(y, delay) {
  const g = maeGeo(), px = pl.x + pl.w / 2, wx0 = maeLap(g.ax0 * T), wx1 = wx0 + 40 * T, ccx = maeLap(g.cx * T);
  let dir, ox;
  if (px < wx0 + T) { dir = -1; ox = wx0 + 2 * T; }
  else if (px > wx1 - T) { dir = 1; ox = wx1 - 2 * T; }
  else { dir = Math.abs(px - ccx) < T ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(px - ccx); ox = clamp(px - dir * 6 * T, wx0 + T, wx1 - T); }
  maeFx.arms.push({ ox, y, dir, len: 14 * T, t: -0.8 - delay, hit: false, cracked: false });
  sfx.maeIncha();
}
function maeSpores(n) {
  const g = maeGeo(), px = pl.x + pl.w / 2, L = maeLap((g.x0 + 1) * T), R = maeLap((g.x1 - 1) * T);
  for (let k = 0; k < n; k++) {
    const x = clamp(k === 0 ? px : px + rnd(-130, 130), L, R), tx = wrapX(Math.floor(x / T));
    let c = g.fy - 3; while (c > g.top - 6 && !SOLID[tiles[c * WW + tx]]) c--;
    let l = c + 1; while (l < g.fy && !SOLID[tiles[l * WW + tx]] && !(agua.length && agua[l * WW + tx])) l++;
    maeFx.spores.push({ x, y0: (c + 1) * T + 4, cy: (c + 1) * T + 4, land: l * T, t: -1 - k * 0.12, landed: false, lt: 0, hit: false, seed: Math.random() * 9 });
  }
  sfx.maeEsporos();
}
function maeRoots() {
  const g = maeGeo(), px = pl.x + pl.w / 2, L = maeLap((g.x0 + 1) * T), R = maeLap((g.x1 - 1) * T);
  const x0 = clamp(px - 5 * T, L, R - 10 * T), j = []; for (let i = 0; i < 30; i++) j.push(((i * 37) % 5) < 2 ? 1 : 0);
  maeFx.roots.push({ x0, x1: x0 + 10 * T, y: g.fy * T, t: -0.9, hit: false, j });
  sfx.maeRaizes();
}
function maeInhale() { maeFx.inhale = { t: -1, hit: false }; sfx.maeInspira(); }
// the mouth she breathes into, the body you must not touch (world px)
function maeCoreRect() { const g = maeGeo(), ax = maeLap(g.ax0 * T), ay = g.ay0 * T; return { x: ax + MAE_CORE.x0, y: ay + MAE_CORE.y0, w: MAE_CORE.x1 - MAE_CORE.x0, h: MAE_CORE.y1 - MAE_CORE.y0 }; }
function maeToP2(e) {
  e.p2 = true; maeWater.target = 5; e.cd = 2;
  const g = maeGeo(), cols = []; for (let x = g.x0; x <= g.x1; x++) cols.push(x);
  cols.sort((a, b) => Math.abs(a - g.cx) - Math.abs(b - g.cx));
  maeFx.vivo = { cols, k: 0, t: 0 };
  sfx.maeRugido(); shake(6);
}
function maeToP3(e) {
  e.p3 = true; maeWater.target = 8; maeWater.tipo = AGUA_LIMPA; maeWaterSet(); e.cd = 2.5; e.sinkT = 15; e.mothT = 1.5;
  maeOpenChest(e);
}
function maeFight(e, dt) {
  const g = maeGeo(), pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // her life: what the bulbs gave up
  for (const s of maeSlots) { const b = s.e; if (!b || b.dead) continue; const h = Math.max(0, b.hp); if (h < b.hp1) { e.pool -= b.hp1 - h; b.hp1 = h; } }
  if (maeChest && !maeChest.dead) { const h = Math.max(0, maeChest.hp); if (h < maeChest.hp1) { e.pool -= maeChest.hp1 - h; maeChest.hp1 = h; } if (maeChest.hp < 1000) maeChest.hp = maeChest.hp1 = 99999; }
  e.hp = Math.max(0, e.pool);
  if (e.pool <= 0) { e.hp = 0; killEnemy(e); return; }
  e.stateT -= dt; e.cd -= dt;
  for (const s of maeSlots) s.cd -= dt;
  if (e.state === 'intro') {
    if (Math.random() < dt * 20) { const ax = maeLap(g.ax0 * T); parts.push({ x: ax + rnd(60, 420), y: g.ay0 * T + rnd(40, 260), vx: rnd(-8, 8), vy: rnd(-20, -6), g: -4, life: 1.2, max: 1.2, col: Math.random() < 0.5 ? '#c4ecaa' : '#6ad4b4', size: 1, glow: true }); }
    if (e.stateT < 1.6 && !e.opened) { e.opened = true; for (let k = 0; k < 3; k++) maeOpenBulb(e); }
    if (e.stateT <= 0) { e.state = 'fight'; e.cd = 1.2; }
    return;
  }
  // the phases
  const ph = maePhaseOf(e);
  if (ph > e.ph) { e.ph = ph; if (ph >= 1 && !e.p2) maeToP2(e); if (ph >= 2 && !e.p3) maeToP3(e); }
  // three bulbs open
  let open = 0; for (const s of maeSlots) if (s.e && !s.e.dead) open++;
  if (open < 3 && (e.openCD -= dt) <= 0) { if (maeOpenBulb(e)) e.openCD = 1.2; }
  // brotos out of a bulb every 20 s; moths in the dark
  if (ET.brotos && e.ph < 2 && (e.brotoT -= dt) <= 0) {
    e.brotoT = 20;
    const b = maeSlots.map(s => s.e).filter(b => b && !b.dead && b.openT >= 1)[0];
    if (b) { const m = maeMinion('brotos', b.x + b.w / 2, b.y + b.h / 2); if (m) { burst(b.x + b.w / 2, b.y + b.h / 2, 14, '#c4bca2', 90, 300, 0.5); sfx.maeAbre(); } }
  }
  if (ET.mariposa && e.ph >= 2 && (e.mothT -= dt) <= 0) {
    e.mothT = 16;
    for (const sd of [-1, 1]) maeMinion('mariposa', maeLap((g.cx + sd * 26) * T), (g.top + 4) * T);
  }
  // the caps go down one by one until two are left
  if (e.ph >= 2 && !maeFx.sink && e.sunk < MAE_SINK.length && (e.sinkT -= dt) <= 0) { maeFx.sink = { k: MAE_SINK[e.sunk], t: 1, st: 0 }; e.sunk++; e.sinkT = 15; sfx.maeAfunda(); }
  // the water hurts from the second phase on
  if (e.ph === 1 && !pl.dead && agua.length && aguaIn(pl.x, pl.y, pl.w, pl.h) > 0) fungEsporar(Math.max(1, Math.round(e.dmg * 0.4)), 0.4);
  // the next blow
  const busy = maeFx.arms.length || maeFx.inhale || maeFx.roots.length;
  if (e.cd > 0 || busy) return;
  const r = Math.random(), low = pl.y + pl.h > (g.fy - 5) * T;
  if (e.ph === 0) {
    if (r < 0.55) { maeArm(pcy, 0); e.cd = 1.9 + Math.random() * 0.8; }
    else { maeSpores(3); e.cd = 2.2 + Math.random() * 0.8; }
  } else {
    if (r < 0.3) { maeArm(pcy, 0); maeArm(clamp(pcy + (Math.random() < 0.5 ? -1 : 1) * rnd(2.5, 3.5) * T, (g.top + 3) * T, (g.fy - 1) * T), 0.6); e.cd = 2.3 + Math.random() * 0.6; }
    else if (r < 0.5) { maeSpores(e.ph >= 2 ? 5 : 4); e.cd = 2 + Math.random() * 0.6; }
    else if (r < 0.75 && low) { maeRoots(); e.cd = 1.7 + Math.random() * 0.6; }
    else if (!e.inhT || gameTime - e.inhT > 9) { e.inhT = gameTime; maeInhale(); e.cd = 3.4; }
    else { maeArm(pcy, 0); e.cd = 1.6 + Math.random() * 0.6; }
    if (e.ph >= 2) e.cd *= 0.85;
  }
}
// the blows in the air: arms, spores, roots, the breath, the floor turning, the caps going down
function maeFxTick(dt) {
  const e = maeBoss, g = maeGeo();
  for (let i = maeFx.arms.length - 1; i >= 0; i--) {
    const a = maeFx.arms[i], t0 = a.t; a.t += dt;
    if (t0 < 0 && a.t >= 0) { sfx.maeBraco(); shake(2); burst(a.ox, a.y, 10, '#a89c7e', 90, 200, 0.4); }
    if (a.t >= 0.85) { maeFx.arms.splice(i, 1); continue; }
    const L = maeArmLen(a);
    if (!a.hit && e && L > 4 && a.t < 0.5 && !pl.dead) {
      const hb = { x: a.dir > 0 ? a.ox : a.ox - L, y: a.y - 6, w: L, h: 12 };
      if (overlap(hb, pl)) { a.hit = true; const r = hurtPlayer(e.dmg, a.ox, e, false); if (r === 'hit') { pl.vx = a.dir * 260; pl.vy = -160; } }
    }
  }
  for (let i = maeFx.spores.length - 1; i >= 0; i--) {
    const s = maeFx.spores[i]; s.t += dt; if (s.t < 0) continue;
    if (!s.landed) { s.cy += 230 * dt; if (s.cy >= s.land - 6) { s.cy = s.land - 6; s.landed = true; burst(s.x, s.land - 4, 10, '#8a9a5a', 60, -10, 1.2, 1); } }
    else if ((s.lt += dt) > 1.6) { maeFx.spores.splice(i, 1); continue; }
    if (!s.hit && e && !pl.dead) {
      const r = s.landed ? 12 + s.lt / 1.6 * 12 : 9, dx = pl.x + pl.w / 2 - s.x, dy = pl.y + pl.h / 2 - s.cy;
      if (Math.abs(dx) < r + pl.w / 2 && Math.abs(dy) < r * 0.8 + pl.h / 2) { s.hit = true; hurtPlayer(Math.max(1, Math.round(e.dmg * 0.6)), s.x, null, true); fungEsporar(Math.max(1, Math.round(e.dmg * 0.08)), 3); }
    }
  }
  for (let i = maeFx.roots.length - 1; i >= 0; i--) {
    const r = maeFx.roots[i], t0 = r.t; r.t += dt;
    if (t0 < 0 && r.t >= 0) { sfx.maeEspinhos(); shake(3); for (let x = r.x0; x < r.x1; x += 8) burst(x, r.y - 2, 2, '#74464e', 60, 300, 0.4); }
    if (r.t > 0.9) { maeFx.roots.splice(i, 1); continue; }
    if (r.t < 0 && Math.random() < dt * 30) { const x = r.x0 + Math.random() * (r.x1 - r.x0) * Math.min(1, 1.15 + r.t / 0.9); parts.push({ x, y: r.y - 2, vx: rnd(-20, 20), vy: rnd(-90, -40), g: 300, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#74464e' : '#a89c7e', size: 1 }); }
    if (!r.hit && e && r.t >= 0 && r.t < 0.62 && !pl.dead && overlap({ x: r.x0, y: r.y - 30, w: r.x1 - r.x0, h: 30 }, pl)) { r.hit = true; const q = hurtPlayer(Math.max(1, Math.round(e.dmg * 0.8)), pl.x + pl.w / 2, null, true); if (q === 'hit') pl.vy = -240; }
  }
  const H = maeFx.inhale;
  if (H && e) {
    H.t += dt;
    const C = maeCoreRect(), mx = C.x + C.w / 2, my = g.ay0 * T + 96;
    for (let n = 0, q = dt * (H.t < 0 ? 90 : 50); n < 3 && Math.random() < q - n; n++) {   // dust running to her
      const a = Math.random() * Math.PI * 2, d = rnd(90, 200), x = mx + Math.cos(a) * d, y = my + Math.sin(a) * d * 0.7, sp = H.t < 0 ? 1.1 : 0.7;
      parts.push({ x, y, vx: (mx - x) / sp, vy: (my - y) / sp, g: 0, life: sp * 0.95, max: sp, col: Math.random() < 0.5 ? '#c4ecaa' : '#e2d8b6', size: 1, glow: Math.random() < 0.4 });
    }
    if (H.t >= 0 && H.t < 2 && !pl.dead && !pl.climb) {   // the pull (a cord holds you)
      const dx = mx - (pl.x + pl.w / 2), step = Math.sign(dx) * Math.min(Math.abs(dx), 74 * dt);
      if (step && !rectSolid(pl.x + step, pl.y, pl.w, pl.h)) pl.x += step;
      if (!H.hit && overlap(C, pl)) { H.hit = true; const r = hurtPlayer(e.dmg, mx, e, false); if (r === 'hit') { pl.vx = Math.sign(pl.x + pl.w / 2 - mx || 1) * 280; pl.vy = -200; } }
    }
    if (H.t >= 2) maeFx.inhale = null;
  }
  const V = maeFx.vivo;
  if (V && (V.t -= dt) <= 0) {   // the mud turns to living mycelium, outward from her
    V.t = 0.035;
    for (let n = 0; n < 2 && V.k < V.cols.length; n++, V.k++) { const x = wrapX(V.cols[V.k]), i = g.fy * WW + x; if (tiles[i] === FG_LODO) { tiles[i] = FG_VIVO; markDirty(x, g.fy); if (Math.random() < 0.4) burst(maeLap(x * T + 6), g.fy * T, 2, '#d6caa8', 30, -10, 0.6); } }
    if (V.k >= V.cols.length) maeFx.vivo = null;
  }
  const S = maeFx.sink;
  if (S) {
    if (S.t > 0) { S.t -= dt; if (Math.random() < dt * 30) { const [x, y] = maeCapCells(S.k, maeCapT[S.k])[0]; const [a, b] = MAE_CAPS[S.k]; burst(maeLap((g.cx + rnd(a, b + 1)) * T), (y + 2) * T, 1, '#3a9a94', 30, 200, 0.6); } if (S.t <= 0) shake(3); }
    else if ((S.st -= dt) <= 0) {
      S.st = 0.11;
      const t = maeCapT[S.k]; maeCapPut(S.k, t, false);
      if (t + 2 >= 0) { maeCapT[S.k] = 99; maeFx.sink = null; const [a, b] = MAE_CAPS[S.k]; burst(maeLap((g.cx + (a + b) / 2) * T), (g.fy - maeWater.cur) * T, 16, '#c8eef8', 80, 300, 0.6); sfx.splash && sfx.splash(1); }
      else { maeCapT[S.k] = t + 1; maeCapPut(S.k, t + 1, true); }
      maeWaterSet();
    }
  }
  // spores rising in the bad water
  if (e && e.ph === 1 && Math.random() < dt * 14) {
    const x = maeLap((g.x0 + Math.random() * (g.x1 - g.x0)) * T), y = (g.fy - Math.random() * maeWater.cur) * T;
    if (agua.length && aguaAt(Math.floor(x / T), Math.floor(y / T))) parts.push({ x, y, vx: rnd(-4, 4), vy: rnd(-12, -4), g: -2, life: 1.2, max: 1.2, col: Math.random() < 0.5 ? '#9ae06a' : '#6a8a30', size: 1, glow: true });
  }
  // a blow on the bare wall: a spark (only when no bulb was struck in the same swing)
  const K = maeFx.spark;
  if (K && maeFx.frame > K.f) {
    if (maeFx.bulbHit !== K.f && e) { const C = { x: maeLap(g.ax0 * T), y: g.ay0 * T }; const x = clamp(K.x, C.x, C.x + MAE_AW), y = clamp(K.y, C.y, C.y + MAE_AH); burst(x, y, 6, '#ffe8b0', 90, 200, 0.25, 1, true); burst(x, y, 3, '#a0686c', 40, 300, 0.3); sfx.block && sfx.block(); }
    maeFx.spark = null;
  }
  // darker in the third phase
  maeFx.dark = approach(maeFx.dark, e && e.ph >= 2 ? 1 : 0, dt * 0.5);
}
HOOK.update.push(dt => {
  if (!FUNGO || !fungBoss || !pl) return;
  maeFx.frame++;
  maeWaterTick(dt);
  if (state !== 'play') return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (!maeState.dead && !bossFight && !pl.dead && inMaeHall(ptx, pty, 3)) maeStart();
  const e = maeBoss;
  if (e && bossFight && bossFight.mae && !pl.dead && !inMaeHall(ptx, pty, -3)) { endBossFight(false); return; }
  if (e && bossFight && bossFight.mae && !e.dead) {
    // the wall last in the list, so a shot finds a bulb in front of it first
    if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
    maeFight(e, dt);
  }
  if (maeBoss || maeFx.arms.length || maeFx.sink || maeFx.vivo) maeFxTick(dt);
  else maeFx.dark = 0;
});

/* ---------- sounds ---------- */
Object.assign(sfx, {
  maeRugido() { tone(52, 1.6, 'sawtooth', 0.035, -12); tone(78, 1.4, 'sine', 0.05, -20, 0.08); noise(1.4, 0.05, 260, 'lowpass'); },
  maeMuralha() { noise(0.6, 0.07, 500, 'lowpass'); tone(90, 0.5, 'sine', 0.04, -30); noise(0.3, 0.03, 2200, 'bandpass', 0.1); },
  maeIncha() { tone(64, 0.8, 'sine', 0.05, 40); noise(0.8, 0.03, 380, 'lowpass'); },
  maeBraco() { noise(0.22, 0.09, 700, 'lowpass'); tone(110, 0.22, 'sawtooth', 0.03, -60); noise(0.1, 0.05, 2600, 'bandpass', 0.12); },
  maeAbre() { noise(0.4, 0.05, 520, 'lowpass'); tone(150, 0.35, 'sine', 0.03, 70); },
  maeEstoura() { noise(0.3, 0.1, 900, 'lowpass'); tone(240, 0.16, 'sine', 0.05, -180); noise(0.14, 0.05, 3200, 'bandpass', 0.04); },
  maeEsporos() { noise(1.0, 0.03, 1800, 'bandpass'); tone(300, 0.6, 'sine', 0.012, 120); },
  maeRaizes() { noise(0.9, 0.05, 1500, 'bandpass', 0, 4); noise(0.9, 0.03, 300, 'lowpass'); },
  maeEspinhos() { noise(0.2, 0.08, 1200, 'bandpass'); tone(100, 0.15, 'square', 0.025, 140); },
  maeInspira() { noise(1.0, 0.05, 700, 'bandpass'); tone(70, 1.0, 'sine', 0.04, 50); noise(2.0, 0.04, 400, 'lowpass', 1); },
  maeAfunda() { noise(1.0, 0.06, 220, 'lowpass'); tone(48, 1.1, 'sine', 0.05, -12); },
  maeAgua(up) { tone(up ? 70 : 90, 0.3, 'sine', 0.03, up ? 25 : -25); noise(0.25, 0.025, 600, 'lowpass', 0.05); },
  maeMorte() { tone(60, 2.4, 'sawtooth', 0.03, -30); tone(90, 2.2, 'sine', 0.04, -50, 0.2); noise(2.4, 0.05, 300, 'lowpass'); noise(1.5, 0.03, 1600, 'bandpass', 0.6); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.maeEsporo = { dead: maeState.dead }; return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  maeBoss = null; maeChest = null; maeSlots.length = 0; maeFx.gates.length = 0; maeFx.arms.length = 0; maeFx.spores.length = 0; maeFx.roots.length = 0;
  maeFx.inhale = null; maeFx.sink = null; maeFx.vivo = null; maeFx.spark = null; maeFx.dark = 0;
  maeState.dead = !!(sv && sv.maeEsporo && sv.maeEsporo.dead);   // before the build: the dressing reads it
  maeGeoC = null;
  const r = _nw(sd, sv);
  Object.assign(maeWater, { cur: 2, target: 2, t: 0, tipo: 0 });
  return r;
}; }
