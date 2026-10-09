'use strict';

/* ================= o sapo das grutas (no lugar do goblin dinamiteiro nas Fundações) =================
   O goblin dinamiteiro mudou para a mina (79-85). Nas Fundações, a quarta faixa das Cavernas, entra o sapo das
   grutas: grande, verruguento, de olhos amarelos que brilham no escuro. Fica parado, pula atrás do herói em saltos
   compridos e, de longe, lança a língua: se pegar, puxa o herói para perto e morde. Arte com o pincel do 55.
   Carrega depois do 76 (troca a tabela de nascimento e a missão da pólvora) e antes do 49 (BAL). */

Object.assign(ET, { sapo: { name: 'Sapo das Grutas', w: 14, h: 10, hp: 48, dmg: 12, xp: 18, kb: 0.7, fly: false, blood: '#7a8a3a' } });
Object.assign(ICON_ART, { toadSkin: [["..ddddd..", ".dDdDDDd.", "dDDDdDDDd", "dDdDDDdDd", "dDDDDdDDd", ".dDDdDDd.", "..ddddd.."], { d: '#3a4020', D: '#7a7a3a' }] });
Object.assign(ITEMS, { pele_sapo: { name: 'Pele de Sapo', rar: 0, stack: 99, icon: 'toadSkin', desc: 'Verruguenta e meio pegajosa. Material.' } });
DROPS.sapo = [['pele_sapo', 0.55], ['carne', 0.3], ['glandula', 0.15], ['pocao', 0.07], ['botas_couro', 0.03], ['amuleto', 0.012]].filter(([id]) => ITEMS[id]);
Object.assign(NAV_WALKERS, { sapo: 1 });
Object.assign(CV_STEP, { sapo: 1 });

/* ---------- arte: 20 x 14 de frente para a direita: 0 sentado, 1 agachado (vai pular), 2 no ar, 3 boca aberta (a língua) ---------- */
const SPG = {};
{
const { RB, cp, set } = CVB;
const R7 = hexes => hexes.map(h => ph(h));
const RS = {
  dorso: R7(['#12140a', '#1e2410', '#2e3618', '#404a22', '#545e2e', '#6a723c', '#82884e']),
  barriga: R7(['#3a2a12', '#5a4420', '#7a5e30', '#9a7a44', '#b8965a', '#d2b276', '#e8cc96']),
  verruga: R7(['#24200e', '#3a3418', '#544c24', '#6e6432', '#8a7e42', '#a69856', '#c2b26c']),
  olho: R7(['#3a2a04', '#6a5008', '#a88010', '#e0b020', '#ffd840', '#fff080', '#ffffd0']),
  boca: R7(['#1a0606', '#2e0c0c', '#461414', '#5e1e1e', '#782a2a', '#923838', '#ac4a4a'])
};
function toad(pose) {
  const P = cp(20, 14), s = 9551 + pose, air = pose === 2, low = pose === 1 ? 1 : 0, open = pose === 3;
  // back leg folded (or kicked out behind in the jump)
  if (air) { P.line(5, 8, 1, 11, RS.dorso, 2.6); P.line(1, 11, 0, 13, RS.dorso, 2.2); }
  else { P.blob(5.6, 10.4 + low * 0.4, 3.4, 2.6, RS.dorso, s + 1, 3, (x, y) => hash2(x, y, s) < 0.15 ? 1.4 : 0); P.line(3, 12.6, 7, 12.6, RS.dorso, 2); }
  // the body: a wide warty dome, pale belly underneath
  P.blob(9.6, 8.4 + low, 7, 4.4 - low * 0.4, RS.dorso, s, 3.4, (x, y, dx, dy) => (dy > 0.45 ? -9 : 0) + (hash2(x, y, s) < 0.16 ? 1.6 : 0) + (hash2(x, y, s + 3) < 0.06 ? -1.4 : 0));
  for (let x = 4; x < 16; x++) for (let y = 10 + low; y < 13; y++) { const dx = (x + 0.5 - 10) / 6.4, dy = (y + 0.5 - (10.4 + low)) / 2.6; if (dx * dx + dy * dy <= 1) P.put(x, y, RS.barriga, 4 - dy * 1.2 - Math.abs(dx) * 0.8 + (x + y) % 3 * 0.2); }
  for (const [x, y] of [[7, 6], [10, 5.4], [12.4, 6.6], [8.4, 8.4], [5.4, 7.6]]) { P.put(x, y + low, RS.verruga, 5.4); P.put(x + 1, y + low + 1, RS.verruga, 2.6); }   // warts
  // the head and the jaw (open for the tongue)
  const hx = 15.4, hy = 7 + low;
  P.blob(hx, hy, 3.6, 2.8, RS.dorso, s + 2, 3.8);
  if (open) { for (let x = hx - 1; x < hx + 4.4; x++) { P.put(x, hy + 1.4, RS.boca, 1.6); P.put(x, hy + 2.2, RS.boca, 2.6); } P.line(hx - 1, hy + 3, hx + 3.6, hy + 3.4, RS.barriga, 4); }
  else P.line(hx - 1.4, hy + 1.4, hx + 3.4, hy + 1.6, RS.boca, 1);
  // the eye on top of the head, bulging
  P.blob(hx - 0.6, hy - 2.6, 1.8, 1.6, RS.dorso, s + 4, 4.2); P.put(hx - 0.4, hy - 2.8, RS.olho, 6); P.put(hx + 0.4, hy - 2.8, RS.olho, 4.6); P.put(hx, hy - 2.4, RS.boca, 0.4);
  // the front leg
  if (air) P.line(14, 10, 18.4, 12.4, RS.dorso, 3.4);
  else { P.line(13.4, 10 + low, 14.4, 13, RS.dorso, 3.6); P.line(14, 13, 16.4, 13, RS.dorso, 4.4); }
  return set(P.done());
}
SPG.get = () => SPG.ready || (SPG.ready = [0, 1, 2, 3].map(toad));
}
DRAW_E.sapo = (e, fx, fy, fl) => {
  const B = SPG.get(), k = e.state === 'tongue' || e.state === 'aim' ? 3 : !e.onGround ? 2 : e.state === 'crouch' ? 1 : 0;
  const sw = e.state === 'walk' && e.onGround ? Math.round(Math.sin(e.t * 2) * 0.4) : 0;   // the throat pulsing
  lc.drawImage(cvPick(B[k], e, fl), fx - 10, fy - 14 + sw);
};
EYES_E.sapo = (e, fx, fy) => { lc.globalAlpha = 0.5; lc.drawImage(SPR.glow.eye, fx + e.facing * 5 - 6, fy - 16); };
WARN_E.sapo = e => e.state === 'aim';

/* ---------- comportamento ---------- */
const spTongues = [];
AI.sapo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'aim') { e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { const ox = ecx + e.facing * 8, oy = e.y + 4, a = Math.atan2(pl.y + pl.h / 2 - oy, pl.x + pl.w / 2 - ox); spTongues.push({ by: e, x: ox, y: oy, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, out: true, t: 0, hooked: false }); e.state = 'tongue'; e.stateT = 1.2; sfx.spSlurp(); } return; }
  if (e.state === 'tongue') { e.vx = 0; if (e.stateT <= 0 || !spTongues.some(t => t.by === e)) { e.state = 'walk'; e.atkCD = 1.8 + Math.random() * 0.8; } return; }
  if (e.state === 'crouch') { e.vx = 0; if (e.stateT <= 0) { e.vx = e.facing * (110 + e.lvl * 2); e.vy = -260; e.state = 'hop'; e.swingHit = false; sfx.spCroak(); } return; }
  if (e.state === 'hop') {
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.onGround && e.vy >= 0) { e.vx = 0; e.state = 'walk'; e.hopT = 0.5 + Math.random() * 0.6; }
    return;
  }
  e.vx = approach(e.vx, 0, 700 * dt);
  e.hopT = (e.hopT === undefined ? Math.random() : e.hopT) - dt;
  if (!aggro) { if (e.hopT <= 0 && e.onGround) { e.hopT = 2 + Math.random() * 3; if (Math.random() < 0.5) { e.facing = Math.random() < 0.5 ? -1 : 1; if (ledgeAhead(e, e.facing, 0, false) !== 'stop') { e.state = 'crouch'; e.stateT = 0.25; } } } return; }
  e.facing = Math.sign(dx) || e.facing;
  if (!e.onGround) return;
  const adx = Math.abs(dx);
  if (e.atkCD <= 0 && adx > 30 && adx < 100 && Math.abs(dy) < 36 && losClear(ecx, e.y + 4, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'aim'; e.stateT = 0.45; return; }
  if (e.hopT <= 0) { e.hopT = 0.7 + Math.random() * 0.5; if (e.nav && e.nav.dir) e.facing = e.nav.dir; e.state = 'crouch'; e.stateT = 0.2; }
};
function spUpdate(dt) {
  for (let i = spTongues.length - 1; i >= 0; i--) {
    const g = spTongues[i], e = g.by; g.t += dt;
    if (!e || e.dead) { spTongues.splice(i, 1); continue; }
    const ox = e.x + e.w / 2 + e.facing * 8, oy = e.y + 4;
    if (g.out) {
      g.x += g.vx * dt; g.y += g.vy * dt;
      if (!pl.dead && g.x > pl.x - 1 && g.x < pl.x + pl.w + 1 && g.y > pl.y - 1 && g.y < pl.y + pl.h + 1) {
        const r = hurtPlayer(Math.max(1, Math.round(e.dmg * 0.4)), g.x - Math.sign(g.vx) * 4, null, true);
        if (r === 'hit') { const d = Math.sign(ox - (pl.x + pl.w / 2)) || 1; pl.vx = d * Math.min(300, Math.abs(ox - pl.x) * 2.6 + 60); pl.vy = -120; floatText(pl.x + pl.w / 2, pl.y - 8, 'PUXADO', '#c87a7a', 0.8); g.hooked = true; e.atkCD = 0.3; e.swingHit = false; }
        g.out = false;
      } else if (solidAt(Math.floor(g.x / T), Math.floor(g.y / T)) || g.t > 0.32) g.out = false;
    } else {
      const a = Math.atan2(oy - g.y, ox - g.x); g.x += Math.cos(a) * 420 * dt; g.y += Math.sin(a) * 420 * dt;
      if (g.hooked && !pl.dead && overlap({ x: e.x - 4, y: e.y - 2, w: e.w + 8, h: e.h + 4 }, pl) && !e.swingHit) { e.swingHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); }   // and the bite when you land in front of it
      if (Math.hypot(ox - g.x, oy - g.y) < 6) spTongues.splice(i, 1);
    }
  }
}
HOOK.update.push(spUpdate);
HOOK.drawTop.push((cx, cy) => {
  for (const g of spTongues) {
    const e = g.by, ox = Math.round(e.x + e.w / 2 + e.facing * 8) - cx, oy = Math.round(e.y + 4) - cy, x = Math.round(g.x) - cx, y = Math.round(g.y) - cy;
    const n = Math.max(1, Math.ceil(Math.hypot(x - ox, y - oy)));
    for (let k = 0; k <= n; k++) { const t = k / n, px = Math.round(ox + (x - ox) * t), py = Math.round(oy + (y - oy) * t + Math.sin(t * Math.PI) * 1.5); lc.fillStyle = '#5e1e1e'; lc.fillRect(px, py + 1, 1, 1); lc.fillStyle = '#b8726c'; lc.fillRect(px, py, 1, 1); }
    lc.fillStyle = '#d09088'; lc.fillRect(x - 1, y - 1, 3, 3); lc.fillStyle = '#e8b0a8'; lc.fillRect(x - 1, y - 1, 1, 1);
  }
});
{ const _nw = newWorld; newWorld = function (sd, sv) { spTongues.length = 0; return _nw(sd, sv); }; }
Object.assign(sfx, {
  spCroak() { tone(120, 0.18, 'square', 0.04, -40); tone(95, 0.2, 'square', 0.03, -30, 0.1); },
  spSlurp() { noise(0.12, 0.06, 1400, 'bandpass'); tone(500, 0.12, 'sine', 0.03, -300); }
});

/* ---------- onde nasce: no lugar do goblin, nas Fundações ---------- */
{ const Z = CATH_SPAWN[CV_ZONE0 + 3]; if (Z) Z[0] = Z[0].map(([t, w]) => [t === 'goblin' ? 'sapo' : t, w]); }

/* ---------- o vilarejo: a pólvora agora vem da mina; nas cavernas, peles de sapo ---------- */
Object.assign(MAT_VAL, { pele_sapo: 5 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'pele_sapo'; c.hint = c.hint.replace(/\.$/, '') + ' e peles de sapo.'; }
{ const k = BOUNTIES.findIndex(b => b[1] === 'polvora' && b[0] === 2); if (k >= 0) BOUNTIES[k] = [2, 'pele_sapo', 4, 'Peles de sapo das grutas. A Marta faz um unguento que ninguém quer saber como.', 'O unguento da Marta']; }
BOUNTIES.push([4, 'polvora', 6, 'Pólvora dos goblins da mina. O Grimaldo quer abrir um veio de ferro sem quebrar a picareta.', 'Pólvora para o veio']);
ITEMS.polvora.desc = 'Um saquinho dos goblins da mina. Longe da forja. Material.';
