'use strict';

/* ================= O Campo da Última Guerra: o mundo (docs/camadas/17-campo-guerra.md, seção 3) =================
   Debaixo da camada de cima (guAbove, 400) e em cima do Abismo. Um campo de batalha que a terra engoliu: rocha cheia
   com salas largas de chão plano, como se o campo continuasse lá embaixo, andar por andar. Em passos (o molde do 275):
     1. a rocha por faixa: a rocha de cima afina e vira terra de batalha; terra com bolsões de barro e ferro de batalha
        nas Lâminas; mármore celeste e cantaria nos Bastiões; rocha queimada com rocha em brasa na Brecha; terra,
        rocha queimada e ferro de batalha no Estandarte
     2. as salas: as duas descidas (o poço de 4 com a escada de cerco e a câmara de pouso 14 x 6, acesa por duas
        auréolas caídas), O Campo do Estandarte do outro lado do mundo (a caixa sólida que o 406 veste com guDress) e os
        dois corredores até as portas, as Valas dos Caídos (as duas saídas para o Abismo), os campos abertos (grutas
        largas de chão plano), as trincheiras retas, os salões e as torres dos bastiões, as grutas da brecha
     3. as ligações: túneis de minhoca nas Lâminas, na Brecha e no Estandarte, corredores retos com degraus nos
        Bastiões, 3 x WSC rampas por divisa de andar
     4. as cascas: barro e paliçada nas trincheiras, cantaria e mármore nos bastiões (penas petrificadas no teto às
        vezes), tijolo de fosso nas trincheiras da brecha, rocha em brasa em volta das grutas da brecha
     5. os veios: carvão na terra, no barro e na rocha queimada; belicita perto do ferro de batalha e da rocha queimada
   Depois (guAfter): tudo alcançável das descidas, escada de cerco (Bastiões) ou corda de cerco (o resto) em todo
   desnível de 5, a decoração de 1 bloco, os objetos (402). Por fim o Campo do Estandarte (406: guDress), as bocas e a
   subida garantida (guClimbFix). O 87 liga o resto depois.
   Também: a terceira camada, as zonas 89 a 92, o spawn por faixa e o nível (pela posição no 129), as partículas, a
   belicita na fornalha e nas lojas. */

let guRooms = [], guGrutas = [];
const GU_CLIMB = t => t === GU_ESCADA || t === GU_CORDA || t === CHAIN || t === guAbove().climb;

function guBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = guAbove();
  GU_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = GU_S0, YB = Math.min(WH - 8, S0 + GU_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x6a31), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  const bandOf = d => d < GU_BANDS[1] ? 0 : d < GU_BANDS[2] ? 1 : d < GU_BANDS[3] ? 2 : 3;
  // como o 275: cada faixa vira K andares da altura do desenho de 186 metros
  const K = LAYER_K, BD = GU_BANDS.map(v => v / K);
  const lv = (d, j) => { let b = 0; while (b < 3 && d >= BD[b + 1]) b++; return S0 + Math.round((BD[b] * K + j * (BD[b + 1] - BD[b]) + d - BD[b]) * DB / GU_D); };
  const lvOf = y => { const d = (y - S0) * GU_D / DB, b = bandOf(d), h = (GU_BANDS[b + 1] - GU_BANDS[b]) / K; return b * K + clamp(Math.floor((d - GU_BANDS[b]) / h), 0, K - 1); };
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  guRooms = []; guGrutas = [];
  guEntries = []; guLand = []; guExits = []; guBoss = null; guFields = []; guForts = []; guTowers = []; guTrench = []; guKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 10; y < S0; y++) {   // a rocha de cima afina nas últimas 10 linhas e vira terra de batalha
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0x6b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = GU_TERRA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      if (y >= YB) { tiles[i] = GU_ESCORIA; walls[i] = WGU_ESCORIA; continue; }   // abaixo da camada: sem ruído (a de baixo escreve por cima)
      const d = y - S0 + (nz(x, y, 18, 0x6b3) - 0.5) * 10, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 26, 0x6a1), n2 = nz(x, y, 14, 0x6a2);
      let tt = GU_TERRA, w = WGU_TERRA;
      if (b === 0) { tt = n1 > 0.74 ? GU_ARGILA : n2 > 0.84 ? GU_SUCATA : GU_TERRA; }
      else if (b === 1) { tt = n2 > 0.82 ? GU_CANTARIA : n1 > 0.86 ? GU_TERRA : GU_MARMORE; w = WGU_MARMORE; }
      else if (b === 2) { tt = n1 > 0.7 ? GU_BRASA : n2 > 0.86 ? GU_SUCATA : GU_ESCORIA; w = WGU_ESCORIA; }
      else { tt = n1 > 0.72 ? GU_ESCORIA : n2 > 0.8 ? GU_SUCATA : GU_TERRA; w = n1 > 0.72 ? WGU_ESCORIA : WGU_TERRA; }
      tiles[i] = tt; walls[i] = w;
      if (y < YB && agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. as salas ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => guRooms.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  const blob = (cx, cy, w, h, s, flat = 1.5) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.18 + (nz(x, y, 40, s) - 0.5) * 0.25) dig(x, y);
    }
  };
  // um campo aberto: a gruta larga de chão plano (o fundo achatado, o teto em arco baixo e irregular)
  const field = (cx, fy, w, h, s) => {
    const x0 = Math.round(cx - w / 2);
    for (let j = 0; j < w; j++) {
      const u = j / (w - 1), arch = Math.sqrt(Math.max(0, 1 - Math.pow(u * 2 - 1, 2))), H = Math.max(3, Math.round(h * (0.35 + 0.65 * arch) + (nz(x0 + j, fy, 12, s) - 0.5) * 3));
      const f = fy + Math.round((nz(x0 + j, fy, 30, s + 1) - 0.5) * 2);
      for (let y = f - H; y < f; y++) dig(x0 + j, y); hard(x0 + j, f);
    }
  };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 1200; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.7 + Math.sin(n * 0.09 + s) * 0.3;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.5;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.8 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const ramp = (xa, ya, xb, yb, r, s) => {
    const Rr = mulberry32(seed ^ s ^ 0x4b17), dy = yb - ya, n = Math.max(1, Math.ceil(Math.abs(dy) / 11));
    let x = xa, y = ya, dir = wdx(xb - xa) < 0 ? -1 : 1;
    for (let k = 1; k <= n; k++) {
      const ny = Math.round(ya + dy * k / n), nx = k === n ? xa + wdx(xb - xa) : x + dir * (14 + ((Rr() * 10) | 0));
      worm(x, y, nx, ny, r, s + k * 131); x = nx; y = ny; dir = -dir;
    }
  };
  // corredor reto de hh no chão fa de xa até xb; se o chão de destino for outro, degraus (um a cada 2)
  const gallery = (xa, fa, xb, fb, list, band, hh = 4) => {
    const d = wdx(xb - xa), s = d < 0 ? -1 : 1, steps = Math.abs(fb - fa), flat = Math.max(0, Math.abs(d) - steps * 2);
    let x = xa, f = fa;
    for (let k = 0; k <= flat; k++, x += s) { for (let y = f - hh; y < f; y++) dig(x, y); hard(x, f); }
    if (list && flat > 6) list.push({ x0: W1(s > 0 ? xa : xa - flat), len: flat + 1, fy: fa, h: hh, band });
    const fs = fb > fa ? 1 : -1;
    for (let k = 0; k < steps * 2; k++, x += s) { if (k % 2 === 1) f += fs; for (let y = f - hh; y < f; y++) dig(x, y); hard(x, f); }
  };

  // ---------- 2a. as duas descidas: do poço de cima, um poço de 4 com a escada de cerco até a câmara de pouso ----------
  {
    const ub = A.boss, halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || (ub.fy !== undefined && c.fy > ub.fy + 2) || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || (ub.w ? ub.w / 2 : 20)) + 1)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) picks.push({ cx: (R() * WW) | 0, fy: S0 - 2 }, { cx: (R() * WW) | 0, fy: S0 - 2 });
    for (const c of picks) {
      const xs = c.x0 !== undefined ? W1(c.x0) : W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 28 + ((R() * 6) | 0), S0 + 14, S0 + mb(34));
      const hx = side > 0 ? xs - 1 : xs - 10;
      for (let y = landFy - 7; y <= landFy + 1; y++) for (let x = hx - 1; x <= hx + 14; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 14; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 14 : hx - 1;
      for (let y = landFy - 3; y < landFy; y++) { const i = I(door, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 14, h: 6, door: W1(door), side };
      guLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 4; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // um campo logo depois da porta: o primeiro pedaço da guerra que o herói vê
      const w = 26 + ((R() * 10) | 0), h = 8, x0 = side > 0 ? door + 1 : door - w;
      room(x0, landFy, w, h);
      const H = { cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'campo', x0: W1(x0), fy: landFy, top: landFy - h };
      guRooms.push(H); guFields.push(H);
      guRooms.push({ cx: hx + 7, cy: landFy - 3, w: 14, h: 6, band: 0, kind: 'pouso', nolink: true });
      guEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }

  // ---------- 2b. O Campo do Estandarte, do outro lado do mundo, e os dois corredores até as portas ----------
  {
    const w = 100, h = 30;
    const ax = guEntries.length ? guEntries.reduce((s, e) => s + wdx(e.x0 - guEntries[0].x0), 0) / guEntries.length + guEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = Math.min(YB - 16, S0 + mb(172)), top = fy - h;
    guBoss = { cx, x0: W1(cx - 50), x1: W1(cx + 49), w, h, top, fy,
      doors: [{ side: -1, x: W1(cx - 54), fy }, { side: 1, x: W1(cx + 53), fy }] };
    for (let y = top - 5; y <= fy + 5; y++) for (let x = cx - 55; x <= cx + 54; x++) seal[I(x, y)] = 1;
    guRooms.push({ cx, cy: fy - h / 2, w: w + 10, h: h + 10, band: 3, boss: true, nolink: true });
    for (const D of guBoss.doors) {
      const len = 24 + ((R() * 10) | 0), fyD = D.fy;
      let x = D.x;
      for (let k = 0; k < len; k++) {
        for (let y = fyD - 4; y < fyD; y++) { const i = I(x, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
        hard(x, fyD); guKeep.add(I(x, fyD));
        x += D.side;
      }
      guTrench.push({ x0: D.side > 0 ? W1(D.x) : W1(D.x - len + 1), len, fy: fyD, h: 4, band: 3, boss: true });
      guRooms.push({ cx: D.x + D.side * len / 2, cy: fyD - 2, w: len, h: 4, band: 3, kind: 'servico', nolink: true });
      // um campo no fim do corredor: onde a luta do lado de fora ficou parada
      const gw = 24 + ((R() * 8) | 0), gh = 10, gx0 = D.side > 0 ? x - 1 : x - gw + 2;
      room(gx0, fyD, gw, gh);
      const C = { cx: gx0 + gw / 2, cy: fyD - gh / 2, w: gw, h: gh, band: 3, kind: 'campo', x0: W1(gx0), fy: fyD, top: fyD - gh };
      guFields.push(C); guRooms.push(C);
    }
  }
  const awayFromBoss = (cx, cy, m) => !guBoss || Math.abs(wdx(cx - guBoss.cx)) > guBoss.w / 2 + 8 + m || cy < guBoss.top - 8 - m || cy > guBoss.fy + 8 + m;

  // ---------- 2c. as Valas dos Caídos: duas valas no andar de baixo, longe uma da outra e do Estandarte, com o poço descendo ----------
  for (let tries = 0; guExits.length < 2 && tries < 600; tries++) {
    const w = 20 + ((R() * 6) | 0), h = 10, cx = (R() * WW) | 0, fy = YB - 13 - ((R() * 8) | 0);
    if (!awayFromBoss(cx, fy, 64) || guExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'vala', x0: W1(x0), fy, top: fy - h, exit: true };
    guRooms.push(C);
    const sx = W1(cx - 2);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 5; x++) seal[I(x, y)] = x >= sx && x < sx + 5 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 5; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    guExits.push({ x0: sx, x1: W1(sx + 4), cx: W1(cx), w: 5, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. O Campo das Lâminas: campos abertos e trincheiras retas ----------
  for (let k = 0, tries = 0; k < 6 * WSC * K && tries < 500 * K; tries++) {
    const j = k % K, w = 30 + ((R() * 34) | 0), h = 8 + ((R() * 6) | 0), cx = (R() * WW) | 0, fy = lv(10 + R() * 32, j);
    if (fy - h < lv(4, j) || busy(cx, fy - h / 2, w, h, 6)) continue;
    field(cx, fy, w, h, 0x6c00 + k);
    const C = { cx, cy: fy - h / 2, w, h, band: 0, kind: 'campo', x0: W1(Math.round(cx - w / 2)), fy, top: fy - h };
    guFields.push(C); guRooms.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 7 * WSC * K && tries < 500 * K; tries++) {
    const len = 28 + ((R() * 30) | 0), hh = 4, x0 = (R() * WW) | 0, fy = lv(8 + R() * 34, k % K);
    if (busy(x0 + len / 2, fy - 2, len, hh + 1, 3)) continue;
    for (let j = 0; j < len; j++) { for (let y = fy - hh; y < fy; y++) dig(x0 + j, y); hard(x0 + j, fy); }
    const C = { cx: x0 + len / 2, cy: fy - hh / 2, w: len, h: hh, band: 0, kind: 'trincheira', x0: W1(x0), fy, top: fy - hh, len };
    guTrench.push({ x0: W1(x0), len, fy, h: hh, band: 0 }); guRooms.push(C); k++;
  }

  // ---------- 2e. Os Bastiões de Luz: salões de mármore e torres com escada ----------
  for (let k = 0, tries = 0; k < 9 * WSC * K && tries < 600 * K; tries++) {
    const j = k % K, w = 16 + ((R() * 16) | 0), h = 8 + ((R() * 4) | 0), x0 = (R() * WW) | 0, fy = lv(56 + R() * 38, j);
    if (fy - h < lv(49, j) || busy(x0 + w / 2, fy - h / 2, w, h, 5) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2)) continue;
    room(x0, fy, w, h);
    for (let x = x0 + 2; x < x0 + w - 2; x++) dig(x, fy - h - 1);   // a abóbada: um degrau a mais no meio
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, kind: 'salao', x0: W1(x0), fy, top: fy - h - 1 };
    guForts.push(C); guRooms.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 5 + ((R() * 2) | 0), h = 18 + ((R() * 14) | 0), x0 = (R() * WW) | 0, fy = lv(50, j) + h + ((R() * Math.max(1, 40 - h)) | 0);
    if (fy > lv(50, j) + 46 || busy(x0 + w / 2, fy - h / 2, w, h, 5) || !awayFromBoss(x0 + w / 2, fy - h / 2, w)) continue;
    room(x0, fy, w, h);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, kind: 'torre', x0: W1(x0), fy, top: fy - h };
    guTowers.push(C); guRooms.push(C); k++;
  }

  // ---------- 2f. A Brecha: grutas queimadas e trincheiras de tijolo ----------
  for (let k = 0, tries = 0; k < 9 * WSC * K && tries < 500 * K; tries++) {
    const w = 14 + ((R() * 14) | 0), h = 7 + ((R() * 6) | 0), cx = (R() * WW) | 0, cy = lv(102, k % K) + h / 2 + R() * Math.max(0, 42 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, w / 2)) continue;
    blob(cx, cy, w, h, 0x6e00 + k, 2.2);
    const C = { cx, cy, w, h, band: 2, kind: 'gruta', fy: Math.round(cy + h / 2) };
    guGrutas.push(C); guRooms.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 500 * K; tries++) {
    const len = 26 + ((R() * 26) | 0), hh = 4, x0 = (R() * WW) | 0, fy = lv(104 + R() * 42, k % K);
    if (busy(x0 + len / 2, fy - 2, len, hh + 1, 3) || !awayFromBoss(x0 + len / 2, fy, len / 2)) continue;
    for (let j = 0; j < len; j++) { for (let y = fy - hh; y < fy; y++) dig(x0 + j, y); hard(x0 + j, fy); }
    const C = { cx: x0 + len / 2, cy: fy - hh / 2, w: len, h: hh, band: 2, kind: 'trincheira', x0: W1(x0), fy, top: fy - hh, len };
    guTrench.push({ x0: W1(x0), len, fy, h: hh, band: 2 }); guRooms.push(C); k++;
  }

  // ---------- 2g. O Estandarte Caído: os grandes campos ----------
  for (let k = 0, tries = 0; k < 6 * WSC * K && tries < 500 * K; tries++) {
    const j = k % K, w = 40 + ((R() * 40) | 0), h = 10 + ((R() * 6) | 0), cx = (R() * WW) | 0, fy = lv(158 + R() * 22, j);
    if (fy - h < lv(152, j) || fy > YB - 5 || busy(cx, fy - h / 2, w, h, 6) || !awayFromBoss(cx, fy - h / 2, w / 2 + 6)) continue;
    field(cx, fy, w, h, 0x6f00 + k);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'campo', x0: W1(Math.round(cx - w / 2)), fy, top: fy - h };
    guFields.push(C); guRooms.push(C); k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), mouth(C)];
  const NL = 4 * K, byLv = []; for (let l = 0; l < NL; l++) byLv.push([]);
  for (const c of guRooms) if (!c.nolink && !c.boss) byLv[c.band * K + clamp(lvOf(mouth(c) - 1) - c.band * K, 0, K - 1)].push(c);
  for (let l = 0; l < NL; l++) {
    const b = (l / K) | 0, L = byLv[l].slice().sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      if (b === 1) gallery(ax, ay, bx, by, guTrench, 1);   // nos bastiões os corredores são retos, com degraus
      else worm(ax, ay - 2, bx, by - 2, b === 3 ? 1.7 : 1.5, 0x6700 + l * 90 + k);
    }
  }
  for (let l = 0; l < NL - 1; l++) {
    const U = byLv[l], D = byLv[l + 1];
    for (let k = 0; k < 3 * WSC && U.length && D.length; k++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      if (!awayFromBoss(Q.cx, mouth(Q), 4)) continue;
      const [ax, ay] = ends(P, R() < 0.5); ramp(ax, ay - 2, Math.round(Q.cx), mouth(Q) - 2, 1.4, 0x67f0 + l * 9 + k);
    }
  }
  // bolsinhas fechadas viram rocha; ilhas soltas no ar somem
  {
    const lab = new Int32Array(NN).fill(-1), st = [];
    for (let i0 = S0 * WW; i0 < YB * WW; i0++) {
      if (!cv[i0] || lab[i0] >= 0) continue;
      const comp = []; lab[i0] = i0; st.push(i0);
      while (st.length) { const c = st.pop(), x = c % WW, row = c - x; comp.push(c); for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < NN && cv[nb] && lab[nb] < 0) { lab[nb] = i0; st.push(nb); } }
      if (comp.length < 14 && !comp.some(c => keep[c])) for (const c of comp) cv[c] = 0;
    }
    const sl = new Uint8Array(NN);
    for (let y = S0 + 1; y <= YB - 3; y++) for (let x = 0; x < WW; x++) {
      const i0 = y * WW + x; if (cv[i0] || sl[i0]) continue;
      const comp = []; let open = true; sl[i0] = 1; st.push(i0);
      while (st.length) { const c = st.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) { if (nb < 0 || nb >= NN || cv[nb] || sl[nb]) continue; const ny = (nb / WW) | 0; if (!canCarve(nb % WW, ny)) { open = false; continue; } sl[nb] = 1; st.push(nb); } if (comp.length > 30) open = false; }
      if (open && comp.length < 6 && !comp.some(c => seal[c] || keep[c])) for (const c of comp) cv[c] = 1;
    }
  }
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;
  for (let i = (S0 - 40) * WW; i < S0 * WW; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- 4. as cascas ----------
  const at = (x, y) => tiles[I(x, y)];
  const shell = (x, y, t) => { const i = I(x, y); if (SOLID[tiles[i]] && GU_SOILS[tiles[i]] && !guKeep.has(i) && !inGuHall(W1(x), y, 5)) tiles[i] = t; };
  const airAround = (x, y) => !SOLID[at(x - 1, y)] || !SOLID[at(x + 1, y)] || !SOLID[at(x, y - 1)] || !SOLID[at(x, y + 1)];
  const lining = (x0, y0, x1, y1, t, w, floorT, ceilT) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (inGuHall(W1(x), y, 5) || y < S0 || y >= YB - 1) continue;
      if (SOLID[tiles[i]]) { if (airAround(x, y) || hash2(W1(x), y, seed ^ 0x61) < 0.55) shell(x, y, floorT && !SOLID[at(x, y - 1)] ? floorT : ceilT && !SOLID[at(x, y + 1)] ? ceilT : t); }
      else if (w) walls[i] = w;
    }
  };
  const boxOf = (C, m) => [Math.floor(C.x0 !== undefined ? C.x0 : C.cx - C.w / 2) - m, Math.floor(C.top !== undefined ? C.top : C.cy - C.h / 2) - m, Math.ceil(C.x0 !== undefined ? C.x0 + C.w : C.cx + C.w / 2) + m, (C.fy || Math.ceil(C.cy + C.h / 2)) + m];
  // os campos: o chão de terra pisada (barro nas Lâminas), ferro de batalha às vezes no teto
  for (const C of guFields) { const [x0, y0, x1, y1] = boxOf(C, 2); lining(x0, y0, x1, y1, C.band === 3 ? GU_TERRA : GU_TERRA, C.band === 3 ? WGU_TERRA : 0, C.band === 0 ? GU_ARGILA : GU_TERRA, hash2(C.x0, C.fy, seed ^ 0x62) < 0.3 ? GU_SUCATA : GU_TERRA); }
  // os salões dos bastiões: cantaria por dentro, mármore no chão, penas petrificadas no teto às vezes
  for (const C of guForts) { const [x0, y0, x1, y1] = boxOf(C, 2); lining(x0, y0, x1, y1, GU_CANTARIA, WGU_MARMORE, GU_MARMORE, hash2(C.x0, C.fy, seed ^ 0x63) < 0.4 ? GU_PENAS : GU_CANTARIA); }
  // as torres: cantaria em volta, a escada de cerco inteira numa parede, patamares a cada 9 a 11
  for (const C of guTowers) {
    const [x0, y0, x1, y1] = boxOf(C, 1);
    lining(x0, y0, x1, y1, GU_CANTARIA, WGU_MARMORE, GU_CANTARIA, GU_CANTARIA);
    const lx = C.x0 + (hash2(C.x0, C.fy, seed ^ 0x64) < 0.5 ? 0 : C.w - 1);
    for (let y = C.top; y < C.fy; y++) { const i = I(lx, y); if (tiles[i] === AIR) tiles[i] = GU_ESCADA; }
    for (let y = C.fy - 10, n = 0; y > C.top + 4; y -= 9 + ((hash2(C.x0, y, seed ^ 0x65) * 3) | 0), n++)
      for (let x = C.x0; x < C.x0 + C.w; x++) { if (x === lx || (n % 2 === 0 && Math.abs(x - lx) === 1)) continue; const i = I(x, y); if (tiles[i] === AIR) { tiles[i] = GU_PALICADA; walls[i] = WGU_MARMORE; } }
  }
  // as grutas da brecha: rocha queimada, rocha em brasa no chão às vezes
  for (const C of guGrutas) { const [x0, y0, x1, y1] = boxOf(C, 3); lining(x0, y0, x1, y1, GU_ESCORIA, WGU_ESCORIA, hash2(Math.round(C.cx), C.fy, seed ^ 0x66) < 0.5 ? GU_BRASA : GU_ESCORIA, GU_ESCORIA); }
  // as trincheiras: paliçada atrás e no teto nas Lâminas, barro no chão; tijolo de fosso na Brecha; cantaria nos bastiões
  for (const Q of guTrench) {
    if (Q.boss) continue;
    for (let j = -1; j <= Q.len; j++) {
      const x = Q.x0 + j;
      for (let y = Q.fy - (Q.h || 4) - 1; y <= Q.fy; y++) {
        const i = I(x, y); if (inGuHall(W1(x), y, 2) || y < S0 + 1 || y >= YB - 1) continue;
        const b = guerraBand(y);
        if (!SOLID[tiles[i]]) { walls[i] = b === 0 ? WGU_PALICADA : b === 2 ? WGU_TIJOLO : b === 1 ? WGU_MARMORE : walls[i]; continue; }
        if (!GU_SOILS[tiles[i]] || guKeep.has(i)) continue;
        if (b === 0) tiles[i] = y === Q.fy ? GU_ARGILA : GU_PALICADA;
        else if (b === 2) tiles[i] = GU_TIJOLO;
        else if (b === 1 && y === Q.fy) tiles[i] = GU_CANTARIA;
      }
    }
  }
  // os corredores do Estandarte: rocha queimada em volta, o chão de ferro de batalha
  for (const Q of guTrench) if (Q.boss) for (let j = -1; j <= Q.len; j++) for (let y = Q.fy - 5; y <= Q.fy; y++) {
    const x = Q.x0 + j, i = I(x, y); if (inGuHall(W1(x), y, 1)) continue;
    if (!SOLID[tiles[i]]) walls[i] = WGU_TIJOLO; else if (GU_SOILS[tiles[i]]) tiles[i] = y === Q.fy ? GU_SUCATA : GU_TIJOLO;
  }
  // O Campo do Estandarte: a caixa toda sólida (o 406 escreve dentro)
  {
    const B = guBoss;
    for (let y = B.top - 3; y <= B.fy + 3; y++) for (let x = B.cx - 53; x <= B.cx + 52; x++) { const i = I(x, y); tiles[i] = GU_ESCORIA; walls[i] = WGU_ESCORIA; if (agua.length) agua[i] = 0; }
  }
  // ---------- as descidas: a boca vira terra, o poço com a escada de cerco; a câmara de pouso acesa por duas auréolas ----------
  for (const E of guEntries) {
    const x0 = E.x0, L = E.land, y1 = L.fy - 6;
    for (let x = x0 - 3; x <= x0 + 6; x++) { const i = I(x, E.fy); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 4)) tiles[i] = GU_TERRA; }
    for (let y = E.fy; y < y1; y++) {
      for (let x = x0; x < x0 + 4; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WGU_TERRA; guKeep.add(i); }
      for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); if (y > E.fy) { tiles[i] = (y - E.fy) % 7 === 3 ? GU_SUCATA : GU_TERRA; guKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = GU_ESCADA; guKeep.add(i); } }
    if (y1 - E.fy > 14) { const my = (E.fy + y1) >> 1; for (const x of [x0, x0 + 2, x0 + 3]) { const i = I(x, my); tiles[i] = GU_PALICADA; guKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 4; x++) guKeep.add(I(x, y));
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= L.fy - 3 && y < L.fy) { tiles[i] = AIR; walls[i] = WGU_MARMORE; }
      else if (edge && !(y === L.fy - L.h - 1 && W1(x) >= x0 && wdx(x - x0) < 4)) tiles[i] = y === L.fy ? GU_CANTARIA : GU_MARMORE;
      else if (!edge) { tiles[i] = AIR; walls[i] = WGU_MARMORE; }
      else { tiles[i] = W1(x) === W1(x0 + 1) ? GU_ESCADA : AIR; walls[i] = WGU_MARMORE; }
      guKeep.add(i);
    }
    // duas auréolas caídas no chão: a luz do pouso (ficha, seção 2); uma espada fincada no meio
    const vs = L.side > 0 ? [L.x0 + 6, L.x0 + 11] : [L.x0 + 2, L.x0 + 7];
    for (const vx of vs) if (tiles[I(vx, L.fy - 1)] === AIR) tiles[I(vx, L.fy - 1)] = GU_AUREOLA;
    const bx = L.side > 0 ? L.x0 + 9 : L.x0 + 4; if (tiles[I(bx, L.fy - 1)] === AIR) tiles[I(bx, L.fy - 1)] = GU_ESPADA;
  }
  // ---------- as Valas dos Caídos: o poço de rocha queimada, a corda de cerco até a última linha ----------
  for (const X of guExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 5; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WGU_ESCORIA; guKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 5]) { const i = I(x, y); tiles[i] = (y - X.top) > (X.fy - X.top) * 0.6 ? GU_BRASA : (y - X.top) % 6 === 3 ? GU_SUCATA : GU_ESCORIA; guKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = GU_ESCADA; guKeep.add(i); } }
    if (X.fy - X.top > 8) { const my = (X.top + X.fy) >> 1; for (const x of [X.x0, X.x0 + 2, X.x0 + 3, X.x0 + 4]) { const i = I(x, my); tiles[i] = GU_PALICADA; guKeep.add(i); } }
    for (let x = X.x0 - 2; x <= X.x0 + 6; x++) { guKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 4) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = GU_TERRA; } }
    tiles[I(X.x0 + 1, X.fy)] = GU_ESCORIA;
  }

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x0fa9);
  const nearWar = (x, y) => { for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) { const t = at(x + dx, y + dy); if (t === GU_SUCATA || t === GU_BRASA) return true; } return false; };
  const vein = (ore, n, d0, d1, lmin, lmax, host, war) => {
    for (let k = 0, tries = 0; k < n && tries < n * 6; tries++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      if (war && !nearWar(x, y)) continue;
      k++;
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !guKeep.has(i) && !inGuHall(W1(x), y, 5)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(GU_O_CARVAO, 22 * WSC * K, 0, 46, 3, 7, t => t === GU_TERRA || t === GU_ARGILA);
  vein(GU_O_CARVAO, 8 * WSC * K, 46, 98, 3, 6, t => t === GU_MARMORE || t === GU_TERRA);
  vein(GU_O_CARVAO, 10 * WSC * K, 98, 186, 3, 6, t => t === GU_ESCORIA || t === GU_TERRA);
  const belHost = t => t === GU_TERRA || t === GU_SUCATA || t === GU_ESCORIA || t === GU_MARMORE;
  vein(GU_O_BELICITA, 10 * WSC * K, 20, 98, 3, 6, belHost, true);
  vein(GU_O_BELICITA, 16 * WSC * K, 98, 186, 3, 7, belHost, true);
  vein(GU_O_BELICITA, 6 * WSC * K, 46, 186, 2, 5, t => t === GU_TERRA || t === GU_ESCORIA, false);   // um pouco longe do ferro também, para quem não acha
}

function guAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = GU_S0, YB = Math.min(WH - 8, S0 + GU_D), R3 = mulberry32(seed ^ 0x6d3c1);
  const guRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!guRow(y)) return; const i = I(x, y); if (guKeep.has(i) || inGuHall(W1(x), y, 5)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WGU_TERRA; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const guSolid = t => SOLID[t] && GU_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const B = guBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 5 + m && y >= B.top - 5 - m && y <= B.fy + 5 + m;
  const blocked = t => SOLID[t] === 1;

  // ---------- 1. tudo alcançável das duas descidas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || blocked(tiles[s0])) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !blocked(tiles[nb])) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of guEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!guEntries.length && guRooms.length) flood(I(guRooms[0].cx, Math.round(guRooms[0].cy)));
  if (B) for (let y = B.top - 5; y <= B.fy + 5; y++) for (let x = B.cx - 55; x <= B.cx + 54; x++) reach[I(x, y)] = 1;
  const RB = S0 * WW, lab = new Uint8Array((YB - S0) * WW), comps = [];
  for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (reach[i] || lab[i - RB] || blocked(tiles[i]) || !walls[i]) continue;
    const comp = []; lab[i - RB] = 1; stack.push(i);
    while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= RB && nb < YB * WW && !lab[nb - RB] && !reach[nb] && !blocked(tiles[nb])) { lab[nb - RB] = 1; stack.push(nb); } }
    if (comp.length >= 16) comps.push(comp);
  }
  comps.sort((a, c) => c.length - a.length);
  const org = new Int32Array((YB - S0) * WW);
  const bfs = C => {
    org.fill(-1); const q = []; let hit = -1; for (const c of C) { org[c - RB] = c; q.push(c); }
    for (let h = 0; h < q.length && hit < 0; h++) {
      const c = q[h], x = c % WW, row = c - x;
      for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
        if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb - RB] >= 0 || inBox(nb % WW, (nb / WW) | 0, 2)) continue;
        if (reach[nb] && !blocked(tiles[nb])) { org[nb - RB] = c; hit = nb; break; }
        if (guKeep.has(nb) || guKeep.has(nb - WW) || tiles[nb] === BEDROCK) continue;
        org[nb - RB] = c;
        q.push(nb);
      }
    }
    return hit;
  };
  for (let pass = 0; pass < comps.length && pass < 60 * WSC * LAYER_K; pass++) {
    const bestC = comps[pass]; if (reach[bestC[0]]) continue;
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
        const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || blocked(tiles[i]) || inBox(W1(cx + dx), y, 2)) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) { const h = bfs(bestC); if (h >= 0) { let o = h; while (org[o - RB] !== o) o = org[o - RB]; best = [o % WW, (o / WW) | 0, h % WW, (h / WW) | 0]; } }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    {
      const [ax, ay, bx, by] = best, n = Math.max(1, Math.ceil(Math.abs(by - ay) / 11)); let x = ax, y = ay, dir = wdx(bx - ax) < 0 ? -1 : 1;
      for (let k = 1; k <= n; k++) { const ny = Math.round(ay + (by - ay) * k / n), nx = k === n ? ax + wdx(bx - ax) : x + dir * 12; worm(x, y, nx, ny, 1.3, 0x66a0 + pass + (k - 1) * 977); x = nx; y = ny; dir = -dir; }
    }
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {
      const hit = bfs(bestC);
      for (let c = hit; c >= 0 && org[c - RB] !== c; c = org[c - RB]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. escada de cerco (nos Bastiões) ou corda de cerco (no resto) em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBox(x, y, 3)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || GU_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (guKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        const tt = guerraBand(y) === 1 ? GU_ESCADA : GU_CORDA;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = tt; used.add(i); }
      }
    }
  }
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {   // poços verticais estreitos: a escada na coluna da esquerda
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !SOLID[at(x + 3, y)]) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || GU_CLIMB(at(x, y - 1)) || GU_CLIMB(at(x + 1, y)) || inBox(x, y, 3)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (guKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, GU_ESCADA);
  }

  // ---------- 3. a decoração: armas fincadas, elmos, ossos e flechas no chão; flâmulas e correntes no teto ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || guKeep.has(i)) continue;
    const b = guerraBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inGuLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = guSolid(dn) && BLOCKY[dn] && up === AIR, ceil = guSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 9 && at(x, y + gap) === AIR) gap++;
      if (gap <= 7 && gap >= 3 && guSolid(at(x, y + gap)) && q < (b === 0 || b === 3 ? 0.008 : 0.003)) { for (let j = 0; j < gap; j++) put(x, y + j, GU_COLUNA); continue; }   // a lança de um gigante, do chão ao teto
      if (b === 1) { if (q < 0.02 && gap > 4) { for (let j = 0, n = 2 + ((R3() * 2) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, GU_FLAMULA); } }
      else if (b === 2) { if (q < 0.025 && gap > 4) { for (let j = 0, n = 2 + ((R3() * 3) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, GU_GRILHAO); } }
      else if (b === 3) { if (q < 0.015 && gap > 4) put(x, y, GU_FLAMULA); }
      continue;
    }
    if (!floor || GU_CLIMB(at(x - 1, y)) || GU_CLIMB(at(x + 1, y))) continue;
    if (b === 0) { if (q < 0.03) put(x, y, GU_LANCA); else if (q < 0.05) put(x, y, GU_FLECHAS); else if (q < 0.062) put(x, y, GU_ESPADA); else if (q < 0.072) put(x, y, GU_ELMO); else if (q < 0.08) put(x, y, GU_OSSOS); else if (q < 0.084) put(x, y, GU_CRAVO); }
    else if (b === 1) { if (q < 0.016) put(x, y, GU_PENA); else if (q < 0.03) put(x, y, GU_ESCUDO); else if (q < 0.04) put(x, y, GU_ESPADA); else if (q < 0.046) put(x, y, GU_ELMO); }
    else if (b === 2) { if (q < 0.022) put(x, y, GU_FENDA); else if (q < 0.04) put(x, y, GU_OSSOS); else if (q < 0.05) put(x, y, GU_CRAVO); else if (q < 0.058) put(x, y, GU_LANCA); }
    else { if (q < 0.025) put(x, y, GU_LANCA); else if (q < 0.04) put(x, y, GU_ESPADA); else if (q < 0.055) put(x, y, GU_OSSOS); else if (q < 0.065) put(x, y, GU_ELMO); else if (q < 0.072) put(x, y, GU_ESCUDO); else if (q < 0.078) put(x, y, GU_FENDA); else if (q < 0.082) put(x, y, GU_PENA); }
  }

  // ---------- 4. os objetos ----------
  guPlaceProps();
}

/* ---------- as bocas das descidas por último ---------- */
function guExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of guEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? GU_ESCADA : AIR; guKeep.add(i); }
}
/* ---------- a subida garantida (como o 275): do Estandarte, dos campos, dos salões, das grutas e do pé das valas o
   herói tem de conseguir voltar às descidas (pulo de 3 blocos; escada e corda sobem) ---------- */
function guClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = GU_S0, YB = Math.min(WH - 8, S0 + GU_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, Bk = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => GU_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !Bk(x, y) && !Bk(x, y - 1), H = YB - Y0;
  const NC = WW * H, F = new Uint8Array(NC), good = new Uint8Array(NC * 5), seen = new Uint8Array(NC * 5), any = new Uint8Array(NC), Q = new Int32Array(NC * 5);
  const flag1 = (x, y) => {
    let f = 0;
    if (ok(x, y) && !inGuHall(x, y)) { f = 1; const lh = L(x, y), lu = lh || L(x, y - 1), sd = S(x, y + 1); if (sd || lu) f |= 2; if (sd || lh) f |= 4; if (lu) f |= 8; }
    F[(y - Y0) * WW + x] = f;
  };
  const flags = () => { for (let y = Y0 + 1; y < YB; y++) for (let x = 0; x < WW; x++) flag1(x, y); };
  const arrive = (p, r, c, dir) => { if (F[c] & 2) return dir === 1 && r === 0 ? -1 : 4; if (dir === 0) return r === 4 && !(F[p] & 4) ? 0 : r; if (dir === 1) return r === 0 ? -1 : F[p] & 8 ? 4 : r === 4 ? 3 : r - 1; return 0; };
  const spread = qt => {
    let qh = 0;
    while (qh < qt) {
      const t = Q[qh++], c = (t / 5) | 0, rt = t - c * 5, x = c % WW, row = c - x;
      for (let d = 0; d < 4; d++) {
        const p = d === 0 ? row + (x === 0 ? WW - 1 : x - 1) : d === 1 ? row + (x === WW - 1 ? 0 : x + 1) : d === 2 ? c + WW : c - WW;
        if (p < 0 || p >= NC || !(F[p] & 1)) continue;
        const dir = d < 2 ? 0 : d === 2 ? 1 : 2;
        for (let r = F[p] & 2 ? 4 : 0; r <= 4; r++) { const k = p * 5 + r; if (!good[k] && arrive(p, r, c, dir) === rt) { good[k] = 1; Q[qt++] = k; } }
      }
    }
  };
  const closure = () => {
    good.fill(0); let qt = 0;
    for (let y = Y0 + 1; y <= S0 - 3; y++) for (let x = 0; x < WW; x++) { const c = (y - Y0) * WW + x, f = F[c]; if (f & 1) for (let r = f & 2 ? 4 : 0; r <= 4; r++) { good[c * 5 + r] = 1; Q[qt++] = c * 5 + r; } }
    spread(qt);
  };
  const patch = (x, top, bot) => {
    for (let y = Math.max(Y0 + 1, top - 2); y <= Math.min(YB - 1, bot + 2); y++) for (let dx = -1; dx <= 1; dx++) flag1(W1(x + dx), y);
    let qt = 0;
    for (let y = Math.max(Y0 + 1, top - 3); y <= Math.min(YB - 1, bot + 3); y++) for (let dx = -2; dx <= 2; dx++) { const c = (y - Y0) * WW + W1(x + dx); for (let r = 0; r < 5; r++) if (good[c * 5 + r]) Q[qt++] = c * 5 + r; }
    spread(qt);
  };
  const forward = c0 => {
    seen.fill(0); any.fill(0); let qh = 0, qt = 0; const s0 = c0 * 5 + 4; seen[s0] = 1; Q[qt++] = s0; any[c0] = 1;
    while (qh < qt) {
      const t = Q[qh++], c = (t / 5) | 0, r = t - c * 5, x = c % WW, row = c - x;
      for (let d = 0; d < 4; d++) {
        const n = d === 0 ? row + (x === 0 ? WW - 1 : x - 1) : d === 1 ? row + (x === WW - 1 ? 0 : x + 1) : d === 2 ? c - WW : c + WW;
        if (n < 0 || n >= NC || !(F[n] & 1)) continue;
        const r1 = arrive(c, r, n, d < 2 ? 0 : d === 2 ? 1 : 2); if (r1 < 0) continue;
        const k = n * 5 + r1; if (!seen[k]) { seen[k] = 1; any[n] = 1; Q[qt++] = k; }
      }
    }
  };
  const soft = t => GU_SOILS[t] === 1 && t !== GU_O_BELICITA;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || guKeep.has(I(x, y)) || inGuHall(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !Bk(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!Bk(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !guKeep.has(I(x, t)) && !inGuHall(x, t, 5) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = GU_ESCADA; if (!walls[i]) walls[i] = WGU_TERRA; } }
    return best;
  };
  const starts = [];
  if (guBoss) for (const D of guBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const c of guFields) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of guForts) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of guGrutas) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const X of guExits) starts.push([X.x0 + 2, X.top - 1]);
  let fixes = 0, ns = 0;
  flags(); closure();
  for (const [x0, y0] of starts) {
    if (SOLID[tiles[I(x0, y0)]]) continue;
    for (let k = 0; k < 12; k++) {
      ns++;
      const sx = W1(x0); let y = y0; while (y < YB - 1 && !Bk(sx, y + 1) && !L(sx, y)) y++;
      const c = (y - Y0) * WW + sx;
      if (F[c] & 1) { if (good[c * 5 + 4]) break; forward(c); } else any.fill(0);
      const fx = repair(); if (!fx) break;
      fixes++; patch(fx[0], fx[1], fx[2]);
    }
  }
  guClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os desníveis: toda borda com 5 ou mais de queda ganha corda (escada nos Bastiões) na coluna da queda, da
   altura da borda até o chão de baixo; assim nenhum desnível de 5+ fica sem subida e nenhuma queda passa de 4 sem ela ---------- */
function guDropFix() {
  const W1 = x => ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = GU_S0, YB = Math.min(WH - 8, S0 + GU_D);
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, B = guBoss, inBox = (x, y) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 6 && y >= B.top - 6 && y <= B.fy + 6;
  let n = 0;
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (S(x, y) || !S(x, y + 1)) continue;
    for (const d of [-1, 1]) {
      const nx = W1(x + d); if (S(nx, y) || S(nx, y + 1) || inBox(nx, y) || inGuLand(nx, y, 1)) continue;
      let k = 0, cl = false; while (k < 80 && y + 1 + k < YB && !S(nx, y + 1 + k)) { if (GU_CLIMB(tiles[I(nx, y + k)]) || GU_CLIMB(tiles[I(nx, y + 1 + k)])) cl = true; k++; }
      if (cl || k < 5 || y + 1 + k >= YB) continue;
      let ok = true; for (let j = 0; j <= k; j++) { const i = I(nx, y + j); if ((tiles[i] !== AIR && !GU_DECO_T(tiles[i])) || guKeep.has(i) || (agua.length && agua[i])) { ok = false; break; } }
      if (!ok) continue;
      const t = guerraBand(y) === 1 ? GU_ESCADA : GU_CORDA;
      for (let j = 0; j <= k; j++) tiles[I(nx, y + j)] = t;
      n++;
    }
  }
  return n;
}
const GU_DECO_T = t => !SOLID[t] && t !== AIR && !GU_CLIMB(t) && t !== GU_BARREIRA;

/* ---------- os objetos (402): por faixa, no chão, debaixo do teto e na parede. def.forte: só nos salões dos bastiões;
   def.campo: só nos campos abertos. Nunca sobre escada ou corda; nunca no pouso nem no Campo do Estandarte ---------- */
function guPlaceProps() {
  if (typeof GU_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x8d3c7);
  const S0 = GU_S0, YB = Math.min(WH - 8, S0 + GU_D), used = new Uint8Array(WW * WH * 2), BF = typeof GU_BACK_FLOOR !== 'undefined' ? GU_BACK_FLOOR : {};
  const B = guBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 5 + m && y >= B.top - 5 - m && y <= B.fy + 5 + m;
  const inside = (L, x, y) => L.some(C => C.x0 !== undefined && C.top !== undefined ? wdx(x - C.x0) >= 0 && wdx(x - C.x0) < C.w && y >= C.top - 1 && y <= C.fy : Math.abs(wdx(x - C.cx)) <= C.w / 2 + 1 && Math.abs(y - C.cy) <= C.h / 2 + 1);
  const where = (def, x, y) => (!def.forte || inside(guForts, x, y)) && (!def.campo || inside(guFields, x, y));
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || GU_CLIMB(t) || (needAir && t !== AIR) || !walls[i] || guKeep.has(i) || inBox(W1(x), y, 1) || inGuLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && GU_SOILS[t] && t !== GU_PALICADA; };
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = GU_BAND_NAMES[clamp(guerraBand(y), 0, 3)], plan = GU_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inBox(W1(k), y, 2) || inGuLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 8;
          while (n > 0 && tries-- > 0) {
            const v = varOf(def, band), V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (!where(def, W1(px + (tw >> 1)), y)) continue;
            if (def.alto && (how === 'teto' ? !fits(px, y, tw, Math.max(th, def.alto), 0, true) : !fits(px, y + 1 - Math.max(th, def.alto), tw, Math.max(th, def.alto), 0, true))) continue;
            if (how === 'chao') {
              const y0 = y + 1 - th;
              if (!fits(px, y0, tw, th, 0, true)) continue;
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, th + 3, 0, true)) continue;
              mark(px, y, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!BF[id], y0 = onFloor ? y + 1 - th : y - th - ((R() * 2) | 0);
              if (!fits(px, y0, tw, th, 1, false)) continue;
              mark(px, y0, tw, th, 1); n--;
              const sup = []; if (onFloor) for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), onFloor ? (y + 1) * T - V.h : y0 * T + ((th * T - V.h) >> 1), sup);
            }
          }
        }
      }
    }
  }
}

// a ordem: a camada, o Campo do Estandarte (406: guDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc(); genStage('guerra', () => {
  if (!GUERRA) return;
  try { guBuild(); guAfter(); if (typeof guDress === 'function') guDress(); guExitClear(); guDropFix(); guClimbFix(); guDropFix(); } catch (err) { console.error(err); }
});
}; }

/* ---------- a terceira camada: o campo ao longe nas Lâminas e no Estandarte, as muralhas dos anjos nos Bastiões, o
   clarão do fogo na Brecha ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!GUERRA) return;
  const Y1 = Math.min(WH, GU_S0 + GU_D + 4);
  for (let y = Math.max(GU_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - GU_S0) + (depthNz(x, y, 25, seed ^ 0x6e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x6e12);
    DEEPT[i] = d < GU_BANDS[1] ? (n > 0.8 ? DP_GU_MURALHA : DP_GU_CAMPO) : d < GU_BANDS[2] ? (n > 0.78 ? DP_GU_CAMPO : DP_GU_MURALHA) : d < GU_BANDS[3] ? (n > 0.75 ? DP_GU_CAMPO : DP_GU_FOGO) : (n > 0.7 ? DP_GU_FOGO : DP_GU_CAMPO);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (GUERRA && ty >= GU_S0 && ty < GU_S0 + GU_D) return GU_ZONE0 + clamp(guerraBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6), em inteiros
Object.assign(CATH_SPAWN, {
  [GU_ZONE0]: [[['gu_enterrado', 24], ['gu_lamina', 18], ['gu_corvos', 20], ['gu_cavaleiro', 22], ['gu_arqueiro', 16]], 8],
  [GU_ZONE0 + 1]: [[['gu_cavaleiro', 22], ['gu_serafim', 22], ['gu_clerigo', 16], ['gu_penitente', 20], ['gu_corvos', 14]], 9],
  [GU_ZONE0 + 2]: [[['gu_arqueiro', 18], ['gu_cerco', 14], ['gu_portaestandarte', 14], ['gu_enterrado', 18], ['gu_lamina', 16], ['gu_penitente', 18]], 9],
  [GU_ZONE0 + 3]: [[['gu_cerco', 16], ['gu_portaestandarte', 16], ['gu_serafim', 18], ['gu_clerigo', 14], ['gu_arqueiro', 16], ['gu_cavaleiro', 20]], 10]
});
for (let z = GU_ZONE0; z < GU_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const GU_NO_SPAWN = (tx, ty) => guSafe(tx, ty) || inGuHall(tx, ty, 6) || guExits.some(X => Math.abs(wdx(tx - X.cx)) < 4 && ty >= X.top - 2);
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!GUERRA || !e || e.boss || (D && D.boss) || e.guMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - GU_S0;
  if (d >= 0 && d < GU_D) {
    if (zone >= GU_ZONE0 && zone <= GU_ZONE0 + 3 && GU_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.guVoid = true; return e; }
    const lvl = layerLvl(layerLo('guerra'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].guVoid) enemies.splice(k, 1); });

/* ---------- partículas: poeira e cinza fria sobre o campo, uma pena clara descendo nos Bastiões, fagulhas subindo da
   Brecha, a poeira levantada pelos cascos no Estandarte ---------- */
HOOK.update.push(dt => {
  if (!GUERRA || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = guerraBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 1 ? 2 : 5)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (b === 0) parts.push({ x, y, vx: rnd(6, 14), vy: rnd(-1, 2), g: 0, life: 2.6, max: 2.6, col: Math.random() < 0.6 ? '#6a5a48' : '#8a7a66', size: 1 });
    else if (b === 1) parts.push({ x, y, vx: rnd(-4, 4), vy: rnd(3, 7), g: 0, life: 4, max: 4, col: Math.random() < 0.7 ? '#e8e0c8' : '#fff4d8', size: Math.random() < 0.3 ? 2 : 1 });
    else if (b === 2) parts.push({ x, y, vx: rnd(-3, 3), vy: rnd(-16, -6), g: -2, life: 1.6, max: 1.6, col: Math.random() < 0.5 ? '#ff8a20' : '#ffc060', size: 1 });
    else parts.push({ x, y, vx: rnd(-8, 8), vy: rnd(-3, 1), g: 2, life: 2.2, max: 2.2, col: Math.random() < 0.6 ? '#5a4a3a' : '#7a6650', size: Math.random() < 0.2 ? 2 : 1 });
  }
});

/* ---------- a forja e o vilarejo: a belicita na fornalha (407 tem os itens), as lojas ---------- */
FURN.min_belicita = { bar: 'barra_belicita', n: 8, t: 10 };
Object.assign(MAT_VAL, { min_belicita: 64, barra_belicita: 520, pena_anjo: 30, chifre_demonio: 30, trapo_estandarte: 26, medalha_guerra: 95, terra_batalha: 2, ferro_batalha: 12 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'pena_anjo'; c.hint = c.hint.replace(/\.$/, '') + ' e penas de anjo.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_belicita', 'barra_belicita', 'chifre_demonio', 'trapo_estandarte', 'ferro_batalha'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', belicita, chifres de demônio e trapos de estandarte.'; }
{ const o = SHOPS.taverneiro, b = o.buys; o.buys = id => b(id) || id === 'medalha_guerra'; o.hint = o.hint.replace(/\.$/, '') + ' O Odo coleciona medalhas de guerra e paga caro.'; }
