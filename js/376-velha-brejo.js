'use strict';

/* ================= o Brejo das Bruxas: o Caldeirão e a Velha do Brejo (docs/camadas/06-brejo-bruxas.md, seção 7) =================
   No fundo do Círculo, do lado do mundo oposto às descidas, a gruta do Caldeirão: 110 x 44, sem trono. Duas margens
   secas de turfa nas pontas (as portas dão nelas), entre elas a água preta funda (5 linhas), e no meio uma ilhota baixa
   de turfa com o caldeirão de ferro em cima de um fogo de turfa. Duas plataformas de tábua sobre estacas cruzam a água
   da ilhota às margens, um pouco mais altas, com escada de corda nas pontas. A luz é do fogo, das velas pretas nas
   margens e dos fogos-fátuos em cima da água.
   A Velha do Brejo: a bruxa mais velha, corcunda, de lenço na cabeça, com a concha comprida de mexer o caldeirão.
   - fase 1 (vida > 60%): na ilhota. Mexe o caldeirão e o vapor muda de cor (1,2 s de aviso, a cor diz o que vem):
     verde, a água da gruta fica venenosa (6 s; quem está nela perde vida); preto, a água sobe 2 linhas e cobre a
     ilhota (5 s; nas plataformas e nas margens fica-se seco); branco, a névoa e dois corvos saindo do vapor. Joga
     conchadas de caldo fervendo (0,7 s, a concha erguida pingando) e, de perto, a unhada (0,55 s, a mão erguida).
   - fase 2 (vida < 60%): pula no pilão e voa. O pilão: para em cima do herói, a sombra cresce no chão (1 s) e ela cai
     com a mão de pilão; a onda de lama corre para os lados (pula-se por cima). A vassoura: desce à altura do herói,
     a palha faísca (0,7 s) e varre a gruta de lado. Ainda joga a concha e ferve as cores.
   - fase 3 (vida < 30%): o caldeirão transborda (1,2 s, a tampa batendo e a espuma): o caldo fervendo corre pelo chão
     da ilhota às margens (nas plataformas ou num pulo alto passa-se); as mãos dos afogados (0,8 s, o círculo de
     bolhas onde o herói está) saem da água e do chão e prendem um instante.
   Vencida: o Pilão da Velha (lendário) e, na primeira vez, uma das três bases do Brejo; o caminho para a Cidade abre
   (353). O save guarda só { dead }. */

const BJVL_L = layerBossLvl('brejo');
const BJVL = { hp: Math.round(330 * (1 + 0.3 * (BJVL_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (BJVL_L - 1))), xp: 520 };
const bjVlState = { dead: false };
Object.assign(ET, {
  bjvelha: { name: 'A Velha do Brejo', w: 16, h: 28, hp: BJVL.hp, dmg: BJVL.dmg, xp: BJVL.xp, kb: 0, fly: true, boss: true, blood: '#2a3a1a' }
});
const BJVL_DROPS = [['pilao_velha', 1], ['min_ferrobrejo', 1, 6, 10], ['pele_sapo', 1, 2, 4], ['vela_preta', 1, 2, 4], ['erva_brejo', 1, 2, 4], ['pocao', 1, 2, 4]];
const BJVL_BASES = ['fisga_turfeiro', 'chapeu_cacador', 'botas_atoleiro'];
const bjVlDrops = () => { DROPS.bjvelha = BJVL_DROPS.filter(([id]) => ITEMS[id]); };
// os tempos de aviso (segundos)
const BJVL_CONCHA = 0.7, BJVL_UNHA = 0.55, BJVL_FERVE = 1.2, BJVL_PILAO = 1, BJVL_VASSOURA = 0.7, BJVL_TRANSBORDA = 1.2, BJVL_MAOS = 0.8;
let bjVelha = null;
const bjVlFx = { conchas: [], ondas: [], maos: [], verde: 0, nevoa: 0, sobe: null, extra: [], sombra: null, cor: null };

/* ================= arte ================= */
const BJVL_ART = {};
{
const { BR, setO, ell, tubo, poly, braco, saia, cp, cg } = BJB;
const BX = 20, FY = 39;
// a cabeça grande da Velha: o lenço amarrado, o nariz de gancho com a verruga, o queixo pontudo, a boca murcha
function cabeca(P, hx, hy, s) {
  for (let i = 0; i < 9; i++) tubo(P, hx - 2 + i * 0.4, hy - 2, hx - 4.6 - i * 0.3, hy + 5 + i * 0.7, 0.6, 0.4, BR.cinzaV, 3 + (i % 2) * 0.8, s + i);   // os cabelos brancos escapando
  ell(P, hx, hy, 3.2, 3.6, 0.1, BR.bruxa, s + 9, 2.8);
  P.put(hx + 3.2, hy + 0.2, BR.bruxa, 3.4); P.put(hx + 4.1, hy + 0.8, BR.bruxa, 3.1); P.put(hx + 4.6, hy + 1.6, BR.bruxa, 2.6); P.put(hx + 4.4, hy + 2.4, BR.bruxa, 2);
  P.put(hx + 3.4, hy - 0.4, BR.verruga, 4.2);                                                                            // a verruga
  P.put(hx + 2, hy + 3.4, BR.bruxa, 3); P.put(hx + 2.8, hy + 3.8, BR.bruxa, 2.4); P.put(hx + 1.6, hy + 2.4, BR.bruxa, 0.6);   // queixo e boca
  P.put(hx + 1.6, hy - 0.8, BR.bruxa, 0.2);                                                                              // o olho fundo
  // o lenço preto com bolinhas desbotadas, o nó atrás
  poly(P, [[hx - 3.6, hy - 1], [hx - 2.6, hy - 4], [hx + 0.6, hy - 4.8], [hx + 3, hy - 3], [hx + 3.4, hy - 1.6], [hx - 0.4, hy - 1.8]], BR.chapeu, (x, y) => 2.6 - (x - hx) * 0.15 + (hash2(x, y, s) < 0.12 ? 1.8 : 0) + cg(x, y, s) * 0.3);
  tubo(P, hx - 3.6, hy - 1.6, hx - 6.4, hy + 0.6, 0.8, 0.5, BR.chapeu, 2.4, s + 20); tubo(P, hx - 3.6, hy - 1.2, hx - 5.8, hy + 2.4, 0.7, 0.4, BR.chapeu, 2.2, s + 21);
}
// o corpo corcunda: o xale roxo nas costas, a saia preta remendada, o avental sujo
function corpo(P, s, sit) {
  if (!sit) saia(P, BX - 4.4, BX + 3.6, 21, FY, BR.chapeu, s, 2.4, 0.4);
  else saia(P, BX - 4, BX + 3.4, 21, 28, BR.chapeu, s, 1.4, 0);
  if (!sit) poly(P, [[BX - 1, 24], [BX + 3.6, 24], [BX + 5, FY - 1], [BX + 0.6, FY - 1]], BR.pano, (x, y) => 3.2 + (hash2(x, y, s + 1) < 0.2 ? -1.2 : 0) + cg(x, y, s) * 0.5);   // o avental
  // a corcunda: o xale em cima das costas, franjas
  ell(P, BX - 2, 17, 6, 5.4, -0.3, BR.roxo, s + 2, 2.6);
  for (let i = 0; i < 6; i++) tubo(P, BX - 7 + i * 1.6, 20.6, BX - 7.4 + i * 1.6, 23.4, 0.4, 0.3, BR.roxo, 2.2, s + 30 + i);
  for (let x = BX - 6; x <= BX + 1; x += 1) P.put(x, 21.4 + Math.abs(x - BX + 2.4) * 0.12, BR.osso, 4.4 - (x & 1) * 0.8);   // o colar de dentinhos
}
// k: 0-1 mexendo, 2 a concha erguida (aviso), 3 a conchada/unhada, 4 no pilão voando, 5 o pilão batendo, 6 a vassoura
function velha(k) {
  const P = cp(44, 40), s = 37601 + k * 7;
  if (k >= 4) {
    // o pilão de pedra: a tigela funda, as cintas de ferro, a borda gasta
    ell(P, BX, FY - 7, 9, 7, 0, BR.cinzaV, s, 1.8, (u, v) => v > -0.35 ? [BR.cinzaV, (Math.abs(v - 0.1) < 0.1 ? -0.9 : 0)] : null);
    for (let x = BX - 8.4; x <= BX + 8.4; x += 0.5) P.put(x, FY - 9.4, BR.cinzaV, 4.2 - (x - BX) * 0.08);
    for (let x = BX - 7.6; x <= BX + 7.6; x += 0.5) P.put(x, FY - 5, BR.ferro, 3.6 - (x - BX) * 0.1);
    corpo(P, s, true);
    cabeca(P, BX + 4, 11, s + 3);
    if (k === 4) {   // a mão de pilão erguida
      braco(P, BX + 1, 18, BX + 6, 9, BR.bruxa, 3, s + 4, 0.8, 0.9);
      tubo(P, BX + 6, 12, BX + 8, 1, 1.3, 1.6, BR.pau, 3.2, s + 5);
    } else if (k === 5) {   // batendo para baixo
      braco(P, BX + 1, 18, BX + 8, 22, BR.bruxa, 3, s + 4, 0.8, 0.9);
      tubo(P, BX + 8, 19, BX + 11, 33, 1.3, 1.7, BR.pau, 3.2, s + 5);
    } else {   // a vassoura para a frente, rente
      braco(P, BX + 1, 18, BX + 7, 22, BR.bruxa, 3, s + 4, 0.8, 0.9);
      tubo(P, BX - 14, 26, BX + 12, 23, 0.7, 0.6, BR.pau, 3, s + 6);
      for (let i = 0; i < 9; i++) tubo(P, BX + 11, 23, BX + 19 - (i % 3) * 0.4, 20 + i * 0.9, 0.6, 0.5, BR.palha, 3 + (i % 2) * 0.8, s + 40 + i);
      for (let y = 21.6; y < 25; y += 0.5) P.put(BX + 11.4, y, BR.corda, 4);
    }
    braco(P, BX - 3, 18, BX - 6, 30, BR.bruxa, 2.2, s + 7, 0.7, 0.8);   // a mão de trás na borda do pilão
    return setO(P.done());
  }
  corpo(P, s, false);
  cabeca(P, BX + 4, 11, s + 3);
  // a concha de pau: o cabo comprido e a cuia
  const sw = k === 1 ? 1.4 : 0;
  let hx, hy, lx, ly;
  if (k <= 1) { hx = BX + 7 + sw; hy = 24; lx = BX + 13 + sw * 1.4; ly = 33; }
  else if (k === 2) { hx = BX - 2; hy = 6; lx = BX - 8; ly = 0.5; }
  else { hx = BX + 11; hy = 15; lx = BX + 18; ly = 12; }
  braco(P, BX - 1, 18, hx, hy, BR.bruxa, 2.8, s + 4, 0.8, 0.9);
  tubo(P, hx - (lx - hx) * 0.3, hy - (ly - hy) * 0.3, lx, ly, 0.6, 0.6, BR.pau, 3.2, s + 5);
  ell(P, lx, ly + 0.8, 2, 1.4, 0, BR.pau, s + 6, 2.6);
  if (k === 3) { for (let j = 0; j < 4; j++) P.put(BX + 9 + j * 1.1, 19 - j * 0.6, BR.bruxa, 4 - j * 0.3); }   // a outra mão, as unhas
  braco(P, BX + 1, 18.6, k === 3 ? BX + 9 : BX + 5, k === 3 ? 19 : 26, BR.bruxa, 3.2, s + 7, 0.8, 0.8);
  return setO(P.done());
}
// o caldeirão de ferro em três pés, o fogo de turfa embaixo: 40 x 26, a boca na linha 6
function caldeirao() {
  const P = cp(40, 26), s = 37661;
  for (const [x0, x1] of [[9, 7], [31, 33], [20, 20]]) tubo(P, x0, 18, x1, 25, 0.9, 0.7, BR.ferro, 2.4, s + x0);
  ell(P, 20, 12, 15, 9, 0, BR.ferro, s + 1, 1.8, (u, v) => v > -0.62 ? [BR.ferro, 0] : null);
  for (let x = 5; x <= 35; x += 0.5) P.put(x, 6.4, BR.ferro, 4.4 - (x - 20) * 0.05);
  for (let x = 6; x <= 34; x += 0.5) P.put(x, 7.4, BR.ferro, 1.2);
  for (const x of [4, 36]) ell(P, x, 8, 1.4, 1.4, 0, BR.ferro, s + 3 + x, 3);   // as argolas
  // a lenha e os torrões de turfa embaixo
  for (let i = 0; i < 5; i++) tubo(P, 9 + i * 5, 25.4, 13 + i * 4, 22.6 + (i % 2), 1, 0.9, i % 2 ? BR.lodo : BR.pau, 2.6, s + 50 + i);
  return setO(P.done());
}
BJVL_ART.get = () => BJVL_ART.ready || (BJVL_ART.ready = { v: [0, 1, 2, 3, 4, 5, 6].map(velha), cal: caldeirao() });
Object.assign(BJVL_ART, { BX, FY });
}
const BJVL_COR = { verde: ['#3a6a2a', '#6aa84a', '#a8e07a'], preto: ['#0e0c10', '#24202a', '#3a3440'], branco: ['#a8a8a4', '#d0d0cc', '#f0f0ec'] };

/* ================= a gruta ================= */
const bjVlXi = x => wdx(x - bjBoss.cx);
// o chão de cada coluna da gruta (a linha do bloco de cima): margens, água, ilhota
const bjVlChao = xi => { const B = bjBoss, a = Math.abs(xi); return a >= 40 ? B.fy - 7 : a <= 8 ? B.fy - 5 : B.fy; };
const BJVL_TETO = (xi, B) => B.top + Math.round(12 * (xi / 55) * (xi / 55) + (hash2(xi + 99, 3, seed ^ 0x3f71) - 0.5) * 2);
function bjDress() {
  const B = bjBoss; if (!B) return;
  const I = (x, y) => y * WW + wrapX(x);
  for (let xi = -58; xi <= 57; xi++) for (let y = B.top - 3; y <= B.fy + 3; y++) {
    const i = I(B.cx + xi, y);
    bjKeep.add(i); if (agua.length) agua[i] = 0;
    if (xi < -55 || xi > 54) { tiles[i] = BJ_PEDRA; walls[i] = WBJ_PEDRA; continue; }
    const top = BJVL_TETO(xi, B), fl = bjVlChao(xi);
    walls[i] = y < B.top + 10 ? WBJ_MENIR : WBJ_PEDRA;
    if (y >= top && y < fl) tiles[i] = AIR;
    else if (y === fl) tiles[i] = Math.abs(xi) >= 40 ? (hash2(xi, y, seed ^ 0x3f72) < 0.5 ? BJ_TURFA : BJ_LAMA) : Math.abs(xi) <= 8 ? BJ_TURFA : BJ_LAMA;
    else if (y > fl && y < fl + 3) tiles[i] = Math.abs(xi) > 8 && Math.abs(xi) < 40 ? BJ_ARGILA : BJ_TURFA;
    else tiles[i] = hash2(xi, y, seed ^ 0x3f73) < 0.12 ? BJ_MENIR : BJ_PEDRA;
  }
  // as paredes da água: as margens descem retas até o fundo (a água não vaza para as margens)
  for (const s of [-1, 1]) for (let y = B.fy - 7; y <= B.fy; y++) { const i = I(B.cx + s * 40, y); tiles[i] = BJ_TURFA; }
  for (const s of [-1, 1]) for (let y = B.fy - 5; y <= B.fy; y++) { const i = I(B.cx + s * 8, y); tiles[i] = BJ_TURFA; }
  // as portas: o corredor das margens atravessa a parede (a barreira de espinhos fecha durante a luta)
  for (const D of B.doors) for (let k = 0; k < 4; k++) {
    const xi = D.side < 0 ? -55 - k : 54 + k, x = B.cx + xi;
    for (let y = B.fy - 12; y < B.fy - 7; y++) { tiles[I(x, y)] = AIR; walls[I(x, y)] = WBJ_PEDRA; }
    tiles[I(x, B.fy - 7)] = BJ_PEDRA;
  }
  // as plataformas de tábua: da ilhota à margem, 3 linhas acima da água mais alta; estacas, escadas nas pontas
  const dy = B.fy - 10;
  for (const s of [-1, 1]) {
    for (let a = 9; a <= 39; a++) tiles[I(B.cx + s * a, dy)] = BJ_TABUA;
    for (const a of [15, 22, 29, 36]) for (let y = dy + 1; y < B.fy; y++) if (tiles[I(B.cx + s * a, y)] === AIR) tiles[I(B.cx + s * a, y)] = BJ_POSTE;
    for (let y = dy; y < B.fy; y++) tiles[I(B.cx + s * 9, y)] = BJ_ESCADA;
    for (let y = dy; y < B.fy - 7; y++) tiles[I(B.cx + s * 39, y)] = BJ_ESCADA;
    // a luz: velas pretas nas margens e nas plataformas, fogos-fátuos em cima da água
    for (const a of [44, 50]) tiles[I(B.cx + s * a, B.fy - 8)] = BJ_VELA;
    tiles[I(B.cx + s * 24, dy - 1)] = BJ_VELA;
    for (const a of [12, 19, 33]) if (tiles[I(B.cx + s * a, B.fy - 8)] === AIR) tiles[I(B.cx + s * a, B.fy - 8 - (a & 1))] = BJ_FATUO;
  }
  // as raízes penduradas do teto e o limo
  for (let xi = -53; xi <= 52; xi += 3 + ((hash2(xi, 9, seed ^ 0x3f74) * 4) | 0)) {
    const top = BJVL_TETO(xi, B), n = 2 + ((hash2(xi, 10, seed ^ 0x3f75) * 5) | 0);
    if (Math.abs(xi) < 12) continue;
    for (let j = 0; j < n; j++) { const i = I(B.cx + xi, top + j); if (tiles[i] === AIR) tiles[i] = j === n - 1 ? BJ_MUSGO : BJ_RAIZ; }
  }
  // a água: as duas bacias entre a ilhota e as margens (bjWater enche; 378 enche de novo depois do 87)
  for (let k = bjPools.length - 1; k >= 0; k--) if (bjPools[k].kind === 'caldeirao') bjPools.splice(k, 1);
  for (const s of [-1, 1]) bjPools.push({ x0: wrapX(B.cx + (s < 0 ? -39 : 9)), x1: wrapX(B.cx + (s < 0 ? -9 : 39)), fy: B.fy - 1, wl: B.wl, kind: 'caldeirao', cx: wrapX(B.cx + s * 24) });
  if (typeof bjWater === 'function') bjWater();
}

/* ================= a luta ================= */
function bjVlHeroIn(m = 0) {
  const B = bjBoss; if (!B || !pl || pl.dead) return false;
  const tx = Math.floor((pl.x + pl.w / 2) / T), ty = Math.floor((pl.y + pl.h - 2) / T), xi = bjVlXi(tx);
  return xi >= -55 - m && xi <= 54 + m && ty >= B.top - m && ty <= B.fy;
}
function bjVlSeal(on) {
  const B = bjBoss, I = (x, y) => y * WW + wrapX(x);
  for (const D of B.doors) for (let k = 1; k <= 2; k++) {
    const x = B.cx + (D.side < 0 ? -55 - k : 54 + k);
    for (let y = B.fy - 12; y < B.fy - 7; y++) { const i = I(x, y); if (on ? tiles[i] === AIR : tiles[i] === BJ_BARREIRA) { tiles[i] = on ? BJ_BARREIRA : AIR; markDirty(wrapX(x), y); } }
  }
  if (on) sfx.bjVlEspinhos();
  mapVer++;
}
function bjVlSet(e, st, t) { e.state = st; e.stateT = t; e.stateMax = t; }
function bjVlStart() {
  bjVlDrops();
  const B = bjBoss, D = ET.bjvelha;
  const e = spawnEnemy('bjvelha', (B.cx + 3) * T, (B.fy - 5) * T - D.h, BJ_ZONE0 + 3);
  Object.assign(e, { boss: true, lvl: BJVL_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, ph: 1, cd: 2, last: '', brew: (Math.random() * 3) | 0, facing: -1 });
  bjVlSet(e, 'intro', 1.6);
  bjVelha = e; bossFight = { e, bj: true };
  bjVlSeal(true);
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'A Velha do Brejo'; bn.lastChild.textContent = 'a que mexe o caldeirão'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('A Velha do Brejo', 'a que mexe o caldeirão');
  sfx.bjVlRiso(1); shake(3);
}
// a água volta ao nível dela, a névoa e o veneno somem
function bjVlClear() {
  bjVlNivel(0);
  bjVlFx.conchas.length = 0; bjVlFx.ondas.length = 0; bjVlFx.maos.length = 0; bjVlFx.verde = 0; bjVlFx.nevoa = 0; bjVlFx.sobe = null; bjVlFx.sombra = null; bjVlFx.cor = null;
}
function bjEnd(won) {
  const e = bjVelha; bjVelha = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  for (const m of enemies) if (m.bjVlMinion && !m.dead) { burst(m.x + m.w / 2, m.y + m.h / 2, 8, '#24202a', 50, -20, 0.8); m.dead = true; m.despawn = true; }
  bjVlClear(); bjVlSeal(false);
  if (!won) { if (e) { e.dead = true; e.despawn = true; } return; }
  bjVlState.dead = true;
  const x = e ? e.x + e.w / 2 : bjBoss.cx * T, y = e ? e.y : (bjBoss.fy - 8) * T;
  burst(x, y + 10, 30, '#3a6a2a', 130, 60, 1.2, 1, true); burst(x, y + 14, 24, '#24202a', 120, 200, 1.1);
  const bases = BJVL_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.bjVlMorte();
  showBanner('Vitória', 'o caldeirão esfria');
  // o caminho para baixo abre pelo 363 (que embrulha este endBossFight por fora)
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.bj) return bjEnd(won); return _eb(won); }; }
// sem levar golpe na entrada nem quando pula no pilão
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'bjvelha' && (e.state === 'intro' || e.state === 'shift')) { sfx.tink(); return; }
  if (e && e.type === 'bjvelha') { const r = _hit(e, dir, mult, melee); e.vx = 0; e.stun = 0; return r; }
  return _hit(e, dir, mult, melee);
}; }
// nada da gruta quebra enquanto ela vive
{ const _bt = breakTile; breakTile = function (tx, ty) { if (bjBoss && !bjVlState.dead && inBjHall(tx, ty, 3)) { sfx.tink(); return; } return _bt(tx, ty); }; }

/* ---------- a água subindo (o caldo preto): até 2 linhas acima do nível, só nas bacias e na ilhota ---------- */
let bjVlN = 0;
function bjVlNivel(n) {
  if (!agua.length || !bjBoss) { bjVlN = 0; return; }
  const B = bjBoss, I = (x, y) => y * WW + wrapX(x);
  n = clamp(n | 0, 0, 2); if (n === bjVlN) return;
  for (let k = 1; k <= 2; k++) {
    const y = B.wl - k, on = k <= n;
    for (let xi = -39; xi <= 39; xi++) {
      const i = I(B.cx + xi, y); if (SOLID[tiles[i]] && tiles[i] !== BJ_TURFA) continue; if (SOLID[tiles[i]]) continue;
      if (on && !agua[i]) { agua[i] = AGUA_LIMPA; aguaN[i] = 8; aguaK[i] = AGUA_LIMPA; bjVlFx.extra.push(i); }
      else if (!on && agua[i] && bjVlFx.extra.includes(i)) aguaSecar(i);
    }
  }
  if (!n) bjVlFx.extra.length = 0; else bjVlFx.extra = bjVlFx.extra.filter(i => agua[i]);
  bjVlN = n;
}
// o herói dentro da água da gruta (o veneno verde só pega quem está nela)
const bjVlNaAgua = () => { const tx = Math.floor((pl.x + pl.w / 2) / T); return aguaAt(tx, Math.floor((pl.y + pl.h - 3) / T)) || aguaAt(tx, Math.floor((pl.y + pl.h / 2) / T)); };

/* ---------- o cérebro ---------- */
const bjVlCx = e => e.x + e.w / 2;
function bjVlPick(e) {
  const pcx = pl.x + pl.w / 2, dx = pcx - bjVlCx(e), near = Math.abs(dx) < 3.4 * T && Math.abs(pl.y + pl.h - (e.y + e.h)) < 2 * T;
  let L;
  if (e.ph === 1) L = near ? [['unha', 5], ['concha', 1]] : [['concha', 4], ['ferve', bjVlFx.sobe || bjVlFx.verde > 0 ? 0 : 3], ['anda', 1.5]];
  else if (e.ph === 2) L = [['pilao', 3.5], ['vassoura', 3], ['concha', 2], ['ferve', bjVlFx.sobe || bjVlFx.verde > 0 ? 0 : 1.2]];
  else L = [['pilao', 2.6], ['vassoura', 2], ['transborda', 2.2], ['maos', 2.4], ['concha', 1.4], ['ferve', bjVlFx.sobe || bjVlFx.verde > 0 ? 0 : 0.8]];
  L = L.filter(([k, w]) => w > 0 && !(k === e.last && e.rep >= 1));
  let s = L.reduce((a, [, w]) => a + w, 0) * Math.random();
  for (const [k, w] of L) { s -= w; if (s <= 0) { e.rep = k === e.last ? (e.rep || 0) + 1 : 0; e.last = k; return k; } }
  return L[0][0];
}
function bjVlGo(e, k) {
  const pcx = pl.x + pl.w / 2;
  e.facing = pcx < bjVlCx(e) ? -1 : 1;
  if (k === 'unha') { bjVlSet(e, 'unhaW', BJVL_UNHA); sfx.bjVlUnha(0); }
  else if (k === 'concha') { bjVlSet(e, 'conchaW', BJVL_CONCHA); sfx.bjVlConcha(0); }
  else if (k === 'ferve') {
    e.brew = (e.brew + 1 + (Math.random() < 0.4 ? 1 : 0)) % 3; bjVlFx.cor = ['verde', 'preto', 'branco'][e.brew];
    bjVlSet(e, 'ferveW', BJVL_FERVE); sfx.bjVlBorbulha();
  }
  else if (k === 'anda') { bjVlSet(e, 'anda', 1.2 + Math.random()); e.walkDir = Math.random() < 0.5 ? -1 : 1; }
  else if (k === 'pilao') { bjVlSet(e, 'pilaoW', BJVL_PILAO); sfx.bjVlVoo(); }
  else if (k === 'vassoura') { e.swY = pl.y + pl.h - e.h + 6; bjVlSet(e, 'vassouraW', BJVL_VASSOURA); sfx.bjVlVassoura(0); }
  else if (k === 'transborda') { bjVlSet(e, 'transbordaW', BJVL_TRANSBORDA); sfx.bjVlTampa(); }
  else if (k === 'maos') {
    const tx = Math.floor(pcx / T), ty = Math.floor((pl.y + pl.h - 1) / T);
    bjVlFx.maos.length = 0;
    for (const o of [0, -3, 3]) { const x = (tx + o) * T + T / 2, gy = bjVlChaoY(x); bjVlFx.maos.push({ x, y: gy, t: 0, hit: false }); }
    bjVlSet(e, 'maosW', BJVL_MAOS); sfx.bjVlBolhas(); void ty;
  }
}
// saiu da varrida dentro de uma tábua: sobe até ficar livre
function bjVlSolta(e) { for (let k = 0; k < 6; k++) { let hit = false; for (let y = Math.floor(e.y / T); y <= Math.floor((e.y + e.h - 1) / T) && !hit; y++) for (let x = Math.floor(e.x / T); x <= Math.floor((e.x + e.w - 1) / T); x++) if (solidAt(x, y)) { hit = true; break; } if (!hit) return; e.y -= T; } }
// a altura do chão (ou da água) de uma coluna da gruta, em pixels
function bjVlChaoY(px, y0) {
  const B = bjBoss, tx = Math.floor(px / T), xi = bjVlXi(tx);
  let y = y0 === undefined ? Math.floor(pl.y / T) - 2 : y0; if (y < B.top) y = B.top;
  for (; y <= B.fy; y++) { if (SOLID[tiles[y * WW + wrapX(tx)]] || aguaAt(tx, y)) return y * T; }
  return bjVlChao(xi) * T;
}
AI.bjvelha = (e, dt) => {
  const B = bjBoss; if (!B) return;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, ecx = bjVlCx(e), D = ET.bjvelha;
  e.stateT -= dt;
  const grav = () => { e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); };
  const ph = e.hp > e.maxHp * 0.6 ? 1 : e.hp > e.maxHp * 0.3 ? 2 : 3;
  if (ph > e.ph && e.state !== 'pilaoQ' && e.state !== 'vassoura') { e.ph = ph; bjVlSet(e, 'shift', 1.2); e.vx = 0; sfx.bjVlRiso(ph === 3 ? 0.8 : 1); if (ph === 3) shake(4); }
  const fly = e.ph >= 2 && e.state !== 'intro';
  const st = e.state;
  // o pairar do pilão: perto do herói, um pouco acima e ao lado, longe das paredes
  const hover = (tx, ty, sp = 120) => BJ2.bjHover(e, tx, ty, sp, dt, 380);
  const homeY = (B.fy - 18) * T;
  if (st === 'intro') { e.vx = 0; grav(); if (e.stateT <= 0) { bjVlSet(e, 'idle', 0.6); e.cd = 1.2; } return; }
  if (st === 'shift') {
    // pula no pilão (fase 2) ou dá a risada e o caldeirão ferve sozinho (fase 3)
    if (e.ph === 2) { e.vy = e.stateT > 0.8 ? -120 : approach(e.vy, 0, 400 * dt); e.vx = 0; }
    else { e.vx = approach(e.vx, 0, 300 * dt); e.vy = approach(e.vy, 0, 300 * dt); }
    if (Math.random() < dt * 30) BJB.bjSparks(ecx + rnd(-8, 8), e.y + e.h, 1, BJVL_COR.verde, 40, -40, 0.5, true);
    if (e.stateT <= 0) { bjVlSet(e, 'idle', 0.4); e.cd = 0.8; }
    return;
  }
  if (st === 'idle' || st === 'anda') {
    e.cd -= dt;
    if (!fly) {
      grav();
      // na ilhota, perto do caldeirão; anda um pouco para os lados
      const lim0 = (B.cx - 7) * T, lim1 = (B.cx + 8) * T - e.w;
      if (st === 'anda') { e.vx = e.walkDir * 30; if (e.x < lim0 || e.x > lim1) e.walkDir = -e.walkDir; e.facing = e.walkDir; if (e.stateT <= 0) bjVlSet(e, 'idle', 0.5); }
      else { e.vx = approach(e.vx, 0, 200 * dt); e.facing = pcx < ecx ? -1 : 1; }
      e.x = clamp(e.x, lim0, lim1);
    } else {
      e.facing = pcx < ecx ? -1 : 1;
      const side = ecx < pcx ? -1 : 1;
      hover(clamp(pcx + side * 7 * T, (B.cx - 50) * T, (B.cx + 50) * T), Math.min(homeY, pl.y - 5 * T));
      if (st === 'anda' && e.stateT <= 0) bjVlSet(e, 'idle', 0.5);
    }
    if (e.cd <= 0 && !pl.dead) bjVlGo(e, bjVlPick(e));
    return;
  }
  const done = (cd = 1) => { bjVlSet(e, 'idle', 0.3); e.cd = cd * (e.ph === 3 ? 0.75 : e.ph === 2 ? 0.88 : 1); };
  if (!fly) grav(); else if (!st.startsWith('pilao') && st !== 'vassoura' && st !== 'vassouraW') { e.vx = approach(e.vx, 0, 300 * dt); e.vy = approach(e.vy, 0, 300 * dt); }
  if (st === 'unhaW') { e.vx = 0; e.facing = pcx < ecx ? -1 : 1; if (e.stateT <= 0) { bjVlSet(e, 'unha', 0.25); sfx.bjVlUnha(1); e.hitDone = false; } }
  else if (st === 'unha') {
    if (!e.hitDone) { const x0 = e.facing > 0 ? ecx : ecx - 2.4 * T; if (!pl.dead && pl.x + pl.w > x0 && pl.x < x0 + 2.4 * T && pl.y + pl.h > e.y && pl.y < e.y + e.h) { e.hitDone = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') pl.vx += e.facing * 160; } }
    if (e.stateT <= 0) done(1.1);
  }
  else if (st === 'conchaW') { e.vx = 0; e.facing = pcx < ecx ? -1 : 1; if (Math.random() < dt * 14) BJB.bjSparks(ecx - e.facing * 8, e.y + 2, 1, ['#f0a050', '#a8e07a'], 10, 200, 0.4, true); if (e.stateT <= 0) {
    // o caldo voa em arco até onde o herói está (0,8 s de voo)
    const n = e.ph === 1 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      const tf = 0.8 + k * 0.18, sx = ecx + e.facing * 10, sy = e.y + 6, tx = pcx + (k ? rnd(-20, 20) : 0), ty = pl.y + pl.h - 4;
      bjVlFx.conchas.push({ x: sx, y: sy, vx: wdx(Math.floor(tx) - Math.floor(sx)) / tf, vy: (ty - sy) / tf - 0.5 * 420 * tf, t: 0, dmg: Math.round(e.dmg * 0.8) });
    }
    sfx.bjVlConcha(1); bjVlSet(e, 'conchaR', 0.4);
  } }
  else if (st === 'conchaR') { if (e.stateT <= 0) done(1.2); }
  else if (st === 'ferveW') {
    // o vapor do caldeirão muda de cor (o aviso); ela mexe com força
    if (!fly) e.vx = 0;
    if (e.stateT <= 0) {
      const c = bjVlFx.cor;
      if (c === 'verde') { bjVlFx.verde = 6; sfx.bjVlVeneno(); }
      else if (c === 'preto') { bjVlFx.sobe = { t: 0 }; sfx.bjVlSobe(); }
      else { bjVlFx.nevoa = 5; sfx.bjVlNevoa(); bjChefeSpawn = true; try { for (let k = 0; k < 2; k++) { const m = spawnEnemy('bjcorvo', clamp(pcx + (k ? 1 : -1) * rnd(3, 6) * T, (B.cx - 50) * T, (B.cx + 50) * T), Math.max((B.top + 14) * T, pl.y - 6 * T), BJ_ZONE0 + 3);   /* saem do vapor perto do herói (longe demais e o 13 os apaga) */ if (m) Object.assign(m, { bjMinion: true, bjVlMinion: true, lvl: BJVL_L, hp: Math.round(ET.bjcorvo.hp * (1 + 0.3 * (BJVL_L - 1))), maxHp: Math.round(ET.bjcorvo.hp * (1 + 0.3 * (BJVL_L - 1))), dmg: Math.round(ET.bjcorvo.dmg * (1 + 0.2 * (BJVL_L - 1))), xp: 1, gold: 0 }); } } finally { bjChefeSpawn = false; } }
      bjVlFx.cor = null; done(1.4);
    }
  }
  else if (st === 'pilaoW') {
    // em cima do herói; a sombra no chão cresce
    hover(pcx, Math.min(pl.y - 7 * T, homeY), 200);
    bjVlFx.sombra = { x: ecx, y: bjVlChaoY(ecx, Math.floor((e.y + e.h) / T)), q: 1 - e.stateT / BJVL_PILAO };
    if (e.stateT <= 0) { bjVlSet(e, 'pilaoQ', 2); e.vx = 0; e.vy = 80; sfx.bjVlCai(); }
  }
  else if (st === 'pilaoQ') {
    e.vx = 0; e.vy = Math.min(e.vy + 1600 * dt, 620);
    bjVlFx.sombra = { x: ecx, y: bjVlChaoY(ecx, Math.floor((e.y + e.h) / T)), q: 1 };
    if (!e.hitDone && overlap(e, pl)) { e.hitDone = true; hurtPlayer(Math.round(e.dmg * 1.3), ecx, e, false); }
    const ftx = Math.floor(ecx / T), fty = Math.floor((e.y + e.h + 1) / T);
    if (e.onGround || solidAt(ftx, fty) || aguaAt(ftx, fty) || e.stateT <= 0) {
      const gy = aguaAt(ftx, fty) ? (bjSurf(ecx, (fty + 0.5) * T) || fty * T) : fty * T;
      shake(6); sfx.bjVlBate();
      bj1Ondas.push({ x: ecx, y: gy, t: 0, r: 0, dmg: Math.round(e.dmg * 0.9), hit: false });
      BJB.bjLama(ecx, gy, 16, 70, -120);
      bjVlFx.sombra = null; e.hitDone = false; e.vy = 0; bjVlSet(e, 'pilaoR', 0.8);
    }
  }
  else if (st === 'pilaoR') { e.vx = 0; e.vy = 0; if (e.stateT <= 0) { bjVlSet(e, 'sobePilao', 0.8); } }
  else if (st === 'sobePilao') { hover(ecx, homeY, 150); if (e.stateT <= 0) done(1); }
  else if (st === 'vassouraW') {
    // desce à altura do herói, do lado de onde está; a palha faísca
    const side = ecx < pcx ? -1 : 1;
    hover(pcx + side * 9 * T, e.swY, 220);
    e.facing = -side;
    if (Math.random() < dt * 20) BJB.bjSparks(ecx + e.facing * 16, e.y + e.h - 14, 1, ['#f0a050', '#ffd890'], 30, 0, 0.3, true);
    if (e.stateT <= 0) { bjVlSet(e, 'vassoura', 1.1); e.vx = e.facing * 330; e.vy = 0; e.hitDone = false; sfx.bjVlVassoura(1); }
  }
  else if (st === 'vassoura') {
    e.vy = 0; e.vx = 0; e.x += e.facing * 330 * dt;   // varre por cima de tudo (passa pelas tábuas)
    if (!e.hitDone && overlap(e, pl)) { e.hitDone = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { pl.vx += e.facing * 200; pl.vy = -140; } }
    if (Math.random() < dt * 40) BJB.bjLama(ecx - e.facing * 10, e.y + e.h, 1, 30, -40);
    if (e.stateT <= 0 || Math.abs(bjVlXi(Math.floor(ecx / T))) > 50) { e.vx = 0; bjVlSolta(e); done(1.1); }
  }
  else if (st === 'transbordaW') {
    if (Math.random() < dt * 30) BJB.bjSparks(B.cx * T + T / 2 + rnd(-14, 14), (B.fy - 5) * T - 24, 1, BJVL_COR.verde, 40, 100, 0.5, true);
    if (e.stateT <= 0) {
      const x0 = B.cx * T + T / 2;
      for (const s of [-1, 1]) bjVlFx.ondas.push({ x: x0 + s * 16, s, t: 0, hit: false, dmg: Math.round(e.dmg * 1.1) });
      sfx.bjVlTransborda(); shake(3); done(1.4);
    }
  }
  else if (st === 'maosW') { if (e.stateT <= 0) { for (const M of bjVlFx.maos) M.up = true; sfx.bjVlMaos(); bjVlSet(e, 'maos', 0.6); } }
  else if (st === 'maos') { if (e.stateT <= 0) { bjVlFx.maos.length = 0; done(1); } }
  else done(1);
  // ela não sai da gruta
  e.x = clamp(e.x, (B.cx - 54) * T, (B.cx + 54) * T - e.w); if (e.y < (B.top + 2) * T) { e.y = (B.top + 2) * T; e.vy = Math.max(0, e.vy); }
  void pcy; void D;
};

/* ---------- os efeitos: o caldo voando, o transbordar, as mãos, o veneno, a água subindo ---------- */
HOOK.update.push(dt => {
  const e = bjVelha; if (!e || !bossFight || !bossFight.bj) return;
  const B = bjBoss;
  for (let i = bjVlFx.conchas.length - 1; i >= 0; i--) {
    const C = bjVlFx.conchas[i]; C.t += dt; C.vy = Math.min(C.vy + 420 * dt, 420); C.x += C.vx * dt; C.y += C.vy * dt;
    if (Math.random() < dt * 30) BJB.bjP({ x: C.x, y: C.y, vx: rnd(-6, 6), vy: 10, g: 200, life: 0.4, max: 0.4, col: '#a8e07a', size: 1, lit: true });
    const tx = Math.floor(C.x / T), ty = Math.floor(C.y / T), hit = bjHits(C.x, C.y, 2);
    if (hit || solidAt(tx, ty) || aguaAt(tx, ty) || C.t > 3) {
      if (hit) hurtPlayer(C.dmg, C.x, null, true);
      BJB.bjSparks(C.x, C.y, 10, BJVL_COR.verde, 70, 300, 0.5, true);
      sfx.bjVlEspirra(clamp(1 - Math.hypot(pl.x - C.x, pl.y - C.y) / 260, 0.25, 1));
      if (!aguaAt(tx, ty)) { const g = solidAt(tx, ty) ? ty * T : bjFloor(C.x, C.y - 4, 6); if (g !== null) BJ2.bj2Pocas.push({ x: C.x, y: g, t: 0, w: 1.4 * T, dps: Math.max(2, Math.round(C.dmg * 0.3)), seed: Math.random() * 9 }); }
      bjVlFx.conchas.splice(i, 1);
    }
  }
  // o transbordar: a crista de caldo corre da ilhota às margens pelo chão de cada coluna (nas plataformas não pega)
  for (let i = bjVlFx.ondas.length - 1; i >= 0; i--) {
    const O = bjVlFx.ondas[i]; O.t += dt; O.x += O.s * 150 * dt;
    O.y = bjVlChaoY(O.x, bjBoss.fy - 9);
    if (!O.hit && !pl.dead) { const d = Math.abs(pl.x + pl.w / 2 - O.x), feet = pl.y + pl.h; if (d < 9 && feet > O.y - 1.6 * T && feet < O.y + 2 * T) { O.hit = true; hurtPlayer(O.dmg, O.x - O.s * 10, null, true); bjEnvenenar(2, Math.max(3, Math.round(O.dmg * 0.15))); } }
    if (Math.random() < dt * 40) BJB.bjSparks(O.x, O.y - 2, 1, BJVL_COR.verde, 30, -60, 0.5, true);
    if (Math.abs(bjVlXi(Math.floor(O.x / T))) > 53) bjVlFx.ondas.splice(i, 1);
  }
  // as mãos: o círculo de bolhas (aviso) e depois as mãos saindo; prendem um instante
  for (const M of bjVlFx.maos) {
    M.t += dt;
    if (!M.up) { if (Math.random() < dt * 14) BJB.bjP({ x: M.x + rnd(-8, 8), y: M.y - 1, vx: 0, vy: -16, g: 0, life: 0.4, max: 0.4, col: '#6a7a5a', size: 1, lit: false }); continue; }
    if (!M.hit && !pl.dead && Math.abs(pl.x + pl.w / 2 - M.x) < T + 2 && Math.abs(pl.y + pl.h - M.y) < 2 * T) { M.hit = true; const r = hurtPlayer(Math.round(e.dmg * 0.9), M.x, null, true); if (r === 'hit' && typeof elEnraizar === 'function') elEnraizar(1); }
  }
  // o caldo verde: quem está na água perde vida
  if (bjVlFx.verde > 0) { bjVlFx.verde -= dt; if (!pl.dead && bjVlNaAgua() && bjVlHeroIn(0)) bjEnvenenar(0.6, Math.max(3, Math.round(e.dmg * 0.22))); }
  if (bjVlFx.nevoa > 0) bjVlFx.nevoa -= dt;
  // o caldo preto: sobe 2 linhas em 1,5 s, fica 5 s, desce em 1,5 s
  if (bjVlFx.sobe) {
    const S = bjVlFx.sobe; S.t += dt;
    const n = S.t < 1.5 ? Math.floor(S.t / 0.75) + 1 : S.t < 6.5 ? 2 : S.t < 8 ? 2 - Math.floor((S.t - 6.5) / 0.75) - 1 : 0;
    bjVlNivel(n); if (S.t >= 8) { bjVlNivel(0); bjVlFx.sobe = null; }
    if (Math.random() < dt * 10) BJB.bjP({ x: (B.cx + rnd(-38, 38)) * T, y: (B.wl - bjVlN) * T, vx: 0, vy: -10, g: 0, life: 0.5, max: 0.5, col: '#3a3440', size: 1, lit: false });
  }
  // o vapor colorido do caldeirão
  const vx = B.cx * T + T / 2, vy = (B.fy - 5) * T - 26, cor = bjVlFx.cor ? BJVL_COR[bjVlFx.cor] : e.ph === 3 ? BJVL_COR.verde : null;
  if (Math.random() < dt * (cor ? 26 : 6)) { const C = cor || ['#5a5444', '#6a6454', '#7a7464']; BJB.bjP({ x: vx + rnd(-10, 10), y: vy, vx: rnd(-6, 6), vy: rnd(-30, -16), g: 0, life: 1.6, max: 1.6, col: C[(Math.random() * 3) | 0], size: 1, lit: !!cor && bjVlFx.cor !== 'preto' }); }
});
// o caldeirão fumega mesmo sem a luta, enquanto ela vive
HOOK.update.push(dt => {
  if (!bjBoss || bjVlState.dead || bossFight || !pl || state !== 'play') return;
  if (!bjVlHeroIn(30)) return;
  if (Math.random() < dt * 5) BJB.bjP({ x: bjBoss.cx * T + T / 2 + rnd(-10, 10), y: (bjBoss.fy - 5) * T - 26, vx: rnd(-5, 5), vy: rnd(-24, -12), g: 0, life: 1.6, max: 1.6, col: ['#5a5444', '#6a6454', '#7a7464'][(Math.random() * 3) | 0], size: 1, lit: false });
});

/* ---------- o turno: começar, sair, morrer ---------- */
HOOK.update.push(() => {
  const B = bjBoss; if (!B || !pl || state !== 'play' || bjVlState.dead) return;
  if (!bossFight && !pl.dead && bjVlHeroIn(0) && Math.abs(bjVlXi(Math.floor((pl.x + pl.w / 2) / T))) <= 52) bjVlStart();
  const e = bjVelha; if (!e || !bossFight || !bossFight.bj) return;
  if (pl.dead) { endBossFight(false); return; }
  if (!bjVlHeroIn(2)) { endBossFight(false); return; }
  if (enemies[enemies.length - 1] !== e) { const k = enemies.indexOf(e); if (k >= 0) { enemies.splice(k, 1); enemies.push(e); } }
});
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.bj) bossFight = null;
  bjVelha = null; bjVlFx.extra.length = 0; bjVlN = 0; bjVlFx.conchas.length = 0; bjVlFx.ondas.length = 0; bjVlFx.maos.length = 0; bjVlFx.verde = 0; bjVlFx.nevoa = 0; bjVlFx.sobe = null; bjVlFx.sombra = null; bjVlFx.cor = null;
  bjVlState.dead = !!(sv && sv.velhaBrejo && sv.velhaBrejo.dead);   // antes da geração
  bjVlDrops();
  return _nw(sd, sv);
}; }
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.velhaBrejo = { dead: bjVlState.dead };
  if (o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([, t]) => t !== BJ_BARREIRA);
  return o;
}; }

/* ---------- o desenho ---------- */
DRAW_E.bjvelha = (e, fx, fy, fl) => {
  const A = BJVL_ART.get(), st = e.state, inMortar = e.ph >= 2 && st !== 'intro' && !(st === 'shift' && e.ph === 2 && e.stateT > 0.6);
  let k;
  if (inMortar) k = st === 'pilaoQ' || st === 'pilaoR' ? 5 : st === 'vassoura' || st === 'vassouraW' ? 6 : st === 'pilaoW' || st === 'conchaW' ? 4 : 4;
  else k = st === 'conchaW' || st === 'unhaW' ? 2 : st === 'unha' || st === 'conchaR' ? 3 : st === 'ferveW' ? Math.floor(e.t * 8) % 2 : Math.floor(e.t * 2) % 2;
  const bob = inMortar && st !== 'pilaoQ' && st !== 'pilaoR' ? Math.round(Math.sin(e.t * 3) * 1.5) : 0;
  const jit = (st === 'unhaW' || st === 'conchaW' || st === 'transbordaW') ? Math.round(Math.sin(e.t * 40) * 0.7) : 0;
  bjBlit(cvPick(A.v[k], e, fl), e, fx, fy + bob + 1, BJVL_ART.BX + 1, BJVL_ART.FY, jit);
};
EYES_E.bjvelha = (e, fx, fy) => {
  const warn = e.state.endsWith('W');
  lc.globalAlpha = warn ? 0.85 : 0.45;
  lc.drawImage(bjGl('vlOlho', 4, '#c8f07a'), Math.round(fx + 5.6 * e.facing) - 4, Math.round(fy - (BJVL_ART.FY - 10.2)) - 4);
  if (e.state === 'conchaW') { lc.globalAlpha = 0.5; lc.drawImage(bjGl('vlConcha', 8, '#a8e07a'), Math.round(fx - 8 * e.facing) - 8, Math.round(fy - BJVL_ART.FY) - 6); }
};
WARN_E.bjvelha = e => e.state.endsWith('W');
// o caldeirão, a sombra do pilão, as cristas, as mãos e o círculo de bolhas, a água verde
HOOK.drawWorld.push((cx, cy) => {
  const B = bjBoss; if (!B || !bjVlHeroIn(40)) return;
  const A = BJVL_ART.get(), X = Math.round(B.cx * T + T / 2 - 20 - cx), Y = Math.round((B.fy - 5) * T - 26 - cy) + (bossFight && bossFight.bj && bjVelha && bjVelha.state === 'transbordaW' ? Math.round(Math.sin(gameTime * 50)) : 0);
  if (X > -50 && X < VW + 10 && Y > -40 && Y < VH + 10) {
    lc.drawImage(A.cal.r, X, Y);
    // o caldo dentro: verde-escuro, borbulhando (preto quando esfriou)
    const cor = bjVlState.dead ? ['#14161a', '#1c1e22'] : bjVlFx.cor ? BJVL_COR[bjVlFx.cor] : BJVL_COR.verde;
    lc.fillStyle = cor[0]; lc.fillRect(X + 7, Y + 7, 26, 1);
    if (!bjVlState.dead) for (let k = 0; k < 4; k++) { const bx = X + 8 + ((hash2(k, Math.floor(gameTime * 3 + k), 7) * 24) | 0); lc.fillStyle = cor[1]; lc.fillRect(bx, Y + 6, 2, 1); }
  }
  const S = bjVlFx.sombra;
  if (S) { const w = 6 + S.q * 12; lc.globalAlpha = 0.2 + 0.4 * S.q; lc.fillStyle = '#000'; lc.fillRect(Math.round(S.x - w - cx), Math.round(S.y - 1 - cy), Math.round(w * 2), 2); lc.fillRect(Math.round(S.x - w + 3 - cx), Math.round(S.y - 2 - cy), Math.round(w * 2 - 6), 1); lc.globalAlpha = 1; }
  for (const O of bjVlFx.ondas) {
    const x = Math.round(O.x - cx), y = Math.round(O.y - cy);
    lc.fillStyle = '#2a4a1e'; lc.fillRect(x - 3, y - 6, 6, 6); lc.fillStyle = '#6aa84a'; lc.fillRect(x - 2, y - 8, 4, 2); lc.fillStyle = '#a8e07a'; lc.fillRect(x - 1 + O.s, y - 9, 2, 1);
    lc.globalAlpha = 0.5; lc.fillStyle = '#3a6a2a'; lc.fillRect(Math.round(x - O.s * 10), y - 3, 10 * O.s, 3); lc.globalAlpha = 1;
  }
  for (const M of bjVlFx.maos) {
    const x = Math.round(M.x - cx), y = Math.round(M.y - cy);
    if (!M.up) { lc.globalAlpha = 0.5 + 0.3 * Math.sin(gameTime * 14); lc.fillStyle = '#6a7a5a'; for (let a = 0; a < 8; a++) lc.fillRect(Math.round(x + Math.cos(a * 0.785) * 8), Math.round(y - 1 + Math.sin(a * 0.785) * 1.5), 1, 1); lc.globalAlpha = 1; continue; }
    const h = Math.min(14, Math.round(M.t * 60));
    for (const o of [-4, 0, 4]) { lc.fillStyle = '#3a443a'; lc.fillRect(x + o - 1, y - h, 2, h); lc.fillStyle = '#5a6a56'; lc.fillRect(x + o - 2, y - h - 2, 4, 2); lc.fillStyle = '#7c8a72'; lc.fillRect(x + o - 2, y - h - 3, 1, 1); lc.fillRect(x + o + 1, y - h - 3, 1, 1); }
  }
  if (bjVlFx.verde > 0 && agua.length) {   // a água venenosa: um véu verde por cima das células da gruta que se vê
    lc.globalAlpha = 0.28 * Math.min(1, bjVlFx.verde); lc.fillStyle = '#4a8a2a';
    const tx0 = Math.max(B.cx - 40, Math.floor(cx / T)), tx1 = Math.min(B.cx + 40, Math.ceil((cx + VW) / T));
    for (let y = B.wl - 2; y < B.fy; y++) for (let x = tx0; x <= tx1; x++) if (aguaAt(x, y)) lc.fillRect(x * T - cx, y * T - cy, T, T);
    lc.globalAlpha = 1;
  }
});
HOOK.drawGlow.push((cx, cy) => {
  const B = bjBoss; if (!B || !bjVlHeroIn(40)) return;
  const X = Math.round(B.cx * T + T / 2 - cx), Y = Math.round((B.fy - 5) * T - cy);
  if (!bjVlState.dead) { lc.globalAlpha = 0.5 + 0.12 * Math.sin(gameTime * 7); lc.drawImage(bjGl('vlFogo', 40, '#f0a050'), X - 40, Y - 44); }
  const cor = bjVlFx.cor && bjVlFx.cor !== 'preto' ? BJVL_COR[bjVlFx.cor][2] : !bjVlState.dead ? '#a8e07a' : null;
  if (cor) { lc.globalAlpha = bjVlFx.cor ? 0.5 : 0.22; lc.drawImage(bjGl('vlVapor' + cor, 30, cor), X - 30, Y - 66); }
  for (const C of bjVlFx.conchas) { lc.globalAlpha = 0.5; lc.drawImage(bjGl('vlCaldo', 8, '#a8e07a'), Math.round(C.x - cx) - 8, Math.round(C.y - cy) - 8); }
  for (const O of bjVlFx.ondas) { lc.globalAlpha = 0.4; lc.drawImage(bjGl('vlOnda', 14, '#6aa84a'), Math.round(O.x - cx) - 14, Math.round(O.y - cy) - 18); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  const B = bjBoss; if (!B) return;
  // o fogo de turfa embaixo do caldeirão (chamas baixas)
  if (!bjVlState.dead && bjVlHeroIn(30)) {
    const X = Math.round(B.cx * T + T / 2 - 12 - cx), Y = Math.round((B.fy - 5) * T - 2 - cy), T0 = Math.floor(gameTime * 9);
    if (X > -30 && X < VW + 30) for (let c = 0; c < 24; c++) {
      const env = Math.sin(Math.PI * (c + 0.5) / 24), h = Math.round(env * (2 + (Math.sin(gameTime * 8 + c * 1.7) + 1) * 1.6 + hash2(c, T0, 5) * 2));
      for (let j = 0; j < h; j++) { const t = j / Math.max(1, h); lc.fillStyle = t < 0.3 ? '#ffd890' : t < 0.7 ? '#f0a050' : '#b85a20'; lc.fillRect(X + c, Y - j, 1, 1); }
    }
  }
  // a névoa branca: faixas claras passando pela tela inteira dentro da gruta
  if (bjVlFx.nevoa > 0 && bjVlHeroIn(2)) {
    const a = Math.min(1, bjVlFx.nevoa) * 0.32;
    for (let k = 0; k < 6; k++) { const y = ((k * 53 + gameTime * 6) % (VH + 40)) - 20; lc.globalAlpha = a * (0.6 + 0.4 * Math.sin(gameTime + k)); lc.fillStyle = '#c8c8c4'; lc.fillRect(0, Math.round(y), VW, 26); }
    lc.globalAlpha = a * 0.6; lc.fillStyle = '#d0d0cc'; lc.fillRect(0, 0, VW, VH);
    lc.globalAlpha = 1;
  }
});
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const B = bjBoss; if (!B || !bjVlHeroIn(40)) return;
  if (!bjVlState.dead) addL(B.cx * T + T / 2, (B.fy - 6) * T, 0.9);
  for (const C of bjVlFx.conchas) addL(C.x, C.y, 0.25);
  for (const O of bjVlFx.ondas) addL(O.x, O.y - 4, 0.3);
}; }

/* ---------- O Pilão da Velha ---------- */
STAT_DEF.lgPilao = { t: 'todo golpe envenena por 3 s (o caldo da Velha), e quem está envenenado leva +20% de dano', flag: 1 };
STAT_KEYS.push('lgPilao');
ITEMS.pilao_velha = {
  name: 'O Pilão da Velha', slot: 'weapon', kind: 'mace', rar: 4,
  pal: { w: '#d0d0cc', W: '#a8a8a4', l: '#5a5a5a', g: '#747474', G: '#2c2c2c', h: '#4e3820', p: '#6aa84a' },
  legend: [['lgPilao', 1], ['dmgPct', 0.14], ['hp', 30]],
  desc: 'A mão de pilão de pedra com que a Velha socava ossos e ervas, ainda verde do caldo. Pesada, e o que ela toca adoece.'
};
BASE_INFO.pilao_velha = [BJVL_L, 0.94];
ITEM_G.pilao_velha = 1; ITEMS.pilao_velha.g = 1;
bjVlDrops();
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgPilao || 0;
  if (!pl.lg) pl.lg = {}; pl.lg.pilao = b > 0;
  return r;
}; }
// o veneno do Pilão: 3 s, 8% do golpe por segundo; o envenenado leva +20%
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (melee && pl && pl.lg && pl.lg.pilao && e && !e.dead) {
    const pois = e.bjVenT > 0, r = _hit(e, dir, pois ? mult * 1.2 : mult, melee);
    if (!e.dead) { e.bjVenT = 3; e.bjVenD = Math.max(2, Math.round((pl.dmg || 10) * 0.08)); }
    return r;
  }
  return _hit(e, dir, mult, melee);
}; }
HOOK.update.push(dt => {
  for (const e of enemies) {
    if (e.dead || !(e.bjVenT > 0)) continue;
    e.bjVenT -= dt; e.bjVenAcc = (e.bjVenAcc || 0) + dt;
    if (e.bjVenAcc >= 0.5) {
      e.bjVenAcc = 0; const d = Math.max(1, Math.round(e.bjVenD * 0.5)); e.hp -= d; e.flash = 0.05; e.showHp = 1.5;
      floatText(e.x + e.w / 2, e.y - 4, '' + d, '#a8e07a', 0.5);
      if (Math.random() < 0.6) BJB.bjSparks(e.x + e.w / 2, e.y + e.h / 2, 2, ['#3a6a2a', '#6aa84a', '#a8e07a'], 20, -20, 0.5, true);
      if (e.hp <= 0) killEnemy(e);
    }
  }
});

/* ---------- som: a risada, a concha, o caldo, o pilão, a vassoura ---------- */
Object.assign(sfx, {
  bjVlRiso(v = 1) { for (let k = 0; k < 6; k++) { tone(520 * v + (k % 2) * 90, 0.09, 'sawtooth', 0.025, -120, k * 0.1); noise(0.08, 0.02, 1800, 'bandpass', k * 0.1, 3); } tone(300 * v, 0.6, 'triangle', 0.015, -140, 0.65); },
  bjVlEspinhos() { for (let k = 0; k < 6; k++) { noise(0.1, 0.07, 900 + k * 120, 'bandpass', k * 0.07, 2); tone(140 - k * 8, 0.12, 'square', 0.012, -40, k * 0.07); } },
  bjVlUnha(on) { if (!on) tone(420, 0.4, 'triangle', 0.015, 300); else noise(0.18, 0.12, 2400, 'highpass'); },
  bjVlConcha(on) { if (!on) { noise(0.5, 0.04, 400, 'lowpass', 0, 1); tone(180, 0.5, 'sine', 0.015, 60); } else { noise(0.25, 0.1, 700, 'lowpass'); tone(160, 0.2, 'sine', 0.03, -60); } },
  bjVlEspirra(v = 1) { noise(0.3, 0.1 * v, 1200, 'bandpass', 0, 1); noise(0.5, 0.05 * v, 3000, 'highpass', 0.05); },
  bjVlBorbulha() { for (let k = 0; k < 10; k++) tone(120 + Math.random() * 160, 0.08, 'sine', 0.03, 120, k * 0.11); noise(1.2, 0.04, 300, 'lowpass', 0, 0.8); },
  bjVlVeneno() { noise(0.8, 0.08, 600, 'bandpass', 0, 1); tone(90, 0.8, 'sawtooth', 0.02, -20); },
  bjVlSobe() { noise(1.6, 0.1, 220, 'lowpass', 0, 0.5); tone(50, 1.6, 'sine', 0.06, 20); },
  bjVlNevoa() { noise(1.4, 0.07, 1400, 'bandpass', 0, 0.6); tone(260, 1.2, 'sine', 0.01, -80); },
  bjVlVoo() { noise(1, 0.07, 500, 'lowpass', 0, 0.6); tone(70, 1, 'sawtooth', 0.02, 30); },
  bjVlCai() { noise(0.4, 0.1, 400, 'lowpass', 0, 0.5); },
  bjVlBate() { tone(40, 0.7, 'sine', 0.2, -12); noise(0.5, 0.2, 260, 'lowpass'); noise(0.4, 0.08, 900, 'bandpass', 0.05, 1); },
  bjVlVassoura(on) { if (!on) for (let k = 0; k < 5; k++) noise(0.06, 0.05, 2600, 'highpass', k * 0.13); else noise(0.6, 0.14, 1200, 'bandpass', 0, 0.8); },
  bjVlTampa() { for (let k = 0; k < 8; k++) { tone(300 + Math.random() * 80, 0.05, 'square', 0.03, -100, k * 0.14); noise(0.05, 0.05, 2000, 'bandpass', k * 0.14, 4); } },
  bjVlTransborda() { noise(1.4, 0.14, 500, 'lowpass', 0, 0.6); for (let k = 0; k < 8; k++) tone(140 + Math.random() * 200, 0.1, 'sine', 0.03, 140, k * 0.12); },
  bjVlBolhas() { for (let k = 0; k < 8; k++) tone(90 + Math.random() * 100, 0.1, 'sine', 0.03, 80, k * 0.09); },
  bjVlMaos() { noise(0.4, 0.12, 300, 'lowpass'); tone(110, 0.6, 'sawtooth', 0.025, -40); for (let k = 0; k < 3; k++) tone(70, 0.4, 'sine', 0.03, -10, 0.1 + k * 0.1); },
  bjVlMorte() { for (let k = 0; k < 4; k++) tone(500 - k * 90, 0.4, 'sawtooth', 0.03, -200, k * 0.3); noise(2.4, 0.1, 300, 'lowpass', 0.6, 0.5); tone(40, 2.6, 'sine', 0.08, -10, 0.8); }
});
