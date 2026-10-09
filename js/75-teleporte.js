'use strict';

/* ================= teleporte de teste: ir direto para uma camada =================
   No menu de pausa, "Teleporte" troca os botões pela lista de camadas (Vilarejo, Cavernas, Catedral, Cavernas de
   Gelo); cada camada abre as suas faixas. Escolher uma faixa leva o herói a um vão aberto com chão firme no topo
   dela, o mais perto possível da entrada da camada (a boca das cavernas, as escadarias do átrio, as fendas das
   criptas), num lugar que dá para alcançar andando a partir do vilarejo e fora das salas dos chefes.
   "Batalhão" (também de teste, para medir desempenho) solta 25, 50, 100, 200 ou 500 monstros da faixa onde o herói
   está, espalhados pelos vãos abertos ao redor dele, sem respeitar o limite normal de spawn; "Limpar" tira todos
   os que não são chefe. Na superfície ele primeiro leva o herói às Grutas Rasas.
   Usa tpGoTo e tpVilSpot do 29-portal. Carrega depois do 40-opcoes. */
(() => {
  const W1 = x => ((x % WW) + WW) % WW;
  const LAYERS = () => [
    { nome: 'Cavernas', ok: typeof CAVERNA !== 'undefined' && CAVERNA, faixas: [0, 1, 2, 3].map(b => ({ nome: ZONE_NAMES[CV_ZONE0 + b], y0: CV_S0 + CV_BANDS[b], y1: CV_S0 + CV_BANDS[b + 1] })), entrada: () => cavePortalEnd },
    { nome: 'Catedral', ok: true, faixas: [[0, 26], [26, 82], [82, 132], [132, 186]].map(([a, b], k) => ({ nome: ZONE_NAMES[5 + k], y0: cbY(a), y1: cbY(b) })), entrada: () => caveExits && caveExits[0] },
    { nome: 'Cavernas de Gelo', ok: typeof GELO !== 'undefined' && GELO, faixas: [0, 1, 2, 3].map(b => ({ nome: ZONE_NAMES[IC_ZONE0 + b], y0: IC_S0 + IC_BANDS[b], y1: IC_S0 + IC_BANDS[b + 1] })), entrada: () => icExits && icExits[0] && [icExits[0].x0 + 3, IC_S0 + 13] }
  ].filter(L => L.ok);

  // everything open that can be walked to from the village (no jumping rules: open space joined to the surface)
  function reachable() {
    const seen = new Uint8Array(WW * WH), q = [], sx = SPX, sy = surf[SPX] - 2, s0 = sy * WW + sx;
    seen[s0] = 1; q.push(s0);
    while (q.length) {
      const i = q.pop(), x = i % WW, y = (i / WW) | 0;
      for (const j of [y * WW + W1(x - 1), y * WW + W1(x + 1), i - WW, i + WW]) if (j >= 0 && j < WW * WH && !seen[j] && !SOLID[tiles[j]]) { seen[j] = 1; q.push(j); }
    }
    return seen;
  }
  const inBossHall = (x, y) => (typeof inTeiaHall === 'function' && inTeiaHall(x, y, -3)) || (typeof inYetiHall === 'function' && inYetiHall(x, y, -3)) || (typeof inThroneHall === 'function' && inThroneHall(x, y, -3));
  // a standing spot: feet in (x, y), two more rows of air above, a firm block underneath, inside the cave (back wall)
  function spot(F, near) {
    const seen = reachable(), tx = near ? near[0] : SPX, ty = F.y0 + 3;
    let best = null, bd = 1e9;
    for (let y = F.y0 + 1; y < F.y1 - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x, below = tiles[i + WW];
      if (!seen[i] || SOLID[tiles[i]] || SOLID[tiles[i - WW]] || SOLID[tiles[i - 2 * WW]] || !SOLID[below] || !BLOCKY[below] || (typeof IC_SLIP !== 'undefined' && IC_SLIP[below])) continue;
      if (!walls[i] || SOLID[tiles[y * WW + W1(x - 1)]] && SOLID[tiles[y * WW + W1(x + 1)]] || inBossHall(x, y)) continue;
      const d = Math.abs(wdx(x - tx)) + Math.abs(y - ty) * 3;
      if (d < bd) { bd = d; best = [x, y]; }
    }
    return best;
  }
  function go(x, y) {
    if (bossFight) endBossFight(false);
    tpGoTo(x, y);
    if (typeof tpBurst === 'function') { tpBurst(x, y - 12, 20, '#9ccbff', 70, -140, 0.9); tpSfx.go(); }
    show('main'); resumeGame();
  }

  // the battalion: n monsters of the current band's table, on open spots around the hero (inside the despawn range)
  function battalion(n) {
    let ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h - 1) / T), zone = zoneAt(ptx, pty);
    if (!CATH_SPAWN[zone]) {   // the surface (or the old caves): go down to the first band first
      const L = LAYERS()[0], s = L && spot(L.faixas[0], L.entrada()); if (!s) return;
      tpGoTo(s[0] * T + T / 2, (s[1] + 1) * T); ptx = s[0]; pty = s[1]; zone = zoneAt(ptx, pty);
    }
    const table = CATH_SPAWN[zone][0].filter(([t]) => ET[t] && AI[t]), tot = table.reduce((a, r) => a + r[1], 0);
    const rx = Math.floor(VW * 1.05 / T), ry = Math.floor(VH * 1.25 / T), cands = [];
    for (let y = pty - ry; y <= pty + ry; y++) for (let dx = -rx; dx <= rx; dx++) {
      if (Math.abs(dx) < 4 && Math.abs(y - pty) < 4 || y < 2 || y >= WH - 2) continue;
      const x = W1(ptx + dx), i = y * WW + x;
      if (SOLID[tiles[i]] || !walls[i] || inBossHall(x, y)) continue;
      cands.push([ptx + dx, y, SOLID[tiles[i + WW]]]);
    }
    if (!cands.length) return;
    let made = 0;
    if (typeof icPacking !== 'undefined') icPacking = true;   // no extra wolves per wolf: the count is the count
    try {
    for (let k = 0, tries = 0; k < n && tries < n * 30; tries++) {
      let r = Math.random() * tot, type = table[0][0]; for (const [t, w] of table) { r -= w; if (r <= 0) { type = t; break; } }
      const D = ET[type], [cx, cy, floor] = cands[(Math.random() * cands.length) | 0];
      if (!D.fly && !floor) continue;
      const px = cx * T + T / 2 - D.w / 2, py = (cy + 1) * T - D.h - 0.5;
      if (rectSolid(px, py, D.w, D.h)) continue;
      const e = spawnEnemy(type, px, py, zone); if (e) { e.memT = 6; made++; } k++;
    }
    } finally { if (typeof icPacking !== 'undefined') icPacking = false; }
    show('main'); resumeGame();
  }
  function clearMobs() { for (let k = enemies.length - 1; k >= 0; k--) if (!enemies[k].boss) enemies.splice(k, 1); show('main'); resumeGame(); }

  // the pause card: a second list of buttons in place of the menu's
  const card = $('pause').querySelector('.card'), h2 = card.querySelector('h2'), main = card.querySelector('.actions'), danger = card.querySelector('.danger');
  const list = document.createElement('div'); list.className = 'actions'; list.id = 'tpList'; list.hidden = true; card.appendChild(list);
  const btn = (txt, fn, cls = 'ghost') => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = txt; b.addEventListener('click', fn); b.addEventListener('pointerenter', () => b.focus({ preventScroll: true })); list.appendChild(b); return b; };
  function show(view, L) {
    const isMain = view === 'main';
    main.hidden = !isMain; if (danger) danger.hidden = !isMain; list.hidden = isMain; list.textContent = '';
    if (isMain) { h2.textContent = 'Menu'; return; }
    h2.textContent = view === 'army' ? 'Batalhão' : L ? L.nome : 'Teleporte';
    if (view === 'army') {
      for (const n of [25, 50, 100, 200, 500]) btn(String(n), () => battalion(n));
      btn('Limpar', clearMobs);
      btn('Voltar', () => { show('main'); $('btnArmy').focus(); });
    } else if (!L) {
      btn('Vilarejo', () => { const v = tpVilSpot(); go(v.x, v.y); });
      for (const C of LAYERS()) btn(C.nome, () => show('layer', C));
      btn('Voltar', () => { show('main'); $('btnTp').focus(); });
    } else {
      for (const F of L.faixas) btn(F.nome, () => { const s = spot(F, L.entrada()); if (s) go(s[0] * T + T / 2, (s[1] + 1) * T); });
      btn('Voltar', () => show('list'));
    }
    list.querySelector('button').focus();
  }
  const b = document.createElement('button'); b.id = 'btnTp'; b.className = 'ghost'; b.type = 'button'; b.textContent = 'Teleporte';
  b.addEventListener('click', () => show('list'));
  main.appendChild(b);
  const ba = document.createElement('button'); ba.id = 'btnArmy'; ba.className = 'ghost'; ba.type = 'button'; ba.textContent = 'Batalhão';
  ba.addEventListener('click', () => show('army'));
  main.appendChild(ba);
  { const _pg = pauseGame; pauseGame = function () { show('main'); return _pg.apply(this, arguments); }; }
  window.__tp = { spot, LAYERS, show, battalion };
})();
