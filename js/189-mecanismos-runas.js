'use strict';

/* ================= a Fortaleza dos Anões: alavancas, comportas, o Cinzel e a Bigorna de Runas =================
   - Alavancas e comportas (as das eclusas, que o 185 gera em anLevers): a tecla de usar (E) perto de uma alavanca troca
     o estado dela; as células de AN_COMPORTA da lista viram ar (aberta) ou voltam a sólidas (fechada), uma de cada vez
     em 0,4 s. O estado vai no save da camada (188, `anoes.levers`), nunca nos diffs. As alavancas da Grande Forja são do
     186 (ele responde por elas; aqui elas são só ignoradas).
   - O Cinzel de Runas no pedestal da Oficina do Mestre (E perto do pedestal pega o cinzel, uma vez por save).
   - O Grimaldo: com o cinzel na mochila, ele fica com ele (uma fala curta) e a forja ganha a aba Runas.
   - A aba Runas: grava uma runa numa peça forjada (f_*): 1 runa gravada + 1 barra do metal da peça. Brasa (fogo nos
     golpes), Pedra (+defesa), Fôlego (menos vigor gasto ao bloquear e aparar) e Têmpera (+crítico), com valor pelo
     nível de item da peça. Gravar de novo troca a runa. A runa (`s.rune`) vai junto da peça no save (mochila, corpo e baú da vila). */

/* ---------- alavancas e comportas ---------- */
const AN_GATE_T = 0.4;                 // segundos para a comporta inteira abrir ou fechar
const anGateAnim = [];                 // { i, to, t }: células que ainda vão trocar
const anLeverAt = (x, y) => { x = wrapX(x); for (const L of anLevers) if (L.x === x && L.y === y) return L; return null; };
// o 181 desenha a alavanca com estas duas: puxada ou não, runa acesa ou apagada
// (as da Grande Forja são do 186: o 181 nem pergunta por elas, afLeverCell)
function anLeverOn(x, y) {
  const L = anLeverAt(x, y); return !!(L && L.on);
}
function anLeverReady(x, y) {
  const L = anLeverAt(x, y); return !L || !(L.cd > 0);
}
// liga ou desliga; silent: sem animação nem som (o save chamando ao carregar)
function anLeverSet(L, on, silent) {
  L.on = !!on;
  for (const L2 of anLevers) if (L2 !== L && L2.targets === L.targets) L2.on = L.on;   // as duas alavancas da mesma eclusa andam juntas
  const to = L.on ? AIR : AN_COMPORTA, n = L.targets.length;
  for (let k = anGateAnim.length - 1; k >= 0; k--) if (L.targets.includes(anGateAnim[k].i)) anGateAnim.splice(k, 1);
  L.targets.forEach((i, k) => {
    if (silent) { tiles[i] = to; markDirty(i % WW, (i / WW) | 0); }
    else anGateAnim.push({ i, to, t: (L.on ? k : n - 1 - k) / Math.max(1, n) * AN_GATE_T });
  });
  if (!silent) { L.cd = 0.6; mapVer++; }
  const x = L.x, y = L.y; markDirty(x, y);
}
HOOK.update.push(dt => {
  for (const L of anLevers) if (L.cd > 0) { L.cd -= dt; if (L.cd <= 0) markDirty(L.x, L.y); }
  for (let k = anGateAnim.length - 1; k >= 0; k--) {
    const g = anGateAnim[k]; g.t -= dt; if (g.t > 0) continue;
    const x = g.i % WW, y = (g.i / WW) | 0;
    // fechando em cima de alguém: espera ele sair
    if (g.to !== AIR) { const bx = x * T, by = y * T, hit = b => b.x < bx + T && b.x + b.w > bx && b.y < by + T && b.y + b.h > by; if (hit(pl) || enemies.some(e => !e.dead && hit(e))) { g.t = 0.1; continue; } }
    tiles[g.i] = g.to; markDirty(x, y); anGateAnim.splice(k, 1);
    burst((x + 0.5) * T, (y + 0.5) * T, 3, '#c49448', 40, 200, 0.35);
    if (!anGateAnim.length) { mapVer++; sfx.select(); }
  }
});

/* ---------- a tecla de usar: alavanca das eclusas ou o pedestal do Cinzel ---------- */
const anPedestalNear = (cx, cy) => {
  const P = anOficina && anOficina.prop; if (!P || anState.taken) return false;
  const px = P.X + P.w / 2, py = P.Y + P.h / 2;
  return Math.abs(wdx((cx - px) / T)) * T < 30 && Math.abs(cy - py) < 34;
};
{ const _ud = updateDig; updateDig = function (dt) {
  if (ANOES && pressed.KeyE && state === 'play' && !pl.dead && !nearNpc()) {
    const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2;
    if (inAnoes(Math.floor(cy / T))) {
      if (anPedestalNear(cx, cy)) { anTakeCinzel(); pressed.KeyE = false; }
      else {
        const tx0 = Math.floor(cx / T), ty0 = Math.floor(cy / T); let best = null, bd = 1e9;
        for (let ty = ty0 - 2; ty <= ty0 + 2; ty++) for (let tx = tx0 - 3; tx <= tx0 + 3; tx++) {
          const L = anLeverAt(tx, ty); if (!L || inAnHall(tx, ty)) continue;
          const d = Math.hypot((tx + 0.5) * T - cx, (ty + 0.5) * T - cy); if (d < 36 && d < bd) { bd = d; best = L; }
        }
        if (best) { pressed.KeyE = false; if (!(best.cd > 0)) { anLeverSet(best, !best.on); sfx.select(); } }
      }
    }
  }
  return _ud(dt);
}; }

/* ---------- o Cinzel no pedestal ---------- */
function anTakeCinzel() {
  if (anState.taken) return;
  if (!canFit('cinzel_runico')) return;   // mochila cheia: fica no pedestal
  addItem('cinzel_runico', 1);
  anState.taken = true; invDirty = true; sfx.potion();
  const P = anOficina.prop; burst(P.X + P.w / 2, P.Y + 4, 16, '#7ad0f0', 60, -60, 0.8, 1, true);
}
// o cinzel em cima do pedestal enquanto ninguém pegou, com o brilho azul da runa do cabo
let anCinzelGlow = null;
HOOK.drawWorld.push((cx, cy) => {
  const P = anOficina && anOficina.prop; if (!ANOES || !P || anState.taken || !ICON.cinzel_runico) return;
  const top = P.def.topo || { x: P.w / 2, y: 0 };   // o 182 diz onde fica o tampo do pedestal
  let x = P.X + top.x - 6 - cx; x -= Math.round(x / (WW * T)) * WW * T;
  const y = P.Y + top.y - 12 - cy + Math.round(Math.sin(gameTime * 2) * 1);
  if (x < -20 || x > VW + 20 || y < -20 || y > VH + 20) return;
  lc.drawImage(ICON.cinzel_runico.cv, Math.round(x), y);
});
HOOK.drawGlow.push((cx, cy) => {
  const P = anOficina && anOficina.prop; if (!ANOES || !P || anState.taken) return;
  if (!anCinzelGlow) anCinzelGlow = glow(18, '#7ad0f0');
  const top = P.def.topo || { x: P.w / 2, y: 0 };
  let x = P.X + top.x - cx; x -= Math.round(x / (WW * T)) * WW * T;
  lc.globalAlpha = 0.5 + 0.15 * Math.sin(gameTime * 3); lc.drawImage(anCinzelGlow, Math.round(x - 18), Math.round(P.Y + top.y - 6 - cy - 18)); lc.globalAlpha = 1;
});

/* ---------- o Grimaldo e o cinzel ---------- */
const AN_CINZEL_FALA = 'Deixa eu ver isso. Essa marca, o martelo em cima da montanha e as três runas... é a da minha bigorna. A do meu avô. Ele nunca disse de onde veio, e eu nunca soube ler. Fica comigo. Agora sei gravar o que está escrito nela.';
{ const _tm = talkMenu; talkMenu = function (n, text) {
  _tm(n, text);
  if (!n || n.id !== 'ferreiro' || anState.cinzel || !countItem('cinzel_runico')) return;
  const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Mostrar o Cinzel de Runas';
  b.addEventListener('click', () => {
    sfx.select(); removeItem('cinzel_runico', 1); anState.cinzel = true; anState.taken = true; forgeTab = 'smelt';
    talkMenu(n, AN_CINZEL_FALA);
  });
  const box = $('talkOpts'); box.insertBefore(b, box.firstChild);
}; }

/* ---------- as runas ---------- */
// valor pelo nível de item da peça (L): a 15 (mithril) dá 9 de fogo, +7 de defesa, -25% de vigor, +4% de crítico
const AN_RUNES = {
  brasa: { name: 'Brasa', col: '#ff9a2a', slots: ['weapon'], v: L => Math.round(2 + L * 0.47), line: v => `Runa de Brasa: chance ao acertar de queimar o alvo, ${v} de dano a cada 1 s por 4 s`, desc: 'Fogo nos golpes. Só em armas.' },
  pedra: { name: 'Pedra', col: '#b8b0a0', slots: null, v: L => 1 + Math.round(L * 0.4), line: v => `Runa de Pedra: +${v} de Defesa`, desc: 'Mais defesa.' },
  folego: { name: 'Fôlego', col: '#7ad0f0', slots: null, v: L => Math.min(40, 10 + L), line: v => `Runa de Fôlego: bloquear e aparar gastam ${v}% menos vigor`, desc: 'Menos vigor gasto com o escudo.' },
  tempera: { name: 'Têmpera', col: '#e8c27a', slots: null, v: L => Math.round(10 + L * 2) / 10, line: v => `Runa de Têmpera: +${v}% de chance de crítico`, desc: 'Mais crítico.' }
};
const anRuneL = s => s.il || baseInfo(s.id).L || 1;
const anRuneVal = s => s && s.rune && AN_RUNES[s.rune] ? AN_RUNES[s.rune].v(anRuneL(s)) : 0;
const anRuneMetal = id => METALS.find(M => id.endsWith('_' + M.id));
const anRuneFits = (r, s) => !AN_RUNES[r].slots || AN_RUNES[r].slots.includes(ITEMS[s.id].slot);

{ const _rc = recalc; recalc = function () {
  _rc();
  pl.anFolego = 0;
  for (const k of EQ_SLOTS) {
    const s = equip[k]; if (!s || !s.rune || !AN_RUNES[s.rune]) continue; const v = anRuneVal(s);
    if (s.rune === 'brasa') pl.lg.brasa = (pl.lg.brasa || 0) + v;
    else if (s.rune === 'pedra') pl.def += v;
    else if (s.rune === 'folego') pl.anFolego += v / 100;
    else if (s.rune === 'tempera') pl.crit += v / 100;
  }
  pl.anFolego = Math.min(0.6, pl.anFolego);
  pl.dps = pl.dmg * pl.aps * (1 + Math.min(1, pl.crit) * pl.critDmg);
}; }
{ const _sv = spendVigor; spendVigor = function (parry, boss) {
  const v0 = pl.vig, r = _sv(parry, boss);
  if (pl.anFolego > 0 && pl.vig > 0) pl.vig = Math.min(VIG_MAX, pl.vig + (v0 - pl.vig) * pl.anFolego);
  return r;
}; }
// a linha da runa no fim da caixa da peça
{ const _gt = gearTipBody; gearTipBody = function (s, cmp) {
  let h = _gt(s, cmp);
  if (s && s.rune && AN_RUNES[s.rune]) { const R = AN_RUNES[s.rune]; h += `<div class="fx"><span style="color:${R.col}">${R.line(anRuneVal(s))}</span></div>`; }
  return h;
}; }

// a runa vai no save junto da peça: mais um campo no fim da linha da mochila e do corpo
{ const _mk = makeSave; makeSave = function () {
  const o = _mk();
  if (Array.isArray(o.inv)) inv.forEach((s, i) => { if (s && s.rune && Array.isArray(o.inv[i])) o.inv[i][5] = s.rune; });
  if (o.eq) for (const k of EQ_SLOTS) if (equip[k] && equip[k].rune && Array.isArray(o.eq[k])) o.eq[k][4] = equip[k].rune;
  if (typeof stash !== 'undefined' && Array.isArray(o.stash)) stash.forEach((s, i) => { if (s && s.rune && Array.isArray(o.stash[i])) o.stash[i][5] = s.rune; });   // o baú da vila (27)
  return o;
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  const r = _nw(sd, sv);
  if (sv && sv.hbv && Array.isArray(sv.inv)) sv.inv.forEach((q, i) => { if (Array.isArray(q) && AN_RUNES[q[5]] && inv[i] && inv[i].id === q[0]) inv[i].rune = q[5]; });
  if (sv && Array.isArray(sv.stash) && typeof stash !== 'undefined') sv.stash.forEach((q, i) => { if (Array.isArray(q) && AN_RUNES[q[5]] && stash[i] && stash[i].id === q[0]) stash[i].rune = q[5]; });
  if (sv && sv.eq) for (const k of EQ_SLOTS) { const q = sv.eq[k]; if (Array.isArray(q) && AN_RUNES[q[4]] && equip[k] && equip[k].id === q[0]) equip[k].rune = q[4]; }
  recalc();
  return r;
}; }

/* ---------- a aba Runas na janela da forja ---------- */
let anRuneSel = 'brasa';
// as peças forjadas que o herói tem: no corpo primeiro, depois a mochila
function anRunePieces() {
  const out = [];
  for (const k of EQ_SLOTS) { const s = equip[k]; if (s && ITEMS[s.id].forged) out.push({ key: 'eq:' + k, s, where: 'no corpo' }); }
  inv.forEach((s, i) => { if (s && ITEMS[s.id] && ITEMS[s.id].forged) out.push({ key: 'inv:' + i, s, where: 'na mochila' }); });
  return out;
}
const anRuneCan = s => { const M = anRuneMetal(s.id); return !!M && reagHave('runa_gravada') >= 1 && reagHave(M.bar) >= 1; };
function anRuneTab() {
  const tabs = document.querySelector('#forge .tabs'); if (!tabs) return;
  let b = tabs.querySelector('.tab[data-tab="runas"]');
  if (!anState.cinzel) { if (b) b.remove(); if (forgeTab === 'runas') forgeTab = 'smelt'; return; }
  if (!b) { b = document.createElement('button'); b.className = 'tab'; b.type = 'button'; b.dataset.tab = 'runas'; b.textContent = 'Runas'; tabs.appendChild(b); }
}
function anRefreshRunas() {
  $('pdFill').style.width = '0%'; $('pdFill')._w = '0%'; $('pdBarTxt').textContent = ''; $('pdBarTxt')._t = '';
  if (!forgeDirty) return; forgeDirty = false;
  document.querySelectorAll('#forge .tab').forEach(b => { b.classList.toggle('on', b.dataset.tab === 'runas'); b.classList.toggle('busy', b.dataset.tab === 'smelt' ? furnace.on : b.dataset.tab === 'craft' ? !!anvil : false); });
  $('forgeGold').textContent = `${pl.gold} de ouro`;
  const P = anRunePieces().filter(p => !forgeFind || ITEMS[p.s.id].name.toLowerCase().includes(forgeFind));
  if (!P.some(p => p.key === forgeSel.runas)) forgeSel.runas = P.length ? P[0].key : '';
  $('profList').innerHTML = P.length ? `<div class="pg" data-g="runaspecas" role="button" tabindex="0"><img src="${ICON.runa_gravada.url}" alt=""><span>Peças forjadas</span><small>${reagHave('runa_gravada')} runas</small><i aria-hidden="true"></i></div>` +
    P.map(p => { const R = p.s.rune && AN_RUNES[p.s.rune]; return `<div class="pr${p.key === forgeSel.runas ? ' on' : ''}${anRuneCan(p.s) ? ' can' : ''}" data-k="${p.key}" role="option" aria-selected="${p.key === forgeSel.runas}" tabindex="0"><img src="${ICON[p.s.id].url}" alt=""><span>${ITEMS[p.s.id].name}</span>${R ? `<em style="color:${R.col}">${R.name}</em>` : ''}</div>`; }).join('')
    : '<p class="pnone">Nenhuma peça forjada com você. A runa só pega no metal que passou pela bigorna.</p>';
  const p = P.find(q => q.key === forgeSel.runas);
  const mk = $('btnMake'), all = $('btnMakeAll');
  mk.classList.remove('stop'); all.textContent = 'Gravar todos'; all.disabled = true; $('btnQtyDn').disabled = $('btnQtyUp').disabled = true; $('pdQty').value = 1;
  if (!p) { $('pdIcon').src = ICON.cinzel_runico.url; $('pdName').textContent = 'Bigorna de Runas'; $('pdName').style.color = ''; $('pdSub').textContent = 'Uma runa por peça'; $('pdBody').innerHTML = '<p class="pdesc">Traga uma peça forjada na bigorna (de qualquer metal), uma runa gravada e uma barra do mesmo metal.</p>'; $('pdNote').textContent = ''; mk.textContent = 'Gravar'; mk.disabled = true; return; }
  const s = p.s, it = ITEMS[s.id], M = anRuneMetal(s.id);
  if (!anRuneFits(anRuneSel, s)) anRuneSel = 'pedra';
  $('pdIcon').src = ICON[s.id].url; $('pdName').textContent = it.name; $('pdName').style.color = RAR_COL[itemRar(s)]; $('pdSub').textContent = `Bigorna de Runas · peça ${p.where}`;
  const opts = Object.keys(AN_RUNES).filter(r => anRuneFits(r, s)).map(r => { const R = AN_RUNES[r]; return `<button type="button" class="anrb${r === anRuneSel ? ' on' : ''}" data-r="${r}" style="--rc:${R.col}"><b>${R.name}</b><small>${R.line(R.v(anRuneL(s))).replace(/^Runa de [^:]+: /, '')}</small></button>`; }).join('');
  $('pdBody').innerHTML = `<div class="anrunes">${opts}</div><h5>Materiais</h5><ul class="preag">${reagRow('runa_gravada', 1, reagHave('runa_gravada'))}${M ? reagRow(M.bar, 1, reagHave(M.bar)) : ''}</ul>`;
  const same = s.rune === anRuneSel;
  $('pdNote').textContent = same ? 'Essa runa já está gravada nesta peça.' : !anRuneCan(s) ? (reagHave('runa_gravada') < 1 ? 'Falta uma runa gravada. Elas caem dos autômatos da Fortaleza dos Anões.' : `Falta uma ${ITEMS[M.bar].name.toLowerCase()}.`) : s.rune ? `Gravar troca a runa de ${AN_RUNES[s.rune].name} pela de ${AN_RUNES[anRuneSel].name}.` : '';
  mk.textContent = s.rune ? 'Trocar a runa' : 'Gravar'; mk.disabled = same || !anRuneCan(s);
}
function anEngrave() {
  const p = anRunePieces().find(q => q.key === forgeSel.runas); if (!p) return;
  const s = p.s, M = anRuneMetal(s.id); if (!M || !anRuneCan(s) || s.rune === anRuneSel || !anRuneFits(anRuneSel, s)) return;
  reagTake('runa_gravada', 1); reagTake(M.bar, 1); s.rune = anRuneSel;
  sfx.anvil(0.8); invDirty = true; recalc(); forgeDirty = true;
}
{ const _rf = refreshForge; refreshForge = function () {
  if (forgeOpen() && document.querySelector('#forge .tabs')) anRuneTab();
  if (forgeTab === 'runas') { if (!forgeOpen()) return; if (typeof drawFire === 'function' && forgeDirty) drawFire(); return anRefreshRunas(); }
  return _rf();
}; }
{ const _bf = buildForgeUI; buildForgeUI = function () {
  const first = !forgeBuilt; _bf(); if (!first) return;
  // antes dos ouvintes da forja: na aba Runas os botões gravam (e as runas escolhem), em vez de fundir ou forjar
  $('forge').addEventListener('click', e => {
    if (forgeTab !== 'runas') return;
    const rb = e.target.closest && e.target.closest('.anrb');
    if (rb) { e.stopPropagation(); if (anRuneSel !== rb.dataset.r) { anRuneSel = rb.dataset.r; sfx.select(); forgeDirty = true; } return; }
    const b = e.target.closest && e.target.closest('#btnMake, #btnMakeAll, #btnQtyDn, #btnQtyUp');
    if (b) { e.stopPropagation(); if (b.id === 'btnMake' && !b.disabled) anEngrave(); }
  }, true);
}; }
{ const _of = openForge; openForge = function (n) { _of(n); anRuneTab(); if (forgeTab === 'runas') { forgeDirty = true; refreshForge(); } }; }
// os botões de runa: o mesmo desenho dos botões da janela, com a cor da runa na borda
{ const st = document.createElement('style'); st.textContent = `
#forge .anrunes{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:4px 0 10px}
#forge .anrb{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:2px;padding:6px 6px;border:1px solid #3a2e24;border-left:3px solid var(--rc);background:#1a1410;color:#d8c8b0;font:inherit;cursor:pointer}
#forge .anrb b{color:var(--rc);font-weight:normal}
#forge .anrb small{font-size:0.8em;opacity:0.8;line-height:1.2}
#forge .anrb.on{background:#2a2016;border-color:var(--rc);box-shadow:inset 0 0 0 1px var(--rc)}
#forge .anrb:hover{background:#241a12}`; document.head.appendChild(st); }
