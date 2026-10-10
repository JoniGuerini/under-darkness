'use strict';

/* ================= os insetos da Colmeia, parte dois =================
   Os cinco que voam, cospem ou fazem barulho (docs/camadas/09-colmeia.md, seção 6; os outros cinco estão no 193):
   - a vespa-resineira (vespa), preta e âmbar, que fica parada no ar, dá um tiro reto de 4 blocos para outro ponto e
     para de novo; curva o abdômen para a frente, o ferrão acende âmbar (0,5 s) e sai um dardo de resina que gruda e
     some na parede. Três dardos em 4 s encasulam o herói por 1 s (cmEncasular, 190; o 199 conta e desenha);
   - a vespa-parasita (parasita), fina e ruiva, de voo trêmulo e torto, sempre a uns 5 blocos; o abdômen dobra para
     baixo, o ferrão reluz e o zumbido afina (0,5 s), e ela mergulha para picar: a picada põe um ovo (cmPorOvo; o
     ovo lembra a vespa em pl.cmOvoSrc, e o 199 tira o ovo quando ela morre);
   - o zangão (zangao), grande e peludo, que circula alto e devagar nas câmaras; só nasce onde o vão passa de 8
     blocos. A sombra dele cresce no chão e o zumbido engrossa (1 s); mergulha, agarra o herói, sobe 4 blocos com
     ele pendurado (sem controle) e solta; solta antes se bater no teto;
   - o besouro-bombardeiro (bombardeiro), que anda aos trancos e para a uns 3 blocos, nunca vem de frente para a
     cabeça do herói; vira de costas, o abdômen incha e fica vermelho (0,7 s) e solta um jato fervente em cone de 4
     blocos. O vapor fica 1 s no ar e queima pouco (30% do dano, uma vez) quem entrar nele;
   - a cigarra-tambor (cigarra), larga, de olhos saltados, presa na parede; salta de uma parede para a outra do
     túnel. O abdômen vibra, anéis crescem e o chiado sobe (1 s); a onda em anel (5 blocos, a pedra corta) empurra,
     interrompe o golpe, abaixa o escudo por 0,6 s e tira 30 de vigor.
   Arte: o pincel do 55 (cp, rampas, contorno, cache), carapaças escuras com borda de luz âmbar (a luz das paredes),
   asas em camada própria, translúcidas, sem contorno, com nervura e um brilho fino. Sons pelo sfx (cm2...).
   O 195 põe o nível e o spawn (embrulha spawnEnemy por fora); o zangão sem vão alto volta com e.dead e e.cmVoid.
   Carrega depois do 193 e antes do 49 (BAL): os números são os da ficha. */

/* ---------- números ---------- */
Object.assign(ET, {
  vespa: { name: 'Vespa-Resineira', w: 10, h: 9, hp: 56, dmg: 17, xp: 24, kb: 0.9, fly: true, blood: '#c8a040' },
  parasita: { name: 'Vespa-Parasita', w: 9, h: 8, hp: 48, dmg: 14, xp: 22, kb: 1.0, fly: true, blood: '#b88a3a' },
  zangao: { name: 'Zangão', w: 18, h: 13, hp: 150, dmg: 22, xp: 40, kb: 0.25, fly: true, blood: '#c89a3a' },
  bombardeiro: { name: 'Besouro-Bombardeiro', w: 16, h: 9, hp: 120, dmg: 24, xp: 34, kb: 0.35, fly: false, blood: '#9aa04a' },
  cigarra: { name: 'Cigarra-Tambor', w: 10, h: 14, hp: 90, dmg: 16, xp: 28, kb: 0, fly: true, blood: '#8a9a4a' }
});
const CM2_TYPES = ['vespa', 'parasita', 'zangao', 'bombardeiro', 'cigarra'];
// os materiais e as bases vêm do 197 (e quitina do 55); filtradas agora e de novo a cada mundo
const CM2_DROPS = {
  vespa: [['ferrao', 0.4], ['mel_escuro', 0.1], ['min_ambrita', 0.08], ['pocao', 0.08], ['lanca_ferrao', 0.15]],
  parasita: [['ferrao', 0.3], ['geleia_real', 0.08], ['min_ambrita', 0.07], ['pocao', 0.12]],
  zangao: [['ferrao', 0.5, 1, 2], ['mel_escuro', 0.3], ['cera_bruta', 0.3], ['geleia_real', 0.1], ['min_ambrita', 0.1], ['pocao', 0.08], ['lanca_ferrao', 0.15]],
  bombardeiro: [['quitina', 0.55, 1, 2], ['cera_bruta', 0.15], ['min_ambrita', 0.08], ['pocao', 0.08]],
  cigarra: [['quitina', 0.45], ['cera_bruta', 0.2], ['mel_escuro', 0.1], ['min_ambrita', 0.06], ['pocao', 0.06], ['elmo_ambar', 0.1]]
};
function cm2Tables() { for (const k of CM2_TYPES) DROPS[k] = CM2_DROPS[k].filter(([id]) => ITEMS[id]); }
cm2Tables();
Object.assign(NAV_WALKERS, { bombardeiro: 1 });
if (typeof CV_STEP !== 'undefined') CV_STEP.bombardeiro = 1;

const CM2_AIM = 0.5, CM2_DASH = 4 * T, CM2_DASH_T = 0.22, CM2_HITS = 3, CM2_HITS_T = 4;
const CM2_SHADOW = 1, CM2_LIFT = 4 * T, CM2_SWELL = 0.7, CM2_JET = 0.35, CM2_JET_LEN = 4 * T, CM2_JET_HALF = 0.42;
const CM2_DRUM = 1, CM2_WAVE_R = 5 * T, CM2_WAVE_T = 0.4, CM2_VIG = 30, CM2_SHIELD_LOCK = 0.6;

/* ================= arte ================= */
const CM2 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const CR = {
  negro: R6(['#050407', '#0c0a0c', '#151012', '#201816', '#2e221a', '#3e2e20']),    // carapaça das vespas: preto com calor
  ambar: R6(['#4a2006', '#7a3a0a', '#b0600e', '#d88a1c', '#f4b03a', '#ffd878']),
  mel: R6(['#3a1e04', '#6a3a08', '#a0600e', '#d08a1a', '#f0b030', '#ffd870']),
  resina: R6(['#1e0a06', '#3e160a', '#64260e', '#8a3c14', '#b05a1e', '#d07e34']),
  ruivo: R6(['#0e0504', '#1c0a08', '#2e120c', '#441c10', '#5c2a16', '#783c1e']),    // a parasita: preto avermelhado
  quit: R6(['#0c120e', '#1a2620', '#2a3e32', '#3e5a48', '#5a7e64', '#8aac8e']),
  besouro: R6(['#06080a', '#0c1014', '#141c22', '#1e2a32', '#2c3c46', '#40545e']),  // élitros azul-petróleo quase pretos
  real: R6(['#3a2018', '#64382a', '#8e5a40', '#b8825a', '#dcae80', '#f4d6a8']),
  pelo: R6(['#080605', '#120d0a', '#1e1610', '#2c2016', '#3c2c1e', '#4e3a26']),
  olho: R6(['#140604', '#2e0c06', '#561a0a', '#8a3010', '#c0581c', '#f0963a']),
  oliva: R6(['#0c0e06', '#181c0c', '#262c14', '#38401e', '#4e582a', '#6a7438'])     // a cigarra
};
// a vermelhidão do bombardeiro: da resina ao vermelho fervendo, k de 0 a 1
const VERM = ['#2a0606', '#540c0a', '#861410', '#b82418', '#e04a2a', '#ff8a5a'], RES = ['#1e0a06', '#3e160a', '#64260e', '#8a3c14', '#b05a1e', '#d07e34'];
const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return pack(lerp(A[0], B[0], k) | 0, lerp(A[1], B[1], k) | 0, lerp(A[2], B[2], k) | 0); };
const redRamp = k => RES.map((h, i) => mix(h, VERM[i], k));
// a asa: 0 borda e nervura, 1 membrana escura, 2 membrana clara, 3 o brilho fino, 4 nervura clara (alfa baixo: sem contorno)
const ASA = [['#3a2c1a', 185], ['#6a5c42', 88], ['#b0a07a', 118], ['#fff4cc', 215], ['#d8c494', 150]].map(([h, a]) => { const [r, g, b] = rgb(h); return pack(r, g, b, a); });

// elipse girada com luz de cima à esquerda; pick(u, v, x, y) devolve [rampa, ajuste] (ou null para pular o pixel)
function ell(P, cx, cy, rx, ry, ang, R, s, base, pick) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - m); y <= cy + m; y++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
    const px = x + 0.5 - cx, py = y + 0.5 - cy, u = (px * ca + py * sa) / rx, v = (-px * sa + py * ca) / ry, d = u * u + v * v;
    if (d > 1) continue;
    let RR = R, dv = 0;
    if (pick) { const p = pick(u, v, x, y); if (!p) continue; RR = p[0]; dv = p[1]; }
    P.put(x, y, RR, base + 1 - (px / m * 0.8 + py / m) * 1.6 - d * 0.9 + cg(x, y, s) * 0.45 + dv);
  }
}
// pelo: uma franja de tufos para fora da elipse
function fuzz(P, cx, cy, rx, ry, R, s, n) {
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, k = 0.98 + hash2(i, 3, s) * 0.14;
    if (hash2(i, 5, s) < 0.45 || Math.sin(a) > 0.5) continue;
    const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
    P.put(x, y, R, 2.2 - Math.sin(a) * 1.2 + hash2(i, 7, s));
  }
}
// a luz âmbar das paredes nas bordas de baixo e de trás da carapaça (o que já foi pintado)
function rim(P, A) {
  const { w, h, c } = P, o = c.slice();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!o[i]) continue;
    const below = y === h - 1 || !o[i + w], back = x === 0 || !o[i - 1], g = hash2(x, y, 917);
    if (below && back) c[i] = A[3];
    else if (below ? g < 0.7 : back && g < 0.45) c[i] = A[g < 0.25 ? 3 : 2];
  }
}
// uma asa a partir da raiz (x0, y0), na direção ang, comprimento L, meia largura Wd
function wing(P, x0, y0, ang, L, Wd, far) {
  const ux = Math.cos(ang), uy = Math.sin(ang), m = L + Wd + 1;
  for (let y = Math.floor(y0 - m); y <= y0 + m; y++) for (let x = Math.floor(x0 - m); x <= x0 + m; x++) {
    const px = x + 0.5 - x0, py = y + 0.5 - y0, u = px * ux + py * uy, v = -px * uy + py * ux;
    if (u < 0 || u > L) continue;
    const t = u / L, half = Wd * Math.pow(Math.sin(Math.PI * (0.12 + t * 0.86)), 0.6);
    if (Math.abs(v) > half) continue;
    let k = v < 0 ? 2 : 1;
    if (Math.abs(v) > half - 0.75 || u > L - 0.8) k = 0;
    else if (t > 0.18 && Math.abs(v - half * 0.25 * Math.sin(t * 3.2)) < 0.32) k = 4;
    if (!far && k !== 0 && v < 0 && Math.abs(v + half - 1.25) < 0.45 && t > 0.22 && t < 0.72) k = 3;
    if (far && k > 1) k = k === 4 ? 0 : 1;
    P.put(x, y, ASA, k);
  }
}
// três camadas: a asa de trás, o corpo (contornado) e a asa da frente
function bug(W, H, far, body, near) {
  const c = mk(W + 2, H + 2), x = c.getContext('2d');
  if (far) { const P = cp(W, H); far(P); x.drawImage(P.done(), 1, 1); }
  const B = cp(W, H); body(B); x.drawImage(outlined(B.done()), 0, 0);
  if (near) { const P = cp(W, H); near(P); x.drawImage(P.done(), 1, 1); }
  const l = flip(c); return { r: c, l, wr: whiteOf(c), wl: whiteOf(l) };
}
const WA = [-2.15, -2.7, 2.95];   // a batida: em cima, no meio, embaixo

/* ---------- a vespa-resineira, 22 x 20 de frente para a direita ----------
   pose 0 o voo (abdômen para trás, listrado), 1 a mira (o abdômen curvado por baixo, ferrão aceso para a frente) */
function vespa(pose, wf) {
  const s = 19401 + pose * 5 + wf, curl = pose === 1, aa = curl ? 1.1 : 2.9, px = 9.6, py = 10.6;
  const acx = px + Math.cos(aa) * 4.1, acy = py + Math.sin(aa) * 4.1, tx = px + Math.cos(aa) * 8.2, ty = py + Math.sin(aa) * 8.2;
  return bug(22, 20, P => wing(P, 12.6, 7.4, WA[wf] + 0.28, 8, 2.1, true), P => {
    ell(P, acx, acy, 4.2, 2.6, aa, CR.negro, s, 2.2, (u) => (Math.floor((u + 1) * 2.6) % 2 === 1 ? [CR.ambar, -0.4] : [CR.negro, 0]));
    P.put(px, py, CR.negro, 2);
    ell(P, 12.6, 9.5, 3, 2.4, 0, CR.negro, s + 1, 2.3, (u, v) => (u > 0.2 && v < -0.35 ? [CR.ambar, -1.2] : [CR.negro, 0]));
    ell(P, 16.6, 9.4, 2.2, 2.3, 0, CR.negro, s + 2, 2.5, (u, v) => (u > 0.35 && v > 0.15 ? [CR.ambar, -0.6] : [CR.negro, 0]));
    rim(P, CR.ambar);
    P.blob(16.9, 8.6, 1.2, 1.5, CR.olho, s + 3, 2.4);
    P.line(16.6, 7.2, 17.4, 5.2, CR.ambar, 1.6); P.line(17.4, 5.2, 18.8, 4.6, CR.ambar, 1.2);
    P.put(18.7, 10.6, CR.ambar, 4); P.put(19, 11.4, CR.negro, 2.6);
    // o ferrão: apagado no voo, aceso na mira
    const fx = tx + Math.cos(aa) * 1.6, fy = ty + Math.sin(aa) * 1.6;
    P.line(tx, ty, fx, fy, curl ? CR.ambar : CR.negro, curl ? 5 : 3);
    if (curl) P.put(fx, fy, CR.ambar, 5.6);
    for (let i = 0; i < 3; i++) {
      const hx = 11.2 + i * 1.3;
      if (curl) P.leg(hx, 11.4, hx + 1.6, 13.2, hx + 2.6 + i * 0.4, 14.6 - i * 0.4, CR.negro, 2.6);
      else P.leg(hx, 11.4, hx - 0.6, 13.6, hx - 1.5 + i * 0.4, 15.6, CR.negro, 2.6);
    }
  }, P => wing(P, 12, 7.8, WA[wf], 9, 2.4, false));
}

/* ---------- a vespa-parasita, 24 x 20: fina, ruiva, pernas longas, o ovipositor comprido ----------
   pose 0 o voo, 1 o abdômen dobrado para baixo, a ponta brilhando */
function parasita(pose, wf) {
  const s = 19431 + pose * 5 + wf, bent = pose === 1, aa = bent ? 1.25 : 2.95, px = 10.4, py = 10.4;
  const acx = px + Math.cos(aa) * 3.6, acy = py + Math.sin(aa) * 3.6, tx = px + Math.cos(aa) * 7.2, ty = py + Math.sin(aa) * 7.2;
  return bug(24, 20, P => wing(P, 14.2, 7.6, WA[wf] + 0.3, 9, 1.7, true), P => {
    ell(P, acx, acy, 3.8, 1.8, aa, CR.ruivo, s, 2.3, (u) => ((u > -0.2 && u < 0.05) || (u > 0.4 && u < 0.55) ? [CR.real, -1.6] : [CR.ruivo, 0]));
    P.line(px, py, 12, 9.8, CR.ruivo, 2.4);
    ell(P, 14, 9.2, 2.4, 2, 0, CR.ruivo, s + 1, 2.4);
    ell(P, 17.4, 8.6, 1.8, 2, 0, CR.ruivo, s + 2, 2.6);
    rim(P, CR.ambar);
    P.blob(17.8, 8, 1, 1.3, CR.olho, s + 3, 2);
    P.line(18, 6.8, 19, 4.6, CR.real, 1.4); P.line(19, 4.6, 20.8, 3.8, CR.real, 1.2);
    // o ovipositor: um fio para trás no voo; dobrado, aponta para a frente e reluz
    const ox = bent ? tx + 3.2 : tx - 3.4, oy = bent ? ty + 0.8 : ty + 0.9;
    P.line(tx, ty, ox, oy, bent ? CR.ambar : CR.ruivo, bent ? 4.4 : 2.6);
    if (bent) P.put(ox, oy, CR.ambar, 5.6);
    for (let i = 0; i < 3; i++) {
      const hx = 13 + i * 1.1, kx = hx - 0.8 + i * 0.6, ky = 13 - (bent ? 1 : 0), fx = hx - 2 + i * 1.2, fy = 17.6 - i * 0.5 - (bent ? 2 : 0);
      P.line(hx, 10.8, kx, ky, CR.ruivo, 3); P.line(kx, ky, fx, fy, CR.real, 2.6); P.put(fx, fy, CR.real, 4);
    }
  }, P => wing(P, 13.6, 7.8, WA[wf], 10, 1.9, false));
}

/* ---------- o zangão, 30 x 26: grande, peludo, faixas de mel ----------
   pose 0 o voo (patas soltas), 1 as patas abertas para agarrar e depois fechadas no herói */
function zangao(pose, wf) {
  const s = 19461 + pose * 5 + wf, grab = pose === 1;
  return bug(30, 26, P => wing(P, 17.6, 8.4, WA[wf] + 0.25, 10, 2.9, true), P => {
    ell(P, 9.6, 14, 6.6, 5, 2.95, CR.pelo, s, 2.3, (u, v, x, y) => (((u > -0.35 && u < -0.05) || (u > 0.3 && u < 0.52)) ? [CR.mel, -0.6 + hash2(x, y, s) * 0.6] : [CR.pelo, hash2(x, y, s + 1) < 0.25 ? 0.8 : 0]));
    ell(P, 17, 12, 5, 4.4, 0, CR.pelo, s + 3, 2.4, (u, v, x, y) => (u > 0.5 && v > -0.6 ? [CR.mel, -0.4 + hash2(x, y, s) * 0.5] : [CR.pelo, hash2(x, y, s + 4) < 0.25 ? 0.9 : 0]));
    ell(P, 23, 13.6, 3.2, 3, 0, CR.negro, s + 6, 2.4);
    rim(P, CR.ambar);
    fuzz(P, 9.6, 14, 6.6, 5, CR.pelo, s + 2, 30); fuzz(P, 17, 12, 5, 4.4, CR.pelo, s + 5, 22);
    P.blob(24.2, 12.6, 1.4, 1.9, CR.olho, s + 7, 2.2);
    P.line(23.4, 10.6, 24.4, 8.4, CR.ambar, 1.4); P.line(24.4, 8.4, 25.8, 8, CR.ambar, 1.2);
    P.put(26, 15.4, CR.ambar, 3.6); P.put(26.4, 16.2, CR.negro, 2.4);
    for (let i = 0; i < 3; i++) {
      const hx = 14.6 + i * 2.2;
      if (grab) { P.leg(hx, 15.6, hx - 1 + i * 0.4, 20, hx + 0.6 - i * 0.3, 23.6, CR.pelo, 3); P.put(hx + 1.4 - i * 0.3, 24, CR.ambar, 4); }
      else { P.leg(hx, 15.6, hx - 1.2, 18.6, hx - 2.4 + i * 0.3, 20.6, CR.pelo, 3); P.put(hx - 2.4 + i * 0.3, 21, CR.ambar, 3); }
    }
  }, P => wing(P, 16.8, 8.6, WA[wf], 11, 3.2, false));
}

/* ---------- o besouro-bombardeiro, 23 x 13 de pé (de frente para a direita) ----------
   k 0-1 andando, 2-4 o abdômen saindo de baixo dos élitros, inchando e avermelhando, 5 o jato (a ponta acesa) */
function bombardeiro(k) {
  const s = 19491 + k, sw = k >= 2 ? Math.min(3, k - 1) : 0, jet = k === 5, ph = k === 1 ? 1 : 0, P0 = cp(23, 13);
  const c = mk(25, 15), x = c.getContext('2d'), P = P0;
  // as pernas de trás (na sombra)
  for (let i = 0; i < 3; i++) { const hx = 8 + i * 3.6, o = ((i + ph) % 2 ? 1 : -1) * 0.8; P.line(hx + 0.6, 8.4, hx - 0.6 + o, 12.4, CR.besouro, 1.2); }
  // o abdômen: escondido no andar; incha para trás e para cima, da resina ao vermelho
  if (sw) { const R = redRamp(sw / 3), ax = 4.4 - sw * 0.6, ay = 8 - sw * 0.9 - (jet ? 0.6 : 0); ell(P, ax, ay, 1.8 + sw * 0.7, 1.6 + sw * 0.55, jet ? -0.5 : -0.25, R, s, 2.4 + sw * 0.2); if (jet) { P.put(ax - 2.2 - sw * 0.6, ay - 1.4, R, 5.8); P.put(ax - 2.8 - sw * 0.6, ay - 1.8, R, 5.8); } }
  ell(P, 11.4, 6.6, 7.2, 4.1, 0, CR.besouro, s + 1, 2.3, (u, v) => (Math.abs(v + 0.7) < 0.12 && u > -0.8 ? [CR.besouro, 1.4] : (u + 0.35) ** 2 + (v + 0.1) ** 2 < 0.03 || (u - 0.3) ** 2 + (v + 0.15) ** 2 < 0.03 ? [CR.resina, 0.6] : [CR.besouro, v > 0.6 ? -0.8 : 0]));
  ell(P, 18, 7.4, 2.4, 2.8, 0, CR.besouro, s + 2, 2.6);
  rim(P, CR.ambar);
  ell(P, 20.6, 8.6, 1.7, 1.6, 0, CR.resina, s + 3, 2.8);
  P.put(21.2, 7.8, CR.olho, 1.2);
  P.line(21.4, 7.6, 22.8, 4.8, CR.resina, 3); P.line(22, 9.6, 22.9, 10.4, CR.resina, 4);
  for (let i = 0; i < 3; i++) { const hx = 7.6 + i * 3.6, o = ((i + ph) % 2 ? -1 : 1) * 0.8; P.line(hx, 9, hx + 1 + o, 12.4, CR.besouro, 3.2); P.put(hx + 1 + o, 12, CR.resina, 3.4); }
  x.drawImage(outlined(P.done()), 0, 0);
  const l = flip(c); return { r: c, l, wr: whiteOf(c), wl: whiteOf(l) };
}

/* ---------- a cigarra-tambor ----------
   presa na parede, 18 x 24 de pé com a parede à direita: cabeça larga em cima, olhos saltados, asas de telhado nas
   costas; f 0-1 respirando, 2-3 o tambor (abdômen vibrando, asas levantadas). No voo, 26 x 20 de frente para a
   direita, w 0-1 a batida */
function cigarra(f) {
  const s = 19521 + f, drum = f >= 2, dk = drum ? (f === 2 ? 0.7 : -0.3) : f * 0.2, wl = drum ? 0.32 : 0;
  return bug(18, 24, P => wing(P, 9, 7, Math.PI / 2 + 0.06 + wl * 0.6, 16, 3, true), P => {
    ell(P, 11.4, 15.6, 5.2, 3.3 + dk, Math.PI / 2, CR.oliva, s, 2.3, (u) => [CR.oliva, Math.floor((u + 1) * 3.6 + (f === 3 ? 0.5 : 0)) % 2 ? -0.9 : 0]);
    ell(P, 11, 9.4, 3.8, 3.2, 0, CR.oliva, s + 1, 2.5, (u, v) => (Math.abs(u) < 0.18 && v < 0.3 ? [CR.real, -1] : (Math.abs(Math.abs(u) - 0.55) < 0.12 && v > -0.2) ? [CR.real, -1.4] : [CR.oliva, 0]));
    ell(P, 10.6, 4.6, 3.4, 2.3, 0, CR.oliva, s + 2, 2.6);
    rim(P, CR.ambar);
    P.blob(6.9, 4.2, 1.8, 1.8, CR.olho, s + 3, 2.8); P.put(6.3, 3.4, CR.olho, 5.8);
    P.blob(14, 3.8, 1.1, 1.1, CR.olho, s + 4, 2.4);
    P.put(9.6, 7, CR.real, 4); P.put(12, 7, CR.real, 4);
    for (const [hx, hy, kx, ky, fx, fy] of [[13.6, 8.6, 15.4, 6.8, 17.4, 7.6], [14.2, 10.6, 16, 10.2, 17.4, 11.4], [13.8, 13, 15.6, 14.2, 17.4, 15.8]]) { P.leg(hx, hy, kx, ky, fx, fy, CR.oliva, 3); P.put(fx, fy, CR.ambar, 2.6); }
  }, P => wing(P, 7.8, 7.2, Math.PI / 2 + 0.16 + wl, 16, 3.4, false));
}
function cigarraVoo(w) {
  const s = 19541 + w, wa = w ? 2.75 : -2.3;
  return bug(26, 20, P => wing(P, 14.6, 7.4, wa + 0.3, 11, 3, true), P => {
    ell(P, 8.6, 11, 5.4, 3.3, 3.0, CR.oliva, s, 2.3, (u) => [CR.oliva, Math.floor((u + 1) * 3.6) % 2 ? -0.9 : 0]);
    ell(P, 14.6, 10, 3.4, 3.7, 0, CR.oliva, s + 1, 2.5, (u, v) => (Math.abs(v) < 0.18 && u < 0.3 ? [CR.real, -1] : [CR.oliva, 0]));
    ell(P, 19.4, 10.4, 2.2, 3.3, 0, CR.oliva, s + 2, 2.6);
    rim(P, CR.ambar);
    P.blob(20.4, 8.2, 1.7, 1.7, CR.olho, s + 3, 2.8); P.put(19.8, 7.4, CR.olho, 5.8);
    for (let i = 0; i < 3; i++) P.leg(13.4 + i * 1.6, 13, 14 + i * 1.6, 14.6, 12.8 + i * 1.6, 15.2, CR.oliva, 3);
  }, P => wing(P, 14, 7.6, wa, 12, 3.2, false));
}
// o vapor: três nuvenzinhas pontilhadas (sem gradiente)
function puff(r) {
  const n = r * 2 + 1, c = mk(n, n), x = c.getContext('2d');
  for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) {
    const d = Math.hypot(i - r, y - r) / (r + 0.4); if (d > 1) continue;
    if (d > 0.6 && hash2(i, y, r * 13) < 0.45) continue;
    x.fillStyle = d < 0.45 ? '#fff2dc' : y < r ? '#e8dcc6' : '#bcae98'; x.fillRect(i, y, 1, 1);
  }
  return c;
}
CM2.get = () => CM2.ready || (CM2.ready = {
  vespa: [0, 1].flatMap(p => [0, 1, 2].map(w => vespa(p, w))),
  parasita: [0, 1].flatMap(p => [0, 1, 2].map(w => parasita(p, w))),
  zangao: [0, 1].flatMap(p => [0, 1, 2].map(w => zangao(p, w))),
  besouro: [0, 1, 2, 3, 4, 5].map(bombardeiro),
  cigarra: [0, 1, 2, 3].map(cigarra), cigVoo: [0, 1].map(cigarraVoo),
  puff: [puff(1), puff(2), puff(3)]
});
CM2.GL = { amb: glow(5, '#ffb040'), eye: glow(3, '#ffb84a'), red: glow(7, '#ff5a2a'), drum: glow(8, '#f4d6a8') };
}

/* ================= desenho ================= */
const cm2Wing = (e, n) => Math.floor(e.t * n + e.seed) % 3;
const cm2Bob = e => Math.round(Math.sin(e.t * 4.6 + e.seed) * 1.1);
function cm2Center(img, fx, fy, e, ox = 0, oy = 0) { lc.drawImage(img, Math.round(fx - img.width / 2 + ox), Math.round(fy - e.h / 2 - img.height / 2 + oy)); }
DRAW_E.vespa = (e, fx, fy, fl) => {
  const S = CM2.get().vespa, aim = e.state === 'aim', j = aim ? Math.round(Math.sin(e.t * 50) * 0.6) : 0;
  cm2Center(cvPick(S[(aim ? 3 : 0) + cm2Wing(e, 34)], e, fl), fx, fy, e, j, e.state === 'dash' ? 0 : cm2Bob(e));
};
DRAW_E.parasita = (e, fx, fy, fl) => {
  const S = CM2.get().parasita, bent = e.state === 'aim' || e.state === 'stab', j = e.state === 'aim' ? Math.round(rnd(-0.7, 0.7)) : 0;
  cm2Center(cvPick(S[(bent ? 3 : 0) + cm2Wing(e, 40)], e, fl), fx, fy, e, j, Math.round(Math.sin(e.t * 9 + e.seed) * 0.8));
};
DRAW_E.zangao = (e, fx, fy, fl) => {
  const S = CM2.get().zangao, grab = e.state === 'dive' || e.state === 'carry', img = cvPick(S[(grab ? 3 : 0) + cm2Wing(e, 22)], e, fl);
  if (e.state === 'dive') { const a = Math.atan2(e.vy, Math.abs(e.vx) + 1) * 0.5 * e.facing; cvRot(img, fx, fy - e.h / 2, a); return; }
  const j = e.state === 'shadow' ? Math.round(Math.sin(e.t * 40) * 0.6) : 0;
  cm2Center(img, fx, fy, e, j, e.state === 'carry' ? 0 : Math.round(Math.sin(e.t * 2.2 + e.seed) * 1.5) - 1);
};
DRAW_E.bombardeiro = (e, fx, fy, fl) => {
  const S = CM2.get().besouro, st = e.state;
  let k = Math.abs(e.vx) > 4 && e.onGround ? Math.floor(e.t * 7) % 2 : 0, j = 0;
  if (st === 'swell') { const p = clamp(1 - e.stateT / CM2_SWELL, 0, 1); k = 2 + Math.min(2, Math.floor(p * 3)); j = p > 0.5 ? Math.round(Math.sin(e.t * 60) * 0.6) : 0; }
  else if (st === 'jet') { k = 5; j = Math.round(Math.sin(e.t * 70) * 0.6); }
  else if (st === 'recover') k = 2;
  const img = cvPick(S[k], e, fl);
  lc.drawImage(img, Math.round(fx - img.width / 2 + j), fy - img.height + 1);
};
DRAW_E.cigarra = (e, fx, fy, fl) => {
  const B = CM2.get();
  if (e.state === 'leap' || e.state === 'lost') { cm2Center(cvPick(B.cigVoo[Math.floor(e.t * 26) % 2], e, fl), fx, fy, e); return; }
  const drum = e.state === 'drum', k = drum ? 2 + (Math.floor(e.t * 30) % 2) : Math.floor(e.t * 1.3 + e.seed) % 2, S = B.cigarra[k];
  const img = e.wallSide > 0 ? (fl ? S.wr : S.r) : (fl ? S.wl : S.l), j = drum ? Math.round(Math.sin(e.t * 55)) * 0.5 : 0;
  // a parede encosta na borda do desenho
  const x = e.wallSide > 0 ? fx + e.w / 2 - img.width + 2 : fx - e.w / 2 - 2;
  lc.drawImage(img, Math.round(x + j), Math.round(fy - e.h / 2 - img.height / 2));
};
const cm2Eye = (a, x, y) => { lc.globalAlpha = a; lc.drawImage(CM2.GL.eye, Math.round(x) - 3, Math.round(y) - 3); };
EYES_E.vespa = (e, fx, fy) => cm2Eye(e.state === 'aim' ? 0.5 : 0.22, fx + e.facing * 6, fy - e.h / 2 - 2 + cm2Bob(e));
EYES_E.parasita = (e, fx, fy) => cm2Eye(e.state === 'aim' ? 0.5 : 0.2, fx + e.facing * 7, fy - e.h / 2 - 2);
EYES_E.zangao = (e, fx, fy) => cm2Eye(e.state === 'shadow' ? 0.55 : 0.25, fx + e.facing * 9, fy - e.h / 2);
EYES_E.bombardeiro = (e, fx, fy) => cm2Eye(0.15, fx + e.facing * 10, fy - 6);
EYES_E.cigarra = (e, fx, fy) => {
  if (e.state === 'leap' || e.state === 'lost') { cm2Eye(0.3, fx + e.facing * 9, fy - e.h / 2 - 3); return; }
  cm2Eye(e.state === 'drum' ? 0.6 : 0.3, fx - e.wallSide * 3, fy - e.h / 2 - 7);
};
WARN_E.vespa = e => e.state === 'aim';
WARN_E.parasita = e => e.state === 'aim';
WARN_E.zangao = e => e.state === 'shadow';
WARN_E.bombardeiro = e => e.state === 'turn' || e.state === 'swell';
WARN_E.cigarra = e => e.state === 'drum';

/* ================= comportamento ================= */
const cm2Near = (e, r = 220) => Math.abs(e.x - pl.x) < r && Math.abs(e.y - pl.y) < r * 0.8;
const cm2Drag = (e, k, dt) => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
const cm2Ang = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const cm2Darts = [], cm2Waves = [], cm2Puffs = [], cm2Vapors = [], cm2DartHits = [];
let cm2Holder = null, cm2ShieldLock = 0;

/* ---------- a vespa-resineira ---------- */
AI.vespa = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'aim') {   // o abdômen curva, o ferrão acende; ela segue o herói com a ponta
    cm2Drag(e, 0.02, dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 14) parts.push({ x: ecx + e.facing * 3 + rnd(-1, 1), y: ecy + 8, vx: rnd(-6, 6), vy: rnd(-12, -4), g: 0, life: 0.25, max: 0.25, col: '#ffd878', size: 1, glow: true });
    if (e.stateT <= 0) { cm2Dart(e); e.state = 'hover'; e.stateT = 0.35 + Math.random() * 0.3; e.atkCD = 1.15 + Math.random() * 0.6; e.hx = ecx; e.hy = ecy; }
    return;
  }
  if (e.state === 'dash') {   // o tiro reto de 4 blocos
    if (e.hitWall || e.hitCeil || e.onGround || e.stateT <= 0) { e.state = 'hover'; e.stateT = 0.8 + Math.random() * 0.8; e.vx *= 0.15; e.vy *= 0.15; e.hx = e.x + e.w / 2; e.hy = e.y + e.h / 2; }
    return;
  }
  // parada no ar: só o tremor das asas
  e.state = 'hover';
  if (e.hx === undefined) { e.hx = ecx; e.hy = ecy; }
  cm2Drag(e, 0.004, dt);
  e.vx += (e.hx - ecx) * 40 * dt; e.vy += (e.hy - ecy) * 40 * dt;
  if (aggro) e.facing = Math.sign(dx) || e.facing;
  if (aggro && e.atkCD <= 0 && dist < 150 && dist > 18 && losClear(ecx + e.facing * 3, ecy + 6, pcx, pcy)) { e.state = 'aim'; e.stateT = CM2_AIM; if (cm2Near(e)) sfx.cm2Aim(); return; }
  if (e.stateT <= 0) cm2VespaDash(e, aggro);
};
// para onde vai o tiro: uma das 8 direções, livre, que deixe a vespa a uns 7 blocos do herói e acima dele
function cm2VespaDash(e, aggro) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  let best = null, bs = -1e9;
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4 + (Math.random() - 0.5) * 0.4, ux = Math.cos(a), uy = Math.sin(a), tx = ecx + ux * CM2_DASH, ty = ecy + uy * CM2_DASH;
    if (rectSolid(tx - e.w / 2 - 2, ty - e.h / 2 - 2, e.w + 4, e.h + 4) || !losClear(ecx, ecy, tx, ty)) continue;
    let sc = Math.random() * 20;
    if (aggro) { sc -= Math.abs(Math.hypot(tx - pcx, ty - pcy) - 85) + Math.abs(pcy - 34 - ty) * 0.5; if (!losClear(tx, ty, pcx, pcy)) sc -= 40; }
    else sc -= Math.hypot(tx - (e.homeX ?? ecx), ty - (e.homeY ?? ecy)) * 0.6;
    if (sc > bs) { bs = sc; best = [ux, uy]; }
  }
  if (!best) { e.stateT = 0.6; return; }
  const sp = CM2_DASH / CM2_DASH_T;
  e.vx = best[0] * sp; e.vy = best[1] * sp; e.state = 'dash'; e.stateT = CM2_DASH_T;
  if (!aggro && Math.abs(best[0]) > 0.3) e.facing = Math.sign(best[0]);
  cm2Scales(e, 2);
  if (cm2Near(e, 180)) sfx.cm2Zip();
}
// o dardo de resina: reto, some na parede
function cm2Dart(e) {
  const ox = e.x + e.w / 2 + e.facing * 2.5, oy = e.y + e.h / 2 + 8, a = Math.atan2(pl.y + pl.h / 2 - oy, pl.x + pl.w / 2 - ox), sp = 170;
  cm2Darts.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: e.dmg, life: 1.6 });
  if (cm2Near(e)) sfx.cm2Dart();
}
// três dardos em 4 s: o herói vira casulo por 1 s (190/199)
function cm2DartHit() {
  const now = gameTime; cm2DartHits.push(now);
  while (cm2DartHits.length && now - cm2DartHits[0] > CM2_HITS_T) cm2DartHits.shift();
  if (cm2DartHits.length >= CM2_HITS) { cm2DartHits.length = 0; if (typeof cmEncasular === 'function') cmEncasular(1); }
}

/* ---------- a vespa-parasita ---------- */
AI.parasita = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'aim') {   // dobra o abdômen e treme no lugar, zumbindo fino
    cm2Drag(e, 0.03, dt); e.vx += rnd(-1, 1) * 200 * dt; e.vy += rnd(-1, 1) * 200 * dt; e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) { const d = dist || 1; e.vx = dx / d * 240; e.vy = dy / d * 240; e.state = 'stab'; e.stateT = 0.45; e.swingHit = false; }
    return;
  }
  if (e.state === 'stab') {   // o mergulho curto: só ele machuca
    const hb = { x: e.x - 2, y: e.y - 1, w: e.w + 4, h: e.h + 4 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') { sfx.cm2Sting(); if (typeof cmPorOvo === 'function') cmPorOvo(e); }
      e.stateT = Math.min(e.stateT, 0.05);
    }
    if (e.hitWall || e.hitCeil || e.onGround) e.stateT = 0;
    if (e.stateT <= 0 && e.state === 'stab') { e.state = 'flee'; e.stateT = 0.7; e.atkCD = 2.6 + Math.random(); }
    return;
  }
  let tx, ty, sp = 72;
  if (e.state === 'flee') { tx = ecx - dx * 2; ty = ecy - 40; sp = 100; if (e.stateT <= 0) e.state = 'flit'; }
  else {
    e.state = 'flit';
    if (aggro) { e.orb = (e.orb ?? Math.random() * 6.28) + dt * (0.6 + Math.sin(e.t * 0.7 + e.seed) * 0.9); tx = pcx + Math.cos(e.orb) * 60; ty = pcy - 14 + Math.sin(e.orb) * 30; }
    else { tx = (e.homeX ?? ecx) + Math.cos(e.t * 0.5 + e.seed) * 40; ty = (e.homeY ?? ecy) + Math.sin(e.t * 0.9 + e.seed) * 18; sp = 40; }
  }
  // o voo trêmulo: segue o alvo aos trancos, com chutes ao acaso a cada quadro
  const ux = tx - ecx, uy = ty - ecy, d = Math.hypot(ux, uy) || 1, want = Math.min(sp, d * 2.5), k = Math.min(1, dt * 3);
  e.vx = lerp(e.vx, ux / d * want, k) + rnd(-1, 1) * 520 * dt; e.vy = lerp(e.vy, uy / d * want, k) + rnd(-1, 1) * 520 * dt;
  if (e.hitWall) e.vx *= -0.6; if (e.hitCeil || e.onGround) e.vy *= -0.6;
  e.facing = aggro ? (Math.sign(dx) || e.facing) : Math.abs(e.vx) > 4 ? Math.sign(e.vx) : e.facing;
  if (aggro && e.state === 'flit' && e.atkCD <= 0 && dist < 86 && dist > 22 && losClear(ecx, ecy, pcx, pcy)) { e.state = 'aim'; e.stateT = CM2_AIM; if (cm2Near(e)) sfx.cm2Whine(); }
};

/* ---------- o zangão ---------- */
function cm2Roof(e) { const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor(e.y / T); for (let k = 0; k < 14; k++) if (solidAt(tx, ty - k)) return ty - k; return null; }
function cm2FloorY(x, y, max = 16) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 0; k < max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T; return null; }
AI.zangao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  e.roofT = (e.roofT || 0) - dt;
  if (e.roofT <= 0) { e.roofT = 0.5; const r = cm2Roof(e); e.altY = r === null ? null : (r + 1) * T + 2 * T + e.h / 2; }
  if (e.state === 'carry') { cm2Carry(e, dt); return; }
  if (e.state === 'shadow') {   // para em cima do herói; a sombra cresce no chão
    if (e.stateT > 0.25) { e.lockX = pcx; e.lockY = pcy; }
    e.vx = approach(e.vx, clamp((e.lockX - ecx) * 2, -60, 60), 220 * dt);
    e.vy = approach(e.vy, e.altY !== null ? clamp(e.altY - ecy, -30, 30) : 0, 120 * dt);
    e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) {
      const ux = e.lockX - ecx, uy = e.lockY - ecy, d = Math.hypot(ux, uy) || 1;
      e.vx = ux / d * 210; e.vy = uy / d * 210; e.state = 'dive'; e.stateT = Math.min(1.1, d / 210 + 0.25); e.swingHit = false;
      if (cm2Near(e)) sfx.cm2Dive();
    }
    return;
  }
  if (e.state === 'dive') {
    const hb = { x: e.x - 2, y: e.y + 2, w: e.w + 4, h: e.h + 4 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) {
      e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit' && !cm2Holder) { cm2Grab(e); return; }
      e.state = 'recover'; e.stateT = 0.8; e.atkCD = 2.5 + Math.random(); return;
    }
    if (e.hitWall || e.hitCeil || e.onGround || e.stateT <= 0) {
      if (e.onGround) { burst(ecx, e.y + e.h, 8, '#6e5022', 60, 300, 0.4); shake(1.5); }
      e.state = 'recover'; e.stateT = e.onGround ? 1 : 0.6; e.atkCD = 2.4 + Math.random();
    }
    return;
  }
  if (e.state === 'recover') { cm2Drag(e, 0.05, dt); e.vy = approach(e.vy, -30, 120 * dt); if (e.stateT <= 0) e.state = 'circle'; return; }
  // circulando alto e devagar
  e.state = 'circle';
  const ax = aggro ? pcx : (e.homeX ?? ecx), R = aggro ? 44 : 60;
  e.orb = (e.orb || 0) + dt * 0.45 * (e.dir || 1);
  const tx = ax + Math.cos(e.orb + e.seed) * R, ty = (e.altY ?? e.homeY ?? ecy) + Math.sin(e.orb * 2) * 6;
  const ux = tx - ecx, uy = ty - ecy, d = Math.hypot(ux, uy) || 1, sp = Math.min(36, d * 1.5), k = Math.min(1, dt * 1.6);
  e.vx = lerp(e.vx, ux / d * sp, k); e.vy = lerp(e.vy, uy / d * sp, k);
  if (e.hitWall) { e.dir = -(e.dir || 1); e.vx *= -0.5; }
  e.facing = Math.abs(e.vx) > 3 ? Math.sign(e.vx) : e.facing;
  e.buzzK = 1;
  if (aggro && e.atkCD <= 0 && dy > 20 && Math.abs(dx) < 110 && dist < 180 && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'shadow'; e.stateT = CM2_SHADOW; e.lockX = pcx; e.lockY = pcy; if (cm2Near(e, 260)) sfx.cm2Drone();
  }
};
function cm2Grab(e) {
  cm2Holder = e; e.state = 'carry'; e.stateT = 1.6; e.liftY = pl.y; e.vx = 0; e.vy = 0;
  const nx = pl.x + pl.w / 2 - e.w / 2, ny = pl.y - e.h + 4;   // ele por cima, o herói nas patas
  if (!rectSolid(nx, ny, e.w, e.h)) { e.x = nx; e.y = ny; }
  pl.vx = 0; pl.vy = 0; sfx.cm2Grab();
}
function cm2Release(e) {
  if (cm2Holder === e) cm2Holder = null;
  if (!e.dead) { e.state = 'recover'; e.stateT = 0.9; e.atkCD = 3 + Math.random(); }
  pl.vy = Math.max(pl.vy, 10); pl.vx = 0;
}
// subindo com o herói pendurado: ele não controla nada; solta a 4 blocos, no teto ou se a pedra prender o herói
function cm2Carry(e, dt) {
  if (pl.dead || cm2Holder !== e) { cm2Release(e); return; }
  e.vx = approach(e.vx, 0, 200 * dt); e.vy = -62;
  const hx = e.x + e.w / 2 - pl.w / 2, hy = e.y + e.h - 4;
  if (rectSolid(hx, hy, pl.w, pl.h)) { cm2Release(e); return; }
  pl.x = hx; pl.y = hy; pl.vx = 0; pl.vy = 0; pl.onGround = false; pl.climb = false;
  pl.stunT = Math.max(pl.stunT, 0.1); pl.atkT = -1; pl.atkBuf = 0; pl.mining = false;
  if (e.hitCeil || e.liftY - pl.y >= CM2_LIFT || e.stateT <= 0) { if (e.hitCeil) shake(1.5); cm2Release(e); }
}
// só onde o vão tem mais de 8 blocos de altura: procura perto; sem lugar, ele não nasce
function cm2HighSpot(e) {
  const tx0 = Math.floor((e.x + e.w / 2) / T), ty0 = Math.floor((e.y + e.h / 2) / T);
  for (let r = 0; r <= 8; r++) for (const s of r ? [-1, 1] : [1]) for (let oy = -4; oy <= 4; oy += 2) {
    const tx = tx0 + s * r, ty = ty0 + oy;
    if (solidAt(tx, ty)) continue;
    let up = 0, dn = 0; while (up < 24 && !solidAt(tx, ty - up - 1)) up++; while (dn < 24 && !solidAt(tx, ty + dn + 1)) dn++;
    if (up + dn + 1 <= 8) continue;
    const x = tx * T + T / 2 - e.w / 2, y = (ty - up + 2) * T;
    if (rectSolid(x, y, e.w, e.h)) continue;
    e.x = x; e.y = y; return true;
  }
  return false;
}

/* ---------- o besouro-bombardeiro ---------- */
const cm2JetOrigin = e => [e.x + e.w / 2 - e.facing * 9, e.y + 2];
// o jato sai para trás, mirado no herói, mas nunca para cima nem para baixo demais
function cm2JetAim(e) {
  const [ox, oy] = cm2JetOrigin(e), base = e.facing > 0 ? Math.PI : 0;
  return base + clamp(cm2Ang(Math.atan2(pl.y + pl.h / 2 - oy, pl.x + pl.w / 2 - ox) - base), -0.5, 0.35);
}
// a cabeça, o peito ou os pés do herói dentro do cone (com a pedra cortando)
function cm2InCone(ox, oy, a, L) {
  for (const f of [0.2, 0.5, 0.85]) {
    const px = pl.x + pl.w / 2, py = pl.y + pl.h * f, d = Math.hypot(px - ox, py - oy);
    if (d > L + 3) continue;
    if (Math.abs(cm2Ang(Math.atan2(py - oy, px - ox) - a)) <= CM2_JET_HALF + 4 / Math.max(6, d) && losClear(ox, oy, px, py)) return true;
  }
  return false;
}
AI.bombardeiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'turn') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.facing = -(Math.sign(dx) || e.facing); e.state = 'swell'; e.stateT = CM2_SWELL; if (cm2Near(e)) sfx.cm2Swell(); } return; }
  if (e.state === 'swell') {   // de costas: o abdômen incha e avermelha, ferve por dentro
    e.vx = approach(e.vx, 0, 700 * dt);
    const p = 1 - e.stateT / CM2_SWELL, [ox, oy] = cm2JetOrigin(e);
    if (Math.random() < dt * (4 + p * 16) && cm2Puffs.length < 220) cm2Puffs.push({ x: ox + rnd(-2, 2), y: oy + rnd(-1, 2), vx: rnd(-6, 6), vy: rnd(-16, -8), t: 0, life: 0.6, r: 0 });
    if (e.stateT <= 0) { e.state = 'jet'; e.stateT = CM2_JET; e.jetHit = false; e.jetA = cm2JetAim(e); if (cm2Near(e)) sfx.cm2Jet(); }
    return;
  }
  if (e.state === 'jet') { e.vx = approach(e.vx, 0, 700 * dt); cm2JetTick(e, dt); if (e.stateT <= 0) { cm2Vapor(e); e.state = 'recover'; e.stateT = 0.6; } return; }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2 + Math.random() * 0.8; e.facing = Math.sign(dx) || e.facing; } return; }
  e.state = 'walk';
  if (!aggro) { cvWander(e, dt); walk(e, dt, e.wander, 16, 300, 230, dy, false); if (e.wander) e.facing = e.wander; return; }
  // aos trancos: anda um pouco, para; fica a uns 3 blocos, nunca vem de frente para cima do herói
  e.goT = (e.goT || 0) - dt; if (e.goT <= 0) { e.go = !e.go; e.goT = e.go ? 0.5 + Math.random() * 0.5 : 0.35 + Math.random() * 0.4; }
  const adx = Math.abs(dx), far = !e.sees && e.nav && e.nav.kind !== 'here';
  let dir = 0;
  if (far || adx > 46) dir = Math.sign(dx); else if (adx < 20) dir = -Math.sign(dx);
  if (!e.go && !far) dir = 0;
  walk(e, dt, dir, 26 + e.lvl * 0.5, 300, 240, dy, dir === Math.sign(dx));
  e.facing = Math.sign(dx) || e.facing;
  if (e.atkCD <= 0 && e.onGround && adx < 54 && adx > 8 && Math.abs(dy) < 22 && clearPath(e, pl)) { e.state = 'turn'; e.stateT = 0.16; }
};
function cm2JetTick(e, dt) {
  const [ox, oy] = cm2JetOrigin(e), a = e.jetA, p = 1 - e.stateT / CM2_JET, L = CM2_JET_LEN * Math.min(1, p * 3 + 0.2);
  for (let i = 0; i < 3; i++) if (cm2Puffs.length < 220) { const aa = a + rnd(-0.38, 0.38), sp = rnd(100, 180); cm2Puffs.push({ x: ox, y: oy, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, t: 0, life: rnd(0.9, 1.2), r: Math.random() < 0.35 ? 2 : Math.random() < 0.5 ? 1 : 0 }); }
  if (parts.length < 650 && Math.random() < dt * 40) { const s = rnd(100, 160); parts.push({ x: ox, y: oy, vx: Math.cos(a) * s + rnd(-20, 20), vy: Math.sin(a) * s + rnd(-30, 10), g: 300, life: 0.35, max: 0.35, col: Math.random() < 0.5 ? '#fff2d0' : '#ff9a5a', size: 1, glow: true }); }
  if (!e.jetHit && !pl.dead && cm2InCone(ox, oy, a, L)) { e.jetHit = true; const r = hurtPlayer(e.dmg, ox, e, true); if (r === 'hit') pl.vx = Math.cos(a) * 160; }
}
// o vapor que fica: 1 s no ar, queima pouco (uma vez) quem entrar
function cm2Vapor(e) { const [ox, oy] = cm2JetOrigin(e); cm2Vapors.push({ ox, oy, a: e.jetA, t: 0, life: 1, dmg: Math.max(1, Math.round(e.dmg * 0.3)), hit: !!e.jetHit }); }

/* ---------- a cigarra-tambor ---------- */
// a parede mais perto na altura do corpo, à esquerda ou à direita (até max blocos, sem pedra no caminho)
function cm2FindWall(e, max) {
  const ty0 = Math.floor((e.y + 1) / T), ty1 = Math.floor((e.y + e.h - 1) / T), cx = Math.floor((e.x + e.w / 2) / T);
  let best = null;
  for (const s of [-1, 1]) for (let k = 0; k <= max; k++) {
    const tx = cx + s * k; let any = false;
    for (let y = ty0; y <= ty1; y++) if (solidAt(tx, y)) any = true;
    if (!any) continue;
    if (k > 0) { const x = s > 0 ? tx * T - e.w : (tx + 1) * T; if (!rectSolid(x, e.y, e.w, e.h) && (!best || k < best.k)) best = { side: s, x, k }; }
    break;
  }
  return best;
}
function cm2Stick(e, side) { e.wallSide = side; e.vx = 0; e.vy = 0; e.state = 'cling'; e.leapCD = 1.5 + Math.random() * 2; }
const cm2OnWall = e => rectSolid(e.wallSide > 0 ? e.x + e.w : e.x - 2, e.y + 1, 2, e.h - 2);
// o salto: para a parede do outro lado, de preferência na altura do herói
function cm2LeapTarget(e) {
  const dir = -e.wallSide, ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pref = clamp(pl.y + pl.h / 2, ecy - 4 * T, ecy + 4 * T);
  for (const cy of [pref, (pref + ecy) / 2, ecy, ecy - 2 * T, ecy + 2 * T]) {
    const y = cy - e.h / 2, ty0 = Math.floor((y + 1) / T), ty1 = Math.floor((y + e.h - 1) / T);
    let tx = Math.floor(ecx / T) + dir, hit = null;
    for (let k = 0; k < 24; k++, tx += dir) {
      let any = false; for (let r = ty0; r <= ty1; r++) if (solidAt(tx, r)) any = true;
      if (any) { if (k > 1) hit = tx; break; }
    }
    if (hit === null) continue;
    const nx = dir > 0 ? hit * T - e.w : (hit + 1) * T;
    if (rectSolid(nx, y, e.w, e.h) || !losClear(ecx, ecy, nx + e.w / 2, cy)) continue;
    return { x: nx, y, side: dir };
  }
  return null;
}
function cm2Leap(e) {
  const t = cm2LeapTarget(e);
  if (!t) { e.leapCD = 2; return false; }
  const d = Math.hypot(t.x - e.x, t.y - e.y);
  e.lp = { x0: e.x, y0: e.y, x1: t.x, y1: t.y, side: t.side, u: 0, dur: Math.max(0.35, d / 150), arc: Math.min(22, d * 0.22) };
  e.state = 'leap'; e.facing = t.side; e.leapCD = 3 + Math.random() * 3;
  cm2Scales(e, 3); if (cm2Near(e)) sfx.cm2Leap();
  return true;
}
AI.cigarra = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'leap') {   // um arco de uma parede à outra, asas abertas
    const L = e.lp; L.u += dt / L.dur;
    const u = Math.min(1, L.u), x = lerp(L.x0, L.x1, u), y = lerp(L.y0, L.y1, u) - Math.sin(Math.PI * u) * L.arc;
    e.vx = clamp((x - e.x) / dt, -320, 320); e.vy = clamp((y - e.y) / dt, -320, 320);
    if ((e.hitWall && rectSolid(L.side > 0 ? e.x + e.w : e.x - 2, e.y + 1, 2, e.h - 2)) || (u >= 1 && Math.abs(e.x - L.x1) < 3)) { if (u >= 1) { e.x = L.x1; e.y = L.y1; } cm2Stick(e, L.side); if (cm2Near(e)) sfx.cm2Land(); return; }
    if (L.u > 1.6) { e.state = 'lost'; e.lostDir = L.side; }
    return;
  }
  if (e.state === 'lost') {   // sem parede onde esperava: segue reto até achar uma
    e.seekT = (e.seekT || 0) - dt;
    if (e.seekT <= 0) { e.seekT = 0.5; const w = cm2FindWall(e, 24); if (w) e.lostDir = w.side; }
    e.vx = e.lostDir * 80; e.vy = approach(e.vy, 0, 200 * dt);
    if (e.hitWall) { cm2Stick(e, e.lostDir); return; }
    if (e.stateT <= 0) { e.lostDir = -e.lostDir; e.stateT = 3; }
    return;
  }
  e.vx = 0; e.vy = 0;
  if (!cm2OnWall(e)) {   // a parede sumiu (quebrada): outra perto, ou voa até uma
    const w = cm2FindWall(e, 4);
    if (w) { e.x = w.x; cm2Stick(e, w.side); } else { e.state = 'lost'; e.lostDir = -(e.wallSide || 1); e.stateT = 3; }
    return;
  }
  e.facing = -e.wallSide;
  if (e.state === 'drum') {   // o abdômen vibra, anéis crescem, o chiado sobe
    if (Math.random() < dt * 6) cm2Scales(e, 1);
    if (e.stateT <= 0) { cm2Wave(e); e.state = 'after'; e.stateT = 0.6; }
    return;
  }
  if (e.state === 'after') { if (e.stateT <= 0) { e.state = 'cling'; e.atkCD = 2.4 + Math.random(); if (Math.random() < 0.6) cm2Leap(e); } return; }
  e.state = 'cling';
  e.leapCD = (e.leapCD ?? 2) - dt;
  if (aggro && e.atkCD <= 0 && dist < 64 && losClear(ecx, ecy, pcx, pcy)) { e.state = 'drum'; e.stateT = CM2_DRUM; if (cm2Near(e)) sfx.cm2Chirp(); return; }
  if (e.leapCD <= 0 && ((aggro && (dist > 90 || dist < 24)) || (!aggro && Math.random() < dt * 0.15))) cm2Leap(e);
};
// a onda: um anel de 5 blocos que cresce em 0,4 s; a pedra corta
function cm2Wave(e) {
  cm2Waves.push({ x: e.x + e.w / 2 - e.wallSide * 2, y: e.y + e.h / 2 + 3, r: 0, t: 0, hit: false, dmg: e.dmg });
  if (cm2Near(e, 260)) { sfx.cm2Wave(); shake(2); }
}
function cm2Onda(w) {
  const dir = Math.sign(pl.x + pl.w / 2 - w.x) || 1;
  // interrompe o golpe e o escudo (o escudo fica preso embaixo um instante) e tira vigor
  pl.atkT = -1; pl.atkBuf = 0; if (pl.trail) pl.trail.length = 0; pl.mining = false;
  pl.shieldOn = false; pl.shieldK = 0; cm2ShieldLock = CM2_SHIELD_LOCK;
  pl.vig = Math.max(0, pl.vig - CM2_VIG); pl.vigT = 0;
  if (pl.vig <= 0 && !pl.guardBroken) { pl.guardBroken = true; floatText(pl.x + pl.w / 2, pl.y - 18, 'GUARDA QUEBRADA', '#ff9a5a', 1.2); }
  hurtPlayer(w.dmg, w.x, null, true);
  pl.vx = dir * 210; pl.vy = Math.min(pl.vy, -110); pl.onGround = false; pl.stunT = Math.max(pl.stunT, 0.3);
}
// enquanto o escudo está preso, o botão de erguer não chega ao herói
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (cm2ShieldLock <= 0) return _up(dt);
  const r = mouse.r, a = keys.ShiftLeft, b = keys.ShiftRight; mouse.r = false; keys.ShiftLeft = false; keys.ShiftRight = false;
  try { return _up(dt); } finally { mouse.r = r; keys.ShiftLeft = a; keys.ShiftRight = b; }
}; }

/* ---------- escamas de asa: brilhos raros quando um voador passa ---------- */
function cm2Scales(e, n) {
  if (parts.length > 600) return;
  for (let i = 0; i < n; i++) parts.push({ x: e.x + e.w / 2 + rnd(-4, 4), y: e.y + rnd(0, 4), vx: rnd(-10, 10) - e.vx * 0.1, vy: rnd(-6, 4), g: 18, life: rnd(0.7, 1.2), max: 1.2, col: Math.random() < 0.6 ? '#ffd878' : '#fff4cc', size: 1, glow: true });
}

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !CM2_TYPES.includes(e.type)) return r;
  if (e.type === 'cigarra' && e.state !== 'leap' && e.state !== 'lost') { e.vx = 0; e.vy = 0; if (e.state === 'cling') e.leapCD = Math.min(e.leapCD ?? 0, 0.3); }   // presa: o golpe não a solta, mas ela quer sair dali
  if ((e.type === 'vespa' || e.type === 'parasita') && e.state === 'aim' && e.stun > 0) { e.state = e.type === 'vespa' ? 'hover' : 'flee'; e.stateT = 0.5; e.atkCD = Math.max(e.atkCD, 0.8); e.hx = undefined; }   // corpo leve: o golpe corta a mira
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  if (cm2Holder === e) cm2Release(e);
  const r = _k(e);
  if (CM2_TYPES.includes(e.type)) { cm2Scales(e, e.type === 'zangao' ? 10 : 5); if (cm2Near(e)) sfx.cm2Die(); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !CM2_TYPES.includes(type)) return e;
  for (let k = 0; k < 4 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.8 + Math.random();
  if (type === 'zangao' && !cm2HighSpot(e)) { e.dead = true; e.cmVoid = true; return e; }
  e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'vespa') { e.state = 'hover'; e.stateT = Math.random(); }
  else if (type === 'parasita') e.state = 'flit';
  else if (type === 'zangao') { e.state = 'circle'; e.dir = Math.random() < 0.5 ? -1 : 1; }
  else if (type === 'bombardeiro') e.state = 'walk';
  else if (type === 'cigarra') { const w = cm2FindWall(e, 6); if (w) { e.x = w.x; cm2Stick(e, w.side); } else { e.state = 'lost'; e.lostDir = Math.random() < 0.5 ? -1 : 1; e.stateT = 3; e.wallSide = 1; } }
  return e;
}; }

/* ---------- o que voa sozinho: dardos, ondas, vapor ---------- */
function cm2Update(dt) {
  if (cm2ShieldLock > 0) cm2ShieldLock -= dt;
  if (cm2Holder && (cm2Holder.dead || cm2Holder.state !== 'carry' || cm2Holder.stun > 0 || !enemies.includes(cm2Holder))) { const h = cm2Holder; cm2Holder = null; if (!h.dead) cm2Release(h); }
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  for (let i = cm2Darts.length - 1; i >= 0; i--) {
    const o = cm2Darts[i]; o.life -= dt; o.x += o.vx * dt; o.y += o.vy * dt;
    let gone = o.life <= 0;
    if (!gone && solidAt(Math.floor(o.x / T), Math.floor(o.y / T))) { gone = true; burst(o.x - o.vx * 0.01, o.y - o.vy * 0.01, 5, '#b05a1e', 40, 200, 0.4); if (Math.abs(o.x - pcx) < 200) sfx.cm2Splat(0.5); }
    if (!gone && !pl.dead && o.x > pl.x - 2 && o.x < pl.x + pl.w + 2 && o.y > pl.y - 2 && o.y < pl.y + pl.h + 2) {
      const r = hurtPlayer(o.dmg, pcx - Math.sign(o.vx || 1) * 10, null, true);
      if (r === 'hit') { cm2DartHit(); sfx.cm2Splat(1); }
      if (r !== 'none' || pl.invuln > 0) { gone = true; burst(o.x, o.y, 8, '#d07e34', 50, 200, 0.4); }
    }
    if (gone) cm2Darts.splice(i, 1);
  }
  for (let i = cm2Waves.length - 1; i >= 0; i--) {
    const w = cm2Waves[i]; w.t += dt; w.r = CM2_WAVE_R * Math.min(1, w.t / CM2_WAVE_T);
    if (!w.hit && !pl.dead) { const d = Math.hypot(pcx - w.x, pcy - w.y); if (d <= w.r + 5 && d <= CM2_WAVE_R + 5 && losClear(w.x, w.y, pcx, pcy)) { w.hit = true; cm2Onda(w); } }
    if (w.t > 0.65) cm2Waves.splice(i, 1);
  }
  for (let i = cm2Puffs.length - 1; i >= 0; i--) {
    const p = cm2Puffs[i]; p.t += dt; const f = Math.pow(0.06, dt); p.vx *= f; p.vy = p.vy * f - 10 * dt;
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { p.vx *= -0.2; p.vy *= -0.2; } else { p.x = nx; p.y = ny; }
    if (p.t > p.life) cm2Puffs.splice(i, 1);
  }
  for (let i = cm2Vapors.length - 1; i >= 0; i--) {
    const v = cm2Vapors[i]; v.t += dt;
    if (!v.hit && !pl.dead && cm2InCone(v.ox, v.oy, v.a, CM2_JET_LEN)) { v.hit = true; hurtPlayer(v.dmg, v.ox, null, true); }
    if (v.t > v.life) cm2Vapors.splice(i, 1);
  }
  // os voadores: um zumbido de vez em quando, e as escamas brilhando quando passam
  for (const e of enemies) {
    if (e.dead || (e.type !== 'vespa' && e.type !== 'parasita' && e.type !== 'zangao')) continue;
    const sp = Math.abs(e.vx) + Math.abs(e.vy);
    if (Math.random() < dt * (sp > 60 ? 2.5 : 0.25)) cm2Scales(e, 1);
    e.buzzT = (e.buzzT ?? Math.random() * 3) - dt;
    if (e.buzzT <= 0) {
      e.buzzT = 2.5 + Math.random() * 3;
      const d = Math.hypot(e.x - pl.x, e.y - pl.y);
      if (d < 180 && e.state !== 'aim' && e.state !== 'shadow') { const v = 1 - d / 180; e.type === 'zangao' ? sfx.cm2Drone(v * 0.6, 0.6) : e.type === 'parasita' ? sfx.cm2Whine(v * 0.5) : sfx.cm2Buzz(v); }
    }
  }
}
HOOK.update.push(cm2Update);

// no chão (com a luz do mundo): a sombra do zangão
HOOK.drawWorld.push((cx, cy) => {
  for (const e of enemies) {
    if (e.dead || e.type !== 'zangao' || (e.state !== 'shadow' && e.state !== 'dive')) continue;
    const k = e.state === 'dive' ? 1 : clamp(1 - e.stateT / CM2_SHADOW, 0, 1), x = e.x + e.w / 2, fy = cm2FloorY(x, e.y + e.h);
    if (fy === null) continue;
    const hw = 4 + k * 9, sx = Math.round(x) - cx, sy = Math.round(fy) - cy;
    for (let r = -2; r <= 1; r++) {
      const w = Math.round(hw * Math.sqrt(1 - (r + 0.5) * (r + 0.5) / 6.25));
      lc.globalAlpha = (0.2 + 0.45 * k) * (r === -2 || r === 1 ? 0.55 : 1); lc.fillStyle = '#0a0604';
      lc.fillRect(sx - w, sy + r - 1, w * 2, 1);
    }
  }
  lc.globalAlpha = 1;
});
// por cima do escuro: dardos, anéis da cigarra, a onda, o vapor
HOOK.drawTop.push((cx, cy) => {
  const DC = ['#ffd878', '#f4b03a', '#b0600e', '#64260e'];
  for (const o of cm2Darts) {
    const sp = Math.hypot(o.vx, o.vy) || 1, ux = o.vx / sp, uy = o.vy / sp, x = o.x - cx, y = o.y - cy;
    for (let k = 3; k >= 0; k--) { lc.fillStyle = DC[k]; lc.fillRect(Math.round(x - ux * k * 1.3), Math.round(y - uy * k * 1.3), 1, 1); }
    lc.fillStyle = '#7a3a0a'; lc.fillRect(Math.round(x - ux - uy), Math.round(y - uy + ux), 1, 1);
  }
  // o tambor: anéis pequenos saindo do abdômen, mais fortes a cada instante
  for (const e of enemies) {
    if (e.dead || e.type !== 'cigarra' || e.state !== 'drum') continue;
    const k = clamp(1 - e.stateT / CM2_DRUM, 0, 1), ox = e.x + e.w / 2 - e.wallSide * 2 - cx, oy = e.y + e.h / 2 + 3 - cy;
    for (let j = 0; j < 3; j++) {
      const p = (gameTime * 2.6 + j / 3) % 1, r = 3 + p * (5 + 11 * k), n = Math.max(10, Math.round(r * 2.4));
      lc.globalAlpha = (1 - p) * (0.25 + 0.6 * k); lc.fillStyle = j === 0 ? '#fff0c8' : '#e8c890';
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, px = ox + Math.cos(a) * r, py = oy + Math.sin(a) * r; if (solidAt(Math.floor((px + cx) / T), Math.floor((py + cy) / T))) continue; lc.fillRect(Math.round(px), Math.round(py), 1, 1); }
    }
  }
  for (const w of cm2Waves) {
    const f = 1 - w.t / 0.65, n = Math.max(24, Math.round(w.r * 3));
    for (let ring = 0; ring < 2; ring++) {
      const r = w.r - ring * 3; if (r < 1) continue;
      lc.globalAlpha = f * (ring ? 0.45 : 0.85); lc.fillStyle = ring ? '#d8a050' : '#fff0c8';
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, px = w.x + Math.cos(a) * r, py = w.y + Math.sin(a) * r; if (solidAt(Math.floor(px / T), Math.floor(py / T))) continue; lc.fillRect(Math.round(px - cx), Math.round(py - cy), ring ? 1 : 2, 1); }
    }
  }
  const PF = CM2.get().puff;
  for (const p of cm2Puffs) {
    const img = PF[Math.min(2, p.r + (p.t > 0.4 ? 1 : 0))], a = (1 - p.t / p.life);
    lc.globalAlpha = a * 0.45; lc.drawImage(img, Math.round(p.x - cx - img.width / 2), Math.round(p.y - cy - img.height / 2));
  }
  lc.globalAlpha = 1;
});
// a luz: o ferrão aceso, o abdômen fervendo, o tambor
HOOK.drawGlow.push((cx, cy) => {
  const G = CM2.GL;
  for (const e of enemies) {
    if (e.dead) continue;
    const ecx = e.x + e.w / 2 - cx, ecy = e.y + e.h / 2 - cy;
    if (e.type === 'vespa' && e.state === 'aim') { lc.globalAlpha = 0.2 + 0.3 * clamp(1 - e.stateT / CM2_AIM, 0, 1); lc.drawImage(G.amb, ecx + e.facing * 3 - 5, ecy + 8 - 5); }
    else if (e.type === 'parasita' && e.state === 'aim') { lc.globalAlpha = 0.3 + 0.3 * Math.abs(Math.sin(e.t * 30)); lc.drawImage(G.amb, ecx + e.facing * 4 - 5, ecy + 7 - 5); }
    else if (e.type === 'bombardeiro' && (e.state === 'swell' || e.state === 'jet')) { const p = e.state === 'jet' ? 1 : clamp(1 - e.stateT / CM2_SWELL, 0, 1), [ox, oy] = cm2JetOrigin(e); lc.globalAlpha = 0.2 + 0.5 * p; lc.drawImage(G.red, ox - cx - 7, oy - cy - 7); }
    else if (e.type === 'cigarra' && e.state === 'drum') { lc.globalAlpha = 0.08 + 0.17 * clamp(1 - e.stateT / CM2_DRUM, 0, 1); lc.drawImage(G.drum, ecx - 8, ecy - 5); }
  }
  for (const o of cm2Darts) { lc.globalAlpha = 0.3; lc.drawImage(G.amb, o.x - cx - 5, o.y - cy - 5); }
  lc.globalAlpha = 1;
});
function clearCm2Fx() { cm2Darts.length = 0; cm2Waves.length = 0; cm2Puffs.length = 0; cm2Vapors.length = 0; cm2DartHits.length = 0; cm2Holder = null; cm2ShieldLock = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearCm2Fx(); cm2Tables(); return _nw(sd, sv); }; }

/* ---------- sons ---------- */
Object.assign(sfx, {
  // o zumbido da vespa: duas serras quase juntas batendo, um chiado de asa
  cm2Buzz(v = 1) { tone(176, 0.35, 'sawtooth', 0.010 * v, 14); tone(183, 0.35, 'sawtooth', 0.008 * v, -8); noise(0.35, 0.012 * v, 900, 'bandpass', 0, 3); },
  // a parasita: agudo e fino, subindo
  cm2Whine(v = 1) { tone(640, 0.5, 'sawtooth', 0.008 * v, 280); tone(656, 0.5, 'square', 0.004 * v, 260); },
  // o zangão: grosso, longo
  cm2Drone(v = 1, d = 1) { tone(76, d, 'sawtooth', 0.024 * v, -4); tone(80, d, 'sawtooth', 0.02 * v, 12); noise(d, 0.03 * v, 260, 'lowpass'); },
  cm2Zip() { noise(0.12, 0.03, 1400, 'bandpass', 0, 2); tone(300, 0.12, 'sawtooth', 0.008, 200); },
  cm2Aim() { tone(900, 0.45, 'triangle', 0.01, 600); noise(0.45, 0.01, 2400, 'bandpass', 0, 6); },
  cm2Dart() { noise(0.04, 0.09, 3200, 'bandpass', 0, 3); tone(1100, 0.05, 'square', 0.018, -700); },
  cm2Splat(v = 1) { noise(0.1, 0.05 * v, 600, 'lowpass'); tone(220, 0.06, 'sine', 0.02 * v, -90); },
  cm2Sting() { noise(0.05, 0.08, 4200, 'highpass'); tone(1500, 0.06, 'square', 0.02, -900); },
  cm2Grab() { noise(0.15, 0.12, 300, 'lowpass'); tone(95, 0.4, 'sawtooth', 0.03, 40); },
  cm2Dive() { tone(120, 0.5, 'sawtooth', 0.02, 90); noise(0.5, 0.05, 500, 'bandpass', 0, 1.2); },
  // o bombardeiro: um borbulhar que sobe, depois o jato fervendo
  cm2Swell() { tone(110, 0.7, 'triangle', 0.025, 170); for (let k = 0; k < 6; k++) tone(200 + k * 50 + Math.random() * 60, 0.05, 'sine', 0.014, 120, 0.1 + k * 0.1); },
  cm2Jet() { noise(0.5, 0.1, 1500, 'bandpass', 0, 0.7); noise(0.45, 0.06, 380, 'lowpass'); for (let k = 0; k < 6; k++) tone(300 + Math.random() * 300, 0.04, 'sine', 0.012, 200, k * 0.06); },
  // a cigarra: estalos cada vez mais rápidos e agudos por 1 s, então o baque da onda
  cm2Chirp() { for (let k = 0; k < 16; k++) noise(0.04, 0.02 + k * 0.004, 2600 + k * 240, 'bandpass', k * (0.075 - k * 0.0018), 8); tone(1800, 1.0, 'sawtooth', 0.006, 2600); },
  cm2Wave() { tone(150, 0.4, 'square', 0.05, -80); noise(0.35, 0.1, 1000, 'bandpass', 0, 1.2); tone(3200, 0.15, 'sawtooth', 0.01, -2000); },
  cm2Leap() { noise(0.25, 0.03, 2000, 'bandpass', 0, 2); tone(260, 0.25, 'sawtooth', 0.008, 90); },
  cm2Land() { noise(0.06, 0.05, 900, 'bandpass', 0, 2); },
  cm2Die() { noise(0.12, 0.06, 2200, 'bandpass', 0, 2); tone(400, 0.12, 'sawtooth', 0.012, -260); }
});
