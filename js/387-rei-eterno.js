'use strict';

/* ================= O Rei Eterno: o chefe da Necrópole =================
   O Salão do Relicário (docs/camadas/14-necropole.md, seção 7). O 385 reserva na Cripta Real uma caixa maciça de
   cx - 63 a cx + 62 e de top - 3 a fy + 3, cava os dois corredores até as salas reais de fora e chama ncDress; este
   arquivo escreve o Salão dentro dela: o oco de 120 x 44 com a abóbada arredondada, o chão de mármore real (protegido)
   com oito lajes de cova, as duas portas, quatro beirais de laje (dois baixos, dois altos) com as escadas de ferro,
   colunas, lanternas de alma e urnas. Não há trono: o rei não senta.
   No meio do teto pende o Coração-Relicário, preso por três correntes de alma a três âncoras (ncAncora, "monstros" sem
   corpo, que tomam qualquer golpe). Enquanto uma corrente segura, o rei não sente nada: o golpe resvala (faísca verde e
   "tink"). Quebradas as três, o coração cai no chão e o rei ajoelha: fica exposto por 10 s ou até perder um terço da
   vida; depois ergue o coração e refaz as âncoras em outros lugares. Três ciclos (as três fases).
   Os golpes, todos avisados:
     - Lança de Alma: ele ergue a mão de trás; uma linha fina vai da mão até o herói (segue 0,7 s e trava 0,3 s) e a
       lança voa por ela;
     - Mão da Cova: círculos claros no chão (um debaixo do herói) por 1 s; depois mãos de osso saem e prendem os pés;
     - Foice: de perto, ele ergue a foice atrás da cabeça (0,75 s; o arco do golpe aparece no chão) e varre rente ao
       chão na frente; pula-se por cima;
     - Levantar os Mortos: ergue o braço 1,2 s; as lajes de cova mais perto do herói racham (pó e luz verde) e
       legionários sobem delas (no máximo três de uma vez, sem loot);
     - na fase 3, as Paredes de Osso: a linha verde acende no chão 1,2 s e duas paredes de osso fecham devagar das
       pontas do Salão até perto do meio (empurram, não machucam), seguram 5 s e voltam.
   Entrar fundo no Salão acorda o rei: o Rastrilho de Ossos (NC_BARREIRA) fecha as duas portas e a câmera se afasta um
   passo (S - 1), para caber o coração, as correntes e as âncoras. Sair, usar portal ou
   morrer reinicia (o rei some, as âncoras e o coração voltam, as portas abrem). Na vitória: o Filactério do Rei Eterno
   (lendário: uma vez a cada 3 min, a morte não leva; volta com 40% da vida) e uma das três bases da camada. A morte fica
   salva (reiEterno.dead); o 363 abre o caminho para baixo.
   Carrega depois do 385 e do 287, antes do 49 (que escala ET). */

const NCQ_L = layerBossLvl('necropole');
const NCQ = { hp: Math.round(400 * (1 + 0.3 * (NCQ_L - 1))), dmg: Math.round(11 * (1 + 0.2 * (NCQ_L - 1))), xp: 640, anc: Math.round(26 * (1 + 0.3 * (NCQ_L - 1))) };
const ncState = { dead: false };
ET.reiEterno = { name: 'O Rei Eterno', w: 16, h: 46, hp: NCQ.hp, dmg: NCQ.dmg, xp: NCQ.xp, kb: 0, fly: true, phase: true, blood: '#b8f0d0', boss: true };
ET.ncAncora = { name: 'Âncora de Alma', w: 12, h: 12, hp: NCQ.anc, dmg: 0, xp: 0, kb: 0, fly: true, phase: true, blood: '#b8f0d0' };
const NCQ_DROPS = [['filacterio_eterno', 1], ['min_sepulcrita', 1, 6, 10], ['cinza_alma', 1, 3, 5], ['tinta_sentenca', 1, 2, 3], ['pocao', 1, 2, 4]];
const NCQ_BASES = ['alabarda_legiao', 'escudo_tampa', 'capuz_necromante'];
const ncqDrops = () => { DROPS.reiEterno = NCQ_DROPS.filter(([id]) => ITEMS[id]); DROPS.ncAncora = []; };

// o Salão em blocos relativos ao centro (cx) e ao chão (fy)
const NCQ_LEDGES = [[-50, -42, 7], [41, 49, 7], [-30, -23, 14], [22, 29, 14]];      // [x0, x1, altura]
const NCQ_LADDERS = [[-41, 8], [40, 8], [-22, 15], [21, 15]];                        // [x, altura]
const NCQ_COVAS = [-36, -28, -14, -5, 4, 13, 27, 35];
const NCQ_COLS = [-56, -34, 33, 55];
// onde as âncoras ficam: [x, altura do chão em que ficam, grupo]
const NCQ_SITES = [[-20, 0, 'f'], [19, 0, 'f'], [-46, 7, 'b'], [45, 7, 'b'], [-26, 14, 'a'], [25, 14, 'a'], [-8, 0, 'm'], [7, 0, 'm']];
const NCQ_HEART = 34;   // linhas abaixo do teto onde o coração pende (10 acima do chão: com a câmera afastada, cabe na tela)
const NCQ_BAR_MAX = 26; // até onde as paredes de osso fecham (blocos a partir de cada ponta)

/* ---------- a construção (o 385 chama ncDress logo depois de ncAfter) ---------- */
function ncDress() {
  const B = ncBoss; if (!B) return;
  B.dead = ncState.dead;
  const W1 = x => ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x4e1e7);
  const put = (x, y, t) => { const i = I(x, y); tiles[i] = t; ncKeep.add(i); };
  // o oco: 120 x 44, a abóbada arredondada nos cantos; nichos no alto, mármore embaixo
  for (let y = B.top; y < B.fy; y++) for (let x = B.cx - 60; x <= B.cx + 59; x++) {
    const i = I(x, y), u = (x - B.cx + 0.5) / 60, v = (B.fy - y) / B.h;
    if (v > 0.8 && Math.abs(u) > 0.92 - (1 - v) * 1.6) continue;
    tiles[i] = AIR; walls[i] = v > 0.3 ? WNC_NICHOS : WNC_MARMORE; if (agua.length) agua[i] = 0; ncKeep.add(i);
  }
  // o teto de mármore por dentro, a borda da abóbada
  for (let x = B.cx - 62; x <= B.cx + 61; x++) for (let y = B.top - 2; y < B.fy; y++) { const i = I(x, y); if (tiles[i] !== AIR && tiles[i + WW] === AIR) tiles[i] = NC_MARMORE; }
  // o chão: mármore real, com as lajes de cova; protegido
  for (let x = B.cx - 63; x <= B.cx + 62; x++) { put(x, B.fy, NC_REAL); const j = I(x, B.fy + 1); tiles[j] = NC_MARMORE; }
  B.covas = [];
  for (const dx of NCQ_COVAS) { put(B.cx + dx, B.fy, NC_COVA); B.covas.push(dx); }
  // as portas: 5 de altura, cruzando a casca (o corredor do 385 começa logo depois)
  for (const D of B.doors) for (let k = 0; k < 4; k++) { const x = D.side < 0 ? B.cx - 60 - k : B.cx + 59 + k; for (let y = B.fy - 5; y < B.fy; y++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WNC_MARMORE; ncKeep.add(i); } }
  // os beirais de laje e as escadas de ferro
  for (const [a, b, h] of NCQ_LEDGES) for (let x = a; x <= b; x++) put(B.cx + x, B.fy - h, NC_LAJE);
  for (const [x, h] of NCQ_LADDERS) for (let k = 1; k <= h; k++) put(B.cx + x, B.fy - k, NC_ESCADA);
  // as colunas do chão ao teto
  for (const dx of NCQ_COLS) { const x = B.cx + dx; for (let y = B.fy - 1; y >= B.top && tiles[I(x, y)] === AIR; y--) put(x, y, NC_COLUNA); }
  // as lanternas de alma no chão e penduradas, as urnas e os ossos
  for (const dx of [-58, -17, 16, 57]) if (tiles[I(B.cx + dx, B.fy - 1)] === AIR) put(B.cx + dx, B.fy - 1, NC_LANTERNA);
  for (const dx of [-46, -12, 12, 46]) { const x = B.cx + dx; let y = B.top; while (y < B.fy - 20 && tiles[I(x, y)] !== AIR) y++; if (tiles[I(x, y)] === AIR) { put(x, y, NC_CORRENTE); put(x, y + 1, NC_CORRENTE); put(x, y + 2, NC_LANTERNA_T); } }
  for (let k = 0; k < 10; k++) {
    const dx = -57 + ((R() * 114) | 0), x = B.cx + dx;
    if (NCQ_LADDERS.some(([l]) => Math.abs(l - dx) < 2) || NCQ_COLS.includes(dx) || NCQ_SITES.some(([s, h]) => !h && Math.abs(s - dx) < 2)) continue;
    if (tiles[I(x, B.fy - 1)] === AIR) put(x, B.fy - 1, R() < 0.5 ? NC_URNA : NC_OSSOS);
  }
}

/* ---------- onde está o herói, e as posições no volta do mundo ---------- */
const NCQ_WPX = () => WW * T;
// x do mundo levado para a mesma volta do herói
const ncLap = x => { const W = NCQ_WPX(); let d = x - pl.x; d = (((d + W / 2) % W) + W) % W - W / 2; return pl.x + d; };
const ncCX = () => ncLap((ncBoss.cx + 0.5) * T);
const ncFY = () => ncBoss.fy * T;
const ncHeroRx = () => pl.x + pl.w / 2 - ncCX();
function ncHeroIn(m = 0) {
  const B = ncBoss; if (!B || pl.dead) return false;
  const tx = Math.floor((pl.x + pl.w / 2) / T), ty = Math.floor((pl.y + pl.h - 2) / T), i = wdx(tx - B.cx);
  return i >= -60 - m && i <= 59 + m && ty >= B.top - m && ty < B.fy + 1;
}

/* ---------- o Rastrilho de Ossos ---------- */
function ncSeal(on) {
  const B = ncBoss, I = (x, y) => y * WW + wrapX(x);
  for (const D of B.doors) for (let k = 1; k <= 2; k++) {
    const x = D.side < 0 ? B.cx - 60 - k : B.cx + 59 + k;
    for (let y = B.fy - 5; y < B.fy; y++) { const i = I(x, y); if (on ? tiles[i] === AIR : tiles[i] === NC_BARREIRA) { tiles[i] = on ? NC_BARREIRA : AIR; markDirty(wrapX(x), y); } }
  }
  if (on) sfx.ncReiRastrilho();
  mapVer++;
}

/* ---------- a luta ---------- */
let ncRei = null;
const ncq = { anc: [], circ: [], lancas: [], hands: [], bar: null, heartY: 0, heartV: 0, chainK: 1, aim: null, sweep: null, cracks: [] };
function ncqSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; }
const ncqHangY = () => (ncBoss.top + NCQ_HEART) * T;
function ncqSpawn(type, x, y) {
  ncSummonNow = true;
  try { return spawnEnemy(type, x, y, NC_ZONE0 + 3); } finally { ncSummonNow = false; }
}
function ncStart() {
  ncqDrops(); ncqClear();
  const D = ET.reiEterno;
  const e = ncqSpawn('reiEterno', ncCX() - D.w / 2, ncFY() - D.h);
  Object.assign(e, { boss: true, lvl: NCQ_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, rx: 0, cyc: 0, ph: 1, exposed: false, expT: 0, hpLock: D.hp, cd: 1.6, last: '', rep: 0, ergueCD: 6, barT: 10, eye: 0, shF: 0, facing: ncHeroRx() > 0 ? 1 : -1 });
  ncqSet(e, 'intro', 2);
  ncRei = e; bossFight = { e, nc: true };
  ncq.heartY = ncqHangY(); ncq.chainK = 0;
  ncqAnchors(0);
  ncSeal(true);
  ncqZoom(true);
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Rei Eterno'; bn.lastChild.textContent = 'o rei não deitou'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Rei Eterno', 'o rei não deitou');
  sfx.ncReiDesperta(); shake(3);
}
// três âncoras por ciclo, cada uma num lugar novo
function ncqAnchors(cyc) {
  for (const a of ncq.anc) { a.dead = true; a.despawn = true; } ncq.anc.length = 0;
  const pick = g => { const L = NCQ_SITES.filter(s => s[2] === g); return L[(Math.random() * L.length) | 0]; };
  const old = new Set(ncq.lastSites || []);
  let sites = null;
  for (let n = 0; n < 6; n++) {
    sites = cyc === 0 ? [pick('f'), pick('b'), pick('a')] : cyc === 1 ? [pick('m'), pick('b'), pick('a')] : [pick('f'), pick('m'), pick('a')];
    if (!sites.some(s => old.has(s))) break;
  }
  ncq.lastSites = sites;
  const hp = NCQ.anc;
  for (const s of sites) {
    const a = ncqSpawn('ncAncora', 0, 0);
    Object.assign(a, { boss: true, lvl: NCQ_L, hp, maxHp: hp, dmg: 0, xp: 0, gold: 0, site: s, ncMinion: true, state: 'idle', facing: 1, born: 0 });
    ncqAncPos(a); ncq.anc.push(a);
  }
}
function ncqAncPos(a) { a.x = ncCX() + a.site[0] * T + T / 2 - a.w / 2; a.y = ncFY() - a.site[1] * T - a.h; a.vx = a.vy = 0; }
function ncqClear() {
  ncq.circ.length = 0; ncq.lancas.length = 0; ncq.hands.length = 0; ncq.cracks.length = 0; ncq.bar = null; ncq.aim = null; ncq.sweep = null;
}
function ncEnd(won) {
  const e = ncRei; ncRei = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies) if (m.ncBossMinion && !m.dead) { ncSparks(m.x + m.w / 2, m.y + m.h / 2, 8, NC_ALMAC, 40, -30, 0.8); m.dead = true; m.despawn = true; }
  for (const a of ncq.anc) { a.dead = true; a.despawn = true; } ncq.anc.length = 0;
  ncqClear(); if (ncBoss) ncSeal(false);
  ncqZoom(false);
  if (!won) { if (e) { e.dead = true; e.despawn = true; } ncq.heartY = ncBoss ? ncqHangY() : 0; ncq.chainK = 1; return; }
  const first = !ncState.dead;
  ncState.dead = true; if (ncBoss) ncBoss.dead = true;
  const x = e ? e.x + e.w / 2 : ncCX(), y = e ? e.y + e.h / 2 : ncFY() - 3 * T;
  for (let k = 0; k < 5; k++) burst(x - 12 + k * 6, y + 10, 14, '#d8ccb0', 120, 300, 1.1);
  burst(x, y - 8, 30, '#b8f0d0', 140, -30, 1.4, 1, true);
  if (first) { const bases = NCQ_BASES.filter(id => ITEMS[id]); if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T))); }
  sfx.ncReiMorte();
  showBanner('Vitória', 'o rei eterno enfim deita');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.nc) return ncEnd(won); return _eb(won); }; }

// o rei: protegido enquanto uma corrente segura; exposto, desce até o limite do ciclo
const ncqThr = e => Math.round(e.maxHp * (2 - e.cyc) / 3);
const ncqOpen = e => e.exposed && e.state !== 'intro' && e.state !== 'refaz' && e.state !== 'morrendo';
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'reiEterno' && !e.dead) {
    if (!ncqOpen(e)) {
      sfx.tink(); e.shF = 0.35; ncSparks(e.x + e.w / 2 + (pl.x < e.x ? -6 : 6), e.y + e.h * 0.45, 6, NC_ALMAC, 60, 0, 0.35); return;
    }
    const r = _hit(e, dir, mult, melee); e.vx = e.vy = 0; e.stun = 0;
    if (!e.dead && e.hp < ncqThr(e) && e.cyc < 2) e.hp = ncqThr(e);
    return r;
  }
  if (e && e.type === 'ncAncora' && !e.dead) {
    if (!ncRei || ncRei.state === 'intro' || e.born < 0.6) { sfx.tink(); return; }
    const r = _hit(e, dir, mult, melee); e.vx = e.vy = 0; e.stun = 0;
    ncSparks(e.x + e.w / 2, e.y + 2, 6, NC_ALMAC, 50, -20, 0.4); sfx.ncReiAncora();
    return r;
  }
  return _hit(e, dir, mult, melee);
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'ncAncora') {
    if (e.dead) return;
    e.dead = true; e.hp = 0;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    ncSparks(cx, cy, 18, NC_ALMAC, 90, -20, 0.9); ncDust(cx, e.y + e.h, 10, 40, -50, NC_OSSOC);
    sfx.ncReiCorrente(); shake(4); hitstop = Math.max(hitstop, 0.08);
    const R = ncRei; if (!R) return;
    if (!ncq.anc.some(a => !a.dead)) { R.exposed = true; R.expT = 10; ncqClear(); ncqSet(R, 'cai', 0.8); ncq.heartV = 0; sfx.ncReiCai(); }
    return;
  }
  if (e && e.type === 'reiEterno' && !e.ncFim) {
    // o golpe final: ele se desfaz devagar (o 10 chama endBossFight quando o killEnemy de verdade roda)
    if (!ncqOpen(e) || e.cyc < 2) { e.hp = Math.max(1, ncqOpen(e) ? ncqThr(e) : e.hpLock); return; }   // só cai no último ciclo, exposto
    e.hp = 0; if (e.state !== 'morrendo') { ncqClear(); ncqSet(e, 'morrendo', 2.6); sfx.ncReiUrro(0.8); }
    return;
  }
  return _k(e);
}; }
// nada do Salão quebra enquanto ele vive (a picareta faísca)
{ const _bt = breakTile; breakTile = function (tx, ty) { if (ncBoss && !ncState.dead && inNcHall(tx, ty, 3)) { sfx.tink(); return; } return _bt(tx, ty); }; }

/* ---------- o cérebro ---------- */
const NCQ_LANCA = 1, NCQ_MAO = 1, NCQ_FOICE = 0.75, NCQ_ERGUE = 1.2;
AI.ncAncora = (e, dt) => { e.born = (e.born || 0) + dt; ncqAncPos(e); };
AI.reiEterno = function (e, dt) {
  if (!ncBoss) { e.dead = true; return; }
  e.vx = e.vy = 0; e.stateT -= dt; e.shF = Math.max(0, e.shF - dt); e.cd -= dt; e.ergueCD -= dt;
  const hr = ncHeroRx(), lim = ncq.bar ? Math.max(-55, -60 + ncq.bar.w + 2) : -55, limR = ncq.bar ? Math.min(54, 59 - ncq.bar.w - 2) : 54;
  e.eye = approach(e.eye, e.state === 'morrendo' ? 0 : 1, dt * 1.2);
  // enquanto protegido, nada tira vida dele (fogo, veneno e espinhos inclusive)
  if (!e.exposed && e.state !== 'morrendo') e.hp = Math.max(e.hp, e.hpLock); else if (e.state !== 'morrendo') e.hpLock = e.hp;
  ncqBrain(e, dt, hr);
  e.rx = clamp(e.rx, lim * T, limR * T);
  e.x = ncCX() + e.rx - e.w / 2; e.y = ncFY() - e.h;
  // o coração: pende, cai, volta
  const hang = ncqHangY(), rest = ncFY() - 9;
  if (e.exposed && e.state !== 'refaz') { ncq.heartV += 700 * dt; ncq.heartY = Math.min(rest, ncq.heartY + ncq.heartV * dt); if (ncq.heartY >= rest && ncq.heartV > 120) { ncq.heartV = -ncq.heartV * 0.25; shake(3); sfx.ncReiCai(0.6); ncDust(ncCX(), rest + 9, 14, 50, -40, NC_OSSOC); } }
  else if (e.state === 'refaz') ncq.heartY = lerp(rest, hang, 1 - Math.max(0, e.stateT) / e.stateMax);
  else ncq.heartY = hang;
  if (e.state !== 'refaz' && e.state !== 'intro') ncq.chainK = approach(ncq.chainK, 1, dt * 1.5);
  ncqHazards(e, dt);
};
function ncqPick(e, list) {
  let tot = 0; for (const [, w] of list) tot += w;
  for (let n = 0; n < 4; n++) {
    let r = Math.random() * tot, k = list[0][0]; for (const [s, w] of list) { if (r < w) { k = s; break; } r -= w; }
    if (k === e.last && e.rep >= 1 && list.length > 1) continue;
    e.rep = k === e.last ? e.rep + 1 : 0; e.last = k; return k;
  }
  return list[0][0];
}
const ncqHand = e => [ncCX() + e.rx - e.facing * 11, ncFY() - 50];   // a mão de trás erguida (a da lança)
function ncqBrain(e, dt, hr) {
  const st = e.state, f = e.facing;
  if (e.ph >= 3 && !e.exposed && !ncq.bar && st !== 'refaz') e.barT -= dt;
  if (st === 'intro') {
    ncq.chainK = 1 - Math.max(0, e.stateT) / e.stateMax;
    if (Math.random() < dt * 30) ncSparks(ncCX() + e.rx + rnd(-8, 8), ncFY() - rnd(0, 40), 1, NC_ALMAC, 20, -30, 0.8);
    if (e.stateT <= 0) { ncqSet(e, 'anda', 1); ncq.chainK = 1; }
    return;
  }
  if (st === 'morrendo') {
    if (Math.random() < dt * 40) ncDust(ncCX() + e.rx + rnd(-8, 8), ncFY() - rnd(0, 46), 1, 30, -10, NC_OSSOC);
    if (Math.random() < dt * 20) ncSparks(ncCX() + e.rx, ncFY() - 30, 2, NC_ALMAC, 30, -60, 1);
    if (e.stateT <= 0) { e.ncFim = true; e.hp = 0; killEnemy(e); }
    return;
  }
  if (st === 'cai') { if (e.stateT <= 0) ncqSet(e, 'ajoelha', 3.5); return; }
  if (st === 'refaz') {
    ncq.chainK = 1 - Math.max(0, e.stateT) / e.stateMax;
    if (Math.random() < dt * 25) ncSparks(ncCX(), ncq.heartY, 1, NC_ALMAC, 40, 0, 0.6);
    if (e.stateT <= 0) { e.exposed = false; e.hpLock = e.hp; ncqSet(e, 'anda', 1.2); e.cd = 1.2; }
    return;
  }
  // exposto: o tempo corre; perdeu um terço, ou acabou o tempo, ergue o coração e refaz as âncoras
  if (e.exposed) {
    e.expT -= dt;
    const thr = ncqThr(e);
    if (e.hp <= thr && e.cyc < 2) { e.hp = thr; e.hpLock = thr; e.cyc++; e.ph = e.cyc + 1; e.exposed = false; ncqClear(); ncqSet(e, 'refaz', 2); ncqAnchors(e.cyc); ncq.chainK = 0; sfx.ncReiUrro(1); sfx.ncReiRefaz(); return; }
    if (e.expT <= 0 && st !== 'ajoelha') { e.exposed = false; e.hpLock = e.hp; ncqClear(); ncqSet(e, 'refaz', 2); ncqAnchors(e.cyc); ncq.chainK = 0; sfx.ncReiRefaz(); return; }
    if (st === 'ajoelha') { if (e.stateT <= 0) ncqSet(e, 'anda', 0.8); return; }
  }
  // os golpes em andamento
  if (st === 'lancaMira') {
    const [hx, hy] = ncqHand(e), lock = e.stateT < 0.3;
    if (!lock || !ncq.aim) ncq.aim = { x0: hx, y0: hy, x1: pl.x + pl.w / 2, y1: pl.y + pl.h / 2 };
    else { ncq.aim.x0 = hx; ncq.aim.y0 = hy; }
    ncq.aim.q = 1 - Math.max(0, e.stateT) / e.stateMax; ncq.aim.lock = lock;
    if (e.stateT <= 0) {
      const A = ncq.aim, dx = A.x1 - A.x0, dy = A.y1 - A.y0, d = Math.hypot(dx, dy) || 1, sp = 380;
      ncq.lancas.push({ rx: A.x0 - ncCX(), y: A.y0, vx: dx / d * sp, vy: dy / d * sp, t: 0, hit: false });
      ncq.aim = null; sfx.ncReiLanca(); ncqSet(e, 'lancaPos', 0.45);
    }
    return;
  }
  if (st === 'maoChama') { if (e.stateT <= 0) ncqSet(e, 'maoPos', 0.5); return; }
  if (st === 'foiceErgue') {
    ncq.sweep = { rx: e.rx, f, q: 1 - Math.max(0, e.stateT) / e.stateMax, on: false };
    if (e.stateT <= 0) { ncqSet(e, 'foiceGolpe', 0.22); e.sweepHit = false; sfx.ncReiFoice(); }
    return;
  }
  if (st === 'foiceGolpe') {
    ncq.sweep = { rx: e.rx, f, q: 1, on: true };
    const x0 = ncCX() + e.rx + (f > 0 ? -4 : -5.5 * T), x1 = x0 + 5.5 * T + 4, y1 = ncFY(), y0 = y1 - 2.6 * T;
    if (!e.sweepHit && !pl.dead && pl.x + pl.w > x0 && pl.x < x1 && pl.y + pl.h > y0 && pl.y < y1) { e.sweepHit = true; hurtPlayer(Math.round(e.dmg * 1.2), ncCX() + e.rx, null, true); pl.vx = f * 180; pl.vy = -140; }
    if (Math.random() < dt * 60) ncDust(x0 + Math.random() * (x1 - x0), ncFY(), 1, 40, -30, NC_OSSOC);
    if (e.stateT <= 0) { ncq.sweep = null; shake(2); ncqSet(e, 'foicePos', 0.6); }
    return;
  }
  if (st === 'ergue') {
    for (const c of ncq.cracks) if (Math.random() < dt * 20) { ncDust(ncCX() + (c + 0.5) * T, ncFY(), 1, 20, -40, NC_OSSOC); if (Math.random() < 0.4) ncSparks(ncCX() + (c + 0.5) * T, ncFY() - 2, 1, NC_ALMAC, 10, -30, 0.6); }
    if (e.stateT <= 0) {
      for (const c of ncq.cracks) ncqLevanta(e, c);
      ncq.cracks.length = 0; ncqSet(e, 'erguePos', 0.6); shake(2);
    }
    return;
  }
  if (st === 'lancaPos' || st === 'maoPos' || st === 'foicePos' || st === 'erguePos') { if (e.stateT <= 0) { ncqSet(e, 'anda', 0); e.cd = [1.3, 1.1, 0.9][e.ph - 1]; } return; }
  // andando: chega a uns 4 ou 5 blocos do herói, de frente para ele
  e.facing = hr > e.rx ? 1 : -1;
  const want = hr - e.facing * 4.5 * T, sp = [26, 30, 36][e.ph - 1];
  if (Math.abs(want - e.rx) > 6) e.rx += Math.sign(want - e.rx) * sp * dt;
  // a fase 3: as paredes de osso, de tempos em tempos
  if (e.ph >= 3 && !e.exposed && !ncq.bar) { if (e.barT <= 0) { e.barT = 15; ncq.bar = { st: 'warn', t: 1.2, w: 0, hold: 5 }; sfx.ncReiParede(); } }
  if (e.cd > 0) return;
  const near = Math.abs(hr - e.rx) < 6.5 * T && pl.y + pl.h > ncFY() - 3 * T, high = pl.y + pl.h < ncFY() - 4 * T;
  const summ = enemies.filter(m => m.ncBossMinion && !m.dead).length;
  const list = [['foice', near ? 4 : 0], ['lanca', high ? 4 : 2], ['mao', high ? 1.5 : 2.5], ['ergue', e.ergueCD <= 0 && summ < 3 ? 1.6 : 0]].filter(([, w]) => w > 0);
  ncqGo(e, ncqPick(e, list));
}
function ncqGo(e, k) {
  if (k === 'foice') { ncqSet(e, 'foiceErgue', e.ph >= 3 ? 0.6 : NCQ_FOICE); sfx.ncReiErgue(0.6); }
  else if (k === 'lanca') { ncqSet(e, 'lancaMira', NCQ_LANCA); sfx.ncReiMira(); }
  else if (k === 'mao') {
    ncqSet(e, 'maoChama', NCQ_MAO + 0.1); sfx.ncReiChama();
    const hx = pl.x + pl.w / 2, fy = ncFloor(hx, pl.y + pl.h - 2, 30), n = e.ph + 1;
    ncq.circ.push({ rx: hx - ncCX(), y: fy === null ? ncFY() : fy, t: 0, hit: false });
    for (let k2 = 1; k2 < n; k2++) { const rx = clamp(hx - ncCX() + (k2 % 2 ? -1 : 1) * (3 + Math.random() * 7) * T, -56 * T, 55 * T); ncq.circ.push({ rx, y: ncFY(), t: -0.1 * k2, hit: false }); }
  } else if (k === 'ergue') {
    ncqSet(e, 'ergue', NCQ_ERGUE); e.ergueCD = 13; sfx.ncReiErgue(1);
    const hr = ncHeroRx() / T, n = Math.min(3 - enemies.filter(m => m.ncBossMinion && !m.dead).length, e.ph >= 2 ? 3 : 2);
    ncq.cracks = [...ncBoss.covas].sort((a, b) => Math.abs(a - hr) - Math.abs(b - hr)).filter(c => Math.abs(c - hr) > 2).slice(0, n);
  } else ncqSet(e, 'anda', 1);
}
function ncqLevanta(e, c) {
  const D = ET.legionario; if (!D) return;
  const x = ncCX() + (c + 0.5) * T, m = ncqSpawn('legionario', x - D.w / 2, ncFY() - D.h); if (!m || m.dead) return;
  const L = NCQ_L - 1, mm = 1 + 0.3 * (L - 1);
  Object.assign(m, { ncSummon: true, ncBossMinion: true, lvl: L, hp: Math.round(D.hp * mm * 0.6), maxHp: Math.round(D.hp * mm * 0.6), dmg: Math.round(D.dmg * (1 + 0.2 * (L - 1))), xp: 2, gold: 0, ncRiseT: 0.8, stun: 0.8, memT: 30, facing: pl.x > x ? 1 : -1 });
  ncDust(x, ncFY(), 14, 40, -60, NC_OSSOC); ncSparks(x, ncFY() - 6, 10, NC_ALMAC, 40, -40, 0.8); sfx.ncLevanta && sfx.ncLevanta(0.8);
}

/* ---------- o que voa e o que sai do chão ---------- */
function ncqHazards(e, dt) {
  const CX = ncCX();
  // a lança de alma
  for (let i = ncq.lancas.length - 1; i >= 0; i--) {
    const L = ncq.lancas[i]; L.t += dt; L.rx += L.vx * dt; L.y += L.vy * dt;
    const x = CX + L.rx;
    if (Math.random() < 0.6) ncP({ x, y: L.y, vx: rnd(-8, 8), vy: rnd(-8, 8), g: 0, life: 0.3, max: 0.3, col: '#b8f0d0', size: 1, lit: true });
    if (!L.hit && !pl.dead && x > pl.x - 2 && x < pl.x + pl.w + 2 && L.y > pl.y - 2 && L.y < pl.y + pl.h + 2) { L.hit = true; hurtPlayer(e.dmg, x - L.vx * 0.05, null, true); ncq.lancas.splice(i, 1); ncSparks(x, L.y, 10, NC_ALMAC, 60, 0, 0.5); continue; }
    if (L.t > 3 || solidAt(Math.floor(x / T), Math.floor(L.y / T))) { ncSparks(x, L.y, 8, NC_ALMAC, 50, 0, 0.5); sfx.ncReiLancaBate(Math.max(0.3, ncNear({ x, y: L.y }, 300))); ncq.lancas.splice(i, 1); }
  }
  // as mãos da cova
  for (let i = ncq.circ.length - 1; i >= 0; i--) {
    const C = ncq.circ[i]; C.t += dt;
    if (C.t >= NCQ_MAO && !C.up) {
      C.up = true; const x = CX + C.rx; sfx.ncReiMao(Math.max(0.3, ncNear({ x, y: C.y }, 260)));
      ncDust(x, C.y, 10, 40, -70, NC_OSSOC);
      const px = pl.x + pl.w / 2, pb = pl.y + pl.h;
      if (!pl.dead && Math.abs(px - x) < 1.6 * T && pb > C.y - 3.2 * T && pb < C.y + 4) { hurtPlayer(Math.round(e.dmg * 0.9), x, null, true); if (typeof elEnraizar === 'function') elEnraizar(0.6); pl.vx = 0; }
    }
    if (C.t > NCQ_MAO + 0.55) ncq.circ.splice(i, 1);
  }
  // as paredes de osso (fase 3)
  const B = ncq.bar;
  if (B) {
    B.t -= dt;
    if (B.st === 'warn' && B.t <= 0) { B.st = 'close'; sfx.ncReiParede(1); }
    else if (B.st === 'close') { B.w = Math.min(NCQ_BAR_MAX, B.w + 3 * dt); if (B.w >= NCQ_BAR_MAX) { B.st = 'hold'; B.t = B.hold; } if (Math.random() < dt * 10) shake(0.6); }
    else if (B.st === 'hold' && B.t <= 0) B.st = 'open';
    else if (B.st === 'open') { B.w = Math.max(0, B.w - 4 * dt); if (B.w <= 0) ncq.bar = null; }
    if (ncq.bar && B.w > 0) {
      const l = CX + (-60 + B.w) * T, r = CX + (60 - B.w) * T;
      if (pl.x < l) { pl.x = l; pl.vx = Math.max(pl.vx, 90); }
      if (pl.x + pl.w > r) { pl.x = r - pl.w; pl.vx = Math.min(pl.vx, -90); }
    }
  }
}

/* ---------- a arte: o rei (72 x 62 olhando para a direita, os pés na linha 61), o coração, a âncora ---------- */
const NCQ_ART = {};
{
  const { cp, set, RI, limb, cg } = NCB;
  const MARM = ['#26262a', '#3e3e44', '#5a5a5e', '#7e7e80', '#a2a29e', '#c8c8c0'].map(h => ph(h));
  const CX = 30;
  function foice(P, bx, by, tx, ty, ps = 1) {
    P.line(bx, by, tx, ty, RI.madeira, t => 3.6 - t * 1.2);
    P.put(tx, ty, RI.ferro, 4); P.put(bx, by, RI.ferro, 3);
    const L = Math.hypot(tx - bx, ty - by) || 1, ax = (tx - bx) / L, ay = (ty - by) / L, px = -ay * ps, py = ax * ps, BL = 18;
    for (let t = 0; t <= 1; t += 0.025) {
      const x = tx + px * t * BL - ax * t * t * BL * 0.45, y = ty + py * t * BL - ay * t * t * BL * 0.45, w = 2.4 * (1 - t) + 0.4;
      for (let k = -w / 2; k <= w / 2; k += 0.5) P.put(x + ax * k, y + ay * k, RI.ferro, 2.6 + k * 0.6 + (1 - t));
      P.put(x - ax * (w / 2 + 0.6), y - ay * (w / 2 + 0.6), RI.alma, 4 + (t < 0.8 ? 1 : 0));
    }
  }
  function rei(pose) {
    const P = cp(72, 62), s = 52001 + pose.length;
    const kn = pose === 'ajoelha' || pose === 'morre' ? 12 : 0, bob = pose === 'w1' ? -1 : 0, sway = pose === 'w1' ? 1.4 : pose === 'w2' ? -1.4 : 0;
    const sh = 22 + kn + bob, hy = sh - 10 + (kn ? 1 : 0), hx = CX + 1 + (kn ? 1 : 0);
    // a capa de trás, vermelho-escuro
    for (let y = sh; y < 60; y++) { const half = 6 + (y - sh) * 0.2; for (let x = Math.floor(CX - half - 3); x < CX - 1; x++) P.put(x, y, RI.rubro, 1.4 + cg(x, y, s) * 0.5 + (x < CX - half - 1 ? -0.6 : 0.3)); }
    // o braço de trás
    const sF = [CX - 4, sh + 2], sN = [CX + 5, sh + 2];
    const A = {
      idle: { far: [[-2, 8], [-1, 15]], near: [[3, 7], [5, 13]] },
      w1: { far: [[-2, 8], [0, 15]], near: [[3, 7], [5, 13]] },
      w2: { far: [[-2, 8], [-2, 15]], near: [[3, 7], [5, 13]] },
      lanca: { far: [[-5, -6], [-7, -13]], near: [[3, 7], [5, 13]] },
      foiceUp: { far: [[1, -6], [0, -11]], near: [[-1, -7], [-3, -14]] },
      foiceDown: { far: [[5, 4], [9, 6]], near: [[6, 4], [12, 6]] },
      ergue: { far: [[-3, -7], [-4, -15]], near: [[3, 7], [5, 13]] },
      ajoelha: { far: [[-1, 7], [0, 11]], near: [[4, 5], [7, 9]] },
      morre: { far: [[-1, 7], [1, 11]], near: [[3, 6], [4, 11]] }
    }[pose];
    const armP = (S, pts, far) => { const a = [S, ...pts.map(([x, y]) => [S[0] + x, S[1] + y])], h = a[a.length - 1]; limb(P, a, 1.2, RI.negro, far ? 1.4 : 2.6, s + (far ? 3 : 7), 0.9); P.put(h[0], h[1], RI.osso, far ? 2.6 : 4); P.put(h[0] + 0.7, h[1] + 0.6, RI.osso, far ? 2 : 3.2); return h; };
    const hF = armP(sF, A.far, true);
    // o manto: negro com o friso de ouro na barra e na frente
    for (let y = sh + 2; y < 62; y++) {
      const t = (y - sh) / (61 - sh), half = 6 + t * (kn ? 7 : 5), c = CX + sway * t;
      for (let x = Math.floor(c - half); x <= c + half; x++) {
        const dx = x + 0.5 - c; if (Math.abs(dx) > half) continue;
        let v = 2.4 - dx / half * 0.9 + cg(x, y, s) * 0.45; if ((x + Math.round(y * 0.12)) % 5 === 0) v -= 0.6;
        if (y >= 59) P.put(x, y, RI.ouro, 2.4 - dx / half * 0.6);
        else if (Math.abs(dx - 1.5) < 1 && y > sh + 9) P.put(x, y, RI.ouro, 1.8 + (y % 3 === 0 ? 1 : 0));
        else P.put(x, y, RI.negro, v);
      }
    }
    for (let x = CX - 6; x <= CX + 6; x++) P.put(x, sh + 11, RI.ouro, 3 - (x - CX) * 0.1);   // o cinto
    P.put(CX + 1, sh + 11, RI.alma, 5);
    // as costelas à mostra na abertura do peito
    for (let k = 0; k < 3; k++) for (let x = CX - 1; x <= CX + 3; x++) P.put(x, sh + 4 + k * 2, RI.osso, 2.6 + (x === CX + 1 ? 1 : 0));
    // o manto dos ombros com a gola alta
    P.blob(CX, sh + 1, 9, 3.4, RI.rubro, s + 1, 2.6);
    for (let x = CX - 8; x <= CX + 8; x += 2) P.put(x, sh + 4, RI.linho, 4.4);
    P.line(CX - 7, sh, CX - 8, sh - 9, RI.rubro, 2.2); P.line(CX - 6, sh, CX - 7, sh - 7, RI.rubro, 1.6);
    P.line(CX + 7, sh, CX + 8, sh - 8, RI.rubro, 2.8); P.line(CX + 6, sh, CX + 7, sh - 6, RI.rubro, 2);
    // o crânio
    P.blob(hx, hy, 4.4, 5.2, RI.osso, s + 2, 3.6);
    for (let x = hx - 2; x <= hx + 3; x++) for (let y = hy + 4; y <= hy + 6; y++) P.put(x, y, RI.osso, 3 - (y - hy - 4) * 0.4);
    for (let x = hx - 1; x <= hx + 3; x += 2) P.put(x, hy + 4, RI.negro, 0);
    for (const [x, y] of [[hx + 1, hy - 1], [hx + 2, hy - 1], [hx + 1, hy], [hx + 2, hy], [hx - 2, hy - 1], [hx - 2, hy], [hx + 2, hy + 2]]) P.put(x, y, RI.negro, 0);
    // a coroa: aro de ouro, cinco pontas, a pedra de alma
    for (let x = hx - 4; x <= hx + 4; x++) { P.put(x, hy - 5, RI.ouro, 3.6 - (x - hx) * 0.15); P.put(x, hy - 4, RI.ouro, 2.4); }
    for (const x of [hx - 4, hx - 2, hx, hx + 2, hx + 4]) { P.put(x, hy - 6, RI.ouro, 4.2); if (x === hx || x === hx - 4 || x === hx + 4) P.put(x, hy - 7, RI.ouro, 5); }
    P.put(hx, hy - 5, RI.alma, 5); P.put(hx - 3, hy - 5, RI.rubro, 4);
    // o braço da frente e a foice
    const hN = armP(sN, A.near, false);
    if (pose === 'foiceUp') foice(P, hN[0] + 7, hN[1] + 13, hN[0] - 13, hN[1] - 5);
    else if (pose === 'foiceDown') foice(P, hN[0] - 12, hN[1] - 7, hN[0] + 14, hN[1] + 12);
    else if (pose === 'ajoelha') foice(P, hN[0] + 4, 61, hN[0] - 3, hN[1] - 22);
    else if (pose === 'morre') foice(P, CX - 14, 60, CX + 22, 60, -1);
    else foice(P, hN[0], Math.min(61, hN[1] + 18), hN[0] + 1, hN[1] - 28);
    if (pose === 'lanca' || pose === 'ergue') { P.put(hF[0], hF[1] - 1, RI.alma, 5); P.put(hF[0] + 0.6, hF[1] - 2, RI.alma, 4); }
    return set(P.done());
  }
  // o Coração-Relicário: a caixa de ouro com o vidro e o coração verde dentro (15 x 17)
  function coracao() {
    const P = cp(15, 17), s = 52101;
    for (let y = 0; y < 17; y++) for (let x = 0; x < 15; x++) {
      const arch = y < 4 && Math.hypot(x - 7, y - 4) > 7.4; if (arch) continue;
      const rim = x < 2 || x > 12 || y < 2 || y > 14 || (y < 4 && Math.hypot(x - 7, y - 4) > 5.6);
      P.put(x, y, rim ? RI.ouro : RI.negro, rim ? 3.2 - x * 0.08 + (y < 3 ? 1 : 0) + cg(x, y, s) * 0.4 : 0.6);
    }
    P.blob(7, 9, 3.4, 3.6, RI.alma, s + 1, 3.4, (x, y, dx, dy) => (y < 7 && Math.abs(dx) < 0.2 ? -2 : 0));
    P.put(5, 7, RI.alma, 5); P.put(7, 16, RI.ouro, 2); P.put(7, 0, RI.ouro, 5);
    for (const x of [1, 13]) for (let y = 15; y < 17; y++) P.put(x, y, RI.ouro, 2.4);
    return set(P.done());
  }
  // a âncora: um bloco de mármore com o aro de ferro e o selo de alma (14 x 12)
  function ancora() {
    const P = cp(14, 12), s = 52201;
    for (let y = 3; y < 12; y++) for (let x = 1; x < 13; x++) P.put(x, y, MARM, 3 - (x - 1) * 0.12 + (y === 3 ? 1.4 : 0) - (y === 11 ? 1 : 0) + cg(x, y, s) * 0.5);
    for (let a = 0; a < 6.3; a += 0.3) P.put(7 + Math.cos(a) * 2.6, 2.6 + Math.sin(a) * 2.2, RI.ferro, 3 + Math.sin(a));
    for (const [x, y] of [[5, 6], [6, 7], [7, 8], [8, 7], [9, 6], [7, 6]]) P.put(x, y, RI.alma, 4.4);
    return set(P.done());
  }
  NCQ_ART.get = () => {
    if (NCQ_ART.b) return NCQ_ART.b;
    const b = {};
    for (const p of ['idle', 'w1', 'w2', 'lanca', 'foiceUp', 'foiceDown', 'ergue', 'ajoelha', 'morre']) b[p] = rei(p);
    b.coracao = coracao(); b.ancora = ancora();
    return NCQ_ART.b = b;
  };
}

/* ---------- desenho ---------- */
const ncqPose = e => {
  const st = e.state;
  if (st === 'lancaMira') return 'lanca';
  if (st === 'foiceErgue') return 'foiceUp';
  if (st === 'foiceGolpe' || st === 'foicePos') return 'foiceDown';
  if (st === 'ergue' || st === 'maoChama' || st === 'refaz') return 'ergue';
  if (st === 'cai' || st === 'ajoelha') return 'ajoelha';
  if (st === 'morrendo') return 'morre';
  if (st === 'anda' && Math.abs(e.rx - (e.prx === undefined ? e.rx : e.prx)) > 0.05) return Math.floor(e.t * 3) % 2 ? 'w1' : 'w2';
  return 'idle';
};
// um ponto (px, py) da tela de 72 x 62 na tela do jogo
const ncqPt = (e, fx, fy, px, py) => [fx + (px - 30) * e.facing, fy - 62 + py];
DRAW_E.reiEterno = (e, fx, fy, fl) => {
  const S = NCQ_ART.get()[ncqPose(e)], img = cvPick(S, e, fl);
  e.prx = e.rx;
  const dx = e.facing > 0 ? 31 : 42, dy = 63;
  if (e.state === 'intro') { const k = 1 - Math.max(0, e.stateT) / e.stateMax; lc.globalAlpha = clamp(k * 1.4, 0, 1); }
  if (e.state === 'morrendo') {   // desfaz de cima para baixo
    const k = 1 - Math.max(0, e.stateT) / e.stateMax, cut = Math.round(k * 62);
    lc.save(); lc.beginPath(); lc.rect(fx - dx, fy - dy + cut, img.width, img.height); lc.clip(); lc.drawImage(img, fx - dx, fy - dy); lc.restore(); return;
  }
  lc.drawImage(img, fx - dx + (e.state === 'cai' ? Math.round(Math.sin(e.t * 60)) : 0), fy - dy);
  lc.globalAlpha = 1;
};
EYES_E.reiEterno = (e, fx, fy) => {
  if (e.state === 'morrendo') return;
  const kn = ncqPose(e) === 'ajoelha' ? 13 : 0, [x, y] = ncqPt(e, fx, fy, 32.5, 12 + kn);
  lc.globalAlpha = 0.6 * e.eye; lc.drawImage(ncGl('reiO', 6, NC_COL.alma), Math.round(x) - 6, Math.round(y) - 6);
  lc.globalAlpha = e.eye; lc.fillStyle = '#eafff4'; lc.fillRect(Math.round(x) - 1, Math.round(y), 1, 1); lc.fillRect(Math.round(x) + 1 * e.facing, Math.round(y), 1, 1);
  // a pedra da coroa e a mão que conjura
  const [gx, gy] = ncqPt(e, fx, fy, 31, 7 + kn); lc.globalAlpha = 0.4 * e.eye; lc.drawImage(ncGl('reiG', 5, NC_COL.alma), Math.round(gx) - 5, Math.round(gy) - 5);
  const st = e.state;
  if (st === 'lancaMira' || st === 'ergue' || st === 'maoChama' || st === 'refaz') {
    const [hx, hy] = st === 'lancaMira' ? ncqPt(e, fx, fy, 19, 11) : ncqPt(e, fx, fy, 23, 9);
    lc.globalAlpha = 0.5 + 0.3 * Math.sin(gameTime * 20); lc.drawImage(ncGl('reiM', 12, NC_COL.alma), Math.round(hx) - 12, Math.round(hy) - 12);
    if (st === 'lancaMira') { lc.globalAlpha = 0.9; lc.fillStyle = '#eafff4'; lc.fillRect(Math.round(hx) - 7 * e.facing, Math.round(hy) - 1, 14, 2); }
  }
  // o escudo de alma: aparece quando um golpe resvala
  if (e.shF > 0 && !e.exposed) { lc.globalAlpha = e.shF * 1.6; lc.drawImage(ncGl('reiS', 30, NC_COL.alma), Math.round(fx) - 30, Math.round(fy - 26) - 30); }
  lc.globalAlpha = 1;
};
WARN_E.reiEterno = e => ['lancaMira', 'maoChama', 'foiceErgue', 'ergue'].includes(e.state);
DRAW_E.ncAncora = (e, fx, fy, fl) => { const S = NCQ_ART.get().ancora; lc.drawImage(cvPick(S, e, fl), Math.round(fx) - 8, fy - 13); };
EYES_E.ncAncora = (e, fx, fy) => { lc.globalAlpha = 0.45 + 0.15 * Math.sin(gameTime * 4 + e.site[0]); lc.drawImage(ncGl('ancG', 10, NC_COL.alma), Math.round(fx) - 10, Math.round(fy - 8) - 10); lc.globalAlpha = 1; };
WARN_E.ncAncora = () => false;

// as correntes, o coração, as linhas de aviso, os círculos, as paredes de osso
const ncqHeartXY = () => [ncCX(), ncRei ? ncq.heartY : ncqHangY()];
function ncqChain(ax, ay, bx, by, k, cx, cy) {
  const n = Math.max(2, Math.floor(Math.hypot(bx - ax, by - ay) / 3 * k));
  for (let i = 0; i <= n; i++) {
    const t = i / Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / 3)), x = bx + (ax - bx) * t, y = by + (ay - by) * t + Math.sin(t * Math.PI) * 10;
    lc.fillStyle = i % 2 ? '#7ad8a8' : '#b8f0d0'; lc.fillRect(Math.round(x - cx) - (i % 2 ? 0 : 1), Math.round(y - cy), i % 2 ? 1 : 2, i % 2 ? 2 : 1);
  }
}
HOOK.drawWorld.push((cx, cy) => {
  if (!ncBoss || ncState.dead || !pl) return;
  if (!ncHeroIn(30)) return;
  const [hx, hy] = ncqHeartXY(), A = NCQ_ART.get();
  // as correntes (só na luta; antes, as três pendem soltas do coração)
  if (ncRei) { lc.globalAlpha = 0.9; for (const a of ncq.anc) if (!a.dead) ncqChain(a.x + a.w / 2, a.y + 2, hx, hy + 6, ncq.chainK, cx, cy); lc.globalAlpha = 1; }
  else for (let k = 0; k < 3; k++) { lc.fillStyle = '#5a8a72'; for (let j = 0; j < 8; j++) lc.fillRect(Math.round(hx - 4 + k * 4 - cx), Math.round(hy + 16 + j * 2 - cy), 1, 1); }
  // a corrente de cima, do teto ao coração
  if (!ncRei || !ncRei.exposed || ncRei.state === 'refaz') { lc.fillStyle = '#5a5e64'; for (let y = ncBoss.top * T; y < hy; y += 3) lc.fillRect(Math.round(hx - cx), Math.round(y - cy), 1, 2); }
  const img = A.coracao.r, beat = ncRei && ncRei.exposed ? 0 : Math.round(Math.max(0, Math.sin(gameTime * 3)) * 0.6);
  lc.drawImage(img, Math.round(hx - cx) - 8, Math.round(hy - cy) - 2 - beat);
  // o arco da foice no chão enquanto ele ergue
  const S = ncq.sweep;
  if (S && ncRei) {
    const x0 = ncCX() + S.rx, f = S.f, y = ncFY();
    lc.globalAlpha = S.on ? 0.7 : 0.15 + 0.35 * S.q; lc.strokeStyle = S.on ? '#eafff4' : '#7ad8a8'; lc.lineWidth = 1;
    lc.beginPath(); lc.ellipse(Math.round(x0 - cx) + 0.5, Math.round(y - cy) + 0.5, 5.5 * T, 2.6 * T, 0, f > 0 ? -Math.PI / 2 : Math.PI, f > 0 ? 0 : -Math.PI / 2); lc.stroke();
    lc.globalAlpha = 1;
  }
});
HOOK.drawGlow.push((cx, cy) => {
  if (!ncBoss || ncState.dead || !pl || !ncHeroIn(30)) return;
  const [hx, hy] = ncqHeartXY();
  lc.globalAlpha = (ncRei && ncRei.exposed ? 0.8 : 0.5) + 0.15 * Math.sin(gameTime * 3); lc.drawImage(ncGl('reiC', 24, NC_COL.alma), Math.round(hx - cx) - 24, Math.round(hy - cy) + 6 - 24);
  if (ncRei) for (const a of ncq.anc) if (!a.dead) { lc.globalAlpha = 0.3; const mx = (a.x + a.w / 2 + hx) / 2, my = (a.y + hy) / 2 + 8; lc.drawImage(ncGl('reiK', 8, NC_COL.alma), Math.round(mx - cx) - 8, Math.round(my - cy) - 8); }
  for (const L of ncq.lancas) { lc.globalAlpha = 0.7; lc.drawImage(ncGl('reiL', 8, NC_COL.alma), Math.round(ncCX() + L.rx - cx) - 8, Math.round(L.y - cy) - 8); }
  for (const C of ncq.circ) { const q = clamp(C.t / NCQ_MAO, 0, 1); lc.globalAlpha = 0.2 + 0.4 * q; lc.drawImage(ncGl('reiH', 14, NC_COL.alma), Math.round(ncCX() + C.rx - cx) - 14, Math.round(C.y - cy) - 16); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (!ncRei || !ncBoss) return;
  const CX = ncCX();
  // a linha da lança
  const A = ncq.aim;
  if (A) {
    const dx = A.x1 - A.x0, dy = A.y1 - A.y0, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    lc.globalAlpha = A.lock ? 0.6 + 0.4 * Math.abs(Math.sin(gameTime * 30)) : 0.15 + 0.35 * A.q; lc.fillStyle = A.lock ? '#eafff4' : '#7ad8a8';
    for (let t = 0; t < 60 * T; t += 3) { const x = A.x0 + ux * t, y = A.y0 + uy * t; if (solidAt(Math.floor(x / T), Math.floor(y / T))) break; lc.fillRect(Math.round(x - cx), Math.round(y - cy), 1, 1); }
  }
  // as lanças voando
  for (const L of ncq.lancas) {
    const x = CX + L.rx, d = Math.hypot(L.vx, L.vy) || 1, ux = L.vx / d, uy = L.vy / d;
    lc.globalAlpha = 1; for (let k = 0; k < 14; k++) { lc.fillStyle = k < 3 ? '#eafff4' : k < 8 ? '#b8f0d0' : '#7ad8a8'; lc.fillRect(Math.round(x - ux * k - cx), Math.round(L.y - uy * k - cy), 1, 1); }
  }
  // os círculos no chão e as mãos subindo
  for (const C of ncq.circ) {
    const x = CX + C.rx, q = clamp(C.t / NCQ_MAO, 0, 1);
    if (C.t < 0) continue;
    lc.globalAlpha = 0.35 + 0.5 * q; lc.strokeStyle = q > 0.75 ? '#eafff4' : '#7ad8a8'; lc.lineWidth = 1;
    lc.beginPath(); lc.ellipse(Math.round(x - cx) + 0.5, Math.round(C.y - cy) - 0.5, 1.6 * T * (0.5 + 0.5 * q), 2.5, 0, 0, 6.283); lc.stroke();
    if (C.up) {
      const u = clamp((C.t - NCQ_MAO) / 0.2, 0, 1) * (1 - clamp((C.t - NCQ_MAO - 0.35) / 0.2, 0, 1)), hh = Math.round(u * 2.6 * T);
      lc.globalAlpha = 1;
      for (const o of [-9, -3, 3, 9]) { const bx = Math.round(x + o - cx), by = Math.round(C.y - cy); lc.fillStyle = '#bcb092'; lc.fillRect(bx, by - hh, 2, hh); lc.fillStyle = '#e2d8bc'; lc.fillRect(bx - 1, by - hh, 1, 2); lc.fillRect(bx + 2, by - hh + 1, 1, 2); }
    }
  }
  // as lajes rachando
  if (ncRei.state === 'ergue') for (const c of ncq.cracks) { const x = CX + c * T; lc.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(gameTime * 14)); lc.fillStyle = '#b8f0d0'; lc.fillRect(Math.round(x - cx) + 2, Math.round(ncFY() - cy), T - 4, 1); lc.fillRect(Math.round(x - cx) + 5, Math.round(ncFY() - cy) + 1, 1, 3); }
  // as paredes de osso: a linha no chão, depois a parede
  const B = ncq.bar;
  if (B) {
    const y0 = (ncBoss.top - 1) * T, y1 = ncFY();
    if (B.st === 'warn') { lc.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(gameTime * 12)); lc.fillStyle = '#b8f0d0'; for (const s of [-1, 1]) { const x = CX + s * (60 - NCQ_BAR_MAX) * T; lc.fillRect(Math.round(x - cx) - (s > 0 ? 0 : 1), Math.round(y1 - cy) - 2, 1, 2); lc.fillRect(Math.round(CX - s * 60 * T - cx), Math.round(y1 - cy) - 1, Math.round(s * (NCQ_BAR_MAX * T)), 1); } }
    else if (B.w > 0) for (const s of [-1, 1]) {
      const edge = CX + s * (60 - B.w) * T, out = CX + s * 60 * T, xa = Math.min(edge, out), w = Math.abs(out - edge);
      lc.globalAlpha = 0.35; lc.fillStyle = '#1a3a2c'; lc.fillRect(Math.round(xa - cx), Math.round(y0 - cy), Math.round(w), Math.round(y1 - y0));
      lc.globalAlpha = 0.95; lc.fillStyle = '#bcb092';
      for (let y = y0; y < y1; y += 4) { lc.fillRect(Math.round(edge - cx) - (s > 0 ? 0 : 3), Math.round(y - cy), 3, 3); }
      lc.fillStyle = '#b8f0d0'; lc.fillRect(Math.round(edge - cx) - (s > 0 ? 1 : -3), Math.round(y0 - cy), 1, Math.round(y1 - y0));
    }
  }
  lc.globalAlpha = 1;
});
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  if (!ncBoss || ncState.dead || !pl || !ncHeroIn(30)) return;
  const [hx, hy] = ncqHeartXY(); addL(hx, hy + 6, 0.7);
  for (const a of ncq.anc) if (!a.dead) addL(a.x + a.w / 2, a.y, 0.45);
  for (const L of ncq.lancas) addL(ncCX() + L.rx, L.y, 0.35);
  if (ncRei && !ncRei.dead) addL(ncRei.x + ncRei.w / 2, ncRei.y + 10, 0.3);
}; }

/* ---------- a câmera: um passo mais longe dentro do Salão, durante a luta (como o 287) ---------- */
let ncZoom = false, ncRzOn = false;
function ncqZoom(on) {
  if (!ncRzOn && typeof resize === 'function') {
    ncRzOn = true;
    const _rz = resize; resize = function () {
      _rz();
      if (!ncZoom || S <= 2) return;
      S = S - 1; VW = Math.min(WW * T, Math.ceil(cvs.width / S)); VH = Math.min(WH * T, Math.ceil(cvs.height / S));
      low.width = VW; low.height = VH; lc.imageSmoothingEnabled = false; sc.imageSmoothingEnabled = false;
    };
  }
  if (ncZoom === on) return;
  ncZoom = on; if (typeof resize === 'function') resize();
}

/* ---------- o turno: acordar, sair, a luta ---------- */
HOOK.update.push(dt => {
  const B = ncBoss; if (!B || !pl || state !== 'play') return;
  if (ncState.dead) return;
  if (!bossFight && !pl.dead && ncHeroIn(0) && Math.abs(ncHeroRx()) < 50 * T) ncStart();
  const e = ncRei;
  if (!e || !bossFight || !bossFight.nc) { if (ncHeroIn(8) && Math.random() < dt * 0.8) ncSparks(ncCX() + rnd(-50, 50) * T, ncqHangY() + rnd(-10, 30) * T, 1, NC_ALMAC, 6, -8, 2); return; }
  if (!pl.dead && !ncHeroIn(2)) { endBossFight(false); return; }
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
});
HOOK.update.push(() => { if (bossFight && bossFight.nc && pl.dead) endBossFight(false); });
// morreu ou usou o portal: o rei some, as âncoras e o coração voltam
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.nc) bossFight = null;
  ncRei = null; ncq.anc.length = 0; ncqClear(); ncq.chainK = 1; if (ncZoom) ncqZoom(false);
  ncState.dead = !!(sv && sv.reiEterno && sv.reiEterno.dead);   // antes da geração: ncDress lê
  return _nw(sd, sv);
}; }
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.reiEterno = { dead: ncState.dead };
  if (o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([, t]) => t !== NC_BARREIRA);
  return o;
}; }

/* ---------- O Filactério do Rei Eterno ---------- */
STAT_DEF.lgEterno = { t: 'Uma vez a cada 3 minutos, a morte não leva: você volta com 40% da vida', flag: 1 };
STAT_KEYS.push('lgEterno');
ICON_ART.ncFilacterio = [["...kGk....", "..kGWGk...", "..kgGgk...", "...kgk....", "..yYYYy...", ".yYaAaYy..", ".yYAWAYy..", ".yYaAaYy..", "..yYYYy...", "...yyy...."], { k: '#2a1a06', G: '#d4b060', g: '#86662a', W: '#eafff4', y: '#5e4616', Y: '#ae8a40', a: '#4a8a6a', A: '#b8f0d0' }];
ITEMS.filacterio_eterno = {
  name: 'O Filactério do Rei Eterno', slot: 'acc', rar: 4, hp: 30, icon: 'ncFilacterio',
  legend: [['lgEterno', 1], ['regen', 1], ['def', 3]],
  desc: 'O relicário onde o rei guardava a própria alma, ainda morno. Enquanto ele bate, a morte espera na porta.'
};
BASE_INFO.filacterio_eterno = [NCQ_L];
ITEM_G.filacterio_eterno = 0; ITEMS.filacterio_eterno.g = 0;
ncqDrops();
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgEterno || 0;
  if (!pl.lg) pl.lg = {}; pl.lg.eterno = b > 0;
  return r;
}; }
const NCQ_VOLTA = 180;
{ const _die = die; die = function () {
  if (pl && pl.lg && pl.lg.eterno && !pl.dead && gameTime - (pl.ncVolta === undefined ? -1e9 : pl.ncVolta) >= NCQ_VOLTA) {
    pl.ncVolta = gameTime; pl.hp = Math.max(1, Math.round(pl.maxHp * 0.4)); pl.invuln = 2;
    burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 30, '#b8f0d0', 120, -40, 1.1, 1, true);
    floatText(pl.x + pl.w / 2, pl.y - 12, 'O FILACTÉRIO TE SEGURA', '#b8f0d0', 1.4);
    sfx.ncReiVolta(); shake(4);
    return;
  }
  return _die.apply(this, arguments);
}; }
HOOK.drawGlow.push((cx, cy) => {
  if (!pl || pl.dead || pl.ncVolta === undefined || gameTime - pl.ncVolta > 1.5) return;
  lc.globalAlpha = 1 - (gameTime - pl.ncVolta) / 1.5; lc.drawImage(ncGl('volta', 30, NC_COL.alma), Math.round(pl.x + pl.w / 2 - cx) - 30, Math.round(pl.y + pl.h / 2 - cy) - 30); lc.globalAlpha = 1;
});

/* ---------- som: o despertar, o rastrilho, a lança, as mãos, a foice, as correntes, o fim ---------- */
Object.assign(sfx, {
  ncReiDesperta() { tone(55, 2.4, 'sawtooth', 0.05, -10); tone(110, 2, 'sine', 0.03, 40, 0.3); noise(2, 0.06, 400, 'bandpass', 0, 2); for (let k = 0; k < 4; k++) tone(660 + k * 110, 0.5, 'sine', 0.012, -200, 0.6 + k * 0.25); },
  ncReiRastrilho() { for (let k = 0; k < 7; k++) { noise(0.1, 0.08, 900 + k * 60, 'bandpass', k * 0.07, 3); tone(140 - k * 6, 0.12, 'square', 0.02, -30, k * 0.07); } },
  ncReiMira() { tone(400, 1, 'sine', 0.02, 500); tone(600, 1, 'triangle', 0.008, 700); },
  ncReiLanca() { tone(1200, 0.3, 'sawtooth', 0.025, -700); noise(0.3, 0.08, 2600, 'bandpass', 0, 2); },
  ncReiLancaBate(v = 1) { tone(900, 0.25, 'sine', 0.03 * v, -500); noise(0.2, 0.06 * v, 3000, 'highpass'); },
  ncReiChama() { tone(90, 1, 'sine', 0.05, -20); noise(1, 0.05, 250, 'lowpass', 0, 0.6); },
  ncReiMao(v = 1) { noise(0.25, 0.14 * v, 600, 'lowpass'); for (let k = 0; k < 4; k++) noise(0.05, 0.05 * v, 1600 + k * 300, 'bandpass', 0.03 + k * 0.04, 4); },
  ncReiErgue(v = 1) { tone(70, 0.8, 'sawtooth', 0.03 * v, 30); noise(0.7, 0.05 * v, 500, 'bandpass', 0, 2); },
  ncReiFoice() { noise(0.3, 0.14, 1400, 'bandpass', 0, 1.5); tone(300, 0.2, 'sawtooth', 0.02, -200); },
  ncReiAncora() { tone(1500, 0.12, 'sine', 0.025, -300); noise(0.06, 0.04, 3600, 'highpass'); },
  ncReiCorrente() { for (let k = 0; k < 5; k++) { tone(1800 - k * 160, 0.2, 'triangle', 0.02, -300, k * 0.04); noise(0.06, 0.06, 4000, 'highpass', k * 0.04); } tone(80, 0.6, 'sine', 0.06, -20); },
  ncReiCai(v = 1) { tone(60, 0.6, 'sine', 0.12 * v, -20); noise(0.4, 0.12 * v, 300, 'lowpass'); tone(1400, 0.4, 'triangle', 0.02 * v, -600); },
  ncReiRefaz() { tone(220, 2, 'sine', 0.03, 220); tone(330, 2, 'sine', 0.015, 330, 0.2); noise(2, 0.04, 1200, 'bandpass', 0, 2); },
  ncReiUrro(v = 1) { tone(50 * v, 1.6, 'sawtooth', 0.06, -12); tone(75 * v, 1.4, 'square', 0.012, -18, 0.1); noise(1.4, 0.08, 500, 'bandpass', 0, 1); },
  ncReiParede(v = 0.6) { tone(45, 1.2, 'sawtooth', 0.04 * v, 10); noise(1.2, 0.1 * v, 300, 'lowpass', 0, 0.5); },
  ncReiMorte() { tone(45, 3.4, 'sawtooth', 0.06, -15); noise(3, 0.1, 400, 'bandpass', 0, 0.8); for (let k = 0; k < 8; k++) tone(880 - k * 70, 0.6, 'sine', 0.012, -200, 0.5 + k * 0.3); },
  ncReiVolta() { tone(440, 1, 'sine', 0.04, 440); tone(660, 0.8, 'sine', 0.02, 330, 0.15); noise(0.8, 0.05, 2400, 'bandpass', 0, 2); }
});
