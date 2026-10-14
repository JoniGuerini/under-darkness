'use strict';

/* ================= the creatures of the caves =================
   No undead up here: the slime (three cave colours, one per depth) and the bat (repainted; it sleeps
   hanging from the roof until you come near), the cave rat that runs in packs, bites and backs off, the
   weaver spider that waits on a thread over your head and drops, then lunges after a crouch, the spitting
   spider that keeps its distance and throws globs of web that slow you, the armoured beetle whose shell
   turns blows from the front and that rolls at you like a boulder (and lies stunned on its back after
   hitting a wall), and the spiderling (from eggs and from the Mãe-Teia, 57).
   Same art rules as the hero and the undead: ramps lit from the top left, a little grain, a 1px dark
   outline (outlined in 02-arte), everything painted once and cached. Stats here are the base values:
   49-itens-efeitos scales every ET entry by its BAL, so this file loads before it (after 44-mortos-vivos). */

/* ---------- stats ---------- */
Object.assign(ET, {
  rato: { name: 'Rato-de-Gruta', w: 11, h: 7, hp: 14, dmg: 6, xp: 5, kb: 1.1, fly: false, blood: '#8a2a24' },
  aranha: { name: 'Aranha Tecelã', w: 14, h: 8, hp: 28, dmg: 9, xp: 10, kb: 0.8, fly: false, blood: '#6a8a3a' },
  cuspideira: { name: 'Aranha Cuspideira', w: 13, h: 8, hp: 24, dmg: 7, xp: 11, kb: 0.9, fly: false, blood: '#9aaa4a' },
  besouro: { name: 'Besouro Couraçado', w: 16, h: 10, hp: 60, dmg: 11, xp: 16, kb: 0.3, fly: false, blood: '#5a8a6a' },
  filhote: { name: 'Filhote de Aranha', w: 7, h: 5, hp: 8, dmg: 4, xp: 2, kb: 1.3, fly: false, blood: '#6a8a3a' }
});
// slimes of the caves: mud (Grutas), cold grey-blue (Galerias), sickly amber (Ninho and Fundações)
const CV_SLIME = [{ base: '#6e7a34', light: '#c8d070', dark: '#2a3010', core: '#3a4418', blood: '#8a9a3a' }, { base: '#4a6e88', light: '#a8d0e8', dark: '#16283a', core: '#22384c', blood: '#6a9ac0' }, { base: '#a0742a', light: '#f0c868', dark: '#3a2408', core: '#5a3a10', blood: '#c8963a' }];
for (const s of CV_SLIME) SLIME_BLOOD.push(s.blood);   // variants 4, 5, 6

/* ---------- materials ---------- */
Object.assign(ICON_ART, {
  ratHide: [["..dddd...", ".dDDDDd..", "dDDdDDDd.", "dDDDDDDdd", ".dDDdDDd.", "..dddd.d.", ".......d."], { d: '#5a4234', D: '#8a6a52' }],
  gland: [["...gg....", "..gGGg...", ".gGWGGg..", ".gGGGGg..", "..gGGg...", "...gg....", "...r.....", "..r......"], { g: '#4a6a1a', G: '#9ac83a', W: '#e8f8a0', r: '#7a3a2a' }],
  chitin: [["..kkkkk..", ".kKKKKKk.", "kKWKKKKKk", "kKKkKKkKk", "kKKKkKKKk", ".kKKKKKk.", "..kkkkk.."], { k: '#1a2a24', K: '#3a6a5a', W: '#a8e0c8' }]
});
Object.assign(ITEMS, {
  pele_rato: { name: 'Pele de Rato', rar: 0, stack: 99, icon: 'ratHide', desc: 'Couro fino e sarnento. Material.' },
  glandula: { name: 'Glândula de Peçonha', rar: 1, stack: 99, icon: 'gland', desc: 'Ainda pinga. Marta sabe o que fazer com isso. Material.' },
  quitina: { name: 'Placa de Quitina', rar: 1, stack: 99, icon: 'chitin', desc: 'Casca de besouro, dura como ferro. Material.' }
});
Object.assign(DROPS, {
  rato: [['pele_rato', 0.6], ['carne', 0.25], ['pocao', 0.04], ['capuz', 0.03], ['botas_couro', 0.03]],
  aranha: [['seda', 0.6, 1, 2], ['glandula', 0.22], ['pocao', 0.07], ['adaga_ferro', 0.03], ['amuleto', 0.015]],
  cuspideira: [['glandula', 0.5], ['seda', 0.4], ['pocao', 0.07], ['capuz', 0.03], ['anel_vida', 0.015]],
  besouro: [['quitina', 0.6, 1, 2], ['pocao', 0.1], ['escudo_ferro', 0.04], ['elmo_ferro', 0.03], ['cota', 0.02], ['broquel', 0.03]],
  filhote: [['seda', 0.2]]
});
Object.assign(NAV_WALKERS, { rato: 1, aranha: 1, cuspideira: 1, besouro: 1, filhote: 1 });
const CV_STEP = { rato: 1, aranha: 1, cuspideira: 1, besouro: 1, filhote: 1 };
// rolando, o besouro não sobe degrau (bate e vira de costas); só desce (Jonathan 2026-10-14)
{ const _m = moveEntity; moveEntity = function (e, dt, step) { return _m(e, dt, step || (!!CV_STEP[e.type] && !(e.type === 'besouro' && e.state === 'roll'))); }; }

/* ================= art ================= */
const CVB = {};   // cached sprite sets
{
const { cg } = CVART;
const R7 = hexes => hexes.map(h => ph(h));
const ramp = (dark, mid, light) => { const a = rgb(dark), b = rgb(mid), c = rgb(light), out = []; for (let i = 0; i < 7; i++) { const t = i / 6, A = t < 0.5 ? a : b, B = t < 0.5 ? b : c, k = t < 0.5 ? t * 2 : (t - 0.5) * 2; out.push(pack(lerp(A[0], B[0], k) | 0, lerp(A[1], B[1], k) | 0, lerp(A[2], B[2], k) | 0)); } return out; };
const RB = {
  pelo: R7(['#1a1410', '#2a201a', '#3e3028', '#544236', '#6a5646', '#826c5a', '#9a8470']),
  rosa: R7(['#4a2024', '#6a3036', '#8a4a4e', '#a8666a', '#c4868a', '#dca4a6', '#f0c4c4']),
  quit: R7(['#0a0a08', '#16140f', '#241f17', '#352d21', '#4a3f2e', '#62553f', '#7c6d54']),
  quitP: R7(['#2a2620', '#3e382e', '#5a5242', '#7a705a', '#9a8e74', '#b8ac8e', '#d2c6a8']),
  verde: R7(['#141a08', '#222e10', '#34461a', '#4a6426', '#628434', '#7ea444', '#a0c45c']),
  casca: R7(['#06100c', '#0c1c16', '#142a22', '#1e3c32', '#2a5244', '#3a6c5a', '#5a9078']),
  bronze: R7(['#140e06', '#24180a', '#3a2810', '#523a18', '#6e5022', '#8c6a30', '#ae8a48']),
  asa: R7(['#0c0608', '#160c10', '#22141a', '#2e1c24', '#3c2630', '#4c323c', '#5e404a']),
  osso: R7(['#241e16', '#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c0b298', '#dcd0b6']),
  olho: R7(['#200404', '#400808', '#701010', '#a01c1c', '#d03030', '#f06060', '#ffb0a0'])
};
function cp(w, h) {
  const c = new Uint32Array(w * h);
  const P = {
    w, h, c,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; },
    blob(cx, cy, rx, ry, R, s, base = 3.4, f) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1.3 - (dx * 0.8 + dy) * 1.4 - d * 0.7 + cg(x, y, s) * 0.45 + (f ? f(x, y, dx, dy) : 0)); } },
    line(x0, y0, x1, y1, R, v) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) P.put(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, R, typeof v === 'function' ? v(i / n) : v); },
    // a jointed leg: hip -> knee -> foot
    leg(hx, hy, kx, ky, fx, fy, R, v = 2.6) { P.line(hx, hy, kx, ky, R, v + 0.6); P.line(kx, ky, fx, fy, R, v); },
    done() { const cv = mk(w, h), x = cv.getContext('2d'), img = x.createImageData(w, h); new Uint32Array(img.data.buffer).set(c); x.putImageData(img, 0, 0); return cv; }
  };
  return P;
}
const set = cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };

/* the cave rat, 15 x 9 facing right: k 0 idle, 1-2 run, 3 bite (stretched, jaws open) */
function rat(k) {
  const P = cp(15, 9), s = 4101 + k, run = k === 1 ? 1 : k === 2 ? -1 : 0, bite = k === 3;
  for (let i = 0; i < 6; i++) P.put(1 - i * 0.2 + (i > 3 ? 0 : 0), 5 + Math.sin(i * 0.9 + k) * 0.8 - i * 0.3, RB.rosa, 2.6);   // tail
  P.blob(bite ? 6.5 : 6, 5.2, bite ? 4.6 : 4.2, 2.6, RB.pelo, s, 3.4, (x, y) => y < 4 && hash2(x, y, s) < 0.3 ? 0.8 : 0);   // body, fur tufts on the back
  P.blob(bite ? 11.5 : 10.5, 4.6, 2.4, 2, RB.pelo, s + 1, 3.8);   // head
  P.put(bite ? 14 : 13, bite ? 4 : 5, RB.rosa, 4.5); P.put(bite ? 13 : 12, 5, RB.pelo, 3);          // snout and nose
  if (bite) { P.put(14, 6, RB.rosa, 2); P.put(13, 6, RB.osso, 5.5); }                                // open jaws, a tooth
  P.blob(bite ? 10 : 9.2, 2.6, 1, 1, RB.rosa, s + 2, 3.2);                                          // ear
  P.put(bite ? 12 : 11, 4, RB.olho, 1);                                                             // eye
  const f = [[4, 8], [9, 8]]; f.forEach(([x, y], i) => { const o = run * (i ? 1 : -1); P.line(x, 7, x + o, y, RB.rosa, 2.4); P.line(x + 1, 7, x + 1 - o, y, RB.rosa, 3); });
  return set(P.done());
}
/* a spider, 23 x 12 facing right: long jointed legs arched high over a small body. kind 'tecela' (dark, pale chevrons,
   banded knees), 'cuspideira' (bone-pale, swollen green abdomen) or 'filhote' (tiny, 12 x 7)
   pose: 0-1 walk, 2 crouch (wind-up, body pressed down), 3 leap (legs thrown out), 4 aim (abdomen raised toward you) */
function spider(kind, pose) {
  const small = kind === 'filhote', W = small ? 12 : 23, H = small ? 7 : 12, P = cp(W, H), s = 4201 + pose * 3 + (kind === 'cuspideira' ? 50 : 0);
  const sc = small ? 0.52 : 1, X = v => v * sc, Y = v => small ? v * 0.55 + 0.4 : v;
  const body = kind === 'cuspideira' ? RB.quitP : RB.quit, abd = kind === 'cuspideira' ? RB.verde : RB.quit;
  const low = pose === 2 ? 1.6 : 0, raise = pose === 4 ? -2.2 : 0, by = 7 + low;   // body centre row
  const ph = pose === 1 ? 1 : 0, leap = pose === 3;
  // feet along the ground, front to back; the far legs sit a little inside the near ones
  const feetN = leap ? [22.5, 19.5, 5, 0.5] : [21.5, 17.5, 7.5, 2.5], feetF = leap ? [21, 17.5, 6.5, 2] : [20, 15.5, 9.5, 4.5];
  const leg = (i, far) => {
    const hx = 11.2 + (1.5 - i) * 0.7, hy = by - 0.4, fx = (far ? feetF : feetN)[i] + ((i + ph + (far ? 1 : 0)) % 2 ? 0.9 : -0.9) * (pose < 2 ? 1 : 0), fy = leap ? 9 + (i % 2) : 11.4;
    const kx = (hx + fx) / 2 + (i < 2 ? 1 : -1) * 0.6, ky = leap ? by - 2.6 : Math.max(0.4, by - 5.4 - low * 0.4 + Math.abs(i - 1.5) * 0.7);
    return [X(hx), Y(hy), X(kx), Y(ky), X(fx), Y(fy)];
  };
  for (let i = 0; i < 4; i++) { const [hx, hy, kx, ky, fx, fy] = leg(i, true); P.leg(hx, hy, kx, ky, fx, fy, body, 1.2); }   // far legs, in shadow
  P.blob(X(6.4), Y(by - 0.6 + raise), X(small ? 4.4 : 4.3), Y(kind === 'cuspideira' ? 3.5 : 3.1), abd, s, kind === 'cuspideira' ? 3.6 : 3, (x, y, dx, dy) => kind === 'tecela' && Math.abs(dy + 0.1) < 0.16 && dx < 0.5 ? 2.2 : kind === 'cuspideira' && hash2(x, y, s + 1) < 0.12 ? 1.4 : 0);   // abdomen
  if (kind === 'tecela') for (const [x, y] of [[4, -1.6], [6, -2.2], [8, -1.6]]) P.put(X(x), Y(by + y + raise), RB.quitP, 5);   // the pale chevrons
  if (pose === 4) P.put(X(2.4), Y(by + raise + 0.6), RB.quitP, 6);   // spinnerets
  P.blob(X(12.2), Y(by), X(2.6), Y(2.1), body, s + 2, 3.8);   // head-and-thorax
  P.put(X(14.4), Y(by - 1), RB.olho, 5); P.put(X(13.6), Y(by - 1.5), RB.olho, 4); if (!small) P.put(14, by - 0.2, RB.olho, 3);   // eyes
  P.line(X(14.6), Y(by + 0.8), X(15.2), Y(by + 2.2), RB.osso, pose === 2 || leap ? 5.5 : 3.6);   // fang
  for (let i = 0; i < 4; i++) { const [hx, hy, kx, ky, fx, fy] = leg(i, false); P.leg(hx, hy, kx, ky, fx, fy, body, kind === 'tecela' ? 3.6 : 4.2); if (kind === 'tecela' && !small) P.put(kx, ky, RB.quitP, 4.6); }
  return set(P.done());
}
/* the armoured beetle, 20 x 12 facing right: 0-1 walk, 2 crouch (head down), 3 rolled into a ball, 4 on its back */
function beetle(pose) {
  if (pose === 3) {   // the ball: shell plates all round; turned while it rolls
    const P = cp(13, 13), s = 4301;
    P.blob(6.5, 6.5, 6.2, 6.2, RB.casca, s, 3.4, (x, y, dx, dy) => (Math.abs(Math.atan2(dy, dx) % 0.9) < 0.09 ? -2 : 0) + (dx * dx + dy * dy < 0.15 ? 0.4 : 0));
    for (let a = 0; a < 6.28; a += 0.9) P.put(6.5 + Math.cos(a) * 5, 6.5 + Math.sin(a) * 5, RB.bronze, 5);
    return set(P.done());
  }
  const P = cp(20, 12), s = 4311 + pose, back = pose === 4, low = pose === 2 ? 1 : 0;
  if (back) {
    P.blob(10, 7.5, 8.5, 4.2, RB.casca, s, 2.6, (x, y, dx, dy) => (Math.abs(dx) < 0.05 ? -1.5 : 0));
    P.blob(10, 6.5, 6.5, 2.6, RB.bronze, s, 2.4);   // the belly, segmented
    for (let x = 5; x < 16; x += 2) P.line(x, 5, x, 8, RB.bronze, 1.4);
    for (let i = 0; i < 3; i++) for (const d of [-1, 1]) { const x = 10 + d * (2 + i * 2); P.line(x, 5, x + d * 1.4 + Math.sin(i * 2) * 0.6, 1.6 + i * 0.5, RB.quit, 4); P.line(x + d * 1.4, 1.6 + i * 0.5, x + d * 2.6, 0.5 + i, RB.quit, 3.4); }   // legs waving in the air
    return set(P.done());
  }
  const ph = pose === 1 ? 1 : 0;
  for (let i = 0; i < 3; i++) { const hx = 6 + i * 3.6, o = ((i + ph) % 2 ? 1 : -1) * 0.8; P.line(hx + 0.6, 7 + low, hx - 0.6 + o, 11.4, RB.quit, 1.6); }   // far legs
  P.blob(9.5, 6.4 + low, 8.4, 5.4, RB.casca, s, 3.4, (x, y, dx, dy) => (Math.abs(dx - 0.15) < 0.04 && dy < 0.6 ? -1.6 : 0) + (dy < -0.45 && Math.abs(dx + 0.25) < 0.25 ? 1.4 : 0) + (dy > 0.55 ? -0.8 : 0));   // the domed shell: a seam, a shine
  for (let x = 2; x < 17; x++) P.put(x, 10.4 + low - Math.abs(x - 9.5) * 0.06, RB.bronze, 2.4);   // the rim
  P.blob(17.2, 8 + low * 1.4, 2.4, 2.2, RB.quit, s + 1, 3.4);   // head
  P.line(18.6, 8.4 + low * 1.4, 20, 7 + low * 1.4, RB.bronze, 4.4); P.line(18.6, 9.4 + low * 1.4, 20, 10 + low * 1.4, RB.bronze, 3.6);   // mandibles
  P.put(18, 7 + low * 1.4, RB.olho, 2);
  for (let i = 0; i < 3; i++) { const hx = 5 + i * 3.6, o = ((i + ph) % 2 ? -1 : 1) * 0.8; P.line(hx, 8 + low, hx + 1 + o, 11.4, RB.quit, 3.4); P.put(hx + 1 + o, 11, RB.quit, 4.4); }   // near legs
  return set(P.done());
}
/* the bat, repainted: 17 x 10, two wing beats; roost: hanging upside down with wings wrapped (8 x 12) */
function bat(k) {
  const P = cp(17, 10), s = 4401 + k, up = k === 0;
  for (const d of [-1, 1]) {   // wings: finger bones with membrane between
    const tip = up ? [8.5 + d * 8, 0.5] : [8.5 + d * 7.5, 8.5], mid = up ? [8.5 + d * 4.5, 1.5] : [8.5 + d * 4.6, 6.5];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 17; x++) {
      const px = x + 0.5, py = y + 0.5; if (Math.sign(px - 8.5) !== d || Math.abs(px - 8.5) < 1.6) continue;
      const t = Math.abs(px - 8.5) / Math.abs(tip[0] - 8.5); if (t > 1) continue;
      const top = up ? lerp(4, tip[1], t) - Math.sin(t * Math.PI) * 1.2 : lerp(3.6, tip[1] - 3, t) + Math.sin(t * Math.PI) * 0.4;
      const bot = up ? lerp(6, tip[1] + 1, t) + Math.sin(t * 3.3) * 1.6 : lerp(6, tip[1], t) - (Math.abs(Math.sin(t * 6.2)) * 1.4);
      if (py < top || py > bot) continue;
      P.put(x, y, RB.asa, 3 - (py - top) / Math.max(1, bot - top) * 1.4 + cg(x, y, s) * 0.4);
    }
    P.line(8.5 + d * 1.5, 4.5, mid[0], mid[1], RB.asa, 5); P.line(mid[0], mid[1], tip[0], tip[1], RB.asa, 4.6);   // the arm bones
  }
  P.blob(8.5, 5.4, 2.3, 2.8, RB.pelo, s, 3.2);   // body
  P.blob(8.5, 3, 1.8, 1.6, RB.pelo, s + 1, 3.8);   // head
  P.put(7.4, 1, RB.pelo, 3.4); P.put(9.6, 1, RB.pelo, 3.4); P.put(7.5, 0, RB.pelo, 2.6); P.put(9.5, 0, RB.pelo, 2.6);   // ears
  P.put(8.5, 4.4, RB.osso, 5.4);   // fang
  return set(P.done());
}
function batRoost() {
  const P = cp(8, 12), s = 4421;
  P.put(3, 0, RB.osso, 2.6); P.put(5, 0, RB.osso, 2.6); P.line(3, 1, 3, 2, RB.asa, 3); P.line(5, 1, 5, 2, RB.asa, 3);   // feet gripping the roof
  for (let y = 2; y < 10; y++) { const half = 1.6 + Math.sin((y - 2) / 8 * Math.PI) * 1.8; for (let x = Math.floor(4 - half); x <= Math.ceil(4 + half) - 1; x++) P.put(x, y, RB.asa, 3.6 - (x + 0.5 - 4 + half) / (2 * half) * 2.4 + ((x + y) % 3 === 0 ? 0.5 : 0)); }   // wings wrapped
  P.blob(4, 10, 1.7, 1.5, RB.pelo, s, 3.6); P.put(3, 11, RB.pelo, 3); P.put(5, 11, RB.pelo, 3);   // the head, upside down
  return set(P.done());
}
/* a cave slime, 14 x 11: a dome of jelly with a darker core, highlights, a dribble at its foot */
function slime(S) {
  const P = cp(14, 11), s = 4501, R = ramp(S.dark, S.base, S.light), C = ramp('#000000', S.core, S.base);
  for (let y = 0; y < 11; y++) for (let x = 0; x < 14; x++) {
    const dx = (x + 0.5 - 7) / 6.6, dy = (y + 0.5 - 10.6) / 9.8; if (dx * dx + dy * dy > 1 || y > 10) continue;
    let v = 3.4 - dx * 1 - dy * 1.4 - (dx * dx + dy * dy) * 0.8 + cg(x, y, s) * 0.3;
    if (y === 10) v -= 1.4;
    P.put(x, y, R, v);
  }
  P.blob(6.2, 7, 2.2, 1.9, C, s, 3.6);   // the core
  P.put(4, 3, R, 6); P.put(5, 3, R, 6); P.put(3, 4, R, 5.6); P.put(10, 6, R, 5);   // wet shine
  for (const [x, y] of [[9, 4], [3, 7]]) P.put(x, y, R, 4.6);   // bubbles
  return set(P.done());
}
// built lazily the first time one is drawn (mk and the outline helpers are ready by then)
CVB.get = () => CVB.ready || (CVB.ready = {
  rat: [0, 1, 2, 3].map(rat),
  tecela: [0, 1, 2, 3].map(p => spider('tecela', p)),
  cusp: [0, 1, 2, 3, 4].map(p => spider('cuspideira', p)),
  filhote: [0, 1, 2, 3].map(p => spider('filhote', p)),
  beetle: [0, 1, 2, 3, 4].map(beetle),
  bat: [bat(0), bat(1)], roost: batRoost(),
  slime: CV_SLIME.map(slime)
});
Object.assign(CVB, { RB, cp, set });   // for the Mãe-Teia (57)
}

/* ================= drawing ================= */
const cvPick = (set, e, fl) => e.facing > 0 ? (fl ? set.wr : set.r) : (fl ? set.wl : set.l);
// a sprite rotated about its centre (spiders on a thread hang head down, the beetle's ball rolls)
function cvRot(img, x, y, a) { lc.save(); lc.translate(x, y); lc.rotate(a); lc.drawImage(img, -img.width / 2, -img.height / 2); lc.restore(); }
function cvThread(e, fx, fy) {   // the silk line from the roof down to a hanging spider
  if (e.anchorY === undefined) return;
  const top = fy - Math.round(e.y + e.h - e.anchorY);
  lc.fillStyle = 'rgba(200,200,214,0.55)'; lc.fillRect(fx, top, 1, Math.max(0, fy - top - e.h));
}
DRAW_E.rato = (e, fx, fy, fl) => {
  const B = CVB.get().rat, k = e.state === 'bite' || e.state === 'wind' ? 3 : Math.abs(e.vx) > 8 && e.onGround ? 1 + (Math.floor(e.t * 12) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 8, fy - 10 + (e.state === 'wind' ? 1 : 0));
};
function drawSpider(e, fx, fy, fl, B, ox, oy) {
  if (e.state === 'hang' || e.state === 'drop') {   // upside down on its thread, legs drawn in
    cvThread(e, fx, fy);
    const img = cvPick(B[2], e, fl); cvRot(img, fx, fy - e.h / 2, e.facing * Math.PI / 2 + Math.sin(e.t * 1.4) * 0.12); return;
  }
  const k = e.state === 'crouch' || e.state === 'aim' && !B[4] ? 2 : e.state === 'aim' ? 4 : !e.onGround ? 3 : Math.abs(e.vx) > 6 ? Math.floor(e.t * 10) % 2 : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - ox, fy - oy);
}
DRAW_E.aranha = (e, fx, fy, fl) => drawSpider(e, fx, fy, fl, CVB.get().tecela, 12, 13);
DRAW_E.cuspideira = (e, fx, fy, fl) => drawSpider(e, fx, fy, fl, CVB.get().cusp, 12, 13);
DRAW_E.filhote = (e, fx, fy, fl) => drawSpider(e, fx, fy, fl, CVB.get().filhote, 7, 8);
DRAW_E.besouro = (e, fx, fy, fl) => {
  const B = CVB.get().beetle;
  if (e.state === 'roll') { e.spin = (e.spin || 0) + e.vx * 0.0018; const img = fl ? B[3].wr : B[3].r; cvRot(img, fx, fy - 7, e.spin); return; }
  const k = e.state === 'flipped' ? 4 : e.state === 'crouch' ? 2 : Math.abs(e.vx) > 4 ? Math.floor(e.t * 6) % 2 : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 11, fy - 13 + (e.state === 'flipped' ? Math.round(Math.abs(Math.sin(e.t * 9))) : 0));
};
// bats everywhere get the new look; a roosting one hangs still from the roof
DRAW_E.bat = (e, fx, fy, fl) => {
  const B = CVB.get();
  if (e.state === 'roost') { const img = cvPick(B.roost, e, fl); lc.drawImage(img, fx - 5, fy - e.h - 1 + (e.roostOff || 0)); return; }
  const img = cvPick(B.bat[Math.floor(e.t * 11) % 2], e, fl); lc.drawImage(img, fx - 9, fy - 10);
};
// cave slimes (variants 4..6); the old ones keep their sprites
{
const _slimeDraw = (e, fx, fy, fl) => {
  const set = e.variant >= 4 ? CVB.get().slime[e.variant - 4] : SPR.slime[e.variant]; let w = 14, h = 11;
  if (e.onGround) { if (e.hop < 0.22 && e.stun <= 0) { w = 16; h = 9; } else if (Math.sin(e.t * 6) > 0.6) { w = 15; h = 10; } }
  else if (e.vy < 0) { w = 12; h = 13; } else { w = 13; h = 12; }
  const img = cvPick(set, e, fl), pad = e.variant >= 4 ? 1 : 0;
  lc.drawImage(img, fx - (w >> 1) - pad, fy - h + 1 - pad, w + pad * 2, h + pad * 2);
};
DRAW_E.slime = _slimeDraw;
}
// eyes that catch the light in the dark
EYES_E.rato = (e, fx, fy) => { lc.globalAlpha = 0.28; lc.drawImage(SPR.glow.eye, fx + e.facing * 4 - 6, fy - 11); };
const cvSpiderEyes = (e, fx, fy) => {
  if (e.state === 'hang' || e.state === 'drop') { lc.globalAlpha = 0.5; lc.drawImage(SPR.glow.eye, fx - 6, fy - 4); return; }
  lc.globalAlpha = e.state === 'crouch' || e.state === 'aim' ? 0.85 : 0.42; lc.drawImage(SPR.glow.eye, fx + e.facing * (e.type === 'filhote' ? 2 : 5) - 6, fy - (e.type === 'filhote' ? 9 : 13));
};
EYES_E.aranha = cvSpiderEyes; EYES_E.cuspideira = cvSpiderEyes; EYES_E.filhote = cvSpiderEyes;
EYES_E.besouro = () => { };
EYES_E.bat = (e, fx, fy) => { if (e.state === 'roost') return; lc.globalAlpha = 0.5; lc.drawImage(SPR.glow.eye, fx - 6, fy - 11); };
WARN_E.rato = e => e.state === 'wind';
WARN_E.aranha = e => e.state === 'crouch';
WARN_E.filhote = e => e.state === 'wind';
WARN_E.cuspideira = e => e.state === 'aim';
WARN_E.besouro = e => e.state === 'crouch';
// the beetle's shell turns any blow from the front while it stands; on its back or rolling it has no guard (rolling, the blow just glances)
// the shell no longer blocks everything (Jonathan, 2026-10-10): hit from the front while it walks, crouches or recovers,
// the blow glances off the armour and only 35% of the damage goes through
const BESOURO_CASCO = 0.35;
const besouroCasco = (e, dir) => (e.state === 'walk' || e.state === 'crouch' || e.state === 'recover') && e.stun <= 0 && dir === -e.facing;
{ const _he = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e.type !== 'besouro' || e.dead || !besouroCasco(e, dir)) return _he(e, dir, mult, melee);
  burst(e.x + e.w / 2 + e.facing * 6, e.y + 5, 5, '#ffd27a', 70, 120, 0.25, 1, true); sfx.block();
  return _he(e, dir, mult * BESOURO_CASCO, melee);
}; }

/* ================= behaviour ================= */
function cvWander(e, dt) { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } }
// rats and spiderlings: run in, a short wind-up, a biting hop, then scurry back
function cvBiter(sp, reach, wind, hopVx) {
  return function (e, dt, dx, dy, dist, aggro) {
    e.stateT -= dt;
    if (e.state === 'wind') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'bite'; e.stateT = 0.5; e.swingHit = false; e.vy = -130; e.vx = e.facing * hopVx; sfx.squeak && sfx.squeak(); } return; }
    if (e.state === 'bite') {
      if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); }
      if ((e.onGround && e.stateT < 0.38) || e.stateT <= 0) { e.state = 'flee'; e.stateT = 0.45 + Math.random() * 0.3; e.atkCD = 0.9 + Math.random() * 0.7; }
      return;
    }
    if (e.state === 'flee') { const d = -(Math.sign(dx) || 1); e.facing = d; walk(e, dt, d, sp * 0.9, 900, 240, dy, false); if (e.stateT <= 0) e.state = 'walk'; return; }
    if (!aggro) cvWander(e, dt);
    let dir = aggro ? (Math.sign(dx) || 1) : e.wander;
    if (aggro && Math.abs(dx) < 8) dir = 0;
    if (dir) e.facing = dir; walk(e, dt, dir, sp + e.lvl * 2, 800, 250, dy, aggro);
    if (aggro && Math.abs(dx) < reach && Math.abs(dy) < 14 && e.atkCD <= 0 && e.onGround && clearPath(e, pl)) { e.state = 'wind'; e.stateT = wind; e.facing = Math.sign(dx) || e.facing; }
  };
}
AI.rato = cvBiter(50, 34, 0.28, 120);   // a bit slower since 2026-10-10 (was 60 and a 140 hop)
AI.filhote = cvBiter(64, 26, 0.22, 120);

// the weaver: waits on a thread over the path and drops; on the ground it crouches and lunges
AI.aranha = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'hang') {
    e.vx = 0; e.vy = -GRAV * dt;   // the thread holds it (gravity is added right after)
    if (!pl.dead && Math.abs(dx) < 34 && dy > 0 && dy < 170 && losClear(e.x + e.w / 2, e.y + e.h + 2, pl.x + pl.w / 2, pl.y + 4)) { e.state = 'drop'; e.vy = 40; e.swingHit = false; e.stateT = 2; sfx.drop && sfx.drop(); }
    return;
  }
  if (e.state === 'drop') {
    e.vx = 0;
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); }
    if (e.onGround || e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.45; e.anchorY = undefined; burst(e.x + e.w / 2, e.y + e.h, 5, '#6a6060', 40, 200, 0.3); }
    return;
  }
  if (e.state === 'crouch') { e.vx = approach(e.vx, 0, 900 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { e.state = 'lunge'; e.stateT = 0.7; e.swingHit = false; e.vy = -200; e.vx = e.facing * clamp(Math.abs(dx) * 2.6, 90, 190); sfx.hiss && sfx.hiss(); } return; }
  if (e.state === 'lunge') {
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); }
    if (e.onGround && e.stateT < 0.55) { e.state = 'recover'; e.stateT = 0.5; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.1 + Math.random() * 0.7; } return; }
  if (!aggro) cvWander(e, dt);
  let dir = aggro ? (Math.sign(dx) || 1) : e.wander;
  if (aggro && Math.abs(dx) < 16) dir = 0;
  if (dir) e.facing = dir; walk(e, dt, dir, 44 + e.lvl * 2, 600, 260, dy, aggro);
  if (aggro && Math.abs(dx) < 58 && Math.abs(dx) > 10 && Math.abs(dy) < 20 && e.atkCD <= 0 && e.onGround && clearPath(e, pl)) { e.state = 'crouch'; e.stateT = 0.45; }
};

// the spitter: keeps its distance, raises its abdomen and throws a glob of web that slows you down
const cvWebs = [];
const WEB_G = 380;
let cvSlowT = 0;
AI.cuspideira = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'aim') {
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) { cvSpit(e, 0); e.state = 'recover'; e.stateT = 0.5; sfx.spit && sfx.spit(); }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2 + Math.random() * 0.9; } return; }
  if (!aggro) cvWander(e, dt);
  const adx = Math.abs(dx);
  const dir = aggro ? (adx > 130 ? Math.sign(dx) : adx < 60 ? -Math.sign(dx) : 0) : e.wander;
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  walk(e, dt, dir, 40 + e.lvl * 2, 500, 250, dy, aggro && dir === Math.sign(dx));
  if (aggro && dist < 175 && e.atkCD <= 0 && e.onGround && losClear(e.x + e.w / 2, e.y + 3, pl.x + pl.w / 2, pl.y + 6)) { e.state = 'aim'; e.stateT = 0.6; }
};
function cvSpit(e, spread, from) {
  const ox = from ? from.x : e.x + e.w / 2 - e.facing * 4, oy = from ? from.y : e.y + 2, tx = pl.x + pl.w / 2, ty = pl.y + pl.h - 6;
  const t = clamp(Math.abs(tx - ox) / 120, 0.35, 1.0) * (1 + spread * 0.5);
  const vx = (tx - ox) / t * (1 + spread), vy = (ty - oy - 0.5 * WEB_G * t * t) / t;
  cvWebs.push({ x: ox, y: oy, vx, vy, dmg: from ? from.dmg : e.dmg, life: 2.5, slow: from ? from.slow : 2 });
}
function cvUpdate(dt) {
  if (cvSlowT > 0) cvSlowT -= dt;
  for (let i = cvWebs.length - 1; i >= 0; i--) {
    const b = cvWebs[i]; b.life -= dt; b.vy = Math.min(b.vy + WEB_G * dt, 400); b.x += b.vx * dt; b.y += b.vy * dt;
    if (Math.random() < dt * 18) parts.push({ x: b.x, y: b.y, vx: rnd(-6, 6), vy: rnd(-4, 6), g: 120, life: 0.35, max: 0.35, col: '#d8d8e2', size: 1 });
    let gone = b.life <= 0;
    if (!gone && !pl.dead && b.x > pl.x - 2 && b.x < pl.x + pl.w + 2 && b.y > pl.y - 2 && b.y < pl.y + pl.h + 2) {
      const r = hurtPlayer(b.dmg, b.x - Math.sign(b.vx) * 4, null, true);
      if (r === 'hit') { cvSlowT = Math.max(cvSlowT, b.slow); floatText(pl.x + pl.w / 2, pl.y - 8, 'PRESO NA TEIA', '#d8d8e2', 0.8); }
      if (r !== 'none' || pl.invuln > 0) { gone = true; burst(b.x, b.y, 10, '#e2e2ea', 60, 200, 0.5); sfx.splat && sfx.splat(); }
    }
    if (!gone && solidAt(Math.floor(b.x / T), Math.floor(b.y / T))) { gone = true; burst(b.x, b.y - 1, 8, '#c8c8d2', 50, 200, 0.5); }
    if (gone) cvWebs.splice(i, 1);
  }
}
HOOK.update.push(cvUpdate);
// stuck in web: half speed while it lasts, and you can see the strands on you
{ const _up = updatePlayer; updatePlayer = function (dt) { if (cvSlowT <= 0) return _up(dt); const s = pl.spd; pl.spd = (1 + s) * 0.5 - 1; try { return _up(dt); } finally { pl.spd = s; } }; }
HOOK.drawTop.push((cx, cy) => {
  for (const b of cvWebs) {
    const x = Math.round(b.x) - cx, y = Math.round(b.y) - cy;
    lc.fillStyle = '#3a3a44'; lc.fillRect(x - 2, y - 1, 5, 3); lc.fillRect(x - 1, y - 2, 3, 5);
    lc.fillStyle = '#c8c8d4'; lc.fillRect(x - 1, y - 1, 3, 3); lc.fillStyle = '#f4f4fa'; lc.fillRect(x - 1, y - 1, 1, 1);
  }
  if (cvSlowT > 0 && !pl.dead) {   // strands clinging to the hero
    const x = Math.round(pl.x) - cx, y = Math.round(pl.y) - cy, a = Math.min(1, cvSlowT * 1.5);
    lc.globalAlpha = 0.75 * a; lc.fillStyle = '#dcdce6';
    for (let k = 0; k < 6; k++) { const px = x + ((k * 5 + 1) % (pl.w + 2)) - 1, py = y + 4 + ((k * 7) % (pl.h - 4)); lc.fillRect(px, py, 1, 3); lc.fillRect(px - 1, py + 1, 3, 1); }
    lc.globalAlpha = 1;
  }
});

// the beetle: plods along shell first; crouches, then rolls at you; a wall knocks it onto its back
// rolando ele cai degraus e quedas de até 10 blocos; mais fundo que isso, para na beira
function besouroDesce(e) {
  const fy = Math.floor((e.y + e.h + 1) / T), fx = Math.floor((e.facing > 0 ? e.x + e.w + 3 : e.x - 3) / T);
  for (let k = 0; k <= 10; k++) if (footAt(fx, fy + k)) return true;
  return false;
}
AI.besouro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'crouch') { e.vx = approach(e.vx, 0, 900 * dt); if (Math.random() < dt * 20) burst(ecx - e.facing * 8, e.y + e.h, 1, '#6a6050', 40, 200, 0.4); if (e.stateT <= 0) { e.state = 'roll'; e.stateT = 1.4; e.swingHit = false; sfx.roll && sfx.roll(); } return; }
  if (e.state === 'roll') {
    e.vx = e.facing * (180 + e.lvl * 6);
    if (Math.random() < dt * 25) burst(ecx - e.facing * 6, e.y + e.h, 1, '#6a6050', 50, 200, 0.4);
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (e.hitWall) { e.state = 'flipped'; e.stateT = 1.7; e.vx = -e.facing * 60; e.vy = -140; shake(3); sfx.slam && sfx.slam(); burst(ecx + e.facing * 8, e.y + 6, 10, '#8a8070', 90, 300, 0.5); }
    else if (e.stateT <= 0 || (e.onGround && !besouroDesce(e))) { e.state = 'recover'; e.stateT = 0.5; e.vx = 0; }
    return;
  }
  if (e.state === 'flipped') { e.vx = approach(e.vx, 0, 300 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.4 + Math.random(); e.vy = -90; } return; }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.6 + Math.random() * 0.8; } return; }
  if (!aggro) cvWander(e, dt);
  e.turnT = (e.turnT || 0) - dt;
  let dir = e.wander;
  if (aggro) { if (e.turnT <= 0) { e.facing = Math.sign(dx) || e.facing; e.turnT = 0.5; } dir = Math.abs(dx) < 14 ? 0 : Math.sign(dx); }
  else if (dir) e.facing = dir;
  walk(e, dt, dir, 20 + e.lvl, 300, 230, dy, aggro);
  // investe até de pertinho (antes só a mais de 2 blocos) e também em quem está uns degraus abaixo (Jonathan 2026-10-14)
  if (aggro && Math.abs(dx) < 130 && dy > -14 && dy < 14 + 3 * T && e.atkCD <= 0 && e.onGround && (Math.abs(dx) < 4 || Math.sign(dx) === e.facing) && clearPath(e, pl)) { e.state = 'crouch'; e.stateT = 0.6; }
};
// on its back the beetle takes double damage
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e.type === 'besouro' && e.state === 'flipped') mult *= 2;
  if (e.type === 'aranha' && e.state === 'hang') { e.state = 'drop'; e.vy = 20; e.swingHit = true; e.stateT = 2; }   // knocked off its thread
  if (e.type === 'bat' && e.state === 'roost') cvWake(e);
  return _hit(e, dir, mult, melee);
}; }

// bats asleep on the roof wake when you come close (or make noise hitting them)
function cvWake(e) { e.state = 'walk'; e.vy = 40; e.atkCD = 0.6; e.memT = 3; sfx.squeak && sfx.squeak(); }
{ const _bat = AI.bat; AI.bat = function (e, dt, dx, dy, dist, aggro) {
  if (e.state === 'roost') { e.vx = 0; e.vy = 0; if (!pl.dead && dist < 64 && clearPath(e, pl)) cvWake(e); return; }
  return _bat(e, dt, dx, dy, dist, aggro);
}; }

// where the roof is right over a spot (tile row of the lowest solid block above, or -1 within max rows)
function cvRoofAbove(tx, ty, max) { for (let k = 1; k <= max; k++) if (solidAt(tx, ty - k)) return ty - k; return -1; }
// put a fresh weaver up on its thread, or a bat to sleep on the roof (56 calls these for cave spawns)
function cvToRoof(e, hang) {
  const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h - 1) / T), r = cvRoofAbove(tx, ty, 12);
  if (r < 0 || ty - r < 4 || solidAt(Math.floor(e.x / T), r + 1) || solidAt(Math.floor((e.x + e.w - 1) / T), r + 1)) return false;
  if (hang === 'thread') { e.anchorY = (r + 1) * T; e.y = e.anchorY + T * (1 + Math.floor(Math.random() * 2)); e.state = 'hang'; }
  else { e.y = (r + 1) * T; e.state = 'roost'; e.roostOff = 0; }
  e.vx = 0; e.vy = 0; return true;
}

/* ---------- sounds ---------- */
Object.assign(sfx, {
  squeak() { tone(1800, 0.06, 'square', 0.03, 600); tone(2300, 0.05, 'square', 0.025, -400, 0.05); },
  hiss() { noise(0.22, 0.07, 3800, 'highpass'); },
  drop() { noise(0.18, 0.05, 2600, 'bandpass', 0, 4); tone(320, 0.15, 'triangle', 0.03, -160); },
  spit() { noise(0.12, 0.08, 1800, 'bandpass', 0, 2); tone(500, 0.08, 'triangle', 0.03, -250); },
  roll() { noise(0.4, 0.07, 300, 'lowpass'); }
});
if (!sfx.slam) sfx.slam = () => { noise(0.2, 0.15, 200, 'lowpass'); };
if (!sfx.splat) sfx.splat = () => { noise(0.12, 0.1, 700, 'lowpass'); };
function clearCaveFx() { cvWebs.length = 0; cvSlowT = 0; }
