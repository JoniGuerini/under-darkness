'use strict';

/* ================= the village chest: tabs of 60 slots each that stay home while you dig ================= */
// Self-contained: it adds its own building to the village, its own window (next to your inventory, like a shop),
// and hooks the shared item handling (refOf, itemAt, moveItem, quickAction...) by wrapping those functions.
// Loaded before 24-boot.js, so the wraps are in place when start() builds the village and loads the save.
// Tabs (bought with gold, Path of Exile style; their bar and editing live in js/333-bau-abas.js): `stash` stays ONE
// flat array, tab t owning the slots t*STASH_PER .. t*STASH_PER+STASH_PER-1, so everything that walks the whole
// chest (reagents in 93, runes in 189, the belt in 231) keeps working across all tabs without knowing about them.
// sizes, prices and colours: js/332-bau-abas-dados.js (loaded before this file; the wiki reads it too)
const newTab = i => ({ name: String(i + 1), cor: 0 });
let stashTabs = [newTab(0)], stashTab = 0, STASH_N = STASH_PER;
let stash = new Array(STASH_N).fill(null), stashOn = false, stashBuilt = false;
const tabLo = (t = stashTab) => t * STASH_PER, tabHi = (t = stashTab) => t * STASH_PER + STASH_PER;
const stashOpen = () => stashOn && !$('stash').hidden;

/* ---- the chest itself, painted like the houses: every pixel on a 6-step ramp, lit from the top left ---- */
const OAK = ['#1c0f08', '#341c0e', '#4f2c15', '#6c3e1d', '#8a5228', '#a96a34'];
const BRASS = ['#2e1c06', '#54360c', '#7e5414', '#a8761e', '#d29e34', '#f6d27a'];
function bChest() {
  const b = newB(30, 21), x = b.x;
  const L = 2, R = 27, lidTop = 1, seam = 8, bot = 16;
  const lidIn = py => py === lidTop ? 3 : py === lidTop + 1 ? 1 : 0;      // the lid is domed: its top rows are pulled in
  const inChest = (px, py) => py >= lidTop && py <= bot && px >= L + lidIn(py) && px <= R - lidIn(py);
  // a low fieldstone slab it sits on, so it doesn't rot in the grass
  vTex(x, 0, 17, 30, 4, RAMP.stone, (px, py, i, j) => {
    if ((i === 0 || i === 29) && j === 0) return null;
    const cut = i === 13 || i === 14 && j > 0;
    let v = (j === 0 ? 4.3 : j === 3 ? 0.9 : 2.8 - j * 0.3) + grn(px, py, 701) * 0.9 + sn(px, py, 90, 90, 702) * 0.6;
    if (cut) v = 0.8; if (i === 0) v += 0.4; if (i === 29) v -= 0.8;
    return v;
  });
  // oak boards laid lengthwise: three on the body, two curving over the lid
  vTex(x, L, lidTop, R - L + 1, bot - lidTop + 1, OAK, (px, py) => {
    if (!inChest(px, py)) return null;
    if (py === seam) return 0.3;                                             // the gap under the lid
    const lid = py < seam, by = lid ? (py - lidTop) % 4 : (py - seam - 1) % 3, bh = lid ? 4 : 3;
    let v = 2.9 + sn(px, py, 160, 10, lid ? 711 : 712) * 1.5 + grn(px, py, 713) * 0.4;
    if (by === 0) v += 0.9; else if (by === bh - 1) v = Math.min(v, 1.3);
    if (lid) v += (seam - py) * 0.12;                                         // the dome catches the light
    if (px === L + lidIn(py)) v += 0.7; else if (px === R - lidIn(py)) v = 0.8; else if (px >= R - 3) v -= 0.5;
    if (hash2(px >> 2, py, 714) < 0.05 && by > 0 && by < bh - 1) v -= 1.2;    // a knot
    return v;
  });
  // iron: two straps over lid and body, a band round the bottom, brackets on the corners, all riveted
  const iron = (px, py, v) => vPix(x, RAMP.iron, v + grn(px, py, 721) * 0.5, px, py);
  for (const sx of [6, 22]) for (let py = lidTop; py <= bot; py++) { if (!inChest(sx, py) || py === seam) continue; iron(sx, py, 3.9); iron(sx + 1, py, 2.1); }
  for (let px = L; px <= R; px++) { iron(px, bot, px === L ? 2.6 : 1.4); iron(px, 7, px === L ? 3.6 : 2.5 - (px > R - 4 ? 0.8 : 0)); }
  for (const [cx, dir] of [[L, 1], [R, -1]]) for (let k = 0; k < 4; k++) { iron(cx + dir * k, bot - 1, k === 0 && dir > 0 ? 3.8 : 2.4); iron(cx, bot - 1 - k, dir > 0 ? 3.6 : 1.4); }
  for (const [px, py] of [[6, 3], [22, 3], [6, 11], [22, 11], [6, 14], [22, 14], [4, 15], [25, 15]]) { vPix(x, RAMP.iron, 5, px, py); vPix(x, RAMP.iron, 0.6, px + 1, py + 1); }
  // side handles
  for (const hx of [0, 28]) { vTex(x, hx, 9, 2, 4, RAMP.iron, (px, py, i, j) => (j === 1 || j === 2) && i === (hx ? 0 : 1) ? null : (j === 0 ? 4 : 2) + grn(px, py, 731) * 0.5); }
  // a brass lock plate with its hasp coming down off the lid, and a keyhole
  vTex(x, 13, 5, 4, 7, BRASS, (px, py, i, j) => {
    if ((i === 0 || i === 3) && (j === 0 || j === 6)) return null;
    let v = (i === 0 || j === 0 ? 4.6 : i === 3 || j === 6 ? 1.4 : 3.2) + grn(px, py, 741) * 0.6;
    if ((i === 1 || i === 2) && j === 4) v = 0.2; if (i === 1 && j === 5) v = 0.4;
    return v;
  });
  vPix(x, BRASS, 5.5, 13, 6);
  return vFinish(b);
}
BUILDERS.chest = bChest;
VIL_BUILD.push({ k: 'chest', x0: -0.6 });          // in the square, between the well and the tavern's lamp

/* ---- walking up to it: E opens it, the same way E greets a villager ---- */
const STASH_SPOT = { id: 'bau', name: 'Baú', role: 'guarde suas coisas', stash: true };
function stashCenter() { const v = VIL_BUILD.find(q => q.k === 'chest'), [x, y] = bPos(v); return [x + 1 + 15, y]; }
const _nearNpc = nearNpc;
nearNpc = function () {
  const n = _nearNpc();
  if (pl.dead || !surf || !SPR.vil || !SPR.vil.chest || Math.abs(pl.y + pl.h - groundY()) > 30) return n;
  const pcx = pl.x + pl.w / 2, d = Math.abs(pcx - stashCenter()[0]);
  return d < 20 && (!n || d < Math.abs(pcx - npcWX(n))) ? STASH_SPOT : n;
};
const _openTalk = openTalk;
openTalk = function (n) { if (n === STASH_SPOT) openStash(); else _openTalk(n); };
const _drawNpcLabels = drawNpcLabels;
drawNpcLabels = function (cx, cy) {
  _drawNpcLabels(cx, cy);
  if (state !== 'play' || pl.dead || !SPR.vil || !SPR.vil.chest) return;
  const [wx, wy] = stashCenter(), d = Math.abs(pl.x + pl.w / 2 - wx); if (d > 60 || Math.abs(pl.y + pl.h - groundY()) > 60) return;
  const x = (wx - cx) * S, y = (wy - 16 - cy) * S, near = pl.nearNpc === STASH_SPOT;
  sc.textAlign = 'center'; sc.textBaseline = 'middle'; sc.globalAlpha = clamp((60 - d) / 24, 0, 1); sc.lineWidth = Math.max(3, S); sc.strokeStyle = '#120d12';
  sc.font = `700 ${Math.round(S * 3.6)}px "Rubik", system-ui, sans-serif`; sc.strokeText('Baú', x, y); sc.fillStyle = '#e8c06a'; sc.fillText('Baú', x, y);
  if (near) { sc.font = `700 ${Math.round(S * 3.2)}px "Rubik", system-ui, sans-serif`; sc.strokeText('E  abrir', x, y - S * 4.4); sc.fillStyle = '#efe2c4'; sc.fillText('E  abrir', x, y - S * 4.4); }
  sc.globalAlpha = 1;
};

/* ---- its own sounds, built sample by sample: a latch clicks, the lid swings with a breath of air and knocks back
   on its straps; shutting it is the swing the other way, a heavy wooden knock and the latch dropping ---- */
const chestBuf = {};
function chestSound(kind, sr) {
  const dur = kind === 'open' ? 0.75 : 0.55, n = Math.floor(sr * dur), d = new Float32Array(n);
  let seed = kind === 'open' ? 17 : 29; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // a struck body: a few decaying partials, lightly detuned, started by a 2 ms burst of noise
  const strike = (t, parts, amp, bright = 0.15) => {
    const at = Math.floor(t * sr);
    for (const [f, dec, lv] of parts) { const w = 2 * Math.PI * f * (0.98 + rnd() * 0.04) / sr, ph = rnd() * 6.28, len = Math.min(n - at, Math.floor(dec * 7 * sr)); for (let i = 0; i < len; i++) d[at + i] += amp * lv * Math.sin(ph + w * i) * Math.exp(-i / (dec * sr)); }
    let y = 0; const nb = Math.floor(0.003 * sr); for (let i = 0; i < nb && at + i < n; i++) { y += bright * ((rnd() * 2 - 1) - y); d[at + i] += amp * 0.6 * y * (1 - i / nb); }
  };
  // air moved by the lid: noise through a band-pass whose centre glides from f0 to f1
  const swish = (t0, len, f0, f1, amp) => {
    const a = Math.floor(t0 * sr), m = Math.floor(len * sr); let lo = 0, bp = 0, sm = 0;
    for (let i = 0; i < m && a + i < n; i++) {
      const u = i / m, fc = f0 * Math.pow(f1 / f0, u), F = 2 * Math.sin(Math.PI * fc / sr), q = 0.45;
      const x = rnd() * 2 - 1, hi = x - lo - q * bp; bp += F * hi; lo += F * bp;
      sm += 0.3 * (bp - sm); d[a + i] += amp * sm * Math.sin(Math.PI * u) ** 2;
    }
  };
  const wood = s => [[s * 112, 0.11, 1], [s * 196, 0.07, 0.7], [s * 318, 0.045, 0.45], [s * 547, 0.025, 0.3], [s * 905, 0.012, 0.18]];
  const latch = [[2950, 0.007, 1], [4420, 0.005, 0.7], [6180, 0.004, 0.45]];
  if (kind === 'open') {
    strike(0.0, latch, 0.35, 0.9); strike(0.032, latch, 0.22, 0.9);                 // the latch lifts
    strike(0.05, [[1870, 0.09, 1], [2860, 0.05, 0.4]], 0.05);              // the iron hasp swings free and rings a little
    swish(0.07, 0.38, 260, 820, 1.6);                                       // the lid swings up
    strike(0.43, wood(1.15), 0.7);                                         // and knocks back on its straps
    strike(0.445, latch, 0.08, 0.9);
  } else {
    swish(0.0, 0.2, 900, 280, 1.8);                                         // the lid comes down
    strike(0.19, wood(0.9), 1);                                            // a heavy wooden knock
    strike(0.2, [[70, 0.12, 1]], 0.5);                                     // felt more than heard
    strike(0.27, latch, 0.3, 0.9); strike(0.29, latch, 0.15, 0.9);                   // the latch drops into place
  }
  let m = 0; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(d[i])); for (let i = 0; i < n; i++) d[i] /= m || 1;
  return d;
}
function playChest(kind) {
  if (!ac || muted) return;
  if (!chestBuf[kind]) { const d = chestSound(kind, ac.sampleRate), b = ac.createBuffer(1, d.length, ac.sampleRate); b.getChannelData(0).set(d); chestBuf[kind] = b; }
  const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = chestBuf[kind]; s.playbackRate.value = 0.96 + Math.random() * 0.08; g.gain.value = 0.55;
  s.connect(g); g.connect(sfxOut || master); s.start();
}
const chestSfx = { open: () => playChest('open'), close: () => playChest('close') };

/* ---- the window: built here, docked next to the inventory card like the shop ---- */
function buildStashUI() {
  if (stashBuilt) return; stashBuilt = true;
  const root = document.createElement('div'); root.id = 'stash'; root.className = 'overlay'; root.hidden = true;
  root.innerHTML = `<div class="inv"><section class="panel chestp" aria-label="Baú">
    <header class="ch"><h3>Baú do vilarejo</h3><span id="stashCount"></span><button class="ghost sm push" id="btnStashBack" type="button">Fechar</button></header>
    <div class="acts"><button class="ghost sm" id="btnStashAll" type="button" title="Guarda tudo da mochila no baú, menos a fileira da barra">Guardar tudo</button><button class="ghost sm" id="btnStashStack" type="button" title="Guarda só o que o baú já tem: completa as pilhas e põe o resto do mesmo item nas casas livres. A fileira da barra fica.">Empilhar</button><button class="ghost sm" id="btnStashTake" type="button" title="Traz tudo do baú para a mochila, até ela encher">Pegar tudo</button><button class="ghost sm" id="btnStashSort" type="button" title="Junta as pilhas e arruma o baú">Organizar</button></div>
    <nav class="abas" id="stashTabs" aria-label="Abas do baú"></nav>
    <div class="grid" id="stashGrid"></div>
  </section></div>`;
  document.body.insertBefore(root, $('death'));
  const g = $('stashGrid');
  for (let i = 0; i < STASH_PER; i++) { const d = document.createElement('div'); d.className = 'slot'; d.dataset.chest = String(i); d.innerHTML = '<img alt="" hidden><span class="n"></span>'; g.appendChild(d); }
  const p = root.querySelector('.chestp');
  p.addEventListener('pointerdown', onInvDown);
  p.addEventListener('pointermove', onInvHover);
  p.addEventListener('pointerleave', hideTip);
  root.addEventListener('contextmenu', e => e.preventDefault());
  // a click on the empty backdrop closes it, but only when the press also started there: dragging an item
  // from the bag to the chest ends with a click on their shared parent, and that must not close anything
  const bg = t => t === root || t === root.firstChild; let downBg = false;
  root.addEventListener('pointerdown', e => { downBg = bg(e.target); });
  root.addEventListener('click', e => { if (downBg && bg(e.target) && !held) closeStash(); downBg = false; });
  $('btnStashBack').addEventListener('click', closeStash);
  $('btnStashAll').addEventListener('click', () => { cancelHeld(); stashAll(); });
  $('btnStashStack').addEventListener('click', () => { cancelHeld(); stashStack(); });
  $('btnStashTake').addEventListener('click', () => { cancelHeld(); takeAll(); });
  $('btnStashSort').addEventListener('click', () => { cancelHeld(); sortStash(); sfx.equip(); });
  $('btnCloseInv').addEventListener('click', () => { if (stashOpen()) closeStash(); });
}
function openStash() {
  if (state !== 'play' || pl.dead) return;
  buildStashUI(); buildInvUI();
  state = 'talk'; stashOn = true; mouse.l = mouse.r = false; pl.shieldOn = false; pl.atkT = -1; pl.mining = false;
  dockInv('stash'); $('stash').hidden = false; chestSfx.open(); hideTip(); refreshInv(true);
}
function closeStash() { if (!stashOn) return; closeTalk(); }
const _closeTalk = closeTalk;
closeTalk = function () { const was = stashOn; _closeTalk(); if (stashBuilt) $('stash').hidden = true; stashOn = false; if (was) chestSfx.close(); };
// the grid shows the open tab only: its slots are renumbered to that tab's part of the flat array
function refreshStash(force) {
  if (!stashOpen()) return;
  const lo = tabLo();
  document.querySelectorAll('#stashGrid .slot').forEach((d, j) => {
    if (+d.dataset.chest !== lo + j) { d.dataset.chest = String(lo + j); force = true; }
    paintSlot(d, stash[lo + j], force);
  });
  $('stashCount').textContent = `${stash.slice(lo, lo + STASH_PER).filter(Boolean).length} / ${STASH_PER}`;
}

/* ---- moving things in and out ---- */
// into one tab: stacks onto what that tab already holds first; returns what didn't fit (a count, or 1 for gear)
function putInTab(s, t) {
  const mx = stackMax(s.id), lo = tabLo(t), hi = tabHi(t);
  if (mx > 1) {
    let n = s.n;
    for (let i = lo; i < hi && n > 0; i++) { const q = stash[i]; if (q && q.id === s.id && q.n < mx) { const k = Math.min(n, mx - q.n); q.n += k; n -= k; } }
    for (let i = lo; i < hi && n > 0; i++) if (!stash[i]) { const k = Math.min(n, mx); stash[i] = { id: s.id, n: k }; n -= k; }
    return n;
  }
  for (let i = lo; i < hi; i++) if (!stash[i]) { stash[i] = s; return 0; }
  return 1;
}
// anywhere in the chest (a cancelled craft giving materials back): the open tab first, then the others in order
function putInStash(s) {
  let left = putInTab(s, stashTab);
  for (let t = 0; t < stashTabs.length && left; t++) if (t !== stashTab) left = putInTab(stackMax(s.id) > 1 ? { id: s.id, n: left } : s, t);
  return left;
}
function toStash(i, t = stashTab) {
  const s = inv[i]; if (!s) return false;
  const left = putInTab(s, t);
  if (stackMax(s.id) > 1) { if (left === s.n) return false; if (left) s.n = left; else inv[i] = null; }
  else { if (left) return false; inv[i] = null; }
  return true;
}
function toBag(i) {
  const s = stash[i]; if (!s) return false;
  if (stackMax(s.id) > 1) { const left = addItem(s.id, s.n); if (left === s.n) return false; if (left) s.n = left; else stash[i] = null; return true; }
  if (!addInst(s)) return false; stash[i] = null; return true;
}
function stashAll() {
  let moved = 0, full = false;
  for (let i = HB_BAG; i < INV_N; i++) if (inv[i]) { if (toStash(i)) moved++; else full = true; }
  if (moved) { sfx.equip(); changed(false); refreshInv(); } else bad(null);
  if (full) toast('O baú está cheio');
  else if (!moved) toast('Nada para guardar fora da barra');
}
// quick stack: only what the chest already holds goes in (the hotbar row stays, like Guardar tudo)
function stashStack() {
  const have = new Set(stash.slice(tabLo(), tabHi()).filter(Boolean).map(s => s.id)); let moved = 0, full = false;
  for (let i = HB_BAG; i < INV_N; i++) { const s = inv[i]; if (!s || !have.has(s.id)) continue; if (toStash(i)) moved++; else full = true; }
  if (moved) { sfx.equip(); changed(false); refreshInv(); } else bad(null);
  if (full) toast('O baú está cheio');
  else if (!moved) toast(have.size ? 'Nada na mochila que o baú já tenha' : 'O baú está vazio: não há o que empilhar');
}
function takeAll() {
  let moved = 0, full = false;
  for (let i = tabLo(); i < tabHi(); i++) if (stash[i]) { if (toBag(i)) moved++; if (stash[i]) full = true; }
  if (moved) { sfx.equip(); changed(false); refreshInv(); }
  if (full) toast('Mochila cheia: o resto ficou no baú');
  else if (!moved) { bad(null); toast('O baú está vazio'); }
}
function sortStash() {   // the open tab only
  const stacks = {}, gear = [], lo = tabLo(), hi = tabHi();
  for (const s of stash.slice(lo, hi)) { if (!s) continue; if (stackMax(s.id) > 1) stacks[s.id] = (stacks[s.id] || 0) + s.n; else gear.push(s); }
  const ord = ['weapon', 'shield', 'tool', 'head', 'body', 'feet', 'acc'];
  gear.sort((a, b) => ord.indexOf(ITEMS[a.id].slot) - ord.indexOf(ITEMS[b.id].slot) || itemRar(b) - itemRar(a));
  for (let i = lo; i < hi; i++) stash[i] = null; let k = lo;
  gear.forEach(g => { stash[k++] = g; });
  for (const id of Object.keys(stacks).sort((a, b) => (ITEMS[b].rar || 0) - (ITEMS[a].rar || 0) || (ITEMS[a].block ? 1 : 0) - (ITEMS[b].block ? 1 : 0) || a.localeCompare(b))) {
    let n = stacks[id]; const mx = stackMax(id); while (n > 0 && k < hi) { const q = Math.min(n, mx); stash[k++] = { id, n: q }; n -= q; }
  }
  refreshInv();
}
const isBox = r => r.k === 'inv' || r.k === 'chest';
const boxGet = r => r.k === 'inv' ? inv[r.i] : stash[r.i];
const boxSet = (r, v) => { if (r.k === 'inv') inv[r.i] = v; else stash[r.i] = v; };
function moveStash(a, b, el) {
  if (a.k === 'chest' && b.k === 'trash') { stash[a.i] = null; changed(false); sfx.trash(); return; }
  if (isBox(a) && isBox(b)) {
    if (a.k === b.k && a.i === b.i) return;
    const A = boxGet(a), B = boxGet(b);
    if (B && A.id === B.id && stackMax(A.id) > 1) { const k = Math.min(A.n, stackMax(A.id) - B.n); B.n += k; A.n -= k; if (A.n <= 0) boxSet(a, null); }
    else { boxSet(a, B || null); boxSet(b, A); }
    changed(false); if (a.k !== b.k) sfx.equip(); return;
  }
  if (a.k === 'chest' && b.k === 'eq') { const A = stash[a.i]; if (!slotFits(A.id, b.s)) return bad(el); const old = equip[b.s]; equip[b.s] = A; stash[a.i] = old || null; changed(true); return; }
  if (a.k === 'eq' && b.k === 'chest') {
    const B = stash[b.i], cur = equip[a.s];
    if (!B) { stash[b.i] = cur; equip[a.s] = null; } else if (slotFits(B.id, a.s)) { equip[a.s] = B; stash[b.i] = cur; } else return bad(el);
    changed(true); return;
  }
  bad(el);
}

/* ---- hooks into the shared item handling (21-inventario.js, 22-ficha.js) ---- */
const _refOf = refOf, _itemAt = itemAt, _moveItem = moveItem, _quickAction = quickAction, _actFor = actFor, _invVisible = invVisible, _dockInv = dockInv, _refreshInv = refreshInv;
refOf = el => el && el.dataset && el.dataset.chest !== undefined ? { k: 'chest', i: +el.dataset.chest } : _refOf(el);
itemAt = r => r && r.k === 'chest' ? stash[r.i] || null : _itemAt(r);
moveItem = (a, b, el) => a.k === 'chest' || b.k === 'chest' ? moveStash(a, b, el) : _moveItem(a, b, el);
quickAction = r => {
  if (stashOpen() && (r.k === 'chest' || r.k === 'inv')) {
    const ok = r.k === 'chest' ? toBag(r.i) : toStash(r.i);
    if (ok) { sfx.equip(); changed(false); } else { bad(null); toast(r.k === 'chest' ? 'Mochila cheia' : 'O baú está cheio'); }
    return;
  }
  _quickAction(r);
};
actFor = (s, r) => !stashOpen() ? _actFor(s, r) : r.k === 'chest' ? 'Botão direito: levar para a mochila · Clique: pegar e mover' : r.k === 'inv' ? 'Botão direito: guardar no baú · Clique: pegar e mover' : _actFor(s, r);
invVisible = () => _invVisible() || stashOpen();
dockInv = where => { if (where === 'stash') $('stash').querySelector('.inv').appendChild(document.querySelector('.invcard')); else _dockInv(where); };
refreshInv = force => { _refreshInv(force); refreshStash(force); };

/* ---- the save: the chest's contents ride along in the same save, in the inventory's format ---- */
const _makeSave = makeSave, _newWorld = newWorld;
makeSave = () => { const o = _makeSave(); o.stashTabs = stashTabs.map(t => [t.name, t.cor]); o.stash = stash.map(s => !s ? null : ITEMS[s.id].slot ? [s.id, 1, itemRar(s), s.mods || [], s.il] : [s.id, s.n]); return o; };
newWorld = (sd, sv) => {
  _newWorld(sd, sv);
  // tabs: an old save (no stashTabs, 40 slots) lands whole in tab 1
  stashTabs = sv && Array.isArray(sv.stashTabs) && sv.stashTabs.length ? sv.stashTabs.slice(0, STASH_MAX_TABS).map((q, i) => ({ name: String((Array.isArray(q) && q[0]) || i + 1).slice(0, STASH_NAME_MAX), cor: clamp((Array.isArray(q) ? q[1] : 0) | 0, 0, STASH_CORES.length - 1) })) : [newTab(0)];
  stashTab = 0; STASH_N = stashTabs.length * STASH_PER;
  stash = new Array(STASH_N).fill(null);
  if (sv && Array.isArray(sv.stash)) sv.stash.forEach((q, i) => { if (i < STASH_N && Array.isArray(q) && ITEMS[q[0]]) stash[i] = ITEMS[q[0]].slot ? mkItem(q[0], q[2] | 0, Array.isArray(q[3]) ? (sv.gear === 3 ? rerollValues(q[0], q[3], q[4]) : q[3]) : undefined, q[4]) : { id: q[0], n: clamp(q[1] | 0, 1, stackMax(q[0])) }; });
};

/* ---- the window's textures, cut from the same oak, iron and brass as the chest ---- */
(function makeChestTextures() {
  const url = (w, h, f) => { const c = mk(w, h), x = c.getContext('2d'); f(x, w, h); return c.toDataURL(); };
  const G = (px, py, s) => hash2(px, py, s) - 0.5;
  // frame: oak boards round the edge, iron corner plates with rivets, an iron strap across the middle of each side
  const FW = 72, B = 12, MID = FW - B * 2;
  const frame = url(FW, FW, x => {
    for (let py = 0; py < FW; py++) for (let px = 0; px < FW; px++) {
      const r = Math.min(px, py, FW - 1 - px, FW - 1 - py);
      if (r >= B) continue;
      const corner = (px < B || px >= FW - B) && (py < B || py >= FW - B);
      if (r === 0) { vPix(x, RAMP.iron, 0, px, py); continue; }
      if (corner) {   // iron corner plate, bevelled, riveted
        const i = px < B ? px : FW - 1 - px, j = py < B ? py : FW - 1 - py, lit = (px < B ? i : B - 1 - i) + (py < B ? j : B - 1 - j);
        if (i === B - 1 || j === B - 1) { vPix(x, RAMP.iron, 0.3, px, py); continue; }
        let v = 2.6 + G(px, py, 801) * 0.7 + sn(px, py, 60, 60, 802) * 0.6 + (lit < 6 ? 0.6 : lit > 15 ? -0.6 : 0);
        if (i === 1 || j === 1) v = (px < B && i === 1) || (py < B && j === 1) ? 4.4 : 1.4;
        if ((i === 4 || i === 7) && (j === 4 || j === 7) && !(i === 7 && j === 7)) v = 5;
        if ((i === 5 || i === 8) && (j === 5 || j === 8) && !(i === 8 && j === 8)) v = 0.8;
        vPix(x, RAMP.iron, v, px, py); continue;
      }
      // boards run along the side they sit on; the grain repeats every MID pixels so the edge tiles without a seam
      const horiz = py < B || py >= FW - B, along = ((horiz ? px : py) - B + MID) % MID, across = r;
      if (across === B - 1) { vPix(x, OAK, 0.2, px, py); continue; }
      const strap = along === 23 || along === 24;
      if (strap) { vPix(x, RAMP.iron, (along === 23 ? 3.7 : 1.8) + G(px, py, 811) * 0.5 + (across === 5 ? 1.4 : 0), px, py); continue; }
      const lit = (horiz ? py < B : px < B);
      let v = 2.9 + (pn(along * 240 / MID, across * 20, 6, 24, horiz ? 821 : 822) - 0.5) * 1.6 + G(px, py, 823) * 0.45;
      if (across === 1) v += lit ? 1.3 : 0.4; else if (across === B - 2) v -= 1.1; else if (across === 6) v = Math.min(v, 1.4);   // two boards per side
      if (!lit) v -= 0.45;
      vPix(x, OAK, v, px, py);
    }
  });
  // the inside of the lid: dark oak boards, lengthwise, darker toward the top like the hollow of a box
  const wall = url(60, 60, x => {
    for (let py = 0; py < 60; py++) for (let px = 0; px < 60; px++) {
      const by = py % 6, row = py / 6 | 0, tone = (hash2(row, 0, 831) - 0.5) * 0.8;
      let v = by === 5 ? 0.3 : 2.2 + tone + (pn(px * 4, py * 4, 9, 140, 832) - 0.5) * 1.5 + G(px, py, 833) * 0.35;
      if (by === 0) v += 0.6; else if (by === 4) v -= 0.4;
      if (hash2(px >> 2, py, 834) < 0.03 && by > 0 && by < 4) v -= 1.2;
      vPix(x, RAMP.wall, v, px, py);
    }
  });
  // small frame for buttons: a board rim with brass studs
  const frameSm = url(16, 16, x => {
    for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
      const r = Math.min(px, py, 15 - px, 15 - py); if (r >= 5) continue;
      const lit = py === r || px === r;
      let v; if (r === 0 || r === 4) v = 0.2; else if (r === 1) v = lit ? 4.2 : 1; else v = 2.7 + G(px, py, 841) * 0.7 - (lit ? 0 : 0.6);
      vPix(x, OAK, v, px, py);
    }
    for (const [X, Y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) { vPix(x, BRASS, 5, X, Y); vPix(x, BRASS, 1.5, X + 1, Y + 1); }
  });
  const board = url(60, 14, x => {
    for (let py = 0; py < 14; py++) for (let px = 0; px < 60; px++) {
      let v = 3 + (pn(px * 4, py * 240 / 14, 12, 160, 851) - 0.5) * 1.4 + G(px, py, 852) * 0.3;
      if (py === 0) v += 1.1; else if (py === 13) v = 0.4; else if (py === 12) v -= 0.7;
      vPix(x, OAK, v, px, py);
    }
  });
  const icon = url(32, 23, x => x.drawImage(bChest().c, 0, 0));
  const R = document.documentElement.style;
  for (const [k, v] of Object.entries({ frame, 'frame-sm': frameSm, wall, board, icon })) R.setProperty('--bau-' + k, `url(${v})`);
})();
