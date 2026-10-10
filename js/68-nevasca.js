'use strict';

/* ================= Nevasca: as regras (dados e ícones em js/67-nevasca-dados.js) =================
   - O feitiço sai do pergaminho de escola de gelo (js/120-121).
   - Saves antigos: na mochila, botão direito identifica; botão direito de novo aprende e o feitiço vai para a barra.
   - Com o feitiço na mão, clique esquerdo (ou segurar) abre uma nuvem de neve sobre o ponto do mouse (até NEV.reach do
     herói). A nuvem fica logo abaixo do teto, no máximo NEV.h acima da mira, e por NEV.dur segundos despeja fragmentos
     de gelo numa faixa de 2*NEV.r de largura, inclinados pelo vento. Cada fragmento para no primeiro bloco ou no primeiro
     inimigo que encontra; no inimigo faz NEV.min–NEV.max de dano por hitEnemy (crítico e modo deus valem), sem empurrão
     nem atordoamento.
   - Resfriar: cada fragmento deixa o inimigo lento por NEV.chill s (IA, animação e movimento andam em câmera lenta).
     NEV.freezeAt fragmentos seguidos congelam o inimigo num bloco de gelo por NEV.freeze s: não anda, não ataca, não
     machuca de encostar, voadores caem. Ao descongelar ele não pode congelar de novo por NEV.imm s. Chefes só resfriam,
     e menos (NEV.slowBoss).
   - Embrulha newWorld, quickAction, tipHTML, rollPlayerDmg, moveEntity, updateEnemies, drawEnemy, killEnemy e cada AI[tipo];
     usa HOOK update/drawWorld/drawGlow/drawTop. Nada disso vai para o save. */

let nevCD = 0, nevRoll = false, nevClinkT = 0;
const nevs = [], nevShards = [];

{ const _roll = rollPlayerDmg; rollPlayerDmg = function () { return nevRoll ? NEV.min + Math.random() * (NEV.max - NEV.min + 1) - 0.01 : _roll(); }; }

sfx.nevCast = function () {
  noise(NEV.dur + 0.3, 0.075, 520, 'bandpass', 0, 0.6);           // o vento da nevasca
  noise(NEV.dur, 0.035, 2600, 'highpass', 0.25, 0.4);              // o chiado da neve
  tone(1760, 0.3, 'triangle', 0.035, -700); tone(2350, 0.22, 'triangle', 0.025, -900, 0.06);
};
sfx.nevClink = function () { tone(2300 + Math.random() * 1500, 0.045, 'triangle', 0.016, -300); };
sfx.nevFreeze = function () { noise(0.22, 0.12, 3400, 'highpass', 0, 0.8); tone(1900, 0.14, 'triangle', 0.04, -1100); tone(620, 0.1, 'square', 0.02, -200, 0.03); };
sfx.nevShatter = function () { noise(0.2, 0.14, 2200, 'bandpass', 0, 1.4); [2900, 3700, 2500].forEach((f, i) => tone(f, 0.05, 'triangle', 0.02, -400, i * 0.035)); };

/* ---- jogo novo: sem neve no ar ---- */
{
  const _newWorld = newWorld;
  newWorld = function (sd, sv) {
    nevs.length = 0; nevShards.length = 0; nevCD = 0;
    _newWorld(sd, sv);
  };
}

/* ---- identificar, aprender e a dica (por fora dos do Arco, que tratam qualquer pergaminho como dele) ---- */
function nevLearn(i) {
  if (inv.some(q => q && q.id === 'feitico_nevasca')) { toast('Você já conhece esse feitiço'); bad(null); return; }
  inv[i] = null;
  let k = i; if (k >= HB_BAG) { const f = inv.findIndex((q, j) => !q && j < HB_BAG); if (f >= 0) k = f; }
  inv[k] = mkItem('feitico_nevasca');
  sfx.learn(); toast('Feitiço aprendido: Nevasca', 'gold', RAR_COL[2]);
  burst(pl.x + pl.w / 2, pl.y + 8, 22, '#bfe8ff', 70, -40, 0.7, 1, true);
  changed(false); hudCache.hb = null;
}
{
  const _quickAction = quickAction;
  quickAction = function (r) {
    const s = r && r.k === 'inv' ? inv[r.i] : null;
    if (!s || !isNevItem(s.id) || ITEMS[s.id].spell || (typeof stashOpen === 'function' && stashOpen()) || shopNpc || forgeNpc) return _quickAction(r);
    hideTip();
    if (s.id === 'perg_selado_n') { inv[r.i] = mkItem('perg_nevasca'); sfx.rare(); toast('Identificado: Pergaminho da Nevasca', 'gold', RAR_COL[2]); changed(false); hudCache.hb = null; return; }
    nevLearn(r.i);
  };
  const _tipHTML = tipHTML;
  const fmt = v => String(v).replace('.', ',');
  tipHTML = function (s, r, act2) {
    if (!isNevItem(s.id)) return _tipHTML(s, r, act2);
    const it = ITEMS[s.id], rar = itemRar(s), act = act2 != null ? act2 : '';
    const type = it.spell ? 'Feitiço · ' + RAR[rar] : it.scroll === 1 ? 'Pergaminho · Não identificado' : 'Pergaminho · ' + RAR[rar];
    const lines = it.scroll === 1 ? '' : `<ul><li><span>Mana</span><b style="color:#7fb8ff">${NEV.cost}</b></li><li><span>Dano por fragmento</span><b>${NEV.min} – ${NEV.max}</b></li><li><span>Duração</span><b>${fmt(NEV.dur)} s</b></li><li><span>Recarga</span><b>${fmt(NEV.cd)} s</b></li></ul>`;
    return `<span class="tn" style="color:${RAR_COL[rar]}">${it.name}</span><small>${type}</small>${lines}${it.desc ? `<p>${it.desc}</p>` : ''}${act ? `<em>${act}</em>` : ''}`;
  };
}

/* ---- lançar: a nuvem sobre a mira ---- */
const nevSolidPx = (x, y) => solidAt(Math.floor(x / T), Math.floor(y / T));
function castNevasca() {
  let [mx, my] = mouseWorld();
  const pcx = pl.x + pl.w / 2, pcy = pl.y + 9;
  if (Math.abs(mx - pcx) > 2) pl.facing = mx > pcx ? 1 : -1;
  const d = Math.hypot(mx - pcx, my - pcy);
  if (d > NEV.reach) { mx = pcx + (mx - pcx) * NEV.reach / d; my = pcy + (my - pcy) * NEV.reach / d; }
  // mira dentro da rocha: sobe até achar ar
  for (let k = 0; k < 4 * T && nevSolidPx(mx, my); k += 2) my -= 2;
  // a nuvem: sobe da mira até o teto (ou até NEV.h) e fica um pouco abaixo dele
  let top = my;
  while (my - top < NEV.h && !nevSolidPx(mx, top - 3)) top -= 3;
  const cy = Math.min(my - 6, top + 6);
  nevs.push({ x: mx, y: cy, t: 0, acc: 0, seed: Math.floor(Math.random() * 1e6) });
  pl.mana -= NEV.cost; nevCD = NEV.cd; pl.useT = 0.3; sfx.nevCast();
  burst(pcx + pl.facing * 5, pcy, 10, '#bfe8ff', 60, -20, 0.4, 1, true);
}
function nevSpawnShard(n) {
  for (let tries = 0; tries < 4; tries++) {
    const x = n.x + rnd(-NEV.r, NEV.r) - NEV.wind * 0.12, y = n.y + rnd(1, 7);
    if (nevSolidPx(x, y)) continue;
    const sp = NEV.fall * rnd(0.85, 1.15);
    nevShards.push({ x, y, vx: NEV.wind * rnd(0.8, 1.2), vy: sp, len: Math.random() < 0.35 ? 7 : 5, t: 0 });
    return;
  }
}
function nevShatter(x, y, big) {
  burst(x, y, big ? 6 : 3, '#e8f8ff', 70, 300, 0.35, 1);
  burst(x, y, big ? 4 : 2, '#7cc8ec', 50, 250, 0.3, 1, true);
  if (nevClinkT <= 0) { sfx.nevClink(); nevClinkT = 0.07; }
}

/* ---- frio e gelo nos inimigos ---- */
const nevFrozen = e => (e.nevFrz || 0) > 0;
const nevChilled = e => (e.nevChillT || 0) > 0;
// fração do tempo que o inimigo vive: 1 normal, lento resfriado, 0 congelado
const nevK = e => nevFrozen(e) ? 0 : nevChilled(e) ? (e.boss ? NEV.slowBoss : NEV.slow) : 1;
function nevHit(e) {
  const vx = e.vx, vy = e.vy, st = e.stun, hs = hitstop, sk = shk.m, hit = sfx.hit, hp = e.hp;
  sfx.hit = function () { };
  nevRoll = true;
  try { hitEnemy(e, 0, 1, false); } finally { nevRoll = false; sfx.hit = hit; }
  if (e.dead) return;
  hitstop = hs; shk.m = Math.max(sk, Math.min(shk.m, 0.8));   // sem tranco a cada fragmento
  e.vx = vx; e.vy = vy; e.stun = st;   // a neve fere, mas não empurra nem atordoa
  if (e.hp >= hp) return;               // não pegou (bloqueou, atravessou)
  e.nevChillT = NEV.chill;
  if (nevFrozen(e)) return;
  e.nevN = (e.nevN || 0) + 1;
  if (!e.boss && e.nevN >= NEV.freezeAt && !((e.nevImm || 0) > 0)) {
    e.nevN = 0; e.nevFrz = NEV.freeze; e.nevSeed = Math.floor(Math.random() * 1e6);
    sfx.nevFreeze(); floatText(e.x + e.w / 2, e.y - 10, 'CONGELADO', '#a8dcf4', 0.9);
    burst(e.x + e.w / 2, e.y + e.h / 2, 12, '#e8f8ff', 70, 0, 0.45, 1, true);
  }
}
// a câmera lenta: a IA de cada tipo recebe o tempo encolhido; congelado, ela não roda
for (const k of Object.keys(AI)) {
  const base = AI[k];
  AI[k] = function (e, dt, dx, dy, dist, aggro) {
    const f = nevK(e);
    if (f === 0) return;
    return base.call(this, e, dt * f, dx, dy, dist, aggro);
  };
}
{
  const _move = moveEntity;
  moveEntity = function (e, dt, step) { return _move(e, e !== pl && e.nevChillT > 0 && !nevFrozen(e) ? dt * nevK(e) : dt, step); };
}
{
  const _upd = updateEnemies;
  updateEnemies = function (dt) {
    const t0 = new Map();
    for (const e of enemies) {
      if (e.dead) continue;
      if ((e.nevImm || 0) > 0) e.nevImm -= dt;
      if (nevFrozen(e)) {
        e.nevFrz -= dt;
        e.stun = 0; e.vx = 0; e.atkCD = Math.max(e.atkCD, 0.15); e.charging = false;
        if (ET[e.type] && ET[e.type].fly) e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);   // voador congelado cai
        if (e.nevFrz <= 0) {
          e.nevFrz = 0; e.nevImm = NEV.imm; e.nevChillT = Math.max(e.nevChillT || 0, 1.2);
          sfx.nevShatter(); burst(e.x + e.w / 2, e.y + e.h / 2, 14, '#bfe8ff', 90, 300, 0.5, 1); burst(e.x + e.w / 2, e.y + e.h / 2, 6, '#ffffff', 60, 0, 0.3, 1, true);
        }
      } else if (nevChilled(e)) {
        e.nevChillT -= dt;
        if (e.nevChillT <= 0) e.nevN = 0;
        if (Math.random() < dt * 5) parts.push({ x: e.x + Math.random() * e.w, y: e.y + Math.random() * e.h, vx: rnd(-6, 6), vy: rnd(4, 14), g: 0, life: 0.5, max: 0.5, col: Math.random() < 0.6 ? '#e8f8ff' : '#7cc8ec', size: 1, glow: true });
      }
      const f = nevK(e); if (f < 1) t0.set(e, [e.t, f]);
    }
    _upd(dt);
    for (const [e, [t, f]] of t0) e.t = t + (e.t - t) * f;   // a animação também anda devagar (ou para)
  };
}
{
  const _kill = killEnemy;
  killEnemy = function (e) {
    if (e && nevFrozen(e)) { burst(e.x + e.w / 2, e.y + e.h / 2, 18, '#bfe8ff', 120, 320, 0.6, 1); sfx.nevShatter(); }
    return _kill.apply(this, arguments);
  };
}

/* ---- o tempo da nevasca e dos fragmentos ---- */
HOOK.update.push(dt => {
  nevCD -= dt; nevClinkT -= dt;
  for (let i = nevs.length - 1; i >= 0; i--) {
    const n = nevs[i]; n.t += dt;
    if (n.t >= NEV.dur + 0.6) { nevs.splice(i, 1); continue; }
    if (n.t > 0.2 && n.t < NEV.dur) { n.acc += dt * NEV.rate; while (n.acc >= 1) { n.acc -= 1; nevSpawnShard(n); } }
    // flocos soltos que caem devagar da nuvem
    if (n.t < NEV.dur + 0.2 && Math.random() < dt * 22) parts.push({ x: n.x + rnd(-NEV.r - 4, NEV.r + 4), y: n.y + rnd(0, 4), vx: NEV.wind * 0.4 + rnd(-8, 8), vy: rnd(18, 34), g: 0, life: 1.1, max: 1.1, col: Math.random() < 0.7 ? '#f2fbff' : '#a8dcf4', size: 1 });
  }
  for (let i = nevShards.length - 1; i >= 0; i--) {
    const s = nevShards[i]; s.t += dt;
    let gone = false;
    const steps = Math.max(1, Math.ceil(Math.hypot(s.vx, s.vy) * dt / 3));
    for (let k = 0; k < steps && !gone; k++) {
      s.x += s.vx * dt / steps; s.y += s.vy * dt / steps;
      if (nevSolidPx(s.x, s.y)) { nevShatter(s.x, Math.floor(s.y / T) * T - 1, false); gone = true; break; }
      for (const e of enemies) {
        if (e.dead || (e.boss && e.state === 'intro')) continue;
        if (s.x >= e.x - 1 && s.x <= e.x + e.w + 1 && s.y >= e.y && s.y <= e.y + e.h) { nevHit(e); nevShatter(s.x, s.y, true); gone = true; break; }
      }
    }
    if (gone || s.t > 2) nevShards.splice(i, 1);
  }
  // cristais na mão enquanto o feitiço está pronto
  const h = heldBag(); if (!h || h.s.id !== 'feitico_nevasca' || pl.dead || pl.bat) return;
  if (Math.random() < dt * 6) parts.push({ x: pl.x + pl.w / 2 + pl.facing * rnd(4, 7), y: pl.y + rnd(8, 12), vx: rnd(-8, 8), vy: rnd(-18, -4), g: 0, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#f2fbff' : '#7cc8ec', size: 1, glow: true });
  if (!mouse.l || nevCD > 0 || pl.atkT >= 0 || pl.shieldK >= 0.35 || pl.stunT > 0) return;
  if (pl.mana < NEV.cost) { if (mouse.lPressed) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem mana', '#7fb8ff', 0.8); sfx.bad(); } nevCD = 0.25; return; }
  castNevasca();
});

/* ---- desenho ---- */
// a nuvem: pintada pixel a pixel numa rampa de azul-ardósia, com grão; duas versões que se alternam devagar
let nevCloudS = null, nevGlowS = null, nevGlowC = null;
function nevCloud(seed) {
  const W = NEV.r * 2 + 22, H = 16, c = mk(W, H), x = c.getContext('2d'), R = heroRamp('#5c7c9c');
  const puffs = [];
  for (let k = 0; k < 9; k++) puffs.push([6 + (W - 12) * (k + hash2(k, 1, seed) * 0.6) / 9, 6 + hash2(k, 2, seed) * 3, 4 + hash2(k, 3, seed) * 3.5]);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let dmax = -1;
    for (const [px, py, pr] of puffs) dmax = Math.max(dmax, 1 - Math.hypot(i - px, (j - py) * 1.25) / pr);
    const g = hash2(i, j, seed);
    if (dmax < 0 || (dmax < 0.18 && g < 0.5)) continue;   // borda roída
    let v = j < 5 ? 4 : j < 8 ? 3 : j < 11 ? 2 : 1;        // em cima clara, embaixo carregada
    if (dmax < 0.25) v -= 1;
    if (g < 0.15) v -= 1; else if (g > 0.88) v += 1;
    x.fillStyle = R[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
HOOK.drawWorld.push((cx, cy) => {
  // o bloco de gelo em volta de quem congelou
  for (const e of enemies) {
    if (e.dead || !nevFrozen(e)) continue;
    const x0 = Math.round(e.x) - 2 - cx, y0 = Math.round(e.y) - 3 - cy, w = Math.round(e.w) + 4, h = Math.round(e.h) + 4, sd = e.nevSeed || 1;
    const fade = e.nevFrz < 0.5 && Math.floor(e.nevFrz * 16) % 2 === 0 ? 0.6 : 1;   // pisca antes de quebrar
    lc.globalAlpha = 0.34 * fade; lc.fillStyle = '#9fd4f0'; lc.fillRect(x0, y0, w, h);
    lc.globalAlpha = 0.85 * fade;
    lc.fillStyle = '#e8f8ff'; lc.fillRect(x0, y0, w, 1); lc.fillRect(x0, y0, 1, h);                 // arestas iluminadas
    lc.fillStyle = '#4a86b4'; lc.fillRect(x0, y0 + h - 1, w, 1); lc.fillRect(x0 + w - 1, y0, 1, h);  // arestas na sombra
    // pontas de cristal em cima
    lc.fillStyle = '#c8ecfc';
    for (let i = 1; i < w - 1; i += 3) { const k = hash2(i, 5, sd); if (k < 0.45) continue; const ph = k > 0.8 ? 3 : 2; lc.fillRect(x0 + i, y0 - ph, 1, ph); }
    // dois brilhos em diagonal
    lc.fillStyle = '#ffffff'; lc.globalAlpha = 0.7 * fade;
    for (const [ox, oy, n] of [[2, 2, Math.min(4, h - 4)], [Math.max(3, w - 5), Math.floor(h / 2), 2]]) for (let k = 0; k < n; k++) lc.fillRect(x0 + ox + k, y0 + oy + k, 1, 1);
    lc.globalAlpha = 1;
  }
});
HOOK.drawGlow.push((cx, cy) => {
  if (!nevs.length && !nevShards.length) return;
  if (!nevGlowS) { nevGlowS = glow(5, '#7cc8ec'); nevGlowC = glow(NEV.r + 10, '#4a8ac8'); }
  lc.globalCompositeOperation = 'lighter';
  for (const n of nevs) { const a = Math.min(1, n.t / 0.25, (NEV.dur + 0.6 - n.t) / 0.6); lc.globalAlpha = 0.22 * a; lc.drawImage(nevGlowC, Math.round(n.x) - cx - NEV.r - 10, Math.round(n.y) + 6 - cy - NEV.r - 10); }
  lc.globalAlpha = 0.35; for (const s of nevShards) lc.drawImage(nevGlowS, Math.round(s.x) - cx - 5, Math.round(s.y) - cy - 5);
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (!nevs.length && !nevShards.length) return;
  if (!nevCloudS) nevCloudS = [nevCloud(11), nevCloud(29)];
  // os fragmentos: um risco inclinado, rabo azul, corpo gelo, ponta branca
  for (const s of nevShards) {
    const ux = s.vx / Math.hypot(s.vx, s.vy), uy = s.vy / Math.hypot(s.vx, s.vy);
    for (let k = 0; k < s.len; k++) {
      const px = Math.round(s.x - ux * k) - cx, py = Math.round(s.y - uy * k) - cy;
      lc.fillStyle = k === 0 ? '#ffffff' : k < 2 ? '#d8f2ff' : k < s.len - 1 ? '#8ccbec' : '#4a86b4';
      lc.globalAlpha = k < s.len - 1 ? 1 : 0.6; lc.fillRect(px, py, 1, 1);
      if (s.len > 5 && k >= 1 && k <= 3) lc.fillRect(px - 1, py, 1, 1);   // os maiores têm um corpo mais grosso
    }
  }
  lc.globalAlpha = 1;
  // a nuvem por cima de tudo, entrando e saindo devagar; as duas versões se revezam e deslizam com o vento
  for (const n of nevs) {
    const a = Math.min(1, n.t / 0.25, (NEV.dur + 0.6 - n.t) / 0.6), W = NEV.r * 2 + 22;
    const sl = Math.sin(n.t * 1.7) * 2, x0 = Math.round(n.x - W / 2) - cx, y0 = Math.round(n.y - 8) - cy, f = Math.floor(n.t * 3) % 2;
    lc.globalAlpha = 0.9 * a; lc.drawImage(nevCloudS[f], x0 + Math.round(sl), y0);
    lc.globalAlpha = 0.45 * a; lc.drawImage(nevCloudS[1 - f], x0 - Math.round(sl) + 2, y0 - 2);
  }
  lc.globalAlpha = 1;
});
// resfriado: o inimigo desenhado num tom gelado; congelado, mais pálido ainda (o bloco vem depois, em drawWorld)
{
  const _draw = drawEnemy, canF = 'filter' in lc;
  drawEnemy = function (e, cx, cy) {
    if (!canF || !(nevFrozen(e) || nevChilled(e))) return _draw(e, cx, cy);
    const prev = lc.filter;
    lc.filter = nevFrozen(e) ? 'grayscale(0.7) sepia(0.4) hue-rotate(160deg) saturate(2.2) brightness(1.25)' : 'grayscale(0.4) sepia(0.35) hue-rotate(165deg) saturate(1.8) brightness(1.08)';
    try { _draw(e, cx, cy); } finally { lc.filter = prev; }
  };
}
