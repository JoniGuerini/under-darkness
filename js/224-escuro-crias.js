'use strict';

/* ================= what the Darkness makes (1): the snuffer, the mouth, the moths, the eyeless watcher, the colossus =================
   docs/camadas/16-escuridao.md, section 6. The ones marked `sombra` in ET take damage from strong light (223). They are
   silhouettes: a body in the two darkest tones of darkstone, a 1 px rim of the cold wisp's palest blue (it shows only
   where light falls on them), and their eyes are drawn over the dark (EYES_E): in the dark you see only the eyes.
   - the snuffer (apagaluz, sombra): long arms, walks to the nearest torch (or pyre), not to you, and puts it out with
     its hand (the braziers lit with a wisp it cannot put out);
     if you are close, a double claw (the arms go up and the two white eyes widen, 0.6 s).
   - the mouth of the dark (bocabreu, sombra): a stain on the dark floor that creeps when nobody looks; a ring of white
     teeth opens round your feet and you hear a breath; 0.7 s later it shuts from below. It never opens on lit floor.
   - the black moth (traca): swarms of 5 to 8 (226) that fly to the strongest light; a dive in a line (the wings
     flash pale first) and a dust that blinds for 3 s.
   - the eyeless watcher (semolhos, sombra): stands on high ledges and turns its smooth face to you; the chest opens on
     a dark hole with a lit rim (0.8 s) and a slow sphere of dark comes out: who it hits is blinded for 6 s.
   - the colossus of dark (colosso): moves only in the dark; with light on it (0.35 or more) it freezes mid-step; in the
     dark it walks fast. A slam: a pale crack runs along the floor to where it will hit, 0.9 s before.
   Levels and spawn: 226. Loads after 223. */

/* ---------- stats ---------- */
Object.assign(ET, {
  apagaluz: { name: 'O Apagador', w: 10, h: 24, hp: 70, dmg: 16, xp: 30, kb: 0.6, fly: false, sombra: true, blood: '#14101c' },
  bocabreu: { name: 'Boca do Breu', w: 18, h: 6, hp: 120, dmg: 26, xp: 40, kb: 0, fly: false, sombra: true, blood: '#0c0a12' },
  traca: { name: 'Mariposa Negra', w: 7, h: 6, hp: 18, dmg: 8, xp: 6, kb: 1.3, fly: true, blood: '#2a2830' },
  semolhos: { name: 'Vigia Sem Olhos', w: 10, h: 24, hp: 80, dmg: 18, xp: 32, kb: 0.4, fly: false, sombra: true, blood: '#14101c' },
  colosso: { name: 'Colosso de Breu', w: 20, h: 36, hp: 300, dmg: 30, xp: 70, kb: 0.1, fly: false, blood: '#0e1018' }
});
const ESC1_TYPES = ['apagaluz', 'bocabreu', 'traca', 'semolhos', 'colosso'];
const ESC1_DROPS = {
  apagaluz: [['po_breu', 0.45, 1, 2], ['tocha', 0.2, 1, 2], ['carvao', 0.3, 1, 2], ['pocao', 0.07]],
  bocabreu: [['po_breu', 0.4, 1, 2], ['min_noctirio', 0.12], ['pocao', 0.08]],
  traca: [['asa_mariposa', 0.4], ['tocha', 0.08]],
  semolhos: [['nucleo_breu', 0.22], ['min_noctirio', 0.14], ['po_breu', 0.3], ['pocao', 0.08]],
  colosso: [['nucleo_breu', 0.4], ['min_noctirio', 0.35, 1, 3], ['carvao', 0.4, 1, 3], ['pocao', 0.12]]
};
function esc1Tables() { for (const k of ESC1_TYPES) DROPS[k] = ESC1_DROPS[k].filter(([id]) => ITEMS[id]); if (typeof esBaseDrops === 'function') esBaseDrops(); }
esc1Tables();
Object.assign(NAV_WALKERS, { apagaluz: 1, colosso: 1 });
Object.assign(CV_STEP, { apagaluz: 1, colosso: 1, semolhos: 1 });
const ES_COR = { RIM: '#b4ceff', EYE: '#e6f0ff' };

/* ================= art ================= */
const ESCA = {};
{
const { cp, set } = CVB;
const cg = CVART.cg;
const R7 = hexes => hexes.map(h => ph(h));
const RB = {
  sh: R7(['#020204', '#05060a', '#0a0c14', '#10131e', '#171b2a', '#20263a', '#2c344c']),      // the shadow body: darkstone's darkest
  rim: R7(['#1c2a44', '#2c4a78', '#4a74b0', '#7aa2dc', '#b4ceff', '#d4e2ff', '#e6f0ff']),     // the cold rim
  asa: R7(['#0a090c', '#141218', '#1e1b24', '#2a2632', '#38333f', '#4a4452', '#5e5868']),     // moth wings
  palido: R7(['#3a3c44', '#5a5e6a', '#7e8494', '#a4aabb', '#c8ceda', '#dfe4ee', '#f2f5fa']),
  breu: R7(['#06070b', '#0d0f16', '#151821', '#1e222e', '#2a2f3e', '#383e50', '#4a5066'])
};
// the cold rim: every body pixel that touches the air takes the rim's tone, brighter on the top left
function rim(P, lift = 0) {
  const { w, h, c } = P, src = c.slice(), RIM = RB.rim;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x; if (!src[k]) continue;
    const L = x > 0 && !src[k - 1], U = y > 0 && !src[k - w], Rr = x < w - 1 && !src[k + 1], D = y < h - 1 && !src[k + w];
    if (L || U) c[k] = RIM[Math.min(6, 4 + lift)]; else if (Rr || D) c[k] = RIM[2 + lift];
  }
}
function limb(P, x0, y0, x1, y1, r0, r1, R, v, s) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * t; for (let oy = -r; oy <= r + 0.01; oy += 0.5) for (let ox = -r; ox <= r + 0.01; ox += 0.5) if (ox * ox + oy * oy <= r * r + 0.1) P.put(x + ox, y + oy, R, v + (oy < 0 ? 0.5 : -0.4) + cg(x + ox | 0, y + oy | 0, s) * 0.4); }
}
const claw = (P, x, y, a, s) => { for (let k = -1; k <= 1; k++) { const fa = a + k * 0.45; P.line(x, y, x + Math.cos(fa) * 3.4, y + Math.sin(fa) * 3.4, RB.sh, 2.2); } };

/* the snuffer, 22 x 30 facing right: k 0-3 walk, 4 reach (the near arm down and forward, palm flat to smother a flame),
   5 raise (both arms over its head, claws spread), 6 strike (both arms swept down in front) */
function snuffer(k) {
  const P = cp(22, 30), s = 22401 + k * 5, walk = k < 4 ? [0, 1, 0, -1][k] : 0;
  // legs: long and thin, knees bent a little
  limb(P, 10, 18, 8 - walk * 2, 24, 1.1, 0.9, RB.sh, 1.6, s); limb(P, 8 - walk * 2, 24, 8 - walk * 3, 29, 0.9, 0.8, RB.sh, 1.4, s + 1);
  limb(P, 12, 18, 13 + walk * 2, 24, 1.1, 0.9, RB.sh, 2, s + 2); limb(P, 13 + walk * 2, 24, 13 + walk * 3, 29, 0.9, 0.8, RB.sh, 1.8, s + 3);
  // the far arm
  const fa = k === 5 ? [[9, 8], [6, 3], [5, 0]] : k === 6 ? [[9, 8], [14, 13], [19, 17]] : k === 4 ? [[9, 8], [8, 15], [9, 22]] : [[9, 8], [7 - walk, 16], [6 - walk, 24]];
  limb(P, fa[0][0], fa[0][1], fa[1][0], fa[1][1], 0.9, 0.8, RB.sh, 1.2, s + 4); limb(P, fa[1][0], fa[1][1], fa[2][0], fa[2][1], 0.8, 0.7, RB.sh, 1.2, s + 5);
  claw(P, fa[2][0], fa[2][1], Math.atan2(fa[2][1] - fa[1][1], fa[2][0] - fa[1][0]), s + 6);
  // the body: a thin torso, a hunch at the shoulders
  for (let y = 7; y < 19; y++) { const hw = y < 10 ? 2.6 : 2 - (y - 10) * 0.05; for (let x = Math.floor(11 - hw); x <= 11 + hw; x++) P.put(x, y, RB.sh, 2.2 - (x - 11) / hw * 0.8 + cg(x, y, s + 7) * 0.4); }
  P.blob(11.5, 4, 2.6, 3.2, RB.sh, s + 8, 2.4);   // the head: small, a little long
  // the near arm
  const na = k === 5 ? [[12, 8], [15, 3], [17, 0]] : k === 6 ? [[12, 8], [17, 12], [21, 15]] : k === 4 ? [[12, 8], [17, 13], [20, 18]] : [[12, 8], [15 + walk, 15], [16 + walk, 23]];
  limb(P, na[0][0], na[0][1], na[1][0], na[1][1], 1, 0.9, RB.sh, 2.4, s + 9); limb(P, na[1][0], na[1][1], na[2][0], na[2][1], 0.9, 0.8, RB.sh, 2.4, s + 10);
  claw(P, na[2][0], na[2][1], Math.atan2(na[2][1] - na[1][1], na[2][0] - na[1][0]), s + 11);
  rim(P);
  return set(P.done());
}
/* the black moth, 11 x 8 facing right: 0 wings up, 1 wings down, 2 the tell (wings flashing pale) */
function moth(k) {
  const P = cp(11, 8), s = 22451 + k, up = k !== 1, W = k === 2 ? RB.palido : RB.asa;
  for (let i = 0; i < 6; i++) for (let j = 0; j < (up ? 4 : 3); j++) { const x = 1 + i, y = up ? 3 - j - (i < 3 ? 0 : 1) + (i > 4 ? 1 : 0) : 4 + j - (i < 2 ? 1 : 0); P.put(x, y, W, 3.4 - j * 0.6 - i * 0.15 + cg(x, y, s) * 0.5); }
  if (k === 2) { P.put(3, up ? 1 : 5, RB.rim, 6); P.put(5, up ? 0 : 6, RB.rim, 6); }
  for (let x = 4; x <= 9; x++) P.put(x, 4, RB.sh, 3 - (x - 4) * 0.2);   // the body
  P.put(10, 3, RB.sh, 3); P.put(10, 2, RB.asa, 4); P.put(9, 2, RB.asa, 3);   // head and feelers
  return set(P.done());
}
/* the eyeless watcher, 20 x 28 facing right: 0 still, 1 the face turned to you (a little forward), 2 the chest open on its hole */
function watcher(k) {
  const P = cp(20, 28), s = 22461 + k * 3, open = k === 2, lean = k === 1 ? 1 : k === 2 ? 1.5 : 0;
  // a long shape like a robe to the floor
  for (let y = 9; y < 28; y++) { const hw = 3 + (y - 9) * 0.14; for (let x = Math.floor(10 - hw + lean * (28 - y) / 19); x <= 10 + hw + lean * (28 - y) / 19; x++) P.put(x, y, RB.sh, 2 - (x - 10) / hw * 0.7 + ((x + y) % 5 === 0 ? -0.6 : 0) + cg(x, y, s) * 0.4); }
  P.blob(10 + lean * 1.5, 5, 3.2, 4.2, RB.sh, s + 1, 2.6);   // the smooth face, nothing on it
  limb(P, 13 + lean, 11, 15 + lean, 21, 0.8, 0.7, RB.sh, 2.2, s + 2); limb(P, 7 + lean, 11, 6, 21, 0.8, 0.7, RB.sh, 1.4, s + 3);
  if (open) for (let y = 12; y < 20; y++) for (let x = 8; x < 15; x++) { const d = Math.hypot((x + 0.5 - 11.5) / 3, (y + 0.5 - 16) / 3.6); if (d < 0.7) P.put(x, y, RB.sh, 0); else if (d < 1) P.put(x, y, RB.rim, 5.4); }
  rim(P);
  if (open) for (let y = 12; y < 20; y++) for (let x = 8; x < 15; x++) { const d = Math.hypot((x + 0.5 - 11.5) / 3, (y + 0.5 - 16) / 3.6); if (d < 0.7) P.put(x, y, RB.sh, 0); }   // the hole stays black inside the rim
  return set(P.done());
}
/* the colossus of dark, 34 x 40 facing right: 0-3 walk, 4 raise (both fists over its head), 5 slam (fists into the floor) */
function colossus(k) {
  const P = cp(34, 40), s = 22471 + k * 7, walk = k < 4 ? [0, 1, 0, -1][k] : 0;
  limb(P, 13, 28, 12 - walk * 2, 39, 3, 2.6, RB.breu, 1.6, s); limb(P, 20, 28, 21 + walk * 2, 39, 3, 2.6, RB.breu, 2.2, s + 1);   // short thick legs
  const fist = k === 4 ? [[8, 12], [7, 2], [27, 12], [26, 2]] : k === 5 ? [[8, 14], [6, 34], [26, 14], [30, 34]] : [[8, 13], [4 - walk, 30], [26, 13], [30 + walk, 30]];
  limb(P, fist[0][0], fist[0][1], fist[1][0], fist[1][1], 3, 2.8, RB.breu, 1.4, s + 2); P.blob(fist[1][0], fist[1][1], 3.4, 3.4, RB.breu, s + 3, 1.8);   // the far arm
  // the hunched mass: a great back, the head sunk in it
  for (let y = 8; y < 30; y++) { const hw = 11 - Math.abs(y - 17) * 0.32; for (let x = Math.floor(17 - hw); x <= 17 + hw; x++) P.put(x, y, RB.breu, 2.6 - (x - 17) / hw * 0.9 - (y - 8) * 0.03 + cg(x, y, s + 4) * 0.5); }
  P.blob(21, 8, 4.6, 4, RB.breu, s + 5, 2.8);   // the head, low and forward
  limb(P, fist[2][0], fist[2][1], fist[3][0], fist[3][1], 3.2, 3, RB.breu, 2.6, s + 6); P.blob(fist[3][0], fist[3][1], 3.6, 3.6, RB.breu, s + 7, 3);   // the near arm
  // the pale cracks in it (the cold showing through)
  for (let i = 0; i < 4; i++) { let x = 10 + i * 4, y = 12 + (i % 2) * 5; for (let n = 0; n < 7; n++) { P.put(x, y, RB.rim, 2.6 + (n % 3 === 0 ? 1 : 0)); x += hash2(i, n, s) < 0.5 ? 1 : 0; y += 1; } }
  rim(P, -1);
  return set(P.done());
}
ESCA.get = () => ESCA.ready || (ESCA.ready = {
  snuffer: [0, 1, 2, 3, 4, 5, 6].map(snuffer),
  moth: [0, 1, 2].map(moth),
  watcher: [0, 1, 2].map(watcher),
  colossus: [0, 1, 2, 3, 4, 5].map(colossus)
});
ESCA.GL = { eye: glow(3, '#e6f0ff'), big: glow(6, '#b4ceff'), hole: glow(10, '#7aa2dc') };
ESCA.RB = RB; ESCA.rim = rim; ESCA.limb = limb;
}

/* ================= drawing ================= */
const escWalkF = e => Math.floor(e.t * (e.type === 'colosso' ? 5 : 6)) % 4;
DRAW_E.apagaluz = (e, fx, fy, fl) => {
  const S = ESCA.get().snuffer, k = e.state === 'snuff' ? 4 : e.state === 'raise' ? 5 : e.state === 'strike' ? 6 : Math.abs(e.vx) > 4 ? escWalkF(e) : 0;
  lc.drawImage(cvPick(S[k], e, fl), fx - 11 + (e.state === 'raise' ? Math.round(Math.sin(e.t * 40) * 0.5) : 0), fy - 29);
};
EYES_E.apagaluz = (e, fx, fy) => {
  const wide = e.state === 'raise', y = fy - 26 + (e.state === 'strike' ? 2 : 0);
  lc.globalAlpha = wide ? 1 : 0.75; lc.fillStyle = ES_COR.EYE; const x = fx + e.facing * 1;
  lc.fillRect(x, y, 1, wide ? 2 : 1); lc.fillRect(x + e.facing * 2, y, 1, wide ? 2 : 1);
  if (wide) { lc.globalAlpha = 0.6; lc.drawImage(ESCA.GL.eye, x - 3, y - 2); lc.drawImage(ESCA.GL.eye, x + e.facing * 2 - 3, y - 2); }
};
WARN_E.apagaluz = e => e.state === 'raise';
// the mouth: a stain on the floor, darker than the dark, with a few pale specks; it shows its teeth only when it bites (drawTop)
DRAW_E.bocabreu = (e, fx, fy) => {
  for (let x = -10; x <= 10; x++) { const h = Math.round((1 - (x / 10) ** 2) * 2.6); for (let y = 0; y < h; y++) { lc.fillStyle = (x + y + Math.floor(e.t * 2)) % 7 === 0 ? '#1e2232' : y === h - 1 ? '#05060a' : '#020204'; lc.fillRect(fx + x, fy - y, 1, 1); } }
};
EYES_E.bocabreu = (e, fx, fy) => { if (e.state !== 'tell') return; lc.globalAlpha = 0.5; lc.fillStyle = ES_COR.EYE; lc.fillRect(fx - 3, fy - 2, 1, 1); lc.fillRect(fx + 3, fy - 2, 1, 1); };
WARN_E.bocabreu = () => false;
DRAW_E.traca = (e, fx, fy, fl) => { const M = ESCA.get().moth, k = e.state === 'tell' ? 2 : Math.floor(e.t * 16 + e.seed) % 2; lc.drawImage(cvPick(M[k], e, fl), fx - 6, fy - 7); };
EYES_E.traca = (e, fx, fy) => { lc.globalAlpha = 0.35; lc.fillStyle = '#c8ceda'; lc.fillRect(fx + e.facing * 4, fy - 4, 1, 1); };
WARN_E.traca = () => false;
DRAW_E.semolhos = (e, fx, fy, fl) => { const W = ESCA.get().watcher, k = e.state === 'open' ? 2 : e.sees ? 1 : 0; lc.drawImage(cvPick(W[k], e, fl), fx - 10, fy - 27); };
EYES_E.semolhos = (e, fx, fy) => {   // no eyes: only the hole's rim, when it opens
  if (e.state !== 'open') return;
  const k = clamp(1 - e.stateT / 0.8, 0, 1), x = fx + e.facing * 1.5;
  lc.globalAlpha = 0.25 + 0.5 * k; lc.drawImage(ESCA.GL.hole, x - 10, fy - 21);
  lc.globalAlpha = 0.8; lc.fillStyle = ES_COR.RIM; for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; lc.fillRect(Math.round(x + Math.cos(t) * 3), Math.round(fy - 11 + Math.sin(t) * 3.6), 1, 1); }
};
WARN_E.semolhos = e => e.state === 'open';
DRAW_E.colosso = (e, fx, fy, fl) => {
  const C = ESCA.get().colossus, k = e.state === 'raise' ? 4 : e.state === 'slam' ? 5 : e.state === 'frozen' ? (e.frozenK || 0) : Math.abs(e.vx) > 4 ? escWalkF(e) : 0;
  if (e.state !== 'frozen') e.frozenK = k;
  lc.drawImage(cvPick(C[k], e, fl), fx - 17 + (e.state === 'raise' ? Math.round(Math.sin(e.t * 50) * 0.6) : 0), fy - 39);
};
EYES_E.colosso = (e, fx, fy) => { const x = fx + e.facing * 4; lc.globalAlpha = e.state === 'frozen' ? 0.15 : 0.6; lc.fillStyle = ES_COR.EYE; lc.fillRect(x, fy - 33, 1, 1); lc.fillRect(x + e.facing * 3, fy - 33, 1, 1); };
WARN_E.colosso = e => e.state === 'raise';

/* ================= behaviour ================= */
const escLightE = e => esLightAtPx(e.x + e.w / 2, e.y + e.h / 2);
// a walker heading for dir: stops at drops it cannot take (never leaps)
function escWalk(e, dt, dir, sp, acc, dy, aggro) {
  if (dir && e.onGround) { const L = ledgeAhead(e, dir, dy || 0, aggro); if (L !== 0) dir = 0; }
  if (dir) e.facing = dir;
  e.vx = approach(e.vx, dir * sp, acc * dt);
  if (dir && e.onGround && e.hitWall && Math.random() < dt * 2) e.vy = -200;   // a little hop over a step
  return dir;
}

/* ---------- the snuffer ---------- */
AI.apagaluz = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, feet = e.y + e.h, tx = Math.floor(ecx / T), ty = Math.floor((feet - 2) / T);
  if (e.state === 'snuff') {   // its hand on the flame
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) { const L = e.target; if (L) esSnuff(L[0], L[1]); e.target = null; e.state = 'walk'; e.atkCD = 0.6; }
    return;
  }
  if (e.state === 'raise') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'strike'; e.stateT = 0.25; e.hitDone = false; sfx.escGarra(); } return; }
  if (e.state === 'strike') {
    e.vx = approach(e.vx, 0, 600 * dt);
    if (!e.hitDone && !pl.dead) { const hb = { x: e.facing > 0 ? ecx : ecx - 26, y: e.y + 4, w: 26, h: e.h - 4 }; if (overlap(hb, pl)) { e.hitDone = true; hurtPlayer(e.dmg, ecx, e, false); } }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.4 + Math.random() * 0.6; }
    return;
  }
  e.state = 'walk';
  // close to the hero: the double claw
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 28 && dy > -26 && dy < 20 && clearPath(e, pl)) { e.state = 'raise'; e.stateT = 0.6; e.facing = Math.sign(dx) || e.facing; sfx.escSopro(0.6); return; }
  // otherwise the nearest light (within 30 blocks), not the hero
  if (!e.target || (e.retarget -= dt) <= 0) { e.retarget = 1 + Math.random(); e.target = esNearestLight(tx, ty, 30, true); }   // torches and pyres: a wisp's brazier it cannot touch
  const L = e.target;
  if (L && tileAt(L[0], L[1]) !== ES_PIRA && tileAt(L[0], L[1]) !== TORCH) e.target = null;
  if (L && e.target) {
    const lx = (L[0] + 0.5) * T, ddx = wdx(Math.floor(lx / T) - tx) * T + (lx % T) - (ecx % T), ddy = L[1] * T - feet;
    if (Math.abs(ddx) < 14 && ddy > -3 * T && ddy < 2 * T) { e.state = 'snuff'; e.stateT = 1.0; e.facing = Math.sign(ddx) || e.facing; return; }
    const nav = e.nav && e.nav.kind !== 'here' && !e.sees ? e.nav : null;
    escWalk(e, dt, Math.sign(ddx), 34 + e.lvl * 0.5, 160, ddy, true);
    return;
  }
  if (aggro) { const nav = !e.sees && e.nav && e.nav.kind !== 'here' ? e.nav : null; escWalk(e, dt, nav ? nav.dir : Math.abs(dx) > 8 ? Math.sign(dx) : 0, 30 + e.lvl * 0.4, 160, dy, true); }
  else { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } escWalk(e, dt, e.wander, 18, 120, 0, false); }
};

/* ---------- the mouth of the dark ---------- */
const escBites = [];   // the rings of teeth open round a hero's feet: { e, x, y, t, max, shut }
AI.bocabreu = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'tell') {
    if (e.stateT <= 0) {
      e.state = 'rest'; e.stateT = 0.4; e.atkCD = 2.4 + Math.random();
      const B = e.bite; if (B) { B.shut = true; B.t = 0; B.max = 0.25; }
      if (B && !pl.dead && Math.abs(pl.x + pl.w / 2 - B.x) < 13 && Math.abs(pl.y + pl.h - B.y) < 10) { hurtPlayer(e.dmg, B.x, e, false); shake(3); }
      sfx.escMorde();
    }
    return;
  }
  if (e.state === 'rest') { if (e.stateT <= 0) e.state = 'lurk'; return; }
  e.state = 'lurk';
  e.vx = 0;
  // when nobody looks (far off, or the hero turned away) it creeps toward him along the floor
  const looked = Math.abs(dx) < 110 && Math.sign(dx) === -pl.facing;
  if (aggro && !looked && Math.abs(dx) > 30 && e.onGround) { const dir = Math.sign(dx); const L = ledgeAhead(e, dir, dy, true); if (L === 0 && !solidAt(Math.floor((ecx + dir * 12) / T), Math.floor((e.y + e.h - 3) / T))) e.vx = dir * 11; }
  // the bite: the hero on the floor near it, on unlit floor
  if (aggro && e.atkCD <= 0 && !pl.dead && pl.onGround && Math.abs(dx) < 46 && Math.abs(dy) < 18) {
    const fx = Math.floor((pl.x + pl.w / 2) / T), fy = Math.floor((pl.y + pl.h + 2) / T);
    if (esLightAt(fx, fy - 1) >= 0.45) return;
    e.state = 'tell'; e.stateT = 0.7;
    e.bite = { e, x: pl.x + pl.w / 2, y: pl.y + pl.h, t: 0, max: 0.7, shut: false }; escBites.push(e.bite);
    sfx.escSopro(1);
  }
};

/* ---------- the black moth ---------- */
AI.traca = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, drag = k => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
  if (e.state === 'tell') { drag(0.05); if (e.stateT <= 0) { e.state = 'dive'; e.stateT = 0.45; const a = Math.atan2(pl.y + pl.h / 2 - ecy, pl.x + pl.w / 2 - ecx); e.vx = Math.cos(a) * 210; e.vy = Math.sin(a) * 210; e.hitDone = false; sfx.escAsas(1); } return; }
  if (e.state === 'dive') {
    if (!e.hitDone && !pl.dead && overlap(e, pl)) { e.hitDone = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') esBlind(3, 0.75); for (let k = 0; k < 8; k++) parts.push({ x: ecx, y: ecy, vx: rnd(-30, 30), vy: rnd(-20, 20), g: 20, life: 0.8, max: 0.8, col: '#4a4452', size: 1 }); }
    if (e.stateT <= 0 || e.hitWall || e.hitCeil) { e.state = 'fly'; e.atkCD = 2.2 + Math.random() * 1.6; }
    return;
  }
  e.state = 'fly';
  // the strongest light near (within 18 blocks), else the hero; round it in a jittery orbit
  if ((e.retarget = (e.retarget || 0) - dt) <= 0) { e.retarget = 0.8 + Math.random(); e.light = esNearestLight(Math.floor(ecx / T), Math.floor(ecy / T), 18); }
  let ox, oy;
  if (e.light && (!aggro || dist > 90)) { ox = (e.light[0] + 0.5) * T; oy = e.light[1] * T - 4; }
  else if (aggro) { ox = pl.x + pl.w / 2; oy = pl.y - 12; }
  else { ox = ecx + Math.sin(e.t * 0.7 + e.seed) * 30; oy = ecy + Math.cos(e.t * 0.9 + e.seed) * 14; }
  const ph0 = e.t * 3 + e.seed, tx = ox + Math.cos(ph0) * (12 + (e.seed % 7)), ty = oy + Math.sin(ph0 * 1.3) * 8;
  const ux = wdx(Math.floor(tx / T) - Math.floor(ecx / T)) * T + (tx % T) - (ecx % T), uy = ty - ecy, d = Math.hypot(ux, uy) || 1;
  e.vx += ux / d * 260 * dt + rnd(-90, 90) * dt; e.vy += uy / d * 260 * dt + rnd(-90, 90) * dt; drag(0.25);
  if (Math.abs(e.vx) > 2) e.facing = Math.sign(e.vx);
  if (aggro && e.atkCD <= 0 && dist < 70 && dist > 16 && losClear(ecx, ecy, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'tell'; e.stateT = 0.5; e.facing = Math.sign(dx) || e.facing; sfx.escAsas(0.5); }
};

/* ---------- the eyeless watcher ---------- */
const escOrbs = [];   // the slow spheres of dark: { x, y, vx, vy, t, dmg, src }
AI.semolhos = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  e.vx = approach(e.vx, 0, 300 * dt);
  // it turns its face slowly
  if (aggro) { e.turnT = (e.turnT || 0) + dt; if (e.turnT > 0.9 && Math.sign(dx) !== e.facing) { e.facing = Math.sign(dx) || e.facing; e.turnT = 0; } }
  if (e.state === 'open') {
    if (e.stateT <= 0) {
      const mx = e.x + e.w / 2 + e.facing * 1.5, my = e.y + 13, a = Math.atan2(pl.y + pl.h / 2 - my, pl.x + pl.w / 2 - mx);
      escOrbs.push({ x: mx, y: my, vx: Math.cos(a) * 62, vy: Math.sin(a) * 62, t: 0, dmg: e.dmg, src: e });
      e.state = 'still'; e.atkCD = 3.2 + Math.random() * 1.4; sfx.escOrbe();
    }
    return;
  }
  e.state = 'still';
  if (aggro && e.sees && e.atkCD <= 0 && dist < 170 && Math.sign(dx) === e.facing) { e.state = 'open'; e.stateT = 0.8; sfx.escAbre(); }
};

/* ---------- the colossus of dark ---------- */
AI.colosso = function (e, dt, dx, dy, dist, aggro) {
  const L = escLightE(e);
  if (L >= 0.35 && e.state !== 'slam') {   // the light on it: frozen mid-step
    if (e.state !== 'frozen') { e.prevState = e.state === 'raise' ? 'walk' : e.state; e.state = 'frozen'; sfx.escPetrifica(); }
    e.vx = 0; e.stateT = Math.max(e.stateT, 0); e.t -= dt;   // its animation held
    return;
  }
  if (e.state === 'frozen') e.state = 'walk';
  e.stateT -= dt;
  if (e.state === 'raise') {
    e.vx = approach(e.vx, 0, 500 * dt);
    if (e.stateT <= 0) {
      e.state = 'slam'; e.stateT = 0.35;
      const S = e.slamAt; shake(5); sfx.escSoco();
      if (S && !pl.dead && Math.abs(pl.x + pl.w / 2 - S.x) < 18 && Math.abs(pl.y + pl.h - S.y) < 14 && pl.onGround) hurtPlayer(e.dmg, S.x, e, false);
      if (S) for (let k = 0; k < 14; k++) parts.push({ x: S.x + rnd(-10, 10), y: S.y - 1, vx: rnd(-50, 50), vy: rnd(-120, -40), g: 420, life: 0.6, max: 0.6, col: k % 3 ? '#151821' : '#7aa2dc', size: 1 });
      e.cracks = null;
    }
    return;
  }
  if (e.state === 'slam') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.8 + Math.random(); } return; }
  e.state = 'walk';
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 70 && Math.abs(dy) < 24 && clearPath(e, pl)) {
    e.state = 'raise'; e.stateT = 0.9; e.facing = Math.sign(dx) || e.facing;
    const tx = pl.x + pl.w / 2, ty = e.y + e.h; e.slamAt = { x: tx, y: ty }; e.cracks = { x0: e.x + e.w / 2 + e.facing * 10, x1: tx, y: ty, t: 0 };
    sfx.escRonco();
    return;
  }
  if (aggro) { const nav = !e.sees && e.nav && e.nav.kind !== 'here' ? e.nav : null; escWalk(e, dt, nav ? nav.dir : Math.abs(dx) > 10 ? Math.sign(dx) : 0, 58 + e.lvl * 0.6, 200, dy, true); }
  else { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } escWalk(e, dt, e.wander, 24, 150, 0, false); }
};

/* ---------- blows, deaths, spawns ---------- */
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (ESC1_TYPES.includes(e.type)) { const cx = e.x + e.w / 2, cy = e.y + e.h / 2; for (let k = 0; k < 16; k++) parts.push({ x: cx + rnd(-e.w / 2, e.w / 2), y: cy + rnd(-e.h / 2, e.h / 2), vx: rnd(-14, 14), vy: rnd(-40, -10), g: -8, life: 1.2, max: 1.2, col: k % 3 ? '#0a0a12' : '#2c344c', size: 1, smoke: true }); }
  return r;
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const r = _hit(e, dir, mult, melee);
  if (e && !e.dead && e.type === 'colosso' && e.stun > 0 && e.stun < 0.5) e.stun = 0.05;   // too heavy to flinch
  if (e && !e.dead && e.type === 'semolhos' && e.state === 'open' && e.stun > 0) { e.state = 'still'; e.atkCD = Math.max(e.atkCD, 1.4); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !ESC1_TYPES.includes(type)) return e;
  for (let k = 0; k < 4 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.state = type === 'traca' ? 'fly' : type === 'bocabreu' ? 'lurk' : type === 'semolhos' ? 'still' : 'walk';
  e.atkCD = 0.8 + Math.random();
  return e;
}; }
// the orbs fly, the rings of teeth shut, the crack runs
HOOK.update.push(dt => {
  for (let i = escOrbs.length - 1; i >= 0; i--) {
    const o = escOrbs[i]; o.t += dt;
    const a = Math.atan2(pl.y + pl.h / 2 - o.y, pl.x + pl.w / 2 - o.x), sp = Math.hypot(o.vx, o.vy) || 1;   // it drifts after him, a little
    o.vx += Math.cos(a) * 30 * dt; o.vy += Math.sin(a) * 30 * dt; const k = 62 / Math.hypot(o.vx, o.vy); o.vx *= k; o.vy *= k;
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (Math.random() < dt * 20) parts.push({ x: o.x + rnd(-2, 2), y: o.y + rnd(-2, 2), vx: rnd(-4, 4), vy: rnd(-4, 4), g: 0, life: 0.5, max: 0.5, col: '#05060a', size: 1 });
    let dead = o.t > 5 || solidAt(Math.floor(o.x / T), Math.floor(o.y / T));
    if (!dead && !pl.dead && o.x > pl.x - 3 && o.x < pl.x + pl.w + 3 && o.y > pl.y - 3 && o.y < pl.y + pl.h + 3) {
      const r = hurtPlayer(o.dmg, o.x, o.src, true); dead = true;
      if (r === 'hit') esBlind(6, 0.88);
      burst(o.x, o.y, 10, '#0a0c14', 60, 0, 0.5);
    }
    if (dead) escOrbs.splice(i, 1);
  }
  for (let i = escBites.length - 1; i >= 0; i--) { const B = escBites[i]; B.t += dt; if (B.e.dead && !B.shut) { escBites.splice(i, 1); continue; } if (B.t > B.max && (B.shut || B.e.state !== 'tell')) escBites.splice(i, 1); }
  for (const e of enemies) if (e.type === 'colosso' && e.cracks) e.cracks.t += dt;
});
// over the dark: the spheres (a black core, a cold rim), the rings of white teeth, the pale crack running to the slam
HOOK.drawTop.push((cx, cy) => {
  for (const o of escOrbs) {
    const x = Math.round(o.x - cx), y = Math.round(o.y - cy);
    lc.fillStyle = '#020204'; lc.fillRect(x - 2, y - 2, 5, 5);
    lc.fillStyle = '#7aa2dc'; for (let a = 0; a < 10; a++) { const t = a / 10 * Math.PI * 2 + gameTime * 3; lc.fillRect(Math.round(x + Math.cos(t) * 3.4), Math.round(y + Math.sin(t) * 3.4), 1, 1); }
  }
  for (const B of escBites) {
    const k = B.shut ? 1 - B.t / B.max : Math.min(1, B.t / 0.25), r = B.shut ? 3 + 9 * (1 - k) : 13;
    if (k <= 0) continue;
    const x = Math.round(B.x - cx), y = Math.round(B.y - cy);
    lc.globalAlpha = Math.max(0, k);
    for (let i = 0; i < 16; i++) { const a = Math.PI + i / 15 * Math.PI, tx = Math.round(x + Math.cos(a) * r), ty = Math.round(y + Math.sin(a) * r * 0.45); lc.fillStyle = '#e6ecf4'; lc.fillRect(tx, ty, 1, 2); if (i % 2) { lc.fillStyle = '#a4aabb'; lc.fillRect(tx, ty + 2, 1, 1); } }
    for (let i = 0; i < 14; i++) { const a = i / 13 * Math.PI, tx = Math.round(x + Math.cos(a) * r), ty = Math.round(y + 1 + Math.sin(a) * 2); lc.fillStyle = '#e6ecf4'; lc.fillRect(tx, ty - 1, 1, 1); }
  }
  lc.globalAlpha = 1;
  for (const e of enemies) {
    if (e.dead || e.type !== 'colosso' || !e.cracks || e.state !== 'raise') continue;
    const C = e.cracks, k = clamp(C.t / 0.9, 0, 1), x0 = C.x0, x1 = x0 + (C.x1 - x0) * k, y = Math.round(C.y - cy) - 1;
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x += 1) { lc.fillStyle = (Math.floor(x) + Math.floor(gameTime * 20)) % 3 ? '#7aa2dc' : '#e6f0ff'; lc.fillRect(Math.round(x - cx), y + (Math.floor(x) % 4 === 0 ? -1 : 0), 1, 1); }
  }
});
{ const _nw = newWorld; newWorld = function (sd, sv) { escOrbs.length = 0; escBites.length = 0; esc1Tables(); return _nw(sd, sv); }; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  escGarra() { noise(0.12, 0.08, 2600, 'bandpass', 0, 2); noise(0.1, 0.05, 1800, 'bandpass', 0.06, 2); },
  escSopro(v = 1) { noise(0.7, 0.05 * v, 500, 'bandpass', 0, 1.2); noise(0.5, 0.025 * v, 1400, 'bandpass', 0.2, 2); },
  escMorde() { noise(0.1, 0.12, 900, 'lowpass'); tone(90, 0.12, 'square', 0.05, -40); noise(0.06, 0.06, 3200, 'highpass', 0.02); },
  escAsas(v = 1) { for (let k = 0; k < 6; k++) noise(0.03, 0.025 * v, 1800 + Math.random() * 900, 'bandpass', k * 0.03, 3); },
  escAbre() { tone(70, 0.8, 'sine', 0.04, 20); noise(0.8, 0.03, 300, 'lowpass'); },
  escOrbe() { tone(110, 0.6, 'sine', 0.05, -50); noise(0.4, 0.04, 600, 'lowpass'); },
  escPetrifica() { noise(0.25, 0.06, 1200, 'bandpass', 0, 3); tone(140, 0.2, 'triangle', 0.03, -60); },
  escRonco() { tone(52, 0.9, 'sawtooth', 0.05, -10); noise(0.8, 0.06, 220, 'lowpass'); },
  escSoco() { noise(0.4, 0.2, 260, 'lowpass'); tone(48, 0.5, 'square', 0.1, -20); }
});
