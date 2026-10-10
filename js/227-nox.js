'use strict';

/* ================= Nox, Aquele Que Apaga: o chefe da Escuridão =================
   O Escuro Total (docs/camadas/16-escuridao.md, seção 7): a única sala do jogo sem nenhuma luz própria, 64 x 26 de pedra
   primeva no fim do Fundo do Mundo, saliências lavradas em três alturas com as seis Piras dos Acendedores apagadas
   (duas no chão, duas a 8 blocos, duas a 15 perto do meio; o 226 as põe). Ninguém vê o corpo dele: no escuro é um
   pedaço mais preto que o preto, uma borda pálida que tremula e dois olhos como estrelas frias; quando a luz bate,
   aparece uma figura alta e magra, sem rosto, feita de fumaça parada.
   - Ao entrar, o Muro de Sombra fecha as portas. Nox só toma dano com luz em cima (0,5 ou mais no centro dele); no
     escuro o golpe atravessa fumaça: sem número, sem sangue, um som oco. Ele mesmo não dá luz nenhuma.
   - Acender uma pira: o herói se ajoelha 1 s com um lume-fátuo na bolsa (223) e gasta o lume; a pira arde azul. Ao lado
     de cada pira fria espera um lume (os seis dos Acendedores; pego, vai para o save como qualquer bloco). Pira que ele
     ou os apagadores apagam solta o lume, que foge voando pela sala e pousa longe: é preciso ir buscá-lo para acender
     de novo. Na luz forte de uma pira (0,6 ou mais) Nox queima: perde 1,5% da vida por segundo, encolhe e recua; ele
     não entra no círculo, apaga de longe. Tocha posta na sala dura 20 s.
   - Fase 1 (100% a 60%): Braço de Breu (a borda pálida corre pelo chão 0,8 s, depois o braço varre: quem está no chão
     apanha; nas saliências, não). Sopro que Apaga (ele inspira e as chamas se curvam para ele 1 s; um cone que apaga
     piras e tochas e machuca). Anda até a pira acesa mais perto do herói para soprá-la.
   - Fase 2 (60% a 25%): afunda no chão, que vira um espelho preto. Subida: um anel pálido sob o herói (0,9 s) e ele
     sobe por ali. Chama mariposas e 2 apagadores, que vão direto às piras.
   - Fase 3 (25% a 0): apaga todas as piras de uma vez. Noite Total: a cada 12 s as bordas da tela fecham por 2 s; quem
     não estiver no círculo de uma pira acesa toma 1,6 vezes o dano. Acender pira de novo é o único abrigo.
   - Sair da sala, o portal ou morrer encerram a luta: as piras voltam a apagar (o lume de cada pira acesa volta para
     o lado dela), o muro afunda, a vida dele volta toda.
   - O fim: ele fica pálido e fino e é puxado para dentro do chão, sem grito; dois segundos de silêncio; as seis piras
     acendem sozinhas, de baixo para cima, cada uma com um tom grave, e agora com fogo quente de verdade (não mais o
     azul do lume); "A Escuridão recua". O mundo muda pouco e para
     sempre (223: o piso de claridade de todas as camadas sobe um pouco, a Escuridão ganha a claridade de uma caverna
     funda, o breu vivo para de crescer).
   - A Última Brasa (acessório, nível do chefe): +4 de luz, a luz do herói fere as criaturas da sombra como um braseiro
     pequeno, as tochas dele nunca se apagam sozinhas, +15% de dano.
   Save: nox ({ dead, kills }). Embrulha esDress (226 chama), endBossFight, hitEnemy, killEnemy, computeLight, recalc,
   makeSave e newWorld. Carrega logo depois do 226, antes do 87. */

const NOX_L = layerBossLvl('escuro') + 2;   // o último chefe: dois níveis acima do de uma camada comum
const NOX = { lvl: NOX_L, hp: Math.round(330 * (1 + 0.3 * (NOX_L - 1)) / 10) * 10, dmg: Math.round(9 * (1 + 0.2 * (NOX_L - 1))), xp: 600, p2: 0.6, p3: 0.25, burn: 0.015, night: 12 };
const noxState = { dead: false, kills: 0 };
ET.nox = { name: 'Nox, Aquele Que Apaga', w: 30, h: 60, hp: NOX.hp, dmg: NOX.dmg, xp: NOX.xp, kb: 0, fly: true, phase: true, boss: true, blood: '#05060a' };
const NOX_DROPS = [['ultima_brasa', 1], ['min_noctirio', 1, 6, 10], ['nucleo_breu', 1, 2, 4], ['pocao', 1, 2, 4], ['tocha', 1, 4, 8]];
DROPS.nox = NOX_DROPS.filter(([id]) => ITEMS[id]);
let noxBoss = null, noxEnd = null;   // noxEnd: the ending in progress ({ t, lit })
const noxFx = { arm: null, cone: null, ring: null, night: null, nightT: 0, minT: 0, shrink: 0, inhale: 0 };

/* ---------- A Última Brasa ---------- */
STAT_DEF.lgUltimaBrasa = { t: 'Sua luz fere as criaturas da sombra como um braseiro; suas tochas nunca se apagam sozinhas', flag: 1 };
STAT_KEYS.push('lgUltimaBrasa');
ICON_ART.noxBrasa = [["..pPPPPp..", ".pP....Pp.", ".P.oOOo.P.", ".P.OYYO.P.", ".P.OYWO.P.", ".P.oOOo.P.", ".pP....Pp.", "..pPPPPp..", "...pppp..."], { p: '#3a3226', P: '#7c6e52', o: '#6a200a', O: '#d85a18', Y: '#ff9a2a', W: '#ffe6a8' }];
ITEMS.ultima_brasa = {
  name: 'A Última Brasa', slot: 'acc', rar: 4, light: 4, dmgPct: 0.15, icon: 'noxBrasa',
  legend: [['lgUltimaBrasa', 1]],
  desc: 'Um carvão que não apaga, preso numa gaiola de pedra lavrada. Os Acendedores guardaram este por último.'
};
BASE_INFO.ultima_brasa = [NOX_L];
ITEM_G.ultima_brasa = 1; ITEMS.ultima_brasa.g = 1;
DROPS.nox = NOX_DROPS.filter(([id]) => ITEMS[id]);
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgUltimaBrasa || 0;
  if (pl.lg) pl.lg.ultimaBrasa = b > 0;
  return r;
}; }

/* ---------- the hall: the pyres cold (lit for good after the victory), the mural on its walls ---------- */
function esDress() {
  const B = esBoss; if (!B) return;
  for (const [x, y] of B.pyres) tiles[y * WW + wrapX(x)] = noxState.dead ? ES_PIRA : ES_PIRA_FRIA;
  // a wisp waiting beside each pyre, while he lives (the save keeps the ones taken)
  B.lumes = B.pyres.map(([x, y]) => noxLumeSpot(wrapX(x), y));
  if (!noxState.dead) for (const s of B.lumes) if (s) tiles[s[1] * WW + s[0]] = ES_LUME;
  // the Mural of the Kindlers all along the back wall: seen only when the pyres burn
  const M = PROP_DEFS.es_mural, Rl = PROP_DEFS.es_relevo;
  if (M) for (const k of [-22, -8, 8, 22]) { const V = M.vars[0], X = (B.cx + k) * T - (V.w >> 1), Y = (B.fy - 3) * T - V.h; addProp(M, 0, X, Y, []); }
  if (Rl) { const V = Rl.vars[0]; addProp(Rl, 0, B.cx * T - (V.w >> 1), (B.top + 7) * T, []); }
}
const noxPyreTiles = () => esBoss ? esBoss.pyres.map(([x, y]) => [wrapX(x), y]) : [];
// the coals of a lit pyre: blue while a wisp burns in it, warm after the victory
const noxPyreArt = () => { DECO[ES_PIRA] = noxState.dead ? ESART.PIRA_QUENTE : ESART.PIRA; };

/* ---------- the hall's wisps: one waits beside each pyre; a pyre blown out lets its wisp fly off across the hall ---------- */
const noxFlee = [];   // wisps in flight: { x0, y0, x1, y1, tx, ty, t, dur, trail } (pixels from, to; the tile where it settles)
// beside a pyre, on the side toward the middle of the hall, at hand's height
function noxLumeSpot(px, py) {
  const B = esBoss, d = Math.sign(wdx(B.cx - px)) || 1;
  for (const k of [2, 1, 3, -1, -2]) { const x = wrapX(px + d * k), y = py - 1; if (tileAt(x, y) === AIR && inEsHall(x, y, -1)) return [x, y]; }
  return null;
}
// it settles there (or in the nearest free air), through setTile so the save keeps it
function noxLumeLand(x, y) {
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, -1], [2, 0], [-2, 0], [1, -1], [-1, -1]]) {
    const X = wrapX(x + dx), Y = y + dy; if (tileAt(X, Y) !== AIR || !inEsHall(X, Y, 0)) continue;
    setTile(X, Y, ES_LUME); burst((X + 0.5) * T, (Y + 0.5) * T, 8, '#b4ceff', 40, -20, 0.5, 1, true);
    if (Math.abs((X + 0.5) * T - pl.x) < 260) sfx.esLume();
    return;
  }
}
// far from where it was (10+ tiles), over a floor or a ledge where the hero can reach it
function noxLumeFlee(sx, sy) {
  const B = esBoss, cand = [];
  for (let y = B.top + 1; y < B.fy; y++) for (let k = 1; k < B.w - 1; k++) {
    const x = wrapX(B.x0 + k); if (tileAt(x, y) !== AIR || !inEsHall(x, y, -1)) continue;
    if (!SOLID[tileAt(x, y + 1)] && !SOLID[tileAt(x, y + 2)]) continue;
    if (Math.hypot(wdx(x - sx), y - sy) < 10 || noxFlee.some(f => f.tx === x && f.ty === y)) continue;
    cand.push([x, y]);
  }
  if (!cand.length) return noxLumeLand(sx, sy - 1);
  const [tx, ty] = cand[(Math.random() * cand.length) | 0];
  noxFlee.push({ x0: (sx + 0.5) * T, y0: sy * T - 4, x1: (tx + 0.5) * T, y1: (ty + 0.5) * T, tx, ty, t: 0, dur: 1.1 + Math.random() * 0.5, trail: [] });
}
const noxFleeLand = () => { for (const f of noxFlee.splice(0)) noxLumeLand(f.tx, f.ty); };
// a pyre put out during the fight (his breath, the night, a snuffer) lets its wisp go
{ const _sn = esSnuff; esSnuff = function (tx, ty) {
  const x = wrapX(tx), pyre = tileAt(x, ty) === ES_PIRA && !!noxBoss && inEsHall(x, ty, 1);
  const r = _sn(tx, ty); if (r && pyre) noxLumeFlee(x, ty);
  return r;
}; }
function noxPyresSet(lit, keepDiff) {   // every pyre at once, through setTile (the lists in 223 follow); the save keeps them cold unless he is dead
  for (const [x, y] of noxPyreTiles()) { setTile(x, y, lit ? ES_PIRA : ES_PIRA_FRIA); if (!keepDiff) diffs.delete(y * WW + x); }
}
// the shadow wall at both doors: written straight into the tiles (never saved)
function noxWalls(on) {
  const B = esBoss; if (!B) return;
  for (const d of B.doors) for (let k = 0; k < 2; k++) for (let y = d.fy - 4; y < d.fy; y++) {
    const x = wrapX(d.x + d.side * k), i = y * WW + x;
    if (on) { if (tiles[i] === AIR) tiles[i] = ES_BARREIRA; } else if (tiles[i] === ES_BARREIRA) tiles[i] = AIR;
    markDirty(x, y);
  }
  if (on) for (const d of B.doors) burst((d.x + 0.5) * T, (d.fy - 2) * T, 16, '#14101e', 60, -30, 0.8);
}
const noxInside = (tx, ty, m = 0) => inEsHall(tx, ty, m);

/* ---------- the fight ---------- */
function noxStart() {
  const B = esBoss, D = ET.nox;
  DROPS.nox = NOX_DROPS.filter(([id]) => ITEMS[id]);
  const side = Math.sign(wdx(B.cx - Math.floor((pl.x + pl.w / 2) / T))) || 1, x = (B.cx + side * 14) * T - D.w / 2, y = (B.fy - 2) * T - D.h;
  const e = spawnEnemy('nox', x, y, ES_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: NOX_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, facing: -side, ph: 0, cd: 2, hidden: false, fade: 0 });
  e.state = 'intro'; e.stateT = 2.2;
  noxBoss = e; bossFight = { e, nox: true }; noxEnd = null;
  Object.assign(noxFx, { arm: null, cone: null, ring: null, night: null, nightT: NOX.night, minT: 0, shrink: 0, inhale: 0 });
  noxWalls(true);
  for (const [i] of [...esTorches]) if (noxInside(i % WW, (i / WW) | 0, 0)) esTorches.set(i, Math.min(esTorches.get(i), ES_TORCH_HALL_T));
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'Nox'; bn.lastChild.textContent = 'Aquele Que Apaga'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('Nox', 'Aquele Que Apaga');
  sfx.noxEntra(); shake(2);
}
function noxDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
function noxEndFight(won) {
  const e = noxBoss; noxBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) if (m.esMinion && !m.dead) { burst(m.x + m.w / 2, m.y + m.h / 2, 6, '#0a0a12', 50, -30, 0.4); noxDrop(m); }
  noxFx.arm = noxFx.cone = noxFx.ring = noxFx.night = null;
  noxWalls(false);
  noxFleeLand();
  if (!won) {
    if (e) noxDrop(e);
    for (const [x, y] of noxPyreTiles()) if (tileAt(x, y) === ES_PIRA) { const s = noxLumeSpot(x, y); if (s) noxLumeLand(s[0], s[1]); }   // the wisps burning in them come back
    noxPyresSet(false); return;
  }
  noxState.dead = true; noxState.kills++; noxPyreArt();
  // the first time: one of the layer's bases too (35%)
  const x = e ? e.x + e.w / 2 : esBoss.cx * T, y = esBoss.fy * T - 20;
  const bases = ['lamina_vidronegro', 'manto_breu', 'escudo_acendedor'].filter(id => ITEMS[id]);
  if (noxState.kills === 1 && bases.length && Math.random() < 0.35) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  noxEnd = { t: 0, lit: 0 };   // the pyres come on by themselves, one by one (the update below)
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.nox) return noxEndFight(won); return _eb(won); }; }
// he does not die at once: pulled into the floor (2 s), then the real death (drops, xp)
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'nox' && !e.dead) {
    if (e.state !== 'dying') { e.hp = 1; e.state = 'dying'; e.stateT = 2.2; e.hidden = false; noxFx.arm = noxFx.cone = noxFx.ring = noxFx.night = null; sfx.noxMorre(); return; }
    if (e.stateT > 0) { e.hp = 1; return; }
  }
  return _k(e);
}; }
// the light on him decides: in the dark the blade goes through smoke
const noxLight = e => esLightAtPx(e.x + e.w / 2, e.y + e.h * 0.45);
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead && e.type === 'nox') {
    if (e.hidden || e.state === 'intro' || e.state === 'dying') return;
    if (noxLight(e) < 0.5) { for (let k = 0; k < 6; k++) parts.push({ x: e.x + e.w / 2 + rnd(-8, 8), y: e.y + rnd(10, e.h - 10), vx: rnd(-20, 20), vy: rnd(-20, 10), g: 0, life: 0.6, max: 0.6, col: '#0a0a12', size: 1, smoke: true }); sfx.noxOco(); return; }
  }
  return _hit(e, dir, mult, melee);
}; }
// the game lights every boss a little (07): not him
{ const _cl = computeLight; computeLight = function (cx, cy) {
  const e = noxBoss; if (!e || e.dead) return _cl(cx, cy);
  e.boss = false; try { return _cl(cx, cy); } finally { e.boss = true; }
}; }

/* ---------- his mind ---------- */
const noxPcx = () => pl.x + pl.w / 2;
function noxSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; }
// the lit pyre (or torch) nearest the hero, inside the hall
function noxTargetLight() {
  const px = Math.floor(noxPcx() / T), py = Math.floor((pl.y + pl.h / 2) / T); let best = null, bd = 1e9;
  const look = k => { const x = k % WW, y = (k / WW) | 0; if (!noxInside(x, y, 0)) return; const d = Math.hypot(wdx(x - px), y - py); if (d < bd) { bd = d; best = [x, y]; } };
  for (const k of esLit) look(k); for (const k of esTorches.keys()) look(k);
  return best;
}
AI.nox = function (e, dt) {
  const B = esBoss, W = WW * T, d0 = e.x - pl.x; if (Math.abs(d0) > W / 2) e.x -= Math.sign(d0) * W;
  e.stateT -= dt; e.cd -= dt; e.vx = e.vy = 0;
  const ecx = e.x + e.w / 2, floorY = B.fy * T, L = noxLight(e), x0 = B.x0 * T, x1 = (B.x0 + B.w) * T;
  const homeY = floorY - e.h - 4 + Math.sin(e.t * 1.3) * 3;
  // the light burns him: he shrinks and backs off from the brightest flame
  const burning = !e.hidden && e.state !== 'dying' && L >= 0.6;
  noxFx.shrink = approach(noxFx.shrink, burning ? 1 : 0, dt * 2);
  if (burning) {
    e.burnAcc = (e.burnAcc || 0) + NOX.burn * e.maxHp * dt; if (e.burnAcc >= 1) { const d = Math.floor(e.burnAcc); e.burnAcc -= d; e.hp -= d; e.flash = 0.05; e.showHp = 2; if (e.hp <= 0) killEnemy(e); }
    if (Math.random() < dt * 20) parts.push({ x: ecx + rnd(-10, 10), y: e.y + rnd(6, e.h - 6), vx: rnd(-14, 14), vy: rnd(-40, -16), g: -10, life: 0.8, max: 0.8, col: Math.random() < 0.5 ? '#0a0a12' : '#2a2436', size: 1, smoke: true });
    if (Math.random() < dt * 1.5) sfx.esChia();
  }
  if (e.state === 'intro') { e.y = approach(e.y, homeY, 40 * dt); if (e.stateT <= 0) noxSet(e, 'drift', 1); return; }
  if (e.state === 'dying') {   // pale and thin, pulled down into the floor
    e.y += 22 * dt; e.fade = Math.min(1, (e.fade || 0) + dt / 2);
    if (e.stateT <= 0) { e.hp = 0; killEnemy(e); endBossFight(true); }
    return;
  }
  // the phases
  const f = e.hp / e.maxHp;
  if (e.ph === 0 && f <= NOX.p2) { e.ph = 1; noxSet(e, 'sink', 1); noxMinions(e); sfx.noxFase(); }
  else if (e.ph === 1 && f <= NOX.p3) { e.ph = 2; noxSet(e, 'apagar', 2.2); e.hidden = false; e.y = homeY; sfx.noxApagar(); for (const [x, y] of noxPyreTiles()) esSnuff(x, y); for (const [i] of [...esTorches]) if (noxInside(i % WW, (i / WW) | 0, 0)) esSnuff(i % WW, (i / WW) | 0); noxFx.nightT = 4; }
  // phase 2: the minions come back while he is under the floor
  if (e.ph === 1 && (noxFx.minT -= dt) <= 0 && enemies.filter(m => m.esMinion && !m.dead).length < 2) noxMinions(e);
  // phase 3: the night closes in every 12 s
  if (e.ph === 2 && e.state !== 'apagar') {
    if (noxFx.night) { noxFx.night.t += dt; if (noxFx.night.t >= 2) { const safe = esLightAtPx(noxPcx(), pl.y + pl.h / 2) >= 0.6; if (!safe && !pl.dead) { const inv = pl.invuln; pl.invuln = 0; hurtPlayer(Math.round(e.dmg * 1.6), ecx, e, true); } sfx.noxNoite(); noxFx.night = null; } }
    else if ((noxFx.nightT -= dt) <= 0) { noxFx.night = { t: 0 }; noxFx.nightT = NOX.night; sfx.noxInspira(); }
  }
  switch (e.state) {
    case 'apagar': e.y = approach(e.y, homeY, 30 * dt); if (e.stateT <= 0) noxSet(e, 'drift', 1); return;
    case 'sink': e.y += 50 * dt; if (e.stateT <= 0) { e.hidden = true; e.y = floorY + 4; noxSet(e, 'under', 1.4); } return;
    case 'under':   // under the black mirror: then the pale ring under the hero
      e.x = approach(e.x, noxPcx() - e.w / 2, 120 * dt);
      if (e.stateT <= 0 && !pl.dead) { noxFx.ring = { x: noxPcx(), y: pl.onGround ? pl.y + pl.h : floorY, t: 0 }; noxSet(e, 'ring', 0.9); sfx.noxAnel(); }
      return;
    case 'ring':
      if (e.stateT <= 0) {
        const R = noxFx.ring; noxFx.ring = null; e.hidden = false; e.x = R.x - e.w / 2; e.y = R.y - e.h;
        if (!pl.dead && Math.abs(noxPcx() - R.x) < 20 && Math.abs(pl.y + pl.h - R.y) < 26) hurtPlayer(e.dmg, R.x, e, false);
        burst(R.x, R.y, 20, '#05060a', 90, -60, 0.8); shake(4); sfx.noxSobe();
        noxSet(e, 'exposed', 2.6);
      }
      return;
    case 'exposed': e.y = approach(e.y, homeY, 40 * dt); if (e.stateT <= 0) { if (e.ph === 1) noxSet(e, 'sink', 1); else noxSet(e, 'drift', 0.6); } return;
    case 'arm': {   // the long arm: its pale edge runs along the floor, then it sweeps
      const A = noxFx.arm; if (!A) { noxSet(e, 'drift', 0.5); return; }
      A.t += dt;
      if (A.t >= 0.8 && !A.swept) {
        A.swept = true; sfx.noxBraco(); shake(2);
        const lo = Math.min(A.x0, A.x1), hi = Math.max(A.x0, A.x1);
        if (!pl.dead && pl.onGround && Math.abs(pl.y + pl.h - floorY) < 8 && noxPcx() > lo && noxPcx() < hi) hurtPlayer(e.dmg, A.x0, e, false);
      }
      if (A.t >= 1.2) { noxFx.arm = null; e.cd = e.ph === 2 ? 1.4 : 2.2; noxSet(e, 'drift', 0.4); }
      return;
    }
    case 'inhale': {   // the breath drawn in: every flame in the hall leans toward him
      noxFx.inhale = clamp(1 - e.stateT / 1, 0, 1);
      if (e.stateT <= 0) {
        noxFx.inhale = 0;
        const C = noxFx.cone; noxFx.cone = null; if (!C) { noxSet(e, 'drift', 0.5); return; }
        sfx.noxSopro(); noxFx.blow = { ...C, t: 0 };
        // everything lit in the cone goes out; the hero in it gets hurt
        const inCone = (wx, wy) => { const dx = wx - C.x, dy = wy - C.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); let da = Math.abs(a - C.a); if (da > Math.PI) da = Math.PI * 2 - da; return d < C.r && da < 0.5; };
        for (const k of [...esLit, ...esTorches.keys()]) { const x = k % WW, y = (k / WW) | 0; if (noxInside(x, y, 1) && inCone((x + 0.5) * T, (y + 0.5) * T)) esSnuff(x, y); }
        if (!pl.dead && inCone(noxPcx(), pl.y + pl.h / 2)) hurtPlayer(Math.round(e.dmg * 0.8), C.x, e, true);
        e.cd = 2; noxSet(e, 'drift', 0.6);
      }
      return;
    }
  }
  // drifting: toward the lit pyre nearest the hero (to blow it out from outside its circle), else after the hero
  noxSet(e, 'drift', 1);
  const T0 = noxTargetLight();
  let tx = noxPcx();
  if (T0) { const lx = (T0[0] + 0.5) * T, side = Math.sign(ecx - lx) || 1; tx = lx + side * 13 * T; }
  tx = clamp(tx, x0 + e.w, x1 - e.w);
  // never into a strong circle: if the next step is brighter than 0.6, he waits
  const step = clamp(tx - ecx, -55 * dt, 55 * dt), ahead = esLightAtPx(ecx + Math.sign(step) * 24, e.y + e.h * 0.45);
  if (!(ahead >= 0.6 && Math.abs(step) > 0)) e.x += step;
  if (burning) { const away = T0 ? Math.sign(ecx - (T0[0] + 0.5) * T) || 1 : 1; e.x = clamp(e.x + away * 70 * dt, x0, x1 - e.w); }
  e.y = approach(e.y, homeY, 40 * dt);
  e.facing = Math.sign(noxPcx() - ecx) || e.facing;
  if (e.cd > 0 || pl.dead) return;
  // an attack: the breath if a light is in reach, else the arm along the floor (in phase 2 he goes under instead)
  if (e.ph === 1) { noxSet(e, 'sink', 1); return; }
  if (T0) {
    const lx = (T0[0] + 0.5) * T, ly = (T0[1] + 0.5) * T, hx = ecx, hy = e.y + 12, d = Math.hypot(lx - hx, ly - hy);
    if (d < 17 * T) { noxFx.cone = { x: hx, y: hy, a: Math.atan2(ly - hy, lx - hx), r: 17 * T }; noxSet(e, 'inhale', 1); sfx.noxInspira(); return; }
  }
  const dir = Math.sign(noxPcx() - ecx) || e.facing;
  noxFx.arm = { x0: ecx, x1: clamp(ecx + dir * 30 * T, x0, x1), y: floorY, t: 0, swept: false };
  noxSet(e, 'arm', 1.2); sfx.noxRonco();
};
let noxSpawning = false;   // the minions are born inside the hall (226 lets them)
function noxMinions(e) {
  const B = esBoss; noxFx.minT = 25;
  const make = (type, x, y) => { noxSpawning = true; let m; try { m = spawnEnemy(type, x, y, ES_ZONE0 + 3); } finally { noxSpawning = false; } if (!m || m.dead) return; m.esMinion = true; const lvl = NOX_L - 1, D = ET[type], k = 1 + 0.3 * (lvl - 1); Object.assign(m, { lvl, hp: Math.round(D.hp * k), maxHp: Math.round(D.hp * k), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: 1, gold: 0 }); burst(x + m.w / 2, y + m.h / 2, 10, '#0a0a12', 50, -30, 0.6); };
  for (const s of [-1, 1]) make('apagaluz', (B.cx + s * (B.w / 2 - 3)) * T, (B.fy - 3) * T);
  esSwarming = true; try { for (let k = 0; k < 4; k++) make('traca', (B.cx + rnd(-20, 20)) * T, (B.top + 6) * T); } finally { esSwarming = false; }
}

/* ---------- the ending: the pyres come on one by one, bottom to top ---------- */
HOOK.update.push(dt => {
  if (!ESCURO || !esBoss || !pl) return;
  if (noxEnd) {
    noxEnd.t += dt;
    const order = noxPyreTiles().map((p, i) => [p, i]).sort((a, b) => b[0][1] - a[0][1]);
    while (noxEnd.t > 2 + noxEnd.lit * 0.6 && noxEnd.lit < order.length) { const [[x, y]] = order[noxEnd.lit]; setTile(x, y, ES_PIRA); diffs.set(y * WW + x, ES_PIRA); sfx.noxPira(noxEnd.lit); burst((x + 0.5) * T, y * T, 24, '#ffc060', 90, -80, 0.8, 1, true); noxEnd.lit++; }
    if (noxEnd.lit >= order.length && noxEnd.t > 2 + order.length * 0.6 + 0.8) { showBanner('A Escuridão recua', 'a luz chegou ao fundo'); sfx.noxFim(); noxEnd = null; saveGame(); }
  }
  if (state !== 'play') return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (!noxState.dead && !bossFight && !pl.dead && noxInside(ptx, pty, 0) && Math.abs(wdx(ptx - esBoss.cx)) < esBoss.w / 2 - 2) noxStart();
  const e = noxBoss;
  if (e && bossFight && bossFight.nox && !pl.dead && !noxInside(ptx, pty, 1)) { endBossFight(false); return; }
  if (noxFx.blow) { noxFx.blow.t += dt; if (noxFx.blow.t > 0.4) noxFx.blow = null; }
  if (noxFx.ring) noxFx.ring.t += dt;
  // the fleeing wisps: a cold trail behind them (drawn below), and they settle when the flight ends
  for (let i = noxFlee.length - 1; i >= 0; i--) {
    const f = noxFlee[i]; f.t += dt;
    if (f.t >= f.dur) { noxFlee.splice(i, 1); noxLumeLand(f.tx, f.ty); continue; }
    for (const q of f.trail) q[2] += dt;
    const [x, y] = noxFleeAt(f); f.trail.push([x + rnd(-1, 1), y + rnd(-1, 1), 0]);
    while (f.trail.length && f.trail[0][2] > 0.45) f.trail.shift();
  }
});
// where a fleeing wisp is: an arc up and over, easing in and out
function noxFleeAt(f) {
  const k = clamp(f.t / f.dur, 0, 1), e = k * k * (3 - 2 * k), u = 1 - e, mx = (f.x0 + f.x1) / 2, my = Math.min(f.y0, f.y1) - 30 - Math.abs(f.x1 - f.x0) * 0.15;
  return [u * u * f.x0 + 2 * u * e * mx + e * e * f.x1, u * u * f.y0 + 2 * u * e * my + e * e * f.y1 + Math.sin(f.t * 14) * 1.5];
}

/* ---------- drawing: in the light a tall smoke figure (DRAW_E, so the dark hides it); over the dark the silhouette
   blacker than black, its pale flickering rim and the two star eyes (drawTop) ---------- */
// is (u, v) inside him? u across (-1..1 of the half width), v down (0 the crown, 1 where the smoke ends)
function noxInside2(u, v, t) {
  if (v < 0 || v > 1) return false;
  const hd = (u / 0.32) ** 2 + ((v - 0.1) / 0.1) ** 2; if (hd < 1) return true;   // the head
  if (v < 0.19) return false;
  const w = v < 0.26 ? 0.3 + (v - 0.19) * 3.2 : 0.52 - (v - 0.26) * 0.48 + Math.sin(v * 24 - t * 2) * 0.05 * v;   // shoulders, then the smoke tapering
  return Math.abs(u) < w && !(v > 0.82 && Math.abs(Math.sin(u * 9 + v * 30 + t * 3)) > 0.7);
}
const noxScale = e => (1 - noxFx.shrink * 0.28) * (e.state === 'dying' ? 1 - (e.fade || 0) * 0.5 : 1);
function noxArms(e, t) {   // shoulder -> hand for both arms, in (u, v)
  const A = noxFx.arm, raise = e.state === 'inhale' ? 0.2 : 0;
  if (A && e.state === 'arm') { const k = clamp(A.t / 0.8, 0, 1); return [[0.42, 0.24, 0.8 + k * 0.4, 0.98], [-0.42, 0.24, -0.7, 0.8]]; }
  return [[0.44, 0.24, 0.72 + Math.sin(t) * 0.05, 0.78 - raise], [-0.44, 0.24, -0.72 - Math.sin(t + 1) * 0.05, 0.8 - raise]];
}
DRAW_E.nox = (e, fx, fy, fl) => {
  if (e.hidden) return;
  const s = noxScale(e), Wd = 40 * s, H = 70 * s, x0 = fx - Wd / 2, y0 = fy - H, t = e.t;
  for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
    const u = (x / Wd) * 2 - 1, v = y / H; if (!noxInside2(u, v, t)) continue;
    const n = Math.sin(x * 0.7 + y * 0.31 + t * 0.6) + Math.sin(x * 0.23 - y * 0.6 - t * 0.4);
    lc.fillStyle = fl ? '#e6ecf4' : n > 1 ? '#5a5466' : n > 0 ? '#3e3a48' : n > -1 ? '#2a2632' : '#1c1a22';
    lc.fillRect(Math.round(x0 + x), Math.round(y0 + y), 1, 1);
  }
  lc.fillStyle = '#2a2632';
  for (const [su, sv, hu, hv] of noxArms(e, t)) for (let k = 0; k <= 24; k++) { const q = k / 24, u = su + (hu - su) * q, v = sv + (hv - sv) * q; lc.fillRect(Math.round(fx + u * Wd / 2), Math.round(y0 + v * H), 2, 1); }
};
EYES_E.nox = () => { };
WARN_E.nox = e => e.state === 'arm' || e.state === 'inhale';
HOOK.drawTop.push((cx, cy) => {
  // the arm's pale edge running along the floor, then the black arm
  const A = noxFx.arm;
  if (A) {
    const k = clamp(A.t / 0.8, 0, 1), lo = Math.min(A.x0, A.x1), hi = Math.max(A.x0, A.x1), y = Math.round(A.y - cy) - 1;
    for (let x = lo; x <= lo + (hi - lo) * (A.x1 > A.x0 ? k : 1); x++) { if (A.x1 < A.x0 && x < hi - (hi - lo) * k) continue; lc.globalAlpha = 0.8; lc.fillStyle = (Math.floor(x) + Math.floor(gameTime * 24)) % 4 ? '#a4aabb' : '#e6ecf4'; lc.fillRect(Math.round(x - cx), y, 1, 1); }
    if (A.swept && A.t < 1.2) { const a = 1 - (A.t - 0.8) / 0.4; lc.globalAlpha = a; lc.fillStyle = '#020204'; lc.fillRect(Math.round(lo - cx), y - 4, Math.round(hi - lo), 4); lc.fillStyle = '#a4aabb'; lc.fillRect(Math.round(lo - cx), y - 5, Math.round(hi - lo), 1); }
  }
  // the ring under the hero
  const R = noxFx.ring;
  if (R) { const k = clamp(R.t / 0.9, 0, 1), r = 18 - k * 4; lc.globalAlpha = 0.5 + 0.5 * k; lc.fillStyle = '#e6ecf4'; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; lc.fillRect(Math.round(R.x - cx + Math.cos(a) * r), Math.round(R.y - cy + Math.sin(a) * r * 0.3), 1, 1); } }
  // the breath: a cone of dark air
  const Bw = noxFx.blow;
  if (Bw) { const k = Bw.t / 0.4; lc.globalAlpha = 0.5 * (1 - k); lc.fillStyle = '#0a0a12'; for (let n = 0; n < 120; n++) { const d = Math.random() * Bw.r * (0.3 + k * 0.7), a = Bw.a + (Math.random() - 0.5) * 1; lc.fillRect(Math.round(Bw.x + Math.cos(a) * d - cx), Math.round(Bw.y + Math.sin(a) * d - cy), 2, 2); } }
  lc.globalAlpha = 1;
  for (const f of noxFlee) {
    for (const [qx, qy, a] of f.trail) { lc.globalAlpha = 1 - a / 0.45; lc.fillStyle = a < 0.15 ? '#e6f0ff' : a < 0.3 ? '#9ab8ec' : '#3a6ac0'; lc.fillRect(Math.round(qx - cx), Math.round(qy - cy), 1, 1); }
    const [x, y] = noxFleeAt(f), X = Math.round(x - cx), Y = Math.round(y - cy);
    if (ESART.ES_GLOW.l) { lc.globalAlpha = 0.5 + Math.sin(gameTime * 20) * 0.1; lc.drawImage(ESART.ES_GLOW.l, X - 14, Y - 14); }
    lc.globalAlpha = 1; lc.fillStyle = '#7aa2dc'; lc.fillRect(X - 1, Y - 1, 3, 3); lc.fillStyle = '#e6f0ff'; lc.fillRect(X, Y - 1, 1, 2);
  }
  const e = noxBoss;
  if (e && !e.dead && !e.hidden) {
    const L = noxLight(e), dark = 1 - clamp((L - 0.3) / 0.3, 0, 1), s = noxScale(e), Wd = 40 * s, H = 70 * s, fx = Math.round(e.x + e.w / 2 - cx), fy = Math.round(e.y + e.h - cy), x0 = fx - Wd / 2, y0 = fy - H, t = e.t;
    const fade = e.state === 'dying' ? e.fade : 0;
    // blacker than black
    if (dark > 0.02) { lc.globalAlpha = dark * (1 - fade); lc.fillStyle = '#000000'; for (let y = 0; y < H; y++) { let run = -1; for (let x = 0; x <= Wd; x++) { const inn = x < Wd && noxInside2((x / Wd) * 2 - 1, y / H, t); if (inn && run < 0) run = x; else if (!inn && run >= 0) { lc.fillRect(Math.round(x0 + run), Math.round(y0 + y), x - run, 1); run = -1; } } } }
    // the pale rim, flickering; pale and thin as he dies
    lc.globalAlpha = 0.55 + 0.25 * Math.sin(gameTime * 11) + fade * 0.4; lc.fillStyle = fade > 0 ? '#e6ecf4' : '#a4aabb';
    for (let y = 0; y < H; y += 1) for (let x = 0; x < Wd; x++) { const u = (x / Wd) * 2 - 1, v = y / H; if (!noxInside2(u, v, t)) continue; const edge = !noxInside2(((x - 1) / Wd) * 2 - 1, v, t) || !noxInside2(((x + 1) / Wd) * 2 - 1, v, t) || !noxInside2(u, (y - 1) / H, t); if (edge && hash2(x, y + Math.floor(gameTime * 12), 22701) < 0.55) lc.fillRect(Math.round(x0 + x), Math.round(y0 + y), 1, 1); }
    for (const [su, sv, hu, hv] of noxArms(e, t)) for (let k = 0; k <= 24; k += 2) { const q = k / 24; if (hash2(k, Math.floor(gameTime * 10), 22702) < 0.6) lc.fillRect(Math.round(fx + (su + (hu - su) * q) * Wd / 2), Math.round(y0 + (sv + (hv - sv) * q) * H), 1, 1); }
    // two eyes like cold stars
    const ex = fx + e.facing * 3 * s, ey = Math.round(y0 + H * 0.1);
    lc.globalAlpha = 1 - fade * 0.8; lc.fillStyle = '#e6f0ff';
    for (const ox of [-4 * s, 4 * s]) { const X = Math.round(ex + ox); lc.fillRect(X, ey, 1, 1); lc.globalAlpha = 0.5 * (1 - fade); lc.fillRect(X - 1, ey, 3, 1); lc.fillRect(X, ey - 1, 1, 3); lc.globalAlpha = 1 - fade * 0.8; }
  }
  // the black mirror floor while he is under it
  if (e && e.hidden && esBoss) { const y = Math.round(esBoss.fy * T - cy) - 1, X0 = Math.round(esBoss.x0 * T - cx); lc.globalAlpha = 0.85; for (let x = 0; x < esBoss.w * T; x++) { lc.fillStyle = (x + Math.floor(gameTime * 30)) % 9 === 0 ? '#2c344c' : '#020204'; lc.fillRect(X0 + x, y, 1, 2); } }
  // the night closing in: the edges of the screen darken toward the middle for 2 s
  if (noxFx.night) {
    const k = clamp(noxFx.night.t / 2, 0, 1), W = lc.canvas.width, H2 = lc.canvas.height, X = pl.x + pl.w / 2 - cx, Y = pl.y + pl.h / 2 - cy;
    const g = lc.createRadialGradient(X, Y, Math.max(8, 160 * (1 - k)), X, Y, Math.max(30, 260 * (1 - k * 0.8)));
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${(0.5 + 0.5 * k).toFixed(3)})`);
    lc.globalAlpha = 1; lc.fillStyle = g; lc.fillRect(0, 0, W, H2);
  }
  lc.globalAlpha = 1;
});
// the breath drawn in: every flame in the hall leans toward him (sparks pulled across)
HOOK.update.push(dt => {
  const e = noxBoss; if (!e || !noxFx.inhale) return;
  for (const k of esLit) { if (Math.random() > dt * 10) continue; const x = (k % WW + 0.5) * T, y = ((k / WW) | 0) * T, dx = e.x + e.w / 2 - x, dy = e.y + 14 - y, d = Math.hypot(dx, dy) || 1; parts.push({ x, y, vx: dx / d * 90, vy: dy / d * 90, g: 0, life: 0.7, max: 0.7, col: '#9ab8ec', size: 1, glow: true }); }
});

/* ---------- sounds: the deep hum, the hollow blow, the breath, the pyres coming on ---------- */
Object.assign(sfx, {
  noxEntra() { tone(41, 2.4, 'sine', 0.08, -3); noise(2, 0.05, 160, 'lowpass'); tone(82, 1.6, 'sine', 0.025, -6, 0.3); },
  noxOco() { tone(150, 0.25, 'sine', 0.03, -60); noise(0.2, 0.03, 500, 'lowpass'); },
  noxRonco() { tone(46, 1, 'sawtooth', 0.04, -8); noise(0.9, 0.05, 200, 'lowpass'); },
  noxBraco() { noise(0.5, 0.12, 400, 'lowpass'); noise(0.3, 0.06, 1400, 'bandpass', 0.05); tone(60, 0.4, 'square', 0.05, -20); },
  noxInspira() { noise(1, 0.06, 900, 'bandpass', 0, 0.6); tone(70, 1, 'sine', 0.03, 30); },
  noxSopro() { noise(0.6, 0.14, 700, 'lowpass'); noise(0.5, 0.06, 2400, 'bandpass', 0.05, 1); },
  noxAnel() { tone(880, 0.9, 'sine', 0.02, -300); noise(0.8, 0.03, 300, 'lowpass'); },
  noxSobe() { noise(0.5, 0.15, 260, 'lowpass'); tone(55, 0.6, 'sawtooth', 0.06, -20); },
  noxFase() { tone(36, 2, 'sine', 0.08, -4); noise(1.6, 0.06, 120, 'lowpass'); },
  noxApagar() { noise(1.2, 0.12, 600, 'lowpass'); tone(30, 2.2, 'sine', 0.09, 0); },
  noxNoite() { noise(0.6, 0.1, 300, 'lowpass'); tone(44, 0.8, 'square', 0.05, -10); },
  noxMorre() { tone(70, 2.2, 'sine', 0.06, -30); noise(2.2, 0.05, 220, 'lowpass'); },
  noxPira(k) { const f = 98 * Math.pow(1.122, k); tone(f, 2.2, 'sine', 0.06, 0); tone(f * 1.5, 1.8, 'triangle', 0.02, 0, 0.05); noise(0.6, 0.08, 1400, 'bandpass', 0, 0.7); },
  noxFim() { [196, 247, 294, 392].forEach((f, i) => tone(f, 2.6, 'sine', 0.04, 0, i * 0.18)); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.nox = { dead: noxState.dead, kills: noxState.kills }; return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  noxBoss = null; noxEnd = null; noxFlee.length = 0; Object.assign(noxFx, { arm: null, cone: null, ring: null, night: null, blow: null, shrink: 0, inhale: 0 });
  noxState.dead = !!(sv && sv.nox && sv.nox.dead); noxState.kills = (sv && sv.nox && sv.nox.kills) | 0;   // before the build: the dressing reads it
  noxPyreArt();
  const r = _nw(sd, sv);
  // the pyres as the fight left them are not kept: cold, or lit for good after the victory (a wisp left burning in one
  // when the game was closed mid-fight comes back beside it)
  if (esBoss) for (const [x, y] of noxPyreTiles()) {
    const i = y * WW + x, lit = tiles[i] === ES_PIRA;
    tiles[i] = noxState.dead ? ES_PIRA : ES_PIRA_FRIA; if (noxState.dead) diffs.set(i, ES_PIRA); else diffs.delete(i);
    if (lit && !noxState.dead) { const s = noxLumeSpot(x, y); if (s && tiles[s[1] * WW + s[0]] === AIR) { tiles[s[1] * WW + s[0]] = ES_LUME; diffs.set(s[1] * WW + s[0], ES_LUME); } }
  }
  if (typeof esScan === 'function') esScan();
  return r;
}; }
