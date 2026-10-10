'use strict';

/* ================= Teodoro, o encantador =================
   Pedido do Jonathan (2026-10-09): as peças da forja saem brancas (48, RARITY_ODDS.forge) e os modificadores vêm daqui.
   O herói leva uma peça e uma pedra preciosa (117-gemas) ao encantador, que sorteia modificadores novos com as chances
   da pedra (GEMS[].odds) e a tabela de modificadores de sempre (AFFIXES do 48). Encantar de novo troca os modificadores.
   O que cai de monstro e de baú continua vindo sorteado.
   - A oficina dele fica à esquerda da forja. O vilarejo ganha 13 blocos de chão plano desse lado (encFlatten, antes da
     catedral ser montada, só pela semente) e `inVillage` passa a cobrir esse pedaço, para ninguém cavar debaixo da casa.
   - Na conversa, "Encantar" abre o livro de profissão no modelo da forja e da alquimia (.prof em estilo.css): à esquerda
     as peças (equipadas, na mochila e no baú), à direita a peça escolhida, as pedras com quantas você tem, as chances
     da pedra escolhida e o botão. A pedra sai da mochila ou do baú (93-reagentes) quando o encanto começa; fechar a
     janela no meio devolve a pedra.
   - As janelas usam o kit dos moradores (css/temas-npc.css) com as texturas da oficina (variáveis --enc-*, cores em
     css/tema-encantador.css); o livro em css/encantador.css.
   Carrega depois do 117-gemas e do 99-cozinha, antes do 24-boot; a wiki carrega também (a janela só nasce ao abrir). */

const RAMP_TEAL = ['#06201e', '#0c3a36', '#13584f', '#1e7d6e', '#33a891', '#8ae8d0'];

/* ---- o chão à esquerda da forja ---- */
const VIL_LEFT = 47;   // the flat ground now reaches this many tiles left of the spawn (the right side stays at VIL_HALF)
function encFlatten() {
  const s0 = surf[SPX], W1 = x => (x + WW) % WW, tgt = new Map();
  for (let k = VIL_HALF + 1; k <= VIL_LEFT; k++) tgt.set(W1(SPX - k), s0);
  for (let k = 1; k <= 10; k++) { const x = W1(SPX - VIL_LEFT - k); tgt.set(x, Math.round(lerp(s0, surf[x], k / 11))); }
  // whole trees standing on this stretch go, so no crown is left hanging
  const seen = new Set(), stack = [];
  for (let k = VIL_HALF + 1; k <= VIL_LEFT + 12; k++) {
    const x = W1(SPX - k);
    for (let y = Math.max(1, s0 - 45); y < s0 + 20; y++) { const i = y * WW + x; if (tiles[i] === TRUNK && !seen.has(i)) { seen.add(i); stack.push(i); } }
  }
  while (stack.length) {
    const i = stack.pop(); tiles[i] = AIR;
    for (const j of [i - 1, i + 1, i - WW, i + WW]) if (j > 0 && j < tiles.length && !seen.has(j) && (tiles[j] === TRUNK || tiles[j] === LEAVES)) { seen.add(j); stack.push(j); }
  }
  for (const [x, ns] of tgt) {
    const os = surf[x];
    if (ns > os) for (let y = os - 1; y < ns; y++) { const i = y * WW + x; tiles[i] = AIR; walls[i] = 0; }
    else if (ns < os) for (let y = ns; y < os; y++) { const i = y * WW + x; tiles[i] = DIRT; walls[i] = y - ns >= 2 ? 1 : 0; }
    const i0 = (ns - 1) * WW + x; if (tiles[i0] === TUFT || tiles[i0] === FLOWER) tiles[i0] = AIR;
    for (let y = ns; y < ns + 6; y++) { const i = y * WW + x; if (!SOLID[tiles[i]] || y < ns + 2) tiles[i] = DIRT; if (y < ns + 2) walls[i] = 0; else if (!walls[i]) walls[i] = 1; }
    tiles[ns * WW + x] = GRASS; surf[x] = ns;
    if (hash2(x, 3, seed) < 0.3) tiles[(ns - 1) * WW + x] = hash2(x, 4, seed) < 0.2 ? FLOWER : TUFT;
  }
}
{ const _bc = buildCathedral; buildCathedral = function () { try { encFlatten(); } catch (err) { console.error(err); } _bc(); }; }
{ const _iv = inVillage; inVillage = function (tx, ty) {
  if (_iv(tx, ty)) return true;
  if (!surf) return false;
  const d = wdx(wrapX(tx) - SPX); return d < -VIL_HALF && d >= -VIL_LEFT && ty < surf[SPX] + 4 && ty >= surf[SPX] - 40;
}; }

/* ---- a oficina: térreo de pedra, andar de enxaimel, telhado de ardósia, uma lente redonda que brilha verde-água ---- */
function bOficina() {
  const b = newB(88, 92), x = b.x;
  // térreo de pedra e o alicerce
  vMasonry(x, 4, 52, 80, 40, 601, { ramps: [RAMP.stoneB, RAMP.stoneBlue], soot: (px, py) => py < 56 ? (56 - py) * 0.25 : 0 });
  vMasonry(x, 2, 86, 84, 6, 602);
  vTex(x, 2, 86, 84, 1, RAMP.stone, (px, py) => 4 + grn(px, py, 603) * 0.8);
  // o andar de cima: reboco entre vigas, avançando um pouco sobre a rua
  vPlaster(x, 6, 30, 76, 22, 604, (px, py) => py < 35 ? (35 - py) * 0.25 : 0);
  vTimber(x, 6, 30, 3, 22, 605); vTimber(x, 42, 30, 3, 22, 606); vTimber(x, 79, 30, 3, 22, 607);
  vTimber(x, 4, 30, 80, 3, 608, false); vTimber(x, 3, 50, 82, 3, 609, false);
  vBrace(x, 9, 47, 18, 34, 2, 610); vBrace(x, 70, 34, 79, 47, 2, 611);
  // telhado e chaminé
  vRoof2(x, 0, 4, 88, 28, 14, 'slate', 612);
  vChimney(b, x, 62, 9, 16, 613);
  // janela comum à esquerda, em cima
  vWindow2(b, x, 21, 36, 12, 10, 614);
  // a lente redonda: aro de ferro, vidro verde-água com reflexos, uma cruz de chumbo
  const LX = 61.5, LY = 41.5;
  vTex(x, 52, 32, 20, 20, RAMP.iron, (px, py) => {
    const r = Math.hypot(px + 0.5 - LX, py + 0.5 - LY);
    if (r > 9.6) return null;
    if (r > 7.6) return (px + 0.5 < LX && py + 0.5 < LY ? 4.4 : 2.2) + grn(px, py, 615) * 0.5;
    if (Math.abs(px + 0.5 - LX) < 0.6 || Math.abs(py + 0.5 - LY) < 0.6) return rampAt(RAMP.iron, 1.4);
    let v = 2.2 + (LY - py) * 0.12 + grn(px, py, 616) * 0.5; if (((px - py) % 7 + 7) % 7 < 2 && px + py < LX + LY) v += 1.5;
    return rampAt(RAMP_TEAL, v);
  });
  b.wins.push([57, 37, 9, 9]); b.lights.push([LX, LY, 0.7]); b.lens = [LX, LY];
  // porta, verga de pedra e degrau
  vTex(x, 46, 63, 18, 3, RAMP.stoneB, (px, py, i, j) => (j === 0 ? 4.2 : j === 2 ? 0.8 : 2.6) + grn(px, py, 617) * 0.7);
  vDoor2(x, 48, 66, 14, 20, RAMP.beam, 618);
  vTex(x, 46, 86, 18, 1, RAMP.stoneB, (px) => 4.2 - (px & 1) * 0.6);
  // a placa: suporte de ferro e uma pedra lapidada pintada na tábua
  vTex(x, 66, 56, 16, 1, RAMP.iron, (px) => px < 70 ? 4 : 2.6); vr(x, RAMP.iron[2], 68, 57, 1, 2); vr(x, RAMP.iron[2], 79, 57, 1, 2);
  vTex(x, 67, 59, 14, 11, RAMP.beam, (px, py, i, j) => (i === 0 || j === 0 ? 4 : i === 13 || j === 10 ? 0.8 : 2.8) + sn(px, py, 12, 160, 619) * 1.1 + grn(px, py, 620) * 0.3);
  vTex(x, 69, 60, 10, 9, RAMP_TEAL, (px, py, i, j) => {
    const cx = i - 4.5; if (j < 3) return Math.abs(cx) <= 2 + j ? (j === 0 ? 5 : (cx < 0 ? 4.6 : 3.4) - (Math.abs(cx) > j + 1 ? 1 : 0)) : null;
    return Math.abs(cx) <= 8 - j ? (cx < -0.5 ? 4 : cx > 0.5 ? 2 : 3.2) - (j - 3) * 0.25 : null;
  });
  // o rebolo de lapidar, à esquerda: armação de madeira, roda de pedra e um balde
  vTimber(x, 12, 76, 2, 10, 621); vTimber(x, 30, 76, 2, 10, 622); vTimber(x, 11, 74, 22, 2, 623, false);
  vTex(x, 15, 62, 14, 14, RAMP.stone, (px, py) => { const r = Math.hypot(px + 0.5 - 22, py + 0.5 - 69); if (r > 6.8) return null; if (r < 1.3) return rampAt(RAMP.iron, 3.6); return (r > 5.8 ? 1.2 : 3.2) + (px < 22 && py < 69 ? 0.8 : 0) + sn(px, py, 160, 160, 624) * 0.6 + grn(px, py, 625) * 0.5; });
  vr(x, RAMP.iron[3], 21, 69, 11, 1); vr(x, RAMP.iron[4], 31, 69, 1, 4);
  vBarrel2(x, 35, 73, 626);
  // pedras verde-água brotando ao pé da parede, do lado da porta
  for (const [cx, h] of [[66, 6], [69, 9], [72, 5], [75, 7]]) vTex(x, cx - 1, 86 - h, 3, h, RAMP_TEAL, (px, py, i, j) => (j < 2 && i !== 1) ? null : (i === 0 ? 4.6 : i === 1 ? 3.4 : 1.8) - (j / h) * 1.2 + grn(px, py, 627) * 0.5);
  b.lights.push([74, 64, 0.35]); b.orb = [74, 64];
  return vFinish(b);
}
BUILDERS.oficina = bOficina;
VIL_BUILD.push({ k: 'lamp', x0: -35.6 }, { k: 'oficina', x0: -46 });

/* ---- a lente e a pedra da placa brilham ---- */
{
  const _glow = drawVillageGlow;
  drawVillageGlow = function (cx, cy) {
    _glow(cx, cy);
    const v = VIL_BUILD.find(q => q.k === 'oficina'), b = SPR.vil && SPR.vil.oficina; if (!v || !b) return;
    const [x, y] = bPos(v); if (x - cx > VW + 40 || x + b.c.width - cx < -40) return;
    const p = 0.75 + Math.sin(gameTime * 1.7) * 0.15, nk = nightK();
    lc.globalCompositeOperation = 'lighter';
    for (const [o, k] of [[b.lens, 0.5 + nk * 0.6], [b.orb, 1]]) {
      const ox = x + 1 + o[0] - cx, oy = y + 1 + o[1] - cy;
      for (const [r, a] of [[10, 0.08], [6, 0.13], [3, 0.24]]) { lc.globalAlpha = a * p * k; lc.fillStyle = '#5ff0cc'; lc.beginPath(); lc.arc(ox, oy, r, 0, Math.PI * 2); lc.fill(); }
    }
    lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over';
  };
}

/* ---- o morador ---- */
const LOUPE = [".kk.", "kGgk", "kggk", ".kk.", ".h..", ".h..", ".h..", ".H.."], LOUPE_P = { k: '#2a2a30', G: '#d8fff2', g: '#33a891', h: '#7a5232', H: '#4a3020' };
NPCS.push({ id: 'encantador', name: 'Teodoro', role: 'o encantador', x: -40.2, face: 1, arm: 2.3, ang: 0.15, item: [LOUPE, LOUPE_P, 1.5, 6], beard: { w: '#a8a8a0', W: '#cfcfc8' },
  pal: { h: '#8e8e88', H: '#b8b8b0', s: '#e0b48e', S: '#b8866a', e: '#1a2420', r: '#1e6e64', R: '#155248', D: '#0e3a34', b: '#5a3a22', B: '#c9a14a' }, legs: { S: '#0e3a34', s: '#155248' }, sleeve: ['#1e6e64', '#155248'] });
{ const n = NPCS[NPCS.length - 1]; n.facing = n.face; n.seed = Math.random() * 10; n.lastP = 0; n.attend = false; }

HELLO.encantador = ['Traga a peça e a pedra. O resto é paciência.', 'Cuidado com a bancada. Tem lasca de safira em tudo.', 'Ferro sem encanto é só ferro. Vamos ver o que dá para acordar nele.'];
CHAT.encantador = [
  'O Grimaldo faz a lâmina. Eu faço ela lembrar de alguma coisa. Juntos sai uma arma.',
  'Topázio acorda pouco: quase sempre um encanto simples. Rubi acorda o que estava dormindo fundo.',
  'Cada camada lá embaixo esconde a sua pedra na rocha. Quanto mais fundo, mais forte ela canta.',
  'Encantar de novo apaga o que havia. A pedra não pede licença ao encanto antigo.',
  'Peça que já nasceu com nome, como a coroa daquele rei, não aceita encanto meu.'
];
{ const _tm = talkMenu; talkMenu = function (n, text) {
  if (n.id !== 'encantador') return _tm(n, text);
  talkSay(text, [['Encantar', () => openEnc(n), true], ['Conversar', () => chat(n)], ['Até logo', closeTalk]]);
}; }

/* ---- as janelas dele: o kit dos moradores com a oficina ---- */
(function makeEncKit() {
  const url = (w, h, f) => { const c = mk(w, h), x = c.getContext('2d'); f(x, w, h); return c.toDataURL(); };
  const T2 = (px, py, s) => hash2(px, py, s) - 0.5;
  const wrapN = (px, py, n, fx, fy, s) => pn(px * 240 / n, py * 4, fx, fy, s) - 0.5;
  const FW = 62, FH = 64, TOP = 16, SIDE = 6, BOT = 8, MID = FW - SIDE * 2;
  // a moldura: ardósia em cima, uma viga, pilares de pedra dos lados, soleira de pedra e pedras verde-água embaixo
  const frame = url(FW, FH, x => {
    for (let py = 0; py < FH; py++) for (let px = 0; px < FW; px++) {
      const wx = ((px - SIDE) % MID + MID) % MID;
      if (py < 11) {
        if (py === 0) { vPix(x, RAMP.slate, 1, px, py); continue; }
        const row = (py - 1) >> 2, lj = (py - 1) & 3, off = (row & 1) * 3, tx = Math.floor((wx + off) / 7), li = (wx + off) % 7;
        let v = (lj === 0 ? 1.3 : lj === 1 ? 3.7 : lj === 2 ? 3.1 : 2.4) + (hash2(tx, row, 1161) - 0.5) * 1.3 + T2(wx, py, 1162) * 0.5;
        if (li === 0) v = lj === 3 ? 0.5 : 1.1; else if (li === 1) v += 0.3;
        if (px === 0 || px === FW - 1) v = 0.5;
        vPix(x, RAMP.slate, v, px, py); continue;
      }
      if (py === 11) { vPix(x, RAMP.beam, 0.3, px, py); continue; }
      if (px < SIDE || px >= FW - SIDE) {
        const i = px < SIDE ? px : px - (FW - SIDE);
        if (i === 0 || i === SIDE - 1) { vPix(x, RAMP.stoneB, 0.2, px, py); continue; }
        const course = Math.floor((py + (i < 3 ? 0 : 2)) / 5);
        let v = 3 + (hash2(course, px < SIDE ? 1 : 2, 1163) - 0.5) * 1.2 + T2(px, py, 1164) * 0.6;
        if ((py + (i < 3 ? 0 : 2)) % 5 === 4) v = 0.8; else if (i === 1) v += 1; else if (i === SIDE - 2) v -= 0.8;
        vPix(x, RAMP.stoneB, v, px, py); continue;
      }
      if (py < TOP) { vPix(x, RAMP.beam, (py === 12 ? 3.8 : py === 15 ? 0.5 : 2.5) + wrapN(wx, py, MID, 6, 60, 1165) * 1.1 + T2(wx, py, 1166) * 0.3, px, py); continue; }
      if (py >= FH - BOT) {
        const j = py - (FH - BOT);
        if (j < 4) { vPix(x, RAMP.stone, (j === 0 ? 4.2 : j === 3 ? 0.6 : 2.7) + (hash2(Math.floor((wx + (j & 1) * 4) / 9), j >> 1, 1171) - 0.5) * 1.1 + ((wx + (j & 1) * 4) % 9 === 0 ? -1.6 : 0) + T2(wx, py, 1172) * 0.6, px, py); continue; }
        if (hash2(wx, 0, 1173) < 0.12) { vPix(x, RAMP_TEAL, 4.4 - (j - 4) * 0.6, px, py); continue; }
        vPix(x, RAMP.dirt, 2.2 + wrapN(wx, py, MID, 10, 60, 1174) * 1.4 + T2(wx, py, 1175) * 0.8 - (j === 4 ? 0.9 : 0), px, py); continue;
      }
      x.clearRect(px, py, 1, 1);
    }
  });
  // por dentro: a pedra da oficina, com prateleiras de potes de pedras brutas
  const GEMC = [RAMP_TEAL, ['#2e1804', '#5a3006', '#8a4e0a', '#c07a12', '#eaa62a', '#ffd46a'], ['#03180c', '#073418', '#0e5a2a', '#18864a', '#2ab86a', '#7ae8a6'], ['#040a2a', '#0a1a5a', '#14308e', '#1e4cc4', '#3a74ec', '#8ab0ff'], ['#2a0208', '#540612', '#86101e', '#b8182c', '#e83048', '#ff8a9a']];
  const wall = url(360, 240, x => {
    vMasonry(x, 0, 0, 360, 240, 1181, { ramps: [RAMP.stoneB, RAMP.stoneBlue] });
    for (const sy of [70, 150]) {
      vTimber(x, 0, sy, 360, 4, 1182 + sy, false);
      for (let bx = 6; bx < 350;) {
        if (hash2(bx, sy, 1186) < 0.25) { bx += 9; continue; }
        const w = 7 + Math.floor(hash2(bx, sy, 1183) * 3), h = 9 + Math.floor(hash2(bx, sy, 1184) * 4), G = GEMC[Math.floor(hash2(bx, sy, 1185) * GEMC.length)];
        // a clay jar with a few rough stones showing at the top
        vTex(x, bx, sy - h, w, h, RAMP.pot, (px, py, i, j) => (j === 0 && (i === 0 || i === w - 1)) ? null : (j === 0 ? 4 : i === 0 ? 3.6 : i === w - 1 ? 1.2 : 2.6) + T2(px, py, 1187) * 0.6);
        vTex(x, bx + 1, sy - h - 2, w - 2, 3, G, (px, py, i, j) => hash2(px, py, 1188) < 0.3 + j * 0.3 ? 4 - j + (i < (w >> 1) ? 0.6 : -0.4) : null);
        bx += w + 3;
      }
    }
  });
  const board = url(60, 14, x => {
    for (let py = 0; py < 14; py++) for (let px = 0; px < 60; px++) {
      let v = 2.4 + (pn(px * 4, py * 240 / 14, 12, 160, 1191) - 0.5) * 1.2 + T2(px, py, 1192) * 0.3;
      if (py === 0) v += 1.4; else if (py === 13) v = 0.4; else if (py === 12) v -= 0.7;
      vPix(x, RAMP_TEAL, v, px, py);
    }
  });
  const small = url(16, 16, x => {
    for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
      const r = Math.min(px, py, 15 - px, 15 - py); if (r >= 5) continue;
      const lit = py === r || px === r;
      let v; if (r === 0 || r === 4) v = 0.2; else if (r === 1) v = lit ? 4.2 : 1; else v = 2.7 + T2(px, py, 1193) * 0.7 - (lit ? 0 : 0.6);
      vPix(x, RAMP.stoneB, v, px, py);
    }
    for (const [X, Y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) { vPix(x, RAMP_TEAL, 5, X, Y); vPix(x, RAMP_TEAL, 1, X + 1, Y + 1); }
  });
  const house = bOficina().c, cut = (sx, sy, w, h) => url(w, h, x => x.drawImage(house, sx, sy, w, h, 0, 0, w, h));
  const R = document.documentElement.style, o = { frame, 'frame-sm': small, wall, board, sign: cut(67, 59, 15, 12), portrait: cut(52, 32, 20, 20) };
  for (const k in o) R.setProperty(`--enc-${k}`, `url(${o[k]})`);
})();

/* ================= o livro de encantamento ================= */
const ENC_T = 1.6;   // seconds the enchantment takes
const ENC_GROUPS = [['eq', 'Equipado'], ['inv', 'Mochila'], ['bau', 'Baú']];
let encNpc = null, encBuilt = false, encSel = null, encGem = null, encFind = '', encShut = {}, ench = null, encDirty = true;
const encOpen = () => !!encNpc && !!$('enc') && !$('enc').hidden;
const encOk = s => { const it = s && ITEMS[s.id]; return !!it && !!it.slot && !it.legend && !it.set && (affixPool(s.id, 'p', 4).length + affixPool(s.id, 's', 4).length) > 0; };
function encItems() {
  const out = [], add = (s, g) => { if (!encOk(s)) return; if (s.uid == null) s.uid = UID++; out.push({ s, g }); };
  for (const k of EQ_SLOTS) add(equip[k], 'eq');
  for (const s of inv) add(s, 'inv');
  if (typeof stash !== 'undefined') for (const s of stash) add(s, 'bau');
  return out;
}
const encPick = () => encItems().find(e => e.s.uid === encSel) || null;
const gemHave = id => typeof reagHave === 'function' ? reagHave(id) : countItem(id);

function buildEncUI() {
  if (encBuilt) return; encBuilt = true;
  const o = document.createElement('div'); o.id = 'enc'; o.className = 'overlay'; o.hidden = true;
  o.innerHTML = `<section class="panel forgep encp" aria-label="Encantamento">
    <header class="ch"><h3>Oficina do Teodoro</h3><button class="ghost sm" id="btnEncBack" type="button">Voltar</button></header>
    <div class="prof">
      <div class="plist">
        <label class="psearch"><input id="encSearch" type="search" placeholder="Procurar" autocomplete="off" spellcheck="false"></label>
        <div class="recipes" id="encList" role="listbox" aria-label="Peças"></div>
      </div>
      <div class="pdet">
        <div class="pdh"><div class="pico"><img id="encIcon" alt=""></div><div><h4 id="encName"></h4><small id="encSub"></small></div></div>
        <div class="pdbody" id="encBody"></div>
        <div class="pwork">
          <div id="encGems"></div>
          <div class="pstate"><canvas id="encCv" width="16" height="12" aria-hidden="true"></canvas><div class="pbar"><i id="encFill"></i><span id="encBarTxt"></span></div></div>
          <p class="pnote" id="encNote"></p>
          <div class="pact"><button id="btnEncGo" type="button">Encantar</button></div>
        </div>
      </div>
    </div>
  </section>`;
  document.body.insertBefore(o, $('forge').nextSibling);
  const p = o.querySelector('.encp');
  p.addEventListener('contextmenu', e => e.preventDefault());
  o.addEventListener('click', e => {
    if (e.target === o) { backFromEnc(); return; }
    const t = e.target;
    const g = t.closest('.pg'); if (g) { encShut[g.dataset.g] = !encShut[g.dataset.g]; sfx.select(); encDirty = true; return; }
    const r = t.closest('.pr'); if (r) { if (ench) return; if (encSel !== +r.dataset.k) { encSel = +r.dataset.k; sfx.select(); encDirty = true; } return; }
    const m = t.closest('.gem'); if (m) { if (ench) return; if (encGem !== m.dataset.g) { encGem = m.dataset.g; sfx.select(); encDirty = true; } return; }
  });
  p.addEventListener('pointermove', e => {
    const r = e.target.closest && e.target.closest('.pr, .gem');
    if (!r) { hideTip(); return; }
    if (r.classList.contains('gem')) encTip(e, 'g|' + r.dataset.g, () => tipHTML({ id: r.dataset.g, n: 1 }, { k: 'inv' }, ''));
    else { const it = encItems().find(q => q.s.uid === +r.dataset.k); if (it) encTip(e, 'i|' + it.s.uid + '|' + it.s.mods.length + (it.s.mods[0] || ''), () => tipHTML(it.s, { k: 'eq' }, '')); }
  });
  p.addEventListener('pointerleave', hideTip);
  $('encSearch').addEventListener('input', e => { encFind = e.target.value.trim().toLowerCase(); encDirty = true; });
  $('encSearch').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { e.target.value = ''; encFind = ''; encDirty = true; e.target.blur(); } });
  $('btnEncGo').addEventListener('click', () => { if (ench) { stopEnc(true); sfx.select(); } else startEnc($('btnEncGo')); });
  $('btnEncBack').addEventListener('click', () => { sfx.select(); backFromEnc(); });
  $('encList').addEventListener('keydown', e => { const r = e.target.closest('.pr'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.click(); } });
  if (typeof customScroll === 'function') { customScroll($('encList')); customScroll($('encBody')); }
}
function openEnc(n) {
  buildEncUI(); encNpc = n;
  if (!encPick()) { const L = encItems(); encSel = L.length ? L[0].s.uid : null; }
  if (!encGem || !GEM_OF[encGem]) encGem = (GEMS.find(g => gemHave(g.id) > 0) || GEMS[0]).id;
  $('talk').hidden = true; $('enc').hidden = false; encDirty = true; refreshEnc();
}
function backFromEnc() {
  hideTip(); if (ench) stopEnc(true); $('enc').hidden = true;
  const n = encNpc; encNpc = null; if (!n) return;
  $('talk').hidden = false; talkMenu(n, pickLine(['Volte quando a pedra certa aparecer.', 'Não deixe o encanto pegar chuva. É brincadeira. Quase.', 'Vá. E traga mais pedras.']));
}
{ const _ct = closeTalk; closeTalk = function () { if (encOpen()) { backFromEnc(); return; } if (encBuilt) { if (ench) stopEnc(true); $('enc').hidden = true; encNpc = null; } _ct(); }; }
function encTip(e, key, html) {
  const tip = $('tip');
  if (tip._key !== key) { tip.innerHTML = html(); tip._key = key; }
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 16, y = e.clientY + 14;
  if (x + w > innerWidth - 8) x = e.clientX - w - 12; if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}

/* ---- encantar: a pedra sai quando começa, o encanto pega quando a barra enche ---- */
function startEnc(el) {
  const e = encPick(), g = GEM_OF[encGem];
  if (!e || !g || !reagTake(g.id, 1)) { bad(el); return; }
  ench = { uid: e.s.uid, gem: g.id, t: 0 }; sfx.select(); encDirty = true; invDirty = true;
}
function stopEnc(refund) { if (!ench) return; if (refund) reagGive(ench.gem, 1); ench = null; encDirty = true; invDirty = true; }
// the stone's odds pick the rarity, then the item gets new modifiers of that tier (48: rollMods)
function enchantItem(s, gemId) {
  const odds = GEM_OF[gemId].odds, rar = pickW(odds.map((w, i) => [i + 1, w]));
  const mods = rollMods(s.id, rar, s.il || baseInfo(s.id).L);
  s.mods = mods; s.rar = modsTier(mods); if (!s.il) s.il = baseInfo(s.id).L;
  return s.rar;
}
function tickEnc(dt) {
  if (!ench) return;
  if (!encOpen()) { stopEnc(true); return; }
  ench.t += dt; if (ench.t < ENC_T) return;
  const e = encItems().find(q => q.s.uid === ench.uid);
  if (!e) { stopEnc(true); return; }
  const rar = enchantItem(e.s, ench.gem); ench = null;
  if (e.g === 'eq') recalc();
  invDirty = true; encDirty = true; hideTip();
  if (rar >= 2) sfx.rare(); else sfx.potion();
  burst(pl.x + pl.w / 2, pl.y + 8, 16, RAR_COL[rar] || '#8ae8d0', 60, -70, 0.7, 1, true);
  toast(`Encantado: ${itemName(e.s)} (${RAR[rar] || RAR[0]})`, rar >= 2 ? 'gold' : '', RAR_COL[rar]);
}
{ const _tf = tickFurnace; tickFurnace = function (dt) { _tf(dt); tickEnc(dt); }; }
{ const _rf = refreshForge; refreshForge = function () { _rf(); refreshEnc(); }; }

/* ---- a pedra na bancada: brilha e solta faíscas enquanto encanta ---- */
function drawGemBench() {
  const cv = $('encCv'), x = cv.getContext('2d'); x.clearRect(0, 0, 16, 12);
  const id = ench ? ench.gem : encGem, it = ITEMS[id], on = !!ench, R = heroRamp(it.ore[1]);
  for (let i = 1; i < 15; i++) { x.fillStyle = i % 4 ? '#3a2a1c' : '#2a1d12'; x.fillRect(i, 10, 1, 2); }   // the bench
  for (let j = 2; j < 10; j++) for (let i = 4; i < 12; i++) {
    const cx = i - 7.5, top = j < 5; if (top ? Math.abs(cx) > j - 0.5 + 1.5 : Math.abs(cx) > 3.5 - (j - 5) * 0.8) continue;
    x.fillStyle = R[Math.max(0, Math.min(5, Math.round((top ? 4.4 : 3) - (cx > 0 ? 1.2 : 0) - (j - 2) * 0.12 + (on ? 0.8 : 0))))]; x.fillRect(i, j, 1, 1);
  }
  if (on) for (let k = 0; k < 5; k++) { const ph = (gameTime * 1.6 + k * 0.21) % 1, a = k * 1.26 + gameTime; x.fillStyle = k % 2 ? R[5] : '#ffffff'; x.fillRect(Math.round(7.5 + Math.cos(a) * (2 + ph * 5)), Math.round(6 - Math.sin(a) * (2 + ph * 4)), 1, 1); }
}
function refreshEnc() {
  if (!encOpen()) return;
  const fill = ench ? ench.t / ENC_T : 0, txt = ench ? 'Encantando' : '';
  const w = pct(Math.round(Math.min(1, fill) * 200) / 200), fe = $('encFill'), te = $('encBarTxt');
  if (fe._w !== w) { fe.style.width = w; fe._w = w; }
  if (te._t !== txt) { te.textContent = txt; te._t = txt; }
  const fk = ench ? Math.floor(gameTime * 12) : -1;
  if (fk !== drawGemBench.k || encDirty) { drawGemBench.k = fk; drawGemBench(); }
  if (!encDirty) return; encDirty = false;
  const all = encItems(), pick = all.find(e => e.s.uid === encSel) || null;
  $('encList').innerHTML = ENC_GROUPS.map(([g, name]) => {
    const items = all.filter(e => e.g === g && (!encFind || itemName(e.s).toLowerCase().includes(encFind))); if (!items.length) return '';
    const shut = encShut[g] && !encFind;
    const head = `<div class="pg${shut ? ' shut' : ''}" data-g="${g}" role="button" tabindex="0"><img src="${ICON[items[0].s.id].url}" alt=""><span>${name}</span><i aria-hidden="true"></i></div>`;
    if (shut) return head;
    return head + items.map(e => { const r = itemRar(e.s), on = e.s.uid === encSel; return `<div class="pr can${on ? ' on' : ''}" data-k="${e.s.uid}" role="option" aria-selected="${on}" tabindex="0"><img src="${ICON[e.s.id].url}" alt=""><span style="color:${RAR_COL[r] || RAR_COL[0]}">${itemName(e.s)}</span></div>`; }).join('');
  }).join('') || `<p class="pnone">${encFind ? 'Nenhuma peça com esse nome.' : 'Nenhuma peça para encantar.'}</p>`;
  const g = GEM_OF[encGem], have = gemHave(g.id);
  const gems = `<div class="gems">${GEMS.map(q => { const n = gemHave(q.id); return `<button type="button" class="gem${q.id === encGem ? ' on' : ''}${n ? '' : ' none'}" data-g="${q.id}" aria-pressed="${q.id === encGem}"><img src="${ICON[q.id].url}" alt=""><span>${ITEMS[q.id].name}</span><b>${n}</b></button>`; }).join('')}</div>`;
  const odds = `<div class="encodds"><i>${g.odds.map((w, i) => w ? `<u style="flex:${w};background:${RAR_COL[i + 1]}"></u>` : '').join('')}</i>${g.odds.map((w, i) => w ? `<span style="color:${RAR_COL[i + 1]}">${RAR[i + 1]} <b>${w}%</b></span>` : '').join('')}</div>`;
  if (pick) {
    const s = pick.s;
    $('encIcon').src = ICON[s.id].url; $('encName').textContent = itemName(s); $('encName').style.color = RAR_COL[itemRar(s)] || RAR_COL[0];
    $('encSub').textContent = ENC_GROUPS.find(q => q[0] === pick.g)[1];
    $('encBody').innerHTML = `<div class="tipbox pdtip">${tipHTML(s, { k: 'eq' }, '')}</div>`;
  } else {
    $('encIcon').removeAttribute('src'); $('encName').textContent = ''; $('encSub').textContent = '';
    $('encBody').innerHTML = '';
  }
  $('encGems').innerHTML = gems + odds;
  $('encNote').textContent = ench ? '' : !pick ? 'Traga uma peça de equipamento.' : !have ? `Falta: 1 ${ITEMS[g.id].name.toLowerCase()}.` : pick.s.mods && pick.s.mods.length ? 'Os encantos de agora serão trocados.' : '';
  const go = $('btnEncGo'); go.textContent = ench ? 'Parar' : 'Encantar'; go.classList.toggle('stop', !!ench); go.disabled = !ench && (!pick || !have);
}
