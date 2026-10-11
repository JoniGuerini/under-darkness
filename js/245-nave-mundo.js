'use strict';

/* ================= a Nave Caída: o mundo (docs/camadas/10-nave-caida.md, seção 3) =================
   A décima camada, debaixo da Colmeia (nvAbove, 240). Em cima, a cratera que a queda abriu na rocha; embaixo, a
   própria nave, deitada e ainda ligada. Em passos:
     1. a rocha por faixa: a cera real da Colmeia vira Vidro de Impacto; Vidro e Escória na Cratera; Chapa do Casco
        no Casco; Liga nos Laboratórios; Metal do Reator no Núcleo; bordas por ruído
     2. as salas: as duas descidas (o tubo de chapa rasgada com a Escada de Serviço e a Cápsula de Pouso 12 x 6), o
        Planetário do outro lado do mundo (a caixa sólida que o 246 veste com nvDress) e os dois corredores de serviço
        até ele, as crateras e os destroços do casco, os corredores retos, os hangares e as Salas sem Peso, os
        laboratórios e a Galeria dos Espécimes, as salas do reator (duas com os Rasgos no Casco, a saída para baixo)
     3. as ligações: dutos retos (corredor de 4 e poço de 3) entre as salas da nave, túneis de impacto na Cratera e no
        Núcleo, elevadores de feixe entre as faixas
     4. as cascas: grade no chão e neon no teto dos corredores, painel de neon nos hangares e nas Salas sem Peso,
        liga e vidro nos laboratórios, plasma nas salas do reator, vidro e escória nas crateras
     5. os veios: carvão na escória, xenita no vidro, na escória e na liga (metade nos Laboratórios e no Núcleo)
   Depois (nvAfter): tudo alcançável das descidas, Escada de Serviço ou cabo em todo desnível de 5, os estragos (piso
   afundado em rampa de destroços, poças de gosma), a decoração de 1 bloco e os objetos (242). Por fim o Planetário
   (246: nvDress), as bocas das descidas e a subida garantida (nvClimbFix). O 87 liga o resto depois.
   Também: a terceira camada, as zonas 49 a 52, o spawn por faixa e o nível (21 e 22 pela posição no 129), as
   partículas e a xenita na fornalha e nas lojas. */

const NV_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [NV_VIDRO_IMPACTO, NV_ESCORIA, NV_CASCO, NV_PAINEL_NEON, NV_GRADE, NV_LIGA, NV_VIDRO, NV_GOSMA, NV_PLASMA, NV_REATOR, NV_O_CARVAO, NV_O_XENITA]) NV_SOILS[t] = 1;
let nvChambers = [], nvCorr = [], nvHangars = [], nvLabs = [], nvReatores = [], nvCraters = [], nvWrecks = [], nvGaleria = [];
const NV_CLIMB = t => t === NV_ESCADA || t === NV_CABO || t === NV_FEIXE || t === CHAIN || t === nvAbove().climb;
const nvBossOf = a => a.boss || null;

function nvBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = nvAbove();
  NV_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = NV_S0, YB = Math.min(WH - 8, S0 + NV_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x4e5a), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / NV_D);
  const bandOf = d => d < NV_BANDS[1] ? 0 : d < NV_BANDS[2] ? 1 : d < NV_BANDS[3] ? 2 : 3;
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  nvChambers = []; nvCorr = []; nvHangars = []; nvLabs = []; nvReatores = []; nvCraters = []; nvWrecks = []; nvGaleria = [];
  nvEntries = []; nvLand = []; nvExits = []; nvBoss = null; nvSemPeso = []; nvLifts = []; nvKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 10; y < S0; y++) {   // a cera de cima afina nas últimas 10 linhas e vira vidro: o calor da queda
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0x4b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = NV_VIDRO_IMPACTO;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      const d = y - S0 + (nz(x, y, 18, 0x4b3) - 0.5) * 10, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 26, 0x4a1), n2 = nz(x, y, 14, 0x4a2);
      let tt = NV_VIDRO_IMPACTO, w = WNV_ROCHA;
      if (y >= YB) { tt = NV_REATOR; w = WNV_REATOR; }
      else if (b === 0) { if (n1 > 0.62 || (d > 34 && n2 > 0.55)) tt = NV_ESCORIA; }
      else if (b === 1) { tt = n1 > 0.76 ? NV_ESCORIA : NV_CASCO; w = WNV_CASCO; }
      else if (b === 2) { tt = n2 > 0.74 ? NV_CASCO : NV_LIGA; w = WNV_LAB; }
      else { tt = n1 > 0.8 ? NV_LIGA : NV_REATOR; w = WNV_REATOR; }
      tiles[i] = tt; walls[i] = w;
      if (y < YB && agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. as salas ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => nvChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  // sala reta: ar de fy - h a fy - 1, chão em fy
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  const blob = (cx, cy, w, h, s, flat = 1.5) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.18 + (nz(x, y, 40, s) - 0.5) * 0.25) dig(x, y);
    }
  };
  // túnel de impacto (Cratera e Núcleo): anda para o alvo com curvas; r ~1.3 dá 3 de altura
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 1200; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.8 + Math.sin(n * 0.13 + s) * 0.25;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.5;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.8 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  // duto da nave: um corredor reto de 4 no chão fa de xa até xb, depois um poço de 3 até o chão fb (a escada vem no nvAfter)
  const duct = (xa, fa, xb, fb, list) => {
    const d = wdx(xb - xa), s = d < 0 ? -1 : 1, x1 = xa + d;
    for (let x = xa; x !== x1 + s; x += s) { for (let y = fa - 4; y < fa; y++) dig(x, y); hard(x, fa); }
    if (list) list.push({ x0: W1(Math.min(xa, x1)), len: Math.abs(d) + 1, fy: fa });
    const ya = Math.min(fa - 4, fb - 3), yb = Math.max(fa, fb);
    if (Math.abs(fb - fa) > 1) for (let y = ya; y < yb; y++) for (let x = x1 - 1; x <= x1 + 1; x++) dig(x, y);
    if (Math.abs(fb - fa) > 1) for (let y = fb - 3; y < fb; y++) for (let x = x1 - 1; x <= x1 + 1; x++) dig(x, y);
  };

  // ---------- 2a. as duas descidas: dos escorredouros da Colmeia, um tubo de chapa rasgada até a Cápsula de Pouso ----------
  {
    const ub = nvBossOf(A), halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.w || 20) / 2 + 20)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) picks.push({ cx: (R() * WW) | 0, fy: S0 - 2 }, { cx: (R() * WW) | 0, fy: S0 - 2 });
    for (const c of picks) {
      const xs = W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 20 + ((R() * 7) | 0), S0 + 9, S0 + mb(30));
      const hx = side > 0 ? xs - 1 : xs - 8;   // o tubo cai numa ponta da cápsula (12 x 6)
      for (let y = landFy - 7; y <= landFy + 1; y++) for (let x = hx - 1; x <= hx + 12; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 12; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 12 : hx - 1;
      for (let y = landFy - 3; y < landFy; y++) { const i = I(door, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 12, h: 6, door: W1(door), side };
      nvLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 3; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // um destroço do casco logo depois da porta: o primeiro pedaço da nave que o herói vê
      const w = 18 + ((R() * 10) | 0), h = 6, x0 = side > 0 ? door + 1 : door - w;
      room(x0, landFy, w, h);
      const H = { cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'destroco', x0: W1(x0), fy: landFy, top: landFy - h };
      nvWrecks.push(H); nvChambers.push(H);
      nvChambers.push({ cx: hx + 6, cy: landFy - 3, w: 12, h: 6, band: 0, kind: 'pouso', nolink: true });
      nvEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }

  // ---------- 2b. o Planetário, do outro lado do mundo, e os dois corredores de serviço até as portas ----------
  {
    const r = 22, m = r + 3;
    const ax = nvEntries.length ? nvEntries.reduce((s, e) => s + wdx(e.x0 - nvEntries[0].x0), 0) / nvEntries.length + nvEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), cy = Math.min(YB - 4 - m, S0 + mb(186) - 30);
    nvBoss = { cx, cy, r, x0: W1(cx - r), x1: W1(cx + r), top: cy - r, bot: cy + r, fy: cy + r,
      doors: [{ side: -1, x: W1(cx - m), fy: cy + 12 }, { side: 1, x: W1(cx + m), fy: cy + 12 }],
      planet: { cx, cy: cy - 1, r: 5 }, ring: { rx: 13, ry: 4 } };
    for (let y = cy - m - 1; y <= cy + m + 1; y++) for (let x = cx - m - 1; x <= cx + m + 1; x++) seal[I(x, y)] = 1;
    nvChambers.push({ cx, cy, w: 2 * m + 2, h: 2 * m + 2, band: 3, boss: true, nolink: true });
    for (const D of nvBoss.doors) {
      const len = 30 + ((R() * 16) | 0), fy = D.fy;
      let x = D.x + D.side;
      for (let k = 0; k < len; k++) {
        for (let y = fy - 4; y < fy; y++) { const i = I(x, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
        hard(x, fy); nvKeep.add(I(x, fy));
        x += D.side;
      }
      nvCorr.push({ x0: D.side > 0 ? W1(D.x + 1) : W1(D.x - len), len, fy, boss: true });
      nvChambers.push({ cx: D.x + D.side * len / 2, cy: fy - 2, w: len, h: 4, band: 3, kind: 'servico', nolink: true });
      // uma sala do reator no fim do corredor
      const w = 18 + ((R() * 6) | 0), h = 12, x0 = D.side > 0 ? x - 1 : x - w + 2;
      room(x0, fy, w, h);
      const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 3, kind: 'reator', x0: W1(x0), fy, top: fy - h };
      nvReatores.push(C); nvChambers.push(C);
    }
  }
  const awayFromBoss = (cx, cy, m) => !nvBoss || Math.hypot(wdx(cx - nvBoss.cx), cy - nvBoss.cy) > nvBoss.r + 3 + m;

  // ---------- 2c. os Rasgos no Casco: duas salas do reator no fundo, longe uma da outra e do Planetário ----------
  for (let tries = 0; nvExits.length < 2 && tries < 600; tries++) {
    const w = 16 + ((R() * 6) | 0), h = 10, cx = (R() * WW) | 0, fy = S0 + mb(166) + ((R() * mb(10)) | 0);
    if (!awayFromBoss(cx, fy, 40) || nvExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'reator', x0: W1(x0), fy, top: fy - h, exit: true };
    nvReatores.push(C); nvChambers.push(C);
    const sx = W1(cx - 1);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 3; x++) seal[I(x, y)] = x >= sx && x < sx + 3 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 3; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    nvExits.push({ x0: sx, x1: W1(sx + 2), cx: W1(cx), w: 3, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. a Cratera: tigelas de vidro, cavernas de impacto e destroços do casco enfiados na rocha ----------
  for (let k = 0, tries = 0; k < 5 * WSC && tries < 400; tries++) {
    const w = 30 + ((R() * 21) | 0), h = 10 + ((R() * 7) | 0), cx = (R() * WW) | 0, cy = S0 + mb(10) + h / 2 + R() * Math.max(0, mb(32) - h);
    if (busy(cx, cy, w, h, 6)) continue;
    // a tigela: a metade de baixo de uma elipse, com o teto em arco baixo
    for (let y = Math.floor(cy - h / 2); y <= cy + h / 2; y++) for (let x = Math.floor(cx - w / 2); x <= cx + w / 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy = (y + 0.5 - cy) / (h / 2), e = dy > 0 ? dx * dx + dy * dy : dx * dx * 0.85 + dy * dy * 1.6;
      if (e < 1 + (nz(x, y, 20, 0x4c0 + k) - 0.5) * 0.3) dig(x, y);
    }
    const C = { cx, cy, w, h, band: 0, kind: 'cratera', fy: Math.round(cy + h / 2) };
    nvCraters.push(C); nvChambers.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 4 * WSC && tries < 300; tries++) {
    const w = 10 + ((R() * 8) | 0), h = 6 + ((R() * 4) | 0), cx = (R() * WW) | 0, cy = S0 + mb(8) + h / 2 + R() * Math.max(0, mb(34) - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0x4d00 + k, 1.3);
    nvChambers.push({ cx, cy, w, h, band: 0, kind: 'caverna' }); k++;
  }
  // destroços: pedaços retangulares do casco, ocos por dentro, enfiados tortos (inclinação de até 20 graus)
  for (let k = 0, tries = 0; k < 4 * WSC && tries < 300; tries++) {
    const w = 10 + ((R() * 8) | 0), h = 5 + ((R() * 3) | 0), cx = (R() * WW) | 0, cy = S0 + mb(12) + R() * mb(28), a = (R() - 0.5) * 0.7;
    if (busy(cx, cy, w + 4, h + 6, 5)) continue;
    const ca = Math.cos(a), sa = Math.sin(a), hw = w / 2, hh = h / 2;
    for (let y = Math.floor(cy - w); y <= cy + w; y++) for (let x = Math.floor(cx - w); x <= cx + w; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
      if (Math.abs(u) < hw - 1 && Math.abs(v) < hh - 1) dig(x, y);
    }
    const C = { cx, cy, w, h, a, band: 0, kind: 'casco' };
    nvWrecks.push(C); nvChambers.push(C); k++;
  }

  // ---------- 2e. o Casco: corredores retos, hangares e Salas sem Peso ----------
  for (let k = 0, tries = 0; k < 3 * WSC && tries < 300; tries++) {
    const w = 36 + ((R() * 15) | 0), h = 12 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = S0 + mb(62 + R() * 32);
    if (fy - h < S0 + mb(48) || busy(x0 + w / 2, fy - h / 2, w, h, 6)) continue;
    room(x0, fy, w, h);
    const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, kind: 'hangar', x0: W1(x0), fy, top: fy - h };
    nvHangars.push(H); nvChambers.push(H); k++;
  }
  for (let k = 0, tries = 0; k < 2 * WSC && tries < 300; tries++) {
    const s = 14 + ((R() * 5) | 0), x0 = (R() * WW) | 0, fy = S0 + mb(64 + R() * 30);
    if (fy - s < S0 + mb(48) || busy(x0 + s / 2, fy - s / 2, s, s, 6)) continue;
    room(x0, fy, s, s);
    const H = { cx: x0 + s / 2, cy: fy - s / 2, w: s, h: s, band: 1, kind: 'sempeso', x0: W1(x0), fy, top: fy - s };
    nvSemPeso.push({ x0: W1(x0), x1: W1(x0 + s - 1), top: fy - s, fy }); nvChambers.push(H); k++;
  }
  for (let k = 0, tries = 0; k < 10 * WSC && tries < 600; tries++) {
    const len = 40 + ((R() * 51) | 0), x0 = (R() * WW) | 0, fy = S0 + mb(52 + R() * 42);
    if (busy(x0 + len / 2, fy - 2, len, 4, 3)) continue;
    // um corredor pode descer ou subir 1 a 2 num ponto (a nave entortou na queda)
    const mid = 12 + ((R() * (len - 24)) | 0), st = R() < 0.4 ? (R() < 0.5 ? -1 : 1) * (1 + ((R() * 2) | 0)) : 0;
    for (let j = 0; j < len; j++) { const f = j < mid ? fy : fy + st; for (let y = f - 4; y < f; y++) dig(x0 + j, y); hard(x0 + j, f); }
    const C = { cx: x0 + len / 2, cy: fy - 2, w: len, h: 4, band: 1, kind: 'corredor', x0: W1(x0), fy, top: fy - 4, len, step: [mid, st], ends: [[W1(x0), fy], [W1(x0 + len - 1), fy + st]] };
    nvCorr.push({ x0: W1(x0), len, fy, step: [mid, st] }); nvChambers.push(C); k++;
  }

  // ---------- 2f. os Laboratórios: salas brancas retas e a Galeria dos Espécimes ----------
  for (let k = 0; k < WSC; k++) {
    for (let tries = 0; tries < 200; tries++) {
      const w = 60 + ((R() * 21) | 0), h = 8, x0 = (R() * WW) | 0, fy = S0 + mb(112 + R() * 30);
      if (busy(x0 + w / 2, fy - h / 2, w, h, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
      room(x0, fy, w, h);
      const G = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'galeria', x0: W1(x0), fy, top: fy - h };
      nvGaleria.push(G); nvLabs.push(G); nvChambers.push(G); break;
    }
  }
  for (let k = 0, tries = 0; k < 7 * WSC && tries < 500; tries++) {
    const w = 20 + ((R() * 11) | 0), h = 8 + ((R() * 4) | 0), x0 = (R() * WW) | 0, fy = S0 + mb(108 + R() * 38);
    if (fy - h < S0 + mb(100) || busy(x0 + w / 2, fy - h / 2, w, h, 5) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
    room(x0, fy, w, h);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 2, kind: 'lab', x0: W1(x0), fy, top: fy - h, glass: R() < 0.5 ? -1 : 1 };
    nvLabs.push(C); nvChambers.push(C); k++;
  }

  // ---------- 2g. o Núcleo: salas redondas do reator ----------
  for (let k = 0, tries = 0; nvReatores.length < 5 * WSC && tries < 500; tries++) {
    const w = 18 + ((R() * 9) | 0), h = 12 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = S0 + mb(152) + h / 2 + R() * Math.max(0, mb(30) - h);
    if (busy(cx, cy, w, h, 6) || !awayFromBoss(cx, cy, Math.max(w, h) / 2 + 6) || cy + h / 2 > YB - 4) continue;
    blob(cx, cy, w, h, 0x4f00 + k, 1.7);
    const C = { cx, cy, w, h, band: 3, kind: 'reator', round: true };
    nvReatores.push(C); nvChambers.push(C); k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => C.ends ? (right ? C.ends[1] : C.ends[0]) : [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), mouth(C)];
  for (let b = 0; b < 4; b++) {
    const L = nvChambers.filter(c => c.band === b && !c.nolink && !c.boss).sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      if (b === 1 || b === 2) duct(ax, ay, bx, by, b === 1 ? nvCorr : null);   // a nave: dutos retos
      else worm(ax, ay - 2, bx, by - 2, b === 0 ? 1.4 : 1.3, 0x4700 + b * 90 + k);   // a cratera e o núcleo: túneis de impacto e de plasma
    }
  }
  // entre as faixas: dutos curtos e os elevadores de feixe (2 x WSC por divisa)
  for (let b = 0; b < 3; b++) {
    const U = nvChambers.filter(c => c.band === b && !c.nolink && !c.boss), D = nvChambers.filter(c => c.band === b + 1 && !c.nolink && !c.boss);
    for (let k = 0; k < 2 * WSC && U.length && D.length; k++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      const [ax, ay] = ends(P, R() < 0.5); worm(ax, ay - 2, Q.cx, mouth(Q) - 2, 1.3, 0x47f0 + b * 9 + k);
    }
    for (let k = 0, tries = 0; k < 2 * WSC && tries < 80; tries++) {
      const P = U[(R() * U.length) | 0]; if (!P || !P.fy) continue;
      const sx = W1(Math.round(P.cx) + ((R() * 7) | 0) - 3), Q = D.reduce((m, c) => Math.abs(wdx(c.cx - sx)) < Math.abs(wdx(m.cx - sx)) ? c : m);
      const yb = Math.round(mouth(Q)); if (yb - P.fy < 10 || yb - P.fy > 70 || !awayFromBoss(sx, yb, 4) || nvLifts.some(L => Math.abs(wdx(L.x - sx)) < 12)) continue;
      for (let y = P.fy - 1; y < yb; y++) for (let x = sx - 1; x <= sx + 1; x++) dig(x, y);
      duct(sx, yb, Math.round(Q.cx), mouth(Q));
      nvLifts.push({ x: sx, y0: P.fy - 4, y1: yb - 1 });
      k++;
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
  const set = (x, y, t, w) => { const i = I(x, y); tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const shell = (x, y, t) => { const i = I(x, y); if (SOLID[tiles[i]] && NV_SOILS[tiles[i]] && !nvKeep.has(i) && !inNvHall(W1(x), y, 4)) tiles[i] = t; };
  const airAround = (x, y) => !SOLID[at(x - 1, y)] || !SOLID[at(x + 1, y)] || !SOLID[at(x, y - 1)] || !SOLID[at(x, y + 1)];
  const lining = (x0, y0, x1, y1, t, w, floorT, ceilT) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (inNvHall(W1(x), y, 4)) continue;
      if (SOLID[tiles[i]]) { if (airAround(x, y) || hash2(W1(x), y, seed ^ 0x41) < 0.55) shell(x, y, floorT && !SOLID[at(x, y - 1)] ? floorT : ceilT && !SOLID[at(x, y + 1)] ? ceilT : t); }
      else walls[i] = w;
    }
  };
  // a cratera: casca de vidro, a borda de cima de escória rachada; o fundo com crosta de gosma
  for (const C of nvCraters) {
    const x0 = Math.floor(C.cx - C.w / 2) - 2, x1 = Math.ceil(C.cx + C.w / 2) + 2, y0 = Math.floor(C.cy - C.h / 2) - 2, y1 = Math.ceil(C.cy + C.h / 2) + 2;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (!SOLID[tiles[i]]) { walls[i] = WNV_ROCHA; continue; }
      if (!airAround(x, y) && hash2(W1(x), y, seed ^ 0x42) > 0.4) continue;
      shell(x, y, y < C.cy - C.h * 0.15 ? NV_ESCORIA : (y > C.cy + C.h * 0.25 && !SOLID[at(x, y - 1)] && hash2(W1(x), y, seed ^ 0x43) < 0.35) ? NV_GOSMA : NV_VIDRO_IMPACTO);
    }
  }
  // os destroços: chapa do casco por fora, parede de painéis por dentro, um rasgo de luz numa ponta
  for (const H of nvWrecks) {
    if (H.kind === 'destroco') { lining(H.x0 - 1, H.top - 1, H.x0 + H.w, H.fy, NV_CASCO, WNV_CASCO, NV_GRADE, NV_CASCO); continue; }
    const ca = Math.cos(H.a), sa = Math.sin(H.a), hw = H.w / 2, hh = H.h / 2;
    for (let y = Math.floor(H.cy - H.w); y <= H.cy + H.w; y++) for (let x = Math.floor(H.cx - H.w); x <= H.cx + H.w; x++) {
      const dx = x + 0.5 - H.cx, dy = y + 0.5 - H.cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
      if (Math.abs(u) >= hw + 0.6 || Math.abs(v) >= hh + 0.6) continue;
      const i = I(x, y); if (!canCarve(x, y)) continue;
      if (!SOLID[tiles[i]]) walls[i] = Math.abs(u) > hw - 2.5 && hash2(W1(x), y, seed ^ 0x44) < 0.4 ? WNV_NEON : WNV_CASCO;
      else shell(x, y, Math.abs(v) > hh - 1.6 && Math.abs(u) < hw - 3 && hash2(W1(x) >> 1, y, seed ^ 0x45) < 0.18 ? NV_PAINEL_NEON : NV_CASCO);
    }
  }
  // os corredores: grade no chão, chapa no teto, parede de painéis; um trecho de painel de neon a cada tanto
  for (const Q of nvCorr) {
    const step = Q.step || [Q.len, 0];
    for (let j = -1; j <= Q.len; j++) {
      const x = Q.x0 + j, f = j < step[0] ? Q.fy : Q.fy + step[1];
      for (let y = f - 5; y <= f; y++) {
        const i = I(x, y); if (inNvHall(W1(x), y, 1) || y < S0 + 1 || y >= YB - 1) continue;
        if (!SOLID[tiles[i]]) { walls[i] = (j % 14 === 7) ? WNV_NEON : WNV_CASCO; continue; }
        if (y === f && NV_SOILS[tiles[i]] && !nvKeep.has(i)) tiles[i] = NV_GRADE;
        else if (y === f - 5 && NV_SOILS[tiles[i]] && !nvKeep.has(i)) tiles[i] = (j % 14 >= 5 && j % 14 <= 8) ? NV_PAINEL_NEON : NV_CASCO;
      }
    }
  }
  // os hangares: casca de chapa com faixas de painel de neon, parede de neon, duas plataformas de grade
  for (const H of nvHangars) {
    lining(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, NV_CASCO, WNV_CASCO, NV_GRADE, NV_PAINEL_NEON);
    for (let y = H.top; y < H.fy; y++) for (let x = H.x0; x < H.x0 + H.w; x++) if ((y - H.top) % 4 === 1 && !SOLID[at(x, y)]) walls[I(x, y)] = WNV_NEON;
    for (let p = 0; p < 2; p++) {   // plataformas a 4 e 8 do chão, encostadas numa parede, 8 a 12 de largura
      const py = H.fy - 4 - p * 4, pw = 8 + ((R() * 5) | 0), left = (p + (R() < 0.5 ? 0 : 1)) & 1, px = left ? H.x0 : H.x0 + H.w - pw;
      if (py <= H.top + 2) continue;
      for (let x = px; x < px + pw; x++) if (at(x, py) === AIR) set(x, py, NV_GRADE);
    }
  }
  // as Salas sem Peso: tudo painel de neon (violeta), parede de neon; ilhas de grade flutuando no meio
  for (const S of nvSemPeso) {
    const w = wdx(S.x1 - S.x0) + 1;
    for (let y = S.top - 2; y <= S.fy + 1; y++) for (let x = S.x0 - 2; x <= S.x0 + w + 1; x++) { const i = I(x, y); if (inNvHall(W1(x), y, 1)) continue; if (!SOLID[tiles[i]]) walls[i] = WNV_NEON; else if (airAround(x, y) || hash2(W1(x), y, seed ^ 0x46) < 0.5) shell(x, y, NV_PAINEL_NEON); }
    for (let k = 0; k < 3; k++) { const px = S.x0 + 2 + ((R() * (w - 7)) | 0), py = S.top + 3 + ((R() * (S.fy - S.top - 6)) | 0); for (let x = px; x < px + 3 + ((R() * 2) | 0); x++) if (at(x, py) === AIR) set(x, py, NV_GRADE); }
  }
  // os laboratórios: casca de liga, chão de liga, parede branca; uma ponta de vidro (2 de espessura) e crosta de gosma
  for (const C of nvLabs) {
    lining(C.x0 - 2, C.top - 2, C.x0 + C.w + 1, C.fy + 1, NV_LIGA, WNV_LAB, NV_LIGA, NV_LIGA);
    if (C.glass) { const xe = C.glass > 0 ? C.x0 + C.w : C.x0 - 2; for (let y = C.top - 1; y <= C.fy; y++) for (let x = xe; x < xe + 2; x++) if (SOLID[at(x, y)] && !nvKeep.has(I(x, y)) && !inNvHall(W1(x), y, 2)) set(x, y, NV_VIDRO); }
    for (let k = 0, n = 1 + ((R() * 3) | 0); k < n; k++) { const x = C.x0 + 2 + ((R() * (C.w - 4)) | 0); for (let j = 0; j < 2 + ((R() * 3) | 0); j++) if (SOLID[at(x + j, C.fy)]) set(x + j, C.fy, NV_GOSMA); }
  }
  // as salas do reator: casca de reator com cachos de cristal de plasma nas paredes, parede do reator
  for (const C of nvReatores) {
    const x0 = Math.floor(C.cx - C.w / 2) - 3, x1 = Math.ceil(C.cx + C.w / 2) + 3, y0 = Math.floor(C.cy - C.h / 2) - 3, y1 = Math.ceil(C.cy + C.h / 2) + 3;
    lining(x0, y0, x1, y1, NV_REATOR, WNV_REATOR, NV_REATOR, NV_REATOR);
    for (let k = 0, n = 2 + ((R() * 3) | 0); k < n; k++) {
      const a = R() * Math.PI * 2, r = 1.4 + R() * 1.4, ex = C.cx + Math.cos(a) * C.w / 2, ey = C.cy + Math.sin(a) * C.h / 2;
      for (let y = Math.floor(ey - r); y <= ey + r; y++) for (let x = Math.floor(ex - r); x <= ex + r; x++) {
        if (Math.hypot(x + 0.5 - ex, y + 0.5 - ey) > r || inNvHall(W1(x), y, 3) || y >= YB - 1) continue;
        const i = I(x, y); if (nvKeep.has(i) || !SOLID[tiles[i]]) continue; tiles[i] = NV_PLASMA;
      }
    }
  }
  // as cavernas de impacto: escória por dentro
  for (const C of nvChambers) if (C.kind === 'caverna') lining(Math.floor(C.cx - C.w / 2) - 2, Math.floor(C.cy - C.h / 2) - 2, Math.ceil(C.cx + C.w / 2) + 2, Math.ceil(C.cy + C.h / 2) + 2, NV_ESCORIA, WNV_ROCHA);
  // o Planetário: a caixa toda sólida, metal do reator com parede do reator (o 246 escreve dentro)
  {
    const B = nvBoss, m = B.r + 3;
    for (let y = B.cy - m; y <= B.cy + m; y++) for (let x = B.cx - m; x <= B.cx + m; x++) { const i = I(x, y); tiles[i] = NV_REATOR; walls[i] = WNV_REATOR; if (agua.length) agua[i] = 0; }
  }
  // ---------- as descidas: a boca vira vidro rachado, o tubo de chapa rasgada com a Escada de Serviço; a Cápsula de Pouso ----------
  for (const E of nvEntries) {
    const x0 = E.x0, L = E.land, y1 = L.fy - 6;
    for (let x = x0 - 3; x <= x0 + 5; x++) { const i = I(x, E.fy); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 3)) tiles[i] = NV_VIDRO_IMPACTO; }
    for (let y = E.fy; y < y1; y++) {
      for (let x = x0; x < x0 + 3; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = y < S0 ? WNV_ROCHA : WNV_CASCO; nvKeep.add(i); }
      for (const x of [x0 - 1, x0 + 3]) { const i = I(x, y); if (y > E.fy) { tiles[i] = y < S0 + 3 ? NV_VIDRO_IMPACTO : (y - E.fy) % 6 === 5 ? NV_PAINEL_NEON : NV_CASCO; nvKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = NV_ESCADA; nvKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 3; x++) nvKeep.add(I(x, y));
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= L.fy - 3 && y < L.fy) { tiles[i] = AIR; walls[i] = WNV_CASCO; }
      else if (edge && !(y === L.fy - L.h - 1 && W1(x) >= x0 && wdx(x - x0) < 3)) tiles[i] = y === L.fy ? NV_GRADE : NV_CASCO;
      else if (!edge) { tiles[i] = AIR; walls[i] = (x - L.x0) % 4 === 1 ? WNV_NEON : WNV_CASCO; }
      else { tiles[i] = W1(x) === W1(x0 + 1) ? NV_ESCADA : AIR; walls[i] = WNV_CASCO; }
      nvKeep.add(i);
    }
    // a luz de emergência: dois tubos de neon no teto, longe da escada
    for (const lx of L.side > 0 ? [L.x0 + 5, L.x0 + 9] : [L.x0 + 2, L.x0 + 6]) if (tiles[I(lx, L.fy - L.h)] === AIR) tiles[I(lx, L.fy - L.h)] = NV_NEON;
  }
  // ---------- os Rasgos no Casco: a chapa dobrada para fora, plasma vazando nas bordas, a escada até a última linha ----------
  for (const X of nvExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 3; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WNV_REATOR; nvKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 3]) { const i = I(x, y); tiles[i] = (y - X.top) % 7 === 3 ? NV_PLASMA : NV_CASCO; nvKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = NV_ESCADA; nvKeep.add(i); } }
    for (let x = X.x0 - 2; x <= X.x0 + 4; x++) { nvKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 2) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = NV_PLASMA; } }
    tiles[I(X.x0 + 1, X.fy)] = NV_REATOR;
  }
  // ---------- os elevadores de feixe: o emissor no chão, o feixe pela coluna do meio até o topo do poço ----------
  for (const Lf of nvLifts) {
    let y1 = Lf.y1; while (y1 > Lf.y0 && SOLID[at(Lf.x, y1)]) y1--;
    let yb = y1; while (yb < YB - 2 && !SOLID[at(Lf.x, yb + 1)]) yb++;
    Lf.y1 = yb;
    for (let y = Lf.y0; y <= yb; y++) { const i = I(Lf.x, y); if (tiles[i] === AIR) { tiles[i] = y === yb ? NV_EMISSOR : NV_FEIXE; nvKeep.add(i); } if (!walls[i] || y > Lf.y0 + 2) walls[i] = WNV_NEON; }
    for (let y = Lf.y0; y <= yb; y++) for (const x of [Lf.x - 2, Lf.x + 2]) { const i = I(x, y); if (SOLID[tiles[i]] && NV_SOILS[tiles[i]] && !nvKeep.has(i) && (y - Lf.y0) % 5 === 2) tiles[i] = NV_PAINEL_NEON; }
  }

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x0e9a);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !nvKeep.has(i) && !inNvHall(W1(x), y, 4)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  // a escória também aparece no casco amassado, então o carvão segue ela pela camada toda
  vein(NV_O_CARVAO, 30 * WSC, 0, 186, 3, 8, t => t === NV_ESCORIA);
  vein(NV_O_XENITA, 13 * WSC, 98, 186, 2, 5, t => t === NV_LIGA || t === NV_ESCORIA || t === NV_REATOR);
  vein(NV_O_XENITA, 13 * WSC, 0, 98, 2, 5, t => t === NV_VIDRO_IMPACTO || t === NV_ESCORIA);
}

function nvAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = NV_S0, YB = Math.min(WH - 8, S0 + NV_D), R3 = mulberry32(seed ^ 0x4d3c1);
  const nvRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!nvRow(y)) return; const i = I(x, y); if (nvKeep.has(i) || inNvHall(W1(x), y, 4)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WNV_CASCO; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const nvSolid = t => SOLID[t] && NV_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const B = nvBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.r + 3 + m && Math.abs(y - B.cy) <= B.r + 3 + m;

  // ---------- 1. tudo alcançável das duas descidas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of nvEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!nvEntries.length && nvChambers.length) flood(I(nvChambers[0].cx, Math.round(nvChambers[0].cy)));
  if (B) for (let y = B.cy - B.r - 3; y <= B.cy + B.r + 3; y++) for (let x = B.cx - B.r - 3; x <= B.cx + B.r + 3; x++) reach[I(x, y)] = 1;
  for (let pass = 0; pass < 60 * WSC; pass++) {
    const lab = new Uint8Array(NN); let bestC = null;
    for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i] || SOLID[tiles[i]] || !walls[i]) continue;
      const comp = []; lab[i] = 1; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= S0 * WW && nb < YB * WW && !lab[nb] && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb] = 1; stack.push(nb); } }
      if (comp.length >= 16 && (!bestC || comp.length > bestC.length)) bestC = comp;
    }
    if (!bestC) break;
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
        const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inBox(W1(cx + dx), y, 2)) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    worm(best[0], best[1], best[2], best[3], 1.3, 0x46a0 + pass);
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {   // a minhoca bateu numa borda guardada: um corredor pela rocha, contornando o que fica
      const org = new Int32Array(NN).fill(-1), q = []; let hit = -1; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && hit < 0; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || nvKeep.has(nb) || nvKeep.has(nb - WW) || tiles[nb] === BEDROCK || inBox(nb % WW, (nb / WW) | 0, 2)) continue;
          org[nb] = c; if (reach[nb] && !SOLID[tiles[nb]]) { hit = nb; break; }
          q.push(nb);
        }
      }
      for (let c = hit; c >= 0 && org[c] !== c; c = org[c]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. escada de serviço (na nave) ou cabo (na cratera e nos destroços) em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBox(x, y, 3)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || NV_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (nvKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        const tt = naveBand(y) === 0 ? NV_CABO : NV_ESCADA;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = tt; used.add(i); }
      }
    }
  }
  // os poços de 3 dos dutos: a escada na coluna da esquerda, se ainda não tiver nada
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !SOLID[at(x + 3, y)]) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || NV_CLIMB(at(x, y - 1)) || NV_CLIMB(at(x + 1, y)) || inBox(x, y, 3)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (nvKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, NV_ESCADA);
  }

  // ---------- 3. os estragos: piso afundado em rampa de destroços (25% dos corredores), poças de gosma ----------
  for (const Q of nvCorr) {
    if (Q.boss || R3() > 0.25 || Q.len < 30) continue;
    const j0 = 6 + ((R3() * (Q.len - 16)) | 0), f = Q.step && j0 >= Q.step[0] ? Q.fy + Q.step[1] : Q.fy;
    for (let j = 0; j < 4; j++) { const x = Q.x0 + j0 + j, y = f - 1; if (at(x, y) === AIR && SOLID[at(x, f)] && !nvKeep.has(I(x, y)) && !NV_CLIMB(at(x - 1, y)) && !NV_CLIMB(at(x + 1, y))) put(x, y, j === 0 || j === 3 ? NV_DESTROCO : NV_CASCO); }
  }
  for (const C of [...nvLabs, ...nvCraters]) {
    if (R3() > 0.4) continue;
    const x0 = Math.floor(C.x0 !== undefined ? C.x0 : C.cx - C.w / 2), w = C.w;
    for (let x = x0 + 1; x < x0 + w - 1; x++) {
      let y = C.fy - 1; while (y > C.fy - 6 && at(x, y + 1) === AIR) y++;
      const i = I(x, y); if (tiles[i] !== AIR || nvKeep.has(i) || !nvSolid(at(x, y + 1)) || NV_CLIMB(at(x - 1, y)) || NV_CLIMB(at(x + 1, y))) continue;
      if (R3() < 0.3) put(x, y, NV_POCA);
    }
  }

  // ---------- 4. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || nvKeep.has(i)) continue;
    const b = naveBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inNvLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = nvSolid(dn) && BLOCKY[dn] && up === AIR && dn !== NV_GOSMA, ceil = nvSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (b >= 1 && gap <= 6 && gap >= 3 && SOLID[at(x, y + gap)] && nvSolid(at(x, y + gap)) && q < 0.006) { for (let j = 0; j < gap; j++) put(x, y + j, NV_ESCORA); continue; }   // a escora do casco, do teto ao chão
      // o neon: nos corredores, um tubo a cada 5 blocos (o teto de chapa reto); nas salas, mais raro
      if (b >= 1 && (up === NV_CASCO || up === NV_PAINEL_NEON || up === NV_LIGA || up === NV_REATOR) && x % (gap <= 5 ? 5 : 4) === 0 && gap >= 3) { if (q < (gap <= 5 ? 0.85 : 0.7)) { put(x, y, NV_NEON); continue; } }
      if (b === 0) { if (q < 0.03) put(x, y, NV_GOTA); else if (q < 0.04 && gap > 4) { for (let j = 0, n = 2 + ((R3() * 4) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, NV_CABO); } }
      else if (b === 1) { if (q < 0.02) put(x, y, NV_FIACAO); else if (q < 0.03 && gap > 4) { for (let j = 0, n = 2 + ((R3() * 3) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, NV_CABO); } }
      else if (b === 2) { if (q < 0.025) put(x, y, NV_GOTA); else if (q < 0.035) put(x, y, NV_FIACAO); }
      else { if (q < 0.02) put(x, y, NV_FIACAO); }
      continue;
    }
    // a estrelinha de neon na parede: ar dos dois lados, parede de casco ou de neon atrás
    if (!floor && b >= 1 && (walls[i] === WNV_NEON || walls[i] === WNV_CASCO) && q < 0.004 && at(x - 1, y) === AIR && at(x + 1, y) === AIR) { put(x, y, NV_ESTRELA); continue; }
    if (!floor || NV_CLIMB(at(x - 1, y)) || NV_CLIMB(at(x + 1, y))) continue;
    if (b === 0) { if (q < 0.016) put(x, y, NV_DESTROCO); else if (q < 0.024) put(x, y, NV_PLANTA); else if (q < 0.028) put(x, y, NV_CAPACETE); else if (q < 0.034 && dn === NV_VIDRO_IMPACTO) put(x, y, NV_POCA); }
    else if (b === 1) { if (q < 0.012) put(x, y, NV_DESTROCO); else if (q < 0.018) put(x, y, NV_HOLO); else if (q < 0.022) put(x, y, NV_CAPACETE); }
    else if (b === 2) { if (q < 0.018) put(x, y, NV_POTE); else if (q < 0.026) put(x, y, NV_PLANTA); else if (q < 0.032) put(x, y, NV_HOLO); }
    else { if (q < 0.02) put(x, y, NV_PLANTA); else if (q < 0.03) put(x, y, NV_HOLO); else if (q < 0.034) put(x, y, NV_DESTROCO); }
  }

  // ---------- 5. os objetos ----------
  nvPlaceProps();
}

/* ---------- as bocas das descidas por último; um destroço tapando o único caminho sai ---------- */
function nvExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of nvEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 3; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? NV_ESCADA : AIR; nvKeep.add(i); }
}
/* ---------- a subida garantida: do Planetário, dos laboratórios, das salas do reator e do pé dos rasgos o herói tem
   de conseguir voltar às descidas (pulo de 3 blocos; escada, cabo e feixe sobem) ---------- */
function nvClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = NV_S0, YB = Math.min(WH - 8, S0 + NV_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => NV_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y) || inNvHall(x, y)) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
    const win = k => { for (; k >= 0 && !good[k]; k = from[k]) good[k] = 1; return true; };
    let y = sy; while (y < YB - 1 && !S(sx, y + 1) && !L(sx, y)) y++; push(sx, y, 4);
    while (q.length) {
      if (hit >= 0) return win(hit);
      const r = q.pop(), yy = q.pop(), x = q.pop(); cur = ((yy - Y0) * WW + x) * 5 + r; if (yy <= S0 - 3) return win(cur);
      const gr = S(x, yy + 1) || L(x, yy);
      push(x - 1, yy, r === 4 && !gr ? 0 : r); push(x + 1, yy, r === 4 && !gr ? 0 : r);
      if (r > 0) push(x, yy - 1, L(x, yy) || L(x, yy - 1) ? 4 : r === 4 ? 3 : r - 1);
      if (!S(x, yy + 1)) push(x, yy + 1, L(x, yy + 1) ? 4 : 0);
    }
    return hit >= 0 ? win(hit) : false;
  };
  const soft = t => t === NV_CASCO || t === NV_LIGA || t === NV_VIDRO_IMPACTO || t === NV_ESCORIA || t === NV_GRADE || t === NV_REATOR;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || nvKeep.has(I(x, y)) || inNvHall(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !nvKeep.has(I(x, t)) && !inNvHall(x, t, 4) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = NV_ESCADA; if (!walls[i]) walls[i] = WNV_CASCO; } }
    return true;
  };
  const starts = [];
  if (nvBoss) for (const D of nvBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const c of nvLabs) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of nvReatores) starts.push([Math.round(c.cx), c.fy ? c.fy - 1 : Math.round(c.cy)]);
  for (const X of nvExits) starts.push([X.x0 + 2, X.top - 1]);
  for (const S2 of nvSemPeso) starts.push([S2.x0 + 2, S2.fy - 1]);
  let fixes = 0, ns = 0;
  for (const [x, y] of starts) { if (SOLID[tiles[I(x, y)]]) continue; for (let k = 0; k < 12 && (ns++, !search(W1(x), y)); k++) { if (!repair()) break; fixes++; } }
  nvClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (242): por faixa, no chão, debaixo do teto e na parede. As flags do 242 decidem onde cada um
   pode ficar (hangar: só nos hangares; lab: só nos laboratórios e na galeria; reator: só nas salas do reator; cratera:
   só nas crateras). Nunca sobre poça, escada, cabo ou feixe; nunca no pouso nem no Planetário ---------- */
function nvPlaceProps() {
  if (typeof NV_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x8b3c7);
  const S0 = NV_S0, YB = Math.min(WH - 8, S0 + NV_D), used = new Uint8Array(WW * WH * 2), BF = typeof NV_BACK_FLOOR !== 'undefined' ? NV_BACK_FLOOR : {};
  const B = nvBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.r + 3 + m && Math.abs(y - B.cy) <= B.r + 3 + m;
  const inside = (L, x, y) => L.some(C => C.x0 !== undefined && C.top !== undefined ? wdx(x - C.x0) >= 0 && wdx(x - C.x0) < C.w && y >= C.top - 1 && y <= C.fy : Math.abs(wdx(x - C.cx)) <= C.w / 2 + 1 && Math.abs(y - C.cy) <= C.h / 2 + 1);
  const where = (def, x, y) => (!def.hangar || inside(nvHangars, x, y)) && (!def.lab || inside(nvLabs, x, y)) && (!def.reator || inside(nvReatores, x, y)) && (!def.cratera || inside(nvCraters, x, y));
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || nvKeep.has(i) || inBox(W1(x), y, 1) || inNvLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && NV_SOILS[t] && t !== NV_GOSMA; };
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = NV_BAND_NAMES[clamp(naveBand(y), 0, 3)], plan = NV_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inBox(W1(k), y, 2) || inNvLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = varOf(def, band), V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (!where(def, W1(px + (tw >> 1)), y)) continue;
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

// a ordem: a camada, o Planetário (246: nvDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc();
  if (!NAVE) return;
  try { nvBuild(); nvAfter(); if (typeof nvDress === 'function') nvDress(); nvExitClear(); nvClimbFix(); } catch (err) { console.error(err); }
}; }

/* ---------- a terceira camada atrás da nave: o céu holográfico na Cratera e nos rasgos, as costelas da nave no Casco
   e no Núcleo, os tanques gigantes nos Laboratórios ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!NAVE) return;
  const Y1 = Math.min(WH, NV_S0 + NV_D + 4);
  for (let y = NV_S0 - 4; y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - NV_S0) + (depthNz(x, y, 25, seed ^ 0x4e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x4e12);
    DEEPT[i] = d < 46 ? (n > 0.45 ? DP_NV_CEU : DP_NV_COSTELAS) : d < 98 ? (n > 0.62 ? DP_NV_CEU : DP_NV_COSTELAS) : d < 150 ? (n > 0.4 ? DP_NV_TANQUES : DP_NV_COSTELAS) : (n > 0.55 ? DP_NV_CEU : DP_NV_COSTELAS);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (NAVE && ty >= NV_S0 && ty < NV_S0 + NV_D) return NV_ZONE0 + clamp(naveBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6)
Object.assign(CATH_SPAWN, {
  [NV_ZONE0]: [[['visitante', 4], ['gosma', 3], ['astronauta', 2], ['olhudos', 3], ['foguete', 2]], 8],
  [NV_ZONE0 + 1]: [[['visitante', 3], ['atirador', 3], ['disco', 2], ['foguete', 2], ['hipnotico', 2], ['olho', 2]], 9],
  [NV_ZONE0 + 2]: [[['gosma', 2], ['olhudos', 3], ['cabecao', 2], ['hipnotico', 2], ['astronauta', 2], ['atirador', 2]], 9],
  [NV_ZONE0 + 3]: [[['disco', 3], ['olho', 3], ['cabecao', 2], ['atirador', 3], ['visitante', 2]], 10]
});
// tipos que ainda não existem saem da tabela (o 243 e o 244 registram os Visitantes)
for (let z = NV_ZONE0; z < NV_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const NV_NO_SPAWN = (tx, ty) => inNvLand(tx, ty, 3) || inNvHall(tx, ty, 4) || nvExits.some(X => Math.abs(wdx(tx - X.cx)) < 3 && ty >= X.top - 2) || nvLifts.some(L => Math.abs(wdx(tx - L.x)) < 2 && ty >= L.y0 && ty <= L.y1);
// níveis 21 e 22 (layerLvl no 52, a posição no 129); nada nasce no pouso, no Planetário, nos rasgos nem no feixe
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!NAVE || !e || e.boss || (D && D.boss) || e.nvMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - NV_S0;
  if (d >= 0 && d < NV_D) {
    if (zone >= NV_ZONE0 && zone <= NV_ZONE0 + 3 && NV_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.nvVoid = true; return e; }
    const lvl = layerLvl(layerLo('nave'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].nvVoid) enemies.splice(k, 1); });

/* ---------- partículas: bolhas de gosma subindo na Cratera e nos Laboratórios, faíscas no Casco, um pó cintilante
   colorido boiando no Núcleo ---------- */
HOOK.update.push(dt => {
  if (!NAVE || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = naveBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 3 ? 7 : 4)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (b === 0 || b === 2) parts.push({ x, y, vx: rnd(-2, 2), vy: rnd(-12, -5), g: -2, life: 2.5, max: 2.5, col: Math.random() < 0.7 ? '#7dff3a' : '#c8ff7a', size: 1 });
    else if (b === 1) parts.push({ x, y, vx: rnd(-3, 3), vy: rnd(-1, 2), g: 1, life: 3, max: 3, col: Math.random() < 0.5 ? '#36f0ff' : '#ff3ec8', size: 1 });
    else parts.push({ x, y, vx: rnd(-4, 4), vy: rnd(-4, 1), g: 0, life: 3, max: 3, col: NV_ARCO[(Math.random() * 6) | 0], size: 1 });
  }
});

/* ---------- a forja e o vilarejo: a xenita na fornalha (247 tem os itens), as lojas ---------- */
FURN.min_xenita = { bar: 'barra_xenita', n: 7, t: 10 };
Object.assign(MAT_VAL, { min_xenita: 52, barra_xenita: 380, gosma_verde: 10, chip_alien: 24, olho_vigia: 30, cristal_plasma: 110, oxigenio: 18 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'gosma_verde' || id === 'olho_vigia'; c.hint = c.hint.replace(/\.$/, '') + ', gosma verde e olhos de vigia.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_xenita', 'barra_xenita', 'chip_alien', 'oxigenio'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', xenita, chips e tanques de oxigênio.'; }
if (SHOPS.maga) { const m = SHOPS.maga, b = m.buys; if (typeof b === 'function') { m.buys = id => b(id) || id === 'gosma_verde' || id === 'olho_vigia' || id === 'cristal_plasma'; if (m.hint) m.hint = m.hint.replace(/\.$/, '') + ', gosma, olhos de vigia e cristal de plasma.'; } }
