'use strict';

/* ================= o chefe da Prisão dos Deuses: O Lobo Atado, na Cova das Correntes =================
   Ficha 16, seção 7. O que nem os deuses puderam matar: um lobo do tamanho de uma casa, de pelo cinza-chumbo e juba
   escura, com uma coleira de bronze no pescoço. Os deuses prenderam ele com quatro correntes; duas já arrebentaram e
   pendem do teto da Cova, partidas (dá para subir nelas). As outras duas, uma de cada parede, ainda seguram a coleira.
   A sala: o miolo 62 x 24 do pdBoss (395), chão de laje reto, a moldura de bronze; uma porta no pé de cada lado, que a
   grade de bronze fecha durante a luta. Sem trono: a sala é a prisão dele.
   - Fase 1 (100% a 66%): as duas correntes prendem o lobo no meio (12 blocos para cada lado). Mordida (ele se agacha
     rosnando, 0,55 s, e dá o bote), Uivo (ele se empina, 0,8 s, e bate as patas: uma onda corre no chão para os dois
     lados, pula-se por cima), Pedra (ele cava, 0,7 s; a marca vermelha acende no chão onde o herói está e a pedra cai
     lá).
   - Virada (66%): ele puxa a corrente da esquerda com tudo (2 s, não leva dano; os elos acendem), ela arrebenta, cai e
     fica pendurada na parede (dá para subir). Agora ele chega até a parede da direita, e a ponta partida que ficou na
     coleira vira chicote: Chicote (ele ergue a corrente, 0,6 s, o arco vermelho mostra o alcance, e varre).
   - Virada (33%): a da direita arrebenta. Livre na sala inteira, mais rápido; o Salto (uma sombra vermelha marca o
     chão debaixo do herói, 0,7 s, e ele cai ali; ondas curtas dos dois lados) e duas pedras de cada vez.
   - Saiu ou morreu: a luta reinicia (vida cheia, as duas correntes inteiras de novo).
   - Lendário: A Fita que Prende (acessório): +def, +vida; 15% dos golpes de perto amarram o bicho (não o chefe) por 1,5 s.
   Save: o 399 (`prisao_chefe.dead`). Os blocos da sala não vão para o save enquanto ele vive.
   O caminho para baixo abre pelo 363 (que embrulha o endBossFight por fora de todos os chefes). */

const LB_L = layerBossLvl('prisao');
const LBQ = { hp: Math.round(340 * (1 + 0.3 * (LB_L - 1))), dmg: Math.round(10 * (1 + 0.2 * (LB_L - 1))), xp: 580, p2: 0.66, p3: 0.33, tether: 12 };
ET.loboatado = { name: 'O Lobo Atado', w: 44, h: 28, hp: LBQ.hp, dmg: LBQ.dmg, xp: LBQ.xp, kb: 0, fly: false, blood: '#5a1a14', boss: true };
const LB_BASES = ['mangual_grilhao', 'elmo_carcereiro', 'cota_elos'];
const lbDrops = () => { DROPS.loboatado = [['fita_atadura', 1], ['min_ferro_divino', 1, 6, 10], ['icor_divino', 1, 2, 4], ['presa_lobo', 1, 2, 4], ['pocao', 1, 2, 4]].filter(([id]) => ITEMS[id]); };
let lbBoss = null, lbAllow = false;
// as correntes: inteiras (true) ou partidas; as peças que caem
const lbCh = { L: true, R: true, tiles: [], quedas: [] };
const lbFx = { arcos: [] };

/* ---------- a sala ---------- */
const lbB = () => (typeof pdBoss !== 'undefined' && pdBoss) ? pdBoss : null;
const lbX0 = () => lbB().x0 * T, lbFyPx = () => lbB().fy * T;
const lbInBox = (tx, ty) => inPdHall(wrapX(tx), ty, 0);
// as âncoras das duas correntes nas paredes (px), na altura da coleira de pé
function lbAnc(side) { const B = lbB(); return side < 0 ? [B.x0 * T + 2, (B.fy - 8) * T] : [(B.x0 + B.w) * T - 2, (B.fy - 8) * T]; }
// até onde o meio do lobo vai (px): a corrente da esquerda segura a direita, a da direita segura a esquerda
function lbLim() {
  const B = lbB(), cx = (B.x0 + B.w / 2) * T, half = ET.loboatado.w / 2 + 2 * T;
  return [lbCh.R ? cx - LBQ.tether * T : B.x0 * T + half, lbCh.L ? cx + LBQ.tether * T : (B.x0 + B.w) * T - half];
}
function lbDoors(shut) {
  const B = lbB(); if (!B) return;
  for (const D of B.doors) for (let y = B.fy - 4; y < B.fy; y++) { const i = y * WW + wrapX(D.x); tiles[i] = shut ? PD_BARREIRA : AIR; walls[i] = WPD_BRONZE; diffs.delete(i); markDirty(wrapX(D.x), y); }
}
// a corrente partida que cai e fica pendurada da âncora na parede (dá para subir); sem ir para o save
function lbChainTiles(side, on) {
  const B = lbB(), x = side < 0 ? B.x0 : B.x0 + B.w - 1;
  for (let y = B.fy - 9; y <= B.fy - 5; y++) {
    const i = y * WW + wrapX(x);
    if (on) { if (tiles[i] === AIR) tiles[i] = PD_CORRENTE; } else if (tiles[i] === PD_CORRENTE) tiles[i] = AIR;
    diffs.delete(i); markDirty(wrapX(x), y);
  }
}
// a sala da semente (o 395 chama depois do pdAfter): o miolo vazio, as duas correntes partidas do teto, as portas
function pdDress() {
  const B = lbB(); if (!B) return;
  for (let y = B.y0; y < B.fy; y++) for (let x = B.x0; x < B.x0 + B.w; x++) { const i = y * WW + wrapX(x); tiles[i] = B.hang && B.hang.includes(wrapX(x)) && y <= B.fy - 5 ? PD_CORRENTE : AIR; pdKeep.add(i); if (agua.length) agua[i] = 0; }
  for (let x = B.x0 - 1; x <= B.x0 + B.w; x++) { const i = B.fy * WW + wrapX(x); tiles[i] = PD_LAJE; pdKeep.add(i); }
  lbDoors(false);
  lbCh.L = lbCh.R = !pdChefe.dead;
  if (pdChefe.dead) { lbChainTiles(-1, true); lbChainTiles(1, true); }
}
function lbHeroIn(m = 0) {
  const B = lbB(); if (!B || !pl) return false;
  const tx = Math.floor((pl.x + pl.w / 2) / T), ty = Math.floor((pl.y + pl.h - 1) / T), dx = wdx(tx - B.x0);
  return dx >= -m && dx < B.w + m && ty >= B.y0 - m && ty < B.fy + m;
}

/* ---------- a arte: o lobo, quadro 80 x 50, o meio dos pés em x 38, o chão na linha 48 (a cabeça para a direita) ---------- */
const LBA = {};
{
const { cg } = CVART, { rod, slab, ring, cp, set, AR } = PD1, R7 = a => a.map(h => ph(h));
const PEL = R7(['#08080a', '#141418', '#222228', '#34343c', '#4a4a54', '#66666f', '#8a8a94']);
const JUBA = R7(['#040404', '#0a0a0c', '#121216', '#1c1c22', '#2a2a32', '#3a3a44', '#4e4e58']);
const BOCA = R7(['#1a0404', '#340808', '#5a1010', '#8a1a18', '#b03028', '#d05a48', '#f08a78']);
const BRO = R7(['#140c04', '#2a1a08', '#4a3010', '#6e4c1a', '#98702c', '#c49a48', '#e8c878']);
const ell = (P, cx, cy, rx, ry, R, base, s, ln = 1.4, rot = 0) => {
  const c = Math.cos(rot), sn = Math.sin(rot), m = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - m); y <= cy + m; y++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
    const ux = x + 0.5 - cx, uy = y + 0.5 - cy, ax = (ux * c + uy * sn) / rx, ay = (-ux * sn + uy * c) / ry;
    if (ax * ax + ay * ay <= 1) P.put(x, y, R, base - ((ux / rx) * 0.6 + (uy / ry) * 0.8) * ln + cg(x, y, s) * 0.35);
  }
};
// [o meio do corpo, os raios, a inclinação; a cabeça; a boca 0-1; orelhas para trás; as 4 pernas (quadril -> pé); o rabo]
const POSE = [
  { b: [34, 30, 20, 9], tl: 0, h: [58, 22], op: 0, eb: 0, lg: [[20, 33, 18, 48], [24, 33, 26, 48], [44, 33, 44, 48], [48, 33, 50, 48]], tail: [14, 28, 4, 34] },
  { b: [34, 30, 20, 9], tl: 0, h: [58, 22], op: 0, eb: 0, lg: [[20, 33, 14, 48], [24, 33, 30, 48], [44, 33, 50, 48], [48, 33, 42, 48]], tail: [14, 28, 3, 31] },
  { b: [34, 29, 20, 9], tl: 0, h: [58, 21], op: 0, eb: 0, lg: [[20, 33, 24, 48], [24, 33, 18, 48], [44, 33, 40, 48], [48, 33, 54, 48]], tail: [14, 28, 4, 36] },
  { b: [34, 35, 20, 8], tl: 0.08, h: [60, 32], op: 0.35, eb: 1, lg: [[20, 37, 14, 48], [24, 37, 22, 48], [44, 38, 50, 48], [48, 38, 56, 48]], tail: [14, 34, 4, 42] },   // 3 agachado
  { b: [38, 29, 23, 8], tl: -0.05, h: [66, 24], op: 1, eb: 1, lg: [[20, 32, 6, 46], [24, 32, 12, 48], [50, 32, 64, 44], [54, 32, 70, 46]], tail: [14, 27, 0, 26] },   // 4 o bote
  { b: [34, 24, 19, 9], tl: -0.55, h: [52, 6], op: 0.4, eb: 0, lg: [[20, 32, 16, 48], [24, 32, 26, 48], [46, 20, 54, 28], [50, 18, 58, 24]], tail: [16, 32, 4, 42] },   // 5 empinado
  { b: [34, 33, 20, 8], tl: 0.12, h: [60, 36], op: 0.2, eb: 0, lg: [[20, 35, 18, 48], [24, 35, 26, 48], [44, 36, 46, 48], [48, 36, 58, 42]], tail: [14, 31, 4, 26] },   // 6 cavando
  { b: [30, 31, 20, 9], tl: 0.1, h: [52, 26], op: 0.6, eb: 1, lg: [[16, 34, 6, 48], [20, 34, 10, 48], [40, 34, 50, 48], [44, 34, 54, 48]], tail: [10, 30, 0, 38] },   // 7 puxando a corrente
  { b: [34, 30, 20, 9], tl: -0.15, h: [56, 8], op: 1, eb: 0, lg: [[20, 33, 18, 48], [24, 33, 26, 48], [44, 32, 48, 48], [48, 32, 54, 48]], tail: [14, 28, 4, 30] }    // 8 uivando
];
function lobo(k) {
  const o = POSE[k], P = cp(80, 50), s = 39601 + k * 13, [bx, by, brx, bry] = o.b, [hx, hy] = o.h;
  // as pernas de trás (do lado longe, na sombra)
  for (const n of [0, 2]) { const [a, b, c, d] = o.lg[n]; rod(P, a, b, (a + c) / 2 + 1, (b + d) / 2, 5, PEL, 1.6, s + n); rod(P, (a + c) / 2 + 1, (b + d) / 2, c, d, 3.5, PEL, 1.6, s + n + 1); slab(P, c - 2, d - 1, c + 3, d, PEL, s + n + 2, 1.4); }
  // o rabo grosso
  const [t0, t1, t2, t3] = o.tail;
  rod(P, t0, t1, t2, t3, 5, JUBA, 3, s + 5); rod(P, (t0 + t2) / 2, (t1 + t3) / 2, t2 - 1, t3 + 1, 6, JUBA, 3.6, s + 6);
  // o corpo, a barriga mais clara, as costelas
  ell(P, bx, by, brx, bry, PEL, 3.2, s + 7, 1.6, o.tl);
  for (let x = bx - 10; x <= bx + 8; x += 4) for (let y = 0; y < 3; y++) P.put(x + y, by + 2 + y, PEL, 2);
  for (let x = bx - 12; x <= bx + 10; x++) P.put(x, by + bry - 2 - Math.round((x - bx) * Math.sin(o.tl)), PEL, 4.4);
  // a juba: pelos escuros e espetados do cangote até o meio das costas
  for (let i = 0; i < 12; i++) {
    const u = i / 11, x = bx + 4 + (hx - bx - 6) * u, y = by - bry + 1 + (hy - by + bry - 2) * u - Math.sin(o.tl) * (x - bx) * 0.2;
    rod(P, x, y + 3, x - 3 + u * 2, y - 3 - (i % 2) * 2, 2.5, JUBA, 3.4 - u * 0.6, s + 20 + i);
  }
  ell(P, (bx + hx) / 2 + 4, (by + hy) / 2 - 1, 9, 8, JUBA, 3, s + 8, 1.2, Math.atan2(hy - by, hx - bx));
  // a coleira de bronze com as duas argolas
  const nx = (bx + hx) / 2 + 7, ny = (by + hy) / 2;
  rod(P, nx - 1, ny - 7, nx + 1, ny + 7, 3, BRO, 3.6, s + 9);
  ring(P, nx + 1, ny + 7, 2.2, 2.2, 1, BRO, 3, s + 10);
  // as pernas da frente (do lado perto)
  for (const n of [1, 3]) { const [a, b, c, d] = o.lg[n]; rod(P, a, b, (a + c) / 2 + 1, (b + d) / 2, 5.5, PEL, 3, s + n + 30); rod(P, (a + c) / 2 + 1, (b + d) / 2, c, d, 4, PEL, 3.2, s + n + 31); slab(P, c - 2, d - 1, c + 3, d, PEL, s + n + 32, 2.8); P.put(c + 3, d, AR.osso, 4); P.put(c + 1, d, AR.osso, 4); }
  // a cabeça: o crânio, o focinho comprido, a mandíbula (abre), as orelhas
  ell(P, hx, hy, 8, 6.5, PEL, 3.4, s + 11);
  const op = o.op, jx = hx + 6, ang = k === 5 || k === 8 ? -0.55 : 0;
  const cA = Math.cos(ang), sA = Math.sin(ang), F = (u, v) => [jx + u * cA - v * sA, hy + u * sA + v * cA];
  for (let u = 0; u <= 12; u++) for (let v = -3.5; v <= 0.5; v += 0.5) { const [x, y] = F(u, v - u * 0.05); P.put(x, y, PEL, 3.8 - (v + 3.5) * 0.3 - u * 0.05 + cg(x | 0, y | 0, s + 12) * 0.3); }
  P.put(...F(12.5, -2), PEL, 0.6); P.put(...F(12.5, -1.5), PEL, 0.4);   // o nariz
  const jA = ang + op * 0.55, cJ = Math.cos(jA), sJ = Math.sin(jA), J = (u, v) => [jx + u * cJ - v * sJ, hy + 1 + u * sJ + v * cJ];
  if (op > 0.05) { for (let u = 1; u <= 11; u++) for (let v = -0.5; v <= op * 3; v += 0.5) { const [x, y] = F(u, 1 + v * 0.6); P.put(x, y, BOCA, 3 - v * 0.4); } }
  for (let u = 0; u <= 11; u++) for (let v = 0; v <= 2.5; v += 0.5) { const [x, y] = J(u, v); P.put(x, y, PEL, 2.8 - v * 0.3); }
  if (op > 0.2) for (let u = 3; u <= 11; u += 2) { P.put(...F(u, 0.5), AR.osso, 5.2); P.put(...J(u + 1, -0.5), AR.osso, 4.8); }
  else for (let u = 7; u <= 10; u += 3) P.put(...F(u, 0.5), AR.osso, 5);
  // as orelhas: em pé, ou deitadas para trás (o aviso)
  const ear = o.eb ? [[hx - 4, hy - 4, hx - 11, hy - 6], [hx - 1, hy - 5, hx - 8, hy - 8]] : [[hx - 4, hy - 4, hx - 6, hy - 12], [hx - 1, hy - 5, hx - 1, hy - 12]];
  for (const [a, b, c, d] of ear) rod(P, a, b, c, d, 3, JUBA, 3.6, s + 13);
  // o olho (o EYES_E acende)
  P.put(hx + 3, hy - 2, AR.aviso, 3); P.put(hx + 4, hy - 2, AR.aviso, 2.4);
  return set(P.done());
}
LBA.get = () => LBA.ready || (LBA.ready = POSE.map((_, k) => lobo(k)));
LBA.POSE = POSE;
LBA.GL = { olho: glow(6, '#ffb030'), olhoG: glow(14, '#ffb030'), elo: glow(6, '#ffcc4a'), eloG: glow(12, '#ffcc4a'), aviso: glow(8, '#ff3a2a') };
}
const lbPose = e => {
  switch (e.state) {
    case 'agacha': return 3; case 'bote': return 4; case 'empina': return 5; case 'uiva': return 8; case 'cava': return 6; case 'puxa': return 7;
    case 'mira': return 3; case 'salto': return 4; case 'ergue': return 5; case 'chicoteia': return 4; case 'intro': return e.stateT > 0.8 ? 7 : 8;
    default: return e.onGround && Math.abs(e.vx) > 8 ? 1 + Math.floor(e.t * 7) % 2 : 0;
  }
};
// a coleira na tela e no mundo (de onde saem as correntes)
function lbColeira(e) { const o = LBA.POSE[lbPose(e)], cx = e.x + e.w / 2, fy = e.y + e.h; const nx = (o.b[0] + o.h[0]) / 2 + 7, ny = (o.b[1] + o.h[1]) / 2 + 4; return [cx + (nx - 38) * e.facing, fy - (48 - ny)]; }
function lbBoca(e) { const o = LBA.POSE[lbPose(e)], cx = e.x + e.w / 2, fy = e.y + e.h; return [cx + (o.h[0] + 12 - 38) * e.facing, fy - (48 - o.h[1])]; }
DRAW_E.loboatado = (e, fx, fy, fl) => {
  const img = cvPick(LBA.get()[lbPose(e)], e, fl), jx = e.state === 'puxa' || (e.state === 'intro' && e.stateT > 0.8) ? (Math.floor(e.t * 30) % 2) : 0;
  lc.drawImage(img, Math.round((e.facing > 0 ? fx - 38 - 1 : fx - (img.width - 38 - 1)) + jx), fy - 48 - 1);
};
EYES_E.loboatado = (e, fx, fy) => {
  const o = LBA.POSE[lbPose(e)], G = LBA.GL, hot = WARN_E.loboatado(e) || e.state === 'puxa';
  const x = Math.round(fx + (o.h[0] + 3 - 38) * e.facing), y = Math.round(fy - (48 - o.h[1]) - 2);
  lc.globalAlpha = hot ? 0.9 : 0.55; lc.drawImage(hot ? G.olhoG : G.olho, x - (hot ? 14 : 6), y - (hot ? 14 : 6));
};
WARN_E.loboatado = e => e.state === 'agacha' || e.state === 'empina' || e.state === 'cava' || e.state === 'ergue' || e.state === 'mira';

/* ---------- a luta ---------- */
function lbSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; }
function lbStart() {
  lbDrops();
  const D = ET.loboatado, B = lbB();
  // os bichos comuns que entraram atrás do herói somem (a Cova é dele)
  for (const m of enemies.slice()) if (!m.dead && !m.boss && inPdHall(Math.floor((m.x + m.w / 2) / T), Math.floor((m.y + m.h - 1) / T), 0)) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
  const e = spawnEnemy('loboatado', (B.x0 + B.w / 2) * T - D.w / 2, B.fy * T - D.h - 0.01, PD_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: LB_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, ph: 0, cd: 1.2, last: '', rep: 0, facing: Math.sign(pl.x + pl.w / 2 - (B.x0 + B.w / 2) * T) || 1, ar: false });
  lbSet(e, 'intro', 1.8);
  lbBoss = e; bossFight = { e, pd: true };
  lbCh.L = lbCh.R = true; lbCh.quedas.length = 0; lbClearFx(); lbChainTiles(-1, false); lbChainTiles(1, false);
  lbDoors(true);
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Lobo Atado'; bn.lastChild.textContent = 'o que nem os deuses puderam matar'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Lobo Atado', 'o que nem os deuses puderam matar');
  sfx.lbUivo(0.8); shake(3);
}
function lbClearFx() { lbFx.arcos.length = 0; if (typeof clearPdFx === 'function') clearPdFx(); }
function lbEnd(won) {
  const e = lbBoss; lbBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  lbClearFx();
  const x = e ? e.x + e.w / 2 : lbX0() + lbB().w / 2 * T, y = e ? e.y + e.h / 2 : lbFyPx() - 2 * T;
  if (!won) {
    if (e) { const k = enemies.indexOf(e); if (k >= 0) enemies.splice(k, 1); e.dead = true; }
    lbCh.L = lbCh.R = true; lbChainTiles(-1, false); lbChainTiles(1, false); lbDoors(false);
    return;
  }
  pdChefe.dead = true;
  lbCh.L = lbCh.R = false; lbChainTiles(-1, true); lbChainTiles(1, true);
  lbDoors(false);
  burst(x, y, 30, '#5a5a64', 120, 200, 1.1); burst(x, y, 20, '#ffcc4a', 100, -40, 1.2, 1, true); burst(x, y, 14, '#fff0b0', 80, 0, 1, 1, true);
  const bases = LB_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.lbMorte();
  showBanner('Vitória', 'a última corrente cai no chão');
  // o caminho para baixo abre no 363 (o embrulho de fora do endBossFight, depois de todos os chefes)
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.pd) return lbEnd(won); return _eb(won); }; }
// cada fase é vivida: o golpe só leva até o piso da fase, e no piso ele puxa a corrente
const lbFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * LBQ.p2) : e.ph === 1 ? Math.floor(e.maxHp * LBQ.p3) : 0;
const lbInvuln = e => e.state === 'intro' || e.state === 'puxa';
function lbPuxa(e) { lbSet(e, 'puxa', 2); e.vx = 0; e.puxaLado = e.ph === 0 ? -1 : 1; e.facing = -e.puxaLado; sfx.lbRosna(1); sfx.lbRange(1); }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'loboatado' && !e.dead) { const f = lbFloorHp(e); if (f > 0) { e.hp = f; if (e.state !== 'puxa') lbPuxa(e); return; } }
  return _k(e);
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  if (e && e.type === 'loboatado' && !e.dead) {
    if (lbInvuln(e)) { burst(e.x + e.w / 2, e.y + e.h / 2, 4, '#8a8a94', 40, 0, 0.3, 1, true); return; }
    const r = _hit(e, dir, mult, melee); e.stun = 0; e.vx = e.state === 'bote' || e.state === 'salto' ? e.vx : 0;
    const f = lbFloorHp(e); if (f > 0 && e.hp <= f && !e.dead) { e.hp = f; lbPuxa(e); }
    return r;
  }
  return _hit(e, dir, mult, melee);
}; }
const lbLive = () => !!(lbB() && !pdChefe.dead);
{ const _bt = breakTile; breakTile = function (tx, ty) { if (!lbAllow && lbLive() && lbInBox(tx, ty)) return; return _bt(tx, ty); }; }
{ const _pi = pickImpact; pickImpact = function (sx, sy, aim) {
  const tg = pl.target;
  if (tg && tg.inReach && lbLive() && lbInBox(tg.tx, tg.ty) && SOLID[tileAt(tg.tx, tg.ty)]) {
    sfx.tink(); burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 3, '#c09a48', 40, 300, 0.3, 1, true);
    pl.target = Object.assign({}, tg, { dig: false });
    try { _pi(sx, sy, aim); } finally { pl.target = tg; }
    pl.digT = 0; pl.digX = -1;
    return;
  }
  return _pi(sx, sy, aim);
}; }
{ const _cp = canPlace; canPlace = function (tx, ty) { if (lbLive() && lbInBox(tx, ty)) return false; return _cp(tx, ty); }; }

/* ---------- o cérebro ---------- */
function lbPick(e, list) {
  let tot = 0; for (const [, w] of list) tot += w;
  for (let n = 0; n < 4; n++) {
    let r = Math.random() * tot, k = list[0][0]; for (const [s, w] of list) { if (r < w) { k = s; break; } r -= w; }
    if (k === e.last && e.rep >= 1 && list.length > 1) continue;
    e.rep = k === e.last ? e.rep + 1 : 0; e.last = k; return k;
  }
  return list[0][0];
}
AI.loboatado = function (e, dt, dx) {
  const B = lbB(); if (!B) { e.dead = true; return; }
  lbBrain(e, dt, dx);
  // a corrente segura: o meio do lobo não passa do limite
  const [lo, hi] = lbLim(), cx = e.x + e.w / 2;
  if (cx < lo && e.vx < 0) e.vx = 0; if (cx > hi && e.vx > 0) e.vx = 0;
};
function lbBrain(e, dt, dx) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, ecx = e.x + e.w / 2, fyPx = lbFyPx(), ph = e.ph, sp = [55, 75, 105][ph];
  const face = () => { e.facing = Math.sign(pcx - ecx) || e.facing; };
  switch (e.state) {
    case 'intro': e.vx = 0; if (e.stateT <= 0) { lbSet(e, 'anda', 0.6); } return;
    case 'puxa': {
      e.vx = 0;
      e.elT = (e.elT || 0) - dt; if (e.elT <= 0) { e.elT = 0.18; sfx.lbElos(0.8); shake(1); }
      if (e.stateT <= 0) lbArrebenta(e);
      return;
    }
    case 'agacha': e.vx = 0; face(); if (e.stateT <= 0) { lbSet(e, 'bote', 0.45); e.feriu = false; e.vx = e.facing * (300 + ph * 40); sfx.lbBote(1); } return;
    case 'bote': {
      e.vx = approach(e.vx, 0, 500 * dt);
      const [mx, my] = lbBoca(e);
      if (!e.feriu && pdBoxHits(Math.min(mx, mx - e.facing * 20), my - 10, 20, 20)) { e.feriu = true; hurtPlayer(Math.round(e.dmg * 1.1), ecx, e, false); }
      if (e.stateT <= 0) lbSet(e, 'recupera', 0.6);
      return;
    }
    case 'empina': e.vx = 0; if (e.stateT <= 0) lbUiva(e); return;
    case 'uiva': e.vx = 0; if (e.stateT <= 0) { if (ph === 2 && !e.dupla) { e.dupla = true; lbUiva(e); } else { e.dupla = false; lbSet(e, 'recupera', 0.7); } } return;
    case 'cava': {
      e.vx = 0;
      if (Math.random() < dt * 20) { const [mx] = lbBoca(e); burst(mx, fyPx - 2, 1, '#3a3044', 60, 400, 0.5); }
      if (e.stateT <= 0) lbJoga(e);
      return;
    }
    case 'ergue': e.vx = 0; face(); if (e.stateT <= 0) lbChicoteia(e); return;
    case 'chicoteia': e.vx = 0; if (e.stateT <= 0) lbSet(e, 'recupera', 0.6); return;
    case 'mira': e.vx = 0; face(); if (e.stateT <= 0) lbSalta(e); return;
    case 'salto': {
      if (e.onGround && e.stateT < 0.6) lbAterra(e);
      else if (e.stateT <= 0) lbSet(e, 'recupera', 0.5);
      return;
    }
    case 'recupera': e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) lbSet(e, 'anda', 0.3 + Math.random() * 0.5); return;
  }
  // anda até o herói (dentro do que a corrente deixa) e escolhe o golpe
  e.state = 'anda';
  const adx = Math.abs(pcx - ecx), [lo, hi] = lbLim();
  const gx = clamp(pcx - Math.sign(pcx - ecx) * 4 * T, lo, hi);
  e.vx = approach(e.vx, Math.abs(gx - ecx) > 6 ? Math.sign(gx - ecx) * sp : 0, 400 * dt);
  face();
  e.passoT = (e.passoT || 0) - dt; if (Math.abs(e.vx) > 10 && e.passoT <= 0) { e.passoT = 0.36; sfx.pdPassoPedra(0.9); if (ph) shake(0.6); }
  e.cd -= dt;
  if (e.cd > 0 || e.stateT > 0 || !e.onGround) return;
  const list = [['uivo', 2], ['pedra', adx > 6 * T ? 3 : 1]];
  if (adx < 7 * T) list.push(['mordida', 4]);
  if (ph >= 1 && adx < 7 * T) list.push(['chicote', 3]);
  if (ph >= 2) list.push(['salto', adx > 4 * T ? 4 : 2]);
  const k = lbPick(e, list);
  e.cd = [1.3, 1.0, 0.8][ph] + Math.random() * 0.4;
  if (k === 'mordida') { lbSet(e, 'agacha', 0.55); sfx.lbRosna(0.9); }
  else if (k === 'uivo') { lbSet(e, 'empina', 0.8); sfx.lbUivo(0.9); }
  else if (k === 'pedra') { lbSet(e, 'cava', 0.7); e.alvos = lbAlvos(ph === 2 ? 2 : 1); sfx.lbCava(0.9); }
  else if (k === 'chicote') { lbSet(e, 'ergue', 0.6); const [cx, cy] = lbColeira(e); lbFx.arcos.push({ x: cx, y: cy, r: 6 * T, dir: e.facing, t: 0, max: 0.6, hit: false }); sfx.pdChocalha(1); }
  else { lbSet(e, 'mira', 0.7); e.alvoX = clamp(pcx, lbLim()[0], lbLim()[1]); e.marca = pdMarca(e.alvoX - 2.5 * T, e.alvoX + 2.5 * T, lbB().fy, 0.7 + 0.3, 'sombra'); sfx.lbRosna(0.7); }
}
// onde as pedras vão cair: debaixo do herói (e uma ao lado), já com a marca acesa no chão
function lbAlvos(n) {
  const B = lbB(), out = [], pcx = clamp(pl.x + pl.w / 2, (B.x0 + 2) * T, (B.x0 + B.w - 2) * T);
  for (let k = 0; k < n; k++) { const x = clamp(pcx + (k ? (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 3) * T : 0), (B.x0 + 2) * T, (B.x0 + B.w - 2) * T); out.push(x); pdMarca(x - 14, x + 14, B.fy, 0.7 + 0.75); }
  return out;
}
function lbJoga(e) {
  lbSet(e, 'recupera', 0.55);
  const [mx, my] = lbBoca(e), fy = lbFyPx();
  for (const x of e.alvos || []) {
    const v = pdArco(mx, my - 6, x, fy - 5, 700, 0.75);
    pdTiro({ kind: 'pedra', x: mx, y: my - 6, vx: v.vx, vy: v.vy, g: 700, r: 5, dmg: Math.round(e.dmg * 0.9), src: e, life: 2, onEnd: lbPedraCai });
  }
  e.alvos = null; sfx.pdArremesso(1); shake(1);
}
function lbPedraCai(S, x, y, wall) {
  burst(x, y, 12, '#3c3444', 80, 400, 0.6); pdSparks(x, y, 6, ['#b08aff', '#ffffff'], 60, 200, 0.4);
  if (!S.hit && Math.abs(pl.x + pl.w / 2 - x) < 18 && Math.abs(pl.y + pl.h - lbFyPx()) < 22) hurtPlayer(S.dmg, x, null, true);
  sfx.pdBaque(0.8); shake(2); void wall;
}
function lbUiva(e) {
  lbSet(e, 'uiva', 0.55);
  const [mx] = lbBoca(e), fy = lbB().fy, d = (lbB().w + 4) * T;
  pdOnda(mx, fy, 1, d, Math.round(e.dmg * 0.8), e, 210); pdOnda(mx, fy, -1, d, Math.round(e.dmg * 0.8), e, 210);
  burst(mx, fy * T - 2, 16, '#3c3444', 90, 300, 0.6); sfx.pdGigSoco(1); shake(4);
}
function lbChicoteia(e) {
  lbSet(e, 'chicoteia', 0.35);
  const A = lbFx.arcos[lbFx.arcos.length - 1], [cx, cy] = lbColeira(e);
  const px = pl.x + pl.w / 2, py = pl.y + pl.h / 2, ddx = px - cx, d = Math.hypot(ddx, py - cy);
  if (d < 6 * T + 4 && (Math.sign(ddx) === e.facing || Math.abs(ddx) < 10) && py < cy + 2 * T) hurtPlayer(Math.round(e.dmg * 0.9), cx, e, false);
  if (A) { A.swing = 0.3; A.t = A.max; }
  sfx.lbChicote(1); shake(1.5);
}
function lbSalta(e) {
  const tx = e.alvoX, ecx = e.x + e.w / 2;
  lbSet(e, 'salto', 1.4); e.onGround = false; e.vy = -360; e.vx = clamp((tx - ecx) / 0.74, -420, 420); e.voou = true;
  sfx.lbBote(1);
}
function lbAterra(e) {
  e.vx = 0; lbSet(e, 'recupera', 0.8);
  const cx = e.x + e.w / 2, fy = lbB().fy;
  if (Math.abs(pl.x + pl.w / 2 - cx) < 3 * T && Math.abs(pl.y + pl.h - fy * T) < 2.5 * T) hurtPlayer(Math.round(e.dmg * 1.2), cx, e, false);
  pdOnda(cx + 20, fy, 1, 8 * T, Math.round(e.dmg * 0.6), e, 230); pdOnda(cx - 20, fy, -1, 8 * T, Math.round(e.dmg * 0.6), e, 230);
  burst(cx, fy * T - 2, 18, '#3c3444', 100, 300, 0.6); sfx.pdGigSoco(1); shake(5);
}
// a corrente arrebenta: os elos voam, a ponta da parede cai e fica pendurada (dá para subir)
function lbArrebenta(e) {
  const side = e.puxaLado, [ax, ay] = lbAnc(side), [cx, cy] = lbColeira(e);
  if (side < 0) lbCh.L = false; else lbCh.R = false;
  e.ph = Math.min(2, e.ph + 1); lbSet(e, 'recupera', 0.9); e.cd = 0.6;
  for (let k = 0; k < 14; k++) { const u = k / 13; lbCh.quedas.push({ x: ax + (cx - ax) * u, y: ay + (cy - ay) * u, vx: rnd(-60, 60), vy: rnd(-160, -40), t: 0 }); }
  lbChainTiles(side, true);
  pdSparks((ax + cx) / 2, (ay + cy) / 2, 24, ['#ffcc4a', '#fff0b0', '#ffffff'], 140, 300, 0.8);
  sfx.lbArrebenta(1); shake(6);
}

/* ---------- o turno: acordar, sair, a luta ---------- */
HOOK.update.push(dt => {
  const B = lbB(); if (!B || !pl || state !== 'play') return;
  // os elos que caíram quicam no chão e somem
  for (let k = lbCh.quedas.length - 1; k >= 0; k--) { const q = lbCh.quedas[k]; q.t += dt; q.vy += 700 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.y > lbFyPx() - 2) { q.y = lbFyPx() - 2; q.vy *= -0.3; q.vx *= 0.6; } if (q.t > 2.2) lbCh.quedas.splice(k, 1); }
  for (let k = lbFx.arcos.length - 1; k >= 0; k--) { const A = lbFx.arcos[k]; A.t += dt; if (A.swing !== undefined) { A.swing -= dt; if (A.swing <= 0) lbFx.arcos.splice(k, 1); } else if (A.t > A.max + 0.5) lbFx.arcos.splice(k, 1); }
  if (pdChefe.dead) return;
  if (!bossFight && !pl.dead && lbHeroIn(0)) { const dx = wdx(Math.floor((pl.x + pl.w / 2) / T) - B.x0); if (dx >= 2 && dx <= B.w - 3) lbStart(); }
  const e = lbBoss;
  if (!e || !bossFight || !bossFight.pd) return;
  if (pl.dead) { endBossFight(false); return; }
  if (!lbHeroIn(2)) { endBossFight(false); return; }
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
  // a corrente segura também depois da física (o bote e o salto não passam do limite)
  const [lo, hi] = lbLim(), cx = e.x + e.w / 2;
  if (cx < lo) e.x = lo - e.w / 2; else if (cx > hi) e.x = hi - e.w / 2;
});

/* ---------- desenho: as correntes (com a luz), o arco do chicote e os elos caindo (por cima) ---------- */
// uma corrente grossa de (x0, y0) até (x1, y1) com barriga sag, na tela; elos de 5 px alternando frente e lado
function lbCorrente(x0, y0, x1, y1, sag, hot) {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.floor(L / 4));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t + sag * 4 * t * (1 - t));
    lc.fillStyle = '#060608';
    if (i & 1) lc.fillRect(x - 3, y - 1, 6, 3); else lc.fillRect(x - 2, y - 3, 5, 6);
    lc.fillStyle = hot ? '#d8b060' : '#3a3a44';
    if (i & 1) lc.fillRect(x - 2, y, 4, 1); else { lc.fillRect(x - 1, y - 2, 1, 4); lc.fillRect(x + 1, y - 2, 1, 4); }
    lc.fillStyle = hot ? '#fff0b0' : '#6a6a76';
    if (i & 1) lc.fillRect(x - 2, y, 2, 1); else lc.fillRect(x - 1, y - 2, 1, 1);
  }
}
function lbCorrentes(cx, cy, glowOnly) {
  const B = lbB(); if (!B) return;
  const e = lbBoss && !lbBoss.dead ? lbBoss : null, G = LBA.GL;
  if (pdChefe.dead) return;
  // sem luta: o lobo não aparece; as duas correntes inteiras descansam no chão, da parede até o meio da Cova
  const mid = (B.x0 + B.w / 2) * T, [lo, hi] = lbLim();
  for (const side of [-1, 1]) {
    if (side < 0 ? !lbCh.L : !lbCh.R) continue;
    const [ax, ay] = lbAnc(side);
    let ex, ey, sag, hot = false;
    if (e) { [ex, ey] = lbColeira(e); const lim = side < 0 ? hi : lo, room = Math.abs(lim - ax), d = Math.abs(e.x + e.w / 2 - ax); sag = Math.max(0, (room - d) / room) * 40 + 1; hot = sag < 4 || (e.state === 'puxa' && e.puxaLado === side); }
    else { ex = mid + side * 2 * T; ey = lbFyPx() - 3; sag = 6; }
    if (glowOnly) { if (hot) { lc.globalAlpha = e && e.state === 'puxa' ? 0.4 + 0.3 * Math.sin(gameTime * 30) : 0.25; for (let t = 0; t <= 1; t += 0.12) lc.drawImage(G.elo, Math.round(ax + (ex - ax) * t - cx) - 6, Math.round(ay + (ey - ay) * t + sag * 4 * t * (1 - t) - cy) - 6); } continue; }
    lbCorrente(ax - cx, ay - cy, ex - cx, ey - cy, sag, hot);
    // a argola grande cravada na parede
    lc.fillStyle = '#140c04'; lc.fillRect(Math.round(ax - cx) - 3, Math.round(ay - cy) - 4, 7, 9); lc.fillStyle = '#98702c'; lc.fillRect(Math.round(ax - cx) - 2, Math.round(ay - cy) - 3, 5, 7); lc.fillStyle = '#e8c878'; lc.fillRect(Math.round(ax - cx) - 2, Math.round(ay - cy) - 3, 2, 1);
  }
  // a ponta partida que ficou na coleira: arrastada atrás, ou erguida e varrendo no chicote
  if (e && !glowOnly && (!lbCh.L || !lbCh.R)) {
    const [px, py] = lbColeira(e); let tx, ty, sag = 6;
    const A = lbFx.arcos[lbFx.arcos.length - 1];
    if (e.state === 'ergue') { tx = px - e.facing * 3 * T; ty = py - 4 * T; sag = -4; }
    else if (e.state === 'chicoteia' && A) { const a = (A.swing !== undefined ? 1 - A.swing / 0.3 : 0) * Math.PI, r = 6 * T; tx = px + e.facing * Math.sin(a) * r; ty = py - Math.cos(a) * r; sag = 2; }
    else { tx = px - e.facing * 5 * T; ty = lbFyPx() - 3; }
    lbCorrente(px - cx, py - cy, tx - cx, ty - cy, sag, e.state === 'ergue');
  }
}
HOOK.drawWorld.push((cx, cy) => lbCorrentes(cx, cy, false));
HOOK.drawGlow.push((cx, cy) => { lbCorrentes(cx, cy, true); lc.globalAlpha = 1; });
HOOK.drawTop.push((cx, cy) => {
  const blink = Math.floor(gameTime * 14) % 2;
  for (const A of lbFx.arcos) {
    if (A.swing !== undefined) continue;
    // o arco do chicote: meia lua tracejada na frente do lobo, cheia quando está para varrer
    const q = clamp(A.t / A.max, 0, 1), late = A.max - A.t < 0.2;
    lc.globalAlpha = late && blink ? 0.45 : 0.85; lc.fillStyle = PD_COL.aviso;
    const n = 28; for (let i = 0; i <= n; i++) { if (i > n * q + 1) break; if ((i + Math.floor(gameTime * 10)) % 2) continue; const a = (i / n) * Math.PI; lc.fillRect(Math.round(A.x + A.dir * Math.sin(a) * A.r - cx), Math.round(A.y - Math.cos(a) * A.r - cy), 2, 2); }
  }
  for (const q of lbCh.quedas) { lc.globalAlpha = Math.min(1, (2.2 - q.t) * 2); lc.fillStyle = '#3a3a44'; lc.fillRect(Math.round(q.x - cx) - 2, Math.round(q.y - cy) - 1, 4, 3); lc.fillStyle = '#d8b060'; lc.fillRect(Math.round(q.x - cx) - 1, Math.round(q.y - cy) - 1, 2, 1); }
  // os bichos amarrados pela Fita: três voltas de corrente brilhando em volta do corpo
  for (const e of enemies) {
    if (e.dead || !(e.pdAtado > 0)) continue;
    const x0 = Math.round(e.x - cx) - 1, w = e.w + 2;
    for (let k = 0; k < 3; k++) { const y = Math.round(e.y + e.h * (0.25 + k * 0.25) - cy); lc.globalAlpha = 0.9; lc.fillStyle = '#16161c'; lc.fillRect(x0, y - 1, w, 3); lc.fillStyle = (k + Math.floor(gameTime * 8)) % 2 ? '#d8b060' : '#8a8a94'; for (let x = 0; x < w; x += 3) lc.fillRect(x0 + x, y, 2, 1); }
  }
  lc.globalAlpha = 1;
});

/* ---------- o lendário: A Fita que Prende ---------- */
STAT_DEF.lgAtadura = { t: '15% dos golpes de perto amarram o inimigo (não o chefe) por 1,5 s', flag: 1 };
STAT_KEYS.push('lgAtadura');
ICON_ART.pdFitaL = [["...yYYy...", "..yY..Yy..", ".yY....Yy.", ".Y..WW..Y.", ".Y.WyyW.Y.", ".yY.WW.Yy.", "..yY..Yy..", "...yYYy...", "....yy....", "...y..y..."], { y: '#a07a30', Y: '#e8c878', W: '#fff4c0' }];
ITEMS.fita_atadura = {
  name: 'A Fita que Prende', slot: 'acc', rar: 4, icon: 'pdFitaL', def: 6, hp: 26,
  legend: [['lgAtadura', 1], ['def', 3], ['hp', 12]],
  desc: 'Fina como fita de seda, leve como nada. Foi ela, e não as correntes, que prendeu o Lobo de verdade.'
};
BASE_INFO.fita_atadura = [LB_L];
ITEM_G.fita_atadura = 1; ITEMS.fita_atadura.g = 1;
lbDrops();
let lbFitaOn = false;
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgAtadura || 0;
  lbFitaOn = b > 0;
  return r;
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  const r = _hit(e, dir, mult, melee);
  if (lbFitaOn && melee && e && !e.dead && !e.boss && !(ET[e.type] && ET[e.type].boss) && Math.random() < 0.15) {
    e.stun = Math.max(e.stun || 0, 1.5); e.pdAtado = 1.5; e.vx = 0;
    sfx.pdChocalha(0.8); pdSparks(e.x + e.w / 2, e.y + e.h / 2, 6, ['#ffcc4a', '#fff0b0'], 50, 0, 0.4);
  }
  return r;
}; }
HOOK.update.push(dt => { for (const e of enemies) if (e.pdAtado > 0) { e.pdAtado -= dt; if (e.pdAtado > 0) e.vx = 0; } });

/* ---------- som: o rosnado, o uivo, os elos, o estalo ---------- */
Object.assign(sfx, {
  lbRosna(v = 1) { tone(55, 0.6, 'sawtooth', 0.05 * v, 15); noise(0.6, 0.06 * v, 220, 'bandpass', 0, 3); },
  lbUivo(v = 1) { tone(180, 1.4, 'sawtooth', 0.03 * v, 260); tone(270, 1.3, 'sine', 0.025 * v, 340, 0.05); noise(1.2, 0.03 * v, 700, 'bandpass', 0, 2); },
  lbBote(v = 1) { noise(0.25, 0.08 * v, 600, 'bandpass'); tone(120, 0.25, 'sawtooth', 0.04 * v, -60); },
  lbCava(v = 1) { for (let k = 0; k < 5; k++) noise(0.08, 0.06 * v, 900, 'bandpass', k * 0.13, 2); },
  lbChicote(v = 1) { noise(0.2, 0.08 * v, 2600, 'bandpass', 0, 1); for (let k = 0; k < 6; k++) tone(1000 + Math.random() * 600, 0.04, 'square', 0.01 * v, -300, k * 0.03); },
  lbElos(v = 1) { tone(900 + Math.random() * 300, 0.06, 'square', 0.012 * v, -200); noise(0.08, 0.03 * v, 1800, 'bandpass', 0, 3); },
  lbRange(v = 1) { tone(70, 2, 'sawtooth', 0.04 * v, 50); noise(2, 0.04 * v, 400, 'bandpass', 0, 2); },
  lbArrebenta(v = 1) { noise(0.5, 0.2 * v, 1600, 'bandpass', 0, 1); tone(1800, 0.2, 'square', 0.03 * v, -1200); tone(60, 0.8, 'sine', 0.1 * v, -30); for (let k = 0; k < 10; k++) tone(700 + Math.random() * 1200, 0.05, 'square', 0.01 * v, -300, 0.1 + k * 0.07); },
  lbMorte(v = 1) { tone(160, 2.6, 'sawtooth', 0.04 * v, -110); tone(240, 2.4, 'sine', 0.03 * v, -170, 0.1); noise(2.4, 0.05 * v, 500, 'lowpass'); for (let k = 0; k < 12; k++) tone(900 + Math.random() * 800, 0.05, 'square', 0.008 * v, -200, 0.4 + k * 0.12); }
});

/* ---------- um mundo novo: nada da luta fica para trás ---------- */
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.pd) bossFight = null;
  lbBoss = null; lbCh.quedas.length = 0; lbFx.arcos.length = 0;
  return _nw(sd, sv);
}; }
