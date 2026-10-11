'use strict';

/* ================= estações do ano na superfície =================
   Pedido do Jonathan (2026-10-11): a superfície muda com as estações. Escala escolhida: o dia do jogo dura 24 minutos,
   e cada estação dura EST_DIAS = 7 dias do jogo (2 h 48 min de jogo rodando); o ano inteiro são 28 dias (11 h 12 min).
   - O dia da estação vira às 06:00 (no nascer do sol), não às 18:00, para a troca acontecer de manhã.
   - Um jogo novo começa no primeiro dia da primavera. Um save antigo, sem estação, também entra na primavera.
   - O save guarda `est`: quantos dias somar ao relógio do mundo para achar a estação (worldTime já vai no save).
   - Aqui ficam o relógio (estNow), o chão (capim, tufos e flores trocam de cor; no inverno viram neve), o fundo
     (campos, sebes e matas lá longe repintados por estação), a neve nos telhados do vilarejo e a faixa com o nome da
     estação quando ela vira com o herói na superfície. As árvores estão no 335, o tempo (neve, folhas, pétalas) no 336.
   - Menu > Testes ganha "Estação: ..." que pula para a próxima estação (para testar sem esperar).
   Nada aqui lê pixels por quadro: cada troca repinta uma vez, e o fundo é rebakeado aos poucos (uma camada por quadro). */

const EST_DIAS = 7;
const EST_NOMES = ['Primavera', 'Verão', 'Outono', 'Inverno'];
let estOff = 0;                         // dias somados ao relógio do mundo (vai no save como `est`)

// dias desde o começo do mundo, contando a virada às 06:00 (worldTime 0 = 18:00 do dia 0)
const estDia = () => Math.floor(worldTime / DAY_LEN + 0.5) + estOff;
// { s: 0 primavera .. 3 inverno, d: dia dentro da estação (0..EST_DIAS-1) }
function estNow(dia) { const n = dia === undefined ? estDia() : dia, k = ((n % (EST_DIAS * 4)) + EST_DIAS * 4) % (EST_DIAS * 4); return { s: (k / EST_DIAS) | 0, d: k % EST_DIAS }; }

/* ---- o chão: capim, tufos e flores por estação ---- */
// o capim tem 6 tons (escuro -> claro); a ponta de cima usa os tons 0, 5, 4 e 2 (07-chunks-luz)
const EST_CAPIM = {
  prim: ['#1a4016', '#265c20', '#327a2a', '#45963a', '#5fb24a', '#86cf62'],
  ver: PALH.grass.slice(),
  out1: ['#2e3814', '#45501c', '#5c6624', '#76782c', '#918a36', '#ad9e44'],
  out2: ['#382a12', '#4e3a18', '#66501e', '#7e6226', '#967430', '#aa863c'],
  inv: ['#5e6c8a', '#8a98b4', '#aab6cc', '#c6d0e2', '#e2e9f3', '#f8fbff']
};
const EST_TUFO = {
  prim: [{ g: '#62be4c', G: '#3e8a36' }, { g: '#56b044', G: '#387c30' }],
  ver: [{ g: '#55ad46', G: '#3a7d33' }, { g: '#4a9c3e', G: '#356f2e' }],
  out1: [{ g: '#a49a3c', G: '#6e6a28' }, { g: '#b08a36', G: '#76602a' }],
  out2: [{ g: '#9a7440', G: '#64482a' }, { g: '#8a6a3a', G: '#5a4228' }],
  inv: null
};
const TUFO_ROWS = [
  ["............", "............", "............", "............", "............", "............", "............", "..g......g..", ".gG..g..gG..", ".g.g.Gg.g.g.", "gG.gg.g.gG.g", "g.gGg.gg.g.g"],
  ["............", "............", "............", "............", "............", "............", "............", "......g.....", "..g..gG...g.", ".gG.g.g..gG.", ".g.gG.gg.g.g", "gg.g.gG.gg.g"]
];
const FLOR_ROWS = ["............", "............", "............", "............", "............", "....pp......", "...pYp......", "....pp......", "....g.......", "...gg.g..g..", "..g.gGg.gG..", ".gG.gg.gg.g."];
// no inverno o tufo vira um montinho de neve com dois talos secos furando
const NEVE_ROWS = [
  ["............", "............", "............", "............", "............", "............", "............", "....t.......", "....t...t...", "...wWWw.t...", "..wWWWWwWw..", ".wWWWWWWWWw."],
  ["............", "............", "............", "............", "............", "............", "............", "............", ".......t....", "..t...wWt...", ".wWw.wWWWw..", "wWWWWWWWWWWw"]
];
const NEVE_PAL = { w: '#c6d0e2', W: '#f2f6fb', t: '#6a5236' };
let estChao = '';
function estChaoKey(e) { return e.s === 0 ? 'prim' : e.s === 1 ? 'ver' : e.s === 2 ? (e.d < 3 ? 'out1' : 'out2') : 'inv'; }
function estPintaChao(k) {
  if (k === estChao) return; estChao = k;
  EST_CAPIM[k].forEach((h, i) => { PALS.grass[i] = ph(h); PALH.grass[i] = h; });
  PCOL[GRASS] = EST_CAPIM[k][4];
  if (k === 'inv') {
    DECO[TUFT] = NEVE_ROWS.map(r => rowsT(r, NEVE_PAL));
    DECO[FLOWER] = [rowsT(NEVE_ROWS[0], NEVE_PAL), rowsT(NEVE_ROWS[1], NEVE_PAL), rowsT(NEVE_ROWS[0], NEVE_PAL)];
    PCOL[TUFT] = PCOL[FLOWER] = '#e2e9f3';
  } else {
    DECO[TUFT] = TUFO_ROWS.map((r, i) => rowsT(r, EST_TUFO[k][i]));
    // flores: na primavera mais cor, no verão as de sempre, no outono murchas
    const pet = k === 'prim' ? ['#f070a0', '#f8e070', '#b090ff'] : k === 'ver' ? ['#e0505a', '#f0c43a', '#9a7cf0'] : ['#a86a40', '#b88a3a', '#7a5a5a'];
    const cen = k === 'prim' || k === 'ver' ? '#fff2a8' : '#6a4a2a', T0 = EST_TUFO[k][0];
    DECO[FLOWER] = pet.map(p => rowsT(FLOR_ROWS, { p, Y: cen, g: T0.g, G: T0.G }));
    PCOL[TUFT] = T0.g; PCOL[FLOWER] = pet[0];
  }
  // só os pedaços do mapa perto da superfície precisam ser repintados
  let maxS = 0; if (surf) for (let x = 0; x < WW; x++) if (surf[x] > maxS) maxS = surf[x];
  const j1 = Math.floor((maxS + 8) / CH);
  for (const [key, ch] of chunks) if (((key / 64) | 0) <= j1) ch.dirty = true;
}

/* ---- o fundo: os campos, sebes, matas e flores lá longe mudam de cor ---- */
// materiais do 32-fundo: 4 mata ao longe, 5 pinheiros, 6 prado, 7 plantação, 8 sebes e árvores redondas, 10 flores
const EST_FUNDO = {
  prim: {
    4: ['#2c4846', '#33544e', '#3c6156', '#466e5e', '#517b67', '#5e8971'],
    6: ['#4f7e36', '#5c8d3c', '#6a9d44', '#7aad4d', '#8dbb58', '#a5cb68'],
    7: ['#5f7e34', '#6c8c3a', '#7a9a41', '#89a84a', '#99b554', '#abc260'],
    8: ['#2e5228', '#375e2e', '#416b34', '#4c793a', '#59874a', '#c890b0'],
    10: ['#f4e8f0', '#f1d564', '#f0a0c0', '#e6c0f0', '#ffffff', '#f6b8d0']
  },
  ver: {},
  out1: {
    4: ['#4a3a2c', '#584430', '#674f34', '#765a38', '#85663e', '#937246'],
    6: ['#6e5e26', '#80692a', '#94762e', '#a88232', '#ba8e38', '#c89a40'],
    7: ['#7c5a2c', '#8e6630', '#a07234', '#b27e3a', '#c28a40', '#d09648'],
    8: ['#5a2e16', '#6e3a1a', '#82481e', '#985822', '#ad6a28', '#c07c30'],
    10: ['#c9a070', '#d8a040', '#b06040', '#a08060', '#e0c890', '#d08040']
  },
  out2: {
    4: ['#3e342e', '#4a3e36', '#56483e', '#625246', '#6e5c4e', '#7a6656'],
    6: ['#5e4a2a', '#6c552e', '#7a6034', '#886b3a', '#967640', '#a48248'],
    7: ['#64482c', '#725230', '#805c36', '#8e663c', '#9c7042', '#aa7a48'],
    8: ['#3e3028', '#4a3a30', '#584436', '#6a4e30', '#7e5a30', '#926834'],
    10: ['#9a8060', '#a88a5a', '#8a6a50', '#7a6a5a', '#b8a080', '#a07050']
  },
  inv: {
    4: ['#6a7c90', '#7a8ca0', '#8c9eb0', '#a0b0c2', '#b4c4d4', '#c8d6e4'],
    5: ['#1d3a2b', '#2c4a3a', '#456455', '#7d9890', '#b8cad0', '#e6eef4'],
    6: ['#9aa8c0', '#aab8cc', '#bcc8da', '#ced8e6', '#e0e8f2', '#f2f6fb'],
    7: ['#a0aac0', '#b0bacc', '#c2cad8', '#d4dae4', '#e4eaf0', '#f4f6fa'],
    8: ['#3a3430', '#4a443e', '#5e5852', '#8a8a8e', '#c0c8d2', '#eef2f8'],
    10: ['#e8eef6', '#dfe7f2', '#eef3f9', '#e4ebf4', '#ffffff', '#f2f6fb']
  }
};
// as camadas do 32-fundo que têm vegetação, com os mesmos ajustes de névoa e noite com que foram assadas
const EST_CAMADAS = [[1, 0.8, 1.1], [2, 0.7, 0.75], [3, 0.6, 0.6]];
const EST_PAL_VER = {}; // as paletas de sempre (verão), guardadas antes de qualquer troca
let estFundo = '', estFundoFila = [];
function estPintaFundo(k) {
  if (k === estFundo || !BG.layers.length) return; estFundo = k;
  for (let s = 0; s < BG_STATES; s++) for (const m of [4, 5, 6, 7, 8, 10]) {
    if (!EST_PAL_VER[s + ':' + m]) EST_PAL_VER[s + ':' + m] = BG_PAL[s][m];
    const R = EST_FUNDO[k][m];
    BG_PAL[s][m] = R ? R.map(h => m === 10 && s === 3 ? bgLerp3(bgHex(h), [40, 50, 90], 0.6) : bgTint(bgHex(h), s)) : EST_PAL_VER[s + ':' + m];
  }
  estFundoFila = EST_CAMADAS.slice();
}
// o 32-fundo joga fora o mapa de material/tom/névoa depois de assar; aqui ele fica guardado para assar de novo
{ const _bb = bgBake; bgBake = function (L, hazeK, nightK) {
  const m = L.mat, t = L.tone, h = L.hz, r = _bb(L, hazeK, nightK);
  L.estMat = m; L.estTone = t; L.estHz = h; return r;
}; }
// rebakeia uma camada por quadro, para a troca não engasgar
function estFundoPasso() {
  const c = estFundoFila.shift(); if (!c) return;
  const B = BG.layers[c[0]], L = B && B.L; if (!L || !L.estMat) return;
  L.mat = L.estMat; L.tone = L.estTone; L.hz = L.estHz; bgBake(L, c[1], c[2]);
}

/* ---- neve nos telhados do vilarejo ---- */
// assada uma vez por construção, a partir do próprio desenho: onde o desenho tem céu em cima, cai neve
const estNeveVil = new Map();
function estNeveDe(b) {
  let c = estNeveVil.get(b); if (c) return c;
  const W = b.c.width, H = b.c.height, src = b.c.getContext('2d').getImageData(0, 0, W, H).data;
  c = mk(W, H + 2); const x = c.getContext('2d'), img = x.createImageData(W, H + 2), u = new Uint32Array(img.data.buffer);
  const op = (px, py) => px >= 0 && py >= 0 && px < W && py < H && src[(py * W + px) * 4 + 3] > 0;
  const top = (px, py) => op(px, py) && !op(px, py - 1);
  const N = [ph('#ffffff'), ph('#eef3fa'), ph('#c6d0e2'), ph('#8a98b4')];
  for (let py = 1; py < H; py++) for (let px = 0; px < W; px++) {
    if (!top(px, py)) continue;
    if (!top(px - 1, py) && !top(px + 1, py) && !top(px - 1, py - 1) && !top(px + 1, py - 1) && !top(px - 1, py + 1) && !top(px + 1, py + 1)) continue; // paredes em pé não seguram neve
    const fofo = hash2(px >> 1, py, 71) < 0.45 ? 1 : 0, fundo = 3 + (hash2(px >> 2, py, 72) < 0.5 ? 1 : 0);
    if (fofo) u[(py - 1) * W + px] = N[1];
    for (let k = 0; k < fundo; k++) { const yy = py + k; if (yy >= H + 2 || (k && !op(px, yy))) break; u[yy * W + px] = k === 0 ? N[0] : k === fundo - 1 ? N[3] : N[2]; }
  }
  x.putImageData(img, 0, 0); estNeveVil.set(b, c); return c;
}
{ const _dv = drawVillage; drawVillage = function (cx, cy) {
  _dv(cx, cy);
  if (estChao !== 'inv' || !SPR.vil) return;
  for (const v of VIL_BUILD) { const b = SPR.vil[v.k], [x, y] = bPos(v); if (x - cx > VW || x + b.c.width - cx < 0 || y - cy > VH || y + b.c.height - cy < 0) continue; lc.drawImage(estNeveDe(b), x - cx, y - cy); }
}; }

/* ---- o relógio: confere a estação e repinta o que mudou ---- */
let estUlt = null;   // { s, d } da última checagem
function estAplica(anuncia) {
  const e = estNow(), novo = !estUlt || estUlt.s !== e.s;
  if (estUlt && estUlt.s === e.s && estUlt.d === e.d) return;
  estUlt = e;
  const k = estChaoKey(e); estPintaChao(k); estPintaFundo(k);
  if (novo && anuncia && state === 'play' && !pl.dead && zoneAt(Math.floor((pl.x + 4) / T), Math.floor((pl.y + 10) / T)) === 0) showBanner(EST_NOMES[e.s], 'dia 1 de ' + EST_DIAS);
}
HOOK.update.push(() => { estAplica(true); estFundoPasso(); });
{ const _ri = idleUpdate; idleUpdate = function (dt) { _ri(dt); if (tiles) { estAplica(false); estFundoPasso(); } }; }

/* ---- save ---- */
{ const _nw = newWorld; newWorld = function (sd, sv) {
  _nw(sd, sv);
  // jogo novo: primavera no dia 0. Save sem estação: a primavera começa hoje.
  estOff = sv && sv.est !== undefined && isFinite(+sv.est) ? Math.round(+sv.est) : sv && sv.p ? -Math.floor(worldTime / DAY_LEN + 0.5) : 0;
  estUlt = null; estAplica(false);
}; }
{ const _ms = makeSave; makeSave = function () { const v = _ms(); v.est = estOff; return v; }; }

/* ---- Menu > Testes: pular para a próxima estação ---- */
function estPula() { const e = estNow(); estOff += EST_DIAS - e.d; estAplica(false); saveGame(); }
(function () {
  const list = $('tpList'); if (!list) return;
  const txt = () => 'Estação: ' + EST_NOMES[estNow().s] + ' (pular)';
  new MutationObserver(() => {
    if (!$('btnArmy') || $('btnEstacao')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost'; b.id = 'btnEstacao'; b.textContent = txt();
    b.addEventListener('click', () => { estPula(); b.textContent = txt(); });
    b.addEventListener('pointerenter', () => b.focus({ preventScroll: true }));
    list.insertBefore(b, list.lastElementChild);
  }).observe(list, { childList: true });
})();
