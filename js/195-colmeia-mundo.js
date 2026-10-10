'use strict';

/* ================= a Colmeia: o mundo (docs/camadas/09-colmeia.md, seção 3) =================
   A nona camada, debaixo da camada de cima que estiver no disco (cmAbove, 190). Tudo aqui foi cavado por bicho: sem
   autômato de caverna, sem vão de mais de 12 fora das câmaras de âmbar e da esfera. Em passos:
     1. a rocha por faixa: a pedra de cima afina e vira Pedra Tomada; Cera Velha; Resina nas Câmaras; Cera Real no
        Berçário; bordas por ruído
     2. as salas: as duas brechas (o tubo de cera com a Escada de Favos e o salão de pouso 12 x 6), a esfera da Rainha
        do outro lado do mundo (a caixa sólida que o 196 veste com cmDress) e as galerias reais até ela, os salões
        anões da Brecha, o labirinto de túneis com gargalos e os favais das Galerias, as câmaras redondas de resina
        com massas de âmbar, as câmaras de ovos do Berçário (duas com os Escorredouros de Mel, a saída para baixo)
     3. túneis de inseto entre as salas de cada faixa e poços de 3 com escada entre faixas
     4. as cascas: pedra anã, favo, resina, cera real, ovos colados, quitina nas galerias reais
     5. os veios: carvão na resina e na pedra tomada, ambrita na resina e no âmbar (dois terços nas Câmaras)
   Depois (cmAfter): tudo alcançável das brechas, Escada de Favos em todo desnível de 5, os estragos (mel escorrido
   dos favos, montes de cera nova), os funis da formiga-leão, a decoração de 1 bloco e os objetos (192). Por fim a
   esfera (196: cmDress), as bocas das brechas e a subida garantida (cmClimbFix). O 87 liga o resto depois.
   Também: a terceira camada, as zonas 41 a 44, o spawn por faixa e o nível (19 e 20 pela posição no 129), a
   formiga-leão que volta para os funis vazios, as partículas e a ambrita na fornalha e nas lojas. */

const CM_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [CM_CERA, CM_CERA_NOVA, CM_FAVO, CM_FAVO_MEL, CM_RESINA, CM_AMBAR, CM_AMBAR_FOSSIL, CM_PEDRA_TOMADA, CM_CERA_REAL, CM_QUITINA, CM_O_CARVAO, CM_O_AMBRITA, CM_PO_CERA]) CM_SOILS[t] = 1;
const cmKeep = new Set();   // as brechas, o pouso, os escorredouros, as galerias reais: túneis e decoração não mexem
let cmChambers = [], cmLand = [], cmHalls = [], cmFavos = [], cmAmbar = [], cmNinhos = [], cmReais = [];
const CM_CLIMB = t => t === CM_ESCADA_FAVO || t === CM_FIO_CERA || t === CHAIN || t === cmAbove().climb;
// a caixa da esfera da Rainha (o 196 escreve dentro), com margem m
function inCmHall(tx, ty, m = 0) { const B = cmBoss; if (!B) return false; const dx = wdx(tx - B.cx); return dx >= -22 - m && dx <= 21 + m && ty >= B.top - m && ty <= B.bot + m; }
const inCmLand = (tx, ty, m = 0) => cmLand.some(L => wdx(tx - L.x0) >= -m && wdx(tx - L.x0) < L.w + m && ty >= L.fy - L.h - m && ty <= L.fy);
const cmBossOf = a => a.id === 'anoes' ? (typeof anBoss !== 'undefined' ? anBoss : null) : a.id === 'floresta' ? (typeof fpBoss !== 'undefined' ? fpBoss : null) : (typeof cdBoss !== 'undefined' ? cdBoss : null);

function cmBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = cmAbove();
  CM_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = CM_S0, YB = Math.min(WH - 8, S0 + CM_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x7c3a), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / CM_D);
  const bandOf = d => d < CM_BANDS[1] ? 0 : d < CM_BANDS[2] ? 1 : d < CM_BANDS[3] ? 2 : 3;
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  cmChambers = []; cmLand = []; cmHalls = []; cmFavos = []; cmAmbar = []; cmNinhos = []; cmReais = [];
  cmEntries = []; cmExits = []; cmBoss = null; cmFunnels = []; cmKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || (A.host && A.host[t]);

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 10; y < S0; y++) {   // a pedra de cima afina nas últimas 10 linhas e vira pedra tomada
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0x7b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = CM_PEDRA_TOMADA;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      const d = y - S0 + (nz(x, y, 18, 0x7b3) - 0.5) * 10, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 26, 0x7a1), n2 = nz(x, y, 14, 0x7a2);
      let tt = CM_CERA, w = WCM_CERA;
      if (y >= YB) { tt = CM_CERA_REAL; w = WCM_REAL; }
      else if (b === 0) { if (d < 10 + n1 * 12) { tt = CM_PEDRA_TOMADA; w = WCM_PEDRA; } else if (n2 > 0.78) tt = CM_CERA_NOVA; }
      else if (b === 1) { if (n2 > 0.72) tt = CM_CERA_NOVA; w = n1 > 0.6 ? WCM_FAVO : WCM_CERA; }
      else if (b === 2) { tt = n1 > 0.74 ? CM_CERA : CM_RESINA; w = WCM_RESINA; }
      else { tt = CM_CERA_REAL; w = WCM_REAL; }
      tiles[i] = tt; walls[i] = w;
      if (y < YB && agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. as salas ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => cmChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  // sala de chão plano: ar de fy - h a fy - 1, cantos chanfrados em degrau (ch: quantos degraus em cima; 1 embaixo)
  const room = (x0, fy, w, h, ch = 0) => {
    for (let y = fy - h; y < fy; y++) {
      const r = y - (fy - h), ins = r < ch ? ch - r : (ch && y === fy - 1 ? 1 : 0);
      for (let x = x0 + ins; x < x0 + w - ins; x++) dig(x, y);
    }
    for (let x = x0; x < x0 + w; x++) hard(x, fy);
  };
  const blob = (cx, cy, w, h, s, flat = 1.5) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.18 + (nz(x, y, 40, s) - 0.5) * 0.25) dig(x, y);
    }
  };
  // túnel de inseto: anda para o alvo com curvas; r ~1.2 dá 3 de altura
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 1200; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.5) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 1.1 + Math.sin(n * 0.17 + s) * 0.35;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.45;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.8 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  // galeria de degraus: anda em x, sobe ou desce no máximo 3 por vez (o pulo do herói), h de altura; gargalos de 2
  // galeria de degraus: anda em x, sobe ou desce no máximo 3 por vez (o pulo do herói), h de altura, gargalos de 2;
  // para quando encosta em outro vão (vira um T, não um queijo suíço)
  const stepTunnel = (x0, f0, len, dir, h, s, gargalo) => {
    const Rs = mulberry32(seed ^ s), mine = new Set(); let f = f0, x = x0, run = 0; const pts = [];
    for (let k = 0; k < len; k++) {
      if (run-- <= 0) { run = 4 + ((Rs() * 8) | 0); const st = Rs() < 0.45 ? 0 : (Rs() < 0.5 ? -1 : 1) * (1 + ((Rs() * 3) | 0)); f = clamp(f + st, S0 + 4 + h, YB - 4); }
      const hh = gargalo && Rs() < 0.06 ? 2 : h;
      let hit = false;
      if (k > 1) for (let y = f - hh - 2; y <= f + 1 && !hit; y++) for (const xx of [x, x + dir]) { const i = I(xx, y); if (cv[i] && !mine.has(i)) hit = true; }
      for (let y = f - hh; y < f; y++) { dig(x, y); mine.add(I(x, y)); }
      hard(x, f); pts.push([W1(x), f]); x += dir;
      if (hit) break;
    }
    return pts;
  };

  // ---------- 2a. as duas brechas: das salas de baixo da camada de cima, um tubo de cera com a escada até o pouso ----------
  {
    const ub = cmBossOf(A), halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || Math.abs(wdx(c.cx - ub.cx)) > (ub.w || 20) / 2 + 20)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) picks.push({ cx: (R() * WW) | 0, fy: S0 - 2 });
    for (const c of picks) {
      const xs = W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 20 + ((R() * 9) | 0), S0 + 9, S0 + mb(34));
      const hx = side > 0 ? xs - 1 : xs - 8;   // o tubo cai numa ponta do pouso (12 x 6)
      for (let y = landFy - 7; y <= landFy + 1; y++) for (let x = hx - 1; x <= hx + 12; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 12; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 12 : hx - 1;
      for (let y = landFy - 3; y < landFy; y++) { const i = I(door, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 12, h: 6, door: W1(door), side };
      cmLand.push(L);
      // o tubo: do chão da sala de cima até o teto do pouso
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 3; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // um salão anão logo depois da porta do pouso, no mesmo chão
      const w = 20 + ((R() * 10) | 0), h = 7, x0 = side > 0 ? door + 1 : door - w;
      room(x0, landFy, w, h, 0);
      const H = { cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'salao', x0: W1(x0), fy: landFy, top: landFy - h };
      cmHalls.push(H); cmChambers.push(H);
      cmChambers.push({ cx: hx + 6, cy: landFy - 3, w: 12, h: 6, band: 0, kind: 'pouso', nolink: true });
      cmEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }
  const awayFromEntries = (cx, m) => cmEntries.every(E => Math.abs(wdx(E.x0 - cx)) > m);

  // ---------- 2b. a esfera da Rainha, do outro lado do mundo, e as duas galerias reais que chegam nas aberturas ----------
  {
    const ax = cmEntries.length ? cmEntries.reduce((s, e) => s + wdx(e.x0 - cmEntries[0].x0), 0) / cmEntries.length + cmEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), cy = Math.min(YB - 26, S0 + mb(186) - 25);
    const top = cy - 22, bot = cy + 21;
    cmBoss = { cx, cy, r: 20, w: 44, x0: W1(cx - 22), x1: W1(cx + 21), top, bot, fy: bot,
      doors: [{ side: -1, x: W1(cx - 23), fy: cy + 3 }, { side: 1, x: W1(cx + 22), fy: cy + 3 }] };
    for (let y = top - 1; y <= bot + 1; y++) for (let x = cx - 23; x <= cx + 22; x++) seal[I(x, y)] = 1;
    cmChambers.push({ cx: cx - 0.5, cy, w: 44, h: 44, band: 3, boss: true, nolink: true });
    // as galerias reais: retas, 4 de altura, um degrau de vez em quando, até uma câmara de ovos de cada lado
    for (const D of cmBoss.doors) {
      const len = 34 + ((R() * 20) | 0), fy = D.fy;
      for (let y = fy - 4; y <= fy; y++) seal[I(D.x, y)] = 0;
      let f = fy, x = D.x;
      for (let k = 0; k < len; k++) {
        if (k > 6 && k % 9 === 0 && R() < 0.5) f = clamp(f + (R() < 0.5 ? -1 : 1), cy - 4, cy + 8);
        const hh = k < 2 ? 3 : 4;
        for (let y = f - hh; y < f; y++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
        hard(x, f);
        cmKeep.add(I(x, f));
        x += D.side;
      }
      const G = { x0: D.side > 0 ? W1(D.x) : W1(D.x - len + 1), len, fy, side: D.side, end: [W1(x - D.side), f], boss: true };
      cmReais.push(G);
      cmChambers.push({ cx: D.x + D.side * len / 2, cy: fy - 2, w: len, h: 4, band: 3, kind: 'real', nolink: true });
      // a câmara de ovos no fim da galeria
      const w = 14 + ((R() * 5) | 0), h = 9, x0 = D.side > 0 ? x - 1 : x - w + 2;
      room(x0, f, w, h, 2);
      const C = { cx: x0 + w / 2, cy: f - h / 2, w, h, band: 3, kind: 'ninho', x0: W1(x0), fy: f, top: f - h };
      cmNinhos.push(C); cmChambers.push(C);
    }
  }

  // ---------- 2c. os escorredouros de mel: duas câmaras de ovos no fundo, longe uma da outra e da esfera ----------
  for (let tries = 0; cmExits.length < 2 && tries < 600; tries++) {
    const w = 14 + ((R() * 5) | 0), h = 9, cx = (R() * WW) | 0, fy = S0 + mb(160) + ((R() * mb(14)) | 0);
    if (Math.abs(wdx(cx - cmBoss.cx)) < 22 + 50 || cmExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h, 2);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'ninho', x0: W1(x0), fy, top: fy - h, exit: true };
    cmNinhos.push(C); cmChambers.push(C);
    // o poço: 3 de largura do chão da câmara até a última linha (o Abismo continua de lá)
    const sx = W1(cx - 1);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 3; x++) seal[I(x, y)] = x >= sx && x < sx + 3 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 3; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    cmExits.push({ x0: sx, x1: W1(sx + 2), cx: W1(cx), w: 3, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. a Brecha Tomada: salões anões retos, comidos pela cera nas pontas ----------
  for (let k = 0, tries = 0; k < 7 * WSC && tries < 400; tries++) {
    const w = 20 + ((R() * 15) | 0), h = 6 + ((R() * 3) | 0), x0 = (R() * WW) | 0, fy = S0 + mb(12 + R() * 28);
    if (fy - h < S0 + 3 || busy(x0 + w / 2, fy - h / 2, w, h, 5)) continue;
    room(x0, fy, w, h, 0);
    const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 0, kind: 'salao', x0: W1(x0), fy, top: fy - h };
    cmHalls.push(H); cmChambers.push(H); k++;
  }

  // ---------- 2e. as Galerias de Cera: favais (3 a 6 salas hexagonais coladas) ----------
  for (let k = 0, tries = 0; k < 8 * WSC && tries < 500; tries++) {
    const n = 3 + ((R() * 4) | 0), cx = (R() * WW) | 0, cy = S0 + mb(50 + R() * 36);
    if (busy(cx, cy, 34, 18, 5)) continue;
    const group = [];
    let x = cx - 16, fy = Math.round(cy + 4);
    for (let j = 0; j < n; j++) {
      const w = 9 + ((R() * 4) | 0), h = 6 + ((R() * 3) | 0);
      if (fy - h < S0 + mb(44) || fy > S0 + mb(90)) break;
      room(x, fy, w, h, 2);
      // a passagem para a sala seguinte: a parede compartilhada abre 2 x 3 rente ao chão
      const C = { cx: x + w / 2, cy: fy - h / 2, w, h, band: 1, kind: 'favo', x0: W1(x), fy, top: fy - h };
      group.push(C); cmFavos.push(C);
      const up = R() < 0.35, nx = x + w + (up ? -((w / 2) | 0) : 1), nfy = up ? fy - h - 1 : fy + (R() < 0.5 ? 0 : (R() < 0.5 ? -2 : 2));
      if (!up) for (let y = Math.max(fy, nfy) - 3; y < Math.max(fy, nfy); y++) { dig(x + w - 1, y); dig(x + w, y); }
      else for (let y = nfy; y <= fy - h; y++) for (let xx = nx + 1; xx < nx + 3; xx++) dig(xx, y);
      x = nx; fy = nfy;
    }
    if (!group.length) continue;
    const gx0 = Math.min(...group.map(c => c.cx - c.w / 2)), gx1 = Math.max(...group.map(c => c.cx + c.w / 2)), gy0 = Math.min(...group.map(c => c.top)), gy1 = Math.max(...group.map(c => c.fy));
    cmChambers.push({ cx: (gx0 + gx1) / 2, cy: (gy0 + gy1) / 2, w: gx1 - gx0, h: gy1 - gy0, band: 1, kind: 'faval', fy: group[0].fy, rooms: group });
    k++;
  }
  // o labirinto: galerias de degraus que se ramificam, com gargalos
  for (let k = 0; k < 30 * WSC; k++) {
    const x0 = (R() * WW) | 0, f0 = S0 + mb(48 + R() * 40), len = 16 + ((R() * 30) | 0), dir = R() < 0.5 ? -1 : 1;
    if (cv[I(x0, f0 - 1)] || cv[I(x0, f0 - 3)]) continue;
    const pts = stepTunnel(x0, f0, len, dir, 3, 0x7d00 + k, true);
    if (R() < 0.5 && pts.length > 10) { const [bx, bf] = pts[(pts.length / 2) | 0]; stepTunnel(bx, bf, 10 + ((R() * 20) | 0), -dir, 3, 0x7e00 + k, true); }
    const [ex, ef] = pts[pts.length - 1];
    cmChambers.push({ cx: x0 + dir * len / 2, cy: f0 - 2, w: len, h: 3, band: 1, kind: 'galeria', fy: ef, ends: [[W1(x0), f0], [ex, ef]], link: true });
  }

  // ---------- 2f. as Câmaras de Âmbar: redondas, forradas de resina, com 1 a 3 massas de âmbar ----------
  for (let k = 0, tries = 0; k < 6 * WSC && tries < 400; tries++) {
    const w = 14 + ((R() * 9) | 0), h = 10 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = S0 + mb(98) + h / 2 + R() * Math.max(0, mb(34) - h);
    if (busy(cx, cy, w, h, 6) || inCmHall(W1(cx), cy, w / 2 + 8)) continue;
    blob(cx, cy, w, h, 0x7f00 + k, 1.6);
    const C = { cx, cy, w, h, band: 2, kind: 'camara' };
    cmAmbar.push(C); cmChambers.push(C); k++;
  }
  // túneis curtos de resina entre as câmaras (a faixa é a que mais tem rocha)
  // ---------- 2g. o Berçário: mais câmaras de ovos e as outras galerias reais ----------
  for (let k = 0, tries = 0; cmNinhos.length < 6 * WSC && tries < 500; tries++) {
    const w = 12 + ((R() * 7) | 0), h = 8 + ((R() * 3) | 0), cx = (R() * WW) | 0, fy = S0 + mb(146) + ((R() * mb(34)) | 0);
    if (fy - h < S0 + CM_BANDS[3] + 1 || busy(cx, fy - h / 2, w, h, 6) || inCmHall(W1(cx), fy - h / 2, w / 2 + 6)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h, 2);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'ninho', x0: W1(x0), fy, top: fy - h };
    cmNinhos.push(C); cmChambers.push(C);
  }
  {   // galerias reais entre câmaras de ovos vizinhas (4 x WSC no total, contando as duas da esfera)
    const L = cmNinhos.slice().sort((a, b) => a.cx - b.cx);
    for (let k = 0, n = 0; k < L.length && n < 4 * WSC - 2; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const d = wdx(Q.cx - P.cx); if (d < 10 || d > 90 || inCmHall(W1(P.cx + d / 2), P.fy, 6)) continue;
      const xa = Math.round(P.cx + P.w / 2 - 1), xb = Math.round(P.cx + d - Q.w / 2 + 1); let f = P.fy;
      for (let x = xa; x <= xb; x++) {
        const t = (x - xa) / Math.max(1, xb - xa), want = Math.round(P.fy + (Q.fy - P.fy) * t);
        if (want !== f && (x - xa) % 2 === 0) f += Math.sign(want - f);
        if (inCmHall(W1(x), f, 3)) break;
        for (let y = f - 4; y < f; y++) dig(x, y);
        hard(x, f);
      }
      cmReais.push({ x0: W1(xa), len: xb - xa + 1, fy: P.fy, a: P, b: Q });
      n++;
    }
  }

  // ---------- 3. túneis de inseto: em volta do mundo em cada faixa, alguns entre faixas, e os poços com escada ----------
  const mouth = C => C.fy ? C.fy - 2 : C.cy + C.h * 0.25;
  const ends = (C, right) => C.ends ? (right ? C.ends[1] : C.ends[0]) : [right ? C.cx + C.w / 2 - 1 : C.cx - C.w / 2 + 1, mouth(C)];
  const RAD = [1.2, 1.15, 1.3, 1.3];
  for (let b = 0; b < 4; b++) {
    const L = cmChambers.filter(c => c.band === b && !c.nolink && !c.boss && c.kind !== 'galeria').sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      worm(ax, ay, bx, by, RAD[b], 0x7700 + b * 90 + k);
    }
  }
  // os túneis que furam os salões anões (Brecha): 10 x WSC, estreitos
  for (let k = 0; k < 10 * WSC; k++) { const x = (R() * WW) | 0, y = S0 + mb(6 + R() * 34); worm(x, y, x + (R() < 0.5 ? -1 : 1) * (20 + R() * 30), S0 + mb(6 + R() * 34), 1.1, 0x7a80 + k); }
  for (let b = 0; b < 3; b++) {
    const U = cmChambers.filter(c => c.band === b && !c.nolink && !c.boss), D = cmChambers.filter(c => c.band === b + 1 && !c.nolink && !c.boss);
    for (let k = 0; k < 3 * WSC && U.length && D.length; k++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      worm(P.cx, mouth(P), Q.cx, mouth(Q), 1.3, 0x77f0 + b * 9 + k);
    }
    // os poços de 3 com escada entre as faixas (2 x WSC por divisa): de um chão de cima até um túnel de baixo
    for (let k = 0, tries = 0; k < 2 * WSC && tries < 60; tries++) {
      const P = U[(R() * U.length) | 0]; if (!P || !P.fy) continue;
      const sx = W1(Math.round(P.cx) + ((R() * 5) | 0) - 2), Q = D.reduce((m, c) => Math.abs(wdx(c.cx - sx)) < Math.abs(wdx(m.cx - sx)) ? c : m);
      const yb = Math.round(mouth(Q)) + 1; if (yb - P.fy < 8 || yb - P.fy > 60 || inCmHall(sx, yb, 4)) continue;
      for (let y = P.fy - 1; y <= yb; y++) for (let x = sx; x < sx + 3; x++) dig(x, y);
      worm(sx + 1, yb - 1, Q.cx, mouth(Q), 1.3, 0x7af0 + b * 17 + k);
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

  // ---------- 4. as cascas: o que cada sala vira ----------
  const at = (x, y) => tiles[I(x, y)];
  const set = (x, y, t, w) => { const i = I(x, y); tiles[i] = t; if (w !== undefined) walls[i] = w; };
  const shell = (x, y, t) => { const i = I(x, y); if (SOLID[tiles[i]] && CM_SOILS[tiles[i]] && !cmKeep.has(i) && !inCmHall(W1(x), y)) tiles[i] = t; };
  const lining = (x0, y0, x1, y1, t, w, floorT) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (inCmHall(W1(x), y)) continue;
      if (SOLID[tiles[i]]) { const air = !SOLID[at(x - 1, y)] || !SOLID[at(x + 1, y)] || !SOLID[at(x, y - 1)] || !SOLID[at(x, y + 1)] || !SOLID[at(x - 1, y - 1)] || !SOLID[at(x + 1, y + 1)]; if (air || hash2(W1(x), y, seed ^ 0x51) < 0.5) shell(x, y, floorT && !SOLID[at(x, y - 1)] ? floorT : t); }
      else walls[i] = w;
    }
  };
  // os túneis de cada faixa: paredes de cera nova nas Galerias (os remendos), resina nas Câmaras
  for (let y = S0 + 1; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR) continue;
    const b = colmeiaBand(y);
    for (const j of [i - WW, i + WW, y * WW + W1(x - 1), y * WW + W1(x + 1)]) {
      const t = tiles[j]; if (!SOLID[t] || cmKeep.has(j)) continue;
      if (b === 1 && t === CM_CERA && hash2(x, y, seed ^ 0x77) < 0.45) tiles[j] = CM_CERA_NOVA;
      else if (b === 0 && t === CM_PEDRA_TOMADA && hash2(x, y, seed ^ 0x78) < 0.25) tiles[j] = CM_CERA;   // a cera inchando da pedra
    }
  }
  // os salões anões: casca de pedra tomada, chão liso de pedra, parede de pedra anã; as pontas comidas pela cera
  for (const H of cmHalls) {
    lining(H.x0 - 2, H.top - 2, H.x0 + H.w + 1, H.fy + 1, CM_PEDRA_TOMADA, WCM_PEDRA, CM_PEDRA_TOMADA);
    for (let x = H.x0; x < H.x0 + H.w; x++) { const i = I(x, H.fy); if (!cmKeep.has(i)) tiles[i] = CM_PEDRA_TOMADA; }
    for (const s of [-1, 1]) { const xe = s < 0 ? H.x0 - 2 : H.x0 + H.w + 1; for (let k = 0; k < 6; k++) for (let y = H.top - 2; y <= H.fy + 1; y++) { const x = xe - s * k; if (SOLID[at(x, y)] && hash2(W1(x), y, seed ^ 0x52) < 0.7 - k * 0.1) shell(x, y, CM_CERA); else if (!SOLID[at(x, y)] && k < 4) walls[I(x, y)] = WCM_CERA; } }
  }
  // os favos: casca de favo, alguns de mel, parede de hexágonos escuros
  for (const C of cmFavos) {
    for (let y = C.top - 2; y <= C.fy + 1; y++) for (let x = C.x0 - 2; x < C.x0 + C.w + 2; x++) {
      const i = I(x, y); if (inCmHall(W1(x), y)) continue;
      if (SOLID[tiles[i]]) shell(x, y, y < C.fy && hash2(W1(x), y, seed ^ 0x53) < 0.35 ? CM_FAVO_MEL : CM_FAVO); else walls[i] = WCM_FAVO;
    }
    for (let x = C.x0; x < C.x0 + C.w; x++) if (SOLID[at(x, C.fy)]) shell(x, C.fy, CM_CERA);
  }
  // as câmaras de âmbar: casca de resina de 2, parede de resina; 1 a 3 massas de âmbar presas na parede ou no chão
  for (const C of cmAmbar) {
    lining(Math.floor(C.cx - C.w / 2) - 3, Math.floor(C.cy - C.h / 2) - 3, Math.ceil(C.cx + C.w / 2) + 3, Math.ceil(C.cy + C.h / 2) + 3, CM_RESINA, WCM_RESINA);
    const n = 1 + ((R() * 3) | 0);
    for (let k = 0; k < n; k++) {
      const a = R() * Math.PI * 2, r = 2 + R() * 2.2, ex = C.cx + Math.cos(a) * C.w / 2, ey = C.cy + Math.abs(Math.sin(a)) * C.h / 2;   // na parede de baixo ou dos lados
      for (let y = Math.floor(ey - r); y <= ey + r; y++) for (let x = Math.floor(ex - r); x <= ex + r; x++) {
        if (Math.hypot(x + 0.5 - ex, (y + 0.5 - ey) * 1.2) > r || inCmHall(W1(x), y)) continue;
        const i = I(x, y); if (cmKeep.has(i) || y >= YB - 1) continue;
        tiles[i] = hash2(W1(x), y, seed ^ 0x54) < 1 / 12 ? CM_AMBAR_FOSSIL : CM_AMBAR; if (!walls[i]) walls[i] = WCM_RESINA;
      }
    }
  }
  // as câmaras de ovos: casca de cera real, cachos de ovos no chão e nas paredes, parede real
  for (const C of cmNinhos) {
    lining(C.x0 - 2, C.top - 2, C.x0 + C.w + 1, C.fy + 1, CM_CERA_REAL, WCM_REAL);
    for (let x = C.x0; x < C.x0 + C.w; x++) set(x, C.fy, CM_CERA_REAL);
    for (let k = 0, n = 3 + ((R() * 4) | 0); k < n; k++) {   // cachos: no chão (1 a 2 de altura) ou colados na parede
      const x = C.x0 + 2 + ((R() * (C.w - 4)) | 0);
      if (C.exit && Math.abs(wdx(x - C.cx)) < 4) continue;
      if (R() < 0.6) { const hh = R() < 0.4 ? 2 : 1; for (let y = C.fy - hh; y < C.fy; y++) if (at(x, y) === AIR) set(x, y, CM_OVO); }
      else { const s = R() < 0.5 ? -1 : 1; let xx = x; while (at(xx, C.fy - 3) === AIR && Math.abs(xx - x) < C.w) xx += s; const y = C.fy - 3 - ((R() * 3) | 0); for (const yy of [y, y + 1]) if (at(xx - s, yy) === AIR) set(xx - s, yy, CM_OVO); }
    }
  }
  // as galerias reais: chão e teto de quitina em placas, parede real (não dentro das câmaras de ovos)
  const inNinho = (x, y) => cmNinhos.some(C => wdx(x - C.x0) >= -2 && wdx(x - C.x0) < C.w + 2 && y >= C.top - 2 && y <= C.fy + 1);
  for (const G of cmReais) for (let k = -1; k <= G.len; k++) {
    const x = G.side ? (G.side > 0 ? G.x0 + k : G.x0 + k) : G.x0 + k;
    for (let y = G.fy - 7; y <= G.fy + 1; y++) {
      const i = I(x, y); if (inCmHall(W1(x), y) || y >= YB - 1 || inNinho(W1(x), y)) continue;
      if (!SOLID[tiles[i]]) { walls[i] = WCM_REAL; continue; }
      if (CM_SOILS[tiles[i]] && (!SOLID[at(x, y - 1)] || !SOLID[at(x, y + 1)])) tiles[i] = (k & 3) === 0 ? CM_CERA_REAL : CM_QUITINA;
    }
  }
  // a esfera: a caixa toda sólida, cera real com parede real (o 196 escreve dentro)
  {
    const B = cmBoss;
    for (let y = B.top; y <= B.bot; y++) for (let x = B.cx - 22; x <= B.cx + 21; x++) { const i = I(x, y); tiles[i] = CM_CERA_REAL; walls[i] = WCM_REAL; if (agua.length) agua[i] = 0; }
    for (const D of B.doors) for (let y = D.fy - 3; y < D.fy; y++) { const i = I(D.x, y); tiles[i] = AIR; walls[i] = WCM_REAL; cmKeep.add(i); }
  }
  // ---------- as brechas: crosta de cera na boca, o tubo com parede de cera, a escada; o pouso de pedra ----------
  for (const E of cmEntries) {
    const x0 = E.x0, L = E.land, y1 = L.fy - 6;
    for (let x = x0 - 3; x <= x0 + 5; x++) { const i = I(x, E.fy); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 3)) tiles[i] = CM_CERA; }   // a ferida: crosta escorrida em volta do furo
    for (let y = E.fy; y < y1; y++) {
      for (let x = x0; x < x0 + 3; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WCM_CERA; cmKeep.add(i); }
      for (const x of [x0 - 1, x0 + 3]) { const i = I(x, y); if (y > E.fy) { tiles[i] = (y - E.fy) % 5 === 4 ? CM_CERA_NOVA : CM_CERA; cmKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = CM_ESCADA_FAVO; cmKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 3; x++) cmKeep.add(I(x, y));
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= L.fy - 3 && y < L.fy) { tiles[i] = AIR; walls[i] = WCM_PEDRA; }
      else if (edge && !(y === L.fy - L.h - 1 && W1(x) >= x0 && wdx(x - x0) < 3)) tiles[i] = CM_PEDRA_TOMADA;
      else if (!edge) { tiles[i] = AIR; walls[i] = WCM_PEDRA; }
      else { tiles[i] = W1(x) === W1(x0 + 1) ? CM_ESCADA_FAVO : AIR; walls[i] = WCM_CERA; }
      cmKeep.add(i);
    }
    const lx = L.side > 0 ? L.x0 + 8 : L.x0 + 3; tiles[I(lx, L.fy - 1)] = CM_LANTERNA_ANA;
  }
  // ---------- os escorredouros: paredes de favo de mel, a escada inteira até a última linha ----------
  for (const X of cmExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 3; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WCM_FAVO; cmKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 3]) { const i = I(x, y); tiles[i] = CM_FAVO_MEL; cmKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = CM_ESCADA_FAVO; cmKeep.add(i); } }
    for (let x = X.x0 - 2; x <= X.x0 + 4; x++) cmKeep.add(I(x, X.top));
    tiles[I(X.x0 + 1, X.fy)] = CM_CERA_REAL;
  }

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x0de9);
  const vein = (ore, n, d0, d1, lmin, lmax, host) => {
    for (let k = 0; k < n; k++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !cmKeep.has(i) && !inCmHall(W1(x), y, 1)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(CM_O_CARVAO, 40 * WSC, 0, 186, 3, 8, t => t === CM_RESINA || t === CM_PEDRA_TOMADA);
  vein(CM_O_AMBRITA, 17 * WSC, 92, 138, 2, 5, t => t === CM_RESINA || t === CM_AMBAR);
  vein(CM_O_AMBRITA, 9 * WSC, 0, 186, 2, 4, t => t === CM_RESINA || t === CM_AMBAR);
}

function cmAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = CM_S0, YB = Math.min(WH - 8, S0 + CM_D), R3 = mulberry32(seed ^ 0x7d3c1);
  const cmRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!cmRow(y)) return; const i = I(x, y); if (cmKeep.has(i) || inCmHall(W1(x), y, 2)) return; if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WCM_CERA; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const cmSolid = t => SOLID[t] && CM_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };

  // ---------- 1. tudo alcançável das duas brechas ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || SOLID[tiles[s0]]) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of cmEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!cmEntries.length && cmChambers.length) flood(I(cmChambers[0].cx, Math.round(cmChambers[0].cy)));
  if (cmBoss) for (let y = cmBoss.top; y <= cmBoss.bot; y++) for (let x = cmBoss.cx - 22; x <= cmBoss.cx + 21; x++) reach[I(x, y)] = 1;
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
        const i = I(cx + dx, y); if (!reach[i] || SOLID[tiles[i]] || inCmHall(W1(cx + dx), y, 2)) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 1.4; if (d < bd) { bd = d; best = [cx, cy, cx + dx, y]; }
      }
    }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    worm(best[0], best[1], best[2], best[3], 1.2, 0x76a0 + pass);
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {   // a minhoca bateu numa borda guardada: um corredor pela rocha, contornando o que fica
      const org = new Int32Array(NN).fill(-1), q = []; let hit = -1; for (const c of bestC) { org[c] = c; q.push(c); }
      for (let h = 0; h < q.length && hit < 0; h++) {
        const c = q[h], x = c % WW, row = c - x;
        for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
          if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb] >= 0 || cmKeep.has(nb) || cmKeep.has(nb - WW) || tiles[nb] === BEDROCK || inCmHall(nb % WW, (nb / WW) | 0, 2)) continue;
          org[nb] = c; if (reach[nb] && !SOLID[tiles[nb]]) { hit = nb; break; }
          q.push(nb);
        }
      }
      for (let c = hit; c >= 0 && org[c] !== c; c = org[c]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }

  // ---------- 2. Escada de Favos em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || inCmHall(x, y, 3)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || CM_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (cmKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = CM_ESCADA_FAVO; used.add(i); }
      }
    }
  }
  // os poços de 3 entre faixas: a escada na coluna da esquerda, se ainda não tiver nada
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || SOLID[at(x - 1, y)] === 0 || !SOLID[at(x + 3, y)]) continue;
    if (!SOLID[at(x - 1, y)] || at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || CM_CLIMB(at(x, y - 1)) || inCmHall(x, y, 3)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (cmKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, CM_ESCADA_FAVO);
  }

  // ---------- 3. os estragos: mel escorrido nos favos (30% das salas), montes de cera nova nos túneis das Galerias ----------
  for (const C of cmFavos) {
    if (R3() > 0.3) continue;
    for (let x = C.x0 + 1; x < C.x0 + C.w - 1; x++) {
      const y = C.fy - 1, i = I(x, y); if (tiles[i] !== AIR || cmKeep.has(i) || !SOLID[at(x, C.fy)] || CM_CLIMB(at(x - 1, y)) || CM_CLIMB(at(x + 1, y))) continue;
      if (R3() < 0.55) put(x, y, CM_POCA_MEL);
    }
  }
  for (let k = 0, tries = 0; k < 14 * WSC && tries < 400 * WSC; tries++) {
    const x = (R3() * WW) | 0, y = S0 + CM_BANDS[1] + ((R3() * (CM_BANDS[2] - CM_BANDS[1])) | 0);
    if (at(x, y) !== AIR || !SOLID[at(x, y + 1)] || at(x, y - 1) !== AIR || at(x, y - 2) !== AIR || SOLID[at(x, y - 3)] === 0) continue;
    if (!SOLID[at(x, y - 3)]) continue;   // dentro de um túnel de 3: o monte tapa a metade de baixo
    const w = 2 + ((R3() * 3) | 0); let ok = true;
    for (let j = 0; j < w; j++) { const i = I(x + j, y); if (at(x + j, y) !== AIR || !SOLID[at(x + j, y + 1)] || cmKeep.has(i) || inCmLand(W1(x + j), y, 2)) ok = false; }
    if (!ok) continue;
    for (let j = 0; j < w; j++) put(x + j, y, CM_CERA_NOVA);
    k++;
  }

  // ---------- 4. os funis da formiga-leão: 3 x WSC nas Galerias e nas Câmaras, num chão largo e plano ----------
  for (const band of [1, 2]) {
    const r = 3, cand = [];
    for (let fy0 = S0 + CM_BANDS[band] + 2; fy0 < S0 + CM_BANDS[band + 1] - 4; fy0++) {
      let run = 0;
      for (let x = 0; x < WW + 2 * r + 3; x++) {
        const okc = cmSolid(at(x, fy0)) && cmSolid(at(x, fy0 + 1)) && cmSolid(at(x, fy0 + 3)) && at(x, fy0 - 1) === AIR && at(x, fy0 - 2) === AIR && !cmKeep.has(I(x, fy0)) && !cmKeep.has(I(x, fy0 - 1)) && !CM_CLIMB(at(x, fy0 - 1));
        run = okc ? run + 1 : 0;
        if (run >= 2 * r + 3) cand.push([W1(x - r - 1), fy0]);
      }
    }
    for (let k = 0, tries = 0; k < 3 * WSC && tries < 400 && cand.length; tries++) {
      const [cx, fy0] = cand[(R3() * cand.length) | 0];
      if (inCmHall(cx, fy0, 8) || inCmLand(cx, fy0, 6) || cmFunnels.some(F => Math.abs(wdx(F.cx - cx)) < 24 && Math.abs(F.fy - fy0) < 12)) continue;
      let ok = true; for (let dx = -r - 1; dx <= r + 1 && ok; dx++) for (let y = fy0 - 2; y <= fy0 + 4 && ok; y++) if (cmKeep.has(I(cx + dx, y)) || CM_CLIMB(at(cx + dx, y))) ok = false;
      if (!ok) continue;
      // o buraco em V, depois a casca de pó de cera por baixo e dos lados
      let fyB = fy0;
      for (let dx = -r; dx <= r; dx++) { const dep = Math.round((r - Math.abs(dx)) * 0.8); for (let y = fy0; y < fy0 + dep; y++) put(cx + dx, y, AIR); if (dx === 0) fyB = fy0 + dep; }
      for (let dx = -r - 1; dx <= r + 1; dx++) for (let y = fy0; y <= fy0 + 4; y++) { const t = at(cx + dx, y); if (SOLID[t] && (at(cx + dx, y - 1) === AIR || at(cx + dx, y - 2) === AIR || at(cx + dx - 1, y) === AIR || at(cx + dx + 1, y) === AIR)) put(cx + dx, y, CM_PO_CERA); }
      for (let dx = -r - 1; dx <= r + 1; dx++) for (let y = fy0 - 2; y <= fy0 + 4; y++) cmKeep.add(I(cx + dx, y));
      cmFunnels.push({ cx: W1(cx), fy: fyB, r: r + 1 });
      k++;
    }
  }

  // ---------- 5. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || cmKeep.has(i)) continue;
    const b = colmeiaBand(y); if (b < 0 || b > 3 || inCmHall(x, y, 2) || inCmLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = cmSolid(dn) && BLOCKY[dn] && dn !== CM_PO_CERA && dn !== CM_OVO && up === AIR, ceil = cmSolid(up) && BLOCKY[up] && up !== CM_OVO && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (gap <= 6 && gap >= 3 && SOLID[at(x, y + gap)] && cmSolid(at(x, y + gap)) && q < (b === 1 ? 0.012 : 0.004)) { for (let j = 0; j < gap; j++) put(x, y + j, CM_COLUNA); continue; }   // a coluna de cera, do teto ao chão
      if (b === 0) { if (q < 0.02) put(x, y, CM_GOTA_MEL); else if (q < 0.03) put(x, y, CM_CASULO); }
      else if (b === 1) { if (q < 0.04) put(x, y, CM_GOTA_MEL); else if (q < 0.05 && gap > 4) { for (let j = 0, n = 2 + ((R3() * 4) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, CM_FIO_CERA); } }
      else if (b === 2) { if (q < 0.025) { for (let j = 0, n = 1 + ((R3() * 3) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, CM_ESTALAC); } else if (q < 0.035) put(x, y, CM_GOTA_MEL); }
      else { if (q < 0.03) put(x, y, CM_CASULO); else if (q < 0.045) put(x, y, CM_GOTA_MEL); }
      continue;
    }
    if (!floor || CM_CLIMB(at(x - 1, y)) || CM_CLIMB(at(x + 1, y))) continue;
    if (b === 0) { if (q < 0.012) put(x, y, CM_OSSOS_ANAO); else if (q < 0.018) put(x, y, CM_ASA); else if (q < 0.022 && dn === CM_PEDRA_TOMADA) put(x, y, CM_LANTERNA_ANA); }
    else if (b === 1) { if (q < 0.012) put(x, y, CM_LARVA_LUZ); else if (q < 0.02) put(x, y, CM_ASA); }
    else if (b === 2) { if (q < 0.018) put(x, y, CM_BOLHA); else if (q < 0.026) put(x, y, CM_ASA); else if (q < 0.03) put(x, y, CM_OSSOS_ANAO); }
    else { if (q < 0.03) put(x, y, CM_LARVA_LUZ); else if (q < 0.036) put(x, y, CM_ASA); }
  }

  // ---------- 6. os objetos ----------
  cmPlaceProps();
}

/* ---------- as bocas das brechas por último; um monte de cera nova tapando o único caminho sai ---------- */
function cmExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of cmEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 3; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? CM_ESCADA_FAVO : AIR; cmKeep.add(i); }
  const reach = new Uint8Array(WW * WH), st = [];
  const flood = s0 => { if (reach[s0] || SOLID[tiles[s0]]) return; reach[s0] = 1; st.push(s0); while (st.length) { const c = st.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= 0 && nb < WW * WH && !reach[nb] && !SOLID[tiles[nb]]) { reach[nb] = 1; st.push(nb); } } };
  for (const E of cmEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (cmBoss) for (let y = cmBoss.top; y <= cmBoss.bot; y++) for (let x = cmBoss.cx - 22; x <= cmBoss.cx + 21; x++) reach[I(x, y)] = 1;
  const Y1 = Math.min(WH - 8, CM_S0 + CM_D);
  for (let sweep = 0, changed = true; changed && sweep < 50; sweep++) {
    changed = false;
    for (let i = CM_S0 * WW; i < Y1 * WW; i++) {
      const t = tiles[i]; if (t !== CM_CERA_NOVA || cmKeep.has(i) || inCmHall(i % WW, (i / WW) | 0, 1)) continue;
      const x = i % WW, row = i - x, nb = [i - WW, i + WW, row + W1(x - 1), row + W1(x + 1)];
      if (nb.some(j => reach[j]) && nb.some(j => !reach[j] && !SOLID[tiles[j]] && !inCmHall(j % WW, (j / WW) | 0))) { tiles[i] = AIR; flood(i); changed = true; }
    }
  }
}
/* ---------- a subida garantida: das aberturas da esfera, das câmaras de âmbar, das câmaras de ovos e do pé dos
   escorredouros o herói tem de conseguir voltar às brechas (pulo de 3 blocos, escadas e fios sobem) ---------- */
function cmClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = CM_S0, YB = Math.min(WH - 8, S0 + CM_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1, L = (x, y) => CM_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !S(x, y) && !S(x, y - 1), H = YB - Y0;
  const seen = new Uint8Array(WW * H * 5), any = new Uint8Array(WW * H), from = new Int32Array(WW * H * 5), good = new Uint8Array(WW * H * 5);
  const search = (sx, sy) => {
    seen.fill(0); any.fill(0); const q = []; let cur = -1, hit = -1;
    const push = (x, y, r) => { x = W1(x); if (y <= Y0 || y >= YB || !ok(x, y) || inCmHall(x, y)) return; if (S(x, y + 1) || L(x, y) || L(x, y - 1)) r = 4; const k = ((y - Y0) * WW + x) * 5 + r; if (seen[k]) return; seen[k] = 1; from[k] = cur; any[(y - Y0) * WW + x] = 1; q.push(x, y, r); if (good[k] && hit < 0) hit = k; };
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
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || cmKeep.has(I(x, y)) || inCmHall(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !S(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!S(x, t)) continue;
        const tt = tiles[I(x, t)];
        if ((tt === CM_CERA_NOVA || tt === CM_CERA || tt === CM_FAVO) && !cmKeep.has(I(x, t)) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || tiles[i] === CM_CERA_NOVA || tiles[i] === CM_CERA || tiles[i] === CM_FAVO) { tiles[i] = CM_ESCADA_FAVO; if (!walls[i]) walls[i] = WCM_CERA; } }
    return true;
  };
  const starts = [];
  if (cmBoss) for (const D of cmBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const c of cmAmbar) starts.push([Math.round(c.cx), Math.round(c.cy)]);
  for (const c of cmNinhos) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const X of cmExits) starts.push([X.x0 + 2, X.fy - 1]);
  let fixes = 0;
  let ns = 0; for (const [x, y] of starts) { if (SOLID[tiles[I(x, y)]]) continue; for (let k = 0; k < 12 && (ns++, !search(W1(x), y)); k++) { if (!repair()) break; fixes++; } }
  cmClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (192): por faixa, no chão, debaixo do teto e na parede; as flags do 192 decidem onde cada um
   pode ficar (brecha: só nos salões anões; camara: só nas câmaras de âmbar; ninho: só nas câmaras de ovos). Nunca
   sobre poça de mel, ovo, escada, fio, funil; nunca no pouso nem na esfera ---------- */
function cmPlaceProps() {
  if (typeof CM_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9b3c7);
  const S0 = CM_S0, YB = Math.min(WH - 8, S0 + CM_D), used = new Uint8Array(WW * WH * 2), BF = typeof CM_BACK_FLOOR !== 'undefined' ? CM_BACK_FLOOR : {};
  const inside = (L, x, y) => L.some(C => C.x0 !== undefined ? wdx(x - C.x0) >= 0 && wdx(x - C.x0) < C.w && y >= C.top - 1 && y <= C.fy : Math.abs(wdx(x - C.cx)) <= C.w / 2 + 1 && Math.abs(y - C.cy) <= C.h / 2 + 1);
  const where = (def, x, y) => (!def.brecha || inside(cmHalls, x, y)) && (!def.camara || inside(cmAmbar, x, y)) && (!def.ninho || inside(cmNinhos, x, y));
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || (needAir && t !== AIR) || !walls[i] || cmKeep.has(i) || inCmHall(W1(x), y, 1) || inCmLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && CM_SOILS[t] && t !== CM_PO_CERA; };
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = CM_BAND_NAMES[clamp(colmeiaBand(y), 0, 3)], plan = CM_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inCmHall(W1(k), y, 2) || inCmLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
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

// a ordem: a camada, a esfera da Rainha (196: cmDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc();
  if (!COLMEIA) return;
  try { cmBuild(); cmAfter(); if (typeof cmDress === 'function') cmDress(); cmExitClear(); cmClimbFix(); } catch (err) { console.error(err); }
}; }

/* ---------- a terceira camada atrás da colmeia: salões anões afogados na Brecha, favos gigantes, âmbar com sombras ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!COLMEIA) return;
  const Y1 = Math.min(WH, CM_S0 + CM_D + 4);
  for (let y = CM_S0 - 4; y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - CM_S0) + (depthNz(x, y, 25, seed ^ 0x7e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x7e12);
    DEEPT[i] = d < 40 ? (n > 0.4 ? DP_CM_FORTALEZA : DP_CM_FAVOS) : d < 92 ? DP_CM_FAVOS : d < 138 ? (n > 0.45 ? DP_CM_AMBAR : DP_CM_FAVOS) : (n > 0.6 ? DP_CM_AMBAR : DP_CM_FAVOS);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (COLMEIA && ty >= CM_S0 && ty < CM_S0 + CM_D) return CM_ZONE0 + clamp(colmeiaBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6); a formiga-leão não nasce pelo spawn comum (mora nos funis, abaixo)
Object.assign(CATH_SPAWN, {
  [CM_ZONE0]: [[['operaria', 4], ['soldada', 2], ['correicao', 2], ['vespa', 3], ['cigarra', 2]], 8],
  [CM_ZONE0 + 1]: [[['operaria', 4], ['soldada', 2], ['correicao', 3], ['larva', 3], ['bombardeiro', 2]], 9],
  [CM_ZONE0 + 2]: [[['vespa', 3], ['zangao', 2], ['bombardeiro', 2], ['cigarra', 2], ['parasita', 2]], 8],
  [CM_ZONE0 + 3]: [[['larva', 4], ['parasita', 3], ['zangao', 2], ['soldada', 2], ['operaria', 3]], 10]
});
// tipos que ainda não existem saem da tabela (o 193 e o 194 registram os insetos)
for (let z = CM_ZONE0; z < CM_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const CM_NO_SPAWN = (tx, ty) => inCmLand(tx, ty, 3) || inCmHall(tx, ty, 2) || cmExits.some(X => Math.abs(wdx(tx - X.cx)) < 3 && ty >= X.top - 2);
// níveis 19 e 20 (layerLvl no 52, a posição no 129); nada nasce no pouso, na esfera nem dentro dos escorredouros
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!COLMEIA || !e || e.boss || (D && D.boss) || e.cmMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - CM_S0;
  if (d >= 0 && d < CM_D) {
    if (zone >= CM_ZONE0 && zone <= CM_ZONE0 + 3 && CM_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.cmVoid = true; return e; }
    const lvl = layerLvl(layerLo('colmeia'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].cmVoid) enemies.splice(k, 1); });
// a formiga-leão mora nos funis: um funil vazio perto do herói (fora da tela) ganha uma de volta, no máximo a cada 2 min
let cmFunT = 3;
HOOK.update.push(dt => {
  if (!COLMEIA || !pl || pl.dead || state !== 'play' || !ET.formigaleao || !cmFunnels.length || (cmFunT -= dt) > 0) return;
  cmFunT = 3;
  const ptx = (pl.x + pl.w / 2) / T, pty = (pl.y + pl.h / 2) / T, halfW = VW / 2 / T + 2;
  for (const F of cmFunnels) {
    const dx = Math.abs(wdx(F.cx - ptx)), dy = Math.abs(F.fy - pty);
    if (dx < halfW && dy < VH / 2 / T + 2) continue;
    if (dx > 50 || dy > 25 || gameTime - (F.t || -999) < 120) continue;
    if (enemies.some(e => e.type === 'formigaleao' && !e.dead && e.funnel === F)) continue;
    if (SOLID[tileAt(F.cx, F.fy - 1)]) continue;   // o funil foi tapado
    F.t = gameTime;
    const e = spawnEnemy('formigaleao', F.cx * T + T / 2 - ET.formigaleao.w / 2, F.fy * T - ET.formigaleao.h, CM_ZONE0 + clamp(colmeiaBand(F.fy), 0, 3));
    if (e && !e.dead) e.funnel = F;
  }
});

/* ---------- partículas: pó de cera boiando devagar em toda a camada, mais denso nas Galerias; no Berçário um vapor
   morno subindo ---------- */
HOOK.update.push(dt => {
  if (!COLMEIA || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = colmeiaBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 1 ? 5 : 3)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (air(x, y)) parts.push(b === 3 && Math.random() < 0.4 ? { x, y, vx: rnd(-2, 2), vy: rnd(-7, -3), g: -1, life: 3, max: 3, col: '#5a3a2a', size: 1 }
      : { x, y, vx: rnd(-3, 3), vy: rnd(-1, 2), g: 1, life: 4, max: 4, col: Math.random() < 0.6 ? '#8a6e28' : '#d8b850', size: 1 });
  }
});

/* ---------- a poça de mel deixa o herói 40% mais lento (o 199 conta o tempo; aqui só o pé no mel) ---------- */
const cmNoMel = () => { if (!pl) return false; const y = Math.floor((pl.y + pl.h - 1) / T); for (const x of [Math.floor((pl.x + 1) / T), Math.floor((pl.x + pl.w - 1) / T)]) if (tileAt(x, y) === CM_POCA_MEL) return true; return false; };

/* ---------- a forja e o vilarejo: a ambrita na fornalha (197 tem os itens), as lojas ---------- */
FURN.min_ambrita = { bar: 'barra_ambrita', n: 7, t: 10 };
Object.assign(MAT_VAL, { min_ambrita: 48, barra_ambrita: 340, cera_bruta: 4, mel_escuro: 12, geleia_real: 34, ferrao: 16, ambar_fossil: 90 });
{ const o = SHOPS.taverneiro, b = o.buys; o.buys = id => b(id) || id === 'mel_escuro'; o.hint = o.hint.replace(/\.$/, '') + ' e mel escuro.'; }
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'mel_escuro' || id === 'geleia_real'; c.hint = c.hint.replace(/\.$/, '') + ', mel escuro e geleia real.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_ambrita', 'barra_ambrita', 'cera_bruta', 'ferrao', 'ambar_fossil'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', ambrita, cera, ferrões e âmbar com fóssil.'; }
if (SHOPS.maga) { const m = SHOPS.maga, b = m.buys; if (typeof b === 'function') { m.buys = id => b(id) || id === 'geleia_real'; if (m.hint) m.hint = m.hint.replace(/\.$/, '') + ' e geleia real.'; } }
