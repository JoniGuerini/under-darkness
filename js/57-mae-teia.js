'use strict';

/* ================= A Mãe-Teia: the boss of the caves =================
   She lives in the Câmara do Ninho (56-caverna-mundo carves it in the Ninho, across the world from the
   village: 34 x 14). Step inside and curtains of web close every way out (they can be cut, but leaving
   the chamber resets the fight). Three phases:
     1. on the floor: bites up close, spits a fan of three web globs that slow you
     2. under 60%: climbs to the roof, crawls over you (her shadow on the floor shows where) and drops;
        the egg sacs round the chamber hatch spiderlings
     3. under 25%: faster, five globs, and she leaps from wall to wall
   Drops the Presa da Mãe-Teia (legendary dagger: every hit poisons for 4 s). Her death is saved.
   Plugs in like the Skeleton King (46): buildCathedral (dressing), spawnEnemy, killEnemy, endBossFight,
   hitEnemy, recalc, makeSave and newWorld are wrapped; art and AI through DRAW_E/EYES_E/WARN_E/HOOK.
   Loads after 56 and before 49, so her ET entry gets the same BAL scaling as everyone else. */

const TEIA = { p2: 0.6, p3: 0.25 };
const teiaState = { dead: false };
const teiaFx = { gates: [], shadow: null };
let teiaBoss = null;
ET.maeteia = { name: 'A Mãe-Teia', w: 30, h: 16, hp: 640, dmg: 16, xp: 260, kb: 0, fly: false, blood: '#6a8a3a', boss: true };
DROPS.maeteia = [['presa_mae', 1], ['pocao', 1, 2, 4], ['seda', 1, 4, 8], ['glandula', 1, 2, 3]];
if (typeof CV_STEP !== 'undefined') CV_STEP.maeteia = 1;

/* ---------- the chamber: eggs, cocoons, webs; nothing else may spawn in it ---------- */
function inTeiaHall(tx, ty, m = 0) { const B = cvBoss; if (!B) return false; const dx = wdx(wrapX(tx) - B.cx); return Math.abs(dx) <= (B.w >> 1) - m && ty >= B.top - 1 && ty < B.fy; }
function teiaDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
function teiaDress() {
  const B = cvBoss; if (!B) return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), x0 = B.cx - (B.w >> 1), x1 = x0 + B.w - 1;
  // a clean floor of schist, the hall cleared of loose decorations, webbed walls
  for (let x = x0; x <= x1; x++) { tiles[I(x, B.fy)] = CV_XISTO; tiles[I(x, B.fy + 1)] = CV_XISTO; for (let y = B.top; y < B.fy; y++) { const t = tiles[I(x, y)]; if (t !== AIR && !SOLID[t]) tiles[I(x, y)] = AIR; walls[I(x, y)] = WCV_TEIA; } }
  for (let y = B.top - 1; y < B.fy; y++) for (const x of [x0 - 1, x1 + 1]) { const t = tiles[I(x, y)]; if (SOLID[t] && (t === CV_XISTO || t === CV_ROCHA)) tiles[I(x, y)] = CV_TEIA; }
  // egg sacs at both ends (where the spiderlings come from), a carcass, cocoons and sheets of web
  const put = (id, v, tx, how) => {
    const def = PROP_DEFS[id]; if (!def) return null; const V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T), sup = [];
    const X = W1(tx) * T + ((tw * T - V.w) >> 1);
    if (how === 'teto') {   // hangs from the lowest point of the roof over it, held by every roof tile at that height
      let r = -1; for (let k = tx; k < tx + tw; k++) { let y = B.fy - 2; while (y > B.top - 8 && !SOLID[tiles[I(k, y)]]) y--; r = Math.max(r, y); }
      for (let k = tx; k < tx + tw; k++) if (SOLID[tiles[I(k, r)]]) sup.push(I(k, r));
      return sup.length ? addProp(def, v, X, (r + 1) * T, sup) : null;
    }
    for (let k = tx; k < tx + tw; k++) sup.push(I(k, B.fy));
    if (how === 'chao') return addProp(def, v, X, B.fy * T - V.h, sup);
    return addProp(def, v, X, (B.fy - th) * T, sup);
  };
  B.eggs = [];
  for (const tx of [x0 + 1, x1 - 2, x0 + 9]) { const p = put('cv_ovos', 0, tx, 'chao'); if (p) B.eggs.push([p.X + p.w / 2, B.fy * T - 4]); }
  put('cv_carcaca', 0, x1 - 11, 'chao');
  put('cv_lencol_teia', 0, x0 + 3, 'fundo'); put('cv_lencol_teia', 0, x1 - 6, 'fundo');
  for (const [tx, v] of [[x0 + 6, 1], [x0 + 15, 0], [x1 - 7, 0]]) put('cv_casulo', v, tx, 'teto');
}
{ const _bc = buildCathedral; buildCathedral = function () { _bc(); if (CAVERNA) { try { teiaDress(); } catch (err) { console.error(err); } } }; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (type !== 'maeteia' && !e.teiaMinion && cvBoss && inTeiaHall(Math.floor((px + e.w / 2) / T), Math.floor((py + e.h / 2) / T), -2) && !(bossFight && bossFight.teia)) teiaDrop(e);
  return e;
}; }

/* ---------- the dagger ---------- */
STAT_DEF.lgVeneno = { t: 'Cada golpe envenena o alvo: X de dano a cada 1 s, por 4 s' };
STAT_KEYS.push('lgVeneno');
ITEMS.presa_mae = {
  name: 'Presa da Mãe-Teia', slot: 'weapon', kind: 'dagger', rar: 4, dmg: 14, crit: 0.08,
  pal: { w: '#eef4dc', W: '#a8c870', l: '#3e5a26', g: '#24261c', G: '#12130c', h: '#3a2414', p: '#9ad83a' },
  legend: [['lgVeneno', 2], ['crit', 0.08], ['atkSpd', 0.12]],
  desc: 'Uma presa inteira, ainda oca por dentro. Do que escorre dela, a Marta não quer nem chegar perto.'
};
BASE_INFO.presa_mae = [5, 0.38];
{ const _rc = recalc; recalc = function () { const r = _rc.apply(this, arguments); let v = 0; for (const k of EQ_SLOTS) if (equip[k]) v += itemStats(equip[k]).lgVeneno || 0; if (pl.lg) pl.lg.veneno = v; return r; }; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  const hp0 = e.hp, r = _hit(e, dir, mult, melee);
  if (melee && pl.lg && pl.lg.veneno && !e.dead && e.hp < hp0) e.poison = { t: 4, tick: 1, d: Math.max(1, Math.round(pl.lg.veneno)) };
  return r;
}; }
HOOK.update.push(dt => {
  for (const e of enemies) {
    const p = e.poison; if (!p || e.dead) continue;
    p.t -= dt; p.tick -= dt;
    if (Math.random() < dt * 8) parts.push({ x: e.x + Math.random() * e.w, y: e.y + Math.random() * e.h, vx: rnd(-6, 6), vy: rnd(-20, -6), g: -10, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#9ad83a' : '#5a8a2a', size: 1 });
    if (p.tick <= 0) { p.tick += 1; e.hp -= p.d; e.flash = 0.06; e.showHp = 3; floatText(e.x + e.w / 2, e.y - 6, String(p.d), '#9ad83a', 0.8); if (e.hp <= 0) { e.poison = null; killEnemy(e); continue; } }
    if (p.t <= 0) e.poison = null;
  }
});

/* ---------- art: 48 x 26, facing right, built like the cave spiders of 55 at twice the size: a swollen
   abdomen with a pale death's head, long banded legs arched high. Poses 0-1 walk, 2 crouch, 3 leap, 4 bite ---------- */
let TEIA_ART = null;
function teiaArt() {
  if (TEIA_ART) return TEIA_ART;
  const { RB, cp, set } = CVB, cg = CVART.cg, Q = RB.quit, M = RB.quitP, O = RB.osso, E = RB.olho;
  const frame = pose => {
    const W = 48, H = 26, P = cp(W, H), s = 5101 + pose * 7;
    const low = pose === 2 ? 2.4 : 0, by = 15 + low, ph2 = pose === 1, leap = pose === 3, bite = pose === 4;
    const feetN = leap ? [47, 41, 9, 1] : [45.5, 37.5, 15, 4.5], feetF = leap ? [45, 38, 11, 3] : [43, 33, 19, 8.5];
    const leg = (i, far) => {
      const hx = 26 + (1.5 - i) * 1.5, hy = by - 0.6, st = ((i + (ph2 ? 1 : 0) + (far ? 1 : 0)) % 2 ? 1.8 : -1.8) * (pose < 2 ? 1 : 0);
      if (bite && i === 0 && !far) return [hx, hy, hx + 7, 2, hx + 15, 7];   // a front leg raised to strike
      const fx = (far ? feetF : feetN)[i] + st, fy = leap ? 19 + (i % 2) * 2 : 25.4;
      const kx = (hx + fx) / 2 + (i < 2 ? 1.6 : -1.6), ky = leap ? (i < 2 ? by - 6 : by + 3) : Math.max(0.6, by - 13 - low * 0.5 + Math.abs(i - 1.5) * 1.6);
      return [hx, hy, kx, ky, fx, fy];
    };
    const thickLeg = (L, R, v, band) => { const [hx, hy, kx, ky, fx, fy] = L; P.line(hx, hy, kx, ky, R, v + 0.6); P.line(hx, hy + 1, kx, ky + 1, R, v - 0.8); P.line(kx, ky, fx, fy, R, v); P.line(kx + 1, ky, fx + (fx > kx ? 0.6 : -0.6), fy - 1, R, v - 1.2); if (band) { P.put(kx, ky, M, 4.4); P.put(kx + 1, ky, M, 3.6); P.put((kx + fx) / 2, (ky + fy) / 2, M, 3.2); } };
    for (let i = 0; i < 4; i++) thickLeg(leg(i, true), Q, 1.6, false);   // far legs, in shadow
    for (let i = 2; i < 4; i++) thickLeg(leg(i, false), Q, 3.4, true);   // the near hind legs pass behind the abdomen
    // the abdomen, raised behind, with the pale skull on its back
    const ay = by - 2.2 - (bite ? 1 : 0);
    P.blob(12, ay, 10.5, 7.2, Q, s, 3.2, (x, y, dx, dy) => dy > 0.55 ? -0.8 : 0);
    const sk = (x, y, v) => P.put(x, y, O, v);
    for (let y = -4; y <= 2; y++) for (let x = -4; x <= 4; x++) { const d = (x * x) / 20 + (y * y) / (y < 0 ? 16 : 6); if (d < 1) sk(12 + x, ay - 0.5 + y, 4.8 - y * 0.3 + cg(x, y, 5101) * 0.25); }
    for (const [x, y] of [[-2, -1], [-1, -1], [2, -1], [1, -1], [-2, 0], [2, 0]]) P.put(12 + x, ay - 0.5 + y, Q, 0.4);   // eye sockets
    P.put(12, ay + 1, Q, 0.6); for (const x of [-2, 0, 2]) P.put(12 + x, ay + 2.5, O, 5.4); for (const x of [-1, 1]) P.put(12 + x, ay + 2.5, Q, 0.8);   // nose, teeth
    for (let k = 0; k < 4; k++) P.put(2.2 - k * 0.2, ay + 2 + k, M, 3.4 - k * 0.4);   // spinnerets, a strand of silk
    // the pedicel, thorax and head
    P.blob(22.5, by - 0.6, 2, 2, Q, s + 1, 3.2);
    P.blob(27, by - 0.6, 5.2, 4, Q, s + 2, 3.6, (x, y, dx, dy) => Math.abs(dx) < 0.18 && dy < 0 ? 1.2 : 0);
    P.blob(33, by + (bite ? 0.4 : 0), 3.6, 3, Q, s + 3, 3.9);
    for (const [x, y, v] of [[34.5, -1.6, 6], [35.6, -0.8, 5.4], [33.4, -2.2, 5], [35.8, 0.4, 4.2], [32.4, -1.4, 3.6], [34.2, -0.2, 3.4]]) P.put(x, by + y + (bite ? 0.4 : 0), E, v);
    const fo = bite ? 2.4 : pose === 2 ? 1 : 0;   // fangs, opened to strike
    P.line(35.6, by + 2, 37 + fo * 0.6, by + 5 + fo, O, 5.2); P.line(34, by + 2.4, 34.6, by + 5.4 + fo * 0.6, O, 4.2); P.put(37 + fo * 0.6, by + 5.6 + fo, O, 6);
    P.line(36.5, by + 0.6, 39.5, by + 2.2, Q, 3.4); P.line(36, by + 1.4, 38.4, by + 3.6, Q, 3);   // pedipalps
    for (let i = 0; i < 2; i++) thickLeg(leg(i, false), Q, 3.8, true);
    return set(P.done());
  };
  TEIA_ART = [0, 1, 2, 3, 4].map(frame);
  return TEIA_ART;
}
const teiaPick = (S, e, fl) => e.facing > 0 ? (fl ? S.wr : S.r) : (fl ? S.wl : S.l);
DRAW_E.maeteia = function (e, fx, fy, fl) {
  const A = teiaArt(), up = e.state === 'hang' || e.state === 'rise' || e.state === 'intro' && e.stateT > 0.5;
  if (up) {   // under the roof, upside down, on her thread
    if (e.anchorY !== undefined) { const top = fy - Math.round(e.y + e.h - e.anchorY); lc.fillStyle = 'rgba(214,214,226,0.7)'; lc.fillRect(fx, top, 1, Math.max(0, fy - e.h - top)); }
    const img = teiaPick(A[Math.floor(e.t * 6) % 2], e, fl); lc.save(); lc.translate(fx, fy - e.h / 2); lc.scale(1, -1); lc.drawImage(img, -img.width / 2, -img.height / 2); lc.restore(); return;
  }
  const k = e.state === 'wind' || e.state === 'spitWind' || e.state === 'leapWind' ? 2 : e.state === 'bite' ? 4 : !e.onGround ? 3 : Math.abs(e.vx) > 6 ? Math.floor(e.t * 8) % 2 : 0;
  lc.drawImage(teiaPick(A[k], e, fl), fx - 24, fy - 26);
};
EYES_E.maeteia = (e, fx, fy) => {
  const up = e.state === 'hang' || e.state === 'rise' || e.state === 'intro' && e.stateT > 0.5;
  lc.globalAlpha = e.state === 'wind' || e.state === 'spitWind' ? 0.95 : 0.6;
  lc.drawImage(SPR.glow.eye, fx + e.facing * 10 - 6, up ? fy - e.h / 2 - 6 : fy - 18); lc.drawImage(SPR.glow.eye, fx + e.facing * 12 - 6, up ? fy - e.h / 2 - 7 : fy - 17);
};
WARN_E.maeteia = e => e.state === 'wind' || e.state === 'spitWind' || e.state === 'leapWind' || e.state === 'hang' && e.stateT < 0.5;
// her shadow on the floor while she crawls over you, darker the closer the drop
HOOK.drawWorld.push((cx, cy) => {
  const e = teiaBoss; if (!e || e.dead || e.state !== 'hang' || !cvBoss) return;
  const x = Math.round(e.x + e.w / 2) - cx, y = cvBoss.fy * T - cy, a = clamp(1 - e.stateT / 1.6, 0.25, 0.9);
  lc.globalAlpha = a * 0.75; lc.fillStyle = '#000'; lc.beginPath(); lc.ellipse(x, y - 1, 18, 3, 0, 0, Math.PI * 2); lc.fill(); lc.globalAlpha = a * 0.5; lc.fillStyle = '#d8d8e2'; lc.fillRect(x - 16, y - 1, 1, 1); lc.fillRect(x + 15, y - 1, 1, 1); lc.fillRect(x - 1, y - 4, 2, 1); lc.globalAlpha = 1;
});

/* ---------- the fight ---------- */
// the lowest point of the roof over her: where she hangs from
function teiaRoof(e) { let r = cvBoss.top; for (let x = Math.floor(e.x / T); x <= Math.floor((e.x + e.w - 1) / T); x++) { let y = cvBoss.fy - 2; while (y > cvBoss.top - 8 && !SOLID[tiles[y * WW + wrapX(x)]]) y--; r = Math.max(r, y + 1); } return r * T; }
function teiaPhase(e) { return e.hp <= e.maxHp * TEIA.p3 ? 2 : e.hp <= e.maxHp * TEIA.p2 ? 1 : 0; }
function teiaSet(e, st, t) { e.state = st; e.stateT = t; }
function teiaMinions() { let n = 0; for (const m of enemies) if (m.teiaMinion && !m.dead) n++; return n; }
function teiaStart() {
  const B = cvBoss; teiaGates(true);
  const e = spawnEnemy('maeteia', B.cx * T - 15, (B.top + 1) * T, CV_ZONE0 + 2);
  const D = ET.maeteia; Object.assign(e, { boss: true, lvl: 4, hp: D.hp, maxHp: D.hp, dmg: D.dmg, gold: 0, facing: 1, anchorY: (B.top) * T, cd: 1.2, hatched: false, hatchT: 0 });
  teiaSet(e, 'intro', 2.2);
  teiaBoss = e; bossFight = { e, teia: true };
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'A Mãe-Teia'; bn.lastChild.textContent = 'senhora do ninho'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  sfx.teiaScream(); shake(3); showBanner('A Mãe-Teia', 'senhora do ninho');
}
function teiaEnd(won) {
  const e = teiaBoss; teiaBoss = null; bossFight = null;
  teiaGates(false);
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Carrasco'; bn.lastChild.textContent = 'guardião da cripta'; }
  for (const m of enemies.slice()) if (m.teiaMinion && !m.dead) { teiaDrop(m); burst(m.x + m.w / 2, m.y + m.h / 2, 6, '#6a8a3a', 50, 200, 0.4); }
  if (!won) { if (e) { const k = enemies.indexOf(e); if (k >= 0) enemies.splice(k, 1); } return; }
  teiaState.dead = true;
  showBanner('Vitória', 'a Mãe-Teia caiu');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.teia) return teiaEnd(won); return _eb(won); }; }
// curtains of web over every way out of the chamber (they break fast, but leaving resets the fight)
function teiaGates(on) {
  const B = cvBoss; if (!B) return;
  if (on) {
    teiaFx.gates.length = 0;
    const put = (x, y) => { const i = y * WW + wrapX(x), t = tiles[i]; if (SOLID[t]) return; teiaFx.gates.push([i, t]); tiles[i] = CV_TEIA; markDirty(wrapX(x), y); };
    const x0 = B.cx - (B.w >> 1), x1 = x0 + B.w - 1;
    for (let y = B.top - 2; y <= B.fy; y++) { put(x0 - 1, y); put(x1 + 1, y); }
    for (let x = x0; x <= x1; x++) { put(x, B.top - 2); put(x, B.fy); }
  } else {
    for (const [i, t] of teiaFx.gates) if (tiles[i] === CV_TEIA) { tiles[i] = t; markDirty(i % WW, (i / WW) | 0); burst((i % WW) * T + 6, ((i / WW) | 0) * T + 6, 3, '#d8d8e2', 30, 100, 0.4); }
    teiaFx.gates.length = 0;
  }
  mapVer++;
}
AI.maeteia = function (e, dt, dx, dy, dist) {
  const B = cvBoss, ph = teiaPhase(e), fast = ph === 2 ? 1.4 : 1, ecx = e.x + e.w / 2, floorY = B.fy * T;
  e.stateT -= dt; e.cd -= dt;
  const hold = () => { e.vy = -GRAV * dt; e.vx = 0; };
  const biteBox = () => { const hb = { x: e.facing > 0 ? ecx : ecx - 26, y: e.y - 2, w: 26, h: e.h + 4 }; if (!pl.dead && overlap(hb, pl)) hurtPlayer(e.dmg, ecx, e, false); };
  const fan = n => { for (let k = 0; k < n; k++) cvSpit(e, 0, { x: ecx + e.facing * 16, y: e.y + 6, dmg: Math.max(1, Math.round(e.dmg * 0.6)), slow: 2 }); const last = cvWebs.length; for (let k = 0; k < n; k++) { const b = cvWebs[last - n + k], s = (k - (n - 1) / 2) * 0.22; b.vx *= 1 + s; b.vy -= s * 60; } sfx.spit(); };
  switch (e.state) {
    case 'intro': {   // lowers herself from the roof on her thread
      e.facing = Math.sign(dx) || 1;
      if (e.stateT > 0.5) { e.vx = 0; e.vy = -GRAV * dt + 26; } else if (e.onGround) e.vx = 0;
      if (e.stateT <= 0) { teiaSet(e, 'walk', 0); e.anchorY = undefined; e.cd = 0.8; }
      return;
    }
    case 'walk': {
      e.facing = Math.sign(dx) || e.facing;
      const adx = Math.abs(dx);
      e.vx = approach(e.vx, adx > 26 ? Math.sign(dx) * 52 * fast : 0, 500 * dt);
      if (e.cd > 0 || !e.onGround) return;
      const r = Math.random();
      if (ph >= 1 && r < (ph === 2 ? 0.25 : 0.35)) { teiaSet(e, 'rise', 0.9); e.anchorY = (B.top) * T; sfx.drop(); return; }
      if (ph === 2 && r < 0.5) { teiaSet(e, 'leapWind', 0.4); return; }
      if (adx < 34 && Math.abs(dy) < 24) { teiaSet(e, 'wind', 0.5 / fast); sfx.hiss(); return; }
      teiaSet(e, 'spitWind', 0.55 / fast);
      return;
    }
    case 'wind': e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { teiaSet(e, 'bite', 0.32); e.vx = e.facing * 150; e.swingHit = false; sfx.hiss(); } return;
    case 'bite': if (!e.swingHit && e.stateT < 0.24) { e.swingHit = true; biteBox(); } if (e.stateT <= 0) { teiaSet(e, 'recover', 0.55 / fast); e.vx = 0; } return;
    case 'spitWind': e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { fan(ph === 2 ? 5 : 3); teiaSet(e, 'recover', 0.5); } return;
    case 'leapWind': e.vx = 0; if (e.stateT <= 0) {   // to the far wall, spitting from the top of the jump
      const x0 = (B.cx - (B.w >> 1) + 2) * T, x1 = (B.cx + (B.w >> 1) - 2) * T, toRight = ecx < (x0 + x1) / 2, tx = toRight ? x1 - e.w : x0;
      e.facing = toRight ? 1 : -1; e.vy = -330; e.vx = clamp((tx - e.x) / 0.68, -260, 260); teiaSet(e, 'leap', 1.2); e.spat = false; sfx.drop();
    } return;
    case 'leap': if (!e.spat && e.vy > -40) { e.spat = true; e.facing = Math.sign(dx) || e.facing; fan(3); } if (e.onGround && e.stateT < 1.0) { teiaSet(e, 'recover', 0.45); e.vx = 0; shake(2); } return;
    case 'rise': {   // up her thread to the roof
      e.vx = 0; e.vy = -GRAV * dt - 140;
      if (e.y <= floorY - 5 * T - e.h || e.hitCeil || e.stateT <= 0) { teiaSet(e, 'hang', 1.7 / fast); e.vy = 0; }
      return;
    }
    case 'hang': {   // crawls along the roof over you; the shadow below warns where she will land
      hold();
      const tgt = pl.x + pl.w / 2 - e.w / 2; e.x = approach(e.x, tgt, 90 * fast * dt); e.facing = Math.sign(dx) || e.facing;
      const roof = teiaRoof(e); e.anchorY = roof; e.y = Math.max(roof, floorY - 5 * T - e.h);   // dangles on her thread over you
      if (Math.random() < dt * 16) parts.push({ x: e.x + rnd(4, e.w - 4), y: e.y + e.h, vx: rnd(-4, 4), vy: rnd(20, 50), g: 160, life: 0.9, max: 0.9, col: Math.random() < 0.6 ? '#8a8478' : '#d8d8e2', size: 1 });   // grit and silk shaken loose
      if (e.stateT <= 0) { teiaSet(e, 'slam', 1.5); e.vy = 360; e.swingHit = false; e.anchorY = undefined; }
      return;
    }
    case 'slam': {
      e.vx = 0; e.vy = Math.max(e.vy, 360);
      if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(Math.round(e.dmg * 1.3), ecx, e, false); }
      if (e.stateT < 1.42 && e.onGround || e.y + e.h >= floorY - 1) {
        shake(6); burst(ecx, floorY - 2, 24, '#6a6470', 120, 300, 0.6); sfx.slam();
        if (!e.swingHit && !pl.dead && pl.onGround && Math.abs(pl.x + pl.w / 2 - ecx) < 30 && Math.abs(pl.y + pl.h - floorY) < 6) { e.swingHit = true; hurtPlayer(Math.round(e.dmg * 0.8), ecx, e, false); }
        teiaSet(e, 'recover', 1.0);   // a long opening after the drop
      }
      return;
    }
    case 'recover': e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { teiaSet(e, 'walk', 0); e.cd = (ph === 2 ? 0.6 : 1.0) + Math.random() * 0.6; } return;
  }
};
// the eggs hatch once she is hurt enough, and again while the fight goes on
function teiaHatch(e) {
  const B = cvBoss; if (!B || !B.eggs) return;
  for (const [x, y] of B.eggs) {
    if (teiaMinions() >= 4) break;
    const m = spawnEnemy('filhote', x - 3, y - 5, CV_ZONE0 + 2); m.teiaMinion = true; m.memT = 5;
    burst(x, y - 3, 10, '#c8c0a0', 60, 200, 0.5);
  }
  sfx.squeak();
}
HOOK.update.push(dt => {
  if (!CAVERNA || !cvBoss || !pl) return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (!teiaState.dead && !bossFight && !pl.dead && state === 'play' && inTeiaHall(ptx, pty, 3)) teiaStart();
  const e = teiaBoss;
  if (e && bossFight && bossFight.teia) {
    if (e.stun > 0 && (e.state === 'wind' || e.state === 'spitWind' || e.state === 'leapWind')) teiaSet(e, 'recover', 0.3);
    if (teiaPhase(e) >= 1) { e.hatchT -= dt; if (!e.hatched || e.hatchT <= 0) { e.hatched = true; e.hatchT = 12; teiaHatch(e); } }
    if (!inTeiaHall(ptx, pty, -3) && !pl.dead) endBossFight(false);
  }
});
// she doesn't take damage while lowering herself in
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) { if (e.type === 'maeteia' && e.state === 'intro') { burst(e.x + e.w / 2, e.y + e.h / 2, 3, '#d8d8e2', 40, 100, 0.3); return; } return _hit(e, dir, mult, melee); }; }

/* ---------- sounds ---------- */
Object.assign(sfx, { teiaScream() { noise(0.7, 0.12, 2400, 'bandpass', 0, 2); tone(160, 0.6, 'sawtooth', 0.05, -90); tone(620, 0.5, 'square', 0.025, -300, 0.1); } });

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.teia = { dead: teiaState.dead }; return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) { teiaBoss = null; teiaFx.gates.length = 0; const r = _nw(sd, sv); teiaState.dead = !!(sv && sv.teia && sv.teia.dead); return r; }; }
