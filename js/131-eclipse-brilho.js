'use strict';

/* ================= o brilho do Montante do Eclipse e do Conjunto do Eclipse em jogo (dados e efeitos: js/130 e js/132) =================
   - Elmo, peitoral e botas: as partes acesas de cada desenho (ECL_EMIT do 132) vão para a mesma camada por cima do
     escuro; o braço da frente, o que ele segura, o braço de trás nas duas mãos e o escudo erguido apagam essa luz.
     Um brilho pequeno no alto do elmo e no peito.
   - A cada quadro a lâmina na mão é repintada (a coroa corre pelas bordas, as estrelas piscam) e as partes acesas
     são desenhadas de novo por cima do escuro, no mesmo lugar da lâmina: o compose diz onde está a mão e o ângulo,
     o drawComposite diz onde o herói foi desenhado (já com o passo do golpe e o agachar).
   - Um brilho dourado no disco e violeta na lâmina; mais forte com a Penumbra ativa.
   - O rastro do golpe é dourado e violeta e fica por cima do escuro; poeira de estrela sobe da lâmina.
   - Os eclipses (eclFx do 130) são um disco negro com um anel de luz que se abre.
   Embrulha drawPlayer, compose, drawComposite e drawSmear. Carrega logo depois do 62 (o compose das duas mãos fica
   por dentro deste) e antes do 89 (o agachar passa o pé já deslocado para o drawComposite daqui). */

const eclDraw = { on: false, pend: null, pos: null, boost: 0, t: -1, mote: 0, glowK: 1 };
const eclMotes = [];   // star dust: single pixels over the dark (the game's glow parts pile up into a haze)
const ECL_GL = { disc: glow(12, '#ffc860'), blade: glow(14, '#7a5ae0'), burst: glow(30, '#ffc860'), small: glow(7, '#ffc860') };
const eclHeld = () => hb.sel === 0 && eqId('weapon') === ECL_ID && !pl.dead;
// any piece with lit parts (ITEMS[id].lit: the Eclipse, the Hora Parada of 133...) worn or held
const eclWearing = () => !pl.dead && (['head', 'body', 'feet'].some(k => equip[k] && ITEMS[equip[k].id].lit) || hb.sel === 0 && equip.weapon && ITEMS[equip.weapon.id].lit);
const ECL_SPOT_GL = {};
const eclSpotGlow = col => ECL_SPOT_GL[col] || (ECL_SPOT_GL[col] = glow(7, col));
const ECL_OV = mk(CW, CHT), ECL_OX = ECL_OV.getContext('2d'); ECL_OX.imageSmoothingEnabled = false;

{
  const _drawPlayer = drawPlayer;
  drawPlayer = function (cx, cy) {
    eclDraw.pos = null; eclDraw.pend = null;
    const sword = eclHeld();
    if (!sword && !eclWearing()) return _drawPlayer(cx, cy);
    const dt = eclDraw.t < 0 ? 0 : clamp(gameTime - eclDraw.t, 0, 0.1); eclDraw.t = gameTime;
    const want = pl.lg && (pl.lg.penumbra || pl.lg.eclSet >= 2) && eclInDark() ? 1 : 0;
    eclDraw.boost = approach(eclDraw.boost, want, dt * 3);
    const L = eclLightHere(); eclDraw.glowK = L == null ? 1 : clamp(1.15 - L, 0.12, 1);   // in daylight the glow only washes the colours out
    if (sword) eclTick(gameTime, eclDraw.boost);
    eclDraw.on = true; try { return _drawPlayer(cx, cy); } finally { eclDraw.on = false; }
  };
  const _compose = compose;
  compose = function (P) {
    const r = _compose(P);
    if (!eclDraw.on || !P || !P.body) return r;
    const o = ECL_OX, ox = P.ox || 0, oy = P.oy || 0, it = P.front && P.front.item, pend = { spots: [] };
    o.clearRect(0, 0, CW, CHT);
    const lay = (img, x, y, key) => {
      const em = img && ECL_EMIT.get(img); if (!em) return;
      o.drawImage(em, x, y); pend[key] = 1;
      for (const [u, v, col] of GEAR_SPOT.get(img) || []) pend.spots.push([x + u, y + v, col]);
    };
    lay(P.legs, OX, OY + 18, 'legs'); lay(P.body, OX + ox, OY + oy, 'chest'); if (P.head) lay(P.head.img, OX + ox, OY + oy + P.head.oy, 'helm');
    if (pend.legs || pend.chest || pend.helm) {
      // whatever is drawn over the armour hides its light: the near arm and what it holds, the far arm in a two-hand grip, a raised shield
      o.globalCompositeOperation = 'destination-out';
      const arm = (A, sx, sy) => { if (!A || !A.hero) return null; const a = heroArm(A.hero, A.dark, A.ang, A.len); o.drawImage(a.img, Math.round(sx - 0.5) - a.C, Math.round(sy - 0.5) - a.C); return [sx + a.hx, sy + a.hy]; };
      if (P.back && P.back.top) arm(P.back, OX + 4.5, OY + 10.5);
      const h = arm(P.front, OX + ox + 7.5, OY + oy + 10.5);
      if (h && it) rotDraw(o, it.img, h[0], h[1], it.px || 2.5, it.py || 11, it.ang);
      if (P.shield && P.shield.top) o.drawImage(P.shield.img, Math.round(P.shield.cx - P.shield.img.width / 2), Math.round(P.shield.cy - P.shield.img.height / 2));
      o.globalCompositeOperation = 'source-over';
    }
    const wem = it && (it.img === eclLive.cv ? eclLive.em : ECL_EMIT.get(it.img));
    if (wem && P.front.hero) {
      const F = P.front, a = heroArm(F.hero, F.dark, F.ang, F.len);
      const hx = OX + ox + 7.5 + a.hx, hy = OY + oy + 10.5 + a.hy, px = it.px || 2.5, py = it.py || 11;
      rotDraw(o, wem, hx, hy, px, py, it.ang);
      Object.assign(pend, { wep: 1, sword: it.img === eclLive.cv ? 1 : 0, wspots: GEAR_SPOT.get(it.img) || [], hx: Math.round(hx), hy: Math.round(hy), px, py, ang: it.ang });
    }
    if (pend.wep || pend.legs || pend.chest || pend.helm) eclDraw.pend = pend;
    return r;
  };
  const _drawComposite = drawComposite;
  drawComposite = function (feetX, feetY, facing, s = 1) {
    if (eclDraw.on && eclDraw.pend) { eclDraw.pos = Object.assign({ feetX, feetY, facing, s }, eclDraw.pend); eclDraw.pend = null; }
    return _drawComposite(feetX, feetY, facing, s);
  };
  // the white smear stays out (drawn here in gold, over the dark); the water of 171 still draws in drawSmear
  const _drawSmear = drawSmear;
  drawSmear = function (cx, cy) {
    if (!eclHeld()) return _drawSmear(cx, cy);
    const tr = pl.trail; pl.trail = []; try { _drawSmear(cx, cy); } finally { pl.trail = tr; }
  };
}

// a point of the hero's composite picture, on the low canvas (screen)
function eclComp(qx, qy) {
  const P = eclDraw.pos;
  return [P.facing < 0 ? P.feetX + (CW / 2 - qx) * P.s : P.feetX + (qx - CW / 2) * P.s, P.feetY + (qy - OY - 22) * P.s];
}
// a pixel (u, v) of the blade picture, on the screen
function eclPoint(u, v) {
  const P = eclDraw.pos, c = Math.cos(P.ang), sn = Math.sin(P.ang), du = u - P.px, dv = v - P.py;
  return eclComp(P.hx + du * c - dv * sn, P.hy + du * sn + dv * c);
}

HOOK.update.push(dt => {
  for (let k = eclMotes.length - 1; k >= 0; k--) { const m = eclMotes[k]; m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt; m.vy -= 6 * dt; if (m.t >= m.max) eclMotes.splice(k, 1); }
});

HOOK.drawGlow.push((cx, cy) => {
  const P = eclDraw.pos;
  if (P) {
    const b = eclDraw.boost, k = eclDraw.glowK, pulse = Math.sin(gameTime * 2.4) * 0.05;
    if (P.sword) {
      const [dx, dy] = eclPoint(3.5, 14.5), [bx, by] = eclPoint(3.5, 6);
      lc.globalAlpha = (0.3 + 0.2 * b + pulse) * k; lc.drawImage(ECL_GL.disc, Math.round(dx) - 12, Math.round(dy) - 12);
      lc.globalAlpha = (0.18 + 0.2 * b + pulse) * k; lc.drawImage(ECL_GL.blade, Math.round(bx) - 14, Math.round(by) - 14);
    }
    // the small glows each piece asks for (GEAR_SPOT): the eclipse on the helmet's crest and on the chest, the crystals...
    const spot = ([x, y], col) => { lc.globalAlpha = (0.26 + 0.15 * b + pulse) * k; lc.drawImage(eclSpotGlow(col), Math.round(x) - 7, Math.round(y) - 7); };
    for (const [qx, qy, col] of P.spots) spot(eclComp(qx, qy), col);
    if (P.wep) for (const [u, v, col] of P.wspots) spot(eclPoint(u, v), col);
  }
  for (const f of eclFx) {
    const k = f.t / 0.45, r = 6 + ECL.r * easeOut(k);
    lc.globalAlpha = (1 - k) * 0.7; lc.drawImage(ECL_GL.burst, Math.round(f.x - cx - r), Math.round(f.y - cy - r), Math.round(r * 2), Math.round(r * 2));
  }
});

HOOK.drawTop.push((cx, cy) => {
  // the eclipses, under the blade: a dark disc opening, rimmed with light
  for (const f of eclFx) {
    const k = f.t / 0.45, r = 4 + ECL.r * easeOut(k), x = f.x - cx, y = f.y - cy;
    lc.globalAlpha = (1 - k) * 0.3; lc.fillStyle = '#05030a';
    lc.beginPath(); lc.arc(x, y, r * 0.75, 0, Math.PI * 2); lc.fill();
    const m = Math.ceil(Math.PI * 2 * r);
    for (let i = 0; i < m; i++) {
      const a = i / m * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      lc.globalAlpha = 1 - k; lc.fillStyle = '#fff0c0'; lc.fillRect(Math.round(x + c * r), Math.round(y + s * r), 1, 1);
      lc.globalAlpha = (1 - k) * 0.7; lc.fillStyle = '#ffa840'; lc.fillRect(Math.round(x + c * (r - 1.5)), Math.round(y + s * (r - 1.5)), 1, 1);
    }
  }
  lc.globalAlpha = 1;
  const P = eclDraw.pos;
  if (P) {
    // the lit pixels of the blade and the armour, over the dark
    lc.globalAlpha = 0.85 + 0.15 * eclDraw.boost;
    if (P.facing < 0) { lc.save(); lc.translate(P.feetX, 0); lc.scale(-1, 1); lc.drawImage(ECL_OV, -CW / 2 * P.s, P.feetY - (OY + 22) * P.s, CW * P.s, CHT * P.s); lc.restore(); }
    else lc.drawImage(ECL_OV, P.feetX - CW / 2 * P.s, P.feetY - (OY + 22) * P.s, CW * P.s, CHT * P.s);
    lc.globalAlpha = 1;
    // star dust off the blade's edges: a little at rest, a stream while the blade falls
    const dt = clamp(gameTime - (eclDraw.mt || gameTime), 0, 0.1); eclDraw.mt = gameTime;
    eclDraw.mote += P.sword ? dt * (pl.gsPh === 'chop' ? 90 : 5 + 10 * eclDraw.boost) : 0;
    while (eclDraw.mote >= 1) {
      eclDraw.mote--;
      const v = Math.random() * 12, u = Math.random() < 0.5 ? (v < 4 ? 2 : 1) : (v < 4 ? 4 : 5), [sx, sy] = eclPoint(u, v);
      if (eclMotes.length < 80) eclMotes.push({ x: sx + cx, y: sy + cy, vx: rnd(-8, 8), vy: rnd(-16, -4), t: 0, max: rnd(0.4, 0.8), col: Math.random() < 0.6 ? '#ffd27a' : '#b8a8ff' });
    }
  }
  for (const m of eclMotes) { lc.globalAlpha = 1 - m.t / m.max; lc.fillStyle = m.col; lc.fillRect(Math.round(m.x) - cx, Math.round(m.y) - cy, 1, 1); }
  lc.globalAlpha = 1;
  // the smear of the blow, gold on the outside, violet inside
  if (eclHeld() && pl.trail.length >= 2) {
    const sx = Math.round(pl.x + pl.w / 2) - cx + pl.facing * 1.5, sy = Math.round(pl.y + pl.h) - cy - 11.5;
    const a0 = pl.trail[0], a1 = pl.trail[pl.trail.length - 1], n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.06)), k0 = (pl.reach || 28) / 28;
    for (let i = 0; i <= n; i++) {
      const a = lerp(a0, a1, i / n), fade = i / n;
      for (let r = Math.round(9 * k0); r <= Math.round(19 * k0); r++) {
        const out = r > 17 * k0, mid = r > 14 * k0;
        lc.globalAlpha = (out ? 0.8 : mid ? 0.55 : 0.3) * (0.3 + 0.7 * fade);
        lc.fillStyle = out ? '#fff0c0' : mid ? '#ffc860' : '#6a4aa8';
        lc.fillRect(Math.round(sx + pl.facing * Math.sin(a) * r), Math.round(sy - Math.cos(a) * r), 1, 1);
      }
    }
    lc.globalAlpha = 1;
  }
});
