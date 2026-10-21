'use strict';

/* ================= As Ruínas dos Acendedores: os loucos (docs/camadas/19-ruinas-acendedores.md, seção 6) =================
   Os Acendedores que ficaram para trás quando a luz acabou. Cinco deles (os outros cinco, as coisas que o fogo virou,
   estão no 414, que também usa as peças comuns daqui, em ACM). Nenhum machuca no toque: todo golpe tem aviso.
   - o Turiferário Louco (turibulo), corpo a corpo. Anda balançando o turíbulo de bronze e acende todo braseiro frio por
     onde passa (são eles que mantêm acesos os braseiros dos templos). Perto do herói gira o turíbulo acima da cabeça,
     deixando um rastro de fagulhas (0,6 s), e varre um círculo inteiro em volta de si;
   - o Faroleiro Cego (faroleiro), à distância. Ergue a lanterna de lente e um fio de luz fina procura o herói (0,9 s;
     no último terço o fio para de seguir), depois o feixe queima a linha toda até a pedra;
   - o Arauto das Cinzas (arauto), apoio. Leva a trompa à boca (0,8 s, o som subindo) e sopra: um anel de cinza quente
     sai dele empurrando e queimando, e os loucos em volta ganham o fervor (6 s, mais fortes e mais rápidos, uma
     auréola de brasa);
   - o Engolidor de Brasas (engolidor), à distância. As bochechas incham e a boca brilha (0,7 s) e ele cospe uma bola de
     fogo que quica pelo chão três vezes;
   - o Alado de Cera (alado), voador. Voa alto sobre o herói com as asas de pena grudadas com cera; a cera das asas
     esquenta e pinga: marcas brilhando no chão (0,8 s), depois as gotas de cera fervendo caem nas marcas.
   Peças comuns (ACM): tintas, o desenho do Acendedor de manto, as faíscas, a queimadura do herói (acQueima), as poças
   de cera (acCera, o 414 usa), os projéteis. Prefixo ac. */

Object.assign(ET, {
  turibulo: { name: 'Turiferário Louco', w: 9, h: 20, hp: 70, dmg: 15, xp: 22, kb: 0.8, fly: false, blood: '#5a2a1a' },
  faroleiro: { name: 'Faroleiro Cego', w: 9, h: 20, hp: 58, dmg: 17, xp: 22, kb: 0.9, fly: false, blood: '#5a2a1a' },
  acArauto: { name: 'Arauto das Cinzas', w: 9, h: 21, hp: 80, dmg: 12, xp: 24, kb: 0.7, fly: false, blood: '#5a2a1a' },
  engolidor: { name: 'Engolidor de Brasas', w: 12, h: 18, hp: 92, dmg: 17, xp: 24, kb: 0.5, fly: false, blood: '#7a2a10' },
  alado: { name: 'Alado de Cera', w: 14, h: 12, hp: 52, dmg: 14, xp: 22, kb: 1, fly: true, blood: '#c8a870' }
});
const AC1_TYPES = ['turibulo', 'faroleiro', 'acArauto', 'engolidor', 'alado'];
// o minério só cai dos bichos daqui; as três bases raras (417) e os materiais da camada
const AC1_DROPS = {
  turibulo: [['brasa_viva', 0.25], ['cera_acendedor', 0.2], ['min_ardorita', 0.07], ['pocao', 0.07], ['aticador', 0.012]],
  faroleiro: [['cera_acendedor', 0.3], ['pavio_eterno', 0.12], ['min_ardorita', 0.07], ['pocao', 0.07], ['capuz_cinza', 0.012]],
  acArauto: [['brasa_viva', 0.2], ['pavio_eterno', 0.15], ['min_ardorita', 0.08], ['pocao', 0.08]],
  engolidor: [['brasa_viva', 0.4, 1, 2], ['min_ardorita', 0.09], ['pocao', 0.07], ['botas_brasa', 0.01]],
  alado: [['cera_acendedor', 0.4, 1, 2], ['min_ardorita', 0.06], ['pocao', 0.06]]
};
function ac1Tables() { for (const k of AC1_TYPES) DROPS[k] = AC1_DROPS[k].filter(([id]) => ITEMS[id]); }
ac1Tables();
Object.assign(NAV_WALKERS, { turibulo: 1, faroleiro: 1, acArauto: 1, engolidor: 1 });
Object.assign(CV_STEP, { turibulo: 1, faroleiro: 1, acArauto: 1, engolidor: 1 });

const AC_GIRA = 0.6, AC_MIRA = 0.9, AC_TROMPA = 0.8, AC_BOCHECHA = 0.7, AC_PINGA = 0.8;

/* ================= peças comuns ================= */
const ACM = {};
{
const { ell, tubo, poly, perna, braco, setO, cp, cg } = TTB;
const R6 = a => a.map(h => ph(h));
const TR = {
  manto: R6(['#0c0a0a', '#1a1614', '#2a2420', '#3c332c', '#524438', '#6a5646']),     // o manto de fuligem
  barra: R6(['#2a0e04', '#4e1c08', '#7a300e', '#a44a16', '#c86a22', '#e89040']),     // a barra bordada da guilda
  pele: R6(['#262020', '#423836', '#62544e', '#82726a', '#a49288', '#c6b4a8']),      // a pele cinzenta, de cinza
  bronze: R6(['#1e140a', '#3a2814', '#5c3e1e', '#80582a', '#a8783a', '#d0a058']),
  cera: R6(['#4a3a24', '#7a6440', '#a8905e', '#cdb682', '#e8d6a6', '#fbf0d0']),
  brasa: R6(['#3a0e04', '#6e1e06', '#a4380a', '#d86214', '#f6962a', '#ffd070']),
  ferro: R6(['#121214', '#222226', '#36363c', '#4c4c54', '#66666e', '#8a8a92']),
  pena: R6(['#1a140e', '#2e2418', '#463a28', '#62523a', '#84704e', '#a89068']),
  tijolo: R6(['#200c08', '#3a1a12', '#5a2a1c', '#7a3c28', '#9a5238', '#b86c4c']),
  osso: R6(['#3a352a', '#5a5444', '#7e7660', '#a29880', '#c8bca0', '#e8e0c8'])
};
const HB = 9, HF = 25;   // o corpo dos de manto: x 9, os pés na linha 25 (o quadro 22 x 26)
// um Acendedor de manto: o capuz, o rosto cinzento com os olhos de brasa, o manto até o chão com a barra bordada.
// o: { st (o passo), lean, bow (curvado), fa: [x, y] a mão da frente (ou null), ba: [x, y] a de trás, hood, R (o manto) }
function manto(P, o, s) {
  const R = o.R || TR.manto, st = o.st || 0, ln = o.lean || 0, bw = o.bow || 0, top = HF - 21 + bw;
  if (o.ba) braco(P, HB - 1 + ln, top + 8, o.ba[0], o.ba[1], R, 1.8, s + 7, 1.2, 1.1);
  // as pernas (só os pés aparecem embaixo do manto)
  for (const [d, b] of [[-1, 1.6], [1, 2.6]]) { const fx = HB + d * 1.4 + d * st; P.line(fx - 1, HF, fx + 1.6, HF, TR.manto, b - 0.8); }
  // o manto: dos ombros à barra, as dobras verticais, rasgado embaixo
  const sh = top + 7, hem = HF - 1;
  poly(P, [[HB - 3.2 + ln, sh - 0.6], [HB + 3.4 + ln, sh - 0.6], [HB + 4.8 + st * 0.4, hem], [HB - 4.6 - st * 0.4, hem]], R,
    (x, y) => 2.4 + (x - HB) * -0.08 + (y < sh + 2 ? 0.6 : 0) + (Math.abs(Math.sin((x - ln * (hem - y) / 14) * 1.7)) < 0.25 ? -0.8 : 0) + cg(x, y, s) * 0.4);
  for (let x = Math.floor(HB - 4.6); x <= HB + 4.8; x++) { if (hash2(x, 1, s) < 0.3) continue; P.put(x, hem - 1, TR.barra, 2.2 + hash2(x, 2, s) * 1.6); if (hash2(x, 3, s) < 0.5) P.put(x, hem, TR.barra, 1.6); }
  // a corda na cintura
  for (let x = HB - 3.4; x <= HB + 3.6; x += 0.5) P.put(x + ln * 0.6, sh + 6, TR.barra, 3);
  // a cabeça: o capuz pontudo caído para trás, o rosto de cinza, os olhos de brasa
  const hx = HB + 0.8 + ln, hy = top + 3.6;
  if (o.hood !== false) { ell(P, hx - 0.6, hy, 3, 3.4, 0.2, R, s + 2, 2.6); P.line(hx - 2.6, hy - 2, hx - 4.2, hy + 0.4, R, 2); }
  ell(P, hx + 0.9, hy + 0.4, 1.6, 2.1, 0, TR.pele, s + 3, 3.4, (u, v) => [TR.pele, u > 0.5 && v > 0.2 ? -1.2 : 0]);
  P.put(hx + 1.6, hy, TR.brasa, 5); P.put(hx + 0.4, hy, TR.brasa, 4);
  P.put(hx + 1.2, hy + 1.8, TR.pele, 1);   // a boca aberta
  if (o.fa) braco(P, HB + 1.4 + ln, sh + 0.6, o.fa[0], o.fa[1], R, 2.8, s + 8, 1.2, 1.1);
  return [hx, hy];
}
// faíscas e cinza (com o brilho da cor delas)
const fx = [], fxGl = {};
function sparks(x, y, n, cols, sp = 40, g = 0, life = 0.5, lit = true) {
  if (fx.length > 600) return;
  for (let i = 0; i < n; i++) fx.push({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[(Math.random() * cols.length) | 0], lit });
}
const ash = (x, y, n, sp = 30, up = -30) => { for (let i = 0; i < n && fx.length < 600; i++) fx.push({ x: x + rnd(-3, 3), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(up, up * 0.2), g: 40, life: rnd(0.5, 1), max: 1, col: ['#4c4844', '#625d57', '#7c766e'][i % 3], lit: false }); };
HOOK.update.push(dt => { for (let i = fx.length - 1; i >= 0; i--) { const p = fx[i]; p.life -= dt; if (p.life <= 0) { fx.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; } });
HOOK.drawWorld.push((cx, cy) => { for (const p of fx) { if (p.lit) continue; lc.globalAlpha = Math.min(1, p.life / p.max * 2) * 0.8; lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, 1, 1); } lc.globalAlpha = 1; });
HOOK.drawGlow.push((cx, cy) => { for (const p of fx) { if (!p.lit) continue; const g = fxGl[p.col] || (fxGl[p.col] = glow(4, p.col)); lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.5; lc.drawImage(g, Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); } lc.globalAlpha = 1; });
HOOK.drawTop.push((cx, cy) => { for (const p of fx) { if (!p.lit) continue; lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, 1, 1); } lc.globalAlpha = 1; });
const FOGO = ['#f6962a', '#ffd070', '#d86214', '#fff0c0'], CERA = ['#e8d6a6', '#fbf0d0', '#cdb682'];
const near = (e, r = 240) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const live = e => e && !e.dead && enemies.includes(e);
const hitsHero = (x, y, m = 3) => !pl.dead && x > pl.x - m && x < pl.x + pl.w + m && y > pl.y - m && y < pl.y + pl.h + m;
function blit(img, e, fx0, fy0, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx0 - ax : fx0 - (img.width - ax)) + jx), fy0 - ay); }
const jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
const pt = (e, x, y, bx, by) => [e.x + e.w / 2 + (x - bx) * e.facing, e.y + e.h - 1 - (by - y)];
const GL = {}, gl = (r, col) => GL[col + r] || (GL[col + r] = glow(r, col));
function floorBelow(x, y, max = 12) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 0; k < max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T; return null; }

/* ---------- a queimadura do herói: alguns segundos ardendo (uma mordida a cada meio segundo, a brasa saindo dele) ---------- */
const burn = { t: 0, dmg: 0, tick: 0 };
function acQueima(dmg, t) { if (pl.dead) return; burn.t = Math.max(burn.t, t); burn.dmg = Math.max(burn.dmg, dmg); if (burn.tick <= 0) burn.tick = 0.5; }
HOOK.update.push(dt => {
  if (burn.t <= 0) return;
  if (pl.dead) { burn.t = 0; return; }
  burn.t -= dt; burn.tick -= dt;
  if (Math.random() < dt * 18) sparks(pl.x + rnd(0, pl.w), pl.y + rnd(4, pl.h), 1, FOGO, 10, -60, 0.6);
  if (burn.tick <= 0) { burn.tick = 0.5; const iv = pl.invuln; pl.invuln = 0; hurtPlayer(Math.max(1, Math.round(burn.dmg)), pl.x + pl.w / 2, null, true); pl.invuln = Math.max(iv, 0); sfx.acChia(0.4); }
  if (burn.t <= 0) burn.dmg = 0;
});
/* ---------- as poças de cera: o herói anda devagar em cima (somem esfriando) ---------- */
const ceras = [];
function acCera(x, y, w, t = 7) {
  const f = floorBelow(x, y - 2, 6); if (f === null) return;
  if (ceras.length > 40) ceras.shift();
  ceras.push({ x0: x - w / 2, x1: x + w / 2, y: f, t, max: t, seed: Math.random() * 99 });
}
HOOK.update.push(dt => {
  for (let i = ceras.length - 1; i >= 0; i--) { const c = ceras[i]; c.t -= dt; if (c.t <= 0) ceras.splice(i, 1); }
  if (pl.dead || !pl.onGround) return;
  const fy = pl.y + pl.h, cx = pl.x + pl.w / 2;
  for (const c of ceras) if (Math.abs(fy - c.y) < 3 && cx > c.x0 && cx < c.x1) { pl.vx = clamp(pl.vx, -42, 42); if (Math.random() < dt * 4) sfx.acCera(0.25); break; }
});
HOOK.drawWorld.push((cx, cy) => {
  for (const c of ceras) {
    const a = Math.min(1, c.t / 1.5), hot = clamp((c.t - (c.max - 2)) / 2, 0, 1);
    for (let x = Math.round(c.x0); x < c.x1; x++) {
      const e = Math.min(x - c.x0, c.x1 - x), h = e < 2 ? 1 : 2;
      lc.globalAlpha = a; lc.fillStyle = hot > 0.3 && hash2(x, 1, c.seed | 0) < 0.4 ? '#ffd070' : hash2(x, 2, c.seed | 0) < 0.5 ? '#cdb682' : '#a8905e';
      lc.fillRect(x - cx, Math.round(c.y) - cy - h, 1, h);
      if (h === 2) { lc.fillStyle = '#e8d6a6'; lc.fillRect(x - cx, Math.round(c.y) - cy - 2, 1, 1); }
    }
  }
  lc.globalAlpha = 1;
});

/* ---------- os projéteis: bola de fogo que quica, gota de cera, brasa lançada ---------- */
const proj = [];
function acProj(o) { proj.push(Object.assign({ t: 0, g: GRAV, bounce: 0, r: 3, life: 5, kind: 'fogo' }, o)); }
HOOK.update.push(dt => {
  for (let i = proj.length - 1; i >= 0; i--) {
    const P = proj[i]; P.t += dt; P.vy = Math.min(P.vy + P.g * dt, MAXFALL);
    let nx = P.x + P.vx * dt, ny = P.y + P.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(P.y / T))) { if (P.bounce > 0) { P.vx = -P.vx * 0.7; nx = P.x; } else { P.dead = true; } }
    if (!P.dead && solidAt(Math.floor(nx / T), Math.floor((ny + P.r) / T)) && P.vy > 0) {
      if (P.bounce > 0) { P.bounce--; ny = Math.floor((ny + P.r) / T) * T - P.r - 0.1; P.vy = -Math.max(140, P.vy * 0.62); sparks(nx, ny + P.r, 5, FOGO, 40, 100, 0.4); sfx.acQuica(near({ x: nx, y: ny }) * 0.7); }
      else P.dead = true;
    }
    if (!P.dead && solidAt(Math.floor(nx / T), Math.floor((ny - P.r) / T)) && P.vy < 0) { P.vy = 0; }
    P.x = nx; P.y = ny;
    if (P.kind === 'fogo' && Math.random() < dt * 30) sparks(P.x, P.y, 1, FOGO, 12, -30, 0.4);
    if (!P.dead && hitsHero(P.x, P.y, P.r)) { const r = hurtPlayer(P.dmg, P.x - Math.sign(P.vx || 1) * 6, null, true); if (r !== 'none' || pl.invuln > 0) { if (r === 'hit' && P.burn) acQueima(P.burn, 1.5); P.dead = true; } }
    if (P.dead || P.t > P.life) {
      if (P.kind === 'cera') { acCera(P.x, P.y, 10 + Math.random() * 6); sparks(P.x, P.y, 4, CERA, 30, 120, 0.4, false); sfx.acCera(near({ x: P.x, y: P.y }) * 0.6); }
      else { sparks(P.x, P.y, 8, FOGO, 50, 60, 0.5); ash(P.x, P.y, 3); }
      proj.splice(i, 1);
    }
  }
});
HOOK.drawGlow.push((cx, cy) => { for (const P of proj) { lc.globalAlpha = P.kind === 'cera' ? 0.35 : 0.8; const g = gl(P.kind === 'cera' ? 8 : 14, P.kind === 'cera' ? '#ffc070' : '#ff8a2a'); lc.drawImage(g, Math.round(P.x - cx - g.width / 2), Math.round(P.y - cy - g.height / 2)); } lc.globalAlpha = 1; });
HOOK.drawTop.push((cx, cy) => {
  for (const P of proj) {
    const x = Math.round(P.x - cx), y = Math.round(P.y - cy);
    if (P.kind === 'cera') { lc.fillStyle = '#7a6440'; lc.fillRect(x - 2, y - 2, 4, 5); lc.fillStyle = '#e8d6a6'; lc.fillRect(x - 1, y - 2, 2, 4); lc.fillStyle = '#fff0c0'; lc.fillRect(x - 1, y - 2, 1, 1); continue; }
    const f = Math.floor(P.t * 14) % 2;
    lc.fillStyle = '#6e1e06'; lc.fillRect(x - 3, y - 3, 6, 6);
    lc.fillStyle = '#d86214'; lc.fillRect(x - 2 - f, y - 2, 4 + f, 4);
    lc.fillStyle = '#ffd070'; lc.fillRect(x - 1, y - 1, 2, 2);
    lc.fillStyle = '#fff0c0'; lc.fillRect(x - 1, y - 1, 1, 1);
  }
});
function clearAcFx() { fx.length = 0; ceras.length = 0; proj.length = 0; burn.t = 0; burn.dmg = 0; }

Object.assign(ACM, { R6, TR, HB, HF, manto, sparks, ash, FOGO, CERA, near, live, hitsHero, blit, jit, pt, gl, floorBelow, acQueima, acCera, acProj, clearAcFx, ceras, proj, burn, setO, cp, cg, ell, tubo, poly, perna, braco });
}

/* ================= arte ================= */
const AC1 = {};
{
const { TR, HB, HF, manto, ell, tubo, poly, perna, braco, setO, cp, cg } = ACM;
// o turíbulo: a bola de bronze furada com as brasas dentro (o drawTop desenha a corrente)
function turibulo(k) {
  const P = cp(7, 8), s = 41301 + k;
  ell(P, 3.5, 4.4, 3, 3.2, 0, TR.bronze, s, 3);
  for (const [x, y] of [[2, 3], [4, 3], [3, 5], [5, 5], [1, 5]]) P.put(x, y, TR.brasa, k ? 5 : 4);
  P.put(3, 0.5, TR.bronze, 4); P.put(3, 1.4, TR.bronze, 2);
  return setO(P.done());
}
// 0 parado (o turíbulo pendurado na frente), 1-2 andando, 3 girando (o braço erguido), 4 a varrida (o braço esticado)
function turiferario(k) {
  const P = cp(22, 26), s = 41311 + k * 7, st = k === 1 ? 1.2 : k === 2 ? -1.2 : 0;
  const fa = k === 3 ? [HB + 3, HF - 23] : k === 4 ? [HB + 8, HF - 13] : [HB + 4.6, HF - 11 + (k ? 0.6 : 0)];
  manto(P, { st, lean: k === 4 ? 1 : 0.4, bow: 1, fa, ba: [HB - 3.6, HF - 10] }, s);
  return setO(P.done());
}
// 0 parado, 1-2 andando, 3 a lanterna erguida na altura dos olhos (o aviso)
function faroleiro(k) {
  const P = cp(22, 26), s = 41331 + k * 7, st = k === 1 ? 1.2 : k === 2 ? -1.2 : 0, up = k === 3;
  const lx = up ? HB + 7 : HB + 6, ly = up ? HF - 17 : HF - 11;
  manto(P, { st, lean: 0, ba: [HB - 3, HF - 10], fa: [lx - 1.6, ly - 1] }, s);
  // a lanterna: a gaiola de ferro, a lente de bronze virada para a frente
  for (let y = ly - 3; y <= ly + 2; y++) { P.put(lx - 1.4, y, TR.ferro, 2); P.put(lx + 1.6, y, TR.ferro, 3); }
  P.line(lx - 1.4, ly - 3.4, lx + 1.6, ly - 3.4, TR.ferro, 3.6); P.line(lx - 1.4, ly + 2.4, lx + 1.6, ly + 2.4, TR.ferro, 2.4);
  for (let y = ly - 2; y <= ly + 1; y++) for (let x = lx - 0.4; x <= lx + 0.6; x++) P.put(x, y, up ? TR.brasa : TR.cera, up ? 5 : 3 + (y < ly ? 1 : 0));
  ell(P, lx + 2.6, ly - 0.6, 0.9, 1.8, 0, TR.bronze, s + 9, 4);
  P.put(lx + 0.1, ly - 4.4, TR.ferro, 3);   // a argola
  // os olhos: vendados com uma tira de pano (cego)
  return setO(P.done());
}
// 0 parado, 1-2 andando, 3 soprando (a trompa erguida, curvado para trás)
function arauto(k) {
  const P = cp(24, 27), s = 41351 + k * 7, st = k === 1 ? 1.2 : k === 2 ? -1.2 : 0, blow = k === 3;
  const [hx, hy] = manto(P, { st, lean: blow ? -1 : 0, R: TR.manto, fa: blow ? [HB + 4, HF - 19] : [HB + 4, HF - 12], ba: blow ? [HB + 2, HF - 18] : [HB - 3.4, HF - 10] }, s);
  // a trompa longa de bronze: da boca para a frente e para cima (soprando), ou pendurada do lado
  if (blow) { tubo(P, hx + 2, hy + 1.6, hx + 10, hy - 4, 0.5, 0.7, TR.bronze, 3.4, s + 9); ell(P, hx + 11, hy - 4.8, 1.4, 2.2, -0.6, TR.bronze, s + 10, 4.2); P.put(hx + 11.6, hy - 5, TR.brasa, 2); }
  else { tubo(P, HB + 4, HF - 13, HB + 5, HF - 4, 0.5, 0.8, TR.bronze, 3.4, s + 9); ell(P, HB + 5.2, HF - 3, 1.6, 1.2, 0, TR.bronze, s + 10, 4); }
  // a estola de brasa (o arauto da guilda)
  for (let y = HF - 15; y < HF - 6; y++) P.put(HB + 1 + (y % 2) * 0.4, y, TR.barra, 3.4);
  return setO(P.done());
}
// o Engolidor: careca, barrigudo, o peito nu cheio de queimaduras, as correntes no pescoço.
// 0 parado, 1-2 andando, 3 bochechas cheias (o aviso), 4 cuspindo
const EB = 11, EF = 21;
function engolidor(k) {
  const P = cp(26, 22), s = 41371 + k * 7, st = k === 1 ? 1 : k === 2 ? -1 : 0, full = k === 3, spit = k === 4;
  perna(P, EB - 2, EF - 7, EB - 3 - st, EF, TR.manto, 1.8, s, 1.4, 0.6);
  perna(P, EB + 2, EF - 7, EB + 3 + st, EF, TR.manto, 2.8, s + 1, 1.4, 0.6);
  // a barriga
  ell(P, EB + 0.4, EF - 9, 5.6, 5.2, 0, TR.pele, s + 2, 3, (u, v) => [TR.pele, hash2(Math.round(u * 9), Math.round(v * 9), s) < 0.08 ? -1.4 : 0]);
  for (let x = EB - 5; x <= EB + 5; x++) P.put(x, EF - 5, TR.barra, 2.6);   // a faixa na cintura
  braco(P, EB - 4, EF - 13, EB - 6, EF - 7, TR.pele, 2.2, s + 3, 1.3, 1.2);
  // a cabeça pequena e careca, as bochechas
  const hx = EB + 2, hy = EF - 15.4, ch = full ? 2.6 : 1.6;
  ell(P, hx, hy, 2.4, 2.6, 0, TR.pele, s + 4, 3.4);
  ell(P, hx + 1.6, hy + 1, ch, ch * 0.9, 0, TR.pele, s + 5, 3.8, (u, v) => [full ? TR.brasa : TR.pele, full ? 0.4 : 0]);
  P.put(hx + 1, hy - 0.6, TR.brasa, 5);
  if (spit) { P.put(hx + 3, hy + 1, TR.brasa, 5); P.put(hx + 3.6, hy + 1.4, TR.brasa, 4); }
  // as correntes no pescoço
  for (let x = hx - 3; x <= hx + 2; x += 1) P.put(x, hy + 3 + Math.abs(x - hx + 0.5) * 0.2, TR.ferro, x % 2 ? 4 : 2);
  braco(P, EB + 4, EF - 13, spit ? EB + 9 : EB + 6, spit ? EF - 14 : EF - 8, TR.pele, 3.2, s + 6, 1.4, 1.2);
  return setO(P.done());
}
// o Alado de Cera: o corpo magro de manto, as asas de penas grudadas com cera. 0-1 batendo, 2 pingando (abertas, a cera clara)
const AB = 15, AF = 13;
function alado(k) {
  const P = cp(32, 18), s = 41391 + k * 7, up = k === 1 ? -3 : 0, drip = k === 2;
  for (const side of [-1, 1]) {
    const tip = AB + side * 15, ty = 3 + (side < 0 ? up : up * 0.6) + (drip ? -1 : 0);
    poly(P, [[AB + side * 1.5, 6], [tip, ty], [tip - side * 3, ty + 4], [AB + side * 6, 10]], TR.pena,
      (x, y) => (side < 0 ? 1.8 : 2.8) + (Math.abs(x - AB) % 3 < 1 ? -0.7 : 0) + cg(x, y, s) * 0.4 + (y < 6 ? 0.8 : 0));
    // a cera escorrendo entre as penas
    for (let f = 0; f < 5; f++) { const x = AB + side * (3 + f * 2.4), y = 6 + f * 0.2 + (ty - 3) * f / 5; P.put(x, y, TR.cera, drip ? 5 : 3.4); P.put(x, y + 1, TR.cera, drip ? 4 : 2.6); if (drip && f % 2) P.put(x, y + 2.4, TR.cera, 5); }
  }
  // o corpo pendurado entre as asas: o manto, as pernas soltas
  poly(P, [[AB - 2, 5], [AB + 2, 5], [AB + 2.6, 12], [AB - 2.4, 12]], TR.manto, (x, y) => 2.4 + cg(x, y, s) * 0.4);
  P.line(AB - 1, 12, AB - 1.6, 16, TR.pele, 2); P.line(AB + 1, 12, AB + 1.4, 16.4, TR.pele, 3);
  ell(P, AB + 0.6, 3.2, 1.8, 2, 0, TR.pele, s + 3, 3.4); P.put(AB + 1.4, 3, TR.brasa, 5);
  return setO(P.done());
}
AC1.get = () => AC1.ready || (AC1.ready = {
  tu: [0, 1, 2, 3, 4].map(turiferario), tb: [0, 1].map(turibulo), fa: [0, 1, 2, 3].map(faroleiro), ar: [0, 1, 2, 3].map(arauto),
  en: [0, 1, 2, 3, 4].map(engolidor), al: [0, 1, 2].map(alado)
});
Object.assign(AC1, { EB, EF, AB, AF });
}

/* ================= desenho ================= */
const { HB: ACM_HB, HF: ACM_HF } = ACM;
const ac1Walk = (e, n = 2) => Math.abs(e.vx) > 4 && e.onGround ? 1 + Math.floor(e.t * 7) % n : 0;
// a corrente e o turíbulo: na mão; girando no aviso; varrendo em volta na varrida
function ac1Turibulo(e) {
  const [hx, hy] = ACM.pt(e, e.state === 'wind' ? ACM_HB + 3 : e.state === 'swing' ? ACM_HB + 8 : ACM_HB + 4.6, e.state === 'wind' ? ACM_HF - 23 : e.state === 'swing' ? ACM_HF - 13 : ACM_HF - 11, ACM_HB, ACM_HF);
  let a, r;
  if (e.state === 'wind') { a = e.t * 16; r = 9; }
  else if (e.state === 'swing') { a = e.swA; r = 2.4 * T; }
  else { a = Math.PI / 2 + Math.sin(e.t * 3) * 0.4 * (e.facing || 1); r = 7; }
  const cx = e.state === 'swing' ? e.x + e.w / 2 : hx, cy = e.state === 'swing' ? e.y + e.h * 0.45 : e.state === 'wind' ? hy - 2 : hy;
  return [hx, hy, cx + Math.cos(a) * r, cy + Math.sin(a) * r * (e.state === 'wind' ? 0.45 : 1)];
}
DRAW_E.turibulo = (e, fx0, fy0, fl) => {
  const S = AC1.get(), k = e.state === 'wind' ? 3 : e.state === 'swing' ? 4 : ac1Walk(e);
  ACM.blit(cvPick(S.tu[k], e, fl), e, fx0, fy0, ACM_HB + 1, ACM_HF + 1, ACM.jit(e, e.state === 'wind'));
  const [hx, hy, bx, by] = ac1Turibulo(e), cx = fx0 - (e.x + e.w / 2), cy = fy0 - (e.y + e.h);
  const n = Math.max(2, Math.ceil(Math.hypot(bx - hx, by - hy) / 1.5));
  lc.fillStyle = '#4c4c54'; for (let i = 0; i < n; i++) { const t = i / n; lc.fillRect(Math.round(hx + (bx - hx) * t + cx), Math.round(hy + (by - hy) * t + cy), 1, 1); }
  const img = S.tb[e.state === 'wind' || e.state === 'swing' ? 1 : 0].r; lc.drawImage(img, Math.round(bx + cx - img.width / 2), Math.round(by + cy - 2));
};
EYES_E.turibulo = (e, fx0, fy0) => { const [, , bx, by] = ac1Turibulo(e), g = ACM.gl(7, '#ff9a3a'); lc.globalAlpha = e.state === 'wind' || e.state === 'swing' ? 0.9 : 0.45; lc.drawImage(g, Math.round(bx + fx0 - (e.x + e.w / 2)) - 7, Math.round(by + fy0 - (e.y + e.h)) - 4); lc.globalAlpha = 1; };
WARN_E.turibulo = e => e.state === 'wind';

DRAW_E.faroleiro = (e, fx0, fy0, fl) => ACM.blit(cvPick(AC1.get().fa[e.state === 'aim' || e.state === 'beam' ? 3 : ac1Walk(e)], e, fl), e, fx0, fy0, ACM_HB + 1, ACM_HF + 1);
EYES_E.faroleiro = (e, fx0, fy0) => { const up = e.state === 'aim' || e.state === 'beam', g = ACM.gl(up ? 10 : 6, '#ffc060'); lc.globalAlpha = up ? 0.9 : 0.5; lc.drawImage(g, Math.round(fx0 + (up ? 7 : 6) * e.facing) - g.width / 2, Math.round(fy0 - (up ? 17 : 11)) - g.height / 2); lc.globalAlpha = 1; };
WARN_E.faroleiro = e => e.state === 'aim';

DRAW_E.acArauto = (e, fx0, fy0, fl) => ACM.blit(cvPick(AC1.get().ar[e.state === 'horn' ? 3 : ac1Walk(e)], e, fl), e, fx0, fy0, ACM_HB + 1, ACM_HF + 1, ACM.jit(e, e.state === 'horn', 30));
WARN_E.acArauto = e => e.state === 'horn';

DRAW_E.engolidor = (e, fx0, fy0, fl) => { const k = e.state === 'swell' ? 3 : e.state === 'spit' ? 4 : ac1Walk(e); ACM.blit(cvPick(AC1.get().en[k], e, fl), e, fx0, fy0, AC1.EB + 1, AC1.EF + 1, ACM.jit(e, e.state === 'swell', 50)); };
EYES_E.engolidor = (e, fx0, fy0) => { if (e.state !== 'swell' && e.state !== 'spit') return; const g = ACM.gl(8, '#ff7a1a'); lc.globalAlpha = 0.5 + 0.4 * clamp(1 - e.stateT / AC_BOCHECHA, 0, 1); lc.drawImage(g, Math.round(fx0 + 3.6 * e.facing) - 8, Math.round(fy0 - 16) - 8); lc.globalAlpha = 1; };
WARN_E.engolidor = e => e.state === 'swell';

DRAW_E.alado = (e, fx0, fy0, fl) => { const k = e.state === 'drip' ? 2 : Math.floor(e.t * 5) % 2; ACM.blit(cvPick(AC1.get().al[k], e, fl), e, fx0, fy0 + 3, AC1.AB + 1, AC1.AF + 1); };
WARN_E.alado = e => e.state === 'drip';

// o fervor do arauto: uma auréola de brasa nos loucos acesos
const ac1Fervor = e => e.acFervor > 0;
HOOK.drawGlow.push((cx, cy) => {
  for (const e of enemies) {
    if (e.dead || !ac1Fervor(e)) continue;
    const g = ACM.gl(12, '#ff7a2a'); lc.globalAlpha = 0.35 + 0.15 * Math.sin(e.t * 9); lc.drawImage(g, Math.round(e.x + e.w / 2 - cx) - 12, Math.round(e.y + e.h / 2 - cy) - 12);
  }
  lc.globalAlpha = 1;
});

/* ================= comportamento ================= */
const ac1Aneis = [], ac1Feixes = [], ac1Marcas = [];
const ac1Spd = e => e.acFervor > 0 ? 1.35 : 1;

/* ---------- o Turiferário ---------- */
AI.turibulo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'wind') {
    e.vx = approach(e.vx, 0, 600 * dt);
    if (Math.random() < dt * 40) { const [, , bx, by] = ac1Turibulo(e); ACM.sparks(bx, by, 1, ACM.FOGO, 8, -10, 0.5); }
    if (e.stateT <= 0) { e.state = 'swing'; e.stateT = 0.4; e.swA = e.facing > 0 ? Math.PI : 0; e.hitThis = false; sfx.acVarre(Math.max(0.5, ACM.near(e))); }
    return;
  }
  if (e.state === 'swing') {   // a varrida: um círculo inteiro em 0,4 s, 2,4 blocos de raio (pega quem estiver dentro dele)
    e.vx = 0; e.swA += dt * (Math.PI * 2 / 0.4) * e.facing;
    const [, , bx, by] = ac1Turibulo(e); if (Math.random() < dt * 60) ACM.sparks(bx, by, 1, ACM.FOGO, 20, 0, 0.4);
    if (!e.hitThis && !pl.dead && Math.hypot(pl.x + pl.w / 2 - (e.x + e.w / 2), pl.y + pl.h / 2 - (e.y + e.h * 0.45)) < 2.4 * T + 6) { e.hitThis = true; const r = hurtPlayer(e.dmg, e.x + e.w / 2, e, false); if (r === 'hit') ACM.acQueima(Math.max(1, Math.round(e.dmg * 0.15)), 1); }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.5 + Math.random() * 0.6; }
    return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 10 ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, (aggro ? 44 : 18) * ac1Spd(e), 600, 260, dy, aggro);
  if (dir) e.facing = dir;
  // acende os braseiros frios por onde passa (é por isso que os templos ainda têm fogo)
  e.litT = (e.litT || 0) - dt;
  if (e.litT <= 0 && !aggro) {
    e.litT = 0.5; const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h - 2) / T);
    for (const ox of [-1, 0, 1]) if (tileAt(tx + ox, ty) === AC_BRASEIRO_FRIO && inAcendedores(ty)) { setTile(tx + ox, ty, AC_BRASEIRO); ACM.sparks((tx + ox) * T + T / 2, ty * T + 4, 8, ACM.FOGO, 30, -40, 0.6); sfx.acAcende(ACM.near(e) * 0.7); break; }
  }
  if (!aggro || e.atkCD > 0 || pl.dead || !e.onGround) return;
  if (dist < 2.6 * T && Math.abs(dy) < 2 * T) { e.state = 'wind'; e.stateT = AC_GIRA; e.vx = 0; sfx.acGira(Math.max(0.5, ACM.near(e))); }
};

/* ---------- o Faroleiro ---------- */
AI.faroleiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const [lx, ly] = ACM.pt(e, ACM_HB + 9.5, ACM_HF - 17.6, ACM_HB, ACM_HF);
  if (e.state === 'aim') {   // o fio fino procura o herói; no último terço para
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT > AC_MIRA / 3 && !pl.dead) { e.tx = pl.x + pl.w / 2; e.ty = pl.y + pl.h / 2; e.facing = Math.sign(e.tx - lx) || e.facing; }
    if (e.stateT <= 0) {
      e.state = 'beam'; e.stateT = 0.25; e.hitThis = false;
      const a = Math.atan2(e.ty - ly, e.tx - lx); let L = 0; while (L < 14 * T && !solidAt(Math.floor((lx + Math.cos(a) * L) / T), Math.floor((ly + Math.sin(a) * L) / T))) L += 3;
      ac1Feixes.push({ x: lx, y: ly, a, L, t: 0, owner: e, dmg: e.dmg, hit: false }); sfx.acFeixe(Math.max(0.5, ACM.near(e, 320)));
    }
    return;
  }
  if (e.state === 'beam') { if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2.2 + Math.random(); } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const want = 7 * T; dir = dist < want - 2 * T ? -Math.sign(dx) : dist > want + 2 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, (aggro ? 38 : 16) * ac1Spd(e), 600, 260, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || pl.dead || !e.onGround) return;
  if (dist < 11 * T && losClear(lx, ly, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'aim'; e.stateT = AC_MIRA; e.vx = 0; e.tx = pl.x + pl.w / 2; e.ty = pl.y + pl.h / 2; sfx.acMira(Math.max(0.4, ACM.near(e, 320))); }
};

/* ---------- o Arauto ---------- */
AI.acArauto = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'horn') {
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) {
      e.state = 'walk'; e.atkCD = 4 + Math.random() * 1.5;
      ac1Aneis.push({ x: e.x + e.w / 2, y: e.y + e.h * 0.5, r: 4, t: 0, dmg: e.dmg, hit: false });
      sfx.acSopro(Math.max(0.5, ACM.near(e, 320)));
      for (const o of enemies) if (!o.dead && o !== e && !o.boss && AC_LOUCOS.includes(o.type) && Math.hypot(o.x - e.x, o.y - e.y) < 9 * T) { o.acFervor = 6; ACM.sparks(o.x + o.w / 2, o.y + o.h / 2, 6, ACM.FOGO, 30, -40, 0.6); }
      e.acFervor = 6;
    }
    return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const want = 4 * T; dir = dist < want - T ? -Math.sign(dx) : dist > want + 2 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, (aggro ? 40 : 16) * ac1Spd(e), 600, 260, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || pl.dead || !e.onGround) return;
  if (dist < 6 * T && e.sees) { e.state = 'horn'; e.stateT = AC_TROMPA; e.vx = 0; sfx.acTrompa(Math.max(0.5, ACM.near(e, 320))); }
};

/* ---------- o Engolidor ---------- */
AI.engolidor = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'swell') {
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) {
      e.state = 'spit'; e.stateT = 0.3;
      const [x, y] = ACM.pt(e, AC1.EB + 4, AC1.EF - 14.4, AC1.EB, AC1.EF), tx = Math.abs(dx);
      ACM.acProj({ x, y, vx: e.facing * clamp(tx * 1.1, 90, 170), vy: -150, bounce: 3, dmg: e.dmg, burn: Math.max(1, Math.round(e.dmg * 0.15)), life: 4.5 });
      sfx.acCospe(Math.max(0.5, ACM.near(e)));
    }
    return;
  }
  if (e.state === 'spit') { if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2 + Math.random(); } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const want = 6 * T; dir = dist < want - 2 * T ? -Math.sign(dx) : dist > want + T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, (aggro ? 32 : 14) * ac1Spd(e), 500, 240, dy, aggro);
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || pl.dead || !e.onGround) return;
  if (dist < 9 * T && dist > 2 * T && Math.abs(dy) < 3 * T && e.sees) { e.state = 'swell'; e.stateT = AC_BOCHECHA; e.vx = 0; sfx.acIncha(Math.max(0.4, ACM.near(e))); }
};

/* ---------- o Alado ---------- */
AI.alado = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'drip') {   // pairando, a cera das asas pinga nas marcas
    e.vx *= Math.pow(0.2, dt); e.vy = approach(e.vy, 0, 200 * dt);
    if (e.stateT <= 0) {
      for (const M of e.marks) ACM.acProj({ x: M.x, y: e.y + e.h + 2, vx: 0, vy: 40, kind: 'cera', r: 2, dmg: e.dmg, life: 4 });
      e.marks = null; e.state = 'fly'; e.atkCD = 2.4 + Math.random(); sfx.acPinga(Math.max(0.4, ACM.near(e)));
    }
    return;
  }
  e.state = 'fly';
  // voa alto, 5 a 6 blocos acima do herói, indo e voltando
  e.ang = (e.ang || Math.random() * 6) + dt * 0.9;
  const ox = aggro ? pcx : e.homeX, oy = (aggro ? pcy : e.homeY) - 5.5 * T;
  let tx = ox + Math.sin(e.ang) * 4 * T, ty = oy + Math.cos(e.ang * 1.7) * T;
  const tx0 = Math.floor((e.x + e.w / 2) / T); let room = 0; for (let k = 1; k < 4; k++) { if (solidAt(tx0, Math.floor(e.y / T) - k)) break; room = k; }
  if (room < 2) ty += T;
  const ax = tx - (e.x + e.w / 2), ay = ty - (e.y + e.h / 2);
  e.vx = approach(e.vx, clamp(ax * 1.6, -80, 80) * ac1Spd(e), 160 * dt); e.vy = approach(e.vy, clamp(ay * 1.6, -70, 70), 160 * dt);
  e.facing = Math.sign(e.vx) || e.facing;
  e.flapT = (e.flapT || 0) - dt; if (e.flapT <= 0) { e.flapT = 0.4; sfx.acAsa(ACM.near(e) * 0.5); }
  if (!aggro || e.atkCD > 0 || pl.dead) return;
  if (Math.abs(dx) < 3 * T && dy > 2 * T && dy < 10 * T && losClear(e.x + e.w / 2, e.y + e.h, pcx, pcy)) {
    // as marcas: 3 pontos no chão, um onde o herói está e dois dos lados
    e.marks = [];
    for (const o of [-1.4 * T, 0, 1.4 * T]) { const x = pcx + o, f = ACM.floorBelow(x, e.y + e.h + 4, 14); if (f !== null) { e.marks.push({ x, y: f }); ac1Marcas.push({ x, y: f, t: AC_PINGA + 0.6, owner: e }); } }
    if (!e.marks.length) return;
    e.state = 'drip'; e.stateT = AC_PINGA; e.vx *= 0.3; sfx.acDerrete(Math.max(0.4, ACM.near(e)));
  }
};

/* ---------- golpes, mortes, nascimento ---------- */
const AC_LOUCOS = ['turibulo', 'faroleiro', 'acArauto', 'engolidor', 'alado', 'cirio', 'pavio', 'faminto', 'fornoandante', 'fagulhas'];
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !AC1_TYPES.includes(e.type)) return r;
  if (e.type === 'faroleiro' && e.state === 'aim' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1); }
  if (e.type === 'acArauto' && e.state === 'horn' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1.5); }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!AC1_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, ACM.near(e, 260));
  if (e.type === 'alado') { ACM.sparks(cx, cy, 10, ['#62523a', '#84704e', '#e8d6a6'], 40, 60, 1.2, false); sfx.acAsa(v); }
  else if (e.type === 'engolidor') { ACM.sparks(cx, cy, 14, ACM.FOGO, 60, -40, 0.7); sfx.acCospe(v * 0.7); }
  else { ACM.ash(cx, e.y + e.h, 8, 40); ACM.sparks(cx, e.y + 6, 4, ACM.FOGO, 20, -30, 0.6); sfx.acCai(v); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !AC1_TYPES.includes(type)) return e;
  if (type !== 'alado') for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  e.state = type === 'alado' ? 'fly' : 'walk';
  return e;
}; }

/* ---------- a cada quadro: o fervor, o anel de cinza, o feixe, as marcas de cera ---------- */
HOOK.update.push(dt => {
  for (const e of enemies) if (e.acFervor > 0) { e.acFervor -= dt; if (!e.acBase) e.acBase = e.dmg; e.dmg = Math.round(e.acBase * (e.acFervor > 0 ? 1.3 : 1)); if (e.acFervor <= 0) { e.dmg = e.acBase; e.acBase = 0; } }
  for (let i = ac1Aneis.length - 1; i >= 0; i--) {
    const A = ac1Aneis[i]; A.t += dt; A.r += dt * 120;
    if (!A.hit && !pl.dead) { const d = Math.hypot(pl.x + pl.w / 2 - A.x, pl.y + pl.h / 2 - A.y); if (Math.abs(d - A.r) < 8) { A.hit = true; const r = hurtPlayer(A.dmg, A.x, null, true); if (r === 'hit') { pl.vx += Math.sign(pl.x + pl.w / 2 - A.x || 1) * 220; pl.vy = Math.min(pl.vy, -140); ACM.acQueima(Math.max(1, Math.round(A.dmg * 0.2)), 1); } } }
    if (Math.random() < dt * 60) { const a = Math.random() * Math.PI * 2; ACM.ash(A.x + Math.cos(a) * A.r, A.y + Math.sin(a) * A.r, 1, 10, -10); }
    if (A.r > 5 * T) ac1Aneis.splice(i, 1);
  }
  for (let i = ac1Feixes.length - 1; i >= 0; i--) {
    const F = ac1Feixes[i]; F.t += dt;
    if (!F.hit && F.t < 0.2) for (let d = 0; d <= F.L; d += 4) if (ACM.hitsHero(F.x + Math.cos(F.a) * d, F.y + Math.sin(F.a) * d, 2)) { const r = hurtPlayer(F.dmg, F.x, null, true); if (r !== 'none' || pl.invuln > 0) { F.hit = true; if (r === 'hit') ACM.acQueima(Math.max(1, Math.round(F.dmg * 0.15)), 1); } break; }
    if (F.t > 0.3) { ACM.sparks(F.x + Math.cos(F.a) * F.L, F.y + Math.sin(F.a) * F.L, 6, ACM.FOGO, 40, 40, 0.5); ac1Feixes.splice(i, 1); }
  }
  for (let i = ac1Marcas.length - 1; i >= 0; i--) { const M = ac1Marcas[i]; M.t -= dt; if (M.t <= 0 || !ACM.live(M.owner)) ac1Marcas.splice(i, 1); }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const e of enemies) {   // o fio de mira do faroleiro: fino, tremendo, mais firme no fim
    if (e.dead || e.type !== 'faroleiro' || e.state !== 'aim') continue;
    const [lx, ly] = ACM.pt(e, ACM_HB + 9.5, ACM_HF - 17.6, ACM_HB, ACM_HF), a = Math.atan2(e.ty - ly, e.tx - lx), q = 1 - e.stateT / AC_MIRA;
    lc.globalAlpha = 0.25 + q * 0.5; lc.fillStyle = q > 0.66 ? '#fff0c0' : '#ffc070';
    for (let d = 4; d < 14 * T; d += 2) { const x = lx + Math.cos(a) * d, y = ly + Math.sin(a) * d; if (solidAt(Math.floor(x / T), Math.floor(y / T))) break; if (hash2(d, Math.floor(e.t * 20), 7) < 0.25 + q * 0.6) lc.fillRect(Math.round(x - cx), Math.round(y - cy), 1, 1); }
  }
  for (const F of ac1Feixes) {   // o feixe: largo, branco no meio
    const k = 1 - F.t / 0.3;
    for (let d = 2; d < F.L; d += 2) { const x = Math.round(F.x + Math.cos(F.a) * d - cx), y = Math.round(F.y + Math.sin(F.a) * d - cy); lc.globalAlpha = k * 0.6; lc.fillStyle = '#ff9a3a'; lc.fillRect(x - 2, y - 2, 4, 4); lc.globalAlpha = k; lc.fillStyle = '#fff0c0'; lc.fillRect(x - 1, y - 1, 2, 2); }
  }
  for (const M of ac1Marcas) { const g = ACM.gl(6, '#ffb050'); lc.globalAlpha = 0.4 + 0.4 * Math.sin(gameTime * 18); lc.drawImage(g, Math.round(M.x - cx) - 6, Math.round(M.y - cy) - 8); }
  for (const A of ac1Aneis) {   // o anel de cinza quente
    lc.globalAlpha = clamp(1 - A.r / (5 * T), 0, 1) * 0.8; lc.fillStyle = '#ff8a3a';
    for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; lc.fillRect(Math.round(A.x + Math.cos(a) * A.r - cx), Math.round(A.y + Math.sin(a) * A.r - cy), 2, 1); }
  }
  lc.globalAlpha = 1;
});
HOOK.drawWorld.push((cx, cy) => { for (const M of ac1Marcas) { lc.fillStyle = '#e8d6a6'; lc.fillRect(Math.round(M.x - cx) - 2, Math.round(M.y - cy) - 1, 4, 1); lc.fillStyle = '#ffd070'; lc.fillRect(Math.round(M.x - cx) - 1, Math.round(M.y - cy) - 1, 2, 1); } });
// a luz dos loucos que carregam fogo (a lanterna, o turíbulo, a boca do engolidor)
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'faroleiro') addL(e.x + e.w / 2 + e.facing * 7, e.y + 6, e.state === 'aim' || e.state === 'beam' ? 0.7 : 0.45);
    else if (e.type === 'turibulo') addL(e.x + e.w / 2, e.y + e.h / 2, 0.4);
    else if (e.type === 'engolidor' && (e.state === 'swell' || e.state === 'spit')) addL(e.x + e.w / 2, e.y + 4, 0.5);
  }
  for (const P of ACM.proj) if (P.kind === 'fogo') addL(P.x, P.y, 0.55);
}; }
function clearAc1Fx() { ac1Aneis.length = 0; ac1Feixes.length = 0; ac1Marcas.length = 0; ACM.clearAcFx(); }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearAc1Fx(); ac1Tables(); return _nw(sd, sv); }; }

/* ---------- sons (do jeito do 97: tom e ruído) ---------- */
Object.assign(sfx, {
  acGira(v = 1) { for (let k = 0; k < 4; k++) noise(0.1, 0.03 * v, 900 + k * 200, 'bandpass', k * 0.14, 3); tone(260, 0.5, 'triangle', 0.01 * v, 120); },
  acVarre(v = 1) { noise(0.3, 0.07 * v, 1100, 'bandpass', 0, 1.2); tone(180, 0.2, 'sawtooth', 0.015 * v, -60); },
  acAcende(v = 1) { noise(0.35, 0.05 * v, 600, 'lowpass', 0, 1); noise(0.12, 0.03 * v, 2600, 'bandpass', 0.05, 3); },
  acMira(v = 1) { tone(1400, 0.8, 'sine', 0.006 * v, 300); tone(700, 0.8, 'sine', 0.005 * v, 150); },
  acFeixe(v = 1) { noise(0.3, 0.08 * v, 1800, 'bandpass', 0, 0.8); tone(900, 0.25, 'sawtooth', 0.015 * v, -500); },
  acTrompa(v = 1) { tone(110, 0.8, 'sawtooth', 0.02 * v, 55); tone(165, 0.8, 'square', 0.006 * v, 80); },
  acSopro(v = 1) { tone(220, 0.5, 'sawtooth', 0.03 * v, -40); noise(0.6, 0.06 * v, 500, 'lowpass', 0, 1); },
  acIncha(v = 1) { noise(0.6, 0.03 * v, 400, 'lowpass', 0, 1); tone(90, 0.6, 'sine', 0.02 * v, 60); },
  acCospe(v = 1) { noise(0.25, 0.08 * v, 900, 'bandpass', 0, 1); tone(200, 0.2, 'square', 0.012 * v, -120); },
  acQuica(v = 1) { noise(0.08, 0.06 * v, 700, 'bandpass', 0, 2); },
  acDerrete(v = 1) { for (let k = 0; k < 4; k++) noise(0.06, 0.02 * v, 1800 + k * 300, 'bandpass', k * 0.15, 4); },
  acPinga(v = 1) { tone(600, 0.1, 'sine', 0.015 * v, -300); noise(0.1, 0.03 * v, 2200, 'bandpass', 0.05, 3); },
  acCera(v = 1) { noise(0.12, 0.03 * v, 500, 'lowpass', 0, 1); },
  acAsa(v = 1) { noise(0.12, 0.04 * v, 700, 'lowpass', 0, 1); },
  acChia(v = 1) { noise(0.2, 0.04 * v, 3000, 'highpass', 0, 1); },
  acCai(v = 1) { noise(0.3, 0.06 * v, 300, 'lowpass', 0, 1); tone(80, 0.25, 'sine', 0.02 * v, -30); }
});
