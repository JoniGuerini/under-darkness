'use strict';

/* ================= arco e flecha em jogo (dados: js/349-arco-dados.js) =================
   - Com o arco na mão (barra 1) e a aljava equipada, o herói já está com uma flecha encaixada. Clicar (ou segurar)
     puxa a corda em direção ao mouse; soltar o botão atira. Clique rápido = flecha fraca e curta; segurar
     carrega o tiro (BOW_T.charge) e a flecha sai mais forte e mais longe; carregado, ele segura a corda até soltar.
     Logo depois a mão vai até a aljava nas costas, tira outra flecha e encaixa na corda. Equipar o arco também faz essa animação.
   - Sem aljava ou sem flecha na mochila o arco fica vazio e não atira.
   - A flecha voa com um pouco de queda e só acerta o que ela realmente toca (como os feitiços); bate com o dano do
     arco vezes o da flecha. Na parede, no teto ou no chão, metade quebra na hora (lascas) e a outra
     metade finca e fica lá: dá para pegar de volta chegando perto (18 px de folga), com E sob o mouse (js/348,
     qualquer distância) ou, se o bloco sumir, ela cai como drop.
   - A aljava ocupa o espaço do escudo mas não é escudo: botão direito e Shift não fazem nada com ela.
   - O Grimaldo sempre tem flechas (as duas), um arco e uma aljava; as flechas, o Arco Curto e a Aljava de Couro
     também saem no Criar do inventário.
   Estados do arco (bow.st): empty (sem flecha) · reload (pegando da aljava) · ready (flecha na corda) · draw · loose.
   Os tempos (BOW_T) são da velocidade base e acompanham o pl.atkPeriod do arco equipado.
   Carrega depois do 235-criar (embrulha updatePlayer, poseFor, playerPose, twoHandRule, talCondOk, restock,
   openShop, shelfOf, craftOne e paintHotbar). */

const BOW_T = { draw: 0.12, charge: 0.7, loose: 0.08, reload: 0.36 };   // draw: o mínimo puxado de um clique rápido
// força do tiro (0 = clique rápido, 1 = carregado): velocidade e dano da flecha
const BOW_POW = { spd: [0.45, 1.15], dmg: [0.5, 1.25] };
const BOW_SPD = 360, ARROW_G = 300, ARROW_LIFE = 4, ARROW_STUCK = 180, ARROW_MAX_STUCK = 40, ARROW_REACH = 18;
const ARROW_IDS = ['flecha_ferro', 'flecha'];
const bow = { st: 'empty', t: 0, pull: 0, A: 2.3, buf: 0, last: -9, w: null };
const ARROWS = [];
const bowOn = () => !!(equip.weapon && isBow(equip.weapon.id));
const quiverOn = () => !!(equip.shield && isQuiver(equip.shield.id));
const arrowNow = () => ARROW_IDS.find(id => countItem(id) > 0) || null;
const arrowsAll = () => ARROW_IDS.reduce((n, id) => n + countItem(id), 0);
const bowCan = () => bowOn() && quiverOn() && !!arrowNow();

/* ---- a arte que muda a cada quadro: o arco com a corda puxada e a flecha, e a flecha na mão ---- */
const BOW_PL = 9;   // margem à esquerda do arco para a corda puxada
function bowCanvas(id, pull, arrow) {
  return cached('bc:' + id + ':' + pull + ':' + (arrow || ''), () => {
    const art = bowArt(id), H = art.height, c = mk(BOW_PL + 7 + 9, H), x = c.getContext('2d'), mid = Math.floor(H / 2);
    x.drawImage(art, BOW_PL, 0);
    const it = ITEMS[id], sr = heroRamp(it.pal.s || '#e8e0cc');
    // a corda: das pontas até o ponto de encaixe
    const nx = BOW_PL + 1 - pull, line = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { x.fillStyle = sr[i % 5 === 2 ? 3 : 4]; x.fillRect(Math.round(lerp(x0, x1, i / n)), Math.round(lerp(y0, y1, i / n)), 1, 1); } };
    line(BOW_PL + 1, 1, nx, mid); line(nx, mid, BOW_PL + 1, H - 2);
    if (arrow) {
      const P = ARROW_PAL[arrow], wr = heroRamp(P.w), ar = heroRamp(P.a), fr = heroRamp(P.f);
      for (let i = 2; i <= 10; i++) { x.fillStyle = wr[i % 3 ? 3 : 2]; x.fillRect(nx + i, mid, 1, 1); }
      x.fillStyle = fr[3]; x.fillRect(nx, mid - 1, 2, 1); x.fillRect(nx, mid + 1, 2, 1); x.fillStyle = fr[4]; x.fillRect(nx + 1, mid, 1, 1);
      x.fillStyle = ar[3]; x.fillRect(nx + 11, mid - 1, 1, 3); x.fillStyle = ar[5]; x.fillRect(nx + 12, mid, 1, 1);
    }
    return c;
  });
}
// o arco com a flecha encaixada já no ângulo da mira: o arco gira como antes e a flecha é desenhada pixel a pixel por cima,
// para a ponta (um triângulo de 3 px) e as penas aparecerem em qualquer ângulo, até apontando para baixo
const NOCK_C = 22;   // a mão fica no meio de uma tela de 44x44
let nockCv = null;
function nockedBow(id, pull, arrow, A) {
  if (!nockCv) { nockCv = mk(NOCK_C * 2, NOCK_C * 2); nockCv.getContext('2d').imageSmoothingEnabled = false; }
  const x = nockCv.getContext('2d'), pv = bowPivot(id), P = ARROW_PAL[arrow], wr = heroRamp(P.w), ar = heroRamp(P.a), fr = heroRamp(P.f);
  x.clearRect(0, 0, NOCK_C * 2, NOCK_C * 2);
  rotDraw(x, bowCanvas(id, pull, null), NOCK_C, NOCK_C, pv.px, pv.py, A - Math.PI / 2);
  const dx = Math.sin(A), dy = -Math.cos(A), qx = -dy, qy = dx;
  const px = (u, v, col) => { x.fillStyle = col; x.fillRect(Math.floor(NOCK_C + dx * u + qx * v), Math.floor(NOCK_C + dy * u + qy * v), 1, 1); };
  const tail = -3.5 - pull, tip = 10.5 - pull * 0.8;   // puxada, a ponta ainda passa uns 5 px da mão
  for (let u = tail + 1; u <= tip - 1.5; u += 0.5) px(u, 0, wr[Math.floor(u - tail) % 3 ? 3 : 2]);   // a haste
  px(tail + 0.5, 1.1, fr[3]); px(tail + 0.5, -1.1, fr[3]); px(tail + 1.5, 1.1, fr[3]); px(tail + 1.5, -1.1, fr[3]); px(tail, 0, fr[4]);   // as penas
  px(tip - 1.5, 1.2, ar[3]); px(tip - 1.5, -1.2, ar[3]); px(tip - 1, 0, ar[4]); px(tip - 0.5, 0, ar[4]); px(tip, 0, ar[5]);           // a ponta
  return nockCv;
}
const bowPivot = id => ({ px: BOW_PL + 5, py: Math.floor(bowArt(id).height / 2) + 0.5 });
// a flecha na mão de trás: em pé, a ponta para cima, a mão perto das penas (pivô 2.5, 11 como os itens da mão de trás)
function heldArrow(arrow) {
  return cached('ha:' + arrow, () => {
    const P = ARROW_PAL[arrow], c = mk(5, 14), x = c.getContext('2d'), wr = heroRamp(P.w), ar = heroRamp(P.a), fr = heroRamp(P.f);
    for (let j = 2; j <= 11; j++) { x.fillStyle = wr[j % 3 ? 3 : 2]; x.fillRect(2, j, 1, 1); }
    x.fillStyle = ar[5]; x.fillRect(2, 0, 1, 1); x.fillStyle = ar[3]; x.fillRect(1, 1, 3, 1);
    x.fillStyle = fr[3]; x.fillRect(1, 11, 1, 2); x.fillRect(3, 11, 1, 2); x.fillStyle = fr[4]; x.fillRect(2, 12, 1, 1);
    return c;
  });
}

/* ---- disparo e voo ---- */
function shoulderW() { const f = pl.facing; return [pl.x + pl.w / 2 + f * 1.5, pl.y + pl.h - 11.5]; }
function fireArrow(pow) {
  const id = arrowNow(); if (!id) return;
  const q = pow == null ? 1 : pow;
  removeItem(id, 1);
  const f = pl.facing, a = bow.A, dx = Math.sin(a) * f, dy = -Math.cos(a), [sx, sy] = shoulderW();
  const sp = BOW_SPD * (ITEMS[equip.weapon.id].bowSpd || 1) * lerp(BOW_POW.spd[0], BOW_POW.spd[1], q);
  ARROWS.push({ x: sx + dx * 12, y: sy + dy * 12, ax: sx, ay: sy, vx: dx * sp + pl.vx * 0.3, vy: dy * sp, id, k: (ITEMS[id].arrowK || 1) * lerp(BOW_POW.dmg[0], BOW_POW.dmg[1], q), t: 0 });
  sfx.bow();
}
// a flecha cravada: perto do herói (com folga), sob o mouse (o E do js/348) e o pegar
function arrowNear(o) {
  const dx = Math.max(pl.x - o.x, 0, o.x - (pl.x + pl.w)), dy = Math.max(pl.y - o.y, 0, o.y - (pl.y + pl.h));
  return Math.hypot(dx, dy) <= ARROW_REACH;
}
function arrowSobMouse() {
  const [wx, wy] = mouseWorld();
  for (let i = ARROWS.length - 1; i >= 0; i--) {
    const o = ARROWS[i]; if (!o.stuck) continue;
    const sp = Math.hypot(o.vx, o.vy) || 1, ux = o.vx / sp, uy = o.vy / sp;
    for (let k = 0; k < 9; k++) if (Math.abs(o.x - ux * k - wx) <= 3 && Math.abs(o.y - uy * k - wy) <= 3) return o;
  }
  return null;
}
function arrowPegar(o) {
  if (!canFit(o.id)) { if (pl.fullMsg <= 0) { pl.fullMsg = 2.5; floatText(pl.x + pl.w / 2, pl.y - 10, 'Mochila cheia', '#ffb4a8', 0.8); } return false; }
  addItem(o.id, 1); pickupMsg(o.id, 1); invDirty = true;
  const i = ARROWS.indexOf(o); if (i >= 0) ARROWS.splice(i, 1);
  return true;
}
function arrowHit(o, e) {
  hitEnemy(e, Math.sign(o.vx) || pl.facing, o.k, false);
  burst(o.x, o.y, 5, '#8a6a44', 60, 200, 0.3, 1, true);
}
HOOK.update.push(dt => {
  for (let i = ARROWS.length - 1; i >= 0; i--) {
    const o = ARROWS[i]; o.t += dt;
    if (o.stuck) {
      if (o.t > ARROW_STUCK) { ARROWS.splice(i, 1); continue; }
      if (!solidAt(o.tx, o.ty)) { dropLoot(o.x, o.y, o.id, 1, true); ARROWS.splice(i, 1); continue; }   // o bloco sumiu: a flecha cai como drop
      // pega passando perto: a ponta fica dentro do bloco, então conta a distância até o herói com folga (teto, parede, chão)
      if (o.t > 0.4 && !pl.dead && arrowNear(o)) arrowPegar(o);
      continue;
    }
    o.vy += ARROW_G * dt;
    const x0 = o.ax != null ? o.ax : o.x, y0 = o.ay != null ? o.ay : o.y; o.ax = o.ay = null;
    o.x += o.vx * dt; o.y += o.vy * dt;
    const n = Math.max(1, Math.ceil(Math.hypot(o.x - x0, o.y - y0) / 2));
    let end = null;
    for (let s = 1; s <= n && !end; s++) {
      const qx = lerp(x0, o.x, s / n), qy = lerp(y0, o.y, s / n);
      // só o que a flecha toca: o retângulo do bicho, sem folga
      for (const e of enemies) if (!e.dead && qx >= e.x && qx <= e.x + e.w && qy >= e.y && qy <= e.y + e.h) { o.x = qx; o.y = qy; arrowHit(o, e); end = 'hit'; break; }
      if (end) break;
      const tx = Math.floor(qx / T), ty = Math.floor(qy / T);
      if (tileAt(tx, ty) === URN) { breakTile(tx, ty); end = 'hit'; break; }
      if (solidAt(tx, ty)) {
        // metade quebra na hora (lascas e um estalo); a outra metade fica cravada e sempre dá para pegar de volta
        if (Math.random() < 0.5) { burst(qx, qy, 6, '#8a6a44', 70, 260, 0.35, 1, true); noise(0.05, 0.08, 1800, 'highpass', 0, 0.5); end = 'hit'; break; }
        o.x = qx; o.y = qy; o.stuck = true; o.tx = tx; o.ty = ty; o.t = 0;
        burst(qx, qy, 3, '#8a7a62', 40, 200, 0.25, 1, true); sfx.tink && sfx.tink(); end = 'wall';
        const stuck = ARROWS.filter(a => a.stuck); if (stuck.length > ARROW_MAX_STUCK) ARROWS.splice(ARROWS.indexOf(stuck[0]), 1);
      }
    }
    if (end === 'hit' || (!end && o.t > ARROW_LIFE)) ARROWS.splice(i, 1);
  }
});
// 9 px na direção do voo: ponta, haste, penas (cravada, a ponta some dentro do bloco)
HOOK.drawWorld.push((cx, cy) => {
  for (const o of ARROWS) {
    const sp = Math.hypot(o.vx, o.vy) || 1, ux = o.vx / sp, uy = o.vy / sp, P = ARROW_PAL[o.id] || ARROW_PAL.flecha;
    const hx = Math.round(o.x - cx), hy = Math.round(o.y - cy);
    if (hx < -16 || hy < -16 || hx > lc.canvas.width + 16 || hy > lc.canvas.height + 16) continue;
    for (let k = o.stuck ? 3 : 0; k < 9; k++) {
      lc.fillStyle = k < 2 ? P.a : k > 6 ? P.f : P.w;
      lc.fillRect(Math.round(o.x - ux * k) - cx, Math.round(o.y - uy * k) - cy, 1, 1);
    }
  }
});

/* ---- o arco a cada quadro ---- */
function bowAim() {
  const [mx, my] = mouseWorld(), d = mx - (pl.x + pl.w / 2);
  if (Math.abs(d) > 2) pl.facing = d > 0 ? 1 : -1;
  const [sx, sy] = shoulderW();
  return clamp(Math.atan2((mx - sx) * pl.facing, sy - my), 0.15, 2.7);
}
function bowTick(dt, hand) {
  if (!bowOn()) { bow.st = 'empty'; bow.w = null; return; }
  if (bow.w !== equip.weapon.uid) { bow.w = equip.weapon.uid; bow.st = 'empty'; }   // arco novo na mão: encaixa a flecha de novo
  const gate = gameTime - bow.last >= (pl.atkPeriod || 0.68) - 0.01;
  if (bow.st === 'ready' && gate) bow.buf -= dt;   // um clique durante a recarga espera a flecha ficar pronta
  const k = clamp((pl.atkPeriod || 0.68) / 0.68, 0.45, 2.2), nk = quiverOn() ? ITEMS[equip.shield.id].nock || 1 : 1, can = bowCan();
  if (pl.dead) return;
  switch (bow.st) {
    case 'empty': bow.pull = 0; bow.buf = 0; if (can && hand) { bow.st = 'reload'; bow.t = 0; } break;
    case 'reload':
      if (!can) { bow.st = 'empty'; break; }
      if (hand) bow.t += dt * nk / k;
      if (bow.t >= BOW_T.reload) { bow.st = 'ready'; bow.t = 0; }
      break;
    case 'ready':
      if (!can) { bow.st = 'empty'; break; }
      if (hand && (mouse.l || bow.buf > 0) && pl.stunT <= 0 && !pl.climb && gate) { bow.st = 'draw'; bow.t = 0; bow.buf = 0; if (sfx.draw) sfx.draw(); }
      break;
    case 'draw':
      if (!hand || !can) { bow.st = can ? 'ready' : 'empty'; bow.pull = 0; break; }
      {
        const was = bow.pow || 0;
        bow.t += dt / k; bow.pow = smooth01(Math.min(1, bow.t / BOW_T.charge)); bow.pull = Math.max(1, Math.round(6 * bow.pow));
        if (was < 1 && bow.pow >= 1) { tone(880, 0.06, 'triangle', 0.03, 220); bow.full = gameTime; }   // carregado: um estalo baixinho
        // atira quando solta o botão (um clique rápido puxa só um pouco antes de soltar)
        if (!mouse.l && bow.t >= BOW_T.draw) { bow.A = bowAim(); fireArrow(bow.pow); bow.st = 'loose'; bow.t = 0; bow.pull = 0; bow.pow = 0; bow.last = gameTime; }
      }
      break;
    case 'loose':
      bow.t += dt / k;
      if (bow.t >= BOW_T.loose) { bow.st = bowCan() ? 'reload' : 'empty'; bow.t = 0; }
      break;
  }
  // a mira: sempre para o mouse (js/351-mira.js faz o mesmo com as outras armas)
  const aiming = hand && !pl.climb;   // com o arco na mão ele mira o mouse o tempo todo (na escada o arco desce)
  const tA = aiming ? bowAim() : 2.35;
  bow.A = lerp(bow.A, tA, Math.min(1, dt * (aiming ? 28 : 10)));
}
{
  const _updatePlayer = updatePlayer;
  updatePlayer = function (dt) {
    const hand = bowOn() && hb.sel === 0, q = quiverOn();
    if (!hand && !q) { if (!bowOn()) bow.st = 'empty'; return _updatePlayer(dt); }
    const ml = mouse.l, mlp = mouse.lPressed, mr = mouse.r, sl = keys.ShiftLeft, sr = keys.ShiftRight;
    if (hand) { if (mouse.lPressed) bow.buf = 0.2; mouse.l = false; mouse.lPressed = false; }   // o arco não golpeia
    if (q) { mouse.r = false; keys.ShiftLeft = keys.ShiftRight = false; }                       // a aljava não levanta guarda
    try { _updatePlayer(dt); } finally { mouse.l = ml; mouse.lPressed = mlp; mouse.r = mr; keys.ShiftLeft = sl; keys.ShiftRight = sr; }
    if (!pl.dead) bowTick(dt, hand);
  };
}

/* ---- a pose: a mão da frente segura o arco para a mira, a de trás puxa a corda ou vai até a aljava ---- */
const QUIVER_AT = { cx: OX + 3, cy: OY + 10 }, QUIVER_MOUTH = [OX + 1.5, OY + 5];
function quiverPose(P) {
  if (!P || !quiverOn()) return P;
  // subindo escada ou cipó a pose é de costas (js/88), que desenha o escudo como imagem: a aljava vai como imagem também
  if (P.climb) { P.shield = quiverBack(equip.shield.id); return P; }
  P.shield = { img: quiverBack(equip.shield.id), cx: QUIVER_AT.cx, cy: QUIVER_AT.cy, top: false };
  return P;
}
function backArmTo(P, tx, ty, top, item) {
  const vx = tx - (OX + 4.5), vy = ty - (OY + 10.5), len = clamp(Math.hypot(vx, vy), 2, 6.4);
  P.back = Object.assign({}, P.back, { ang: Math.atan2(vx, -vy), len, sl: Math.max(1, len - 1), top, item: item || null });
}
function bowPose(P) {
  const id = equip.weapon.id, A = bow.A, dx = Math.sin(A), dy = -Math.cos(A);
  const hx = OX + 7.5 + dx * 6, hy = OY + 10.5 + dy * 6;
  const nocked = bow.st === 'ready' || bow.st === 'draw', arrow = arrowNow() || 'flecha';
  const pv = bowPivot(id);
  const item = nocked ? { img: nockedBow(id, bow.pull, arrow, A), ang: 0, px: NOCK_C, py: NOCK_C } : { img: bowCanvas(id, bow.pull, null), ang: A - Math.PI / 2, px: pv.px, py: pv.py };
  P.front = Object.assign({}, P.front, { ang: A, len: 6, sl: 5, item });
  const at = d => [hx - dx * d, hy - dy * d];   // um ponto na linha da flecha, d px atrás da mão do arco
  const smooth = smooth01, r = bow.t / BOW_T.reload;
  if (bow.st === 'ready' || bow.st === 'draw') { const [x, y] = at(3.5 + bow.pull); backArmTo(P, x, y, true); }
  else if (bow.st === 'loose') { const [x, y] = at(9 + 2 * Math.min(1, bow.t / BOW_T.loose)); backArmTo(P, x, y, true); }
  else if (bow.st === 'reload') {
    const [nx, ny] = at(3.5), [qx, qy] = QUIVER_MOUTH, ha = heldArrow(arrow);
    if (r < 0.4) { const e = smooth(r / 0.4); backArmTo(P, lerp(nx, qx, e), lerp(ny, qy, e), e < 0.3); }
    else if (r < 0.52) { const e = (r - 0.4) / 0.12; backArmTo(P, qx, qy - e * 1.5, false, { img: ha, ang: -0.35 }); }   // tira a flecha da aljava
    else { const e = smooth((r - 0.52) / 0.48); backArmTo(P, lerp(qx, nx, e), lerp(qy - 1.5, ny, e), e > 0.4, { img: ha, ang: lerp(-0.35, A, e) }); }
  }
  return P;
}
{
  const _poseFor = poseFor;
  poseFor = function () { return quiverPose(_poseFor.apply(this, arguments)); };
  const _playerPose = playerPose;
  playerPose = function () {
    const P = quiverPose(_playerPose());
    if (bowOn() && hb.sel === 0 && P && P.front && !pl.dead) bowPose(P);
    return P;
  };
}

/* ---- regras: a aljava fica com o arco (e com qualquer arma), não é escudo para os talentos ---- */
{
  const _thr = twoHandRule;
  twoHandRule = function () { if (quiverOn()) return; return _thr(); };
  const _talCondOk = talCondOk;
  talCondOk = function (c, kind) { return c === 'shield' && quiverOn() ? false : _talCondOk(c, kind); };
}

/* ---- loja: o Grimaldo sempre tem flechas, um arco e uma aljava; prateleira própria ---- */
Object.assign(MAT_VAL, { flecha: 1, flecha_ferro: 2 });   // venda
SHELVES.splice(SHELVES.findIndex(s => s[0] === 'weapon') + 1, 0, ['archery', 'Arcos e flechas']);
{
  const _shelfOf = shelfOf;
  shelfOf = function (s) { const it = ITEMS[s.id]; return isBow(s.id) || isQuiver(s.id) || it.arrowK ? 'archery' : _shelfOf(s); };
  const fb = SHOPS.ferreiro.buys;
  SHOPS.ferreiro.buys = id => fb(id) || !!ITEMS[id].arrowK;
  SHOPS.ferreiro.hint = SHOPS.ferreiro.hint.replace(/\.$/, '') + ' e flechas.';
}
function archeryStock() {
  const st = stock.ferreiro; if (!st || st.some(e => e.archery)) return;
  const t = tierNow(), bows = t >= 3 ? ['arco_longo', 'arco_osso'] : t >= 2 ? ['arco_caca'] : ['arco_curto'];
  const b = rollItem(bows[Math.floor(Math.random() * bows.length)], t, 'shop'), q = rollItem(t >= 3 ? 'aljava_reforcada' : 'aljava_couro', t, 'shop');
  st.push({ s: b, price: itemValue(b), archery: true }, { s: q, price: itemValue(q), archery: true },
    { s: { id: 'flecha', n: 1 }, price: 2, inf: true, archery: true }, { s: { id: 'flecha_ferro', n: 1 }, price: 5, inf: true, archery: true });
}
{
  const _restock = restock;
  restock = function () { _restock(); archeryStock(); };
  const _openShop = openShop;
  openShop = function (n) { if (n && n.id === 'ferreiro' && stock.ferreiro && dayNow() === shopDay) archeryStock(); return _openShop(n); };
}

/* ---- Criar: as duas flechas, o Arco Curto e a Aljava de Couro ---- */
CRAFT_RECIPES.push(
  { id: 'flecha', n: 10, need: [['madeira', 1], ['pedra', 1]] },
  { id: 'flecha_ferro', n: 10, need: [['madeira', 1], ['barra_ferro', 1]] },
  { id: 'arco_curto', n: 1, need: [['madeira', 6], ['pele_rato', 2]] },
  { id: 'aljava_couro', n: 1, need: [['pele_rato', 4], ['madeira', 1]] }
);
{
  // equipamento sai como peça nova direto na mochila (a mão do Criar só carrega pilhas)
  const _craftOne = craftOne;
  craftOne = function (i, e) {
    const R = CRAFT_RECIPES[i]; if (!ITEMS[R.id].slot) return _craftOne(i, e);
    if (typeof cancelHeld === 'function') cancelHeld();
    handReturn();
    if (!craftCan(R) || inv.indexOf(null) < 0) { bad(e.currentTarget); return; }
    for (const [id, k] of R.need) reagTake(id, k);
    addInst(mkItem(R.id, 0));
    hideTip(); sfx.equip(); invDirty = true; refreshInv(); refreshCraft();
  };
}

/* ---- a casa do arco na barra mostra quantas flechas você tem ---- */
{
  const _paintHotbar = paintHotbar;
  paintHotbar = function () {
    _paintHotbar();
    const sl = document.querySelector('#hotbar .slot[data-hb="0"]'); if (!sl) return;
    let d = sl.querySelector('.n'); if (!d) { d = document.createElement('span'); d.className = 'n'; sl.appendChild(d); }
    const t = bowOn() ? String(arrowsAll()) : '';
    if (d.textContent !== t && (bowOn() || d.textContent === d._bow)) { d.textContent = t; d._bow = t; }
  };
}

/* ---- um mundo novo começa sem flechas no ar ---- */
{ const _nw = newWorld; newWorld = function () { ARROWS.length = 0; bow.st = 'empty'; bow.w = null; return _nw.apply(this, arguments); }; }
