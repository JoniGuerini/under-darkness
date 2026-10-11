'use strict';

/* ================= a Nave Caída: os estados do herói, as Salas sem Peso e o elevador de feixe =================
   Carrega no fim da cadeia da camada (depois do 246). Os Visitantes chamam os ajudantes do 240; aqui eles correm:
   - hipnose (nvHipnotizar, o hipnotizador e o Olho-Cometa): A anda para a direita e D para a esquerda; um anel
     arco-íris gira em volta da cabeça. Só o tempo solta;
   - abdução (nvAbduzir, o disco abdutor): enquanto o disco renova, o herói sobe na velocidade do feixe e é puxado de
     leve para o meio dele; o disco morreu ou o feixe acabou, ele cai normalmente;
   - gosma (nvGrudar, a gosma viva; e a Poça de Gosma no chão): 40% mais lento (a lentidão das Minas Fúngicas), os pés
     verdes;
   - as Salas sem Peso: a gravidade cai para 35% e a queda é mais lenta, o pulo vai longe;
   - o feixe do elevador: escala como a corrente, mas W sobe mais rápido (o feixe empurra) e S desce devagar.
   A poção de vida solta a gosma, nunca a hipnose (a ficha, seção 6); a morte limpa tudo. */

const nvNaPoca = () => { if (!pl) return false; const y = Math.floor((pl.y + pl.h - 1) / T); for (const x of [Math.floor((pl.x + 1) / T), Math.floor((pl.x + pl.w - 1) / T)]) if (tileAt(x, y) === NV_POCA) return true; return false; };
const nvSemPesoAqui = e => inNvSemPeso(wrapX(Math.floor((e.x + e.w / 2) / T)), Math.floor((e.y + e.h / 2) / T));

// a escada de serviço, o cabo e o feixe escalam como a corrente (o 241 embrulha touchingTile)

{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!NAVE || !pl || pl.dead) { if (pl && pl.dead) { pl.nvHipT = 0; pl.nvAbdT = 0; pl.nvAbdSrc = null; pl.nvGosmaT = 0; } return _up(dt); }
  // a hipnose troca os lados antes do herói ler as teclas, e destroca depois
  const hip = (pl.nvHipT || 0) > 0, sw = (a, b) => { const k = keys[a]; keys[a] = keys[b]; keys[b] = k; };
  if (hip) { sw('KeyA', 'KeyD'); sw('ArrowLeft', 'ArrowRight'); }
  try { _up(dt); } finally { if (hip) { sw('KeyA', 'KeyD'); sw('ArrowLeft', 'ArrowRight'); } }
  if (pl.dead) return;
  if (hip) pl.nvHipT = Math.max(0, pl.nvHipT - dt);
  // a gosma no corpo ou a poça no pé
  if ((pl.nvGosmaT || 0) > 0) { pl.nvGosmaT -= dt; if (typeof fungLentidao === 'function') fungLentidao(0.4, 0.12); }
  if (nvNaPoca() && typeof fungLentidao === 'function') fungLentidao(0.4, 0.15);
  // o feixe do elevador: W empurra mais, S desce devagar
  if (pl.climb && touchingTile(pl, NV_FEIXE) && !touchingTile(pl, NV_ESCADA)) {
    const up = keys.KeyW || keys.ArrowUp, dn = keys.KeyS || keys.ArrowDown, vx = pl.vx;
    if (up || dn) { pl.vx = 0; pl.vy = up ? -70 : -50; moveEntity(pl, dt, false); pl.vx = vx; pl.vy = up ? -78 : 96; }
    if (Math.random() < dt * 14) parts.push({ x: pl.x + Math.random() * pl.w, y: pl.y + pl.h, vx: rnd(-6, 6), vy: rnd(-60, -30), g: 0, life: 0.5, max: 0.5, col: NV_ARCO[(Math.random() * 6) | 0], size: 1 });
  }
  // a abdução: o disco renova nvAbdT enquanto o herói estiver no feixe dele
  if ((pl.nvAbdT || 0) > 0) {
    const s = pl.nvAbdSrc;
    if (s && s.dead) { pl.nvAbdT = 0; pl.nvAbdSrc = null; }
    else {
      pl.nvAbdT -= dt; pl.climb = false;
      pl.vy = Math.min(pl.vy, -(pl.nvAbdVy || 140) * 0.9);
      if (s) { const d = wdx(Math.round((s.x + s.w / 2 - pl.x - pl.w / 2) / T)) * T; pl.vx = approach(pl.vx, clamp(d * 3, -60, 60), 300 * dt); }
      if (Math.random() < dt * 10) parts.push({ x: pl.x + Math.random() * pl.w, y: pl.y + Math.random() * pl.h, vx: 0, vy: rnd(-40, -20), g: 0, life: 0.4, max: 0.4, col: NV_ARCO[(Math.random() * 6) | 0], size: 1 });
    }
  }
  // as Salas sem Peso: devolve 65% da gravidade deste quadro (o herói não está na escada nem sendo puxado)
  if (!pl.climb && !(pl.nvAbdT > 0) && !pl.onGround && nvSemPesoAqui(pl)) {
    const jumpHeld = keys.KeyW || keys.Space || keys.ArrowUp;
    let g = GRAV; if (pl.vy < 0 && !jumpHeld) g *= 2.2; if (keys.KeyS || keys.ArrowDown) g *= 1.35;
    pl.vy = Math.max(-420, pl.vy - g * 0.65 * dt);
    if (pl.vy > MAXFALL * 0.4) pl.vy = MAXFALL * 0.4;
  }
}; }

/* ---------- os bichos e os itens soltos nas Salas sem Peso também flutuam ---------- */
HOOK.update.push(dt => {
  if (!NAVE || !pl || state !== 'play' || !nvSemPeso.length) return;
  const pty = Math.floor((pl.y + pl.h / 2) / T); if (naveBand(pty) !== 1) return;
  for (const e of enemies) if (!e.dead && !(ET[e.type] && ET[e.type].fly) && !e.boss && !e.onGround && nvSemPesoAqui(e)) e.vy = Math.min(e.vy - GRAV * 0.65 * dt, MAXFALL * 0.4);
});

/* ---------- o desenho: o anel arco-íris da hipnose, a gosma nos pés ---------- */
HOOK.drawTop.push((cx, cy) => {
  if (!NAVE || !pl || pl.dead) return;
  const px = Math.round(pl.x + pl.w / 2 - cx), py = Math.round(pl.y - cy);
  if ((pl.nvHipT || 0) > 0) {
    const a0 = gameTime * 5;
    for (let k = 0; k < 6; k++) {
      const a = a0 + k * Math.PI / 3, x = px + Math.round(Math.cos(a) * 7), y = py - 3 + Math.round(Math.sin(a) * 2.5);
      lc.fillStyle = NV_ARCO[k]; lc.fillRect(x - 1, y, 2, 2);
    }
    lc.globalAlpha = 0.5 + 0.3 * Math.sin(gameTime * 9); lc.fillStyle = '#ff3ec8';
    lc.fillRect(px - 3, py + 3, 2, 1); lc.fillRect(px + 1, py + 3, 2, 1); lc.globalAlpha = 1;   // os olhos girando
  }
  if ((pl.nvGosmaT || 0) > 0) {
    const fy = Math.round(pl.y + pl.h - cy);
    lc.fillStyle = '#3e9a1e'; lc.fillRect(px - 5, fy - 3, 10, 3);
    lc.fillStyle = '#7dff3a'; lc.fillRect(px - 4, fy - 3, 3, 1); lc.fillRect(px + 1, fy - 2, 3, 1);
    if (Math.sin(gameTime * 4) > 0.6) { lc.fillStyle = '#c8ff7a'; lc.fillRect(px + 3, fy, 1, 2); }
  }
});

// a poção de vida solta a gosma do corpo (a hipnose não: só o tempo)
{ const _dp = drinkPotion; drinkPotion = function () { const r = _dp(); if (r && pl) pl.nvGosmaT = 0; return r; }; }
