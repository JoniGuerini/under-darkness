'use strict';

/* ================= o Reino Élfico: os estados do herói e os espinheiros =================
   Carrega no fim da cadeia da camada (depois do 256). Os elfos chamam os ajudantes do 250; aqui eles correm:
   - enraizado (elEnraizar: o Antigo da Mata, as Sentinelas Sombrias da Dama): raízes prendem os pés; não anda nem
     pula, ainda ataca, defende e lança magia;
   - silenciado (elSilenciar: o Magíster Sangrento): um selo prateado sobre a cabeça; não lança magia nem bebe poção;
   - enfeitiçado (elEnfeiticar: só a Dama): puxado devagar para um ponto; andar para longe vence metade do puxão;
   - o espinheiro profanado arranha quem passa por ele (um pouco de dano e lentidão), como a ficha pede (seção 4).
   A morte limpa tudo. */

const EL_MOVE_KEYS = ['KeyA', 'KeyD', 'KeyW', 'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp'];
let elEspinhoCD = 0;

{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!ELFOS || !pl || pl.dead) { if (pl && pl.dead) { pl.elRaizT = 0; pl.elSilT = 0; pl.elFeitT = 0; } return _up(dt); }
  // enraizado: as teclas de andar e pular somem durante o quadro do herói e voltam depois
  const raiz = (pl.elRaizT || 0) > 0, saved = {};
  if (raiz) for (const k of EL_MOVE_KEYS) { saved[k] = keys[k]; keys[k] = false; }
  try { _up(dt); } finally { if (raiz) for (const k of EL_MOVE_KEYS) keys[k] = saved[k]; }
  if (pl.dead) return;
  if (raiz) { pl.elRaizT = Math.max(0, pl.elRaizT - dt); if (pl.onGround) pl.vx = 0; }
  if ((pl.elSilT || 0) > 0) pl.elSilT = Math.max(0, pl.elSilT - dt);
  // enfeitiçado: um empurrão para o ponto da Dama; andar para longe tira metade
  if ((pl.elFeitT || 0) > 0) {
    pl.elFeitT -= dt;
    const dx = wdx(Math.round((pl.elFeitX - pl.x - pl.w / 2) / T)) * T, dir = Math.sign(dx);
    if (Math.abs(dx) > 6) {
      const away = (dir > 0 && (keys.KeyA || keys.ArrowLeft)) || (dir < 0 && (keys.KeyD || keys.ArrowRight));
      const vx = pl.vx, vy = pl.vy;
      pl.vx = dir * pl.elFeitF * (away ? 0.5 : 1); pl.vy = 0; moveEntity(pl, dt, false); pl.vx = vx; pl.vy = vy;
    }
    if (Math.random() < dt * 10) parts.push({ x: pl.x + Math.random() * pl.w, y: pl.y + Math.random() * pl.h, vx: rnd(-8, 8), vy: rnd(-20, -6), g: 0, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#9cc8ff' : '#e6eef8', size: 1, glow: true });
  }
  // o espinheiro profanado arranha
  elEspinhoCD -= dt;
  if (elEspinhoCD <= 0 && pl.invuln <= 0 && touchingTile(pl, EL_ESPINHO)) {
    elEspinhoCD = 0.8;
    hurtPlayer(Math.max(1, Math.round(pl.maxHp * 0.04)), pl.x + pl.w / 2 - pl.facing * 50, null, true);   // vem de baixo: o escudo não segura
    if (typeof fungLentidao === 'function') fungLentidao(0.3, 0.6);
    burst(pl.x + pl.w / 2, pl.y + pl.h - 2, 5, '#d02a3a', 40, -20, 0.3, 1, false);
  }
}; }

/* ---------- silenciado: nada de magia nem de poção (os feitiços chamam estas funções pelo nome) ---------- */
addEventListener('DOMContentLoaded', () => {
  const mute = (name, ret) => {
    const f = window[name]; if (typeof f !== 'function') return;
    window[name] = function () {
      if (elSilenced()) { if (!pl.elSilMsg || pl.elSilMsg < gameTime) { pl.elSilMsg = gameTime + 0.8; floatText(pl.x + pl.w / 2, pl.y - 8, 'Silenciado', '#c8dcf4', 0.8); sfx.bad(); } return ret; }
      return f.apply(this, arguments);
    };
  };
  for (const n of ['castArc', 'castNevasca', 'castFogo']) mute(n, undefined);
  for (const n of ['drinkPotion', 'alqDrink']) mute(n, false);
});

/* ---------- o desenho: raízes nos pés, o selo de prata, os fios de luar do feitiço ---------- */
HOOK.drawTop.push((cx, cy) => {
  if (!ELFOS || !pl || pl.dead) return;
  const px = Math.round(pl.x + pl.w / 2 - cx), py = Math.round(pl.y - cy), fy = Math.round(pl.y + pl.h - cy);
  if ((pl.elRaizT || 0) > 0) {
    // quatro raízes subindo pelas pernas, a ponta prateada
    for (let k = 0; k < 4; k++) {
      const x = px - 5 + k * 3, h = 4 + ((k * 7) % 3);
      lc.fillStyle = '#3a2a1e'; lc.fillRect(x, fy - h, 2, h);
      lc.fillStyle = '#7a96b0'; lc.fillRect(x + (k & 1), fy - h - 1, 1, 1);
    }
    lc.fillStyle = '#5a4430'; lc.fillRect(px - 6, fy - 1, 12, 1);
  }
  if ((pl.elSilT || 0) > 0) {
    // o selo: um anel de prata com a runa, girando de leve sobre a cabeça
    const y = py - 7 + Math.round(Math.sin(gameTime * 3)), a = 0.7 + 0.3 * Math.sin(gameTime * 6);
    lc.globalAlpha = a; lc.fillStyle = '#e6eef8';
    lc.fillRect(px - 3, y - 3, 6, 1); lc.fillRect(px - 3, y + 2, 6, 1); lc.fillRect(px - 4, y - 2, 1, 4); lc.fillRect(px + 3, y - 2, 1, 4);
    lc.fillStyle = '#4a7ad0'; lc.fillRect(px - 1, y - 1, 2, 2); lc.fillRect(px - 2, y, 4, 1);
    lc.globalAlpha = 1;
  }
  if ((pl.elFeitT || 0) > 0) {
    // os fios: pontinhos de luar indo do herói para o ponto da Dama
    const tx = pl.elFeitX - cx, ty = pl.elFeitY - cy, n = 7;
    for (let k = 1; k < n; k++) {
      const f = (k / n + gameTime * 0.6) % 1, x = Math.round(px + (tx - px) * f), y = Math.round(py + 8 + (ty - py - 8) * f + Math.sin(f * 9 + gameTime * 4) * 2);
      lc.globalAlpha = 0.6 * (1 - f); lc.fillStyle = k & 1 ? '#9cc8ff' : '#f8fbff'; lc.fillRect(x, y, 1, 1);
    }
    lc.globalAlpha = 1;
  }
});
