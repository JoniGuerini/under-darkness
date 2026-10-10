'use strict';

/* ================= as Minas Fúngicas: o mundo debaixo da mina =================
   buildCathedral() já faz as cavernas, a catedral, o gelo e a mina (56, 57, 73, 74, 84, 85); aqui ganha mais um passo,
   fungBuild() e fungAfter(), que transformam tudo debaixo das Fornalhas Esquecidas nas Minas Fúngicas
   (docs/camadas/05-minas-fungicas.md, seção 3):
     1. a rocha por faixa (xisto úmido no alto, húmus e rocha tomada no Bosque, lodo e xisto nas Grutas, carne de
        micélio no Coração); a escória e o tijolo da mina rareiam nas primeiras linhas e o xisto sobe um pouco nelas
     2. cavernas naturais (autômato), depois as salas: galerias tortas da colônia e as casas de tijolo, a enfermaria
        lacrada atrás de bolsas de esporo, os salões dos chapéus com os cogumelos gigantes em escada, as grutas
        alagadas e os túneis meio alagados, as câmaras de carne ligadas por veias, a Gruta da Mãe (o 126 a veste) e
        as duas câmaras do fundo de onde o Abismo desce; túneis por faixa e entre faixas
     3. as duas descidas: poços lacrados no chão de duas fornalhas da mina (anel de tijolo, escada da colônia e cordão
        de micélio) até a câmara de pouso (12 x 6, piso de tábua, sem monstro nascendo)
     4. veios: carvão no xisto, esporita encostada na rocha tomada (mais grossa no Coração)
     5. tudo alcançável das duas descidas; escoras, vigas, fios e lampiões nas galerias; escada ou cordão em todo
        desnível de 5 ou mais; a decoração; os objetos (122); a subida garantida (fungClimbFix)
   A água das grutas é a do sistema comum (171): as bacias ficam em fungBasins e são cheias no fim da geração (o 128
   chama fungWater() depois do 87, que ainda pode abrir túneis).
   Também aqui: a terceira camada, as zonas (25 a 28; os nomes vão no 128, depois das do Abismo), o spawn, o nível
   dos monstros, os estados do herói (esporado, lento, colado), as botas de seiva e o gancho, os brilhos, as
   partículas, a fornalha e as lojas. */

let fungChambers = [], fungGalleries = [], fungBasins = [], fungLand = [], fungInfirmary = null;
const fungKeep = new Set();   // as descidas, as câmaras de pouso, a casca da enfermaria: túneis e decoração não mexem
const FG_SOILS = new Uint8Array(NT);   // o chão natural da camada: onde decoração e objetos podem ficar
for (const t of [FG_XISTO, FG_TOMADA, FG_HUMUS, FG_LODO, FG_TABUA, FG_VIGA, FG_TIJOLO, FG_CHAPEU, FG_CARNE, FG_O_CARVAO, FG_O_ESPORITA]) FG_SOILS[t] = 1;
const FG_HOST = new Uint8Array(NT);    // o que a camada pode sobrescrever (o enchimento da mina debaixo das Fornalhas)
for (let t = 0; t < NT; t++) if (MN_SOILS[t] || MN_HOST[t]) FG_HOST[t] = 1;
FG_HOST[BEDROCK] = 0;
const FG_CLIMB = t => t === FG_ESCADA || t === FG_CORDAO || t === MN_ESCADA || t === CHAIN;

function fungBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  FG_S0 = Math.min(WH - 12, MN_S0 + Math.min(MN_D, WH - 8 - MN_S0));
  const S0 = FG_S0, YB = Math.min(WH - 8, S0 + FG_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x5f1a), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / FG_D);
  const db = (x, y) => (y - S0) * FG_D / DB + (nz(x, y, 30, 0x5b1) - 0.5) * 10;
  const bandOf = d => d < FG_BANDS[1] ? 0 : d < FG_BANDS[2] ? 1 : d < FG_BANDS[3] ? 2 : 3;
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  fungChambers = []; fungGalleries = []; fungBasins = []; fungLand = []; fungExits = []; fungDown = []; fungBoss = null; fungInfirmary = null; fungKeep.clear();

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    // o xisto úmido sobe nas últimas linhas da mina
    for (let y = S0 - 8; y < S0; y++) {
      const i = y * WW + x, k = (y - (S0 - 8)) / 8, h = nz(x, y, 12, 0x5b2);
      if (SOLID[tiles[i]] && MN_SOILS[tiles[i]] && h < k * 0.85) tiles[i] = FG_XISTO;
      if (walls[i] && h < k * 0.6) walls[i] = WFG_XISTO;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x;
      if (tiles[i] === BEDROCK || y >= WH - 3 || !FG_HOST[tiles[i]]) continue;
      const k = (y - S0) / 8, h = nz(x, y, 12, 0x5b3);
      if (k < 1 && h > 0.35 + k * 0.6) { tiles[i] = h > 0.7 ? MN_ESCORIA : MN_FERROSA; walls[i] = WMN_FERROSA; continue; }   // a mina rareia
      const d = db(x, y), b = bandOf(d), n1 = nz(x, y, 34, 0x5a1), n2 = nz(x, y, 18, 0x5a2), n3 = nz(x, y, 50, 0x5a3);
      let t, w;
      if (y >= YB) { t = FG_XISTO; w = WFG_XISTO; }
      else if (b === 0) { t = n1 > 0.74 ? FG_TOMADA : FG_XISTO; w = t === FG_TOMADA ? WFG_MICELIO : WFG_XISTO; }
      else if (b === 1) { t = n2 > 0.62 ? FG_TOMADA : n3 > 0.82 ? FG_XISTO : FG_HUMUS; w = t === FG_HUMUS ? WFG_HUMUS : WFG_MICELIO; }
      else if (b === 2) { t = n1 > 0.62 ? FG_LODO : n2 > 0.76 ? FG_TOMADA : FG_XISTO; w = WFG_XISTO; }
      else { t = n2 > 0.66 ? FG_TOMADA : n3 > 0.84 ? FG_XISTO : FG_CARNE; w = t === FG_CARNE ? WFG_CARNE : WFG_MICELIO; }
      tiles[i] = t; walls[i] = w;
    }
  }

  // ---------- 2. cavernas naturais, depois a colônia e o fungo ----------
  const cv = new Uint8Array(NN), tmp = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const P0 = [0.19, 0.3, 0.26, 0.23];
  for (let x = 0; x < WW; x++) for (let y = S0 + 2; y <= YB - 3; y++) {
    const reg = nz(x, y, 6, 0x5c1), d = db(x, y);
    cv[y * WW + x] = R() < P0[bandOf(d)] + (reg - 0.5) * 0.34 - (d < 5 ? 0.2 : 0) ? 1 : 0;
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
  const fill = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (!keep[i]) cv[i] = 0; };
  const blob = (cx, cy, w, h, s, flat = 1.7) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.25 + (nz(x, y, 50, s) - 0.5) * 0.35) dig(x, y);
    }
  };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 1.2 + Math.sin(n * 0.13 + s) * 0.3;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.55;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const busy = (cx, cy, w, h, m = 4) => fungChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  // uma sala reta de chão plano: `fy` é a fileira do chão, o ar fica de fy - h a fy - 1, teto em arco baixo
  const room = (x0, fy, w, h, vault = 1.5) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, arch = Math.round(vault * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 3)); if (y >= fy - h + arch) dig(x, y); } for (let x = x0; x < x0 + w; x++) fill(x, fy); };
  // uma galeria da colônia: 4 de ar sobre o chão, que sobe e desce 1 bloco a cada 8 colunas (o fungo empurrou as escoras)
  const gallery = (xa, len, fy, band) => {
    const ph = (R() * 32) | 0, floor = [];
    for (let k = 0; k < len; k++) {
      const x = xa + k, f = fy + [0, 1, 0, -1][((k + ph) >> 3) & 3], end = k < 2 || k > len - 3; floor.push(f);
      for (let y = f - (end ? 3 : 4); y < f; y++) dig(x, y); fill(x, f);
    }
    const G = { x0: W1(xa), len, fy, floor, band }; fungGalleries.push(G);
    fungChambers.push({ cx: xa + len / 2, cy: fy - 2, w: len, h: 4, band, kind: 'galeria', g: G });
    return G;
  };

  // as duas descidas primeiro: do chão de duas fornalhas da mina, longe uma da outra e longe da Oficina da Escavadeira
  const mb0 = mnBoss, furn = mnChambers.filter(c => c.kind === 'fornalha' && !c.boss && c.fy && (!mb0 || Math.abs(wdx(c.cx - mb0.cx)) > mb0.w / 2 + 24)).sort((a, b) => a.cx - b.cx);
  const picks = [];
  for (let n = 0; n < furn.length && picks.length < 2; n++) { const c = furn[(n * 5 + ((R() * furn.length) | 0)) % furn.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
  for (const c of furn) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
  const landY = S0 + mb(12);
  for (const c of picks) {
    const x0 = W1(Math.round(c.cx) - 2);
    fungExits.push({ x0, fy: c.fy, top: c.fy - 2 });
    // a câmara de pouso, 12 x 6, e uma galeria saindo dela para um dos lados
    const lx = x0 - 4; room(lx, landY, 12, 6, 0.6);
    fungLand.push({ x0: W1(lx), fy: landY, w: 12, h: 6 });
    fungChambers.push({ cx: lx + 6, cy: landY - 3, w: 12, h: 6, band: 0, kind: 'pouso' });
    const side = R() < 0.5 ? -1 : 1, len = 30 + ((R() * 20) | 0);
    gallery(side < 0 ? lx - len + 1 : lx + 11, len, landY, 0);
  }
  // a Gruta da Mãe: no Coração, do outro lado do mundo em relação às descidas (o 126 veste)
  {
    const w = 64, h = 28, ax = fungExits.length ? fungExits.reduce((s, e) => s + wdx(e.x0 - fungExits[0].x0), 0) / fungExits.length + fungExits[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = Math.min(YB - 4, S0 + mb(183)), x0 = cx - (w >> 1), top = fy - h;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, arch = Math.round(6 * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 2.4)); if (y >= top + arch) dig(x, y); }
    for (let x = x0; x < x0 + w; x++) fill(x, fy);
    fungBoss = { x0: W1(x0), x1: W1(x0 + w - 1), w, h, top, fy, cx };
    fungChambers.push({ cx, cy: fy - (h >> 1), w, h, band: 3, boss: true });
  }
  // as duas câmaras do fundo (o Abismo desce do chão delas): no Coração, longe uma da outra e longe da chefe
  for (let k = 0, tries = 0; fungDown.length < 2 && tries < 400; tries++) {
    const w = 16, h = 7, cx = (R() * WW) | 0, fy = S0 + mb(170) + ((R() * mb(8)) | 0);
    if (Math.abs(wdx(cx - fungBoss.cx)) < fungBoss.w / 2 + 40 || fungDown.some(c => Math.abs(wdx(c.cx - cx)) < (tries < 300 ? 120 : 50)) || busy(cx, fy - 3, w, h, 6)) continue;
    room(cx - (w >> 1), fy, w, h, 1);
    const C = { cx, cy: fy - 3, w, h, band: 3, kind: 'raiz', fy, x0: W1(cx - (w >> 1)) };
    fungDown.push(C); fungChambers.push(C); k++;
  }
  // as galerias da colônia: níveis em metros, quantas por nível
  const LEV = [[10, 3, 30, 60], [20, 3, 30, 60], [30, 3, 30, 60], [40, 2, 30, 50]];
  for (const [m, n, la, lb] of LEV) for (let k = 0, tries = 0; k < n * WSC && tries < 40 * WSC; tries++) {
    const len = la + ((R() * (lb - la)) | 0), xa = (R() * WW) | 0, fy = S0 + mb(m) + (((R() * 3) | 0) - 1);
    if (busy(xa + len / 2, fy - 2, len, 5, 3)) continue;
    gallery(xa, len, fy, 0); k++;
  }
  // a enfermaria lacrada: 20 x 8, casca de tijolo, uma parede de bolsas de esporo na porta; uma galeria chega até ela
  for (let tries = 0; !fungInfirmary && tries < 200; tries++) {
    const w = 20, h = 8, cx = (R() * WW) | 0, fy = S0 + mb(22 + R() * 18);
    if (busy(cx, fy - 4, w + 20, h, 6) || fungExits.some(e => Math.abs(wdx(e.x0 - cx)) < 60)) continue;
    const x0 = cx - (w >> 1), dir = R() < 0.5 ? -1 : 1;
    for (let y = fy - h - 1; y <= fy; y++) for (let x = x0 - 1; x <= x0 + w; x++) seal[I(x, y)] = 1;   // a casca: nenhum túnel fura
    for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    fungInfirmary = { x0: W1(x0), w, h, fy, top: fy - h, door: dir < 0 ? W1(x0 - 1) : W1(x0 + w) };
    fungChambers.push({ cx, cy: fy - h / 2, w, h, band: 0, kind: 'enfermaria', inf: fungInfirmary });
    gallery(dir < 0 ? x0 - 1 - 26 : x0 + w + 1, 26, fy, 0);
  }
  // as casas da colônia: na ponta de uma galeria, o chão emendando no dela
  for (let k = 0, tries = 0; k < 6 * WSC && tries < 60 * WSC; tries++) {
    const G = fungGalleries[(R() * fungGalleries.length) | 0]; if (!G || G.house) continue;
    const w = 12 + ((R() * 7) | 0), h = 6 + ((R() * 3) | 0), right = R() < 0.5, fy = right ? G.floor[G.len - 1] : G.floor[0];
    const x0 = right ? G.x0 + G.len : G.x0 - w;
    if (fungChambers.some(c => c.g !== G && Math.abs(wdx(c.cx - (x0 + w / 2))) < (c.w + w) / 2 + 2 && Math.abs(c.cy - (fy - h / 2)) < (c.h + h) / 2 + 2)) continue;
    room(x0, fy, w, h, 0);
    G.house = true;
    fungChambers.push({ cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 0, kind: 'casa', x0: W1(x0), top: fy - h, fy });
    k++;
  }
  // os salões dos chapéus, as grutas alagadas, os túneis meio alagados e as câmaras de carne
  const PLAN = [[3, 40, 70, 18, 30, 50, 96, 'salao', 1], [5, 24, 40, 10, 14, 102, 146, 'gruta', 2], [4, 20, 40, 4, 4, 104, 146, 'tunel', 2], [6, 14, 22, 14, 22, 152, 180, 'carne', 3]];
  for (const [n0, wa, wb, ha, hb, d0, d1, kind, band] of PLAN) {
    const n = n0 * WSC;
    for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
      const w = wa + ((R() * (wb - wa + 1)) | 0), h = kind === 'carne' ? Math.min(w, mb(hb)) : Math.min(mb(hb), ha + ((R() * (hb - ha + 1)) | 0));
      const cx = (R() * WW) | 0, cy = S0 + mb(d0) + h / 2 + R() * Math.max(0, mb(d1 - d0) - h);
      if (busy(cx, cy, w, h)) continue;
      if (kind === 'tunel') {   // o chão afunda 2 no meio: ali fica a água, sempre com 2 de ar em cima
        const x0 = Math.round(cx - w / 2), fy = Math.round(cy + h / 2), a = Math.round(w * 0.2), b = w - a;
        for (let kk = 0; kk < w; kk++) { const deep = kk >= a && kk < b, f = fy + (deep ? 2 : 0); for (let y = fy - 4; y < f; y++) dig(x0 + kk, y); fill(x0 + kk, f); }
        const C = { cx, cy: fy - 2, w, h: 4, band, kind, x0: W1(x0), fy };
        fungChambers.push(C); fungBasins.push({ x: x0 + (w >> 1), y: fy + 1, nivel: fy, tipo: AGUA_LIMPA, max: w * 3 + 10, box: [x0 + a, x0 + b - 1, fy, fy + 1] });
      } else {
        blob(cx, cy, w, h, 0x5900 + band * 40 + k, kind === 'salao' ? 1.25 : kind === 'gruta' ? 2.4 : 1.0);
        fungChambers.push({ cx, cy, w, h, band, kind });
      }
      k++;
    }
  }
  // túneis: em volta do mundo em cada faixa (no Coração são as veias, largas) e alguns descendo entre faixas
  const RAD = [1.5, 2.0, 1.8, 2.3];
  const mouth = C => C.boss ? fungBoss.fy - 2 : C.g ? C.g.fy - 2 : C.fy ? C.fy - 2 : C.cy + C.h * 0.2;
  const ends = (C, right) => C.boss ? (right ? C.cx + C.w / 2 : C.cx - C.w / 2) : C.g ? (right ? C.cx + C.w / 2 - 1 : C.cx - C.w / 2 + 1) : C.cx;
  for (let b = 0; b < 4; b++) {
    const L = fungChambers.filter(c => c.band === b && c.kind !== 'enfermaria').sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const A = L[k], B = L[(k + 1) % L.length]; if (A === B) continue;
      worm(ends(A, true), mouth(A), ends(B, false), mouth(B), RAD[b], 0x5700 + b * 50 + k);
    }
  }
  for (let b = 0; b < 3; b++) {
    const U = fungChambers.filter(c => c.band === b && !c.boss && c.kind !== 'enfermaria'), D = fungChambers.filter(c => c.band === b + 1 && !c.boss);
    for (let k = 0; k < 4 * WSC && U.length && D.length; k++) {
      const A = U[(R() * U.length) | 0], B = D.reduce((m, c) => Math.abs(wdx(c.cx - A.cx)) < Math.abs(wdx(m.cx - A.cx)) ? c : m);
      worm(A.cx, mouth(A), B.cx, mouth(B), Math.max(RAD[b], RAD[b + 1]) + 0.2, 0x57f0 + b * 9 + k);
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
      if (open && comp.length < 24 && !comp.some(c => seal[c])) for (const c of comp) cv[c] = 1;
    }
  }
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;
  // as galerias guardam o chão onde uma caverna passou por baixo: uma tábua (uma ponte) sobre o vão
  for (const G of fungGalleries) for (let k = 0; k < G.len; k++) { const i = I(G.x0 + k, G.floor[k]); if (!SOLID[tiles[i]]) tiles[i] = FG_TABUA; }
  for (const L of fungLand) for (let k = 0; k < L.w; k++) { const i = I(L.x0 + k, L.fy); tiles[i] = FG_TABUA; fungKeep.add(i); for (let y = L.fy - L.h; y < L.fy; y++) fungKeep.add(I(L.x0 + k, y)); }

  // ---------- 3. as descidas: o anel de tijolo no chão da fornalha, o poço forrado de micélio, escada e cordão ----------
  for (const E of fungExits) {
    const x0 = E.x0, y0 = E.fy, y1 = landY - 6;   // o poço desemboca no teto da câmara de pouso
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x0 + 4; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = y < S0 ? WMN_TIJOLO : WFG_MICELIO; }
      for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); if (y <= y0 + 1) tiles[i] = MN_TIJOLO; else if (!SOLID[tiles[i]] || y >= S0) tiles[i] = y < S0 ? MN_FERROSA : FG_TOMADA; fungKeep.add(i); }
    }
    for (const x of [x0 - 2, x0 + 5]) { const i = I(x, y0); if (SOLID[tiles[i]]) tiles[i] = MN_TIJOLO; }   // o anel em volta da boca
    for (let y = y0 - 2; y <= landY - 1; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = FG_ESCADA; fungKeep.add(i); } }
    for (let y = y0 + 1; y <= landY - 1; y++) { const i = I(x0 + 3, y); if (!SOLID[tiles[i]]) { tiles[i] = FG_CORDAO; fungKeep.add(i); } }
    for (let y = y0 - 3; y < landY; y++) for (let x = x0; x < x0 + 4; x++) fungKeep.add(I(x, y));
    // o que a mina pôs em cima da boca (um objeto apoiado no chão da fornalha) sai
    for (let n = PROPS.length - 1; n >= 0; n--) { const p = PROPS[n]; if (p.Y + p.h > (y0 - 6) * T && p.Y < (y0 + 1) * T && p.X < (x0 + 6) * T && p.X + p.w > (x0 - 2) * T) fungDropProp(p); }
  }

  // ---------- 4. os veios ----------
  const R4 = mulberry32(seed ^ 0x0de5);
  const nearMyc = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = tiles[I(x + dx, y + dy)]; if (t === FG_TOMADA || t === FG_CARNE) return true; } return false; };
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i], x, y) && y < YB - 1 && !fungKeep.has(i)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(FG_O_CARVAO, 80 * WSC, 0, 150, 3, 8, t => t === FG_XISTO);   // carvão em toda camada (102)
  vein(FG_O_ESPORITA, 80 * WSC, 0, 150, 2, 5, (t, x, y) => t === FG_TOMADA || (t === FG_XISTO && nearMyc(x, y)));   // a esporita segue o fungo
  vein(FG_O_ESPORITA, 40 * WSC, 150, 186, 4, 8, (t, x, y) => t === FG_TOMADA || (t === FG_CARNE && nearMyc(x, y)) || t === FG_XISTO);   // mais grossa no Coração
}
// tira um objeto já posto (a boca de uma descida abriu debaixo dele)
function fungDropProp(p) {
  const n = PROPS.indexOf(p); if (n >= 0) PROPS.splice(n, 1);
  for (const a of propBuckets.values()) { const k = a.indexOf(p); if (k >= 0) a.splice(k, 1); }
  for (const i of p.sup) { const a = propBySup.get(i); if (a) { const k = a.indexOf(p); if (k >= 0) a.splice(k, 1); } }
}

function fungAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = FG_S0, YB = Math.min(WH - 8, S0 + FG_D), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s), R3 = mulberry32(seed ^ 0x5d3c1);
  const fgRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!fgRow(y)) return; const i = I(x, y); if (fungKeep.has(i)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WFG_XISTO; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const fgSolid = t => SOLID[t] && FG_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const inBoss = (x, y, m = 1) => fungBoss && Math.abs(wdx(x - fungBoss.cx)) < fungBoss.w / 2 + m && y >= fungBoss.top - 1 - m && y <= fungBoss.fy;
  const inInf = (x, y, m = 0) => { const F = fungInfirmary; return F && wdx(x - F.x0) >= -1 - m && wdx(x - F.x0) <= F.w + m && y >= F.top - 1 - m && y <= F.fy + m; };
  const inRect = (C, x, y, m) => Math.abs(wdx(x - C.cx)) < C.w / 2 + m && Math.abs(y - C.cy) < C.h / 2 + m;

  // ---------- 0. a enfermaria: casca de tijolo, chão de tijolo, a parede de bolsas na porta ----------
  if (fungInfirmary) {
    const F = fungInfirmary;
    for (let y = F.top - 1; y <= F.fy; y++) for (let x = F.x0 - 1; x <= F.x0 + F.w; x++) {
      const i = I(x, y), edge = y === F.top - 1 || y === F.fy || x === F.x0 - 1 || x === F.x0 + F.w;
      if (edge) { tiles[i] = W1(x) === F.door && y >= F.fy - 3 && y < F.fy ? FG_BOLSA : FG_TIJOLO; fungKeep.add(i); }
      else { tiles[i] = AIR; walls[i] = WFG_TABUADO; }
    }
    for (let y = F.fy - 3; y < F.fy; y++) fungKeep.add(I(F.door, y));
  }

  // ---------- 0b. as grutas alagadas: fundo de lodo, ilhas, a bacia tapada, a passarela (antes do alcance, que refaz o que a tampa cortar) ----------
  for (const H of fungChambers) {
    if (H.kind !== 'gruta') continue;
    const lim = Math.min(YB - 3, Math.round(H.cy + H.h / 2) + 1), colBot = x => { let y = Math.round(H.cy); if (SOLID[at(x, y)]) return -1; while (y < lim && !SOLID[at(x, y + 1)]) y++; return SOLID[at(x, y + 1)] ? y : -1; };
    let cx = Math.round(H.cx), bot = colBot(cx);
    for (let k = 1; bot < 0 && k < H.w / 3; k++) for (const x of [Math.round(H.cx) - k, Math.round(H.cx) + k]) if (bot < 0 && (bot = colBot(x)) >= 0) cx = x;
    if (bot < 0) continue;
    for (let y = Math.round(H.cy - H.h / 2) - 1; y <= bot + 2; y++) for (let x = Math.round(H.cx - H.w / 2) - 2; x <= Math.round(H.cx + H.w / 2) + 2; x++) {
      const i = I(x, y); if (fungKeep.has(i)) continue;
      if (fgSolid(tiles[i]) && !SOLID[at(x, y - 1)] && y > H.cy - 1) tiles[i] = FG_LODO;
    }
    const depth = 3 + ((R3() * 4) | 0), nivel = bot - depth + 1;
    for (let j = 0, nI = (R3() * 3) | 0; j < nI; j++) {   // ilhas de lodo no fundo
      const ix = cx + Math.round((R3() - 0.5) * H.w * 0.6), iw = 2 + ((R3() * 3) | 0);
      for (let dx = 0; dx < iw; dx++) { let y = Math.round(H.cy); while (y < YB - 2 && !SOLID[at(ix + dx, y + 1)]) y++; for (let k = 0; k < depth - (dx === 0 || dx === iw - 1 ? 1 : 0) && at(ix + dx, y - k) === AIR; k++) put(ix + dx, y - k, FG_LODO); }
    }
    // o ponto de onde enche: a coluna mais funda perto do meio (as ilhas podem ter tapado o meio)
    let sx = cx, sy = -1;
    for (let k = 0; sy < 0 && k < H.w / 2; k++) for (const x of [cx - k, cx + k]) { if (sy >= 0 || SOLID[at(x, nivel)]) continue; let y = nivel; while (y < lim + 1 && !SOLID[at(x, y + 1)]) y++; if (SOLID[at(x, y + 1)]) { sx = x; sy = y; } }
    if (sy < 0) continue;
    H.basin = { box: [Math.round(H.cx - H.w / 2) - 3, Math.round(H.cx + H.w / 2) + 3, nivel, lim + 2], x: sx, y: sy, nivel, tipo: H.cy > S0 + FG_BANDS[2] + 30 || R3() < 0.3 ? AGUA_PLANCTON : AGUA_LIMPA, max: H.w * (depth + 2) * 2 };
    fungBasins.push(H.basin);
    fungPlug(H.basin);
    // a passarela: uma fileira de tábua logo acima da água, de parede a parede, com uma falha a cada tanto
    const py = nivel - 1;
    if (R3() < 0.75) for (let x = cx - Math.round(H.w / 2) - 2, n = 0; x <= cx + Math.round(H.w / 2) + 2; x++, n++) {
      if (at(x, py) !== AIR || fungKeep.has(I(x, py))) continue;
      if (n % 13 >= 11) continue;
      put(x, py, FG_TABUA);
    }
  }
  for (const B of fungBasins) if (B.box && !B.plugged) fungPlug(B);

  // ---------- 1. tudo alcançável das duas descidas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  if (fungInfirmary) { const F = fungInfirmary; for (let y = F.top; y < F.fy; y++) for (let k = 0; k < F.w; k++) reach[I(F.x0 + k, y)] = 1; }   // lacrada de propósito
  for (const E of fungExits) flood(I(E.x0 + 2, E.fy - 1));
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
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inInf(cx + dx, y, 1)) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) {
      const org = new Int32Array(NN).fill(-1), q = []; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && !best; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 - 40) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || fungKeep.has(nb)) continue;
          if (reach[nb] && !SOLID[tiles[nb]]) { const o = org[c]; best = [o % WW, (o / WW) | 0, nb % WW, (nb / WW) | 0]; break; }
          org[nb] = org[c]; q.push(nb);
        }
      }
      if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    }
    worm(best[0], best[1], best[2], best[3], 1.6, 0x56a0 + pass);
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {   // a minhoca bateu numa borda guardada: um corredor pela rocha, contornando o que fica
      const org = new Int32Array(NN).fill(-1), q = []; let hit = -1; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && hit < 0; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || fungKeep.has(nb) || fungKeep.has(nb - WW) || tiles[nb] === BEDROCK) continue;
          org[nb] = c; if (reach[nb] && !SOLID[tiles[nb]]) { hit = nb; break; }
          q.push(nb);
        }
      }
      for (let c = hit; c >= 0 && org[c] !== c; c = org[c]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. as casas: casca e chão de tijolo, portas dos dois lados; manchas de rocha tomada rompendo o tijolo ----------
  for (const H of fungChambers) {
    if (H.kind !== 'casa') continue;
    for (let y = H.top - 1; y <= H.fy; y++) for (let x = H.x0 - 1; x <= H.x0 + H.w; x++) {
      const i = I(x, y); if (fungKeep.has(i) || inBoss(x, y)) continue;
      const edge = y === H.top - 1 || y === H.fy || x === H.x0 - 1 || x === H.x0 + H.w, door = (x === H.x0 - 1 || x === H.x0 + H.w) && y >= H.fy - 3 && y < H.fy;
      if (door) { tiles[i] = AIR; walls[i] = WFG_TABUADO; continue; }
      if (edge) { if (SOLID[tiles[i]]) tiles[i] = nz(x, y, 6, 0x5e4) > 0.72 ? FG_TOMADA : FG_TIJOLO; continue; }
      if (!SOLID[tiles[i]]) walls[i] = WFG_TABUADO;
    }
  }

  // ---------- 3. as galerias: paredes de tábua, escoras tomadas sob uma viga, fios, lampiões; trechos desabados ----------
  for (const G of fungGalleries) {
    const lamps = R3() < 0.55, phase = (R3() * 9) | 0, fall = R3() < 0.18 ? 8 + ((R3() * (G.len - 16)) | 0) : -99;
    for (let k = 1; k < G.len - 1; k++) {
      const x = G.x0 + k, fy = G.floor[k];
      let open = true; for (let y = fy - 4; y < fy; y++) if (SOLID[at(x, y)]) open = false;
      if (!open || !SOLID[at(x, fy)] || inBoss(x, fy)) continue;
      for (let y = fy - 4; y < fy; y++) { const i = I(x, y); if (walls[i] && !fungKeep.has(i)) walls[i] = (k + phase) % 9 < 6 ? WFG_TABUADO : WFG_MICELIO; }
      if (k >= fall && k < fall + 4) {   // desabou: entulho de xisto no chão, uma escora caída
        const hgt = k === fall || k === fall + 3 ? 1 : 2;
        for (let y = fy - hgt; y < fy; y++) if (!fungKeep.has(I(x, y))) put(x, y, FG_XISTO);
        continue;
      }
      if (!SOLID[at(x, fy - 5)] && !fungKeep.has(I(x, fy - 5))) put(x, fy - 5, FG_VIGA);   // o teto cedeu para uma caverna: uma viga atravessa
      const post = (k + phase) % 9 === 4 && SOLID[at(x, fy - 5)] && fgSolid(at(x, fy)) && at(x, fy - 1) === AIR && at(x, fy - 2) === AIR && at(x, fy - 3) === AIR && at(x, fy - 4) === AIR;
      if (post) {
        for (let y = fy - 4; y < fy; y++) put(x, y, FG_ESCORA);
        for (let dx = -1; dx <= 1; dx++) { const i = I(x + dx, fy - 5); if (FG_SOILS[tiles[i]] && !fungKeep.has(i)) tiles[i] = FG_VIGA; }
        continue;
      }
      if (lamps && (k + phase) % 18 === 11 && at(x, fy - 1) === AIR) put(x, fy - 1, FG_LAMPIAO);
      else if ((k + phase) % 5 === 2 && SOLID[at(x, fy - 5)] && at(x, fy - 4) === AIR && R3() < 0.5) put(x, fy - 4, FG_FIOS);
    }
  }

  // ---------- 4. os salões dos chapéus: cogumelos gigantes em escada, no máximo 3 de altura um do outro ----------
  for (const H of fungChambers) {
    if (H.kind !== 'salao') continue;
    const n = 3 + ((R3() * 4) | 0), span = H.w * 0.8, step = span / n;
    let prev = 3 + ((R3() * 2) | 0), up = 1;
    for (let k = 0; k < n; k++) {
      const tx = Math.round(H.cx - span / 2 + step * (k + 0.5) + (R3() - 0.5) * step * 0.3);
      let fy = Math.round(H.cy - H.h * 0.2); if (SOLID[at(tx, fy)]) continue;
      while (fy < YB - 2 && !SOLID[at(tx, fy)]) fy++;   // o chão debaixo do tronco (só o chão do salão: num poço, nada)
      if (fy > H.cy + H.h / 2 + 2) continue;
      let flat = true; for (let dx = -2; dx <= 2; dx++) if (!SOLID[at(tx + dx, fy)] || SOLID[at(tx + dx, fy - 1)]) flat = false;
      if (!flat) continue;
      let ceil = fy - 1; while (ceil > S0 + 1 && !SOLID[at(tx, ceil)]) ceil--;
      const room = fy - ceil - 1; if (room < 8) continue;
      let hgt = k === 0 ? prev : prev + up * (2 + ((R3() * 2) | 0));
      if (hgt > room - 5 || hgt > 14) { up = -1; hgt = Math.max(3, prev - 1 - ((R3() * 2) | 0)); }
      if (hgt < 3) { up = 1; hgt = 3 + ((R3() * 2) | 0); }
      prev = hgt;
      const tw = 2 + ((R3() * 2) | 0), cw = 7 + ((R3() * 9) | 0), cy = fy - hgt;   // a fileira de cima do chapéu, onde se pisa
      for (let dx = -(cw >> 1); dx < cw - (cw >> 1); dx++) {
        const x = tx + dx, edge = dx === -(cw >> 1) || dx === cw - (cw >> 1) - 1;
        if (!edge && at(x, cy) === AIR) put(x, cy, FG_CHAPEU);
        if (at(x, cy + 1) === AIR) put(x, cy + 1, FG_CHAPEU);
      }
      for (let y = cy + 2; y < fy; y++) for (let dx = 0; dx < tw; dx++) { const x = tx - (tw >> 1) + dx; if (at(x, y) === AIR || DECO[at(x, y)]) put(x, y, FG_TRONCO); }
    }
  }

  // as câmaras de carne: bolsas de esporo na parede
  for (const H of fungChambers) {
    if (H.kind !== 'carne') continue;
    for (let y = Math.round(H.cy - H.h / 2) - 2; y <= Math.round(H.cy + H.h / 2) + 2; y++) for (let x = Math.round(H.cx - H.w / 2) - 2; x <= Math.round(H.cx + H.w / 2) + 2; x++) {
      const i = I(x, y), t = tiles[i]; if (fungKeep.has(i) || inBoss(x, y, 3) || (t !== FG_CARNE && t !== FG_TOMADA)) continue;
      const side = (!SOLID[at(x - 1, y)] || !SOLID[at(x + 1, y)]) && SOLID[at(x, y - 1)] && SOLID[at(x, y + 1)];
      if (side && R3() < 0.14) tiles[i] = FG_BOLSA;
    }
  }
  // as câmaras do fundo: chão de carne firme, a mancha de rocha tomada onde a raiz-mestra fura
  for (const C of fungDown) for (let x = C.x0 - 1; x <= C.x0 + C.w; x++) { const i = I(x, C.fy); if (!fungKeep.has(i)) tiles[i] = Math.abs(wdx(x - C.cx)) < 4 ? FG_TOMADA : FG_CARNE; }
  // a água agora (a decoração da beira precisa dela); o 128 enche de novo no fim, depois do 87
  fungWater();

  // ---------- 6. uma escada (Galerias) ou um cordão (o resto) em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inBoss(x, y, 3) || inInf(x, y, 1)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || FG_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (fungKeep.has(i) || !walls[i]) clear = false; }
        if (!clear) continue;
        const lt = fungoBand(y) === 0 ? FG_ESCADA : FG_CORDAO;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = lt; used.add(i); }
      }
    }
  }

  // ---------- 7. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || fungKeep.has(i)) continue;
    const b = fungoBand(y); if (b < 0 || b > 3 || inBoss(x, y, 2) || inInf(x, y)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3(), wet = agua.length && agua[i];
    const floor = fgSolid(dn) && BLOCKY[dn] && up === AIR, ceil = fgSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil && !wet) {
      if ((b === 1 || b === 3) && q < 0.012 && at(x, y + 1) === AIR) { for (let j = 0, n = 3 + ((R3() * 6) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR && !aguaAt(x, y + j + 1); j++) put(x, y + j, FG_CORDAO); continue; }
      if (b === 0) { if (q < 0.03) put(x, y, FG_FIOS); else if (q < 0.042) put(x, y, FG_GOTEJO); }
      else if (b === 1) { if (q < 0.035) put(x, y, FG_ESPOROS); else if (q < 0.065) put(x, y, FG_FIOS); }
      else if (b === 2) { if (q < 0.04) put(x, y, FG_GOTEJO); else if (q < 0.06) put(x, y, FG_FIOS); }
      else { if (q < 0.045) put(x, y, FG_ESPOROS); else if (q < 0.085) put(x, y, FG_FIOS); }
      continue;
    }
    if (!floor) continue;
    const shore = !wet && (aguaAt(x - 1, y) || aguaAt(x + 1, y) || aguaAt(x - 1, y + 1) || aguaAt(x + 1, y + 1));
    if (b === 0) { if (q < 0.03) put(x, y, FG_SEIXOS); else if (q < 0.045) put(x, y, FG_TUFO); else if (q < 0.055) put(x, y, FG_OSSADA); else if (q < 0.06 && !wet) put(x, y, FG_LANTERNA); }
    else if (b === 1) { if (q < 0.07) put(x, y, FG_TUFO); else if (q < 0.1 && !wet) put(x, y, FG_LANTERNA); else if (q < 0.11) put(x, y, FG_SEIXOS); }
    else if (b === 2) { if ((shore || wet) && dn === FG_LODO && q < 0.3) put(x, y, FG_JUNCO); else if (q < 0.03) put(x, y, FG_SEIXOS); else if (q < 0.045 && !wet) put(x, y, FG_LANTERNA); }
    else { if (q < 0.035) put(x, y, FG_TUFO); else if (q < 0.05) put(x, y, FG_OSSADA); else if (q < 0.058 && !wet) put(x, y, FG_LANTERNA); }
  }

  // ---------- 8. os objetos ----------
  fungPlaceProps();
}

/* ---------- a água: enche as bacias; se uma vazou (um túnel abriu a borda), tenta um nível mais baixo ---------- */
function fungWater() {
  if (!agua.length) return;
  const W1 = x => ((x % WW) + WW) % WW;
  for (const B of fungBasins) {
    if (B.cells) for (const c of B.cells) if (agua[c] === B.tipo) agua[c] = AGUA_SECO;
    B.cells = null;
    for (let nv = B.nivel; nv <= B.y; nv++) {
      const n = aguaBasin(B.x, B.y, nv, B.tipo, B.max);
      if (n > 0) { const cells = []; const st = [B.y * WW + W1(B.x)]; const seen = new Set(st); while (st.length) { const c = st.pop(); if (agua[c] !== B.tipo) continue; cells.push(c); const x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (!seen.has(nb) && nb >= 0 && nb < WW * WH) { seen.add(nb); st.push(nb); } } B.cells = cells; break; }
    }
  }
  // tocha, cogumelo-lanterna, lampião e cacho de esporos não ficam debaixo da água
  for (const B of fungBasins) if (B.cells) for (const c of B.cells) { const t = tiles[c]; if (t === TORCH || t === FG_LAMPIAO || t === FG_LANTERNA || t === FG_ESPOROS) tiles[c] = AIR; }
}

// tapa a bacia: o que vaza da caixa dela abaixo do nível vira lodo, e a borda fica guardada (os túneis cortados o
// alcance refaz por outro lado)
function fungPlug(B) {
  const W1 = x => ((x % WW) + WW) % WW, [x0, x1, y0, y1] = B.box, inBox = (x, y) => wdx(x - x0) >= 0 && wdx(x - x0) <= wdx(x1 - x0) && y >= y0 && y <= y1;
  B.plugged = true;
  const s0 = B.y * WW + W1(B.x); if (SOLID[tiles[s0]]) return;
  const seen = new Set([s0]), st = [s0];
  while (st.length) {
    const c = st.pop(), x = c % WW, row = c - x;
    for (const nb of [row + W1(x - 1), row + W1(x + 1), c + WW, c - WW]) {
      if (seen.has(nb)) continue;
      const nx = nb % WW, ny = (nb / WW) | 0; if (ny < y0) continue;
      seen.add(nb);
      if (SOLID[tiles[nb]]) { fungKeep.add(nb); continue; }   // a borda fica: túnel nenhum fura depois
      if (inBox(nx, ny)) st.push(nb);
      else if (!fungKeep.has(nb)) { tiles[nb] = FG_LODO; if (!walls[nb]) walls[nb] = WFG_XISTO; fungKeep.add(nb); }
    }
  }
}
/* ---------- as bocas das descidas por último: o que a limpeza da mina tapou de novo sai, e a escada sobe até a fornalha ---------- */
function fungExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of fungExits) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? FG_ESCADA : AIR; fungKeep.add(i); }
  // uma viga, tábua, tijolo ou cogumelo posto sobre um vão pode ser o único caminho entre duas partes da camada: sai de novo
  const reach = new Uint8Array(WW * WH), st = [];
  const flood = s0 => { if (reach[s0] || SOLID[tiles[s0]]) return; reach[s0] = 1; st.push(s0); while (st.length) { const c = st.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < WW * WH && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; st.push(nb); } } };
  for (const E of fungExits) flood(I(E.x0 + 2, E.fy - 1));
  if (fungInfirmary) { const F = fungInfirmary; for (let y = F.top; y < F.fy; y++) for (let k = 0; k < F.w; k++) reach[I(F.x0 + k, y)] = 1; }
  const Y1 = Math.min(WH - 8, FG_S0 + FG_D);
  for (let sweep = 0, changed = true; changed && sweep < 50; sweep++) {
    changed = false;
    for (let i = FG_S0 * WW; i < Y1 * WW; i++) {
      const t = tiles[i]; if ((t !== FG_VIGA && t !== FG_TABUA && t !== FG_TIJOLO && t !== FG_TRONCO && t !== FG_CHAPEU) || fungKeep.has(i)) continue;
      const x = i % WW, row = i - x, nb = [i - WW, i + WW, row + W1(x - 1), row + W1(x + 1)];
      if (nb.some(j => reach[j]) && nb.some(j => !reach[j] && !SOLID[tiles[j]])) { tiles[i] = AIR; flood(i); changed = true; }
    }
  }
}
/* ---------- a subida garantida: da gruta da chefe, das câmaras do fundo, de cada salão e câmara de carne, o herói tem de
   conseguir voltar às descidas (pulo de 3 blocos, escadas e cordões sobem). Igual ao mnClimbFix. ---------- */
function fungClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = FG_S0, YB = Math.min(WH - 8, S0 + FG_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => FG_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y)) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1) || aguaAt(x, y)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
    const win = k => { for (; k >= 0 && !good[k]; k = from[k]) good[k] = 1; return true; };
    let y = sy; while (y < YB - 1 && !S(sx, y + 1)) y++; push(sx, y, 4);
    while (q.length) {
      if (hit >= 0) return win(hit);
      const r = q.pop(), yy = q.pop(), x = q.pop(); cur = ((yy - Y0) * WW + x) * 5 + r; if (yy <= S0 - 3) return win(cur);
      const gr = S(x, yy + 1) || L(x, yy) || aguaAt(x, yy);
      push(x - 1, yy, r === 4 && !gr ? 0 : r); push(x + 1, yy, r === 4 && !gr ? 0 : r);
      if (r > 0) push(x, yy - 1, L(x, yy) || L(x, yy - 1) || aguaAt(x, yy - 1) ? 4 : r === 4 ? 3 : r - 1);
      if (!S(x, yy + 1)) push(x, yy + 1, L(x, yy + 1) ? 4 : 0);
    }
    return hit >= 0 ? win(hit) : false;
  };
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || fungKeep.has(I(x, y))) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if ((tt === FG_TABUA || tt === FG_CHAPEU) && !fungKeep.has(I(x, t)) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best, lt = fungoBand(bot) === 0 ? FG_ESCADA : FG_CORDAO;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || tiles[i] === FG_TABUA || tiles[i] === FG_CHAPEU) tiles[i] = lt; }
    return true;
  };
  const starts = [];
  if (fungBoss) starts.push([fungBoss.cx - 20, fungBoss.fy - 3]);
  for (const c of fungChambers) if (c.kind === 'salao' || c.kind === 'raiz') starts.push([Math.round(c.cx), Math.round(c.cy)]);
  let fixes = 0;
  for (const [x, y] of starts) { for (let k = 0; k < 12 && !search(W1(x), y); k++) { if (!repair()) break; fixes++; } }
  return fixes;
}

/* ---------- os objetos (122): no chão, debaixo do teto e na parede, pela faixa ---------- */
function fungPlaceProps() {
  if (typeof FG_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9b2c6);
  const S0 = FG_S0, YB = Math.min(WH - 8, S0 + FG_D), used = new Uint8Array(WW * WH * 2), BF = typeof FG_BACK_FLOOR !== 'undefined' ? FG_BACK_FLOOR : {};
  const wet = i => agua.length && agua[i];
  const fits = (x0, y0, tw, th, layer, needAir, dry) => {
    if (x0 < 1 || x0 + tw >= WW - 1 || y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = y * WW + x, t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || fungKeep.has(i) || (dry && wet(i))) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[(y * WW + x) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && FG_SOILS[t]; };
  const inBoss = (x, y) => fungBoss && Math.abs(wdx(x - fungBoss.cx)) < fungBoss.w / 2 + 2 && y >= fungBoss.top - 2 && y <= fungBoss.fy + 1;
  const F = fungInfirmary, inInf = (x, y) => F && wdx(x - F.x0) >= -1 && wdx(x - F.x0) <= F.w && y >= F.top - 1 && y <= F.fy;
  // a enfermaria primeiro: macas, um colono sentado, um casulo
  if (F) {
    const list = ['fg_maca', 'fg_maca', 'fg_colono', 'fg_maca', 'fg_casulo'].map(id => PROP_DEFS[id]).filter(Boolean);
    for (let x = F.x0 + 1, n = 0; x < F.x0 + F.w - 2 && list.length; n++) {
      const def = list[n % list.length], v = (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
      if (x + tw > F.x0 + F.w - 1) break;
      const y0 = F.fy - th, sup = []; for (let k = x; k < x + tw; k++) sup.push(I(k, F.fy));
      if (fits(x, y0, tw, th, 0, true)) { mark(x, y0, tw, th, 0); addProp(def, v, x * T + ((tw * T - V.w) >> 1), F.fy * T - V.h, sup); }
      x += tw + 1 + ((R() * 2) | 0);
    }
  }
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = FG_BAND_NAMES[clamp(fungoBand(y), 0, 3)], plan = FG_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inBoss(k, y) || inInf(k, y)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (how === 'chao') {
              const y0 = y + 1 - th;
              if (!fits(px, y0, tw, th, 0, true, !def.beira)) continue;
              if (def.beira) { let w = false; for (let k = px - 2; k < px + tw + 2; k++) if (aguaAt(k, y) || aguaAt(k, y + 1)) w = true; if (!w) continue; }   // o barco fica na beira da água
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, px * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
            } else if (how === 'teto') {
              if (!fits(px, y, tw, th + 3, 0, true, true)) continue;
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

// a ordem: a camada, a chefe (126: fungDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc();
  if (!FUNGO) return;
  try { fungBuild(); fungAfter(); if (typeof fungDress === 'function') fungDress(); fungExitClear(); fungClimbFix(); } catch (err) { console.error(err); }
}; }

/* ---------- a terceira camada atrás das Minas Fúngicas ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!FUNGO) return;
  const Y1 = Math.min(WH, FG_S0 + FG_D + 4);
  for (let y = FG_S0 - 4; y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - FG_S0) + (depthNz(x, y, 25, seed ^ 0x5e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x5e12);
    DEEPT[i] = d < 46 ? (n > 0.6 ? DP_FG_COLONIA : DP_FG_ROCHA) : d < 98 ? (n > 0.4 ? DP_FG_CHAPEUS : DP_FG_ROCHA) : d < 150 ? (n > 0.72 ? DP_FG_CHAPEUS : DP_FG_ROCHA) : (n > 0.66 ? DP_FG_COLONIA : DP_FG_ROCHA);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (FUNGO && ty >= FG_S0 && ty < FG_S0 + FG_D) return FG_ZONE0 + clamp(fungoBand(ty), 0, 3); return _cz(tx, ty); }; }
// a água-viva nasce por conta própria, na água (abaixo); os brotos contam como 1 (o grupo) no máximo
Object.assign(CATH_SPAWN, {
  [FG_ZONE0]: [[['colono', 0.3], ['marionete', 0.2], ['semeador', 0.15], ['brotos', 0.2], ['grilo', 0.15]], 7],
  [FG_ZONE0 + 1]: [[['semeador', 0.15], ['mariposa', 0.25], ['brotos', 0.15], ['grilo', 0.2], ['tapete', 0.1], ['mula', 0.15]], 8],
  [FG_ZONE0 + 2]: [[['colono', 0.27], ['mariposa', 0.27], ['tapete', 0.26], ['pernalta', 0.2]], 7],
  [FG_ZONE0 + 3]: [[['marionete', 0.18], ['semeador', 0.18], ['tapete', 0.23], ['pernalta', 0.18], ['mula', 0.23]], 8]
});
const FG_NO_SPAWN = (tx, ty) => fungLand.some(L => wdx(tx - L.x0) >= -3 && wdx(tx - L.x0) < L.w + 3 && ty > L.fy - L.h - 3 && ty <= L.fy) || (typeof inMaeHall === 'function' && inMaeHall(tx, ty, 2));
{ const _ts = trySpawn; trySpawn = function () {
  if (!FUNGO || !pl) return _ts();
  const fol = enemies.filter(e => e.fgFollower); if (!fol.length) return _ts();
  for (const e of fol) enemies.splice(enemies.indexOf(e), 1);
  try { return _ts(); } finally { for (const e of fol) enemies.push(e); }
}; }
// a pernalta só anda onde há uns 6 blocos livres acima do chão
function fungHeadroom(tx, ty, n) { for (let k = 0; k < n; k++) { if (SOLID[tileAt(tx, ty - k)]) return false; } return true; }
// níveis 11 e 12 (layerLvl no 52, a posição no 129); nada nasce nas câmaras de pouso nem na gruta da chefe
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!FUNGO || e.boss || D.boss || e.fgMinion) return e;
  const ty = Math.floor((py + e.h) / T), d = ty - FG_S0;
  if (d >= 0 && d < FG_D) {
    if (zone >= FG_ZONE0 && zone <= FG_ZONE0 + 3 && (FG_NO_SPAWN(Math.floor((px + e.w / 2) / T), ty - 1) || (type === 'brotos' && !e.fgFollower && enemies.filter(o => o.type === 'brotos' && o.fgLead && !o.dead && o !== e).length >= 2) || (type === 'pernalta' && !fungHeadroom(Math.floor((px + e.w / 2) / T), ty - 1, 6)))) { e.dead = true; e.hp = 0; e.fgVoid = true; return e; }
    const lvl = layerLvl(layerLo('fungo'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
// um bicho que nasceu numa câmara de pouso some sem deixar nada
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].fgVoid) enemies.splice(k, 1); });
// a água-viva: de vez em quando, numa água perto do herói (fora da tela) que não tem nenhuma, nasce uma
let fungAguaT = 4;
HOOK.update.push(dt => {
  if (!FUNGO || !pl || pl.dead || state !== 'play' || !ET.aguaviva || bossFight || (fungAguaT -= dt) > 0) return;
  fungAguaT = 4 + Math.random() * 4;
  const ptx = Math.floor((pl.x + pl.w / 2) / T), pty = Math.floor((pl.y + pl.h / 2) / T), b = fungoBand(pty);
  if (b < 2 || b > 3 || enemies.length > 40 || enemies.filter(e => e.type === 'aguaviva' && !e.dead).length >= 3) return;
  const halfW = Math.ceil(VW / 2 / T), D = ET.aguaviva;
  for (let a = 0; a < 40; a++) {
    const tx = ptx + (Math.random() < 0.5 ? -1 : 1) * (halfW + 2 + ((Math.random() * 14) | 0)), ty = pty + (((Math.random() - 0.5) * 30) | 0);
    if (!aguaAt(tx, ty) || !aguaAt(tx, ty + 1) || FG_NO_SPAWN(tx, ty) || rectSolid(tx * T, ty * T, D.w, D.h)) continue;
    const e = spawnEnemy('aguaviva', tx * T, ty * T, FG_ZONE0 + b);
    if (e && !e.dead && enemies.indexOf(e) < 0) enemies.push(e);
    break;
  }
});

/* ---------- os estados do herói: esporado (dano lento), lento, colado (sem pulo); o micélio vivo deixa lento ---------- */
function fungDano(d, col = '#8ad86a') {
  if (pl.dead || (typeof modoDeus !== 'undefined' && modoDeus)) return;
  pl.hp -= d; pl.hurtFlash = 0.08; pl.lastHurt = gameTime; pl.regen = 0;
  floatText(pl.x + pl.w / 2, pl.y - 6, '-' + d, col, 0.9);
  if (pl.hp <= 0) { pl.hp = 0; die(); }
}
HOOK.update.push(dt => {
  if (!pl || state !== 'play') return;
  if (pl.dead) { pl.fgEsporoT = pl.fgLentoT = pl.fgColaT = 0; return; }
  if ((pl.fgEsporoT || 0) > 0) {
    pl.fgEsporoT -= dt; pl.fgEsporoAcc = (pl.fgEsporoAcc || 0) + (pl.fgEsporoDmg || 0) * dt;
    if (pl.fgEsporoAcc >= 1) { const d = Math.floor(pl.fgEsporoAcc); pl.fgEsporoAcc -= d; fungDano(d); }
    if (Math.random() < dt * 10) parts.push({ x: pl.x + rnd(0, pl.w), y: pl.y + rnd(2, pl.h), vx: rnd(-6, 6), vy: rnd(-18, -6), g: -6, life: 0.9, max: 0.9, col: Math.random() < 0.5 ? '#9ae06a' : '#d8f0a0', size: 1, glow: true });
  } else pl.fgEsporoAcc = 0;
  if ((pl.fgLentoT || 0) > 0) pl.fgLentoT -= dt;
  if ((pl.fgColaT || 0) > 0) pl.fgColaT -= dt;
});
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!FUNGO || pl.dead) return _up(dt);
  let k = (pl.fgLentoT || 0) > 0 ? pl.fgLentoK || 0 : 0;
  if (pl.onGround && tileAt(Math.floor((pl.x + pl.w / 2) / T), Math.floor((pl.y + pl.h + 1) / T)) === FG_VIVO) k = Math.max(k, 0.25);
  if ((pl.fgColaT || 0) > 0) { k = Math.max(k, 0.5); pressed.Space = pressed.KeyW = pressed.ArrowUp = false; pl.jumpBuf = 0; }
  if (k <= 0) return _up(dt);
  const s0 = pl.spd; pl.spd = (1 + s0) * (1 - k) - 1;
  try { return _up(dt); } finally { pl.spd = s0; }
}; }
// o Gancho de Colheita (127): a estocada puxa um bicho leve um passo para perto
{ const _he = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  _he(e, dir, mult, melee);
  const w = equip.weapon && ITEMS[equip.weapon.id];
  if (!melee || !w || !w.hook || e.dead || e.boss) return;
  const D = ET[e.type]; if (!D || D.boss || D.hp > 120) return;
  e.vx = -dir * 130; e.stun = Math.max(e.stun, 0.3);
}; }

/* ---------- os brilhos: cogumelo-lanterna, lampião, cacho de esporos, esporita, chapéus ---------- */
const FG_GLOW = {};
HOOK.drawGlow.push((cx, cy) => {
  if (!FUNGO || cy + VH < (FG_S0 - 6) * T || cy > (FG_S0 + FG_D + 6) * T) return;
  if (!FG_GLOW.l) { FG_GLOW.l = glow(24, '#5ae0d0'); FG_GLOW.q = glow(18, '#ffb060'); FG_GLOW.e = glow(14, '#9ae06a'); FG_GLOW.o = glow(12, '#34a890'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2], gx = emitters[i], gy = emitters[i + 1];
    if (t === FG_LANTERNA) { lc.globalAlpha = 0.3 + Math.sin(gameTime * 1.3 + gx * 0.9) * 0.05; lc.drawImage(FG_GLOW.l, gx * T + 6 - cx - 24, gy * T + 6 - cy - 24); }
    else if (t === FG_LAMPIAO) { lc.globalAlpha = 0.26 + Math.sin(gameTime * 7 + gx * 1.3) * 0.03; lc.drawImage(FG_GLOW.q, gx * T + 6 - cx - 18, gy * T + 6 - cy - 18); }
    else if (t === FG_ESPOROS) { lc.globalAlpha = 0.2 + Math.sin(gameTime * 1.7 + gy) * 0.06; lc.drawImage(FG_GLOW.e, gx * T + 6 - cx - 14, gy * T + 5 - cy - 14); }
    else if (t === FG_O_ESPORITA) { if ((gx + gy) & 1) continue; lc.globalAlpha = 0.14 + Math.sin(gameTime * 1.1 + gx * 0.7) * 0.04; lc.drawImage(FG_GLOW.o, gx * T + 6 - cx - 12, gy * T + 6 - cy - 12); }
  }
  lc.globalAlpha = 1;
});
// esporos subindo devagar em toda a camada, gotas de seiva nas Galerias e nas Grutas, um brilho rosado no Coração
HOOK.update.push(dt => {
  if (!FUNGO || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = fungoBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T)) && !aguaAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 1 ? 10 : 5)) { const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH; if (air(x, y)) parts.push({ x, y, vx: rnd(-4, 4), vy: rnd(-10, -4), g: -1, life: 3.5, max: 3.5, col: b === 3 ? (Math.random() < 0.5 ? '#e8a8b0' : '#c8f0d8') : Math.random() < 0.6 ? '#8ae8c8' : '#c8fce8', size: 1, glow: true }); }
  if ((b === 0 || b === 2) && Math.random() < dt * 3) {
    const tx = Math.floor((cam.x + Math.random() * VW) / T); let ty = Math.floor((cam.y + Math.random() * VH * 0.6) / T);
    for (let k = 0; k < 12 && !solidAt(tx, ty - 1); k++) ty--;
    if (solidAt(tx, ty - 1) && !solidAt(tx, ty) && wallAt(tx, ty)) parts.push({ x: tx * T + rnd(2, 10), y: ty * T, vx: 0, vy: 8, g: 380, life: 1.4, max: 1.4, col: '#7ab89a', size: 1 });
  }
});

/* ---------- a forja e o vilarejo: a esporita na fornalha (127 tem os itens), lojas e as tarefas do ancião ---------- */
FURN.min_esporita = { bar: 'barra_esporita', n: 6, t: 9 };
Object.assign(MAT_VAL, { min_esporita: 32, barra_esporita: 195, fio_micelio: 8, po_mariposa: 14, chapeu_lanterna: 12, perna_grilo: 16 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || ['po_mariposa', 'chapeu_lanterna'].includes(id); c.hint = c.hint.replace(/\.$/, '') + ', pó de mariposa e chapéus-lanterna.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_esporita', 'barra_esporita', 'fio_micelio', 'perna_grilo'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', esporita, fio de micélio e pernas de grilo.'; }
{ const o = SHOPS.taverneiro, b = o.buys; o.buys = id => b(id) || id === 'chapeu_lanterna'; o.hint = o.hint.replace(/\.$/, '') + ' e chapéus-lanterna para o ensopado.'; }
if (typeof ORE_WHERE !== 'undefined') Object.assign(ORE_WHERE, { min_esporita: 'Minério das Minas Fúngicas, sempre junto da rocha tomada pelo fungo' });
// as bases da camada caem raro dos Tomados (cerca de 1% somando as três; 3% da mula e da pernalta). O sorteio de
// equipamento do jogo multiplica a chance por 0,1 (rollDrops), por isso os números aqui são 10 vezes maiores
for (const k of ['colono', 'marionete', 'semeador', 'mariposa', 'tapete', 'brotos', 'grilo', 'pernalta', 'mula', 'aguaviva']) {
  if (!DROPS[k]) continue;
  const p = k === 'mula' || k === 'pernalta' ? 0.1 : 0.034;
  for (const id of ['capacete_lanterna', 'botas_seiva', 'gancho_colheita']) { const o = DROPS[k].find(r => r[0] === id); if (o) o[1] = p; else DROPS[k].push([id, p]); }
}
