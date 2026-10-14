'use strict';

/* ================= a descida pela sala do chefe (2026-10-13) =================
   Pedido do Jonathan (2026-10-13): quem não conhece o jogo passava de um bioma para o outro sem nem ver o chefe, porque
   a sala dele ficava do outro lado do mundo e as descidas perto do vilarejo. Agora:
   - o selo: entre cada camada e a de baixo há uma faixa de rocha inteira (SELO_CIMA linhas da de cima e SELO_BAIXO da
     de baixo, com a rocha de cada uma), sem nenhum vão; quem quiser pode quebrar a rocha com a picareta e passar, mas
     não existe caminho natural;
   - o caminho: o único caminho natural para baixo sai do chão da sala do chefe. Ele já existe desde a geração (um poço
     de 3 de largura até o primeiro vão grande da camada de baixo, com algo de subir no meio, o mesmo do 87), mas fica
     fechado na rocha até o chefe cair; aí o chão desaba, de cima para baixo. O que se abriu vai para os diffs (o save);
   - o rumo: enquanto o chefe da camada estiver vivo, a camada leva o herói até ele: uma poeira clara corre pelo ar na
     direção da sala (mais densa perto dela) e um coração bate lá longe, mais forte e do lado de onde ela fica. Sem texto.
   Cada camada nova (129, 312) passa por aqui depois dos passes de sempre: sela a borda de cima, acha a sala de cima e o
   caminho, e refaz as ligações (87) com o selo como rocha que não se cava e os caminhos como se estivessem abertos, para
   nenhum bolsão ficar sem saída e nenhuma ligação furar o selo.
   Carrega depois do 313 (embrulha o worldLink por fora) e antes do 312. */

const SELO_CIMA = 3, SELO_BAIXO = 3;   // linhas do selo acima e abaixo da primeira linha da camada de baixo
// a sala do chefe de cada camada (o mesmo teste que o 87 usa para não cavar nelas)
const SALA_FN = {
  cavernas: 'inTeiaHall', catedral: 'inThroneHall', gelo: 'inYetiHall', mina: 'inRgHall', fungo: 'inMaeHall', cidade: 'inCdHall', floresta: 'inFpHall',
  anoes: 'inAnHall', colmeia: 'inCmHall', nave: 'inNvHall', elfos: 'inElHall', mar: 'inMsHall', dragao: 'inDgHall', titas: 'inTtHall', antigos: 'inAtHall',
  pesadelo: 'inPsHall', abismo: 'inAbHall', escuro: 'inEsHall'
};
// a cor da poeira que corre para a sala, por camada
const RUMO_COR = {
  cavernas: '#c8d0b8', catedral: '#e0d4b8', gelo: '#b8e0ff', mina: '#ffb070', fungo: '#b8f090', cidade: '#a8e0d8', floresta: '#d0dcc0', anoes: '#ffc080',
  colmeia: '#ffd060', nave: '#b0ffb0', elfos: '#d8e4ff', mar: '#90d0ff', dragao: '#ff9a60', titas: '#e8e0d0', antigos: '#ffe8a0', pesadelo: '#f0a0ff',
  abismo: '#ff7a50', escuro: '#d0d0e0'
};
const descida = {
  salas: {},     // id -> { cx, cy, x0, x1, top, bot }: o centro e a caixa da sala do chefe
  selos: {},     // id da camada de baixo -> [primeira linha, linha depois da última] do selo
  rotas: {},     // id da camada de cima -> { x, fy, ty, cells: [i...], sobe: Set(i) }: o caminho fechado na rocha
  vencidos: new Set(),   // as camadas cujo chefe já caiu (o save guarda)
  abrindo: [],   // os caminhos desabando agora: { r, t }
  motes: [], moteAcc: 0, batida: 0,
  dbg: {}        // por que cada coluna da sala não serviu de caminho (para os testes)
};

/* ---------- a sala do chefe: o teste da camada, varrido nas linhas dela ---------- */
function salaAcha(id) {
  const f = typeof window[SALA_FN[id]] === 'function' ? window[SALA_FN[id]] : null, r = genLinhas(id);
  if (!f || !r) return null;
  let ref = -1, dxa = 1e9, dxb = -1e9, top = 1e9, bot = -1, n = 0, sy = 0;
  for (let y = r[0]; y < r[1]; y++) for (let x = 0; x < WW; x++) {
    if (!f(x, y, 0)) continue;
    if (ref < 0) ref = x;
    const d = wdx(x - ref); if (d < dxa) dxa = d; if (d > dxb) dxb = d;
    if (y < top) top = y; if (y > bot) bot = y; n++; sy += y;
  }
  if (!n) return null;
  return { cx: wrapX(ref + Math.round((dxa + dxb) / 2)), cy: Math.round(sy / n), x0: wrapX(ref + dxa), x1: wrapX(ref + dxb), w: dxb - dxa + 1, top, bot };
}

/* ---------- o selo ---------- */
// a rocha mais comum de umas linhas (sem minério, sem barreira): é com ela que o selo é feito
function seloRocha(ya, yb) {
  const cnt = new Map();
  for (let y = Math.max(0, ya); y < Math.min(WH, yb); y++) for (let x = 0; x < WW; x += 2) {
    const t = tiles[y * WW + x]; if (!SOLID[t] || !BLOCKY[t] || ORE_XP[t] || t === LAVA || wlKeepT(t)) continue;
    cnt.set(t, (cnt.get(t) || 0) + 1);
  }
  let best = 0, bn = -1; for (const [t, c] of cnt) if (c > bn) { bn = c; best = t; }
  return best || STONE;
}
function seloFaz(id) {
  const r = genLinhas(id); if (!r) return 0;
  const y0 = r[0] - SELO_CIMA, y1 = r[0] + SELO_BAIXO;
  const up = seloRocha(r[0] - 30, y0), dn = seloRocha(y1, r[0] + 30);
  const cheios = new Set();
  for (let y = y0; y < y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x, t = tiles[i];
    if (SOLID[t] && t !== CV_TEIA) continue;
    tiles[i] = y < r[0] ? up : dn; cheios.add(i);
    if (agua.length) agua[i] = 0;
  }
  descida.selos[id] = [y0, y1];
  // o que estava de pé ou pendurado no vão que virou rocha sai junto
  if (cheios.size) {
    let drop = false;
    for (let k = PROPS.length - 1; k >= 0; k--) {
      const p = PROPS[k], tx0 = Math.floor(p.X / T), tx1 = Math.floor((p.X + p.w - 1) / T), ty0 = Math.floor(p.Y / T), ty1 = Math.floor((p.Y + p.h - 1) / T);
      if (ty1 < y0 || ty0 >= y1) continue;
      let hit = false; for (let ty = Math.max(ty0, y0); ty <= Math.min(ty1, y1 - 1) && !hit; ty++) for (let tx = tx0; tx <= tx1; tx++) if (cheios.has(ty * WW + wrapX(tx))) { hit = true; break; }
      if (hit) { PROPS.splice(k, 1); drop = true; }
    }
    if (drop) { propBuckets.clear(); propBySup.clear(); const keep = PROPS.slice(); PROPS.length = 0; for (const p of keep) addProp(p.def, p.v, p.X, p.Y, p.sup); }
  }
  return cheios.size;
}

/* ---------- o caminho: do chão da sala de cima até o primeiro vão grande da camada de baixo ---------- */
function rotaAcha(upId, dnId) {
  const S = descida.salas[upId], sel = descida.selos[dnId], rd = genLinhas(dnId);
  if (!S || !sel || !rd) return null;
  const I = (x, y) => y * WW + wrapX(x), aberto = i => !SOLID[tiles[i]] || tiles[i] === CV_TEIA;
  // o maior vão da camada de baixo (abaixo do selo): é nele que o caminho tem de chegar
  const ya = sel[1], yb = Math.min(rd[1], genFundo, ya + 260), H = yb - ya, lab = new Int32Array(H * WW).fill(-1);
  let big = -1, bigN = 0; const st = [];
  for (let s = 0; s < H * WW; s++) {
    if (lab[s] >= 0 || !aberto(s + ya * WW)) continue;
    const id = s; let n = 0; lab[s] = id; st.push(s);
    while (st.length) { const c = st.pop(), x = c % WW, row = c - x; n++; for (const nb of [row + wrapX(x - 1), row + wrapX(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < H * WW && lab[nb] < 0 && aberto(nb + ya * WW)) { lab[nb] = id; st.push(nb); } }
    if (n > bigN) { bigN = n; big = id; }
  }
  // o que pesa contra uma coluna: enfeite no chão (cai quando o chão desaba), água em cima (escorre para baixo), bloco
  // estranho no piso; a sala de cima não conta como "sala no caminho"
  const apoio = new Set(); for (const p of PROPS) for (const i of p.sup) apoio.add(i);
  const fSala = typeof window[SALA_FN[upId]] === 'function' ? window[SALA_FN[upId]] : () => false;
  const dbg = descida.dbg[upId] = {}, no = k => { dbg[k] = (dbg[k] || 0) + 1; };
  const tenta = solto => {
    let best = null;
    for (let off = -((S.w >> 1) - 2); off <= (S.w >> 1) - 2; off++) {
      const x = wrapX(S.cx + off);
      // o chão nesta coluna: o vão mais baixo da sala e o bloco debaixo dele
      // (o mais baixo que não está debaixo d'água; se todos estão, o mais baixo)
      let fy = -1, molhado = -1;
      for (let y = Math.min(S.bot + 6, sel[0] - 1); y > S.top; y--) if (aberto(I(x, y - 1)) && !aberto(I(x, y))) { if (agua.length && agua[I(x, y - 1)]) { if (molhado < 0) molhado = y; } else { fy = y; break; } }
      if (fy < 0) fy = molhado;
      if (fy < 0) { if (!solto) no('semchao'); continue; }
      let pen = 0, ok = true;
      for (let k = -1; k <= 1; k++) {
        const i = I(x + k, fy), t = tiles[i], a = I(x + k, fy - 1);
        if (t === LAVA || (!solto && wlKeepT(t))) ok = false;
        if (!BLOCKY[t]) pen += 15;
        if (apoio.has(i) || apoio.has(a)) pen += 25;
        if (tiles[a] !== AIR) pen += 10;
        if (agua.length && agua[a]) pen += 300;
      }
      if (!ok) { if (!solto) no('piso'); continue; }
      // desce até o vão grande da camada de baixo, sem passar por outra sala nem pelo que as camadas guardam
      let ty = -1;
      for (let y = fy + 1; y < yb; y++) {
        if (y >= sel[1] && big >= 0 && lab[(y - ya) * WW + x] === big) { ty = y; break; }
        let bad = false;
        if (!solto) for (let k = -1; k <= 1; k++) { const xx = wrapX(x + k), i = I(xx, y); if (wlKeepT(tiles[i]) || (wlSacred(xx, y) && !fSala(xx, y, 12))) bad = true; }
        if (bad || y - fy > (solto ? 800 : 420)) { if (!solto) no(bad ? 'sagrado' : 'fundo'); break; }
      }
      if (ty < 0) continue;
      const cost = (ty - fy) + Math.abs(off) * 2 + pen;
      if (!best || cost < best.cost) best = { x, fy, ty, cost };
    }
    return best;
  };
  let best = tenta(false) || tenta(true);
  if (!best) { no('nada'); const fy = Math.min(S.bot + 1, sel[0] - 1); best = { x: S.cx, fy, ty: sel[1] + 2 }; }
  const cells = [], sobe = new Set();
  for (let y = best.fy; y < best.ty; y++) for (let k = -1; k <= 1; k++) { const i = I(best.x + k, y); cells.push(i); if (k === 0) sobe.add(i); }
  // a corrente continua pelo vão de baixo até um chão, para dar para subir de volta
  for (let y = best.ty; y < best.ty + 60 && y < WH - 4; y++) { const i = I(best.x, y); if (SOLID[tiles[i]] && tiles[i] !== CV_TEIA) break; if (tiles[i] === AIR && !(agua.length && agua[i])) { cells.push(i); sobe.add(i); } }
  return { up: upId, x: best.x, fy: best.fy, ty: best.ty, cells, sobe, pedra: seloRocha(best.fy, best.fy + 40) };
}

/* ---------- as ligações (87) com o selo e os caminhos: o selo é rocha que não se cava, os caminhos estão abertos ---------- */
{ const _wl = worldLink; worldLink = function () {
  const tmp = [], rota = new Set();
  for (const dn in descida.selos) { if (!genFeita(dn)) continue; const [y0, y1] = descida.selos[dn]; for (let i = y0 * WW; i < y1 * WW; i++) { tmp.push(i, tiles[i]); tiles[i] = BEDROCK; } }
  for (const up in descida.rotas) { const R = descida.rotas[up]; for (const i of R.cells) { tmp.push(i, tiles[i]); tiles[i] = AIR; rota.add(i); } }
  // os enfeites apoiados no chão das salas: o 87 derruba o que perde apoio, e aqui o chão só está aberto de mentira
  const presos = rota.size ? PROPS.filter(p => p.sup.some(i => rota.has(i))) : [];
  try { return _wl.apply(this, arguments); }
  finally {
    for (let k = tmp.length - 2; k >= 0; k -= 2) tiles[tmp[k]] = tmp[k + 1];
    const vivos = new Set(PROPS); for (const p of presos) if (!vivos.has(p) && p.sup.every(i => SOLID[tiles[i]])) addProp(p.def, p.v, p.X, p.Y, p.sup);
  }
}; }

// depois de cada leva (129, 312), por último: o selo de cima de cada camada nova, a sala de cima, o caminho, as ligações
genPos(() => {
  try {
    let mexeu = false;
    for (const id of genNovas) {
      const k = genIdx(id); if (k < 0) continue;
      const s = salaAcha(id); if (s) descida.salas[id] = s;
      if (k < 1) continue;   // as Cavernas: a superfície não tem chefe
      const up = LAYERS[k - 1].id;
      if (!descida.salas[up]) { const su = salaAcha(up); if (su) descida.salas[up] = su; }
      seloFaz(id); mexeu = true;
      const R = rotaAcha(up, id); if (R) descida.rotas[up] = R; else delete descida.rotas[up];
    }
    // as ligações de novo, com o selo no lugar (sem refazer as quedas e o minério do 313: nenhuma camada é nova para ele)
    if (mexeu) { const nv = genNovas; genNovas = []; try { worldLink(); } finally { genNovas = nv; } }
  } catch (err) { console.error(err); }
});

/* ---------- o chefe caiu: o chão da sala desaba e o caminho abre ---------- */
// o bloco que o caminho põe numa célula ao abrir: a corrente no meio, ar dos lados
const rotaBloco = (R, i) => R.sobe.has(i) ? wlClimb((i / WW) | 0) : AIR;
// onde o poço atravessa água, as paredes de cada lado viram rocha (um poço revestido): a água não desce por ele
function rotaReveste(R, y) {
  for (const k of [-2, 2]) {
    const i = y * WW + wrapX(R.x + k); if (SOLID[tiles[i]] || !(agua.length && (agua[i] || aguaN[i]))) continue;
    const t = R.pedra || STONE; tiles[i] = t; diffs.set(i, t); aguaSecar(i); markDirty(i % WW, y);
  }
}
function rotaAbreJa(R) {   // sem efeito (ao carregar)
  for (const i of R.cells) {
    const y = (i / WW) | 0; rotaReveste(R, y);
    const t = rotaBloco(R, i); if (agua.length && agua[i]) aguaSecar(i); if (tiles[i] !== t) { tiles[i] = t; diffs.set(i, t); }
  }
}
function rotaAbre(id) {
  const R = descida.rotas[id]; if (!R) return;
  if (descida.abrindo.some(a => a.r === R)) return;
  descida.abrindo.push({ r: R, t: -1.2, y: R.fy - 1 });   // um tremor antes do chão ceder
  shake(4); descidaSfx.ronco();
}
HOOK.update.push(dt => {
  for (let k = descida.abrindo.length - 1; k >= 0; k--) {
    const A = descida.abrindo[k], R = A.r; A.t += dt;
    if (A.t < 0) { if (Math.random() < dt * 6) shake(1.5); continue; }
    const ate = R.fy + Math.floor(A.t * 34);   // linhas por segundo
    if (ate > A.y) {
      for (const i of R.cells) {
        const y = (i / WW) | 0; if (y <= A.y || y > ate) continue;
        const t = rotaBloco(R, i), x = i % WW;
        rotaReveste(R, y); if (agua.length && agua[i]) aguaSecar(i);
        if (tiles[i] !== t) { const was = tiles[i]; setTile(x, y, t); if (SOLID[was] && Math.random() < 0.5) burst(x * T + 6, y * T + 6, 3, '#6a6058', 50, 300, 0.6); }
      }
      if (A.y < R.fy + 2 && ate >= R.fy) { shake(5); descidaSfx.desaba(); }
      A.y = ate;
    }
    if (A.y >= R.ty + 60) { descida.abrindo.splice(k, 1); saveGame(); }
  }
});
{ const _eb = endBossFight; endBossFight = function (won) {
  const F = bossFight, e = F && F.e;
  const r = _eb.apply(this, arguments);
  if (won && e) {
    const k = genCamadaDe(Math.floor((e.y + e.h / 2) / T));
    if (k >= 0) { const id = LAYERS[k].id; descida.vencidos.add(id); rotaAbre(id); saveGame(); }
  }
  return r;
}; }

/* ---------- o save: os chefes vencidos (o caminho aberto também está nos diffs) ---------- */
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.vencidos = [...descida.vencidos]; return o; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  descida.salas = {}; descida.selos = {}; descida.rotas = {}; descida.abrindo.length = 0; descida.motes.length = 0;
  descida.vencidos = new Set(sv && Array.isArray(sv.vencidos) ? sv.vencidos : []);
  const r = _nw.apply(this, arguments);
  descidaGarante();
  return r;
}; }
// o que um chefe vencido abriu fica aberto (um save que foi salvo no meio do desabamento, uma camada gerada depois)
function descidaGarante() { let n = 0; for (const id of descida.vencidos) { const R = descida.rotas[id]; if (R) { rotaAbreJa(R); n++; } } if (n) { chunks.clear(); mapVer++; } }
// algumas salas se redesenham pelo plano do chefe quando o herói chega (o navio do Leviatã, o favo da Rainha...): o
// caminho de um chefe vencido volta a abrir logo depois
const SALA_PLANO = { lvWrite: 'mar', cmqWrite: 'colmeia', ocWrite: 'nave', dmWrite: 'elfos', czWrite: 'dragao' };
// (o 312 e os chefes carregam depois deste arquivo: os embrulhos entram quando a página termina de carregar)
addEventListener('DOMContentLoaded', () => {
  const _gm = genMais; genMais = function () { const r = _gm.apply(this, arguments); if (r) descidaGarante(); return r; };
  for (const fn in SALA_PLANO) {
    const _w = window[fn]; if (typeof _w !== 'function') continue;
    window[fn] = function () { const r = _w.apply(this, arguments); const R = descida.rotas[SALA_PLANO[fn]]; if (state !== 'menu' && R && descida.vencidos.has(SALA_PLANO[fn])) { rotaAbreJa(R); chunks.clear(); mapVer++; } return r; };
  }
});

// os mundos de antes (wg 19) são refeitos: nível, itens, ouro e o baú da vila continuam, e todos os chefes voltam vivos
const DESCIDA_WG = 20;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (o.wg === ALTO_WG) o.wg = DESCIDA_WG; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== DESCIDA_WG) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.aguaD = null; v.vencidos = [];
    if (v.anoes) { v.anoes.levers = []; if (!v.anoes.cinzel) v.anoes.taken = false; }
    for (const k in v) if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k]) && 'dead' in v[k]) v[k] = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = ALTO_WG; const r = _ms(v); if (r && r.wg === ALTO_WG) r.wg = DESCIDA_WG; return r;   // a cadeia de baixo conhece o mundo 19
}; }

/* ---------- o rumo: a poeira que corre para a sala e o coração que bate lá longe ---------- */
const descidaSfx = {
  ronco() { tone(42, 1.4, 'sawtooth', 0.05, -8); noise(1.4, 0.09, 180, 'lowpass'); },
  desaba() { noise(0.9, 0.16, 260, 'lowpass'); tone(55, 0.8, 'sine', 0.08, -25); noise(0.5, 0.06, 1200, 'bandpass', 0.15, 2); }
};
// uma batida com lado (o som de sempre não tem): grave, abafada, de longe
function descidaBate(vol, pan) {
  if (!ac || muted || !voiceOk('rumo-coracao')) return;
  const t0 = ac.currentTime, out = ac.createStereoPanner ? ac.createStereoPanner() : null;
  if (out) { out.pan.value = pan; out.connect(sfxOut); }
  for (const [dl, f, v] of [[0, 58, 1], [0.26, 50, 0.75]]) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(f, t0 + dl); o.frequency.exponentialRampToValueAtTime(f * 0.7, t0 + dl + 0.3);
    g.gain.setValueAtTime(0.0001, t0 + dl); g.gain.exponentialRampToValueAtTime(vol * v, t0 + dl + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dl + 0.34);
    o.connect(g); g.connect(out || sfxOut); o.start(t0 + dl); o.stop(t0 + dl + 0.4);
  }
}
// para onde fica a sala da camada do herói (null quando não há o que guiar)
function descidaRumo() {
  if (bossFight || pl.dead) return null;
  const tx = Math.floor((pl.x + pl.w / 2) / T), ty = Math.floor((pl.y + pl.h / 2) / T), k = genCamadaDe(ty);
  if (k < 0) return null;
  const id = LAYERS[k].id, S = descida.salas[id]; if (!S || descida.vencidos.has(id)) return null;
  const dx = wdx(S.cx - tx), dy = S.cy - ty, d = Math.hypot(dx, dy);
  if (Math.abs(dx) <= S.w / 2 + 2 && ty >= S.top - 2 && ty <= S.bot + 2) return null;   // já chegou
  return { id, dx, dy, d, ux: dx / (d || 1), uy: dy / (d || 1) };
}
HOOK.update.push(dt => {
  const M = descida.motes;
  for (let k = M.length - 1; k >= 0; k--) {
    const m = M[k]; m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt + Math.sin(m.t * 2.3 + m.ph) * 4 * dt;
    if (m.t >= m.life || SOLID[tileAt(Math.floor(m.x / T), Math.floor(m.y / T))]) M.splice(k, 1);
  }
  const R = descidaRumo(); if (!R) { descida.batida = 0; return; }
  const perto = clamp(1 - R.d / 420, 0, 1);
  // a poeira: aparece no ar em volta do herói e corre na direção da sala
  descida.moteAcc += dt * (2.5 + perto * 7);
  while (descida.moteAcc >= 1 && M.length < 60) {
    descida.moteAcc -= 1;
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (SOLID[tileAt(Math.floor(x / T), Math.floor(y / T))]) continue;
    const sp = 16 + Math.random() * 10;
    M.push({ x, y, vx: R.ux * sp, vy: R.uy * sp, t: 0, life: 2.6 + Math.random() * 2, ph: Math.random() * 6, col: RUMO_COR[R.id] || '#d0d0d0' });
  }
  if (descida.moteAcc > 1) descida.moteAcc = 1;
  // o coração: mais forte perto, do lado de onde a sala fica
  descida.batida -= dt;
  if (descida.batida <= 0) {
    descida.batida = 3.4 - perto * 1.2;
    const vol = 0.02 + perto * perto * 0.14;
    if (R.d < 600) descidaBate(vol, clamp(R.dx / 80, -0.85, 0.85));
  }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const m of descida.motes) {
    const a = Math.min(1, m.t / 0.6, (m.life - m.t) / 0.8); if (a <= 0) continue;
    lc.globalAlpha = a * 0.55; lc.fillStyle = m.col; lc.fillRect(Math.round(m.x) - cx, Math.round(m.y) - cy, 1, 1);
    lc.globalAlpha = a * 0.16; lc.fillRect(Math.round(m.x) - cx - 1, Math.round(m.y) - cy - 1, 3, 3);
  }
});
