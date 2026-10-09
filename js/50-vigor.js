'use strict';

/* ================= vigor (stamina) =================
   For now only the shield uses it: every blocked or parried hit costs vigor.
   At zero the guard breaks: the shield drops and can't be raised until vigor
   climbs back to VIG_BACK. Vigor only recovers while the shield is down. */
const VIG_MAX = 100;
const VIG_BLOCK = 25, VIG_PARRY = 15;    // cost per hit taken on the shield (a parry is cheaper: good timing pays)
const VIG_BOSS = 1.6;                    // a boss's blow weighs more on the arm
const VIG_REGEN = 22, VIG_REGEN_BROKEN = 12, VIG_DELAY = 0.7, VIG_BACK = 40;
pl.vig = VIG_MAX; pl.vigT = 0; pl.guardBroken = false;

// called from hurtPlayer (js/10-combate.js) after the shield took the hit
function spendVigor(parry, boss) {
  pl.vig = Math.max(0, pl.vig - (parry ? VIG_PARRY : VIG_BLOCK) * (boss ? VIG_BOSS : 1));
  pl.vigT = 0;
  if (pl.vig > 0) return false;
  pl.guardBroken = true; pl.shieldOn = false; pl.shieldK = 0; pl.stunT = Math.max(pl.stunT, 0.4);
  floatText(pl.x + pl.w / 2, pl.y - 18, 'GUARDA QUEBRADA', '#ff9a5a', 1.2);
  sfx.block(); shake(3);
  return true;
}
// called from updatePlayer (js/11-jogador.js) every frame
function tickVigor(dt) {
  if (pl.shieldOn) { pl.vigT = 0; return; }
  pl.vigT += dt;
  if (pl.vigT < VIG_DELAY || pl.vig >= VIG_MAX) return;
  pl.vig = Math.min(VIG_MAX, pl.vig + (pl.guardBroken ? VIG_REGEN_BROKEN : VIG_REGEN) * dt);
  if (pl.guardBroken && pl.vig >= VIG_BACK) pl.guardBroken = false;
}
function resetVigor() { pl.vig = VIG_MAX; pl.vigT = 0; pl.guardBroken = false; }

// HUD: a thin bar over the hotbar, only while vigor isn't full or the guard is up
let vigAlign = '';
function updateVigorHUD() {
  const bar = document.getElementById('vigbar'), hb = document.getElementById('hotbar');
  if (!bar || !hb) return;
  const r = hb.getBoundingClientRect();
  const key = Math.round(r.left) + ':' + Math.round(r.top) + ':' + Math.round(r.width);
  if (r.width && vigAlign !== key) { vigAlign = key; bar.style.width = r.width + 'px'; bar.style.left = (r.left + r.width / 2) + 'px'; bar.style.top = (r.top - 20) + 'px'; }
  setW('hVigFill', clamp(pl.vig / VIG_MAX, 0, 1) * 100);
  const show = !pl.dead && !!equip.shield && (pl.vig < VIG_MAX - 0.01 || pl.shieldOn);
  if (hudCache.vigShow !== show) { hudCache.vigShow = show; bar.classList.toggle('show', show); }
  if (hudCache.vigBroken !== pl.guardBroken) { hudCache.vigBroken = pl.guardBroken; bar.classList.toggle('broken', pl.guardBroken); }
}
