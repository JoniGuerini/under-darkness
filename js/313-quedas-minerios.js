'use strict';

/* ================= camadas mais altas: quedas curtas e minério na borda (2026-10-12) =================
   Pedido do Jonathan (2026-10-12): as camadas acabavam rápido demais, o mundo tinha penhasco demais (uma queda de 40,
   50 blocos atravessava um bioma) e o carvão e o cobre nasciam longe das bordas, ruins de pegar. O 01-base deixa cada
   camada LAYER_K vezes mais alta (cada gerador desenha em 186 metros e estica); aqui, por último na geração (embrulha
   o worldLink, então roda depois de todas as camadas, das ligações e da limpeza do mar):
   - as quedas: um poço estreito que cai mais de QUEDA_MAX blocos ganha um piso de lado a lado a cada QUEDA_MAX mais
     ou menos, com um degrau ao lado (2 de largura, 4 de fundo) por onde se desce; quem anda e cai, cai pouco de cada
     vez, e o caminho para baixo continua aberto. Só na rocha natural da camada: nunca num salão, numa sala de chefe,
     na água, nem num poço que tem algo de subir (escada, corrente, cipó...), e só onde se entra na queda por um
     chão ao lado (o alto fechado de uma sala não é queda). Pisos que tirariam uma subida que existia são desfeitos.
   - o minério: os veios de carvão e do metal de cada camada que ficaram enterrados longe de qualquer vão mudam para a
     rocha da borda (de 0 a 2 blocos para dentro) até MIN_BORDA deles estarem na borda; o número de blocos não muda,
     e a rocha que fica no lugar é a rocha em volta. Só vai para os tipos de rocha onde aquele minério já nasce.
   Tudo sai da semente, então o mesmo mundo sai igual de novo. Carrega depois do 310 (embrulha o worldLink por fora). */

const QUEDA_MAX = 12;     // a queda mais longa que um poço estreito deixa, em blocos
const QUEDA_LARG = 8;     // poços até esta largura ganham piso; mais largos são salões
const MIN_BORDA = 0.8;    // a parte de cada minério que fica a 2 blocos ou menos de um vão

// a faixa de linhas de cada camada no mundo atual, de cima para baixo (o S0 de cada gerador)
function layerRows() {
  const g = n => { try { const v = eval(n); return typeof v === 'number' ? v : null; } catch (e) { return null; } };
  const S0 = {
    cavernas: () => g('CV_S0'), catedral: () => g('CB_S0'), gelo: () => g('IC_S0'), mina: () => g('MN_S0'), fungo: () => g('FG_S0'), cidade: () => g('CD_S0'),
    floresta: () => g('FP_S0'), anoes: () => g('AN_S0'), colmeia: () => g('CM_S0'), nave: () => g('NV_S0'), elfos: () => g('EL_S0'), mar: () => g('MS_S0'),
    dragao: () => g('DG_S0'), titas: () => g('TT_S0'), antigos: () => g('AT_S0'), pesadelo: () => g('PS_S0'), abismo: () => g('AB_S0'), escuro: () => g('ES_S0')
  };
  const out = [];
  for (const L of LAYERS) { const f = S0[L.id], y = f ? f() : null; if (y !== null) out.push({ id: L.id, y0: y }); }
  out.sort((a, b) => a.y0 - b.y0);
  for (let k = 0; k < out.length; k++) out[k].y1 = k + 1 < out.length ? out[k + 1].y0 : WH - 6;
  return out;
}

// o carvão e o metal de cada camada (102: um metal por camada)
const LAYER_ORES = {
  cavernas: ['CV_O_CARVAO', 'CV_O_COBRE'], catedral: ['COAL', 'IRON'], gelo: ['IC_O_CARVAO', 'IC_O_OURO'], mina: ['MN_O_CARVAO', 'MN_O_COBALTO'],
  fungo: ['FG_O_CARVAO', 'FG_O_ESPORITA'], cidade: ['CD_O_CARVAO', 'CD_O_PRATA'], floresta: ['FP_O_CARVAO', 'FP_O_PLATINA'], anoes: ['AN_O_CARVAO', 'AN_O_MITHRIL'],
  colmeia: ['CM_O_CARVAO', 'CM_O_AMBRITA'], nave: ['NV_O_CARVAO', 'NV_O_XENITA'], elfos: ['EL_O_CARVAO', 'EL_O_LUNARITA'], mar: ['MS_O_CARVAO', 'MS_O_ORICALCO', 'MS_O_ORICALCO_S'],
  dragao: ['DG_O_CARVAO', 'DG_O_DRACONIO'], titas: ['TT_O_CARVAO', 'TT_O_ADAMANTITA'], antigos: ['AT_O_CARVAO', 'AT_O_ESTELAR'], pesadelo: ['PS_O_CARVAO', 'PS_O_ONIRITA'],
  abismo: ['AB_O_CARVAO', 'AB_O_INFERNITA'], escuro: ['ES_O_CARVAO', 'ES_O_NOCTIRIO']
};

/* ---------- as quedas ---------- */
function quebraQuedas(y0, y1, R) {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const air = (x, y) => { const i = I(x, y); return tiles[i] === AIR && !(agua.length && agua[i]); };
  const rock = (x, y) => { const i = I(x, y), t = tiles[i]; return SOLID[t] === 1 && BLOCKY[t] === 1 && t !== LAVA && !wlKeepT(t) && !wlKept(i); };
  const free = (x, y) => !wlSacred(W1(x), y);
  let pisos = 0; const dbg = k => false;   // motivo de não pôr piso (para testes)
  // o bloco do piso: a rocha da parede ao lado, sem ser minério
  const mat = (x, y, dir) => { for (let k = 0; k < 4; k++) { const t = tiles[I(x + dir * k, y)]; if (SOLID[t] && BLOCKY[t] && !ORE_XP[t] && !wlKeepT(t)) return t; } return 0; };
  // a janela em volta do piso: guarda os blocos para desfazer, e confere que todo vão que se alcançava dali ainda se alcança
  let WX0 = 0, WX1 = 0, WY0 = 0, WY1 = 0, WWd = 0;
  const win = (xa, xb, r) => { WX0 = xa - 10; WX1 = xb + 10; WY0 = r - 12; WY1 = r + 12; WWd = WX1 - WX0 + 1; };
  const save = () => { const a = []; for (let yy = WY0; yy <= WY1; yy++) for (let xx = WX0; xx <= WX1; xx++) { const i = I(xx, yy); a.push(tiles[i], walls[i]); } return a; };
  const undo = a => { let k = 0; for (let yy = WY0; yy <= WY1; yy++) for (let xx = WX0; xx <= WX1; xx++) { const i = I(xx, yy); tiles[i] = a[k++]; walls[i] = a[k++]; } };
  const flood = (sx, sy) => {
    const seen = new Uint8Array(WWd * (WY1 - WY0 + 1)); if (SOLID[tiles[I(sx, sy)]]) return seen;
    const st = [sx, sy]; seen[(sy - WY0) * WWd + sx - WX0] = 1;
    while (st.length) { const cy = st.pop(), cx = st.pop();
      for (let d = 0; d < 4; d++) { const nx = cx + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = cy + (d === 2 ? 1 : d === 3 ? -1 : 0); if (nx < WX0 || nx > WX1 || ny < WY0 || ny > WY1) continue; const k = (ny - WY0) * WWd + nx - WX0; if (seen[k] || SOLID[tiles[I(nx, ny)]]) continue; seen[k] = 1; st.push(nx, ny); } }
    return seen;
  };
  // tudo o que se alcançava (e continua aberto) ainda se alcança, e de cima ainda se chega embaixo
  const keeps = (before, sx, sy, below) => {
    const after = flood(sx, sy);
    for (let k = 0; k < before.length; k++) if (before[k] && !after[k]) { const xx = WX0 + k % WWd, yy = WY0 + ((k / WWd) | 0); if (!SOLID[tiles[I(xx, yy)]]) return false; }
    for (let xx = WX0; xx <= WX1; xx++) for (let yy = below; yy <= WY1; yy++) if (after[(yy - WY0) * WWd + xx - WX0]) return true;
    return false;
  };
  // dá para subir de baixo do piso até acima dele (pulo de 3, herói de 2 de altura, escada/cipó/água sobem)? o piso não
  // pode tirar uma subida que existia (num túnel inclinado, um piso com degrau fundo prende quem volta)
  const sobe = r => {
    const H = WY1 - WY0 + 1, seen = new Uint8Array(WWd * H * 5), q = [];
    const S = (xx, yy) => yy < WY0 || yy > WY1 || SOLID[tiles[I(xx, yy)]] === 1;
    const ok = (xx, yy) => xx >= WX0 && xx <= WX1 && !S(xx, yy) && !S(xx, yy - 1);
    const L = (xx, yy) => { const i = I(xx, yy), t = tiles[i]; return (t !== AIR && !SOLID[t]) || (agua.length && agua[i]); };
    const push = (xx, yy, k) => { if (!ok(xx, yy)) return; if (S(xx, yy + 1) || L(xx, yy) || L(xx, yy - 1)) k = 4; const j = ((yy - WY0) * WWd + xx - WX0) * 5 + k; if (seen[j]) return; seen[j] = 1; q.push(xx, yy, k); };
    for (let yy = r + 2; yy < WY1; yy++) for (let xx = WX0; xx <= WX1; xx++) if (S(xx, yy + 1) || L(xx, yy)) push(xx, yy, 4);
    while (q.length) {
      const k = q.pop(), yy = q.pop(), xx = q.pop(); if (yy <= r - 3) return true;
      const gr = S(xx, yy + 1) || L(xx, yy);
      push(xx - 1, yy, k === 4 && !gr ? 0 : k); push(xx + 1, yy, k === 4 && !gr ? 0 : k);
      if (k > 0) push(xx, yy - 1, L(xx, yy) || L(xx, yy - 1) ? 4 : k === 4 ? 3 : k - 1);
      if (!S(xx, yy + 1)) push(xx, yy + 1, 0);
    }
    return false;
  };
  const edge = (xx, yy) => { const i = I(xx, yy), t = tiles[i]; return t !== AIR && !(agua.length && agua[i]) && !wlKeepT(t) && !wlKept(i); };
  const ledge = (x, r, xa, xb, m) => {
    // salão largo: uma laje de 3 a 4 saindo da parede mais perto, se a coluna está encostada nela
    const fromL = x - xa <= 2 && rock(xa - 1, r), fromR = xb - x <= 2 && rock(xb + 1, r); if (!fromL && !fromR) return dbg('wide');
    const n = 3 + (R() < 0.5 ? 1 : 0), L = fromL && (!fromR || R() < 0.5);
    for (let k = 0; k < n; k++) { const xx = L ? xa + k : xb - k; if (!air(xx, r) || !air(xx, r - 1) || !air(xx, r - 2) || !air(xx, r + 1)) return dbg('wide2'); }
    win(xa, xb, r); win(Math.max(xa, x - 8), Math.min(xb, x + 8), r);
    for (let xx = WX0; xx <= WX1; xx += 3) for (let yy = WY0; yy <= WY1; yy += 3) if (!free(xx, yy)) return dbg('sacred');
    const before = flood(x, r - 1), subia = sobe(r), snap = save();
    for (let k = 0; k < n; k++) tiles[I(L ? xa + k : xb - k, r)] = m;
    if (!keeps(before, x, r - 1, r + 2) || (subia && !sobe(r))) { undo(snap); return dbg('cut'); }
    lajes++; return true;
  };
  let lajes = 0;
  const tryPlug = (x, r) => {
    // a largura do poço na linha r
    let xa = x, xb = x;
    while (xb - xa < 40 && air(xa - 1, r)) xa--;
    while (xb - xa < 40 && air(xb + 1, r)) xb++;
    const w = xb - xa + 1;
    if (!edge(xa - 1, r) || !edge(xb + 1, r)) return dbg('noedge');
    const m = mat(xa - 1, r, -1) || mat(xb + 1, r, 1); if (!m) return dbg('mat');
    if (w > QUEDA_LARG) return ledge(x, r, xa, xb, m);
    win(xa, xb, r);
    for (let xx = WX0 + 4; xx <= WX1 - 4; xx += 2) for (let yy = r - 4; yy <= r + 4; yy += 2) if (!free(xx, yy)) return dbg('sacred');
    const before = flood(x, r - 1), subia = sobe(r);
    // o degrau: 2 de largura, de r-2 a r+2, num dos lados, com teto de rocha
    const okCell = (xx, yy) => { const i = I(xx, yy), t = tiles[i]; return (t === AIR && !(agua.length && agua[i])) || rock(xx, yy); };
    const side = R() < 0.5 ? 1 : -1;
    let dx0 = 0, found = false;
    for (const sd of [side, -side]) {
      const c0 = sd > 0 ? xb + 1 : xa - 2; let ok = true;
      for (let xx = c0; xx < c0 + 2 && ok; xx++) { if (!rock(xx, r - 3)) ok = false; for (let yy = r - 2; yy <= r + 2 && ok; yy++) if (!okCell(xx, yy)) ok = false; }
      if (ok) { dx0 = c0; found = true; break; }
    }
    const snap = save();
    if (!found) {
      // sem lugar para o degrau: só uma laje de um lado, deixando 2 de vão
      if (w < 4) return dbg('nostep');
      const n = w - 2, left = R() < 0.5;
      for (let k = 0; k < n; k++) { const xx = left ? xa + k : xb - k; tiles[I(xx, r)] = m; }
    } else {
      for (let xx = xa; xx <= xb; xx++) tiles[I(xx, r)] = m;
      for (let xx = dx0; xx < dx0 + 2; xx++) for (let yy = r - 2; yy <= r + 2; yy++) { const i = I(xx, yy); if (tiles[i] !== AIR) { tiles[i] = AIR; if (!walls[i]) walls[i] = walls[I(x, yy)] || walls[I(x, r - 1)]; } }
    }
    if (!keeps(before, x, r - 1, r + 2) || (subia && !sobe(r))) { undo(snap); return dbg('cut'); }
    pisos++; return true;
  };
  // por onde se entra na queda: um chão ao lado (de onde se anda e cai) ou algo de subir; um vão de teto fechado sem
  // chão ao lado (o alto de uma sala) não é queda, e um piso ali só faz um bolsão de onde não se sobe
  const S1 = (xx, yy) => SOLID[tiles[I(xx, yy)]] === 1;
  const stand = (xx, yy) => !S1(xx, yy) && !S1(xx, yy - 1) && S1(xx, yy + 1);
  const sobeT = (xx, yy) => { const t = tiles[I(xx, yy)]; return t !== AIR && !SOLID[t]; };
  const entra = (x, y) => stand(x - 1, y) || stand(x + 1, y) || sobeT(x - 1, y) || sobeT(x + 1, y);
  for (let x = 0; x < WW; x++) {
    let ent = -1, depois = false;
    for (let y = y0; y < y1; y++) {
      if (!air(x, y)) { ent = -1; depois = false; continue; }
      if (ent < 0 && (depois || entra(x, y))) ent = y;
      depois = false;
      if (ent >= 0 && y - ent >= QUEDA_MAX && y + 8 < y1) {
        // só se a queda continua: mais ar logo abaixo
        let more = 0; while (more < 6 && air(x, y + 1 + more)) more++;
        if (more >= 6 && tryPlug(x, y)) { ent = -1; depois = true; continue; }
      }
    }
  }
  return pisos + lajes;
}

/* ---------- o minério ---------- */
function minerioNaBorda(y0, y1, ores, R) {
  const H = y1 - y0; if (H <= 4) return 0;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW;
  const at = (x, y) => tiles[y * WW + W1(x)];
  // distância até o vão mais perto (0 = vão, 1 = encosta, 2 = um para dentro, 3 = mais longe)
  const dist = new Uint8Array(WW * H).fill(3);
  for (let y = 0; y < H; y++) for (let x = 0; x < WW; x++) if (!SOLID[at(x, y + y0)]) dist[y * WW + x] = 0;
  for (let pass = 1; pass <= 2; pass++) {
    for (let y = 0; y < H; y++) for (let x = 0; x < WW; x++) {
      const k = y * WW + x; if (dist[k] <= pass) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; for (let dx = -1; dx <= 1; dx++) if (dist[yy * WW + W1(x + dx)] === pass - 1) { near = true; break; } }
      if (near) dist[k] = pass;
    }
  }
  const isOre = new Uint8Array(NT); for (const t of ores) isOre[t] = 1;
  let moved = 0;
  for (const ore of ores) {
    // os veios (4 vizinhos) e a rocha em volta deles
    const lab = new Int32Array(WW * H).fill(-1), veios = [], host = new Map();
    let total = 0, borda = 0;
    for (let k = 0; k < WW * H; k++) {
      if (lab[k] !== -1 || at(k % WW, ((k / WW) | 0) + y0) !== ore) continue;
      const cells = [k]; lab[k] = veios.length; let perto = false;
      for (let h = 0; h < cells.length; h++) {
        const c = cells[h], x = c % WW, y = (c / WW) | 0; if (dist[c] <= 2) perto = true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const yy = y + dy; if (yy < 0 || yy >= H) continue; const n = yy * WW + W1(x + dx), t = at(x + dx, yy + y0);
          if (t === ore) { if (lab[n] === -1) { lab[n] = veios.length; cells.push(n); } }
          else if (SOLID[t] && BLOCKY[t] && !isOre[t] && !ORE_XP[t]) host.set(t, (host.get(t) || 0) + 1);
        }
      }
      veios.push({ cells, perto }); total += cells.length; if (perto) borda += cells.length;
    }
    if (!total || borda >= total * MIN_BORDA || !host.size) continue;
    // onde pode ir: rocha de um dos tipos em volta do minério, encostada num vão, fora de salão e do que se guarda
    const hostOk = new Uint8Array(NT); let best = 0, bestN = -1; for (const [t, n] of host) { hostOk[t] = 1; if (n > bestN) { best = t; bestN = n; } }
    const cand = [];
    for (let k = 0; k < WW * H; k++) if (dist[k] === 1) { const t = at(k % WW, ((k / WW) | 0) + y0); if (hostOk[t]) cand.push(k); }
    if (cand.length < 20) continue;
    const enterrados = veios.filter(v => !v.perto);
    for (let i = enterrados.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const q = enterrados[i]; enterrados[i] = enterrados[j]; enterrados[j] = q; }
    for (const v of enterrados) {
      if (borda >= total * MIN_BORDA) break;
      // um lugar novo na borda, crescendo pela rocha a até 2 blocos do vão
      let placed = null;
      for (let a = 0; a < 30 && !placed; a++) {
        const k0 = cand[Math.floor(R() * cand.length)], x0 = k0 % WW, y0r = (k0 / WW) | 0;
        if (at(x0, y0r + y0) === ore || wlKept(y0r * WW + x0 + y0 * WW) || wlSacred(x0, y0r + y0)) continue;
        const got = [k0], seen = new Set(got);
        for (let h = 0; h < got.length && got.length < v.cells.length; h++) {
          const c = got[h], x = c % WW, y = (c / WW) | 0;
          const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => R() - 0.5);
          for (const [dx, dy] of nb) {
            const yy = y + dy; if (yy < 0 || yy >= H) continue; const n = yy * WW + W1(x + dx); if (seen.has(n)) continue; seen.add(n);
            const t = at(x + dx, yy + y0); if (dist[n] < 1 || dist[n] > 2 || !hostOk[t] || wlKept(n + y0 * WW)) continue;
            got.push(n); if (got.length >= v.cells.length) break;
          }
        }
        if (got.length >= Math.max(1, Math.ceil(v.cells.length * 0.75))) placed = got;
      }
      if (!placed) continue;
      // tira o veio enterrado (a rocha em volta volta no lugar) e põe o novo
      for (const c of v.cells) { const x = c % WW, y = (c / WW) | 0; let t = best; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const yy = y + dy; if (yy < 0 || yy >= H) continue; const u = at(x + dx, yy + y0); if (hostOk[u]) { t = u; break; } } tiles[(y + y0) * WW + x] = t; }
      for (const c of placed) tiles[c + y0 * WW] = ore;
      borda += placed.length; total += placed.length - v.cells.length; moved++;
    }
  }
  return moved;
}

{ const _wl = worldLink; worldLink = function () {
  const r = _wl.apply(this, arguments);
  const ev = n => { try { const v = eval(n); return typeof v === 'number' ? v : -1; } catch (e) { return -1; } };
  const log = window.__quedas || {};
  // só as camadas da leva que acabou de ser gerada (129, 312), cada uma com o seu sorteio
  for (const L of layerRows()) {
    if (!genNova(L.id)) continue;
    const R = mulberry32(seed ^ 0x51ed0c4 ^ Math.imul(layerPos(L.id), 0x9e3779b1));
    const p = quebraQuedas(L.y0, L.y1, R);
    const ores = (LAYER_ORES[L.id] || []).map(ev).filter(t => t > 0);
    const m = ores.length ? minerioNaBorda(L.y0, L.y1, ores, R) : 0;
    log[L.id] = [p, m];
  }
  // as subidas das camadas que ainda pediam escada depois das ligações e dos pisos (são as rápidas, menos de meio segundo)
  for (const [id, n] of [['cidade', 'cdClimbFix'], ['fungo', 'fungClimbFix'], ['mina', 'mnClimbFix'], ['floresta', 'fpClimbFix']]) { if (!genNova(id)) continue; try { const f = eval(n); if (typeof f === 'function') f(); } catch (e) { console.error(e); } }
  window.__quedas = log;
  return r;
}; }

/* ---------- o save: mundos de antes (wg 18, camadas de 186) são refeitos ---------- */
// nível, itens, ouro e o baú da vila continuam, e todos os chefes voltam vivos (como no 310)
const ALTO_WG = 19;
{ const _mk = makeSave; makeSave = function () { const o = _mk(); if (o.wg === MUNDO_WG) o.wg = ALTO_WG; return o; }; }
{ const _ms = migrateSave; migrateSave = function (v) {
  if (!v || typeof v.seed !== 'number') return _ms(v);
  if (v.wg !== ALTO_WG) {
    v.seed = (Math.random() * 2 ** 31) | 0; v.diffs = []; v.seen = ''; v.cp = []; v.aguaD = null;
    if (v.anoes) { v.anoes.levers = []; if (!v.anoes.cinzel) v.anoes.taken = false; }
    for (const k in v) if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k]) && 'dead' in v[k]) v[k] = null;
    if (v.p) { delete v.p.x; delete v.p.y; }
  }
  v.wg = MUNDO_WG; const r = _ms(v); if (r && r.wg === MUNDO_WG) r.wg = ALTO_WG; return r;   // a cadeia de cima conhece o mundo 18
}; }
