'use strict';

/* ================= state ================= */
const cvs = document.getElementById('screen'); const sc = cvs.getContext('2d');
const low = mk(480, 270); const lc = low.getContext('2d');
let dpr = 1, S = 4, VW = 480, VH = 270;
let state = 'menu', gameTime = 0, worldTime = 0, hitstop = 0;
const cam = { x: 0, y: 0 }, shk = { x: 0, y: 0, m: 0 };
const enemies = [], projs = [], orbs = [], parts = [], texts = [];
let spawnTimer = 2, lastZone = -1, zoneCheck = 0, saveTimer = 0, tutorialStep = 0, tutorialT = 0;
const pl = {
  x: 0, y: 0, w: 8, h: 21, vx: 0, vy: 0, onGround: false, facing: 1,
  lvl: 1, xp: 0, hp: 20, maxHp: 20, dmg: 3.5, dmgMin: 3, dmgMax: 4, aps: 1.7, dps: 6, lg: {}, atkPeriod: 0.6, atkAt: -9, def: 0, kills: 0, crit: 0.1, parry: 0.22, spd: 0, xpB: 0, regenB: 0, potCD: 0, fullMsg: 0,
  atkT: -1, atkType: 0, atkStart: 0.9, atkHit: new Set(), lastAtkEnd: -9, atkBuf: 0,
  shieldK: 0, shieldOn: false, shieldStart: -9,
  invuln: 0, hurtFlash: 0, lastHurt: -9, regen: 0, coyote: 0, jumpBuf: 0, walk: 0, stunT: 0,
  fArm: 2.7, sAng: 0.9, trail: [], dead: false, deathT: 0, digT: 0, digX: -1, digY: -1, lavaT: 0, target: null,
  mining: false, mineT: 0, mineAge: 0, hintT: 0, useCD: 0, useT: 0,
  gold: 0, mana: 25, maxMana: 25, atkSpd: 1, critDmg: 0.75, lifeSteal: 0, thorns: 0, dodge: 0, onKill: 0, light: 0, mine: 1, pickDmg: 6, reach: 28, kb: 1, stunCh: 0, thrust: false, spearPy: 12, lsAcc: 0
};
// hotbar (like Minecraft): 1 = weapon, 2 = pickaxe, 3-9 and 0 = inv[0..7]; in the inventory it is the row under the backpack.
// only the selected one is in your hand
const HB_BAG = 8, HB_N = 2 + HB_BAG;
const hb = { sel: 0 };
let toolNews = false, blockTip = false, mapNews = false;
const HERO_HP = 20;   // the hero's own life before gear (rebalanced 2026-10-08, was 50)
const xpNeed = l => Math.round(25 * Math.pow(l, 1.5));
function recalc() {
  // gear numbers: js/48-itemizacao.js. The weapon gives a damage range and its speed; % damage and speed from any piece apply on top
  const tot = {}; for (const k of STAT_KEYS) tot[k] = 0;
  for (const k of EQ_SLOTS) { const s = equip[k]; if (!s) continue; const st = itemStats(s); for (const key of STAT_KEYS) if (key !== 'dmg' && key !== 'mine' && key !== 'parry') tot[key] += st[key]; }
  const w = equip.weapon, K = KIND[w ? ITEMS[w.id].kind || 'sword' : 'sword'];
  if (typeof talentTot === 'function') talentTot(tot, w ? ITEMS[w.id].kind || 'sword' : '');   // árvore de talentos: js/51-talentos.js
  const sh = equip.shield ? itemStats(equip.shield) : null, tl = equip.tool ? itemStats(equip.tool) : null;
  const wb = w ? weaponBase(w) : { min: 1, max: 2, spd: SWING }, k = 1 + tot.dmgPct;
  pl.maxHp = HERO_HP + tot.hp;   // leveling grants no bonuses (for now)
  pl.maxMana = 25; if (pl.mana > pl.maxMana) pl.mana = pl.maxMana;
  pl.dmgMin = Math.max(1, Math.round((wb.min + tot.dmgAddMin) * k)); pl.dmgMax = Math.max(pl.dmgMin, Math.round((wb.max + tot.dmgAddMax) * k));
  pl.dmg = (pl.dmgMin + pl.dmgMax) / 2;
  // atkPeriod: seconds between blows (11-jogador waits for it); atkSpd: how fast the swing itself plays, always done before the next
  pl.atkPeriod = wb.spd / (1 + tot.atkSpd); pl.aps = 1 / pl.atkPeriod; pl.atkSpd = clamp(0.31 / (pl.atkPeriod * 0.85), 0.55, 1.4);
  pl.crit = BASE_CRIT + tot.crit; pl.critDmg = 0.75 + tot.critDmg;
  pl.dps = pl.dmg * pl.aps * (1 + Math.min(1, pl.crit) * pl.critDmg);
  pl.def = tot.def;
  pl.parry = sh ? sh.parry : 0; pl.spd = tot.spd; pl.xpB = tot.xp; pl.regenB = tot.regen;
  pl.lifeSteal = tot.lifeSteal; pl.thorns = tot.thorns; pl.dodge = Math.min(0.4, tot.dodge); pl.onKill = tot.onKill; pl.light = tot.light;
  pl.mine = tl ? tl.mine : 0; pl.pickDmg = tl ? tl.dmg : 4;
  pl.reach = w ? K.reach : 18; pl.kb = w ? K.kb || 1 : 1; pl.stunCh = w ? K.stun || 0 : 0; pl.thrust = !!(w && K.thrust);
  pl.lg = { first: tot.lgFirst > 0, blood: tot.lgBlood, fome: tot.lgFome, brasa: tot.lgBrasa, sino: tot.lgSino > 0, folego: tot.lgFolego, spark: tot.spark };
  if (typeof talentPost === 'function') talentPost();
  if (pl.hp > pl.maxHp) pl.hp = pl.maxHp;
}

/* ================= input ================= */
const keys = {}, pressed = {};
const mouse = { x: -100, y: -100, l: false, r: false, lPressed: false, ctrlR: false };
const GAME_KEYS = new Set(['Tab', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyE', 'KeyQ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
addEventListener('keydown', e => {
  if (GAME_KEYS.has(e.code) && state === 'play') e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (held && e.code === 'Escape') { cancelHeld(); return; }
  if (state === 'inv' && (e.code === 'Escape' || e.code === 'KeyI')) { closeInv(); return; }
  if (state === 'inv' && e.code === 'KeyC' && !e.repeat) { closeInv(); openChar(); return; }
  if (state === 'talk') { if ((e.code === 'Escape' || e.code === 'KeyE') && !e.repeat) { if (shopNpc) backFromShop(); else if (forgeNpc) backFromForge(); else closeTalk(); } return; }
  if (state === 'char') { if (!e.repeat && (e.code === 'Escape' || e.code === 'KeyC')) closeChar(); else if (!e.repeat && e.code === 'KeyI') { closeChar(); openInv(); } return; }
  if (e.code === 'KeyI' && state === 'play') { openInv(); return; }
  if (e.code === 'KeyC' && state === 'play' && !e.repeat) { openChar(); return; }
  if (e.code === 'Escape' && !e.repeat) { if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); }
  if (e.code === 'KeyF' && !e.repeat && (state === 'play' || state === 'pause')) toggleFull();
  if (e.code === 'KeyM') toggleSound();
  if (e.code === 'KeyH') { helpHidden = !helpHidden; $('help').hidden = helpHidden; }
  if (state === 'play') { const m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code); if (m) selectHB((+m[1] + 9) % 10); }
  if (e.code === 'Tab' && state === 'play' && !e.repeat) { mapOpen = !mapOpen; sfx.map(); }
});
// mouse wheel cycles the hotbar: every wheel notch moves one slot, so one long roll crosses several;
// trackpads send many tiny deltas, so those are added up first
let wheelAcc = 0, wheelLast = 0;
addEventListener('wheel', e => {
  if (state !== 'play' || e.ctrlKey) return;
  e.preventDefault();
  const now = performance.now(); if (now - wheelLast > 250) wheelAcc = 0; wheelLast = now;
  const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
  if (Math.abs(d) >= 50) { wheelAcc = 0; selectHB(hb.sel + Math.sign(d)); return; }
  wheelAcc += d;
  while (Math.abs(wheelAcc) >= 60) { const st = Math.sign(wheelAcc); selectHB(hb.sel + st); wheelAcc -= st * 60; }
}, { passive: false });
addEventListener('keyup', e => { keys[e.code] = false; });
cvs.addEventListener('mousedown', e => {
  initAudio();
  if (e.button === 0 && !e.ctrlKey) { mouse.l = true; mouse.lPressed = true; }
  else if (e.button === 2 || (e.button === 0 && e.ctrlKey)) { mouse.r = true; mouse.ctrlR = e.button === 0; }
  e.preventDefault();
});
addEventListener('mouseup', e => { if (e.button === 0) { mouse.l = false; if (mouse.ctrlR) { mouse.r = false; mouse.ctrlR = false; } } if (e.button === 2) mouse.r = false; });
addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
addEventListener('contextmenu', e => { if (e.target === cvs) e.preventDefault(); });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.l = mouse.r = false; });   // perder o foco não pausa: o menu só abre pelo Esc
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
function mouseLow() { return [mouse.x * dpr / S, mouse.y * dpr / S]; }
function mouseWorld() { const [x, y] = mouseLow(); return [x + Math.round(cam.x), y + Math.round(cam.y)]; }
