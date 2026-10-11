'use strict';

/* ================= a Cidade dos Antigos: a gravidade virada e as Salas de Prumo =================
   Ficha 13, seção 13. A gravidade só vira dentro dos retângulos de AT_GRAV (290): a arena do Arquiteto (30 x 30) e o
   miolo das Salas de Prumo (12 x 12). Os dois são quadrados de propósito, e é isso que deixa o truque simples: virar a
   gravidade é girar a sala inteira em volta do centro dela, com o herói, os monstros, os itens e os tiros dentro. Depois
   do giro o "baixo" do jogo continua sendo o baixo da tela, então andar, pular, escada, ataque, escudo e mineração
   seguem iguais, sem um caso novo em lugar nenhum.
   O que o herói vê: a câmera gira junto (0,6 s, em volta dele). No começo do giro a tela mostra a sala do jeito que
   estava; no fim, o lado que virou chão está embaixo. Ex.: a gravidade vai para a esquerda = a sala gira 90° no sentido
   anti-horário (a parede da esquerda desce e vira chão) e a câmera sai de +90° e volta a 0.
   R.dir guarda para onde a gravidade aponta naquela sala (0 baixo, 1 esquerda, 2 cima, 3 direita), em relação ao
   desenho original da sala.
   As Salas de Prumo: 6 modelos de miolo com simetria de giro (a sala é igual nas 4 gravidades, só o veio de ferro
   estelar muda de lugar), conferidos aqui com a busca que simula o pulo: da porta se chega ao Prumo, de todo lugar onde
   se pode cair se volta ao Prumo, e o veio só fica ao alcance com a sala de cabeça para baixo. Golpear o Prumo vira a
   gravidade 90° no sentido do relógio, com 1 s de aviso (o peso balança e as setas giram).
   O save: os blocos de uma Sala de Prumo girada vão nos diffs como qualquer bloco mudado, e a direção de cada sala vai
   em `atPrumo`. A arena é do 297 (os blocos dela nunca vão para o save). */

/* ---------- o giro de um retângulo quadrado: q quartos de volta no sentido do relógio (o conteúdo) ---------- */
const atCam = { a: 0, t: 1, from: 0, big: false, VW0: 0, VH0: 0 };   // o ângulo da câmera agora e a animação dele
const AT_TURN = 0.6;
// gira em volta do centro do retângulo um ponto do mundo (px) q quartos no sentido do relógio
function atRotPt(R, x, y, q) {
  const cx = (R.x0 + R.w / 2) * T, cy = (R.y0 + R.h / 2) * T;
  let dx = wdx((x - cx) / T) * T, dy = y - cy;
  for (let k = 0; k < q; k++) { const nx = -dy; dy = dx; dx = nx; }
  return [cx + dx, cy + dy];
}
const atRotV = (vx, vy, q) => { for (let k = 0; k < q; k++) { const n = -vy; vy = vx; vx = n; } return [vx, vy]; };
const atInRect = (R, x, y) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); return wdx(tx - R.x0) >= 0 && wdx(tx - R.x0) < R.w && ty >= R.y0 && ty < R.y0 + R.h; };
// acha o vão livre mais perto (o herói ou um monstro de w x h px) se o giro o deixou dentro da rocha
function atUnstick(e, R) {
  const free = (x, y) => { for (let ty = Math.floor(y / T); ty <= Math.floor((y + e.h - 1) / T); ty++) for (let tx = Math.floor(x / T); tx <= Math.floor((x + e.w - 1) / T); tx++) if (SOLID[tileAt(tx, ty)]) return false; return true; };
  if (free(e.x, e.y)) return;
  for (let r = 1; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = Math.floor(e.x / T + dx) * T + ((T - e.w) >> 1), y = Math.floor((e.y + e.h) / T + dy) * T - e.h;
    if (R && !atInRect(R, x + e.w / 2, y + e.h / 2)) continue;
    if (free(x, y)) { e.x = x; e.y = y; return; }
  }
}
// gira o retângulo: blocos, paredes, herói, monstros, itens, orbes e tiros; o 297 passa noSave na arena
function atRotRect(R, q, opt = {}) {
  q = ((q % 4) + 4) % 4; if (!q) return;
  const n = R.w, W1 = x => ((x % WW) + WW) % WW, I = (c, r) => (R.y0 + r) * WW + W1(R.x0 + c);
  const ot = new Uint16Array(n * n), ow = new Uint8Array(n * n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const i = I(c, r); ot[r * n + c] = tiles[i]; ow[r * n + c] = walls[i]; }
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    let rr = r, cc = c; for (let k = 0; k < q; k++) { const nr = cc; cc = n - 1 - rr; rr = nr; }
    const i = I(cc, rr), t = ot[r * n + c];
    tiles[i] = t; walls[i] = ow[r * n + c];
    if (agua.length) agua[i] = 0;
    if (opt.noSave) diffs.delete(i); else diffs.set(i, t);
  }
  for (let r = -1; r <= n; r += 1) for (let c = -1; c <= n; c += 4) markDirty(W1(R.x0 + c), R.y0 + r);
  for (let r = -1; r <= n; r += 4) for (let c = -1; c <= n; c++) markDirty(W1(R.x0 + c), R.y0 + r);
  if (typeof mapVer !== 'undefined') mapVer++;
  const turnE = e => {
    const [x, y] = atRotPt(R, e.x + e.w / 2, e.y + e.h / 2, q); e.x = x - e.w / 2; e.y = y - e.h / 2;
    const [vx, vy] = atRotV(e.vx || 0, e.vy || 0, q); e.vx = vx; e.vy = vy; e.onGround = false;
  };
  if (pl && !pl.dead && atInRect(R, pl.x + pl.w / 2, pl.y + pl.h / 2)) { turnE(pl); atUnstick(pl, R); pl.climb = false; atCamTurn(q); }
  for (const e of enemies) if (!e.dead && atInRect(R, e.x + e.w / 2, e.y + e.h / 2) && !(opt.skip && opt.skip(e))) { turnE(e); atUnstick(e, R); }
  for (const L of [loot, orbs, projs]) for (const o of L) if (atInRect(R, o.x, o.y)) { const [x, y] = atRotPt(R, o.x, o.y, q); o.x = x; o.y = y; if ('vx' in o) { const [vx, vy] = atRotV(o.vx, o.vy, q); o.vx = vx; o.vy = vy; } o.rest = false; }
  // a direção da gravidade é a inversa do giro do conteúdo: girar no sentido anti-horário (q = 3) leva a gravidade
  // um passo no sentido do relógio (baixo -> esquerda -> cima -> direita)
  R.dir = (R.dir + (4 - q)) % 4;
}

/* ---------- a câmera girando ----------
   Só durante o giro (0,6 s). Para não aparecer canto vazio, a imagem do mundo é desenhada num quadro quadrado maior
   (a diagonal da tela) e depois girada em volta do herói; os textos voando e as etiquetas seguem sem girar. */
function atCamTurn(q) { atCam.from = q === 2 ? Math.PI : -q * Math.PI / 2; if (atCam.from < -Math.PI) atCam.from += 2 * Math.PI; atCam.t = 0; atCam.a = atCam.from; }
function atCamBig(on) {
  if (on === atCam.big) return;
  if (on) { atCam.VW0 = VW; atCam.VH0 = VH; const D = Math.ceil(Math.hypot(VW, VH)) + 2; VW = VH = D; }
  else { VW = atCam.VW0; VH = atCam.VH0; }
  low.width = VW; low.height = VH; lc.imageSmoothingEnabled = false; atCam.big = on;
  updateCamera(0);
}
HOOK.update.push(dt => {
  if (atCam.t < 1) { atCam.t = Math.min(1, atCam.t + dt / AT_TURN); const k = atCam.t, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; atCam.a = atCam.from * (1 - e); }
  else atCam.a = 0;
});
{
  const _di = sc.drawImage.bind(sc);
  let rotOn = false;
  sc.drawImage = function (img, ...a) {
    if (img !== low || !rotOn) return _di(img, ...a);
    const W = atCam.VW0 * S, H = atCam.VH0 * S, D = VW * S;
    sc.save(); sc.translate(W / 2, H / 2); sc.rotate(atCam.a); _di(low, -D / 2, -VH * S / 2, D, VH * S); sc.restore();
    // o que vem depois (textos, etiquetas) usa a câmera do quadro grande: puxa de volta para a tela
    sc.setTransform(1, 0, 0, 1, -(VW - atCam.VW0) * S / 2, -(VH - atCam.VH0) * S / 2);
  };
  const _r = render;
  render = function () {
    if (atCam.big && VW !== VH) atCam.big = false;   // a janela mudou de tamanho no meio do giro: o resize já refez o quadro
    const want = Math.abs(atCam.a) > 0.002 && state === 'play' && !mapOpen;
    if (want !== atCam.big) atCamBig(want);
    rotOn = want;
    try { _r(); } finally { if (rotOn) sc.setTransform(1, 0, 0, 1, 0, 0); rotOn = false; }
  };
}
{ const _mw = mouseWorld; mouseWorld = function () {
  if (!atCam.big) return _mw();
  // o mouse da tela pequena, desgirado em volta do centro, no quadro grande
  const [mx, my] = mouseLow(), dx = mx - atCam.VW0 / 2, dy = my - atCam.VH0 / 2, c = Math.cos(-atCam.a), s = Math.sin(-atCam.a);
  return [Math.round(VW / 2 + dx * c - dy * s) + Math.round(cam.x), Math.round(VH / 2 + dx * s + dy * c) + Math.round(cam.y)];
}; }

/* ---------- as Salas de Prumo: os 6 modelos ----------
   Um modelo é o quarto de cima à esquerda (6 x 6) repetido girado nos outros três quartos: a sala fica igual nas 4
   gravidades. O centro (2 x 2) é sempre o pedestal do Prumo. A semente é fixa: os 6 modelos são sempre os mesmos. */
const AT_PN = 12;
function atPrumoGrid(q6) {
  const g = new Uint8Array(AT_PN * AT_PN), n = AT_PN;
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (q6[r * 6 + c]) { g[r * n + c] = 1; g[c * n + (n - 1 - r)] = 1; g[(n - 1 - r) * n + (n - 1 - c)] = 1; g[(n - 1 - c) * n + r] = 1; }
  return g;
}
// a busca do pulo (como a do atClimbFix): o herói ocupa 1 x 3 e sobe 3 blocos no pulo (43 px, T = 12); devolve onde ele consegue ficar
function atPrumoReach(g, sx, sy) {
  const n = AT_PN, S = (x, y) => x < 0 || x >= n || y < 0 || y >= n || g[y * n + x] === 1, ok = (x, y) => !S(x, y) && !S(x, y - 1) && !S(x, y - 2);
  const seen = new Uint8Array(n * n * 5), at = new Uint8Array(n * n), q = [];
  const push = (x, y, r) => { if (!ok(x, y)) return; if (S(x, y + 1)) r = 4; const k = (y * n + x) * 5 + r; if (seen[k]) return; seen[k] = 1; at[y * n + x] = 1; q.push(x, y, r); };
  let y = sy; while (y < n - 1 && !S(sx, y + 1)) y++; push(sx, y, 4);
  while (q.length) {
    const r = q.pop(), yy = q.pop(), x = q.pop(), gr = S(x, yy + 1);
    push(x - 1, yy, r === 4 && !gr ? 0 : r); push(x + 1, yy, r === 4 && !gr ? 0 : r);
    if (r > 0) push(x, yy - 1, r === 4 ? 2 : r - 1);
    if (!gr) push(x, yy + 1, 0);
  }
  return at;
}
// os 6 quartos (6 linhas de 6, 1 = laje), achados com uma busca fora do jogo (a mesma do atPrumoReach) e conferidos: da porta se chega ao pedestal, de todo
// lugar de pé se volta a ele, e existe um canto que só fica ao alcance com outra gravidade
const AT_PRUMO_Q = [
  '000001/100011/000000/000000/000100/000001',
  '000000/100010/000000/000000/000100/000001',
  '000011/000010/100000/000000/000100/000001',
  '000100/000010/100000/000000/000100/000001',
  '000011/100011/000000/000000/000100/000001',
  '000000/100010/100000/000000/000100/000001'
];
const AT_PRUMO_MODELS = AT_PRUMO_Q.map(str => {
  const n = AT_PN, q6 = Uint8Array.from(str.replace(/\//g, ''), ch => +ch), g = atPrumoGrid(q6);
  const fromDoor = atPrumoReach(g, 0, 11), fromTop = atPrumoReach(g, 5, 4), stand = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (fromTop[y * n + x] || fromDoor[y * n + x]) stand.push([x, y - 1]);
  const dist = (x, y) => Math.min(...stand.map(([a, b]) => Math.hypot(a - x, b - y)));
  // o veio: longe (mais de 4,8 blocos) de todo lugar de pé com a sala em pé, e a até 3,8 de algum com a sala girada
  const ok = (x, y) => x >= 0 && x < n && y >= 0 && y < n && !(x >= 4 && x <= 7 && y >= 4 && y <= 7) && dist(x, y) > 4.8 && [[n - 1 - y, x], [n - 1 - x, n - 1 - y], [y, n - 1 - x]].some(([a, b]) => dist(a, b) <= 3.8);
  const cells = [];
  for (let y = 0; y < n && !cells.length; y++) for (let x = 0; x < n && !cells.length; x++) if (ok(x, y)) cells.push([x, y]);
  if (cells.length) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = cells[0][0] + dx, y = cells[0][1] + dy; if (cells.length < 3 && ok(x, y)) cells.push([x, y]); }
  return { g, vein: cells };
});

/* ---------- vestir as Salas de Prumo (depois do atAfter, antes da subida garantida) ---------- */
function atPrumoDress() {
  const W1 = x => ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), n = AT_PN;
  if (!AT_PRUMO_MODELS.length) return;
  for (let k = 0; k < atPrumos.length; k++) {
    const P = atPrumos[k], M = AT_PRUMO_MODELS[(hash2(P.x0, P.y0, seed ^ 0x7f1) * AT_PRUMO_MODELS.length) | 0], mir = P.door.side > 0;
    P.model = AT_PRUMO_MODELS.indexOf(M); P.rot = 0;
    const X = c => mir ? n - 1 - c : c;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = I(P.x0 + 1 + X(c), P.y0 + 1 + r), s = M.g[r * n + c];
      tiles[i] = s ? AT_LADRILHO : AIR; walls[i] = WAT_LAJE; atKeep.add(i);
    }
    for (const [c, r] of M.vein) tiles[I(P.x0 + 1 + X(c), P.y0 + 1 + r)] = AT_O_ESTELAR;
    // o pedestal: 2 x 2 de laje de glifo no meio
    for (let r = 5; r <= 6; r++) for (let c = 5; c <= 6; c++) tiles[I(P.x0 + 1 + c, P.y0 + 1 + r)] = AT_GLIFO;
    // a porta no pé da parede do lado do quarteirão
    for (let y = P.fy - 3; y < P.fy; y++) { const i = I(P.door.x, y); tiles[i] = AIR; walls[i] = WAT_LAJE; atKeep.add(i); }
    P.pend = { x: (P.x0 + 7) * T, y: (P.y0 + 6) * T };   // o topo do pedestal, no meio
    P.warn = 0;
  }
  const R = AT_GRAV.filter(G => G.kind === 'prumo'); for (const G of R) G.dir = 0;
}

/* ---------- golpear o Prumo: 1 s de aviso e a sala gira (a gravidade vai 90° no sentido do relógio) ---------- */
let atPrumoAtk = -1;
const atPrumoRect = P => AT_GRAV.find(G => G.ref === P);
HOOK.update.push(dt => {
  if (!ANTIGOS || !pl || pl.dead || state !== 'play' || !atPrumos.length) return;
  const hx = pl.x + pl.w / 2, hy = pl.y + pl.h / 2;
  for (const P of atPrumos) {
    const G = atPrumoRect(P); if (!G || !P.pend) continue;
    if (P.warn > 0) {
      P.warn -= dt;
      if (P.warn <= 0) { P.warn = 0; atRotRect(G, 3); shake(2.5); if (typeof sfx !== 'undefined' && sfx.atPrumo) sfx.atPrumo(); }
      continue;
    }
    if (!atInRect(G, hx, hy)) continue;
    // o golpe pega se a lâmina está no meio da batida, perto do pedestal e do lado para onde o herói olha
    if (pl.atkT < 0 || pl.atkAt === atPrumoAtk) continue;
    const tm = pl.twoHand ? GS_TM : ATK_TM; if (pl.atkT < tm.wind || pl.atkT > tm.wind + tm.swing) continue;
    const px = P.pend.x, py = P.pend.y - 6, dx = px - hx, dy = py - hy;
    if (Math.hypot(dx, dy) > 3.2 * T || (Math.abs(dx) > 4 && Math.sign(dx) !== pl.facing)) continue;
    atPrumoAtk = pl.atkAt; P.warn = 1;
    burst(px, py, 8, '#9af0f0', 50, 200, 0.4);
    if (typeof sfx !== 'undefined' && sfx.atPrumoAviso) sfx.atPrumoAviso();
  }
});

/* ---------- o desenho: o Prumo em cima do pedestal (balança no aviso) e as Setas de Prumo nas quatro paredes de dentro
   (apontam para baixo; no aviso giram para onde vai ser o chão). A arena também tem as setas ---------- */
function atDrawArrow(x, y, ang, col, a) {
  lc.save(); lc.translate(x, y); lc.rotate(ang); lc.globalAlpha = a;
  lc.fillStyle = '#0a2a30'; lc.fillRect(-2, -5, 5, 7); lc.fillRect(-4, 1, 9, 2); lc.fillRect(-3, 3, 7, 1); lc.fillRect(-2, 4, 5, 1); lc.fillRect(-1, 5, 3, 1);
  lc.fillStyle = col; lc.fillRect(-1, -4, 3, 6); lc.fillRect(-3, 2, 7, 1); lc.fillRect(-2, 3, 5, 1); lc.fillRect(-1, 4, 3, 1); lc.fillRect(0, 5, 1, 1);
  lc.restore(); lc.globalAlpha = 1;
}
function atRectArrows(G, warn, warnK, cx, cy) {
  // no meio de cada parede de dentro, encostada nela
  const x0 = G.x0 * T - cx, y0 = G.y0 * T - cy, w = G.w * T, h = G.h * T;
  const a = warn > 0 ? Math.PI / 2 * (1 - Math.max(0, Math.min(1, warn / warnK))) : 0;
  const col = warn > 0 && Math.floor(gameTime * 10) % 2 ? '#e8ffff' : '#4ac8d0';
  for (const [x, y] of [[x0 + 5, y0 + h / 2], [x0 + w - 5, y0 + h / 2], [x0 + w / 2, y0 + 7], [x0 + w / 2, y0 + h - 7]]) {
    if (x < -10 || x > VW + 10 || y < -10 || y > VH + 10) continue;
    if (SOLID[tileAt(Math.floor((x + cx) / T), Math.floor((y + cy) / T))]) continue;
    atDrawArrow(Math.round(x), Math.round(y), a, col, 0.9);
  }
}
HOOK.drawWorld.push((cx, cy) => {
  if (!ANTIGOS) return;
  for (const P of atPrumos) {
    if (!P.pend) continue;
    const x = P.pend.x - cx, y = P.pend.y - cy; if (x < -40 || x > VW + 40 || y < -60 || y > VH + 60) continue;
    const G = atPrumoRect(P);
    // o peso de prumo: o fio sobe de um suporte, o peso em losango aceso, balança no aviso
    const sw = P.warn > 0 ? Math.sin(gameTime * 18) * 3 * P.warn : Math.sin(gameTime * 1.2) * 0.4;
    lc.fillStyle = '#56606e'; lc.fillRect(x - 4, y - 18, 9, 2); lc.fillStyle = '#b0bccc'; lc.fillRect(x - 3, y - 18, 7, 1);
    lc.fillStyle = '#9af0f0'; for (let k = 0; k < 8; k++) lc.fillRect(Math.round(x + sw * k / 8), y - 16 + k, 1, 1);
    const bx = Math.round(x + sw);
    lc.fillStyle = '#145058'; lc.fillRect(bx - 3, y - 8, 7, 5); lc.fillRect(bx - 2, y - 9, 5, 7); lc.fillRect(bx - 1, y - 10, 3, 9);
    lc.fillStyle = '#4ac8d0'; lc.fillRect(bx - 2, y - 7, 5, 3); lc.fillRect(bx - 1, y - 8, 3, 5);
    lc.fillStyle = '#e8ffff'; lc.fillRect(bx - 1, y - 7, 1, 2); lc.fillRect(bx, y - 2, 1, 1);
    if (G) atRectArrows(G, P.warn, 1, cx, cy);
  }
});
HOOK.drawGlow.push((cx, cy) => {
  if (!ANTIGOS) return;
  for (const P of atPrumos) {
    if (!P.pend) continue;
    const x = P.pend.x - cx, y = P.pend.y - cy; if (x < -40 || x > VW + 40 || y < -60 || y > VH + 60) continue;
    lc.globalAlpha = 0.35 + (P.warn > 0 ? 0.3 * Math.abs(Math.sin(gameTime * 18)) : 0.08 * Math.sin(gameTime * 2));
    lc.drawImage(SPR.glow.eyeC, x - 7, y - 13);
  }
  lc.globalAlpha = 1;
});

/* ---------- o save: a direção de cada Sala de Prumo (os blocos girados já vão nos diffs) ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (ANTIGOS) o.atPrumo = atPrumos.map(P => { const G = atPrumoRect(P); return G ? G.dir : 0; }); return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  atCam.a = 0; atCam.t = 1; if (atCam.big) atCamBig(false);
  const r = _nw(sd, sv);
  if (ANTIGOS && sv && Array.isArray(sv.atPrumo)) atPrumos.forEach((P, k) => { const G = atPrumoRect(P); if (G) G.dir = (sv.atPrumo[k] | 0) & 3; });
  return r;
}; }
