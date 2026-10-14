'use strict';

/* ================= os cogumelos das Cavernas, redesenhados (2026-10-14) =================
   Pedido do Jonathan (2026-10-14): os cogumelos da primeira camada, os marrons e os azuis que brilham, podiam ficar
   melhores. Agora cada cogumelo é pintado pixel a pixel como o resto do cenário novo: chapéu em domo com luz de cima à
   esquerda, grão, borda escura, aba de lamelas por baixo, pé que engrossa no chão, sardas claras
   nos marrons e pintas acesas nos azuis. Troca os dois enfeites de bloco (SHROOM, o azul, e CV_COGUMELO, o marrom) e as
   duas touceiras grandes do 54 (cv_cogumelos e cv_cogumelos_luz), mantendo tamanho, luz e onde aparecem.
   Carrega depois do 54, antes do 24-boot. */
{
const R7 = hexes => hexes.map(h => ph(h));
const CG = {
  marrom: R7(['#2a160b', '#462612', '#64391b', '#845026', '#a46a34', '#c48a4c', '#e0ae72']),
  sarda: R7(['#6a5034', '#8c7050', '#ad9270', '#c8ae8a', '#dcc6a2', '#ecdcbc', '#f6ecd4']),
  azul: R7(['#062a30', '#0c4650', '#14666e', '#1e8a92', '#32b0b8', '#5ad6dc', '#a8f4f6']),
  pinta: R7(['#3ab8c0', '#5ed0d6', '#86e2e6', '#a8eef0', '#c8f6f6', '#e2fcfc', '#ffffff']),
  pe: R7(['#262018', '#3a3226', '#5a5242', '#807662', '#a69c84', '#c8bfa6', '#e2dac4']),
  pea: R7(['#10201e', '#1e3432', '#38524c', '#5a7a72', '#80a29a', '#a8c8c0', '#d0ece6']),
  lamela: R7(['#1a0e08', '#2e1c10', '#46301c', '#5e4428', '#765a38', '#8e7048', '#a8885c']),
  lamelaA: R7(['#06181a', '#0a2a2c', '#124040', '#1a5a58', '#267872', '#36968e', '#4eb4aa'])
};
const g = (x, y, s) => hash2(x, y, s) - 0.5;
function pintor(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), rs = [];
  return {
    w, h, c,
    put(x, y, R, v) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; let i = rs.indexOf(R); if (i < 0) { rs.push(R); i = rs.length - 1; } c[y * w + x] = R[v < 0 ? 0 : v > 6 ? 6 : v | 0]; rid[y * w + x] = i; },
    done(baixo) {   // a borda escura: a cor mais escura da rampa vizinha (no chão, sem borda embaixo)
      const src = c.slice(), sr = rid.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const k = y * w + x; if (src[k]) continue;
        let n = -1; if (x > 0 && src[k - 1]) n = k - 1; else if (x < w - 1 && src[k + 1]) n = k + 1; else if (y < h - 1 && src[k + w]) n = k + w; else if (baixo && y > 0 && src[k - w]) n = k - w;
        if (n >= 0) c[k] = rs[sr[n]][0];
      }
      return c;
    }
  };
}
// um cogumelo: pé de (cx, chão) com altura hgt, chapéu de raio r; luz = o azul que brilha; lean entorta o pé
function cogumelo(P, cx, chao, hgt, r, luz, s, lean = 0) {
  const PE = luz ? CG.pea : CG.pe, CAP = luz ? CG.azul : CG.marrom, LAM = luz ? CG.lamelaA : CG.lamela, PT = luz ? CG.pinta : CG.sarda;
  const topo = chao - hgt;                         // a linha da aba do chapéu
  const pw = Math.max(0.6, r * 0.3);              // meia-largura do pé
  // o pé: engrossa embaixo, entorta um pouco, claro à esquerda
  for (let y = topo; y < chao; y++) {
    const t = (y - topo) / Math.max(1, hgt), off = lean * (1 - t) * (1 - t) * r * 0.5, ww = pw * (1 + Math.max(0, t - 0.7) * 1.4);
    const x0 = Math.round(cx + off - ww - 0.01), x1 = Math.round(cx + off + ww - 0.99);
    for (let x = x0; x <= Math.max(x0, x1); x++) {
      const u = x1 > x0 ? (x - x0) / (x1 - x0) : 0.5;
      P.put(x, y, PE, 5.4 - u * 2.6 + g(x, y, s) * 0.6 - (y === topo + 1 ? 1.4 : 0) + (t > 0.85 ? -0.6 : 0));
    }
  }
  // as lamelas: uma faixa escura por baixo da aba, riscada
  const ra = r * 0.78;
  for (let x = Math.round(cx - ra); x <= Math.round(cx + ra - 1); x++) P.put(x, topo, LAM, (x & 1 ? 3 : 4.4) + g(x, topo, s + 3) * 0.6 - Math.abs(x + 0.5 - cx) / ra * 0.8);
  // o chapéu: um domo, a borda um pouco caída, luz de cima à esquerda e um brilho
  const hc = Math.max(1.5, r * 0.95);
  for (let y = Math.floor(topo - hc - 1); y < topo; y++) for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r); x++) {
    const dx = (x + 0.5 - cx) / r, dy = (topo - 1 - y) / hc;   // dy 0 na aba, 1 no alto
    if (dy < 0 || Math.pow(Math.abs(dx), 2.6) + dy * dy > 1.02) continue;
    const lz = -dx * 0.55 + dy * 0.75;            // luz
    let v = (luz ? 3.4 : 3.2) + lz * 2.4 + g(x, y, s + 1) * 0.6;
    if (y === topo - 1) v -= 0.9;                       // a aba fica na sombra
    if (Math.abs(dx + 0.38) < 0.16 && Math.abs(dy - 0.68) < 0.16) v += 1.4;   // o brilho
    P.put(x, y, CAP, v);
    // sardas (marrom) e pintas acesas (azul)
    const sp = hash2(x, y, s + 7);
    if (dy > 0.3 && dx * dx + dy * dy < 0.75 && sp < (luz ? 0.13 : 0.1) && r >= 2) P.put(x, y, PT, luz ? 4 + lz * 2 : 2.5 + lz * 2.5);
  }
}
function cogTile(lista, luz, s) {   // um enfeite de bloco (T x T) com alguns cogumelos
  const P = pintor(T, T); for (const [cx, h, r, l] of lista.slice().sort((a, b) => b[2] - a[2])) cogumelo(P, cx, T, h, r, luz, s, l || 0); return P.done(false);
}
function cogTouceira(lista, luz, s) {   // a touceira grande (24 x 16): chão de terra embaixo
  const P = pintor(24, 16);   // os grandes atrás, os pequenos na frente
  for (const [cx, h, r, l] of lista.slice().sort((a, b) => b[2] - a[2])) cogumelo(P, cx, 15, h, r, luz, s, l || 0);
  const terra = R7(['#140d08', '#24170e', '#382516', '#4e3520', '#64472d', '#7a5a3c', '#94704e']);
  for (let x = 0; x < 24; x++) if (P.c[14 * 24 + x] || P.c[13 * 24 + x]) for (let y = 15; y < 16; y++) P.put(x, y, terra, 2.4 + g(x, y, s) * 1.6);
  const px = P.done(false), cv = document.createElement('canvas'); cv.width = 24; cv.height = 16;
  const im = new ImageData(24, 16), u = new Uint32Array(im.data.buffer); u.set(px); cv.getContext('2d').putImageData(im, 0, 0);
  return cv;
}
DECO[CV_COGUMELO] = [
  cogTile([[8.5, 3, 1.8, 0.3], [4, 6, 3.2, -0.4]], false, 4101),
  cogTile([[2.2, 3, 1.5, -0.3], [9.8, 3.5, 1.7, 0.4], [6, 7, 3.6, 0.1]], false, 4103)
];
DECO[SHROOM] = [
  cogTile([[8.6, 4, 2.2, 0.4], [4.2, 7, 3.4, -0.3]], true, 4107),
  cogTile([[3, 5, 2.4, -0.4], [8.4, 3.5, 2.2, 0.3], [10.6, 2, 1.3, 0]], true, 4109)
];
for (const [id, luz, lista, s] of [
  ['cv_cogumelos', false, [[16, 7, 3.6, 0.4], [3.6, 7, 3, -0.5], [21, 4, 2.2, 0.3], [7.5, 3, 1.6, -0.2], [10.5, 9.5, 4.6, 0.1], [14, 4, 1.8, 0]], 4111],
  ['cv_cogumelos_luz', true, [[5, 7, 3.2, -0.4], [17.5, 6, 3, 0.4], [11, 9.5, 4.4, 0.1], [20.8, 4, 2, 0.2], [2, 4, 1.8, -0.3], [14.5, 3, 1.6, 0]], 4113]
]) { const D = PROP_DEFS[id]; if (D) D.vars = [propPixels(cogTouceira(lista, luz, s))]; }
}
