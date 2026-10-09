'use strict';

/* ================= the hero, painted like the village =================
   Same 12x22 footprint and the same anchors as the old warrior (body 12x18 + legs 12x4,
   shoulders at x 4.5 / 7.5, row 10.5), so hitbox, poses, helmets and held items line up.
   Every part is shaded once, when it is first needed, on 6-step hue-shifted ramps:
   light from the top-left, rim light on top edges, shadow under overlaps, a little grain.
   The arms are pre-rendered for 64 angles. Nothing here runs per pixel per frame. */

// letters = material; an uppercase letter is the same material one step darker (folds, the far side)
// h hair · s skin · e eye · m mouth · r cloth · b belt · k buckle / trim · n collar
const HERO_BODY = [
  "....hhhh....",
  "...hhhhhh...",
  "..hhhhhhhh..",
  "..hhhhssss..",
  "..hhhsssess.",
  "..hhssssss..",
  "...hssssm...",
  "....ssss....",
  "....nssn....",
  "...nnnnnn...",
  "..rrrrrrrr..",
  "..rrrrrrrr..",
  "..rrrrrrrr..",
  "..bbbbbbkb..",
  "..rrrrrrrr..",
  "..rrrrrrrr..",
  ".rrrrrrrrrr.",
  ".rrrrrrrrrr."
];
// hand-placed light: 5 = highlight ... 0 = deepest shadow (same grid as above)
const HERO_BODY_LV = [
  "....3443....",
  "...344432...",
  "..23443322..",
  "..23324423..",
  "..221344043.",
  "..12324433..",
  "...122330...",
  "....1123....",
  "....3112....",
  "...344321...",
  "..44433321..",
  "..44333221..",
  "..43333221..",
  "..43332251..",
  "..22222111..",
  "..43333221..",
  ".3443333221.",
  ".2333322211."
];
// shield: the old shapes, every palette letter shaded as its own material
function heroShieldFor(id) {
  return cached('hs:' + id, () => {
    const pal = ITEMS[id].pal, M = {};
    for (const k in pal) M[k] = { ramp: heroRamp(pal[k]), grain: k === 'W' || k === 'w' ? 0.18 : 0.05, under: true, lip: true };
    const f = L => M[L];
    return { face: heroPaint(SHIELD_FACE, f, 3, null, true), side: heroPaint(SHIELD_SIDE, f, 4, null, true) };
  });
}
// p trousers · f foot (bare skin or the boots); S/s of the old legs = far/near leg
const HERO_LEGS = {
  idle: ["...PP..pp...", "...PP..pp...", "...FF..ff...", "...FFF.fff.."],
  w0: ["...PP..pp...", "..PP....pp..", "..FF....ff..", ".FFF....fff."],
  w1: ["....Ppp.....", "....PPpp....", "....FFfff...", "...FFF......"],
  w2: ["...pp..PP...", "..pp....PP..", "..ff....FF..", ".fff....FFF."],
  w3: ["....pPP.....", "....ppPP....", "....ffFFF...", "...fff......"],
  jump: ["...PP.pp....", "..PP...pp...", "..FFF..fff..", "............"]
};
const HERO_COL = { h: '#5a3620', s: '#e2a982', e: '#1c1422', m: '#a5604a', p: '#4b3b33', n: '#8a6a48' };
// how each body armour reads: cloth weave, chain rings or plates
const HERO_TEX = { cota: 'mail', couraca_osso: 'plate' };
function heroTex(id) { if (!id) return 'cloth'; if (HERO_TEX[id]) return HERO_TEX[id]; if (/peitoral|couraca|placa/.test(id)) return 'plate'; if (/cota|malha/.test(id)) return 'mail'; return 'cloth'; }

/* 6-step ramp around a base colour (index 3) */
function heroRamp(hex) {
  // shadows sink toward a deep plum, lights lift toward warm parchment: the same drift the village uses
  return cached('hr:' + hex, () => [0.7, 0.46, 0.22, 0, 0.28, 0.52].map((t, i) => mixHex(hex, i < 3 ? '#2a1a30' : '#fff3d6', t)));
}

/* shade a letter grid: mat(letter) -> { ramp, grain, tex } or a fixed colour string */
function heroPaint(rows, mat, seed, lv, cs) {   // cs: letters are case-sensitive materials (item palettes)
  const H = rows.length, W = rows[0].length, c = mk(W, H), x = c.getContext('2d');
  const at = (i, j) => (j < 0 || j >= H || i < 0 || i >= W) ? '.' : rows[j][i];
  const low = ch => ch === '.' || cs ? ch : ch.toLowerCase();
  for (let j = 0; j < H; j++) {
    const row = rows[j];
    for (let i = 0; i < W; i++) {
      const ch = row[i]; if (ch === '.') continue;
      const L = low(ch), M = mat(L); if (!M) continue;
      if (typeof M === 'string') { x.fillStyle = M; x.fillRect(i, j, 1, 1); continue; }
      const g = hash2(i, j, seed), fixed = lv && lv[j][i] >= '0' && lv[j][i] <= '5';
      let v = fixed ? +lv[j][i] : 3 - (ch !== L ? 1 : 0);
      let a = i, b = i;
      if (!fixed) {
      // form: brighter toward the left end of this run, darker toward the right
      while (a > 0 && low(row[a - 1]) === L) a--; while (b < W - 1 && low(row[b + 1]) === L) b++;
      if (b > a) { const u = (i - a) / (b - a); v += u < 0.25 ? 1 : u > 0.8 ? -1 : 0; }
      // rim light on top, shadow under whatever sits above, dark lip at the bottom edge
      const up = low(at(i, j - 1)), dn = low(at(i, j + 1));
      if (up === '.') v += 1; else if (up !== L && !M.under) v -= 1;
      if (dn === '.' && M.lip) v -= 1;
      }
      // surface texture
      if (M.tex === 'mail') v += j % 2 === 0 && (i + (j >> 1)) % 2 === 0 ? -1 : 0;
      else if (M.tex === 'plate') { if (i === a + 1 && j % 4 !== 3) v += 1; if (j % 4 === 3) v -= 1; }
      else if (M.tex === 'hair') v += ((i * 3 + j) % 4 === 0) ? 1 : g < 0.18 ? -1 : 0;
      if (M.grain) v += g < M.grain * 0.5 ? -1 : g > 1 - M.grain * 0.5 ? 1 : 0;
      x.fillStyle = M.ramp[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
    }
  }
  return c;
}

function heroBodyFor(id) {
  return cached('hb:' + (id || '-'), () => {
    const pal = Object.assign({}, PC, id ? ITEMS[id].pal : BODY_RAGS), tex = heroTex(id);
    const cloth = { ramp: heroRamp(pal.r), grain: 0, tex, lip: true };
    const M = {
      h: { ramp: heroRamp(HERO_COL.h), grain: 0.08 }, s: { ramp: heroRamp(HERO_COL.s), grain: 0 },
      e: HERO_COL.e, m: heroRamp(HERO_COL.s)[1], r: cloth, n: { ramp: heroRamp(pal.R), grain: 0.06 },
      b: { ramp: heroRamp(pal.b), grain: 0.1, under: true }, k: { ramp: heroRamp(pal.B), grain: 0 }
    };
    return { img: heroPaint(HERO_BODY, L => M[L], 7, HERO_BODY_LV), r: pal.r, R: pal.R, arm: pal.r };
  });
}
function heroLegsFor(id) {
  return cached('hl:' + (id || '-'), () => {
    const boot = id ? ITEMS[id].pal.s : null;
    const M = { p: { ramp: heroRamp(HERO_COL.p), grain: 0.1 }, f: { ramp: heroRamp(boot || HERO_COL.s), grain: 0, lip: true, under: !boot } };
    const o = {}; for (const k in HERO_LEGS) o[k] = heroPaint(HERO_LEGS[k], L => M[L], 11);
    return o;
  });
}
// helmets and hoods keep their own shapes; each palette letter becomes a shaded material
function heroHeadFor(id) {
  return cached('hh:' + id, () => {
    const it = ITEMS[id], M = {};
    for (const k in it.pal) M[k] = { ramp: heroRamp(it.pal[k]), grain: k === 'c' || k === 'C' ? 0.25 : 0.1, under: true, lip: true };
    return { img: heroPaint(it.art, L => M[L], 5, null, true), oy: it.oy };
  });
}

/* arms: 2px capsule from the shoulder, sleeve then hand, lit on the side facing the top-left */
const HERO_ARM_N = 64;
function heroArm(cloth, dark, ang, len) {
  const q = ((Math.round(ang / (Math.PI * 2) * HERO_ARM_N) % HERO_ARM_N) + HERO_ARM_N) % HERO_ARM_N, n = Math.max(0, Math.round(len));
  return cached('ha:' + cloth + dark + q + ':' + n, () => {
    const a = q / HERO_ARM_N * Math.PI * 2, dx = Math.sin(a), dy = -Math.cos(a), C = 9, c = mk(C * 2 + 1, C * 2 + 1), x = c.getContext('2d');
    const cr = heroRamp(cloth), sr = heroRamp(HERO_COL.s), sl = n - 1.6;
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
      const px = i + 0.5 - (C + 0.5), py = j + 0.5 - (C + 0.5);
      const t = clamp(px * dx + py * dy, 0, n), ex = px - dx * t, ey = py - dy * t;
      if (ex * ex + ey * ey > 0.8) continue;
      const side = -ex * 0.6 - ey * 0.8;   // facing the light
      let v = 3 - dark + (side > 0.35 ? 1 : side < -0.35 ? -1 : 0);
      const hand = t > sl;
      if (!hand && t > sl - 1.1) v -= 1;   // cuff
      x.fillStyle = (hand ? sr : cr)[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
    }
    return { img: c, C, hx: dx * n, hy: dy * n };
  });
}
function heroArmDraw(c, sx, sy, A) {
  const r = heroArm(A.hero, A.dark, A.ang, A.len);
  c.drawImage(r.img, Math.round(sx - 0.5) - r.C, Math.round(sy - 0.5) - r.C);
  return [sx + r.hx, sy + r.hy];
}
