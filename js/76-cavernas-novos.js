'use strict';

/* ================= três bichos novos das Cavernas (a camada fica com 10) =================
   O fungo esporento, que parece um cogumelo grande do cenário até o herói chegar perto: incha e solta uma nuvem
   de esporos que envenena quem fica dentro. A centopeia das rochas, que corre pelo chão, pelas paredes e pelo
   teto atrás do herói, morde de qualquer lado e se solta do teto quando ele passa embaixo. O goblin dinamiteiro,
   com lampião no capacete, que mantém distância e joga dinamite de pavio aceso: explode depois de um tempo,
   fere quem estiver perto (monstro também) e quebra os blocos em volta.
   Mesma arte do 55 (cp, rampas, contorno, cache). Carrega depois do 56/57 (spawn, níveis) e antes do 49 (BAL). */

/* ---------- números ---------- */
Object.assign(ET, {
  fungo: { name: 'Fungo Esporento', w: 12, h: 14, hp: 40, dmg: 7, xp: 10, kb: 0.2, fly: false, blood: '#8ac83a' },
  centopeia: { name: 'Centopeia das Rochas', w: 14, h: 6, hp: 20, dmg: 8, xp: 9, kb: 1.0, fly: true, crawl: true, blood: '#c87a2a' },   // fly: sem a gravidade do laço; ela mesma cai quando se solta
  goblin: { name: 'Goblin Dinamiteiro', w: 8, h: 14, hp: 30, dmg: 16, xp: 14, kb: 0.9, fly: false, blood: '#5a7a3a' }
});

/* ---------- materiais ---------- */
Object.assign(ICON_ART, {
  spore: [["...gg....", "..gGGg.g.", ".gGWGGg..", "gGGGGGGg.", ".pPPPPp..", "..pPPp..g", "...pp....", "...pp...."], { g: '#3a5a1a', G: '#9ad83a', W: '#eaffb0', p: '#5a3a5a', P: '#a87aa8' }],
  centLeg: [[".......oo", "......oOo", ".....oOo.", "....oOo..", "...oOo...", "..oOo....", ".oOo.....", "oo......."], { o: '#5a2a0a', O: '#d88a3a' }],
  powder: [["...kk....", "..kWk....", ".dDDDd...", "dDDdDDd..", "dDDDDDd..", "dDdDDDd..", ".dDDDd...", "..ddd...."], { k: '#2a1a0a', W: '#e8d8b0', d: '#3a3430', D: '#7a7468' }]
});
Object.assign(ITEMS, {
  esporo: { name: 'Esporo Luminoso', rar: 1, stack: 99, icon: 'spore', desc: 'Brilha verde no escuro. A Marta faz xarope com isso. Material.' },
  pata_centopeia: { name: 'Patas de Centopeia', rar: 0, stack: 99, icon: 'centLeg', desc: 'Um punhado de patinhas duras que ainda mexem. Material.' },
  polvora: { name: 'Pólvora', rar: 1, stack: 99, icon: 'powder', desc: 'Um saquinho do goblin. Longe da forja. Material.' }
});
Object.assign(DROPS, {
  fungo: [['esporo', 0.55, 1, 2], ['pocao', 0.06], ['capuz', 0.02], ['amuleto', 0.01]],
  centopeia: [['pata_centopeia', 0.5, 1, 3], ['glandula', 0.12], ['pocao', 0.05], ['botas_couro', 0.03]],
  goblin: [['polvora', 0.5, 1, 2], ['tocha', 0.3, 1, 3], ['pocao', 0.08], ['adaga_ferro', 0.03], ['anel_vida', 0.012]]
});
Object.assign(NAV_WALKERS, { fungo: 1, goblin: 1 });
Object.assign(CV_STEP, { fungo: 1, goblin: 1 });

/* ================= arte ================= */
const CVN = {};
{
const { RB, cp, set } = CVB, { cg } = CVART;
const R7 = hexes => hexes.map(h => ph(h));
const RN = {
  chapeu: R7(['#1e0c22', '#341634', '#4e2250', '#6c326c', '#8a4688', '#a862a2', '#c886bc']),
  lamela: R7(['#140a10', '#24141c', '#382430', '#4c3642', '#624a56', '#7a606c', '#947a84']),
  talo: R7(['#3a3428', '#5a5240', '#7a705a', '#9a8e74', '#b8ac8e', '#d2c8aa', '#ece4c8']),
  esporo: R7(['#1a2a08', '#2e4a10', '#4a7018', '#6a9a22', '#8ac83a', '#b0e860', '#e0ffa0']),
  seg: R7(['#1a0a04', '#2e1408', '#4a220c', '#6a3412', '#8a481a', '#aa6026', '#c87a3a']),
  segL: R7(['#3a1a08', '#5a2a0e', '#7a3e16', '#a05a22', '#c87a32', '#e09a4a', '#f4bc6a']),
  perna: R7(['#140804', '#24100a', '#3a1c10', '#542a16', '#6e3a1e', '#8a4e2a', '#a8663a']),
  cab: R7(['#100604', '#1e0c08', '#30140c', '#441e12', '#5a2a18', '#723a22', '#8c4c2e']),
  pele: R7(['#141a10', '#22301a', '#344628', '#4a5e38', '#62784a', '#7c925e', '#9cae78']),
  couro: R7(['#140c06', '#22160c', '#342214', '#4a321e', '#62442a', '#7c5838', '#98704a']),
  calca: R7(['#0e0c0a', '#1a1614', '#2a2420', '#3c342e', '#504640', '#665a52', '#7e7066']),
  bota: R7(['#080604', '#120e0a', '#1e1810', '#2c2418', '#3c3222', '#4e422e', '#62543c']),
  metal: R7(['#14161a', '#22262c', '#343a42', '#4a525c', '#646e78', '#828c96', '#a8b2bc']),
  lamp: R7(['#402008', '#704010', '#a06818', '#d09428', '#f0c048', '#ffe080', '#fff8d0']),
  dina: R7(['#2a0606', '#480c0a', '#6a1410', '#8e2018', '#b03024', '#d04a36', '#ec7a5a']),
  olhoG: R7(['#3a2a04', '#5a4208', '#806010', '#a8841a', '#d0aa28', '#f0d048', '#fff4a0'])
};

/* o fungo, 16 x 16 de frente para a direita: 0 parado, 1 andando, 2 inchando, 3 soltando os esporos (chapéu achatado) */
function fungus(pose) {
  const P = cp(16, 16), s = 7101 + pose, sw = pose === 2 ? 1 : 0, sq = pose === 3 ? 1 : 0, f = pose === 1 ? 1 : 0;
  P.line(6, 14.4, 4.4 - f, 15.4, RN.talo, 2.4); P.line(10, 14.4, 11.6 + f, 15.4, RN.talo, 2.4);   // raízes que servem de pé
  P.blob(8, 11.6, 2.7 + sw * 0.4, 3.8, RN.talo, s, 3.4, (x, y) => hash2(x, y, s) < 0.15 ? -0.8 : 0);   // o pé
  const cy = 6.4 + sq * 1.3 - sw * 0.5, rx = 7 + sw * 0.7 + sq * 0.4, ry = 4 + sw * 0.6 - sq * 0.9;
  P.blob(8, cy, rx, ry, RN.chapeu, s + 1, 3.4 + sw * 0.6, (x, y, dx, dy) => dy > 0.4 ? -1.8 : 0);   // o chapéu, mais escuro por baixo
  for (let x = 3; x < 14; x += 2) P.put(x, cy + ry * 0.62, RN.lamela, 2);   // lamelas
  for (const [x, y] of [[5, -2.2], [9, -2.8], [11.6, -0.8], [6.8, -0.4], [3, 0]]) P.put(x, cy + y * (ry / 4), RN.talo, 5.6);   // pintas
  P.put(9.6, 10, RN.esporo, 5); P.put(7.4, 10, RN.esporo, 4);   // olhos miúdos debaixo do chapéu
  if (pose >= 2) for (const [x, y] of [[2, cy - 3], [13, cy - 2], [8, cy - 5.4], [1, cy + 1], [14.4, cy + 1.4]]) P.put(x, y, RN.esporo, pose === 3 ? 6 : 4.6);
  return set(P.done());
}
/* a centopeia, 24 x 9 de frente para a direita: 0-1 andando, 2 mordendo (cabeça erguida, presas abertas) */
function centipede(k) {
  const P = cp(24, 9), s = 7201 + k * 7, bite = k === 2, wav = x => Math.sin(x * 0.45 + k * 1.6) * 0.45;
  P.line(1.6, 3.4, 0, 1.6, RN.segL, 3.4); P.line(1.6, 4.6, 0, 6, RN.segL, 3.4);   // as pinças do rabo
  for (let i = 0; i < 7; i++) { const x = 3.2 + i * 2.6, o = ((i + k) % 2 ? 1 : -1) * 0.9; P.line(x, 5.6, x - 1 + o, 8.4, RN.perna, 2.2); P.line(x + 1, 5.6, x + 1.6 - o, 8.4, RN.perna, 3.8); }   // patas
  for (let x = 1; x <= 19; x++) {   // o corpo: um tubo de gomos, claro em cima, com uma risca escura entre um gomo e outro
    const seam = (x - 1) % 3 === 2, top = 2.2 + wav(x), bot = 5.6 + wav(x);
    for (let y = Math.floor(top); y <= Math.ceil(bot); y++) {
      const t = (y + 0.5 - top) / (bot - top); if (t < 0 || t > 1) continue;
      P.put(x, y, seam ? RN.cab : t < 0.3 ? RN.segL : RN.seg, (seam ? 1.4 : t < 0.3 ? 4.4 - t * 3 : 4.4 - t * 2.4) + cg(x, y, s) * 0.4);
    }
  }
  const hy = bite ? 2.8 : 3.6;
  P.blob(21, hy, 2.5, 2.2, RN.cab, s + 20, 3.8);
  P.line(21.2, hy - 1.8, 23.6, hy - 3.6, RN.segL, 4); P.line(20.4, hy - 1.8, 21.6, hy - 3.8, RN.segL, 3.4);   // antenas
  P.put(22.2, hy - 0.8, RB.olho, 5.5);
  P.line(22.6, hy + 1.2, 23.8, hy + (bite ? 2.8 : 1.8), RB.osso, 5); if (bite) P.line(22.6, hy, 23.8, hy - 1.2, RB.osso, 5);   // presas
  return set(P.done());
}
/* o goblin, 16 x 19 de frente para a direita: 0 parado, 1-2 andando, 3 acendendo (dinamite atrás da cabeça), 4 arremesso */
function goblin(pose) {
  const P = cp(16, 19), s = 7301 + pose, w = pose === 1 ? 1 : pose === 2 ? -1 : 0;
  P.blob(4, 11, 1.8, 2.6, RN.couro, s + 1, 2.4);   // mochila
  for (const x of [3, 4.2]) P.line(x, 8, x, 9.4, RN.dina, 4);   // dinamite na mochila
  if (pose === 4) P.line(6.4, 10, 4.2, 12.4, RN.pele, 3);   // o outro braço, para trás no arremesso
  P.line(6.6, 14, 6.6 - w, 17.4, RN.calca, 2.8); P.line(9, 14, 9 + w, 17.4, RN.calca, 3.6);   // pernas
  P.put(6.6 - w, 18, RN.bota, 3); P.put(7.6 - w, 18, RN.bota, 3.6); P.put(9 + w, 18, RN.bota, 3.4); P.put(10 + w, 18, RN.bota, 4);   // botas
  P.blob(7.8, 12, 2.8, 2.6, RN.couro, s, 3.4, (x, y) => hash2(x, y, s) < 0.12 ? -0.9 : 0);   // túnica de couro
  for (let x = 5; x <= 10; x++) P.put(x, 13.8, RN.bota, 2.2); P.put(9.4, 13.8, RN.lamp, 3);   // cinto e fivela
  P.line(6, 6.4, 2, 4.2, RN.pele, 4.2); P.line(6, 7.2, 2.4, 5.2, RN.pele, 3.4); P.put(1.6, 3.8, RN.pele, 3.6);   // orelhona pontuda
  P.blob(9.2, 7, 3.8, 3.1, RN.pele, s + 2, 4.2);   // a cabeçona
  P.line(12.6, 6.6, 14.6, 8, RN.pele, 5); P.put(14.2, 8.4, RN.pele, 3.6); P.put(13.2, 7.6, RN.pele, 4.4);   // narigão comprido
  P.put(11.2, 6, RB.osso, 6); P.put(12, 6, RN.olhoG, 6); P.put(11.4, 5.2, RN.pele, 2);   // olho (com a sobrancelha)
  for (let x = 10.4; x <= 12.6; x++) P.put(x, 9, RN.cab, 0.6); P.put(11, 9, RB.osso, 6); P.put(12.2, 9, RB.osso, 5.4);   // bocarra com dentes
  P.blob(9, 3.6, 3.6, 1.8, RN.metal, s + 3, 3.8, (x, y, dx, dy) => dy > 0.35 ? -1.2 : 0);   // capacete de minerador
  for (let x = 5; x <= 13; x++) P.put(x, 4.8, RN.metal, 2.4);   // aba
  P.put(12.4, 2.6, RN.lamp, 6); P.put(12.4, 3.6, RN.lamp, 4.6); P.put(13.2, 3, RN.lamp, 5.4);   // o lampião
  if (pose === 3) { P.line(7.6, 10, 5, 6.4, RN.pele, 4); P.line(3.8, 6.4, 5.4, 4.4, RN.dina, 4.6); }   // braço para trás com a dinamite
  else if (pose === 4) P.line(7.6, 10, 12.8, 9.2, RN.pele, 4);   // braço esticado na frente
  else P.line(8, 10, 8.6 + w * 0.6, 13.4, RN.pele, 4);
  return set(P.done());
}
CVN.get = () => CVN.ready || (CVN.ready = {
  fungo: [0, 1, 2, 3].map(fungus),
  cent: [0, 1, 2].map(centipede),
  goblin: [0, 1, 2, 3, 4].map(goblin)
});
}

/* ================= desenho ================= */
DRAW_E.fungo = (e, fx, fy, fl) => {
  const B = CVN.get().fungo, k = e.state === 'swell' ? 2 : e.state === 'puff' ? 3 : Math.abs(e.vx) > 3 && e.onGround ? Math.floor(e.t * 5) % 2 : 0;
  const j = e.state === 'swell' ? Math.round(Math.sin(e.t * 40) * 0.6) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 9 + j, fy - 17);
};
// a centopeia fica com os pés na superfície em que está agarrada: chão, teto ou parede
DRAW_E.centopeia = (e, fx, fy, fl) => {
  const B = CVN.get().cent, k = e.state === 'bite' ? 2 : Math.hypot(e.vx, e.vy) > 8 ? Math.floor(e.t * 14) % 2 : 0, side = e.side || 'down';
  const mv = e.mv || [e.facing, 0];
  let a = 0, vf = e.facing, cx = fx, cy = fy - 4.5;
  if (side === 'up') { a = Math.PI; vf = -(Math.sign(mv[0]) || e.facing); cy = fy - e.h + 4.5; }
  else if (side === 'left') { a = Math.PI / 2; vf = mv[1] < 0 ? -1 : 1; cx = fx - e.w / 2 + 4.5; cy = fy - e.h / 2; }
  else if (side === 'right') { a = -Math.PI / 2; vf = mv[1] < 0 ? 1 : -1; cx = fx + e.w / 2 - 4.5; cy = fy - e.h / 2; }
  else if (side === 'air') { a = Math.sin(e.t * 9) * 0.5; cy = fy - e.h / 2; }
  const S = B[k], img = vf > 0 ? (fl ? S.wr : S.r) : (fl ? S.wl : S.l);
  cvRot(img, Math.round(cx), Math.round(cy), a);
};
DRAW_E.goblin = (e, fx, fy, fl) => {
  const B = CVN.get().goblin, k = e.state === 'light' ? 3 : e.state === 'throw' ? 4 : Math.abs(e.vx) > 6 && e.onGround ? 1 + (Math.floor(e.t * 9) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 9, fy - 20);
  if (e.state === 'light' && Math.random() < 0.7) { lc.fillStyle = Math.random() < 0.5 ? '#ffe080' : '#ff9a3a'; lc.fillRect(fx - e.facing * 5 - 1 + ((Math.random() * 3) | 0), fy - 18 - ((Math.random() * 2) | 0), 1, 1); }
};
const CVN_GLOW = { lamp: glow(14, '#ffc860'), spore: glow(10, '#9ae040'), boom: glow(40, '#ffa040') };
EYES_E.fungo = (e, fx, fy) => { if (e.state !== 'swell' && e.state !== 'puff' && !e.awake) return; lc.globalAlpha = 0.5; lc.drawImage(SPR.glow.eye, fx - 6 + e.facing * 1, fy - 13); };
EYES_E.centopeia = () => { };
EYES_E.goblin = (e, fx, fy) => { lc.globalAlpha = 0.55; lc.drawImage(SPR.glow.eye, fx + e.facing * 3 - 6, fy - 25); };
WARN_E.fungo = e => e.state === 'swell';
WARN_E.centopeia = () => false;
WARN_E.goblin = e => e.state === 'light';

/* ================= comportamento ================= */
// o fungo: parado como um cogumelo do cenário; perto do herói incha e solta a nuvem; anda devagar, quase não persegue
const fgClouds = [];
let fgPoisonT = 0, fgPoisonDmg = 1, fgTick = 0;
AI.fungo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'swell') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { fgPuff(e); e.state = 'puff'; e.stateT = 0.6; } return; }
  if (e.state === 'puff') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 3.2 + Math.random(); } return; }
  if (aggro && dist < 70) e.awake = true;
  let dir = 0;
  if (e.awake && aggro && Math.abs(dx) > 22) dir = Math.sign(dx);
  if (dir) e.facing = dir;
  walk(e, dt, dir, 12 + e.lvl, 300, 0, dy, false);
  if (e.awake && aggro && dist < 44 && e.atkCD <= 0 && e.onGround && clearPath(e, pl)) { e.state = 'swell'; e.stateT = 0.75; sfx.fgSwell(); }
};
function fgPuff(e) {
  fgClouds.push({ x: e.x + e.w / 2, y: e.y + e.h - 7, r: 4, R: 30, life: 3.4, max: 3.4, dmg: Math.max(1, Math.round(e.dmg * 0.4)) });
  burst(e.x + e.w / 2, e.y + 4, 14, '#9ad83a', 70, -20, 0.8, 1, true); sfx.fgPuff();
}
// a centopeia: anda grudada no que for sólido e vai atrás do herói; no teto, solta-se quando ele passa embaixo
function cpContacts(e) { return { down: rectSolid(e.x, e.y + 1, e.w, e.h), up: rectSolid(e.x, e.y - 1, e.w, e.h), left: rectSolid(e.x - 1, e.y, e.w, e.h), right: rectSolid(e.x + 1, e.y, e.w, e.h) }; }
AI.centopeia = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const C = cpContacts(e), any = C.down || C.up || C.left || C.right, sp = 74 + e.lvl * 4, ecx = e.x + e.w / 2;
  if (!pl.dead && e.atkCD <= 0 && overlap({ x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 4 }, pl)) {   // a mordida, de qualquer lado
    const r = hurtPlayer(e.dmg, ecx, e, false); e.atkCD = 0.9; e.state = 'bite'; e.stateT = 0.25; if (r !== 'none') sfx.cpBite();
  }
  if (e.state === 'fall') {
    e.side = 'air'; e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); e.vx = approach(e.vx, 0, 120 * dt);
    if ((C.down || e.onGround) && e.vy >= 0) { e.state = 'walk'; e.vy = 0; burst(ecx, e.y + e.h, 4, '#7a5a3a', 40, 200, 0.3); }
    return;
  }
  if (!any) {   // perdeu a superfície: dá a volta na quina por um instante e, se não achar nada, cai
    e.cornerT = (e.cornerT || 0) - dt;
    if (e.lastN && e.cornerT > 0) { const [nx, ny] = e.lastN, [mx, my] = e.mv || [0, 0]; e.vx = nx * sp * 0.7 - mx * sp * 0.6; e.vy = ny * sp * 0.7 - my * sp * 0.6; return; }
    e.state = 'fall'; e.lastN = null; return;
  }
  e.cornerT = 0.3;
  if (e.state === 'bite' && e.stateT > 0) { e.vx *= 0.5; e.vy *= 0.5; return; }
  if (e.state === 'bite') e.state = 'walk';
  // no teto com o herói bem embaixo: solta-se em cima dele
  if (C.up && !C.down && aggro && Math.abs(dx) < 10 && dy > 12 && losClear(ecx, e.y + e.h + 2, pl.x + pl.w / 2, pl.y)) { e.state = 'fall'; e.vy = 30; e.vx = 0; sfx.drop && sfx.drop(); return; }
  if (!aggro) { cvWander(e, dt); }
  const wx = aggro ? (Math.abs(dx) > 4 ? Math.sign(dx) : 0) : e.wander, wy = aggro ? (Math.abs(dy) > 4 ? Math.sign(dy) : 0) : 0;
  let vx = 0, vy = 0, side = C.down ? 'down' : C.up ? 'up' : C.left ? 'left' : 'right';
  if (C.down || C.up) { vx = wx * sp; vy = C.down ? 30 : -30; }
  const wd = C.left ? -1 : C.right ? 1 : 0;
  if (wd && (wx === wd || wx === 0 && wy !== 0 || !(C.down || C.up))) {   // sobe ou desce pela parede
    let my = wy || (C.up ? 1 : -1); if (C.down && my > 0) my = -1; if (C.up && my < 0) my = 1;
    vy = my * sp * 0.85; vx = wd * 30; side = wd < 0 ? 'left' : 'right';
  }
  e.vx = vx; e.vy = vy; e.side = side;
  const n = side === 'down' ? [0, 1] : side === 'up' ? [0, -1] : side === 'left' ? [-1, 0] : [1, 0];
  e.lastN = n;
  if (side === 'down' || side === 'up') { if (vx) { e.facing = Math.sign(vx); e.mv = [Math.sign(vx), 0]; } }
  else if (vy) e.mv = [0, Math.sign(vy) * (Math.abs(vy) > 40 ? 1 : 0)];
  if (side !== 'down' && side !== 'up' && e.mv && e.mv[1] === 0) e.mv = [0, -1];
};
// o goblin: fica longe, acende uma dinamite e joga em arco; foge quando o herói chega perto
const gbBombs = [], gbBooms = [];
const GB_G = 420;
AI.goblin = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'light') { e.vx = approach(e.vx, 0, 800 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { gbThrow(e); e.state = 'throw'; e.stateT = 0.3; e.atkCD = 2.4 + Math.random() * 0.9; } return; }
  if (e.state === 'throw') { e.vx = approach(e.vx, 0, 800 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  if (!aggro) cvWander(e, dt);
  const adx = Math.abs(dx), flee = aggro && adx < 64;
  const dir = aggro ? (adx > 150 ? Math.sign(dx) : flee ? -Math.sign(dx) || 1 : 0) : e.wander;
  if (aggro && !flee) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  walk(e, dt, dir, (flee ? 62 : 44) + e.lvl * 2, 700, 260, dy, aggro && dir === Math.sign(dx));
  if (aggro && !flee && dist < 190 && e.atkCD <= 0 && e.onGround && losClear(e.x + e.w / 2, e.y + 2, pl.x + pl.w / 2, pl.y + 4)) { e.state = 'light'; e.stateT = 0.55; e.facing = Math.sign(dx) || e.facing; sfx.gbFuse(); }
};
function gbThrow(e) {
  const ox = e.x + e.w / 2 + e.facing * 3, oy = e.y + 2, tx = pl.x + pl.w / 2 + rnd(-10, 10), ty = pl.y + pl.h - 3;
  const t = clamp(Math.abs(tx - ox) / 140, 0.45, 1.1);
  gbBombs.push({ x: ox, y: oy, vx: (tx - ox) / t, vy: (ty - oy - 0.5 * GB_G * t * t) / t, fuse: 1.7, dmg: e.dmg, spin: 0 });
  sfx.pswing && sfx.pswing();
}
const GB_SAFE = t => DIG[t] > 0 && DIG[t] <= 1.2 && t !== TORCH;
const gbHall = (x, y) => (typeof inTeiaHall === 'function' && inTeiaHall(x, y, -3)) || (typeof inYetiHall === 'function' && inYetiHall(x, y, -3)) || (typeof inThroneHall === 'function' && inThroneHall(x, y, -3));
function gbBoom(b) {
  const R = 30;
  gbBooms.push({ x: b.x, y: b.y, t: 0.35 });
  burst(b.x, b.y, 26, '#ffb040', 160, 120, 0.5, 1, true); burst(b.x, b.y, 16, '#4a4440', 70, -40, 1.1, 2);
  shake(5); sfx.gbBoom();
  if (!pl.dead && Math.hypot(pl.x + pl.w / 2 - b.x, pl.y + pl.h / 2 - b.y) < R + 4) hurtPlayer(b.dmg, b.x, null, true);
  for (const e of enemies) {
    if (e.dead || e.boss || ET[e.type].boss) continue;
    if (Math.hypot(e.x + e.w / 2 - b.x, e.y + e.h / 2 - b.y) > R) continue;
    e.hp -= Math.round(b.dmg * 0.6); e.flash = 0.12; e.showHp = 2; e.vx += Math.sign(e.x + e.w / 2 - b.x) * 120;
    if (e.hp <= 0) killEnemy(e);
  }
  const tx0 = Math.floor(b.x / T), ty0 = Math.floor(b.y / T);
  for (let ty = ty0 - 2; ty <= ty0 + 2; ty++) for (let tx = tx0 - 2; tx <= tx0 + 2; tx++) {
    const ddx = (tx + 0.5) * T - b.x, ddy = (ty + 0.5) * T - b.y; if (ddx * ddx + ddy * ddy > (R * 0.7) * (R * 0.7)) continue;
    const t = tileAt(tx, ty); if (!SOLID[t] || !GB_SAFE(t) || inVillage(tx, ty) || gbHall(tx, ty)) continue;
    breakTile(tx, ty);
  }
}
function cvnUpdate(dt) {
  // nuvens de esporos
  for (let i = fgClouds.length - 1; i >= 0; i--) {
    const c = fgClouds[i]; c.life -= dt; c.r = Math.min(c.R, c.r + dt * 70);
    if (c.life <= 0) { fgClouds.splice(i, 1); continue; }
    if (Math.random() < dt * 30) parts.push({ x: c.x + rnd(-c.r, c.r), y: c.y + rnd(-c.r * 0.6, c.r * 0.5), vx: rnd(-8, 8), vy: rnd(-14, 2), g: -10, life: 0.9, max: 0.9, col: Math.random() < 0.5 ? '#9ad83a' : '#c8f070', size: 1 });
    const ex = (pl.x + pl.w / 2 - c.x) / c.r, ey = (pl.y + pl.h / 2 - c.y) / (c.r * 0.75);
    if (!pl.dead && c.life > 0.4 && ex * ex + ey * ey < 1) { if (fgPoisonT <= 0) floatText(pl.x + pl.w / 2, pl.y - 8, 'ENVENENADO', '#9ad83a', 0.8); fgPoisonT = 2.4; fgPoisonDmg = Math.max(fgPoisonDmg, c.dmg); }
  }
  // o veneno: perde vida aos pouquinhos, sem ser jogado para trás
  if (fgPoisonT > 0 && !pl.dead) {
    fgPoisonT -= dt; fgTick -= dt;
    if (fgTick <= 0) {
      fgTick = 0.7;
      if (!(typeof modoDeus !== 'undefined' && modoDeus)) {
        pl.hp -= fgPoisonDmg; pl.hurtFlash = 0.08; pl.lastHurt = gameTime; pl.regen = 0;
        floatText(pl.x + pl.w / 2, pl.y - 6, '-' + fgPoisonDmg, '#9ad83a', 0.9);
        if (pl.hp <= 0) { pl.hp = 0; die(); }
      }
    }
    if (fgPoisonT <= 0) fgPoisonDmg = 1;
  } else fgTick = 0;
  // dinamites
  for (let i = gbBombs.length - 1; i >= 0; i--) {
    const b = gbBombs[i]; b.fuse -= dt;
    if (b.fuse <= 0) { gbBombs.splice(i, 1); gbBoom(b); continue; }
    b.vy = Math.min(b.vy + GB_G * dt, 400);
    const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(b.y / T))) { b.vx = -b.vx * 0.35; } else b.x = nx;
    if (solidAt(Math.floor(b.x / T), Math.floor(ny / T))) { if (b.vy > 0) { b.vy = Math.abs(b.vy) > 60 ? -b.vy * 0.3 : 0; b.vx *= 0.6; } else b.vy = 0; } else b.y = ny;
    b.spin += b.vx * dt * 0.08;
    if (Math.random() < dt * 30) parts.push({ x: b.x + Math.cos(b.spin) * 2, y: b.y + Math.sin(b.spin) * 2 - 1, vx: rnd(-20, 20), vy: rnd(-40, -10), g: 200, life: 0.25, max: 0.25, col: Math.random() < 0.5 ? '#ffe080' : '#ff8a2a', size: 1 });
  }
  for (let i = gbBooms.length - 1; i >= 0; i--) { gbBooms[i].t -= dt; if (gbBooms[i].t <= 0) gbBooms.splice(i, 1); }
}
HOOK.update.push(cvnUpdate);
HOOK.drawTop.push((cx, cy) => {
  for (const c of fgClouds) {   // a nuvem: uma névoa verde que some no fim
    const a = Math.min(1, c.life / 0.8) * 0.22, x = Math.round(c.x) - cx, y = Math.round(c.y) - cy;
    lc.globalAlpha = a; lc.fillStyle = '#7ab83a';
    for (let k = 0; k < 9; k++) { const ang = k * 0.7 + c.max - c.life, rr = c.r * (0.35 + (k % 3) * 0.22); const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr * 0.6; const s = Math.max(3, c.r * 0.5) | 0; lc.fillRect(px - s / 2, py - s / 3, s, (s * 0.66) | 0); }
    lc.globalAlpha = 1;
  }
  for (const b of gbBombs) {   // a banana de dinamite
    const x = Math.round(b.x) - cx, y = Math.round(b.y) - cy, h = Math.abs(Math.cos(b.spin)) > 0.7;
    lc.fillStyle = '#2a0a06'; if (h) lc.fillRect(x - 3, y - 2, 7, 4); else lc.fillRect(x - 2, y - 3, 4, 7);
    lc.fillStyle = '#c8402e'; if (h) lc.fillRect(x - 2, y - 1, 5, 2); else lc.fillRect(x - 1, y - 2, 2, 5);
    lc.fillStyle = b.fuse < 0.5 && Math.floor(b.fuse * 16) % 2 ? '#ffffff' : '#ffd060'; lc.fillRect(h ? x + 3 : x, h ? y - 1 : y - 3, 1, 1);
  }
  if (fgPoisonT > 0 && !pl.dead) {   // bolhinhas verdes em cima do herói
    const x = Math.round(pl.x) - cx, y = Math.round(pl.y) - cy;
    lc.globalAlpha = Math.min(1, fgPoisonT); lc.fillStyle = '#9ad83a';
    for (let k = 0; k < 3; k++) { const ph = (gameTime * 1.6 + k / 3) % 1; lc.fillRect(x + 1 + k * 3, y + 4 - ph * 10, 1, 1); }
    lc.globalAlpha = 1;
  }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const c of fgClouds) { lc.globalAlpha = Math.min(1, c.life / 0.8) * 0.35; const s = c.r / 10; lc.drawImage(CVN_GLOW.spore, c.x - cx - 10 * s, c.y - cy - 10 * s, 20 * s, 20 * s); }
  for (const b of gbBooms) { lc.globalAlpha = b.t / 0.35; lc.drawImage(CVN_GLOW.boom, b.x - cx - 40, b.y - cy - 40); }
  for (const b of gbBombs) { lc.globalAlpha = 0.5; lc.drawImage(SPR.glow.eye, b.x - cx - 6, b.y - cy - 6); }
  for (const e of enemies) if (e.type === 'goblin' && !e.dead) { lc.globalAlpha = 0.45; lc.drawImage(CVN_GLOW.lamp, e.x + e.w / 2 + e.facing * 3 - cx - 14, e.y - 4 - cy - 14); }
  lc.globalAlpha = 1;
});
// bater no fungo faz ele soltar a nuvem na hora
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'fungo' && !e.dead && e.state === 'walk' && e.atkCD <= 0) { e.awake = true; e.state = 'swell'; e.stateT = 0.3; }
  if (e && e.type === 'centopeia' && e.state === 'walk' && !rectSolid(e.x, e.y + 1, e.w, e.h)) e.state = 'fall';
  return _hit(e, dir, mult, melee);
}; }
// metade das centopeias nasce agarrada ao teto
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type === 'centopeia' && Math.random() < 0.5) { const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h - 1) / T), r = cvRoofAbove(tx, ty, 10); if (r >= 0 && ty - r >= 3 && !rectSolid(e.x, (r + 1) * T, e.w, e.h)) { e.y = (r + 1) * T; e.side = 'up'; } }
  return e;
}; }
function clearCvnFx() { fgClouds.length = 0; gbBombs.length = 0; gbBooms.length = 0; fgPoisonT = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearCvnFx(); return _nw(sd, sv); }; }
{ const _d = die; die = function () { fgPoisonT = 0; return _d.apply(this, arguments); }; }

/* ---------- sons ---------- */
Object.assign(sfx, {
  fgSwell() { tone(140, 0.5, 'sine', 0.04, 120); noise(0.4, 0.03, 600, 'lowpass'); },
  fgPuff() { noise(0.45, 0.08, 1400, 'bandpass', 0, 1); tone(220, 0.2, 'sine', 0.03, -120); },
  cpBite() { tone(2600, 0.03, 'square', 0.025, -800); noise(0.05, 0.05, 3200, 'highpass'); },
  gbFuse() { noise(0.5, 0.04, 5200, 'highpass'); },
  gbBoom() { noise(0.7, 0.22, 260, 'lowpass'); tone(70, 0.5, 'sine', 0.12, -40); noise(0.25, 0.1, 1800, 'bandpass', 0.02, 1); }
});

/* ---------- onde nascem: cada faixa das Cavernas fica com 4 a 6 bichos ---------- */
Object.assign(CATH_SPAWN, {
  [CV_ZONE0]: [[['slime', 0.3], ['bat', 0.25], ['rato', 0.3], ['fungo', 0.2]], 6],
  [CV_ZONE0 + 1]: [[['bat', 0.17], ['rato', 0.13], ['aranha', 0.22], ['besouro', 0.2], ['fungo', 0.13], ['centopeia', 0.17]], 7],
  [CV_ZONE0 + 3]: [[['aranha', 0.2], ['cuspideira', 0.18], ['besouro', 0.2], ['bat', 0.12], ['centopeia', 0.15], ['goblin', 0.2]], 8]
});

/* ---------- o vilarejo: quem compra e o que o ancião pede ---------- */
Object.assign(MAT_VAL, { esporo: 5, pata_centopeia: 3, polvora: 10 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'esporo' || id === 'pata_centopeia'; c.hint = c.hint.replace(/\.$/, '') + ', esporos e patas de centopeia.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || id === 'polvora'; f.hint = f.hint.replace(/\.$/, '') + ' e pólvora.'; }
