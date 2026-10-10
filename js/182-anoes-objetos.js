'use strict';

/* ================= a Fortaleza dos Anões: objetos de cena =================
   Tudo o que é maior que um bloco e veste Brasafunda (docs/camadas/08-fortaleza-anoes.md, seção 5): 28 objetos e o
   pedestal do Cinzel.
   Nos Portões de Bronze: o portão de bronze caído (arrombado de baixo para cima), estátuas de anão guerreiro com o
   machado de ponta para baixo, carrinhos de minério, o estandarte do clã, escudo e machados cruzados na parede.
   Nos Salões do Clã: o rei sentado no trono de pedra e os sarcófagos de tampa rúnica (túmulos), a mesa comprida posta
   e abandonada com os bancos de pedra (refeitórios), o barril grande com torneira, o beliche de pedra (dormitórios),
   o lustre de bronze com lâmpadas de runa (acesas), a porta redonda do tesouro arrombada e vazia, o mural do êxodo.
   Nos Canais de Lava: a engrenagem caída, a bomba de lava com tanque (só ao lado de um canal), a barricada de mesas e
   escudos virada para baixo, a corrente de guindaste com gancho, a roldana com corda, a engrenagem gigante em relevo
   que ainda gira devagar.
   Nas Forjas de Runas: a fornalha com fole (acesa), a bigorna de runas grande (acesa), o suporte de lâminas largas
   inacabadas, o monte de lingotes velhos, o casulo de cera rachado e vazio, o buraco hexagonal derretido numa chapa.
   Em todas: a carcaça de autômato desligado (a que o Barba-de-Ferro possui) e a marca do clã em bronze (o martelo
   sobre a montanha com três runas embaixo: a mesma da bigorna do Grimaldo).
   O mesmo pintor do 122/132 (rampas de 6 tons da seção 12, luz de cima à esquerda, contorno escuro só onde toca o ar,
   grão), com o que é próprio dos anões: tudo reto, simétrico e bem acabado, mas gasto: quinas lascadas (chip),
   bronze com pátina nas reentrâncias, runas gravadas (escuro com o lábio de baixo aceso).
   Visto de lado: nada é desenhado como disco deitado no chão; cada objeto fica de pé na sua fileira de chão, pende da
   fileira do teto ou é uma peça plana da parede do fundo.
   Luz: só o que os anões acenderam. O lustre (lâmpadas de runa), a fornalha e a bigorna de runas têm `luz` e um
   brilho firme (`firme: true`: o brilho não treme, ao contrário das velas da Cidade), e uma camada `aceso` (uma
   imagem por variação com só os pixels que brilham, desenhada por cima do escuro). A fornalha tem as línguas de fogo
   desenhadas ao vivo (`anim: { k: 'an_fogo' }`, como o fogo dos saqueadores do 132). A engrenagem em relevo gira
   (`anim: { k: 'an_engr' }`: quadros assados uma vez, desenhados logo depois dos pedaços do mundo, antes dos monstros,
   para a luz do mundo escurecer junto).
   Registrados com defProp (`anoes: true`), postos pelo 185 a partir de AN_PROP_PLAN (o mesmo passeio do cdPlaceProps
   do 136) e, nas salas especiais, por anRoomProps(kind, x0, fy, w, R) (no fim deste arquivo).
   Bandeiras que a geração precisa respeitar (o passeio do plano PULA os objetos com qualquer uma das cinco primeiras;
   anRoomProps os põe nas salas certas):
     tumulo: true       só nos túmulos dos reis (o rei sentado, o sarcófago);
     refeitorio: true   só nos refeitórios (a mesa posta, o banco de pedra);
     dormitorio: true   só nos dormitórios (o beliche);
     forja: true        só nas forjas e na Oficina (a fornalha, a bigorna de runas);
     oficina: true      só na Oficina do Mestre, nunca pelo plano (o pedestal do Cinzel; `topo: { x, y }` é o pixel
                        do objeto onde o 189 deita o cinzel);
     canal: true        só no chão ao lado de um canal de lava (a bomba): anNearLava(px, fy, tw) diz se pode;
     grade: true        pode ficar de pé em cima da grade de bronze de um canal (a bomba, a barricada, a carcaça, o
                        carrinho, a engrenagem caída): nas salas de canal o chão é quase todo grade;
     carcaca: true      a carcaça de autômato: o 184 acha em PROPS (p.def.id === 'an_carcaca' && !p.gone) e troca
                        uma por um Soldado de Bronze vivo; três golpes de arma a quebram (aqui: anBreakProp), e quebrada
                        não acorda mais;
     faixaV: {...}      que variações cada faixa usa (a marca nova nos Portões e Salões, a de pátina nas de baixo).
   Ajuda para o 185: anPropClash(X, Y, w, h, front) diz se um retângulo em pixels pisa num objeto já posto (para o
   passeio do plano não cobrir o que anRoomProps já pôs). */
const AN_PROP_PLAN = {};
// peças da parede do fundo que ficam de pé no chão em vez de penduradas na altura dos olhos
const AN_BACK_FLOOR = { an_porta_tesouro: 1, an_engrenagem_relevo: 1, an_mural: 1 };
const AN_ROOM_ONLY = ['tumulo', 'refeitorio', 'dormitorio', 'forja', 'oficina'];   // bandeiras que o passeio do plano pula
const anGearFrames = [];   // os quadros da engrenagem em relevo (desenhados pelo gancho do fim)
{
const { cg, cn } = MNART;
const R6 = hexes => hexes.map(h => ph(h));
const RP = {
  // as rampas da ficha (seção 12)
  granito: R6(['#1e2228', '#2e343c', '#424a54', '#5a646e', '#7a848c', '#9ea6ac']),
  bronze: R6(['#2a1a0c', '#4a2e14', '#70461e', '#9a6a2c', '#c49448', '#e8c27a']),
  patina: R6(['#1a2a24', '#264036', '#345a4a', '#4a7a62', '#6a9a7e', '#94bca0']),
  tijolo: R6(['#3a2a18', '#5a4024', '#7a5832', '#9a7444', '#bc9660', '#dcbc88']),
  lava: R6(['#3a0c04', '#7a1e06', '#b8400a', '#e8700e', '#ffa62a', '#ffe08a']),
  runa: R6(['#0e2a3a', '#145070', '#1e7aa8', '#3aa8d8', '#7ad0f0', '#d0f4ff']),
  mithril: R6(['#1e2a3a', '#2e4258', '#46627e', '#6a8eac', '#9cc0d8', '#d8eef8']),
  cera: R6(['#2e220c', '#4a3814', '#6a521e', '#8a6c2a', '#a8883e', '#c6a65a']),
  // os dos objetos
  ferro: R6(['#0c0e10', '#181c20', '#262c32', '#384046', '#4e585e', '#6a767a']),
  madeira: R6(['#120c08', '#22170e', '#342416', '#48331f', '#5e442a', '#765638']),
  couro: R6(['#150e0a', '#271a12', '#3a281c', '#4e3726', '#644832', '#7a5a40']),
  la: R6(['#1a1614', '#2c2622', '#433a32', '#5c5044', '#766858', '#90826e']),
  rubro: R6(['#1c0806', '#34100a', '#521a10', '#702618', '#8e3622', '#ac4a30']),
  tinta: R6(['#220604', '#3e0c08', '#5e160e', '#7e2216', '#9a3220', '#b4482e']),
  ocre: R6(['#2a1e10', '#463420', '#644c30', '#846642', '#a48258', '#c2a072']),
  carvao: R6(['#08080a', '#111114', '#1a1a1e', '#242428', '#303036', '#3e3e46']),
  brasa: R6(['#1a0a06', '#3a1408', '#6a240a', '#a03a0e', '#d8601a', '#ff9a3a']),
  quitina: R6(['#120c10', '#20161c', '#30222a', '#42303a', '#58404c', '#70525e']),
  apagada: R6(['#101418', '#182028', '#202c38', '#2a3846', '#344454', '#405262']),   // runa sem força: cinza-azulado morto
  sombra: R6(['#030304', '#060607', '#09090b', '#0d0d10', '#121216', '#18181c'])
};
const OUTLINE = ph('#060607');

/* ---- o pintor (o do 122/132: 6 tons, lembra o tom de cada pixel para a mancha manter a luz) ---- */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), zb = new Uint8Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, zb, ramps, idOf, z: 0,
    put(x, y, R, v) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; zb[k] = P.z; },
    clear(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; c[y * w + x] = 0; rid[y * w + x] = -1; },
    has(x, y) { return x >= 0 && y >= 0 && x < w && y < h && c[(y | 0) * w + (x | 0)] !== 0; },
    is(x, y, R) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0 && ramps[rid[y * w + x]] === R; },
    v(x, y) { return val[(y | 0) * w + (x | 0)]; },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    box(x0, y0, rw, rh, R, s, base = 2.6) { P.rect(x0, y0, rw, rh, R, (i, j, x, y) => base + (j === 0 ? 1.4 : j === 1 ? 0.5 : 0) + (i === 0 ? 0.6 : 0) - (j === rh - 1 ? 1.3 : 0) - (i === rw - 1 ? 0.9 : 0) + cg(x, y, s) * 0.5 + cn(x, y, 60, 60, s + 1) * 0.45); },
    blob(cx, cy, rx, ry, R, s, base = 2.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 - d * 0.5 + cg(x, y, s) * 0.4); } },
    line(x0, y0, x1, y1, R, v, wd = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < wd; k++) P.put(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), R, typeof v === 'function' ? v(i / n, k) : v); } },
    done(rim = true) {
      if (rim) {
        const src = c.slice(), sr = rid.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const k = y * w + x; if (src[k]) continue;
          let n = -1; if (x > 0 && src[k - 1]) n = k - 1; else if (x < w - 1 && src[k + 1]) n = k + 1; else if (y > 0 && src[k - w]) n = k - w; else if (y < h - 1 && src[k + w]) n = k + w;
          if (n < 0) continue; const r = sr[n]; c[k] = r >= 0 ? ramps[r][0] : OUTLINE;
        }
      }
      const cv = mk(w, h), x = cv.getContext('2d'), img = x.createImageData(w, h); new Uint32Array(img.data.buffer).set(c); x.putImageData(img, 0, 0); return cv;
    }
  };
  return P;
}
// cola o pintor Q em P em (ox, oy), girado de ang em volta do (px, py) de Q (pixel mais perto, tons mantidos); flip espelha
function blit(P, Q, ox, oy, ang = 0, px = 0, py = 0, flip = false) {
  const ca = Math.cos(ang), sa = Math.sin(ang), m = Math.ceil(Math.hypot(Q.w, Q.h));
  for (let y = -m; y <= m; y++) for (let x = -m; x <= m; x++) {
    const dx = x + 0.5, dy = y + 0.5; let u = Math.floor(dx * ca + dy * sa + px); const v = Math.floor(-dx * sa + dy * ca + py);
    if (flip) u = Q.w - 1 - u;
    if (u < 0 || v < 0 || u >= Q.w || v >= Q.h) continue; const k = v * Q.w + u; if (!Q.c[k]) continue;
    P.put(ox + px + x, oy + py + y, Q.ramps[Q.rid[k]], Q.val[k]);
  }
}
// espelha um pintor inteiro (a luz continua vindo da esquerda: o tom troca de lado de leve)
function mirror(Q) { const P = painter(Q.w, Q.h); for (let y = 0; y < Q.h; y++) for (let x = 0; x < Q.w; x++) { const k = y * Q.w + x; if (Q.c[k]) P.put(Q.w - 1 - x, y, Q.ramps[Q.rid[k]], Q.val[k]); } return P; }
// uma curva grossa: fn(t) -> [x, y], wd(t) a largura; redonda em corte, luz de cima à esquerda
function tube(P, fn, wd, R, s, base = 2.8, n = 0) {
  const [ax, ay] = fn(0), [bx, by] = fn(1); n = n || Math.ceil(Math.hypot(bx - ax, by - ay) * 3) + 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = fn(t), r = Math.max(0.5, wd(t) / 2);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      const dx = (xx + 0.5 - x) / r, dy = (yy + 0.5 - y) / r, d = dx * dx + dy * dy; if (d > 1) continue;
      P.put(xx, yy, R, base + 0.8 - (dx + dy) * 0.95 - d * 0.45 + cg(xx, yy, s) * 0.3);
    }
  }
}
// uma tábua: veio ao comprido, aresta de cima e da esquerda acesas
function plank(P, x0, y0, len, thick, R, s, vert = false, base = 2.6) {
  for (let a = 0; a < len; a++) for (let b = 0; b < thick; b++) {
    const x = vert ? x0 + b : x0 + a, y = vert ? y0 + a : y0 + b;
    let v = base + (b === 0 ? 0.9 : b === thick - 1 ? -0.9 : 0) + Math.sin(a * 0.45 + b * 1.9 + s) * 0.3 + cg(x, y, s) * 0.45;
    if (a === 0 || a === len - 1) v -= 0.5;
    P.put(x, y, R, v);
  }
}
// cantaria anã: blocos grandes e retos, junta finíssima (1 px), aresta de cima e da esquerda acesas; keep(x, y) falso deixa buraco
function ashlar(P, x0, y0, w, h, R, s, ch = 5, cw = 12, keep = null, base = 2.6) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x0 + x, Y = y0 + y; if (keep && !keep(X, Y)) continue;
    const row = Math.floor(y / ch), off = (row % 2) * Math.floor(cw / 2), col = Math.floor((x + off) / cw), ly = y % ch, lx = (x + off) % cw;
    const joint = ly === ch - 1 || lx === cw - 1;
    const v = joint ? base - 1.3 : base + hash2(col, row, s) * 0.7 - 0.25 + (ly === 0 ? 0.8 : 0) + (lx === 0 ? 0.4 : 0) - x / w * 0.6 + cg(X, Y, s) * 0.5 + cn(X, Y, 30, 30, s + 3) * 0.3;
    P.put(X, Y, R, v);
  }
}
// uma mancha sobre o que já está pintado (pátina, fuligem, poeira); só nas rampas de on (ou em tudo); bias engrossa
function stain(P, R, cover, s, bias, lift = 0, on = null) {
  const me = P.idOf(R);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] === me) continue;
    if (on && !on.includes(P.ramps[P.rid[k]])) continue;
    const n = cn(x, y, 22, 22, s) + cn(x, y, 70, 70, s + 1) * 0.5 + (bias ? bias(x, y) : 0);
    if (n > 0.5 - cover) P.put(x, y, R, 0.8 + P.val[k] * 0.6 + cg(x, y, s + 2) * 0.6 + lift);
  }
}
// a pátina do bronze: verde nas reentrâncias e embaixo (onde a água escorreu), nunca na aresta acesa
function patina(P, cover, s, bias) { stain(P, RP.patina, cover - 0.32, s, (x, y) => (bias ? bias(x, y) : 0) + (P.v(x, y) < 2.4 ? 0.3 : -0.3), 0.3, [RP.bronze]); }
// sujeira e fuligem sem trocar de rampa: escurece o tom onde o ruído passa (bias engrossa), só nas rampas de on
function grime(P, amt, cover, s, bias, on = null) {
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k]) continue; const R = P.ramps[P.rid[k]]; if (on && !on.includes(R)) continue;
    const n = cn(x, y, 16, 16, s) + cn(x, y, 50, 50, s + 1) * 0.5 + (bias ? bias(x, y) : 0) - (0.5 - cover);
    if (n > 0) P.put(x, y, R, P.val[k] - Math.min(1, n * 3) * amt);
  }
}
// as juntas entre peças da mesma pedra: cada parte pintada com um P.z maior fica na frente; a de trás ganha sombra
// onde encosta numa da frente (forte embaixo/à direita da da frente, de leve em cima/à esquerda: a luz vem de cima à esquerda)
function seams(P, amt = 1.1) {
  const d = new Float32Array(P.w * P.h);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k]) continue; const z = P.zb[k];
    const fz = (xx, yy) => xx >= 0 && yy >= 0 && xx < P.w && yy < P.h && P.c[yy * P.w + xx] && P.zb[yy * P.w + xx] > z;
    if (fz(x - 1, y) || fz(x, y - 1)) d[k] = amt; else if (fz(x + 1, y) || fz(x, y + 1)) d[k] = amt * 0.45;
    // e a da frente acende a própria borda de cima/esquerda quando encosta numa de trás
    const bz = (xx, yy) => xx >= 0 && yy >= 0 && xx < P.w && yy < P.h && P.c[yy * P.w + xx] && P.zb[yy * P.w + xx] < z;
    if (!d[k] && (bz(x - 1, y) || bz(x, y - 1))) d[k] = -0.5;
  }
  const oz = P.z;
  for (let k = 0; k < d.length; k++) if (d[k]) { P.z = P.zb[k]; P.put(k % P.w, (k / P.w) | 0, P.ramps[P.rid[k]], P.val[k] - d[k]); }
  P.z = oz;
}
// quinas lascadas: tira pixels de borda que têm ar em dois lados (o desgaste), com chance amt
function chip(P, amt, s, on = null) {
  const del = [];
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    if (!P.has(x, y)) continue; if (on && !on.includes(P.ramps[P.rid[y * P.w + x]])) continue;
    const a = (P.has(x - 1, y) ? 0 : 1) + (P.has(x + 1, y) ? 0 : 1) + (P.has(x, y - 1) ? 0 : 1) + (P.has(x, y + 1) ? 0 : 1);
    if (a >= 2 && hash2(x, y, s) < amt) del.push(x, y);
  }
  for (let i = 0; i < del.length; i += 2) P.clear(del[i], del[i + 1]);
}
// rebite: cabeça acesa em cima à esquerda, sombra embaixo à direita
function rivet(P, x, y, R = RP.bronze) { P.put(x, y, R, 4.8); P.put(x + 1, y + 1, R, 1.2); }
// uma chapa de bronze: chanfro aceso em cima e à esquerda, rebites nos cantos (e a cada `every` px na borda)
function plate(P, x0, y0, w, h, s, base = 2.8, every = 0, R = RP.bronze) {
  P.rect(x0, y0, w, h, R, (i, j, x, y) => base + (j === 0 ? 1.3 : j === 1 ? 0.4 : 0) + (i === 0 ? 0.7 : 0) - (j === h - 1 ? 1.2 : 0) - (i === w - 1 ? 0.9 : 0) - i / w * 0.4 + cg(x, y, s) * 0.45 + cn(x, y, 18, 18, s + 1) * 0.35);
  if (w > 5 && h > 5) for (const [x, y] of [[x0 + 2, y0 + 2], [x0 + w - 3, y0 + 2], [x0 + 2, y0 + h - 3], [x0 + w - 3, y0 + h - 3]]) rivet(P, x, y, R);
  if (every) { for (let x = x0 + 2 + every; x < x0 + w - 3; x += every) { rivet(P, x, y0 + 2, R); rivet(P, x, y0 + h - 3, R); } }
}
// as runas dos anões: 3 x 5, retas e angulosas
const GLYPH = [
  ['xx.', 'x.x', 'xx.', 'x.x', 'x..'], ['x.x', 'x.x', '.x.', '.x.', '.x.'], ['.x.', 'x.x', '.x.', 'x.x', '.x.'], ['x..', 'xx.', 'x.x', 'xx.', 'x..'],
  ['xxx', '.x.', '.x.', '.x.', 'xxx'], ['x.x', 'xxx', 'x.x', 'x.x', 'x.x'], ['.xx', 'x..', '.x.', '..x', 'xx.'], ['x.x', '.x.', 'x.x', '.x.', 'x.x'],
  ['xxx', 'x..', 'xx.', 'x..', 'x..'], ['..x', '.xx', 'x.x', '..x', '..x']
];
const glyphOn = (k, i, j) => i >= 0 && j >= 0 && i < 3 && j < 5 && GLYPH[k % GLYPH.length][j][i] === 'x';
// uma runa gravada: o sulco escuro, o lábio de baixo aceso (a luz vem de cima)
function carve(P, x, y, k, R, base = 2.6) {
  for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (glyphOn(k, i, j)) { P.put(x + i, y + j, R, base - 1.5); if (!glyphOn(k, i, j + 1)) P.put(x + i, y + j + 1, R, base + 1.3); }
}
// uma runa cheia (acesa, apagada ou pintada): cor lisa com miolo mais claro; out recebe os pixels (para a camada acesa)
function inlay(P, x, y, k, R, v = 4, out = null) {
  for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (glyphOn(k, i, j)) { const vv = v + (j < 2 ? 0.4 : 0) - (i === 2 ? 0.4 : 0); P.put(x + i, y + j, R, vv); if (out) out.put(x + i, y + j, R, vv + 0.6); }
}
// a marca do clã: um martelo sobre uma montanha, três runas embaixo. W é a largura; devolve o papel de cada pixel
// ('h' martelo, 'm' montanha, 'r' runa, null fora). A mesma marca em todo lugar (placa, sarcófago, porta, estandarte)
function markRole(W) {
  const H = Math.round(W * 1.25), cx = W / 2, base = H * 0.72;
  const hy0 = Math.round(H * 0.03), hy1 = hy0 + Math.max(2, Math.round(H * 0.15)), hx0 = Math.round(W * 0.18), hx1 = Math.round(W * 0.82), hd = W < 14 ? 1 : 2;
  const pk = H * 0.3, slope = (base - pk) / (W * 0.5), p2x = W * 0.76, p2y = H * 0.44, slope2 = slope * 1.25;
  const small = W < 18, rs = Math.round(H * 0.78);
  return (x, y) => {
    const xc = x + 0.5;
    if (y >= hy0 && y < hy1 && x >= hx0 && x < hx1) return 'h';                                          // a cabeça do martelo
    if (y >= hy1 && y < pk - 1 && Math.abs(xc - cx) < hd * 0.5 + 0.01) return 'c';                         // o cabo, até quase o pico
    if (y < base && y >= Math.min(pk + Math.abs(xc - cx) * slope, p2y + Math.abs(xc - p2x) * slope2) && x >= 0 && x < W) return 'm';   // a montanha de dois picos
    if (small) { if (y >= rs && y < rs + 2 && [0.2, 0.5, 0.8].some(f => Math.abs(xc - W * f) < 0.9)) return 'r'; return null; }
    if (y >= rs && y < rs + 5) { for (let q = 0; q < 3; q++) { const gx = Math.round(W * (0.2 + q * 0.3) - 1.5); if (glyphOn([0, 4, 3][q], x - gx, y - rs)) return 'r'; } }
    return null;
  };
}
// pinta a marca em relevo (bronze saltado: aresta de cima e da esquerda acesas) ou gravada (sulco) a partir de (x0, y0)
function clanMark(P, x0, y0, W, R, s, mode = 'relevo', Rr = null, out = null) {
  const role = markRole(W), H = Math.round(W * 1.25), pk = H * 0.3;
  const on = (x, y, r) => x >= 0 && y >= 0 && x < W && y < H && (r === undefined ? role(x, y) !== null : role(x, y) === r || (r === 'h' && role(x, y) === 'c') || (r === 'c' && role(x, y) === 'h'));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const r = role(x, y); if (!r) continue;
    const RR = r === 'r' && Rr ? Rr : R;
    if (mode === 'relevo') {
      let v = (r === 'h' || r === 'c' ? 3.3 : 2.8) + (on(x - 1, y, r) ? 0 : 1) + (on(x, y - 1, r) ? 0 : 1.1) - (on(x + 1, y, r) ? 0 : 0.9) - (on(x, y + 1, r) ? 0 : 1.1) - y / H * 0.5 + cg(x0 + x, y0 + y, s) * 0.45;
      if (r === 'm' && y < pk + 3 + Math.abs(x + 0.5 - W / 2) * 0.2 && Math.abs(x + 0.5 - W / 2) < 4) v += 0.9;   // a neve no pico
      if (r === 'm' && x + 0.5 > W / 2 && hash2(x, y, s) < 0.5) v -= 0.4;   // a encosta da direita na sombra
      if (r === 'h' && y === Math.round(H * 0.03) + 1) v += 0.4;      P.put(x0 + x, y0 + y, RR, v);
      if (out && r === 'r') out.put(x0 + x, y0 + y, RR, 5);
    } else {
      P.put(x0 + x, y0 + y, RR, 1.1 + cg(x0 + x, y0 + y, s) * 0.3);
      if (!on(x, y + 1)) P.put(x0 + x, y0 + y + 1, RR, 4);
    }
  }
}
// uma corrente de bronze pendurada: elos de frente e de lado
function chainV(P, x, y0, y1, R = RP.bronze, base = 3.2) {
  for (let y = y0; y < y1; y++) { const k = (y - y0) % 4; if (k < 2) { P.put(x, y, R, base + (k === 1 ? -1.4 : 0.6)); P.put(x + 1, y, R, base - 1 + (k === 1 ? -1.4 : 0)); } else P.put(x + (k === 2 ? 0 : 1), y, R, base + 0.4); }
}
// entulho ao longo do chão: pedaços de R amontoados de x0 a x1, até hgt de altura
function rubble(P, x0, x1, by, hgt, R, s) {
  for (let k = 0; k < (x1 - x0) * 0.8; k++) { const x = x0 + hash2(k, 0, s) * (x1 - x0), t = (x - x0) / (x1 - x0), y = by - hash2(k, 1, s) * hgt * Math.sin(t * Math.PI); P.blob(x, y, 1 + hash2(k, 2, s) * 1.4, 0.8 + hash2(k, 3, s), R, s + k, 2.4); }
  for (let x = x0; x <= x1; x++) if (hash2(x, 4, s) < 0.7) P.put(x, by, R, 1.8 + hash2(x, 5, s));
}
// uma roda dentada de frente: raio r (ponta dos dentes), n dentes, girada de ang; furos de alívio, cubo com o eixo
function gear(P, cx, cy, r, n, ang, R, s, holes = 4, base = 2.8, see = false) {
  const ri = r - Math.max(2, r * 0.16), rh = Math.max(2, r * 0.22);
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); if (d > r) continue;
    const a = Math.atan2(dy, dx) - ang, tooth = Math.cos(a * n) > -0.05;
    if (d > ri && !tooth) continue;
    // os furos de alívio entre o cubo e o aro
    if (holes && d > rh + 1.5 && d < ri - 2.2) { const ha = ((a * holes / (Math.PI * 2)) % 1 + 1) % 1; if (Math.abs(ha - 0.5) < 0.28 - Math.abs(d - (rh + ri) / 2) / ((ri - rh) * 1.6)) { if (!see) P.put(x, y, RP.sombra, 1.2 + (dy < 0 ? 0.6 : 0)); continue; } }
    let v = base - (dx + dy) / r * 0.9 + cg(x, y, s) * 0.45;
    if (d > ri - 1 && d <= ri) v -= 0.7;                                    // o pé do dente
    if (d > ri && tooth) v += 0.3 - (Math.cos(a * n) < 0.25 ? 0.8 : 0);    // o flanco do dente
    if (Math.abs(d - rh) < 0.7) v += dy < 0 ? 1.2 : -1;                    // a borda do cubo
    if (d < 1.4) v = 1;                                                       // o furo do eixo
    P.put(x, y, R, v);
  }
}

/* =============================== CHÃO =============================== */
function gateLeaf(s, dent = 0) {   // 30 x 50: uma folha do portão de bronze: chapas em grade com rebites, barras, a marca no meio, amassada de trás (de baixo)
  const Q = painter(30, 50);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) plate(Q, 1 + i * 14, 1 + j * 12, 14, 12, s + i + j * 3, 2.7 - j * 0.12, 0);
  for (let y = 0; y < 50; y++) { Q.put(0, y, RP.bronze, 3.8); Q.put(29, y, RP.bronze, 1.8); }
  for (let x = 0; x < 30; x++) { Q.put(x, 0, RP.bronze, 4.2); Q.put(x, 49, RP.bronze, 1.6); }
  for (const y of [13, 25, 37]) for (let x = 1; x < 29; x++) { Q.put(x, y, RP.bronze, 3.8 - x * 0.03); Q.put(x, y + 1, RP.bronze, 1.4); }
  // o escudo com a marca, no meio da folha
  Q.blob(15, 25, 8, 8, RP.bronze, s + 9, 3); clanMark(Q, 9, 17, 12, RP.bronze, s + 10, 'relevo');
  // o amassado: a chapa estufou para a frente, rasgada numa quina; as dobras escuras e acesas
  if (dent) { for (let y = 30; y < 48; y++) for (let x = 3; x < 27; x++) { const d = Math.hypot((x - 17) / 9, (y - 41) / 7); if (d < 1 && Q.has(x, y)) Q.put(x, y, RP.bronze, Q.v(x, y) + (0.9 - d) * 1.6 * Math.cos((x - y) * 0.7)); } for (let k = 0; k < 6; k++) Q.clear(20 + k, 47 - k), Q.clear(21 + k, 47 - k); Q.line(19, 48, 27, 40, RP.bronze, 4.4, 1); }
  patina(Q, 0.05, s + 4, (x, y) => (y > 36 ? 0.3 : 0) + (x < 3 ? 0.2 : 0));
  return Q;
}
function fallenGate(k) {   // 56 x 54 ou 68 x 30: o portão de bronze caído. k 0: a folha encostada num poste quebrado; k 1: deitada quase plana sobre o entulho
  if (!k) {
    const P = painter(56, 54), s = 18201, yb = 53;
    // o poste de cantaria que segurava a dobradiça, partido, um pino de bronze torto no alto
    ashlar(P, 40, 22, 9, 32, RP.granito, s, 5, 9, (x, y) => y > 22 + (x - 40) * 0.7 + hash2(x, 0, s) * 2, 2.4);
    P.line(44, 26, 50, 22, RP.bronze, 3.6, 2);
    blit(P, gateLeaf(s + 1, 1), 2, 1, 0.42, 4, 49);
    rubble(P, 0, 55, yb, 3, RP.granito, s + 3);
    for (let x = 6; x < 50; x++) if (hash2(x, 9, s) < 0.12) P.put(x, yb - 1, RP.bronze, 3.6);   // rebites soltos
    chip(P, 0.25, s, [RP.granito]);
    return P.done();
  }
  // de quina: a folha deitada sobre o entulho, vista pela borda (uma chapa grossa), dobrada para cima no meio onde foi arrombada de baixo
  const P = painter(68, 28), s = 18211, yb = 27;
  rubble(P, 2, 22, yb, 5, RP.granito, s + 3); rubble(P, 44, 67, yb, 7, RP.granito, s + 4);
  const top = x => x < 30 ? 15 - (x - 2) * 0.12 : 11.6 - (x - 30) * 0.42 + (x - 30) * (x - 30) * 0.008;   // a dobra
  const lineY = x => top(x) + (x < 30 ? 0 : -Math.max(0, 6 - Math.abs(x - 34)) * 0.9);
  for (let x = 2; x < 64; x++) {
    const y0 = Math.round(lineY(x));
    // a face de cima, encurtada (vista de leve por cima): as chapas em grade com juntas e rebites; depois a borda grossa
    for (let j = 0; j < 6; j++) P.put(x, y0 + j, RP.bronze, 3.7 - j * 0.12 - x * 0.01 + ((x - 2) % 14 === 0 || j === 3 ? -1.1 : 0) + (j === 0 ? 0.7 : 0) + cg(x, j, s) * 0.35);
    for (let j = 6; j < 9; j++) P.put(x, y0 + j, RP.bronze, (j === 6 ? 2.6 : j === 8 ? 1.2 : 2) - x * 0.01 + cg(x, j, s) * 0.35);
    if ((x - 2) % 14 === 2 || (x - 2) % 14 === 12) { rivet(P, x, y0 + 1); rivet(P, x, y0 + 4); }
  }
  { const bx = 18, y0 = Math.round(lineY(bx)); for (let x = bx - 5; x <= bx + 5; x++) { const hgt = Math.round(Math.sqrt(Math.max(0, 25 - (x - bx) * (x - bx))) * 0.6); for (let j = 0; j < hgt; j++) P.put(x, y0 - 1 - j, RP.bronze, 3.6 - (x - bx) * 0.25 + (j === hgt - 1 ? 0.8 : 0)); } }   // o umbo com a marca, saltado da face
  // as pontas das barras saindo da borda, a dobradiça arrancada com o pino
  for (const x of [8, 20, 44, 56]) { const y0 = Math.round(lineY(x)); P.put(x, y0 - 1, RP.bronze, 3.6); P.put(x, y0 - 2, RP.bronze, 3); }
  P.rect(62, Math.round(lineY(62)) - 2, 5, 9, RP.bronze, (i, j) => 3.4 - i * 0.4 - (j % 3 === 2 ? 1 : 0)); P.line(66, Math.round(lineY(62)) + 2, 67, yb, RP.ferro, 2.8, 1);
  // o rasgo da dobra: escuro, as bordas acesas
  for (let j = 0; j < 9; j++) { const x = 33 + (j % 2); P.put(x, Math.round(lineY(x)) + j, RP.bronze, 0.6); P.put(x + 1, Math.round(lineY(x + 1)) + j, RP.bronze, 4.4); }
  patina(P, 0.12, s + 5, (x, y) => (y > 18 ? 0.2 : 0));
  chip(P, 0.25, s, [RP.granito]);
  return P.done();
}
function warriorStatue(k) {   // 32 x 58: um anão guerreiro de granito no seu plinto: elmo de chifres curtos, barba larga trançada, cota até o joelho, as duas mãos no pomo do machado de pé, a lâmina dupla no plinto entre as botas (k 1: a cabeça caiu e rolou para o pé do plinto, um chifre e um gume lascados)
  const W = 32, H = 58, P = painter(W, H), s = 18221 + k, R = RP.granito, yb = H - 1, cx = 16;
  const body = (x, y, hw, v) => { const u = (x + 0.5 - cx) / hw; return v - u * 1.3 - u * u * 0.4 + cg(x, y, s) * 0.4; };
  // o plinto: dois degraus, três runas gravadas na frente
  ashlar(P, 2, 49, 28, 9, R, s, 4, 14, null, 2.5); P.rect(1, 47, 30, 2, R, (i, j) => 4.4 - j * 1.4 - i * 0.04);
  for (let q = 0; q < 3; q++) carve(P, 8 + q * 6, 51, q + 2, R, 2.5);
  P.z = 1;
  // as botas largas com a biqueira, as pernas curtas
  for (const [lx, b] of [[7, 3.3], [19, 2.6]]) { P.rect(lx, 41, 6, 4, R, (i, j, x, y) => b - i * 0.15 + cg(x, y, s) * 0.4); P.rect(lx - 1, 44, 8, 3, R, (i, j, x, y) => b + 0.5 - j * 0.6 - i * 0.12 + (j === 0 ? 0.6 : 0) + cg(x, y, s) * 0.4); }
  P.z = 2;
  // a cota de malha até o joelho: anéis em fileiras (fileira clara, fileira escura), barra embaixo
  for (let y = 31; y < 41; y++) { const hw = 9.5 + (y - 31) * 0.2; for (let x = Math.floor(cx - hw); x < cx + hw; x++) P.put(x, y, R, body(x, y, hw, 3) + (y % 2 ? -0.35 : 0.15) + ((x + (y >> 1)) % 3 === 0 ? -0.3 : 0) + (y === 40 ? -0.7 : 0)); }
  P.z = 3;
  // o tronco largo com o peitoral liso, as ombreiras redondas
  for (let y = 17; y < 31; y++) { const hw = y < 20 ? 12 - (20 - y) * 1.2 : 11; for (let x = Math.floor(cx - hw); x < cx + hw; x++) P.put(x, y, R, body(x, y, hw, 3.1)); }
  P.z = 4; P.blob(5, 19, 4, 3.2, R, s + 1, 3.2); P.blob(27, 19, 4, 3.2, R, s + 2, 2.2);
  for (const x0 of [2, 24]) for (let x = x0; x < x0 + 7; x++) P.put(x, 21, R, 1.8 + (x0 ? -0.2 : 0.4));   // a borda da ombreira
  P.z = 4;
  // o cinto largo com a fivela quadrada
  P.rect(5, 29, 22, 3, R, (i, j) => 3.4 - j * 0.9 - i * 0.04 + (j === 0 ? 0.6 : 0)); P.rect(13, 28, 6, 5, R, (i, j) => (i === 0 || j === 0 ? 4.4 : i === 5 || j === 4 ? 2 : 3.2));
  P.z = 5;
  // a barba: larga do queixo ao cinto, mechas em sulcos, duas tranças com anel caindo por cima do cinto
  for (let y = 14; y < 30; y++) { const hw = y < 20 ? 5.5 + (y - 14) * 0.25 : 7 - (y - 20) * 0.45; for (let x = Math.floor(cx - hw); x < cx + hw; x++) { const u = (x + 0.5 - cx) / hw, groove = ((x + Math.round(Math.sin(y * 0.5) * 0.8)) % 3) === 0; P.put(x, y, R, 3.9 - u * 1.1 + (groove ? -0.8 : 0.1) - (y - 14) * 0.02 + cg(x, y, s) * 0.3); } }
  P.z = 6; for (const bx of [13, 18]) { for (let y = 29; y < 37; y++) { P.put(bx, y, R, 3.8 - (y % 2) * 0.9); P.put(bx + 1, y, R, 2.6 - (y % 2) * 0.6); } P.rect(bx - 1, 33, 4, 1, R, (i) => 4.6 - i * 0.7); }
  P.z = 6;
  // os braços: das ombreiras para dentro, as mãos fechadas sobre o pomo do machado na frente da barba
  tube(P, t => [5 + t * 6.5, 21 + t * 4.5], () => 4.4, R, s + 3, 3); tube(P, t => [27 - t * 6.5, 21 + t * 4.5], () => 4.4, R, s + 4, 2.1);
  P.z = 8; P.blob(12.5, 26, 2.4, 2, R, s + 5, 3.4); P.blob(19.5, 26, 2.4, 2, R, s + 6, 2.8);
  P.z = 7;
  // o machado: o pomo entre as mãos, o cabo descendo, a cabeça de lâmina dupla apoiada no plinto
  P.rect(15, 24, 2, 2, R, (i) => 4.6 - i); for (let y = 27; y < 46; y++) { P.put(15, y, R, 3.9); P.put(16, y, R, 2.4); }
  // a cabeça: duas lâminas em meia-lua, estreitas junto do cabo e largas no gume (uma gravata-borboleta), o gume aceso
  for (let dx = 1; dx <= 9; dx++) for (const sg of [-1, 1]) {
    const x = sg < 0 ? 15 - dx : 16 + dx, half = 1.4 + dx * 0.42 + (dx > 6 ? (dx - 6) * 0.5 : 0), cy0 = 41.5 + (dx > 6 ? 0 : 0);
    for (let y = Math.round(cy0 - half); y <= Math.round(cy0 + half); y++) { const edge = dx >= 8, rim = y === Math.round(cy0 - half); P.put(x, y, R, (edge ? 4.4 : 3.3) + (rim ? 0.7 : 0) - (sg > 0 ? 0.7 : 0) - (y - cy0) * 0.08 + cg(x, y, s) * 0.3); }
  }
  P.rect(14, 38, 4, 8, R, (i, j) => 3 - i * 0.35 + (j === 0 ? 1 : 0) - (j === 7 ? 0.8 : 0));   // o olho da cabeça, em volta do cabo
  // a cabeça: o elmo redondo com crista, a aba, o nasal, as bochechas, os chifres curtos
  const helm = (Q, ox, oy) => {
    Q.blob(ox + 6, oy + 6, 5.6, 5.2, R, s + 7, 3.1);
    for (let x = ox; x < ox + 13; x++) { Q.put(x, oy + 6, R, 4.4 - (x - ox) * 0.14); Q.put(x, oy + 7, R, 2 - (x - ox) * 0.05); }
    for (let y = oy; y < oy + 6; y++) Q.put(ox + 6, y, R, 4.6 - (y - oy) * 0.1);
    for (let y = oy + 7; y < oy + 12; y++) { Q.put(ox + 1, y, R, 3.2); Q.put(ox + 2, y, R, 2.6); Q.put(ox + 10, y, R, 1.8); Q.put(ox + 11, y, R, 1.4); }
    for (let y = oy + 8; y < oy + 11; y++) for (let x = ox + 3; x < ox + 10; x++) Q.put(x, y, R, 2.2 + (y === oy + 10 ? 0.8 : 0));
    Q.put(ox + 4, oy + 9, R, 0.9); Q.put(ox + 8, oy + 9, R, 0.9);   // os olhos fundos
    for (let y = oy + 7; y < oy + 12; y++) Q.put(ox + 6, y, R, 4.2);   // o nasal
    Q.rect(ox + 3, oy + 11, 7, 2, R, (i, j) => 3.8 - j * 0.6 - i * 0.12);   // o bigode
    // os chifres: saem dos lados e sobem curvos
    for (let q = 0; q < 5; q++) { Q.put(ox - 1 - (q > 2 ? 1 : 0), oy + 4 - q, R, 3.8 - q * 0.1); Q.put(ox, oy + 4 - q, R, 2.8); }
    if (!k) for (let q = 0; q < 5; q++) { Q.put(ox + 13 + (q > 2 ? 1 : 0), oy + 4 - q, R, 2.6); Q.put(ox + 12, oy + 4 - q, R, 3.2); }
  };
  P.z = 6; if (!k) helm(P, cx - 6, 3);
  else {
    P.rect(12, 13, 8, 4, R, (i, j) => 1.8 + hash2(i, j, s) * 1.8);   // o toco do pescoço, partido
    const Q = painter(16, 14); helm(Q, 2, 1); blit(P, Q, 21, 45, 0.9, 8, 7);   // a cabeça caída ao pé do plinto
    for (let k2 = 0; k2 < 6; k2++) P.clear(6 + (k2 % 2), 40 + k2);           // o gume lascado
  }
  seams(P);
  grime(P, 1, 0.02, s + 8, (x, y) => (y > 44 ? 0.25 : -0.1) + (x > 22 ? 0.15 : 0));
  chip(P, 0.3, s);
  return P.done();
}
function kingStatue(k) {   // 42 x 62: o rei sentado no trono de pedra, coroado, a barba até o colo; k 0: o martelo atravessado nos joelhos; k 1: as mãos no cabo do machado de pé ao lado
  const W = 42, H = 62, P = painter(W, H), s = 18241 + k, R = RP.granito, yb = H - 1, cx = 21;
  // o estrado de três degraus
  for (let q = 0; q < 3; q++) { const x0 = q * 2, w = W - q * 4, y0 = yb - 3 - q * 3; ashlar(P, x0, y0, w, 3, R, s + q, 3, 10, null, 2.7 - q * 0.1); for (let x = x0; x < x0 + w; x++) P.put(x, y0, R, 4.2 - x * 0.03); }
  P.z = 1;
  // o trono: o encosto alto com a marca, os braços em bloco
  ashlar(P, 7, 3, 28, 41, R, s + 3, 6, 14, null, 2.2);
  for (let x = 7; x < 35; x++) { P.put(x, 3, R, 4.3 - x * 0.03); P.put(x, 2, R, x % 4 === 1 ? 3.6 : -1); }
  for (const x of [7, 33]) P.rect(x, 0, 2, 4, R, (i, j) => 4 - i * 1.4 - j * 0.2);
  clanMark(P, 15, 4, 12, R, s + 4, 'grava');
  P.z = 3; P.box(3, 28, 7, 24, R, s + 5, 3); P.box(32, 28, 7, 24, R, s + 6, 2.2);
  for (const x of [3, 32]) { P.rect(x - 1, 27, 9, 2, R, (i, j) => 4.4 - j * 1.3 - i * 0.08); carve(P, x + 2, 36, x === 3 ? 5 : 1, R, x === 3 ? 3 : 2.2); }
  P.z = 2;
  // o assento e as pernas largas, os pés no escabelo
  P.box(9, 38, 24, 6, R, s + 7, 2.7);
  P.z = 3; P.rect(10, 50, 22, 3, R, (i, j) => 3.6 - j * 0.9 - i * 0.04);
  P.z = 4; for (const lx of [12, 23]) P.box(lx, 44, 7, 7, R, s + lx, lx < 20 ? 3 : 2.4);
  P.z = 3;
  // o manto que cai dos ombros pelos lados
  for (let y = 16; y < 44; y++) for (const [x0, x1, b] of [[10, 13, 3.2], [29, 32, 2.2]]) for (let x = x0; x < x1; x++) P.put(x, y, R, b + Math.sin(y * 0.8 + x) * 0.4 + cg(x, y, s) * 0.4);
  P.z = 4;
  // o tronco
  for (let y = 17; y < 38; y++) { const hw = 8.5; for (let x = Math.floor(cx - hw); x < cx + hw; x++) P.put(x, y, R, 3 - (x + 0.5 - cx) / hw * 1.1 + cg(x, y, s) * 0.45); }
  P.blob(13, 18, 3.6, 2.6, R, s + 8, 3.2); P.blob(29, 18, 3.6, 2.6, R, s + 9, 2.4);
  P.z = 5;
  // os braços pelos braços do trono
  tube(P, t => [12 - t * 4, 19 + t * 9], () => 4, R, s + 10, 3); tube(P, t => [30 + t * 4, 19 + t * 9], () => 4, R, s + 11, 2.2);
  P.z = 6;
  // a barba larga até o colo, em ondas, presa por dois anéis de bronze (as únicas peças de metal)
  for (let y = 13; y < 39; y++) { const hw = y < 24 ? 6.2 : 6.2 - (y - 24) * 0.32; for (let x = Math.floor(cx - hw); x < cx + hw; x++) P.put(x, y, R, 3.7 - (x + 0.5 - cx) / hw * 1.1 + (((x + Math.round(Math.sin(y * 0.6) * 1.5)) % 3) === 0 ? -0.9 : 0) + cg(x, y, s) * 0.35); }
  for (const yy of [27, 33]) P.rect(cx - 3, yy, 6, 1, RP.bronze, (i) => 4.2 - i * 0.5);
  P.z = 6;
  // a cabeça e a coroa de pontas retas
  P.blob(cx, 10, 5.4, 5, R, s + 12, 3);
  P.put(18, 10, R, 1); P.put(23, 10, R, 1); P.rect(17, 9, 8, 1, R, (i) => 4 - i * 0.2); P.put(cx, 11, R, 4.2); P.put(cx, 12, R, 3.4); P.rect(17, 13, 8, 2, R, (i, j) => 3.8 - j * 0.5 - i * 0.14);
  for (let x = 15; x < 27; x++) { P.put(x, 5, R, 4.2 - (x - 15) * 0.1); P.put(x, 6, R, 3 - (x - 15) * 0.08); }
  for (const x of [15, 18, 21, 24, 26]) { P.put(x, 4, R, 4.2 - (x - 15) * 0.1); P.put(x, 3, R, 3.8 - (x - 15) * 0.1); }
  P.z = 8;
  if (!k) {   // o martelo de guerra atravessado nos joelhos
    P.line(8, 41, 34, 40, R, (t) => 3.6 - t * 0.8, 2);
    P.box(30, 35, 7, 10, R, s + 13, 3); for (let y = 36; y < 44; y += 3) P.put(33, y, R, 1.6);
    P.z = 9; P.blob(14, 40, 2.4, 2, R, s + 14, 3.2); P.blob(27, 40, 2.4, 2, R, s + 15, 2.6);
  } else {    // as duas mãos no cabo do machado de pé à direita, a lâmina para cima
    for (let y = 8; y < 53; y++) { P.put(37, y, R, 3.6); P.put(38, y, R, 2.2); }
    for (let y = 6; y < 20; y++) { const t = (y - 6) / 13, hw = Math.sin(t * Math.PI) * 4.5 + 0.5; for (let x = 38; x < 38 + hw; x++) P.put(x, y, R, 3.4 - (x - 38) * 0.2 - t * 0.6); for (let x = 37 - hw * 0.6; x < 37; x++) P.put(x, y, R, 3.8); }
    P.z = 9; P.blob(36, 29, 2.6, 2.2, R, s + 14, 3); P.blob(36, 33, 2.6, 2, R, s + 15, 2.6);
  }
  seams(P);
  grime(P, 1.1, 0.00, s + 16, (x, y) => (y > 44 ? 0.2 : 0) + (x > 32 ? 0.15 : 0));
  chip(P, 0.3, s);
  return P.done();
}
function sarcophagus(k) {   // 58 x 28: o sarcófago de granito: o caixão com painéis e a marca, a tampa grossa com uma faixa de runas na borda (k 1: a tampa empurrada de lado, uma ponta no chão, o escuro de dentro à mostra, vazio)
  const P = painter(58, 28), s = 18261 + k, R = RP.granito, yb = 27;
  // o pé (rodapé saliente) e o caixão
  P.rect(1, yb - 2, 56, 3, R, (i, j) => 3.6 - j * 1.1 - i * 0.02 + cg(i, j, s) * 0.4);
  ashlar(P, 3, 11, 52, 14, R, s, 7, 13, null, 2.5);
  // painéis afundados nos lados, a marca no do meio
  for (const px of [6, 22, 38]) { for (let y = 13; y < 23; y++) for (let x = px; x < px + 14; x++) P.put(x, y, R, 2.1 - (x - px) * 0.02 + (x === px + 13 || y === 22 ? 1.2 : 0) + (x === px || y === 13 ? -0.6 : 0) + cg(x, y, s) * 0.4); }
  clanMark(P, 25, 13, 8, R, s + 3, 'relevo');
  carve(P, 9, 15, 6, R, 2.2); carve(P, 14, 15, 1, R, 2.2); carve(P, 41, 15, 3, R, 2.1); carve(P, 46, 15, 8, R, 2.1);
  // a tampa: um bloco com chanfro, a faixa de runas gravadas na borda da frente
  const Q = painter(58, 10);
  Q.rect(1, 2, 56, 8, R, (i, j) => 3.3 - j * 0.15 - i * 0.015 + (j === 7 ? -1.2 : 0) + cg(i, j, s + 4) * 0.45 + cn(i, j, 30, 30, s + 5) * 0.3);
  for (let x = 3; x < 55; x++) { Q.put(x, 1, R, 4.4 - x * 0.02); Q.put(x, 0, R, x > 6 && x < 52 ? 3.8 - x * 0.015 : -1); }
  for (let q = 0; q < 9; q++) carve(Q, 5 + q * 5.6, 3, (q * 3 + k) % 10, R, 3.2);
  if (!k) blit(P, Q, 0, 1);
  else {
    for (let y = 10; y < 13; y++) for (let x = 3; x < 55; x++) P.put(x, y, R, 0.4 + (y - 10) * 0.3);   // a boca escura
    blit(P, Q, 14, -1, 0.1, 0, 9);
  }
  grime(P, 1.1, -0.03, s + 6, (x, y) => (y > 20 ? 0.25 : -0.1));
  chip(P, 0.3, s);
  return P.done();
}
function tankard(P, x, by, s, tipped = false) {   // uma caneca de bronze com asa (de pé ou deitada)
  if (!tipped) { P.rect(x, by - 5, 4, 5, RP.bronze, (i, j) => 3.4 - i * 0.6 + (j === 0 ? 1 : 0) + (j === 1 ? -0.4 : 0)); P.put(x + 4, by - 4, RP.bronze, 2.6); P.put(x + 5, by - 3, RP.bronze, 2.2); P.put(x + 4, by - 2, RP.bronze, 2); }
  else { P.rect(x, by - 3, 5, 3, RP.bronze, (i, j) => 3.4 - j * 0.6 - (i === 0 ? -0.6 : 0)); P.put(x + 1, by - 4, RP.bronze, 2.6); P.put(x + 2, by - 4, RP.bronze, 2.4); P.put(x + 5, by - 2, RP.sombra, 2); }
}
function plateBronze(P, x, y, w = 6) { for (let i = 0; i < w; i++) P.put(x + i, y, RP.bronze, 4 - i * 0.35); P.put(x + 1, y + 1, RP.bronze, 2.2); P.put(x + w - 2, y + 1, RP.bronze, 1.8); }
function longTable(k) {   // 66 x 24: a mesa comprida de pedra, posta e abandonada: pratos de bronze, canecas, uma jarra, o pão virado pedra, uma vela fria (k 1: pratos espalhados, canecas tombadas, uma caída no chão)
  const P = painter(66, 24), s = 18281 + k, R = RP.granito, yb = 23;
  // os pés em bloco, o tampo grosso com borda
  for (const lx of [4, 54]) { ashlar(P, lx, 12, 8, 12, R, s + lx, 4, 8, null, lx < 30 ? 2.8 : 2.3); P.rect(lx - 1, yb, 10, 1, R, (i) => 2.6 - i * 0.1); }
  P.rect(0, 9, 66, 4, R, (i, j) => 3.4 - j * 0.6 - i * 0.014 + (j === 0 ? 1.1 : 0) + (j === 3 ? -1.1 : 0) + cg(i, j, s) * 0.45 + cn(i, j, 30, 30, s + 1) * 0.3);
  for (let q = 0; q < 8; q++) carve(P, 6 + q * 7.4, 10, (q + 4) % 10, R, 2.6);   // a faixa de runas da borda (meio apagada)
  for (let x = 8; x < 60; x++) if (hash2(x, 1, s) < 0.25) P.put(x, 11, R, 2.7);
  if (!k) {
    for (const x of [4, 18, 33, 48]) { plateBronze(P, x, 8); }
    tankard(P, 11, 9, s); tankard(P, 26, 9, s + 1); tankard(P, 41, 9, s + 2); tankard(P, 57, 9, s + 3);
    // a jarra no meio, o pão (pedra) num prato, a vela fria num castiçal
    for (let y = 0; y < 9; y++) { const hw = y < 2 ? 1.5 : 2.8 - Math.abs(y - 5) * 0.2; for (let x = Math.floor(33 - hw); x < 33 + hw; x++) P.put(x, y, RP.bronze, 3.6 - (x + 0.5 - 33) / hw * 1.2 + cg(x, y, s) * 0.4); }
    P.put(30, 3, RP.bronze, 2.6); P.put(30, 4, RP.bronze, 2.2); P.put(29, 4, RP.bronze, 2);
    P.blob(51, 6.5, 3, 1.8, R, s + 5, 2.4); P.put(50, 5, R, 3.8);
    P.rect(21, 7, 3, 1, RP.bronze, (i) => 4 - i); P.put(22, 6, RP.bronze, 3); P.rect(22, 3, 1, 3, RP.cera, (j) => 3.4 - j * 0.3); P.put(22, 2, RP.sombra, 2);
  } else {
    plateBronze(P, 5, 8); plateBronze(P, 37, 8, 5);
    tankard(P, 15, 9, s, true); tankard(P, 44, 9, s + 1); tankard(P, 27, 9, s + 2, true);
    P.line(55, 8, 60, 6, RP.bronze, 3.6, 1);                     // um prato de pé, encostado
    tankard(P, 34, yb + 1, s + 3, true);                          // uma caiu no chão
    P.blob(23, 7.3, 2.6, 1.6, R, s + 5, 2.4);
    for (let x = 30; x < 42; x++) if (hash2(x, 7, s) < 0.3) P.put(x, yb, RP.bronze, 3);   // moedas? não: rebites e cacos
  }
  grime(P, 1.1, -0.08, s + 6, (x, y) => (y > 14 ? 0.2 : -0.1), [R]);
  chip(P, 0.25, s, [R]);
  return P.done();
}
function stoneBench(k) {   // 32 x 12: o banco de pedra: um tampo grosso em dois blocos (k 1: rachado ao meio, uma metade caída)
  const P = painter(32, 12), s = 18301 + k, R = RP.granito, yb = 11;
  if (!k) {
    for (const lx of [3, 24]) ashlar(P, lx, 5, 5, 7, R, s + lx, 4, 5, null, lx < 10 ? 2.8 : 2.3);
    P.rect(0, 2, 32, 4, R, (i, j) => 3.4 - j * 0.7 - i * 0.02 + (j === 0 ? 1.1 : 0) + cg(i, j, s) * 0.45);
    carve(P, 14, 2, 7, R, 3);
  } else {
    for (const lx of [3, 24]) ashlar(P, lx, 5, 5, 7, R, s + lx, 4, 5, null, 2.6);
    const A = painter(16, 4); A.rect(0, 0, 16, 4, R, (i, j) => 3.4 - j * 0.7 + (j === 0 ? 1.1 : 0) + cg(i, j, s) * 0.45); blit(P, A, 0, 2);
    const B = painter(16, 4); B.rect(0, 0, 16, 4, R, (i, j) => 3.1 - j * 0.7 + (j === 0 ? 1.1 : 0) + cg(i, j, s + 1) * 0.45); blit(P, B, 15, 5, 0.38, 0, 0);
    rubble(P, 13, 19, yb, 1, R, s + 3);
  }
  chip(P, 0.3, s);
  return P.done();
}
function bigBarrel(k) {   // 38 x 34: o barril grande de cerveja: k 0 deitado num berço de pedra, aros de bronze, a torneira na frente de baixo; k 1 de pé, a torneira no tampo, uma aduela rachada
  const P = painter(38, 34), s = 18321 + k, yb = 33;
  const staves = (x0, y0, L, D, lying) => {
    const c = D / 2;
    for (let a = 0; a < L; a++) {
      const t = a / (L - 1), hw = c * (0.8 + 0.2 * Math.sin(t * Math.PI)), hoop = [0.07, 0.93, 0.3, 0.7].some(q => Math.abs(t - q) < 1.2 / L);
      for (let b = Math.floor(c - hw); b < c + hw; b++) {
        const u = (b + 0.5 - c) / hw, st = Math.floor((u + 1) * 3.2), edge = Math.abs(((u + 1) * 3.2) % 1) < 0.16;
        const x = lying ? x0 + a : x0 + b, y = lying ? y0 + b : y0 + a;
        if (hoop) { P.put(x, y, RP.bronze, 3.5 - u * 1.5 + cg(x, y, s) * 0.3); continue; }
        P.put(x, y, RP.madeira, 3.5 - u * 1.6 + (edge ? -1 : 0) + cg(x, y, s + st) * 0.55);
      }
    }
  };
  if (!k) {
    // o berço: dois blocos de granito com o côncavo em cima
    for (const bx of [5, 25]) { ashlar(P, bx, yb - 7, 8, 8, RP.granito, s + bx, 4, 8, (x, y) => y > yb - 7 + 2.5 - Math.abs(x + 0.5 - bx - 4) * 0.6, 2.6); }
    staves(4, 6, 31, 23, true);
    // o tampo da frente (de lado, uma faixa mais clara) com a torneira de bronze e uma gota de nada
    for (let y = 8; y < 28; y++) { P.put(3, y, RP.madeira, 4); P.put(4, y, RP.madeira, 3); }
    P.rect(0, 22, 4, 2, RP.bronze, (i, j) => 4 - j * 1.4 - i * 0.2); P.rect(0, 24, 2, 2, RP.bronze, (i, j) => 3.4 - j); P.put(1, 21, RP.bronze, 4.6); P.put(1, 20, RP.bronze, 3.6);
    P.put(23, 3, RP.bronze, 3.8); P.put(22, 4, RP.bronze, 3); P.put(24, 4, RP.bronze, 2.6);   // o batoque
  } else {
    staves(8, 2, 31, 24, false);
    for (let x = 10; x < 30; x++) P.put(x, 1, RP.madeira, 4.2 - (x - 10) * 0.06);
    // a torneira na frente, baixa; a aduela rachada (escuro)
    P.rect(16, 24, 6, 3, RP.bronze, (i, j) => 4.6 - j * 1.1 - i * 0.3); P.rect(17, 27, 3, 3, RP.bronze, (i, j) => 4 - j * 0.8 - i * 0.5); P.put(18, 22, RP.bronze, 5); P.put(18, 23, RP.bronze, 4); P.rect(17, 21, 3, 1, RP.bronze, (i) => 4.6 - i);
    for (let y = 6; y < 20; y++) P.put(27 + (y % 3 === 0 ? 1 : 0), y, RP.sombra, 2);
    // uma caneca esquecida no chão
    tankard(P, 32, yb + 1, s);
  }
  chip(P, 0.15, s, [RP.granito]);
  patina(P, 0.08, s + 4);
  return P.done();
}
function bunk(k) {   // 42 x 46: o beliche de pedra: duas prateleiras cavadas em blocos, postes de cantaria, colchão e cobertor de lã, travesseiro; a escada de bronze ao lado (k 1: o cobertor de baixo arrastado ao chão, um elmo largado)
  const P = painter(42, 46), s = 18341 + k, R = RP.granito, yb = 45;
  // os postes
  ashlar(P, 0, 0, 5, 46, R, s, 5, 5, null, 2.9); ashlar(P, 33, 0, 5, 46, R, s + 1, 5, 5, null, 2.2);
  for (let x = 0; x < 38; x++) P.put(x, 0, R, x < 5 || x > 32 ? 4.4 - x * 0.03 : -1);
  // as duas lajes (cama de cima e de baixo)
  for (const y0 of [17, 38]) P.rect(5, y0, 28, 4, R, (i, j) => 3.2 - j * 0.6 - i * 0.02 + (j === 0 ? 1 : 0) + (j === 3 ? -1 : 0) + cg(i, j, s + y0) * 0.45);
  // o fundo sombrio entre as camas (a parede atrás não é do objeto: só a sombra do vão)
  const bed = (y0, pulled) => {
    // colchão de lã listrado, o travesseiro à esquerda, o cobertor dobrado sobre ele
    for (let y = y0 - 4; y < y0; y++) for (let x = 5; x < 33; x++) P.put(x, y, RP.la, 3 - (y0 - y === 4 ? -0.8 : 0) - (x - 5) * 0.03 + ((x + 1) % 7 === 0 ? -0.7 : 0) + cg(x, y, s) * 0.5);
    P.blob(9, y0 - 5, 3.6, 2, RP.la, s + y0, 3.4);
    if (!pulled) for (let y = y0 - 6; y < y0; y++) for (let x = 14; x < 33; x++) { if (y < y0 - 5 && x > 30) continue; P.put(x, y, RP.rubro, 3.2 - (x - 14) * 0.04 + Math.sin(x * 0.9) * 0.4 - (y === y0 - 1 ? 0.8 : 0) + cg(x, y, s + 3) * 0.4); }
  };
  bed(17, false); bed(38, !!k);
  if (k) {   // o cobertor caído pela beirada até o chão, o elmo
    for (let x = 18; x < 33; x++) { const L = 6 + Math.round(Math.sin(x * 0.7) * 1.5 + (x - 18) * 0.15); for (let j = 0; j < L; j++) P.put(x, 42 + j, RP.rubro, 3 - j * 0.15 + Math.sin(x * 1.1) * 0.5); }
    P.blob(14, 34, 3.6, 2.8, RP.bronze, s + 9, 3); P.rect(10, 35, 8, 1, RP.bronze, (i) => 4 - i * 0.3);
  }
  // a escada de bronze presa no poste da direita
  for (let y = 4; y < 45; y++) { P.put(38, y, RP.bronze, 3.4); P.put(41, y, RP.bronze, 2.2); }
  for (let y = 6; y < 45; y += 5) for (let x = 38; x < 42; x++) P.put(x, y, RP.bronze, 4 - (x - 38) * 0.5);
  patina(P, 0.1, s + 4, (x, y) => (x > 36 ? 0.2 : -1));
  chip(P, 0.25, s, [R]);
  return P.done();
}
function carcass(k) {   // 32 x 30: a carcaça de autômato desligado, de bronze com rebites e a runa do peito apagada; k 0 sentada encostada, cabeça caída, pernas para a frente, a lança no chão; k 1 ajoelhada, cabeça baixa, as mãos no escudo de pé
  const P = painter(32, 30), s = 18361 + k, B = RP.bronze, yb = 29;
  const head = (cx, cy, tilt) => {   // a cabeça: um elmo-balde com a fenda dos olhos (apagados)
    const Q = painter(10, 10);
    Q.rect(1, 1, 8, 8, B, (i, j) => 3.2 - i * 0.25 - j * 0.12 + (j === 0 ? 1 : 0) + (i === 0 ? 0.6 : 0) + cg(i, j, s) * 0.4);
    for (let x = 2; x < 8; x++) Q.put(x, 4, RP.sombra, 2); Q.put(3, 4, RP.apagada, 3); Q.put(6, 4, RP.apagada, 2.6);
    for (let x = 0; x < 10; x++) Q.put(x, 1, B, 4.3 - x * 0.2); rivet(Q, 2, 6); rivet(Q, 6, 6);
    blit(P, Q, cx - 5, cy - 5, tilt, 5, 5);
  };
  const torso = (x0, y0, w, h) => {
    plate(P, x0, y0, w, h, s + 1, 2.8, 0);
    for (let y = y0 + h; y < y0 + h + 2; y++) for (let x = x0 + 2; x < x0 + w - 2; x++) P.put(x, y, B, 2 - (x - x0) * 0.05);   // a cintura
    // a runa do peito, apagada: cinza-azulada morta, num disco de bronze
    P.blob(x0 + w / 2, y0 + h / 2, 3.4, 3.4, B, s + 2, 2.2); inlay(P, Math.round(x0 + w / 2 - 1.5), Math.round(y0 + h / 2 - 2.5), 4, RP.apagada, 2.6);
  };
  if (!k) {
    // as pernas esticadas para a direita: coxa, joelho com junta, canela, o pé em bloco
    for (const [y, b] of [[23, 3], [26, 2.4]]) { P.rect(9, y, 10, 3, B, (i, j) => b + 0.6 - j * 0.6 - i * 0.03); P.blob(19.5, y + 1.5, 2, 2, B, s + y, b); P.rect(21, y, 7, 3, B, (i, j) => b + 0.4 - j * 0.6); P.rect(27, y - 3, 3, 6, B, (i, j) => b + 0.8 - i * 0.5 - j * 0.1); }
    torso(5, 9, 11, 12);
    P.blob(10, 23, 5, 3, B, s + 3, 2.4);   // a bacia
    // os braços caídos ao lado, as mãos no chão
    tube(P, t => [5 - t * 2, 11 + t * 14], () => 3.4, B, s + 4, 3); tube(P, t => [16 + t * 1, 11 + t * 13], () => 3.4, B, s + 5, 2.2);
    P.blob(3, 27, 2, 1.6, B, s + 6, 2.6);
    head(13, 6, 0.55);
    // a lança largada no chão e o escudo redondo encostado atrás
    P.line(0, yb, 31, yb - 1, RP.madeira, 2.6, 1); P.rect(28, yb - 2, 4, 2, B, (i, j) => 4 - i * 0.4 - j);
    for (let y = 9; y < 29; y++) for (let x = 0; x < 5; x++) if (Math.hypot(x - 2, (y - 19) * 0.45) < 3) P.put(x, y, B, 2.4 - x * 0.2 + (y === 9 ? 1 : 0));
  } else {
    // ajoelhada virada à direita: a perna de trás dobrada no chão, a da frente em ângulo
    P.rect(4, 24, 12, 4, B, (i, j) => 2.8 - j * 0.6); P.blob(4.5, 25.5, 2.2, 2.4, B, s + 7, 2.4);
    tube(P, t => [14 + t * 4, 21 - t * 1], () => 4, B, s + 8, 2.8); P.rect(17, 20, 3, 9, B, (i, j) => 2.8 - i * 0.4); P.rect(16, 27, 6, 2, B, (i, j) => 3 - j);
    torso(5, 8, 11, 12);
    P.blob(10, 21.5, 5, 2.6, B, s + 3, 2.4);
    // o escudo de pé na frente (redondo de lado é uma placa oval), as mãos em cima da borda
    for (let y = 9; y < 29; y++) for (let x = 21; x < 30; x++) { const d = Math.hypot((x + 0.5 - 25.5) / 4.6, (y + 0.5 - 19) / 10); if (d < 1) P.put(x, y, B, 3.3 - (x - 21) * 0.18 - (y - 9) * 0.03 + (d > 0.85 ? 0.8 : 0) + cg(x, y, s) * 0.4); }
    P.blob(25.5, 19, 1.8, 2.4, B, s + 9, 3.4);
    tube(P, t => [14 + t * 8, 11 + t * 0], () => 3.2, B, s + 4, 3); P.blob(23, 10, 2.2, 1.8, B, s + 6, 3);
    head(12, 5, 0.4);
  }
  patina(P, 0.14, s + 10, (x, y) => (y > 20 ? 0.25 : 0));
  grime(P, 1.1, -0.13, s + 11, (x, y) => (y > 22 ? 0.25 : -0.2), [B]);   // óleo escorrido
  chip(P, 0.12, s);
  return P.done();
}
function fallenGear(k) {   // 60 x 60 ou 62 x 34: a engrenagem enorme caída: k 0 de pé sobre o aro, inclinada, apoiada no entulho, o toco do eixo; k 1 partida ao meio, a metade de pé sobre a quebra
  const s = 18381 + k;
  if (!k) {
    const P = painter(60, 60), Q = painter(52, 52), yb = 59;
    gear(Q, 26, 26, 25.5, 14, 0.1, RP.bronze, s, 6, 2.8, true);
    for (let y = 22; y < 30; y++) for (let x = 22; x < 30; x++) if (Math.hypot(x - 25.5, y - 25.5) < 4) Q.put(x, y, RP.ferro, 3 - (x + y - 50) * 0.2);   // o toco do eixo de ferro
    for (let k2 = 0; k2 < 12; k2++) Q.clear(46 + (k2 % 4), 34 + (k2 >> 2));   // dentes quebrados
    patina(Q, 0.06, s + 1, (x, y) => (y > 30 ? 0.15 : 0));
    blit(P, Q, 4, 7, 0.18, 26, 26);
    rubble(P, 38, 59, yb, 7, RP.granito, s + 2); rubble(P, 0, 12, yb, 2, RP.granito, s + 3);
    for (const x of [16, 28]) P.rect(x, yb - 1, 3, 2, RP.bronze, (i, j) => 3.4 - i * 0.6 - j);   // dentes no chão
    chip(P, 0.15, s, [RP.granito]);
    return P.done();
  }
  const P = painter(62, 34), Q = painter(60, 60), yb = 33;
  gear(Q, 30, 30, 29.5, 16, 0.05, RP.bronze, s, 6, 2.8, true);
  for (let y = 31; y < 60; y++) for (let x = 0; x < 60; x++) Q.clear(x, y);
  for (let x = 0; x < 60; x++) if (Q.has(x, 30)) { Q.put(x, 30, RP.bronze, 1.4 + hash2(x, 0, s) * 2); if (hash2(x, 1, s) < 0.4) Q.clear(x, 30); }   // a quebra, serrilhada
  patina(Q, 0.1, s + 1, (x, y) => (y > 20 ? 0.2 : 0));
  blit(P, Q, 1, 2, 0, 0, 0);
  rubble(P, 0, 61, yb, 2, RP.bronze, s + 2);
  return P.done();
}
function lavaPump(k) {   // 42 x 48: a bomba de lava: o tanque de bronze de pé com cintas de rebites, o visor com a lava (escura sem luz própria), o manômetro, a alavanca de balancim em cima, os canos descendo para o canal (k 1: a alavanca partida, o tanque amassado, um cano estourado)
  const P = painter(42, 48), s = 18401 + k, B = RP.bronze, yb = 47;
  // a base de granito
  ashlar(P, 4, 41, 30, 7, RP.granito, s, 4, 10, null, 2.6);
  // o tanque: um cilindro de pé (luz da esquerda), cintas e rebites
  for (let y = 12; y < 41; y++) for (let x = 7; x < 31; x++) { const u = (x + 0.5 - 19) / 12; P.put(x, y, B, 3.4 - u * 1.6 - u * u * 0.8 + cg(x, y, s) * 0.45 + cn(x, y, 14, 14, s + 1) * 0.3); }
  for (let x = 8; x < 30; x++) { const u = (x + 0.5 - 19) / 11; P.put(x, 11, B, 4.4 - u); P.put(x, 10, B, x > 9 && x < 28 ? 3.4 - u : -1); }   // a tampa abaulada
  for (const y of [15, 26, 37]) for (let x = 7; x < 31; x++) { const u = (x + 0.5 - 19) / 12; P.put(x, y, B, 4 - u * 1.8); P.put(x, y + 1, B, 1.6 - u * 0.5); if ((x - 7) % 4 === 1) P.put(x, y, B, 4.8 - u * 1.8); }
  // o visor: uma fenda com vidro grosso e a lava lá dentro até a metade
  for (let y = 18; y < 34; y++) for (let x = 11; x < 15; x++) P.put(x, y, y < 26 ? RP.sombra : RP.lava, y < 26 ? 2 - (x - 11) * 0.3 : 2.4 - (x - 11) * 0.3 + (y === 26 ? 1.5 : 0) + cg(x, y, s) * 0.4);
  for (let y = 17; y < 35; y++) { P.put(10, y, B, 4); P.put(15, y, B, 1.8); }
  // o manômetro: um mostrador redondo de frente, o ponteiro
  P.blob(23, 21, 3.6, 3.6, B, s + 2, 3); for (let y = 19; y < 24; y++) for (let x = 21; x < 26; x++) if (Math.hypot(x + 0.5 - 23.5, y + 0.5 - 21.5) < 2.2) P.put(x, y, RP.la, 4.6 - (x - 21) * 0.2);
  P.line(23, 22, 25, 20, RP.ferro, 1.4, 1);
  // os canos: um sai de baixo do tanque e desce para o chão à direita; outro sobe da base
  tube(P, t => [31 + t * 7, 34], () => 3, B, s + 3, 2.8); tube(P, t => [38, 34 + t * 13], () => 3, B, s + 4, 2.6);
  P.rect(36, 32, 5, 1, B, (i) => 4.2 - i * 0.3); P.rect(36, 44, 5, 2, B, (i, j) => 3.6 - i * 0.3 - j);
  // o balancim em cima: o poste, o eixo, a alavanca comprida
  for (let y = 3; y < 11; y++) { P.put(18, y, RP.ferro, 3.4); P.put(19, y, RP.ferro, 2.2); }
  if (!k) { P.line(2, 7, 36, 0, B, (t) => 3.8 - t * 0.8, 2); P.blob(18.5, 4, 1.8, 1.8, B, s + 5, 3.4); P.rect(0, 6, 4, 4, RP.madeira, (i, j) => 3.4 - i * 0.3 - j * 0.3); }
  else {
    P.line(18, 4, 36, 0, B, (t) => 3.8 - t * 0.8, 2); P.blob(18.5, 4, 1.8, 1.8, B, s + 5, 3.4);
    P.line(1, yb, 14, yb - 3, B, 3.2, 2);   // a outra metade da alavanca no chão
    for (let y = 28; y < 35; y++) for (let x = 25; x < 31; x++) if (Math.hypot(x - 29, y - 31) < 3.4) P.put(x, y, B, P.v(x, y) - 1.4 + (x - 25) * 0.1);   // o amassado
    for (let k2 = 0; k2 < 5; k2++) P.put(39 + k2 % 2, 37 + k2, RP.sombra, 2); P.line(40, 37, 42, 35, B, 4.4, 1);
  }
  patina(P, 0.12, s + 6, (x, y) => (y > 30 ? 0.25 : 0));
  grime(P, 1.1, -0.13, s + 7, (x, y) => (y > 36 ? 0.2 : -0.3), [B]);
  chip(P, 0.25, s, [RP.granito]);
  return P.done();
}
function forgeFurnace() {   // 62 x 70: a fornalha de forja: corpo de tijolo refratário, a boca em arco com o carvão em brasa (as línguas são ao vivo), a coifa de bronze subindo em chaminé, o fole de couro à esquerda, o monte de carvão e as tenazes à direita
  const P = painter(62, 70), L = painter(62, 70), s = 18421, T2 = RP.tijolo, yb = 69;
  const brick = (x0, y0, w, h, keep) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = x0 + x, Y = y0 + y; if (keep && !keep(X, Y)) continue;
      const row = Math.floor(Y / 3), off = (row % 2) * 3, col = Math.floor((X + off) / 6), ly = Y % 3, lx = (X + off) % 6;
      P.put(X, Y, T2, ly === 2 || lx === 5 ? 1.2 : 2.7 + hash2(col, row, s) * 0.9 + (ly === 0 ? 0.6 : 0) - x / w * 0.8 + cg(X, Y, s) * 0.5);
    }
  };
  // o corpo: largo embaixo, a boca em arco, uma laje de granito por cima
  const cx = 32, mt = 44, mw = 9;
  const mouthTop = x => { const d = (x + 0.5 - cx) / mw; return Math.abs(d) >= 1 ? 99 : mt - Math.sqrt(1 - d * d) * 6; };
  brick(16, 34, 34, 35, (X, Y) => !(Y >= mouthTop(X) && Y < yb - 3));
  for (let x = 14; x < 52; x++) { P.put(x, 33, RP.granito, 4.2 - (x - 14) * 0.04); P.put(x, 34, RP.granito, 2.4 - (x - 14) * 0.03); }
  // as aduelas do arco da boca, de tijolo de cutelo
  for (let y = 34; y < 48; y++) for (let x = cx - mw - 3; x <= cx + mw + 3; x++) { const d = Math.hypot((x + 0.5 - cx) / (mw + 2.5), (y + 0.5 - mt) / 8.5); if (d > 1 || y >= mt + 1 || Y_inMouth(x, y)) continue; const a = Math.atan2(y + 0.5 - mt, x + 0.5 - cx); P.put(x, y, T2, Math.abs((a * 4) % 1) < 0.18 ? 1.2 : 3.6 - (x - cx) * 0.05); }
  function Y_inMouth(x, y) { return y >= mouthTop(x); }
  // dentro da boca: o fundo escuro em cima, o leito de carvão em brasa embaixo (aceso também na camada de luz)
  for (let x = cx - mw; x < cx + mw; x++) for (let y = Math.ceil(mouthTop(x)); y < yb - 3; y++) {
    const deep = y < yb - 9;
    if (deep) { P.put(x, y, RP.brasa, 1 + (y - mouthTop(x)) * 0.12 + cg(x, y, s) * 0.4); continue; }
    const hot = hash2(x, y, s) < 0.55; P.put(x, y, hot ? RP.brasa : RP.carvao, hot ? 3.4 + hash2(x, y, s + 1) * 2 : 2.4 + cg(x, y, s) * 0.6);
    if (hot) L.put(x, y, RP.brasa, 4 + hash2(x, y, s + 1) * 1.6);
  }
  // a soleira de granito da boca
  for (let x = cx - mw - 2; x < cx + mw + 2; x++) { P.put(x, yb - 3, RP.granito, 4 - (x - cx) * 0.05); P.put(x, yb - 2, RP.granito, 2.2); }
  // a coifa de bronze: um funil sobre a laje, a chaminé de tijolo subindo
  for (let y = 14; y < 33; y++) { const t = (y - 14) / 18, hw = 6 + t * 13; for (let x = Math.floor(cx - hw); x < cx + hw; x++) P.put(x, y, RP.bronze, 3.2 - (x + 0.5 - cx) / hw * 1.3 - t * 0.2 + ((y - 14) % 6 === 0 ? 0.8 : 0) + cg(x, y, s) * 0.45); }
  for (let y = 14; y < 33; y += 6) for (let x = cx - 18; x < cx + 18; x += 5) if (P.is(x, y, RP.bronze)) rivet(P, x, y);
  clanMark(P, cx - 5, 18, 10, RP.bronze, s + 3, 'relevo');
  brick(cx - 6, 0, 12, 14, null);
  for (let x = cx - 7; x < cx + 7; x++) P.put(x, 0, RP.granito, 4 - (x - cx) * 0.08);
  // o fole: duas tábuas em cunha, o couro pregueado entre elas, o bico enfiado no lado da fornalha
  for (let y = 45; y < 62; y++) { const t = (y - 45) / 16, hw = 1.5 + t * 6; for (let x = Math.floor(8 - hw); x < 8 + hw; x++) P.put(x, y, RP.couro, 3 - (x + 0.5 - 8) / hw * 0.9 + ((y - 45) % 3 === 0 ? -1 : 0.2) + cg(x, y, s) * 0.4); }
  P.line(1, 61, 15, 61, RP.madeira, 3.2, 2); P.line(2, 52, 13, 58, RP.madeira, 2.8, 2);
  P.line(8, 45, 16, 46, RP.bronze, 3.6, 2);
  P.line(1, 62, -2, 66, RP.madeira, 3, 1); for (let y = 63; y < yb + 1; y++) P.put(3, y, RP.madeira, 2.6);
  // o carvão amontoado à direita, as tenazes encostadas, uma pá
  for (let k = 0; k < 18; k++) P.blob(52 + hash2(k, 0, s) * 9, yb - 1 - hash2(k, 1, s) * 5 * (1 - Math.abs(hash2(k, 0, s) - 0.5)), 1.4 + hash2(k, 2, s), 1.1, RP.carvao, s + k, 2.8);
  P.line(51, yb - 1, 56, 50, RP.ferro, (t) => 3.4 - t * 0.4, 1); P.line(53, yb - 1, 57, 51, RP.ferro, 2.2, 1);
  grime(P, 1.1, 0.07, s + 4, (x, y) => (y < 34 && x > cx - 8 && x < cx + 8 ? 0.4 : -0.2) + (Math.abs(x - cx) < 12 && y > 34 && y < 44 ? 0.35 : 0), [T2, RP.bronze]);   // fuligem em cima da boca e na chaminé
  patina(P, 0.08, s + 5);
  chip(P, 0.2, s, [T2, RP.granito]);
  return [P.done(), L.done(false)];
}
function runeAnvil() {   // 46 x 34: a bigorna de runas grande: ferro escuro com runas de mithril embutidas (acesas) no corpo, sobre um cepo de granito gravado; o malho deitado em cima
  const P = painter(46, 34), L = painter(46, 34), s = 18441, F = RP.ferro, yb = 33;
  // o cepo de granito
  ashlar(P, 9, 22, 28, 12, RP.granito, s, 6, 14, null, 2.6);
  for (let x = 8; x < 38; x++) P.put(x, 21, RP.granito, 4.2 - (x - 8) * 0.04);
  carve(P, 13, 25, 2, RP.granito, 2.6); carve(P, 31, 25, 7, RP.granito, 2.2);
  // a bigorna: a mesa, o chifre comprido à esquerda, a cintura, o pé largo
  for (let y = 4; y < 10; y++) for (let x = 12; x < 40; x++) P.put(x, y, F, 3.4 - (y - 4) * 0.3 + (y === 4 ? 1.3 : 0) - (x - 12) * 0.02 + cg(x, y, s) * 0.45);
  for (let x = 0; x < 13; x++) { const t = x / 12, top = 4 + (1 - t) * 3.2, bot = 9 - (1 - t) * 1.8; for (let y = Math.floor(top); y < bot; y++) P.put(x, y, F, 3.4 - (y - top) * 0.5 + (y === Math.floor(top) ? 1.2 : 0) + cg(x, y, s) * 0.4); }
  for (let x = 39; x < 44; x++) for (let y = 4; y < 8; y++) P.put(x, y, F, 3 - (y - 4) * 0.5 + (y === 4 ? 1 : 0));   // o calcanhar
  P.put(36, 5, RP.sombra, 2); P.put(33, 5, RP.sombra, 2.4);   // os furos da mesa
  for (let y = 10; y < 16; y++) { const hw = 8 - Math.sin((y - 10) / 5 * Math.PI) * 2.5; for (let x = Math.floor(26 - hw); x < 26 + hw; x++) P.put(x, y, F, 2.7 - (x + 0.5 - 26) / hw * 1.1 + cg(x, y, s) * 0.4); }
  for (let y = 16; y < 21; y++) { const hw = 9 + (y - 16) * 0.8; for (let x = Math.floor(26 - hw); x < 26 + hw; x++) P.put(x, y, F, 3 - (x + 0.5 - 26) / hw * 1.1 + (y === 16 ? 0.8 : 0) + cg(x, y, s) * 0.4); }
  // as runas de mithril no flanco: acesas (e a mesma forma na camada de luz)
  for (let q = 0; q < 4; q++) inlay(P, 14 + q * 6, 5, [0, 3, 4, 9][q], RP.runa, 3.8, L);
  inlay(P, 24.5 | 0, 15, 5, RP.runa, 3.6, L);
  // o malho deitado na mesa: o cabo e a cabeça de bronze
  P.line(16, 3, 30, 1, RP.madeira, (t) => 3.4 - t * 0.5, 1); P.line(16, 4, 30, 2, RP.madeira, 2.2, 1);
  P.rect(29, 0, 5, 4, RP.bronze, (i, j) => 4 - i * 0.5 - j * 0.4);
  grime(P, 1.1, -0.08, s + 2, (x, y) => (y > 22 ? -1 : 0), [F]);
  chip(P, 0.2, s, [RP.granito]);
  return [P.done(), L.done(false)];
}
function bladeRack(k) {   // 46 x 40: o suporte de armas: dois postes de bronze com travessas, lâminas largas inacabadas (sem cabo, o espigão nu, carepa de forja), cabeças de machado nos pinos (k 1: uma travessa caída, as lâminas tombadas no chão)
  const P = painter(46, 40), s = 18461 + k, B = RP.bronze, F = RP.ferro, yb = 39;
  const blade = (x0, y0, len, wd, ang, sd) => {   // uma lâmina larga de pé: ponta para baixo? não: o espigão em cima, a ponta no chão
    const Q = painter(wd + 2, len);
    for (let y = 0; y < len; y++) {
      const tang = y < 6, t = (y - 6) / (len - 7), hw = tang ? 1 : (wd / 2) * (y > len - 6 ? (len - y) / 6 : 1);
      for (let x = Math.floor(wd / 2 + 1 - hw); x < wd / 2 + 1 + hw; x++) {
        const u = (x + 0.5 - wd / 2 - 1) / Math.max(1, hw);
        let v = tang ? 2.4 - u : 3 - u * 1 + (Math.abs(u) > 0.7 ? 0.7 : 0) + cg(x, y, sd) * 0.5;
        if (!tang && cn(x, y, 5, 5, sd) > 0.15) v -= 1.2;   // a carepa: manchas escuras de forja, ainda não polidas
        Q.put(x, y, F, v);
      }
      if (!tang && t < 0.95) Q.put(wd / 2 + 1, y, F, 2);    // o sulco do meio, só riscado
    }
    blit(P, Q, x0, y0, ang, 0, 0);
  };
  // as travessas e os postes
  for (const x of [1, 41]) { for (let y = 2; y <= yb; y++) for (let i = 0; i < 4; i++) P.put(x + i, y, B, 3.2 - i * 0.6 + cg(x, y, s) * 0.4); P.rect(x - 1, yb - 1, 6, 2, B, (i, j) => 3.4 - j - i * 0.2); P.rect(x - 1, 0, 6, 2, B, (i, j) => 4.2 - j * 1.2 - i * 0.2); }
  P.rect(4, 6, 37, 2, B, (i, j) => 3.8 - j * 1.4 - i * 0.02);
  if (!k) {
    P.rect(4, 26, 37, 2, B, (i, j) => 3.6 - j * 1.4 - i * 0.02);
    blade(7, 8, 30, 6, 0, s + 1); blade(16, 8, 30, 7, 0.03, s + 2); blade(26, 9, 29, 6, 0, s + 3); blade(34, 8, 30, 5, -0.02, s + 4);
    // as cabeças de machado nos pinos da travessa de cima
    for (const ax of [11, 30]) { P.put(ax, 8, B, 4); for (let y = 0; y < 6; y++) for (let x = 0; x < 5; x++) if (x + y * 0.3 < 5 - Math.abs(y - 2.5) * 0.4) P.put(ax - 2 + x, 9 + y - 6, F, 3.2 - x * 0.3); }
  } else {
    P.line(4, 26, 40, 36, B, (t) => 3.6 - t * 0.4, 2);
    blade(7, 8, 30, 6, 0, s + 1); blade(16, 8, 30, 7, 0.22, s + 2);
    const Q = painter(30, 8); for (let x = 0; x < 30; x++) for (let y = 1; y < 7; y++) { const hw = x < 6 ? 1 : 3 * (x > 25 ? (30 - x) / 5 : 1); if (Math.abs(y + 0.5 - 4) < hw) Q.put(x, y, F, 3 - (y - 4) * 0.4 + (cn(x, y, 5, 5, s) > 0.15 ? -1.2 : 0)); }
    blit(P, Q, 12, yb - 7, 0.04); blit(P, Q, 16, yb - 9, -0.05);
  }
  patina(P, 0.1, s + 5, (x, y) => (y > 30 ? 0.2 : 0));
  return P.done();
}
function oreCart(k) {   // 40 x 28: o carrinho de minério de bronze: caçamba de chapas rebitadas em trapézio, duas rodas pequenas no trilho, cheio de pedra, carvão e um brilho de mithril (k 1: tombado de lado, o minério esparramado)
  const s = 18481 + k, B = RP.bronze;
  const Q = painter(36, 24);
  // a caçamba: mais larga em cima, borda grossa, cintas
  for (let y = 4; y < 18; y++) { const inset = Math.round((y - 4) * 0.25); for (let x = 1 + inset; x < 35 - inset; x++) Q.put(x, y, B, 3 - (x - 1) / 34 * 1.2 - (y - 4) * 0.04 + cg(x, y, s) * 0.45 + cn(x, y, 12, 12, s + 1) * 0.3); }
  for (let x = 0; x < 36; x++) { Q.put(x, 3, B, 4.4 - x * 0.04); Q.put(x, 4, B, 3 - x * 0.03); }
  for (const x of [8, 18, 28]) for (let y = 5; y < 18; y++) { Q.put(x, y, B, 3.8 - x * 0.04); Q.put(x + 1, y, B, 1.6); }
  for (let y = 6; y < 17; y += 4) for (const x of [3, 12, 22, 32]) if (Q.has(x, y)) rivet(Q, x, y);
  // as rodas: pequenas, de bronze maciço, com o eixo
  for (const wx of [8, 27]) for (let y = 15; y < 24; y++) for (let x = wx - 5; x < wx + 5; x++) { const d = Math.hypot(x + 0.5 - wx, y + 0.5 - 19.5); if (d < 4.4) Q.put(x, y, d < 1.4 ? RP.ferro : B, d < 1.4 ? 3 : 3 - (x - wx + y - 19.5) * 0.3 + (d > 3.4 ? -0.6 : 0)); }
  // a carga: pedras de granito, carvão, uma lasca de mithril
  const load = (L, ox, oy) => {
    for (let k2 = 0; k2 < 16; k2++) { const x = ox + 3 + hash2(k2, 0, s) * 28, y = oy + 3 - hash2(k2, 1, s) * 4 * Math.sin((x - ox) / 34 * Math.PI); L.blob(x, y, 1.6 + hash2(k2, 2, s) * 1.4, 1.3, hash2(k2, 3, s) < 0.4 ? RP.carvao : RP.granito, s + k2, 2.6); }
    L.blob(ox + 19, oy - 0.5, 1.6, 1.2, RP.mithril, s + 30, 3.6); L.put(ox + 18, oy - 1, RP.mithril, 5);
  };
  if (!k) {
    const P = painter(40, 28); load(P, 2, 3); blit(P, Q, 2, 4);
    for (let x = 0; x < 40; x++) P.put(x, 27, RP.ferro, 2.4 + (x % 6 === 0 ? 1 : 0));   // um pedaço de trilho
    patina(P, 0.12, s + 4, (x, y) => (y > 16 ? 0.2 : 0));
    return P.done();
  }
  const P = painter(44, 30), yb = 29;
  blit(P, Q, 2, 3, -1.45, 18, 20);
  for (let k2 = 0; k2 < 14; k2++) P.blob(20 + hash2(k2, 0, s) * 22, yb - hash2(k2, 1, s) * 3, 1.5 + hash2(k2, 2, s) * 1.2, 1.2, hash2(k2, 3, s) < 0.4 ? RP.carvao : RP.granito, s + k2, 2.6);
  P.blob(31, yb - 1, 1.4, 1, RP.mithril, s + 30, 3.4);
  patina(P, 0.12, s + 4);
  return P.done();
}
function ingotHeap(k) {   // 36 x 20: o monte de lingotes velhos: barras em trapézio empilhadas em camadas cruzadas (de lado e de topo), bronze com pátina e ferro opaco (k 1: um monte menor, desarrumado, barras caídas no chão)
  const P = painter(36, 20), s = 18501 + k, yb = 19;
  const side = (x, y, R, vv) => { for (let j = 0; j < 4; j++) for (let i = j; i < 10 - j; i++) P.put(x + i, y - j, R, vv + (j === 3 ? 1.4 : j === 0 ? -0.9 : 0) - i * 0.06 + (i === j ? 0.5 : 0) + cg(x + i, y - j, s) * 0.4); };   // de lado: um trapézio
  const end = (x, y, R, vv) => { P.rect(x, y - 3, 4, 4, R, (i, j) => vv + (j === 0 ? 1.3 : 0) + (i === 0 ? 0.5 : 0) - (i === 3 ? 0.9 : 0) - (j === 3 ? 0.9 : 0) + cg(x + i, y + j, s) * 0.4); };   // de topo: um quadrado
  const mat = (q, r) => hash2(q, r, s) < 0.28 ? RP.ferro : RP.bronze;
  const rows = k ? [['s', 3, 2], ['e', 5, 9]] : [['s', 3, 1], ['e', 6, 6], ['s', 2, 7], ['e', 2, 13]];
  let y = yb;
  for (let r = 0; r < rows.length; r++) {
    const [kind, n, x0] = rows[r];
    for (let q = 0; q < n; q++) kind === 's' ? side(x0 + q * 10, y, mat(q, r), 2.9 - r * 0.1) : end(x0 + q * 4, y, mat(q, r), 3 - r * 0.1);
    y -= 4;
  }
  if (k) { const Q = painter(11, 5); for (let j = 0; j < 4; j++) for (let i = j; i < 10 - j; i++) Q.put(i, 4 - j, RP.bronze, 2.9 + (j === 3 ? 1.4 : 0)); blit(P, Q, 25, yb - 6, 0.5); side(26, yb, RP.ferro, 2.6); }
  else { side(26, yb, RP.bronze, 2.6); }
  patina(P, 0.14, s + 2, (x, y2) => (y2 > 12 ? 0.15 : 0));
  return P.done();
}
function barricade(k) {   // 56 x 38: a barricada virada para baixo: mesas de pedra de pé, escudos redondos presos, lanças atravessadas com a ponta para o lado de baixo, entulho (k 1: espelhada, para o outro lado)
  const P = painter(56, 38), s = 18521, yb = 37, B = RP.bronze;
  // as mesas de pé: tampos de granito em pé, os pés para trás (esquerda)
  ashlar(P, 6, 6, 8, 32, RP.granito, s, 8, 8, null, 2.8); ashlar(P, 16, 12, 8, 26, RP.granito, s + 1, 8, 8, null, 2.5);
  P.rect(1, 9, 5, 3, RP.granito, (i, j) => 3 - j - i * 0.1); P.rect(1, 30, 5, 3, RP.granito, (i, j) => 2.6 - j - i * 0.1);
  // os escudos redondos presos na frente (cada um um oval de bronze com o umbo)
  const shield = (cx, cy, rx, ry, sd) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry); if (d > 1) continue; P.put(x, y, B, 3 - (x - cx) / rx * 0.9 - (y - cy) / ry * 0.6 + (d > 0.82 ? 0.9 : 0) + (Math.abs(d - 0.55) < 0.08 ? -0.8 : 0) + cg(x, y, sd) * 0.45); } P.blob(cx, cy, rx * 0.25, ry * 0.25, B, sd, 3.6); };
  shield(13, 15, 6.5, 7.5, s + 2); shield(24, 25, 6.5, 7.5, s + 3); shield(12, 30, 5.5, 6.5, s + 4);
  // as lanças: atravessadas, a ponta para a direita e para baixo (para quem vem de baixo)
  for (const [x0, y0, x1, y1] of [[2, 6, 52, 26], [4, 18, 54, 32], [10, 2, 48, 14]]) { P.line(x0, y0, x1, y1, RP.madeira, (t) => 3.4 - t * 0.6, 1); const a = Math.atan2(y1 - y0, x1 - x0); for (let q = 0; q < 5; q++) { const hw = (5 - q) * 0.45; for (let w = -hw; w <= hw; w += 0.5) P.put(x1 + Math.cos(a) * q - Math.sin(a) * w, y1 + Math.sin(a) * q + Math.cos(a) * w, B, 4 - q * 0.3 - w * 0.4); } }
  // um pedaço de mesa tombado e o entulho de pedra na base
  P.box(28, 28, 12, 6, RP.granito, s + 5, 2.6);
  rubble(P, 0, 46, yb, 4, RP.granito, s + 6);
  patina(P, 0.1, s + 7);
  chip(P, 0.3, s, [RP.granito]);
  return (k ? mirror(P) : P).done();
}
function waxCocoon(k) {   // 28 x 38: o casulo de cera rachado e vazio: um ovo comprido de favos de cera seca, aberto pela frente de cima a baixo, oco e escuro, cacos ao pé (k 1: tombado, a ponta quebrada)
  const s = 18541 + k, C = RP.cera;
  const Q = painter(24, 34), cx = 12;
  for (let y = 0; y < 34; y++) {
    const t = y / 33, hw = 10.5 * (t < 0.55 ? Math.sin((t / 0.55) * Math.PI / 2 * 0.92 + 0.12) : 1 - Math.pow((t - 0.55) / 0.45, 3) * 0.35);
    for (let x = Math.floor(cx - hw); x < cx + hw; x++) {
      const u = (x + 0.5 - cx) / Math.max(1, hw);
      // os favos: hexágonos pequenos (junta escura), o volume aceso da esquerda
      const hy = y / 3, hx = (x + (Math.floor(hy) % 2) * 1.5) / 3, fx = hx - Math.floor(hx), fy = hy - Math.floor(hy), joint = fx < 0.2 || fy < 0.2;
      const split = Math.abs(u + 0.15 - Math.sin(y * 0.5) * 0.08) < 0.36 * Math.sin(Math.min(1, t * 1.1) * Math.PI) && t > 0.08 && t < 0.96;
      if (split) { Q.put(x, y, RP.quitina, 0.6 + (u < 0 ? 0.6 : 0) + (y > 26 ? 0.4 : 0)); continue; }   // o oco: escuro, um brilho de quitina no fundo
      Q.put(x, y, C, 3.4 - u * 1.4 - u * u * 0.6 + (joint ? -1 : 0.2) + cg(x, y, s) * 0.45);
    }
  }
  // as bordas do rasgo levantadas, acesas
  for (let y = 4; y < 32; y++) for (let x = 1; x < 23; x++) if (Q.is(x, y, C) && (Q.is(x + 1, y, RP.quitina) || Q.is(x - 1, y, RP.quitina))) Q.put(x, y, C, 4.6);
  if (!k) {
    const P = painter(28, 38); blit(P, Q, 2, 2);
    for (const [x, y] of [[3, 36], [7, 37], [22, 36], [25, 37], [18, 37]]) P.rect(x, y, 2, 1, C, (i) => 3.6 - i);
    grime(P, 1.1, -0.13, s + 1, (x, y) => (y > 30 ? 0.3 : -0.2), [C]);
    return P.done();
  }
  for (let y = 0; y < 7; y++) for (let x = 0; x < 24; x++) if (hash2(x, y, s) < 0.6 + y * 0.06) Q.clear(x, y);
  const P = painter(40, 26); blit(P, Q, 3, -5, -1.5, 12, 17);
  for (const [x, y] of [[2, 25], [5, 24], [36, 25]]) P.rect(x, y, 2, 1, C, (i) => 3.6 - i);
  return P.done();
}

/* =============================== TETO =============================== */
function runeLamp(P, L, x, y, s) {   // uma lâmpada de runa: gaiola de bronze em losango, o cristal aceso dentro (camada de luz também)
  for (let j = 0; j < 7; j++) { const hw = j < 4 ? j * 0.8 + 0.5 : (6 - j) * 0.8 + 0.5; for (let i = Math.floor(x - hw); i <= x + hw; i++) { const edge = Math.abs(i + 0.5 - x - 0.5) > hw - 0.6; if (edge || j === 3) P.put(i, y + j, RP.bronze, 3.6 - (i - x) * 0.3); else { P.put(i, y + j, RP.runa, 4.4 - Math.abs(j - 3) * 0.3); L.put(i, y + j, RP.runa, 5 - Math.abs(j - 3) * 0.4); } } }
  P.put(x, y - 1, RP.bronze, 4); P.put(x, y + 7, RP.bronze, 2.6);
}
function chandelier() {   // 56 x 44: o lustre de bronze: a corrente do teto, um aro de cima pequeno e o de baixo largo (de lado, faixas), cinco lâmpadas de runa acesas, pingentes
  const P = painter(56, 44), L = painter(56, 44), s = 18601, B = RP.bronze, cx = 28;
  P.rect(cx - 4, 0, 8, 2, B, (i, j) => 3.6 - j * 1.2 - i * 0.2);
  chainV(P, cx - 1, 2, 14);
  // os braços do aro de baixo até o anel de cima
  for (const dx of [-22, -11, 11, 22]) P.line(cx + dx * 0.25, 16, cx + dx, 29, B, (t) => 3.4 - (dx > 0 ? 0.8 : 0) - t * 0.3, 1);
  // o aro de cima: um anel pequeno, de lado (duas faixas)
  for (let x = cx - 7; x < cx + 7; x++) { P.put(x, 14, B, 4.2 - (x - cx + 7) * 0.12); P.put(x, 15, B, 3 - (x - cx + 7) * 0.1); P.put(x, 16, B, 1.6); }
  runeLamp(P, L, cx - 1, 5 + 12, s);
  // o aro de baixo: uma faixa larga com runas gravadas
  for (let x = 2; x < 54; x++) { const sag = Math.sin((x - 2) / 52 * Math.PI) * 1.2; for (let j = 0; j < 4; j++) P.put(x, Math.round(29 + j + sag * 0), B, (j === 0 ? 4.2 : j === 3 ? 1.6 : 3) - (x - 2) * 0.025 + cg(x, j, s) * 0.4); }
  for (let q = 0; q < 6; q++) carve(P, 6 + q * 8, 29, q + 2, B, 3.2);
  for (const lx of [4, 16, 28, 40, 52]) { runeLamp(P, L, lx - 1, 21, s + lx); if (lx !== 28) P.line(lx - 1, 28, lx - 1, 29, B, 3, 1); }
  // pingentes: gotas de bronze pendendo do aro
  for (let x = 7; x < 52; x += 6) { P.put(x, 33, B, 3); P.put(x, 34, B, 3.6); P.put(x, 35, B, 2.6); }
  for (const lx of [10, 22, 34, 46]) { for (let y = 33; y < 38; y++) P.put(lx, y, B, 2.8); P.blob(lx + 0.5, 39.5, 1.2, 1.6, RP.runa, s, 3.2); L.put(lx, 39, RP.runa, 4.6); }
  patina(P, 0.06, s + 2);
  return [P.done(), L.done(false)];
}
function craneChain(k) {   // 22 x 54 ou 30 x 52: a corrente de guindaste com o gancho: a peça de bronze presa no teto, a corrente grossa, o gancho grande (k 1: com um feixe de lingotes preso em correntes)
  const W = k ? 30 : 22, H = k ? 54 : 56, P = painter(W, H), s = 18621 + k, B = RP.bronze, cx = k ? 13 : 7;
  P.rect(cx - 5, 0, 12, 3, B, (i, j) => 3.8 - j * 1.2 - i * 0.15); rivet(P, cx - 4, 0); rivet(P, cx + 4, 0);
  P.rect(cx - 1, 3, 4, 3, B, (i, j) => 3.4 - i * 0.6);
  const ce = k ? 22 : 36;
  for (let y = 6; y < ce; y++) { const q = (y - 6) % 5; if (q < 3) { P.put(cx, y, RP.ferro, 4 - q * 0.5); P.put(cx + 2, y, RP.ferro, 2.4); P.put(cx + 1, y, q === 1 ? RP.sombra : RP.ferro, q === 1 ? 2 : 3.6); } else { P.put(cx + 1, y, RP.ferro, 4 - (q - 3)); P.put(cx + 1, y, RP.ferro, 3.6); } }
  // o gancho: o olhal, a haste e a curva grossa aberta para a direita
  const hy = ce;
  P.blob(cx + 1, hy + 1.5, 2.4, 2.4, B, s, 3); P.put(cx + 1, hy + 1, RP.sombra, 2);
  // a haste desce do olhal, a curva funda abre para a direita e sobe até a ponta
  const bx = cx + 1, bcx = bx + 4.5, bcy = hy + 11, br = 4.5;
  tube(P, t => { if (t < 0.3) return [bx, hy + 3 + (t / 0.3) * (bcy - hy - 3)]; const a = Math.PI - (t - 0.3) / 0.7 * (Math.PI + 0.75); return [bcx + Math.cos(a) * br, bcy + Math.sin(a) * br]; }, t => t < 0.3 ? 3.4 : 3.4 - (t - 0.3) * 2.2, B, s + 1, 2.8, 70);
  P.put(Math.round(bcx + Math.cos(-0.75) * br) + 1, Math.round(bcy + Math.sin(-0.75) * br) - 1, B, 4.6);   // a ponta
  if (k) {   // o feixe de lingotes: as pontas das barras de frente, amarradas por duas voltas de corrente presas no gancho
    const fx = cx - 8, fy = Math.round(bcy + br + 3);
    P.line(bcx, bcy + br - 1, fx + 2, fy, RP.ferro, 3, 1); P.line(bcx, bcy + br - 1, fx + 22, fy, RP.ferro, 2.4, 1);
    for (let r = 0; r < 3; r++) for (let q = 0; q < 6 - (r === 0 ? 1 : 0); q++) { const x0 = fx + q * 4 + (r === 0 ? 2 : 0), y0 = fy + 1 + (2 - r) * 0 + r * 4; P.rect(x0, y0, 4, 4, B, (i, j) => 3.4 - i * 0.4 - j * 0.3 + (i === 0 || j === 0 ? 0.7 : 0) - (i === 3 || j === 3 ? 1.2 : 0) + cg(x0 + i, y0 + j, s) * 0.4); }
    for (const x of [fx + 6, fx + 17]) for (let y = fy; y < fy + 14; y++) P.put(x, y, RP.ferro, (y % 3 === 0 ? 2 : 3.6));
  }
  patina(P, 0.1, s + 2);
  return P.done();
}
function clanBanner(k) {   // 30 x 56: o estandarte do clã: a vara de bronze com pontas, duas cordas ao teto, o pano vermelho com barra de bronze e a marca bordada, a cauda em andorinha (k 1: rasgado e chamuscado)
  const P = painter(30, 56), s = 18641 + k, B = RP.bronze;
  P.line(4, 0, 4, 5, RP.la, 3, 1); P.line(25, 0, 25, 5, RP.la, 2.4, 1);
  for (let x = 0; x < 30; x++) { P.put(x, 6, B, 4.2 - x * 0.06); P.put(x, 7, B, 2.4 - x * 0.03); }
  P.put(0, 5, B, 4); P.put(29, 5, B, 3); P.blob(0.5, 6.5, 1.2, 1.2, B, s, 3.4); P.blob(28.5, 6.5, 1.2, 1.2, B, s, 2.6);
  for (let x = 3; x < 27; x++) {
    const tail = x < 15 ? 52 - (x - 3) * 0.6 : 52 - (26 - x) * 0.6, L = tail + (x > 12 && x < 18 ? -(6 - Math.abs(x - 15) * 2) : 0);
    for (let y = 8; y < L; y++) {
      if (k && (cn(x, y, 6, 6, s) + 0.5 < (y - 20) / 50 || (x > 20 && y > 30 && hash2(x, y, s) < 0.3))) continue;
      const bord = x < 5 || x > 24 || y > L - 3;
      P.put(x, y, bord ? B : RP.rubro, (bord ? 3.4 : 3) - (x - 3) * 0.04 + Math.sin(x * 0.9 + s) * 0.35 - y * 0.008 + cg(x, y, s) * 0.4);
    }
  }
  clanMark(P, 8, 16, 14, B, s + 2, 'relevo');
  for (let y = 16; y < 34; y++) for (let x = 8; x < 22; x++) if (P.is(x, y, B)) P.put(x, y, B, P.v(x, y) - 0.6);   // bordado: mais baixo que metal
  if (k) grime(P, 1.1, 0.07, s + 4, (x, y) => (y > 36 ? 0.35 : -0.3), [RP.rubro, B]);
  return P.done();
}
function pulley(k) {   // 26 x 48: a roldana com corda: o suporte de bronze no teto, a roda com a corda passando, uma ponta com o contrapeso, a outra puída (k 1: a ponta com um balde de bronze)
  const P = painter(26, 48), s = 18661 + k, B = RP.bronze;
  P.rect(5, 0, 16, 3, B, (i, j) => 3.8 - j * 1.2 - i * 0.1); rivet(P, 6, 0); rivet(P, 19, 0);
  P.line(9, 3, 12, 9, B, 3.4, 2); P.line(17, 3, 14, 9, B, 2.4, 2);
  gear(P, 13, 12, 6.5, 0, 0, B, s, 3, 3, true);   // n = 0: uma roda lisa com furos
  for (let a = 0; a < 6.3; a += 0.1) P.put(13 + Math.cos(a) * 6, 12 + Math.sin(a) * 6, RP.la, a > 3.14 ? 3.6 : 2.4);   // a canaleta com a corda
  const rope = (x, y0, y1) => { for (let y = y0; y < y1; y++) { P.put(x, y, RP.la, (y % 3 === 0 ? 2.2 : 3.4)); P.put(x + 1, y, RP.la, 2.2); } };
  rope(6, 12, k ? 36 : 40); rope(19, 12, k ? 30 : 34);
  if (!k) { P.box(2, 40, 10, 8, RP.granito, s + 1, 2.8); P.rect(5, 39, 4, 1, B, (i) => 3.6 - i * 0.4); carve(P, 5, 41, 4, RP.granito, 2.8); for (let y = 34; y < 38; y++) P.put(19 + (y % 2), y, RP.la, 3 - (y - 34) * 0.3); }
  else {
    for (let y = 36; y < 46; y++) { const hw = 5 - (y - 36) * 0.15; for (let x = Math.floor(7 - hw); x < 7 + hw; x++) P.put(x, y, B, 3.4 - (x - 7) / hw * 1.2 + (y === 38 || y === 44 ? 1 : 0)); }
    P.line(2, 36, 7, 33, B, 3, 1); P.line(7, 33, 12, 36, B, 2.2, 1);
    for (let y = 30; y < 33; y++) P.put(19, y, RP.la, 2.6);
  }
  patina(P, 0.12, s + 2);
  return P.done();
}

/* =============================== FUNDO, NO CHÃO =============================== */
function treasuryDoor() {   // 74 x 66: a porta redonda do tesouro: a moldura de cantaria com a boca redonda, o cofre lá dentro escuro e vazio (prateleiras nuas), a porta de bronze aberta para o lado (vista de quina), os ferrolhos tortos
  const P = painter(74, 66), s = 18701, G = RP.granito, B = RP.bronze, cx = 30, cy = 33, r = 24, yb = 65;
  // a parede de cantaria em volta da boca, os degraus de soleira
  ashlar(P, 0, 4, 62, 62, G, s, 6, 14, (X, Y) => Math.hypot(X + 0.5 - cx, Y + 0.5 - cy) >= r + 4 && !(Y > yb - 4 && X > 52), 2.5);
  for (let x = 0; x < 62; x++) { P.put(x, 3, G, 4.2 - x * 0.03); P.put(x, 4, G, 2.4); }
  // o anel de bronze da boca (a moldura), com os encaixes dos ferrolhos
  for (let y = cy - r - 4; y <= cy + r + 4; y++) for (let x = cx - r - 4; x <= cx + r + 4; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d < r || d >= r + 4) continue; const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx); P.put(x, y, B, 3 - Math.cos(a + 0.8) * 1.1 + (d > r + 3 ? -0.8 : d < r + 1 ? 0.6 : 0) + (Math.abs((a * 8 / Math.PI) % 2) < 0.2 ? -1.2 : 0) + cg(x, y, s) * 0.4); }
  // dentro: o cofre escuro, as prateleiras de pedra nuas (uma moeda esquecida)
  for (let y = cy - r; y < cy + r; y++) for (let x = cx - r; x < cx + r; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d >= r) continue; P.put(x, y, RP.sombra, 2.6 - (y - cy + r) * 0.02 + (d > r - 2 ? -1 : 0) + cg(x, y, s) * 0.5); }
  for (const sy of [22, 34, 46]) for (let x = cx - r; x < cx + r; x++) if (Math.hypot(x + 0.5 - cx, sy + 0.5 - cy) < r - 1) { P.put(x, sy, G, 2.4 - Math.abs(x - cx) * 0.03); P.put(x, sy + 1, G, 1.2); }
  for (const sy of [22, 34, 46]) for (const x of [cx - 12, cx + 4]) if (Math.hypot(x + 0.5 - cx, sy - 6 - cy) < r - 2) for (let y = sy - 6; y < sy; y++) P.put(x, y, G, 1.4);   // as divisórias
  P.put(cx + 9, 45, RP.bronze, 4.4); P.put(cx + 10, 45, RP.bronze, 3);   // uma moeda
  // a porta aberta à direita: um disco visto de quina = uma elipse estreita, grossa, com os ferrolhos tortos saindo da borda
  for (let y = cy - r - 2; y <= cy + r + 2; y++) for (let x = 56; x < 72; x++) { const dx = (x + 0.5 - 63) / 6.5, dy = (y + 0.5 - cy) / (r + 2); const d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, B, 3.2 - dx * 1 - dy * 0.6 + (Math.abs(dx) > 0.82 ? -0.8 : 0) + (Math.abs(((y - cy) % 8 + 8) % 8) < 1 ? 0.8 : 0) + cg(x, y, s) * 0.4); }
  for (let y = cy - r; y <= cy + r; y++) { P.put(56, y, B, 4.4); P.put(57, y, B, 3.6); }   // a borda grossa da porta
  clanMark(P, 59, cy - 7, 9, B, s + 3, 'relevo');
  for (const [y, ang] of [[cy - 16, -0.5], [cy, 0.4], [cy + 16, 0.9]]) P.line(56, y, 56 - Math.cos(ang) * 5, y + Math.sin(ang) * 5, RP.ferro, 3.2, 2);   // os ferrolhos dobrados
  // as dobradiças grossas na moldura, a soleira
  for (const y of [cy - 18, cy + 15]) P.box(52, y, 6, 4, B, s + y, 3);
  P.rect(0, yb - 3, 62, 4, G, (i, j) => 3.8 - j * 0.8 - i * 0.02 + cg(i, j, s) * 0.4);
  patina(P, 0.08, s + 4, (x, y) => (y > 44 ? 0.2 : 0));
  grime(P, 1.1, -0.08, s + 5, (x, y) => (P.is(x, y, G) ? (y > 54 ? 0.2 : -0.1) : -1));
  chip(P, 0.2, s, [G]);
  return P.done();
}
function gearWall() {   // 70 x 70: a engrenagem gigante em relevo: o nicho redondo numa parede de chapa de bronze escuro, o eixo, a engrenagem pequena que engata embaixo (as duas rodas são desenhadas ao vivo, girando)
  const P = painter(70, 70), s = 18721, B = RP.bronze, G = RP.granito, yb = 69;
  // a parede de chapas e o pé de granito
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) plate(P, i * 17 + 1, j * 15, 17, 15, s + i + j * 7, 1.9, 0);
  ashlar(P, 0, 60, 70, 10, G, s + 30, 5, 14, null, 2.5);
  // os nichos: o grande e o pequeno, fundos escuros com a borda de baixo acesa
  const holes = [[30, 29, 27], [56, 50, 11]];
  for (const [hx, hy, hr] of holes) for (let y = hy - hr - 2; y <= hy + hr + 2; y++) for (let x = hx - hr - 2; x <= hx + hr + 2; x++) { const d = Math.hypot(x + 0.5 - hx, y + 0.5 - hy); if (d > hr + 1.5) continue; if (d > hr) { P.put(x, y, B, y > hy ? 3.8 : 1.4); continue; } P.put(x, y, RP.sombra, 2.2 - (d / hr) * 1 + cg(x, y, s) * 0.4); }
  // o rastro do óleo escorrido do eixo
  grime(P, 1.1, 0.02, s + 2, (x, y) => (Math.abs(x - 30) < 5 && y > 50 ? 0.5 : -0.4), [B, G]);
  patina(P, 0.06, s + 3);
  // os quadros das rodas: a grande (12 dentes) e a pequena (6 dentes) giram em sentidos contrários; 10 quadros cobrem
  // um dente da grande (30°) e dois da pequena, então o laço fecha sem salto
  anGearFrames.length = 0;
  const N = 10;
  for (let f = 0; f < N; f++) {
    const Q = painter(70, 70), a = f / N * Math.PI * 2 / 12;
    gear(Q, 30, 29, 25.5, 12, a, B, s + 40, 5, 3);
    gear(Q, 56, 50, 10, 6, -a * 2 + Math.PI / 6 + 0.04, B, s + 41, 0, 2.8);
    // o eixo grande: um cubo de ferro com a runa de girar acesa? não: apagada, a máquina gira sem ninguém
    for (let y = 25; y < 34; y++) for (let x = 26; x < 35; x++) if (Math.hypot(x + 0.5 - 30.5, y + 0.5 - 29.5) < 3.6) Q.put(x, y, RP.ferro, 3.4 - (x + y - 59) * 0.25);
    anGearFrames.push(Q.done());
  }
  return P.done();
}
function exodusMural(k) {   // 98 x 58: o mural do êxodo: um painel de lajes com moldura de bronze; pintados em ocre, os anões subindo em fila uma escadaria com bigornas nas costas; embaixo de uma faixa, em vermelho, vultos de seis pernas (k 1: mais gasto, rachado, um pedaço caído)
  const P = painter(98, 58), s = 18741 + k, G = RP.granito, B = RP.bronze, yb = 57;
  // as lajes do painel (fundo claro de reboco sobre granito) e a moldura
  for (let y = 3; y < 52; y++) for (let x = 3; x < 95; x++) P.put(x, y, G, 2.9 - (x - 3) * 0.008 + cn(x, y, 30, 30, s) * 0.45 + cg(x, y, s) * 0.35 + ((x - 3) % 23 === 22 ? -1.2 : 0));
  for (let x = 0; x < 98; x++) for (let j = 0; j < 3; j++) { P.put(x, j, B, 4 - j * 1 - x * 0.01); P.put(x, 52 + j, B, 3.2 - j * 0.9 - x * 0.01); }
  for (let y = 0; y < 55; y++) for (let i = 0; i < 3; i++) { P.put(i, y, B, 3.8 - i); P.put(95 + i, y, B, 2.6 - i * 0.6); }
  for (const x of [0, 95]) for (const y of [0, 52]) P.rect(x, y, 3, 3, B, (i, j) => 4.4 - i * 0.5 - j * 0.5);
  // o pé: um rodapé de granito até o chão
  ashlar(P, 0, 55, 98, 3, G, s + 1, 3, 14, null, 2.4);
  const paint = (x, y, R, v) => { if (k && cn(x, y, 5, 5, s + 9) > 0.32) return; if (P.is(x, y, G)) P.put(x, y, R, v + cg(x, y, s + 3) * 0.4); };
  // a escadaria pintada: sobe da esquerda (embaixo) para a direita (em cima)
  for (let x = 6; x < 92; x++) { const st = Math.floor((x - 6) / 6), y = 40 - st * 2.3; for (let yy = Math.round(y); yy < 42; yy++) if (yy === Math.round(y) || yy === 41) paint(x, yy, RP.ocre, yy === Math.round(y) ? 2.4 : 1.8); }
  // os anões em fila, virados para a direita, curvados para a frente: capuz, rosto, a barba comprida, o corpo atarracado,
  // a bigorna amarrada nas costas (cinza escuro: o vermelho fica só para o que vem de baixo), o cajado na mão
  const DW = [
    '.....hhh....',
    '....hhhhh...',
    'aaaaa.ffb...',
    '.aaa.offbb.s',
    '..a.ooobbb.s',
    '.aaaoooobb.s',
    '....ooooo..s',
    '....ooooo..s',
    '....oo.oo..s',
    '...oo...oo.s'
  ];
  const DV = { h: [RP.ocre, 2.6], f: [RP.ocre, 4.4], b: [RP.ocre, 4.8], o: [RP.ocre, 3.3], a: [RP.carvao, 4.6], s: [RP.ocre, 2.2] };
  for (let q = 0; q < 9; q++) {
    const fx = 10 + q * 9.4, st = Math.floor((fx - 6) / 6), fy = Math.round(40 - st * 2.3), stride = q % 2;
    for (let j = 0; j < DW.length; j++) {
      let row = DW[j]; if (j >= 8 && stride) row = j === 8 ? '....ooo....s' : '....o.oo...s';
      for (let i = 0; i < 12; i++) { const ch = row[i]; if (ch === '.') continue; const [R, v] = DV[ch]; paint(Math.round(fx) - 6 + i, fy - 10 + j, R, v - i * 0.04 + (ch === 'o' && i > 6 ? -0.4 : 0)); }
    }
  }
  // a faixa (um friso de runas pintadas) e embaixo os vultos de seis pernas em vermelho
  for (let x = 6; x < 92; x++) paint(x, 44, RP.ocre, 2.6);
  for (let q = 0; q < 14; q++) { const gx = 7 + q * 6; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (glyphOn(q, i, j) && j % 2 === 0) paint(gx + i, 45 + (j >> 1), RP.ocre, 3); }
  for (let q = 0; q < 5; q++) {
    const bx = 12 + q * 17 + (q % 2) * 3, by = 50;
    for (let x = -4; x < 5; x++) for (let y = -2; y < 1; y++) if (Math.hypot(x / 4.5, (y + 1) / 1.6) < 1) paint(bx + x, by + y, RP.tinta, 3.6);   // o corpo comprido
    for (let x = 5; x < 8; x++) paint(bx + x, by - 1, RP.tinta, 3.4);   // a cabeça
    paint(bx + 8, by - 2, RP.tinta, 3); paint(bx + 8, by, RP.tinta, 3);   // as pinças
    for (const lx of [-3, 0, 3]) { paint(bx + lx - 1, by + 1, RP.tinta, 3.2); paint(bx + lx - 2, by + 2, RP.tinta, 3); paint(bx + lx + 1, by - 3, RP.tinta, 3.2); paint(bx + lx + 2, by - 4, RP.tinta, 3); }   // seis pernas, três de cada lado
  }
  if (k) {   // a rachadura diagonal e o canto de baixo à direita caído
    let x = 60, y = 3; for (let n = 0; n < 60 && y < 52; n++) { P.put(x, y, RP.sombra, 2); x += hash2(n, 0, s) < 0.4 ? -1 : 0; y++; }
    for (let y = 36; y < 55; y++) for (let x = 78 + (55 - y) * 0.5; x < 98; x++) P.clear(x, y);
    rubble(P, 74, 97, yb, 3, G, s + 5);
  }
  grime(P, 1.1, -0.08, s + 6, (x, y) => (y < 8 ? 0.2 : 0) + (P.is(x, y, B) ? -1 : 0));
  patina(P, 0.08, s + 7);
  chip(P, 0.25, s, [G]);
  return P.done();
}

/* =============================== FUNDO, NA ALTURA DOS OLHOS =============================== */
function markPlate(k) {   // 30 x 38: a marca do clã em bronze presa na parede: o martelo sobre a montanha e as três runas embaixo (k 1: velha, verde de pátina, uma runa arrancada deixando os furos)
  const P = painter(30, 38), s = 18761 + k, B = RP.bronze;
  clanMark(P, 0, 0, 30, B, s, 'relevo');
  // os pinos que prendem na pedra
  for (const [x, y] of [[15, 4], [6, 26], [24, 26]]) { P.put(x, y, B, 4.8); P.put(x + 1, y + 1, B, 1.4); }
  if (k) {
    for (let y = 29; y < 38; y++) for (let x = 0; x < 30; x++) if (P.is(x, y, B) && x > 18) P.clear(x, y);
    P.put(21, 31, RP.sombra, 2); P.put(23, 33, RP.sombra, 2);   // os furos dos pinos
    patina(P, 0.42, s + 1, (x, y) => (y > 20 ? 0.2 : 0));
  } else patina(P, 0.08, s + 1);
  return P.done();
}
function shieldAxes() {   // 42 x 36: escudo e machados cruzados na parede: dois machados de guerra em X atrás, o escudo redondo de bronze com aro e umbo na frente
  const P = painter(42, 36), s = 18781, B = RP.bronze, cx = 21, cy = 19;
  const axe = (x0, y0, x1, y1, dir, sd) => {
    P.line(x0, y0, x1, y1, RP.madeira, (t) => 3.4 - t * 0.6, 2);
    // a lâmina em meia-lua na ponta de cima, virada para fora
    for (let j = -6; j <= 6; j++) for (let i = 0; i < 7 - Math.abs(j) * 0.55; i++) P.put(x0 + dir * (2 + i), y0 + j + 2, RP.ferro, 3.4 - i * 0.15 - j * 0.12 + (i > 5 - Math.abs(j) * 0.55 ? 1 : 0) + cg(x0, j, sd) * 0.3);
  };
  axe(5, 3, 34, 34, -1, s); axe(37, 3, 8, 34, 1, s + 1);
  for (let y = cy - 14; y <= cy + 14; y++) for (let x = cx - 14; x <= cx + 14; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / 14; if (d > 1) continue;
    let v = 3 - (x - cx + y - cy) / 14 * 0.8 + cg(x, y, s) * 0.45 + cn(x, y, 10, 10, s + 2) * 0.3;
    if (d > 0.86) v += 0.8 - (d > 0.95 ? 1.4 : 0);
    if (Math.abs(d - 0.6) < 0.04) v -= 1;
    P.put(x, y, B, v);
  }
  P.blob(cx, cy, 4, 4, B, s + 3, 3.6);
  for (let q = 0; q < 8; q++) { const a = q / 8 * Math.PI * 2; rivet(P, Math.round(cx + Math.cos(a) * 10.6), Math.round(cy + Math.sin(a) * 10.6)); }
  patina(P, 0.1, s + 4);
  return P.done();
}
function hexHole(k) {   // 40 x 38: o buraco hexagonal derretido numa chapa de bronze: a chapa rebitada, o furo de seis lados com a borda escorrida em gotas, cera seca em volta, o escuro do outro lado (k 1: furo menor, forrado de favos de cera)
  const P = painter(40, 38), s = 18801 + k, B = RP.bronze, C = RP.cera, cx = 20, cy = 18, r = k ? 8.5 : 12;
  plate(P, 2, 1, 36, 34, s, 2.6, 8);
  const hexD = (x, y) => { const dx = Math.abs(x + 0.5 - cx), dy = Math.abs(y + 0.5 - cy); return Math.max(dx * 0.866 + dy * 0.5, dy) / r; };   // hexágono de ponta para os lados
  for (let y = 0; y < 38; y++) for (let x = 0; x < 40; x++) {
    if (!P.has(x, y)) continue; const d = hexD(x, y);
    if (d < 1) { P.put(x, y, RP.sombra, 1.6 - d * 0.5 + cg(x, y, s) * 0.4); continue; }
    if (d < 1.22) P.put(x, y, B, 4.2 - (d - 1) * 7 + ((y + 0.5 - cy) > 0 ? 0.4 : -0.6) + cg(x, y, s) * 0.5);   // a borda derretida, lisa e brilhante
    else if (d < 1.5 && cn(x, y, 7, 7, s) > -0.05) P.put(x, y, C, 3 - (d - 1.22) * 3 + cg(x, y, s) * 0.5);   // a cera seca em volta
  }
  // as gotas de bronze escorridas e endurecidas embaixo do furo
  for (const [x, l] of [[cx - 6, 5], [cx - 2, 8], [cx + 3, 4], [cx + 7, 6]]) { const y0 = cy + Math.round(r * 0.95); for (let j = 0; j < l; j++) P.put(x, y0 + j, B, 4.4 - j * 0.3); P.put(x, y0 + l, B, 4.8); P.put(x + 1, y0 + l, B, 2.2); }
  if (k) for (let y = 0; y < 38; y++) for (let x = 0; x < 40; x++) { const d = hexD(x, y); if (d > 0.72 && d < 1) { const hx = (x + (Math.floor(y / 2.6) % 2) * 1.5) / 3, fy = (y / 2.6) % 1; P.put(x, y, C, (hx % 1 < 0.25 || fy < 0.25 ? 1.4 : 3) - (y - cy) * 0.05); } }
  patina(P, 0.1, s + 2, (x, y) => (hexD(x, y) < 1.6 ? -1 : 0));
  return P.done();
}
function pedestal() {   // 28 x 34: o pedestal do Cinzel de Runas: base de dois degraus, fuste de granito com a marca gravada, o berço de bronze em cima (onde o cinzel deita: o 189 desenha o cinzel)
  const P = painter(28, 34), s = 18821, G = RP.granito, B = RP.bronze, yb = 33;
  ashlar(P, 1, 28, 26, 6, G, s, 3, 13, null, 2.6); for (let x = 0; x < 28; x++) P.put(x, 27, G, 4.2 - x * 0.04);
  ashlar(P, 6, 9, 16, 18, G, s + 1, 6, 16, null, 2.7);
  for (let y = 9; y < 27; y++) { P.put(6, y, G, 3.8); P.put(21, y, G, 1.6); }
  clanMark(P, 9, 11, 10, G, s + 2, 'grava');
  P.rect(4, 6, 20, 3, G, (i, j) => 4.2 - j * 1.1 - i * 0.05 + cg(i, j, s) * 0.4);
  // o berço: uma calha de bronze com duas forquilhas
  P.rect(7, 4, 14, 2, B, (i, j) => 4 - j * 1.4 - i * 0.12);
  for (const x of [8, 19]) { P.put(x, 2, B, 4.2); P.put(x, 3, B, 3.4); P.put(x + 1, 2, B, 3); P.put(x + 1, 3, B, 2.4); P.put(x - 1, 1, B, 4); P.put(x + 2, 1, B, 2.6); }
  patina(P, 0.05, s + 3);
  chip(P, 0.25, s, [G]);
  return P.done();
}

/* =============================== registro =============================== */
const F = 'chao', C = 'teto', W = 'parede';
const def = (id, nome, apoio, camada, faixas, variantes, extra) => defProp(id, Object.assign({ nome, apoio, camada, faixas, variantes, anoes: true }, extra || {}));
const RUNE = '#7ad0f0', FORGE = '#ffa040';
const ALL = ['portoes', 'saloes', 'canais', 'forjas'];
// chão
def('an_portao_caido', 'Portão de bronze caído', F, 'frente', ['portoes'], [fallenGate(0), fallenGate(1)]);
def('an_estatua_guerreiro', 'Estátua de anão guerreiro', F, 'frente', ['portoes', 'saloes'], [warriorStatue(0), warriorStatue(1)]);
def('an_estatua_rei', 'Estátua do rei sentado', F, 'frente', ['saloes'], [kingStatue(0), kingStatue(1)], { tumulo: true });
def('an_sarcofago', 'Sarcófago de tampa rúnica', F, 'frente', ['saloes'], [sarcophagus(0), sarcophagus(1)], { tumulo: true });
def('an_mesa', 'Mesa comprida posta', F, 'frente', ['saloes'], [longTable(0), longTable(1)], { refeitorio: true });
def('an_banco', 'Banco de pedra', F, 'frente', ['saloes'], [stoneBench(0), stoneBench(1)], { refeitorio: true });
def('an_barril', 'Barril grande com torneira', F, 'frente', ['saloes'], [bigBarrel(0), bigBarrel(1)]);
def('an_beliche', 'Beliche de pedra', F, 'frente', ['saloes'], [bunk(0), bunk(1)], { dormitorio: true });
def('an_carcaca', 'Carcaça de autômato', F, 'frente', ALL, [carcass(0), carcass(1)], { carcaca: true, grade: true });
def('an_engrenagem_caida', 'Engrenagem caída', F, 'frente', ['canais'], [fallenGear(0), fallenGear(1)], { grade: true });
def('an_bomba', 'Bomba de lava', F, 'frente', ['canais'], [lavaPump(0), lavaPump(1)], { canal: true, grade: true });
{ const [cv, lit] = forgeFurnace(); def('an_fornalha', 'Fornalha de forja', F, 'frente', ['forjas'], [cv], { forja: true, firme: true, luz: [{ x: 32, y: 58, r: 1 }, { x: 32, y: 40, r: 0.5 }], brilho: FORGE, aceso: [lit], acesoA: [0.55, 0.85, 1.3], anim: { k: 'an_fogo', x: 32, y: 63, w: 7, h: 13 } }); }
{ const [cv, lit] = runeAnvil(); def('an_bigorna_runas', 'Bigorna de runas', F, 'frente', ['forjas'], [cv], { forja: true, firme: true, luz: [{ x: 23, y: 8, r: 0.7 }], brilho: RUNE, aceso: [lit], acesoA: [0.45, 0.8, 0.7] }); }
def('an_armas', 'Suporte de lâminas inacabadas', F, 'frente', ['forjas'], [bladeRack(0), bladeRack(1)]);
def('an_carrinho', 'Carrinho de minério', F, 'frente', ['portoes', 'canais'], [oreCart(0), oreCart(1)], { grade: true });
def('an_lingotes', 'Lingotes velhos', F, 'frente', ['forjas'], [ingotHeap(0), ingotHeap(1)]);
def('an_barricada', 'Barricada virada para baixo', F, 'frente', ['canais', 'forjas'], [barricade(0), barricade(1)], { grade: true });
def('an_casulo', 'Casulo de cera vazio', F, 'frente', ['forjas'], [waxCocoon(0), waxCocoon(1)]);
// teto
{ const [cv, lit] = chandelier(); def('an_lustre', 'Lustre de lâmpadas de runa', C, 'frente', ['saloes'], [cv], { firme: true, luz: [{ x: 27, y: 20, r: 0.55 }, { x: 4, y: 24, r: 0.45 }, { x: 51, y: 24, r: 0.45 }, { x: 27, y: 28, r: 0.6 }], brilho: RUNE, aceso: [lit], acesoA: [1, 1, 0] }); }
def('an_guindaste', 'Corrente de guindaste', C, 'frente', ['canais', 'forjas'], [craneChain(0), craneChain(1)]);
def('an_estandarte', 'Estandarte do clã', C, 'frente', ['portoes', 'saloes'], [clanBanner(0), clanBanner(1)]);
def('an_roldana', 'Roldana com corda', C, 'frente', ['canais'], [pulley(0), pulley(1)]);
// fundo, de pé no chão
def('an_porta_tesouro', 'Porta do tesouro arrombada', W, 'fundo', ['saloes'], [treasuryDoor()]);
def('an_engrenagem_relevo', 'Engrenagem em relevo', W, 'fundo', ['canais'], [gearWall()], { luz: [], anim: { k: 'an_engr' } });
def('an_mural', 'Mural do êxodo', W, 'fundo', ['saloes'], [exodusMural(0), exodusMural(1)]);
// fundo, na altura dos olhos
def('an_marca', 'Marca do clã', W, 'fundo', ALL, [markPlate(0), markPlate(1)], { faixaV: { portoes: [0], saloes: [0], canais: [1], forjas: [0, 1] } });
def('an_escudo', 'Escudo e machados cruzados', W, 'fundo', ['portoes', 'saloes'], [shieldAxes()]);
def('an_buraco_hex', 'Buraco hexagonal derretido', W, 'fundo', ['forjas'], [hexHole(0), hexHole(1)]);
// só na Oficina do Mestre
def('an_pedestal', 'Pedestal do Cinzel', F, 'frente', ['forjas'], [pedestal()], { oficina: true, topo: { x: 14, y: 3 } });

// o que cada faixa ganha, por trecho aberto de chão ou de teto: [id, chance por 10 blocos, máximo por trecho]
// (os de bandeira de sala, AN_ROOM_ONLY, estão aqui só para constar: o passeio os pula e anRoomProps os põe)
Object.assign(AN_PROP_PLAN, {
  portoes: { chao: [['an_portao_caido', 0.04, 1], ['an_estatua_guerreiro', 0.08, 1], ['an_carcaca', 0.08, 1], ['an_carrinho', 0.07, 1]], teto: [['an_estandarte', 0.12, 2]], fundo: [['an_marca', 0.1, 1], ['an_escudo', 0.1, 2]] },
  saloes: { chao: [['an_estatua_guerreiro', 0.06, 1], ['an_carcaca', 0.06, 1], ['an_barril', 0.06, 1], ['an_estatua_rei', 0, 0], ['an_sarcofago', 0, 0], ['an_mesa', 0, 0], ['an_banco', 0, 0], ['an_beliche', 0, 0]], teto: [['an_lustre', 0.12, 2], ['an_estandarte', 0.1, 2]], fundo: [['an_mural', 0.04, 1], ['an_porta_tesouro', 0.03, 1], ['an_marca', 0.08, 1], ['an_escudo', 0.1, 2]] },
  canais: { chao: [['an_carcaca', 0.06, 1], ['an_engrenagem_caida', 0.05, 1], ['an_bomba', 0.12, 1], ['an_carrinho', 0.06, 1], ['an_barricada', 0.07, 1]], teto: [['an_guindaste', 0.1, 1], ['an_roldana', 0.12, 2]], fundo: [['an_engrenagem_relevo', 0.05, 1], ['an_marca', 0.06, 1]] },
  forjas: { chao: [['an_carcaca', 0.05, 1], ['an_armas', 0.07, 1], ['an_lingotes', 0.08, 1], ['an_barricada', 0.06, 1], ['an_casulo', 0.06, 1], ['an_fornalha', 0, 0], ['an_bigorna_runas', 0, 0]], teto: [['an_guindaste', 0.12, 2]], fundo: [['an_buraco_hex', 0.06, 1], ['an_marca', 0.06, 1]] }
});
}

/* ---------- a luz firme: o lustre, a fornalha e a bigorna não tremem ----------
   O drawPropGlows do 45 multiplica todo brilho pelo `fl` que treme (o das velas). Os objetos `firme` saem da lista dele
   e são desenhados aqui com fl = 1 (listas de rascunho fixas: nada alocado por quadro). */
const anVisKeep = [], anVisFirm = [], anFirmGlow = {};
{ const _dg = drawPropGlows; drawPropGlows = function (cx, cy, fl) {
  let firm = false;
  for (let i = 0; i < visProps.length; i++) if (visProps[i].def.firme) { firm = true; break; }
  if (!firm) return _dg(cx, cy, fl);
  anVisKeep.length = 0; anVisFirm.length = 0;
  for (let i = 0; i < visProps.length; i++) { const p = visProps[i]; anVisKeep.push(p); if (p.def.firme) anVisFirm.push(p); }
  visProps.length = 0; for (let i = 0; i < anVisKeep.length; i++) if (!anVisKeep[i].def.firme) visProps.push(anVisKeep[i]);
  try { _dg(cx, cy, fl); } finally { visProps.length = 0; for (let i = 0; i < anVisKeep.length; i++) visProps.push(anVisKeep[i]); }
  for (let i = 0; i < anVisFirm.length; i++) {
    const p = anVisFirm[i], g = anFirmGlow[p.def.brilho] || (anFirmGlow[p.def.brilho] = glow(30, p.def.brilho));
    for (const L of p.def.luz) { lc.globalAlpha = 0.24 * L.r; lc.drawImage(g, Math.round(p.X + p.sh + L.x - cx - 30), Math.round(p.Y + L.y - cy - 32)); }
  }
}; }

/* ---------- a engrenagem em relevo gira: logo depois dos pedaços do mundo (a luz escurece junto, os monstros passam
   na frente). Um quadro a cada 0,22 s: um dente da roda grande a cada 2,2 s ---------- */
{ const _dc = drawChunks; drawChunks = function (cx, cy) {
  _dc(cx, cy);
  if (!anGearFrames.length || typeof visProps === 'undefined') return;
  const f = anGearFrames[Math.floor(gameTime / 0.22) % anGearFrames.length];
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || A.k !== 'an_engr' || p.gone) continue;
    lc.drawImage(f, Math.round(p.X + p.sh - cx), Math.round(p.Y - cy));
  }
}; }

/* ---------- a fornalha: o brilho que respira de leve, as línguas de fogo na boca, uma faísca às vezes; e a camada
   `aceso` (o carvão, as runas da bigorna, as lâmpadas do lustre) por cima do escuro ---------- */
let anFireGlow = null;
HOOK.drawGlow.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], A = p.def.anim; if (!A || A.k !== 'an_fogo') continue;
    if (!anFireGlow) anFireGlow = glow(30, '#ff7a20');
    lc.globalAlpha = 0.34 + Math.sin(gameTime * 2.1 + p.X) * 0.04; lc.drawImage(anFireGlow, Math.round(p.X + p.sh + A.x - cx - 30), Math.round(p.Y + A.y - cy - 34));
  }
});
HOOK.drawTop.push((cx, cy) => {
  if (typeof visProps === 'undefined') return;
  for (let i = 0; i < visProps.length; i++) {
    const p = visProps[i], D = p.def;
    if (D.aceso) {
      const cv = D.aceso[p.v] || D.aceso[0], a = D.acesoA || [1, 1, 0];
      lc.globalAlpha = a[0] + (a[1] - a[0]) * (0.5 + 0.5 * Math.sin(gameTime * a[2] + p.X * 0.01));
      lc.drawImage(cv, Math.round(p.X + p.sh - cx), Math.round(p.Y - cy));
    }
    const A = D.anim; if (!A || A.k !== 'an_fogo') continue;
    lc.globalAlpha = 1;
    const X = Math.round(p.X + p.sh + A.x - cx), Y = Math.round(p.Y + A.y - cy);
    for (let k = -A.w; k <= A.w; k++) {
      const e = 1 - Math.abs(k) / (A.w + 1), h = Math.round(A.h * e * (0.55 + 0.45 * Math.abs(Math.sin(gameTime * 6 + k * 1.7 + p.X * 0.1))) + Math.sin(gameTime * 11 + k) * 1.1);
      if (h < 1) continue;
      lc.fillStyle = '#b8400a'; lc.fillRect(X + k, Y - h, 1, h);
      lc.fillStyle = '#e8700e'; lc.fillRect(X + k, Y - Math.round(h * 0.75), 1, Math.round(h * 0.75));
      if (Math.abs(k) < A.w * 0.6) { lc.fillStyle = '#ffa62a'; lc.fillRect(X + k, Y - Math.round(h * 0.45), 1, Math.round(h * 0.45)); }
      if (Math.abs(k) < 2) { lc.fillStyle = '#ffe08a'; lc.fillRect(X + k, Y - Math.round(h * 0.2), 1, Math.round(h * 0.2)); }
    }
    // uma faísca que sai da boca e sobe pela coifa
    const sp = (gameTime * 0.9 + p.X * 0.01) % 1; if (sp < 0.6) { lc.fillStyle = '#ffd070'; lc.fillRect(X + Math.round(Math.sin(sp * 7 + p.X) * 4), Y - A.h - Math.round(sp * 22), 1, 1); }
  }
  lc.globalAlpha = 1;
});

/* ---------- quebrar um objeto (a carcaça): três golpes de arma; quebrada, some com faíscas e não acorda mais ---------- */
function anBreakProp(p) {
  if (!p || p.gone) return;
  p.gone = true; propGone.add(p.key); propDirty(p);
  burst(p.X + p.w / 2, p.Y + p.h / 2, 16, '#c49448', 80, 300, 0.6); burst(p.X + p.w / 2, p.Y + p.h * 0.4, 8, '#ffd070', 110, 200, 0.3, 1, true);
  if (sfx.slam) sfx.slam();
}
{ const _bs = bladeSweep; bladeSweep = function () {
  const pts = _bs.apply(this, arguments);
  if (!pl.atkHit || !pts.length || !ANOES || !inAnoes(Math.floor(pl.y / T))) return pts;
  const x0 = Math.floor((pl.x - 60) / (CH * T)), x1 = Math.floor((pl.x + 60) / (CH * T)), r = Math.floor(pl.y / (CH * T));
  for (let rr = r - 1; rr <= r + 1; rr++) for (let c = x0; c <= x1; c++) {
    const list = propBuckets.get(rr * 64 + ((c % Math.ceil(WW / CH)) + Math.ceil(WW / CH)) % Math.ceil(WW / CH)); if (!list) continue;
    for (const p of list) {
      if (p.gone || !p.def.carcaca || pl.atkHit.has(p)) continue;
      const sh = Math.round((pl.x - p.X - p.w / 2) / (WW * T)) * WW * T, X = p.X + sh;
      if (!pts.some(q => q[0] >= X + 3 && q[0] <= X + p.w - 3 && q[1] >= p.Y + 4 && q[1] <= p.Y + p.h)) continue;
      pl.atkHit.add(p); p.anHits = (p.anHits || 0) + 1;
      burst(X + p.w / 2, p.Y + p.h * 0.45, 6, '#ffc060', 90, 300, 0.25, 1, true); if (sfx.block) sfx.block(); shake(1);
      if (p.anHits >= 3) anBreakProp(p);
    }
  }
  return pts;
}; }

/* ---------- para o 185 ---------- */
// um retângulo em pixels pisa num objeto já posto (front: a camada da frente; false: a do fundo)?
function anPropClash(X, Y, w, h, front) {
  const S = CH * T, NC = Math.ceil(WW / CH), c0 = Math.floor(X / S), c1 = Math.floor((X + w - 1) / S), r0 = Math.floor(Y / S), r1 = Math.floor((Y + h - 1) / S);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const list = propBuckets.get(r * 64 + ((c % NC) + NC) % NC); if (!list) continue;
    for (const p of list) if (!p.gone && p.front === front && X < p.X + p.w && X + w > p.X && Y < p.Y + p.h && Y + h > p.Y) return true;
  }
  return false;
}
// há lava (ou a grade de um canal) a até 3 blocos dos lados ou embaixo deste pedaço de chão?
function anNearLava(px, fy, tw) {
  for (let y = fy - 1; y <= fy + 2; y++) for (let x = px - 3; x < px + tw + 3; x++) { const t = tileAt(x, y); if (t === LAVA || t === AN_GRADE || t === AN_CANAL) return true; }
  return false;
}

/* ---------- as salas especiais: o que cada uma tem, posto pelo 185 com o terreno pronto ----------
   kind: 'muralha', 'guarita', 'salao', 'refeitorio', 'dormitorio', 'tumulo', 'sala_canal', 'maquinas', 'forja', 'oficina'.
   x0: a primeira coluna de ar da sala; fy: a fileira do chão (sólida, debaixo do ar); w: a largura de ar; R: o sorteio
   (mulberry32); used: o mapa de ocupação do passeio do 185 (Uint8Array WW * WH * 2, [frente, fundo] por célula),
   que é lido e marcado aqui (opcional). Só em chão firme, com ar em cima e parede de fundo; nunca nas células de anKeep; não pisa em objeto
   já posto. Devolve os objetos postos. */
function anRoomProps(kind, x0, fy, w, R, used) {
  R = R || Math.random;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), placed = [];
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && (typeof AN_SOILS === 'undefined' || AN_SOILS[t]) && t !== AN_GRADE && t !== AN_COMPORTA && t !== AN_BARREIRA && t !== AN_PEDRA_QUENTE; };
  // decoração solta de 1 bloco (lâmpada, braseiro, runa no piso, elmo, quitina...) pode sair para dar lugar ao objeto da
  // sala; escada, corrente, alavanca e lava nunca
  const soft = t => t !== AIR && !SOLID[t] && t !== LAVA && t !== AN_ESCADA && t !== AN_CORRENTE && t !== AN_ALAVANCA && t !== CHAIN && t !== TORCH;
  const fits = (px, y0, tw, th, needAir, layer) => {
    if (y0 < 2 || y0 + th >= WH - 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = px; x < px + tw; x++) { const i = I(x, y), t = tiles[i]; if (SOLID[t] || (needAir && t !== AIR && !soft(t)) || !walls[i] || anKeep.has(i) || (used && used[i * 2 + layer])) return false; }
    return true;
  };
  const clearSoft = (px, y0, tw, th) => { for (let y = y0; y < y0 + th; y++) for (let x = px; x < px + tw; x++) { const i = I(x, y); if (soft(tiles[i])) tiles[i] = AIR; } };
  const mark = (px, y0, tw, th, layer) => { if (used) for (let y = y0; y < y0 + th; y++) for (let x = px; x < px + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const vOf = (def, v) => v !== undefined ? v : (R() * def.vars.length) | 0;
  // no chão (frente, ou peça do fundo de pé no chão), procurando até 3 colunas para cada lado de x
  const floor = (id, x, v, spread = 3) => {
    const def = PROP_DEFS[id]; if (!def) return null;
    v = vOf(def, v); const V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T), front = def.camada !== 'fundo';
    for (let dx = 0; dx <= spread; dx++) for (const sg of [1, -1]) {
      const px = Math.round(x) + dx * sg; if (px < x0 - 1 || px + tw > x0 + w + 1) continue;
      let ok = true; for (let k = px; k < px + tw; k++) if (!soil(k, fy) && !((def.canal || def.grade) && (tiles[I(k, fy)] === AN_GRADE || tiles[I(k, fy)] === AN_CANAL))) ok = false;
      if (!ok || !fits(px, fy - th, tw, th, front, front ? 0 : 1)) continue;
      const X = W1(px) * T + ((tw * T - V.w) >> 1), Y = fy * T - V.h;
      if (anPropClash(X, Y, V.w, V.h, front)) continue;
      if (def.canal && !anNearLava(px, fy, tw)) continue;
      mark(px, fy - th, tw, th, front ? 0 : 1); if (front) clearSoft(px, fy - th, tw, th);
      const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, fy));
      const p = addProp(def, v, X, Y, sup); placed.push(p); return p;
    }
    return null;
  };
  // pendurado do teto: a primeira fileira sólida acima do ar, a mesma em toda a largura, 3 blocos livres embaixo
  const ceil = (id, x, v) => {
    const def = PROP_DEFS[id]; if (!def) return null;
    v = vOf(def, v); const V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
    for (let dx = 0; dx <= 3; dx++) for (const sg of [1, -1]) {
      const px = Math.round(x) + dx * sg; if (px < x0 || px + tw > x0 + w) continue;
      let cy = fy - 1; while (cy > fy - 40 && !SOLID[tiles[I(px, cy - 1)]]) cy--;
      let ok = cy > fy - 40; for (let k = px; ok && k < px + tw; k++) if (!soil(k, cy - 1)) ok = false;
      if (!ok || cy + th + 3 > fy || !fits(px, cy, tw, th + 3, true, 0)) continue;
      const X = W1(px) * T + ((tw * T - V.w) >> 1), Y = cy * T;
      if (anPropClash(X, Y, V.w, V.h, true)) continue;
      mark(px, cy, tw, th, 0); clearSoft(px, cy, tw, th);
      const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, cy - 1));
      const p = addProp(def, v, X, Y, sup); placed.push(p); return p;
    }
    return null;
  };
  // na parede do fundo, na altura dos olhos (up: quantos blocos acima do normal)
  const wall = (id, x, v, up = 0) => {
    const def = PROP_DEFS[id]; if (!def) return null;
    v = vOf(def, v); const V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
    for (let dx = 0; dx <= 3; dx++) for (const sg of [1, -1]) {
      const px = Math.round(x) + dx * sg, y0 = fy - 1 - th - up; if (px < x0 || px + tw > x0 + w) continue;
      if (!fits(px, y0, tw, th, false, 1)) continue;
      const X = W1(px) * T + ((tw * T - V.w) >> 1), Y = y0 * T + ((th * T - V.h) >> 1);
      if (anPropClash(X, Y, V.w, V.h, false)) continue;
      mark(px, y0, tw, th, 1);
      const p = addProp(def, v, X, Y, []); placed.push(p); return p;
    }
    return null;
  };
  const tw = id => { const d = PROP_DEFS[id]; return d ? Math.ceil(d.vars[0].w / T) : 1; };
  const cx = x0 + w / 2, rx = () => x0 + 1 + R() * Math.max(1, w - 4);
  switch (kind) {
    case 'muralha':   // o portão caído no meio, as estátuas de guarda dos lados, carcaças, um carrinho; estandartes, a marca e os escudos
      floor('an_portao_caido', cx - tw('an_portao_caido') / 2);
      floor('an_estatua_guerreiro', x0 + 2, 0); floor('an_estatua_guerreiro', x0 + w - 5, R() < 0.3 ? 1 : 0);
      floor('an_carcaca', rx()); if (w > 36) floor('an_carcaca', rx());
      if (R() < 0.6) floor('an_carrinho', rx());
      ceil('an_estandarte', x0 + 5); ceil('an_estandarte', x0 + w - 8);
      wall('an_marca', cx - 1, undefined, 4); wall('an_escudo', x0 + w * 0.25); wall('an_escudo', x0 + w * 0.7);
      break;
    case 'guarita':   // pequena: uma carcaça de guarda, um banco, a marca
      floor('an_carcaca', x0 + 1 + R() * (w - 4)); floor('an_banco', x0 + w - 4);
      wall(R() < 0.5 ? 'an_marca' : 'an_escudo', x0 + 2);
      break;
    case 'salao': {   // os grandes salões: o mural no meio, estátuas aos pares, a porta do tesouro numa ponta às vezes, lustres
      floor('an_mural', cx - tw('an_mural') / 2, undefined, w >> 2);
      floor('an_estatua_guerreiro', cx - tw('an_mural') / 2 - 4, 0); floor('an_estatua_guerreiro', cx + tw('an_mural') / 2 + 1, 0);
      if (R() < 0.35) floor('an_porta_tesouro', R() < 0.5 ? x0 + 1 : x0 + w - 8);
      floor('an_carcaca', rx()); if (w > 44) floor('an_carcaca', rx());
      if (R() < 0.5) floor('an_barril', rx());
      for (let k = 0, n = Math.max(2, Math.floor(w / 16)); k < n; k++) ceil('an_lustre', x0 + (k + 0.5) * w / n - 2);
      ceil('an_estandarte', x0 + 2); ceil('an_estandarte', x0 + w - 5);
      wall('an_marca', x0 + 3); wall('an_escudo', x0 + w - 6);
      break;
    }
    case 'refeitorio': {   // a mesa posta com um banco em cada ponta (duas se couber), o barril, o lustre
      const mw = tw('an_mesa'), bw = tw('an_banco'), unit = mw + bw * 2 + 1, n = Math.max(1, Math.min(2, Math.floor((w - 3) / unit)));
      for (let k = 0; k < n; k++) { const ux = x0 + 1 + k * unit; floor('an_banco', ux, undefined, 1); floor('an_mesa', ux + bw, R() < 0.35 ? 1 : 0, 1); floor('an_banco', ux + bw + mw, undefined, 1); }
      floor('an_barril', x0 + w - 4);
      ceil('an_lustre', cx - 2);
      wall('an_marca', x0 + 1, undefined, 1);
      break;
    }
    case 'dormitorio': {   // os beliches em fileira
      const bw = tw('an_beliche') + 1;
      for (let x = x0; x + bw - 1 <= x0 + w; x += bw) floor('an_beliche', x, R() < 0.3 ? 1 : 0, 0);
      if (R() < 0.5) wall('an_escudo', x0 + 1, undefined, 0);
      break;
    }
    case 'tumulo': {   // o rei no meio, sob a marca; um sarcófago de cada lado; estandartes
      const kw = tw('an_estatua_rei');
      floor('an_estatua_rei', cx - kw / 2, undefined, w >> 1);
      floor('an_sarcofago', x0 + 1, undefined, 4); floor('an_sarcofago', x0 + w - 1 - tw('an_sarcofago'), R() < 0.4 ? 1 : 0, 4);
      wall('an_marca', cx - 1, 0, 5);
      ceil('an_estandarte', x0 + 1); ceil('an_estandarte', x0 + w - 4);
      break;
    }
    case 'sala_canal': {   // as bombas na beira do canal, roldanas e o guindaste por cima, uma engrenagem caída, uma barricada
      const pw = tw('an_bomba');
      for (const C of (typeof anChannels !== 'undefined' ? anChannels : [])) {
        if (Math.abs(C.y - fy) > 2 || wdx(C.x1 - x0) < -2 || wdx(C.x0 - (x0 + w)) > 2) continue;
        floor('an_bomba', Math.max(x0, C.x0 - pw - 1), undefined, 3); if (R() < 0.6) floor('an_bomba', Math.min(x0 + w - pw, C.x1 + 2), undefined, 3);
      }
      if (!placed.some(p => p.def.id === 'an_bomba')) for (let x = x0; x < x0 + w - pw; x += 3) if (anNearLava(x, fy, pw) && floor('an_bomba', x, undefined, 0)) break;
      ceil('an_roldana', x0 + w * 0.3); ceil('an_roldana', x0 + w * 0.7); ceil('an_guindaste', cx);
      if (R() < 0.5) floor('an_engrenagem_caida', rx(), undefined, 6); if (R() < 0.5) floor('an_barricada', rx(), undefined, 8);
      floor('an_carcaca', rx()); if (R() < 0.5) floor('an_carrinho', rx());
      wall('an_marca', x0 + 2);
      break;
    }
    case 'maquinas':   // as engrenagens em relevo na parede, uma caída, roldana e guindaste
      floor('an_engrenagem_relevo', x0 + 1 + R() * Math.max(0, w - 8), undefined, w);
      if (w >= 20 && R() < 0.5) floor('an_engrenagem_relevo', x0 + w - 7);
      floor('an_engrenagem_caida', rx(), R() < 0.5 ? 0 : 1);
      floor('an_carcaca', rx());
      ceil('an_roldana', x0 + 2); ceil('an_guindaste', x0 + w - 4);
      break;
    case 'forja': {   // a fornalha numa ponta, a bigorna de runas ao lado, o suporte de lâminas, os lingotes, o guindaste
      const left = R() < 0.5, fw = tw('an_fornalha');
      floor('an_fornalha', left ? x0 + 1 : x0 + w - 1 - fw, undefined, w);
      floor('an_bigorna_runas', left ? x0 + fw + 3 : x0 + w - fw - 8, undefined, w);
      floor('an_armas', left ? x0 + w - 5 : x0 + 1); floor('an_lingotes', rx());
      if (R() < 0.4) floor('an_carcaca', rx()); if (R() < 0.3) floor('an_casulo', rx());
      ceil('an_guindaste', cx); if (w > 26) ceil('an_guindaste', left ? x0 + w - 6 : x0 + 4);
      wall('an_marca', cx, undefined, 3); if (R() < 0.4) wall('an_buraco_hex', left ? x0 + w - 6 : x0 + 2);
      break;
    }
    case 'oficina': {   // o pedestal do Cinzel no meio, a marca do clã logo acima dele; a bancada do mestre em volta
      const pw = tw('an_pedestal'), ped = floor('an_pedestal', cx - pw / 2, 0, 1);
      if (ped) { const mk2 = PROP_DEFS.an_marca, V = mk2 && mk2.vars[0]; if (V) { const mx = Math.floor((ped.X + ped.w / 2) / T - Math.ceil(V.w / T) / 2); wall('an_marca', mx, 0, Math.ceil(ped.h / T)); } }
      floor('an_bigorna_runas', x0 + 2, undefined, 2); floor('an_armas', x0 + w - 5, 0); floor('an_lingotes', rx());
      ceil('an_lustre', cx - 2);
      break;
    }
  }
  return placed;
}
