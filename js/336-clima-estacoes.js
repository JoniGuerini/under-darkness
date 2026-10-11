'use strict';

/* ================= o tempo de cada estação na superfície =================
   Pedido do Jonathan (2026-10-11), junto com as estações (334) e as árvores (335):
   - Inverno: neva de vez em quando (pancadas que vêm e vão, umas horas por dia), flocos caindo devagar e balançando.
   - Outono: folhas soltam das árvores com copa colorida e descem rodando até o chão, onde ficam um pouco e somem.
   - Primavera: pétalas rosa das cerejeiras floridas e brancas das frutíferas.
   Só acontece com a câmera perto da superfície e só no céu aberto: um floco que entra num bloco ou numa caverna
   (parede de fundo) some. Partículas próprias, desenhadas antes da luz (de noite elas escurecem como o resto),
   com fillRect de 1-2 px; nenhum pixel é lido de volta. */

const CLIMA_MAX = 320;
const clima = [];   // { x, y, vx, vy, ph, sz, col, k (0 floco, 1 folha, 2 pétala), chao (s parado no chão) }
const CL_NEVE = ['#ffffff', '#eef3fa', '#dfe7f2'], CL_PETALA_P = ['#f8c0d0', '#eb98b0', '#fff0f4'], CL_PETALA_B = ['#ffffff', '#faf6f8', '#ece4ea'];

// quanto neva agora (0..1): sempre uns flocos soltos, com pancadas que sobem e descem a cada poucas horas do jogo
function climaNeve() {
  const t = worldTime / (DAY_LEN / 6), i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f);
  const n = hash2(i, 3, 97) + (hash2(i + 1, 3, 97) - hash2(i, 3, 97)) * u;
  return 0.12 + clamp((n - 0.3) * 1.6, 0, 0.88);
}
const climaLivre = (x, y) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); if (ty < 0) return true; if (ty >= WH) return false; return !SOLID[tileAt(tx, ty)] && !walls[ty * WW + wrapX(tx)]; };

let climaAcc = 0;
HOOK.update.push(dt => {
  if (!tiles) return;
  const e = estNow(), ptx = Math.floor((pl.x + pl.w / 2) / T), perto = cam.y < (surf[wrapX(ptx)] + 14) * T;
  // nascem só perto da superfície
  if (perto) {
    if (e.s === 3) {
      const q = climaNeve(); climaAcc += dt * q * 90;
      while (climaAcc >= 1 && clima.length < CLIMA_MAX) { climaAcc--; clima.push({ x: cam.x + rnd(-60, VW + 60), y: cam.y - rnd(4, 40), vx: 0, vy: rnd(14, 26), ph: rnd(0, 6.3), sz: Math.random() < 0.25 ? 2 : 1, col: CL_NEVE[(Math.random() * 3) | 0], k: 0, chao: 0 }); }
      if (climaAcc > 1) climaAcc = 1;
    } else if (estArvVis.length) {
      for (let i = 0; i < estArvVis.length; i += 3) {
        const gx = estArvVis[i], gy = estArvVis[i + 1], h = estArvVis[i + 2];
        const kind = TREE_KIND[h] !== undefined ? TREE_KIND[h] : h < 4 ? 3 : h > 6 ? 2 : 0; if (kind === 2) continue;
        const wx = wrapX(gx), v = (hash2(wx, 0, 77) * 3) | 0, sp = treeSp(kind, wx), look = treeLook(sp, kind, v, e);
        const rate = look === 'aut' ? 0.5 : look === 'autThin' ? 1.1 : look === 'bloomP' ? 0.7 : look === 'bloomW' ? 0.35 : 0;
        if (!rate || Math.random() > rate * dt || clima.length >= CLIMA_MAX) continue;
        const G = TREE_GEO[sp] && TREE_GEO[sp][kind] || TREE_GEO.carvalho[kind], top = G[0], cyo = G[2], rx = G[3], ry = G[4];
        const x = gx * T + 6 + rnd(-rx, rx) * 0.8, y = (gy + 1) * T - 3 - top - cyo + rnd(-ry, ry) * 0.6;
        let col;
        if (look === 'bloomP') col = CL_PETALA_P[(Math.random() * 3) | 0];
        else if (look === 'bloomW') col = CL_PETALA_B[(Math.random() * 3) | 0];
        else { const R = TR_RAMP[treeRamp(sp, v, look)]; col = R[3 + ((Math.random() * 4) | 0)]; }
        clima.push({ x, y, vx: rnd(-6, 6), vy: rnd(8, 14), ph: rnd(0, 6.3), sz: look === 'aut' || look === 'autThin' ? 2 : 1, col, k: look[0] === 'a' ? 1 : 2, chao: 0 });
      }
    }
  }
  const vento = Math.sin(worldTime * 0.05) * 6;
  for (let i = clima.length - 1; i >= 0; i--) {
    const c = clima[i];
    if (c.chao) { c.chao += dt; if (c.chao > 3) clima.splice(i, 1); continue; }
    c.ph += dt * (c.k ? 3.2 : 1.6);
    const bal = Math.sin(c.ph) * (c.k ? 16 : 7);
    const nx = c.x + (vento + bal + c.vx) * dt, ny = c.y + c.vy * (c.k ? 0.7 + Math.abs(Math.cos(c.ph)) * 0.6 : 1) * dt;
    if (!climaLivre(nx, ny)) {
      // folhas e pétalas param no chão um pouco; flocos somem (o chão já está branco)
      if (c.k && SOLID[tileAt(Math.floor(nx / T), Math.floor(ny / T))] && climaLivre(nx, ny - T)) { c.chao = 0.001; c.y = Math.floor(ny / T) * T - 1; continue; }
      clima.splice(i, 1); continue;
    }
    c.x = nx; c.y = ny;
    if (c.y > cam.y + VH + 30 || Math.abs(c.x - (cam.x + VW / 2)) > VW) clima.splice(i, 1);
  }
});
HOOK.drawWorld.push((cx, cy) => {
  for (const c of clima) {
    const x = Math.round(c.x) - cx, y = Math.round(c.y) - cy; if (x < -2 || x > VW || y < -2 || y > VH) continue;
    if (c.chao) lc.globalAlpha = Math.min(1, (3 - c.chao) * 1.5);
    lc.fillStyle = c.col;
    if (c.k === 1) { const w = Math.cos(c.ph) > 0 ? 2 : 1; lc.fillRect(x, y, w, c.chao ? 1 : 2 - (w - 1)); }
    else lc.fillRect(x, y, c.sz, c.sz);
    if (c.chao) lc.globalAlpha = 1;
  }
});
{ const _nw = newWorld; newWorld = function (sd, sv) { clima.length = 0; return _nw(sd, sv); }; }
