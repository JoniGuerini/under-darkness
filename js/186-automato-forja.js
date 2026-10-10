'use strict';

/* ================= O Autômato-Forja: o chefe da Fortaleza dos Anões =================
   A Grande Forja que o 185 abre nas Forjas de Runas (anBoss: um salão vazio de 64 x 28, casca de 2 de tijolo
   refratário e cantaria, uma porta de 4 de altura rente ao chão em cada parede lateral). O anDress (o 185 chama
   depois da geração) monta o lado de dentro: o trilho de bronze a 3 blocos do teto, de parede a parede (desenhado
   aqui, sem bloco); o canal de lava que atravessa a sala por baixo do chão, com 3 trechos de grade por cima; as duas
   bicas de lava (calhas de bronze) no teto; e, nas paredes laterais, as quatro plataformas de cantaria com escada:
   embaixo a alavanca de lava (abre a bica do seu lado), em cima a alavanca de trava (enfia uma barra nas engrenagens
   do trilho).
   A máquina que movia a forja: uma ponte rolante com corpo de fornalha, um cadinho embaixo e dois braços (um malho e
   uma garra). Os anões a deixaram ligada para segurar a porta enquanto fugiam; ela ainda segura. Ao entrar, os
   Portões de Runas fecham as duas portas (sair, por portal ou morrendo, reinicia tudo: a sala volta célula por
   célula, o trilho reto, as alavancas carregadas, as grades frias, as engrenagens somem).
   Ela nunca está no chão. Só os braços tomam dano, quando estão embaixo; o núcleo, só com a escotilha aberta (+100%).
     1. a ponte rolante (100% a 60%): corre pelo trilho por cima do herói. O malho (o braço sobe e a sombra fica no
        chão 0,8 s; desce e solta faíscas 2 blocos para cada lado), o cadinho (inclina e pinga 1 s; derrama metal numa
        faixa de 3 blocos que queima 4 s), a garra (gira e assobia 0,7 s, desce reta; se pega, sobe e solta do alto).
     2. a forja acorda (60% a 25%): mais rápida; solta Enxames de Engrenagens pela escotilha (2 no máximo); as grades
        acendem em sequência (laranja 1 s, queimam 2 s); às vezes a garra estica devagar até uma alavanca de lava e
        puxa (3 golpes na garra esticada a fazem soltar).
     3. o trilho cede (25% a 0): poeira e estalo, um suporte arrebenta e o trilho fica inclinado, preso só de um lado;
        ela fica pendurada na ponta baixa e balança como pêndulo (recua rangendo antes de cada balanço). O trilho
        inclinado é uma rampa: do alto da plataforma de trava o herói pula nele e desce até as costas dela, onde o
        núcleo fica exposto no topo do balanço. As travas param o pêndulo onde estiver; a bica despeja sozinha
        quando o pêndulo passa embaixo dela com a alavanca carregada.
   As alavancas: tecla de usar (E) ou um golpe da arma. Recarregam em 12 s (a runa apaga e volta a acender). Lava:
   a bica pinga 1 s e despeja 3 s; quem estiver embaixo queima (ela perde 6% da vida e fica vermelha e lenta 3 s).
   Trava: o trilho para 4 s com um estalo, ela fica presa e a escotilha do núcleo abre.
   Depois da morte o trilho fica caído (rampa) e as alavancas viram decoração; só `autoforja.dead` vai para o save
   (o lado que cede vem da posição da sala, então o trilho cai sempre igual). Solta o Malho da Grande Forja (maça
   lendária: no 4º golpe seguido no mesmo alvo, um anel de brasa de 2 blocos, dano de fogo) e, com 50%, uma das três
   bases da camada.
   Encaixa como o Sineiro (137): anDress, endBossFight, hitEnemy, killEnemy, breakTile, updatePlayer, recalc,
   propLights, makeSave e newWorld embrulhados; o resto por AI/DRAW_E/HOOK. Carrega depois do 188, antes do 49. */

// nível pela posição da camada na lista (129); números escritos como os dos monstros, o 49 escala
const AF_L = layerBossLvl('anoes');
const AF = {
  hp: Math.round(330 * (1 + 0.3 * (AF_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (AF_L - 1))), xp: 480, p2: 0.6, p3: 0.25,
  lava: 0.06, lockT: 4, leverCD: 12, heat: 3, pourT: 3, dripT: 1
};
const afState = { dead: false };
ET.autoforja = { name: 'O Autômato-Forja', w: 54, h: 34, hp: AF.hp, dmg: AF.dmg, xp: AF.xp, kb: 0, fly: true, phase: true, blood: '#ffa62a', boss: true };
// os braços: dois pedaços que só repassam o golpe para o corpo (como os bulbos da Mãe-Esporo)
ET.afparte = { name: 'O Autômato-Forja', w: 22, h: 20, hp: 999999, dmg: 0, xp: 0, kb: 0, fly: true, phase: true, blood: '#c49448', boss: true };
const AF_DROPS = [['malho_forja', 1], ['pocao', 1, 2, 4], ['min_mithril', 1, 6, 10], ['runa_gravada', 1, 2, 4], ['mola_runica', 1, 2, 4], ['brasa_domada', 1, 2, 4]];
DROPS.autoforja = AF_DROPS.filter(([id]) => ITEMS[id]);
DROPS.afparte = [];
let afBoss = null, afSnap = null, afG = null, afG0 = null, afLevSwing = -9;
const afFx = { gates: [], pours: [], bands: [], drops: [], rings: [], grates: [], fallCru: null, clankT: 0, frame: 0 };
const afLev = [0, 1, 2, 3].map(() => ({ cd: 0, pull: 0 }));
const afRail = { k: 0 };   // 0 reto, 1 caído (a rampa)

/* ---------- a planta da sala, em colunas canônicas (0 a 63 a partir da parede da esquerda) ---------- */
const AF_U = 64 * T;                                   // largura de dentro em px
const AF_RAIL_R = 3;                                   // linha do trilho (do topo de dentro)
const AF_GRATES = [[7, 16], [27, 36], [47, 56]];       // os trechos de grade no chão
const AF_SPOUT_U = [11 * T, 53 * T];                   // os centros das duas bicas (sobre a 1ª e a 3ª grade)
const AF_STRUT_U = [96, 288, 480, 672];                // os suportes do trilho
const AF_UMIN = 114, AF_UMAX = AF_U - 114;             // por onde o carro anda (fora das plataformas)
const AF_TIP = 520;                                    // a ponta do trilho caído, contada da parede presa
const AF_RB = 100;                                     // do pivô ao centro do corpo, no pêndulo
const AF_TH_A = 82 * Math.PI / 180, AF_TH_F = 70 * Math.PI / 180;   // os topos do balanço: do lado da rampa e do outro

/* ---------- geometria ---------- */
function afGeo() {
  const B = anBoss; if (!B) return null;
  if (afG && afG0 === B) return afG;
  afG0 = B;
  const H = B.fy - B.top, lo = H - 8, up = 7;
  return afG = {
    x0: B.x0, top: B.top, fy: B.fy, cx: B.cx, H, lo, up, tipR: Math.min(16, H - 12),
    // o lado que fica preso quando o trilho cede: vem da posição da sala (o trilho cai sempre igual, até depois de carregar)
    A: hash2(B.cx, B.top, 7717) < 0.5 ? -1 : 1,
    levers: [{ c: 1, r: up - 1, kind: 'lava', s: 0 }, { c: 1, r: lo - 1, kind: 'trava' }, { c: 62, r: up - 1, kind: 'lava', s: 1 }, { c: 62, r: lo - 1, kind: 'trava' }]
  };
}
const afLap = x => { const W = WW * T, d = x - pl.x; return d > W / 2 ? x - W : d < -W / 2 ? x + W : x; };
const afCol = c => wrapX(afGeo().x0 + c);
const afI = (c, r) => (afGeo().top + r) * WW + afCol(c);
const afUx = u => afLap(afGeo().x0 * T) + u;            // px canônico -> px do mundo
const afXu = x => x - afLap(afGeo().x0 * T);            // px do mundo -> px canônico
const afRy = r => (afGeo().top + r) * T;
const afRailY = () => afRy(AF_RAIL_R);
const afFloorY = () => afGeo().fy * T;
// a altura em que o guincho deixa o corpo (o centro), na altura da plataforma de baixo: à vista de quem está no chão
const afHoistY = () => afRy(afGeo().H - 7);
// a rampa: a parede presa (uA) e a ponta (uT, yT); k anima a queda
const afUA = () => afGeo().A < 0 ? 0 : AF_U;
const afUT = () => afGeo().A < 0 ? AF_TIP : AF_U - AF_TIP;
const afYT = () => afRy(afGeo().tipR);
function afRampY(u, k = afRail.k) {
  const uA = afUA(), uT = afUT(); if ((u - uA) * (u - uT) > 0) return null;
  return afRailY() + (afYT() - afRailY()) * k * Math.abs(u - uA) / Math.abs(uT - uA);
}
const afTip = () => [afUx(afUT()), afRailY() + (afYT() - afRailY()) * afRail.k];
// a sala com a casca: o que nada quebra durante a luta
function afGuard(tx, ty) { const g = afGeo(); if (!g) return false; const dx = wdx(wrapX(tx) - g.x0); return dx >= -3 && dx <= 66 && ty >= g.top - 3 && ty <= g.fy + 3; }
// as alavancas da Grande Forja (o 181 não desenha estas: o 186 desenha ao vivo com o estado)
function afLeverAt(tx, ty) {
  const g = afGeo(); if (!g) return -1;
  for (let k = 0; k < g.levers.length; k++) { const L = g.levers[k]; if (afCol(L.c) === wrapX(tx) && g.top + L.r === ty) return k; }
  return -1;
}
const afLeverCell = (tx, ty) => afLeverAt(tx, ty) >= 0;
// bem dentro da sala (2 colunas além das portas): a luta começa
function afInside(tx, ty) { const g = afGeo(); return !!g && Math.abs(wdx(tx - g.cx)) < 30 && ty >= g.top && ty < g.fy; }
const afLeverXY = k => { const L = afGeo().levers[k]; return [afUx(L.c * T + 6), afRy(L.r) + 6]; };
function afDrop(m) { const k = enemies.indexOf(m); if (k >= 0) enemies.splice(k, 1); m.dead = true; }
const afDirty = i => { if (chunks.size) markDirty(i % WW, (i / WW) | 0); };

/* ---------- o lado de dentro (o 185 chama anDress depois da geração) ----------
   Escreve: todo o ar de dentro (c 0..63, linhas top..fy-1) e as paredes de fundo dele; o chão (fy: laje e as 3
   grades); o canal (fy+1: lava de c 0 a 63 e pedra de canal nas duas colunas da casca de cada lado; fy+2: pedra
   de canal de c -2 a 65); as plataformas, escadas, alavancas, lâmpadas e braseiros. Põe no anKeep a sala inteira
   com a casca (x0-2..x1+2, top-2..fy+2). */
function anDress() {
  if (!anBoss) return;
  afG = null; const g = afGeo(), H = g.H;
  const put = (c, r, t) => { tiles[afI(c, r)] = t; };
  for (let r = 0; r < H; r++) for (let c = 0; c < 64; c++) {
    const i = afI(c, r); tiles[i] = AIR;
    walls[i] = r <= 4 ? WAN_BRONZE : (c < 7 || c > 56) ? WAN_CANTARIA : WAN_TIJOLO;
  }
  // o chão: laje gravada, e a grade sobre o canal em três trechos
  for (let c = 0; c < 64; c++) put(c, H, AF_GRATES.some(([a, b]) => c >= a && c <= b) ? AN_GRADE : AN_LAJE);
  // o canal: lava numa fileira debaixo do chão, de parede a parede, em leito de pedra de canal (nunca no caminho)
  for (let c = -2; c < 66; c++) {
    const lava = c >= 0 && c < 64;
    put(c, H + 1, lava ? LAVA : AN_CANAL); put(c, H + 2, AN_CANAL);
    if (lava) { walls[afI(c, H + 1)] = WAN_TIJOLO; walls[afI(c, H)] = WAN_TIJOLO; }
  }
  // as plataformas de cantaria nas paredes, com a escada anã atravessando as duas
  for (const [c0, lad] of [[0, 5], [57, 58]]) {
    for (const r of [g.lo, g.up]) for (let c = c0; c < c0 + 7; c++) put(c, r, AN_CANTARIA);
    for (let r = g.up; r < H; r++) put(lad, r, AN_ESCADA);
  }
  for (const L of g.levers) put(L.c, L.r, AN_ALAVANCA);
  // luz: lâmpadas de runa nas paredes e sob o trilho, braseiros na laje entre as grades
  for (const [c, r] of [[0, 2], [63, 2], [0, g.lo - 5], [63, g.lo - 5], [20, 6], [43, 6]]) put(c, r, AN_LAMPADA);
  for (const c of [22, 41]) put(c, H - 1, AN_BRASEIRO);
  // nada dos túneis, ligações e decoração da camada mexe nela
  for (let y = g.top - 2; y <= g.fy + 2; y++) for (let k = -2; k < 66; k++) anKeep.add(y * WW + wrapX(g.x0 + k));
  // objetos de cena da camada que tenham caído dentro saem
  if (typeof PROPS !== 'undefined' && PROPS.length) {
    let any = false;
    for (let k = PROPS.length - 1; k >= 0; k--) { const p = PROPS[k]; if (p.def && p.def.anoes && inAnHall(Math.floor((p.X + p.w / 2) / T), Math.floor((p.Y + p.h / 2) / T), 1)) { PROPS.splice(k, 1); any = true; } }
    if (any) { propBuckets.clear(); propBySup.clear(); const keep = PROPS.slice(); PROPS.length = 0; for (const p of keep) addProp(p.def, p.v, p.X, p.Y, p.sup); }
  }
  for (const L of afLev) { L.cd = 0; L.pull = 0; }
  afRail.k = afState.dead ? 1 : 0;
}

/* ---------- o retrato: a sala antes da luta, escrito de volta no reinício ---------- */
function afSnapTake() {
  const g = afGeo(), X0 = g.x0 - 3, n = 70, Y0 = g.top - 3, m = g.fy + 3 - Y0 + 1;
  const S = { X0, Y0, n, m, t: new Uint16Array(n * m), w: new Uint16Array(n * m), d: new Map() };
  for (let y = 0; y < m; y++) for (let x = 0; x < n; x++) {
    const i = (Y0 + y) * WW + wrapX(X0 + x), k = y * n + x;
    S.t[k] = tiles[i]; S.w[k] = walls[i];
    if (diffs.has(i)) S.d.set(i, diffs.get(i));
  }
  afSnap = S;
}
function afSnapPut() {
  const S = afSnap; if (!S) return;
  for (let y = 0; y < S.m; y++) for (let x = 0; x < S.n; x++) {
    const i = (S.Y0 + y) * WW + wrapX(S.X0 + x), k = y * S.n + x;
    if (tiles[i] !== S.t[k] || walls[i] !== S.w[k]) { tiles[i] = S.t[k]; walls[i] = S.w[k]; afDirty(i); }
    if (S.d.has(i)) diffs.set(i, S.d.get(i)); else diffs.delete(i);
  }
  mapVer++;
}

/* ---------- os Portões de Runas: fecham as duas portas durante a luta ---------- */
function afGates(on) {
  const B = anBoss, g = afGeo(); if (!B || !g) return;
  if (on) {
    afFx.gates.length = 0;
    const doors = B.doors && B.doors.length ? B.doors : [{ side: -1, fy: B.fy }, { side: 1, fy: B.fy }];
    for (const D of doors) {
      const s = D.side < 0 ? -1 : 1, x1 = s < 0 ? g.x0 - 1 : g.x0 + 64, fy = D.fy || B.fy;
      for (let k = 0; k < 2; k++) for (let y = fy - 4; y < fy; y++) {
        const x = wrapX(x1 + s * k), i = y * WW + x, t = tiles[i]; if (SOLID[t]) continue;
        afFx.gates.push([i, t]); tiles[i] = AN_BARREIRA; afDirty(i);
        if (k === 0) burst(afLap(x * T + 6), y * T + 6, 3, '#3aa8d8', 40, 120, 0.5, 1, true);
      }
    }
    sfx.afPortao();
  } else {
    for (const [i, t] of afFx.gates) if (tiles[i] === AN_BARREIRA) { tiles[i] = t; afDirty(i); burst(afLap((i % WW) * T + 6), ((i / WW) | 0) * T + 6, 3, '#7ad0f0', 40, 80, 0.5, 1, true); }
    afFx.gates.length = 0;
  }
  mapVer++;
}
// nada quebra a sala durante a luta; as alavancas só quebram depois que ela morre
{ const _bt = breakTile; breakTile = function (tx, ty) { if ((bossFight && bossFight.af && afGuard(tx, ty)) || (!afState.dead && afLeverCell(tx, ty))) return; return _bt(tx, ty); }; }

/* ---------- o Malho da Grande Forja ---------- */
STAT_DEF.lgMalho = { t: 'Cada golpe seguido no mesmo alvo esquenta a cabeça; no 4º, um anel de brasa: dano de fogo em volta (2 blocos)', flag: 1 };
STAT_KEYS.push('lgMalho');
ITEMS.malho_forja = {
  name: 'Malho da Grande Forja', slot: 'weapon', kind: 'mace', rar: 4,
  pal: { w: '#e8c27a', W: '#9a6a2c', l: '#4a2e14', g: '#3a2a18', G: '#241a10', h: '#2a1a0c', p: '#ffa62a' },
  legend: [['lgMalho', 1]],
  desc: 'O malho do braço do Autômato-Forja, ainda morno. A cabeça de bronze guarda o calor de cada golpe e devolve tudo de uma vez.'
};
BASE_INFO.malho_forja = [AF_L, 0.76];
ITEM_G.malho_forja = 0; ITEMS.malho_forja.g = 0;
DROPS.autoforja = AF_DROPS.filter(([id]) => ITEMS[id]);
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgMalho || 0;
  if (pl.lg) pl.lg.malho = b > 0;
  return r;
}; }
// um golpe acertou: conta um por golpe, no mesmo alvo (um pedaço do chefe conta como ele); 1,5 s sem acertar recomeça
const afMal = { n: 0, tgt: null, at: -9, last: -9, busy: false };
function afMalhoHit(e) {
  const tgt = e.afBoss || e;
  if (afMal.at === pl.atkAt) return;
  afMal.at = pl.atkAt;
  if (gameTime - afMal.last > 1.5 || afMal.tgt !== tgt) afMal.n = 0;
  afMal.last = gameTime; afMal.tgt = tgt;
  if (++afMal.n < 4) return;
  afMal.n = 0;
  afAnel();
}
// o anel de brasa: 2 blocos em volta do herói, dano de fogo (a afinidade e a queima do 113)
function afAnel() {
  const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2, R = 2 * T;
  afFx.rings.push({ x: cx, y: cy, t: 0 });
  sfx.afAnel(); shake(2);
  burst(cx, cy, 16, '#ffa62a', 110, 60, 0.45, 1, true); burst(cx, cy, 8, '#ffe08a', 60, 0, 0.3, 1, true);
  afMal.busy = true;
  const dc = typeof dmgCtx !== 'undefined' ? dmgCtx : null;
  try {
    for (const m of enemies.slice()) {
      if (m.dead || m.cdVoid) continue;
      const nx = clamp(cx, m.x, m.x + m.w), ny = clamp(cy, m.y, m.y + m.h);
      if (Math.hypot(nx - cx, ny - cy) > R) continue;
      const aff = typeof fgAff === 'function' ? fgAff(m) : 1;
      hitEnemy(m, Math.sign(m.x + m.w / 2 - cx) || pl.facing, 0.7 * aff, false);
      if (!m.dead && m.type !== 'afparte' && m.type !== 'autoforja' && typeof fgIgnite === 'function') fgIgnite(m);
    }
  } finally { afMal.busy = false; if (dc !== null) dmgCtx = dc; }
}

/* ---------- arte ---------- */
const AFA = {};
{
const { cg } = CVART;
const RAMPS = [];
const R6 = hexes => { const R = hexes.map(h => ph(h)); R.k = RAMPS.length; RAMPS.push(R); return R; };
const PAL = {
  bronze: R6(['#2a1a0c', '#4a2e14', '#70461e', '#9a6a2c', '#c49448', '#e8c27a']),
  patina: R6(['#1a2a24', '#264036', '#345a4a', '#4a7a62', '#6a9a7e', '#94bca0']),
  tijolo: R6(['#3a2a18', '#5a4024', '#7a5832', '#9a7444', '#bc9660', '#dcbc88']),
  lava: R6(['#3a0c04', '#7a1e06', '#b8400a', '#e8700e', '#ffa62a', '#ffe08a']),
  runa: R6(['#0e2a3a', '#145070', '#1e7aa8', '#3aa8d8', '#7ad0f0', '#d0f4ff']),
  ferro: R6(['#121418', '#1e2228', '#2e343c', '#424a54', '#5a646e', '#7a848c']),
  granito: R6(['#1e2228', '#2e343c', '#424a54', '#5a646e', '#7a848c', '#9ea6ac'])
};
const sm = t => t * t * (3 - 2 * t);
function nz(x, y, sc, s) {
  const fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy), ux = sm(fx - ix), uy = sm(fy - iy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy - 0.5;
}
// o pintor (o mesmo do Sineiro): cada rampa lembra seu índice, e o contorno pega o tom mais escuro do que contorna
function pp(w, h) {
  const c = new Uint32Array(w * h), rid = new Int16Array(w * h).fill(-1);
  const P = {
    w, h, c, rid,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; c[i] = R[v < 0 ? 0 : v > 5 ? 5 : v | 0]; rid[i] = R.k; },
    has(x, y) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0; },
    blob(cx, cy, rx, ry, R, s, base = 2.6, f) {
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
        const e = f ? f(x, y, dx, dy) : 0; if (e === null) continue;
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
    outline() {
      const o = c.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!c[i]) continue;
        const air = (x > 0 && !c[i - 1]) || (x < w - 1 && !c[i + 1]) || (y > 0 && !c[i - w]) || (y < h - 1 && !c[i + w]) || x === 0 || y === 0 || x === w - 1 || y === h - 1;
        if (air) o[i] = RAMPS[rid[i]][0];
      }
      c.set(o);
    },
    canvas() { const cv = mk(w, h), x = cv.getContext('2d'), im = x.createImageData(w, h); new Uint32Array(im.data.buffer).set(c); x.putImageData(im, 0, 0); return cv; }
  };
  return P;
}
// uma tela girada por `a` (radianos, horário na tela) em volta de (px, py), pixel mais perto, numa tela n x n com o ponto no meio
function turn(src, a, px, py, n) {
  const sw = src.width, sh = src.height, S = new Uint32Array(src.getContext('2d').getImageData(0, 0, sw, sh).data.buffer);
  const o = mk(n, n), ox = o.getContext('2d'), im = ox.createImageData(n, n), D = new Uint32Array(im.data.buffer), ca = Math.cos(a), sa = Math.sin(a), h = n / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = x + 0.5 - h, dy = y + 0.5 - h, sx = Math.floor(px + dx * ca + dy * sa), sy = Math.floor(py - dx * sa + dy * ca);
    if (sx >= 0 && sy >= 0 && sx < sw && sy < sh) D[y * n + x] = S[sy * sw + sx];
  }
  ox.putImageData(im, 0, 0); return o;
}
const tint = (src, col) => { const c = mk(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; };
// bronze com pátina em manchas
const bzR = (x, y, s) => nz(x, y, 6, s) > 0.22 ? PAL.patina : PAL.bronze;

/* o trilho: uma viga em I de bronze de parede a parede, rebites a cada bloco, talas a cada 8 */
function paintRail() {
  const W = AF_U, Q = pp(W, 9);
  for (let y = 0; y < 9; y++) for (let x = 0; x < W; x++) {
    let v = [4.4, 3.9, 1.6, 2.4, 2.2, 1.9, 3.1, 2.4, 1.4][y] + cg(x, y, 8101) * 0.5;
    const jx = x % 96;
    if (jx < 6 && y >= 2 && y <= 6) { v += 0.7; if ((jx === 1 || jx === 4) && (y === 3 || y === 5)) v += 1.4; }
    else if (x % 12 === 6 && y === 4) v += 1.8;
    else if (x % 12 === 6 && y === 5) v -= 0.8;
    if (hash2(x, y, 8102) < 0.03) v -= 0.9;                                       // gasto
    Q.put(x, y, y >= 2 && y <= 6 && nz(x, y, 9, 8103) > 0.2 ? PAL.patina : PAL.bronze, v);
  }
  Q.outline(); return Q.canvas();
}
// um suporte: placa no teto, a barra, a braçadeira que abraça o trilho
function paintStrut() {
  const Q = pp(8, 38);
  for (let y = 0; y < 38; y++) for (let x = 0; x < 8; x++) {
    const plate = y < 3 || y > 33, bar = x >= 2 && x <= 5;
    if (!plate && !bar) continue;
    let v = plate ? 3.3 - (x / 8) * 0.8 - (y > 33 ? 0.5 : 0) : 3.5 - (x - 2) * 0.55;
    if (plate && (x === 1 || x === 6) && (y === 1 || y === 35)) v += 1.5;
    if (!plate && y % 8 === 4 && x === 3) v += 1.4;
    Q.put(x, y, bzR(x, y, 8111), v + cg(x, y, 8112) * 0.5);
  }
  Q.outline(); return Q.canvas();
}
/* o carro da ponte rolante: duas rodas de ferro sobre o trilho, a caixa do eixo, as placas que descem pela frente do
   trilho até o corpo (48 x 26; a parte de baixo das rodas na linha 13) */
function paintTrolley() {
  const Q = pp(48, 26), { ferro, runa } = PAL;
  for (const wx of [12, 35]) for (let y = 0; y < 14; y++) for (let x = wx - 7; x <= wx + 7; x++) {
    const dx = x + 0.5 - wx, dy = y + 0.5 - 6.5, d = Math.hypot(dx, dy); if (d > 6.4) continue;
    if (d > 4.7) Q.put(x, y, ferro, 3.6 - dx / 6 * 0.9 - dy / 6 * 1.1 + cg(x, y, 8121) * 0.5);
    else if (d < 1.7) Q.put(x, y, PAL.bronze, 4.2 - dx * 0.4 - dy * 0.4);
    else Q.put(x, y, ferro, Math.abs(Math.sin(Math.atan2(dy, dx) * 3)) < 0.3 ? 2.6 : 0.7);
  }
  for (let y = 5; y < 10; y++) for (let x = 4; x < 44; x++) Q.put(x, y, bzR(x, y, 8122), 3.4 - (y - 5) * 0.5 - (x - 4) / 40 * 0.6 + (x % 8 === 3 && y === 7 ? 1.5 : 0) + cg(x, y, 8123) * 0.5);
  for (let y = 10; y < 26; y++) {
    const ins = Math.floor((y - 10) * 0.35), x0 = 8 + ins, x1 = 39 - ins;
    for (let x = x0; x <= x1; x++) {
      let v = 2.9 - (x - x0) / (x1 - x0) * 0.9 - (y - 10) / 16 * 0.6 + cg(x, y, 8124) * 0.6;
      if (x === x0) v += 0.8;
      if ((x === x0 + 2 || x === x1 - 2) && (y % 5 === 2)) v += 1.6;
      if (y === 15 || y === 22) v -= 0.6;
      Q.put(x, y, bzR(x, y, 8125), v);
    }
  }
  for (let y = 16; y < 21; y++) for (let x = 22; x < 26; x++) Q.put(x, y, runa, (x === 23 || y === 18) ? 4.3 : 1.4);   // a runa do carro
  Q.outline(); return Q.canvas();
}
/* o corpo (60 x 50, a garra à direita): caixa de tijolo refratário em fiadas com moldura de bronze rebitada, duas
   chaminezinhas, a boca da fornalha aberta no peito com a lava dentro (a porta aberta na dobradiça), embaixo a
   escotilha do núcleo (fechada: um disco de bronze; aberta: a runa azul viva), os ombros com runas */
const BW = 60, BH = 50;
function paintBody(lf, open) {
  const Q = pp(BW, BH), S = 8200 + lf * 31, { tijolo, lava, runa } = PAL;
  const bz = (x, y, v, s) => Q.put(x, y, bzR(x, y, 8201), v + cg(x, y, s) * 0.5);
  for (const c0 of [9, 46]) for (let y = 0; y < 8; y++) for (let x = c0; x < c0 + 5; x++) {
    let v = 2.8 - (x - c0) * 0.4 + cg(x, y, S) * 0.6; if (y % 3 === 2) v -= 1.2; if (y === 0) v -= 0.6;
    Q.put(x, y, tijolo, v);
  }
  for (let y = 3; y < 8; y++) for (let x = 15; x < 45; x++) bz(x, y, 3.4 - (y - 3) * 0.45 - (x - 15) / 30 * 0.6 + ((x === 17 || x === 42) && y === 5 ? 1.5 : 0), S + 1);
  const X0 = 3, X1 = 56, Y0 = 7, Y1 = 43;
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    const cxn = Math.min(x - X0, X1 - x), cyn = Math.min(y - Y0, Y1 - y); if (cxn < 3 && cyn < 3 && (3 - cxn) ** 2 + (3 - cyn) ** 2 > 10) continue;
    if (x - X0 < 4 || X1 - x < 4 || y - Y0 < 3 || Y1 - y < 3) {
      let v = 3.1 - (x - X0) / (X1 - X0) * 0.9 - (y - Y0) / (Y1 - Y0) * 0.7;
      if (x - X0 === 0 || y - Y0 === 0) v += 0.9;
      if (X1 - x === 0 || Y1 - y === 0) v -= 0.8;
      const hz = y - Y0 < 3 || Y1 - y < 3;
      if ((hz && x % 6 === 1 && (y - Y0 === 1 || Y1 - y === 1)) || (!hz && y % 6 === 2 && (x - X0 === 1 || X1 - x === 1))) v += 1.6;
      if (hash2(x, y, S + 7) < 0.05) v -= 1;                                     // lascas na moldura
      bz(x, y, v, S + 2); continue;
    }
    const ry = y - (Y0 + 3), course = Math.floor(ry / 5), iy = ry % 5, off = (course & 1) ? 4 : 0, ix = (x - X0 - 4 + off) % 9;
    let v = 2.9 - (x - X0) / 53 * 0.9 - (y - Y0) / 36 * 0.6 + (hash2(Math.floor((x - X0 - 4 + off) / 9), course, S + 3) - 0.5) * 0.8 + cg(x, y, S + 4) * 0.7;
    if (iy === 4 || ix === 8) v = 0.9 + cg(x, y, S + 5) * 0.4;
    else if (iy === 0) v += 0.5;
    else if (ix === 0) v += 0.3;
    if (nz(x, y, 5, 8206) > 0.3) v -= 0.7;                                          // fuligem
    Q.put(x, y, tijolo, v);
  }
  // a boca da fornalha: um arco, a lava mexendo dentro (3 quadros), torrões de carvão escuro
  const MX0 = 19, MX1 = 41, MY0 = 12, MY1 = 28, mid = (MX0 + MX1) / 2;
  for (let y = MY0 - 3; y < MY0; y++) for (let x = MX0 - 2; x <= MX1 + 2; x++) {
    const rn = (x - MX0) % 5 === 2 && y === MY0 - 2 && x > MX0 && x < MX1;
    if (rn) Q.put(x, y, runa, 4.2); else bz(x, y, 3.6 - (y - MY0 + 3) * 0.7 + (x === MX0 - 2 ? 0.6 : 0), S + 8);
  }
  for (let y = MY0; y <= MY1; y++) for (let x = MX0; x <= MX1; x++) {
    const ay = y - MY0, cdx = Math.max(0, Math.abs(x + 0.5 - mid) - (MX1 - MX0) / 2 + 5);
    if (ay < 5 && cdx * cdx + (5 - ay) ** 2 > 26) continue;
    const rim = x === MX0 || x === MX1 || y === MY1 || (ay < 5 && cdx * cdx + (5 - ay) ** 2 > 17);
    if (rim) { Q.put(x, y, PAL.bronze, 1); continue; }
    let v = 2.0 + (y - MY0) / (MY1 - MY0) * 2.2 + nz(x, y + lf * 5, 4, 8210 + lf) * 2.6 - Math.abs(x + 0.5 - mid) / 11 * 0.9;
    if (nz(x + lf * 3, y, 3, 8220) > 0.3 && y > MY0 + 6) v = 0.6;                   // carvão
    Q.put(x, y, lava, v);
  }
  for (let y = 11; y < 30; y++) for (let x = 13; x < 17; x++) { let v = 2.6 + (x === 13 ? 1 : 0) - (x === 16 ? 1 : 0) - (y - 11) / 19 * 0.5; if ((y === 14 || y === 26) && x === 14) v += 2; bz(x, y, v, S + 9); }
  // a escotilha do núcleo
  const hx = 30, hy = 35;
  for (let y = hy - 6; y <= hy + 6; y++) for (let x = hx - 6; x <= hx + 6; x++) {
    const dx = x + 0.5 - hx, dy = y + 0.5 - hy, d = Math.hypot(dx, dy); if (d > 6) continue;
    if (!open) {
      let v = 3.4 - dx / 6 * 0.9 - dy / 6 * 1.1 - d / 6 * 0.4;
      if (d > 5) v -= 1.2; if (Math.abs(dx) < 0.6 || Math.abs(dy) < 0.6) v -= 0.8;
      if (Math.abs(d - 3.5) < 0.5 && hash2(x, y, 8230) < 0.6) Q.put(x, y, runa, 1.8);
      else bz(x, y, v, S + 10);
    } else if (d > 4.6) Q.put(x, y, PAL.bronze, d > 5.4 ? 0.6 : 1.6);
    else Q.put(x, y, runa, 4.8 - d * 0.55 - (dx + dy) * 0.25 + (d < 1.4 ? 0.6 : 0));
  }
  for (const [sx, sy] of [[5, 27], [54, 27]]) {
    Q.blob(sx, sy, 5.4, 5.4, PAL.bronze, S + 11, 2.7);
    for (const [ox, oy, v] of [[0, -2, 3.8], [0, -1, 4.6], [0, 0, 5], [0, 1, 4.6], [-1, 0, 3.4], [1, 0, 3.4], [0, 2, 3.2]]) Q.put(sx + ox, sy + oy, runa, v);
  }
  for (const rx of [X0 + 1, X1 - 1]) for (let y = 14; y < 22; y++) if (y % 3 !== 2) Q.put(rx, y, runa, y % 3 === 0 ? 4 : 2.6);   // runas nas faixas laterais
  for (const gx of [24, 35]) for (let y = 44; y < 50; y++) for (let x = gx; x < gx + 2; x++) bz(x, y, 3.2 - (x - gx) * 1.2, S + 12);
  Q.outline(); return Q.canvas();
}
// o cadinho: tigela de tijolo refratário com aro de bronze, metal derretido em cima, o bico à direita
function paintCrucible() {
  const Q = pp(30, 22), { tijolo, lava } = PAL;
  for (let y = 4; y < 21; y++) for (let x = 1; x < 29; x++) {
    const dx = (x + 0.5 - 15) / 13.5, dy = (y - 4) / 16; if (dx * dx + dy * dy > 1) continue;
    let v = 3.0 - dx * 1.1 - dy * 1.3 + cg(x, y, 8301) * 0.7; if ((y - 4) % 4 === 3) v -= 0.9;
    Q.put(x, y, tijolo, v);
  }
  for (let x = 1; x < 29; x++) for (let y = 2; y < 5; y++) Q.put(x, y, bzR(x, y, 8302), (y === 2 ? 4.2 : y === 3 ? 3 : 1.8) - (x - 1) / 28 * 0.7 + cg(x, y, 8303) * 0.5);
  for (let x = 4; x < 26; x++) Q.put(x, 3, lava, 4.2 + nz(x, 0, 3, 8304) * 2);
  for (const [x, y, v] of [[29, 2, 3.6], [29, 3, 2.6], [28, 1, 3.2]]) Q.put(x, y, PAL.bronze, v);
  for (const gx of [7, 22]) for (let y = 0; y < 2; y++) Q.put(gx, y, PAL.bronze, 3.4);
  Q.outline(); return Q.canvas();
}
// a cabeça do malho: bloco de ferro com cintas de bronze e uma runa na face
function paintHammer() {
  const Q = pp(26, 22), { ferro, runa } = PAL;
  for (let y = 0; y < 6; y++) for (let x = 9; x < 17; x++) Q.put(x, y, bzR(x, y, 8401), 3.4 - (x - 9) * 0.25 + (y === 2 && (x === 10 || x === 15) ? 1.4 : 0));
  for (let y = 5; y < 21; y++) for (let x = 1; x < 25; x++) {
    const band = (x >= 4 && x <= 6) || (x >= 19 && x <= 21);
    let v = 3.3 - (x - 1) / 24 * 1.2 - (y - 5) / 16 * 0.8 + cg(x, y, 8402) * 0.6;
    if (y === 5) v += 1; if (y >= 19) v += 0.6;                                     // a face de bater, polida
    if (hash2(x, y, 8403) < 0.05) v -= 1;
    if (band) Q.put(x, y, bzR(x, y, 8404), v + 0.4 + (y % 5 === 1 && x % 3 === 2 ? 1.2 : 0));
    else Q.put(x, y, ferro, v);
  }
  for (const [x, y] of [[12, 9], [12, 10], [13, 11], [12, 12], [12, 13], [11, 11], [13, 9], [13, 14]]) Q.put(x, y, runa, 4.4);
  Q.outline(); return Q.canvas();
}
// a garra: punho de bronze com runa e três dedos curvos (aberta ou fechada)
function paintClaw(open) {
  const Q = pp(26, 26), { ferro, runa } = PAL;
  const F = open ? [[[10, 9], [3, 17], [5, 24]], [[16, 9], [23, 17], [21, 24]], [[13, 10], [13, 18], [12, 24]]] : [[[10, 9], [6, 17], [11, 23]], [[16, 9], [20, 17], [15, 23]], [[13, 10], [13, 17], [13, 22]]];
  for (const [a, b, c] of F) { Q.tube(a[0], a[1], b[0], b[1], 2.2, 1.8, ferro, 8501, 2.4); Q.tube(b[0], b[1], c[0], c[1], 1.8, 1.1, ferro, 8502, 2.6, (x, y, t) => t > 0.7 ? 0.8 : 0); }
  for (let y = 0; y < 11; y++) for (let x = 8; x < 19; x++) {
    const d = Math.abs(x + 0.5 - 13.5) - 5 + Math.max(0, y - 7); if (d > 0) continue;
    Q.put(x, y, bzR(x, y, 8503), 3.5 - (x - 8) * 0.2 - y * 0.12 + (y === 1 ? 0.8 : 0) + cg(x, y, 8504) * 0.5);
  }
  for (const [x, y, v] of [[13, 3, 4.4], [13, 4, 5], [13, 5, 4.4], [12, 4, 3.4], [14, 4, 3.4], [13, 6, 3.2]]) Q.put(x, y, runa, v);
  Q.outline(); return Q.canvas();
}
// um elo do braço (o 4º de cada série leva uma runa)
function paintLink(rn) {
  const Q = pp(8, 8);
  Q.blob(4, 4, 3.8, 3.8, PAL.bronze, 8601, 2.6, (x, y, dx, dy) => (dx * dx + dy * dy < 0.18 ? (rn ? null : -1.6) : 0));
  if (rn) { Q.put(3, 3, PAL.runa, 4.6); Q.put(4, 4, PAL.runa, 5); Q.put(3, 4, PAL.runa, 3.8); Q.put(4, 3, PAL.runa, 3.6); }
  Q.outline(); return Q.canvas();
}
// a alavanca dos anões: pedestal de granito com a fenda da runa, cabo de bronze com pomo (pronta: inclinada para trás)
function paintLever(down, lit) {
  const Q = pp(12, 12), { granito, runa } = PAL;
  if (down) Q.tube(6, 7, 10.5, 3.5, 1.1, 0.9, PAL.bronze, 8701, 2.8); else Q.tube(6, 7, 2.5, 1.5, 1.1, 0.9, PAL.bronze, 8701, 2.8);
  if (down) Q.blob(10.5, 3.2, 1.7, 1.7, PAL.bronze, 8702, 3.2); else Q.blob(2.4, 1.6, 1.7, 1.7, PAL.bronze, 8702, 3.2);
  for (let y = 7; y < 12; y++) for (let x = 1; x < 11; x++) {
    let v = 3.2 - (x - 1) / 10 * 0.9 - (y - 7) / 5 * 0.9 + cg(x, y, 8703) * 0.6; if (y === 7) v += 0.8; if ((x === 1 || x === 10) && y === 7) continue;
    Q.put(x, y, granito, v);
  }
  for (let x = 4; x < 8; x++) Q.put(x, 9, runa, lit ? (x === 5 || x === 6 ? 5 : 4) : 0.6);
  Q.put(5, 10, runa, lit ? 3.6 : 0.4);
  Q.outline(); return Q.canvas();
}
// a bica: uma calha de bronze presa ao teto por uma braçadeira, a boca virada para baixo
function paintSpout() {
  const Q = pp(30, 26), { lava } = PAL;
  for (let y = 0; y < 9; y++) for (let x = 12; x < 18; x++) Q.put(x, y, bzR(x, y, 8801), 3.4 - (x - 12) * 0.4 + (y === 3 && x === 13 ? 1.4 : 0) + cg(x, y, 8802) * 0.5);
  for (let y = 8; y < 16; y++) for (let x = 1; x < 29; x++) {
    const ty = 8 + Math.abs(x - 15) * 0.18; if (y < ty || y > ty + 6) continue;
    let v = 3.3 - (y - ty) * 0.45 - (x - 1) / 28 * 0.6 + cg(x, y, 8803) * 0.6; if (y - ty < 1) v += 0.8; if (x % 7 === 3 && Math.round(y - ty) === 3) v += 1.4;
    Q.put(x, y, bzR(x, y, 8804), v);
  }
  for (let y = 14; y < 22; y++) for (let x = 10; x < 20; x++) {
    const w = 5 - (y - 14) * 0.3; if (Math.abs(x + 0.5 - 15) > w) continue;
    const inner = Math.abs(x + 0.5 - 15) < w - 1.6;
    if (inner) Q.put(x, y, lava, y > 18 ? 1.2 : 0.4); else Q.put(x, y, bzR(x, y, 8805), 2.8 - (x - 10) * 0.15 + (y === 21 ? -0.6 : 0));
  }
  Q.outline(); return Q.canvas();
}
// a barra da trava, enfiada nas rodas
function paintBar() {
  const Q = pp(5, 18), { ferro } = PAL;
  for (let y = 0; y < 18; y++) for (let x = 0; x < 5; x++) Q.put(x, y, ferro, 3.6 - x * 0.6 + (y < 2 ? 0.8 : 0) + cg(x, y, 8901) * 0.5);
  for (let y = 2; y < 16; y += 4) Q.put(2, y, PAL.runa, 4.2);
  Q.outline(); return Q.canvas();
}
// a coluna de lava da bica: 16 de largura, emenda em cima e embaixo a cada 48
function paintStream() {
  const c = mk(16, 48), x = c.getContext('2d'), im = x.createImageData(16, 48), D = new Uint32Array(im.data.buffer), L = PAL.lava;
  for (let y = 0; y < 48; y++) for (let i = 0; i < 16; i++) {
    const e = Math.abs(i + 0.5 - 8) / 8; if (e > 0.98) continue;
    const s = Math.sin((y / 48) * Math.PI * 2 * 2 + i * 0.9) * 0.6 + Math.sin((y / 48) * Math.PI * 2 * 3 - i * 1.7) * 0.5;
    let v = 4.6 - e * 3.4 + s; if (e > 0.8) v = Math.min(v, 1.4);
    D[y * 16 + i] = L[clamp(v | 0, 0, 5)];
  }
  x.putImageData(im, 0, 0); return c;
}
const ANG = []; for (let a = -90; a <= 90; a += 6) ANG.push(a * Math.PI / 180);
const RED = '#ff3a1a';
AFA.get = () => AFA.ready || (AFA.ready = (() => {
  const body = [], rot = [];
  for (let open = 0; open < 2; open++) {
    const fr = [];
    for (let lf = 0; lf < 3; lf++) { const r = paintBody(lf, !!open), l = flip(r); fr.push({ r, l, wr: whiteOf(r), wl: whiteOf(l), hr: tint(r, RED), hl: tint(l, RED) }); }
    body.push(fr);
    rot.push(ANG.map(a => { const c = turn(fr[0].r, -a, 30, 25, 84); return { c, w: whiteOf(c), h: tint(c, RED) }; }));
  }
  const cru = paintCrucible(), cruT = [];
  for (let k = 0; k <= 7; k++) { const c = turn(cru, k * 10 * Math.PI / 180, 15, 3, 48); cruT.push({ r: c, l: flip(c) }); }
  const ham = paintHammer(), clawO = paintClaw(true), clawC = paintClaw(false), lk0 = paintLink(false), lk1 = paintLink(true);
  const lev = [paintLever(false, true), paintLever(false, false), paintLever(true, false), paintLever(true, true)];
  return {
    body, rot, cruT, rail: paintRail(), strut: paintStrut(), trolley: paintTrolley(), spout: paintSpout(), bar: paintBar(), stream: paintStream(),
    ham: { r: ham, l: flip(ham), w: whiteOf(ham) }, clawO: { r: clawO, l: flip(clawO), w: whiteOf(clawO) }, clawC: { r: clawC, l: flip(clawC), w: whiteOf(clawC) },
    link: [lk0, lk1], lev: lev.map(c => ({ r: c, l: flip(c) }))
  };
})());
AFA.angIx = a => clamp(Math.round(a * 180 / Math.PI / 6) + 15, 0, ANG.length - 1);
AFA.GL = { forno: glow(34, '#ff8a2a'), nucleo: glow(22, '#3aa8d8'), runa: glow(8, '#7ad0f0'), lava: glow(26, '#ffa62a'), brasa: glow(14, '#ff9a3a'), grade: glow(20, '#ff7a1a') };
AFA.LAVA = PAL.lava.map(v => { const r = v & 255, g = (v >> 8) & 255, b = (v >> 16) & 255; return `rgb(${r},${g},${b})`; });
}

/* ---------- onde ficam as peças ---------- */
// o centro do corpo (px do mundo)
function afBodyC(e) {
  if (e.pend) { const [px, py] = afTip(); return [px + Math.sin(e.th) * AF_RB, py + Math.cos(e.th) * AF_RB]; }
  const hy = afRailY() + 34 + (afHoistY() - afRailY() - 34) * (e.hoist == null ? 1 : e.hoist);
  if (e.state === 'fall') { const ry = afRampY(e.u); return [afUx(e.u), hy + ((ry == null ? afRailY() : ry) + AF_RB - hy) * afRail.k]; }
  return [afUx(e.u), hy];
}
// os ombros (u canônico) e onde as cabeças ficam paradas
const afShU = (e, claw) => e.u + (claw ? 1 : -1) * e.f * 25;
const afRestH = e => [afShU(e, false) - e.f * 3, afBodyC(e)[1] + 38];
const afRestC = e => [afShU(e, true) + e.f * 3, afBodyC(e)[1] + 36];
function afPlace(e) {
  const [bx, by] = afBodyC(e);
  if (e.pend) { e.x = bx - 24; e.y = by - 36; e.w = 48; e.h = 60; }
  else { e.x = bx - 27; e.y = by - 18; e.w = 54; e.h = 34; }
}
// as cabeças voltam devagar para o lugar
function afRest(e, dt, sp = 380) {
  const [hu, hy] = afRestH(e), [cu, cy] = afRestC(e);
  e.hu = approach(e.hu, hu, sp * dt); e.hy = approach(e.hy, hy, sp * dt);
  e.cu = approach(e.cu, cu, sp * dt); e.cy = approach(e.cy, cy, sp * dt);
  e.cruA = approach(e.cruA, 0, 2 * dt);
}
// um braço está embaixo (perto do chão) ou esticado até a alavanca: só então toma golpe
function afPartHot(m, B) {
  if (!B || B.pend || B.state === 'fall' || B.state === 'crack') return false;
  if (m.part === 'claw' && B.state === 'reach' && B.stateT0 > 0.4) return true;
  const y = m.part === 'ham' ? B.hy : B.cy;
  return y > afFloorY() - 4 * T;
}
AI.afparte = function (m) {
  const B = m.afBoss; m.vx = m.vy = 0; m.stun = 0;
  if (!B || B.dead) return;
  if (B.pend || B.state === 'fall') { m.x = B.x; m.y = 2 * T; return; }    // guardados: longe de tudo
  const x = afUx(m.part === 'ham' ? B.hu : B.cu), y = m.part === 'ham' ? B.hy : B.cy;
  m.x = x - m.w / 2; m.y = y - m.h / 2;
};
DRAW_E.afparte = () => { };
EYES_E.afparte = () => { };
WARN_E.afparte = () => false;
DRAW_E.autoforja = () => { };   // desenhada no HOOK.drawWorld, com o trilho
EYES_E.autoforja = () => { };
WARN_E.autoforja = e => !e.dead && (e.state === 'hamUp' || e.state === 'cruTilt' || e.state === 'clawSpin' || e.state === 'reach' || e.state === 'crack' || e.state === 'recoil');

/* ---------- desenho ---------- */
function afNear(cx) { const g = afGeo(); return !!g && !!pl && Math.abs(wdx(g.cx - Math.floor((cx + VW / 2) / T))) < 32 + Math.ceil(VW / T / 2) + 4; }
// uma corrente de elos entre dois pontos
function afChain(A, ax, ay, bx, by, cx, cy, step = 6) {
  const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / step));
  for (let i = 0; i <= n; i++) { const t = i / n; lc.drawImage(A.link[i % 4 === 2 ? 1 : 0], Math.round(ax + (bx - ax) * t) - 4 - cx, Math.round(ay + (by - ay) * t) - 4 - cy); }
}
// o cabo de aço do guincho: dois fios torcidos
function afCable(ax, ay, bx, by, cx, cy) {
  const n = Math.max(2, Math.ceil(Math.abs(by - ay)));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = Math.round(ax + (bx - ax) * t) - cx, y = Math.round(ay + (by - ay) * t) - cy;
    lc.fillStyle = (i % 3) === 0 ? '#7a848c' : '#424a54'; lc.fillRect(x, y, 1, 1); lc.fillStyle = '#121418'; lc.fillRect(x + 1, y, 1, 1);
  }
}
function afDrawRail(A, cx, cy) {
  const g = afGeo(), top = afRy(0), ry = afRailY();
  if (afRail.k <= 0) {
    for (const u of AF_STRUT_U) lc.drawImage(A.strut, afUx(u) - 4 - cx, top - 1 - cy);
    lc.drawImage(A.rail, afUx(0) - cx, ry - cy);
    return;
  }
  // caído: só a braçadeira da parede presa segura; os outros suportes ficam como tocos arrebentados
  const uA = afUA(), uT = afUT();
  for (const u of AF_STRUT_U) {
    const x = afUx(u) - 4 - cx, keep = Math.abs(u - uA) < 120;
    if (keep) lc.drawImage(A.strut, x, top - 1 - cy);
    else { lc.drawImage(A.strut, 0, 0, 8, 12, x, top - 1 - cy, 8, 12); lc.fillStyle = '#2a1a0c'; lc.fillRect(x + 2, top + 10 - cy, 4, 1); lc.fillRect(x + 3, top + 11 - cy, 1, 1); }
  }
  const [tx, ty] = afTip(), ax = afUx(uA), x0 = Math.min(ax, tx), y0 = ax < tx ? ry : ty, x1 = Math.max(ax, tx), y1 = ax < tx ? ty : ry;
  const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
  lc.save(); lc.translate(x0 - cx, y0 - cy); lc.rotate(a); lc.drawImage(A.rail, 0, 0, Math.round(L), 9, 0, 0, Math.round(L), 9); lc.restore();
  // o resto do trilho, pendurado da outra parede
  const sx = afUx(AF_U - uA), sd = uA === 0 ? -1 : 1;
  lc.save(); lc.translate(sx - cx, ry - cy); lc.rotate(sd < 0 ? Math.PI * 0.42 : Math.PI * 0.58); lc.drawImage(A.rail, 0, 0, 64, 9, 0, sd < 0 ? -9 : 0, 64, 9); lc.restore();
}
function afDrawLevers(A, cx, cy) {
  const g = afGeo();
  for (let k = 0; k < g.levers.length; k++) {
    const L = g.levers[k], S = afLev[k], dead = afState.dead;
    const down = !dead && (S.cd > 0.35 || S.pull > 0);
    const blink = S.cd > 0 && S.cd < 1 && (Math.floor(gameTime * 10) & 1);
    const lit = !dead && (S.cd <= 0 || blink);
    const ix = down ? (lit ? 3 : 2) : (lit ? 0 : 1), spr = A.lev[ix];
    lc.drawImage(L.c > 32 ? spr.l : spr.r, afUx(L.c * T) - cx, afRy(L.r) - cy);
  }
}
function afDrawBoss(e, A, cx, cy) {
  const fl = e.flash > 0, hot = e.heat > 0, [bx, by] = afBodyC(e), lf = Math.floor(gameTime * 5) % 3, open = e.hatch > 0.5 ? 1 : 0;
  if (e.pend) {
    const [px, py] = afTip(), ix = AFA.angIx(e.th), R = A.rot[open][ix], top = [bx - Math.sin(e.th) * 25, by - Math.cos(e.th) * 25];
    afChain(A, px, py + 4, top[0], top[1], cx, cy);
    // os braços recolhidos, as cabeças coladas aos ombros
    for (const s of [-1, 1]) {
      const hx = bx + Math.cos(e.th) * 27 * s + Math.sin(e.th) * 6, hy = by - Math.sin(e.th) * 27 * s + Math.cos(e.th) * 6;
      const H = s < 0 ? A.ham : A.clawC; lc.drawImage(H.r, Math.round(hx) - 13 - cx, Math.round(hy) - 11 - cy);
    }
    lc.drawImage(R.c, Math.round(bx) - 42 - cx, Math.round(by) - 42 - cy);
    if (fl) lc.drawImage(R.w, Math.round(bx) - 42 - cx, Math.round(by) - 42 - cy);
    else if (hot) { lc.globalAlpha = 0.35 + Math.sin(gameTime * 14) * 0.12; lc.drawImage(R.h, Math.round(bx) - 42 - cx, Math.round(by) - 42 - cy); lc.globalAlpha = 1; }
    if (e.lockT > 0) lc.drawImage(A.bar, Math.round(px) - 2 - cx, Math.round(py) - 8 - cy);
    return;
  }
  const B = A.body[open][lf], r = e.f > 0, X = Math.round(bx) - 30 - cx, Y = Math.round(by) - 25 - cy;
  const jit = e.state === 'clawSpin' || e.state === 'crack' || e.lockT > 3.7 ? Math.round(Math.sin(gameTime * 60)) : 0;
  for (const s of [-1, 1]) afCable(bx + s * 11 + jit, afRailY() + 10, bx + s * 13, by - 22, cx, cy);
  lc.drawImage(A.trolley, Math.round(bx) - 24 - cx + jit, afRailY() - 13 - cy);
  if (e.lockT > 0) lc.drawImage(A.bar, Math.round(bx) - 3 - cx, afRailY() - 16 - cy);
  // o cadinho, pendurado embaixo, inclinado para o lado da garra
  if (!e.noCru) {
    const ki = clamp(Math.round(e.cruA * 180 / Math.PI / 10), 0, 7), C = A.cruT[ki];
    lc.drawImage(r ? C.r : C.l, Math.round(bx) - 24 - cx, Math.round(by) + 24 - 24 - cy + 3);
  }
  lc.drawImage(fl ? (r ? B.wr : B.wl) : (r ? B.r : B.l), X + jit, Y);
  if (hot && !fl) { lc.globalAlpha = 0.35 + Math.sin(gameTime * 14) * 0.12; lc.drawImage(r ? B.hr : B.hl, X + jit, Y); lc.globalAlpha = 1; }
  // os braços: elos do ombro até a cabeça
  const sy = by + 2;
  const hx = afUx(e.hu), hy = e.hy, kx = afUx(e.cu), ky = e.cy;
  afChain(A, afUx(afShU(e, false)), sy, hx, hy - 10, cx, cy);
  afChain(A, afUx(afShU(e, true)), sy, kx, ky - 11, cx, cy);
  const pf = e.part && e.part.ham && e.part.ham.flash > 0, cf = e.part && e.part.claw && e.part.claw.flash > 0;
  lc.drawImage(pf ? A.ham.w : (r ? A.ham.l : A.ham.r), Math.round(hx) - 13 - cx, Math.round(hy) - 11 - cy);
  const spin = e.state === 'clawSpin' && (Math.floor(gameTime * 16) & 1);
  const openC = e.state === 'clawSpin' || e.state === 'clawDrop' || e.state === 'reach' || e.state === 'clawStuck';
  const CS = openC ? A.clawO : A.clawC;
  lc.drawImage(cf ? CS.w : ((r !== !!spin) ? CS.r : CS.l), Math.round(kx) - 13 - cx, Math.round(ky) - 13 - cy);
}
HOOK.drawWorld.push((cx, cy) => {
  if (typeof ANOES === 'undefined' || !ANOES || !anBoss || !afNear(cx)) return;
  const A = AFA.get(), g = afGeo(), e = afBoss;
  afDrawRail(A, cx, cy);
  afDrawLevers(A, cx, cy);
  // as grades em brasa: a cor sobe por cima do bronze
  for (const G of afFx.grates) {
    if (G.t < 0 || G.t > 3) continue;
    const [a, b] = AF_GRATES[G.k], warm = G.t < 1, k = warm ? G.t : 1;
    lc.globalAlpha = warm ? 0.18 + k * 0.25 : 0.5 + Math.sin(gameTime * 18 + G.k) * 0.1;
    lc.fillStyle = warm ? '#e8700e' : '#ffa62a';
    lc.fillRect(afUx(a * T) - cx, g.fy * T - cy, (b - a + 1) * T, T);
    lc.globalAlpha = 1;
  }
  // as faixas de metal derramado
  for (const Bd of afFx.bands) {
    const x0 = Math.round(afUx(Bd.u0)) - cx, y = afFloorY() - cy, n = Math.round(Bd.u1 - Bd.u0), fade = Math.min(1, Bd.t / 1.2), q = Math.floor(gameTime * 6);
    for (let i = 0; i < n; i++) {
      const edge = Math.min(i, n - 1 - i), hgt = edge < 2 ? 1 : edge < 6 ? 2 : 3, v = clamp(Math.round(2 + fade * 3 - (edge < 2 ? 1.5 : 0) + (hash2(i, q, 8991) - 0.5) * 1.6), 0, 5);
      lc.fillStyle = AFA.LAVA[v]; lc.fillRect(x0 + i, y - hgt, 1, hgt);
    }
  }
  if (e && !e.dead) afDrawBoss(e, A, cx, cy);
  else if (afState.dead && afRail.k >= 1) { const [px, py] = afTip(); afChain(A, px, py + 4, px + 2, py + 40, cx, cy); }
  // o cadinho caindo quando o trilho cede
  if (afFx.fallCru) { const C = afFx.fallCru, K = A.cruT[Math.min(7, Math.floor(C.t * 8))]; lc.drawImage(K.r, Math.round(C.x) - 24 - cx, Math.round(C.y) - 24 - cy); }
  // as bicas e a lava que cai delas
  for (let s = 0; s < 2; s++) lc.drawImage(A.spout, afUx(AF_SPOUT_U[s]) - 15 - cx, afRy(0) - cy);
  for (const P of afFx.pours) {
    if (P.t < 0) continue;
    const x = Math.round(afUx(AF_SPOUT_U[P.s])) - 8 - cx, y0 = afRy(0) + 20, y1 = afFloorY(), off = Math.floor(gameTime * 140) % 48;
    const w = P.t < 0.15 ? Math.round(16 * P.t / 0.15) : P.t > AF.pourT - 0.3 ? Math.max(2, Math.round(16 * (AF.pourT - P.t) / 0.3)) : 16, sx = (16 - w) >> 1;
    for (let y = y0 - off; y < y1; y += 48) {
      const a = Math.max(y, y0), b = Math.min(y + 48, y1); if (b <= a) continue;
      lc.drawImage(A.stream, sx, a - y, w, b - a, x + sx, a - cy, w, b - a);
    }
  }
});
HOOK.drawGlow.push((cx, cy) => {
  if (typeof ANOES === 'undefined' || !ANOES || !anBoss || !afNear(cx)) return;
  const e = afBoss, GL = AFA.GL, g = afGeo();
  if (e && !e.dead) {
    const [bx, by] = afBodyC(e), k = e.glowK == null ? 1 : e.glowK;
    lc.globalAlpha = (0.3 + Math.sin(gameTime * 3) * 0.04) * k * (e.heat > 0 ? 1.5 : 1); lc.drawImage(GL.forno, Math.round(bx) - 34 - cx, Math.round(by) - 46 - cy);
    if (e.hatch > 0.05) { const hy = e.pend ? by + Math.cos(e.th) * 10 : by + 10, hx = e.pend ? bx - Math.sin(e.th) * 10 : bx; lc.globalAlpha = e.hatch * (0.55 + Math.sin(gameTime * 9) * 0.1); lc.drawImage(GL.nucleo, Math.round(hx) - 22 - cx, Math.round(hy) - 22 - cy); }
  }
  for (let k = 0; k < g.levers.length; k++) if (!afState.dead && afLev[k].cd <= 0) { const [x, y] = afLeverXY(k); lc.globalAlpha = 0.45; lc.drawImage(GL.runa, Math.round(x) - 8 - cx, Math.round(y) - 5 - cy); }
  for (const P of afFx.pours) {
    const x = afUx(AF_SPOUT_U[P.s]);
    if (P.t < 0) { lc.globalAlpha = 0.25 + (1 + P.t) * 0.3; lc.drawImage(GL.brasa, Math.round(x) - 14 - cx, afRy(0) + 18 - cy); lc.drawImage(GL.brasa, Math.round(x) - 14 - cx, afFloorY() - 12 - cy); continue; }
    lc.globalAlpha = 0.45; for (let y = afRy(0) + 30; y < afFloorY(); y += 40) lc.drawImage(GL.lava, Math.round(x) - 26 - cx, y - 26 - cy);
  }
  for (const Bd of afFx.bands) { lc.globalAlpha = 0.4 * Math.min(1, Bd.t / 1.2); const mx = afUx((Bd.u0 + Bd.u1) / 2); lc.drawImage(GL.lava, Math.round(mx) - 26 - cx, afFloorY() - 22 - cy); }
  for (const G of afFx.grates) {
    if (G.t < 0 || G.t > 3) continue;
    const [a, b] = AF_GRATES[G.k]; lc.globalAlpha = G.t < 1 ? 0.15 + G.t * 0.2 : 0.5;
    for (let c = a; c <= b; c += 3) lc.drawImage(GL.grade, afUx(c * T + 6) - 20 - cx, afFloorY() - 14 - cy);
  }
  lc.globalAlpha = 1;
});
// os avisos por cima do escuro: a sombra do malho, os pingos do cadinho, as grades que vão acender, a bica pingando
HOOK.drawTop.push((cx, cy) => {
  if (typeof ANOES === 'undefined' || !ANOES || !anBoss || !pl) return;
  const e = afBoss, fy = afGeo() ? afFloorY() : 0;
  lc.lineWidth = 1;
  if (e && !e.dead && e.state === 'hamUp') {
    const x = Math.round(afUx(e.shadowU)) - cx, k = Math.min(1, e.stateT0 / 0.8), r = 6 + k * 8;
    lc.globalAlpha = 0.45 + k * 0.3; lc.fillStyle = '#0a0604'; lc.beginPath(); lc.ellipse(x + 0.5, fy - cy - 1, r, 2.5, 0, 0, Math.PI * 2); lc.fill();
    lc.strokeStyle = (Math.floor(gameTime * 12) & 1) ? '#ffa62a' : '#b8400a'; lc.globalAlpha = 0.55 + k * 0.35; lc.beginPath(); lc.ellipse(x + 0.5, fy - cy - 1.5, r + 1, 3, 0, 0, Math.PI * 2); lc.stroke();
  }
  for (const D of afFx.drops) { const x = Math.round(D.x) - cx, y = Math.round(D.y) - cy; lc.globalAlpha = 1; lc.fillStyle = '#ffe08a'; lc.fillRect(x, y - 2, 1, 3); lc.fillStyle = '#ffa62a'; lc.fillRect(x, y + 1, 1, 1); }
  if (e && !e.dead && e.state === 'cruTilt') { const x0 = Math.round(afUx(e.bandU - 18)) - cx; lc.globalAlpha = 0.35 + Math.sin(gameTime * 16) * 0.2; lc.fillStyle = '#ffa62a'; for (let i = 0; i < 36; i += 3) lc.fillRect(x0 + i, fy - cy - 1, 2, 1); }
  for (const G of afFx.grates) {
    if (G.t >= 0 && G.t < 1) { const [a, b] = AF_GRATES[G.k]; lc.globalAlpha = 0.5 + Math.sin(gameTime * 20) * 0.3; lc.fillStyle = '#ffa62a'; lc.fillRect(afUx(a * T) - cx, fy - cy, (b - a + 1) * T, 1); }
  }
  for (const P of afFx.pours) if (P.t < 0) { const x = Math.round(afUx(AF_SPOUT_U[P.s])) - cx; lc.globalAlpha = 0.5 + Math.sin(gameTime * 18) * 0.3; lc.fillStyle = '#ffa62a'; lc.fillRect(x - 8, fy - cy - 1, 16, 1); }
  for (const R of afFx.rings) {
    const k = R.t / 0.35, r = 4 + k * 2 * T;
    lc.globalAlpha = Math.max(0, 0.9 * (1 - k)); lc.strokeStyle = '#ffa62a'; lc.beginPath(); lc.arc(Math.round(R.x) - cx + 0.5, Math.round(R.y) - cy + 0.5, r, 0, Math.PI * 2); lc.stroke();
    lc.strokeStyle = '#ffe08a'; lc.beginPath(); lc.arc(Math.round(R.x) - cx + 0.5, Math.round(R.y) - cy + 0.5, Math.max(1, r - 2), 0, Math.PI * 2); lc.stroke();
  }
  lc.globalAlpha = 1;
});
// luz: a fornalha, a lava das bicas, o metal no chão, as grades em brasa, o núcleo, as runas, o malho
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  if (pl && pl.lg && pl.lg.malho && !pl.dead) addL(pl.x + pl.w / 2 + pl.facing * 6, pl.y + 8, 0.42 + afMal.n * 0.05);
  if (typeof ANOES === 'undefined' || !ANOES || !anBoss || !afGeo()) return;
  const e = afBoss, fy = afFloorY();
  if (e && !e.dead) { const [bx, by] = afBodyC(e); addL(bx, by, 0.8); addL(bx, by + 30, 0.6); if (e.hatch > 0.3) addL(bx, by + 12, 0.75); }
  for (const P of afFx.pours) { const x = afUx(AF_SPOUT_U[P.s]); if (P.t >= 0) for (let y = afRy(1); y < fy; y += 24) addL(x, y, 0.85); else addL(x, afRy(1), 0.5); }
  for (const Bd of afFx.bands) for (let u = Bd.u0; u <= Bd.u1; u += 12) addL(afUx(u), fy - 4, 0.7);
  for (const G of afFx.grates) if (G.t >= 0 && G.t <= 3) for (let c = AF_GRATES[G.k][0]; c <= AF_GRATES[G.k][1]; c += 2) addL(afUx(c * T + 6), fy - 4, G.t < 1 ? 0.5 : 0.7);
}; }

/* ---------- as alavancas ---------- */
// puxar: a de lava abre a bica (pinga 1 s, despeja 3 s); a de trava prende o trilho 4 s
function afPull(k, who) {
  const g = afGeo(), L = afLev[k], d = g.levers[k];
  if (!afBoss || afBoss.dead || afState.dead || L.cd > 0) return false;
  L.cd = AF.leverCD; L.pull = 0.3;
  const [x, y] = afLeverXY(k);
  sfx.afAlavanca(); burst(x, y - 2, 6, '#7ad0f0', 40, 60, 0.4, 1, true);
  if (d.kind === 'lava') { afFx.pours.push({ s: d.s, t: -AF.dripT, hitB: false, hitP: 0, mine: who === 'garra' }); sfx.afBica(0.5); }
  else afLock(who);
  return true;
}
function afLock() {
  const e = afBoss; if (!e || e.dead) return;
  if (e.state === 'intro' || e.state === 'wake' || e.state === 'crack' || e.state === 'fall') { sfx.afTrava(0.5); return; }
  e.lockT = AF.lockT; sfx.afTrava(1); shake(3);
  if (!e.pend) afCancel(e);
  const [bx] = afBodyC(e), [px, py] = e.pend ? afTip() : [bx, afRailY()];
  burst(px, py, 16, '#ffd27a', 120, 300, 0.5, 1, true); burst(px, py, 8, '#c49448', 60, 300, 0.6);
}
// o que ela fazia para: os braços voltam, o cadinho endireita, solta o herói
function afCancel(e) {
  if (pl.afGrab) { pl.afGrab = null; pl.vy = 40; }
  afSet(e, 'idle', 0); e.cd = Math.max(e.cd, 0.8);
}
function afLeverTick(dt) {
  for (const L of afLev) { if (L.cd > 0) { L.cd -= dt; if (L.cd <= 0) { L.cd = 0; sfx.afRuna(); } } if (L.pull > 0) L.pull -= dt; }
}
// a tecla de usar perto de uma alavanca
function afUse() {
  if (!pressed.KeyE || pl.dead) return;
  const g = afGeo(), pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2; let best = -1, bd = 26;
  for (let k = 0; k < g.levers.length; k++) { const [x, y] = afLeverXY(k), d = Math.hypot(x - pcx, y - pcy); if (d < bd) { bd = d; best = k; } }
  if (best < 0) return;
  pressed.KeyE = false;
  afPull(best, 'heroi');
}

/* ---------- a luta ---------- */
function afSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; e.stateT0 = 0; }
function afStart() {
  afSnapTake(); afGates(true);
  DROPS.autoforja = AF_DROPS.filter(([id]) => ITEMS[id]);
  const D = ET.autoforja, e = spawnEnemy('autoforja', 0, 0, AN_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: AF_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, w: D.w, h: D.h, stun: 0,
    u: AF_U / 2, f: 1, ph: 0, hoist: 0, cd: 1, heat: 0, lockT: 0, hatch: 0, cruA: 0, glowK: 0, pend: false, th: 0, wob: 0, wobT: 0,
    gearT: 2, grateT: 5, reachCD: 6, reachHits: 0, noCru: false, lastPh: 0 });
  e.f = Math.sign(afXu(pl.x + pl.w / 2) - e.u) || 1;
  [e.hu, e.hy] = afRestH(e); [e.cu, e.cy] = afRestC(e);
  afSet(e, 'intro', 2.4);
  afBoss = e; bossFight = { e, af: true };
  // os dois braços: pedaços que repassam o golpe
  e.part = {};
  for (const p of ['ham', 'claw']) {
    const m = spawnEnemy('afparte', 0, 2 * T, AN_ZONE0 + 3);
    Object.assign(m, { boss: true, lvl: AF_L, hp: ET.afparte.hp, maxHp: ET.afparte.hp, dmg: 0, xp: 0, gold: 0, part: p, afBoss: e, w: 22, h: p === 'ham' ? 20 : 22, stun: 0 });
    m.state = 'walk'; e.part[p] = m;
  }
  afPlace(e); afClear();
  for (const L of afLev) { L.cd = 0; L.pull = 0; }
  afRail.k = 0;
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O Autômato-Forja'; bn.lastChild.textContent = 'ainda segura a porta'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O Autômato-Forja', 'ainda segura a porta');
  sfx.afAcorda(); shake(3);
}
function afClear() { afFx.pours.length = 0; afFx.bands.length = 0; afFx.drops.length = 0; afFx.grates.length = 0; afFx.fallCru = null; pl.afGrab = null; }
function afEnd(won) {
  const e = afBoss; afBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies.slice()) {
    if (m.type === 'afparte') afDrop(m);
    else if (m.afMinion && !m.dead) { burst(m.x + m.w / 2, m.y + m.h / 2, 8, '#c49448', 60, 300, 0.4, 1, true); afDrop(m); }
  }
  afClear();
  if (!won) {
    // a sala de volta como era: trilho reto, alavancas carregadas, grades frias, portões abertos
    if (e) afDrop(e);
    afSnapPut(); afFx.gates.length = 0; afRail.k = 0;
    for (const L of afLev) { L.cd = 0; L.pull = 0; }
    return;
  }
  // ela para de vez: o trilho fica caído, as alavancas viram decoração
  afState.dead = true;
  afGates(false); afRail.k = 1;
  for (const L of afLev) { L.cd = 0; L.pull = 0; }
  const x = e ? e.x + e.w / 2 : afUx(AF_U / 2), y = e ? e.y + e.h / 2 : afRy(14);
  burst(x, y, 34, '#2a1a0c', 140, 300, 1.2, 2); burst(x, y, 24, '#ffa62a', 120, 200, 0.9, 1, true); burst(x, y, 12, '#7ad0f0', 80, 0, 0.9, 1, true);
  for (let k = 0; k < 6; k++) parts.push({ x: x + rnd(-20, 20), y: y + rnd(-10, 10), vx: rnd(-20, 20), vy: rnd(-40, -10), g: -20, life: 2.2, max: 2.2, col: '#4a4038', size: 2, smoke: true });
  // e, com 50%, uma das três bases da camada
  const bases = ['machado_cla', 'elmo_cla', 'escudo_runico'].filter(id => ITEMS[id]);
  if (bases.length && Math.random() < 0.5) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.afMorte();
  showBanner('Vitória', 'a forja apagou');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.af) return afEnd(won); return _eb(won); }; }
// cada fase é vivida: um golpe só leva até o próximo limiar
const afFloorHp = e => e.ph === 0 ? Math.floor(e.maxHp * AF.p2) : e.ph === 1 ? Math.floor(e.maxHp * AF.p3) : (e.pend ? 0 : 1);
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'afparte') { if (!e.afBoss || e.afBoss.dead) afDrop(e); else { e.afKill = e.hp; e.hp = e.maxHp; } return; }
  if (e && e.type === 'autoforja' && !e.dead) { const f = afFloorHp(e); if (f > 0) { e.hp = f; return; } }
  return _k(e);
}; }
// o golpe na máquina: os braços só embaixo, o núcleo só com a escotilha aberta (+100%); o resto é bronze e faísca
function afClank(x, y) {
  burst(x, y, 6, '#ffd27a', 90, 300, 0.25, 1, true); burst(x, y, 3, '#c49448', 50, 300, 0.3);
  if (gameTime - afFx.clankT > 0.08) { afFx.clankT = gameTime; sfx.afClank(); }
}
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'afparte') {
    const B = e.afBoss;
    if (!B || B.dead || B.state === 'intro') return;
    if (!afPartHot(e, B)) { afClank(e.x + e.w / 2, e.y + e.h / 2); return; }
    e.afKill = null;
    const hp0 = e.hp, r = _hit(e, dir, mult, melee), d = hp0 <= 1 ? B.maxHp : Math.max(0, hp0 - (e.afKill != null ? e.afKill : e.hp));   // hp 1 antes do golpe: o modo deus (60)
    e.hp = e.maxHp; e.afKill = null; e.stun = 0; e.vx = e.vy = 0;
    if (d > 0) {
      B.hp = Math.max(afFloorHp(B) > 0 ? afFloorHp(B) : -1, B.hp - d); B.showHp = 3;
      if (e.part === 'claw' && B.state === 'reach') B.reachHits++;
      if (B.hp <= 0) killEnemy(B);
      if (melee && !afMal.busy && pl.lg && pl.lg.malho) afMalhoHit(e);
    }
    return r;
  }
  if (e && e.type === 'autoforja') {
    if (e.dead || e.state === 'intro') return;
    if (!(e.hatch > 0.6)) { afClank(e.x + e.w / 2, e.y + e.h / 2); return; }
    const hp0 = e.hp, r = _hit(e, dir, mult * 2, melee); e.stun = 0; e.vx = e.vy = 0;
    if (!e.dead && afFloorHp(e) > 0) e.hp = Math.max(e.hp, afFloorHp(e));
    if (e.hp < hp0) { burst(e.x + e.w / 2, e.y + e.h / 2, 8, '#7ad0f0', 80, 100, 0.4, 1, true); if (melee && !afMal.busy && pl.lg && pl.lg.malho) afMalhoHit(e); }
    return r;
  }
  const hp0 = e ? e.hp : 0, r = _hit(e, dir, mult, melee);
  if (melee && e && !afMal.busy && pl.lg && pl.lg.malho && e.hp < hp0) afMalhoHit(e);
  return r;
}; }

AI.autoforja = function (e, dt) {
  e.vx = e.vy = 0; e.stun = 0;
  afBrain(e, dt);
  afPlace(e);
};
const afPcx = () => pl.x + pl.w / 2;
const afSpeed = e => (e.ph === 0 ? 62 : 100) * (e.heat > 0 ? 0.4 : 1);
// fogo no herói: marca o tipo de dano (101) enquanto bate
function afHurt(dmg, x, fire) {
  const has = typeof dmgCtx !== 'undefined', o = has ? dmgCtx : null;
  if (fire && has) dmgCtx = 'fogo';
  try { return hurtPlayer(Math.max(1, Math.round(dmg)), x, null, true); } finally { if (fire && has) dmgCtx = o; }
}
// o dano já escalado (o 49 corta os números do ET na carga)
const afDmg = () => afBoss ? afBoss.dmg : ET.autoforja.dmg;
const afBurn = (sec, f) => { if (typeof anQueimar === 'function') anQueimar(sec, Math.max(1, Math.round(afDmg() * f))); };
const afPlRect = (x, y, w, h) => pl.x < x + w && pl.x + pl.w > x && pl.y < y + h && pl.y + pl.h > y;
const afOnFloor = () => pl.y + pl.h >= afFloorY() - 2 && pl.y + pl.h <= afFloorY() + 1;
function afBrain(e, dt) {
  const pcx = afPcx(), hu = afXu(pcx);
  if (e.heat > 0) e.heat -= dt;
  const ds = dt * (e.heat > 0 ? 0.45 : 1);
  if (e.lockT > 0) { e.lockT -= dt; if (e.lockT <= 0) { e.lockT = 0; sfx.afDestrava(); } }
  e.hatch = approach(e.hatch, e.lockT > 0 || (e.pend && e.state === 'recoil') ? 1 : 0, dt * (e.hatch < 0.5 ? 5 : 3));
  if (e.lastHatch !== (e.hatch > 0.5)) { e.lastHatch = e.hatch > 0.5; if (e.lastHatch) sfx.afEscotilha(); }
  e.glowK = approach(e.glowK, 1, dt * 0.6);
  // fumaça das chaminés
  if (!e.pend && Math.random() < dt * 3) { const [bx, by] = afBodyC(e); parts.push({ x: bx + (Math.random() < 0.5 ? -18 : 18), y: by - 26, vx: rnd(-6, 6), vy: rnd(-26, -12), g: -10, life: 1.4, max: 1.4, col: '#3a332c', size: 2, smoke: true }); }
  // os limiares
  if (e.ph === 0 && e.hp <= e.maxHp * AF.p2 && e.state !== 'intro') { e.ph = 1; afCancel(e); e.lockT = 0; afSet(e, 'wake', 1.6); sfx.afDesperta(); return; }
  if (e.ph === 1 && e.hp <= e.maxHp * AF.p3 && e.state !== 'wake') { e.ph = 2; afCancel(e); e.lockT = 0; afFx.grates.length = 0; afSet(e, 'crack', 1.4); sfx.afRange(); return; }
  if (e.lockT > 0) { if (!e.pend) afRest(e, dt); return; }   // presa: nada anda
  e.stateT -= ds; e.stateT0 += ds; e.cd -= ds;
  const sp = afSpeed(e);
  if (e.ph === 1 && !e.pend) {
    // a forja acordada: engrenagens pela escotilha (2 no máximo) e as grades em sequência
    if ((e.gearT -= dt) <= 0) { e.gearT = 7; afGears(e); }
    if ((e.grateT -= dt) <= 0 && e.state !== 'wake') { e.grateT = 11 + Math.random() * 3; afGratesGo(); }
    e.reachCD -= dt;
  }
  switch (e.state) {
    case 'intro':
      e.hoist = approach(e.hoist, 1, dt * 0.6); afRest(e, dt, 600); e.u = approach(e.u, clamp(hu, AF_UMIN, AF_UMAX), 30 * dt);
      if (e.stateT <= 0) { afSet(e, 'idle', 0); e.cd = 0.8; }
      return;
    case 'idle': {
      afRest(e, dt);
      if ((e.wobT -= dt) <= 0) { e.wobT = 1.5 + Math.random() * 2; e.wob = rnd(-36, 36); }
      e.u = approach(e.u, afAvoid(clamp(hu + e.wob, AF_UMIN, AF_UMAX)), sp * dt);
      if (Math.abs(hu - e.u) > 30) e.f = Math.sign(hu - e.u);
      if (e.cd > 0 || pl.dead) return;
      const r = Math.random();
      if (e.ph === 1 && e.reachCD <= 0 && r < 0.3) { const k = afReachLever(hu); if (k >= 0) { e.reachK = k; e.reachHits = 0; afSet(e, 'reachGo', 2.2); return; } }
      if (r < 0.4) { afSet(e, 'hamGo', 1.4); return; }
      if (r < 0.7) { afSet(e, 'cruGo', 1.2); return; }
      afSet(e, 'clawSpin', 0.7); e.f = Math.sign(hu - e.u) || e.f; sfx.afGira();
      return;
    }
    /* ----- o malho ----- */
    case 'hamGo': {
      afRest(e, dt);
      e.f = -(Math.sign(hu - e.u) || -e.f);
      const tu = clamp(hu + e.f * 25, AF_UMIN, AF_UMAX); e.u = approach(e.u, tu, sp * 1.5 * dt);
      if (Math.abs(afShU(e, false) - hu) < 8 || Math.abs(e.u - tu) < 2 || e.stateT <= 0) { afSet(e, 'hamUp', 0.8); e.shadowU = afShU(e, false) - e.f * 3; sfx.afMalhoSobe(); }
      return;
    }
    case 'hamUp':
      e.hu = approach(e.hu, e.shadowU, 200 * dt); e.hy = approach(e.hy, afBodyC(e)[1] - 6, 260 * dt);
      e.cu = approach(e.cu, afRestC(e)[0], 300 * dt); e.cy = approach(e.cy, afRestC(e)[1], 300 * dt);
      if (e.stateT <= 0) { afSet(e, 'hamDown', 1); e.hamHit = false; }
      return;
    case 'hamDown': {
      e.hu = e.shadowU; e.hy = Math.min(afFloorY() - 9, e.hy + 900 * dt);
      const hx = afUx(e.hu);
      if (!e.hamHit && !pl.dead && afPlRect(hx - 11, e.hy - 9, 22, 18)) { e.hamHit = true; const r = afHurt(e.dmg, hx, false); if (r === 'hit') { pl.vy = 60; } }
      if (e.hy >= afFloorY() - 9) {
        // o malho bate: faíscas 2 blocos para cada lado
        sfx.afMalhoBate(); shake(6);
        burst(hx, afFloorY() - 2, 22, '#ffd27a', 160, 500, 0.5, 1, true); burst(hx, afFloorY() - 2, 10, '#5a646e', 80, 400, 0.6);
        for (const d of [-1, 1]) for (let k = 0; k < 8; k++) parts.push({ x: hx + d * rnd(6, 30), y: afFloorY() - 1, vx: d * rnd(40, 140), vy: rnd(-140, -40), g: 500, life: 0.5, max: 0.5, col: Math.random() < 0.5 ? '#ffe08a' : '#ffa62a', size: 1, glow: true });
        if (!e.hamHit && !pl.dead && Math.abs(pcx - hx) < 11 + 24 + pl.w / 2 && pl.y + pl.h >= afFloorY() - 16 && pl.y + pl.h <= afFloorY() + 2) afHurt(e.dmg * 0.6, hx, true);
        afSet(e, 'hamStuck', 1.3);
      }
      return;
    }
    case 'hamStuck':
      e.cu = approach(e.cu, afRestC(e)[0], 300 * dt); e.cy = approach(e.cy, afRestC(e)[1], 300 * dt);
      if (Math.random() < dt * 6) parts.push({ x: afUx(e.hu) + rnd(-10, 10), y: afFloorY() - 2, vx: rnd(-10, 10), vy: rnd(-30, -10), g: 0, life: 0.6, max: 0.6, col: '#5a646e', size: 1 });
      if (e.stateT <= 0) afSet(e, 'hamBack', 0.6);
      return;
    case 'hamBack':
      afRest(e, dt, 420);
      if (e.stateT <= 0) { afSet(e, 'idle', 0); e.cd = e.ph === 0 ? 1.1 + Math.random() * 0.6 : 0.7 + Math.random() * 0.5; }
      return;
    /* ----- o cadinho ----- */
    case 'cruGo': {
      afRest(e, dt);
      const lip = e.u + e.f * 14, tu = clamp(e.u + (hu - lip), AF_UMIN, AF_UMAX); e.u = approach(e.u, tu, sp * 1.4 * dt);
      if (Math.abs(lip - hu) < 8 || e.stateT <= 0) { afSet(e, 'cruTilt', 1); e.bandU = clamp(e.u + e.f * 14, 30, AF_U - 30); e.dripT = 0; sfx.afCadinho(); }
      return;
    }
    case 'cruTilt': {
      afRest(e, dt); e.cruA = approach(e.cruA, 35 * Math.PI / 180, dt * 1.2);
      if ((e.dripT -= dt) <= 0) { e.dripT = 0.11; const [lx, ly] = afLip(e); afFx.drops.push({ x: lx + rnd(-1, 1), y: ly, vy: 0 }); }
      if (e.stateT <= 0) { afSet(e, 'cruPour', 0.45); sfx.afDerrama(); }
      return;
    }
    case 'cruPour': {
      e.cruA = approach(e.cruA, 70 * Math.PI / 180, dt * 4);
      const [lx, ly] = afLip(e);
      for (let k = 0; k < 4; k++) afFx.drops.push({ x: lx + rnd(-2, 2), y: ly + rnd(0, 6), vy: 120, big: true });
      if (!e.pourHit && !pl.dead && Math.abs(pcx - lx) < pl.w / 2 + 4 && pl.y + pl.h > ly) { e.pourHit = true; afHurt(e.dmg * 0.6, lx, true); afBurn(1.5, 0.1); }
      if (e.stateT <= 0) { e.pourHit = false; afFx.bands.push({ u0: e.bandU - 18, u1: e.bandU + 18, t: 4, tick: 0 }); afSet(e, 'cruBack', 0.6); }
      return;
    }
    case 'cruBack':
      afRest(e, dt); e.cruA = approach(e.cruA, 0, dt * 2.5);
      if (e.stateT <= 0) { afSet(e, 'idle', 0); e.cd = e.ph === 0 ? 1.0 + Math.random() * 0.6 : 0.6 + Math.random() * 0.5; }
      return;
    /* ----- a garra ----- */
    case 'clawSpin': {
      e.hu = approach(e.hu, afRestH(e)[0], 300 * dt); e.hy = approach(e.hy, afRestH(e)[1], 300 * dt);
      const tu = clamp(hu - e.f * 25, AF_UMIN, AF_UMAX); e.u = approach(e.u, tu, sp * 0.9 * dt);
      e.cu = afShU(e, true) + e.f * 3; e.cy = approach(e.cy, afRestC(e)[1] - 6, 200 * dt);
      if (Math.random() < dt * 12) parts.push({ x: afUx(e.cu) + rnd(-12, 12), y: e.cy + rnd(-4, 10), vx: rnd(-30, 30), vy: rnd(-20, 20), g: 0, life: 0.25, max: 0.25, col: '#c49448', size: 1 });
      if (e.stateT <= 0) { afSet(e, 'clawDrop', 2); e.grabbed = false; sfx.afGarraDesce(); }
      return;
    }
    case 'clawDrop': {
      e.cy = Math.min(afFloorY() - 11, e.cy + 560 * dt);
      const kx = afUx(e.cu);
      if (!e.grabbed && !pl.dead && afPlRect(kx - 10, e.cy - 11, 20, 22)) {
        const r = afHurt(e.dmg * 0.8, kx, false);
        e.grabbed = true;
        if (r === 'hit') { pl.afGrab = { e }; sfx.afGarra(); afSet(e, 'clawLift', 1.1); return; }
        afSet(e, 'clawBack', 0.6); return;
      }
      if (e.cy >= afFloorY() - 11) { sfx.afGarraChao(); shake(3); burst(kx, afFloorY() - 2, 12, '#5a646e', 70, 400, 0.5); afSet(e, 'clawStuck', 1.0); }
      return;
    }
    case 'clawLift':
      e.cy = approach(e.cy, afRestC(e)[1] - 10, 230 * dt);
      if (!pl.afGrab) { afSet(e, 'clawBack', 0.5); return; }
      if (e.stateT <= 0 || e.cy <= afRestC(e)[1] - 9) { pl.afGrab = null; pl.vy = 30; pl.vx = e.f * 40; sfx.afSolta(); afSet(e, 'clawBack', 0.5); }
      return;
    case 'clawStuck':
      if (e.stateT <= 0) afSet(e, 'clawBack', 0.6);
      return;
    case 'clawBack':
      afRest(e, dt, 420); e.u = approach(e.u, afAvoid(e.u), sp * 1.6 * dt);
      if (e.stateT <= 0) { afSet(e, 'idle', 0); e.cd = e.ph === 0 ? 1.0 + Math.random() * 0.6 : 0.6 + Math.random() * 0.5; }
      return;
    /* ----- fase 2: a mão na alavanca ----- */
    case 'reachGo': {
      afRest(e, dt);
      const L = afGeo().levers[e.reachK], sd = L.c < 32 ? -1 : 1, tu = sd < 0 ? AF_UMIN : AF_UMAX;
      e.f = sd; e.u = approach(e.u, tu, sp * 1.6 * dt);
      if (afLev[e.reachK].cd > 0) { afSet(e, 'idle', 0); e.cd = 0.5; return; }
      if (Math.abs(e.u - tu) < 3 || e.stateT <= 0) { afSet(e, 'reach', 1.8); e.reachU0 = e.cu; e.reachY0 = e.cy; sfx.afEstica(); }
      return;
    }
    case 'reach': {
      const L = afGeo().levers[e.reachK], k = Math.min(1, e.stateT0 / 1.8), tu = L.c * T + 6, ty = afRy(L.r) + 2;
      e.cu = e.reachU0 + (tu - e.reachU0) * k; e.cy = e.reachY0 + (ty - e.reachY0) * k;
      e.hu = approach(e.hu, afRestH(e)[0], 300 * dt); e.hy = approach(e.hy, afRestH(e)[1], 300 * dt);
      if (Math.random() < dt * 4) sfx.afRangeLeve();
      if (afLev[e.reachK].cd > 0) { afSet(e, 'clawBack', 0.7); return; }
      if (e.reachHits >= 3) { sfx.afSolta(); burst(afUx(e.cu), e.cy, 14, '#ffd27a', 100, 300, 0.4, 1, true); shake(2); e.reachCD = 9; afSet(e, 'clawBack', 0.7); return; }
      if (k >= 1) { afPull(e.reachK, 'garra'); e.reachCD = 9; afSet(e, 'clawBack', 0.8); }
      return;
    }
    /* ----- a fase 2 começa ----- */
    case 'wake':
      afRest(e, dt);
      if (Math.random() < dt * 30) { const [bx, by] = afBodyC(e); parts.push({ x: bx + rnd(-26, 26), y: by + rnd(-20, 10), vx: rnd(-30, 30), vy: rnd(-60, -20), g: -20, life: 1, max: 1, col: Math.random() < 0.6 ? '#9ea6ac' : '#ffa62a', size: Math.random() < 0.3 ? 2 : 1, smoke: true }); }
      if (e.stateT <= 0) { afSet(e, 'idle', 0); e.cd = 0.6; e.gearT = 0.8; e.grateT = 3.5; e.reachCD = 6; }
      return;
    /* ----- a fase 3 começa: o suporte arrebenta ----- */
    case 'crack': {
      afRest(e, dt);
      const g = afGeo(), su = AF_STRUT_U[g.A < 0 ? 3 : 0];
      if (Math.random() < dt * 50) parts.push({ x: afUx(su) + rnd(-10, 10), y: afRy(0) + rnd(0, 4), vx: rnd(-8, 8), vy: rnd(10, 40), g: 160, life: 1.4, max: 1.4, col: Math.random() < 0.5 ? '#8a8478' : '#4a2e14', size: 1 });
      if (Math.random() < dt * 30) parts.push({ x: afUx(su), y: afRailY() + rnd(0, 6), vx: rnd(-80, 80), vy: rnd(-80, 20), g: 400, life: 0.3, max: 0.3, col: '#ffd27a', size: 1, glow: true });
      if (Math.random() < dt * 5) sfx.afRangeLeve();
      if (e.stateT <= 0) {
        sfx.afEstalo(); shake(9);
        for (const u of AF_STRUT_U) burst(afUx(u), afRy(1), 10, '#8a8478', 80, 300, 0.8);
        // o cadinho se solta e cai
        if (!e.noCru) { const [bx, by] = afBodyC(e); afFx.fallCru = { x: bx, y: by + 30, vy: 0, t: 0 }; e.noCru = true; }
        e.fallU0 = e.u; afSet(e, 'fall', 1.1);
      }
      return;
    }
    case 'fall': {
      const k = Math.min(1, e.stateT0 / 1.1), q = k * k * (3 - 2 * k);
      afRail.k = q; e.u = e.fallU0 + (afUT() - e.fallU0) * q;
      if (Math.random() < dt * 40) parts.push({ x: afUx(rnd(0, AF_U)), y: afRy(0) + 2, vx: rnd(-6, 6), vy: rnd(10, 40), g: 160, life: 1.2, max: 1.2, col: '#8a8478', size: 1 });
      if (k >= 1) {
        afRail.k = 1; e.pend = true; e.th = 0; mapVer++;
        const g = afGeo(); e.thX = g.A * AF_TH_A; e.th0 = 0; afSet(e, 'swing', 1.3); e.swHit = false; sfx.afBalanco();
      }
      return;
    }
    /* ----- fase 3: o pêndulo ----- */
    case 'recoil': {
      const k = Math.min(1, e.stateT0 / 1.0), s = Math.sign(e.thX);
      e.th = e.thX + s * 6 * Math.PI / 180 * Math.sin(k * Math.PI * 0.5);
      if (Math.random() < dt * 6) sfx.afCorrente();
      if (e.stateT <= 0) { e.th0 = e.th; e.thX = -s * (s === afGeo().A ? AF_TH_F : AF_TH_A); afSet(e, 'swing', 1.5); e.swHit = false; sfx.afBalanco(); }
      return;
    }
    case 'swing': {
      const k = Math.min(1, e.stateT0 / e.stateMax), q = k * k * (3 - 2 * k);
      e.th = e.th0 + (e.thX - e.th0) * q;
      const [bx, by] = afBodyC(e);
      if (!e.swHit && k > 0.1 && k < 0.9 && !pl.dead) {
        const nx = clamp(bx, pl.x, pl.x + pl.w), ny = clamp(by, pl.y, pl.y + pl.h);
        if (Math.hypot(nx - bx, ny - by) < 25) { e.swHit = true; const dir = Math.sign(e.thX - e.th0) || 1, r = afHurt(e.dmg * 1.1, bx - dir * 10, false); if (r === 'hit') { pl.vx = dir * 320; pl.vy = -200; } shake(4); }
      }
      // a bica despeja sozinha quando ele passa embaixo dela com a alavanca carregada
      for (let s = 0; s < 2; s++) {
        const x = afUx(AF_SPOUT_U[s]); if (Math.abs(bx - x) > 20) continue;
        const kL = afGeo().levers.findIndex(L => L.kind === 'lava' && L.s === s);
        if (kL >= 0 && afLev[kL].cd <= 0 && !afFx.pours.some(P => P.s === s)) { afPull(kL, 'pendulo'); sfx.afClank(); }
      }
      if (k >= 1) { afSet(e, 'recoil', 1.0); sfx.afCorrente(); }
      return;
    }
  }
}
// o bico do cadinho (px do mundo)
function afLip(e) {
  const [bx, by] = afBodyC(e), a = e.cruA, px = bx, py = by + 24 + 3, c = Math.cos(a), s = Math.sin(a);
  return [px + e.f * (14 * c + s), py + 14 * s - c];
}
// a lava que a própria garra soltou: ela sai de baixo da bica (a que o herói solta, ela não vê)
function afAvoid(u) {
  for (const P of afFx.pours) if (P.mine) { const su = AF_SPOUT_U[P.s]; if (Math.abs(u - su) < 64) u = su < AF_U / 2 ? su + 64 : su - 64; }
  return clamp(u, AF_UMIN, AF_UMAX);
}
function afReachLever(hu) {
  const g = afGeo(); let best = -1, bd = 1e9;
  for (let k = 0; k < g.levers.length; k++) { const L = g.levers[k]; if (L.kind !== 'lava' || afLev[k].cd > 0) continue; const d = Math.abs(AF_SPOUT_U[L.s] - hu); if (d < 120 && d < bd) { bd = d; best = k; } }
  return best;
}
function afGears(e) {
  if (!ET.engrenagens || !AI.engrenagens) return;
  let n = 0; for (const m of enemies) if (m.afMinion && !m.dead) n++;
  if (n >= 2) return;
  const [bx, by] = afBodyC(e), D = ET.engrenagens, m = spawnEnemy('engrenagens', bx - D.w / 2, by + 22, AN_ZONE0 + 3);
  if (!m || m.dead) return;
  if (enemies.indexOf(m) < 0) enemies.push(m);
  Object.assign(m, { afMinion: true, memT: 8, aggro: true, xp: 1, gold: 0 });
  burst(bx, by + 20, 14, '#9ea6ac', 70, 200, 0.6); burst(bx, by + 20, 6, '#ffd27a', 60, 300, 0.3, 1, true); sfx.afEscotilha();
}
function afGratesGo() {
  // de um lado para o outro, começando longe do herói
  const hu = afXu(afPcx()), lr = hu > AF_U / 2;
  afFx.grates.length = 0;
  for (let i = 0; i < 3; i++) afFx.grates.push({ k: lr ? i : 2 - i, t: -i * 1.0, tick: 0 });
  sfx.afGrade();
}

/* as coisas que correm sozinhas: bicas, metal, pingos, grades, o cadinho caindo, o anel do malho */
function afFxTick(dt) {
  const e = afBoss, pcx = afPcx(), fy = afFloorY();
  for (let i = afFx.pours.length - 1; i >= 0; i--) {
    const P = afFx.pours[i], x = afUx(AF_SPOUT_U[P.s]); P.t += dt;
    if (P.t < 0) { if (Math.random() < dt * 14) parts.push({ x: x + rnd(-3, 3), y: afRy(0) + 21, vx: 0, vy: 40, g: 700, life: 1, max: 1, col: '#ffa62a', size: 1, glow: true }); continue; }
    if (P.t < dt * 1.5) sfx.afBica(1);
    if (P.t > AF.pourT) { afFx.pours.splice(i, 1); continue; }
    // escorre pela grade para o canal
    if (Math.random() < dt * 30) parts.push({ x: x + rnd(-8, 8), y: fy - 1, vx: rnd(-40, 40), vy: rnd(-80, -20), g: 600, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ffe08a' : '#e8700e', size: 1, glow: true });
    if (P.hitP > 0) P.hitP -= dt;
    if (!pl.dead && P.hitP <= 0 && Math.abs(pcx - x) < 8 + pl.w / 2 && pl.y + pl.h > afRy(0) + 20) { P.hitP = 1; const r = afHurt(afDmg(), x, true); afBurn(2, 0.12); if (r === 'hit') pl.vx = (Math.sign(pcx - x) || 1) * 160; }
    if (e && !e.dead && !P.hitB && e.x < x + 8 && e.x + e.w > x - 8 && e.y + e.h > afRy(0) + 20) {
      P.hitB = true;
      const cut = Math.ceil(e.maxHp * AF.lava), f = afFloorHp(e);
      e.hp = Math.max(f, e.hp - cut); e.heat = AF.heat; e.flash = 0.15; e.showHp = 3;
      floatText(e.x + e.w / 2, e.y - 6, String(cut), '#ffa040', 1.2);
      burst(x, e.y + 6, 24, '#ffa62a', 140, 300, 0.6, 1, true); sfx.afQueima(); shake(3);
      if (e.hp <= 0) killEnemy(e);
    }
  }
  for (let i = afFx.bands.length - 1; i >= 0; i--) {
    const Bd = afFx.bands[i]; Bd.t -= dt; if (Bd.t <= 0) { afFx.bands.splice(i, 1); continue; }
    if (Bd.tick > 0) Bd.tick -= dt;
    const u = afXu(pcx);
    if (!pl.dead && Bd.tick <= 0 && afOnFloor() && u > Bd.u0 - pl.w / 2 && u < Bd.u1 + pl.w / 2) { Bd.tick = 0.6; afHurt(afDmg() * 0.3, pcx, true); afBurn(1.5, 0.08); }
    if (Math.random() < dt * 4) parts.push({ x: afUx(rnd(Bd.u0, Bd.u1)), y: fy - 2, vx: 0, vy: rnd(-20, -8), g: -10, life: 0.8, max: 0.8, col: '#4a4038', size: 1, smoke: true });
  }
  for (let i = afFx.drops.length - 1; i >= 0; i--) {
    const D = afFx.drops[i]; D.vy = Math.min(D.vy + 900 * dt, 480); D.y += D.vy * dt;
    if (D.y >= fy - 1) { afFx.drops.splice(i, 1); if (Math.random() < 0.5) burst(D.x, fy - 1, 2, '#ffa62a', 30, 300, 0.25, 1, true); }
  }
  for (let i = afFx.grates.length - 1; i >= 0; i--) {
    const G = afFx.grates[i]; G.t += dt; if (G.t > 3) { afFx.grates.splice(i, 1); continue; }
    if (G.t < 1 || pl.dead) continue;
    if (G.t - dt < 1) sfx.afGrade(0.6);
    const [a, b] = AF_GRATES[G.k], u = afXu(pcx);
    if (G.tick > 0) G.tick -= dt;
    if (G.tick <= 0 && afOnFloor() && u > a * T - 3 && u < (b + 1) * T + 3) { G.tick = 0.5; afHurt(afDmg() * 0.3, pcx, true); afBurn(1, 0.08); }
    if (Math.random() < dt * 14) parts.push({ x: afUx(rnd(a * T, (b + 1) * T)), y: fy - 1, vx: rnd(-6, 6), vy: rnd(-40, -10), g: -20, life: 0.6, max: 0.6, col: '#ffa62a', size: 1, glow: true });
  }
  const C = afFx.fallCru;
  if (C) {
    C.t += dt; C.vy = Math.min(C.vy + 900 * dt, 520); C.y += C.vy * dt;
    if (C.y >= fy - 8) {
      afFx.fallCru = null; sfx.afDerrama(); sfx.afMalhoBate(); shake(5);
      burst(C.x, fy - 4, 30, '#ffa62a', 160, 400, 0.7, 1, true); burst(C.x, fy - 4, 14, '#7a5832', 100, 400, 0.8, 2);
      const u = clamp(afXu(C.x), 30, AF_U - 30); afFx.bands.push({ u0: u - 24, u1: u + 24, t: 6, tick: 0 });
      if (!pl.dead && Math.abs(pcx - C.x) < 20 && afOnFloor()) afHurt(afDmg() * 0.6, C.x, true);
    }
  }
}

/* o herói: preso na garra, a rampa do trilho caído, o golpe nas alavancas */
{ const _up = updatePlayer; updatePlayer = function (dt) {
  const r = _up(dt);
  if (typeof ANOES === 'undefined' || !ANOES || !anBoss || pl.dead) { pl.afGrab = null; return r; }
  const G = pl.afGrab;
  if (G) {
    const e = G.e;
    if (!afBoss || e !== afBoss || e.dead || e.state !== 'clawLift') pl.afGrab = null;
    else { pl.x = afUx(e.cu) - pl.w / 2; pl.y = e.cy + 4; pl.vx = 0; pl.vy = 0; }
  }
  // a rampa: plataforma de mão única, por cima (S desce)
  if (afRail.k >= 1 && !pl.afGrab && afGeo()) {
    const ry = afRampY(afXu(pl.x + pl.w / 2)), feet = pl.y + pl.h, prev = pl.afFeet == null ? feet : pl.afFeet;
    if (ry != null && pl.vy >= 0 && !(keys.KeyS || keys.ArrowDown) && prev <= ry + 4 && feet >= ry - 1 && feet <= ry + 12 && !rectSolid(pl.x, ry - pl.h, pl.w, pl.h)) {
      pl.y = ry - pl.h; pl.vy = 0; pl.onGround = true;
    }
  }
  pl.afFeet = pl.y + pl.h;
  // a arma bate numa alavanca da Grande Forja
  if (afBoss && bossFight && bossFight.af && pl.atkT >= 0 && afLevSwing !== pl.atkAt) {
    const tm = pl.twoHand ? GS_TM : ATK_TM;
    if (pl.atkT >= tm.wind && pl.atkT <= tm.wind + tm.swing + 0.02) {
      const [hx, hy, tx, ty] = bladeSeg(pl.fArm, pl.sAng, bladeLen()), g = afGeo();
      for (let k = 0; k < g.levers.length && afLevSwing !== pl.atkAt; k++) {
        const [lx, ly] = afLeverXY(k);
        for (const j of [0.4, 0.7, 1]) { const px = hx + (tx - hx) * j, py = hy + (ty - hy) * j; if (Math.abs(px - lx) < 8 && Math.abs(py - ly) < 8) { afLevSwing = pl.atkAt; if (afLev[k].cd <= 0) afPull(k, 'golpe'); else afClank(lx, ly); break; } }
      }
    }
  }
  return r;
}; }
HOOK.update.push(dt => {
  if (typeof ANOES === 'undefined' || !ANOES || !pl) return;
  afFx.frame++;
  for (let i = afFx.rings.length - 1; i >= 0; i--) { const R = afFx.rings[i]; R.t += dt; if (R.t > 0.35) afFx.rings.splice(i, 1); }
  // o malho quente: brasinhas na cabeça conforme a sequência sobe
  if (pl.lg && pl.lg.malho && !pl.dead && afMal.n > 0 && gameTime - afMal.last < 1.5 && Math.random() < dt * 4 * afMal.n) parts.push({ x: pl.x + pl.w / 2 + pl.facing * rnd(6, 12), y: pl.y + rnd(4, 10), vx: rnd(-8, 8), vy: rnd(-30, -10), g: -20, life: 0.5, max: 0.5, col: '#ffa62a', size: 1, glow: true });
  if (!anBoss || state !== 'play' || !afGeo()) return;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T);
  if (!afState.dead && !bossFight && !pl.dead && afInside(ptx, pty)) afStart();
  const e = afBoss;
  if (e && bossFight && bossFight.af && !pl.dead && !inAnHall(ptx, pty, 1)) { endBossFight(false); return; }
  if (e && bossFight && bossFight.af) {
    afFxTick(dt); afLeverTick(dt); afUse();
    // a fumaça e a poeira do trilho enquanto o carro corre
    if (!e.pend && Math.abs(e.u - (e.lastU == null ? e.u : e.lastU)) > 0.5 && Math.random() < dt * 8) parts.push({ x: afUx(e.u) + rnd(-20, 20), y: afRailY() + 9, vx: rnd(-6, 6), vy: rnd(10, 30), g: 100, life: 0.8, max: 0.8, col: '#6a5c4c', size: 1 });
    if (!e.pend && Math.abs(e.u - (e.lastU == null ? e.u : e.lastU)) > 0.5 && (e.rollT = (e.rollT || 0) - dt) <= 0) { e.rollT = 0.45; sfx.afRoda(); }
    e.lastU = e.u;
  }
});

/* ---------- sons: o carro no trilho, a fornalha, o malho, o cadinho, a garra, as alavancas, a lava, o trilho cedendo ---------- */
Object.assign(sfx, {
  afAcorda() { noise(1.6, 0.09, 260, 'lowpass'); tone(48, 1.8, 'sawtooth', 0.04, 12); for (let k = 0; k < 5; k++) tone(300 + k * 90, 0.12, 'triangle', 0.015, 0, 0.6 + k * 0.12); noise(0.8, 0.05, 1600, 'bandpass', 0.9, 2); },
  afPortao() { tone(70, 0.5, 'square', 0.04, -20); noise(0.4, 0.07, 900, 'bandpass'); tone(660, 0.8, 'sine', 0.02, 0, 0.05); tone(990, 0.6, 'sine', 0.012, 0, 0.1); },
  afRoda() { noise(0.18, 0.025, 700, 'bandpass', 0, 3); tone(90 + Math.random() * 20, 0.12, 'square', 0.008, -10); },
  afMalhoSobe() { tone(120, 0.7, 'sawtooth', 0.02, 60); noise(0.6, 0.03, 1200, 'bandpass', 0, 4); },
  afMalhoBate() { tone(58, 0.5, 'square', 0.07, -24); noise(0.35, 0.14, 500, 'lowpass'); noise(0.2, 0.07, 3200, 'bandpass', 0.02, 2); tone(880, 0.6, 'triangle', 0.02, -30, 0.02); },
  afCadinho() { noise(1, 0.04, 2400, 'bandpass', 0, 1.5); for (let k = 0; k < 6; k++) tone(500 + Math.random() * 300, 0.05, 'sine', 0.012, -200, k * 0.15); },
  afDerrama() { noise(0.6, 0.09, 1200, 'bandpass', 0, 1); noise(0.8, 0.06, 300, 'lowpass', 0.1); },
  afGira() { tone(900, 0.7, 'sine', 0.02, 700); tone(1300, 0.7, 'sine', 0.01, 900); noise(0.7, 0.025, 2600, 'bandpass', 0, 6); },
  afGarraDesce() { noise(0.25, 0.06, 1800, 'bandpass', 0, 1.2); tone(300, 0.2, 'sawtooth', 0.02, -200); },
  afGarra() { tone(140, 0.2, 'square', 0.05, -40); noise(0.15, 0.08, 2600, 'bandpass'); },
  afGarraChao() { tone(80, 0.25, 'square', 0.05, -30); noise(0.25, 0.09, 700, 'lowpass'); },
  afSolta() { tone(220, 0.15, 'square', 0.03, 120); noise(0.12, 0.05, 3000, 'highpass'); },
  afEstica() { for (let k = 0; k < 8; k++) tone(160 + k * 14, 0.09, 'sawtooth', 0.012, 10, k * 0.2); },
  afRangeLeve() { tone(90 + Math.random() * 60, 0.25, 'sawtooth', 0.012, -20); },
  afAlavanca() { tone(180, 0.08, 'square', 0.05, -60); noise(0.08, 0.08, 2400, 'bandpass'); tone(520, 0.3, 'triangle', 0.015, 0, 0.06); },
  afTrava(v = 1) { tone(64, 0.4, 'square', 0.07 * v, -20); noise(0.3, 0.12 * v, 900, 'bandpass'); tone(1200, 0.9, 'sine', 0.02 * v, -40, 0.03); tone(1500, 0.7, 'sine', 0.012 * v, -50, 0.05); },
  afDestrava() { tone(300, 0.15, 'square', 0.03, 200); noise(0.15, 0.05, 2000, 'bandpass'); },
  afRuna() { tone(1046, 0.4, 'sine', 0.014); tone(1568, 0.5, 'sine', 0.008, 0, 0.05); },
  afEscotilha() { tone(200, 0.3, 'sawtooth', 0.02, 120); noise(0.3, 0.04, 1500, 'bandpass', 0, 2); },
  afBica(v = 1) { noise(0.9 * v + 0.1, 0.07 * v, 600, 'lowpass'); noise(0.6 * v, 0.04 * v, 2400, 'bandpass', 0.05, 1.5); for (let k = 0; k < 4 * v; k++) tone(70 + Math.random() * 40, 0.15, 'sine', 0.02, -20, k * 0.18); },
  afQueima() { noise(0.7, 0.1, 3000, 'highpass'); noise(0.5, 0.06, 500, 'lowpass', 0.05); tone(90, 0.6, 'sawtooth', 0.03, -30); },
  afGrade(v = 1) { noise(0.9, 0.05 * v, 3200, 'highpass'); noise(0.6, 0.03 * v, 700, 'bandpass', 0.1, 3); },
  afDesperta() { noise(1.4, 0.1, 220, 'lowpass'); tone(44, 1.6, 'sawtooth', 0.05, 20); noise(1, 0.06, 3000, 'highpass', 0.3); for (let k = 0; k < 4; k++) tone(80 + k * 40, 0.3, 'square', 0.02, 30, 0.2 + k * 0.2); },
  afRange() { for (let k = 0; k < 10; k++) tone(70 + Math.random() * 60, 0.09, 'sawtooth', 0.025, -25, k * 0.13 + Math.random() * 0.05); noise(1.4, 0.04, 500, 'bandpass', 0, 5); },
  afEstalo() { noise(0.6, 0.16, 600, 'lowpass'); noise(0.2, 0.1, 3600, 'bandpass'); tone(52, 1, 'square', 0.05, -15); tone(700, 1.2, 'triangle', 0.02, -300, 0.05); },
  afBalanco() { noise(0.7, 0.07, 450, 'bandpass', 0, 1.4); tone(60, 0.6, 'sine', 0.04, 30); },
  afCorrente() { for (let k = 0; k < 5; k++) { noise(0.05, 0.03, 2600 + Math.random() * 1000, 'bandpass', k * 0.07, 3); tone(140 + Math.random() * 50, 0.12, 'sawtooth', 0.01, -20, k * 0.07); } },
  afClank() { tone(760 + Math.random() * 200, 0.18, 'triangle', 0.025, -60); noise(0.06, 0.06, 3400, 'bandpass'); },
  afMorte() { noise(2.4, 0.1, 240, 'lowpass'); tone(40, 2.5, 'sawtooth', 0.05, -12); noise(1.6, 0.05, 2800, 'highpass', 0.3); for (let k = 0; k < 6; k++) tone(420 - k * 50, 0.4, 'triangle', 0.015, -40, 0.4 + k * 0.25); },
  afAnel() { noise(0.35, 0.09, 900, 'bandpass', 0, 1); tone(150, 0.3, 'sawtooth', 0.03, -60); noise(0.25, 0.05, 3200, 'highpass', 0.04); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.autoforja = { dead: afState.dead }; return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  afBoss = null; afSnap = null; afFx.gates.length = 0; afFx.rings.length = 0; afMal.n = 0; afMal.tgt = null;
  if (typeof pl !== 'undefined' && pl) afClear();
  for (const L of afLev) { L.cd = 0; L.pull = 0; }
  afState.dead = !!(sv && sv.autoforja && sv.autoforja.dead);   // antes da geração: o anDress lê
  afRail.k = afState.dead ? 1 : 0; afG = null;
  return _nw(sd, sv);
}; }
