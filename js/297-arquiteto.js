'use strict';

/* ================= o chefe da Cidade dos Antigos: O Arquiteto, na Sala que se Monta =================
   Ficha 13, seção 7. O último Antigo, ou a máquina que ficou no lugar dele: uma figura alta e fina de laje e luz, sem
   pernas, com quatro braços que seguram régua, esquadro, compasso e prumo. Flutua no meio da sala e redesenha a sala
   enquanto luta.
   A sala: o miolo 30 x 30 do atBoss (295), uma grade de 5 x 5 módulos de 6 x 6. A moldura é de ladrilho, com uma porta
   no pé de cada parede que a Grade de Luz fecha na luta. Os 12 modelos de módulo ficam em ARQ_MOD; o arranjo inicial sai
   da semente e é conferido com a busca do pulo (todo lugar de pé chega a todos os outros; os módulos das duas portas
   ficam vazios). Cada troca de módulos durante a luta também é conferida antes de acontecer, e o módulo onde o herói
   está nunca se mexe.
   A gravidade: o 296 gira a sala inteira (atRotRect), então "a gravidade vai para a esquerda" é a sala girando 90° e a
   câmera girando junto. Depois de cada giro, se algum lugar ficou sem saída, uma troca de módulos acerta.
   - Fase 1 (100% a 60%): Régua (uma linha de parede a parede, depois a lâmina de luz corre nela), Esquadro (dois muros
     em L sobem em volta do herói, prendem 4 s), Prumo (um fio desce do teto sobre o herói e o peso cai).
   - Virada (60%): ele levanta os braços, as bordas dos módulos que vão sair acendem com setas (1,5 s), os módulos
     trocam (1,2 s deslizando) e a gravidade vai para a esquerda.
   - Fase 2 (60% a 25%): Compasso (um círculo riscado por 1 s, depois o anel queima), 2 Cubos Errantes com meia vida,
     uma troca de módulo a cada 10 s (com aviso), Régua e Prumo continuam.
   - Fase 3 (25% a 0): o peito abre e mostra o núcleo; golpes por trás levam 50% a mais. A gravidade vai para cima e, a
     cada 12 s, vira 90° de novo (2 s antes as setas giram e um ronco sobe). Planta: o desenho do próximo arranjo aparece
     por 2 s e os módulos encaixam nele de uma vez.
   - Saiu ou morreu: a luta reinicia (arranjo inicial, gravidade para baixo, cubos somem, vida cheia).
   - Lendário: o Prumo do Arquiteto (acessório): +def, +vida, luz; sem empurrão; a queda de 6 blocos ou mais solta uma
     onda curta dos dois lados.
   Save: `arquiteto.dead`. Os blocos da sala não vão para o save enquanto ele vive (a sala é montada de novo ao
   carregar); depois da morte a sala fica no arranjo inicial e quebra como qualquer outra. */

const ARQ_L = layerBossLvl('antigos');
const ARQ = { hp: Math.round(330 * (1 + 0.3 * (ARQ_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (ARQ_L - 1))), xp: 560, p2: 0.6, p3: 0.25, swapEvery: 10, turnEvery: 12 };
ET.arquiteto = { name: 'O Arquiteto', w: 14, h: 40, hp: ARQ.hp, dmg: ARQ.dmg, xp: ARQ.xp, kb: 0, fly: true, phase: true, blood: '#e8f0ff', boss: true };
const ARQ_BASES = ['lanca_compasso', 'elmo_prumo', 'couraca_tesselas'];
const arqDrops = () => { DROPS.arquiteto = [['prumo_arquiteto', 1], ['min_ferro_estelar', 1, 6, 10], ['nucleo_estelar', 1, 2, 4], ['po_estelar', 1, 2, 5], ['pocao', 1, 2, 4]].filter(([id]) => ITEMS[id]); };
const arqState = { dead: false };
let arqBoss = null, arqMods = null, arqInit = null, arqChecked = false, arqAllow = false;
// os efeitos: réguas, prumos, compassos, esquadros (os blocos postos), a troca em andamento, a planta, o aviso do giro
const arqFx = { reguas: [], prumos: [], compassos: [], esquadros: [], troca: null, planta: null, giro: null, ondas: [] };

/* ---------- os 12 módulos (6 x 6; # = ladrilho). Todos de pé nas 4 gravidades: nada fecha um vão de 3 ---------- */
const ARQ_MOD_SRC = [
  ['vazio', '......|......|......|......|......|......'],
  ['piso', '......|......|......|......|......|######'],
  ['plataforma', '......|......|.####.|......|......|......'],
  ['pilar', '......|......|..##..|..##..|......|......'],
  ['L', '......|......|......|#.....|#.....|####..'],
  ['degraus', '......|....##|......|..##..|......|##....'],
  ['ponte', '......|......|......|######|......|......'],
  ['cantos', '#....#|......|......|......|......|#....#'],
  ['meia', '......|......|......|###...|###...|###...'],
  ['T', '......|.####.|..##..|......|......|......'],
  ['escada', '##....|......|..##..|......|....##|......'],
  ['cheio', '######|######|######|######|######|######']
];
const ARQ_MOD = ARQ_MOD_SRC.map(([, s]) => Uint8Array.from(s.replace(/\|/g, ''), c => c === '#' ? 1 : 0));
const ARQ_W = [0, 9, 4, 8, 7, 3, 5, 6, 4, 3, 4, 1];   // pesos do sorteio do arranjo (o vazio entra à força nas portas)
const arqRot6 = (m, q) => { let a = m; for (let k = 0; k < q; k++) { const b = new Uint8Array(36); for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) b[c * 6 + (5 - r)] = a[r * 6 + c]; a = b; } return a; };

/* ---------- a sala: onde fica, o mapa de sólidos de um arranjo, a busca do pulo ---------- */
const arqB = () => (typeof atBoss !== 'undefined' && atBoss) ? atBoss : null;
const arqRect = () => AT_GRAV.find(G => G.kind === 'arena') || null;
const arqI = (c, r) => { const B = arqB(); return (B.y0 + r) * WW + wrapX(B.x0 + c); };
function arqMap(mods) { const g = new Uint8Array(900); for (let k = 0; k < 25; k++) { const m = mods[k], gc = (k % 5) * 6, gr = ((k / 5) | 0) * 6; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (m[r * 6 + c]) g[(gr + r) * 30 + gc + c] = 1; } return g; }
// de pé em (x, y): a busca do pulo (o herói 1 x 3, sobe 3: o pulo dá 43 px, T = 12). Devolve os lugares alcançados
function arqReach(g, sx, sy) {
  const n = 30, S = (x, y) => x < 0 || x >= n || y < 0 || y >= n || g[y * n + x] === 1, ok = (x, y) => !S(x, y) && !S(x, y - 1) && !S(x, y - 2);
  const seen = new Uint8Array(n * n * 5), at = new Uint8Array(n * n), q = [];
  const push = (x, y, r) => { if (!ok(x, y)) return; if (S(x, y + 1)) r = 4; const k = (y * n + x) * 5 + r; if (seen[k]) return; seen[k] = 1; at[y * n + x] = 1; q.push(x, y, r); };
  let y = sy; while (y < n - 1 && !S(sx, y + 1)) y++; push(sx, y, 4);
  while (q.length) {
    const r = q.pop(), yy = q.pop(), x = q.pop(), gr = S(x, yy + 1);
    push(x - 1, yy, r === 4 && !gr ? 0 : r); push(x + 1, yy, r === 4 && !gr ? 0 : r);
    if (r > 0) push(x, yy - 1, r === 4 ? 2 : r - 1);
    if (!gr) push(x, yy + 1, 0);
  }
  return at;
}
// todo lugar de pé chega a todos os outros (basta: de um lugar de pé se chega a todos, e de todos se volta a ele)
function arqWalkable(g, from) {
  const n = 30, stand = [];
  for (let y = 2; y < n; y++) for (let x = 0; x < n; x++) if (!g[y * n + x] && !g[(y - 1) * n + x] && !g[(y - 2) * n + x] && (y === n - 1 || g[(y + 1) * n + x])) stand.push([x, y]);
  if (!stand.length) return false;
  const s0 = from || stand[0], A = arqReach(g, s0[0], s0[1]);
  for (const [x, y] of stand) if (!A[y * n + x]) return false;
  for (let k = 0; k < stand.length; k += 3) { const [x, y] = stand[k], Bk = arqReach(g, x, y); if (!Bk[s0[1] * n + s0[0]]) return false; }
  return true;
}
// conserta um arranjo: o módulo de cada lugar de pé que não se alcança (ou de onde não se volta) vira vazio, até a sala
// toda andar (nunca os módulos de keep, o do herói e o de baixo dele)
function arqRepair(mods, from, keep = new Set()) {
  mods = mods.slice();
  for (let pass = 0; pass < 25; pass++) {
    const g = arqMap(mods), n = 30, A = arqReach(g, from[0], from[1]); let bad = -1;
    for (let y = 2; y < n && bad < 0; y++) for (let x = 0; x < n && bad < 0; x++) {
      if (g[y * n + x] || g[(y - 1) * n + x] || g[(y - 2) * n + x] || !(y === n - 1 || g[(y + 1) * n + x])) continue;
      const k = ((Math.min(29, y + 1) / 6) | 0) * 5 + ((x / 6) | 0), kk = ((y / 6) | 0) * 5 + ((x / 6) | 0);
      if (!A[y * n + x] || !arqReach(g, x, y)[from[1] * n + from[0]]) bad = y + 1 < n && g[(y + 1) * n + x] && !keep.has(k) && mods[k] !== ARQ_MOD[0] ? k : !keep.has(kk) && mods[kk] !== ARQ_MOD[0] ? kk : -2;
    }
    if (bad === -1) return mods;
    if (bad === -2) return null;
    mods[bad] = ARQ_MOD[0];
  }
  return arqWalkable(arqMap(mods), from) ? mods : null;
}
// o arranjo inicial: sorteado pela semente e consertado; os módulos das portas (canto de baixo dos dois lados) e o do
// meio ficam vazios
function arqMakeInit() {
  const R = mulberry32(seed ^ 0x4a7c3), pick = () => { let tot = 0; for (const w of ARQ_W) tot += w; let r = R() * tot; for (let k = 0; k < ARQ_W.length; k++) { if (r < ARQ_W[k]) return k; r -= ARQ_W[k]; } return 0; };
  for (let tries = 0; tries < 400; tries++) {
    const ids = []; for (let k = 0; k < 25; k++) ids.push(k === 20 || k === 24 || k === 12 ? 0 : pick());
    if (ids.filter(i => i === 11).length > 1) continue;
    const mods = arqRepair(ids.map(i => ARQ_MOD[i]), [0, 29]);
    if (mods && mods.filter(m => m !== ARQ_MOD[0]).length >= 10) return mods;
  }
  return Array.from({ length: 25 }, () => ARQ_MOD[0]);
}
// escreve um arranjo na sala (o quadro de agora; sem save enquanto ele vive)
function arqWrite(mods) {
  const B = arqB(); if (!B) return;
  const g = arqMap(mods);
  for (let r = 0; r < 30; r++) for (let c = 0; c < 30; c++) { const i = arqI(c, r), t = g[r * 30 + c] ? AT_LADRILHO : AIR; tiles[i] = t; walls[i] = WAT_LAJE; if (agua.length) agua[i] = 0; if (!arqState.dead) diffs.delete(i); }
  for (let r = -1; r <= 30; r += 3) for (let c = -1; c <= 30; c += 3) markDirty(wrapX(B.x0 + c), B.y0 + r);
  if (typeof mapVer !== 'undefined') mapVer++;
}
// as portas: abertas (ar) ou fechadas pela Grade de Luz
function arqDoors(shut) {
  const B = arqB(); if (!B) return;
  for (const D of B.doors) for (let y = B.fy - 3; y < B.fy; y++) { const i = y * WW + wrapX(D.x); tiles[i] = shut ? AT_BARREIRA : AIR; walls[i] = WAT_LAJE; diffs.delete(i); markDirty(wrapX(D.x), y); }
}
// a sala da semente (o 295 chama depois do atAfter): a moldura de ladrilho, as portas, o arranjo inicial
function atDress() {
  const B = arqB(); if (!B) return;
  arqInit = arqMakeInit(); arqMods = arqInit.slice();
  arqWrite(arqMods);
  for (let y = B.y0 - 1; y <= B.fy; y++) for (const x of [B.x0 - 1, B.x0 + 30]) { const i = y * WW + wrapX(x); tiles[i] = AT_LADRILHO; atKeep.add(i); }
  for (let x = B.x0 - 1; x <= B.x0 + 30; x++) for (const y of [B.y0 - 1, B.fy]) { const i = y * WW + wrapX(x); tiles[i] = AT_LADRILHO; atKeep.add(i); }
  arqDoors(false);
  for (let r = 0; r < 30; r++) for (let c = 0; c < 30; c++) atKeep.add(arqI(c, r));
  const G = arqRect(); if (G) G.dir = 0;
}
// a sala está diferente da semente (um save velho, um bloco posto)?
function arqDiffers() { const g = arqMap(arqInit); for (let r = 0; r < 30; r++) for (let c = 0; c < 30; c++) if ((tiles[arqI(c, r)] === AT_LADRILHO) !== !!g[r * 30 + c]) return true; return false; }

/* ---------- onde está o herói, em módulos ---------- */
function arqHeroCell() {
  const B = arqB(), c = Math.floor(wdx(Math.floor((pl.x + pl.w / 2) / T) - B.x0)), r = Math.floor((pl.y + pl.h / 2) / T) - B.y0;
  return { c, r, k: c >= 0 && c < 30 && r >= 0 && r < 30 ? ((r / 6) | 0) * 5 + ((c / 6) | 0) : -1, foot: [clamp(c, 0, 29), clamp(Math.floor((pl.y + pl.h - 1) / T) - B.y0, 0, 29)] };
}
function arqHeroIn(m = 0) { const B = arqB(); if (!B || !pl) return false; const H = arqHeroCell(); return H.c >= -m && H.c < 30 + m && H.r >= -m && H.r < 30 + m; }
const arqLap = x => { const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
const arqX0 = () => arqLap(arqB().x0 * T), arqY0 = () => arqB().y0 * T;

/* ---------- as trocas: um arranjo novo com o módulo do herói parado, conferido antes ---------- */
// sorteia uma troca de n pares (nenhum envolve o módulo do herói nem o de baixo dele) que deixa a sala andável
function arqPlanSwap(n, R = Math.random) {
  const H = arqHeroCell(), keepK = new Set([H.k, H.k + 5]);
  for (let tries = 0; tries < 60; tries++) {
    const mods = arqMods.slice(), pairs = [];
    for (let j = 0; j < n; j++) {
      let a = (R() * 25) | 0, b = (R() * 25) | 0;
      if (a === b || keepK.has(a) || keepK.has(b) || pairs.some(([p, q]) => p === a || q === a || p === b || q === b) || mods[a] === mods[b]) continue;
      pairs.push([a, b]); const t = mods[a]; mods[a] = mods[b]; mods[b] = t;
    }
    if (!pairs.length) continue;
    if (arqWalkable(arqMap(mods), H.foot)) return { pairs, mods };
  }
  return null;
}
// depois de um giro: se a sala ficou sem saída para algum lado, uma troca acerta (com aviso curto)
function arqFixAfterTurn() {
  const H = arqHeroCell(); if (arqWalkable(arqMap(arqMods), H.foot)) return;
  const P = arqPlanSwap(3) || arqPlanSwap(5); if (P) { arqStartSwap(P, 0.6); return; }
  // nenhuma troca serve: os módulos sem saída se desmontam (viram vazio) no lugar
  const M = arqRepair(arqMods, H.foot, new Set([H.k, H.k + 5]));
  if (M) { const pairs = []; M.forEach((m, k) => { if (m !== arqMods[k]) pairs.push([k, k]); }); arqStartSwap({ pairs, mods: M }, 0.6); }
}
function arqStartSwap(P, warn = 1.5) { arqFx.troca = { pairs: P.pairs, mods: P.mods, warn, slide: 1.2, t: 0, moving: false }; }
function arqSwapTick(dt) {
  const S = arqFx.troca; if (!S) return;
  if (S.warn > 0) {
    S.warn -= dt;
    if (S.warn <= 0) {   // começa a deslizar: as casas de destino viram bloco em trânsito
      S.moving = true; sfx.arqTroca && sfx.arqTroca();
      for (const [a, b] of S.pairs) for (const k of [a, b]) { const gc = (k % 5) * 6, gr = ((k / 5) | 0) * 6; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) { const i = arqI(gc + c, gr + r); tiles[i] = AT_TRANSITO; diffs.delete(i); } }
      const B = arqB(); for (let r = -1; r <= 30; r += 3) for (let c = -1; c <= 30; c += 3) markDirty(wrapX(B.x0 + c), B.y0 + r);
    }
    return;
  }
  S.t += dt;
  if (S.t >= S.slide) { arqMods = S.mods; arqWrite(arqMods); arqFx.troca = null; shake(1.5); for (const e of enemies) if (!e.dead && (e === arqBoss || e.atMinion)) atUnstick(e, arqRect()); atUnstick(pl, arqRect()); }
}

/* ---------- a luta ---------- */
function arqSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; }
function arqStart() {
  arqDrops();
  const D = ET.arquiteto, B = arqB();
  const e = spawnEnemy('arquiteto', arqX0() + 15 * T - D.w / 2, arqY0() + 10 * T - D.h / 2, AT_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: ARQ_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, cd: 1.6, ph: 0, last: '', rep: 0, facing: 1, swapT: ARQ.swapEvery, turnT: ARQ.turnEvery, bobT: 0, arms: 0, open: 0, gx: 15 * T, gy: 10 * T, goalT: 2 });
  arqSet(e, 'intro', 1.6);
  arqBoss = e; bossFight = { e, arq: true };
  arqClearFx(); arqDoors(true);
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Arquiteto'; bn.lastChild.textContent = 'a régua que mede a cidade'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Arquiteto', 'a régua que mede a cidade');
  sfx.arqFase && sfx.arqFase(0.6); shake(2);
  void B;
}
function arqClearFx() {
  for (const W of arqFx.esquadros) arqEsquadroOff(W);
  for (const k of ['reguas', 'prumos', 'compassos', 'esquadros', 'ondas']) arqFx[k].length = 0;
  arqFx.troca = null; arqFx.planta = null; arqFx.giro = null;
}
// a sala volta à semente: gravidade para baixo (gira de volta sem animação), arranjo inicial
function arqResetRoom() {
  const G = arqRect(); if (!G) return;
  if (G.dir) { const was = atCam.t; atRotRect(G, G.dir, { noSave: !arqState.dead, skip: () => true }); atCam.t = was; atCam.a = 0; }
  G.dir = 0; arqMods = arqInit.slice(); arqWrite(arqMods);
}
function arqEnd(won) {
  const e = arqBoss; arqBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) if (m.atMinion && !m.dead) { burst(m.x + m.w / 2, m.y + m.h / 2, 10, '#b0bccc', 60, 100, 0.7); const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
  arqClearFx();
  const x = e ? e.x + e.w / 2 : arqX0() + 15 * T, y = e ? e.y + e.h / 2 : arqY0() + 15 * T;
  if (!won) {
    if (e) { const k = enemies.indexOf(e); if (k >= 0) enemies.splice(k, 1); e.dead = true; }
    // o herói, se ainda está dentro (morreu lá), sai antes de a sala girar de volta
    arqResetRoom(); arqDoors(false); return;
  }
  arqState.dead = true;
  arqResetRoom(); arqDoors(false);
  burst(x, y, 30, '#ffffff', 130, 40, 1.1, 1, true); burst(x, y, 20, '#4ac8d0', 100, -40, 1.2, 1, true); burst(x, y, 14, '#b4b8e8', 80, 0, 1, 1, true);
  // a base garantida (ficha 13, seção 8)
  const bases = ARQ_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.arqMorte && sfx.arqMorte();
  showBanner('Vitória', 'a régua para de medir');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.arq) return arqEnd(won); return _eb(won); }; }
// cada fase é vivida: o golpe só leva até o piso da fase
const arqFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * ARQ.p2) : e.ph === 1 ? Math.floor(e.maxHp * ARQ.p3) : 0;
const arqInvuln = e => e.state === 'intro' || e.state === 'virada' || e.state === 'abre';
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'arquiteto' && !e.dead) { const f = arqFloorHp(e); if (f > 0) { e.hp = f; return; } }
  return _k(e);
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && e.type === 'arquiteto' && !e.dead) {
    if (arqInvuln(e)) { burst(e.x + e.w / 2, e.y + e.h / 2, 4, '#e8f0ff', 40, 0, 0.3, 1, true); return; }
    // fase 3: o núcleo aberto, golpe por trás leva 50% a mais
    if (e.ph === 2 && melee) { const hx = pl.x + pl.w / 2, ex = e.x + e.w / 2; if (Math.abs(hx - ex) > 2 && Math.sign(hx - ex) !== e.facing) { mult = (mult || 1) * 1.5; burst(ex - e.facing * 4, e.y + 16, 8, '#f0f4ff', 70, 0, 0.4, 1, true); } }
    const r = _hit(e, dir, mult, melee); const f = arqFloorHp(e); if (f > 0 && e.hp < f) e.hp = f; return r;
  }
  return _hit(e, dir, mult, melee);
}; }
// nada da sala quebra enquanto ele vive
const arqLive = () => !!(arqB() && arqInit && !arqState.dead);
const arqInBox = (tx, ty) => { const B = arqB(); if (!B) return false; const dx = wdx(wrapX(tx) - B.x0); return dx >= -1 && dx <= 30 && ty >= B.y0 - 1 && ty <= B.fy; };
{ const _bt = breakTile; breakTile = function (tx, ty) { if (!arqAllow && arqLive() && arqInBox(tx, ty)) return; return _bt(tx, ty); }; }
{ const _pi = pickImpact; pickImpact = function (sx, sy, aim) {
  const tg = pl.target;
  if (tg && tg.inReach && arqLive() && arqInBox(tg.tx, tg.ty) && SOLID[tileAt(tg.tx, tg.ty)]) {
    sfx.tink(); burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 3, '#b0bccc', 40, 300, 0.3, 1, true);
    pl.target = Object.assign({}, tg, { dig: false });
    try { _pi(sx, sy, aim); } finally { pl.target = tg; }
    pl.digT = 0; pl.digX = -1;
    return;
  }
  return _pi(sx, sy, aim);
}; }
{ const _cp = canPlace; canPlace = function (tx, ty) { if (arqLive() && arqInBox(tx, ty)) return false; return _cp(tx, ty); }; }

/* ---------- o cérebro ---------- */
function arqPick(e, list) {
  let tot = 0; for (const [, w] of list) tot += w;
  for (let n = 0; n < 4; n++) {
    let r = Math.random() * tot, k = list[0][0]; for (const [s, w] of list) { if (r < w) { k = s; break; } r -= w; }
    if (k === e.last && e.rep >= 1 && list.length > 1) continue;
    e.rep = k === e.last ? e.rep + 1 : 0; e.last = k; return k;
  }
  return list[0][0];
}
AI.arquiteto = function (e, dt) {
  const B = arqB(); if (!B || !arqInit) { e.dead = true; return; }
  arqBrain(e, dt);
  e.vx = e.vy = 0;
};
function arqBrain(e, dt) {
  const X0 = arqX0(), Y0 = arqY0(), hx = pl.x + pl.w / 2, hy = pl.y + pl.h / 2;
  e.bobT += dt; e.arms = approach(e.arms, e.state === 'virada' || e.state === 'abre' ? 1 : 0, dt * 3); e.open = approach(e.open, e.ph >= 2 ? 1 : 0, dt * 1.5);
  if (Math.abs(hx - (e.x + e.w / 2)) > 4) e.facing = hx > e.x + e.w / 2 ? 1 : -1;
  // flutua devagar para um ponto do meio da sala, longe do herói
  e.goalT -= dt;
  if (e.goalT <= 0) { e.goalT = 2.5 + Math.random() * 2; const side = hx - X0 < 15 * T ? 1 : -1; e.gx = 15 * T + side * (4 + Math.random() * 6) * T; e.gy = (8 + Math.random() * 10) * T; }
  const tx = X0 + e.gx - e.w / 2, ty = Y0 + e.gy - e.h / 2 + Math.sin(e.bobT * 1.6) * 3;
  e.x += (tx - e.x) * Math.min(1, dt * 1.2); e.y += (ty - e.y) * Math.min(1, dt * 1.2);
  if (e.stateT > 0) e.stateT -= dt;
  if (e.state === 'intro') { if (e.stateT <= 0) arqSet(e, 'idle', 0); return; }
  // as viradas de fase
  if (e.ph === 0 && e.hp <= e.maxHp * ARQ.p2 && e.state !== 'virada') { e.ph = 1; arqSet(e, 'virada', 3.2); arqFx.reguas.length = arqFx.prumos.length = 0; const P = arqPlanSwap(4); if (P) arqStartSwap(P, 1.5); sfx.arqFase && sfx.arqFase(1); return; }
  if (e.ph === 1 && e.hp <= e.maxHp * ARQ.p3 && e.state !== 'abre') { e.ph = 2; arqSet(e, 'abre', 2.6); arqGiroAviso(2); sfx.arqFase && sfx.arqFase(1.4); for (const m of enemies) if (m.atMinion && !m.dead) m.hp = 0; return; }
  if (e.state === 'virada') {
    // depois que os módulos encaixam, a gravidade vai para a esquerda; depois, os dois cubos
    if (!arqFx.troca && !e.turned) { e.turned = true; atRotRect(arqRect(), 3, { noSave: true }); sfx.arqGiro && sfx.arqGiro(); arqFixAfterTurn(); }
    if (e.stateT <= 0 && !arqFx.troca) { e.turned = false; arqSet(e, 'idle', 0); arqCubos(e); e.cd = 1.4; }
    return;
  }
  if (e.state === 'abre') { if (e.stateT <= 0) { arqSet(e, 'idle', 0); e.cd = 1; e.turnT = ARQ.turnEvery; } return; }
  // fase 2: uma troca a cada 10 s; fase 3: o giro a cada 12 s (o aviso começa 2 s antes)
  if (e.ph === 1 && !arqFx.troca) { e.swapT -= dt; if (e.swapT <= 0) { e.swapT = ARQ.swapEvery; const P = arqPlanSwap(1); if (P) arqStartSwap(P, 1.5); } }
  if (e.ph === 2 && !arqFx.giro) { e.turnT -= dt; if (e.turnT <= 2) { arqGiroAviso(2); e.turnT = ARQ.turnEvery; } }
  e.cd -= dt;
  if (e.cd > 0 || arqFx.troca || arqFx.planta) return;
  const list = e.ph === 0 ? [['regua', 4], ['esquadro', 3], ['prumo', 3]] : e.ph === 1 ? [['compasso', 4], ['regua', 3], ['prumo', 3]] : [['planta', 3], ['regua', 3], ['prumo', 3], ['compasso', 2]];
  const k = arqPick(e, list);
  if (k === 'regua') arqRegua();
  else if (k === 'prumo') arqPrumo();
  else if (k === 'esquadro') arqEsquadro();
  else if (k === 'compasso') arqCompasso(e);
  else if (k === 'planta') { const P = arqPlanSwap(5); if (P) arqFx.planta = { t: 2, P }; }
  e.cd = e.ph === 0 ? 2.1 : e.ph === 1 ? 1.8 : 1.6;
}
// os dois cubos errantes (294) com meia vida
function arqCubos(e) {
  if (typeof at2Cubo !== 'function' || !ET.cuboerrante) return;
  const X0 = arqX0(), Y0 = arqY0();
  for (const c of [8, 22]) {
    atSpawnLivre = true; const m = at2Cubo(X0 + c * T - 12, Y0 + 3 * T, 0, AT_ZONE0 + 3, true); atSpawnLivre = false; if (!m) continue;
    m.atMinion = true; m.lvl = ARQ_L - 2; atUnstick(m, arqRect());
    burst(m.x + 12, m.y + 12, 12, '#4ac8d0', 60, 0, 0.5, 1, true);
  }
}

/* ---------- os golpes ---------- */
// Régua: a linha de parede a parede na altura do herói (0,8 s), depois a lâmina corre por ela
function arqRegua() { const Y0 = arqY0(), y = clamp(pl.y + pl.h - 6, Y0 + 4, Y0 + 30 * T - 4), dir = Math.random() < 0.5 ? 1 : -1; arqFx.reguas.push({ y, warn: 0.8, t: 0, dir, hit: false }); sfx.arqRisco && sfx.arqRisco(); }
// Prumo: o fio desce do teto sobre o herói (0,8 s) e o peso cai por ele
function arqPrumo() { const X0 = arqX0(), x = clamp(pl.x + pl.w / 2, X0 + 4, X0 + 30 * T - 4); arqFx.prumos.push({ x, warn: 0.8, y: arqY0(), vy: 0, hit: false, done: false }); sfx.arqRisco && sfx.arqRisco(); }
// Compasso: um círculo riscado em volta do herói (1 s); depois o anel queima
function arqCompasso(e) { const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2; arqFx.compassos.push({ cx, cy, r: 26 + Math.random() * 14, warn: 1, burn: 0.45, hit: false, a: 0 }); sfx.arqRisco && sfx.arqRisco(); void e; }
// Esquadro: dois muros em L sobem do chão em volta do herói; o contorno aparece antes (1 s); prendem 4 s e somem
function arqEsquadro() {
  const B = arqB(), fc = Math.floor(wdx(Math.floor((pl.x + pl.w / 2) / T) - B.x0)), fr = Math.floor((pl.y + pl.h - 1) / T) - B.y0;
  const cells = [];
  for (const s of [-1, 1]) {
    const x = fc + s * 2;
    for (let k = 0; k < 4; k++) cells.push([x, fr - k]);
    cells.push([x - s, fr - 3]);   // o braço do L, por cima
  }
  const ok = cells.filter(([c, r]) => c >= 0 && c < 30 && r >= 0 && r < 30 && tiles[arqI(c, r)] === AIR);
  if (ok.length) arqFx.esquadros.push({ cells: ok, warn: 1, life: 4, on: false });
}
function arqEsquadroOn(W) { for (const [c, r] of W.cells) { const i = arqI(c, r); if (tiles[i] === AIR) { tiles[i] = AT_LADRILHO; diffs.delete(i); markDirty(wrapX(arqB().x0 + c), arqB().y0 + r); } } W.on = true; }
function arqEsquadroOff(W) { if (!W.on) return; for (const [c, r] of W.cells) { const i = arqI(c, r); if (tiles[i] === AT_LADRILHO) { tiles[i] = AIR; diffs.delete(i); markDirty(wrapX(arqB().x0 + c), arqB().y0 + r); } } W.on = false; }
// o aviso do giro (fase 3): as setas giram junto e um ronco sobe; no fim, a sala gira 90° (a gravidade no relógio)
function arqGiroAviso(t) { arqFx.giro = { t, max: t }; sfx.arqRonco && sfx.arqRonco(t); }
const arqHitPl = (x, y, r) => !pl.dead && x > pl.x - r && x < pl.x + pl.w + r && y > pl.y - r && y < pl.y + pl.h + r;
function arqFxTick(dt) {
  const e = arqBoss, X0 = arqX0(), Y0 = arqY0(), W = 30 * T, dmg = e ? e.dmg : ARQ.dmg;
  for (let k = arqFx.reguas.length - 1; k >= 0; k--) {
    const R = arqFx.reguas[k];
    if (R.warn > 0) { R.warn -= dt; continue; }
    R.t += dt; const bx = R.dir > 0 ? X0 + R.t / 0.45 * W : X0 + W - R.t / 0.45 * W;
    if (!R.hit && Math.abs(pl.x + pl.w / 2 - bx) < 8 && pl.y < R.y + 3 && pl.y + pl.h > R.y - 3) { R.hit = true; hurtPlayer(Math.round(dmg * 0.9), bx - R.dir * 10, null, true); }
    if (R.t >= 0.45) arqFx.reguas.splice(k, 1);
  }
  for (let k = arqFx.prumos.length - 1; k >= 0; k--) {
    const P = arqFx.prumos[k];
    if (P.warn > 0) { P.warn -= dt; continue; }
    if (P.done) { P.life -= dt; if (P.life <= 0) arqFx.prumos.splice(k, 1); continue; }
    P.vy += 1400 * dt; P.y += P.vy * dt;
    if (!P.hit && arqHitPl(P.x, P.y, 3)) { P.hit = true; hurtPlayer(Math.round(dmg * 1.1), P.x, null, true); }
    if (solidAt(Math.floor(P.x / T), Math.floor((P.y + 4) / T)) || P.y > Y0 + W) { P.done = true; P.life = 0.4; burst(P.x, P.y, 10, '#e8ffff', 70, 200, 0.5, 1, true); shake(1.5); sfx.arqPeso && sfx.arqPeso(); }
  }
  for (let k = arqFx.compassos.length - 1; k >= 0; k--) {
    const C = arqFx.compassos[k];
    if (C.warn > 0) { C.warn -= dt; C.a = 1 - C.warn; continue; }
    C.burn -= dt;
    const d = Math.hypot(pl.x + pl.w / 2 - C.cx, pl.y + pl.h / 2 - C.cy);
    if (!C.hit && Math.abs(d - C.r) < 7) { C.hit = true; hurtPlayer(Math.round(dmg * 0.8), C.cx, null, true); }
    if (C.burn <= 0) arqFx.compassos.splice(k, 1);
  }
  for (let k = arqFx.esquadros.length - 1; k >= 0; k--) {
    const Q = arqFx.esquadros[k];
    if (Q.warn > 0) { Q.warn -= dt; if (Q.warn <= 0) { arqEsquadroOn(Q); atUnstick(pl, arqRect()); sfx.arqPeso && sfx.arqPeso(); } continue; }
    Q.life -= dt; if (Q.life <= 0) { arqEsquadroOff(Q); arqFx.esquadros.splice(k, 1); }
  }
  if (arqFx.planta) { const P = arqFx.planta; P.t -= dt; if (P.t <= 0) { arqFx.planta = null; arqStartSwap(P.P, 0); } }
  if (arqFx.giro) {
    const G = arqFx.giro; G.t -= dt;
    if (G.t <= 0) {
      arqFx.giro = null;
      for (const Q of arqFx.esquadros) arqEsquadroOff(Q); arqFx.esquadros.length = 0;
      arqFx.reguas.length = 0; arqFx.prumos.length = 0; arqFx.compassos.length = 0;
      atRotRect(arqRect(), 3, { noSave: true }); sfx.arqGiro && sfx.arqGiro(); shake(3);
      arqFixAfterTurn();
    }
  }
  arqSwapTick(dt);
}

/* ---------- o lendário: o Prumo do Arquiteto ---------- */
STAT_DEF.lgPrumo = { t: 'Golpes não te empurram; cair de 6 blocos ou mais solta uma onda dos dois lados', flag: 1 };
STAT_KEYS.push('lgPrumo');
ICON_ART.atPrumoL = [["....kk....", "...kWWk...", "....kk....", "....cc....", "...cCCc...", "..cCWWCc..", ".cCWWCCCc.", "..cCCCCc..", "...cCCc...", "....cc...."], { k: '#56606e', W: '#e8ffff', c: '#145058', C: '#4ac8d0' }];
ITEMS.prumo_arquiteto = {
  name: 'Prumo do Arquiteto', slot: 'acc', rar: 4, icon: 'atPrumoL', def: 6, hp: 24,
  legend: [['lgPrumo', 1], ['light', 1], ['def', 3]],
  desc: 'O peso que o Arquiteto usava para saber onde é o baixo. Na sua mão, o baixo é você quem decide.'
};
BASE_INFO.prumo_arquiteto = [ARQ_L];
ITEM_G.prumo_arquiteto = 0; ITEMS.prumo_arquiteto.g = 0;
arqDrops();
let arqPrumoOn = false;
function atPrumoEquip() { return arqPrumoOn; }
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgPrumo || 0;
  arqPrumoOn = b > 0;
  return r;
}; }
// sem empurrão: o golpe acerta, mas a velocidade do herói fica como estava
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  if (!arqPrumoOn) return _hp.apply(this, arguments);
  const vx = pl.vx, vy = pl.vy, r = _hp.apply(this, arguments);
  if (r === 'hit' || r === 'block') { pl.vx = vx; pl.vy = vy; }
  return r;
}; }
// o pouso pesado: de 6 blocos ou mais, uma onda curta de cada lado
const arqFall = { top: null };
HOOK.update.push(dt => {
  if (!pl || pl.dead || state !== 'play') return;
  if (!pl.onGround && !pl.climb) { if (arqFall.top === null || pl.y < arqFall.top) arqFall.top = pl.y; }
  else {
    if (arqPrumoOn && arqFall.top !== null && pl.y - arqFall.top >= 6 * T) {
      const fx = pl.x + pl.w / 2, fy = pl.y + pl.h;
      arqFx.ondas.push({ x: fx, y: fy - 2, t: 0 }); shake(2);
      for (const e of enemies) if (!e.dead && Math.abs(e.x + e.w / 2 - fx) < 4 * T && Math.abs(e.y + e.h - fy) < 2 * T) hitEnemy(e, e.x + e.w / 2 > fx ? 1 : -1, 0.8, false);
    }
    arqFall.top = null;
  }
  for (let k = arqFx.ondas.length - 1; k >= 0; k--) { arqFx.ondas[k].t += dt; if (arqFx.ondas[k].t > 0.4) arqFx.ondas.splice(k, 1); }
});

/* ---------- o desenho do Arquiteto: alto e fino, laje e luz, sem pernas, quatro braços (régua, esquadro, compasso,
   prumo); na fase 3 o peito abre e mostra o núcleo branco ---------- */
DRAW_E.arquiteto = () => {};   // desenhado no HOOK.drawWorld, por cima da sala
const ARQ_P = { k: '#0e1218', d: '#262c36', m: '#3a4250', l: '#56606e', L: '#7c8898', h: '#b0bccc', g: '#145058', G: '#2a8a94', c: '#4ac8d0', C: '#9af0f0', w: '#e8ffff', s: '#f0f4ff' };
function arqDrawBody(e, x, y) {
  // x, y: o centro de cima da cabeça, em pixels da tela
  const P = ARQ_P, f = e.facing, t = gameTime, R = (a, b, w, h, c) => { lc.fillStyle = c; lc.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
  const hov = Math.sin(t * 2.2) * 1;
  // a cauda de luz no lugar das pernas
  for (let k = 0; k < 10; k++) { lc.globalAlpha = 0.6 - k * 0.05; R(-2 + (k > 5 ? 1 : 0), 30 + k + hov, 5 - (k > 5 ? 2 : 0), 1, k % 3 ? P.c : P.C); }
  lc.globalAlpha = 1;
  // o corpo: um prisma de laje, estreito, com juntas retas
  R(-4, 9, 9, 22, P.k); R(-3, 10, 7, 20, P.m); R(-3, 10, 2, 20, P.L); R(2, 10, 2, 20, P.d);
  for (let j = 14; j < 30; j += 5) R(-3, j, 7, 1, P.d);
  // o peito: o glifo aceso; na fase 3 abre e mostra o núcleo
  if (e.open > 0.05) { const o = Math.round(e.open * 2); R(-2 - o, 15, 5 + o * 2, 6, P.k); R(-1, 16, 3, 4, P.s); R(0, 17, 1, 2, '#ffffff'); }
  else { R(-1, 16, 3, 3, P.G); R(0, 17, 1, 1, P.C); }
  // a cabeça: um cubo girado com um olho de risco
  R(-3, 0, 7, 8, P.k); R(-2, 1, 5, 6, P.l); R(-2, 1, 5, 1, P.h); R(-1 + (f > 0 ? 1 : 0), 3, 3, 1, P.C);
  // a coroa de régua: um traço fino acima da cabeça
  R(-5, -2, 11, 1, P.c); lc.globalAlpha = 0.5; R(-5, -3, 11, 1, P.C); lc.globalAlpha = 1;
  // os quatro braços: dois de cima seguram régua e prumo; dois de baixo, esquadro e compasso. Levantam na virada
  const up = e.arms, sw = Math.sin(t * 1.4) * 1.5;
  const arm = (side, row, len, tool) => {
    const ax = side * 5, ay = row, ex = ax + side * (len - up * 2), ey = ay + 6 - up * (14 + row * 0.2) + sw * (row > 14 ? -1 : 1);
    const n = 6; for (let k = 0; k <= n; k++) R(ax + (ex - ax) * k / n, ay + (ey - ay) * k / n, 2, 2, k === n ? P.h : P.l);
    if (tool === 'regua') { R(ex - 1, ey - 9, 2, 12, P.h); for (let k = 0; k < 4; k++) R(ex + 1, ey - 8 + k * 3, 1, 1, P.d); }
    else if (tool === 'prumo') { R(ex, ey + 2, 1, 5, P.C); R(ex - 1, ey + 7, 3, 3, P.c); R(ex, ey + 8, 1, 1, P.w); }
    else if (tool === 'esquadro') { R(ex - 1, ey, 2, 8, P.h); R(ex - 1, ey + 6, 7 * side, 2, P.h); }
    else { R(ex - 1, ey, 1, 8, P.L); R(ex + side * 3, ey, 1, 8, P.L); R(ex, ey - 1, 3 * side, 2, P.h); }
  };
  arm(f, 11, 6, 'regua'); arm(-f, 11, 6, 'prumo'); arm(f, 18, 5, 'esquadro'); arm(-f, 18, 5, 'compasso');
}
HOOK.drawWorld.push((cx, cy) => {
  if (!ANTIGOS) return;
  const B = arqB(); if (!B || !arqInit) return;
  const X0 = arqX0() - cx, Y0 = arqY0() - cy, W = 30 * T;
  if (X0 > VW + 40 || X0 + W < -40 || Y0 > VH + 40 || Y0 + W < -40) return;
  // as linhas da grade dos módulos, quase apagadas (a planta da sala)
  lc.globalAlpha = 0.12; lc.fillStyle = '#4ac8d0';
  for (let k = 1; k < 5; k++) { lc.fillRect(X0 + k * 6 * T, Y0, 1, W); lc.fillRect(X0, Y0 + k * 6 * T, W, 1); }
  lc.globalAlpha = 1;
  // a troca: bordas acesas e setas no aviso; as imagens deslizando
  const S = arqFx.troca;
  if (S) {
    if (S.warn > 0) {
      const a = 0.5 + 0.5 * Math.abs(Math.sin(gameTime * 10));
      for (const [p, q] of S.pairs) for (const [from, to] of [[p, q], [q, p]]) {
        const fx = X0 + (from % 5) * 6 * T, fy = Y0 + ((from / 5) | 0) * 6 * T;
        lc.globalAlpha = a; lc.strokeStyle = '#9af0f0'; lc.lineWidth = 1; lc.strokeRect(fx + 0.5, fy + 0.5, 6 * T - 1, 6 * T - 1);
        const tx = X0 + (to % 5) * 6 * T, ty = Y0 + ((to / 5) | 0) * 6 * T, mx = fx + 3 * T, my = fy + 3 * T, dx = tx - fx, dy = ty - fy, L = Math.hypot(dx, dy) || 1;
        lc.globalAlpha = a * 0.8; lc.fillStyle = '#e8ffff';
        for (let k = 0; k < 12; k++) lc.fillRect(Math.round(mx + dx / L * k * 2), Math.round(my + dy / L * k * 2), 1, 1);
        atDrawArrow(Math.round(mx + dx / L * 26), Math.round(my + dy / L * 26), Math.atan2(dy, dx) - Math.PI / 2, '#e8ffff', a);
      }
      lc.globalAlpha = 1;
    } else {
      const k = Math.min(1, S.t / S.slide), e = k * k * (3 - 2 * k);
      for (const [p, q] of S.pairs) for (const [from, to] of [[p, q], [q, p]]) {
        const m = arqMods[from], fx = X0 + (from % 5) * 6 * T, fy = Y0 + ((from / 5) | 0) * 6 * T, tx = X0 + (to % 5) * 6 * T, ty = Y0 + ((to / 5) | 0) * 6 * T, x = Math.round(lerp(fx, tx, e)), y = Math.round(lerp(fy, ty, e));
        for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (m[r * 6 + c]) { lc.fillStyle = '#3a4250'; lc.fillRect(x + c * T, y + r * T, T, T); lc.fillStyle = '#7c8898'; lc.fillRect(x + c * T, y + r * T, T, 1); lc.fillRect(x + c * T, y + r * T, 1, T); lc.fillStyle = '#4ac8d0'; lc.fillRect(x + c * T + 3, y + r * T + 3, 2, 2); }
        lc.globalAlpha = 0.6; lc.strokeStyle = '#9af0f0'; lc.strokeRect(x + 0.5, y + 0.5, 6 * T - 1, 6 * T - 1); lc.globalAlpha = 1;
      }
    }
  }
  // a planta: o desenho fantasma do próximo arranjo
  if (arqFx.planta) {
    const g = arqMap(arqFx.planta.P.mods); lc.globalAlpha = 0.25 + 0.15 * Math.sin(gameTime * 8); lc.strokeStyle = '#e8ffff'; lc.lineWidth = 1;
    for (let r = 0; r < 30; r++) for (let c = 0; c < 30; c++) if (g[r * 30 + c]) lc.strokeRect(X0 + c * T + 0.5, Y0 + r * T + 0.5, T - 1, T - 1);
    lc.globalAlpha = 1;
  }
  // o contorno dos esquadros antes de subir
  for (const Q of arqFx.esquadros) if (Q.warn > 0) { lc.globalAlpha = 0.5 + 0.4 * Math.sin(gameTime * 14); lc.strokeStyle = '#ff4a5a'; for (const [c, r] of Q.cells) lc.strokeRect(X0 + c * T + 0.5, Y0 + r * T + 0.5, T - 1, T - 1); lc.globalAlpha = 1; }
  // as Setas de Prumo (296) nas quatro paredes; no aviso do giro elas giram
  const G = arqRect(); if (G) atRectArrows(G, arqFx.giro ? arqFx.giro.t : 0, arqFx.giro ? arqFx.giro.max : 1, cx, cy);
  // o Arquiteto parado (antes da luta) ou lutando
  const e = arqBoss;
  if (!arqState.dead) {
    const E = e || { x: arqX0() + 15 * T - 7, y: arqY0() + 10 * T - 20 + Math.sin(gameTime * 1.2) * 2, w: 14, h: 40, facing: 1, arms: 0, open: 0, hurt: 0 };
    const x = Math.round(E.x + E.w / 2) - cx, y = Math.round(E.y) - cy;
    if (e && e.hurt > 0) lc.globalAlpha = 0.7;
    arqDrawBody(E, x, y); lc.globalAlpha = 1;
  }
});
HOOK.drawTop.push((cx, cy) => {
  if (!ANTIGOS || !arqB() || !arqInit) return;
  const X0 = arqX0() - cx, Y0 = arqY0() - cy, W = 30 * T;
  for (const R of arqFx.reguas) {
    const y = Math.round(R.y) - cy;
    if (R.warn > 0) { lc.globalAlpha = 0.4 + 0.5 * (1 - R.warn / 0.8); lc.fillStyle = '#e8ffff'; for (let x = 0; x < W; x += 2) lc.fillRect(X0 + x, y, 1, 1); for (let x = 0; x < W; x += 6 * T) lc.fillRect(X0 + x, y - 2, 1, 5); lc.globalAlpha = 1; continue; }
    const bx = R.dir > 0 ? X0 + R.t / 0.45 * W : X0 + W - R.t / 0.45 * W;
    lc.fillStyle = '#9af0f0'; lc.fillRect(Math.round(bx) - 6, y - 1, 12, 3); lc.fillStyle = '#ffffff'; lc.fillRect(Math.round(bx) - 4, y, 8, 1);
    lc.globalAlpha = 0.5; lc.fillStyle = '#4ac8d0'; lc.fillRect(R.dir > 0 ? X0 : Math.round(bx), y, Math.round(R.dir > 0 ? bx - X0 : X0 + W - bx), 1); lc.globalAlpha = 1;
  }
  for (const P of arqFx.prumos) {
    const x = Math.round(P.x) - cx;
    if (P.warn > 0) { lc.globalAlpha = 0.5 + 0.4 * (1 - P.warn / 0.8); lc.fillStyle = '#e8ffff'; for (let y = Y0; y < Y0 + W; y += 2) lc.fillRect(x, y, 1, 1); lc.globalAlpha = 1; continue; }
    const y = Math.round(P.y) - cy;
    lc.fillStyle = '#9af0f0'; lc.fillRect(x, Y0, 1, y - Y0 - 4);
    lc.fillStyle = '#145058'; lc.fillRect(x - 3, y - 5, 7, 6); lc.fillStyle = '#4ac8d0'; lc.fillRect(x - 2, y - 4, 5, 4); lc.fillStyle = '#e8ffff'; lc.fillRect(x - 1, y - 3, 1, 2); lc.fillRect(x, y + 1, 1, 2);
  }
  for (const C of arqFx.compassos) {
    const x = C.cx - cx, y = C.cy - cy, n = 64, a = C.warn > 0 ? C.a : 1;
    lc.fillStyle = C.warn > 0 ? '#e8ffff' : '#9af0f0'; lc.globalAlpha = C.warn > 0 ? 0.7 : 0.9;
    for (let k = 0; k < n * a; k++) { const t = k / n * Math.PI * 2; lc.fillRect(Math.round(x + Math.cos(t) * C.r), Math.round(y + Math.sin(t) * C.r), C.warn > 0 ? 1 : 2, C.warn > 0 ? 1 : 2); }
    lc.globalAlpha = 1;
  }
  for (const O of arqFx.ondas) { const k = O.t / 0.4, x = O.x - cx, y = O.y - cy; lc.globalAlpha = 1 - k; lc.fillStyle = '#e8ffff'; for (const s of [-1, 1]) lc.fillRect(Math.round(x + s * k * 4 * T) - 2, Math.round(y) - 3, 4, 3); lc.globalAlpha = 1; }
});
HOOK.drawGlow.push((cx, cy) => {
  if (!ANTIGOS || arqState.dead || !arqB() || !arqInit) return;
  const e = arqBoss, x = (e ? e.x + e.w / 2 : arqX0() + 15 * T) - cx, y = (e ? e.y + 17 : arqY0() + 10 * T - 3) - cy;
  lc.globalAlpha = 0.45 + (e && e.open > 0.5 ? 0.3 : 0); lc.drawImage(SPR.glow.eyeC, x - 7, y - 7);
  if (e && e.open > 0.5) { lc.globalAlpha = 0.5; lc.drawImage(SPR.glow.level, x - 46, y - 46); }
  lc.globalAlpha = 1;
});

/* ---------- o turno: acordar, sair, a luta ---------- */
HOOK.update.push(dt => {
  const B = arqB(); if (!B || !arqInit || !pl || state !== 'play') return;
  if (arqState.dead) return;
  // um save velho deixou a sala diferente: volta para a semente (o herói, se estava dentro, vai para fora da porta)
  if (!arqChecked && !bossFight) {
    arqChecked = true;
    const G = arqRect(); if (G) G.dir = 0;
    if (arqDiffers()) {
      if (arqHeroIn(1)) { const D = B.doors[0]; pl.x = (D.x + D.side * 3) * T; pl.y = B.fy * T - pl.h - 0.01; pl.vx = pl.vy = 0; }
      arqMods = arqInit.slice(); arqWrite(arqMods); arqDoors(false);
    }
  }
  if (!bossFight && !pl.dead && arqHeroIn(0)) { const H = arqHeroCell(); if (H.c >= 1 && H.c <= 28) arqStart(); }
  const e = arqBoss;
  if (!e || !bossFight || !bossFight.arq) return;
  if (!pl.dead && !arqHeroIn(2)) { endBossFight(false); return; }
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
  arqFxTick(dt);
});

/* ---------- som: risco de giz de luz, o peso, a troca de pedra, o ronco do giro ---------- */
if (typeof tone === 'function' && typeof noise === 'function') Object.assign(sfx, {
  arqRisco() { tone(2400, 0.25, 'sine', 0.015, -600); noise(0.2, 0.012, 6000, 'highpass'); },
  arqPeso() { tone(70, 0.4, 'sine', 0.06, -30); noise(0.25, 0.04, 400, 'lowpass'); },
  arqTroca() { noise(1.1, 0.035, 300, 'lowpass'); tone(110, 1.1, 'triangle', 0.02, -20); },
  arqGiro() { tone(55, 0.9, 'sine', 0.06, 20); noise(0.8, 0.03, 200, 'lowpass'); },
  arqRonco(t) { tone(40, t, 'sine', 0.05, 30); },
  arqFase(v = 1) { tone(220, 1.2 * v, 'sine', 0.04, -80); tone(330, 1.0 * v, 'sine', 0.02, -110, 0.1); },
  arqMorte() { tone(440, 2.4, 'sine', 0.05, -220); tone(660, 2, 'sine', 0.025, -330, 0.1); noise(2, 0.04, 2400, 'bandpass', 0, 2); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.arquiteto = { dead: arqState.dead };
  // enquanto ele vive, a sala e a grade nunca vão para o save (ela é montada de novo ao carregar)
  if (!arqState.dead && o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([idx]) => !arqInBox(idx % WW, (idx / WW) | 0));
  return o;
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.arq) bossFight = null;
  arqBoss = null; arqChecked = false; arqClearFx();
  arqState.dead = !!(sv && sv.arquiteto && sv.arquiteto.dead);
  return _nw(sd, sv);
}; }
