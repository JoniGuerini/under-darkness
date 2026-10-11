'use strict';

/* ================= A Dama do Espelho: a chefe do Reino Élfico =================
   O Espelho da Lua (docs/camadas/11-reino-elfico.md, seção 7). O 255 reserva no Poço uma caixa maciça de Pedra-do-Poço
   de x0 - 3 a x1 + 3 e de top - 3 a fy + 3 em volta da gruta de 64 x 26 (elBoss), cava os dois corredores de serviço
   por fora da caixa e chama elDress; este arquivo escreve a gruta dentro dela: o oco com o teto de Raiz-Mãe emaranhada
   (os cantos de cima arredondados, fios de raiz pendurados), o Espelho d'Água no chão de ponta a ponta (2 de fundo),
   as plataformas de raiz dos lados em 3 alturas alternadas (o pulo do herói é de 3), a Lua Presa (EL_LUA, raio 3,
   no elBoss.moon, a 7 do teto) pendurada nas raízes, as paredes de fundo (o poço e a folhagem perto da lua) e os dois
   túneis das portas (4 de altura, de door.x, na borda da caixa, até o ar de dentro; o véu é a parte que cruza a casca).
   Pisar dentro da gruta acorda a Dama; o Véu de Luar fecha as duas portas. Fora da luta nada da gruta quebra.
   Sair (portal, teleporte) ou morrer refaz a gruta pelo plano (as raízes que caíram somem, a Lua volta branca, as
   Sentinelas Sombrias e o reflexo somem) e a Dama volta com a vida cheia.
   As raízes que caem e o véu vão direto em tiles (sem setTile): nunca entram nos diffs nem no save.
   A Lua é desenhada por cima dos blocos dela (o disco liso, as raízes que a seguram): branca, vermelha da fase 2 em
   diante, apagada no eclipse (EMIT dela vai a zero enquanto dura). O espelho reflete a sala: a faixa logo acima do
   chão é copiada de cabeça para baixo na água (drawImage da própria tela, sem getImageData), e a Dama aparece nele
   mesmo quando paira alto.
   Três fases, todo golpe com aviso:
     1. a Dama da Luz (100% a 60%): Raio da Lua (ergue a mão; um círculo prateado marca o chão 0,8 s e um pilar de
        luz cai ali, 70%), Lâminas de Luz (abre os braços 0,6 s; 3 crescentes em leque, 50% cada), Deslize (some num
        brilho e aparece sobre outra plataforma).
     2. a Tentação (60%): cresce, a pele cinza-azulada, os olhos brancos, o vestido escuro; a Lua fica vermelha. Duas
        Sentinelas Sombrias entram pelas portas (uma vez). Encantamento (a mão estendida 0,5 s; anéis prateados vão
        até o herói em 1 s: enfeitiçado 2,5 s, puxado para ela), Espinhos de Raiz (sombras no chão 0,7 s; raízes
        pontudas descem do teto ali, 60%, e ficam fincadas 5 s).
     3. o Reflexo (30%): o espelho acorda e o reflexo dela (a Dama da Luz que ela foi) sobe da água do outro lado da
        sala, espelhado no meio; repete cada golpe do lado de lá, não leva dano e se parte quando ela morre. A cada
        12 s a Lua apaga por 3 s (pisca antes): só a luz do herói.
   Solta a Lágrima da Lua (lança lendária: cada golpe tem 30% de chamar um raio de lua fino sobre o alvo, com 50% do
   golpe; luz 1) e, na primeira vitória, uma das três bases da camada. A morte fica salva (damaEspelho.dead).
   Encaixe como o Olho-Cometa (246): elDress, endBossFight, hitEnemy, killEnemy, breakTile, pickImpact, recalc,
   weaponFor, propLights, drawEnemy (as sombras), makeSave e newWorld embrulhados; o resto por AI/DRAW_E/HOOK.
   Carrega depois do 255 e do 246, antes do 259 e do 49 (que escala ET). */

// nível pelo registro das camadas (129); números escritos como os dos monstros, o 49 escala
const DMQ_L = layerBossLvl('elfos');
const DMQ = { hp: Math.round(360 * (1 + 0.3 * (DMQ_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (DMQ_L - 1))), xp: 520, p2: 0.6, p3: 0.3, eclEvery: 12, eclDark: 3, stake: 5 };
const dmState = { dead: false };
ET.dama = { name: 'A Dama do Espelho', w: 16, h: 52, hp: DMQ.hp, dmg: DMQ.dmg, xp: DMQ.xp, kb: 0, fly: true, phase: true, blood: '#e6eef8', boss: true };
const DMQ_DROPS = [['lagrima_lua', 1], ['min_lunarita', 1, 6, 10], ['cristal_sangrento', 1, 2, 4], ['folha_prata', 1, 2, 5], ['pocao', 1, 2, 4]];
const DMQ_BASES = ['glaive_lunar', 'escudo_folha', 'elmo_alado'];
const dmDrops = () => { DROPS.dama = DMQ_DROPS.filter(([id]) => ITEMS[id]); };
dmDrops();
let dmBoss = null, dmPlan = null, dmChecked = false, dmAllow = false;
const dmFx = { seal: null, raios: [], laminas: [], aneis: [], espinhos: [], stakes: new Map(), sombras: [], beams: [], refl: null, red: 0, ecl: null, lit: 1, ripples: [] };
const dmIdleE = { lx: 0, ly: 0, t: 0, facing: 1, pose: 'idle', ph: 0 };

/* ---------- geometria (i, j em blocos: i a partir de cx, j a partir do chão fy; o espelho começa em j = 0) ---------- */
const DK_F = 0, DK_C = 1, DK_A = 2, DK_E = 3, DK_R = 4, DK_P = 5, DK_L = 6, DK_T = 7, DK_B = 8;   // fora, casca, ar, espelho, raiz do teto, plataforma, lua, túnel, véu
const dmB = () => (typeof elBoss !== 'undefined' && elBoss) ? elBoss : null;
const dmLap = x => { const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
// o meio da gruta (entre as colunas cx - 1 e cx) e a linha do espelho, em px do mundo
const dmCX = () => dmLap(dmB().cx * T), dmCY = () => dmB().fy * T;
const dmIdx = (i, j) => { const B = dmB(); return (B.fy + j) * WW + wrapX(B.cx + i); };
function dmIJ(tx, ty) { const P = dmPlan, B = dmB(); if (!B || !P) return null; const i = wdx(wrapX(tx) - B.cx), j = ty - B.fy; return i >= P.I0 && i <= P.I1 && j >= P.J0 && j <= P.J1 ? [i, j] : null; }
const dmInBox = (tx, ty) => !!dmIJ(tx, ty);
const dmQ = (i, j) => { const P = dmPlan; return (j - P.J0) * P.NX + (i - P.I0); };
const dmK = (i, j) => { const P = dmPlan; return i >= P.I0 && i <= P.I1 && j >= P.J0 && j <= P.J1 ? P.k[dmQ(i, j)] : DK_F; };
const dmLive = () => !!(dmB() && dmPlan && !dmState.dead);
const dmFight = () => !!(bossFight && bossFight.dm);
// o herói em px locais (pés)
function dmHero() { const hx = pl.x + pl.w / 2 - dmCX(), hy = pl.y + pl.h - dmCY(); return { hx, hy, cy: hy - pl.h / 2 }; }
function dmHeroIn(m = 0) { const P = dmPlan, H = dmHero(), i = Math.floor(H.hx / T), j = Math.floor((H.hy - 2) / T); return i >= P.AI0 - m && i <= P.AI1 + m && j >= P.JT - m && j <= -1 + m; }
function dmDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
const dmDirty = idx => markDirty(idx % WW, (idx / WW) | 0);

/* ---------- o plano da gruta (a semente: o que elDress escreve e o que o reinício devolve) ---------- */
function dmLayout() {
  const B = dmB(), HW = Math.floor((B.w || 64) / 2), AI0 = -HW, AI1 = HW - 1, JT = (B.top != null ? B.top : B.fy - (B.h || 26)) - B.fy;
  const I0 = AI0 - 3, I1 = AI1 + 3, J0 = JT - 3, J1 = 3, NX = I1 - I0 + 1, NY = J1 - J0 + 1, n = NX * NY;
  const t = new Uint16Array(n), w = new Uint8Array(n), k = new Uint8Array(n);
  const q = (i, j) => (j - J0) * NX + (i - I0), inb = (i, j) => i >= I0 && i <= I1 && j >= J0 && j <= J1;
  const set = (i, j, tt, kk, ww) => { if (!inb(i, j)) return; const Q = q(i, j); t[Q] = tt; k[Q] = kk; if (ww != null) w[Q] = ww; };
  const isAir = (i, j) => inb(i, j) && k[q(i, j)] === DK_A;
  // a casca inteira primeiro
  for (let j = J0; j <= J1; j++) for (let i = I0; i <= I1; i++) set(i, j, EL_PEDRA_POCO, DK_C, WEL_POCO);
  // o teto: cantos de cima arredondados, a linha um pouco irregular
  const ceil = new Int16Array(NX);
  // ruído suave numa dimensão (o teto e o emaranhado ondulam devagar, sem degraus de um bloco)
  const vn1 = (i, s, sc) => { const X = i / sc, a = Math.floor(X), f = X - a, k = f * f * (3 - 2 * f); return lerp(hash2(a, 0, s), hash2(a + 1, 0, s), k); };
  for (let i = AI0; i <= AI1; i++) {
    const u = clamp((Math.abs(i + 0.5) - HW * 0.55) / (HW * 0.45), 0, 1);
    ceil[i - I0] = JT + Math.round(u * u * 8 + vn1(i + 40, 7301, 5) * 1.6);
  }
  for (let i = AI0; i <= AI1; i++) for (let j = ceil[i - I0]; j <= -1; j++) set(i, j, AIR, DK_A, WEL_POCO);
  // o espelho d'água: 2 de fundo de ponta a ponta
  for (let i = AI0; i <= AI1; i++) for (let j = 0; j <= 1; j++) set(i, j, EL_ESPELHO, DK_E, WEL_POCO);
  // a Lua Presa
  const M = B.moon || { cx: B.cx, cy: B.top + 7, r: 3 }, mi = wdx(M.cx - B.cx), mj = M.cy - B.fy, mr = M.r || 3;
  for (let j = mj - mr - 1; j <= mj + mr + 1; j++) for (let i = mi - mr - 1; i <= mi + mr + 1; i++) if (Math.hypot(i - mi, j - mj) <= mr + 0.2 && isAir(i, j)) set(i, j, EL_LUA, DK_L);
  // o emaranhado do teto: 2 a 4 de raiz debaixo da pedra, e a pedra da beira vira raiz aqui e ali
  const root = (i, j) => { if (isAir(i, j)) set(i, j, EL_RAIZ, DK_R); };
  for (let i = AI0; i <= AI1; i++) {
    const c = ceil[i - I0], d = Math.round(1.2 + vn1(i + 40, 7302, 4) * 2.6 + vn1(i + 40, 7309, 1.6) * 0.9);
    for (let j = c; j < c + d; j++) root(i, j);
    // a raiz também corre por dentro da pedra, logo acima
    for (let j = c - 3; j < c; j++) if (inb(i, j) && vn1(i + 40 + j * 7, 7310, 3) > 0.55) set(i, j, EL_RAIZ, DK_R);
  }
  // fios pendurados: descem do emaranhado, às vezes desviam um bloco
  const lowest = i => { let j = JT; while (j < 0 && inb(i, j) && !isAir(i, j)) j++; return j; };
  for (let n0 = 0; n0 < 11; n0++) {
    let i = AI0 + 1 + Math.floor(hash2(n0, 5, 7303) * (AI1 - AI0 - 2));
    if (Math.abs(i - mi) <= mr + 2) continue;
    let j = lowest(i); const L = 1 + Math.floor(hash2(n0, 6, 7303) * 4);
    for (let s = 0; s < L && j < -14; s++, j++) { root(i, j); if (hash2(n0, s, 7304) < 0.22) { i += hash2(n0, s, 7305) < 0.5 ? -1 : 1; root(i, j); } }
  }
  // as raízes que seguram a Lua: duas retas do teto até ela (as que abraçam o disco são desenhadas por cima dele)
  const line = (a0, b0, a1, b1) => { const N = Math.max(Math.abs(a1 - a0), Math.abs(b1 - b0)) || 1; for (let s = 0; s <= N; s++) { const i = Math.round(lerp(a0, a1, s / N)), j = Math.round(lerp(b0, b1, s / N)); root(i, j); } };
  for (const di of [-2, 1]) line(mi + di, JT, mi + di, mj - mr);
  // as plataformas de raiz: 3 alturas alternadas de cada lado (a de baixo para dentro, a do meio na parede, a de cima
  // para dentro de novo); a direita é o espelho da esquerda
  const plats = [];
  const PL = [[-3, AI0 + 5, AI0 + 12], [-6, AI0, AI0 + 6], [-9, AI0 + 8, AI0 + 16]];
  for (const [j, a, b] of PL) for (const side of [-1, 1]) {
    const i0 = side < 0 ? a : -1 - b, i1 = side < 0 ? b : -1 - a;
    for (let i = i0; i <= i1; i++) if (isAir(i, j)) set(i, j, EL_RAIZ, DK_P);
    plats.push({ j, i0, i1, side });
  }
  // as paredes de fundo: folhagem perto da lua e debaixo do emaranhado, manchas no resto
  for (let j = J0; j <= J1; j++) for (let i = I0; i <= I1; i++) {
    const Q = q(i, j); if (k[Q] === DK_C || k[Q] === DK_E) continue;
    const nearMoon = Math.hypot(i - mi, (j - mj) * 1.2) < 9 + hash2(i >> 1, j >> 1, 7306) * 3;
    const nearCeil = j < ceil[clamp(i, AI0, AI1) - I0] + 5 + hash2(i, 0, 7307) * 2;
    const patch = hash2(i >> 2, j >> 2, 7308) > 0.72 && j < -4;
    w[Q] = nearMoon || nearCeil || patch ? WEL_FOLHAS : WEL_POCO;
  }
  // os túneis das portas: de door.x (a borda da caixa) até o ar de dentro, 4 de altura; o véu nas 2 colunas de dentro
  const doors = (B.doors && B.doors.length ? B.doors : [-1, 1].map(side => ({ side, x: B.cx + (side < 0 ? I0 : I1), fy: B.fy })));
  const dd = [];
  for (const D of doors) {
    const side = D.side || Math.sign(wdx(D.x - B.cx)) || 1, jf = clamp((D.fy != null ? D.fy : B.fy) - B.fy, -6, 0);
    const iEdge = side < 0 ? I0 : I1, iIn = side < 0 ? AI0 : AI1, bar = [];
    for (let i = iEdge; side < 0 ? i < iIn : i > iIn; i -= side) for (let j = jf - 4; j <= jf - 1; j++) {
      const shell = side < 0 ? i >= iIn - 2 : i <= iIn + 2;
      set(i, j, AIR, shell ? DK_B : DK_T, WEL_POCO);
      if (shell) bar.push([i, j]);
    }
    // o chão do túnel é a casca; dentro, o ar já chega até o espelho
    dd.push({ side, jf, ii: iIn, bar });
  }
  // onde a Dama paira (pés em px locais): sobre o espelho e sobre cada plataforma
  const spots = [-13, -5, 5, 13].map(x => ({ x: x * T, y: -1.6 * T, j: 0 }));
  for (const p of plats) spots.push({ x: ((p.i0 + p.i1 + 1) / 2) * T, y: p.j * T - 0.7 * T, j: p.j });
  return { I0, I1, J0, J1, NX, NY, AI0, AI1, JT, HW, t, w, k, ceil, doors: dd, plats, spots, mi, mj, mr, mx: (mi + 0.5) * T, my: (mj + 0.5) * T };
}
// grava o plano na caixa (chunks sujos, diffs da sala apagados)
function dmWrite() {
  const P = dmPlan; if (!P) return;
  for (let Q = 0; Q < P.NX * P.NY; Q++) {
    if (!P.k[Q]) continue;
    const idx = dmIdx(P.I0 + Q % P.NX, P.J0 + ((Q / P.NX) | 0));
    if (tiles[idx] !== P.t[Q] || walls[idx] !== P.w[Q]) { tiles[idx] = P.t[Q]; walls[idx] = P.w[Q]; dmDirty(idx); }
    diffs.delete(idx);
  }
  dmFx.stakes.clear();
  mapVer++;
}
function dmDiffers() { const P = dmPlan; for (let Q = 0; Q < P.NX * P.NY; Q++) if (P.k[Q] && tiles[dmIdx(P.I0 + Q % P.NX, P.J0 + ((Q / P.NX) | 0))] !== P.t[Q]) return true; return false; }

/* ---------- a construção (o 255 chama elDress logo depois de cavar, com elBoss preenchido) ---------- */
function elDress() {
  if (!dmB()) return;
  dmPlan = dmLayout();
  dmWrite();
  dmIdleReset();
}

/* ---------- o Véu de Luar ---------- */
function dmCellFree(i, j, pad = 0) {
  const r = { x: dmCX() + i * T - pad, y: dmCY() + j * T - pad, w: T + pad * 2, h: T + pad * 2 };
  if (!pl.dead && overlap(r, pl)) return false;
  for (const m of enemies) if (!m.dead && m.type !== 'dama' && overlap(r, m)) return false;
  return true;
}
function dmSeal() {
  if (dmFx.seal) return;
  const cells = []; for (const D of dmPlan.doors) for (const c of D.bar) cells.push(c);
  cells.sort((a, b) => b[1] - a[1] || Math.abs(b[0]) - Math.abs(a[0]));
  dmFx.seal = { t: 0, n: 0, cells, flash: 0 };
  sfx.dmVeu();
}
function dmSealTick(dt) {
  const S = dmFx.seal; if (!S) return;
  S.t += dt; S.flash = Math.max(0, S.flash - dt);
  while (S.n < S.cells.length && S.t > 0.05 * (S.n + 1)) {
    const [i, j] = S.cells[S.n]; if (!dmCellFree(i, j)) break;
    S.n++;
    const idx = dmIdx(i, j); if (SOLID[tiles[idx]]) continue;
    tiles[idx] = EL_BARREIRA; dmDirty(idx);
    const x = dmCX() + (i + 0.5) * T, y = dmCY() + (j + 0.5) * T;
    burst(x, y, 5, '#e6eef8', 50, -20, 0.6, 1, true); burst(x, y, 3, '#9cc8ff', 30, -30, 0.5, 1, true);
  }
}

/* ---------- as raízes fincadas (Espinhos de Raiz): chão por 5 s ---------- */
function dmPutStake(i, j) {
  if (dmK(i, j) !== DK_A) return false;
  const idx = dmIdx(i, j); if (tiles[idx] !== AIR || !dmCellFree(i, j, 1)) return false;
  tiles[idx] = EL_RAIZ; dmDirty(idx);
  dmFx.stakes.set(idx, { i, j, t: DMQ.stake + Math.random() * 0.4 });
  return true;
}
function dmStakeTick(dt) {
  for (const [idx, S] of dmFx.stakes) {
    S.t -= dt; if (S.t > 0) continue;
    dmFx.stakes.delete(idx);
    if (tiles[idx] !== EL_RAIZ) continue;
    tiles[idx] = AIR; dmDirty(idx);
    const x = dmCX() + (S.i + 0.5) * T, y = dmCY() + (S.j + 0.5) * T;
    burst(x, y, 6, '#6a5a48', 40, 200, 0.6); burst(x, y, 3, '#9cc8ff', 30, 0, 0.5, 1, true);
  }
}

/* ---------- a luta ---------- */
function dmSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; e.stateT0 = 0; }
function dmStart() {
  dmDrops();
  const D = ET.dama, s0 = dmIdleE;
  const e = spawnEnemy('dama', dmCX() + s0.lx - D.w / 2, dmCY() + s0.ly - D.h, EL_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: DMQ_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, cd: 1.0, ph: 0, lx: s0.lx, ly: s0.ly, gx: s0.lx, gy: s0.ly, goalT: 2.5, last: '', rep: 0, hidden: false, alpha: 1, pose: 'idle', facing: s0.facing, tf: 0, sentDone: false, encT: 0, bobT: 0 });
  dmSet(e, 'intro', 1.6);
  dmBoss = e; bossFight = { e, dm: true };
  dmClear(); dmSeal();
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'A Dama do Espelho'; bn.lastChild.textContent = 'a guardiã da Lua Presa'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('A Dama do Espelho', 'a guardiã da Lua Presa');
  sfx.dmFase(0.6); shake(2);
}
function dmClear() {
  for (const k of ['raios', 'laminas', 'aneis', 'espinhos', 'sombras', 'ripples']) dmFx[k].length = 0;
  dmFx.seal = null; dmFx.refl = null; dmEclipseOff(); dmFx.ecl = null;
}
function dmEnd(won) {
  const e = dmBoss; dmBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) if (m.elMinion && !m.dead) { burst(m.x + m.w / 2, m.y + m.h / 2, 10, '#1a1e30', 60, -20, 0.8); burst(m.x + m.w / 2, m.y + m.h / 2, 6, '#9cc8ff', 50, 0, 0.5, 1, true); dmDrop(m); }
  const R = dmFx.refl;
  // a gruta volta ao plano: as raízes caídas somem, o véu abre, a Lua volta branca
  dmClear(); dmWrite(); dmFx.red = 0;
  if (!won) { if (e) dmDrop(e); dmIdleReset(); return; }
  dmState.dead = true;
  const x = e ? e.x + e.w / 2 : dmCX(), y = e ? e.y + e.h / 2 : dmCY() - 3 * T;
  burst(x, y, 30, '#ffffff', 130, 40, 1.1, 1, true); burst(x, y, 20, '#9cc8ff', 100, -40, 1.2, 1, true); burst(x, y, 14, '#f0c050', 80, 0, 1, 1, true);
  if (R && R.rise > 0.2) { const rx = dmCX() + R.lx, ry = dmCY() + R.ly - 24; for (let k = 0; k < 4; k++) burst(rx, ry, 8, k & 1 ? '#e6eef8' : '#9cc8ff', 120, 300, 1, 1, true); }
  // na primeira vitória: uma das três bases da camada
  const bases = DMQ_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.dmMorte();
  showBanner('Vitória', 'o espelho volta a ser só água');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.dm) return dmEnd(won); return _eb(won); }; }
// cada fase é vivida: o golpe só a leva até o piso da fase
const dmFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * DMQ.p2) : e.ph === 1 ? Math.floor(e.maxHp * DMQ.p3) : 0;
const dmInvuln = e => e.state === 'intro' || e.state === 'fase2' || e.state === 'fase3' || e.hidden;
function dmFloor(e) { const f = dmFloorHp(e); if (f > 0 && e.hp < f) e.hp = f; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'dama' && !e.dead) { const f = dmFloorHp(e); if (f > 0) { e.hp = f; return; } }
  return _k(e);
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && e.type === 'dama' && !e.dead && dmInvuln(e)) { burst(e.x + e.w / 2, e.y + e.h / 2, 4, '#e6eef8', 40, 0, 0.3, 1, true); return; }
  const hp0 = e ? e.hp : 0, r = _hit(e, dir, mult, melee);
  if (e && e.type === 'dama') dmFloor(e);
  if (melee && pl.lg && pl.lg.lagrima && e && hp0 - e.hp > 0) dmLagrima(hp0 - e.hp, e);
  return r;
}; }
// nada da gruta quebra enquanto ela vive (a picareta e as explosões passam por breakTile)
{ const _bt = breakTile; breakTile = function (tx, ty) { if (!dmAllow && dmLive() && dmInBox(tx, ty)) return; return _bt(tx, ty); }; }
{ const _pi = pickImpact; pickImpact = function (sx, sy, aim) {
  const tg = pl.target;
  if (tg && tg.inReach && dmLive() && dmInBox(tg.tx, tg.ty) && SOLID[tileAt(tg.tx, tg.ty)]) {
    sfx.tink(); burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 3, '#c8d4e8', 40, 300, 0.3, 1, true);
    pl.target = Object.assign({}, tg, { dig: false });
    try { _pi(sx, sy, aim); } finally { pl.target = tg; }
    pl.digT = 0; pl.digX = -1;
    return;
  }
  return _pi(sx, sy, aim);
}; }

/* ---------- o cérebro ---------- */
AI.dama = function (e, dt) {
  if (!dmB() || !dmPlan) { e.dead = true; return; }
  dmBrain(e, dt);
  e.h = Math.round(lerp(ET.dama.h, ET.dama.h + 8, e.tf));
  e.x = dmCX() + e.lx - e.w / 2; e.y = dmCY() + e.ly - e.h; e.vx = e.vy = 0;
};
function dmPick(e, list) {
  // não repete o mesmo golpe três vezes seguidas
  let tot = 0; for (const [, w] of list) tot += w;
  for (let n = 0; n < 4; n++) {
    let r = Math.random() * tot, k = list[0][0]; for (const [s, w] of list) { if (r < w) { k = s; break; } r -= w; }
    if (k === e.last && e.rep >= 1 && list.length > 1) continue;
    e.rep = k === e.last ? e.rep + 1 : 0; e.last = k; return k;
  }
  return list[0][0];
}
// paira devagar até o lugar escolhido, balançando; troca de lugar de tempos em tempos (perto do herói, nunca em cima)
function dmFloat(e, dt, sp = 1) {
  e.goalT -= dt;
  const H = dmHero();
  if (e.goalT <= 0) {
    const S = dmPlan.spots.filter(s => Math.abs(s.x - e.gx) > T || Math.abs(s.y - e.gy) > T).sort((a, b) => Math.abs(a.x - H.hx) - Math.abs(b.x - H.hx));
    const c = S.slice(1, 5), s = c[(Math.random() * c.length) | 0] || S[0];
    if (s) { e.gx = s.x; e.gy = s.y; }
    e.goalT = 3.5 + Math.random() * 2;
  }
  const dx = e.gx - e.lx, dy = e.gy + Math.sin(e.t * 1.7) * 3 - e.ly, L = Math.hypot(dx, dy), v = Math.min(L, (30 + L * 0.9) * sp * dt);
  if (L > 0.01) { e.lx += dx / L * v; e.ly += dy / L * v; }
}
function dmFace(e) { const H = dmHero(); if (Math.abs(H.hx - e.lx) > 4) e.facing = H.hx > e.lx ? 1 : -1; }
// a mão que lança (px locais): na frente do peito, ou no alto, conforme a pose
function dmHand(e, pose, m = 1) {
  const ph = e.tf > 0.5 ? 1 : 0, [x, y] = DMA.hand(ph, pose === 'mid' ? 'idle' : pose, false), f = e.facing * m, lx = m < 0 ? -e.lx : e.lx;
  if (pose === 'mid') return [lx + f * 3, e.ly + y - 8];
  return [lx + f * x, e.ly + y];
}
function dmHandOf(e, pose, back) { const [x, y] = DMA.hand(e.tf > 0.5 ? 1 : 0, pose, back); return [e.lx + e.facing * x, e.ly + y]; }
function dmBrain(e, dt) {
  e.stateT -= dt; e.stateT0 += dt; e.cd -= dt;
  const H = dmHero();
  e.tf = approach(e.tf, e.ph >= 1 && (e.state !== 'fase2' || e.stateT0 > 0.9) ? 1 : 0, dt * 2.5);
  // os limiares
  if (e.ph === 0 && e.hp <= e.maxHp * DMQ.p2 && e.state !== 'intro' && !e.hidden) { e.ph = 1; e.alpha = 1; e.pose = 'cast'; dmSet(e, 'fase2', 2.2); sfx.dmFase(0.9); return; }
  if (e.ph === 1 && e.hp <= e.maxHp * DMQ.p3 && !e.hidden && e.state !== 'fase2') { e.ph = 2; e.alpha = 1; e.pose = 'open'; dmSet(e, 'fase3', 2.4); sfx.dmFase(1.2); dmFx.refl = { rise: 0, lx: -e.lx, ly: e.ly }; return; }
  switch (e.state) {
    case 'intro':
      e.pose = e.stateT0 < 0.9 ? 'cast' : 'idle'; dmFace(e);
      if (Math.random() < dt * 20) parts.push({ x: dmCX() + e.lx + rnd(-14, 14), y: dmCY() + e.ly - rnd(0, 50), vx: rnd(-10, 10), vy: rnd(-40, -10), g: 0, life: 0.9, max: 0.9, col: Math.random() < 0.5 ? '#e6eef8' : '#f0c050', size: 1, glow: true });
      if (e.stateT <= 0) { dmSet(e, 'idle', 0); e.cd = 0.8; }
      break;
    case 'idle': {
      e.pose = 'idle'; dmFloat(e, dt); dmFace(e);
      if (e.cd > 0) break;
      let k;
      if (e.ph === 0) k = dmPick(e, [['raio', 0.42], ['laminas', 0.4], ['deslize', 0.18]]);
      else k = dmPick(e, [['raio', 0.2], ['laminas', 0.2], ['encanto', e.encT <= 0 ? 0.24 : 0], ['espinhos', 0.24], ['deslize', 0.12]]);
      switch (k) {
        case 'raio': dmSet(e, 'raioTell', 0.35); sfx.dmErgue(); break;
        case 'laminas': dmSet(e, 'laminasTell', 0.6); sfx.dmCarga(); break;
        case 'deslize': dmSet(e, 'deslizeTell', 0.45); sfx.dmBrilho(); break;
        case 'encanto': dmSet(e, 'encantoTell', 0.5); e.encT = 7; sfx.dmEncanto(0); break;
        case 'espinhos': dmSet(e, 'espinhosTell', 0.4); sfx.dmRaizes(0); break;
      }
      break;
    }
    /* ----- Raio da Lua: ergue a mão, marca o chão (os raios contam o próprio aviso de 0,8 s) ----- */
    case 'raioTell':
      e.pose = 'up'; dmFloat(e, dt, 0.3);
      if (e.stateT <= 0) { dmCast(e, 'raio'); dmSet(e, 'recover', 0.9); }
      break;
    /* ----- Lâminas de Luz ----- */
    case 'laminasTell':
      e.pose = 'open'; dmFace(e);
      if (Math.random() < dt * 30) { for (const bk of [false, true]) { const [hx, hy] = dmHandOf(e, 'open', bk); parts.push({ x: dmCX() + hx + rnd(-6, 6), y: dmCY() + hy + rnd(-6, 6), vx: 0, vy: 0, g: 0, life: 0.3, max: 0.3, col: '#ffffff', size: 1, glow: true }); } }
      if (e.stateT <= 0) { dmCast(e, 'laminas'); dmSet(e, 'recover', 0.55); }
      break;
    /* ----- Deslize ----- */
    case 'deslizeTell':
      e.pose = 'cast'; e.alpha = 1 - e.stateT0 / 0.45 * 0.7;
      if (Math.random() < dt * 40) parts.push({ x: dmCX() + e.lx + rnd(-10, 10), y: dmCY() + e.ly - rnd(0, 50), vx: rnd(-8, 8), vy: rnd(-50, -20), g: 0, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#e6eef8' : '#9cc8ff', size: 1, glow: true });
      if (e.stateT <= 0) {
        e.hidden = true; e.alpha = 0; dmSet(e, 'deslize', 0.35); sfx.dmSome();
        const x = dmCX() + e.lx, y = dmCY() + e.ly - 24; burst(x, y, 18, '#e6eef8', 110, -20, 0.5, 1, true); burst(x, y, 8, '#f0c050', 70, 0, 0.5, 1, true);
        // outra plataforma, longe de onde estava e do lado do herói ou do outro (sorte)
        const S = dmPlan.spots.filter(s => s.j < 0 && Math.abs(s.x - e.lx) > 6 * T);
        const s = S[(Math.random() * S.length) | 0] || dmPlan.spots[0];
        e.sx = e.lx; e.sy = e.ly; e.lx = e.gx = s.x; e.ly = e.gy = s.y; e.goalT = 3 + Math.random();
      }
      break;
    case 'deslize': {
      // o brilho corre de onde estava até onde vai
      const k = 1 - e.stateT / 0.35, x = dmCX() + lerp(e.sx, e.lx, k), y = dmCY() + lerp(e.sy, e.ly, k) - 24;
      if (Math.random() < dt * 60) parts.push({ x: x + rnd(-4, 4), y: y + rnd(-6, 6), vx: rnd(-10, 10), vy: rnd(-10, 10), g: 0, life: 0.5, max: 0.5, col: '#e6eef8', size: 1, glow: true });
      if (e.stateT <= 0) {
        e.hidden = false; dmSet(e, 'deslizeAbre', 0.35); sfx.dmSome(1.5); dmFace(e);
        burst(dmCX() + e.lx, dmCY() + e.ly - 24, 16, '#e6eef8', 100, -20, 0.5, 1, true); burst(dmCX() + e.lx, dmCY() + e.ly - 24, 6, '#9cc8ff', 60, 0, 0.5, 1, true);
      }
      break;
    }
    case 'deslizeAbre':
      e.pose = 'cast'; e.alpha = Math.min(1, e.stateT0 / 0.3);
      if (e.stateT <= 0) { e.alpha = 1; dmSet(e, 'recover', 0.4); }
      break;
    /* ----- Encantamento ----- */
    case 'encantoTell':
      e.pose = 'hand'; dmFace(e);
      if (Math.random() < dt * 30) { const [hx, hy] = dmHand(e, 'hand'); parts.push({ x: dmCX() + hx + rnd(-3, 3), y: dmCY() + hy + rnd(-3, 3), vx: rnd(-20, 20), vy: rnd(-20, 20), g: 0, life: 0.35, max: 0.35, col: '#e6eef8', size: 1, glow: true }); }
      if (e.stateT <= 0) { dmCast(e, 'encanto'); dmSet(e, 'encantoSegura', 1.0); }
      break;
    case 'encantoSegura':
      e.pose = 'hand';
      if (e.stateT <= 0) dmSet(e, 'recover', 0.4);
      break;
    /* ----- Espinhos de Raiz ----- */
    case 'espinhosTell':
      e.pose = 'cast'; dmFloat(e, dt, 0.3);
      if (e.stateT <= 0) { dmCast(e, 'espinhos'); dmSet(e, 'recover', 1.0); }
      break;
    /* ----- as fases ----- */
    case 'fase2':
      e.pose = e.stateT0 < 1.6 ? 'cast' : 'open'; shake(e.stateT0 < 1.2 ? 1 : 0);
      e.ly = approach(e.ly, Math.min(e.gy, -3 * T), dt * 30);
      if (Math.random() < dt * 30) parts.push({ x: dmCX() + e.lx + rnd(-14, 14), y: dmCY() + e.ly - rnd(0, 56), vx: rnd(-20, 20), vy: rnd(-30, 10), g: 0, life: 0.7, max: 0.7, col: Math.random() < 0.6 ? '#3a4460' : '#d02a3a', size: 1 });
      if (!e.sentDone && e.stateT0 > 1.1) { e.sentDone = true; dmSombras(); }
      if (e.stateT <= 0) { dmSet(e, 'idle', 0); e.cd = 0.8; }
      break;
    case 'fase3': {
      e.pose = 'open';
      const R = dmFx.refl; if (R) R.rise = Math.min(1, e.stateT0 / 1.8);
      if (Math.random() < dt * 8) dmFx.ripples.push({ x: -e.lx + rnd(-30, 30), t: 0 });
      if (e.stateT <= 0) { dmSet(e, 'idle', 0); e.cd = 0.6; dmFx.ecl = { t: DMQ.eclEvery * 0.6, st: 'wait' }; }
      break;
    }
    case 'recover':
      e.pose = e.stateT0 < 0.25 ? e.pose : 'idle'; dmFloat(e, dt, 0.8); dmFace(e);
      if (e.stateT <= 0) { dmSet(e, 'idle', 0); e.cd = e.ph === 0 ? 1.3 + Math.random() * 0.7 : e.ph === 1 ? 1.0 + Math.random() * 0.6 : 0.9 + Math.random() * 0.5; }
      break;
  }
  e.encT -= dt;
  // o reflexo segue espelhado no meio da sala
  const R = dmFx.refl; if (R) { R.lx = -e.lx; R.ly = e.ly; }
}
// o golpe sai dela e, com o reflexo acordado, sai espelhado dele também
function dmCast(e, kind) {
  dmCastFrom(e, kind, 1);
  const R = dmFx.refl; if (R && R.rise >= 1 && e.ph >= 2) dmCastFrom(e, kind, -1);
}
function dmCastFrom(e, kind, m) {
  const H = dmHero(), hx = H.hx * m, P = dmPlan;
  if (kind === 'raio') {
    const n = e.ph === 0 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      const x = clamp(k === 0 ? hx : hx + (Math.random() < 0.5 ? -1 : 1) * rnd(3, 5) * T, (P.AI0 + 1) * T, (P.AI1) * T), g = dmGround(x, k === 0 ? H.hy - 6 : -6);
      dmFx.raios.push({ x, g, top: dmCeilAt(x, g), t: -0.8 - k * 0.25, hit: false, dmg: Math.max(1, Math.round(e.dmg * 0.7)) });
    }
    sfx.dmMarca();
  } else if (kind === 'laminas') {
    const [ox, oy] = dmHand(e, 'mid', m), a0 = Math.atan2(H.cy - oy, hx - ox);
    for (const da of [-0.3, 0, 0.3]) dmFx.laminas.push({ x: ox, y: oy, vx: Math.cos(a0 + da) * 200, vy: Math.sin(a0 + da) * 200, t: 0, dmg: Math.max(1, Math.round(e.dmg * 0.5)) });
    sfx.dmLaminas();
  } else if (kind === 'encanto') {
    const [ox, oy] = dmHand(e, 'hand', m);
    for (let k = 0; k < 3; k++) dmFx.aneis.push({ x: ox, y: oy, t: -k * 0.12, m, tx: hx, ty: H.cy, src: m });
    sfx.dmEncanto(1);
  } else if (kind === 'espinhos') {
    const n = 4, xs = [];
    for (let k = 0; k < n; k++) {
      let x = 0;
      for (let a = 0; a < 8; a++) { x = clamp(hx + (k ? rnd(-6, 6) * T : rnd(-1, 1) * 6), (P.AI0 + 1) * T, P.AI1 * T); if (xs.every(v => Math.abs(v - x) > 20)) break; }
      xs.push(x);
      const g = dmGround(x, k === 0 ? H.hy - 6 : -6);
      dmFx.espinhos.push({ x, g, top: dmCeilAt(x, g), y: 0, t: -0.7 - k * 0.1, hit: false, done: false, dmg: Math.max(1, Math.round(e.dmg * 0.6)) });
    }
    sfx.dmRaizes(1);
  }
}
// o primeiro chão sólido debaixo de (x, y) em px locais; e o teto acima
function dmGround(x, y) {
  const cx = dmCX(), cy = dmCY(), tx = Math.floor((cx + x) / T); let ty = Math.floor((cy + Math.min(y, -2)) / T);
  for (let m = 0; m < 30; m++, ty++) { const t = tileAt(tx, ty); if (SOLID[t] && t !== EL_BARREIRA) return ty * T - cy; }
  return 0;
}
function dmCeilAt(x, g) {
  const cx = dmCX(), cy = dmCY(), tx = Math.floor((cx + x) / T); let ty = Math.floor((cy + g) / T) - 1;
  for (let m = 0; m < 40; m++, ty--) { const t = tileAt(tx, ty); if (SOLID[t] && t !== EL_LUA) return (ty + 1) * T - cy; }
  return dmPlan.JT * T;
}
// as Sentinelas Sombrias: entram pelas portas, uma de cada lado (as do 253, translúcidas)
function dmSombras() {
  if (!ET.sentinela || !AI.sentinela) return;
  for (const D of dmPlan.doors) dmFx.sombras.push({ D, t: 0.35 * dmFx.sombras.length });
}
function dmSombraTick(dt) {
  for (let k = dmFx.sombras.length - 1; k >= 0; k--) {
    const S = dmFx.sombras[k]; S.t -= dt; if (S.t > 0) continue;
    dmFx.sombras.splice(k, 1);
    const D = ET.sentinela, x = dmCX() + (S.D.ii + 0.5 - S.D.side * 1.5) * T, y = dmCY() + S.D.jf * T;
    for (const [i, j] of S.D.bar) burst(dmCX() + (i + 0.5) * T, dmCY() + (j + 0.5) * T, 5, '#3a4460', 60, -20, 0.6);
    if (dmFx.seal) dmFx.seal.flash = 0.6;
    sfx.dmVeu(0.7);
    const m = spawnEnemy('sentinela', x - D.w / 2, y - D.h, -1);   // zona fora da tabela: o 255 não apaga quem nasce na gruta
    if (m) { Object.assign(m, { elMinion: true, elSombra: true, memT: 8, aggro: true, xp: Math.min(m.xp || 1, 2), gold: 0, facing: -S.D.side }); burst(x, y - D.h / 2, 14, '#1a1e30', 70, -30, 0.8); }
  }
}

/* ---------- os golpes no ar: raios, lâminas, anéis, espinhos; o eclipse ---------- */
const dmHitPl = (x, y, r) => !pl.dead && x > pl.x - r && x < pl.x + pl.w + r && y > pl.y - r && y < pl.y + pl.h + r;
const DM_PASSA = t => t === EL_BARREIRA;
function dmFxTick(dt) {
  const e = dmBoss, cx = dmCX(), cy = dmCY();
  dmSealTick(dt); dmSombraTick(dt);
  // Raio da Lua: o aviso (t < 0), o pilar (0 a 0,35 s), o apagar
  for (let k = dmFx.raios.length - 1; k >= 0; k--) {
    const R = dmFx.raios[k], t0 = R.t; R.t += dt;
    if (t0 < 0 && R.t >= 0) { sfx.dmPilar(); shake(1.5); burst(cx + R.x, cy + R.g - 2, 14, '#ffffff', 90, -60, 0.6, 1, true); burst(cx + R.x, cy + R.g - 2, 8, '#9cc8ff', 70, 0, 0.5, 1, true); }
    if (R.t >= 0 && R.t < 0.35 && !R.hit && !pl.dead) {
      const X = cx + R.x; if (pl.x + pl.w > X - 9 && pl.x < X + 9 && pl.y + pl.h > cy + R.top && pl.y < cy + R.g) { R.hit = true; hurtPlayer(R.dmg, X, null, true); }
    }
    if (R.t > 0.6) dmFx.raios.splice(k, 1);
  }
  // as lâminas: crescentes retos, param no sólido
  for (let k = dmFx.laminas.length - 1; k >= 0; k--) {
    const b = dmFx.laminas[k]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt;
    const X = cx + b.x, Y = cy + b.y;
    if (Math.random() < dt * 25) parts.push({ x: X, y: Y, vx: rnd(-10, 10), vy: rnd(-10, 10), g: 0, life: 0.3, max: 0.3, col: '#e6eef8', size: 1, glow: true });
    if (dmHitPl(X, Y, 4)) { hurtPlayer(b.dmg, X, null, true); burst(X, Y, 12, '#ffffff', 80, 0, 0.5, 1, true); sfx.dmToque(); dmFx.laminas.splice(k, 1); continue; }
    const tt = tileAt(Math.floor(X / T), Math.floor(Y / T));
    if ((SOLID[tt] && !DM_PASSA(tt) && b.t > 0.04) || b.t > 3) { burst(X, Y, 8, '#e6eef8', 60, 0, 0.4, 1, true); burst(X, Y, 3, '#9cc8ff', 40, 0, 0.3, 1, true); sfx.dmToque(0.5); dmFx.laminas.splice(k, 1); }
  }
  // os anéis: vão até onde o herói estava, corrigindo devagar; quem encosta fica enfeitiçado
  for (let k = dmFx.aneis.length - 1; k >= 0; k--) {
    const A = dmFx.aneis[k]; A.t += dt; if (A.t < 0) continue;
    const H = dmHero();
    A.tx = lerp(A.tx, A.m > 0 ? H.hx : -H.hx, Math.min(1, dt * 1.2)); A.ty = lerp(A.ty, H.cy, Math.min(1, dt * 1.2));
    const left = Math.max(0.05, 1 - A.t), dx = A.tx - A.x, dy = A.ty - A.y;
    A.x += dx * Math.min(1, dt / left); A.y += dy * Math.min(1, dt / left);
    if (dmHitPl(cx + A.x, cy + A.y, 3) && e) {
      // puxa para quem lançou: ela, ou o reflexo do outro lado
      const fx = A.src > 0 ? e.x + e.w / 2 : cx - e.lx, fy = e.y + e.h * 0.6;
      if (typeof elEnfeiticar === 'function') elEnfeiticar(2.5, fx, fy);
      burst(cx + A.x, cy + A.y, 14, '#e6eef8', 70, 0, 0.6, 1, true); sfx.dmPreso();
      dmFx.aneis.length = 0; break;
    }
    if (A.t > 1.15) { burst(cx + A.x, cy + A.y, 6, '#e6eef8', 40, 0, 0.4, 1, true); dmFx.aneis.splice(k, 1); }
  }
  // os espinhos: tremem no teto durante o aviso, descem e ficam fincados
  for (let k = dmFx.espinhos.length - 1; k >= 0; k--) {
    const S = dmFx.espinhos[k]; S.t += dt;
    if (S.done) { if (S.t > 0.3) dmFx.espinhos.splice(k, 1); continue; }
    if (S.t < 0) {
      S.y = S.top + 8 * Math.min(1, (S.t + 0.7) / 0.7);
      if (S.t > -0.7 && Math.random() < dt * 18) parts.push({ x: cx + S.x + rnd(-4, 4), y: cy + S.top + 2, vx: rnd(-6, 6), vy: rnd(10, 40), g: 300, life: 0.8, max: 0.8, col: Math.random() < 0.7 ? '#6a5a48' : '#9cc8ff', size: 1 });
      continue;
    }
    S.y = Math.min(S.g, S.y + 900 * dt);
    if (!S.hit && dmHitPl(cx + S.x, cy + S.y, 2)) { S.hit = true; hurtPlayer(S.dmg, cx + S.x, null, true); }
    if (S.y >= S.g) {
      S.done = true; S.t = 0; shake(1.5);
      const tx = Math.floor((cx + S.x) / T), i = wdx(wrapX(tx) - dmB().cx), j = Math.round(S.g / T);
      dmPutStake(i, j - 1); dmPutStake(i, j - 2);
      burst(cx + S.x, cy + S.g - 2, 10, '#6a5a48', 80, 300, 0.6); burst(cx + S.x, cy + S.g - 2, 6, '#9cc8ff', 60, 0, 0.5, 1, true); sfx.dmFinca();
    }
  }
  // as ondas na água
  for (let k = dmFx.ripples.length - 1; k >= 0; k--) { const r = dmFx.ripples[k]; r.t += dt; if (r.t > 1.2) dmFx.ripples.splice(k, 1); }
  // o eclipse (fase 3): pisca 0,8 s, apaga 3 s
  const E = dmFx.ecl;
  if (E && e) {
    E.t -= dt;
    if (E.st === 'wait' && E.t <= 0) { E.st = 'warn'; E.t = 0.8; sfx.dmEclipse(0); }
    else if (E.st === 'warn' && E.t <= 0) { E.st = 'dark'; E.t = DMQ.eclDark; dmEclipseOn(); sfx.dmEclipse(1); }
    else if (E.st === 'dark' && E.t <= 0) { E.st = 'wait'; E.t = DMQ.eclEvery; dmEclipseOff(); sfx.dmEclipse(2); }
  }
  dmFx.lit = approach(dmFx.lit, E && E.st === 'dark' ? 0 : E && E.st === 'warn' ? ((Math.floor(E.t * 10) & 1) ? 0.35 : 1) : 1, dt * 6);
}
let dmEmit0 = null;
function dmEclipseOn() { if (dmEmit0 == null) dmEmit0 = EMIT[EL_LUA] || 0; EMIT[EL_LUA] = 0; }
function dmEclipseOff() { if (dmEmit0 != null) { EMIT[EL_LUA] = dmEmit0; dmEmit0 = null; } }

/* ---------- a Lágrima da Lua: 30% de um raio fino sobre o alvo, com 50% do golpe ---------- */
function dmLagrima(dmg, e) {
  if (dmFx.beams.some(b => b.at === pl.atkAt)) return;
  if (Math.random() >= 0.3) { dmFx.beams.push({ at: pl.atkAt, miss: true, t: 9 }); return; }
  dmFx.beams.push({ at: pl.atkAt, e, x: e.x + e.w / 2, y: e.y + e.h, top: e.y - 70, t: 0, dmg: dmg * 0.5, cut: false });
  if (dmFx.beams.length > 10) dmFx.beams.shift();
  sfx.dmLagrima();
}
function dmBeamTick(dt) {
  for (let k = dmFx.beams.length - 1; k >= 0; k--) {
    const B = dmFx.beams[k];
    if (B.miss) { if (pl.atkAt !== B.at) dmFx.beams.splice(k, 1); continue; }
    B.t += dt;
    const m = B.e; if (m && !m.dead) { B.x = m.x + m.w / 2; B.y = m.y + m.h; B.top = m.y - 70; }
    if (!B.cut && B.t >= 0.12) {
      B.cut = true;
      if (m && !m.dead && !(m.boss && m.state === 'intro') && !(m.type === 'dama' && dmInvuln(m))) {
        const v = Math.max(1, Math.round(B.dmg));
        m.hp -= v; m.flash = 0.12; m.showHp = 3.5; m.memT = 4;
        floatText(m.x + m.w / 2, m.y - 10, String(v), '#9cc8ff', 1.1);
        burst(B.x, m.y + m.h / 2, 10, '#e6eef8', 70, 0, 0.5, 1, true); burst(B.x, m.y + m.h / 2, 5, '#4a7ad0', 50, 0, 0.4, 1, true);
        if (m.type === 'dama') dmFloor(m);
        if (m.hp <= 0 && !m.dead) killEnemy(m);
      }
    }
    if (B.t > 0.42) dmFx.beams.splice(k, 1);
  }
}
STAT_DEF.lgLagrima = { t: 'Cada golpe tem 30% de chance de chamar um raio de lua fino sobre o alvo, com 50% do golpe', flag: 1 };
STAT_KEYS.push('lgLagrima');
ITEMS.lagrima_lua = {
  name: 'Lágrima da Lua', slot: 'weapon', kind: 'spear', rar: 4, lit: true,
  pal: { w: '#f8fbff', W: '#c8d4e8', l: '#7a88a8', g: '#e6eef8', G: '#7a88a8', h: '#d8ccb0', p: '#9cc8ff' },
  legend: [['lgLagrima', 1], ['light', 1], ['crit', 0.05]],
  desc: 'Uma gota que caiu da Lua Presa e não quis mais ser água. Onde a ponta encosta, a lua responde.'
};
BASE_INFO.lagrima_lua = [DMQ_L, 0.58];
ITEM_G.lagrima_lua = 0; ITEMS.lagrima_lua.g = 0;
dmDrops();
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgLagrima || 0;
  if (pl.lg) pl.lg.lagrima = b > 0;
  return r;
}; }
// a lança: a ponta de folha em prata clara, a gota azul acesa na base, a haste de madeira pálida com anéis de prata
const DM_SPEAR = [
  ".w.", "wWl", "wWl", "wWl", "WWl", ".W.", ".d.", "dDd", ".d.", "gGg", ".h.", ".H.", ".h.", ".h.", ".g.", ".h.", ".h.", ".H.", ".h.", ".h.", ".g.", ".p."
];
const DM_SPEAR_P = { w: '#ffffff', W: '#c8d4e8', l: '#7a88a8', d: '#4a7ad0', D: '#d0e8ff', g: '#e6eef8', G: '#7a88a8', h: '#d8ccb0', H: '#a8987a', p: '#9cc8ff' };
const DM_BLADE = { cv: null, em: null };
function dmSpearCanvas() {
  if (DM_BLADE.cv) return DM_BLADE.cv;
  const rows = DM_SPEAR, h = rows.length, w = 3, cv = mk(w, h), em = mk(w, h), x = cv.getContext('2d'), ex = em.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ch = rows[j][i]; if (ch === '.') continue;
    x.fillStyle = DM_SPEAR_P[ch]; x.fillRect(i, j, 1, 1);
    if (ch === 'd' || ch === 'D' || ch === 'w' || ch === 'p') { ex.fillStyle = DM_SPEAR_P[ch]; ex.fillRect(i, j, 1, 1); }
  }
  DM_BLADE.cv = cv; DM_BLADE.em = em;
  if (typeof ECL_EMIT !== 'undefined') { ECL_EMIT.set(cv, em); GEAR_SPOT.set(cv, [[1.5, 7.5, '#9cc8ff'], [1.5, 1, '#e6eef8']]); }
  return cv;
}
{ const _wf = weaponFor; weaponFor = function (id) { return id === 'lagrima_lua' ? dmSpearCanvas() : _wf(id); }; }

/* ---------- arte ---------- */
const DMA = {}, DMW = 64, DMH = 88, DMX = 32, DMY = 85;   // o quadro da Dama e a âncora (a barra do vestido)
{
const RAMPS = [];
const R6 = hexes => { const R = hexes.map(h => ph(h)); R.k = RAMPS.length; RAMPS.push(R); return R; };
const PAL = {
  pele: R6(['#3a2a3a', '#7a5a68', '#b8909c', '#e4c4c4', '#f6e2dc', '#fff6f0']),
  cabelo: R6(['#4a3a26', '#8a7450', '#c4ae7c', '#e6d6a6', '#f8f0d2', '#ffffff']),
  vestido: R6(['#2e3450', '#6a7496', '#a8b2cc', '#d6dcec', '#eef2fa', '#ffffff']),
  ouro: R6(['#4a3008', '#8a6018', '#c09030', '#f0c050', '#ffe08a', '#fff4c8']),
  lua: R6(['#1a2a5a', '#2a4a90', '#4a7ad0', '#9cc8ff', '#d0e8ff', '#ffffff']),
  // a Tentação
  pele2: R6(['#141828', '#2e3650', '#4e5a7a', '#7a88a6', '#a4b0ca', '#d0d8ea']),
  cabelo2: R6(['#24243a', '#4e4e6c', '#8a8aa6', '#bcbcd4', '#e4e4f4', '#ffffff']),
  vestido2: R6(['#05050c', '#0e1024', '#1c2040', '#2e3460', '#4a5288', '#7a84b8']),
  prata2: R6(['#1a1a2a', '#3a4058', '#6a7490', '#a8b2cc', '#dce2f0', '#ffffff']),
  sangue: R6(['#2a0610', '#5a0c1c', '#901a2c', '#d02a3a', '#ff6a6a', '#ffc0c0']),
  // a Lua Presa e as raízes
  luaB: R6(['#2a3450', '#5a6a8e', '#97a6c4', '#c8d4e8', '#e8eef8', '#ffffff']),
  luaR: R6(['#2a0608', '#6a1018', '#a8222a', '#e04a40', '#ff8a70', '#ffd0c0']),
  luaE: R6(['#030408', '#07090f', '#0c1018', '#121826', '#1a2236', '#26304a']),
  raiz: R6(['#14100c', '#2e261e', '#4e4234', '#76664e', '#a08c6e', '#c8b898']),
  sombra: R6(['#05060c', '#0a0c18', '#141a2c', '#20283e', '#2e3854', '#44506e'])
};
DMA.PAL = PAL;
const cg = (x, y, s) => hash2(x, y, s) - 0.5;
// o pintor (como o do Olho e o da Rainha): cada pixel lembra a rampa, o contorno pega o tom mais escuro
function pp(w, h) {
  const c = new Uint32Array(w * h), rid = new Int16Array(w * h).fill(-1), em = new Uint32Array(w * h);
  const P = {
    w, h, c, rid, em,
    put(x, y, R, v, lit) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; c[i] = R[v < 0 ? 0 : v > 5 ? 5 : v | 0]; rid[i] = R.k; em[i] = lit ? c[i] : 0; },
    has(x, y) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && !!c[y * w + x]; },
    ball(cx, cy, rx, ry, f) {
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.hypot(dx, dy); if (d > 1) continue;
        f(x, y, dx, dy, d);
      }
    },
    outline(skip) {
      const o = c.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!c[i] || (skip && skip(rid[i], x, y))) continue;
        const air = (x > 0 && !c[i - 1]) || (x < w - 1 && !c[i + 1]) || (y > 0 && !c[i - w]) || (y < h - 1 && !c[i + w]);
        if (air) o[i] = RAMPS[rid[i]][0];
      }
      c.set(o);
    },
    canvas(buf = c) { const cv = mk(w, h), x = cv.getContext('2d'), im = x.createImageData(w, h); new Uint32Array(im.data.buffer).set(buf); x.putImageData(im, 0, 0); return cv; }
  };
  return P;
}
DMA.pp = pp;
// uma linha grossa de pixels (para braços, mangas, raízes)
function stroke(Q, x0, y0, x1, y1, r, f) {
  const L = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let s = 0; s <= L; s++) { const k = s / L, x = lerp(x0, x1, k), y = lerp(y0, y1, k); for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) if (a * a + b * b <= r * r + 0.3) f(Math.round(x + a), Math.round(y + b), k, a, b); }
}
// as poses: [ombro→cotovelo, cotovelo→mão] em ângulo (0 para a frente, pi/2 para baixo), do braço da frente e do de trás
const POSES = {
  idle: { f: [1.6, 0.35], b: [1.6, 0.6] },
  up: { f: [-1.2, -1.45], b: [1.65, 1.2] },
  open: { f: [-0.3, -0.55], b: [Math.PI + 0.3, Math.PI + 0.55] },
  hand: { f: [0.05, -0.08], b: [1.65, 1.2] },
  cast: { f: [-0.95, -1.5], b: [Math.PI + 0.95, Math.PI + 1.5] }
};
// as medidas do corpo por fase (a Tentação é 8 mais alta): em px do quadro
const GEO = ph => { const tall = ph ? 8 : 0; return { tall, hem: DMY, waist: 47 - tall, sh: 40 - tall, hcy: 31 - tall, cx: DMX, ua: 7 + (ph ? 1 : 0), fa: 7 + (ph ? 1 : 0) }; };
// onde fica a mão (px em relação à âncora, de frente para a direita)
DMA.hand = (ph, pose, back) => {
  const G = GEO(ph), P = (POSES[pose] || POSES.idle)[back ? 'b' : 'f'], x0 = G.cx + (back ? -3 : 3), y0 = G.sh + 1.5;
  const ex = x0 + Math.cos(P[0]) * G.ua, ey = y0 + Math.sin(P[0]) * G.ua;
  return [ex + Math.cos(P[1]) * G.fa - DMX, ey + Math.sin(P[1]) * G.fa - DMY];
};
/* a Dama, de frente para a direita: o cabelo longo flutuando para trás em mechas, a tiara de ouro com a pedra da lua,
   o vestido branco de cintura alta com as mangas compridas, a cauda que varre para trás e a barra que se desfaz em
   luz; ph 1 é a Tentação (mais alta, pele cinza-azulada, olhos brancos acesos, vestido escuro com filete de prata,
   cabelo branco solto subindo como debaixo d'água, a tiara com pontas e a pedra de sangue, a barra vira fumaça e
   brasa) */
function paintDama(ph, pose, fr) {
  const Q = pp(DMW, DMH), G = GEO(ph), A = fr * Math.PI / 2, P = POSES[pose] || POSES.idle;
  const SK = ph ? PAL.pele2 : PAL.pele, HR = ph ? PAL.cabelo2 : PAL.cabelo, GW = ph ? PAL.vestido2 : PAL.vestido, TR = ph ? PAL.prata2 : PAL.ouro;
  const SP = ph ? PAL.sangue : PAL.lua, cx = G.cx, hcy = G.hcy, sh = G.sh, waist = G.waist, hem = G.hem;
  // 1. as mechas de trás: saem da nuca e caem para trás ondulando; na Tentação sobem e se abrem
  const locks = ph ? 7 : 6;
  for (let k = 0; k < locks; k++) {
    const kk = k / (locks - 1);
    let x = cx - 1.5 - kk * 2.4, y = hcy - 3 + kk * 3, a = Math.PI / 2 + (ph ? 0.3 + kk * 0.4 : 0.12 + kk * 0.22);
    const len = (ph ? 30 : 34) + Math.round(hash2(k, 1, 7400) * 8) - kk * 4, w0 = 2.6 - kk * 0.5;
    for (let s = 0; s < len; s++) {
      const q = s / len, w = Math.max(0.5, w0 * (1 - q * 0.75));
      // a curva: desce e vai para trás; a ponta levanta (flutua); a onda corre com o quadro
      const lift = ph ? 0.035 + kk * 0.015 : 0.006;
      a += Math.sin(s * 0.22 - A + k * 1.3) * (ph ? 0.09 : 0.045) + lift * (q > 0.3 ? 1 : 0);
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.8;
      for (let b = -Math.ceil(w); b <= Math.ceil(w); b++) {
        const px = x + Math.cos(a + Math.PI / 2) * b * 0.9, py = y + Math.sin(a + Math.PI / 2) * b * 0.9, u = b / (w + 0.5);
        // a luz vem do alto à esquerda: o lado de fora da mecha (o de cima) é o claro; a ponta clareia
        let v = 3.2 - u * 0.9 - q * 0.6 + (q > 0.82 ? 1 : 0) + Math.sin(s * 0.5 + k * 2) * 0.25 + cg(Math.round(px), Math.round(py), 7401) * 0.35;
        if (Math.abs(q - 0.18 - kk * 0.08) < 0.05) v += 0.9;   // o brilho que dá a volta no cabelo
        Q.put(px, py, HR, v - kk * 0.35);
      }
    }
  }
  // 2. o braço de trás (mais escuro) com a manga de anjo
  const arm = (Pa, x0, y0, dark) => {
    const ex = x0 + Math.cos(Pa[0]) * G.ua, ey = y0 + Math.sin(Pa[0]) * G.ua, hx = ex + Math.cos(Pa[1]) * G.fa, hy = ey + Math.sin(Pa[1]) * G.fa;
    stroke(Q, x0, y0, ex, ey, 1.3, (x, y, k, a, b) => Q.put(x, y, GW, 3.4 - dark - (a + b) * 0.25 + cg(x, y, 7411) * 0.3));
    stroke(Q, ex, ey, hx, hy, 1.0, (x, y, k, a, b) => Q.put(x, y, GW, 3.3 - dark - (a + b) * 0.25 + cg(x, y, 7412) * 0.3));
    // a manga: cai do antebraço, comprida no punho, varre um pouco para trás com o balanço
    const N = 12;
    for (let s = 0; s <= N; s++) {
      const k = s / N, x = lerp(ex, hx, k), y = lerp(ey, hy, k) + 1, L = 2 + Math.pow(k, 1.4) * (ph ? 15 : 12), sw = Math.sin(A + k * 1.5) * 1.3 - 1.2;
      for (let d = 0; d <= L; d++) {
        const q = d / L, xx = Math.round(x + sw * q * q), yy = Math.round(y + d);
        let v = 3.3 - dark - q * 1.3 + Math.cos(k * 9 + q * 2) * 0.4 + cg(xx, yy, 7413) * 0.3;
        if (d >= L - 1 && k > 0.35) { Q.put(xx, yy, TR, 3.3 - dark + (s & 1) * 0.5); continue; }   // a barra da manga
        Q.put(xx, yy, GW, v);
      }
    }
    // o punho e a mão
    Q.put(Math.round(lerp(ex, hx, 0.8)), Math.round(lerp(ey, hy, 0.8)), TR, 4 - dark);
    const c = Math.cos(Pa[1]), s0 = Math.sin(Pa[1]);
    Q.put(hx, hy, SK, 3.6 - dark); Q.put(hx + c, hy + s0, SK, 3.3 - dark); Q.put(hx + c * 1.6 - s0 * 0.8, hy + s0 * 1.6 + c * 0.8, SK, 2.9 - dark); Q.put(hx - s0, hy + c, SK, 3.0 - dark);
    return [hx, hy];
  };
  arm(P.b, cx - 3, sh + 1.5, 1.2);
  // 3. o vestido: corpete justo até a cintura alta, a saia que abre e varre para trás, as pregas, a barra que vira luz
  for (let y = sh; y <= hem; y++) {
    let c0, hw, hwB, t = 0;
    if (y < waist) { const q = (y - sh) / (waist - sh); c0 = cx - 0.3; hw = q < 0.2 ? 4.4 + q * 3 : lerp(5, 3.7, (q - 0.2) / 0.8); hwB = hw; if (y === sh) hw = hwB = 3.6; }
    else { t = (y - waist) / (hem - waist); c0 = cx - 0.6 - Math.pow(t, 1.5) * 3 + Math.sin(A + t * 2.6) * t * 1.1; hw = 3.8 + 9.5 * Math.pow(t, 0.95) + (ph ? t * 2 : 0); hwB = hw + 5.5 * Math.pow(t, 2.4); }
    for (let x = Math.floor(c0 - hwB - 1); x <= Math.ceil(c0 + hw + 1); x++) {
      const dx = x + 0.5 - c0, u = dx < 0 ? dx / hwB : dx / hw; if (Math.abs(u) > 1) continue;
      // a barra: curva (a frente sobe um pouco), ondulando
      const yb = hem - 1.2 - Math.max(0, u) * 1.6 + Math.sin(x * 0.5 + A) * 1.1;
      if (y > yb + 0.5) continue;
      const dis = yb - y;   // quanto falta para a barra
      if (y >= waist && dis < 7 && hash2(x, y, 7421 + fr) < (7 - dis) / 7.5) {
        // o tecido se desfaz: luz (fumaça e brasa na Tentação)
        if (hash2(x, y, 7422 + fr) < 0.5) Q.put(x, y, ph ? (hash2(x, y, 7423) < 0.4 ? PAL.sangue : PAL.sombra) : PAL.lua, ph ? 3 + hash2(x, y, 7424) * 2 : 4 + hash2(x, y, 7424) * 1.9, !ph || hash2(x, y, 7423) < 0.4);
        continue;
      }
      if (y < waist && y < sh + 6 && Math.abs(x + 0.5 - (cx + 1.2)) < (sh + 6 - y) * 0.45 && y > sh) { Q.put(x, y, SK, 3.6 - u * 0.6 + cg(x, y, 7431) * 0.3); continue; }   // o decote
      // as pregas: linhas que nascem na cintura e abrem para baixo
      const fc = Math.cos(u * (3.5 + t * 7) + Math.sin(A + t * 3) * 0.7 * t + 0.6), fold = y < waist ? fc * 0.3 : fc > 0.62 ? 0.85 : fc < -0.55 ? -0.75 : fc * 0.2;
      let v = 3.45 - u * 0.95 + fold * (0.4 + t * 0.8) - (y < waist ? 0 : t * 0.25) + cg(x, y, 7432) * 0.3;
      if (y < waist && y > waist - 4 && u > -0.2) v -= 0.4;          // a sombra debaixo do busto
      if (y >= waist - 1 && y <= waist) { Q.put(x, y, TR, 3.6 - u * 0.8 + ((x & 1) ? 0.5 : -0.1)); continue; }   // o cinto
      // o bordado logo acima da barra: folhas pequenas
      if (t > 0 && dis > 2.5 && dis < 4.5 && ((x + Math.round(dis)) % 3 === 0)) { Q.put(x, y, TR, 3.4 + (u < 0 ? 0.5 : 0)); continue; }
      // a Tentação: a saia de baixo carmesim aparece na abertura da frente
      if (ph && t > 0.25 && u > 0.08 && u < 0.08 + (t - 0.25) * 0.5) { Q.put(x, y, PAL.sangue, 2.2 + fold * 0.8 - u + cg(x, y, 7433) * 0.4); continue; }
      Q.put(x, y, GW, v);
    }
  }
  // o broche no cinto e a gola
  Q.put(cx + 1, waist - 1, SP, 4.6, true); Q.put(cx + 1, waist, TR, 4.6);
  for (let s = 1; s < 6; s++) { Q.put(cx + 1.2 - s * 0.45 - 0.6, sh + s, TR, 4.2); Q.put(cx + 1.2 + s * 0.45 + 0.6, sh + s, TR, 3.6); }
  // 4. o pescoço e a cabeça, três quartos para a direita
  for (let y = hcy + 3; y <= sh; y++) for (let x = cx - 1; x <= cx + 1; x++) Q.put(x, y, SK, 3.1 + (x - cx) * -0.3 - (y < hcy + 6 ? 0.8 : 0));
  Q.ball(cx + 0.7, hcy, 3.9, 4.9, (x, y, dx, dy, d) => {
    if (dy > 0.5 && (dx < -0.25 || dx > 0.75)) return;   // o queixo fino, mais para a frente
    Q.put(x, y, SK, 4.1 - (dx * 0.5 + dy * 0.7) * 1.0 - d * d * 0.9 + cg(x, y, 7441) * 0.25);
  });
  const ey = Math.round(hcy);
  // os olhos: um de frente, o outro mais estreito do outro lado do nariz; na Tentação, brancos e acesos
  if (ph) { for (const xx of [cx + 1, cx + 2, cx + 4]) { Q.put(xx, ey, PAL.vestido, 5, true); Q.put(xx, ey - 1, SK, 0.6); Q.put(xx, ey + 1, SK, 1.4); } Q.put(cx + 3, ey, SK, 1.6); }
  else { Q.put(cx + 1, ey, PAL.lua, 1.4); Q.put(cx + 2, ey, PAL.lua, 2.6); Q.put(cx + 4, ey, PAL.lua, 2.2); Q.put(cx + 2, ey - 1, PAL.lua, 0.5); Q.put(cx + 1, ey - 2, HR, 1.6); Q.put(cx + 2, ey - 2, HR, 1.8); Q.put(cx + 4, ey - 2, HR, 1.8); }
  Q.put(cx + 5, ey + 1, SK, 2.6); Q.put(cx + 5, ey + 2, SK, 3.2);                                     // o nariz
  Q.put(cx + 3, ey + 3, ph ? PAL.sangue : SK, ph ? 1.6 : 2.2); Q.put(cx + 4, ey + 3, SK, 2.8);   // a boca
  Q.put(cx - 1, ey + 2, SK, 3.2);
  // a orelha pontuda, atrás, subindo para trás por cima do cabelo
  for (const [a, b, v] of [[-2, 1, 3.4], [-3, 0, 3.8], [-4, -1, 3.6], [-5, -2, 3.3], [-6, -3, 3], [-3, 1, 2.4], [-4, 0, 2.6], [-7, -4, 2.8]]) Q.put(cx + a, ey + b, SK, v);
  // o alto da cabeça: o cabelo repartido, a franja caindo pela testa até a têmpora
  Q.ball(cx - 0.4, hcy - 1.4, 4.7, 4.6, (x, y, dx, dy, d) => {
    if (dy > -0.15 && dx > -0.45) return;
    if (dx > 0.5 && dy > -0.5) return;
    let v = 3.5 - (dx * 0.6 + dy * 0.8) * 1.0 + Math.sin(dx * 6 + dy * 2) * 0.3 + cg(x, y, 7451) * 0.3;
    if (Math.abs(d - 0.72) < 0.1 && dx < 0.3 && dy < 0) v += 1;   // o brilho
    Q.put(x, y, HR, v);
  });
  for (let s = 0; s < 6; s++) Q.put(cx + 3 - s * 0.2, hcy - 3 + s, HR, 3.6 - s * 0.2);                // a franja da frente
  for (let y = hcy - 2; y <= sh + 10 + G.tall * 0.3; y++) {                                             // a mecha da frente, pelo ombro
    const x = cx - 1 + Math.round(Math.sin(y * 0.35 - A) * 0.7) + (y > hcy + 5 ? 1 : 0) + (y > sh + 3 ? 1 : 0);
    Q.put(x, y, HR, 3.9 + ((y >> 1) & 1) * 0.5 - (y > sh + 7 ? 0.6 : 0)); Q.put(x - 1, y, HR, 2.8);
  }
  // a tiara: o arco na testa (passa por trás da orelha), a pedra e a lua crescente em cima
  for (let x = cx - 4; x <= cx + 4; x++) Q.put(x, ey - 3 + (x > cx + 2 ? 1 : 0) + (x < cx - 2 ? 1 : 0), TR, 3.8 + ((x & 1) ? 0.6 : 0));
  Q.put(cx + 2, ey - 3, SP, 5, true); Q.put(cx + 2, ey - 4, SP, 3.4, true);
  Q.put(cx + 1, ey - 5, TR, 4.4); Q.put(cx + 3, ey - 5, TR, 4.4); Q.put(cx + 1, ey - 6, TR, 4); Q.put(cx + 3, ey - 6, TR, 3.6);
  if (ph) for (const [a, b] of [[-3, -5], [-2, -6], [-1, -7], [0, -6], [4, -6], [5, -7], [5, -5]]) Q.put(cx + a, ey + b, TR, 3.2 + (b & 1) * 0.6);   // as pontas da coroa
  // 5. o braço da frente por cima de tudo
  const hand = arm(P.f, cx + 3, sh + 1.5, 0);
  if (pose !== 'idle') Q.put(hand[0], hand[1], ph ? PAL.prata2 : PAL.lua, 5, true);
  // a barra que se desfaz não ganha contorno (seria uma borda suja); o resto sim
  Q.outline((rk, x, y) => rk === PAL.lua.k || rk === PAL.sangue.k || rk === PAL.sombra.k || y > hem - 9);
  return { cv: Q.canvas(), em: Q.canvas(Q.em) };
}
// o quadro do reflexo: a Dama da Luz, pálida e azulada (assado uma vez por quadro, nada por tela)
function ghostOf(cv) {
  const c = mk(cv.width, cv.height), x = c.getContext('2d');
  x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.55; x.fillStyle = '#7ab0ff'; x.fillRect(0, 0, c.width, c.height);
  x.globalAlpha = 0.35; x.fillStyle = '#ffffff'; for (let y = 0; y < c.height; y += 3) x.fillRect(0, y, c.width, 1);
  return c;
}
DMA.cache = new Map();
DMA.get = (ph, pose, fr) => {
  const key = ph * 100 + Object.keys(POSES).indexOf(pose) * 10 + fr;
  let a = DMA.cache.get(key);
  if (!a) { a = paintDama(ph, pose, fr); DMA.cache.set(key, a); }
  return a;
};
DMA.white = a => a.w || (a.w = whiteOf(a.cv));
DMA.ghost = a => a.g || (a.g = ghostOf(a.cv));
// a Lua Presa: um disco liso de raio 43 que cobre os blocos dela, mares e crateras, luz do alto à esquerda, as
// raízes que a seguram passando por cima; branca, vermelha e apagada
function paintMoon(R) {
  const r = 43, n = r * 2 + 2, C = n / 2, Q = pp(n, n);
  const vn = (x, y, s, sc) => { const X = x / sc, Y = y / sc, x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, a = hash2(x0, y0, s), b = hash2(x0 + 1, y0, s), c = hash2(x0, y0 + 1, s), d = hash2(x0 + 1, y0 + 1, s), sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return lerp(lerp(a, b, sx), lerp(c, d, sx), sy); };
  const craters = [[-14, -10, 7], [12, 8, 9], [-6, 18, 5], [20, -14, 4], [-24, 6, 5], [4, -24, 4], [-2, 2, 3], [26, 14, 3]];
  Q.ball(C, C, r, r, (x, y, dx, dy, d) => {
    const lx = x - C, ly = y - C;
    let v = 3.7 - (dx * 0.55 + dy * 0.7) * 1.0 - Math.pow(d, 4) * 1.4 + cg(x, y, 7501) * 0.35;
    const mare = vn(lx + 50, ly + 50, 7502, 14) * 0.65 + vn(lx + 50, ly + 50, 7503, 6) * 0.35;
    if (mare > 0.56) v -= 0.9 + (mare - 0.56) * 2;
    for (const [cx0, cy0, cr] of craters) {
      const e = Math.hypot(lx - cx0, ly - cy0) / cr;
      if (e < 1) v -= 0.6 - ((lx - cx0) + (ly - cy0)) / cr * 0.5;   // a cova: escura do lado da luz, clara do outro
      else if (e < 1.25) v += ((lx - cx0) + (ly - cy0)) < 0 ? 0.6 : -0.3;   // a borda
    }
    Q.put(x, y, R, v);
  });
  // as raízes que a seguram: duas descem por cima, uma de cada lado abraça a borda
  const rootC = (pts, rr) => { for (let s = 0; s < pts.length - 1; s++) stroke(Q, C + pts[s][0], C + pts[s][1], C + pts[s + 1][0], C + pts[s + 1][1], rr, (x, y, k, a, b) => { if (Math.hypot(x + 0.5 - C, y + 0.5 - C) > r + 1) return; Q.put(x, y, PAL.raiz, 3 - a * 0.5 - b * 0.4 + cg(x, y, 7511) * 0.6 + (hash2(x, y, 7512) < 0.07 ? 1.5 : 0)); }); };
  rootC([[-24, -44], [-21, -36], [-22, -26], [-28, -18], [-34, -6], [-38, 6]], 1.6);
  rootC([[12, -44], [14, -36], [10, -28], [18, -20], [30, -14], [38, -4], [40, 6]], 1.6);
  rootC([[-21, -36], [-8, -31], [2, -36], [12, -30]], 1);
  rootC([[-30, -12], [-24, -4], [-26, 4]], 1);
  // a seiva azul nos sulcos das raízes
  for (let k = 0; k < 18; k++) { const a = hash2(k, 1, 7513) * Math.PI * 2, rr = r - 4 - hash2(k, 2, 7513) * 6, x = Math.round(C + Math.cos(a) * rr), y = Math.round(C + Math.sin(a) * rr); if (Q.rid[y * n + x] === PAL.raiz.k) Q.put(x, y, PAL.lua, 4, true); }
  Q.outline(rk => rk !== PAL.raiz.k);
  return Q.canvas();
}
DMA.moon = () => DMA.m || (DMA.m = { b: paintMoon(PAL.luaB), r: paintMoon(PAL.luaR), e: paintMoon(PAL.luaE) });
// a raiz pontuda que desce do teto (8 x 30): casca, o veio azul, a ponta afiada
function paintSpike() {
  const w = 9, h = 30, Q = pp(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / h, hw = t < 0.7 ? 3.6 - t * 1.2 : (1 - t) / 0.3 * 2.8;
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5 - 4.5) / Math.max(0.5, hw); if (Math.abs(u) > 1) continue;
      const bark = Math.sin(y * 0.9 + x * 2.1) > 0.5 ? -0.6 : 0;
      Q.put(x, y, PAL.raiz, 3.4 - u * 1.2 + bark + cg(x, y, 7521) * 0.5);
      if (x === 4 && (y % 5) < 3 && t < 0.8) Q.put(x, y, PAL.lua, 3.6, true);
    }
  }
  Q.outline(rk => rk === PAL.lua.k);
  return Q.canvas();
}
DMA.spike = () => DMA.sp || (DMA.sp = paintSpike());
// o feixe de luar que desce da Lua (um degradê vertical que afina para baixo; girado na hora de desenhar)
function paintShaft(col) {
  const w = 34, h = 260, c = mk(w, h), x = c.getContext('2d'), [r, g, b] = rgb(col);
  for (let y = 0; y < h; y++) {
    const k = y / h, a = (1 - k) * (1 - k) * 0.9, hw = w / 2 * (0.45 + k * 0.55);
    const G = x.createLinearGradient(w / 2 - hw, 0, w / 2 + hw, 0);
    G.addColorStop(0, `rgba(${r},${g},${b},0)`); G.addColorStop(0.5, `rgba(${r},${g},${b},${a})`); G.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = G; x.fillRect(Math.floor(w / 2 - hw), y, Math.ceil(hw * 2), 1);
  }
  return c;
}
DMA.shaft = () => DMA.sh || (DMA.sh = { b: paintShaft('#c8dcff'), r: paintShaft('#ff5a4a') });
DMA.GL = { lua: glow(96, '#c8dcff'), luaR: glow(96, '#ff3a3a'), luaS: glow(40, '#ffffff'), luaSR: glow(40, '#ff6a5a'), dama: glow(36, '#f8f0d2'), dama2: glow(30, '#6a7ab0'), gema: glow(8, '#9cc8ff'), gemaR: glow(8, '#ff4a4a'), olho: glow(5, '#ffffff'), raio: glow(20, '#d0e8ff'), lamina: glow(10, '#e6eef8'), anel: glow(10, '#c8d4e8'), espelho: glow(24, '#9cc8ff'), reflexo: glow(30, '#7ab0ff') };
}

/* ---------- desenho ---------- */
// a Dama inteira na tela: (sx, sy) é a barra do vestido; flip pela direção; alpha para o deslize e o reflexo
function dmDrawDama(E, sx, sy, fl, opt) {
  const ph = E.ph >= 1 || (E.tf || 0) > 0.5 ? 1 : 0, ghost = opt && opt.ghost;
  const fr = Math.floor((E.t || 0) * 5) & 3, a = DMA.get(ghost ? 0 : ph, E.pose || 'idle', fr);
  const img = fl ? DMA.white(a) : ghost ? DMA.ghost(a) : a.cv, f = opt && opt.facing != null ? opt.facing : E.facing;
  const x = Math.round(sx), y = Math.round(sy);
  lc.save();
  lc.globalAlpha = (opt && opt.alpha != null ? opt.alpha : E.alpha != null ? E.alpha : 1);
  if (opt && opt.clipY != null) { lc.beginPath(); lc.rect(x - DMW, opt.clipY - DMH * 2, DMW * 2, DMH * 2); lc.clip(); }
  lc.translate(x, y); if (f < 0) lc.scale(-1, 1);
  if (opt && opt.flipY) lc.scale(1, -1);
  lc.drawImage(img, -DMX, -DMY);
  lc.restore();
}
DRAW_E.dama = () => {};   // desenhada pelo HOOK.drawWorld, depois da Lua (para passar na frente dela)
EYES_E.dama = () => {};
WARN_E.dama = e => e.state === 'raioTell' || e.state === 'laminasTell' || e.state === 'encantoTell' || e.state === 'espinhosTell';
// as Sentinelas Sombrias: escuras e translúcidas (o filtro de canvas onde houver; o alfa sempre)
{ const _de = drawEnemy; drawEnemy = function (e, cx, cy) {
  if (!e.elSombra) return _de(e, cx, cy);
  lc.save(); lc.globalAlpha = 0.7 + 0.08 * Math.sin(gameTime * 3 + e.seed); lc.filter = 'grayscale(1) brightness(0.8) sepia(0.7) hue-rotate(185deg) saturate(1.8) contrast(1.15)';
  try { _de(e, cx, cy); } finally { lc.restore(); }
  // a fumaça que escorre delas
  if (Math.random() < 0.3) parts.push({ x: e.x + rnd(0, e.w), y: e.y + rnd(0, e.h), vx: rnd(-6, 6), vy: rnd(-20, -6), g: 0, life: 0.8, max: 0.8, col: Math.random() < 0.5 ? '#141a2c' : '#2e3854', size: 1, smoke: true });
}; }
// o espelho: a faixa logo acima do chão copiada de cabeça para baixo na água, ondulando; por cima, a Dama refletida
function dmMirror(cx, cy) {
  const P = dmPlan, X = dmCX() - cx, Y = Math.round(dmCY() - cy), D = 2 * T;
  const x0 = Math.max(0, Math.round(X + P.AI0 * T)), x1 = Math.min(VW, Math.round(X + (P.AI1 + 1) * T));
  if (x1 <= x0 || Y < -D || Y > VH + 2) return;
  lc.save();
  lc.beginPath(); lc.rect(x0, Y, x1 - x0, D); lc.clip();
  // linha a linha (de 2 em 2): a fileira y abaixo da linha d'água mostra a fileira y acima, deslocada pela onda
  const lit = 0.55 * dmFx.lit + 0.15;
  for (let k = 0; k < D; k += 2) {
    const sy = Y - 1 - k - 1; if (sy < 0) break;
    const off = Math.round(Math.sin(gameTime * 2.2 + k * 0.7) * (0.5 + k * 0.05));
    lc.globalAlpha = lit * (1 - k / D * 0.7);
    lc.drawImage(low, x0, sy, x1 - x0, 2, x0 + off, Y + k, x1 - x0, 2);
  }
  // a Dama no espelho mesmo quando paira alto (o espelho é dela)
  const E = dmBoss || (!dmState.dead ? dmIdleE : null);
  if (E && !E.hidden && -E.ly > 2 * T) {
    const h = -E.ly, a = clamp(0.32 - h / T * 0.015, 0.12, 0.32) * (E.alpha != null ? E.alpha : 1) * (0.3 + 0.7 * dmFx.lit) * clamp((h - 2 * T) / T, 0, 1);
    dmDrawDama(E, X + E.lx, Y + Math.min(h * 0.35, 10), false, { flipY: true, alpha: a });
  }
  const R = dmFx.refl; if (R && R.rise > 0 && E) dmDrawDama({ ph: 0, pose: E.pose, t: E.t, facing: -E.facing }, X + R.lx, Y + Math.min(-R.ly * 0.35, 10), false, { flipY: true, alpha: 0.25 * R.rise, ghost: true });
  // o brilho da Lua na água: um caminho de pontos que cintilam debaixo dela
  lc.globalAlpha = 0.5 * dmFx.lit; lc.fillStyle = dmFx.red > 0.5 ? '#ff8a70' : '#e8eef8';
  for (let n = 0; n < 16; n++) { const x = Math.round(X + P.mx + Math.sin(n * 2.3 + gameTime * 0.7) * (8 + n * 1.5)), y = Y + 1 + (n % 6) * 3; if (Math.sin(gameTime * 4 + n * 1.9) > 0.2) lc.fillRect(x, y, n & 1 ? 2 : 3, 1); }
  // as ondas que o reflexo faz ao acordar
  for (const r of dmFx.ripples) { const k = r.t / 1.2, w = 4 + k * 40; lc.globalAlpha = (1 - k) * 0.6; lc.fillStyle = '#d0e8ff'; lc.fillRect(Math.round(X + r.x - w), Y + 1, Math.round(w * 0.5), 1); lc.fillRect(Math.round(X + r.x + w * 0.5), Y + 1, Math.round(w * 0.5), 1); }
  lc.restore();
}
HOOK.drawWorld.push((cx, cy) => {
  const B = dmB(); if (!B || !dmPlan || !pl || Math.abs(wdx(B.cx - Math.floor((cx + VW / 2) / T))) > 70) return;
  const P = dmPlan, X = dmCX() - cx, Y = dmCY() - cy;
  // a Lua Presa por cima dos blocos dela
  const M = DMA.moon(), mx = Math.round(X + P.mx) - 44, my = Math.round(Y + P.my) - 44;
  if (my > -100 && my < VH + 10) {
    const red = dmFx.red, lit = dmFx.lit;
    if (lit < 1) lc.drawImage(M.e, mx, my);
    if (lit > 0) {
      lc.globalAlpha = lit * (1 - red); if (lc.globalAlpha > 0.01) lc.drawImage(M.b, mx, my);
      lc.globalAlpha = lit * red; if (lc.globalAlpha > 0.01) lc.drawImage(M.r, mx, my);
      lc.globalAlpha = 1;
    }
  }
  // o reflexo (fase 3): sobe da água do outro lado
  const E = dmBoss, R = dmFx.refl;
  if (R && E && R.rise > 0) {
    const yy = Y + R.ly + (1 - R.rise) * 60;
    dmDrawDama({ ph: 0, pose: E.pose, t: E.t + 0.4, facing: -E.facing }, X + R.lx, yy, false, { ghost: true, alpha: (E.hidden ? 0 : E.alpha) * (0.5 + 0.12 * Math.sin(gameTime * 6)), clipY: Y });
  }
  // a Dama (ou, fora da luta, ela parada sobre o espelho, olhando a Lua)
  if (E) { if (!E.hidden) dmDrawDama(E, X + E.lx + (E.state === 'fase2' ? Math.round(Math.sin(E.t * 60)) : 0), Y + E.ly, E.flash > 0); }
  else if (!dmState.dead) dmDrawDama(dmIdleE, X + dmIdleE.lx, Y + dmIdleE.ly, false);
});
// os avisos e o que brilha por cima do escuro
HOOK.drawTop.push((cx, cy) => {
  // os raios da Lágrima da Lua (onde quer que o herói esteja)
  for (const B of dmFx.beams) {
    if (B.miss) continue;
    const k = B.t < 0.12 ? B.t / 0.12 : Math.max(0, 1 - (B.t - 0.12) / 0.3), x = Math.round(B.x) - cx, y0 = Math.round(B.top) - cy, y1 = Math.round(B.y) - cy;
    lc.globalAlpha = 0.9 * k; lc.fillStyle = '#d0e8ff'; lc.fillRect(x - 1, y0, 3, Math.max(1, (y1 - y0) * Math.min(1, B.t / 0.12)));
    lc.fillStyle = '#ffffff'; lc.fillRect(x, y0, 1, Math.max(1, (y1 - y0) * Math.min(1, B.t / 0.12)));
    if (B.cut) { lc.globalAlpha = 0.7 * k; lc.fillStyle = '#9cc8ff'; lc.fillRect(x - 5, y1 - 1, 11, 1); lc.fillRect(x - 3, y1 - 2, 7, 1); }
  }
  lc.globalAlpha = 1;
  const B = dmB(); if (!B || !dmPlan || !pl) return;
  const X = dmCX() - cx, Y = dmCY() - cy, P = dmPlan;
  if (Math.abs(X - VW / 2) > VW + 400) return;
  // o espelho (aqui, depois do herói e da luz: reflete o que se vê)
  dmMirror(cx, cy);
  // poeira de luar flutuando na gruta (some no eclipse)
  if (dmFx.lit > 0.05) {
    lc.fillStyle = dmFx.red > 0.5 ? '#ffb0a0' : '#e8f0ff';
    for (let n = 0; n < 40; n++) {
      const hx = hash2(n, 1, 7601), hy = hash2(n, 2, 7601), sp = 3 + hash2(n, 3, 7601) * 6;
      const x = Math.round(X + (P.AI0 + 1 + hx * (P.AI1 - P.AI0 - 1)) * T + Math.sin(gameTime * 0.4 + n) * 10);
      const y = Math.round(Y + P.JT * T + 3 * T + ((hy * (-P.JT - 3) * T + gameTime * sp) % ((-P.JT - 3) * T)));
      if (x < 0 || x > VW || y < 0 || y > VH) continue;
      const tw = Math.sin(gameTime * (1 + hx * 2) + n * 3.1); if (tw < 0) continue;
      lc.globalAlpha = tw * 0.55 * dmFx.lit; lc.fillRect(x, y, 1, 1);
    }
    lc.globalAlpha = 1;
  }
  // o véu: fios de luar descendo
  if (dmFx.seal) for (let n = 0; n < dmFx.seal.n; n++) {
    const [i, j] = dmFx.seal.cells[n], x = Math.round(X + i * T), y = Math.round(Y + j * T);
    lc.globalAlpha = 0.45 + 0.25 * Math.sin(gameTime * 5 + j + i) + dmFx.seal.flash; lc.fillStyle = '#e6eef8';
    for (let s = 0; s < 3; s++) lc.fillRect(x + 2 + s * 4, y + ((Math.floor(gameTime * 18) + s * 5 + j * 4) % T), 1, 2);
  }
  lc.globalAlpha = 1;
  // as pedras e os olhos acesos da Dama por cima do escuro
  const E = dmBoss || (!dmState.dead ? dmIdleE : null);
  if (E && !E.hidden) {
    const ph = E.ph >= 1 || (E.tf || 0) > 0.5 ? 1 : 0, a = DMA.get(ph, E.pose || 'idle', Math.floor((E.t || 0) * 5) & 3);
    lc.save(); lc.globalAlpha = E.alpha != null ? E.alpha : 1; lc.translate(Math.round(X + E.lx + (E.state === 'fase2' ? Math.round(Math.sin(E.t * 60)) : 0)), Math.round(Y + E.ly)); if (E.facing < 0) lc.scale(-1, 1); lc.drawImage(a.em, -DMX, -DMY); lc.restore();
  }
  const e = dmBoss;
  // Raio da Lua: o círculo prateado que fecha (o aviso), depois o pilar
  for (const R of dmFx.raios) {
    const x = Math.round(X + R.x), g = Math.round(Y + R.g);
    if (R.t < 0) {
      const k = clamp(1 + R.t / 0.8, 0, 1), r = Math.round(16 - k * 8), on = (Math.floor(gameTime * 12) & 1);
      lc.globalAlpha = 0.6 + 0.4 * on; lc.fillStyle = '#ffffff';
      for (let s = 0; s < 32; s++) { const a = s / 32 * Math.PI * 2 + gameTime * 2; lc.fillRect(Math.round(x + Math.cos(a) * r), Math.round(g - 2 + Math.sin(a) * r * 0.3), (s & 3) ? 1 : 2, 1); }
      lc.globalAlpha = 0.35; lc.fillStyle = '#9cc8ff';
      for (let s = 0; s < 16; s++) { const a = s / 16 * Math.PI * 2 - gameTime * 3; lc.fillRect(Math.round(x + Math.cos(a) * (r + 4)), Math.round(g - 2 + Math.sin(a) * (r + 4) * 0.3), 1, 1); }
      lc.globalAlpha = 0.3 + 0.4 * k; lc.fillRect(x - r, g - 1, r * 2 + 1, 1); lc.fillStyle = '#9cc8ff'; lc.fillRect(x - 2, g - 2, 5, 1); lc.fillRect(x, g - 4, 1, 3);
      // a coluna fantasma que vai acendendo
      lc.globalAlpha = 0.06 + 0.14 * k; lc.fillStyle = '#d0e8ff'; lc.fillRect(x - 8, Math.round(Y + R.top), 17, g - Math.round(Y + R.top));
    } else {
      // o pilar: cai do teto em 0,08 s; halo azul, corpo prateado, miolo branco que tremula; riscos descendo; o anel no pé
      const k = R.t < 0.35 ? 1 : Math.max(0, 1 - (R.t - 0.35) / 0.25), top = Math.round(Y + R.top), bot = Math.round(lerp(top, g, Math.min(1, R.t / 0.08))), H = Math.max(1, bot - top);
      const w = Math.max(1, Math.round((R.t < 0.35 ? 7 : 7 * k) + Math.sin(gameTime * 40) * 0.6));
      lc.globalAlpha = 0.28 * k; lc.fillStyle = '#4a7ad0'; lc.fillRect(x - w - 3, top, w * 2 + 7, H);
      lc.globalAlpha = 0.5 * k; lc.fillStyle = '#9cc8ff'; lc.fillRect(x - w - 1, top, w * 2 + 3, H);
      lc.globalAlpha = 0.85 * k; lc.fillStyle = '#e6eef8'; lc.fillRect(x - w + 1, top, w * 2 - 1, H);
      lc.fillStyle = '#ffffff'; lc.fillRect(x - 1, top, 3, H);
      lc.globalAlpha = 0.7 * k; lc.fillStyle = '#4a7ad0';
      for (let s = 0; s < 6; s++) { const yy = top + ((Math.floor(gameTime * 260) + s * 41) % H); lc.fillRect(x + Math.round(Math.sin(s * 2.1) * (w - 1)), yy, 1, 5); }
      if (bot >= g) { const r = Math.round(10 + (R.t * 30)); lc.globalAlpha = 0.6 * k; lc.fillStyle = '#e6eef8'; lc.fillRect(x - r, g - 1, r * 2 + 1, 1); lc.fillRect(x - r + 3, g - 2, r * 2 - 5, 1); }
    }
  }
  // as lâminas: crescentes de luz girando no sentido do voo
  for (const b of dmFx.laminas) {
    const x = Math.round(X + b.x) + 0.5, y = Math.round(Y + b.y) + 0.5, a = Math.atan2(b.vy, b.vx);
    lc.globalAlpha = 1; lc.lineWidth = 2; lc.strokeStyle = '#e6eef8';
    lc.beginPath(); lc.arc(x - Math.cos(a) * 4, y - Math.sin(a) * 4, 6, a - 1.25, a + 1.25); lc.stroke();
    lc.lineWidth = 1; lc.strokeStyle = '#ffffff'; lc.beginPath(); lc.arc(x - Math.cos(a) * 4, y - Math.sin(a) * 4, 6, a - 0.9, a + 0.9); lc.stroke();
    lc.globalAlpha = 0.5; lc.strokeStyle = '#9cc8ff'; lc.beginPath(); lc.arc(x - Math.cos(a) * 7, y - Math.sin(a) * 7, 6, a - 1, a + 1); lc.stroke();
  }
  lc.lineWidth = 1;
  // os anéis do Encantamento
  for (const A of dmFx.aneis) {
    if (A.t < 0) continue;
    const x = Math.round(X + A.x) + 0.5, y = Math.round(Y + A.y) + 0.5, r = 4 + Math.sin(A.t * 14) * 1.5;
    lc.globalAlpha = 0.95; lc.strokeStyle = '#e6eef8'; lc.beginPath(); lc.ellipse(x, y, r, r * 0.55, gameTime * 3, 0, Math.PI * 2); lc.stroke();
    lc.globalAlpha = 0.6; lc.strokeStyle = '#9cc8ff'; lc.beginPath(); lc.ellipse(x, y, r + 2.5, (r + 2.5) * 0.55, -gameTime * 2, 0, Math.PI * 2); lc.stroke();
  }
  // os espinhos: a sombra no chão (cresce e escurece), a raiz tremendo no teto, a queda
  const SP = DMA.spike();
  for (const S of dmFx.espinhos) {
    if (S.done) continue;
    const x = Math.round(X + S.x), g = Math.round(Y + S.g), k = clamp((S.t + 0.7) / 0.7, 0, 1), r = Math.round(3 + k * 6), on = (Math.floor(gameTime * 12) & 1);
    // a sombra cresce no chão, com a beira carmesim piscando (no chão escuro só a sombra não se vê)
    lc.globalAlpha = 0.45 + 0.4 * k; lc.fillStyle = '#05060c';
    lc.fillRect(x - r, g - 2, r * 2 + 1, 2); lc.fillRect(x - r + 2, g - 3, r * 2 - 3, 1);
    lc.globalAlpha = (0.45 + 0.4 * k) * (on ? 1 : 0.5); lc.fillStyle = '#d02a3a';
    lc.fillRect(x - r - 1, g - 2, 1, 2); lc.fillRect(x + r + 1, g - 2, 1, 2); lc.fillRect(x - r + 1, g - 4, r * 2 - 1, 1);
    lc.fillStyle = '#ff6a6a'; lc.fillRect(x, g - 6 - (on ? 1 : 0), 1, 2);
    lc.globalAlpha = 1;
    const jt = S.t < 0 ? Math.round(Math.sin(gameTime * 70 + S.x) * k) : 0;
    lc.drawImage(SP, x - 4 + jt, Math.round(Y + S.y) - 30);
  }
  // as raízes fincadas tremem no último segundo
  for (const S of dmFx.stakes.values()) if (S.t < 1 && (Math.floor(S.t * 10) & 1)) { lc.globalAlpha = 0.35; lc.fillStyle = '#05060c'; lc.fillRect(Math.round(X + S.i * T), Math.round(Y + S.j * T), T, T); }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  const GL = DMA.GL;
  // a ponta da Lágrima da Lua na mão
  if (pl && !pl.dead && pl.lg && pl.lg.lagrima && pl.bladeA != null && hb.sel === 0) { const [, , ex, ey] = bladeSeg(pl.fArm, pl.sAng, bladeLen()); lc.globalAlpha = 0.35 + 0.1 * Math.sin(gameTime * 3); lc.drawImage(GL.gema, Math.round(ex) - cx - 8, Math.round(ey) - cy - 8); }
  for (const B of dmFx.beams) { if (B.miss) continue; const k = B.t < 0.12 ? B.t / 0.12 : Math.max(0, 1 - (B.t - 0.12) / 0.3); for (let y = B.top; y < B.y; y += 16) { lc.globalAlpha = 0.35 * k; lc.drawImage(GL.lamina, Math.round(B.x) - cx - 10, Math.round(y) - cy - 10); } }
  const B = dmB(); if (!B || !dmPlan || !pl) return;
  const X = dmCX() - cx, Y = dmCY() - cy, P = dmPlan;
  if (Math.abs(X - VW / 2) > VW + 400) return;
  // a Lua: o halo largo e o miolo, brancos ou vermelhos, mortos no eclipse
  const lit = dmFx.lit, red = dmFx.red, mx = Math.round(X + P.mx), my = Math.round(Y + P.my);
  if (lit > 0.01) {
    const pulse = 0.85 + 0.15 * Math.sin(gameTime * 1.3);
    lc.globalAlpha = 0.34 * lit * (1 - red) * pulse; lc.drawImage(GL.lua, mx - 96, my - 96);
    lc.globalAlpha = 0.1 * lit * (1 - red); lc.drawImage(GL.luaS, mx - 40, my - 40);
    lc.globalAlpha = 0.38 * lit * red * pulse; lc.drawImage(GL.luaR, mx - 96, my - 96);
    lc.globalAlpha = 0.1 * lit * red; lc.drawImage(GL.luaSR, mx - 40, my - 40);
  }
  // os feixes de luar: cinco, abrindo em leque para baixo, respirando devagar
  if (lit > 0.01) {
    const SH = DMA.shaft();
    for (let n = 0; n < 5; n++) {
      const a = (n - 2) * 0.32 + Math.sin(gameTime * 0.21 + n * 1.7) * 0.05, al = (0.07 + 0.04 * Math.sin(gameTime * 0.5 + n * 2.1)) * lit;
      lc.save(); lc.translate(mx, my); lc.rotate(a);
      if (red < 1) { lc.globalAlpha = al * (1 - red); lc.drawImage(SH.b, -17, 30); }
      if (red > 0) { lc.globalAlpha = al * red; lc.drawImage(SH.r, -17, 30); }
      lc.restore();
    }
  }
  if (lit < 0.6) {   // a coroa do eclipse: um anel fino em volta do disco escuro
    lc.globalAlpha = (0.6 - lit) * 0.9; lc.strokeStyle = red > 0.5 ? '#ff4a3a' : '#9cc8ff'; lc.lineWidth = 2;
    lc.beginPath(); lc.arc(mx + 0.5, my + 0.5, 44, 0, Math.PI * 2); lc.stroke(); lc.lineWidth = 1;
  }
  // o espelho brilha fraco debaixo da Lua
  lc.globalAlpha = 0.18 * lit; for (let s = -2; s <= 2; s++) lc.drawImage(GL.espelho, Math.round(X + P.mx + s * 30) - 24, Math.round(Y) - 20);
  // a Dama: um halo dourado (azulado e fraco na Tentação)
  const E = dmBoss || (!dmState.dead ? dmIdleE : null);
  if (E && !E.hidden) {
    const ph = E.ph >= 1 || (E.tf || 0) > 0.5, ex = Math.round(X + E.lx), ey = Math.round(Y + E.ly) - 30, al = E.alpha != null ? E.alpha : 1;
    lc.globalAlpha = (ph ? 0.18 : 0.22) * al; lc.drawImage(ph ? GL.dama2 : GL.dama, ex - (ph ? 30 : 36), ey - (ph ? 30 : 36));
    // a pedra da tiara e os olhos
    // a pedra da tiara (2 à frente, 51 acima da barra) e os olhos (48 acima), na Tentação 8 mais alto
    const f = E.facing || 1, gx = Math.round(X + E.lx + f * 2.5), gy = Math.round(Y + E.ly) - 51 - (ph ? 8 : 0);
    lc.globalAlpha = 0.6 * al; lc.drawImage(ph ? GL.gemaR : GL.gema, gx - 8, gy - 8);
    if (ph) { lc.globalAlpha = 0.5 * al; lc.drawImage(GL.olho, gx + f - 5, gy + 3 - 5); }
  }
  const R = dmFx.refl; if (R && R.rise > 0 && dmBoss && !dmBoss.hidden) { lc.globalAlpha = 0.25 * R.rise; lc.drawImage(GL.reflexo, Math.round(X + R.lx) - 30, Math.round(Y + R.ly) - 30 - 30); }
  const e = dmBoss; if (!e) return;
  for (const b of dmFx.laminas) { lc.globalAlpha = 0.7; lc.drawImage(GL.lamina, Math.round(X + b.x) - 10, Math.round(Y + b.y) - 10); }
  for (const A of dmFx.aneis) if (A.t >= 0) { lc.globalAlpha = 0.6; lc.drawImage(GL.anel, Math.round(X + A.x) - 10, Math.round(Y + A.y) - 10); }
  for (const Rr of dmFx.raios) {
    const x = Math.round(X + Rr.x), g = Math.round(Y + Rr.g);
    if (Rr.t < 0) { lc.globalAlpha = 0.25 + 0.3 * clamp(1 + Rr.t / 0.8, 0, 1); lc.drawImage(GL.raio, x - 20, g - 20); }
    else { const k = Rr.t < 0.35 ? 1 : Math.max(0, 1 - (Rr.t - 0.35) / 0.25); for (let y = Math.round(Y + Rr.top); y < g; y += 18) { lc.globalAlpha = 0.45 * k; lc.drawImage(GL.raio, x - 20, y - 20); } }
  }
  if (e.state === 'laminasTell') { const k = e.stateT0 / 0.6; for (const bk of [false, true]) { const [hx, hy] = dmHandOf(e, 'open', bk); lc.globalAlpha = 0.3 + 0.5 * k; lc.drawImage(GL.lamina, Math.round(X + hx) - 10, Math.round(Y + hy) - 10); } }
  if (e.state === 'encantoTell' || e.state === 'encantoSegura') { const [hx, hy] = dmHand(e, 'hand'); lc.globalAlpha = 0.6; lc.drawImage(GL.anel, Math.round(X + hx) - 10, Math.round(Y + hy) - 10); }
  if (e.state === 'raioTell') { const [hx, hy] = dmHand(e, 'up'); lc.globalAlpha = 0.4 + 0.5 * (e.stateT0 / 0.35); lc.drawImage(GL.raio, Math.round(X + hx) - 20, Math.round(Y + hy) - 20); }
});
// a luz: a Lua acende a gruta inteira (apagada no eclipse), a Dama, os raios, as lâminas
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const B = dmB(), P = dmPlan; if (!B || !P || !pl) return;
  if (Math.abs(wdx(B.cx - (x0 + w / 2))) > w / 2 + 40 || B.fy + P.J1 < y0 || B.fy + P.J0 > y0 + h) return;
  const X = dmCX(), Y = dmCY(), lit = dmFx.lit;
  if (lit > 0.05) {
    addL(X + P.mx, Y + P.my, 1.0 * lit);
    // a luz fria cai pela gruta: mais forte perto da Lua, fraca nas pontas
    for (let j = P.JT + 1; j <= 1; j += 2) for (let i = P.AI0 + (j & 1); i <= P.AI1; i += 2) {
      const k = dmK(i, j); if (k !== DK_A && k !== DK_E) continue;
      const d = Math.hypot(i - P.mi, (j - P.mj) * 0.8);
      addL(X + (i + 0.5) * T, Y + (j + 0.5) * T, lit * clamp(0.96 - d * 0.008, 0.7, 0.96));
    }
  }
  const E = dmBoss || (!dmState.dead ? dmIdleE : null);
  if (E && !E.hidden) addL(X + E.lx, Y + E.ly - 26, (E.ph >= 1 ? 0.55 : 0.8) * (dmBoss ? 1 : 0.8));
  for (const R of dmFx.raios) if (R.t >= 0 && R.t < 0.5) for (let y = R.top; y < R.g; y += 24) addL(X + R.x, Y + y, 0.85); else if (R.t < 0) addL(X + R.x, Y + R.g - 4, 0.45);
  for (const b of dmFx.laminas) addL(X + b.x, Y + b.y, 0.5);
  for (const A of dmFx.aneis) addL(X + A.x, Y + A.y, 0.4);
}; }

/* ---------- fora da luta: ela paira sobre o espelho, olhando a Lua ---------- */
function dmIdleReset() {
  const P = dmPlan; if (!P) return;
  Object.assign(dmIdleE, { lx: 0, ly: -1.6 * T, facing: 1, pose: 'idle', ph: 0, alpha: 1, tf: 0 });
}
function dmIdleTick(dt) {
  const E = dmIdleE; E.t += dt;
  E.ly = -1.6 * T + Math.sin(E.t * 1.4) * 2.5;
  const H = dmHero(); if (Math.abs(H.hx) < 30 * T && Math.abs(H.hx - E.lx) > 6) E.facing = H.hx > E.lx ? 1 : -1;
}

/* ---------- o turno: acordar, sair, a luta ---------- */
HOOK.update.push(dt => {
  dmBeamTick(dt);
  dmSound();
  const B = dmB(); if (!B || !dmPlan || !pl || state !== 'play') return;
  dmStakeTick(dt);
  // a Lua avermelha na fase 2 e volta branca no reinício
  dmFx.red = approach(dmFx.red, dmBoss && (dmBoss.ph >= 1 && (dmBoss.state !== 'fase2' || dmBoss.stateT0 > 0.5)) ? 1 : 0, dt * 0.9);
  if (dmState.dead) return;
  // um save velho ou um bloco posto deixou a sala diferente: volta para a semente (e o herói, se estava dentro, para a porta)
  if (!dmChecked && !bossFight) {
    dmChecked = true;
    if (dmDiffers()) {
      const D = dmPlan.doors[0];
      if (dmHeroIn(3) && D) { pl.x = dmCX() + (D.ii - D.side * 4 + 0.5) * T - pl.w / 2; pl.y = dmCY() + D.jf * T - pl.h - 0.01; pl.vx = pl.vy = 0; }
      dmWrite();
    }
  }
  if (!dmBoss) dmIdleTick(dt);
  if (!bossFight && !pl.dead && dmHeroIn(0)) dmStart();
  const e = dmBoss;
  if (!e || !dmFight()) return;
  if (!pl.dead && !dmHeroIn(3)) { endBossFight(false); return; }
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
  dmFxTick(dt);
});

/* ---------- som: um coro baixo e uma harpa de vidro; o pilar, as lâminas, os anéis, o eclipse ---------- */
const dmHum = { n: null };
function dmSound() {
  if (!ac || !noiseBuf) return;
  let want = 0, f = 440;
  const B = dmB();
  if (B && dmPlan && !dmState.dead && pl && !pl.dead && state === 'play') {
    const H = dmHero(), d = Math.abs(H.hx) / T;
    want = dmFight() ? 0.035 : d < 40 && H.hy > -30 * T && H.hy < 10 * T ? 0.025 * (1 - d / 40) : 0;
    const e = dmBoss;
    f = e && e.ph >= 1 ? 330 : 440;
    if (e && e.hidden) want *= 0.3;
    if (dmFx.lit < 0.3) want *= 0.4;
  }
  if (muted) want = 0;
  if (!dmHum.n) {
    if (want <= 0) return;
    const g = ac.createGain(); g.gain.value = 0;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const os = [1, 1.5, 2.005].map((m, k) => { const o = ac.createOscillator(); o.type = k ? 'sine' : 'triangle'; o.frequency.value = f * m; const og = ac.createGain(); og.gain.value = k === 2 ? 0.25 : k ? 0.5 : 0.7; o.connect(og); og.connect(lp); o.start(); return o; });
    const vib = ac.createOscillator(); vib.frequency.value = 4.2; const vg = ac.createGain(); vg.gain.value = 3; vib.connect(vg); for (const o of os) vg.connect(o.frequency); vib.start();
    lp.connect(g); g.connect(sfxOut);
    dmHum.n = { g, os, vib };
  }
  const N = dmHum.n, t = ac.currentTime;
  N.g.gain.setTargetAtTime(want, t, 0.6);
  [1, 1.5, 2.005].forEach((m, k) => N.os[k].frequency.setTargetAtTime(f * m * (k === 1 && f < 400 ? 0.944 : 1), t, 0.8));
}
const DM_HARPA = [659, 784, 880, 988, 1175, 1319, 1568];
Object.assign(sfx, {
  dmVeu(v = 1) { for (let k = 0; k < 5; k++) tone(DM_HARPA[k + 2], 0.5, 'sine', 0.02 * v, 0, k * 0.05); noise(0.6 * v, 0.03 * v, 4000, 'bandpass', 0, 4); },
  dmFase(v = 1) { tone(220, 1.6 * v, 'sine', 0.06, 110); tone(330, 1.4 * v, 'sine', 0.04, 165, 0.1); tone(110, 1.6 * v, 'triangle', 0.04, -20); for (let k = 0; k < 6; k++) tone(DM_HARPA[6 - k], 0.6, 'sine', 0.015, 0, 0.2 + k * 0.1); noise(1.2 * v, 0.04, 1200, 'bandpass', 0, 1); },
  dmErgue() { tone(880, 0.35, 'sine', 0.03, 440); tone(1320, 0.3, 'sine', 0.012, 660, 0.05); },
  dmMarca() { tone(1760, 0.8, 'sine', 0.012, -400); noise(0.8, 0.015, 6000, 'highpass'); },
  dmPilar() { tone(1320, 0.5, 'sine', 0.05, -900); tone(660, 0.6, 'triangle', 0.04, -300); noise(0.4, 0.09, 2400, 'bandpass', 0, 1.5); tone(110, 0.5, 'sine', 0.06, -40); },
  dmCarga() { for (let k = 0; k < 4; k++) tone(DM_HARPA[k], 0.4, 'sine', 0.02, 200, k * 0.12); },
  dmLaminas() { for (let k = 0; k < 3; k++) { tone(1568 - k * 200, 0.25, 'sine', 0.03, -500, k * 0.03); } noise(0.2, 0.05, 5000, 'highpass'); },
  dmToque(v = 1) { tone(2100, 0.12, 'sine', 0.025 * v, -900); noise(0.08, 0.04 * v, 5000, 'highpass'); },
  dmBrilho() { for (let k = 0; k < 5; k++) tone(DM_HARPA[6 - k], 0.25, 'sine', 0.015, 0, k * 0.06); },
  dmSome(v = 1) { tone(1400 * v, 0.2, 'sine', 0.03, 800); noise(0.15, 0.04, 6000, 'highpass'); },
  dmEncanto(k = 0) { if (!k) { tone(523, 0.6, 'sine', 0.03, 30); tone(784, 0.6, 'sine', 0.02, 45); } else for (let n = 0; n < 3; n++) tone(1047 + n * 262, 0.5, 'sine', 0.02, -100, n * 0.12); },
  dmPreso() { tone(392, 1.2, 'sine', 0.05, -60); tone(587, 1.0, 'sine', 0.03, -80, 0.05); tone(784, 0.8, 'sine', 0.02, -100, 0.1); },
  dmRaizes(k = 0) { if (!k) { tone(70, 0.6, 'sawtooth', 0.04, 20); noise(0.5, 0.06, 300, 'lowpass'); } else noise(0.7, 0.05, 500, 'bandpass', 0, 2); },
  dmFinca() { noise(0.15, 0.12, 400, 'lowpass'); tone(90, 0.2, 'triangle', 0.06, -40); },
  dmEclipse(k = 0) { if (k === 0) tone(440, 0.8, 'sine', 0.03, -220); else if (k === 1) { tone(110, 3, 'sine', 0.05, -30); noise(2.8, 0.03, 200, 'lowpass'); } else for (let n = 0; n < 4; n++) tone(DM_HARPA[n + 1], 0.5, 'sine', 0.02, 0, n * 0.08); },
  dmLagrima() { tone(1760, 0.25, 'sine', 0.03, -700); tone(2637, 0.15, 'sine', 0.012, -900, 0.03); },
  dmMorte() { tone(880, 2.6, 'sine', 0.05, -440); tone(1320, 2.2, 'sine', 0.025, -660, 0.1); for (let k = 0; k < 7; k++) tone(DM_HARPA[k], 0.7, 'sine', 0.02, 0, 0.6 + k * 0.14); noise(2.2, 0.05, 3000, 'bandpass', 0, 2); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.damaEspelho = { dead: dmState.dead };
  // o véu e as raízes fincadas nunca vão para o save
  if (o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([idx, t]) => t !== EL_BARREIRA && !(dmPlan && dmB() && dmInBox(idx % WW, (idx / WW) | 0) && t === EL_RAIZ && dmFx.stakes.has(idx)));
  return o;
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.dm) bossFight = null;
  dmBoss = null; dmPlan = null; dmChecked = false; dmClear(); dmFx.stakes.clear(); dmFx.beams.length = 0; dmFx.red = 0; dmFx.lit = 1;
  dmState.dead = !!(sv && sv.damaEspelho && sv.damaEspelho.dead);   // antes da geração: elDress lê
  return _nw(sd, sv);
}; }
