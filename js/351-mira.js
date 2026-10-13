'use strict';

/* ================= a arma mira no mouse =================
   Com a arma na mão (espaço 1 do cinto), o herói fica sempre virado para o lado do mouse e aponta a arma para ele:
   parado, andando ou no ar. O arco faz o mesmo (bowTick, js/350). Os golpes do combo (js/347) saem girados para o
   mouse: para cima até ~57°, para baixo só o quanto a arma não enterra no chão (as armas longas quase nada), e a
   pancada no chão da marreta sai sempre reta. O cajado continua como bengala (js/118); escudo levantado, escada e
   atordoamento continuam mandando nos braços.
   Carrega depois do 350-arco (embrulha updatePlayer, startGolpe, golpePose e jumpArmsFree; mexe no GS_REST do 62). */

const MIRA = { up: -1.0, down: 0.55, foot: 11, arm: 6 };
const MIRA_GS = Object.assign({}, GS_REST);   // a guarda de antes, para quando a mira está desligada

function miraOn() {
  if (hb.sel !== 0 || !equip.weapon || pl.dead || pl.climb || pl.stunT > 0 || pl.shieldK > 0.3) return false;
  const it = ITEMS[equip.weapon.id]; return !!it && it.kind !== 'staff';
}
// do ombro até o mouse: 0 = para cima, π/2 = para frente, π = para baixo (com o herói virado para o mouse)
function miraAng() {
  const [mx, my] = mouseWorld(), sx = pl.x + pl.w / 2 + pl.facing * 1.5, sy = pl.y + pl.h - 11.5;
  return Math.atan2((mx - sx) * pl.facing, sy - my);
}
// o quanto a arma aponta para baixo sem a ponta passar do pé (braço de 6 px + a arma)
function miraMax(len) { return Math.min(2.75, Math.acos(clamp(-MIRA.foot / (MIRA.arm + len), -1, 1))); }
function miraFace() { const [mx] = mouseWorld(), d = mx - (pl.x + pl.w / 2); if (Math.abs(d) > 2) pl.facing = d > 0 ? 1 : -1; }
// braço e arma na linha do mouse; com duas mãos o braço fica um pouco abaixo, segurando o cabo
function miraPose(a) {
  const arm = s => pl.twoHand ? clamp(s + 0.35, 0.5, 2.6) : clamp(s + 0.15, 0.2, 2.8), feet = pl.y + pl.h - 1, len = bladeLen();
  let s = clamp(a, 0.1, 2.75);
  while (s > 1.2 && bladeSeg(arm(s), s, len)[3] > feet) s -= 0.05;   // a ponta para um pixel acima do pé
  return { f: arm(s), s };
}

{
  const _updatePlayer = updatePlayer;
  updatePlayer = function (dt) {
    const f0 = pl.fArm, s0 = pl.sAng;
    _updatePlayer(dt);
    if (!miraOn()) { Object.assign(GS_REST, MIRA_GS); return; }
    if (pl.atkT >= 0 || pl.mining || isBow(equip.weapon.id)) return;   // golpe em curso fica para o lado onde começou; o arco mira sozinho
    miraFace();
    if (pl.useT > 0) return;
    const P = miraPose(miraAng()), k = Math.min(1, dt * 16);
    const bob = pl.onGround && Math.abs(pl.vx) > 6 ? Math.sin(pl.walk * Math.PI / 2) * 0.06 : 0;
    pl.fArm = lerp(f0, P.f + bob, k); pl.sAng = lerp(s0, P.s + bob, k);
    GS_REST.f = P.f; GS_REST.s = P.s;   // a guarda do 62 (duas mãos, no chão) vai para a mira
  };
}
// no pulo os braços não balançam enquanto miram
{
  const _free = jumpArmsFree;
  jumpArmsFree = function () { return _free() && !miraOn(); };
}

/* ---- o golpe sai girado para o mouse ---- */
{
  const _startGolpe = startGolpe;
  startGolpe = function (combo) {
    _startGolpe(combo);
    pl.mvOff = 0;
    const M = pl.move; if (!M || hb.sel !== 0 || !miraOn()) return;
    if (M.ev.some(e => e[1] === 'slam')) return;   // bate no chão: sempre reto
    let top = -Infinity; for (const k of M.keys) if (typeof k[1] === 'number') top = Math.max(top, k[1]);
    const down = Math.max(0, Math.min(MIRA.down, miraMax(bladeLen()) - top));   // para baixo só sem enterrar a arma
    pl.mvOff = clamp(miraAng() - Math.PI / 2, MIRA.up, down);
  };
  const _golpePose = golpePose;
  golpePose = function (t) {
    const off = pl.mvOff || 0; if (!off) return _golpePose(t);
    // o golpe é feito para frente e o giro entra por cima: na preparação ele entra pela metade e cresce até o golpe,
    // para o recuo não ir parar atrás das costas. A arma parte de onde está e a estocada (que já mira sozinha) não gira duas vezes
    const w = t < pl.move.hit[0] ? lerp(0.5, 1, t / pl.move.hit[0]) : 1;
    const thr = pl.thrA, st = pl.atkStart, f0 = pl.atkF0;
    pl.thrA = (thr || 1.52) - off * w; pl.atkStart = st - off * 0.5; if (f0 != null) pl.atkF0 = f0 - off * 0.5;
    try { _golpePose(t); } finally { pl.thrA = thr; pl.atkStart = st; pl.atkF0 = f0; }
    pl.sAng += off * w; pl.fArm += off * w;
  };
}
