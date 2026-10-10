'use strict';

/* ================= a água (2026-10-10) =================
   Um sistema só para o jogo inteiro (docs/camadas/10-mar-sem-sol.md, "Sistemas novos", e 00-geral, seção 2).
   A água não é um bloco: é uma camada própria por célula, o vetor `agua` (um byte por célula, como `walls`):
     0 seco, 1 água, 2 água com plâncton (brilha), 3 respiradouro (bolhas: enche o fôlego), 4 água fervente.
   Assim uma corrente, um cordão ou uma escada podem estar dentro da água e os sólidos continuam sólidos.
   - A água não escorre. A geração enche por bacia (aguaBasin: um ponto e um nível, enche tudo o que estiver ligado
     abaixo do nível). No jogo, quando um bloco some e a célula vazia encosta em água do lado ou em cima, ela enche,
     e o enchimento se espalha para os lados e para baixo, nunca para cima, até 64 células. Pôr um bloco tira a água.
   - Save: nada novo. A geração refaz as bacias pela semente; ao carregar, o enchimento se repete em cada bloco
     cavado (os diffs), e o resultado é o mesmo.
   - Luz: célula molhada apaga a luz mais depressa (0,13 em vez de 0,088; o 07-chunks-luz lê o vetor).
   - Desenho: por cima do herói e dos monstros, translúcida, mais escura a cada 10 fileiras abaixo da superfície,
     com a linha da superfície clara e ondulando. Cada camada pode dar o seu tom (aguaTom).
   O nado, o fôlego e os monstros na água ficam no 172-nadar. Carrega depois das camadas e antes do 87 (só embrulha
   generate, setTile, placeTorch, newWorld e drawSmear). */

const AGUA_SECO = 0, AGUA_LIMPA = 1, AGUA_PLANCTON = 2, AGUA_RESPIRO = 3, AGUA_FERVE = 4;
let agua = new Uint8Array(0);
{ const _g = generate; generate = function (sd) { agua = new Uint8Array(WW * WH); return _g(sd); }; }

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
  for (const c of got) agua[c] = tipo;
  return got.length;
}
// esvazia (a luta da Mãe-Esporo baixa a água fileira por fileira): o chamador escolhe as células
function aguaSecar(i) { agua[i] = AGUA_SECO; }

// uma célula que abriu no jogo: se encosta em água do lado ou em cima, ela enche e espalha para os lados e para
// baixo, nunca para cima, até 64 células
function aguaEspalha(i0) {
  if (!agua.length || agua[i0] || !aguaCabe(i0)) return 0;
  const W1 = v => ((v % WW) + WW) % WW, x0 = i0 % WW, row0 = i0 - x0;
  let src = 0; for (const nb of [row0 + W1(x0 - 1), row0 + W1(x0 + 1), i0 - WW]) if (nb >= 0 && agua[nb] && agua[nb] !== AGUA_RESPIRO) { src = agua[nb]; break; }
  if (!src) return 0;
  const y0 = (i0 / WW) | 0, st = [i0], seen = new Set([i0]); let n = 0;
  while (st.length && n < 64) {
    const c = st.shift(), cx = c % WW, row = c - cx;
    agua[c] = src; n++;
    if (tiles[c] === TORCH) setTileRaw(c, AIR);   // a tocha alagada apaga
    for (const nb of [c + WW, row + W1(cx - 1), row + W1(cx + 1)]) {
      if (nb < 0 || nb >= WW * WH || seen.has(nb) || agua[nb] || ((nb / WW) | 0) < y0 || !aguaCabe(nb)) continue;
      seen.add(nb); st.push(nb);
    }
  }
  return n;
}
function setTileRaw(i, t) { const x = i % WW, y = (i / WW) | 0; tiles[i] = t; diffs.set(i, t); markDirty(x, y); }

{ const _st = setTile; setTile = function (x, y, t) {
  _st(x, y, t);
  if (!agua.length || y < 0 || y >= WH) return;
  const i = y * WW + wrapX(x);
  if (!aguaCabe(i)) agua[i] = AGUA_SECO; else aguaEspalha(i);
}; }
// não dá para pôr tocha na água
{ const _pt = placeTorch; placeTorch = function (tx, ty, inReach) { if (aguaAt(tx, ty)) return false; return _pt(tx, ty, inReach); }; }
// carregar: depois dos diffs, a água volta para onde o herói cavou e some de onde ele pôs bloco
function aguaAssenta() {
  if (!agua.length) return;
  for (let pass = 0; pass < 3; pass++) for (const [i] of diffs) { if (!aguaCabe(i)) agua[i] = AGUA_SECO; else aguaEspalha(i); }
}
{ const _nw = newWorld; newWorld = function (sd, sv) { const r = _nw(sd, sv); aguaAssenta(); return r; }; }

/* ---------- o desenho ---------- */
// tom da água por lugar: as camadas registram um teste de linha e uma rampa de 6 tons (escuro -> claro)
const AGUA_TONS = [];
const AGUA_TOM0 = ['#02060c', '#041020', '#081c34', '#0e2c4a', '#164264', '#2a6688'];
function aguaTom(test, ramp) { AGUA_TONS.push([test, ramp]); }
const aguaRampDe = ty => { for (const [t, r] of AGUA_TONS) if (t(ty)) return r; return AGUA_TOM0; };
const AGUA_FUNDO = new Int16Array(512);
function drawAgua(cx, cy) {
  if (!agua.length) return;
  const x0 = Math.floor(cx / T) - 1, x1 = Math.floor((cx + VW) / T) + 1, y0 = Math.max(0, Math.floor(cy / T) - 1), y1 = Math.min(WH - 1, Math.floor((cy + VH) / T) + 1);
  let any = false;
  for (let y = y0; y <= y1 && !any; y++) { const r = y * WW; for (let x = x0; x <= x1; x++) if (agua[r + wrapX(x)]) { any = true; break; } }
  if (!any) return;
  const ramp = aguaRampDe(Math.floor((cy + VH / 2) / T)), nx = x1 - x0 + 1;
  // quantas fileiras de água há em cima de cada célula (até 40), coluna por coluna
  for (let k = 0; k < nx; k++) { let d = 0; const gx = wrapX(x0 + k); for (let y = Math.max(0, y0 - 40); y < y0; y++) d = agua[y * WW + gx] ? d + 1 : 0; AGUA_FUNDO[k] = d; }
  for (let y = y0; y <= y1; y++) {
    const r = y * WW;
    for (let k = 0; k < nx; k++) {
      const gx = wrapX(x0 + k), a = agua[r + gx];
      if (!a) { AGUA_FUNDO[k] = 0; continue; }
      const d = AGUA_FUNDO[k]++, X = (x0 + k) * T - cx, Y = y * T - cy;
      const band = Math.min(4, Math.floor(d / 10));
      lc.globalAlpha = 0.42 + band * 0.07; lc.fillStyle = a === AGUA_FERVE ? '#5a2a14' : ramp[4 - band];
      if (d === 0) {   // a superfície: ondula 1 px e tem a linha clara
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
