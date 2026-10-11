'use strict';

/* ================= os Salões do Pesadelo: os sistemas do sonho (docs/camadas/14-saloes-pesadelo.md, seção 13) =================
   - os corredores em laço (psLoops, do 305): 3 trechos iguais de L blocos. Andando para a frente, ao passar do trecho
     2 para o 3 o herói, as coisas, os projéteis e os itens soltos voltam L blocos no mesmo quadro (a câmera segue o
     herói, então não se vê o salto). A cada volta uma coisa pequena muda (a luz cai um pouco, uma porta a mais na
     parede). Da segunda volta em diante o Quadro Torto aparece na parede do trecho 2: quebrar o quadro desfaz o laço
     para sempre; na sexta volta ele se desfaz sozinho (decisão em aberto 1, a recomendada). Andar para trás nunca dá
     a volta. Quebrar ou pôr um bloco num trecho repete nos outros dois enquanto o laço existe;
   - as portas que levam longe (psDoors, do 305): W ou seta para cima na frente de uma porta, com o escurecimento curto
     (0,3 s). Par: a outra porta. Quarto que não existe: o cômodo fechado por O Nada (a porta de dentro sempre leva de
     volta); no quarto de monstro, uma coisa sozinha nasce na primeira visita e solta uma base temática com 10%. Porta
     para lugar nenhum: abre e mostra tijolo. O Que Corre Atrás passa pela porta 1 s depois do herói;
   - os Adormecidos (psBeds, do 305): quem dorme sonha a onirita em volta. Golpe dado ou levado a menos de 10 blocos
     enche o medidor (minerar não conta: decisão em aberto 3, a recomendada); a cada 3 pontos ele se vira e o "Zz"
     some um instante; na terceira vez ele senta na cama e acorda: os veios de onirita em volta viram Veio Desfeito de
     uma vez. O que já foi minerado fica;
   - os estados do herói: cochilo (as pálpebras fecham na tela, parado), agarrado (preso até bater em quem segura) e a
     volta no tempo (o rastro fantasma do herói onde ele vai parar). A morte limpa tudo. */

const PS_MOVE_KEYS = ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
const psLoopUndone = new Set(), psAwakeSet = new Set();
const psAwake = id => psAwakeSet.has(id);
const psNoise = {};   // id da cama -> { v, vez, turnT, sitT }
let psDoorFx = null, psFade = 0;

/* ================= os corredores em laço ================= */
const psLoopOn = Lp => !psLoopUndone.has(Lp.id);
const psLoopRel = (Lp, px) => wdx(Math.floor(px / T) - Lp.x0) + (px / T - Math.floor(px / T));   // em blocos, a partir do começo
const psInCorr = (Lp, x, y) => { const r = psLoopRel(Lp, x), ty = Math.floor(y / T); return r >= 0 && r < Lp.n * Lp.L && ty >= Lp.top && ty < Lp.fy; };
function psLoopUndo(Lp, how) {
  if (!psLoopOn(Lp)) return;
  psLoopUndone.add(Lp.id); Lp.laps = 0;
  for (const e of enemies) if (e.type === 'quadrotorto' && e.psLoop === Lp.id && !e.dead) { e.dead = true; burst(e.x + e.w / 2, e.y + e.h / 2, 18, '#cbb4ba', 90, 160, 0.8); }
  sfx.psRasgo(how === 'quadro' ? 1 : 0.7);
  shake(how === 'quadro' ? 3 : 2);
}
// o Quadro Torto: uma "coisa" de 1 de vida pendurada na parede de fundo do trecho 2; não sai do lugar, não ataca
ET.quadrotorto = { name: 'Quadro Torto', w: 20, h: 16, hp: 1, dmg: 0, xp: 0, kb: 0, fly: true, blood: '#cbb4ba' };
DROPS.quadrotorto = [];
AI.quadrotorto = e => { e.vx = 0; e.vy = 0; if (e.ax !== undefined) { e.x = e.ax; e.y = e.ay; } };
DRAW_E.quadrotorto = (e, fx, fy, fl) => {
  const d = PROP_DEFS.ps_quadro_torto, img = d && d.variantes && d.variantes[0]; if (!img) return;
  lc.drawImage(img, Math.round(fx - img.width / 2), Math.round(fy - img.height + 1));
  if (fl) { lc.globalAlpha = 0.5; lc.fillStyle = '#ffffff'; lc.fillRect(Math.round(fx - img.width / 2), Math.round(fy - img.height + 1), img.width, img.height); lc.globalAlpha = 1; }
};
EYES_E.quadrotorto = () => {}; WARN_E.quadrotorto = () => false;
function psQuadro(Lp) {
  if (enemies.some(e => e.type === 'quadrotorto' && e.psLoop === Lp.id && !e.dead)) return;
  const tx = Lp.x0 + Lp.L + 13, ty = Lp.fy - 3;
  const e = spawnEnemy('quadrotorto', tx * T + T / 2 - 10, ty * T - 2, -1); if (!e) return;
  Object.assign(e, { psLoop: Lp.id, psFixed: true, psMinion: true, hp: 1, maxHp: 1, xp: 0, gold: 0, lvl: 1 }); e.ax = e.x; e.ay = e.y;
}
function psLoopUpdate(dt) {
  if (!pl || pl.dead) return;
  const px = pl.x + pl.w / 2, py = pl.y + pl.h - 1;
  for (const Lp of psLoops) {
    if (!psLoopOn(Lp)) continue;
    Lp.laps = Lp.laps || 0;
    const r = psLoopRel(Lp, px), inside = psInCorr(Lp, px, py);
    if (inside && Lp.laps >= 1) psQuadro(Lp);
    if (inside && Lp.lastR !== undefined && Lp.lastR < 2 * Lp.L && r >= 2 * Lp.L && pl.vx > 0) {
      Lp.laps++;
      if (Lp.laps >= 6) { psLoopUndo(Lp, 'sozinho'); Lp.lastR = r; continue; }   // a sexta volta: o laço cede
      const sh = -Lp.L * T, x0 = Lp.x0 * T, top = (Lp.top - 1) * T, bot = (Lp.fy + 1) * T;
      const inR = o => { const rr = wdx(Math.floor(o.x / T) - Lp.x0); return rr >= Lp.L && rr < Lp.n * Lp.L && o.y >= top && o.y <= bot; };
      pl.x += sh;
      for (const a of [enemies, projs, orbs, loot, parts, texts, ps2Notas]) for (const o of a) if (!o.psFixed && inR(o)) o.x += sh;
      if (pl.digX >= 0) pl.digX = -1;
      Lp.lastR = r - Lp.L;
      continue;
    }
    Lp.lastR = inside ? r : undefined;
  }
}
// quebrar ou pôr bloco num trecho repete nos outros dois (só enquanto o laço existe; a rocha em volta conta)
let psMirroring = false;
{ const _st = setTile; setTile = function (x, y, t) {
  _st(x, y, t);
  if (psMirroring || !PESADELO || !psLoops.length) return;
  for (const Lp of psLoops) {
    if (!psLoopOn(Lp) || y < Lp.fy - 15 || y > Lp.fy + 13) continue;
    const r = wdx(x - Lp.x0); if (r < 0 || r >= Lp.n * Lp.L) continue;
    psMirroring = true;
    try { for (let s = 0; s < Lp.n; s++) { const xx = Lp.x0 + s * Lp.L + (r % Lp.L); if (wrapX(xx) !== wrapX(x)) _st(xx, y, t); } } finally { psMirroring = false; }
  }
}; }
// o que muda a cada volta: a luz cai e, da terceira em diante, uma porta a mais na parede de cada trecho
HOOK.drawWorld.push((cx, cy) => {
  for (const Lp of psLoops) {
    if (!psLoopOn(Lp) || (Lp.laps || 0) < 3) continue;
    const d = PROP_DEFS.ps_porta, img = d && d.variantes && d.variantes[0]; if (!img) continue;
    for (let s = 0; s < Lp.n; s++) { const X = (Lp.x0 + s * Lp.L + 18) * T - cx, Y = Lp.fy * T - img.height - cy; if (X > -40 && X < VW + 40 && Y > -60 && Y < VH + 20) lc.drawImage(img, Math.round(X), Math.round(Y)); }
  }
});

/* ================= as portas que levam longe ================= */
const psDoorAt = (px, py) => psDoors.find(d => { const x0 = d.x * T, y0 = (d.fy - 4) * T; return wdx(Math.floor(px / T) - d.x) >= 0 && wdx(Math.floor(px / T) - d.x) < 2 && py > y0 && py <= d.fy * T + 1; });
function psDoorUse(d) {
  if (d.kind === 'parede') { psDoorFx = { d, t: 1.4, open: true, wall: true }; sfx.psPorta(0.8); return; }
  const to = psDoors[d.to]; if (!to) return;
  psDoorFx = { d, to, t: 0.6, open: true, moved: false };
  sfx.psPorta(1);
  // O Que Corre Atrás vem junto, 1 s depois
  for (const e of enemies) if (e.type === 'perseguidor' && !e.dead && Math.hypot(e.x - pl.x, e.y - pl.y) < 14 * T) { e.psFollow = { x: to.x * T + T - e.w / 2, y: to.fy * T - e.h, t: 1 }; e.psHide = 9; e.x = e.psFollow.x; e.y = e.psFollow.y; e.vx = e.vy = 0; }
}
function psDoorUpdate(dt) {
  if (psDoorFx) {
    const F = psDoorFx; F.t -= dt;
    if (F.to && !F.moved && F.t <= 0.3) {   // no escuro: do outro lado
      F.moved = true;
      pl.x = F.to.x * T + T - pl.w / 2; pl.y = F.to.fy * T - pl.h; pl.vx = pl.vy = 0; pl.digX = -1;
      projs.length = 0; F.d = F.to;
      if (F.to.room !== undefined) psNowhereEnter(psNowhere[F.to.room]);
    }
    if (F.t <= 0) psDoorFx = null;
  }
  psFade = psDoorFx && psDoorFx.to ? clamp(1 - Math.abs(psDoorFx.t - 0.3) / 0.3, 0, 1) : 0;
  for (const e of enemies) if (e.psFollow) { e.psFollow.t -= dt; e.psHide = 9; if (e.psFollow.t <= 0) { e.psHide = 0; e.psFollow = null; e.memT = 4; sfx.psPorta(0.6); } }
}
// o quarto que não existe com uma coisa sozinha: nasce na primeira visita
function psNowhereEnter(N) {
  if (!N || N.kind !== 'monstro' || N.spawned) return;
  N.spawned = true;
  const pool = CATH_SPAWN[PS_ZONE0 + clamp(N.band, 0, 3)][0].map(([t]) => t).filter(t => t !== 'portafaminta' && t !== 'sombraerrada' && t !== 'bonecas');
  const t = pool[(Math.random() * pool.length) | 0] || 'sonambulo';
  const e = spawnEnemy(t, (N.x0 + N.w - 4) * T, N.fy * T - ET[t].h, -1); if (e) { e.psLone = true; e.psMinion = false; }
}
const PS_BASES = ['tesoura_costura', 'capuz_lencol', 'pantufas_sonambulo'];
// desenho: a porta aberta (escuro dentro ou a parede de tijolo) enquanto o herói passa
HOOK.drawWorld.push((cx, cy) => {
  const F = psDoorFx; if (!F || !F.d || !F.d.p) return;
  const p = F.d.p, X = Math.round(p.X - cx), Y = Math.round(p.Y - cy);
  if (F.wall) { for (let y = 2; y < p.h; y++) for (let x = 2; x < p.w - 2; x++) { const row = (y / 4) | 0, mort = (y % 4 === 0) || ((x + (row & 1) * 4) % 8 === 0); lc.fillStyle = mort ? '#3a2a24' : (hash2(x >> 3, row, 7) < 0.5 ? '#7e3a26' : '#6a3020'); lc.fillRect(X + x, Y + y, 1, 1); } }
  else { lc.fillStyle = '#060406'; lc.fillRect(X + 2, Y + 2, p.w - 4, p.h - 2); }
});

/* ================= os Adormecidos ================= */
const psBedNear = (x, y, r = 10) => psBeds.filter(Bd => !psAwake(Bd.id) && Math.abs(wdx(Math.floor(x / T) - Bd.tx - 2)) <= r && Math.abs(Math.floor(y / T) - Bd.fy + 1) <= r);
function psRuido(x, y, n = 1) {
  if (!PESADELO) return;
  for (const Bd of psBedNear(x, y)) {
    const N = psNoise[Bd.id] || (psNoise[Bd.id] = { v: 0, vez: 0, turnT: 0, sitT: 0 });
    N.v += n; N.calm = 0;
    if (N.v >= 3) { N.v -= 3; N.vez++; N.turnT = 2; sfx.psVira(); if (N.vez >= 3) psAcorda(Bd); }
  }
}
function psAcorda(Bd) {
  if (psAwake(Bd.id)) return;
  psAwakeSet.add(Bd.id);
  const N = psNoise[Bd.id] || (psNoise[Bd.id] = {}); N.sitT = 1;
  // acordou, o sonho acaba: a onirita em volta vira Veio Desfeito de uma vez, com um brilho
  const cx = Bd.tx + 2, cy = Bd.fy - 2;
  for (let y = cy - 11; y <= cy + 11; y++) for (let x = cx - 11; x <= cx + 11; x++) {
    if (Math.hypot(x - cx, y - cy) > 10.5 || tileAt(x, y) !== PS_O_ONIRITA) continue;
    setTile(x, y, PS_VEIO_DESFEITO);
    burst(x * T + T / 2, y * T + T / 2, 6, Math.random() < 0.5 ? '#c09ae0' : '#f2dcff', 50, 0, 0.6, 1, true);
  }
  sfx.psAcorda();
}
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult, melee) {
  const hp0 = e && e.hp;
  const r = _hit.apply(this, arguments);
  if (e && pl && pl.psAgarraE === e) pl.psAgarraT = 0;   // bateu em quem segura: solta
  if (e && e.hp < hp0) psRuido(e.x + e.w / 2, e.y + e.h / 2);
  return r;
}; }
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const r = _hp.apply(this, arguments);
  if (r === 'hit' || r === 'block' || r === 'parry') psRuido(pl.x + pl.w / 2, pl.y + pl.h / 2);
  return r;
}; }
// o medidor esvazia devagar (um ponto a cada 15 s de silêncio)
function psNoiseUpdate(dt) {
  for (const id in psNoise) { const N = psNoise[id]; N.turnT = Math.max(0, (N.turnT || 0) - dt); N.sitT = Math.max(0, (N.sitT || 0) - dt); N.calm = (N.calm || 0) + dt; if (N.calm > 15 && N.v > 0) { N.v--; N.calm = 0; } }
}
// o desenho de quem dorme na cama (pontos 'sono' = a cabeça no travesseiro e 'corpo' = o meio do corpo no 302)
const PS_Z = [[1, 1, 1], [0, 1, 0], [1, 1, 1]];
HOOK.drawWorld.push((cx, cy) => {
  if (!PESADELO || !psBeds.length) return;
  const br = Math.sin(gameTime * Math.PI * 2 / 8);   // respira junto com a luz (8 s)
  for (const Bd of psBeds) {
    const p = Bd.p; if (!p) continue;
    const X = Math.round(p.X - cx), Y = Math.round(p.Y - cy); if (X < -60 || X > VW + 20 || Y < -60 || Y > VH + 20) continue;
    const H = PSART.psPt(p, 'sono'), C = PSART.psPt(p, 'corpo'); if (!H || !C) continue;
    const hx = X + H[0].x, hy = Y + H[0].y, bx = X + C[0].x, by = Y + C[0].y, N = psNoise[Bd.id] || {};
    if (psAwake(Bd.id)) {   // sentado na cama, de olhos abertos, olhando para o nada
      const up = Math.round(clamp(1 - (N.sitT || 0), 0, 1) * 6);
      lc.fillStyle = '#c6c4d0'; lc.fillRect(hx - 2, hy - up + 2, 6, 5 + up);   // a camisola
      lc.fillStyle = '#e2e0ea'; lc.fillRect(hx - 2, hy - up + 2, 1, 4 + up);
      lc.fillStyle = '#d0c6c4'; lc.fillRect(hx - 1, hy - up - 3, 4, 5); lc.fillStyle = '#4a2c14'; lc.fillRect(hx - 1, hy - up - 4, 4, 2);
      lc.fillStyle = '#ffffff'; lc.fillRect(hx, hy - up - 1, 1, 1); lc.fillRect(hx + 2, hy - up - 1, 1, 1);
      lc.fillStyle = '#140d14'; lc.fillRect(hx, hy - up, 1, 1); lc.fillRect(hx + 2, hy - up, 1, 1);
      continue;
    }
    const turned = (N.vez || 0) % 2 === 1;
    // a cabeça no travesseiro, o cabelo, os olhos fechados; o volume do corpo debaixo do cobertor, subindo e descendo
    lc.fillStyle = '#4a2c14'; lc.fillRect(hx - 2 + (turned ? 1 : 0), hy - 1, 5, 2);
    lc.fillStyle = '#d0c6c4'; lc.fillRect(hx - 2 + (turned ? 2 : 0), hy + 1, turned ? 3 : 4, 3);
    if (!turned) { lc.fillStyle = '#8a7e80'; lc.fillRect(hx - 1, hy + 2, 1, 1); lc.fillRect(hx + 1, hy + 2, 1, 1); }
    const lift = br > 0.3 ? 1 : 0;
    for (let k = -9; k <= 9; k++) { const h = Math.round(Math.sqrt(Math.max(0, 1 - (k / 9.5) ** 2)) * 3) + lift; lc.globalAlpha = 0.22; lc.fillStyle = '#ffffff'; lc.fillRect(bx + k, by - h, 1, 1); lc.globalAlpha = 0.28; lc.fillStyle = '#000000'; lc.fillRect(bx + k, by - h + 2, 1, 1); }
    lc.globalAlpha = 1;
    if ((N.turnT || 0) > 0) continue;   // virou: o "Zz" some um instante
    for (let k = 0; k < 2; k++) {
      const ph = (gameTime * 0.4 + k * 0.5) % 1, zx = hx + 3 + Math.round(ph * 6 + Math.sin(ph * 6) * 1.5), zy = hy - 3 - Math.round(ph * 12);
      lc.globalAlpha = Math.sin(ph * Math.PI) * 0.8; lc.fillStyle = '#e6def0';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (PS_Z[r][c]) lc.fillRect(zx + c, zy + r, 1, 1);
    }
    lc.globalAlpha = 1;
  }
});

/* ================= os estados do herói ================= */
// o desenho do herói de cada quadro fica guardado num anel (o fantasma da volta no tempo e as cópias do Sem-Rosto, 307)
const PS_RING = 40, psRing = []; let psRingI = -1;
{ const _dp = drawPlayer; drawPlayer = function (cx, cy) {
  _dp(cx, cy);
  if (!PESADELO || !pl || pl.dead || !comp || !inPesadelo(Math.floor((pl.y + pl.h) / T))) return;
  psRingI = (psRingI + 1) % PS_RING;
  const R = psRing[psRingI] || (psRing[psRingI] = { cv: mk(CW, CHT) }), g = R.cv.getContext('2d');
  g.clearRect(0, 0, CW, CHT); g.drawImage(comp, 0, 0);
  R.t = gameTime; R.x = pl.x; R.y = pl.y; R.f = pl.facing; R.atk = pl.atkT >= 0; R.atkAt = pl.atkAt;
}; }
// o quadro de `ago` segundos atrás (o mais perto)
function psRingAt(ago) { let best = null; for (let k = 0; k < PS_RING; k++) { const R = psRing[(psRingI - k + PS_RING * 2) % PS_RING]; if (!R || R.t === undefined) break; best = R; if (gameTime - R.t >= ago) break; } return best; }
let psGhostCv = null;
// o herói desenhado pálido e transparente em (x, y): o rastro da volta no tempo
function psGhost(x, y, a, facing = pl.facing) {
  const R = psRingAt(0); if (!R) return;
  if (!psGhostCv) psGhostCv = mk(CW, CHT);
  const g = psGhostCv.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, CW, CHT); g.drawImage(R.cv, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.7; g.fillStyle = '#dcd0f0'; g.fillRect(0, 0, CW, CHT); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const fx = Math.round(x + pl.w / 2), fy = Math.round(y + pl.h);
  lc.globalAlpha = a;
  if (facing < 0) { lc.save(); lc.translate(fx, 0); lc.scale(-1, 1); lc.drawImage(psGhostCv, -CW / 2, fy - (OY + 22)); lc.restore(); }
  else lc.drawImage(psGhostCv, fx - CW / 2, fy - (OY + 22));
  lc.globalAlpha = 1;
}
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!PESADELO || !pl || pl.dead) { if (pl && pl.dead) { pl.psSonoT = 0; pl.psAgarraT = 0; pl.psAgarraE = null; pl.psVoltaFx = null; psDoorFx = null; } return _up(dt); }
  // a porta: W ou seta para cima na frente dela, no chão
  if (!psDoorFx && pl.onGround && (pressed.KeyW || pressed.ArrowUp) && !(pl.psSonoT > 0) && !(pl.psAgarraT > 0)) {
    const d = psDoorAt(pl.x + pl.w / 2, pl.y + pl.h - 2);
    if (d) { pressed.KeyW = pressed.ArrowUp = false; psDoorUse(d); }
  }
  const still = (pl.psSonoT || 0) > 0 || (pl.psAgarraT || 0) > 0 || !!(psDoorFx && psDoorFx.to), saved = {}, ml = mouse.l, mlp = mouse.lPressed;
  if (still) { for (const k of PS_MOVE_KEYS) { saved[k] = keys[k]; keys[k] = false; } if ((pl.psSonoT || 0) > 0 || psDoorFx) { mouse.l = false; mouse.lPressed = false; } }
  try { _up(dt); } finally { if (still) { for (const k of PS_MOVE_KEYS) keys[k] = saved[k]; mouse.l = ml; mouse.lPressed = mlp; } }
  if (pl.dead) return;
  if (still && pl.onGround) pl.vx = 0;
  if ((pl.psSonoT || 0) > 0) pl.psSonoT = Math.max(0, pl.psSonoT - dt);
  if ((pl.psAgarraT || 0) > 0) { pl.psAgarraT = Math.max(0, pl.psAgarraT - dt); if (!pl.psAgarraT) pl.psAgarraE = null; }
  if (pl.psVoltaFx) { pl.psVoltaFx.t -= dt; if (pl.psVoltaFx.t <= 0) pl.psVoltaFx = null; }
}; }
HOOK.update.push(dt => {
  if (!PESADELO || !pl) return;
  // as posições dos últimos 3 s (a volta no tempo)
  if (!pl.dead) { psHist.push([gameTime, pl.x, pl.y]); while (psHist.length && psHist[0][0] < gameTime - 3) psHist.shift(); }
  psLoopUpdate(dt); psDoorUpdate(dt); psNoiseUpdate(dt);
});
// o Quadro Torto e as coisas sem experiência morrem quietas; o monstro do quarto que não existe solta base com 10%
{ const _ke = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'quadrotorto') {
    e.dead = true; burst(e.x + e.w / 2, e.y + e.h / 2, 20, '#cbb4ba', 100, 200, 0.8); burst(e.x + e.w / 2, e.y + e.h / 2, 8, '#ffffff', 50, 0, 0.3, 1, true);
    const Lp = psLoops[e.psLoop]; if (Lp) psLoopUndo(Lp, 'quadro');
    return;
  }
  const r = _ke.apply(this, arguments);
  if (e && e.psLone && Math.random() < 0.1) { const ok = PS_BASES.filter(id => ITEMS[id]); if (ok.length) dropGear(e.x + e.w / 2, e.y + e.h / 2, ok[(Math.random() * ok.length) | 0], lootZone(Math.floor((e.x + e.w / 2) / T), Math.floor((e.y + e.h / 2) / T))); }
  return r;
}; }
// o desenho: as pálpebras do cochilo, o rastro da volta, o fantasma onde o relógio vai levar, a luz do laço, o escuro da porta
HOOK.drawWorld.push(() => {
  if (!PESADELO || !pl || pl.dead) return;
  const cx = Math.round(cam.x + shk.x), cy = Math.round(cam.y + shk.y);
  const V = pl.psVoltaFx; if (V) psGhost(V.x0 - cx, V.y0 - cy, clamp(V.t / 0.5, 0, 1) * 0.5);
  // o relógio avisando: o herói fantasma no lugar de 2 s antes
  if (enemies.some(e => e.type === 'relogiomole' && e.state === 'tick' && !e.dead)) {
    const t0 = gameTime - 2; let best = null; for (const h of psHist) if (h[0] <= t0) best = h; else break;
    if (best) psGhost(best[1] - cx, best[2] - cy, 0.3 + 0.15 * Math.sin(gameTime * 20));
  }
});
HOOK.drawTop.push(() => {
  if (!PESADELO || !pl) return;
  // a luz do laço cai a cada volta
  for (const Lp of psLoops) if (psLoopOn(Lp) && (Lp.laps || 0) > 0 && psInCorr(Lp, pl.x + pl.w / 2, pl.y + pl.h - 1)) { lc.globalAlpha = Math.min(0.4, Lp.laps * 0.07); lc.fillStyle = '#05030a'; lc.fillRect(0, 0, VW, VH); lc.globalAlpha = 1; }
  if (psFade > 0) { lc.globalAlpha = psFade; lc.fillStyle = '#000000'; lc.fillRect(0, 0, VW, VH); lc.globalAlpha = 1; }
  // o cochilo: as bordas da tela fecham como pálpebras e abrem no fim
  const s = pl.psSonoT || 0;
  if (s > 0) {
    const tot = pl.psSonoMax || 1.5; if (!pl.psSonoMax || s > pl.psSonoMax) pl.psSonoMax = s;
    const k = clamp(Math.min((tot - s) / 0.35, s / 0.35), 0, 1), h = Math.round(k * VH * 0.48);
    lc.fillStyle = '#0a0608'; lc.fillRect(0, 0, VW, h); lc.fillRect(0, VH - h, VW, h);
    lc.fillStyle = '#2a1a20'; lc.fillRect(0, h - 1, VW, 1); lc.fillRect(0, VH - h, VW, 1);
  } else pl.psSonoMax = 0;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  psRasgo(v = 1) { noise(0.5, 0.08 * v, 1400, 'bandpass', 0, 0.6); tone(220, 0.6, 'sine', 0.04 * v, -160); tone(330, 0.5, 'sine', 0.03 * v, 200, 0.1); },
  psPorta(v = 1) { tone(160, 0.35, 'sawtooth', 0.025 * v, 90); noise(0.1, 0.08 * v, 240, 'lowpass', 0.3); },
  psVira() { noise(0.6, 0.04, 500, 'lowpass', 0, 0.8); },
  psAcorda() { tone(392, 0.9, 'sine', 0.04, -200); tone(523, 0.7, 'sine', 0.03, -260, 0.1); noise(0.8, 0.03, 3000, 'bandpass', 0, 3); }
});
