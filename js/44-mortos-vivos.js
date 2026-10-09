'use strict';

/* ================= the undead of the cathedral =================
   Zombies (a clawing one and a bloated one that vomits bile), the fallen templars (sword, bow,
   spear and tower shield) and the spectres, repainted in the hero's style: 6-step ramps, light
   from the top-left, a little grain, a 1px dark outline from the compositor.
   Everything is painted once (bodies, legs, items, 64-angle arms, ghost frames, bone piles) and
   cached; per frame the game only stacks those images with drawImage.
   Plugs into the cathedral hooks of 41-catedral-api (DRAW_E, EYES_E, WARN_E, HOOK); the few
   combat functions it extends (spawnEnemy, hitEnemy, killEnemy, moveEntity) are wrapped here. */

/* ---------- materials ---------- */
const UV_COL = {
  rot: '#7f9a6c',      // zombie skin, grey-green
  rotHair: '#2e2a22', shroud: '#8a7c62', rag: '#54483a', rope: '#5a4228', wound: '#8e3a36', gut: '#b0566a',
  bloat: '#9ea852',    // the vomiting one: jaundiced
  pus: '#d8c860', bile: '#a8d040',
  bone: '#d8ccae', boneDark: '#a89a7e', socket: '#1a1218',
  tabard: '#7a2e30', gold: '#b08a3c', mail: '#7a7c84', belt: '#4a3a2a', hood: '#3e3a30', strap: '#5a3e26', quiver: '#6a4428', fletch: '#c8c0a8',
  iron: '#7e828c', ghost: '#9cc4d6'
};
const uvM = (hex, grain = 0.08, o = {}) => Object.assign({ ramp: heroRamp(hex), grain }, o);

/* ---------- bodies: 12x18, facing right, same anchors as the hero (shoulders x 4.5 / 7.5, row 10.5) ---------- */
// letters are materials; an uppercase letter is the same material one step darker
const UV_BODY = {
  zombie: [
    "....hhh.....",
    "...hhhgg....",
    "..hhhgggg...",
    "..hhgggggg..",
    "..hggggeGg..",
    "..hgggggggg.",
    "...gGgmmg...",
    "....gGwG....",
    "....rggr....",
    "...rrrrrrr..",
    "..rrrRrrrr..",
    "..rRrwwrrr..",
    "..rrrxxRrr..",
    "..bbbxxbbb..",
    "..rrRrrrrr..",
    "..rrr.rRrr..",
    ".rRrr..rrr..",
    ".R.rR..rR.r."
  ],
  vomit: [
    "....hhh.....",
    "...hgggg....",
    "..hgggggg...",
    "..ggggggggg.",
    "..gggggeGg..",
    "..ggggggggg.",
    "...gGgddd...",
    "....gggd....",
    "...ggggg....",
    "..ggggggg...",
    ".gggggggggg.",
    ".ggogggggggg",
    ".gggggnggggg",
    ".ggggggogGgg",
    "..GGgggggGg.",
    ".rrrrrrrrrr.",
    ".rrRrrrRrr..",
    ".Rr.rR.rRr.."
  ],
  vomitOpen: [
    "....hhh.....",
    "...hgggg....",
    "..hgggggg...",
    "..ggggggggg.",
    "..gggggeGg..",
    "..ggggggggg.",
    "...gGgmmmd..",
    "....ggmmdd..",
    "...ggggd....",
    "..ggggggg...",
    ".gggggggggg.",
    ".ggogggggggg",
    ".gggggnggggg",
    ".ggggggogGgg",
    "..GGgggggGg.",
    ".rrrrrrrrrr.",
    ".rrRrrrRrr..",
    ".Rr.rR.rRr.."
  ],
  // the fallen templars: skull, ribs through a rotten tabard
  skeleton: [
    "....oooo....",
    "...oooooo...",
    "..oooooooo..",
    "..oooooooo..",
    "..oooooxxoo.",
    "..ooooOxxoo.",
    "...oooooOo..",
    "....ozozo...",
    ".....oo.....",
    "...oooooo...",
    "...ottttoo..",
    "...otkttO...",
    "...okkkto...",
    "....tktt....",
    "....tttt....",
    "....tttT....",
    "...otTtTo...",
    "...o.t.To..."
  ],
  archer: [
    "....oooo....",
    "...oooooo...",
    "..oooooooo..",
    "..oooooooo..",
    "..oooooxxoo.",
    "..ooooOxxoo.",
    "...oooooOo..",
    "....ozozo...",
    ".f...oo.....",
    ".fq.jjjjjj..",
    ".qq.jjjjlj..",
    ".qqjjjjljj..",
    ".qqjjjljjj..",
    ".qq.jljjj...",
    "..q.jjjj....",
    ".....oo.....",
    "...oOOOOo...",
    "...o....o..."
  ],
  guard: [
    "....oooo....",
    "...oooooo...",
    "..oooooooo..",
    "..oooooooo..",
    "..oooooxxoo.",
    "..ooooOxxoo.",
    "...oooooOo..",
    "....ozozo...",
    ".....oo.....",
    "...cccccc...",
    "..cccccccc..",
    "..cccccccc..",
    "..cccccccc..",
    "..bbbbkbbb..",
    "...cccccc...",
    "...cccccc...",
    "...cCcCcc...",
    "...o....o..."
  ]
};
// rotted trousers and one bare foot / bare bone legs
const UV_LEGS = {
  zombie: {
    idle: ["...PP..pp...", "...PP..pp...", "...FF..ff...", "...FFF.fff.."],
    w0: ["...PP..pp...", "..PP....pp..", "..FF....ff..", ".FFF....fff."],
    w1: ["....Ppp.....", "....PPpp....", "....FFff....", "...FFF.f....."],
    w2: ["...pp..PP...", "..pp....PP..", "..ff....FF..", ".fff....FFF."],
    w3: ["....pPP.....", "....ppPP....", "....ffFF....", "...fff.F...."],
    jump: ["...PP.pp....", "..PP...pp...", "..FFF..fff..", "............"]
  },
  bone: {
    idle: ["...O...o....", "...O...o....", "...O...o....", "...OO..oo..."],
    w0: ["...O....o...", "..O.....o...", "..O......o..", ".OO......oo."],
    w1: ["....O.o.....", "....O..o....", "....O..o....", "...OO..oo..."],
    w2: ["...o....O...", "..o.....O...", "..o......O..", ".oo......OO."],
    w3: ["....o.O.....", "....o..O....", "....o..O....", "...oo..OO..."],
    jump: ["...O..o.....", "..O....o....", "..OO...oo...", "............"]
  }
};
for (const k in UV_LEGS.zombie) UV_LEGS.zombie[k] = UV_LEGS.zombie[k].map(r => r.slice(0, 12));

/* ---------- held things (upright, pivot at the grip) ---------- */
const UV_ITEM = {
  sword: { rows: ["..w..", ".wWl.", ".wWr.", ".wRl.", ".wWl.", ".rWl.", ".wWl.", ".wRr.", ".wWl.", "gGGGg", "..h..", "..h..", "..p.."],
    pal: { w: '#b8b2a4', W: '#8a8478', l: '#5e5a54', r: '#8a4a2a', R: '#6a3a22', g: '#6a5640', G: '#463a2c', h: '#3b2a20', p: '#6a5640' } },
  bow: { rows: [".w...", ".sw..", ".s.w.", ".s.w.", ".s..w", ".s..w", ".s..k", ".s..w", ".s..w", ".s.w.", ".s.w.", ".sw..", ".w..."],
    pal: { w: '#7a5434', s: '#d8d0b8', k: '#3a2a1a' } },
  spear: { rows: [".M.", "MmM", "MmM", "MmM", ".m.", "kkk", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".H."],
    pal: { M: '#b4b0a6', m: '#76726a', k: '#a8843a', h: '#5e4228', H: '#3a2414' } },
  shieldFace: { rows: ["ooooooo", "oWWkWWo", "oWWkWWo", "okkkkko", "oWWkWWo", "oWWkWWo", "oWWkWWo", "oWWWWWo", ".oWWWo.", "..ooo.."],
    pal: { o: '#6e727c', W: '#6e2a2c', k: '#b08a3c' } },
  shieldSide: { rows: [".oo.", "oWko", "oWko", "okko", "oWko", "oWko", "oWko", "oWWo", ".oWo", "..o."],
    pal: { o: '#6e727c', W: '#6e2a2c', k: '#b08a3c' } },
  helm: { rows: ["....mmmm....", "...mmMmmm...", "..mmmmmmmm..", ".mmmmmmmmmm.", "..m.....m..."],
    pal: { m: '#7e828c', M: '#a6aab2' } },
  hood: { rows: ["....cccc....", "...cccccc...", "..cccccccc..", "..ccccccccc.", ".cccccCCCcc.", ".ccccc....c.", ".ccccc......", ".cccccc.....", "..ccccc.....", "..cccccc...."],
    pal: { c: '#5e5444', C: '#241e18' } }
};
function uvItem(id) {
  return cached('uvi:' + id, () => {
    const it = UV_ITEM[id], M = {};
    for (const k in it.pal) M[k] = { ramp: heroRamp(it.pal[k]), grain: k === 'r' || k === 'R' ? 0.3 : k === 'c' ? 0.12 : 0.08, under: true, lip: true };
    return heroPaint(it.rows, L => M[L], 9, null, true);
  });
}

/* ---------- arms: a capsule from the shoulder, sleeve then hand; bone arms are thinner with a knuckle ---------- */
const UV_ARM_N = 64;
function uvArm(sleeve, hand, ang, len, sl, thin, dark) {
  const q = ((Math.round(ang / (Math.PI * 2) * UV_ARM_N) % UV_ARM_N) + UV_ARM_N) % UV_ARM_N, n = Math.max(0, Math.round(len));
  return cached('uva:' + sleeve + hand + q + ':' + n + ':' + sl + (thin ? 't' : '') + (dark || 0), () => {
    const a = q / UV_ARM_N * Math.PI * 2, dx = Math.sin(a), dy = -Math.cos(a), C = 10, c = mk(C * 2 + 1, C * 2 + 1), x = c.getContext('2d');
    const cr = heroRamp(sleeve), hr = heroRamp(hand), r2 = thin ? 0.3 : 0.8;
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
      const px = i + 0.5 - (C + 0.5), py = j + 0.5 - (C + 0.5);
      const t = clamp(px * dx + py * dy, 0, n), ex = px - dx * t, ey = py - dy * t;
      const isHand = t > sl, rr = thin && isHand && t > n - 1.5 ? 0.8 : r2;   // a knob of knuckles at the end of a bone arm
      if (ex * ex + ey * ey > rr) continue;
      const side = -ex * 0.6 - ey * 0.8;
      let v = 3 - (dark || 0) + (side > 0.35 ? 1 : side < -0.35 ? -1 : 0);
      if (!isHand && t > sl - 1.1 && !thin) v -= 1;
      if (thin && Math.abs(t - n * 0.5) < 0.6) v += 1;      // elbow
      x.fillStyle = (isHand ? hr : cr)[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
    }
    return { img: c, C, hx: dx * n, hy: dy * n };
  });
}
const _uvHeroArmDraw = heroArmDraw;
heroArmDraw = function (c, sx, sy, A) {
  if (!A.uv) return _uvHeroArmDraw(c, sx, sy, A);
  const r = uvArm(A.sleeve, A.hand, A.ang, A.len, A.sl, A.thin, A.dark);
  c.drawImage(r.img, Math.round(sx - 0.5) - r.C, Math.round(sy - 0.5) - r.C);
  return [sx + r.hx, sy + r.hy];
};

/* ---------- painting the bodies ---------- */
function uvBodyMats(kind) {
  const C = UV_COL;
  if (kind === 'zombie') return { h: uvM(C.rotHair, 0.25, { tex: 'hair' }), g: uvM(C.rot, 0.22), e: '#d8cc66', m: '#2a1216', w: uvM(C.wound, 0.2, { under: true }), r: uvM(C.shroud, 0.3, { lip: true }), x: uvM(C.bone, 0.1, { under: true }), b: uvM(C.rope, 0.2, { under: true }) };
  if (kind === 'vomit' || kind === 'vomitOpen') return { h: uvM(C.rotHair, 0.25, { tex: 'hair' }), g: uvM(C.bloat, 0.2), e: '#f0e070', m: '#1e0e12', d: uvM(C.bile, 0.1, { under: true }), o: uvM(C.pus, 0.05, { under: true }), n: '#4a5020', r: uvM(C.rag, 0.3, { lip: true }) };
  const bone = uvM(C.bone, 0.12), M = { o: bone, x: C.socket, z: '#2a1e1c' };
  if (kind === 'skeleton') Object.assign(M, { t: uvM(C.tabard, 0.3, { lip: true, under: true }), k: uvM(C.gold, 0.1, { under: true }) });
  if (kind === 'archer') Object.assign(M, { j: uvM('#6e4c30', 0.2, { lip: true, under: true }), l: uvM(C.strap, 0.15, { under: true }), q: uvM(C.quiver, 0.2, { under: true }), f: uvM(C.fletch, 0.1) });
  if (kind === 'guard') Object.assign(M, { c: uvM(C.mail, 0.05, { tex: 'mail', under: true }), b: uvM(C.belt, 0.15, { under: true }), k: uvM(C.gold, 0.05, { under: true }) });
  return M;
}
function uvBody(kind) { return cached('uvb:' + kind, () => { const M = uvBodyMats(kind); return heroPaint(UV_BODY[kind], L => M[L], 13); }); }
function uvLegs(kind) {
  return cached('uvl:' + kind, () => {
    const C = UV_COL, zomb = kind === 'zombie' || kind === 'vomit';
    const M = zomb ? { p: uvM(kind === 'vomit' ? C.rag : '#5e5244', 0.3), f: uvM(kind === 'vomit' ? C.bloat : C.rot, 0.15, { lip: true }) } : { o: uvM(C.bone, 0.1, { lip: true }) };
    const set = UV_LEGS[zomb ? 'zombie' : 'bone'], o = {};
    for (const k in set) o[k] = heroPaint(set[k], L => M[L], 17);
    return o;
  });
}

/* ---------- poses ---------- */
const UV_SKIN = { zombie: UV_COL.rot, vomit: UV_COL.bloat };
function uvArmA(ang, len, sleeve, hand, sl, o) { return Object.assign({ hero: true, uv: true, ang, len, sleeve, hand, sl }, o || {}); }
function uvPose(e) {
  const walking = e.onGround && Math.abs(e.vx) > 4, fl = e.flash > 0;
  if (e.type === 'zombie' || e.type === 'vomit') {
    const legs = uvLegs(e.type)[!e.onGround ? 'jump' : walking ? WALK[Math.floor(e.t * 5) % 4] : 'idle'];
    const sk = UV_SKIN[e.type], sleeve = e.type === 'zombie' ? UV_COL.shroud : UV_COL.bloat;
    let fa = 1.5 + Math.sin(e.t * 4) * 0.07, ba = 1.72 + Math.sin(e.t * 4 + 1) * 0.07, body = uvBody(e.type);
    if (e.type === 'zombie' && e.state === 'grab') {                       // both arms rise, then rake down
      const k = clamp(1 - e.stateT / 0.55, 0, 1);
      fa = k < 0.7 ? lerp(1.5, 0.35, easeOut(k / 0.7)) : lerp(0.35, 2.3, (k - 0.7) / 0.3); ba = fa + 0.25;
    }
    if (e.type === 'vomit') {
      if (e.state === 'retch') { const j = Math.sin(e.t * 40) * 0.12; fa = 2.4 + j; ba = 2.6 - j; }
      else if (e.state === 'spew') { body = uvBody('vomitOpen'); fa = 2.7; ba = 2.9; }
      else { fa = 2.5 + Math.sin(e.t * 3) * 0.08; ba = 2.75 + Math.sin(e.t * 3 + 1) * 0.08; }   // arms hang by the belly
    }
    return { body, legs, back: uvArmA(ba, 7, sleeve, sk, 2, { dark: 1 }), front: uvArmA(fa, 7, sleeve, sk, 2), flash: fl };
  }
  const legs = uvLegs('bone')[!e.onGround ? 'jump' : walking ? WALK[Math.floor(e.t * 7) % 4] : 'idle'];
  const B = UV_COL.bone, bx = OX, by = OY;
  if (e.type === 'archer') {
    const aiming = e.state === 'aim', a = e.aim ?? 2.3;
    return { body: uvBody('archer'), legs, head: { img: uvItem('hood'), oy: -1 }, back: uvArmA(aiming ? a : 2.9, aiming ? 3 : 5, B, B, 0, { thin: true, dark: 1 }), front: uvArmA(a, 6, B, B, 0, { thin: true, item: { img: uvItem('bow'), ang: a - Math.PI / 2, px: 2, py: 6 } }), flash: fl };
  }
  if (e.type === 'guard') {
    const up = e.state === 'walk';
    return { body: uvBody('guard'), legs, head: { img: uvItem('helm'), oy: -1 },
      shield: up ? { img: uvItem('shieldSide'), cx: bx + 13, cy: by + 11, top: true } : { img: uvItem('shieldFace'), cx: bx - 0.5, cy: by + 14, top: false },
      back: uvArmA(up ? 1.6 : 2.9, 5, B, B, 0, { thin: true, dark: 1 }), front: uvArmA(1.75, 6, B, B, 0, { thin: true, item: { img: uvItem('spear'), ang: Math.PI / 2, px: 1.5, py: e.reach ?? 12 } }), flash: fl };
  }
  return { body: uvBody('skeleton'), legs, back: uvArmA(2.9 + Math.sin(e.t * 2.2) * 0.06, 5, B, B, 0, { thin: true, dark: 1 }), front: uvArmA(e.arm, 6, B, B, 0, { thin: true, item: { img: uvItem('sword'), ang: e.sAng } }), flash: fl };
}
const UV_COMPOSED = { zombie: 1, vomit: 1, skeleton: 1, archer: 1, guard: 1 };
const UV_BONY = { skeleton: 1, archer: 1, guard: 1 };
/* ---------- spectres: painted procedurally once, 4 drifting frames + a shrieking lunge ---------- */
function uvGhostFrame(f, lunge) {
  // a hooded shroud with no one inside: a dark hollow for a face, two cold pinpricks, rags trailing into nothing
  const W = 20, H = 26, c = mk(W, H), x = c.getContext('2d'), R = heroRamp(UV_COL.ghost), ph = f / 4 * Math.PI * 2;
  const hx = 8.5, hy = 7;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const u = i + 0.5, w = j + 0.5;
    const inHood = ((u - hx) / 5.2) ** 2 + ((w - hy) / 6) ** 2 < 1 || (w > hy && w < 12 && Math.abs(u - hx + 0.5) < 5.4);
    const sway = Math.sin(w * 0.45 - ph) * (w - 10) * 0.07, cxj = 8 - (w - 10) * 0.18 + sway, half = 4.6 + (w - 10) * 0.2;
    const strand = Math.sin(u * 1.7 + ph * 1.3) * 2.6 + Math.sin(u * 0.6 - ph) * 1.4;
    const inBody = w >= 10 && w < 21 + strand - Math.abs(u - cxj) * 0.3 && Math.abs(u - cxj) < half;
    const reach = lunge ? 8 : 5 + Math.sin(ph) * 0.8, ay = 13 + (lunge ? -1.5 : Math.sin(ph + 1) * 0.6) + (u - 12) * (lunge ? -0.1 : 0.15);
    const inArm = u > 11 && u < 11 + reach && Math.abs(w - ay) < (u > 11 + reach - 2 ? 0.55 : 0.95);
    if (!inHood && !inBody && !inArm) continue;
    const g = hash2(i, j, 31 + f);
    let v = 3, alpha;
    if (inHood && w < 12.5) { const lx = (u - hx) / 5.2, ly = (w - hy) / 6; v += lx + ly < -0.7 ? 2 : lx + ly < -0.1 ? 1 : lx + ly > 0.8 ? -1 : 0; alpha = 0.95; }
    else { const d = u - cxj; v += d < -half * 0.45 ? 1 : d > half * 0.45 ? -1 : 0; if ((i + f) % 3 === 0 && w > 14) v -= 1; v -= w > 17 ? 1 : 0; alpha = clamp(1.1 - (w - 11) / 12, 0.15, 0.9); }
    if (inArm && !inBody && !inHood) { v = 3; alpha = 0.7; }
    if (g < 0.1) v -= 1; else if (g > 0.93) v += 1;
    x.globalAlpha = alpha; x.fillStyle = R[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  x.globalAlpha = 1;
  // the hollow under the hood (opens wider when it shrieks), and the eyes
  x.fillStyle = '#0c1018';
  x.fillRect(9, 5, 4, lunge ? 7 : 5); x.fillRect(10, 4, 3, 1); x.fillRect(13, 6, 1, lunge ? 4 : 3); x.fillRect(10, lunge ? 12 : 10, 2, 1);
  x.fillStyle = '#24323e'; x.fillRect(9, 5, 1, lunge ? 6 : 4);
  x.fillStyle = '#d8fbff'; x.fillRect(10, 6, 1, 1); x.fillRect(12, 6, 1, 1);
  if (lunge) { x.fillStyle = '#7fe8ff'; x.fillRect(10, 7, 1, 1); x.fillRect(12, 7, 1, 1); }
  const o = mk(W, H), ox = o.getContext('2d');
  for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ox.drawImage(c, a, b);
  ox.globalCompositeOperation = 'source-in'; ox.fillStyle = 'rgba(12,16,28,0.6)'; ox.fillRect(0, 0, W, H);
  ox.globalCompositeOperation = 'source-over'; ox.drawImage(c, 0, 0);
  const l = flip(o);
  return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) };
}
let UV_GHOST = null;
function uvGhosts() { return UV_GHOST || (UV_GHOST = { drift: [0, 1, 2, 3].map(f => uvGhostFrame(f, false)), lunge: uvGhostFrame(0, true) }); }

/* ---------- bone piles (dormant templars, and what is left after a kill) ---------- */
const UV_PILE = [
  "........ooo...",
  ".......ooooo..",
  "...o...oooxo..",
  "..oOo..oxooO..",
  ".oottOooozoOo.",
  "oOoOooOoooOooo"
];
function uvPile(type) {
  return cached('uvp:' + type, () => {
    const scrap = type === 'guard' ? UV_COL.mail : type === 'archer' ? UV_COL.hood : UV_COL.tabard;
    const rows = UV_PILE;
    const M = { o: uvM(UV_COL.bone, 0.15, { lip: true }), x: UV_COL.socket, z: '#2a1e1c', t: uvM(scrap, 0.2, { under: true }) };
    const c = heroPaint(rows, L => M[L], 23), o = mk(c.width + 2, c.height + 2), ox = o.getContext('2d');
    for (const [a, b] of [[0, 1], [2, 1], [1, 0], [1, 2]]) ox.drawImage(c, a, b);
    ox.globalCompositeOperation = 'source-in'; ox.fillStyle = '#140d14'; ox.fillRect(0, 0, o.width, o.height);
    ox.globalCompositeOperation = 'source-over'; ox.drawImage(c, 1, 1);
    return { r: o, l: flip(o) };
  });
}

/* ---------- drawing ---------- */
function uvDraw(e, fx, fy, fl) {
  if (fx < -40 || fx > VW + 40 || fy < -40 || fy > VH + 60) return;
  if (e.type === 'ghost') {
    const G = uvGhosts(), set = e.state === 'lunge' || e.state === 'appear' && e.stateT < 0.2 ? G.lunge : G.drift[Math.floor(e.t * 6) % 4];
    const bob = Math.round(Math.sin(e.t * 2.4) * 1.5);
    lc.globalAlpha = 0.14 + (e.vis || 0) * 0.78;
    lc.drawImage(e.facing > 0 ? (fl ? set.wr : set.r) : (fl ? set.wl : set.l), fx - 10, fy - 22 + bob);
    lc.globalAlpha = 1; return;
  }
  if (UV_BONY[e.type] && (e.state === 'dormant' || e.state === 'rise')) {
    const p = uvPile(e.type), img = e.facing > 0 ? p.r : p.l;
    if (e.state === 'dormant') { lc.drawImage(img, fx - 8, fy - 7); return; }
    // rising: the pile sinks away as the body is pulled up out of it, bottom first
    const k = clamp(1 - e.stateT / UV_RISE, 0, 1), jit = k < 0.9 ? Math.round(Math.sin(e.t * 50) * 0.6) : 0;
    lc.globalAlpha = 1 - k; lc.drawImage(img, fx - 8, fy - 7); lc.globalAlpha = 1;
    compose(uvPose(e));
    const showH = Math.round(lerp(4, 25, easeOut(k))), top = OY + 22 - showH + 1, dy = Math.round((1 - k) * 3);
    if (e.facing < 0) { lc.save(); lc.translate(fx + jit, 0); lc.scale(-1, 1); lc.drawImage(comp, 0, top, CW, showH + 2, -CW / 2, fy - (OY + 22) + top + dy, CW, showH + 2); lc.restore(); }
    else lc.drawImage(comp, 0, top, CW, showH + 2, fx + jit - CW / 2, fy - (OY + 22) + top + dy, CW, showH + 2);
    return;
  }
  compose(uvPose(e)); drawComposite(fx, fy, e.facing);
}
function uvEyes(e, fx, fy) {
  if (fx < -20 || fx > VW + 20 || fy < -20 || fy > VH + 30) return;
  if (e.type === 'ghost') {
    lc.globalAlpha = (e.vis || 0) * (e.state === 'lunge' ? 0.95 : 0.7); lc.drawImage(SPR.glow.eyeC, fx + e.facing * 3 - 7, fy - 22 + Math.round(Math.sin(e.t * 2.4) * 1.5)); lc.globalAlpha = 1; return;
  }
  if (UV_BONY[e.type] && (e.state === 'dormant' || e.state === 'rise')) {
    if (e.state !== 'rise') return;
    lc.globalAlpha = 0.8 * clamp(1 - e.stateT / UV_RISE, 0, 1); lc.drawImage(SPR.glow.eye, fx + e.facing * 2 - 6, fy - 24); lc.globalAlpha = 1; return;
  }
  if (e.type === 'vomit') {
    lc.globalAlpha = e.state === 'retch' || e.state === 'spew' ? 0.7 : 0.3; lc.drawImage(SPR.glow.eyeY, fx + e.facing * 2 - 6, fy - 24); lc.globalAlpha = 1; return;
  }
  // the templars' sockets kindle red while they wind up, the archers' while they draw; a zombie's eye smoulders
  const hot = e.type === 'skeleton' && e.state === 'wind' || e.type === 'archer' && e.state === 'aim' || e.type === 'guard' && e.state === 'wind';
  if (hot) { lc.globalAlpha = 0.7; lc.drawImage(SPR.glow.eye, fx + e.facing * 2 - 6, fy - 25); }
  else if (e.type === 'zombie') { lc.globalAlpha = e.state === 'grab' ? 0.6 : 0.3; lc.drawImage(SPR.glow.eyeY, fx + e.facing * 2 - 6, fy - 24); }
  lc.globalAlpha = 1;
}
for (const t of ['zombie', 'vomit', 'skeleton', 'archer', 'guard', 'ghost']) { DRAW_E[t] = uvDraw; EYES_E[t] = uvEyes; }
WARN_E.zombie = e => e.state === 'grab' && e.stateT > 0.15;
WARN_E.vomit = e => e.state === 'retch';
WARN_E.skeleton = e => e.state === 'wind';
WARN_E.archer = e => e.state === 'aim';
WARN_E.guard = e => e.state === 'wind';

/* ================= stats (balanced for a hero with 50 life and no level bonuses) ================= */
Object.assign(ET.zombie, { name: 'Zumbi', hp: 55, dmg: 10, xp: 14, kb: 0.5, blood: '#6a7a4a' });
ET.vomit = { name: 'Zumbi Vomitador', w: 8, h: 21, hp: 45, dmg: 8, xp: 18, kb: 0.45, fly: false, blood: '#8a9a3a' };
Object.assign(ET.skeleton, { name: 'Esqueleto', hp: 64, dmg: 14, xp: 22 });
Object.assign(ET.archer, { name: 'Esqueleto Arqueiro', hp: 44, dmg: 11, xp: 20 });
Object.assign(ET.guard, { name: 'Guardião Esquelético', hp: 90, dmg: 15, xp: 30 });
Object.assign(ET.ghost, { name: 'Espectro', hp: 40, dmg: 12, xp: 24 });
DROPS.vomit = [['carne', 0.5, 1, 2], ['pocao', 0.1], ['capuz', 0.04], ['botas_couro', 0.04], ['anel_vida', 0.01]];
NAV_WALKERS.vomit = 1;
const UV_STEP = { vomit: 1 };
const _uvMove = moveEntity;
moveEntity = function (e, dt, step) { return _uvMove(e, dt, step || !!UV_STEP[e.type]); };

/* ================= behaviour ================= */
const UV_RISE = 0.9;
// templars sometimes lie as a heap of bones until you come close
const _uvSpawn = spawnEnemy;
spawnEnemy = function (type, px, py, zone) {
  const e = _uvSpawn(type, px, py, zone);
  if (UV_BONY[type] && Math.random() < 0.4) { e.state = 'dormant'; e.stateT = 0; }
  return e;
};
for (const k of ['skeleton', 'archer', 'guard']) {
  const base = AI[k];
  AI[k] = function (e, dt, dx, dy, dist, aggro) {
    if (e.state === 'dormant') {
      e.vx = approach(e.vx, 0, 600 * dt);
      if (!pl.dead && dist < 56 && Math.abs(dy) < 30) { e.state = 'rise'; e.stateT = UV_RISE; e.facing = Math.sign(dx) || 1; sfx.rattle(); }
      return;
    }
    if (e.state === 'rise') {
      e.stateT -= dt; e.vx = 0;
      if (Math.random() < dt * 14) burst(e.x + e.w / 2 + rnd(-4, 4), e.y + e.h - 2, 1, '#d8ccae', 40, 300, 0.4);
      if (e.stateT <= 0) { e.state = 'walk'; e.stateT = 0; e.atkCD = 0.4; }
      return;
    }
    base(e, dt, dx, dy, dist, aggro);
  };
}
// a struck pile wakes at once
const _uvHit = hitEnemy;
hitEnemy = function (e, dir, mult, melee) {
  if (UV_BONY[e.type] && e.state === 'dormant') { e.state = 'rise'; e.stateT = UV_RISE * 0.6; e.facing = -dir || 1; sfx.rattle(); }
  return _uvHit(e, dir, mult, melee);
};

// the bloated one: keeps a little distance, retches, then vomits three gobs of bile in an arc
AI.vomit = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'retch') {
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 10) parts.push({ x: e.x + e.w / 2 + e.facing * 4, y: e.y + 7, vx: e.facing * rnd(5, 15), vy: rnd(-5, 10), g: 200, life: 0.4, max: 0.4, col: UV_COL.bile, size: 1 });
    if (e.stateT <= 0) { e.state = 'spew'; e.stateT = 0.36; e.shots = 0; sfx.retch(); }
    return;
  }
  if (e.state === 'spew') {
    e.vx = 0;
    const want = Math.min(3, Math.floor((0.36 - e.stateT) / 0.1) + 1);
    while (e.shots < want) { e.shots++; uvSpit(e, (e.shots - 2) * 0.12); }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2 + Math.random(); } return; }
  if (!aggro) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
  const adx = Math.abs(dx);
  let dir = aggro ? (adx > 110 ? Math.sign(dx) : adx < 44 ? -Math.sign(dx) : 0) : e.wander;
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  walk(e, dt, dir, 22 + e.lvl, 240, 250, dy, aggro && dir === Math.sign(dx));
  if (aggro && dist < 160 && e.atkCD <= 0 && e.onGround && losClear(e.x + e.w / 2, e.y + 6, pl.x + pl.w / 2, pl.y + 6)) { e.state = 'retch'; e.stateT = 0.7; sfx.growl(); }
};
const uvBile = [], uvPools = [], uvRemains = [];
const BILE_G = 420;
function uvSpit(e, spread) {
  const ox = e.x + e.w / 2 + e.facing * 5, oy = e.y + 7, tx = pl.x + pl.w / 2, ty = pl.y + pl.h - 4;
  const t = clamp(Math.abs(tx - ox) / 115, 0.4, 1.0) * (1 + spread);
  const vx = (tx - ox) / t * (1 + spread * 0.6), vy = (ty - oy - 0.5 * BILE_G * t * t) / t;
  uvBile.push({ x: ox, y: oy, vx, vy, dmg: e.dmg, life: 2.4 });
}
function uvUpdate(dt) {
  for (let i = uvBile.length - 1; i >= 0; i--) {
    const b = uvBile[i]; b.life -= dt; b.vy = Math.min(b.vy + BILE_G * dt, 420); b.x += b.vx * dt; b.y += b.vy * dt;
    if (Math.random() < dt * 30) parts.push({ x: b.x, y: b.y, vx: rnd(-8, 8), vy: rnd(-4, 8), g: 300, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? UV_COL.bile : '#6e8a2a', size: 1 });
    let gone = b.life <= 0;
    if (!gone && !pl.dead && b.x > pl.x - 2 && b.x < pl.x + pl.w + 2 && b.y > pl.y - 2 && b.y < pl.y + pl.h + 2) {
      const r = hurtPlayer(b.dmg, b.x - Math.sign(b.vx) * 4, null, true);
      if (r !== 'none' || pl.invuln > 0) { gone = true; burst(b.x, b.y, 9, UV_COL.bile, 70, 300, 0.4); sfx.splat(); }
    }
    if (!gone && solidAt(Math.floor(b.x / T), Math.floor(b.y / T))) {
      gone = true; burst(b.x, b.y - 1, 8, UV_COL.bile, 60, 300, 0.4); sfx.splat();
      const tx = Math.floor(b.x / T), ty = Math.floor((b.y - 2) / T);   // a splash on a floor leaves a puddle that burns for a moment
      if (b.vy > 0 && !solidAt(tx, ty) && solidAt(tx, ty + 1) && uvPools.length < 12) uvPools.push({ x: b.x, y: (ty + 1) * T, life: 2.6, max: 2.6, dmg: Math.max(1, Math.round(b.dmg * 0.4)), seed: Math.random() * 9 });
    }
    if (gone) uvBile.splice(i, 1);
  }
  for (let i = uvPools.length - 1; i >= 0; i--) {
    const p = uvPools[i]; p.life -= dt;
    if (p.life <= 0) { uvPools.splice(i, 1); continue; }
    if (Math.random() < dt * 3) parts.push({ x: p.x + rnd(-4, 4), y: p.y - 1, vx: 0, vy: rnd(-14, -6), g: -4, life: 0.8, max: 0.8, col: '#7e9a34', size: 1, smoke: true });
    if (!pl.dead && pl.onGround && pl.invuln <= 0 && Math.abs(pl.y + pl.h - p.y) < 3 && pl.x + pl.w > p.x - 5 && pl.x < p.x + 5) hurtPlayer(p.dmg, pl.x + pl.w / 2 - pl.facing * 10, null, true);
  }
  for (let i = uvRemains.length - 1; i >= 0; i--) { const r = uvRemains[i]; r.t += dt; if (!r.rest) { r.vy = Math.min(r.vy + GRAV * dt, MAXFALL); r.y += r.vy * dt; if (solidAt(Math.floor(r.x / T), Math.floor(r.y / T))) { r.y = Math.floor(r.y / T) * T; r.rest = true; } } if (r.t > r.max) uvRemains.splice(i, 1); }
}
HOOK.update.push(uvUpdate);

// what is left behind: templars fall into a heap of bones, the dead flesh slumps and sinks
const _uvKill = killEnemy;
killEnemy = function (e) {
  _uvKill(e);
  if (e.despawn) return;
  const x = e.x + e.w / 2, y = e.y + e.h;
  if (UV_BONY[e.type]) { uvRemains.push({ kind: 'pile', type: e.type, x, y, vy: 0, t: 0, max: 7, facing: e.facing }); burst(x, y - 10, 10, '#d8ccae', 90, 420, 0.6); sfx.rattle(); }
  else if (e.type === 'zombie' || e.type === 'vomit') {
    compose(uvPose(Object.assign({}, e, { flash: 0, onGround: true, vx: 0, state: 'walk' })));
    const snap = mk(CW, CHT); snap.getContext('2d').drawImage(comp, 0, 0);
    uvRemains.push({ kind: 'body', snap, x, y, vy: 0, t: 0, max: 3, facing: e.facing });
    if (e.type === 'vomit') { burst(x, y - 10, 16, UV_COL.bile, 110, 300, 0.6); if (uvPools.length < 12) uvPools.push({ x, y: Math.ceil(y / T) * T, life: 2.2, max: 2.2, dmg: Math.max(1, Math.round(e.dmg * 0.4)), seed: 1 }); }
  } else if (e.type === 'ghost') burst(x, e.y + e.h / 2, 18, '#b8e0f0', 50, -60, 1.0, 1, true);
};
function uvDrawRemains(cx, cy) {
  for (const p of uvPools) {
    const x = Math.round(p.x) - cx, y = Math.round(p.y) - cy, a = Math.min(1, p.life / p.max * 2.5), w = 4 + Math.round(Math.min(1, (p.max - p.life) * 6) * 2);
    lc.globalAlpha = 0.85 * a; lc.fillStyle = '#4e6a1c'; lc.fillRect(x - w, y - 1, w * 2, 1); lc.fillStyle = '#8cb032'; lc.fillRect(x - w + 1, y - 2, w * 2 - 2, 1);
    if (Math.sin(gameTime * 5 + p.seed) > 0.4) { lc.fillStyle = '#c8e070'; lc.fillRect(x - 1 + Math.round(Math.sin(p.seed) * 2), y - 3, 1, 1); }
  }
  for (const r of uvRemains) {
    const x = Math.round(r.x) - cx, y = Math.round(r.y) - cy;
    if (x < -40 || x > VW + 40 || y < -40 || y > VH + 40) continue;
    const fade = clamp((r.max - r.t) / 1.2, 0, 1);
    if (r.kind === 'pile') { const p = uvPile(r.type); lc.globalAlpha = fade; lc.drawImage(r.facing > 0 ? p.r : p.l, x - 8, y - 7); }
    else {
      // slumps over backward in a blink, then sinks into the floor
      const k = easeOut(clamp(r.t / 0.35, 0, 1)), ang = -r.facing * k * Math.PI / 2, sink = Math.max(0, r.t - 1.2) * 3;
      lc.globalAlpha = fade; lc.save(); lc.translate(x - r.facing * k * 2, y + sink); lc.rotate(ang); if (r.facing < 0) lc.scale(-1, 1);
      lc.drawImage(r.snap, -CW / 2, -(OY + 22) + k * 3); lc.restore();
    }
  }
  lc.globalAlpha = 1;
}
function uvDrawBile(cx, cy) {
  for (const b of uvBile) {
    const x = Math.round(b.x) - cx, y = Math.round(b.y) - cy;
    lc.fillStyle = '#1a200c'; lc.fillRect(x - 2, y - 1, 4, 3); lc.fillRect(x - 1, y - 2, 2, 5);
    lc.fillStyle = '#86aa2c'; lc.fillRect(x - 1, y - 1, 2, 3); lc.fillStyle = '#d8f07a'; lc.fillRect(x - 1, y - 1, 1, 1);
  }
}
HOOK.drawWorld.push(uvDrawRemains);
HOOK.drawTop.push(uvDrawBile);   // flying bile stays readable in the dark, like arrows
HOOK.drawGlow.push((cx, cy) => {   // bile and puddles glow faintly so you can read them in the dark
  for (const b of uvBile) { lc.globalAlpha = 0.5; lc.drawImage(UV_GLOW.bile, Math.round(b.x) - cx - 7, Math.round(b.y) - cy - 7); }
  for (const p of uvPools) { lc.globalAlpha = 0.35 * Math.min(1, p.life / p.max * 2.5); lc.drawImage(UV_GLOW.bile, Math.round(p.x) - cx - 7, Math.round(p.y) - cy - 9); }
  lc.globalAlpha = 1;
});
const UV_GLOW = { bile: glow(7, '#b8e040') };

/* ---------- sounds ---------- */
Object.assign(sfx, {
  retch() { tone(90, 0.35, 'sawtooth', 0.06, -30); noise(0.3, 0.12, 500, 'lowpass'); },
  splat() { noise(0.12, 0.1, 700, 'lowpass'); tone(160, 0.08, 'triangle', 0.04, -80); },
  rattle() { for (let i = 0; i < 4; i++) noise(0.04, 0.07, 2200 + i * 300, 'bandpass', i * 0.05, 3); }
});

function clearUndeadFx() { uvBile.length = 0; uvPools.length = 0; uvRemains.length = 0; }
