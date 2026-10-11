'use strict';

/* ================= os Visitantes da Nave Caída, parte um =================
   Cinco dos dez bichos da décima camada (docs/camadas/10-nave-caida.md, seção 6; os outros cinco estão no 244). Todos
   saídos das figurinhas: pele verde-limão, olhos pretos enormes e brilhantes, metal liso e o neon da nave nas bordas.
   - o Visitante (visitante), o homenzinho verde de olhos pretos com a sonda na mão; anda rápido. Sozinho, foge
     chilreando (e dá o alarme) e volta quando acha os outros. Ouve os alarmes (nvAlarms, 240): os parados num raio vêm
     ver. A sonda acende verde e estala (0,5 s): duas estocadas elétricas rápidas;
   - o Visitante de Capacete (atirador), o mesmo homenzinho com capacete de vidro e pistola de raio; fica a uns 7 blocos.
     O cano acende rosa e um ponto de mira aparece no herói (0,6 s): três tiros de raio rosa em sequência. Se o herói
     chega perto, teleporta 6 blocos para trás com um estalo de luz ciano;
   - o Disco Abdutor (disco), o disquinho preto e prata com a cúpula branca e as luzes na borda; voa alto, por cima do
     herói. A borda gira mais rápido e as luzes correm (0,8 s); abre o feixe arco-íris para baixo por 2 s: quem está
     nele é puxado para cima (nvAbduzir a cada quadro; o 249 puxa) e leva dano ao chegar no disco;
   - o Olho Vigia (olho), o olho com veias do adesivo, voando devagar e de longe. Uma linha fina vermelha liga o olho ao
     herói e engrossa (1,4 s); um raio contínuo de 0,6 s nela. Quando vê o herói pela primeira vez, dá o alarme
     (nvAlarme, 14 blocos);
   - a Gosma Viva (gosma), uma gota de gosma pendurada no teto, igual à Gosma Pingando; incha e brilha (0,5 s) e cai em
     quem passa embaixo. No chão vira poça viva, anda devagar, morde por toque e gruda (nvGrudar, 2 s) quem pisa nela.
   O 245 põe o nível (embrulha spawnEnemy por fora) e as tabelas de spawn. O pincel é o do 55 (cp, contorno, cache),
   rampas da seção 12; brilhos pelo HOOK.drawGlow, os pontos de neon por cima do escuro (HOOK.drawTop). Prefixo nv1. */

/* ---------- números ---------- */
Object.assign(ET, {
  visitante: { name: 'Visitante', w: 9, h: 16, hp: 70, dmg: 17, xp: 24, kb: 0.9, fly: false, blood: '#6cd422' },
  atirador: { name: 'Visitante de Capacete', w: 9, h: 16, hp: 64, dmg: 19, xp: 24, kb: 0.9, fly: false, blood: '#6cd422' },
  disco: { name: 'Disco Abdutor', w: 22, h: 9, hp: 90, dmg: 22, xp: 32, kb: 0.35, fly: true, blood: '#9aa0ae' },
  olho: { name: 'Olho Vigia', w: 12, h: 12, hp: 60, dmg: 24, xp: 26, kb: 0.6, fly: true, blood: '#d42a34' },
  gosma: { name: 'Gosma Viva', w: 10, h: 9, hp: 110, dmg: 14, xp: 30, kb: 0.1, fly: true, touch: 1, blood: '#94f03c' }   // fly: a gravidade é dela; touch só no chão
});
const NV1_TYPES = ['visitante', 'atirador', 'disco', 'olho', 'gosma'];
// materiais e bases do 247 (carrega antes); filtradas agora e de novo a cada mundo
const NV1_DROPS = {
  visitante: [['chip_alien', 0.4], ['min_xenita', 0.08], ['pocao', 0.07]],
  atirador: [['chip_alien', 0.45], ['min_xenita', 0.08], ['pocao', 0.07], ['pistola_raio', 0.015]],
  disco: [['chip_alien', 0.55, 1, 2], ['min_xenita', 0.1], ['pocao', 0.08], ['escudo_disco', 0.02]],
  olho: [['olho_vigia', 0.5], ['min_xenita', 0.06], ['pocao', 0.07]],
  gosma: [['gosma_verde', 0.6, 1, 2], ['min_xenita', 0.06], ['pocao', 0.06]]
};
function nv1Tables() { for (const k of NV1_TYPES) DROPS[k] = NV1_DROPS[k].filter(([id]) => ITEMS[id]); }
nv1Tables();
Object.assign(NAV_WALKERS, { visitante: 1, atirador: 1 });
Object.assign(CV_STEP, { visitante: 1, atirador: 1 });
// quem conta como "os outros" para o Visitante não ficar sozinho (os do 244 entram se existirem)
const NV1_BANDO = new Set(['visitante', 'atirador', 'disco', 'olho', 'cabecao', 'hipnotico', 'astronauta']);

const NV1_SONDA = 0.5, NV1_MIRA = 0.6, NV1_GIRA = 0.8, NV1_FEIXE = 2, NV1_CARGA = 1.4, NV1_RAIO = 0.6, NV1_INCHA = 0.5;
const NV1_LONGE = 7 * T, NV1_PULO = 6 * T;   // a distância do atirador e o teleporte
const NV1_GRUDA = 2, NV1_PUXA = 140;          // segundos de grude, px/s do feixe

/* ================= arte ================= */
// a ponta da sonda e o cano da pistola por pose (no desenho de 22 x 22), as luzes da borda do disco (x no prato)
const NV1_TIP = [[14.6, 14.6], [14.6, 14.6], [14.6, 14.6], [14.4, 7.4], [19.4, 13.4], [12.6, 6.6], [12.6, 6.6]];   // ponta da sonda / cano
const NV1_CANO = [[13.4, 16.6], [13.4, 16.6], [13.4, 16.6], [19.4, 12.4], [18.6, 12], [13.4, 16.6], [13.4, 16.6]];
const NV1_LUZES = [3, 6, 9, 12, 15, 18, 21, 24, 27];
const NV1 = {};
{
const { cp } = CVB, { cg } = CVART;
const R6 = a => a.map(h => ph(h));
const NR = {
  pele: R6(['#1a4a06', '#2e7a0c', '#4aa814', '#6cd422', '#94f03c', '#c8ff7a']),     // verde-limão do adesivo
  olho: R6(['#010102', '#04050a', '#0a0c14', '#141824', '#242a3a', '#3c4458']),     // preto lustroso
  luz: R6(['#9aa6b4', '#c0cad4', '#dce4ea', '#eef4f8', '#f8fcfe', '#ffffff']),
  prata: R6(['#14161c', '#2c3038', '#4e5462', '#7c8494', '#b4bac6', '#e8ecf2']),
  negro: R6(['#040406', '#0a0a10', '#14141c', '#1e1e28', '#2e2e3a', '#464654']),
  rosa: R6(['#4a0a36', '#800e5a', '#c01a86', '#ff3ec8', '#ff8ae0', '#ffd0f4']),
  ciano: R6(['#06343c', '#0a5a66', '#108a9a', '#36f0ff', '#9af8ff', '#e0feff']),
  veia: R6(['#3a0408', '#6a0a10', '#a01420', '#d42a34', '#f05a5a', '#ff9a90']),
  iris: R6(['#041a3a', '#0a3070', '#1458b0', '#2a8ae0', '#6ac0ff', '#c0ecff']),
  escl: R6(['#5a4a4c', '#8a7a7a', '#bcb0ae', '#e0d8d4', '#f4f0ec', '#ffffff'])
};
// a gosma é meio transparente: a mesma rampa com alfa
const GOS = ['#1a4a06', '#2e7a0c', '#4aa814', '#6cd422', '#94f03c', '#c8ff7a'].map((h, i) => { const [r, g, b] = rgb(h); return pack(r, g, b, i < 2 ? 245 : 225); });
const rgba = (h, a) => { const [r, g, b] = rgb(h); return pack(r, g, b, a); };
const setO = cv => { const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
// pendurada no teto: o contorno de cima (que cairia no bloco) sai
const setHang = cv => { const o = outlined(cv); o.getContext('2d').clearRect(0, 0, o.width, 1); const l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
const on = (P, x, y) => x >= 0 && y >= 0 && x < P.w && y < P.h && P.c[(y | 0) * P.w + (x | 0)] !== 0;
// elipse girada (os olhos amendoados): pinta com f(u, v, d) -> valor na rampa
function ell(P, cx, cy, rx, ry, ang, R, f) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - m); y <= cy + m; y++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
    const px = x + 0.5 - cx, py = y + 0.5 - cy, u = (px * ca + py * sa) / rx, v = (-px * sa + py * ca) / ry, d = u * u + v * v;
    if (d <= 1) P.put(x, y, R, f(u, v, d));
  }
}

/* o homenzinho, 22 x 22 de frente para a direita (o corpo no x 9, os pés na linha 21): a cabeça enorme em gota, o
   queixo fino, os dois olhos pretos amendoados com o ponto de brilho, o corpo fino. helm: o de capacete (vidro em volta
   da cabeça, gola de prata, a pistola no lugar da sonda).
   pose 0 parado, 1-2 andando, 3 o aviso (sonda erguida / pistola apontada), 4 o golpe (estocada / tiro), 5-6 fugindo */
function alien(pose, helm) {
  const P = cp(22, 22), s = 24301 + pose * 7 + (helm ? 50 : 0), hx = 9.3, hy = 7, rx = 5.6, ry = 5.4;
  const step = pose === 1 || pose === 5 ? 1 : pose === 2 || pose === 6 ? -1 : 0, flee = pose >= 5, aim = helm && (pose === 3 || pose === 4);
  // as pernas finas: a de longe primeiro, mais escura
  const legF = (x0, d) => { P.line(x0, 17.4, x0 + d * 0.8, 19.6, NR.pele, 1.6); P.line(x0 + d * 0.8, 19.6, x0 + d * 1.2, 21, NR.pele, 1.4); P.put(x0 + d * 1.2 + 0.8, 21, NR.pele, 1.4); };
  const legN = (x0, d) => { P.line(x0, 17.4, x0 + d * 0.8, 19.6, NR.pele, 3); P.line(x0 + d * 0.8, 19.6, x0 + d * 1.2, 21, NR.pele, 2.6); P.put(x0 + d * 1.2 + 1, 21, NR.pele, 3.2); };
  legF(8.2, flee ? -1.6 * step : -step);
  // o braço de longe
  if (flee) P.line(8, 13, 5.6, 10.2, NR.pele, 1.6); else P.line(8, 13, 7 - step * 0.6, 16.2, NR.pele, 1.6);
  // o tronco: pequeno, a barriguinha clara
  P.blob(9.2, 15, 2.2, 2.7, NR.pele, s, 2.6, (x, y, dx, dy) => (dx > 0.1 && dy > -0.2 ? 0.5 : 0));
  P.line(9.2, 11.6, 9.2, 12.6, NR.pele, 2.2);   // o pescoço fino
  legN(10, flee ? 1.6 * step : step);
  if (helm) { for (let x = 7; x <= 11.6; x += 0.5) P.put(x, 15.6, NR.prata, x < 8.4 ? 2.4 : 3.6); P.put(10.4, 15.6, NR.rosa, 4); }   // o cinto do traje, a fivela acesa
  // a cabeça: gota larga em cima, o queixo fino; luz de cima à esquerda
  for (let y = 0; y < 13; y++) for (let x = 2; x < 17; x++) {
    const dy = (y + 0.5 - hy) / ry, k = dy > 0 ? 1 - dy * 0.46 : 1, dx = (x + 0.5 - hx) / (rx * k), d = dx * dx + dy * dy;
    if (d > 1) continue;
    P.put(x, y, NR.pele, 3.3 - (dx * 0.7 + dy) * 1.25 - d * 0.7 + cg(x, y, s) * 0.45 + (d > 0.8 && dx > 0.2 ? -0.5 : 0));
  }
  P.put(hx - 2.6, 2.6, NR.pele, 5.4); P.put(hx - 1.6, 2, NR.pele, 5);   // o brilho na testa
  // os olhos: amendoados, inclinados para fora, pretos com o reflexo embaixo e o ponto branco em cima
  const eye = (cx, cy, erx, ery, ang) => {
    ell(P, cx, cy, erx, ery, ang, NR.olho, (u, v, d) => 0.4 + (v > 0.15 ? (v - 0.15) * 3.2 : 0) * (d > 0.25 ? 1 : 0.5) + (d > 0.85 ? 0.4 : 0));
    P.put(cx - erx * 0.4, cy - ery * 0.4, NR.luz, 5); P.put(cx + erx * 0.45, cy + ery * 0.35, NR.olho, 5);
  };
  eye(hx + 2.7, 7.6, 2.45, 1.45, -0.5); eye(hx - 2.5, 7.8, 2.15, 1.35, 0.5);
  P.put(hx + 0.6, 10.6, NR.pele, 1.2);   // a boquinha
  // o braço de perto e o que ele segura
  const arm = (x1, y1) => P.line(10.4, 13, x1, y1, NR.pele, 3);
  if (!helm) {   // a sonda: um bastão de prata com a ponta verde
    if (flee) { arm(12, 10.4); P.line(12.2, 10.6, 12.6, 7.2, NR.prata, 3.4); P.put(12.6, 6.6, NR.pele, 5); P.line(8, 13, 5.6, 10.2, NR.pele, 2.4); }
    else if (pose === 3) { arm(12, 11); P.line(12, 11.2, 14, 8, NR.prata, 4); P.put(14.4, 7.4, NR.pele, 5.6); P.put(14, 7.8, NR.pele, 4.6); }
    else if (pose === 4) { arm(13.6, 13.4); P.line(13.8, 13.4, 18.6, 13.4, NR.prata, 4.2); P.put(19.4, 13.4, NR.pele, 5.6); P.put(18.8, 13.4, NR.pele, 4.4); }
    else { arm(11.2, 15.6 - step * 0.3); P.line(11.4, 15.4, 14, 14.8, NR.prata, 3.8); P.put(14.6, 14.6, NR.pele, 4.8); }
    if (!flee) P.put(11.2, 15.6, NR.pele, 3.6);
  } else {        // a pistola de raio: corpo de prata, o anel e o cano rosa
    if (aim) {
      const r = pose === 4 ? -0.8 : 0, up = pose === 4 ? -0.4 : 0;
      P.line(10.4, 13, 14.4 + r, 12.8 + up, NR.pele, 3);
      for (let x = 14.4 + r; x <= 17.6 + r; x += 0.5) { P.put(x, 12 + up, NR.prata, 4.4); P.put(x, 13 + up, NR.prata, 2.4); }
      P.put(14.6 + r, 13.8 + up, NR.prata, 2); P.put(16 + r, 12 + up, NR.rosa, 4); P.put(16 + r, 13 + up, NR.rosa, 3);
      P.put(18.4 + r, 12.4 + up, NR.rosa, 4.6);
    } else {
      P.line(10.4, 13, 11.4, 15.6 - step * 0.3, NR.pele, 3);
      P.line(11.4, 15.8, 13.2, 16.6, NR.prata, 4); P.line(11.4, 16.6, 12.8, 17.2, NR.prata, 2.4); P.put(13.6, 16.8, NR.rosa, 4);
    }
  }
  if (helm) {   // o capacete: vidro fino em volta, a borda mais viva, um reflexo em arco em cima à esquerda; a gola
    const gx = hx, gy = 6.6, R = 6.7;
    for (let y = 0; y < 14; y++) for (let x = 1; x < 18; x++) {
      const ddx = x + 0.5 - gx, ddy = y + 0.5 - gy, d = Math.hypot(ddx, ddy); if (d > R || y > 12) continue;
      const i = y * P.w + x, a = Math.atan2(ddy, ddx);
      if (d > R - 0.75) P.c[i] = rgba('#a8f0ff', 165);
      else if (d > 4.4 && a < -1.6 && a > -2.8 && d < R - 1.1) P.c[i] = rgba('#f0ffff', d > 5.4 ? 235 : 150);
      else if (!P.c[i]) P.c[i] = rgba('#7ad8f0', 62);
    }
    for (let x = 5.6; x <= 13; x += 0.5) P.put(x, 12.6, NR.prata, x < 8 ? 3 : 4.6);
  }
  return setO(P.done());
}

/* o disco, 30 x 14: a cúpula branca de vidro leitoso com um homenzinho dentro, o prato prata em cima e preto embaixo,
   a linha da borda acesa e o emissor redondo embaixo (as luzes da borda são desenhadas por cima, ao vivo) */
function disco() {
  const P = cp(30, 14), s = 24401, cx = 15;
  // o homenzinho dentro da cúpula
  P.blob(15.8, 4.2, 2, 2.1, NR.pele, s + 1, 2.6);
  P.put(15, 4.2, NR.olho, 0.5); P.put(16.8, 4.2, NR.olho, 0.5); P.line(15.6, 6, 15.6, 6.4, NR.pele, 2);
  // a cúpula: branca, o homenzinho aparece através dela
  for (let y = 0; y < 7; y++) for (let x = 8; x < 23; x++) {
    const dx = (x + 0.5 - cx) / 5.8, dy = (y + 0.5 - 6.6) / 5.6, d = dx * dx + dy * dy; if (d > 1) continue;
    const i = y * P.w + x, edge = d > 0.7, lit = dx < -0.2 && dy < -0.35 && d > 0.3 && d < 0.75;
    if (P.c[i] && !edge && !lit) continue;   // o homenzinho fica à vista
    P.put(x, y, NR.luz, lit ? 5.6 : edge ? 2.4 - dx * 0.8 + cg(x, y, s) * 0.3 : 3.6 - dx - dy * 0.6);
  }
  // o prato
  for (let y = 4; y < 12; y++) for (let x = 0; x < 30; x++) {
    const dx = (x + 0.5 - cx) / 14.6, dy = (y + 0.5 - 8.3) / 3.1, d = dx * dx + dy * dy; if (d > 1) continue;
    const i = y * P.w + x; if (P.c[i] && dy < -0.5) continue;
    if (Math.abs(y + 0.5 - 8.3) < 0.55) { P.put(x, y, NR.prata, 5 - Math.abs(dx) * 1.6); continue; }   // a borda
    if (dy < 0) P.put(x, y, NR.prata, 3.4 - dx * 1.2 + dy * 1.4 + cg(x, y, s) * 0.5 - ((x % 5) === 2 && dy < -0.3 ? 1.1 : 0));   // as chapas
    else P.put(x, y, NR.negro, 2.6 - dy * 2 - Math.abs(dx) * 0.6 + cg(x, y, s + 3) * 0.4);
  }
  // o emissor de baixo
  P.blob(cx, 11.3, 3.8, 1.5, NR.negro, s + 4, 1.4);
  for (let x = 13; x <= 17; x++) P.put(x, 12, NR.ciano, x === 15 ? 2.6 : 1.6);
  return setO(P.done());
}

/* o olho vigia, 15 x 15: a bola branca com sombra embaixo à direita e as veias vermelhas vindo da borda; a íris e a
   pupila são outra figura (7 x 7), que olha para o herói; a vermelha é a da carga */
function olhoBola() {
  const P = cp(15, 15), s = 24501, c = 7.5, r = 6.7;
  for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
    const dx = (x + 0.5 - c) / r, dy = (y + 0.5 - c) / r, d = dx * dx + dy * dy; if (d > 1) continue;
    P.put(x, y, NR.escl, 4.2 - (dx * 0.9 + dy * 1.1) * 1.1 - d * 1.2 + cg(x, y, s) * 0.3);
  }
  // as veias: da borda para dentro, finas, com galhos
  for (let k = 0; k < 9; k++) {
    let a = k / 9 * Math.PI * 2 + hash2(k, 1, s) * 0.5, x = c + Math.cos(a) * (r - 0.4), y = c + Math.sin(a) * (r - 0.4);
    const n = 5 + Math.floor(hash2(k, 2, s) * 4);
    for (let i = 0; i < n; i++) {
      if (on(P, x, y)) P.put(x, y, NR.veia, 3.2 - i * 0.18 + (i === 0 ? 0.4 : 0));
      const ia = Math.atan2(c - y, c - x) + (hash2(k, i, s + 5) - 0.5) * 1.5;
      x += Math.cos(ia) * 0.9; y += Math.sin(ia) * 0.9;
      if (i === 2 && hash2(k, 9, s) < 0.6) { const b = ia + (hash2(k, 8, s) < 0.5 ? 1 : -1) * 1.1; for (let j = 1; j <= 2; j++) if (on(P, x + Math.cos(b) * j, y + Math.sin(b) * j)) P.put(x + Math.cos(b) * j, y + Math.sin(b) * j, NR.veia, 2.4); }
      if (Math.hypot(x - c, y - c) < 3.4) break;   // a íris cobre o meio
    }
  }
  P.put(4, 3, NR.luz, 5); P.put(5, 3, NR.luz, 4.4); P.put(4, 4, NR.luz, 4.4);   // o brilho do adesivo
  return setO(P.done());
}
function olhoIris(red) {
  const P = cp(7, 7), R = red ? NR.veia : NR.iris;
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
    const d = Math.hypot(x + 0.5 - 3.5, y + 0.5 - 3.5); if (d > 3.3) continue;
    if (d < (red ? 1.1 : 1.7)) P.put(x, y, NR.olho, 0.4);
    else P.put(x, y, R, 4.4 - d * 0.7 + (Math.atan2(y - 3, x - 3) % 1.2 < 0.25 ? 0.6 : 0) - (d > 2.8 ? 1.2 : 0));
  }
  P.put(2, 2, NR.luz, 5.6);
  return P.done();
}

/* a gosma: pendurada (12 x 15, a película grudada no teto, o pescoço e a gota), k 0-2 o balanço; inchando (sw 1-2:
   a gota cresce e aparecem os olhinhos); caindo (a gota em lágrima); no chão, a poça viva (22 x 8, a corcova anda) */
function gosmaPende(k, sw) {
  const P = cp(12, 15), s = 24601 + k * 7 + sw * 31, cx = 6 + (k === 1 ? 0.3 : k === 2 ? -0.3 : 0);
  const L = [7, 7.8, 8.4][k] + sw * 1.4, R = 2.4 + sw * 0.9;
  for (let y = 0; y < 15; y++) for (let x = 0; x < 12; x++) {
    const px = x + 0.5, py = y + 0.5;
    const half = py < 2 ? 5 - py * 1.4 : py < L - R ? lerp(1.8, 1.1, (py - 2) / Math.max(1, L - R - 2)) : -1;
    const db = Math.hypot(px - cx, (py - L) * 1.05);
    const inB = db < R, inN = half > 0 && Math.abs(px - (py < 2 ? 6 : lerp(6, cx, (py - 2) / Math.max(1, L - 2)))) < half;
    if (!inB && !inN) continue;
    let v = 3 + cg(x, y, s) * 0.4;
    if (inB) { const dx = (px - cx) / R, dy = (py - L) / R; v = 3.4 - (dx * 0.8 + dy * 0.9) * 1.2 - (dx * dx + dy * dy) * 0.6 + cg(x, y, s) * 0.3 + sw * 0.35; }
    else v -= (Math.abs(px - 6) / Math.max(0.6, half)) * 0.8;
    P.c[y * P.w + x] = GOS[clamp(Math.round(v), 0, 5)];
  }
  P.c[Math.floor(L - R * 0.45) * P.w + Math.floor(cx - R * 0.4)] = rgba('#f4ffd8', 240);   // o brilho molhado
  if (sw) { for (const ox of [-1.2, 1.2]) { P.put(cx + ox, L + 0.2, NR.olho, 0.5); } P.put(cx - 1.2, L - 0.6, NR.luz, 5); }
  return setHang(P.done());
}
function gosmaGota() {
  const P = cp(10, 13), s = 24651;
  for (let y = 0; y < 13; y++) for (let x = 0; x < 10; x++) {
    const px = x + 0.5, py = y + 0.5, db = Math.hypot(px - 5, py - 8.4), up = py < 8.4 ? (8.4 - py) / 8 : 0;
    if (db > 4 * (1 - up * up * 0.9) && !(py >= 8.4 && db <= 4)) continue;
    if (py < 8.4 && Math.abs(px - 5) > 4 * (1 - up) * (1 - up * 0.2) + 0.3) continue;
    P.c[y * P.w + x] = GOS[clamp(Math.round(3.4 - (px - 5) * 0.25 - (py - 8) * 0.22 + cg(x, y, s) * 0.4), 0, 5)];
  }
  P.put(3.4, 6.6, NR.luz, 5); P.put(3.6, 9, NR.olho, 0.5); P.put(6.4, 9, NR.olho, 0.5);
  return setO(P.done());
}
function gosmaPoca(k) {
  const P = cp(22, 8), s = 24671 + k * 7, b = [9.5, 12, 14.5][k];
  for (let x = 0; x < 22; x++) {
    const t = (x + 0.5 - 11) / 10.8; if (Math.abs(t) > 1) continue;
    const h = 2.4 * Math.sqrt(1 - t * t) + 2.2 * Math.exp(-((x + 0.5 - b) * (x + 0.5 - b)) / 7) + (hash2(x, k, s) < 0.2 ? 0.4 : 0), top = 8 - h;
    for (let y = Math.floor(top); y < 8; y++) {
      if (y + 1 <= top) continue;
      const v = 3 + (y === Math.floor(top) ? 1.6 : 0) - (y - top) * 0.35 - (x > b ? 0.2 : 0) + cg(x, y, s) * 0.5;
      P.c[y * P.w + x] = GOS[clamp(Math.round(v), 0, 5)];
    }
  }
  // bolhas (aneizinhos claros) e os dois olhinhos na corcova da frente
  for (const [x, y] of [[5, 6], [9, 5], [17, 6]]) if (on(P, x, y)) P.put(x, y, NR.pele, 5);
  const ey = Math.round(8 - 2.2 - 2.4 * Math.sqrt(Math.max(0, 1 - ((b + 2 - 11) / 10.8) ** 2))) + 1;
  for (const ox of [1, 4]) { P.put(b + ox, ey, NR.olho, 0.5); P.put(b + ox + 1, ey, NR.olho, 1); P.put(b + ox, ey - 1, NR.luz, 5); P.put(b + ox + 1, ey - 1, NR.olho, 0.5); }
  return setO(P.done());
}

NV1.get = () => NV1.ready || (NV1.ready = {
  vis: [0, 1, 2, 3, 4, 5, 6].map(p => alien(p, false)),
  atr: [0, 1, 2, 3, 4].map(p => alien(p, true)),
  disco: disco(),
  olho: olhoBola(), iris: olhoIris(false), irisV: olhoIris(true),
  pende: [0, 1, 2].map(k => gosmaPende(k, 0)), incha: [1, 2].map(sw => gosmaPende(2, sw)), gota: gosmaGota(), poca: [0, 1, 2].map(gosmaPoca)
});
NV1.GL = {
  verde: glow(4, '#7dff3a'), verdeG: glow(10, '#7dff3a'), rosa: glow(4, '#ff3ec8'), rosaG: glow(9, '#ff3ec8'),
  ciano: glow(4, '#36f0ff'), cianoG: glow(14, '#36f0ff'), verm: glow(4, '#ff3b3b'), vermG: glow(9, '#ff3b3b'),
  branco: glow(8, '#e8fbff'), arco: NV_ARCO.map(c => glow(3, c)), feixe: NV_ARCO.map(c => glow(9, c))
};
}

/* ================= desenho ================= */
// a figura com o ponto de apoio (ax, ay) no centro dos pés quando ela olha para a direita
function nv1Blit(img, e, fx, fy, ax, ay, jx = 0) { lc.drawImage(img, Math.round((e.facing > 0 ? fx - ax : fx - (img.width - ax)) + jx), fy - ay); }
const nv1Jit = (e, on, k = 44) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
const nv1VisPose = e => e.state === 'wind' ? 3 : e.state === 'stab' || e.state === 'gap' ? 4 : e.state === 'flee' ? (e.onGround && Math.abs(e.vx) > 4 ? 5 + Math.floor(e.t * 14) % 2 : 5) : !e.onGround ? 1 : Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 11) % 2 : 0;
const nv1AtrPose = e => e.state === 'aim' ? 3 : e.state === 'burst' ? (e.stateT > 0.1 ? 4 : 3) : !e.onGround ? 1 : Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 9) % 2 : 0;
// a ponta da sonda / o cano, em pixels do mundo
function nv1Tip(e, tab, k) { const [x, y] = tab[k]; return [e.x + e.w / 2 + (x - 9.3) * e.facing, e.y + e.h - 22 + y + 0.5]; }
DRAW_E.visitante = (e, fx, fy, fl) => {
  const k = nv1VisPose(e), bob = k === 0 ? (Math.sin(e.t * 3 + e.seed) > 0.6 ? 1 : 0) : 0;
  nv1Blit(cvPick(NV1.get().vis[k], e, fl), e, fx, fy + bob, 10.3, 23, nv1Jit(e, e.state === 'wind'));
};
DRAW_E.atirador = (e, fx, fy, fl) => {
  const B = NV1.get().atr, k = nv1AtrPose(e);
  if (e.state === 'blink') {   // reaparecendo: tremeluz, um contorno branco que some
    const a = clamp(e.stateT / 0.3, 0, 1);
    lc.globalAlpha = 1 - a * 0.6; nv1Blit(cvPick(B[0], e, false), e, fx, fy, 10.3, 23);
    lc.globalAlpha = a; nv1Blit(cvPick(B[0], e, true), e, fx, fy, 10.3, 23); lc.globalAlpha = 1; return;
  }
  nv1Blit(cvPick(B[k], e, fl), e, fx, fy, 10.3, 23, nv1Jit(e, e.state === 'aim', 30));
};
const nv1DiscoBob = e => e.state === 'beam' ? 0 : Math.round(Math.sin(e.t * 2.4 + e.seed) * 1.2);
DRAW_E.disco = (e, fx, fy, fl) => {
  const S = NV1.get().disco, img = fl ? S.wr : S.r, j = e.state === 'spin' ? Math.round(Math.sin(e.t * 60) * 0.6) : 0;
  lc.drawImage(img, Math.round(fx - img.width / 2) + j, Math.round(fy - e.h / 2 - img.height / 2) + nv1DiscoBob(e) - 1);
};
// para onde o olho olha: o herói (ou a linha da mira enquanto carrega)
function nv1OlhoDir(e) { const a = e.state === 'charge' || e.state === 'beam' ? e.aimA : (e.lookA ?? 0); return [Math.cos(a), Math.sin(a)]; }
const nv1OlhoBob = e => Math.round(Math.sin(e.t * 1.8 + e.seed) * 1.4);
DRAW_E.olho = (e, fx, fy, fl) => {
  const B = NV1.get(), cx = fx, cy = fy - e.h / 2 + nv1OlhoBob(e), [ux, uy] = nv1OlhoDir(e);
  // o nervo pendurado atrás, balançando
  for (let i = 1; i <= 6; i++) {
    const w = Math.sin(e.t * 5 + i * 0.9) * i * 0.35, x = cx - ux * (6 + i * 1.3) + w * -uy, y = cy - uy * (6 + i * 1.3) + w * ux + i * 0.5;
    lc.fillStyle = i < 3 ? '#a01420' : i < 5 ? '#d42a34' : '#f05a5a'; lc.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  const ball = B.olho;
  lc.drawImage(fl ? ball.wr : ball.r, Math.round(cx - ball.r.width / 2), Math.round(cy - ball.r.height / 2));
  if (fl) return;
  const ir = e.state === 'charge' || e.state === 'beam' ? B.irisV : B.iris;
  lc.drawImage(ir, Math.round(cx - 3.5 + ux * 2.6), Math.round(cy - 3.5 + uy * 2.6));
};
DRAW_E.gosma = (e, fx, fy, fl) => {
  const B = NV1.get(), st = e.state;
  if (st === 'hang' || st === 'swell') {
    let img;
    if (st === 'swell') img = B.incha[clamp(Math.floor((1 - e.stateT / NV1_INCHA) * 2), 0, 1)];
    else img = B.pende[[0, 1, 2, 1][Math.floor(e.t * 1.6 + e.seed) % 4]];
    const j = nv1Jit(e, st === 'swell', 40);
    lc.drawImage(fl ? img.wr : img.r, Math.round(fx - img.r.width / 2) + j, fy - e.h - 1); return;
  }
  if (st === 'fall') { const img = B.gota; lc.drawImage(fl ? img.wr : img.r, Math.round(fx - img.r.width / 2), fy - img.r.height + 1); return; }
  const k = e.onGround && Math.abs(e.vx) > 2 ? Math.floor(e.t * 4) % 3 : 1, img = cvPick(B.poca[k], e, fl);
  lc.drawImage(img, Math.round(fx - img.width / 2), fy - img.height + 1);
};
// os brilhos do próprio bicho (passada aditiva)
EYES_E.visitante = (e, fx, fy) => {
  const [x, y] = nv1Tip(e, NV1_TIP, nv1VisPose(e)), sx = x - (e.x + e.w / 2) + fx, sy = y - (e.y + e.h) + fy, G = NV1.GL;
  if (e.state === 'wind') { const k = clamp(1 - e.stateT / NV1_SONDA, 0, 1); lc.globalAlpha = 0.3 + 0.5 * k; lc.drawImage(G.verdeG, sx - 10, sy - 10); }
  else if (e.state === 'stab' || e.state === 'gap') { lc.globalAlpha = 0.6; lc.drawImage(G.verdeG, sx - 10, sy - 10); }
  else { lc.globalAlpha = 0.35; lc.drawImage(G.verde, sx - 4, sy - 4); }
};
EYES_E.atirador = (e, fx, fy) => {
  if (e.state === 'blink') return;
  const [x, y] = nv1Tip(e, NV1_CANO, nv1AtrPose(e)), sx = x - (e.x + e.w / 2) + fx, sy = y - (e.y + e.h) + fy, G = NV1.GL;
  if (e.state === 'aim') { const k = clamp(1 - e.stateT / NV1_MIRA, 0, 1); lc.globalAlpha = 0.3 + 0.6 * k; lc.drawImage(G.rosaG, sx - 9, sy - 9); }
  else if (e.state === 'burst') { lc.globalAlpha = 0.9; lc.drawImage(G.rosaG, sx - 9, sy - 9); }
  else { lc.globalAlpha = 0.3; lc.drawImage(G.rosa, sx - 4, sy - 4); }
  lc.globalAlpha = 0.12; lc.drawImage(G.ciano, fx - 4 + e.facing, fy - 22);   // o vidro do capacete
};
EYES_E.disco = (e, fx, fy) => {
  const G = NV1.GL, cy = fy - e.h / 2 + nv1DiscoBob(e);
  lc.globalAlpha = 0.22; lc.drawImage(G.branco, fx - 8, cy - 12);
  if (e.state === 'spin' || e.state === 'beam') { lc.globalAlpha = e.state === 'beam' ? 0.7 : 0.25 + 0.4 * (1 - e.stateT / NV1_GIRA); lc.drawImage(G.cianoG, fx - 14, cy + 2 - 14); }
};
EYES_E.olho = (e, fx, fy) => {
  const G = NV1.GL, cy = fy - e.h / 2 + nv1OlhoBob(e), [ux, uy] = nv1OlhoDir(e), x = fx + ux * 2.6, y = cy + uy * 2.6;
  if (e.state === 'charge' || e.state === 'beam') { lc.globalAlpha = e.state === 'beam' ? 0.9 : 0.25 + 0.5 * (1 - e.stateT / NV1_CARGA); lc.drawImage(G.vermG, x - 9, y - 9); }
  else { lc.globalAlpha = 0.18; lc.drawImage(G.ciano, x - 4, y - 4); }
};
EYES_E.gosma = (e, fx, fy) => {
  const G = NV1.GL;
  if (e.state === 'hang') { lc.globalAlpha = 0.18 + 0.06 * Math.sin(e.t * 2 + e.seed); lc.drawImage(G.verde, fx - 4, fy - 5); }
  else if (e.state === 'swell') { lc.globalAlpha = 0.3 + 0.6 * (1 - e.stateT / NV1_INCHA); lc.drawImage(G.verdeG, fx - 10, fy - 8); }
  else if (e.state === 'fall') { lc.globalAlpha = 0.5; lc.drawImage(G.verdeG, fx - 10, fy - 12); }
  else { lc.globalAlpha = 0.28; lc.drawImage(G.verdeG, fx - 10, fy - 8); }
};
WARN_E.visitante = e => e.state === 'wind';
WARN_E.atirador = e => e.state === 'aim';
WARN_E.disco = e => e.state === 'spin';
WARN_E.olho = e => e.state === 'charge';
WARN_E.gosma = e => e.state === 'swell';

/* ================= comportamento ================= */
const nv1Raios = [], nv1Flashes = [];
const nv1Live = e => e && !e.dead && enemies.includes(e);
const nv1Near = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
const nv1Drag = (e, k, dt) => { const f = Math.pow(k, dt); e.vx *= f; e.vy *= f; };
function nv1Sparks(x, y, n, cols, sp = 40, g = 0, life = 0.35) {
  if (parts.length > 650) return;
  for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1, glow: true });
}
const NV1_VERDE = ['#7dff3a', '#c8ff7a', '#e8ffd0'], NV1_ROSA = ['#ff3ec8', '#ff8ae0', '#ffd0f4'], NV1_CIANO = ['#36f0ff', '#9af8ff', '#e0feff'], NV1_GOSMA = ['#6cd422', '#94f03c', '#4aa814', '#c8ff7a'];
// a distância (px) até o outro do bando mais perto (guardada por meio segundo)
function nv1Friend(e, dt) {
  e.frT = (e.frT || 0) - dt; if (e.frT > 0) return e.frD;
  e.frT = 0.4 + Math.random() * 0.2; e.frD = 1e9;
  for (const o of enemies) if (o !== e && !o.dead && NV1_BANDO.has(o.type)) e.frD = Math.min(e.frD, Math.hypot(o.x - e.x, o.y - e.y));
  return e.frD;
}
// andando até onde o alarme tocou (e.callT): direção no chão
function nv1CallDir(e, dt) { e.callT -= dt; const d = e.callX - (e.x + e.w / 2); if (Math.abs(d) < T) { e.callT = 0; return 0; } return Math.sign(d); }

/* ---------- o Visitante ---------- */
AI.visitante = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.braveT = (e.braveT || 0) - dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'wind') {   // a sonda erguida, estalando verde
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 30) { const [x, y] = nv1Tip(e, NV1_TIP, 3); nv1Sparks(x, y, 1, NV1_VERDE, 50, 0, 0.18); }
    if (e.stateT <= 0) nv1Stab(e, 1);
    return;
  }
  if (e.state === 'stab') {
    const hb = { x: e.facing > 0 ? ecx : ecx - 21, y: e.y - 2, w: 21, h: e.h + 2 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { const [x, y] = nv1Tip(e, NV1_TIP, 4); nv1Sparks(x, y, 6, NV1_VERDE, 70); } }
    e.vx = approach(e.vx, 0, 600 * dt);
    if (e.stateT <= 0) { if (e.stabN === 1) { e.state = 'gap'; e.stateT = 0.1; } else { e.state = 'recover'; e.stateT = 0.4; e.atkCD = 1 + Math.random() * 0.6; } }
    return;
  }
  if (e.state === 'gap') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) nv1Stab(e, 2); return; }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  const fr = nv1Friend(e, dt);
  if (e.state === 'flee') {   // sozinho: corre para longe chilreando, até achar os outros (ou ser encurralado)
    const dir = -Math.sign(dx) || -e.facing;
    const got = walk(e, dt, dir, 70 + e.lvl * 0.8, 800, 290, dy, false);
    e.facing = got || dir;
    e.stuckT = !got || Math.abs(e.vx) < 8 ? (e.stuckT || 0) + dt : 0;
    e.chirpT = (e.chirpT || 0) - dt; if (e.chirpT <= 0) { e.chirpT = 0.5 + Math.random() * 0.4; const v = nv1Near(e, 240); if (v > 0.05) sfx.nv1Chirp(v, 1.3); }
    if (fr < 5 * T || e.stateT <= 0 || e.stuckT > 0.7 || pl.dead) { e.state = 'walk'; e.braveT = 8; e.atkCD = Math.min(e.atkCD, 0.3); if (!pl.dead) { e.callX = pl.x + pl.w / 2; e.callT = 6; e.memT = 4; } if (nv1Near(e) > 0.05) sfx.nv1Chirp(nv1Near(e), 0.8); }
    return;
  }
  // ficou sozinho com o herói por perto: foge e chama
  if (aggro && e.braveT <= 0 && dist < 120 && fr > 10 * T) {
    e.state = 'flee'; e.stateT = 3 + Math.random() * 2; e.stuckT = 0; e.chirpT = 0;
    nvAlarme(ecx, e.y + e.h / 2, 12);
    return;
  }
  let dir = 0, chase = false;
  if (aggro) { dir = Math.abs(dx) < 9 ? 0 : Math.sign(dx); chase = true; }
  else if (e.callT > 0) dir = nv1CallDir(e, dt);
  else { cvWander(e, dt); dir = e.wander; }
  if (dir) e.facing = dir; else if (aggro) e.facing = Math.sign(dx) || e.facing;
  walk(e, dt, dir, (aggro || e.callT > 0 ? 62 : 30) + e.lvl * 0.8, 700, 280, dy, chase);
  e.chirpT = (e.chirpT ?? Math.random() * 4) - dt;
  if (e.chirpT <= 0) { e.chirpT = 3 + Math.random() * 4; const v = nv1Near(e, 200); if (v > 0.05) sfx.nv1Chirp(v * 0.7, 1); }
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 24 && Math.abs(dy) < 14 && e.onGround && clearPath(e, pl)) {
    e.state = 'wind'; e.stateT = NV1_SONDA; e.vx = 0; e.facing = Math.sign(dx) || e.facing; sfx.nv1Sonda(Math.max(0.4, nv1Near(e)));
  }
};
function nv1Stab(e, n) { e.state = 'stab'; e.stateT = 0.13; e.stabN = n; e.swingHit = false; e.vx = e.facing * 95; sfx.nv1Choque(n === 2 ? 1.1 : 1); const [x, y] = nv1Tip(e, NV1_TIP, 4); nv1Sparks(x, y, 4, NV1_VERDE, 60); }

/* ---------- o Visitante de Capacete ---------- */
AI.atirador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.blinkCD = (e.blinkCD || 0) - dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'blink') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.min(e.atkCD, 0.5); } return; }
  // o herói chegou perto: um estalo ciano e ele está 6 blocos para trás
  if (aggro && e.blinkCD <= 0 && dist < 3 * T && e.state !== 'burst' && nv1Blink(e, dx)) return;
  if (e.state === 'aim') {
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    const k = Math.min(1, dt * 7); e.aimX = lerp(e.aimX ?? pcx, pcx, k); e.aimY = lerp(e.aimY ?? pcy, pcy, k);
    if (e.stateT <= 0) { e.state = 'burst'; e.stateT = 0; e.shotN = 0; }
    return;
  }
  if (e.state === 'burst') {   // três raios em sequência, a mira segue o herói devagar
    e.vx = approach(e.vx, 0, 700 * dt);
    const k = Math.min(1, dt * 4); e.aimX = lerp(e.aimX, pcx, k); e.aimY = lerp(e.aimY, pcy, k);
    if (e.stateT <= 0) {
      nv1Shoot(e); e.shotN++;
      if (e.shotN >= 3) { e.state = 'recover'; e.stateT = 0.5; e.atkCD = 1.6 + Math.random() * 0.7; } else e.stateT = 0.16;
    }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  let dir = 0;
  if (aggro) { const adx = Math.abs(dx); dir = adx < NV1_LONGE - 16 ? -Math.sign(dx) : adx > NV1_LONGE + 22 ? Math.sign(dx) : 0; }
  else if (e.callT > 0) dir = nv1CallDir(e, dt);
  else { cvWander(e, dt); dir = e.wander; }
  const got = walk(e, dt, dir, (aggro ? 44 : 26) + e.lvl * 0.6, 500, 270, dy, aggro && dir === Math.sign(dx));
  e.facing = aggro ? (Math.sign(dx) || e.facing) : got || e.facing;
  if (aggro && e.atkCD <= 0 && dist < 210 && dist > 20 && e.onGround) {
    const [gx, gy] = nv1Tip(e, NV1_CANO, 3);
    if (losClear(gx, gy, pcx, pcy)) { e.state = 'aim'; e.stateT = NV1_MIRA; e.aimX = pcx; e.aimY = pcy; e.vx = 0; sfx.nv1Mira(Math.max(0.35, nv1Near(e, 260))); }
  }
};
function nv1Shoot(e) {
  const [ox, oy] = nv1Tip(e, NV1_CANO, 4), a = Math.atan2(e.aimY - oy, e.aimX - ox), sp = 240;
  nv1Raios.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: e.dmg, life: 1.4, src: e.x + e.w / 2 });
  nv1Sparks(ox, oy, 3, NV1_ROSA, 40);
  sfx.nv1Zap(Math.max(0.3, nv1Near(e, 260)));
}
// o teleporte: o primeiro chão livre a 6 (ou 5, 4) blocos para trás, na altura dos pés ou perto
function nv1Blink(e, dx) {
  const away = -Math.sign(dx) || -e.facing, fy = Math.floor((e.y + e.h + 1) / T);
  for (const n of [6, 5, 4, 7]) {
    const nx = e.x + away * n * T, col = Math.floor((nx + e.w / 2) / T);
    for (const k of [0, -1, 1, -2, 2, -3, 3]) {
      const row = fy + k, ny = row * T - e.h;
      if (!solidAt(col, row) || rectSolid(nx, ny, e.w, e.h) || lavaIn(nx, ny, e.w, e.h)) continue;
      if (!solidAt(Math.floor((nx + 1) / T), row) && !solidAt(Math.floor((nx + e.w - 1) / T), row)) continue;
      nv1Flash(e.x + e.w / 2, e.y + e.h / 2);
      e.x = nx; e.y = ny; e.vx = 0; e.vy = 0; e.state = 'blink'; e.stateT = 0.3; e.blinkCD = 3 + Math.random() * 1.5; e.facing = -away;
      nv1Flash(e.x + e.w / 2, e.y + e.h / 2);
      sfx.nv1Blink(Math.max(0.4, nv1Near(e, 260)));
      return true;
    }
  }
  e.blinkCD = 0.8; return false;
}
function nv1Flash(x, y) { nv1Flashes.push({ x, y, t: 0 }); nv1Sparks(x, y, 10, NV1_CIANO, 70, 0, 0.4); }

/* ---------- o Disco Abdutor ---------- */
// a meia-largura do feixe a y px abaixo do disco (abre em cone), e o fim dele (o primeiro chão embaixo)
const nv1FeixeW = (e, y) => 4 + clamp(y / Math.max(1, e.beamL || 1), 0, 1) * 7;
function nv1FeixeFim(e) {
  const tx = Math.floor((e.x + e.w / 2) / T), y0 = e.y + e.h, ty = Math.floor(y0 / T);
  for (let k = 0; k < 16; k++) if (solidAt(tx, ty + k)) return Math.max(y0 + 2, (ty + k) * T);
  return y0 + 16 * T;
}
// a altura de voo: uns 5 blocos acima da cabeça do herói, ou logo abaixo do teto
function nv1Ceu(e) {
  const tx = Math.floor((pl.x + pl.w / 2) / T), ty = Math.floor(pl.y / T);
  let y = pl.y - 5.5 * T;
  for (let k = 1; k <= 7; k++) if (solidAt(tx, ty - k)) { y = Math.max(y, (ty - k + 1) * T + 3); break; }
  return Math.min(y, pl.y - 2 * T - e.h);
}
AI.disco = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  e.spin = (e.spin || 0) + dt * (e.state === 'spin' ? 16 : e.state === 'beam' ? 10 : 2.5);
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'spin') {   // a borda gira, as luzes correm; ele se ajeita em cima do herói
    const ty = nv1Ceu(e) + e.h / 2;
    e.vx = lerp(e.vx, clamp((pcx - ecx) * 2.2, -60, 60), Math.min(1, dt * 4)); e.vy = lerp(e.vy, clamp((ty - ecy) * 2, -40, 40), Math.min(1, dt * 3));
    if (e.stateT <= 0) { e.state = 'beam'; e.stateT = NV1_FEIXE; e.beamHit = false; e.beamK = 0; e.vy = 0; sfx.nv1Feixe(Math.max(0.4, nv1Near(e, 280)), NV1_FEIXE); }
    return;
  }
  if (e.state === 'beam') {   // o feixe: quase parado (o herói sai andando para o lado)
    e.vx = lerp(e.vx, clamp((pcx - ecx) * 0.5, -12, 12), Math.min(1, dt * 2)); e.vy *= Math.pow(0.02, dt);
    e.beamK = Math.min(1, (e.beamK || 0) + dt * 6);
    const y0 = e.y + e.h, y1 = nv1FeixeFim(e); e.beamY = y0 + (y1 - y0) * e.beamK; e.beamL = e.beamY - y0;
    if (!pl.dead && pl.y + pl.h > y0 && pl.y < e.beamY) {
      const hy = clamp(pl.y + pl.h / 2 - y0, 0, e.beamL), hw = nv1FeixeW(e, hy);
      if (Math.abs(pcx - ecx) < hw + pl.w / 2 - 2) {
        nvAbduzir(e, NV1_PUXA);
        if (Math.random() < dt * 20) nv1Sparks(pcx + rnd(-6, 6), pl.y + pl.h, 1, NV_ARCO, 10, -60, 0.6);
        if (!e.beamHit && pl.y <= y0 + 5) {   // chegou no disco: a descarga, e o feixe solta
          e.beamHit = true; hurtPlayer(e.dmg, ecx, null, true); nv1Sparks(pcx, pl.y, 12, NV1_CIANO, 80, 0, 0.4); sfx.nv1Choque(1.2);
          e.stateT = Math.min(e.stateT, 0.15);
        }
      }
    }
    if (e.stateT <= 0) { e.state = 'fly'; e.atkCD = 2.4 + Math.random() * 1.2; e.beamY = undefined; }
    return;
  }
  // voando alto: segue o herói por cima, balançando; sem herói, passeia em volta de onde nasceu
  e.state = 'fly';
  let tx, ty;
  if (aggro) { tx = pcx + Math.sin(e.t * 0.55 + e.seed) * 46; ty = nv1Ceu(e) + e.h / 2; }
  else { tx = (e.homeX ?? ecx) + Math.sin(e.t * 0.3 + e.seed) * 60; ty = (e.homeY ?? ecy) + Math.sin(e.t * 0.8 + e.seed) * 8; }
  const k = Math.min(1, dt * 1.6);
  e.vx = lerp(e.vx, clamp((tx - ecx) * 1.4, -75, 75), k); e.vy = lerp(e.vy, clamp((ty - ecy) * 1.4, -55, 55), k);
  if (e.hitWall) e.vx *= -0.5; if (e.hitCeil) e.vy = Math.abs(e.vy) * 0.5;
  e.facing = Math.abs(e.vx) > 5 ? Math.sign(e.vx) : e.facing;
  if (aggro && e.atkCD <= 0 && Math.abs(pcx - ecx) < 2.5 * T && dy > 2 * T && dy < 12 * T && losClear(ecx, e.y + e.h + 2, pcx, pl.y + 2)) {
    e.state = 'spin'; e.stateT = NV1_GIRA; sfx.nv1Wooo(Math.max(0.4, nv1Near(e, 280)), NV1_GIRA);
  }
};

/* ---------- o Olho Vigia ---------- */
// o raio do olho em linha reta até a pedra (px)
function nv1Linha(x0, y0, a, max) {
  const ux = Math.cos(a), uy = Math.sin(a);
  for (let d = 4; d < max; d += 3) if (solidAt(Math.floor((x0 + ux * d) / T), Math.floor((y0 + uy * d) / T))) return d;
  return max;
}
function nv1SegDist(px, py, x0, y0, x1, y1) { const vx = x1 - x0, vy = y1 - y0, L = vx * vx + vy * vy || 1, t = clamp(((px - x0) * vx + (py - y0) * vy) / L, 0, 1); return Math.hypot(px - x0 - vx * t, py - y0 - vy * t); }
const nv1OlhoC = e => [e.x + e.w / 2, e.y + e.h / 2 + nv1OlhoBob(e)];
AI.olho = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const [ecx, ecy] = nv1OlhoC(e), pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2, toP = Math.atan2(pcy - ecy, pcx - ecx);
  // viu o herói: o alarme (os Visitantes num raio de 14 vêm)
  if (e.sees && !pl.dead) { e.calmT = 0; if (!e.alarmed) { e.alarmed = true; nvAlarme(ecx, ecy, 14); sfx.nv1Alarme(Math.max(0.35, nv1Near(e, 300))); e.alarmFx = 1; } }
  else { e.calmT = (e.calmT || 0) + dt; if (e.calmT > 10) e.alarmed = false; }
  if (e.alarmFx > 0) e.alarmFx -= dt;
  { let d = toP - (e.lookA ?? toP); while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; e.lookA = (e.lookA ?? toP) + d * Math.min(1, dt * (aggro ? 5 : 1)); if (!aggro) e.lookA += Math.sin(e.t * 0.7 + e.seed) * dt * 0.8; }
  if (e.state === 'charge') {   // a linha fina engrossa; a mira segue o herói cada vez mais devagar
    nv1Drag(e, 0.05, dt);
    const k = clamp(1 - e.stateT / NV1_CARGA, 0, 1);
    let d = toP - e.aimA; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    e.aimA += clamp(d, -1, 1) * Math.min(1, dt * (5 - k * 4.2));
    e.lineL = nv1Linha(ecx, ecy, e.aimA, 18 * T);
    if (e.stateT <= 0) { e.state = 'beam'; e.stateT = NV1_RAIO; e.beamHit = false; sfx.nv1Raio(Math.max(0.4, nv1Near(e, 300))); }
    return;
  }
  if (e.state === 'beam') {   // o raio contínuo, parado na linha
    nv1Drag(e, 0.02, dt);
    e.lineL = nv1Linha(ecx, ecy, e.aimA, 18 * T);
    const x1 = ecx + Math.cos(e.aimA) * e.lineL, y1 = ecy + Math.sin(e.aimA) * e.lineL;
    if (!e.beamHit && !pl.dead) {
      const d = Math.min(nv1SegDist(pcx, pl.y + 3, ecx, ecy, x1, y1), nv1SegDist(pcx, pcy, ecx, ecy, x1, y1), nv1SegDist(pcx, pl.y + pl.h - 3, ecx, ecy, x1, y1));
      if (d < pl.w / 2 + 2) { e.beamHit = true; hurtPlayer(e.dmg, ecx, null, true); nv1Sparks(pcx, pcy, 8, ['#ff3b3b', '#ff9a90', '#ffffff'], 60); }
    }
    if (Math.random() < dt * 30) nv1Sparks(x1, y1, 1, ['#ff3b3b', '#ffd0c0'], 50, 200, 0.3);
    if (e.stateT <= 0) { e.state = 'drift'; e.atkCD = 2.2 + Math.random() * 0.9; }
    return;
  }
  // flutuando devagar, sempre longe (uns 9 blocos) e um pouco acima
  e.state = 'drift';
  let tx, ty;
  if (aggro) { const a = Math.atan2(ecy - pcy, ecx - pcx), R = 9 * T; tx = pcx + Math.cos(a) * R; ty = pcy + Math.sin(a) * R * 0.6 - 2 * T; }
  else { tx = (e.homeX ?? ecx) + Math.sin(e.t * 0.25 + e.seed) * 30; ty = (e.homeY ?? ecy) + Math.cos(e.t * 0.4 + e.seed) * 10; }
  const k = Math.min(1, dt * 1.2), sp = aggro && dist < 5 * T ? 40 : 24;
  e.vx = lerp(e.vx, clamp((tx - ecx) * 0.8, -sp, sp), k); e.vy = lerp(e.vy, clamp((ty - ecy) * 0.8, -sp, sp), k);
  if (e.hitWall) e.vx *= -0.5; if (e.hitCeil || e.onGround) e.vy *= -0.5;
  e.facing = Math.cos(e.lookA) >= 0 ? 1 : -1;
  if (aggro && e.atkCD <= 0 && dist < 17 * T && dist > 2 * T && losClear(ecx, ecy, pcx, pcy)) {
    e.state = 'charge'; e.stateT = NV1_CARGA; e.aimA = toP; e.lineL = nv1Linha(ecx, ecy, toP, 18 * T); sfx.nv1Carga(Math.max(0.35, nv1Near(e, 300)));
  }
};

/* ---------- a Gosma Viva ---------- */
const NV1_POCA_W = 18, NV1_POCA_H = 5;
// o teto acima: gruda a gota nele se houver uns 3 blocos de vão embaixo
function nv1ToRoof(e, max = 12) {
  const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h - 1) / T);
  for (let k = 0; k < max; k++) {
    if (!solidAt(tx, ty - k)) continue;
    const r = ty - k + 1;
    if (solidAt(tx, r) || solidAt(tx, r + 1) || solidAt(tx, r + 2)) return false;
    const x = tx * T + T / 2 - e.w / 2;
    if (rectSolid(x, r * T, e.w, e.h)) return false;
    e.x = x; e.y = r * T; return true;
  }
  return false;
}
function nv1Resize(e, w, h) { const cx = e.x + e.w / 2, by = e.y + e.h; e.w = w; e.h = h; e.x = cx - w / 2; e.y = by - h; for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= 2; }
AI.gosma = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'hang' || e.state === 'swell') e.atkCD = Math.max(e.atkCD, 0.3);   // pendurada não morde
  if (e.state === 'hang') {
    e.vx = 0; e.vy = 0;
    if (!rectSolid(e.x, e.y - 2, e.w, 2)) { nv1GosmaSolta(e); return; }   // quebraram o teto
    if (Math.random() < dt * 0.25) parts.push({ x: ecx + rnd(-1, 1), y: e.y + e.h + 1, vx: 0, vy: 20, g: 500, life: 0.8, max: 0.8, col: '#94f03c', size: 1 });   // um pingo de disfarce
    if (!pl.dead && Math.abs(pcx - ecx) < 16 && pl.y > e.y + e.h && pl.y - e.y < 10 * T && losClear(ecx, e.y + e.h + 1, pcx, pl.y + 2)) {
      e.state = 'swell'; e.stateT = NV1_INCHA; sfx.nv1Incha(Math.max(0.4, nv1Near(e)));
    }
    return;
  }
  if (e.state === 'swell') { e.vx = 0; e.vy = 0; if (e.stateT <= 0) nv1GosmaSolta(e); return; }
  if (e.state === 'fall') {
    e.atkCD = Math.max(e.atkCD, 0.1);
    e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); e.vx = approach(e.vx, 0, 200 * dt);
    if (!e.fallHit && !e.quiet && !pl.dead && overlap(e, pl)) { e.fallHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') nvGrudar(NV1_GRUDA); }
    if (e.onGround) nv1GosmaPousa(e);
    return;
  }
  // a poça viva: anda devagar, ondulando; quem pisa gruda
  e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 4 ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  if (dir && e.onGround && ledgeAhead(e, dir, dy, false) === 'stop') { dir = 0; if (!aggro) e.wander = -e.wander; }
  if (dir && e.hitWall && !aggro) e.wander = -e.wander;
  if (dir) e.facing = dir;
  const push = 0.4 + 0.6 * Math.max(0, Math.sin(e.t * 4));   // anda aos empurrões, como a corcova
  e.vx = approach(e.vx, dir * (13 + e.lvl * 0.3) * push, 120 * dt);
  if (!pl.dead && overlap(e, pl)) nvGrudar(NV1_GRUDA);
  e.slurpT = (e.slurpT ?? Math.random()) - dt;
  if (e.slurpT <= 0) { e.slurpT = 0.9 + Math.random() * 0.8; const v = nv1Near(e, 160); if (v > 0.08) sfx.nv1Squelch(v * 0.6); if (Math.random() < 0.5) parts.push({ x: ecx + rnd(-6, 6), y: e.y + 1, vx: 0, vy: -8, g: -10, life: 0.5, max: 0.5, col: '#c8ff7a', size: 1, glow: true }); }
};
function nv1GosmaSolta(e) { e.state = 'fall'; e.vy = 40; e.fallHit = false; sfx.nv1Solta(Math.max(0.3, nv1Near(e))); }
function nv1GosmaPousa(e) {
  e.state = 'poca'; e.quiet = false; nv1Resize(e, NV1_POCA_W, NV1_POCA_H); e.atkCD = Math.max(e.atkCD, 0.5);
  burst(e.x + e.w / 2, e.y + e.h - 1, 12, '#6cd422', 70, 300, 0.5);
  nv1Sparks(e.x + e.w / 2, e.y + e.h - 2, 5, NV1_GOSMA, 50, 300, 0.4);
  const v = nv1Near(e, 200); if (v > 0.05) sfx.nv1Splat(v);
  if (!pl.dead && overlap(e, pl)) nvGrudar(NV1_GRUDA);
}

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const st = e && !e.dead && e.type === 'gosma' ? e.state : null;
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !NV1_TYPES.includes(e.type)) return r;
  if (e.type === 'gosma') { if (st === 'hang' || st === 'swell') { e.vx = 0; nv1GosmaSolta(e); } else { e.stun = Math.min(e.stun, 0.15); } sfx.nv1Squelch(0.7); }
  if (e.type === 'olho' && e.state === 'charge' && e.stun > 0) { e.state = 'drift'; e.atkCD = Math.max(e.atkCD, 1); }   // o golpe fecha o olho
  if (e.type === 'disco' && e.state === 'beam') e.stun = Math.min(e.stun, 0.08);   // o feixe não pisca
  if ((e.type === 'visitante' || e.type === 'atirador') && Math.random() < 0.5) sfx.nv1Chirp(0.6, 1.6);
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!NV1_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, nv1Near(e, 260));
  if (e.type === 'visitante' || e.type === 'atirador') {
    nv1Sparks(cx, cy - 3, 6, NV1_VERDE, 50, 100, 0.5);
    if (e.type === 'atirador') nv1Sparks(cx, e.y + 2, 8, NV1_CIANO, 70, 300, 0.5);   // o vidro do capacete
    sfx.nv1Morre(v);
  } else if (e.type === 'disco') {
    nv1Sparks(cx, cy, 16, NV_ARCO, 90, 120, 0.7); burst(cx, cy, 14, '#7c8494', 90, 300, 0.7); nv1Flash(cx, cy);
    sfx.nv1DiscoMorre(v);
  } else if (e.type === 'olho') { burst(cx, cy, 14, '#f4f0ec', 80, 300, 0.5); burst(cx, cy, 8, '#d42a34', 70, 300, 0.5); sfx.nv1Splat(v * 0.8); }
  else if (e.type === 'gosma') { burst(cx, cy, 18, '#6cd422', 90, 300, 0.6); nv1Sparks(cx, cy, 8, NV1_GOSMA, 60, 300, 0.5); sfx.nv1Splat(v); }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !NV1_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'visitante') { e.state = 'walk'; e.braveT = 1.5; }
  else if (type === 'atirador') { e.state = 'walk'; e.blinkCD = 0.5; }
  else if (type === 'disco') { e.state = 'fly'; e.spin = Math.random() * 6; }
  else if (type === 'olho') { e.state = 'drift'; e.lookA = Math.random() * 6.28; e.alarmed = false; }
  else if (type === 'gosma') { if (nv1ToRoof(e)) e.state = 'hang'; else { e.state = 'fall'; e.quiet = true; } }   // sem teto perto: já nasce poça
  return e;
}; }

/* ---------- a cada quadro: os alarmes, os raios, os estalos ---------- */
function nv1Update(dt) {
  // os alarmes (240): os Visitantes parados num raio vêm ver; cada alarme vale uma vez e some
  for (let i = nvAlarms.length - 1; i >= 0; i--) {
    const a = nvAlarms[i];
    if (!a.nv1) {
      a.nv1 = true;
      for (const e of enemies) {
        if (e.dead || (e.type !== 'visitante' && e.type !== 'atirador') || e.state === 'flee') continue;
        if (Math.hypot(e.x + e.w / 2 - a.x, e.y + e.h / 2 - a.y) > a.r * T) continue;
        e.callX = a.x; e.callY = a.y; e.callT = 6; e.memT = Math.max(e.memT || 0, 3); e.braveT = Math.max(e.braveT || 0, 6);
        if (e.type === 'visitante' && Math.random() < 0.5) { const v = nv1Near(e, 220); if (v > 0.05) sfx.nv1Chirp(v * 0.7, 1.2); }
      }
    }
    a.t -= dt; if (a.t <= 0) nvAlarms.splice(i, 1);
  }
  const pcx = pl.x + pl.w / 2;
  for (let i = nv1Raios.length - 1; i >= 0; i--) {
    const o = nv1Raios[i]; o.life -= dt; o.x += o.vx * dt; o.y += o.vy * dt;
    let gone = o.life <= 0;
    if (!gone && solidAt(Math.floor(o.x / T), Math.floor(o.y / T))) { gone = true; nv1Sparks(o.x - o.vx * 0.01, o.y - o.vy * 0.01, 5, NV1_ROSA, 50, 0, 0.3); }
    if (!gone && !pl.dead && o.x > pl.x - 2 && o.x < pl.x + pl.w + 2 && o.y > pl.y - 2 && o.y < pl.y + pl.h + 2) {
      const r = hurtPlayer(o.dmg, pcx - Math.sign(o.vx || 1) * 10, null, true);
      if (r !== 'none' || pl.invuln > 0) { gone = true; nv1Sparks(o.x, o.y, 7, NV1_ROSA, 60, 0, 0.35); }
    }
    if (gone) nv1Raios.splice(i, 1);
  }
  for (let i = nv1Flashes.length - 1; i >= 0; i--) { nv1Flashes[i].t += dt; if (nv1Flashes[i].t > 0.35) nv1Flashes.splice(i, 1); }
  // o zumbido baixo do disco e o tremor das luzes
  for (const e of enemies) {
    if (e.dead || e.type !== 'disco' || e.state === 'beam' || e.state === 'spin') continue;
    e.humT = (e.humT ?? Math.random() * 2) - dt;
    if (e.humT <= 0) { e.humT = 2.2 + Math.random() * 1.6; const v = nv1Near(e, 260); if (v > 0.05) sfx.nv1Zumbido(v); }
  }
}
HOOK.update.push(nv1Update);
function clearNv1Fx() { nv1Raios.length = 0; nv1Flashes.length = 0; nvAlarms.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearNv1Fx(); nv1Tables(); return _nw(sd, sv); }; }

// a luz que eles dão ao mundo: a sonda, o cano, o disco e o feixe, o olho, a gosma, os raios
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead || !NV1_TYPES.includes(e.type)) continue;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.type === 'disco') { addL(cx, cy, 0.55); if (e.state === 'beam' && e.beamY) for (let y = e.y + e.h; y < e.beamY; y += T) addL(cx, y, 0.6); }
    else if (e.type === 'olho') { addL(cx, cy, e.state === 'charge' || e.state === 'beam' ? 0.55 : 0.32); if (e.state === 'beam') for (let d = T; d < (e.lineL || 0); d += T) addL(cx + Math.cos(e.aimA) * d, cy + Math.sin(e.aimA) * d, 0.5); }
    else if (e.type === 'gosma') addL(cx, cy, e.state === 'swell' ? 0.5 : 0.3);
    else addL(cx, cy, e.state === 'wind' || e.state === 'stab' || e.state === 'aim' || e.state === 'burst' ? 0.45 : 0.28);   // o neon da nave na pele
  }
  for (const o of nv1Raios) addL(o.x, o.y, 0.55);
}; }

// a luz aditiva: o feixe, a linha do olho, os raios, os estalos
HOOK.drawGlow.push((cx, cy) => {
  const G = NV1.GL;
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'disco' && e.state === 'beam' && e.beamY) {
      const x = e.x + e.w / 2 - cx, y0 = e.y + e.h - cy, L = e.beamY - (e.y + e.h);
      for (let d = 4, i = 0; d < L; d += 10, i++) { lc.globalAlpha = 0.16; lc.drawImage(G.feixe[i % 6], Math.round(x) - 9, Math.round(y0 + d) - 9); }
      lc.globalAlpha = 0.3; lc.drawImage(G.branco, Math.round(x) - 8, Math.round(y0) - 6);
    } else if (e.type === 'olho' && (e.state === 'charge' || e.state === 'beam')) {
      const [ex, ey] = nv1OlhoC(e), ux = Math.cos(e.aimA), uy = Math.sin(e.aimA), L = e.lineL || 0, k = e.state === 'beam' ? 1 : clamp(1 - e.stateT / NV1_CARGA, 0, 1);
      lc.globalAlpha = e.state === 'beam' ? 0.3 : 0.05 + 0.12 * k;
      for (let d = 6; d < L; d += 9) lc.drawImage(e.state === 'beam' ? G.vermG : G.verm, Math.round(ex + ux * d - cx) - (e.state === 'beam' ? 9 : 4), Math.round(ey + uy * d - cy) - (e.state === 'beam' ? 9 : 4));
    } else if (e.type === 'atirador' && e.state === 'aim') {   // o ponto de mira no herói
      lc.globalAlpha = 0.35 + 0.4 * clamp(1 - e.stateT / NV1_MIRA, 0, 1); lc.drawImage(G.rosaG, Math.round(e.aimX - cx) - 9, Math.round(e.aimY - cy) - 9);
    }
  }
  for (const o of nv1Raios) { lc.globalAlpha = 0.5; lc.drawImage(G.rosaG, Math.round(o.x - cx) - 9, Math.round(o.y - cy) - 9); }
  for (const f of nv1Flashes) { lc.globalAlpha = 0.8 * (1 - f.t / 0.35); lc.drawImage(G.cianoG, Math.round(f.x - cx) - 14, Math.round(f.y - cy) - 14); }
  lc.globalAlpha = 1;
});

// por cima do escuro: as luzes da borda do disco, o feixe arco-íris, a linha e o raio do olho, os raios rosa, a mira,
// os estalos da sonda, o anel do teleporte
HOOK.drawTop.push((cx, cy) => {
  const now = gameTime;
  for (const e of enemies) {
    if (e.dead) continue;
    const fx = Math.round(e.x + e.w / 2) - cx, fy = Math.round(e.y + e.h) - cy;
    if (fx < -60 || fx > VW + 60 || fy < -60 || fy > VH + 260) continue;
    if (e.type === 'disco') nv1DrawDisco(e, fx, fy);
    else if (e.type === 'olho' && (e.state === 'charge' || e.state === 'beam')) nv1DrawLinha(e, cx, cy);
    else if (e.type === 'atirador' && e.state === 'aim') {
      const x = Math.round(e.aimX - cx), y = Math.round(e.aimY - cy), k = clamp(1 - e.stateT / NV1_MIRA, 0, 1), r = Math.round(4 - k * 2.5);
      lc.globalAlpha = 0.6 + 0.4 * k; lc.fillStyle = '#ff3ec8';
      lc.fillRect(x - r - 2, y, 2, 1); lc.fillRect(x + r + 1, y, 2, 1); lc.fillRect(x, y - r - 2, 1, 2); lc.fillRect(x, y + r + 1, 1, 2);
      lc.fillStyle = Math.floor(now * 12) % 2 ? '#ffd0f4' : '#ff8ae0'; lc.fillRect(x, y, 1, 1);
    } else if (e.type === 'visitante' && (e.state === 'wind' || e.state === 'stab' || e.state === 'gap')) {
      const [tx, ty] = nv1Tip(e, NV1_TIP, nv1VisPose(e)), x = tx - cx, y = ty - cy;
      for (let b = 0; b < (e.state === 'wind' ? 2 : 3); b++) {   // os estalos: raiozinhos em zigue-zague saindo da ponta
        let px = x, py = y; const a = (Math.floor(now * 20) * 1.7 + b * 2.1 + e.seed) % 6.28, n = 3 + ((now * 30 + b) | 0) % 3;
        for (let i = 0; i < n; i++) { px += Math.cos(a) * 1.4 + Math.sin(now * 90 + i * 7 + b) * 1.1; py += Math.sin(a) * 1.4 + Math.cos(now * 70 + i * 5) * 1.1; lc.fillStyle = i === 0 ? '#ffffff' : i < 2 ? '#e8ffd0' : '#7dff3a'; lc.fillRect(Math.round(px), Math.round(py), 1, 1); }
      }
      lc.fillStyle = '#f4ffe0'; lc.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
  for (const o of nv1Raios) {
    const sp = Math.hypot(o.vx, o.vy) || 1, ux = o.vx / sp, uy = o.vy / sp, x = o.x - cx, y = o.y - cy, C = ['#ffffff', '#ffd0f4', '#ff8ae0', '#ff3ec8', '#c01a86', '#800e5a'];
    for (let k = 5; k >= 0; k--) { lc.fillStyle = C[k]; lc.fillRect(Math.round(x - ux * k * 1.2), Math.round(y - uy * k * 1.2), 1, 1); }
    lc.fillStyle = '#ff3ec8'; lc.fillRect(Math.round(x - uy), Math.round(y + ux), 1, 1);
  }
  for (const f of nv1Flashes) {   // o anel ciano do teleporte
    const p = f.t / 0.35, r = 3 + p * 10, n = 20;
    lc.globalAlpha = 1 - p; lc.fillStyle = p < 0.4 ? '#e0feff' : '#36f0ff';
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; lc.fillRect(Math.round(f.x - cx + Math.cos(a) * r), Math.round(f.y - cy + Math.sin(a) * r * 1.3), 1, 1); }
    if (p < 0.3) { lc.fillStyle = '#ffffff'; lc.fillRect(Math.round(f.x - cx) - 1, Math.round(f.y - cy) - 6, 2, 12); }
  }
  lc.globalAlpha = 1;
});
// o disco: as luzes coloridas da borda (devagar; no aviso correm) e o feixe arco-íris em faixas translúcidas
function nv1DrawDisco(e, fx, fy) {
  const img = NV1.get().disco.r, x0 = Math.round(fx - img.width / 2), y0 = Math.round(fy - e.h / 2 - img.height / 2) + nv1DiscoBob(e) - 1;
  const fast = e.state === 'spin' || e.state === 'beam', ph = Math.floor(e.spin || 0);
  for (let i = 0; i < NV1_LUZES.length; i++) {
    const lx = NV1_LUZES[i] + 1, ly = Math.abs(NV1_LUZES[i] - 15) > 10 ? 9 : 10, on = fast || ((i + ph) % 3 !== 0);
    if (!on) continue;
    lc.globalAlpha = fast ? 1 : 0.85; lc.fillStyle = NV_ARCO[(i + ph) % 6]; lc.fillRect(x0 + lx, y0 + ly, 1, 1);
  }
  lc.globalAlpha = 1;
  if (e.state === 'spin') { lc.fillStyle = '#e0feff'; if (Math.floor(e.t * 20) % 2) lc.fillRect(x0 + 15, y0 + 13, 2, 1); }
  if (e.state !== 'beam' || !e.beamY) return;
  // o feixe: um cone de seis faixas do arco-íris, as faixas tremem e sobem
  const top = fy, L = Math.round(e.beamY - (e.y + e.h)), cxs = fx, t = e.t;
  for (let y = 0; y < L; y++) {
    const hw = nv1FeixeW(e, y), bw = hw * 2 / 6, sy = top + y;
    if (sy < -2 || sy > VH + 2) continue;
    for (let i = 0; i < 6; i++) {
      const a = 0.14 + 0.08 * Math.sin(y * 0.3 + t * 9 + i * 0.8) + (((y + Math.floor(t * 40)) % 9) < 2 ? 0.1 : 0);
      const xa = Math.round(cxs - hw + i * bw), xb = Math.round(cxs - hw + (i + 1) * bw);
      lc.globalAlpha = a; lc.fillStyle = NV_ARCO[i]; lc.fillRect(xa, sy, Math.max(1, xb - xa), 1);
    }
    lc.globalAlpha = 0.22 + 0.12 * Math.sin(y * 0.5 - t * 14); lc.fillStyle = '#ffffff'; lc.fillRect(Math.round(cxs - hw) - 1, sy, 1, 1); lc.fillRect(Math.round(cxs + hw), sy, 1, 1);
  }
  // o brilho onde o feixe bate no chão
  lc.globalAlpha = 0.5; lc.fillStyle = '#ffffff';
  const hw = nv1FeixeW(e, L); lc.fillRect(Math.round(cxs - hw), top + L - 1, Math.round(hw * 2), 1);
  lc.globalAlpha = 1;
}
// a linha do olho: fina e falhada no começo, engrossa; no raio, o miolo branco com as bordas vermelhas
function nv1DrawLinha(e, cx, cy) {
  const [ex, ey] = nv1OlhoC(e), ux = Math.cos(e.aimA), uy = Math.sin(e.aimA), L = e.lineL || 0, beam = e.state === 'beam';
  const k = beam ? 1 : clamp(1 - e.stateT / NV1_CARGA, 0, 1), th = beam ? 3 : k < 0.45 ? 1 : k < 0.85 ? 2 : 3;
  const nx = -uy, ny = ux;
  for (let d = 5; d < L; d += 1) {
    if (!beam && k < 0.3 && (Math.floor(d / 2) + Math.floor(gameTime * 20)) % 3 === 0) continue;
    const x = ex + ux * d - cx, y = ey + uy * d - cy;
    for (let o = 0; o < th; o++) {
      const off = o - (th - 1) / 2;
      lc.globalAlpha = beam ? (o === 1 ? 1 : 0.85) : 0.35 + 0.55 * k;
      lc.fillStyle = beam ? (o === 1 ? '#fff4f0' : '#ff3b3b') : (o === 1 && th === 3 ? '#ff9a90' : '#ff3b3b');
      lc.fillRect(Math.round(x + nx * off), Math.round(y + ny * off), 1, 1);
    }
  }
  lc.globalAlpha = 1;
}

/* ---------- sons ---------- */
Object.assign(sfx, {
  // os homenzinhos: piados curtos e agudos, subindo e descendo (p: o tom)
  nv1Chirp(v = 1, p = 1) { const f = (1300 + Math.random() * 500) * p; tone(f, 0.05, 'sine', 0.03 * v, 900 * p); tone(f * 1.3, 0.06, 'sine', 0.024 * v, -520 * p, 0.07); tone(f * 0.9, 0.05, 'triangle', 0.018 * v, 1100 * p, 0.15); },
  // a sonda carregando: um zumbido elétrico com estalinhos
  nv1Sonda(v = 1) { tone(110, 0.5, 'sawtooth', 0.014 * v, 60); tone(220, 0.5, 'square', 0.005 * v, 120); for (let k = 0; k < 9; k++) noise(0.014, 0.035 * v, 3000 + Math.random() * 3500, 'highpass', k * 0.055); },
  nv1Choque(v = 1) { noise(0.08, 0.08 * v, 4200, 'highpass'); tone(900, 0.07, 'square', 0.028 * v, -600); tone(1800, 0.05, 'sawtooth', 0.012 * v, -1200, 0.02); },
  // a mira da pistola: um assobio subindo
  nv1Mira(v = 1) { tone(700, 0.6, 'sine', 0.022 * v, 1400); tone(1400, 0.6, 'triangle', 0.007 * v, 2200); },
  // o raio: o "pew" de pistola de brinquedo
  nv1Zap(v = 1) { tone(2300, 0.14, 'sawtooth', 0.026 * v, -1900); tone(1200, 0.11, 'square', 0.012 * v, -800); noise(0.05, 0.03 * v, 5200, 'highpass'); },
  nv1Blink(v = 1) { tone(300, 0.14, 'sine', 0.04 * v, 2600); noise(0.1, 0.05 * v, 6000, 'highpass'); tone(2900, 0.12, 'sine', 0.02 * v, -2400, 0.12); },
  // o disco: o "uuuu" de teremim, o seno que sobe e desce tremendo
  nv1Wooo(v = 1, d = 0.8) {
    const f0 = 480 + Math.random() * 60, n = 7;
    for (let k = 0; k < n; k++) tone(f0 + k * 34 + (k % 2 ? 28 : -28), d / n + 0.05, 'sine', 0.032 * v, k % 2 ? -56 : 56, k * d / n);
    tone(f0 * 2, d, 'sine', 0.006 * v, 400);
  },
  nv1Feixe(v = 1, d = 2) { tone(196, d, 'sine', 0.03 * v, 40); tone(294, d, 'triangle', 0.012 * v, 60); for (let k = 0; k < 8; k++) tone([784, 988, 1175, 1568][k % 4], 0.22, 'sine', 0.012 * v, 200, k * d / 8); },
  nv1Zumbido(v = 1) { tone(140, 0.9, 'sine', 0.014 * v, 8); tone(143, 0.9, 'sine', 0.012 * v, -6); },
  nv1DiscoMorre(v = 1) { noise(0.5, 0.1 * v, 900, 'lowpass'); tone(700, 0.9, 'sine', 0.04 * v, -560); for (let k = 0; k < 6; k++) noise(0.03, 0.05 * v, 4000, 'highpass', 0.1 + k * 0.09); },
  // o olho: a sirene do alarme, a carga que sobe, o raio que chia
  nv1Alarme(v = 1) { for (let k = 0; k < 2; k++) { tone(760, 0.17, 'square', 0.022 * v, 380, k * 0.36); tone(1140, 0.17, 'square', 0.022 * v, -380, k * 0.36 + 0.18); } },
  nv1Carga(v = 1) { tone(160, 1.4, 'sawtooth', 0.012 * v, 520); noise(1.4, 0.012 * v, 2200, 'bandpass', 0, 5); },
  nv1Raio(v = 1) { tone(90, 0.6, 'sawtooth', 0.04 * v, -20); noise(0.6, 0.05 * v, 1600, 'bandpass', 0, 1.5); tone(1800, 0.6, 'sine', 0.01 * v, -600); },
  // a gosma: o inchar, o soltar, o esborrachar, o arrastar molhado
  nv1Incha(v = 1) { tone(180, 0.5, 'sine', 0.03 * v, 280); noise(0.5, 0.02 * v, 500, 'lowpass'); for (let k = 0; k < 3; k++) tone(400 + k * 120, 0.05, 'sine', 0.014 * v, 300, 0.1 + k * 0.12); },
  nv1Solta(v = 1) { tone(520, 0.12, 'sine', 0.03 * v, -320); noise(0.08, 0.03 * v, 900, 'bandpass', 0, 2); },
  nv1Splat(v = 1) { noise(0.25, 0.1 * v, 500, 'lowpass'); tone(160, 0.2, 'sine', 0.05 * v, -100); for (let k = 0; k < 3; k++) tone(300 + Math.random() * 400, 0.05, 'sine', 0.015 * v, 380, 0.08 + k * 0.07); },
  nv1Squelch(v = 1) { noise(0.12, 0.06 * v, 600, 'lowpass', 0, 1); tone(240, 0.1, 'sine', 0.03 * v, -140); noise(0.06, 0.03 * v, 1400, 'bandpass', 0.06, 4); },
  nv1Morre(v = 1) { tone(1500, 0.32, 'sine', 0.04 * v, -1200); tone(2000, 0.2, 'sine', 0.015 * v, -1500, 0.05); }
});
