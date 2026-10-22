'use strict';

/* ================= runas: o tabuleiro de aperfeiçoamento em jogo (dados em js/340 e 420-422) =================
   - Na conversa com a Aurélia, "Runas" abre o tabuleiro no meio da tela. À esquerda ficam as runas dos feitiços que o
     herói conhece (os 15 têm tabuleiro); clicar numa (ou arrastar até o encaixe) põe a runa no centro. Clicar no
     encaixe tira a runa. O tabuleiro pega as cores do elemento da runa (raio, gelo, fogo).
   - Clique num nó gasta 1 ponto nele; botão direito devolve 1 ponto (só se nenhum nó que sai dele depender disso).
     "Recomeçar" devolve todos os pontos da runa. O aro de cada nó mostra os pontos: um gomo aceso por ponto.
   - Cada inimigo que o feitiço acerta dá experiência à runa (js/423); cada nível dá 1 ponto.
   - O que vai no save (chave `runas`): { [id do feitiço]: { xp, lvl, n: { [nó]: pontos } } }, por personagem.
     Nó que ficou sem o pai (save de antes da árvore nova) devolve os pontos.
   - O que cada nó faz em jogo mora em js/423-runas-efeitos (comuns) e js/424-runas-feiticos (próprios, e o castArc).
   - Menu > Testes, aba Outros (339-testes), dá +5 pontos de runa para testar o tabuleiro sem caçar.
   Carrega depois do 121-pergaminhos (usa knowsSpell e embrulha talkMenu, closeTalk, newWorld e makeSave). */

let runes = {}, runSel = null, runBuilt = false, runNpc = null, runHover = null, runDirty = true;
const runOf = id => runes[id] || (runes[id] = { xp: 0, lvl: 0, n: {} });
const runSpent = id => { const r = runOf(id); let s = 0; for (const k in r.n) s += r.n[k] | 0; return s; };
const runPts = id => runOf(id).lvl - runSpent(id);
const runOpen = () => runBuilt && !$('runas').hidden;
function runApply(id) { const B = RUNE_BOARDS[id]; if (B) B.apply(runOf(id).n); }
function runApplyAll() { for (const id in RUNE_BOARDS) runApply(id); }

sfx.runUp = function () { [523, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.05, 0, i * 0.06)); noise(0.2, 0.06, 5000, 'highpass', 0.08); };
sfx.runDown = function () { tone(392, 0.12, 'triangle', 0.04, -120); };
sfx.runLvl = function () { [659, 880, 1318, 1760].forEach((f, i) => tone(f, 0.22, 'triangle', 0.05, 0, i * 0.07)); };

/* ---- experiência da runa ---- */
function runGain(id, n) {
  const B = RUNE_BOARDS[id]; if (!B || n <= 0) return;
  const r = runOf(id); if (r.lvl >= B.maxLvl) return;
  r.xp += n; let up = 0;
  while (r.lvl < B.maxLvl && r.xp >= RUNE_XP(r.lvl)) { r.xp -= RUNE_XP(r.lvl); r.lvl++; up++; }
  if (r.lvl >= B.maxLvl) r.xp = 0;
  if (up) sfx.runLvl();
  runDirty = true;
}

/* ---- pôr e tirar pontos ---- */
const runReq = (B, q, n) => !q.parent || (n[q.parent] | 0) > 0;
function runAdd(id, k) {
  const B = RUNE_BOARDS[id], q = B && B.byK[k]; if (!q) return false;
  const n = runOf(id).n;
  if ((n[k] | 0) >= q.max || runPts(id) <= 0 || !runReq(B, q, n)) return false;
  n[k] = (n[k] | 0) + 1; runApply(id); runDirty = true; return true;
}
function runSub(id, k) {
  const B = RUNE_BOARDS[id], n = runOf(id).n; if (!B || !(n[k] > 0)) return false;
  if (n[k] === 1 && B.nodes.some(q => q.parent === k && (n[q.k] | 0) > 0)) return false;
  n[k]--; if (!n[k]) delete n[k]; runApply(id); runDirty = true; return true;
}
function runReset(id) { if (!runSpent(id)) return false; runOf(id).n = {}; runApply(id); runDirty = true; return true; }

/* ---- save: por personagem ---- */
{
  const _nw = newWorld;
  newWorld = function (sd, sv) {
    _nw(sd, sv); runes = {};
    const o = sv && sv.runas;
    if (o && typeof o === 'object') for (const id in o) {
      const B = RUNE_BOARDS[id], r = o[id]; if (!B || !r) continue;
      const n = {}; for (const q of B.nodes) { const v = Math.round(+((r.n || {})[q.k]) || 0); if (v > 0) n[q.k] = Math.min(q.max, v); }
      for (let again = true; again;) { again = false; for (const k in n) { const p = B.byK[k].parent; if (p && !n[p]) { delete n[k]; again = true; } } }
      runes[id] = { xp: Math.max(0, +r.xp || 0), lvl: clamp(Math.round(+r.lvl || 0), 0, B.maxLvl), n };
      if (runSpent(id) > runes[id].lvl) runes[id].n = {};
    }
    runApplyAll(); runSel = null; runDirty = true;
  };
  const _ms = makeSave;
  makeSave = function () { const v = _ms(); const o = {}; for (const id in runes) { const r = runes[id]; if (r.lvl || r.xp) o[id] = { xp: Math.round(r.xp), lvl: r.lvl, n: r.n }; } if (Object.keys(o).length) v.runas = o; return v; };
}
runApplyAll();

/* ---- a conversa da Aurélia ganha "Runas" ---- */
{ const _tm = talkMenu; talkMenu = function (n, text) {
  if (!n || n.id !== 'maga') return _tm(n, text);
  const ts = talkSay;
  talkSay = function (t, o) { talkSay = ts; const i = o.findIndex(q => q[0] === 'Identificar pergaminhos'); o.splice(i >= 0 ? i + 1 : 1, 0, ['Runas', () => openRunes(n), true]); return ts(t, o); };
  try { return _tm(n, text); } finally { talkSay = ts; }
}; }

/* ---- a janela ---- */
const RB_W = 400, RB_H = 300, RB_CX = 200, RB_CY = 150, RB_NR = 10, RB_SR = 18;
const runKnown = () => Object.keys(RUNE_BOARDS).filter(id => ITEMS[id] && knowsSpell(id));
function buildRunUI() {
  if (runBuilt) return; runBuilt = true;
  const o = document.createElement('div'); o.id = 'runas'; o.className = 'overlay'; o.hidden = true;
  o.innerHTML = `<section class="panel runp" aria-label="Runas">
    <header class="ch"><h3>Runas</h3><span id="runPts"></span><button class="ghost sm" id="btnRunBack" type="button">Voltar</button></header>
    <div class="rbody">
      <div class="rlist" id="runList" aria-label="Runas"></div>
      <div class="rboard"><canvas id="runCv" width="${RB_W}" height="${RB_H}"></canvas></div>
    </div>
    <footer class="rfoot"><span id="runLvl"></span><div class="pbar"><i id="runFill"></i><span id="runXp"></span></div><button class="ghost" id="btnRunReset" type="button">Recomeçar</button></footer>
  </section>`;
  document.body.appendChild(o);
  const p = o.querySelector('.runp'), cv = $('runCv');
  p.addEventListener('contextmenu', e => e.preventDefault());
  o.addEventListener('click', e => { if (e.target === o) backFromRunes(); });
  $('btnRunBack').addEventListener('click', () => { sfx.select(); backFromRunes(); });
  $('btnRunReset').addEventListener('click', () => { if (runSel && runReset(runSel)) { sfx.runDown(); saveGame(); } else bad($('btnRunReset')); });
  // a lista: clicar põe a runa no centro; arrastar até o tabuleiro também
  let drag = null;
  $('runList').addEventListener('pointerdown', e => {
    const d = e.target.closest('.rslot[data-id]'); if (!d || e.button !== 0) return;
    drag = { id: d.dataset.id, x: e.clientX, y: e.clientY, g: null };
  });
  addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.g && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) { drag.g = document.createElement('img'); drag.g.className = 'rdrag'; drag.g.src = ICON[drag.id].url; document.body.appendChild(drag.g); }
    if (drag.g) { drag.g.style.left = e.clientX + 'px'; drag.g.style.top = e.clientY + 'px'; }
  });
  addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag; drag = null; if (d.g) d.g.remove();
    const r = cv.getBoundingClientRect(), on = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!d.g || on) runPlace(d.id);
  });
  // o tabuleiro: o nó ou o encaixe debaixo do mouse
  const at = e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * RB_W / r.width - RB_CX, y = (e.clientY - r.top) * RB_H / r.height - RB_CY;
    if (Math.hypot(x, y) <= RB_SR + 2) return { socket: true };
    const B = runSel && RUNE_BOARDS[runSel]; if (!B) return null;
    let best = null, bd = RB_NR + 2;
    for (const q of B.nodes) { const d = Math.hypot(x - q.x, y - q.y); if (d <= bd) { bd = d; best = q; } }
    return best ? { q: best } : null;
  };
  cv.addEventListener('pointermove', e => {
    const h = at(e), k = h ? (h.socket ? 'socket' : h.q.k) : null;
    if (k !== runHover) { runHover = k; runDirty = true; }
    cv.style.cursor = h && (h.q || runSel) ? 'pointer' : '';
    if (h && h.q) runTip(e, h.q); else hideTip();
  });
  cv.addEventListener('pointerleave', () => { runHover = null; runDirty = true; hideTip(); });
  cv.addEventListener('pointerdown', e => {
    const h = at(e); if (!h) return;
    if (h.socket) { if (runSel && e.button === 0) { runSel = null; sfx.runDown(); runDirty = true; runList(); hideTip(); } return; }
    if (e.button === 2) { if (runSub(runSel, h.q.k)) { sfx.runDown(); saveGame(); } else bad(null); }
    else if (e.button === 0) { if (runAdd(runSel, h.q.k)) { sfx.runUp(); saveGame(); } else bad(null); }
    runTip(e, h.q);
  });
  if (typeof customScroll === 'function') customScroll($('runList'));
}
function runPlace(id) {
  if (!RUNE_BOARDS[id] || runSel === id) return;
  runSel = id; sfx.select(); runDirty = true; runList();
}
function runList() {
  const L = runKnown();
  $('runList').innerHTML = L.map(id => `<div class="rslot el-${RUNE_BOARDS[id].elem}${id === runSel ? ' on' : ''}" data-id="${id}" title=""><img src="${ICON[id].url}" alt="" draggable="false"></div>`).join('');
  $('runas').dataset.el = runSel ? RUNE_BOARDS[runSel].elem : '';
}
function openRunes(n) {
  buildRunUI(); runNpc = n;
  const L = runKnown(); if (!L.includes(runSel)) runSel = null;
  runList(); $('talk').hidden = true; $('runas').hidden = false; runDirty = true; runFx.t0 = performance.now(); runLoop();
}
function backFromRunes() {
  hideTip(); $('runas').hidden = true;
  const n = runNpc; runNpc = null; if (!n) return;
  $('talk').hidden = false; talkMenu(n, pickLine(['A runa lembra de cada inimigo que tocou. Por isso cresce.', 'Volte quando ela tiver mais para mostrar.', 'Não force a runa. Ela escolhe o caminho junto com você.']));
}
{ const _ct = closeTalk; closeTalk = function () { if (runOpen()) { backFromRunes(); return; } if (runBuilt) { $('runas').hidden = true; runNpc = null; } _ct(); }; }

function runTip(e, q) {
  const id = runSel, B = RUNE_BOARDS[id], n = runOf(id).n, r = n[q.k] | 0, ok = runReq(B, q, n);
  const lines = [`<li><span>Agora</span><b>${q.val(r)}</b></li>`];
  if (r < q.max) lines.push(`<li><span>Próximo</span><b style="color:${B.col.Y}">${q.val(r + 1)}</b></li>`);
  const html = `<span class="tn" style="color:${B.col.Y}">${q.name}</span><small>${r} / ${q.max}${ok ? '' : ` · Precisa de ${B.byK[q.parent].name}`}</small><ul>${lines.join('')}</ul>`;
  const tip = $('tip'), key = 'run|' + id + '|' + q.k + '|' + r + '|' + ok;
  if (tip._key !== key) { tip.innerHTML = html; tip._key = key; }
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 16, y = e.clientY + 14;
  if (x + w > innerWidth - 8) x = e.clientX - w - 12; if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}

/* ---- desenho do tabuleiro: pedra escura com grão, sulcos entalhados que acendem, medalhões e o encaixe ----
   As cores acesas vêm do elemento da runa (B.col, js/340): azul no raio, gelo no gelo, brasa no fogo. */
const runFx = { t0: 0 };
let runBg = null;
const RB_STONE = ['#07060c', '#0e0b16', '#151120', '#1d1830', '#2a2342', '#3a3058', '#4e4274'];
const RB_RIM = { can: ['#8a7ab8', '#5a4a88', '#2e2448'], ok: ['#5e5478', '#3a3058', '#1d1830'], no: ['#3a3448', '#26203a', '#120e1c'] };
const RB_ICO = { ok: { W: '#c8bce8', Y: '#9a8cc4', O: '#6e5a9c', R: '#4a3a70' }, no: { W: '#5e5478', Y: '#4a4064', O: '#3a3050', R: '#2a2240' } };
const rbCol = v => RB_STONE[clamp(Math.round(v), 0, RB_STONE.length - 1)];
function runPaintBg() {
  const c = mk(RB_W, RB_H), x = c.getContext('2d');
  // três sulcos em elipse entre os anéis de nós (o tabuleiro é mais largo que alto, RB_EX)
  for (let j = 0; j < RB_H; j++) for (let i = 0; i < RB_W; i++) {
    const d = Math.hypot((i - RB_CX) / RB_EX, j - RB_CY);
    let v = 2.2 - d / 140 + (hash2(i, j, 341) - 0.5) * 0.9 + (pn(i * 2, j * 2, 24, 20, 342) - 0.5) * 1.4;
    for (const R of [42, 90, 137]) { const k = Math.abs(d - R); if (k < 0.8) v -= 1.4; else if (k < 1.8 && d > R) v += 0.9; }
    x.fillStyle = rbCol(v); x.fillRect(i, j, 1, 1);
  }
  // marcas de runa no sulco do meio
  for (let a = 0; a < 22; a++) {
    const ang = a / 22 * Math.PI * 2 + 0.2, px = Math.round(RB_CX + Math.cos(ang) * 90 * RB_EX), py = Math.round(RB_CY + Math.sin(ang) * 90), g = Math.floor(hash2(a, 0, 343) * 3);
    x.fillStyle = RB_STONE[0];
    if (g === 0) { x.fillRect(px - 1, py - 2, 1, 5); x.fillRect(px, py - 2, 2, 1); x.fillRect(px, py, 2, 1); }
    else if (g === 1) { x.fillRect(px - 2, py - 2, 1, 5); x.fillRect(px + 1, py - 2, 1, 5); x.fillRect(px - 1, py, 2, 1); }
    else { x.fillRect(px, py - 2, 1, 5); x.fillRect(px - 2, py - 1, 1, 1); x.fillRect(px + 2, py - 1, 1, 1); x.fillRect(px - 1, py + 1, 3, 1); }
    x.fillStyle = RB_STONE[4]; x.fillRect(px + 1, py + 3, 1, 1);
  }
  return c;
}
// o mesmo jeito de traçar linha pixel a pixel do raio (js/64)
function rbLine(x, x0, y0, x1, y1, w, col) { x.fillStyle = col; arcLine(x0, y0, x1, y1, (px, py) => x.fillRect(px - (w >> 1), py - (w >> 1), w, w)); }
function rbDisc(x, cx, cy, r, f) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = Math.hypot(i, j); if (d > r + 0.3) continue; const c = f(i, j, d); if (c) { x.fillStyle = c; x.fillRect(cx + i, cy + j, 1, 1); } } }
function runDraw() {
  const cv = $('runCv'), x = cv.getContext('2d'), t = (performance.now() - runFx.t0) / 1000;
  if (!runBg) runBg = runPaintBg();
  x.imageSmoothingEnabled = false; x.drawImage(runBg, 0, 0);
  const id = runSel, B = id && RUNE_BOARDS[id], n = id ? runOf(id).n : {}, pts = id ? runPts(id) : 0, C = B ? B.col : RUNE_COL.raio;
  const P = q => q.parent ? B.byK[q.parent] : { x: 0, y: 0 };
  if (B) {
    // os sulcos: escuros quando vazios, na cor do elemento quando o nó da ponta tem ponto, com uma faísca correndo
    for (const q of B.nodes) {
      const p = P(q), x0 = RB_CX + p.x, y0 = RB_CY + p.y, x1 = RB_CX + q.x, y1 = RB_CY + q.y, on = (n[q.k] | 0) > 0;
      rbLine(x, x0, y0 + 1, x1, y1 + 1, 3, RB_STONE[4]);
      rbLine(x, x0, y0, x1, y1, 3, RB_STONE[0]);
      if (on) {
        rbLine(x, x0, y0, x1, y1, 3, C.R); rbLine(x, x0, y0, x1, y1, 1, C.Y);
        const k = (t * 1.3 + (q.x + q.y) * 0.01) % 1, sx = Math.round(x0 + (x1 - x0) * k), sy = Math.round(y0 + (y1 - y0) * k);
        x.fillStyle = C.W; x.fillRect(sx - 1, sy, 3, 1); x.fillRect(sx, sy - 1, 1, 3);
      }
    }
    // os medalhões: o aro tem um gomo por ponto possível, aceso até os pontos que o nó tem
    for (const q of B.nodes) {
      const r = n[q.k] | 0, ok = runReq(B, q, n), can = ok && r < q.max && pts > 0, cx = RB_CX + q.x, cy = RB_CY + q.y, hov = runHover === q.k;
      const rim = can ? RB_RIM.can : ok ? RB_RIM.ok : RB_RIM.no, lit = [C.Y, C.O, C.R];
      const glowA = r ? 0.35 + 0.12 * Math.sin(t * 3 + q.x) : can ? 0.18 + 0.1 * Math.sin(t * 4) : 0;
      if (glowA > 0) rbDisc(x, cx, cy, RB_NR + 3, (i, j, d) => d > RB_NR && hash2(i, j, 344 + Math.floor(t * 8)) < glowA ? (r ? C.O : '#6e5aa8') : null);
      rbDisc(x, cx, cy, RB_NR, (i, j, d) => {
        if (d > RB_NR - 1.2) return '#05040a';
        if (d > RB_NR - 3) {
          const a = (Math.atan2(j, i) + Math.PI * 2.5) % (Math.PI * 2), sg = a / (Math.PI * 2) * q.max, si = Math.floor(sg);
          if (q.max > 1 && sg - si < 0.14) return '#05040a';
          return (si < r ? lit : rim)[i + j < 0 ? 0 : i + j < 4 ? 1 : 2];
        }
        const g = hash2(i, j, 345) - 0.5;
        return rbCol((r ? 2.4 : 1.6) - j * 0.06 + g * 0.8 + (hov ? 1 : 0));
      });
      const M = RUNE_ICONS[q.icon], IC = r ? C : ok ? RB_ICO.ok : RB_ICO.no;
      for (let j = 0; j < 11; j++) for (let i = 0; i < 11; i++) { const ch = M[j][i]; if (ch === '.') continue; x.fillStyle = IC[ch]; x.fillRect(cx - 5 + i, cy - 5 + j, 1, 1); }
    }
  }
  // o encaixe: um octógono de pedra com a runa dentro, se houver
  const sx = RB_CX, sy = RB_CY;
  rbDisc(x, sx, sy, RB_SR + 3, (i, j, d) => Math.abs(i) + Math.abs(j) > RB_SR * 1.38 ? null : d > RB_SR + 1.5 ? '#05040a' : d > RB_SR - 2 ? (i + j < 0 ? '#6a5c94' : '#2e2448') : rbCol(0.8 + (hash2(i, j, 346) - 0.5) * 0.8 + (runHover === 'socket' && id ? 0.8 : 0)));
  if (id) {
    const pulse = 0.4 + 0.2 * Math.sin(t * 2.4);
    rbDisc(x, sx, sy, RB_SR - 3, (i, j, d) => hash2(i, j, 347 + Math.floor(t * 6)) < pulse * (1 - d / RB_SR) ? C.R : null);
    x.drawImage(ICON[id].cv, sx - ICON[id].cv.width, sy - ICON[id].cv.height, ICON[id].cv.width * 2, ICON[id].cv.height * 2);
  } else {
    // vazio: um sulco em losango esperando a runa
    rbLine(x, sx, sy - 9, sx + 9, sy, 1, '#3a3058'); rbLine(x, sx + 9, sy, sx, sy + 9, 1, '#3a3058'); rbLine(x, sx, sy + 9, sx - 9, sy, 1, '#3a3058'); rbLine(x, sx - 9, sy, sx, sy - 9, 1, '#3a3058');
  }
}
function runRefresh() {
  const id = runSel, r = id && runOf(id), B = id && RUNE_BOARDS[id];
  $('runPts').innerHTML = id ? `<b>${runPts(id)}</b> ${runPts(id) === 1 ? 'ponto' : 'pontos'}` : '';
  $('runLvl').textContent = id ? `${ITEMS[id].name} · nível ${r.lvl}` : '';
  const max = B && r.lvl >= B.maxLvl, need = id && !max ? RUNE_XP(r.lvl) : 1;
  $('runFill').style.width = id ? (max ? 100 : Math.round(r.xp / need * 100)) + '%' : '0%';
  $('runXp').textContent = id ? (max ? 'máximo' : `${Math.floor(r.xp)} / ${need}`) : '';
  $('btnRunReset').disabled = !id || !runSpent(id);
  $('runas').querySelector('.rfoot').classList.toggle('empty', !id);
  $('runas').dataset.el = B ? B.elem : '';
}
function runLoop() {
  if (!runOpen()) return;
  runDraw();
  if (runDirty) { runDirty = false; runRefresh(); }
  requestAnimationFrame(runLoop);
}

/* ---- Menu > Testes: pontos de runa para testar (o botão fica na aba Outros da tela de Testes, 339-testes) ---- */
function runTestePontos() { for (const id in RUNE_BOARDS) { const r = runOf(id), B = RUNE_BOARDS[id]; r.lvl = Math.min(B.maxLvl, r.lvl + 5); } runDirty = true; saveGame(); sfx.runLvl(); }
