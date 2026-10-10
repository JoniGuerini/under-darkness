'use strict';

/* ================= a cozinha do Odo e o comer =================
   1. A cozinha: na conversa com o Odo, "Cozinhar" abre um livro de receitas no modelo da forja do Grimaldo
      (lista à esquerda, receita à direita, quantidade, barra de trabalho). Os ingredientes saem da mochila e do baú
      do vilarejo (93-reagentes); cada prato fica `t` segundos no fogo; sair da janela devolve os ingredientes do
      prato que estava no fogo. O prato pronto vai para a mochila (o que não couber, para o baú).
   2. O comer: com o prato na barra, clique esquerdo; ou botão direito nele no inventário. O herói fica parado
      levando a comida à boca por `food.eat` segundos, com a barrinha sobre a cabeça, como o portal. Andar, pular,
      golpear, escudo, botão direito ou levar dano interrompem, e a comida não é gasta. Comeu: a vida (e a mana)
      volta aos poucos por `food.t` segundos; uma refeição nova toma o lugar da anterior. Não vai para o save.
   Dados em 98-cozinha-dados. Visual da janela em css/cozinha.css. Embrulha talkMenu, closeTalk, tickFurnace,
   refreshForge, updatePlayer, rawDamage, heldItem, quickAction, actFor e newWorld. Carrega depois do 92, antes do 24-boot. */

const ck = { npc: null, built: false, sel: 'carne_assada', shut: {}, qty: 1, find: '', pot: null, dirty: true, eat: null, meal: null };
const cookOpen = () => !!ck.npc && !$('cozinha').hidden;
const ckMax = r => Math.min(...r.need.map(([id, n]) => Math.floor(reagHave(id) / n)));

/* ---------- sons: brasa chiando, caldeirão borbulhando, mastigar ---------- */
const ckSfx = {
  start(g) { if (g === 'brasa') { noise(0.5, 0.09, 3200, 'highpass', 0, 0.7); tone(180, 0.12, 'triangle', 0.04, -60); } else { tone(140, 0.3, 'sine', 0.05, 40); noise(0.3, 0.05, 500, 'lowpass'); } },
  work(g) { if (g === 'brasa') noise(0.28, 0.035 + Math.random() * 0.02, 2600 + Math.random() * 1800, 'highpass', 0, 0.6); else { const f = 180 + Math.random() * 160; tone(f, 0.09, 'sine', 0.04, f * 0.8); } },
  done() { tone(523, 0.12, 'triangle', 0.06, 0); tone(784, 0.18, 'triangle', 0.05, 0, 0.08); noise(0.2, 0.05, 2400, 'bandpass', 0, 2); },
  bite() { noise(0.07, 0.12, 1500 + Math.random() * 900, 'bandpass', 0, 1.4); noise(0.05, 0.08, 700, 'lowpass', 0.07); },
  swallow() { tone(240, 0.16, 'sine', 0.05, -120); tone(330, 0.2, 'triangle', 0.035, 60, 0.12); }
};

/* ---------- texturas da janela: a lareira da taverna e o caldeirão no fogo ---------- */
(function makeKitchenTextures() {
  const R = document.documentElement.style, url = (w, h, f) => { const c = mk(w, h), x = c.getContext('2d'); f(x, w, h); return c.toDataURL(); };
  // a pedra da lareira: alvenaria escurecida de fuligem em cima, aquecida perto do fogo à esquerda
  const hearth = url(180, 100, x => vMasonry(x, 0, 0, 180, 100, 1201, { soot: (px, py) => py < 30 ? (30 - py) * 0.05 : 0, heat: (px, py) => (px < 40 ? (40 - px) / 40 : 0) * (py > 40 ? 1 : 0.4) }));
  // a boca da lareira com o caldeirão de ferro pendurado sobre as brasas
  const pot = url(32, 34, x => {
    vTex(x, 0, 0, 32, 34, RAMP.hearth, (px, py) => 1.6 + (py / 34) * 2 + grn(px, py, 1211) * 0.8);
    vTex(x, 15, 0, 2, 12, RAMP.iron, (px, py, i) => (i ? 1.4 : 3.6) + grn(px, py, 1212) * 0.4);                      // a corrente
    vTex(x, 6, 11, 20, 2, RAMP.iron, (px, py, i, j) => (j ? 1.6 : 4) + grn(px, py, 1213) * 0.5);                       // a alça
    vTex(x, 5, 13, 22, 13, RAMP.iron, (px, py, i, j) => {                                                               // o bojo
      const dx = (i - 10.5) / 11, dy = j / 13; if (dx * dx + dy * dy * 0.9 > 1.02 && j > 2) return null;
      if (j === 0) return 4.2; if (j === 1) return 0.6;
      return 2.4 - dx * 1.2 - dy * 0.9 + grn(px, py, 1214) * 0.5 + (i === 3 && j > 3 && j < 9 ? 1.3 : 0);
    });
    vTex(x, 7, 13, 18, 1, RAMP.fire, (px, py, i) => 3.4 + grn(px, py, 1215) * 1.2 + (i % 5 === 2 ? 0.8 : 0));         // o caldo fervendo na boca
    vTex(x, 2, 27, 28, 7, RAMP.fire, (px, py, i, j) => {                                                                // as brasas
      const h = 2 + (sn(px, 0, 60, 20, 1216) + 0.5) * 5; if (7 - j > h) return null;
      return 1.2 + (h - (7 - j)) * 0.7 + grn(px, py, 1217) * 1.4;
    });
    vTex(x, 4, 32, 24, 2, RAMP.coal, (px, py) => 1.6 + grn(px, py, 1218) * 1.8);
    for (const [X, Y] of [[10, 3], [21, 5], [14, 8]]) vr(x, '#c8b8a0', X, Y, 1, 1);                                    // vapor
  });
  R.setProperty('--kitchen-hearth', `url(${hearth})`); R.setProperty('--kitchen-pot', `url(${pot})`);
})();

/* ---------- a janela (o HTML nasce aqui para não mexer no index) ---------- */
(function () {
  const d = document.createElement('div'); d.id = 'cozinha'; d.className = 'overlay'; d.hidden = true;
  d.innerHTML = `<section class="panel forgep" aria-label="Cozinha">
    <header class="ch"><h3>Cozinha do Odo</h3><span id="ckGold" class="coin"></span><button class="ghost sm" id="btnCkBack" type="button">Voltar</button></header>
    <div class="prof">
      <div class="plist">
        <label class="psearch"><input id="ckSearch" type="search" placeholder="Procurar" autocomplete="off" spellcheck="false"></label>
        <div class="recipes" id="ckList" role="listbox" aria-label="Receitas"></div>
      </div>
      <div class="pdet">
        <div class="pdh"><div class="pico"><img id="ckIcon" alt=""></div><div><h4 id="ckName"></h4><small id="ckSub"></small></div></div>
        <div class="pdbody" id="ckBody"></div>
        <div class="pwork">
          <div class="pstate"><canvas id="ckFire" width="24" height="16" aria-hidden="true"></canvas><div class="pbar"><i id="ckFill"></i><span id="ckBarTxt"></span></div></div>
          <div class="pact">
            <button class="ghost" id="btnCkAll" type="button"></button>
            <div class="qty"><button class="ghost sm" id="btnCkDn" type="button" aria-label="Menos">◀</button><input id="ckQty" type="text" inputmode="numeric" value="1" aria-label="Quantidade"><button class="ghost sm" id="btnCkUp" type="button" aria-label="Mais">▶</button></div>
            <button id="btnCk" type="button"></button>
          </div>
        </div>
      </div>
    </div>
  </section>`;
  const f = $('forge'); f.parentNode.insertBefore(d, f.nextSibling);
})();

function buildCookUI() {
  if (ck.built) return; ck.built = true;
  const p = document.querySelector('#cozinha .forgep');
  p.addEventListener('contextmenu', e => e.preventDefault());
  $('cozinha').addEventListener('click', e => {
    if (e.target === $('cozinha')) { backFromCook(); return; }
    const t = e.target;
    const g = t.closest('.pg'); if (g) { ck.shut[g.dataset.g] = !ck.shut[g.dataset.g]; sfx.select(); ck.dirty = true; return; }
    const r = t.closest('.pr'); if (r) { if (ck.sel !== r.dataset.k) { ck.sel = r.dataset.k; ck.qty = 1; sfx.select(); ck.dirty = true; } return; }
  });
  p.addEventListener('pointermove', e => { const r = e.target.closest && e.target.closest('.pr'); if (r) cookTip(e, r.dataset.k); else hideTip(); });
  p.addEventListener('pointerleave', hideTip);
  $('ckSearch').addEventListener('input', e => { ck.find = e.target.value.trim().toLowerCase(); ck.dirty = true; });
  $('ckSearch').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { e.target.value = ''; ck.find = ''; ck.dirty = true; e.target.blur(); } });
  const setQty = v => { ck.qty = Math.max(1, Math.min(99, v | 0 || 1)); ck.dirty = true; };
  $('btnCkDn').addEventListener('click', () => { setQty(ck.qty - 1); sfx.select(); });
  $('btnCkUp').addEventListener('click', () => { setQty(ck.qty + 1); sfx.select(); });
  $('ckQty').addEventListener('keydown', e => e.stopPropagation());
  $('ckQty').addEventListener('change', e => setQty(+e.target.value));
  const make = all => {
    const b = all ? $('btnCkAll') : $('btnCk');
    if (ck.pot && !all) { stopCook(true); sfx.select(); return; }
    const r = CK_REC[ck.sel]; if (!r) return; if (ck.pot) stopCook(true);
    startCook(r, all ? ckMax(r) : ck.qty, b);
  };
  $('btnCk').addEventListener('click', () => make(false));
  $('btnCkAll').addEventListener('click', () => make(true));
  $('btnCkBack').addEventListener('click', () => { sfx.select(); backFromCook(); });
  $('ckList').addEventListener('keydown', e => { const r = e.target.closest('.pr'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.click(); } });
}
function openCook(n) {
  buildCookUI(); ck.npc = n;
  if (!CK_REC[ck.sel]) ck.sel = COZINHA[0].items[0].id;
  $('talk').hidden = true; $('cozinha').hidden = false; ck.dirty = true; refreshCook();
}
function backFromCook() {
  hideTip(); if (ck.pot) stopCook(true); $('cozinha').hidden = true;
  const n = ck.npc; ck.npc = null; $('talk').hidden = false;
  talkMenu(n, pickLine(['Cheiro bom, não? Lá embaixo ninguém cozinha para você.', 'Coma sentado, se puder. Em pé também serve.', 'Traga mais carne e eu ponho no fogo.']));
}

/* ---------- o fogo: um prato de cada vez; os ingredientes entram quando o prato vai ao fogo ---------- */
function startCook(r, q, el) {
  if (q < 1 || ckMax(r) < 1) { bad(el); toast('Faltam ingredientes.'); return; }
  for (const [id, n] of r.need) reagTake(id, n);
  ck.pot = { r, left: q, done: 0, t: 0, tick: 0 }; ckSfx.start(r.g); ck.dirty = true; invDirty = true;
}
function stopCook(refund) { if (!ck.pot) return; if (refund) for (const [id, n] of ck.pot.r.need) reagGive(id, n); ck.pot = null; ck.dirty = true; invDirty = true; }
function tickCook(dt) {
  const P = ck.pot; if (!P) return;
  if (!cookOpen()) { stopCook(true); return; }
  P.t += dt; P.tick -= dt;
  if (P.tick <= 0) { P.tick = P.r.g === 'brasa' ? 0.32 : 0.22; ckSfx.work(P.r.g); }
  if (P.t < P.r.t) return;
  const r = P.r; reagGive(r.id, 1); ckSfx.done();
  toast(`O Odo preparou: ${ITEMS[r.id].name}`, 'gold');
  P.done++; P.left--; P.t = 0; ck.dirty = true; invDirty = true;
  if (P.left <= 0 || ckMax(r) < 1) { ck.pot = null; return; }
  for (const [id, n] of r.need) reagTake(id, n);
}
const _ckTickFurnace = tickFurnace;
tickFurnace = function (dt) { _ckTickFurnace(dt); tickCook(dt); };

/* ---------- desenho do fogo da janela: brasa com espeto ou caldeirão borbulhando ---------- */
function drawCookFire() {
  const cv = $('ckFire'), x = cv.getContext('2d'), on = !!ck.pot, g = (ck.pot ? ck.pot.r : CK_REC[ck.sel] || {}).g;
  x.clearRect(0, 0, 24, 16);
  const cols = on ? ['#7a1a08', '#c8420b', '#ff9a2a', '#ffe08a'] : ['#2a1a14', '#3a2418', '#5a3020', '#7a3a20'];
  for (let i = 0; i < 24; i++) { x.fillStyle = '#1a1210'; x.fillRect(i, 15, 1, 1); }
  for (let i = 2; i < 22; i++) {
    const h = on ? 2 + Math.floor((Math.sin(gameTime * 9 + i * 1.7) * 0.5 + 0.5) * 4 + Math.random() * 2) : 1 + (i % 3 === 0 ? 1 : 0);
    for (let y = 0; y < h; y++) { x.fillStyle = cols[Math.min(3, Math.floor((h - y) / h * 4 * 0.99))]; x.fillRect(i, 14 - y, 1, 1); }
  }
  if (g === 'caldeirao') {
    x.fillStyle = '#141519'; x.fillRect(5, 3, 14, 7); x.fillRect(6, 10, 12, 1); x.fillRect(8, 11, 8, 1);
    x.fillStyle = '#4a4e57'; x.fillRect(6, 4, 1, 5); x.fillStyle = '#33363d'; x.fillRect(7, 4, 11, 5);
    x.fillStyle = on ? '#b46a30' : '#5a3418'; x.fillRect(6, 3, 12, 1);
    if (on) { const f = Math.floor(gameTime * 6); for (let k = 0; k < 2; k++) { const bx = 7 + ((f * 5 + k * 7) % 10); x.fillStyle = '#e0cca0'; x.fillRect(bx, 2 - ((f + k) % 2), 1, 1); } }
  } else {
    x.fillStyle = '#4a4e57'; x.fillRect(1, 7, 22, 1); x.fillStyle = '#141519'; x.fillRect(1, 8, 22, 1);   // o espeto
    x.fillStyle = on ? '#7a3a12' : '#5a1a1a'; x.fillRect(8, 4, 8, 6); x.fillStyle = on ? '#b0602a' : '#9a2428'; x.fillRect(9, 4, 6, 2);
    if (on) { const f = Math.floor(gameTime * 5) % 3; x.fillStyle = '#9a8a7a'; x.fillRect(10 + f * 2, 1 - (f & 1), 1, 1); }
  }
}
function refreshCook() {
  if (!cookOpen()) return;
  const P = ck.pot, fill = P ? P.t / P.r.t : 0, txt = P ? `${P.r.g === 'brasa' ? 'Assando' : 'Cozinhando'} ${ITEMS[P.r.id].name.toLowerCase()} · ${P.done + 1} de ${P.done + P.left}` : '';
  const w = pct(Math.round(Math.min(1, fill) * 200) / 200), fe = $('ckFill'), te = $('ckBarTxt');
  if (fe._w !== w) { fe.style.width = w; fe._w = w; }
  if (te._t !== txt) { te.textContent = txt; te._t = txt; }
  const fk = P ? Math.floor(gameTime * 12) : -1;
  if (fk !== drawCookFire.k || !!P !== drawCookFire.on || ck.dirty) { drawCookFire.k = fk; drawCookFire.on = !!P; drawCookFire(); }
  if (!ck.dirty) return; ck.dirty = false;
  $('ckGold').textContent = `${fmtOuro(pl.gold)} de ouro`;
  $('ckList').innerHTML = COZINHA.map(G => {
    const items = G.items.filter(r => !ck.find || ITEMS[r.id].name.toLowerCase().includes(ck.find)); if (!items.length) return '';
    const shut = ck.shut[G.k] && !ck.find;
    const head = `<div class="pg${shut ? ' shut' : ''}" data-g="${G.k}" role="button" tabindex="0"><span>${G.name}</span><i aria-hidden="true"></i></div>`;
    if (shut) return head;
    return head + items.map(r => { const n = ckMax(r); return `<div class="pr${r.id === ck.sel ? ' on' : ''}${n > 0 ? ' can' : ''}" data-k="${r.id}" role="option" aria-selected="${r.id === ck.sel}" tabindex="0"><img src="${ICON[r.id].url}" alt=""><span>${ITEMS[r.id].name}</span>${n > 0 ? `<em>[${n}]</em>` : ''}</div>`; }).join('');
  }).join('') || '<p class="pnone">Nenhuma receita com esse nome.</p>';
  const r = CK_REC[ck.sel], it = ITEMS[r.id], max = ckMax(r), busy = !!P, verb = r.g === 'brasa' ? 'Assar' : 'Cozinhar';
  $('ckIcon').src = ICON[r.id].url; $('ckName').textContent = it.name;
  $('ckSub').textContent = `${r.g === 'brasa' ? 'Brasa' : 'Caldeirão'} · ${dec1(r.t)} s por prato`;
  $('ckBody').innerHTML = `<p class="pdesc">${it.desc}</p><h5>Ingredientes</h5><ul class="preag">${r.need.map(([id, n]) => reagRow(id, n, reagHave(id))).join('')}</ul>`;
  ck.qty = Math.max(1, Math.min(ck.qty, Math.max(1, max)));
  $('ckQty').value = ck.qty;
  const mk = $('btnCk'); mk.textContent = busy ? 'Parar' : verb; mk.classList.toggle('stop', busy); mk.disabled = !busy && max < 1;
  const all = $('btnCkAll'); all.textContent = `${verb} todos [${max}]`; all.disabled = max < 1;
  $('btnCkDn').disabled = ck.qty <= 1; $('btnCkUp').disabled = ck.qty >= max;
}
function cookTip(e, id) {
  const tip = $('tip'), key = 'ck|' + id;
  if (tip._key !== key) { tip.innerHTML = tipHTML({ id, n: 1 }, { k: 'inv' }, ''); tip._key = key; }
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 16, y = e.clientY + 14;
  if (x + w > innerWidth - 8) x = e.clientX - w - 12; if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}
const _ckRefreshForge = refreshForge;
refreshForge = function () { _ckRefreshForge(); refreshCook(); };
// sempre que a mochila ou o baú mudam com a janela aberta, as contas da receita refazem
const _ckRefreshInv = refreshInv;
refreshInv = function () { const r = _ckRefreshInv.apply(this, arguments); if (ck.npc) ck.dirty = true; return r; };

/* ---------- a conversa: "Cozinhar" no topo das opções do Odo ---------- */
const _ckTalkMenu = talkMenu;
talkMenu = function (n, text) {
  if (!n || n.id !== 'taverneiro') return _ckTalkMenu(n, text);
  const ts = talkSay;
  talkSay = function (t, o) { talkSay = ts; o.unshift(['Cozinhar', () => openCook(n), true]); return ts(t, o); };
  try { return _ckTalkMenu(n, text); } finally { talkSay = ts; }
};
const _ckCloseTalk = closeTalk;
closeTalk = function () { if (ck.pot) stopCook(true); hideTip(); $('cozinha').hidden = true; ck.npc = null; return _ckCloseTalk.apply(this, arguments); };
addEventListener('keydown', e => {
  if (state !== 'talk' || !cookOpen() || e.repeat || (e.code !== 'Escape' && e.code !== 'KeyE')) return;
  if (e.target && e.target.id === 'ckSearch') return;
  e.stopImmediatePropagation(); e.preventDefault(); backFromCook();
}, true);

/* ================= comer ================= */
const isFood = id => !!(ITEMS[id] && ITEMS[id].food);
function eatCan(id) {
  if (state !== 'play' || pl.dead || !isFood(id) || countItem(id) < 1) return false;
  if (pl.bat || (typeof tp !== 'undefined' && tp.cast) || pl.climb) return false;
  if (!pl.onGround) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Pare para comer', '#d9c7a3', 0.8); return false; }
  return true;
}
function startEat(id) {
  if (ck.eat || !eatCan(id)) return false;
  initAudio();
  pl.atkT = -1; pl.atkBuf = 0; pl.trail.length = 0; pl.mining = false; pl.digT = 0;
  ck.eat = { id, t: 0, dur: ITEMS[id].food.eat, bite: 0.35, held: true };
  return true;
}
function eatCancel() {
  if (!ck.eat) return;
  ck.eat = null; tone(260, 0.12, 'triangle', 0.04, -80);
}
function eatFinish() {
  const id = ck.eat.id, F = ITEMS[id].food; ck.eat = null;
  if (countItem(id) < 1) return;
  removeItem(id, 1); invDirty = true;
  ck.meal = { id, hp: F.hp / F.t, mp: F.mp / F.t, left: F.t, ah: 0, am: 0 };
  const pcx = pl.x + pl.w / 2;
  floatText(pcx, pl.y - 6, '+' + F.hp, '#ffcf7a', 1.1); if (F.mp) floatText(pcx, pl.y - 14, '+' + F.mp, '#7ab4ff', 1);
  burst(pcx, pl.y + 10, 12, '#ffcf7a', 40, -60, 0.8, 1, true); ckSfx.swallow();
}
// a cada quadro: a mordida, as migalhas, as interrupções; depois, a refeição devolvendo vida e mana
HOOK.update.push(dt => {
  const E = ck.eat;
  if (E) {
    const moved = keys.KeyA || keys.KeyD || keys.ArrowLeft || keys.ArrowRight || keys.KeyW || keys.ArrowUp || keys.Space || keys.KeyS || keys.ArrowDown;
    if (!mouse.l) E.held = false;
    if (pl.dead || moved || (mouse.l && !E.held) || mouse.r || keys.ShiftLeft || keys.ShiftRight || !pl.onGround || pl.climb || pl.bat || countItem(E.id) < 1) eatCancel();
  }
  if (ck.eat) {
    const E2 = ck.eat; E2.t += dt; E2.bite -= dt;
    if (E2.bite <= 0) {
      E2.bite = 0.75; ckSfx.bite();
      const mx = pl.x + pl.w / 2 + pl.facing * 3, my = pl.y + 6, cols = ITEMS[E2.id].icon === 'stewBowl' ? ['#b46a30', '#e0cca0'] : ['#b0602a', '#f0b860'];
      for (let i = 0; i < 3; i++) burst(mx, my, 1, cols[i % 2], 26, 260, 0.5);
    }
    if (E2.t >= E2.dur) eatFinish();
  }
  const M = ck.meal;
  if (M && !pl.dead) {
    const k = Math.min(dt, M.left); M.left -= dt;
    if (pl.hp < pl.maxHp) { M.ah += M.hp * k; if (M.ah >= 1) { const n = Math.floor(M.ah); pl.hp = Math.min(pl.maxHp, pl.hp + n); M.ah -= n; } }
    if (M.mp && pl.mana < pl.maxMana) { M.am += M.mp * k; if (M.am >= 1) { const n = Math.floor(M.am); pl.mana = Math.min(pl.maxMana, pl.mana + n); M.am -= n; } }
    if (M.left <= 0) ck.meal = null;
  } else if (M) ck.meal = null;
});
// o clique com o prato na barra começa a comer (antes do updatePlayer, que não sabe o que é comida)
const _ckUpdatePlayer = updatePlayer;
updatePlayer = function (dt) {
  const held = heldBag();
  if (held && held.it.food && mouse.lPressed && !ck.eat && pl.atkT < 0 && pl.shieldK < 0.35 && pl.stunT <= 0) startEat(held.s.id);
  _ckUpdatePlayer(dt);
  if (ck.eat && !pl.dead) {
    // a mão vai à boca e volta a cada mordida
    const ph = 1 - Math.max(0, ck.eat.bite) / 0.75, a = ph < 0.3 ? lerp(1.05, 0.42, ph / 0.3) : ph < 0.55 ? 0.42 : lerp(0.42, 1.05, (ph - 0.55) / 0.45);
    const k = Math.min(1, dt * 18); pl.fArm = lerp(pl.fArm, a, k); pl.vx *= 0.8;
  }
};
const _ckRawDamage = rawDamage;
rawDamage = function (d, kdir) { const r = _ckRawDamage(d, kdir); if (ck.eat) eatCancel(); return r; };
// a comida na mão enquanto come, mesmo que outra coisa esteja na barra
const _ckHeldItem = heldItem;
heldItem = function (L, ang) {
  if (!ck.eat) return _ckHeldItem(L, ang);
  const img = handSprite(ck.eat.id); return img ? { img, ang: 0, px: img.width / 2, py: img.height / 2 + 1 } : null;
};
// a barrinha sobre a cabeça, em âmbar
HOOK.drawTop.push((cx, cy) => {
  if (!ck.eat || pl.dead) return;
  const k = Math.min(1, ck.eat.t / ck.eat.dur), w = 22, x = Math.round(pl.x + pl.w / 2 - w / 2) - cx, y = Math.round(pl.y) - cy - 8;
  lc.globalAlpha = 1; lc.fillStyle = '#0f0904'; lc.fillRect(x - 1, y - 1, w + 2, 5);
  lc.fillStyle = '#5a3410'; lc.fillRect(x, y, w, 3);
  const f = Math.round(w * k); lc.fillStyle = '#d8902e'; lc.fillRect(x, y, f, 3); lc.fillStyle = '#ffd890'; lc.fillRect(x, y, f, 1);
  if (f > 0) { lc.fillStyle = '#fff6e0'; lc.fillRect(x + f - 1, y, 1, 3); }
});
// botão direito no prato, no inventário: fecha a mochila e começa a comer
const _ckQuickAction = quickAction;
quickAction = function (r) {
  const s = itemAt(r);
  if (!s || r.k !== 'inv' || !isFood(s.id) || shopNpc || forgeNpc || ck.npc || (typeof stashOpen === 'function' && stashOpen())) return _ckQuickAction(r);
  if (state === 'inv') closeInv();
  if (!startEat(s.id)) sfx.bad();
};
const _ckActFor = actFor;
actFor = function (s, r) {
  if (!s || !r || r.k !== 'inv' || !isFood(s.id) || shopNpc || forgeNpc || ck.npc || (typeof stashOpen === 'function' && stashOpen())) return _ckActFor(s, r);
  return 'Botão direito: comer · Clique: pegar e mover';
};
// na dica, o prato é "Comida" e o ingrediente é "Ingrediente", não "Material"
const _ckTipHTML = tipHTML;
tipHTML = function (s, r, act2) {
  const h = _ckTipHTML(s, r, act2), it = s && ITEMS[s.id];
  return it && (it.food || it.cook) ? h.replace('<small>Material · ', `<small>${it.food ? 'Comida' : 'Ingrediente'} · `) : h;
};
const _ckNewWorld = newWorld;
newWorld = function (sd, sv) { ck.eat = null; ck.meal = null; ck.pot = null; return _ckNewWorld(sd, sv); };
