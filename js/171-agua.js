'use strict';

/* ================= a água (2026-10-10) =================
   Um sistema só para o jogo inteiro (docs/camadas/10-mar-sem-sol.md, "Sistemas novos", e 00-geral, seção 2).
   A água não é um bloco: é uma camada própria por célula, o vetor `agua` (um byte por célula, como `walls`):
     0 seco, 1 água, 2 água com plâncton (brilha), 3 respiradouro (bolhas: enche o fôlego), 4 água fervente.
   Assim uma corrente, um cordão ou uma escada podem estar dentro da água e os sólidos continuam sólidos.
   - A água tem volume (2026-10-10, pedido do Jonathan): cada célula guarda de 0 a 8 partes (`aguaN`, 8 = cheia) e o
     tipo dela (`aguaK`). A geração enche por bacia (aguaBasin: um ponto e um nível, enche tudo o que estiver ligado
     abaixo do nível) com células cheias. No jogo, quando um bloco some ao lado, embaixo ou em cima de água, a água
     escorre: primeiro para baixo, depois para os lados, nivelando, e o total nunca cresce. Uma poça de 6 blocos que
     vaza vira uma lâmina fina espalhada no chão, não um lago novo. Só as células que mudaram são simuladas (uma fila
     de células ativas, com um teto de trabalho por quadro). Pôr um bloco numa célula com água tira essa água.
     `agua[i]` continua sendo o que o resto do jogo lê (nadar, luz, monstros): o tipo quando a célula tem 4 partes ou
     mais (dá para nadar), 0 numa lâmina rasa.
   - Save: a geração refaz as bacias pela semente; o save guarda só as células cuja água ficou diferente da gerada
     (`aguaD`). Saves de antes disso refazem o escorrimento a partir dos blocos cavados (os diffs).
   - Luz: célula molhada apaga a luz mais depressa (0,13 em vez de 0,088; o 07-chunks-luz lê o vetor).
   - Desenho: por cima do herói e dos monstros, translúcida, mais escura a cada 10 fileiras abaixo da superfície,
     com a linha da superfície clara e ondulando. Cada camada pode dar o seu tom (aguaTom).
   O nado, o fôlego e os monstros na água ficam no 172-nadar. Carrega depois das camadas e antes do 87 (só embrulha
   generate, setTile, placeTorch, newWorld e drawSmear). */

const AGUA_SECO = 0, AGUA_LIMPA = 1, AGUA_PLANCTON = 2, AGUA_RESPIRO = 3, AGUA_FERVE = 4;
let agua = new Uint8Array(0), aguaN = new Uint8Array(0), aguaK = new Uint8Array(0), aguaGen = new Uint8Array(0);
{ const _g = generate; generate = function (sd) {
  agua = new Uint8Array(WW * WH); aguaN = new Uint8Array(WW * WH); aguaK = new Uint8Array(WW * WH); aguaFila.length = 0; aguaAtiva = new Uint8Array(WW * WH);
  const r = _g(sd);
  // o que a geração deixou (as bacias escrevem em `agua`): células cheias, e a cópia para o save comparar
  for (let i = 0; i < agua.length; i++) { aguaN[i] = agua[i] ? 8 : 0; aguaK[i] = agua[i]; }
  aguaGen = aguaN.slice(); aguaMexidas.clear();
  return r;
}; }

const aguaAt = (x, y) => y >= 0 && y < WH && agua.length ? agua[y * WW + wrapX(x)] : 0;
// a célula pode ter água: nada sólido nem lava
const aguaCabe = i => !SOLID[tiles[i]] && tiles[i] !== LAVA;

// enche uma bacia: tudo o que estiver ligado a (x, y) sem passar acima da fileira `nivel`. Se vazar para mais de
// `max` células (a bacia não fecha), não enche nada e devolve 0.
function aguaBasin(x, y, nivel, tipo = AGUA_LIMPA, max = 30000) {
  const W1 = v => ((v % WW) + WW) % WW, s0 = y * WW + W1(x);
  if (y < nivel || !aguaCabe(s0)) return 0;
  const seen = new Set([s0]), st = [s0], got = [];
  while (st.length) {
    const c = st.pop(), cx = c % WW, cy = (c / WW) | 0, row = c - cx; got.push(c);
    if (got.length > max) return 0;
    for (const nb of [row + W1(cx - 1), row + W1(cx + 1), c + WW, c - WW]) {
      if (nb < 0 || nb >= WW * WH || seen.has(nb)) continue;
      if (((nb / WW) | 0) < nivel || ((nb / WW) | 0) >= WH - 2 || !aguaCabe(nb)) continue;
      seen.add(nb); st.push(nb);
    }
  }
  for (const c of got) { agua[c] = tipo; if (aguaN.length) { aguaN[c] = 8; aguaK[c] = tipo; } }
  return got.length;
}
// esvazia (a luta da Mãe-Esporo baixa a água fileira por fileira): o chamador escolhe as células
function aguaSecar(i) { agua[i] = AGUA_SECO; aguaN[i] = 0; aguaK[i] = 0; }

/* ---------- o escorrimento: volume fixo, para baixo primeiro, depois para os lados ---------- */
const aguaFila = []; let aguaAtiva = new Uint8Array(0), aguaAcc = 0;
const AGUA_PASSO = 1 / 24, AGUA_TETO = 6000;   // passos por segundo; células por passo no máximo
// quanto uma célula tem de fato: outro código (as chefes, a geração) ainda escreve só em `agua`
function aguaQt(i) { const a = agua[i], n = aguaN[i]; if (a) { if (n < 4) { aguaN[i] = 8; aguaK[i] = a; return 8; } if (!aguaK[i]) aguaK[i] = a; return n; } if (n >= 4) { aguaN[i] = 0; return 0; } return n; }
const aguaMexidas = new Set();   // as células que o escorrimento já mexeu (o save só olha estas)
function aguaSync(i) { const n = aguaN[i]; aguaMexidas.add(i); agua[i] = n >= 4 ? (aguaK[i] || AGUA_LIMPA) : 0; if (!n) aguaK[i] = 0; }
function aguaAtivar(i) { if (i < 0 || i >= aguaAtiva.length || aguaAtiva[i]) return; aguaAtiva[i] = 1; aguaFila.push(i); }
function aguaAtivarEmVolta(i) { const x = i % WW, row = i - x; aguaAtivar(i); aguaAtivar(i - WW); aguaAtivar(i + WW); aguaAtivar(row + wrapX(x - 1)); aguaAtivar(row + wrapX(x + 1)); }
// passa `m` partes de a para b
function aguaPassa(a, b, m) {
  if (m <= 0) return;
  if (!aguaN[b]) aguaK[b] = aguaK[a] === AGUA_RESPIRO ? AGUA_LIMPA : (aguaK[a] || AGUA_LIMPA);
  aguaN[a] -= m; aguaN[b] += m; aguaSync(a); aguaSync(b);
  if (aguaN[b] >= 4 && tiles[b] === TORCH) setTileRaw(b, AIR);   // a tocha alagada apaga
  aguaAtivarEmVolta(a); aguaAtivarEmVolta(b);
}
function aguaCelula(i) {
  let n = aguaQt(i);
  if (!n) {   // uma célula seca que mudou (um buraco que esvaziou): a água ao lado volta a olhar
    const x = i % WW, row = i - x;
    for (const s of [row + wrapX(x - 1), row + wrapX(x + 1)]) if (aguaN[s] || agua[s]) aguaAtivar(s);
    return;
  }
  if (!aguaCabe(i)) { aguaN[i] = 0; aguaSync(i); return; }
  const y = (i / WW) | 0, x = i % WW, row = i - x;
  // para baixo
  const b = i + WW;
  if (y < WH - 3 && aguaCabe(b)) { const nb = aguaQt(b); if (nb < 8) { const m = Math.min(n, 8 - nb); aguaPassa(i, b, m); n -= m; if (!n) return; } }
  // para os lados: a fileira de água apoiada se nivela de uma vez (sem degraus)
  aguaNivela(i);
}
// a célula está apoiada: embaixo é sólido ou água cheia
const aguaApoio = i => { const b = i + WW; return b >= agua.length || !aguaCabe(b) || aguaQt(b) >= 8; };
const AGUA_FAIXA = 40;   // quantas células para cada lado a fileira olha
function aguaNivela(i) {
  const x = i % WW, row = i - x, run = [i];
  let S = aguaN[i], molhadas = 1;
  // as células com água, ligadas e apoiadas; nas pontas, as secas por onde a água pode correr
  const lados = [[], []];
  for (let k = 0; k < 2; k++) {
    const dx = k ? 1 : -1;
    for (let s = 1, seca = false; s <= AGUA_FAIXA; s++) {
      const j = row + wrapX(x + dx * s);
      if (!aguaCabe(j)) break;
      const n = aguaQt(j);
      if (n && !seca) { lados[k].push(j); S += n; molhadas++; if (!aguaApoio(j)) break; continue; }
      if (n) break;                       // outra poça além das secas: ela mesma se nivela
      seca = true; lados[k].push(j); if (!aguaApoio(j)) break;
    }
  }
  if (!aguaApoio(i) && !lados[0].length && !lados[1].length) return;
  // quantas células a água cobre: as molhadas, mais as secas enquanto der 1 parte para cada
  const L0 = lados[0], L1 = lados[1];
  let a = 0, b = 0;
  while (a < L0.length && aguaN[L0[a]]) a++;
  while (b < L1.length && aguaN[L1[b]]) b++;
  // um buraco logo ao lado da água (seco e sem apoio) bebe primeiro: a lâmina escorre para ele
  const furo = [L0[a], L1[b]].filter(c => c !== undefined && !aguaN[c] && !aguaApoio(c));
  if (furo.length) {
    const molh = []; for (let k = a - 1; k >= 0; k--) molh.push(L0[k]); molh.push(i); for (let k = 0; k < b; k++) molh.push(L1[k]);
    const tipo = aguaK[i] === AGUA_RESPIRO ? AGUA_LIMPA : (aguaK[i] || AGUA_LIMPA);
    let resta = S;
    for (const f of furo) { const m = Math.min(8, resta); if (!m) break; aguaK[f] = tipo; aguaN[f] = m; resta -= m; aguaSync(f); if (aguaN[f] >= 4 && tiles[f] === TORCH) setTileRaw(f, AIR); aguaAtivarEmVolta(f); }
    const base = Math.floor(resta / molh.length), sobra = resta - base * molh.length;
    molh.forEach((c, k) => { aguaN[c] = base + (k < sobra ? 1 : 0); aguaSync(c); aguaAtivarEmVolta(c); });
    return;
  }
  // um buraco mais adiante, depois de chão seco: a água rasa vai andando até ele, uma célula por passo
  for (const [L, w] of [[L0, a], [L1, b]]) {
    if (w >= L.length || aguaN[L[w]] || !L.slice(w).some(c => !aguaN[c] && !aguaApoio(c))) continue;
    const de = w ? L[w - 1] : i;
    if (aguaN[de]) { aguaPassa(de, L[w], 1); return; }
  }
  while (1 + a + b < S && (a < L0.length || b < L1.length)) {
    if (a < L0.length && (a <= b || b >= L1.length)) a++; else b++;
  }
  const cel = [];
  for (let k = a - 1; k >= 0; k--) cel.push(L0[k]);
  cel.push(i); for (let k = 0; k < b; k++) cel.push(L1[k]);
  const L = cel.length, base = Math.floor(S / L), resto = S - base * L;
  if (base >= 8) return;               // tudo cheio
  // a sobra fica nas células do meio para fora, sempre na mesma ordem (fica parado quando já está nivelado)
  const meio = (L - 1) / 2, ordem = cel.map((c, k) => k).sort((p, q) => Math.abs(p - meio) - Math.abs(q - meio) || p - q);
  const alvo = new Array(L).fill(base); for (let k = 0; k < resto; k++) alvo[ordem[k]]++;
  const tipo = aguaK[i] === AGUA_RESPIRO ? AGUA_LIMPA : (aguaK[i] || AGUA_LIMPA);
  let mudou = false;
  for (let k = 0; k < L; k++) {
    const c = cel[k]; if (aguaN[c] === alvo[k]) continue;
    mudou = true;
    if (!aguaN[c]) aguaK[c] = tipo;
    aguaN[c] = alvo[k]; aguaSync(c);
    if (aguaN[c] >= 4 && tiles[c] === TORCH) setTileRaw(c, AIR);
  }
  if (mudou) for (const c of cel) aguaAtivarEmVolta(c);
}
function aguaPasso() {
  const n = Math.min(aguaFila.length, AGUA_TETO), lote = aguaFila.splice(0, n);
  for (const i of lote) aguaAtiva[i] = 0;
  for (const i of lote) aguaCelula(i);
}
function setTileRaw(i, t) { const x = i % WW, y = (i / WW) | 0; tiles[i] = t; diffs.set(i, t); markDirty(x, y); }

{ const _st = setTile; setTile = function (x, y, t) {
  _st(x, y, t);
  if (!agua.length || y < 0 || y >= WH) return;
  const i = y * WW + wrapX(x);
  if (!aguaCabe(i)) { aguaN[i] = 0; aguaSync(i); }   // pôr um bloco tira a água
  aguaAtivarEmVolta(i);
}; }
// a água escorre enquanto o jogo roda (só as células ativas)
HOOK.update.push(dt => {
  if (!agua.length || !aguaFila.length) { aguaAcc = 0; return; }
  aguaAcc = Math.min(aguaAcc + dt, AGUA_PASSO * 3);
  while (aguaAcc >= AGUA_PASSO) { aguaAcc -= AGUA_PASSO; aguaPasso(); }
});
// não dá para pôr tocha na água
{ const _pt = placeTorch; placeTorch = function (tx, ty, inReach) { if (aguaAt(tx, ty)) return false; return _pt(tx, ty, inReach); }; }
// carregar: o save novo traz a água que mudou (aguaD); um save antigo refaz o escorrimento a partir dos blocos cavados
function aguaAssenta(sv) {
  if (!agua.length) return;
  for (const [i] of diffs) if (!aguaCabe(i) && aguaN[i]) { aguaN[i] = 0; aguaSync(i); }
  if (sv && Array.isArray(sv.aguaD)) {
    for (let k = 0; k + 1 < sv.aguaD.length; k += 2) { const i = sv.aguaD[k], v = sv.aguaD[k + 1] | 0; if (i >= 0 && i < aguaN.length) { aguaN[i] = aguaCabe(i) ? Math.min(8, v >> 3) : 0; aguaK[i] = aguaN[i] ? (v & 7) || AGUA_LIMPA : 0; aguaSync(i); if (aguaN[i] && aguaN[i] < 8) aguaAtivar(i); } }
    return;
  }
  for (const [i] of diffs) aguaAtivarEmVolta(i);
  for (let k = 0; k < 4000 && aguaFila.length; k++) aguaPasso();   // escorre tudo de uma vez antes de o jogo começar
}
{ const _nw = newWorld; newWorld = function (sd, sv) { const r = _nw(sd, sv); aguaAssenta(sv); return r; }; }
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); if (!aguaN.length) return o;
  const d = []; for (const i of aguaMexidas) { const n = aguaVe(i); if (n !== aguaGen[i]) d.push(i, n * 8 + ((agua[i] || aguaK[i]) & 7)); }
  o.aguaD = d; return o;
}; }

/* ---------- o desenho ---------- */
// tom da água por lugar: as camadas registram um teste de linha e uma rampa de 6 tons (escuro -> claro)
const AGUA_TONS = [];
const AGUA_TOM0 = ['#02060c', '#041020', '#081c34', '#0e2c4a', '#164264', '#2a6688'];
function aguaTom(test, ramp) { AGUA_TONS.push([test, ramp]); }
const aguaRampDe = ty => { for (const [t, r] of AGUA_TONS) if (t(ty)) return r; return AGUA_TOM0; };
const AGUA_FUNDO = new Int16Array(512);
// quanto desenhar numa célula (0 a 8), sem mexer em nada
const aguaVe = i => { const a = agua[i], n = aguaN[i]; return a ? (n >= 4 ? n : 8) : n < 4 ? n : 0; };
function drawAgua(cx, cy) {
  if (!agua.length) return;
  const x0 = Math.floor(cx / T) - 1, x1 = Math.floor((cx + VW) / T) + 1, y0 = Math.max(0, Math.floor(cy / T) - 1), y1 = Math.min(WH - 1, Math.floor((cy + VH) / T) + 1);
  let any = false;
  for (let y = y0; y <= y1 && !any; y++) { const r = y * WW; for (let x = x0; x <= x1; x++) if (aguaVe(r + wrapX(x))) { any = true; break; } }
  if (!any) return;
  const ramp = aguaRampDe(Math.floor((cy + VH / 2) / T)), nx = x1 - x0 + 1;
  // quantas fileiras de água há em cima de cada célula (até 40), coluna por coluna
  for (let k = 0; k < nx; k++) { let d = 0; const gx = wrapX(x0 + k); for (let y = Math.max(0, y0 - 40); y < y0; y++) d = aguaVe(y * WW + gx) ? d + 1 : 0; AGUA_FUNDO[k] = d; }
  for (let y = y0; y <= y1; y++) {
    const r = y * WW;
    for (let k = 0; k < nx; k++) {
      const gx = wrapX(x0 + k), q = aguaVe(r + gx), a = agua[r + gx] || aguaK[r + gx];
      if (!q) { AGUA_FUNDO[k] = 0; continue; }
      const d = AGUA_FUNDO[k]++, X = (x0 + k) * T - cx, Y = y * T - cy;
      const band = Math.min(4, Math.floor(d / 10));
      lc.globalAlpha = 0.42 + band * 0.07; lc.fillStyle = a === AGUA_FERVE ? '#5a2a14' : ramp[4 - band];
      if (q < 8 && d === 0) {   // uma célula pela metade (a água escorrendo, uma lâmina no chão): a altura é o volume
        const top = T - Math.max(1, Math.round(q * T / 8));
        lc.fillRect(X, Y + top, T, T - top); lc.globalAlpha = 0.5; lc.fillStyle = ramp[5]; lc.fillRect(X, Y + top, T, 1);
      } else if (d === 0) {   // a superfície: ondula 1 px e tem a linha clara
        const w = Math.round(Math.sin(gameTime * 2.2 + (x0 + k) * 0.9) * 0.8 + Math.sin(gameTime * 1.3 + (x0 + k) * 0.37) * 0.6);
        lc.fillRect(X, Y + 2 + w, T, T - 2 - w);
        if (!SOLID[tiles[r - WW + gx]] || !r) { lc.globalAlpha = 0.55; lc.fillStyle = ramp[5]; lc.fillRect(X, Y + 2 + w, T, 1); lc.globalAlpha = 0.3; lc.fillRect(X + ((gameTime * 3 + gx * 5) % T | 0), Y + 3 + w, 3, 1); }
      } else lc.fillRect(X, Y, T, T);
      if (a === AGUA_PLANCTON && hash2(gx, y, Math.floor(gameTime * 2)) < 0.08) { lc.globalAlpha = 0.6; lc.fillStyle = '#8ae8d8'; lc.fillRect(X + ((hash2(gx, y, 3) * 11) | 0), Y + ((hash2(gx, y, 4) * 11) | 0), 1, 1); }
    }
  }
  lc.globalAlpha = 1;
}
{ const _ds = drawSmear; drawSmear = function (cx, cy) { _ds(cx, cy); drawAgua(cx, cy); }; }
