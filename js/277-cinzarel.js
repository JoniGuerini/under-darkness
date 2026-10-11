'use strict';

/* ================= Cinzarel, o Dragão Ancião: o chefe do Covil do Dragão =================
   A Cratera do Tesouro (docs/camadas/11-covil-dragao.md, seção 7). O 275 reserva no Leito de Ouro uma caixa maciça de
   obsidiana de cx - 48 a cx + 47 e de top - 3 a fy + 3 em volta da tigela de 90 x 44 (dgBoss), traz os dois corredores
   de serviço por fora até door.x (4 de altura, chão em door.fy = top + 12) e chama dgDress; este arquivo escreve a
   cratera dentro dela pelo plano (czLayout), com escrita direta em tiles (nada vai para os diffs):
     - a cúpula de obsidiana rajada com a chaminé fechada no meio do teto (só a crosta brilha lá em cima);
     - o morro de ouro solto no meio, 3 picos (o do meio com 14 de altura, os dos lados com 8), encosta de no máximo
       um bloco por coluna (45 graus: o ouro fica parado até alguém acordá-lo);
     - de cada lado, do morro para fora: a borda de crosta, o fosso de magma (2 de fundo) partido por uma ilha de
       obsidiana, a borda de fora, a coluna de abrigo (3 de altura) e o vão encostado na parede;
     - a parede em degraus (prateleiras de 3 em 3), a costela de um dragão antigo (ossos que servem de degrau) e o
       balcão da porta, de onde desce a escada de cravos até o vão: sempre se volta para as duas portas;
     - os túneis das portas: as duas colunas de dentro da casca são onde a cortina de magma desce.
   Pisar no morro ou bater nele acorda Cinzarel (o primeiro golpe nele dormindo conta dobrado); as cortinas de magma
   (DG_CORTINA, queimam quem encosta) fecham as portas. Fora da luta nada da cratera quebra.
   Três fases, todo golpe com aviso:
     1. no chão (100% a 60%): mordida (o pescoço recua e a boca acende), varrida de cauda (vira as costas, a ponta da
        cauda sobe e balança 0,8 s), sopro em linha (o peito incha e o brilho sobe pela garganta, 1 s); o sopro derrete
        o ouro onde bate (dgMelt).
     2. voo e avalanche (60% a 25%): dá voltas na cratera e pousa num dos 3 picos ou numa coluna; o lugar ganha uma
        sombra que cresce e o ouro ali treme 1,2 s (dgQuake), e o pouso solta a avalanche. Entre um pouso e outro bate
        as asas no chão (poeira dourada antes): o vento empurra o herói 4 blocos.
     3. a cratera acorda (25% a 0): o fosso sobe um bloco a cada 20 s (até 4, lava escrita direto); ele se agarra na
        parede e cospe bolas de magma em arco (a boca acende uma vez por bola) que derretem o ouro onde caem; cansado,
        desce no pico do meio e dá o sopro varrido da esquerda para a direita (abre as asas e vira a cabeça antes).
   Sair da cratera (portal, teleporte) ou morrer refaz a cratera pelo plano (dgDress, dgGoldClear) e ele volta a dormir
   com a vida cheia. Na morte as cortinas abrem, o fosso baixa, o ouro quente endurece e o que mudou na cratera vai
   para os diffs (fica como terminou); solta a Escama de Cinzarel (escudo lendário: aparar fogo ou projétil não
   machuca e devolve uma labareda curta) e uma das três bases da camada. A morte fica salva (cinzarel.dead).
   Do 276 (ouro solto) usa dgQuake, dgMelt, dgGoldClear e DG_GOLD.dmg, sempre conferindo se existem.
   Encaixe como a Dama (256): dgDress, endBossFight, hitEnemy, killEnemy, breakTile, pickImpact, spawnEnemy,
   hurtPlayer, rawDamage, recalc, propLights, makeSave e newWorld embrulhados; o resto por AI/DRAW_E/HOOK.
   Carrega depois do 259 e antes do 49 (que escala ET). */

// nível pelo registro das camadas (129); números escritos como os dos monstros, o 49 escala
const CZ_L = layerBossLvl('dragao');
const CZQ = { hp: Math.round(330 * (1 + 0.3 * (CZ_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (CZ_L - 1))), xp: 560, p2: 0.6, p3: 0.25, riseEvery: 20, riseMax: 4 };
const czState = { dead: false };
ET.cinzarel = { name: 'Cinzarel, o Dragão Ancião', w: 60, h: 30, hp: CZQ.hp, dmg: CZQ.dmg, xp: CZQ.xp, kb: 0, fly: true, phase: true, blood: '#ffa020', boss: true };
const CZQ_DROPS = [['escama_cinzarel', 1], ['min_draconio', 1, 8, 12], ['escama_draco', 1, 3, 6], ['glandula_fogo', 1, 2, 4], ['moeda_antiga', 1, 4, 8], ['pocao', 1, 2, 4]];
const CZQ_BASES = ['dente_draco', 'couraca_escamas', 'elmo_chifre_serpe'];
const czDrops = () => { DROPS.cinzarel = CZQ_DROPS.filter(([id]) => ITEMS[id]); };
czDrops();
let czBoss = null, czPlan = null, czChecked = false, czGoldDmg0 = null;
const czFx = { seal: null, ray: null, balls: [], shadow: null, gust: null, rise: null, flames: [], burnT: 0, meltT: 0 };
// o dragão como ele aparece (dormindo ou lutando): o corpo em px locais, as juntas e o que acende
const czM = { x: 0, y: 0, f: 1, rot: 0, na: 1, nL: 0.9, ha: 0.45, jaw: 0, mouth: 0, chest: 0, throat: 0, tBase: -0.35, tCurl: -0.13, tSway: 0.03, tUp: 0, tLen: 1, wing: 0, wingA: 0, flap: 0, legF: -1.25, legH: -1, eye: 0, br: 0, sy: 1, sleep: 1, t: 0, heap: 0 };

/* ---------- geometria (i, j em blocos: i a partir de cx, j a partir do fundo fy; m é a distância ao meio) ---------- */
const CK_F = 0, CK_C = 1, CK_A = 2, CK_G = 3, CK_M = 4, CK_X = 5, CK_K = 6, CK_L = 7, CK_T = 8, CK_B = 9, CK_D = 10;   // fora, rocha, ar, ouro, magma, coluna, crosta, escada, túnel, cortina, enfeite
const CZ_FL = -3;   // a linha do chão da tigela (o topo sólido); o fosso é magma em -3 e -2
const czB = () => (typeof dgBoss !== 'undefined' && dgBoss) ? dgBoss : null;
const czLap = x => { const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
// o meio da tigela fica entre as colunas cx - 1 e cx (o ar vai de cx - 45 a cx + 44)
const czCX = () => czLap(czB().cx * T), czCY = () => czB().fy * T;
const czIdx = (i, j) => { const B = czB(); return (B.fy + j) * WW + wrapX(B.cx + i); };
const czMM = i => i < 0 ? -1 - i : i;
function czIJ(tx, ty) { const P = czPlan, B = czB(); if (!B || !P) return null; const i = wdx(wrapX(tx) - B.cx), j = ty - B.fy; return i >= P.I0 && i <= P.I1 && j >= P.J0 && j <= P.J1 ? [i, j] : null; }
const czInBox = (tx, ty) => !!czIJ(tx, ty);
const czLive = () => !!(czB() && czPlan && !czState.dead);
const czFight = () => !!(bossFight && bossFight.cz);
// o herói em px locais (pés)
function czHero() { const hx = pl.x + pl.w / 2 - czCX(), hy = pl.y + pl.h - czCY(); return { hx, hy, cy: hy - pl.h / 2 }; }
function czHeroIn(m = 0) { const P = czPlan, H = czHero(), i = Math.floor(H.hx / T), j = Math.floor((H.hy - 2) / T); return i >= P.AI0 - m && i <= P.AI1 + m && j >= P.JT - m && j <= -1 + m; }
function czDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
const czDirty = idx => markDirty(idx % WW, (idx / WW) | 0);
const czGold = t => t === DG_OURO_SOLTO || t === DG_OURO_DURO || t === DG_OURO_QUENTE;

/* ---------- o plano da cratera (o que dgDress escreve e o que o reinício devolve) ---------- */
function czLayout() {
  const B = czB(), HW = 45, AI0 = -HW, AI1 = HW - 1, JT = (B.top != null ? B.top : B.fy - (B.h || 44)) - B.fy;
  const I0 = AI0 - 3, I1 = AI1 + 3, J0 = JT - 3, J1 = 3, NX = I1 - I0 + 1, NY = J1 - J0 + 1, n = NX * NY;
  const t = new Uint16Array(n), w = new Uint8Array(n), k = new Uint8Array(n);
  const q = (i, j) => (j - J0) * NX + (i - I0), inb = (i, j) => i >= I0 && i <= I1 && j >= J0 && j <= J1;
  const set = (i, j, tt, kk) => { if (!inb(i, j)) return; const Q = q(i, j); t[Q] = tt; k[Q] = kk; };
  const kAt = (i, j) => inb(i, j) ? k[q(i, j)] : CK_F;
  const iOf = (m, s) => s < 0 ? -1 - m : m;   // a coluna da distância m no lado s
  const vn1 = (x, s, sc) => { const X = x / sc, a = Math.floor(X), f = X - a, kk = f * f * (3 - 2 * f); return lerp(hash2(a, 0, s), hash2(a + 1, 0, s), kk); };
  // a porta de cada lado: o chão do túnel (door.fy) em j
  const doorJ = s => { const D = (B.doors || []).find(d => (d.side || Math.sign(wdx(d.x - B.cx))) === s); return clamp((D && D.fy != null ? D.fy : B.top + 12) - B.fy, JT + 8, -14); };
  // 1. a caixa inteira de obsidiana
  for (let j = J0; j <= J1; j++) for (let i = I0; i <= I1; i++) set(i, j, DG_OBSIDIANA, CK_C);
  // 2. a cúpula: o ar de cada coluna desce do teto até o chão da tigela; o teto baixa para as beiradas
  const ceil = new Int16Array(NX);
  for (let i = AI0; i <= AI1; i++) {
    const m = czMM(i), s = i < 0 ? -1 : 1, jd = doorJ(s);
    let c = JT + Math.round(7 * Math.pow(m / 44, 2) + vn1(i + 60, 9101, 4) * 1.4 + (hash2(i, 1, 9102) < 0.16 ? 1 : 0));
    if (m >= 36) c = Math.min(c, jd - 5);                       // a boca da porta fica aberta
    if (m <= 2) c = JT - 1; if (m <= 1) c = JT - 2;             // a chaminé
    ceil[i - I0] = c;
    for (let j = c; j <= CZ_FL - 1; j++) set(i, j, AIR, CK_A);
  }
  // 3. o fundo, de dentro para fora: o morro, a borda, o fosso com a ilha, a borda de fora, a coluna, o vão
  const H = new Int8Array(24);   // altura do ouro por m, um lado de cada vez
  for (const s of [-1, 1]) {
    for (let m = 0; m <= 23; m++) H[m] = Math.max(0, 14 - m, 8 - Math.abs(m - 16));
    // um pouco de irregularidade sem passar de um bloco por coluna (o ouro não pode escorregar sozinho)
    for (let m = 3; m <= 22; m++) if (m !== 16 && hash2(m, s, 9111) < 0.3) H[m] = Math.max(1, H[m] - 1);
    for (let it = 0; it < 4; it++) for (let m = 1; m <= 23; m++) { if (H[m] > H[m - 1] + 1) H[m] = H[m - 1] + 1; if (H[m] < H[m - 1] - 1) H[m] = H[m - 1] - 1; }
    for (let m = 22; m >= 0; m--) if (H[m] < H[m + 1] - 1) H[m] = H[m + 1] - 1;
    for (let m = 0; m <= 35; m++) {
      const i = iOf(m, s);
      if (m <= 23) { for (let j = CZ_FL - H[m]; j <= CZ_FL - 1; j++) set(i, j, DG_OURO_SOLTO, CK_G); continue; }
      if (m <= 25 || m === 32 || m === 33) { for (let j = CZ_FL; j <= -1; j++) set(i, j, DG_CROSTA, CK_K); continue; }
      if (m === 26 || m === 27 || m === 30 || m === 31) { set(i, CZ_FL, DG_MAGMA, CK_M); set(i, CZ_FL + 1, DG_MAGMA, CK_M); set(i, -1, DG_CROSTA, CK_K); set(i, 0, DG_CROSTA, CK_K); continue; }
      if (m === 28 || m === 29) { for (let j = CZ_FL - 2; j <= -1; j++) set(i, j, DG_OBSIDIANA, CK_X); continue; }   // a ilha (2 acima do chão)
      for (let j = CZ_FL - 3; j <= -1; j++) set(i, j, DG_OBSIDIANA, CK_X);                                         // a coluna de abrigo (3)
    }
    // 4. a parede em degraus: o vão (36, 37) até a primeira prateleira, prateleiras de 3 em 3 indo para fora, a
    //    cavidade debaixo do balcão com as costelas, o balcão da porta (2 de grosso) e a escada de cravos na coluna 37
    const jd = doorJ(s), r1 = -9 + (hash2(1, s, 9121) < 0.5 ? 0 : -1), r2 = r1 - 3, r3 = r2 - 3;
    for (let j = jd; j <= -4; j++) {
      const e = j <= jd + 1 ? 37 : j > r1 ? 37 : j > r2 ? 39 : j > r3 ? 41 : 43;
      for (let m = 38; m <= 44; m++) { const i = iOf(m, s); if (m <= e) set(i, j, AIR, CK_A); else set(i, j, DG_OBSIDIANA, CK_C); }
    }
    // as costelas: ossos de um dragão antigo saindo do fundo da cavidade (degraus de 3 em 3 a partir da prateleira)
    for (let r = r3 - 2, n0 = 0; r > jd + 3 && n0 < 5; r -= 3, n0++) {
      for (let m = 41; m <= 43; m++) set(iOf(m, s), r, DG_OSSO, CK_C);
      if (kAt(iOf(40, s), r + 1) === CK_A) set(iOf(40, s), r + 1, DG_OSSO, CK_C);
    }
    for (let j = r3; j > jd + 1; j--) if ((j & 1) === 0 || hash2(j, s, 9122) < 0.3) set(iOf(44, s), j, DG_OSSO, CK_C);   // a espinha no fundo
    // a escada: do chão do vão até a altura do balcão
    for (let j = jd - 1; j <= CZ_FL - 1; j++) if (kAt(iOf(37, s), j) === CK_A) set(iOf(37, s), j, DG_ESCADA, CK_L);
    // o túnel da porta: atravessa a casca (45 a 47); as duas colunas de dentro são onde a cortina desce
    for (let m = 45; m <= 47; m++) for (let j = jd - 4; j <= jd - 1; j++) set(iOf(m, s), j, AIR, m <= 46 ? CK_B : CK_T);
    // os enfeites: a vela no balcão, moedas no vão, nas bordas e na primeira prateleira, escamas caídas no pé do morro
    const deco = (m, j, tt) => { const i = iOf(m, s); if (tt != null && kAt(i, j) === CK_A && kAt(i, j + 1) !== CK_A && kAt(i, j + 1) !== CK_M && kAt(i, j + 1) !== CK_L) set(i, j, tt, CK_D); };
    deco(41, jd - 1, DG_VELA); deco(36, CZ_FL - 1, DG_MOEDAS); deco(32 + (hash2(2, s, 9123) < 0.5 ? 0 : 1), CZ_FL - 1, DG_MOEDAS);
    deco(38, r1, DG_MOEDAS); deco(24, CZ_FL - 1, DG_ESCAMA); deco(43, r3, DG_ESCAMA);
  }
  // 5. a crosta da chaminé (brilha lá em cima) e ossos espalhados na beira da cúpula
  for (let i = AI0; i <= AI1; i++) {
    const m = czMM(i), c = ceil[i - I0];
    if (m <= 3) { for (let j = c - 1; j >= Math.max(J0, c - 2); j--) if (kAt(i, j) === CK_C) set(i, j, DG_CROSTA, CK_K); continue; }
    if (m >= 14 && m <= 40 && hash2(i, 7, 9131) < 0.22 && kAt(i, c - 1) === CK_C) set(i, c - 1, DG_OSSO, CK_C);
    if (m >= 20 && m <= 34 && (m + (i < 0 ? 0 : 3)) % 6 === 0) for (let d = 1; d <= 2; d++) if (kAt(i, c - d) === CK_C) set(i, c - d, DG_OSSO, CK_C);   // costelas no teto
  }
  // 6. as paredes de fundo: obsidiana; manchas de lava cordada escura no alto da cúpula
  for (let j = J0; j <= J1; j++) for (let i = I0; i <= I1; i++) {
    const Q = q(i, j); if (!k[Q]) continue;
    w[Q] = (k[Q] === CK_A || k[Q] === CK_L || k[Q] === CK_D) && j < -22 && hash2(i >> 2, j >> 2, 9141) > 0.6 ? WDG_LAVA : WDG_OBSIDIANA;
  }
  // onde ele pousa (px locais; o chão é lido na hora, o ouro muda) e a encosta que a queda acorda (i em blocos)
  const spots = [
    { k: 'pico', x: 0, q: [-12, 11] }, { k: 'pico', x: -16.5 * T, q: [-26, -8] }, { k: 'pico', x: 16.5 * T, q: [7, 25] },
    { k: 'col', x: -35 * T, q: [-24, -12] }, { k: 'col', x: 35 * T, q: [11, 23] }, { k: 'col', x: -29 * T, q: [-24, -12] }, { k: 'col', x: 29 * T, q: [11, 23] }
  ];
  const doors = [-1, 1].map(s => { const cells = []; for (let m = 45; m <= 46; m++) for (let j = doorJ(s) - 4; j <= doorJ(s) - 1; j++) cells.push([iOf(m, s), j]); return { s, jd: doorJ(s), cells }; });
  return { I0, I1, J0, J1, NX, NY, AI0, AI1, JT, t, w, k, ceil, spots, doors, peakY: (CZ_FL - 14) * T };
}
// grava o plano na caixa (chunks sujos, diffs da cratera apagados)
function czWrite() {
  const P = czPlan; if (!P) return;
  for (let Q = 0; Q < P.NX * P.NY; Q++) {
    if (!P.k[Q]) continue;
    const idx = czIdx(P.I0 + Q % P.NX, P.J0 + ((Q / P.NX) | 0));
    if (tiles[idx] !== P.t[Q] || walls[idx] !== P.w[Q]) { tiles[idx] = P.t[Q]; walls[idx] = P.w[Q]; czDirty(idx); }
    diffs.delete(idx);
  }
  mapVer++;
}
function czDiffers() { const P = czPlan; for (let Q = 0; Q < P.NX * P.NY; Q++) if (P.k[Q] && tiles[czIdx(P.I0 + Q % P.NX, P.J0 + ((Q / P.NX) | 0))] !== P.t[Q]) return true; return false; }

/* ---------- a construção (o 275 chama dgDress depois dos passos dele, com dgBoss preenchido) ---------- */
function dgDress() {
  if (!czB()) return;
  czPlan = czLayout();
  czWrite();
  const P = czPlan;
  for (let j = P.J0; j <= P.J1; j++) for (let i = P.I0; i <= P.I1; i++) dgKeep.add(czIdx(i, j));
  czIdleReset();
}

/* ---------- as cortinas de magma ---------- */
function czCellFree(i, j, pad = 0) {
  const r = { x: czCX() + i * T - pad, y: czCY() + j * T - pad, w: T + pad * 2, h: T + pad * 2 };
  if (!pl.dead && overlap(r, pl)) return false;
  for (const m of enemies) if (!m.dead && m.type !== 'cinzarel' && overlap(r, m)) return false;
  return true;
}
function czSeal() {
  if (czFx.seal) return;
  const cells = []; for (const D of czPlan.doors) for (const c of D.cells) cells.push(c);
  cells.sort((a, b) => a[1] - b[1] || Math.abs(b[0]) - Math.abs(a[0]));   // descem de cima para baixo
  czFx.seal = { t: 0, n: 0, cells };
  sfx.czCortina();
}
function czSealTick(dt) {
  const S = czFx.seal; if (!S) return;
  S.t += dt;
  while (S.n < S.cells.length && S.t > 0.05 * (S.n + 1)) {
    const [i, j] = S.cells[S.n]; if (!czCellFree(i, j)) break;
    S.n++;
    const idx = czIdx(i, j); if (SOLID[tiles[idx]]) continue;
    tiles[idx] = DG_CORTINA; czDirty(idx); mapVer++;
    const x = czCX() + (i + 0.5) * T, y = czCY() + (j + 0.5) * T;
    burst(x, y, 6, DG_COL.magma, 60, 200, 0.6, 1, true); burst(x, y, 3, DG_COL.brasa, 40, -40, 0.5, 1, true);
  }
}
// a cortina queima quem encosta (por fora ou por dentro): fogo, e um empurrão para longe dela
function czCurtainTouch() {
  const S = czFx.seal; if (!S || pl.dead || pl.invuln > 0) return;
  const r = { x: pl.x - 3, y: pl.y - 2, w: pl.w + 6, h: pl.h + 4 };
  for (let n = 0; n < S.n; n++) {
    const [i, j] = S.cells[n], x = czCX() + i * T, y = czCY() + j * T;
    if (!overlap(r, { x, y, w: T, h: T }) || tiles[czIdx(i, j)] !== DG_CORTINA) continue;
    const e = czBoss, d = Math.max(1, Math.round((e ? e.dmg : 10) * 0.5));
    czBurn(d, x + T / 2);
    pl.vx = (pl.x + pl.w / 2 < x + T / 2 ? -1 : 1) * 160;
    burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 10, DG_COL.magma, 70, 100, 0.5, 1, true);
    return;
  }
}

/* ---------- a luta ---------- */
function czSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; e.stateT0 = 0; }
// o dragão dormindo vira bicho quando o herói entra (para poder levar golpe), sem luta ainda
function czSpawnSleeping() {
  czDrops();
  const D = ET.cinzarel, e = spawnEnemy('cinzarel', czCX() + czM.x - D.w / 2, czCY() + czM.y - D.h / 2, -1);
  Object.assign(e, { boss: true, lvl: CZ_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, cd: 1.2, ph: 0, last: '', rep: 0, facing: czM.f, aim: 0, n: 0, wall: -1, volley: 0, spot: null, flyT: 0, hit: false, tailSide: 1 });
  czSet(e, 'sleep', 0);
  czBoss = e;
  czSync(e);
  return e;
}
function czWake(e, struck) {
  if (!e || e.state !== 'sleep') return;
  czSet(e, 'wake', 1.8); e.cd = 1.0;
  bossFight = { e, cz: true };
  czClearFx(); czSeal();
  if (typeof DG_GOLD !== 'undefined' && DG_GOLD) { if (czGoldDmg0 == null) czGoldDmg0 = DG_GOLD.dmg; DG_GOLD.dmg = Math.max(1, Math.round(e.dmg * 0.5)); }
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'Cinzarel'; bn.lastChild.textContent = 'o Dragão Ancião'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('Cinzarel', struck ? 'o dono acordou com o golpe' : 'o dono acordou');
  sfx.czRugido(1); shake(4);
}
function czClearFx() { czFx.seal = null; czFx.ray = null; czFx.balls.length = 0; czFx.shadow = null; czFx.gust = null; czFx.rise = null; czFx.burnT = 0; czFx.meltT = 0; }
function czEnd(won) {
  const e = czBoss; czBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  if (typeof DG_GOLD !== 'undefined' && DG_GOLD && czGoldDmg0 != null) { DG_GOLD.dmg = czGoldDmg0; czGoldDmg0 = null; }
  const seal = czFx.seal; czClearFx();
  if (typeof dgGoldClear === 'function') dgGoldClear();
  if (!won) {
    // a cratera volta ao plano: o ouro, o fosso, as cortinas; ele volta a dormir
    if (e) czDrop(e);
    czWrite(); czIdleReset();
    return;
  }
  czState.dead = true;
  const x = e ? e.x + e.w / 2 : czCX(), y = e ? e.y + e.h / 2 : czCY() - 10 * T;
  burst(x, y, 40, DG_COL.magma, 150, 60, 1.2, 1, true); burst(x, y, 24, DG_COL.ouro, 120, 200, 1.2, 1, true); burst(x, y, 30, '#3a3430', 110, 120, 1.4);
  // as cortinas abrem, o fosso baixa, o ouro quente endurece; o resto fica como terminou e vai para o save
  const P = czPlan;
  if (P) {
    for (let Q = 0; Q < P.NX * P.NY; Q++) {
      if (!P.k[Q]) continue;
      const idx = czIdx(P.I0 + Q % P.NX, P.J0 + ((Q / P.NX) | 0)), t0 = tiles[idx];
      let tt = t0;
      if (t0 === DG_CORTINA) tt = P.t[Q];
      else if (t0 === DG_MAGMA && P.t[Q] !== DG_MAGMA) tt = SOLID[P.t[Q]] ? AIR : P.t[Q];
      else if (t0 === DG_OURO_QUENTE) tt = DG_OURO_DURO;
      if (tt !== t0) { tiles[idx] = tt; czDirty(idx); }
      if (tiles[idx] !== P.t[Q]) diffs.set(idx, tiles[idx]); else diffs.delete(idx);
    }
    mapVer++;
    if (seal) for (const D of P.doors) for (const [i, j] of D.cells) burst(czCX() + (i + 0.5) * T, czCY() + (j + 0.5) * T, 4, '#3a3430', 50, -30, 0.8);
  }
  // uma das três bases da camada, garantida
  const bases = CZQ_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.czMorte();
  showBanner('Vitória', 'o tesouro não tem mais dono');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.cz) return czEnd(won); return _eb(won); }; }
// cada fase é vivida: o golpe só o leva até o piso da fase
const czFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * CZQ.p2) : e.ph === 1 ? Math.floor(e.maxHp * CZQ.p3) : 0;
const czInvuln = e => e.state === 'wake' || e.state === 'fase2' || e.state === 'fase3';
function czFloor(e) { const f = czFloorHp(e); if (f > 0 && e.hp < f) e.hp = f; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'cinzarel' && !e.dead) { const f = czFloorHp(e); if (f > 0) { e.hp = f; return; } }
  return _k(e);
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && e.type === 'cinzarel' && !e.dead) {
    if (czInvuln(e)) { burst(e.x + e.w / 2, e.y + e.h / 2, 5, DG_COL.magma, 50, 0, 0.3, 1, true); return; }
    // dormindo: o primeiro golpe conta dobrado e o acorda
    if (e.state === 'sleep') {
      const r = _hit(e, dir, (mult == null ? 1 : mult) * 2, melee);
      floatText(e.x + e.w / 2, e.y - 16, 'GOLPE FURTIVO', '#ffd050', 1.1);
      czFloor(e); czWake(e, true);
      return r;
    }
  }
  const r = _hit(e, dir, mult, melee);
  if (e && e.type === 'cinzarel') czFloor(e);
  return r;
}; }
// nada da cratera quebra enquanto ele vive (a picareta e as explosões passam por breakTile)
{ const _bt = breakTile; breakTile = function (tx, ty) { if (czLive() && czInBox(tx, ty)) return; return _bt(tx, ty); }; }
{ const _pi = pickImpact; pickImpact = function (sx, sy, aim) {
  const tg = pl.target;
  if (tg && tg.inReach && czLive() && czInBox(tg.tx, tg.ty) && SOLID[tileAt(tg.tx, tg.ty)]) {
    sfx.tink(); burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 3, DG_COL.ouro, 40, 300, 0.3, 1, true);
    pl.target = Object.assign({}, tg, { dig: false });
    try { _pi(sx, sy, aim); } finally { pl.target = tg; }
    pl.digT = 0; pl.digX = -1;
    return;
  }
  return _pi(sx, sy, aim);
}; }
// nenhum bicho nasce dentro da cratera enquanto ele vive
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type !== 'cinzarel' && zone !== -1 && czLive() && czInBox(Math.floor((px + e.w / 2) / T), Math.floor((py + e.h / 2) / T))) czDrop(e);
  return e;
}; }

/* ---------- o corpo: as juntas no espaço do corpo (virado para a direita, o meio do tronco em 0, 0) ---------- */
const CZ_NECK = [20, -9], CZ_FORE = [17, 7], CZ_HIND = [-15, 7], CZ_TAIL = [-28, 3], CZ_WING = [6, -12], CZ_NN = 7, CZ_TN = 14;
const CZ_STAND = 29;   // do meio do tronco até o chão, de pé
// do espaço do corpo para px locais, e o contrário
function czL(M, bx, by) { const c = Math.cos(M.rot), s = Math.sin(M.rot), x = bx * c - by * s, y = bx * s + by * c; return [M.x + M.f * x, M.y + y]; }
function czBody(M, vx, vy) { const x = M.f * vx, c = Math.cos(M.rot), s = Math.sin(M.rot); return [x * c + vy * s, -x * s + vy * c]; }
// um ângulo no espaço do corpo virado para o mundo
const czLA = (M, a) => M.f > 0 ? a + M.rot : Math.PI - (a + M.rot);
// as posições de tudo (no espaço do corpo) para este quadro
function czRig(M) {
  const R = { neck: [], tail: [] };
  // o pescoço: uma curva da base até a cabeça
  const L = 26 * M.nL, a = M.na, bx = CZ_NECK[0], by = CZ_NECK[1], hx = bx + Math.cos(a) * L, hy = by + Math.sin(a) * L;
  const ca = a - 0.55, cx = bx + Math.cos(ca) * L * 0.55, cy = by + Math.sin(ca) * L * 0.55;
  for (let k = 0; k < CZ_NN; k++) {
    const u = (k + 0.5) / CZ_NN, x = (1 - u) * (1 - u) * bx + 2 * (1 - u) * u * cx + u * u * hx, y = (1 - u) * (1 - u) * by + 2 * (1 - u) * u * cy + u * u * hy;
    const tx = 2 * (1 - u) * (cx - bx) + 2 * u * (hx - cx), ty = 2 * (1 - u) * (cy - by) + 2 * u * (hy - cy);
    R.neck.push({ x, y, a: Math.atan2(ty, tx), r: lerp(7.5, 5, u) });
  }
  R.head = { x: hx, y: hy, a: M.ha };
  const ch = Math.cos(M.ha), sh = Math.sin(M.ha);
  R.mouth = { x: hx + ch * 30, y: hy + sh * 30 };
  R.headC = { x: hx + ch * 14, y: hy + sh * 14 };
  // a cauda: corrente de gomos, cada um dobra um pouco (enrolar, balançar, a ponta que sobe)
  let x = CZ_TAIL[0], y = CZ_TAIL[1], d = Math.PI + M.tBase;
  const step = 4.6 * M.tLen;
  for (let k = 0; k < CZ_TN; k++) {
    const u = k / CZ_TN;
    d += M.tCurl + Math.sin(M.t * 2.6 - k * 0.55) * M.tSway * u + 0.2 * M.tUp * u * u;
    R.tail.push({ x, y, a: d, r: lerp(7, 2.3, u) });
    x += Math.cos(d) * step; y += Math.sin(d) * step;
  }
  R.tip = { x, y, a: d };
  return R;
}
// a caixa que leva golpe (px locais): o tronco e a cabeça
function czBox(M, R) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const add = (bx, by, r) => { const [x, y] = czL(M, bx, by); x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r); };
  add(-26, 0, 8); add(26, 0, 8); add(0, -12, 2); add(0, 12, 2); add(R.headC.x, R.headC.y, 9);
  return { x0, y0, x1, y1 };
}

/* ---------- o cérebro ---------- */
AI.cinzarel = function (e, dt) {
  if (!czB() || !czPlan) { e.dead = true; return; }
  czBrain(e, dt);
  czSync(e);
};
function czSync(e) {
  const M = czM, R = czRig(M), b = czBox(M, R), X = czCX(), Y = czCY();
  e.x = X + b.x0; e.y = Y + b.y0; e.w = Math.max(20, b.x1 - b.x0); e.h = Math.max(16, b.y1 - b.y0); e.vx = e.vy = 0; e.facing = M.f;
}
// o chão debaixo de x (px locais) a partir de y0: o topo do primeiro sólido
function czGround(x, y0) {
  const tx = Math.floor((czCX() + x) / T); let ty = Math.floor((czCY() + y0) / T);
  for (let m = 0; m < 60; m++, ty++) { const t = tileAt(tx, ty); if (SOLID[t] && t !== DG_CORTINA) return ty * T - czCY(); }
  return CZ_FL * T;
}
// o chão de um lugar de pouso: o mais alto dos 3 blocos debaixo do tronco
function czSpotGround(x) { let g = 1e9; for (const dx of [-T, 0, T]) g = Math.min(g, czGround(x + dx, (czPlan.JT + 4) * T)); return g; }
function czPick(e, list) {
  let tot = 0; for (const [, w] of list) tot += w;
  for (let n = 0; n < 4; n++) {
    let r = Math.random() * tot, k = list[0][0]; for (const [s, w] of list) { if (r < w) { k = s; break; } r -= w; }
    if (k === e.last && e.rep >= 1 && list.length > 1) continue;
    e.rep = k === e.last ? e.rep + 1 : 0; e.last = k; return k;
  }
  return list[0][0];
}
// as poses de base: cada junta anda até o alvo
const CZ_POSE = {
  sleep: { na: 1.0, nL: 0.9, ha: 0.45, tBase: -0.35, tCurl: -0.13, tSway: 0.03, wing: 0, legF: -1.25, legH: -1.0, eye: 0, tUp: 0, wingA: 0 },
  stand: { na: -0.8, nL: 1, ha: 0.15, tBase: 0.2, tCurl: -0.015, tSway: 0.16, wing: 0, legF: 0.05, legH: 0.05, eye: 1, tUp: 0, wingA: 0 },
  fly: { na: -0.25, nL: 1.05, ha: 0.1, tBase: 0.0, tCurl: 0.0, tSway: 0.28, wing: 1, legF: 1.1, legH: 1.0, eye: 1, tUp: 0, wingA: 0 },
  cling: { na: -0.55, nL: 1, ha: 0.1, tBase: 0.25, tCurl: 0.04, tSway: 0.22, wing: 0.6, legF: -0.7, legH: -0.5, eye: 1, tUp: 0, wingA: 0.35 }
};
function czPose(M, P, dt, sp = 6) { const k = Math.min(1, dt * sp); for (const key in P) M[key] = lerp(M[key], P[key], k); }
// o ângulo (espaço do corpo) de uma junta até um ponto local
function czAimFrom(M, bx, by, x, y) { const [px, py] = czL(M, bx, by), [vx, vy] = czBody(M, x - px, y - py); return Math.atan2(vy, vx); }
function czFaceHero(M) { const H = czHero(); if (Math.abs(H.hx - M.x) > 10) M.f = H.hx > M.x ? 1 : -1; }
// fica de pé sobre o chão debaixo dele (o ouro pode ter escorregado)
function czStandOn(M, dt, sp = 8) { const g = czSpotGround(M.x); M.y = approach(M.y, g - CZ_STAND, Math.max(30, Math.abs(g - CZ_STAND - M.y) * sp) * dt); }
// a cabeça mira no herói: da junta da cabeça (a boca fica na linha dela)
function czHeadAim(M, x, y) { const R = czRig(M); return czAimFrom(M, R.head.x, R.head.y, x, y); }
function czBrain(e, dt) {
  const M = czM;
  e.stateT -= dt; e.stateT0 += dt; e.cd -= dt;
  // um aparo (stun) não congela o dragão: vira um tropeço curto
  if (e.stun > 0) { if (e.state === 'bite' || e.state === 'biteHold' || e.state === 'tail') czSet(e, 'stagger', Math.min(1.0, e.stun * 0.7)); e.stun = 0; }
  const H = czHero();
  // os limiares
  if (e.ph === 0 && e.hp <= e.maxHp * CZQ.p2 && !czInvuln(e) && e.state !== 'sleep') { e.ph = 1; czFx.ray = null; M.chest = M.throat = 0; czSet(e, 'fase2', 2.0); sfx.czRugido(1.2); return; }
  if (e.ph === 1 && e.hp <= e.maxHp * CZQ.p3 && !czInvuln(e)) { e.ph = 2; czFx.ray = null; czFx.shadow = null; czFx.gust = null; M.chest = M.throat = 0; czSet(e, 'fase3', 2.4); sfx.czRugido(1.4); return; }
  switch (e.state) {
    case 'sleep': czSleepTick(dt); break;
    case 'wake': {
      // levanta a cabeça, abre os olhos, fica de pé; ruge
      czPose(M, CZ_POSE.stand, dt, 3); M.eye = Math.min(1, e.stateT0 * 2); M.sleep = Math.max(0, 1 - e.stateT0 * 1.2);
      czStandOn(M, dt, 2); czFaceHero(M);
      if (e.stateT0 > 0.6 && e.stateT0 < 1.5) { M.jaw = approach(M.jaw, 1, dt * 4); M.na = lerp(M.na, -1.2, dt * 3); M.mouth = 0.6; if (Math.random() < dt * 30) czSmoke(M, 1); shake(1.5); }
      else { M.jaw = approach(M.jaw, 0, dt * 3); M.mouth = approach(M.mouth, 0, dt * 2); }
      if (e.stateT <= 0) { czSet(e, 'idle', 0); e.cd = 0.6; }
      break;
    }
    case 'idle': {
      czPose(M, CZ_POSE.stand, dt); czStandOn(M, dt); czFaceHero(M);
      M.x = approach(M.x, 0, 30 * dt);
      if (e.cd > 0) break;
      const R = czRig(M), [hx0, hy0] = czL(M, R.headC.x, R.headC.y), dh = Math.hypot(H.hx - hx0, H.cy - hy0), behind = Math.sign(H.hx - M.x) !== M.f && Math.abs(H.hx - M.x) > 14;
      let k;
      if (dh < 6.5 * T && !behind) k = czPick(e, [['bite', 0.5], ['tail', 0.2], ['breath', 0.3]]);
      else if (Math.abs(H.hx - M.x) < 9 * T) k = czPick(e, [['tail', behind ? 0.6 : 0.3], ['breath', 0.4], ['bite', behind ? 0 : 0.3]]);
      else k = czPick(e, [['breath', 0.8], ['tail', 0.2]]);
      if (k === 'bite') { czSet(e, 'biteTell', 0.6); sfx.czRosna(); }
      else if (k === 'tail') { czSet(e, 'tailTell', 0.8); e.tailSide = Math.sign(H.hx - M.x) || 1; M.f = -e.tailSide; sfx.czCauda(0); }
      else { czSet(e, 'breathTell', 1.0); sfx.czInspira(); }
      break;
    }
    /* ----- mordida: o pescoço recua e a boca acende; depois o bote ----- */
    case 'biteTell': {
      czPose(M, CZ_POSE.stand, dt); czStandOn(M, dt); czFaceHero(M);
      const k = e.stateT0 / 0.6, aim = czAimFrom(M, CZ_NECK[0], CZ_NECK[1], H.hx, H.cy);
      M.nL = lerp(M.nL, 0.62, dt * 8); M.na = lerp(M.na, clamp(aim - 0.6, -1.7, 0.6), dt * 6); M.ha = lerp(M.ha, aim, dt * 6);
      M.jaw = 0.25 + 0.1 * Math.sin(e.stateT0 * 30); M.mouth = k;
      if (e.stateT <= 0) { e.aim = clamp(aim, -1.5, 1.2); czSet(e, 'bite', 0.2); e.hit = false; sfx.czMordida(0); }
      break;
    }
    case 'bite': {
      const k = Math.min(1, e.stateT0 / 0.2);
      M.nL = lerp(0.62, 1.75, k); M.na = e.aim; M.ha = e.aim; M.jaw = 1 - k * 0.2; M.mouth = 1;
      const R = czRig(M), [x, y] = czL(M, R.headC.x, R.headC.y);
      if (!e.hit && !pl.dead && Math.abs(H.hx - x) < 13 + pl.w / 2 && H.cy - y < 18 && y - H.cy < 20) { e.hit = true; hurtPlayer(e.dmg, czCX() + x, e, false); }
      if (e.stateT <= 0) { czSet(e, 'biteHold', 0.45); sfx.czMordida(1); }
      break;
    }
    case 'biteHold':
      M.jaw = approach(M.jaw, 0, dt * 10); M.mouth = approach(M.mouth, 0, dt * 3);
      if (e.stateT <= 0) czSet(e, 'recover', 0.7);
      break;
    /* ----- varrida de cauda: vira as costas, a ponta sobe e balança, e varre o monte ----- */
    case 'tailTell':
      czPose(M, CZ_POSE.stand, dt); czStandOn(M, dt);
      M.tUp = approach(M.tUp, 1, dt * 4); M.tBase = lerp(M.tBase, 0.9, dt * 5); M.tSway = 0.9; M.tCurl = lerp(M.tCurl, -0.02, dt * 5);
      M.na = lerp(M.na, -0.4, dt * 4); M.ha = lerp(M.ha, -0.6, dt * 4);   // a cabeça olha por cima do ombro
      if (e.stateT <= 0) { czSet(e, 'tail', 0.45); e.hit = false; sfx.czCauda(1); }
      break;
    case 'tail': {
      const k = Math.min(1, e.stateT0 / 0.45);
      M.tUp = 1 - k; M.tSway = 0.05; M.tLen = 1.3; M.tBase = lerp(0.9, -1.35, k * k * (3 - 2 * k)); M.tCurl = 0.012;
      const R = czRig(M);
      if (!e.hit && !pl.dead) for (let n = 4; n < R.tail.length; n += 2) {
        const [x, y] = czL(M, R.tail[n].x, R.tail[n].y), r = R.tail[n].r + 5;
        if (Math.abs(H.hx - x) < pl.w / 2 + r && H.hy + r > y && H.hy - pl.h - r < y) { e.hit = true; hurtPlayer(Math.round(e.dmg * 0.8), czCX() + x, e, false); break; }
      }
      if (Math.random() < dt * 40) { const [x, y] = czL(M, R.tip.x, R.tip.y); parts.push({ x: czCX() + x, y: czCY() + y, vx: rnd(-20, 20), vy: rnd(-30, 10), g: 300, life: 0.4, max: 0.4, col: DG_COL.ouro, size: 1 }); }
      if (e.stateT <= 0) czSet(e, 'recover', 0.8);
      break;
    }
    /* ----- sopro em linha: o peito incha, o brilho sobe pela garganta, e o jato ----- */
    case 'breathTell': {
      czPose(M, CZ_POSE.stand, dt); czStandOn(M, dt); czFaceHero(M);
      const k = e.stateT0 / 1.0, aim = czHeadAim(M, H.hx, H.cy);
      if (e.stateT0 < 0.8) e.aim = aim;
      M.na = lerp(M.na, clamp(e.aim * 0.8 - 0.35, -1.6, 0.9), dt * 6); M.ha = lerp(M.ha, e.aim, dt * 7); M.nL = lerp(M.nL, 0.9, dt * 4);
      M.chest = Math.min(1, k * 2.5); M.throat = clamp((k - 0.3) / 0.7, 0, 1); M.sy = 1 + 0.06 * Math.min(1, k * 2);
      M.jaw = k > 0.8 ? (k - 0.8) * 3 : 0; M.mouth = k > 0.7 ? (k - 0.7) / 0.3 : 0;
      if (Math.random() < dt * 25) czSmoke(M, 0);
      if (e.stateT <= 0) { czSet(e, 'breath', 1.0); czFx.ray = { a: 0, len: 0, t: 0, x: 0, y: 0 }; sfx.czSopro(1.0); }
      break;
    }
    case 'breath':
      czStandOn(M, dt);
      M.jaw = 0.75 + Math.sin(e.stateT0 * 40) * 0.05; M.mouth = 1; M.chest = Math.max(0, 1 - e.stateT0); M.throat = 1 - e.stateT0 * 0.6; M.sy = lerp(M.sy, 1, dt * 3);
      M.ha = e.aim;
      if (e.stateT <= 0) { czFx.ray = null; M.chest = 0; M.throat = 0; if (e.ph === 1) czSet(e, 'perchEnd', 0.4); else czSet(e, 'recover', 0.9); }
      break;
    case 'stagger':
      czPose(M, CZ_POSE.stand, dt, 3); czStandOn(M, dt); M.nL = lerp(M.nL, 0.75, dt * 6); M.jaw = approach(M.jaw, 0.3, dt * 4); M.mouth = approach(M.mouth, 0, dt * 4);
      if (e.stateT <= 0) czSet(e, 'recover', 0.4);
      break;
    case 'recover':
      czPose(M, CZ_POSE.stand, dt, 3); czStandOn(M, dt); if (e.stateT0 > 0.3) czFaceHero(M);
      M.jaw = approach(M.jaw, 0, dt * 3); M.mouth = approach(M.mouth, 0, dt * 3); M.chest = approach(M.chest, 0, dt * 2); M.throat = approach(M.throat, 0, dt * 2); M.sy = lerp(M.sy, 1, dt * 4);
      if (e.stateT <= 0) {
        if (e.ph === 0) { czSet(e, 'idle', 0); e.cd = 1.1 + Math.random() * 0.7; }
        else if (e.ph === 1) czSet(e, 'takeoff', 0.7);
        else czSet(e, 'toWall', 1.3);
      }
      break;
    /* ----- fase 2: o voo, o pouso e a avalanche, o vento das asas ----- */
    case 'fase2':
      czPose(M, CZ_POSE.fly, dt, 2.5); M.flap += dt * 7; M.rot = lerp(M.rot, 0, dt * 3);
      M.jaw = e.stateT0 < 1.2 ? 1 : approach(M.jaw, 0, dt * 3); M.mouth = e.stateT0 < 1.2 ? 0.7 : approach(M.mouth, 0, dt * 2);
      M.y = lerp(M.y, -26 * T, dt * 1.5); M.na = lerp(M.na, -1.1, dt * 3);
      if (e.stateT0 < 1.2) shake(1.2);
      if (e.stateT <= 0) { czSet(e, 'fly', 2.4 + Math.random()); e.flyT = Math.asin(clamp(M.x / (30 * T), -1, 1)); }
      break;
    case 'takeoff':
      czPose(M, CZ_POSE.fly, dt, 4); M.flap += dt * 9; M.y -= dt * 160; M.rot = lerp(M.rot, -0.25, dt * 5);
      if (e.stateT0 <= dt) { sfx.czAsa(1); burst(czCX() + M.x, czCY() + M.y + CZ_STAND, 16, DG_COL.ouro, 90, 200, 0.6); }
      if (e.stateT <= 0) { czSet(e, 'fly', 2.4 + Math.random()); e.flyT = Math.asin(clamp(M.x / (30 * T), -1, 1)); }
      break;
    case 'fly': {
      czPose(M, CZ_POSE.fly, dt, 3);
      const fl = M.flap; M.flap += dt * 6.5; if (Math.floor(fl / Math.PI) !== Math.floor(M.flap / Math.PI) && Math.sin(M.flap) < 0) sfx.czAsa(0.4);
      e.flyT += dt * 0.85;
      const tx = Math.sin(e.flyT) * 30 * T, ty = -27 * T + Math.cos(e.flyT * 2) * 3 * T, vx = tx - M.x;
      M.x = lerp(M.x, tx, Math.min(1, dt * 2.2)); M.y = lerp(M.y, ty, Math.min(1, dt * 2.2));
      if (Math.abs(vx) > 2) M.f = vx > 0 ? 1 : -1;
      M.rot = lerp(M.rot, clamp((ty - M.y) * 0.004, -0.3, 0.3), dt * 3);
      if (e.stateT <= 0) czLandPick(e);
      break;
    }
    case 'landTell': {
      // vai até em cima do lugar e desce no fim; a sombra cresce e o ouro treme (o 276 conta o tremor)
      czPose(M, CZ_POSE.fly, dt, 3); M.flap += dt * (e.stateT0 < 0.7 ? 7 : 10);
      const S = e.spot, k = e.stateT0 / 1.2, gy = czSpotGround(S.x);
      const tx = S.x, ty = k < 0.6 ? gy - 9 * T : lerp(gy - 9 * T, gy - CZ_STAND, (k - 0.6) / 0.4);
      M.x = lerp(M.x, tx, Math.min(1, dt * (k < 0.6 ? 3 : 10))); M.y = lerp(M.y, ty, Math.min(1, dt * (k < 0.6 ? 3 : 12)));
      if (Math.abs(tx - M.x) > 4) M.f = tx > M.x ? 1 : -1;
      M.rot = lerp(M.rot, 0, dt * 4); M.legF = lerp(M.legF, 0.1, dt * 5); M.legH = lerp(M.legH, 0.1, dt * 5);
      if (czFx.shadow) { czFx.shadow.t = e.stateT0; czFx.shadow.g = gy; }
      if (e.stateT <= 0) czLand(e);
      break;
    }
    case 'land':
      czPose(M, CZ_POSE.stand, dt, 8); czStandOn(M, dt, 14); M.wing = lerp(M.wing, 0.5, dt * 6); M.flap = lerp(M.flap, Math.PI / 2, dt * 6);
      if (e.stateT <= 0) czSet(e, 'perch', 0.6);
      break;
    case 'perch':
      czPose(M, CZ_POSE.stand, dt, 5); czStandOn(M, dt); czFaceHero(M); M.wing = lerp(M.wing, 0.3, dt * 4);
      if (e.stateT <= 0) {
        const k = czPick(e, [['gust', 0.55], ['breath', 0.45]]);
        if (k === 'gust') { czSet(e, 'gustTell', 0.9); sfx.czAsa(0.6); }
        else { czSet(e, 'breathTell', 1.0); sfx.czInspira(); }
      }
      break;
    case 'gustTell': {
      // as asas sobem devagar; a poeira dourada levanta do chão em volta
      czPose(M, CZ_POSE.stand, dt, 5); czStandOn(M, dt); czFaceHero(M);
      M.wing = 1; M.flap = lerp(M.flap, Math.PI * 0.5 + 0.9, dt * 4); M.na = lerp(M.na, -1.2, dt * 4);
      if (Math.random() < dt * 60) { const gx = M.x + rnd(-9, 9) * T, gy = czGround(gx, M.y); parts.push({ x: czCX() + gx, y: czCY() + gy - 1, vx: rnd(-15, 15), vy: rnd(-50, -15), g: 30, life: 0.8, max: 0.8, col: Math.random() < 0.6 ? DG_COL.ouro : '#fff0a0', size: 1, glow: Math.random() < 0.3 }); }
      if (e.stateT <= 0) { czSet(e, 'gust', 0.5); czFx.gust = { t: 0 }; sfx.czVento(); }
      break;
    }
    case 'gust': {
      czStandOn(M, dt); M.wing = 1; M.flap = lerp(M.flap, Math.PI * 1.5, dt * 14);
      const G = czFx.gust;
      if (G && G.t < 0.3 && !pl.dead && Math.abs(H.hx - M.x) < 15 * T && Math.abs(H.hy - (M.y + CZ_STAND)) < 7 * T) {
        const d = Math.sign(H.hx - M.x) || M.f; pl.vx = d * 175; pl.stunT = Math.max(pl.stunT || 0, 0.05); if (pl.onGround) pl.vy = Math.min(pl.vy, -40);
      }
      if (e.stateT <= 0) { czFx.gust = null; czSet(e, 'perchEnd', 0.3); }
      break;
    }
    case 'perchEnd':
      czPose(M, CZ_POSE.stand, dt, 4); czStandOn(M, dt); M.jaw = approach(M.jaw, 0, dt * 4); M.mouth = approach(M.mouth, 0, dt * 3);
      if (e.stateT <= 0) czSet(e, 'takeoff', 0.7);
      break;
    /* ----- fase 3: a parede, as bolas de magma, o sopro varrido ----- */
    case 'fase3': {
      czPose(M, CZ_POSE.fly, dt, 2.5); M.flap += dt * 8; M.x = lerp(M.x, 0, dt * 1.5); M.y = lerp(M.y, -30 * T, dt * 1.5); M.rot = lerp(M.rot, 0, dt * 3);
      M.na = lerp(M.na, -1.3, dt * 3); M.jaw = e.stateT0 < 1.6 ? 1 : approach(M.jaw, 0, dt * 3); M.mouth = e.stateT0 < 1.6 ? 1 : approach(M.mouth, 0, dt * 2);
      if (e.stateT0 < 1.6) shake(2);
      if (e.stateT <= 0) { czFx.rise = { n: 0, t: CZQ.riseEvery, warn: false }; czSet(e, 'toWall', 1.3); }
      break;
    }
    case 'toWall': {
      if (e.stateT0 <= dt) { e.wall = H.hx > 0 ? -1 : 1; if (Math.random() < 0.3) e.wall = -e.wall; sfx.czAsa(0.8); }
      const k = Math.min(1, e.stateT0 / 1.3), tx = e.wall * 40.5 * T, ty = -23 * T;
      czPose(M, k < 0.75 ? CZ_POSE.fly : CZ_POSE.cling, dt, 4); M.flap += dt * 8;
      M.x = lerp(M.x, tx, Math.min(1, dt * 3)); M.y = lerp(M.y, ty, Math.min(1, dt * 3)); M.f = -e.wall;
      M.rot = lerp(M.rot, k < 0.6 ? 0 : 1.15, dt * 5);
      if (e.stateT <= 0) { czSet(e, 'cling', 0.6); e.n = 0; e.volley++; sfx.czAgarra(); burst(czCX() + M.x + e.wall * 14, czCY() + M.y, 12, '#3a3430', 70, 200, 0.6); }
      break;
    }
    case 'cling':
      czPose(M, CZ_POSE.cling, dt, 6); M.rot = lerp(M.rot, 1.15, dt * 6); M.x = lerp(M.x, e.wall * 40.5 * T, dt * 4);
      M.ha = lerp(M.ha, czHeadAim(M, H.hx, H.cy), dt * 4);
      if (e.stateT <= 0) {
        if (e.n < 3) { czSet(e, 'spitTell', 0.45); sfx.czRosna(0.6); }
        else if (e.volley % 2 === 1) { czSet(e, 'cling', 1.0); e.n = 0; e.volley++; }
        else { czSet(e, 'dropTell', 0.5); sfx.czAsa(0.7); }
      }
      break;
    case 'spitTell': {
      czPose(M, CZ_POSE.cling, dt, 6);
      const k = e.stateT0 / 0.45;
      M.ha = lerp(M.ha, czHeadAim(M, H.hx, H.cy - 2 * T), dt * 8); M.jaw = k * 0.6; M.mouth = k; M.throat = k;
      if (e.stateT <= 0) { czSpit(e); e.n++; M.jaw = 0.9; czSet(e, 'spitGap', 0.35); }
      break;
    }
    case 'spitGap':
      czPose(M, CZ_POSE.cling, dt, 6); M.jaw = approach(M.jaw, 0.1, dt * 5); M.mouth = approach(M.mouth, 0, dt * 5); M.throat = approach(M.throat, 0, dt * 5);
      if (e.stateT <= 0) czSet(e, 'cling', 0.05);
      break;
    case 'dropTell':
      czPose(M, CZ_POSE.cling, dt, 6); M.wing = 1; M.flap += dt * 4; M.jaw = 0; M.mouth = 0;
      if (Math.random() < dt * 30) parts.push({ x: czCX() + M.x + e.wall * 16 + rnd(-4, 4), y: czCY() + M.y + rnd(-20, 20), vx: rnd(-10, 10), vy: rnd(0, 30), g: 400, life: 0.6, max: 0.6, col: '#3a3430', size: 1 });
      if (e.stateT <= 0) czSet(e, 'drop', 1.0);
      break;
    case 'drop': {
      // solta da parede e plana até o pico do meio
      czPose(M, CZ_POSE.fly, dt, 4); M.flap += dt * 6; M.rot = lerp(M.rot, 0, dt * 6);
      const k = Math.min(1, e.stateT0 / 1.0), gy = czSpotGround(0);
      M.x = lerp(M.x, 0, Math.min(1, dt * 4)); M.y = lerp(M.y, gy - CZ_STAND - (1 - k) * 6 * T, Math.min(1, dt * 6));
      M.f = M.x > 0 ? -1 : 1;
      if (e.stateT <= 0) { czSet(e, 'sweepTell', 1.3); M.f = 1; M.x = 0; shake(4); sfx.czPouso(0.7); burst(czCX() + M.x, czCY() + M.y + CZ_STAND, 24, DG_COL.ouro, 110, 300, 0.7); }
      break;
    }
    case 'sweepTell': {
      // abre as asas e vira o pescoço e a cabeça para a esquerda; o peito e a garganta acendem
      czPose(M, CZ_POSE.stand, dt, 6); czStandOn(M, dt); M.wing = 1; M.flap = lerp(M.flap, Math.PI * 0.5 + 0.6, dt * 5);
      const k = e.stateT0 / 1.3;
      M.f = 1; M.na = lerp(M.na, -1.75, dt * 4); M.ha = lerp(M.ha, Math.PI - 0.45, dt * 3.5);
      M.chest = Math.min(1, k * 2); M.throat = clamp((k - 0.35) / 0.65, 0, 1); M.sy = 1 + 0.07 * Math.min(1, k * 2);
      M.jaw = k > 0.85 ? (k - 0.85) * 5 : 0; M.mouth = k > 0.7 ? (k - 0.7) / 0.3 : 0;
      if (e.stateT0 <= dt) sfx.czInspira(1.3);
      if (e.stateT <= 0) { czSet(e, 'sweep', 1.8); czFx.ray = { a: 0, len: 0, t: 0, x: 0, y: 0 }; sfx.czSopro(1.8); }
      break;
    }
    case 'sweep': {
      // a cabeça vai da esquerda para a direita, cuspindo fogo para baixo
      czStandOn(M, dt); const k = Math.min(1, e.stateT0 / 1.8), s = k * k * (3 - 2 * k);
      M.ha = lerp(Math.PI - 0.45, 0.45, s); M.na = lerp(-1.75, -0.75, s); M.jaw = 0.8; M.mouth = 1; M.chest = 1 - k; M.throat = 1 - k * 0.5;
      if (e.stateT <= 0) { czFx.ray = null; czSet(e, 'tired', 2.2); M.chest = 0; M.throat = 0; }
      break;
    }
    case 'tired':
      // cansado no alto do monte: a janela de golpes
      czPose(M, CZ_POSE.stand, dt, 3); czStandOn(M, dt); M.wing = lerp(M.wing, 0, dt * 3); M.na = lerp(M.na, 0.2, dt * 2); M.ha = lerp(M.ha, 0.5, dt * 2);
      M.jaw = 0.3 + Math.sin(e.stateT0 * 5) * 0.15; M.mouth = approach(M.mouth, 0, dt * 2); M.sy = 1 + Math.sin(e.stateT0 * 5) * 0.03;
      if (Math.random() < dt * 8) czSmoke(M, 0);
      if (e.stateT <= 0) czSet(e, 'toWall', 1.3);
      break;
  }
  if (e.state !== 'tail') M.tLen = lerp(M.tLen, 1, Math.min(1, dt * 4));
  M.t += dt;
}
// escolhe o pouso: um dos picos ou uma coluna, perto do lado do herói, nunca o mesmo da vez anterior
function czLandPick(e) {
  const H = czHero(), S = czPlan.spots.filter(s => s !== e.spot);
  S.sort((a, b) => Math.abs(a.x - H.hx) - Math.abs(b.x - H.hx));
  const c = S.slice(0, 4), s = c[(Math.random() * c.length) | 0];
  e.spot = s; czSet(e, 'landTell', 1.2);
  czFx.shadow = { x: s.x, g: czSpotGround(s.x), t: 0 };
  // a encosta treme 1,2 s e desliza quando ele cai
  const B = czB();
  if (typeof dgQuake === 'function') dgQuake(B.cx + s.q[0], B.cx + s.q[1], B.fy + czPlan.JT + 6, B.fy + CZ_FL - 1, 1.2);
  sfx.czAsa(1);
}
function czLand(e) {
  const M = czM, S = e.spot, H = czHero(), gy = czSpotGround(S.x);
  M.x = S.x; M.y = gy - CZ_STAND; M.rot = 0;
  czFx.shadow = null; czSet(e, 'land', 0.5);
  shake(7); sfx.czPouso(1);
  burst(czCX() + M.x, czCY() + gy - 2, 30, DG_COL.ouro, 140, 300, 0.8); burst(czCX() + M.x, czCY() + gy - 2, 16, '#3a3430', 90, 200, 0.9);
  if (!pl.dead && Math.abs(H.hx - S.x) < 3.5 * T && Math.abs(H.hy - gy) < 4 * T) hurtPlayer(e.dmg, czCX() + S.x, e, false);
}
// as bolas de magma: um arco até onde o herói está (as duas seguintes um pouco para os lados)
function czSpit(e) {
  const M = czM, R = czRig(M), [mx, my] = czL(M, R.mouth.x, R.mouth.y), H = czHero();
  const tx = H.hx + (e.n === 0 ? 0 : rnd(-2.5, 2.5) * T), ty = H.hy - 6, dx = tx - mx, dy = ty - my, tau = clamp(Math.hypot(dx, dy) / 230, 0.7, 1.3), g = 520;
  czFx.balls.push({ x: mx, y: my, vx: dx / tau, vy: (dy - 0.5 * g * tau * tau) / tau, g, t: 0, dmg: Math.max(1, Math.round(e.dmg * 0.6)) });
  burst(czCX() + mx, czCY() + my, 10, DG_COL.magma, 80, 100, 0.4, 1, true);
  sfx.czCuspe();
}
// a fumaça e as faíscas das narinas
function czSmoke(M, hot) {
  const R = czRig(M), [x, y] = czL(M, R.mouth.x - 4 * Math.cos(M.ha), R.mouth.y - 4 * Math.sin(M.ha) - 3);
  parts.push({ x: czCX() + x, y: czCY() + y, vx: rnd(-8, 8) + M.f * 10, vy: rnd(-25, -8), g: -20, life: 1.2, max: 1.2, col: hot ? '#5a4a40' : '#3a3430', size: 1, smoke: true });
  if (hot || Math.random() < 0.3) parts.push({ x: czCX() + x, y: czCY() + y, vx: rnd(-20, 20), vy: rnd(-40, -10), g: 60, life: 0.5, max: 0.5, col: DG_COL.brasa, size: 1, glow: true });
}

/* ---------- dormindo: a respiração (o ouro sobe e desce junto, só no desenho) ---------- */
function czIdleReset() {
  const P = czPlan; if (!P) return;
  Object.assign(czM, CZ_POSE.sleep, { x: 0, y: P.peakY - 11, f: 1, rot: 0, jaw: 0, mouth: 0, chest: 0, throat: 0, flap: 0, tLen: 1, br: 0, sy: 1, sleep: 1, heap: 0 });
}
function czSleepTick(dt) {
  const M = czM, P = czPlan;
  czPose(M, CZ_POSE.sleep, dt, 2);
  const b0 = M.br; M.br += dt / 4.6;
  const s = Math.sin(M.br * Math.PI * 2);
  M.sy = 1 + 0.035 * s; M.heap = s; M.chest = 0.18 + 0.18 * Math.max(0, s); M.jaw = 0; M.mouth = 0; M.throat = 0;
  M.x = lerp(M.x, 0, Math.min(1, dt * 2)); M.y = lerp(M.y, P.peakY - 11, Math.min(1, dt * 2)); M.rot = lerp(M.rot, 0, Math.min(1, dt * 2));
  // a expiração: fumaça das narinas e moedas rolando pela encosta
  if (s < -0.3 && Math.random() < dt * 6) czSmoke(M, 0);
  if (s < -0.5 && Math.random() < dt * 1.5) { const sd = Math.random() < 0.5 ? -1 : 1; parts.push({ x: czCX() + M.x + sd * rnd(20, 30), y: czCY() + P.peakY + 10, vx: sd * rnd(15, 30), vy: -10, g: 300, life: 0.9, max: 0.9, col: Math.random() < 0.5 ? DG_COL.ouro : '#fff0a0', size: 1 }); }
  // o som acompanha cada respiração quando o herói está na cratera
  if (Math.floor(b0) !== Math.floor(M.br) && pl && !pl.dead && czHeroIn(2)) sfx.czRespira(0.7);
}

/* ---------- o que voa: o jato de fogo, as bolas, a labareda do escudo; o fosso que sobe ---------- */
// fogo no herói (marca o tipo de dano, para as resistências e para a Escama)
function czBurn(dmg, x, src) {
  let had = false, o = null;
  try { if (typeof dmgCtx !== 'undefined') { o = dmgCtx; dmgCtx = 'fogo'; had = true; } } catch (err) { had = false; }
  try { return hurtPlayer(dmg, x, src || null, !src); } finally { if (had) dmgCtx = o; }
}
const czHitPl = (x, y, r) => !pl.dead && x > pl.x - r && x < pl.x + pl.w + r && y > pl.y - r && y < pl.y + pl.h + r;
// o jato: da boca na direção da cabeça até o primeiro sólido (ou 19 blocos)
function czRayTick(dt) {
  const F = czFx.ray, e = czBoss; if (!F || !e) return;
  const M = czM, R = czRig(M), [mx, my] = czL(M, R.mouth.x, R.mouth.y), a = czLA(M, M.ha), X = czCX(), Y = czCY();
  F.t += dt; F.x = mx; F.y = my; F.a = a;
  const ux = Math.cos(a), uy = Math.sin(a), max = Math.min(19 * T, F.t * 900);
  let L = 0;
  for (; L < max; L += 3) { const t = tileAt(Math.floor((X + mx + ux * L) / T), Math.floor((Y + my + uy * L) / T)); if (SOLID[t] && L > 6) break; }
  F.len = L; F.hitWall = L < max;
  // o herói no jato
  czFx.burnT -= dt;
  if (!pl.dead && czFx.burnT <= 0) {
    const px = pl.x + pl.w / 2 - X, py = pl.y + pl.h / 2 - Y, s = clamp((px - mx) * ux + (py - my) * uy, 0, L), qx = mx + ux * s, qy = my + uy * s;
    if (Math.abs(px - qx) < pl.w / 2 + 5 && Math.abs(py - qy) < pl.h / 2 + 5) { czFx.burnT = 0.3; czBurn(Math.max(1, Math.round(e.dmg * 0.7)), X + mx); }
  }
  // onde bate: faíscas e o ouro derrete
  if (F.hitWall) {
    const ex = X + mx + ux * L, ey = Y + my + uy * L;
    if (Math.random() < dt * 50) parts.push({ x: ex, y: ey, vx: rnd(-60, 60) - ux * 30, vy: rnd(-90, -20), g: 300, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? DG_COL.magma : DG_COL.magmaClaro, size: 1, glow: true });
    czFx.meltT -= dt;
    if (czFx.meltT <= 0) {
      czFx.meltT = 0.12;
      const tx = Math.floor((ex + ux * 2) / T), ty = Math.floor((ey + uy * 2) / T);
      if (czGold(tileAt(tx, ty)) && typeof dgMelt === 'function') dgMelt(wrapX(tx), ty, 1);
    }
  }
  if (Math.random() < dt * 30) { const s = Math.random() * L; parts.push({ x: X + mx + ux * s, y: Y + my + uy * s, vx: rnd(-20, 20), vy: rnd(-50, -10), g: -30, life: 0.6, max: 0.6, col: '#4a3a30', size: 1, smoke: true }); }
}
function czBallTick(dt) {
  const X = czCX(), Y = czCY();
  for (let k = czFx.balls.length - 1; k >= 0; k--) {
    const b = czFx.balls[k]; b.t += dt; b.vy += b.g * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    const wx = X + b.x, wy = Y + b.y;
    if (Math.random() < dt * 40) parts.push({ x: wx, y: wy, vx: rnd(-10, 10), vy: rnd(-10, 10), g: 80, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? DG_COL.magma : DG_COL.brasa, size: 1, glow: true });
    let pop = false;
    if (czHitPl(wx, wy, 4)) { czBurn(b.dmg, wx); pop = true; }
    else { const t = tileAt(Math.floor(wx / T), Math.floor(wy / T)); if ((SOLID[t] && b.t > 0.08) || b.t > 3.5) pop = true; }
    if (!pop) continue;
    czFx.balls.splice(k, 1);
    burst(wx, wy, 16, DG_COL.magma, 110, 300, 0.6, 1, true); burst(wx, wy, 8, DG_COL.magmaClaro, 70, 200, 0.4, 1, true); burst(wx, wy, 6, '#3a3430', 50, -20, 0.8);
    shake(1.5); sfx.czRespingo();
    // derrete o ouro em volta de onde caiu; o respingo queima quem está do lado
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    if (typeof dgMelt === 'function') for (const [ax, ay] of [[tx, ty], [tx, ty + 1], [tx + Math.sign(b.vx), ty]]) if (czGold(tileAt(ax, ay))) { dgMelt(wrapX(ax), ay, 1); break; }
    if (!pl.dead && Math.hypot(pl.x + pl.w / 2 - wx, pl.y + pl.h / 2 - wy) < 1.6 * T && pl.invuln <= 0) czBurn(Math.max(1, Math.round(b.dmg * 0.6)), wx);
  }
}
// fase 3: o fosso sobe um bloco a cada 20 s (até 4), ronca 2 s antes
function czRiseTick(dt) {
  const S = czFx.rise; if (!S || S.n >= CZQ.riseMax) return;
  S.t -= dt;
  const P = czPlan, X = czCX(), Y = czCY();
  if (S.t < 2 && !S.warn) { S.warn = true; sfx.czFosso(0); }
  if (S.t < 2 && Math.random() < dt * 40) { const s = Math.random() < 0.5 ? -1 : 1, m = 24 + Math.random() * 14; parts.push({ x: X + s * m * T, y: Y + (CZ_FL - S.n) * T, vx: rnd(-10, 10), vy: rnd(-60, -20), g: 200, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? DG_COL.magma : DG_COL.magmaClaro, size: 1, glow: true }); if (Math.random() < 0.3) shake(0.8); }
  if (S.t > 0) return;
  S.n++; S.t = CZQ.riseEvery; S.warn = false;
  const j = CZ_FL - S.n;
  for (let i = P.AI0; i <= P.AI1; i++) {
    if (czMM(i) < 20) continue;
    const idx = czIdx(i, j), t = tiles[idx];
    if (SOLID[t] || t === DG_ESCADA || t === DG_MAGMA) continue;
    tiles[idx] = DG_MAGMA; czDirty(idx);
    if (Math.random() < 0.3) burst(X + (i + 0.5) * T, Y + j * T, 3, DG_COL.magma, 40, 200, 0.5, 1, true);
  }
  mapVer++;
  shake(3); sfx.czFosso(1);
}
// a labareda da Escama: curta, na direção do aparo; queima quem estiver nela
function czFlameTick(dt) {
  for (let k = czFx.flames.length - 1; k >= 0; k--) {
    const F = czFx.flames[k]; F.t += dt;
    const L = Math.min(1, F.t / 0.12) * 44, r = { x: F.dir > 0 ? F.x : F.x - L, y: F.y - 7, w: L, h: 14 };
    for (const e of enemies) {
      if (e.dead || F.hit.has(e) || !overlap(r, e)) continue;
      F.hit.add(e);
      hitEnemy(e, F.dir, 1.2, false);
      if (!e.dead && typeof fgIgnite === 'function') fgIgnite(e);
    }
    if (Math.random() < dt * 60) parts.push({ x: F.x + F.dir * rnd(0, L), y: F.y + rnd(-5, 5), vx: F.dir * rnd(30, 80), vy: rnd(-40, -10), g: -20, life: 0.35, max: 0.35, col: Math.random() < 0.5 ? DG_COL.magma : DG_COL.magmaClaro, size: 1, glow: true });
    if (F.t > 0.4) czFx.flames.splice(k, 1);
  }
}
function czFxTick(dt) {
  czSealTick(dt); czCurtainTouch(); czRayTick(dt); czBallTick(dt); czRiseTick(dt);
  if (czFx.gust) czFx.gust.t += dt;
}

/* ---------- a Escama de Cinzarel: aparar fogo ou projétil não machuca e devolve uma labareda ---------- */
STAT_DEF.lgCinzarel = { t: 'Aparar um ataque de fogo ou um projétil não machuca nada e devolve uma labareda curta no atacante', flag: 1 };
STAT_KEYS.push('lgCinzarel');
ITEMS.escama_cinzarel = {
  name: 'Escama de Cinzarel', slot: 'shield', rar: 4, def: 9, parry: 0.34,
  pal: { o: '#141216', W: '#3a3430', w: '#746759', m: '#e06a10', M: '#ffd050' },
  legend: [['lgCinzarel', 1], ['light', 1]],
  desc: 'Uma escama do peito do Dragão Ancião, larga como uma porta pequena, com moedas ainda grudadas. O fogo escorrega nela e volta para quem soprou.'
};
BASE_INFO.escama_cinzarel = [CZ_L];
ITEM_G.escama_cinzarel = 1; ITEMS.escama_cinzarel.g = 1;
czDrops();
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgCinzarel || 0;
  if (pl.lg) pl.lg.cinzarel = b > 0;
  return r;
}; }
let czNoChip = false;
const czFireSrc = src => { try { return (src && typeof DMG_KIND !== 'undefined' && DMG_KIND[src.type] === 'fogo') || (typeof dmgCtx !== 'undefined' && dmgCtx === 'fogo'); } catch (err) { return false; } };
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const L = pl.lg;
  if (!L || !L.cinzarel || pl.dead) return _hp.apply(this, arguments);
  const pcx = pl.x + pl.w / 2, rel = srcX - pcx, front = Math.abs(rel) < 3 || Math.sign(rel) === pl.facing;
  const guard = (!!isProj || czFireSrc(src)) && pl.shieldK >= 0.6 && front;
  czNoChip = guard;
  let r; try { r = _hp.apply(this, arguments); } finally { czNoChip = false; }
  if (guard && r === 'parry') {
    czFx.flames.push({ x: pcx + pl.facing * 8, y: pl.y + 10, dir: pl.facing, t: 0, hit: new Set() });
    floatText(pcx, pl.y - 18, 'LABAREDA', '#ffa020', 0.9); sfx.czLabareda();
  }
  return r;
}; }
// segurando fogo ou projétil com a Escama, nem o golpe pesado de chefe passa pelo escudo
{ const _rd = rawDamage; rawDamage = function (d, k) { if (czNoChip) return; return _rd.apply(this, arguments); }; }

/* ---------- arte: Cinzarel em partes (tronco, gomos do pescoço e da cauda, cabeça, mandíbula, patas, asas) ---------- */
const CZA = {};
{
const RAMPS = [];
const R6 = hexes => { const R = hexes.map(h => ph(h)); R.k = RAMPS.length; RAMPS.push(R); return R; };
const PAL = {
  cinza: R6(['#141216', '#26211f', '#3b3430', '#554b44', '#746759', '#988a77']),     // escama cor de cinza, quente
  brasa: R6(['#4a1004', '#8a2a06', '#c84a0a', '#f07a18', '#ffb040', '#ffe6a0']),
  ouro: R6(['#4a3008', '#7a5410', '#a87808', '#d8a830', '#f0cc5a', '#fff0a0']),
  osso: R6(['#2a2218', '#4a3e2c', '#6e6048', '#968566', '#bcac88', '#e2d6b4']),
  memb: R6(['#120808', '#22100c', '#361a12', '#4e2618', '#6a3420', '#8a4a2c']),
  barriga: R6(['#221c1a', '#3c332d', '#584b40', '#786553', '#9a8468', '#bca282']),
  olho: R6(['#5a2a00', '#a85a00', '#e09000', '#ffc030', '#ffe680', '#fffbe0']),
  boca: R6(['#1a0404', '#3a0806', '#6a1208', '#a8300a', '#e06a10', '#ffa020'])
};
CZA.PAL = PAL;
const cg = (x, y, s) => hash2(x, y, s) - 0.5;
// o pintor (como o da Dama): cada pixel lembra a rampa; o contorno pega o tom mais escuro; em = o que acende
function pp(w, h) {
  const c = new Uint32Array(w * h), rid = new Int16Array(w * h).fill(-1), em = new Uint32Array(w * h);
  const P = {
    w, h, c, rid, em,
    put(x, y, R, v, lit) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; c[i] = R[v < 0 ? 0 : v > 5 ? 5 : v | 0]; rid[i] = R.k; em[i] = lit ? c[i] : 0; },
    ball(cx, cy, rx, ry, f) {
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.hypot(dx, dy); if (d > 1) continue;
        f(x, y, dx, dy, d);
      }
    },
    // um tubo que afina de a para b (patas, ossos da asa)
    tube(ax, ay, bx, by, r0, r1, f) {
      const R = Math.max(r0, r1), x0 = Math.floor(Math.min(ax, bx) - R - 1), x1 = Math.ceil(Math.max(ax, bx) + R + 1), y0 = Math.floor(Math.min(ay, by) - R - 1), y1 = Math.ceil(Math.max(ay, by) + R + 1);
      const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5, t = clamp(((px - ax) * vx + (py - ay) * vy) / L2, 0, 1), qx = ax + vx * t, qy = ay + vy * t, r = r0 + (r1 - r0) * t;
        const nx = (px - qx) / r, ny = (py - qy) / r, d = nx * nx + ny * ny; if (d > 1) continue;
        f(x, y, t, nx, ny, d);
      }
    },
    outline(skip) {
      const o = c.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!c[i] || (skip && skip(rid[i], x, y))) continue;
        const air = x === 0 || y === 0 || x === w - 1 || y === h - 1 || !c[i - 1] || !c[i + 1] || !c[i - w] || !c[i + w];
        if (air) { o[i] = RAMPS[rid[i]][0]; em[i] = 0; }
      }
      c.set(o);
    },
    canvas(buf = c) { const cv = mk(w, h), x = cv.getContext('2d'), im = x.createImageData(w, h); new Uint32Array(im.data.buffer).set(buf); x.putImageData(im, 0, 0); return cv; },
    part(px, py) { return { cv: P.canvas(), em: em.some(v => v) ? P.canvas(em) : null, px, py }; }
  };
  return P;
}
// as escamas: fileiras desencontradas de 5 x 4; a borda de baixo escurece e, aqui e ali, acende em brasa
function scale(u, v, s, sw = 5, sh = 4) {
  const row = Math.floor(v / sh), fu = (u + (row & 1) * sw / 2) / sw, cu = Math.floor(fu), xu = fu - cu, xv = v / sh - row;
  const rim = xv > 0.7;
  return [0.45 - xv * 0.75 - Math.abs(xu - 0.5) * 0.5 - (rim ? 0.45 : 0), rim && hash2(cu, row, s) < 0.3];
}
// uma curva quadrática grossa que afina (chifres, garras), com os anéis
function horn(Q, ax, ay, kx, ky, bx, by, r0, r1, R, s, dark = 0) {
  const n = Math.ceil((Math.hypot(kx - ax, ky - ay) + Math.hypot(bx - kx, by - ky)) * 2.5);
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * kx + u * u * bx, y = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * ky + u * u * by, r = lerp(r0, r1, u);
    for (let b = -Math.ceil(r); b <= Math.ceil(r); b++) for (let a = -Math.ceil(r); a <= Math.ceil(r); a++) {
      const d = Math.hypot(a, b) / Math.max(0.6, r); if (d > 1) continue;
      const ring = Math.sin(u * 26) > 0.55 ? -0.5 : 0;
      Q.put(x + a, y + b, R, 3.4 - (a + b) * 0.35 / Math.max(1, r) - d * 0.6 + u * 0.9 + ring - dark + cg(Math.round(x + a), Math.round(y + b), s) * 0.3);
    }
  }
}
/* o tronco (68 x 42), de lado, virado para a direita: as costas com as escamas de borda acesa, o cume de espinhos de
   osso, a barriga de couro coberta de moedas grudadas (umas brilham), a corcova dos ombros */
const TORSO_CY = 23, TORSO_CX = 34;
const torsoProf = x => { const u = (x + 0.5 - TORSO_CX) / 31; if (Math.abs(u) >= 1) return null; const s = Math.sqrt(1 - u * u);
  return [TORSO_CY - 12 * Math.pow(s, 0.7) - (u > 0.1 && u < 0.8 ? 1.8 * Math.sin((u - 0.1) / 0.7 * Math.PI) : 0), TORSO_CY + 10.5 * Math.pow(s, 0.8) + (u > -0.4 && u < 0.45 ? 1.2 : 0), u]; };
function paintTorso() {
  const W = 68, H = 42, Q = pp(W, H);
  for (let x = 0; x < W; x++) {
    const p = torsoProf(x); if (!p) continue; const [top, bot, u] = p;
    for (let y = Math.ceil(top - 0.5); y <= Math.floor(bot + 0.5); y++) {
      const ny = (y + 0.5 - (top + bot) / 2) / ((bot - top) / 2);
      const lit = 3.2 - ny * 1.15 - u * 0.4 - ny * ny * 0.45 + cg(x, y, 8101) * 0.3;
      if (ny > 0.28 + Math.sin(x * 0.4) * 0.07) { Q.put(x, y, PAL.barriga, lit - 0.4 + ((y & 1) ? -0.45 : 0.15)); continue; }
      const [d, em] = scale(x, y - top + 1, 8102);
      Q.put(x, y, PAL.cinza, lit + d);
      if (em && ny > -0.8) Q.put(x, y, PAL.brasa, 2.2 + hash2(x, y, 8103) * 1.6, true);
    }
  }
  // as moedas grudadas na barriga: discos que se sobrepõem, a luz no canto de cima, umas de lado
  for (let k = 0; k < 70; k++) {
    const x = 6 + hash2(k, 1, 8111) * 56, p = torsoProf(Math.round(x)); if (!p) continue;
    const [top, bot] = p, yb = bot - 0.8 - hash2(k, 2, 8111) * (bot - top) * 0.3, r = 1.3 + hash2(k, 3, 8111) * 0.9, sq = hash2(k, 4, 8111) < 0.3 ? 0.55 : 0.9;
    Q.ball(x, yb, r, r * sq, (px, py, dx, dy, d) => { let v = 3.5 - (dx + dy) * 0.9 - d * 0.4; if (d > 0.75) v -= 1.2; Q.put(px, py, PAL.ouro, v + cg(px, py, 8112) * 0.4); });
    if (hash2(k, 5, 8111) < 0.22) Q.put(x - r * 0.4, yb - r * 0.4, PAL.ouro, 5, true);
  }
  // o cume de espinhos de osso, inclinados para trás
  for (let x = 8; x < 56; x += 5) {
    const p = torsoProf(x); if (!p) continue; const hs = 3.5 + Math.sin((x - 4) / 56 * Math.PI) * 3.5;
    for (let h = 0; h < hs; h++) { const w = (1 - h / hs) * 2.1, c0 = x - h * 0.6; for (let a = Math.floor(c0 - w - 1); a <= Math.ceil(c0 + w + 1); a++) { if (Math.abs(a + 0.5 - c0) > w + 0.15) continue; Q.put(a, p[0] - h + 0.5, PAL.osso, 3.7 - (a + 0.5 - c0) * 0.6 - h * 0.12); } }
  }
  Q.outline();
  return Q.part(TORSO_CX, TORSO_CY);
}
// o peito aceso (sopro): as costuras do couro da barriga e as frestas entre as moedas, na frente do tronco
function paintChest() {
  const W = 68, H = 42, Q = pp(W, H);
  for (let x = 30; x < 66; x++) {
    const p = torsoProf(x); if (!p) continue; const [top, bot] = p;
    for (let y = Math.ceil(top); y <= Math.floor(bot); y++) {
      const ny = (y + 0.5 - (top + bot) / 2) / ((bot - top) / 2); if (ny < -0.1) continue;
      const k = (x - 30) / 36, on = hash2(x >> 1, (y + (x >> 2)) >> 1, 8121) < 0.42 && hash2(x, y, 8123) < 0.8;
      if (on) Q.put(x, y, PAL.brasa, 2 + k * 2.5 + ny * 1.2 + hash2(x, y, 8122), true);
    }
  }
  return { cv: null, em: Q.canvas(Q.em), px: TORSO_CX, py: TORSO_CY };
}
// um gomo do pescoço ou da cauda: um disco de escamas com o couro da barriga embaixo e um espinho em cima
function paintSeg(r, spike, s) {
  const m = Math.ceil(r) + 5, W = m * 2, Q = pp(W, W), c = m;
  Q.ball(c, c, r, r, (x, y, dx, dy, d) => {
    const v = 3.2 - (dx * 0.6 + dy) * 1.0 - d * d * 0.6 + cg(x, y, s) * 0.3;
    if (dy > 0.4) { Q.put(x, y, PAL.barriga, v - 0.3 + ((y & 1) ? -0.4 : 0.2)); return; }
    const [sd, em] = scale(x * 1.1, y + 2, s, 4, 3); Q.put(x, y, PAL.cinza, v + sd);
    if (em && dy > -0.85) Q.put(x, y, PAL.brasa, 2.3 + hash2(x, y, s + 1) * 1.5, true);
  });
  if (spike) { const hs = Math.max(2, r * 0.7); for (let h = 0; h < hs; h++) { const w = (1 - h / hs) * Math.max(1, r * 0.3), c0 = c - 1 - h * 0.6; for (let a = Math.floor(c0 - w - 1); a <= Math.ceil(c0 + w + 1); a++) if (Math.abs(a + 0.5 - c0) <= w + 0.15) Q.put(a, c - r - h + 0.5, PAL.osso, 3.6 - (a + 0.5 - c0) * 0.6 - h * 0.15); } }
  Q.outline();
  return Q.part(c, c);
}
// o brilho que sobe pela garganta: um disco de brasa na parte de baixo do gomo
function paintHot(r) {
  const m = Math.ceil(r) + 5, W = m * 2, Q = pp(W, W), c = m;
  Q.ball(c, c + r * 0.4, r * 0.6, r * 0.38, (x, y, dx, dy, d) => Q.put(x, y, PAL.brasa, 4.6 - d * 2.4 + cg(x, y, 8131) * 0.6, true));
  return { cv: null, em: Q.canvas(Q.em), px: c, py: c };
}
/* a cabeça (54 x 28, o pivô é a junta do pescoço): crânio comprido em cunha, a crista da sobrancelha, os dois chifres
   varridos para trás (o de trás mais escuro), as farpas da bochecha, o olho âmbar em fenda, a narina, os dentes */
function paintHead(eyeOpen) {
  const W = 54, H = 28, ox = 16, oy = 14, Q = pp(W, H);
  const TOP = [[0, 10], [0.08, 6.6], [0.22, 4.6], [0.36, 4.2], [0.47, 7], [0.75, 8.6], [1, 10.6]], BOT = [[0, 17.5], [0.12, 18.4], [0.32, 17], [1, 15.2]];
  const prof = (L, u) => { for (let i = 1; i < L.length; i++) if (u <= L[i][0]) { const [a, va] = L[i - 1], [b, vb] = L[i]; return lerp(va, vb, (u - a) / (b - a)); } return L[L.length - 1][1]; };
  // o chifre de trás primeiro
  horn(Q, 31, 7.5, 18, 4, 10, 11, 2.1, 0.5, PAL.osso, 8201, 1.2);
  for (let x = 14; x <= 48; x++) {
    const u = (x - 14) / 34, top = prof(TOP, u), bot = prof(BOT, u);
    for (let y = Math.ceil(top); y <= Math.floor(bot); y++) {
      if (u < 0.06 && Math.hypot((x - 17) / 3.2, (y - (top + bot) / 2) / ((bot - top) / 2)) > 1.05) continue;   // a nuca redonda
      const ny = (y + 0.5 - (top + bot) / 2) / ((bot - top) / 2);
      const v = 3.3 - ny * 1.1 - u * 0.3 + cg(x, y, 8211) * 0.3;
      if (ny > 0.62) { Q.put(x, y, PAL.barriga, v - 0.2); continue; }   // o lábio de couro
      if (u > 0.5) { const [d] = scale(x * 0.8, y, 8212, 6, 4); Q.put(x, y, PAL.cinza, v + d * 0.6 + 0.3); }
      else { const [d, em] = scale(x, y, 8213, 4, 3); Q.put(x, y, PAL.cinza, v + d); if (em && ny < 0.6) Q.put(x, y, PAL.brasa, 2.4 + hash2(x, y, 8214), true); }
    }
  }
  // a crista da sobrancelha (a sombra em cima do olho) e o olho
  for (let x = 23; x <= 33; x++) Q.put(x, prof(TOP, (x - 14) / 34) + 0.2, PAL.cinza, 4.6 - Math.abs(x - 28) * 0.15);
  const ex = 30, ey = 8;
  for (let x = ex - 2; x <= ex + 3; x++) Q.put(x, ey - 1, PAL.cinza, 1.2);
  if (eyeOpen) { for (let x = ex - 1; x <= ex + 2; x++) Q.put(x, ey, PAL.olho, 3.8 + (x - ex) * 0.4, true); Q.put(ex + 1, ey, PAL.boca, 0); Q.put(ex - 1, ey + 1, PAL.olho, 2.6, true); Q.put(ex, ey + 1, PAL.olho, 3, true); Q.put(ex + 1, ey + 1, PAL.boca, 0); }
  else { for (let x = ex - 1; x <= ex + 2; x++) Q.put(x, ey + (x === ex - 1 || x === ex + 2 ? 0 : 1), PAL.cinza, 0.6); }
  // a narina com uma brasa dentro
  Q.put(45, 10, PAL.cinza, 0.4); Q.put(46, 10, PAL.boca, 3.5, true);
  // os dentes de cima, para baixo; as presas maiores
  for (let x = 28; x <= 47; x += 2) { const y = prof(BOT, (x - 14) / 34); Q.put(x, y + 1, PAL.osso, 4.6); if (x === 34 || x === 42) Q.put(x, y + 2, PAL.osso, 4.2); }
  // as farpas da bochecha, para trás
  for (const [a, b, l] of [[18, 16, 5], [16, 13, 4], [19, 18.5, 4]]) for (let s = 0; s < l; s++) { Q.put(a - s, b + s * 0.35, PAL.osso, 3.8 - s * 0.35); if (s < l - 2) Q.put(a - s, b + s * 0.35 + 1, PAL.osso, 2.8 - s * 0.3); }
  // o chifre da frente, varrido para trás e para cima, a ponta virando
  horn(Q, 30, 5.5, 14, -0.5, 1, 4.5, 2.5, 0.55, PAL.osso, 8202);
  Q.outline();
  return Q.part(ox, oy);
}
// a mandíbula (34 x 13, o pivô é a dobradiça): dentes para cima, o queixo, a barba de espinhos
function paintJaw() {
  const W = 34, H = 13, Q = pp(W, H);
  for (let x = 2; x <= 32; x++) {
    const u = (x - 2) / 30, top = 3, bot = 3 + 6 * Math.pow(1 - u, 0.6) + 1;
    for (let y = top; y <= bot; y++) { const ny = (y - top) / Math.max(1, bot - top); Q.put(x, y, ny > 0.55 ? PAL.barriga : PAL.cinza, 3 - ny * 1.2 + cg(x, y, 8221) * 0.4 + (ny < 0.2 ? 0.6 : 0)); }
  }
  for (let x = 14; x <= 31; x += 2) Q.put(x, 2, PAL.osso, 4.4);
  for (const [a, b] of [[5, 9], [8, 9.5], [11, 9]]) for (let s = 0; s < 3; s++) Q.put(a - s * 0.6, b + s, PAL.osso, 3.6 - s * 0.4);
  Q.outline();
  return Q.part(3, 3);
}
// o fundo da boca: vermelho escuro com a brasa da garganta acesa
function paintMouth() {
  const W = 34, H = 13, Q = pp(W, H);
  for (let x = 2; x <= 30; x++) { const u = (x - 2) / 28; for (let y = 1; y <= 3 + Math.round((1 - u) * 5); y++) Q.put(x, y, PAL.boca, 4.4 - u * 3.2 + cg(x, y, 8231) * 0.5, u < 0.55); }
  return Q.part(3, 3);
}
// as patas: a da frente (o braço, o antebraço, a mão de garras) e a de trás (a coxa grossa, o jarrete, o pé)
function paintFore(dark) {
  const W = 20, H = 30, Q = pp(W, H), dk = dark ? 1 : 0;
  const lf = (x, y, t, nx, ny, d) => Q.put(x, y, nx > 0.35 ? PAL.barriga : PAL.cinza, 3.3 - dk - (nx * 0.7 + ny * 0.5) - d * 0.5 + scale(x, y, 8241, 3, 3)[0] * 0.5 + cg(x, y, 8242) * 0.3);
  Q.tube(9, 4, 8, 14, 4.6, 3.3, lf);
  Q.tube(8, 14, 10, 23, 3.1, 2.4, lf);
  Q.ball(11.5, 24.5, 4, 2.3, (x, y, dx, dy, d) => Q.put(x, y, PAL.cinza, 3.1 - dk - dy * 0.8 - dx * 0.3 - d * 0.4));
  for (const [a, b] of [[14, 25], [15.5, 26], [13, 26.5]]) { Q.put(a, b, PAL.osso, 4 - dk); Q.put(a + 1, b + 0.8, PAL.osso, 3.3 - dk); Q.put(a + 1.6, b + 1.6, PAL.osso, 2.6 - dk); }
  Q.put(7.5, 25, PAL.osso, 3.4 - dk); Q.put(6.6, 25.6, PAL.osso, 2.8 - dk);
  Q.outline();
  return Q.part(9, 4);
}
function paintHind(dark) {
  const W = 24, H = 30, Q = pp(W, H), dk = dark ? 1 : 0;
  const lf = (x, y, t, nx, ny, d) => Q.put(x, y, nx > 0.35 ? PAL.barriga : PAL.cinza, 3.3 - dk - (nx * 0.7 + ny * 0.5) - d * 0.5 + scale(x, y, 8251, 3, 3)[0] * 0.5 + cg(x, y, 8252) * 0.3);
  Q.ball(11, 9, 7, 6.5, (x, y, dx, dy, d) => { const [sd, em] = scale(x, y, 8253, 4, 3); Q.put(x, y, PAL.cinza, 3.3 - dk - (dx * 0.6 + dy) * 0.9 - d * d * 0.5 + sd); if (em && !dark && dy < 0.3) Q.put(x, y, PAL.brasa, 2.6, true); });
  Q.tube(9, 13, 6, 20, 3.3, 2.4, lf);
  Q.tube(6, 20, 10, 25, 2.3, 2, lf);
  Q.ball(12.5, 26, 4.5, 2.1, (x, y, dx, dy, d) => Q.put(x, y, PAL.cinza, 3.1 - dk - dy * 0.8 - dx * 0.3 - d * 0.4));
  for (const [a, b] of [[16, 26.5], [17.5, 27.5], [15, 28]]) { Q.put(a, b, PAL.osso, 4 - dk); Q.put(a + 1, b + 0.8, PAL.osso, 3.2 - dk); }
  Q.outline();
  return Q.part(11, 5);
}
// a asa dobrada, deitada nas costas (o pivô é a raiz no ombro; vai para trás)
function paintWingFold(dark) {
  const W = 58, H = 22, ox = 47, oy = 6, Q = pp(W, H), dk = dark ? 1.1 : 0;
  // a membrana pendurada debaixo do braço, com as dobras
  for (let x = 6; x <= 47; x++) {
    const u = (x - 6) / 41, bot = 6 + 7 * Math.pow(u, 0.8) - 2.5 * Math.abs(Math.sin(u * Math.PI * 3.2)), top = 5 + (u < 0.15 ? (0.15 - u) * 14 : 0);
    for (let y = Math.round(top); y <= bot; y++) { const fold = Math.sin(x * 0.75) * 0.7, k = (y - 5) / Math.max(1, bot - 5); Q.put(x, y, PAL.memb, 3.4 - dk - k * 1.3 + fold + cg(x, y, 8261) * 0.3); if (y > bot - 1 && !dark && hash2(x, 0, 8262) < 0.5) Q.put(x, y, PAL.brasa, 2.2, true); }
  }
  // o braço da asa por cima, os dedos dobrados e o polegar de garra no pulso
  Q.tube(47, 6, 8, 4, 2.6, 1.8, (x, y, t, nx, ny, d) => Q.put(x, y, PAL.cinza, 3.6 - dk - ny * 1.2 - d * 0.5 + cg(x, y, 8263) * 0.3));
  Q.tube(8, 4, 2, 13, 1.6, 0.8, (x, y, t, nx, ny, d) => Q.put(x, y, PAL.osso, 3.4 - dk - ny - d * 0.4));
  Q.put(6, 1, PAL.osso, 4 - dk); Q.put(7, 2, PAL.osso, 3.6 - dk); Q.put(5, 0, PAL.osso, 3 - dk);
  Q.outline();
  return Q.part(ox, oy);
}
// a asa aberta (88 x 66, o pivô é a raiz embaixo à esquerda): braço, pulso, quatro dedos, a membrana em arcos, a
// borda de trás acesa em brasa, uns rasgos de velhice
function paintWingOpen(dark) {
  const W = 88, H = 66, ox = 10, oy = 58, Q = pp(W, H), dk = dark ? 1.1 : 0;
  const root = [10, 58], elbow = [30, 34], wrist = [44, 10], tips = [[86, 5], [82, 27], [68, 47], [48, 60]];
  const poly = [wrist, tips[0]];
  for (let k = 1; k < tips.length; k++) { const a = tips[k - 1], b = tips[k]; poly.push([lerp(a[0], b[0], 0.5) - (a[0] + b[0] - 2 * wrist[0]) * 0.11, lerp(a[1], b[1], 0.5) - (a[1] + b[1] - 2 * wrist[1]) * 0.11]); poly.push(b); }
  poly.push([lerp(tips[3][0], root[0], 0.5) + 2, lerp(tips[3][1], root[1], 0.5) - 4]); poly.push(root); poly.push(elbow);
  const inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edge = (x, y) => !inside(x + 1.5, y) || !inside(x - 1.5, y) || !inside(x, y + 1.5) || !inside(x, y - 1.5);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inside(x + 0.5, y + 0.5)) continue;
    if (hash2(x >> 1, y >> 1, 8271) < 0.012 && Math.hypot(x - wrist[0], y - wrist[1]) > 20) continue;   // rasgos
    const dw = Math.hypot(x - wrist[0], y - wrist[1]) / 60, v = 3.6 - dk - dw * 1.1 - (y / H) * 0.6 + Math.sin(Math.atan2(y - wrist[1], x - wrist[0]) * 14) * 0.25 + cg(x, y, 8272) * 0.3;
    Q.put(x, y, PAL.memb, v);
    if (!dark && edge(x + 0.5, y + 0.5) && dw > 0.3 && hash2(x, y, 8273) < 0.7) Q.put(x, y, PAL.brasa, 1.8 + hash2(x, y, 8274) * 1.6, true);
  }
  // os dedos (ossos finos), o braço grosso por cima
  for (const t of tips) Q.tube(wrist[0], wrist[1], t[0], t[1], 1.6, 0.7, (x, y, u, nx, ny, d) => Q.put(x, y, PAL.cinza, 3.4 - dk - ny * 0.8 - d * 0.4 + u * 0.4));
  const arm = (x, y, t, nx, ny, d) => { const [sd, em] = scale(x, y, 8275, 3, 3); Q.put(x, y, PAL.cinza, 3.5 - dk - (nx * 0.6 + ny) * 0.9 - d * 0.5 + sd * 0.6); if (em && !dark) Q.put(x, y, PAL.brasa, 2.6, true); };
  Q.tube(root[0], root[1], elbow[0], elbow[1], 4.2, 3.2, arm);
  Q.tube(elbow[0], elbow[1], wrist[0], wrist[1], 3.2, 2.4, arm);
  horn(Q, wrist[0], wrist[1], wrist[0] - 2, wrist[1] - 6, wrist[0] + 2, wrist[1] - 9, 1.6, 0.5, PAL.osso, 8276, dk);   // o polegar de garra
  Q.outline();
  return Q.part(ox, oy);
}
// a ponta da cauda: uma lâmina de osso em losango com a borda acesa
function paintTip() {
  const W = 18, H = 16, Q = pp(W, H);
  for (let x = 2; x <= 16; x++) { const u = (x - 2) / 14, hw = u < 0.35 ? u / 0.35 * 5.5 : (1 - u) / 0.65 * 5.5; for (let y = Math.round(8 - hw); y <= Math.round(8 + hw); y++) { const ny = (y - 8) / Math.max(1, hw); Q.put(x, y, PAL.osso, 3.6 - ny * 1.1 - u * 0.4 + (Math.abs(ny) < 0.2 ? 0.7 : 0) + cg(x, y, 8281) * 0.3); if (Math.abs(ny) > 0.8 && hash2(x, y, 8282) < 0.6) Q.put(x, y, PAL.brasa, 2.6, true); } }
  Q.outline();
  return Q.part(2, 8);
}
// o monte de moedas debaixo da barriga dele dormindo (sobe e desce com a respiração)
function paintHeap() {
  const W = 72, H = 16, Q = pp(W, H);
  for (let k = 0; k < 140; k++) {
    const u = hash2(k, 1, 8291), x = 4 + u * 64, top = 15 - 10 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 36) / 33, 2))), y = top + hash2(k, 2, 8291) * (15 - top), r = 1.3 + hash2(k, 3, 8291) * 0.9;
    Q.ball(x, y, r, r * 0.8, (px, py, dx, dy, d) => { let v = 3.4 - (dx + dy) * 0.9 - d * 0.4 + (py - top) * -0.08; if (d > 0.75) v -= 1.1; Q.put(px, py, PAL.ouro, v); });
    if (hash2(k, 4, 8291) < 0.12) Q.put(x - 0.5, y - 0.5, PAL.ouro, 5, true);
  }
  Q.outline();
  return Q.part(36, 15);
}
// o jato de fogo: um bocado de chama (gradiente redondo) em três tamanhos
function flameBlob(r, inner, outer) {
  const c = mk(r * 2, r * 2), x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r), [a, b, d] = rgb(inner), [e, f, h] = rgb(outer);
  g.addColorStop(0, `rgba(${a},${b},${d},1)`); g.addColorStop(0.5, `rgba(${e},${f},${h},0.75)`); g.addColorStop(1, `rgba(${e},${f},${h},0)`);
  x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c;
}
// as peças são pintadas na primeira vez que alguém desenha (e guardadas)
CZA.get = () => {
  if (CZA.P) return CZA.P;
  const segN = [], segT = [], hotN = [];
  for (let k = 0; k < CZ_NN; k++) { const r = lerp(7.5, 5, (k + 0.5) / CZ_NN); segN.push(paintSeg(r, k % 2 === 0, 8300 + k)); hotN.push(paintHot(r)); }
  for (let k = 0; k < CZ_TN; k++) segT.push(paintSeg(lerp(7, 2.3, k / CZ_TN), k % 2 === 1 && k < 11, 8320 + k));
  CZA.P = {
    torso: paintTorso(), chest: paintChest(), segN, segT, hotN, tip: paintTip(),
    head: paintHead(false), headO: paintHead(true), jaw: paintJaw(), mouth: paintMouth(),
    fore: paintFore(false), foreD: paintFore(true), hind: paintHind(false), hindD: paintHind(true),
    fold: paintWingFold(false), foldD: paintWingFold(true), open: paintWingOpen(false), openD: paintWingOpen(true), heap: paintHeap(),
    fl: [flameBlob(5, '#fff4c0', '#ff8a10'), flameBlob(8, '#ffd050', '#e04a08'), flameBlob(12, '#ffa020', '#a82a04')]
  };
  return CZA.P;
};
CZA.GL = { brasa: glow(40, '#ff7a1a'), boca: glow(18, '#ffb040'), olho: glow(5, '#ffc030'), fogo: glow(22, '#ff8a20'), bola: glow(14, '#ffa020'), chamine: glow(60, '#ff6a10'), escama: glow(14, '#ffb050'), cortina: glow(16, '#ff8a20') };
}

/* ---------- desenho ---------- */
const CZ_WHITE = new WeakMap();
const czWhite = cv => { let w = CZ_WHITE.get(cv); if (!w) { w = whiteOf(cv); CZ_WHITE.set(cv, w); } return w; };
// a lista do que desenhar (espaço do corpo), de trás para a frente; ea = o quanto a parte acesa aparece
function czParts(M, R) {
  const A = CZA.get(), L = [];
  const add = (p, x, y, a = 0, sx = 1, sy = 1, ea = 1, emOnly = false) => L.push({ p, x, y, a, sx, sy, ea, emOnly });
  const open = M.wing > 0.35, fk = Math.sin(M.flap), flapK = open ? clamp(0.35 + fk * 0.75, -0.75, 1.1) : 1;
  const wingA = -0.15 - M.wingA - (open ? 0.1 : 0);
  // a asa de trás e as patas de trás (mais escuras)
  if (open) add(A.openD, CZ_WING[0] - 4, CZ_WING[1] - 1, wingA - 0.15, 0.9, flapK * 0.9, 0);
  else add(A.foldD, CZ_WING[0] - 3, CZ_WING[1] - 2, 0.3, 1, 1, 0);
  add(A.hindD, CZ_HIND[0] - 4, CZ_HIND[1] - 1, M.legH * 0.9 + 0.1, 1, 1, 0);
  add(A.foreD, CZ_FORE[0] - 4, CZ_FORE[1] - 1, M.legF * 0.9 - 0.1, 1, 1, 0);
  // a cauda, da ponta para a base
  add(A.tip, R.tip.x, R.tip.y, R.tip.a);
  for (let k = R.tail.length - 1; k >= 0; k--) add(A.segT[k], R.tail[k].x, R.tail[k].y, R.tail[k].a + Math.PI);
  // o tronco (respira) e o peito aceso
  add(A.torso, 0, 0, 0, 1, M.sy);
  if (M.chest > 0.01) add(A.chest, 0, 0, 0, 1, M.sy, M.chest, true);
  add(A.hind, CZ_HIND[0], CZ_HIND[1], M.legH);
  add(A.fore, CZ_FORE[0], CZ_FORE[1], M.legF);
  // a asa dobrada fica nas costas, por cima do tronco
  if (!open) add(A.fold, CZ_WING[0], CZ_WING[1], 0.22 + M.wingA);
  // a asa aberta da frente fica atrás do pescoço (a cabeça sempre aparece)
  if (open) add(A.open, CZ_WING[0], CZ_WING[1], wingA, 1, flapK);
  // o pescoço da base para a cabeça; a garganta acende de baixo para cima
  for (let k = 0; k < R.neck.length; k++) {
    const s = R.neck[k]; add(A.segN[k], s.x, s.y, s.a);
    const on = clamp(M.throat * (CZ_NN + 1) - k, 0, 1); if (on > 0.01) add(A.hotN[k], s.x, s.y, s.a, 1, 1, on, true);
  }
  // a boca: o fundo, a mandíbula (gira na dobradiça) e a cabeça por cima; virada para trás, a cabeça vira de ponta
  // cabeça para os chifres ficarem em cima
  const h = R.head, hf = Math.cos(h.a) < 0 ? -1 : 1, ch = Math.cos(h.a), sh = Math.sin(h.a), hx = h.x + ch * 2 - sh * 2 * hf, hy = h.y + sh * 2 + ch * 2 * hf;
  if (M.jaw > 0.05) add(A.mouth, hx, hy, h.a + hf * M.jaw * 0.28, 1, hf, 0.4 + M.mouth * 0.6);
  add(A.jaw, hx, hy, h.a + hf * M.jaw * 0.55, 1, hf);
  add(M.eye > 0.5 ? A.headO : A.head, h.x, h.y, h.a, 1, hf);
  return L;
}
// layer 0: o corpo (antes da luz); layer 1: o que acende (depois da luz)
function czDrawDragon(X, Y, M, layer, flash) {
  const sx = Math.round(X + M.x), sy = Math.round(Y + M.y);
  if (sx < -170 || sx > VW + 170 || sy < -170 || sy > VH + 170) return;
  const R = czRig(M), L = czParts(M, R), pulse = 0.75 + 0.25 * Math.sin(gameTime * 2.3);
  lc.save(); lc.translate(sx, sy); if (M.f < 0) lc.scale(-1, 1); if (M.rot) lc.rotate(M.rot);
  for (const c of L) {
    let img;
    if (layer) { img = c.p.em; if (!img || c.ea <= 0) continue; lc.globalAlpha = Math.min(1, c.ea * (c.emOnly ? 1 : pulse)); }
    else { if (c.emOnly) continue; img = flash ? czWhite(c.p.cv) : c.p.cv; lc.globalAlpha = 1; }
    lc.save(); lc.translate(c.x, c.y); if (c.a) lc.rotate(c.a);
    if (c.sx !== 1 || c.sy !== 1) lc.scale(c.sx, c.sy);
    lc.drawImage(img, -c.p.px, -c.p.py);
    lc.restore();
  }
  lc.restore(); lc.globalAlpha = 1;
}
// no jogo ele é desenhado pelo HOOK.drawWorld; fora dele (o retrato da wiki) desenha de pé, olhando para a direita
DRAW_E.cinzarel = (e, fx, fy) => {
  if (e === czBoss || typeof UDW === 'undefined') return;
  // o quadro da wiki é pequeno para ele: aumenta o quadro só neste retrato (a wiki recorta o que foi desenhado)
  low.width = 560; low.height = 340; VW = 560; VH = 340; lc.imageSmoothingEnabled = false;
  const M = Object.assign({}, czM, CZ_POSE.stand, { x: 0, y: -CZ_STAND, f: 1, sleep: 0, eye: 1, heap: 0 });
  czDrawDragon(300, 300, M, 0, false); czDrawDragon(300, 300, M, 1, false);
};
EYES_E.cinzarel = () => {};
WARN_E.cinzarel = e => e.state === 'biteTell' || e.state === 'tailTell' || e.state === 'breathTell' || e.state === 'gustTell' || e.state === 'landTell' || e.state === 'spitTell' || e.state === 'sweepTell';
const czNear = cx => { const B = czB(); return !!(B && czPlan && pl && Math.abs(wdx(B.cx - Math.floor((cx + VW / 2) / T))) < 80); };
HOOK.drawWorld.push((cx, cy) => {
  if (!czNear(cx)) return;
  const X = czCX() - cx, Y = czCY() - cy, M = czM;
  // a sombra do pouso: cresce e escurece no chão
  const S = czFx.shadow;
  if (S) { const k = clamp(S.t / 1.2, 0, 1), w = Math.round(10 + k * 34), x = Math.round(X + S.x), y = Math.round(Y + S.g); lc.globalAlpha = 0.25 + 0.45 * k; lc.fillStyle = '#05030a'; lc.beginPath(); lc.ellipse(x, y - 1, w, 3 + k * 3, 0, 0, Math.PI * 2); lc.fill(); lc.globalAlpha = 1; }
  if (czState.dead) return;
  const e = czBoss;
  // dormindo: o monte de moedas sob a barriga, que sobe e desce com a respiração
  if ((!e || e.state === 'sleep') && M.sleep > 0.5) {
    const P = CZA.get(), hp = M.heap || 0, x = Math.round(X + M.x), y = Math.round(Y + czPlan.peakY + 7 - hp * 1.5);
    if (x > -80 && x < VW + 80 && y > -40 && y < VH + 60) { lc.save(); lc.translate(x, y); lc.scale(1, 1 + 0.12 * hp); lc.drawImage(P.heap.cv, -P.heap.px, -P.heap.py); lc.restore(); }
  }
  czDrawDragon(X, Y, M, 0, e && e.flash > 0);
});
HOOK.drawTop.push((cx, cy) => {
  // a labareda da Escama (onde quer que o herói esteja)
  if (czFx.flames.length) {
    const A = CZA.get();
    for (const F of czFx.flames) { const L = Math.min(1, F.t / 0.12) * 44, a = 1 - Math.max(0, (F.t - 0.25) / 0.15); for (let s = 0; s < L; s += 5) { const b = A.fl[s < 12 ? 0 : s < 28 ? 1 : 2]; lc.globalAlpha = Math.max(0, 0.8 * a); lc.drawImage(b, Math.round(F.x + F.dir * s - cx - b.width / 2 + Math.sin(gameTime * 40 + s) * 1.5), Math.round(F.y - cy - b.height / 2 - s * 0.08)); } }
    lc.globalAlpha = 1;
  }
  if (!czNear(cx)) return;
  const X = czCX() - cx, Y = czCY() - cy, M = czM, P = czPlan;
  // a crosta da chaminé brilhando
  const chx = Math.round(X), chy = Math.round(Y + P.JT * T);
  if (chy > -40 && chy < VH + 40) { lc.fillStyle = DG_COL.magmaClaro; for (let n = 0; n < 6; n++) if (Math.sin(gameTime * 3 + n * 1.7) > 0.3) lc.fillRect(chx - 18 + n * 7, chy - 2 * T + (n & 1) * 3, 2, 1); }
  // o dragão aceso: as bordas de brasa, os olhos, a boca, o peito, a garganta
  if (!czState.dead) czDrawDragon(X, Y, M, 1, false);
  // o jato de fogo
  const F = czFx.ray, A = CZA.get();
  if (F && F.len > 0) {
    const ux = Math.cos(F.a), uy = Math.sin(F.a);
    for (let s = 0; s < F.len; s += 4) {
      const k = s / Math.max(1, F.len), b = A.fl[k < 0.15 ? 0 : k < 0.5 ? 1 : 2], wob = Math.sin(gameTime * 35 + s * 0.4) * (1 + k * 3);
      lc.globalAlpha = 0.85 - k * 0.25; lc.drawImage(b, Math.round(X + F.x + ux * s - uy * wob - b.width / 2), Math.round(Y + F.y + uy * s + ux * wob - b.height / 2));
    }
    lc.globalAlpha = 1; lc.fillStyle = '#fff4c0';
    for (let s = 0; s < F.len * 0.6; s += 3) lc.fillRect(Math.round(X + F.x + ux * s), Math.round(Y + F.y + uy * s), 2, 2);
  }
  // as bolas de magma: núcleo claro, a casca escura
  for (const b of czFx.balls) {
    const x = Math.round(X + b.x), y = Math.round(Y + b.y);
    lc.fillStyle = '#4a1004'; lc.fillRect(x - 3, y - 2, 7, 5); lc.fillRect(x - 2, y - 3, 5, 7);
    lc.fillStyle = DG_COL.magma; lc.fillRect(x - 2, y - 2, 5, 5); lc.fillStyle = DG_COL.magmaClaro; lc.fillRect(x - 1, y - 1, 3, 3); lc.fillStyle = '#fff4c0'; lc.fillRect(x - 1, y - 1, 1, 1);
  }
  // a marca do pouso: anel âmbar piscando em volta da sombra
  const S = czFx.shadow;
  if (S) { const k = clamp(S.t / 1.2, 0, 1), w = Math.round(12 + k * 34), x = Math.round(X + S.x), y = Math.round(Y + S.g); lc.globalAlpha = (0.4 + 0.5 * k) * ((Math.floor(gameTime * 12) & 1) ? 1 : 0.5); lc.strokeStyle = DG_COL.magma; lc.lineWidth = 1; lc.beginPath(); lc.ellipse(x + 0.5, y - 0.5, w, 3 + k * 3, 0, 0, Math.PI * 2); lc.stroke(); lc.globalAlpha = 1; }
  // o vento das asas: riscos dourados correndo para fora
  const G = czFx.gust;
  if (G && G.t < 0.45) { lc.fillStyle = '#fff0a0'; for (let n = 0; n < 24; n++) { const d = n & 1 ? 1 : -1, x = Math.round(X + M.x + d * (20 + ((G.t * 420 + n * 37) % 170))), y = Math.round(Y + M.y + 18 - (n % 6) * 7); lc.globalAlpha = 0.6 * (1 - G.t / 0.45); lc.fillRect(x, y, 6, 1); } lc.globalAlpha = 1; }
  // as cortinas: fios de magma descendo
  const Se = czFx.seal;
  if (Se) for (let n = 0; n < Se.n; n++) {
    const [i, j] = Se.cells[n], x = Math.round(X + i * T), y = Math.round(Y + j * T);
    if (x < -T || x > VW || y < -T || y > VH) continue;
    for (let s = 0; s < 3; s++) { lc.fillStyle = s === 1 ? DG_COL.magmaClaro : DG_COL.magma; lc.fillRect(x + 2 + s * 4, y + ((Math.floor(gameTime * 14) + s * 5 + j * 4) % T), 1, 3); }
  }
});
HOOK.drawGlow.push((cx, cy) => {
  const GL = CZA.GL;
  // a Escama no braço: um brilho âmbar fraco; a labareda
  if (pl && !pl.dead && pl.lg && pl.lg.cinzarel) { lc.globalAlpha = 0.16 + 0.05 * Math.sin(gameTime * 2.4); lc.drawImage(GL.escama, Math.round(pl.x + pl.w / 2 + pl.facing * (pl.shieldK > 0.5 ? 7 : -2)) - cx - 14, Math.round(pl.y + 13) - cy - 14); }
  for (const F of czFx.flames) { const L = Math.min(1, F.t / 0.12) * 44; lc.globalAlpha = Math.max(0, 0.6 * (1 - F.t / 0.4)); for (let s = 0; s < L; s += 14) lc.drawImage(GL.fogo, Math.round(F.x + F.dir * s) - cx - 22, Math.round(F.y) - cy - 22); }
  if (!czNear(cx)) return;
  const X = czCX() - cx, Y = czCY() - cy, M = czM, P = czPlan;
  // a chaminé: o brilho que desce do alto
  lc.globalAlpha = 0.32 + 0.06 * Math.sin(gameTime * 0.9); lc.drawImage(GL.chamine, Math.round(X) - 60, Math.round(Y + P.JT * T) - 70);
  lc.globalAlpha = 0.12; lc.drawImage(GL.chamine, Math.round(X) - 60, Math.round(Y + P.JT * T) - 20);
  // o dragão: a brasa do peito, a boca, os olhos, a garganta
  if (!czState.dead) {
    const R = czRig(M), [tx, ty] = czL(M, 14, 4), [mx, my] = czL(M, R.mouth.x, R.mouth.y), [hx, hy] = czL(M, R.headC.x, R.headC.y - 4);
    lc.globalAlpha = 0.12 + 0.3 * M.chest; lc.drawImage(GL.brasa, Math.round(X + tx) - 40, Math.round(Y + ty) - 40);
    if (M.mouth > 0.02) { lc.globalAlpha = 0.6 * M.mouth; lc.drawImage(GL.boca, Math.round(X + mx) - 18, Math.round(Y + my) - 18); }
    if (M.eye > 0.5) { lc.globalAlpha = 0.5; lc.drawImage(GL.olho, Math.round(X + hx) - 5, Math.round(Y + hy) - 5); }
    for (let k = 0; k < R.neck.length; k++) { const on = clamp(M.throat * (CZ_NN + 1) - k, 0, 1); if (on <= 0.01) continue; const [nx, ny] = czL(M, R.neck[k].x, R.neck[k].y); lc.globalAlpha = 0.35 * on; lc.drawImage(GL.boca, Math.round(X + nx) - 18, Math.round(Y + ny) - 18); }
  }
  const F = czFx.ray;
  if (F && F.len > 0) { const ux = Math.cos(F.a), uy = Math.sin(F.a); for (let s = 0; s < F.len; s += 16) { lc.globalAlpha = 0.55; lc.drawImage(GL.fogo, Math.round(X + F.x + ux * s) - 22, Math.round(Y + F.y + uy * s) - 22); } }
  for (const b of czFx.balls) { lc.globalAlpha = 0.8; lc.drawImage(GL.bola, Math.round(X + b.x) - 14, Math.round(Y + b.y) - 14); }
  const Se = czFx.seal; if (Se) for (let n = 0; n < Se.n; n += 2) { const [i, j] = Se.cells[n]; lc.globalAlpha = 0.35; lc.drawImage(GL.cortina, Math.round(X + (i + 0.5) * T) - 16, Math.round(Y + (j + 0.5) * T) - 16); }
});
// a luz: a chaminé, a brasa dele, a boca, o jato, as bolas, as cortinas
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const B = czB(), P = czPlan; if (!B || !P || !pl) return;
  if (Math.abs(wdx(B.cx - (x0 + w / 2))) > w / 2 + 50 || B.fy + P.J1 < y0 || B.fy + P.J0 > y0 + h) return;
  const X = czCX(), Y = czCY(), M = czM;
  addL(X, Y + (P.JT + 2) * T, 0.8); addL(X, Y + (P.JT + 8) * T, 0.55);
  if (!czState.dead) {
    const R = czRig(M), [tx, ty] = czL(M, 10, 0), [mx, my] = czL(M, R.mouth.x, R.mouth.y);
    addL(X + tx, Y + ty, 0.45 + 0.35 * M.chest);
    if (M.mouth > 0.1) addL(X + mx, Y + my, 0.9 * M.mouth);
  }
  const F = czFx.ray; if (F && F.len > 0) for (let s = 0; s < F.len; s += 2 * T) addL(X + F.x + Math.cos(F.a) * s, Y + F.y + Math.sin(F.a) * s, 0.95);
  for (const b of czFx.balls) addL(X + b.x, Y + b.y, 0.7);
  if (czFx.seal) for (const D of P.doors) addL(X + (D.s < 0 ? -46 : 46) * T, Y + (D.jd - 2) * T, 0.7);
}; }

/* ---------- o turno: acordar, sair, a luta ---------- */
HOOK.update.push(dt => {
  if (typeof DMG_KIND !== 'undefined' && !DMG_KIND.cinzarel) DMG_KIND.cinzarel = 'fogo';
  czFlameTick(dt);
  czAmbient(dt);
  const B = czB(); if (!B || !czPlan || !pl || state !== 'play') return;
  if (czState.dead) return;
  // um save velho ou um bloco posto deixou a cratera diferente: volta para o plano (e o herói, se estava dentro, para a porta)
  if (!czChecked && !bossFight) {
    czChecked = true;
    if (czDiffers()) {
      const D = czPlan.doors[0];
      if (czHeroIn(3) && D) { pl.x = czCX() + (D.s * 48 + 0.5) * T - pl.w / 2; pl.y = czCY() + D.jd * T - pl.h - 0.01; pl.vx = pl.vy = 0; }
      czWrite();
    }
  }
  let e = czBoss;
  if (e && e.dead) czBoss = e = null;
  if (!bossFight) {
    // o herói entrou: o dragão dormindo passa a existir (para levar golpe); saiu: some de novo
    if (!e && !pl.dead && czHeroIn(1)) e = czSpawnSleeping();
    else if (e && (pl.dead || !czHeroIn(5))) { czDrop(e); czBoss = e = null; }
    if (!e) { czSleepTick(dt); czM.t += dt; return; }
    // pisou no morro: acorda
    if (e.state === 'sleep' && !pl.dead && pl.onGround) {
      const H = czHero(), i = Math.floor(H.hx / T), j = Math.floor((H.hy - 2) / T);
      if (czMM(i) <= 23 && j <= CZ_FL - 1 && j >= czPlan.JT) czWake(e, false);
    }
    return;
  }
  if (!czFight()) return;
  if (!pl.dead && !czHeroIn(3)) { endBossFight(false); return; }
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
  czFxTick(dt);
});

/* ---------- som: a respiração, o rugido, o sopro, as asas, o pouso, as bolas, o fosso ---------- */
// a respiração do dragão: puxa o ar (ruído grave que sobe) e solta longo; um ronco muito baixo por baixo
function czBreathSnd(v = 1) {
  if (!ac || muted || !noiseBuf) return;
  const t0 = ac.currentTime, s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(140, t0); f.frequency.linearRampToValueAtTime(330, t0 + 1.4); f.frequency.linearRampToValueAtTime(110, t0 + 3.8);
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.05 * v, t0 + 1.3); g.gain.linearRampToValueAtTime(0.015 * v, t0 + 1.6); g.gain.linearRampToValueAtTime(0.08 * v, t0 + 2.1); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 4);
  s.connect(f); f.connect(g); g.connect(sfxOut); s.start(t0); s.stop(t0 + 4.1);
  tone(46, 3.2, 'sine', 0.05 * v, -8, 0.5);
}
// a inspiração antes do sopro: o ruído abre de grave para agudo
function czInhaleSnd(v = 1) {
  if (!ac || muted || !noiseBuf) return;
  const t0 = ac.currentTime, s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(200, t0); f.frequency.linearRampToValueAtTime(900, t0 + 0.9 * v);
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.08, t0 + 0.9 * v); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.05 * v);
  s.connect(f); f.connect(g); g.connect(sfxOut); s.start(t0); s.stop(t0 + 1.1 * v);
}
// no Leito de Ouro, a cada 25 a 35 s, a respiração vem do lado da cratera (mais alta quanto mais perto); para na morte
const czAmb = { t: 12 };
function czAmbient(dt) {
  if (czState.dead || !pl || pl.dead || state !== 'play' || typeof dragonBand !== 'function') return;
  const B = czB(); if (!B || !czPlan || czFight() || czBoss) return;
  const ty = Math.floor((pl.y + pl.h / 2) / T); if (dragonBand(ty) !== 3) return;
  czAmb.t -= dt; if (czAmb.t > 0) return;
  czAmb.t = 25 + Math.random() * 10;
  const d = Math.hypot(wdx(Math.floor((pl.x + pl.w / 2) / T) - B.cx), ty - (B.fy - 20));
  sfx.czRespira(clamp(1.1 - d / 200, 0.2, 1));
}
Object.assign(sfx, {
  czRespira(v = 1) { czBreathSnd(v); },
  czRugido(v = 1) { tone(70, 1.6 * v, 'sawtooth', 0.07, -25); tone(105, 1.4 * v, 'sawtooth', 0.04, -40, 0.05); tone(52, 1.8 * v, 'sine', 0.08, -10); noise(1.6 * v, 0.12, 380, 'bandpass', 0, 0.8); noise(1.2 * v, 0.06, 1400, 'bandpass', 0.15, 1.2); },
  czRosna(v = 1) { tone(62, 0.6, 'sawtooth', 0.04 * v, 12); noise(0.6, 0.05 * v, 300, 'lowpass'); },
  czMordida(k = 0) { if (!k) { noise(0.12, 0.12, 900, 'bandpass', 0, 1.5); tone(180, 0.1, 'square', 0.04, -100); } else { noise(0.08, 0.18, 2200, 'bandpass', 0, 2); tone(110, 0.12, 'triangle', 0.08, -60); } },
  czCauda(k = 0) { if (!k) { for (let n = 0; n < 3; n++) noise(0.08, 0.04, 3000, 'highpass', n * 0.2); } else { noise(0.45, 0.14, 500, 'bandpass', 0, 0.7); tone(90, 0.35, 'triangle', 0.05, -40); } },
  czInspira(v = 1) { czInhaleSnd(v); },
  czSopro(d = 1) { noise(d, 0.16, 700, 'bandpass', 0, 0.5); noise(d * 0.9, 0.08, 2600, 'bandpass', 0.05, 0.8); tone(60, d, 'sawtooth', 0.04, -10); },
  czAsa(v = 1) { noise(0.35, 0.09 * v, 260, 'lowpass'); tone(48, 0.3, 'sine', 0.06 * v, -10); },
  czVento() { noise(0.6, 0.14, 900, 'bandpass', 0, 0.6); noise(0.5, 0.08, 4000, 'highpass', 0.05); },
  czPouso(v = 1) { noise(0.7 * v, 0.24 * v, 160, 'lowpass'); tone(40, 0.8, 'sine', 0.12 * v, -15); for (let n = 0; n < 6; n++) tone(2200 + n * 310, 0.12, 'triangle', 0.012, -300, 0.15 + n * 0.07); },
  czCuspe() { noise(0.18, 0.1, 600, 'bandpass', 0, 2); tone(140, 0.2, 'sine', 0.05, -90); },
  czRespingo() { noise(0.4, 0.1, 3000, 'highpass'); noise(0.25, 0.08, 400, 'lowpass'); },
  czFosso(k = 0) { if (!k) { noise(1.8, 0.06, 120, 'lowpass'); tone(38, 1.8, 'sine', 0.06, 6); } else { noise(0.8, 0.12, 200, 'lowpass'); noise(0.9, 0.05, 2500, 'highpass', 0.1); } },
  czCortina() { noise(1.0, 0.08, 1800, 'highpass'); noise(0.8, 0.08, 250, 'lowpass'); tone(80, 0.9, 'sawtooth', 0.03, -20); },
  czAgarra() { noise(0.25, 0.14, 500, 'bandpass', 0, 1.5); tone(70, 0.3, 'triangle', 0.06, -30); },
  czLabareda() { noise(0.35, 0.12, 1200, 'bandpass', 0, 0.7); tone(220, 0.25, 'sawtooth', 0.03, -120); },
  czMorte() { tone(90, 3.2, 'sawtooth', 0.07, -55); tone(60, 3.6, 'sine', 0.09, -30, 0.1); noise(3, 0.12, 300, 'bandpass', 0, 0.6); for (let n = 0; n < 10; n++) tone(1800 + n * 240, 0.25, 'triangle', 0.012, -400, 1 + n * 0.12); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.cinzarel = { dead: czState.dead };
  // a cortina nunca vai para o save
  if (o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([, t]) => t !== DG_CORTINA);
  return o;
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.cz) bossFight = null;
  if (czGoldDmg0 != null && typeof DG_GOLD !== 'undefined' && DG_GOLD) { DG_GOLD.dmg = czGoldDmg0; czGoldDmg0 = null; }
  czBoss = null; czPlan = null; czChecked = false; czClearFx(); czFx.flames.length = 0;
  czState.dead = !!(sv && sv.cinzarel && sv.cinzarel.dead);   // antes da geração: dgDress lê
  return _nw(sd, sv);
}; }
