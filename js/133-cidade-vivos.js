'use strict';

/* ================= the living of the sunken city: the human behaviour and the looters =================
   The first enemies that act like people (docs/camadas/06-cidade-afundada.md, sections 6 and 13).

   ---- the human behaviour: humanStep(e, dt, dx, dy, dist, aggro) ----
   Every human type (ET flag `human: true`; here and in 134) calls it first from its AI:
     if (typeof humanStep === 'function' && humanStep(e, dt, dx, dy, dist, aggro)) return;
   It returns true when it took this frame (the type's own step must not run), false to let the type act.
   It only takes a human that is free: HUMAN_FREE[type](e) when the type sets one, else e.state === 'walk'. A human
   in the middle of an attack is never interrupted; the low-life check waits for it to finish.
   What it does, in order:
   - low life (under 25%): it backs away and drinks its potion when it has one (ET `potion: true`: one potion, 1 s, a
     glass clink, heals 30%; not drunk = dropped on death); without one it flees from the hero along the same paths
     (ladders and chains too), cries out once and raises an alarm where it was. Far and unseen it hides; cornered it
     fights back (returns false). ET `noFlee: true` (or e.noFlee, set per frame by the type, for the novices with a
     living leader) never flees.
   - alarms: cdAlarme(x, y, r) (130) pushes to cdAlarms; this file sends every free human within r blocks to that
     point (e.cdGoal), then lets the alarm expire. Arriving, the human stands and looks around for a moment.
   - errands: a type may set e.cdGoal = { x, y, t, keep, sp, r, done(e) } (pixels; t seconds to give up; keep: go on
     even when it sees the hero; done: called on arrival); humanStep walks it there with the human pathfinding.
   - ladders: the human pathfinding (cdvNav: the walkers' moves of js/12 plus rope ladders, chains and cords:
     CD_ESCADA, CD_CORRENTE, CHAIN, MN_ESCADA, MN_CORDA, FG_ESCADA, FG_CORDAO, the abyss ladders) replaces navFind for
     human types only, so e.nav already routes up and down them; when the next step is on a ladder humanStep climbs
     it (hand over hand, 55 px/s) and returns true. ET `noClimb: true` (the penitent) keeps to the ground.
   Shared: cdvNav(e, gx, gy, score), cdvLadder(x, y), HUMAN_FREE, e.cdMode ('back', 'drink', 'flee', 'hide' or null),
   e.cdClimb (on a ladder), e.cdGoal. Monster drops lying on the ground carry `cdMob: 1` (the hero's never do).

   ---- the four looters (this file) ----
   - saqueador: walks with care, climbs like the hero, runs first to any monster drop within 10 blocks and pockets it
     (all of it falls when he dies); draws the machete back (0.5 s) and stabs twice; low on life, backs off and drinks.
   - besteiro: finds the highest spot near the hero (roof, window, walkway) and crouches behind the parapet; stands,
     raises the crossbow and its tip glows (0.9 s), a straight fast bolt; then cranks it back (2 s, exposed). A bolt in
     a wall stays 5 s and is a step the hero can stand on.
   - armadilheiro: runs ahead of the hero into corridors and alleys and sets traps on the way; fights only when the
     hero walks into one. Caltrops (a metal glint on the floor) hurt and slow; a wire of little bells drops a net from
     above (a square shadow 0.4 s before) that stops the hero attacking for 1.5 s and calls the humans near. Then he
     comes with the club (raised, 0.6 s).
   - telhadeiro: throws a grappling hook at the ceiling or a beam and swings roof to roof, keeping off the floor; in a
     swing he lets go and drops on the hero with two daggers (his shadow on the floor 0.5 s before).
   Helpers for 136: cdSpawnSaqueadores(tx, ty, zone) (the pair near a camp). 136 sets levels and spawn tables.
   Loads after 130-132 and before 49 (BAL scales the stats below) and 134-136. */

/* ---------- stats (level-1 bases from the card; BAL and 136's level do the rest) ---------- */
Object.assign(ET, {
  saqueador: { name: 'Saqueador', w: 8, h: 21, hp: 85, dmg: 18, xp: 30, kb: 0.5, fly: false, blood: '#8a2a24', human: true, potion: true },
  besteiro: { name: 'Besteiro', w: 8, h: 21, hp: 55, dmg: 22, xp: 28, kb: 0.6, fly: false, blood: '#8a2a24', human: true },
  armadilheiro: { name: 'Armadilheiro', w: 8, h: 21, hp: 60, dmg: 16, xp: 28, kb: 0.55, fly: false, blood: '#8a2a24', human: true },
  telhadeiro: { name: 'Telhadeiro', w: 8, h: 21, hp: 65, dmg: 17, xp: 30, kb: 0.6, fly: false, blood: '#8a2a24', human: true }
});
const CDV_TYPES = ['saqueador', 'besteiro', 'armadilheiro', 'telhadeiro'];

/* ---------- drops (138's materials; the three bases of the layer are rare: the core multiplies gear by 0.1) ---------- */
const CDV_BASES = [['facao_saqueador', 0.034], ['capuz_poco', 0.034], ['couraca_guarda', 0.034]];
const CDV_DROPS = {
  saqueador: [['moeda_afundada', 0.5, 1, 2], ['pocao', 0.08], ['min_prata', 0.1], ...CDV_BASES],
  besteiro: [['corda_alcatroada', 0.4], ['pocao', 0.08], ['min_prata', 0.06], ...CDV_BASES],
  armadilheiro: [['moeda_afundada', 0.4], ['corda_alcatroada', 0.4], ['pocao', 0.08], ['min_prata', 0.06], ...CDV_BASES],
  telhadeiro: [['corda_alcatroada', 0.4, 1, 2], ['pocao', 0.08], ['min_prata', 0.08], ...CDV_BASES]
};
for (const k of CDV_TYPES) DROPS[k] = CDV_DROPS[k].filter(([id]) => ITEMS[id]);
Object.assign(NAV_WALKERS, { saqueador: 1, besteiro: 1, armadilheiro: 1, telhadeiro: 1 });
Object.assign(CV_STEP, { saqueador: 1, besteiro: 1, armadilheiro: 1, telhadeiro: 1 });

/* ================= the human behaviour ================= */
// what a human can climb (filled once everything has loaded: the abyss ids come later)
const CDV_CLIMB = new Uint8Array(NT);
let cdvReady = false, cdvMarked = false;
function cdvLate() {
  if (cdvReady) return; cdvReady = true;
  const ids = [CD_ESCADA, CD_CORRENTE, CHAIN,
    typeof MN_ESCADA !== 'undefined' ? MN_ESCADA : -1, typeof MN_CORDA !== 'undefined' ? MN_CORDA : -1,
    typeof FG_ESCADA !== 'undefined' ? FG_ESCADA : -1, typeof FG_CORDAO !== 'undefined' ? FG_CORDAO : -1,
    typeof AB_ESCADA !== 'undefined' ? AB_ESCADA : -1, typeof AB_CORRENTE !== 'undefined' ? AB_CORRENTE : -1];
  for (const t of ids) if (t >= 0) CDV_CLIMB[t] = 1;
  for (const k of CDV_TYPES) DROPS[k] = CDV_DROPS[k].filter(([id]) => ITEMS[id]);
}
const cdvLadder = (x, y) => CDV_CLIMB[tileAt(x, y)] === 1;
// a spot where a human hangs on a ladder: the body free, a rung at the hands, the waist or under the feet
function cdvHang(x, y, hT) { return navClear(x, y - hT, y - 1) && (cdvLadder(x, y - 1) || cdvLadder(x, y - 2) || cdvLadder(x, y)); }
const CDV_TMP = [];
function cdvMoves(x, y, hT, climbs, out) {
  out.length = 0;
  const st = navStand(x, y, hT), hg = climbs && cdvHang(x, y, hT);
  if (st) { navMoves(x, y, hT, CDV_TMP); for (const m of CDV_TMP) out.push(m); }
  if (!climbs) return out;
  if ((st || hg) && cdvHang(x, y - 1, hT)) out.push([x, y - 1, 'climbU']);
  if (hg && !solidAt(x, y) && (navStand(x, y + 1, hT) || cdvHang(x, y + 1, hT))) out.push([x, y + 1, 'climbD']);
  for (const d of [-1, 1]) {
    if (hg && !st) { if (navStand(x + d, y, hT) || cdvHang(x + d, y, hT)) out.push([x + d, y, 'offLadder']); }
    else if (st && !navStand(x + d, y, hT) && cdvHang(x + d, y, hT)) out.push([x + d, y, 'toLadder']);
  }
  return out;
}
const CDV_LADDER_K = { toLadder: 1, climbU: 1, climbD: 1, offLadder: 1 };
/* breadth-first over the spots a human can stand or hang on. With a goal cell (gx, gy) it returns the first step of
   the shortest way there; with score(x, y, n) it explores and returns the first step toward the best-scoring spot.
   { dir, kind, tx, ty, steps, gx, gy } or null */
const CDV_MV = [];
function cdvNav(e, gx, gy, score, R = 24, maxSteps = 46) {
  cdvLate();
  const hT = Math.ceil(e.h / T), climbs = !ET[e.type].noClimb, sy = Math.floor((e.y + e.h + 1) / T);
  const ok = (x, y) => navStand(x, y, hT) || (climbs && cdvHang(x, y, hT));
  let sx = Math.floor((e.x + e.w / 2) / T);
  if (!ok(sx, sy)) { const a = Math.floor((e.x + 1) / T), b = Math.floor((e.x + e.w - 1) / T); sx = ok(a, sy) ? a : ok(b, sy) ? b : sx; }
  if (!ok(sx, sy)) return null;
  const key = (x, y) => (x - sx + 64) * 512 + (y - sy + 200);
  const seen = new Set([key(sx, sy)]), q = [[sx, sy, 0, null]];
  let best = null, bs = -Infinity;
  const out = (n, first, x, y) => first ? { dir: first.dir, kind: first.kind, tx: first.tx, ty: first.ty, steps: n, gx: x, gy: y } : { dir: 0, kind: 'here', steps: 0, gx: x, gy: y };
  for (let i = 0; i < q.length && i < 1800; i++) {
    const [x, y, n, first] = q[i];
    if (score) { const s = score(x, y, n); if (s > bs) { bs = s; best = q[i]; } }
    else if (Math.abs(x - gx) <= 1 && Math.abs(y - gy) <= 1) return out(n, first, x, y);
    if (n >= maxSteps) continue;
    for (const [nx, ny, kind] of cdvMoves(x, y, hT, climbs, CDV_MV)) {
      if (Math.abs(nx - sx) > R || Math.abs(ny - sy) > 40) continue;
      const k = key(nx, ny); if (seen.has(k)) continue; seen.add(k);
      q.push([nx, ny, n + 1, first || { dir: Math.sign(nx - x), kind, tx: nx, ty: ny }]);
    }
  }
  return score && best && bs > -Infinity ? out(best[2], best[3], best[0], best[1]) : null;
}
// the floor cell under a point (pixels), searching down a few blocks
function cdvFloorCell(x, y) { const tx = Math.floor(x / T); let ty = Math.floor((y - 1) / T); for (let k = 0; k < 10 && !solidAt(tx, ty); k++) ty++; return [tx, ty]; }
// the hero's cell for the chase: where he stands, or where he hangs on a ladder
function cdvHeroCell() {
  const px = Math.floor((pl.x + pl.w / 2) / T);
  if (pl.climb && !pl.onGround) return [px, Math.floor((pl.y + pl.h + 1) / T)];
  return cdvFloorCell(pl.x + pl.w / 2, pl.y + pl.h);
}
// human types route through ladders when the core asks for the way to the hero (aggro, hearing, walk())
{ const _nf = navFind; navFind = function (e) {
  if (!(ET[e.type] && ET[e.type].human)) return _nf(e);
  const [px, py] = cdvHeroCell(); return cdvNav(e, px, py);
}; }

// which state lets humanStep take the human (HUMAN_FREE[type](e) overrides)
const HUMAN_FREE = {};
const cdvFree = e => (HUMAN_FREE[e.type] ? HUMAN_FREE[e.type](e) : e.state === 'walk');
// on a ladder: a rung anywhere along the body's column, or right under the feet
function cdvOnLadder(e) {
  const cx = Math.floor((e.x + e.w / 2) / T), y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h + 1) / T);
  for (let y = y0; y <= y1; y++) if (cdvLadder(cx, y)) return true;
  return false;
}
// a fresh route for an errand, on a timer or whenever the human changes cell
function cdvRoute(e, dt, fn) {
  const cell = Math.floor((e.x + e.w / 2) / T) * 4096 + Math.floor((e.y + e.h + 1) / T);
  e.cdNavT = (e.cdNavT || 0) - dt;
  if (e.cdNavT <= 0 || cell !== e.cdNavCell) { e.cdNavT = 0.35 + Math.random() * 0.15; e.cdNavCell = cell; e.cdNav = fn(); }
  return e.cdNav;
}
// climbing: hands on the ladder, centred on its column; returns true while it has the human
const CDV_CLIMB_UP = 55, CDV_CLIMB_DN = 66;
function cdvLadderDrive(e, dt, nav) {
  const kind = nav && nav.kind, ecx = e.x + e.w / 2, on = cdvOnLadder(e);
  const hold = vy => { e.vy = vy - GRAV * dt; };   // the core adds gravity after the AI
  if (kind === 'toLadder') {
    const tx = nav.tx * T + T / 2, d = tx - ecx; e.facing = Math.sign(d) || e.facing;
    if (Math.abs(d) > 1.5) { e.vx = Math.sign(d) * 45; if (e.cdClimb) hold(0); return true; }
    e.vx = 0; e.x = tx - e.w / 2; e.cdClimb = true; hold(0); return true;
  }
  if (!on) { e.cdClimb = false; return false; }
  if (kind === 'offLadder') {
    const d = nav.dir || e.facing; e.facing = d; e.vx = d * 45;
    const top = nav.ty * T - 0.5; hold(e.y + e.h > top ? -CDV_CLIMB_UP : 0);
    e.cdClimb = !e.onGround; return true;
  }
  if (kind === 'climbU' || kind === 'climbD' || (e.cdClimb && !e.onGround)) {
    const cx = Math.floor(ecx / T), tx = (nav && nav.tx !== undefined && kind !== 'here' ? nav.tx : cx) * T + T / 2;
    e.vx = clamp((tx - ecx) * 8, -40, 40); e.cdClimb = true;
    const up = kind === 'climbU', down = kind === 'climbD' || !nav || kind === 'here' || !CDV_LADDER_K[kind];
    hold(up ? -CDV_CLIMB_UP : down ? CDV_CLIMB_DN : 0);
    e.climbD = (e.climbD || 0) + Math.abs(up ? CDV_CLIMB_UP : down ? CDV_CLIMB_DN : 0) * dt;
    if (down && e.onGround) e.cdClimb = false;
    if (Math.random() < dt * 2) sfx.cdvRung();
    return true;
  }
  return false;
}

/* ---------- low life: back off and drink, or flee ---------- */
function cdvStartFlee(e) {
  const D = ET[e.type];
  e.state = 'walk'; e.stateT = 0; e.cdGoal = null;
  if (D.potion && e.cdPot > 0) { e.cdMode = 'back'; e.cdModeT = 0.8 + Math.random() * 0.4; sfx.cdvGasp(); return; }
  e.cdMode = 'flee'; e.cdModeT = 0; e.cdNavT = 0;
  sfx.cdvCry(); cdAlarme(e.x + e.w / 2, e.y + e.h / 2, 20);
}
function cdvFleeStep(e, dt, dx, dy, dist, aggro) {
  e.cdModeT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.cdMode === 'back') {   // a few steps away, facing the hero, then the potion
    const dir = -Math.sign(dx) || -e.facing;
    walk(e, dt, dir, 48, 400, 270, dy, false); e.facing = Math.sign(dx) || e.facing;
    if (e.cdModeT <= 0 && e.onGround) { e.cdMode = 'drink'; e.cdModeT = 1; e.vx = 0; sfx.cdvGlass(); }
    return true;
  }
  if (e.cdMode === 'drink') {
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.cdModeT < 0.55 && !e.cdGulp) { e.cdGulp = 1; sfx.cdvGulp(); }
    if (e.cdModeT <= 0) {
      const h = Math.round(e.maxHp * 0.3); e.hp = Math.min(e.maxHp, e.hp + h); e.cdPot = 0; e.cdGulp = 0;
      floatText(ecx, e.y - 6, '+' + h, '#7dff8a', 0.9); burst(ecx, e.y + 8, 12, '#c84858', 40, -60, 0.6, 1, true);
      e.cdMode = null; e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.4);
    }
    return true;
  }
  // fleeing: always the spot farthest from the hero it can reach, ladders included
  if (e.cdMode === 'hide') {
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = -Math.sign(dx) || e.facing;
    if (e.sees || dist < 110) { e.cdMode = 'flee'; e.cdNavT = 0; }
    return true;
  }
  const [hx, hy] = cdvHeroCell();
  const nav = cdvRoute(e, dt, () => cdvNav(e, 0, 0, (x, y, n) => Math.hypot(x - hx, (y - hy) * 1.3) - n * 0.12));
  if (dist > 170 && !e.sees) { e.cdMode = 'hide'; return true; }
  if ((!nav || nav.kind === 'here') && dist < 48) return false;   // cornered: it fights
  if (nav && CDV_LADDER_K[nav.kind] && cdvLadderDrive(e, dt, nav)) return true;
  if (e.cdClimb && !e.onGround && cdvLadderDrive(e, dt, null)) return true;
  e.nav = nav;
  const dir = nav && nav.kind !== 'here' ? nav.dir || -Math.sign(dx) : -Math.sign(dx) || 1;
  walk(e, dt, dir, 62 + e.lvl, 500, 280, -dy, true);
  if (Math.random() < dt * 0.4) sfx.cdvPant();
  return true;
}

/* ---------- the alarm ---------- */
function cdvAlarmTick(dt) {
  for (let i = cdAlarms.length - 1; i >= 0; i--) {
    const a = cdAlarms[i];
    if (!a.sent) {
      a.sent = 1;
      const R = (a.r || 20) * T;
      for (const e of enemies) {
        if (e.dead || !ET[e.type] || !ET[e.type].human || e.cdMode || (e.cdGoal && e.cdGoal.keep)) continue;
        if (Math.hypot(e.x + e.w / 2 - a.x, e.y + e.h / 2 - a.y) > R) continue;
        e.cdGoal = { x: a.x, y: a.y, t: 9, sp: 62 }; e.cdNavT = 0;
      }
    }
    a.t -= dt; if (a.t <= 0) cdAlarms.splice(i, 1);
  }
}

/* ---------- the step every human AI calls first ---------- */
function humanStep(e, dt, dx, dy, dist, aggro) {
  const D = ET[e.type]; if (!D || !D.human) return false;
  if (e.onGround && e.cdClimb && !cdvOnLadder(e)) e.cdClimb = false;
  // low life
  if (e.cdMode) return cdvFleeStep(e, dt, dx, dy, dist, aggro);
  const free = cdvFree(e);
  if (free && e.hp < e.maxHp * 0.25 && !D.noFlee && !e.noFlee && (e.onGround || e.cdClimb)) { cdvStartFlee(e); return cdvFleeStep(e, dt, dx, dy, dist, aggro); }
  if (!free) return false;
  // an errand or an alarm
  const g = e.cdGoal;
  if (g) {
    g.t -= dt;
    if (g.t <= 0 || (!g.keep && aggro && e.sees)) { e.cdGoal = null; e.cdNav = null; }
    else {
      const ecx = e.x + e.w / 2, [gx, gy] = cdvFloorCell(g.x, g.y);
      if (Math.abs(ecx - g.x) < (g.r || 9) && Math.abs(e.y + e.h - gy * T) < 14 && e.onGround) {
        e.cdGoal = null; e.cdNav = null; e.vx = 0;
        if (g.done) g.done(e); else { e.cdLookT = 2 + Math.random(); e.cdLookF = 0.6; }
        return true;
      }
      const nav = cdvRoute(e, dt, () => cdvNav(e, gx, gy));
      if (nav && CDV_LADDER_K[nav.kind] && cdvLadderDrive(e, dt, nav)) return true;
      if (e.cdClimb && !e.onGround && cdvLadderDrive(e, dt, null)) return true;
      if (!nav && Math.abs(g.y - (e.y + e.h)) > 30) g.t = Math.min(g.t, 1.2);   // no way there: give up soon
      e.nav = nav;
      const dir = nav && nav.kind !== 'here' && nav.dir ? nav.dir : Math.sign(g.x - ecx);
      if (dir) e.facing = dir;
      walk(e, dt, dir, g.sp || 55, 450, 280, g.y - (e.y + e.h / 2), true);
      return true;
    }
  }
  // looking round after an alarm
  if (e.cdLookT > 0) {
    if (aggro && e.sees) e.cdLookT = 0;
    else { e.cdLookT -= dt; e.cdLookF -= dt; e.vx = approach(e.vx, 0, 500 * dt); if (e.cdLookF <= 0) { e.cdLookF = 0.6 + Math.random() * 0.5; e.facing = -e.facing; } return true; }
  }
  // the way to the hero goes over a ladder
  if (aggro && e.nav && CDV_LADDER_K[e.nav.kind]) {
    if (!e.onGround) e.nav = cdvRoute(e, dt, () => navFind(e));
    if (cdvLadderDrive(e, dt, e.nav)) return true;
  }
  if (e.cdClimb && !e.onGround) { const nav = aggro ? cdvRoute(e, dt, () => navFind(e)) : null; if (cdvLadderDrive(e, dt, nav)) return true; }
  return false;
}

/* ================= art ================= */
/* Humans on the hero's 12 x 22 frame and anchors (body 12x18 + legs 12x4, shoulders at x 4.5 / 7.5, row 10.5),
   painted with the hero's own painter (heroPaint, heroRamp) and repainted: patched leather, hoods, a lantern at the
   belt. Each pose is a 24 x 25 canvas with the hero's frame at x 6, y 2 (room for a raised club or a crossbow);
   arms and weapons are drawn on top with the cave painter (CVB.cp). Every pose is baked once. */
const CDV = {};
{
const { cp, set } = CVB;
const cg = CVART.cg;
const toP = c => { const m = /rgb\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? pack(+m[1], +m[2], +m[3]) : ph(c); };
const RP = hex => heroRamp(hex).map(toP);
const R7 = hexes => hexes.map(h => ph(h));
const RI = {
  ferro: R7(['#141418', '#24262c', '#3a3d46', '#565a64', '#767b86', '#9aa0aa', '#c4c8cc']),
  cabo: R7(['#140c06', '#22160c', '#342414', '#48341e', '#5e462a', '#765a38', '#90704a']),
  latao: R7(['#2a1a06', '#46300c', '#664814', '#88621e', '#aa7e2c', '#c89c44', '#e0bc66']),
  luz: R7(['#5a2004', '#8a3a08', '#c26014', '#f08a24', '#ffb04a', '#ffd88a', '#fff0b0']),
  vidro: R7(['#2a0a10', '#4a1018', '#6e1a24', '#962634', '#b83a48', '#d4606a', '#ecaab0']),
  corda: R7(['#1a140c', '#2c2216', '#40321e', '#56462a', '#6e5c38', '#887248', '#a08a5c'])
};
// a limb along a polyline, a dark rim first, lit from the top left (as 123)
function limb(P, pts, r, R, base, s, rimV = 0.5) {
  const each = fn => { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 2)); for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n); } };
  each((cx, cy) => { const rr = r + 0.6; for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rr) P.put(x, y, R, rimV); });
  each((cx, cy) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r; if (dx * dx + dy * dy > 1.3) continue; P.put(x, y, R, base + 0.6 - (dx + dy) * 0.8 + cg(x, y, s) * 0.4); } });
}
// a heroPaint canvas pressed into the painter's buffer
let scratch = null;
function stamp(P, cv, ox, oy) {
  if (!scratch) { const c = mk(32, 32); scratch = c.getContext('2d', { willReadFrequently: true }); }
  scratch.clearRect(0, 0, 32, 32); scratch.drawImage(cv, 0, 0);
  const d = scratch.getImageData(0, 0, cv.width, cv.height), u = new Uint32Array(d.data.buffer);
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) { const v = u[y * cv.width + x]; if (v >>> 24) { const X = x + ox, Y = y + oy; if (X >= 0 && Y >= 0 && X < P.w && Y < P.h) P.c[Y * P.w + X] = v; } }
}
const LEGS = {
  idle: ["...PP..pp...", "...PP..pp...", "...FF..ff...", "...FFF.fff.."],
  w0: ["...PP..pp...", "..PP....pp..", "..FF....ff..", ".FFF....fff."],
  w1: ["....Ppp.....", "....PPpp....", "....FFfff...", "...FFF......"],
  w2: ["...pp..PP...", "..pp....PP..", "..ff....FF..", ".fff....FFF."],
  w3: ["....pPP.....", "....ppPP....", "....ffFFF...", "...fff......"],
  jump: ["...PP.pp....", "..PP...pp...", "..FFF..fff..", "............"],
  clA: ["...PP..pp...", "...FF..pp...", "...FF..pp...", ".......ff..."],
  clB: ["...PP..pp...", "...PP..ff...", "...PP..ff...", "...FF......."]
};
/* the bodies (h hair, c hood or headcloth, s skin, W/e the eye, m mouth, n scarf or mask, r coat, q patch, x stitch,
   b belt or strap, k buckle, a apron, t pocket, o rope coil) */
const BODIES = {
  saqueador: [
    "...cccc.....", "..ccccccc...", ".ccccccccc..", ".cccccccccc.", ".ccccchsWes.", ".ccccSsssss.", ".ccccCssmss.", "..cccnnnn...",
    "..ccnnnnnn..", "..cnnnnnnn..", "..rrrrrrrr..", "..rqqrrrrr..", "..rqqxrrrr..", "..bbbbbbkb..", "..rrrrrrqr..", "..rrrrrrqr..",
    ".rrrrrrrrrr.", ".rRrrrrrrrr."],
  besteiro: [
    "...cccc.....", "..ccccccc...", ".ccccccccc..", ".cccccccccc.", ".ccccchsWes.", ".ccccSsssss.", ".ccccCssmss.", "..cccssss...",
    "..ccnssn....", "..nnnnnnn...", "..rrrrrrbr..", "..rrrrrbrr..", "..rrrrbrrr..", "..bbbbbbkb..", "..rrbrrrrr..", "..rbrrrrrr..",
    ".rrrrrrrrrr.", ".rRrrrrrrrr."],
  armadilheiro: [
    "...hhhhh....", "..cccccccc..", ".cccccccccc.", "cchhhhhhhh..", "c.hhhhhsWes.", "..hhhSsssss.", "...hhsssms..", "....hssss...",
    "....nssn....", "...nnnnnn...", "..rraaaarr..", "..rraaaarr..", "..rraaaarr..", "..bbbbbbkb..", "..raattaar..", "..raattaar..",
    ".raaaaaaaar.", ".raaaaaaaar."],
  telhadeiro: [
    "....ccc.....", "..cccccc....", ".cccccccc...", ".ccccccccc..", ".ccccccsWec.", ".ccccnnnnnn.", ".cccnnnnnn..", "..ccnnnnn...",
    "...cnnnn....", "..cnnnnnnn..", "..rrrrrrro..", "..rrrrrroo..", "..rrrrroor..", "..bbbbobkb..", "..rrroorrr..", "..rrorrrrr..",
    ".roorrrrrrr.", ".rRrrrrrrrr."]
};
// light levels for the faces (hand-placed like the hero's): only where skin and eyes are, the rest is shaded by run
const MATS = {
  saqueador: { c: '#4e3a28', h: '#3a2618', s: '#a87a5a', n: '#6a3424', r: '#5e4430', q: '#7e6a4a', b: '#2a1e14', k: '#8a7448', p: '#3a362e', f: '#2a2018' },
  besteiro: { c: '#3c4236', h: '#3a2a1c', s: '#a07658', n: '#4a4a3a', r: '#5c5642', b: '#3a2a1a', k: '#7a6a48', p: '#34322c', f: '#2a221a' },
  armadilheiro: { c: '#7a3a2a', h: '#2e2016', s: '#a47454', n: '#4a3a2a', r: '#48464a', a: '#5a4a32', t: '#3e3020', b: '#2a1e14', k: '#9a8040', p: '#3a3430', f: '#241c14' },
  telhadeiro: { c: '#2a2a32', h: '#1e1814', s: '#987052', n: '#34343e', r: '#3a3a44', o: '#7a6a48', b: '#1e1a16', k: '#6a5a3a', p: '#2a2a30', f: '#1a1814' }
};
function kit(type, seed) {
  const C = MATS[type], M = {};
  for (const L in C) M[L] = { ramp: heroRamp(C[L]), grain: L === 'r' || L === 'a' ? 0.12 : L === 'c' ? 0.2 : L === 'h' ? 0.08 : 0.06, lip: L !== 's', under: L === 'b' || L === 'k' || L === 'o', tex: L === 'h' ? 'hair' : type === 'besteiro' && L === 'r' ? 'plate' : undefined };
  M.e = '#1c1422'; M.W = '#c4b8a0'; M.m = heroRamp(C.s)[1]; M.x = '#1a120c'; M.w = M.W;
  const body = heroPaint(BODIES[type], L => M[L], seed, null, false);
  const LM = { p: { ramp: heroRamp(C.p), grain: 0.1 }, f: { ramp: heroRamp(C.f), grain: 0.05, lip: true } }, legs = {};
  for (const k in LEGS) legs[k] = heroPaint(LEGS[k], L => LM[L], seed + 3);
  return { type, seed, body, legs, sleeve: RP(C.r), skin: RP(C.s), pants: RP(C.p), boot: RP(C.f), cloth: RP(C.c), extra: C };
}
// an arm from the shoulder through the given offsets (elbow, hand), the hand a small skin knot; returns the hand
function arm(P, K, sx, sy, pts, far) {
  const a = [[sx, sy], ...pts.map(([x, y]) => [sx + x, sy + y])], h = a[a.length - 1];
  limb(P, a, 0.8, K.sleeve, far ? 1.6 : 3, K.seed + (far ? 5 : 9), 0.9);
  P.put(h[0], h[1], K.skin, far ? 2 : 3.4); P.put(h[0] + 0.6, h[1] + 0.5, K.skin, far ? 1.4 : 2.6);
  return h;
}
// crouched legs: knees up in front of the lowered body (squat) or one knee down (kneel)
function crouchLegs(P, K, bx, kind) {
  const far = kind === 'kneel' ? [[bx + 4.4, 20.6], [bx + 7.6, 19.8], [bx + 7.2, 23.4]] : [[bx + 4.4, 20.8], [bx + 7.8, 19.6], [bx + 6.8, 23.4]];
  const near = kind === 'kneel' ? [[bx + 6.6, 20.8], [bx + 9.4, 23.2], [bx + 4.2, 23.4]] : [[bx + 6.6, 20.8], [bx + 10.2, 20], [bx + 9.6, 23.4]];
  limb(P, far, 0.75, K.pants, 1.2, K.seed + 11); P.blob(far[2][0] + 0.6, 23.2, 1.5, 0.8, K.boot, K.seed + 12, 1.6);
  limb(P, near, 0.8, K.pants, 2.4, K.seed + 13); P.blob(near[2][0] + (kind === 'kneel' ? -0.6 : 0.8), 23.2, 1.6, 0.8, K.boot, K.seed + 14, 2.4);
}
/* one pose: o = { legs, crouch ('squat' | 'kneel'), lean, far / near: arm offsets from the shoulder, behind(P, bx, by),
   farItem(P, hand), nearItem(P, hand), front(P, bx, by) } */
function man(K, o) {
  const P = cp(24, 25), bx = 6 + (o.lean || 0), by = 2 + (o.crouch ? 4 : 0) + (o.bob || 0);
  if (o.behind) o.behind(P, bx, by);
  if (o.far) { const h = arm(P, K, bx + 4.5, by + 10.5, o.far, true); if (o.farItem) o.farItem(P, h); }
  if (o.crouch) crouchLegs(P, K, bx, o.crouch); else stamp(P, K.legs[o.legs || 'idle'], 6, 20);
  stamp(P, K.body, bx, by);
  if (o.mid) o.mid(P, bx, by);
  if (o.near) { const h = arm(P, K, bx + 7.5, by + 10.5, o.near, false); if (o.nearItem) o.nearItem(P, h); }
  if (o.front) o.front(P, bx, by);
  return set(P.done());
}
/* ---- the gear ---- */
const dirOf = a => [Math.cos(a), Math.sin(a)];
// the machete: a wooden grip, a broad blade with a lit edge and a dark spine, a slight hook at the tip
function facao(P, h, a) {
  const [c, s] = dirOf(a), nx = -s, ny = c, [hx, hy] = h;
  P.line(hx - c * 1.6, hy - s * 1.6, hx + c * 0.6, hy + s * 0.6, RI.cabo, 3.2);
  P.put(hx + c * 1.2 + nx * 0.9, hy + s * 1.2 + ny * 0.9, RI.latao, 3.4); P.put(hx + c * 1.2 - nx * 0.9, hy + s * 1.2 - ny * 0.9, RI.latao, 2.6);
  for (let t = 1.6; t <= 8.4; t += 0.4) { const w = t > 7.4 ? 0.2 : 0.55; P.put(hx + c * t - nx * w, hy + s * t - ny * w, RI.ferro, 2.6 + (t > 6 ? 0.4 : 0)); P.put(hx + c * t + nx * w, hy + s * t + ny * w, RI.ferro, 4.8 - t * 0.08); }
  P.put(hx + c * 8.8 + nx * 0.6, hy + s * 8.8 + ny * 0.6, RI.ferro, 5.4);
}
// the crossbow, held at h pointing along a: the stock back to the shoulder, the prod across the front, the string,
// the bolt on top when loaded (its iron tip lit while aiming)
function besta(P, h, a, loaded, lit, string = 1) {
  const [c, s] = dirOf(a), nx = -s, ny = c, [hx, hy] = h, F = [hx + c * 5.5, hy + s * 5.5];
  P.line(hx - c * 3.6, hy - s * 3.6, F[0], F[1], RI.cabo, 3.6);
  P.line(hx - c * 3.6 + nx * 0.6, hy - s * 3.6 + ny * 0.6, hx - c * 1.6 + nx * 0.6, hy - s * 1.6 + ny * 0.6, RI.cabo, 2.4);   // the butt
  const tips = [-1, 1].map(k => [F[0] - c * 1.4 + nx * 4.2 * k, F[1] - s * 1.4 + ny * 4.2 * k]);
  for (const [tx, ty] of tips) { P.line(F[0], F[1], tx, ty, RI.ferro, 4.2); P.put(tx, ty, RI.ferro, 2.6); }
  const nut = string ? [hx + c * 0.4, hy + s * 0.4] : [F[0] - c * 1, F[1] - s * 1];
  for (const [tx, ty] of tips) P.line(tx, ty, nut[0], nut[1], RI.corda, 4.6);
  if (loaded) { P.line(nut[0] - nx * 0.8, nut[1] - ny * 0.8, F[0] + c * 1.6 - nx * 0.8, F[1] + s * 1.6 - ny * 0.8, RI.cabo, 4.6); P.put(F[0] + c * 2.4 - nx * 0.8, F[1] + s * 2.4 - ny * 0.8, lit ? RI.luz : RI.ferro, lit ? 6.4 : 5); }
}
// the crank on the crossbow's butt, two positions
function manivela(P, h, a, k) {
  const [c, s] = dirOf(a), [hx, hy] = h, bx = hx - c * 3.2, by = hy - s * 3.2;
  P.put(bx, by, RI.ferro, 4.4); const q = k ? 1 : -1; P.line(bx, by, bx + q * 2.2, by - 1.2, RI.ferro, 4.6); P.put(bx + q * 2.6, by - 1.4, RI.cabo, 4);
}
// the club: thicker toward the end, two nails
function porrete(P, h, a) {
  const [c, s] = dirOf(a), [hx, hy] = h;
  for (let t = -1.4; t <= 8.4; t += 0.4) { const r = 0.45 + Math.max(0, t - 2) * 0.13; for (let y = -r; y <= r; y += 0.5) for (let x = -r; x <= r; x += 0.5) if (x * x + y * y <= r * r) P.put(hx + c * t + x, hy + s * t + y, RI.cabo, 3 - (x + y) * 0.9 + cg(Math.round(hx + c * t + x), Math.round(hy + s * t + y), 77) * 0.6); }
  P.put(hx + c * 6.4 - s * 1.4, hy + s * 6.4 + c * 1.4, RI.ferro, 5.2); P.put(hx + c * 7.6 + s * 1.2, hy + s * 7.6 - c * 1.2, RI.ferro, 4.4);
}
function adaga(P, h, a) {
  const [c, s] = dirOf(a), [hx, hy] = h;
  P.line(hx - c * 1.2, hy - s * 1.2, hx + c * 0.4, hy + s * 0.4, RI.cabo, 3);
  P.line(hx + c * 1, hy + s * 1, hx + c * 5.2, hy + s * 5.2, RI.ferro, 4.4); P.put(hx + c * 5.4, hy + s * 5.4, RI.ferro, 5.6);
}
function frasco(P, x, y) { P.blob(x, y + 0.6, 1.4, 1.5, RI.vidro, 801, 3.2); P.put(x - 0.4, y - 0.2, RI.vidro, 6); P.put(x, y - 1.4, RI.cabo, 4); }
// the looters' lantern at the belt: a brass cage round an amber flame
function lanterna(P, x, y) {
  P.put(x + 1, y - 1, RI.ferro, 3.6);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) P.put(x + i, y + j, (i === 1 && j > 0 && j < 3) ? RI.luz : RI.latao, (i === 1 && j > 0 && j < 3) ? 5.6 - j * 0.6 : 3.2 - i * 0.6 + (j === 0 ? 1 : 0));
}
// a quiver of bolts on the back: a leather tube and the fletchings sticking out
function aljava(P, bx, by) {
  for (let y = by + 9; y <= by + 17; y++) { P.put(bx + 1.6 - (y - by - 9) * 0.25, y, RI.cabo, 2.2); P.put(bx + 2.6 - (y - by - 9) * 0.25, y, RI.cabo, 1.4); }
  for (let k = 0; k < 3; k++) { P.put(bx + 2.2 + k * 0.6, by + 7.6 - k * 0.4, RI.vidro, 3.4 + k * 0.4); P.put(bx + 2.2 + k * 0.6, by + 8.4, RI.cabo, 3.6); }
}
// little brass bells hung from the trapper's belt
function sinos(P, bx, by) { for (const [x, y] of [[3, 15], [4.4, 16], [2, 16.4]]) { P.put(bx + x, by + y, RI.latao, 4.6); P.put(bx + x, by + y + 0.8, RI.latao, 2.6); } }
// the roofrunner's coiled rope and hook hanging at his hip
function rolo(P, bx, by) { P.blob(bx + 2.4, by + 15.2, 1.8, 1.5, RI.corda, 911, 3.2, (x, y) => (x + y) % 2 ? -0.8 : 0.4); P.put(bx + 2.4, by + 15.2, RI.corda, 0.6); }
// the facão sheathed at the hip
function bainha(P, bx, by) { P.line(bx + 8.4, by + 13.6, bx + 6.6, by + 19, RI.cabo, 2); P.put(bx + 8.8, by + 13, RI.cabo, 3.6); }

/* ---- the poses ---- */
const W4 = ['w0', 'w1', 'w2', 'w3'];
const swingF = k => [[-0.6 + k * 0.7, 3], [-1 + k * 1.3, 5.7]], swingN = k => [[0.6 - k * 0.7, 3], [1.2 - k * 1.3, 5.6]];
const climbF = k => [[0.4, -4.2 + k * 1.2], [0.4, -9.4 + k * 2.4]], climbN = k => [[1.4, -4.4 + k * 1.2], [1.6, -9.6 + k * 2.4]];
// rotate an arm's offsets (aiming)
const rotA = (pts, a) => pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
function saqueador(K) {
  const lamp = (P, bx, by) => lanterna(P, bx - 2.4, by + 14.2);
  const F = (P, h) => facao(P, h, 1.05);
  const S = [];
  S[0] = man(K, { behind: lamp, far: [[-0.3, 3], [0, 5.8]], near: [[0.6, 3], [1.6, 5.6]], nearItem: F });
  for (let i = 0; i < 4; i++) { const k = i % 2 ? 0 : i === 0 ? 1 : -1; S[1 + i] = man(K, { legs: W4[i], behind: lamp, bob: i % 2 ? 0 : 0, far: swingF(k), near: swingN(k), nearItem: F }); }
  S[5] = man(K, { lean: -1, behind: lamp, far: [[2, 1.6], [4.2, 2.6]], near: [[-2.6, 1.6], [-5, 0.8]], nearItem: (P, h) => facao(P, h, 0.12), legs: 'w2' });   // drawn back
  S[6] = man(K, { lean: 1, legs: 'w0', behind: lamp, far: [[-1.4, 2.6], [-2.4, 5]], near: [[3, 0.4], [6.4, 0.6]], nearItem: (P, h) => facao(P, h, 0.04) });   // the stab
  S[7] = man(K, { behind: lamp, far: [[-0.3, 3], [0, 5.8]], near: [[2.6, -0.4], [1.8, -4]], nearItem: (P, h) => frasco(P, h[0] + 0.6, h[1] - 1.2), mid: bainha });   // drinking
  S[8] = man(K, { crouch: 'kneel', behind: lamp, far: [[1.2, 2.6], [2.8, 4.6]], near: [[1.8, 3], [3.2, 6.8]], mid: bainha });   // picking something up
  S[9] = man(K, { legs: 'clA', behind: lamp, far: climbF(0), near: climbN(1), mid: bainha });
  S[10] = man(K, { legs: 'clB', behind: lamp, far: climbF(1), near: climbN(0), mid: bainha });
  S[11] = man(K, { crouch: 'squat', behind: lamp, far: [[1.4, 2.4], [3, 4.2]], near: [[1.6, 2.6], [3.4, 4.6]], nearItem: (P, h) => facao(P, h, 0.6) });   // hiding
  return S;
}
function besteiro(K) {
  const Q = aljava, S = [];
  const hold = (P, h) => besta(P, h, 0.55, true, false);
  S[0] = man(K, { behind: Q, far: [[1.6, 2.6], [3.6, 4]], near: [[0.8, 3], [2.4, 5]], nearItem: hold });
  for (let i = 0; i < 4; i++) S[1 + i] = man(K, { legs: W4[i], behind: Q, far: [[1.6, 2.6], [3.6, 4 + (i % 2 ? 0 : 0.5)]], near: [[0.8, 3], [2.4, 5 + (i % 2 ? 0 : 0.5)]], nearItem: hold });
  S[5] = man(K, { crouch: 'squat', behind: Q, far: [[1.8, 1.6], [3.6, 2.6]], near: [[1.2, 2.4], [2.6, 3.6]], nearItem: (P, h) => besta(P, h, 0.15, true, false) });   // behind the parapet
  // aiming at -0.5, 0, 0.5 rad: stock at the shoulder, the far hand under the prod
  for (let j = 0; j < 3; j++) {
    const a = (j - 1) * 0.5;
    S[6 + j] = man(K, { behind: Q, far: rotA([[2.6, 0.6], [5.6, 0.8]], a), near: rotA([[1.2, 1.6], [2.4, 0.8]], a), nearItem: (P, h) => besta(P, h, a, true, true) });
  }
  S[9] = man(K, { lean: -1, behind: Q, far: [[2.6, 0.6], [5.4, 0.4]], near: [[1, 1.6], [2, 0.6]], nearItem: (P, h) => besta(P, h, -0.08, false, false, 0) });   // just shot
  for (let k = 0; k < 2; k++) S[10 + k] = man(K, { legs: 'w1', behind: Q, far: [[1.4, 2.4], [2.8, 4.2]], near: [[-0.4 + k, 2.4], [-1.4 + k * 2, 3.4 - k * 1.2]], nearItem: (P, h) => { besta(P, [h[0] + 3.4, h[1] + 1.2], 1.32, false, false, 0); manivela(P, [h[0] + 3.4, h[1] + 1.2], 1.32, k); } });   // cranking
  S[12] = man(K, { legs: 'clA', behind: Q, far: climbF(0), near: climbN(1) });
  S[13] = man(K, { legs: 'clB', behind: Q, far: climbF(1), near: climbN(0) });
  return S;
}
function armadilheiro(K) {
  const B = (P, bx, by) => sinos(P, bx, by), S = [];
  const club = (P, h) => porrete(P, h, 1.2);
  S[0] = man(K, { behind: B, far: [[-0.3, 3], [0, 5.8]], near: [[0.6, 3], [1.2, 5.6]], nearItem: club });
  for (let i = 0; i < 4; i++) { const k = i % 2 ? 0 : i === 0 ? 1 : -1; S[1 + i] = man(K, { legs: W4[i], lean: 1, behind: B, far: swingF(k * 1.4), near: [[0.4 - k, 2.8], [2.4 - k * 1.6, 4]], nearItem: (P, h) => porrete(P, h, -0.9) }); }   // running, the club up
  S[5] = man(K, { crouch: 'kneel', lean: 1, behind: B, far: [[2, 3.6], [4.4, 7]], near: [[2.2, 3.4], [5, 6.6]] });   // setting a trap
  S[6] = man(K, { crouch: 'squat', behind: B, far: [[1.4, 2.6], [2.8, 4.6]], near: [[1.6, 2.4], [3.2, 4]], nearItem: (P, h) => porrete(P, h, -0.5) });   // waiting
  S[7] = man(K, { lean: -1, legs: 'w2', behind: B, far: [[1.6, 2], [3.4, 3.6]], near: [[-0.6, -3.4], [-1.6, -6.4]], nearItem: (P, h) => porrete(P, h, -2.3) });   // the club raised
  S[8] = man(K, { lean: 1, legs: 'w0', behind: B, far: [[-1.2, 2.6], [-2.2, 5]], near: [[3, 1.2], [5.8, 2.6]], nearItem: (P, h) => porrete(P, h, 0.85) });   // the blow
  S[9] = man(K, { legs: 'clA', behind: B, far: climbF(0), near: climbN(1) });
  S[10] = man(K, { legs: 'clB', behind: B, far: climbF(1), near: climbN(0) });
  return S;
}
function telhadeiro(K) {
  const R = rolo, S = [];
  S[0] = man(K, { crouch: 'squat', behind: R, far: [[1.4, 2.4], [2.8, 4.4]], near: [[1.6, 2.6], [3, 5]], nearItem: (P, h) => adaga(P, h, 0.9) });   // perched
  for (let i = 0; i < 4; i++) { const k = i % 2 ? 0 : i === 0 ? 1 : -1; S[1 + i] = man(K, { legs: W4[i], behind: R, far: swingF(k), near: swingN(k), nearItem: (P, h) => adaga(P, h, 1.2) }); }
  S[5] = man(K, { behind: R, legs: 'w2', far: [[0.6, 3], [1.4, 5.6]], near: [[1.6, -3], [3.6, -5.6]] });   // the throw
  S[6] = man(K, { legs: 'jump', far: [[1.6, 2.4], [3.4, 4.4]], near: [[0.3, -3], [0.6, -6.2]], nearItem: (P, h) => P.put(h[0], h[1] - 1, RI.corda, 4), farItem: (P, h) => adaga(P, h, 0.6) });   // swinging
  S[7] = man(K, { legs: 'jump', lean: 1, far: [[2.4, 1.8], [5, 3.2]], near: [[3, 0.8], [6, 1.6]], farItem: (P, h) => adaga(P, h, 0.5), nearItem: (P, h) => adaga(P, h, 0.3) });   // the drop (drawn tilted)
  S[8] = man(K, { crouch: 'kneel', behind: R, far: [[2, 2], [4.2, 3.4]], near: [[2.4, 1.6], [5, 2.2]], farItem: (P, h) => adaga(P, h, 0.4), nearItem: (P, h) => adaga(P, h, 0.1) });   // landed
  S[9] = man(K, { lean: -1, legs: 'w2', behind: R, far: [[-1.4, 2], [-3.4, 1.4]], near: [[-2, 1.4], [-4.2, 0]], farItem: (P, h) => adaga(P, h, -2.7), nearItem: (P, h) => adaga(P, h, -2.9) });   // daggers back
  S[10] = man(K, { lean: 1, legs: 'w0', behind: R, far: [[3, 1.6], [5.8, 3]], near: [[3, -0.2], [6, -0.6]], farItem: (P, h) => adaga(P, h, 0.4), nearItem: (P, h) => adaga(P, h, -0.1) });   // the slash
  S[11] = man(K, { legs: 'clA', behind: R, far: climbF(0), near: climbN(1) });
  S[12] = man(K, { legs: 'clB', behind: R, far: climbF(1), near: climbN(0) });
  return S;
}
// the grappling hook (9 x 8, prongs up: hung under a beam it is drawn flipped) and the bolt (11 x 3)
function gancho() {
  const P = cp(9, 8);
  P.line(4.5, 3, 4.5, 7.6, RI.ferro, 4); P.put(4.5, 7.6, RI.corda, 3.6);
  for (const k of [-1, 1]) { P.line(4.5, 3.2, 4.5 + k * 3, 1.6, RI.ferro, 4.6); P.put(4.5 + k * 3.4, 0.6, RI.ferro, 5.4); }
  P.put(4.5, 0.6, RI.ferro, 5.2); P.put(4.5, 1.6, RI.ferro, 4);
  return set(P.done());
}
function virote() {
  const P = cp(11, 3);
  P.line(1, 1, 8, 1, RI.cabo, 3.8); P.put(9, 1, RI.ferro, 5); P.put(10, 1, RI.ferro, 6); P.put(9, 0, RI.ferro, 3.4); P.put(9, 2, RI.ferro, 2.6);
  P.put(0, 0, RI.vidro, 4); P.put(0, 2, RI.vidro, 3); P.put(1, 0, RI.vidro, 3.4); P.put(1, 2, RI.vidro, 2.6);
  return set(P.done());
}
// caltrops (a few black spikes) and the bells for the wire
function estrepes() {
  const P = cp(12, 4);
  for (const [x, h] of [[1.5, 2], [4, 3], [6.5, 2], [9, 3], [10.8, 2]]) { P.line(x, 3.6, x, 3.6 - h, RI.ferro, 2.4); P.put(x, 3.6 - h, RI.ferro, 4.2); P.put(x - 0.8, 3.6, RI.ferro, 1.6); P.put(x + 0.8, 3.6, RI.ferro, 1.6); }
  return P.done();
}
function sino() { const P = cp(3, 4); P.put(1, 0, RI.ferro, 3); P.blob(1.5, 2.2, 1.5, 1.4, RI.latao, 931, 3.6); P.put(1, 3.6, RI.latao, 1.6); return P.done(); }
// the net: a loose square of tarred rope, knots at the crossings
function rede() {
  const P = cp(22, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 22; x++) {
    const sag = Math.sin(x / 21 * Math.PI) * 1.6, u = (x + y * 0.4 + sag) % 4, v = (y - x * 0.3 + sag) % 4;
    if (u < 0.9 || v < 0.9) P.put(x, y, RI.corda, (u < 0.9 && v < 0.9) ? 5 : 3 + cg(x, y, 941) * 0.8);
  }
  return P.done();
}
let built = null;
CDV.get = () => {
  if (built) return built;
  const kits = { saqueador: kit('saqueador', 33101), besteiro: kit('besteiro', 33201), armadilheiro: kit('armadilheiro', 33301), telhadeiro: kit('telhadeiro', 33401) };
  built = {
    saqueador: saqueador(kits.saqueador), besteiro: besteiro(kits.besteiro), armadilheiro: armadilheiro(kits.armadilheiro), telhadeiro: telhadeiro(kits.telhadeiro),
    hook: gancho(), bolt: virote(), caltrops: estrepes(), bell: sino(), net: rede()
  };
  return built;
};
CDV.GL = { lamp: glow(18, '#ffb04a'), tip: glow(8, '#ffd88a'), glint: glow(5, '#c4c8cc'), bell: glow(5, '#e0bc66') };
}

/* ================= behaviour ================= */
function cdvWand(e, dt) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
const cdvVoice = (e, fn) => { if ((e.voiceT || 0) <= gameTime) { e.voiceT = gameTime + 0.7; fn(); } };
function cdvBox(e, reach, up = 2, h = 12) { const ecx = e.x + e.w / 2; return { x: e.facing > 0 ? ecx : ecx - reach, y: e.y + up, w: reach, h }; }

/* ---------- the saqueador ---------- */
// monster drops lying near him that he can walk to (never the hero's own)
function cdvLootScan(e) {
  const ecx = e.x + e.w / 2, ey = e.y + e.h;
  let best = null, bd = 1e9;
  for (const o of loot) {
    if (!o.cdMob || o.t < 0.4 || (o.cdClaim && o.cdClaim !== e && !o.cdClaim.dead)) continue;
    const d = Math.hypot(o.x - ecx, (o.y - ey) * 1.2); if (d > 10 * T || d >= bd) continue;
    best = o; bd = d;
  }
  if (!best) return null;
  const [gx, gy] = cdvFloorCell(best.x, best.y), nav = cdvNav(e, gx, gy, null, 14, 22);
  return nav ? best : null;
}
function cdvTake(e, o) {
  const i = loot.indexOf(o); if (i < 0) return;
  loot.splice(i, 1); (e.bag || (e.bag = [])).push({ id: o.id, n: o.n, item: o.item });
  if (ITEMS[o.id] && ITEMS[o.id].gold) sfx.coin(); else sfx.cdvRustle();
  cdvVoice(e, sfx.cdvHeh);
}
AI.saqueador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.lootCD = (e.lootCD || 0) - dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'pick') {
    e.vx = approach(e.vx, 0, 700 * dt);
    if (e.stateT <= 0) { if (e.pickO) cdvTake(e, e.pickO); e.pickO = null; e.state = 'walk'; e.lootCD = 0.2; }
    return;
  }
  if (e.state === 'wind') {   // the machete drawn back
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) { e.state = 'stab'; e.stateT = 0.62; e.stabN = 0; }
    return;
  }
  if (e.state === 'stab') {   // two stabs: one at the start, one after a short pull back
    const k = 0.62 - e.stateT;
    if ((e.stabN === 0 && k >= 0.04) || (e.stabN === 1 && k >= 0.34)) {
      e.stabN++; sfx.cdvStab(); if (e.stabN === 1) cdvVoice(e, sfx.cdvGrunt);
      e.vx = ledgeAhead(e, e.facing, 0, false) === 'stop' ? 0 : e.facing * 80;
      if (!pl.dead && overlap(cdvBox(e, 24, 4, 12), pl) && clearPath(e, pl)) hurtPlayer(Math.max(1, Math.round(e.dmg * 0.65)), ecx, e, false);
    }
    e.vx = approach(e.vx, 0, 500 * dt); e.stabOut = (k < 0.22 && k >= 0.04) || k >= 0.34;
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.8 + Math.random() * 0.6; } return; }
  // a monster drop on the ground comes first, before the hero
  if (!e.cdMode && e.lootCD <= 0 && !(e.cdGoal && e.cdGoal.loot)) {
    e.lootCD = 0.5;
    const o = cdvLootScan(e);
    if (o) { o.cdClaim = e; e.cdGoal = { x: o.x, y: o.y, t: 7, keep: true, sp: 70, r: 8, loot: o, done: s => { if (loot.indexOf(o) >= 0) { s.state = 'pick'; s.stateT = 0.4; s.pickO = o; } } }; e.cdNavT = 0; cdvVoice(e, sfx.cdvHeh); }
  }
  if (e.cdGoal && e.cdGoal.loot) { const o = e.cdGoal.loot; if (loot.indexOf(o) < 0) e.cdGoal = null; else { e.cdGoal.x = o.x; e.cdGoal.y = o.y; } }
  if (humanStep(e, dt, dx, dy, dist, aggro)) return;
  let dir = 0;
  if (!aggro) { cdvWand(e, dt); dir = e.wander; }
  else dir = Math.abs(dx) < 16 && Math.abs(dy) < 20 ? 0 : Math.sign(dx);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  walk(e, dt, dir, aggro ? 34 + e.lvl * 0.5 : 18, 300, 270, dy, aggro);   // a careful walker: never a drop he didn't choose
  if (aggro && Math.abs(dx) < 28 && Math.abs(dy) < 20 && e.atkCD <= 0 && e.onGround && clearPath(e, pl)) { e.state = 'wind'; e.stateT = 0.5; e.facing = Math.sign(dx) || e.facing; sfx.cdvDraw(); }
};

/* ---------- the besteiro ---------- */
const cdvBolts = [];
HUMAN_FREE.besteiro = e => e.state === 'walk' || e.state === 'crouch';
// the highest spot near the hero he can walk or climb to, with a view of the hero, best behind a parapet
function cdvPerch(e) {
  const [hx, hy] = cdvHeroCell(), sy = Math.floor((e.y + e.h + 1) / T), hT = Math.ceil(e.h / T);
  const hcx = pl.x + pl.w / 2, hcy = pl.y + 9;
  return cdvNav(e, 0, 0, (x, y, n) => {
    if (!navStand(x, y, hT)) return -Infinity;
    const adx = Math.abs(x - hx); if (adx > 22 || adx < 5 || Math.abs(y - hy) > 14) return -Infinity;
    const side = Math.sign(hx - x) || 1, parapet = solidAt(x + side, y - 1) && !solidAt(x + side, y - 2) ? 4 : 0;
    if (!losClear(x * T + 6 + side * 4, (y - 2) * T + 3, hcx, hcy)) return -Infinity;   // he shoots standing, from the chest
    return (hy - y) * 2.4 + (sy - y) * 0.6 - n * 0.2 + parapet;
  }, 26, 46);
}
function cdvShoot(e) {
  const ecx = e.x + e.w / 2, ox = ecx + e.facing * 6, oy = e.y + 5;   // from the tip, at the line he checked
  const a = e.boltA, sp = 330;
  cdvBolts.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, a, t: 0, dmg: e.dmg, stuck: false });
  sfx.cdvTwang();
}
AI.besteiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.perchT = (e.perchT || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + 9;
  if (e.state === 'aim') {   // stands, the crossbow up, the tip glowing
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    const ox = ecx + e.facing * 6, oy = e.y + 5;
    if (e.stateT > 0.15) { const a = Math.atan2(pcy - oy, pcx - ox); e.boltA = a; e.aimA = clamp(Math.atan2(pcy - oy, Math.abs(pcx - ox)), -0.6, 0.6); }   // locks the last moment
    if (e.stateT <= 0) { cdvShoot(e); e.state = 'shot'; e.stateT = 0.22; }
    return;
  }
  if (e.state === 'shot') { e.vx = 0; if (e.stateT <= 0) { e.state = 'reload'; e.stateT = 2; e.crankT = 0; } return; }
  if (e.state === 'reload') {   // cranking the string back: two seconds standing in the open
    e.vx = approach(e.vx, 0, 700 * dt); e.crankT -= dt;
    if (e.crankT <= 0) { e.crankT = 0.25; e.crankK = !e.crankK; sfx.cdvCrank(); }
    if (e.stateT <= 0) { e.state = e.perch ? 'crouch' : 'walk'; e.atkCD = 0.5 + Math.random() * 0.5; sfx.cdvLatch(); }
    return;
  }
  if (humanStep(e, dt, dx, dy, dist, aggro)) return;
  const heroNear = dist < 44;
  if (e.state === 'crouch') {
    e.vx = approach(e.vx, 0, 700 * dt);
    if (aggro) e.facing = Math.sign(dx) || e.facing;
    if (heroNear || !aggro && e.perchT <= -6) { e.state = 'walk'; e.perch = null; e.perchT = 0; return; }
    if (aggro && e.atkCD <= 0 && dist < 270 && losClear(ecx + e.facing * 6, e.y + 5, pcx, pcy)) { e.state = 'aim'; e.stateT = 0.9; sfx.cdvRaise(); cdvVoice(e, sfx.cdvBreath); }
    else if (aggro && e.perchT <= -3 && !losClear(ecx + e.facing * 6, e.y + 5, pcx, pcy)) { e.state = 'walk'; e.perch = null; e.perchT = 0; }   // lost the view: a new spot
    return;
  }
  // walking: to a high spot, or shooting from where he stands when there is none
  if (aggro && e.perchT <= 0 && !e.cdGoal) {
    e.perchT = 2.5;
    const nav = cdvPerch(e);
    if (nav && nav.kind === 'here') { e.state = 'crouch'; e.perch = { x: nav.gx, y: nav.gy }; e.perchT = 0; sfx.cdvCrouch(); return; }
    e.perchFail = !nav;
    if (nav) { const gx = nav.gx, gy = nav.gy; e.perch = { x: gx, y: gy }; e.cdGoal = { x: gx * T + T / 2, y: gy * T, t: 12, keep: true, sp: 58, r: 5, done: s => { s.state = 'crouch'; s.perchT = 0; sfx.cdvCrouch(); } }; e.cdNavT = 0; return; }
  }
  let dir = 0;
  if (!aggro) { cdvWand(e, dt); dir = e.wander; if (dir) e.facing = dir; }
  else { const adx = Math.abs(dx); dir = adx < 60 ? -Math.sign(dx) : adx > 170 ? Math.sign(dx) : 0; e.facing = Math.sign(dx) || e.facing; }
  walk(e, dt, dir, aggro ? 40 + e.lvl * 0.5 : 18, 300, 270, dy, aggro && dir === Math.sign(dx));
  if (aggro && e.perchFail && dist < 230 && dist > 30 && e.atkCD <= 0 && e.onGround && losClear(ecx + e.facing * 6, e.y + 5, pcx, pcy)) { e.state = 'aim'; e.stateT = 0.9; sfx.cdvRaise(); }
};
// the bolts: straight and fast; stuck in a wall they stay 5 s and hold the hero like a step
function cdvBoltTick(dt) {
  for (let i = cdvBolts.length - 1; i >= 0; i--) {
    const b = cdvBolts[i]; b.t += dt;
    if (b.stuck) { if (b.t > 5 || !solidAt(b.cx, b.cy)) { burst(b.x, b.y, 4, '#5e462a', 30, 300, 0.4); cdvBolts.splice(i, 1); } continue; }
    const n = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 4)), sx = b.vx * dt / n, sy = b.vy * dt / n;
    let gone = false;
    for (let k = 0; k < n; k++) {
      const ox = b.x, oy = b.y; b.x += sx; b.y += sy;
      if (!pl.dead && b.x > pl.x - 1 && b.x < pl.x + pl.w + 1 && b.y > pl.y && b.y < pl.y + pl.h) { hurtPlayer(b.dmg, b.x - sx * 4, null, true); burst(b.x, b.y, 5, '#8a6a48', 50, 300, 0.3); gone = true; break; }
      const cx = Math.floor(b.x / T), cy = Math.floor(b.y / T);
      if (solidAt(cx, cy)) {
        const ocx = Math.floor(ox / T), ocy = Math.floor(oy / T);
        b.stuck = true; b.t = 0; b.cx = cx; b.cy = cy; b.vx = 0; b.vy = 0;
        if (ocx !== cx && !solidAt(ocx, cy)) { b.side = ocx < cx ? 1 : -1; b.x = b.side > 0 ? cx * T : (cx + 1) * T; b.y = oy; b.a = b.side > 0 ? 0 : Math.PI; }   // a wall: a step
        else { b.side = 0; b.x = ox; b.y = oy; }
        sfx.cdvThunk(); burst(b.x, b.y, 5, '#6a5a48', 50, 300, 0.35); break;
      }
    }
    if (gone || b.t > 2.5) cdvBolts.splice(i, 1);
  }
}
// the hero lands on a bolt stuck in a wall (a one-way step 9 px out from the wall)
function cdvBoltStep(e, yb) {
  for (const b of cdvBolts) {
    if (!b.stuck || !b.side) continue;
    const top = Math.round(b.y) - 1, x0 = b.side > 0 ? b.x - 9 : b.x, x1 = b.side > 0 ? b.x : b.x + 9;
    if (e.x + e.w <= x0 + 1 || e.x >= x1 - 1) continue;
    if (yb <= top + 0.5 && e.y + e.h >= top) { e.y = top - e.h; e.vy = 0; e.onGround = true; return; }
  }
}
{ const _m = moveEntity; moveEntity = function (e, dt, step) {
  const yb = e.y + e.h, r = _m(e, dt, step);
  if (e === pl && cdvBolts.length && e.vy >= 0 && !e.onGround) cdvBoltStep(e, yb);
  return r;
}; }

/* ---------- the armadilheiro ---------- */
const cdvTraps = [], cdvNets = [];
HUMAN_FREE.armadilheiro = e => e.state === 'walk' || e.state === 'wait';
// a spot on the hero's way, 3 to 8 blocks ahead of him, that the trapper reaches first; narrow places score best
function cdvTrapSpot(e) {
  const [hx, hy] = cdvHeroCell(), hT = Math.ceil(e.h / T), heroSteps = Math.abs(hx - Math.floor((e.x + e.w / 2) / T));
  const hd = Math.abs(pl.vx) > 20 ? Math.sign(pl.vx) : Math.sign(e.x - pl.x) || 1;
  return cdvNav(e, 0, 0, (x, y, n) => {
    if (!navStand(x, y, hT) || Math.abs(y - hy) > 2) return -Infinity;
    const ahead = (x - hx) * hd; if (ahead < 3 || ahead > 9 || n > heroSteps + 6) return -Infinity;
    for (const t of cdvTraps) if (Math.abs(t.tx - x) <= 2 && Math.abs(t.ty - y) <= 1) return -Infinity;
    let roof = 0; for (let k = hT + 1; k <= 4; k++) if (solidAt(x, y - k)) { roof = 5 - k; break; }
    return roof * 2 - Math.abs(ahead - 5) - n * 0.15;
  }, 20, 26);
}
function cdvSetTrap(e) {
  const tx = Math.floor((e.x + e.w / 2 + e.facing * 8) / T), fy = Math.floor((e.y + e.h + 1) / T), ty = navStand(tx, fy, 2) ? fy : Math.floor((e.y + e.h + 1) / T);
  const x = navStand(tx, ty, 2) ? tx : Math.floor((e.x + e.w / 2) / T);
  // a wire needs three blocks of floor; otherwise caltrops
  const wire = e.nextWire && navStand(x - 1, ty, 2) && navStand(x + 1, ty, 2);
  cdvTraps.push({ kind: wire ? 'fio' : 'estrepe', tx: x, ty, x: (x + 0.5) * T, y: ty * T, owner: e, t: 0, dmg: e.dmg, seed: Math.random() * 10 });
  e.nextWire = !e.nextWire; e.trapN = (e.trapN || 0) + 1;
  sfx.cdvSet(wire);
  let n = 0; for (let i = cdvTraps.length - 1; i >= 0; i--) if (cdvTraps[i].owner === e && ++n > 3) cdvTraps.splice(i, 1);   // three at a time
}
function cdvTrapSprung(t) {   // the trappers near come for the hero
  for (const e of enemies) if (!e.dead && e.type === 'armadilheiro' && (e === t.owner || Math.hypot(e.x - t.x, e.y - t.y) < 15 * T)) { e.fightT = 8; e.cdGoal = null; if (e.state === 'wait' || e.state === 'set') e.state = 'walk'; }
}
AI.armadilheiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.fightT = (e.fightT || 0) - dt; e.trapCD = (e.trapCD || 0) - dt; e.hurtT = (e.hurtT || 0) - dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'set') {
    e.vx = approach(e.vx, 0, 800 * dt);
    if (Math.random() < dt * 5) sfx.cdvClink();
    if (e.stateT <= 0) {
      cdvSetTrap(e); e.trapCD = 1.6;
      // back off a few blocks beyond it and wait there, watching
      const away = Math.sign(ecx - (pl.x + pl.w / 2)) || 1;
      e.state = 'walk'; e.cdGoal = { x: ecx + away * (4 + Math.random() * 2) * T, y: e.y + e.h, t: 3, keep: true, sp: 70, r: 10, done: s => { s.state = 'wait'; s.facing = Math.sign(pl.x - s.x) || s.facing; } }; e.cdNavT = 0;
    }
    return;
  }
  if (e.state === 'wind') {   // the club over his head
    e.vx = approach(e.vx, 0, 700 * dt);
    if (e.stateT <= 0) { e.state = 'swing'; e.stateT = 0.16; e.swingHit = false; sfx.swing(); cdvVoice(e, sfx.cdvGrunt); }
    return;
  }
  if (e.state === 'swing') {
    if (!e.swingHit && e.stateT < 0.1) { e.swingHit = true; if (!pl.dead && overlap(cdvBox(e, 26, -2, 20), pl) && clearPath(e, pl)) { hurtPlayer(e.dmg, ecx, e, false); shake(1.5); } }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.9 + Math.random() * 0.6; } return; }
  if (humanStep(e, dt, dx, dy, dist, aggro)) return;
  const fight = e.fightT > 0 || (dist < 30 && e.hurtT > 0);
  if (fight) {   // the hero walked into it: now the club
    if (e.state === 'wait') e.state = 'walk';
    const dir = Math.abs(dx) < 16 ? 0 : Math.sign(dx); e.facing = Math.sign(dx) || e.facing;
    walk(e, dt, dir, 54 + e.lvl * 0.5, 400, 280, dy, true);
    if (Math.abs(dx) < 26 && Math.abs(dy) < 22 && e.atkCD <= 0 && e.onGround && clearPath(e, pl)) { e.state = 'wind'; e.stateT = 0.6; sfx.cdvCreak(); }
    return;
  }
  if (e.state === 'wait') {
    e.vx = approach(e.vx, 0, 700 * dt); if (aggro) e.facing = Math.sign(dx) || e.facing;
    if (dist < 50 || (aggro && e.trapCD <= 0 && Math.abs(dx) > 4 * T && cdvTraps.filter(t => t.owner === e).length < 3 && e.stateT <= 0)) { e.state = 'walk'; e.stateT = 0; }
    return;
  }
  if (aggro && e.trapCD <= 0) {   // run ahead of the hero to set the next one
    e.trapCD = 1.2;
    const nav = cdvTrapSpot(e);
    if (nav) {
      if (nav.kind === 'here') { e.state = 'set'; e.stateT = 1.1; e.facing = Math.sign(dx) || e.facing; return; }
      e.cdGoal = { x: nav.gx * T + T / 2, y: nav.gy * T, t: 4, keep: true, sp: 76, r: 7, done: s => { s.state = 'set'; s.stateT = 1.1; s.facing = Math.sign(pl.x - s.x) || s.facing; } }; e.cdNavT = 0;
      return;
    }
  }
  // nothing to do: keep his distance
  let dir = 0;
  if (!aggro) { cdvWand(e, dt); dir = e.wander; if (dir) e.facing = dir; }
  else { e.facing = Math.sign(dx) || e.facing; dir = dist < 70 ? -Math.sign(dx) : 0; }
  walk(e, dt, dir, aggro ? 60 : 20, 400, 280, dy, false);
};
function cdvTrapTick(dt) {
  const pcx = pl.x + pl.w / 2, feet = pl.y + pl.h;
  for (let i = cdvTraps.length - 1; i >= 0; i--) {
    const t = cdvTraps[i]; t.t += dt;
    if (t.t > 60 || !solidAt(t.tx, t.ty) || solidAt(t.tx, t.ty - 1)) { cdvTraps.splice(i, 1); continue; }
    if (pl.dead || t.t < 0.4) continue;
    if (t.kind === 'estrepe') {
      if (Math.abs(pcx - t.x) < 7 && feet >= t.y - 2 && feet <= t.y + 1 && pl.vy >= 0) {
        cdvTraps.splice(i, 1);
        hurtPlayer(Math.max(1, Math.round(t.dmg * 0.5)), t.x, null, true); fungLentidao(0.45, 3);
        burst(t.x, t.y - 2, 6, '#9aa0aa', 50, 300, 0.3, 1, true); sfx.cdvCaltrop(); cdvTrapSprung(t);
      }
    } else if (Math.abs(pcx - t.x) < 18 && feet >= t.y - 5 && feet <= t.y + 1) {   // the wire, ankle high across three blocks
      cdvTraps.splice(i, 1);
      sfx.cdvBells(); cdAlarme(t.x, t.y - 6, 20); cdvTrapSprung(t);
      // the net hangs above: its square shadow on the floor first, then it drops
      let top = Math.floor((pl.y - 1) / T), k = 0; while (k < 8 && !solidAt(Math.floor(pcx / T), top - 1)) { top--; k++; }
      const [, fy] = cdvFloorCell(pcx, feet);
      cdvNets.push({ x: pcx, fy: fy * T, top: top * T, t: 0, hit: false });
    }
  }
  for (let i = cdvNets.length - 1; i >= 0; i--) {
    const n = cdvNets[i]; n.t += dt;
    if (n.t >= 0.52 && !n.done) {   // 0.4 s of shadow, then it falls fast
      n.done = true;
      if (!pl.dead && Math.abs(pl.x + pl.w / 2 - n.x) < 12 && pl.y + pl.h > n.fy - 30 && pl.y < n.fy + 2) { n.hit = true; cdEnredar(1.5); sfx.cdvNet(); n.on = 1.5; }
      else { sfx.cdvNetMiss(); }
    }
    if (n.on > 0) n.on -= dt;
    if (n.t > (n.hit ? 2.1 : 2.4)) cdvNets.splice(i, 1);
  }
}

/* ---------- the telhadeiro ---------- */
HUMAN_FREE.telhadeiro = e => e.state === 'walk' || e.state === 'perch';
// the rope path from S to D (hand points): x eases fast in the middle like a pendulum, y dips (or lifts) by sag
function cdvSwingAt(r, t) {
  const k = (1 - Math.cos(Math.PI * t)) / 2, ky = r.dy < r.sy ? Math.sin(Math.PI * t / 2) : 1 - Math.cos(Math.PI * t / 2);   // up early to a higher roof, down late to a lower one
  return [r.sx + (r.dx - r.sx) * k, r.sy + (r.dy - r.sy) * ky + r.sag * Math.sin(Math.PI * t)];
}
function cdvSwingClear(e, r) {
  for (let i = 1; i < 24; i++) {
    const [hx, hy] = cdvSwingAt(r, i / 24);
    if (hy < r.ay + 10 || rectSolid(hx - e.w / 2 - 1, hy - 3, e.w + 2, e.h + (i > 2 && i < 22 ? 1 : 0))) return false;
    if (i % 4 === 0 && !losClear(r.ax, r.ay + 2, hx, hy)) return false;
  }
  return losClear(r.ax, r.ay + 2, r.sx, r.sy) && losClear(r.ax, r.ay + 2, r.dx, r.dy);
}
// a roof to swing to: high, near the hero (best with the hero under the way), and a beam or a ceiling above to hook
function cdvPlanSwing(e, flee) {
  const hT = 2, sxT = Math.floor((e.x + e.w / 2) / T), syT = Math.floor((e.y + e.h + 1) / T), [hx, hy] = cdvHeroCell();
  const S = [e.x + e.w / 2, e.y + 2], cands = [];
  for (let x = sxT - 16; x <= sxT + 16; x++) {
    if (Math.abs(x - sxT) < 3) continue;
    for (let y = syT - 9; y <= syT + 4; y++) {
      if (!navStand(x, y, hT) || solidAt(x, y - hT - 1)) continue;   // a roof with room above to swing off again
      if (y === syT) { let joined = true; for (let k = Math.min(x, sxT); k <= Math.max(x, sxT) && joined; k++) if (!navStand(k, y, hT)) joined = false; if (joined) continue; }   // the same roof: he walks that
      let s = Math.min(8, hy - y) * 1.5 - (y >= hy ? 8 : 0) - (y === syT && Math.abs(x - sxT) < 9 ? 7 : 0);
      const over = (sxT - hx) * (x - hx) < 0;   // the hero between here and there
      if (flee) s += Math.abs(x - hx) * 0.8; else s += (over ? 6 : 0) - Math.abs(x - hx) * 0.35 - (Math.abs(x - hx) < 2 ? 6 : 0);
      cands.push([s, x, y]);
    }
  }
  cands.sort((a, b) => b[0] - a[0]);
  for (let c = 0; c < Math.min(8, cands.length); c++) {
    const [, x, y] = cands[c], D = [(x + 0.5) * T, y * T - e.h + 2];
    const mid = Math.round((sxT + x) / 2), top = Math.min(syT, y);
    for (const ax of [mid, mid - 1, mid + 1, mid - 2, mid + 2]) {
      let ay = -1; for (let k = top - 3; k >= top - 12; k--) if (solidAt(ax, k) && !solidAt(ax, k + 1)) { ay = k; break; }
      if (ay < 0) continue;
      const A = [(ax + 0.5) * T, (ay + 1) * T];
      for (const sag of [26, 16, 6, -8, -20]) {
        const r = { sx: S[0], sy: S[1], dx: D[0], dy: D[1], ax: A[0], ay: A[1], sag };
        if (cdvSwingClear(e, r)) { r.T = clamp(Math.abs(D[0] - S[0]) / 125, 0.6, 1.4); r.t = 0; r.dest = [x, y]; return r; }
      }
    }
  }
  return null;
}
function cdvDiveTo(e) {   // let go: straight down at the marked spot
  const tx = e.markX, ty = e.markY - e.h / 2, cx = e.x + e.w / 2, cy = e.y + e.h / 2, d = Math.hypot(tx - cx, ty - cy) || 1;
  e.diveV = [(tx - cx) / d * 230, (ty - cy) / d * 230]; e.state = 'dive'; e.stateT = 0.9; e.swingHit = false; e.rope = null;
  e.facing = Math.sign(tx - cx) || e.facing; sfx.cdvLetGo(); cdvVoice(e, sfx.cdvShout);
}
AI.telhadeiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.planT = (e.planT || 0) - dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'throw') {   // the hook flies up to the beam
    e.vx = approach(e.vx, 0, 900 * dt);
    if (e.stateT <= 0) { e.state = 'swing'; e.rope.t = 0; sfx.cdvHookBite(); e.onGround = false; }
    return;
  }
  if (e.state === 'swing' || e.state === 'mark') {
    const r = e.rope;
    if (e.hitWall || e.hitCeil) { e.state = 'fall'; e.rope = null; return; }   // struck something: falls
    r.t = Math.min(1, r.t + dt / r.T);
    const [hx, hy] = cdvSwingAt(r, r.t), nx = hx - e.w / 2, ny = hy - 2;
    e.vx = (nx - e.x) / dt; e.vy = (ny - e.y) / dt - GRAV * dt; e.facing = Math.sign(r.dx - r.sx) || e.facing;
    if (e.state === 'mark') { if (e.stateT <= 0 || r.t >= 1) cdvDiveTo(e); return; }
    // over the hero, a little ahead: mark the spot (his shadow), then let go
    const fwd = (pcx - ecx) * e.facing;
    if (aggro && !pl.dead && r.t > 0.12 && r.t < 0.75 && fwd > 4 && fwd < 80 && pl.y > e.y + e.h + 4 && pl.y - e.y < 130 && losClear(ecx, e.y + e.h, pcx, pl.y + 9)) {
      e.state = 'mark'; e.stateT = 0.5; e.markX = pcx; e.markY = cdvFloorCell(pcx, pl.y + pl.h)[1] * T; sfx.cdvCreakRope();
      return;
    }
    if (r.t >= 1) { e.state = 'perch'; e.rope = null; e.vx = 0; e.vy = 0; e.stateT = 0.8 + Math.random() * 0.8; sfx.cdvLand(); }
    return;
  }
  if (e.state === 'dive') {
    e.vx = e.diveV[0]; e.vy = e.diveV[1] - GRAV * dt;
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 3, y: e.y + 4, w: e.w + 6, h: e.h - 2 }, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.onGround || e.hitWall || e.stateT <= 0) { e.state = 'land'; e.stateT = 0.6; e.vx = 0; burst(ecx, e.y + e.h, 8, '#6a5e50', 50, 300, 0.4); sfx.cdvLand(); }
    return;
  }
  if (e.state === 'fall') { if (e.onGround) { e.state = 'land'; e.stateT = 0.5; sfx.cdvLand(); } return; }
  if (e.state === 'land') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.planT = 0; e.atkCD = Math.max(e.atkCD, 0.4); } return; }
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 800 * dt); if (e.stateT <= 0) { e.state = 'slash'; e.stateT = 0.14; e.swingHit = false; sfx.cdvSlash(); } return; }
  if (e.state === 'slash') {
    if (!e.swingHit) { e.swingHit = true; if (!pl.dead && overlap(cdvBox(e, 22, 2, 14), pl) && clearPath(e, pl)) hurtPlayer(Math.max(1, Math.round(e.dmg * 0.8)), ecx, e, false); }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.45; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = e.onGround ? 'walk' : 'walk'; e.atkCD = 0.7 + Math.random() * 0.5; } return; }
  if (humanStep(e, dt, dx, dy, dist, aggro)) return;
  const close = Math.abs(dx) < 24 && Math.abs(dy) < 20;
  if (aggro && close && e.atkCD <= 0 && e.onGround && clearPath(e, pl)) { e.state = 'wind'; e.stateT = 0.35; e.facing = Math.sign(dx) || e.facing; cdvVoice(e, sfx.cdvGrunt); return; }
  // a swing: from the floor at once, from a roof after a short wait
  if (aggro && e.onGround && e.planT <= 0 && (e.state === 'walk' || e.stateT <= 0)) {
    e.planT = e.state === 'perch' ? 1.2 : 0.7;
    const r = cdvPlanSwing(e, close);
    e.planFails = r ? 0 : (e.planFails || 0) + 1;
    if (!r && e.state === 'perch' && e.planFails > 3) e.state = 'walk';   // nowhere to swing: down on foot
    if (r) { e.rope = r; e.state = 'throw'; e.stateT = 0.28; e.vx = 0; e.facing = Math.sign(r.dx - r.sx) || e.facing; sfx.cdvThrow(); return; }
  }
  if (e.state === 'perch') { e.vx = approach(e.vx, 0, 800 * dt); if (aggro) e.facing = Math.sign(dx) || e.facing; return; }
  // on the floor with no beam in reach: on foot, after the hero
  let dir = 0;
  if (!aggro) { cdvWand(e, dt); dir = e.wander; if (dir) e.facing = dir; }
  else { dir = Math.abs(dx) < 14 ? 0 : Math.sign(dx); e.facing = Math.sign(dx) || e.facing; }
  walk(e, dt, dir, aggro ? 58 + e.lvl * 0.5 : 22, 450, 290, dy, aggro);
};

/* ================= drawing ================= */
const CDV_OX = 13, CDV_OY = 25;
function cdvBlit(set, e, fx, fy, fl, j = 0) { lc.drawImage(cvPick(set, e, fl), fx - CDV_OX + j, fy - CDV_OY); }
const cdvWalkK = e => e.onGround && Math.abs(e.vx) > 5 ? 1 + (Math.floor(e.t * (Math.abs(e.vx) > 50 ? 10 : 7)) % 4) : 0;
const cdvClimbK = e => Math.floor((e.climbD || 0) / 7) % 2;
// what humanStep has them doing, shared by the four
function cdvCommon(e, S, climb0, drink, hide) {
  if (e.cdClimb && !e.onGround) return S[climb0 + cdvClimbK(e)];
  if (e.cdMode === 'drink' && drink >= 0) return S[drink];
  if (e.cdMode === 'hide' && hide >= 0) return S[hide];
  return null;
}
DRAW_E.saqueador = (e, fx, fy, fl) => {
  const S = CDV.get().saqueador, st = e.state;
  const c = cdvCommon(e, S, 9, 7, 11);
  if (c) { cdvBlit(c, e, fx, fy, fl); return; }
  const k = st === 'wind' ? 5 : st === 'stab' ? (e.stabOut ? 6 : 5) : st === 'pick' ? 8 : cdvWalkK(e);
  cdvBlit(S[k], e, fx, fy, fl, st === 'wind' && e.stateT < 0.15 ? Math.round(Math.sin(e.t * 60) * 0.6) : 0);
};
DRAW_E.besteiro = (e, fx, fy, fl) => {
  const S = CDV.get().besteiro, st = e.state;
  const c = cdvCommon(e, S, 12, -1, 5);
  if (c) { cdvBlit(c, e, fx, fy, fl); return; }
  const k = st === 'crouch' ? 5 : st === 'aim' ? 6 + clamp(Math.round((e.aimA || 0) / 0.5) + 1, 0, 2) : st === 'shot' ? 9 : st === 'reload' ? (e.crankK ? 11 : 10) : cdvWalkK(e);
  cdvBlit(S[k], e, fx, fy, fl);
};
DRAW_E.armadilheiro = (e, fx, fy, fl) => {
  const S = CDV.get().armadilheiro, st = e.state;
  const c = cdvCommon(e, S, 9, -1, 6);
  if (c) { cdvBlit(c, e, fx, fy, fl); return; }
  const k = st === 'set' ? 5 : st === 'wait' ? 6 : st === 'wind' ? 7 : st === 'swing' || st === 'recover' && e.stateT > 0.35 ? 8 : cdvWalkK(e);
  cdvBlit(S[k], e, fx, fy, fl, st === 'set' ? (Math.floor(e.t * 8) % 2) : 0);
};
DRAW_E.telhadeiro = (e, fx, fy, fl) => {
  const B = CDV.get(), S = B.telhadeiro, st = e.state;
  const c = cdvCommon(e, S, 11, -1, 0);
  if (c) { cdvBlit(c, e, fx, fy, fl); return; }
  // the rope: from his raised hand to the hook on the beam
  const r = e.rope;
  if (r && (st === 'throw' || st === 'swing' || st === 'mark')) {
    const camX = Math.round(e.x + e.w / 2) - fx, camY = Math.round(e.y + e.h) - fy;
    const hx = fx + e.facing * (st === 'throw' ? 4 : 1), hy = fy - (st === 'throw' ? 24 : 26);
    const k = st === 'throw' ? clamp(1 - e.stateT / 0.28, 0, 1) : 1, ax = Math.round(lerp(hx, r.ax - camX, k)), ay = Math.round(lerp(hy, r.ay - camY, k));
    lc.fillStyle = st === 'mark' && Math.floor(e.t * 16) % 2 ? '#a08a5c' : '#6e5c38';
    const n = Math.max(Math.abs(ax - hx), Math.abs(ay - hy)) | 0;
    for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; lc.fillRect(Math.round(hx + (ax - hx) * t), Math.round(hy + (ay - hy) * t), 1, 1); }
    const H = B.hook; lc.save(); lc.translate(ax, ay); if (k >= 1) lc.scale(1, -1); lc.drawImage(H.r, -5, k >= 1 ? -1 : -9); lc.restore();
  }
  if (st === 'dive') { const img = cvPick(S[7], e, fl); lc.save(); lc.translate(fx, fy - 12); lc.rotate(0.55 * e.facing); lc.drawImage(img, -CDV_OX, -13); lc.restore(); return; }
  const k = st === 'throw' ? 5 : st === 'swing' || st === 'mark' ? 6 : st === 'land' ? 8 : st === 'perch' ? 0 : st === 'wind' ? 9 : st === 'slash' ? 10 : st === 'fall' ? 6 : st === 'recover' ? 8 : cdvWalkK(e);
  cdvBlit(S[k], e, fx, fy, fl, st === 'mark' ? Math.round(Math.sin(e.t * 40) * 0.6) : 0);
};
for (const t of CDV_TYPES) EYES_E[t] = () => { };
WARN_E.saqueador = e => e.state === 'wind';
WARN_E.besteiro = e => e.state === 'aim';
WARN_E.armadilheiro = e => e.state === 'wind';
WARN_E.telhadeiro = e => e.state === 'mark' || e.state === 'wind';

/* ---------- the world things: bolts, traps, nets, shadows ---------- */
HOOK.drawWorld.push((cx, cy) => {
  if (!cdvBolts.length && !cdvTraps.length && !cdvNets.length && !enemies.length) return;
  const B = CDV.get();
  for (const b of cdvBolts) {
    const x = Math.round(b.x) - cx, y = Math.round(b.y) - cy;
    if (x < -20 || x > VW + 20 || y < -20 || y > VH + 20) continue;
    const a0 = lc.globalAlpha; if (b.stuck && b.t > 4.4) lc.globalAlpha = a0 * (Math.floor(b.t * 12) % 2 ? 0.4 : 1);
    lc.save(); lc.translate(x, y); lc.rotate(b.a); lc.drawImage(B.bolt.r, b.stuck ? -12 + 3 : -6, -2); lc.restore();
    lc.globalAlpha = a0;
  }
  for (const t of cdvTraps) {
    const x = Math.round(t.x) - cx, y = Math.round(t.y) - cy;
    if (x < -30 || x > VW + 30 || y < -20 || y > VH + 20) continue;
    if (t.kind === 'estrepe') { const a0 = lc.globalAlpha; lc.globalAlpha = a0 * 0.85; lc.drawImage(B.caltrops, x - 6, y - 4); lc.globalAlpha = a0; }
    else {   // the wire: a taut grey line at the ankles, a bell at each end
      lc.fillStyle = 'rgba(150,146,136,0.55)'; lc.fillRect(x - 17, y - 4, 34, 1);
      lc.drawImage(B.bell, x - 19, y - 6); lc.drawImage(B.bell, x + 16, y - 6);
      lc.fillStyle = '#3a3d46'; lc.fillRect(x - 18, y - 7, 1, 7); lc.fillRect(x + 17, y - 7, 1, 7);
    }
  }
  for (const n of cdvNets) {
    const x = Math.round(n.x) - cx, fy = Math.round(n.fy) - cy;
    if (n.t < 0.52) {   // the square shadow growing on the floor
      const k = clamp(n.t / 0.4, 0, 1), w = Math.round(12 + 12 * k);
      lc.fillStyle = `rgba(4,3,6,${(0.35 + 0.45 * k).toFixed(2)})`; lc.fillRect(x - (w >> 1), fy, w, 2); lc.fillRect(x - (w >> 1) + 1, fy + 2, w - 2, 1);   // on the floor's face
      for (let i = 1; i < w; i += 3) lc.fillRect(x - (w >> 1) + i, fy + 3, 1, 1);
      if (n.t <= 0.4) { const sw = Math.round(Math.sin(n.t * 40)); lc.drawImage(B.net, x - 11 + sw, Math.round(n.top) - cy, 22, 8); }   // the bundle up there, shaking loose
      else { const f = (n.t - 0.4) / 0.12, ny = Math.round(lerp(n.top, n.fy - 16, f)) - cy; lc.drawImage(B.net, x - 11, ny); }   // falling
    } else if (n.hit && n.on > 0) {   // tangled on the hero
      lc.drawImage(B.net, Math.round(pl.x + pl.w / 2) - cx - 11, Math.round(pl.y + 4) - cy + (Math.floor(n.t * 3) % 2));
    } else if (!n.hit) { const a0 = lc.globalAlpha; lc.globalAlpha = a0 * clamp(2.4 - n.t, 0, 1); lc.drawImage(B.net, x - 11, fy - 6, 22, 6); lc.globalAlpha = a0; }
  }
  for (const e of enemies) {   // the roofrunner's shadow where he will land
    if (e.dead || e.type !== 'telhadeiro' || e.state !== 'mark') continue;
    const k = clamp(1 - e.stateT / 0.5, 0, 1), x = Math.round(e.markX) - cx, y = Math.round(e.markY) - cy, w = Math.round(6 + 8 * k);
    lc.fillStyle = `rgba(4,3,6,${(0.35 + 0.5 * k).toFixed(2)})`; lc.fillRect(x - (w >> 1), y, w, 2); lc.fillRect(x - (w >> 1) + 1, y + 2, w - 2, 1);
  }
});
HOOK.drawGlow.push((cx, cy) => {
  const G = CDV.GL;
  for (const e of enemies) {
    if (e.dead || !ET[e.type] || !ET[e.type].human) continue;
    if (e.type === 'saqueador') {   // the lantern at his back hip
      const lx = e.x + e.w / 2 - e.facing * 6 - cx, ly = e.y + e.h - 6 - cy - (e.cdClimb ? 0 : 0) + ((e.state === 'pick' || e.cdMode === 'hide') ? 3 : 0);
      lc.globalAlpha = 0.32 + Math.sin(gameTime * 7 + e.seed) * 0.04; lc.drawImage(G.lamp, lx - 18, ly - 18);
    } else if (e.type === 'besteiro' && e.state === 'aim') {   // the tip glowing
      const k = clamp(1 - e.stateT / 0.9, 0, 1), a = e.aimA || 0, tx = e.x + e.w / 2 + e.facing * (10 + Math.cos(a) * 4) - cx, ty = e.y + 9 + Math.sin(a) * 9 - cy;
      lc.globalAlpha = 0.35 + 0.6 * k; lc.drawImage(G.tip, tx - 8, ty - 8);
    }
  }
  for (const t of cdvTraps) {   // a glint now and then on the caltrops and the bells
    const ph = (gameTime * 0.8 + t.seed) % 1.6;
    if (ph < 0.12) { lc.globalAlpha = 0.6 * (1 - ph / 0.12); const G2 = t.kind === 'estrepe' ? G.glint : G.bell; lc.drawImage(G2, t.x + (t.kind === 'estrepe' ? (hash2(t.tx, Math.floor(gameTime), 3) - 0.5) * 8 : (Math.floor(gameTime) % 2 ? -17 : 17)) - cx - 5, t.y - 3 - cy - 5); }
  }
  lc.globalAlpha = 1;
});
// the saqueador's lantern lights a little round him
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) if (!e.dead && e.type === 'saqueador') addL(e.x + e.w / 2 - e.facing * 6, e.y + e.h - 6, 0.42);
}; }

/* ---------- the update ---------- */
function cdvMarkDrops() {   // monster drops carry cdMob (wrapped late so every death's drops are inside it)
  if (cdvMarked) return; cdvMarked = true;
  const _k = killEnemy; killEnemy = function (e) { const n0 = loot.length, r = _k.apply(this, arguments); for (let i = n0; i < loot.length; i++) loot[i].cdMob = 1; return r; };
}
function cdvUpdate(dt) {
  cdvLate(); cdvMarkDrops();
  if (cdAlarms.length) cdvAlarmTick(dt);
  if (cdvBolts.length) cdvBoltTick(dt);
  if (cdvTraps.length || cdvNets.length) cdvTrapTick(dt);
}
HOOK.update.push(cdvUpdate);

// a voice when struck; the trapper fights back when hurt up close
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const r = _hit(e, dir, mult, melee);
  if (e && !e.dead && ET[e.type] && ET[e.type].human && e.hp > 0) {
    if ((e.gaspT || 0) <= gameTime) { e.gaspT = gameTime + 0.5; sfx.cdvGasp(); }
    e.hurtT = 3;
    if (e.cdMode === 'hide') e.cdMode = 'flee';
    if (e.type === 'telhadeiro' && (e.state === 'swing' || e.state === 'mark' || e.state === 'throw')) { e.state = 'fall'; e.rope = null; }
    if (e.type === 'besteiro' && e.state === 'crouch') e.perchT = Math.min(e.perchT, -2);
  }
  return r;
}; }
// a parried stab ends the pair
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const r = _hp(dmg, srcX, src, isProj);
  if (src && src.type === 'saqueador' && src.state === 'stab' && (r === 'block' || r === 'parry')) { src.state = 'recover'; src.stateT = r === 'parry' ? 0.9 : 0.5; }
  return r;
}; }
// dying: everything he pocketed falls, and the potion he never drank
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (e && ET[e.type] && ET[e.type].human) {
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    for (const b of e.bag || []) loot.push({ x: cx, y: cy, vx: rnd(-50, 50), vy: rnd(-160, -90), id: b.id, n: b.n, item: b.item, t: 0, rest: false, cdMob: 1 });
    e.bag = null;
    if (ET[e.type].potion && e.cdPot > 0) dropLoot(cx, cy, 'pocao', 1);
    sfx.cdvDie();
  }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && ET[type] && ET[type].human) {
    e.cdPot = ET[type].potion ? 1 : 0; e.bag = []; e.cdMode = null; e.cdGoal = null; e.cdClimb = false;
    if (type === 'armadilheiro') { e.nextWire = Math.random() < 0.5; e.trapCD = 0.5; }
    if (type === 'telhadeiro') e.planT = 0.3;
  }
  return e;
}; }
function cdvClear() { cdvBolts.length = 0; cdvTraps.length = 0; cdvNets.length = 0; cdAlarms.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { cdvLate(); cdvClear(); return _nw(sd, sv); }; }

// the pair of looters near a camp (for 136): two saqueadores a few blocks apart on the floor around (tx, ty)
function cdSpawnSaqueadores(tx, ty, zone) {
  const out = [], D = ET.saqueador;
  for (const off of [-2, 2, -4, 4, -6, 6]) {
    if (out.length >= 2) break;
    const x = tx + off;
    for (let y = ty - 4; y <= ty + 4; y++) {
      if (!solidAt(x, y + 1) || rectSolid(x * T, (y + 1) * T - D.h, D.w, D.h)) continue;
      const e = spawnEnemy('saqueador', x * T + 2, (y + 1) * T - D.h, zone); if (e) out.push(e); break;
    }
  }
  return out;
}

/* ---------- sounds (voices: a grunt, a gasp, a short cry; never words on the screen) ---------- */
Object.assign(sfx, {
  cdvGrunt() { tone(105, 0.14, 'sawtooth', 0.045, -30); noise(0.12, 0.05, 420, 'bandpass', 0, 3); },
  cdvGasp() { noise(0.14, 0.05, 1500, 'bandpass', 0, 2); tone(240, 0.12, 'triangle', 0.03, 140); },
  cdvCry() { tone(360, 0.3, 'sawtooth', 0.035, 240); tone(420, 0.26, 'triangle', 0.025, 200, 0.04); noise(0.25, 0.03, 1200, 'bandpass', 0, 2); },
  cdvPant() { noise(0.1, 0.03, 900, 'bandpass', 0, 2); noise(0.1, 0.03, 800, 'bandpass', 0.2, 2); },
  cdvHeh() { tone(180, 0.07, 'sawtooth', 0.03, 30); tone(170, 0.07, 'sawtooth', 0.026, 30, 0.12); },
  cdvShout() { tone(220, 0.22, 'sawtooth', 0.04, 120); noise(0.18, 0.04, 900, 'bandpass', 0, 2); },
  cdvBreath() { noise(0.4, 0.025, 600, 'lowpass', 0, 1); },
  cdvDie() { tone(140, 0.45, 'sawtooth', 0.04, -70); noise(0.35, 0.04, 500, 'bandpass', 0.05, 2); },
  cdvGlass() { tone(2400, 0.06, 'sine', 0.05); tone(3100, 0.08, 'sine', 0.035, 0, 0.05); noise(0.05, 0.03, 4000, 'highpass', 0.02); },
  cdvGulp() { for (let k = 0; k < 3; k++) tone(170 - k * 10, 0.07, 'sine', 0.05, -60, k * 0.13); },
  cdvRustle() { noise(0.18, 0.04, 1800, 'bandpass', 0, 1.5); },
  cdvDraw() { noise(0.3, 0.035, 3200, 'bandpass', 0, 3); tone(1200, 0.25, 'sine', 0.012, 400); },
  cdvStab() { noise(0.08, 0.06, 2400, 'bandpass', 0, 1.4); tone(500, 0.05, 'square', 0.02, -200); },
  cdvRaise() { tone(160, 0.5, 'triangle', 0.025, 80); noise(0.2, 0.02, 700, 'lowpass', 0, 2); tone(900, 0.6, 'sine', 0.012, 500, 0.2); },
  cdvTwang() { tone(240, 0.12, 'square', 0.05, -160); noise(0.1, 0.06, 1800, 'bandpass', 0, 1.5); },
  cdvThunk() { noise(0.07, 0.07, 500, 'lowpass'); tone(150, 0.07, 'square', 0.03, -60); },
  cdvCrank() { noise(0.03, 0.05, 2600, 'bandpass', 0, 4); tone(700, 0.03, 'square', 0.015, -200); },
  cdvLatch() { noise(0.04, 0.07, 2000, 'bandpass', 0, 3); tone(400, 0.05, 'square', 0.025, -100, 0.03); },
  cdvCrouch() { noise(0.12, 0.03, 700, 'lowpass', 0, 1); },
  cdvClink() { tone(2200 + Math.random() * 600, 0.04, 'triangle', 0.02); },
  cdvSet(wire) { if (wire) { tone(1900, 0.18, 'triangle', 0.015, 120); tone(2500, 0.12, 'triangle', 0.012, 0, 0.1); } else for (let k = 0; k < 3; k++) tone(2000 + k * 300, 0.04, 'triangle', 0.02, 0, k * 0.06); },
  cdvCaltrop() { noise(0.1, 0.06, 2600, 'bandpass', 0, 2); tone(1700, 0.05, 'triangle', 0.03, -300); },
  cdvBells() { for (let k = 0; k < 7; k++) tone(1800 + ((k * 397) % 900), 0.12, 'triangle', 0.025, 0, k * 0.05); },
  cdvNet() { noise(0.25, 0.06, 500, 'lowpass', 0, 1); noise(0.18, 0.04, 1400, 'bandpass', 0.05, 2); },
  cdvNetMiss() { noise(0.2, 0.05, 400, 'lowpass', 0, 1); },
  cdvCreak() { tone(80, 0.5, 'sawtooth', 0.025, 30); noise(0.4, 0.03, 400, 'bandpass', 0, 4); },
  cdvSlash() { noise(0.1, 0.06, 3000, 'bandpass', 0, 1.5); noise(0.08, 0.05, 2600, 'bandpass', 0.07, 1.5); },
  cdvThrow() { noise(0.25, 0.05, 1500, 'bandpass', 0, 2); tone(300, 0.2, 'sine', 0.015, 400); },
  cdvHookBite() { tone(1300, 0.06, 'square', 0.03, -500); noise(0.06, 0.05, 2400, 'highpass'); },
  cdvCreakRope() { tone(130, 0.45, 'sawtooth', 0.02, 60); noise(0.4, 0.02, 600, 'bandpass', 0, 5); },
  cdvLetGo() { noise(0.2, 0.05, 1800, 'bandpass', 0, 1.2); },
  cdvLand() { tone(70, 0.12, 'sine', 0.05, -20); noise(0.1, 0.05, 400, 'lowpass'); },
  cdvRung() { tone(140 + Math.random() * 30, 0.05, 'triangle', 0.02); noise(0.05, 0.02, 700, 'lowpass'); }
});
