'use strict';

/* ================= O Último Acendedor: o chefe das Ruínas dos Acendedores =================
   A Fornalha do Mundo (docs/camadas/19-ruinas-acendedores.md, seção 7). O 415 deixa no fundo da camada, do outro lado
   do mundo em relação às descidas, uma caixa maciça de cx - 60 a cx + 59 e de top - 4 a fy + 4, cava os dois corredores
   de serviço por fora e chama acDress; este arquivo escreve a sala dentro dela. Não há trono: a sala é a última forja
   dos Acendedores, e é ela que muda a luta.
   - o chão é a grelha de ferro sobre o fogo (AC_GRELHA), com três lugares de pedra: o estrado no meio, onde fica o
     Grande Braseiro, e dois pedestais baixos;
   - dos dois lados, plataformas de pedra em dois andares (as baixas na altura de 10, as altas na de 15), com correntes
     para subir;
   - quatro lanternas de bronze penduradas do teto por correntes, uma ao lado da ponta de cada plataforma. Cada lanterna
     acesa manda um fio de fogo para o Último Acendedor e o protege (15% do dano a menos por lanterna acesa). Um golpe na
     lanterna corta a corrente: ela cai reto. Se cair a até 2 blocos dele, queima: 12% da vida dele e 2 s tonto; se não,
     vira uma poça de fogo no chão.
   O Último Acendedor é o mestre da guilda, o que acendeu o primeiro braseiro da cidade e o que ainda alimenta o Grande
   Braseiro. Um velho alto de manto de brasa e máscara de sol, com a vara de pavio aceso.
     1. Varada (a ponta da vara fica branca, 0,6 s, e ele estoca na direção do herói, de baixo para cima, 4,5 blocos) e
        Brasa Lançada (uma marca no chão debaixo do herói, 0,9 s, e a brasa cai ali: o chão queima 3 s).
     2. (abaixo de 2/3 da vida) também a Maré de Brasa: as grelhas acendem do meio para fora (1,5 s) e queimam 3 s; só a
        pedra e as plataformas são seguras.
     3. (abaixo de 1/3) o Grande Braseiro apaga e a sala escurece. Ele salta de plataforma em plataforma: um círculo de
        brasa marca onde ele vai cair (0,9 s), e a queda queima em volta.
   Sair da sala, usar portal ou morrer reinicia: as lanternas voltam, o braseiro reacende, a Grade Acesa abre. Na
   vitória: A Vara do Último Acendedor (lança lendária: todo golpe acende o alvo, que queima, e a vara ilumina em volta)
   e uma das três bases da camada. A morte fica salva (ultimoAcendedor.dead): a sala fica apagada.
   Carrega depois do 287 (o bloco dos chefes depois do 362), antes do 49 (que escala ET). */

const ACQ_L = layerBossLvl('acendedores');
const ACQ = { hp: Math.round(330 * (1 + 0.3 * (ACQ_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (ACQ_L - 1))), xp: 560 };
const acqState = { dead: false };
ET.ultimoAcendedor = { name: 'O Último Acendedor', w: 12, h: 30, hp: ACQ.hp, dmg: ACQ.dmg, xp: ACQ.xp, kb: 0, fly: false, blood: '#7a2a10', boss: true };
ET.acLanterna = { name: 'Lanterna da Fornalha', w: 10, h: 12, hp: 2, dmg: 0, xp: 0, kb: 0, fly: true, phase: true, blood: '#f6962a', boss: true };
AI.acLanterna = e => { e.vx = 0; e.vy = 0; if (e.homeX !== undefined) { e.x = e.homeX - e.w / 2; e.y = e.homeY - e.h / 2; } };
const ACQ_DROPS = [['vara_acendedor', 1], ['min_ardorita', 1, 6, 10], ['brasa_viva', 1, 2, 4], ['cera_acendedor', 1, 2, 4], ['pavio_eterno', 1, 1, 2], ['pocao', 1, 2, 4]];
const ACQ_BASES = ['aticador', 'capuz_cinza', 'botas_brasa'];
const acqDrops = () => { DROPS.ultimoAcendedor = ACQ_DROPS.filter(([id]) => ITEMS[id]); DROPS.acLanterna = []; };
const ACQ_VARA = 0.6, ACQ_JOGA = 0.9, ACQ_MARE = 1.5, ACQ_SALTO = 0.9, ACQ_DR = 0.15;

let acqE = null;
const acqLamps = [], acqFalls = [], acqFogos = [];
const acqFx = { mare: null, marca: null, apagou: false, beat: 0 };

/* ---------- a sala (o 415 chama dentro da geração) ---------- */
// as peças em coordenadas da sala: dx a partir de cx, dy a partir de fy (o chão)
const ACQ_LEDGES = [[-52, -42, -10], [41, 51, -10], [-30, -22, -15], [21, 29, -15]];   // x0, x1, y
const ACQ_CHAINS = [[-41, -11], [40, -11], [-31, -16], [30, -16]];                      // x, até a linha
const ACQ_LAMPS = [[-39.5, -12.5], [38.5, -12.5], [-19.5, -17.5], [18.5, -17.5]];       // x, y (o centro, em blocos)
const ACQ_PEDRAS = [[-30, -28], [27, 29]];
function acDress() {
  const B = acBoss; if (!B) return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const { cx, fy } = B, top = fy - B.h;
  const set = (x, y, t, w) => { const i = I(x, y); tiles[i] = t; if (w !== undefined) walls[i] = w; acKeep.add(i); };
  // a casca: tijolo refratário com cintas de bronze; o oco em abóbada
  for (let y = top - 3; y <= fy + 3; y++) for (let x = cx - 59; x <= cx + 58; x++) {
    const ix = x - cx, inner = ix >= -52 && ix <= 51 && y > top && y < fy, u = (ix + 0.5) / 52, vault = top + 1 + Math.round(7 * u * u);
    if (inner && y >= vault) { set(x, y, AIR, WAC_FORNALHA); continue; }
    const band = (y - top) % 9 === 0 || Math.abs(ix) % 13 === 0;
    set(x, y, band ? AC_BRONZE : AC_TIJOLO, WAC_TIJOLO);
  }
  // o chão: a grelha sobre o fogo (a brasa por baixo), o estrado, os pedestais
  for (let x = cx - 52; x <= cx + 51; x++) { set(x, fy, AC_GRELHA); set(x, fy + 1, AC_BRASA); set(x, fy + 2, AC_BRASA); }
  for (let x = cx - 7; x <= cx + 6; x++) { set(x, fy, AC_LAVRADA); set(x, fy - 1, AC_LAVRADA); }
  for (let x = cx - 5; x <= cx + 4; x++) set(x, fy - 2, AC_LAVRADA);
  for (const [a, b] of ACQ_PEDRAS) for (let x = cx + a; x <= cx + b; x++) { set(x, fy, AC_LAVRADA); set(x, fy - 1, AC_LAVRADA); }
  // as plataformas e as correntes
  for (const [a, b, dy] of ACQ_LEDGES) for (let x = cx + a; x <= cx + b; x++) set(x, fy + dy, x === cx + a || x === cx + b ? AC_BRONZE : AC_LAVRADA);
  for (const [dx, to] of ACQ_CHAINS) for (let y = fy + to; y < fy; y++) if (tiles[I(cx + dx, y)] === AIR) set(cx + dx, y, AC_CORRENTE);
  // as portas: 5 de alto na casca dos dois lados, o chão de pedra lavrada
  for (const D of B.doors) {
    const xs = D.side < 0 ? [cx - 59, cx - 53] : [cx + 52, cx + 58];
    for (let x = xs[0]; x <= xs[1]; x++) { for (let y = fy - 5; y < fy; y++) set(x, y, AIR, WAC_TIJOLO); set(x, fy, AC_LAVRADA); set(x, fy - 6, AC_BRONZE); }
  }
  // fendas de brasa nas paredes (a luz que fica quando o Grande Braseiro apaga)
  for (let y = top + 10; y < fy - 4; y += 7) for (const x of [cx - 53, cx + 52]) if (SOLID[tiles[I(x, y)]]) set(x, y, AC_BRASA);
  B.ledges = ACQ_LEDGES; B.lamps = ACQ_LAMPS; B.dais = [cx - 5, cx + 4, fy - 3];
}
const acqX = dx => (acBoss.cx + dx) * T, acqY = dy => (acBoss.fy + dy) * T;

/* ---------- a Grade Acesa nas portas ---------- */
function acqSeal(on) {
  const B = acBoss; if (!B) return;
  const I = (x, y) => y * WW + wrapX(x);
  for (const x of [B.cx - 53, B.cx + 52]) for (let y = B.fy - 5; y < B.fy; y++) {
    const i = I(x, y); if (on ? tiles[i] === AIR : tiles[i] === AC_BARREIRA) { tiles[i] = on ? AC_BARREIRA : AIR; markDirty(wrapX(x), y); }
  }
  mapVer++;
  if (on) sfx.acqGrade();
}

/* ---------- a luta ---------- */
function acqSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; }
const acqLit = () => acqLamps.filter(l => !l.dead).length;
function acqStart() {
  acqDrops();
  const B = acBoss, D = ET.ultimoAcendedor;
  const e = spawnEnemy('ultimoAcendedor', B.cx * T - D.w / 2, (B.fy - 3) * T - D.h, AC_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: ACQ_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, ph: 1, cd: 1.6, last: '', acMinion: true, facing: pl.x < e.x ? -1 : 1 });
  acqSet(e, 'intro', 1.6);
  acqE = e; bossFight = { e, ac: true };
  acqLamps.length = 0;
  for (const [dx, dy] of ACQ_LAMPS) {
    const l = spawnEnemy('acLanterna', 0, 0, AC_ZONE0 + 3);
    Object.assign(l, { boss: true, lvl: ACQ_L, hp: 1, maxHp: 1, dmg: 0, xp: 0, gold: 0, acMinion: true, homeX: acqX(dx + 0.5), homeY: acqY(dy), state: 'idle', facing: 1 });
    l.x = l.homeX - l.w / 2; l.y = l.homeY - l.h / 2; acqLamps.push(l);
  }
  acqFx.apagou = false;
  acqSeal(true);
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Último Acendedor'; bn.lastChild.textContent = 'a última chama'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Último Acendedor', 'a última chama');
  sfx.acqAcorda(); shake(3);
}
function acqClear() { acqFalls.length = 0; acqFogos.length = 0; acqFx.mare = null; acqFx.marca = null; }
function acqEnd(won) {
  const e = acqE; acqE = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const l of acqLamps) { l.dead = true; l.despawn = true; } acqLamps.length = 0;
  acqClear(); acqSeal(false);
  if (!won) { if (e) { e.dead = true; e.despawn = true; } acqFx.apagou = false; return; }
  acqState.dead = true; acqFx.apagou = true;
  const x = e ? e.x + e.w / 2 : acqX(0), y = e ? e.y : acqY(-6);
  ACM.sparks(x, y + 10, 40, ACM.FOGO, 120, 40, 1.4); ACM.ash(x, y + 30, 20, 60);
  const bases = ACQ_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.acqMorte();
  showBanner('Vitória', 'a última chama apaga');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.ac) return acqEnd(won); return _eb(won); }; }   // o caminho para baixo abre no 363

// as lanternas: um golpe corta a corrente; o dano no chefe cai 15% por lanterna acesa
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'acLanterna') { if (e.dead) return; return _hit(e, dir, mult, melee); }
  if (e && e.type === 'ultimoAcendedor' && !e.dead) {
    const n = acqLit();
    if (n > 0) { const m = mult * (1 - ACQ_DR * n); burst(e.x + e.w / 2, e.y + e.h / 2, 3 + n, '#ffb050', 40, -20, 0.4, 1, true); return _hit(e, dir, m, melee); }
  }
  // A Vara do Último Acendedor: todo golpe acende o alvo
  if (melee && pl.lg && pl.lg.vara && e && !e.dead && e.type !== 'acLanterna') { const r = _hit(e, dir, mult, melee); if (!e.dead) { e.acArde = 3; e.acArdeD = Math.max(1, Math.round(rollPlayerDmg() * 0.12)); } return r; }
  return _hit(e, dir, mult, melee);
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'acLanterna') {
    if (e.fell) return; e.fell = true; e.dead = true; e.hp = 0;
    acqFalls.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vy: 0 });
    ACM.sparks(e.x + e.w / 2, e.y, 10, ACM.FOGO, 50, 60, 0.5); sfx.acqCorta();
    return;
  }
  return _k(e);
}; }
// nada da Fornalha quebra enquanto ele vive
{ const _bt = breakTile; breakTile = function (tx, ty) { if (acBoss && !acqState.dead && inAcHall(tx, ty, 6)) { sfx.tink(); return; } return _bt(tx, ty); }; }

/* ---------- o cérebro ---------- */
const acqFeet = e => e.y + e.h;
const acqOnFloor = () => acBoss && Math.abs(pl.y + pl.h - acqY(0)) < 3;
AI.ultimoAcendedor = function (e, dt, dx, dy, dist) {
  if (!acBoss) { e.dead = true; return; }
  e.stateT -= dt;
  const B = acBoss, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, ecx = e.x + e.w / 2;
  const hpq = e.hp / e.maxHp; e.ph = hpq > 2 / 3 ? 1 : hpq > 1 / 3 ? 2 : 3;
  if (e.ph === 3 && !acqFx.apagou) { acqFx.apagou = true; ACM.sparks(acqX(0), acqY(-4), 30, ['#7c766e', '#625d57', '#4c4844'], 50, -40, 2, false); sfx.acqApaga(); shake(3); }
  if (e.state === 'intro') { e.vx = 0; e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) acqSet(e, 'walk', 0); return; }
  if (e.state === 'tonto') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { acqSet(e, 'walk', 0); e.cd = 0.8; } return; }
  if (e.state === 'varaW') {   // a ponta da vara fica branca
    e.vx = approach(e.vx, 0, 800 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.2) e.aimA = clamp(Math.atan2(pcy - (e.y + 8), Math.abs(pcx - ecx)), -1.05, 0.3);
    if (e.stateT <= 0) { acqSet(e, 'vara', 0.32); e.hitThis = false; sfx.acqEstoca(); }
    return;
  }
  if (e.state === 'vara') {
    e.vx = e.facing * 60 * (e.stateT > 0.16 ? 1 : 0);
    const [hx, hy] = acqHand(e), a = e.aimA || 0, L = 4.5 * T * clamp((0.32 - e.stateT) / 0.12, 0, 1);
    if (!e.hitThis) for (let d = 0; d <= L; d += 4) { const x = hx + Math.cos(a) * d * e.facing, y = hy + Math.sin(a) * d; if (ACM.hitsHero(x, y, 2)) { e.hitThis = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') ACM.acQueima(Math.max(1, Math.round(e.dmg * 0.12)), 1.5); break; } }
    if (e.stateT <= 0) { acqSet(e, 'walk', 0); e.cd = 0.9 + Math.random() * 0.5; }
    return;
  }
  if (e.state === 'jogaW') {   // a marca no chão debaixo do herói
    e.vx = 0; e.facing = Math.sign(acqFx.marca.x - ecx) || e.facing;
    if (e.stateT <= 0) {
      const M = acqFx.marca; acqFx.marca = null;
      ACM.sparks(M.x, M.y - 2, 16, ACM.FOGO, 70, 120, 0.6); sfx.acqBrasa();
      if (ACM.hitsHero(M.x, M.y - 10, 1.4 * T)) { const r = hurtPlayer(Math.round(e.dmg * 0.8), M.x, null, true); if (r === 'hit') ACM.acQueima(Math.max(1, Math.round(e.dmg * 0.12)), 1.5); }
      acqFogos.push({ x0: M.x - 1.6 * T, x1: M.x + 1.6 * T, y: M.y, t: 3, max: 3, dmg: Math.max(1, Math.round(e.dmg * 0.3)) });
      acqSet(e, 'walk', 0); e.cd = 1 + Math.random() * 0.6;
    }
    return;
  }
  if (e.state === 'mareW' || e.state === 'mare') {
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.state === 'mareW' && e.stateT <= 0) { acqSet(e, 'mare', 3); acqFx.mare = { on: true, t: 0, tick: 0 }; sfx.acqMare(); shake(2); }
    else if (e.state === 'mare' && e.stateT <= 0) { acqFx.mare = null; acqSet(e, 'walk', 0); e.cd = 1.2; }
    return;
  }
  if (e.state === 'saltoW') {   // agachado: o círculo marca onde vai cair
    e.vx = 0;
    if (e.stateT <= 0) {
      const M = acqFx.marca, tt = 0.8, gx = M.x - ecx, gy = M.y - acqFeet(e);
      e.vx = gx / tt; e.vy = (gy - 0.5 * GRAV * tt * tt) / tt; e.facing = Math.sign(gx) || e.facing;
      acqSet(e, 'salto', 1.6); e.acqT = 0; sfx.acqSalta();
    }
    return;
  }
  if (e.state === 'salto') {
    e.acqT += dt;
    const M = acqFx.marca;
    if (M && e.acqT < 0.8) e.vx = (M.x - ecx) / Math.max(0.05, 0.8 - e.acqT);
    if ((e.onGround && e.acqT > 0.15) || e.stateT <= 0) {
      e.vx = 0; acqFx.marca = null; shake(4); sfx.acqCai();
      ACM.sparks(ecx, acqFeet(e), 24, ACM.FOGO, 90, 60, 0.6); ACM.ash(ecx, acqFeet(e), 12, 70);
      if (!pl.dead && Math.hypot(pcx - ecx, pl.y + pl.h - acqFeet(e)) < 2.6 * T) { const r = hurtPlayer(Math.round(e.dmg * 1.2), ecx, e, false); if (r === 'hit') { pl.vx += Math.sign(pcx - ecx || 1) * 160; pl.vy = Math.min(pl.vy, -120); ACM.acQueima(Math.max(1, Math.round(e.dmg * 0.12)), 1.5); } }
      acqSet(e, 'walk', 0); e.cd = 0.9;
    }
    return;
  }
  // andando: chega perto do herói (debaixo dele, se ele estiver no alto)
  e.state = 'walk'; e.cd -= dt;
  const want = Math.abs(dy) > 3 * T ? 0 : 2.4 * T;
  let dir = Math.abs(dx) > want + T ? Math.sign(dx) : Math.abs(dx) < want - T && want > 0 ? -Math.sign(dx) : 0;
  walk(e, dt, dir, 42, 500, 0, dy, false);
  e.facing = Math.sign(dx) || e.facing;
  if (e.cd > 0 || pl.dead || !e.onGround) return;
  // a escolha: perto e na altura -> varada; longe ou no alto -> brasa; fase 2 -> maré de vez em quando; fase 3 -> salto
  const opts = [];
  if (dist < 4.6 * T && dy < T && dy > -4 * T) opts.push('vara', 'vara');
  if (dist > 3 * T || dy < -3 * T) opts.push('joga');
  if (e.ph >= 2 && e.last !== 'mare' && acqOnFloor()) opts.push('mare');
  if (e.ph >= 3 && e.last !== 'salto') opts.push('salto', 'salto');
  if (!opts.length) opts.push('joga');
  const pick = opts[(Math.random() * opts.length) | 0]; e.last = pick;
  if (pick === 'vara') { acqSet(e, 'varaW', ACQ_VARA); e.aimA = 0; sfx.acqVaraW(); }
  else if (pick === 'joga') {
    const f = ACM.floorBelow(pcx, pl.y + pl.h - 4, 16); if (f === null) { e.cd = 0.4; return; }
    acqFx.marca = { x: pcx, y: f, t: 0, kind: 'brasa' }; acqSet(e, 'jogaW', ACQ_JOGA); sfx.acqMira();
  } else if (pick === 'mare') { acqSet(e, 'mareW', ACQ_MARE); acqFx.mare = { on: false, t: 0 }; sfx.acqMareW(); }
  else {
    // o salto: para a plataforma do herói, ou para o chão perto dele, ou para uma plataforma do outro lado
    const cand = [];
    for (const [a, b, ly] of ACQ_LEDGES) { const x0 = acqX(a + 1), x1 = acqX(b), y = acqY(ly); if (Math.abs(pcx - (x0 + x1) / 2) < 8 * T && Math.abs(pl.y + pl.h - y) < 2 * T) cand.push([clamp(pcx + (Math.random() - 0.5) * 2 * T, x0, x1), y]); }
    if (!cand.length && acqOnFloor()) cand.push([clamp(pcx + (Math.random() < 0.5 ? -1 : 1) * 1.5 * T, acqX(-50), acqX(50)), acqY(0)]);
    if (!cand.length) { const L = ACQ_LEDGES[(Math.random() * 4) | 0]; cand.push([acqX((L[0] + L[1]) / 2), acqY(L[2])]); }
    const [mx, my] = cand[0];
    acqFx.marca = { x: mx, y: my, t: 0, kind: 'salto' }; acqSet(e, 'saltoW', ACQ_SALTO); sfx.acqAgacha();
  }
};
// a mão da vara (onde a estocada começa)
const acqHand = e => [e.x + e.w / 2 + e.facing * 5, e.y + 9];

/* ---------- a cada quadro: começar, sair, as lanternas caindo, as poças de fogo, a maré ---------- */
HOOK.update.push(dt => {
  if (!acBoss || !pl || state !== 'play') return;
  if (acqState.dead) return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (!bossFight && !pl.dead && inAcHall(ptx, pty, -6)) acqStart();
  const e = acqE;
  if (!e || !bossFight || !bossFight.ac) return;
  if (!pl.dead && !inAcHall(ptx, pty, 2)) { endBossFight(false); return; }
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
  // as lanternas caindo
  for (let i = acqFalls.length - 1; i >= 0; i--) {
    const F = acqFalls[i]; F.vy = Math.min(F.vy + GRAV * dt, MAXFALL); F.y += F.vy * dt;
    if (solidAt(Math.floor(F.x / T), Math.floor((F.y + 5) / T))) {
      const fy = Math.floor((F.y + 5) / T) * T; acqFalls.splice(i, 1);
      ACM.sparks(F.x, fy - 2, 26, ACM.FOGO, 90, 120, 0.7); shake(2); sfx.acqLanterna();
      if (e && !e.dead && Math.abs(F.x - (e.x + e.w / 2)) < 2 * T + e.w / 2 && Math.abs(fy - acqFeet(e)) < 3 * T) {
        e.hp -= Math.round(e.maxHp * 0.12); e.flash = 0.2; e.showHp = 3; acqSet(e, 'tonto', 2); e.stun = 0; acqFx.marca = null; sfx.acqUrro();
        if (e.hp <= 0) { e.hp = 0; killEnemy(e); return; }
      } else acqFogos.push({ x0: F.x - 1.4 * T, x1: F.x + 1.4 * T, y: fy, t: 4, max: 4, dmg: Math.max(1, Math.round(e.dmg * 0.3)) });
    }
  }
  // o chão queimando
  acqFx.tick = (acqFx.tick || 0) - dt;
  const feet = pl.y + pl.h, pcx = pl.x + pl.w / 2;
  let burnHere = 0;
  for (let i = acqFogos.length - 1; i >= 0; i--) { const P = acqFogos[i]; P.t -= dt; if (P.t <= 0) { acqFogos.splice(i, 1); continue; } if (Math.random() < dt * 14) ACM.sparks(P.x0 + Math.random() * (P.x1 - P.x0), P.y - 1, 1, ACM.FOGO, 8, -50, 0.6); if (pl.onGround && Math.abs(feet - P.y) < 3 && pcx > P.x0 && pcx < P.x1) burnHere = Math.max(burnHere, P.dmg); }
  const M = acqFx.mare;
  if (M) {
    M.t += dt;
    if (M.on) {
      const tx = Math.floor(pcx / T), ty = Math.floor((feet + 2) / T);
      if (pl.onGround && tileAt(tx, ty) === AC_GRELHA) burnHere = Math.max(burnHere, Math.max(1, Math.round(e.dmg * 0.45)));
      if (Math.random() < dt * 40) { const x = acqX(-52 + Math.random() * 104); if (tileAt(Math.floor(x / T), acBoss.fy) === AC_GRELHA) ACM.sparks(x, acqY(0) - 1, 1, ACM.FOGO, 10, -80, 0.7); }
    }
  }
  if (burnHere && acqFx.tick <= 0 && !pl.dead) { acqFx.tick = 0.5; const iv = pl.invuln; pl.invuln = 0; hurtPlayer(burnHere, pcx, null, true); pl.invuln = Math.max(0, iv); ACM.acQueima(Math.max(1, Math.round(burnHere * 0.3)), 1); }
  if (acqFx.marca) acqFx.marca.t += dt;
  // a batida do Grande Braseiro (o coração da sala)
  acqFx.beat -= dt; if (acqFx.beat <= 0 && !acqFx.apagou) { acqFx.beat = 1.6; sfx.acqBraseiro(); }
});
// morrer na luta, usar o portal: tudo volta
HOOK.update.push(() => { if (bossFight && bossFight.ac && pl.dead) endBossFight(false); });
// a Vara: o alvo aceso queima
HOOK.update.push(dt => {
  for (const e of enemies) {
    if (e.dead || !(e.acArde > 0)) continue;
    e.acArde -= dt; e.acArdeT = (e.acArdeT || 0) - dt;
    if (Math.random() < dt * 12) ACM.sparks(e.x + Math.random() * e.w, e.y + Math.random() * e.h, 1, ACM.FOGO, 8, -50, 0.5);
    if (e.acArdeT <= 0) { e.acArdeT = 1; e.hp -= e.acArdeD || 1; e.flash = 0.08; e.showHp = 2; if (e.hp <= 0) { if (e.type === 'acLanterna' || e.type === 'ttLasca') e.hp = 1; else killEnemy(e); } }
  }
});
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.ac) bossFight = null;
  acqE = null; acqLamps.length = 0; acqClear(); acqFx.apagou = false;
  acqState.dead = !!(sv && sv.ultimoAcendedor && sv.ultimoAcendedor.dead);
  if (acqState.dead) acqFx.apagou = true;
  return _nw(sd, sv);
}; }
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.ultimoAcendedor = { dead: acqState.dead };
  if (o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([, t]) => t !== AC_BARREIRA);
  return o;
}; }

/* ================= arte ================= */
const ACQ_ART = {};
{
const { TR, ell, tubo, poly, braco, setO, cp, cg } = ACM;
const BX = 15, FY = 37;
// o Último Acendedor, 34 x 38: o corpo em x 15, os pés na linha 37. A vara vem num desenho à parte (a ponta acende).
// 0 parado, 1-2 andando, 3 a vara recolhida (o aviso), 4 estocando, 5 o braço erguido (jogando), 6 agachado (o salto),
// 7 no ar, 8 tonto (de joelhos)
const POSE = [
  { st: 0, low: 0, fa: [BX + 6, FY - 20], ba: [BX - 5, FY - 16] },
  { st: 1.6, low: 0, fa: [BX + 6, FY - 20], ba: [BX - 5, FY - 15] },
  { st: -1.6, low: 0, fa: [BX + 6, FY - 19], ba: [BX - 5, FY - 17] },
  { st: 0.6, low: 1, fa: [BX + 2, FY - 22], ba: [BX - 2, FY - 20], lean: -1 },
  { st: 2.4, low: 1, fa: [BX + 9, FY - 22], ba: [BX + 4, FY - 21], lean: 2 },
  { st: 0.4, low: 0, fa: [BX + 6, FY - 20], ba: [BX - 3, FY - 31], lean: -0.6 },
  { st: 2, low: 4, fa: [BX + 6, FY - 15], ba: [BX - 5, FY - 12], lean: 1 },
  { st: 2.6, low: 1, fa: [BX + 7, FY - 22], ba: [BX - 6, FY - 24], air: 1 },
  { st: 0, low: 7, fa: [BX + 5, FY - 9], ba: [BX - 4, FY - 8], lean: 1.5 }
];
function ultimo(k) {
  const o = POSE[k], P = cp(34, 38), s = 41601 + k * 9, low = o.low, ln = o.lean || 0, top = FY - 30 + low;
  if (o.ba) braco(P, BX - 2 + ln, top + 9, o.ba[0], o.ba[1], TR.manto, 2, s + 1, 1.3, 1.2);
  // os pés descalços, cinzentos
  for (const [d, b] of [[-1, 1.8], [1, 2.8]]) { const fx = BX + d * 2 + d * o.st; P.line(fx - 1, FY - (o.air && d > 0 ? 3 : 0), fx + 2, FY - (o.air && d > 0 ? 3 : 0), TR.pele, b); }
  // o manto comprido de brasa apagada: preto em cima, a barra larga de brasa embaixo que ainda brilha nas bordas
  const sh = top + 8, hem = FY - 1;
  poly(P, [[BX - 4 + ln, sh - 1], [BX + 4 + ln, sh - 1], [BX + 7 + o.st * 0.4, hem], [BX - 7 - o.st * 0.4, hem]], TR.manto,
    (x, y) => 2.2 + (BX - x) * 0.07 + (y < sh + 2 ? 0.8 : 0) + (Math.abs(Math.sin((x - ln * (hem - y) / 20) * 1.4)) < 0.22 ? -0.8 : 0) + cg(x, y, s) * 0.4);
  for (let y = hem - 5; y <= hem; y++) for (let x = Math.floor(BX - 7 - o.st * 0.4); x <= BX + 7 + o.st * 0.4; x++) {
    const u = (y - (hem - 5)) / 5; if (hash2(x, y, s) < 0.15 + u * 0.2) continue;
    P.put(x, y, TR.barra, 1.6 + u * 2 + (hash2(x, y + 1, s) < 0.25 ? 1.4 : 0));
  }
  // o cinto de pavios trançados, a estola de bronze com os sóis
  for (let x = BX - 4.6; x <= BX + 4.6; x += 0.5) P.put(x + ln * 0.6, sh + 8, TR.cera, 2.6 + (Math.floor(x * 2) % 2));
  for (let y = sh; y < sh + 13; y++) { P.put(BX + 1.6 + ln * (1 - (y - sh) / 13), y, TR.bronze, (y - sh) % 4 === 1 ? 5 : 3); }
  // a cabeça: o capuz alto, a máscara de sol de bronze (raios em volta), os olhos de brasa pelos furos
  const hx = BX + 1 + ln, hy = top + 4;
  ell(P, hx - 0.8, hy, 3.6, 4.2, 0.15, TR.manto, s + 2, 2.4); P.line(hx - 3, hy - 3, hx - 5, hy - 6, TR.manto, 2.2);
  for (let a = -1.5; a <= 1.5; a += 0.5) P.line(hx + 1.8 + Math.cos(a) * 2.4, hy + Math.sin(a) * 2.6, hx + 1.8 + Math.cos(a) * 3.8, hy + Math.sin(a) * 4, TR.bronze, 3.4 + (a < 0 ? 1 : 0));
  ell(P, hx + 1.6, hy + 0.2, 2.2, 2.6, 0, TR.bronze, s + 3, 3.6);
  P.put(hx + 2.4, hy - 0.4, TR.brasa, 5); P.put(hx + 0.8, hy - 0.4, TR.brasa, 4); P.put(hx + 1.6, hy + 1.6, TR.manto, 0);
  if (o.fa) braco(P, BX + 2 + ln, sh + 1, o.fa[0], o.fa[1], TR.manto, 3, s + 4, 1.4, 1.2);
  return setO(P.done());
}
// a vara: 3 x 30 de pau preto com ponteira de bronze; a chama da ponta vem no brilho
function vara() {
  const P = cp(4, 32), s = 41691;
  for (let y = 2; y < 31; y++) { P.put(1, y, TR.manto, 3 + (y % 5 === 0 ? 1 : 0) + cg(1, y, s) * 0.4); P.put(2, y, TR.manto, 2); }
  for (let y = 0; y < 4; y++) { P.put(1, y, TR.bronze, 4.4 - y * 0.3); P.put(2, y, TR.bronze, 3); }
  return setO(P.done());
}
// a lanterna de bronze da Fornalha, 10 x 12: o teto em ponta, as grades, o vidro de brasa
function lanterna(lit) {
  const P = cp(10, 12), s = 41695 + (lit ? 1 : 0);
  poly(P, [[5, 0], [9, 3], [1, 3]], TR.bronze, (x, y) => 3 + (x < 5 ? 1 : 0));
  for (let y = 3; y < 10; y++) for (let x = 1; x < 9; x++) { const bar = x === 1 || x === 8 || x === 4 || y === 3 || y === 9; P.put(x, y, bar ? TR.bronze : lit ? TR.brasa : TR.ferro, bar ? 2.6 + (x < 4 ? 1 : 0) : lit ? 4 + (y < 6 ? 1 : 0) - Math.abs(x - 5) * 0.2 + cg(x, y, s) * 0.5 : 1.4); }
  P.line(2, 10, 8, 10, TR.bronze, 3.4); P.put(5, 11, TR.bronze, 2.4);
  return setO(P.done());
}
// o Grande Braseiro: 40 x 22, a bacia larga de bronze sobre três pés de leão, cheia de brasa (a chama vem no desenho)
function braseiro(lit) {
  const P = cp(40, 22), s = 41697 + (lit ? 1 : 0);
  for (const fx0 of [6, 20, 33]) { tubo(P, fx0, 12, fx0 + (fx0 < 20 ? -2 : fx0 > 20 ? 2 : 0), 20, 1.4, 1.1, TR.bronze, 2.8, s + fx0); ell(P, fx0 + (fx0 < 20 ? -2 : fx0 > 20 ? 2 : 0), 20.4, 2, 1.2, 0, TR.bronze, s + fx0 + 1, 3.4); }
  poly(P, [[1, 4], [39, 4], [33, 13], [7, 13]], TR.bronze, (x, y) => 2.4 + (y - 4) * -0.14 + (x < 20 ? 0.6 : 0) + (Math.abs(x - 20) % 6 < 1 ? 1.2 : 0) + cg(x, y, s) * 0.5);
  for (let x = 1; x < 39; x++) { P.put(x, 4, TR.bronze, 4.6); P.put(x, 5, TR.bronze, 3.6); }
  for (let x = 3; x < 37; x++) { const h = 1 + Math.round(hash2(x, 1, s) * 2); for (let y = 4 - h; y < 4; y++) P.put(x, y, lit ? TR.brasa : TR.ferro, lit ? 3.4 + hash2(x, y, s) * 2.4 : 1 + hash2(x, y, s) * 1.4); }
  return setO(P.done());
}
ACQ_ART.get = () => ACQ_ART.ready || (ACQ_ART.ready = { ul: POSE.map((_, k) => ultimo(k)), vara: vara(), lamp: [lanterna(false), lanterna(true)], br: [braseiro(false), braseiro(true)] });
Object.assign(ACQ_ART, { BX, FY });
}

/* ---------- desenho ---------- */
const acqPose = e => e.state === 'varaW' ? 3 : e.state === 'vara' ? 4 : e.state === 'jogaW' ? 5 : e.state === 'saltoW' ? 6 : e.state === 'salto' ? 7 : e.state === 'tonto' ? 8 : Math.abs(e.vx) > 6 && e.onGround ? 1 + Math.floor(e.t * 5) % 2 : 0;
// a vara: o ângulo e onde fica a ponta (a chama)
function acqVara(e) {
  const k = acqPose(e), [hx, hy] = [e.x + e.w / 2 + e.facing * 5, e.y + (k === 8 ? 20 : k === 6 ? 13 : 9)];
  let a;   // ângulo a partir do horizontal para a frente (negativo é para cima)
  if (k === 3) a = -1.9; else if (k === 4) a = e.aimA || 0; else if (k === 5) a = -1.35; else if (k === 8) a = 0.5; else a = -1.45;
  const L = 28, ux = Math.cos(a) * e.facing, uy = Math.sin(a), back = k === 4 ? 6 : 12;
  return { x0: hx - ux * back, y0: hy - uy * back, x1: hx + ux * (L - back), y1: hy + uy * (L - back) };
}
DRAW_E.ultimoAcendedor = (e, fx0, fy0, fl) => {
  const S = ACQ_ART.get(), k = acqPose(e), cx = fx0 - (e.x + e.w / 2), cy = fy0 - (e.y + e.h);
  const V = acqVara(e), n = Math.ceil(Math.hypot(V.x1 - V.x0, V.y1 - V.y0));
  for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(V.x0 + (V.x1 - V.x0) * t + cx), y = Math.round(V.y0 + (V.y1 - V.y0) * t + cy); lc.fillStyle = '#0c0a0a'; lc.fillRect(x - 1, y - 1, 3, 3); }
  for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(V.x0 + (V.x1 - V.x0) * t + cx), y = Math.round(V.y0 + (V.y1 - V.y0) * t + cy); lc.fillStyle = t > 0.9 ? '#a8783a' : i % 5 ? '#3c332c' : '#524438'; lc.fillRect(x, y, 1, 1); }
  ACM.blit(cvPick(S.ul[k], e, fl), e, fx0, fy0 + 0, ACQ_ART.BX + 1, ACQ_ART.FY + 1, ACM.jit(e, e.state === 'varaW' || e.state === 'saltoW', 40));
};
EYES_E.ultimoAcendedor = (e, fx0, fy0) => {
  const V = acqVara(e), cx = fx0 - (e.x + e.w / 2), cy = fy0 - (e.y + e.h), white = e.state === 'varaW' || e.state === 'vara';
  const q = e.state === 'varaW' ? clamp(1 - e.stateT / ACQ_VARA, 0, 1) : 1, g = ACM.gl(white ? 14 : 9, white ? '#fff6e0' : '#ffb050');
  lc.globalAlpha = white ? 0.5 + 0.5 * q : 0.7; lc.drawImage(g, Math.round(V.x1 + cx) - g.width / 2, Math.round(V.y1 + cy) - g.height / 2);
  const h = 3 + Math.sin(e.t * 18) + (white ? 2 * q : 0); lc.globalAlpha = 1;
  lc.fillStyle = white ? '#fff6e0' : '#d86214'; lc.fillRect(Math.round(V.x1 + cx) - 1, Math.round(V.y1 + cy - h), 2, Math.round(h));
  lc.fillStyle = white ? '#ffffff' : '#ffd070'; lc.fillRect(Math.round(V.x1 + cx), Math.round(V.y1 + cy - h + 1), 1, Math.round(h - 1));
  const g2 = ACM.gl(5, '#ff7a1a'); lc.globalAlpha = 0.6; lc.drawImage(g2, Math.round(fx0 + 2.5 * e.facing) - 5, Math.round(fy0 - 34 + (e.state === 'tonto' ? 7 : e.state === 'saltoW' ? 4 : 0)) - 5); lc.globalAlpha = 1;
};
WARN_E.ultimoAcendedor = e => ['varaW', 'jogaW', 'mareW', 'saltoW'].includes(e.state);
DRAW_E.acLanterna = (e, fx0, fy0, fl) => { const img = ACQ_ART.get().lamp[1]; lc.drawImage(fl ? img.wr : img.r, Math.round(fx0 - img.r.width / 2), Math.round(fy0 - e.h - 1)); };
EYES_E.acLanterna = (e, fx0, fy0) => { const g = ACM.gl(12, '#ffb050'); lc.globalAlpha = 0.6 + 0.15 * Math.sin(gameTime * 6 + e.homeX); lc.drawImage(g, Math.round(fx0) - 12, Math.round(fy0 - e.h / 2) - 12); lc.globalAlpha = 1; };
WARN_E.acLanterna = () => false;

// a sala: as correntes das lanternas, o Grande Braseiro e a chama dele, os fios de fogo, a maré, a marca, as poças
HOOK.drawWorld.push((cx, cy) => {
  const B = acBoss; if (!B) return;
  const sx = Math.round((B.cx * T - cx) / (WW * T)) * WW * T;   // o mundo dá a volta
  const X = v => v + sx;
  if (Math.abs(X(B.cx * T) - cx - VW / 2) > VW / 2 + 70 * T) return;
  const S = ACQ_ART.get(), dead = acqState.dead;
  // as correntes do teto até as lanternas (as que caíram: a ponta solta balançando)
  ACQ_LAMPS.forEach(([dx, dy], k) => {
    const x = Math.round(X((B.cx + dx + 0.5) * T) - cx), u = (dx + 0.5) / 52, y0 = Math.round((B.fy - B.h + 1 + 7 * u * u) * T - cy);
    const L = acqLamps.find(l => Math.abs(l.homeX - (B.cx + dx + 0.5) * T) < 2);
    const yl = Math.round((B.fy + dy) * T - cy) - 6, on = L && !L.dead && bossFight && bossFight.ac;
    const end = on || (!bossFight && !dead) ? yl : y0 + 3 * T + Math.round(Math.sin(gameTime * 1.3 + k) * 2);
    for (let y = y0; y < end; y++) { lc.fillStyle = (y - y0) % 3 === 0 ? '#66666e' : '#36363c'; lc.fillRect(x + ((y - y0) % 6 < 3 ? 0 : 0), y, 1, 1); }
    if (!on && !dead && !bossFight) { const img = S.lamp[1].r; lc.drawImage(img, x - 5, yl); }
  });
  // o Grande Braseiro no estrado
  const lit = !dead && !acqFx.apagou, img = S.br[lit ? 1 : 0].r, bx = Math.round(X(B.cx * T) - cx) - 20, by = Math.round((B.fy - 2) * T - cy) - 22;
  lc.drawImage(img, bx, by);
  // as lanternas caídas, apagadas, depois da vitória
  if (dead) for (const [dx] of ACQ_LAMPS) { const im = S.lamp[0].r; lc.drawImage(im, Math.round(X((B.cx + dx + 0.5) * T) - cx) - 5, Math.round(B.fy * T - cy) - 11); }
  // as poças de fogo
  for (const P of acqFogos) for (let x = Math.round(P.x0); x < P.x1; x += 2) { const h = 2 + Math.round(hash2(x, Math.floor(gameTime * 8), 5) * 3 * Math.min(1, P.t)); lc.fillStyle = hash2(x, 3, Math.floor(gameTime * 6)) < 0.5 ? '#d86214' : '#f6962a'; lc.fillRect(X(x) - cx, Math.round(P.y - cy) - h, 2, h); }
});
HOOK.drawGlow.push((cx, cy) => {
  const B = acBoss; if (!B) return;
  const sx = Math.round((B.cx * T - cx) / (WW * T)) * WW * T, X = v => v + sx;
  if (Math.abs(X(B.cx * T) - cx - VW / 2) > VW / 2 + 70 * T) return;
  // a chama do Grande Braseiro
  if (!acqState.dead && !acqFx.apagou) {
    const x = Math.round(X(B.cx * T) - cx), y = Math.round((B.fy - 2) * T - cy) - 24;
    const g = ACM.gl(40, '#ff8a2a'); lc.globalAlpha = 0.55 + 0.1 * Math.sin(gameTime * 4); lc.drawImage(g, x - 40, y - 40);
    for (let i = 0; i < 14; i++) { const fx1 = x - 16 + i * 2.4, h = 6 + 8 * Math.abs(Math.sin(gameTime * (3 + i % 4) + i * 1.7)); lc.globalAlpha = 0.9; lc.fillStyle = '#d86214'; lc.fillRect(Math.round(fx1), Math.round(y - h + 2), 2, Math.round(h)); lc.fillStyle = '#ffd070'; lc.fillRect(Math.round(fx1), Math.round(y - h * 0.6 + 2), 1, Math.round(h * 0.6)); }
  }
  // os fios de fogo das lanternas acesas até ele
  const e = acqE;
  if (e && !e.dead) for (const l of acqLamps) {
    if (l.dead) continue;
    const ax = l.x + l.w / 2, ay = l.y + l.h / 2, bx = e.x + e.w / 2, by = e.y + 10, n = Math.ceil(Math.hypot(bx - ax, by - ay) / 3);
    for (let i = 0; i < n; i++) { const t = i / n, w = Math.sin(t * Math.PI) * 6 * Math.sin(gameTime * 3 + i * 0.4), x = ax + (bx - ax) * t, y = ay + (by - ay) * t + w; if (hash2(i, Math.floor(gameTime * 16), 9) < 0.55) { lc.globalAlpha = 0.7; lc.fillStyle = i % 3 ? '#f6962a' : '#ffd070'; lc.fillRect(Math.round(x - cx), Math.round(y - cy), 1, 1); } }
  }
  // as lanternas caindo
  for (const F of acqFalls) { const g = ACM.gl(12, '#ffb050'); lc.globalAlpha = 0.8; lc.drawImage(g, Math.round(F.x - cx) - 12, Math.round(F.y - cy) - 12); }
  // a maré: as grelhas acendem do meio para fora
  const M = acqFx.mare;
  if (M) {
    const r = M.on ? 60 : 53 * clamp(M.t / ACQ_MARE, 0, 1);
    for (let dx = -52; dx <= 51; dx++) {
      if (Math.abs(dx + 0.5) > r || tileAt(B.cx + dx, B.fy) !== AC_GRELHA) continue;
      const x = Math.round(X((B.cx + dx) * T) - cx), y = Math.round(B.fy * T - cy);
      lc.globalAlpha = M.on ? 0.6 + 0.3 * Math.sin(gameTime * 20 + dx) : 0.25 + 0.3 * Math.sin(gameTime * 14 + dx);
      lc.fillStyle = M.on ? '#ffb050' : '#d86214'; lc.fillRect(x, y - 1, T, 3);
      if (M.on) { const h = 4 + 6 * Math.abs(Math.sin(gameTime * 9 + dx * 1.3)); lc.fillStyle = '#f6962a'; lc.fillRect(x + 3, Math.round(y - h), 2, Math.round(h)); lc.fillRect(x + 8, Math.round(y - h * 0.7), 2, Math.round(h * 0.7)); }
    }
  }
  // a marca: um círculo de brasa no chão onde a brasa (ou ele) vai cair
  const K = acqFx.marca;
  if (K) {
    const q = clamp(K.t / (K.kind === 'salto' ? ACQ_SALTO : ACQ_JOGA), 0, 1), R = (K.kind === 'salto' ? 2.6 : 1.6) * T * (1.4 - q * 0.4);
    lc.globalAlpha = 0.4 + 0.5 * q; lc.fillStyle = q > 0.7 ? '#fff0c0' : '#ff9a3a';
    for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; lc.fillRect(Math.round(K.x + Math.cos(t) * R - cx), Math.round(K.y - 1 + Math.sin(t) * R * 0.25 - cy), 2, 1); }
  }
  for (const P of acqFogos) { const g = ACM.gl(10, '#ff8a2a'); lc.globalAlpha = 0.35 * Math.min(1, P.t); for (let x = P.x0; x < P.x1; x += 10) lc.drawImage(g, Math.round(x - cx) - 10, Math.round(P.y - cy) - 14); }
  lc.globalAlpha = 1;
});
// a luz: o Grande Braseiro (até ele apagar), as lanternas, o chão queimando
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const B = acBoss; if (!B) return;
  if (!acqState.dead && !acqFx.apagou) { addL(B.cx * T, (B.fy - 4) * T, 1); addL((B.cx - 10) * T, (B.fy - 8) * T, 0.8); addL((B.cx + 10) * T, (B.fy - 8) * T, 0.8); }
  if (bossFight && bossFight.ac) for (const l of acqLamps) { if (!l.dead) addL(l.x + l.w / 2, l.y + l.h / 2, 0.8); }
  else if (!acqState.dead) for (const [dx, dy] of ACQ_LAMPS) addL((B.cx + dx + 0.5) * T, (B.fy + dy) * T, 0.8);
  for (const P of acqFogos) addL((P.x0 + P.x1) / 2, P.y - 6, 0.6);
  if (acqFx.mare && acqFx.mare.on) for (let dx = -48; dx <= 48; dx += 6) addL((B.cx + dx) * T, (B.fy - 1) * T, 0.6);
  // A Vara do Último Acendedor ilumina em volta de quem a carrega
  if (pl && pl.lg && pl.lg.vara) addL(pl.x + pl.w / 2, pl.y + 4, 0.7);
}; }

/* ---------- A Vara do Último Acendedor ---------- */
STAT_DEF.lgVara = { t: 'Todo golpe acende o alvo, que queima por 3 s; a vara ilumina em volta de quem a carrega', flag: 1 };
STAT_KEYS.push('lgVara');
ITEMS.vara_acendedor = {
  name: 'A Vara do Último Acendedor', slot: 'weapon', kind: 'spear', rar: 4,
  pal: { w: '#fff6e0', W: '#ffb050', l: '#6e1e06', g: '#3c332c', G: '#1a1614', h: '#2a2420', p: '#a8783a' },
  legend: [['lgVara', 1], ['light', 3], ['dmgPct', 0.12]],
  desc: 'A vara de pavio do mestre da guilda, a que acendeu o primeiro braseiro da cidade. A ponta ainda arde, e tudo o que ela toca pega fogo.'
};
BASE_INFO.vara_acendedor = [ACQ_L, 0.95];
ITEM_G.vara_acendedor = 1; ITEMS.vara_acendedor.g = 1;
acqDrops();
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgVara || 0;
  if (!pl.lg) pl.lg = {}; pl.lg.vara = b > 0;
  return r;
}; }

/* ---------- som ---------- */
Object.assign(sfx, {
  acqAcorda() { tone(70, 2, 'sawtooth', 0.04, 40); noise(2, 0.08, 400, 'lowpass', 0, 0.6); for (let k = 0; k < 4; k++) noise(0.3, 0.05, 900 + k * 200, 'bandpass', 0.3 + k * 0.35, 2); },
  acqGrade() { for (let k = 0; k < 5; k++) { noise(0.12, 0.08, 700 + k * 90, 'bandpass', k * 0.08, 2); tone(140 + k * 10, 0.15, 'square', 0.015, -30, k * 0.08); } },
  acqVaraW() { tone(800, 0.6, 'sine', 0.012, 900); noise(0.6, 0.03, 3000, 'highpass', 0, 1); },
  acqEstoca() { noise(0.25, 0.1, 900, 'bandpass', 0, 1); tone(300, 0.2, 'sawtooth', 0.02, -150); },
  acqMira() { tone(500, 0.9, 'triangle', 0.01, 300); },
  acqBrasa() { noise(0.4, 0.12, 500, 'lowpass', 0, 1); tone(90, 0.3, 'sine', 0.05, -40); },
  acqMareW() { tone(60, 1.5, 'sawtooth', 0.04, 60); noise(1.5, 0.06, 600, 'lowpass', 0, 0.8); },
  acqMare() { noise(1, 0.14, 800, 'lowpass', 0, 0.8); noise(0.8, 0.05, 2400, 'bandpass', 0.1, 1); },
  acqAgacha() { tone(110, 0.8, 'sawtooth', 0.025, 60); },
  acqSalta() { noise(0.3, 0.08, 600, 'bandpass', 0, 1); },
  acqCai() { tone(50, 0.5, 'sine', 0.1, -20); noise(0.5, 0.14, 300, 'lowpass', 0, 1); },
  acqCorta() { tone(1600, 0.15, 'sine', 0.03, -500); noise(0.1, 0.06, 3500, 'highpass'); },
  acqLanterna() { noise(0.5, 0.12, 700, 'lowpass', 0, 1); for (let k = 0; k < 4; k++) tone(1200 + k * 300, 0.12, 'sine', 0.012, -300, k * 0.05); },
  acqUrro() { tone(90, 1.2, 'sawtooth', 0.05, -30); noise(1.2, 0.08, 500, 'lowpass', 0, 0.6); },
  acqApaga() { noise(2, 0.1, 400, 'lowpass', 0, 0.5); tone(80, 2, 'sine', 0.04, -40); },
  acqBraseiro() { tone(48, 0.35, 'sine', 0.035, -10); noise(0.4, 0.03, 300, 'lowpass', 0.05, 1); },
  acqMorte() { tone(60, 3, 'sawtooth', 0.05, -25); noise(3, 0.1, 400, 'lowpass', 0, 0.5); for (let k = 0; k < 8; k++) noise(0.2, 0.05, 1200 + k * 200, 'bandpass', 0.5 + k * 0.25, 2); }
});
