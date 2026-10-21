'use strict';

/* ================= O Leviatã: o chefe do Mar Sem Sol =================
   A Nau Sem Nome (docs/camadas/10-mar-sem-sol.md, seção 7). O 265 reserva o mar aberto do Leviatã (msBoss: 140 de
   largura em volta de cx, o fundo plano em fy = nível + 48, o nível do mar em sl) e chama msDress logo depois de
   encher a água; este arquivo escreve o naufrágio dentro dele:
   - a proa, fixa, presa num pináculo de recife que sobe do fundo: o convés em sl - 2 (4 acima da água na maré baixa,
     1 abaixo na alta), o castelo de proa 3 acima, o toco do mastro de vante, o corte partido de trás com tábuas
     faltando, e duas Correntes de Âncora (MS_CORRENTE) da proa e do corte até o fundo (escalam; seguram contra o
     redemoinho). Isso é bloco (lvPlan), entra no msKeep e é reescrito pelo plano a cada reinício.
   - a meia-nau (boia, sobe e desce com a maré), a popa (boia de lado) e 6 destroços menores (tábuas, barris, um pedaço
     de mastro): não são blocos, são objetos que boiam (lvFloats), desenhados de sprites guardados e pisáveis por
     cima (o moveEntity do herói: plataforma de mão única que carrega quem está em cima).
   A maré é a água de verdade: sobe e desce 3 fileiras para cada lado do nível dentro das Ondas Paradas, uma fileira
   por vez (no máximo umas 137 células reescritas a cada passo, raro). Fora da luta ela fica na média.
   Pisar no convés da proa acorda o Leviatã; duas Ondas Paradas (MS_BARREIRA, 3 de largura) sobem do fundo até 12
   acima do nível, a 70 colunas do centro de cada lado. Durante a luta nada dentro do mar quebra; fora dela, a proa
   não quebra enquanto ele vive. Morrer, portal ou teleporte (sair do mar) reinicia: a maré volta ao meio, a barreira
   desce, a proa é reescrita pelo plano, os destroços voltam ao lugar da semente e ele volta com a vida cheia.
   O Leviatã: uma serpente de uns 40 blocos, cabeça de 5 x 4 (o inimigo `leviata`, a barra de chefe) e 8 segmentos
   (`lv_seg`, inimigos que só existem perto da tela: batem-se neles com 30% do dano, que vai para a cabeça). O corpo
   segue o caminho da cabeça (uma trilha de pontos) e é desenhado como discos guardados por raio. Todo aviso é na
   água: bolhas, a sombra escura subindo e a água estufando onde ele vai sair.
     1. (100% a 60%, maré de 40 s) Bote: sombra e bolhas 1,2 s, sai em arco, morde (100%) e mergulha do outro lado
        com uma onda que balança os destroços. Rabada: a ponta da cauda sobe ao longe 1 s, bate, e uma onda corre
        pela superfície (50%) e derruba quem está baixo; pular ou estar num destroço alto escapa. Depois de 2 botes
        ele apoia a cabeça no convés da proa por 2 s, cansado: os olhos levam o dobro.
     2. (60%, maré de 24 s) nada raso e o corpo sai em arcos; Tromba-d'água (espuma sob o herói 0,8 s; a coluna o joga
        6 blocos para cima, 60%), Redemoinho (a água gira 1,5 s com som de ralo; puxa o herói e os destroços para a
        boca; segurar numa corrente ou nadar para fora escapa; na boca, 150%). Chama 2 Tubarões-Cegos uma vez.
     3. (25%, maré alta parada) quebra a meia-nau em destroços e puxa a popa para o fundo. Ataque por baixo (o
        destroço treme e solta bolhas 1 s; ele atravessa vindo do fundo, 120%), Jato abissal (a garganta acende 1 s;
        um jato varre a superfície de um lado ao outro, 80% por toque), Apagar (engole o plâncton: por 8 s a luz do
        mar cai à metade, só os olhos dele brilham: um véu preto de 50% por cima da luz, no drawGlow, e os olhos
        desenhados depois dele).
   Solta a Pérola do Leviatã (acessório lendário, nível 23: fôlego dobrado, nado 30% mais rápido, +vida, uma onda
   que empurra os inimigos uma vez a cada 30 s ao cair abaixo de 30% de vida; luz azul fraca) e, na primeira
   vitória, uma das três bases da camada (267). A morte fica salva (leviata.dead); depois dela a nau fica parada
   na maré média. Os efeitos de nado e fôlego embrulham funções do 172, que carrega depois: msPerolaWraps() é
   chamada pelo 269.
   Carrega depois do 265 e do 256, antes do 49 (que escala ET). Prefixo `lv`. */

const LVQ_L = layerBossLvl('mar');
const LVQ = { hp: Math.round(330 * (1 + 0.3 * (LVQ_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (LVQ_L - 1))), xp: 600, p2: 0.6, p3: 0.25, mare1: 40, mare2: 24, amp: 3, seg: 0.3, apagar: 8, apagarCada: 20, len: 420 };
const lvState = { dead: false };
ET.leviata = { name: 'O Leviatã', w: 46, h: 38, hp: LVQ.hp, dmg: LVQ.dmg, xp: LVQ.xp, kb: 0, fly: true, phase: true, blood: '#2a4a48', boss: true };
ET.lv_seg = { name: 'O Leviatã', w: 24, h: 24, hp: 99999, dmg: 1, xp: 0, kb: 0, fly: true, phase: true, blood: '#2a4a48', boss: true };
const LVQ_DROPS = [['perola_leviata', 1], ['escama_abissal', 1, 6, 10], ['perola_negra', 1, 2, 3], ['min_oricalco', 1, 8, 14], ['barra_oricalco', 1, 2, 3], ['pocao', 1, 2, 4]];
const LVQ_BASES = ['tridente_escamado', 'cutelo_abordagem', 'escudo_carapaca'];
const lvDrops = () => { DROPS.leviata = LVQ_DROPS.filter(([id]) => ITEMS[id]); DROPS.lv_seg = []; };
lvDrops();
let lvBoss = null, lvPlan = null, lvChecked = false, lvAllow = false, lvFloats = [];
const lvSegs = [], lvBodyPts = [];
const lvFx = { ondas: [], trombas: [], red: null, jato: null, cauda: null, dark: 0, darkT: 0, ring: null, bar: null };
const lvTide = { f: 0, row: 0, t: 0, cd: 0, snap: null };
const lvBody = { px: [], py: [] };

/* ---------- geometria (i, j em blocos a partir de cx e do nível do mar; px locais a partir do canto de cima à
   esquerda da célula (cx, sl)) ---------- */
const LV_IN = 68, LV_X = 62 * T, LV_FUNDO = 45 * T;
const lvB = () => (typeof msBoss !== 'undefined' && msBoss) ? msBoss : null;
const lvLap = x => { if (!pl) return x; const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
const lvCX = () => lvLap(lvB().cx * T), lvCY = () => lvB().sl * T;
const lvIdx = (i, j) => { const B = lvB(); return (B.sl + j) * WW + wrapX(B.cx + i); };
const lvFight = () => !!(bossFight && bossFight.lv);
const lvS = () => lvTide.f * T + 2;                         // a superfície (px locais), suave
const lvClampX = x => clamp(x, -LV_X, LV_X);
const lvRad = s => 15 * (1 - 0.72 * Math.pow(Math.min(1, s / LVQ.len), 1.2));
function lvHero() { const hx = pl.x + pl.w / 2 - lvCX(), hy = pl.y + pl.h - lvCY(); return { hx, hy, cy: hy - pl.h / 2 }; }
function lvHeroIn(m = 0) { const B = lvB(), H = lvHero(); return Math.abs(H.hx) <= (B.w / 2 + m) * T && H.hy >= (B.top - B.sl - m) * T && H.hy <= (B.fy - B.sl + m) * T; }
function lvNear() { const B = lvB(); if (!B || !pl) return false; return Math.abs(wdx(B.cx - Math.floor((pl.x + pl.w / 2) / T))) < B.w / 2 + 50 && Math.abs((pl.y + pl.h / 2) / T - B.sl) < 90; }
function lvDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
const lvWet = (idx, v) => { if (!agua.length) return; agua[idx] = v; if (aguaN.length) { aguaN[idx] = v ? 8 : 0; aguaK[idx] = v; } };

/* ---------- o plano da proa (a semente: o que msDress escreve e o que o reinício devolve) ---------- */
function lvLayout() {
  const cells = [], map = new Map(), deck = new Set(), R = (a, b, s) => hash2(a, b, seed ^ s);
  const put = (i, j, t, w) => { const idx = lvIdx(i, j); let c = map.get(idx); if (!c) { c = { idx, i, j, t, w }; map.set(idx, c); cells.push(c); } else { c.t = t; if (w != null) c.w = w; } };
  // o casco: o convés em -2, o castelo de proa em -5, a roda de proa subindo até -9; o fundo em 5, subindo na proa
  const topJ = i => i <= 6 ? -2 : i <= 13 ? -5 : i === 14 ? -6 : i === 15 ? -7 : -9;
  const botJ = i => i <= 8 ? 5 : i <= 10 ? 4 : i <= 12 ? 3 : i === 13 ? 2 : i === 14 ? 1 : i === 15 ? -1 : -5;
  const iMin = j => j === -2 || j === 5 ? -7 : -7 + Math.floor(R(j, 1, 0x7a01) * 3);   // o corte partido, irregular
  const inside = (i, j) => i >= iMin(j) && i <= 16 && j >= topJ(i) && j <= botJ(i);
  for (let i = -7; i <= 16; i++) for (let j = -9; j <= 5; j++) {
    if (!inside(i, j)) continue;
    const edge = !inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || !inside(i, j + 1);
    if (!edge) { put(i, j, AIR, WMS_CASCO); continue; }
    const top = !inside(i, j - 1);
    if (!inside(i - 1, j) && !top && j !== botJ(i) && R(i, j, 0x7a02) < 0.18) { put(i, j, AIR, WMS_CASCO); continue; }   // tábua que falta no corte
    put(i, j, top && i <= 13 ? MS_CONVES : MS_CASCO, WMS_CASCO);
    if (top && i <= 13) deck.add(lvIdx(i, j));
  }
  for (let j = -9; j <= -6; j++) put(10, j, MS_CASCO, WMS_CASCO);   // o toco do mastro de vante
  // o pináculo de recife: sobe do fundo até o casco, mais largo embaixo, miolo de rocha, coral na beira
  const ic = 2.5;
  for (let j = 5; j <= 47; j++) {
    const k = (j - 5) / 42, hw = 2.6 + k * k * 7 + Math.sin(j * 0.55 + 1) * 0.5 + (R(j, 2, 0x7a03) - 0.5) * 0.8;
    for (let i = Math.floor(ic - hw - 1); i <= Math.ceil(ic + hw + 1); i++) {
      const d = Math.abs(i + 0.5 - ic); if (d > hw || inside(i, j)) continue;
      put(i, j, d < hw * 0.62 ? MS_ROCHA : d > hw - 1.2 && R(i, j, 0x7a04) < 0.08 ? MS_CORAL : MS_RECIFE, WMS_RECIFE);
    }
  }
  // as correntes de âncora: da roda de proa e do corte, até o fundo (ou o recife)
  for (const [ci, j0] of [[17, -4], [-8, -1]]) for (let j = j0; j <= 47; j++) { const c = map.get(lvIdx(ci, j)); if (c && SOLID[c.t]) break; put(ci, j, MS_CORRENTE, null); }
  return { cells, map, deck };
}
// grava o plano (gen: durante a geração, sem sujar chunks nem mexer em diffs)
function lvWrite(gen) {
  const P = lvPlan; if (!P) return;
  for (const c of P.cells) {
    const idx = c.idx;
    if (tiles[idx] !== c.t || (c.w != null && walls[idx] !== c.w)) { tiles[idx] = c.t; if (c.w != null) walls[idx] = c.w; if (!gen) markDirty(idx % WW, (idx / WW) | 0); }
    if (SOLID[c.t]) lvWet(idx, 0);
    else if (!gen && c.j >= 0 && !agua[idx]) lvWet(idx, AGUA_LIMPA);
    if (!gen) diffs.delete(idx);
  }
  if (!gen) mapVer++;
}
const lvDiffers = () => lvPlan.cells.some(c => tiles[c.idx] !== c.t);

/* ---------- a maré: as fileiras -3 a 3 dentro das Ondas Paradas; a cópia da água de baixo guarda o plâncton ---------- */
function lvSnap() {
  const S = new Uint8Array(4 * (2 * LV_IN + 1));
  for (let j = 0; j < 4; j++) for (let i = -LV_IN; i <= LV_IN; i++) S[j * (2 * LV_IN + 1) + i + LV_IN] = agua.length ? agua[lvIdx(i, j)] : 0;
  lvTide.snap = S;
}
function lvTideRow(j, wet) {
  if (!agua.length || !lvTide.snap) return;
  const N = 2 * LV_IN + 1;
  for (let i = -LV_IN; i <= LV_IN; i++) {
    const idx = lvIdx(i, j); if (SOLID[tiles[idx]]) continue;
    let v = 0;
    if (wet) { const s = lvTide.snap[Math.max(0, Math.min(3, j)) * N + i + LV_IN]; v = j >= 0 ? (s && s !== AGUA_RESPIRO ? s : AGUA_LIMPA) : (s === AGUA_PLANCTON ? AGUA_PLANCTON : AGUA_LIMPA); }
    lvWet(idx, v);
  }
}
function lvTideReset() { for (let j = -LVQ.amp; j <= LVQ.amp; j++) lvTideRow(j, j >= 0); lvTide.row = 0; lvTide.f = 0; lvTide.t = 0; }
function lvTideTick(dt) {
  const e = lvBoss; let goal = 0;
  if (e && lvFight() && e.state !== 'intro') { lvTide.t += dt; goal = e.ph >= 2 ? -LVQ.amp : LVQ.amp * Math.sin(lvTide.t * 2 * Math.PI / (e.ph ? LVQ.mare2 : LVQ.mare1)); }
  lvTide.f = approach(lvTide.f, goal, dt * 0.9);
  const want = Math.round(lvTide.f); lvTide.cd -= dt;
  if (want !== lvTide.row && lvTide.cd <= 0) {
    lvTide.cd = 0.12;
    if (want < lvTide.row) { lvTide.row--; lvTideRow(lvTide.row, true); } else { lvTideRow(lvTide.row, false); lvTide.row++; }
  }
}

/* ---------- o que boia: a meia-nau, a popa, os destroços (e os dois pedaços da meia-nau quebrada da fase 3) ---------- */
const LV_FLOATS = [
  { k: 'meia', i: -31, w: 18, fb: 20 }, { k: 'popa', i: -51, w: 13, fb: 24 },
  { k: 'tabuas', i: -63, w: 4, fb: 7 }, { k: 'barril', i: 20, w: 3, fb: 10 }, { k: 'tabuas', i: 28, w: 5, fb: 7 },
  { k: 'mastro', i: 38, w: 5, fb: 6 }, { k: 'barril', i: 48, w: 3, fb: 10 }, { k: 'tabuas', i: 57, w: 4, fb: 7 },
  { k: 'tabuas', i: -30, w: 5, fb: 7, extra: true }, { k: 'mastro', i: -21, w: 5, fb: 6, extra: true }
];
const lvTop = f => f.wy + f.dy - f.fb;
function lvFloatsInit() { lvFloats = LV_FLOATS.map((d, n) => Object.assign({}, d, { hx: d.i * T, seed: n * 1.7 + 0.3 })); lvFloatsReset(); }
function lvFloatsReset() {
  for (const f of lvFloats) Object.assign(f, { x: f.hx, wy: lvS(), dy: 0, vdy: 0, vx: 0, shake: 0, sinkT: -1, dxF: 0, alive: !f.extra });
  if (pl) pl.lvOn = null;
}
function lvFloatsTick(dt) {
  const still = lvState.dead && !lvFight(), S = lvS();
  for (const f of lvFloats) {
    if (!f.alive) continue;
    const x0 = f.x;
    if (f.sinkT >= 0) {
      f.sinkT += dt; f.dy += dt * (16 + f.sinkT * 30);
      if (Math.random() < dt * 14) lvBubble(f.x + rnd(0, f.w * T), lvTop(f) + rnd(0, 30));
      if (f.sinkT > 3.4) { f.alive = false; if (pl.lvOn === f) pl.lvOn = null; }
    } else {
      f.wy = S + (still ? 0 : Math.sin(gameTime * 1.3 + f.seed) * 1.2);
      f.vdy += (-f.dy * 28 - f.vdy * 3.2) * dt; f.dy += f.vdy * dt;
      f.vx += ((f.hx - f.x) * 0.3 - f.vx * 1.1) * dt;
      f.x = clamp(f.x + f.vx * dt, -LV_IN * T, (LV_IN + 1 - f.w) * T);
      f.shake = Math.max(0, f.shake - dt);
    }
    f.dxF = f.x - x0;
  }
}
// uma onda que passa: os destroços em volta pulam
function lvKick(x, r, v) { for (const f of lvFloats) { if (!f.alive || f.sinkT >= 0) continue; const d = Math.abs(f.x + f.w * T / 2 - x); if (d < r) f.vdy -= v * (1 - d / r); } }
// o herói pisa nos destroços (plataforma de mão única) e é levado por eles
{ const _me = moveEntity; moveEntity = function (e, dt, step) {
  if (e !== pl || !lvFloats.length || !lvB() || !lvNear()) return _me(e, dt, step);
  const F = pl.lvOn;
  if (F && F.alive && pl.vy >= 0 && !pl.climb) { pl.x += F.dxF; F.dxF = 0; pl.y = lvCY() + lvTop(F) - pl.h; }
  const b0 = pl.y + pl.h;
  _me(e, dt, step);
  pl.lvOn = null;
  if (pl.vy < 0 || pl.climb || pl.dead) return;
  const cx = lvCX(), cy = lvCY(), b1 = pl.y + pl.h;
  for (const f of lvFloats) {
    if (!f.alive) continue;
    const pad = f.k === 'popa' ? f.w * T * 0.18 : 3, L = cx + f.x + pad, Rr = cx + f.x + f.w * T - pad;
    if (pl.x + pl.w <= L || pl.x >= Rr) continue;
    const top = cy + lvTop(f);
    if (b0 <= top + 3 && b1 >= top - 0.5 && !rectSolid(pl.x, top - pl.h, pl.w, pl.h)) { pl.y = top - pl.h; pl.vy = 0; pl.onGround = true; pl.lvOn = f; break; }
  }
}; }

/* ---------- a construção (o 265 chama msDress logo depois de encher a água) ---------- */
function msDress() {
  if (!lvB()) return;
  lvPlan = lvLayout();
  lvWrite(true);
  for (const c of lvPlan.cells) msKeep.add(c.idx);
  lvSnap(); lvTide.f = 0; lvTide.row = 0;
  lvFloatsInit();
}

/* ---------- as Ondas Paradas: sobem do fundo até 12 acima do nível, 3 de largura, a 70 do centro ---------- */
function lvBarOn() {
  const cells = [];
  for (let j = 47; j >= -12; j--) for (const side of [-1, 1]) for (let d = -1; d <= 1; d++) cells.push([70 * side + d, j]);
  lvFx.bar = { cells, n: 0, t: 0, put: [] };
  sfx.lvOnda();
}
function lvBarTick(dt) {
  const Bb = lvFx.bar; if (!Bb || Bb.n >= Bb.cells.length) return;
  Bb.t += dt;
  const cx = lvCX(), cy = lvCY();
  while (Bb.n < Bb.cells.length && Bb.n < Bb.t * 320) {
    const [i, j] = Bb.cells[Bb.n], idx = lvIdx(i, j);
    if (!pl.dead && overlap({ x: cx + i * T, y: cy + j * T, w: T, h: T }, pl)) break;
    Bb.n++;
    if (SOLID[tiles[idx]]) continue;
    tiles[idx] = MS_BARREIRA; lvWet(idx, 0); markDirty(idx % WW, (idx / WW) | 0); Bb.put.push([idx, j]);
    if ((Bb.n % 9) === 0) burst(cx + (i + 0.5) * T, cy + (j + 0.5) * T, 3, MS_COL.espuma, 40, -20, 0.6, 1, true);
  }
  mapVer++;
}
function lvBarOff() {
  const Bb = lvFx.bar; if (!Bb) return;
  for (const [idx, j] of Bb.put) {
    if (tiles[idx] === MS_BARREIRA) { tiles[idx] = AIR; markDirty(idx % WW, (idx / WW) | 0); }
    diffs.delete(idx);
    if (!SOLID[tiles[idx]]) lvWet(idx, j >= 0 ? AGUA_LIMPA : 0);
  }
  lvFx.bar = null; mapVer++;
}

/* ---------- a luta ---------- */
function lvSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; e.stateT0 = 0; }
function lvStart() {
  lvDrops();
  const D = ET.leviata, S = lvS();
  const e = spawnEnemy('leviata', lvCX() + 24 * T - D.w / 2, lvCY() + S + 12 * T - D.h / 2, -1);
  Object.assign(e, { boss: true, lvl: LVQ_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, cd: 1, ph: 0, lx: 24 * T, ly: S + 12 * T, ang: -Math.PI / 2, pose: 'shut', botes: 0, last: '', rep: 0, redT: 0, apT: 5, sumDone: false, faceGoal: null, above: false, roared: false, broke: false, sank: false });
  lvSet(e, 'intro', 3.0);
  lvBoss = e; bossFight = { e, lv: true };
  lvTrailInit(e, -0.55, -0.83);
  lvClear(); lvBarOn(); lvTide.t = 0;
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Leviatã'; bn.lastChild.textContent = 'o que dorme debaixo da Nau Sem Nome'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Leviatã', 'o que dorme debaixo da Nau Sem Nome');
  shake(2);
}
function lvClear() { lvFx.ondas.length = 0; lvFx.trombas.length = 0; lvFx.red = null; lvFx.jato = null; lvFx.cauda = null; lvFx.darkT = 0; }
function lvEnd(won) {
  const e = lvBoss; lvBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) if ((m.lvMinion || m.lvSeg) && !m.dead) { if (m.lvMinion) burst(m.x + m.w / 2, m.y + m.h / 2, 10, '#0c1c24', 60, -20, 0.8); lvDrop(m); }
  lvSegs.length = 0;
  // o mar volta: a maré no meio, a barreira desce, a proa pelo plano, os destroços no lugar da semente
  lvClear(); lvTideReset(); lvBarOff(); lvWrite(false); lvFloatsReset();
  if (!won) { if (e) lvDrop(e); return; }
  lvState.dead = true;
  const [x, y] = lvEnd.at || [lvCX(), lvCY() - 3 * T];
  burst(x, y, 30, '#e0f4ff', 130, 40, 1.1, 1, true); burst(x, y, 24, MS_COL.ciano, 100, -40, 1.2, 1, true); burst(x, y, 20, '#0c1c24', 120, 200, 1.2);
  lvSplash(x - lvCX(), 400);
  // na primeira vitória: uma das três bases da camada, no convés da proa
  const bases = LVQ_BASES.filter(id => ITEMS[id]);
  if (bases.length) { const dx = lvCX() + 0.5 * T, dy = lvCY() - 4 * T; dropGear(dx, dy, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(dx / T), Math.floor(dy / T))); }
  sfx.lvMorte();
  showBanner('Vitória', 'o mar volta a dormir');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.lv) return lvEnd(won); return _eb(won); }; }
// cada fase é vivida: o golpe só leva até o piso da fase
const lvFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * LVQ.p2) : e.ph === 1 ? Math.floor(e.maxHp * LVQ.p3) : 0;
const lvInvuln = e => e.state === 'intro' || e.state === 'fase2' || e.state === 'fase3';
function lvFloor(e) { const f = lvFloorHp(e); if (f > 0 && e.hp < f) e.hp = f; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.lvSeg) { e.hp = e.maxHp; return; }
  if (e && e.type === 'leviata' && !e.dead) {
    const f = lvFloorHp(e); if (f > 0) { e.hp = f; return; }
    // o que ele solta cai no convés da proa, não no fundo do mar
    lvDrops(); lvEnd.at = [e.x + e.w / 2, e.y + e.h / 2];
    e.x = lvCX() + 0.5 * T - e.w / 2; e.y = lvCY() - 4 * T - e.h;
  }
  return _k(e);
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee) {
  if (e && e.lvSeg) {
    const b = lvBoss;
    if (!b || b.dead || lvInvuln(b)) { burst(e.x + e.w / 2, e.y + e.h / 2, 4, MS_COL.espuma, 40, 0, 0.3, 1, true); return; }
    const hp0 = e.hp, r = _hit(e, dir, mult * LVQ.seg, melee), d = hp0 - e.hp;
    e.hp = e.maxHp; e.showHp = 0;
    if (d > 0) { b.hp -= d; b.flash = 0.1; lvFloor(b); if (b.hp <= 0) killEnemy(b); }
    return r;
  }
  if (e && e.type === 'leviata' && !e.dead) {
    if (lvInvuln(e)) { burst(e.x + e.w / 2, e.y + e.h / 2, 4, MS_COL.espuma, 40, 0, 0.3, 1, true); return; }
    if (e.state === 'cansado') mult *= 2;   // a cabeça no convés: os olhos levam o dobro
  }
  const r = _hit(e, dir, mult, melee);
  if (e && e.type === 'leviata') lvFloor(e);
  return r;
}; }
// nada do mar quebra durante a luta; a proa não quebra enquanto ele vive
function lvGuard(tx, ty) {
  if (!lvB() || !lvPlan) return false;
  if (lvFight() && inMsHall(wrapX(tx), ty, 3)) return true;
  return !lvState.dead && lvPlan.map.has(ty * WW + wrapX(tx));
}
{ const _bt = breakTile; breakTile = function (tx, ty) { if (!lvAllow && lvGuard(tx, ty)) return; return _bt(tx, ty); }; }
{ const _pi = pickImpact; pickImpact = function (sx, sy, aim) {
  const tg = pl.target;
  if (tg && tg.inReach && lvGuard(tg.tx, tg.ty) && SOLID[tileAt(tg.tx, tg.ty)]) {
    sfx.tink(); burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 3, '#8a7058', 40, 300, 0.3);
    pl.target = Object.assign({}, tg, { dig: false });
    try { _pi(sx, sy, aim); } finally { pl.target = tg; }
    pl.digT = 0; pl.digX = -1;
    return;
  }
  return _pi(sx, sy, aim);
}; }

/* ---------- o corpo: a trilha da cabeça ---------- */
function lvTrailInit(e, ux, uy) {
  const P = lvBody; P.px.length = P.py.length = 0;
  for (let s = 4; s <= LVQ.len + 40; s += 4) { P.px.push(e.lx - ux * s); P.py.push(Math.min(LV_FUNDO + 2 * T, e.ly - uy * s)); }
}
function lvTrailPush(x, y) {
  const P = lvBody; if (!P.px.length) { P.px.push(x); P.py.push(y); return; }
  if (Math.hypot(x - P.px[0], y - P.py[0]) < 4) return;
  P.px.unshift(x); P.py.unshift(y);
  let L = Math.hypot(x - P.px[0], y - P.py[0]);
  for (let k = 1; k < P.px.length; k++) { L += Math.hypot(P.px[k] - P.px[k - 1], P.py[k] - P.py[k - 1]); if (L > LVQ.len + 40) { P.px.length = P.py.length = k + 1; break; } }
}
// percorre o corpo da cabeça para a cauda: cb(s, x, y, ux, uy) a cada `step` px de s0 a s1 (u aponta para a cauda)
function lvWalk(e, s0, s1, step, cb) {
  const P = lvBody; let ax = e.lx, ay = e.ly, acc = 0, s = s0, k = 0, ux = 0, uy = 1;
  while (s <= s1) {
    if (k >= P.px.length) { cb(s, ax + ux * (s - acc), ay + uy * (s - acc), ux, uy); s += step; continue; }
    const bx = P.px[k], by = P.py[k], L = Math.hypot(bx - ax, by - ay);
    if (L > 0.001) { ux = (bx - ax) / L; uy = (by - ay) / L; }
    if (acc + L >= s) { const q = (s - acc); cb(s, ax + ux * q, ay + uy * q, ux, uy); s += step; continue; }
    acc += L; ax = bx; ay = by; k++;
  }
}
// os 8 segmentos: inimigos que só existem perto da tela, no lugar do corpo
function lvSegSync(e) {
  const cx = lvCX(), cy = lvCY(), px = pl.x + pl.w / 2, py = pl.y + pl.h / 2;
  let k = 0;
  lvWalk(e, 30, 30 + 7 * 50, 50, (s, x, y) => {
    const sz = Math.max(10, Math.round(lvRad(s) * 1.8)), X = cx + x, Y = cy + y;
    let m = lvSegs[k];
    if (m && m.dead) m = lvSegs[k] = null;
    if (Math.abs(X - px) > VW * 1.1 || Math.abs(Y - py) > VH * 1.3) { if (m) { lvDrop(m); lvSegs[k] = null; } k++; return; }
    if (!m) { m = spawnEnemy('lv_seg', X - sz / 2, Y - sz / 2, -1); Object.assign(m, { lvSeg: true, k, lvl: LVQ_L, hp: 999999, maxHp: 999999, xp: 0, gold: 0 }); lvSegs[k] = m; }
    m.w = m.h = sz; m.x = X - sz / 2; m.y = Y - sz / 2; m.vx = m.vy = 0;
    k++;
  });
}
AI.lv_seg = e => { e.vx = e.vy = 0; if (!lvBoss || !lvSegs.includes(e)) e.dead = true; };

/* ---------- a cabeça: o ângulo (13 desenhos de -90 a 90 graus, espelhados para a esquerda) ---------- */
const lvNorm = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const lvTurn = (a, g, k) => { const d = lvNorm(g - a); return lvNorm(a + clamp(d, -k, k)); };
function lvAngQ(ang) {
  const a = lvNorm(ang), mir = Math.cos(a) < 0, a2 = clamp(lvNorm(mir ? Math.PI - a : a), -Math.PI / 2, Math.PI / 2);
  const q = Math.round((a2 + Math.PI / 2) / (Math.PI / 12));
  return { mir, q, qa: q * Math.PI / 12 - Math.PI / 2 };
}
// um ponto do desenho da cabeça (ox, oy a partir do pivô) em px locais
function lvHeadPt(e, ox, oy) { const { mir, qa } = lvAngQ(e.ang), c = Math.cos(qa), s = Math.sin(qa), rx = ox * c - oy * s, ry = ox * s + oy * c; return [e.lx + (mir ? -rx : rx), e.ly + ry]; }
const lvMouth = e => lvHeadPt(e, 30, 5);

/* ---------- o cérebro ---------- */
AI.leviata = function (e, dt) {
  if (!lvB() || !lvPlan) { e.dead = true; return; }
  const ox = e.lx, oy = e.ly;
  lvBrain(e, dt);
  e.ly = Math.min(e.ly, LV_FUNDO); e.lx = clamp(e.lx, -(LV_IN - 3) * T, (LV_IN - 3) * T);
  const mx = e.lx - ox, my = e.ly - oy, sp = dt > 0 ? Math.hypot(mx, my) / dt : 0;
  if (e.faceGoal != null) e.ang = lvTurn(e.ang, e.faceGoal, dt * 5);
  else if (sp > 12) e.ang = lvTurn(e.ang, Math.atan2(my, mx), dt * 7);
  const above = e.ly < lvS(); if (above !== e.above) { e.above = above; if (sp > 60) { lvSplash(e.lx, sp); if (!above) lvKick(e.lx, 10 * T, 90); } }
  const [hx, hy] = lvHeadPt(e, 10, 3);
  e.x = lvCX() + hx - e.w / 2; e.y = lvCY() + hy - e.h / 2; e.vx = e.vy = 0;
  lvTrailPush(e.lx, e.ly);
  lvSegSync(e);
};
function lvGo(e, x, y, sp, dt) { const dx = x - e.lx, dy = y - e.ly, L = Math.hypot(dx, dy); if (L < 0.01) return L; const v = Math.min(L, sp * dt); e.lx += dx / L * v; e.ly += dy / L * v; return L; }
// chega a tempo: o aviso tem hora marcada, então ele nada o que for preciso para estar lá quando o aviso acaba
function lvGoBy(e, x, y, sp, dt) { const L = Math.hypot(x - e.lx, y - e.ly); return lvGo(e, x, y, Math.max(sp, L / Math.max(0.12, e.stateT - 0.15)), dt); }
function lvPick(e, list) {
  let tot = 0; for (const [, w] of list) tot += w;
  for (let n = 0; n < 4; n++) {
    let r = Math.random() * tot, k = list[0][0]; for (const [s, w] of list) { if (w > 0 && r < w) { k = s; break; } r -= w; }
    if (k === e.last && e.rep >= 1 && list.filter(q => q[1] > 0).length > 1) continue;
    e.rep = k === e.last ? e.rep + 1 : 0; e.last = k; return k;
  }
  return list[0][0];
}
const lvCd = e => e.ph === 0 ? 1.4 + Math.random() * 0.7 : e.ph === 1 ? 1.0 + Math.random() * 0.6 : 0.8 + Math.random() * 0.5;
// a mordida: a cabeça encosta no herói
function lvBite(e, k) { if (pl.dead || !overlap(e, pl)) return false; hurtPlayer(Math.round(e.dmg * k), e.x + e.w / 2, null, false); return true; }
function lvAbort(e) { lvFx.red = null; lvFx.jato = null; lvFx.cauda = null; lvFx.trombas.length = 0; if (e.af) e.af.shake = 0; e.af = null; }
function lvBrain(e, dt) {
  e.stateT -= dt; e.stateT0 += dt; e.cd -= dt; e.redT -= dt; e.apT -= dt;
  const H = lvHero(), S = lvS();
  if (!lvInvuln(e)) {
    if (e.ph === 0 && e.hp <= e.maxHp * LVQ.p2) { e.ph = 1; lvAbort(e); lvSet(e, 'fase2', 2.8); sfx.lvRugido(0.6); return; }
    if (e.ph === 1 && e.hp <= e.maxHp * LVQ.p3) { e.ph = 2; lvAbort(e); lvSet(e, 'fase3', 3.6); sfx.lvRugido(0.6); return; }
  }
  e.faceGoal = null; e.pose = 'shut';
  switch (e.state) {
    case 'intro': {
      const t = e.stateT0;
      if (t < 1.5) lvGo(e, 24 * T, S - 4 * T, 190, dt);
      else if (t < 2.3) {
        e.pose = 'open'; e.faceGoal = H.hx < e.lx ? Math.PI * 0.92 : -0.08;
        if (!e.roared) { e.roared = true; sfx.lvRugido(1); shake(5); }
      } else lvGo(e, 10 * T, S + 9 * T, 240, dt);
      if (e.stateT <= 0) { lvSet(e, 'nada', 0); e.cd = 1.0; }
      break;
    }
    case 'nada': {
      if (e.ph === 1) lvGo(e, Math.sin(e.t * 0.28) * 46 * T, S + 1.6 * T + Math.sin(e.t * 1.7) * 2.6 * T, 170, dt);   // rente, o corpo saindo em arcos
      else lvGo(e, lvClampX(H.hx * 0.5 + Math.sin(e.t * 0.45) * 26 * T), S + 13 * T + Math.sin(e.t * 0.9) * 2 * T, 120, dt);
      if (e.cd > 0) break;
      if (e.ph === 0 && e.botes >= 2) { e.botes = 0; lvSet(e, 'deckVai', 2.2); break; }
      let k;
      if (e.ph === 0) k = lvPick(e, [['bote', 0.62], ['rabada', 0.38]]);
      else if (e.ph === 1) k = lvPick(e, [['bote', 0.26], ['tromba', 0.3], ['redemoinho', e.redT <= 0 ? 0.26 : 0], ['rabada', 0.18]]);
      else k = lvPick(e, [['bote', 0.22], ['baixo', 0.34], ['jato', 0.26], ['apagar', e.apT <= 0 ? 0.6 : 0]]);
      lvBegin(e, k, H);
      break;
    }
    /* ----- Bote ----- */
    case 'boteTell': {
      const k = e.stateT0 / e.stateMax;
      lvGoBy(e, e.ax - e.adir * 7.5 * T, S + (5.5 - 2 * k) * T, 220, dt);
      if (e.stateT <= 0) { lvSet(e, 'bote', 1.05); e.a0x = e.lx; e.a0y = e.ly; e.apex = clamp(Math.min(H.cy, S - 3 * T), S - 10 * T, S - 2 * T); e.hit = false; sfx.lvEmerge(); }
      break;
    }
    case 'bote': {
      const u = Math.min(1, e.stateT0 / 1.05), yEnd = S + 6 * T, A = (e.a0y + yEnd) / 2 - e.apex;
      e.lx = e.a0x + e.adir * 15 * T * u; e.ly = lerp(e.a0y, yEnd, u) - A * Math.sin(Math.PI * u);
      e.pose = u < 0.5 ? 'open' : 'shut';
      if (!e.hit && u > 0.12 && u < 0.88 && lvBite(e, 1.0)) e.hit = true;
      if (e.stateT <= 0) { e.botes++; lvSet(e, 'mergulho', 0.7); e.gx = lvClampX(e.lx + e.adir * 4 * T); }
      break;
    }
    case 'mergulho':
      lvGo(e, e.gx, S + 10 * T, 260, dt);
      if (e.stateT <= 0) { lvSet(e, 'nada', 0); e.cd = lvCd(e); }
      break;
    /* ----- a cabeça no convés: cansado ----- */
    case 'deckVai': {
      const rx = -1 * T, ry = -2 * T - 15;
      if (e.stateT0 < 1.2) { lvGo(e, -14 * T, S + 3 * T, 700, dt); e.d0x = e.lx; e.d0y = e.ly; }
      else {
        const u = Math.min(1, (e.stateT0 - 1.2) / 1.0);
        e.lx = lerp(e.d0x, rx, u); e.ly = lerp(e.d0y, ry, u) - 3 * T * Math.sin(Math.PI * u);
        e.pose = u < 0.7 ? 'open' : 'shut'; if (u > 0.6) e.faceGoal = 0;
        if (u > 0.8 && overlap(e, pl)) { pl.vx = (pl.x + pl.w / 2 > e.x + e.w / 2 ? 1 : -1) * 170; pl.vy = Math.min(pl.vy, -80); }
      }
      if (e.stateT <= 0) { lvSet(e, 'cansado', 2.0); sfx.lvBaque(); shake(4); burst(lvCX() + e.lx, lvCY() - 2 * T, 16, '#625040', 90, 300, 0.6); }
      break;
    }
    case 'cansado':
      e.faceGoal = 0; e.ly = -2 * T - 15 + Math.sin(e.stateT0 * 3) * 1;
      if (Math.random() < dt * 3) { const [nx, ny] = lvHeadPt(e, 30, -6); parts.push({ x: lvCX() + nx, y: lvCY() + ny, vx: rnd(4, 12), vy: rnd(-14, -6), g: -4, life: 1.2, max: 1.2, col: '#8aa4a8', size: 1, smoke: true }); }
      if (e.stateT <= 0) { lvSet(e, 'deckSai', 0.9); e.d0x = e.lx; e.d0y = e.ly; }
      break;
    case 'deckSai': {
      const u = Math.min(1, e.stateT0 / 0.9);
      e.lx = lerp(e.d0x, -15 * T, u); e.ly = lerp(e.d0y, S + 6 * T, u) - 1.5 * T * Math.sin(Math.PI * u);
      if (e.stateT <= 0) { lvSet(e, 'nada', 0); e.cd = lvCd(e); }
      break;
    }
    /* ----- Rabada ----- */
    case 'rabadaTell':
      lvGo(e, lvClampX(e.tx - e.tdir * 18 * T), S + 14 * T, 300, dt);
      if (e.stateT <= 0) { lvSet(e, 'rabada', 0.35); if (lvFx.cauda) { lvFx.cauda.st = 'bate'; lvFx.cauda.t = 0; } sfx.lvCauda(); }
      break;
    case 'rabada':
      if (e.stateT <= 0) {
        lvFx.ondas.push({ x: e.tx, dir: e.tdir, sp: 240, t: 0, hit: false, kicked: new Set() });
        lvSplash(e.tx, 300); shake(3); sfx.lvBate();
        lvSet(e, 'nada', 0); e.cd = lvCd(e) + 0.6;
      }
      break;
    /* ----- Tromba-d'água: ele fica no fundo; o aviso é a espuma ----- */
    case 'espera':
      lvGo(e, lvClampX(H.hx + 8 * T), S + 12 * T, 200, dt);
      if (e.stateT <= 0) { lvSet(e, 'nada', 0); e.cd = lvCd(e); }
      break;
    /* ----- Redemoinho ----- */
    case 'redTell':
      lvGoBy(e, e.mx, S + 0.4 * T, 160, dt);
      e.faceGoal = H.hx < e.lx ? Math.PI : 0; e.pose = 'open';
      if (e.stateT <= 0) { lvSet(e, 'red', 3.6); if (lvFx.red) lvFx.red.st = 'puxa'; sfx.lvRalo(1); }
      break;
    case 'red':
      e.faceGoal = H.hx < e.lx ? Math.PI : 0; e.pose = 'open';
      lvGo(e, e.mx, S + 0.4 * T + Math.sin(e.stateT0 * 4) * 2, 40, dt);
      if (e.stateT <= 0 || !lvFx.red) { lvFx.red = null; lvSet(e, 'mergulho', 0.7); e.gx = e.lx; }
      break;
    /* ----- Ataque por baixo ----- */
    case 'baixoTell': {
      const f = e.af; if (!f || !f.alive || f.sinkT >= 0) { e.af = null; lvSet(e, 'nada', 0); e.cd = 0.3; break; }
      lvGoBy(e, f.x + f.w * T / 2, S + 6 * T, 200, dt);
      e.faceGoal = -Math.PI / 2;
      if (e.stateT <= 0) { lvSet(e, 'baixo', 0.85); e.a0x = e.lx; e.a0y = e.ly; e.hit = false; e.launched = false; sfx.lvEmerge(); }
      break;
    }
    case 'baixo': {
      const f = e.af, u = Math.min(1, e.stateT0 / 0.85);
      e.faceGoal = -Math.PI / 2;
      e.lx = e.a0x; e.ly = e.a0y - (e.a0y - (S - 5 * T)) * Math.sin(Math.PI * u);
      e.pose = u < 0.45 ? 'open' : 'shut';
      if (!e.launched && f && e.ly < lvTop(f) + 8) {
        e.launched = true; f.vdy = -340; f.shake = 0; sfx.lvMadeira();
        const X = lvCX() + f.x + f.w * T / 2, Y = lvCY() + lvTop(f); burst(X, Y, 14, '#4e321e', 110, 380, 0.7); burst(X, Y, 8, '#a08a70', 90, 380, 0.6);
      }
      if (!e.hit && u > 0.15 && u < 0.85 && lvBite(e, 1.2)) e.hit = true;
      if (e.stateT <= 0) { e.af = null; lvSet(e, 'mergulho', 0.5); e.gx = e.lx; }
      break;
    }
    /* ----- Jato abissal ----- */
    case 'jatoVai':
      if (lvGo(e, e.side * 56 * T, S + 4 * T, 650, dt) < T || e.stateT <= 0) { lvSet(e, 'jatoTell', 1.0); sfx.lvGarganta(); }
      break;
    case 'jatoTell':
      lvGo(e, e.side * 56 * T, S - 0.9 * T, 120, dt);
      e.faceGoal = e.side < 0 ? 0 : Math.PI; e.pose = 'open';
      if (e.stateT <= 0) { const [mx, my] = lvMouth(e); lvFx.jato = { x0: mx, y: my, dir: -e.side, len: 0, t: 0, cd: 0 }; lvSet(e, 'jato', 1.7); sfx.lvJato(); }
      break;
    case 'jato':
      e.faceGoal = e.side < 0 ? 0 : Math.PI; e.pose = 'open';
      lvGo(e, e.side * 56 * T, S - 0.9 * T, 30, dt);
      if (e.stateT <= 0) { lvFx.jato = null; lvSet(e, 'mergulho', 0.7); e.gx = e.lx; }
      break;
    /* ----- Apagar ----- */
    case 'apagarTell': {
      lvGoBy(e, e.mx, S - 0.6 * T, 140, dt);
      e.faceGoal = -Math.PI / 2 + 0.35; e.pose = 'open';
      if (e.stateT0 > 0.5) {   // o plâncton é sugado para a boca
        const [mx, my] = lvMouth(e);
        for (let n = 0; n < 3; n++) { const a = Math.random() * Math.PI * 2, r = rnd(4, 9) * T; parts.push({ x: lvCX() + mx + Math.cos(a) * r, y: lvCY() + Math.max(S + 4, my + Math.abs(Math.sin(a)) * r), vx: -Math.cos(a) * r * 1.4, vy: -Math.abs(Math.sin(a)) * r * 1.2, g: 0, life: 0.7, max: 0.7, col: Math.random() < 0.6 ? '#4ac0b4' : '#8ae8d8', size: 1, glow: true }); }
      }
      if (e.stateT <= 0) { lvFx.darkT = LVQ.apagar; sfx.lvApagar(); lvSet(e, 'mergulho', 0.8); e.gx = e.lx; }
      break;
    }
    /* ----- as fases ----- */
    case 'fase2': {
      const t = e.stateT0;
      if (t < 1.0) lvGo(e, 22 * T, S - 3 * T, 700, dt);
      else {
        e.pose = 'open'; e.faceGoal = H.hx < e.lx ? Math.PI * 0.9 : -0.1;
        if (!e.sumDone) { e.sumDone = true; sfx.lvRugido(1.2); shake(5); lvTubaroes(); }
      }
      if (e.stateT <= 0) { lvSet(e, 'mergulho', 0.8); e.gx = e.lx; }
      break;
    }
    case 'fase3': {
      const t = e.stateT0, M = lvFloats.find(f => f.k === 'meia'), P = lvFloats.find(f => f.k === 'popa');
      const mx = M ? M.x + M.w * T / 2 : -22 * T;
      if (t < 1.1) { lvGo(e, mx, S + 6 * T, 900, dt); e.faceGoal = -Math.PI / 2; if (M && M.alive) M.shake = 1; e.b0y = e.ly; }
      else if (t < 2.0) {
        const u = (t - 1.1) / 0.9; e.lx = mx; e.ly = lerp(e.b0y, S - 6 * T, Math.sin(u * Math.PI / 2)); e.faceGoal = -Math.PI / 2; e.pose = 'open';
        if (!e.broke && e.ly < S - T) { e.broke = true; lvBreakMeia(); }
      } else {
        lvGo(e, P ? P.x + P.w * T / 2 : -44 * T, S + 8 * T, 260, dt);
        if (!e.sank && t > 2.4) { e.sank = true; lvSinkPopa(); }
      }
      if (e.stateT <= 0) { lvSet(e, 'nada', 0); e.cd = 0.8; }
      break;
    }
  }
}
// começa um golpe (o aviso de cada um)
function lvBegin(e, k, H) {
  if (k === 'bote') {
    e.ax = lvClampX(H.hx); let d = e.lx < e.ax ? 1 : -1; if (Math.abs(e.ax + d * 7.5 * T) > LV_X) d = -d;   // o arco tem o herói no meio
    e.adir = d; lvSet(e, 'boteTell', 1.2); sfx.lvBolhas();
  } else if (k === 'rabada') {
    const side = H.hx > 0 ? -1 : 1; e.tx = lvClampX(H.hx + side * 36 * T); if (Math.abs(e.tx - H.hx) < 20 * T) e.tx = lvClampX(H.hx - side * 36 * T);
    e.tdir = Math.sign(H.hx - e.tx) || 1; lvFx.cauda = { x: e.tx, t: 0, st: 'sobe' }; lvSet(e, 'rabadaTell', 1.0); sfx.lvBolhas();
  } else if (k === 'tromba') {
    lvFx.trombas.push({ x: lvClampX(H.hx), t: -0.8, hit: false }, { x: null, t: -1.6, hit: false });
    lvSet(e, 'espera', 2.6); sfx.lvEspuma();
  } else if (k === 'redemoinho') {
    e.mx = lvClampX(H.hx + (H.hx > 0 ? -1 : 1) * 12 * T); e.redT = 10;
    lvFx.red = { x: e.mx, y: lvS(), st: 'tell', t: 0 }; lvSet(e, 'redTell', 1.5); sfx.lvRalo(0);
  } else if (k === 'baixo') {
    let f = pl.lvOn && pl.lvOn.alive && pl.lvOn.sinkT < 0 ? pl.lvOn : null;
    if (!f) { let bd = 1e9; for (const g of lvFloats) { if (!g.alive || g.sinkT >= 0) continue; const d = Math.abs(g.x + g.w * T / 2 - H.hx); if (d < bd) { bd = d; f = g; } } }
    if (!f) return lvBegin(e, 'bote', H);
    e.af = f; f.shake = 1.1; lvSet(e, 'baixoTell', 1.0); sfx.lvBolhas();
  } else if (k === 'jato') {
    e.side = H.hx > 0 ? -1 : 1; lvSet(e, 'jatoVai', 1.6);
  } else if (k === 'apagar') {
    e.apT = LVQ.apagarCada; e.mx = lvClampX(H.hx + (Math.random() < 0.5 ? -1 : 1) * 14 * T); lvSet(e, 'apagarTell', 1.3); sfx.lvBolhas();
  }
}
// fase 2: dois Tubarões-Cegos (264)
function lvTubaroes() {
  if (!ET.tubarao || !AI.tubarao) return;
  const H = lvHero(), S = lvS(), D = ET.tubarao;
  for (const side of [-1, 1]) {
    const x = lvClampX(H.hx + side * 22 * T), y = S + 7 * T;
    const m = spawnEnemy('tubarao', lvCX() + x - D.w / 2, lvCY() + y - D.h / 2, -1);   // zona fora da tabela: o 265 não apaga quem nasce no mar do chefe
    if (m) { Object.assign(m, { msMinion: true, lvMinion: true, memT: 8, aggro: true, xp: Math.min(m.xp || 1, 3), gold: 0 }); for (let n = 0; n < 8; n++) lvBubble(x + rnd(-12, 12), y + rnd(-8, 8)); }
  }
}
// fase 3: a meia-nau quebra em dois destroços; a popa afunda
function lvBreakMeia() {
  const M = lvFloats.find(f => f.k === 'meia'); if (!M || !M.alive) return;
  M.alive = false; if (pl.lvOn === M) pl.lvOn = null;
  const ex = lvFloats.filter(f => f.extra);
  ex.forEach((f, n) => { f.alive = true; f.x = M.x + (n ? 11 : 1) * T; f.dy = -10; f.vdy = n ? -160 : -220; f.vx = n ? 60 : -60; f.sinkT = -1; f.wy = M.wy; });
  const X = lvCX() + M.x + M.w * T / 2, Y = lvCY() + lvTop(M);
  for (let n = 0; n < 4; n++) { burst(X + rnd(-90, 90), Y + rnd(0, 20), 12, n & 1 ? '#4e321e' : '#806a54', 140, 420, 0.9); }
  burst(X, Y, 20, MS_COL.espuma, 120, 300, 0.7);
  sfx.lvMadeira(); sfx.lvBaque(); shake(7);
}
function lvSinkPopa() { const P = lvFloats.find(f => f.k === 'popa'); if (!P || !P.alive) return; P.sinkT = 0; if (pl.lvOn === P) pl.lvOn = null; sfx.lvRalo(0); }
// borrifo onde algo atravessa a superfície
function lvSplash(x, sp) {
  if (sp < 40) return;
  const X = lvCX() + x, Y = lvCY() + lvS(), n = Math.min(26, 8 + sp / 20);
  burst(X, Y, n, '#c8ecf8', Math.min(200, 70 + sp * 0.3), 420, 0.7); burst(X, Y, n * 0.5, MS_COL.espuma, 70, 300, 0.5);
  sfx.lvEmerge(Math.min(1, sp / 300));
}
function lvBubble(x, y) { parts.push({ x: lvCX() + x, y: lvCY() + y, vx: rnd(-4, 4), vy: rnd(-40, -20), g: -30, life: 0.9, max: 0.9, col: Math.random() < 0.7 ? '#c8ecf8' : '#ffffff', size: Math.random() < 0.3 ? 2 : 1 }); }
// onde a água avisa: [x, intensidade]
function lvTells(e) {
  const k = e.stateMax ? clamp(e.stateT0 / e.stateMax, 0, 1) : 0;
  switch (e.state) {
    case 'boteTell': return [[e.ax - e.adir * 6 * T, k]];
    case 'baixoTell': return e.af ? [[e.af.x + e.af.w * T / 2, k]] : [];
    case 'redTell': case 'apagarTell': return [[e.mx, Math.min(1, k * 1.6)]];
    case 'jatoTell': return [[e.side * 56 * T, Math.min(1, k * 2)]];
    case 'deckVai': return e.stateT0 > 0.5 && e.stateT0 < 1.3 ? [[-12 * T, clamp((e.stateT0 - 0.5) / 0.7, 0, 1)]] : [];
    case 'intro': return e.stateT0 < 1.3 ? [[24 * T, e.stateT0 / 1.3]] : [];
    case 'fase2': return e.stateT0 < 1.0 ? [[22 * T, e.stateT0]] : [];
  }
  return [];
}

/* ---------- os golpes na água: as ondas, as trombas, o redemoinho, o jato, a cauda, a escuridão ---------- */
function lvFxTick(dt) {
  const e = lvBoss, S = lvS(), cx = lvCX(), H = lvHero();
  for (const [x, k] of lvTells(e)) { let n = dt * (6 + 34 * k); while (n > 0) { if (Math.random() < Math.min(1, n)) lvBubble(x + rnd(-14 - 20 * k, 14 + 20 * k), S + rnd(4, 3 * T)); n -= 1; } }
  // a cauda
  const C = lvFx.cauda;
  if (C) {
    C.t += dt;
    if (C.st === 'sobe' && Math.random() < dt * 20) lvBubble(C.x + rnd(-10, 10), S + rnd(2, 20));
    if (C.st === 'bate' && C.t > 0.35) { C.st = 'some'; C.t = 0; } else if (C.st === 'some' && C.t > 0.6) lvFx.cauda = null;
  }
  // as ondas da rabada
  for (let k = lvFx.ondas.length - 1; k >= 0; k--) {
    const W = lvFx.ondas[k]; W.t += dt; W.x += W.dir * W.sp * dt;
    if (Math.abs(W.x) > LV_IN * T) { lvSplash(W.x, 200); lvFx.ondas.splice(k, 1); continue; }
    if (Math.random() < dt * 30) parts.push({ x: cx + W.x + rnd(-6, 6), y: lvCY() + S - rnd(8, 20), vx: W.dir * rnd(20, 60), vy: rnd(-40, 0), g: 300, life: 0.5, max: 0.5, col: MS_COL.espuma, size: 1 });
    for (const f of lvFloats) if (f.alive && f.sinkT < 0 && !W.kicked.has(f) && Math.abs(f.x + f.w * T / 2 - W.x) < f.w * T / 2 + 6) { W.kicked.add(f); f.vdy -= 110; }
    if (!W.hit && !pl.dead && Math.abs(H.hx - W.x) < 10 && H.hy > S - 1.6 * T && H.hy < S + 4 * T) {
      W.hit = true; hurtPlayer(Math.round(e.dmg * 0.5), cx + W.x - W.dir * 20, null, false); pl.vx = W.dir * 200; pl.vy = -170;
    }
  }
  // as trombas-d'água
  for (let k = lvFx.trombas.length - 1; k >= 0; k--) {
    const A = lvFx.trombas[k], t0 = A.t; A.t += dt;
    if (A.x == null) { if (A.t >= -0.8) { A.x = lvClampX(H.hx); sfx.lvEspuma(); } else continue; }
    if (t0 < 0 && A.t >= 0) { lvSplash(A.x, 260); sfx.lvTromba(); shake(2); }
    if (A.t >= 0 && A.t < 0.7 && !A.hit && !pl.dead && Math.abs(H.hx - A.x) < 1.3 * T && H.hy > S - 7 * T && H.hy - pl.h < S + T) {
      A.hit = true; hurtPlayer(Math.round(e.dmg * 0.6), cx + A.x, null, false);
      pl.vy = -Math.sqrt(2 * GRAV * 6 * T); pl.vx *= 0.3; pl.onGround = false; pl.lvOn = null;
    }
    if (A.t >= 0 && A.t < 0.6 && Math.random() < dt * 40) parts.push({ x: cx + A.x + rnd(-10, 10), y: lvCY() + S - 7 * T + rnd(-4, 8), vx: rnd(-50, 50), vy: rnd(-60, -10), g: 400, life: 0.7, max: 0.7, col: Math.random() < 0.5 ? MS_COL.espuma : '#8ac4dc', size: 1 });
    if (A.t > 0.9) lvFx.trombas.splice(k, 1);
  }
  // o redemoinho: puxa o herói e os destroços para a boca; quem segura numa corrente fica
  const Rd = lvFx.red;
  if (Rd) {
    Rd.t += dt; const [mx, my] = lvMouth(e); Rd.x = mx; Rd.y = Math.max(S, my);
    if (Rd.st === 'puxa') {
      for (const f of lvFloats) if (f.alive && f.sinkT < 0) { const d = mx - (f.x + f.w * T / 2); if (Math.abs(d) < 45 * T) f.vx += Math.sign(d) * 90 * dt; }
      const held = pl.climb || touchingTile(pl, MS_CORRENTE), dx = mx - H.hx, dy = my - H.cy, d = Math.hypot(dx, dy);
      if (!held && !pl.lvOn && !pl.dead && d < 42 * T && H.hy > S - 4 * T) {
        const sp = d < 6 * T ? 80 : 46, mvx = dx / d * sp * dt, mvy = dy / d * sp * dt;
        if (!rectSolid(pl.x + mvx, pl.y, pl.w, pl.h)) pl.x += mvx;
        if (!rectSolid(pl.x, pl.y + mvy, pl.w, pl.h)) pl.y += mvy;
      }
      if (!pl.dead && d < 2.2 * T) {
        hurtPlayer(Math.round(e.dmg * 1.5), cx + mx, null, false); pl.vx = -Math.sign(dx || 1) * 240; pl.vy = -200;
        lvFx.red = null; e.stateT = Math.min(e.stateT, 0.2); sfx.lvBaque();
      }
    }
  }
  // o jato abissal: cresce da boca até a outra borda e fica
  const J = lvFx.jato;
  if (J) {
    J.t += dt; J.cd -= dt; const [mx, my] = lvMouth(e); J.x0 = mx; J.y = my;
    J.len = Math.min(Math.abs(J.dir * (LV_IN + 1) * T - J.x0), J.t / 1.1 * 130 * T);
    const x1 = J.x0 + J.dir * J.len, lo = Math.min(J.x0, x1), hi = Math.max(J.x0, x1), cy = lvCY();
    if (J.cd <= 0 && !pl.dead && H.hx > lo && H.hx < hi && pl.y + pl.h > cy + J.y - 7 && pl.y < cy + J.y + 7) { J.cd = 0.6; hurtPlayer(Math.round(e.dmg * 0.8), cx + J.x0, null, false); pl.vx = J.dir * 180; }
    for (const f of lvFloats) if (f.alive && f.sinkT < 0 && f.x + f.w * T > lo && f.x < hi && Math.abs(lvTop(f) - J.y) < 14) f.vx += J.dir * 120 * dt;
    if (Math.random() < dt * 50) parts.push({ x: cx + x1 + rnd(-4, 4), y: cy + J.y + rnd(-4, 4), vx: J.dir * rnd(20, 90), vy: rnd(-80, 10), g: 380, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? MS_COL.espuma : '#8ac4dc', size: 1 });
  }
}

/* ---------- o turno: acordar, sair, a luta ---------- */
function lvOnDeck() {
  if (!pl.onGround || pl.dead) return false;
  const ty = Math.floor((pl.y + pl.h + 1) / T);
  for (const x of [pl.x + 1, pl.x + pl.w / 2, pl.x + pl.w - 1]) if (lvPlan.deck.has(ty * WW + wrapX(Math.floor(x / T)))) return true;
  return false;
}
HOOK.update.push(dt => {
  lvPerolaTick(dt);
  if (!lvB() || !lvPlan || !pl || state !== 'play') return;
  lvFx.darkT = Math.max(0, lvFx.darkT - dt);
  lvFx.dark = approach(lvFx.dark, lvFx.darkT > 0 && lvBoss ? 1 : 0, dt * (lvFx.darkT > 0 ? 2.2 : 1.2));
  if (lvFight() && !pl.dead && !lvHeroIn(3)) { endBossFight(false); return; }   // saiu do mar (teleporte, portal)
  if (!lvNear()) return;
  lvTideTick(dt);
  lvFloatsTick(dt);
  if (lvState.dead) return;
  if (!lvChecked && !bossFight) { lvChecked = true; if (lvDiffers()) lvWrite(false); }
  if (!bossFight && lvOnDeck()) lvStart();
  const e = lvBoss;
  if (!e || !lvFight()) return;
  lvBarTick(dt); lvFxTick(dt);
});

/* ---------- a Pérola do Leviatã ---------- */
STAT_DEF.lgPerola = { t: 'Fôlego dobrado e nado 30% mais rápido; uma vez a cada 30 s, ao cair abaixo de 30% de vida, uma onda empurra os inimigos em volta', flag: 1 };
STAT_KEYS.push('lgPerola');
ICON_ART.lvPerola = [["...kkk...", "..kWwbk..", ".kWwwbbk.", ".kwwbbBk.", ".kbbbBBk.", ".kbBBBdk.", "..kBddk..", "...kkk..."], { k: '#0a1420', W: '#ffffff', w: '#d8ecff', b: '#9cc4ec', B: '#5a88c0', d: '#2e4a78' }];
ITEMS.perola_leviata = {
  name: 'Pérola do Leviatã', slot: 'acc', rar: 4, hp: 20, icon: 'lvPerola',
  legend: [['lgPerola', 1], ['light', 1]],
  desc: 'Cresceu por mil anos atrás do olho do Leviatã. Fria, pesada, e quem a carrega respira como quem mora no fundo.'
};
BASE_INFO.perola_leviata = [23];
ITEM_G.perola_leviata = 0; ITEMS.perola_leviata.g = 0;
lvDrops();
const lvPerolaOn = () => !!(pl && pl.lg && pl.lg.perola);
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgPerola || 0;
  if (pl.lg) pl.lg.perola = b > 0;
  return r;
}; }
// a onda: uma vez a cada 30 s, abaixo de 30% de vida, empurra todo inimigo em volta (menos chefes)
const lvPer = { next: 0 };
function lvPerolaTick(dt) {
  const R = lvFx.ring; if (R) { R.t += dt; if (R.t > 0.7) lvFx.ring = null; }
  if (!lvPerolaOn() || pl.dead || state !== 'play' || pl.hp >= pl.maxHp * 0.3 || gameTime < lvPer.next) return;
  lvPer.next = gameTime + 30;
  const x = pl.x + pl.w / 2, y = pl.y + pl.h / 2, Rr = 7 * T;
  for (const m of enemies) {
    if (m.dead || m.boss || (ET[m.type] || {}).boss) continue;
    const dx = m.x + m.w / 2 - x, dy = m.y + m.h / 2 - y, d = Math.hypot(dx, dy); if (d > Rr) continue;
    const k = 1 - d / Rr * 0.5, dir = Math.sign(dx) || 1;
    m.vx = dir * 280 * k; m.vy = -150 * k; m.stun = Math.max(m.stun || 0, 0.7); m.memT = 4;
  }
  lvFx.ring = { x, y, t: 0 };
  burst(x, y, 24, '#9cc8ff', 160, 0, 0.6, 1, true); burst(x, y, 12, MS_COL.espuma, 120, 200, 0.5);
  sfx.lvPerola();
}
// fôlego e nado: o 172 carrega depois deste arquivo; o 269 chama isto quando ele já existe
function msPerolaWraps() {
  if (msPerolaWraps.done) return; msPerolaWraps.done = true;
  if (typeof tickFolego === 'function') { const _tf = tickFolego; tickFolego = function (dt) {
    const f0 = pl.folego, r = _tf(dt);
    if (lvPerolaOn() && f0 > 0 && pl.folego < f0) pl.folego = f0 - (f0 - pl.folego) * 0.5;   // fôlego dobrado
    return r;
  }; }
  if (typeof nadoFisica === 'function') { const _nf = nadoFisica; nadoFisica = function (dt) {
    const vx0 = pl.vx, r = _nf(dt);
    if (lvPerolaOn()) {   // 30% mais rápido: o teto de lado e a braçada
      if (Math.abs(vx0) > Math.abs(pl.vx) + 0.01) pl.vx = Math.sign(vx0) * Math.min(Math.abs(vx0), Math.abs(pl.vx) * 1.3);
      if (pl.vy < 0 && (keys.KeyW || keys.Space || keys.ArrowUp)) pl.vy = Math.max(pl.vy * 1.3, -91);
    }
    return r;
  }; }
}

/* ---------- arte ---------- */
const LVA = { PX: 24, PY: 25, HW: 64, HH: 60, HD: 90 };
{
const RAMPS = [];
const R6 = hexes => { const R = hexes.map(h => ph(h)); R.k = RAMPS.length; RAMPS.push(R); return R; };
const PAL = {
  esc: R6(['#020507', '#061016', '#0c1c24', '#142c36', '#20424e', '#346270']),
  ven: R6(['#0a1414', '#16262a', '#24383c', '#365052', '#4e6c6a', '#6e8e88']),
  fin: R6(['#03070a', '#08121a', '#0f1f2c', '#183242', '#26485a', '#3c6476']),
  osso: R6(['#2a261e', '#4a4234', '#7a6e58', '#a89a80', '#d0c4a8', '#f0e8d4']),
  boca: R6(['#0a0204', '#1e060c', '#3a0e18', '#5e1a28', '#8a2c3c', '#b84a58']),
  ciano: R6(['#0a3a3a', '#1a6a66', '#2a9490', '#4ac0b4', '#8ae8d8', '#e0fff8']),
  rosa: R6(['#3a0a1e', '#6a1a3a', '#a82e5e', '#e04a86', '#ff8ab0', '#ffd0e0']),
  casco: R6(['#140c08', '#24160c', '#382214', '#4e321e', '#68462c', '#866040']),
  conves: R6(['#2a2016', '#46382a', '#625040', '#806a54', '#a08a70', '#c4ac90']),
  ferro: R6(['#0c0c0e', '#1c1c20', '#2e2c30', '#46423e', '#625c54', '#8a8274']),
  corda: R6(['#1e160c', '#3a2c18', '#5a4626', '#7c6438', '#a08a54', '#c8b480']),
  vela: R6(['#1a1814', '#2e2a22', '#46402e', '#625a42', '#827a5c', '#a49c7e']),
  cracas: R6(['#0e1418', '#1c2830', '#2c3c46', '#40525c', '#5a6e78', '#7e929a']),
  alga: R6(['#061410', '#0c2418', '#163a24', '#225430', '#36703e', '#548c4a'])
};
LVA.PAL = PAL;
const cg = (x, y, s) => hash2(x, y, s) - 0.5;
// o pintor (como o da Dama): cada pixel lembra a rampa; o contorno pega o tom mais escuro onde encosta no ar
function pp(w, h) {
  const c = new Uint32Array(w * h), rid = new Int16Array(w * h).fill(-1);
  const P = {
    w, h, c, rid,
    put(x, y, R, v) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; c[i] = R[v < 0 ? 0 : v > 5 ? 5 : v | 0]; rid[i] = R.k; },
    has(x, y) { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < w && y < h && !!c[y * w + x]; },
    ball(cx, cy, rx, ry, f) {
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.hypot(dx, dy); if (d > 1) continue;
        f(x, y, dx, dy, d);
      }
    },
    line(x0, y0, x1, y1, f) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5)); for (let s = 0; s <= n; s++) f(lerp(x0, x1, s / n), lerp(y0, y1, s / n), s / n); },
    outline(skip) {
      const o = c.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!c[i] || (skip && skip(rid[i]))) continue;
        if ((x > 0 && !c[i - 1]) || (x < w - 1 && !c[i + 1]) || (y > 0 && !c[i - w]) || (y < h - 1 && !c[i + w])) o[i] = RAMPS[rid[i]][0];
      }
      c.set(o);
    },
    canvas() { const cv = mk(w, h), x = cv.getContext('2d'), im = x.createImageData(w, h); new Uint32Array(im.data.buffer).set(c); x.putImageData(im, 0, 0); return cv; }
  };
  return P;
}
// escamas: fileiras desencontradas, a borda de cima de cada escama pega luz
const scale = (x, y) => { const row = y >> 2, lx = (x + (row & 1) * 2) & 3, ly = y & 3; return (ly === 0 && lx > 0 ? 0.55 : ly === 3 ? -0.35 : 0) + (lx === 0 && ly > 0 ? -0.25 : 0); };

/* a cabeça, de frente para a direita: o crânio largo atrás, o focinho comprido, a mandíbula de baixo que abre em
   volta da dobradiça (22, 28), dentes de agulha nas duas, o olho grande aceso, a crista de espinhos com membrana
   para trás, as guelras, a linha de fotóforos e dois barbilhões com a ponta rosa acesa (as iscas) */
function paintHead(open) {
  const Q = pp(LVA.HW, LVA.HH), E = PAL.esc, V = PAL.ven, F = PAL.fin, O = PAL.osso, M = PAL.boca, C = PAL.ciano, P = PAL.rosa;
  const hx = 22, hy = 28, ja = open ? 0.5 : 0, ca = Math.cos(ja), sa = Math.sin(ja);
  const toJaw = (x, y) => { const dx = x - hx, dy = y - hy; return [hx + dx * ca + dy * sa, hy - dx * sa + dy * ca]; };
  const fromJaw = (u, v) => { const du = u - hx, dv = v - hy; return [hx + du * ca - dv * sa, hy + du * sa + dv * ca]; };
  const sTop = x => 12 + (x - 30) * 0.3 + (x > 57 ? (x - 57) * 1.6 : 0);
  const mouth = x => 28.5 - (x - 30) * 0.07 - (x > 58 ? (x - 58) * 1.2 : 0);
  const jt = u => 28.5 - (u - 30) * 0.07, jb = u => 38 - (u - 14) * 0.2 - (u > 52 ? (u - 52) * 1.4 : 0);
  // 1. a crista: espinhos para cima e para trás, membrana entre eles
  const sp = [[10, 17, 10], [14, 13.5, 13], [18, 11.5, 15], [22, 10.5, 14], [26, 10.2, 11]];
  const tip = k => { const [x, y, L] = sp[k], a = -Math.PI / 2 - 0.75 + k * 0.12; return [x + Math.cos(a) * L, y + Math.sin(a) * L]; };
  for (let k = 0; k < 4; k++) {
    const [x0, y0] = sp[k], [x1, y1] = sp[k + 1], [ta, tb] = tip(k), [tc, td] = tip(k + 1);
    for (let q = 0; q <= 1.001; q += 0.04) {
      const ax = lerp(x0, ta, q * 0.85), ay = lerp(y0, tb, q * 0.85), bx = lerp(x1, tc, q * 0.85), by = lerp(y1, td, q * 0.85);
      Q.line(ax, ay, bx, by, (x, y, s) => Q.put(x, y, F, 2.3 - q * 0.8 + (Math.floor(s * 4 + k) % 3 === 0 ? 0.5 : 0) + cg(x | 0, y | 0, 7701) * 0.4));
    }
  }
  for (let k = 0; k < 5; k++) { const [x0, y0] = sp[k], [x1, y1] = tip(k); Q.line(x0, y0, x1, y1, (x, y, s) => Q.put(x, y, F, 4.4 - s * 1.4)); }
  // 2. o pescoço
  Q.ball(9, 27, 9.5, 13.5, (x, y, dx, dy, d) => Q.put(x, y, dy > 0.5 ? V : E, 2.9 - (dx * 0.6 + dy * 1.1) - d * d * 0.7 + scale(x, y) + cg(x, y, 7702) * 0.3));
  // 3. a mandíbula de baixo (girada quando abre)
  for (let y = 0; y < Q.h; y++) for (let x = 10; x < Q.w; x++) {
    const [u, v] = toJaw(x + 0.5, y + 0.5); if (u < 15 || u > 58) continue;
    const a = jt(u), b = jb(u); if (v < a || v > b) continue;
    const nv = (v - a) / Math.max(1, b - a);
    Q.put(x, y, nv > 0.5 ? V : E, 2.8 - nv * 1.5 + (nv < 0.2 ? 0.5 : 0) + scale(x, y) * 0.8 + cg(x, y, 7703) * 0.35);
  }
  // 4. a boca aberta: a garganta escura, mais clara na ponta
  if (open) for (let y = 0; y < Q.h; y++) for (let x = 17; x <= 58; x++) {
    const [u, v] = toJaw(x + 0.5, y + 0.5); if (y + 0.5 < mouth(x) || v > jt(u) || u > 57) continue;
    Q.put(x, y, M, 0.6 + (x - 17) / 41 * 2.6 + cg(x, y, 7704) * 0.5 + (Math.sin(x * 0.9) > 0.7 ? 0.5 : 0));
  }
  // 5. o crânio
  Q.ball(24, 23, 15, 13, (x, y, dx, dy, d) => Q.put(x, y, dy > 0.62 ? V : E, 3.0 - (dx * 0.7 + dy * 1.2) - d * d * 0.8 + scale(x, y) + cg(x, y, 7705) * 0.3));
  // 6. o focinho
  for (let x = 27; x <= 61; x++) {
    const a = sTop(x), b = mouth(x); if (b - a < 1) continue;
    for (let y = Math.ceil(a); y <= Math.floor(b); y++) {
      const ny = (y - a) / (b - a);
      Q.put(x, y, E, 3.3 - ny * 1.6 - (x - 27) / 34 * 0.3 + (y === Math.ceil(a) ? 0.8 : 0) + scale(x, y) * 0.8 + cg(x, y, 7706) * 0.35);
    }
  }
  Q.put(55, 16, E, 0.2); Q.put(56, 16, E, 0.4);   // a narina
  // 7. os dentes: agulhas de cima para baixo, de baixo para cima (atravessam o lábio de fora, como os peixes do fundo)
  for (let x = 32; x <= 58; x += 3) {
    const L = 3 + (hash2(x, 1, 7707) > 0.5 ? 2 : 0) + (x > 36 && x < 46 ? 1 : 0), y0 = Math.floor(mouth(x));
    for (let s = 0; s < L; s++) Q.put(x, y0 + s, O, 4.8 - s * 0.6);
    Q.put(x + 1, y0, O, 3.2);
  }
  for (let u = 30.5; u <= 55; u += 3) {
    const L = 3 + (hash2(u | 0, 2, 7707) > 0.6 ? 1 : 0);
    for (let s = 0; s < L; s++) { const [x, y] = fromJaw(u, jt(u) - 0.5 - s); Q.put(x, y, O, 4.4 - s * 0.6); }
  }
  // 8. o olho e a sobrancelha de osso
  for (let x = 30; x <= 42; x++) { const y = Math.round(14.2 + Math.pow((x - 36) / 6, 2) * 1.6); Q.put(x, y, E, 4.6); Q.put(x, y + 1, E, 0.8); }
  Q.ball(36.5, 18.5, 3, 2.6, (x, y, dx, dy, d) => Q.put(x, y, C, 5.2 - d * 2.4 - dy * 0.4));
  Q.put(37, 18, E, 0.3); Q.put(37, 19, E, 0.6);   // a pupila em fenda
  // 9. as guelras
  for (const g of [12.5, 16, 19.5]) for (let y = 17; y <= 31; y++) { const x = g + Math.sin((y - 17) / 14 * Math.PI) * 1.6; Q.put(x, y, E, 0.4); Q.put(x + 1, y, E, 3.4); }
  // 10. os fotóforos: a linha do flanco e a do focinho
  for (let x = 4; x <= 30; x += 5) Q.put(x, 31 - (x - 4) * 0.12, C, 4.4);
  for (let x = 40; x <= 55; x += 5) Q.put(x, mouth(x) - 3, C, 3.8);
  // 11. os barbilhões com a isca rosa
  for (const u of [43, 49]) {
    const [bx, by] = fromJaw(u, jb(u) - 0.5);
    let x = bx, y = by;
    for (let s = 0; s < 8; s++) { x = bx + Math.sin(s * 0.6 + u) * 1.0 - s * 0.25; y = by + s; Q.put(x, y, F, 3.0 - s * 0.15); }
    Q.put(x, y + 1, P, 5); Q.put(x, y + 2, P, 4); Q.put(x + 1, y + 1, P, 3.4);
  }
  Q.outline(rk => rk === O.k || rk === C.k || rk === P.k || rk === F.k);
  return Q;
}
const BASE = [];
LVA.base = open => BASE[open] || (BASE[open] = paintHead(open));
// a cabeça girada (nearest, 13 ângulos de -90 a 90 graus; o pivô no centro do quadro)
const HEADS = [[], []];
LVA.head = (open, q) => {
  const A = HEADS[open]; if (A[q]) return A[q];
  const Q = LVA.base(open), a = q * Math.PI / 12 - Math.PI / 2, D = LVA.HD, c = Math.cos(a), s = Math.sin(a), buf = new Uint32Array(D * D);
  for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
    const dx = x + 0.5 - D / 2, dy = y + 0.5 - D / 2, u = Math.floor(dx * c + dy * s + LVA.PX), v = Math.floor(-dx * s + dy * c + LVA.PY);
    if (u < 0 || v < 0 || u >= Q.w || v >= Q.h) continue; buf[y * D + x] = Q.c[v * Q.w + u];
  }
  const cv = mk(D, D), x = cv.getContext('2d'), im = x.createImageData(D, D); new Uint32Array(im.data.buffer).set(buf); x.putImageData(im, 0, 0);
  return (A[q] = cv);
};
// o corpo: discos por raio (o contorno um maior e escuro; o recheio com escamas, luz de cima à esquerda)
const DISCS = [];
LVA.disc = r => {
  if (DISCS[r]) return DISCS[r];
  const R = r + 1, n = 2 * R + 1, o = pp(n, n), f = pp(n, n), E = PAL.esc;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = x + 0.5 - (R + 0.5), dy = y + 0.5 - (R + 0.5), d = Math.hypot(dx, dy);
    if (d <= r + 1) o.put(x, y, E, 0);
    if (d <= r) { const nx = dx / r, ny = dy / r; f.put(x, y, E, 3.0 - (nx * 0.8 + ny * 1.2) - (d / r) * (d / r) * 0.9 + scale(x, y) * 0.8 + cg(x, y, 7720 + r) * 0.3); }
  }
  return (DISCS[r] = { o: o.canvas(), f: f.canvas(), R });
};
// a ponta da cauda saindo da água (rabada): a cauda em S e a nadadeira em leque, bifurcada
function paintCauda() {
  const W = 34, H = 64, Q = pp(W, H), E = PAL.esc, F = PAL.fin, C = PAL.ciano, fx = 17, fy = 22;
  for (let a = -Math.PI / 2 - 0.95; a <= -Math.PI / 2 + 0.95; a += 0.03) {
    const m = a + Math.PI / 2, L = 18 - 8 * Math.exp(-Math.pow(m / 0.28, 2));
    for (let s = 2; s <= L; s++) Q.put(fx + Math.cos(a) * s, fy + Math.sin(a) * s, F, 2.0 + (Math.abs(m) > 0.75 ? 1.0 : 0) - s / L * 0.6 + cg(Math.round(a * 30), s, 7731) * 0.4);
  }
  for (let k = -3; k <= 3; k++) { const a = -Math.PI / 2 + k * 0.3, L = 18 - 8 * Math.exp(-Math.pow(k * 0.3 / 0.28, 2)); Q.line(fx, fy, fx + Math.cos(a) * L, fy + Math.sin(a) * L, (x, y, s) => Q.put(x, y, F, 4.3 - s * 1.2)); }
  for (let y = 19; y < H; y++) {
    const q = (y - 19) / (H - 19), c0 = fx + Math.sin(q * 3) * 2, r = 2.6 + q * 4.2;
    for (let x = Math.floor(c0 - r - 1); x <= c0 + r + 1; x++) { const dx = (x + 0.5 - c0) / r; if (Math.abs(dx) > 1) continue; Q.put(x, y, E, 3.0 - dx * 1.3 - dx * dx * 0.6 + scale(x, y) * 0.8 + cg(x, y, 7732) * 0.3); }
    if (y % 7 === 3) Q.put(c0 - r * 0.3, y, C, 4.2);
  }
  Q.outline(rk => rk === F.k || rk === C.k);
  return Q.canvas();
}
LVA.cauda = () => LVA.cd || (LVA.cd = paintCauda());

/* ---------- o que boia ---------- */
// tábuas: fileiras de 4 px com a de cima clara e a junta escura, veio, cavilhas
const plank = (x, y, row, s) => 2.6 + ((y & 3) === 0 ? 0.8 : (y & 3) === 3 ? -1.2 : 0) + Math.sin(x * 0.7 + row * 3) * 0.15 + cg(x, y, s + row) * 0.45;
function paintMeia(w, fb) {
  const W = w * T, AY = 22, H = AY + 66, Q = pp(W, H), K = PAL.casco, D = PAL.conves;
  const botY = x => AY + 54 - Math.pow(Math.abs(x / W - 0.5) * 2, 3) * 8;
  const endL = y => 2 + Math.floor(hash2(y >> 2, 1, 7801) * 9), endR = y => W - 3 - Math.floor(hash2(y >> 2, 2, 7801) * 9);
  for (let y = AY; y < H; y++) for (let x = 0; x < W; x++) {
    if (y > botY(x) || x < endL(y) || x > endR(y)) continue;
    if (y < AY + 4) { Q.put(x, y, D, (y === AY ? 4.4 : 3.2 - (y - AY) * 0.4) + (x % 12 === 0 ? -1.4 : 0) + cg(x, y, 7802) * 0.4); continue; }
    const row = (y - AY) >> 2;
    if ((y & 3) === 1 && (x + row * 7) % 16 === 0) { Q.put(x, y, K, 4.3); continue; }
    if (y > AY + fb + 3 && hash2(x >> 1, y >> 1, 7804) < 0.08) { Q.put(x, y, PAL.cracas, 2 + hash2(x, y, 7805) * 2.5); continue; }
    Q.put(x, y, K, plank(x, y, row, 7803) - (y > AY + fb ? 0.4 : 0));
  }
  // as cavernas (costelas) saindo do corte, dos dois lados
  for (const side of [0, 1]) for (let k = 0; k < 3; k++) { const x0 = side ? W - 2 - k * 4 : 1 + k * 4; for (let y = AY + 2; y < botY(x0) - 2; y++) { if (hash2(k + side * 5, y >> 3, 7806) < 0.15) continue; Q.put(x0, y, K, 3.8 - (y - AY) * 0.02); } }
  // o toco do mastro grande, partido, com duas cintas de ferro e a corda enrolada no pé
  const mx = Math.round(W * 0.44);
  for (let y = 2; y < AY; y++) for (let x = mx - 3; x <= mx + 3; x++) {
    if (y < 2 + Math.floor(hash2(x, 0, 7807) * 6)) continue;
    const band = y === AY - 7 || y === AY - 13;
    Q.put(x, y, band ? PAL.ferro : D, (band ? 3.4 : 2.9) - (x - mx) * 0.32 + cg(x, y, 7808) * 0.4);
  }
  for (let y = AY - 4; y < AY; y++) for (let x = mx - 5; x <= mx + 5; x++) if (Math.abs(x - mx) > 3) Q.put(x, y, PAL.corda, 3.2 + ((x + y) & 1) * 0.8 - (y - AY + 4) * 0.3);
  // algas penduradas da quilha
  for (let n = 0; n < 10; n++) { const x = 10 + Math.floor(hash2(n, 3, 7809) * (W - 20)), L = 3 + Math.floor(hash2(n, 4, 7809) * 7), b = Math.floor(botY(x)); for (let s = 0; s < L; s++) Q.put(x + Math.round(Math.sin(s * 0.8 + n) * 0.8), b + s, PAL.alga, 3.2 - s * 0.3); }
  Q.outline();
  return { cv: Q.canvas(), ay: AY };
}
function paintPopa(w, fb) {
  const W = w * T, AY = 6, H = AY + 70, Q = pp(W, H), K = PAL.casco, D = PAL.conves;
  const topY = x => AY + 7 * Math.pow((x / W - 0.45) * 2, 2), botY = x => AY + 62 - 10 * Math.pow((x / W - 0.5) * 2, 4);
  const tr = W * 0.72;
  for (let x = 0; x < W; x++) for (let y = Math.floor(topY(x)); y <= botY(x); y++) {
    if (x < 3 && (y < topY(x) + 6 || y > botY(x) - 6)) continue;
    if (x >= tr) {   // o painel de popa: tábuas em pé, as janelas da cabine
      const lx = x - tr, wy = (y - AY - 14) % 16, wx = Math.floor(lx) % 13;
      if (y > AY + 12 && y < AY + 46 && wx >= 3 && wx <= 9 && wy >= 2 && wy <= 11) { const glint = wx === 4 && wy === 3; Q.put(x, y, glint ? PAL.ciano : K, glint ? 2.2 : 0.4 + (wy === 2 ? 0.6 : 0)); continue; }
      if (y > AY + 12 && y < AY + 46 && wx >= 2 && wx <= 10 && wy >= 1 && wy <= 12) { Q.put(x, y, D, 3.4 - (wy === 12 ? 1 : 0)); continue; }
      Q.put(x, y, K, 2.9 + ((x & 3) === 0 ? -1.1 : (x & 3) === 1 ? 0.6 : 0) + cg(x, y, 7811) * 0.45 - (y > AY + fb ? 0.4 : 0));
      continue;
    }
    const row = Math.floor((y - AY + x * 0.25) / 4);
    if (y > AY + fb + 4 && hash2(x >> 1, y >> 1, 7812) < 0.09) { Q.put(x, y, PAL.cracas, 2 + hash2(x, y, 7813) * 2.5); continue; }
    Q.put(x, y, K, 2.6 + (((y + Math.floor(x * 0.25)) & 3) === 0 ? 0.8 : ((y + Math.floor(x * 0.25)) & 3) === 3 ? -1.2 : 0) + cg(x, y, 7814 + row) * 0.45 - (y > AY + fb ? 0.4 : 0) + (y < topY(x) + 2 ? 0.7 : 0));
  }
  // o leme e as ferragens
  for (let y = AY + 10; y < AY + 60; y++) for (let x = W - 6; x < W; x++) Q.put(x, y, (y % 12 === 0) ? PAL.ferro : K, (y % 12 === 0 ? 3.6 : 2.4) + (x === W - 6 ? 0.8 : 0) + cg(x, y, 7815) * 0.4);
  for (let n = 0; n < 8; n++) { const x = 8 + Math.floor(hash2(n, 5, 7816) * (W - 30)), L = 3 + Math.floor(hash2(n, 6, 7816) * 7), b = Math.floor(botY(x)); for (let s = 0; s < L; s++) Q.put(x + Math.round(Math.sin(s * 0.8 + n) * 0.8), b + s, PAL.alga, 3.2 - s * 0.3); }
  Q.outline();
  return { cv: Q.canvas(), ay: AY };
}
function paintBarril(w) {
  const W = w * T, AY = 2, H = AY + 22, Q = pp(W, H), D = PAL.conves, Fe = PAL.ferro, cy = AY + 10;
  for (let x = 0; x < W; x++) {
    const hh = 10 - Math.pow((x / W - 0.5) * 2, 2) * 2;
    for (let y = Math.ceil(cy - hh); y <= cy + hh; y++) {
      const ny = (y - cy) / hh, hoop = x === 5 || x === 6 || x === W - 7 || x === W - 6 || x === (W >> 1);
      if (x < 3) { Q.put(x, y, D, 2.0 - ny * 0.8 + (Math.abs(ny) > 0.8 ? -0.8 : 0) + cg(x, y, 7821) * 0.3); continue; }   // o tampo
      Q.put(x, y, hoop ? Fe : D, (hoop ? 3.6 : 3.0) - ny * 1.4 + ((y - cy + 20) % 3 === 0 && !hoop ? -0.9 : 0) + cg(x, y, 7822) * 0.4);
    }
  }
  Q.outline();
  return { cv: Q.canvas(), ay: AY };
}
function paintTabuas(w) {
  const W = w * T, AY = 3, H = AY + 12, Q = pp(W, H), K = PAL.casco, D = PAL.conves;
  for (let p = 0; p < 3; p++) {
    const y0 = AY + p * 3, x0 = Math.floor(hash2(p, w, 7831) * 6), x1 = W - 1 - Math.floor(hash2(p, w, 7832) * 6), R = p === 1 ? K : D;
    for (let y = y0; y < y0 + 3; y++) for (let x = x0; x <= x1; x++) Q.put(x, y, R, (y === y0 ? 3.8 : y === y0 + 2 ? 1.8 : 2.8) + Math.sin(x * 0.6 + p) * 0.15 + cg(x, y, 7833 + p) * 0.45);
  }
  for (const lx of [Math.round(W * 0.25), Math.round(W * 0.72)]) for (let y = AY - 1; y < AY + 10; y++) Q.put(lx, y, PAL.corda, 3.4 + (y & 1) * 0.6);
  Q.outline();
  return { cv: Q.canvas(), ay: AY };
}
function paintMastro(w) {
  const W = w * T, AY = 14, H = AY + 26, Q = pp(W, H), D = PAL.conves, yx = Math.round(W * 0.66);
  // a vela rasgada pendurada da verga, entrando na água
  for (let x = yx + 2; x < Math.min(W, yx + 16); x++) { const L = 18 + Math.floor(hash2(x, 0, 7841) * 10); for (let y = AY - 10; y < AY - 10 + L; y++) { if (y >= H) break; Q.put(x, y, PAL.vela, 3.0 - (x - yx) * 0.08 + Math.sin(y * 0.5 + x * 0.3) * 0.4 + cg(x, y, 7842) * 0.5); } }
  // o tronco do mastro deitado, com cintas de ferro
  for (let x = 0; x < W; x++) for (let y = AY; y < AY + 8; y++) { const ny = (y - AY - 3.5) / 4, band = x % 18 === 6 || x % 18 === 7; Q.put(x, y, band ? PAL.ferro : D, (band ? 3.4 : 2.9) - ny * 1.5 + (x < 2 ? -0.8 : 0) + cg(x, y, 7843) * 0.4); }
  // o toco da verga, em pé
  for (let y = AY - 12; y < AY; y++) for (let x = yx - 1; x <= yx + 1; x++) Q.put(x, y, D, 3.0 - (x - yx) * 0.6 + cg(x, y, 7844) * 0.3);
  for (let y = AY - 2; y < AY + 9; y++) Q.put(Math.round(W * 0.2), y, PAL.corda, 3.4 + (y & 1) * 0.6);
  Q.outline();
  return { cv: Q.canvas(), ay: AY };
}
const FLT = {};
LVA.float = f => { const k = f.k + f.w; if (FLT[k]) return FLT[k]; const P = { meia: paintMeia, popa: paintPopa, barril: paintBarril, tabuas: paintTabuas, mastro: paintMastro }[f.k]; return (FLT[k] = P(f.w, f.fb)); };
LVA.GL = { olho: glow(9, '#e0fff8'), olhoG: glow(24, '#4ac0b4'), foto: glow(6, '#4ac0b4'), rosa: glow(6, '#ff8ab0'), garganta: glow(26, '#6ae8d8'), jato: glow(16, '#8ac4dc'), perola: glow(20, '#6aa8e8') };
}

/* ---------- desenho ---------- */
function lvShadow(x, y, k) {
  const rx = 14 + 26 * k, ry = 3 + 5 * k;
  lc.globalAlpha = 0.25 + 0.45 * k; lc.fillStyle = '#010306';
  for (let r = -Math.ceil(ry); r <= ry; r++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (r / ry) * (r / ry)))); lc.fillRect(Math.round(x - hw), Math.round(y + r), hw * 2 + 1, 1); }
  lc.globalAlpha = 1;
}
function lvDrawBody(e, X, Y) {
  const pts = lvBodyPts; pts.length = 0;
  lvWalk(e, 12, LVQ.len, 5, (s, x, y, ux, uy) => pts.push(s, x, y, ux, uy));
  for (let pass = 0; pass < 2; pass++) for (let k = pts.length - 5; k >= 0; k -= 5) {
    const D = LVA.disc(Math.max(3, Math.round(lvRad(pts[k])))), c = pass ? D.f : D.o, x = Math.round(X + pts[k + 1]), y = Math.round(Y + pts[k + 2]);
    if (x < -30 || x > VW + 30 || y < -30 || y > VH + 30) continue;
    lc.drawImage(c, x - D.R, y - D.R);
  }
  // as nadadeiras do dorso e os fotóforos dos 8 segmentos
  const P = LVA.PAL;
  for (let n = 0; n < 8; n++) {
    const k = Math.round((30 + n * 50 - 12) / 5) * 5; if (k + 4 >= pts.length) break;
    const r = lvRad(pts[k]), ux = pts[k + 3], uy = pts[k + 4], x = X + pts[k + 1], y = Y + pts[k + 2];
    if (x < -40 || x > VW + 40 || y < -40 || y > VH + 40) continue;
    let nx = -uy, ny = ux; if (ny > 0) { nx = -nx; ny = -ny; }
    const L = 5 + r * 0.35;
    for (let h = 0; h < L; h++) {
      const wd = (1 - h / L) * 3.5, bx = x + nx * (r - 1 + h) - ux * h * 0.6, by = y + ny * (r - 1 + h) - uy * h * 0.6;
      for (let t = -wd; t <= wd; t += 1) { lc.fillStyle = t < 0 ? '#26485a' : '#0f1f2c'; lc.fillRect(Math.round(bx + ux * t), Math.round(by + uy * t), 1, 1); }
    }
    lc.fillStyle = '#4ac0b4'; lc.fillRect(Math.round(x - nx * r * 0.45), Math.round(y - ny * r * 0.45), 2, 1);
    lc.fillStyle = '#e0fff8'; lc.fillRect(Math.round(x - nx * r * 0.45), Math.round(y - ny * r * 0.45), 1, 1);
  }
  // a nadadeira da cauda: um leque de raios
  const kt = pts.length - 5; if (kt < 0) return;
  const tx = X + pts[kt + 1], ty = Y + pts[kt + 2], ux = pts[kt + 3], uy = pts[kt + 4], a0 = Math.atan2(uy, ux);
  if (tx > -40 && tx < VW + 40 && ty > -40 && ty < VH + 40) for (let a = -0.7; a <= 0.7; a += 0.1) {
    const L = 14 - 6 * Math.exp(-Math.pow(a / 0.25, 2)), ca = Math.cos(a0 + a), sa = Math.sin(a0 + a);
    for (let s = 0; s < L; s++) { lc.fillStyle = Math.abs(a) > 0.55 || s > L - 2 ? '#26485a' : '#0f1f2c'; lc.fillRect(Math.round(tx + ca * s), Math.round(ty + sa * s), 1, 1); }
  }
}
function lvDrawHead(e, X, Y) {
  const { mir, q } = lvAngQ(e.ang), cv = LVA.head(e.pose === 'open' ? 1 : 0, q), D = LVA.HD;
  const x = Math.round(X + e.lx), y = Math.round(Y + e.ly);
  if (x < -D || x > VW + D || y < -D || y > VH + D) return;
  lc.save(); lc.translate(x, y); if (mir) lc.scale(-1, 1);
  lc.drawImage(cv, -D / 2, -D / 2);
  if (e.flash > 0) { lc.globalCompositeOperation = 'lighter'; lc.globalAlpha = 0.5; lc.drawImage(cv, -D / 2, -D / 2); }
  lc.restore();
}
function lvDrawFloat(f, X, Y) {
  const A = LVA.float(f), x = Math.round(X + f.x + (f.shake > 0 ? Math.sin(gameTime * 60 + f.seed) * 1.5 : 0)), y = Math.round(Y + lvTop(f) - A.ay);
  if (x > VW + 10 || x + A.cv.width < -10 || y > VH + 10 || y + A.cv.height < -10) return;
  if (f.sinkT >= 0) lc.globalAlpha = clamp(1 - f.sinkT / 3.4, 0, 1);
  lc.drawImage(A.cv, x, y); lc.globalAlpha = 1;
}
DRAW_E.leviata = () => {}; EYES_E.leviata = () => {}; WARN_E.leviata = () => false;   // desenhado pelos HOOKs (o corpo, os destroços, a cabeça)
DRAW_E.lv_seg = () => {}; EYES_E.lv_seg = () => {}; WARN_E.lv_seg = () => false;
const lvView = (X, Y) => !(X + 75 * T < 0 || X - 75 * T > VW || Y + 50 * T < 0 || Y - 14 * T > VH);
HOOK.drawWorld.push((cx, cy) => {
  if (!lvB() || !lvPlan || !pl) return;
  const X = lvCX() - cx, Y = lvCY() - cy; if (!lvView(X, Y)) return;
  const S = lvS(), e = lvBoss;
  if (e) for (const [x, k] of lvTells(e)) lvShadow(X + x, Y + S + 10 - 5 * k, k);
  const C = lvFx.cauda;
  if (C) {
    const h = C.st === 'sobe' ? Math.min(1, C.t / 0.9) : C.st === 'bate' ? 1 - C.t / 0.35 : 0, img = LVA.cauda();
    if (h > 0) lc.drawImage(img, Math.round(X + C.x - img.width / 2), Math.round(Y + S - h * 4.5 * T + (C.st === 'bate' ? -Math.sin(C.t / 0.35 * Math.PI) * 6 : 0)));
  }
  if (e) lvDrawBody(e, X, Y);
  for (const f of lvFloats) if (f.alive) lvDrawFloat(f, X, Y);
  if (e) lvDrawHead(e, X, Y);
});
HOOK.drawTop.push((cx, cy) => {
  const Rg = lvFx.ring;
  if (Rg) { const k = Rg.t / 0.7, r = 8 + k * 7 * T; lc.globalAlpha = (1 - k) * 0.8; lc.strokeStyle = '#c8e4ff'; lc.lineWidth = 2; lc.beginPath(); lc.arc(Math.round(Rg.x - cx) + 0.5, Math.round(Rg.y - cy) + 0.5, r, 0, Math.PI * 2); lc.stroke(); lc.lineWidth = 1; lc.globalAlpha = 1; }
  if (!lvB() || !lvPlan || !pl) return;
  const X = lvCX() - cx, Y = lvCY() - cy; if (!lvView(X, Y)) return;
  const S = Y + lvS(), e = lvBoss;
  if (!e) return;
  // a água estufa onde ele vai sair
  for (const [x, k] of lvTells(e)) {
    if (k < 0.4) continue;
    const hh = (k - 0.4) / 0.6 * 5, x0 = Math.round(X + x);
    for (let d = -14; d <= 14; d++) {
      const h = Math.round(hh * (1 - (d / 14) * (d / 14)) + Math.sin(gameTime * 18 + d) * 0.6); if (h <= 0) continue;
      lc.globalAlpha = 0.7; lc.fillStyle = '#164264'; lc.fillRect(x0 + d, Math.round(S) + 2 - h, 1, h);
      lc.globalAlpha = 0.9; lc.fillStyle = MS_COL.espuma; lc.fillRect(x0 + d, Math.round(S) + 2 - h, 1, 1);
    }
  }
  // as ondas da rabada: uma crista de 2 blocos correndo
  for (const W of lvFx.ondas) {
    const x0 = Math.round(X + W.x);
    for (let d = -16; d <= 16; d++) {
      const q = d * W.dir, h = Math.round(1.7 * T * Math.max(0, q > 0 ? 1 - q / 6 : 1 - (-q) / 16) * (0.9 + 0.1 * Math.sin(gameTime * 20 + d))); if (h <= 0) continue;
      lc.globalAlpha = 0.75; lc.fillStyle = '#164264'; lc.fillRect(x0 + d, Math.round(S) + 2 - h, 1, h);
      lc.globalAlpha = 0.6; lc.fillStyle = '#4a90b0'; lc.fillRect(x0 + d, Math.round(S) + 2 - h, 1, Math.min(h, 4));
      lc.globalAlpha = 1; lc.fillStyle = MS_COL.espuma; lc.fillRect(x0 + d, Math.round(S) + 2 - h, 1, 1);
    }
  }
  // as trombas: o círculo de espuma, depois a coluna
  for (const A of lvFx.trombas) {
    if (A.x == null || A.t < -0.8) continue;
    const x0 = Math.round(X + A.x);
    if (A.t < 0) {
      const k = 1 + A.t / 0.8, r = 18 - k * 8;
      lc.globalAlpha = 0.6 + 0.4 * (Math.floor(gameTime * 12) & 1); lc.fillStyle = MS_COL.espuma;
      for (let s = 0; s < 28; s++) { const a = s / 28 * Math.PI * 2 + gameTime * 4; lc.fillRect(Math.round(x0 + Math.cos(a) * r), Math.round(S + 2 + Math.sin(a) * r * 0.25), (s & 3) ? 1 : 2, 1); }
      lc.globalAlpha = 0.4; lc.fillRect(x0 - Math.round(r * 0.6), Math.round(S) + 2, Math.round(r * 1.2), 1);
    } else if (A.t < 0.8) {
      const k = A.t < 0.6 ? 1 : 1 - (A.t - 0.6) / 0.2, top = Math.round(S - 7 * T * Math.min(1, A.t / 0.12)), H = Math.round(S) + T - top, w = Math.round(T * 1.1 * k) + 1;
      lc.globalAlpha = 0.55 * k; lc.fillStyle = '#164264'; lc.fillRect(x0 - w - 2, top, w * 2 + 4, H);
      lc.globalAlpha = 0.6 * k; lc.fillStyle = '#4a90b0'; lc.fillRect(x0 - w, top, w * 2, H);
      lc.globalAlpha = 0.8 * k; lc.fillStyle = MS_COL.espuma;
      for (let s = 0; s < 7; s++) lc.fillRect(x0 - w + 1 + ((s * 5) % (w * 2)), top + ((Math.floor(gameTime * 240) + s * 29) % H), 1, 4);
      lc.fillRect(x0 - w - 1, top, w * 2 + 2, 2);
    }
  }
  // o redemoinho: anéis de espuma girando em volta da boca
  const Rd = lvFx.red;
  if (Rd) {
    const k = Rd.st === 'tell' ? Math.min(1, Rd.t / 1.5) : 1, x0 = X + Rd.x, y0 = S + 2;
    for (let n = 0; n < 6; n++) {
      const r = 10 + n * 16 + ((gameTime * 40 * (Rd.st === 'puxa' ? 1.6 : 0.7)) % 16) * -1 + 16;
      lc.globalAlpha = k * (0.7 - n * 0.1); lc.fillStyle = n & 1 ? '#8ac4dc' : MS_COL.espuma;
      for (let s = 0; s < 20; s++) { const a = s / 20 * Math.PI * 2 + gameTime * (2.5 - n * 0.25) + n; if (Math.sin(a * 3 + n) < -0.3) continue; lc.fillRect(Math.round(x0 + Math.cos(a) * r), Math.round(y0 + Math.sin(a) * r * 0.22), 2, 1); }
    }
  }
  // o jato
  const J = lvFx.jato;
  if (J) {
    const x1 = X + J.x0 + J.dir * J.len, lo = Math.round(Math.min(X + J.x0, x1)), hi = Math.round(Math.max(X + J.x0, x1)), y0 = Math.round(Y + J.y);
    const k = e.stateT < 0.3 ? e.stateT / 0.3 : 1, wv = Math.sin(gameTime * 40) * 0.6;
    lc.globalAlpha = 0.5 * k; lc.fillStyle = '#164264'; lc.fillRect(lo, y0 - 6, hi - lo, 12);
    lc.globalAlpha = 0.7 * k; lc.fillStyle = '#4a90b0'; lc.fillRect(lo, Math.round(y0 - 4 + wv), hi - lo, 8);
    lc.globalAlpha = 0.85 * k; lc.fillStyle = '#c8ecf8'; lc.fillRect(lo, y0 - 1, hi - lo, 3);
    lc.fillStyle = '#ffffff'; for (let s = 0; s < 10; s++) lc.fillRect(lo + ((Math.floor(gameTime * 600) * J.dir + s * 53) % Math.max(1, hi - lo) + (hi - lo)) % Math.max(1, hi - lo), y0 - 3 + (s % 5), 5, 1);
  }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  const GL = LVA.GL;
  if (lvPerolaOn() && pl && !pl.dead) { lc.globalAlpha = 0.14 + 0.04 * Math.sin(gameTime * 1.7); lc.drawImage(GL.perola, Math.round(pl.x + pl.w / 2 - cx) - 20, Math.round(pl.y + pl.h / 2 - cy) - 20); }
  if (!lvB() || !lvPlan || !pl) return;
  // Apagar: a luz do mar cai à metade (um véu preto por cima de tudo o que já foi aceso); os olhos vêm depois
  const dk = lvFx.dark;
  if (dk > 0.01) { lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = 0.5 * dk; lc.fillStyle = '#000'; lc.fillRect(0, 0, VW, VH); lc.globalCompositeOperation = 'lighter'; }
  const e = lvBoss; if (!e) return;
  const X = lvCX() - cx, Y = lvCY() - cy; if (!lvView(X, Y)) return;
  const pts = lvBodyPts;
  if (dk < 0.5) for (let n = 0; n < 8; n++) {
    const k = Math.round((30 + n * 50 - 12) / 5) * 5; if (k + 4 >= pts.length) break;
    lc.globalAlpha = (0.35 + 0.15 * Math.sin(gameTime * 2 + n)) * (1 - dk * 2); lc.drawImage(GL.foto, Math.round(X + pts[k + 1]) - 6, Math.round(Y + pts[k + 2]) - 6);
  }
  if (dk < 0.5) for (const u of [43, 49]) { const [bx, by] = lvHeadPt(e, u - LVA.PX - 1, (e.pose === 'open' ? 46 : 38) - LVA.PY); lc.globalAlpha = 0.45 * (1 - dk * 2); lc.drawImage(GL.rosa, Math.round(X + bx) - 6, Math.round(Y + by) - 6); }
  const [ex, ey] = lvHeadPt(e, 36.5 - LVA.PX, 18.5 - LVA.PY), blink = e.state === 'cansado' && (e.stateT0 % 1.3) < 0.12 ? 0.2 : 1;
  lc.globalAlpha = (0.6 + 0.3 * dk) * blink; lc.drawImage(GL.olho, Math.round(X + ex) - 9, Math.round(Y + ey) - 9);
  lc.globalAlpha = (0.22 + 0.25 * dk) * blink; lc.drawImage(GL.olhoG, Math.round(X + ex) - 24, Math.round(Y + ey) - 24);
  if (e.state === 'jatoTell' || e.state === 'jato') { const [mx, my] = lvMouth(e), k = e.state === 'jatoTell' ? e.stateT0 / e.stateMax : 1; lc.globalAlpha = 0.25 + 0.5 * k; lc.drawImage(GL.garganta, Math.round(X + mx) - 26, Math.round(Y + my) - 26); }
  const J = lvFx.jato;
  if (J) for (let s = 0; s < J.len; s += 24) { lc.globalAlpha = 0.35; lc.drawImage(GL.jato, Math.round(X + J.x0 + J.dir * s) - 16, Math.round(Y + J.y) - 16); }
  lc.globalAlpha = 1;
});
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const e = lvBoss; if (!e || !lvB()) return;
  const X = lvCX(), Y = lvCY(), J = lvFx.jato;
  if (J) for (let s = 0; s < J.len; s += 24) addL(X + J.x0 + J.dir * s, Y + J.y, 0.55);
  if (e.state === 'jatoTell') { const [mx, my] = lvMouth(e); addL(X + mx, Y + my, 0.6); }
  for (const A of lvFx.trombas) if (A.x != null && A.t >= 0 && A.t < 0.6) addL(X + A.x, Y + lvS() - 3 * T, 0.4);
}; }

/* ---------- som: o rugido grave, a água, a madeira ---------- */
Object.assign(sfx, {
  lvRugido(v = 1) { tone(55, 1.6 * v, 'sawtooth', 0.06, -15); tone(82, 1.4 * v, 'sawtooth', 0.04, -25, 0.05); noise(1.4 * v, 0.07, 300, 'lowpass', 0, 1); },
  lvEmerge(v = 1) { noise(0.5, 0.09 * v, 700, 'lowpass'); noise(0.3, 0.05 * v, 2200, 'bandpass', 0.05); tone(90, 0.4, 'sine', 0.05 * v, -40); },
  lvBolhas() { for (let k = 0; k < 6; k++) tone(300 + Math.random() * 500, 0.06, 'sine', 0.015, 200, k * 0.12); },
  lvBate() { noise(0.6, 0.12, 500, 'lowpass'); tone(60, 0.5, 'sine', 0.08, -20); },
  lvCauda() { noise(0.8, 0.05, 900, 'lowpass'); },
  lvBaque() { noise(0.3, 0.12, 400, 'lowpass'); tone(70, 0.4, 'sine', 0.08, -30); },
  lvEspuma() { noise(0.8, 0.03, 3000, 'bandpass', 0, 2); },
  lvTromba() { noise(0.7, 0.1, 1200, 'bandpass', 0, 0.7); tone(140, 0.5, 'sine', 0.04, 200); },
  lvRalo(k = 0) { if (!k) noise(1.5, 0.05, 400, 'bandpass', 0, 3); else for (let n = 0; n < 6; n++) noise(0.5, 0.05, 300 + n * 60, 'bandpass', n * 0.5, 4); },
  lvGarganta() { tone(220, 1.0, 'sine', 0.03, 440); tone(330, 1.0, 'triangle', 0.02, 660); },
  lvJato() { noise(1.6, 0.08, 2600, 'highpass'); noise(1.6, 0.05, 600, 'lowpass'); },
  lvApagar() { tone(180, 0.8, 'sine', 0.06, -150); noise(0.6, 0.06, 400, 'lowpass'); },
  lvMadeira() { noise(0.25, 0.12, 900, 'bandpass', 0, 1.5); tone(110, 0.2, 'square', 0.03, -50); },
  lvOnda() { noise(1.2, 0.06, 800, 'lowpass', 0, 0.8); tone(70, 1.2, 'sine', 0.04, 30); },
  lvPerola() { tone(880, 0.5, 'sine', 0.04, -300); noise(0.5, 0.05, 1200, 'lowpass'); },
  lvMorte() { tone(70, 3, 'sawtooth', 0.05, -40); noise(2.6, 0.08, 400, 'lowpass', 0, 1); for (let k = 0; k < 5; k++) tone(440 - k * 40, 0.8, 'sine', 0.02, -100, 0.5 + k * 0.2); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.leviata = { dead: lvState.dead };
  if (o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([, t]) => t !== MS_BARREIRA);
  return o;
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.lv) bossFight = null;
  lvBoss = null; lvPlan = null; lvChecked = false; lvClear(); lvSegs.length = 0; lvFx.bar = null; lvFx.dark = 0; lvFloats = [];
  lvTide.f = 0; lvTide.row = 0; lvTide.t = 0; lvTide.snap = null;
  lvState.dead = !!(sv && sv.leviata && sv.leviata.dead);
  return _nw(sd, sv);
}; }
