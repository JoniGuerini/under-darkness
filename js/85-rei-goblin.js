'use strict';

/* ================= O Rei Goblin e a Escavadeira: the boss of the mine =================
   The goblins' king keeps court in the Oficina da Escavadeira, the hall 84-mina-mundo digs in the Fornalhas across
   the world from the shafts (48 x 16): a throne made of an ore cart on end, heaps of stolen loot, smelters. He found
   the miners' great steam drill and made it his. Step in and iron gates drop over every way out (leaving the hall,
   by portal or by dying, resets the fight). Three phases:
     1. drives the Escavadeira at you, drill first, across the whole hall (it rams the far wall and shakes for a
        moment: hit it then), and throws dynamite from the cab
     2. under 60%: blows his horn and goblins come running from both sides (again while the fight goes on); every
        time the drill hits a wall the roof comes down in rocks (a shadow on the floor first), and he turns the
        drill on the roof itself
     3. under 25%: the machine blows apart and he jumps out with his pick-hammer: leaps at you and smashes the
        floor (the shock runs along it), and throws bundles of three sticks of dynamite
   Drops the Capacete do Rei Goblin (legendary helmet: a miner's lamp on it, more gold from monsters, explosions
   hurt you less). His death is saved.
   Plugs in like the Yeti (74): buildCathedral (dressing), spawnEnemy, endBossFight, hitEnemy, hurtPlayer, recalc,
   breakTile, makeSave and newWorld are wrapped; art and AI through DRAW_E/EYES_E/WARN_E/HOOK. Loads before 49. */

const RG = { hp: 1000, dmg: 24, xp: 360, p2: 0.6, p3: 0.25 };
const rgState = { dead: false };
const rgFx = { gates: [], rocks: [], waves: [], wreck: null, smoke: 0 };
let rgBoss = null;
ET.reigoblin = { name: 'O Rei Goblin', w: 52, h: 36, hp: RG.hp, dmg: RG.dmg, xp: RG.xp, kb: 0, fly: false, blood: '#5a7a3a', boss: true };
DROPS.reigoblin = [['capacete_rei_goblin', 1], ['pocao', 1, 2, 4], ['pepita', 1, 4, 8], ['nucleo_minerio', 1, 1, 2], ['polvora', 1, 3, 6]];
CV_STEP.reigoblin = 1;
const RG_FOOT = { w: 12, h: 22 };

/* ---------- the hall ---------- */
function inRgHall(tx, ty, m = 0) { const B = mnBoss; if (!B) return false; const dx = wdx(wrapX(tx) - B.cx); return Math.abs(dx) <= (B.w >> 1) - m && ty >= B.top - 1 && ty < B.fy; }
// the hall with its shell (floor, roof, walls): what nothing may break while he fights
function rgGuard(tx, ty) { const B = mnBoss; if (!B) return false; return Math.abs(wdx(wrapX(tx) - B.cx)) <= (B.w >> 1) + 3 && ty >= B.top - 8 && ty <= B.fy + 2; }
function rgDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
function rgDress() {
  const B = mnBoss; if (!B) return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), x0 = B.cx - (B.w >> 1), x1 = x0 + B.w - 1;
  for (let x = x0; x <= x1; x++) {
    tiles[I(x, B.fy)] = MN_TABUA; tiles[I(x, B.fy + 1)] = MN_TIJOLO;
    for (let y = B.top - 4; y < B.fy; y++) { const i = I(x, y), t = tiles[i]; if (t !== AIR && !SOLID[t]) tiles[i] = AIR; if (y >= B.top - 1) walls[i] = (x - x0) % 12 < 2 ? WMN_TABUADO : WMN_TIJOLO; }
  }
  // brick round the walls and roof, timber posts holding it
  for (let y = B.top - 4; y <= B.fy; y++) for (let x = x0 - 2; x <= x1 + 2; x++) {
    const i = I(x, y), t = tiles[i]; if (!SOLID[t] || !MN_SOILS[t]) continue;
    if (tiles[I(x, y + 1)] === AIR || tiles[I(x, y - 1)] === AIR || tiles[I(x - 1, y)] === AIR || tiles[I(x + 1, y)] === AIR) tiles[i] = y >= B.fy ? MN_TABUA : MN_TIJOLO;
  }
  for (const k of [6, 18, B.w - 19, B.w - 7]) { const x = x0 + k; let y = B.fy - 1; while (y > B.top - 6 && !SOLID[tiles[I(x, y)]]) { tiles[I(x, y)] = MN_ESCORA; y--; } }
  // nothing of the generic dressing stays in it
  for (let k = PROPS.length - 1; k >= 0; k--) { const p = PROPS[k]; if (p.def.mina && inRgHall(Math.floor((p.X + p.w / 2) / T), Math.floor((p.Y + p.h / 2) / T), -2)) PROPS.splice(k, 1); }
  propBuckets.clear(); propBySup.clear(); const keep = PROPS.slice(); PROPS.length = 0; for (const p of keep) addProp(p.def, p.v, p.X, p.Y, p.sup);
  const put = (id, v, tx, how) => {
    const def = PROP_DEFS[id]; if (!def) return null; const V = def.vars[v], tw = Math.ceil(V.w / T), sup = [];
    const X = W1(tx) * T + ((tw * T - V.w) >> 1);
    if (how === 'teto') {
      let r = -1; for (let k = tx; k < tx + tw; k++) { let y = B.fy - 2; while (y > B.top - 8 && !SOLID[tiles[I(k, y)]]) y--; r = Math.max(r, y); }
      for (let k = tx; k < tx + tw; k++) if (SOLID[tiles[I(k, r)]]) sup.push(I(k, r));
      return sup.length ? addProp(def, v, X, (r + 1) * T, sup) : null;
    }
    for (let k = tx; k < tx + tw; k++) sup.push(I(k, B.fy));
    return addProp(def, v, X, B.fy * T - V.h, sup);
  };
  put('mn_trono', 0, B.cx - 1, 'chao');
  put('mn_saque', 0, B.cx - 5, 'chao'); put('mn_saque', 0, B.cx + 4, 'chao');
  put('mn_fornalha', 0, x0 + 1, 'chao'); put('mn_fornalha', 0, x1 - 2, 'chao');
  put('mn_barril', 1, x0 + 9, 'chao'); put('mn_caixotes', 0, x1 - 12, 'chao'); put('mn_engrenagem', 0, x0 + 13, 'chao');
  for (const [tx, v] of [[x0 + 8, 0], [x0 + 15, 1], [x1 - 17, 0], [x1 - 9, 1]]) put('mn_estandarte', v, tx, 'teto');
  put('mn_lanterna', 0, B.cx - 9, 'teto'); put('mn_lanterna', 0, B.cx + 9, 'teto');
}
// where a tunnel opens high in the hall's side wall, a ladder up to it
function rgWallLadders() {
  const B = mnBoss; if (!B) return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), x0 = B.cx - (B.w >> 1), x1 = x0 + B.w - 1;
  for (const [wx, lx] of [[x0 - 1, x0], [x1 + 1, x1]]) {
    for (let y = B.fy - 5; y > B.top - 2; y--) {
      if (SOLID[tiles[I(wx, y)]] || !SOLID[tiles[I(wx, y + 1)]]) continue;   // the floor of an opening in the wall
      for (let k = y; k < B.fy; k++) if (!SOLID[tiles[I(lx, k)]]) tiles[I(lx, k)] = MN_ESCADA;
      break;
    }
  }
}
{ const _bc = buildCathedral; buildCathedral = function () { _bc(); if (MINA) { try { rgDress(); rgWallLadders(); mnExitClear(); mnClimbFix();
  // last pass: props whose footing a ladder or a cut took away, and posts left hanging
  let drop = false; for (let k = PROPS.length - 1; k >= 0; k--) { const p = PROPS[k]; if (p.def.mina && p.sup.length && p.sup.some(i => !SOLID[tiles[i]])) { PROPS.splice(k, 1); drop = true; } }
  if (drop) { propBuckets.clear(); propBySup.clear(); const keep = PROPS.slice(); PROPS.length = 0; for (const p of keep) addProp(p.def, p.v, p.X, p.Y, p.sup); }
  for (let sweep = 0, ch = true; ch && sweep < 12; sweep++) { ch = false;
    for (let y = MN_S0 - 40; y < WH - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x, t = tiles[i], u = tiles[i - WW], d = tiles[i + WW];
      if (t === MN_ESCORA) { if (!(SOLID[u] || u === MN_ESCORA) || !(SOLID[d] || d === MN_ESCORA)) { tiles[i] = AIR; ch = true; } continue; }
      if ((CV_STANDS[t] && !SOLID[d] && d !== t) || (CV_HANGS[t] && !SOLID[u] && u !== t)) { tiles[i] = AIR; ch = true; }
    } }
} catch (err) { console.error(err); } } }; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type !== 'reigoblin' && mnBoss && inRgHall(Math.floor((px + e.w / 2) / T), Math.floor((py + e.h / 2) / T), -2) && !(bossFight && bossFight.rg)) rgDrop(e);
  return e;
}; }
// nothing breaks the hall while he fights in it (his dynamite included)
{ const _bt = breakTile; breakTile = function (tx, ty) { if (bossFight && bossFight.rg && rgGuard(tx, ty)) return; return _bt(tx, ty); }; }

/* ---------- the helmet ---------- */
STAT_DEF.lgOuro = { t: '+X% de ouro dos inimigos', pct: 1 };
STAT_DEF.lgPolvora = { t: 'Explosões te causam X% menos dano', pct: 1 };
STAT_KEYS.push('lgOuro', 'lgPolvora');
ITEMS.capacete_rei_goblin = {
  name: 'Capacete do Rei Goblin', slot: 'head', rar: 4, def: 6, hp: 15, g: 1,
  art: ["....c.c.c...", "....ccccc...", "...mmmmmmL..", "..mMMmmmmmL.", "..mmmmmmmmm.", "..mmmmmmmmmm", "..m.......m."], oy: -3,
  pal: { m: '#bc8a30', M: '#f4d27a', c: '#f0c43a', L: '#fff0a0' },
  legend: [['lgOuro', 0.3], ['lgPolvora', 0.5], ['light', 3]],
  desc: 'O capacete de um mineiro morto, com a coroa do rei pregada em cima. O lampião ainda acende.'
};
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let o = 0, p = 0;
  for (const k of EQ_SLOTS) if (equip[k]) { const st = itemStats(equip[k]); o += st.lgOuro || 0; p += st.lgPolvora || 0; }
  if (pl.lg) { pl.lg.ouro = o; pl.lg.polvora = Math.min(0.8, p); }
  return r;
}; }
// explosions: the goblins' dynamite, the firedamp, the boss's bundles
let rgBlast = 0;
{ const _gb = gbBoom; gbBoom = function (b) { rgBlast++; try { return _gb(b); } finally { rgBlast--; } }; }
{ const _gm = mnGasBoom; mnGasBoom = function (e) { rgBlast++; try { return _gm(e); } finally { rgBlast--; } }; }
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) { if (rgBlast > 0 && pl.lg && pl.lg.polvora) dmg = Math.max(1, Math.round(dmg * (1 - pl.lg.polvora))); return _hp(dmg, srcX, src, isProj); }; }
{ const _k = killEnemy; killEnemy = function (e) { if (pl.lg && pl.lg.ouro && e.gold) e.gold = Math.round(e.gold * (1 + pl.lg.ouro)); return _k(e); }; }

/* ---------- art ---------- */
const RGA = {};
{
const { RB, cp, set } = CVB;
const cg = CVART.cg;
const R7 = hexes => hexes.map(h => ph(h));
const RM = MNB.RM;
const RK = {
  pele: R7(['#141a10', '#22301a', '#344628', '#4a5e38', '#62784a', '#7c925e', '#9cae78']),
  manto: R7(['#1e0608', '#360a0e', '#521216', '#701c20', '#8e2a2c', '#aa3e3c', '#c4584e']),
  pelo: R7(['#2a2620', '#46403a', '#665e54', '#8a8072', '#aea290', '#cec2ae', '#ece2cc']),
  vidro: R7(['#0a1e2a', '#123a50', '#1a5a78', '#2a80a0', '#4aa8c8', '#80d0e8', '#c8f4ff']),
  fumo: R7(['#0e0e10', '#1a1a1e', '#2a2a30', '#3c3c44', '#50505a', '#666670', '#80808a'])
};
const rect = (P, x0, y0, w, h, R, f) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = f(i, j, x0 + i, y0 + j); if (v !== null) P.put(x0 + i, y0 + j, R, v); } };
const wheel = (P, cx, cy, r, rot, s) => {
  P.blob(cx, cy, r, r, RM.ferro, s, 3);
  for (let a = 0; a < 6.3; a += 0.1) P.put(cx + Math.cos(a) * (r - 0.5), cy + Math.sin(a) * (r - 0.5), RM.ferro, Math.sin(a) < 0 ? 4.6 : 2);
  for (let k = 0; k < 3; k++) { const a = rot + k * 1.047; P.line(cx - Math.cos(a) * (r - 1.4), cy - Math.sin(a) * (r - 1.4), cx + Math.cos(a) * (r - 1.4), cy + Math.sin(a) * (r - 1.4), RM.ferro, 4.4); }
  P.blob(cx, cy, 1.4, 1.4, RM.latao, s + 1, 4.4);
};
/* the Escavadeira, 60 x 40 facing right: a timbered chassis with iron bands on three big wheels, a riveted boiler and stack at
   the back, the cab where the king sits in the middle (drawn apart), the drill's mount at the front. rot turns the wheels;
   broken = the wreck (planks staved in, boiler split, a wheel gone) */
function machine(rot, broken) {
  const P = cp(60, 40), s = 9001 + (broken ? 50 : 0);
  // the boiler: a brass-banded iron drum with rivets, the stack, a pressure gauge
  for (let y = 7; y < 23; y++) for (let x = 2; x < 19; x++) { const dy = (y + 0.5 - 15) / 8; if (Math.abs(dy) > 1) continue; const v = 4.2 - dy * 1.8 - Math.abs(dy) * 0.6 - (x - 2) * 0.04 + cg(x, y, s) * 0.5; P.put(x, y, (x - 2) % 6 === 0 ? RM.latao : RM.ferro, (x - 2) % 6 === 0 ? v + 0.6 : v); if ((x - 2) % 6 === 1 && y % 3 === 0) P.put(x, y, RM.ferro, 6); }
  for (let y = 0; y < 8; y++) for (let x = 6; x < 11; x++) P.put(x, y, RM.ferro, 4.2 - (x - 6) * 0.5 + (y === 0 ? 1.2 : 0));
  rect(P, 5, 0, 7, 1, RM.ferro, (i) => 5 - i * 0.3);
  P.blob(16, 10, 2, 2, RM.latao, s + 3, 4); P.put(16, 10, RK.pelo, 6); P.line(16, 10, 17, 9, RM.boca, 1);
  if (broken) { P.line(4, 9, 12, 20, RM.boca, 0.5); P.line(5, 9, 13, 20, RM.ferro, 1); }
  // the chassis: planks and iron bands, a goblin skull and crossed dynamite painted on the side
  for (let y = 20; y < 33; y++) for (let x = 1; x < 52; x++) { const row = (y - 20) % 4; let v = 3.2 + (row === 0 ? 1 : row === 3 ? -0.9 : 0) - (x - 1) * 0.012 + cg(x, y, s) * 0.5; if (broken && hash2(x >> 2, y >> 2, s) < 0.2) { v -= 2.6; } P.put(x, y, RM.madeira, v); }
  for (const x of [1, 2, 18, 19, 35, 36, 50, 51]) for (let y = 20; y < 33; y++) P.put(x, y, RM.ferro, x % 2 ? 4.4 : 2.6);
  for (let x = 0; x < 53; x++) { P.put(x, 19, RM.ferro, 5); P.put(x, 20, RM.ferro, 3.4); P.put(x, 33, RM.ferro, 2.4); }
  if (!broken) { P.blob(27, 26, 2.6, 2.2, RB.osso, s + 5, 4.4); P.put(26, 26, RM.boca, 0.5); P.put(28, 26, RM.boca, 0.5); P.line(22, 30, 32, 22, RM.jaspe, 4.2); P.line(22, 22, 32, 30, RM.jaspe, 4.2); P.blob(27, 26, 2.6, 2.2, RB.osso, s + 5, 4.4); P.put(26, 26, RM.boca, 0.5); P.put(28, 26, RM.boca, 0.5); }
  // the cab: a seat back of planks, two levers
  rect(P, 22, 10, 2, 10, RM.madeira, (i, j) => 3.6 - i + (j % 4 === 0 ? 0.8 : 0));
  P.line(40, 19, 43, 11, RM.ferro, 4.2); P.blob(43, 10.4, 1, 1, RM.boca, s, 4.4); P.line(44, 19, 46, 13, RM.ferro, 3.4); P.blob(46, 12.4, 1, 1, RM.ferro, s + 1, 5);
  // the mount for the drill
  rect(P, 51, 21, 6, 10, RM.ferro, (i, j) => 4.4 - i * 0.3 - (j > 7 ? 1.4 : 0) + (j === 0 ? 1 : 0));
  for (let y = 22; y < 30; y += 3) P.put(55, y, RM.latao, 5);
  // the wheels
  wheel(P, 9, 34, 5.4, rot, s + 10); wheel(P, 26, 34, 5.4, rot + 0.5, s + 11);
  if (!broken) wheel(P, 43, 34, 5.4, rot + 1, s + 12); else { P.blob(46, 37.4, 4.4, 1.6, RM.ferro, s + 12, 2.6); }
  if (broken) for (let y = 0; y < 40; y++) for (let x = 0; x < 60; x++) { const k = y * 60 + x; if (!P.c[k]) continue; const h = hash2(x >> 1, y >> 1, s + 77); if (h < 0.12 && y > 19 && y < 33) P.c[k] = 0; else if (h < 0.5) { const c = P.c[k], r = (c & 255) * 0.45, g = ((c >> 8) & 255) * 0.42, b = ((c >> 16) & 255) * 0.4; P.c[k] = (255 << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0); } }   // charred, staved in
  return set(P.done());
}
/* the drill, 24 x 16, mount on the left: a cone of iron cut with a spiral, phase k turns it */
function drill(k, broken) {
  const P = cp(24, 16), s = 9101;
  for (let x = 0; x < 24; x++) { const hw = 7.4 * (1 - x / 24); if (broken && x > 14) break; for (let y = 0; y < 16; y++) { const dy = (y + 0.5 - 8) / Math.max(0.5, hw); if (Math.abs(dy) > 1) continue; const groove = ((x * 0.7 + Math.asin(clamp(dy, -1, 1)) * 2.2 + k * 2.1) % 3.14 + 3.14) % 3.14 < 0.7; P.put(x, y, RM.ferro, 4.4 - dy * 1.6 - (groove ? 2.2 : 0) + cg(x, y, s) * 0.4 + (Math.abs(dy + 0.4) < 0.16 ? 1.2 : 0)); } }
  if (broken) for (let y = 3; y < 13; y++) P.put(14, y, RM.ferro, 1.4);
  rect(P, 0, 1, 3, 14, RM.latao, (i, j) => 4.6 - i * 0.8 - j * 0.06);
  return set(P.done());
}
/* the king in his cab, 22 x 20 facing right: 0 driving (hands on the levers), 1 throwing, 2 blowing the horn */
function kingCab(pose) {
  const P = cp(22, 20), s = 9201 + pose;
  P.blob(9, 15, 7, 5.4, RK.manto, s, 3.4, (x, y) => ((x + y) % 5 === 0 ? -0.6 : 0));   // the red cloak over his shoulders
  for (let x = 3; x <= 15; x++) if (hash2(x, 0, s) < 0.6) P.put(x, 10.4 + Math.sin(x) * 0.4, RK.pelo, 4.6);   // a fur collar
  P.blob(10, 15.6, 5, 4.6, RK.pele, s + 1, 3.6);   // the belly
  const hx = 11, hy = 6.6;
  P.line(hx - 3, hy + 0.4, hx - 7.4, hy - 1.6, RK.pele, 4); P.put(hx - 7.8, hy - 2, RK.pele, 3.4);   // ear
  P.blob(hx, hy, 4.2, 3.6, RK.pele, s + 2, 4.2);
  P.blob(hx + 1, hy + 2.6, 4, 1.8, RK.pele, s + 3, 3.4);   // jowls
  P.line(hx + 3.6, hy, hx + 6.2, hy + 1.2, RK.pele, 5); P.put(hx + 6, hy + 1.8, RK.pele, 3.6);   // nose
  for (const gx of [hx + 0.8, hx + 3.2]) { P.blob(gx, hy - 0.6, 1.3, 1.2, RM.latao, s + 4, 3.4); P.put(gx, hy - 0.6, RK.vidro, 5.6); }   // goggles
  if (pose === 2) { P.blob(hx + 2.6, hy + 2.8, 1.4, 1, RM.boca, s, 1); }
  else { P.line(hx - 0.4, hy + 2.6, hx + 3.4, hy + 3, RM.boca, 0.8); P.put(hx + 0.4, hy + 2.2, RB.osso, 5.6); P.put(hx + 2.8, hy + 2.4, RB.osso, 5.4); }   // a wide grin, two tusks
  // a miner's helmet with the crown nailed on top and the lamp lit
  P.blob(hx - 0.4, hy - 3.2, 4.6, 2, RM.latao, s + 5, 3.8, (x, y, dx, dy) => dy > 0.35 ? -1.4 : 0);
  for (let x = hx - 5; x <= hx + 4; x++) P.put(x, hy - 1.6, RM.latao, 2.6);
  P.put(hx + 4, hy - 4, RM.luz, 6.4); P.put(hx + 4, hy - 3.2, RM.latao, 4.6);
  for (const cx of [hx - 3, hx - 0.6, hx + 1.8]) { P.put(cx, hy - 6.4, RM.ouro, 6); P.put(cx, hy - 5.6, RM.ouro, 4.6); }
  for (let x = hx - 3.4; x <= hx + 2.2; x++) P.put(x, hy - 5, RM.ouro, 5); P.put(hx - 0.6, hy - 5, RM.jaspe, 6);
  if (pose === 0) { P.line(13, 12, 17, 13, RK.pele, 4); P.line(14, 13, 19, 15, RK.pele, 3.4); }
  else if (pose === 1) { P.line(13, 11, 19, 5, RK.pele, 4.2); P.line(19, 5, 21, 2, RM.jaspe, 4.6); P.put(21, 1, RM.luz, 6); }   // a stick of dynamite in his fist
  else { P.line(13, 11, 15, 7, RK.pele, 4); for (let k = 0; k < 6; k++) P.put(15 + k * 0.9, 7.4 - k * 0.5 + (k > 3 ? 0.4 : 0), RB.osso, 5 - k * 0.2 + (k === 5 ? 1 : 0)); P.blob(20.6, 4.8, 1.4, 1.6, RB.osso, s + 7, 4); }   // the horn
  return set(P.done());
}
/* the king on foot, 28 x 31 facing right: 0 idle, 1-2 walk, 3 hammer back, 4 smash, 5 leaping, 6 throwing a bundle */
function kingFoot(pose) {
  const P = cp(28, 31), s = 9301 + pose, w = pose === 1 ? 1 : pose === 2 ? -1 : 0, air = pose === 5;
  const hammer = (hx, hy, ax, ay) => { P.line(hx, hy, ax, ay, RM.cabo, 3.8); const dx = ax - hx, dy = ay - hy, n = Math.hypot(dx, dy) || 1, px = -dy / n, py = dx / n; for (let t = -2.6; t <= 2.6; t += 0.5) for (let u = -1; u <= 1; u++) P.put(ax + px * t + dx / n * u, ay + py * t + dy / n * u, RM.ferro, 4.4 - t * 0.3 + (u < 0 ? 0.8 : 0)); P.line(ax - px * 2.6, ay - py * 2.6, ax - px * 5.4 + dx / n * 1.6, ay - py * 5.4 + dy / n * 1.6, RM.ferro, 5); };   // a hammer on one side, a pick on the other
  if (pose === 3) hammer(9, 12, 3, 2);
  if (pose === 5) hammer(14, 9, 9, 0);
  P.blob(8, 18, 5, 9, RK.manto, s + 8, 3, (x, y, dx, dy) => (dy > 0.7 && hash2(x, 0, s) < 0.4 ? -9 : 0));   // the cloak behind
  const ly = air ? -2 : 0;
  P.line(10, 22 + ly, 10 - w * 1.2 - (air ? 2 : 0), 29.6 + ly, RM.calca || RK.manto, 2.6); P.line(15, 22 + ly, 15 + w * 1.2 + (air ? 1 : 0), 29.6 + ly, RK.pele, 3.4);
  P.blob(10 - w * 1.2 - (air ? 2 : 0), 30 + ly, 2, 1, RM.bota, s + 4, 2.8); P.blob(15.6 + w * 1.2 + (air ? 1 : 0), 30 + ly, 2, 1, RM.bota, s + 5, 3.4);
  P.blob(13, 17 + ly, 6.4, 6, RK.pele, s, 3.8);   // the belly
  for (let x = 7; x <= 19; x++) P.put(x, 21.4 + ly, RM.cabo, 2.2); P.put(16, 21.4 + ly, RM.ouro, 5.4);
  for (let x = 7; x <= 17; x++) if (hash2(x, 1, s) < 0.6) P.put(x, 11.4 + ly, RK.pelo, 4.6);
  const hx = 15, hy = 7 + ly;
  P.line(hx - 3, hy + 0.4, hx - 7.4, hy - 1.6, RK.pele, 4); P.put(hx - 7.8, hy - 2, RK.pele, 3.4);
  P.blob(hx, hy, 4.2, 3.6, RK.pele, s + 2, 4.2); P.blob(hx + 1, hy + 2.6, 4, 1.8, RK.pele, s + 3, 3.4);
  P.line(hx + 3.6, hy, hx + 6.2, hy + 1.2, RK.pele, 5);
  for (const gx of [hx + 0.8, hx + 3.2]) { P.blob(gx, hy - 0.6, 1.3, 1.2, RM.latao, s + 4, 3.4); P.put(gx, hy - 0.6, RK.vidro, 5.6); }
  if (pose === 4 || pose === 5) { P.blob(hx + 2.4, hy + 2.8, 1.6, 1.2, RM.boca, s, 1); P.put(hx + 1.4, hy + 2, RB.osso, 5.6); }
  else { P.line(hx - 0.4, hy + 2.6, hx + 3.4, hy + 3, RM.boca, 0.8); P.put(hx + 0.4, hy + 2.2, RB.osso, 5.6); P.put(hx + 2.8, hy + 2.4, RB.osso, 5.4); }
  P.blob(hx - 0.4, hy - 3.2, 4.6, 2, RM.latao, s + 5, 3.8, (x, y, dx, dy) => dy > 0.35 ? -1.4 : 0);
  for (let x = hx - 5; x <= hx + 4; x++) P.put(x, hy - 1.6, RM.latao, 2.6);
  P.put(hx + 4, hy - 4, RM.luz, 6.4);
  for (const cx of [hx - 3, hx - 0.6, hx + 1.8]) { P.put(cx, hy - 6.4, RM.ouro, 6); P.put(cx, hy - 5.6, RM.ouro, 4.6); }
  for (let x = hx - 3.4; x <= hx + 2.2; x++) P.put(x, hy - 5, RM.ouro, 5); P.put(hx - 0.6, hy - 5, RM.jaspe, 6);
  if (pose === 3) P.line(14, 13, 9, 12, RK.pele, 4);
  else if (pose === 4) { P.line(16, 13, 21, 15, RK.pele, 4.2); hammer(21, 15, 25, 26); }
  else if (pose === 5) P.line(15, 12, 14, 9, RK.pele, 4.2);
  else if (pose === 6) { P.line(16, 13, 23, 10, RK.pele, 4.2); for (let k = 0; k < 3; k++) P.line(23 + k * 0.8, 9.6 - k, 26 + k * 0.4, 7 - k * 0.6, RM.jaspe, 4.6 - k * 0.4); P.put(26.6, 5.6, RM.luz, 6.4); }
  else { P.line(17, 13, 18 + w * 0.6, 18, RK.pele, 4); hammer(18 + w * 0.6, 18, 20, 26); }
  return set(P.done());
}
const GL = { lamp: glow(20, '#ffc860'), boiler: glow(18, '#ff8a30'), spark: glow(10, '#ffe0a0') };
RGA.get = () => RGA.ready || (RGA.ready = {
  body: [0, 1].map(k => machine(k * 0.52, false)), wreck: machine(0.2, true),
  drill: [0, 1, 2].map(k => drill(k, false)), drillB: drill(0, true),
  cab: [0, 1, 2].map(kingCab), foot: [0, 1, 2, 3, 4, 5, 6].map(kingFoot)
});
Object.assign(RGA, { GL });
}

/* ---------- drawing ---------- */
// the machine, the drill (aimed ahead or up at the roof) and the king in the cab; on foot just the king
function rgDrawMachine(e, fx, fy, fl, X) {
  const A = RGA.get(), f = e.facing, moving = Math.abs(e.vx) > 5, spin = e.state === 'drill' || e.state === 'drillWind' || e.state === 'grind' || e.state === 'grindWind';
  const body = cvPick(A.body[moving ? Math.floor(e.t * 12) % 2 : 0], e, fl), bx = fx - 30 + (e.state === 'crash' || e.state === 'grind' ? Math.round(Math.sin(e.t * 50)) : 0), by = fy - 40;
  // the drill
  const D = A.drill[spin ? Math.floor(e.t * (e.state === 'drillWind' ? 18 : 30)) % 3 : 0], dimg = cvPick(D, e, fl);
  const up = e.state === 'grind' || e.state === 'grindWind' ? -1.25 : 0, mx = fx + f * 26, my = by + 26;
  lc.save(); lc.translate(mx, my); lc.rotate(f * up); lc.drawImage(dimg, f > 0 ? 0 : -24, -8); lc.restore();
  lc.drawImage(body, bx, by);
  const cab = A.cab[e.state === 'toss' && e.stateT < 0.35 ? 1 : e.state === 'horn' ? 2 : 0];
  lc.drawImage(cvPick(cab, e, fl), fx - 11 + f * 4, by - 6);
}
DRAW_E.reigoblin = function (e, fx, fy, fl) {
  if (!e.onFoot) return rgDrawMachine(e, fx, fy, fl);
  const A = RGA.get().foot, k = e.state === 'leapWind' || e.state === 'smashWind' ? 3 : e.state === 'smash' ? 4 : e.state === 'leap' ? 5 : e.state === 'bundle' ? 6 : Math.abs(e.vx) > 6 && e.onGround ? 1 + (Math.floor(e.t * 7) % 2) : 0;
  lc.drawImage(cvPick(A[k], e, fl), fx - 14, fy - 31);
};
EYES_E.reigoblin = (e, fx, fy) => { lc.globalAlpha = 0.6; lc.drawImage(SPR.glow.eye, fx + e.facing * (e.onFoot ? 5 : 8) - 6, fy - (e.onFoot ? 31 : 47)); };
WARN_E.reigoblin = e => e.state === 'drillWind' || e.state === 'grindWind' || e.state === 'horn' || e.state === 'leapWind' || e.state === 'bundleWind' || e.state === 'breaking';
// the wreck (stays in the hall), the rocks' shadows and the rocks
HOOK.drawWorld.push((cx, cy) => {
  const W = rgFx.wreck;
  if (W) { const A = RGA.get(), img = W.f > 0 ? A.wreck.r : A.wreck.l; lc.save(); lc.translate(Math.round(W.x) - cx, Math.round(W.y) - cy); lc.rotate(-W.f * 0.06); lc.drawImage(img, -30, -39); lc.restore(); const d = W.f > 0 ? A.drillB.r : A.drillB.l; lc.save(); lc.translate(Math.round(W.x + W.f * 34) - cx, Math.round(W.y) - cy - 5); lc.rotate(W.f * 0.25); lc.drawImage(d, -12, -8); lc.restore(); }
  for (const r of rgFx.rocks) {
    const x = Math.round(r.x) - cx;
    if (r.warn > 0) { const a = clamp(1 - r.warn / 1.0, 0.2, 0.85); lc.globalAlpha = a * 0.7; lc.fillStyle = '#000'; lc.beginPath(); lc.ellipse(x, r.floor - cy - 1, 7, 2, 0, 0, Math.PI * 2); lc.fill(); lc.globalAlpha = 1; }
    const y = Math.round(r.y) - cy;
    lc.fillStyle = '#140c0b'; lc.fillRect(x - 5, y - 1, 10, 9); lc.fillRect(x - 4, y - 2, 8, 11);
    lc.fillStyle = '#593026'; lc.fillRect(x - 4, y - 1, 8, 8); lc.fillStyle = '#764233'; lc.fillRect(x - 4, y - 1, 5, 3); lc.fillStyle = '#3e211c'; lc.fillRect(x + 1, y + 4, 3, 3);
  }
});
HOOK.drawTop.push((cx, cy) => {
  for (const w of rgFx.waves) { const x = Math.round(w.x) - cx, y = Math.round(w.y) - cy; lc.fillStyle = '#8a6a52'; lc.fillRect(x - 2, y - 3, 4, 3); lc.fillStyle = '#c8a888'; lc.fillRect(x - 1, y - 4, 2, 1); }
});
HOOK.drawGlow.push((cx, cy) => {
  const e = rgBoss, G = RGA.GL;
  if (e && !e.dead) {
    const x = e.x + e.w / 2 - cx, f = e.facing;
    if (!e.onFoot) { lc.globalAlpha = 0.55; lc.drawImage(G.lamp, x + f * 8 - 20, e.y - cy - 12 - 20); lc.globalAlpha = 0.35 + Math.sin(e.t * 6) * 0.08; lc.drawImage(G.boiler, x - f * 20 - 18, e.y - cy + 14 - 18); if (e.state === 'drill' || e.state === 'grind') { lc.globalAlpha = 0.7; lc.drawImage(G.spark, x + f * 40 - 10, e.y - cy + 18 - 10 - (e.state === 'grind' ? 22 : 0)); } }
    else { lc.globalAlpha = 0.45; lc.drawImage(G.lamp, x + f * 5 - 20, e.y - cy - 2 - 20); }
  }
  if (rgFx.wreck) { lc.globalAlpha = 0.25 + Math.random() * 0.1; lc.drawImage(G.boiler, rgFx.wreck.x - cx - rgFx.wreck.f * 20 - 18, rgFx.wreck.y - cy - 26 - 18); }
  lc.globalAlpha = 1;
});

/* ---------- the fight ---------- */
function rgPhase(e) { return e.hp <= e.maxHp * RG.p3 ? 2 : e.hp <= e.maxHp * RG.p2 ? 1 : 0; }
function rgSet(e, st, t) { e.state = st; e.stateT = t; }
function rgMinions() { let n = 0; for (const m of enemies) if (m.rgMinion && !m.dead) n++; return n; }
function rgStart() {
  const B = mnBoss; rgGates(true);
  const D = ET.reigoblin, e = spawnEnemy('reigoblin', (B.cx + 4) * T - D.w / 2, B.fy * T - D.h - 1, MN_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: 10, hp: D.hp, maxHp: D.hp, dmg: D.dmg, gold: 0, facing: pl.x < B.cx * T ? -1 : 1, cd: 1, hornT: 0, onFoot: false });
  rgSet(e, 'intro', 2.6);
  rgBoss = e; bossFight = { e, rg: true }; rgFx.wreck = null;
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Rei Goblin'; bn.lastChild.textContent = 'e sua Escavadeira'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Rei Goblin', 'e sua Escavadeira');
}
function rgEnd(won) {
  const e = rgBoss; rgBoss = null; bossFight = null;
  rgGates(false); rgFx.rocks.length = 0; rgFx.waves.length = 0;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) if (m.rgMinion && !m.dead) { rgDrop(m); burst(m.x + m.w / 2, m.y + m.h / 2, 6, '#5a7a3a', 50, 200, 0.4); }
  if (!won) { rgFx.wreck = null; if (e) { const k = enemies.indexOf(e); if (k >= 0) enemies.splice(k, 1); } return; }
  rgState.dead = true;
  showBanner('Vitória', 'o Rei Goblin caiu');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.rg) return rgEnd(won); return _eb(won); }; }
// iron gates over every way out (they can't be dug; they lift when the fight ends)
function rgGates(on) {
  const B = mnBoss; if (!B) return;
  if (on) {
    rgFx.gates.length = 0;
    const put = (x, y) => { const i = y * WW + wrapX(x), t = tiles[i]; if (SOLID[t]) return; rgFx.gates.push([i, t]); tiles[i] = MN_BARREIRA; markDirty(wrapX(x), y); burst(wrapX(x) * T + 6, y * T + 6, 2, '#a2a6b2', 30, 60, 0.4); };
    const x0 = B.cx - (B.w >> 1), x1 = x0 + B.w - 1;
    for (let y = B.top - 6; y <= B.fy; y++) { put(x0 - 1, y); put(x1 + 1, y); }
    for (let x = x0; x <= x1; x++) { put(x, B.top - 6); put(x, B.fy); }
    sfx.slam && sfx.slam();
  } else {
    for (const [i, t] of rgFx.gates) if (tiles[i] === MN_BARREIRA) { tiles[i] = t; markDirty(i % WW, (i / WW) | 0); burst((i % WW) * T + 6, ((i / WW) | 0) * T + 6, 4, '#a2a6b2', 40, 160, 0.5); }
    rgFx.gates.length = 0;
  }
  mapVer++;
}
// rocks off the roof around the hero (one right over them), each with a shadow before it falls
function rgRain(n) {
  const B = mnBoss; if (!B) return;
  const x0 = (B.cx - (B.w >> 1) + 1) * T, x1 = (B.cx + (B.w >> 1) - 1) * T, px = pl.x + pl.w / 2;
  for (let k = 0; k < n; k++) {
    const x = clamp(k === 0 ? px : px + rnd(-130, 130), x0, x1), tx = Math.floor(x / T);
    let r = B.fy - 2; while (r > B.top - 8 && !SOLID[tileAt(tx, r)]) r--;
    rgFx.rocks.push({ x, y: (r + 1) * T, floor: B.fy * T, vy: 0, warn: 0.9 + k * 0.15 });
  }
  sfx.mnCrumble(); shake(3);
}
function rgCall() {
  const B = mnBoss; if (!B) return;
  spawnEnemy.gang = true;
  try {
    for (const side of [-1, 1]) {
      if (rgMinions() >= 4) break;
      const type = Math.random() < 0.5 ? 'gatuno' : 'goblin', x = (B.cx + side * ((B.w >> 1) - 3)) * T, m = spawnEnemy(type, x, B.fy * T - ET[type].h - 1, MN_ZONE0 + 3);
      m.rgMinion = true; m.mnMinion = true; m.memT = 6; m.lvl = 9; const mul = 1 + 0.3 * 8; m.hp = m.maxHp = Math.round(ET[type].hp * mul); m.dmg = Math.round(ET[type].dmg * (1 + 0.2 * 8)); m.xp = 1; m.gold = 0;
      burst(x + 4, B.fy * T - 6, 10, '#8a6a52', 80, 200, 0.5);
    }
  } finally { spawnEnemy.gang = false; }
}
// dynamite thrown at the hero (into the 76 goblins' bombs): n sticks in a spread
function rgToss(e, ox, oy, n, fuse) {
  for (let k = 0; k < n; k++) {
    const tx = pl.x + pl.w / 2 + (k - (n - 1) / 2) * 34 + rnd(-6, 6), ty = pl.y + pl.h - 3, t = clamp(Math.abs(tx - ox) / 160, 0.5, 1.1);
    gbBombs.push({ x: ox, y: oy, vx: (tx - ox) / t, vy: (ty - oy - 0.5 * GB_G * t * t) / t, fuse: fuse + k * 0.12, dmg: Math.round(e.dmg * 0.8), spin: k });
  }
  sfx.gbFuse && sfx.gbFuse(); sfx.pswing && sfx.pswing();
}
function rgBreak(e) {   // the machine blows apart; he climbs out of the wreck
  const ecx = e.x + e.w / 2, gy = e.y + e.h;
  rgFx.wreck = { x: ecx, y: gy, f: e.facing };
  burst(ecx, gy - 20, 50, '#ffb040', 200, 160, 0.7, 1, true); burst(ecx, gy - 20, 30, '#3c3c44', 90, -40, 1.6, 2); burst(ecx, gy - 10, 20, '#724a28', 140, 400, 0.8);
  shake(10); sfx.gbBoom && sfx.gbBoom(); hitstop = Math.max(hitstop, 0.15);
  if (!pl.dead && Math.abs(pl.x + pl.w / 2 - ecx) < 50 && Math.abs(pl.y + pl.h / 2 - (gy - 18)) < 40) { rgBlast++; try { hurtPlayer(Math.round(e.dmg * 0.8), ecx, null, true); } finally { rgBlast--; } }
  e.onFoot = true; e.x = ecx - RG_FOOT.w / 2 - e.facing * 6; e.w = RG_FOOT.w; e.y = gy - RG_FOOT.h - 30; e.h = RG_FOOT.h; e.vy = -120; e.vx = -e.facing * 40;
  rgRain(4);
}
AI.reigoblin = function (e, dt, dx, dy, dist) {
  const B = mnBoss, ph = rgPhase(e), ecx = e.x + e.w / 2, floorY = B.fy * T, toPl = Math.sign(dx) || e.facing;
  e.stateT -= dt; e.cd -= dt; e.hornT -= dt;
  if (e.onFoot && Math.random() < dt * 4 && rgFx.wreck) parts.push({ x: rgFx.wreck.x - rgFx.wreck.f * 22 + rnd(-3, 3), y: rgFx.wreck.y - 38, vx: rnd(-6, 6), vy: rnd(-30, -14), g: -10, life: 1.4, max: 1.4, col: Math.random() < 0.5 ? '#3c3c44' : '#50505a', size: 2 });
  if (!e.onFoot && Math.random() < dt * (e.state === 'drill' ? 16 : 5)) parts.push({ x: ecx - e.facing * 22, y: e.y - 4, vx: rnd(-6, 6) - e.vx * 0.2, vy: rnd(-40, -20), g: -10, life: 1.1, max: 1.1, col: Math.random() < 0.5 ? '#50505a' : '#80808a', size: 2 });   // smoke from the stack
  switch (e.state) {
    case 'intro': e.vx = 0; if (e.stateT < 1.4 && !e.honked) { e.honked = true; sfx.rgHorn(); shake(3); } if (e.stateT <= 0) { rgSet(e, 'walk', 0); e.cd = 0.8; } return;
    case 'walk': {
      if (!e.onFoot && ph === 2) { rgSet(e, 'breaking', 1.4); sfx.rgSteam(); return; }
      e.facing = toPl;
      const adx = Math.abs(dx);
      if (e.onFoot) e.vx = approach(e.vx, adx > 26 ? toPl * 70 : 0, 600 * dt);
      else e.vx = approach(e.vx, adx > 90 ? toPl * 30 : adx < 50 ? -toPl * 24 : 0, 300 * dt);
      if (e.cd > 0 || !e.onGround) return;
      const r = Math.random();
      if (ph >= 1 && !e.p2Done) { e.p2Done = true; rgSet(e, 'horn', 1.2); sfx.rgHorn(); return; }
      if (e.onFoot) {
        if (r < 0.3) { rgSet(e, 'bundleWind', 0.55); return; }
        if (adx < 40 && Math.abs(dy) < 30) { rgSet(e, 'smashWind', 0.45); return; }
        rgSet(e, 'leapWind', 0.5); sfx.mngShout && sfx.mngShout(); return;
      }
      if (ph >= 1 && e.hornT <= 0 && rgMinions() < 2 && r < 0.4) { rgSet(e, 'horn', 1.2); sfx.rgHorn(); return; }
      if (ph >= 1 && r < 0.6) { rgSet(e, 'grindWind', 0.7); sfx.rgSteam(); return; }
      if (adx > 70 && r < 0.75) { rgSet(e, 'drillWind', 0.8); sfx.rgSteam(); return; }
      rgSet(e, 'toss', 0.7); return;
    }
    case 'drillWind': e.vx = approach(e.vx, 0, 600 * dt); e.facing = toPl; if (Math.random() < dt * 30) burst(ecx + e.facing * 34, e.y + 20, 1, '#ffe0a0', 60, 300, 0.2, 1, true); if (e.stateT <= 0) { rgSet(e, 'drill', 3); e.hitDone = false; sfx.rgDrill(); } return;
    case 'drill': {
      e.vx = e.facing * (240 + ph * 30);
      if (Math.random() < dt * 40) parts.push({ x: ecx + e.facing * 40, y: e.y + 20 + rnd(-4, 4), vx: -e.facing * rnd(40, 120), vy: rnd(-120, -20), g: 400, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ffe0a0' : '#ff9a3a', size: 1, glow: true });
      const tip = { x: e.facing > 0 ? ecx + 20 : ecx - 52, y: e.y + 10, w: 32, h: 20 };
      if (!e.hitDone && !pl.dead && (overlap(tip, pl) || overlap(e, pl))) { e.hitDone = true; const r = hurtPlayer(Math.round(e.dmg * 1.2), ecx, e, false); if (r === 'hit') { pl.vx = e.facing * 360; pl.vy = -220; } }
      const edge = (B.cx + e.facing * ((B.w >> 1) - 2)) * T;
      if (e.hitWall || (e.facing > 0 ? e.x + e.w + 18 >= edge : e.x - 18 <= edge) || e.stateT <= 0) {
        e.vx = 0; shake(7); sfx.slam && sfx.slam(); burst(ecx + e.facing * 42, e.y + 20, 24, '#764233', 140, 400, 0.6);
        if (ph >= 1) rgRain(4);
        rgSet(e, 'crash', 1.5);
      }
      return;
    }
    case 'crash': e.vx = 0; if (e.stateT <= 0) rgSet(e, 'recover', 0.4); return;
    case 'toss': e.vx = approach(e.vx, 0, 600 * dt); e.facing = toPl; if (e.stateT <= 0.35 && !e.tossed) { e.tossed = true; rgToss(e, ecx + e.facing * 4, e.y - 14, ph >= 1 ? 3 : 2, 1.5); } if (e.stateT <= 0) { e.tossed = false; rgSet(e, 'recover', 0.5); } return;
    case 'horn': e.vx = 0; if (e.stateT <= 0) { rgCall(); e.hornT = 14; rgSet(e, 'recover', 0.4); } return;
    case 'grindWind': e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { rgSet(e, 'grind', 1.6); e.rained = 0; sfx.rgDrill(); } return;
    case 'grind': e.vx = 0; if (Math.random() < dt * 40) parts.push({ x: ecx + e.facing * 34, y: e.y - 6, vx: rnd(-80, 80), vy: rnd(-20, 60), g: 400, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ffe0a0' : '#764233', size: 1, glow: true }); if (e.stateT < 1.2 && !e.rained) { e.rained = 1; rgRain(ph === 2 ? 8 : 6); } if (e.stateT <= 0) rgSet(e, 'recover', 0.6); return;
    case 'breaking': e.vx = 0; if (Math.random() < dt * 30) burst(ecx + rnd(-24, 24), e.y + rnd(0, 30), 2, Math.random() < 0.5 ? '#ffb040' : '#80808a', 80, 100, 0.4, 1, true); if (e.stateT <= 0) { rgBreak(e); rgSet(e, 'recover', 1); } return;
    case 'leapWind': e.vx = approach(e.vx, 0, 900 * dt); e.facing = toPl; if (e.stateT <= 0) { const tx = pl.x + pl.w / 2, t = 0.75; e.vx = clamp((tx - ecx) / t, -260, 260); e.vy = -GRAV * t / 2; rgSet(e, 'leap', 1.4); e.left = false; } return;
    case 'leap': if (!e.onGround) e.left = true; if (e.left && e.onGround || e.stateT <= 0) { e.vx = 0; rgSmash(e, true); rgSet(e, 'smash', 0.45); } return;
    case 'smashWind': e.vx = approach(e.vx, 0, 900 * dt); e.facing = toPl; if (e.stateT <= 0) { rgSmash(e, false); rgSet(e, 'smash', 0.4); } return;
    case 'smash': e.vx = 0; if (e.stateT <= 0) rgSet(e, 'recover', 0.6); return;
    case 'bundleWind': e.vx = approach(e.vx, 0, 900 * dt); e.facing = toPl; if (e.stateT <= 0) { rgToss(e, ecx + e.facing * 8, e.y + 4, 3, 1.2); rgSet(e, 'bundle', 0.4); } return;
    case 'bundle': e.vx = 0; if (e.stateT <= 0) rgSet(e, 'recover', 0.5); return;
    case 'recover': e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { rgSet(e, 'walk', 0); e.cd = (ph === 2 ? 0.4 : 0.8) + Math.random() * 0.6; } return;
  }
};
function rgSmash(e, big) {   // the pick-hammer on the floor: a blow in front, a shock both ways along the floor
  const ecx = e.x + e.w / 2, gy = e.y + e.h;
  const hb = { x: e.facing > 0 ? ecx - 4 : ecx - 26, y: e.y - 4, w: 30, h: e.h + 6 };
  if (!pl.dead && overlap(hb, pl)) hurtPlayer(e.dmg, ecx, e, false);
  for (const d of [-1, 1]) rgFx.waves.push({ x: ecx + d * 12, y: gy, x0: ecx, dir: d, dmg: Math.round(e.dmg * 0.6), len: big ? 200 : 120, sp: 220, hit: false });
  shake(big ? 6 : 4); sfx.slam && sfx.slam(); burst(ecx + e.facing * 12, gy - 2, 20, '#8a6a52', 120, 360, 0.5);
}
HOOK.update.push(dt => {
  if (!MINA || !mnBoss || !pl) return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (!rgState.dead && !bossFight && !pl.dead && state === 'play' && inRgHall(ptx, pty, 3)) rgStart();
  const e = rgBoss;
  if (e && bossFight && bossFight.rg && !inRgHall(ptx, pty, -3) && !pl.dead) endBossFight(false);
  // rocks
  for (let i = rgFx.rocks.length - 1; i >= 0; i--) {
    const c = rgFx.rocks[i];
    if (c.warn > 0) { c.warn -= dt; if (c.warn <= 0) c.vy = 60; continue; }
    c.vy = Math.min(c.vy + 900 * dt, 520); c.y += c.vy * dt;
    if (!pl.dead && c.x > pl.x - 4 && c.x < pl.x + pl.w + 4 && c.y + 10 > pl.y && c.y < pl.y + pl.h) { hurtPlayer(Math.max(1, Math.round(ET.reigoblin.dmg * 0.6)), c.x, null, true); burst(c.x, c.y + 6, 10, '#764233', 80, 360, 0.5); rgFx.rocks.splice(i, 1); continue; }
    if (c.y + 10 >= c.floor) { burst(c.x, c.floor - 2, 10, '#764233', 80, 360, 0.5); sfx.mnCrumble(); rgFx.rocks.splice(i, 1); }
  }
  // shocks along the floor
  for (let i = rgFx.waves.length - 1; i >= 0; i--) {
    const w = rgFx.waves[i]; w.x += w.dir * w.sp * dt;
    const tx = Math.floor(w.x / T), ty = Math.floor(w.y / T);
    if (solidAt(tx, ty - 1) || !solidAt(tx, ty) || Math.abs(w.x - w.x0) > w.len) { rgFx.waves.splice(i, 1); continue; }
    if (Math.random() < dt * 40) parts.push({ x: w.x + rnd(-3, 3), y: w.y - 1, vx: rnd(-20, 20) + w.dir * 30, vy: rnd(-90, -40), g: 360, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#8a6a52' : '#c8a888', size: 1 });
    if (!w.hit && !pl.dead && pl.onGround && Math.abs(pl.x + pl.w / 2 - w.x) < 8 && Math.abs(pl.y + pl.h - w.y) < 6) { w.hit = true; hurtPlayer(w.dmg, w.x - w.dir * 6, null, true); }
  }
});
// no damage while the engine starts or while it blows apart; nothing stops his blows
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e.type === 'reigoblin' && (e.state === 'intro' || e.state === 'breaking')) { burst(e.x + e.w / 2, e.y + e.h / 2, 3, '#ffe0a0', 40, 100, 0.3, 1, true); sfx.block && sfx.block(); return; }
  if (e.type === 'reigoblin' && e.state === 'crash') mult = (mult || 1) * 1.5;
  const r = _hit(e, dir, mult, melee);
  if (e.type === 'reigoblin') { e.stun = 0; if (!e.onFoot || e.state !== 'walk') e.vx = 0; }
  return r;
}; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  rgHorn() { tone(146, 1, 'sawtooth', 0.05, -8); tone(220, 0.9, 'square', 0.025, -10, 0.05); tone(110, 1.1, 'triangle', 0.04, -5); },
  rgSteam() { noise(0.7, 0.07, 3200, 'highpass'); tone(80, 0.6, 'sawtooth', 0.03, 30); },
  rgDrill() { tone(160, 1.2, 'sawtooth', 0.035, 120); noise(1.2, 0.05, 1800, 'bandpass'); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.reiGoblin = { dead: rgState.dead }; return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) { rgBoss = null; rgFx.gates.length = 0; rgFx.rocks.length = 0; rgFx.waves.length = 0; rgFx.wreck = null; const r = _nw(sd, sv); rgState.dead = !!(sv && sv.reiGoblin && sv.reiGoblin.dead); return r; }; }
