'use strict';

/* ================= HUD & menus ================= */
const $ = id => document.getElementById(id);
const hudCache = {};
let helpHidden = false;
function setT(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function setH(id, v) { const s = v.toFixed(1) + '%'; if (hudCache['h' + id] !== s) { hudCache['h' + id] = s; $(id).style.height = s; } }
function setW(id, v) { const s = v.toFixed(1) + '%'; if (hudCache[id] !== s) { hudCache[id] = s; $(id).style.width = s; } }
function updateHUD() {
  setT('hLvl', String(pl.lvl));
  setT('hHp', `${Math.ceil(pl.hp)} / ${pl.maxHp}`); setH('hHpFill', clamp(pl.hp / pl.maxHp, 0, 1) * 100);
  setT('hMp', `${Math.floor(pl.mana)} / ${pl.maxMana}`); setH('hMpFill', clamp(pl.mana / pl.maxMana, 0, 1) * 100);
  const lowOrb = pl.hp / pl.maxHp < 0.3 && !pl.dead; if (hudCache.lowOrb !== lowOrb) { hudCache.lowOrb = lowOrb; $('orbHp').classList.toggle('low', lowOrb); }
  const need = xpNeed(pl.lvl); setT('hXp', `${Math.floor(pl.xp)} / ${need} XP`); setW('hXpFill', clamp(pl.xp / need, 0, 1) * 100);
  setT('hStats', fmtOuro(pl.gold));
  const tx = clamp(Math.floor((pl.x + 4) / T), 0, WW - 1), ty = Math.floor((pl.y + pl.h) / T);
  setT('zone', placeName(tx, ty)[0]);
  setT('hDepth', `${Math.max(0, ty - surf[SPX])} m`);
  const h = hourNow(); setT('hClock', `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 6) * 10).padStart(2, '0')}`);
  const night = isNight(); if (hudCache.sun !== night) { hudCache.sun = night; $('hSun').className = night ? 'sun moon' : 'sun'; }
  setT('hTorch', String(countItem('tocha'))); setT('hPot', String(countItem('pocao')));
  const low = pl.hp / pl.maxHp < 0.3 && !pl.dead; const lv = low ? (0.5 + Math.sin(gameTime * 5) * 0.25) : 0; const target = Math.max(lv, hurtVig).toFixed(2);
  if (hudCache.vig !== target) { hudCache.vig = target; $('lowhp').style.opacity = target; }
  paintHotbar();
  alignXp();
  updateVigorHUD();
  if (bossFight) setW('bossFill', clamp(bossFight.e.hp / bossFight.e.maxHp, 0, 1) * 100);
}
function hbItem(i) { if (i === 0) return equip.weapon; if (i === 1) return equip.tool; return inv[i - 2] || null; }
function paintHotbar() {
  let key = hb.sel + '|' + (equip.weapon ? equip.weapon.uid : '') + '|' + (equip.tool ? equip.tool.uid : ''); for (let i = 0; i < HB_BAG; i++) { const q = inv[i]; key += '|' + (q ? (q.uid || q.id) + '*' + q.n : ''); }
  if (hudCache.hb === key) return; hudCache.hb = key;
  document.querySelectorAll('#hotbar .slot').forEach(d => { const i = +d.dataset.hb; paintSlot(d, hbItem(i), true); d.classList.toggle('sel', i === hb.sel); });
}
let hbNameTO = 0;
function selectHB(i) {
  i = ((i % HB_N) + HB_N) % HB_N;
  if (i === hb.sel) return;
  hb.sel = i; pl.atkT = -1; pl.atkBuf = 0; pl.trail.length = 0; pl.digT = 0; pl.digX = -1; pl.mining = false; pl.mineT = MINE_P * 0.3; pl.mineAge = 0; pl.useCD = 0;
  sfx.select(); invDirty = true;
  const q = hbItem(i), el = $('hbName');
  el.textContent = q ? itemName(q) + (q.n > 1 ? ` (${q.n})` : '') : i === 0 ? 'Mãos vazias' : i === 1 ? 'Sem picareta' : 'Mão vazia';
  el.style.color = q ? RAR_COL[itemRar(q)] : '#a8997f';
  el.classList.add('show'); clearTimeout(hbNameTO); hbNameTO = setTimeout(() => el.classList.remove('show'), 1500);
  paintHotbar();
}
function toast(msg, cls = '', color = '') {
  const box = $('toasts'); const d = document.createElement('div'); d.className = 'toast panel ' + cls; d.textContent = msg; if (color) d.style.color = color; box.appendChild(d);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => d.classList.add('out'), 3400); setTimeout(() => d.remove(), 4000);
}
let bannerTO = 0;
function showBanner(t, sub) { const b = $('banner'); b.textContent = t; const s = document.createElement('small'); s.textContent = sub; b.appendChild(s); b.classList.add('show'); clearTimeout(bannerTO); bannerTO = setTimeout(() => b.classList.remove('show'), 2600); }
function pauseGame() { state = 'pause'; $('pause').hidden = false; resetNewBtn(); saveGame(); $('btnResume').focus(); }
function resumeGame() { $('pause').hidden = true; state = 'play'; last = performance.now(); initAudio(); if (wantFull && !fullEl()) enterFull(); }
/* fullscreen: Esc should pause, not throw you out of fullscreen.
   Chromium lets the page keep Esc (Keyboard Lock) while fullscreen; other browsers always use Esc to leave,
   so leaving fullscreen mid-game pauses it, and "Continuar" puts you back in fullscreen. */
let wantFull = false, escLocked = false;
const fullEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
async function enterFull() {
  wantFull = true;
  const el = document.documentElement;
  try { if (!fullEl()) { if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' }); else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); } } catch (e) { return; }
  escLocked = false;
  try { if (navigator.keyboard && navigator.keyboard.lock) { await navigator.keyboard.lock(['Escape']); escLocked = true; } } catch (e) { escLocked = false; }
  fullUI();
}
function exitFull() {
  wantFull = false;
  try { if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock(); } catch (e) { }
  escLocked = false;
  try { if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen(); else if (document.webkitExitFullscreen && document.webkitFullscreenElement) document.webkitExitFullscreen(); } catch (e) { }
}
function toggleFull() { if (fullEl()) exitFull(); else enterFull(); }
function fullUI() { const on = !!fullEl(); $('btnFull').textContent = on ? 'Sair da tela cheia' : 'Tela cheia'; }
function onFullChange() {
  if (!fullEl()) {
    try { if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock(); } catch (e) { }
    escLocked = false;
    // the browser's own Esc kicked us out: open the menu instead. Leaving because the window lost focus (alt-tab) does not.
    if (wantFull && state === 'play') setTimeout(() => { if (state === 'play' && !fullEl() && document.hasFocus()) pauseGame(); }, 150);
  }
  fullUI();
}
function showDeath() { state = 'dead'; $('death').hidden = false; $('deathStats').innerHTML = `Nível <b>${pl.lvl}</b> · ${pl.kills} inimigos derrotados<br><em>Você perdeu ${pl.lostXp || 0} XP do nível atual.</em>`; $('btnRespawn').focus(); }
function spawnPoint() { return [SPX * T, surf[SPX] * T - pl.h - 0.01]; }
function respawn() {
  const [x, y] = spawnPoint(); pl.x = x; pl.y = y; pl.vx = pl.vy = 0; pl.dead = false; pl.hp = pl.maxHp; pl.invuln = 2; pl.atkT = -1; pl.trail.length = 0;
  for (let i = enemies.length - 1; i >= 0; i--) if (Math.abs(enemies[i].x - x) < VW) enemies.splice(i, 1);
  projs.length = 0; cam.x = x - VW / 2; cam.y = y - VH / 2;
  $('death').hidden = true; state = 'play'; lastZone = -1; saveGame();
}
function toggleSound() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.32; $('btnSound').textContent = muted ? 'Som: desligado' : 'Som: ligado'; try { localStorage.setItem('sob-a-terra-mute', muted ? '1' : '0'); } catch (e) { } }
let newArmed = false;
function resetNewBtn() { newArmed = false; $('btnNew').textContent = 'Novo mundo'; }
