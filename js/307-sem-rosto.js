'use strict';

/* ================= O Sem-Rosto: o chefe dos Salões do Pesadelo (docs/camadas/14-saloes-pesadelo.md, seção 7) =================
   Um homem alto de casaco comprido com o rosto liso, sem olhos, boca ou nariz. Não anda: mora dentro dos espelhos do
   Salão dos Espelhos (psBoss, 305: 48 x 18 por dentro, chão de assoalho escuro, paredes de vidro de espelho) e sai
   deles. Seis Espelhos grandes (3 x 5 blocos) ficam encostados no fundo, em pontos fixos.
   - A regra da sala: cada espelho aceso faz uma cópia do herói (reflexo), com o desenho, a arma e a roupa dele naquele
     momento. Enquanto houver espelho aceso de pé, ele não leva dano. Cada espelho tem vida própria (cerca de 8 golpes
     de arma forjada do nível); quebrar um estilhaça a cópia e tira 10% da vida dele. Com todos os acesos quebrados, ele
     cai para fora do vidro, fica parado 6 s e leva dano cheio. Depois os espelhos acendem de novo pela fase.
   - Fase 1 (100% a 60%), 2 espelhos: Mão Comprida (a sombra da mão cresce no chão por 1 s e o braço atravessa a sala
     rente ao chão: pule) e Troca (o espelho ondula 0,8 s e ele sai com um golpe de casaco). As cópias repetem o herói
     com 0,5 s de atraso, espelhadas em volta do eixo do espelho delas (decisão em aberto 2, a recomendada): o aviso de
     cada golpe da cópia é o golpe que o próprio herói acabou de dar.
   - Fase 2 (60% a 25%), 3 espelhos: Apagar (a luz da sala cai pela metade por 4 s; só espelhos e cópias brilham) e
     Corredor (as duas pontas da sala se repetem por 3 s; quem corre para a porta volta ao meio).
   - Fase 3 (25% a 0), 4 espelhos (os cacos se refazem se faltar espelho): as cópias lutam sozinhas com a arma do herói;
     ele pega o rosto do herói e anda no meio delas, igual, menos a sombra no chão, que está errada. Mil Mãos: uma mão
     sai de cada espelho de pé, cada uma com a sua sombra antes.
   - Sair ou morrer reinicia a luta: espelhos inteiros, cópias somem, vida cheia. Depois da morte os espelhos ficam
     quebrados para sempre. O lendário: Máscara Sem Rosto.
   Números: nível pela posição da camada (layerBossLvl), vida 330 x (1 + 0,3 (n - 1)), dano 9 x (1 + 0,2 (n - 1)).
   Cópia: vida 260, dano 40% do dano da arma do herói entre 18 e 40, sem defesa. Prefixo sr. */

const SR_L = layerBossLvl('pesadelo');
const SRQ = { hp: Math.round(330 * (1 + 0.3 * (SR_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (SR_L - 1))), xp: 560, p2: 0.6, p3: 0.25 };
const srState = { dead: false };
ET.semrosto = { name: 'O Sem-Rosto', w: 14, h: 42, hp: SRQ.hp, dmg: SRQ.dmg, xp: SRQ.xp, kb: 0, fly: true, phase: true, blood: '#dcd6e4', boss: true };
ET.espelho_sr = { name: 'Espelho', w: 30, h: 58, hp: Math.round(SRQ.hp * 0.13), dmg: 0, xp: 0, kb: 0, fly: true, phase: true, blood: '#dcf0f4' };
ET.reflexo = { name: 'Reflexo', w: 10, h: 20, hp: 260, dmg: 18, xp: 0, kb: 0.6, fly: true, phase: true, blood: '#dcf0f4' };
DROPS.espelho_sr = []; DROPS.reflexo = [];
const SR_DROPS = [['mascara_sem_rosto', 1], ['min_onirita', 1, 6, 10], ['po_de_sono', 1, 2, 4], ['porcelana', 1, 2, 4], ['pocao', 1, 2, 4]];
const srDrops = () => { DROPS.semrosto = SR_DROPS.filter(([id]) => ITEMS[id]); };
const SR_MIRRORS = [-20, -12, -4, 4, 12, 20];   // o meio de cada espelho, em blocos a partir do meio da sala
const SR_LIT = [2, 3, 4];
let srBoss = null;
const srFx = { hands: [], dark: 0, corr: 0, ripple: null, strike: null, say: 0 };

const srB = () => (typeof psBoss !== 'undefined' && psBoss) ? psBoss : null;
const srLap = x => { const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
const srCX = () => srLap(srB().cx * T), srFY = () => srB().fy * T;
const srMX = k => srCX() + SR_MIRRORS[k] * T;   // o eixo do espelho k, em pixels
function srHeroIn(m = 0) { const B = srB(); if (!B) return false; const tx = Math.floor((pl.x + pl.w / 2) / T), ty = Math.floor((pl.y + pl.h - 2) / T); return Math.abs(wdx(tx - B.cx)) <= 23 + m && ty >= B.top - m && ty < B.fy + m; }
const srFight = () => !!(bossFight && bossFight.sr);
const srMirrors = () => enemies.filter(m => m.type === 'espelho_sr' && !m.dead);
const srCopies = () => enemies.filter(m => m.type === 'reflexo' && !m.dead);
function srDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
const srCopyDmg = () => clamp(Math.round(((pl.dmgMin || 10) + (pl.dmgMax || 10)) / 2 * 0.4), 18, 40);

/* ================= arte ================= */
const SRA = {};
{
const { cp } = CVB, { cg } = CVART, { PR, tubo, poly, setO } = PS1;
const R7 = a => a.map(h => ph(h));
const C = {
  casaco: R7(['#060608', '#0e0c12', '#1a1620', '#262030', '#342c40', '#463c54', '#5a4e6a']),
  rosto: R7(['#5a5250', '#867c78', '#b0a6a0', '#d4ccc6', '#ece6e2', '#faf6f4', '#ffffff']),
  moldura: R7(['#1a0e06', '#3a2410', '#5e3c1c', '#8a5e2e', '#b88a44', '#e0b860', '#fff0a0']),
  vidro: R7(['#0e1418', '#1c2a32', '#34505c', '#5a808e', '#94b8c4', '#c4e0ea', '#eefaff'])
};
// o Sem-Rosto, 30 x 48 (os pés no x 14, linha 47): 0 parado, 1 o golpe de casaco (aberto, o braço comprido), 2 caído
// (de joelhos, a cabeça baixa), 3 a mão no rosto
function semRosto(k) {
  const P = cp(30, 48), s = 30701 + k, cx = 14;
  if (k === 2) {   // de joelhos no chão, o casaco aberto em volta
    poly(P, [[cx - 7, 46], [cx + 7, 46], [cx + 4, 26], [cx - 4, 26]], C.casaco, (x, y) => 3 - (x - cx) * 0.2 + cg(x, y, s) * 0.3);
    P.blob(cx + 2, 23, 3, 3.4, C.rosto, s + 1, 4.2);
    tubo(P, cx + 3, 28, cx + 8, 44, 1, 0.9, C.casaco, 2.4, s + 2); P.line(cx + 8, 44, cx + 10, 46, C.rosto, 4);
    return setO(P.done());
  }
  const open = k === 1;
  // as pernas finas debaixo do casaco
  P.line(cx - 1, 36, cx - 2, 47, C.casaco, 2); P.line(cx + 1, 36, cx + 2, 47, C.casaco, 3);
  // o casaco comprido até a canela, abrindo no golpe
  poly(P, [[cx - 3.4, 9], [cx + 3.4, 9], [cx + (open ? 9 : 4.6), 41], [cx - (open ? 8 : 4.8), 41]], C.casaco, (x, y) => 3 - (x - cx) * 0.22 + (Math.abs(x - cx) < 0.6 ? 1.4 : 0) + (y > 39 ? -0.8 : 0) + cg(x, y, s) * 0.3);
  P.line(cx - 3.4, 9, cx + 3.4, 9, C.casaco, 5);
  // o pescoço comprido, a cabeça lisa: só a forma, sem nada dentro
  P.line(cx, 6, cx, 9, C.rosto, 3);
  P.blob(cx + 0.4, 3.4, 2.6, 3.4, C.rosto, s + 1, 4.4, (x, y) => (x - cx) * -0.3 + (y > 4 ? -0.4 : 0.3));
  if (k === 3) { tubo(P, cx + 2, 11, cx + 4, 6, 0.9, 0.8, C.casaco, 3, s + 3); P.blob(cx + 2.4, 3.4, 1.6, 1.4, C.rosto, s + 4, 3.4); }   // a mão passando no rosto
  else if (open) { tubo(P, cx + 3, 11, cx + 26, 20, 0.9, 0.7, C.casaco, 3, s + 3); for (let f = 0; f < 4; f++) P.line(cx + 26, 20, cx + 29, 18 + f * 1.4, C.rosto, 4); }
  else { tubo(P, cx + 3, 11, cx + 4, 34, 0.9, 0.7, C.casaco, 2.6, s + 3); P.line(cx + 4, 34, cx + 4.6, 37, C.rosto, 3.6); }
  return setO(P.done());
}
// o Espelho grande: 36 x 60, moldura dourada gasta; 0 inteiro (vidro frio), 1 aceso (o vidro claro, ondulando no
// desenho ao vivo), 2 quebrado (a moldura com cacos presos e o fundo escuro)
function espelho(k) {
  const P = cp(36, 60), s = 30711 + k;
  for (let y = 0; y < 60; y++) for (let x = 0; x < 36; x++) {
    const fr = x < 3 || x > 32 || y < 3 || y > 56;
    if (fr) { const orn = (x + y) % 6 === 0 ? 0.8 : 0; P.put(x, y, C.moldura, (x < 1 || y < 1 ? 5 : x > 34 || y > 58 ? 1.6 : 3.4) + orn + cg(x, y, s) * 0.4); continue; }
    if (k === 2) {
      const sh = hash2(x >> 2, y >> 2, s) < 0.18 && (x < 9 || x > 27 || y < 10 || y > 50);
      P.put(x, y, sh ? C.vidro : C.casaco, sh ? 4 - (y / 60) * 1.4 : 0.6 + cg(x, y, s) * 0.3);
    } else P.put(x, y, C.vidro, (k ? 3.8 : 2.6) + (x - y * 0.3) * -0.02 + (Math.abs((x - y * 0.4) % 14) < 1 ? 1.4 : 0) + cg(x, y, s) * 0.25);
  }
  // o pé de madeira e a coroa entalhada
  for (let x = 6; x < 30; x++) P.put(x, 59, C.moldura, 1.4);
  P.blob(18, 1, 5, 2, C.moldura, s + 1, 4.6);
  return P.done();
}
SRA.get = () => SRA.ready || (SRA.ready = { b: [0, 1, 2, 3].map(semRosto), m: [0, 1, 2].map(espelho) });
SRA.GL = { frio: glow(26, '#dcf0f4'), branco: glow(12, '#ffffff') };
SRA.C = C;
}

/* ================= a luta ================= */
function srSeal(on) {
  const B = srB(); if (!B) return;
  for (const D of B.doors) {
    const x = wrapX(B.cx + D.side * (D.side > 0 ? 24 : 25));
    for (let y = D.fy - 4; y < D.fy; y++) { const i = y * WW + x; tiles[i] = on ? PS_BARREIRA : AIR; markDirty(x, y); }
  }
}
function srSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; }
function srLight(e) {
  // acende os espelhos da fase: primeiro os inteiros; se faltar, os cacos se refazem
  const want = SR_LIT[e.ph], M = srMirrors();
  for (const m of M) { m.lit = false; m.copyT = 0; }
  let ok = M.filter(m => !m.broken), pick = [];
  while (pick.length < want && ok.length) { const m = ok.splice((Math.random() * ok.length) | 0, 1)[0]; pick.push(m); }
  for (const m of M) if (pick.length < want && m.broken) { m.broken = false; m.hp = m.maxHp; pick.push(m); burst(m.x + m.w / 2, m.y + m.h / 2, 16, '#dcf0f4', 70, -40, 0.8, 1, true); }
  for (const m of pick) { m.lit = true; m.hp = m.maxHp; m.copyT = 0.4 + Math.random() * 0.4; }
  sfx.srAcende();
}
function srStart() {
  srDrops();
  const B = srB(), D = ET.semrosto;
  const e = spawnEnemy('semrosto', srCX() - D.w / 2, srFY() - D.h, PS_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: SR_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, ph: 0, cd: 2, mi: 0, last: '', facing: -1 });
  srSet(e, 'intro', 1.6);
  srBoss = e; bossFight = { e, sr: true };
  for (let k = 0; k < SR_MIRRORS.length; k++) {
    const m = spawnEnemy('espelho_sr', srMX(k) - ET.espelho_sr.w / 2, srFY() - ET.espelho_sr.h, -1);
    Object.assign(m, { psMinion: true, srMinion: true, k, lvl: SR_L, hp: ET.espelho_sr.hp, maxHp: ET.espelho_sr.hp, xp: 0, gold: 0, lit: false, broken: false, facing: 1 });
    m.ax = m.x; m.ay = m.y;
  }
  srFx.hands.length = 0; srFx.dark = 0; srFx.corr = 0; srFx.ripple = null; srFx.strike = null;
  srSeal(true);
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Sem-Rosto'; bn.lastChild.textContent = 'o dono do Salão dos Espelhos'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Sem-Rosto', 'o dono do Salão dos Espelhos');
  sfx.srFase(0.7); shake(2);
}
function srEnd(won) {
  const e = srBoss; srBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) if (m.srMinion && !m.dead) { if (m.type === 'reflexo') burst(m.x + m.w / 2, m.y + m.h / 2, 10, '#dcf0f4', 60, 0, 0.6, 1, true); srDrop(m); }
  srFx.hands.length = 0; srFx.dark = 0; srFx.corr = 0; srFx.ripple = null; srFx.strike = null;
  srSeal(false);
  if (!won) { if (e) srDrop(e); return; }
  srState.dead = true;
  const x = e ? e.x + e.w / 2 : srCX(), y = e ? e.y + e.h / 2 : srFY() - 3 * T;
  burst(x, y, 30, '#ffffff', 130, 40, 1.1, 1, true); burst(x, y, 24, '#dcf0f4', 100, -40, 1.2, 1, true);
  const bases = PS_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.srMorte();
  showBanner('Vitória', 'os espelhos ficam vazios');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.sr) return srEnd(won); return _eb(won); }; }
// cada fase é vivida: o golpe só leva até o piso da fase
const srFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * SRQ.p2) : e.ph === 1 ? Math.floor(e.maxHp * SRQ.p3) : 0;
function srFloor(e) { const f = srFloorHp(e); if (f > 0 && e.hp < f) e.hp = f; }
const srLitStanding = () => srMirrors().some(m => m.lit && !m.broken);
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'semrosto' && !e.dead) { const f = srFloorHp(e); if (f > 0) { e.hp = f; return; } }
  if (e && e.type === 'espelho_sr') { srBreak(e); return; }
  if (e && e.type === 'reflexo') { e.dead = true; burst(e.x + e.w / 2, e.y + e.h / 2, 14, '#dcf0f4', 80, 0, 0.6, 1, true); sfx.srCaco(0.6); const m = srMirrors().find(m => m.k === e.mk); if (m && m.lit && !m.broken) m.copyT = 4; return; }
  return _k(e);
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && !e.dead && ((e.type === 'semrosto' && (e.state !== 'caido' || srLitStanding())) || (e.type === 'espelho_sr' && (!e.lit || e.broken)))) {
    burst(e.x + e.w / 2 + (pl.x < e.x ? -6 : 6), e.y + e.h / 2, 4, '#dcf0f4', 40, 0, 0.3, 1, true); sfx.srVidro(0.4); return;
  }
  const r = _hit.apply(this, arguments);
  if (e && e.type === 'semrosto') srFloor(e);
  return r;
}; }
function srBreak(m) {
  if (m.broken) return;
  m.broken = true; m.lit = false; m.hp = 1; m.dead = false;
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  for (let k = 0; k < 3; k++) burst(cx, cy - 10 + k * 10, 12, k & 1 ? '#dcf0f4' : '#94b8c4', 120, 300, 0.9, 1, true);
  shake(4); sfx.srCaco(1);
  for (const c of srCopies()) if (c.mk === m.k) { burst(c.x + c.w / 2, c.y + c.h / 2, 12, '#dcf0f4', 90, 0, 0.6, 1, true); srDrop(c); }
  const e = srBoss; if (!e) return;
  e.hp = Math.max(Math.max(1, srFloorHp(e)), e.hp - Math.round(e.maxHp * 0.1)); e.flash = 0.15; e.showHp = 3;
  sfx.srGrito();
  if (!srLitStanding()) { srSet(e, 'caido', 6); e.hidden = false; e.x = srCX() - e.w / 2; e.y = srFY() - e.h; srFx.hands.length = 0; srFx.ripple = null; srFx.strike = null; srFx.dark = 0; srFx.corr = 0; for (const c of srCopies()) srDrop(c); sfx.srCai(); }
}

/* ---------- o cérebro ---------- */
function srPick(e, list) {
  let tot = 0; for (const [, w] of list) tot += w;
  for (let n = 0; n < 4; n++) {
    let r = Math.random() * tot, k = list[0][0]; for (const [s, w] of list) { if (r < w) { k = s; break; } r -= w; }
    if (k === e.last && list.length > 1) continue;
    e.last = k; return k;
  }
  return list[0][0];
}
const srStanding = () => srMirrors().filter(m => !m.broken);
function srHands(fromList, warn = 1) {
  // a sombra da mão no chão primeiro, depois o braço rente ao chão; a altura do braço pede pulo
  for (const [x0, dir, len] of fromList) srFx.hands.push({ x0, dir, len, y: srFY() - 6, t: 0, warn, hit: false });
  sfx.srMao(0.6);
}
AI.semrosto = function (e, dt) {
  if (!srB()) { e.dead = true; return; }
  e.vx = e.vy = 0; e.stateT -= dt;
  const hx = pl.x + pl.w / 2;
  if (e.state === 'intro') { if (e.stateT <= 0) { srLight(e); srSet(e, 'oculto', 1.5); e.hidden = true; } return; }
  if (e.state === 'caido') { e.x = srCX() - e.w / 2; e.y = srFY() - e.h; if (e.stateT <= 0) srSet(e, 'ergue', 1); return; }
  if (e.state === 'ergue') {
    if (e.stateT <= 0) { const f = e.hp / e.maxHp; e.ph = Math.max(e.ph, f <= SRQ.p3 + 0.001 ? 2 : f <= SRQ.p2 + 0.001 ? 1 : 0); if (e.ph > 0) { showBanner(e.ph === 1 ? 'As luzes tremem' : 'Ele pegou o seu rosto', ''); sfx.srFase(1); } srLight(e); srSet(e, 'oculto', 1.4); e.hidden = true; }
    return;
  }
  // escondido nos espelhos (na fase 3 anda entre as cópias com o rosto do herói)
  const lit = srMirrors().filter(m => m.lit && !m.broken);
  if (e.ph >= 2) {
    const d = hx - (e.x + e.w / 2);
    if (e.state === 'oculto' || e.state === 'anda') {
      e.state = 'anda'; e.facing = Math.sign(d) || e.facing;
      e.x += clamp(d, -1, 1) * Math.min(Math.abs(d), 62 * dt); e.y = srFY() - e.h;
      e.cd -= dt;
      if (e.cd <= 0) { e.cd = 2.6; if (Math.abs(d) < 26 && Math.random() < 0.6) { srSet(e, 'sombra', 0.6); sfx.srMao(0.4); } else { srSet(e, 'milmaos', 1.5); srHands(srStanding().map(m => [m.x + m.w / 2, Math.sign(hx - m.x - m.w / 2) || 1, 7 * T])); } }
      return;
    }
    if (e.state === 'sombra') { if (e.stateT <= 0) { srSet(e, 'golpe', 0.3); srFx.strike = { x: e.x + e.w / 2, dir: e.facing, t: 0.3, hit: false, w: 30 }; sfx.srCasaco(); } return; }
    if (e.state === 'golpe' || e.state === 'milmaos') { if (e.stateT <= 0) srSet(e, 'anda', 0); return; }
  }
  if (e.state === 'troca') {   // o espelho ondula; ele sai com o casaco aberto
    const m = srMirrors().find(m => m.k === e.mi);
    if (m) { e.x = m.x + m.w / 2 - e.w / 2; e.y = srFY() - e.h; e.facing = Math.sign(hx - (e.x + e.w / 2)) || 1; }
    if (e.stateT <= 0.3 && !srFx.strike && e.hidden) { e.hidden = false; srFx.strike = { x: e.x + e.w / 2, dir: e.facing, t: 0.3, hit: false, w: 34 }; sfx.srCasaco(); }
    if (e.stateT <= 0) { e.hidden = true; srSet(e, 'oculto', 1.6 - e.ph * 0.25); }
    return;
  }
  if (e.state === 'apagar') { e.hidden = false; if (e.stateT <= 0) { srFx.dark = 4; e.hidden = true; srSet(e, 'oculto', 1.2); sfx.srApaga(); } return; }
  if (e.state !== 'oculto') { if (e.stateT <= 0) { e.hidden = true; srSet(e, 'oculto', 1.4); } return; }
  e.hidden = true;
  if (e.stateT > 0) return;
  if (!lit.length) return;
  const list = [['mao', 3], ['troca', 3]];
  if (e.ph >= 1) list.push(['apagar', 1.5], ['corredor', 1.5]);
  const k = srPick(e, list);
  if (k === 'mao') {
    const m = lit[(Math.random() * lit.length) | 0], from = m.x + m.w / 2 < srCX() ? -1 : 1, x0 = srCX() + from * 24 * T;
    e.mi = m.k; srHands([[x0, -from, 48 * T]], 1); srSet(e, 'mao', 1.6);
  } else if (k === 'troca') {
    const m = lit.reduce((a, b) => Math.abs(b.x - pl.x) < Math.abs(a.x - pl.x) ? b : a);
    e.mi = m.k; srFx.ripple = { k: m.k, t: 0.8 }; srSet(e, 'troca', 1.1); sfx.srOnda();
  } else if (k === 'apagar') { srSet(e, 'apagar', 0.7); e.x = srCX() - e.w / 2; e.y = srFY() - e.h; }
  else { srFx.corr = 3; srSet(e, 'oculto', 3.4); sfx.srCorredor(); }
};
// os espelhos: presos no lugar
AI.espelho_sr = function (e, dt) {
  e.vx = e.vy = 0; if (e.ax !== undefined) { e.x = e.ax; e.y = e.ay; }
  if (!srFight()) { e.dead = true; return; }
  if (e.lit && !e.broken) { e.copyT -= dt; if (e.copyT <= 0 && !srCopies().some(c => c.mk === e.k)) { e.copyT = 1e9; srCopy(e); } }
};
function srCopy(m) {
  const c = spawnEnemy('reflexo', m.x + m.w / 2 - ET.reflexo.w / 2, srFY() - ET.reflexo.h, -1); if (!c) return;
  Object.assign(c, { psMinion: true, srMinion: true, mk: m.k, axis: m.x + m.w / 2, lvl: SR_L, hp: 260, maxHp: 260, dmg: srCopyDmg(), xp: 0, gold: 0, facing: 1, cd: 1, lastAtk: -1 });
  burst(c.x + c.w / 2, c.y + c.h / 2, 12, '#dcf0f4', 60, 0, 0.6, 1, true);
}
// as cópias: até a fase 3 repetem o herói com 0,5 s de atraso, espelhadas no eixo do espelho; na fase 3 lutam sozinhas
AI.reflexo = function (e, dt) {
  const B = srB(); if (!B || !srBoss) { e.dead = true; return; }
  e.vx = e.vy = 0;
  const minX = srCX() - 23 * T, maxX = srCX() + 23 * T - e.w, floorY = srFY() - e.h;
  if (srBoss.ph < 2) {
    const R = psRingAt(0.5); if (!R) return;
    e.frame = R; e.facing = -R.f;
    e.x = clamp(2 * e.axis - (R.x + pl.w / 2) - e.w / 2, minX, maxX); e.y = Math.min(floorY, R.y + pl.h - e.h);
    if (R.atk && R.atkAt !== e.lastAtk) {   // o golpe do herói de meio segundo atrás
      e.lastAtk = R.atkAt;
      const ecx = e.x + e.w / 2, hb = { x: e.facing > 0 ? ecx : ecx - 22, y: e.y, w: 22, h: e.h };
      if (!pl.dead && overlap(hb, pl)) hurtPlayer(e.dmg, ecx, e, false);
      e.slashT = 0.2;
    }
  } else {
    e.frame = psRingAt(0);
    const d = pl.x + pl.w / 2 - (e.x + e.w / 2); e.cd -= dt;
    if (e.state === 'wind') { if ((e.stateT -= dt) <= 0) { e.state = 'walk'; e.slashT = 0.2; const ecx = e.x + e.w / 2, hb = { x: e.facing > 0 ? ecx : ecx - 24, y: e.y, w: 24, h: e.h }; if (!pl.dead && overlap(hb, pl)) hurtPlayer(e.dmg, ecx, e, false); e.cd = 1.2 + Math.random() * 0.6; } return; }
    e.facing = Math.sign(d) || e.facing;
    if (Math.abs(d) > 16) e.x = clamp(e.x + Math.sign(d) * 58 * dt, minX, maxX);
    e.y = floorY;
    if (e.cd <= 0 && Math.abs(d) < 24) { e.state = 'wind'; e.stateT = 0.4; }
  }
  e.slashT = Math.max(0, (e.slashT || 0) - dt);
};

/* ---------- os efeitos: mãos, golpe de casaco, a sala que se estica ---------- */
const srHitPl = (x0, x1, y0, y1) => !pl.dead && pl.x + pl.w > Math.min(x0, x1) && pl.x < Math.max(x0, x1) && pl.y + pl.h > y0 && pl.y < y1;
function srFxTick(dt) {
  const e = srBoss; if (!e) return;
  for (let k = srFx.hands.length - 1; k >= 0; k--) {
    const H = srFx.hands[k]; H.t += dt;
    if (H.t >= H.warn) {
      const p = clamp((H.t - H.warn) / 0.35, 0, 1), tip = H.x0 + H.dir * H.len * p;
      if (!H.hit && srHitPl(H.x0, tip, H.y - 10, H.y + 4)) { H.hit = true; hurtPlayer(e.dmg, H.x0, e, false); }
      if (H.t > H.warn + 0.6) srFx.hands.splice(k, 1);
    }
  }
  if (srFx.strike) {
    const S = srFx.strike; S.t -= dt;
    if (!S.hit && srHitPl(S.x - S.w, S.x + S.w, srFY() - 40, srFY())) { S.hit = true; hurtPlayer(Math.round(e.dmg * 1.1), S.x, e, false); }
    if (S.t <= 0) srFx.strike = null;
  }
  if (srFx.ripple) { srFx.ripple.t -= dt; if (srFx.ripple.t <= 0) srFx.ripple = null; }
  srFx.dark = Math.max(0, srFx.dark - dt);
  if (srFx.corr > 0) {
    srFx.corr -= dt;
    // quem corre para a porta volta ao meio
    const rx = pl.x + pl.w / 2 - srCX();
    if (Math.abs(rx) > 20 * T) { const ox = pl.x, oy = pl.y; pl.x = srCX() - pl.w / 2 + Math.sign(rx) * 2 * T; pl.y = srFY() - pl.h; pl.vx = 0; pl.psVoltaFx = { x0: ox, y0: oy, x1: pl.x, y1: pl.y, t: 0.5 }; sfx.srCorredor(0.5); }
  }
}

/* ---------- o desenho ---------- */
let srTintCv = null;
// a cópia: o desenho do herói lavado de branco-azulado, sem olhos
function srDrawCopy(R, fx, fy, facing, a = 1, flash = 0) {
  if (!R) return;
  if (!srTintCv) srTintCv = mk(CW, CHT);
  const g = srTintCv.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, CW, CHT); g.drawImage(R.cv, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.55 + flash * 0.4; g.fillStyle = flash ? '#ffffff' : '#cfe4ee'; g.fillRect(0, 0, CW, CHT); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  lc.globalAlpha = a;
  if (facing < 0) { lc.save(); lc.translate(Math.round(fx), 0); lc.scale(-1, 1); lc.drawImage(srTintCv, -CW / 2, Math.round(fy) - (OY + 22)); lc.restore(); }
  else lc.drawImage(srTintCv, Math.round(fx) - CW / 2, Math.round(fy) - (OY + 22));
  lc.globalAlpha = 1;
}
DRAW_E.semrosto = (e, fx, fy, fl) => {
  if (e.ph >= 2 && (e.state === 'anda' || e.state === 'sombra' || e.state === 'golpe' || e.state === 'milmaos')) {
    // com o rosto do herói, igual às cópias; a sombra no chão está errada: comprida e para o lado errado
    lc.globalAlpha = 0.45; lc.fillStyle = '#05030a'; lc.fillRect(Math.round(fx - e.facing * 4 - (e.facing > 0 ? 22 : 0)), fy - 1, 22, 2); lc.globalAlpha = 1;
    srDrawCopy(psRingAt(0), fx, fy, e.facing, 1, fl ? 1 : 0);
    if (e.state === 'sombra') { lc.globalAlpha = 0.5; lc.fillStyle = '#05030a'; lc.fillRect(Math.round(fx + (e.facing > 0 ? 0 : -30)), fy - 1, 30, 2); lc.globalAlpha = 1; }
    return;
  }
  if (e.hidden && e.state !== 'caido' && e.state !== 'ergue') return;
  const A = SRA.get().b, k = e.state === 'caido' ? 2 : e.state === 'apagar' ? 3 : e.state === 'troca' ? 1 : e.state === 'ergue' ? 0 : 0;
  const set = A[k], img = e.facing > 0 ? (fl ? set.wr : set.r) : (fl ? set.wl : set.l);
  lc.drawImage(img, Math.round(e.facing > 0 ? fx - 15 : fx - (img.width - 15)), fy - 49);
};
EYES_E.semrosto = () => {}; WARN_E.semrosto = e => e.state === 'troca' || e.state === 'sombra';
DRAW_E.espelho_sr = (e, fx, fy, fl) => {
  const M = SRA.get().m, img = e.broken ? M[2] : e.lit ? M[1] : M[0];
  const X = Math.round(fx - 18), Y = fy - 60;
  lc.drawImage(img, X, Y);
  if (e.lit && !e.broken) {
    // o vidro aceso: um brilho que desce devagar; o rosto liso dele aparece no espelho onde ele está
    const ph0 = (gameTime * 0.3 + e.k * 0.17) % 1; lc.globalAlpha = 0.35; lc.fillStyle = '#eefaff'; lc.fillRect(X + 4, Y + 4 + Math.round(ph0 * 50), 28, 1); lc.globalAlpha = 1;
    if (srBoss && srBoss.hidden && srBoss.mi === e.k && srBoss.ph < 2) { lc.globalAlpha = 0.5; lc.fillStyle = '#ece6e2'; lc.fillRect(X + 15, Y + 16, 6, 8); lc.fillRect(X + 16, Y + 15, 4, 10); lc.fillStyle = '#1a1620'; lc.fillRect(X + 12, Y + 26, 12, 24); lc.globalAlpha = 1; }
    const R = srFx.ripple; if (R && R.k === e.k) for (let r = 0; r < 4; r++) { const rad = ((0.8 - R.t) * 40 + r * 7) % 26; lc.globalAlpha = 0.4; lc.strokeStyle = '#ffffff'; lc.lineWidth = 1; lc.beginPath(); lc.ellipse(X + 18, Y + 30, rad * 0.6, rad, 0, 0, Math.PI * 2); lc.stroke(); lc.globalAlpha = 1; }
  }
  if (fl) { lc.globalAlpha = 0.5; lc.fillStyle = '#ffffff'; lc.fillRect(X + 3, Y + 3, 30, 54); lc.globalAlpha = 1; }
};
EYES_E.espelho_sr = () => {}; WARN_E.espelho_sr = () => false;
DRAW_E.reflexo = (e, fx, fy, fl) => {
  srDrawCopy(e.frame, fx, fy, e.facing, 0.92, fl ? 1 : e.state === 'wind' ? 0.6 : 0);
  if (e.slashT > 0) { lc.globalAlpha = e.slashT * 4; lc.strokeStyle = '#ffffff'; lc.lineWidth = 1; lc.beginPath(); lc.arc(Math.round(fx + e.facing * 6), fy - 12, 12, e.facing > 0 ? -1.2 : Math.PI - 0.4, e.facing > 0 ? 0.4 : Math.PI + 1.2); lc.stroke(); lc.globalAlpha = 1; }
};
EYES_E.reflexo = () => {}; WARN_E.reflexo = e => e.state === 'wind';
// os espelhos de fora da luta: inteiros esperando, ou quebrados para sempre
HOOK.drawWorld.push((cx, cy) => {
  const B = srB(); if (!B || srFight() || !pl) return;
  const sx = srCX() - cx, sy = srFY() - cy; if (sx < -400 || sx > VW + 400 || sy < -60 || sy > VH + 300) return;
  const M = SRA.get().m;
  for (const off of SR_MIRRORS) lc.drawImage(srState.dead ? M[2] : M[0], Math.round(sx + off * T - 18), Math.round(sy - 60));
});
HOOK.drawWorld.push((cx, cy) => {
  if (!srBoss) return;
  for (const H of srFx.hands) {
    const y = Math.round(H.y + 6 - cy), x0 = Math.round(H.x0 - cx);
    if (H.t < H.warn) {   // a sombra crescendo no chão
      const L = Math.round(H.len * (H.t / H.warn)); lc.globalAlpha = 0.55; lc.fillStyle = '#05030a';
      lc.fillRect(H.dir > 0 ? x0 : x0 - L, y - 2, L, 2); lc.globalAlpha = 1;
    } else {
      const p = clamp((H.t - H.warn) / 0.35, 0, 1), L = Math.round(H.len * p), yy = Math.round(H.y - cy);
      lc.fillStyle = '#1a1620'; lc.fillRect(H.dir > 0 ? x0 : x0 - L, yy - 3, L, 4); lc.fillStyle = '#342c40'; lc.fillRect(H.dir > 0 ? x0 : x0 - L, yy - 3, L, 1);
      const tx = x0 + H.dir * L; lc.fillStyle = '#ece6e2'; lc.fillRect(tx - (H.dir > 0 ? 0 : 5), yy - 5, 5, 6); lc.fillStyle = '#b0a6a0'; for (let f = 0; f < 4; f++) lc.fillRect(tx + H.dir * (5 + (f & 1)), yy - 5 + f + f, 2, 1);
    }
  }
  const S = srFx.strike; if (S) { lc.globalAlpha = S.t / 0.3 * 0.6; lc.fillStyle = '#1a1620'; lc.fillRect(Math.round(S.x - cx + (S.dir > 0 ? 0 : -S.w)), Math.round(srFY() - cy - 30), S.w, 22); lc.globalAlpha = 1; }
});
HOOK.drawTop.push((cx, cy) => {
  if (!srBoss) return;
  // Apagar: a sala cai pela metade; os espelhos e as cópias brilham por cima
  if (srFx.dark > 0) {
    lc.globalAlpha = 0.55 * clamp(Math.min(srFx.dark / 0.3, (4 - srFx.dark) / 0.3), 0, 1); lc.fillStyle = '#000000'; lc.fillRect(0, 0, VW, VH); lc.globalAlpha = 1;
    lc.globalCompositeOperation = 'lighter';
    for (const m of srMirrors()) if (m.lit && !m.broken) { lc.globalAlpha = 0.4; lc.drawImage(SRA.GL.frio, Math.round(m.x + m.w / 2 - cx) - 26, Math.round(m.y + m.h / 2 - cy) - 26); }
    for (const c of srCopies()) { lc.globalAlpha = 0.5; lc.drawImage(SRA.GL.branco, Math.round(c.x + c.w / 2 - cx) - 12, Math.round(c.y + c.h / 2 - cy) - 12); }
    lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = 1;
  }
  // Corredor: as pontas da sala se repetem (um pedaço da tela copiado para fora, sem ler pixel)
  if (srFx.corr > 0) {
    const cv = lc.canvas, L = Math.round(srCX() - 23 * T - cx), Rr = Math.round(srCX() + 23 * T - cx), w = 6 * T, top = Math.round(srFY() - 18 * T - cy), h = 18 * T;
    lc.globalAlpha = Math.min(1, srFx.corr) * 0.7;
    for (let k = 1; k <= 3; k++) { lc.drawImage(cv, L, top, w, h, L - k * w * 0.5, top, w, h); lc.drawImage(cv, Rr - w, top, w, h, Rr - w + k * w * 0.5, top, w, h); }
    lc.globalAlpha = 1;
  }
});
HOOK.drawGlow.push((cx, cy) => {
  if (!srBoss) return;
  for (const m of srMirrors()) if (m.lit && !m.broken) { lc.globalAlpha = 0.28 + 0.06 * Math.sin(gameTime * 2 + m.k); lc.drawImage(SRA.GL.frio, Math.round(m.x + m.w / 2 - cx) - 26, Math.round(m.y + m.h / 2 - cy) - 26); }
  lc.globalAlpha = 1;
});

/* ---------- o turno: acordar, sair, a luta ---------- */
HOOK.update.push(dt => {
  const B = srB(); if (!B || !pl || state !== 'play' || srState.dead) return;
  if (!bossFight && !pl.dead && srHeroIn(0)) srStart();
  const e = srBoss;
  if (!e || !srFight()) return;
  if (!pl.dead && !srHeroIn(2)) { endBossFight(false); return; }
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
  for (const c of srCopies()) c.dmg = srCopyDmg();
  srFxTick(dt);
});

/* ---------- o lendário: a Máscara Sem Rosto ---------- */
STAT_DEF.lgReflexo = { t: 'Uma vez a cada 40 s, o golpe que mataria você é absorvido e um reflexo seu luta ao seu lado por 6 s', flag: 1 };
STAT_KEYS.push('lgReflexo');
ITEMS.mascara_sem_rosto = {
  name: 'Máscara Sem Rosto', slot: 'head', rar: 4, def: 9, hp: 30, g: 0,
  art: ["..wwwwwww...", ".wWWWWWWWw..", ".wWWWWWWWw..", ".wWWWWWWWw..", ".wWWWWWWWw..", "..wWWWWWw...", "...wwwww...."], oy: -1, pal: { w: '#b0a6a0', W: '#faf6f4' },
  legend: [['lgReflexo', 1], ['def', 4], ['hp', 20]],
  desc: 'Um rosto liso, sem olhos, sem boca. Quem a usa continua enxergando. E o espelho, às vezes, luta por você.'
};
BASE_INFO.mascara_sem_rosto = [SR_L];
ITEM_G.mascara_sem_rosto = 0;
srDrops();
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgReflexo || 0;
  if (pl.lg) pl.lg.reflexo = b > 0;
  return r;
}; }
let srAlly = null, srAllyCd = -99;
{ const _rd = rawDamage; rawDamage = function (d, kdir) {
  if (pl && !pl.dead && pl.lg && pl.lg.reflexo && pl.hp - d <= 0 && gameTime >= srAllyCd) {
    srAllyCd = gameTime + 40; pl.invuln = 0.75;
    srAlly = { x: pl.x - pl.facing * 14, y: pl.y, f: pl.facing, t: 6, hitT: 0 };
    burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 20, '#dcf0f4', 90, 0, 0.6, 1, true); sfx.srAcende();
    return;
  }
  return _rd(d, kdir);
}; }
HOOK.update.push(dt => {
  if (!srAlly || !pl) return;
  const A = srAlly; A.t -= dt; A.hitT -= dt;
  if (A.t <= 0 || pl.dead) { burst(A.x + pl.w / 2, A.y + pl.h / 2, 12, '#dcf0f4', 70, 0, 0.6, 1, true); srAlly = null; return; }
  // anda ao lado do herói e golpeia quem estiver perto, com a arma dele
  let best = null, bd = 40; for (const e of enemies) { if (e.dead || e.srMinion || e.type === 'quadrotorto') continue; const d = Math.hypot(e.x + e.w / 2 - A.x - pl.w / 2, e.y + e.h / 2 - A.y - pl.h / 2); if (d < bd) { bd = d; best = e; } }
  const tx = best ? best.x + best.w / 2 - pl.w / 2 - Math.sign(best.x - A.x) * 12 : pl.x - pl.facing * 14;
  A.x = approach(A.x, tx, 110 * dt); A.y = approach(A.y, best ? best.y + best.h - pl.h : pl.y, 160 * dt);
  A.f = best ? Math.sign(best.x - A.x) || A.f : pl.facing;
  if (best && bd < 26 && A.hitT <= 0) { A.hitT = 0.55; A.slash = 0.2; hitEnemy(best, A.f, 0.6, true); }
  A.slash = Math.max(0, (A.slash || 0) - dt);
});
HOOK.drawWorld.push((cx, cy) => {
  const A = srAlly; if (!A) return;
  srDrawCopy(psRingAt(0), A.x + pl.w / 2 - cx, A.y + pl.h - cy, A.f, Math.min(1, A.t) * 0.85, 0);
});

/* ---------- som: vidro, um coro abafado, o grito sem boca ---------- */
Object.assign(sfx, {
  srFase(v = 1) { tone(196, 1.6 * v, 'sine', 0.05, -40); tone(233, 1.4 * v, 'sine', 0.03, -50, 0.1); noise(1.2 * v, 0.03, 900, 'bandpass', 0, 1); },
  srAcende() { for (let k = 0; k < 4; k++) tone(1568 + k * 220, 0.3, 'sine', 0.015, -300, k * 0.06); },
  srVidro(v = 1) { tone(2400, 0.08, 'sine', 0.03 * v, -900); },
  srCaco(v = 1) { noise(0.3, 0.12 * v, 5200, 'highpass'); for (let k = 0; k < 5; k++) tone(2000 + Math.random() * 1600, 0.15, 'sine', 0.02 * v, -800, k * 0.04); },
  srGrito() { noise(0.6, 0.06, 700, 'bandpass', 0, 3); tone(140, 0.6, 'sawtooth', 0.025, 260); },
  srCai() { noise(0.3, 0.1, 300, 'lowpass'); tone(80, 0.4, 'sine', 0.08, -30); },
  srMao(v = 1) { noise(0.5, 0.04 * v, 400, 'lowpass'); },
  srOnda() { tone(520, 0.8, 'sine', 0.025, -120); tone(780, 0.6, 'sine', 0.015, 120, 0.1); },
  srCasaco() { noise(0.18, 0.1, 800, 'bandpass', 0, 0.7); },
  srApaga() { tone(330, 1.2, 'sine', 0.04, -220); noise(1, 0.02, 300, 'lowpass'); },
  srCorredor(v = 1) { tone(440 * v, 0.6, 'sine', 0.02, -100); tone(440 * v, 0.6, 'sine', 0.012, -100, 0.25); tone(440 * v, 0.6, 'sine', 0.008, -100, 0.5); },
  srMorte() { for (let k = 0; k < 6; k++) { noise(0.3, 0.06, 4000 + k * 300, 'highpass', k * 0.12); tone(1800 - k * 200, 0.4, 'sine', 0.02, -600, k * 0.12); } tone(98, 2.4, 'sine', 0.05, -20); }
});
