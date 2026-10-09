'use strict';

/* ================= Forma de Morcego: as regras (dados, ícones e desenho em js/65-morcego-dados.js) =================
   - Jogo novo: um segundo pergaminho lacrado vem na barra, ao lado do do Arco Voltaico.
   - Na mochila, botão direito identifica; botão direito de novo aprende e o feitiço vai para a barra.
   - Com o feitiço na mão, clique esquerdo: o herói some numa nuvem de fumaça e vira um morcego por BAT.dur segundos.
     WASD ou setas (e Espaço para subir) voam em qualquer direção, sem gravidade, batendo as asas. O morcego é pequeno
     (BAT.w x BAT.h) e passa por buracos de um bloco; não ataca, não minera, não usa escudo. Clicar de novo com o
     feitiço na mão volta antes da hora. No último segundo ele pisca.
   - Para voltar, o herói precisa caber onde o morcego está: se não couber (num túnel de um bloco), o morcego
     continua até achar espaço. Morrer volta na hora.
   - updatePlayer é embrulhado: enquanto é morcego, o voo roda no lugar do andar; drawPlayer desenha o morcego. */

const batSt = { on: false, t: 0, cd: 0, flap: 0, frame: 1, lastF: 1, hold: 0 };
pl.bat = false;   // outros arquivos (o Arco Voltaico) leem isto

sfx.batPoof = function () { noise(0.35, 0.2, 900, 'lowpass', 0, 0.8); noise(0.18, 0.12, 2400, 'bandpass', 0.02, 1.4); tone(2900, 0.05, 'square', 0.025, 900, 0.12); tone(3300, 0.04, 'square', 0.02, 700, 0.19); };
sfx.batBack = function () { noise(0.3, 0.18, 700, 'lowpass', 0, 0.8); tone(180, 0.18, 'triangle', 0.06, -60, 0.03); };
sfx.batFlap = function () { noise(0.07, 0.045, 520, 'bandpass', 0, 1.6); };

/* ---- jogo novo: o segundo pergaminho lacrado na barra ---- */
{
  const _newWorld = newWorld;
  newWorld = function (sd, sv) {
    batEnd(true);
    _newWorld(sd, sv);
    if (sv && Array.isArray(sv.inv)) return;
    let i = inv.findIndex((q, k) => !q && k < HB_BAG); if (i < 0) i = inv.findIndex(q => !q);
    if (i >= 0) { inv[i] = mkItem('perg_selado_m'); invDirty = true; if (typeof hudCache !== 'undefined') hudCache.hb = null; }
  };
}

/* ---- identificar, aprender e a dica (por fora dos do Arco, que tratam qualquer pergaminho como dele) ---- */
function batLearn(i) {
  if (inv.some(q => q && q.id === 'feitico_morcego')) { toast('Você já conhece esse feitiço'); bad(null); return; }
  inv[i] = null;
  let k = i; if (k >= HB_BAG) { const f = inv.findIndex((q, j) => !q && j < HB_BAG); if (f >= 0) k = f; }
  inv[k] = mkItem('feitico_morcego');
  sfx.learn(); toast('Feitiço aprendido: Forma de Morcego', 'gold', RAR_COL[2]);
  burst(pl.x + pl.w / 2, pl.y + 8, 22, '#c86aa8', 70, -40, 0.7, 1, true);
  changed(false); hudCache.hb = null;
}
{
  const _quickAction = quickAction;
  quickAction = function (r) {
    const s = r && r.k === 'inv' ? inv[r.i] : null;
    if (!s || !isBatItem(s.id) || ITEMS[s.id].spell || (typeof stashOpen === 'function' && stashOpen()) || shopNpc || forgeNpc) return _quickAction(r);
    hideTip();
    if (s.id === 'perg_selado_m') { inv[r.i] = mkItem('perg_morcego'); sfx.rare(); toast('Identificado: Pergaminho da Forma de Morcego', 'gold', RAR_COL[2]); changed(false); hudCache.hb = null; return; }
    batLearn(r.i);
  };
  const _tipHTML = tipHTML;
  const fmt = v => String(v).replace('.', ',');
  tipHTML = function (s, r, act2) {
    if (!isBatItem(s.id)) return _tipHTML(s, r, act2);
    const it = ITEMS[s.id], rar = itemRar(s), act = act2 != null ? act2 : '';
    const type = it.spell ? 'Feitiço · ' + RAR[rar] : it.scroll === 1 ? 'Pergaminho · Não identificado' : 'Pergaminho · ' + RAR[rar];
    const lines = it.scroll === 1 ? '' : `<ul><li><span>Mana</span><b style="color:#7fb8ff">${BAT.cost}</b></li><li><span>Duração</span><b>${fmt(BAT.dur)} s</b></li><li><span>Recarga</span><b>${fmt(BAT.cd)} s</b></li></ul>`;
    return `<span class="tn" style="color:${RAR_COL[rar]}">${it.name}</span><small>${type}</small>${lines}${it.desc ? `<p>${it.desc}</p>` : ''}${act ? `<em>${act}</em>` : ''}`;
  };
}

/* ---- virar e desvirar ---- */
const rectFree = (x, y, w, h) => !rectSolid(x, y, w, h);
function batPoof(x, y) {
  burst(x, y, 16, '#2a1c30', 45, -30, 0.7, 2);              // fumaça escura subindo
  burst(x, y, 10, '#5a3a66', 60, -20, 0.5, 1);
  burst(x, y, 12, '#c86aa8', 80, 0, 0.4, 1, true);           // faíscas do feitiço
  shake(1.2);
}
function batStart() {
  const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2;
  pl.mana -= BAT.cost; pl.useT = 0;
  batSt.on = true; batSt.t = BAT.dur; batSt.flap = 0; batSt.hold = 0; pl.bat = true;
  pl.w = BAT.w; pl.h = BAT.h; pl.x = cx - BAT.w / 2; pl.y = cy - BAT.h / 2;
  // a caixa do morcego cabe sempre dentro da do herói, mas por garantia sobe até achar ar
  for (let k = 0; k < T && !rectFree(pl.x, pl.y, pl.w, pl.h); k++) pl.y -= 1;
  pl.vy = Math.min(pl.vy, -40); pl.onGround = false; pl.climb = false;
  pl.atkT = -1; pl.trail.length = 0; pl.mining = false; pl.shieldOn = false; pl.shieldK = 0; pl.jumpBuf = 0; pl.atkBuf = 0;
  pl.target = null; pl.nearChest = null; pl.nearNpc = null;
  batPoof(cx, cy); sfx.batPoof();
}
// a caixa do herói, com o mesmo centro do morcego, onde couber (primeiro no lugar, depois um pouco acima ou abaixo)
function batHeroSpot() {
  const W = 8, H = 21, cx = pl.x + pl.w / 2, by = pl.y + pl.h;   // os pés do herói onde fica a barriga do morcego
  const x0 = cx - W / 2;
  for (let k = 0; k <= T + 4; k++) for (const s of k ? [-1, 1] : [1]) for (const dx of [0, -2, 2, -4, 4]) {
    const y = by - H + s * k; if (rectFree(x0 + dx, y, W, H)) return [x0 + dx, y];
  }
  return null;
}
function batEnd(force) {
  if (!batSt.on) return true;
  const spot = batHeroSpot();
  if (!spot && !force) return false;
  const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2;
  pl.w = 8; pl.h = 21;
  if (spot) { pl.x = spot[0]; pl.y = spot[1]; } else { pl.x = cx - 4; pl.y = cy - 10.5; }
  batSt.on = false; batSt.cd = BAT.cd; pl.bat = false;
  if (!pl.dead) { pl.vy = Math.min(pl.vy, 0) - 60; pl.onGround = false; batPoof(cx, cy); sfx.batBack(); }
  return true;
}

/* ---- o voo: no lugar do andar enquanto é morcego ---- */
function updateBat(dt) {
  const left = keys.KeyA || keys.ArrowLeft, right = keys.KeyD || keys.ArrowRight;
  const up = keys.KeyW || keys.ArrowUp || keys.Space, down = keys.KeyS || keys.ArrowDown;
  pl.potCD -= dt; tickPotion(dt); tickVigor(dt);
  if (pressed.KeyR) drinkPotion();
  pl.stunT -= dt; pl.useCD -= dt; pl.useT -= dt;
  const dx = (right ? 1 : 0) - (left ? 1 : 0), dy = (down ? 1 : 0) - (up ? 1 : 0);
  if (dx) pl.facing = dx;
  const n = dx && dy ? Math.SQRT1_2 : 1, inLava = lavaIn(pl.x, pl.y, pl.w, pl.h), max = BAT.spd * (inLava ? 0.5 : 1);
  if (pl.stunT <= 0) {
    pl.vx = approach(pl.vx, dx * max * n, (dx ? BAT.acc : BAT.acc * 0.5) * dt);
    // parado no ar ele desce bem devagar entre uma batida e outra; cada batida dá um tranco para cima
    pl.vy = approach(pl.vy, dy ? dy * max * n : 14, (dy ? BAT.acc : BAT.acc * 0.4) * dt);
  } else { pl.vx = approach(pl.vx, 0, 300 * dt); pl.vy = approach(pl.vy, 30, 300 * dt); }
  // as asas: mais rápidas subindo, mais lentas descendo
  const rate = up ? 15 : down ? 8 : 11;
  batSt.flap += dt * rate;
  const seq = [0, 1, 2, 3, 2, 1], f = seq[Math.floor(batSt.flap) % 6];
  if (f === 3 && batSt.lastF !== 3) { sfx.batFlap(); if (!dy && pl.stunT <= 0) pl.vy -= 26; }
  batSt.lastF = f; batSt.frame = f;
  moveEntity(pl, dt, false);

  if (inLava) { pl.lavaT -= dt; if (pl.lavaT <= 0) { pl.lavaT = 0.5; rawDamage(Math.max(2, Math.round(pl.maxHp * 0.1)), Math.random() < 0.5 ? -1 : 1); floatText(pl.x + pl.w / 2, pl.y - 10, 'QUEIMANDO', '#ff9a3c', 0.8); } } else pl.lavaT = 0;

  pl.invuln -= dt; pl.hurtFlash -= dt;
  if (pl.mana < pl.maxMana) pl.mana = Math.min(pl.maxMana, pl.mana + dt * 2.2);
  if (pl.regenB > 0 && gameTime - pl.lastHurt > 4 && pl.hp < pl.maxHp) { pl.regen += dt * pl.regenB; if (pl.regen >= 1) { const k = Math.floor(pl.regen); pl.hp = Math.min(pl.maxHp, pl.hp + k); pl.regen -= k; } }
  pl.target = null; pl.nearChest = null; pl.nearNpc = null;

  // o tempo: no fim volta a ser gente, se couber; clicar de novo com o feitiço na mão volta antes
  batSt.t -= dt;
  const h = heldBag(), again = mouse.lPressed && h && h.s.id === 'feitico_morcego' && BAT.dur - batSt.t > 0.25;
  if (batSt.t <= 0 || again) {
    if (!batEnd(false)) { batSt.t = Math.max(batSt.t, 0); batSt.hold += dt; if (batSt.hold > 0.6 && Math.random() < dt * 8) burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 1, '#c86aa8', 30, 0, 0.3, 1, true); }
  }
  // fiapos de fumaça escura ficando para trás
  if (batSt.on && Math.random() < dt * 14) parts.push({ x: pl.x + pl.w / 2 + rnd(-3, 3), y: pl.y + pl.h / 2 + rnd(-1, 3), vx: -pl.vx * 0.1 + rnd(-6, 6), vy: rnd(-12, -2), g: 0, life: 0.45, max: 0.45, col: Math.random() < 0.6 ? '#2a1c30' : '#4a2e52', size: 1 });
}
{
  const _updatePlayer = updatePlayer;
  updatePlayer = function (dt) {
    if (batSt.on && pl.dead) batEnd(true);
    batSt.cd -= dt;
    if (batSt.on) return updateBat(dt);
    _updatePlayer(dt);
    // lançar: o feitiço na mão, clique esquerdo
    const h = heldBag();
    if (!h || h.s.id !== 'feitico_morcego' || pl.dead || !mouse.lPressed) return;
    if (batSt.cd > 0 || pl.atkT >= 0 || pl.shieldK >= 0.35 || pl.stunT > 0) return;
    if (pl.mana < BAT.cost) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem mana', '#7fb8ff', 0.8); sfx.bad(); return; }
    batStart();
  };
}
// faíscas violeta na mão enquanto o feitiço está pronto
HOOK.update.push(dt => {
  const h = heldBag(); if (!h || h.s.id !== 'feitico_morcego' || pl.dead || batSt.on) return;
  if (Math.random() < dt * 5) parts.push({ x: pl.x + pl.w / 2 + pl.facing * rnd(4, 7), y: pl.y + rnd(8, 12), vx: rnd(-8, 8), vy: rnd(-22, -5), g: 0, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#e8a8d8' : '#8a4a9a', size: 1, glow: true });
});

/* ---- desenho ---- */
{
  const _drawPlayer = drawPlayer;
  drawPlayer = function (cx, cy) {
    if (!batSt.on) return _drawPlayer(cx, cy);
    if (pl.dead) return;
    if (pl.invuln > 0 && pl.hurtFlash <= 0 && Math.floor(pl.invuln * 16) % 2 === 0) return;
    if (batSt.t < 1 && Math.floor(batSt.t * 14) % 2 === 0) return;   // no último segundo ele pisca
    const S = batSprites()[batSt.frame], img = pl.hurtFlash > 0 ? (pl.facing > 0 ? S.wr : S.wl) : (pl.facing > 0 ? S.r : S.l);
    const bob = batSt.frame === 0 ? 1 : batSt.frame === 3 ? -1 : 0;   // o corpo sobe na batida para baixo
    lc.drawImage(img, Math.round(pl.x + pl.w / 2 - BAT_CX) - 1 - cx, Math.round(pl.y + pl.h / 2 - BAT_CY) - 1 + bob - cy);
  };
}
let batGlowE = null;
HOOK.drawGlow.push((cx, cy) => {
  if (!batSt.on || pl.dead) return;
  if (!batGlowE) batGlowE = glow(5, '#ffb03a');
  const ex = Math.round(pl.x + pl.w / 2 + pl.facing * 0.4), ey = Math.round(pl.y + pl.h / 2 - 4 + (batSt.frame === 0 ? 1 : batSt.frame === 3 ? -1 : 0));
  lc.globalCompositeOperation = 'lighter'; lc.globalAlpha = 0.55;
  lc.drawImage(batGlowE, ex - 5 - cx, ey - 5 - cy);
  lc.globalAlpha = 1;
});
