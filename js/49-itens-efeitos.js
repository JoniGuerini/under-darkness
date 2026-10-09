'use strict';

/* ================= what the rolled effects do in a fight (modifiers from js/48-itemizacao.js) =================
   Plain stats (damage, speed, crit, life steal, defence...) are read by recalc() in 08. The ones with a trigger live here,
   wrapping hitEnemy / killEnemy / rawDamage / updateEnemies so the combat files stay as they are. Loads before 24-boot. */

// combat scale (rebalanced 2026-10-08): monsters keep their written numbers in 10, 44 and 46, and this scales them all at once
// to the small numbers of the new weapons. Life x0.25 (a zombie takes 4 or 5 blows of the white sword), damage x0.4
// (matching the hero's 20 life). Levels still add 30% life and 20% damage each (spawnEnemy).
const BAL = { hp: 0.25, dmg: 0.4 };
for (const k in ET) { const D = ET[k]; D.hp = Math.max(2, Math.round(D.hp * BAL.hp)); D.dmg = Math.max(1, Math.round(D.dmg * BAL.dmg)); }
if (typeof REI !== 'undefined') { REI.hp = Math.round(REI.hp * BAL.hp); REI.dmg = Math.max(1, Math.round(REI.dmg * BAL.dmg)); }

// every blow rolls inside the weapon's range; the Fome do Abismo stacks add on top for 10 s after the last kill
function rollPlayerDmg() {
  let d = pl.dmgMin + Math.random() * (pl.dmgMax - pl.dmgMin + 1);
  if (pl.lg && pl.lg.fome && pl.fome > 0) { if (gameTime - pl.fomeT > 10) pl.fome = 0; else d *= 1 + pl.fome * pl.lg.fome; }
  return Math.min(d, pl.dmgMax + 0.49);
}
function onPlayerCrit() {
  if (!pl.lg || !pl.lg.blood || pl.dead || pl.hp >= pl.maxHp) return;
  const h = Math.max(1, Math.round(pl.maxHp * pl.lg.blood)); pl.hp = Math.min(pl.maxHp, pl.hp + h);
  floatText(pl.x + pl.w / 2, pl.y - 6, '+' + h, '#7dff8a', 0.75);
}

const _fxHit = hitEnemy;
hitEnemy = function (e, dir, mult = 1, melee = false) {
  const L = pl.lg || {};
  if (!e || e.dead || !melee) return _fxHit(e, dir, mult, melee);
  const hp0 = e.hp;
  if (L.first && !e.lgHit) mult *= 2;
  _fxHit(e, dir, mult, melee);
  if (e.hp >= hp0) return;   // blocked, or a spectre still out of shape
  e.lgHit = true;
  if (L.sino) { pl.sinoN = (pl.sinoN || 0) + 1; if (pl.sinoN >= 6) { pl.sinoN = 0; if (!e.dead && !e.boss) { e.stun = Math.max(e.stun, 2); floatText(e.x + e.w / 2, e.y - 12, 'ATORDOADO', '#ffe28a', 0.85); } } }
  if (e.dead) return;
  if (L.spark && Math.random() < 0.15) {
    const d = Math.round(L.spark); e.hp -= d; e.flash = 0.1;
    burst(e.x + e.w / 2, e.y + e.h / 2, 8, '#bfe6ff', 90, 0, 0.35, 1, true); floatText(e.x + e.w / 2, e.y - 10, String(d), '#9fdcff', 0.9);
    if (e.hp <= 0) { killEnemy(e); return; }
  }
  if (L.brasa && Math.random() < 0.25) e.burn = { t: 4, tick: 1, d: Math.round(L.brasa) };
};

const _fxKill = killEnemy;
killEnemy = function (e) {
  _fxKill(e);
  if (pl.lg && pl.lg.fome) { pl.fome = Math.min(10, (gameTime - (pl.fomeT || -99) > 10 ? 0 : pl.fome || 0) + 1); pl.fomeT = gameTime; }
};

// Último Fôlego: the blow that would take you under 15% gives a chunk of life back first, once every 2 minutes
const _fxRaw = rawDamage;
rawDamage = function (d, kdir) {
  const L = pl.lg || {};
  if (L.folego && !pl.dead && gameTime >= (pl.folegoAt || 0) && pl.hp - d < pl.maxHp * 0.15) {
    pl.folegoAt = gameTime + 120;
    const h = Math.round(pl.maxHp * L.folego); pl.hp = Math.min(pl.maxHp, pl.hp + h);
    burst(pl.x + pl.w / 2, pl.y + 8, 22, '#ffd27a', 110, -60, 0.8, 1, true); floatText(pl.x + pl.w / 2, pl.y - 16, 'ÚLTIMO FÔLEGO', '#ffd27a', 1.2);
  }
  _fxRaw(d, kdir);
};

// burning foes (Brasa que Não Apaga)
const _fxUpd = updateEnemies;
updateEnemies = function (dt) {
  _fxUpd(dt);
  for (const e of enemies) {
    const b = e.burn; if (!b || e.dead) continue;
    b.t -= dt; b.tick -= dt;
    if (Math.random() < dt * 10) burst(e.x + Math.random() * e.w, e.y + Math.random() * e.h, 1, Math.random() < 0.5 ? '#ff9a3c' : '#ffd27a', 20, -80, 0.4, 1, true);
    if (b.tick <= 0) { b.tick += 1; e.hp -= b.d; e.flash = 0.06; e.showHp = 3; floatText(e.x + e.w / 2, e.y - 6, String(b.d), '#ff9a3c', 0.8); if (e.hp <= 0) { e.burn = null; killEnemy(e); continue; } }
    if (b.t <= 0) e.burn = null;
  }
};

// Ctrl shows where each summed line came from: redraw the open tooltip when it goes down or up
let fxLastMouse = null;
addEventListener('mousemove', e => { fxLastMouse = e; }, true);
function fxRetip(e) {
  if (e.key !== 'Control' || !fxLastMouse) return;
  const t = $('tip'); if (!t || t.hidden) return;
  t._key = null; const m = fxLastMouse, el = document.elementFromPoint(m.clientX, m.clientY);
  if (el) onInvHover({ target: el, clientX: m.clientX, clientY: m.clientY });
}
addEventListener('keydown', fxRetip); addEventListener('keyup', fxRetip);
