'use strict';

/* ================= Arco Voltaico: as regras (dados e ícones em js/63-arco-dados.js) =================
   - Jogo novo: o pergaminho lacrado já vem na barra.
   - Na mochila, botão direito no pergaminho lacrado identifica; botão direito no identificado aprende: o pergaminho some
     e no lugar dele fica o feitiço, sempre que possível num espaço da barra.
   - Com o feitiço na mão, o clique esquerdo (ou segurar) lança o raio na direção do mouse. Ele procura o inimigo mais
     perto da mira, depois salta para o vizinho mais próximo que ainda não levou, até ARC.jumps vezes, sem atravessar
     parede. O dano passa por hitEnemy, então crítico, modo deus e talentos funcionam como num golpe (mas não como corpo a corpo). */

let arcCD = 0, arcRoll = false;
const arcs = [];

// o dano do raio substitui o da arma só durante o golpe do feitiço
{ const _roll = rollPlayerDmg; rollPlayerDmg = function () { return arcRoll ? ARC.min + Math.random() * (ARC.max - ARC.min + 1) - 0.01 : _roll(); }; }

sfx.arc = function () { noise(0.22, 0.22, 3800, 'highpass', 0, 0.7); noise(0.09, 0.18, 1400, 'bandpass', 0.03, 2); tone(1400, 0.16, 'sawtooth', 0.05, -1100); tone(90, 0.12, 'square', 0.05, -30, 0.02); };
sfx.zap = function () { noise(0.07, 0.14, 2600, 'bandpass', 0, 1.2); tone(900 + Math.random() * 300, 0.05, 'square', 0.03, -500); };
sfx.learn = function () { [659, 988, 1318].forEach((f, i) => tone(f, 0.24, 'triangle', 0.06, 0, i * 0.08)); noise(0.3, 0.08, 4200, 'highpass', 0.1); };

/* ---- jogo novo: o pergaminho lacrado na barra ---- */
{
  const _newWorld = newWorld;
  newWorld = function (sd, sv) {
    _newWorld(sd, sv);
    if (sv && Array.isArray(sv.inv)) return;
    let i = inv.findIndex((q, k) => !q && k < HB_BAG); if (i < 0) i = inv.findIndex(q => !q);
    if (i >= 0) { inv[i] = mkItem('perg_selado'); invDirty = true; if (typeof hudCache !== 'undefined') hudCache.hb = null; }
  };
}

/* ---- identificar e aprender (botão direito na mochila) ---- */
function arcLearn(i) {
  if (inv.some(q => q && ITEMS[q.id].spell)) { toast('Você já conhece esse feitiço'); bad(null); return; }
  inv[i] = null;
  let k = i; if (k >= HB_BAG) { const f = inv.findIndex((q, j) => !q && j < HB_BAG); if (f >= 0) k = f; }
  inv[k] = mkItem('feitico_arco');
  sfx.learn(); toast('Feitiço aprendido: Arco Voltaico', 'gold', RAR_COL[2]);
  burst(pl.x + pl.w / 2, pl.y + 8, 22, '#8fd0ff', 70, -40, 0.7, 1, true);
  changed(false); hudCache.hb = null;
}
{
  const _quickAction = quickAction;
  quickAction = function (r) {
    const s = r && r.k === 'inv' ? inv[r.i] : null, it = s && ITEMS[s.id];
    if (!it || !(it.scroll || it.spell) || (typeof stashOpen === 'function' && stashOpen()) || shopNpc || forgeNpc) return _quickAction(r);
    hideTip();
    if (it.scroll === 1) { inv[r.i] = mkItem('perg_arco'); sfx.rare(); toast('Identificado: Pergaminho do Arco Voltaico', 'gold', RAR_COL[2]); changed(false); hudCache.hb = null; return; }
    if (it.scroll === 2) { arcLearn(r.i); return; }
  };
  const _actFor = actFor;
  actFor = function (s, r) {
    const it = ITEMS[s.id];
    if (!r || r.k !== 'inv' || !(it.scroll || it.spell) || (typeof stashOpen === 'function' && stashOpen()) || shopNpc || forgeNpc) return _actFor(s, r);
    return it.scroll === 1 ? 'Botão direito: identificar · Clique: pegar e mover' : it.scroll === 2 ? 'Botão direito: aprender · Clique: pegar e mover' : 'Clique: pegar e mover';
  };
  // um feitiço aprendido não vai para o lixo
  const _moveItem = moveItem;
  moveItem = function (a, b, el) {
    const s = b && b.k === 'trash' ? itemAt(a) : null;
    if (s && ITEMS[s.id].spell) { toast('Um feitiço aprendido não se joga fora'); return bad(el); }
    return _moveItem(a, b, el);
  };
}

/* ---- a dica: tipo, números do feitiço e a descrição ---- */
{
  const _tipHTML = tipHTML;
  const fmt = v => String(v).replace('.', ',');
  tipHTML = function (s, r, act2) {
    const it = ITEMS[s.id]; if (!(it.scroll || it.spell)) return _tipHTML(s, r, act2);
    const rar = itemRar(s), act = act2 != null ? act2 : '';
    const type = it.spell ? 'Feitiço · ' + RAR[rar] : it.scroll === 1 ? 'Pergaminho · Não identificado' : 'Pergaminho · ' + RAR[rar];
    const lines = it.scroll === 1 ? '' : `<ul><li><span>Mana</span><b style="color:#7fb8ff">${ARC.cost}</b></li><li><span>Dano</span><b>${ARC.min} – ${ARC.max}</b></li><li><span>Saltos</span><b>${ARC.jumps}</b></li><li><span>Recarga</span><b>${fmt(ARC.cd)} s</b></li></ul>`;
    return `<span class="tn" style="color:${RAR_COL[rar]}">${it.name}</span><small>${type}</small>${lines}${it.desc ? `<p>${it.desc}</p>` : ''}${act ? `<em>${act}</em>` : ''}`;
  };
}

/* ---- lançar ---- */
const arcAlive = e => !e.dead && !(e.boss && e.state === 'intro') && !(e.type === 'ghost' && e.vis < 0.5);
const ecx = e => e.x + e.w / 2, ecy = e => e.y + e.h / 2;
function castArc() {
  const [mx, my] = mouseWorld(), pcx = pl.x + pl.w / 2;
  if (Math.abs(mx - pcx) > 2) pl.facing = mx > pcx ? 1 : -1;
  const sx = pcx + pl.facing * 6, sy = pl.y + 9;
  // primeiro alvo: o inimigo mais perto da mira; se não houver um perto do mouse, o que estiver mais na direção dele
  const aim = Math.atan2(my - sy, mx - sx);
  let first = null, best = Infinity;
  for (const e of enemies) {
    if (!arcAlive(e)) continue;
    const ex = ecx(e), ey = ecy(e), d = Math.hypot(ex - sx, ey - sy); if (d > ARC.reach) continue;
    const dm = Math.hypot(ex - mx, ey - my), da = Math.abs(((Math.atan2(ey - sy, ex - sx) - aim + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    const score = dm < 40 ? dm : da < 0.6 ? 40 + da * 120 + d * 0.2 : Infinity;
    if (score < best && losClear(sx, sy, ex, ey)) { best = score; first = e; }
  }
  pl.mana -= ARC.cost; arcCD = ARC.cd; pl.useT = 0.28; sfx.arc();
  const path = [[sx, sy]];
  if (!first) {
    // nada na mira: o raio corre até a parede ou até o fim do alcance e se apaga
    const L = Math.min(ARC.reach * 0.8, Math.hypot(mx - sx, my - sy)), ux = Math.cos(aim), uy = Math.sin(aim);
    let ex = sx, ey = sy; for (let t = 0; t < L; t += 3) { const nx = sx + ux * t, ny = sy + uy * t; if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) break; ex = nx; ey = ny; }
    path.push([ex, ey]); burst(ex, ey, 6, '#8fd0ff', 60, 0, 0.3, 1, true);
    arcs.push(arcBolt(path)); return;
  }
  const hit = new Set(); let cur = first, mult = 1;
  for (let j = 0; cur && j <= ARC.jumps; j++) {
    const [px, py] = path[path.length - 1], ex = ecx(cur), ey = ecy(cur);
    path.push([ex, ey]); hit.add(cur);
    arcRoll = true; try { hitEnemy(cur, ex >= px ? 1 : -1, mult, false); } finally { arcRoll = false; }
    burst(ex, ey, 8, '#8fd0ff', 90, 0, 0.35, 1, true); burst(ex, ey, 4, '#f2fbff', 50, 0, 0.2, 1, true);
    if (j > 0) sfx.zap();
    mult *= ARC.fall;
    let nxt = null, nd = ARC.hop;
    for (const e of enemies) { if (hit.has(e) || !arcAlive(e)) continue; const d = Math.hypot(ecx(e) - ex, ecy(e) - ey); if (d < nd && losClear(ex, ey, ecx(e), ecy(e))) { nd = d; nxt = e; } }
    cur = nxt;
  }
  arcs.push(arcBolt(path));
  shake(1.5);
}
// o raio: a linha de pontos que liga os alvos, refeita em zigue-zague várias vezes enquanto dura
function arcBolt(path) { const a = { path, t: 0, life: 0.3, flick: 0, pts: null, forks: [] }; arcJag(a); return a; }
function arcJag(a) {
  const pts = [], forks = [];
  for (let k = 0; k < a.path.length - 1; k++) {
    const [ax, ay] = a.path[k], [bx, by] = a.path[k + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(L / 7));
    const nx = -(by - ay) / (L || 1), ny = (bx - ax) / (L || 1);
    for (let s = 0; s <= n; s++) {
      if (k > 0 && s === 0) continue;
      const t = s / n, off = s === 0 || s === n ? 0 : rnd(-3.5, 3.5) * Math.sin(Math.PI * t) * 1.4;
      const p = [ax + (bx - ax) * t + nx * off, ay + (by - ay) * t + ny * off]; pts.push(p);
      if (s > 0 && s < n && Math.random() < 0.18) {   // galhos curtos que piscam
        const fa = Math.atan2(by - ay, bx - ax) + rnd(-1.1, 1.1), fl = rnd(4, 9);
        forks.push([p, [p[0] + Math.cos(fa) * fl, p[1] + Math.sin(fa) * fl]]);
      }
    }
  }
  a.pts = pts; a.forks = forks;
}

HOOK.update.push(dt => {
  arcCD -= dt;
  for (let i = arcs.length - 1; i >= 0; i--) { const a = arcs[i]; a.t += dt; if (a.t >= a.life) { arcs.splice(i, 1); continue; } a.flick -= dt; if (a.flick <= 0) { a.flick = 0.04; arcJag(a); } }
  const h = heldBag(); if (!h || !h.it.spell || pl.dead) return;
  // faíscas na mão enquanto o feitiço está pronto
  if (Math.random() < dt * 6) parts.push({ x: pl.x + pl.w / 2 + pl.facing * rnd(4, 7), y: pl.y + rnd(8, 12), vx: rnd(-10, 10), vy: rnd(-25, -5), g: 0, life: 0.25, max: 0.25, col: Math.random() < 0.5 ? '#bfe6ff' : '#5aa8ff', size: 1, glow: true });
  if (!mouse.l || arcCD > 0 || pl.atkT >= 0 || pl.shieldK >= 0.35 || pl.stunT > 0) return;
  if (pl.mana < ARC.cost) { if (mouse.lPressed) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Sem mana', '#7fb8ff', 0.8); sfx.bad(); } arcCD = 0.25; return; }
  castArc();
});

/* ---- desenho: brilho somado por baixo, pixels nítidos por cima ---- */
let arcGlowS = null, arcGlowB = null;
function arcLine(x0, y0, x1, y1, fn) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (let g = 0; g < 400; g++) { fn(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
HOOK.drawGlow.push((cx, cy) => {
  if (!arcs.length) return;
  if (!arcGlowS) { arcGlowS = glow(7, '#4a9cff'); arcGlowB = glow(18, '#5aa8ff'); }
  lc.globalCompositeOperation = 'lighter';
  for (const a of arcs) {
    const k = 1 - a.t / a.life;
    lc.globalAlpha = 0.35 * k; for (let i = 0; i < a.pts.length; i += 2) { const [x, y] = a.pts[i]; lc.drawImage(arcGlowS, Math.round(x) - cx - 7, Math.round(y) - cy - 7); }
    lc.globalAlpha = 0.5 * k; for (const [x, y] of a.path) lc.drawImage(arcGlowB, Math.round(x) - cx - 18, Math.round(y) - cy - 18);
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const a of arcs) {
    const k = 1 - a.t / a.life; if (k < 0.15 && Math.random() < 0.5) continue;   // no fim ele pisca antes de sumir
    const body = (x, y) => { lc.fillRect(x - cx, y - cy - 1, 1, 3); lc.fillRect(x - cx - 1, y - cy, 3, 1); };
    const core = (x, y) => lc.fillRect(x - cx, y - cy, 1, 1);
    lc.globalAlpha = Math.min(1, k * 1.6);
    lc.fillStyle = '#2f6fe0'; for (const [p, q] of a.forks) arcLine(p[0], p[1], q[0], q[1], core);
    lc.fillStyle = '#3f86f0'; for (let i = 0; i < a.pts.length - 1; i++) arcLine(a.pts[i][0], a.pts[i][1], a.pts[i + 1][0], a.pts[i + 1][1], body);
    lc.fillStyle = k > 0.5 ? '#f2fbff' : '#bfe6ff'; for (let i = 0; i < a.pts.length - 1; i++) arcLine(a.pts[i][0], a.pts[i][1], a.pts[i + 1][0], a.pts[i + 1][1], core);
  }
  lc.globalAlpha = 1;
});
