'use strict';

/* ================= character sheet (C) ================= */
const STAT_HELP = {
  'Dano': 'Quanto cada golpe tira de vida: sai sorteado entre o mínimo e o máximo. Vem da arma, dos bônus de dano e do % de dano dos itens. Machados variam muito, maças quase nada.',
  'Golpes por segundo': 'Quantos golpes você dá por segundo segurando o botão. Vem da velocidade da arma e dos bônus de velocidade de ataque. Adagas são as mais rápidas; machados os mais lentos.',
  'Dano por segundo': 'O dano médio de um segundo de ataque, contando os golpes por segundo, o crítico e o dano crítico. Serve para comparar armas.',
  'Alcance': 'Até onde a lâmina chega a partir do centro do corpo. Lanças alcançam mais longe, adagas menos; sem arma o alcance é bem curto.',
  'Crítico': 'Chance de cada golpe ser crítico e causar dano extra (veja Dano crítico). Todo mundo tem 5%; adagas têm mais 5%.',
  'Dano crítico': 'Quanto um golpe crítico causa a mais. +75% quer dizer que o crítico tira 1,75x o dano normal.',
  'Roubo de vida': 'Parte do dano que você causa volta como vida para você. Com 2%, cada 100 de dano devolve 2 de vida.',
  'Chance de atordoar': 'Chance de um golpe deixar o inimigo tonto por quase 1 segundo, sem atacar. Vem das maças (30%); não funciona no Carrasco.',
  'Empurrão': 'Quão longe seus golpes jogam o inimigo para trás. 100% é o normal; machados empurram bem mais longe.',
  'Estocada': 'Armas de estocada (lanças) atacam em linha reta para a frente, em vez de girar em arco.',
  'Vida máxima': 'O total de vida. Começa em 20 e sobe com itens de vida.',
  'Defesa': 'Reduz o dano de todo golpe que você recebe. Entre parênteses, quanto ela corta: cada ponto vale um pouco menos que o anterior, e o máximo é 75%. Todo golpe ainda tira pelo menos 1. Sobe com a armadura.',
  'Janela de aparo': 'Quanto tempo, logo depois de levantar o escudo, um golpe vira um aparo: o inimigo fica atordoado e você não leva nada. Depende do escudo.',
  'Esquiva': 'Chance de escapar ileso de um golpe que não foi bloqueado. O máximo é 40%.',
  'Espinhos': 'Quem te acerta de perto leva de volta essa parte do dano que você recebeu.',
  'Regeneração': 'Vida que volta a cada 5 segundos, depois de 4 segundos sem levar dano. Só vem de itens.',
  'Vida ao matar': 'Vida que você recupera cada vez que derrota um inimigo.',
  'Velocidade': 'Quão mais rápido você anda em relação ao normal. Vem de botas, armaduras e acessórios.',
  'Mineração': 'Velocidade para cavar blocos. 100% é a picareta velha; picaretas melhores cavam mais rápido.',
  'Dano da picareta': 'Quanto a picareta tira de um inimigo quando ele está no caminho enquanto você minera. Bem menos que a espada.',
  'Luz': 'Aumenta o brilho ao seu redor nas cavernas, para enxergar mais longe no escuro.',
  'Bônus de XP': 'Experiência extra ganha por cada inimigo derrotado. +10% quer dizer 10% a mais.',
  'Arma': 'A arma que está na sua mão. Troque no inventário (tecla I).',
  'Mana máxima': 'O total de mana: 25. Por enquanto a mana ainda não é usada.',
  'Inimigos derrotados': 'Quantos inimigos você já derrotou neste mundo.',
  'Ouro': 'Dinheiro para comprar no vilarejo. Cai dos inimigos e dos baús, e você ganha vendendo o que traz das cavernas.',
  'Próximo nível': 'Quanta experiência falta para subir de nível.'
};
function charTipAt(t) {
  const tip = $('charTip'), el = t && t.closest && t.closest('.statbox dt, .statbox dd');
  document.querySelectorAll('#chStats .hl').forEach(e => e.classList.remove('hl'));
  if (!el) { tip.hidden = true; return; }
  const dt = el.tagName === 'DT' ? el : el.previousElementSibling, dd = dt.nextElementSibling, k = dt.textContent;
  dt.classList.add('hl'); dd.classList.add('hl');
  tip.innerHTML = `<span class="tn">${k}</span><small>Agora: ${dd.textContent}</small><p>${STAT_HELP[k] || ''}</p>`;
  tip.hidden = false;
  const r = dd.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  let x = r.right + 12, y = r.top - 6;
  if (x + w > innerWidth - 8) x = dt.getBoundingClientRect().left - w - 12;
  if (x < 8) x = Math.max(8, r.left); if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function openChar() {
  if (state !== 'play' || pl.dead) return;
  state = 'char'; mouse.l = mouse.r = false; pl.shieldOn = false;
  $('char').hidden = false; refreshChar();
}
function closeChar() { $('charTip').hidden = true; $('char').hidden = true; state = 'play'; last = performance.now(); }
$('btnCloseChar').addEventListener('click', closeChar);
function refreshChar() {
  const need = xpNeed(pl.lvl), regen = pl.regenB, w = equip.weapon;
  $('chLvl').textContent = `Nível ${pl.lvl}`;
  $('chHp').textContent = `${Math.ceil(pl.hp)} / ${pl.maxHp}`; $('chHpF').style.width = pct(pl.hp / pl.maxHp);
  $('chMp').textContent = `${Math.floor(pl.mana)} / ${pl.maxMana}`; $('chMpF').style.width = pct(pl.mana / pl.maxMana);
  $('chXp').textContent = `${Math.floor(pl.xp)} / ${need}`; $('chXpF').style.width = pct(Math.min(1, pl.xp / need));
  const m = v => (v / T).toFixed(1).replace('.', ',') + ' m';
  // [label, text, is it zero, is it a bonus]
  const groups = [
    ['Ataque', [
      ['Dano', `${pl.dmgMin} – ${pl.dmgMax}`], ['Golpes por segundo', dec1(pl.aps)], ['Dano por segundo', dec1(pl.dps)], ['Alcance', m(pl.reach)],
      ['Crítico', pct(pl.crit), !pl.crit], ['Dano crítico', '+' + pct(pl.critDmg)], ['Roubo de vida', pct1(pl.lifeSteal), !pl.lifeSteal, pl.lifeSteal > 0],
      ['Chance de atordoar', pct(pl.stunCh), !pl.stunCh, pl.stunCh > 0], ['Empurrão', pct(pl.kb)], ['Estocada', pl.thrust ? 'sim' : 'não', !pl.thrust]]],
    ['Defesa', [
      ['Vida máxima', String(pl.maxHp)], ['Defesa', pl.def ? `${pl.def} (${Math.round(armorCut(pl.def) * 100)}%)` : '0', !pl.def], ['Janela de aparo', pl.parry ? secs(pl.parry) : 'sem escudo', !pl.parry],
      ['Esquiva', pct(pl.dodge), !pl.dodge, pl.dodge > 0], ['Espinhos', pct(pl.thorns), !pl.thorns, pl.thorns > 0],
      ['Regeneração', dec1(regen * 5) + ' a cada 5 s', !regen, regen > 0], ['Vida ao matar', '+' + pl.onKill, !pl.onKill, pl.onKill > 0]]],
    ['Exploração', [
      ['Velocidade', signPct(pl.spd), !pl.spd, pl.spd > 0], ['Mineração', equip.tool ? pct(pl.mine) : 'sem picareta', !equip.tool],
      ['Dano da picareta', String(pl.pickDmg || 4)], ['Luz', '+' + pl.light, !pl.light, pl.light > 0], ['Bônus de XP', signPct(pl.xpB), !pl.xpB, pl.xpB > 0]]],
    ['Jornada', [
      ['Arma', w ? itemName(w) : 'nenhuma', !w], ['Mana máxima', String(pl.maxMana)], ['Inimigos derrotados', String(pl.kills)], ['Ouro', goldTxt(pl.gold)],
      ['Próximo nível', `faltam ${Math.max(0, need - Math.floor(pl.xp))} XP`]]]
  ];
  $('chStats').innerHTML = groups.map(([h, rows]) => `<section class="statbox"><h4>${h}</h4><dl>${rows.map(([k, v, z, up]) => `<dt>${k}</dt><dd class="${z ? 'zero' : up ? 'up' : ''}">${v}</dd>`).join('')}</dl></section>`).join('');
  const cv = $('charCv'), x = cv.getContext('2d');
  compose(poseFor(0, 2.7, 0.9, 'idle', false)); x.clearRect(0, 0, 48, 44); x.drawImage(comp, OX - 18, OY - 12, 48, 44, 0, 0, 48, 44);
}
const dec1 = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
const STAT_FMT = {
  dmg: ['Dano', v => String(Math.round(v)), v => String(Math.round(v))], dmgPct: ['Dano', v => '+' + pct(v), pct], atkSpd: ['Vel. de ataque', v => '+' + pct(v), pct],
  crit: ['Crítico', pct, pct], critDmg: ['Dano crítico', v => '+' + pct(v), pct], lifeSteal: ['Roubo de vida', pct1, pct1], mine: ['Mineração', pct, pct],
  def: ['Defesa', v => (v > 0 ? '+' : '') + v, v => String(v)], hp: ['Vida', v => '+' + v, v => String(v)], parry: ['Janela de aparo', secs, secs],
  thorns: ['Espinhos', pct, pct], dodge: ['Esquiva', pct, pct], spd: ['Velocidade', signPct, pct], xp: ['Bônus de XP', signPct, pct],
  regen: ['Regeneração', v => '+' + dec1(v) + ' /s', v => dec1(v) + ' /s'], onKill: ['Vida ao matar', v => '+' + v, v => String(v)], light: ['Luz', v => '+' + v, v => String(v)]
};
function tipHTML(s, r, act2) {
  const it = ITEMS[s.id], rar = itemRar(s), st = itemStats(s), base = baseStats(s);
  let cmp = null;
  if (it.slot && r.k === 'inv') { const tgt = it.slot === 'acc' ? (equip.acc1 && equip.acc2 ? equip.acc1 : null) : equip[it.slot]; cmp = itemStats(tgt); }
  if (it.slot) {   // gear: damage range, speed, DPS, base numbers and the rolled effects (js/48-itemizacao.js)
    const tgt = r.k === 'inv' ? (it.slot === 'acc' ? (equip.acc1 && equip.acc2 ? equip.acc1 : null) : equip[it.slot]) : undefined;
    const act = act2 != null ? act2 : r.k === 'eq' ? 'Clique para tirar' : 'Clique para equipar';
    return `<span class="tn" style="color:${RAR_COL[rar]}">${itemName(s)}</span>${gearTipBody(s, tgt)}${it.desc ? `<p>${it.desc}</p>` : ''}${act ? `<em>${act}</em>` : ''}`;
  }
  let lines = '';
  for (const k in STAT_FMT) {
    const v = st[k], c = cmp ? cmp[k] : 0;
    if (!v && !c) continue;
    const [lab, f, fd] = STAT_FMT[k];
    let diff = '';
    if (cmp) { const d = v - c; if (Math.abs(d) > 1e-6) diff = ` <span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${fd(Math.abs(d))}</span>`; }
    lines += `<li${Math.abs(v - base[k]) > 1e-6 ? ' class="mg"' : ''}><span>${lab}</span><b>${v ? f(v) : '—'}</b>${diff}</li>`;
  }
  const K = it.slot === 'weapon' ? KIND[it.kind || 'sword'] : null;
  const type = it.slot ? (K ? K.name : SLOT_NAME[it.slot]) : it.use ? 'Consumível' : it.block ? 'Bloco' : 'Material';
  const kd = K ? `<p class="kd">Velocidade ${K.spd >= 1.3 ? 'rápida' : K.spd <= 0.75 ? 'lenta' : 'normal'} · alcance ${K.reach >= 40 ? 'longo' : K.reach <= 22 ? 'curto' : 'médio'} · ${K.note}</p>` : '';
  const act = act2 != null ? act2 : r.k === 'eq' ? 'Clique para tirar' : it.slot ? 'Clique para equipar' : it.use ? 'Clique para beber' : it.block ? 'Na fileira de baixo (a barra), clique no mundo para colocar' : '';
  return `<span class="tn" style="color:${RAR_COL[rar]}">${itemName(s)}</span><small>${type} · ${RAR[rar]}</small>${kd}${lines ? `<ul>${lines}</ul>` : ''}${it.desc ? `<p>${it.desc}</p>` : ''}${act ? `<em>${act}</em>` : ''}`;
}
function onInvHover(e) {
  if ((drag && drag.moved) || held) { hideTip(); return; }
  const el = e.target.closest && e.target.closest('.slot'); const r = refOf(el); const s = itemAt(r);
  if (!s) { hideTip(); return; }
  const uidOf = q => q ? q.uid : '', sl = ITEMS[s.id].slot;
  const tip = $('tip'), key = (s.uid || s.id) + '|' + r.k + '|' + uidOf(equip.acc1) + ',' + uidOf(equip.acc2) + ',' + (sl && sl !== 'acc' ? uidOf(equip[sl]) : '');
  const key2 = key + '|' + (shopNpc ? shopNpc.id + sellArm : '') + '|' + (s.n || 1);
  if (tip._key !== key2) { tip.innerHTML = tipHTML(s, r, actFor(s, r)); tip._key = key2; }
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 16, y = e.clientY + 14;
  if (x + w > innerWidth - 8) x = e.clientX - w - 12; if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}
function actFor(s, r) {
  const it = ITEMS[s.id], move = 'Clique: pegar e mover';
  if (r.k === 'fur') return 'Botão direito: trazer para a mochila · Clique: pegar e mover';
  if (r.k === 'inv' && forgeOpen() && (FURN[s.id] || s.id === 'carvao')) return 'Botão direito: colocar na fornalha · Clique: pegar e mover';
  let a = r.k === 'eq' ? 'Botão direito: tirar' : it.slot ? 'Botão direito: equipar' : it.use ? 'Botão direito: beber' : it.block ? 'Na barra (3 a 0), clique no mundo para colocar' : '';
  a = a ? a + ' · ' + move : move;
  if (shopNpc && r.k === 'inv') {
    const p = sellPrice(s), n = s.n || 1;
    a += !SHOPS[shopNpc.id].buys(s.id) || p <= 0 ? `<br>${shopNpc.name} não compra isso` : sellArm === s.uid ? `<br>Shift + botão direito de novo para vender por ${goldTxt(p)}` : `<br>Shift + botão direito: vender${n > 1 ? ` ${n}` : ''} por ${goldTxt(p * n)}`;
  }
  return a;
}
function hideTip() { const t = $('tip'); if (t) { t.hidden = true; t._key = null; } }
let held = null;   // an item picked up with a click, riding on the cursor until the next click
function cancelHeld() { if (!held) return; if (held.el) held.el.classList.remove('lifting'); held = null; const g = $('ghost'); if (g) { g.hidden = true; g.classList.remove('held'); } }
function onHeldDown(e) {
  if (!held) return;
  e.preventDefault(); e.stopPropagation();
  const h = held; cancelHeld(); if (e.button !== 0) return;              // right click just puts it back
  const el = document.elementFromPoint(e.clientX, e.clientY), sl = el && el.closest ? el.closest('.slot') : null;
  if (shopNpc && el && el.closest && el.closest('#shop .vendor')) { sellRef(h.r, h.el, true); return; }
  const t = refOf(sl); if (t && sl !== h.el) moveItem(h.r, t, sl);
  refreshInv(); if (shopNpc) refreshShop();
}
function onInvDown(e) {
  const el = e.target.closest && e.target.closest('.slot'); const r = refOf(el);
  if (e.button === 2) {
    e.preventDefault(); if (!r || r.k === 'trash' || !itemAt(r)) return; hideTip();
    if (e.shiftKey && shopNpc) sellRef(r, el, true); else { quickAction(r); refreshInv(); if (shopNpc) refreshShop(); }
    return;
  }
  if (e.button !== 0) return;
  if (!r || r.k === 'trash') return;
  const s = itemAt(r); if (!s) return;
  drag = { r, el, sx: e.clientX, sy: e.clientY, moved: false, id: s.id };
  e.preventDefault();
}
let hoverEl = null;
function onDragMove(e) {
  if (held) { const g = $('ghost'); g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }
  if (!drag) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) {
    drag.moved = true; hideTip();
    const g = $('ghost'); g.innerHTML = `<img src="${ICON[drag.id].url}" alt="">`; g.hidden = false; drag.el.classList.add('lifting');
  }
  if (!drag.moved) return;
  const g = $('ghost'); g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px';
  const el = document.elementFromPoint(e.clientX, e.clientY); const sl = el && el.closest ? el.closest('.slot') : null;
  if (sl !== hoverEl) { if (hoverEl) hoverEl.classList.remove('over'); hoverEl = sl; if (sl) sl.classList.add('over'); }
}
function endDrag() { if (drag && drag.el) drag.el.classList.remove('lifting'); drag = null; const g = $('ghost'); if (g) g.hidden = true; if (hoverEl) hoverEl.classList.remove('over'); hoverEl = null; }
function onDragUp(e) {
  if (!drag) return;
  const d = drag; endDrag();
  if (d.moved) {
    const el = document.elementFromPoint(e.clientX, e.clientY); const sl = el && el.closest ? el.closest('.slot') : null;
    if (shopNpc && el && el.closest && el.closest('#shop .vendor')) sellRef(d.r, d.el, true);
    else { const t = refOf(sl); if (t) moveItem(d.r, t, sl); }
  } else {   // a plain click picks the item up; the next click puts it down
    held = { r: d.r, el: d.el, id: d.id }; d.el.classList.add('lifting'); hideTip();
    const g = $('ghost'); g.innerHTML = `<img src="${ICON[d.id].url}" alt="">`; g.classList.add('held'); g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; g.hidden = false;
  }
  refreshInv(); if (shopNpc) refreshShop();
}
function bad(el) { if (el) { el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); } sfx.bad(); }
function changed(eq) { invDirty = true; if (eq) { recalc(); buildLook(); sfx.equip(); } }
function moveItem(a, b, el) {
  if (a.k === 'fur' || b.k === 'fur') { moveFur(a, b, el); forgeDirty = true; refreshForge(); return; }
  if (b.k === 'trash') {
    const id = a.k === 'inv' ? inv[a.i].id : equip[a.s].id;
    if (ITEMS[id].slot === 'tool' && toolCount() <= 1) { toast('Melhor não: sem picareta você não consegue minerar'); return bad(el); }
    if (a.k === 'inv') inv[a.i] = null; else equip[a.s] = null; changed(a.k === 'eq'); sfx.trash(); return; }
  if (a.k === 'inv' && b.k === 'inv') {
    if (a.i === b.i) return;
    const A = inv[a.i], B = inv[b.i];
    if (B && A.id === B.id && stackMax(A.id) > 1) { const k = Math.min(A.n, stackMax(A.id) - B.n); B.n += k; A.n -= k; if (A.n <= 0) inv[a.i] = null; }
    else { inv[a.i] = B; inv[b.i] = A; }
    changed(false); return;
  }
  if (a.k === 'inv' && b.k === 'eq') {
    const A = inv[a.i]; if (!slotFits(A.id, b.s)) return bad(el);
    const old = equip[b.s]; equip[b.s] = A; inv[a.i] = old || null; changed(true); return;
  }
  if (a.k === 'eq' && b.k === 'inv') {
    const B = inv[b.i], cur = equip[a.s];
    if (!B) { inv[b.i] = cur; equip[a.s] = null; }
    else if (slotFits(B.id, a.s)) { equip[a.s] = B; inv[b.i] = cur; }
    else return bad(el);
    changed(true); return;
  }
  if (a.k === 'eq' && b.k === 'eq') {
    if (a.s === b.s) return;
    if (a.s.startsWith('acc') && b.s.startsWith('acc')) { const t = equip[a.s]; equip[a.s] = equip[b.s]; equip[b.s] = t; changed(true); }
    else bad(el);
  }
}
const furFits = (slot, id) => slot === 'ore' ? !!FURN[id] : slot === 'fuel' ? id === 'carvao' : false;
function moveFur(a, b, el) {
  if (a.k === 'fur' && b.k === 'trash') { furnace[a.s] = null; if (a.s === 'ore') furnace.t = 0; changed(false); sfx.trash(); return; }
  if (a.k === 'inv' && b.k === 'fur') {
    const A = inv[a.i];
    if (!furFits(b.s, A.id)) { bad(el); toast(b.s === 'ore' ? 'Em cima vai minério' : b.s === 'fuel' ? 'Embaixo vai carvão' : 'Aqui saem as barras'); return; }
    const cur = furnace[b.s];
    if (!cur) { furnace[b.s] = { id: A.id, n: A.n }; inv[a.i] = null; }
    else if (cur.id === A.id) { const k = Math.min(A.n, 99 - cur.n); cur.n += k; A.n -= k; if (A.n <= 0) inv[a.i] = null; }
    else { inv[a.i] = { id: cur.id, n: cur.n }; furnace[b.s] = { id: A.id, n: A.n }; }
    if (b.s === 'ore' && (!cur || cur.id !== A.id)) furnace.t = 0;
    changed(false); sfx.equip(); return;
  }
  if (a.k === 'fur' && b.k === 'inv') {
    const S = furnace[a.s], B = inv[b.i];
    if (!B) { inv[b.i] = { id: S.id, n: S.n }; furnace[a.s] = null; }
    else if (B.id === S.id && stackMax(B.id) > 1) { const k = Math.min(S.n, stackMax(B.id) - B.n); B.n += k; S.n -= k; if (S.n <= 0) furnace[a.s] = null; }
    else if (furFits(a.s, B.id)) { furnace[a.s] = { id: B.id, n: B.n }; inv[b.i] = { id: S.id, n: S.n }; }
    else { bad(el); return; }
    if (a.s === 'ore') furnace.t = 0;
    changed(false); sfx.equip(); return;
  }
  bad(el);
}
function toolCount() { return (equip.tool ? 1 : 0) + inv.reduce((n, s) => n + (s && ITEMS[s.id].slot === 'tool' ? 1 : 0), 0); }
function quickAction(r) {
  const s = itemAt(r); if (!s) return; const it = ITEMS[s.id];
  if (r.k === 'fur') { const left = addItem(s.id, s.n); if (left === s.n) { toast('Mochila cheia'); return; } if (left) s.n = left; else furnace[r.s] = null; if (r.s === 'ore') furnace.t = 0; forgeDirty = true; changed(false); sfx.equip(); refreshForge(); return; }
  if (r.k === 'inv' && forgeOpen() && (FURN[s.id] || s.id === 'carvao')) { moveItem(r, { k: 'fur', s: FURN[s.id] ? 'ore' : 'fuel' }, null); return; }
  if (r.k === 'eq') { if (!addInst(s)) { toast('Mochila cheia'); return; } equip[r.s] = null; changed(true); return; }
  if (it.slot) { let tgt = it.slot; if (tgt === 'acc') tgt = !equip.acc1 ? 'acc1' : !equip.acc2 ? 'acc2' : 'acc1'; const old = equip[tgt]; equip[tgt] = s; inv[r.i] = old || null; changed(true); return; }
  if (it.use) { if (pl.hp >= pl.maxHp) { toast('Sua vida já está cheia'); return; } pl.potCD = 0; drinkPotion(); }
}
// sorting leaves the hotbar row alone, like Minecraft
function sortInv() {
  const stacks = {}, gear = [];
  for (const s of inv.slice(HB_BAG)) { if (!s) continue; if (stackMax(s.id) > 1) stacks[s.id] = (stacks[s.id] || 0) + s.n; else gear.push(s.id === undefined ? s : (s.uid ? s : mkItem(s.id, 0))); }
  const ord = ['weapon', 'shield', 'tool', 'head', 'body', 'feet', 'acc'];
  gear.sort((a, b) => ord.indexOf(ITEMS[a.id].slot) - ord.indexOf(ITEMS[b.id].slot) || itemRar(b) - itemRar(a));
  inv = inv.slice(0, HB_BAG).concat(new Array(INV_N - HB_BAG).fill(null));
  let k = HB_BAG;
  gear.forEach(g => { inv[k++] = g; });
  const put = id => { let n = stacks[id]; const mx = stackMax(id); while (n > 0 && k < INV_N) { const q = Math.min(n, mx); inv[k++] = { id, n: q }; n -= q; } delete stacks[id]; };
  for (const id of ['pocao', 'tocha']) if (stacks[id]) put(id);
  for (const id of Object.keys(stacks).sort((a, b) => ITEMS[b].rar - ITEMS[a].rar || (ITEMS[b].block ? 1 : 0) - (ITEMS[a].block ? 1 : 0))) put(id);
  invDirty = true; refreshInv();
}
