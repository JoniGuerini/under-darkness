'use strict';

/* ================= árvores da superfície: espécies novas e o visual de cada estação =================
   Pedido do Jonathan (2026-10-11): mais tipos de árvore na superfície, e as árvores mudam com a estação (334).
   - O mundo continua guardando a árvore só pela altura do tronco (3 arbusto, 5 árvore, 6 árvore grande, 7 pinheiro),
     então nada muda na geração nem no save: a espécie sai de um sorteio fixo pela coluna do tronco.
       altura 5: carvalho, bétula (tronco branco, copa alta), bordo (copa redonda, vermelho no outono), cerejeira (copa
                 larga e baixa, toda rosa na primavera)
       altura 6: carvalho grande, salgueiro (galhos caídos até perto do chão)
       altura 7: pinheiro, abeto (mais estreito e azulado)
       altura 3: arbusto, azevinho (sempre verde, frutinhas vermelhas no outono e no inverno)
   - Visual por estação (dia d da estação, 0..6):
       primavera: brotos ralos nos 2 primeiros dias, depois folhas novas, verde-claro; a cerejeira fica rosa até o dia 3,
                  as frutíferas (os carvalhos com fruta) dão flor branca do dia 1 ao 3
       verão:     o verde de sempre, com fruta nas frutíferas
       outono:    copa amarela, laranja ou vermelha (depende da espécie) até o dia 2, rala nos dias 3 e 4 e pelada
                  (só os galhos) nos dias 5 e 6
       inverno:   galhos pelados com neve em cima; pinheiro, abeto e azevinho seguem verdes, cobertos de neve
   - Os desenhos são assados uma vez por combinação (espécie, variação, visual) e guardados; os do dia seguinte são
     assados aos poucos (um por quadro) antes de precisar. Na troca do dia, o visual novo aparece por cima do velho num
     esmaecer de 2,5 s (globalAlpha num drawImage, nada lido de volta).
   - drawTrees (34, refeito no 236-arvores-caem) é refeito aqui com o mesmo laço, o mesmo tremor dos golpes e as árvores
     tombando; treeFell passa a tombar o desenho da estação; as folhas que soltam a cada golpe têm a cor da estação.
   Carrega depois do 334-estacoes e do 236-arvores-caem. */

/* ---- rampas novas (mesmo formato das do 34) ---- */
Object.assign(TR_RAMP, {
  fresh: ['#10280f', '#1b4119', '#285c22', '#37772c', '#4c9338', '#67ad46', '#8bc85c', '#b6e07e'],
  birchL: ['#14280c', '#213f14', '#30591c', '#417225', '#558c2f', '#6ea53c', '#8fbf4e', '#b8d86a'],
  willowL: ['#122a10', '#1d4018', '#2a5820', '#3a722a', '#4e8a34', '#68a240', '#88ba52', '#b0d26e'],
  fir: ['#06141a', '#0b2228', '#123236', '#1a4446', '#245656', '#326a66', '#467e78', '#64988e'],
  holly: ['#06160c', '#0c2414', '#14361c', '#1c4826', '#265c30', '#33723c', '#46884c', '#62a062'],
  autO: ['#2a1206', '#4a220a', '#70340e', '#984a14', '#bc641c', '#d88228', '#eea43c', '#fac866'],
  autR: ['#2a0708', '#4c0f10', '#741a14', '#9a261a', '#bc3a20', '#d6542a', '#ec7a3a', '#f8a65a'],
  autY: ['#2a2208', '#4a3c0e', '#705c14', '#967c1a', '#b89c24', '#d2ba34', '#e8d44c', '#f8ec82'],
  sakura: ['#3a1424', '#5e2238', '#8a3652', '#b4506e', '#d6728e', '#eb98b0', '#f8c0d0', '#fff0f4'],
  bloomW: ['#3a3038', '#5a4e58', '#8a7c88', '#b0a4ae', '#e0c8d0', '#f2dce4', '#fceef2', '#fffafb'],
  snow: ['#4a5670', '#66728c', '#8692aa', '#a8b4c8', '#c6d0e0', '#dee6f0', '#f0f4fa', '#ffffff'],
  birchB: ['#141414', '#2e2c2a', '#6a665e', '#9a958a', '#c4beb2', '#dedad0', '#f2efe8'],
  cherryB: ['#140806', '#2a1410', '#40201a', '#582c22', '#70382a', '#8a4834', '#a45c42']
});
for (const k in TR_RAMP) if (!TR_PAL[k]) TR_PAL[k] = TR_RAMP[k].map(h => { const n = parseInt(h.slice(1), 16); return (255 << 24 | (n & 255) << 16 | (n >> 8 & 255) << 8 | n >> 16) >>> 0; });

/* ---- espécies ---- */
const TREE_SP = {
  0: [['carvalho', 0.4], ['betula', 0.22], ['bordo', 0.2], ['cerejeira', 0.18]],
  1: [['carvalho', 0.6], ['salgueiro', 0.4]],
  2: [['pinheiro', 0.55], ['abeto', 0.45]],
  3: [['arbusto', 0.6], ['azevinho', 0.4]]
};
const TREE_EVER = { pinheiro: 1, abeto: 1, azevinho: 1 };
const TREE_SP_SEED = { carvalho: 0, arbusto: 0, pinheiro: 0, betula: 401, bordo: 503, cerejeira: 607, salgueiro: 709, abeto: 811, azevinho: 913 };
// a forma de cada espécie: altura do tronco (px), largura do pé, e a copa (centro relativo ao topo do tronco, raios, tufos)
const TREE_GEO = {
  carvalho: { 3: [36, 10, 26, 44, 26, 13, 0], 0: [60, 12, 34, 43, 34, 17, 0], 1: [72, 14, 40, 48, 40, 17, 4] },
  arbusto: { 3: [36, 10, 26, 44, 26, 13, 0] },
  azevinho: { 3: [26, 8, 30, 32, 32, 15, 0] },
  betula: { 0: [66, 8, 40, 30, 46, 18, 0] },
  bordo: { 0: [58, 12, 36, 48, 38, 19, 0] },
  cerejeira: { 0: [50, 12, 22, 56, 28, 18, 2] },
  salgueiro: { 1: [60, 16, 24, 50, 30, 17, 0] }
};
function treeSp(kind, gx) { const r = hash2(gx, 0, 91), L = TREE_SP[kind]; let a = 0; for (const [n, w] of L) { a += w; if (r < a) return n; } return L[0][0]; }
const treeFruit = (sp, kind, v) => sp === 'carvalho' && ((kind === 1 && v === 1) || (kind === 0 && v === 0));

// o visual de uma espécie num dia da estação
function treeLook(sp, kind, v, e) {
  if (TREE_EVER[sp]) return e.s === 3 ? 'everSnow' : e.s === 2 ? 'everB' : 'ever';
  if (e.s === 0) {
    if (sp === 'cerejeira') return e.d < 4 ? 'bloomP' : 'fresh';
    if (treeFruit(sp, kind, v)) return e.d < 1 ? 'bud' : e.d < 4 ? 'bloomW' : 'fresh';
    return e.d < 2 ? 'bud' : 'fresh';
  }
  if (e.s === 1) return 'sum';
  if (e.s === 2) return e.d < 3 ? 'aut' : e.d < 5 ? 'autThin' : 'bare';
  return 'snow';
}
function treeRamp(sp, v, look) {
  if (look === 'bloomP') return 'sakura';
  if (look === 'aut' || look === 'autThin') return sp === 'betula' || sp === 'salgueiro' ? 'autY' : sp === 'bordo' || sp === 'arbusto' ? 'autR' : sp === 'cerejeira' ? 'autO' : ['autO', 'autR', 'autY'][v];
  if (look === 'bud' || look === 'fresh' || look === 'bloomW') return sp === 'salgueiro' ? 'willowL' : 'fresh';
  if (sp === 'azevinho') return 'holly';
  if (sp === 'betula') return 'birchL';
  if (sp === 'salgueiro') return 'willowL';
  return v === 2 && (sp === 'carvalho' || sp === 'arbusto') ? 'gold' : 'leaf';
}

/* ---- pedaços de desenho novos ---- */
// 2D value noise para os buracos de uma copa rala (manchas de folhas, não pontinhos soltos)
function trN2(x, y, s) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy); const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s); return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w; }
// os galhos de uma árvore sem folha: forquilhas que se abrem do topo do tronco e enchem o lugar da copa, sem sair
// dela (a elipse cx, cy, rx, ry da copa que a árvore teria)
function trSkel(p, s, bx, by, cx, cy, rx, ry, w0) {
  const R = mulberry32(s * 13 + 5), reach = by - (cy - ry), spread = clamp(rx / ry, 0.8, 1.8);
  const inE = (x, y) => { const dx = (x - cx) / (rx * 1.04), dy = y < cy ? (y - cy) / (ry * 1.08) : 0; return dx * dx + dy * dy <= 1; };
  const grow = (x, y, ang, len, w, dep) => {
    ang = clamp(ang, -1.35, 1.35);
    let x2 = x + Math.sin(ang) * len, y2 = y - Math.cos(ang) * len;
    let cut = false;
    while (!inE(x2, y2) && len > 2) { len *= 0.75; x2 = x + Math.sin(ang) * len; y2 = y - Math.cos(ang) * len; cut = true; }
    if (!inE(x2, y2)) return;
    trBranch(p, s + dep * 17 + ((x * 7) | 0), x, y, x2, y2, cut ? Math.max(1, w * 0.6) : w);
    if (dep >= 5 || cut) return;
    const n = dep < 2 ? 3 : 2;
    for (let i = 0; i < n; i++) grow(x2, y2, ang + ((i - (n - 1) / 2) * (0.5 + R() * 0.3) + (R() - 0.5) * 0.2) * Math.min(1.2, spread), len * (0.68 + R() * 0.12), Math.max(1, w * 0.62), dep + 1);
  };
  for (let i = 0; i < 3; i++) grow(bx + (i - 1), by, ((i - 1) * 0.5 + (R() - 0.5) * 0.14) * spread, reach * (0.36 + R() * 0.08), w0, 1);
}
// tira manchas da copa (o que estava embaixo, galhos ou nada, volta a aparecer) e escurece a borda dos buracos
function trThin(col, under, keep, s, ramp) {
  const W = TR_W, H = TR_H, cut = new Uint8Array(W * H), D = TR_PAL[ramp];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (col[i] === under[i]) continue;
    const n = trN2(x / 4, y / 4, s + 61) * 0.8 + hash2(x, y, s + 62) * 0.2;
    if (n > keep) { col[i] = under[i]; cut[i] = 1; }
  }
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (cut[i] || col[i] === under[i]) continue;
    if (cut[i - 1] || cut[i + 1] || cut[i - W] || cut[i + W]) col[i] = D[1];
  }
}
// flores sobre a copa: tufinhos de 2 a 4 pixels claros, mais onde a luz bate
function trBloom(p, col, under, s, ramp, dens) {
  const W = TR_W, on = i => col[i] !== under[i];
  for (let cy = 1; cy < TR_H - 1; cy += 2) for (let cx = 1; cx < W - 1; cx += 2) {
    const x = cx + ((hash2(cx, cy, s + 70) * 2) | 0), y = cy + ((hash2(cx, cy, s + 71) * 2) | 0), i = y * W + x;
    if (!on(i) || hash2(cx, cy, s + 72) > dens * (on(i - 3 * W) ? 0.8 : 1.3)) continue;
    const lit = hash2(cx, cy, s + 73);
    p.put(x, y, ramp, lit < 0.5 ? 7 : 6);
    if (lit < 0.7 && on(i + 1)) p.put(x + 1, y, ramp, 5);
    if (lit < 0.35 && on(i + W)) p.put(x, y + 1, ramp, 4);
    if (lit > 0.85 && on(i - W)) p.put(x, y - 1, ramp, 6);
  }
}
// salgueiro: fios de folha caindo da copa quase até o chão (ou galhinhos pelados, sem folha)
function trStrands(p, col, under, s, ramp, cx, rx, bare, dens, yMax) {
  const R = mulberry32(s * 5 + 9), W = TR_W;
  for (let x = Math.round(cx - rx * 0.92); x <= cx + rx * 0.92; x += 2 + ((R() * 2) | 0)) {
    if (R() > dens) continue;
    let y0 = -1; for (let y = Math.min(TR_H - 1, yMax); y > 0; y--) { const i = y * W + x; if (col[i] !== under[i]) { y0 = y; break; } }
    if (y0 < 0) continue;
    const k = Math.abs(x - cx) / rx, len = (bare ? 0.55 : 1) * (26 + R() * 30) * (1 - k * k * 0.45), ph0 = R() * 6;
    for (let t = 0; t < len; t++) {
      const yy = y0 - 2 + t, xx = Math.round(x + Math.sin(t * 0.18 + ph0) * 1.2 * (t / len));
      if (yy >= TR_BY - 2) break;
      if (bare) { p.put(xx, yy, 'bark', 2.6 - (t / len)); continue; }
      const tone = 5.2 - (t / len) * 2.6 + (hash2(xx, yy, s) - 0.5) * 1.2 - (x > cx ? 0.8 : 0);
      p.put(xx, yy, ramp, tone); p.put(xx + 1, yy, ramp, t % 3 === 0 ? 0 : tone - 2.2);
      if (t > len - 3) p.put(xx, yy + 1, ramp, 1);
    }
  }
}
// neve: onde há céu logo em cima (ou a borda escura de um andar de pinheiro), dois ou três pixels brancos
function trSnow(col, s, ever, pine) {
  const W = TR_W, H = TR_H, N = TR_PAL.snow, dark = [TR_PAL.pine[0], TR_PAL.fir[0], TR_PAL.holly[0]], out = col.slice();
  for (let y = 2; y < H - 4; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (!col[i]) continue;
    const up = col[i - W], top = (!up && (pine || !col[i - 2 * W])) || (pine && dark.includes(up) && col[i + W]);
    if (!top || hash2(x, y, s + 81) < (ever ? 0.08 : 0.3)) continue;
    if (y > TR_BY - 8) continue;
    out[i] = N[7];
    if (col[i + W]) out[i + W] = hash2(x, y, s + 82) < 0.5 ? N[6] : N[5];
    if (ever && col[i + 2 * W] && hash2(x, y, s + 83) < 0.5) out[i + 2 * W] = N[3];
    if (!up && hash2(x, y, s + 84) < 0.25) out[i - W] = N[6];   // um montinho por cima
  }
  col.set(out);
}

/* ---- assa um desenho ---- */
function bakeEst(kind, sp, v, look) {
  const p0 = treePainter(), s = kind * 31 + v * 7 + 11 + TREE_SP_SEED[sp], R = mulberry32(s), col = p0.col;
  const bm = sp === 'betula' ? 'birchB' : sp === 'cerejeira' ? 'cherryB' : null, fm = sp === 'abeto' ? 'fir' : null;
  const p = { col, zb: p0.zb, put: (x, y, r, t) => p0.put(x, y, r === 'bark' && bm ? bm : r === 'pine' && fm ? fm : r, t) };
  const snow = look === 'snow' || look === 'everSnow';
  if (kind === 2) {
    const top = 84;
    if (sp === 'abeto') { trTrunk(p, s, top + 6, 6, 3); trPine(p, s, TR_BY - top - 112, TR_BY - 20, 30 + v * 3); }
    else { trTrunk(p, s, top + 6, 7, 3); trPine(p, s, TR_BY - top - 100, TR_BY - 26, 42 + v * 3); }
  } else {
    const G = TREE_GEO[sp][kind] || TREE_GEO.carvalho[kind], [top, wB, cyo, rx, ry, n, cxo] = G;
    const cx = TR_BX + cxo, cy = TR_BY - top - cyo, ramp = treeRamp(sp, v, look);
    const leafy = look !== 'bare' && look !== 'snow', thin = look === 'bud' ? 0.5 : look === 'autThin' ? 0.52 : 1;
    trTrunk(p, s, top + 6, wB, wB * (sp === 'betula' ? 0.7 : 0.55));
    if (sp === 'betula') for (let y = TR_BY - top; y < TR_BY - 4; y += 3 + ((hash2(y, 1, s) * 4) | 0)) { const w = 2 + ((hash2(y, 2, s) * 3) | 0), x0 = TR_BX - 3 + ((hash2(y, 3, s) * 4) | 0); for (let k = 0; k < w; k++) p.put(x0 + k, y, 'bark', 0.5); } // as marcas escuras da casca da bétula
    if (sp === 'cerejeira') { trBranch(p, s + 1, TR_BX, TR_BY - top + 6, TR_BX - 26, TR_BY - top - 14, 6); trBranch(p, s + 2, TR_BX, TR_BY - top + 4, TR_BX + 28, TR_BY - top - 12, 6); }
    const under0 = col.slice();
    if (thin < 1 || !leafy) trSkel(p, s, TR_BX, TR_BY - top + 2, cx, cy, rx, ry, kind === 3 ? 3 : 5);
    else for (let i = 0; i < 4; i++) { const side = i % 2 ? 1 : -1, y1 = TR_BY - top + 4 - i * 4, len = 18 + R() * 12; trBranch(p, s + i, TR_BX + side * 2, y1, TR_BX + side * len, y1 - len * (0.7 + R() * 0.4), 6); }
    if (leafy) {
      const under = col.slice();
      const fruit = sp === 'azevinho' ? (look === 'everB' || look === 'everSnow' ? 9 : 0) : (look === 'sum' || look === 'aut') && treeFruit(sp, kind, v) ? (kind === 1 ? 7 : 4) : 0;
      trCrown(p, s, ramp, cx, cy, rx, ry, n, fruit);
      if (sp === 'salgueiro') trStrands(p, col, under, s, ramp, cx, rx, false, thin < 1 ? 0.45 : 1, Math.round(cy + ry));
      if (thin < 1) trThin(col, under, thin, s, ramp);
      if (look === 'bloomW') trBloom(p, col, under, s, 'bloomW', 0.34);
      if (look === 'bloomP') trBloom(p, col, under, s, 'bloomW', 0.1);
    } else if (sp === 'salgueiro') trStrands(p, col, under0, s, 'bark', cx, rx, true, 0.5, Math.round(cy + ry * 0.4));
  }
  if (snow) trSnow(col, s, TREE_EVER[sp], kind === 2);
  const c = mk(TR_W, TR_H), x = c.getContext('2d'), img = x.createImageData(TR_W, TR_H);
  new Uint32Array(img.data.buffer).set(col); x.putImageData(img, 0, 0);
  return c;
}
const EST_SPR = new Map();
const estSprKey = (kind, sp, v, look) => kind + '|' + sp + '|' + v + '|' + look;
function estTreeSpr(kind, sp, v, look) {
  const k = estSprKey(kind, sp, v, look); let c = EST_SPR.get(k);
  if (!c) { c = bakeEst(kind, sp, v, look); EST_SPR.set(k, c); }
  return c;
}
// o desenho de uma árvore do mundo: pé em (gx, gy), h troncos, com ou sem copa, num dia da estação
function estTreeAt(gx, h, crown, e) {
  const kind = TREE_KIND[h] !== undefined ? TREE_KIND[h] : h < 4 ? 3 : h > 6 ? 2 : 0, wx = ((gx % WW) + WW) % WW, v = (hash2(wx, 0, 77) * 3) | 0;
  if (!crown) return treeSprite(kind, v, true);   // tronco cortado: o toco de sempre
  const sp = treeSp(kind, wx); return estTreeSpr(kind, sp, v, treeLook(sp, kind, v, e));
}

/* ---- troca de visual sem salto: o novo aparece por cima do velho ---- */
let estTrE = null, estTrPrev = null, estTrT0 = 0;
const EST_TR_FADE = 2500;
let estTrFila = [], estTrDia = null;
const estArvVis = [];   // árvores com copa desenhadas neste quadro (o 336 solta folhas e pétalas delas)
function estTrQuais(e) {   // todas as combinações do dia e (para assar antes)
  const L = [];
  for (const kind of [0, 1, 2, 3]) for (const [sp] of TREE_SP[kind]) for (let v = 0; v < 3; v++) L.push([kind, sp, v, treeLook(sp, kind, v, e)]);
  return L;
}
HOOK.update.push(() => {
  const dia = estDia();
  if (dia !== estTrDia) { estTrDia = dia; estTrFila = estTrQuais(estNow(dia + 1)).concat(estTrQuais(estNow(dia))).filter(q => !EST_SPR.has(estSprKey(...q))); }
  // um desenho por quadro, primeiro os de hoje (fim da fila)
  while (estTrFila.length) { const q = estTrFila.pop(); if (!EST_SPR.has(estSprKey(...q))) { estTreeSpr(...q); break; } }
});

/* ---- desenho: o laço do 236-arvores-caem com a espécie e a estação ---- */
if (typeof treeHits !== 'undefined') drawTrees = function (cx, cy) {
  const e = estNow();
  if (!estTrE || estTrE.s !== e.s || estTrE.d !== e.d) { estTrPrev = estTrE; estTrE = e; estTrT0 = performance.now(); }
  const k = estTrPrev ? Math.min(1, (performance.now() - estTrT0) / EST_TR_FADE) : 1; if (k >= 1) estTrPrev = null;
  const gx0 = Math.floor(cx / T) - 6, gx1 = Math.floor((cx + VW) / T) + 6, gy0 = Math.max(0, Math.floor(cy / T) - 1), gy1 = Math.min(WH - 1, Math.floor((cy + VH) / T) + 17);
  estArvVis.length = 0;
  for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
    if (tileAt(gx, gy) !== TRUNK || tileAt(gx, gy + 1) === TRUNK) continue;
    let h = 1; while (h < 12 && tileAt(gx, gy - h) === TRUNK) h++;
    const crown = tileAt(gx, gy - h) === LEAVES || tileAt(gx - 1, gy - h + 1) === LEAVES || tileAt(gx + 1, gy - h + 1) === LEAVES;
    if (crown) estArvVis.push(gx, gy, h);
    const spr = estTreeAt(gx, h, crown, e), old = estTrPrev && crown ? estTreeAt(gx, h, crown, estTrPrev) : null;
    const H = treeHits.size ? treeHits.get(gy * WW + wrapX(gx)) : null, bx = gx * T + 6 - cx, by = (gy + 1) * T - cy;
    const blit = (img, a) => { if (a < 1) lc.globalAlpha = a; lc.drawImage(img, -TR_BX, -TR_BY); lc.globalAlpha = 1; };
    lc.save(); lc.translate(bx, by);
    if (H && H.shake > 0) { const s = H.shake; lc.rotate(Math.sin(s * 26) * 0.045 * s * H.dir); }   // balança em volta do pé
    if (old && old !== spr) { blit(old, 1); blit(spr, k); } else blit(spr, 1);
    lc.restore();
  }
  for (const f of treeFalls) {
    const x = nearWX(f.x) - cx, y = f.y - cy; if (x < -260 || x > VW + 260) continue;
    lc.save(); lc.translate(x, y + (f.phase ? f.k * 3 : 0)); lc.rotate(f.a * f.dir);
    if (f.phase) lc.globalAlpha = 1 - f.k * f.k;
    lc.drawImage(f.spr, -TR_BX, -TR_BY); lc.restore();
  }
};

/* ---- a árvore que tomba é a da estação ---- */
// (a wiki carrega este arquivo só para desenhar as árvores, sem o 236-arvores-caem: daí os typeof)
if (typeof treeFell === 'function') { const _tf = treeFell; treeFell = function (b, dir) {
  const n = treeFalls.length; _tf(b, dir);
  if (treeFalls.length > n && b.crown) treeFalls[treeFalls.length - 1].spr = estTreeAt(b.tx, b.h, true, estNow());
}; }

/* ---- as folhas que caem a cada golpe têm a cor da estação ---- */
const _treeLeavesVerde = typeof treeLeaves === 'function' ? treeLeaves : null;
if (_treeLeavesVerde) treeLeaves = function (x, y, w, n) {
  const e = estNow(), tx = Math.floor(x / T);
  let base = null; for (let k = -1; k <= 1 && !base; k++) for (let j = 0; j < 16; j++) { const t = tileAt(tx + k, Math.floor(y / T) + j); if (t === TRUNK && tileAt(tx + k, Math.floor(y / T) + j + 1) !== TRUNK) { base = [tx + k, Math.floor(y / T) + j]; break; } }
  let ramp = 'leaf';
  if (base) { let h = 1; while (h < 12 && tileAt(base[0], base[1] - h) === TRUNK) h++; const kind = TREE_KIND[h] !== undefined ? TREE_KIND[h] : h < 4 ? 3 : h > 6 ? 2 : 0, wx = wrapX(base[0]), v = (hash2(wx, 0, 77) * 3) | 0, sp = treeSp(kind, wx), look = treeLook(sp, kind, v, e);
    if (kind === 2) ramp = sp === 'abeto' ? 'fir' : 'pine';
    else if (look === 'bare' || look === 'snow') ramp = look === 'snow' ? 'snow' : 'bark';
    else ramp = treeRamp(sp, v, look); }
  else if (e.s === 3) ramp = 'snow';
  if (ramp === 'leaf') return _treeLeavesVerde(x, y, w, n);
  const R = TR_RAMP[ramp], m = ramp === 'bark' ? Math.ceil(n / 3) : n;
  for (let i = 0; i < m && parts.length < 700; i++)
    parts.push({ x: x + rnd(-w, w), y: y + rnd(-w * 0.6, w * 0.4), vx: rnd(-14, 14), vy: rnd(-10, 6), g: ramp === 'snow' ? 26 : 38, life: rnd(0.9, 1.6), max: 1.6, col: R[Math.min(R.length - 1, 3 + ((Math.random() * 4) | 0))], size: Math.random() < 0.6 ? 2 : 1 });
};
