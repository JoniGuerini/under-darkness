'use strict';

/* ================= nadar e fôlego (2026-10-10) =================
   O herói na água do 171-agua (docs/camadas/10-mar-sem-sol.md, "Sistemas novos", item 3):
   - Movimento: gravidade a 25%, queda máxima 60 px/s, de lado a 60% da velocidade. W ou Espaço dão braçada (sobe
     70 px/s enquanto segura); S mergulha mais rápido. Na superfície, W dá um pulo de saída de 2 blocos. Escadas,
     cordões e correntes funcionam igual debaixo da água.
   - Peso: a soma dos `spd` negativos do elmo, do peitoral, das botas e do escudo. Até 0,05 o herói boia (parado,
     sobe devagar até a superfície). De 0,06 para cima ele afunda a 40 px/s parado, a braçada sobe só 40 px/s, mas
     ele anda no fundo e pula 2 blocos de lá.
   - Fôlego: 10 s com a cabeça dentro (os 6 px de cima do corpo). Zerado, perde 8% da vida a cada 0,5 s. Com a
     cabeça fora enche 4 vezes mais rápido; no respiradouro, na hora. Abaixo de 30% as bordas da tela escurecem e
     entra o som do coração. A barra é uma linha azul em cima da hotbar, no lugar e no estilo da barra de vigor, e
     só aparece enquanto o fôlego não está cheio. Sem texto.
   - Golpes 20% mais lentos na água, menos a lança. Projéteis entram na água com metade da velocidade. Loot afunda
     devagar. Monstro sem marca que cai na água anda devagar e afunda devagar (não se afoga); só o herói tem fôlego.
   - Monstro de terra não nasce dentro da água (as camadas que têm bicho de água põem os seus).
   Carrega logo depois do 171-agua. Visual da barra em css/agua.css. */

const FOLEGO_MAX = 10, FOLEGO_PESO = 0.06;
pl.folego = FOLEGO_MAX; pl.folegoT = 0; pl.naAgua = 0; pl.cabecaNaAgua = false;

// quanto do retângulo está na água (0 a 1, pelas células que ele toca)
function aguaIn(x, y, w, h) {
  if (!agua.length) return 0;
  const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T);
  let n = 0, wet = 0;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { n++; if (aguaAt(tx, ty)) wet++; }
  return n ? wet / n : 0;
}
const cabecaNaAgua = e => !!aguaAt(Math.floor((e.x + e.w / 2) / T), Math.floor((e.y + 3) / T));
// o peso do que o herói veste: só o que deixa mais lento conta
function pesoHeroi() { let w = 0; for (const k of ['head', 'body', 'feet', 'shield']) { const s = equip[k], it = s && ITEMS[s.id]; if (it && it.spd < 0) w -= it.spd; } return w; }

/* ---------- o herói ---------- */
let nadoVy0 = 0, nadoSalto = false;
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (pl.dead || !agua.length) { pl.naAgua = 0; pl.cabecaNaAgua = false; return _up(dt); }
  pl.naAgua = aguaIn(pl.x, pl.y, pl.w, pl.h); pl.cabecaNaAgua = cabecaNaAgua(pl);
  nadoVy0 = pl.vy; nadoSalto = !!(pressed.Space || pressed.KeyW || pressed.ArrowUp);
  const spd0 = pl.atkSpd, lento = pl.naAgua > 0.4 && !pl.thrust;
  if (lento) pl.atkSpd = (pl.atkSpd || 1) * 0.8;   // golpes 20% mais lentos (a lança não perde nada)
  const r = _up(dt);
  if (lento) pl.atkSpd = spd0;
  tickFolego(dt);
  return r;
}; }
{ const _me = moveEntity; moveEntity = function (e, dt, step) {
  if (e === pl) { if (pl.naAgua > 0.25 && !pl.climb && !pl.dead) nadoFisica(dt); return _me(e, dt, step); }
  if (!agua.length || e.boss || !e.type) return _me(e, dt, step);
  const D = ET[e.type]; if (!D || D.fly || D.swim || D.amph || D.bottom) return _me(e, dt, step);
  if (!aguaAt(Math.floor((e.x + e.w / 2) / T), Math.floor((e.y + e.h / 2) / T))) return _me(e, dt, step);
  // um bicho de terra na água: anda devagar e afunda devagar
  const vx = e.vx; e.vx *= 0.6; if (e.vy > 50) e.vy = 50;
  const r = _me(e, dt, step);
  if (e.vx !== 0) e.vx = vx;
  return r;
}; }
function nadoFisica(dt) {
  const up = keys.KeyW || keys.Space || keys.ArrowUp, down = keys.KeyS || keys.ArrowDown;
  const pesado = pesoHeroi() >= FOLEGO_PESO, g = GRAV * 0.25;
  let vy = nadoVy0;
  if (!pl.cabecaNaAgua && nadoSalto && pl.stunT <= 0) { vy = -230; sfx.splash && sfx.splash(0.6); }                  // pulo de saída na superfície
  else if (pesado && pl.onGround && nadoSalto && pl.stunT <= 0) vy = -112;                                          // do fundo pula 2 blocos
  else if (up && pl.stunT <= 0) vy = approach(vy, pesado ? -40 : -70, 520 * dt);                                     // braçada
  else if (down) vy = approach(vy, pesado ? 80 : 90, 420 * dt);
  else if (pesado) vy = approach(vy + g * dt, 40, 300 * dt);
  else if (pl.cabecaNaAgua) vy = approach(vy, -26, 160 * dt);                                                        // boia: sobe devagar
  else vy = approach(vy, pl.naAgua > 0.6 ? -8 : 10, 260 * dt);                                                      // na superfície, fica
  pl.vy = Math.min(vy, 60);
  const pe = equip.feet && ITEMS[equip.feet.id], maxSpd = 82 * (1 + pl.spd) * (pe && pe.swimSpd ? 1 : 0.6); pl.vx = clamp(pl.vx, -maxSpd, maxSpd);
}

/* ---------- o fôlego ---------- */
let folegoBatida = 0, folegoDentro = false;
function tickFolego(dt) {
  if (pl.dead) { pl.folego = FOLEGO_MAX; return; }
  const cel = aguaAt(Math.floor((pl.x + pl.w / 2) / T), Math.floor((pl.y + 3) / T));
  if (cel === AGUA_RESPIRO || pl.cabecaNaAgua && aguaAt(Math.floor((pl.x + pl.w / 2) / T), Math.floor((pl.y + pl.h - 2) / T)) === AGUA_RESPIRO) { pl.folego = FOLEGO_MAX; pl.vy = Math.min(pl.vy, -60); }
  else if (pl.cabecaNaAgua) pl.folego = Math.max(0, pl.folego - dt);
  else pl.folego = Math.min(FOLEGO_MAX, pl.folego + dt * 4);
  if (pl.cabecaNaAgua !== folegoDentro) { folegoDentro = pl.cabecaNaAgua; if (sfx.splash && Math.abs(pl.vy) > 30) sfx.splash(folegoDentro ? 1 : 0.5); }
  if (pl.folego <= 0) {
    pl.folegoT -= dt;
    if (pl.folegoT <= 0) { pl.folegoT = 0.5; afogar(Math.max(1, Math.round(pl.maxHp * 0.08))); }
  } else pl.folegoT = 0.5;
  if (pl.folego < FOLEGO_MAX * 0.3 && pl.cabecaNaAgua && (folegoBatida -= dt) <= 0) { folegoBatida = 0.5 + pl.folego / FOLEGO_MAX * 1.2; sfx.heartbeat && sfx.heartbeat(); }
}
// perder vida sem ar: sem empurrão (o herói continua onde está, debaixo da água)
function afogar(d) {
  if (godMode()) return;
  pl.hp -= d; pl.hurtFlash = 0.12; pl.lastHurt = gameTime; pl.regen = 0;
  for (let k = 0; k < 4; k++) parts.push({ x: pl.x + pl.w / 2 + rnd(-2, 2), y: pl.y + 2, vx: rnd(-6, 6), vy: rnd(-40, -20), g: -30, life: 0.9, max: 0.9, col: '#c8eef8', size: 1 });
  floatText(pl.x + pl.w / 2, pl.y - 6, '-' + d, '#ff5a5a', 1.1);
  sfx.hurt(); hurtVig = 0.5;
  if (pl.hp <= 0) { pl.hp = 0; die(); }
}
const godMode = () => typeof modoDeus !== 'undefined' && modoDeus;
Object.assign(sfx, {
  splash(v = 1) { noise(0.22, 0.05 * v, 900, 'lowpass'); noise(0.12, 0.03 * v, 2600, 'bandpass', 0.03); tone(320, 0.12, 'sine', 0.02 * v, -180); },
  heartbeat() { tone(58, 0.11, 'sine', 0.07, -12); tone(52, 0.12, 'sine', 0.05, -10, 0.17); }
});

/* ---------- monstros de terra não nascem na água ---------- */
let aguaNoSpawn = false;
{ const _ts = trySpawn; trySpawn = function () { aguaNoSpawn = true; try { return _ts(); } finally { aguaNoSpawn = false; } }; }
{ const _li = lavaIn; lavaIn = function (x, y, w, h) { return _li(x, y, w, h) || (aguaNoSpawn && aguaIn(x, y, w, h) > 0); }; }

/* ---------- projéteis e loot ---------- */
HOOK.update.push(dt => {
  if (!agua.length) return;
  for (const o of projs) if (!o.naAgua && aguaAt(Math.floor(o.x / T), Math.floor(o.y / T))) { o.naAgua = true; o.vx *= 0.5; o.vy *= 0.5; }
  for (const o of loot) if (!o.rest && o.vy > 30 && aguaAt(Math.floor(o.x / T), Math.floor(o.y / T))) o.vy = 30;
});

/* ---------- a barra de fôlego e a borda escura ---------- */
let folegoBar = null;
function updateFolegoHUD() {
  if (!folegoBar) { folegoBar = document.createElement('div'); folegoBar.id = 'folegobar'; folegoBar.innerHTML = '<i id="hFolegoFill"></i>'; const vb = document.getElementById('vigbar'); (vb ? vb.parentNode : document.body).insertBefore(folegoBar, vb ? vb.nextSibling : null); }
  const hb = document.getElementById('hotbar'); if (!hb) return;
  const r = hb.getBoundingClientRect(), vig = !!hudCache.vigShow, key = Math.round(r.left) + ':' + Math.round(r.top) + ':' + Math.round(r.width) + ':' + vig;
  if (r.width && hudCache.folegoAlign !== key) { hudCache.folegoAlign = key; folegoBar.style.width = r.width + 'px'; folegoBar.style.left = (r.left + r.width / 2) + 'px'; folegoBar.style.top = (r.top - (vig ? 40 : 20)) + 'px'; }
  setW('hFolegoFill', clamp(pl.folego / FOLEGO_MAX, 0, 1) * 100);
  const show = state === 'play' && !pl.dead && pl.folego < FOLEGO_MAX - 0.01;
  if (hudCache.folegoShow !== show) { hudCache.folegoShow = show; folegoBar.classList.toggle('show', show); }
  const low = pl.folego < FOLEGO_MAX * 0.3;
  if (hudCache.folegoLow !== low) { hudCache.folegoLow = low; folegoBar.classList.toggle('low', low); }
}
{ const _uv = updateVigorHUD; updateVigorHUD = function () { _uv(); updateFolegoHUD(); }; }
let folegoVinheta = null;
HOOK.drawTop.push(() => {
  if (pl.dead || pl.folego >= FOLEGO_MAX * 0.3) return;
  if (!folegoVinheta || folegoVinheta.width !== VW || folegoVinheta.height !== VH) {
    folegoVinheta = mk(VW, VH); const c = folegoVinheta.getContext('2d'), g = c.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.3, VW / 2, VH / 2, Math.max(VW, VH) * 0.62);
    g.addColorStop(0, 'rgba(2,8,14,0)'); g.addColorStop(1, 'rgba(2,8,14,1)'); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
  }
  lc.globalAlpha = (1 - pl.folego / (FOLEGO_MAX * 0.3)) * 0.55 + 0.15; lc.drawImage(folegoVinheta, 0, 0); lc.globalAlpha = 1;
});
