'use strict';

/* ================= o corpo-terreno: chão que anda (o Último Titã) =================
   O jogo não tinha nada sólido que se mexesse. O Último Titã (287) é um terreno vivo: o herói pisa nele, escala nele
   e é carregado por ele, sem a grade do mundo mudar (docs/camadas/12-ossario-titas.md, seção 13).
   - Um corpo é uma lista de PARTES (TB.parts, no máximo 6). Cada parte tem uma grade própria pequena de células de um
     bloco (k: Uint8Array) e uma posição em px relativa à âncora do Leito (lx, ly: a borda de cima à esquerda; a âncora
     é o canto do bloco (cx, fy) do ttBoss, no mesmo giro do mundo que o herói). A parte nunca gira: só anda.
   - Células: TBK_CARNE e TBK_BRONZE são sólidas; TBK_PEGA (líquen, rachadura, borda de placa) não é sólida e funciona
     como a corrente/escada para a escalada do herói (touchingTile(pl, CHAIN)); vazio é ar.
   - rectSolid (js/10) é embrulhado: além do mundo, pergunta a cada parte sólida cujo retângulo cruza o pedido. Os
     monstros também usam o rectSolid, então pisam no corpo.
   - Andar (tbMove): quem está em pé em cima da parte (ou agarrado numa pega dela) anda junto; se a parte entra no herói,
     ele é empurrado para fora pelo lado mais curto; se ficaria preso entre a parte e o mundo, vai para o espaço livre
     mais perto e toma um dano pequeno (nunca morre esmagado).
   - Desenho: cada parte é pintada uma vez num canvas (pele de pedra cinza-ocre, rachaduras, líquen, placas de bronze
     com rebites; contorno só onde toca o ar, cantos de fora arredondados) e desenhada logo depois dos blocos, antes dos
     monstros e do herói; a luz do mundo cai por cima como em tudo. clipY corta o que está abaixo do chão (uma parte
     subindo do pó).
   - O carimbo (tbStamp): a pose final de cada parte vira blocos de verdade (carne -> osso, bronze -> bronze, o miolo ->
     osso esponjoso), só onde o mundo é ar, e entra nos diffs. Daí em diante não há mais corpo: só blocos. */
const TBK_AR = 0, TBK_CARNE = 1, TBK_BRONZE = 2, TBK_PEGA = 3;
const TB = { parts: [], on: false, ax: 0, ay: 0, cxT: 0, fyT: 0 };
const tbSolidK = k => k === TBK_CARNE || k === TBK_BRONZE;

// a âncora no mesmo giro do mundo que o herói (o mundo dá a volta)
function tbAnchor() { const W = WW * T, x = TB.cxT * T; let d = x - pl.x; d = ((d % W) + W + W / 2) % W - W / 2; TB.ax = pl.x + d; TB.ay = TB.fyT * T; }
const tbX = p => TB.ax + p.lx, tbY = p => TB.ay + p.ly;

/* ---------- uma parte a partir de um desenho em texto: '#' carne, 'b' bronze, '|' pega, '.' ar; o mais de baixo é a
   linha de baixo ---------- */
function tbPart(id, rows, lx, ly, opt = {}) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)), k = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const ch = rows[j][i] || '.'; k[j * w + i] = ch === '#' ? TBK_CARNE : ch === 'b' ? TBK_BRONZE : ch === '|' ? TBK_PEGA : TBK_AR; }
  return Object.assign({ id, w, h, k, lx, ly, vis: true, solid: true, clipY: null, cv: null, seed: 28600 + id.length * 31 + w * 7 + h, dx: 0, dy: 0 }, opt);
}
const tbK = (p, i, j) => i < 0 || j < 0 || i >= p.w || j >= p.h ? TBK_AR : p.k[j * p.w + i];

/* ---------- colisão ---------- */
function tbSolidRect(x, y, w, h) {
  tbAnchor();
  for (const p of TB.parts) {
    if (!p.solid) continue;
    const px = tbX(p), py = tbY(p);
    if (x >= px + p.w * T || x + w <= px || y >= py + p.h * T || y + h <= py) continue;
    const i0 = Math.max(0, Math.floor((x - px) / T)), i1 = Math.min(p.w - 1, Math.floor((x + w - 0.001 - px) / T));
    const j0 = Math.max(0, Math.floor((y - py) / T)), j1 = Math.min(p.h - 1, Math.floor((y + h - 0.001 - py) / T));
    for (let j = j0; j <= j1; j++) {
      if (p.clipY !== null && py + j * T >= p.clipY) continue;   // abaixo do chão: é o chão do mundo que conta
      for (let i = i0; i <= i1; i++) if (tbSolidK(p.k[j * p.w + i])) return p;
    }
  }
  return null;
}
function tbGripAt(e) {
  tbAnchor();
  for (const p of TB.parts) {
    const px = tbX(p), py = tbY(p);
    if (e.x + 1 >= px + p.w * T || e.x + e.w - 1 <= px || e.y >= py + p.h * T || e.y + e.h <= py) continue;
    const i0 = Math.max(0, Math.floor((e.x + 1 - px) / T)), i1 = Math.min(p.w - 1, Math.floor((e.x + e.w - 1 - px) / T));
    const j0 = Math.max(0, Math.floor((e.y - py) / T)), j1 = Math.min(p.h - 1, Math.floor((e.y + e.h - 1 - py) / T));
    for (let j = j0; j <= j1; j++) { if (p.clipY !== null && py + j * T >= p.clipY) continue; for (let i = i0; i <= i1; i++) if (p.k[j * p.w + i] === TBK_PEGA) return p; }
  }
  return null;
}
{ const _rs = rectSolid; rectSolid = function (x, y, w, h) { return _rs(x, y, w, h) || (TB.on && !!tbSolidRect(x, y, w, h)); }; }
// a pega é a corrente da escalada (o herói segura W ou S); TB.slip tira a pega no tremor de quem não está firme
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (TB.on && t === CHAIN && e === pl && !TB.noGrip && !!tbGripAt(e)); }; }
const tbWorldSolid = (x, y, w, h) => { const on = TB.on; TB.on = false; try { return rectSolid(x, y, w, h); } finally { TB.on = on; } };

/* ---------- andar ---------- */
// em pé em cima da parte p (o pé encosta na linha de cima de uma célula sólida dela) ou agarrado numa pega dela
function tbRides(p, e) {
  const px = tbX(p), py = tbY(p);
  if (e.x + e.w <= px || e.x >= px + p.w * T || e.y + e.h + 2 <= py || e.y >= py + p.h * T) return false;
  const fy = e.y + e.h + 1, j = Math.floor((fy - py) / T);
  if (j >= 0 && j < p.h && (e.vy === undefined || e.vy >= -1)) {
    const i0 = Math.max(0, Math.floor((e.x + 1 - px) / T)), i1 = Math.min(p.w - 1, Math.floor((e.x + e.w - 1 - px) / T));
    for (let i = i0; i <= i1; i++) if (tbSolidK(p.k[j * p.w + i]) && Math.abs(py + j * T - (e.y + e.h)) < 3) return true;
  }
  return e === pl && pl.climb && tbGripAt(pl) === p;
}
// tira e de dentro da parte: o lado mais curto que deixa livre (mundo e corpo); senão o espaço livre mais perto
function tbUnstick(e, isHero) {
  if (!tbSolidRect(e.x, e.y, e.w, e.h)) return;
  const free = (x, y) => !rectSolid(x, y, e.w, e.h);
  let best = null;
  for (let d = 1; d <= 6 * T && !best; d += 1) for (const [ox, oy] of [[0, -d], [-d, 0], [d, 0], [0, d]]) if (free(e.x + ox, e.y + oy)) { best = [ox, oy]; break; }
  if (best) { e.x += best[0]; e.y += best[1]; if (best[1] < 0 && e.vy > 0) e.vy = 0; return; }
  // preso: o espaço livre mais perto numa espiral de blocos
  for (let r = 1; r < 14; r++) for (let a = 0; a < 16; a++) {
    const x = e.x + Math.round(Math.cos(a / 16 * 6.283) * r) * T, y = e.y + Math.round(Math.sin(a / 16 * 6.283) * r) * T;
    if (free(x, y)) { e.x = x; e.y = y; e.vx = 0; e.vy = 0; if (isHero && !pl.dead) { pl.invuln = 0; const hp = pl.hp; hurtPlayer(Math.max(1, Math.round(pl.maxHp * 0.05)), pl.x + pl.w / 2 + 1, null, true); if (pl.hp <= 0 && hp > 1) pl.hp = 1; } return; }
  }
}
function tbMove(p, nlx, nly) {
  const dx = nlx - p.lx, dy = nly - p.ly; if (!dx && !dy) { p.dx = p.dy = 0; return; }
  tbAnchor();
  const ride = !pl.dead && tbRides(p, pl), riders = enemies.filter(e => !e.dead && !ET[e.type].fly && tbRides(p, e));
  p.lx = nlx; p.ly = nly; p.dx = dx; p.dy = dy;
  const carry = e => { if (!tbWorldSolid(e.x + dx, e.y, e.w, e.h)) e.x += dx; if (!tbWorldSolid(e.x, e.y + dy, e.w, e.h)) e.y += dy; };
  if (ride) { carry(pl); if (dy < 0) pl.onGround = true; }
  for (const e of riders) carry(e);
  if (!pl.dead) tbUnstick(pl, true);
  for (const e of enemies) if (!e.dead && !ET[e.type].phase) tbUnstick(e, false);
}

/* ---------- desenho ---------- */
const TBP = {
  pele: ['#121216', '#201f26', '#333038', '#48434c', '#615a62', '#7d7479', '#9c9294', '#b8aca8'],
  liquen: ['#1a2218', '#26321f', '#34462a', '#4a5e38', '#62784a', '#86986a'],
  bronze: ['#141c16', '#1e2a20', '#2a3a2c', '#3a5240', '#4a6a52', '#6a8a6a', '#a8b88a'],
  verde: ['#1e3a30', '#2e5a48', '#4a8068', '#74a88a'],
  contorno: '#0a0806'
};
function tbPaint(p) {
  const cn = MNART.cn;
  const W = p.w * T, H = p.h * T, cv = mk(W, H), x = cv.getContext('2d'), img = x.createImageData(W, H), d = new Uint32Array(img.data.buffer), s = p.seed;
  const PE = TBP.pele.map(ph), LQ = TBP.liquen.map(ph), BR = TBP.bronze.map(ph), VD = TBP.verde.map(ph), OUT = ph(TBP.contorno);
  const pick = (R, v) => R[Math.max(0, Math.min(R.length - 1, Math.round(v)))];
  const sol = (i, j) => tbSolidK(tbK(p, i, j));
  // a distância de cada pixel até o ar, em px (até 2 blocos), para dar volume: luz de cima à esquerda, sombra embaixo
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = (px / T) | 0, j = (py / T) | 0, kk = tbK(p, i, j), u = px % T, v = py % T;
    if (kk === TBK_PEGA) continue;
    if (!tbSolidK(kk)) continue;
    // os cantos de fora arredondados (raio 5 px)
    const up = !sol(i, j - 1), dn = !sol(i, j + 1), lf = !sol(i - 1, j), rt = !sol(i + 1, j), r = 5;
    const cxr = lf && u < r ? r - u : rt && u > T - 1 - r ? u - (T - 1 - r) : 0, cyr = up && v < r ? r - v : dn && v > T - 1 - r ? v - (T - 1 - r) : 0;
    if (cxr && cyr && cxr * cxr + cyr * cyr > r * r) continue;
    let top = 99, bot = 99, left = 99, right = 99;
    for (let k = 1; k <= 2 * T; k += 2) { if (top === 99 && !sol(i, ((py - k) / T) | 0) || (py - k < 0 && top === 99)) top = k; if (bot === 99 && (py + k >= H || !sol(i, ((py + k) / T) | 0))) bot = k; if (left === 99 && (px - k < 0 || !sol(((px - k) / T) | 0, j))) left = k; if (right === 99 && (px + k >= W || !sol(((px + k) / T) | 0, j))) right = k; }
    const n = cn(px, py, 48, 22, s + 7) * 1.1 + cn(px, py, 18, 18, s) * 0.7 + cn(px, py, 6, 6, s + 1) * 0.4 + (hash2(px, py, s) - 0.5) * 0.35;
    let val = 2.6 + n + (top < 6 ? 1.6 - top * 0.2 : 0) + (left < 5 ? 0.6 : 0) - (bot < 8 ? 1.4 - bot * 0.15 : 0) - (right < 5 ? 0.5 : 0) - Math.min(1, (Math.min(top, bot, left, right) - 8) / 24) * 0.4;
    let R = PE;
    if (kk === TBK_BRONZE) {   // a placa: verde-bronze, borda clara, rebites, azinhavre
      R = BR; val = 3.2 + n * 0.5 + (v < 2 || u < 2 ? 1.6 : 0) - (v > T - 3 || u > T - 3 ? 1.2 : 0) + (top < 6 ? 1 : 0);
      if ((u === 3 || u === T - 4) && (v === 3 || v === T - 4)) val = 6;
      if (cn(px, py, 9, 9, s + 5) > 0.62) { d[py * W + px] = pick(VD, 1.6 + n); continue; }
    } else {
      // rachaduras finas, líquen em manchas onde olha para cima
      if (Math.abs(cn(px, py, 30, 14, s + 2) - 0.5) < 0.018) val = 0.6;
      if (top < 10 && cn(px, py, 14, 10, s + 3) > 0.6) { d[py * W + px] = pick(LQ, 2.6 + n + (top < 3 ? 1.2 : 0)); continue; }
    }
    d[py * W + px] = pick(R, val);
  }
  // as pegas: fios de líquen pendurados e beiradas de rachadura, sobre o ar ao lado da parede
  for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) {
    if (tbK(p, i, j) !== TBK_PEGA) continue;
    const wallL = sol(i - 1, j), wallR = sol(i + 1, j);
    for (let f = 0; f < 4; f++) {
      const x0 = i * T + (wallL ? 1 + f * 2 : wallR ? T - 2 - f * 2 : 2 + f * 3), len = T - 2 + ((hash2(i * 4 + f, j, s) * 6) | 0);
      for (let k = 0; k < len; k++) { const yy = j * T + k - 2, xx = x0 + Math.round(Math.sin(k * 0.6 + f) * 0.8); if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue; d[yy * W + xx] = pick(LQ, 3.2 - k / len * 1.6 + (f === 0 ? 1 : 0)); }
    }
    for (let k = 0; k < T; k += 3) { const yy = j * T + k, xx = wallL ? i * T : (i + 1) * T - 1; if (xx >= 0 && xx < W) d[yy * W + xx] = pick(PE, 1); }   // a borda da rachadura
  }
  // o contorno escuro onde a carne toca o ar
  const src = d.slice();
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    if (src[py * W + px]) continue;
    const nb = (px > 0 && src[py * W + px - 1]) || (px < W - 1 && src[py * W + px + 1]) || (py > 0 && src[(py - 1) * W + px]) || (py < H - 1 && src[(py + 1) * W + px]);
    if (nb) d[py * W + px] = OUT;
  }
  x.putImageData(img, 0, 0);
  return cv;
}
function tbDraw(cx, cy) {
  if (!TB.on) return;
  tbAnchor();
  for (const p of TB.parts) {
    if (!p.vis) continue;
    if (!p.cv) p.cv = tbPaint(p);
    const X = Math.round(tbX(p) - cx), Y = Math.round(tbY(p) - cy);
    if (X > VW || Y > VH || X + p.cv.width < 0 || Y + p.cv.height < 0) continue;
    if (p.clipY !== null) {
      const hh = Math.max(0, Math.min(p.cv.height, Math.round(p.clipY - tbY(p))));
      if (hh > 0) lc.drawImage(p.cv, 0, 0, p.cv.width, hh, X + (p.jx || 0), Y, p.cv.width, hh);
    } else lc.drawImage(p.cv, X + (p.jx || 0), Y);
  }
}
// logo depois dos blocos: o corpo fica atrás dos monstros e do herói
{ const _dc = drawChunks; drawChunks = function (cx, cy) { _dc(cx, cy); tbDraw(cx, cy); }; }

/* ---------- o carimbo: a pose final vira blocos do mundo ---------- */
function tbStamp(inside) {
  tbAnchor();
  const T0 = typeof TT_OSSO !== 'undefined' ? TT_OSSO : STONE, TB0 = typeof TT_BRONZE !== 'undefined' ? TT_BRONZE : STONE, TE = typeof TT_ESPONJA !== 'undefined' ? TT_ESPONJA : STONE, TL = typeof TT_LIQUEN !== 'undefined' ? TT_LIQUEN : 0;
  for (const p of TB.parts) {
    const px = tbX(p), py = tbY(p);
    for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) {
      const kk = p.k[j * p.w + i]; if (kk === TBK_AR) continue;
      const tx = Math.round(px / T) + i, ty = Math.round(py / T) + j;
      if (p.clipY !== null && ty * T >= p.clipY) continue;
      if (inside && !inside(tx, ty)) continue;
      if (tx * T < pl.x + pl.w && tx * T + T > pl.x && ty * T < pl.y + pl.h && ty * T + T > pl.y) continue;   // nunca sobre o herói
      if (tileAt(tx, ty) !== AIR) continue;
      let t;
      if (kk === TBK_PEGA) { if (!TL) continue; t = TL; }
      else if (kk === TBK_BRONZE) t = TB0;
      else t = [[0, -1], [0, 1], [-1, 0], [1, 0]].every(([a, b]) => tbSolidK(tbK(p, i + a, j + b))) && hash2(tx, ty, 77) < 0.6 ? TE : T0;
      setTile(tx, ty, t);
    }
  }
  TB.parts.length = 0; TB.on = false;
}
