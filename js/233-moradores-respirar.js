'use strict';

/* ================= os moradores parados: respiram, balançam e piscam (2026-10-10) =================
   O mesmo do herói parado (232-respirar) para todos os moradores do vilarejo:
   - Respiram: o tronco (cabeça, braços e o que seguram) sobe 1 px e desce; os pés ficam no chão.
     Cada um no seu ritmo (3 a 3,8 s) e fora de compasso com os outros, para não respirarem juntos.
   - O braço de trás balança de leve com a respiração (o da frente já balançava no 17-vilarejo).
   - Piscam de vez em quando, cada um na sua hora (os que têm rosto pintado no 117-moradores).
   O ferreiro malhando na bigorna continua malhando: só respira e pisca. Quem apoia um cajado comprido no chão
   (o ancião, a maga) não sobe, para o cajado não sair do chão. No retrato da conversa nada muda.
   Embrulha npcPose, drawNpcs e drawComposite (o deslocamento só vale enquanto os moradores são desenhados);
   carrega depois do 232-respirar. */

const npcIdle = { drawing: false, lift: 0, st: new Map() };

// the same body with the eyes shut: each eye pixel takes the colour of the pixel under it
const npcBlinkC = new WeakMap();
function npcBlinkBody(img, rows) {
  let c = npcBlinkC.get(img);
  if (!c) {
    c = mk(img.width, img.height); const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) if (rows[j][i] === 'e') {
      const below = rows[j + 1] && rows[j + 1][i] !== '.' ? [i, j + 1] : [i - 1, j];
      x.clearRect(i, j, 1, 1); x.drawImage(img, below[0], below[1], 1, 1, i, j, 1, 1);
    }
    npcBlinkC.set(img, c);
  }
  return c;
}
function npcIdleState(n) {
  let s = npcIdle.st.get(n);
  if (!s) { const r = hash2(n.id.length * 13, n.x * 7 | 0, 5); s = { period: 3 + r * 0.8, ph: r, blinkAt: 1 + r * 4, blink: 0, t: -1 }; npcIdle.st.set(n, s); }
  return s;
}
{
  const _npcPose = npcPose;
  npcPose = function (n) {
    const P = _npcPose(n); if (!npcIdle.drawing || !P) return P;
    const s = npcIdleState(n), dt = s.t < 0 ? 0 : clamp(gameTime - s.t, 0, 0.1); s.t = gameTime;
    s.ph = (s.ph + dt / s.period) % 1;
    const w = Math.sin(s.ph * Math.PI * 2);
    npcIdle.lift = 0;
    // a long staff resting on the floor (the elder, the mage) would lift off it: those only sway and blink
    const staff = P.front && P.front.item && P.front.item.img && P.front.item.img.height >= 14;
    if (w > 0.3 && P.legs && !staff) { npcIdle.lift = 1; P.legs = idleLegs(P.legs); }
    if (P.back) P.back = Object.assign({}, P.back, { ang: P.back.ang - Math.sin(s.ph * Math.PI * 2 + 0.6) * IDLE.SWAY_B });
    s.blinkAt -= dt;
    if (s.blinkAt <= 0) { s.blink = IDLE.BLINK; s.blinkAt = 2.5 + Math.random() * 4; }
    const art = n.look && n.look.art;
    if (s.blink > 0) { s.blink -= dt; if (art && P.body) P.body = npcBlinkBody(P.body, art.body); }
    return P;
  };
  const _drawNpcs = drawNpcs;
  drawNpcs = function (cx, cy) { npcIdle.drawing = true; try { return _drawNpcs(cx, cy); } finally { npcIdle.drawing = false; npcIdle.lift = 0; } };
  const _drawComposite = drawComposite;
  drawComposite = function (feetX, feetY, facing, sc) { return _drawComposite(feetX, feetY - (npcIdle.drawing ? npcIdle.lift : 0), facing, sc); };
}
