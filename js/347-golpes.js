'use strict';

/* ================= golpes: cada tipo de arma com a sua animação e 2 ou 3 variações (2026-10-12) =================
   Antes toda arma de uma mão fazia o mesmo arco (para baixo, depois para cima) e o montante um só golpe.
   Agora cada tipo tem uma lista de golpes (GOLPES) e os cliques seguidos encadeiam um combo: 1, 2, 3, 1...
   (parar de bater por um instante volta para o primeiro). O último de cada lista é o golpe forte.
     espada   - corte descendente · corte ascendente · estocada com avanço
     adaga    - talho rápido · facada baixa com passo · revés girando com pulinho
     machado  - machadada por cima · rasteira por baixo · talho subindo com pulinho
     maça     - pancada por cima · revés · moinho: a maça gira uma volta inteira e cai
     lança    - estocada na direção do mouse · varrida com a haste · recuo e estocada longa
     montante - golpe por cima · corte subindo pela frente · estocada com as duas mãos
     machado de duas mãos - golpe de lenhador · giro completo no ar · golpe subindo com salto
     maça de duas mãos    - pancada no chão (onda que acerta quem está no chão perto) · golpe lateral · salto esmagador (pula e cai com a marreta, com onda)
     cajado   - pancada por cima · cutucada
   Cada golpe é uma lista de poses-chave no tempo: [t, ângulo da arma, ângulo do braço, curva, extras].
   Ângulos como no resto do jogo: 0 = para cima, +pi/2 = para frente, pi = para baixo; passar de pi dá a volta por baixo.
   Curvas: l linear, i acelerando (golpes pesados), o freando, s suave. Extras: py (comprimento da lança),
   lean (-1 inclina para trás, 1 para frente) e sink (abaixa 1 px no impacto).
   `hit` é a janela em que a lâmina corta (a mesma checagem de bladeSweep do 11-jogador), `total` o tempo do golpe.
   Os tempos são do golpe na velocidade base (0,31 s uma mão, 0,54 s duas mãos) e o pl.atkSpd escala tudo,
   então a velocidade da arma continua mandando. Eventos: step (passo à frente), hop (pulinho), whoosh, shake,
   dust (poeira onde a ponta bate no chão), slam (pancada no chão da marreta).
   ATK_TM / GS_TM recebem a janela do golpe atual, então quem lê o tempo do golpe (chefes que aparam) segue certo.
   Carrega depois do 92-magia-regras (embrulha recalc, talCondOk e drawPlayer por fora do 62-montante-maos). */

const GOLPE_BASE = { one: { wind: ATK_TM.wind, swing: ATK_TM.swing, total: ATK_TM.total }, two: { wind: GS_TM.wind, swing: GS_TM.swing, total: GS_TM.total } };
const GOLPE_EASE = { l: k => k, i: k => k * k, o: k => 1 - (1 - k) * (1 - k), s: k => k * k * (3 - 2 * k) };
const TAU = Math.PI * 2;
const wrapAng = a => a - TAU * Math.round(a / TAU);

const GOLPES = {
  sword: [
    { n: 'corte descendente', hit: [0.06, 0.17], total: 0.31,
      keys: [[0.06, -1.95, -1.0, 's'], [0.17, 2.5, 1.6, 'o', { lean: 1 }], [0.23, 2.72, 1.75, 's'], [0.31, 2.2, 2.1, 's']],
      ev: [[0.05, 'step', 35], [0.06, 'whoosh']] },
    { n: 'corte ascendente', hit: [0.06, 0.17], total: 0.31,
      keys: [[0.06, 2.95, 1.75, 's', { sink: 1 }], [0.17, -1.75, -0.9, 'o'], [0.23, -1.95, -1.05, 's'], [0.31, -1.4, -0.6, 's']],
      ev: [[0.06, 'whoosh']] },
    { n: 'estocada', hit: [0.1, 0.2], total: 0.35, dmg: 1.2, noTrail: true,
      keys: [[0.09, 1.62, 2.8, 's', { lean: -1 }], [0.15, 1.55, 1.55, 'o', { lean: 1 }], [0.23, 1.55, 1.58, 'l', { lean: 1 }], [0.35, 1.2, 2.1, 's']],
      ev: [[0.1, 'step', 80], [0.1, 'whoosh']] }
  ],
  dagger: [
    { n: 'talho rápido', hit: [0.04, 0.13], total: 0.27,
      keys: [[0.04, -0.7, -0.5, 's'], [0.13, 2.4, 1.65, 'o'], [0.27, 1.9, 2.1, 's']],
      ev: [[0.04, 'whoosh']] },
    { n: 'facada baixa', hit: [0.07, 0.17], total: 0.3, noTrail: true,
      keys: [[0.06, 1.95, 2.95, 's', { lean: -1 }], [0.12, 1.92, 1.95, 'o', { lean: 1, sink: 1 }], [0.19, 1.92, 1.98, 'l', { lean: 1, sink: 1 }], [0.3, 1.6, 2.3, 's']],
      ev: [[0.07, 'step', 60], [0.07, 'whoosh']] },
    { n: 'revés girando', hit: [0.05, 0.18], total: 0.34, dmg: 1.15,
      keys: [[0.05, 3.0, 2.3, 's', { sink: 1 }], [0.18, -2.7, -0.6, 'o'], [0.34, -1.9, -0.2, 's']],
      ev: [[0.05, 'hop', 85], [0.05, 'whoosh']] }
  ],
  axe: [
    { n: 'machadada', hit: [0.1, 0.18], total: 0.33,
      keys: [[0.1, -2.35, -1.15, 's', { lean: -1 }], [0.18, 2.75, 1.7, 'i', { lean: 1 }], [0.24, 2.78, 1.75, 'l', { lean: 1, sink: 1 }], [0.33, 2.0, 2.3, 's']],
      ev: [[0.1, 'step', 30], [0.1, 'whoosh', 1], [0.18, 'shake', 1.3], [0.18, 'dust']] },
    { n: 'rasteira', hit: [0.1, 0.19], total: 0.32,
      keys: [[0.07, -2.25, -1.1, 's', { lean: -1 }], [0.19, -4.4, -4.5, 'o', { lean: 1, sink: 1 }], [0.32, -4.0, -4.15, 's']],
      ev: [[0.07, 'whoosh'], [0.09, 'step', 40]] },
    { n: 'talho subindo', hit: [0.07, 0.18], total: 0.35, dmg: 1.15,
      keys: [[0.06, 3.05, 2.5, 's', { sink: 1 }], [0.18, -0.8, 0.15, 'o', { lean: -1 }], [0.35, -0.3, 0.9, 's']],
      ev: [[0.07, 'hop', 105], [0.07, 'whoosh', 1]] }
  ],
  mace: [
    { n: 'pancada por cima', hit: [0.09, 0.17], total: 0.32,
      keys: [[0.09, -1.45, -0.2, 's', { lean: -1 }], [0.17, 2.9, 1.9, 'i', { lean: 1 }], [0.24, 2.92, 1.92, 'l', { sink: 1 }], [0.32, 2.2, 2.3, 's']],
      ev: [[0.09, 'whoosh', 1], [0.17, 'shake', 1.4], [0.17, 'dust']] },
    { n: 'revés', hit: [0.06, 0.16], total: 0.3,
      keys: [[0.06, 2.7, 1.7, 's', { sink: 1 }], [0.16, -1.25, -0.4, 'o', { lean: -1 }], [0.3, -0.7, 0.2, 's']],
      ev: [[0.06, 'whoosh'], [0.06, 'step', 25]] },
    { n: 'moinho', hit: [0.15, 0.24], total: 0.36, dmg: 1.25,
      keys: [[0.06, 3.1, 2.6, 's'], [0.15, 4.85, 4.6, 'l', { lean: -1 }], [0.24, 8.95, 8.1, 'i', { lean: 1 }], [0.29, 8.97, 8.12, 'l', { lean: 1, sink: 1 }], [0.36, 8.5, 8.6, 's']],
      ev: [[0.06, 'whoosh'], [0.15, 'whoosh', 1], [0.15, 'step', 45], [0.24, 'shake', 1.8], [0.24, 'dust']] }
  ],
  spear: [
    { n: 'estocada', hit: [0.06, 0.17], total: 0.31, noTrail: true,
      keys: [[0.06, 'aim', 'aim', 's', { py: 8 }], [0.17, 'aim', 'aim', 'o', { py: 17, lean: 1 }], [0.31, 'aim', 'aim', 's', { py: 12 }]],
      ev: [[0.05, 'step', 35], [0.06, 'whoosh']] },
    { n: 'varrida com a haste', hit: [0.07, 0.18], total: 0.32, py: 15,
      keys: [[0.07, -1.3, -0.8, 's', { py: 14, lean: -1 }], [0.18, 2.5, 1.65, 'o', { py: 15, lean: 1 }], [0.32, 2.1, 2.2, 's', { py: 12 }]],
      ev: [[0.07, 'whoosh', 1]] },
    { n: 'estocada longa', hit: [0.12, 0.23], total: 0.36, dmg: 1.2, noTrail: true,
      keys: [[0.11, 'aim', 'aim', 's', { py: 6, lean: -1 }], [0.19, 'aim', 'aim', 'o', { py: 20, lean: 1 }], [0.26, 'aim', 'aim', 'l', { py: 20, lean: 1 }], [0.36, 'aim', 'aim', 's', { py: 12 }]],
      ev: [[0.02, 'step', -45], [0.12, 'step', 110], [0.12, 'whoosh', 1]] }
  ],
  greatsword: [
    { n: 'golpe por cima', hit: [0.24, 0.315], total: 0.54,
      keys: [[0.187, -0.95, 1.05, 's', { lean: -1 }], [0.24, -1.25, 0.92, 's', { lean: -1 }], [0.315, 2.3, 1.7, 'i', { lean: 1 }], [0.385, 2.3, 1.7, 'l', { lean: 1, sink: 1 }], [0.54, 0.3, 2.0, 's']],
      ev: [[0.24, 'step', 55], [0.24, 'whoosh', 1], [0.315, 'shake', 1.6], [0.315, 'dust']] },
    { n: 'corte subindo', hit: [0.2, 0.3], total: 0.54,
      keys: [[0.19, 2.6, 2.75, 's', { lean: -1, sink: 1 }], [0.3, -0.55, 0.85, 'o', { lean: 1 }], [0.37, -0.65, 0.8, 'l'], [0.54, 0.3, 2.0, 's']],
      ev: [[0.2, 'step', 60], [0.2, 'whoosh', 1]] },
    { n: 'estocada com as duas mãos', hit: [0.23, 0.33], total: 0.56, dmg: 1.25, noTrail: true,
      keys: [[0.2, 1.62, 2.75, 's', { lean: -1, sink: 1 }], [0.29, 1.55, 1.5, 'o', { lean: 1 }], [0.38, 1.55, 1.5, 'l', { lean: 1 }], [0.56, 0.3, 2.0, 's']],
      ev: [[0.23, 'step', 130], [0.23, 'whoosh', 1]] }
  ],
  greataxe: [
    { n: 'golpe de lenhador', hit: [0.27, 0.34], total: 0.56,
      keys: [[0.21, -1.45, 0.88, 's', { lean: -1 }], [0.27, -1.7, 0.8, 's', { lean: -1 }], [0.34, 2.4, 1.85, 'i', { lean: 1 }], [0.43, 2.42, 1.88, 'l', { lean: 1, sink: 1 }], [0.56, 0.4, 2.0, 's']],
      ev: [[0.27, 'step', 40], [0.27, 'whoosh', 1], [0.34, 'shake', 2.3], [0.34, 'dust']] },
    { n: 'giro no ar', hit: [0.19, 0.33], total: 0.56,
      keys: [[0.18, -1.95, 1.25, 's', { lean: -1 }], [0.33, 3.55, 2.6, 'l', { lean: 1 }], [0.56, 6.68, 2.0, 's']],
      ev: [[0.17, 'hop', 150], [0.18, 'step', 50], [0.18, 'whoosh', 1], [0.26, 'whoosh', 1]] },
    { n: 'golpe subindo', hit: [0.21, 0.31], total: 0.58, dmg: 1.2,
      keys: [[0.2, 2.95, 2.55, 's', { sink: 1 }], [0.31, -0.55, 0.9, 'o', { lean: -1 }], [0.38, -0.65, 0.88, 'l'], [0.58, 0.35, 2.0, 's']],
      ev: [[0.21, 'hop', 125], [0.21, 'whoosh', 1], [0.21, 'step', 30]] }
  ],
  greatmace: [
    { n: 'pancada no chão', hit: [0.28, 0.35], total: 0.6,
      keys: [[0.22, -1.2, 0.95, 's', { lean: -1 }], [0.28, -1.45, 0.86, 's', { lean: -1 }], [0.35, 2.35, 1.95, 'i', { lean: 1 }], [0.47, 2.37, 1.97, 'l', { lean: 1, sink: 1 }], [0.6, 0.35, 2.0, 's']],
      ev: [[0.28, 'whoosh', 1], [0.35, 'slam']] },
    { n: 'golpe lateral', hit: [0.22, 0.34], total: 0.58,
      keys: [[0.21, -2.1, 1.1, 's', { lean: -1 }], [0.34, 2.15, 1.9, 'l', { lean: 1 }], [0.42, 2.25, 1.95, 'o', { lean: 1 }], [0.58, 0.35, 2.0, 's']],
      ev: [[0.21, 'step', 50], [0.21, 'whoosh', 1], [0.34, 'shake', 1.4]] },
    { n: 'salto esmagador', hit: [0.3, 0.37], total: 0.62, dmg: 1.3,
      keys: [[0.2, -1.3, 0.9, 's', { lean: -1 }], [0.3, -1.55, 0.84, 's', { lean: -1 }], [0.37, 2.35, 1.95, 'i', { lean: 1 }], [0.49, 2.37, 1.97, 'l', { lean: 1, sink: 1 }], [0.62, 0.35, 2.0, 's']],
      ev: [[0.22, 'hop', 210], [0.22, 'step', 45], [0.3, 'whoosh', 1], [0.37, 'slam']] }
  ],
  staff: [
    { n: 'pancada', hit: [0.22, 0.3], total: 0.52,
      keys: [[0.22, -1.1, 0.95, 's', { lean: -1 }], [0.3, 2.2, 1.7, 'i', { lean: 1 }], [0.37, 2.22, 1.72, 'l', { sink: 1 }], [0.52, 0.3, 2.0, 's']],
      ev: [[0.22, 'whoosh'], [0.3, 'shake', 1]] },
    { n: 'cutucada', hit: [0.18, 0.28], total: 0.5, noTrail: true,
      keys: [[0.16, 1.6, 2.7, 's', { lean: -1 }], [0.24, 1.55, 1.5, 'o', { lean: 1 }], [0.32, 1.55, 1.5, 'l'], [0.5, 0.3, 2.0, 's']],
      ev: [[0.18, 'step', 70], [0.18, 'whoosh']] }
  ]
};

function golpeSet() {
  const w = equip.weapon && ITEMS[equip.weapon.id], k = w ? w.kind || 'sword' : 'sword';
  return GOLPES[k] || (pl.twoHand ? GOLPES.greatsword : k === 'wand' ? GOLPES.sword.slice(0, 2) : GOLPES.sword);
}
// chamado no clique de ataque (11-jogador): escolhe o próximo golpe do combo e põe a janela dele em ATK_TM / GS_TM
function startGolpe(combo) {
  const set = golpeSet();
  // a chain: still swinging, or the next click comes soon after this weapon's period (slow weapons rest between blows)
  const chain = combo || gameTime - (pl.mvAt == null ? -99 : pl.mvAt) < (pl.atkPeriod || 0.5) + 0.3;
  pl.mvAt = gameTime;
  pl.mvI = chain && pl.move ? ((pl.mvI || 0) + 1) % set.length : 0;
  const M = set[pl.mvI], tm = pl.twoHand ? GS_TM : ATK_TM;
  tm.wind = M.hit[0]; tm.swing = M.hit[1] - M.hit[0]; tm.total = M.total;
  pl.move = M; pl.mvEv = 0; pl.atkType = pl.mvI % 2; pl.gsPh = null; pl.gsLean = 0; pl.gsSink = 0;
  if (pl.thrust) pl.spearPy = 12;
}
function golpeEvent(ev) {
  const [, type, v] = ev, f = pl.facing;
  if (type === 'step') { if (pl.onGround) pl.vx += f * v; }
  else if (type === 'hop') { if (pl.onGround) { pl.vy = Math.min(pl.vy, -v); pl.onGround = false; } }
  else if (type === 'whoosh') { if (v) { noise(0.2, 0.2, 1100, 'bandpass', 0, 0.7); tone(180, 0.16, 'triangle', 0.05, -90); } else sfx.swing(); }
  else if (type === 'shake') shake(v);
  else if (type === 'dust' || type === 'slam') {
    const [, , tx, ty] = bladeSeg(pl.fArm, pl.sAng, bladeLen()), floor = SOLID[tileAt(Math.floor(tx / T), Math.floor((ty + 3) / T))];
    if (floor) burst(tx, ty + 1, type === 'slam' ? 12 : 7, '#8a7a62', type === 'slam' ? 90 : 55, 260, 0.35);
    if (type !== 'slam') return;
    shake(2.8); sfx.slam && sfx.slam();
    if (!floor) return;
    // a onda: quem está no chão perto da cabeça da marreta leva 60% do golpe, mesmo fora da lâmina
    const fy = pl.y + pl.h;
    burst(tx - 8, ty + 1, 5, '#a8987c', 70, 300, 0.3); burst(tx + 8, ty + 1, 5, '#a8987c', 70, 300, 0.3);
    for (const e of enemies) {
      if (e.dead || pl.atkHit.has(e) || ET[e.type].fly) continue;
      const ex = e.x + e.w / 2;
      if (Math.abs(ex - tx) < 22 && Math.abs(e.y + e.h - fy) < 12 && clearPath(pl, e)) { pl.atkHit.add(e); hitEnemy(e, ex < pl.x + pl.w / 2 ? -1 : 1, 0.6, true); }
    }
  }
}
// a pose do golpe no tempo t (já escalado pelo atkSpd)
function golpePose(t) {
  const M = pl.move, K = M.keys, aim = isF => (pl.thrA || 1.52) + (isF ? 0.06 : 0);
  const val = (v, isF) => v === 'aim' ? aim(isF) : v;
  let i = 0; while (i < K.length && K[i][0] <= t) i++;
  let a, f, py, o;
  if (i >= K.length) {
    const k = K[K.length - 1]; o = k[4] || {};
    a = wrapAng(val(k[1])); f = wrapAng(val(k[2], 1)); py = o.py;
  } else {
    const k1 = K[i]; o = k1[4] || {};
    const a1 = val(k1[1]), f1 = val(k1[2], 1);
    let t0 = 0, a0, f0, p0;
    if (i) { const k0 = K[i - 1]; t0 = k0[0]; a0 = val(k0[1]); f0 = val(k0[2], 1); p0 = (k0[4] || {}).py; }
    else {
      // from wherever the weapon is now, the short way round to the first key
      a0 = pl.atkStart; a0 += TAU * Math.round((a1 - a0) / TAU);
      f0 = pl.atkF0 == null ? f1 : pl.atkF0; f0 += TAU * Math.round((f1 - f0) / TAU);
      p0 = pl.spearPy;
    }
    const e = GOLPE_EASE[k1[3] || 's'](clamp((t - t0) / Math.max(1e-4, k1[0] - t0), 0, 1));
    a = lerp(a0, a1, e); f = lerp(f0, f1, e);
    const p1 = o.py != null ? o.py : M.py;
    py = p1 == null ? null : lerp(p0 == null ? p1 : p0, p1, e);
  }
  pl.sAng = a; pl.fArm = f;
  if (pl.thrust) pl.spearPy = py != null ? py : M.py || 12;
  pl.gsLean = o.lean || 0; pl.gsSink = o.sink ? 1 : 0;
  const inHit = t >= M.hit[0] && t <= M.hit[1];
  pl.gsPh = inHit ? 'chop' : t < M.hit[0] ? 'raise' : 'recover';   // 131-eclipse-brilho olha o 'chop'
  while (pl.mvEv < M.ev.length && M.ev[pl.mvEv][0] <= t) golpeEvent(M.ev[pl.mvEv++]);
}

// a velocidade de ataque é medida com os tempos base, não com os do último golpe
{
  const _recalc = recalc;
  recalc = function () {
    const a = Object.assign({}, ATK_TM), g = Object.assign({}, GS_TM);
    Object.assign(ATK_TM, GOLPE_BASE.one); Object.assign(GS_TM, GOLPE_BASE.two);
    try { return _recalc.apply(this, arguments); } finally { if (pl.atkT >= 0) { Object.assign(ATK_TM, a); Object.assign(GS_TM, g); } }
  };
}
// os talentos "com machados" / "com maças" também valem para os de duas mãos
{
  const _talCondOk = talCondOk;
  talCondOk = function (c, kind) { return _talCondOk(c, kind) || (c === 'axe' && kind === 'greataxe') || (c === 'mace' && kind === 'greatmace'); };
}
// o corpo acompanha o golpe com uma mão também (o 62-montante-maos já faz isso com as duas)
{
  const _drawPlayer = drawPlayer;
  drawPlayer = function (cx, cy) {
    if (pl.twoHand || pl.atkT < 0 || !pl.move) return _drawPlayer(cx, cy);
    return _drawPlayer(cx - pl.facing * (pl.gsLean || 0), pl.gsSink ? cy - 1 : cy);
  };
}
