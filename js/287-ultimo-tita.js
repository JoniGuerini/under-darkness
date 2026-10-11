'use strict';

/* ================= O Último Titã: o chefe do Ossário dos Titãs =================
   O Leito do Titã (docs/camadas/12-ossario-titas.md, seção 7). O 285 reserva no Leito do Último uma caixa maciça de
   cx - 73 a cx + 72 e de top - 3 a fy + 3, cava os dois corredores de serviço por fora e chama ttDress; este arquivo
   escreve o Leito dentro dela: o oco de 140 x 56 com o teto de osso esponjoso, o chão de pó e osso (protegido), as
   duas portas, a lâmina da foice de Cronos cravada na parede do fundo (a luz fria do Leito), lascas em leque e
   flores-de-cinza nos cantos. A sala é ele: o titã deitado de bruços, de cabeça para a direita, é um corpo-terreno
   (286) de seis partes: a mão aberta no chão, o antebraço, o braço, as costas e o ombro (um morro de 50 x 18), o tronco
   (escondido no pó até ele se erguer) e a cabeça (16 x 14) apoiada no chão.
   Os pontos fracos são quatro lascas da foice ainda cravadas nele, brilhando frio: no pulso, no ombro, entre as
   costelas (no alto das costas) e na nuca. Cada uma é um "monstro" sem corpo (ttLasca) que segue a parte dela e só
   toma dano de perto (golpe do herói); o titã (tita, invisível, a barra de chefe) soma a vida das quatro. A lasca da
   fase errada não quebra (faísca e "tink").
   Pisar na mão dele ou entrar fundo no Leito acorda o titã: os olhos abrem e os Dedos Cerrados (TT_BARREIRA, os dedos
   da outra mão) fecham as duas portas. A câmera se afasta um passo (S - 1) só dentro do Leito durante a luta.
     1. o braço (as duas primeiras lascas): Tapa (a mão sobe, a sombra cresce no chão 1,2 s e ela bate), Varrida (o
        ombro range e o pó levanta ao longo do braço 1 s, e a mão passa rente ao chão; pula-se por cima ou sobe-se no
        braço) e Sopro de Pó (o peito incha 1 s; um cone de pó sai do nariz e empurra 5 blocos). O caminho: subir pela
        mão parada no chão, quebrar a lasca do pulso, correr pelo braço até o ombro (as pegas de líquen) e quebrar a
        segunda.
     2. ele se ergue (a terceira lasca): o tronco sobe do pó e as costas vão para o alto, uma parede de escalada de 30
        blocos (as pegas de líquen do lado esquerdo). A cada 8 a 10 s ele SE SACODE: aviso de 1 s (as costelas
        rangem, cai pó de todo o corpo, a tela treme de leve); quem está agarrado segura e gasta vigor; quem está em pé
        solto em cima dele escorrega e cai. Abutres descem do teto para atrapalhar a escalada. A lasca das costelas
        fica no alto das costas.
     3. a cabeça (a nuca): ele deita de novo e a cabeça procura o herói. Testada (a cabeça recua e sobe 1,4 s sobre o
        herói e desce esmagando; depois fica abaixada no chão um tempo) e Olhar (uma linha fraca pelo chão 1 s, depois
        forte, e machuca quem está no chão daquele lado). Para chegar à nuca: subir pelos cabelos de líquen atrás da
        orelha enquanto a cabeça está abaixada depois de uma testada.
   Sair do Leito, usar portal ou morrer reinicia: o corpo volta deitado, as quatro lascas voltam inteiras e os dedos
   abrem. Quebrar a última lasca derruba o titã de vez: o corpo é carimbado no mundo (286: tbStamp) e vira mais um
   pedaço do Ossário, que se escala e se minera.
   Solta A Foice de Cronos (machado lendário: +50% de dano contra os grandes, os pesados e os chefes, e todo golpe
   empurra até quem não recua) e, na vitória, uma das três bases da camada. A morte fica salva (ultimoTita.dead).
   Carrega depois do 285 e do 286, antes do 49 (que escala ET). */

const TTQ_L = layerBossLvl('titas');
const TTQ = { hp: Math.round(330 * (1 + 0.3 * (TTQ_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (TTQ_L - 1))), xp: 560, shakeMin: 8, shakeMax: 10 };
const ttState = { dead: false };
ET.tita = { name: 'O Último Titã', w: 16, h: 16, hp: TTQ.hp, dmg: TTQ.dmg, xp: TTQ.xp, kb: 0, fly: true, phase: true, blood: '#a89e88', boss: true };
ET.ttLasca = { name: 'Lasca da Foice', w: 14, h: 16, hp: Math.round(TTQ.hp / 4), dmg: 0, xp: 0, kb: 0, fly: true, phase: true, blood: '#d0e4dc' };
AI.ttLasca = e => { e.vx = 0; e.vy = 0; };
const TTQ_DROPS = [['foice_cronos', 1], ['min_adamantita', 1, 6, 10], ['tutano', 1, 2, 4], ['dente_tita', 1, 2, 4], ['olho_ciclope', 1, 1, 2], ['pocao', 1, 2, 4]];
const TTQ_BASES = ['maca_femur', 'escudo_omoplata', 'elmo_cranio'];
const ttqDrops = () => { DROPS.tita = TTQ_DROPS.filter(([id]) => ITEMS[id]); DROPS.ttLasca = []; };

let ttTita = null, ttZoom = false;
const ttLascas = [];
const ttqFx = { shadow: null, dust: [], beam: null, cone: null, shake: 0 };

/* ---------- o corpo: as partes na pose deitada (lx, ly em px a partir do canto do bloco (cx, fy)) ---------- */
// as costas: um morro de 50 de largura; a coluna 0 é a das pegas (o líquen no ombro, acima do braço)
function ttqCostas() {
  const W = 51, H = 18, rows = [];
  const hgt = c => c <= 12 ? 15 + Math.round(Math.sin(c / 12 * Math.PI) * 1.4) : c <= 18 ? 14 : c <= 38 ? 17 + Math.round(Math.sin((c - 18) / 20 * Math.PI)) : Math.round(15 - (c - 38) * 0.5);
  for (let r = 0; r < H; r++) {
    let s = '';
    for (let c = 0; c < W; c++) {
      if (c === 0) { s += r >= 2 ? '|' : '.'; continue; }
      const h = hgt(c); if (H - r > h) { s += '.'; continue; }
      const plate = (c >= 21 && c <= 24 && r >= H - h && r < H - h + 3) || (c >= 31 && c <= 33 && r >= H - h + 1 && r < H - h + 4) || (c >= 4 && c <= 6 && r >= H - h + 3 && r < H - h + 5);
      s += plate ? 'b' : '#';
    }
    rows.push(s);
  }
  return rows;
}
// a cabeça de lado, a cara para a direita; a coluna 0 é o cabelo de líquen atrás da orelha
const TTQ_CABECA = [
  "..#####.........",
  "|########.......",
  "|##########.....",
  "|###########....",
  "|#############..",
  "|##############.",
  "|###############",
  "|###############",
  "|##############.",
  "|#############..",
  "|##b##########..",
  "|#############..",
  "|##############.",
  ".###############"
];
const TTQ_PARTS = () => {
  const P = {};
  P.mao = tbPart('mao', [".#.#.#.##.", "#########b", "##########"], -56 * T, -3 * T);
  P.ante = tbPart('ante', ["...##########..", "b#############.", "b##############", "###############"], -46 * T, -4 * T);
  P.braco = tbPart('braco', ["..........#####", "......#########", "...############", "#######b#######", "###############", "###############"], -31 * T, -6 * T);
  P.costas = tbPart('costas', ttqCostas(), -17 * T, -18 * T);
  const tr = []; for (let r = 0; r < 12; r++) tr.push('|' + (r < 1 ? '..##########################' : r === 5 ? 'b#############################'.slice(0, 29) : '#############################'));
  P.tronco = tbPart('tronco', tr, -17 * T, 0, { clipY: 0 });
  P.cabeca = tbPart('cabeca', TTQ_CABECA, 34 * T, -14 * T);
  return P;
};
let ttBd = null;
const TTQ_REST = { mao: [-56, -3], ante: [-46, -4], braco: [-31, -6], costas: [-17, -18], tronco: [-17, 0], cabeca: [34, -14] };
// as lascas: [nome, parte, coluna, linha de cima, fase]
const TTQ_LASCAS = [['pulso', 'ante', 4, 0, 1], ['ombro', 'costas', 7, 0, 1], ['costelas', 'costas', 28, 0, 2], ['nuca', 'cabeca', 3, 0, 3]];
const ttqTop = (p, c) => { for (let r = 0; r < p.h; r++) if (tbSolidK(p.k[r * p.w + c])) return r; return p.h; };

function ttqRestPose() {
  for (const k in ttBd) { const [i, j] = TTQ_REST[k]; tbMove(ttBd[k], i * T, j * T); ttBd[k].jx = 0; }
}
function ttqBuildBody() {
  TB.parts.length = 0; TB.cxT = ttBoss.cx; TB.fyT = ttBoss.fy;
  ttBd = TTQ_PARTS();
  TB.parts.push(ttBd.tronco, ttBd.costas, ttBd.braco, ttBd.ante, ttBd.mao, ttBd.cabeca);
  TB.on = true;
  // o tronco fica no pó: o corte é a linha do chão (em px do mundo, refeito a cada quadro)
}

/* ---------- a construção (o 285 chama ttDress logo depois de ttAfter) ---------- */
function ttDress() {
  const B = ttBoss; if (!B) return;
  B.dead = ttState.dead;
  const W1 = x => ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x77a71);
  // o oco: 140 x 56, o teto arredondado nos cantos, estalactites de osso esponjoso
  for (let y = B.top; y < B.fy; y++) for (let x = B.cx - 70; x <= B.cx + 69; x++) {
    const i = I(x, y), u = (x - B.cx) / 70, v = (B.fy - y) / B.h;
    if (v > 0.82 && Math.abs(u) > 0.9 - (1 - v) * 1.5) continue;   // os cantos de cima
    tiles[i] = AIR; walls[i] = v > 0.7 ? WTT_ESPONJA : Math.abs(u) > 0.85 ? WTT_ROCHA : WTT_OSSO; ttKeep.add(i);
  }
  for (let x = B.cx - 64; x <= B.cx + 63; x += 2 + ((R() * 4) | 0)) {   // pingentes de osso no teto
    let y = B.top; while (y < B.fy - 30 && tiles[I(x, y)] !== AIR) y++;
    if (tiles[I(x, y)] !== AIR || tiles[I(x, y - 1)] === AIR) continue;
    const L = 1 + ((R() * 4) | 0); for (let k = 0; k < L; k++) if (tiles[I(x, y + k)] === AIR) tiles[I(x, y + k)] = k === L - 1 ? TT_ESPINHO : TT_ESPONJA;
  }
  // o chão: pó por cima, osso embaixo; protegido (o 87 guarda o Leito)
  for (let x = B.cx - 73; x <= B.cx + 72; x++) { tiles[I(x, B.fy)] = TT_PO; tiles[I(x, B.fy + 1)] = TT_OSSO; ttKeep.add(I(x, B.fy)); }
  // a metade de baixo do corpo enterrada: dunas de pó baixas à esquerda, atrás da mão
  for (let x = B.cx - 70; x <= B.cx - 60; x++) { const h = Math.round(1.6 - Math.abs(x - (B.cx - 66)) * 0.3); for (let k = 1; k <= h; k++) tiles[I(x, B.fy - k)] = TT_PO; }
  // as portas: 5 de altura, cruzando a casca
  for (const D of B.doors) for (let k = 0; k < 4; k++) { const x = D.side < 0 ? B.cx - 70 - k : B.cx + 69 + k; for (let y = B.fy - 5; y < B.fy; y++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WTT_ROCHA; ttKeep.add(i); } }
  // as flores-de-cinza e as lascas nos cantos (a luz fria e fraca)
  for (const x0 of [B.cx - 69, B.cx + 52]) for (let k = 0; k < 6; k++) { const x = x0 + ((R() * 16) | 0); if (tiles[I(x, B.fy - 1)] === AIR && SOLID[tiles[I(x, B.fy)]]) tiles[I(x, B.fy - 1)] = k < 4 ? TT_FLOR : TT_LASCA; }
  // a lâmina da foice cravada na parede do fundo, por cima das costas; lascas em leque dos lados
  if (typeof PROP_DEFS !== 'undefined') {
    const put = (id, v, tx, ty, onFloor) => { const def = PROP_DEFS[id]; if (!def) return; const V = def.vars[v % def.vars.length], sup = []; if (onFloor) for (let k = 0; k < Math.ceil(V.w / T); k++) sup.push(I(tx + k, B.fy)); addProp(def, v % def.vars.length, W1(tx) * T, onFloor ? B.fy * T - V.h : ty * T, sup); };
    put('tt_foice', 0, B.cx - 4, B.fy - 44, false);
    put('tt_lascas_leque', 0, B.cx - 60, B.fy - 26, false);
    put('tt_lascas_leque', 1, B.cx + 50, B.fy - 30, false);
    put('tt_grilhao', 0, B.cx + 56, 0, true);
    put('tt_cabo_foice', 1, B.cx - 69, 0, true);
  }
  if (!ttState.dead) ttqBuildBody(); else { TB.parts.length = 0; TB.on = false; }
}

/* ---------- onde está o herói ---------- */
function ttHeroIn(m = 0) {
  const B = ttBoss; if (!B || pl.dead) return false;
  const tx = Math.floor((pl.x + pl.w / 2) / T), ty = Math.floor((pl.y + pl.h - 2) / T), i = wdx(tx - B.cx);
  return i >= -70 - m && i <= 69 + m && ty >= B.top - m && ty < B.fy + 1;
}
const ttHeroI = () => wdx(Math.floor((pl.x + pl.w / 2) / T) - ttBoss.cx);
const ttFloorY = () => TB.ay;
const ttPartRect = p => ({ x: tbX(p), y: tbY(p), w: p.w * T, h: p.h * T });
const ttHitPl = r => !pl.dead && pl.x + pl.w > r.x && pl.x < r.x + r.w && pl.y + pl.h > r.y && pl.y < r.y + r.h;

/* ---------- os Dedos Cerrados ---------- */
let ttSealT = -1;
function ttSeal(on) {
  const B = ttBoss, I = (x, y) => y * WW + wrapX(x);
  for (const D of B.doors) for (let k = 1; k <= 2; k++) {
    const x = D.side < 0 ? B.cx - 70 - k : B.cx + 69 + k;
    for (let y = B.fy - 5; y < B.fy; y++) { const i = I(x, y); if (on ? tiles[i] === AIR : tiles[i] === TT_BARREIRA) { tiles[i] = on ? TT_BARREIRA : AIR; markDirty(wrapX(x), y); } }
  }
  if (on) { ttSealT = 0; sfx.ttDedos(); }
  mapVer++;
}

/* ---------- a luta ---------- */
function ttSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; }
function ttStart() {
  ttqDrops(); tbAnchor();
  const D = ET.tita, H = ttBd.cabeca;
  const e = spawnEnemy('tita', tbX(H) + 8 * T, tbY(H) - D.h, TT_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: TTQ_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, ph: 1, cd: 2.2, last: '', rep: 0, eye: 0, shakeT: TTQ.shakeMin, vultT: 0, ttMinion: true });
  ttSet(e, 'intro', 1.8);
  ttTita = e; bossFight = { e, tt: true };
  ttLascas.length = 0;
  const hp = Math.max(1, Math.round(D.hp / 4));
  for (const [nm, part, c, r, ph] of TTQ_LASCAS) {
    const s = spawnEnemy('ttLasca', 0, 0, TT_ZONE0 + 3);
    Object.assign(s, { boss: true, lvl: TTQ_L, hp, maxHp: hp, dmg: 0, xp: 0, gold: 0, nm, part, c, r, ph, ttMinion: true, state: 'idle', facing: 1 });
    ttLascas.push(s); ttqLascaPos(s);
  }
  e.hp = e.maxHp = hp * ttLascas.length;
  ttSeal(true);
  ttqZoom(true);
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Último Titã'; bn.lastChild.textContent = 'o que a foice deixou'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Último Titã', 'o que a foice deixou');
  sfx.ttAcorda(); shake(4);
}
function ttqLascaPos(s) {
  const p = ttBd[s.part]; tbAnchor();
  const top = s.r === 0 ? ttqTop(p, s.c) : s.r;
  s.x = tbX(p) + s.c * T + T / 2 - s.w / 2 + (p.jx || 0); s.y = tbY(p) + top * T - s.h + 6; s.vx = s.vy = 0;
}
function ttClear() { ttqFx.shadow = null; ttqFx.beam = null; ttqFx.cone = null; ttqFx.dust.length = 0; ttqFx.shake = 0; TB.noGrip = false; }
function ttEnd(won) {
  const e = ttTita; ttTita = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies) if (m.ttBossMinion && !m.dead) { burst(m.x + m.w / 2, m.y + m.h / 2, 8, '#3e362e', 50, -20, 0.8); m.dead = true; m.despawn = true; }
  for (const s of ttLascas) { s.dead = true; s.despawn = true; } ttLascas.length = 0;
  ttClear(); ttSeal(false);
  ttqZoom(false);
  if (!won) { if (e) { e.dead = true; e.despawn = true; } if (ttBd) ttqRestPose(); return; }
  ttState.dead = true; if (ttBoss) ttBoss.dead = true;
  const x = e ? e.x + e.w / 2 : TB.ax, y = e ? e.y : TB.ay - 6 * T;
  // ele deita de vez: a pose final vira blocos
  if (ttBd) { ttqRestPose(); for (const k in ttBd) tbAnchor(); }
  const B = ttBoss; tbStamp((tx, ty) => B && Math.abs(wdx(tx - B.cx)) <= 69 && ty >= B.top && ty < B.fy);
  for (let k = 0; k < 6; k++) burst(x - 40 + k * 16, y + 20, 16, '#a89e88', 140, 200, 1.2);
  burst(x, y, 24, '#e4f6ee', 130, 40, 1.1, 1, true);
  const bases = TTQ_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.ttMorte();
  showBanner('Vitória', 'o último titã deita de vez');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.tt) return ttEnd(won); return _eb(won); }; }

// as lascas: só golpe de perto, só a da fase; a vida do titã é a soma das quatro
const ttLascaOk = s => !!ttTita && ttTita.state !== 'intro' && ttTita.state !== 'rise' && ttTita.state !== 'lower' && s.ph === Math.min(3, ttTita.ph);
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'tita') return;
  if (e && e.type === 'ttLasca' && !e.dead) {
    if (!melee || !ttLascaOk(e)) { sfx.tink(); burst(e.x + e.w / 2, e.y + e.h / 2, 4, '#d0e4dc', 50, 0, 0.3, 1, true); return; }
    const r = _hit(e, dir, mult, melee); e.vx = e.vy = 0; e.stun = 0;
    burst(e.x + e.w / 2, e.y + e.h / 2, 5, '#e4f6ee', 70, 100, 0.4, 1, true); sfx.ttLascaBate();
    if (ttTita) { ttTita.hp = ttLascas.reduce((a, s) => a + Math.max(0, s.dead ? 0 : s.hp), 0); ttTita.flash = 0.1; }
    return r;
  }
  // A Foice de Cronos: +50% contra os grandes; todo golpe empurra
  if (melee && pl.lg && pl.lg.foice && e && !e.dead) {
    const D = ET[e.type], big = e.boss || D.boss || D.kb <= 0.3 || e.w * e.h >= 300;
    const r = _hit(e, dir, big ? mult * 1.5 : mult, melee);
    if (!e.dead && !e.boss && !D.boss) { e.vx = dir * Math.max(Math.abs(e.vx), 110); if (!D.fly) e.vy = Math.min(e.vy, -60); }
    return r;
  }
  return _hit(e, dir, mult, melee);
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'ttLasca') {
    if (e.dead) return;
    e.dead = true; e.hp = 0;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    burst(cx, cy, 20, '#e4f6ee', 120, 120, 0.9, 1, true); burst(cx, cy, 12, '#7a948a', 90, 300, 0.8);
    sfx.ttLascaParte(); shake(6); hitstop = Math.max(hitstop, 0.12);
    const T0 = ttTita; if (!T0) return;
    T0.hp = ttLascas.reduce((a, s) => a + (s.dead ? 0 : Math.max(0, s.hp)), 0);
    const left = ttLascas.filter(s => !s.dead).length;
    if (!left) { T0.hp = 0; ttSet(T0, 'dying', 2.4); ttClear(); sfx.ttUrro(1.3); return; }
    T0.broke = (T0.broke || 0) + 1;
    ttSet(T0, 'roar', 1.4); ttClear(); sfx.ttUrro(1);
    return;
  }
  return _k(e);
}; }
// nada do Leito quebra enquanto ele vive (a picareta faísca no corpo e no chão)
{ const _bt = breakTile; breakTile = function (tx, ty) { if (ttBoss && !ttState.dead && inTtHall(tx, ty, 3)) { sfx.tink(); return; } return _bt(tx, ty); }; }

/* ---------- o cérebro ---------- */
const TTQ_SLAP = 1.2, TTQ_SWEEP = 1, TTQ_BREATH = 1, TTQ_BUTT = 1.4, TTQ_BEAM = 1;
AI.tita = function (e, dt) {
  if (!ttBoss || !ttBd) { e.dead = true; return; }
  e.vx = e.vy = 0; tbAnchor();
  const H = ttBd.cabeca; e.x = tbX(H) + 7 * T - e.w / 2; e.y = tbY(H) - e.h - 4;
  e.stateT -= dt; e.eye = approach(e.eye, e.state === 'dying' ? 0 : 1, dt * 1.5);
  for (const p of TB.parts) p.jx = 0;
  // o tronco sai do pó: o corte é a linha do chão
  ttBd.tronco.clipY = TB.ay;
  ttqBrain(e, dt);
  for (const s of ttLascas) if (!s.dead) ttqLascaPos(s);
};
function ttqTween(k, i, j, f) { const p = ttBd[k]; tbMove(p, lerp(p.lx, i * T, f), lerp(p.ly, j * T, f)); }
function ttqTo(k, i, j, sp, dt) { const p = ttBd[k], tx = i * T, ty = j * T; tbMove(p, approach(p.lx, tx, sp * dt), approach(p.ly, ty, sp * dt)); return p.lx === tx && p.ly === ty; }
function ttqPick(e, list) {
  let tot = 0; for (const [, w] of list) tot += w;
  for (let n = 0; n < 4; n++) {
    let r = Math.random() * tot, k = list[0][0]; for (const [s, w] of list) { if (r < w) { k = s; break; } r -= w; }
    if (k === e.last && e.rep >= 1 && list.length > 1) continue;
    e.rep = k === e.last ? e.rep + 1 : 0; e.last = k; return k;
  }
  return list[0][0];
}
function ttqBrain(e, dt) {
  const st = e.state, hi = ttHeroI(), R = TTQ_REST;
  if (e.ph === 2 && st !== 'shakeWarn' && st !== 'shake' && st !== 'rise' && st !== 'roar') e.shakeT -= dt;
  if (st === 'intro') { if (Math.random() < dt * 20) ttqDustFall(2); if (e.stateT <= 0) ttSet(e, 'idle', 1.2); return; }
  if (st === 'dying') {   // ele cai de vez: o corpo deita, treme, o pó sobe
    ttqTo('tronco', R.tronco[0], R.tronco[1], 120, dt); ttqTo('costas', R.costas[0], R.costas[1], 120, dt);
    ttqTo('cabeca', R.cabeca[0], R.cabeca[1], 120, dt); ttqTo('mao', R.mao[0], R.mao[1], 160, dt); ttqTo('ante', R.ante[0], R.ante[1], 160, dt);
    for (const p of TB.parts) p.jx = Math.round(Math.sin(gameTime * 50 + p.w) * 1.5);
    if (Math.random() < dt * 30) ttqDustFall(3);
    if (e.stateT <= 0) { e.hp = 0; for (const p of TB.parts) p.jx = 0; killEnemy(e); }
    return;
  }
  if (st === 'roar') {   // urra e se sacode; as partes voltam para perto da pose
    for (const p of TB.parts) p.jx = Math.round(Math.sin(gameTime * 40 + p.w) * 1.2);
    ttqTo('mao', R.mao[0], R.mao[1], 200, dt); ttqTo('ante', R.ante[0], R.ante[1], 200, dt);
    if (e.ph < 3) ttqTo('cabeca', R.cabeca[0], R.cabeca[1], 200, dt);
    if (Math.random() < dt * 25) ttqDustFall(2);
    if (e.stateT > 0) return;
    const nph = e.broke >= 3 ? 3 : e.broke >= 2 ? 2 : 1;
    if (nph !== e.ph) { e.ph = nph; ttSet(e, nph === 2 ? 'rise' : 'lower', 2.6); sfx.ttErgue(); if (nph === 2) ttqVultures(e, 2); return; }
    ttSet(e, 'idle', 1); return;
  }
  if (st === 'rise') {   // o tronco sobe do pó e as costas vão para o alto: a parede de 30
    const f = 1 - Math.max(0, e.stateT) / e.stateMax;
    ttqTween('tronco', R.tronco[0], -12 * f + R.tronco[1] * (1 - f), 1); ttqTween('costas', R.costas[0], R.costas[1] - 12 * f, 1);
    for (const p of [ttBd.tronco, ttBd.costas]) p.jx = Math.round(Math.sin(gameTime * 36) * 1);
    if (Math.random() < dt * 30) ttqDustFall(3);
    shake(0.6);
    if (e.stateT <= 0) { ttSet(e, 'idle', 1.2); e.shakeT = TTQ.shakeMin + Math.random() * (TTQ.shakeMax - TTQ.shakeMin); }
    return;
  }
  if (st === 'lower') {   // deita de novo: a cabeça fica livre para procurar o herói
    const f = 1 - Math.max(0, e.stateT) / e.stateMax;
    ttqTween('tronco', R.tronco[0], -12 * (1 - f), 1); ttqTween('costas', R.costas[0], R.costas[1] - 12 * (1 - f), 1);
    if (Math.random() < dt * 20) ttqDustFall(2);
    if (e.stateT <= 0) ttSet(e, 'idle', 1);
    return;
  }
  // os ataques em andamento
  if (st === 'slapUp') {   // a mão e o antebraço sobem e vão para cima do herói; a sombra cresce
    const tx = clamp(hi - 5, -66, -22), dx = tx - R.mao[0];
    ttqTo('mao', tx, R.mao[1] - 9, 260, dt); ttqTo('ante', R.ante[0] + Math.round(dx * 0.6), R.ante[1] - 7, 220, dt);
    const M = ttBd.mao; ttqFx.shadow = { x: tbX(M) + M.w * T / 2, w: M.w * T, q: 1 - Math.max(0, e.stateT) / TTQ_SLAP };
    if (e.stateT <= 0) { ttSet(e, 'slapDown', 0.18); sfx.ttWhoosh(); }
    return;
  }
  if (st === 'slapDown') {
    const M = ttBd.mao, A = ttBd.ante, f = Math.min(1, 1 - e.stateT / e.stateMax);
    const my = lerp(M.ly, R.mao[1] * T, Math.min(1, f * 1.6)), ay = lerp(A.ly, R.ante[1] * T, Math.min(1, f * 1.3));
    const r = { x: tbX(M), y: TB.ay + my, w: M.w * T, h: M.h * T };
    if (!e.slapHit && ttHitPl(r)) { e.slapHit = true; pl.invuln = 0; hurtPlayer(e.dmg, r.x + r.w / 2, null, true); pl.vy = Math.max(pl.vy, 60); }
    tbMove(M, M.lx, my); tbMove(A, A.lx, ay);
    if (e.stateT <= 0) { tbMove(M, M.lx, R.mao[1] * T); tbMove(A, A.lx, R.ante[1] * T); ttqFx.shadow = null; shake(7); sfx.ttBatida(); ttqDustLine(tbX(M), M.w * T, 18); ttSet(e, 'slapRest', 1.1); }
    return;
  }
  if (st === 'slapRest') { if (e.stateT <= 0) ttSet(e, 'armBack', 1.2); return; }
  if (st === 'armBack') { const a = ttqTo('mao', R.mao[0], R.mao[1], 90, dt), b = ttqTo('ante', R.ante[0], R.ante[1], 70, dt); if ((a && b) || e.stateT <= 0) { ttqRestArm(); ttSet(e, 'idle', 0.8 + Math.random() * 0.6); } return; }
  if (st === 'sweepWarn') {   // o ombro range, o pó levanta ao longo do braço
    if (Math.random() < dt * 40) { const A = ttBd.braco, x = tbX(ttBd.mao) + Math.random() * (tbX(A) + A.w * T - tbX(ttBd.mao)); ttqDust(x, TB.ay, 1, -40); }
    ttBd.braco.jx = Math.round(Math.sin(gameTime * 40));
    if (e.stateT <= 0) { ttSet(e, 'sweep', 1.1); e.sweepHit = false; e.sweepDir = hi < R.mao[0] ? -1 : 1; ttqTo('mao', R.mao[0], R.mao[1] - 1, 999, 1); ttqTo('ante', R.ante[0], R.ante[1] - 1, 999, 1); sfx.ttVarre(); }
    return;
  }
  if (st === 'sweep') {   // a mão passa rente ao chão até a parede e volta
    const f = 1 - Math.max(0, e.stateT) / e.stateMax, off = Math.sin(f * Math.PI) * 14;
    tbMove(ttBd.mao, (R.mao[0] - off) * T, (R.mao[1] - 1) * T); tbMove(ttBd.ante, (R.ante[0] - off * 0.7) * T, (R.ante[1] - 1) * T);
    const M = ttBd.mao, band = { x: tbX(M) - 4, y: TB.ay - 2 * T, w: M.w * T * 0.6, h: 2 * T };
    if (!e.sweepHit && ttHitPl(band) && pl.y + pl.h > TB.ay - 2 * T) { e.sweepHit = true; pl.invuln = 0; hurtPlayer(Math.round(e.dmg * 0.7), band.x + band.w, null, true); pl.vx = -160; pl.vy = -120; }
    if (Math.random() < dt * 30) ttqDust(tbX(M) + Math.random() * M.w * T, TB.ay, 1, -30);
    if (e.stateT <= 0) { ttqRestArm(); ttSet(e, 'idle', 1 + Math.random() * 0.6); }
    return;
  }
  if (st === 'breathWarn') {   // o peito incha
    ttBd.costas.jx = 0; const q = 1 - Math.max(0, e.stateT) / TTQ_BREATH; ttBd.costas.ly = R.costas[1] * T - (e.ph === 2 ? 12 * T : 0) - Math.round(q * 2);
    if (e.stateT <= 0) { ttBd.costas.ly = R.costas[1] * T - (e.ph === 2 ? 12 * T : 0); ttSet(e, 'breath', 0.8); e.coneHit = false; sfx.ttSopro(); }
    return;
  }
  if (st === 'breath') {   // um cone de pó sai do nariz para a direita e empurra 5 blocos
    const H = ttBd.cabeca, nx = tbX(H) + H.w * T, ny = tbY(H) + 7 * T;
    ttqFx.cone = { x: nx, y: ny, t: 1 - e.stateT / e.stateMax };
    for (let k = 0; k < 3; k++) ttqDust(nx + Math.random() * 10 * T * ttqFx.cone.t, ny + (Math.random() - 0.3) * 4 * T * ttqFx.cone.t, 1, -10, 140);
    const r = { x: nx, y: ny - 4 * T, w: 12 * T, h: 6 * T };
    if (ttHitPl(r)) { pl.vx = Math.max(pl.vx, 230); if (!e.coneHit) { e.coneHit = true; pl.invuln = 0; hurtPlayer(Math.round(e.dmg * 0.35), nx - 10, null, true); pl.vx = 260; } }
    if (e.stateT <= 0) { ttqFx.cone = null; ttSet(e, 'idle', 1 + Math.random() * 0.6); }
    return;
  }
  if (st === 'shakeWarn') {   // as costelas rangem, cai pó de todo o corpo
    if (Math.random() < dt * 30) ttqDustFall(2); shake(0.5);
    if (e.stateT <= 0) { ttSet(e, 'shake', 0.9); sfx.ttSacode(); e.slipped = false; }
    return;
  }
  if (st === 'shake') {
    for (const p of TB.parts) if (p !== ttBd.mao) p.jx = Math.round(Math.sin(gameTime * 55 + p.w) * 2);
    shake(2);
    const onBody = TB.parts.some(p => tbRides(p, pl)), grip = pl.climb && !!tbGripAt(pl);
    if (grip) { pl.vig = Math.max(0, pl.vig - 40 * dt); pl.vigT = 0; if (pl.vig <= 0) { TB.noGrip = true; pl.climb = false; floatText(pl.x + pl.w / 2, pl.y - 14, 'SOLTOU', '#ff9a5a', 1); } }
    else if (onBody && !e.slipped) { e.slipped = true; pl.vx = (Math.random() < 0.5 ? -1 : 1) * 170; pl.vy = -90; pl.onGround = false; floatText(pl.x + pl.w / 2, pl.y - 14, 'ESCORREGOU', '#d9c7a3', 0.9); }
    if (e.stateT <= 0) { TB.noGrip = false; e.shakeT = TTQ.shakeMin + Math.random() * (TTQ.shakeMax - TTQ.shakeMin); ttSet(e, 'idle', 0.6); }
    return;
  }
  if (st === 'buttUp') {   // a cabeça recua e sobe sobre o herói
    const tx = clamp(hi - 8, 30, 53); ttqTo('cabeca', tx, R.cabeca[1] - 7, 140, dt);
    const Hh = ttBd.cabeca; ttqFx.shadow = { x: tbX(Hh) + Hh.w * T / 2, w: Hh.w * T, q: 1 - Math.max(0, e.stateT) / TTQ_BUTT };
    if (e.stateT <= 0) { ttSet(e, 'buttDown', 0.2); sfx.ttWhoosh(0.7); }
    return;
  }
  if (st === 'buttDown') {
    const Hh = ttBd.cabeca, f = Math.min(1, 1 - e.stateT / e.stateMax), y = lerp(Hh.ly, R.cabeca[1] * T, Math.min(1, f * 1.6));
    const r = { x: tbX(Hh), y: TB.ay + y, w: Hh.w * T, h: Hh.h * T };
    if (!e.buttHit && ttHitPl(r)) { e.buttHit = true; pl.invuln = 0; hurtPlayer(Math.round(e.dmg * 1.1), r.x + r.w / 2, null, true); }
    tbMove(Hh, Hh.lx, y);
    if (e.stateT <= 0) { tbMove(Hh, Hh.lx, R.cabeca[1] * T); ttqFx.shadow = null; shake(8); sfx.ttBatida(1.2); ttqDustLine(tbX(Hh), Hh.w * T, 22); ttSet(e, 'buttRest', 3.2); }
    return;
  }
  if (st === 'buttRest') { if (Math.random() < dt * 2) ttqDust(tbX(ttBd.cabeca) + Math.random() * 16 * T, TB.ay, 1, -20); if (e.stateT <= 0) ttSet(e, 'headBack', 1.6); return; }
  if (st === 'headBack') { if (ttqTo('cabeca', R.cabeca[0], R.cabeca[1], 60, dt) || e.stateT <= 0) ttSet(e, 'idle', 0.8); return; }
  if (st === 'beamWarn' || st === 'beam') {   // o olhar: a linha fraca pelo chão, depois forte
    const H = ttBd.cabeca, side = e.beamSide, x0 = side > 0 ? tbX(H) + H.w * T : TB.ax - 70 * T, x1 = side > 0 ? TB.ax + 70 * T : tbX(H);
    ttqFx.beam = { x0, x1, y: TB.ay, on: st === 'beam', t: st === 'beam' ? 1 - e.stateT / e.stateMax : 1 - e.stateT / TTQ_BEAM, ex: tbX(H) + (side > 0 ? 13 : 5) * T, ey: tbY(H) + 5 * T };
    if (st === 'beam' && !e.beamHit && !pl.dead && pl.x + pl.w > x0 && pl.x < x1 && pl.y + pl.h > TB.ay - 2 * T && !TB.parts.some(p => tbRides(p, pl))) { e.beamHit = true; pl.invuln = 0; hurtPlayer(Math.round(e.dmg * 0.75), side > 0 ? x0 : x1, null, true); }
    if (e.stateT <= 0) { if (st === 'beamWarn') { ttSet(e, 'beam', 0.5); e.beamHit = false; sfx.ttOlhar(); } else { ttqFx.beam = null; ttSet(e, 'idle', 1 + Math.random() * 0.5); } }
    return;
  }
  // parado: escolhe o próximo
  if (e.ph >= 2) { e.vultT -= dt; if (e.vultT <= 0) { e.vultT = 16; ttqVultures(e, 2); } }
  if (e.stateT > 0) { if (Math.random() < dt * 0.6) ttqDust(TB.ax + (Math.random() - 0.5) * 120 * T, TB.ay - 50 * T, 1, 0, 0); return; }
  if (e.ph === 2) {
    if (e.shakeT <= 0) { ttSet(e, 'shakeWarn', 1); sfx.ttRange(); return; }
    const k = ttqPick(e, [['slap', hi < 0 ? 3 : 1], ['breath', hi > 30 ? 3 : 1], ['rest', 2]]);
    ttqGo(e, k); return;
  }
  if (e.ph === 3) {
    const right = hi > 26;
    const k = ttqPick(e, [['butt', right ? 4 : 1], ['beam', 3], ['sweep', hi < -20 ? 2 : 0.5]]);
    ttqGo(e, k); return;
  }
  const k = ttqPick(e, [['slap', hi < -10 ? 4 : 1.5], ['sweep', hi < -40 ? 3 : 1], ['breath', hi > 30 ? 4 : 0.6]]);
  ttqGo(e, k);
}
function ttqGo(e, k) {
  if (k === 'slap') { ttSet(e, 'slapUp', TTQ_SLAP); e.slapHit = false; sfx.ttRange(0.7); }
  else if (k === 'sweep') ttSet(e, 'sweepWarn', TTQ_SWEEP), sfx.ttRange();
  else if (k === 'breath') { ttSet(e, 'breathWarn', TTQ_BREATH); sfx.ttInspira(); }
  else if (k === 'butt') { ttSet(e, 'buttUp', TTQ_BUTT); e.buttHit = false; sfx.ttRange(0.8); }
  else if (k === 'beam') { ttSet(e, 'beamWarn', TTQ_BEAM); e.beamSide = ttHeroI() > 41 ? 1 : -1; sfx.ttOlharCarrega(); }
  else ttSet(e, 'idle', 1.2);
}
function ttqRestArm() { tbMove(ttBd.mao, TTQ_REST.mao[0] * T, TTQ_REST.mao[1] * T); tbMove(ttBd.ante, TTQ_REST.ante[0] * T, TTQ_REST.ante[1] * T); }
// os abutres descem do teto (no máximo 3 de uma vez)
function ttqVultures(e, n) {
  if (!ET.abutre || !AI.abutre) return;
  const have = enemies.filter(m => !m.dead && m.ttBossMinion).length;
  for (let k = 0; k < Math.min(n, 3 - have); k++) {
    const x = TB.ax + (-40 + Math.random() * 80) * T, y = TB.ay - 48 * T;
    const m = spawnEnemy('abutre', x, y, TT_ZONE0 + 3); if (!m || m.dead) continue;
    const L = TTQ_L - 1, D = ET.abutre, mm = 1 + 0.3 * (L - 1);
    Object.assign(m, { ttMinion: true, ttBossMinion: true, lvl: L, hp: Math.round(D.hp * mm), maxHp: Math.round(D.hp * mm), dmg: Math.round(D.dmg * (1 + 0.2 * (L - 1))), xp: 2, gold: 1, memT: 30, homeX: x, homeY: y + 20 * T });
    burst(x, y, 8, '#3e362e', 40, 60, 1.2);
  }
  sfx.ttGrasna && sfx.ttGrasna(0.8);
}
// pó caindo do corpo todo e do teto
function ttqDustFall(n) {
  const p = TB.parts[(Math.random() * TB.parts.length) | 0]; if (!p) return;
  for (let k = 0; k < n; k++) ttqDust(tbX(p) + Math.random() * p.w * T, tbY(p) + Math.random() * 3 * T, 1, 30, 0);
}
function ttqDust(x, y, n, vy = -30, vx = 0) { for (let k = 0; k < n; k++) parts.push({ x, y, vx: vx * (0.6 + Math.random() * 0.6) + rnd(-12, 12), vy: vy * Math.random() + rnd(-6, 6), g: 40, life: rnd(0.6, 1.4), max: 1.4, col: ['#a89e88', '#87806e', '#c4bca6'][(Math.random() * 3) | 0], size: 1 }); }
function ttqDustLine(x, w, n) { for (let k = 0; k < n; k++) ttqDust(x + Math.random() * w, TB.ay - 1, 1, -70, (Math.random() - 0.5) * 120); }

/* ---------- desenho ---------- */
DRAW_E.tita = () => {};
DRAW_E.ttLasca = (e, fx, fy) => {
  const img = ttqLascaArt(e.nm), ok = ttLascaOk(e);
  lc.drawImage(img, Math.round(fx - img.width / 2), fy - img.height + 2);
  if (e.flash > 0) { lc.globalAlpha = 0.7; lc.drawImage(ttqLascaArt(e.nm, true), Math.round(fx - img.width / 2), fy - img.height + 2); lc.globalAlpha = 1; }
  void ok;
};
EYES_E.ttLasca = (e, fx, fy) => {
  const ok = ttLascaOk(e);
  lc.globalAlpha = (ok ? 0.55 : 0.25) + 0.15 * Math.sin(gameTime * 3 + e.c); lc.drawImage(TTART.ttGlow('lascaG', 14, '#bfe8dc'), Math.round(fx) - 14, Math.round(fy - 10) - 14);
};
EYES_E.tita = (e, fx, fy) => {
  if (!ttBd) return;
  const H = ttBd.cabeca, cx = Math.round(tbX(H) + 12.5 * T - (cam.x + shk.x)), cy = Math.round(tbY(H) + 5 * T - (cam.y + shk.y));
  const hot = e.state === 'beamWarn' || e.state === 'beam' ? 1 : 0.5;
  lc.globalAlpha = e.eye * hot * (0.6 + 0.2 * Math.sin(gameTime * 4)); lc.drawImage(TTART.ttGlow('olhoT', 10, '#f0e8c8'), cx - 10, cy - 10);
  void fx; void fy;
};
WARN_E.tita = e => ['slapUp', 'sweepWarn', 'breathWarn', 'shakeWarn', 'buttUp', 'beamWarn'].includes(e.state);
WARN_E.ttLasca = () => false;
const TTQ_LA = {};
function ttqLascaArt(nm, white) {
  const key = nm + (white ? 'w' : ''); if (TTQ_LA[key]) return TTQ_LA[key];
  const W = 14, H = 18, cv = mk(W, H), x = cv.getContext('2d'), a = { pulso: 0.25, ombro: -0.2, costelas: 0.1, nuca: -0.35 }[nm] || 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const u = (i - W / 2) - (H - j) * Math.sin(a) * 0.6, half = (j / H) * 3.4 + 0.6; if (Math.abs(u) > half || j < 1) continue;
    const edge = u > half - 1.1;
    x.fillStyle = white ? '#ffffff' : edge ? '#e4f6ee' : u < -half + 1 ? '#2e3a38' : (j + i) % 5 === 0 ? '#7a948a' : '#5e7470'; x.fillRect(i, j, 1, 1);
  }
  x.fillStyle = white ? '#ffffff' : '#141a18'; x.fillRect(3, H - 2, W - 6, 2);
  return TTQ_LA[key] = cv;
}
// a sombra da mão e da cabeça no chão, o cone de pó, a linha do olhar
HOOK.drawWorld.push((cx, cy) => {
  const S = ttqFx.shadow;
  if (S) { const w = S.w * (0.5 + 0.5 * S.q); lc.globalAlpha = 0.25 + 0.35 * S.q; lc.fillStyle = '#000'; lc.beginPath(); lc.ellipse(Math.round(S.x - cx), Math.round(TB.ay - cy), w / 2, 3, 0, 0, 6.283); lc.fill(); lc.globalAlpha = 1; }
  const C = ttqFx.cone;
  if (C) { lc.globalAlpha = 0.35 * (1 - C.t * 0.5); lc.fillStyle = '#a89e88'; lc.beginPath(); lc.moveTo(C.x - cx, C.y - cy); lc.lineTo(C.x - cx + 12 * T * C.t, C.y - cy - 4 * T * C.t); lc.lineTo(C.x - cx + 12 * T * C.t, C.y - cy + 2 * T * C.t); lc.fill(); lc.globalAlpha = 1; }
});
HOOK.drawGlow.push((cx, cy) => {
  const B = ttqFx.beam; if (!B) return;
  const a = B.on ? 0.7 * (1 - B.t * 0.6) : 0.12 + 0.25 * B.t;
  lc.globalAlpha = a; const G = TTART.ttGlow('beam', 8, '#f0e8c8');
  for (let x = B.x0; x < B.x1; x += 10) lc.drawImage(G, Math.round(x - cx) - 8, Math.round(B.y - cy) - 12);
  lc.globalAlpha = B.on ? 0.8 : 0.3; lc.drawImage(TTART.ttGlow('olhoT', 10, '#f0e8c8'), Math.round(B.ex - cx) - 10, Math.round(B.ey - cy) - 10);
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  const B = ttqFx.beam; if (!B) return;
  lc.globalAlpha = B.on ? 1 : 0.35 + 0.4 * Math.abs(Math.sin(gameTime * 12));
  lc.fillStyle = B.on ? '#fffaee' : '#e8e0c8';
  const y = Math.round(B.y - cy) - (B.on ? 3 : 1); lc.fillRect(Math.round(B.x0 - cx), y, Math.round(B.x1 - B.x0), B.on ? 3 : 1);
  lc.globalAlpha = 1;
});
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const s of ttLascas) if (!s.dead) addL(s.x + s.w / 2, s.y + 4, 0.4);
  if (ttqFx.beam && ttqFx.beam.on) for (let x = ttqFx.beam.x0; x < ttqFx.beam.x1; x += 4 * T) addL(x, ttqFx.beam.y - 6, 0.5);
}; }

/* ---------- a câmera: um passo mais longe dentro do Leito, durante a luta ---------- */
// o resize (24) carrega depois deste arquivo: o embrulho entra na primeira luta
let ttRzOn = false;
function ttqZoom(on) {
  if (!ttRzOn && typeof resize === 'function') {
    ttRzOn = true;
    const _rz = resize; resize = function () {
      _rz();
      if (!ttZoom || S <= 2) return;
      S = S - 1; VW = Math.min(WW * T, Math.ceil(cvs.width / S)); VH = Math.min(WH * T, Math.ceil(cvs.height / S));
      low.width = VW; low.height = VH; lc.imageSmoothingEnabled = false; sc.imageSmoothingEnabled = false;
    };
  }
  if (ttZoom === on) return;
  ttZoom = on; if (typeof resize === 'function') resize();
}

/* ---------- o turno: acordar, sair, a luta ---------- */
HOOK.update.push(dt => {
  const B = ttBoss; if (!B || !pl || state !== 'play') return;
  if (ttState.dead || !ttBd) return;
  tbAnchor(); ttBd.tronco.clipY = TB.ay;
  if (!bossFight && !pl.dead && ttHeroIn(0)) {
    const hi = ttHeroI();
    if (tbRides(ttBd.mao, pl) || tbRides(ttBd.ante, pl) || (hi > -50 && hi < 62) || ttLascas.some(s => s.flash > 0)) ttStart();
  }
  const e = ttTita;
  if (!e || !bossFight || !bossFight.tt) { if (Math.random() < dt * 0.4 && ttHeroIn(8)) ttqDust(TB.ax + (Math.random() - 0.5) * 130 * T, TB.ay - 52 * T, 1, 0); return; }
  if (!pl.dead && !ttHeroIn(2)) { endBossFight(false); return; }
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
});
// morreu ou usou o portal: o titã deita e as lascas voltam (o herói renasce fora)
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.tt) bossFight = null;
  ttTita = null; ttLascas.length = 0; ttClear(); if (ttZoom) { ttqZoom(false); }
  TB.parts.length = 0; TB.on = false; ttBd = null;
  ttState.dead = !!(sv && sv.ultimoTita && sv.ultimoTita.dead);   // antes da geração: ttDress lê
  return _nw(sd, sv);
}; }
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.ultimoTita = { dead: ttState.dead };
  if (o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([, t]) => t !== TT_BARREIRA);
  return o;
}; }
// morrer na luta: o reinício (o 10 chama endBossFight(false) quando o herói cai? garante aqui)
HOOK.update.push(() => { if (bossFight && bossFight.tt && pl.dead) endBossFight(false); });

/* ---------- A Foice de Cronos ---------- */
STAT_DEF.lgFoice = { t: '+50% de dano contra os grandes (pesados e chefes), e todo golpe empurra até quem não recua', flag: 1 };
STAT_KEYS.push('lgFoice');
ITEMS.foice_cronos = {
  name: 'A Foice de Cronos', slot: 'weapon', kind: 'axe', rar: 4,
  pal: { w: '#ffffff', W: '#d0e4dc', l: '#5e7470', g: '#7a948a', G: '#2e3a38', h: '#4a3a28', p: '#a8b88a' },
  legend: [['lgFoice', 1], ['crit', 0.06], ['dmgPct', 0.12]],
  desc: 'Um caco do fio que derrubou os titãs, encabado num osso do último deles. Não cega, e o que é grande cai.'
};
BASE_INFO.foice_cronos = [TTQ_L, 0.94];
ITEM_G.foice_cronos = 1; ITEMS.foice_cronos.g = 1;
ttqDrops();
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgFoice || 0;
  if (!pl.lg) pl.lg = {}; pl.lg.foice = b > 0;
  return r;
}; }

/* ---------- som: o urro, a batida, o sopro, o tremor ---------- */
Object.assign(sfx, {
  ttAcorda() { tone(40, 2.4, 'sawtooth', 0.05, 20); noise(2.2, 0.08, 220, 'lowpass', 0, 0.5); for (let k = 0; k < 5; k++) noise(0.2, 0.05, 600 + k * 100, 'bandpass', 0.4 + k * 0.3, 2); },
  ttDedos() { for (let k = 0; k < 6; k++) { noise(0.12, 0.08, 500 + k * 80, 'lowpass', k * 0.09); tone(70 + k * 6, 0.15, 'square', 0.02, -20, k * 0.09); } },
  ttRange(v = 1) { tone(60, 0.9, 'sawtooth', 0.03 * v, 30); noise(0.9, 0.05 * v, 400, 'bandpass', 0, 3); tone(90, 0.6, 'square', 0.008 * v, -20, 0.3); },
  ttWhoosh(v = 1) { noise(0.35, 0.12 * v, 500, 'lowpass', 0, 0.5); },
  ttBatida(v = 1) { tone(36, 0.8, 'sine', 0.2 * v, -12); noise(0.6, 0.2 * v, 200, 'lowpass'); for (let k = 0; k < 6; k++) noise(0.04, 0.05 * v, 1400 + Math.random() * 1200, 'bandpass', 0.06 + k * 0.06, 3); },
  ttVarre() { noise(1, 0.1, 300, 'lowpass', 0, 0.4); tone(50, 1, 'sawtooth', 0.03, 15); },
  ttInspira() { noise(1, 0.06, 500, 'bandpass', 0, 1); tone(80, 1, 'sine', 0.03, 30); },
  ttSopro() { noise(0.8, 0.14, 700, 'lowpass', 0, 0.6); tone(70, 0.6, 'sawtooth', 0.03, -30); },
  ttSacode() { for (let k = 0; k < 8; k++) noise(0.1, 0.1, 300 + Math.random() * 300, 'lowpass', k * 0.1); tone(44, 0.9, 'sine', 0.12, -10); },
  ttErgue() { tone(38, 2.6, 'sawtooth', 0.05, 30); noise(2.6, 0.08, 260, 'lowpass', 0, 0.5); },
  ttOlharCarrega() { tone(300, 1, 'sine', 0.02, 500); tone(450, 1, 'triangle', 0.008, 700); },
  ttOlhar() { tone(900, 0.5, 'sawtooth', 0.02, -400); noise(0.5, 0.05, 3000, 'bandpass', 0, 2); },
  ttLascaBate() { tone(1800, 0.15, 'sine', 0.03, -400); noise(0.08, 0.05, 4000, 'highpass'); },
  ttLascaParte() { tone(1400, 0.6, 'sine', 0.05, -800); tone(2100, 0.4, 'sine', 0.02, -1000, 0.05); noise(0.5, 0.12, 3000, 'bandpass', 0, 1); },
  ttUrro(v = 1) { tone(55 * v, 1.6, 'sawtooth', 0.06, -15); tone(82 * v, 1.4, 'square', 0.015, -20, 0.1); noise(1.6, 0.1, 350, 'lowpass', 0, 0.5); },
  ttMorte() { tone(40, 3.2, 'sawtooth', 0.06, -15); noise(3, 0.12, 200, 'lowpass', 0, 0.4); for (let k = 0; k < 10; k++) noise(0.15, 0.06, 500 + k * 90, 'lowpass', 0.8 + k * 0.2); }
});
