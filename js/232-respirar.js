'use strict';

/* ================= o herói parado: respira, balança e pisca (2026-10-10) =================
   Antes, parado, o herói ficava congelado. Agora, quieto no chão por um instante:
   - Respira: a cada 3,2 s o tronco (cabeça, braços, escudo e o que estiver na mão) sobe 1 px e desce.
     As pernas ficam no chão: a calça aparece 1 px a mais embaixo da túnica enquanto ele puxa o ar.
   - Os braços balançam de leve com a respiração (a arma vai junto, sem girar na mão).
   - Pisca de vez em quando (a cada 2,5 a 6 s), em qualquer hora que esteja de lado, parado ou não.
   Não mexe em nada quando ele anda, pula, cai, agacha, escala, golpeia, minera, ergue o escudo ou usa item.
   Com o montante a guarda de duas mãos (62) fica como está e só o tronco respira; com o cajado (118) o pé do
   cajado fica no chão, então só o piscar vale. Embrulha playerPose, drawPlayer e drawComposite (o deslocamento só
   vale enquanto o herói é desenhado); carrega depois do 118-cajado-andar. */

const IDLE = { BREATH: 3.2, SETTLE: 0.3, SWAY_F: 0.05, SWAY_B: 0.06, BLINK: 0.12 };
const idleA = { still: 0, t: -1, ph: 0, lift: 0, blinkAt: 3, blink: 0, drawing: false };

// legs one row taller (the top trouser row repeated): drawn at the same place they reach 1 px lower,
// and the whole figure is then drawn 1 px higher, so the feet stay on the floor and the trunk rises
const idleLegsC = new WeakMap();
function idleLegs(img) {
  let c = idleLegsC.get(img);
  if (!c) { c = mk(img.width, img.height + 1); const x = c.getContext('2d'); x.drawImage(img, 0, 1); x.drawImage(img, 0, 0, img.width, 1, 0, 0, img.width, 1); idleLegsC.set(img, c); }
  return c;
}
// the same body with the eye closed: the eye white and the pupil take the skin of the row under them
const idleBlinkC = new WeakMap();
function idleBlinkBody(img) {
  let c = idleBlinkC.get(img);
  if (!c) {
    c = mk(img.width, img.height); const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    let ey = -1, ex = [];
    for (let j = 0; j < HERO_BODY.length && ey < 0; j++) for (let i = 0; i < HERO_BODY[j].length; i++) if (HERO_BODY[j][i] === 'W' || HERO_BODY[j][i] === 'e') { ey = j; ex.push(i); }
    for (const i of ex) x.drawImage(img, i, ey + 1, 1, 1, i, ey, 1, 1);
    idleBlinkC.set(img, c);
  }
  return c;
}
function idleBusy() {
  return !pl.onGround || pl.climb || pl.dead || Math.abs(pl.vx) > 6 || pl.atkT >= 0 || pl.mining || pl.shieldK > 0.05 || pl.useT > 0 || pl.stunT > 0
    || (typeof jump !== 'undefined' && jump.ph) || (typeof crouch !== 'undefined' && crouch.k > 0) || (typeof batSt !== 'undefined' && batSt.on);
}
{
  const _playerPose = playerPose;
  playerPose = function () {
    const P = _playerPose();
    const dt = idleA.t < 0 ? 0 : clamp(gameTime - idleA.t, 0, 0.1); idleA.t = gameTime;
    idleA.lift = 0;
    if (!P || P.climb) { idleA.still = 0; return P; }
    // blink, any time he is seen from the side
    idleA.blinkAt -= dt;
    if (idleA.blinkAt <= 0) { idleA.blink = IDLE.BLINK; idleA.blinkAt = 2.5 + Math.random() * 3.5; }
    if (idleA.blink > 0) { idleA.blink -= dt; if (P.body) P.body = idleBlinkBody(P.body); }
    if (idleBusy()) { idleA.still = 0; return P; }
    if (idleA.still < IDLE.SETTLE) { idleA.still += dt; idleA.ph = 0; return P; }
    idleA.ph = (idleA.ph + dt / IDLE.BREATH) % 1;
    const s = Math.sin(idleA.ph * Math.PI * 2);   // > 0 breathing in
    const staff = typeof staffInHand === 'function' && staffInHand(P), twoHand = typeof holdsTwoHand === 'function' && holdsTwoHand(P);
    if (staff) return P;
    if (s > 0.3 && P.legs) { idleA.lift = 1; P.legs = idleLegs(P.legs); }
    if (!twoHand) {
      if (P.front) {
        const d = s * IDLE.SWAY_F;
        P.front = Object.assign({}, P.front, { ang: P.front.ang + d });
        if (P.front.item) P.front.item = Object.assign({}, P.front.item, { ang: P.front.item.ang + d });
      }
      if (P.back && !P.shield) P.back = Object.assign({}, P.back, { ang: P.back.ang - Math.sin(idleA.ph * Math.PI * 2 + 0.6) * IDLE.SWAY_B });
    }
    return P;
  };
}
{
  const _drawComposite = drawComposite;
  drawComposite = function (feetX, feetY, facing, s) { return _drawComposite(feetX, feetY - (idleA.drawing ? idleA.lift : 0), facing, s); };
  const _drawPlayer = drawPlayer;
  drawPlayer = function (cx, cy) { idleA.drawing = true; try { return _drawPlayer(cx, cy); } finally { idleA.drawing = false; } };
}
