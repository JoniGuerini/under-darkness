'use strict';

/* ================= a Escuridão: o mundo debaixo do Abismo =================
   buildCathedral() já faz as camadas de cima e o Abismo; aqui ganha mais um passo, esBuild() e esAfter(), que fazem o
   fundo do mundo debaixo dos Templos do Caos (docs/camadas/16-escuridao.md, seção 3):
     1. a rocha: rocha apagada na Borda (a pedra do caos de cima esfria por ruído), pedra-breu com veios de vidro negro
        no Breu, as raízes da noite (faixas de pé, de 6 a 14 de largura, com a casca em volta) nas Raízes, pedra primeva
        no Fundo
     2. as cavernas (esparsas na Borda, muito abertas no Breu, quase nenhuma nas Raízes, lisas no Fundo), depois as
        salas: os Postos dos Acendedores em ruína na Borda, os Grandes Vãos com poços sem fundo no Breu, os Nós dentro
        das raízes, os Altares Frios e os dois Selos no Fundo, e O Escuro Total, a sala do Nox (o 227 a usa), do outro
        lado do mundo em relação às descidas
     3. as duas descidas: um poço redondo sai do chão de dois templos do Abismo, a pedra perde a cor descendo, e uma
        corrente desce até o Posto de pouso (14 x 6) com o único braseiro eterno da camada
     4. veios: carvão na rocha apagada e na raiz, noctírio na pedra-breu e na primeva
     5. tudo alcançável dos Postos; corrente (raiz pendente nas Raízes) em todo desnível de 5 ou mais; a decoração; a
        Rota dos Acendedores (braseiros apagados a cada 25 a 35 blocos de caminho, de cada Posto até a sala do Nox, com
        um lume-fátuo no caminho de cada um: é com ele que o braseiro acende, 223); os objetos (222); a subida
        garantida (esClimbFix)
   Também aqui: a terceira camada, as zonas 45 a 48 (nomes no 229), o spawn (só no escuro, nunca perto de braseiro
   aceso), o nível, as mariposas em bando, as partículas, a fornalha e as lojas. */

let esChambers = [], esPits = [], esSlabs = [], esRoute = [];
const ES_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [ES_APAGADA, ES_BREU, ES_VIDRO, ES_RAIZ, ES_CASCA, ES_PRIMEVA, ES_LAVRADA, ES_TIJOLO, ES_O_CARVAO, ES_O_NOCTIRIO]) ES_SOILS[t] = 1;
const ES_HOST = new Uint8Array(NT);    // o que a camada pode sobrescrever (o enchimento debaixo do Abismo)
for (let t = 0; t < NT; t++) if (AB_SOILS[t] || t === STONE || t === DEEP) ES_HOST[t] = 1;
ES_HOST[BEDROCK] = 0;
const ES_CLIMB = t => t === ES_CORRENTE || t === ES_RAIZ_PEND || t === CHAIN || t === AB_ESCADA || t === AB_CORRENTE;
const esClimbT = y => escuroBand(y) === 2 ? ES_RAIZ_PEND : ES_CORRENTE;
const ES_WALL_OF = b => b === 0 ? WES_APAGADA : b === 1 ? WES_BREU : b === 2 ? WES_RAIZ : WES_PRIMEVA;

function esBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  ES_S0 = Math.min(WH - 12, AB_S0 + Math.min(AB_D, WH - 8 - AB_S0));
  const S0 = ES_S0, YB = Math.min(WH - 8, S0 + ES_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x7e5d), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / ES_D);
  const db = (x, y) => (y - S0) * ES_D / DB + (nz(x, y, 30, 0x7b2) - 0.5) * 10;
  const bandOf = d => d < ES_BANDS[1] ? 0 : d < ES_BANDS[2] ? 1 : d < ES_BANDS[3] ? 2 : 3;
  // the roots: tall stripes, stretched up and down (the noise read every 6 rows, eased between)
  const rootN = (x, y) => { const q = y / 6, a = Math.floor(q), f = q - a, u = f * f * (3 - 2 * f); return nz(x, a, 9, 0x7c1) * (1 - u) + nz(x, a + 1, 9, 0x7c1) * u; };
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  esChambers = []; esPits = []; esSlabs = []; esRoute = []; esArrivals = []; esLand = []; esSeals = []; esBoss = null; esKeep.clear();

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 8; y < S0; y++) {   // a pedra do caos dos Templos esfria nas últimas linhas
      const i = y * WW + x, k = (y - (S0 - 8)) / 8, h = nz(x, y, 12, 0x7b3);
      if (SOLID[tiles[i]] && AB_SOILS[tiles[i]] && tiles[i] !== AB_FERRO_NEGRO && tiles[i] !== AB_TIJOLO && h < k * 0.85) tiles[i] = ES_APAGADA;
      if (walls[i] && h < k * 0.6) walls[i] = WES_APAGADA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x;
      if (tiles[i] === BEDROCK || y >= WH - 3 || !ES_HOST[tiles[i]]) continue;
      const k = (y - S0) / 8, h = nz(x, y, 12, 0x7b4);
      if (k < 1 && h > 0.5 + k * 0.5) { tiles[i] = AB_CAOS; walls[i] = WAB_CAOS; continue; }   // lascas do caos nas primeiras linhas
      const d = db(x, y), b = bandOf(d), n1 = nz(x, y, 34, 0x7a1), n2 = nz(x, y, 18, 0x7a2);
      let t;
      if (y >= YB) t = ES_PRIMEVA;
      else if (b === 0) t = n1 > 0.72 ? ES_BREU : ES_APAGADA;
      else if (b === 1) t = n2 > 0.76 ? ES_VIDRO : ES_BREU;
      else if (b === 2) { const r = rootN(x, y); t = r > 0.6 ? ES_RAIZ : r > 0.54 ? ES_CASCA : ES_BREU; }
      else t = n2 > 0.8 ? ES_BREU : ES_PRIMEVA;
      tiles[i] = t; walls[i] = ES_WALL_OF(b);
    }
  }

  // ---------- 2. as cavernas, depois as salas ----------
  const cv = new Uint8Array(NN), tmp = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const P0 = [0.16, 0.31, 0.06, 0.12];
  for (let x = 0; x < WW; x++) for (let y = S0 + 2; y <= YB - 3; y++) {
    const reg = nz(x, y, 6, 0x7c2), d = db(x, y), b = bandOf(d);
    let p = P0[b] + (reg - 0.5) * 0.34 - (d < 5 ? 0.2 : 0);
    if (b === 2 && rootN(x, y) > 0.5) p = 0;   // nas Raízes o espaço fica entre as raízes
    cv[y * WW + x] = R() < p ? 1 : 0;
  }
  for (let it = 0; it < 5; it++) {
    for (let y = S0; y <= YB - 3; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (!canCarve(x, y)) { tmp[i] = 0; continue; }
      let s1 = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!cv[(y + dy) * WW + W1(x + dx)]) s1++;
      let solid = s1 >= 5;
      if (it < 2) { let s2 = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!cv[(y + dy) * WW + W1(x + dx)]) s2++; if (s2 <= 2) solid = true; }
      tmp[i] = solid ? 0 : 1;
    }
    for (let y = S0; y <= YB - 3; y++) for (let x = 0; x < WW; x++) cv[y * WW + x] = tmp[y * WW + x];
  }
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const blob = (cx, cy, w, h, s, flat = 1.7) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.25 + (nz(x, y, 50, s) - 0.5) * 0.35) dig(x, y);
    }
  };
  const busy = (cx, cy, w, h, m = 4) => esChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  // a square hall with a low vault (the ruins, the altars): floor row fy
  const hall = (cx, fy, w, h, band, kind) => {
    const x0 = Math.round(cx - w / 2), top = fy - h;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, arch = Math.round(2.2 * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 2)); if (y >= top + arch) dig(x, y); }
    for (let x = x0; x < x0 + w; x++) hard(x, fy);
    const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band, kind, x0: W1(x0), top, fy }; esChambers.push(H); return H;
  };

  // ---------- 2a. as duas descidas: do chão de dois templos do Abismo, longe um do outro e do Trono ----------
  const landY = S0 + mb(18);
  {
    const ab = abBoss, temples = abChambers.filter(c => c.kind === 'templo' && c.fy && (!ab || Math.abs(wdx(c.cx - ab.cx)) > ab.w / 2 + 30)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < temples.length && picks.length < 2; n++) { const c = temples[(n * 5 + ((R() * temples.length) | 0)) % temples.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 120)) picks.push(c); }
    for (const c of temples) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 50)) picks.push(c); }
    while (picks.length < 2) { const cx = (R() * WW) | 0; if (picks.every(p => Math.abs(wdx(p.cx - cx)) > 120)) picks.push({ cx, fy: S0 - 6 }); }   // no temple: a shaft from just above
    for (const c of picks) {
      const xs = W1(Math.round(c.cx) - 2), x0 = W1(xs - 6);
      // the landing post: 14 x 6 round the foot of the shaft, sealed, its floor at landY
      for (let y = landY - 7; y <= landY; y++) for (let x = x0 - 1; x <= x0 + 14; x++) seal[I(x, y)] = 1;
      for (let y = landY - 6; y < landY; y++) for (let x = x0; x < x0 + 14; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      // doors at both ends, 3 tall, and a short way out
      for (const s of [-1, 1]) { const dx = s < 0 ? x0 - 1 : x0 + 14; for (let y = landY - 3; y < landY; y++) { const i = I(dx, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; } }
      for (let y = c.fy; y < landY - 6; y++) for (let x = xs; x < xs + 4; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      const L = { x0, fy: landY, w: 14, h: 6, bx: W1(x0 + 2), bx2: W1(x0 + 11), xs };
      esLand.push(L);
      esArrivals.push({ x0: xs, fy: c.fy, land: L });
      esChambers.push({ cx: x0 + 7, cy: landY - 3, w: 16, h: 6, band: 0, kind: 'posto', fy: landY, x0, land: true });
    }
  }
  const awayFromArrivals = (cx, m) => esArrivals.every(E => Math.abs(wdx(E.x0 - cx)) > m);

  // ---------- 2b. O Escuro Total: 64 x 26, no fim do Fundo, do outro lado do mundo em relação às descidas ----------
  {
    const w = 64, h = 26, ax = esArrivals.length ? esArrivals.reduce((s, e) => s + wdx(e.x0 - esArrivals[0].x0), 0) / esArrivals.length + esArrivals[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = Math.min(YB - 4, S0 + mb(182)), top = fy - h, x0 = cx - (w >> 1);
    for (let y = top - 3; y <= fy + 2; y++) for (let x = x0 - 3; x <= x0 + w + 2; x++) seal[I(x, y)] = 1;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, dome = Math.round(5 * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 2.2)); if (y >= top + dome) { const i = I(x, y); cv[i] = 1; keep[i] = 1; } }
    esBoss = { x0: W1(x0), x1: W1(x0 + w - 1), cx, w, h, top, fy, pyres: [], doors: [] };
    esChambers.push({ cx, cy: fy - (h >> 1), w, h, band: 3, boss: true, nolink: true });
    // a door at floor level on each side, a short corridor out
    for (const s of [-1, 1]) {
      const dxs = s < 0 ? x0 - 1 : x0 + w;
      for (let k = 0; k < 3; k++) for (let y = fy - 4; y < fy; y++) { const i = I(dxs + s * k, y); cv[i] = 1; keep[i] = 1; }
      const xa = s < 0 ? x0 - 4 - 12 : x0 + w + 3, len = 13;
      for (let x = xa; x < xa + len; x++) { for (let y = fy - 4; y < fy; y++) dig(x, y); hard(x, fy); }
      esBoss.doors.push({ x: W1(dxs), fy, side: s });
      esChambers.push({ cx: xa + len / 2, cy: fy - 2, w: len, h: 4, band: 3, kind: 'porta', fy, x0: W1(xa), len });
    }
  }

  // ---------- 2c. os dois Selos do Fundo: discos de pedra lavrada num salão baixo, longe da sala e um do outro ----------
  for (let tries = 0; esSeals.length < 2 && tries < 400; tries++) {
    const cx = (R() * WW) | 0, fy = S0 + mb(170) + ((R() * mb(8)) | 0);
    if (Math.abs(wdx(cx - esBoss.cx)) < esBoss.w / 2 + 50 || esSeals.some(s => Math.abs(wdx(s.cx - cx)) < 150) || busy(cx, fy - 3, 14, 6, 6)) continue;
    const H = hall(cx, fy, 14, 6, 3, 'selo');
    esSeals.push({ cx: H.cx, fy, x0: H.x0 });
  }

  // ---------- 2d. as salas por faixa ----------
  // a Borda: os Postos dos Acendedores em ruína
  for (let k = 0, tries = 0; k < 6 * WSC && tries < 300 * WSC; tries++) {
    const w = 16 + ((R() * 9) | 0), h = 7 + ((R() * 3) | 0), cx = (R() * WW) | 0, fy = S0 + mb(12) + ((R() * mb(30)) | 0);
    if (fy - h < S0 + 3 || busy(cx, fy - h / 2, w, h, 5)) continue;
    hall(cx, fy, w, h, 0, 'ruina'); k++;
  }
  // o Breu: os Grandes Vãos, com o chão em ilhas e poços sem fundo
  for (let k = 0, tries = 0; k < 3 * WSC && tries < 200 * WSC; tries++) {
    const w = 60 + ((R() * 41) | 0), h = 20 + ((R() * 17) | 0), cx = (R() * WW) | 0, cy = S0 + mb(52) + h / 2 + R() * Math.max(0, mb(40) - h);
    if (busy(cx, cy, w, h, 6) || !awayFromArrivals(cx, w / 2 + 10)) continue;
    blob(cx, cy, w, h, 0x7d00 + k, 1.5);
    const C = { cx, cy, w, h, band: 1, kind: 'vao', pits: [] }; esChambers.push(C);
    const bot = Math.round(cy + h / 2) + 1, n = 2 + ((R() * 3) | 0);
    for (let p = 0; p < n; p++) {
      const pw = 3 + ((R() * 4) | 0), px = Math.round(cx + (p - (n - 1) / 2) * (w * 0.7 / n) + (R() - 0.5) * 6), deep = 20 + ((R() * 11) | 0), pbot = Math.min(YB - 5, bot + deep);
      for (let y = Math.round(cy); y <= pbot; y++) for (let x = px; x < px + pw; x++) dig(x, y);
      const P = { x0: W1(px), w: pw, top: bot, bot: pbot, vao: C, slab: R() < 0.55 };
      esPits.push(P); C.pits.push(P);
    }
    k++;
  }
  // as Raízes: os Nós, salas redondas dentro de um nó de raiz
  for (let k = 0, tries = 0; k < 5 * WSC && tries < 250 * WSC; tries++) {
    const w = 14 + ((R() * 7) | 0), h = 10 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = S0 + mb(104) + h / 2 + R() * Math.max(0, mb(42) - h);
    if (busy(cx, cy, w, h, 6)) continue;
    blob(cx, cy, w, h, 0x7e00 + k, 1.25);
    const fy = Math.round(cy + h / 2) - 1;
    for (let x = Math.round(cx - w / 2) + 2; x < Math.round(cx + w / 2) - 2; x++) hard(x, fy);   // um chão plano no meio
    esChambers.push({ cx, cy, w, h, band: 2, kind: 'no', fy }); k++;
  }
  // o Fundo: os Altares Frios
  for (let k = 0, tries = 0; k < 3 * WSC && tries < 200 * WSC; tries++) {
    const w = 20 + ((R() * 11) | 0), h = 8 + ((R() * 3) | 0), cx = (R() * WW) | 0, fy = S0 + mb(156) + ((R() * mb(20)) | 0);
    if (fy - h < S0 + ES_BANDS[3] - 2 || busy(cx, fy - h / 2, w, h, 6)) continue;
    hall(cx, fy, w, h, 3, 'altar'); k++;
  }

  // ---------- 2e. túneis: em volta do mundo em cada faixa (nas Raízes, as galerias entre as raízes) e alguns entre faixas ----------
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 1.1 + Math.sin(n * 0.12 + s) * 0.28;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.55;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const mouth = C => C.fy ? C.fy - 2 : C.kind === 'vao' ? C.cy : C.cy + C.h * 0.2;
  const ends = (C, right) => right ? C.cx + C.w / 2 - 1 : C.cx - C.w / 2 + 1;
  const RAD = [1.6, 2.0, 1.7, 1.6];
  for (let b = 0; b < 4; b++) {
    const L = esChambers.filter(c => c.band === b && !c.nolink).sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) { const A = L[k], B = L[(k + 1) % L.length]; if (A === B) continue; worm(ends(A, true), mouth(A), ends(B, false), mouth(B), RAD[b], 0x7700 + b * 50 + k); }
  }
  for (let b = 0; b < 3; b++) {
    const U = esChambers.filter(c => c.band === b && !c.nolink), D = esChambers.filter(c => c.band === b + 1 && !c.nolink);
    for (let k = 0; k < 4 * WSC && U.length && D.length; k++) {
      const A = U[(R() * U.length) | 0], B = D.reduce((m, c) => Math.abs(wdx(c.cx - A.cx)) < Math.abs(wdx(m.cx - A.cx)) ? c : m);
      worm(A.cx, mouth(A), B.cx, mouth(B), Math.max(RAD[b], RAD[b + 1]) + 0.2, 0x77f0 + b * 9 + k);
    }
  }
  // bolsinhas fechadas; ilhas soltas no ar
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
      while (st.length) { const c = st.pop(), cx = c % WW, cy = (c / WW) | 0, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) { if (nb < 0 || nb >= NN || cv[nb] || sl[nb]) continue; const ny = (nb / WW) | 0; if (!canCarve(nb % WW, ny)) { open = false; continue; } sl[nb] = 1; st.push(nb); } if (comp.length > 40) open = false; }
      if (open && comp.length < 24 && !comp.some(c => seal[c] || keep[c])) for (const c of comp) cv[c] = 1;
    }
  }
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;
  for (let i = (S0 - 40) * WW; i < S0 * WW; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- 3. o que as salas viram ----------
  const at = (x, y) => tiles[I(x, y)];
  const set = (x, y, t, w) => { const i = I(x, y); tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const shell = (x, y, t) => { const i = I(x, y); if (SOLID[tiles[i]] && ES_SOILS[tiles[i]] && !esKeep.has(i)) tiles[i] = t; };
  const near = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (!SOLID[at(x + dx, y + dy)]) return true; return false; };
  // os Postos em ruína e os Altares: pedra lavrada e tijolo em volta (quebrada nas ruínas), chão lavrado, parede lavrada
  for (const H of esChambers) {
    if (H.kind !== 'ruina' && H.kind !== 'altar' && H.kind !== 'selo') continue;
    const broken = H.kind === 'ruina';
    for (let y = H.top - 3; y <= H.fy + 2; y++) for (let x = H.x0 - 3; x <= H.x0 + H.w + 2; x++) {
      const i = I(x, y); if (!inEscuro(y) || esKeep.has(i)) continue;
      if (!SOLID[tiles[i]]) { if (y >= H.top - 1 && y < H.fy && walls[i] && !(broken && nz(x, y, 9, 0x7e5) < 0.3)) walls[i] = WES_LAVRADA; continue; }
      if (!ES_SOILS[tiles[i]] || !near(x, y, 2) || (broken && nz(x, y, 7, 0x7e6) < 0.34)) continue;
      tiles[i] = (y + (x >> 2)) % 5 === 0 || nz(x, y, 6, 0x7e7) > 0.62 ? ES_TIJOLO : ES_LAVRADA;
    }
    for (let x = H.x0; x < H.x0 + H.w; x++) if (SOLID[at(x, H.fy)]) set(x, H.fy, ES_LAVRADA);
    if (H.kind === 'altar') for (let x = H.x0 + 3; x < H.x0 + H.w - 2; x += 6) {   // as colunas dos Acendedores, do chão ao teto
      let y = H.fy - 1; while (y > H.top - 4 && at(x, y - 1) === AIR) y--;
      if (SOLID[at(x, y - 1)]) for (let yy = y; yy < H.fy; yy++) if (at(x, yy) === AIR) set(x, yy, ES_COLUNA);
    }
  }
  // os Nós: casca de noite em volta, parede de raiz
  for (const H of esChambers) {
    if (H.kind !== 'no') continue;
    for (let y = Math.round(H.cy - H.h / 2) - 2; y <= Math.round(H.cy + H.h / 2) + 2; y++) for (let x = Math.round(H.cx - H.w / 2) - 2; x <= Math.round(H.cx + H.w / 2) + 2; x++) {
      const i = I(x, y); if (!inEscuro(y)) continue;
      if (!SOLID[tiles[i]]) { if (walls[i]) walls[i] = WES_RAIZ; continue; }
      if (ES_SOILS[tiles[i]] && near(x, y, 1)) tiles[i] = ES_CASCA;
    }
  }
  // os Postos de pouso: lavrada e tijolo, chão lavrado, o braseiro eterno; tudo guardado
  for (const L of esLand) {
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      const door = (x === L.x0 - 1 || x === L.x0 + L.w) && y >= L.fy - 3 && y < L.fy;
      if (door) { tiles[i] = AIR; walls[i] = WES_LAVRADA; }
      else if (edge) { const shaft = y === L.fy - L.h - 1 && wdx(x - L.xs) >= 0 && wdx(x - L.xs) < 4; if (shaft) { tiles[i] = AIR; walls[i] = WES_APAGADA; } else tiles[i] = y === L.fy ? ES_LAVRADA : (x + y) % 3 ? ES_LAVRADA : ES_TIJOLO; }
      else { tiles[i] = AIR; walls[i] = WES_LAVRADA; }
      esKeep.add(i);
    }
    set(L.bx, L.fy - 1, ES_BRASEIRO); set(L.bx2, L.fy - 1, ES_SOL);
  }
  // as descidas: o poço de 4 sai do chão do templo; a pedra do caos na boca vira rocha apagada descendo; a corrente até o Posto
  for (const E of esArrivals) {
    const x0 = E.x0, y0 = E.fy, y1 = E.land.fy - E.land.h - 1;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x < x0 + 4; x++) { const i = I(x, y); tiles[i] = AIR; if (!walls[i] || y >= S0 - 4) walls[i] = y < S0 ? WAB_CAOS : WES_APAGADA; esKeep.add(i); }
      const k = (y - y0) / Math.max(1, y1 - y0);
      for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); tiles[i] = y === y0 ? AB_CAOS : hash2(x, y, seed ^ 0x7f1) < 1 - k * 1.2 ? AB_CAOS : ES_APAGADA; esKeep.add(i); }
    }
    for (let y = y0 - 2; y < E.land.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]]) tiles[i] = ES_CORRENTE; esKeep.add(i); }
    // a boca, nos Templos do Caos: dois braseiros acesos do Inferno ladeando o furo
    for (const x of [x0 - 3, x0 + 6]) if (at(x, y0 - 1) === AIR && SOLID[at(x, y0)]) set(x, y0 - 1, AB_BRASEIRO);
  }
  // os Grandes Vãos: o fundo dos poços (espinhos de vidro), uma corrente da borda ao fundo; a laje de penumbra sobre alguns
  for (const P of esPits) {
    for (let x = P.x0; x < P.x0 + P.w; x++) { set(x, P.bot + 1, ES_VIDRO); if (at(x, P.bot) === AIR) set(x, P.bot, ES_ESPINHO); }
    const cx = P.x0 + (hash2(P.x0, P.top, seed) < 0.5 ? 0 : P.w - 1);
    let top = P.top; while (top > P.top - 12 && at(cx, top - 1) === AIR) top--;
    for (let y = top; y < P.bot; y++) { const i = I(cx, y); if (tiles[i] === AIR) tiles[i] = ES_CORRENTE; esKeep.add(i); }
    // the pit's rim: the first solid row on each side at the vão's floor level
    if (P.slab && P.w <= 6) {
      // the vão's floor on each side of the pit: down from the middle of the cavern to the first solid tile
      const floorAt = x => { let y = Math.round(P.vao.cy); while (y < P.bot && at(x, y) === AIR) y++; return at(x, y) === AIR ? -1 : y; };
      const fl = floorAt(P.x0 - 1), fr = floorAt(P.x0 + P.w);
      let fy = fl > 0 && fr > 0 && Math.abs(fl - fr) <= 3 && Math.max(fl, fr) < P.bot - 6 ? Math.max(fl, fr) : -1;
      if (fy > 0) for (const x of [P.x0 - 1, P.x0 + P.w]) { for (let y = fy; y > fy - 4 && SOLID[at(x, y - 1)]; y--) set(x, y - 1, AIR); if (!SOLID[at(x, fy)]) set(x, fy, ES_BREU); }   // level the two lips
      if (fy > 0) {
        for (let x = P.x0; x < P.x0 + P.w; x++) { const i = I(x, fy); if (x === cx) continue; tiles[i] = ES_PENUMBRA; esKeep.add(i); }
        for (const x of [P.x0 - 2, P.x0 + P.w + 1]) if (at(x, fy - 1) === AIR && SOLID[at(x, fy)]) { set(x, fy - 1, ES_BRASEIRO_FRIO); esKeep.add(I(x, fy - 1)); esKeep.add(I(x, fy)); }
        esSlabs.push({ x0: P.x0, w: P.w, fy });
      }
    }
  }
  // O Escuro Total: casca de pedra primeva, saliências lavradas em três alturas, as seis piras apagadas, correntes
  {
    const B = esBoss, x0 = B.x0, w = B.w, fy = B.fy, dome = k => Math.round(5 * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 2.2));
    for (let y = B.top - 3; y <= fy + 2; y++) for (let xx = x0 - 3; xx <= x0 + w + 2; xx++) {
      const i = I(xx, y), k = xx - x0, inRoom = k >= 0 && k < w && y >= B.top + dome(k) && y < fy;
      const door = y >= fy - 4 && y < fy && B.doors.some(d => { const o = wdx(xx - d.x) * d.side; return o >= 0 && o <= 2; });
      if (inRoom || door) { tiles[i] = AIR; walls[i] = WES_PRIMEVA; } else tiles[i] = ES_PRIMEVA;
      esKeep.add(i);
    }
    for (let x = x0; x < x0 + w; x++) set(x, fy, ES_PRIMEVA);
    const ledge = (xa, len, row) => { for (let x = xa; x < xa + len; x++) { set(x, row, ES_LAVRADA); esKeep.add(I(x, row)); } };
    // the floor pyres at the two ends, the middle ledges against the walls (8 up), the high platforms near the middle (15 up)
    const P = B.pyres;
    P.push([W1(x0 + 3), fy - 1], [W1(x0 + w - 4), fy - 1]);
    ledge(x0, 6, fy - 8); ledge(x0 + w - 6, 6, fy - 8); P.push([W1(x0 + 2), fy - 9], [W1(x0 + w - 3), fy - 9]);
    ledge(B.cx - 13, 7, fy - 15); ledge(B.cx + 7, 7, fy - 15); P.push([W1(B.cx - 10), fy - 16], [W1(B.cx + 10), fy - 16]);
    for (const [px, py] of P) set(px, py, ES_PIRA_FRIA);
    // chains: from the floor up beside the wall ledges; from each high platform's outer edge down to the floor
    for (const cx of [x0 + 6, x0 + w - 7]) for (let y = fy - 9; y < fy; y++) set(cx, y, ES_CORRENTE);
    for (const cx of [B.cx - 14, B.cx + 14]) for (let y = fy - 16; y < fy; y++) set(cx, y, ES_CORRENTE);
    // the corridors out: primeval floor, a carved arch's worth of lavrada at the door
    for (const C of esChambers) if (C.kind === 'porta') for (let k = -1; k < C.len + 1; k++) { const x = C.x0 + k, i = I(x, C.fy); if (!esKeep.has(i)) tiles[i] = ES_PRIMEVA; for (let y = C.fy - 4; y < C.fy; y++) if (tiles[I(x, y)] === AIR) walls[I(x, y)] = WES_PRIMEVA; }
  }

  // ---------- 4. os veios ----------
  const R4 = mulberry32(seed ^ 0x0de7);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !esKeep.has(i)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(ES_O_CARVAO, 90 * WSC, 0, 186, 3, 8, t => t === ES_APAGADA || t === ES_RAIZ);
  vein(ES_O_NOCTIRIO, 60 * WSC, 46, 186, 2, 5, t => t === ES_BREU || t === ES_PRIMEVA);
  vein(ES_O_NOCTIRIO, 30 * WSC, 150, 186, 4, 8, t => t === ES_PRIMEVA || t === ES_BREU);
}

function esAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = ES_S0, YB = Math.min(WH - 8, S0 + ES_D), R3 = mulberry32(seed ^ 0x7d3c1);
  const esRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!esRow(y)) return; const i = I(x, y); if (esKeep.has(i) || inEsHall(W1(x), y, 2)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = ES_WALL_OF(clamp(escuroBand(y), 0, 3)); };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const esSolid = t => SOLID[t] && ES_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };

  // ---------- 1. tudo alcançável dos dois Postos ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const L of esLand) flood(I(L.x0 + 4, L.fy - 1));
  for (let pass = 0; pass < 60 * WSC; pass++) {
    const lab = new Uint8Array(NN); let bestC = null;
    for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (reach[i] || lab[i] || SOLID[tiles[i]] || !walls[i]) continue;
      const comp = []; lab[i] = 1; stack.push(i);
      while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= S0 * WW && nb < YB * WW && !lab[nb] && !reach[nb] && !SOLID[tiles[nb]]) { lab[nb] = 1; stack.push(nb); } }
      if (comp.length >= 20 && (!bestC || comp.length > bestC.length)) bestC = comp;
    }
    if (!bestC) break;
    let best = null, bd = 1e9;
    for (let k = 0; k < bestC.length; k += Math.max(1, (bestC.length / 40) | 0)) {
      const c = bestC[k], cx = c % WW, cy = (c / WW) | 0;
      for (let dy = -30; dy <= 30; dy++) for (let dx = -50; dx <= 50; dx++) {
        const y = cy + dy; if (y < S0 || y >= YB - 1) continue;
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inEsHall(W1(cx + dx), y, 2)) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) {   // nada alcançado por perto: uma busca pela rocha até a célula alcançada mais próxima
      const org = new Int32Array(NN).fill(-1), q = []; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && !best; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 - 40) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || tiles[nb] === BEDROCK) continue;
          if (reach[nb] && !SOLID[tiles[nb]]) { const o = org[c]; best = [o % WW, (o / WW) | 0, nb % WW, (nb / WW) | 0]; break; }
          org[nb] = org[c]; q.push(nb);
        }
      }
      if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    }
    worm(best[0], best[1], best[2], best[3], 1.6, 0x76a0 + pass);
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
  }

  // ---------- 2. uma corrente (raiz pendente nas Raízes) em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inEsHall(x, y, 3)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)] || at(lx, k) === ES_ESPINHO) continue;
        let close = false; for (let j = -2; j <= 2 && !close; j++) for (let yy = y; yy < k && !close; yy += 2) if (used.has(I(lx + j, yy)) || ES_CLIMB(at(lx + j, yy))) close = true;
        if (close) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (esKeep.has(i) || !walls[i]) clear = false; }
        if (!clear) continue;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = esClimbT(yy); used.add(i); }
      }
    }
  }

  // ---------- 3. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || esKeep.has(i)) continue;
    const b = escuroBand(y); if (b < 0 || b > 3 || inEsHall(x, y, 2)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = esSolid(dn) && BLOCKY[dn] && up === AIR, ceil = esSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      if ((b === 0 && q < 0.01) || (b === 3 && q < 0.006)) { for (let j = 0, n = 2 + ((R3() * 6) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR; j++) put(x, y + j, ES_CORRENTE); }
      else if (b === 2 && q < 0.06) { for (let j = 0, n = 2 + ((R3() * 6) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR; j++) put(x, y + j, ES_RAIZ_PEND); }
      continue;
    }
    if (floor) {
      if (b === 0) { if (q < 0.012) put(x, y, ES_OSSADA); else if (q < 0.016) put(x, y, ES_LUME); }
      else if (b === 1) { if (q < 0.03) { put(x, y, ES_ESTALAG); if (R3() < 0.4 && at(x, y - 1) === AIR && at(x, y - 2) === AIR) put(x, y - 1, ES_ESTALAG); } else if (q < 0.036) put(x, y, ES_ESPINHO); else if (q < 0.039) put(x, y, ES_LUME); }
      else if (b === 2) { if (q < 0.006) put(x, y, ES_OSSADA); else if (q < 0.01) put(x, y, ES_LUME); }
      else { if (q < 0.01) put(x, y, ES_SOL); else if (q < 0.018) put(x, y, ES_OSSADA); else if (q < 0.021) put(x, y, ES_LUME); }
      continue;
    }
    // the eyes in the dark: in the air beside a wall, in the Breu and the Raízes
    if ((b === 1 || b === 2) && q < 0.0035 && (esSolid(tiles[I(x - 1, y)]) || esSolid(tiles[I(x + 1, y)]))) put(x, y, ES_OLHOS);
  }
  // os Postos em ruína: um braseiro apagado no meio do chão de cada um
  for (const H of esChambers) {
    if (H.kind !== 'ruina' && H.kind !== 'no' && H.kind !== 'altar') continue;
    const fy = H.fy; if (!fy) continue;
    for (let k = 0; k < 6; k++) { const x = W1(Math.round(H.cx) + (k % 2 ? k : -k)); if ((at(x, fy - 1) === AIR || DECO[at(x, fy - 1)]) && esSolid(at(x, fy)) && BLOCKY[at(x, fy)]) { put(x, fy - 1, ES_BRASEIRO_FRIO); esKeep.add(I(x, fy - 1)); esKeep.add(I(x, fy)); break; } }
    // and a wisp floating somewhere in the room, to light it with
    for (let k = 4; k < 14; k++) { const x = W1(Math.round(H.cx) + (k % 2 ? k : -k)); if (at(x, fy - 1) === AIR && at(x, fy - 2) === AIR && esSolid(at(x, fy)) && !esKeep.has(I(x, fy - 1))) { put(x, fy - 1, ES_LUME); break; } }
  }

  // ---------- 4. a Rota dos Acendedores: de cada Posto até a porta da sala do Nox, um braseiro apagado a cada 25 a 35 blocos ----------
  if (esBoss) {
    const Y0 = S0 - 2, H = YB - Y0, par = new Int32Array(WW * H).fill(-1), q = new Int32Array(WW * H);
    const goalSet = new Set(); for (const d of esBoss.doors) for (let k = 2; k < 12; k++) for (let y = d.fy - 3; y < d.fy; y++) goalSet.add((y - Y0) * WW + W1(d.x + d.side * k));
    for (const L of esLand) {
      par.fill(-1); let qh = 0, qt = 0, hit = -1;
      const s0 = (L.fy - 1 - Y0) * WW + W1(L.x0 + 7); par[s0] = s0; q[qt++] = s0;
      while (qh < qt && hit < 0) {
        const c = q[qh++], x = c % WW, row = c - x, y = (c / WW) | 0;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < 0 || nb >= WW * H || par[nb] >= 0) continue;
          const t = tiles[(Y0 + ((nb / WW) | 0)) * WW + (nb % WW)]; if (SOLID[t]) continue;
          par[nb] = c; q[qt++] = nb; if (goalSet.has(nb)) { hit = nb; break; }
        }
      }
      if (hit < 0) continue;
      const path = []; for (let c = hit; c !== s0; c = par[c]) path.push(c); path.reverse();
      // the floor under a point of the path (within 10 rows), free and not kept: [x, y] or null
      const floorOf = c => { const x = c % WW; let y = Y0 + ((c / WW) | 0); for (let n = 0; n < 10 && y < YB - 2 && !SOLID[at(x, y + 1)]; n++) y++; const dn = at(x, y + 1); return at(x, y) === AIR && esSolid(dn) && BLOCKY[dn] && !esKeep.has(I(x, y)) && !inEsHall(x, y, 3) && esRow(y) ? [x, y] : null; };
      let next = 18 + ((R3() * 10) | 0), last = 0;
      for (let k = 0; k < path.length; k++) {
        if (k < next) continue;
        const f = floorOf(path[k]); if (!f) continue;
        const [x, y] = f;
        put(x, y, ES_BRASEIRO_FRIO); esKeep.add(I(x, y)); esKeep.add(I(x, y + 1)); esRoute.push([x, y]);
        // a wisp on the way to it, so the way can always be lit (the first one before the first brazier)
        for (let m = (last + k) >> 1, n = 0; n < 12 && m < k; m++, n++) { const w = floorOf(path[m]); if (w) { put(w[0], w[1], ES_LUME); break; } }
        last = k; next = k + 25 + ((R3() * 11) | 0);
      }
    }
  }

  // ---------- 5. as sementes do breu vivo: no escuro, longe da rota, dos Postos e da sala ----------
  for (let k = 0, tries = 0; k < 40 * WSC && tries < 4000 * WSC; tries++) {
    const x = (R3() * WW) | 0, y = S0 + 50 + ((R3() * (YB - S0 - 54)) | 0), i = I(x, y);
    if (at(x, y) !== AIR || !esSolid(at(x, y + 1)) || esKeep.has(i) || inEsHall(x, y, 6) || esRoute.some(([rx, ry]) => Math.abs(wdx(rx - x)) < 14 && Math.abs(ry - y) < 10)) continue;
    put(x, y, ES_BREU_VIVO); k++;
  }

  // ---------- 6. os objetos ----------
  esPlaceProps();
}

/* ---------- a subida garantida: da sala do Nox, dos Nós, dos Altares, dos Selos e do fundo dos poços o herói tem de
   conseguir voltar aos Postos (pulo de 3 blocos, correntes e raízes sobem) ---------- */
function esClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = ES_S0, YB = Math.min(WH - 8, S0 + ES_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => ES_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y) || inEsHall(x, y)) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
    const win = k => { for (; k >= 0 && !good[k]; k = from[k]) good[k] = 1; return true; };
    let y = sy; while (y < YB - 1 && !S(sx, y + 1)) y++; push(sx, y, 4);
    while (q.length) {
      if (hit >= 0) return win(hit);
      const r = q.pop(), yy = q.pop(), x = q.pop(); cur = ((yy - Y0) * WW + x) * 5 + r;
      if (esLand.some(Ld => wdx(x - Ld.x0) >= 0 && wdx(x - Ld.x0) < Ld.w && yy <= Ld.fy - 1 && yy >= Ld.fy - Ld.h)) return win(cur);
      const gr = S(x, yy + 1) || L(x, yy);
      push(x - 1, yy, r === 4 && !gr ? 0 : r); push(x + 1, yy, r === 4 && !gr ? 0 : r);
      if (r > 0) push(x, yy - 1, L(x, yy) || L(x, yy - 1) ? 4 : r === 4 ? 3 : r - 1);
      if (!S(x, yy + 1)) push(x, yy + 1, L(x, yy + 1) ? 4 : 0);
    }
    return hit >= 0 ? win(hit) : false;
  };
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || esKeep.has(I(x, y))) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]]) tiles[i] = esClimbT(y); }
    return true;
  };
  const starts = [];
  if (esBoss) for (const d of esBoss.doors) starts.push([d.x + d.side * 6, d.fy - 1]);
  for (const c of esChambers) if (c.kind === 'no' || c.kind === 'altar' || c.kind === 'selo' || c.kind === 'ruina') starts.push([Math.round(c.cx), c.fy ? c.fy - 1 : Math.round(c.cy)]);
  for (const P of esPits) starts.push([P.x0 + (P.w >> 1), P.bot - 1]);
  let fixes = 0;
  for (const [x, y] of starts) { for (let k = 0; k < 12 && !search(W1(x), y); k++) { if (!repair()) break; fixes++; } }
  return fixes;
}
// as bocas das descidas por último: o que a limpeza do Abismo ou a decoração deixou no furo sai, e a corrente sobe até o templo
function esExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of esArrivals) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? ES_CORRENTE : AIR; esKeep.add(i); }
}

/* ---------- os objetos (222): no chão, debaixo do teto e na parede, pela faixa; os do Posto e dos Selos primeiro ---------- */
function esPlaceProps() {
  if (typeof ES_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9b2c8);
  const S0 = ES_S0, YB = Math.min(WH - 8, S0 + ES_D), used = new Uint8Array(WW * WH * 2), BF = typeof ES_BACK_FLOOR !== 'undefined' ? ES_BACK_FLOOR : {};
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || (esKeep.has(i) && layer === 0)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && ES_SOILS[t]; };
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  // os dois Selos do Fundo: o disco no meio do chão do salão (protegido: não quebra)
  for (const Sd of esSeals) {
    const def = PROP_DEFS.es_selo; if (!def) break;
    const V = def.vars[0], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T), px = W1(Math.round(Sd.cx - tw / 2));
    mark(px, Sd.fy - th, tw, th, 0);
    const sup = []; for (let k = px; k < px + tw; k++) { sup.push(I(k, Sd.fy)); esKeep.add(I(k, Sd.fy)); }
    addProp(def, 0, px * T + ((tw * T - V.w) >> 1), Sd.fy * T - V.h, sup);
  }
  // o Mural dos Acendedores: um por faixa da Borda e do Fundo, na parede de um Posto em ruína ou de um Altar
  for (const kind of ['ruina', 'altar']) {
    const def = PROP_DEFS.es_mural; if (!def) break;
    const V = def.vars[0], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
    const L = esChambers.filter(c => c.kind === kind && c.w >= tw + 4);
    for (let n = 0; n < 6 && L.length; n++) {
      const H = L[(R() * L.length) | 0], px = W1(Math.round(H.cx - tw / 2)), y0 = H.fy - th;
      if (!fits(px, y0, tw, th, 1, false)) continue;
      mark(px, y0, tw, th, 1);
      const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, H.fy));
      addProp(def, 0, px * T + ((tw * T - V.w) >> 1), H.fy * T - V.h, sup);
      break;
    }
  }
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = ES_BAND_NAMES[clamp(escuroBand(y), 0, 3)], plan = ES_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inEsHall(W1(k), y, 2)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def || def.unico) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = varOf(def, band), V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (how === 'chao') {
              const y0 = y + 1 - th;
              if (!fits(px, y0, tw, th, 0, true)) continue;
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, th + 3, 0, true)) continue;
              mark(px, y, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y - 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), y * T, sup);
            } else {
              const onFloor = !!BF[id], y0 = onFloor ? y + 1 - th : y - th - ((R() * 2) | 0);
              if (!fits(px, y0, tw, th, 1, false)) continue;
              mark(px, y0, tw, th, 1); n--;
              const sup = []; if (onFloor) for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), onFloor ? (y + 1) * T - V.h : y0 * T + ((th * T - V.h) >> 1), sup);
            }
          }
        }
      }
    }
  }
}

// a ordem: a camada, a sala do chefe (227: esDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc();
  if (!ESCURO) return;
  try { esBuild(); esAfter(); if (typeof esDress === 'function') esDress(); esExitClear(); esClimbFix(); } catch (err) { console.error(err); }
}; }

/* ---------- a terceira camada atrás da Escuridão: torres na Borda e no Fundo, o Nada no Breu, as raízes subindo ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!ESCURO) return;
  for (let y = ES_S0 - 4; y < WH; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - ES_S0) + (depthNz(x, y, 25, seed ^ 0x7e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x7e12);
    DEEPT[i] = d < 46 ? (n > 0.55 ? DP_ES_TORRES : DP_ES_NADA) : d < 98 ? (n > 0.7 ? DP_ES_RAIZES : DP_ES_NADA) : d < 150 ? (n > 0.3 ? DP_ES_RAIZES : DP_ES_NADA) : (n > 0.6 ? DP_ES_TORRES : DP_ES_NADA);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (ESCURO && ty >= ES_S0 && ty < ES_S0 + ES_D) return ES_ZONE0 + clamp(escuroBand(ty), 0, 3); return _cz(tx, ty); }; }
Object.assign(CATH_SPAWN, {
  [ES_ZONE0]: [[['apagaluz', 0.25], ['traca', 0.25], ['acendedor', 0.2], ['ouvinte', 0.15], ['rastro', 0.15]], 8],
  [ES_ZONE0 + 1]: [[['bocabreu', 0.2], ['mortalha', 0.2], ['colosso', 0.15], ['semolhos', 0.15], ['maofundo', 0.15], ['apagaluz', 0.15]], 8],
  [ES_ZONE0 + 2]: [[['rastro', 0.22], ['acendedor', 0.2], ['ouvinte', 0.2], ['bocabreu', 0.2], ['mortalha', 0.18]], 9],
  [ES_ZONE0 + 3]: [[['colosso', 0.2], ['semolhos', 0.2], ['maofundo', 0.2], ['apagaluz', 0.2], ['traca', 0.2]], 8]
});
// nada nasce no Posto, na sala do Nox, num tile com luz, nem a menos de 12 blocos de um braseiro aceso
const ES_NO_SPAWN = (tx, ty) => esLand.some(L => wdx(tx - L.x0) >= -4 && wdx(tx - L.x0) < L.w + 4 && ty > L.fy - L.h - 4 && ty <= L.fy + 1) || inEsHall(tx, ty, 4) ||
  (typeof esLightAt === 'function' && esLightAt(tx, ty) >= 0.15) || (typeof esNearLit === 'function' && esNearLit(tx, ty, 12));
let esSwarming = false;
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!ESCURO || e.boss || D.boss || e.esMinion || (typeof noxSpawning !== 'undefined' && noxSpawning)) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - ES_S0;
  if (d >= 0 && d < ES_D) {
    if (zone >= ES_ZONE0 && zone <= ES_ZONE0 + 3 && ES_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.esVoid = true; return e; }
    const lvl = layerLvl(layerLo('escuro'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
    // as mariposas negras vêm em bandos de 5 a 8
    if (type === 'traca' && !esSwarming && zone >= ES_ZONE0 && zone <= ES_ZONE0 + 3) {
      esSwarming = true;
      try { const n = 4 + ((Math.random() * 4) | 0); for (let k = 0; k < n; k++) { const ox = rnd(-20, 20), oy = rnd(-14, 10); if (!rectSolid(px + ox, py + oy, e.w, e.h)) { const o = spawnEnemy('traca', px + ox, py + oy, zone); if (o && !o.dead) o.esBando = e; } } } finally { esSwarming = false; }
    }
  }
  return e;
}; }
// the mariposas of a swarm count as one for the spawn cap
{ const _ts = trySpawn; trySpawn = function () {
  if (!ESCURO || !pl) return _ts();
  const fol = enemies.filter(e => e.esBando); if (!fol.length) return _ts();
  for (const e of fol) enemies.splice(enemies.indexOf(e), 1);
  try { return _ts(); } finally { for (const e of fol) enemies.push(e); }
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].esVoid) enemies.splice(k, 1); });

/* ---------- as partículas: poeira preta descendo na Borda, nada no Breu (o vazio não tem partícula), pó de raiz caindo
   nas Raízes, faíscas brancas que somem no Fundo ---------- */
HOOK.update.push(dt => {
  if (!ESCURO || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = escuroBand(pty); if (b < 0 || b > 3 || b === 1) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (b === 0 && Math.random() < dt * 6) { const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH * 0.6; if (air(x, y)) parts.push({ x, y, vx: rnd(-2, 2), vy: rnd(3, 7), g: 0, life: 4, max: 4, col: Math.random() < 0.5 ? '#0c0a0c' : '#1a1618', size: 1 }); }
  if (b === 2 && Math.random() < dt * 3) {
    const tx = Math.floor((cam.x + Math.random() * VW) / T); let ty = Math.floor((cam.y + Math.random() * VH * 0.6) / T);
    for (let k = 0; k < 12 && !solidAt(tx, ty - 1); k++) ty--;
    if (solidAt(tx, ty - 1) && !solidAt(tx, ty) && wallAt(tx, ty)) parts.push({ x: tx * T + rnd(2, 10), y: ty * T, vx: rnd(-2, 2), vy: 6, g: 30, life: 2.4, max: 2.4, col: '#3e2b48', size: 1 });
  }
  if (b === 3 && Math.random() < dt * 2.5) { const x = cam.x + Math.random() * VW, y = cam.y + VH * (0.2 + Math.random() * 0.7); if (air(x, y)) parts.push({ x, y, vx: rnd(-3, 3), vy: rnd(-6, -2), g: 0, life: 0.8, max: 0.8, col: '#d8e2f4', size: 1, glow: true }); }
});

/* ---------- o Manto de Breu (228): no escuro, quem o veste desvia e aguenta mais ---------- */
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  const it = equip.body && ITEMS[equip.body.id];
  if (ESCURO && it && it.breu && !pl.dead && pl.invuln <= 0 && esLightAtPx(pl.x + pl.w / 2, pl.y + pl.h / 2) < 0.3) {
    if (Math.random() < it.breu) { floatText(pl.x + pl.w / 2, pl.y - 8, 'ESQUIVA', '#c8f4ff', 0.9); pl.invuln = 0.25; sfx.dodge(); return 'none'; }
    dmg = Math.max(1, Math.round(dmg * (1 - it.breu)));
  }
  return _hp(dmg, srcX, src, isProj);
}; }

/* ---------- a forja e o vilarejo: o noctírio na fornalha (228 tem os itens), as lojas ---------- */
FURN.min_noctirio = { bar: 'barra_noctirio', n: 10, t: 12 };
Object.assign(MAT_VAL, { min_noctirio: 60, barra_noctirio: 640, po_breu: 26, asa_mariposa: 16, nucleo_breu: 90, lume_fatuo: 34 });
{ const a = SHOPS.alquimista || SHOPS.maga; if (a && typeof a.buys === 'function') { const b = a.buys; a.buys = id => b(id) || id === 'po_breu'; if (a.hint) a.hint = a.hint.replace(/\.$/, '') + ' e pó de breu.'; } }
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || ['asa_mariposa', 'lume_fatuo'].includes(id); c.hint = c.hint.replace(/\.$/, '') + ', asas de mariposa negra e lume-fátuo.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_noctirio', 'barra_noctirio', 'nucleo_breu'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', noctírio e núcleos de breu.'; }
// as bases da camada caem raro; o sorteio de equipamento multiplica a chance por 0,1 (rollDrops), por isso os números
// aqui são 10 vezes maiores (1,5% e 2%)
const ES_BASE_DROPS = { rastro: [['lamina_vidronegro', 0.15]], apagaluz: [['lamina_vidronegro', 0.15]], mortalha: [['manto_breu', 0.15]], colosso: [['manto_breu', 0.15]], acendedor: [['escudo_acendedor', 0.2]] };
function esBaseDrops() { for (const k in ES_BASE_DROPS) { if (!DROPS[k]) continue; for (const [id, p] of ES_BASE_DROPS[k]) { if (!ITEMS[id]) continue; const o = DROPS[k].find(r => r[0] === id); if (o) o[1] = p; else DROPS[k].push([id, p]); } } }
esBaseDrops();
