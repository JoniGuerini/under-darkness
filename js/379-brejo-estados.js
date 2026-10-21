'use strict';

/* ================= o Brejo das Bruxas: os estados do herói, a lama e o desfazer dos bichos =================
   Os bichos (373, 374) e a Velha (376) chamam os ajudantes do 370; aqui eles correm a cada quadro do herói:
   - enrolado (bjEnrolar: a mortalha da Lavadeira): sem atacar, anda a 55%; bater as teclas de andar para os dois
     lados solta mais cedo;
   - paralisado (bjParalisar: a Mão de Glória): não anda, não pula, não ataca, o escudo cai;
   - envenenado (bjEnvenenar: a poça da Vassoura, o caldo da Velha): perde vida aos poucos, sem empurrão;
   - preso (bjPrender: a Sanguessuga grudada): anda um pouco mais devagar até ela soltar ou morrer.
   O chapéu de caçador corta pela metade o tempo dos feitiços (370: bjResiste). A lama do brejo prende os pés (anda a
   70%), menos com as Botas de Atoleiro. A Fisga do Turfeiro fura 30% mais com o herói ou o bicho dentro da água.
   A morte limpa tudo. O desfazer dos bichos ao morrer (MORTE_TIPOS, 360): carrega depois do 360 e antes do 355. */

const BJ_MOVE_KEYS = ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
let bjVenAcc = 0, bjLamaT = 0;
const bjPeAtoleiro = () => { const f = equip && equip.feet && ITEMS[equip.feet.id]; return !!(f && f.bjAtoleiro); };
function bjLimpaEstados() { if (!pl) return; pl.bjEnrolT = 0; pl.bjParaT = 0; pl.bjVenT = 0; pl.bjVenD = 0; pl.bjPresoE = null; }
function bjVeneno(d) {
  if (typeof godMode === 'function' && godMode()) return;
  pl.hp -= d; pl.hurtFlash = 0.06; pl.lastHurt = gameTime; pl.regen = 0;
  floatText(pl.x + pl.w / 2, pl.y - 6, '-' + d, '#a8e07a', 0.8);
  if (pl.hp <= 0) { pl.hp = 0; die(); }
}
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!pl || pl.dead) { if (pl && pl.dead) bjLimpaEstados(); return _up(dt); }
  const para = (pl.bjParaT || 0) > 0, enrol = (pl.bjEnrolT || 0) > 0, saved = {};
  let ml = false, mr = false;
  if (para) { for (const k of BJ_MOVE_KEYS) { saved[k] = keys[k]; keys[k] = false; } ml = mouse.l; mr = mouse.r; mouse.l = false; mouse.r = false; mouse.lPressed = false; pl.atkBuf = 0; }
  else if (enrol) { ml = mouse.l; mouse.l = false; mouse.lPressed = false; pl.atkBuf = 0; }
  // enrolado: bater esquerda e direita (cada troca conta) solta mais cedo
  if (enrol && !para) {
    const d = keys.KeyA || keys.ArrowLeft ? -1 : keys.KeyD || keys.ArrowRight ? 1 : 0;
    if (d && d !== pl.bjEnrolD) { pl.bjEnrolK = (pl.bjEnrolK || 0) + 1; pl.bjEnrolD = d; if (pl.bjEnrolK >= 3) { pl.bjEnrolK = 0; pl.bjEnrolT = Math.max(0, pl.bjEnrolT - 0.35); } }
    if (typeof fungLentidao === 'function') fungLentidao(0.45, 0.1);
  }
  try { _up(dt); } finally {
    if (para) { for (const k of BJ_MOVE_KEYS) keys[k] = saved[k]; mouse.l = ml; mouse.r = mr; }
    else if (enrol) mouse.l = ml;
  }
  if (pl.dead) { bjLimpaEstados(); return; }
  if (para) { pl.bjParaT = Math.max(0, pl.bjParaT - dt); if (pl.onGround) pl.vx = 0; pl.shieldK = 0; }
  if (enrol) pl.bjEnrolT = Math.max(0, pl.bjEnrolT - dt);
  if ((pl.bjVenT || 0) > 0) {
    pl.bjVenT -= dt; bjVenAcc += dt;
    if (bjVenAcc >= 0.5) { bjVenAcc = 0; bjVeneno(Math.max(1, Math.round((pl.bjVenD || 2) * 0.5))); }
    if (Math.random() < dt * 8) parts.push({ x: pl.x + Math.random() * pl.w, y: pl.y + Math.random() * pl.h, vx: rnd(-6, 6), vy: rnd(-24, -10), g: 0, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#6aa84a' : '#a8e07a', size: 1, glow: true });
    if (pl.bjVenT <= 0) { pl.bjVenT = 0; pl.bjVenD = 0; }
  } else bjVenAcc = 0;
  if (pl.bjPresoE) { if (typeof bjLive === 'function' && !bjLive(pl.bjPresoE)) pl.bjPresoE = null; else if (typeof fungLentidao === 'function') fungLentidao(0.25, 0.1); }
  // a lama do brejo: os pés afundam (sem as Botas de Atoleiro)
  if (BREJO && pl.onGround && !bjPeAtoleiro()) {
    const tx0 = Math.floor((pl.x + 2) / T), tx1 = Math.floor((pl.x + pl.w - 2) / T), ty = Math.floor((pl.y + pl.h + 1) / T);
    let lama = false; for (let tx = tx0; tx <= tx1; tx++) if (tileAt(tx, ty) === BJ_LAMA) lama = true;
    if (lama) { if (typeof fungLentidao === 'function') fungLentidao(0.3, 0.12); if ((bjLamaT -= dt) <= 0 && Math.abs(pl.vx) > 20) { bjLamaT = 0.18; parts.push({ x: pl.x + pl.w / 2 + rnd(-3, 3), y: pl.y + pl.h - 1, vx: rnd(-20, 20), vy: rnd(-40, -20), g: 300, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#3a2a1c' : '#4e3c26', size: 1 }); } }
  }
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) { bjLimpaEstados(); return _nw(sd, sv); }; }

/* ---------- a Fisga do Turfeiro: +30% com o herói ou o bicho na água ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const w = equip && equip.weapon && ITEMS[equip.weapon.id];
  if (melee && w && w.bjAgua && e && !e.dead && typeof aguaAt === 'function') {
    const inW = o => aguaAt(Math.floor((o.x + o.w / 2) / T), Math.floor((o.y + o.h - 3) / T));
    if (inW(pl) || inW(e)) return _hit(e, dir, mult * 1.3, melee);
  }
  return _hit(e, dir, mult, melee);
}; }

/* ---------- o desenho: a mortalha enrolada, a luz da Mão de Glória, a sanguessuga ---------- */
HOOK.drawTop.push((cx, cy) => {
  if (!pl || pl.dead) return;
  const px = Math.round(pl.x + pl.w / 2 - cx), py = Math.round(pl.y - cy), fy = Math.round(pl.y + pl.h - cy);
  if ((pl.bjEnrolT || 0) > 0) {
    // faixas de linho molhado enroladas em diagonal pelo corpo
    for (let k = 0; k < 5; k++) {
      const y = py + 4 + k * 3 + (k & 1);
      lc.fillStyle = k & 1 ? '#867e6c' : '#a69c88'; lc.fillRect(px - 5, y, 10, 2);
      lc.fillStyle = '#686052'; lc.fillRect(px - 5 + ((k * 3) % 7), y + 1, 3, 1);
    }
    lc.fillStyle = '#c4baa4'; lc.fillRect(px + 4, py + 8, 2, 5);
  }
  if ((pl.bjParaT || 0) > 0) {
    // o herói fica pálido e duro: um contorno esverdeado piscando, os olhos brancos
    lc.globalAlpha = 0.35 + 0.25 * Math.sin(gameTime * 10); lc.fillStyle = '#c8f0ff';
    lc.fillRect(px - 6, py, 1, fy - py); lc.fillRect(px + 5, py, 1, fy - py); lc.fillRect(px - 5, py - 1, 10, 1);
    lc.globalAlpha = 1;
  }
});

/* ---------- o desfazer dos bichos ao morrer (360) ---------- */
Object.assign(MORTE_TIPOS, {
  bjsapo:       { px: 3, sp: 0.5, g: 600, bq: 0.2, ar: 0, sangue: 10, gota: 1 },
  bjsangue:     { px: 2, sp: 0.4, g: 480, bq: 0, ar: 0, sangue: 12, gota: 1 },
  bjenforcado:  { px: 2, sp: 0.45, g: 560, bq: 0.3, ar: 0, osso: 6, patas: 3 },
  bjturfeiro:   { px: 3, sp: 0.4, g: 600, bq: 0.15, ar: 0, sangue: 4, gomos: 1 },
  bjcorvo:      { px: 1, sp: 0.5, g: 200, bq: 0.2, ar: 1.8, sangue: 3, flutua: 1 },
  bjvassoura:   { px: 2, sp: 0.55, g: 520, bq: 0.25, ar: 0, acido: 10, faiscas: 6 },
  bjmao:        { px: 1, sp: 0.4, g: 300, bq: 0.2, ar: 1.2, faiscas: 16, flutua: 1 },
  bjinquisidor: { px: 3, sp: 0.5, g: 620, bq: 0.4, ar: 0, sangue: 6, placa: 1 },
  bjlavadeira:  { px: 2, sp: 0.35, g: 220, bq: 0.1, ar: 1.6, flutua: 1, gota: 1 },
  bjbruxa:      { px: 2, sp: 0.5, g: 540, bq: 0.25, ar: 0, sangue: 6, esporos: 14 },
  bjvelha:      { px: 3, sp: 0.5, g: 520, bq: 0.2, ar: 0, sangue: 14, acido: 18, esporos: 20 }
});
