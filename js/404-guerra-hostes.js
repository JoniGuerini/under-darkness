'use strict';

/* ================= O Campo da Última Guerra: as hostes =================
   Os outros cinco bichos da camada (docs/camadas/17-campo-guerra.md, seção 6):
   - o Serafim Quebrado (gu_serafim) voa: um anjo de mármore rachado, uma asa inteira e a outra em toco. Fica longe, no
     alto; a auréola acende, a linha de mira aparece por 0,7 s (segue o herói e trava nos últimos 0,2 s) e ele joga a
     lança de luz;
   - a Revoada de Corvos (gu_corvos) nasce em bando de 4 (o primeiro chama os outros): voam em roda por cima do herói e
     mergulham um de cada vez; o que vai mergulhar para no ar e abre as asas por 0,4 s;
   - o Demônio de Cerco (gu_cerco), 14 x 28, pesado, de chifres e marreta: ergue a marreta por 1 s, as rachaduras marcam
     o chão na frente dele e vem a onda de choque correndo pelo chão (pula-se por cima);
   - o Clérigo do Juízo (gu_clerigo) fica atrás dos outros: dá um escudo dourado a um aliado (60% menos dano por 4 s; o
     brilho mostra quem); de perto, o círculo de consagração cresce no chão em volta dele por 0,8 s e explode;
   - a Lâmina Errante (gu_lamina) é uma espada fincada que ainda luta sozinha: treme e brilha por 0,6 s, voa reto, crava
     na parede e fica 2 s presa (a hora de bater; voando, o golpe só a desvia).
   As faíscas, as marcas, as lanças e as ondas são do GUE (403). Prefixo gu. */

Object.assign(ET, {
  gu_serafim: { name: 'Serafim Quebrado', w: 10, h: 16, hp: 70, dmg: 22, xp: 28, kb: 0.8, fly: true, blood: '#e8dcc0' },
  gu_corvos: { name: 'Revoada de Corvos', w: 7, h: 6, hp: 18, dmg: 12, xp: 8, kb: 1.4, fly: true, blood: '#1a1418' },
  gu_cerco: { name: 'Demônio de Cerco', w: 14, h: 28, hp: 210, dmg: 34, xp: 44, kb: 0.15, fly: false, blood: '#4a1410' },
  gu_clerigo: { name: 'Clérigo do Juízo', w: 10, h: 22, hp: 70, dmg: 22, xp: 26, kb: 0.8, fly: false, blood: '#4a3a30', climbs: true },
  gu_lamina: { name: 'Lâmina Errante', w: 6, h: 14, hp: 50, dmg: 24, xp: 20, kb: 0, fly: true, blood: '#c8d0d8' }
});
const GU_TYPES_B = ['gu_serafim', 'gu_corvos', 'gu_cerco', 'gu_clerigo', 'gu_lamina'];
const GU_DROPS_B = {
  gu_serafim: [['pena_anjo', 0.5, 1, 2], ['min_belicita', 0.05], ['pocao', 0.07], ['espada_anjo', 0.012]],
  gu_corvos: [['pena_anjo', 0.04]],
  gu_cerco: [['chifre_demonio', 0.55, 1, 2], ['min_belicita', 0.15, 1, 2], ['medalha_guerra', 0.05], ['pocao', 0.1], ['elmo_chifres_caido', 0.014], ['escudo_muralha', 0.006]],
  gu_clerigo: [['pena_anjo', 0.25], ['medalha_guerra', 0.06], ['pocao', 0.12], ['espada_anjo', 0.006]],
  gu_lamina: [['min_belicita', 0.25, 1, 2], ['pocao', 0.04], ['espada_anjo', 0.01]]
};
function guTablesB() { for (const k of GU_TYPES_B) DROPS[k] = GU_DROPS_B[k].filter(([id]) => ITEMS[id]); }
guTablesB();
Object.assign(NAV_WALKERS, { gu_cerco: 1, gu_clerigo: 1 });
Object.assign(CV_STEP, { gu_cerco: 1, gu_clerigo: 1 });
const GU_MIRA = 0.7, GU_ASAS = 0.4, GU_MARRETA = 1, GU_CONSAGRA = 0.8, GU_TREME = 0.6, GU_PRESA = 2, GU_ESCUDO_T = 4;

/* ================= a arte ================= */
const GUH = {};
{
const { kit, man, set, painter, tube, lin, bez, poly, seams, grime, RP, espada, cp, guBlit } = GUART;
const { lazy } = GUW;
/* ---------- o Serafim Quebrado: o boneco de mármore em túnica, a asa inteira e o toco; a auréola por cima é ao vivo ---------- */
const SER_BODY = [
  "....ssss....", "...ssssss...", "..sssssss...", "..ssssssW...", "..sssssss...", "..sssssss...", "...sssss....", "....sss.....",
  "..tttttttt..", "..ttttttttt.", ".tttttbtttt.", ".tttttttttt.", "..ttttttttt.", "..bbbbbbkb..", "..tttttttt..", "..ttttttttt.",
  ".tttttttttt.", ".tttttttttt."];
const SER = lazy('ser', () => {
  const k = kit(SER_BODY, { s: '#c8bea4', W: '#fff4c0', t: '#e4dcc6', b: '#a07820', k: '#f0d070', p: '#d8cfb6', f: '#b8ae94', a: '#c8bea4' }, 41001, { t: undefined }), S = {};
  const wings = up => (P, bx, by) => {
    // a asa inteira atrás (aberta, em leque) e o toco quebrado da outra
    const sh = [bx + 4, by + 10], tip = up ? [bx - 9, by - 1] : [bx - 8, by + 5];
    for (let j = 0; j < 5; j++) tube(P, lin(sh[0], sh[1] + j * 0.5, tip[0] + j * 1.2, tip[1] + j * 3 + 2), t => 2.4 - t * 1.6, RP.pena, 41010 + j, 3.4 - j * 0.3);
    tube(P, lin(bx + 8, by + 10, bx + 11, by + 6), t => 2 - t * 0.8, RP.pena, 41020, 2.6);
    P.put(bx + 11, by + 6, RP.marmore, 1);
  };
  for (const f of [0, 1]) S['f' + f] = set(man(k, { legs: 'jump', bob: f, behind: wings(f), far: [[1.4, 3], [2.2, 5.6]], near: [[2, 2.6], [3, 5]] }));
  S.aim = set(man(k, { legs: 'jump', behind: wings(1), far: [[1.4, 3], [2.2, 5.6]], near: [[-1, -2], [-3, -4.4]], nearItem: (P, h) => { for (let t = -2; t < 10; t += 0.5) P.N(h[0] + t * 0.9, h[1] + t * 0.12, t < 0 ? '#f0d070' : '#fff4c0'); } }));
  S.throw = set(man(k, { legs: 'jump', behind: wings(0), far: [[1.4, 3], [2.2, 5.6]], near: [[3.4, 0.4], [6.6, 0.6]] }));
  return S;
});
/* ---------- os corvos: 11 x 8, as asas em 3 poses e o mergulho ---------- */
const COR = lazy('cor', () => {
  const S = [], R = RP.penaN;
  const crow = k => {   // 0 asas em cima, 1 asas embaixo, 2 abertas (parado no ar), 3 mergulhando (asas fechadas, bico na frente)
    const P = cp(13, 10), s = 41100 + k;
    if (k === 3) { P.blob(5.5, 5, 4.6, 1.8, R, s, 3); P.put(10, 5, RP.osso, 3.4); P.put(11, 5, RP.osso, 2.4); P.line(0, 4, 3, 5, R, 2.4); P.line(3, 3, 8, 3.6, R, 4); P.put(8, 4, RP.ouro, 5); return set(P); }
    P.blob(6, 5.4, 3.4, 2, R, s, 3);   // o corpo
    P.blob(9.2, 4.2, 1.6, 1.4, R, s + 1, 3.4); P.put(11, 4.4, RP.osso, 3.4); P.put(9.6, 3.8, RP.ouro, 5);   // a cabeça, o bico, o olho
    P.line(1, 5, 3.4, 5.6, R, 2.2); P.put(0, 5, R, 1.6);   // a cauda
    if (k === 0) { P.line(5, 4, 2, 0, R, 4.2); P.line(6.6, 4, 5.4, 0.6, R, 3.4); }
    else if (k === 1) { P.line(5, 6, 2.4, 9, R, 3.2); P.line(6.6, 6, 6, 9.4, R, 2.6); }
    else { P.line(5.4, 4.6, 0.4, 2.4, R, 4.2); P.line(6.4, 4.6, 11.6, 1.4, R, 3.6); for (const x of [1, 3]) P.put(x, 3, R, 1.4); }
    return set(P);
  };
  for (let k = 0; k < 4; k++) S.push(crow(k));
  return S;
});
/* ---------- o Demônio de Cerco: 44 x 40, o pé no centro em x 20; pele de brasa apagada, chifres de bode, a marreta ---------- */
const CER = lazy('cer', () => {
  const S = {}, PE = RP.pele, CH = RP.chifre, FE = RP.ferro, MD = RP.madeira;
  const body = (k, pose) => {   // pose: 'walk' (k: passo), 'raise' (a marreta lá em cima), 'slam' (a marreta no chão)
    const P = cp(44, 40), s = 41200 + k * 7 + (pose === 'raise' ? 50 : pose === 'slam' ? 90 : 0), fy = 39, cx = 20;
    const st = pose === 'walk' ? [Math.sin(k * Math.PI / 2) * 2.4, -Math.sin(k * Math.PI / 2) * 2.4] : pose === 'slam' ? [3, -3] : [-1.4, 1.4];
    const leg = (hx, ox, near) => { const fx = cx + ox; P.leg(hx, fy - 13, fx + 2, fy - 7, fx, fy - 1, PE, near ? 3 : 1.8); P.line(hx + 1, fy - 13, fx + 3, fy - 7, PE, near ? 3.6 : 2.2); P.blob(fx + 1, fy - 0.8, 2.6, 1.2, CH, s + hx, near ? 2.4 : 1.4); };
    leg(cx - 2, st[1] - 2, false);
    // o braço de trás e a marreta (atrás do corpo quando erguida)
    const hand = pose === 'raise' ? [cx - 2, fy - 34] : pose === 'slam' ? [cx + 12, fy - 10] : [cx + 8, fy - 14];
    const head = pose === 'raise' ? [cx - 8, fy - 38] : pose === 'slam' ? [cx + 22, fy - 3] : [cx + 14, fy - 4];
    const hammer = () => { P.line(hand[0], hand[1], head[0], head[1], MD, 3.4); const a = Math.atan2(head[1] - hand[1], head[0] - hand[0]), c = Math.cos(a), sn = Math.sin(a); for (let u = -3; u <= 3; u++) for (let w = -2.4; w <= 2.4; w += 0.5) P.put(head[0] + c * w - sn * u, head[1] + sn * w + c * u, FE, 3.4 - u * 0.3 - w * 0.2 + (Math.abs(u) === 3 ? 0.8 : 0)); };
    if (pose === 'raise') hammer();
    // o tronco curvado: peito largo, a barriga, as costas com placas de ferro velhas
    P.blob(cx, fy - 19, 7.4, 8.6, PE, s + 1, 3);
    P.blob(cx - 3, fy - 24, 6, 5, FE, s + 2, 2.6); for (let x = cx - 8; x < cx + 2; x += 3) P.put(x, fy - 27, FE, 5);
    P.blob(cx + 2, fy - 14, 5, 4, PE, s + 3, 2.4);
    for (let y = fy - 26; y < fy - 12; y += 3) P.put(cx + 5, y, PE, 1);   // as costelas marcadas
    // a cabeça baixa na frente, os chifres de bode, a boca de presas
    P.blob(cx + 6, fy - 27, 3.6, 3.2, PE, s + 4, 3.2);
    tube(P, bez([cx + 5, fy - 30], [cx + 1, fy - 35], [cx - 5, fy - 33], [cx - 4, fy - 28]), t => 2.6 - t * 1.8, CH, s + 5, 3.2);
    tube(P, bez([cx + 7, fy - 30], [cx + 9, fy - 36], [cx + 13, fy - 34], [cx + 12, fy - 30]), t => 2.2 - t * 1.6, CH, s + 6, 2.6);
    P.put(cx + 9, fy - 25, RP.osso, 5); P.put(cx + 9, fy - 24, RP.osso, 4); P.put(cx + 7, fy - 24, RP.osso, 4.4);
    P.put(cx + 7.6, fy - 28, RP.escoria, 0.2); P.put(cx + 8.6, fy - 28, RP.escoria, 0.2);   // as órbitas (o EYES_E acende)
    leg(cx + 3, st[0] + 2, true);
    // o braço da frente segurando a marreta
    const sh = [cx + 4, fy - 24];
    P.line(sh[0], sh[1], (sh[0] + hand[0]) / 2 + 1, (sh[1] + hand[1]) / 2 + 2, PE, 3.4); P.line((sh[0] + hand[0]) / 2 + 1, (sh[1] + hand[1]) / 2 + 2, hand[0], hand[1], PE, 3);
    P.blob(sh[0], sh[1], 2.6, 2.4, FE, s + 7, 3.4);
    if (pose !== 'raise') hammer();
    P.blob(hand[0], hand[1], 1.8, 1.6, PE, s + 8, 3.6);
    return set(P);
  };
  for (let k = 0; k < 4; k++) S['w' + k] = body(k, 'walk');
  S.raise = body(0, 'raise'); S.slam = body(0, 'slam');
  return S;
});
/* ---------- o Clérigo do Juízo: a mitra, a túnica, o cajado com o sol de ouro ---------- */
const CLE_BODY = [
  ".....mm.....", "....mmmm....", "...mmMmmm...", "...mmmmmm...", "..hhhhhvvh..", "..hhhhhhhh..", "...hhhhhh...", "....gggg....",
  "..tttttttt..", "..tttoottt..", ".ttttooTttt.", ".tttttoottt.", "..ttttotttt.", "..bbbbbbkb..", "..tttttttt..", "..ttttttttt.",
  ".tttttttttt.", ".tTttttttttt"];
const CLE = lazy('cle', () => {
  const k = kit(CLE_BODY, { m: '#e4dcc6', M: '#d0a838', h: '#3a3640', v: '#0a0608', g: '#5a5040', t: '#c8bea4', o: '#a07820', b: '#5a1a18', k: '#d0a838', p: '#a89c84', f: '#6a5a44', a: '#c8bea4', s: '#8a7a6a' }, 41301, {}), S = {};
  const cajado = (P, h, a, lit) => { const c = Math.cos(a), sn = Math.sin(a), top = [h[0] + c * 9, h[1] + sn * 9]; P.line(h[0] - c * 8, h[1] - sn * 8, top[0], top[1], RP.madeira, 3.8); for (let q = 0; q < 8; q++) { const t = q / 8 * Math.PI * 2; if (lit) P.N(top[0] + Math.cos(t) * 2, top[1] + Math.sin(t) * 2, '#f0d070'); else P.put(top[0] + Math.cos(t) * 2, top[1] + Math.sin(t) * 2, RP.ouro, 4); } P.put(top[0], top[1], RP.ouro, 5.4); };
  for (const L of GUW.LEGK) S[L] = set(man(k, { legs: L, far: [[1.6, 3], [2.6, 5.6]], near: [[2.2, 1.8], [3.6, 2.6]], nearItem: (P, h) => cajado(P, h, -1.45, false) }));
  S.cast = set(man(k, { legs: 'wide', far: [[2, -1], [3.6, -3]], near: [[1.6, -3], [2, -6.6]], nearItem: (P, h) => cajado(P, h, -1.57, true) }));
  S.planta = set(man(k, { legs: 'wide', far: [[2.4, 2], [4, 3.4]], near: [[2.6, 2.2], [4.4, 3]], nearItem: (P, h) => cajado(P, h, 1.57, true) }));
  return S;
});
/* ---------- a Lâmina Errante: a espada sozinha, 9 x 22, a ponta para baixo; desenhada girada pelo ângulo ---------- */
const LAM = lazy('lam', () => {
  const P = painter(9, 22), A = RP.aco;
  for (let y = 7; y < 22; y++) { const w = y > 19 ? 0 : 1; for (let x = 4 - w; x <= 4 + w; x++) P.put(x, y, A, x < 4 ? 4.6 : x === 4 ? 3.8 - (y - 7) * 0.04 : 2.4); }
  for (let y = 9; y < 19; y++) P.put(4, y, A, 1.6);   // o sulco
  for (let x = 0; x < 9; x++) { P.put(x, 6, RP.ouro, x < 4 ? 4.6 : 2.8); P.put(x, 5, RP.ouro, 3.6); }
  P.put(0, 7, RP.ouro, 3); P.put(8, 7, RP.ouro, 2);
  for (let y = 1; y < 5; y++) { P.put(4, y, RP.couro, y % 2 ? 4.4 : 3); P.put(3, y, RP.couro, 2.4); P.put(5, y, RP.couro, 2); }
  P.blob(4, 0.6, 1.4, 1, RP.ouro, 41401, 4);
  const cv = toCvOut(P);
  return { r: cv, w: whiteOf(cv) };
});
function toCvOut(P) { P.done(); return outlined(GUART.toCv(P)); }
Object.assign(GUH, { SER, COR, CER, CLE, LAM });
}

/* ================= desenho ================= */
DRAW_E.gu_serafim = (e, fx, fy, fl) => { const S = GUH.SER(), st = e.state, bob = Math.round(Math.sin(e.t * 2.6) * 1.2); GUART.guBlit(st === 'aim' ? S.aim : st === 'throw' ? S.throw : S['f' + (Math.floor(e.t * 3) % 2)], e, fx, fy, fl, 0, bob); };
EYES_E.gu_serafim = (e, fx, fy) => {   // a auréola: o aro de ouro em cima da cabeça, mais aceso na mira
  const a = e.state === 'aim' ? 0.85 : 0.35, x = Math.round(fx + 2 * e.facing), y = Math.round(fy - 23 + Math.sin(e.t * 2.6) * 1.2);
  lc.globalAlpha = a; lc.drawImage(GUE.glw(GU_COL.ouro, 8), x - 8, y - 8);
  lc.globalAlpha = 1; lc.fillStyle = '#f0d070'; lc.fillRect(x - 3, y - 1, 7, 1); lc.fillStyle = '#fff4c0'; lc.fillRect(x - 2, y - 2, 5, 1); lc.fillRect(x - 2, y, 5, 1);
};
WARN_E.gu_serafim = e => e.state === 'aim';
DRAW_E.gu_corvos = (e, fx, fy, fl) => {
  const S = GUH.COR(), st = e.state, img = st === 'hover' ? S[2] : st === 'dive' ? S[3] : S[Math.floor(e.t * (st === 'rise' ? 14 : 9)) % 2];
  const im = e.facing > 0 ? (fl ? img.wr : img.r) : (fl ? img.wl : img.l);
  if (st === 'dive' && e.guAng !== undefined) { lc.save(); lc.translate(fx, fy - 3); lc.rotate(e.facing > 0 ? e.guAng : e.guAng - Math.PI); lc.drawImage(im, -7, -6); lc.restore(); return; }
  lc.drawImage(im, fx - 7, fy - 9);
};
EYES_E.gu_corvos = (e, fx, fy) => { if (e.state !== 'hover') return; lc.globalAlpha = 0.6; lc.drawImage(GUE.glw('#ff5a2a', 3), Math.round(fx + 3 * e.facing) - 3, fy - 7); };
WARN_E.gu_corvos = e => e.state === 'hover';
DRAW_E.gu_cerco = (e, fx, fy, fl) => {
  const S = GUH.CER(), st = e.state, img = st === 'raise' ? S.raise : st === 'slam' || (st === 'recover' && e.stateT > 0.35) ? S.slam : S['w' + (Math.abs(e.vx) > 4 ? Math.floor(e.t * 5) % 4 : 0)];
  const im = e.facing > 0 ? (fl ? img.wr : img.r) : (fl ? img.wl : img.l), j = st === 'raise' && e.stateT < 0.3 ? Math.round(Math.sin(e.t * 50) * 0.7) : 0;
  lc.drawImage(im, (e.facing > 0 ? fx - 21 : fx - (im.width - 21)) + j, fy - 40);
};
EYES_E.gu_cerco = (e, fx, fy) => { const a = e.state === 'raise' ? 0.9 : 0.5; lc.globalAlpha = a; lc.drawImage(GUE.glw('#ff6a1a', 4), Math.round(fx + 8.6 * e.facing) - 4, fy - 32); };
WARN_E.gu_cerco = e => e.state === 'raise';
DRAW_E.gu_clerigo = (e, fx, fy, fl) => { const S = GUH.CLE(), st = e.state; GUART.guBlit(st === 'cast' ? S.cast : st === 'consagra' ? S.planta : S[GUW.legsOf(e)], e, fx, fy, fl); };
EYES_E.gu_clerigo = (e, fx, fy) => {
  guOlhos(e, fx, fy, '#ffd070', 0.4, 3, -18);
  if (e.state === 'cast' || e.state === 'consagra') { lc.globalAlpha = 0.6; lc.drawImage(GUE.glw(GU_COL.ouro, 10), Math.round(fx + (e.state === 'cast' ? 6 : 8) * e.facing) - 10, fy - (e.state === 'cast' ? 34 : 12) - 10); }
};
WARN_E.gu_clerigo = e => e.state === 'cast' || e.state === 'consagra';
DRAW_E.gu_lamina = (e, fx, fy, fl) => {
  const S = GUH.LAM(), img = fl ? S.w : S.r, j = e.state === 'tremble' ? Math.sin(e.t * 60) * 0.8 : 0;
  lc.save(); lc.translate(Math.round(fx + j), Math.round(fy - e.h / 2 + (e.state === 'idle' ? 4 : 0))); lc.rotate(e.guAng ?? 0); lc.drawImage(img, -5, -12); lc.restore();
};
EYES_E.gu_lamina = (e, fx, fy) => { if (e.state !== 'tremble' && e.state !== 'fly') return; lc.globalAlpha = e.state === 'tremble' ? 0.3 + 0.5 * (1 - e.stateT / GU_TREME) : 0.6; lc.drawImage(GUE.glw('#c8d8ff', 10), fx - 10, Math.round(fy - e.h / 2) - 10); };
WARN_E.gu_lamina = e => e.state === 'tremble';

/* ================= comportamento ================= */
const guVolB = (e, r = 260) => Math.max(0.25, GUE.near(e.x + e.w / 2, e.y + e.h / 2, r));
// voa até (tx, ty) desviando de bloco; devolve a distância
function guVoa(e, dt, tx, ty, sp, acc = 300) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, ddx = wdx((tx - ecx) / T) * T, ddy = ty - ecy, d = Math.hypot(ddx, ddy) || 1;
  let vx = ddx / d * sp, vy = ddy / d * sp;
  if (e.hitWall) vy -= sp * 0.8; if (e.hitCeil) vy = Math.abs(vy) + 20;
  e.vx = approach(e.vx, d < 4 ? 0 : vx, acc * dt); e.vy = approach(e.vy, d < 4 ? 0 : vy, acc * dt);
  return d;
}

/* ---------- o Serafim Quebrado ---------- */
AI.gu_serafim = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, ecx = e.x + e.w / 2, ecy = e.y + 6;
  if (e.state === 'aim') {   // a mira segue o herói e trava nos últimos 0,2 s
    e.vx = approach(e.vx, 0, 400 * dt); e.vy = approach(e.vy, 0, 400 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.2) { e.guTo = [pcx, pcy]; }
    else if (!e.guLock) { e.guLock = true; sfx.guTrava(guVolB(e)); }
    const m = e.guMira, ddx = e.guTo[0] - ecx, ddy = e.guTo[1] - ecy, d = Math.hypot(ddx, ddy) || 1;
    if (m) { m.x = ecx; m.y = ecy; m.dx = ddx / d; m.dy = ddy / d; m.len = Math.min(220, d + 20); m.lock = !!e.guLock; }
    if (e.stateT <= 0) { GUE.lanca(ecx, ecy, ddx / d * 380, ddy / d * 380, e.dmg, 'luz'); e.state = 'throw'; e.stateT = 0.35; e.atkCD = 2.4 + Math.random(); sfx.guLanca(guVolB(e)); if (m) m.t = m.dur; }
    return;
  }
  if (e.state === 'throw') { e.vx = approach(e.vx, 0, 400 * dt); e.vy = approach(e.vy, 0, 400 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  if (!aggro) { e.vx = approach(e.vx, Math.sin(e.t * 0.4 + e.seed) * 14, 60 * dt); e.vy = approach(e.vy, Math.sin(e.t * 0.7 + e.seed) * 8, 60 * dt); return; }
  // no alto, de lado, a 5 a 8 blocos; com o caminho livre até o herói
  e.guSide = e.guSide || (Math.random() < 0.5 ? -1 : 1);
  if (Math.abs(dx) < 3 * T) e.guSide = -Math.sign(dx) || e.guSide;
  const tx = pcx + e.guSide * 6 * T, top = GUE.teto(pcx, pl.y, 6), ty = Math.max(top + 10, pl.y - 3 * T);
  guVoa(e, dt, tx, ty, 70 + e.lvl * 0.4, 220);
  e.facing = Math.sign(dx) || e.facing;
  if (e.atkCD <= 0 && !pl.dead && dist < 13 * T && dist > 3 * T && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'aim'; e.stateT = GU_MIRA; e.guLock = false; e.guTo = [pcx, pcy];
    e.guMira = GUE.marca(ecx, ecy, 'mira', GU_MIRA + 0.05, { dx: 0, dy: 0, len: 0 }); sfx.guAureola(guVolB(e));
  }
};

/* ---------- a Revoada de Corvos ---------- */
const guBandos = [];
let guAgrupa = false;
AI.gu_corvos = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const G = e.guBando, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'hover') {   // parado no ar de asas abertas: vai mergulhar
    e.vx = approach(e.vx, 0, 500 * dt); e.vy = approach(e.vy, 0, 500 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) { const a = Math.atan2(pcy - (e.y + 3), pcx - (e.x + 3)); e.vx = Math.cos(a) * 230; e.vy = Math.sin(a) * 230; e.guAng = a; e.state = 'dive'; e.stateT = 0.8; e.swingHit = false; sfx.guCorvo(guVolB(e), 1.2); }
    return;
  }
  if (e.state === 'dive') {
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, e.x + 3, e, false); e.stateT = Math.min(e.stateT, 0.1); }
    if (e.hitWall || e.hitCeil || e.onGround) e.stateT = 0;
    if (e.stateT <= 0) { e.state = 'rise'; e.stateT = 0.8; e.atkCD = 1.4 + Math.random(); }
    return;
  }
  if (e.state === 'rise') { e.vy = approach(e.vy, -90, 500 * dt); e.vx = approach(e.vx, e.facing * 40, 300 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  if (!aggro) { e.vx = approach(e.vx, Math.cos(e.t * 0.8 + e.seed) * 30, 120 * dt); e.vy = approach(e.vy, Math.sin(e.t * 1.6 + e.seed) * 14, 120 * dt); e.facing = Math.sign(e.vx) || e.facing; return; }
  // a roda por cima do herói, cada um no seu lugar
  const k = G ? G.m.indexOf(e) : 0, n = G ? G.m.length : 1, ang = gameTime * 1.1 + k / n * Math.PI * 2;
  const top = GUE.teto(pcx, pl.y, 6), tx = pcx + Math.cos(ang) * 4 * T, ty = Math.max(top + 8, pl.y - 2.5 * T + Math.sin(ang) * T);
  guVoa(e, dt, tx, ty, 95, 400);
  e.facing = Math.sign(e.vx) || e.facing;
  if (Math.random() < dt * 0.25) sfx.guCorvo(guVolB(e) * 0.6, 1);
  // um de cada vez: o bando escolhe quem mergulha
  const ready = e.atkCD <= 0 && !pl.dead && dist < 8 * T && losClear(e.x + 3, e.y + 3, pcx, pcy);
  if (ready && (!G || (G.cd <= 0 && !G.m.some(o => o.state === 'hover' || o.state === 'dive')))) { if (G) G.cd = 0.9 + Math.random() * 0.5; e.state = 'hover'; e.stateT = GU_ASAS; sfx.guCorvo(guVolB(e), 0.8); }
};
HOOK.update.push(dt => { for (let i = guBandos.length - 1; i >= 0; i--) { const G = guBandos[i]; G.cd -= dt; G.m = G.m.filter(GUE.live); if (!G.m.length) guBandos.splice(i, 1); } });

/* ---------- o Demônio de Cerco ---------- */
AI.gu_cerco = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'raise') { e.vx = approach(e.vx, 0, 800 * dt); if (e.stateT <= 0) { guMarreta(e); e.state = 'slam'; e.stateT = 0.3; } return; }
  if (e.state === 'slam') { e.vx = 0; if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.8; } return; }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2 + Math.random() * 0.8; } return; }
  e.state = 'walk';
  GUE.passo(e, dt, aggro, dx, dy, 22 + e.lvl * 0.2, 2 * T);
  e.stepT = (e.stepT || 0) - dt;
  if (e.onGround && Math.abs(e.vx) > 4 && e.stepT <= 0) { e.stepT = 0.6; const v = GUE.near(e.x, e.y, 260); if (v > 0.05) { sfx.guPisada(v); shake(v * 0.8); } }
  if (aggro && GUE.pode(e, dx, dy, 6 * T, 2 * T)) {
    const fy = e.y + e.h, [x] = GUE.R(e, 10, 0);
    e.state = 'raise'; e.stateT = GU_MARRETA; e.vx = 0; e.facing = Math.sign(dx) || e.facing;
    GUE.marca(x, fy, 'racha', GU_MARRETA, { dir: e.facing, len: 7 * T }); sfx.guErgueMarreta(guVolB(e));
  }
};
function guMarreta(e) {
  const fy = e.y + e.h, [x] = GUE.R(e, 18, 0), ecx = e.x + e.w / 2;
  // o golpe direto onde a marreta cai e a onda pelo chão
  const hb = { x: e.facing > 0 ? ecx + 6 : ecx - 30, y: fy - 16, w: 24, h: 16 };
  if (!pl.dead && overlap(hb, pl)) hurtPlayer(Math.round(e.dmg * 1.2), ecx, e, false);
  GUE.onda(x, fy, e.facing, e.dmg, 7 * T, 190, 2 * T, 'pedra');
  GUE.sparks(x, fy - 2, 16, GUE.PO, 90, 300, 0.7);
  const v = guVolB(e, 320); sfx.guImpacto(v); shake(4 * v);
}

/* ---------- o Clérigo do Juízo ---------- */
AI.gu_clerigo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.guCast = (e.guCast ?? 2) - dt;
  if (e.state === 'cast') {   // o cajado erguido: o escudo dourado desce num aliado
    e.vx = approach(e.vx, 0, 700 * dt);
    if (e.stateT <= 0) { const A = e.guAlvo; if (GUE.live(A)) { A.guEscudoT = GU_ESCUDO_T; GUE.sparks(A.x + A.w / 2, A.y + A.h / 2, 12, GUE.LUZ, 50, 0, 0.6); sfx.guBencao(guVolB(e)); } e.state = 'walk'; e.guCast = 6 + Math.random() * 2; }
    return;
  }
  if (e.state === 'consagra') {   // o círculo crescendo em volta; no fim explode
    e.vx = approach(e.vx, 0, 700 * dt);
    if (e.stateT <= 0) {
      const ecx = e.x + e.w / 2, fy = e.y + e.h, pcx = pl.x + pl.w / 2;
      if (!pl.dead && Math.abs(pcx - ecx) < 2.6 * T && pl.y + pl.h > fy - 3 * T && pl.y < fy + 4) hurtPlayer(Math.round(e.dmg * 1.1), ecx, e, true);
      GUE.sparks(ecx, fy - 3, 22, GUE.LUZ, 110, 0, 0.6); sfx.guExplode(guVolB(e));
      e.state = 'walk'; e.atkCD = 2.4 + Math.random();
      if (e.onGround) { e.vy = -200; e.vx = -Math.sign(dx || 1) * 110; e.onGround = false; }
    }
    return;
  }
  e.state = 'walk';
  // atrás dos outros: 4 a 6 blocos do herói
  let mv = 0;
  if (aggro) { const a = Math.abs(dx); mv = a < 4 * T ? -Math.sign(dx) : a > 7 * T || !e.sees ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); mv = e.wander; }
  walk(e, dt, mv, aggro ? 34 : 16, 600, 280, dy, aggro && mv === Math.sign(dx));
  if (!e.cdClimb) e.facing = aggro ? (Math.sign(dx) || e.facing) : (mv || e.facing);
  if (!aggro || !e.onGround || pl.dead) return;
  if (e.atkCD <= 0 && dist < 2.4 * T && Math.abs(dy) < 18) { e.state = 'consagra'; e.stateT = GU_CONSAGRA; e.vx = 0; GUE.marca(e.x + e.w / 2, e.y + e.h, 'circulo', GU_CONSAGRA, { r: 2.6 * T }); sfx.guConsagra(guVolB(e)); return; }
  if (e.guCast <= 0) {
    let best = null, bd = 8 * T;
    for (const o of enemies) { if (o === e || o.dead || !o.type.startsWith('gu_') || o.type === 'gu_clerigo' || o.guEscudoT > 0 || o.state === 'buried') continue; const d = Math.hypot(o.x - e.x, o.y - e.y); if (d < bd && losClear(e.x + e.w / 2, e.y + 6, o.x + o.w / 2, o.y + o.h / 2)) { bd = d; best = o; } }
    if (best) { e.state = 'cast'; e.stateT = 0.6; e.vx = 0; e.guAlvo = best; sfx.guErgue(guVolB(e)); } else e.guCast = 1;
  }
};
HOOK.update.push(dt => { for (const e of enemies) if (e.guEscudoT > 0) e.guEscudoT -= dt; });
// o escudo dourado em volta de quem o recebeu
HOOK.drawGlow.push((cx, cy) => {
  for (const e of enemies) { if (!(e.guEscudoT > 0) || e.dead) continue; const x = Math.round(e.x + e.w / 2 - cx), y = Math.round(e.y + e.h / 2 - cy); lc.globalAlpha = 0.35 * Math.min(1, e.guEscudoT * 2); lc.drawImage(GUE.glw(GU_COL.ouro, 16), x - 16, y - 16); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const e of enemies) {
    if (!(e.guEscudoT > 0) || e.dead) continue;
    const x = e.x + e.w / 2 - cx, y = e.y + e.h / 2 - cy, rx = e.w / 2 + 4, ry = e.h / 2 + 3; lc.globalAlpha = 0.7 * Math.min(1, e.guEscudoT * 2); lc.fillStyle = GU_COL.ouro;
    for (let a = 0; a < 24; a++) { if ((a + Math.floor(gameTime * 8)) % 3) continue; const t = a / 24 * Math.PI * 2; lc.fillRect(Math.round(x + Math.cos(t) * rx), Math.round(y + Math.sin(t) * ry), 1, 1); }
  }
  lc.globalAlpha = 1;
});

/* ---------- a Lâmina Errante ---------- */
AI.gu_lamina = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'idle') {   // fincada no chão: parece uma espada qualquer
    e.vx = 0; e.vy = 0; e.guAng = 0;
    if (!pl.dead && dist < 8 * T && e.sees) { e.state = 'tremble'; e.stateT = GU_TREME; sfx.guTreme(guVolB(e)); }
    return;
  }
  if (e.state === 'tremble') {   // treme e brilha, a ponta virando para o herói
    e.vx = approach(e.vx, 0, 300 * dt); e.vy = approach(e.vy, 0, 300 * dt);
    const a = Math.atan2(pcy - ecy, pcx - ecx) - Math.PI / 2; e.guAng = e.guAng + (guWrapAng(a - e.guAng)) * Math.min(1, dt * 8); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) { const b = e.guAng + Math.PI / 2; e.vx = Math.cos(b) * 300; e.vy = Math.sin(b) * 300; e.state = 'fly'; e.stateT = 1.6; e.swingHit = false; sfx.guVoaLamina(guVolB(e)); }
    return;
  }
  if (e.state === 'fly') {
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    if (Math.random() < dt * 30) GUE.sparks(ecx, ecy, 1, GUE.ACO, 10, 0, 0.25);
    if (e.hitWall || e.hitCeil || e.onGround || e.stateT <= 0) { e.vx = 0; e.vy = 0; e.state = 'stuck'; e.stateT = GU_PRESA; GUE.sparks(ecx, ecy, 8, GUE.ACO, 60, 200, 0.4); sfx.guCrava(guVolB(e)); }
    return;
  }
  if (e.state === 'stuck') { e.vx = 0; e.vy = 0; if (e.stateT <= 0) { e.state = 'rise'; e.stateT = 0.5; } return; }
  if (e.state === 'rise') { e.vy = approach(e.vy, -40, 300 * dt); e.vx = approach(e.vx, 0, 300 * dt); if (e.stateT <= 0) e.state = aggro && e.atkCD <= 0 ? 'walk' : 'walk'; return; }
  // pairando: chega a 4 a 6 blocos e volta a tremer
  e.state = 'walk';
  if (!aggro) { e.vx = approach(e.vx, 0, 100 * dt); e.vy = approach(e.vy, 0, 100 * dt); return; }
  guVoa(e, dt, pcx - Math.sign(dx || 1) * 5 * T, pcy - T, 60, 200);
  e.guAng = (e.guAng || 0) + guWrapAng(Math.atan2(pcy - ecy, pcx - ecx) - Math.PI / 2 - (e.guAng || 0)) * Math.min(1, dt * 3);
  if (e.atkCD <= 0 && !pl.dead && dist < 8 * T && losClear(ecx, ecy, pcx, pcy)) { e.state = 'tremble'; e.stateT = GU_TREME; e.atkCD = 1.2; sfx.guTreme(guVolB(e)); }
};
const guWrapAng = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

/* ---------- golpes que eles levam, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (!e || e.dead) return _hit(e, dir, mult, melee);
  if (e.guEscudoT > 0) mult *= 0.4;   // o escudo do clérigo
  if (!GU_TYPES_B.includes(e.type)) return _hit(e, dir, mult, melee);
  if (e.type === 'gu_lamina' && e.state === 'fly') { GUE.sparks(e.x + 3, e.y + 7, 6, GUE.ACO, 60, 0, 0.3); sfx.block(); e.vx = -e.vx * 0.3 + dir * 60; return; }   // voando: o golpe só desvia
  const mt = e.type === 'gu_lamina' && e.state === 'stuck' ? 1.5 : 1;
  const r = _hit(e, dir, mult * mt, melee);
  if (e.dead) return r;
  if (e.type === 'gu_cerco') e.stun = Math.min(e.stun, e.state === 'raise' ? 0 : 0.1);
  if (e.type === 'gu_lamina') { e.stun = 0; if (e.state === 'idle') { e.state = 'tremble'; e.stateT = GU_TREME; } }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !GU_TYPES_B.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.8 + Math.random() * 0.6; e.state = 'walk';
  if (type === 'gu_lamina') {   // nasce fincada no chão, se houver chão embaixo
    const fy = GUE.chao(e.x + e.w / 2, e.y + e.h - 2, 6); if (fy !== null) { e.y = fy - e.h; e.state = 'idle'; }
  }
  if (type === 'gu_corvos' && !guAgrupa) {   // o bando: mais três em volta
    const G = { m: [e], cd: 1 }; guBandos.push(G); e.guBando = G;
    guAgrupa = true;
    try { for (let j = 0; j < 3; j++) { const x = e.x + rnd(-2, 2) * T, y = e.y + rnd(-1.5, 1) * T; if (rectSolid(x, y, e.w, e.h)) continue; const o = spawnEnemy('gu_corvos', x, y, zone); if (o && !o.dead) { o.guBando = G; G.m.push(o); } } }
    finally { guAgrupa = false; }
  }
  return e;
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) { guBandos.length = 0; guTablesB(); return _nw(sd, sv); }; }
Object.assign(sfx, {
  guAureola(v = 1) { tone(880, GU_MIRA, 'sine', 0.01 * v, 440); tone(1320, GU_MIRA, 'sine', 0.005 * v, 660); },
  guTrava(v = 1) { tone(1760, 0.08, 'triangle', 0.012 * v); },
  guLanca(v = 1) { noise(0.2, 0.06 * v, 4000, 'highpass'); tone(1400, 0.25, 'sine', 0.014 * v, -700); },
  guCorvo(v = 1, p = 1) { noise(0.12, 0.05 * v, 1500 * p, 'bandpass', 0, 4); tone(700 * p, 0.12, 'sawtooth', 0.008 * v, -200 * p); },
  guPisada(v = 1) { tone(55, 0.15, 'sine', 0.06 * v, -15); noise(0.1, 0.04 * v, 250, 'lowpass'); },
  guErgueMarreta(v = 1) { tone(80, GU_MARRETA, 'sawtooth', 0.018 * v, 40); noise(GU_MARRETA, 0.03 * v, 500, 'bandpass', 0, 1); },
  guImpacto(v = 1) { tone(45, 0.5, 'sine', 0.14 * v, -20); noise(0.5, 0.14 * v, 350, 'lowpass'); for (let k = 0; k < 4; k++) noise(0.05, 0.05 * v, 1800 + k * 300, 'bandpass', 0.05 + k * 0.05, 4); },
  guBencao(v = 1) { for (let k = 0; k < 3; k++) tone(660 * (1 + k * 0.25), 0.4, 'sine', 0.01 * v, 0, k * 0.08); },
  guConsagra(v = 1) { tone(330, GU_CONSAGRA, 'sine', 0.014 * v, 330); noise(GU_CONSAGRA, 0.02 * v, 2400, 'bandpass', 0, 2); },
  guExplode(v = 1) { noise(0.4, 0.12 * v, 1800, 'bandpass', 0, 0.6); tone(990, 0.3, 'sine', 0.02 * v, -600); },
  guTreme(v = 1) { for (let k = 0; k < 6; k++) tone(1200 + k * 60, 0.05, 'triangle', 0.006 * v, 0, k * 0.09); },
  guVoaLamina(v = 1) { noise(0.3, 0.06 * v, 3000, 'bandpass', 0, 1.5); tone(600, 0.3, 'sine', 0.01 * v, 400); },
  guCrava(v = 1) { tone(1400, 0.2, 'triangle', 0.02 * v, -600); noise(0.06, 0.08 * v, 2600, 'bandpass', 0, 3); }
});
// a luz que eles dão: a auréola, a marreta acesa não, só o aviso
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !GU_TYPES_B.includes(e.type)) continue;
    if (e.type === 'gu_serafim') addL(e.x + e.w / 2, e.y, e.state === 'aim' ? 0.5 : 0.3);
    else if (WARN_E[e.type](e)) addL(e.x + e.w / 2, e.y + e.h / 2, 0.3);
  }
}; }
