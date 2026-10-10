'use strict';

/* ================= Marta, a alquimista: o alambique e a botica =================
   A Marta deixou de curar de graça: agora é alquimista e herborista. Na conversa: "Alquimia" abre o livro de receitas
   dela (o mesmo livro de profissão da forja do Grimaldo, js/18-forja.js), "Comprar e vender" abre a botica.
   - O livro: receitas à esquerda em grupos (vida, mana e os elixires de cada camada) com busca e [N] = quantas dá para fazer;
     à direita a receita escolhida (efeito, ingredientes que você tem/precisa), o caldeirão, a barra, Fazer todos,
     quantidade e Preparar. Os ingredientes contam e saem da mochila e do baú do vilarejo (js/93-reagentes.js) na hora
     em que cada frasco começa; fechar a janela no meio devolve os do frasco que estava no fogo. O que fica pronto vai
     para a mochila (ou para o baú se ela estiver cheia).
   - A janela é a casa dela (kit de moradores de css/temas-npc.css: telhado de palha, reboco e madeira, ervas secando);
     o desenho próprio do livro fica em css/alquimia.css.
   - A placa da casa troca a cruz vermelha por um frasco verde; ela segura um frasco verde; falas novas.
   - A botica vende Poção de Vida, Poção de Mana e Frasco de Vidro, e compra ervas, frascos, poções e elixires.
   Carrega depois do 93-reagentes e antes do 24-boot. Dados das receitas: js/94-alquimia-dados.js. */

/* ---- ingredientes: mochila + baú (93-reagentes) ---- */
const rHave = id => typeof reagHave === 'function' ? reagHave(id) : countItem(id);
const rTake = (id, n) => typeof reagTake === 'function' ? reagTake(id, n) : (countItem(id) >= n && (removeItem(id, n), true));
const rGive = (id, n) => typeof reagGive === 'function' ? reagGive(id, n) : addItem(id, n);
const brewMax = rc => Math.min(...rc.r.map(([id, n]) => Math.floor(rHave(id) / n)));

/* ---- a moradora ---- */
const MARTA = NPCS.find(n => n.id === 'curandeira');
MARTA.role = 'a alquimista';
MARTA.item = [["..kk..", "..ww..", ".wGGw.", "wGgggw", "wGgggw", ".wwww."], { k: '#8a5a32', w: '#cfe6f0', G: '#9af0a0', g: '#3ab84a' }, 3, 5];
HELLO.curandeira = ['Cuidado com a mesa, tem coisa ali que explode. Em que posso ajudar?', 'Chegou na hora: o alambique acabou de esfriar.', 'Trouxe ervas? Sempre preciso de ervas.'];
CHAT.curandeira = [
  'Sanguinária cresce no capim aqui de cima. Com duas folhas e um frasco eu faço uma poção de vida.',
  'Lá embaixo, nas grutas, tem um lírio azul que brilha no escuro. É dele que sai a poção de mana.',
  'Um elixir não cura nada. Ele muda você por um tempo. Mais força, mais fôlego, pele mais grossa.',
  'Cada camada lá embaixo tem a sua erva. Quanto mais fundo, mais forte o que dá para fazer com ela.',
  'Erva colhida volta a nascer, se você deixar a terra em paz um pouco.'
];
{ const k = CHAT.taverneiro.findIndex(l => typeof l === 'string' && l.startsWith('A Marta cura')); if (k >= 0) CHAT.taverneiro[k] = 'A Marta largou as ataduras e agora vive no meio de frascos. Se a casa dela soltar fumaça verde, não entre.'; }

/* ---- a botica ---- */
Object.assign(MAT_VAL, { erva_sangue: 3, lirio_gruta: 5, losna: 8, flor_geada: 12, raiz_brasa: 16, frasco: 1, pocao_maior: 20, pocao_superior: 34, pocao_mana: 10, pocao_mana_maior: 20, elixir_pedra: 24, elixir_peconha: 24, elixir_regen: 24, elixir_antidoto: 28, elixir_espectral: 32, elixir_carnical: 32, elixir_clareza: 34, elixir_geada: 40, elixir_furia: 40, elixir_vida: 40, elixir_brasa: 48, elixir_polvora: 48 });
{ const c = SHOPS.curandeira, b = c.buys; c.title = 'Botica da Marta'; c.buys = id => b(id) || id === 'frasco' || !!ALQ[id] || HERBS.some(h => h.id === id); c.hint = c.hint.replace(/^Compra /, 'Compra ervas, frascos, poções, elixires, '); }
{ const _rs = restock; restock = function () { _rs(); stock.curandeira = [{ s: { id: 'pocao', n: 1 }, price: 30, inf: true }, { s: { id: 'pocao_mana', n: 1 }, price: 30, inf: true }, { s: { id: 'frasco', n: 1 }, price: 2, inf: true }]; }; }

/* ---- a conversa: alambique e botica, sem cura ---- */
{ const _tm = talkMenu; talkMenu = function (n, text) {
  if (n.id !== 'curandeira') return _tm(n, text);
  talkSay(text, [['Alquimia', () => openAlq(n), true], ['Comprar e vender', () => openShop(n)], ['Conversar', () => chat(n)], ['Até logo', closeTalk]]);
}; }

/* ---- a placa da casa: um frasco verde no lugar da cruz ---- */
function paintAlchemySign(x) {
  vTex(x, 69, 40, 13, 11, RAMP.beam, (px, py, i, j) => (i === 0 || j === 0 ? 3.8 : i === 12 || j === 10 ? 1 : 2.6) + sn(px, py, 12, 160, 318) * 1);
  const glass = heroRamp('#7a96a4'), liq = heroRamp('#3ab84a');
  vTex(x, 70, 41, 11, 9, RAMP.plaster, (px, py) => {
    const cx = px - 75, cy = py - 46.5, r = Math.hypot(cx, (cy) * 1.05);
    if (py <= 43 && Math.abs(cx) <= 0 && py >= 42) return glass[py === 42 ? 4 : 3];            // o gargalo
    if (py === 41 && Math.abs(cx) <= 1) return '#8a5a32';                                       // a rolha
    if (r <= 3.4) { if (r > 2.5) return glass[cx < 0 ? 4 : 1]; return py >= 46 ? liq[cx < 0 && py === 46 ? 5 : cx > 0 ? 2 : 3] : glass[1]; }
    return 4.2 + grn(px, py, 320) * 0.9;
  });
}
function alqCottage() { const b = bCottage(); paintAlchemySign(b.c.getContext('2d')); return b; }
BUILDERS.cottage = alqCottage;
{ const house = alqCottage().c, c = mk(13, 11); c.getContext('2d').drawImage(house, 70, 41, 13, 11, 0, 0, 13, 11); document.documentElement.style.setProperty('--healer-sign', `url(${c.toDataURL()})`); }

/* ================= o livro de alquimia ================= */
let alqNpc = null, alqBuilt = false, alqSel = 'pocao', alqQty = 1, alqFind = '', alqShut = {}, brew = null, alqDirty = true;
const alqOpen = () => !!alqNpc && !!$('alq') && !$('alq').hidden;
const alqRecipe = id => ALQ_RECIPES.find(rc => rc.id === id);

function buildAlqUI() {
  if (alqBuilt) return; alqBuilt = true;
  const o = document.createElement('div'); o.id = 'alq'; o.className = 'overlay'; o.hidden = true;
  o.innerHTML = `<section class="panel forgep alqp" aria-label="Alquimia">
    <header class="ch"><h3>Alquimia da Marta</h3><span id="alqGold" class="coin"></span><button class="ghost sm" id="btnAlqBack" type="button">Voltar</button></header>
    <div class="prof">
      <div class="plist">
        <label class="psearch"><input id="alqSearch" type="search" placeholder="Procurar" autocomplete="off" spellcheck="false"></label>
        <div class="recipes" id="alqList" role="listbox" aria-label="Receitas"></div>
      </div>
      <div class="pdet">
        <div class="pdh"><div class="pico"><img id="alqIcon" alt=""></div><div><h4 id="alqName"></h4><small id="alqSub"></small></div></div>
        <div class="pdbody" id="alqBody"></div>
        <div class="pwork">
          <div class="pstate"><canvas id="alqCv" width="16" height="12" aria-hidden="true"></canvas><div class="pbar"><i id="alqFill"></i><span id="alqBarTxt"></span></div></div>
          <p class="pnote" id="alqNote"></p>
          <div class="pact">
            <button class="ghost" id="btnAlqAll" type="button"></button>
            <div class="qty"><button class="ghost sm" id="btnAlqDn" type="button" aria-label="Menos">◀</button><input id="alqQty" type="text" inputmode="numeric" value="1" aria-label="Quantidade"><button class="ghost sm" id="btnAlqUp" type="button" aria-label="Mais">▶</button></div>
            <button id="btnAlqMake" type="button"></button>
          </div>
        </div>
      </div>
    </div>
  </section>`;
  document.body.insertBefore(o, $('forge').nextSibling);
  const p = o.querySelector('.alqp');
  p.addEventListener('contextmenu', e => e.preventDefault());
  o.addEventListener('click', e => {
    if (e.target === o) { backFromAlq(); return; }
    const t = e.target;
    const g = t.closest('.pg'); if (g) { alqShut[g.dataset.g] = !alqShut[g.dataset.g]; sfx.select(); alqDirty = true; return; }
    const r = t.closest('.pr'); if (r) { if (alqSel !== r.dataset.k) { alqSel = r.dataset.k; alqQty = 1; sfx.select(); alqDirty = true; } return; }
  });
  p.addEventListener('pointermove', e => { const r = e.target.closest && e.target.closest('.pr'); if (r) alqTip(e, r.dataset.k); else hideTip(); });
  p.addEventListener('pointerleave', hideTip);
  $('alqSearch').addEventListener('input', e => { alqFind = e.target.value.trim().toLowerCase(); alqDirty = true; });
  $('alqSearch').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { e.target.value = ''; alqFind = ''; alqDirty = true; e.target.blur(); } });
  const setQty = v => { alqQty = Math.max(1, Math.min(99, v | 0 || 1)); alqDirty = true; };
  $('btnAlqDn').addEventListener('click', () => { setQty(alqQty - 1); sfx.select(); });
  $('btnAlqUp').addEventListener('click', () => { setQty(alqQty + 1); sfx.select(); });
  $('alqQty').addEventListener('keydown', e => e.stopPropagation());
  $('alqQty').addEventListener('change', e => setQty(+e.target.value));
  const make = all => {
    if (brew && !all) { stopBrew(true); sfx.select(); return; }
    const rc = alqRecipe(alqSel); if (!rc) return; if (brew) stopBrew(true);
    startBrew(rc, all ? brewMax(rc) : alqQty, all ? $('btnAlqAll') : $('btnAlqMake'));
  };
  $('btnAlqMake').addEventListener('click', () => make(false));
  $('btnAlqAll').addEventListener('click', () => make(true));
  $('btnAlqBack').addEventListener('click', () => { sfx.select(); backFromAlq(); });
  $('alqList').addEventListener('keydown', e => { const r = e.target.closest('.pr'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.click(); } });
  if (typeof customScroll === 'function') { customScroll($('alqList')); customScroll($('alqBody')); }
}
function openAlq(n) {
  buildAlqUI(); alqNpc = n;
  if (!alqRecipe(alqSel)) alqSel = ALQ_RECIPES[0].id;
  $('talk').hidden = true; $('alq').hidden = false; alqDirty = true; refreshAlq();
}
function backFromAlq() {
  hideTip(); if (brew) stopBrew(true); $('alq').hidden = true;
  const n = alqNpc; alqNpc = null; if (!n) return;
  $('talk').hidden = false; talkMenu(n, pickLine(['Lave as mãos antes de comer. Sério.', 'Feche a porta devagar, o vidro é fino.', 'Volte quando tiver mais ervas.']));
}
{ const _ct = closeTalk; closeTalk = function () { if (alqOpen()) { backFromAlq(); return; } if (alqBuilt) { if (brew) stopBrew(true); $('alq').hidden = true; alqNpc = null; } _ct(); }; }

/* ---- preparar: um frasco de cada vez, os ingredientes entram quando ele vai ao fogo ---- */
function startBrew(rc, q, el) {
  q = Math.min(q, brewMax(rc));
  if (q < 1) { if (el) bad(el); return; }
  for (const [id, n] of rc.r) rTake(id, n);
  brew = { rc, left: q, done: 0, t: 0 }; sfx.potion(); alqDirty = true; invDirty = true;
}
function stopBrew(refund) { if (!brew) return; if (refund) for (const [id, n] of brew.rc.r) rGive(id, n); brew = null; alqDirty = true; invDirty = true; }
function tickBrew(dt) {
  if (!brew) return;
  if (!alqOpen()) { stopBrew(true); return; }
  brew.t += dt; if (brew.t < brew.rc.t) return;
  const id = brew.rc.id, left = rGive(id, 1);
  if (left) dropLoot(pl.x + pl.w / 2, pl.y + pl.h - 2, id, 1, true);
  sfx.potion(); setTimeout(() => sfx.select(), 120);
  toast(`Você preparou: ${ITEMS[id].name}`, '', RAR_COL[ITEMS[id].rar || 0]);
  brew.done++; brew.left--; brew.t = 0; alqDirty = true; invDirty = true;
  if (brew.left <= 0) { brew = null; return; }
  if (brewMax(brew.rc) < 1) { toast('Acabaram os ingredientes: o alambique parou.'); brew = null; return; }
  for (const [rid, n] of brew.rc.r) rTake(rid, n);
}
{ const _tf = tickFurnace; tickFurnace = function (dt) { _tf(dt); tickBrew(dt); }; }
{ const _rf = refreshForge; refreshForge = function () { _rf(); refreshAlq(); }; }

/* ---- o caldeirão: ferro, o líquido da receita e bolhas quando ferve ---- */
function drawCauldron() {
  const cv = $('alqCv'), x = cv.getContext('2d'); x.clearRect(0, 0, 16, 12);
  const rc = brew ? brew.rc : alqRecipe(alqSel), on = !!brew, L = heroRamp(ALQ[rc.id].liq), I = heroRamp('#4a4a52');
  for (let i = 3; i < 13; i++) { x.fillStyle = on ? (i % 3 ? '#f6881a' : '#ffc24a') : '#3a2418'; x.fillRect(i, 11, 1, 1); }   // o fogo debaixo
  for (let j = 4; j < 11; j++) for (let i = 1; i < 15; i++) {
    const r = Math.hypot((i - 7.5) / 7, (j - 4) / 6.5); if (r > 1) continue;
    x.fillStyle = r > 0.82 ? I[i < 7 ? 3 : 1] : j === 4 ? L[on ? 5 : 3] : I[0]; x.fillRect(i, j, 1, 1);
  }
  x.fillStyle = I[4]; x.fillRect(0, 4, 2, 1); x.fillRect(14, 4, 2, 1);
  if (on) for (let k = 0; k < 4; k++) { const ph = (gameTime * 1.3 + k * 0.27) % 1, bx = 3 + ((k * 37) % 10); x.fillStyle = L[k % 2 ? 4 : 5]; x.fillRect(bx + Math.round(Math.sin(ph * 6 + k) * 0.6), 3 - Math.floor(ph * 4), 1, 1); }
}
function alqTip(e, id) {
  const tip = $('tip'), key = 'alq|' + id;
  if (tip._key !== key) { tip.innerHTML = tipHTML({ id, n: 1 }, { k: 'inv' }, ''); tip._key = key; }
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 16, y = e.clientY + 14;
  if (x + w > innerWidth - 8) x = e.clientX - w - 12; if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}
function refreshAlq() {
  if (!alqOpen()) return;
  let fill = 0, txt = '';
  if (brew) { fill = brew.t / brew.rc.t; txt = `Preparando ${ITEMS[brew.rc.id].name.toLowerCase()} · ${brew.done + 1} de ${brew.done + brew.left}`; }
  const w = pct(Math.round(Math.min(1, fill) * 200) / 200), fe = $('alqFill'), te = $('alqBarTxt');
  if (fe._w !== w) { fe.style.width = w; fe._w = w; }
  if (te._t !== txt) { te.textContent = txt; te._t = txt; }
  const fk = brew ? Math.floor(gameTime * 12) : -1;
  if (fk !== drawCauldron.k || alqDirty) { drawCauldron.k = fk; drawCauldron(); }
  if (!alqDirty) return; alqDirty = false;
  $('alqGold').textContent = `${pl.gold} de ouro`;
  $('alqList').innerHTML = ALQ_GROUPS.map(([g, name]) => {
    const items = ALQ_RECIPES.filter(rc => rc.g === g && (!alqFind || ITEMS[rc.id].name.toLowerCase().includes(alqFind))); if (!items.length) return '';
    const shut = alqShut[g] && !alqFind;
    const head = `<div class="pg${shut ? ' shut' : ''}" data-g="${g}" role="button" tabindex="0"><img src="${ICON[items[0].id].url}" alt=""><span>${name}</span><i aria-hidden="true"></i></div>`;
    if (shut) return head;
    return head + items.map(rc => { const n = brewMax(rc); return `<div class="pr${rc.id === alqSel ? ' on' : ''}${n > 0 ? ' can' : ''}" data-k="${rc.id}" role="option" aria-selected="${rc.id === alqSel}" tabindex="0"><img src="${ICON[rc.id].url}" alt=""><span>${ITEMS[rc.id].name}</span>${n > 0 ? `<em>[${n}]</em>` : ''}</div>`; }).join('');
  }).join('') || '<p class="pnone">Nenhuma receita com esse nome.</p>';
  const rc = alqRecipe(alqSel), it = ITEMS[rc.id], a = ALQ[rc.id];
  $('alqIcon').src = ICON[rc.id].url; $('alqName').textContent = it.name; $('alqName').style.color = RAR_COL[it.rar || 0];
  $('alqSub').textContent = `Alambique · ${dec1(rc.t)} s por frasco`;
  const eff = a.kind === 'life' ? `+${a.heal} de vida em 5 s` : a.kind === 'mana' ? `+${a.mana} de mana em 2 s` : `${a.fx} por ${Math.round(a.t / 60)} minutos`;
  $('alqBody').innerHTML = `<p class="pdesc">${it.desc}</p><div class="alqfx"><b>Efeito</b><span>${eff}</span><b>Na mochila</b><span>${countItem(rc.id)}</span></div><h5>Ingredientes</h5><ul class="preag">${rc.r.map(([id, n]) => reagRow(id, n, rHave(id))).join('')}</ul>`;
  const max = brewMax(rc);
  alqQty = Math.max(1, Math.min(alqQty, Math.max(1, max))); $('alqQty').value = alqQty;
  const miss = rc.r.filter(([id, n]) => rHave(id) < n).map(([id, n]) => `${n - rHave(id)} ${ITEMS[id].name.toLowerCase()}`);
  $('alqNote').textContent = brew ? (brew.rc.id !== rc.id ? `O alambique está ocupado com ${ITEMS[brew.rc.id].name.toLowerCase()}.` : '') : miss.length ? `Falta: ${miss.join(', ')}.` : '';
  const mk = $('btnAlqMake'); mk.textContent = brew ? 'Parar' : 'Preparar'; mk.classList.toggle('stop', !!brew); mk.disabled = !brew && max < 1;
  const all = $('btnAlqAll'); all.textContent = `Preparar todos [${max}]`; all.disabled = max < 1;
  $('btnAlqDn').disabled = alqQty <= 1; $('btnAlqUp').disabled = alqQty >= max;
}
