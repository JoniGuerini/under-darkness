'use strict';

/* ================= Aurélia, a maga do vilarejo =================
   Uma moradora nova, inspirada na Akara do Diablo 2: mora numa torre de pedra no fim da rua, depois da casa do ancião,
   e é quem vende o que é mágico.
   - Vende cajados, varinhas e tomos (js/90-armas-magicas.js), sorteados todo dia como a mercadoria do Grimaldo,
     e os pergaminhos dos feitiços que já existem (Arco Voltaico, Forma de Morcego, Nevasca), só os que o herói ainda não conhece.
   - Compra itens mágicos. O Grimaldo deixa de vender cajado, varinha e tomo: isso agora é com ela.
   - A torre entra no VIL_BUILD entre a casa do ancião e a placa das cavernas (a placa vai um pouco mais para a direita).
   - As janelas de conversa e de loja usam o mesmo kit da Marta e do Odo (css/temas-npc.css), com a pedra azulada e
     a ardósia da torre e os tons violeta dela (variáveis --maga-* geradas aqui).
   Carrega depois de 25-temas-npc (e 27-bau no jogo); a wiki carrega também, para mostrar a torre e a moradora. */

const RAMP_VIOLET = ['#1a0d2e', '#2e1850', '#4a2680', '#6e3cb4', '#9a6ade', '#d2b8ff'];

/* ---- a torre: alvenaria azulada redonda, telhado cônico de ardósia, um pináculo com uma pedra violeta ---- */
function bTorre() {
  const b = newB(64, 124), x = b.x, X0 = 8, W = 48;
  // corpo redondo: a luz bate da esquerda, a curva escurece para a direita
  const round = (px) => { const t = (px - X0) / W; return t > 0.62 ? (t - 0.62) * 3.4 : t < 0.1 ? (0.1 - t) * 6 : 0; };
  vMasonry(x, X0, 44, W, 74, 501, { ramps: [RAMP.stoneBlue, RAMP.stoneB], soot: (px, py) => round(px) + (py < 52 ? (52 - py) * 0.12 : 0) });
  vMasonry(x, 5, 116, 54, 8, 502);
  vTex(x, 5, 116, 54, 1, RAMP.stone, (px, py) => 4 + grn(px, py, 503) * 0.8);
  // uma faixa de pedra lavrada no meio da torre
  vTex(x, X0, 84, W, 3, RAMP.stoneB, (px, py, i, j) => (j === 0 ? 4.2 : j === 2 ? 0.8 : 2.6) + grn(px, py, 504) * 0.7 - round(px));
  // estandarte violeta com uma estrela dourada
  vTex(x, 12, 52, 8, 22, RAMP_VIOLET, (px, py, i, j) => {
    if (j > 18 && Math.abs(i - 3.5) < j - 18) return null;   // a ponta em V
    let v = 2.6 + (i === 0 ? 1 : i === 7 ? -1 : 0) + sn(px, py, 30, 120, 505) * 1.2 + grn(px, py, 506) * 0.4 - j * 0.03;
    const sx = i - 3.5, sy = j - 8;
    if ((Math.abs(sx) < 1 && Math.abs(sy) < 3) || (Math.abs(sy) < 1 && Math.abs(sx) < 3)) return rampAt(RAMP.amber, 4.4 - (sx > 0 ? 1 : 0));
    return v;
  });
  vTimber(x, 11, 50, 10, 2, 507, false);
  // janela alta em arco e uma janelinha mais embaixo
  vTex(x, 25, 54, 14, 3, RAMP.stoneB, (px, py, i, j) => { const r = Math.hypot(i - 6.5, (j - 3) * 2.2); return r > 7.4 ? null : 4 - j * 0.9 + grn(px, py, 508) * 0.7; });
  vWindow2(b, x, 27, 57, 10, 13, 509);
  vWindow2(b, x, 44, 92, 6, 8, 510);
  // porta em arco com verga de pedra e um degrau
  vTex(x, 22, 92, 20, 6, RAMP.stoneB, (px, py, i, j) => { const r = Math.hypot(i - 9.5, (j - 6) * 1.6); return r > 10.4 || r < 7.2 ? null : 3.6 - (r - 7.2) * 0.5 + grn(px, py, 511) * 0.7; });
  vDoor2(x, 25, 98, 14, 18, RAMP.wall, 512);
  vTex(x, 25, 94, 14, 4, RAMP.wall, (px, py, i, j) => Math.hypot(i - 6.5, (j - 4) * 1.6) > 7 ? null : 2 + sn(px, py, 160, 12, 513) * 1.2 + grn(px, py, 514) * 0.3);
  vTex(x, 22, 116, 20, 1, RAMP.stoneB, (px) => 4.2 - (px & 1) * 0.6);
  // a placa: suporte de ferro e uma tábua com a estrela violeta
  vTex(x, 44, 80, 14, 1, RAMP.iron, (px) => px < 48 ? 4 : 2.6); vr(x, RAMP.iron[2], 46, 81, 1, 2); vr(x, RAMP.iron[2], 55, 81, 1, 2);
  vTex(x, 45, 83, 12, 10, RAMP.beam, (px, py, i, j) => (i === 0 || j === 0 ? 4 : i === 11 || j === 9 ? 0.8 : 2.8) + sn(px, py, 12, 160, 518) * 1.1 + grn(px, py, 519) * 0.3);
  vTex(x, 47, 84, 8, 8, RAMP_VIOLET, (px, py, i, j) => { const sx = i - 3.5, sy = j - 3.5, a = Math.abs(sx), c = Math.abs(sy); return (a < 1 && c < 4) || (c < 1 && a < 4) || (a + c < 2.2) ? 4.6 - (sx > 0 || sy > 0 ? 1.2 : 0) : null; });
  // cristais violeta brotando da pedra ao lado da porta
  for (const [cx, h] of [[46, 7], [49, 10], [52, 6]]) vTex(x, cx - 1, 116 - h, 3, h, RAMP_VIOLET, (px, py, i, j) => (j < 2 && i !== 1) ? null : (i === 0 ? 4.4 : i === 1 ? 3.4 : 2) - (j / h) * 1.2 + grn(px, py, 515) * 0.5);
  // telhado cônico e o pináculo
  vRoof2(x, 2, 6, 60, 42, 28, 'slate', 516);
  vTex(x, 31, 2, 2, 5, RAMP.iron, (px, py, i) => (i ? 1.8 : 3.8) + grn(px, py, 517) * 0.5);
  vTex(x, 30, 0, 4, 3, RAMP_VIOLET, (px, py, i, j) => (i === 0 || i === 3) && j !== 1 ? null : 4.6 - (i > 1 ? 1.2 : 0) - j * 0.4);
  b.lights.push([32, 1, 0.45]); b.orb = [32, 1];
  return vFinish(b);
}
BUILDERS.torre = bTorre;
VIL_BUILD.find(v => v.k === 'sign').x0 = 33.2;
VIL_BUILD.splice(VIL_BUILD.findIndex(v => v.k === 'sign'), 0, { k: 'torre', x0: 27.6 });

/* ---- a pedra do pináculo brilha de noite e de dia ---- */
{
  const _glow = drawVillageGlow;
  drawVillageGlow = function (cx, cy) {
    _glow(cx, cy);
    const v = VIL_BUILD.find(q => q.k === 'torre'), b = SPR.vil && SPR.vil.torre; if (!v || !b || !b.orb) return;
    const [x, y] = bPos(v), ox = x + 1 + b.orb[0] - cx, oy = y + 1 + b.orb[1] - cy; if (ox < -40 || ox > VW + 40) return;
    const p = 0.75 + Math.sin(gameTime * 2.1) * 0.15;
    lc.globalCompositeOperation = 'lighter';
    for (const [r, a] of [[9, 0.1], [5, 0.16], [2.5, 0.3]]) { lc.globalAlpha = a * p; lc.fillStyle = '#b88aff'; lc.beginPath(); lc.arc(ox, oy, r, 0, Math.PI * 2); lc.fill(); }
    lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over';
  };
}

/* ---- a moradora ---- */
const MAGA_STAFF_P = { k: '#2a1a2a', G: '#f4e6ff', g: '#b88aff', h: '#3e2c40', H: '#2a1a2a' };
NPCS.push({ id: 'maga', name: 'Aurélia', role: 'a maga', x: 29.1, face: -1, arm: 2.0, ang: 0.05, item: [STAFF, MAGA_STAFF_P, 1.5, 8], hood: { c: '#3a2058', C: '#5a3486' },
  pal: { h: '#d8d0e0', H: '#f0eaf4', s: '#e8b894', S: '#c08a66', e: '#2a1a22', r: '#5a3486', R: '#432668', D: '#2c1848', b: '#c9a14a', B: '#f0d080' }, legs: { S: '#2c1848', s: '#432668' }, sleeve: ['#5a3486', '#432668'] });
{ const n = NPCS[NPCS.length - 1]; n.facing = n.face; n.seed = Math.random() * 10; n.lastP = 0; n.attend = false; }
{
  // na mão dela vai o Cajado de Cristal de verdade, pintado como os da loja
  const _buildNpcLooks = buildNpcLooks;
  buildNpcLooks = function () {
    _buildNpcLooks();
    const n = NPCS.find(q => q.id === 'maga'); if (n && n.look) Object.assign(n.look, { item: magPaint(STAFF_ROWS, MAG_PAL.cristal, 61), px: 3.5, py: 14 });
  };
}

HELLO.maga = ['Entre devagar. Os livros não gostam de vento.', 'Sinto magia em você. Ou é só fumaça de tocha?', 'A torre fica aberta para quem traz perguntas. E ouro.'];
CHAT.maga = [
  'Um cajado pede as duas mãos, mas devolve em dobro quando o feitiço sai. A varinha deixa a outra mão livre para um tomo.',
  'Tomo não segura golpe. Quem carrega um confia que o inimigo não vai chegar perto.',
  'Copiei esses pergaminhos à mão, à luz de vela. Lido uma vez, o feitiço fica em você e o papel vira cinza.',
  'A mana volta sozinha, devagar. Um bom tomo faz caber mais dela em você.',
  'O Caetano acha que magia é coisa de monge. Os monges cavaram fundo demais justamente porque não sabiam nenhuma.'
];

/* ---- a loja ---- */
SHOPS.maga = { title: 'Torre da Aurélia', buys: id => isMagicItem(id), hint: 'Vende cajados, varinhas, tomos e pergaminhos de feitiço. Compra itens mágicos.' };
// os pergaminhos já identificados: lidos com o botão direito, ensinam na hora (js/64, 66 e 68)
const MAGA_SCROLLS = [['perg_arco', 'feitico_arco', 60], ['perg_morcego', 'feitico_morcego', 80], ['perg_nevasca', 'feitico_nevasca', 100]];
// os cinco de fogo (js/112-fogo-dados.js)
if (typeof FOGO_LIST !== 'undefined') for (const [k, price] of [['bola', 70], ['inferno', 90], ['parede', 90], ['meteoro', 120], ['hidra', 110]]) MAGA_SCROLLS.push(['perg_' + k, 'feitico_' + k, price]);
// os quatro novos de raio e os quatro novos de gelo (js/114-escolas-dados.js)
if (typeof ESC_LIST !== 'undefined') for (const [k, price] of [['relampago', 90], ['lanca_raio', 70], ['passo', 90], ['pararaios', 100], ['lanca_gelo', 70], ['nova_gelo', 90], ['estacas', 90], ['orbe', 120]]) MAGA_SCROLLS.push(['perg_' + k, 'feitico_' + k, price]);
const MAGA_LOOT = { 1: ['varinha_salgueiro', 'tomo_couro', 'cajado_freixo'], 2: ['varinha_osso', 'tomo_osso', 'cajado_osso'], 3: ['varinha_cristal', 'tomo_prata', 'cajado_cristal'] };
const magaScrolls = all => MAGA_SCROLLS.filter(([p, f]) => ITEMS[p] && (all || !inv.some(q => q && q.id === f))).map(([p, , price]) => ({ s: { id: p, n: 1 }, price, inf: true }));
{
  const _restock = restock;
  restock = function () {
    _restock();
    stock.ferreiro = (stock.ferreiro || []).filter(g => !isMagicItem(g.s.id));
    const t = tierNow(), gear = [];
    for (let k = 0; k < 8; k++) {
      const tier = clamp(t - (Math.random() < 0.35 ? 1 : 0), 1, 3), pool = MAGA_LOOT[1].concat(tier >= 2 ? MAGA_LOOT[2] : [], tier >= 3 ? MAGA_LOOT[3] : []);
      const s = rollItem(pool[Math.floor(Math.random() * pool.length)], tier + (Math.random() < 0.25 ? 1 : 0), 'shop'); gear.push({ s, price: itemValue(s) });
    }
    gear.sort((a, b) => ITEMS[a.s.id].slot.localeCompare(ITEMS[b.s.id].slot) || a.price - b.price);
    stock.maga = magaScrolls(true).concat(gear);
  };
  // ao abrir a loja, só os pergaminhos dos feitiços que o herói ainda não aprendeu
  const _openShop = openShop;
  openShop = function (n) {
    if (n && n.id === 'maga') { if (dayNow() !== shopDay || !stock.ferreiro) restock(); stock.maga = magaScrolls(false).concat((stock.maga || []).filter(g => !g.inf)); }
    return _openShop(n);
  };
}

/* ---- as janelas dela: o kit da Marta e do Odo (css/temas-npc.css) com a torre ---- */
(function makeMagaKit() {
  const url = (w, h, f) => { const c = mk(w, h), x = c.getContext('2d'); f(x, w, h); return c.toDataURL(); };
  const T2 = (px, py, s) => hash2(px, py, s) - 0.5;
  const wrapN = (px, py, n, fx, fy, s) => pn(px * 240 / n, py * 4, fx, fy, s) - 0.5;
  const FW = 62, FH = 64, TOP = 16, SIDE = 6, BOT = 8, MID = FW - SIDE * 2;
  // a moldura: ardósia em cima, uma viga, colunas de pedra azulada dos lados, soleira de pedra e cristais embaixo
  const frame = url(FW, FH, x => {
    for (let py = 0; py < FH; py++) for (let px = 0; px < FW; px++) {
      const wx = ((px - SIDE) % MID + MID) % MID;
      if (py < 11) {
        if (py === 0) { vPix(x, RAMP.slate, 1, px, py); continue; }
        const row = (py - 1) >> 2, lj = (py - 1) & 3, off = (row & 1) * 3, tx = Math.floor((wx + off) / 7), li = (wx + off) % 7;
        let v = (lj === 0 ? 1.3 : lj === 1 ? 3.7 : lj === 2 ? 3.1 : 2.4) + (hash2(tx, row, 1061) - 0.5) * 1.3 + T2(wx, py, 1062) * 0.5;
        if (li === 0) v = lj === 3 ? 0.5 : 1.1; else if (li === 1) v += 0.3;
        if (px === 0 || px === FW - 1) v = 0.5;
        vPix(x, RAMP.slate, v, px, py); continue;
      }
      if (py === 11) { vPix(x, RAMP.beam, 0.3, px, py); continue; }
      if (px < SIDE || px >= FW - SIDE) {
        const i = px < SIDE ? px : px - (FW - SIDE);
        if (i === 0 || i === SIDE - 1) { vPix(x, RAMP.stoneBlue, 0.2, px, py); continue; }
        const course = Math.floor((py + (i < 3 ? 0 : 2)) / 5);
        let v = 3 + (hash2(course, px < SIDE ? 1 : 2, 1063) - 0.5) * 1.2 + T2(px, py, 1064) * 0.6;
        if ((py + (i < 3 ? 0 : 2)) % 5 === 4) v = 0.8; else if (i === 1) v += 1; else if (i === SIDE - 2) v -= 0.8;
        vPix(x, RAMP.stoneBlue, v, px, py); continue;
      }
      if (py < TOP) { vPix(x, RAMP.beam, (py === 12 ? 3.8 : py === 15 ? 0.5 : 2.5) + wrapN(wx, py, MID, 6, 60, 1065) * 1.1 + T2(wx, py, 1066) * 0.3, px, py); continue; }
      if (py >= FH - BOT) {
        const j = py - (FH - BOT);
        if (j < 4) { vPix(x, RAMP.stone, (j === 0 ? 4.2 : j === 3 ? 0.6 : 2.7) + (hash2(Math.floor((wx + (j & 1) * 4) / 9), j >> 1, 1071) - 0.5) * 1.1 + ((wx + (j & 1) * 4) % 9 === 0 ? -1.6 : 0) + T2(wx, py, 1072) * 0.6, px, py); continue; }
        if (hash2(wx, 0, 1073) < 0.12 && j >= 4) { vPix(x, RAMP_VIOLET, 4.2 - (j - 4) * 0.6, px, py); continue; }   // um cristal aqui e ali
        vPix(x, RAMP.dirt, 2.2 + wrapN(wx, py, MID, 10, 60, 1074) * 1.4 + T2(wx, py, 1075) * 0.8 - (j === 4 ? 0.9 : 0), px, py); continue;
      }
      x.clearRect(px, py, 1, 1);
    }
  });
  // por dentro: a alvenaria da torre, com prateleiras de livros
  const wall = url(360, 240, x => {
    vMasonry(x, 0, 0, 360, 240, 1081, { ramps: [RAMP.stoneBlue, RAMP.stoneB] });
    for (const sy of [70, 150]) {
      vTimber(x, 0, sy, 360, 4, 1082 + sy, false);
      for (let bx = 4; bx < 356;) {
        const bw = 3 + Math.floor(hash2(bx, sy, 1083) * 3), bh = 12 + Math.floor(hash2(bx, sy, 1084) * 8), P = [RAMP_VIOLET, RAMP.leather, RAMP.green, RAMP.clay][Math.floor(hash2(bx, sy, 1085) * 4)];
        if (hash2(bx, sy, 1086) < 0.12) { bx += 6; continue; }
        vTex(x, bx, sy - bh, bw, bh, P, (px, py, i, j) => (i === 0 ? 3.4 : i === bw - 1 ? 1 : 2.4) + (j === 3 || j === bh - 4 ? 1.4 : 0) + T2(px, py, 1087) * 0.5);
        bx += bw;
      }
    }
  });
  const board = url(60, 14, x => {
    for (let py = 0; py < 14; py++) for (let px = 0; px < 60; px++) {
      let v = 2.4 + (pn(px * 4, py * 240 / 14, 12, 160, 1091) - 0.5) * 1.2 + T2(px, py, 1092) * 0.3;
      if (py === 0) v += 1.4; else if (py === 13) v = 0.4; else if (py === 12) v -= 0.7;
      vPix(x, RAMP_VIOLET, v, px, py);
    }
  });
  const small = url(16, 16, x => {
    for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
      const r = Math.min(px, py, 15 - px, 15 - py); if (r >= 5) continue;
      const lit = py === r || px === r;
      let v; if (r === 0 || r === 4) v = 0.2; else if (r === 1) v = lit ? 4.2 : 1; else v = 2.7 + T2(px, py, 1093) * 0.7 - (lit ? 0 : 0.6);
      vPix(x, RAMP.stoneBlue, v, px, py);
    }
    for (const [X, Y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) { vPix(x, RAMP_VIOLET, 4.8, X, Y); vPix(x, RAMP_VIOLET, 1, X + 1, Y + 1); }
  });
  const house = bTorre().c, cut = (sx, sy, w, h) => url(w, h, x => x.drawImage(house, sx, sy, w, h, 0, 0, w, h));
  const R = document.documentElement.style, o = { frame, 'frame-sm': small, wall, board, sign: cut(45, 83, 14, 12), portrait: cut(23, 53, 18, 20) };
  for (const k in o) R.setProperty(`--maga-${k}`, `url(${o[k]})`);
})();
