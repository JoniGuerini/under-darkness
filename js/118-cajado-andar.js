'use strict';

/* ================= o cajado como bengala de mago =================
   Antes o herói segurava o cajado pelo pé, como a espada, e o cajado ficava todo para cima.
   Agora, com o cajado na mão (selecionado ou com um feitiço selecionado):
   - Parado: segura o cajado pelo meio, um pouco à frente do corpo, com o pé do cajado apoiado no chão.
   - Andando: finca o cajado no chão e ele fica parado no mundo enquanto o herói avança; quando o pé do cajado
     fica para trás, o herói levanta e leva o cajado à frente num arco curto e finca de novo (com um toque surdo).
   - Lançando feitiço: ergue o cajado à frente, segurando pelo meio.
   - No ar: continua segurando pelo meio. Golpe de cajado (botão esquerdo com o cajado) usa o jeito de antes.
   A outra mão fica livre e balança com o passo. Escada (js/88) e agachar (js/89) continuam valendo: agachado,
   o chão sobe junto com o corpo. Embrulha playerPose; carrega depois do 89-agachar. */

const STAFF_CANE = {
  rest: { fx: 40, hx: 37.2, hy: 39.5 },   // parado: pé do cajado e mão, nas coordenadas da figura (ombro em 33.5, 36.5)
  ahead: 42, behind: 28.5,                // andando: onde o cajado é fincado e quando ele já ficou para trás
  swing: 0.24, lift: 3,                   // segundos para levar o cajado à frente e quanto ele sobe no arco
  cast: { hx: 39, hy: 34.5, ang: 0.38 }   // erguido para lançar
};
const cane = { planted: true, wx: 0, from: 40, t: 0, face: 1, k: 0 };

const staffInHand = P => !!(P && P.front && P.front.item && equip.weapon && ITEMS[equip.weapon.id] && ITEMS[equip.weapon.id].kind === 'staff' && look && look.weapon === P.front.item.img);
sfx.caneTap = function () { noise(0.05, 0.05, 520, 'bandpass', 0, 1.4); tone(150, 0.05, 'triangle', 0.02, -40); };

// posição do pé do cajado: fincado (parado no mundo) ou no arco de ir à frente
function caneFoot(dt, walking, ground) {
  const cxw = pl.x + pl.w / 2, toLocal = wx => 32 + (wx - cxw) * pl.facing, toWorld = lx => cxw + (lx - 32) * pl.facing;
  const S = STAFF_CANE;
  if (cane.face !== pl.facing) { cane.face = pl.facing; cane.planted = true; cane.wx = toWorld(S.rest.fx); }
  if (!walking) {
    // parado: o cajado vem devagar para o lugar de descanso
    cane.planted = true; let lx = toLocal(cane.wx); lx = Math.abs(lx - S.rest.fx) > 16 ? S.rest.fx : lerp(lx, S.rest.fx, Math.min(1, dt * 8)); cane.wx = toWorld(lx);
    return [lx, ground];
  }
  if (cane.planted) {
    const lx = toLocal(cane.wx);
    if (Math.abs(lx - S.rest.fx) > 24) { cane.wx = toWorld(S.ahead); return [S.ahead, ground]; }   // teleporte, portal: o cajado vem junto
    if (lx < S.behind || lx > S.ahead + 3) { cane.planted = false; cane.from = clamp(lx, S.behind - 2, S.ahead + 3); cane.t = 0; }
    else return [lx, ground];
  }
  cane.t += dt; const q = Math.min(1, cane.t / S.swing), e = q * q * (3 - 2 * q);
  const lx = lerp(cane.from, S.ahead, e), ly = ground - Math.sin(q * Math.PI) * S.lift;
  if (q >= 1) { cane.planted = true; cane.wx = toWorld(S.ahead); sfx.caneTap(); }
  return [lx, ly];
}
// braço que leva a mão ao ponto (hx, hy) e cajado que vai da mão até o pé (fx, fy), segurado no ponto certo
function caneHold(P, hx, hy, fx, fy) {
  const sx = OX + 7.5, sy = OY + 10.5, dx = hx - sx, dy = hy - sy, len = clamp(Math.hypot(dx, dy), 3, 7);
  const L = look.weapon.height, d = Math.hypot(fx - hx, fy - hy);
  P.front = Object.assign({}, P.front, { ang: Math.atan2(dx, -dy), len, sl: len - 1 });
  P.front.item = Object.assign({}, P.front.item, { ang: Math.atan2(-(fx - hx), fy - hy), py: clamp(L - 0.5 - d, 9, L - 4) });
}
function caneFreeArm(P, swing) {
  const L = look;
  P.back = { ang: -0.12 + swing, len: 6, sleeve: L.sleeveD, hand: PC.S, sl: 5, hero: L.arm, dark: 1 };
  P.shield = null;
}
{
  const _playerPose = playerPose;
  let last = -1;
  playerPose = function () {
    const P = _playerPose();
    const dt = last < 0 ? 0 : clamp(gameTime - last, 0, 0.1); last = gameTime;
    if (!staffInHand(P) || P.climb || pl.climb || pl.atkT >= 0 || pl.mining) { cane.planted = true; cane.wx = pl.x + pl.w / 2 + (STAFF_CANE.rest.fx - 32) * pl.facing; return P; }
    const ground = OY + 22 - (typeof crouch !== 'undefined' ? crouch.dy : 0), walkSwing = Math.sin(pl.walk * Math.PI / 2) * 0.35;
    const air = !pl.onGround || (typeof jump !== 'undefined' && jump.ph);
    if (pl.useT > 0) {
      // lançando: o cajado sobe à frente, inclinado para o alvo, seguro pelo meio
      const C = STAFF_CANE.cast, sx = OX + 7.5, sy = OY + 10.5, dx = C.hx - sx, dy = C.hy - sy, len = clamp(Math.hypot(dx, dy), 3, 7);
      P.front = Object.assign({}, P.front, { ang: Math.atan2(dx, -dy), len, sl: len - 1 });
      P.front.item = Object.assign({}, P.front.item, { ang: C.ang, py: look.weapon.height * 0.6 });
      caneFreeArm(P, -0.35);
      return P;
    }
    if (air) {
      // no ar ele não larga o cajado: só passa a segurar pelo meio
      P.front.item = Object.assign({}, P.front.item, { py: look.weapon.height * 0.6 });
      caneFreeArm(P, P.back ? P.back.ang + 0.12 : 0);
      return P;
    }
    const walking = Math.abs(pl.vx) > 6, [fx, fy] = caneFoot(dt, walking, ground), R = STAFF_CANE.rest;
    // a mão acompanha o pé do cajado, um pouco atrás dele, e sobe um tico quando o cajado está no ar
    const hx = clamp(OX + 7.5 + (fx - (OX + 7.5)) * 0.42 + 2, OX + 5, OX + 13), hy = R.hy - (ground - fy) * 0.4 + (walking ? 0 : Math.sin(gameTime * 2) * 0.3);
    caneHold(P, hx, hy, fx, fy);
    caneFreeArm(P, walking ? -walkSwing : 0);
    return P;
  };
}
