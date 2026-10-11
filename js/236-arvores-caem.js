'use strict';

/* ================= árvores da superfície tombam =================
   Pedido do Jonathan (2026-10-11): antes, dois golpes de picareta no tronco sumiam com a árvore e a madeira toda
   caía num montinho no pé dela. Agora:
   - A árvore aguenta TREE_HITS (4) golpes. Cada golpe a faz tremer (balança em volta do pé) e soltar umas folhas.
   - No último ela tomba para o lado contrário ao do herói, girando em volta do pé e acelerando como coisa caindo,
     até a copa encostar no chão (ou deitar de vez). Ali ela some num esmaecer rápido, solta uma nuvem de folhas, e
     a madeira aparece espalhada ao longo de onde ela deitou, uma tora por tronco, não num montinho só.
   - Os blocos da árvore saem do mundo no instante em que ela começa a cair (setTile, como antes), sem dar madeira;
     o que se vê caindo é o mesmo desenho do 34-arvores, só girado (transform no canvas, nada lido de volta).
   - Os golpes contam por árvore e esquecem depois de TREE_HIT_FORGET segundos sem bater.
   Só vale para árvores de copa (tronco com folhas em cima); troncos soltos continuam quebrando como bloco.
   drawTrees (34) é refeito aqui com o mesmo laço e o tremor por cima. Carrega depois do 34 e do 11. */

const TREE_HITS = 4, TREE_HIT_FORGET = 6;
const treeHits = new Map();      // índice do pé da árvore -> { n, t (gameTime do último golpe), shake (0..1) }
const treeFalls = [];            // árvores tombando: { x, y (pé, px), spr, bare, dir, a, va, len, wood, phase, k }

// o pé da árvore (o tronco mais baixo) a partir de um bloco de tronco, e se ela tem copa
function treeBase(tx, ty) {
  let y = ty; while (y < WH - 1 && tileAt(tx, y + 1) === TRUNK) y++;
  let h = 1; while (h < 14 && tileAt(tx, y - h) === TRUNK) h++;
  const crown = tileAt(tx, y - h) === LEAVES || tileAt(tx - 1, y - h + 1) === LEAVES || tileAt(tx + 1, y - h + 1) === LEAVES;
  return { tx: wrapX(tx), ty: y, h, crown };
}
const treeKey = b => b.ty * WW + b.tx;

// folhas soltas, girando devagar até o chão
function treeLeaves(x, y, w, n) {
  const R = TR_RAMP.leaf;
  for (let i = 0; i < n && parts.length < 700; i++)
    parts.push({ x: x + rnd(-w, w), y: y + rnd(-w * 0.6, w * 0.4), vx: rnd(-14, 14), vy: rnd(-10, 6), g: 38, life: rnd(0.9, 1.6), max: 1.6, col: R[3 + ((Math.random() * 4) | 0)], size: Math.random() < 0.6 ? 2 : 1 });
}

/* ---- o golpe da picareta no tronco ---- */
{ const _pi = pickImpact; pickImpact = function (sx, sy, aim) {
  const tg = pl.target;
  if (!tg || !tg.inReach || !tg.dig || tileAt(tg.tx, tg.ty) !== TRUNK || inVillage(tg.tx, tg.ty)) return _pi(sx, sy, aim);
  const b = treeBase(tg.tx, tg.ty); if (!b.crown) return _pi(sx, sy, aim);
  const key = treeKey(b); let H = treeHits.get(key);
  if (!H || gameTime - H.t > TREE_HIT_FORGET) H = { n: 0, t: 0, shake: 0 };
  H.n++; H.t = gameTime; H.shake = 1; H.dir = pl.x + pl.w / 2 < (b.tx + 0.5) * T ? 1 : -1; treeHits.set(key, H);
  pl.digT = 0; pl.digX = -1;
  sfx.dig(); burst((tg.tx + 0.5) * T, (tg.ty + 0.5) * T, 4, PCOL[TRUNK], 50, 320, 0.35);
  treeLeaves((b.tx + 0.5) * T, (b.ty - b.h + 1.5) * T, 26, 8 + ((Math.random() * 5) | 0));
  if (H.n >= TREE_HITS) { treeHits.delete(key); treeFell(b, H.dir); }
}; }

// tira a árvore do mundo e põe o desenho dela para tombar
function treeFell(b, dir) {
  const q = [[b.tx, b.ty]], seen = new Set(); let wood = 0, top = b.ty, n = 0;
  while (q.length && n < 260) {
    const [x, y] = q.pop(), k = y * WW + wrapX(x); if (seen.has(k)) continue; seen.add(k);
    const t = tileAt(x, y); if (t !== TRUNK && t !== LEAVES) continue;
    if (t === TRUNK) wood++; if (y < top) top = y;
    setTile(x, y, AIR); n++;
    q.push([x + 1, y], [x - 1, y], [x, y - 1], [x, y + 1]);
  }
  const kind = TREE_KIND[b.h] !== undefined ? TREE_KIND[b.h] : b.h < 4 ? 3 : b.h > 6 ? 2 : 0;
  const spr = treeSprite(kind, (hash2(b.tx, 0, 77) * 3) | 0, !b.crown);
  treeFalls.push({ x: nearWX(b.tx * T + 6), y: (b.ty + 1) * T, spr, dir, a: 0, va: 0.5, len: (b.ty + 1 - top) * T, wood: Math.max(1, wood), phase: 0, k: 0 });
  sfx.dug();
}

/* ---- a queda, quadro a quadro ---- */
// o ponto do tronco a uma distância d do pé, com a árvore girada de a
const fallPt = (f, d) => [f.x + f.dir * Math.sin(f.a) * d, f.y - Math.cos(f.a) * d];
function fallTouches(f) {
  for (let s = 0.45; s <= 1.0001; s += 0.11) { const [x, y] = fallPt(f, f.len * s); if (solidAt(Math.floor(x / T), Math.floor(y / T))) return true; }
  return false;
}
function treeLand(f) {
  f.phase = 1; f.k = 0; shake(1.2); sfx.land();
  const [mx, my] = fallPt(f, f.len * 0.7); treeLeaves(mx, my, f.len * 0.3, 18);
  // uma tora por tronco, espalhadas pelo comprimento da árvore deitada (o pé fica livre)
  for (let i = 0; i < f.wood; i++) {
    const [x, y] = fallPt(f, f.len * (0.15 + 0.75 * (i + 0.5) / f.wood));
    let gy = Math.floor(y / T); while (gy > 1 && solidAt(Math.floor(x / T), gy)) gy--;   // nunca dentro de um bloco
    dropLoot(x, Math.min(y, (gy + 1) * T - 2), 'madeira', 1, true);
  }
}
HOOK.update.push(dt => {
  for (const H of treeHits.values()) H.shake = Math.max(0, H.shake - dt * 3.2);
  for (let i = treeFalls.length - 1; i >= 0; i--) {
    const f = treeFalls[i];
    if (f.phase === 0) {
      f.va += (2.6 + 3.4 * Math.sin(f.a)) * dt; f.a += f.va * dt;   // começa devagar e acelera, como coisa caindo
      if (f.a >= Math.PI / 2 || (f.a > 0.5 && fallTouches(f))) { f.a = Math.min(f.a, Math.PI / 2); treeLand(f); }
    } else { f.k += dt / 0.55; if (f.k >= 1) treeFalls.splice(i, 1); }
  }
});

/* ---- desenho: o mesmo laço do 34, com o tremor dos golpes e as árvores tombando por cima ---- */
drawTrees = function (cx, cy) {
  if (!TREE_SPR.size) for (const k of [0, 1, 2, 3]) for (let v = 0; v < 3; v++) treeSprite(k, v, false);
  const gx0 = Math.floor(cx / T) - 6, gx1 = Math.floor((cx + VW) / T) + 6, gy0 = Math.max(0, Math.floor(cy / T) - 1), gy1 = Math.min(WH - 1, Math.floor((cy + VH) / T) + 17);
  for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
    if (tileAt(gx, gy) !== TRUNK || tileAt(gx, gy + 1) === TRUNK) continue;
    let h = 1; while (h < 12 && tileAt(gx, gy - h) === TRUNK) h++;
    const kind = TREE_KIND[h] !== undefined ? TREE_KIND[h] : h < 4 ? 3 : h > 6 ? 2 : 0;
    const crown = tileAt(gx, gy - h) === LEAVES || tileAt(gx - 1, gy - h + 1) === LEAVES || tileAt(gx + 1, gy - h + 1) === LEAVES;
    const spr = treeSprite(kind, (hash2(((gx % WW) + WW) % WW, 0, 77) * 3) | 0, !crown);
    const H = treeHits.size ? treeHits.get(gy * WW + wrapX(gx)) : null;
    if (H && H.shake > 0) {   // balança em volta do pé, para lá e para cá, perdendo força
      const s = H.shake, ang = Math.sin(s * 26) * 0.045 * s * H.dir;
      lc.save(); lc.translate(gx * T + 6 - cx, (gy + 1) * T - cy); lc.rotate(ang);
      lc.drawImage(spr, -TR_BX, -TR_BY); lc.restore();
    } else lc.drawImage(spr, gx * T + 6 - TR_BX - cx, (gy + 1) * T - TR_BY - cy);
  }
  for (const f of treeFalls) {
    const x = nearWX(f.x) - cx, y = f.y - cy; if (x < -260 || x > VW + 260) continue;
    lc.save(); lc.translate(x, y + (f.phase ? f.k * 3 : 0)); lc.rotate(f.a * f.dir);
    if (f.phase) lc.globalAlpha = 1 - f.k * f.k;
    lc.drawImage(f.spr, -TR_BX, -TR_BY); lc.restore();
  }
};
{ const _nw = newWorld; newWorld = function (sd, sv) { treeHits.clear(); treeFalls.length = 0; return _nw(sd, sv); }; }
