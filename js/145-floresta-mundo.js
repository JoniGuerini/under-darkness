'use strict';

/* ================= a Floresta Petrificada: o mundo debaixo da Cidade Afundada =================
   buildCathedral() já faz as camadas de cima até a Cidade; aqui ganha mais um passo, fpBuild() e fpAfter(), que fazem
   a floresta engolida debaixo do Palácio do Sino (docs/camadas/07-floresta-petrificada.md, seção 3):
     1. a rocha: solo petrificado no Bosque, granito verde na Mata e na Clareira, raiz de pedra nas Raízes; o aterro
        da Cidade rareia nas primeiras linhas; troncos enterrados na rocha (casca por fora, cerne por dentro)
     2. as salas, cavando entre as árvores: grutas de terra baixas no Bosque, clareiras ocas na Mata (troncos em pé do
        chão ao teto, andares de folhagem de cristal a 6 e 12 do chão), redes de raiz e raízes ocas nas Raízes, salões
        de troncos gigantes, a clareira do Cervo e o acampamento anão na Clareira; túneis ligando tudo
     3. as duas entradas: debaixo das duas adegas da Cidade, uma raiz gigante petrificada fura a rocha com degraus
        cortados nela até a câmara de pouso (12 x 6, duas drusas, sem spawn)
     4. as duas escadarias dos anões no chão da Clareira (o Abismo desce delas, 108), longe do Cervo
     5. estragos (troncos caídos atravessando salas, montes de cascalho de cristal), veios (carvão, platina), geodos
     6. tudo alcançável das entradas; degraus de raiz em todo desnível de 5 ou mais; cipós das copas até o chão; a
        decoração; a correção da estrutura (tronco em pé toca chão e teto, cipó tem teto, folha caída só no chão); os
        objetos (142); a subida garantida (fpClimbFix)
   Também aqui: a terceira camada, as zonas 33 a 36 (nomes no 148), o spawn (o bando de sementes conta 1, no máximo 2
   lagartos), o nível, o herói preso pela raiz, as partículas, a platina na fornalha e as lojas. */

let fpChambers = [], fpClearings = [], fpNets = [], fpHalls = [], fpLand = [], fpTrunks = [];
const fpKeep = new Set();   // as entradas, o pouso, a clareira do Cervo, as escadarias, o acampamento: túneis e decoração não mexem
const FP_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [FP_SOLO, FP_CASCA, FP_CERNE, FP_GRANITO, FP_RAIZ, FP_FOLHA, FP_SEIVA, FP_MUSGO, FP_CASCALHO, FP_O_CARVAO, FP_O_PLATINA, FP_O_CRISTAL]) FP_SOILS[t] = 1;
const FP_HOST = new Uint8Array(NT);    // o que a camada pode sobrescrever (o enchimento debaixo da Cidade)
for (let t = 0; t < NT; t++) if (CD_HOST[t] || CD_SOILS[t]) FP_HOST[t] = 1;
FP_HOST[BEDROCK] = 0;
const FP_CLIMB = t => t === FP_CIPO || t === FP_RAIZ_ESCADA || t === CD_ESCADA || t === CD_CORRENTE || t === FG_CORDAO || t === CHAIN;
// a Clareira dos Troncos Gigantes (o 146 usa): dentro dela, com margem m
function inFpHall(tx, ty, m = 0) { const B = fpBoss; return !!B && Math.abs(wdx(tx - B.cx)) < B.w / 2 + m && ty >= B.top - m && ty <= B.fy + 8 + m; }
const inFpCamp = (tx, ty, m = 0) => { const C = fpCamp; return !!C && wdx(tx - C.x0) >= -m && wdx(tx - C.x0) < C.w + m && ty >= C.fy - 7 - m && ty <= C.fy + m; };

function fpBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  FP_S0 = Math.min(WH - 12, CD_S0 + Math.min(CD_D, WH - 8 - CD_S0));
  const S0 = FP_S0, YB = Math.min(WH - 8, S0 + FP_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x7f1a), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / FP_D);
  const bandOf = d => d < FP_BANDS[1] ? 0 : d < FP_BANDS[2] ? 1 : d < FP_BANDS[3] ? 2 : 3;
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  fpChambers = []; fpClearings = []; fpNets = []; fpHalls = []; fpLand = []; fpTrunks = [];
  fpEntries = []; fpExits = []; fpBoss = null; fpCamp = null; fpKeep.clear();

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 8; y < S0; y++) {   // o aterro da Cidade rareia nas últimas linhas do Palácio
      const i = y * WW + x, k = (y - (S0 - 8)) / 8, h = nz(x, y, 12, 0x7b2);
      if (SOLID[tiles[i]] && CD_SOILS[tiles[i]] && !cdKeep.has(i) && h < k * 0.85) tiles[i] = FP_SOLO;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x;
      if (tiles[i] === BEDROCK || y >= WH - 3 || !FP_HOST[tiles[i]]) continue;
      const k = (y - S0) / 8, h = nz(x, y, 12, 0x7b3);
      if (k < 1 && h > 0.45 + k * 0.6) { tiles[i] = CD_ATERRO; walls[i] = WCD_TIJOLO; continue; }
      // as faixas se misturam nas bordas por ruído
      const bj = clamp(bandOf(y - S0 + Math.round((nz(x, y, 18, 0x7b4) - 0.5) * 10)), 0, 3), n1 = nz(x, y, 30, 0x7a1), n2 = nz(x, y, 14, 0x7a2);
      let t, w;
      if (bj === 0) { t = n1 > 0.68 ? FP_GRANITO : FP_SOLO; w = n1 > 0.68 ? WFP_GRANITO : WFP_SOLO; }
      else if (bj === 1) { t = FP_GRANITO; w = n2 > 0.72 ? WFP_CRISTAL : WFP_GRANITO; }
      else if (bj === 2) { t = n1 > 0.62 ? FP_GRANITO : FP_RAIZ; w = n1 > 0.62 ? WFP_GRANITO : WFP_RAIZ; if (n2 > 0.86) t = FP_SEIVA; }
      else { t = n2 > 0.8 ? FP_CERNE : FP_GRANITO; w = n1 > 0.6 ? WFP_CASCA : WFP_GRANITO; }
      if (y >= YB) { t = FP_GRANITO; w = WFP_GRANITO; }
      tiles[i] = t; walls[i] = w;
    }
  }
  // a floresta enterrada: troncos inteiros dentro da rocha (o que as salas cortarem vira toco no chão ou raiz no teto;
  // a correção da estrutura no fim tira os pedaços soltos no ar)
  const R2 = mulberry32(seed ^ 0x7c2e);
  for (let x = 2; x < WW; x += 6 + ((R2() * 9) | 0)) {
    const y0 = S0 + 4 + ((R2() * (DB - 30)) | 0), len = 14 + ((R2() * 26) | 0), b = bandOf(y0 - S0), tw = b === 3 ? 4 + ((R2() * 3) | 0) : 2 + ((R2() * 2) | 0);
    const lean = R2() < 0.2 ? (R2() < 0.5 ? -1 : 1) * (0.36 + R2() * 0.34) : 0;
    for (let k = 0; k < len; k++) {
      const y = y0 + k, xc = x + Math.round(k * lean); if (y >= YB - 2) break;
      for (let j = 0; j < tw; j++) { const i = I(xc + j, y); if (!FP_SOILS[tiles[i]] || tiles[i] === FP_SEIVA) continue; tiles[i] = j === 0 || j === tw - 1 ? FP_CASCA : FP_CERNE; }
    }
  }

  // ---------- 2. as salas ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN), hardc = new Uint8Array(NN);
  // poucas cavernas naturais (o resto é a floresta), mais no Bosque
  const tmp = new Uint8Array(NN), P0 = [0.2, 0.12, 0.14, 0.1];
  for (let x = 0; x < WW; x++) for (let y = S0 + 2; y <= YB - 3; y++) { const reg = nz(x, y, 6, 0x7c1), d = y - S0; cv[y * WW + x] = R() < P0[bandOf(d)] + (reg - 0.5) * 0.3 - (d < 5 ? 0.2 : 0) ? 1 : 0; }
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
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i] || hardc[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; hardc[i] = 1; } };   // fica sólido (chão de sala, tronco)
  const blob = (cx, cy, w, h, s, flat = 1.7) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.25 + (nz(x, y, 50, s) - 0.5) * 0.35) dig(x, y);
    }
  };
  const busy = (cx, cy, w, h, m = 4) => fpChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  // uma sala de chão plano: `fy` é a fileira do chão, o ar de fy - h a fy - 1, teto em abóbada
  const room = (x0, fy, w, h, vault = 1.5) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const k = x - x0, arch = Math.round(vault * Math.pow(Math.abs((k + 0.5) / w * 2 - 1), 3)); if (y >= fy - h + arch) dig(x, y); } for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  const trunks = [];   // [x0, w, top, fy, lean]: os troncos das salas, escritos depois que as salas viram ar

  // ---------- 2a. as duas entradas: debaixo de cada adega da Cidade, uma raiz-mestra petrificada com degraus ----------
  const cd = (typeof cdDown !== 'undefined' ? cdDown : []).filter(c => c.fy);
  for (const C of cd.slice(0, 2)) {
    const xs = W1(Math.round(C.cx) - 2), landFy = S0 + mb(20);   // xs..xs+3: o poço dentro da raiz
    const side = R() < 0.5 ? -1 : 1, hx = side < 0 ? xs - 12 : xs;   // o pouso 12 x 6 ao pé da raiz, aberto para um lado
    for (let y = landFy - 7; y <= landFy; y++) for (let x = hx - 1; x <= hx + 12; x++) seal[I(x, y)] = 1;
    for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 12; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    const door = side < 0 ? hx - 1 : hx + 12;
    for (let y = landFy - 3; y < landFy; y++) { const i = I(door, y); cv[i] = 1; keep[i] = 1; }
    fpLand.push({ x0: W1(hx), fy: landFy, w: 12, h: 6, door: W1(door), side });
    for (let y = C.fy; y < landFy - 6; y++) for (let x = xs; x < xs + 4; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
    fpEntries.push({ x: xs + 1, x0: xs, fy: C.fy, top: C.fy - 2, land: fpLand[fpLand.length - 1], C });
    fpChambers.push({ cx: hx + 6, cy: landFy - 3, w: 12, h: 6, band: 0, kind: 'pouso', fy: landFy, x0: W1(hx) });
  }
  const awayFromEntries = (cx, m) => fpEntries.every(E => Math.abs(wdx(E.x0 - cx)) > m);

  // ---------- 2b. a clareira do Cervo: 120 x 24 na Clareira dos Gigantes, do outro lado do mundo em relação às entradas ----------
  {
    const w = 120, h = 24, ax = fpEntries.length ? fpEntries.reduce((s, e) => s + wdx(e.x0 - fpEntries[0].x0), 0) / fpEntries.length + fpEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 40)), fy = Math.min(YB - 6, S0 + mb(178)), top = fy - h, x0 = cx - (w >> 1);
    for (let y = top - 3; y <= fy + 9; y++) for (let x = x0 - 3; x <= x0 + w + 2; x++) seal[I(x, y)] = 1;
    for (let y = top; y < fy; y++) for (let x = x0; x < x0 + w; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    // as entradas nas duas pontas (4 de altura), um corredor curto para fora
    for (const s of [-1, 1]) {
      const xe = s < 0 ? x0 - 1 : x0 + w, len = 10;
      for (let k = 0; k < 3; k++) for (let y = fy - 4; y < fy; y++) { const i = I(xe + s * k, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
      const xa = s < 0 ? x0 - 3 - len : x0 + w + 3;
      for (let x = xa; x < xa + len; x++) { for (let y = fy - 4; y < fy; y++) dig(x, y); hard(x, fy); }
      fpChambers.push({ cx: xa + len / 2, cy: fy - 2, w: len, h: 4, band: 3, kind: 'boca', fy, x0: W1(xa) });
    }
    // sete troncos gigantes de 4, a cada 14 a 16; a fenda de 10 no meio (o 146 põe os espinhos e o tronco caído)
    const T7 = [], rift = { x0: W1(x0 + (w >> 1) - 5), w: 10, depth: 6 };
    for (let k = 0, x = x0 + 10; k < 7 && x < x0 + w - 8; k++) {
      if (Math.abs(wdx(x + 2 - (x0 + (w >> 1)))) < 9) x += 10;
      T7.push({ x: W1(x), w: 4 }); x += 14 + ((R() * 3) | 0);
    }
    fpBoss = { x0: W1(x0), x1: W1(x0 + w - 1), cx, w, h, top, fy, rift, trunks: T7 };
    fpChambers.push({ cx, cy: fy - (h >> 1), w, h, band: 3, boss: true, nolink: true });
  }

  // ---------- 2c. as duas escadarias dos anões: no chão da Clareira, longe do Cervo e uma da outra ----------
  for (let tries = 0; fpExits.length < 2 && tries < 600; tries++) {
    const w = 14, cx = (R() * WW) | 0, fy = S0 + mb(176) + ((R() * mb(6)) | 0);
    if (Math.abs(wdx(cx - fpBoss.cx)) < fpBoss.w / 2 + (tries < 400 ? 120 : 60) || fpExits.some(c => Math.abs(wdx(c.cx - cx)) < (tries < 400 ? 200 : 80)) || busy(cx, fy - 4, w, 8, 6)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, 8, 1);
    const C = { cx, cy: fy - 4, w, h: 8, band: 3, kind: 'escadaria', fy, x0: W1(x0), x1: W1(x0 + w - 1), top: fy - 8 };
    fpExits.push(C); fpChambers.push(C);
  }
  // o acampamento anão abandonado: 16 x 7 perto de uma escadaria
  if (fpExits.length) {
    const E = fpExits[0];
    for (let tries = 0; tries < 60 && !fpCamp; tries++) {
      const s = R() < 0.5 ? -1 : 1, x0 = W1(E.x0 + (s < 0 ? -(22 + ((R() * 14) | 0)) : E.w + 6 + ((R() * 14) | 0))), fy = E.fy;
      if (busy(x0 + 8, fy - 3, 16, 7, 2)) continue;
      room(x0, fy, 16, 7, 1);
      fpCamp = { x0, w: 16, fy, cx: x0 + 8 };
      fpChambers.push({ cx: x0 + 8, cy: fy - 3, w: 16, h: 7, band: 3, kind: 'acampamento', fy, x0 });
    }
  }

  // ---------- 2d. o Bosque Soterrado: grutas de terra baixas e compridas, presas entre troncos deitados ----------
  for (let k = 0, tries = 0; k < 8 * WSC && tries < 800; tries++) {
    const w = 12 + ((R() * 15) | 0), h = 6 + ((R() * 5) | 0), cx = (R() * WW) | 0, fy = S0 + mb(12) + ((R() * mb(32)) | 0);
    if (fy - h < S0 + 3 || busy(cx, fy - h / 2, w, h, 4)) continue;
    blob(cx, fy - h / 2, w, h, 0x7e00 + k, 1.9);
    const C = { cx, cy: fy - h / 2, w, h, band: 0, kind: 'gruta', fy, x0: W1(cx - (w >> 1)) };
    fpChambers.push(C); k++;
    if (R() < 0.6) trunks.push([C.x0 + ((R() * (w - 6)) | 0), 2, fy - h - 2, fy + 1, (R() < 0.5 ? -1 : 1) * (1.4 + R() * 1.2)]);   // um tronco deitado atravessando
  }
  // ---------- 2e. a Mata de Cristal: clareiras ocas com troncos do chão ao teto e andares de folhagem ----------
  for (let k = 0, tries = 0; k < 5 * WSC && tries < 600; tries++) {
    const w = 30 + ((R() * 21) | 0), h = 16 + ((R() * 11) | 0), x0 = (R() * WW) | 0, fy = S0 + mb(70) + ((R() * mb(24)) | 0);
    if (fy - h < S0 + FP_BANDS[1] - 2 || busy(x0 + w / 2, fy - h / 2, w, h, 6)) continue;
    room(x0, fy, w, h, 4);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, kind: 'clareira', fy, x0: W1(x0), top: fy - h, trunks: [] };
    const n = 2 + ((R() * 3) | 0);
    for (let j = 0; j < n; j++) { const tx = x0 + Math.round((j + 0.5) * w / n + (R() - 0.5) * 4) - 1, tw = 2 + ((R() * 2) | 0); C.trunks.push([tx, tw]); trunks.push([tx, tw, fy - h - 3, fy, 0]); }
    fpClearings.push(C); fpChambers.push(C); k++;
  }
  // ---------- 2f. as Raízes Profundas: redes de raiz e raízes ocas ----------
  for (let k = 0, tries = 0; k < 7 * WSC && tries < 700; tries++) {
    const w = 14 + ((R() * 11) | 0), h = 10 + ((R() * 7) | 0), cx = (R() * WW) | 0, fy = S0 + mb(110) + ((R() * mb(34)) | 0);
    if (fy - h < S0 + FP_BANDS[2] || busy(cx, fy - h / 2, w, h, 4)) continue;
    blob(cx, fy - h / 2, w, h, 0x7f00 + k, 1.3);
    const C = { cx, cy: fy - h / 2, w, h, band: 2, kind: 'rede', fy, x0: W1(cx - (w >> 1)), top: fy - h };
    fpNets.push(C); fpChambers.push(C); k++;
  }
  const hollow = [];   // as raízes ocas: [pontos], escritas depois
  for (let k = 0, tries = 0; k < 3 * WSC && tries < 200; tries++) {
    let x = (R() * WW) | 0, y = S0 + mb(104) + ((R() * mb(40)) | 0);
    if (busy(x, y, 8, 8, 2)) continue;
    const pts = [], len = 30 + ((R() * 31) | 0); let a = R() < 0.5 ? 0 : Math.PI;
    for (let s = 0; s < len; s++) { a += (R() - 0.5) * 0.5; a = clamp(a, -0.5, 0.5) + (Math.cos(a) < 0 ? Math.PI : 0); x += Math.cos(a); y = clamp(y + Math.sin(a) * 0.5, S0 + FP_BANDS[2] + 3, S0 + mb(148)); pts.push([Math.round(x), Math.round(y)]); }
    for (const [px, py] of pts) for (let dy = -1; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) dig(px + dx, py + dy);
    hollow.push(pts);
    fpChambers.push({ cx: pts[pts.length >> 1][0], cy: pts[pts.length >> 1][1], w: 8, h: 4, band: 2, kind: 'oca', pts, fy: pts[0][1] + 2 }); k++;
  }
  // ---------- 2g. a Clareira dos Gigantes: salões de troncos de 4 a 6 ----------
  for (let k = 0, tries = 0; k < 3 * WSC && tries < 500; tries++) {
    const w = 40 + ((R() * 21) | 0), h = 20 + ((R() * 9) | 0), x0 = (R() * WW) | 0, fy = S0 + mb(170) + ((R() * mb(10)) | 0);
    if (fy - h < S0 + FP_BANDS[3] - 4 || busy(x0 + w / 2, fy - h / 2, w, h, 6)) continue;
    room(x0, fy, w, h, 5);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 3, kind: 'gigantes', fy, x0: W1(x0), top: fy - h };
    for (let x = x0 + 6; x < x0 + w - 8; x += 12 + ((R() * 6) | 0)) trunks.push([x, 4 + ((R() * 3) | 0), fy - h - 4, fy, 0]);
    fpHalls.push(C); fpChambers.push(C); k++;
  }

  // ---------- 2h. túneis: em volta do mundo em cada faixa e alguns entre faixas (3 de altura) ----------
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 1.0 + Math.sin(n * 0.13 + s) * 0.25;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.55;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const mouth = C => C.fy ? C.fy - 2 : C.cy + C.h * 0.2;
  const ends = (C, right) => right ? C.cx + C.w / 2 - 1 : C.cx - C.w / 2 + 1;
  const RAD = [1.5, 1.7, 1.6, 1.8];
  for (let b = 0; b < 4; b++) {
    const L = fpChambers.filter(c => c.band === b && !c.nolink).sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) { const A = L[k], B = L[(k + 1) % L.length]; if (A === B) continue; worm(ends(A, true), mouth(A), ends(B, false), mouth(B), RAD[b], 0x7700 + b * 50 + k); }
  }
  for (let b = 0; b < 3; b++) {
    const U = fpChambers.filter(c => c.band === b && !c.nolink), D = fpChambers.filter(c => c.band === b + 1 && !c.nolink);
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
      if (open && comp.length < 24 && !comp.some(c => seal[c] || keep[c] || hardc[c])) for (const c of comp) cv[c] = 1;
    }
  }
  for (let i = S0 * WW; i < YB * WW; i++) if (cv[i]) tiles[i] = AIR;
  for (let i = (S0 - 30) * WW; i < S0 * WW; i++) if (cv[i]) tiles[i] = AIR;

  // ---------- 3. a floresta de pedra: o que as salas viram ----------
  const at = (x, y) => tiles[I(x, y)];
  const set = (x, y, t, w) => { const i = I(x, y); tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const shell = (x, y, t) => { const i = I(x, y); if (SOLID[tiles[i]] && FP_SOILS[tiles[i]] && !fpKeep.has(i) && tiles[i] !== FP_CASCA && tiles[i] !== FP_CERNE) tiles[i] = t; };
  const wallIn = (C, w) => { for (let y = (C.top || C.fy - C.h) - 1; y < C.fy; y++) for (let x = C.x0 - 1; x <= C.x0 + C.w; x++) { const i = I(x, y); if (!SOLID[tiles[i]]) walls[i] = w; } };
  // o chão: cascalho de cristal na Mata e na Clareira, solo no Bosque, raiz nas Raízes
  const floorOf = b => b === 0 ? FP_SOLO : b === 2 ? FP_RAIZ : FP_CASCALHO;
  for (const C of fpChambers) {
    if (!C.fy || C.kind === 'oca' || C.kind === 'escadaria') continue;
    const fl = floorOf(C.band);
    for (let x = C.x0; x < C.x0 + C.w; x++) { let y = C.fy - 1; while (y > C.fy - (C.h || 6) - 4 && at(x, y) === AIR) y--; for (let yy = C.fy - 1; yy <= C.fy + 2; yy++) if (at(x, yy - 1) === AIR && SOLID[at(x, yy)] && FP_SOILS[at(x, yy)] && !fpKeep.has(I(x, yy))) { set(x, yy, fl); break; } }
    if (C.kind === 'gruta') wallIn(C, WFP_SOLO);
    else if (C.kind === 'clareira') wallIn(C, WFP_CRISTAL);
    else if (C.kind === 'rede') wallIn(C, WFP_RAIZ);
    else if (C.kind === 'gigantes' || C.kind === 'acampamento') wallIn(C, WFP_CASCA);
    else if (C.kind === 'pouso') wallIn(C, WFP_RAIZ);
  }
  // a pedra musgosa forra paredes e tetos das grutas e das clareiras (nunca o chão)
  for (const C of fpChambers) {
    if (C.kind !== 'gruta' && C.kind !== 'clareira' && C.kind !== 'gigantes') continue;
    const top = C.top || C.fy - C.h;
    for (let y = top - 2; y < C.fy; y++) for (let x = C.x0 - 2; x <= C.x0 + C.w + 1; x++) {
      const i = I(x, y); if (!SOLID[tiles[i]] || !FP_SOILS[tiles[i]] || fpKeep.has(i) || at(x, y - 1) === AIR) continue;
      const nearAir = at(x, y + 1) === AIR || at(x - 1, y) === AIR || at(x + 1, y) === AIR;
      if (nearAir && hash2(W1(x), y, seed ^ 0x7d1) < 0.35) tiles[i] = FP_MUSGO;
    }
  }
  // os troncos das salas: casca por fora, cerne por dentro, do teto ao chão (ou deitados em diagonal, de rampa)
  for (const [x0, tw, top, fy, lean] of trunks) {
    if (!lean) {
      // cada coluna do tronco começa no seu próprio teto (a abóbada da sala não é reta)
      const tops = []; for (let j = 0; j < tw; j++) { let y = top; while (y < fy - 3 && at(x0 + j, y) !== AIR) y++; tops.push(y); }
      if (tops.some(y => y >= fy - 3) || tops.some((y, j) => fpKeep.has(I(x0 + j, y)))) continue;
      for (let j = 0; j < tw; j++) for (let y = tops[j]; y < fy; y++) { const i = I(x0 + j, y); if (fpKeep.has(i)) continue; tiles[i] = j === 0 || j === tw - 1 ? FP_CASCA : FP_CERNE; walls[i] = walls[i] || WFP_CASCA; }
      fpTrunks.push({ x: W1(x0), w: tw, top: Math.min(...tops), fy });
    } else {   // deitado: de um teto ao chão, 2 de grossura, inclinado (de 20 a 35 graus: 1 bloco para baixo a cada 1,4 a 2,6)
      const dir = Math.sign(lean), run = Math.abs(lean), H = fy - top;
      for (let k = 0; k <= H * run; k++) {
        const x = x0 + dir * k, y = top + Math.floor(k / run);
        for (const yy of [y, y + 1]) { const i = I(x, yy); if (yy >= fy || fpKeep.has(i) || (SOLID[tiles[i]] && !FP_SOILS[tiles[i]])) continue; tiles[i] = FP_CASCA; }
      }
    }
  }
  // os andares de folhagem nas clareiras da Mata: a 6 e a 12 do chão, 1 de grossura, com buracos; um cipó desce de cada
  for (const C of fpClearings) {
    for (const lv of [6, 12]) {
      const y = C.fy - lv; if (y <= C.top + 2) continue;
      let run = 0;
      for (let x = C.x0 + 2; x < C.x0 + C.w - 2; x++) {
        const hole = hash2(W1(x) >> 2, y, seed ^ 0x7e3) < 0.22, inTrunk = C.trunks.some(([tx, tw]) => wdx(x - tx) >= -2 && wdx(x - tx) < tw + 2);
        if (at(x, y) !== AIR || (hole && !inTrunk)) { run = 0; continue; }
        if (!inTrunk && run > 8 && hash2(W1(x), y, seed ^ 0x7e4) < 0.15) { run = 0; continue; }
        set(x, y, FP_FOLHA); run++;
      }
    }
  }
  // as redes de raiz: raízes de 1 a 2 cruzando na horizontal e na diagonal, que servem de chão
  for (const C of fpNets) {
    const nb = 2 + ((R() * 3) | 0);
    for (let j = 0; j < nb; j++) {
      const y0 = C.top + 3 + ((R() * Math.max(1, C.h - 6)) | 0), sl = R() < 0.5 ? 0 : (R() < 0.5 ? -1 : 1) * (0.2 + R() * 0.25), th = R() < 0.5 ? 1 : 2;
      for (let x = C.x0 - 2; x < C.x0 + C.w + 2; x++) { const y = Math.round(y0 + (x - C.x0) * sl); for (let t = 0; t < th; t++) if (at(x, y + t) === AIR) set(x, y + t, FP_RAIZ); }
    }
  }
  // as raízes ocas: a casca de raiz de 5 em volta do túnel
  for (const pts of hollow) for (const [px, py] of pts) for (let dy = -3; dy <= 3; dy++) for (let dx = -2; dx <= 3; dx++) { const x = px + dx, y = py + dy, i = I(x, y); if (tiles[i] === AIR) { walls[i] = WFP_RAIZ; continue; } if (SOLID[tiles[i]] && FP_SOILS[tiles[i]] && !fpKeep.has(i) && Math.abs(dy) >= 2) tiles[i] = FP_RAIZ; }
  // a clareira do Cervo: chão de cascalho, teto de raízes, os sete troncos gigantes e a fenda (o 146 veste o resto)
  {
    const B = fpBoss;
    for (let y = B.top - 3; y <= B.fy + 9; y++) for (let x = B.x0 - 3; x <= B.x0 + B.w + 2; x++) {
      const i = I(x, y), inner = wdx(x - B.x0) >= 0 && wdx(x - B.x0) < B.w && y >= B.top && y < B.fy;
      if (inner) { tiles[i] = AIR; walls[i] = WFP_CASCA; }
      else if (y === B.fy && wdx(x - B.x0) >= 0 && wdx(x - B.x0) < B.w) tiles[i] = FP_CASCALHO;
      else if (y < B.top) tiles[i] = y === B.top - 1 ? FP_RAIZ : FP_GRANITO;
      else if (SOLID[tiles[i]] || y > B.fy) tiles[i] = FP_GRANITO;
      fpKeep.add(i);
    }
    for (const s of [-1, 1]) { const xe = s < 0 ? B.x0 - 1 : B.x0 + B.w; for (let k = 0; k < 3; k++) for (let y = B.fy - 4; y < B.fy; y++) { const i = I(xe + s * k, y); tiles[i] = AIR; walls[i] = WFP_CASCA; } for (let k = -1; k < 3; k++) set(xe + s * k, B.fy, FP_CASCALHO); }
    for (const Tr of B.trunks) for (let y = B.top; y < B.fy; y++) for (let j = 0; j < Tr.w; j++) set(Tr.x + j, y, FP_TRONCO_G);
    const rf = B.rift;
    for (let x = rf.x0; x < rf.x0 + rf.w; x++) for (let y = B.fy; y < B.fy + rf.depth; y++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WFP_GRANITO; }
    for (let x = rf.x0 - 1; x <= rf.x0 + rf.w; x++) set(x, B.fy + rf.depth, FP_GRANITO);
  }
  // as escadarias dos anões: poço quadrado de cantaria, chão de cantaria, a boca aberta no chão (o Abismo desce dali)
  for (const C of fpExits) {
    for (let y = C.top - 1; y <= C.fy + 1; y++) for (let x = C.x0 - 1; x <= C.x0 + C.w; x++) { const i = I(x, y); if (SOLID[tiles[i]]) tiles[i] = CD_CANTARIA; else walls[i] = WCD_CANTARIA; fpKeep.add(i); }
    for (let x = C.x0; x < C.x0 + C.w; x++) set(x, C.fy, CD_CANTARIA);
  }
  // o acampamento anão: tábuas no chão, parede de casca
  if (fpCamp) for (let x = fpCamp.x0; x < fpCamp.x0 + fpCamp.w; x++) { set(x, fpCamp.fy, CD_MADEIRAME); for (let y = fpCamp.fy - 7; y <= fpCamp.fy; y++) fpKeep.add(I(x, y)); }
  // as entradas: a raiz-mestra (casca de raiz em volta do poço), os degraus cortados nela; o pouso com duas drusas
  for (const E of fpEntries) {
    const x0 = E.x0, L = E.land, bot = L.fy - L.h;
    for (let y = E.fy; y < bot + 1; y++) {
      for (let x = x0; x < x0 + 4; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = y < S0 ? WCD_TIJOLO : WFP_RAIZ; fpKeep.add(i); }
      for (const x of [x0 - 2, x0 - 1, x0 + 4, x0 + 5]) { const i = I(x, y); if (y > E.fy) { if (y >= S0 - 2 || !SOLID[tiles[i]]) tiles[i] = FP_RAIZ; fpKeep.add(i); } }
    }
    for (let y = E.fy; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = FP_RAIZ_ESCADA; fpKeep.add(i); } }
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), inShaft = wdx(x - x0) >= 0 && wdx(x - x0) < 4 && y < L.fy, edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (inShaft) { if (tiles[i] !== FP_RAIZ_ESCADA) tiles[i] = AIR; walls[i] = WFP_RAIZ; }
      else if (W1(x) === L.door && y >= L.fy - 3 && y < L.fy) { tiles[i] = AIR; walls[i] = WFP_RAIZ; }
      else if (edge) tiles[i] = y === L.fy ? FP_GRANITO : FP_RAIZ; else { tiles[i] = AIR; walls[i] = WFP_RAIZ; }
      fpKeep.add(i);
    }
    for (const k of [2, L.w - 3]) { const x = L.x0 + k; if (wdx(x - x0) >= 0 && wdx(x - x0) < 4) continue; set(x, L.fy - 1, FP_DRUSA); }
  }

  // ---------- 4. veios e geodos ----------
  const R4 = mulberry32(seed ^ 0x0fe7);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !fpKeep.has(i)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(FP_O_CARVAO, 80 * WSC, 0, 150, 3, 8, t => t === FP_SOLO || t === FP_GRANITO);
  vein(FP_O_PLATINA, 40 * WSC, 0, 98, 2, 4, t => t === FP_GRANITO || t === FP_RAIZ);
  vein(FP_O_PLATINA, 70 * WSC, 98, 186, 3, 7, t => t === FP_GRANITO || t === FP_RAIZ);
  // os geodos: bolhas de 3x3 a 5x5, casca de granito, miolo de cristal; 3 vezes mais na Mata
  for (let k = 0; k < 90 * WSC; k++) {
    const inMata = k % 2 === 0, d = inMata ? FP_BANDS[1] + R4() * (FP_BANDS[2] - FP_BANDS[1]) : R4() * 186;
    if (!inMata && R4() < 0.33) continue;
    const s = 3 + ((R4() * 3) | 0), x0 = (R4() * WW) | 0, y0 = S0 + mb(d);
    if (y0 < S0 + 2 || y0 + s >= YB - 2) continue;
    let ok = true; for (let y = y0 - 1; y <= y0 + s && ok; y++) for (let x = x0 - 1; x <= x0 + s && ok; x++) { const i = I(x, y); if (fpKeep.has(i) || (!SOLID[tiles[i]] && !(y === y0 + s || y === y0 - 1))) ok = false; }
    if (!ok) continue;
    const c = (s - 1) / 2;
    for (let y = y0; y < y0 + s; y++) for (let x = x0; x < x0 + s; x++) { const r = Math.hypot(x - x0 - c, y - y0 - c); if (r > c + 0.6) continue; const i = I(x, y); if (!SOLID[tiles[i]] && tiles[i] !== AIR) continue; tiles[i] = r < c - 0.4 ? FP_O_CRISTAL : FP_GRANITO; }
  }
}

function fpAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = FP_S0, YB = Math.min(WH - 8, S0 + FP_D), R3 = mulberry32(seed ^ 0x7d3c1);
  const fpRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!fpRow(y)) return; const i = I(x, y); if (fpKeep.has(i) || inFpHall(W1(x), y, 2)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WFP_GRANITO; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const fpSolid = t => SOLID[t] && FP_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };

  // ---------- 1. tudo alcançável das duas entradas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  // das entradas: o poço da raiz-mestra inteiro e o pouso (a boca de cima pode ainda estar fechada até o fpExitClear)
  for (const E of fpEntries) { for (let y = E.fy - 1; y < E.land.fy; y++) for (let x = E.x0; x < E.x0 + 4; x++) flood(I(x, y)); for (let x = E.land.x0; x < E.land.x0 + E.land.w; x++) flood(I(x, E.land.fy - 1)); }
  if (!fpEntries.length) flood(I(fpChambers[0].cx, Math.round(fpChambers[0].cy)));
  if (fpBoss) for (let y = fpBoss.top; y < fpBoss.fy + 8; y++) for (let k = 0; k < fpBoss.w; k++) reach[I(fpBoss.x0 + k, y)] = 1;   // a clareira: o 146 cuida
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
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inFpHall(W1(cx + dx), y, 2)) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (best) { worm(best[0], best[1], best[2], best[3], 1.6, 0x76a0 + pass); flood(I(best[2], best[3]), true); }
    if (!reach[bestC[0]]) {   // longe demais, ou a minhoca bateu numa borda guardada: um corredor pela rocha, contornando o que fica
      const org = new Int32Array(NN).fill(-1), q = []; let hit = -1; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && hit < 0; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || fpKeep.has(nb) || fpKeep.has(nb - WW) || tiles[nb] === BEDROCK || inFpHall(nb % WW, (nb / WW) | 0, 2)) continue;
          org[nb] = c; if (reach[nb] && !SOLID[tiles[nb]]) { hit = nb; break; }
          q.push(nb);
        }
      }
      for (let c = hit; c >= 0 && org[c] !== c; c = org[c]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. degraus de raiz em todo desnível de 5 ou mais; cipós das copas e dos tetos ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || at(x, y + 1) === FP_FOLHA || inFpHall(x, y, 3)) continue;   // da folhagem descem os cipós
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -4; j <= 4 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || FP_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (fpKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = FP_RAIZ_ESCADA; used.add(i); }
      }
    }
  }
  // um cipó de cada andar de folhagem até o chão (ou até o andar de baixo)
  for (const C of fpClearings) for (const lv of [6, 12]) {
    const y = C.fy - lv; let n = 0;
    for (let x = C.x0 + 3; x < C.x0 + C.w - 3 && n < 2; x += 5 + ((R3() * 6) | 0)) {
      if (at(x, y) !== FP_FOLHA || at(x, y + 1) !== AIR) continue;
      let k = y + 1; while (k < C.fy && at(x, k) === AIR) k++;
      if (k - y < 3) continue;
      for (let yy = y + 1; yy < k; yy++) put(x, yy, FP_CIPO);
      n++;
    }
  }

  // ---------- 3. estragos: montes de cascalho de cristal, solo desabado nas grutas ----------
  for (const C of fpChambers) {
    if (C.kind !== 'gruta' && C.kind !== 'clareira' && C.kind !== 'gigantes') continue;
    if (R3() < 0.5) {
      const x0 = C.x0 + 3 + ((R3() * Math.max(1, C.w - 10)) | 0), w = 3 + ((R3() * 3) | 0), t = C.kind === 'gruta' ? FP_SOLO : FP_CASCALHO;
      for (let k = 0; k < w; k++) { const hgt = k === 0 || k === w - 1 ? 1 : 2; for (let y = C.fy - hgt; y < C.fy; y++) if (at(x0 + k, y) === AIR && SOLID[at(x0 + k, C.fy)]) put(x0 + k, y, t); }
    }
  }

  // ---------- 4. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || fpKeep.has(i)) continue;
    const b = forestBand(y); if (b < 0 || b > 3 || inFpHall(x, y, 2)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = fpSolid(dn) && BLOCKY[dn] !== undefined && up === AIR && dn !== FP_FOLHA, ceil = fpSolid(up) && dn === AIR && up !== FP_FOLHA;
    if (ceil) {
      if (b === 0) { if (q < 0.02) { for (let j = 0, n = 1 + ((R3() * 4) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR; j++) put(x, y + j, FP_CIPO); } }
      else if (b === 1) { if (q < 0.04) put(x, y, FP_PINGENTE); }
      else if (b === 2) { if (q < 0.04) put(x, y, FP_PINGO); else if (q < 0.06) { for (let j = 0, n = 2 + ((R3() * 5) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR; j++) put(x, y + j, FP_CIPO); } }
      else { if (q < 0.02) put(x, y, FP_PINGENTE); else if (q < 0.035) { for (let j = 0, n = 2 + ((R3() * 6) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 1) === AIR; j++) put(x, y + j, FP_CIPO); } }
      continue;
    }
    if (!floor) continue;
    if (b === 0) { if (q < 0.04) put(x, y, FP_SAMAMBAIA); else if (q < 0.06) put(x, y, FP_PINHAS); else if (q < 0.07) put(x, y, FP_TOCO); else if (q < 0.075) put(x, y, FP_OSSADA); else if (q < 0.08) put(x, y, FP_NINHO); }
    else if (b === 1) { if (q < 0.06) put(x, y, FP_FOLHAS); else if (q < 0.085) put(x, y, FP_BROTO); else if (q < 0.095) put(x, y, FP_PINHAS); else if (q < 0.1) put(x, y, FP_DRUSA); }
    else if (b === 2) { if (q < 0.025) put(x, y, FP_SAMAMBAIA); else if (q < 0.035) put(x, y, FP_BROTO); else if (q < 0.04) put(x, y, FP_OSSADA); else if (q < 0.045) put(x, y, FP_DRUSA); }
    else { if (q < 0.03) put(x, y, FP_FOLHAS); else if (q < 0.045) put(x, y, FP_TOCO); else if (q < 0.055) put(x, y, FP_OSSADA); else if (q < 0.062) put(x, y, FP_DRUSA); }
  }

  // ---------- 5. a correção da estrutura ----------
  fpStructFix();

  // ---------- 6. os objetos ----------
  fpPlaceProps();
}

/* ---------- a estrutura: tronco em pé toca chão e teto (senão vira toco ou some), copa sem tronco nem apoio sai,
   cipó precisa de teto, folha caída só no chão ---------- */
function fpStructFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = FP_S0, YB = Math.min(WH - 8, S0 + FP_D);
  const at = (x, y) => tiles[I(x, y)];
  const trunkT = t => t === FP_CASCA || t === FP_CERNE;
  // os pedaços de tronco soltos no ar (os enterrados que uma sala cortou): uma coluna de tronco sem nada sólido de
  // tronco ou rocha embaixo vira ar; com chão embaixo e ar em cima, fica como toco
  for (let pass = 0; pass < 3; pass++) for (let y = YB - 3; y > S0; y--) for (let x = 0; x < WW; x++) {
    const i = I(x, y), t = tiles[i]; if (!trunkT(t) || fpKeep.has(i)) continue;
    const dn = at(x, y + 1), l = at(x - 1, y), r = at(x + 1, y), u = at(x, y - 1);
    const held = SOLID[dn] || (SOLID[u] && !trunkT(u)) || (SOLID[l] && !trunkT(l)) || (SOLID[r] && !trunkT(r)) || (trunkT(u) && trunkT(dn));
    if (!held && !SOLID[dn]) { const lr = trunkT(l) || trunkT(r); if (!lr) tiles[i] = AIR; }
  }
  // a folhagem: um pedaço de copa que não toca tronco nem rocha de nenhum lado (só folha) e tem menos de 3 blocos sai
  for (let y = S0 + 1; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== FP_FOLHA) continue;
    let x1 = x; while (at(x1 + 1, y) === FP_FOLHA && x1 - x < 200) x1++;
    let held = false; for (let k = x - 1; k <= x1 + 1 && !held; k++) { const u = at(k, y - 1), d = at(k, y + 1), s = at(k, y); if ((SOLID[u] && u !== FP_FOLHA) || (k < x || k > x1 ? SOLID[s] && s !== FP_FOLHA : false) || (trunkT(d))) held = true; }
    if (!held && x1 - x < 2) for (let k = x; k <= x1; k++) tiles[I(k, y)] = AIR;
    x = x1;
  }
  // cipó sem teto ou sem cipó em cima; decoração de chão sem chão
  for (let pass = 0; pass < 2; pass++) for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = I(x, y), t = tiles[i]; if (fpKeep.has(i)) continue;
    if ((t === FP_CIPO || t === FP_PINGO || t === FP_PINGENTE) && !SOLID[at(x, y - 1)] && at(x, y - 1) !== FP_CIPO) tiles[i] = AIR;
    else if ((t === FP_FOLHAS || t === FP_BROTO || t === FP_SAMAMBAIA || t === FP_PINHAS || t === FP_OSSADA || t === FP_TOCO || t === FP_NINHO) && !SOLID[at(x, y + 1)]) tiles[i] = AIR;
  }
}

/* ---------- as bocas das entradas por último ---------- */
function fpExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of fpEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? FP_RAIZ_ESCADA : AIR; fpKeep.add(i); }
}
/* ---------- a subida garantida: da clareira do Cervo, do acampamento, do fim de cada raiz oca, de cada salão de
   gigantes e das escadarias, o herói tem de conseguir voltar às entradas ---------- */
function fpClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = FP_S0, YB = Math.min(WH - 8, S0 + FP_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => FP_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y) || inFpHall(x, y)) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1) || aguaAt(x, y)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
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
  const soft = t => t === FP_FOLHA || t === FP_CASCALHO || t === FP_SOLO || t === FP_MUSGO;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || fpKeep.has(I(x, y))) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        if (soft(tiles[I(x, t)]) && !fpKeep.has(I(x, t)) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) tiles[i] = FP_RAIZ_ESCADA; }
    return true;
  };
  const starts = [];
  if (fpBoss) for (const s of [-1, 1]) starts.push([s < 0 ? fpBoss.x0 - 8 : fpBoss.x0 + fpBoss.w + 8, fpBoss.fy - 1]);
  if (fpCamp) starts.push([fpCamp.x0 + 8, fpCamp.fy - 1]);
  for (const c of fpChambers) if (c.kind === 'gigantes' || c.kind === 'escadaria' || c.kind === 'clareira') starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of fpChambers) if (c.kind === 'oca') { const p = c.pts[c.pts.length - 1]; starts.push([p[0], p[1]]); }
  let fixes = 0;
  for (const [x, y] of starts) { for (let k = 0; k < 12 && !search(W1(x), y); k++) { if (!repair()) break; fixes++; } }
  return fixes;
}

/* ---------- os objetos (142): os do acampamento e das escadarias primeiro, depois no chão, debaixo do teto e na
   parede, pela faixa ---------- */
function fpPlaceProps() {
  if (typeof FP_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9c2d7);
  const S0 = FP_S0, YB = Math.min(WH - 8, S0 + FP_D), used = new Uint8Array(WW * WH * 2), BF = typeof FP_BACK_FLOOR !== 'undefined' ? FP_BACK_FLOOR : {};
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || fpKeep.has(i)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && FP_SOILS[t] && t !== FP_FOLHA || t === CD_MADEIRAME || t === CD_CANTARIA; };
  const special = def => def.acampamento || def.escadaria;
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  // um objeto no chão perto de x0; `free` deixa pôr em células guardadas (o acampamento, a escadaria)
  const floorProp = (id, x0, fy, layer = 0, free = false) => {
    const def = PROP_DEFS[id]; if (!def) return false;
    const v = (R() * def.vars.length) | 0, V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
    for (let dx = 0; dx < 5; dx++) for (const s of [1, -1]) {
      const px = x0 + dx * s; let ok = true; for (let k = px; k < px + tw; k++) if (!soil(k, fy)) ok = false;
      if (!ok) continue;
      let room = true; for (let y = fy - th; y < fy && room; y++) for (let x = px; x < px + tw; x++) { const i = I(x, y); if (used[i * 2 + layer] || SOLID[tiles[i]] || (layer === 0 && tiles[i] !== AIR) || !walls[i] || (!free && fpKeep.has(i))) room = false; }
      if (!room) continue;
      mark(px, fy - th, tw, th, layer);
      const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, fy));
      addProp(def, v, W1(px) * T + ((tw * T - V.w) >> 1), fy * T - V.h, sup);
      return true;
    }
    return false;
  };
  // os lugares próprios: o acampamento anão e o marco perto de cada escadaria
  const campIds = Object.keys(PROP_DEFS).filter(k => PROP_DEFS[k].floresta && PROP_DEFS[k].acampamento);
  if (fpCamp) campIds.forEach((id, k) => floorProp(id, fpCamp.x0 + 2 + k * 4, fpCamp.fy, BF[id] ? 1 : 0, true));
  const stairIds = Object.keys(PROP_DEFS).filter(k => PROP_DEFS[k].floresta && PROP_DEFS[k].escadaria);
  for (const E of fpExits) stairIds.forEach((id, k) => floorProp(id, E.x0 + 1 + k * 9, E.fy, BF[id] ? 1 : 0, true));
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = FP_BAND_NAMES[clamp(forestBand(y), 0, 3)], plan = FP_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inFpHall(W1(k), y, 2) || inFpCamp(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def || special(def)) continue;
          let n = Math.min(max, Math.floor(run / 10 * per10 * 1.6 + R())), tries = n * 5;
          while (n > 0 && tries-- > 0) {
            const v = varOf(def, band), V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            // a orelha-de-pau encosta no tronco: na ponta da faixa, colada na parede do seu lado
            const enc = def.encosta ? def.encosta[v] : 0, px = enc < 0 ? x0 : enc > 0 ? x0 + run - tw : x0 + ((R() * (run - tw + 1)) | 0);
            if (typeof fpPropFlagOk === 'function' && how !== 'teto' && !fpPropFlagOk(def, v, px, tw, th, y + 1)) continue;
            if (how === 'chao') {
              const y0 = y + 1 - th;
              if (!fits(px, y0, tw, th, 0, true)) continue;
              mark(px, y0, tw, th, 0); n--;
              const sup = []; for (let k = px; k < px + tw; k++) sup.push(I(k, y + 1));
              addProp(def, v, enc < 0 ? px * T : enc > 0 ? (px + tw) * T - V.w : px * T + ((tw * T - V.w) >> 1), (y + 1) * T - V.h, sup);
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

// a ordem: a camada, a clareira do chefe (146: fpDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc();
  if (!FLORESTA) return;
  try { fpBuild(); fpAfter(); if (typeof fpDress === 'function') fpDress(); fpExitClear(); fpClimbFix(); } catch (err) { console.error(err); }
}; }

/* ---------- a terceira camada atrás da floresta ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!FLORESTA) return;
  const Y1 = Math.min(WH, FP_S0 + FP_D + 4);
  for (let y = FP_S0 - 4; y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - FP_S0) + (depthNz(x, y, 25, seed ^ 0x7e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x7e12);
    DEEPT[i] = d < 46 ? (n > 0.55 ? DP_FP_RAIZES : DP_FP_TRONCOS) : d < 98 ? (n > 0.45 ? DP_FP_COPAS : DP_FP_TRONCOS) : d < 150 ? (n > 0.4 ? DP_FP_RAIZES : DP_FP_TRONCOS) : (n > 0.6 ? DP_FP_COPAS : DP_FP_TRONCOS);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (FLORESTA && ty >= FP_S0 && ty < FP_S0 + FP_D) return FP_ZONE0 + clamp(forestBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6); o bando de sementes conta como 1 (o líder); no máximo 2 lagartos de quartzo (decisão do Jonathan)
Object.assign(CATH_SPAWN, {
  [FP_ZONE0]: [[['sementes', 0.3], ['estrangula', 0.25], ['serpraiz', 0.2], ['tatupedra', 0.15]], 7],
  [FP_ZONE0 + 1]: [[['mariposacr', 0.22], ['lagartoqz', 0.2], ['driade', 0.18], ['prismavivo', 0.15], ['ourico', 0.15], ['sementes', 0.1]], 8],
  [FP_ZONE0 + 2]: [[['estrangula', 0.22], ['serpraiz', 0.22], ['driade', 0.18], ['mariposacr', 0.14], ['troncovelho', 0.12], ['prismavivo', 0.12]], 8],
  [FP_ZONE0 + 3]: [[['troncovelho', 0.24], ['lagartoqz', 0.22], ['tatupedra', 0.2], ['ourico', 0.18], ['driade', 0.16], ['prismavivo', 0.1]], 7]
});
const FP_NO_SPAWN = (tx, ty) => fpLand.some(L => wdx(tx - L.x0) >= -3 && wdx(tx - L.x0) < L.w + 3 && ty > L.fy - L.h - 3 && ty <= L.fy) || inFpHall(tx, ty, 2) || inFpCamp(tx, ty, 2);
{ const _ts = trySpawn; trySpawn = function () {
  if (!FLORESTA || !pl) return _ts();
  const fol = enemies.filter(e => e.fpFollower); if (!fol.length) return _ts();
  for (const e of fol) enemies.splice(enemies.indexOf(e), 1);
  try { return _ts(); } finally { for (const e of fol) enemies.push(e); }
}; }
// níveis 15 e 16 (layerLvl no 52, a posição no 129); nada nasce no pouso, na clareira do Cervo nem no acampamento
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!FLORESTA || e.boss || D.boss || e.fpMinion || e.cdVoid) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - FP_S0;
  if (d >= 0 && d < FP_D) {
    const inZone = zone >= FP_ZONE0 && zone <= FP_ZONE0 + 3;
    if (inZone && (FP_NO_SPAWN(tx, ty - 1) || (type === 'lagartoqz' && enemies.filter(o => o !== e && o.type === 'lagartoqz' && !o.dead).length >= 2))) { e.dead = true; e.hp = 0; e.fpVoid = true; return e; }
    const lvl = layerLvl(layerLo('floresta'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].fpVoid) enemies.splice(k, 1); });

/* ---------- o herói preso pela raiz estranguladora: não anda nem pula (ataca) ---------- */
HOOK.update.push(dt => { if (!pl || state !== 'play') return; if (pl.dead) { pl.fpPresoT = 0; return; } if ((pl.fpPresoT || 0) > 0) pl.fpPresoT -= dt; });
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!FLORESTA || pl.dead || !((pl.fpPresoT || 0) > 0)) return _up(dt);
  const x0 = pl.x; if (pl.vy < 0) pl.vy = 0;
  _up(dt);
  pl.x = x0; pl.vx = 0; if (pl.vy < 0) pl.vy = 0;
}; }

/* ---------- partículas: poeira de cristal das copas (Mata), folhas de cristal girando (Mata e Clareira), gotas de
   seiva (Raízes), pó de pedra (Bosque) ---------- */
HOOK.update.push(dt => {
  if (!FLORESTA || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = forestBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T)) && !aguaAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 1 ? 6 : 3)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (b === 0) parts.push({ x, y, vx: rnd(-2, 2), vy: rnd(2, 5), g: 3, life: 3, max: 3, col: Math.random() < 0.5 ? '#54463a' : '#6e5e4e', size: 1 });
    else if (b === 1) parts.push(Math.random() < 0.6 ? { x, y, vx: rnd(-2, 2), vy: rnd(3, 7), g: 2, life: 3, max: 3, col: Math.random() < 0.5 ? '#8ad8cc' : '#d4f4ec', size: 1 } : { x, y, vx: rnd(-6, 6), vy: rnd(4, 9), g: 1, life: 4, max: 4, col: '#4fb0b0', size: 2 });
    else if (b === 2) { const tx = Math.floor(x / T); let ty = Math.floor(y / T); for (let k = 0; k < 10 && !solidAt(tx, ty - 1); k++) ty--; if (solidAt(tx, ty - 1) && !solidAt(tx, ty)) parts.push({ x: tx * T + rnd(2, 10), y: ty * T, vx: 0, vy: 6, g: 360, life: 1.6, max: 1.6, col: '#c4cc6a', size: 1 }); }
    else parts.push({ x, y, vx: rnd(-5, 5), vy: rnd(3, 8), g: 1, life: 4, max: 4, col: Math.random() < 0.5 ? '#2f7e8a' : '#8ad8cc', size: 2 });
  }
});

/* ---------- a forja e o vilarejo: a platina na fornalha (147 tem os itens), as lojas ---------- */
FURN.min_platina = { bar: 'barra_platina', n: 6, t: 10 };
Object.assign(MAT_VAL, { min_platina: 44, barra_platina: 264, casca_petrea: 14, folha_cristal: 20, seiva_vitrea: 18, olho_prisma: 34 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'seiva_vitrea' || id === 'folha_cristal'; c.hint = c.hint.replace(/\.$/, '') + ', seiva vítrea e folhas de cristal.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_platina', 'barra_platina', 'casca_petrea'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', platina e casca petrificada.'; }
if (SHOPS.maga) { const m = SHOPS.maga, b = m.buys; if (typeof b === 'function') { m.buys = id => b(id) || id === 'olho_prisma'; if (m.hint) m.hint = m.hint.replace(/\.$/, '') + ' e olhos de prisma.'; } }
