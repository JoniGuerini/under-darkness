'use strict';

/* ================= O Olho-Cometa: o chefe da Nave Caída =================
   O Planetário (docs/camadas/10-nave-caida.md, seção 7). O 245 reserva no Núcleo um quadrado maciço de Metal do Reator
   de lado 2 x (r + 3) em volta de (cx, cy), cava os dois corredores até a borda da caixa e chama nvDress; este arquivo
   escreve a sala dentro dele: a esfera de raio r (22) com a casca de Metal do Reator de 2 blocos, o céu holográfico
   atrás (parede de reator e de neon, a terceira camada DP_NV_CEU), o chão em bacia rasa (grade por cima do reator) na
   altura das portas (o fy das portas; sem portas, nvBoss.fy), o planeta holográfico listrado (NV_PLANETA, raio 5, no
   nvBoss.planet), o anel inclinado de NV_ANEL (nvBoss.ring, 13 x 4) que dá a volta nele e serve de plataforma, as
   grades dos lados (a cada 4 fileiras, alternadas entre a da parede e a de dentro: sobe-se de 2 em 2) e os dois túneis
   das portas (4 de altura, de door.x, na borda da caixa, até o ar de dentro; a barreira é a parte que cruza a casca).
   Pisar dentro da esfera acorda o Olho; a Barreira de Energia fecha as duas portas. Fora da luta nada da esfera quebra.
   Sair (portal, teleporte) ou morrer refaz a esfera pelo plano (o rastro some, o anel volta inteiro, os discos somem)
   e o Olho volta com a vida cheia.
   O rastro arco-íris (NV_RASTRO) é escrito direto em tiles (sem setTile): nunca entra nos diffs nem no save; dura 4 s,
   pisca no último segundo e some. A barreira e os setores do anel também vão direto em tiles.
   Três fases, todo golpe com aviso:
     1. a órbita (100% a 60%): gira em volta do planeta deixando o rastro. Lágrima de luz (a pupila contrai, linha de
        mira 0,7 s; a lágrima corre reta, 60%). Piscada (a pálpebra fecha 0,5 s, some num estalo, aparece do outro
        lado do planeta).
     2. os discos (60%): dois Discos Abdutores entram pelas portas (uma vez). O anel gira em setores: um quarto pisca
        rosa 1 s, some 3 s, volta, e o próximo. Investida-cometa (recua, a cauda cresce, faixa tracejada 1 s; atravessa
        a esfera em reta deixando um rastro longo, 90%).
     3. o olho arregalado (30%): a íris vira um arco-íris girando. Feixe arco-íris (para no alto, a pupila dilata, o
        leque aparece no chão 1,2 s; varre a esfera de um lado ao outro, 100%; o planeta e todo bloco sólido fazem
        sombra). Chuva de estrelas (marca no chão 0,6 s antes, 40% cada).
   Solta a Cauda do Cometa (espada lendária: cada golpe deixa um rasgo arco-íris no ar que corta de novo meio segundo
   depois, com 50% do golpe; luz 1) e, na primeira vitória, uma das três bases da camada. A morte fica salva
   (olhoCometa.dead).
   Encaixe como a Rainha (196): nvDress, endBossFight, hitEnemy, killEnemy, breakTile, pickImpact, recalc, weaponFor,
   propLights, cathedralDeep, makeSave e newWorld embrulhados; o resto por AI/DRAW_E/HOOK. Carrega depois do 199, antes
   do 249 e do 49 (que escala ET). */

// nível pelo registro das camadas (129); números escritos como os dos monstros, o 49 escala
const OCQ_L = layerBossLvl('nave');
const OCQ = { hp: Math.round(340 * (1 + 0.3 * (OCQ_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (OCQ_L - 1))), xp: 500, p2: 0.6, p3: 0.3, rastro: 4, pisca: 1 };
const ocState = { dead: false };
ET.olhocometa = { name: 'O Olho-Cometa', w: 28, h: 28, hp: OCQ.hp, dmg: OCQ.dmg, xp: OCQ.xp, kb: 0, fly: true, phase: true, blood: '#ffe53a', boss: true };
const OCQ_DROPS = [['cauda_cometa', 1], ['min_xenita', 1, 6, 10], ['cristal_plasma', 1, 2, 4], ['chip_alien', 1, 2, 5], ['pocao', 1, 2, 4]];
const OCQ_BASES = ['pistola_raio', 'escudo_disco', 'capacete_astronauta'];
const ocDrops = () => { DROPS.olhocometa = OCQ_DROPS.filter(([id]) => ITEMS[id]); };
ocDrops();
let ocBoss = null, ocPlan = null, ocChecked = false, ocAllow = false;
const ocFx = { trail: new Map(), tears: [], stars: [], slashes: [], seal: null, ring: null, discos: [], seq: 0, chimeT: 0 };
const ocIdleE = { lx: 0, ly: 0, plx: 0, ply: 0, tail: [], tailN: 22, look: [0, 0], lid: 0.55, pup: 3, t: 0, facing: 1, rainbow: false };

/* ---------- geometria (o centro é o meio do bloco cx, cy; i, j em blocos a partir dele, como inNvHall) ---------- */
const OK_F = 0, OK_C = 1, OK_A = 2, OK_P = 3, OK_PL = 4, OK_AN = 5, OK_G = 6, OK_T = 7, OK_B = 8;   // fora, casca, ar, chão, planeta, anel, grade, túnel, barreira
const ocB = () => (typeof nvBoss !== 'undefined' && nvBoss) ? nvBoss : null;
const ocLap = x => { const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
const ocCX = () => ocLap((ocB().cx + 0.5) * T), ocCY = () => (ocB().cy + 0.5) * T;
const ocIdx = (i, j) => { const B = ocB(); return (B.cy + j) * WW + wrapX(B.cx + i); };
function ocIJ(tx, ty) { const B = ocB(); if (!B) return null; const H = (B.r || 22) + 3, i = wdx(wrapX(tx) - B.cx), j = ty - B.cy; return Math.abs(i) <= H && Math.abs(j) <= H ? [i, j] : null; }
const ocInBox = (tx, ty) => !!ocIJ(tx, ty);
const ocK = (i, j) => { const P = ocPlan; return Math.abs(i) <= P.H && Math.abs(j) <= P.H ? P.k[(j + P.H) * P.N + i + P.H] : OK_F; };
const ocLive = () => !!(ocB() && ocPlan && !ocState.dead);
const ocFight = () => !!(bossFight && bossFight.oc);
function ocHero() { const lx = pl.x + pl.w / 2 - ocCX(), ly = pl.y + pl.h / 2 - ocCY(); return { lx, ly, d: Math.hypot(lx, ly) / T }; }
function ocDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
const ocDirty = idx => markDirty(idx % WW, (idx / WW) | 0);

/* ---------- o plano da esfera (a semente: o que nvDress escreve e o que o reinício devolve) ---------- */
function ocLayout() {
  const B = ocB(), R = B.r || 22, RI = R - 2, H = R + 3, N = 2 * H + 1, n = N * N;
  const t = new Uint16Array(n), w = new Uint8Array(n), k = new Uint8Array(n), sec = new Int8Array(n).fill(-1), fr = new Uint8Array(n);
  const q = (i, j) => (j + H) * N + (i + H), inb = (i, j) => Math.abs(i) <= H && Math.abs(j) <= H;
  // o chão fica na altura das portas (o corredor chega no nível do chão); sem portas, no fy da sala
  const dfy = (B.doors || []).map(D => D.fy).filter(v => v != null);
  const fyJ = clamp((dfy.length ? Math.max(...dfy) : B.fy != null ? B.fy : B.cy + 12) - B.cy, 6, RI - 2);
  const PL = B.planet || { cx: B.cx, cy: B.cy, r: 5 }, pi = wdx(PL.cx - B.cx), pj = PL.cy - B.cy, pr = PL.r || 5;
  const RG = B.ring || { rx: 13, ry: 4 };
  // o chão: uma bacia rasa (o meio 2 abaixo das bordas), grade por cima do reator
  const hw = Math.sqrt(Math.max(1, RI * RI - (fyJ - 1) * (fyJ - 1)));
  const surf = i => fyJ + (Math.abs(i) < hw * 0.3 ? 2 : Math.abs(i) < hw * 0.62 ? 1 : 0);
  for (let j = -H; j <= H; j++) for (let i = -H; i <= H; i++) {
    const d = Math.hypot(i, j); if (d > R) continue;
    const Q = q(i, j);
    if (d > RI) { t[Q] = NV_REATOR; w[Q] = WNV_REATOR; k[Q] = OK_C; continue; }
    w[Q] = d > RI - 3 ? WNV_NEON : WNV_REATOR;
    if (j >= surf(i)) { t[Q] = j === surf(i) ? NV_GRADE : NV_REATOR; k[Q] = OK_P; continue; }
    t[Q] = AIR; k[Q] = OK_A;
  }
  // os túneis das portas: de onde o corredor encosta na caixa, 4 de altura (como o corredor) até o ar de dentro
  const doors = (B.doors && B.doors.length ? B.doors : [-1, 1].map(side => ({ side, fy: B.cy + fyJ, x: B.cx + side * Math.ceil(Math.sqrt(Math.max(0, R * R - (fyJ - 2) * (fyJ - 2)))) })));
  const dd = [];
  for (const D of doors) {
    const side = D.side || Math.sign(wdx(D.x - B.cx)) || 1, jf = clamp((D.fy != null ? D.fy : B.cy + fyJ) - B.cy, -RI + 4, H);
    let i = clamp(wdx(D.x - B.cx), -H, H), inner = i;
    const bar = [], outer = [];
    for (let s = 0; s < 18 && i * side > -2; s++, i -= side) {
      let open = true;
      for (let j = jf - 4; j <= jf - 1; j++) {
        if (!inb(i, j)) continue; const Q = q(i, j); if (k[Q] === OK_A || k[Q] === OK_T || k[Q] === OK_B) continue;
        open = false; t[Q] = AIR; w[Q] = WNV_REATOR;
        const d = Math.hypot(i, j); k[Q] = d > RI && d <= R ? OK_B : OK_T;
        if (k[Q] === OK_B) bar.push([i, j]); else if (s < 2) outer.push([i, j]);
      }
      if (inb(i, jf)) { const Q = q(i, jf); if (k[Q] === OK_F || k[Q] === OK_A) { t[Q] = NV_REATOR; w[Q] = WNV_REATOR; k[Q] = k[Q] === OK_F ? OK_T : OK_P; } }
      inner = i;
      if (open && s > 0) break;
    }
    // casca fina demais (ou o corredor já entra no ar): a barreira fica na boca do túnel
    if (!bar.length) for (const c of outer) { bar.push(c); k[q(c[0], c[1])] = OK_B; }
    dd.push({ side, ii: inner, jf, bar });
  }
  // o planeta e o anel: a metade da frente do anel passa por cima do planeta
  for (let j = Math.floor(pj - pr - 1); j <= pj + pr + 1; j++) for (let i = Math.floor(pi - pr - 1); i <= pi + pr + 1; i++) {
    if (!inb(i, j)) continue; const Q = q(i, j);
    if (k[Q] === OK_A && Math.hypot(i - pi, j - pj) <= pr + 0.12) { t[Q] = NV_PLANETA; k[Q] = OK_PL; }
  }
  const tilt = -0.2, ca = Math.cos(tilt), sa = Math.sin(tilt), ring = [];
  for (let s = 0; s < Math.PI * 2; s += 0.004) {
    const x = RG.rx * Math.cos(s), y = RG.ry * Math.sin(s), i = Math.round(pi + x * ca - y * sa), j = Math.round(pj + x * sa + y * ca);
    if (!inb(i, j)) continue; const Q = q(i, j), front = Math.sin(s) > 0;
    if (k[Q] === OK_A || (front && k[Q] === OK_PL)) { t[Q] = NV_ANEL; k[Q] = OK_AN; fr[Q] = front ? 1 : 0; sec[Q] = Math.floor(((s + Math.PI / 4) % (Math.PI * 2)) / (Math.PI / 2)); ring.push([i, j, sec[Q]]); }
  }
  // as grades dos lados: a de dentro na 3ª fileira acima do chão, a da parede 2 acima dela, e assim por diante
  const free = (i, j) => inb(i, j) && k[q(i, j)] === OK_A;
  const nearHolo = (i, j) => { for (let b = -2; b <= 1; b++) for (let a = -1; a <= 1; a++) { if (!inb(i + a, j + b)) continue; const kk = k[q(i + a, j + b)]; if (kk === OK_PL || kk === OK_AN || kk === OK_T || kk === OK_B) return true; } return false; };
  for (const side of [-1, 1]) for (let m = 0; m < 20; m++) {
    const j = fyJ - 3 - 2 * m; if (j < -RI * 0.6) break;
    const e = Math.floor(Math.sqrt(RI * RI - j * j)), c0 = (m & 1) ? e : e - 4, cells = [];
    for (let c = c0; c > c0 - 3; c--) { const i = side * c; if (free(i, j) && free(i, j - 1) && free(i, j - 2) && !nearHolo(i, j)) cells.push(i); }
    if (cells.length >= 2) for (const i of cells) { t[q(i, j)] = NV_GRADE; k[q(i, j)] = OK_G; }
  }
  // a órbita do Olho: elipse em volta do planeta, por cima do chão
  const px = pi * T, py = pj * T, orx = Math.min(14 * T, (RI - 3.5) * T - Math.abs(px)), ory = clamp((fyJ - 0.5) * T - 44 - py, 6 * T, 11 * T);
  return { H, N, R, RI, t, w, k, sec, fr, fyJ, hw, doors: dd, ring, pi, pj, pr, px, py, orx, ory, tilt, art: null };
}
// grava o plano na caixa (chunks sujos, diffs da sala apagados)
function ocWrite() {
  const P = ocPlan; if (!P) return;
  for (let Q = 0; Q < P.N * P.N; Q++) {
    if (!P.k[Q]) continue;
    const idx = ocIdx(Q % P.N - P.H, ((Q / P.N) | 0) - P.H);
    if (tiles[idx] !== P.t[Q] || walls[idx] !== P.w[Q]) { tiles[idx] = P.t[Q]; walls[idx] = P.w[Q]; ocDirty(idx); }
    diffs.delete(idx);
  }
  ocFx.trail.clear();
  mapVer++;
}
function ocDiffers() { const P = ocPlan; for (let Q = 0; Q < P.N * P.N; Q++) if (P.k[Q] && tiles[ocIdx(Q % P.N - P.H, ((Q / P.N) | 0) - P.H)] !== P.t[Q]) return true; return false; }

/* ---------- a construção (o 245 chama nvDress logo depois de cavar, com nvBoss preenchido) ---------- */
function nvDress() {
  if (!ocB()) return;
  ocPlan = ocLayout();
  ocWrite();
  ocIdleReset();
}
// o céu holográfico atrás da esfera (a terceira camada; o 245 pinta o resto da camada antes deste)
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  const B = ocB(); if (!B || !ocPlan || !DEEPT) return;
  for (let j = -ocPlan.RI; j <= ocPlan.RI; j++) for (let i = -ocPlan.RI; i <= ocPlan.RI; i++) if (Math.hypot(i, j) <= ocPlan.RI + 0.5) DEEPT[ocIdx(i, j)] = DP_NV_CEU;
}; }

/* ---------- a Barreira de Energia ---------- */
function ocCellFree(i, j, pad = 0) {
  const B = ocB(), r = { x: ocLap(wrapX(B.cx + i) * T) - pad, y: (B.cy + j) * T - pad, w: T + pad * 2, h: T + pad * 2 };
  if (!pl.dead && overlap(r, pl)) return false;
  for (const m of enemies) if (!m.dead && m.type !== 'olhocometa' && overlap(r, m)) return false;
  return true;
}
function ocSeal() {
  if (ocFx.seal) return;
  const cells = []; for (const D of ocPlan.doors) for (const c of D.bar) cells.push(c);
  cells.sort((a, b) => b[1] - a[1]);
  ocFx.seal = { t: 0, n: 0, cells, flash: 0 };
  sfx.ocBarreira();
}
function ocSealTick(dt) {
  const S = ocFx.seal; if (!S) return;
  S.t += dt; S.flash = Math.max(0, S.flash - dt);
  while (S.n < S.cells.length && S.t > 0.06 * (S.n + 1)) {
    const [i, j] = S.cells[S.n]; if (!ocCellFree(i, j)) break;
    S.n++;
    const idx = ocIdx(i, j); if (SOLID[tiles[idx]]) continue;
    tiles[idx] = NV_BARREIRA; ocDirty(idx);
    const x = ocCX() + i * T, y = ocCY() + j * T;
    burst(x, y, 6, '#ff3ec8', 60, 0, 0.5, 1, true); burst(x, y, 3, '#ffb0e8', 30, 0, 0.4, 1, true);
  }
}

/* ---------- o rastro arco-íris: chão por 4 s ---------- */
function ocPutTrail(tx, ty) {
  if (!ocPlan || ocK(...(ocIJ(tx, ty) || [99, 99])) !== OK_A) return;
  tx = wrapX(tx);
  const idx = ty * WW + tx, R0 = ocFx.trail.get(idx);
  if (R0) { R0.t = OCQ.rastro; return; }
  if (tiles[idx] !== AIR) return;
  const r = { x: ocLap(tx * T), y: ty * T, w: T, h: T };
  if (!pl.dead && overlap(r, { x: pl.x - 2, y: pl.y - 3, w: pl.w + 4, h: pl.h + 4 })) return;
  for (const m of enemies) if (!m.dead && m.type !== 'olhocometa' && overlap(r, m)) return;
  tiles[idx] = NV_RASTRO; markDirty(tx, ty);
  ocFx.trail.set(idx, { tx, ty, t: OCQ.rastro, c: (ocFx.seq++) % 6 });
  if (ocFx.chimeT <= 0) { ocFx.chimeT = 0.16; sfx.ocChime(ocFx.seq); }
}
// o olho deixa o rastro na casa por onde o centro dele acabou de passar
function ocLay(e) {
  const tx = wrapX(Math.floor((ocCX() + e.lx) / T)), ty = Math.floor((ocCY() + e.ly) / T);
  if (e.cell && (e.cell[0] !== tx || e.cell[1] !== ty)) ocPutTrail(e.cell[0], e.cell[1]);
  e.cell = [tx, ty];
}
function ocTrailTick(dt) {
  ocFx.chimeT -= dt;
  for (const [idx, R] of ocFx.trail) {
    R.t -= dt; if (R.t > 0) continue;
    ocFx.trail.delete(idx);
    if (tiles[idx] !== NV_RASTRO) continue;
    tiles[idx] = AIR; markDirty(R.tx, R.ty);
    const x = ocLap((R.tx + 0.5) * T), y = (R.ty + 0.5) * T;
    burst(x, y, 4, NV_ARCO[R.c], 40, -20, 0.5, 1, true);
  }
}

/* ---------- o anel em setores (da fase 2 em diante) ---------- */
function ocRingTick(dt) {
  const G = ocFx.ring; if (!G) return;
  G.t += dt;
  const cells = ocPlan.ring.filter(c => c[2] === G.sec);
  if (G.st === 'blink' && G.t >= 1) {
    G.st = 'gone'; G.t = 0; sfx.ocAnel(0);
    for (const [i, j] of cells) { const idx = ocIdx(i, j); if (tiles[idx] === NV_ANEL) { tiles[idx] = AIR; ocDirty(idx); if ((i + j) & 1) burst(ocCX() + i * T, ocCY() + j * T, 3, '#ff9a2e', 40, 0, 0.4, 1, true); } }
  } else if (G.st === 'gone' && G.t >= 3) {
    let left = 0;
    for (const [i, j] of cells) { const idx = ocIdx(i, j); if (tiles[idx] !== AIR) continue; if (!ocCellFree(i, j)) { left++; continue; } tiles[idx] = NV_ANEL; ocDirty(idx); }
    if (!left) { G.st = 'wait'; G.t = 0; sfx.ocAnel(1); }
  } else if (G.st === 'wait' && G.t >= 0.5) { G.sec = (G.sec + G.dir + 4) % 4; G.st = 'blink'; G.t = 0; sfx.ocAnel(2); }
}

/* ---------- a luta ---------- */
function ocSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; e.stateT0 = 0; }
function ocStart() {
  ocDrops();
  const D = ET.olhocometa, P = ocPlan, e = spawnEnemy('olhocometa', ocCX() + P.px - D.w / 2, ocCY() + P.py - P.ory - D.h / 2, NV_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: OCQ_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, cd: 1.0, ph: 0, lx: P.px, ly: P.py - P.ory, plx: P.px, ply: P.py - P.ory, th: -Math.PI / 2, dir: ocHero().lx < 0 ? -1 : 1, last: '', rep: 0, beamT: 0, discoDone: false, hidden: false, rainbow: false, lid: 0.55, lidT: 0.1, pup: 3, pupT: 3, look: [0, 0], tail: ocIdleE.tail.map(p => p.slice()), tailN: 24, cell: null, dash: null, beam: null, facing: 1 });
  ocSet(e, 'intro', 1.6);
  ocBoss = e; bossFight = { e, oc: true };
  ocClear(); ocSeal();
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Olho-Cometa'; bn.lastChild.textContent = 'a mente da nave'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Olho-Cometa', 'a mente da nave');
  sfx.ocFase(0.6); shake(3);
}
function ocClear() {
  for (const k of ['tears', 'stars', 'discos']) ocFx[k].length = 0;
  ocFx.seal = null; ocFx.ring = null;
}
function ocEnd(won) {
  const e = ocBoss; ocBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) if (m.nvMinion && !m.dead) { burst(m.x + m.w / 2, m.y + m.h / 2, 8, '#ff3ec8', 60, 0, 0.5, 1, true); ocDrop(m); }
  // a esfera volta ao plano: o rastro some, o anel volta inteiro, a barreira abre
  ocClear(); ocWrite();
  if (!won) { if (e) ocDrop(e); ocIdleReset(); return; }
  ocState.dead = true;
  const x = e ? e.x + e.w / 2 : ocCX(), y = e ? e.y + e.h / 2 : ocCY();
  for (let k = 0; k < 6; k++) burst(x, y, 10, NV_ARCO[k], 140, 60, 1.1, 1, true);
  burst(x, y, 30, '#ffffff', 120, 200, 0.9, 1); burst(x, y, 16, '#ffe53a', 90, 0, 1, 1, true);
  // na primeira vitória: uma das três bases da camada
  const bases = OCQ_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.ocMorte();
  showBanner('Vitória', 'o céu da nave fecha o olho');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.oc) return ocEnd(won); return _eb(won); }; }
// cada fase é vivida: o golpe só o leva até o piso da fase
const ocFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * OCQ.p2) : e.ph === 1 ? Math.floor(e.maxHp * OCQ.p3) : 0;
const ocInvuln = e => e.state === 'intro' || e.state === 'fase2' || e.state === 'fase3' || e.hidden;
function ocFloor(e) { const f = ocFloorHp(e); if (f > 0 && e.hp < f) e.hp = f; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'olhocometa' && !e.dead) { const f = ocFloorHp(e); if (f > 0) { e.hp = f; return; } }
  return _k(e);
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && e.type === 'olhocometa' && !e.dead && ocInvuln(e)) { burst(e.x + e.w / 2, e.y + e.h / 2, 4, '#e8fbff', 40, 0, 0.3, 1, true); return; }
  const hp0 = e ? e.hp : 0, r = _hit(e, dir, mult, melee);
  if (e && e.type === 'olhocometa') ocFloor(e);
  if (melee && pl.lg && pl.lg.cometa && e && e.hp < hp0) ocSlash(hp0 - e.hp, e);
  return r;
}; }
// nada da sala quebra enquanto ele vive (a picareta e as explosões passam por breakTile)
{ const _bt = breakTile; breakTile = function (tx, ty) { if (!ocAllow && ocLive() && ocInBox(tx, ty)) return; return _bt(tx, ty); }; }
{ const _pi = pickImpact; pickImpact = function (sx, sy, aim) {
  const tg = pl.target;
  if (tg && tg.inReach && ocLive() && ocInBox(tg.tx, tg.ty) && SOLID[tileAt(tg.tx, tg.ty)]) {
    sfx.tink(); burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 3, '#c0a8f0', 40, 300, 0.3, 1, true);
    pl.target = Object.assign({}, tg, { dig: false });
    try { _pi(sx, sy, aim); } finally { pl.target = tg; }
    pl.digT = 0; pl.digX = -1;
    return;
  }
  return _pi(sx, sy, aim);
}; }

/* ---------- o cérebro ---------- */
AI.olhocometa = function (e, dt) {
  if (!ocB() || !ocPlan) { e.dead = true; return; }
  ocBrain(e, dt);
  ocTailTick(e, dt);
  e.x = ocCX() + e.lx - e.w / 2; e.y = ocCY() + e.ly - e.h / 2; e.vx = e.vy = 0;
};
function ocPick(e, list) {
  // não repete o mesmo golpe três vezes seguidas
  let tot = 0; for (const [, w] of list) tot += w;
  for (let n = 0; n < 4; n++) {
    let r = Math.random() * tot, k = list[0][0]; for (const [s, w] of list) { if (r < w) { k = s; break; } r -= w; }
    if (k === e.last && e.rep >= 1 && list.length > 1) continue;
    e.rep = k === e.last ? e.rep + 1 : 0; e.last = k; return k;
  }
  return list[0][0];
}
// a órbita: elipse em volta do planeta, o raio respira devagar (cada volta deixa uma escada diferente)
function ocOrbit(e, dt, sp = 1) {
  const P = ocPlan, kr = 0.86 + 0.14 * Math.sin(e.t * 0.37);
  e.th += e.dir * dt * sp * 82 / ((P.orx + P.ory) / 2);
  const tx = P.px + Math.cos(e.th) * P.orx * kr, ty = P.py + Math.sin(e.th) * P.ory * (0.92 + 0.08 * kr);
  const dx = tx - e.lx, dy = ty - e.ly, L = Math.hypot(dx, dy), v = 170 * dt;
  if (L > v) { e.lx += dx / L * v; e.ly += dy / L * v; } else { e.lx = tx; e.ly = ty; }
  ocLay(e);
}
const ocThOf = (e, x, y) => Math.atan2((y - ocPlan.py) / ocPlan.ory, (x - ocPlan.px) / ocPlan.orx);
// o feixe e as estrelas atravessam o que é luz (o anel holográfico e o rastro); o planeta, a grade e o metal param
const OC_LUZ = t => t === NV_ANEL || t === NV_RASTRO;
function ocRayLuz(ox, oy, a, len, skipPlanet) {
  const cx = ocCX(), cy = ocCY(), c = Math.cos(a), s = Math.sin(a);
  for (let d = 3; d <= len; d += 3) { const t = tileAt(Math.floor((cx + ox + c * d) / T), Math.floor((cy + oy + s * d) / T)); if (SOLID[t] && !OC_LUZ(t) && !(skipPlanet && t === NV_PLANETA)) return d; }
  return len;
}
function ocBrain(e, dt) {
  e.stateT -= dt; e.stateT0 += dt; e.cd -= dt; e.beamT -= dt;
  const H = ocHero(), P = ocPlan, toH = Math.atan2(H.ly - e.ly, H.lx - e.lx);
  e.pupT = e.rainbow ? 3.6 : 3; e.lidT = 0.1;
  const lookAt = a => { e.look = [Math.cos(a) * 4.5, Math.sin(a) * 4.5]; };
  lookAt(toH);
  // os limiares
  if (e.ph === 0 && e.hp <= e.maxHp * OCQ.p2 && e.state !== 'intro' && !e.hidden && e.state !== 'investe') { e.ph = 1; ocSet(e, 'fase2', 1.6); sfx.ocFase(0.9); e.dash = null; e.cell = null; return ocLids(e, dt); }
  if (e.ph === 1 && e.hp <= e.maxHp * OCQ.p3 && !e.hidden && e.state !== 'investe' && e.state !== 'fase2') { e.ph = 2; ocSet(e, 'fase3', 1.8); sfx.ocFase(1.2); e.dash = null; e.cell = null; return ocLids(e, dt); }
  switch (e.state) {
    case 'intro':
      e.lidT = e.stateT0 < 0.5 ? 0.55 : 0.1; e.pupT = e.stateT0 < 0.9 ? 1.6 : 3;
      if (Math.random() < dt * 18) parts.push({ x: ocCX() + e.lx + rnd(-16, 16), y: ocCY() + e.ly + rnd(-16, 16), vx: rnd(-20, 20), vy: rnd(-20, 20), g: 0, life: 0.8, max: 0.8, col: NV_ARCO[(Math.random() * 6) | 0], size: 1, glow: true });
      if (e.stateT <= 0) { ocSet(e, 'idle', 0); e.cd = 0.6; }
      break;
    case 'idle': {
      ocOrbit(e, dt);
      if (e.cd > 0) break;
      let k;
      if (e.ph === 0) k = ocPick(e, [['lagrima', 0.62], ['pisca', 0.38]]);
      else if (e.ph === 1) k = ocPick(e, [['lagrima', 0.35], ['pisca', 0.2], ['investe', 0.45]]);
      else k = ocPick(e, [['feixe', e.beamT <= 0 ? 0.42 : 0], ['estrelas', 0.3], ['investe', 0.24], ['lagrima', 0.2], ['pisca', 0.1]]);
      switch (k) {
        case 'lagrima': ocSet(e, 'lagrimaTell', 0.7); e.aim = toH; sfx.ocMira(); break;
        case 'pisca': ocSet(e, 'piscaTell', 0.5); sfx.ocWhoosh(0.4); break;
        case 'investe': ocDash(e, H); break;
        case 'feixe': ocSet(e, 'feixeSobe', 2.2); e.beamT = 9; sfx.ocWhoosh(0.8); break;
        case 'estrelas': ocSet(e, 'estrelasTell', 0.6); sfx.ocEstrelas(); break;
      }
      break;
    }
    /* ----- lágrima de luz ----- */
    case 'lagrimaTell': {
      ocOrbit(e, dt, 0.3);
      e.pupT = 1.4;
      const [ox, oy] = ocIris(e);
      if (e.stateT > 0.15) e.aim = Math.atan2(H.ly - oy, H.lx - ox);   // trava no último instante
      lookAt(e.aim);
      if (e.stateT <= 0) {
        ocFx.tears.push({ x: ox + Math.cos(e.aim) * 6, y: oy + Math.sin(e.aim) * 6, vx: Math.cos(e.aim) * 280, vy: Math.sin(e.aim) * 280, t: 0, dmg: Math.max(1, Math.round(e.dmg * 0.6)) });
        sfx.ocLagrima(); ocSet(e, 'recover', 0.45);
      }
      break;
    }
    /* ----- piscada ----- */
    case 'piscaTell':
      ocOrbit(e, dt, 0.4);
      e.lidT = 1;
      if (e.stateT <= 0) {
        e.hidden = true; ocSet(e, 'pisca', 0.3); sfx.ocPisca();
        const x = ocCX() + e.lx, y = ocCY() + e.ly; burst(x, y, 16, '#e8fbff', 120, 0, 0.4, 1, true); burst(x, y, 10, '#a64dff', 90, 0, 0.5, 1, true);
      }
      break;
    case 'pisca':
      e.lidT = 1; e.lid = 1;
      if (e.stateT <= 0) {
        // do outro lado do planeta
        e.th += Math.PI; if (Math.random() < 0.5) e.dir = -e.dir;
        e.lx = P.px + Math.cos(e.th) * P.orx * 0.95; e.ly = P.py + Math.sin(e.th) * P.ory * 0.95; e.cell = null;
        for (const p of e.tail) { p[0] = e.lx; p[1] = e.ly; }
        e.hidden = false; ocSet(e, 'piscaAbre', 0.35); sfx.ocPisca(1.4);
        const x = ocCX() + e.lx, y = ocCY() + e.ly; burst(x, y, 16, '#e8fbff', 120, 0, 0.4, 1, true); for (let c = 0; c < 6; c += 2) burst(x, y, 4, NV_ARCO[c], 70, 0, 0.5, 1, true);
      }
      break;
    case 'piscaAbre':
      e.lidT = 0.1; ocOrbit(e, dt, 0.5);
      if (e.stateT <= 0) { ocSet(e, 'recover', 0.3); }
      break;
    /* ----- investida-cometa ----- */
    case 'investeTell': {
      const D = e.dash, k = Math.min(1, e.stateT0 / 0.7);
      e.lx = D.x0 - D.ux * 16 * k; e.ly = D.y0 - D.uy * 16 * k; lookAt(Math.atan2(D.uy, D.ux));
      e.tailN = 24 + Math.round(14 * k); e.pupT = 2.2;
      if (e.stateT <= 0) { ocSet(e, 'investe', 2); D.pos = -16; sfx.ocInveste(); e.cell = null; }
      break;
    }
    case 'investe': {
      const D = e.dash; D.pos += 430 * dt;
      const p = Math.min(D.pos, D.len); e.lx = D.x0 + D.ux * p; e.ly = D.y0 + D.uy * p; lookAt(Math.atan2(D.uy, D.ux));
      ocLay(e);
      const r = { x: ocCX() + e.lx - 12, y: ocCY() + e.ly - 12, w: 24, h: 24 };
      if (!D.hit && !pl.dead && overlap(r, pl)) { D.hit = true; const res = hurtPlayer(Math.round(e.dmg * 0.9), r.x + 12, null, true); if (res === 'hit') { pl.vx = D.ux * 260; pl.vy = -170; } }
      if (Math.random() < dt * 40) parts.push({ x: r.x + rnd(0, 24), y: r.y + rnd(0, 24), vx: -D.ux * 60, vy: -D.uy * 60, g: 0, life: 0.35, max: 0.35, col: NV_ARCO[(Math.random() * 6) | 0], size: 1, glow: true });
      if (D.pos >= D.len || e.stateT <= 0) { shake(3); e.th = ocThOf(e, e.lx, e.ly); e.tailN = 24; e.dash = null; ocSet(e, 'recover', 0.7); }
      break;
    }
    /* ----- feixe arco-íris ----- */
    case 'feixeSobe': {
      // para no alto, do lado oposto ao herói: a sombra do planeta cai no chão do lado dele
      if (e.bSide == null) e.bSide = H.lx >= P.px ? -1 : 1;
      const tx = P.px + e.bSide * 9 * T, ty = Math.max(-(P.RI - 4.5) * T, P.py - 12 * T), dx = tx - e.lx, dy = ty - e.ly, L = Math.hypot(dx, dy), v = 190 * dt;
      if (L > v) { e.lx += dx / L * v; e.ly += dy / L * v; } else { e.lx = tx; e.ly = ty; }
      if (L < 2 || e.stateT <= 0) {
        // varre o chão do lado de baixo dele até a outra ponta
        const fl = (P.fyJ - 0.5) * T, xe = (P.hw - 1) * T, a0 = Math.atan2(fl - e.ly, e.bSide * xe - e.lx) + e.bSide * 0.06, a1 = Math.atan2(fl - e.ly, -e.bSide * xe - e.lx) - e.bSide * 0.06;
        e.beam = { a0, a1, a: a0, hit: false, on: false }; e.bSide = null;
        ocSet(e, 'feixeTell', 1.2); sfx.ocFeixeCarga();
      }
      break;
    }
    case 'feixeTell':
      e.pupT = 5.5; lookAt(Math.PI / 2);
      if (e.stateT <= 0) { e.beam.on = true; ocSet(e, 'feixe', 1.5); sfx.ocFeixe(); }
      break;
    case 'feixe': {
      const B = e.beam, k = clamp(e.stateT0 / 1.5, 0, 1), kk = k * k * (3 - 2 * k);
      B.a = lerp(B.a0, B.a1, kk); e.pupT = 5.5; lookAt(B.a);
      const [ox, oy] = ocIris(e), L = ocRayLuz(ox, oy, B.a, 46 * T); B.len = L;
      if (!B.hit && !pl.dead) {
        const c = Math.cos(B.a), s = Math.sin(B.a), cx = ocCX(), cy = ocCY();
        for (let d = 8; d <= L; d += 4) { const X = cx + ox + c * d, Y = cy + oy + s * d; if (X > pl.x - 5 && X < pl.x + pl.w + 5 && Y > pl.y - 5 && Y < pl.y + pl.h + 5) { B.hit = true; const r = hurtPlayer(e.dmg, X, null, true); if (r === 'hit') { pl.vx = (Math.cos(B.a) >= 0 ? 1 : -1) * 160; pl.vy = -140; } break; } }
      }
      if (Math.random() < dt * 30) { const x = ocCX() + ox + Math.cos(B.a) * L, y = ocCY() + oy + Math.sin(B.a) * L; parts.push({ x, y, vx: rnd(-60, 60), vy: rnd(-90, -20), g: 300, life: 0.5, max: 0.5, col: NV_ARCO[(Math.random() * 6) | 0], size: 1, glow: true }); }
      shake(1);
      if (e.stateT <= 0) { e.beam = null; e.th = ocThOf(e, e.lx, e.ly); ocSet(e, 'recover', 0.8); }
      break;
    }
    /* ----- chuva de estrelas ----- */
    case 'estrelasTell':
      ocOrbit(e, dt, 0.3); e.pupT = 2;
      if (e.stateT <= 0) { ocStars(H); ocSet(e, 'recover', 0.6); }
      break;
    /* ----- as fases ----- */
    case 'fase2':
      e.lidT = e.stateT0 < 0.4 ? 1 : 0.1; e.pupT = 1.4; shake(1);
      if (!e.discoDone && e.stateT0 > 0.6) { e.discoDone = true; ocDiscos(); }
      if (e.stateT <= 0) { if (!ocFx.ring) ocFx.ring = { sec: 0, dir: Math.random() < 0.5 ? 1 : -1, st: 'blink', t: 0 }; ocSet(e, 'idle', 0); e.cd = 0.8; }
      break;
    case 'fase3':
      e.lidT = e.stateT0 < 0.5 ? 1 : 0.1; e.pupT = 5; shake(1.5);
      if (!e.rainbow && e.stateT0 >= 0.5) { e.rainbow = true; e.tailN = 28; const x = ocCX() + e.lx, y = ocCY() + e.ly; for (let c = 0; c < 6; c++) burst(x, y, 8, NV_ARCO[c], 130, 0, 0.8, 1, true); sfx.ocPisca(0.8); }
      if (e.stateT <= 0) { ocSet(e, 'idle', 0); e.cd = 0.6; }
      break;
    case 'recover':
      ocOrbit(e, dt, 0.8);
      if (e.stateT <= 0) { ocSet(e, 'idle', 0); e.cd = e.ph === 0 ? 1.4 + Math.random() * 0.8 : e.ph === 1 ? 1.1 + Math.random() * 0.7 : 0.9 + Math.random() * 0.6; }
      break;
  }
  ocLids(e, dt);
}
function ocLids(e, dt) { e.lid = approach(e.lid, e.lidT, dt * (e.lidT > e.lid ? 2.4 : 3.5)); e.pup = approach(e.pup, e.pupT, dt * 9); }
// a íris em px locais
function ocIris(e) { return [e.lx + e.look[0], e.ly + e.look[1]]; }
// a investida: reta pelo herói até a parede de dentro (ou um pouco acima do chão)
function ocDash(e, H) {
  const P = ocPlan, x0 = e.lx, y0 = e.ly; let ux = H.lx - x0, uy = H.ly - y0; const L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L;
  const Rr = (P.RI - 1.6) * T, b = x0 * ux + y0 * uy, c = x0 * x0 + y0 * y0 - Rr * Rr;
  let len = -b + Math.sqrt(Math.max(0, b * b - c));
  if (uy > 0.02) len = Math.min(len, ((P.fyJ - 0.5) * T - 18 - y0) / uy);
  e.dash = { x0, y0, ux, uy, len: Math.max(40, len), pos: 0, hit: false };
  ocSet(e, 'investeTell', 1.0); sfx.ocWhoosh(1.3);
}
// as estrelas: sete, perto do herói, cada uma com a marca de onde cai
function ocStars(H) {
  const P = ocPlan, cx = ocCX(), cy = ocCY(), xs = [];
  for (let n = 0; n < 7; n++) {
    let x = 0;
    for (let a = 0; a < 8; a++) { x = clamp(H.lx + (n ? rnd(-7, 7) * T : rnd(-4, 4)), -(P.RI - 2.5) * T, (P.RI - 2.5) * T); if (xs.every(v => Math.abs(v - x) > 18)) break; }
    xs.push(x);
    const top = -Math.sqrt(Math.max(0, (P.RI - 1) * (P.RI - 1) * T * T - x * x)) + T * 0.5, tx = Math.floor((cx + x) / T);
    // atravessa o anel, o planeta e o rastro (é tudo luz); para no chão, na grade, no metal
    let ty = Math.floor((cy + Math.max(top, H.ly - 4 * T)) / T), m = 0; while (m < 50) { const t = tileAt(tx, ty); if (SOLID[t] && !OC_LUZ(t) && t !== NV_PLANETA) break; ty++; m++; }
    if (m === 0 || m >= 50) continue;
    const land = ty * T - cy, y0 = Math.max(top, land - 15 * T);
    ocFx.stars.push({ x, y0, y: y0, land, t: -0.6 - n * 0.14, hit: false, done: false, c: n % 6 });
  }
}
// os dois discos entram pelas portas
function ocDiscos() {
  if (!ET.disco || !AI.disco) return;
  for (const D of ocPlan.doors) ocFx.discos.push({ D, t: 0.35 * ocFx.discos.length });
}
function ocDiscoTick(dt) {
  for (let k = ocFx.discos.length - 1; k >= 0; k--) {
    const S = ocFx.discos[k]; S.t -= dt; if (S.t > 0) continue;
    ocFx.discos.splice(k, 1);
    const D = ET.disco, x = ocCX() + S.D.ii * T, y = ocCY() + (S.D.jf - 2.5) * T;
    for (const [i, j] of S.D.bar) burst(ocCX() + i * T, ocCY() + j * T, 5, '#ff3ec8', 80, 0, 0.5, 1, true);
    if (ocFx.seal) ocFx.seal.flash = 0.6;
    sfx.ocBarreira(0.7);
    const m = spawnEnemy('disco', x - D.w / 2, y - D.h / 2, -1);   // zona fora da tabela: o 245 não apaga quem nasce no Planetário
    if (m) { Object.assign(m, { nvMinion: true, memT: 8, aggro: true, xp: Math.min(m.xp || 1, 2), gold: 0, facing: -S.D.side }); m.vx = -S.D.side * 80; }
  }
}

/* ---------- os projéteis, as estrelas, o rasgo da Cauda ---------- */
const ocHitPl = (x, y, r) => !pl.dead && x > pl.x - r && x < pl.x + pl.w + r && y > pl.y - r && y < pl.y + pl.h + r;
function ocFxTick(dt) {
  const e = ocBoss, cx = ocCX(), cy = ocCY();
  ocSealTick(dt); ocRingTick(dt); ocDiscoTick(dt);
  for (let k = ocFx.tears.length - 1; k >= 0; k--) {
    const b = ocFx.tears[k]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt;
    const X = cx + b.x, Y = cy + b.y;
    if (Math.random() < dt * 30) parts.push({ x: X, y: Y, vx: rnd(-10, 10), vy: rnd(-10, 10), g: 0, life: 0.3, max: 0.3, col: '#bff8ff', size: 1, glow: true });
    if (ocHitPl(X, Y, 3)) { hurtPlayer(b.dmg, X, null, true); burst(X, Y, 12, '#36f0ff', 80, 0, 0.5, 1, true); sfx.ocSplash(); ocFx.tears.splice(k, 1); continue; }
    const tt = tileAt(Math.floor(X / T), Math.floor(Y / T));
    if ((SOLID[tt] && !OC_LUZ(tt) && b.t > 0.04) || b.t > 3) { burst(X, Y, 10, '#36f0ff', 70, 0, 0.45, 1, true); burst(X, Y, 4, '#e8fbff', 40, 0, 0.3, 1, true); sfx.ocSplash(0.5); ocFx.tears.splice(k, 1); }
  }
  for (let k = ocFx.stars.length - 1; k >= 0; k--) {
    const s = ocFx.stars[k]; s.t += dt;
    if (s.done) { if (s.t > 0.4) ocFx.stars.splice(k, 1); continue; }
    if (s.t < -0.6) continue;
    // cai do teto até a marca, chega quando o aviso acaba
    s.y = lerp(s.y0, s.land - 4, clamp((s.t + 0.6) / 0.6, 0, 1) ** 1.6);
    if (!s.hit && e && ocHitPl(cx + s.x, cy + s.y, 3)) { s.hit = true; hurtPlayer(Math.max(1, Math.round(e.dmg * 0.4)), cx + s.x, null, true); }
    if (s.t >= 0) {
      s.done = true; s.t = 0;
      if (!s.hit && e && ocHitPl(cx + s.x, cy + s.land - 6, 8)) { s.hit = true; hurtPlayer(Math.max(1, Math.round(e.dmg * 0.4)), cx + s.x, null, true); }
      burst(cx + s.x, cy + s.land - 2, 10, NV_ARCO[s.c], 90, 200, 0.5, 1, true); burst(cx + s.x, cy + s.land - 2, 6, '#ffe53a', 60, 0, 0.4, 1, true); sfx.ocImpacto();
    }
  }
}
// a Cauda do Cometa: um rasgo por golpe (o maior dano do golpe), no ângulo da lâmina, com o meio onde o golpe pegou
function ocSlash(dmg, e) {
  const S = ocFx.slashes.find(s => s.at === pl.atkAt);
  if (S) { S.dmg = Math.max(S.dmg, dmg * 0.5); return; }
  const [hx, hy, ex, ey] = bladeSeg(pl.fArm, pl.sAng, bladeLen()), a = Math.atan2(ey - hy, ex - hx), L = Math.max(10, Math.hypot(ex - hx, ey - hy));
  const mx = e ? e.x + e.w / 2 : ex, my = e ? e.y + e.h / 2 : ey;
  ocFx.slashes.push({ at: pl.atkAt, x: mx - Math.cos(a) * L * 0.85, y: my - Math.sin(a) * L * 0.85, a, L, t: 0, dmg: dmg * 0.5, cut: false });
  if (ocFx.slashes.length > 8) ocFx.slashes.shift();
}
const ocSlashPts = S => { const out = []; for (let r = S.L * 0.4; r <= S.L * 1.25; r += 4) for (let a = -0.6; a <= 0.6; a += 0.12) out.push([S.x + Math.cos(S.a + a) * r, S.y + Math.sin(S.a + a) * r]); return out; };
function ocSlashTick(dt) {
  for (let k = ocFx.slashes.length - 1; k >= 0; k--) {
    const S = ocFx.slashes[k]; S.t += dt;
    if (!S.cut && S.t >= 0.5) {
      S.cut = true; sfx.ocCorte();
      const pts = ocSlashPts(S), v = Math.max(1, Math.round(S.dmg));
      for (const m of enemies.slice()) {
        if (m.dead || (m.boss && m.state === 'intro') || (m.type === 'olhocometa' && ocInvuln(m))) continue;
        if (!pts.some(([x, y]) => x >= m.x - 7 && x <= m.x + m.w + 7 && y >= m.y - 7 && y <= m.y + m.h + 7)) continue;
        m.hp -= v; m.flash = 0.12; m.showHp = 3.5; m.memT = 4;
        floatText(m.x + m.w / 2, m.y - 10, String(v), NV_ARCO[(gameTime * 10 | 0) % 6], 1.1);
        for (let c = 0; c < 6; c += 2) burst(m.x + m.w / 2, m.y + m.h / 2, 3, NV_ARCO[c], 70, 0, 0.4, 1, true);
        if (m.type === 'olhocometa') ocFloor(m);
        if (m.hp <= 0 && !m.dead) killEnemy(m);
      }
    }
    if (S.t > 0.78) ocFx.slashes.splice(k, 1);
  }
}

/* ---------- a cauda: uma corrente de pontos que segue o olho ---------- */
function ocTailTick(E, dt) {
  const vx = (E.lx - E.plx) / Math.max(dt, 1e-3), vy = (E.ly - E.ply) / Math.max(dt, 1e-3), sp = Math.hypot(vx, vy);
  E.plx = E.lx; E.ply = E.ly;
  let rx, ry;
  if (sp > 25) { rx = -vx / sp; ry = -vy / sp; E.rest = [rx, ry]; }
  else { const r0 = E.rest || [-0.8, -0.6]; rx = r0[0]; ry = r0[1]; }
  const pts = E.tail, N = E.tailN || 22, seg = 3.1;
  while (pts.length < N) pts.push(pts.length ? pts[pts.length - 1].slice() : [E.lx, E.ly]);
  while (pts.length > N) pts.pop();
  pts[0][0] = E.lx; pts[0][1] = E.ly;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i], q = pts[i - 1], w = Math.sin(E.t * 5 - i * 0.45) * 0.5;
    p[0] += (rx * 26 - ry * w * 20) * dt; p[1] += (ry * 26 + rx * w * 20) * dt;
    const dx = p[0] - q[0], dy = p[1] - q[1], L = Math.hypot(dx, dy);
    if (L > seg) { p[0] = q[0] + dx / L * seg; p[1] = q[1] + dy / L * seg; }
    else if (L < 0.01) { p[0] = q[0] + rx * seg; p[1] = q[1] + ry * seg; }
  }
}
function ocIdleReset() {
  const P = ocPlan; if (!P) return;
  Object.assign(ocIdleE, { lx: P.px, ly: P.py - P.ory, plx: P.px, ply: P.py - P.ory, tail: [], tailN: 22, rest: [-0.8, -0.6] });
}
function ocIdleTick(dt) {
  const E = ocIdleE, P = ocPlan; E.t += dt;
  E.ly = P.py - P.ory + Math.sin(E.t * 1.3) * 4; E.lx = P.px + Math.sin(E.t * 0.6) * 6;
  const H = ocHero(), a = Math.atan2(H.ly - E.ly, H.lx - E.lx), near = H.d < 30;
  E.look = near ? [Math.cos(a) * 3.5, Math.sin(a) * 3.5] : [0, 1.5];
  E.lid = approach(E.lid, near ? 0.42 : 0.62, dt);
  E.rest = [-0.8 * (H.lx >= E.lx ? 1 : -1), -0.6];
  ocTailTick(E, dt);
}

/* ---------- a Cauda do Cometa ---------- */
STAT_DEF.lgCometa = { t: 'Cada golpe deixa um rastro arco-íris no ar que corta de novo meio segundo depois, com 50% do golpe', flag: 1 };
STAT_KEYS.push('lgCometa');
ITEMS.cauda_cometa = {
  name: 'Cauda do Cometa', slot: 'weapon', kind: 'sword', rar: 4, lit: true,
  pal: { w: '#fff6a8', W: '#ff9a2e', l: '#9a4dff', g: '#e8fbff', G: '#7258a0', h: '#2a1a3a', p: '#ff3ec8' },
  legend: [['lgCometa', 1], ['light', 1], ['crit', 0.05]],
  desc: 'Um pedaço da cauda do Olho, endurecido em lâmina. Por onde ela passa o ar fica listrado, e a listra corta de novo.'
};
BASE_INFO.cauda_cometa = [OCQ_L, 0.58];
ITEM_G.cauda_cometa = 0; ITEMS.cauda_cometa.g = 0;
ocDrops();
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgCometa || 0;
  if (pl.lg) pl.lg.cometa = b > 0;
  return r;
}; }
// a lâmina: as 6 cores do adesivo de cima para baixo, o fio claro, a sombra violeta; a guarda de metal do reator
const OC_BLADE = { cv: null, em: null };
function ocBladeCanvas() {
  if (OC_BLADE.cv) return OC_BLADE.cv;
  const rows = SWORD, h = rows.length, w = rows[0].length, cv = mk(w, h), em = mk(w, h), x = cv.getContext('2d'), ex = em.getContext('2d'), P = ITEMS.cauda_cometa.pal;
  const bl = rows.findIndex(r => r.includes('g'));   // as linhas da lâmina vêm antes da guarda
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ch = rows[j][i]; if (ch === '.') continue;
    let col;
    if (ch === 'w' || ch === 'W' || ch === 'l') {
      const base = NV_ARCO[Math.min(5, Math.floor(j / Math.max(1, bl) * 6))];
      col = ch === 'w' ? mixHex(base, '#ffffff', 0.55) : ch === 'W' ? base : mixHex(base, '#1a0a2a', 0.35);
      ex.fillStyle = col; ex.fillRect(i, j, 1, 1);
    } else col = P[ch];
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
  }
  OC_BLADE.cv = cv; OC_BLADE.em = em;
  if (typeof ECL_EMIT !== 'undefined') { ECL_EMIT.set(cv, em); GEAR_SPOT.set(cv, [[2.5, 2, '#ffe53a'], [2.5, 6, '#3aa8ff']]); }
  return cv;
}
{ const _wf = weaponFor; weaponFor = function (id) { return id === 'cauda_cometa' ? ocBladeCanvas() : _wf(id); }; }

/* ---------- arte ---------- */
const OCA = {}, ES = 34, ER = 15.5, IS = 16, IR = 7.4;   // o globo e a íris
{
const RAMPS = [];
const R6 = hexes => { const R = hexes.map(h => ph(h)); R.k = RAMPS.length; RAMPS.push(R); return R; };
const rampOf = hex => { const [r, g, b] = rgb(hex), m = (t, to) => '#' + [r, g, b].map((v, k) => Math.round(lerp(v, to[k], t)).toString(16).padStart(2, '0')).join(''); return R6([m(0.72, [20, 10, 36]), m(0.5, [20, 10, 36]), m(0.25, [20, 10, 36]), hex, m(0.3, [255, 255, 255]), m(0.62, [255, 255, 255])]); };
const PAL = {
  olho: R6(['#1e1a34', '#4a4a6c', '#8a90b0', '#bfc6dc', '#e4e9f4', '#ffffff']),
  iris: R6(['#4a2a04', '#8a5a0a', '#c8900e', '#f0c020', '#ffe53a', '#fff8b0']),
  lid: R6(['#1a0a2a', '#3e1a62', '#5e2c94', '#8a4dd0', '#a86af0', '#d4b0ff']),
  rosa: R6(['#3a0a2a', '#6a1450', '#a82080', '#ff3ec8', '#ff8ae0', '#ffd0f4']),
  veia: R6(['#5a1020', '#8a2034', '#c03048', '#e05a6a', '#f08a94', '#ffc0c8']),
  verm: R6(['#3a0a10', '#6a1418', '#a8221e', '#e03a2a', '#ff6a3a', '#ffa070']),
  lar: R6(['#4a1a04', '#7a3008', '#c0560e', '#f08a1a', '#ffb040', '#ffd890']),
  creme: R6(['#5a3a1a', '#8a6030', '#c09050', '#e8c080', '#ffe8b0', '#fff8e0']),
  arco: NV_ARCO.map(rampOf)
};
const cg = (x, y, s) => hash2(x, y, s) - 0.5;
// o pintor (como o da Rainha): cada pixel lembra a rampa, o contorno pega o tom mais escuro
function pp(w, h) {
  const c = new Uint32Array(w * h), rid = new Int16Array(w * h).fill(-1);
  const P = {
    w, h, c, rid,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; c[i] = R[v < 0 ? 0 : v > 5 ? 5 : v | 0]; rid[i] = R.k; },
    ball(cx, cy, r, f) {
      for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
        const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, d = Math.hypot(dx, dy); if (d > 1) continue;
        f(x, y, dx, dy, d);
      }
    },
    outline() {
      const o = c.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!c[i]) continue;
        const air = (x > 0 && !c[i - 1]) || (x < w - 1 && !c[i + 1]) || (y > 0 && !c[i - w]) || (y < h - 1 && !c[i + w]) || x === 0 || y === 0 || x === w - 1 || y === h - 1;
        if (air) o[i] = RAMPS[rid[i]][0];
      }
      c.set(o);
    },
    canvas() { const cv = mk(w, h), x = cv.getContext('2d'), im = x.createImageData(w, h); new Uint32Array(im.data.buffer).set(c); x.putImageData(im, 0, 0); return cv; }
  };
  return P;
}
// o globo: branco do adesivo, luz do alto à esquerda, o neon rosa batendo na borda de baixo, veias finas
function paintSclera() {
  const Q = pp(ES, ES), C = ES / 2;
  Q.ball(C, C, ER, (x, y, dx, dy, d) => {
    let v = 3.15 - (dx * 0.75 + dy * 0.95) * 1.25 - d * d * 1.1 + cg(x, y, 4601) * 0.5;
    Q.put(x, y, PAL.olho, v);
    if (d > 0.72 && dx * 0.5 + dy > 0.62) Q.put(x, y, PAL.rosa, 3.2 + (d - 0.72) * 4 + cg(x, y, 4602) * 0.6);   // o neon rosa de baixo
    else if (d > 0.8 && dx < -0.5 && dy > 0) Q.put(x, y, PAL.arco[4], 2.6 + cg(x, y, 4603));                       // e o ciano do outro lado
  });
  // veias: de fora para dentro, poucas e finas
  for (let n = 0; n < 6; n++) {
    let a = n * 1.05 + 0.4 + hash2(n, 1, 4604) * 0.5;
    if (Math.cos(a) < -0.3 && Math.sin(a) < -0.3) a += 1.6;      // nada no brilho
    let x = C + Math.cos(a) * (ER - 1.2), y = C + Math.sin(a) * (ER - 1.2), b = a + Math.PI;
    for (let k = 0; k < 6 + n % 3; k++) { Q.put(x, y, PAL.veia, k < 2 ? 3 : 2.5); b += (hash2(n, k, 4605) - 0.5) * 1.1; x += Math.cos(b); y += Math.sin(b); }
  }
  // o brilho do adesivo: um feijão branco em cima à esquerda e um ponto
  for (const [x, y] of [[9, 8], [10, 8], [11, 8], [8, 9], [9, 9], [10, 9], [8, 10], [9, 10], [8, 11], [13, 7]]) Q.put(x, y, PAL.olho, 5);
  Q.outline();
  return Q.canvas();
}
// a íris amarela com raios e o anel escuro; e as 8 voltas da íris arco-íris
function paintIris(rot) {
  const Q = pp(IS, IS), C = IS / 2;
  Q.ball(C, C, IR, (x, y, dx, dy, d) => {
    const a = Math.atan2(dy, dx), st = (Math.floor((a + Math.PI) / (Math.PI * 2) * 16) & 1) ? 0.45 : -0.25;
    let v = 3.2 - (dx * 0.6 + dy * 0.7) * 0.9 + st * (d > 0.35 ? 1 : 0) + cg(x, y, 4611) * 0.4 + (d < 0.45 ? 0.6 : 0);
    if (d > 0.82) v = 1 - cg(x, y, 4612);
    if (rot == null) { Q.put(x, y, PAL.iris, v); return; }
    const b = (((Math.floor((a + rot) / (Math.PI * 2) * 6 + d * 2.2) % 6) + 6) % 6);
    Q.put(x, y, PAL.arco[b], d > 0.82 ? 1 : v - 0.1);
  });
  return Q.canvas();
}
function paintPupil(r) {
  const n = 14, cv = mk(n, n), x = cv.getContext('2d'), C = n / 2;
  for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) {
    const d = Math.hypot(i + 0.5 - C, y + 0.5 - C); if (d > r) continue;
    x.fillStyle = d > r - 1 && (i + y) > n ? '#2a2048' : '#05030a'; x.fillRect(i, y, 1, 1);
  }
  return cv;
}
// a pálpebra violeta: fecha de cima para baixo, com a borda clara e os cílios escuros
function paintLid(cl) {
  const Q = pp(ES, ES), C = ES / 2;
  Q.ball(C, C, ER + 0.3, (x, y, dx, dy, d) => {
    const edge = -1.05 + 2.15 * cl + (cl < 1 ? (1 - dx * dx) * 0.22 * Math.min(1, cl * 3) : 0);
    if (dy > edge + 0.08) return;
    if (dy > edge && cl < 1) { Q.put(x, y, PAL.lid, 0); return; }                                    // os cílios
    const v = edge - dy < 0.1 && cl < 1 ? 5 : 3.1 - (dx * 0.75 + dy * 0.9) * 1.2 - d * 0.6 + cg(x, y, 4621) * 0.5;
    Q.put(x, y, PAL.lid, v);
  });
  if (cl > 0.25 && cl < 1) for (let k = -2; k <= 2; k++) { const xx = Math.round(C + k * 4.2), dx = (xx + 0.5 - C) / ER, yy = Math.round(C + ER * (-1.05 + 2.15 * cl + (1 - dx * dx) * 0.22) + 1.5); Q.put(xx, yy, PAL.lid, 0); Q.put(xx + (k < 0 ? -1 : k > 0 ? 1 : 0), yy + 1, PAL.lid, 0); }
  Q.outline();
  return Q.canvas();
}
// a estrela de 4 pontas do adesivo (a que cai e a do céu)
function paintStar(n, core, mid, tip) {
  const cv = mk(n * 2 + 1, n * 2 + 1), x = cv.getContext('2d');
  for (let k = -n; k <= n; k++) { const a = Math.abs(k); x.fillStyle = a === 0 ? core : a <= n / 2 ? mid : tip; x.fillRect(n + k, n, 1, 1); x.fillRect(n, n + k, 1, 1); }
  if (n >= 3) { x.fillStyle = mid; x.fillRect(n - 1, n - 1, 3, 3); x.fillStyle = core; x.fillRect(n, n - 1, 1, 3); x.fillRect(n - 1, n, 3, 1); }
  return cv;
}
OCA.get = () => OCA.ready || (OCA.ready = (() => {
  const sc = paintSclera();
  return {
    sclera: sc, scleraW: whiteOf(sc), iris: paintIris(null), arco: [0, 1, 2, 3, 4, 5, 6, 7].map(k => paintIris(k * Math.PI / 4)),
    pupils: [0, 1, 2, 3, 4, 5, 6].map(r => paintPupil(r + 0.6)), lids: [0.13, 0.3, 0.48, 0.66, 0.84, 1].map(paintLid),
    star: paintStar(4, '#ffffff', '#fff6a8', '#ffe53a'), starS: NV_ARCO.map(c => paintStar(2, '#ffffff', c, c))
  };
})());
// o planeta holográfico: listras vermelhas e laranja inclinadas com o anel, sombra à direita, linhas de varredura;
// furado onde a frente do anel passa (o bloco do anel aparece por ali); a metade de trás do anel fica atrás dele
OCA.planet = P => {
  if (P.art) return P.art;
  const Rp = (P.pr + 0.5) * T - 0.5, n = Math.ceil(Rp) * 2 + 2, C = n / 2, Q = pp(n, n), ct = Math.cos(P.tilt), st = Math.sin(P.tilt);
  Q.ball(C, C, Rp, (x, y, dx, dy, d) => {
    // redondo por cima dos blocos; furado onde a frente do anel passa na frente dele
    const i = P.pi + Math.floor((x + 0.5 - C + T / 2) / T), j = P.pj + Math.floor((y + 0.5 - C + T / 2) / T);
    if (ocK(i, j) === OK_AN && Math.abs(i) <= P.H && Math.abs(j) <= P.H && P.fr[(j + P.H) * P.N + i + P.H]) return;
    const nz = Math.sqrt(Math.max(0, 1 - d * d)), u = (dy * ct - dx * st) / Math.max(0.35, nz) * 0.55 + dy * 0.45;
    const band = Math.floor((u + 1) * 4.2 + Math.sin(dx * 5 + 1) * 0.25);
    const R = band === 4 ? PAL.creme : band & 1 ? PAL.lar : PAL.verm;
    let v = 3.3 - (dx * 0.85 + dy * 1.0) * 1.2 - d * d * 1.3 + cg(x, y, 4631) * 0.5;
    if ((y & 3) === 0) v -= 0.55;                                                     // as linhas do holograma
    if (d > 0.92 && dx + dy > 0.7) { Q.put(x, y, PAL.arco[4], 3 + cg(x, y, 4632)); return; }   // a borda ciano da projeção
    Q.put(x, y, R, v);
  });
  Q.outline();
  P.art = { cv: Q.canvas(), n, Rp };
  return P.art;
};
OCA.GL = { eye: glow(40, '#e8fbff'), iris: glow(12, '#ffe53a'), arco: NV_ARCO.map(c => glow(9, c)), arcoB: NV_ARCO.map(c => glow(16, c)), pink: glow(12, '#ff3ec8'), tear: glow(10, '#36f0ff'), star: glow(12, '#ffe53a'), beam: glow(22, '#ffffff'), planet: glow(60, '#ff6a3a'), hand: glow(9, '#ffffff') };
}

/* ---------- desenho ---------- */
// a cauda: as 6 faixas do adesivo, grossas junto do olho e afinando; o vermelho sempre por cima
function ocDrawTail(E, sx, sy) {
  const pts = E.tail, N = pts.length; if (N < 3) return;
  const ox = sx - E.lx, oy = sy - E.ly;
  let ax = pts[N - 1][0] - pts[0][0], ay = pts[N - 1][1] - pts[0][1]; const AL = Math.hypot(ax, ay) || 1; ax /= AL; ay /= AL;
  const sg = (-ax < 0 || (Math.abs(ax) < 0.2 && ay > 0)) ? -1 : 1;   // a normal que aponta para cima
  for (let i = N - 1; i >= 1; i--) {
    const p = pts[i], q = pts[i - 1], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * sg, ny = dx / L * sg;
    const wv = 1 - i / N, bw = 0.9 + wv * 2.4, sz = Math.max(1, Math.round(0.6 + wv * 2.6));
    for (let s = 0; s < 2; s++) {
      const x = p[0] + dx * s / 2 + ox, y = p[1] + dy * s / 2 + oy;
      for (let b = 0; b < 6; b++) {
        const o = (b - 2.5) * bw;
        lc.fillStyle = NV_ARCO[b]; lc.fillRect(Math.round(x + nx * o - sz / 2), Math.round(y + ny * o - sz / 2), sz, sz);
      }
      if (i < N * 0.6 && ((i + s) & 3) === 0) { lc.fillStyle = '#ffffff'; lc.fillRect(Math.round(x + nx * -2.5 * bw), Math.round(y + ny * -2.5 * bw), 1, 1); }
    }
  }
}
function ocDrawEye(E, sx, sy, fl) {
  const A = OCA.get(), x = Math.round(sx), y = Math.round(sy);
  ocDrawTail(E, sx, sy);
  lc.drawImage(fl ? A.scleraW : A.sclera, x - ES / 2, y - ES / 2);
  if (fl) return;
  const lx = Math.round(E.look[0]), ly = Math.round(E.look[1]);
  lc.drawImage(E.rainbow ? A.arco[Math.floor(gameTime * 14) & 7] : A.iris, x - IS / 2 + lx, y - IS / 2 + ly);
  const pr = clamp(Math.round(E.pup), 0, 6); lc.drawImage(A.pupils[pr], x - 7 + lx, y - 7 + ly);
  lc.fillStyle = '#ffffff'; lc.fillRect(x - 3 + lx, y - 4 + ly, 2, 2); lc.fillRect(x + 2 + lx, y + 1 + ly, 1, 1);
  const k = clamp(Math.round(E.lid * 5 - 0.2), 0, 5); lc.drawImage(A.lids[k], x - ES / 2, y - ES / 2);
}
DRAW_E.olhocometa = (e, fx, fy, fl) => {
  if (e.hidden) return;
  const jit = (e.state === 'fase2' || e.state === 'fase3' || e.state === 'investeTell') ? Math.round(Math.sin(e.t * 70)) : 0;
  ocDrawEye(e, fx + jit, fy - e.h / 2, fl);
};
EYES_E.olhocometa = () => {};
WARN_E.olhocometa = e => e.state === 'lagrimaTell' || e.state === 'piscaTell' || e.state === 'investeTell' || e.state === 'feixeTell' || e.state === 'estrelasTell';
// o céu: estrelas de 4 pontas que piscam (só onde não há bloco)
function ocSkyStars(X, Y, cx, cy) {
  const P = ocPlan, A = OCA.get();
  for (let n = 0; n < 26; n++) {
    const a = hash2(n, 1, 4641) * Math.PI * 2, r = (4 + hash2(n, 2, 4641) * (P.RI - 6)) * T, x = Math.round(X + Math.cos(a) * r), y = Math.round(Y + Math.sin(a) * r);
    if (x < -6 || y < -6 || x > VW + 6 || y > VH + 6) continue;
    if (tileAt(Math.floor((x + cx) / T), Math.floor((y + cy) / T)) !== AIR) continue;
    const tw = Math.sin(gameTime * (1.2 + hash2(n, 3, 4641) * 2) + n * 1.7);
    if (tw < -0.2) continue;
    if (tw > 0.6) lc.drawImage(A.starS[n % 6], x - 2, y - 2);
    else { lc.fillStyle = NV_ARCO[n % 6]; lc.fillRect(x, y, 1, 1); }
  }
}
HOOK.drawWorld.push((cx, cy) => {
  const B = ocB(); if (!B || !ocPlan || !pl || Math.abs(wdx(B.cx - Math.floor((cx + VW / 2) / T))) > 60) return;
  const X = ocCX() - cx, Y = ocCY() - cy, P = ocPlan;
  ocSkyStars(X, Y, cx, cy);
  // o planeta holográfico por cima dos blocos dele, com a linha de varredura descendo
  const PA = OCA.planet(P), px = Math.round(X + P.px) - PA.n / 2, py = Math.round(Y + P.py) - PA.n / 2;
  lc.drawImage(PA.cv, px, py);
  const sy = ((gameTime * 26) % (PA.n + 20)) - 10, hw = Math.sqrt(Math.max(0, PA.Rp * PA.Rp - (sy - PA.n / 2) ** 2));
  if (hw > 2) { lc.globalAlpha = 0.35; lc.fillStyle = '#bff8ff'; lc.fillRect(Math.round(px + PA.n / 2 - hw + 1), Math.round(py + sy), Math.round(hw * 2 - 2), 1); lc.globalAlpha = 1; }
  if (!ocState.dead && !ocBoss) ocDrawEye(ocIdleE, X + ocIdleE.lx, Y + ocIdleE.ly, false);
});
// os avisos e o que brilha por cima do escuro
HOOK.drawTop.push((cx, cy) => {
  const B = ocB();
  // os rasgos da Cauda do Cometa (onde quer que o herói esteja)
  for (const S of ocFx.slashes) {
    const k = S.cut ? Math.max(0, 1 - (S.t - 0.5) / 0.28) : Math.min(1, S.t / 0.12) * (0.55 + 0.2 * Math.sin(S.t * 40));
    for (let b = 0; b < 6; b++) {
      const r = S.L * (0.45 + b * 0.15);
      lc.globalAlpha = k * (S.cut ? 1 : 0.8); lc.strokeStyle = S.cut && b % 2 ? '#ffffff' : NV_ARCO[b]; lc.lineWidth = S.cut ? 2 : 1;
      lc.beginPath(); lc.arc(Math.round(S.x - cx) + 0.5, Math.round(S.y - cy) + 0.5, r, S.a - 0.55, S.a + 0.55); lc.stroke();
    }
  }
  lc.lineWidth = 1; lc.globalAlpha = 1;
  if (!B || !ocPlan || !pl) return;
  const e = ocBoss, X = ocCX() - cx, Y = ocCY() - cy;
  if (Math.abs(X - VW / 2) > VW + 300) return;
  // o rastro pisca no último segundo; o anel pisca rosa antes de sumir
  for (const R of ocFx.trail.values()) {
    if (R.t > 1) continue;
    const x = Math.round(ocLap(R.tx * T)) - cx, y = R.ty * T - cy;
    if (Math.floor(R.t * 10) & 1) { lc.globalAlpha = 0.7; lc.fillStyle = '#0a0614'; lc.fillRect(x, y, T, T); }
    else { lc.globalAlpha = 0.35; lc.fillStyle = '#ffffff'; lc.fillRect(x, y, T, T); }
  }
  const G = ocFx.ring;
  if (G && G.st === 'blink') {
    lc.globalAlpha = (Math.floor(G.t * 8) & 1) ? 0.75 : 0.3; lc.fillStyle = '#ff3ec8';
    for (const [i, j, s] of ocPlan.ring) if (s === G.sec) lc.fillRect(Math.round(X + i * T - T / 2), Math.round(Y + j * T - T / 2), T, T);
  }
  // a barreira: linhas de energia subindo
  if (ocFx.seal) for (let n = 0; n < ocFx.seal.n; n++) {
    const [i, j] = ocFx.seal.cells[n], x = Math.round(X + i * T - T / 2), y = Math.round(Y + j * T - T / 2);
    lc.globalAlpha = 0.5 + 0.3 * Math.sin(gameTime * 9 + j) + ocFx.seal.flash; lc.fillStyle = '#ffb0e8';
    for (let s = 0; s < 3; s++) lc.fillRect(x + 2 + s * 4, y + ((Math.floor(gameTime * 30) + s * 5 + j * 3) % T), 1, 3);
  }
  lc.globalAlpha = 1;
  // a pupila e o brilho por cima do brilho somado (o preto continua preto)
  const EE = ocBoss || (!ocState.dead ? ocIdleE : null);
  if (EE && !EE.hidden && EE.lid < 0.5) {
    const jx = EE === ocBoss && (e.state === 'fase2' || e.state === 'fase3' || e.state === 'investeTell') ? Math.round(Math.sin(e.t * 70)) : 0;
    const x = Math.round(ocCX() + EE.lx) - cx + jx + Math.round(EE.look[0]), y = Math.round(ocCY() + EE.ly) - cy + Math.round(EE.look[1]);
    lc.drawImage(OCA.get().pupils[clamp(Math.round(EE.pup), 0, 6)], x - 7, y - 7);
    lc.fillStyle = '#ffffff'; lc.fillRect(x - 3, y - 4, 2, 2); lc.fillRect(x + 2, y + 1, 1, 1);
  }
  if (e && !e.hidden) {
    const [ix, iy] = ocIris(e);
    if (e.state === 'lagrimaTell') {   // a linha de mira
      const L = ocRayLuz(ix, iy, e.aim, 40 * T), c = Math.cos(e.aim), s = Math.sin(e.aim), k = e.stateT0 / 0.7;
      for (let d = 10; d < L; d += 3) { lc.globalAlpha = 0.25 + 0.55 * k; lc.fillStyle = (Math.floor(gameTime * 12 + d / 3) & 1) ? '#36f0ff' : '#e8fbff'; lc.fillRect(Math.round(X + ix + c * d), Math.round(Y + iy + s * d), 1, 1); }
      const ex = Math.round(X + ix + c * L), ey = Math.round(Y + iy + s * L); lc.globalAlpha = 0.8; lc.fillStyle = '#36f0ff'; lc.fillRect(ex - 3, ey, 7, 1); lc.fillRect(ex, ey - 3, 1, 7);
    }
    if (e.state === 'investeTell' && e.dash) {   // a faixa tracejada do caminho, nas cores da cauda
      const D = e.dash, k = Math.min(1, e.stateT0 / 0.35);
      for (let s = 0; s < D.len * k; s += 3) {
        const seg = Math.floor(s / 9 + gameTime * 8); if (seg % 2) continue;
        const x = Math.round(X + D.x0 + D.ux * s), y = Math.round(Y + D.y0 + D.uy * s);
        lc.globalAlpha = 0.85; lc.fillStyle = NV_ARCO[((seg / 2) | 0) % 6]; lc.fillRect(x - 1, y - 1, 3, 3);
        lc.globalAlpha = 0.5; lc.fillRect(x - Math.round(D.uy * 8), y + Math.round(D.ux * 8), 2, 2); lc.fillRect(x + Math.round(D.uy * 8), y - Math.round(D.ux * 8), 2, 2);
      }
    }
    if (e.beam) {
      const Bm = e.beam;
      if (e.state === 'feixeTell') {   // o leque no chão, com a sombra do planeta
        const k = e.stateT0 / 1.2, n = 44, ends = [];
        for (let m = 0; m <= n; m++) { const a = lerp(Bm.a0, Bm.a1, m / n), L = ocRayLuz(ix, iy, a, 46 * T); ends.push([X + ix + Math.cos(a) * L, Y + iy + Math.sin(a) * L]); }
        lc.globalAlpha = 0.1 + 0.14 * k; lc.fillStyle = '#ff3ec8';
        lc.beginPath(); lc.moveTo(X + ix, Y + iy); for (const [x, y] of ends) lc.lineTo(x, y); lc.closePath(); lc.fill();
        for (let m = 0; m <= n; m++) { const [x, y] = ends[m]; lc.globalAlpha = 0.5 + 0.4 * ((Math.floor(gameTime * 10) + m) & 1); lc.fillStyle = NV_ARCO[m % 6]; lc.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 2); }
        lc.globalAlpha = 0.6; lc.strokeStyle = '#ffd0f4'; lc.beginPath(); lc.moveTo(X + ix, Y + iy); lc.lineTo(ends[0][0], ends[0][1]); lc.stroke();
      } else if (Bm.on && Bm.len) {    // o raio: um halo claro, as 6 faixas e o miolo branco
        const c = Math.cos(Bm.a), s = Math.sin(Bm.a), nx = -s, ny = c, L = Bm.len;
        for (let d = 6; d < L; d += 2) {
          const x = X + ix + c * d, y = Y + iy + s * d, wob = Math.sin(d * 0.3 - gameTime * 30) * 0.6;
          lc.globalAlpha = 0.25; lc.fillStyle = '#ffd0f4'; lc.fillRect(Math.round(x + nx * -9), Math.round(y + ny * -9), 2, 2); lc.fillRect(Math.round(x + nx * 8), Math.round(y + ny * 8), 2, 2);
          lc.globalAlpha = 0.95;
          for (let b = 0; b < 6; b++) { const o = (b - 2.5) * 2.4 + wob; lc.fillStyle = NV_ARCO[b]; lc.fillRect(Math.round(x + nx * o), Math.round(y + ny * o), 2, 2); }
          lc.fillStyle = '#ffffff'; lc.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
      }
    }
  }
  // as lágrimas, as estrelas e as marcas delas
  for (const b of ocFx.tears) {
    const x = Math.round(X + b.x), y = Math.round(Y + b.y), sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp;
    for (let d = 1; d < 7; d++) { lc.globalAlpha = 1 - d / 7; lc.fillStyle = d < 3 ? '#bff8ff' : '#36f0ff'; lc.fillRect(Math.round(x - ux * d), Math.round(y - uy * d), 1, 1); }
    lc.globalAlpha = 1; lc.fillStyle = '#36f0ff'; lc.fillRect(x - 1, y - 1, 3, 3); lc.fillStyle = '#ffffff'; lc.fillRect(x, y - 1, 1, 2);
  }
  const A = OCA.get();
  for (const s of ocFx.stars) {
    if (s.done) continue;
    const k = clamp((s.t + 0.6 + 0.14 * 7) / (0.6 + 0.14 * 7), 0, 1), x = Math.round(X + s.x), y = Math.round(Y + s.land) - 2;
    lc.globalAlpha = 0.4 + 0.5 * ((Math.floor(gameTime * 12) & 1) ? 1 : 0.4); lc.fillStyle = NV_ARCO[s.c];
    const r = Math.round(9 - k * 4); lc.fillRect(x - r, y, r * 2 + 1, 1); lc.fillRect(x - 1, y - 3, 3, 4); lc.fillRect(x - 3, y - 1, 7, 1);
    lc.globalAlpha = 0.3; lc.fillRect(x - r, y - 1, r * 2 + 1, 1);
    if (s.t >= -0.6) { lc.globalAlpha = 1; lc.drawImage(A.star, Math.round(X + s.x) - 4, Math.round(Y + s.y) - 4); for (let d = 2; d < 14; d += 3) { lc.globalAlpha = 0.6 * (1 - d / 14); lc.fillStyle = NV_ARCO[s.c]; lc.fillRect(Math.round(X + s.x), Math.round(Y + s.y) - 4 - d, 1, 2); } }
  }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  const GL = OCA.GL;
  // a lâmina da Cauda do Cometa: a cor da ponta gira pelas 6
  if (pl && !pl.dead && pl.lg && pl.lg.cometa && pl.bladeA != null && hb.sel === 0) { const [, , ex, ey] = bladeSeg(pl.fArm, pl.sAng, bladeLen()); lc.globalAlpha = 0.3; lc.drawImage(GL.arco[(gameTime * 6 | 0) % 6], Math.round(ex) - cx - 9, Math.round(ey) - cy - 9); }
  for (const S of ocFx.slashes) { const a = S.cut ? Math.max(0, 1 - (S.t - 0.5) / 0.28) : 0.25; for (let b = 0; b < 6; b += 2) { const r = S.L * (0.45 + b * 0.15); lc.globalAlpha = a * 0.5; lc.drawImage(GL.arco[b], Math.round(S.x + Math.cos(S.a) * r) - cx - 9, Math.round(S.y + Math.sin(S.a) * r) - cy - 9); } }
  const B = ocB(); if (!B || !ocPlan || !pl) return;
  const X = ocCX() - cx, Y = ocCY() - cy, P = ocPlan;
  if (Math.abs(X - VW / 2) > VW + 300) return;
  lc.globalAlpha = 0.16 + 0.04 * Math.sin(gameTime * 2); lc.drawImage(GL.planet, Math.round(X + P.px) - 60, Math.round(Y + P.py) - 60);
  for (const R of ocFx.trail.values()) {
    if (R.t <= 1 && (Math.floor(R.t * 10) & 1)) continue;
    lc.globalAlpha = 0.32; lc.drawImage(GL.arco[R.c], Math.round(ocLap((R.tx + 0.5) * T)) - cx - 9, Math.round((R.ty + 0.5) * T) - cy - 9);
  }
  if (ocFx.seal) for (let n = 0; n < ocFx.seal.n; n += 2) { const [i, j] = ocFx.seal.cells[n]; lc.globalAlpha = 0.35 + ocFx.seal.flash * 0.5; lc.drawImage(GL.pink, Math.round(X + i * T) - 12, Math.round(Y + j * T) - 12); }
  const E = ocBoss || (!ocState.dead ? ocIdleE : null);
  if (E && !E.hidden) {
    const ex = Math.round(X + E.lx), ey = Math.round(Y + E.ly);
    lc.globalAlpha = ocBoss ? 0.2 : 0.14; lc.drawImage(GL.eye, ex - 40, ey - 40);
    lc.globalAlpha = 0.16; lc.drawImage(E.rainbow ? GL.arco[(gameTime * 8 | 0) % 6] : GL.iris, Math.round(ex + E.look[0]) - (E.rainbow ? 9 : 12), Math.round(ey + E.look[1]) - (E.rainbow ? 9 : 12));
    const t = E.tail; for (let i = 3; i < t.length; i += 4) { lc.globalAlpha = 0.16 * (1 - i / t.length); lc.drawImage(GL.arcoB[(i >> 2) % 6], Math.round(X + t[i][0]) - 16, Math.round(Y + t[i][1]) - 16); }
  }
  const e = ocBoss; if (!e) return;
  for (const b of ocFx.tears) { lc.globalAlpha = 0.7; lc.drawImage(GL.tear, Math.round(X + b.x) - 10, Math.round(Y + b.y) - 10); }
  for (const s of ocFx.stars) if (!s.done && s.t >= -0.6) { lc.globalAlpha = 0.6; lc.drawImage(GL.star, Math.round(X + s.x) - 12, Math.round(Y + s.y) - 12); }
  if (e.state === 'feixeTell') { const [ix, iy] = ocIris(e); lc.globalAlpha = 0.3 + 0.4 * (e.stateT0 / 1.2); lc.drawImage(GL.beam, Math.round(X + ix) - 22, Math.round(Y + iy) - 22); }
  if (e.beam && e.beam.on && e.beam.len) {
    const [ix, iy] = ocIris(e), c = Math.cos(e.beam.a), s = Math.sin(e.beam.a);
    for (let d = 10, m = 0; d < e.beam.len; d += 14, m++) { lc.globalAlpha = 0.4; lc.drawImage(GL.arcoB[m % 6], Math.round(X + ix + c * d) - 16, Math.round(Y + iy + s * d) - 16); }
    lc.globalAlpha = 0.6; lc.drawImage(GL.beam, Math.round(X + ix + c * e.beam.len) - 22, Math.round(Y + iy + s * e.beam.len) - 22);
  }
});
// a luz: o planeta, um céu claro em volta, o olho, o rastro, as lágrimas, o raio
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const B = ocB(), P = ocPlan; if (!B || !P || !pl) return;
  if (Math.abs(wdx(B.cx - (x0 + w / 2))) > w / 2 + 30 || B.cy + P.H < y0 || B.cy - P.H > y0 + h) return;
  const X = ocCX(), Y = ocCY();
  addL(X + P.px, Y + P.py, 0.75);
  // o céu holográfico acende a sala inteira (a camada é a única cheia de luz): uma grade de luzes fracas por dentro
  for (let j = -P.RI + 2; j <= P.fyJ + 1; j += 3) for (let i = -P.RI + 2; i <= P.RI - 2; i += 3) if (i * i + j * j <= (P.RI - 1.2) * (P.RI - 1.2) && ocK(i, j) === OK_A) addL(X + i * T, Y + j * T, 0.58 + 0.12 * hash2(i, j, 4651));
  const E = ocBoss || (!ocState.dead ? ocIdleE : null);
  if (E && !E.hidden) addL(X + E.lx, Y + E.ly, ocBoss ? 0.85 : 0.6);
  let n = 0; for (const R of ocFx.trail.values()) { if (n++ > 40) break; addL(ocLap((R.tx + 0.5) * T), (R.ty + 0.5) * T, 0.32); }
  for (const b of ocFx.tears) addL(X + b.x, Y + b.y, 0.45);
  for (const s of ocFx.stars) if (!s.done) addL(X + s.x, Y + s.land - 4, 0.4);
  const e = ocBoss;
  if (e && e.beam && e.beam.on && e.beam.len) { const [ix, iy] = ocIris(e); for (let d = 20; d < e.beam.len; d += 36) addL(X + ix + Math.cos(e.beam.a) * d, Y + iy + Math.sin(e.beam.a) * d, 0.6); }
}; }

/* ---------- o turno: acordar, sair, a luta ---------- */
HOOK.update.push(dt => {
  ocSlashTick(dt);
  ocSound();
  const B = ocB(); if (!B || !ocPlan || !pl || state !== 'play') return;
  ocTrailTick(dt);
  if (ocState.dead) return;
  // um save velho ou um bloco posto deixou a sala diferente: volta para a semente (e o herói, se estava dentro, para a porta)
  if (!ocChecked && !bossFight) {
    ocChecked = true;
    if (ocDiffers()) {
      const D = ocPlan.doors[0];
      if (ocHero().d < ocPlan.R && D) { pl.x = ocCX() + (D.ii - D.side * 0.5) * T - pl.w / 2; pl.y = ocCY() + (D.jf - 0.5) * T - pl.h - 0.01; pl.vx = pl.vy = 0; }
      ocWrite();
    }
  }
  const H = ocHero();
  if (!ocBoss) ocIdleTick(dt);
  if (!bossFight && !pl.dead && H.d < ocPlan.RI - 1.5) ocStart();
  const e = ocBoss;
  if (!e || !ocFight()) return;
  if (!pl.dead && H.d > ocPlan.R - 0.5) { endBossFight(false); return; }
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
  ocFxTick(dt);
});

/* ---------- som: um teremim que flutua com o olho, o zumbido grave do reator; o sino do rastro, o feixe ---------- */
const ocHum = { n: null };
function ocSound() {
  if (!ac || !noiseBuf) return;
  let want = 0, f = 392, low = 0;
  const B = ocB();
  if (B && ocPlan && !ocState.dead && pl && !pl.dead && state === 'play') {
    const H = ocHero(), e = ocBoss;
    want = ocFight() ? 0.05 : H.d < 34 ? 0.03 * (1 - H.d / 34) : 0;
    low = ocFight() ? 0.05 : want;
    const E = e || ocIdleE;
    f = 330 - E.ly / T * 9 + (e && e.state === 'investe' ? 180 : 0) + (e && e.rainbow ? 60 : 0);
    if (e && e.hidden) want = 0;
    if (e && e.beam && e.beam.on) low = 0.14;
  }
  if (muted) want = low = 0;
  if (!ocHum.n) {
    if (want <= 0 && low <= 0) return;
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const vib = ac.createOscillator(); vib.frequency.value = 5.6; const vg = ac.createGain(); vg.gain.value = 9; vib.connect(vg); vg.connect(o.frequency);
    const g = ac.createGain(); g.gain.value = 0;
    const h = ac.createOscillator(); h.type = 'triangle'; h.frequency.value = 55; const hf = ac.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 160; const hg = ac.createGain(); hg.gain.value = 0;
    o.connect(g); g.connect(sfxOut); h.connect(hf); hf.connect(hg); hg.connect(sfxOut);
    o.start(); vib.start(); h.start();
    ocHum.n = { o, g, hg, vib };
  }
  const N = ocHum.n, t = ac.currentTime;
  N.g.gain.setTargetAtTime(want, t, 0.4); N.o.frequency.setTargetAtTime(clamp(f, 180, 900), t, 0.25); N.hg.gain.setTargetAtTime(low, t, 0.3);
}
Object.assign(sfx, {
  // o teremim passando: um seno que escorrega com o vibrato e um sopro
  ocWhoosh(v = 1) { tone(360, 0.5 * v + 0.2, 'sine', 0.05, 420 * v); tone(720, 0.4 * v + 0.15, 'sine', 0.015, 600 * v, 0.05); noise(0.5 * v + 0.2, 0.05, 900 + 900 * v, 'bandpass', 0, 1.5); },
  // o sino do rastro: notas da escala pentatônica, uma por bloco novo
  ocChime(n = 0) { const S = [784, 880, 1047, 1175, 1319, 1568], f = S[n % 6]; tone(f, 0.35, 'sine', 0.018); tone(f * 2, 0.2, 'sine', 0.006, 0, 0.01); },
  ocMira() { tone(600, 0.7, 'sine', 0.025, 500); noise(0.6, 0.02, 3000, 'bandpass', 0, 6); },
  ocLagrima() { tone(1400, 0.2, 'triangle', 0.04, -800); noise(0.12, 0.05, 4000, 'highpass'); tone(2100, 0.15, 'sine', 0.02, -900, 0.02); },
  ocSplash(v = 1) { noise(0.15, 0.06 * v, 2600, 'bandpass', 0, 2); tone(900, 0.12, 'sine', 0.025 * v, -500); },
  ocPisca(v = 1) { noise(0.05, 0.12, 5000, 'highpass'); tone(1800 * v, 0.06, 'square', 0.03, -1200); tone(240, 0.18, 'sine', 0.05, -120, 0.02); },
  ocInveste() { tone(300, 0.8, 'sine', 0.06, 700); tone(150, 0.8, 'sawtooth', 0.025, 200); noise(0.7, 0.1, 1200, 'bandpass', 0, 0.8); },
  ocFeixeCarga() { tone(110, 1.2, 'sawtooth', 0.03, 110); tone(55, 1.3, 'sine', 0.07, 30); noise(1.2, 0.03, 400, 'bandpass', 0, 3); },
  // o feixe: um zumbido grave e largo
  ocFeixe() { tone(55, 1.6, 'sawtooth', 0.05, 8); tone(82, 1.6, 'sine', 0.06, -10); tone(165, 1.5, 'triangle', 0.02, 20); noise(1.6, 0.07, 300, 'lowpass'); noise(1.5, 0.03, 2400, 'bandpass', 0, 4); },
  ocEstrelas() { for (let k = 0; k < 5; k++) tone(1568 - k * 120, 0.18, 'sine', 0.02, -200, k * 0.08); },
  ocImpacto() { noise(0.18, 0.08, 900, 'lowpass'); tone(1200, 0.2, 'sine', 0.02, -700); tone(2400, 0.1, 'sine', 0.01, 0, 0.02); },
  ocBarreira(v = 1) { tone(120, 0.6 * v, 'sawtooth', 0.03 * v, 60); for (let k = 0; k < 6; k++) noise(0.05, 0.04 * v, 2000 + k * 300, 'bandpass', k * 0.07, 6); },
  ocAnel(k = 0) { tone(k === 1 ? 520 : k === 2 ? 880 : 700, 0.15, 'triangle', 0.025, k === 0 ? -400 : 200); noise(0.1, 0.03, 3000, 'bandpass', 0, 3); },
  ocFase(v = 1) { tone(260, 1.4 * v, 'sine', 0.07, 520); tone(390, 1.2 * v, 'sine', 0.04, 780, 0.1); tone(55, 1.4 * v, 'sawtooth', 0.04, 20); noise(1.2 * v, 0.06, 800, 'bandpass', 0, 1); },
  ocCorte() { for (let k = 0; k < 3; k++) tone(1319 + k * 330, 0.12, 'sine', 0.025, -200, k * 0.03); noise(0.1, 0.05, 3600, 'highpass'); },
  ocMorte() { tone(700, 2.6, 'sine', 0.06, -560); tone(1050, 2.2, 'sine', 0.03, -800, 0.1); for (let k = 0; k < 6; k++) tone([784, 880, 1047, 1175, 1319, 1568][k], 0.6, 'sine', 0.02, 0, 0.6 + k * 0.15); noise(2.4, 0.05, 600, 'lowpass'); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.olhoCometa = { dead: ocState.dead };
  // o rastro e a barreira nunca vão para o save
  if (o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([, t]) => t !== NV_RASTRO && t !== NV_BARREIRA);
  return o;
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.oc) bossFight = null;
  ocBoss = null; ocPlan = null; ocChecked = false; ocClear(); ocFx.trail.clear(); ocFx.slashes.length = 0;
  ocState.dead = !!(sv && sv.olhoCometa && sv.olhoCometa.dead);   // antes da geração: nvDress lê
  return _nw(sd, sv);
}; }
