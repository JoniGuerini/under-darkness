'use strict';

/* ================= o Covil do Dragão: o mundo (docs/camadas/11-covil-dragao.md, seção 3) =================
   Debaixo da camada de cima (dgAbove, 270: o Mar Sem Sol, ou o Reino Élfico enquanto o Mar não existe). Um vulcão vivo
   visto por dentro: rocha cheia, não oca como o Abismo. Em passos:
     1. a rocha por faixa: a rocha de cima afina e vira tufo; tufo com lascas de andesito nas Chaminés; andesito com
        bolsões de pomes nos Túneis; lava cordada com obsidiana rajada nos Tubos; obsidiana rajada com veios de osso de
        dragão no Leito
     2. as salas: as duas chaminés de entrada (o poço de 4 com a escada de cravos e a câmara de pouso 14 x 6), a
        Cratera do Tesouro do outro lado do mundo (a caixa sólida que o 277 veste com dgDress) e os dois corredores até
        as portas, as chaminés verticais e as grutas de vapor, as galerias kobold, as tocas e os santuários, os tubos
        de lava (um em cada três com o canal de magma e o andaime por cima), os ninhos de draco, as câmaras do tesouro e
        as duas descidas dos Tubos Frios
     3. as ligações: túneis de minhoca nas Chaminés, nos Tubos e no Leito, galerias retas nos Túneis, 3 x WSC descidas
        por divisa de faixa
     4. as cascas: taipa nas tocas e galerias, lava cordada e obsidiana nos tubos, osso no Leito, o ouro solto em montes
        baixos (até 3, encosta de 45°) nas câmaras do tesouro e nas oferendas dos santuários
     5. os veios: carvão no tufo e no andesito; dracônio na obsidiana e no osso, só a até 6 blocos de magma ou de ouro
   Depois (dgAfter): tudo alcançável das descidas, escada de cravos (Túneis) ou corda (o resto) em todo desnível de 5,
   os estragos (entulho de pomes nos Túneis, estalactites de lava nos Tubos), os fios de armadilha nas galerias, a
   decoração de 1 bloco, os objetos (272). Por fim a Cratera (277: dgDress), as bocas e a subida garantida (dgClimbFix).
   O ouro solto nunca fica em degrau de subida nem debaixo de objeto. O magma (a lava do jogo) só no fundo dos canais,
   sempre com o andaime por cima, e na cratera. O 87 liga o resto depois.
   Também: a terceira camada, as zonas 61 a 64, o spawn por faixa e o nível (pela posição no 129), as partículas, o
   dracônio na fornalha e nas lojas. */

const DG_SOILS = new Uint8Array(NT);   // o chão da camada: onde decoração e objetos podem ficar
for (const t of [DG_TUFO, DG_ANDESITO, DG_POMES, DG_LAVA_CORDA, DG_OBSIDIANA, DG_TAIPA, DG_ANDAIME, DG_OSSO, DG_OURO_DURO, DG_CROSTA, DG_O_CARVAO, DG_O_DRACONIO]) DG_SOILS[t] = 1;
let dgChambers = [], dgCorr = [], dgChim = [];
const DG_CLIMB = t => t === DG_ESCADA || t === DG_CORDA || t === CHAIN || t === dgAbove().climb;
const DG_HOT = t => t === LAVA || t === DG_CORTINA || t === DG_OURO_QUENTE;   // o que queima: a reachability não passa

function dgBuild() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const A = dgAbove();
  DG_S0 = Math.min(WH - 12, A.S0 + Math.min(A.D, WH - 8 - A.S0));
  const S0 = DG_S0, YB = Math.min(WH - 8, S0 + DG_D), DB = YB - S0;
  const R = mulberry32(seed ^ 0x7d2a), nz = (x, y, c, s) => depthNz(W1(x), y, c, seed ^ s);
  const mb = m => Math.round(m * DB / LAYER_DESIGN);
  const bandOf = d => d < DG_BANDS[1] ? 0 : d < DG_BANDS[2] ? 1 : d < DG_BANDS[3] ? 2 : 3;
  // a camada é LAYER_K vezes mais alta que o desenho (186 metros): cada faixa vira K andares da altura de antes, um
  // embaixo do outro. lv(d, j): a linha da profundidade d do desenho, no andar j da faixa de d; lvOf(y): o andar
  // (0 a 4K - 1) de uma linha
  const K = LAYER_K, BD = DG_BANDS.map(v => v / K);
  const lv = (d, j) => { let b = 0; while (b < 3 && d >= BD[b + 1]) b++; return S0 + Math.round((BD[b] * K + j * (BD[b + 1] - BD[b]) + d - BD[b]) * DB / DG_D); };
  const lvOf = y => { const d = (y - S0) * DG_D / DB, b = bandOf(d), h = (DG_BANDS[b + 1] - DG_BANDS[b]) / K; return b * K + clamp(Math.floor((d - DG_BANDS[b]) / h), 0, K - 1); };
  const canCarve = (x, y) => y >= S0 + 1 && y <= YB - 3;
  dgChambers = []; dgCorr = []; dgChim = [];
  dgEntries = []; dgLand = []; dgExits = []; dgBoss = null; dgDens = []; dgTubes = []; dgNests = []; dgHoards = []; dgVents = []; dgKeep.clear();
  const upSoil = t => (A.soils && A.soils[t]) || t === A.thin;

  // ---------- 1. a rocha ----------
  for (let x = 0; x < WW; x++) {
    for (let y = S0 - 10; y < S0; y++) {   // a rocha de cima afina nas últimas 10 linhas e vira tufo: o calor começa
      const i = y * WW + x, k = (y - (S0 - 10)) / 10, h = nz(x, y, 12, 0x7b2);
      if (SOLID[tiles[i]] && upSoil(tiles[i]) && h < k * 0.85) tiles[i] = DG_TUFO;
    }
    for (let y = S0; y < WH; y++) {
      const i = y * WW + x, t = tiles[i];
      if (t === BEDROCK || y >= WH - 3) continue;
      if (y >= YB) { tiles[i] = DG_OBSIDIANA; walls[i] = WDG_OBSIDIANA; continue; }   // abaixo da camada: sem ruído (a de baixo escreve por cima)
      const d = y - S0 + (nz(x, y, 18, 0x7b3) - 0.5) * 10, b = bandOf(Math.max(0, d)), n1 = nz(x, y, 26, 0x7a1), n2 = nz(x, y, 14, 0x7a2);
      let tt = DG_TUFO, w = WDG_TUFO;
      if (b === 0) { if (n1 > 0.72 || (d > 36 && n2 > 0.62)) { tt = DG_ANDESITO; w = WDG_ANDESITO; } }
      else if (b === 1) { tt = n2 > 0.8 ? DG_POMES : n1 > 0.84 ? DG_TUFO : DG_ANDESITO; w = WDG_ANDESITO; }
      else if (b === 2) { tt = n1 > 0.62 ? DG_OBSIDIANA : n2 > 0.86 ? DG_POMES : DG_LAVA_CORDA; w = WDG_LAVA; }
      else { const rib = Math.abs(nz(x, y, 22, 0x7a4) - 0.5); tt = rib < 0.03 ? DG_OSSO : n1 > 0.8 ? DG_LAVA_CORDA : DG_OBSIDIANA; w = WDG_OBSIDIANA; }
      tiles[i] = tt; walls[i] = w;
      if (y < YB && agua.length) agua[i] = 0;
    }
  }

  // ---------- 2. as salas ----------
  const cv = new Uint8Array(NN), keep = new Uint8Array(NN), seal = new Uint8Array(NN);
  const dig = (x, y) => { if (!canCarve(x, y)) return; const i = I(x, y); if (seal[i]) return; cv[i] = 1; keep[i] = 1; };
  const hard = (x, y) => { const i = I(x, y); if (!seal[i]) { cv[i] = 0; keep[i] = 1; } };
  const busy = (cx, cy, w, h, m = 4) => dgChambers.some(c => Math.abs(wdx(c.cx - cx)) < (c.w + w) / 2 + m && Math.abs(c.cy - cy) < (c.h + h) / 2 + m);
  const room = (x0, fy, w, h) => { for (let y = fy - h; y < fy; y++) for (let x = x0; x < x0 + w; x++) dig(x, y); for (let x = x0; x < x0 + w; x++) hard(x, fy); };
  const blob = (cx, cy, w, h, s, flat = 1.5) => {
    for (let y = Math.floor(cy - h / 2 - 2); y <= cy + h / 2 + 2; y++) for (let x = Math.floor(cx - w / 2 - 2); x <= cx + w / 2 + 2; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy0 = (y + 0.5 - cy) / (h / 2), dy = dy0 > 0 ? dy0 * flat : dy0;
      if (dx * dx + dy * dy < 1 + (hash2(W1(x) >> 1, y >> 1, s) - 0.5) * 0.18 + (nz(x, y, 40, s) - 0.5) * 0.25) dig(x, y);
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
  // rampa: a minhoca em zigue-zague de xa,ya até xb,yb, cada perna desce no máximo ~11 andando 14 a 23 de lado
  const ramp = (xa, ya, xb, yb, r, s) => {
    const Rr = mulberry32(seed ^ s ^ 0x5a17), dy = yb - ya, n = Math.max(1, Math.ceil(Math.abs(dy) / 11));
    let x = xa, y = ya, dir = wdx(xb - xa) < 0 ? -1 : 1;
    for (let k = 1; k <= n; k++) {
      const ny = Math.round(ya + dy * k / n), nx = k === n ? xa + wdx(xb - xa) : x + dir * (14 + ((Rr() * 10) | 0));
      worm(x, y, nx, ny, r, s + k * 131); x = nx; y = ny; dir = -dir;
    }
  };
  // galeria kobold: corredor reto de 4 no chão fa de xa até xb; se o chão de destino for outro, degraus (um a cada 2)
  const gallery = (xa, fa, xb, fb, list, hh = 4) => {
    const d = wdx(xb - xa), s = d < 0 ? -1 : 1, steps = Math.abs(fb - fa), flat = Math.max(0, Math.abs(d) - steps * 2);
    let x = xa, f = fa;
    for (let k = 0; k <= flat; k++, x += s) { for (let y = f - hh; y < f; y++) dig(x, y); hard(x, f); }
    if (list && flat > 6) list.push({ x0: W1(s > 0 ? xa : xa - flat), len: flat + 1, fy: fa, h: hh });
    const fs = fb > fa ? 1 : -1;
    for (let k = 0; k < steps * 2; k++, x += s) { if (k % 2 === 1) f += fs; for (let y = f - hh; y < f; y++) dig(x, y); hard(x, f); }
  };

  // (a descida só fica de fora se cair dentro do salão do chefe de cima: na largura dele e não abaixo do chão dele; antes o Mar perdia uma das duas)
  // ---------- 2a. as duas chaminés de entrada: do poço de cima, um poço de 4 com a escada de cravos até a câmara de pouso ----------
  {
    const ub = A.boss, halls = (A.halls || []).map(c => ({ cx: c.cx !== undefined ? c.cx : c.x0 + (c.w || 4) / 2, x0: c.x0, fy: c.fy })).filter(c => c.fy && c.fy < S0 + 2 && (!ub || (ub.fy !== undefined && c.fy > ub.fy + 2) || Math.abs(wdx(c.cx - ub.cx)) > (ub.r || (ub.w ? ub.w / 2 : 20)) + 1)).sort((a, b) => a.cx - b.cx);
    const picks = [];
    for (let n = 0; n < halls.length && picks.length < 2; n++) { const c = halls[(n * 5 + ((R() * halls.length) | 0)) % halls.length]; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 80)) picks.push(c); }
    for (const c of halls) { if (picks.length >= 2) break; if (!picks.includes(c) && picks.every(p => Math.abs(wdx(p.cx - c.cx)) > 40)) picks.push(c); }
    if (!picks.length) picks.push({ cx: (R() * WW) | 0, fy: S0 - 2 }, { cx: (R() * WW) | 0, fy: S0 - 2 });
    for (const c of picks) {
      const xs = c.x0 !== undefined ? W1(c.x0) : W1(Math.round(c.cx) - 1), side = R() < 0.5 ? -1 : 1;
      const landFy = clamp(c.fy + 28 + ((R() * 6) | 0), S0 + 14, S0 + mb(34));
      const hx = side > 0 ? xs - 1 : xs - 10;   // o poço cai numa ponta da câmara (14 x 6)
      for (let y = landFy - 7; y <= landFy + 1; y++) for (let x = hx - 1; x <= hx + 14; x++) seal[I(x, y)] = 1;
      for (let y = landFy - 6; y < landFy; y++) for (let x = hx; x < hx + 14; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
      const door = side > 0 ? hx + 14 : hx - 1;
      for (let y = landFy - 3; y < landFy; y++) { const i = I(door, y); cv[i] = 1; keep[i] = 1; seal[i] = 0; }
      const L = { x0: W1(hx), fy: landFy, w: 14, h: 6, door: W1(door), side };
      dgLand.push(L);
      for (let y = c.fy; y <= landFy - 6; y++) for (let x = xs; x < xs + 4; x++) { const i = I(x, y); seal[i] = 0; if (y >= S0 + 1) { cv[i] = 1; keep[i] = 1; } }
      // uma gruta de vapor logo depois da porta: o primeiro pedaço do vulcão que o herói vê
      const w = 16 + ((R() * 8) | 0), h = 8, x0 = side > 0 ? door + 1 : door - w;
      room(x0, landFy, w, h);
      const H = { cx: x0 + w / 2, cy: landFy - h / 2, w, h, band: 0, kind: 'vapor', x0: W1(x0), fy: landFy, top: landFy - h };
      dgChambers.push(H);
      dgChambers.push({ cx: hx + 7, cy: landFy - 3, w: 14, h: 6, band: 0, kind: 'pouso', nolink: true });
      dgEntries.push({ x0: xs, fy: c.fy, top: c.fy - 2, land: L });
    }
  }

  // ---------- 2b. a Cratera do Tesouro, do outro lado do mundo, e os dois corredores até as portas (no alto da tigela) ----------
  {
    const w = 90, h = 44;
    const ax = dgEntries.length ? dgEntries.reduce((s, e) => s + wdx(e.x0 - dgEntries[0].x0), 0) / dgEntries.length + dgEntries[0].x0 : SPX;
    const cx = W1(Math.round(ax + WW / 2 + (R() - 0.5) * 30)), fy = Math.min(YB - 14, S0 + mb(176)), top = fy - h;   // longe das 10 linhas que a camada de baixo afina
    dgBoss = { cx, x0: W1(cx - 45), x1: W1(cx + 44), w, h, top, fy,
      doors: [{ side: -1, x: W1(cx - 49), fy: top + 12 }, { side: 1, x: W1(cx + 48), fy: top + 12 }] };
    for (let y = top - 5; y <= fy + 5; y++) for (let x = cx - 50; x <= cx + 49; x++) seal[I(x, y)] = 1;
    dgChambers.push({ cx, cy: fy - h / 2, w: w + 10, h: h + 10, band: 3, boss: true, nolink: true });
    for (const D of dgBoss.doors) {
      const len = 26 + ((R() * 12) | 0), fyD = D.fy;
      let x = D.x;
      for (let k = 0; k < len; k++) {
        for (let y = fyD - 4; y < fyD; y++) { const i = I(x, y); seal[i] = 0; cv[i] = 1; keep[i] = 1; }
        hard(x, fyD); dgKeep.add(I(x, fyD));
        x += D.side;
      }
      dgCorr.push({ x0: D.side > 0 ? W1(D.x) : W1(D.x - len + 1), len, fy: fyD, h: 4, boss: true });
      dgChambers.push({ cx: D.x + D.side * len / 2, cy: fyD - 2, w: len, h: 4, band: 2, kind: 'servico', nolink: true });
      // uma câmara do tesouro no fim do corredor: o ouro que sobrou do lado de fora
      const gw = 22 + ((R() * 8) | 0), gh = 11, gx0 = D.side > 0 ? x - 1 : x - gw + 2;
      room(gx0, fyD, gw, gh);
      const C = { cx: gx0 + gw / 2, cy: fyD - gh / 2, w: gw, h: gh, band: dragonBandAt(fyD), kind: 'tesouro', x0: W1(gx0), fy: fyD, top: fyD - gh };
      dgHoards.push(C); dgChambers.push(C);
    }
  }
  function dragonBandAt(y) { return clamp(bandOf(y - S0), 0, 3); }
  const awayFromBoss = (cx, cy, m) => !dgBoss || Math.abs(wdx(cx - dgBoss.cx)) > dgBoss.w / 2 + 8 + m || cy < dgBoss.top - 8 - m || cy > dgBoss.fy + 8 + m;

  // ---------- 2c. os Tubos Frios: duas câmaras no Leito, longe uma da outra e da cratera, com o tubo frio descendo ----------
  for (let tries = 0; dgExits.length < 2 && tries < 600; tries++) {
    const w = 18 + ((R() * 6) | 0), h = 10, cx = (R() * WW) | 0, fy = YB - 13 - ((R() * 8) | 0);   // no andar de baixo: o tubo frio é curto
    if (!awayFromBoss(cx, fy, 64) ||   // longe o bastante para o Ossário aceitar a descida (ele pede w + 20 do centro da cratera)
      dgExits.some(e => Math.abs(wdx(e.cx - cx)) < (tries < 400 ? WW / 3 : WW / 5)) || busy(cx, fy - h / 2, w, h, 5)) continue;
    const x0 = cx - (w >> 1); room(x0, fy, w, h);
    const C = { cx, cy: fy - h / 2, w, h, band: 3, kind: 'tubofrio', x0: W1(x0), fy, top: fy - h, exit: true };
    dgChambers.push(C);
    const sx = W1(cx - 2);
    for (let y = fy; y < YB - 1; y++) for (let x = sx - 1; x <= sx + 5; x++) seal[I(x, y)] = x >= sx && x < sx + 5 ? 0 : 1;
    for (let y = fy; y < YB - 1; y++) for (let x = sx; x < sx + 5; x++) { const i = I(x, y); cv[i] = 1; keep[i] = 1; }
    dgExits.push({ x0: sx, x1: W1(sx + 4), cx: W1(cx), w: 5, fy: YB - 1, top: fy, C });
  }

  // ---------- 2d. as Chaminés de Vapor: chaminés verticais e grutas de vapor ----------
  for (let k = 0, tries = 0; k < 6 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 4 + ((R() * 4) | 0), h = 18 + ((R() * 15) | 0), x0 = (R() * WW) | 0, fy = lv(8, j) + h + ((R() * Math.max(1, 36 - h)) | 0);
    if (fy > lv(8, j) + 44 || busy(x0 + w / 2, fy - h / 2, w, h, 5)) continue;
    room(x0, fy, w, h);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 0, kind: 'chamine', x0: W1(x0), fy, top: fy - h };
    dgChim.push(C); dgChambers.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 8 * WSC * K && tries < 400 * K; tries++) {
    const j = k % K, w = 14 + ((R() * 11) | 0), h = 7 + ((R() * 5) | 0), cx = (R() * WW) | 0, cy = lv(6, j) + h / 2 + R() * Math.max(0, 32 - h);
    if (busy(cx, cy, w, h, 5)) continue;
    blob(cx, cy, w, h, 0x7d00 + k, 1.9);
    dgChambers.push({ cx, cy, w, h, band: 0, kind: 'vapor', fy: Math.round(cy + h / 2) }); k++;
  }

  // ---------- 2e. os Túneis Kobold: galerias retas, tocas, santuários ----------
  for (let k = 0, tries = 0; k < 10 * WSC * K && tries < 600 * K; tries++) {
    const len = 30 + ((R() * 41) | 0), hh = 3 + ((R() * 2) | 0), x0 = (R() * WW) | 0, fy = lv(52 + R() * 44, k % K);
    if (busy(x0 + len / 2, fy - 2, len, hh + 1, 3)) continue;
    for (let j = 0; j < len; j++) { for (let y = fy - hh; y < fy; y++) dig(x0 + j, y); hard(x0 + j, fy); }
    const C = { cx: x0 + len / 2, cy: fy - hh / 2, w: len, h: hh, band: 1, kind: 'galeria', x0: W1(x0), fy, top: fy - hh, len };
    dgCorr.push({ x0: W1(x0), len, fy, h: hh, kobold: true }); dgChambers.push(C); k++;
  }
  const dens = (n, shrine) => {
    for (let k = 0, tries = 0; k < n && tries < 500 * K; tries++) {
      const j = k % K, w = shrine ? 16 : 8 + ((R() * 7) | 0), h = shrine ? 9 : 5 + ((R() * 3) | 0), x0 = (R() * WW) | 0, fy = lv(54 + R() * 42, j);
      if (fy - h < lv(47, j) || busy(x0 + w / 2, fy - h / 2, w, h, 4) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2)) continue;
      room(x0, fy, w, h);
      if (!shrine) for (let x = x0 + 1; x < x0 + w - 1; x++) dig(x, fy - h - 1);   // a toca tem o teto em arco baixo
      const H = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 1, kind: shrine ? 'santuario' : 'toca', x0: W1(x0), fy, top: fy - h, shrine: !!shrine };
      dgDens.push(H); dgChambers.push(H); k++;
    }
  };
  dens(3 * WSC * K, true); dens(14 * WSC * K, false);

  // ---------- 2f. os Tubos de Lava: tubos compridos e redondos (um em cada três com o canal de magma), ninhos de draco ----------
  for (let k = 0, tries = 0; k < 8 * WSC * K && tries < 500 * K; tries++) {
    const len = 40 + ((R() * 71) | 0), hh = 5 + ((R() * 4) | 0), x0 = (R() * WW) | 0, fy = lv(106 + R() * 40, k % K);
    if (busy(x0 + len / 2, fy - hh / 2, len, hh, 5) || !awayFromBoss(x0 + len / 2, fy - hh / 2, len / 2)) continue;
    // a seção redonda: o teto em arco que sobe e desce devagar, o chão quase plano
    const ph = R() * 6, amp = 1 + R() * 2;
    for (let j = 0; j < len; j++) {
      const u = j / len, end = Math.min(1, Math.min(u, 1 - u) * 10), H = Math.max(3, Math.round((hh + Math.sin(j * 0.07 + ph) * amp) * (0.55 + 0.45 * end)));
      const f = fy + Math.round(Math.sin(j * 0.05 + ph * 2) * 1.2);
      for (let y = f - H; y < f; y++) dig(x0 + j, y); hard(x0 + j, f);
    }
    const canal = ((k / K) | 0) % 3 === 0;   // um em cada três de cada andar
    const C = { cx: x0 + len / 2, cy: fy - hh / 2, w: len, h: hh, band: 2, kind: 'tubo', x0: W1(x0), fy, top: fy - hh, len, canal, ph };
    dgTubes.push(C); dgChambers.push(C); k++;
  }
  for (let k = 0, tries = 0; k < 5 * WSC * K && tries < 400 * K; tries++) {
    const w = 12 + ((R() * 7) | 0), h = 6 + ((R() * 4) | 0), cx = (R() * WW) | 0, cy = lv(102, k % K) + h / 2 + R() * Math.max(0, 44 - h);
    if (busy(cx, cy, w, h, 5) || !awayFromBoss(cx, cy, w / 2)) continue;
    blob(cx, cy, w, h, 0x7e00 + k, 2.2);
    const C = { cx, cy, w, h, band: 2, kind: 'ninho', fy: Math.round(cy + h / 2) };
    dgNests.push(C); dgChambers.push(C); k++;
  }

  // ---------- 2g. o Leito de Ouro: câmaras do tesouro ----------
  for (let k = 0, tries = 0; k < 6 * WSC * K && tries < 500 * K; tries++) {
    const j = k % K, w = 20 + ((R() * 17) | 0), h = 10 + ((R() * 7) | 0), x0 = (R() * WW) | 0, fy = lv(156 + R() * 24, j);
    if (fy - h < lv(151, j) || fy > YB - 5 || busy(x0 + w / 2, fy - h / 2, w, h, 6) || !awayFromBoss(x0 + w / 2, fy - h / 2, w / 2 + 6)) continue;
    blob(x0 + w / 2, fy - h / 2, w, h, 0x7f00 + k, 3.2);
    room(x0 + 2, fy, w - 4, 3);
    const C = { cx: x0 + w / 2, cy: fy - h / 2, w, h, band: 3, kind: 'tesouro', x0: W1(x0), fy, top: fy - h };
    dgHoards.push(C); dgChambers.push(C); k++;
  }

  // ---------- 3. as ligações ----------
  const mouth = C => C.fy ? C.fy : Math.round(C.cy + C.h * 0.3);
  const ends = (C, right) => [Math.round(right ? C.cx + C.w / 2 - 2 : C.cx - C.w / 2 + 2), mouth(C)];
  // cada sala no seu andar (o da faixa dela que contém a boca); as salas de um andar ligadas em anel
  const NL = 4 * K, byLv = []; for (let l = 0; l < NL; l++) byLv.push([]);
  for (const c of dgChambers) if (!c.nolink && !c.boss) byLv[c.band * K + clamp(lvOf(mouth(c) - 1) - c.band * K, 0, K - 1)].push(c);
  for (let l = 0; l < NL; l++) {
    const b = (l / K) | 0, L = byLv[l].slice().sort((a, c) => a.cx - c.cx);
    for (let k = 0; k < L.length; k++) {
      const P = L[k], Q = L[(k + 1) % L.length]; if (P === Q) continue;
      const [ax, ay] = ends(P, true), [bx, by] = ends(Q, false);
      if (b === 1) gallery(ax, ay, bx, by, dgCorr);   // os kobolds cavam reto
      else worm(ax, ay - 2, bx, by - 2, b === 2 ? 1.6 : 1.4, 0x7700 + l * 90 + k);
    }
  }
  // entre um andar e o de baixo: 3 x WSC rampas em zigue-zague (nada de poço reto: cada perna desce uns 11)
  for (let l = 0; l < NL - 1; l++) {
    const U = byLv[l], D = byLv[l + 1];
    for (let k = 0; k < 3 * WSC && U.length && D.length; k++) {
      const P = U[(R() * U.length) | 0], Q = D.reduce((m, c) => Math.abs(wdx(c.cx - P.cx)) < Math.abs(wdx(m.cx - P.cx)) ? c : m);
      if (!awayFromBoss(Q.cx, mouth(Q), 4)) continue;
      const [ax, ay] = ends(P, R() < 0.5); ramp(ax, ay - 2, Math.round(Q.cx), mouth(Q) - 2, 1.4, 0x77f0 + l * 9 + k);
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
  const shell = (x, y, t) => { const i = I(x, y); if (SOLID[tiles[i]] && DG_SOILS[tiles[i]] && !dgKeep.has(i) && !inDgHall(W1(x), y, 5)) tiles[i] = t; };
  const airAround = (x, y) => !SOLID[at(x - 1, y)] || !SOLID[at(x + 1, y)] || !SOLID[at(x, y - 1)] || !SOLID[at(x, y + 1)];
  const lining = (x0, y0, x1, y1, t, w, floorT, ceilT) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = I(x, y); if (inDgHall(W1(x), y, 5) || y < S0 || y >= YB - 1) continue;
      if (SOLID[tiles[i]]) { if (airAround(x, y) || hash2(W1(x), y, seed ^ 0x71) < 0.55) shell(x, y, floorT && !SOLID[at(x, y - 1)] ? floorT : ceilT && !SOLID[at(x, y + 1)] ? ceilT : t); }
      else walls[i] = w;
    }
  };
  const boxOf = (C, m) => [Math.floor(C.x0 !== undefined ? C.x0 : C.cx - C.w / 2) - m, Math.floor(C.top !== undefined ? C.top : C.cy - C.h / 2) - m, Math.ceil(C.x0 !== undefined ? C.x0 + C.w : C.cx + C.w / 2) + m, (C.fy || Math.ceil(C.cy + C.h / 2)) + m];
  // as chaminés: tufo úmido em volta, a escada de cravos inteira numa parede, bicas de vapor nas paredes
  for (const C of dgChim) {
    const [x0, y0, x1, y1] = boxOf(C, 2);
    lining(x0, y0, x1, y1, DG_TUFO, WDG_TUFO, DG_TUFO, DG_TUFO);
    const lx = C.x0 + (hash2(C.x0, C.fy, seed ^ 0x72) < 0.5 ? 0 : C.w - 1);
    for (let y = C.top; y < C.fy; y++) { const i = I(lx, y); if (tiles[i] === AIR) tiles[i] = DG_ESCADA; }
    // a cada 9 a 11 linhas um patamar de tufo de parede a parede: só a escada passa (um sim, um não, também a coluna
    // ao lado dela); quem cai na chaminé cai pouco
    for (let y = C.fy - 10, n = 0; y > C.top + 4; y -= 9 + ((hash2(C.x0, y, seed ^ 0x75) * 3) | 0), n++)
      for (let x = C.x0; x < C.x0 + C.w; x++) { if (x === lx || (n % 2 === 0 && Math.abs(x - lx) === 1)) continue; const i = I(x, y); if (tiles[i] === AIR) { tiles[i] = DG_TUFO; walls[i] = WDG_TUFO; } }
  }
  // as grutas de vapor: tufo
  for (const C of dgChambers) if (C.kind === 'vapor') { const [x0, y0, x1, y1] = boxOf(C, 2); lining(x0, y0, x1, y1, DG_TUFO, WDG_TUFO, DG_TUFO, DG_TUFO); }
  // as tocas e as galerias: taipa por dentro, parede de taipa atrás; o santuário com o chão de andesito lavrado
  for (const H of dgDens) { const [x0, y0, x1, y1] = boxOf(H, 2); lining(x0, y0, x1, y1, DG_TAIPA, WDG_TAIPA, H.shrine ? DG_ANDESITO : DG_TAIPA, DG_TAIPA); }
  for (const Q of dgCorr) {
    if (Q.boss) continue;
    for (let j = -1; j <= Q.len; j++) {
      const x = Q.x0 + j;
      for (let y = Q.fy - (Q.h || 4) - 1; y <= Q.fy; y++) {
        const i = I(x, y); if (inDgHall(W1(x), y, 2) || y < S0 + 1 || y >= YB - 1) continue;
        if (!SOLID[tiles[i]]) { if (dragonBand(y) === 1) walls[i] = WDG_TAIPA; continue; }
        if ((y === Q.fy || y === Q.fy - (Q.h || 4) - 1) && DG_SOILS[tiles[i]] && !dgKeep.has(i) && dragonBand(y) === 1) tiles[i] = DG_TAIPA;
      }
    }
  }
  // os corredores da cratera: obsidiana em volta, o chão de crosta
  for (const Q of dgCorr) if (Q.boss) for (let j = -1; j <= Q.len; j++) for (let y = Q.fy - 5; y <= Q.fy; y++) {
    const x = Q.x0 + j, i = I(x, y); if (inDgHall(W1(x), y, 1)) continue;
    if (!SOLID[tiles[i]]) walls[i] = WDG_OBSIDIANA; else if (DG_SOILS[tiles[i]]) tiles[i] = y === Q.fy ? DG_CROSTA : DG_OBSIDIANA;
  }
  // os tubos: lava cordada em volta (obsidiana no teto às vezes), parede de lava; no canal, magma no fundo e o andaime por cima
  for (const C of dgTubes) {
    const [x0, y0, x1, y1] = boxOf(C, 3);
    lining(x0, y0 - 2, x1, y1 + 2, DG_LAVA_CORDA, WDG_LAVA, DG_LAVA_CORDA, hash2(C.x0, C.fy, seed ^ 0x73) < 0.4 ? DG_OBSIDIANA : DG_LAVA_CORDA);
    if (!C.canal) continue;
    // o canal: 2 de magma abaixo do chão no meio do tubo; o andaime de ossos fica no lugar do chão, por cima do magma
    const cs = C.x0 + Math.floor(C.len * 0.2), ce = C.x0 + Math.floor(C.len * 0.8);
    for (let x = cs; x < ce; x++) {
      let f = C.fy - 4; while (f < C.fy + 4 && at(x, f) === AIR) f++;
      if (!SOLID[at(x, f)] || dgKeep.has(I(x, f))) continue;
      set(x, f, DG_ANDAIME);
      for (let y = f + 1; y <= f + 2; y++) { const i = I(x, y); if (!dgKeep.has(i) && y < YB - 2) { tiles[i] = LAVA; walls[i] = WDG_LAVA; } }
      for (const y of [f + 3]) if (!SOLID[at(x, y)] || at(x, y) === LAVA) set(x, y, DG_LAVA_CORDA);
    }
  }
  // os ninhos: obsidiana e lava cordada, escamas e cascas
  for (const C of dgNests) { const [x0, y0, x1, y1] = boxOf(C, 3); lining(x0, y0, x1, y1, DG_LAVA_CORDA, WDG_LAVA, DG_OBSIDIANA, DG_LAVA_CORDA); }
  // as câmaras do tesouro: obsidiana com costelas de osso; os montes de ouro solto no chão (até 3 de altura, encosta de 45°)
  const goldMound = (x0, w, fy, hmax) => {
    // o chão de cada coluna; o monte só fica sobre chão firme (nunca sobre ouro já posto, escada ou corda)
    const cx = x0 + w / 2, r = w / 2;
    for (let x = x0; x < x0 + w; x++) {
      let f = fy - 4; while (f < fy + 3 && !SOLID[at(x, f)]) f++;
      if (!SOLID[at(x, f)] || at(x, f) === DG_OURO_SOLTO) continue;
      const hgt = Math.min(hmax, Math.floor(r - Math.abs(x + 0.5 - cx) + 0.5)); if (hgt <= 0) continue;
      for (let j = 1; j <= hgt; j++) { const i = I(x, f - j); if (tiles[i] !== AIR || dgKeep.has(i) || DG_CLIMB(at(x - 1, f - j)) || DG_CLIMB(at(x + 1, f - j))) break; tiles[i] = DG_OURO_SOLTO; }
    }
  };
  // o ouro precisa de apoio: no fim, coluna por coluna, nada de ouro com ar embaixo nem encosta mais íngreme que 45°
  for (const C of dgHoards) {
    const [x0, y0, x1, y1] = boxOf(C, 3);
    lining(x0, y0, x1, y1, DG_OBSIDIANA, WDG_OBSIDIANA, DG_OBSIDIANA, DG_OBSIDIANA);
    for (let k = 0, n = 1 + ((R() * 2) | 0); k < n; k++) {   // uma costela de dragão do chão ao teto, em arco
      const rx = C.x0 + 3 + ((R() * (C.w - 6)) | 0);
      for (let y = C.fy - 1; y > C.top - 2; y--) { const x = rx + Math.round(Math.sin((C.fy - y) / C.h * 2.2) * 3); if (at(x, y) === AIR && hash2(x, y, seed ^ 0x74) < 0.85) set(x, y, DG_OSSO); }
    }
    for (let k = 0, n = Math.max(1, Math.round(C.w / 14)); k < n; k++) { const w = 6 + ((R() * 6) | 0); goldMound(C.x0 + 2 + ((R() * Math.max(1, C.w - w - 4)) | 0), w, C.fy, 3); }
  }
  // as oferendas dos santuários: um montinho de ouro no meio
  for (const H of dgDens) if (H.shrine) goldMound(H.x0 + 10, 5, H.fy, 2);   // o monte de oferendas num canto: a estátua fica no resto do chão
  // a Cratera: a caixa toda sólida, obsidiana com parede de obsidiana (o 277 escreve dentro)
  {
    const B = dgBoss;
    for (let y = B.top - 3; y <= B.fy + 3; y++) for (let x = B.cx - 48; x <= B.cx + 47; x++) { const i = I(x, y); tiles[i] = DG_OBSIDIANA; walls[i] = WDG_OBSIDIANA; if (agua.length) agua[i] = 0; }
  }
  // ---------- as chaminés de entrada: a boca vira tufo, o poço com a escada de cravos; a câmara de pouso ----------
  for (const E of dgEntries) {
    const x0 = E.x0, L = E.land, y1 = L.fy - 6;
    for (let x = x0 - 3; x <= x0 + 6; x++) { const i = I(x, E.fy); if (SOLID[tiles[i]] && !(x >= x0 && x < x0 + 4)) tiles[i] = DG_TUFO; }
    for (let y = E.fy; y < y1; y++) {
      for (let x = x0; x < x0 + 4; x++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WDG_TUFO; dgKeep.add(i); }
      for (const x of [x0 - 1, x0 + 4]) { const i = I(x, y); if (y > E.fy) { tiles[i] = (y - E.fy) % 7 === 3 ? DG_ANDESITO : DG_TUFO; dgKeep.add(i); } }
    }
    for (let y = E.fy - 2; y < L.fy; y++) { const i = I(x0 + 1, y); if (!SOLID[tiles[i]] || y === E.fy) { tiles[i] = DG_ESCADA; dgKeep.add(i); } }
    // um patamar de tufo no meio do poço (só a escada passa): quem desce caindo cai a metade
    if (y1 - E.fy > 14) { const my = (E.fy + y1) >> 1; for (const x of [x0, x0 + 2, x0 + 3]) { const i = I(x, my); tiles[i] = DG_TUFO; dgKeep.add(i); } }
    for (let y = E.fy - 3; y < E.fy; y++) for (let x = x0; x < x0 + 4; x++) dgKeep.add(I(x, y));
    for (let y = L.fy - L.h - 1; y <= L.fy; y++) for (let x = L.x0 - 1; x <= L.x0 + L.w; x++) {
      const i = I(x, y), edge = y === L.fy - L.h - 1 || y === L.fy || x === L.x0 - 1 || x === L.x0 + L.w;
      if (W1(x) === L.door && y >= L.fy - 3 && y < L.fy) { tiles[i] = AIR; walls[i] = WDG_TUFO; }
      else if (edge && !(y === L.fy - L.h - 1 && W1(x) >= x0 && wdx(x - x0) < 4)) tiles[i] = DG_TUFO;
      else if (!edge) { tiles[i] = AIR; walls[i] = WDG_TUFO; }
      else { tiles[i] = W1(x) === W1(x0 + 1) ? DG_ESCADA : AIR; walls[i] = WDG_TUFO; }
      dgKeep.add(i);
    }
    // 2 velas de sebo e a bica de vapor apagada (ficha, seção 2)
    const vs = L.side > 0 ? [L.x0 + 6, L.x0 + 11] : [L.x0 + 2, L.x0 + 7];
    for (const vx of vs) if (tiles[I(vx, L.fy - 1)] === AIR) tiles[I(vx, L.fy - 1)] = DG_VELA;
    const bx = L.side > 0 ? L.x0 + 9 : L.x0 + 4; if (tiles[I(bx, L.fy - 1)] === AIR) tiles[I(bx, L.fy - 1)] = DG_VAPOR;
  }
  // ---------- os Tubos Frios: a lava cordada clareando para baixo, a escada de cravos até a última linha ----------
  for (const X of dgExits) {
    for (let y = X.top - 1; y < X.fy; y++) {
      for (let x = X.x0; x < X.x0 + 5; x++) { const i = I(x, y); if (y >= X.top) { tiles[i] = AIR; walls[i] = WDG_LAVA; dgKeep.add(i); } }
      if (y >= X.top) for (const x of [X.x0 - 1, X.x0 + 5]) { const i = I(x, y); tiles[i] = (y - X.top) > (X.fy - X.top) * 0.6 ? DG_OSSO : (y - X.top) % 6 === 3 ? DG_OBSIDIANA : DG_LAVA_CORDA; dgKeep.add(i); }
    }
    for (let y = X.C.top + 1; y < X.fy; y++) { const i = I(X.x0 + 1, y); if (!SOLID[tiles[i]]) { tiles[i] = DG_ESCADA; dgKeep.add(i); } }
    if (X.fy - X.top > 8) { const my = (X.top + X.fy) >> 1; for (const x of [X.x0, X.x0 + 2, X.x0 + 3, X.x0 + 4]) { const i = I(x, my); tiles[i] = DG_OBSIDIANA; dgKeep.add(i); } }   // o patamar no meio
    for (let x = X.x0 - 2; x <= X.x0 + 6; x++) { dgKeep.add(I(x, X.top)); if (x < X.x0 || x > X.x0 + 4) { const i = I(x, X.top); if (SOLID[tiles[i]]) tiles[i] = DG_LAVA_CORDA; } }
    tiles[I(X.x0 + 1, X.fy)] = DG_OBSIDIANA;
  }

  // ---------- 5. os veios ----------
  const R4 = mulberry32(seed ^ 0x0fa7);
  const nearFire = (x, y) => { for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) { const t = at(x + dx, y + dy); if (t === LAVA || t === DG_OURO_SOLTO || t === DG_CROSTA) return true; } return false; };
  const vein = (ore, n, d0, d1, lmin, lmax, host, fire) => {
    for (let k = 0, tries = 0; k < n && tries < n * 6; tries++) {
      let x = (R4() * WW) | 0, y = S0 + mb(d0) + ((R4() * mb(d1 - d0)) | 0); const len = lmin + ((R4() * (lmax - lmin + 1)) | 0);
      if (fire && !nearFire(x, y)) continue;
      k++;
      for (let s = 0; s < len; s++) {
        const i = I(x, y);
        if (host(tiles[i]) && y < YB - 1 && !dgKeep.has(i) && !inDgHall(W1(x), y, 5)) tiles[i] = ore;
        const d = (R4() * 4) | 0; x += d === 0 ? 1 : d === 1 ? -1 : 0; y = clamp(y + (d === 2 ? 1 : d === 3 ? -1 : 0), S0 + 1, YB - 2);
      }
    }
  };
  vein(DG_O_CARVAO, 22 * WSC * K, 0, 46, 3, 7, t => t === DG_TUFO);
  vein(DG_O_CARVAO, 8 * WSC * K, 46, 98, 3, 7, t => t === DG_ANDESITO || t === DG_TUFO);
  vein(DG_O_CARVAO, 8 * WSC * K, 98, 186, 3, 6, t => t === DG_ANDESITO || t === DG_LAVA_CORDA);   // o carvão está em todas as camadas (00-geral): menos aqui embaixo
  // perto do fogo (obsidiana, osso e a lava cordada que o cerca); a pedra comum perto do fogo também serve
  const draHost = t => t === DG_OBSIDIANA || t === DG_OSSO || t === DG_LAVA_CORDA || t === DG_ANDESITO;
  vein(DG_O_DRACONIO, 14 * WSC * K, 98, 150, 3, 6, draHost, true);
  vein(DG_O_DRACONIO, 12 * WSC * K, 150, 186, 3, 7, draHost, true);
  vein(DG_O_DRACONIO, 6 * WSC * K, 98, 186, 2, 5, t => t === DG_OBSIDIANA || t === DG_LAVA_CORDA, false);   // um pouco longe do fogo também, para quem não acha
}

function dgAfter() {
  const NN = WW * WH, W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  const S0 = DG_S0, YB = Math.min(WH - 8, S0 + DG_D), R3 = mulberry32(seed ^ 0x7d3c1);
  const dgRow = y => y >= S0 && y < YB - 1;
  const dig = (x, y) => { if (!dgRow(y)) return; const i = I(x, y); if (dgKeep.has(i) || inDgHall(W1(x), y, 5)) return; if (y > 0 && tiles[I(x, y - 1)] === DG_OURO_SOLTO) tiles[I(x, y - 1)] = DG_OBSIDIANA; /* ouro solto sobre o túnel cairia e o taparia: vira teto firme */ if (SOLID[tiles[i]] || DECO[tiles[i]]) tiles[i] = AIR; if (!walls[i]) walls[i] = WDG_TUFO; };
  const worm = (xa, ya, xb, yb, r, s) => {
    let x = xa, y = ya; const tx = xa + wdx(xb - xa), Rw = mulberry32(seed ^ s);
    for (let n = 0; n < 900; n++) {
      const ddx = tx - x, ddy = yb - y, d = Math.hypot(ddx, ddy); if (d < 1.2) break;
      const a = Math.atan2(ddy, ddx) + (Rw() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.6;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r) - 1; dx <= Math.ceil(r) + 1; dx++) if ((dx * dx) / 1.6 + dy * dy <= r * r) dig(Math.round(x) + dx, Math.round(y) + dy);
    }
  };
  const dgSolid = t => SOLID[t] && DG_SOILS[t];
  const at = (x, y) => tiles[I(x, y)], put = (x, y, t) => { tiles[I(x, y)] = t; };
  const B = dgBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 5 + m && y >= B.top - 5 - m && y <= B.fy + 5 + m;
  const blocked = t => SOLID[t] || DG_HOT(t);

  // o ouro solto sem apoio (um túnel passou embaixo) cai já na geração, antes do conserto: vira um monte assentado
  for (let pass = 0; pass < 40; pass++) {
    let moved = 0;
    for (let y = YB - 2; y > S0; y--) for (let x = 0; x < WW; x++) {
      const i = y * WW + x; if (tiles[i] !== DG_OURO_SOLTO || inBox(x, y)) continue;
      const dn = i + WW; if (tiles[dn] === AIR) { tiles[dn] = DG_OURO_SOLTO; tiles[i] = AIR; moved++; continue; }
      for (const d of [-1, 1]) { const s = I(x + d, y), sd = I(x + d, y + 1); if (tiles[s] === AIR && tiles[sd] === AIR) { tiles[sd] = DG_OURO_SOLTO; tiles[i] = AIR; moved++; break; } }
    }
    if (!moved) break;
  }

  // ---------- 1. tudo alcançável das duas chaminés ----------
  const reach = new Uint8Array(NN), stack = [];
  const flood = (s0, again) => { if ((reach[s0] && !again) || blocked(tiles[s0])) return; reach[s0] = 1; stack.push(s0); while (stack.length) { const c = stack.pop(), x = c % WW, row = c - x; for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) if (nb >= (S0 - 40) * WW && nb < NN && !reach[nb] && !blocked(tiles[nb])) { reach[nb] = 1; stack.push(nb); } } };
  for (const E of dgEntries) flood(I(E.x0 + 1, E.fy - 1));
  if (!dgEntries.length && dgChambers.length) flood(I(dgChambers[0].cx, Math.round(dgChambers[0].cy)));
  if (B) for (let y = B.top - 5; y <= B.fy + 5; y++) for (let x = B.cx - 50; x <= B.cx + 49; x++) reach[I(x, y)] = 1;
  // as bolsas que não se alcançam, rotuladas uma vez só (só as linhas da camada), da maior para a menor; a que um
  // conserto anterior já alcançou fica de fora
  const RB = S0 * WW, lab = new Uint8Array((YB - S0) * WW), comps = [];
  for (let y = S0; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (reach[i] || lab[i - RB] || blocked(tiles[i]) || !walls[i]) continue;
    const comp = []; lab[i - RB] = 1; stack.push(i);
    while (stack.length) { const c = stack.pop(), cx = c % WW, row = c - cx; comp.push(c); for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c - WW, c + WW]) if (nb >= RB && nb < YB * WW && !lab[nb - RB] && !reach[nb] && !blocked(tiles[nb])) { lab[nb - RB] = 1; stack.push(nb); } }
    if (comp.length >= 16) comps.push(comp);
  }
  comps.sort((a, c) => c.length - a.length);
  const org = new Int32Array((YB - S0) * WW);
  // a busca pela rocha da bolsa inteira até o vão alcançado mais perto (contornando o que fica); devolve onde chegou
  const bfs = C => {
    org.fill(-1); const q = []; let hit = -1; for (const c of C) { org[c - RB] = c; q.push(c); }
    for (let h = 0; h < q.length && hit < 0; h++) {
      const c = q[h], x = c % WW, row = c - x;
      for (const nb of [row + W1(x - 1), row + W1(x + 1), c - WW, c + WW]) {
        if (nb < (S0 + 2) * WW || nb >= (YB - 1) * WW || org[nb - RB] >= 0 || inBox(nb % WW, (nb / WW) | 0, 2)) continue;
        if (reach[nb] && !blocked(tiles[nb])) { org[nb - RB] = c; hit = nb; break; }   // o vão alcançado vale mesmo guardado (a porta do pouso)
        if (dgKeep.has(nb) || dgKeep.has(nb - WW) || tiles[nb] === BEDROCK || DG_HOT(tiles[nb])) continue;
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
    if (!best) {   // nada perto: a ligação vai até o vão alcançado mais perto, por mais longe que esteja
      const h = bfs(bestC); if (h >= 0) { let o = h; while (org[o - RB] !== o) o = org[o - RB]; best = [o % WW, (o / WW) | 0, h % WW, (h / WW) | 0]; }
    }
    if (!best) { for (const c of bestC) reach[c] = 1; continue; }
    {   // em zigue-zague quando a ligação é mais funda que 11: o conserto não abre poço
      const [ax, ay, bx, by] = best, n = Math.max(1, Math.ceil(Math.abs(by - ay) / 11)); let x = ax, y = ay, dir = wdx(bx - ax) < 0 ? -1 : 1;
      for (let k = 1; k <= n; k++) { const ny = Math.round(ay + (by - ay) * k / n), nx = k === n ? ax + wdx(bx - ax) : x + dir * 12; worm(x, y, nx, ny, 1.3, 0x76a0 + pass + (k - 1) * 977); x = nx; y = ny; dir = -dir; }
    }
    flood(I(best[2], best[3]), true);
    if (!reach[bestC[0]]) {   // a minhoca bateu numa borda guardada: um corredor pela rocha, contornando o que fica
      const hit = bfs(bestC);
      for (let c = hit; c >= 0 && org[c - RB] !== c; c = org[c - RB]) { const x = c % WW, y = (c / WW) | 0; dig(x, y); dig(x, y - 1); }
      if (hit >= 0) flood(hit, true);
      if (!reach[bestC[0]]) for (const c of bestC) reach[c] = 1;
    }
  }
  // o ouro que o conserto ainda deixou sem apoio de lado não cai mais: endurece onde está (não tapa o caminho aberto)
  for (let y = S0 + 1; y < YB - 1; y++) for (let x = 0; x < WW; x++) { const i = y * WW + x; if (tiles[i] !== DG_OURO_SOLTO || inBox(x, y)) continue; if (tiles[i + WW] === AIR || [-1, 1].some(d => tiles[I(x + d, y)] === AIR && tiles[I(x + d, y + 1)] === AIR)) tiles[i] = DG_OBSIDIANA; }

  // ---------- 2. escada de cravos (nos Túneis) ou corda de couro de draco (no resto) em todo desnível de 5 ou mais ----------
  {
    const used = new Set();
    for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
      if (at(x, y) !== AIR || at(x, y - 1) !== AIR || !SOLID[at(x, y + 1)] || at(x, y + 1) === DG_OURO_SOLTO || inBox(x, y, 3)) continue;
      for (const d of [-1, 1]) {
        const lx = W1(x + d); if (at(lx, y) !== AIR || at(lx, y + 1) !== AIR) continue;
        let k = y + 1; while (k < YB - 1 && at(lx, k) === AIR) k++;
        if (k - y < 5 || !SOLID[at(lx, k)]) continue;
        let near = false; for (let j = -2; j <= 2 && !near; j++) for (let yy = y; yy < k && !near; yy += 2) if (used.has(I(lx + j, yy)) || DG_CLIMB(at(lx + j, yy))) near = true;
        if (near) continue;
        let clear = true; for (let yy = y; yy < k; yy++) { const i = I(lx, yy); if (dgKeep.has(i) || !walls[i] || (agua.length && agua[i])) clear = false; }
        if (!clear) continue;
        const tt = dragonBand(y) === 1 ? DG_ESCADA : DG_CORDA;
        for (let yy = y; yy < k; yy++) { const i = I(lx, yy); tiles[i] = tt; used.add(i); }
      }
    }
  }
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {   // poços verticais estreitos: a escada na coluna da esquerda
    if (at(x, y) !== AIR || at(x + 1, y) !== AIR || at(x + 2, y) !== AIR || !SOLID[at(x - 1, y)] || !SOLID[at(x + 3, y)]) continue;
    if (at(x, y + 1) !== AIR || at(x, y + 6) !== AIR || DG_CLIMB(at(x, y - 1)) || DG_CLIMB(at(x + 1, y)) || inBox(x, y, 3)) continue;
    let k = y; while (k < YB - 1 && at(x, k) === AIR && SOLID[at(x - 1, k)]) k++;
    if (k - y < 6) continue;
    let ok = true; for (let yy = y; yy < k; yy++) if (dgKeep.has(I(x, yy)) || !walls[I(x, yy)]) ok = false;
    if (ok) for (let yy = y; yy < k; yy++) if (at(x, yy) === AIR) put(x, yy, DG_ESCADA);
  }

  // ---------- 3. os estragos e as armadilhas ----------
  // entulho de pomes no chão dos Túneis; fios de armadilha a cada 15 a 25 nas galerias kobold
  for (const Q of dgCorr) {
    if (!Q.kobold) continue;
    let next = Q.x0 + 8 + ((R3() * 10) | 0);
    for (let j = 0; j < Q.len; j++) {
      const x = Q.x0 + j, y = Q.fy - 1, i = I(x, y);
      if (tiles[i] !== AIR || dgKeep.has(i) || !SOLID[at(x, Q.fy)] || DG_CLIMB(at(x, y - 1))) continue;
      if (wdx(x - next) === 0) { put(x, y, DG_FIO); next = x + 15 + ((R3() * 11) | 0); continue; }
      if (R3() < 0.04 && !DG_CLIMB(at(x - 1, y)) && !DG_CLIMB(at(x + 1, y))) put(x, y, DG_POMES);
    }
  }

  // ---------- 4. a decoração ----------
  for (let y = S0 + 1; y < YB - 2; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (tiles[i] !== AIR || !walls[i] || dgKeep.has(i)) continue;
    const b = dragonBand(y); if (b < 0 || b > 3 || inBox(x, y, 2) || inDgLand(x, y, 1)) continue;
    const dn = tiles[i + WW], up = tiles[i - WW], q = R3();
    const floor = dgSolid(dn) && BLOCKY[dn] && up === AIR, ceil = dgSolid(up) && BLOCKY[up] && dn === AIR;
    if (ceil) {
      let gap = 1; while (gap < 8 && at(x, y + gap) === AIR) gap++;
      if (b === 2 && gap <= 6 && gap >= 3 && dgSolid(at(x, y + gap)) && q < 0.012) { for (let j = 0; j < gap; j++) put(x, y + j, DG_COLUNA); continue; }   // a coluna de lava, do teto ao chão
      if (b === 2) { if (q < 0.07) put(x, y, DG_ESTALACT); }
      else if (b === 0) { if (q < 0.03 && gap > 4) { for (let j = 0, n = 2 + ((R3() * 4) | 0); j < n && at(x, y + j) === AIR && at(x, y + j + 2) === AIR; j++) put(x, y + j, DG_CORDA); } }
      else if (b === 3) { if (q < 0.02) put(x, y, DG_ESTALACT); }
      continue;
    }
    if (!floor || DG_CLIMB(at(x - 1, y)) || DG_CLIMB(at(x + 1, y)) || dn === DG_ANDAIME) continue;
    if (b === 0) { if (q < 0.02) put(x, y, DG_VAPOR); else if (q < 0.045) put(x, y, DG_OLIVINA); else if (q < 0.055) put(x, y, DG_FUMAROLA); }
    else if (b === 1) { const den = dgDens.some(H => wdx(x - H.x0) >= 0 && wdx(x - H.x0) < H.w && y > H.top - 2 && y <= H.fy); if (den ? q < 0.09 : q < 0.008) put(x, y, R3() < 0.55 ? DG_VELA : DG_TOTEM); else if (q < 0.03) put(x, y, DG_ESCAMA); }
    else if (b === 2) { if (q < 0.035) put(x, y, DG_FUMAROLA); else if (q < 0.06 && dgNests.some(C => Math.abs(wdx(x - C.cx)) < C.w / 2 + 1 && Math.abs(y - C.cy) < C.h / 2 + 1)) put(x, y, DG_ESCAMA); else if (q < 0.065) put(x, y, DG_ESCAMA); }
    else { if (q < 0.04) put(x, y, DG_MOEDAS); else if (q < 0.06) put(x, y, DG_ESCAMA); else if (q < 0.07) put(x, y, DG_FUMAROLA); }
  }
  // as bicas de vapor nas paredes das chaminés: guardadas para as partículas
  for (let y = S0 + 1; y < S0 + mbOf(DG_BANDS[1]); y++) for (let x = 0; x < WW; x++) if (tiles[y * WW + x] === DG_VAPOR) dgVents.push([x, y]);

  // ---------- 5. os objetos ----------
  dgPlaceProps();
}
const mbOf = m => Math.round(m * (Math.min(WH - 8, DG_S0 + DG_D) - DG_S0) / DG_D);

/* ---------- as bocas das chaminés por último ---------- */
function dgExitClear() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x);
  for (const E of dgEntries) for (let y = E.fy - 3; y < E.fy + 2; y++) for (let x = E.x0; x < E.x0 + 4; x++) { const i = I(x, y); tiles[i] = x === E.x0 + 1 ? DG_ESCADA : AIR; dgKeep.add(i); }
}
/* ---------- a subida garantida: da cratera, das tocas, dos ninhos, dos santuários e do pé dos tubos frios o herói tem
   de conseguir voltar às chaminés (pulo de 3 blocos; escada e corda sobem). O ouro solto não conta como degrau ---------- */
function dgClimbFix() {
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), S0 = DG_S0, YB = Math.min(WH - 8, S0 + DG_D), Y0 = S0 - 6;
  const S = (x, y) => SOLID[tiles[I(x, y)]] === 1 && tiles[I(x, y)] !== DG_OURO_SOLTO, Bk = (x, y) => SOLID[tiles[I(x, y)]] === 1 || DG_HOT(tiles[I(x, y)]), L = (x, y) => DG_CLIMB(tiles[I(x, y)]);
  const ok = (x, y) => !Bk(x, y) && !Bk(x, y - 1), H = YB - Y0;
  // os estados (célula, pulo que sobra 0 a 4) de onde se volta ao topo (y <= S0 - 3) saem de uma vez, andando de trás
  // para frente a partir do topo (antes era uma busca inteira para cada ponto de partida). F guarda, por célula
  // c = (y - Y0) * WW + x: 1 cabe o herói, 2 apoiado (pulo cheio), 4 chão ou escada aqui, 8 escada aqui ou acima
  const NC = WW * H, F = new Uint8Array(NC), good = new Uint8Array(NC * 5), seen = new Uint8Array(NC * 5), any = new Uint8Array(NC), Q = new Int32Array(NC * 5);
  const flag1 = (x, y) => {
    let f = 0;
    if (ok(x, y) && !inDgHall(x, y)) { f = 1; const lh = L(x, y), lu = lh || L(x, y - 1), sd = S(x, y + 1); if (sd || lu) f |= 2; if (sd || lh) f |= 4; if (lu) f |= 8; }
    F[(y - Y0) * WW + x] = f;
  };
  const flags = () => { for (let y = Y0 + 1; y < YB; y++) for (let x = 0; x < WW; x++) flag1(x, y); };
  // o pulo com que se chega em c vindo de p (dir 0 de lado, 1 subindo, 2 descendo); -1 não dá
  const arrive = (p, r, c, dir) => { if (F[c] & 2) return dir === 1 && r === 0 ? -1 : 4; if (dir === 0) return r === 4 && !(F[p] & 4) ? 0 : r; if (dir === 1) return r === 0 ? -1 : F[p] & 8 ? 4 : r === 4 ? 3 : r - 1; return 0; };
  const closure = () => {
    good.fill(0); let qt = 0;
    for (let y = Y0 + 1; y <= S0 - 3; y++) for (let x = 0; x < WW; x++) { const c = (y - Y0) * WW + x, f = F[c]; if (f & 1) for (let r = f & 2 ? 4 : 0; r <= 4; r++) { good[c * 5 + r] = 1; Q[qt++] = c * 5 + r; } }
    spread(qt);
  };
  // depois de um conserto (escada na coluna x, de top a bot: só abre caminho, nunca fecha) basta refazer as marcas em
  // volta e continuar a volta a partir dos estados bons de perto
  const patch = (x, top, bot) => {
    for (let y = Math.max(Y0 + 1, top - 2); y <= Math.min(YB - 1, bot + 2); y++) for (let dx = -1; dx <= 1; dx++) flag1(W1(x + dx), y);
    let qt = 0;
    for (let y = Math.max(Y0 + 1, top - 3); y <= Math.min(YB - 1, bot + 3); y++) for (let dx = -2; dx <= 2; dx++) { const c = (y - Y0) * WW + W1(x + dx); for (let r = 0; r < 5; r++) if (good[c * 5 + r]) Q[qt++] = c * 5 + r; }
    spread(qt);
  };
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
  // tudo o que se alcança de uma célula (para o conserto)
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
  const soft = t => t === DG_TUFO || t === DG_ANDESITO || t === DG_POMES || t === DG_LAVA_CORDA || t === DG_TAIPA || t === DG_OBSIDIANA || t === DG_OSSO;
  const repair = () => {
    let best = null;
    for (let y = Y0 + 2; y < YB - 1; y++) for (let x = 0; x < WW; x++) {
      if (!any[(y - Y0) * WW + x] || !S(x, y + 1) || dgKeep.has(I(x, y)) || inDgHall(x, y, 1)) continue;
      for (let t = y - 1, n = 0; t > Y0 + 1 && n < 30 && !Bk(x, t - 1); t--, n++) {
        if (n < 3) continue;
        let side = false; for (const d of [-1, 1]) { const sx = W1(x + d); if (ok(sx, t) && S(sx, t + 1) && !any[(t - Y0) * WW + sx]) side = true; }
        if (side) { if (!best || t < best[1]) best = [x, t, y]; break; }
      }
      for (let t = y - 1, n = 0; t > Y0 + 2 && n < 6; t--, n++) {
        if (!Bk(x, t)) continue;
        const tt = tiles[I(x, t)];
        if (soft(tt) && !dgKeep.has(I(x, t)) && !inDgHall(x, t, 5) && ok(x, t - 1) && !any[(t - 1 - Y0) * WW + x] && (!best || t - 1 < best[1])) best = [x, t - 1, y];
        break;
      }
    }
    if (!best) return false;
    const [x, top, bot] = best;
    for (let y = top; y <= bot; y++) { const i = I(x, y); if (!SOLID[tiles[i]] || soft(tiles[i])) { tiles[i] = DG_ESCADA; if (!walls[i]) walls[i] = WDG_TUFO; } }
    return best;
  };
  const starts = [];
  if (dgBoss) for (const D of dgBoss.doors) starts.push([D.x + D.side * 3, D.fy - 1]);
  for (const c of dgDens) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of dgNests) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const c of dgHoards) starts.push([Math.round(c.cx), c.fy - 1]);
  for (const X of dgExits) starts.push([X.x0 + 2, X.top - 1]);
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
  dgClimbFix.last = [starts.length, ns, fixes];
  return fixes;
}

/* ---------- os objetos (272): por faixa, no chão, debaixo do teto e na parede. As flags do 272 decidem onde cada um
   pode ficar (toca: só nas tocas; santuario: só nos santuários; ninho: só nos ninhos; tesouro: só nas câmaras do
   tesouro). Nunca sobre escada, corda, ouro solto, magma ou andaime; nunca no pouso nem na cratera ---------- */
function dgPlaceProps() {
  if (typeof DG_PROP_PLAN === 'undefined') return;
  const W1 = x => x >= 0 && x < WW ? x : ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x9d3c7);
  const S0 = DG_S0, YB = Math.min(WH - 8, S0 + DG_D), used = new Uint8Array(WW * WH * 2), BF = typeof DG_BACK_FLOOR !== 'undefined' ? DG_BACK_FLOOR : {};
  const B = dgBoss, inBox = (x, y, m = 0) => B && Math.abs(wdx(x - B.cx)) <= B.w / 2 + 5 + m && y >= B.top - 5 - m && y <= B.fy + 5 + m;
  const inside = (L, x, y) => L.some(C => C.x0 !== undefined && C.top !== undefined ? wdx(x - C.x0) >= 0 && wdx(x - C.x0) < C.w && y >= C.top - 1 && y <= C.fy : Math.abs(wdx(x - C.cx)) <= C.w / 2 + 1 && Math.abs(y - C.cy) <= C.h / 2 + 1);
  const tocas = dgDens.filter(H => !H.shrine), shrines = dgDens.filter(H => H.shrine);
  const where = (def, x, y) => (!def.toca || inside(tocas, x, y)) && (!def.santuario || inside(shrines, x, y)) && (!def.ninho || inside(dgNests, x, y)) && (!def.tesouro || inside(dgHoards, x, y));
  const fits = (x0, y0, tw, th, layer, needAir) => {
    if (y0 < 2) return false;
    for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) { const i = I(x, y), t = tiles[i]; if (used[i * 2 + layer] || SOLID[t] || t === LAVA || (needAir && t !== AIR) || !walls[i] || dgKeep.has(i) || inBox(W1(x), y, 1) || inDgLand(W1(x), y)) return false; }
    return true;
  };
  const mark = (x0, y0, tw, th, layer) => { for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + tw; x++) used[I(x, y) * 2 + layer] = 1; };
  const soil = (x, y) => { const t = tiles[I(x, y)]; return SOLID[t] && BLOCKY[t] && DG_SOILS[t] && t !== DG_ANDAIME; };
  const varOf = (def, band) => { const L = def.faixaV && def.faixaV[band]; return L && L.length ? L[(R() * L.length) | 0] : (R() * def.vars.length) | 0; };
  for (let y = S0 + 2; y < YB - 2; y++) {
    const band = DG_BAND_NAMES[clamp(dragonBand(y), 0, 3)], plan = DG_PROP_PLAN[band]; if (!plan) continue;
    for (const kind of ['chao', 'teto']) {
      let x = 0;
      while (x < WW) {
        const ok = k => { const i = I(k, y); if (tiles[i] !== AIR || inBox(W1(k), y, 2) || inDgLand(W1(k), y, 1)) return false; return kind === 'chao' ? soil(k, y + 1) : soil(k, y - 1); };
        if (!ok(x)) { x++; continue; }
        let x1 = x; while (x1 + 1 < WW && ok(x1 + 1)) x1++;
        const run = x1 - x + 1, x0 = x; x = x1 + 1;
        if (run < 3) continue;
        const list = kind === 'chao' ? [...(plan.chao || []).map(p => [p, 'chao']), ...(plan.fundo || []).map(p => [p, 'fundo'])] : (plan.teto || []).map(p => [p, 'teto']);
        for (const [[id, per10, max], how] of list) {
          const def = PROP_DEFS[id]; if (!def) continue;
          let n = Math.min(max, Math.max(def.santuario ? 1 : 0, Math.floor(run / 10 * per10 * 1.6 + R()))), tries = n * 8;
          while (n > 0 && tries-- > 0) {
            const v = varOf(def, band), V = def.vars[v], tw = Math.ceil(V.w / T), th = Math.ceil(V.h / T);
            if (tw > run) break;
            const px = x0 + ((R() * (run - tw + 1)) | 0);
            if (!where(def, W1(px + (tw >> 1)), y)) continue;
            if (def.alto && (how === 'teto' ? !fits(px, y, tw, Math.max(th, def.alto), 0, true) : !fits(px, y + 1 - Math.max(th, def.alto), tw, Math.max(th, def.alto), 0, true))) continue;   // no teto o espaço livre é para baixo
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

// a ordem: a camada, a cratera (277: dgDress), as bocas e a subida; o 87 liga o resto depois
{ const _bc = buildCathedral; buildCathedral = function () {
  _bc(); genStage('dragao', () => {
  if (!DRAGAO) return;
  try { dgBuild(); dgAfter(); if (typeof dgDress === 'function') dgDress(); dgExitClear(); dgClimbFix(); } catch (err) { console.error(err); }
  // os tipos de dano do Covil (o 101 carrega depois deste arquivo)
  if (typeof DMG_KIND !== 'undefined') Object.assign(DMG_KIND, { kobfundidor: 'fogo', criadraco: 'fogo', serpe: 'fogo', cinzarel: 'fogo' });
});
}; }

/* ---------- a terceira camada atrás do Covil: as paredes do vulcão nas Chaminés e nos Tubos, o paredão de tocas nos
   Túneis, as ossadas de dragão no Leito ---------- */
{ const _cd = cathedralDeep; cathedralDeep = function () {
  _cd();
  if (!DRAGAO) return;
  const Y1 = Math.min(WH, DG_S0 + DG_D + 4);
  for (let y = Math.max(DG_S0 - 4, genDeepA); y < Y1; y++) for (let x = 0; x < WW; x++) {
    const i = y * WW + x; if (!DEEPT[i]) continue;
    const d = (y - DG_S0) + (depthNz(x, y, 25, seed ^ 0x7e11) - 0.5) * 10, n = depthNz(x, y, 20, seed ^ 0x7e12);
    DEEPT[i] = d < DG_BANDS[1] ? DP_DG_CHAMINE : d < DG_BANDS[2] ? (n > 0.75 ? DP_DG_CHAMINE : DP_DG_TOCAS) : d < DG_BANDS[3] ? (n > 0.7 ? DP_DG_OSSADA : DP_DG_CHAMINE) : (n > 0.72 ? DP_DG_CHAMINE : DP_DG_OSSADA);
  }
}; }

/* ---------- zonas, spawn, nível ---------- */
{ const _cz = cathZone; cathZone = function (tx, ty) { if (DRAGAO && ty >= DG_S0 && ty < DG_S0 + DG_D) return DG_ZONE0 + clamp(dragonBand(ty), 0, 3); return _cz(tx, ty); }; }
// pesos da ficha (seção 6), em inteiros
Object.assign(CATH_SPAWN, {
  [DG_ZONE0]: [[['kobfunda', 24], ['kobarmad', 18], ['camaleao', 20], ['criadraco', 20], ['kobfalange', 18]], 8],
  [DG_ZONE0 + 1]: [[['kobfalange', 26], ['kobfunda', 20], ['kobarmad', 16], ['kobfundidor', 20], ['kobmontado', 18]], 9],
  [DG_ZONE0 + 2]: [[['wyrm', 20], ['serpe', 18], ['camaleao', 16], ['dracocour', 14], ['criadraco', 16], ['kobmontado', 16]], 9],
  [DG_ZONE0 + 3]: [[['serpe', 20], ['dracocour', 22], ['wyrm', 20], ['kobfundidor', 18], ['kobfalange', 20]], 10]
});
// tipos que ainda não existem saem da tabela (o 273 e o 274 registram os bichos)
for (let z = DG_ZONE0; z < DG_ZONE0 + 4; z++) CATH_SPAWN[z][0] = CATH_SPAWN[z][0].filter(([t]) => ET[t]);
const DG_NO_SPAWN = (tx, ty) => dgSafe(tx, ty) || inDgHall(tx, ty, 6) || dgExits.some(X => Math.abs(wdx(tx - X.cx)) < 4 && ty >= X.top - 2);
// o nível pela posição no 129 (layerLvl no 52); nada nasce perto das câmaras de pouso, na cratera nem nos tubos frios
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone), D = ET[type];
  if (!DRAGAO || !e || e.boss || (D && D.boss) || e.dgMinion) return e;
  const tx = Math.floor((px + e.w / 2) / T), ty = Math.floor((py + e.h) / T), d = ty - DG_S0;
  if (d >= 0 && d < DG_D) {
    if (zone >= DG_ZONE0 && zone <= DG_ZONE0 + 3 && DG_NO_SPAWN(tx, ty - 1)) { e.dead = true; e.hp = 0; e.dgVoid = true; return e; }
    const lvl = layerLvl(layerLo('dragao'), d), m = 1 + 0.3 * (lvl - 1);
    Object.assign(e, { lvl, hp: Math.round(D.hp * m), maxHp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) });
  }
  return e;
}; }
HOOK.update.push(() => { for (let k = enemies.length - 1; k >= 0; k--) if (enemies[k].dgVoid) enemies.splice(k, 1); });

/* ---------- partículas: vapor subindo nas Chaminés, poeira de pomes nos Túneis, gotas de lava esfriando nos Tubos,
   fagulhas douradas e a névoa de calor no Leito (nada de cinza caindo: isso é do Abismo) ---------- */
HOOK.update.push(dt => {
  if (!DRAGAO || !pl || pl.dead || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), b = dragonBand(pty); if (b < 0 || b > 3) return;
  const air = (x, y) => !solidAt(Math.floor(x / T), Math.floor(y / T));
  if (Math.random() < dt * (b === 0 ? 7 : 4)) {
    const x = cam.x + Math.random() * VW, y = cam.y + Math.random() * VH;
    if (!air(x, y)) return;
    if (b === 0) parts.push({ x, y, vx: rnd(-3, 3), vy: rnd(-14, -6), g: -2, life: 2.6, max: 2.6, col: Math.random() < 0.6 ? '#9a948a' : '#c8c2b6', size: Math.random() < 0.3 ? 2 : 1 });
    else if (b === 1) parts.push({ x, y, vx: rnd(-2, 2), vy: rnd(1, 4), g: 1, life: 3, max: 3, col: Math.random() < 0.6 ? '#a29c94' : '#ddd8ce', size: 1 });
    else if (b === 2) parts.push(Math.random() < 0.5 ? { x, y, vx: rnd(-1, 1), vy: rnd(10, 20), g: 60, life: 1.6, max: 1.6, col: Math.random() < 0.5 ? '#ffa020' : '#e06a10', size: 1 } : { x, y, vx: rnd(-3, 3), vy: rnd(-10, -4), g: -1, life: 1.4, max: 1.4, col: '#ffd050', size: 1 });
    else parts.push({ x, y, vx: rnd(-4, 4), vy: rnd(-12, -5), g: -1, life: 1.8, max: 1.8, col: Math.random() < 0.6 ? '#ffd060' : '#fff0a0', size: 1 });
  }
});

/* ---------- a forja e o vilarejo: o dracônio na fornalha (278 tem os itens), as lojas ---------- */
FURN.min_draconio = { bar: 'barra_draconio', n: 8, t: 11 };
Object.assign(MAT_VAL, { min_draconio: 62, barra_draconio: 500, escama_draco: 28, glandula_fogo: 34, moeda_antiga: 90, obsidiana_rajada: 14 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'glandula_fogo'; c.hint = c.hint.replace(/\.$/, '') + ' e glândulas de fogo.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || ['min_draconio', 'barra_draconio', 'escama_draco', 'obsidiana_rajada'].includes(id); f.hint = f.hint.replace(/\.$/, '') + ', dracônio, escamas de draco e obsidiana.'; }
{ const o = SHOPS.taverneiro, b = o.buys; o.buys = id => b(id) || id === 'moeda_antiga'; o.hint = o.hint.replace(/\.$/, '') + ' O Odo coleciona moedas antigas e paga caro.'; }
// a Couraça de Escamas (278) corta 25% do dano de fogo; o 101 diz o tipo de cada golpe (o dmgKindOf só existe depois dele)
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) {
  if (dmg > 0 && equip.body && equip.body.id === 'couraca_escamas' && typeof dmgKindOf === 'function' && dmgKindOf(src, isProj) === 'fogo') dmg = Math.max(1, Math.round(dmg * 0.75));
  return _hp(dmg, srcX, src, isProj);
}; }
