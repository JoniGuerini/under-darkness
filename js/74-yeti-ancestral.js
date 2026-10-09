'use strict';

/* ================= O Yeti Ancestral: the boss of the ice caves =================
   He sits on the Trono de Gelo, in the hall 73-gelo-mundo carves in the Coração do Inverno across the world
   from the two fissures (40 x 16). Step inside and walls of ice close every way out (they can't be broken;
   leaving the hall, by portal or by dying, resets the fight). Three phases:
     1. pounds the floor with both fists (a shockwave runs out both ways along the floor; jump it) and tears up
        blocks of ice to throw (they burst into three shards where they land)
     2. under 60%: roars; icicles fall from the roof where their shadows mark the floor, and two frost wolves
        come in answer to the roar (again while the fight goes on)
     3. under 25%: throws himself down on his belly and slides across the hall (he is stunned if he hits a
        wall: the time to hit him), and breathes a cone of frost that chills you
   Drops the Manto do Yeti Ancestral (legendary body armour: enemies that hit you up close are chilled; webs
   and ice no longer slow you). His death is saved.
   Plugs in like the Mãe-Teia (57): buildCathedral (dressing), spawnEnemy, endBossFight, hitEnemy, hurtPlayer,
   recalc, makeSave and newWorld are wrapped; art and AI through DRAW_E/EYES_E/WARN_E/HOOK. Loads before 49
   (BAL scaling) and 68 (the Nevasca wraps every AI). */

const YETI = { hp: 900, dmg: 22, xp: 320, p2: 0.6, p3: 0.25, k: 1.8 };
const yetiState = { dead: false };
const yetiFx = { gates: [], icicles: [], breath: 0 };
let yetiBoss = null;
ET.yetiancestral = { name: 'O Yeti Ancestral', w: 30, h: 56, hp: YETI.hp, dmg: YETI.dmg, xp: YETI.xp, kb: 0, fly: false, blood: '#cfe6f4', boss: true };
DROPS.yetiancestral = [['manto_yeti', 1], ['pocao', 1, 2, 4], ['pelo_yeti', 1, 4, 8], ['lasca_eterna', 1, 2, 3]];
CV_STEP.yetiancestral = 1;

/* ---------- the hall: the throne, a clean floor of packed snow, crystals; nothing else may spawn in it ---------- */
function inYetiHall(tx, ty, m = 0) { const B = icBoss; if (!B) return false; const dx = wdx(wrapX(tx) - B.cx); return Math.abs(dx) <= (B.w >> 1) - m && ty >= B.top - 1 && ty < B.fy; }
function yetiDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
function yetiDress() {
  const B = icBoss; if (!B) return;
  const W1 = x => ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), x0 = B.cx - (B.w >> 1), x1 = x0 + B.w - 1;
  for (let x = x0; x <= x1; x++) {
    tiles[I(x, B.fy)] = IC_NEVE_DURA; tiles[I(x, B.fy + 1)] = IC_PERMA;
    for (let y = B.top - 4; y < B.fy; y++) { const i = I(x, y), t = tiles[i]; if (t !== AIR && !SOLID[t]) tiles[i] = AIR; if (y >= B.top) walls[i] = WIC_GELO; }
  }
  // the walls of the hall glazed with blue ice
  for (let y = B.top - 4; y <= B.fy; y++) for (let x = x0 - 2; x <= x1 + 2; x++) {
    const i = I(x, y), t = tiles[i]; if (!SOLID[t] || !IC_SOILS[t]) continue;
    if (tiles[I(x, y + 1)] === AIR || tiles[I(x, y - 1)] === AIR || tiles[I(x - 1, y)] === AIR || tiles[I(x + 1, y)] === AIR) tiles[i] = y >= B.fy ? IC_NEVE_DURA : IC_GELO_AZUL;
  }
  // and nothing of the generic dressing stays in it
  for (let k = PROPS.length - 1; k >= 0; k--) { const p = PROPS[k]; if (p.def.gelo && inYetiHall(Math.floor((p.X + p.w / 2) / T), Math.floor((p.Y + p.h / 2) / T), -2)) { PROPS.splice(k, 1); } }
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
  put('ic_trono', 0, B.cx - 2, 'chao');
  put('ic_drusa', 0, x0 + 1, 'chao'); put('ic_drusa', 0, x1 - 2, 'chao');
  put('ic_estalagmite', 0, x0 + 7, 'chao'); put('ic_estalagmite', 1, x1 - 8, 'chao');
  for (const [tx, v] of [[x0 + 4, 0], [x0 + 13, 1], [x1 - 15, 0], [x1 - 5, 1]]) put('ic_sincelos', v, tx, 'teto');
  put('ic_cristal_teto', 0, B.cx - 1, 'teto');
}
{ const _bc = buildCathedral; buildCathedral = function () { _bc(); if (GELO) { try { yetiDress(); } catch (err) { console.error(err); } } }; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (type !== 'yetiancestral' && !e.yetiMinion && icBoss && inYetiHall(Math.floor((px + e.w / 2) / T), Math.floor((py + e.h / 2) / T), -2) && !(bossFight && bossFight.yeti)) yetiDrop(e);
  return e;
}; }

/* ---------- the mantle ---------- */
STAT_DEF.lgGeada = { t: 'Inimigos que te acertam de perto ficam resfriados por X s' };
STAT_DEF.lgFirme = { t: 'Teia e gelo não te deixam lento', flag: 1 };
STAT_KEYS.push('lgGeada', 'lgFirme');
ITEMS.manto_yeti = {
  name: 'Manto do Yeti Ancestral', slot: 'body', rar: 4, def: 7, hp: 20,
  pal: { r: '#e4eef6', R: '#aebfce', D: '#71849a', b: '#4a5a6c', B: '#bfe8fa' },
  legend: [['lgGeada', 3], ['lgFirme', 1], ['hp', 10]],
  desc: 'A pele inteira do mais velho deles, ainda fria por dentro. Quem a veste não sente mais o inverno.'
};
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let g = 0, f = 0;
  for (const k of EQ_SLOTS) if (equip[k]) { const st = itemStats(equip[k]); g += st.lgGeada || 0; f += st.lgFirme || 0; }
  if (pl.lg) { pl.lg.geada = g; pl.lg.firme = f > 0; }
  return r;
}; }
// whoever hits you up close is chilled (the Nevasca's chill: slower for a while)
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const r = _hp.apply(this, arguments);
  if (src && !isProj && !src.dead && (r === 'hit' || r === 'block') && pl.lg && pl.lg.geada) {
    src.nevChillT = Math.max(src.nevChillT || 0, pl.lg.geada);
    burst(src.x + src.w / 2, src.y + src.h / 2, 8, '#d6f0fc', 60, 100, 0.5, 1, true);
  }
  return r;
}; }
// webs and frost don't slow you (and don't say so)
HOOK.update.push(() => { if (pl.lg && pl.lg.firme) { if (cvSlowT > 0) cvSlowT = 0; if (icSlowT > 0) icSlowT = 0; } });
{ const _ft = floatText; floatText = function (x, y, s) { if (pl.lg && pl.lg.firme && (s === 'PRESO NA TEIA' || s === 'GELADO')) return; return _ft.apply(this, arguments); }; }

/* ---------- art: the yeti of 72 redrawn at 1.8 x (54 x 67), with horns and crystals on his back ---------- */
let YETI_ART = null;
const yetiArt = () => YETI_ART || (YETI_ART = [0, 1, 2, 3, 4, 5].map(p => ICB.set(ICB.yetiFrame(p, true, YETI.k))));
function yetiPose(e) {
  switch (e.state) {
    case 'intro': return e.stateT > 1.1 ? 0 : 2;
    case 'raise': case 'roar': return 2;
    case 'slam': case 'slideWind': case 'slide': case 'breathWind': case 'breath': case 'stunned': return 3;
    case 'lift': return 4;
    case 'throw': return 5;
    default: return Math.abs(e.vx) > 6 ? Math.floor(e.t * 4) % 2 : 0;
  }
}
DRAW_E.yetiancestral = function (e, fx, fy, fl) {
  const S = yetiArt()[yetiPose(e)], img = cvPick(S, e, fl), W = img.width, H = img.height;
  if (e.state === 'slide') {   // flat on his belly, head first
    lc.save(); lc.translate(fx, fy - 15); lc.rotate(e.facing * Math.PI * 0.42); lc.drawImage(img, -W / 2, -H / 2 - 6); lc.restore();
    return;
  }
  const shake = e.state === 'stunned' ? Math.round(Math.sin(e.t * 40)) : 0;
  lc.drawImage(img, fx - (W >> 1) - e.facing * 4 + shake, fy - H);
  if (e.state === 'lift') icDrawBoulder(fx - e.facing * 2, fy - H - 2, 1), icDrawBoulder(fx - e.facing * 2 + 7, fy - H + 2, 1);
  if (e.state === 'stunned') for (let k = 0; k < 3; k++) { const a = e.t * 5 + k * 2.1; lc.fillStyle = k ? '#b8e0f4' : '#effaff'; lc.fillRect(Math.round(fx + e.facing * 14 + Math.cos(a) * 9), Math.round(fy - 52 + Math.sin(a) * 3), 2, 2); }
};
EYES_E.yetiancestral = (e, fx, fy) => {
  if (e.state === 'slide') return;
  const p = yetiPose(e), dy = p === 3 ? 34 : p === 2 || p === 4 ? 44 : 41;
  lc.globalAlpha = WARN_E.yetiancestral(e) ? 0.95 : 0.55; lc.drawImage(icEye(), fx + e.facing * (p === 3 ? 14 : 11) - 6, fy - dy - 6);
};
WARN_E.yetiancestral = e => e.state === 'raise' || e.state === 'lift' || e.state === 'slideWind' || e.state === 'breathWind' || e.state === 'roar';
// icicles: a shadow on the floor, then the fall
HOOK.drawWorld.push((cx, cy) => {
  for (const c of yetiFx.icicles) {
    const x = Math.round(c.x) - cx;
    if (c.warn > 0) { const a = clamp(1 - c.warn / 1.0, 0.2, 0.85); lc.globalAlpha = a * 0.7; lc.fillStyle = '#000'; lc.beginPath(); lc.ellipse(x, c.floor - cy - 1, 6, 2, 0, 0, Math.PI * 2); lc.fill(); lc.globalAlpha = 1; }
    const y = Math.round(c.y) - cy;
    for (let j = 0; j < 14; j++) { const hw = Math.max(0, Math.round((1 - j / 14) * 3)); lc.fillStyle = j > 11 ? '#effaff' : '#30668e'; lc.fillRect(x - hw, y + j, hw * 2 + 1, 1); if (hw > 0) { lc.fillStyle = '#b8e0f4'; lc.fillRect(x - hw + 1, y + j, 1, 1); } }
  }
});

// the breath: a pale cone of frost from the mouth
HOOK.drawTop.push((cx, cy) => {
  const e = yetiBoss; if (!e || e.dead || e.state !== 'breath' || e.aim === undefined) return;
  const mx = e.x + e.w / 2 + e.facing * 22 - cx, my = e.y + 22 - cy, L = 120, a = e.aim, f = clamp(e.stateT / 0.3, 0, 1) * clamp((1.4 - e.stateT) / 0.2, 0, 1);
  lc.save(); lc.translate(Math.round(mx), Math.round(my)); lc.scale(e.facing, 1); lc.rotate(a);
  for (let k = 0; k < 3; k++) {
    lc.globalAlpha = (0.16 - k * 0.04) * f; lc.fillStyle = k ? '#9ad4f0' : '#e4f2fc';
    const sp = 0.16 + k * 0.07; lc.beginPath(); lc.moveTo(0, -2); lc.lineTo(L * (1 - k * 0.15), -L * sp); lc.lineTo(L * (1 - k * 0.15), L * sp); lc.lineTo(0, 2); lc.closePath(); lc.fill();
  }
  lc.restore(); lc.globalAlpha = 1;
});

/* ---------- the fight ---------- */
function yetiPhase(e) { return e.hp <= e.maxHp * YETI.p3 ? 2 : e.hp <= e.maxHp * YETI.p2 ? 1 : 0; }
function yetiSet(e, st, t) { e.state = st; e.stateT = t; }
function yetiMinions() { let n = 0; for (const m of enemies) if (m.yetiMinion && !m.dead) n++; return n; }
function yetiStart() {
  const B = icBoss; yetiGates(true);
  const D = ET.yetiancestral, e = spawnEnemy('yetiancestral', B.cx * T - D.w / 2, B.fy * T - D.h - 1, IC_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: 9, hp: D.hp, maxHp: D.hp, dmg: D.dmg, gold: 0, facing: pl.x < B.cx * T ? -1 : 1, cd: 1.2, roared: false, callT: 0, rainT: 0 });
  yetiSet(e, 'intro', 2.4);
  yetiBoss = e; bossFight = { e, yeti: true };
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Yeti Ancestral'; bn.lastChild.textContent = 'senhor do inverno'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Yeti Ancestral', 'senhor do inverno');
}
function yetiEnd(won) {
  const e = yetiBoss; yetiBoss = null; bossFight = null;
  yetiGates(false); yetiFx.icicles.length = 0; yetiFx.breath = 0;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Carrasco'; bn.lastChild.textContent = 'guardião da cripta'; }
  for (const m of enemies.slice()) if (m.yetiMinion && !m.dead) { yetiDrop(m); burst(m.x + m.w / 2, m.y + m.h / 2, 6, '#d6f0fc', 50, 200, 0.4); }
  if (!won) { if (e) { if (e.h !== ET.yetiancestral.h) e.h = ET.yetiancestral.h; const k = enemies.indexOf(e); if (k >= 0) enemies.splice(k, 1); } return; }
  yetiState.dead = true;
  showBanner('Vitória', 'o Yeti Ancestral caiu');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.yeti) return yetiEnd(won); return _eb(won); }; }
// walls of ice over every way out of the hall (they can't be dug; they melt when the fight ends)
function yetiGates(on) {
  const B = icBoss; if (!B) return;
  if (on) {
    yetiFx.gates.length = 0;
    const put = (x, y) => { const i = y * WW + wrapX(x), t = tiles[i]; if (SOLID[t]) return; yetiFx.gates.push([i, t]); tiles[i] = IC_BARREIRA; markDirty(wrapX(x), y); burst(wrapX(x) * T + 6, y * T + 6, 2, '#d6f0fc', 30, 60, 0.4); };
    const x0 = B.cx - (B.w >> 1), x1 = x0 + B.w - 1;
    for (let y = B.top - 6; y <= B.fy; y++) { put(x0 - 1, y); put(x1 + 1, y); }
    for (let x = x0; x <= x1; x++) { put(x, B.top - 6); put(x, B.fy); }
    sfx.icCrack();
  } else {
    for (const [i, t] of yetiFx.gates) if (tiles[i] === IC_BARREIRA) { tiles[i] = t; markDirty(i % WW, (i / WW) | 0); burst((i % WW) * T + 6, ((i / WW) | 0) * T + 6, 4, '#d6f0fc', 40, 160, 0.5); }
    yetiFx.gates.length = 0;
  }
  mapVer++;
}
// icicles over the floor around the hero (one right over them), each with a shadow before it falls
function yetiRain(n) {
  const B = icBoss; if (!B) return;
  const x0 = (B.cx - (B.w >> 1) + 1) * T, x1 = (B.cx + (B.w >> 1) - 1) * T, px = pl.x + pl.w / 2;
  for (let k = 0; k < n; k++) {
    const x = clamp(k === 0 ? px : px + rnd(-110, 110), x0, x1), tx = Math.floor(x / T);
    let r = B.fy - 2; while (r > B.top - 8 && !SOLID[tileAt(tx, r)]) r--;
    yetiFx.icicles.push({ x, y: (r + 1) * T, floor: B.fy * T, vy: 0, warn: 0.9 + k * 0.18, dmg: 0 });
  }
  sfx.icCrack();
}
function yetiCall(e) {
  const B = icBoss; if (!B) return;
  icPacking = true;
  try {
    for (const side of [-1, 1]) {
      if (yetiMinions() >= 3) break;
      const x = (B.cx + side * ((B.w >> 1) - 3)) * T, m = spawnEnemy('lobo', x, B.fy * T - ET.lobo.h - 1, IC_ZONE0 + 3);
      m.yetiMinion = true; m.memT = 6; m.lvl = 8; const mul = 1 + 0.3 * 7; m.hp = m.maxHp = Math.round(ET.lobo.hp * mul); m.dmg = Math.round(ET.lobo.dmg * (1 + 0.2 * 7)); m.xp = 1; m.gold = 0;
      burst(x + 9, B.fy * T - 6, 12, '#e4f2fc', 80, 200, 0.5);
    }
  } finally { icPacking = false; }
  sfx.icHowl();
}
AI.yetiancestral = function (e, dt, dx, dy, dist) {
  const B = icBoss, ph = yetiPhase(e), fast = ph === 2 ? 1.3 : 1, ecx = e.x + e.w / 2, floorY = B.fy * T;
  e.stateT -= dt; e.cd -= dt;
  const toPl = Math.sign(dx) || e.facing;
  switch (e.state) {
    case 'intro': e.vx = 0; if (e.stateT < 1.1 && !e.roared) { e.roared = true; sfx.icRoar(); shake(5); } if (e.stateT <= 0) { yetiSet(e, 'walk', 0); e.cd = 0.6; } return;
    case 'walk': {
      e.facing = toPl;
      const adx = Math.abs(dx);
      e.vx = approach(e.vx, adx > 30 ? toPl * 44 * fast : 0, 400 * dt);
      if (e.cd > 0 || !e.onGround) return;
      const r = Math.random();
      if (ph >= 1 && !e.p2Done) { e.p2Done = true; yetiSet(e, 'roar', 1.3); sfx.icRoar(); shake(6); return; }
      if (ph === 2 && r < 0.3) { yetiSet(e, 'slideWind', 0.7); sfx.icRoar(); return; }
      if (ph === 2 && r < 0.5 && adx < 140) { yetiSet(e, 'breathWind', 0.6); return; }
      if (ph >= 1 && r < 0.62 && e.rainT <= 0) { yetiSet(e, 'roar', 1.0); sfx.icRoar(); shake(4); return; }
      if (adx < 60 && Math.abs(dy) < 40) { yetiSet(e, 'raise', 0.75 / fast); sfx.icRoar(); return; }
      yetiSet(e, 'lift', 0.85 / fast);
      return;
    }
    case 'raise': e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) {   // both fists down: a blow in front, shockwaves both ways
      const hb = { x: e.facing > 0 ? ecx : ecx - 46, y: e.y + 6, w: 46, h: e.h - 4 };
      if (!pl.dead && overlap(hb, pl)) hurtPlayer(e.dmg, ecx, e, false);
      for (const d of [-1, 1]) icWave(ecx + d * 22, floorY, d, Math.max(1, Math.round(e.dmg * 0.6)), 220, { sp: 210 });
      shake(7); sfx.icSlam(); burst(ecx + e.facing * 20, floorY - 2, 30, '#e4f2fc', 140, 360, 0.6);
      yetiSet(e, 'slam', 0.45);
    } return;
    case 'slam': e.vx = 0; if (e.stateT <= 0) yetiSet(e, 'recover', 0.8 / fast); return;
    case 'lift': e.vx = approach(e.vx, 0, 900 * dt); e.facing = toPl; if (e.stateT <= 0) {
      icThrow('boulder', ecx + e.facing * 8, e.y - 6, pl.x + pl.w / 2, pl.y + pl.h - 4, Math.round(e.dmg * 0.9), { split: true, r: 6 });
      sfx.icThrow(); yetiSet(e, 'throw', 0.4);
    } return;
    case 'throw': e.vx = 0; if (e.stateT <= 0) yetiSet(e, 'recover', 0.6 / fast); return;
    case 'roar': e.vx = 0; if (e.stateT <= 0) {   // the roof answers with icicles, the wolves with howls
      yetiRain(ph === 2 ? 7 : 5); e.rainT = 5;
      if (e.callT <= 0 && yetiMinions() < 2) { yetiCall(e); e.callT = 14; }
      yetiSet(e, 'recover', 0.5);
    } return;
    case 'slideWind': e.vx = 0; e.facing = toPl; if (e.stateT <= 0) {   // down on his belly
      yetiSet(e, 'slide', 2.2); e.slideHit = false; e.y += e.h - 28; e.h = 28;
    } return;
    case 'slide': {
      e.vx = e.facing * 300;
      if (Math.random() < dt * 40) parts.push({ x: ecx - e.facing * 14 + rnd(-4, 4), y: floorY - 2, vx: -e.facing * rnd(40, 120), vy: rnd(-120, -40), g: 360, life: 0.5, max: 0.5, col: Math.random() < 0.6 ? '#e4f2fc' : '#8aa4bc', size: 1 });
      if (!e.slideHit && !pl.dead && overlap(e, pl)) { e.slideHit = true; hurtPlayer(Math.round(e.dmg * 1.2), ecx - e.facing * 10, e, false); }
      const edge = (B.cx + e.facing * ((B.w >> 1) - 2)) * T;
      if (e.hitWall || (e.facing > 0 ? e.x + e.w >= edge : e.x <= edge) || e.stateT <= 0) {
        const hard = e.hitWall || e.stateT > 0;
        e.vx = 0; e.y -= ET.yetiancestral.h - e.h; e.h = ET.yetiancestral.h;
        if (rectSolid(e.x, e.y, e.w, e.h)) e.x = clamp(e.x, (B.cx - (B.w >> 1) + 1) * T, (B.cx + (B.w >> 1) - 1) * T - e.w);
        if (hard) { shake(8); sfx.icSlam(); icShatter(ecx + e.facing * 16, e.y + 20, true); yetiRain(3); yetiSet(e, 'stunned', 2.2); }
        else yetiSet(e, 'recover', 0.6);
      }
      return;
    }
    case 'stunned': e.vx = 0; if (e.stateT <= 0) yetiSet(e, 'recover', 0.3); return;
    case 'breathWind': e.vx = approach(e.vx, 0, 900 * dt); e.facing = toPl; if (e.stateT <= 0) { yetiSet(e, 'breath', 1.4); e.tick = 0; sfx.icWhisper(); sfx.icBurst(); } return;
    case 'breath': {   // a cone of frost from the mouth, swept a little towards the hero
      e.vx = 0;
      const mx = ecx + e.facing * 22, my = e.y + 22, aim = clamp(Math.atan2(pl.y + pl.h / 2 - my, Math.abs(pl.x + pl.w / 2 - mx)), -0.3, 0.6);
      e.aim = e.aim === undefined ? aim : approach(e.aim, aim, dt * 0.6);
      for (let k = 0; k < 8; k++) { const a = e.aim + rnd(-0.24, 0.24), sp = rnd(140, 230); parts.push({ x: mx, y: my, vx: e.facing * Math.cos(a) * sp, vy: Math.sin(a) * sp, g: -10, life: 0.55, max: 0.55, col: Math.random() < 0.5 ? '#e4f2fc' : Math.random() < 0.5 ? '#9ad4f0' : '#ffffff', size: Math.random() < 0.45 ? 2 : 1, glow: true }); }
      e.tick -= dt;
      const rx = (pl.x + pl.w / 2 - mx) * e.facing, ry = pl.y + pl.h / 2 - my - Math.tan(e.aim) * Math.max(0, rx);
      if (e.tick <= 0 && rx > -4 && rx < 120 && Math.abs(ry) < 12 + rx * 0.25 && !pl.dead) {
        e.tick = 0.3;
        const r = hurtPlayer(Math.max(1, Math.round(e.dmg * 0.35)), mx, null, true);
        if (r === 'hit' && !(pl.lg && pl.lg.firme)) { icSlowT = Math.max(icSlowT, 2); }
      }
      if (e.stateT <= 0) { e.aim = undefined; yetiSet(e, 'recover', 0.7); }
      return;
    }
    case 'recover': e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { yetiSet(e, 'walk', 0); e.cd = (ph === 2 ? 0.5 : 0.9) + Math.random() * 0.6; } return;
  }
};
HOOK.update.push(dt => {
  if (!GELO || !icBoss || !pl) return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (!yetiState.dead && !bossFight && !pl.dead && state === 'play' && inYetiHall(ptx, pty, 3)) yetiStart();
  const e = yetiBoss;
  if (e && bossFight && bossFight.yeti) {
    e.callT -= dt; e.rainT -= dt;
    if (!inYetiHall(ptx, pty, -3) && !pl.dead) endBossFight(false);
  }
  // the icicles
  for (let i = yetiFx.icicles.length - 1; i >= 0; i--) {
    const c = yetiFx.icicles[i];
    if (c.warn > 0) { c.warn -= dt; if (c.warn <= 0) c.vy = 60; continue; }
    c.vy = Math.min(c.vy + 900 * dt, 520); c.y += c.vy * dt;
    if (!pl.dead && c.x > pl.x - 3 && c.x < pl.x + pl.w + 3 && c.y + 14 > pl.y && c.y < pl.y + pl.h) { hurtPlayer(Math.max(1, Math.round(ET.yetiancestral.dmg * 0.6)), c.x, null, true); icShatter(c.x, c.y + 12, false); yetiFx.icicles.splice(i, 1); continue; }
    if (c.y + 14 >= c.floor) { icShatter(c.x, c.floor - 2, false); burst(c.x, c.floor - 2, 6, '#e4f2fc', 60, 260, 0.4); sfx.icChime(); yetiFx.icicles.splice(i, 1); }
  }
});
// no damage while he rises from the throne; a slam or a slide isn't stopped by a hit
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e.type === 'yetiancestral' && e.state === 'intro') { burst(e.x + e.w / 2, e.y + e.h / 2, 3, '#d6f0fc', 40, 100, 0.3); return; }
  const r = _hit(e, dir, mult, melee);
  if (e.type === 'yetiancestral') { e.stun = 0; if (e.state === 'stunned') e.vx = 0; }
  return r;
}; }

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.yeti = { dead: yetiState.dead }; return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) { yetiBoss = null; yetiFx.gates.length = 0; yetiFx.icicles.length = 0; const r = _nw(sd, sv); yetiState.dead = !!(sv && sv.yeti && sv.yeti.dead); return r; }; }
