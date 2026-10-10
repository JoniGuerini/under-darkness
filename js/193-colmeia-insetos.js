'use strict';

/* ================= os insetos da Colmeia, parte um =================
   Cinco dos dez bichos da nona camada (docs/camadas/09-colmeia.md, seção 6). Todos insetos de carapaça escura com a
   borda acesa pela luz âmbar das paredes; a larva é cor de cera-real, quase sem contorno.
   - a operária (operaria), que anda no chão com uma bola de cera na boca; ao ver o herói larga a bola e bate as
     antenas (cmChamar, 190: as operárias num raio de 12 blocos vêm); as mandíbulas abrem com um estalo e as pontas
     acendem (0,5 s), duas mordidas seguidas. Sem herói à vista, vai lacrar com Cera Nova os blocos que ele quebrou
     (cmBroken, cmCanSeal e cmSeal do 199, se existirem);
   - a soldada porteira (soldada), lenta, de cabeça chata baixa: tampa o túnel, empurra o herói e o esmaga contra a
     parede; de frente leva só 20% do dano. A cabeça sobe e treme (0,8 s) e vem a cabeçada que joga 3 blocos; nessa
     hora a mandíbula fica exposta e leva dano cheio;
   - a formiga-leão (formigaleao), enterrada no fundo de um funil de pó de cera (cmFunnels, 190, cavados pelo 195): quem
     pisa no pó escorrega para o centro; os grãos tremem e as pinças saem (0,6 s) e fecham. Se o herói foge, ela cava
     e muda para o funil livre mais perto (um montinho de pó andando, intocável). O spawn comum não a cria;
   - a correição (correicao), uma fileira de 12 formigas que corre pelo chão, pelas paredes e pelo teto atrás do
     herói, chiando de longe; onde passa por cima dele morde (a única com `touch`). A vida é a fila: cada golpe mata
     algumas e ela encurta;
   - a larva faminta (larva), que nasce de ovos e favos (199 e a Rainha chamam spawnEnemy('larva', ...)) ou em grupos
     de 3 a 5 pelo spawn comum; rasteja em sanfona, ergue a frente com a boca redonda de dentes em espiral (0,5 s),
     pula e gruda mastigando até levar um golpe. Come o loot do chão, cresce e devolve tudo ao morrer.
   O 195 põe o nível (embrulha spawnEnemy) e as tabelas de spawn. Mesmo pincel do 55 (cp, contorno, cache), rampas da
   seção 12. Carrega depois do 192 e antes do 49 (BAL): os números são os da ficha. */

/* ---------- números ---------- */
Object.assign(ET, {
  operaria: { name: 'Operária', w: 12, h: 8, hp: 80, dmg: 18, xp: 22, kb: 0.6, fly: false, blood: '#c8a03a' },
  soldada: { name: 'Soldada Porteira', w: 16, h: 11, hp: 260, dmg: 28, xp: 40, kb: 0.15, fly: false, blood: '#8aa060' },
  formigaleao: { name: 'Formiga-Leão', w: 12, h: 7, hp: 150, dmg: 26, xp: 34, kb: 0.1, fly: true, blood: '#a8843a' },   // fly: presa ao funil; a gravidade é dela
  correicao: { name: 'Correição', w: 8, h: 4, hp: 60, dmg: 8, xp: 26, kb: 0.05, fly: true, crawl: true, touch: 1, blood: '#6a4a1a' },   // encostar na fila morde
  larva: { name: 'Larva Faminta', w: 9, h: 5, hp: 36, dmg: 10, xp: 14, kb: 1.0, fly: false, blood: '#e8d090' }
});
const CMI_TYPES = ['operaria', 'soldada', 'formigaleao', 'correicao', 'larva'];
// os materiais e as bases vêm do 197 (carrega antes); filtra pelo que existir e refaz a cada mundo
const CMI_DROPS = {
  operaria: [['cera_bruta', 0.6, 1, 2], ['min_ambrita', 0.08], ['pocao', 0.06], ['elmo_ambar', 0.1]],
  soldada: [['quitina', 0.5, 1, 2], ['min_ambrita', 0.1], ['pocao', 0.08], ['escudo_favo', 0.2]],
  formigaleao: [['quitina', 0.35], ['cera_bruta', 0.3], ['min_ambrita', 0.1], ['pocao', 0.07]],
  correicao: [['quitina', 0.2], ['min_ambrita', 0.06], ['pocao', 0.05]],
  larva: [['mel_escuro', 0.5], ['min_ambrita', 0.06], ['pocao', 0.05]]
};
function cmiTables() { for (const k of CMI_TYPES) DROPS[k] = CMI_DROPS[k].filter(([id]) => ITEMS[id]); }
cmiTables();
Object.assign(NAV_WALKERS, { operaria: 1, soldada: 1, larva: 1 });
Object.assign(CV_STEP, { operaria: 1, soldada: 1, larva: 1 });

const CM_OP_WIND = 0.5, CM_SD_REAR = 0.8, CM_FL_WARN = 0.6, CM_LV_REAR = 0.5;
const CM_FILA = 12, CM_FILA_GAP = 4;   // formigas na correição e px entre uma e outra
const CM_SLIDE = 46;                    // px/s que o pó do funil puxa para o centro

/* ================= arte ================= */
const CMI = {};
{
const { cp, set } = CVB, { cg } = CVART;
const R6 = hexes => hexes.map(h => ph(h));
const RI = {
  casco: R6(['#100a06', '#20160c', '#342414', '#4c381e', '#68502c', '#8a6c40']),     // carapaça da operária, marrom-preta
  quit: R6(['#0c120e', '#1a2620', '#2a3e32', '#3e5a48', '#5a7e64', '#8aac8e']),      // Quitina (seção 12)
  ambar: R6(['#4a2006', '#7a3a0a', '#b0600e', '#d88a1c', '#f4b03a', '#ffd878']),     // Âmbar: a luz das paredes
  cera: R6(['#5a4618', '#8a6e28', '#b8963a', '#d8b850', '#ecd27a', '#fae8a8']),      // Cera Nova: a bola da operária
  velha: R6(['#2a1c0c', '#4a3416', '#6e5022', '#94702e', '#b8923e', '#d8b45a']),     // Cera Velha: o pó do funil
  real: R6(['#3a2018', '#64382a', '#8e5a40', '#b8825a', '#dcae80', '#f4d6a8']),      // Cera Real: as larvas
  mand: R6(['#1a0c04', '#2e1606', '#4a240a', '#6a3810', '#8e5018', '#c07a2a']),      // mandíbulas
  brilho: R6(['#806010', '#b08a1a', '#d8b030', '#f6d050', '#ffec90', '#fff8d0']),    // as pontas que acendem
  olho: R6(['#1a0802', '#3a1404', '#6a2a08', '#a8500e', '#e08a1c', '#ffd060']),
  osso: R6(['#3a3226', '#5a4e3c', '#7d6f58', '#a09078', '#c8bca2', '#ece4cc']),
  boca: R6(['#0e0404', '#1e0808', '#30100c', '#441812', '#5a2418', '#703020'])
};
// a borda de luz âmbar: os pixels que a última passada pintou e que tocam o ar por cima ou pelas costas
function rim(P, before, s, k = 0.6, hi = 3) {
  const { w, h, c } = P, A = RI.ambar;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!c[i] || c[i] === before[i]) continue;
    const up = y === 0 || !c[i - w], back = x === 0 || !c[i - 1];
    const hsh = hash2(x, y, s);
    if (up && hsh < k) c[i] = A[hi]; else if (back && hsh < k * 0.35) c[i] = A[hi - 1];
  }
}
const has = (P, x, y) => x >= 0 && y >= 0 && x < P.w && y < P.h && P.c[(y | 0) * P.w + (x | 0)] !== 0;
// um tubo ao longo de pontos [x, y, r] (corpo da larva): claro em cima, gomos marcados
function tube(P, pts, R, s, base, creases) {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0, r0] = pts[i], [x1, y1, r1] = pts[i + 1], n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3));
    for (let j = 0; j < n; j++) {
      const t = j / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * t;
      const crease = creases && (len % 2.3) < 0.5 ? -1.4 : 0;
      for (let oy = -r; oy <= r + 0.01; oy += 0.5) for (let ox = -r; ox <= r + 0.01; ox += 0.5) {
        if (ox * ox + oy * oy > r * r + 0.05) continue;
        P.put(x + ox, y + oy, R, base - (oy / r) * 1.7 - (ox < 0 ? 0.1 : 0) + crease + cg(x + ox | 0, y + oy | 0, s) * 0.3);
      }
      len += Math.hypot(x1 - x0, y1 - y0) / n;
    }
  }
}
const setBare = cv => { const l = flip(cv); return { r: cv, l, wr: whiteOf(cv), wl: whiteOf(l) }; };   // sem contorno

/* a operária, 18 x 11 de frente para a direita: 0-1 andando, 2-3 batendo as antenas, 4 mandíbulas abertas (o aviso,
   pontas acesas), 5 a mordida (cabeça esticada), 6 lacrando (cabeça baixa empurrando a cera) */
function operaria(pose) {
  const P = cp(18, 11), s = 19301 + pose * 7, step = pose === 1 ? 1 : pose === 0 ? -1 : 0, open = pose === 4, bite = pose === 5, seal = pose === 6;
  const hx = bite ? 14.1 : seal ? 13.2 : 13.3, hy = seal ? 5.9 : bite ? 4.9 : 4.5;
  // as patas de perto, bem abertas; as de longe só aparecem entre elas, escuras e curtas
  const hips = [8.4, 9.6, 10.8], feetN = [4.6, 9.6, 14.6], feetF = [7, 12];
  const leg = (i, far) => {
    if (far) { if (i > 1) return; const fx = feetF[i] + (i % 2 ? 1 : -1) * step * 0.8; P.line(hips[i] + 0.6, 7, fx, 10.4, RI.casco, 1.4); return; }
    const o = (i % 2 ? 1 : -1) * step * 1.1, fx = feetN[i] + o;
    const kx = (hips[i] + fx) / 2 + (i === 0 ? -0.8 : i === 2 ? 0.8 : 0), ky = 6.2;
    P.leg(hips[i], 6.8, kx, ky, fx, 10.4, RI.casco, 3);
  };
  for (let i = 0; i < 3; i++) leg(i, true);
  const b0 = P.c.slice();
  P.blob(4.2, 5.6, 3.9, 2.9, RI.casco, s, 2.6, (x, y, dx, dy) => (dy < -0.4 && dx < 0.2 ? 0.6 : 0));    // gáster
  for (const bx of [3, 5]) for (let y = 3; y <= 8; y++) if (has(P, bx, y)) P.put(bx, y, RI.casco, 0.6);  // as listras do gáster
  P.blob(7.5, 6.1, 1, 0.9, RI.casco, s + 1, 2);                                                        // pecíolo
  P.blob(9.7, 5.3, 2.3, 1.7, RI.casco, s + 2, 2.9);                                                    // tórax
  P.blob(hx, hy, 2.6, 2.2, RI.casco, s + 3, 3.1);                                                       // cabeça
  rim(P, b0, s);
  P.put(hx + 0.9, hy - 0.6, RI.olho, 4.4); P.put(hx + 0.2, hy - 0.8, RI.olho, 2.6);                   // olho
  // antenas em cotovelo; batendo, sobem e descem
  const beat = pose === 2 ? -1.4 : pose === 3 ? 1 : 0, ay = hy - 1.7;
  P.line(hx + 0.2, ay, hx + 0.6, ay - 2 + (beat < 0 ? -0.4 : 0), RI.casco, 3);
  P.line(hx + 0.6, ay - 2 + (beat < 0 ? -0.4 : 0), hx + 3.3, ay - 1.5 + beat, RI.ambar, 1.6);
  if (pose === 2 || pose === 3) P.put(hx + 3.4, ay - 1.5 + beat, RI.ambar, 3);
  // mandíbulas
  const mx = hx + 1.7, my = hy + 0.6;
  if (open) {
    P.line(mx, my - 0.3, mx + 2, my - 1.6, RI.mand, 4); P.line(mx, my + 0.7, mx + 2, my + 2.2, RI.mand, 3.4);
    P.put(mx + 2.3, my - 1.8, RI.brilho, 5); P.put(mx + 2.3, my + 2.4, RI.brilho, 4.6);
  } else {
    P.line(mx, my, mx + 2.1, my + 0.3, RI.mand, 3.8); P.line(mx, my + 0.9, mx + 1.9, my + 0.9, RI.mand, 2.6);
    if (bite) P.put(mx + 2.4, my + 0.5, RI.mand, 5);
  }
  for (let i = 0; i < 3; i++) leg(i, false);
  return set(P.done());
}
function bolaCera() {
  const P = cp(5, 5), s = 19391;
  P.blob(2.5, 2.5, 2.4, 2.3, RI.cera, s, 2.6, (x, y) => (hash2(x, y, s) < 0.2 ? -0.8 : 0));
  P.put(1, 1, RI.cera, 5);
  return set(P.done());
}

/* a soldada porteira, 24 x 14 de frente para a direita: 0-1 andando (cabeça chata baixa, a placa da frente em pé),
   2 a cabeça erguida (o aviso; a mandíbula aparece), 3 a cabeçada (cabeça jogada para a frente) */
function soldada(pose) {
  const P = cp(24, 14), s = 19401 + pose * 7, step = pose === 1 ? 1 : pose === 0 ? -1 : 0, rear = pose === 2, butt = pose === 3;
  const hips = [10.4, 11.8, 13.2], feetN = [5, 11.6, 17.4], feetF = [8.4, 14.6];
  const leg = (i, far) => {
    if (far) { if (i > 1) return; const fx = feetF[i] + (i % 2 ? 1 : -1) * step + (butt ? 1 : 0); P.line(hips[i] + 0.8, 9.6, fx, 13.4, RI.quit, 1.4); return; }
    const o = (i % 2 ? 1 : -1) * step * 1.2, fx = feetN[i] + o + (butt ? 1 : 0);
    const kx = (hips[i] + fx) / 2 + (i === 0 ? -1.2 : i === 2 ? 1.2 : 0), ky = 8.8;
    P.leg(hips[i], 9.4, kx, ky, fx, 13.4, RI.quit, 2.8); P.put(fx + (i === 2 ? 0.8 : -0.8), 13.4, RI.quit, 2);
  };
  for (let i = 0; i < 3; i++) leg(i, true);
  const b0 = P.c.slice();
  P.blob(4.8, 7.6, 4.4, 3.4, RI.quit, s, 2, (x, y, dx, dy) => (dy < -0.4 && dx < 0.2 ? 0.5 : 0));     // gáster
  for (const bx of [3.4, 5.8]) for (let y = 4; y <= 11; y++) if (has(P, bx, y)) P.put(bx, y, RI.quit, 0.5);
  P.blob(9.2, 8.4, 1.1, 1.1, RI.quit, s + 1, 1.8);                                                      // pecíolo
  P.blob(11.8, 7.4, 2.7, 2.1, RI.quit, s + 2, 2.4);                                                     // tórax
  rim(P, b0, s, 0.45, 2);
  // a cabeça: um disco grande e chato; a frente é uma placa reta, mais clara, que tampa o túnel
  const b1 = P.c.slice();
  if (rear) {
    P.blob(16.6, 5.6, 3.5, 4.2, RI.quit, s + 3, 2.6);
    for (let i = 0; i <= 10; i++) { const t = i / 10, x = 18.8 + t * 2.4, y = 1 + t * 6.2; P.put(x, y, RI.quit, 4.4 - t * 1.2); P.put(x - 1, y, RI.quit, 3.2 - t); }
    // a mandíbula exposta debaixo da placa, aberta
    P.line(18.2, 9, 22, 8.2, RI.mand, 4.4); P.line(18.2, 10, 21.6, 11.6, RI.mand, 3.6);
    P.put(22.4, 8, RI.brilho, 4.6); P.put(22, 11.8, RI.brilho, 4.2); P.blob(18.4, 9.6, 1.2, 1, RI.boca, s + 4, 2);
  } else {
    const hx = butt ? 18.6 : 17.2, hy = butt ? 7.6 : 8.4;
    P.blob(hx, hy, 3.6, 4.4, RI.quit, s + 3, 2.4, (x, y, dx) => (dx > 0.55 ? 0.8 : 0));
    for (let y = Math.ceil(hy - 4); y <= hy + 4; y++) { const xx = hx + 3.3 - Math.abs(y - hy) * 0.12; P.put(xx, y, RI.quit, 4.4 - Math.abs(y - hy) * 0.25); P.put(xx - 1, y, RI.quit, 3); }
    P.line(hx + 2.6, hy + 4.2, hx + 4, hy + 4.6, RI.mand, 2.6);   // a pontinha da mandíbula, escondida
  }
  rim(P, b1, s + 9, 0.6, 3);
  const ex = rear ? 17.4 : butt ? 19.4 : 18, ey = rear ? 3.6 : butt ? 5.4 : 6.2;
  P.put(ex, ey, RI.olho, 4); P.put(ex - 0.8, ey, RI.olho, 2.4);
  P.line(ex - 0.6, ey - 1.4, ex - 1.4, ey - 3.2, RI.quit, 3); P.line(ex - 1.4, ey - 3.2, ex + 1.4, ey - 3.8 + (rear ? -0.6 : 0), RI.ambar, 1.6);   // antena curta
  for (let i = 0; i < 3; i++) leg(i, false);
  return set(P.done());
}

/* a formiga-leão, 18 x 11 de frente para a direita: o corpão redondo de pó e cerdas, cabeça pequena e as pinças que
   sobem: 0 aberta (fora do pó), 1 pinças bem abertas (o aviso), 2 fechada (a mordida) */
function formigaleao(pose) {
  const P = cp(18, 11), s = 19501 + pose * 7;
  for (const [x, o] of [[6, 0], [8.6, 1], [10.6, 0]]) { P.line(x, 8.6, x - 1 + o, 10.4, RI.casco, 1.2); P.line(x + 0.6, 8.6, x + 1.2 - o, 10.4, RI.casco, 2.6); }   // perninhas
  const b0 = P.c.slice();
  P.blob(5.4, 6.8, 4.8, 3.6, RI.casco, s, 2.4, (x, y) => (hash2(x, y, s) < 0.22 ? 1.4 : 0));             // o corpo, salpicado de pó
  for (const [x, y] of [[2, 3.6], [4, 2.8], [6.4, 2.8], [8.4, 3.6], [1, 5.4], [0.6, 7.6]]) P.put(x, y, RI.casco, 2.2);   // cerdas
  P.blob(10.2, 7, 1.8, 1.6, RI.casco, s + 1, 2.4);
  P.blob(12.4, 6.2, 1.7, 1.5, RI.casco, s + 2, 2.8);
  rim(P, b0, s, 0.7);
  for (const [x, y] of [[3, 5], [5.6, 4.4], [7, 6.6], [4, 8]]) P.put(x, y, RI.velha, 3.6 + hash2(x, y, s) * 1.4);   // pó grudado
  P.put(13, 5.4, RI.olho, 4.2);
  // as pinças: foices longas que saem da cabeça para cima e para a frente
  const pin = (pts, v) => { for (let i = 0; i < pts.length - 1; i++) P.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], RI.mand, v - i * 0.2); };
  if (pose === 2) {
    pin([[13.2, 5.6], [15.6, 4.2], [17.4, 5.4]], 4.2); pin([[13.4, 7], [15.6, 7.8], [17.2, 6.2]], 3.6);
  } else {
    const w = pose === 1 ? 1.6 : 0;
    pin([[12.8, 5], [14, 2 - w * 0.6], [15.6, 0.4 - w * 0.2], [16.6, 1.2]], 4.4); pin([[13.6, 6.2], [15.6, 4.4 - w * 0.2], [17.2, 3.6 + w * 0.2], [17.4, 4.8]], 3.6);
    if (pose === 1) { P.put(16.6, 1.4, RI.brilho, 4.6); P.put(17.4, 5, RI.brilho, 4.2); }
  }
  return set(P.done());
}
// enterrada: o montinho de pó no fundo do funil com as pinças (e o alto da cabeça) aparecendo; k 0-1 o tremor
function formigaEnterrada(k) {
  const P = cp(18, 7), s = 19551 + k * 7, o = k ? 0.5 : 0;
  P.line(11.6, 4.6, 13.2 + o, 1.6, RI.mand, 3.8); P.line(13.2 + o, 1.6, 14.4, 0.6 + o, RI.mand, 4.4); P.put(14.6, 1, RI.mand, 3);
  P.line(13, 5, 15.6, 3 - o, RI.mand, 3.2); P.line(15.6, 3 - o, 16.6, 3.6, RI.mand, 3.6);
  P.blob(11.8, 5, 1.6, 1.2, RI.casco, s, 2.6); P.put(12.4, 4.4, RI.olho, 3.6);
  for (let x = 2; x < 17; x++) {   // o pó: um montinho baixo, granulado
    const top = 6.6 - Math.max(0, 1.6 - Math.abs(x - 10) * 0.22) - (hash2(x, 0, s) < 0.3 ? 0.5 : 0);
    for (let y = Math.floor(top); y < 7; y++) P.put(x, y, RI.velha, 3 + (y === Math.floor(top) ? 1.2 : 0) + cg(x, y, s) * 0.8);
  }
  return set(P.done());
}
// o montinho que anda por dentro da terra quando ela muda de funil
function montinho(k) {
  const P = cp(14, 5), s = 19571 + k * 7;
  for (let x = 0; x < 14; x++) {
    const h = Math.max(0, 3.6 - Math.abs(x - 6.5 - (k ? 0.6 : -0.6)) * 0.55) + (hash2(x, k, s) < 0.35 ? 0.6 : 0);
    for (let y = Math.floor(5 - h); y < 5; y++) P.put(x, y, RI.velha, 2.6 + (y === Math.floor(5 - h) ? 1.6 : 0) + cg(x, y, s) * 0.9);
  }
  return setBare(P.done());
}
/* uma formiga da correição, 4 x 3 de frente para a direita, patas para baixo (sem contorno: são pontinhos) */
function formiguinha(k) {
  const P = cp(4, 3);
  P.put(0, 0, RI.casco, 2.6); P.put(1, 0, RI.ambar, 2); P.put(2, 0, RI.casco, 3.4); P.put(3, 0, RI.ambar, 3);
  P.put(0, 1, RI.casco, 1.4); P.put(1, 1, RI.casco, 1); P.put(2, 1, RI.casco, 2);
  if (k === 0) { P.put(0, 2, RI.casco, 0.6); P.put(2, 2, RI.casco, 0.6); } else { P.put(1, 2, RI.casco, 0.6); P.put(3, 2, RI.casco, 0.6); }
  const cv = P.done(); return { r: cv, w: whiteOf(cv) };
}
/* a larva, 16 x 10 de frente para a direita, em 3 tamanhos (g 0 a 2: come e cresce): 0-2 a sanfona (esticada, meio,
   encolhida com a corcova), 3 a frente erguida com a boca redonda aberta (o aviso), 4 o pulo, 5 agarrada mastigando */
function larva(g, pose) {
  const P = cp(16, 10), s = 19601 + pose * 7 + g * 31, L = 9 + g * 1.5, r = 2.2 + g * 0.3, by = 9.3 - r;
  let pts;
  if (pose <= 2) {
    const k = [1, 0.88, 0.76][pose], hump = [0, 0.9, 2][pose], x0 = 1 + (L - L * k) * 0.5;
    pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6, x = x0 + t * L * k; pts.push([x, by - Math.sin(t * Math.PI) * hump, r * (t < 0.15 ? 0.7 : t > 0.85 ? 0.95 : 1)]); }
  } else if (pose === 3) {
    pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6, up = t > 0.5 ? (t - 0.5) * 2 : 0; pts.push([1.6 + t * L * 0.86 - up * up * 1.6, by - up * up * 4.6, r * (t < 0.15 ? 0.7 : 1)]); }
  } else if (pose === 4) {
    pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([0.8 + t * L * 1.08, by - 0.6 - Math.sin(t * Math.PI) * 1.2 - t * 0.8, r * (t < 0.15 ? 0.6 : 0.92)]); }
  } else {
    pts = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * 1.15 - (i / 8) * Math.PI * 1.25; pts.push([7.4 + Math.cos(a) * (3.2 + g * 0.5), 5.2 - Math.sin(a) * (3 + g * 0.4), r * 0.95]); }
  }
  tube(P, pts, RI.real, s, 3.3, true);
  const [fx, fy, fr] = pts[pts.length - 1];
  if (pose === 3) {   // a boca redonda: um anel de dentes em espiral em volta do escuro
    P.blob(fx + 0.6, fy - 0.2, fr * 0.8, fr * 0.8, RI.boca, s + 3, 1.2);
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3, rr = fr * (0.55 + i * 0.06); P.put(fx + 0.6 + Math.cos(a) * rr, fy - 0.2 + Math.sin(a) * rr, RI.osso, 4.8 - (i % 2)); }
  } else if (pose === 5) { P.put(fx + 0.4, fy, RI.boca, 1); P.put(fx + 0.4, fy + 1, RI.osso, 4.6); }
  else { P.put(fx + fr * 0.6, fy + 0.4, RI.boca, 2); P.put(fx + fr * 0.2, fy - fr * 0.5, RI.real, 1.4); }
  // quase sem contorno: só um fio mais escuro na barriga, onde encosta no chão
  const { w, h, c } = P;
  for (let y = h - 2; y >= 1; y--) for (let x = 0; x < w; x++) if (c[y * w + x] && !c[(y + 1) * w + x] && hash2(x, y, s) < 0.7) c[y * w + x] = RI.real[1];
  return setBare(P.done());
}
CMI.get = () => CMI.ready || (CMI.ready = {
  op: [0, 1, 2, 3, 4, 5, 6].map(operaria), bola: bolaCera(),
  sd: [0, 1, 2, 3].map(soldada),
  fl: [0, 1, 2].map(formigaleao), flEnt: [0, 1].map(formigaEnterrada), mont: [0, 1].map(montinho),
  ant: [0, 1].map(formiguinha),
  lv: [0, 1, 2].map(g => [0, 1, 2, 3, 4, 5].map(p => larva(g, p)))
});
CMI.GL = { tip: glow(3, '#ffe070'), eye: glow(3, '#e0901c'), ant: glow(2, '#d8901c'), mouth: glow(3, '#f0a080') };
}

/* ================= desenho ================= */
const cmJit = (e, on, k = 40) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
// operária: a bola de cera vai na boca enquanto ela não está brigando
const CM_OP_BALL = [[8, -6], [8, -6], [7, -6], [7, -6], [8, -6], [9, -6], [8, -4]];   // centro da bola por pose (de frente para a direita)
const cmOpPose = e => e.state === 'call' ? 2 + (Math.floor(e.t * 16) % 2) : e.state === 'wind' ? 4 : e.state === 'bite' ? 5 : e.state === 'seal' ? 6 : e.state === 'gap' ? 4 : e.onGround && Math.abs(e.vx) > 4 ? Math.floor(e.t * 12) % 2 : 0;
DRAW_E.operaria = (e, fx, fy, fl) => {
  const B = CMI.get(), k = cmOpPose(e), j = cmJit(e, e.state === 'wind');
  lc.drawImage(cvPick(B.op[k], e, fl), fx - 10 + j, fy - 12);
  if (e.ball || e.state === 'seal') {
    const [bx, by] = CM_OP_BALL[k], sq = e.state === 'seal' ? Math.round((1 - e.stateT / 0.8) * 2) : 0;
    lc.drawImage(cvPick(B.bola, e, fl), Math.round(fx + e.facing * (bx + sq) - 3.5), fy + by - 3);
  }
};
EYES_E.operaria = (e, fx, fy) => {
  if (e.state === 'wind' || e.state === 'gap') { lc.globalAlpha = 0.85; lc.drawImage(CMI.GL.tip, fx + e.facing * 7 - 3, fy - 9); }
  else { lc.globalAlpha = 0.22; lc.drawImage(CMI.GL.eye, fx + e.facing * 4 - 3, fy - 10); }
};
WARN_E.operaria = e => e.state === 'wind';

DRAW_E.soldada = (e, fx, fy, fl) => {
  const B = CMI.get().sd, k = e.state === 'rear' ? 2 : e.state === 'butt' ? 3 : e.onGround && Math.abs(e.vx) > 3 ? Math.floor(e.t * 5) % 2 : 0;
  const j = cmJit(e, e.state === 'rear', 46), lift = e.state === 'rear' ? -Math.round(Math.min(1, (CM_SD_REAR - e.stateT) * 4)) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 13 + j, fy - 15 + lift);
};
EYES_E.soldada = (e, fx, fy) => {
  if (e.state === 'rear' || e.state === 'butt') { lc.globalAlpha = 0.6; lc.drawImage(CMI.GL.tip, fx + e.facing * 9 - 3, fy - 8); }
  lc.globalAlpha = 0.25; lc.drawImage(CMI.GL.eye, fx + e.facing * (e.state === 'rear' ? 4 : 5) - 3, fy - (e.state === 'rear' ? 14 : 12));
};
WARN_E.soldada = e => e.state === 'rear';

DRAW_E.formigaleao = (e, fx, fy, fl) => {
  const B = CMI.get(), st = e.state;
  if (st === 'travel') {   // o montinho de pó, só onde ele corre por baixo de um chão
    if (e.moundY === undefined) return;
    const m = B.mont[Math.floor(e.t * 8) % 2], y = fy + Math.round(e.moundY - (e.y + e.h));
    lc.drawImage(e.facing > 0 ? m.r : m.l, fx - 7, y - 5); return;
  }
  if (st === 'buried' || st === 'warn' || st === 'settle') {
    const k = st === 'warn' ? Math.floor(e.t * 22) % 2 : (Math.sin(e.t * 0.9 + e.seed) > 0.97 ? 1 : 0), j = cmJit(e, st === 'warn', 50);
    const img = cvPick(B.flEnt[k], e, fl), up = st === 'warn' ? Math.round(clamp((CM_FL_WARN - e.stateT) / CM_FL_WARN, 0, 1) * 2) : 0;
    lc.drawImage(img, fx - 10 + j, fy - 8 - up); return;
  }
  // fora do pó (a mordida, o tempo exposta e a volta para baixo): o corpo sobe e desce cortado na linha do chão
  const k = st === 'snap' ? 2 : st === 'out' && e.stateT > 0.9 ? 1 : 0, img = cvPick(B.fl[k], e, fl), H = img.height;
  const vis = Math.max(1, Math.round(H * clamp(e.rise ?? 1, 0, 1)));
  lc.drawImage(img, 0, 0, img.width, vis, fx - 10, fy - vis + 1, img.width, vis);
  if ((e.rise ?? 1) < 1) { const m = B.mont[0]; lc.drawImage(m.r, fx - 7, fy - 5); }
};
EYES_E.formigaleao = (e, fx, fy) => {
  if (e.state === 'warn') { lc.globalAlpha = 0.5; lc.drawImage(CMI.GL.tip, fx + e.facing * 6 - 3, fy - 9); }
};
WARN_E.formigaleao = e => e.state === 'warn';

// a correição: cada formiga com as patas no que estiver pisando (chão, parede ou teto), seguindo a cabeça
function cmFilaN(e) { return clamp(Math.ceil(CM_FILA * e.hp / Math.max(1, e.maxHp)), 1, CM_FILA); }
function cmFilaAnts(e, out) {   // posições { x, y, hx, hy, nx, ny } da cabeça para o rabo
  out.length = 0;
  const n = cmFilaN(e), tr = e.trail || [], head = cmFilaPoint(e);
  let prev = head; out.push({ x: head.x, y: head.y, hx: e.hdx || e.facing, hy: e.hdy || 0, nx: head.nx, ny: head.ny });
  for (let i = 1; i < n; i++) {
    const p = tr[tr.length - i]; if (!p) break;
    let hx = prev.x - p.x, hy = prev.y - p.y; const d = Math.hypot(hx, hy);
    if (d > 0.3) { hx /= d; hy /= d; } else { hx = out[out.length - 1].hx; hy = out[out.length - 1].hy; }
    out.push({ x: p.x, y: p.y, hx, hy, nx: p.nx, ny: p.ny }); prev = p;
  }
  return out;
}
const cmAntsTmp = [];
DRAW_E.correicao = (e, fx, fy, fl) => {
  const A = CMI.get().ant, ex = e.x + e.w / 2, ey = e.y + e.h, ants = cmFilaAnts(e, cmAntsTmp);
  for (let i = ants.length - 1; i >= 0; i--) {
    const a = ants[i], img = fl ? A[(Math.floor(e.t * 18) + i) % 2].w : A[(Math.floor(e.t * 18) + i) % 2].r;
    // o eixo da formiga vai na direção em que anda; as patas para o lado do que pisa (contra a normal)
    // (sempre em ângulo reto com a superfície: num canto a formiga segue a parede ou o chão em que está)
    const lx = -a.nx, ly = -a.ny; let hx = -ly, hy = lx, dot = hx * a.hx + hy * a.hy;
    if (Math.abs(dot) < 0.2) dot = hx * e.facing; if (dot < 0) { hx = -hx; hy = -hy; }
    const sx = fx + Math.round(a.x - ex), sy = fy + Math.round(a.y - ey);
    lc.save(); lc.transform(hx, hy, lx, ly, sx, sy); lc.drawImage(img, -2, -2); lc.restore();
  }
};
EYES_E.correicao = (e, fx, fy) => {   // pontinhos âmbar ao longo da fila: dá para ver o rio vindo de longe
  const ex = e.x + e.w / 2, ey = e.y + e.h, ants = cmFilaAnts(e, cmAntsTmp);
  for (let i = 0; i < ants.length; i += 3) { lc.globalAlpha = 0.35 + 0.15 * Math.sin(e.t * 9 + i); lc.drawImage(CMI.GL.ant, fx + Math.round(ants[i].x - ex) - 2, fy + Math.round(ants[i].y - ey) - 2); }
};
WARN_E.correicao = () => false;

const cmLvPose = e => e.state === 'rear' ? 3 : e.state === 'leap' ? 4 : e.state === 'stuck' ? 5 : e.onGround ? [0, 1, 2, 1][Math.floor(((e.t * 2.2) % 1) * 4)] : 4;
DRAW_E.larva = (e, fx, fy, fl) => {
  const L = CMI.get().lv[clamp(e.grow || 0, 0, 2)], k = cmLvPose(e), j = cmJit(e, e.state === 'rear', 34);
  const img = cvPick(L[k], e, fl), chew = e.state === 'stuck' ? Math.round(Math.sin(e.t * 18)) : 0;
  lc.drawImage(img, fx - 8 + j, fy - 10 + chew);
};
EYES_E.larva = (e, fx, fy) => { if (e.state === 'rear') { lc.globalAlpha = 0.45; lc.drawImage(CMI.GL.mouth, fx + e.facing * 6 - 3, fy - 9); } };
WARN_E.larva = e => e.state === 'rear';

/* ================= comportamento ================= */
const cmClaims = new Map();   // bloco a lacrar -> a operária que foi lá
let cmInTry = false, cmGrouping = false, cmTryWrapped = false;
const cmLive = e => e && !e.dead && enemies.includes(e);
function cmCrumbs(x, y, n, R) {
  if (parts.length > 650) return;
  for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-2, 2), y: y + rnd(-1, 1), vx: rnd(-30, 30), vy: rnd(-60, -10), g: 360, life: 0.5, max: 0.5, col: R[Math.floor(Math.random() * R.length)], size: 1 });
}
const CM_WAX = ['#d8b850', '#ecd27a', '#b8963a'], CM_DUST = ['#94702e', '#b8923e', '#6e5022', '#d8b45a'], CM_SPARK = ['#ffd878', '#f4b03a', '#fff0a8'];
// som que some com a distância (a colmeia abafa tudo)
const cmNear = (e, r = 220) => clamp(1 - Math.hypot(pl.x - e.x, pl.y - e.y) / r, 0, 1);
function cmSteps(e, dt, rate) {
  if (!e.onGround || Math.abs(e.vx) < 4) return;
  e.stepT = (e.stepT || 0) - dt;
  if (e.stepT <= 0) { e.stepT = rate * (0.8 + Math.random() * 0.4); const v = cmNear(e, 170); if (v > 0.05) sfx.cmPatas(v); }
}

/* ---------- a operária ---------- */
AI.operaria = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  if (!e.ball && !aggro && e.state === 'walk') { e.ballT = (e.ballT || 0) - dt; if (e.ballT <= 0) e.ball = true; }   // faz outra bola com a cera do chão
  if (e.state === 'call') { e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.3); } return; }
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) cmOpBite(e, 1); return; }
  if (e.state === 'bite') {
    const hb = { x: e.facing > 0 ? ecx + 2 : ecx - 16, y: e.y - 3, w: 14, h: e.h + 4 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); }
    e.vx = approach(e.vx, 0, 500 * dt);
    if (e.stateT <= 0) { if (e.biteN === 1) { e.state = 'gap'; e.stateT = 0.1; } else { e.state = 'recover'; e.stateT = 0.45; e.atkCD = 1.2 + Math.random() * 0.6; } }
    return;
  }
  if (e.state === 'gap') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) cmOpBite(e, 2); return; }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  if (e.state === 'seal') {
    e.vx = approach(e.vx, 0, 800 * dt);
    if (Math.random() < dt * 14) cmCrumbs(ecx + e.facing * 8, e.y + 3, 1, CM_WAX);
    if (e.stateT <= 0) { cmOpSeal(e); e.state = 'walk'; }
    return;
  }
  // viu o herói: larga a bola e bate as antenas, chamando as outras
  if (e.sees && !e.called && !pl.dead && dist < 190) {
    e.called = true; e.calmT = 0; e.state = 'call'; e.stateT = 0.7; e.callT = 0; cmOpDrop(e);
    if (typeof cmChamar === 'function') cmChamar(ecx, ecy, 12);
    sfx.cmAntenas(Math.max(0.3, cmNear(e)));
    return;
  }
  if (aggro) { e.calmT = 0; cmOpDrop(e); if (e.sealTg) cmOpRelease(e); }
  else { e.calmT = (e.calmT || 0) + dt; if (e.calmT > 8) e.called = false; }
  let dir = 0, chase = false;
  if (aggro) { dir = Math.abs(dx) < 10 ? 0 : Math.sign(dx); chase = true; }
  else if (e.callT > 0) { e.callT -= dt; const cdx = e.callX - ecx; dir = Math.abs(cdx) < T ? 0 : Math.sign(cdx); if (!dir) e.callT = 0; }
  else if (cmOpPlan(e, dt)) { if (e.state === 'seal') return; dir = e.sealDir; }
  else { cvWander(e, dt); dir = e.wander; }
  if (dir) e.facing = dir;
  walk(e, dt, dir, (aggro || e.callT > 0 ? 46 : 28) + e.lvl * 0.8, 600, 250, dy, chase);
  cmSteps(e, dt, 0.32);
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 22 && Math.abs(dy) < 12 && e.onGround && clearPath(e, pl)) {
    e.state = 'wind'; e.stateT = CM_OP_WIND; e.facing = Math.sign(dx) || e.facing; e.vx = 0; sfx.cmEstalo(0.6);
  }
};
function cmOpBite(e, n) { e.state = 'bite'; e.stateT = 0.14; e.biteN = n; e.swingHit = false; e.vx = e.facing * 70; sfx.cmEstalo(n === 2 ? 1.1 : 1); }
function cmOpDrop(e) { if (!e.ball) return; e.ball = false; e.ballT = 3 + Math.random() * 2; cmCrumbs(e.x + e.w / 2 + e.facing * 8, e.y + 3, 5, CM_WAX); }
function cmOpRelease(e) { const tg = e.sealTg; if (tg && cmClaims.get(tg.k) === e) cmClaims.delete(tg.k); e.sealTg = null; }
// sem herói à vista: um bloco quebrado (cmBroken, 199) que ela enxerga a até 12 blocos; anda até lá e lacra
function cmOpPlan(e, dt) {
  if (typeof cmSeal !== 'function' || typeof cmBroken === 'undefined' || !cmBroken || !cmBroken.size) { if (e.sealTg) cmOpRelease(e); return false; }
  const ecx = e.x + e.w / 2, ecy = e.y + 2;
  let tg = e.sealTg;
  if (tg && (!cmBroken.has(tg.k) || cmClaims.get(tg.k) !== e)) { if (cmClaims.get(tg.k) === e) cmClaims.delete(tg.k); tg = e.sealTg = null; }
  if (!tg) {
    e.sealLook = (e.sealLook || 0) - dt; if (e.sealLook > 0) return false;
    e.sealLook = 0.6 + Math.random() * 0.3;
    let best = null, bd = 12 * T;
    for (const [k, b] of cmBroken) {
      if (e.skip && e.skip.has(k)) continue;
      const c = cmClaims.get(k); if (c && c !== e && cmLive(c)) continue;
      const bx = (b.tx + 0.5) * T, by = (b.ty + 0.5) * T, d = Math.hypot(bx - ecx, by - ecy);
      if (d > bd || !cmCanSeal(b.tx, b.ty) || !losClear(ecx, ecy, bx, by)) continue;
      best = { k, tx: b.tx, ty: b.ty, t: 0 }; bd = d;
    }
    if (!best) return false;
    tg = e.sealTg = best; cmClaims.set(best.k, e);
  }
  tg.t += dt;
  const bx = (tg.tx + 0.5) * T, by = (tg.ty + 0.5) * T, hd = bx - ecx;
  if (tg.t > 8) { (e.skip || (e.skip = new Set())).add(tg.k); cmOpRelease(e); return false; }   // não alcança: desiste dele
  if (Math.abs(hd) <= 1.6 * T && by > e.y - 1.6 * T && by < e.y + e.h + 1.2 * T) {
    const tr = { x: tg.tx * T, y: tg.ty * T, w: T, h: T };
    if (overlap(tr, e)) { e.sealDir = hd > 0 ? -1 : 1; return true; }   // está em cima do buraco: um passo para trás
    if (!cmCanSeal(tg.tx, tg.ty)) { cmOpRelease(e); return false; }
    e.state = 'seal'; e.stateT = 0.8; e.facing = Math.sign(hd) || e.facing; e.vx = 0; e.ball = true; sfx.cmLacrar(cmNear(e));
    return true;
  }
  e.sealDir = Math.abs(hd) > 4 ? Math.sign(hd) : 0;
  return true;
}
function cmOpSeal(e) {
  const tg = e.sealTg; cmOpRelease(e); e.ball = false; e.ballT = 2.5 + Math.random() * 1.5;
  if (!tg || typeof cmSeal !== 'function') return;
  const tr = { x: tg.tx * T, y: tg.ty * T, w: T, h: T };
  if (!cmCanSeal(tg.tx, tg.ty) || overlap(tr, pl) || enemies.some(o => !o.dead && overlap(o, tr))) return;
  cmSeal(tg.tx, tg.ty);
  if (typeof cmBroken !== 'undefined' && cmBroken && solidAt(tg.tx, tg.ty)) cmBroken.delete(tg.k);
  cmCrumbs((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 8, CM_WAX);
}

/* ---------- a soldada porteira ---------- */
AI.soldada = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'rear') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'butt'; e.stateT = 0.24; e.swingHit = false; e.vx = e.facing * 140; sfx.cmCabecada(); } return; }
  if (e.state === 'butt') {
    e.vx = e.facing * 140 * Math.max(0.2, e.stateT / 0.24);
    const hb = { x: e.facing > 0 ? e.x + e.w - 4 : e.x - 14, y: e.y - 6, w: 18, h: e.h + 6 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) {
      e.swingHit = true;
      const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit') { pl.vx = e.facing * 330; pl.vy = -210; pl.onGround = false; shake(4); }   // joga uns 3 blocos
      else if (r === 'block') pl.vx += e.facing * 160;
    }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.7; e.atkCD = 2 + Math.random() * 0.8; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  // anda devagar de cabeça baixa; vira com calma (as costas são o ponto fraco)
  if (!aggro) cvWander(e, dt);
  e.turnT = (e.turnT || 0) - dt;
  let dir;
  if (aggro) {
    if (e.turnT <= 0) { const f = Math.sign(dx) || e.facing; if (f !== e.facing) { e.facing = f; sfx.cmPatas(0.5 * cmNear(e)); } e.turnT = 0.9; }
    dir = Math.abs(dx) < 6 ? 0 : Math.sign(dx); if (dir !== e.facing) dir = 0;
  } else { dir = e.wander; if (dir) e.facing = dir; }
  walk(e, dt, dir, 16 + e.lvl * 0.4, 260, 220, dy, aggro);
  if (e.cmPin) {   // o herói preso entre a cabeça e a parede: ela aperta
    e.vx = 0; e.crushT = (e.crushT ?? 0.3) - dt;
    if (e.crushT <= 0) { e.crushT = 0.8; const r = hurtPlayer(Math.round(e.dmg * 0.5), ecx, e, false); if (r === 'hit') { sfx.cmEsmaga(); shake(2); } }
  } else e.crushT = 0.3;
  cmSteps(e, dt, 0.5);
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 36 && Math.abs(dy) < 16 && Math.sign(dx) === e.facing && e.onGround && clearPath(e, pl)) {
    e.state = 'rear'; e.stateT = CM_SD_REAR; e.vx = 0; sfx.cmRonco(cmNear(e, 260));
  }
};
const cmSdExposed = e => e.state === 'rear' || e.state === 'butt' || e.state === 'recover';

/* ---------- a formiga-leão ---------- */
// o centro do funil dela (px), a linha do chão no fundo e a meia-largura; sem funil, onde ela se enterrou
function cmFlHome(e) {
  if (e.funnel) return { x: (e.funnel.cx + 0.5) * T, y: e.funnel.fy * T, r: e.funnel.r };
  if (!e.home) e.home = { x: e.x + e.w / 2, y: e.y + e.h, r: 1 };
  return e.home;
}
AI.formigaleao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  // o spawn comum não a cria: quem mora na colmeia ganha funil do 195 logo depois de nascer
  if (e.cmTry) { e.cmTry = false; if (!e.funnel && typeof cmFunnels !== 'undefined' && cmFunnels.length) { e.dead = true; e.despawn = true; return; } }
  if (e.state === 'settle' && e.funnel) e.state = 'buried';
  if (e.state === 'settle') {   // nasceu no ar, sem funil: cai e se enterra onde parar
    e.vx = 0; e.vy = Math.min(e.vy + GRAV * dt, MAXFALL);
    if (e.onGround) { e.state = 'buried'; e.home = { x: e.x + e.w / 2, y: e.y + e.h, r: 1 }; burst(e.x + e.w / 2, e.y + e.h, 6, '#94702e', 40, 200, 0.4); }
    return;
  }
  if (e.state === 'travel') { cmFlTravel(e, dt); return; }
  const H = cmFlHome(e), pcx = pl.x + pl.w / 2, pfy = pl.y + pl.h;
  e.cmNoMove = false; e.vx = 0; e.vy = 0; e.x = H.x - e.w / 2; e.y = H.y - e.h;
  const near = !pl.dead && Math.abs(pcx - H.x) < 20 && pfy > H.y - 3 * T && pfy <= H.y + 4;
  if (e.state === 'buried') {
    e.rise = 0;
    if (near && e.atkCD <= 0) { e.state = 'warn'; e.stateT = CM_FL_WARN; e.facing = Math.sign(pcx - H.x) || e.facing; sfx.cmGraos(); return; }
    if (e.fought) {   // o herói fugiu: depois de um tempo ela cava e vai para outro funil
      const far = pl.dead || Math.abs(pcx - H.x) > (H.r + 6) * T || Math.abs(pfy - H.y) > 6 * T;
      e.farT = far ? (e.farT || 0) + dt : 0;
      if (e.farT > 3) { e.farT = 0; cmFlMove(e); }
    }
    return;
  }
  if (e.state === 'warn') {   // os grãos tremem em volta, as pinças sobem
    if (Math.random() < dt * 40) { const gx = H.x + rnd(-H.r - 1, H.r + 1) * T * 0.7; cmCrumbs(gx, H.y - 1 - Math.abs(gx - H.x) * 0.5, 1, CM_DUST); }
    if (e.stateT <= 0) {
      e.state = 'snap'; e.stateT = 0.25; e.rise = 1; e.fought = true; sfx.cmPinca();
      burst(H.x, H.y - 2, 10, '#94702e', 70, 260, 0.5);
      const hb = { x: H.x - 16, y: H.y - 26, w: 32, h: 27 };
      if (!pl.dead && overlap(hb, pl)) hurtPlayer(e.dmg, H.x, e, false);
    }
    return;
  }
  if (e.state === 'snap') { if (e.stateT <= 0) { e.state = 'out'; e.stateT = 1.2; } return; }
  if (e.state === 'out') { e.rise = 1; if (e.stateT <= 0) { e.state = 'dig'; e.stateT = 0.6; sfx.cmCavar(cmNear(e)); } return; }
  if (e.state === 'dig') {
    e.rise = clamp(e.stateT / 0.6, 0, 1);
    if (Math.random() < dt * 20) cmCrumbs(H.x + rnd(-6, 6), H.y - 1, 1, CM_DUST);
    if (e.stateT <= 0) { e.state = 'buried'; e.atkCD = 0.8; }
    return;
  }
  e.state = 'buried';
};
// o funil livre mais perto (nenhuma outra formiga-leão viva mora lá)
function cmFlMove(e) {
  if (typeof cmFunnels === 'undefined' || !cmFunnels.length) return;
  const ecx = (e.x + e.w / 2) / T, ecy = (e.y + e.h) / T;
  let best = null, bd = 1e9;
  for (const F of cmFunnels) {
    if (F === e.funnel || enemies.some(o => o !== e && !o.dead && o.type === 'formigaleao' && o.funnel === F)) continue;
    const d = Math.hypot(wdx(F.cx + 0.5 - ecx), F.fy - ecy); if (d < bd) { bd = d; best = F; }
  }
  if (!best || bd > 90) return;
  e.funnel = best; e.state = 'travel'; e.travelT = 0; e.cmNoMove = true; e.rise = 0;
  burst(e.x + e.w / 2, e.y + e.h, 10, '#94702e', 60, 260, 0.5); sfx.cmCavar(cmNear(e));
}
function cmFlTravel(e, dt) {
  e.cmNoMove = true; e.vx = 0; e.vy = 0; e.travelT += dt;
  const F = e.funnel; if (!F) { e.state = 'buried'; e.cmNoMove = false; return; }
  const tx = (F.cx + 0.5) * T - e.w / 2, ty = F.fy * T - e.h;
  let ddx = tx - e.x; if (typeof WW !== 'undefined') ddx = wdx(ddx / T) * T;
  const ddy = ty - e.y, d = Math.hypot(ddx, ddy), sp = 34 * dt;
  if (d <= sp + 1 || e.travelT > 40) {
    e.x = tx; e.y = ty; e.state = 'buried'; e.cmNoMove = false; e.moundY = undefined; e.atkCD = 1; e.farT = 0;
    burst(e.x + e.w / 2, e.y + e.h, 8, '#94702e', 50, 240, 0.4); return;
  }
  e.x += ddx / d * sp; e.y += ddy / d * sp; if (Math.abs(ddx) > 1) e.facing = Math.sign(ddx);
  // onde há chão logo em cima dela, o montinho aparece correndo por ele
  const col = Math.floor((e.x + e.w / 2) / T), row = Math.floor((e.y + e.h) / T);
  e.moundY = undefined;
  for (let k = -3; k <= 3; k++) if (solidAt(col, row + k) && !solidAt(col, row + k - 1)) { e.moundY = (row + k) * T; break; }
  if (e.moundY !== undefined && Math.random() < dt * 10) cmCrumbs(e.x + e.w / 2 + rnd(-5, 5), e.moundY - 1, 1, CM_DUST);
  e.digT = (e.digT || 0) - dt; if (e.digT <= 0) { e.digT = 0.9; const v = cmNear(e, 200); if (v > 0.05) sfx.cmCavar(v * 0.5); }
}
// quem está viajando por baixo da terra não se mexe pela física
{ const _m = moveEntity; moveEntity = function (e, dt, step) { if (e.cmNoMove) { e.hitWall = e.hitCeil = false; e.onGround = true; return; } return _m(e, dt, step); }; }

/* ---------- a correição ---------- */
// o ponto onde a cabeça encosta no que pisa e a normal dessa superfície
function cmFilaPoint(e) {
  const s = e.side || 'down', ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  if (s === 'up') return { x: ecx, y: e.y + 1, nx: 0, ny: 1 };
  if (s === 'left') return { x: e.x + 1, y: ecy, nx: 1, ny: 0 };
  if (s === 'right') return { x: e.x + e.w - 1, y: ecy, nx: -1, ny: 0 };
  if (s === 'air') return { x: ecx, y: ecy, nx: 0, ny: -1 };
  return { x: ecx, y: e.y + e.h - 1, nx: 0, ny: -1 };
}
function cmFilaPush(e) {
  const p = cmFilaPoint(e), tr = e.trail, last = tr[tr.length - 1];
  const d = Math.hypot(p.x - last.x, p.y - last.y);
  if (d >= CM_FILA_GAP) { tr.push(p); if (tr.length > CM_FILA + 2) tr.shift(); e.hdx = (p.x - last.x) / d; e.hdy = (p.y - last.y) / d; }
  else if (d > 0.5) { e.hdx = (p.x - last.x) / d; e.hdy = (p.y - last.y) / d; }
  else if (e.side === 'down' || e.side === 'up') { e.hdx = e.facing; e.hdy = 0; }
}
function cmFilaOnHero(e) {
  const r = { x: pl.x - 1, y: pl.y - 1, w: pl.w + 2, h: pl.h + 2 };
  for (const a of cmFilaAnts(e, cmAntsTmp)) if (a.x >= r.x && a.x <= r.x + r.w && a.y >= r.y && a.y <= r.y + r.h) return a;
  return null;
}
AI.correicao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (!e.trail) { const p = cmFilaPoint(e); e.trail = []; for (let i = 0; i < CM_FILA; i++) e.trail.push(p); }
  const C = cpContacts(e), any = C.down || C.up || C.left || C.right, sp = 60 + e.lvl * 1.6;
  // o chiado: milhares de patinhas e mandíbulas; ouve-se antes de ver
  e.hissT = (e.hissT || 0) - dt;
  if (e.hissT <= 0) { e.hissT = 0.42 + Math.random() * 0.2; const v = cmNear(e, 300); if (v > 0.03) sfx.cmChiado(v); }
  // onde a fila passa por cima do herói, morde
  if (!pl.dead && e.atkCD <= 0) { const a = cmFilaOnHero(e); if (a) { const r = hurtPlayer(e.dmg, a.x, e, false); e.atkCD = 0.8; if (r !== 'none') sfx.cmMordiscos(); } }
  if (e.state === 'fall') {
    e.side = 'air'; e.vy = Math.min(e.vy + GRAV * dt, MAXFALL); e.vx = approach(e.vx, 0, 120 * dt);
    if ((C.down || e.onGround) && e.vy >= 0) { e.state = 'walk'; e.vy = 0; e.side = 'down'; }
    cmFilaPush(e); return;
  }
  if (!any) {   // perdeu o chão: dá a volta na quina por um instante e, se não achar nada, cai
    e.cornerT = (e.cornerT || 0) - dt;
    if (e.lastN && e.cornerT > 0) { const [nx, ny] = e.lastN, [mx, my] = e.mv || [0, 0]; e.vx = nx * sp * 0.7 - mx * sp * 0.6; e.vy = ny * sp * 0.7 - my * sp * 0.6; cmFilaPush(e); return; }
    e.state = 'fall'; e.lastN = null; cmFilaPush(e); return;
  }
  e.cornerT = 0.3;
  if (!aggro) cvWander(e, dt);
  let wx = aggro ? (Math.abs(dx) > 4 ? Math.sign(dx) : 0) : e.wander;
  const wy = aggro ? (Math.abs(dy) > 4 ? Math.sign(dy) : 0) : 0;
  if (aggro && !wx && ((C.down && wy > 0) || (C.up && wy < 0))) wx = e.facing;   // ele está do outro lado deste chão: dá a volta pela beirada
  let vx = 0, vy = 0, side = C.down ? 'down' : C.up ? 'up' : C.left ? 'left' : 'right';
  if (C.down || C.up) { vx = wx * sp; vy = C.down ? 30 : -30; }
  const wd = C.left ? -1 : C.right ? 1 : 0;
  if (wd && (wx === wd || (wx === 0 && wy !== 0) || !(C.down || C.up))) {   // sobe ou desce pela parede
    // o herói do outro lado da sala: desce para o chão (só sobe se ele estiver bem mais alto)
    let my = wx === -wd ? (dy < -16 ? -1 : 1) : wy || (C.up ? 1 : -1); if (C.down && my > 0) my = -1; if (C.up && my < 0) my = 1;
    vy = my * sp * 0.85; vx = wd * 30; side = wd < 0 ? 'left' : 'right';
  }
  // no teto e o herói lá embaixo, sem parede por perto: solta-se como uma chuva de formigas
  if (C.up && !C.down && !wd && aggro && Math.abs(dx) < 8 && dy > 14 && losClear(e.x + e.w / 2, e.y + e.h + 2, pl.x + pl.w / 2, pl.y)) { e.state = 'fall'; e.vy = 20; cmFilaPush(e); return; }
  e.vx = vx; e.vy = vy; e.side = side;
  const n = side === 'down' ? [0, 1] : side === 'up' ? [0, -1] : side === 'left' ? [-1, 0] : [1, 0];
  e.lastN = n;
  if (side === 'down' || side === 'up') { if (vx) { e.facing = Math.sign(vx); e.mv = [Math.sign(vx), 0]; } }
  else e.mv = [0, Math.sign(vy) || -1];
  cmFilaPush(e);
};

/* ---------- a larva faminta ---------- */
const CM_LV_MAXSTUCK = 3;
AI.larva = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  if (e.state === 'stuck') {   // agarrada no herói, mastigando
    if (pl.dead) { cmLvDrop(e); return; }
    e.x = pcx + e.offX - e.w / 2; e.y = pl.y + e.offY; e.vx = 0; e.vy = -GRAV * dt; e.facing = e.offX > 0 ? -1 : 1;
    e.chewT -= dt;
    if (e.chewT <= 0) {
      e.chewT = 0.75; sfx.cmMastigar(1);
      if (!(typeof modoDeus !== 'undefined' && modoDeus) && pl.invuln <= 0) {
        const d = armorTaken(Math.max(1, Math.round(e.dmg * 0.45)));
        pl.hp -= d; pl.hurtFlash = 0.08; pl.lastHurt = gameTime; pl.regen = 0;
        floatText(pcx, pl.y - 6, '-' + d, '#ff8a6a', 0.85); burst(e.x + e.w / 2, e.y + 2, 3, '#c8323c', 40, 300, 0.3);
        if (pl.hp <= 0) { pl.hp = 0; die(); }
      }
    }
    return;
  }
  if (e.state === 'rear') { e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { e.state = 'leap'; e.stateT = 1.2; e.swingHit = false; e.vy = -215; e.vx = e.facing * clamp(Math.abs(dx) * 2.6, 70, 165); e.onGround = false; sfx.cmPulo(); } return; }
  if (e.state === 'leap') {
    if (!e.swingHit && !pl.dead && overlap({ x: e.x - 1, y: e.y - 1, w: e.w + 2, h: e.h + 2 }, pl)) {
      e.swingHit = true;
      const stuck = enemies.filter(o => o.type === 'larva' && o.state === 'stuck' && !o.dead).length;
      const r = hurtPlayer(e.dmg, ecx, e, false);
      if (r === 'hit' && stuck < CM_LV_MAXSTUCK) { e.state = 'stuck'; e.offX = clamp(ecx - pcx, -3, 3); e.offY = 5 + Math.random() * 7; e.chewT = 0.6; sfx.cmMastigar(1.2); return; }
      e.vx = -e.vx * 0.4; e.vy = Math.min(e.vy, -60);   // o escudo a rebate
    }
    if ((e.onGround && e.stateT < 1.05) || e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.6; }
    return;
  }
  cmLvEat(e);
  // rasteja em sanfona: estica e encolhe; anda só no estirão
  const ph = (e.t * 2.2) % 1, push = Math.max(0, Math.sin(ph * Math.PI * 2)) * 0.9 + 0.1;
  let dir = 0, chase = false;
  if (aggro) { dir = Math.abs(dx) < 6 ? 0 : Math.sign(dx); chase = true; }
  else {
    const o = cmLvFood(e, dt);
    if (o) dir = Math.abs(o.x - ecx) < 2 ? 0 : Math.sign(o.x - ecx);
    else { cvWander(e, dt); dir = e.wander; }
  }
  if (dir) e.facing = dir;
  walk(e, dt, dir, (24 + e.lvl * 0.5) * push, 500, 200, dy, chase);
  if (Math.abs(e.vx) > 3 && e.onGround) { e.slurpT = (e.slurpT || 0) - dt; if (e.slurpT <= 0) { e.slurpT = 0.45; const v = cmNear(e, 140); if (v > 0.1) sfx.cmRasto(v); } }
  if (aggro && e.atkCD <= 0 && Math.abs(dx) < 42 && Math.abs(dx) > 4 && Math.abs(dy) < 16 && e.onGround && clearPath(e, pl)) {
    e.state = 'rear'; e.stateT = CM_LV_REAR; e.facing = Math.sign(dx) || e.facing; e.vx = 0; sfx.cmLarvaBoca(cmNear(e));
  }
};
function cmLvDrop(e) { e.state = 'walk'; e.vy = -80; e.vx = (e.offX > 0 ? 1 : -1) * 50; e.atkCD = 1.4; e.y = Math.min(e.y, pl.y + pl.h - e.h - 1); }
// o loot mais perto que ela vê (a até 8 blocos)
function cmLvFood(e, dt) {
  e.foodT = (e.foodT || 0) - dt;
  if (e.foodT > 0) return e.food && loot.includes(e.food) ? e.food : null;
  e.foodT = 0.5; e.food = null;
  if ((e.eaten ? e.eaten.length : 0) >= 4) return null;
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2; let bd = 8 * T;
  for (const o of loot) { if (!o.rest) continue; const d = Math.hypot(o.x - ecx, o.y - 4 - ecy); if (d < bd && losClear(ecx, ecy, o.x, o.y - 4)) { bd = d; e.food = o; } }
  return e.food;
}
// come o que passar por baixo dela: tira do chão, guarda e cresce
function cmLvEat(e) {
  if (!e.onGround || (e.eaten && e.eaten.length >= 4)) return;
  const ecx = e.x + e.w / 2, fy = e.y + e.h;
  for (let i = loot.length - 1; i >= 0; i--) {
    const o = loot[i];
    if (o.t < 0.8 || Math.abs(o.x - ecx) > e.w / 2 + 3 || Math.abs(o.y - fy) > 7) continue;
    loot.splice(i, 1); (e.eaten || (e.eaten = [])).push(o);
    sfx.cmMastigar(0.9 * Math.max(0.3, cmNear(e)));
    burst(o.x, o.y - 3, 5, '#f4d6a8', 40, 300, 0.35);
    if ((e.grow || 0) < 2) {   // cresce: +50% da vida de quando nasceu, e um pouco de tamanho
      const base = e.baseHp || (e.baseHp = e.maxHp);
      e.grow = (e.grow || 0) + 1; e.maxHp += Math.round(base * 0.5); e.hp += Math.round(base * 0.5);
      const w = 9 + e.grow, h = e.grow >= 2 ? 6 : 5;
      e.x -= (w - e.w) / 2; e.y -= h - e.h; e.w = w; e.h = h;
      if (rectSolid(e.x, e.y, e.w, e.h)) e.y -= 1;
    }
    return;
  }
}

/* ---------- golpes, mortes, nascimentos ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (!e || e.dead) return _hit(e, dir, mult, melee);
  const t = e.type;
  if (t === 'formigaleao' && (e.state === 'buried' || e.state === 'travel' || e.state === 'settle' || (e.state === 'dig' && (e.rise || 0) < 0.4))) {
    // debaixo do pó o golpe só levanta poeira
    cmCrumbs(e.x + e.w / 2, e.y + e.h - 1, 5, CM_DUST); sfx.cmCavar(0.4); return;
  }
  if (t === 'soldada' && !cmSdExposed(e) && dir === -e.facing) {   // a placa da frente: só 20% passa
    mult *= 0.2; cmCrumbs(e.x + e.w / 2 + e.facing * 9, e.y + 4, 6, CM_SPARK); sfx.cmPlaca();
  }
  if (t === 'larva' && e.state === 'stuck') cmLvDrop(e);
  const n0 = t === 'correicao' ? cmFilaN(e) : 0;
  const r = _hit(e, dir, mult, melee);
  if (t === 'formigaleao' && !e.dead) { e.vx = 0; e.vy = 0; e.stun = 0; }   // presa ao funil: não recua
  if (t === 'soldada' && !e.dead) e.stun = cmSdExposed(e) ? 0 : Math.min(e.stun, 0.12);
  if (t === 'correicao' && !e.dead) {   // as formigas do rabo morrem, a fila encurta
    e.stun = Math.min(e.stun, 0.1); const ants = cmFilaAnts(e, cmAntsTmp);
    for (let i = cmFilaN(e); i < n0; i++) { const p = (e.trail || [])[e.trail.length - i]; if (p) burst(p.x, p.y, 3, '#2a1a0c', 50, 300, 0.5); }
    if (ants.length) sfx.cmMordiscos(0.5);
  }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!CMI_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  if (e.type === 'operaria') { if (e.ball) cmCrumbs(cx + e.facing * 8, e.y + 3, 8, CM_WAX); cmOpRelease(e); }
  if (e.type === 'correicao' && e.trail) for (const p of e.trail.slice(-CM_FILA)) burst(p.x, p.y, 2, '#1e140a', 50, 300, 0.6);
  if (e.type === 'formigaleao') burst(cx, e.y + e.h, 12, '#94702e', 70, 260, 0.6);
  if (e.type === 'larva') {
    burst(cx, cy, 10, '#f4d6a8', 70, 300, 0.5);
    for (const o of e.eaten || []) {   // devolve tudo o que comeu (o equipamento volta o mesmo)
      if (o.item) loot.push(Object.assign(o, { x: cx, y: cy, vx: rnd(-45, 45), vy: rnd(-150, -85), t: 0, rest: false }));
      else dropLoot(cx, cy, o.id, o.n);
    }
    e.eaten = null;
    if ((e.grow || 0) > 0 && Math.random() < 0.35 + 0.25 * e.grow) dropLoot(cx, cy, 'geleia_real', 1);
    sfx.cmMastigar(0.6);
  }
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !CMI_TYPES.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;   // nasceu de um bloco ou na borda: para o primeiro lugar livre
  if (type === 'operaria') { e.ball = Math.random() < 0.85; e.ballT = 0; e.called = false; e.atkCD = 0.6; }
  else if (type === 'soldada') { e.atkCD = 1; e.turnT = 0; }
  else if (type === 'formigaleao') { e.state = 'settle'; e.rise = 0; e.atkCD = 1; e.cmTry = cmInTry; }
  else if (type === 'correicao') { e.state = 'walk'; e.side = 'down'; e.atkCD = 0.6; e.hissT = Math.random() * 0.4; }
  else if (type === 'larva') {
    e.state = 'walk'; e.grow = 0; e.eaten = null; e.atkCD = 0.8 + Math.random() * 0.6; e.baseHp = 0;
    // as do spawn comum vêm em grupo de 3 a 5 (as de ovo, favo e parasita nascem sozinhas)
    if (cmInTry && !cmGrouping) {
      cmGrouping = true;
      try {
        const n = 2 + Math.floor(Math.random() * 3), fy = Math.floor((e.y + e.h + 1) / T);
        for (let i = 0, made = 0; i < 10 && made < n; i++) {
          const ox = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 26), x = e.x + ox;
          if (rectSolid(x, e.y, e.w, e.h) || !solidAt(Math.floor((x + e.w / 2) / T), fy)) continue;
          spawnEnemy('larva', x, e.y, zone); made++;
        }
      } finally { cmGrouping = false; }
    }
  }
  return e;
}; }
// quem nasce pelo spawn comum (larvas em grupo, formiga-leão fora do funil): o trySpawn mais de fora, embrulhado
// uma vez quando o primeiro mundo começa (os mundos das camadas embrulham trySpawn depois deste arquivo)
function cmWrapTry() {
  if (cmTryWrapped) return; cmTryWrapped = true;
  const _ts = trySpawn; trySpawn = function () { cmInTry = true; try { return _ts(); } finally { cmInTry = false; } };
}

/* ---------- o herói: o pó do funil, a cabeça da soldada, a fila que se acerta ---------- */
{ const _up = updatePlayer; updatePlayer = function (dt) {
  // a correição se acerta em qualquer ponto da fila: durante o quadro do herói a caixa dela vai para a formiga mais
  // perto de onde a lâmina corre (na frente dele, embaixo, no meio e em cima)
  const moved = [];
  if (!pl.dead) {
    const pcx = pl.x + pl.w / 2, f = pl.facing, refs = [[pcx + f * 12, pl.y + pl.h - 3], [pcx + f * 13, pl.y + 9], [pcx + f * 6, pl.y - 5]];
    for (const e of enemies) {
      if (e.dead || e.type !== 'correicao' || !e.trail || Math.abs(e.x - pl.x) > 140) continue;
      let best = null, bd = 1e9;
      for (const a of cmFilaAnts(e, cmAntsTmp)) for (const [rx, ry] of refs) { const d = Math.hypot(a.x - rx, a.y - ry); if (d < bd) { bd = d; best = a; } }
      if (best) { moved.push([e, e.x, e.y]); e.x = best.x - e.w / 2; e.y = best.y - e.h / 2; }
    }
  }
  let r;
  try { r = _up(dt); } finally { for (const [e, x, y] of moved) { e.x = x; e.y = y; } }
  if (pl.dead) return r;
  const pcx = pl.x + pl.w / 2;
  // a larva agarrada no peito fica dentro do cabo da arma: qualquer golpe que o herói dá a derruba
  if (pl.atkT >= 0) {
    const tm = pl.twoHand && typeof GS_TM !== 'undefined' ? GS_TM : ATK_TM;
    if (pl.atkT >= tm.wind && pl.atkT <= tm.wind + tm.swing + 0.02)
      for (const e of enemies) if (!e.dead && e.type === 'larva' && e.state === 'stuck' && !pl.atkHit.has(e)) { pl.atkHit.add(e); hitEnemy(e, pl.facing, 1, true); }
  }
  // a soldada tampa o túnel: de frente não se passa; ela empurra e, contra a parede, esmaga
  for (const e of enemies) {
    if (e.dead || e.type !== 'soldada') continue;
    e.cmPin = false;
    if (!overlap(pl, e) || pl.y + pl.h <= e.y + 3) continue;
    const ecx = e.x + e.w / 2, side = Math.sign(pcx - ecx) || e.facing;
    if (side !== e.facing) continue;
    const tx = e.facing > 0 ? e.x + e.w : e.x - pl.w;
    if (!rectSolid(tx, pl.y, pl.w, pl.h)) { pl.x = tx; if (Math.sign(pl.vx) === -e.facing) pl.vx = 0; }
    else { e.cmPin = true; if (Math.sign(pl.vx) === -e.facing) pl.vx = 0; }
  }
  // o pó de cera do funil: quem pisa escorrega para o centro (pulando, sai)
  if (pl.onGround && typeof cmFunnels !== 'undefined' && cmFunnels.length) {
    const tx = Math.floor(pcx / T), ty = Math.floor((pl.y + pl.h + 1) / T);
    if (tileAt(Math.floor((pl.x + 1) / T), ty) === CM_PO_CERA || tileAt(Math.floor((pl.x + pl.w - 0.01) / T), ty) === CM_PO_CERA) {
      const F = cmFunnels.find(F => Math.abs(wdx(tx - F.cx)) <= F.r + 1 && ty <= F.fy + 1 && ty >= F.fy - F.r - 2);
      if (F) {
        const cx = (F.cx + 0.5) * T, d = cx - pcx;
        if (Math.abs(d) > 2) { const s = Math.sign(d) * Math.min(Math.abs(d), CM_SLIDE * dt); if (!rectSolid(pl.x + s, pl.y, pl.w, pl.h)) pl.x += s; }
        if (typeof fungLentidao === 'function') fungLentidao(0.35, 0.2);
        if (Math.random() < dt * 14) cmCrumbs(pcx + rnd(-3, 3), pl.y + pl.h - 1, 1, CM_DUST);
      }
    }
  }
  return r;
}; }

/* ---------- a cada quadro: os chamados das antenas ---------- */
function cmiUpdate(dt) {
  if (!cmTryWrapped) cmWrapTry();
  if (typeof cmCalls !== 'undefined' && cmCalls.length) {
    for (const c of cmCalls) for (const e of enemies) {
      if (e.dead || e.type !== 'operaria' || e.state === 'call') continue;
      if (Math.hypot(e.x + e.w / 2 - c.x, e.y + e.h / 2 - c.y) > c.r * T) continue;
      e.callX = c.x; e.callY = c.y; e.callT = 6; e.memT = Math.max(e.memT || 0, 3); e.called = true; e.calmT = 0;
      if (e.sealTg) cmOpRelease(e);
      cmOpDrop(e);
    }
    cmCalls.length = 0;
  }
  if (cmClaims.size) for (const [k, o] of cmClaims) if (!cmLive(o)) cmClaims.delete(k);
}
HOOK.update.push(cmiUpdate);
function clearCmiFx() { cmClaims.clear(); if (typeof cmCalls !== 'undefined') cmCalls.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearCmiFx(); cmiTables(); cmWrapTry(); return _nw(sd, sv); }; }

/* ---------- sons ---------- */
Object.assign(sfx, {
  // patinhas de quitina no chão de cera
  cmPatas(v = 1) { for (let k = 0; k < 4; k++) noise(0.012, 0.022 * v, 4200 + k * 300, 'highpass', k * 0.035); },
  // o estalo das mandíbulas
  cmEstalo(v = 1) { tone(2300, 0.02, 'square', 0.035 * v, -900); noise(0.035, 0.05 * v, 4200, 'highpass'); tone(1400, 0.02, 'square', 0.02 * v, -500, 0.03); },
  // as antenas batendo: um tamborzinho seco e rápido
  cmAntenas(v = 1) { for (let k = 0; k < 7; k++) { tone(820 + (k % 2) * 160, 0.018, 'triangle', 0.028 * v, -200, k * 0.07); noise(0.01, 0.02 * v, 3600, 'highpass', k * 0.07); } },
  cmLacrar(v = 1) { noise(0.25, 0.04 * v, 800, 'lowpass', 0, 1); for (let k = 0; k < 3; k++) noise(0.04, 0.03 * v, 1600, 'bandpass', 0.2 + k * 0.18, 2); },
  cmPlaca() { tone(520, 0.07, 'square', 0.03, -220); noise(0.07, 0.06, 2600, 'bandpass', 0, 3); },
  cmRonco(v = 1) { tone(62, 0.8, 'sawtooth', 0.03 * v, 26); noise(0.8, 0.025 * v, 320, 'bandpass', 0, 4); for (let k = 0; k < 6; k++) tone(1900, 0.015, 'square', 0.015 * v, -600, 0.1 + k * 0.11); },
  cmCabecada() { noise(0.22, 0.12, 300, 'lowpass'); tone(88, 0.22, 'sine', 0.08, -40); },
  cmEsmaga() { noise(0.18, 0.1, 500, 'lowpass'); tone(140, 0.12, 'square', 0.03, -80); noise(0.08, 0.05, 3000, 'highpass', 0.05); },
  // os grãos do funil tremendo e as pinças fechando
  cmGraos() { noise(0.6, 0.05, 1800, 'bandpass', 0, 3); noise(0.6, 0.03, 600, 'lowpass', 0.05); },
  cmPinca() { tone(1500, 0.03, 'square', 0.05, -700); noise(0.05, 0.08, 3200, 'highpass'); noise(0.2, 0.05, 900, 'lowpass', 0.02); },
  cmCavar(v = 1) { noise(0.45, 0.05 * v, 650, 'lowpass', 0, 1); noise(0.3, 0.02 * v, 2400, 'bandpass', 0.1, 2); },
  // a correição: um chiado seco de mil patas, com estalinhos
  cmChiado(v = 1) { noise(0.42, 0.022 * v, 6200, 'highpass', 0, 0.7); for (let k = 0; k < 4; k++) noise(0.008, 0.03 * v, 3000 + Math.random() * 3000, 'bandpass', Math.random() * 0.4, 3); },
  cmMordiscos(v = 1) { for (let k = 0; k < 5; k++) tone(2600 + Math.random() * 800, 0.012, 'square', 0.02 * v, -900, k * 0.03); },
  // a larva: rasto molhado, a boca abrindo, o pulo, o mastigar
  cmRasto(v = 1) { noise(0.12, 0.02 * v, 500, 'lowpass', 0, 1); },
  cmLarvaBoca(v = 1) { tone(420, 0.35, 'sine', 0.02 * v, 380); noise(0.35, 0.03 * v, 900, 'bandpass', 0, 2); },
  cmPulo() { noise(0.1, 0.04, 1200, 'bandpass', 0, 2); tone(300, 0.1, 'sine', 0.02, 200); },
  cmMastigar(v = 1) { for (let k = 0; k < 3; k++) { noise(0.06, 0.045 * v, 650 + k * 120, 'lowpass', k * 0.1); tone(170, 0.05, 'sine', 0.015 * v, -60, k * 0.1 + 0.02); } }
});
