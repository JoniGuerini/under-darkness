'use strict';

/* ================= A Rainha da Colmeia: a chefe da Colmeia =================
   A esfera de favos do Berçário (docs/camadas/09-colmeia.md, seção 7). O 195 reserva a caixa de 44 x 44 (cmBoss,
   tudo Cera Real) e chama cmDress durante a geração; este arquivo escreve a esfera dentro dela: a casca de Quitina
   de 2 blocos no raio 20, dois anéis de Favo Real (raio 9 a 11 e 14 a 16) com galerias curvas de 2 a 3 entre eles,
   saliências de favo a cada 3 fileiras nos lados (o pulo do herói é de 3), um piso de Favo Real na altura das
   portas, o oco no centro com a massa de Cera Real onde a Rainha está colada pelo abdômen, ovos na parede interna e
   alguns favos de mel. As duas galerias reais entram pela casca na altura do centro.
   Pisar dentro da casca acorda a Rainha; entrar no oco ou acertá-la faz o Lacre Real crescer nas duas aberturas.
   Durante a luta o Favo Real quebra com 2 golpes (arma ou picareta; 40% solta larva, HATCH); fora dela nada da
   esfera quebra. Sair (portal, teleporte, a porta antes do lacre) ou morrer refaz a esfera pela semente (o plano
   que cmDress guardou), as larvas e os ovos somem e ela volta presa com a vida cheia.
   Três fases, todo golpe com aviso:
     1. presa (100% a 60%): cântico (o abdômen acende em ondas, um anel de luz sai dela, 1,2 s; os favos intactos
        num raio de 6 do herói soltam larvas), cuspe de geleia (a garganta incha rosada 0,6 s; 3 bolas em leque,
        60%), ferroada curta (o ferrão recua e pinga 0,8 s, estoca em linha, 100%).
     2. solta (60%): o abdômen se rompe e fica no oco como saco de ovos (15% da vida dela, morre com 3 golpes de
        perto; matar o saco tira essa vida dela) que cola um ovo na parede a cada 4 s (eclode em 6 s). Ela voa:
        investida (recua, asas em borrão, linha de poeira no caminho 1 s; atravessa a esfera rasgando todo Favo
        Real, 90%), cuspe, ferroada, e uma vez a guarda real (o lacre abre um instante e entram 2 soldadas).
     3. a esfera se abre (25%): arranca o resto dos anéis; leque de 5 ferrões (abdômen pulsando 0,7 s, 50%), voo em
        espiral colada na parede pingando mel fervente (marca dourada 0,6 s antes, 40%), grito real (asas abertas e
        tremor 1,5 s: todos os ovos eclodem) e a investida.
   Solta o Ferrão Real (adaga lendária: cada acerto põe uma dose de veneno da colmeia, na quinta estoura com 150% do
   golpe) e, na primeira vitória, uma das três bases da camada. A morte fica salva (rainha.dead); com ela morta a
   esfera fica aberta e não há luta.
   Encaixe como o Sineiro (137): cmDress, endBossFight, hitEnemy, killEnemy, breakTile, pickImpact, recalc,
   propLights, makeSave e newWorld embrulhados; o resto por AI/DRAW_E/HOOK. Carrega depois do 186 (o chefe da Fortaleza), antes do 199
   (que embrulha breakTile por fora) e do 49 (que escala ET). */

// nível pelo registro das camadas (129); números escritos como os dos monstros, o 49 escala
const CMQ_L = layerBossLvl('colmeia');
const CMQ = { hp: Math.round(330 * (1 + 0.3 * (CMQ_L - 1)) / 10) * 10, dmg: Math.round(9 * (1 + 0.2 * (CMQ_L - 1))), xp: 480, p2: 0.6, p3: 0.25, sac: 0.15, maxMin: 8 };
const cmqState = { dead: false };
ET.rainha = { name: 'A Rainha da Colmeia', w: 40, h: 36, hp: CMQ.hp, dmg: CMQ.dmg, xp: CMQ.xp, kb: 0, fly: true, phase: true, blood: '#d08a1a', boss: true };
ET.rainhasaco = { name: 'Saco de Ovos', w: 26, h: 22, hp: Math.round(CMQ.hp * CMQ.sac), dmg: 0, xp: 30, kb: 0, fly: true, phase: true, blood: '#f0d890' };
const CMQ_DROPS = [['ferrao_real', 1], ['geleia_real', 1, 2, 4], ['ferrao', 1, 3, 6], ['min_ambrita', 1, 6, 10], ['mel_escuro', 1, 3, 6], ['pocao', 1, 2, 4]];
const CMQ_SAC_DROPS = [['geleia_real', 1, 1, 2]];
const CMQ_BASES = ['lanca_ferrao', 'escudo_favo', 'elmo_ambar'];
DROPS.rainha = CMQ_DROPS.filter(([id]) => ITEMS[id]); DROPS.rainhasaco = CMQ_SAC_DROPS.filter(([id]) => ITEMS[id]);
let cmqBoss = null, cmqSac = null, cmqPlan = null, cmqChecked = false, cmqAllow = false;
const cmqFx = { balls: [], stings: [], drops: [], eggs: [], globs: [], rings: [], pops: [], hits: new Map(), swing: new Map(), lacre: null, guard: null, spike: null, dust: null };

/* ---------- geometria (a caixa: colunas cx-22..cx+21, linhas cy-22..cy+21; o centro é o canto do bloco cx, cy) ---------- */
const CMQ_N = 44, CMQ_H = 22;
const CMQ_KF = 0, CMQ_KC = 1, CMQ_K3 = 2, CMQ_KB = 3, CMQ_K2 = 4, CMQ_KA = 5, CMQ_KO = 6, CMQ_KM = 7;   // fora, casca, galeria 3, anel B, galeria 2, anel A, oco, massa
const cmqB = () => (typeof cmBoss !== 'undefined' && cmBoss) ? cmBoss : null;
const cmqLap = x => { const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
const cmqCX = () => cmqLap(cmqB().cx * T), cmqCY = () => cmqB().cy * T;
const cmqI = (i, j) => { const B = cmqB(); return (B.cy + j) * WW + wrapX(B.cx + i); };
const cmqK = (i, j) => (j + CMQ_H) * CMQ_N + (i + CMQ_H);
const cmqD = (i, j) => Math.hypot(i + 0.5, j + 0.5);
function cmqIJ(tx, ty) { const B = cmqB(); if (!B) return null; const i = wdx(wrapX(tx) - B.cx), j = ty - B.cy; return i >= -22 && i <= 21 && j >= -22 && j <= 21 ? [i, j] : null; }
const cmqInBox = (tx, ty) => !!cmqIJ(tx, ty);
const cmqDirty = i => { if (chunks.size) markDirty(i % WW, (i / WW) | 0); };
const cmqLive = () => !!(cmqB() && cmqPlan && !cmqState.dead);
const cmqFight = () => !!(bossFight && bossFight.cmq);
// o herói em relação ao centro da esfera: px e blocos
function cmqHero() { const lx = pl.x + pl.w / 2 - cmqCX(), ly = pl.y + pl.h / 2 - cmqCY(); return { lx, ly, d: Math.hypot(lx, ly) / T }; }
const cmqSoft = t => t === CM_FAVO_REAL || t === CM_FAVO_MEL || t === CM_OVO;
function cmqDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }

/* ---------- o plano da esfera (a semente: o que cmDress escreve e o que o reinício devolve) ---------- */
function cmqLayout(dead) {
  const B = cmqB(), N = CMQ_N, t = new Uint16Array(N * N), w = new Uint16Array(N * N), k = new Uint8Array(N * N);
  const s1 = hash2(B.cx, B.cy, 9601) * 6.283, s2 = hash2(B.cy, B.cx, 9602) * 6.283, s3 = hash2(B.cx + 7, B.cy, 9603) * 6.283;
  const wob = (a, f, p) => 0.5 + 0.5 * (Math.sin(a * f + p) * 0.6 + Math.sin(a * (f + 2) + p * 1.7) * 0.4);   // 0..1 em volta
  for (let j = -22; j <= 21; j++) for (let i = -22; i <= 21; i++) {
    const d = cmqD(i, j), a = Math.atan2(j + 0.5, i + 0.5), q = cmqK(i, j);
    const u1 = wob(a, 3, s1), u2 = wob(a, 4, s2), u3 = wob(a, 5, s3);
    let K;
    if (d >= 20.5) K = CMQ_KF; else if (d >= 18.5) K = CMQ_KC; else if (d >= 16.5 - 0.5 * u3) K = CMQ_K3;
    else if (d >= 13.5 + 0.5 * u2) K = CMQ_KB; else if (d >= 11.5 - 0.5 * u1) K = CMQ_K2; else if (d >= 8.5) K = CMQ_KA; else K = CMQ_KO;
    if (K === CMQ_KO && j >= 2 && Math.abs(i + 0.5) <= 1.5 + (j - 2) * 0.5) K = CMQ_KM;   // a massa onde o abdômen cola
    k[q] = K;
    const h = hash2(i + B.cx * 3, j + B.cy * 5, 9604);
    switch (K) {
      case CMQ_KF: t[q] = CM_CERA_REAL; w[q] = WCM_REAL; break;
      case CMQ_KC: t[q] = CM_QUITINA; w[q] = WCM_REAL; break;
      case CMQ_KB: case CMQ_KA: t[q] = h < 0.09 ? CM_FAVO_MEL : CM_FAVO_REAL; w[q] = WCM_FAVO; break;
      case CMQ_KM: t[q] = CM_CERA_REAL; w[q] = WCM_REAL; break;
      case CMQ_KO: t[q] = AIR; w[q] = WCM_REAL; break;
      default: t[q] = AIR; w[q] = WCM_FAVO;
    }
    // as duas aberturas na casca, na altura do centro (as galerias reais chegam em cx-23 e cx+22, chão na linha cy+3)
    if ((K === CMQ_KF || K === CMQ_KC) && j >= 0 && j <= 2) t[q] = AIR;
  }
  // ovos na parede interna (a face do anel A virada para o oco)
  for (let j = -22; j <= 21; j++) for (let i = -22; i <= 21; i++) {
    const q = cmqK(i, j); if (k[q] !== CMQ_KA || cmqD(i, j) >= 9.7) continue;
    let face = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii >= -22 && ii <= 21 && jj >= -22 && jj <= 21 && k[cmqK(ii, jj)] === CMQ_KO) face = true; }
    if (face && hash2(i + B.cx, j + B.cy, 9605) < 0.22) t[q] = CM_OVO;
  }
  // as saliências: a cada 3 fileiras (a partir do chão das portas) nos lados de cada galeria, uma de favo, uma vez
  // encostada na parede de fora, outra na de dentro; na altura das portas, um piso de Favo Real atravessando
  const ledge = new Uint8Array(N * N);
  for (const [K, R] of [[CMQ_K3, 18.5], [CMQ_K2, 13.5], [CMQ_KO, 8.5]]) {
    for (let j = -21; j <= 21; j++) {
      if ((j - 3) % 3 !== 0 || Math.abs(j + 0.5) >= 0.62 * R) continue;
      for (const side of [-1, 1]) {
        const cells = [];
        for (let i = -22; i <= 21; i++) if ((i + 0.5) * side > 0 && k[cmqK(i, j)] === K && t[cmqK(i, j)] === AIR) cells.push(i);
        if (cells.length < 2) continue;
        cells.sort((a, b) => Math.abs(a + 0.5) - Math.abs(b + 0.5));
        const inner = cells[0], outer = cells[cells.length - 1], m = (j - 3) / 3;
        if (K === CMQ_KO) { t[cmqK(outer, j)] = CM_FAVO; ledge[cmqK(outer, j)] = 1; continue; }
        if (m === 0) { for (const i of cells) t[cmqK(i, j)] = CM_FAVO_REAL; t[cmqK(outer, j)] = CM_FAVO; ledge[cmqK(outer, j)] = 1; continue; }
        const c = (m & 1) === 0 ? outer : inner; t[cmqK(c, j)] = CM_FAVO; ledge[cmqK(c, j)] = 1;
      }
    }
  }
  // com ela morta: os anéis já foram arrancados (a bolha oca com as saliências soltas)
  if (dead) for (let q = 0; q < N * N; q++) if (cmqSoft(t[q])) t[q] = AIR;
  return { t, w, k, ledge };
}
// grava o plano na caixa; live: com o jogo rodando (chunks sujos, diffs da caixa apagados)
function cmqWrite(live) {
  const P = cmqPlan; if (!P) return;
  for (let j = -22; j <= 21; j++) for (let i = -22; i <= 21; i++) {
    const idx = cmqI(i, j), q = cmqK(i, j);
    if (tiles[idx] !== P.t[q] || walls[idx] !== P.w[q]) { tiles[idx] = P.t[q]; walls[idx] = P.w[q]; if (live) cmqDirty(idx); }
    if (live) diffs.delete(idx);
  }
  if (live) mapVer++;
}
function cmqDiffers() { const P = cmqPlan; for (let j = -22; j <= 21; j++) for (let i = -22; i <= 21; i++) if (tiles[cmqI(i, j)] !== P.t[cmqK(i, j)]) return true; return false; }

/* ---------- a construção (o 195 chama cmDress durante a geração, com cmBoss preenchido) ---------- */
function cmDress() {
  if (!cmqB()) return;
  cmqPlan = cmqLayout(cmqState.dead);
  cmqWrite(false);
}

/* ---------- o Lacre Real: as duas aberturas, na parte da casca ---------- */
function cmqSealCells(side) {
  const out = [];
  for (let j = 2; j >= 0; j--) for (let i = -22; i <= 21; i++) {
    if (side && (i + 0.5) * side < 0) continue;
    const d = cmqD(i, j); if (d >= 18.5 && d < 20.5) out.push([i, j]);
  }
  return out;
}
function cmqCellFree(i, j) { const B = cmqB(), r = { x: cmqLap(wrapX(B.cx + i) * T), y: (B.cy + j) * T, w: T, h: T }; if (!pl.dead && overlap(r, pl)) return false; for (const m of enemies) if (!m.dead && m.type !== 'rainha' && overlap(r, m)) return false; return true; }
function cmqSeal() {
  if (cmqFx.lacre) return;
  cmqFx.lacre = { t: 0, n: 0, cells: cmqSealCells(0) };
  sfx.cmqLacre();
}
function cmqLacreTick(dt) {
  const L = cmqFx.lacre;
  if (L && L.n < L.cells.length) {
    L.t += dt;
    while (L.n < L.cells.length && L.t > 0.14 * (L.n / 2 + 1)) {
      const [i, j] = L.cells[L.n], B = cmqB();
      if (!cmqCellFree(i, j)) break;
      L.n++;
      const tx = wrapX(B.cx + i), ty = B.cy + j;
      if (!SOLID[tileAt(tx, ty)] || tileAt(tx, ty) === CM_OVO) setTile(tx, ty, CM_LACRE);
      burst(cmqLap((tx + 0.5) * T), (ty + 0.5) * T, 6, '#f4d6a8', 50, 200, 0.5); burst(cmqLap((tx + 0.5) * T), (ty + 0.5) * T, 3, '#dcae80', 30, 100, 0.6, 1, true);
    }
  }
  // a guarda real: o lacre de um lado abre um instante, entram duas soldadas, fecha de novo
  const G = cmqFx.guard;
  if (G) {
    G.t += dt;
    if (!G.open) {
      G.open = true; sfx.cmqLacre(1.3);
      for (const [i, j] of cmqSealCells(G.side)) { const B = cmqB(), tx = wrapX(B.cx + i), ty = B.cy + j; if (tileAt(tx, ty) === CM_LACRE) { setTile(tx, ty, AIR); burst(cmqLap((tx + 0.5) * T), (ty + 0.5) * T, 6, '#dcae80', 60, 300, 0.5); } }
    }
    if (!G.spawned && G.t > 0.45) {
      G.spawned = true;
      if (ET.soldada && AI.soldada) for (let n = 0; n < 2; n++) {
        const D = ET.soldada, x = cmqCX() + G.side * (20.5 + n * 0.9) * T - D.w / 2, y = cmqCY() + 3 * T - D.h - 0.01;
        const m = spawnEnemy('soldada', x, y, CM_ZONE0 + 3); if (m) { cmqMark(m); m.facing = -G.side; }
      }
    }
    if (G.t > 1.6 && !G.shut) {
      let ok = true; for (const [i, j] of cmqSealCells(G.side)) if (!cmqCellFree(i, j)) ok = false;
      if (ok || G.t > 4) {
        G.shut = true; sfx.cmqLacre();
        for (const [i, j] of cmqSealCells(G.side)) { const B = cmqB(), tx = wrapX(B.cx + i), ty = B.cy + j; if (!SOLID[tileAt(tx, ty)] && cmqCellFree(i, j)) setTile(tx, ty, CM_LACRE); }
        cmqFx.guard = null;
      }
    }
  }
}
function cmqUnseal() { const B = cmqB(); for (const [i, j] of cmqSealCells(0)) { const tx = wrapX(B.cx + i), ty = B.cy + j; if (tileAt(tx, ty) === CM_LACRE) setTile(tx, ty, AIR); } }

/* ---------- os favos: quebrar, larvas, ovos ---------- */
function cmqMinions() { let n = 0; for (const m of enemies) if (m.cmMinion && !m.dead) n++; return n; }
function cmqMark(m) { if (!m) return; Object.assign(m, { cmMinion: true, memT: 8, aggro: true, xp: Math.min(m.xp || 1, 2), gold: 0 }); if (enemies.indexOf(m) < 0) enemies.push(m); }
function cmqLarva(tx, ty, cap = CMQ.maxMin) {
  if (!ET.larva || !AI.larva || cmqMinions() >= cap) return null;
  const D = ET.larva, m = spawnEnemy('larva', cmqLap((tx + 0.5) * T) - D.w / 2, (ty + 1) * T - D.h - 0.01, CM_ZONE0 + 3);
  cmqMark(m); return m;
}
const CMQ_TCOL = t => t === CM_FAVO_MEL ? ['#d08a1a', '#ffd870'] : t === CM_OVO ? ['#dcae80', '#f4d6a8'] : ['#a0600e', '#f0b030'];
// quebra um bloco mole da esfera (pela arma, pela picareta, pela investida): o HATCH decide a larva
function cmqBreak(tx, ty, larvaOk = true) {
  const t = tileAt(tx, ty); if (!cmqSoft(t)) return;
  const idx = (ty * WW) + wrapX(tx), x = cmqLap((wrapX(tx) + 0.5) * T), y = (ty + 0.5) * T, [c0, c1] = CMQ_TCOL(t);
  cmqFx.hits.delete(idx);
  burst(x, y, 8, c0, 70, 380, 0.5); burst(x, y, 3, c1, 40, 200, 0.4);
  if (t === CM_FAVO_MEL) for (let k = 0; k < 4; k++) parts.push({ x: x + rnd(-4, 4), y: y + 4, vx: rnd(-6, 6), vy: rnd(0, 20), g: 260, life: 0.9, max: 0.9, col: k & 1 ? '#f0b030' : '#d08a1a', size: 1 });
  const room = larvaOk && cmqMinions() < CMQ.maxMin;
  if (room && typeof cmQuebra === 'function') {
    const n0 = enemies.length; cmqAllow = true;
    try { cmQuebra(wrapX(tx), ty); } catch (err) { console.error(err); } finally { cmqAllow = false; }
    for (let k = n0; k < enemies.length; k++) if (!enemies[k].cmMinion) cmqMark(enemies[k]);
    if (tileAt(tx, ty) === t) setTile(tx, ty, AIR);
    return;
  }
  setTile(tx, ty, AIR);
  if (room && Math.random() < HATCH[t]) cmqLarva(tx, ty);
  else if (t === CM_FAVO_MEL && ITEMS.mel_escuro && Math.random() < 0.4) dropLoot(x, (ty + 1) * T - 1, 'mel_escuro', 1, true);
}
// um golpe num bloco mole: o Favo Real quer 2, o mel e o ovo 1
function cmqStrike(tx, ty, byPick) {
  const t = tileAt(tx, ty); if (!cmqSoft(t) || !cmqInBox(tx, ty)) return false;
  const idx = ty * WW + wrapX(tx);
  if (!byPick) { if (cmqFx.swing.get(idx) === pl.atkAt) return true; cmqFx.swing.set(idx, pl.atkAt); }
  const n = (cmqFx.hits.get(idx) || 0) + 1, need = t === CM_FAVO_REAL ? 2 : 1;
  sfx.cmqFavo(n >= need);
  if (n >= need) cmqBreak(tx, ty, true);
  else { cmqFx.hits.set(idx, n); const [c0] = CMQ_TCOL(t); burst(cmqLap((wrapX(tx) + 0.5) * T), (ty + 0.5) * T, 5, c0, 50, 300, 0.35); }
  return true;
}
// a lâmina do herói dentro da esfera: o primeiro bloco sólido que ela toca, a partir da mão
function cmqWeaponTiles() {
  if (pl.dead || pl.atkT < 0) return;
  const tm = pl.twoHand && typeof GS_TM !== 'undefined' ? GS_TM : ATK_TM;
  if (pl.atkT < tm.wind || pl.atkT > tm.wind + tm.swing + 0.02) return;
  const [hx, hy, ex, ey] = bladeSeg(pl.fArm, pl.sAng, bladeLen());
  for (let u = 0.25; u <= 1.001; u += 0.125) {
    const tx = Math.floor(lerp(hx, ex, u) / T), ty = Math.floor(lerp(hy, ey, u) / T);
    if (!solidAt(tx, ty)) continue;
    cmqStrike(tx, ty, false); return;
  }
}
// a parede interna onde o saco cola os ovos: favo exposto ao oco perto dele (sem favo, a camada de dentro da casca)
function cmqEggSpot(sx, sy) {
  const P = cmqPlan, out = [];
  for (let j = -21; j <= 20; j++) for (let i = -21; i <= 20; i++) {
    const q = cmqK(i, j), K = P.k[q]; if (K === CMQ_KF || K === CMQ_KM || P.ledge[q]) continue;
    const t = tiles[cmqI(i, j)], d = cmqD(i, j);
    if (t !== CM_FAVO_REAL && !(t === CM_QUITINA && d < 19.5)) continue;
    let face = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (tiles[cmqI(i + a, j + b)] === AIR && cmqD(i + a, j + b) < 18.5) face = true;
    if (!face) continue;
    const dd = Math.hypot((i + 0.5) * T - sx, (j + 0.5) * T - sy); if (dd > 13 * T) continue;
    if (cmqFx.eggs.some(g => g.i === i && g.j === j)) continue;
    out.push([i, j, dd + (t === CM_FAVO_REAL ? 0 : 50) + Math.random() * 40]);
  }
  out.sort((a, b) => a[2] - b[2]);
  return out.length ? out[(Math.random() * Math.min(6, out.length)) | 0] : null;
}
function cmqLay(sac) {
  if (cmqFx.eggs.length + cmqFx.globs.length >= 8) return;
  const S = cmqEggSpot(sac.lx, sac.ly); if (!S) return;
  cmqFx.globs.push({ x0: sac.lx, y0: sac.ly - 4, i: S[0], j: S[1], t: 0 });
  sac.pulse = 0.5; sfx.cmqCola();
}
function cmqHatch(i, j, cap) {
  const B = cmqB(), tx = wrapX(B.cx + i), ty = B.cy + j;
  if (tileAt(tx, ty) !== CM_OVO) return;
  setTile(tx, ty, AIR);
  const x = cmqLap((tx + 0.5) * T), y = (ty + 0.5) * T;
  burst(x, y, 10, '#f4d6a8', 70, 300, 0.5); burst(x, y, 6, '#b8d870', 50, 300, 0.5);
  cmqLarva(tx, ty, cap); sfx.cmqEclode();
}

/* ---------- a luta ---------- */
function cmqStart() {
  DROPS.rainha = CMQ_DROPS.filter(([id]) => ITEMS[id]); DROPS.rainhasaco = CMQ_SAC_DROPS.filter(([id]) => ITEMS[id]);
  const D = ET.rainha, e = spawnEnemy('rainha', cmqCX() - D.w / 2, cmqCY() + 24 - D.h, CM_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: CMQ_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, cd: 1.2, ph: 0, lx: 0, ly: 24 - D.h / 2, vx: 0, vy: 0, hx: 0, hy: 0, hoverT: 0, last: '', rep: 0, guardDone: false, phT: 0, gritoT: 0, broke: false, flap: 0 });
  e.facing = cmqHero().lx < 0 ? -1 : 1;
  cmqSet(e, 'intro', 2.0);
  cmqBoss = e; bossFight = { e, cmq: true };
  cmqClear();
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'A Rainha da Colmeia'; bn.lastChild.textContent = 'mãe de tudo que zumbe'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('A Rainha da Colmeia', 'mãe de tudo que zumbe');
  sfx.cmqGrito(0.6); shake(3);
}
function cmqClear() {
  for (const k of ['balls', 'stings', 'drops', 'eggs', 'globs', 'rings', 'pops']) cmqFx[k].length = 0;
  cmqFx.hits.clear(); cmqFx.swing.clear(); cmqFx.lacre = null; cmqFx.guard = null; cmqFx.spike = null; cmqFx.dust = null;
}
function cmqEnd(won) {
  const e = cmqBoss; cmqBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) if (m.cmMinion && !m.dead) { burst(m.x + m.w / 2, m.y + m.h / 2, 6, '#dcae80', 50, 200, 0.4); cmqDrop(m); }
  if (cmqSac) { if (!cmqSac.dead) burst(cmqSac.x + cmqSac.w / 2, cmqSac.y + cmqSac.h / 2, 16, '#f0d890', 70, 300, 0.6); cmqDrop(cmqSac); cmqSac = null; }
  if (!won) {
    // a esfera refeita pela semente: anéis, saliências, oco; ela volta presa
    if (e) cmqDrop(e);
    cmqClear(); cmqWrite(true);
    return;
  }
  // a esfera fica como ficou; o lacre some
  cmqState.dead = true;
  cmqClear(); cmqUnseal();
  const x = e ? e.x + e.w / 2 : cmqCX(), y = e ? e.y + e.h / 2 : cmqCY();
  burst(x, y, 34, '#d08a1a', 130, 260, 1.2, 2); burst(x, y, 18, '#ffd870', 90, 200, 0.9, 1, true);
  // na primeira vitória: uma das três bases da camada
  const bases = CMQ_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.cmqMorte();
  showBanner('Vitória', 'o zumbido parou');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.cmq) return cmqEnd(won); return _eb(won); }; }
// cada fase é vivida: o golpe só a leva até o piso da fase
const cmqFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * CMQ.p2) : e.ph === 1 ? Math.floor(e.maxHp * CMQ.p3) : (e.state === 'arranca' || e.state === 'rompe') ? 1 : 0;
const cmqInvuln = e => e.state === 'intro' || e.state === 'rompe' || e.state === 'arranca';
function cmqFloor(e) { const f = cmqFloorHp(e); if (f > 0 && e.hp < f) e.hp = f; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'rainha' && !e.dead) { const f = cmqFloorHp(e); if (f > 0) { e.hp = f; return; } }
  if (e && e.type === 'rainhasaco' && !e.dead) {
    // o saco morto leva a vida que ele guardava dela
    const q = cmqBoss;
    if (q && !q.dead) { const loss = Math.round(e.maxHp); q.hp = Math.max(cmqFloorHp(q) || 1, q.hp - loss); q.flash = 0.15; floatText(q.x + q.w / 2, q.y - 10, String(loss), '#ffd870', 1.2); }
    burst(e.x + e.w / 2, e.y + e.h / 2, 26, '#f0d890', 110, 320, 0.8); burst(e.x + e.w / 2, e.y + e.h / 2, 10, '#f0a8b0', 70, 300, 0.6);
    sfx.cmqRompe(0.6); cmqSac = null;
  }
  return _k(e);
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && e.type === 'rainha' && !e.dead && cmqInvuln(e)) { burst(e.x + e.w / 2, e.y + e.h / 2, 4, '#ffd870', 40, 0, 0.3, 1, true); return; }
  if (e && e.type === 'rainhasaco' && !e.dead && melee) {
    // três golpes de perto: cada um rasga um terço
    const dmg = Math.ceil(e.maxHp / 3);
    e.hp -= dmg; e.flash = 0.12; e.showHp = 3.5; e.pulse = 0.6;
    burst(e.x + e.w / 2, e.y + e.h / 2, 10, '#f0d890', 90, 380, 0.5); burst(e.x + e.w / 2, e.y + e.h / 2, 4, '#f0a8b0', 60, 300, 0.5);
    floatText(e.x + e.w / 2, e.y - 4, String(dmg), '#ffffff', 1); hitstop = Math.max(hitstop, 0.05); shake(2.4); sfx.hit(false); sfx.cmqEclode();
    if (e.hp <= 0) killEnemy(e);
    return;
  }
  const hp0 = e ? e.hp : 0, r = _hit(e, dir, mult, melee);
  if (e && e.type === 'rainha') { if (cmqFight() && !cmqFx.lacre) cmqSeal(); cmqFloor(e); }
  if (melee && pl.lg && pl.lg.colmeia && e && !e.dead && e.hp < hp0) cmqDose(e, hp0 - e.hp);
  return r;
}; }
// nada da esfera quebra fora do que este arquivo quebra (a picareta e as explosões passam por breakTile)
{ const _bt = breakTile; breakTile = function (tx, ty) { if (!cmqAllow && cmqLive() && cmqInBox(tx, ty)) return; return _bt(tx, ty); }; }
// a picareta: na luta, o Favo Real cede em 2 golpes; fora dela (e nos outros blocos) só faz faísca
{ const _pi = pickImpact; pickImpact = function (sx, sy, aim) {
  const tg = pl.target;
  if (tg && tg.inReach && cmqLive() && cmqInBox(tg.tx, tg.ty) && SOLID[tileAt(tg.tx, tg.ty)]) {
    const t = tileAt(tg.tx, tg.ty);
    if (!(cmqFight() && cmqSoft(t) && cmqStrike(tg.tx, tg.ty, true))) { sfx.tink(); burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 3, '#ffd870', 40, 300, 0.3, 1, true); }
    pl.target = Object.assign({}, tg, { dig: false });
    try { _pi(sx, sy, aim); } finally { pl.target = tg; }
    pl.digT = 0; pl.digX = -1;
    return;
  }
  return _pi(sx, sy, aim);
}; }

function cmqSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; e.stateT0 = 0; }
// a cabeça, a garganta e o ferrão em px locais (o centro da esfera é 0, 0)
const cmqFlying = e => e.ph > 0 && e.broke;
function cmqHead(e) { return cmqFlying(e) ? [e.lx + e.facing * 12, e.ly - 7] : [e.lx + e.facing * 20, e.ly - 12]; }
function cmqTail(e) { return cmqFlying(e) ? [e.lx - e.facing * 4, e.ly + 6] : [e.lx + e.facing * 2, e.ly + 12]; }
AI.rainha = function (e, dt) {
  if (!cmqB()) { e.dead = true; return; }
  cmqBrain(e, dt);
  e.x = cmqCX() + e.lx - e.w / 2; e.y = cmqCY() + e.ly - e.h / 2; e.vx = e.vy = 0;
};
AI.rainhasaco = function (e, dt) {
  if (!cmqB()) { e.dead = true; return; }
  e.x = cmqCX() + e.lx - e.w / 2; e.y = cmqCY() + e.ly - e.h / 2; e.vx = e.vy = 0;
  if (e.pulse > 0) e.pulse -= dt;
  if (!cmqBoss) return;
  if ((e.layT -= dt) <= 0) { e.layT = 4; cmqLay(e); }
};
function cmqSpawnSac(e) {
  const D = ET.rainhasaco, s = spawnEnemy('rainhasaco', cmqCX() - D.w / 2, cmqCY() + 24 - D.h, CM_ZONE0 + 3);
  const hp = Math.max(3, Math.round(e.maxHp * CMQ.sac));
  Object.assign(s, { hp, maxHp: hp, dmg: 0, xp: 6, gold: 0, lvl: CMQ_L, layT: 2.2, lx: 0, ly: 24 - D.h / 2, facing: 1, pulse: 0 });
  cmqSac = s;
}
// voando: um ponto perto do herói, de preferência acima dele, em ar livre, dentro da esfera
function cmqHover(e, dt, H) {
  e.hoverT -= dt;
  const Rm = (e.ph >= 2 ? 16 : 14.5) * T;
  if (e.hoverT <= 0) {
    e.hoverT = 1.4 + Math.random() * 0.8;
    let best = null;
    for (let n = 0; n < 10; n++) {
      const a = -Math.PI / 2 + rnd(-1.3, 1.3), r = rnd(50, 80);
      let x = H.lx + Math.cos(a) * r, y = H.ly + Math.sin(a) * r; const L = Math.hypot(x, y); if (L > Rm) { x *= Rm / L; y *= Rm / L; }
      if (!rectSolid(cmqCX() + x - e.w / 2, cmqCY() + y - e.h / 2, e.w, e.h)) { best = [x, y]; break; }
      if (!best) best = [x, y];
    }
    e.hx = best[0]; e.hy = best[1];
  }
  const dx = e.hx - e.lx, dy = e.hy - e.ly, L = Math.hypot(dx, dy), sp = 75 * dt;
  if (L > sp) { e.lx += dx / L * sp; e.ly += dy / L * sp; }
  e.ly += Math.sin(e.t * 3.1) * 0.25;
}
function cmqPick(e, list) {
  // não repete o mesmo golpe três vezes seguidas
  let tot = 0; for (const [, w] of list) tot += w;
  for (let n = 0; n < 4; n++) {
    let r = Math.random() * tot, k = list[0][0]; for (const [s, w] of list) { if (r < w) { k = s; break; } r -= w; }
    if (k === e.last && e.rep >= 1 && list.length > 1) continue;
    e.rep = k === e.last ? e.rep + 1 : 0; e.last = k; return k;
  }
  return list[0][0];
}
function cmqFavosNear(H) {
  const B = cmqB(), hx = Math.floor((H.lx) / T), hy = Math.floor((H.ly) / T);
  for (let j = hy - 6; j <= hy + 6; j++) for (let i = hx - 6; i <= hx + 6; i++) if (i >= -22 && i <= 21 && j >= -22 && j <= 21 && tiles[cmqI(i, j)] === CM_FAVO_REAL) return true;
  return false;
}
function cmqBrain(e, dt) {
  e.stateT -= dt; e.stateT0 += dt; e.cd -= dt; e.phT += dt; e.gritoT -= dt; e.flap += dt;
  const H = cmqHero(), toPl = Math.sign(H.lx - e.lx) || e.facing, near = Math.hypot(H.lx - e.lx, H.ly - e.ly);
  // os limiares
  if (e.ph === 0 && e.hp <= e.maxHp * CMQ.p2 && e.state !== 'intro') { e.ph = 1; e.phT = 0; cmqSet(e, 'rompe', 1.8); sfx.cmqGrito(0.8); cmqFx.spike = null; return; }
  if (e.ph === 1 && e.hp <= e.maxHp * CMQ.p3 && e.broke && e.state !== 'investe') { e.ph = 2; e.phT = 0; cmqSet(e, 'arranca', 2.0); sfx.cmqGrito(1); cmqFx.dust = null; e.tearR = 8; return; }
  switch (e.state) {
    case 'intro':
      e.facing = toPl;
      if (Math.random() < dt * 20) parts.push({ x: cmqCX() + e.lx + rnd(-20, 20), y: cmqCY() + e.ly + rnd(-10, 18), vx: rnd(-20, 20), vy: rnd(-30, -5), g: -10, life: 0.8, max: 0.8, col: '#ffd870', size: 1, glow: true });
      if (e.stateT <= 0) { cmqSet(e, 'idle', 0); e.cd = 0.8; }
      return;
    case 'idle': {
      e.facing = toPl;
      if (cmqFlying(e)) cmqHover(e, dt, H);
      if (e.cd > 0) return;
      let k;
      if (e.ph === 0) k = cmqPick(e, [['canto', cmqFavosNear(H) ? 0.34 : 0], ['cuspe', 0.4], ['ferrao', near < 70 ? 0.6 : 0]]);
      else if (e.ph === 1) {
        if (!e.guardDone && (e.hp < e.maxHp * 0.45 || e.phT > 14)) { e.guardDone = true; if (ET.soldada && AI.soldada) { cmqSet(e, 'guarda', 1.8); sfx.cmqGrito(0.5); cmqFx.guard = { side: H.lx < 0 ? -1 : 1, t: -0.4 }; return; } }
        k = cmqPick(e, [['investe', 0.45], ['cuspe', 0.3], ['ferrao', near < 70 ? 0.5 : 0]]);
      } else k = cmqPick(e, [['leque', 0.32], ['espiral', 0.28], ['grito', e.gritoT <= 0 && cmqCountEggs() > 0 ? 0.3 : 0], ['investe', 0.22]]);
      switch (k) {
        case 'canto': cmqSet(e, 'cantoTell', 1.2); sfx.cmqCantico(); cmqFx.rings.push({ t: 0, max: 1.2, tell: true }); break;
        case 'cuspe': cmqSet(e, 'cuspeTell', 0.6); sfx.cmqInfla(); break;
        case 'ferrao': cmqSet(e, 'ferraoTell', 0.8); e.aim = Math.atan2(H.ly - cmqTail(e)[1], H.lx - cmqTail(e)[0]); sfx.cmqPinga(); break;
        case 'investe': cmqDash(e, H); break;
        case 'leque': cmqSet(e, 'lequeTell', 0.7); sfx.cmqInfla(0.7); break;
        case 'espiral': cmqSet(e, 'espiral', 3.2); e.spA = Math.atan2(e.ly, e.lx); e.spDir = Math.random() < 0.5 ? -1 : 1; e.dropT = 0.3; sfx.cmqZumbe(); break;
        case 'grito': cmqSet(e, 'gritoTell', 1.5); e.gritoT = 12; sfx.cmqGrito(0.4); break;
      }
      return;
    }
    /* ----- presa ----- */
    case 'cantoTell':
      e.facing = toPl; if (cmqFlying(e)) cmqHover(e, dt, H);
      if (e.stateT <= 0) { cmqCantico(e); cmqSet(e, 'recover', 0.5); }
      return;
    case 'cuspeTell':
      e.facing = toPl; if (cmqFlying(e)) cmqHover(e, dt, H);
      if (e.stateT <= 0) { cmqCuspe(e, H); cmqSet(e, 'recover', 0.45); }
      return;
    case 'ferraoTell': {
      e.facing = toPl;
      const [ox, oy] = cmqTail(e);
      if (e.stateT > 0.25) e.aim = Math.atan2(H.ly - oy, H.lx - ox);   // trava no último quarto de segundo
      if (Math.random() < dt * 14) parts.push({ x: cmqCX() + ox + Math.cos(e.aim) * 6, y: cmqCY() + oy + Math.sin(e.aim) * 6, vx: rnd(-4, 4), vy: rnd(10, 30), g: 300, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#f0a8b0' : '#ffd870', size: 1 });
      if (e.stateT <= 0) { cmqFx.spike = { a: e.aim, t: 0, len: cmqRay(ox, oy, e.aim, 66), hit: false }; sfx.cmqFerroada(); cmqSet(e, 'ferraoDo', 0.35); }
      return;
    }
    case 'ferraoDo': if (e.stateT <= 0) { cmqFx.spike = null; cmqSet(e, 'recover', 0.5); } return;
    /* ----- o rompimento (60%) ----- */
    case 'rompe':
      e.facing = toPl;
      if (Math.random() < dt * 30) parts.push({ x: cmqCX() + e.lx + rnd(-18, 18), y: cmqCY() + e.ly + rnd(0, 18), vx: rnd(-30, 30), vy: rnd(-40, 0), g: 300, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#f0b030' : '#d08a1a', size: 1 });
      shake(1);
      if (!e.broke && e.stateT0 >= 1.0) {
        e.broke = true; e.w = 32; e.h = 26; e.ly = 0; sfx.cmqRompe(1); shake(6);
        burst(cmqCX(), cmqCY() + 14, 40, '#d08a1a', 160, 300, 0.9, 2); burst(cmqCX(), cmqCY() + 14, 20, '#ffd870', 120, 200, 0.7, 1, true);
        cmqSpawnSac(e); e.hoverT = 0;
      }
      if (e.broke) e.ly = approach(e.ly, -26, 60 * dt);
      if (e.stateT <= 0) { cmqSet(e, 'idle', 0); e.cd = 1.0; }
      return;
    case 'investeTell': {
      const D = e.dash; e.facing = Math.sign(D.ux) || e.facing;
      // recua um pouco, as asas viram borrão
      const k = Math.min(1, e.stateT0 / 0.8); e.lx = D.x0 - D.ux * 14 * k; e.ly = D.y0 - D.uy * 14 * k;
      if (Math.random() < dt * 40) { const s = Math.random() * D.len; parts.push({ x: cmqCX() + D.x0 + D.ux * s + rnd(-3, 3), y: cmqCY() + D.y0 + D.uy * s + rnd(-3, 3), vx: rnd(-8, 8), vy: rnd(-14, 4), g: 30, life: 0.7, max: 0.7, col: Math.random() < 0.5 ? '#b8963a' : '#8a6e28', size: 1, smoke: true }); }
      if (e.stateT <= 0) { cmqSet(e, 'investe', 2); D.pos = -14; sfx.cmqInveste(); }
      return;
    }
    case 'investe': {
      const D = e.dash; D.pos += 430 * dt;
      const p = Math.min(D.pos, D.len); e.lx = D.x0 + D.ux * p; e.ly = D.y0 + D.uy * p;
      cmqTear(e);
      const r = { x: cmqCX() + e.lx - e.w / 2 + 2, y: cmqCY() + e.ly - e.h / 2 + 2, w: e.w - 4, h: e.h - 4 };
      if (!D.hit && !pl.dead && overlap(r, pl)) { D.hit = true; const res = hurtPlayer(Math.round(e.dmg * 0.9), r.x + r.w / 2, null, true); if (res === 'hit') { pl.vx = D.ux * 260; pl.vy = -170; } }
      if (Math.random() < dt * 50) parts.push({ x: r.x + rnd(0, r.w), y: r.y + rnd(0, r.h), vx: -D.ux * 60, vy: -D.uy * 60, g: 0, life: 0.3, max: 0.3, col: '#c8dccc', size: 1 });
      if (D.pos >= D.len || e.stateT <= 0) { shake(3); cmqSet(e, 'recover', 0.7); e.hoverT = 0; cmqFx.dust = null; }
      return;
    }
    case 'guarda':
      e.facing = toPl; cmqHover(e, dt, H);
      if (e.stateT <= 0) cmqSet(e, 'recover', 0.4);
      return;
    /* ----- a esfera se abre (25%) ----- */
    case 'arranca': {
      e.facing = toPl; e.ly = approach(e.ly, -20, 40 * dt); e.lx = approach(e.lx, 0, 40 * dt);
      shake(1.5);
      const R0 = e.tearR || 8; e.tearR = Math.min(19, 8 + Math.max(0, e.stateT0 - 0.3) * 8.5);
      if (e.tearR > R0) cmqTearRing(R0, e.tearR);
      if (e.stateT <= 0) { cmqTearRing(0, 19); cmqSet(e, 'idle', 0); e.cd = 0.8; e.hoverT = 0; }
      return;
    }
    case 'lequeTell':
      e.facing = toPl; cmqHover(e, dt * 0.4, H);
      if (e.stateT <= 0) { cmqLeque(e, H); cmqSet(e, 'recover', 0.5); }
      return;
    case 'espiral': {
      // colada na parede interna, girando, pingando mel fervente
      const R = 13.5 * T; e.spA += e.spDir * dt * 1.7;
      const tx = Math.cos(e.spA) * R, ty = Math.sin(e.spA) * R, k = Math.min(1, e.stateT0 / 0.5);
      e.lx = lerp(e.lx, tx, k * 0.25 + 0.05); e.ly = lerp(e.ly, ty, k * 0.25 + 0.05); e.facing = e.spDir * (Math.sin(e.spA) > 0 ? -1 : 1) || 1;
      if ((e.dropT -= dt) <= 0 && e.stateT0 > 0.4) { e.dropT = 0.24; cmqHoney(e); }
      if (e.stateT <= 0) { cmqSet(e, 'recover', 0.6); e.hoverT = 0; }
      return;
    }
    case 'gritoTell':
      e.facing = toPl; shake(1.2);
      if (Math.random() < dt * 20) parts.push({ x: cmqCX() + e.lx + rnd(-16, 16), y: cmqCY() + e.ly + rnd(-12, 12), vx: rnd(-50, 50), vy: rnd(-50, 50), g: 0, life: 0.4, max: 0.4, col: '#c8dccc', size: 1 });
      if (e.stateT <= 0) { cmqGrito(e); cmqSet(e, 'recover', 0.8); }
      return;
    case 'recover':
      e.facing = toPl; if (cmqFlying(e)) cmqHover(e, dt, H);
      if (e.stateT <= 0) { cmqSet(e, 'idle', 0); e.cd = e.ph === 0 ? 1.3 + Math.random() * 0.8 : e.ph === 1 ? 1.0 + Math.random() * 0.7 : 0.8 + Math.random() * 0.6; }
      return;
  }
}
function cmqCountEggs() { let n = 0; for (let j = -21; j <= 20; j++) for (let i = -21; i <= 20; i++) if (tiles[cmqI(i, j)] === CM_OVO) n++; return n; }
// um raio em px locais até o primeiro bloco sólido (ou o comprimento)
function cmqRay(ox, oy, a, len) {
  const cx = cmqCX(), cy = cmqCY(), c = Math.cos(a), s = Math.sin(a);
  for (let d = 4; d <= len; d += 3) if (solidAt(Math.floor((cx + ox + c * d) / T), Math.floor((cy + oy + s * d) / T))) return d;
  return len;
}

/* the blows */
// cântico: os favos intactos num raio de 6 do herói, os expostos primeiro, soltam larvas
function cmqCantico(e) {
  cmqFx.rings.push({ t: 0, max: 0.7, tell: false });
  sfx.cmqCantico(1.4); shake(2);
  const H = cmqHero(), hx = H.lx / T, hy = H.ly / T, list = [];
  for (let j = -21; j <= 20; j++) for (let i = -21; i <= 20; i++) {
    if (tiles[cmqI(i, j)] !== CM_FAVO_REAL || cmqFx.hits.has(cmqI(i, j))) continue;
    const d = Math.hypot(i + 0.5 - hx, j + 0.5 - hy); if (d > 6) continue;
    let open = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (tiles[cmqI(i + a, j + b)] === AIR) open = true;
    if (open) list.push([i, j, d + Math.random() * 2]);
  }
  list.sort((a, b) => a[2] - b[2]);
  const n = Math.min(3, Math.max(0, CMQ.maxMin - cmqMinions()), list.length), B = cmqB();
  for (let k = 0; k < list.length && k < 6; k++) {
    const [i, j] = list[k], tx = wrapX(B.cx + i), ty = B.cy + j, x = cmqLap((tx + 0.5) * T), y = (ty + 0.5) * T;
    if (k < n) { setTile(tx, ty, AIR); burst(x, y, 10, '#a0600e', 70, 300, 0.5); burst(x, y, 5, '#f4d6a8', 40, 200, 0.5); cmqLarva(tx, ty); }
    else burst(x, y, 4, '#ffd870', 30, 0, 0.5, 1, true);   // os outros só brilham
  }
}
function cmqCuspe(e, H) {
  const [ox, oy] = cmqHead(e), a0 = Math.atan2(H.ly - oy, H.lx - ox);
  for (const da of [-0.24, 0, 0.24]) cmqFx.balls.push({ x: ox, y: oy, vx: Math.cos(a0 + da) * 170, vy: Math.sin(a0 + da) * 170, t: 0, dmg: Math.max(1, Math.round(e.dmg * 0.6)) });
  sfx.cmqCuspe();
}
function cmqLeque(e, H) {
  const [ox, oy] = cmqTail(e), a0 = Math.atan2(H.ly - oy, H.lx - ox);
  for (let k = -2; k <= 2; k++) cmqFx.stings.push({ x: ox, y: oy, a: a0 + k * 0.24, v: 230, t: 0, dmg: Math.max(1, Math.round(e.dmg * 0.5)) });
  sfx.cmqLeque();
}
// mel fervente: a marca dourada fica no chão onde a gota vai cair, 0,6 s antes
function cmqHoney(e) {
  const cx = cmqCX(), cy = cmqCY(), x = e.lx + rnd(-6, 6), y = e.ly + 8, tx = Math.floor((cx + x) / T);
  let ty = Math.floor((cy + y) / T), n = 0; while (!solidAt(tx, ty) && n < 40) { ty++; n++; }
  if (n === 0 || n >= 40) return;
  cmqFx.drops.push({ x, y, land: ty * T - cy, t: -0.6, vy: 0, hit: false, done: false });
}
function cmqGrito(e) {
  sfx.cmqGrito(1.2); shake(7);
  cmqFx.rings.push({ t: 0, max: 0.6, tell: false, grito: true });
  const eggs = []; for (let j = -21; j <= 20; j++) for (let i = -21; i <= 20; i++) if (tiles[cmqI(i, j)] === CM_OVO) eggs.push([i, j]);
  for (const [i, j] of eggs) cmqHatch(i, j, CMQ.maxMin + 2);
  cmqFx.eggs.length = 0;
}
// a investida: o caminho reto dela, pelo herói, até a parede interna da casca
function cmqDash(e, H) {
  const x0 = e.lx, y0 = e.ly; let ux = H.lx - x0, uy = H.ly - y0; const L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L;
  const R = (e.ph >= 2 ? 16 : 15.5) * T, b = x0 * ux + y0 * uy, c = x0 * x0 + y0 * y0 - R * R, len = Math.max(30, -b + Math.sqrt(Math.max(0, b * b - c)));
  e.dash = { x0, y0, ux, uy, len, pos: 0, hit: false, larvas: 0 };
  cmqFx.dust = e.dash;
  cmqSet(e, 'investeTell', 1.0); sfx.cmqZumbe(1.4);
}
// o corpo dela rasga todo favo que toca
function cmqTear(e) {
  const x0 = Math.floor((cmqCX() + e.lx - e.w / 2) / T), x1 = Math.floor((cmqCX() + e.lx + e.w / 2 - 1) / T), y0 = Math.floor((cmqCY() + e.ly - e.h / 2) / T), y1 = Math.floor((cmqCY() + e.ly + e.h / 2 - 1) / T);
  let any = false;
  const D = e.dash;   // no máximo 3 larvas por investida
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (cmqSoft(tileAt(tx, ty)) && cmqInBox(tx, ty)) {
    const n0 = cmqMinions(); cmqBreak(tx, ty, !D || D.larvas < 3); if (D) D.larvas += cmqMinions() - n0; any = true;
  }
  if (any && Math.random() < 0.3) sfx.cmqRasga();
}
// o que sobrou dos anéis, de dentro para fora
function cmqTearRing(r0, r1) {
  const B = cmqB(); let n = 0;
  for (let j = -21; j <= 20; j++) for (let i = -21; i <= 20; i++) {
    const d = cmqD(i, j); if (d < r0 || d >= r1) continue;
    const tx = wrapX(B.cx + i), ty = B.cy + j, t = tileAt(tx, ty); if (!cmqSoft(t)) continue;
    setTile(tx, ty, AIR); n++;
    if ((i + j) % 2 === 0) { const [c0, c1] = CMQ_TCOL(t); burst(cmqLap((tx + 0.5) * T), (ty + 0.5) * T, 3, c0, 60, 380, 0.6); if ((i & 3) === 0) burst(cmqLap((tx + 0.5) * T), (ty + 0.5) * T, 1, c1, 30, 200, 0.5, 1, true); }
  }
  if (n) { sfx.cmqRasga(); cmqFx.eggs = cmqFx.eggs.filter(g => tiles[cmqI(g.i, g.j)] === CM_OVO); }
}

/* the projectiles, the sting, the drops, the eggs, the rings */
const cmqHitPl = (x, y, r) => !pl.dead && x > pl.x - r && x < pl.x + pl.w + r && y > pl.y - r && y < pl.y + pl.h + r;
function cmqFxTick(dt) {
  const e = cmqBoss, cx = cmqCX(), cy = cmqCY();
  cmqLacreTick(dt);
  for (let k = cmqFx.balls.length - 1; k >= 0; k--) {
    const b = cmqFx.balls[k]; b.t += dt; b.vy += 60 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    const X = cx + b.x, Y = cy + b.y;
    if (cmqHitPl(X, Y, 3)) { hurtPlayer(b.dmg, X, null, true); burst(X, Y, 10, '#f0a8b0', 70, 300, 0.5); sfx.cmqSplat(); cmqFx.balls.splice(k, 1); continue; }
    if (solidAt(Math.floor(X / T), Math.floor(Y / T)) || b.t > 3) { burst(X, Y, 8, '#d07888', 60, 300, 0.5); burst(X, Y, 3, '#ffd8dc', 30, 200, 0.4); sfx.cmqSplat(0.5); cmqFx.balls.splice(k, 1); }
  }
  for (let k = cmqFx.stings.length - 1; k >= 0; k--) {
    const s = cmqFx.stings[k]; s.t += dt; s.x += Math.cos(s.a) * s.v * dt; s.y += Math.sin(s.a) * s.v * dt;
    const X = cx + s.x, Y = cy + s.y;
    if (cmqHitPl(X, Y, 2)) { hurtPlayer(s.dmg, X, null, true); burst(X, Y, 6, '#2e4436', 60, 300, 0.4); cmqFx.stings.splice(k, 1); continue; }
    if (solidAt(Math.floor(X / T), Math.floor(Y / T)) || s.t > 2.5) { burst(X, Y, 4, '#486650', 40, 300, 0.3); sfx.tink(); cmqFx.stings.splice(k, 1); }
  }
  const S = cmqFx.spike;
  if (S && e) {
    S.t += dt; const k = Math.min(1, S.t / 0.09), [ox, oy] = cmqTail(e), L = S.len * k;
    if (!S.hit) for (let d = 6; d <= L; d += 3) if (cmqHitPl(cx + ox + Math.cos(S.a) * d, cy + oy + Math.sin(S.a) * d, 1)) { S.hit = true; const r = hurtPlayer(e.dmg, cx + ox, null, true); if (r === 'hit') { pl.vx = Math.cos(S.a) * 220; pl.vy = -150; } break; }
  }
  for (let k = cmqFx.drops.length - 1; k >= 0; k--) {
    const d = cmqFx.drops[k]; d.t += dt;
    if (d.t < 0) continue;
    if (d.done) { if (d.t > 0.5) cmqFx.drops.splice(k, 1); continue; }
    d.vy = Math.min(d.vy + 900 * dt, 480); d.y += d.vy * dt;
    if (!d.hit && e && cmqHitPl(cx + d.x, cy + d.y, 2)) { d.hit = true; hurtPlayer(Math.max(1, Math.round(e.dmg * 0.4)), cx + d.x, null, true); }
    if (d.y >= d.land) { d.done = true; d.t = 0; d.y = d.land; burst(cx + d.x, cy + d.land - 1, 8, '#f0b030', 60, 400, 0.5); burst(cx + d.x, cy + d.land - 1, 3, '#ffd870', 30, 200, 0.4, 1, true); sfx.cmqGota(); }
  }
  // o ovo voando do saco até a parede; colado, conta 6 s
  for (let k = cmqFx.globs.length - 1; k >= 0; k--) {
    const g = cmqFx.globs[k]; g.t += dt;
    if (g.t >= 0.5) {
      cmqFx.globs.splice(k, 1);
      const B = cmqB(), tx = wrapX(B.cx + g.i), ty = B.cy + g.j, t = tileAt(tx, ty);
      if (t === CM_FAVO_REAL || t === CM_QUITINA) { setTile(tx, ty, CM_OVO); cmqFx.eggs.push({ i: g.i, j: g.j, t: 6 }); burst(cmqLap((tx + 0.5) * T), (ty + 0.5) * T, 6, '#f4d6a8', 40, 200, 0.4); sfx.cmqCola(0.6); }
    }
  }
  for (let k = cmqFx.eggs.length - 1; k >= 0; k--) {
    const g = cmqFx.eggs[k]; g.t -= dt;
    if (tiles[cmqI(g.i, g.j)] !== CM_OVO) { cmqFx.eggs.splice(k, 1); continue; }
    if (g.t <= 0) { cmqFx.eggs.splice(k, 1); cmqHatch(g.i, g.j); }
  }
  for (let k = cmqFx.rings.length - 1; k >= 0; k--) { const R = cmqFx.rings[k]; R.t += dt; if (R.t >= R.max) cmqFx.rings.splice(k, 1); }
  // o golpe de uma arma marca o favo por 6 s (o contador some se o herói desiste)
  if (cmqFx.swing.size > 64) cmqFx.swing.clear();
}

/* ---------- o Ferrão Real ---------- */
STAT_DEF.lgColmeia = { t: 'Cada golpe põe uma dose de veneno da colmeia no alvo (até 5); na quinta o veneno estoura e causa 150% do golpe', flag: 1 };
STAT_KEYS.push('lgColmeia');
ITEMS.ferrao_real = {
  name: 'Ferrão Real', slot: 'weapon', kind: 'dagger', rar: 4,
  pal: { w: '#fff0a8', W: '#f0b030', l: '#a0600e', g: '#2e4436', G: '#121a16', h: '#3a1e04', p: '#f6c856' },
  legend: [['lgColmeia', 1], ['light', 1], ['crit', 0.06]],
  desc: 'O ferrão da Rainha, ainda morno. A lâmina cor de mel escorre devagar, e o que ela fura não esquece.'
};
BASE_INFO.ferrao_real = [CMQ_L, 0.4];
ITEM_G.ferrao_real = 0; ITEMS.ferrao_real.g = 0;
DROPS.rainha = CMQ_DROPS.filter(([id]) => ITEMS[id]);
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgColmeia || 0;
  if (pl.lg) pl.lg.colmeia = b > 0;
  return r;
}; }
// uma dose por golpe que acerta (8 s sem dose e o veneno passa); a quinta estoura
function cmqDose(e, dmg) {
  if (!(e.cmqDoseT > gameTime - 8)) e.cmqDose = 0;
  e.cmqDoseT = gameTime; e.cmqDose = (e.cmqDose || 0) + 1;
  const x = e.x + e.w / 2, y = e.y + e.h / 2;
  if (e.cmqDose < 5) { burst(x, y, 3, '#f0b030', 30, 100, 0.4, 1, true); return; }
  e.cmqDose = 0;
  const v = Math.max(1, Math.round(dmg * 1.5));
  e.hp -= v; e.flash = 0.14; e.showHp = 3.5;
  floatText(x, e.y - 12, String(v), '#f6c856', 1.3);
  burst(x, y, 18, '#f0b030', 110, 120, 0.6, 1, true); burst(x, y, 10, '#7a4a10', 70, 300, 0.6);
  cmqFx.pops.push({ x, y, t: 0 });
  sfx.cmqVeneno();
  if (e.type === 'rainha') cmqFloor(e);
  if (e.hp <= 0 && !e.dead) killEnemy(e);
}

/* ---------- arte ---------- */
const CMQA = {};
{
const cg = (x, y, s) => hash2(x, y, s) - 0.5;
const RAMPS = [];
const R6 = hexes => { const R = hexes.map(h => ph(h)); R.k = RAMPS.length; RAMPS.push(R); return R; };
const PAL = {
  quit: R6(['#070b09', '#111a15', '#1c2b23', '#2b4234', '#45644f', '#6e9476']),
  mel: R6(['#3a1e04', '#6a3a08', '#a0600e', '#d08a1a', '#f0b030', '#ffd870']),
  ambar: R6(['#4a2006', '#7a3a0a', '#b0600e', '#d88a1c', '#f4b03a', '#ffd878']),
  geleia: R6(['#3a1420', '#6a2838', '#a04858', '#d07888', '#f0a8b0', '#ffd8dc']),
  cera: R6(['#3a2018', '#64382a', '#8e5a40', '#b8825a', '#dcae80', '#f4d6a8']),
  asa: R6(['#1e2a26', '#3e5248', '#6a8274', '#9ab4a4', '#c8dccc', '#eef6ea'])
};
const sm = t => t * t * (3 - 2 * t);
function nz(x, y, sc, s) {
  const fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy), ux = sm(fx - ix), uy = sm(fy - iy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy - 0.5;
}
// o pintor (como o do Sineiro): cada rampa lembra o índice, o contorno pega o tom mais escuro do que contorna
function pp(w, h) {
  const c = new Uint32Array(w * h), rid = new Int16Array(w * h).fill(-1);
  const P = {
    w, h, c, rid,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; c[i] = R[v < 0 ? 0 : v > 5 ? 5 : v | 0]; rid[i] = R.k; },
    has(x, y) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0; },
    blob(cx, cy, rx, ry, R, s, base = 2.6, f) {
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
        const e = f ? f(x, y, dx, dy, d) : 0; if (e === null) continue;
        P.put(x, y, R, base + 1.2 - (dx * 0.8 + dy) * 1.3 - d * 0.7 + cg(x, y, s) * 0.6 + e);
      }
    },
    tube(ax, ay, bx, by, r0, r1, R, s, base = 2.4, f) {
      const m = Math.max(r0, r1) + 1, x0 = Math.floor(Math.min(ax, bx) - m), x1 = Math.ceil(Math.max(ax, bx) + m), y0 = Math.floor(Math.min(ay, by) - m), y1 = Math.ceil(Math.max(ay, by) + m);
      const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5, t = clamp(((px - ax) * vx + (py - ay) * vy) / L2, 0, 1), qx = ax + vx * t, qy = ay + vy * t, r = r0 + (r1 - r0) * t;
        const nx = (px - qx) / r, ny = (py - qy) / r, d = nx * nx + ny * ny; if (d > 1) continue;
        const e = f ? f(x, y, t, nx, ny) : 0; if (e === null) continue;
        P.put(x, y, R, base + 0.9 - (nx * 0.8 + ny) * 1.4 - d * 0.8 + cg(x, y, s) * 0.6 + e);
      }
    },
    line(pts, R, v) { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay))); for (let i = 0; i <= n; i++) P.put(ax + (bx - ax) * i / n, ay + (by - ay) * i / n, R, typeof v === 'function' ? v(k, i / n) : v); } },
    outline(keep) {
      const o = c.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!c[i] || (keep && keep(rid[i]))) continue;
        const air = (x > 0 && !c[i - 1]) || (x < w - 1 && !c[i + 1]) || (y > 0 && !c[i - w]) || (y < h - 1 && !c[i + w]) || x === 0 || y === 0 || x === w - 1 || y === h - 1;
        if (air) o[i] = RAMPS[rid[i]][0];
      }
      c.set(o);
    },
    canvas() { const cv = mk(w, h), x = cv.getContext('2d'), im = x.createImageData(w, h); new Uint32Array(im.data.buffer).set(c); x.putImageData(im, 0, 0); return cv; }
  };
  return P;
}
// um canvas girado por `a` em volta de (px, py), pixel mais perto, num n x n com esse ponto no meio
function turn(src, a, px, py, n) {
  const sw = src.width, sh = src.height, S = new Uint32Array(src.getContext('2d').getImageData(0, 0, sw, sh).data.buffer);
  const o = mk(n, n), ox = o.getContext('2d'), im = ox.createImageData(n, n), D = new Uint32Array(im.data.buffer), ca = Math.cos(a), sa = Math.sin(a), h = n / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = x + 0.5 - h, dy = y + 0.5 - h, sx = Math.floor(px + dx * ca + dy * sa), sy = Math.floor(py - dx * sa + dy * ca);
    if (sx >= 0 && sy >= 0 && sx < sw && sy < sh) D[y * n + x] = S[sy * sw + sx];
  }
  ox.putImageData(im, 0, 0); return o;
}
// a coroa de antenas: cinco antenas finas abertas em leque, curvas, com a ponta em conta âmbar
function crown(Q, hx, hy, sc = 1) {
  const A = [[-1.15, 9], [-0.6, 11.5], [-0.1, 12.5], [0.38, 11], [0.85, 8.5]];
  A.forEach(([a, L], k) => {
    const pts = [], bx = hx - 2.5 + k * 1.3, by = hy;
    for (let s = 0; s <= 6; s++) { const t = s / 6, aa = a * (0.55 + t * 0.7) - 0.1, r = L * sc * t; pts.push([bx + Math.sin(aa) * r, by - Math.cos(aa) * r]); }
    Q.line(pts, PAL.quit, (seg, u) => seg < 2 ? 2 : 3);
    const [ex, ey] = pts[pts.length - 1];
    Q.put(ex, ey, PAL.ambar, 4); Q.put(ex + 1, ey, PAL.ambar, 3); Q.put(ex, ey - 1, PAL.ambar, 5);
  });
}
function head(Q, hx, hy, S) {
  Q.blob(hx, hy, 5.6, 5, PAL.quit, S + 1, 2.5, (x, y, dx, dy) => (dy > 0.55 ? -0.6 : 0));
  // o olho composto, âmbar, e a mandíbula
  Q.blob(hx + 2.2, hy - 0.8, 1.7, 1.5, PAL.ambar, S + 2, 3.0);
  Q.put(hx + 1.6, hy - 1.6, PAL.ambar, 5);
  Q.tube(hx + 3.5, hy + 2.5, hx + 6.5, hy + 4.5, 1.2, 0.7, PAL.quit, S + 3, 2.8);
  Q.tube(hx + 6.5, hy + 4.5, hx + 5.2, hy + 6.2, 0.8, 0.6, PAL.quit, S + 4, 2.4);
  crown(Q, hx - 0.5, hy - 4);
}
function legs(Q, pts, S) {
  pts.forEach(([ax, ay, kx, ky, fx, fy], k) => {
    Q.tube(ax, ay, kx, ky, 1.4, 1.1, PAL.quit, S + 10 + k, 2.2);
    Q.tube(kx, ky, fx, fy, 1.0, 0.7, PAL.quit, S + 20 + k, 2.0);
    Q.put(fx, fy, PAL.quit, 4);
  });
}
// o abdômen enorme cor de mel: faixas de segmento e veias de luz (a máscara das veias vai num canvas à parte, que pulsa)
function abdomen(Q, V, cx, cy, rx, ry, S, torn) {
  const inside = (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy < 0.86; };
  Q.blob(cx, cy, rx, ry, PAL.mel, S, 2.5, (x, y, dx, dy, d) => {
    if (torn && dx < -0.6 + hash2(y, 1, S) * 0.3) return null;   // a ponta rasgada, sem o saco
    const sgm = (x - cx) * 0.95 + (y - cy) * 0.35, band = ((sgm % 6) + 6) % 6;
    return band < 1.3 ? -1.1 : band < 2.2 ? 0.4 : 0;
  });
  // as veias de luz: saem da cintura e se abrem pelo abdômen, uma vez bifurcadas
  const n = torn ? 3 : 5;
  for (let v = 0; v < n; v++) {
    const walk = (x, y, a, len, s2, depth) => {
      for (let k = 0; k < len; k++) {
        if (torn && (x - cx) / rx < -0.55) break;
        if (!inside(x, y) || !Q.has(x, y)) break;
        Q.put(x, y, PAL.mel, 4.6); V.put(x, y, k < len * 0.5 ? PAL.mel : PAL.ambar, 5);
        a += (hash2(k, v + depth * 7, s2) - 0.5) * 0.7; x += Math.cos(a); y += Math.sin(a);
        if (depth === 0 && k === (len * 0.45 | 0)) walk(x, y, a + (v & 1 ? 0.7 : -0.7), len * 0.5 | 0, s2 + 3, 1);
      }
    };
    walk(cx + rx * 0.82, cy - ry * 0.1 + (v - (n - 1) / 2) * 1.4, Math.PI + (v - (n - 1) / 2) * 0.32, Math.round(rx * 1.6), S + 70 + v, 0);
  }
}
/* presa: 56 x 48, virada para a direita; o abdômen embaixo e atrás, colado na massa; base da arte na linha 46 */
const PW = 56, PH = 48;
function paintPresa() {
  const Q = pp(PW, PH), V = pp(PW, PH), S = 9600;
  legs(Q, [[38, 28, 36, 36, 33, 45], [42, 29, 44, 37, 43, 46], [45, 27, 50, 33, 52, 41]], S);
  abdomen(Q, V, 21, 31, 18, 14.5, S + 30, false);
  // o ferrão na ponta, encolhido
  Q.tube(3.5, 36, 0.5, 39, 1.3, 0.5, PAL.quit, S + 40, 2.2);
  // a cintura e o tórax de placas
  Q.blob(37.5, 25.5, 3, 3, PAL.quit, S + 41, 2.2);
  Q.blob(42, 22.5, 7.8, 7.4, PAL.quit, S + 42, 2.6, (x, y, dx, dy) => (Math.abs(dx + dy * 0.3) < 0.08 || Math.abs(dy + 0.15) < 0.07 ? -1 : 0));
  head(Q, 49, 15.5, S + 50);
  Q.outline();
  return { body: Q.canvas(), veins: V.canvas() };
}
/* voando: 48 x 40, sem o saco: o resto rasgado do abdômen; pernas penduradas; base na linha 36 */
const FW = 48, FH = 40;
function paintVoo() {
  const Q = pp(FW, FH), V = pp(FW, FH), S = 9700;
  legs(Q, [[25, 24, 23, 30, 21, 36], [28, 25, 29, 31, 28, 37], [31, 23, 35, 28, 36, 34]], S);
  abdomen(Q, V, 14, 21, 10.5, 8.5, S + 30, true);
  for (let k = 0; k < 4; k++) Q.tube(4.5, 17 + k * 2.5, 1.5 - (k & 1), 19 + k * 3, 0.7, 0.5, PAL.cera, S + 60 + k, 2.4);   // fiapos da membrana
  Q.blob(24, 20, 2.6, 2.6, PAL.quit, S + 41, 2.2);
  Q.blob(28.5, 17.5, 7.2, 6.8, PAL.quit, S + 42, 2.6, (x, y, dx, dy) => (Math.abs(dx + dy * 0.3) < 0.08 || Math.abs(dy + 0.15) < 0.07 ? -1 : 0));
  head(Q, 36, 11, S + 50);
  Q.outline();
  return { body: Q.canvas(), veins: V.canvas() };
}
/* uma asa: 44 x 44, raiz no meio, apontando para trás (esquerda); membrana de 2 tons, nervuras, brilho fino na borda */
function paintWing() {
  const Q = pp(44, 44), A = PAL.asa;
  const wing = (cx, cy, rx, ry, s, base) => Q.blob(cx, cy, rx, ry, A, s, base, (x, y, dx, dy) => {
    if (dy < -0.82) return 2;                                                     // a borda de cima brilha
    if (Math.abs(nz(x * 0.4, y * 2.2, 3, s)) < 0.05 || Math.abs(dy - dx * 0.2) < 0.06) return -2.2;   // nervuras
    return 0;
  });
  wing(10.5, 21, 11.5, 4.4, 9801, 3.2);
  wing(14, 24.5, 8, 3, 9802, 2.8);
  Q.outline(); return Q.canvas();
}
/* o saco de ovos: 30 x 26; membrana clara e enrugada, ovos aparecendo, fiapos rasgados em cima */
function paintSac(k) {
  const Q = pp(30, 26), s = k ? 1.04 : 1;
  Q.blob(15, 15, 13 * s, 10.5 * s, PAL.cera, 9900, 3.3, (x, y, dx, dy) => (Math.abs(nz(x, y * 2, 3, 9901)) < 0.05 ? -1.1 : 0) + (dy > 0.6 ? -0.6 : 0));
  for (let n = 0; n < 8; n++) { const ex = 6 + hash2(n, 1, 9902) * 18, ey = 9 + hash2(n, 2, 9902) * 11; Q.blob(ex, ey, 2.3, 1.8, PAL.cera, 9903 + n, 4.3, (x, y, dx, dy, d) => (d > 0.65 ? -2.4 : 0)); }
  Q.blob(15, 18, 7, 4, PAL.mel, 9911, 2.6, (x, y, dx, dy, d) => (d > 0.5 || hash2(x, y, 9912) < 0.5 ? null : 0));   // o mel que ainda escorre dentro
  for (let n = 0; n < 5; n++) Q.tube(9 + n * 3, 5, 8 + n * 3.4 + hash2(n, 3, 9913) * 2, 1 + hash2(n, 4, 9913) * 2, 0.8, 0.5, PAL.geleia, 9914 + n, 2);
  Q.outline(); return Q.canvas();
}
const ANG = []; for (let k = 0; k < 9; k++) ANG.push(-1.4 + k * 0.32);   // a asa de -1,4 (erguida) a 1,16 (abaixada)
CMQA.get = () => CMQA.ready || (CMQA.ready = (() => {
  const pr = paintPresa(), vo = paintVoo(), wing = paintWing();
  const set = cv => ({ r: cv, l: flip(cv), wr: whiteOf(cv), wl: whiteOf(flip(cv)) });
  const wingR = ANG.map(a => turn(wing, -a, 22, 22, 44)), wingL = wingR.map(flip);
  // a asa em borrão: várias posições sobrepostas, bem claras
  const blur = mk(44, 44), bx = blur.getContext('2d'); bx.globalAlpha = 0.28; for (const w of wingR) bx.drawImage(w, 0, 0);
  const sac = [paintSac(0), paintSac(1)];
  return {
    presa: set(pr.body), presaV: { r: pr.veins, l: flip(pr.veins) }, voo: set(vo.body), vooV: { r: vo.veins, l: flip(vo.veins) },
    wingR, wingL, blurR: blur, blurL: flip(blur), sac: sac.map(set)
  };
})());
CMQA.GL = { abd: glow(40, '#f0b030'), mid: glow(16, '#f4b03a'), small: glow(7, '#ffd870'), pink: glow(9, '#f0a8b0'), egg: glow(10, '#ffd878'), hand: glow(9, '#f6c856'), sac: glow(20, '#f4d6a8') };
Object.assign(CMQA, { PW, PH, FW, FH, ANG });
}

/* ---------- desenho ---------- */
// presa: a arte com a base (linha 46) no pé da caixa dela e o meio do corpo (coluna 29) no meio; voando: base 36, coluna 24
function cmqFrame(e, fx, fy) {
  const fly = cmqFlying(e), R = e.facing > 0, W = fly ? CMQA.FW : CMQA.PW, ox = fly ? 24 : 29;
  const jit = (e.state === 'gritoTell' || e.state === 'rompe') ? Math.round(Math.sin(e.t * 70)) : 0;
  return { fly, R, x: fx - (R ? ox : W - ox) + jit, y: fly ? fy - 36 + 5 : fy - 46 };
}
function cmqWingDraw(e, x, y, fly, R) {
  const A = CMQA.get(), rootX = fly ? 26 : 39, rootY = fly ? 12 : 17, rx = R ? x + rootX : x + (fly ? CMQA.FW : CMQA.PW) - rootX, ry = y + rootY;
  let img;
  if (!fly) {
    // dobradas nas costas, tremendo um pouco (no cântico e no grito abrem)
    const open = e.state === 'cantoTell' || e.state === 'gritoTell' || e.state === 'rompe' || e.state === 'intro';
    const k = open ? 1 + (Math.floor(e.t * 24) & 1) : 6 + (Math.floor(e.t * 3) & 1);
    img = R ? A.wingR[k] : A.wingL[k];
  } else if (e.state === 'investeTell' || e.state === 'investe' || e.state === 'espiral') img = R ? A.blurR : A.blurL;
  else if (e.state === 'gritoTell') img = R ? A.wingR[0] : A.wingL[0];
  else { const seq = [0, 2, 4, 6, 8, 6, 4, 2], k = seq[Math.floor(e.flap * 32) % seq.length]; img = R ? A.wingR[k] : A.wingL[k]; }
  lc.globalAlpha = fly ? 0.5 : 0.62; lc.drawImage(img, Math.round(rx) - 22, Math.round(ry) - 22); lc.globalAlpha = 1;
}
function cmqPulse(e) {
  const base = 0.35 + 0.25 * Math.sin(gameTime * 2.2);
  if (!e) return base;
  if (e.state === 'cantoTell') return 0.5 + 0.5 * Math.sin(e.stateT0 * 14);
  if (e.state === 'lequeTell') return 0.6 + 0.4 * Math.sin(e.stateT0 * 22);
  return base;
}
DRAW_E.rainha = (e, fx, fy, fl) => {
  const A = CMQA.get(), F = cmqFrame(e, fx, fy), S = F.fly ? A.voo : A.presa, V = F.fly ? A.vooV : A.presaV;
  if (F.fly) cmqWingDraw(e, F.x, F.y, true, F.R);
  lc.drawImage(F.R ? (fl ? S.wr : S.r) : (fl ? S.wl : S.l), F.x, F.y);
  lc.globalAlpha = clamp(cmqPulse(e), 0, 1); lc.drawImage(F.R ? V.r : V.l, F.x, F.y); lc.globalAlpha = 1;
  if (!F.fly) cmqWingDraw(e, F.x, F.y, false, F.R);
  // a garganta incha rosada
  if (e.state === 'cuspeTell') {
    const [hx, hy] = cmqHead(e), k = Math.min(1, e.stateT0 / 0.5), x = fx + (hx - e.lx) - e.facing * 2, y = fy - e.h / 2 + (hy - e.ly) + 5;
    lc.globalAlpha = 0.9; lc.fillStyle = '#d07888'; lc.beginPath(); lc.arc(Math.round(x), Math.round(y), 1.5 + k * 2.5, 0, Math.PI * 2); lc.fill();
    lc.fillStyle = '#f0a8b0'; lc.fillRect(Math.round(x) - 1, Math.round(y - 1 - k), 2, 1); lc.globalAlpha = 1;
  }
};
EYES_E.rainha = (e, fx, fy) => {
  const [hx, hy] = cmqHead(e), x = fx + (hx - e.lx) + e.facing * 2, y = fy - e.h / 2 + (hy - e.ly) - 1;
  lc.globalAlpha = WARN_E.rainha(e) ? 0.85 : 0.45; lc.drawImage(CMQA.GL.small, Math.round(x) - 7, Math.round(y) - 7);
};
WARN_E.rainha = e => e.state === 'cantoTell' || e.state === 'cuspeTell' || e.state === 'ferraoTell' || e.state === 'investeTell' || e.state === 'lequeTell' || e.state === 'gritoTell';
DRAW_E.rainhasaco = (e, fx, fy, fl) => {
  const A = CMQA.get(), k = (e.pulse > 0 || Math.sin(e.t * 3.4) > 0.6) ? 1 : 0, s = A.sac[k], x = fx - 15, y = fy - 24;
  lc.drawImage(fl ? s.wr : s.r, x, y);
};
EYES_E.rainhasaco = (e, fx, fy) => { lc.globalAlpha = 0.25 + 0.15 * Math.sin(e.t * 3.4); lc.drawImage(CMQA.GL.sac, fx - 20, fy - 31); };
// a Rainha antes da luta: presa, de olhos meio fechados, virada para o lado do herói
function cmqIdleDraw(cx, cy) {
  const A = CMQA.get(), R = cmqHero().lx >= 0, fx = Math.round(cmqCX()) - cx, fy = Math.round(cmqCY() + 24) - cy;
  const x = fx - (R ? 29 : CMQA.PW - 29), y = fy - 46;
  lc.drawImage(R ? A.presa.r : A.presa.l, x, y);
  lc.globalAlpha = clamp(cmqPulse(null), 0, 1); lc.drawImage(R ? A.presaV.r : A.presaV.l, x, y); lc.globalAlpha = 1;
  cmqWingDraw({ state: 'idle', t: gameTime, flap: 0 }, x, y, false, R);
}
HOOK.drawWorld.push((cx, cy) => {
  const B = cmqB(); if (!B || !cmqPlan || !pl || Math.abs(wdx(B.cx - Math.floor((cx + VW / 2) / T))) > 60) return;
  const X = cmqCX() - cx, Y = cmqCY() - cy;
  if (!cmqState.dead && !cmqBoss) cmqIdleDraw(cx, cy);
  // os favos rachados por um golpe
  lc.fillStyle = '#1a0e04';
  for (const idx of cmqFx.hits.keys()) { const x = cmqLap((idx % WW) * T) - cx, y = ((idx / WW) | 0) * T - cy; for (const [a, b] of [[3, 2], [4, 3], [5, 4], [5, 5], [6, 6], [7, 6], [8, 7], [4, 7], [3, 8], [8, 3], [9, 2]]) lc.fillRect(x + a, y + b, 1, 1); }
  // os ovos colados perto de eclodir tremem e racham
  for (const g of cmqFx.eggs) {
    if (g.t > 2) continue;
    const x = cmqLap(wrapX(B.cx + g.i) * T) - cx + (Math.floor(gameTime * 20) & 1), y = (B.cy + g.j) * T - cy;
    lc.fillStyle = '#3a2018'; lc.fillRect(x + 5, y + 2, 1, 3); lc.fillRect(x + 6, y + 5, 1, 2); lc.fillRect(x + 4, y + 7, 1, 2);
  }
  const e = cmqBoss;
  // o ferrão estocando (e o ferrão recuado no aviso)
  if (e && (cmqFx.spike || e.state === 'ferraoTell')) {
    const [ox, oy] = cmqTail(e), S = cmqFx.spike, a = S ? S.a : e.aim, L = S ? S.len * Math.min(1, S.t / 0.09) : 9;
    const c = Math.cos(a), s = Math.sin(a), sx = X + ox - (S ? 0 : c * 4), sy = Y + oy - (S ? 0 : s * 4);
    for (let d = 0; d <= L; d += 1) { const w = d > L - 5 ? 1 : 2; lc.fillStyle = d > L - 4 ? '#f6c856' : d > L - 9 ? '#2b4234' : '#111a15'; lc.fillRect(Math.round(sx + c * d), Math.round(sy + s * d), w, w); }
  }
  // as bolas de geleia, os ferrões do leque, as gotas de mel, os ovos voando
  for (const b of cmqFx.balls) { const x = Math.round(X + b.x), y = Math.round(Y + b.y); lc.fillStyle = '#6a2838'; lc.fillRect(x - 2, y - 2, 5, 5); lc.fillStyle = '#d07888'; lc.fillRect(x - 2, y - 1, 4, 3); lc.fillRect(x - 1, y - 2, 3, 4); lc.fillStyle = '#ffd8dc'; lc.fillRect(x - 1, y - 1, 1, 1); }
  for (const s of cmqFx.stings) { const c = Math.cos(s.a), n = Math.sin(s.a); for (let d = 0; d < 7; d++) { lc.fillStyle = d < 2 ? '#f6c856' : '#1c2b23'; lc.fillRect(Math.round(X + s.x - c * d), Math.round(Y + s.y - n * d), 1, 1); } }
  for (const d of cmqFx.drops) {
    if (d.done) continue;
    const x = Math.round(X + d.x), y = Math.round(Y + d.y), r = d.t < 0 ? Math.max(1, Math.round((d.t + 0.6) * 4)) : 2;
    lc.fillStyle = '#a0600e'; lc.fillRect(x - 1, y - r, 3, r + 1); lc.fillStyle = '#f0b030'; lc.fillRect(x, y - r + 1, 1, r);
  }
  for (const g of cmqFx.globs) {
    const k = g.t / 0.5, tx = (g.i + 0.5) * T, ty = (g.j + 0.5) * T, x = Math.round(X + lerp(g.x0, tx, k)), y = Math.round(Y + lerp(g.y0, ty, k) - Math.sin(k * Math.PI) * 18);
    lc.fillStyle = '#b8825a'; lc.fillRect(x - 2, y - 1, 4, 3); lc.fillStyle = '#f4d6a8'; lc.fillRect(x - 1, y - 1, 2, 2);
  }
});
// os avisos por cima do escuro: o anel do cântico, a linha de poeira, as marcas douradas, a mira do ferrão
HOOK.drawTop.push((cx, cy) => {
  const B = cmqB(); if (!B || !cmqPlan || !pl) return;
  const e = cmqBoss, X = cmqCX() - cx, Y = cmqCY() - cy;
  lc.lineWidth = 1;
  if (e) {
    for (const R of cmqFx.rings) {
      const k = R.t / R.max, ex = Math.round(X + e.lx) + 0.5, ey = Math.round(Y + e.ly) + 0.5;
      if (R.tell) {   // as ondas que sobem do abdômen
        for (let j = 0; j < 3; j++) { const kk = (k * 3 + j / 3) % 1; lc.globalAlpha = 0.6 * (1 - kk); lc.strokeStyle = '#ffd870'; lc.beginPath(); lc.arc(ex, ey, 10 + kk * 22, 0, Math.PI * 2); lc.stroke(); }
      } else {        // o anel que corre pela esfera
        const r = 8 + k * (R.grito ? 22 : 20) * T; lc.globalAlpha = 0.8 * (1 - k); lc.strokeStyle = R.grito ? '#eef6ea' : '#ffd870'; lc.beginPath(); lc.arc(ex, ey, r, 0, Math.PI * 2); lc.stroke();
        lc.globalAlpha = 0.4 * (1 - k); lc.strokeStyle = R.grito ? '#9ab4a4' : '#d08a1a'; lc.beginPath(); lc.arc(ex, ey, Math.max(1, r - 3), 0, Math.PI * 2); lc.stroke();
      }
    }
    const D = cmqFx.dust;
    if (D && e.state === 'investeTell') {   // a linha de poeira no caminho da investida
      const k = Math.min(1, e.stateT0 / 0.4);
      for (let s = 0; s < D.len * k; s += 4) {
        const x = Math.round(X + D.x0 + D.ux * s), y = Math.round(Y + D.y0 + D.uy * s), on = ((s / 4 + Math.floor(gameTime * 12)) & 3) !== 0;
        lc.globalAlpha = on ? 0.75 : 0.35; lc.fillStyle = on ? '#d8b850' : '#8a6e28'; lc.fillRect(x, y, 2, 1); lc.fillRect(x - Math.round(D.uy * 3), y + Math.round(D.ux * 3), 1, 1); lc.fillRect(x + Math.round(D.uy * 3), y - Math.round(D.ux * 3), 1, 1);
      }
    }
    if (e.state === 'ferraoTell') {   // a mira da ferroada
      const [ox, oy] = cmqTail(e), c = Math.cos(e.aim), s = Math.sin(e.aim), L = cmqRay(ox, oy, e.aim, 66);
      for (let d = 8; d < L; d += 3) { lc.globalAlpha = 0.25 + 0.35 * (e.stateT0 / 0.8); lc.fillStyle = (Math.floor(gameTime * 10) & 1) ? '#f6c856' : '#d08a1a'; lc.fillRect(Math.round(X + ox + c * d), Math.round(Y + oy + s * d), 1, 1); }
    }
  }
  for (const d of cmqFx.drops) {   // a marca dourada onde a gota vai cair
    if (d.done) continue;
    const k = clamp((d.t + 0.6) / 0.6, 0, 1), x = Math.round(X + d.x) + 0.5, y = Math.round(Y + d.land) - 1.5, r = 7 - k * 3;
    lc.globalAlpha = 0.45 + k * 0.45; lc.strokeStyle = (Math.floor(gameTime * 10) & 1) ? '#ffd870' : '#d08a1a';
    lc.beginPath(); lc.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2); lc.stroke();
  }
  // as doses do Ferrão Real: pontinhos âmbar sobre o alvo
  for (const m of enemies) if (m.cmqDose > 0 && !m.dead && m.cmqDoseT > gameTime - 8) for (let k = 0; k < m.cmqDose; k++) { lc.globalAlpha = 0.9; lc.fillStyle = k === m.cmqDose - 1 ? '#ffd870' : '#d08a1a'; lc.fillRect(Math.round(m.x + m.w / 2) - cx - 5 + k * 3, Math.round(m.y) - cy - 7, 2, 2); }
  for (const P of cmqFx.pops) { const k = P.t / 0.3; lc.globalAlpha = Math.max(0, 0.8 * (1 - k)); lc.strokeStyle = '#f6c856'; lc.beginPath(); lc.arc(Math.round(P.x) - cx + 0.5, Math.round(P.y) - cy + 0.5, 4 + k * 14, 0, Math.PI * 2); lc.stroke(); }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  const B = cmqB();
  // a luz âmbar fraca da lâmina do Ferrão Real
  if (pl && !pl.dead && pl.lg && pl.lg.colmeia && pl.bladeA != null && (hb.sel === 0)) { const [, , ex, ey] = bladeSeg(pl.fArm, pl.sAng, bladeLen()); lc.globalAlpha = 0.18; lc.drawImage(CMQA.GL.hand, Math.round(ex) - cx - 9, Math.round(ey) - cy - 9); }
  if (!B || !cmqPlan || !pl || cmqState.dead) return;
  const X = cmqCX() - cx, Y = cmqCY() - cy, e = cmqBoss;
  if (Math.abs(X - VW / 2) > VW + 300) return;
  // o abdômen que pulsa
  const abx = e ? (cmqFlying(e) ? e.lx - e.facing * 10 : e.lx - e.facing * 8) : 0, aby = e ? (cmqFlying(e) ? e.ly + 2 : e.ly + 7) : 13;
  lc.globalAlpha = (e && cmqFlying(e) ? 0.14 : 0.24) * (0.6 + cmqPulse(e) * 0.8); lc.drawImage(e && cmqFlying(e) ? CMQA.GL.mid : CMQA.GL.abd, Math.round(X + abx) - (e && cmqFlying(e) ? 16 : 40), Math.round(Y + aby) - (e && cmqFlying(e) ? 16 : 40));
  if (!e) return;
  for (const b of cmqFx.balls) { lc.globalAlpha = 0.6; lc.drawImage(CMQA.GL.pink, Math.round(X + b.x) - 9, Math.round(Y + b.y) - 9); }
  for (const d of cmqFx.drops) if (!d.done) { lc.globalAlpha = 0.5; lc.drawImage(CMQA.GL.small, Math.round(X + d.x) - 7, Math.round(Y + d.y) - 7); }
  for (const g of cmqFx.eggs) { lc.globalAlpha = 0.18 + (g.t < 2 ? 0.25 * (0.5 + 0.5 * Math.sin(gameTime * 14)) : 0); lc.drawImage(CMQA.GL.egg, Math.round(X + (g.i + 0.5) * T) - 10, Math.round(Y + (g.j + 0.5) * T) - 10); }
  if (e.state === 'cuspeTell') { const [hx, hy] = cmqHead(e); lc.globalAlpha = 0.5; lc.drawImage(CMQA.GL.pink, Math.round(X + hx) - 9, Math.round(Y + hy) - 5); }
  if (cmqFx.spike || e.state === 'ferraoTell') { const [ox, oy] = cmqTail(e); lc.globalAlpha = 0.4; lc.drawImage(CMQA.GL.small, Math.round(X + ox) - 7, Math.round(Y + oy) - 7); }
});
// a luz: o abdômen presa ilumina o oco; voando, ela e o saco; as gotas e as bolas
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const B = cmqB(); if (!B || !cmqPlan || cmqState.dead || !pl) return;
  if (Math.abs(wdx(B.cx - (x0 + w / 2))) > w / 2 + 30 || B.cy + 22 < y0 || B.cy - 22 > y0 + h) return;
  const X = cmqCX(), Y = cmqCY(), e = cmqBoss;
  if (!e || !cmqFlying(e)) { addL(X - 8, Y + 14, 0.78); addL(X + 10, Y + 4, 0.6); }
  else { addL(X + e.lx, Y + e.ly, 0.62); if (cmqSac) addL(X + cmqSac.lx, Y + cmqSac.ly, 0.5); }
  if (!e) return;
  for (const b of cmqFx.balls) addL(X + b.x, Y + b.y, 0.45);
  for (const d of cmqFx.drops) if (!d.done) addL(X + d.x, Y + d.land - 4, 0.45);
  for (const g of cmqFx.eggs) addL(X + (g.i + 0.5) * T, Y + (g.j + 0.5) * T, 0.32);
}; }

/* ---------- o turno: acordar, sair, a luta ---------- */
HOOK.update.push(dt => {
  for (let k = cmqFx.pops.length - 1; k >= 0; k--) { const P = cmqFx.pops[k]; P.t += dt; if (P.t > 0.3) cmqFx.pops.splice(k, 1); }
  cmqSound();
  const B = cmqB(); if (!B || !cmqPlan || !pl || state !== 'play') return;
  if (cmqState.dead) return;
  // um save no meio da luta deixou a esfera quebrada: volta para a semente (e o herói, se estava dentro, para a porta)
  if (!cmqChecked && !bossFight) {
    cmqChecked = true;
    if (cmqDiffers()) {
      if (cmqHero().d < 21.5) { pl.x = cmqLap((B.cx - 23) * T) + 2; pl.y = (B.cy + 3) * T - pl.h - 0.01; pl.vx = pl.vy = 0; }
      cmqWrite(true);
    }
  }
  const H = cmqHero();
  if (!bossFight && !pl.dead && H.d < 18.3) cmqStart();
  const e = cmqBoss;
  if (!e || !cmqFight()) return;
  if (!pl.dead && H.d > 21.5) { endBossFight(false); return; }
  if (!cmqFx.lacre && H.d < 8.4) cmqSeal();
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
  cmqWeaponTiles();
  cmqFxTick(dt);
});

/* ---------- som: o zumbido dela cobre tudo dentro da esfera; o cântico, o grito ---------- */
const cmqHum = { n: null };
function cmqSound() {
  if (!ac || !noiseBuf) return;
  let want = 0, pitch = 1;
  const B = cmqB();
  if (B && cmqPlan && !cmqState.dead && pl && !pl.dead && state === 'play') {
    const H = cmqHero();
    want = cmqFight() ? 0.55 : H.d < 36 ? 0.32 * (1 - H.d / 36) : 0;
    const e = cmqBoss;
    if (e && (e.state === 'investeTell' || e.state === 'investe' || e.state === 'espiral')) pitch = 1.45;
    else if (e && cmqFlying(e)) pitch = 1.15;
  }
  if (muted) want = 0;
  if (!cmqHum.n) {
    if (want <= 0) return;
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 150; f.Q.value = 3;
    const am = ac.createGain(); am.gain.value = 0.6;
    const lfo = ac.createOscillator(); lfo.frequency.value = 7.5; const lg = ac.createGain(); lg.gain.value = 0.4; lfo.connect(lg); lg.connect(am.gain);
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 74; const ol = ac.createBiquadFilter(); ol.type = 'lowpass'; ol.frequency.value = 240; const og = ac.createGain(); og.gain.value = 0.05;
    const g = ac.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(am); o.connect(ol); ol.connect(og); og.connect(am); am.connect(g); g.connect(sfxOut);
    src.start(); lfo.start(); o.start();
    cmqHum.n = { g, f, o, lfo };
  }
  const N = cmqHum.n, t = ac.currentTime;
  N.g.gain.setTargetAtTime(want, t, 0.35); N.f.frequency.setTargetAtTime(150 * pitch, t, 0.2); N.o.frequency.setTargetAtTime(74 * pitch, t, 0.2); N.lfo.frequency.setTargetAtTime(7.5 * pitch, t, 0.2);
}
Object.assign(sfx, {
  cmqCantico(v = 1) {
    // um coro sem melodia: formantes de ruído que incham e um zumbido grave que sobe
    noise(1.3 * v, 0.05 * v, 720, 'bandpass', 0, 9); noise(1.3 * v, 0.035 * v, 1150, 'bandpass', 0.05, 9); noise(1.1 * v, 0.03 * v, 2400, 'bandpass', 0.12, 12);
    tone(110, 1.3 * v, 'sine', 0.04 * v, 22); tone(165, 1.2 * v, 'sine', 0.02 * v, 30, 0.1);
  },
  cmqGrito(v = 1) {
    tone(520, 1.0 * v, 'sawtooth', 0.035 * v, -330); tone(780, 0.8 * v, 'sawtooth', 0.02 * v, -500, 0.04);
    noise(1.2 * v, 0.07 * v, 3200, 'highpass', 0); noise(0.9 * v, 0.06 * v, 600, 'bandpass', 0, 2);
    for (let k = 0; k < 6; k++) noise(0.05, 0.04 * v, 4200, 'bandpass', 0.1 + k * 0.12, 3);
  },
  cmqInfla(v = 1) { noise(0.55 * v, 0.05, 420, 'bandpass', 0, 3); tone(180, 0.5 * v, 'sine', 0.025, 90); },
  cmqCuspe() { noise(0.18, 0.12, 900, 'lowpass'); tone(260, 0.12, 'sine', 0.04, -160); for (let k = 0; k < 3; k++) noise(0.06, 0.05, 1400, 'bandpass', 0.03 + k * 0.05, 2); },
  cmqSplat(v = 1) { noise(0.14, 0.08 * v, 700, 'lowpass'); tone(160, 0.08, 'sine', 0.03 * v, -90); },
  cmqPinga() { noise(0.5, 0.04, 2600, 'bandpass', 0, 6); tone(620, 0.08, 'sine', 0.018, -300, 0.25); tone(560, 0.08, 'sine', 0.016, -280, 0.5); },
  cmqFerroada() { noise(0.12, 0.12, 2800, 'bandpass', 0, 1.2); tone(900, 0.07, 'triangle', 0.04, -500); noise(0.05, 0.08, 5000, 'highpass', 0.07); },
  cmqLeque() { for (let k = 0; k < 5; k++) { noise(0.07, 0.06, 3200 + k * 300, 'bandpass', k * 0.025, 2); tone(1100 - k * 60, 0.05, 'triangle', 0.015, -400, k * 0.025); } },
  cmqZumbe(v = 1) { tone(140, 0.9 * v, 'sawtooth', 0.025, 160); noise(0.9 * v, 0.06, 260, 'bandpass', 0, 4); },
  cmqInveste() { noise(0.6, 0.12, 300, 'bandpass', 0, 1.5); tone(90, 0.5, 'sawtooth', 0.04, 60); noise(0.4, 0.06, 2000, 'bandpass', 0.05, 1); },
  cmqRasga() { noise(0.22, 0.09, 1600, 'bandpass', 0, 1.5); noise(0.18, 0.08, 500, 'lowpass', 0.02); for (let k = 0; k < 3; k++) noise(0.03, 0.05, 3400, 'highpass', 0.04 + k * 0.05); },
  cmqGota() { noise(0.1, 0.05, 1200, 'bandpass'); tone(480, 0.08, 'sine', 0.02, -280); noise(0.3, 0.03, 3000, 'highpass', 0.05); },
  cmqCola(v = 1) { noise(0.12, 0.06 * v, 600, 'lowpass'); tone(220, 0.1, 'sine', 0.03 * v, -120); },
  cmqEclode() { noise(0.1, 0.08, 2200, 'bandpass', 0, 2); noise(0.25, 0.07, 500, 'lowpass', 0.05); tone(300, 0.12, 'square', 0.02, -180, 0.05); },
  cmqRompe(v = 1) { noise(0.9 * v, 0.14 * v, 500, 'lowpass'); noise(0.5 * v, 0.07 * v, 1800, 'bandpass', 0.05, 1.5); tone(70, 0.8 * v, 'sine', 0.06 * v, -20); for (let k = 0; k < 5; k++) noise(0.06, 0.05 * v, 1100, 'bandpass', 0.1 + k * 0.09, 3); },
  cmqLacre(v = 1) { for (let k = 0; k < 8; k++) noise(0.06, 0.05 * v, 900 + Math.random() * 900, 'bandpass', k * 0.06, 4); tone(130, 0.5 * v, 'sine', 0.03, -30); },
  cmqFavo(br) { noise(0.1, br ? 0.12 : 0.08, br ? 900 : 1300, 'lowpass'); tone(br ? 140 : 200, 0.08, 'triangle', 0.04, -60); if (br) noise(0.18, 0.06, 2600, 'bandpass', 0.03, 2); },
  cmqVeneno() { tone(380, 0.25, 'sine', 0.05, 380); noise(0.25, 0.08, 1800, 'bandpass', 0, 2); tone(190, 0.3, 'triangle', 0.03, -60, 0.05); },
  cmqMorte() { tone(300, 2.4, 'sawtooth', 0.03, -250); noise(2.4, 0.06, 240, 'lowpass'); noise(1.6, 0.04, 1300, 'bandpass', 0.3, 3); tone(74, 2.6, 'sine', 0.05, -20, 0.2); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.rainha = { dead: cmqState.dead }; return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  cmqBoss = null; cmqSac = null; cmqPlan = null; cmqChecked = false; cmqClear();
  cmqState.dead = !!(sv && sv.rainha && sv.rainha.dead);   // antes da geração: cmDress lê
  return _nw(sd, sv);
}; }
