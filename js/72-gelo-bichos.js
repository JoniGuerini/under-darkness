'use strict';

/* ================= the beasts of the ice =================
   Living things and spirits of the cold, no undead: the yeti (the big one: plods, raises both fists and pounds
   the floor so a short shockwave runs along it, or tears a block of ice loose and hurls it in an arc; blows
   barely move it), the frost wolf (packs of two or three; crouches, then a long leaping bite), the blizzard
   spirit (flies, keeps away, throws a fan of ice shards that slow you), the frost worm (swims inside snow and
   ice; a crack in the floor under you is the only warning before it bursts out biting; then it lies exposed
   for a moment before burrowing again), the ice sentinel (a golem of blue ice whose slab of an arm turns blows
   from the front; a slow, heavy smash; it shatters into flying shards when it dies) and the icy slime.
   Cold-blooded: the Nevasca only slows them a little and never freezes them (see the end of this file).
   Same art rules as 55-caverna-bichos (ramps lit from the top left, grain, 1px dark outline, painted once and
   cached). Stats here are the base values: 49-itens-efeitos scales every ET entry by its BAL. Loads before 68,
   so the Nevasca's slow-motion wrapper covers these AIs too. */

/* ---------- stats ---------- */
Object.assign(ET, {
  yeti: { name: 'Yeti', w: 18, h: 28, hp: 140, dmg: 20, xp: 50, kb: 0.15, fly: false, blood: '#9ac4e0' },
  lobo: { name: 'Lobo da Geada', w: 18, h: 11, hp: 48, dmg: 12, xp: 22, kb: 0.7, fly: false, blood: '#8a2a2a' },
  espirito: { name: 'Espírito da Nevasca', w: 12, h: 14, hp: 36, dmg: 11, xp: 24, kb: 0.8, fly: true, blood: '#cfeeff' },
  verme: { name: 'Verme da Geada', w: 22, h: 9, hp: 60, dmg: 14, xp: 28, kb: 0.3, fly: false, blood: '#6a8aa0' },
  sentinela: { name: 'Sentinela de Gelo', w: 14, h: 24, hp: 120, dmg: 16, xp: 40, kb: 0.2, fly: false, blood: '#a8dcf4' }
});
const IC_BEASTS = { yeti: 1, lobo: 1, espirito: 1, verme: 1, sentinela: 1, yetiancestral: 1 };   // cold-blooded (74 adds the boss's art)
// the icy slime: variant 7 (CV_SLIME is read lazily the first time a slime is drawn)
CV_SLIME.push({ base: '#5aa4cc', light: '#e2f6ff', dark: '#142e48', core: '#22547a', blood: '#a8dcf4' });
SLIME_BLOOD.push('#a8dcf4');
const IC_SLIME = 3 + CV_SLIME.length;

/* ---------- materials ---------- */
Object.assign(ICON_ART, {
  yetiFur: [["..wwww...", ".wWWWWw..", "wWWwWWWw.", "wWwWWwWww", ".wWWWwWw.", "..wWwWw..", "...w.w..."], { w: '#8aa0b8', W: '#eef6fc' }],
  wolfFang: [["......o..", ".....oO..", "....oOo..", "...oOo...", "..oOo....", ".oOo.....", "oOo......", "oo......."], { o: '#b8b0a0', O: '#f4f0e6' }],
  frostEssence: [["....c....", "...cCc...", "..cCWCc..", ".cCWWWCc.", "..cCWCc..", "...cCc...", "....c...."], { c: '#2a7ab4', C: '#7cd0f4', W: '#ffffff' }],
  eternalShard: [["....bB...", "...bBB...", "..bBWB...", "..bBBb...", ".bBBb....", ".bBb.....", "bBb......"], { b: '#3a7aa8', B: '#a8e0fa', W: '#ffffff' }]
});
Object.assign(ITEMS, {
  pelo_yeti: { name: 'Pelo de Yeti', rar: 1, stack: 99, icon: 'yetiFur', desc: 'Um tufo branco e grosso. Esquenta mais que qualquer lã. Material.' },
  presa_lobo: { name: 'Presa de Lobo', rar: 0, stack: 99, icon: 'wolfFang', desc: 'Uma presa comprida, fria como gelo. Material.' },
  essencia_gelida: { name: 'Essência Gélida', rar: 1, stack: 99, icon: 'frostEssence', desc: 'Um pedaço de nevasca que não derrete. Gira sozinho na mão. Material.' },
  lasca_eterna: { name: 'Lasca de Gelo Eterno', rar: 2, stack: 99, icon: 'eternalShard', desc: 'Gelo que não derrete nem no fogo da forja. Material.' }
});
Object.assign(DROPS, {
  yeti: [['pelo_yeti', 0.7, 1, 2], ['carne', 0.4, 1, 2], ['pocao', 0.14], ['elmo_ouro', 0.03], ['manto', 0.03], ['machado_ouro', 0.03], ['escudo_ouro', 0.025], ['grevas_demonio', 0.015]],
  lobo: [['presa_lobo', 0.6], ['carne', 0.35], ['pocao', 0.07], ['botas_ferro', 0.03], ['anel_furia', 0.015], ['amuleto_vento', 0.012]],
  espirito: [['essencia_gelida', 0.55], ['pocao', 0.1], ['pedra_lunar', 0.025], ['manto_espectral', 0.03], ['lanterna_fantasma', 0.02]],
  verme: [['carne', 0.5, 1, 2], ['presa_lobo', 0.25], ['pocao', 0.1], ['anel_vida', 0.02]],
  sentinela: [['lasca_eterna', 0.45], ['min_ouro', 0.25], ['pocao', 0.1], ['lamina_cristal', 0.03], ['adaga_cristal', 0.03], ['lanca_cristal', 0.03], ['escudo_torre', 0.03], ['armadura_placas', 0.025]]
});
for (const k of ['yeti', 'lobo', 'espirito', 'verme', 'sentinela']) DROPS[k] = DROPS[k].filter(([id]) => ITEMS[id]);
Object.assign(NAV_WALKERS, { yeti: 1, lobo: 1, verme: 1, sentinela: 1 });
Object.assign(CV_STEP, { yeti: 1, lobo: 1, verme: 1, sentinela: 1 });

/* ================= art ================= */
const ICB = {};   // cached sprite sets
{
const { cg } = CVART;
const { cp, set } = CVB;
const R7 = hexes => hexes.map(h => ph(h));
const RI = {
  pelo: R7(['#26303e', '#425266', '#66788e', '#90a4ba', '#b8c8da', '#dae6f0', '#f6fbff']),
  cara: R7(['#121218', '#1e1e26', '#2e2e38', '#42424e', '#585866', '#70707e', '#8c8c9a']),
  olho: R7(['#06243a', '#0a4064', '#126894', '#2496c4', '#5cc4ea', '#a8e8fa', '#ffffff']),
  osso: R7(['#26282a', '#3e4244', '#5e6466', '#82898c', '#a8b0b2', '#c8d2d6', '#e8f2f6']),
  lobo: R7(['#161b24', '#262e3a', '#3c4656', '#566274', '#768498', '#9cacbe', '#c8d4e0']),
  boca: R7(['#200608', '#3a0c10', '#5a1418', '#7c2024', '#a03034', '#c04c4c', '#e07a76']),
  gelo: R7(['#10283e', '#1c4466', '#30668e', '#5090b8', '#80bcdc', '#b8e0f4', '#effaff']),
  azul: R7(['#061630', '#0b2850', '#123e76', '#1c5c9e', '#3282c4', '#64b0e4', '#b4e2fa']),
  nucleo: R7(['#06203a', '#0a3a62', '#12608e', '#1e8ec0', '#46bce6', '#9ae4fa', '#eafcff']),
  verme: R7(['#1a2028', '#2c3642', '#44525e', '#62727e', '#8696a0', '#aebcc4', '#d6e0e6']),
  neve: R7(['#3a475a', '#566880', '#7a8ea8', '#a0b6cc', '#c6d8e8', '#e4eff8', '#ffffff'])
};
const shag = s => (x, y, dx, dy) => (hash2(x, y, s) < 0.22 ? 0.9 : 0) + ((x * 3 + y * 2) % 7 === 0 ? -0.8 : 0);   // shaggy fur: tufts and dark partings

// a thick limb along a polyline: first a dark rim one pixel wider (it separates the limb from the fur behind), then the
// limb itself, lit from the top left
function limb(P, pts, r, R, base, s, rimV = 0.6) {
  const each = fn => { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 2)); for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n); } };
  each((cx, cy) => { const rr = r + 0.9; for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rr) P.put(x, y, R, rimV); });
  each((cx, cy) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r; if (dx * dx + dy * dy > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 + (hash2(x, y, s) < 0.2 ? 0.7 : 0) + ((x * 3 + y * 2) % 7 === 0 ? -0.7 : 0)); } });
}
/* the yeti, 30 x 34 (on a 30 x 37 canvas) facing right: 0-1 walk, 2 fists raised, 3 fists slammed down, 4 a block held over its head, 5 throw.
   Built like a great ape: a hump of shoulders, the head slung low in front of it, long arms down to the floor, short legs */
function yetiFrame(pose, big, k = 1) {
  // k scales the whole drawing (the Yeti Ancestral is drawn at k 1.8): shapes are redrawn at the new size, not blown up
  const W = Math.round(30 * k), H = Math.round(37 * k), P = cp(W, H), O = 3;   // 3 px of headroom for the raised fists
  const L = (pts, r, ...a) => limb(P, pts.map(([x, y]) => [x * k, (y + O) * k]), r * k, ...a);
  const B = (x, y, rx, ry, ...a) => P.blob(x * k, (y + O) * k, rx * k, ry * k, ...a);
  const U = (x, y, R, v) => { const n = Math.max(1, Math.round(k)); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) P.put(Math.round(x * k) + i, Math.round((y + O) * k) + j, R, v); };
  const Ln = (x1, y1, x2, y2, R, v) => { P.line(x1 * k, (y1 + O) * k, x2 * k, (y2 + O) * k, R, v); if (k > 1.3) P.line(x1 * k + 1, (y1 + O) * k, x2 * k + 1, (y2 + O) * k, R, v - 0.6); };
  const s = 7801 + pose * 5 + (big ? 90 : 0);
  const F = RI.pelo, C = RI.cara, low = pose === 3 ? 2 : 0, step = pose === 1 ? 1 : pose === 0 ? -1 : 0;
  const up = pose === 2 || pose === 4;
  // [shoulder, elbow, fist] for the far and the near arm
  const arms = pose === 2 ? [[[12, 12], [10, 6], [12, 2]], [[19, 12], [22, 6], [20, 1.5]]]
    : pose === 4 ? [[[12, 12], [9, 7], [11, 3.5]], [[19, 12], [23, 7], [21, 3]]]
    : pose === 3 ? [[[13, 14], [18, 21], [21, 30.5]], [[19, 14], [24, 21], [26, 30.5]]]
    : pose === 5 ? [[[12, 13], [9, 19], [8, 24]], [[18, 16], [23, 18], [28.5, 17]]]
    : [[[12, 13], [10 - step, 20], [9 - step * 1.5, 27]], [[17, 15], [21, 21], [22.5 + step * 1.5, 28]]];
  // far arm and far leg, in shadow
  L(arms[0], 2.2, F, 1.8, s + 1);
  B(arms[0][2][0], arms[0][2][1], 2.4, 2.2, C, s + 2, 1.8);
  L([[11, 25], [11 - step * 1.4, 31]], 2.4, F, 2, s + 3);
  B(11 - step * 1.4, 33, 3, 1.2, C, s + 4, 1.6);
  // body: the hump of the shoulders and the barrel of the belly
  B(13, 22 + low * 0.5, 7.8, 7.4, F, s, 2.4, (x, y, dx, dy) => shag(s)(x, y) + (dx > 0.3 && dy > 0 ? -0.5 : 0));
  B(15.5, 14 + low, 8.8, 7.6, F, s + 11, 2.9, (x, y, dx, dy) => shag(s + 11)(x, y) + (dy > 0.6 ? -0.6 : 0));
  for (let k = 0; k < 8; k++) { const x = 6.5 + k * 1.9, y = 28 + low * 0.5 + (k % 2); Ln(x, y - 1, x - 0.4, y + 1.5, F, 1.8); }   // the shaggy hem
  L([[16, 26], [16 + step * 1.4, 31]], 2.7, F, 2.6, s + 5);
  B(17 + step * 1.4, 33, 3.4, 1.2, C, s + 6, 2.6);   // near foot
  if (big) for (const [x, y] of [[9, 9], [12, 7.5], [15, 7], [18, 7.5]]) for (let j = 0; j < 5; j++) U(x + j * 0.25, y - j + low, RI.gelo, 5.6 - j * 0.4);   // ice crystals growing on the old one's back
  // near arm: long and thick, a big dark fist with claws
  L(arms[1], 2.8, F, 2.8, s + 9);
  const [fx, fy] = arms[1][2];
  B(fx, fy, 3, 2.7, C, s + 10, 3.2);
  for (let k = -1; k <= 1; k++) U(fx + (up ? k * 1.2 : 2.6), fy + (up ? -2.6 : k * 1.2), RI.osso, 5.2);
  // head: slung low in front of the hump; a dark bare face under a fringe of fur
  const hx = pose === 3 ? 24 : up ? 21 : pose === 5 ? 22 : 23.5, hy = pose === 3 ? 15 : up ? 10 : 11.5;
  B(hx, hy, 4.6, 4.4, F, s + 7, 3.2, shag(s + 7));
  B(hx + 1.8, hy + 1, 3.3, 3.1, C, s + 8, 3.4);
  U(hx + 1, hy - 2, F, 5.6); U(hx + 2, hy - 2, F, 5.6); U(hx + 3, hy - 1.6, F, 5); U(hx + 1, hy - 1, C, 0.6); U(hx + 2.6, hy - 1, C, 0.6);   // the heavy brow
  U(hx + 1.2, hy, RI.olho, 5.8); U(hx + 3.2, hy, RI.olho, 4.8);   // eyes
  const roar = pose === 2 || pose === 3 || pose === 5;
  if (roar) { for (let x = hx; x <= hx + 3; x++) { U(x, hy + 2, RI.boca, 2.6); U(x, hy + 3, RI.boca, 1.6); } U(hx + 0.5, hy + 1.6, RI.osso, 5.8); U(hx + 3, hy + 1.6, RI.osso, 5.8); U(hx + 0.5, hy + 3.6, RI.osso, 5); }   // a roaring mouth, fangs
  else { Ln(hx + 0.5, hy + 2.6, hx + 3.5, hy + 2.6, RI.boca, 1.6); U(hx + 3.4, hy + 1.8, RI.osso, 5.4); }
  if (big) { Ln(hx - 2, hy - 3, hx - 5, hy - 7, RI.osso, 4.4); Ln(hx - 5, hy - 7, hx - 3, hy - 9, RI.osso, 5); Ln(hx + 0.5, hy - 4, hx + 0.5, hy - 8, RI.osso, 4.6); Ln(hx + 0.5, hy - 8, hx + 2.5, hy - 9.5, RI.osso, 5.2); }   // the ancestor's horns
  return P.done();
}
/* the frost wolf, 24 x 14 facing right: 0-1 run, 2 crouch, 3 leap with jaws open */
function wolfFrame(pose) {
  const W = 24, H = 14, P = cp(W, H), s = 7901 + pose * 3, L = RI.lobo;
  const low = pose === 2 ? 1.6 : 0, leap = pose === 3, ph = pose === 1 ? 1 : -1;
  const legs = leap ? [[[6, 8], [1, 11]], [[16, 8.5], [22, 10]]] : pose === 2 ? [[[6, 9], [3, 13.4]], [[16, 9.5], [18, 13.4]]] : [[[6, 8.5], [6 + ph * 2.2, 13.4]], [[16, 9], [16 - ph * 2.2, 13.4]]];
  for (const [[hx, hy], [fx, fy]] of legs) P.line(hx + 1, hy + low, fx + 1.2, fy, L, 1.4);   // far legs
  P.line(4, 7 + low, 0.5, 4 + low + (leap ? 2 : 0), L, 3.6); P.line(3, 7.6 + low, 0, 5.4 + low + (leap ? 2 : 0), L, 2.6);   // the brush of a tail
  P.blob(10.5, 7.4 + low, 7.4, 3.4, L, s, 3.4, (x, y, dx, dy) => (dy < -0.5 ? 1.1 : 0) + (hash2(x, y, s) < 0.2 ? 0.6 : 0));   // body, frost along the back
  P.blob(16.5, 7.4 + low, 3.6, 3.4, L, s + 1, 3.8);   // the ruff
  const hx = leap ? 20.5 : 20, hy = (leap ? 6 : 5) + low;
  P.blob(hx, hy, 3, 2.5, L, s + 2, 4);
  P.line(hx + 2, hy + 0.6, hx + 4, hy + 1, L, 4.2); P.put(hx + 4, hy + 0.6, RI.cara, 1);   // snout, nose
  if (leap) { P.line(hx + 2, hy + 2.2, hx + 3.8, hy + 3.4, L, 3); P.put(hx + 2.6, hy + 1.6, RI.boca, 3); P.put(hx + 3.4, hy + 2, RI.osso, 5.6); }   // jaws open
  P.put(hx - 1, hy - 2.4, L, 4.4); P.put(hx - 1, hy - 3.2, L, 3.6); P.put(hx + 0.6, hy - 2.6, L, 4); P.put(hx + 0.6, hy - 3.4, L, 3.2);   // ears
  P.put(hx + 1, hy - 0.6, RI.olho, 5.6);
  for (const [[hx2, hy2], [fx, fy]] of legs) { P.line(hx2, hy2 + low, fx, fy, L, 3.8); P.put(fx, fy, L, 2.6); }   // near legs
  return P.done();
}
/* the blizzard spirit, 16 x 20: a hooded swirl of snow with two cold eyes; 0-1 drifting, 2 casting (arms of wind raised) */
function spiritFrame(pose) {
  const W = 16, H = 20, P = cp(W, H), s = 7951 + pose * 4, N = RI.neve, sway = pose === 1 ? 1 : pose === 0 ? -1 : 0;
  for (let y = 4; y < 20; y++) {
    const t = (y - 4) / 16, half = (1 - t) * 5.2 + 0.5, cx = 8 + Math.sin(t * 4 + sway) * t * 2.4;
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) { if (hash2(x, y, s) < t * 0.55) continue; P.put(x, y, N, 4.4 - (x + 0.5 - cx) / half * 1.2 - t * 1.6 + cg(x, y, s) * 0.5); }   // the body thins into a wisp
  }
  P.blob(8, 6, 5, 5, N, s + 1, 4.2);                       // the hood
  P.blob(8.6, 7, 3, 3, RI.azul, s + 2, 1.4);               // the hollow face
  P.put(7.4, 6.6, RI.olho, 6); P.put(9.6, 6.6, RI.olho, 6); P.put(7.4, 7.4, RI.olho, 4.6); P.put(9.6, 7.4, RI.olho, 4.6);
  const arm = pose === 2 ? [[3, 9, 0, 3], [13, 9, 16, 3]] : [[3, 10, 1, 14 + sway], [13, 10, 15, 14 - sway]];
  for (const [ax, ay, bx, by] of arm) P.line(ax, ay, bx, by, N, 4.6);
  if (pose === 2) for (const [x, y] of [[0, 2], [15, 2], [1, 1], [14, 1]]) P.put(x, y, RI.nucleo, 6);
  return P.done();
}
/* the frost worm, 32 x 12 facing right: segmented, pale, frost spines along its back; 0 mouth shut, 1 mouth open */
function wormFrame(pose) {
  const W = 32, H = 12, P = cp(W, H), s = 8001 + pose, V = RI.verme;
  for (let k = 0; k < 8; k++) {
    const x = 3 + k * 3.3, r = 2 + k * 0.42, y = 7 + Math.sin(k * 0.9) * 0.6;
    P.blob(x, y, r * 0.9, r, V, s + k, 3.2, (xx, yy, dx) => (Math.abs(dx) > 0.75 ? -1.2 : 0));   // a ring
    if (k > 1) { P.put(x - 0.5, y - r - 0.6, RI.gelo, 5.4); P.put(x - 0.5, y - r - 1.4, RI.gelo, 4.6); }   // spines
  }
  const hx = 28.5, hy = 6.5;
  P.blob(hx, hy, 3.2, 4.6, V, s + 9, 3.8);
  if (pose === 1) { P.blob(hx + 1.6, hy, 1.8, 3.4, RI.boca, s, 2.6); for (let k = -2; k <= 2; k++) P.put(hx + 1 + (Math.abs(k) === 2 ? 0 : 1), hy + k * 1.3, RI.osso, 5.6); }   // the round mouth and its teeth
  else { P.line(hx + 2.6, hy - 2, hx + 2.6, hy + 2, RI.boca, 2); P.put(hx + 3, hy - 1, RI.osso, 5); P.put(hx + 3, hy + 1, RI.osso, 5); }
  return P.done();
}
/* the ice sentinel, 24 x 28 facing right: a golem of faceted blue ice with a glowing core; its near arm is a slab
   held in front like a shield, the far arm a club of ice. 0-1 walk, 2 club raised, 3 club smashed down */
function sentinelFrame(pose) {
  const W = 24, H = 28, P = cp(W, H), s = 8051 + pose * 3, G = RI.gelo, A = RI.azul, step = pose === 1 ? 1 : pose === 0 ? -1 : 0;
  const facet = (x0, y0, w, h, R, base) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const x = x0 + i, y = y0 + j; let v = base + 1 - i / w * 1.6 - j / h * 0.8 + cg(x, y, s) * 0.3; if (i + j * 0.6 < 1.6) v += 1.5; if (Math.abs(i - j * 0.5 - w * 0.4) < 0.5) v += 0.9; if (i === w - 1 || j === h - 1) v -= 1; P.put(x, y, R, v); } };
  // the club arm, behind
  const club = pose === 2 ? [[8, 10], [4, 0]] : pose === 3 ? [[9, 11], [22, 22]] : [[8, 11], [5 + step, 22]];
  P.line(club[0][0], club[0][1], club[1][0], club[1][1], A, 2.4); P.line(club[0][0] + 1, club[0][1], club[1][0] + 1, club[1][1], A, 1.8);
  P.blob(club[1][0], club[1][1], 3.2, 3.2, A, s, 2.8);
  // legs
  facet(6 - step, 20, 4, 8, A, 2.6); facet(12 + step, 20, 4, 8, G, 2.8);
  // body
  facet(5, 7, 12, 14, G, 3);
  P.blob(11, 13, 2.4, 2.6, RI.nucleo, s + 1, 4.6); P.put(10.6, 12.4, RI.nucleo, 6);   // the core
  for (const [x, y] of [[7, 9], [15, 17], [8, 18]]) P.line(x, y, x + 2, y - 2, G, 6);   // cracks of light
  // head: a block with a slit of light
  facet(8, 1, 7, 6, G, 3.2); P.line(10, 3.5, 14, 3.5, RI.nucleo, 6);
  for (const [x, l] of [[9, 2], [12, 3], [14, 1]]) for (let j = 0; j < l; j++) P.put(x, 0 - j + 1, G, 5.6 - j);   // crystal crown
  // the slab arm in front
  facet(16, 8, 6, 15, G, 3.4);
  for (let j = 0; j < 15; j++) if (j % 4 === 1) P.put(21, 8 + j, G, 1.4);
  return P.done();
}
// built lazily the first time one is drawn
ICB.get = () => ICB.ready || (ICB.ready = {
  yeti: [0, 1, 2, 3, 4, 5].map(p => set(yetiFrame(p, false))),
  lobo: [0, 1, 2, 3].map(p => set(wolfFrame(p))),
  espirito: [0, 1, 2].map(p => set(spiritFrame(p))),
  verme: [0, 1].map(p => set(wormFrame(p))),
  sentinela: [0, 1, 2, 3].map(p => set(sentinelFrame(p)))
});
Object.assign(ICB, { RI, yetiFrame, set });   // for the Yeti Ancestral (74)
}

/* ================= drawing ================= */
let icEyeGlow = null;
const icEye = () => icEyeGlow || (icEyeGlow = glow(6, '#8fdcff'));
DRAW_E.yeti = (e, fx, fy, fl) => {
  const B = ICB.get().yeti, k = e.state === 'raise' ? 2 : e.state === 'slam' ? 3 : e.state === 'lift' ? 4 : e.state === 'throw' ? 5 : Math.abs(e.vx) > 6 ? Math.floor(e.t * 5) % 2 : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 15 - e.facing * 2, fy - 37);
  if (e.state === 'lift') icDrawBoulder(fx - e.facing * 1, fy - 37, 1);
};
DRAW_E.lobo = (e, fx, fy, fl) => {
  const B = ICB.get().lobo, k = e.state === 'wind' ? 2 : e.state === 'bite' || !e.onGround ? 3 : Math.abs(e.vx) > 8 ? Math.floor(e.t * 12) % 2 : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 12, fy - 14);
};
DRAW_E.espirito = (e, fx, fy, fl) => {
  const B = ICB.get().espirito, k = e.state === 'cast' ? 2 : Math.floor(e.t * 4) % 2, bob = Math.round(Math.sin(e.t * 3) * 1.5);
  lc.globalAlpha = 0.88; lc.drawImage(cvPick(B[k], e, fl), fx - 8, fy - 18 + bob); lc.globalAlpha = 1;
};
DRAW_E.verme = (e, fx, fy, fl) => {
  const B = ICB.get().verme;
  if (e.state === 'under' || e.state === 'crack') {   // hidden: a bump moving under the floor, or the crack before it bursts out
    lc.fillStyle = e.state === 'crack' ? '#cfeeff' : '#8fa8bc';
    if (e.state === 'crack') { const n = 5, a = Math.min(1, (0.8 - e.stateT) / 0.6); for (let k = 0; k < n; k++) { const w = Math.round((k - 2) * 4 * a); lc.fillRect(fx + w, fy - 1 + (k % 2), 2, 1); } lc.fillRect(fx - 1, fy - 2, 3, 1); }
    else if (Math.abs(e.vx) > 4) { lc.fillRect(fx - 3, fy - 1, 6, 1); lc.fillRect(fx - 1, fy - 2, 2, 1); }
    return;
  }
  if (e.state === 'emerge' || e.state === 'dig') {   // rising out of the floor head first (or sinking back), clipped at the floor
    const t = e.state === 'emerge' ? clamp(1 - e.stateT / 0.45, 0, 1) : clamp(e.stateT / 0.45, 0, 1), img = cvPick(B[e.state === 'emerge' ? 1 : 0], e, fl);
    lc.save(); lc.beginPath(); lc.rect(fx - 20, fy - 40, 40, 40); lc.clip();
    lc.translate(fx, fy + 16 - t * 30); lc.rotate(-Math.PI / 2 * e.facing); lc.drawImage(img, -16, -6); lc.restore();
    return;
  }
  lc.drawImage(cvPick(B[e.state === 'bite' ? 1 : 0], e, fl), fx - 16, fy - 12 + (e.state === 'exposed' ? Math.round(Math.sin(e.t * 8)) : 0));
};
DRAW_E.sentinela = (e, fx, fy, fl) => {
  const B = ICB.get().sentinela, k = e.state === 'wind' ? 2 : e.state === 'smash' || e.state === 'recover' && e.stateT > 0.5 ? 3 : Math.abs(e.vx) > 4 ? Math.floor(e.t * 4) % 2 : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 12 + e.facing, fy - 28);
};
EYES_E.yeti = (e, fx, fy) => { lc.globalAlpha = e.state === 'raise' || e.state === 'lift' ? 0.85 : 0.45; lc.drawImage(icEye(), fx + e.facing * (e.state === 'slam' ? 8 : 6) - 6, fy - (e.state === 'slam' ? 28 : 32)); };
EYES_E.lobo = (e, fx, fy) => { lc.globalAlpha = e.state === 'wind' ? 0.8 : 0.4; lc.drawImage(icEye(), fx + e.facing * 9 - 6, fy - 15); };
EYES_E.espirito = (e, fx, fy) => { lc.globalAlpha = e.state === 'cast' ? 0.9 : 0.5; lc.drawImage(icEye(), fx - 6, fy - 17 + Math.round(Math.sin(e.t * 3) * 1.5)); };
EYES_E.verme = () => { };
EYES_E.sentinela = (e, fx, fy) => { lc.globalAlpha = 0.6 + (e.state === 'wind' ? 0.3 : 0); lc.drawImage(icEye(), fx + e.facing * 1 - 6, fy - 31); lc.globalAlpha = 0.3; lc.drawImage(icEye(), fx - e.facing * 1 - 6, fy - 21); };
WARN_E.yeti = e => e.state === 'raise' || e.state === 'lift';
WARN_E.lobo = e => e.state === 'wind';
WARN_E.espirito = e => e.state === 'cast';
WARN_E.verme = e => e.state === 'crack';
WARN_E.sentinela = e => e.state === 'wind';
// the sentinel's slab turns any blow from the front while it walks
BLOCK_E.sentinela = (e, dir) => (e.state === 'walk') && e.stun <= 0 && dir === -e.facing;

/* ================= projectiles: ice blocks, shards, flying splinters, the shockwave on the floor ================= */
const icProj = [], icWaves = [];
let icSlowT = 0;
const IC_G = 520;
function icThrow(kind, ox, oy, tx, ty, dmg, o) {
  if (kind === 'boulder') {   // a lob that lands on the target
    const t = clamp(Math.abs(tx - ox) / 150, 0.45, 1.1), vx = (tx - ox) / t, vy = (ty - oy - 0.5 * IC_G * t * t) / t;
    icProj.push(Object.assign({ kind, x: ox, y: oy, vx, vy, dmg, life: 3, g: IC_G, r: 4, spin: 0 }, o || {}));
  } else {   // a straight shard (or a splinter with gravity)
    const a = Math.atan2(ty - oy, tx - ox), sp = (o && o.sp) || 170;
    icProj.push(Object.assign({ kind, x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg, life: 2.2, g: 0, r: 1.5 }, o || {}));
  }
}
function icShatter(x, y, big) { burst(x, y, big ? 16 : 5, '#d6f0fc', big ? 110 : 60, 320, 0.5); burst(x, y, big ? 6 : 2, '#7cc8ec', 60, 200, 0.35, 1, true); if (big) { sfx.icShatter(); shake(2); } }
function icWave(x, y, dir, dmg, len = 70, o) { icWaves.push(Object.assign({ x, y, x0: x, dir, dmg, len, sp: 190, hit: false, t: 0 }, o || {})); }
function icUpdate(dt) {
  if (icSlowT > 0) icSlowT -= dt;
  for (let i = icProj.length - 1; i >= 0; i--) {
    const b = icProj[i]; b.life -= dt; b.vy = Math.min(b.vy + b.g * dt, 500); b.x += b.vx * dt; b.y += b.vy * dt; b.spin = (b.spin || 0) + dt * 8;
    if (b.kind === 'shard' && Math.random() < dt * 20) parts.push({ x: b.x, y: b.y, vx: rnd(-5, 5), vy: rnd(-5, 5), g: 0, life: 0.3, max: 0.3, col: '#cfeeff', size: 1 });
    let gone = b.life <= 0;
    const r = b.r || 1.5;
    if (!gone && !pl.dead && b.x > pl.x - r && b.x < pl.x + pl.w + r && b.y > pl.y - r && b.y < pl.y + pl.h + r) {
      const res = hurtPlayer(b.dmg, b.x - Math.sign(b.vx) * 4, null, true);
      if (res === 'hit' && b.slow) { icSlowT = Math.max(icSlowT, b.slow); floatText(pl.x + pl.w / 2, pl.y - 8, 'GELADO', '#a8dcf4', 0.8); }
      if (res !== 'none' || pl.invuln > 0) { gone = true; icShatter(b.x, b.y, b.kind === 'boulder'); if (b.kind === 'boulder' && b.split) icSplit(b); }
    }
    if (!gone && solidAt(Math.floor(b.x / T), Math.floor(b.y / T))) { gone = true; icShatter(b.x, b.y - 2, b.kind === 'boulder'); if (b.kind === 'boulder' && b.split) icSplit(b); }
    if (gone) icProj.splice(i, 1);
  }
  for (let i = icWaves.length - 1; i >= 0; i--) {
    const w = icWaves[i]; w.t += dt; w.x += w.dir * w.sp * dt;
    const tx = Math.floor(w.x / T), ty = Math.floor(w.y / T);
    if (solidAt(tx, ty - 1) || !solidAt(tx, ty) || Math.abs(w.x - w.x0) > w.len) { icWaves.splice(i, 1); continue; }   // a wall, a drop, or spent
    if (Math.random() < dt * 40) parts.push({ x: w.x + rnd(-3, 3), y: w.y - 1, vx: rnd(-20, 20) + w.dir * 30, vy: rnd(-90, -40), g: 360, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#e4f2fc' : '#8aa4bc', size: 1 });
    if (!w.hit && !pl.dead && pl.onGround && Math.abs(pl.x + pl.w / 2 - w.x) < 8 && Math.abs(pl.y + pl.h - w.y) < 6) { w.hit = true; hurtPlayer(w.dmg, w.x - w.dir * 6, null, true); }
  }
}
function icSplit(b) { for (let k = -1; k <= 1; k++) icProj.push({ kind: 'shard', x: b.x, y: b.y - 4, vx: k * 110 + rnd(-10, 10), vy: -170 - Math.abs(k) * 20, dmg: Math.max(1, Math.round(b.dmg * 0.5)), life: 1.6, g: IC_G, r: 1.5 }); }
HOOK.update.push(icUpdate);
// chilled to the bone: half speed while it lasts (the web's slow from 55 does the same; they don't stack)
{ const _up = updatePlayer; updatePlayer = function (dt) { if (icSlowT <= 0 || cvSlowT > 0) return _up(dt); const s = pl.spd; pl.spd = (1 + s) * 0.5 - 1; try { return _up(dt); } finally { pl.spd = s; } }; }
function icDrawBoulder(x, y, a) {   // a rough block of ice, centred on x, y
  lc.globalAlpha = a;
  lc.fillStyle = '#10283e'; lc.fillRect(x - 5, y - 4, 10, 8); lc.fillRect(x - 4, y - 5, 8, 10);
  lc.fillStyle = '#5090b8'; lc.fillRect(x - 4, y - 4, 8, 8);
  lc.fillStyle = '#b8e0f4'; lc.fillRect(x - 4, y - 4, 6, 2); lc.fillRect(x - 4, y - 2, 2, 3);
  lc.fillStyle = '#30668e'; lc.fillRect(x + 1, y + 1, 3, 3);
  lc.fillStyle = '#effaff'; lc.fillRect(x - 3, y - 3, 1, 1);
  lc.globalAlpha = 1;
}
HOOK.drawTop.push((cx, cy) => {
  for (const b of icProj) {
    const x = Math.round(b.x) - cx, y = Math.round(b.y) - cy;
    if (b.kind === 'boulder') { icDrawBoulder(x, y, 1); continue; }
    const ux = b.vx / (Math.hypot(b.vx, b.vy) || 1), uy = b.vy / (Math.hypot(b.vx, b.vy) || 1);
    lc.fillStyle = '#30668e'; lc.fillRect(Math.round(x - ux * 4), Math.round(y - uy * 4), 1, 1);
    lc.fillStyle = '#80bcdc'; lc.fillRect(Math.round(x - ux * 2.5), Math.round(y - uy * 2.5), 1, 1); lc.fillRect(Math.round(x - ux * 1.2), Math.round(y - uy * 1.2), 1, 1);
    lc.fillStyle = '#effaff'; lc.fillRect(x, y, 1, 1);
  }
  for (const w of icWaves) {   // a ridge of shattered ice running along the floor
    const x = Math.round(w.x) - cx, y = Math.round(w.y) - cy, h = 3 + Math.round(Math.sin(w.t * 30) * 1);
    lc.fillStyle = '#30668e'; lc.fillRect(x - 3, y - h, 7, h);
    lc.fillStyle = '#b8e0f4'; lc.fillRect(x - 2, y - h, 2, h - 1); lc.fillRect(x + 1, y - h + 1, 1, h - 1);
  }
  if (icSlowT > 0 && cvSlowT <= 0 && !pl.dead) {   // frost on the hero
    const x = Math.round(pl.x) - cx, y = Math.round(pl.y) - cy, a = Math.min(1, icSlowT * 1.5);
    lc.globalAlpha = 0.7 * a; lc.fillStyle = '#d6f0fc';
    for (let k = 0; k < 7; k++) lc.fillRect(x + ((k * 5 + 2) % (pl.w + 2)) - 1, y + 3 + ((k * 7) % (pl.h - 3)), 1, 1);
    lc.globalAlpha = 1;
  }
});
HOOK.drawGlow.push((cx, cy) => {
  if (!icProj.length) return;
  const g = icEye(); lc.globalCompositeOperation = 'lighter';
  for (const b of icProj) if (b.kind !== 'boulder') { lc.globalAlpha = 0.45; lc.drawImage(g, Math.round(b.x) - cx - 6, Math.round(b.y) - cy - 6); }
  lc.globalAlpha = 1;
});

/* ================= behaviour ================= */
function icWander(e, dt) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
const icFloorY = e => e.y + e.h;

// the yeti: plods; up close it raises both fists and pounds the floor (a short shockwave runs out in front);
// further off it tears up a block of ice and throws it
AI.yeti = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'raise') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'slam'; e.stateT = 0.4; e.swingHit = false; icYetiSlam(e, 1); } return; }
  if (e.state === 'slam') { e.vx = 0; if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.7; } return; }
  if (e.state === 'lift') { e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { e.state = 'throw'; e.stateT = 0.35; icThrow('boulder', ecx + e.facing * 4, e.y - 6, pl.x + pl.w / 2, pl.y + pl.h - 4, e.dmg, { split: false }); sfx.icThrow(); } return; }
  if (e.state === 'throw' || e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.3 + Math.random() * 0.8; } return; }
  if (!aggro) icWander(e, dt);
  let dir = aggro ? (Math.sign(dx) || 1) : e.wander;
  if (aggro && Math.abs(dx) < 18) dir = 0;
  if (dir) e.facing = dir; walk(e, dt, dir, 30 + e.lvl * 1.5, 380, 280, dy, aggro);
  if (!aggro || e.atkCD > 0 || !e.onGround) return;
  const adx = Math.abs(dx);
  if (adx < 40 && Math.abs(dy) < 26 && clearPath(e, pl)) { e.state = 'raise'; e.stateT = 0.65; e.facing = Math.sign(dx) || e.facing; sfx.icRoar(); }
  else if (adx > 70 && adx < 210 && dy > -70 && losClear(ecx, e.y - 4, pl.x + pl.w / 2, pl.y + 6) && Math.random() < 0.5) { e.state = 'lift'; e.stateT = 0.7; }
  else e.atkCD = 0.4;
};
// both fists into the floor: what stands right in front is hit, and a shockwave runs along the floor (n waves: 1 forward, 2 both ways)
function icYetiSlam(e, n, mult = 1) {
  const ecx = e.x + e.w / 2, fy = icFloorY(e), hb = { x: e.facing > 0 ? ecx : ecx - 30, y: e.y + 4, w: 30, h: e.h - 2 };
  if (!pl.dead && overlap(hb, pl)) { e.swingHit = true; hurtPlayer(Math.round(e.dmg * mult), ecx, e, false); }
  const dirs = n === 2 ? [-1, 1] : [e.facing];
  for (const d of dirs) icWave(ecx + d * 16, fy, d, Math.max(1, Math.round(e.dmg * 0.6 * mult)), n === 2 ? 110 : 70);
  shake(4); sfx.icSlam(); burst(ecx + e.facing * 14, fy - 2, 18, '#e4f2fc', 110, 360, 0.5);
}

// the frost wolf: the cave rats' run-in, wind-up, bite and scurry back (55), but faster and with a long leap
AI.lobo = cvBiter(74, 64, 0.38, 230);

// the blizzard spirit: drifts at a distance, raises its arms and throws a fan of three shards that chill
AI.espirito = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'cast') {
    const k = Math.pow(0.03, dt); e.vx *= k; e.vy *= k; e.facing = dx > 0 ? 1 : -1;
    if (Math.random() < dt * 30) parts.push({ x: e.x + e.w / 2 + rnd(-8, 8), y: e.y + rnd(-4, 6), vx: rnd(-10, 10), vy: rnd(-20, 0), g: 0, life: 0.4, max: 0.4, col: '#cfeeff', size: 1, glow: true });
    if (e.stateT <= 0) {
      const ox = e.x + e.w / 2, oy = e.y + 6, tx = pl.x + pl.w / 2, ty = pl.y + pl.h / 2, a = Math.atan2(ty - oy, tx - ox);
      for (let k = -1; k <= 1; k++) icThrow('shard', ox, oy, ox + Math.cos(a + k * 0.16) * 100, oy + Math.sin(a + k * 0.16) * 100, Math.max(1, Math.round(e.dmg * (k ? 0.6 : 1))), { slow: 2, sp: 175 });
      sfx.icChime(); e.state = 'walk'; e.retreat = 0.6; e.atkCD = 2.2 + Math.random() * 0.9;
    }
    return;
  }
  let tx, ty;
  if (e.retreat > 0) { e.retreat -= dt; tx = -Math.sign(dx) * 50; ty = -30; }
  else if (aggro && dist < 230) { const want = dist < 90 ? -1 : dist > 140 ? 1 : 0; tx = dx * want + Math.cos(e.t * 0.9 + e.seed) * 40; ty = dy - 40 + Math.sin(e.t * 1.7) * 14; }
  else { tx = Math.cos(e.t * 0.6 + e.seed) * 50; ty = Math.sin(e.t * 1.1 + e.seed) * 26; }
  const d = Math.hypot(tx, ty) || 1, sp = aggro ? 58 : 26, k = Math.min(1, dt * 2);
  e.vx = lerp(e.vx, tx / d * sp, k); e.vy = lerp(e.vy, ty / d * sp, k);
  if (Math.abs(e.vx) > 3) e.facing = e.vx > 0 ? 1 : -1;
  if (e.hitWall) e.vx *= -1; if (e.hitCeil || e.onGround) e.vy *= -1;
  if (Math.random() < dt * 10) parts.push({ x: e.x + e.w / 2 + rnd(-3, 3), y: e.y + e.h, vx: rnd(-6, 6) - e.vx * 0.3, vy: rnd(4, 14), g: 0, life: 0.7, max: 0.7, col: Math.random() < 0.6 ? '#eef6fc' : '#9ac4e0', size: 1 });
  if (aggro && e.atkCD <= 0 && dist < 190 && losClear(e.x + e.w / 2, e.y + 6, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'cast'; e.stateT = 0.6; sfx.icWhisper(); }
};

// the frost worm: swims under the floor toward you; a crack under your feet, then it bursts out biting,
// lies on the floor a moment (now you can hit it), then burrows again
AI.verme = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'under') {
    if (!aggro) icWander(e, dt);
    const dir = aggro ? (Math.abs(dx) < 4 ? 0 : Math.sign(dx)) : e.wander;
    if (dir) e.facing = dir; walk(e, dt, dir, 52 + e.lvl * 2, 500, 200, dy, aggro);
    if (Math.abs(e.vx) > 4 && Math.random() < dt * 8) parts.push({ x: ecx + rnd(-4, 4), y: e.y + e.h - 1, vx: rnd(-10, 10), vy: rnd(-40, -10), g: 300, life: 0.35, max: 0.35, col: '#c6d8e8', size: 1 });
    if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) < 10 && Math.abs(pl.y + pl.h - (e.y + e.h)) < 10 && pl.onGround) { e.state = 'crack'; e.stateT = 0.8; sfx.icCrack(); }
    return;
  }
  if (e.state === 'crack') { e.vx = 0; if (Math.random() < dt * 20) burst(ecx + rnd(-8, 8), e.y + e.h - 1, 1, '#cfeeff', 30, 200, 0.3); if (e.stateT <= 0) { e.state = 'emerge'; e.stateT = 0.45; e.swingHit = false; burst(ecx, e.y + e.h - 2, 16, '#e4f2fc', 100, 360, 0.5); sfx.icBurst(); } return; }
  if (e.state === 'emerge') {
    e.vx = 0; const hb = { x: ecx - 9, y: e.y + e.h - 30, w: 18, h: 30 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); pl.vy = Math.min(pl.vy, -220); }
    if (e.stateT <= 0) { e.state = 'exposed'; e.stateT = 1.8; e.atkCD = 0.6; }
    return;
  }
  if (e.state === 'exposed' || e.state === 'bite') {
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.state === 'bite') { if (!e.swingHit && !pl.dead && overlap({ x: e.facing > 0 ? ecx : ecx - 18, y: e.y - 2, w: 18, h: e.h + 4 }, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); } if (e.stateT <= 1.0) e.state = 'exposed'; }
    else if (aggro && e.atkCD <= 0 && Math.abs(dx) < 26 && Math.abs(dy) < 14) { e.facing = Math.sign(dx) || e.facing; e.state = 'bite'; e.swingHit = false; e.vx = e.facing * 120; e.atkCD = 1.2; e.stateT = Math.max(e.stateT, 1.3); sfx.hiss && sfx.hiss(); }
    if (e.stateT <= 0) { e.state = 'dig'; e.stateT = 0.45; burst(ecx, e.y + e.h - 2, 10, '#c6d8e8', 70, 300, 0.4); }
    return;
  }
  if (e.state === 'dig') { e.vx = 0; if (e.stateT <= 0) { e.state = 'under'; e.atkCD = 1.4 + Math.random(); } return; }
  e.state = 'under';
};

// the ice sentinel: walks behind its slab; raises its club and smashes the floor in front; opens up while it recovers
AI.sentinela = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'smash'; e.stateT = 0.25; e.swingHit = false; } return; }
  if (e.state === 'smash') {
    e.vx = 0;
    if (!e.swingHit) { e.swingHit = true; const hb = { x: e.facing > 0 ? ecx : ecx - 28, y: e.y + 2, w: 28, h: e.h }; if (!pl.dead && overlap(hb, pl)) hurtPlayer(e.dmg, ecx, e, false); shake(3); sfx.icSlam(); burst(ecx + e.facing * 16, e.y + e.h - 2, 12, '#cfeeff', 90, 320, 0.4); }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 1.0; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.8; } return; }
  if (!aggro) icWander(e, dt);
  e.turnT = (e.turnT || 0) - dt;
  let dir = e.wander;
  if (aggro) { if (e.turnT <= 0) { e.facing = Math.sign(dx) || e.facing; e.turnT = 0.6; } dir = Math.abs(dx) < 16 ? 0 : Math.sign(dx); }
  else if (dir) e.facing = dir;
  walk(e, dt, dir, 22 + e.lvl, 300, 260, dy, aggro);
  if (aggro && Math.abs(dx) < 32 && Math.abs(dy) < 20 && e.atkCD <= 0 && e.onGround && Math.sign(dx) === e.facing && clearPath(e, pl)) { e.state = 'wind'; e.stateT = 0.7; }
};
// the sentinel shatters into splinters that fly out (they can hurt); big beasts barely flinch; a buried worm can't be hit
{ const _kill = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'sentinela' && !e.dead) { const ox = e.x + e.w / 2, oy = e.y + e.h / 2; for (let k = 0; k < 6; k++) { const a = -Math.PI * (0.15 + k * 0.14); icProj.push({ kind: 'shard', x: ox, y: oy, vx: Math.cos(a) * 140 * (k % 2 ? 1 : -1), vy: Math.sin(a) * 160, dmg: Math.max(1, Math.round(e.dmg * 0.4)), life: 1.4, g: IC_G, r: 1.5 }); } icShatter(ox, oy, true); }
  return _kill.apply(this, arguments);
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e.type === 'verme' && (e.state === 'under' || e.state === 'crack')) return;
  const r = _hit(e, dir, mult, melee);
  if ((e.type === 'yeti' || e.type === 'sentinela') && e.stun > 0.08) e.stun = 0.08;
  return r;
}; }

/* ---------- cold-blooded: the Nevasca (68) only slows them a little and never freezes them ---------- */
HOOK.update.push(() => {
  for (const e of enemies) {
    if (!IC_BEASTS[e.type] || e.dead) continue;
    if (e.nevN) e.nevN = 0;
    if (e.nevFrz > 0) e.nevFrz = 0;
    if (e.nevChillT > 0.8) e.nevChillT = 0.8;
  }
});

/* ---------- sounds ---------- */
Object.assign(sfx, {
  icRoar() { noise(0.6, 0.12, 380, 'lowpass', 0, 1.2); tone(110, 0.55, 'sawtooth', 0.05, -40); tone(165, 0.45, 'square', 0.02, -60, 0.05); },
  icSlam() { noise(0.35, 0.18, 220, 'lowpass'); tone(70, 0.3, 'sine', 0.08, -30); noise(0.2, 0.06, 2600, 'highpass', 0.04); },
  icThrow() { noise(0.25, 0.08, 900, 'bandpass', 0, 1); },
  icShatter() { noise(0.25, 0.12, 2400, 'bandpass', 0, 1.4); [2700, 3500, 2300].forEach((f, i) => tone(f, 0.06, 'triangle', 0.02, -500, i * 0.04)); },
  icHowl() { tone(520, 0.9, 'sine', 0.035, 260); tone(780, 0.7, 'sine', 0.015, 200, 0.1); },
  icChime() { [1900, 2500, 3200].forEach((f, i) => tone(f, 0.12, 'triangle', 0.025, -300, i * 0.03)); },
  icWhisper() { noise(0.5, 0.05, 1600, 'bandpass', 0, 3); },
  icCrack() { noise(0.12, 0.08, 3000, 'highpass'); noise(0.15, 0.06, 1200, 'bandpass', 0.25, 2); noise(0.12, 0.08, 3000, 'highpass', 0.5); },
  icBurst() { noise(0.3, 0.12, 500, 'lowpass'); tone(150, 0.25, 'sawtooth', 0.04, -80); }
});
function clearIceFx() { icProj.length = 0; icWaves.length = 0; icSlowT = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearIceFx(); return _nw(sd, sv); }; }
