'use strict';
/* ================= portal para o vilarejo (como o Portal da Cidade do Diablo 2) =================
   O botão ao lado do ouro, na barra de baixo, conjura o portal: o herói fica parado ~3 s erguendo o braço
   enquanto o portal se forma na frente dele. Levar dano, andar, pular, golpear ou erguer o escudo interrompe.
   Pronto, um portal azul fica aberto ali; clicando nele (ou E encostado nele) você vai para o vilarejo, onde o
   portal par aparece sempre no mesmo lugar, à esquerda do poço. Voltar por ele leva ao ponto salvo e fecha os
   dois. Sem recarga. No vilarejo o botão fica apagado. O portal aberto fica no save.
   Carregado ANTES do 24-boot (embrulha newWorld/makeSave, que o boot usa ao carregar o save). */

const TP_CAST = 3;                 // segundos de conjuração
const TP_VIL_DX = -77;             // centro do portal do vilarejo, em px a partir do ponto de partida: entre o poste (-9) e o poço (-5)
const TP_RX = 9, TP_RY = 15;       // meia-largura e meia-altura do oval, em pixels do mundo
const TP_REACH = 26;               // distância para entrar clicando
const tp = { cast: null, open: null, closing: [], flash: 0, art: null, iconF: -1 };

/* ---------- arte: oval de energia azul com espiral e granulado, quadros pré-desenhados ---------- */
const TP_PAL = ['#050818', '#0b1640', '#15296e', '#1f45ad', '#2f6ae0', '#5a9cff', '#9ccbff', '#dff1ff', '#ffffff'];
function tpFrame(rx, ry, ph, seedK) {
  const W = rx * 2 + 4, H = ry * 2 + 4, c = mk(W, H), x = c.getContext('2d'), cx = W / 2, cy = H / 2;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry, r = Math.hypot(dx, dy);
    if (r > 1.13) continue;
    let v;
    if (r > 1) v = 0;   // contorno escuro, como os outros sprites
    else {
      const a = Math.atan2(dy, dx), sw = Math.sin(a * 2 + r * 7.5 - ph * Math.PI * 2), sw2 = Math.sin(a * 3 - r * 4 + ph * Math.PI * 4 + 1.3);
      const g = hash2(i + seedK * 7, j + Math.floor(ph * 16) * 13, 771) - 0.5;
      v = 3 + sw * 1.25 + sw2 * 0.55 + g * 1.3;
      if (r > 0.8) v = 4.8 + (r - 0.8) * 9 + g;          // borda acesa
      if (r > 0.94) v = 7 + g * 1.5;                       // fio branco-azulado da borda
      if (r < 0.32) v += (0.32 - r) * 9;                   // miolo claro
    }
    x.fillStyle = TP_PAL[clamp(Math.round(v), 0, TP_PAL.length - 1)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
function tpBuildArt() {
  if (tp.art) return;
  tp.art = { big: [], icon: [], glow: glow(30, '#2f6ae0'), glowS: glow(14, '#5a9cff') };
  for (let f = 0; f < 16; f++) tp.art.big.push(tpFrame(TP_RX, TP_RY, f / 16, f));
  for (let f = 0; f < 12; f++) tp.art.icon.push(tpFrame(6, 10, f / 12, f + 40));
}

/* ---------- sons ---------- */
const tpSfx = {
  cast() { tone(196, 0.5, 'sine', 0.05, 180); noise(0.6, 0.05, 900, 'bandpass', 0, 3); },
  hum(k) { tone(160 + k * 260, 0.22, 'triangle', 0.02 + k * 0.025, 40); noise(0.2, 0.025, 1200 + k * 1600, 'bandpass', 0, 4); },
  open() { tone(392, 0.6, 'sine', 0.08, 300); tone(587, 0.7, 'triangle', 0.05, 200, 0.07); tone(784, 0.8, 'sine', 0.04, 120, 0.15); noise(0.7, 0.1, 2600, 'bandpass', 0, 2); },
  fail() { tone(300, 0.25, 'sawtooth', 0.05, -200); noise(0.25, 0.1, 700, 'bandpass', 0, 2); },
  go() { tone(220, 0.45, 'sine', 0.08, 500); tone(330, 0.5, 'triangle', 0.05, 600, 0.06); noise(0.45, 0.14, 1400, 'bandpass', 0, 1.5); },
  arrive() { tone(392, 0.5, 'sine', 0.08, 400); tone(784, 0.6, 'triangle', 0.05, 300, 0.08); noise(0.5, 0.12, 2600, 'bandpass', 0, 2); },
  close() { tone(520, 0.5, 'sine', 0.05, -380); noise(0.4, 0.08, 1800, 'bandpass', 0, 2); }
};

/* ---------- onde ficam ---------- */
function tpVilSpot() { return { x: SPX * T + TP_VIL_DX, y: surf[SPX] * T }; }   // pés do portal (base do oval)
function tpInVillage() { const tx = clamp(Math.floor((pl.x + pl.w / 2) / T), 0, WW - 1), ty = Math.floor((pl.y + pl.h - 1) / T); return inVillage(tx, ty) && zoneAt(tx, ty) === 0; }
function tpCanCast() { return state === 'play' && !pl.dead && !tpInVillage(); }
function tpPortals() { if (!tp.open) return []; const v = tpVilSpot(); return [{ x: tp.open.x, y: tp.open.y, t0: tp.open.t0, home: false }, { x: v.x, y: v.y, t0: tp.open.t0, home: true }]; }
const tpNear = p => { const dx = Math.abs(pl.x + pl.w / 2 - nearWX(p.x)), dy = Math.abs(pl.y + pl.h - p.y); return dx < TP_REACH && dy < 22; };
function tpUnder(wx, wy) { for (const p of tpPortals()) { const px = nearWX(p.x); if (Math.abs(wx - px) <= TP_RX + 2 && wy <= p.y + 1 && wy >= p.y - TP_RY * 2 - 3) return p; } return null; }
function portalUnderMouse() { if (state !== 'play' || !tp.open) return null; const [wx, wy] = mouseWorld(); return tpUnder(wx, wy); }

/* ---------- conjurar ---------- */
function tpStartCast() {
  initAudio();
  if (!tpCanCast() || tp.cast) return;
  if (!pl.onGround) { tpSfx.fail(); return; }
  pl.atkT = -1; pl.atkBuf = 0; pl.trail.length = 0; pl.mining = false; pl.digT = 0;
  tp.cast = { t: 0, hum: 0 }; tpSfx.cast(); tpBuildArt();
}
function tpCancel(why) {
  if (!tp.cast) return;
  const fx = pl.x + pl.w / 2 + pl.facing * 18, fy = pl.y + pl.h - TP_RY;
  tpBurst(fx, fy, 12, '#5a9cff', 60, 60, 0.5); burst(fx, fy, 8, '#15296e', 40, 80, 0.5);
  tp.cast = null; if (why !== 'quiet') tpSfx.fail();
}
// onde o portal vai abrir: um passo à frente, se ali houver chão e espaço; senão, onde o herói está
function tpOpenSpot() {
  const fy = pl.y + pl.h, ty = Math.floor((fy - 1) / T);
  const free = wx => { const tx = Math.floor(wx / T); for (let k = 0; k < 3; k++) if (SOLID[tileAt(tx, ty - k)]) return false; for (const dx of [-TP_RX + 1, TP_RX - 1]) { const sx = Math.floor((wx + dx) / T); if (SOLID[tileAt(sx, ty)] || SOLID[tileAt(sx, ty - 1)]) return false; } return !!SOLID[tileAt(tx, ty + 1)]; };
  const ahead = Math.round(pl.x + pl.w / 2 + pl.facing * 18);
  return { x: free(ahead) ? ahead : Math.round(pl.x + pl.w / 2), y: Math.round(fy) };
}
function tpFinishCast() {
  tp.cast = null;
  if (tp.open) tpCloseAnim(tp.open.x, tp.open.y);   // um portal novo fecha o antigo, como no Diablo
  const s = tpOpenSpot();
  tp.open = { x: s.x, y: s.y, t0: gameTime };
  tpBurst(s.x, s.y - TP_RY, 26, '#5a9cff', 80, -60, 0.8); tpBurst(s.x, s.y - TP_RY, 14, '#dff1ff', 50, -120, 0.6);
  tpSfx.open(); shake(1.5); saveTimer = Math.min(saveTimer, 0.5);
}
function tpCloseAnim(x, y) { tp.closing.push({ x, y, t: 0 }); }

/* ---------- atravessar ---------- */
function tpGoTo(x, y) {
  pl.x = x - pl.w / 2; pl.y = y - pl.h - 0.01; pl.vx = pl.vy = 0; pl.trail.length = 0; pl.atkT = -1; pl.invuln = Math.max(pl.invuln || 0, 1);
  projs.length = 0; cam.x = pl.x + pl.w / 2 - VW / 2; cam.y = pl.y + pl.h / 2 - VH / 2;
  tp.flash = 0.55;
}
function tpEnter(p) {
  if (!p || pl.dead) return;
  tpCancel('quiet');
  tpBurst(pl.x + pl.w / 2, pl.y + pl.h / 2, 20, '#5a9cff', 60, -120, 0.8); tpSfx.go();
  if (!p.home) {
    if (bossFight) endBossFight(false);   // sair no meio da luta reabre os portões, como morrer
    const v = tpVilSpot(); tpGoTo(v.x, v.y);
    tpBurst(v.x, v.y - TP_RY, 22, '#9ccbff', 70, -140, 0.9);
  } else {
    const o = tp.open, v = tpVilSpot(); tp.open = null;
    tpCloseAnim(v.x, v.y); tpCloseAnim(o.x, o.y);
    tpGoTo(o.x, o.y);
    tpBurst(o.x, o.y - TP_RY, 22, '#9ccbff', 70, -140, 0.9);
    setTimeout(() => tpSfx.close(), 250);
  }
  tpSfx.arrive(); zoneCheck = 0; saveTimer = Math.min(saveTimer, 0.5);
}

/* ---------- faíscas azuis (as faíscas comuns do jogo têm brilho dourado) ---------- */
const tpSparks = [];
function tpSpark(o) { if (tpSparks.length < 160) tpSparks.push(o); }
function tpBurst(x, y, n, col, sp, g, life) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = sp * (0.3 + Math.random() * 0.7); tpSpark({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g, life: life * (0.6 + Math.random() * 0.4), max: life, col }); } }
function tpSparksUpdate(dt) { for (let i = tpSparks.length - 1; i >= 0; i--) { const p = tpSparks[i]; p.life -= dt; if (p.life <= 0) { tpSparks.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; } }

/* ---------- a cada quadro ---------- */
function tpUpdate(dt) {
  tp.flash = Math.max(0, tp.flash - dt * 1.4); tpSparksUpdate(dt);
  for (let i = tp.closing.length - 1; i >= 0; i--) { tp.closing[i].t += dt; if (tp.closing[i].t > 0.5) tp.closing.splice(i, 1); }
  if (tp.cast) {
    const moved = keys.KeyA || keys.KeyD || keys.ArrowLeft || keys.ArrowRight || keys.KeyW || keys.ArrowUp || keys.Space || keys.KeyS || keys.ArrowDown;
    if (pl.dead || moved || mouse.l || mouse.r || keys.ShiftLeft || keys.ShiftRight || !pl.onGround || tpInVillage()) tpCancel();
  }
  if (tp.cast) {
    const c = tp.cast; c.t += dt;
    const k = Math.min(1, c.t / TP_CAST), fx = pl.x + pl.w / 2 + pl.facing * 18, fy = pl.y + pl.h - TP_RY;
    // faíscas puxadas em espiral para o ponto onde o portal nasce
    if (Math.random() < dt * (18 + k * 40)) { const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 10; tpSpark({ x: fx + Math.cos(a) * d, y: fy + Math.sin(a) * d * 1.4, vx: -Math.cos(a) * d * 2.2, vy: -Math.sin(a) * d * 3, g: 0, life: 0.45, max: 0.45, col: Math.random() < 0.3 ? '#dff1ff' : '#5a9cff', size: 1, glow: true }); }
    if (Math.random() < dt * 8) tpSpark({ x: pl.x + pl.w / 2 + pl.facing * 4 + rnd(-2, 2), y: pl.y + 2, vx: rnd(-6, 6), vy: rnd(-30, -14), g: 0, life: 0.5, max: 0.5, col: '#9ccbff', size: 1, glow: true });
    c.hum -= dt; if (c.hum <= 0) { c.hum = 0.5; tpSfx.hum(k); }
    if (c.t >= TP_CAST) tpFinishCast();
  }
  // o portal aberto solta faíscas azuis subindo
  for (const p of tpPortals()) {
    const px = nearWX(p.x); if (Math.abs(px - (pl.x + pl.w / 2)) > VW) continue;
    if (Math.random() < dt * 9) tpSpark({ x: px + rnd(-TP_RX, TP_RX), y: p.y - rnd(2, TP_RY * 2), vx: rnd(-4, 4), vy: rnd(-22, -10), g: 0, life: rnd(0.4, 0.8), max: 0.8, col: Math.random() < 0.35 ? '#dff1ff' : '#5a9cff', size: 1, glow: true });
  }
}
// braço da frente erguido enquanto conjura (depois do updatePlayer, que pôs a pose normal)
const _tpUpdatePlayer = updatePlayer;
updatePlayer = function (dt) {
  _tpUpdatePlayer(dt);
  if (tp.cast && !pl.dead) { const k = Math.min(1, dt * 10), w = Math.sin(gameTime * 9) * 0.06; pl.fArm = lerp(pl.fArm, 0.55 + w, k); pl.sAng = lerp(pl.sAng, -0.7, k); pl.vx *= 0.8; }
};
// levar dano interrompe
const _tpRawDamage = rawDamage;
rawDamage = function (d, kdir) { const r = _tpRawDamage(d, kdir); if (tp.cast) tpCancel(); return r; };

/* ---------- desenho ---------- */
function tpDrawOne(x, y, sc, ph, cx, cy) {
  const fr = tp.art.big[Math.floor(ph * 16) % 16], w = fr.width, h = fr.height;
  const dw = Math.max(1, Math.round(w * (0.35 + 0.65 * sc))), dh = Math.max(1, Math.round(h * sc));
  lc.drawImage(fr, Math.round(x - dw / 2) - cx, Math.round(y - 2 - (h - 4) / 2 - dh / 2) - cy, dw, dh);
}
const tpOpenK = t0 => Math.min(1, (gameTime - t0) / 0.45);
HOOK.drawWorld.push((cx, cy) => {
  if (!tp.open && !tp.cast && !tp.closing.length) return;
  tpBuildArt();
  const ph = (gameTime * 0.9) % 1;
  for (const p of tpPortals()) { const px = nearWX(p.x); if (px - cx < -40 || px - cx > VW + 40) continue; tpDrawOne(px, p.y, easeOut(tpOpenK(p.t0)), ph, cx, cy); }
  for (const c of tp.closing) tpDrawOne(nearWX(c.x), c.y, Math.max(0, 1 - c.t / 0.5), ph, cx, cy);
  if (tp.cast) {   // o portal crescendo na frente do herói
    const k = Math.min(1, tp.cast.t / TP_CAST);
    tpDrawOne(pl.x + pl.w / 2 + pl.facing * 18, pl.y + pl.h, 0.08 + 0.55 * k * k, (ph * 2) % 1, cx, cy);
  }
});
HOOK.drawGlow.push((cx, cy) => {
  if (!tp.art) return;
  const pulse = 0.5 + Math.sin(gameTime * 3) * 0.08, G = tp.art.glow;
  for (const p of tpPortals()) { const px = nearWX(p.x) - cx, py = p.y - TP_RY - cy; if (px < -40 || px > VW + 40) continue; lc.globalAlpha = pulse * tpOpenK(p.t0); lc.drawImage(G, px - 30, py - 30); lc.globalAlpha = 0.35 * tpOpenK(p.t0); lc.drawImage(G, px - 30, py - 18); }
  for (const p of tpSparks) { lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.35; lc.drawImage(tp.art.glowS, Math.round(p.x) - cx - 14, Math.round(p.y) - cy - 14); }
  if (tp.cast) { const k = Math.min(1, tp.cast.t / TP_CAST); lc.globalAlpha = 0.25 + k * 0.4; lc.drawImage(tp.art.glowS, pl.x + pl.w / 2 + pl.facing * 18 - cx - 14, pl.y + pl.h - TP_RY - cy - 14); lc.drawImage(tp.art.glowS, pl.x + pl.w / 2 + pl.facing * 4 - cx - 14, pl.y - cy - 12); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of tpSparks) { lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, 1, 1); }
  lc.globalAlpha = 1;
  if (tp.flash > 0) { lc.globalAlpha = tp.flash * 0.7; lc.fillStyle = '#9ccbff'; lc.globalCompositeOperation = 'lighter'; lc.fillRect(0, 0, VW, VH); lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = 1; }
});
HOOK.update.push(tpUpdate);
// luz: o portal clareia a escuridão em volta
const _tpPropLights = propLights;
propLights = function (addL, x0, y0, w, h) {
  _tpPropLights(addL, x0, y0, w, h);
  for (const p of tpPortals()) { const px = nearWX(p.x), k = tpOpenK(p.t0); addL(px, p.y - TP_RY, 0.95 * k); addL(px, p.y - 4, 0.8 * k); addL(px, p.y - TP_RY * 2, 0.75 * k); }
  if (tp.cast) addL(pl.x + pl.w / 2 + pl.facing * 18, pl.y + pl.h - TP_RY, 0.4 + 0.4 * Math.min(1, tp.cast.t / TP_CAST));
};

/* ---------- entrada: clicar no portal (ou E encostado nele) ---------- */
addEventListener('mousedown', e => {
  if (e.target !== cvs || e.button !== 0 || e.ctrlKey || state !== 'play' || pl.dead) return;
  const p = portalUnderMouse(); if (!p || !tpNear(p)) return;
  e.stopImmediatePropagation(); e.preventDefault(); initAudio(); tpEnter(p);
}, true);
addEventListener('keydown', e => {
  if (e.code !== 'KeyE' || e.repeat || state !== 'play' || pl.dead) return;
  if (typeof coletavelSobMouse === 'function' && coletavelSobMouse()) return;   // o que está sob o mouse ganha o E (js/348-coletar.js)
  const p = tpPortals().find(tpNear); if (!p) return;
  e.stopImmediatePropagation(); e.preventDefault(); tpEnter(p);
}, true);

/* ---------- botão na barra de baixo, depois do ouro ---------- */
(function () {
  const b = document.createElement('button');
  b.id = 'btnTP'; b.type = 'button'; b.className = 'panel hbside'; b.setAttribute('aria-label', 'Portal para o vilarejo');
  b.innerHTML = '<canvas width="16" height="24"></canvas>';
  const row = $('hbrow'); if (row) row.appendChild(b);
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); tpStartCast(); });
})();
function tpPaintButton() {
  const b = $('btnTP'); if (!b || !tp.art) return;
  const off = !tpCanCast() && state === 'play';
  const key = (off ? 1 : 0) + ':' + (tp.cast ? 1 : 0);
  if (b.dataset.k !== key) { b.dataset.k = key; b.classList.toggle('off', off); b.classList.toggle('casting', !!tp.cast); }
  const f = Math.floor(gameTime * (tp.cast ? 14 : 6)) % 12;
  if (f !== tp.iconF) { tp.iconF = f; const x = b.lastChild.getContext('2d'); x.clearRect(0, 0, 16, 24); x.drawImage(tp.art.icon[f], 0, 0); }
}
const _tpUpdateHUD = updateHUD;
updateHUD = function () { _tpUpdateHUD(); tpBuildArt(); tpPaintButton(); };

/* ---------- save ---------- */
const _tpMakeSave = makeSave;
makeSave = function () { const o = _tpMakeSave(); o.tp = tp.open ? { x: tp.open.x, y: tp.open.y } : null; return o; };
const _tpNewWorld = newWorld;
newWorld = function (sd, sv) {
  tp.cast = null; tp.open = null; tp.closing.length = 0; tp.flash = 0; tpSparks.length = 0;
  const r = _tpNewWorld(sd, sv);
  if (sv && sv.tp && isFinite(sv.tp.x) && isFinite(sv.tp.y)) tp.open = { x: +sv.tp.x, y: +sv.tp.y, t0: -9 };
  return r;
};
