'use strict';

/* ================= a Escuridão: a luz como regra =================
   O jogo já calcula a luz de cada tile perto da câmera (computeLight, 07: LB, de 0 a 1 ou mais). Aqui ela vira regra
   (docs/camadas/16-escuridao.md, seção 13):
   - lightAt: a luz de um tile no último quadro; fora da janela, os braseiros acesos guardados em esLit (1,3 − 0,088 por
     bloco de distância), para que um monstro fora da tela também saiba se está na luz.
   - o escuro total: na camada o piso de claridade do 07 (DARK.amb) cai a quase nada, menos que em qualquer outra (só o
     bastante para o herói ainda se achar). Depois do Nox, o mundo todo fica um pouco menos escuro, e a Escuridão ganha a
     claridade de uma caverna funda.
   - o dano da luz: monstros `sombra` em ET tomam (L − 0,6) × 0,5 × vida máxima por segundo com mais de 0,6 de luz.
   - tochas que acabam: tocha posta na camada vira tocha morta depois de 90 s (20 s na sala do Nox; A Última Brasa as
     deixa acesas para sempre). O apagador e o Nox apagam na hora (esSnuff).
   - braseiros (Jonathan, 2026-10-10): um braseiro apagado acende com a tecla de usar e um lume-fátuo da bolsa (a
     chama azul que flutua pelo bioma: encostar nela a recolhe; o acendedor oco também solta). Acende azul e nenhum
     monstro apaga; tocha não acende braseiro. A pira da sala do Nox também pede um lume-fátuo, com o herói ajoelhado
     1 s (interrompe se ele andar, golpear ou apanhar), e é a única chama que o Nox e os apagadores apagam: o lume dela
     foge pela sala (227).
   - o mapa que esquece: cada tile visto da camada ganha uma idade; com o herói aqui, tile que não está aceso envelhece
     1 por segundo e com 120 sai do mapa. A menos de 14 blocos de um braseiro aceso nunca envelhece.
   - o breu vivo: a cada 4 s ele cresce para um tile de ar escuro vizinho (dentro da tela, nunca em esKeep, nunca em
     cima de ninguém); com luz de 0,6 ou mais ele recua. É escrito direto em tiles: não vai para o save.
   - a laje de penumbra: com 0,45 de luz ou mais ela vira chão firme (ES_PENUMBRA_FIRME); no escuro volta a ser vidro e
     não segura ninguém. Também escrita direto em tiles.
   - a cegueira (o pó da mariposa, a esfera do vigia, a mortalha): a tela fecha num círculo em volta do herói.
   Carrega depois do 222 e antes das crias (224, 225) e do mundo (226). */

const esLit = new Set();          // os braseiros e piras acesos da camada (índice no mundo)
const esEternal = new Set();      // os braseiros dos Postos de pouso: nada os apaga
const esTorches = new Map();      // tocha posta na camada: índice -> segundos que faltam
const ES_TORCH_T = 90, ES_TORCH_HALL_T = 20;
let esNearMask = null, esNearDirty = true, esSeenAge = null;
const esNoxDead = () => typeof noxState !== 'undefined' && noxState.dead;

/* ---- the light of a tile ---- */
function esLBAt(tx, ty) {
  if (!LB) return -1;
  const i = (((tx - LX0) % WW) + WW) % WW, j = ty - LY0;
  return i < LW && j >= 0 && j < LH ? LB[j * LW + i] : -1;
}
function esLightAt(tx, ty) {
  const v = esLBAt(tx, ty); if (v >= 0) return v;
  let best = 0; for (const k of esLit) { const x = k % WW, y = (k / WW) | 0, d = Math.hypot(wdx(x - tx), y - ty), L = (tiles[k] === ES_PIRA ? 1.6 : 1.3) - 0.088 * d; if (L > best) best = L; }
  return best;
}
function esNearLit(tx, ty, r) { for (const k of esLit) { const x = k % WW, y = (k / WW) | 0; if (Math.abs(wdx(x - tx)) <= r && Math.abs(y - ty) <= r && Math.hypot(wdx(x - tx), y - ty) <= r) return true; } return false; }
const esLightAtPx = (x, y) => esLightAt(Math.floor(x / T), Math.floor(y / T));

/* ---- scanning: lit braziers, the eternal ones, the torches ---- */
function esScan() {
  esLit.clear(); esEternal.clear(); esTorches.clear(); esNearDirty = true;
  if (!ESCURO) return;
  const Y1 = Math.min(WH, ES_S0 + ES_D);
  for (let i = ES_S0 * WW; i < Y1 * WW; i++) { const t = tiles[i]; if (t === ES_BRASEIRO || t === ES_PIRA) esLit.add(i); else if (t === TORCH) esTorches.set(i, inEsHall(i % WW, (i / WW) | 0, 0) ? ES_TORCH_HALL_T : ES_TORCH_T); }
  for (const L of esLand) esEternal.add((L.fy - 1) * WW + L.bx);
  esSeenAge = new Uint8Array(WW * ES_D);
}
{ const _nw = newWorld; newWorld = function (sd, sv) { const r = _nw(sd, sv); try { esScan(); } catch (err) { console.error(err); } return r; }; }
// every change of a tile keeps the lists right (placing a torch, lighting, snuffing, breaking)
{ const _st = setTile; setTile = function (x, y, t) {
  _st(x, y, t);
  if (!ESCURO || y < ES_S0 || y >= ES_S0 + ES_D) return;
  const i = y * WW + wrapX(x);
  if (t === ES_BRASEIRO || t === ES_PIRA) { if (!esLit.has(i)) { esLit.add(i); esNearDirty = true; } } else if (esLit.delete(i)) esNearDirty = true;
  if (t === TORCH) esTorches.set(i, inEsHall(wrapX(x), y, 0) ? ES_TORCH_HALL_T : ES_TORCH_T); else esTorches.delete(i);
}; }
// a light goes out: a pyre back to cold, a torch to a dead one. A brazier lit with a wisp never goes out (Jonathan,
// 2026-10-10: the monsters put out only the torches the hero sets, and the Nox his pyres)
function esSnuff(tx, ty) {
  const t = tileAt(tx, ty), i = ty * WW + wrapX(tx);
  if (esEternal.has(i) || t === ES_BRASEIRO) return false;
  if (t === ES_PIRA) setTile(tx, ty, ES_PIRA_FRIA);
  else if (t === TORCH) setTile(tx, ty, ES_TOCHA_MORTA);
  else return false;
  const x = (tx + 0.5) * T, y = ty * T + 4;
  for (let k = 0; k < 10; k++) parts.push({ x: x + rnd(-3, 3), y: y + rnd(-2, 3), vx: rnd(-6, 6), vy: rnd(-26, -10), g: -6, life: 1.3, max: 1.3, col: k % 3 ? '#2a2628' : '#4a4446', size: 1, smoke: true });
  sfx.esApaga(Math.abs(x - pl.x) < 220 ? 1 : 0.4);
  return true;
}
// the nearest light within r tiles ([tx, ty] or null): any lit brazier, pyre or torch (the moths fly to any), or with
// `snuff` only what a monster can put out (torches and pyres)
function esNearestLight(tx, ty, r, snuff = false) {
  let best = null, bd = r * r;
  const look = k => { if (snuff && tiles[k] === ES_BRASEIRO) return; const x = k % WW, y = (k / WW) | 0, dx = wdx(x - tx), dy = y - ty, d = dx * dx + dy * dy; if (d < bd && !esEternal.has(k)) { bd = d; best = [x, y]; } };
  for (const k of esLit) look(k); for (const k of esTorches.keys()) look(k);
  return best;
}

/* ---- the total dark: the 07's ambient floor goes to 0 in the layer; after the Nox, the world is a little less dark ---- */
const ES_DARK0 = { amb: DARK.amb, cap: DARK.cap };
HOOK.update.push(() => {
  if (!ESCURO || !pl) return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), inL = pty >= ES_S0 - 2 && pty < ES_S0 + ES_D + 4, dead = esNoxDead();
  // in the layer a thread less than anywhere else (the hero can still find himself); after the Nox, a deep cave's
  DARK.amb = inL ? (dead ? 0.03 : 0.008) : ES_DARK0.amb + (dead ? 0.015 : 0);
  DARK.cap = ES_DARK0.cap;
});

/* ---- lighting a brazier: the use key and a wisp; a pyre: a wisp and kneeling 1 s ---- */
const ES_KNEEL_T = 1;
function esFindCold(pcx, pcy) {
  const tx0 = Math.floor(pcx / T), ty0 = Math.floor(pcy / T); let best = null, bd = 99;
  for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
    const t = tileAt(tx0 + dx, ty0 + dy); if (t !== ES_BRASEIRO_FRIO && t !== ES_PIRA_FRIA) continue;
    const d = Math.hypot((tx0 + dx + 0.5) * T - pcx, (ty0 + dy + 0.5) * T - pcy); if (d < bd && d < 26) { bd = d; best = [tx0 + dx, ty0 + dy, t]; }
  }
  return best;
}
// a brazier takes a wisp (lume_fatuo) and burns cold blue for good; a pyre of the Nox's hall takes one too (Jonathan,
// 2026-10-10), and burns blue until he blows it out
function esLight(tx, ty) {
  const t = tileAt(tx, ty), pyre = t === ES_PIRA_FRIA;
  if (t !== ES_BRASEIRO_FRIO && !pyre) return false;
  if (countItem('lume_fatuo') <= 0) { floatText(pl.x + pl.w / 2, pl.y - 8, 'Precisa de um lume-fátuo', '#d9c7a3', 0.8); return false; }
  removeItem('lume_fatuo', 1);
  setTile(tx, ty, pyre ? ES_PIRA : ES_BRASEIRO);
  burst((tx + 0.5) * T, ty * T + 3, pyre ? 22 : 14, pyre ? '#b4ceff' : '#9ab8ec', 70, -60, 0.6, 1, true);
  sfx.esAcende(pyre);
  return true;
}
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (!ESCURO || pl.dead) { pl.esKneel = null; return _up(dt); }
  const K = pl.esKneel;
  if (K) {   // kneeling at a pyre: anything else breaks it
    const moving = keys.KeyA || keys.KeyD || keys.ArrowLeft || keys.ArrowRight || keys.Space || keys.KeyW || keys.ArrowUp || mouse.l || !pl.onGround;
    if (moving || tileAt(K.x, K.y) !== ES_PIRA_FRIA) pl.esKneel = null;
    else if ((K.t -= dt) <= 0) { pl.esKneel = null; esLight(K.x, K.y); }
  }
  if (pressed.KeyE && state === 'play' && !(typeof nearNpc === 'function' && nearNpc())) {
    const c = esFindCold(pl.x + pl.w / 2, pl.y + pl.h / 2);
    if (c) {
      pressed.KeyE = false;
      if (c[2] === ES_BRASEIRO_FRIO) esLight(c[0], c[1]);   // the wisp goes in at once
      else if (countItem('lume_fatuo') <= 0) floatText(pl.x + pl.w / 2, pl.y - 8, 'Precisa de um lume-fátuo', '#d9c7a3', 0.8);
      else if (!pl.esKneel) { pl.esKneel = { x: c[0], y: c[1], t: ES_KNEEL_T, max: ES_KNEEL_T }; sfx.esRisca(); }
    }
  }
  return _up(dt);
}; }
{ const _raw = rawDamage; rawDamage = function (d, kdir) { pl.esKneel = null; return _raw(d, kdir); }; }
// kneeling looks like crouching (89 loads later: wrapped at the first frame)
let esCrouchWrapped = false;
HOOK.update.push(() => {
  if (esCrouchWrapped || typeof crouchWanted !== 'function') return;
  esCrouchWrapped = true;
  const _cw = crouchWanted; crouchWanted = function () { return _cw() || (!!pl.esKneel && pl.onGround && !pl.dead); };
});
// the kneel's bar over his head, the wisp's cold flame catching at the pyre
HOOK.drawTop.push((cx, cy) => {
  const K = pl.esKneel; if (!K || pl.dead) return;
  const k = 1 - K.t / K.max, x = Math.round(pl.x + pl.w / 2 - cx) - 7, y = Math.round(pl.y - cy) - 7;
  lc.fillStyle = '#0a0c14'; lc.fillRect(x - 1, y - 1, 16, 4); lc.fillStyle = '#1c2a44'; lc.fillRect(x, y, 14, 2); lc.fillStyle = '#9ab8ec'; lc.fillRect(x, y, Math.round(14 * k), 2);
  if (Math.random() < 0.5) parts.push({ x: (K.x + 0.5) * T + rnd(-2, 2), y: K.y * T + 3, vx: rnd(-6, 6), vy: rnd(-30, -12), g: -10, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#7aa2dc' : '#e6f0ff', size: 1, glow: true });
});

/* ---- the light that hurts the shadow creatures; torches that burn out; the map that forgets; the living dark; the slabs ---- */
let esSecT = 0, esVivoT = 0, esSlabT = 0;
HOOK.update.push(dt => {
  if (!ESCURO || !pl || state !== 'play') return;
  const pty = Math.floor((pl.y + pl.h / 2) / T), here = pty >= ES_S0 - 4 && pty < ES_S0 + ES_D + 4;
  const brasa = pl.lg && pl.lg.ultimaBrasa;
  // the light hurts them
  for (const e of enemies) {
    if (e.dead || !ET[e.type] || !ET[e.type].sombra || e.boss) continue;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    let L = esLightAtPx(ex, ey);
    if (brasa && !pl.dead && Math.hypot(ex - pl.x - pl.w / 2, ey - pl.y - pl.h / 2) < 3.5 * T) L = Math.max(L, 0.95);   // A Última Brasa: a luz dele é a de um braseiro
    e.esL = L;
    if (L <= 0.6) continue;
    e.esBurn = (e.esBurn || 0) + (L - 0.6) * 0.5 * e.maxHp * dt;
    if (Math.random() < dt * 14) parts.push({ x: ex + rnd(-e.w / 2, e.w / 2), y: ey + rnd(-e.h / 2, e.h / 2), vx: rnd(-8, 8), vy: rnd(-34, -14), g: -10, life: 0.7, max: 0.7, col: Math.random() < 0.6 ? '#141018' : '#3a3046', size: 1, smoke: true });
    if (e.esBurn >= 1) {
      const d = Math.floor(e.esBurn); e.esBurn -= d; e.hp -= d; e.flash = Math.max(e.flash, 0.05); e.showHp = 2;
      if (Math.random() < 0.15) sfx.esChia();
      if (e.hp <= 0) killEnemy(e);
    }
  }
  // torches that burn out
  for (const [i, s] of esTorches) {
    if (tiles[i] !== TORCH) { esTorches.delete(i); continue; }
    if (brasa) continue;   // A Última Brasa: as tochas dele não se apagam sozinhas
    const left = s - dt; esTorches.set(i, left);
    if (left < 6 && Math.random() < dt * 3) parts.push({ x: (i % WW + 0.5) * T + rnd(-2, 2), y: ((i / WW) | 0) * T + 2, vx: rnd(-3, 3), vy: rnd(-16, -8), g: -4, life: 0.9, max: 0.9, col: '#3a3436', size: 1, smoke: true });
    if (left <= 0) { esTorches.delete(i); esSnuff(i % WW, (i / WW) | 0); }
  }
  if (!here) return;
  // the penumbra slabs: firm with light on them (every 0.1 s, only the ones near the screen)
  if ((esSlabT -= dt) <= 0) {
    esSlabT = 0.1;
    for (const S of typeof esSlabs !== 'undefined' ? esSlabs : []) {
      if (Math.abs(wdx(S.x0 - Math.floor((cam.x + VW / 2) / T))) > VW / T + 20 || Math.abs(S.fy - pty) > 40) continue;
      for (let x = S.x0; x < S.x0 + S.w; x++) {
        const tx = wrapX(x), i = S.fy * WW + tx, t = tiles[i]; if (t !== ES_PENUMBRA && t !== ES_PENUMBRA_FIRME) continue;
        const L = esLBAt(tx, S.fy), want = L >= 0.45 ? ES_PENUMBRA_FIRME : ES_PENUMBRA;
        if (want === t) continue;
        if (want === ES_PENUMBRA_FIRME) { const r = { x: tx * T, y: S.fy * T, w: T, h: T }; if (!pl.dead && overlap(r, pl)) continue; if (enemies.some(e => !e.dead && overlap(r, e))) continue; }
        tiles[i] = want; markDirty(tx, S.fy);
        if (want === ES_PENUMBRA_FIRME && Math.random() < 0.3) parts.push({ x: tx * T + rnd(1, 11), y: S.fy * T + 2, vx: rnd(-4, 4), vy: rnd(-6, -2), g: 0, life: 0.6, max: 0.6, col: '#8a98ae', size: 1 });
      }
    }
  }
  // the living dark: grows into the dark every 4 s, gives way to strong light every second
  esVivoT += dt;
  if (LB && esVivoT >= 1) {
    const grow = (Math.floor((esVivoT + gameTime) / 4) !== Math.floor(gameTime / 4)) || Math.random() < 0.25;
    esVivoT = 0;
    const x0 = Math.floor(cam.x / T) - 2, y0 = Math.max(ES_S0, Math.floor(cam.y / T) - 2), x1 = x0 + Math.ceil(VW / T) + 4, y1 = Math.min(ES_S0 + ES_D - 2, y0 + Math.ceil(VH / T) + 4);
    const live = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileAt(x, y) === ES_BREU_VIVO) live.push(x, y);
    for (let k = 0; k < live.length; k += 2) {
      const x = live[k], y = live[k + 1];
      if (esLBAt(wrapX(x), y) >= 0.6) { const i = y * WW + wrapX(x); tiles[i] = AIR; markDirty(wrapX(x), y); for (let n = 0; n < 6; n++) parts.push({ x: (x + 0.5) * T + rnd(-4, 4), y: (y + 0.5) * T + rnd(-4, 4), vx: rnd(-10, 10), vy: rnd(-24, -6), g: -6, life: 0.8, max: 0.8, col: '#0a0a12', size: 1, smoke: true }); if (Math.random() < 0.3) sfx.esChia(); }
    }
    if (grow && live.length && live.length < 120 && !esNoxDead()) {   // after the Nox it stops growing
      for (let n = 0; n < Math.min(6, live.length / 2); n++) {
        const k = ((Math.random() * live.length / 2) | 0) * 2, x = live[k], y = live[k + 1], d = (Math.random() * 4) | 0, nx = wrapX(x + (d === 0 ? 1 : d === 1 ? -1 : 0)), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0), i = ny * WW + nx;
        if (tiles[i] !== AIR || !walls[i] || esKeep.has(i) || esLBAt(nx, ny) > 0.05 || inEsHall(nx, ny, 2)) continue;
        const r = { x: nx * T - T, y: ny * T - T, w: 3 * T, h: 3 * T };
        if (!pl.dead && overlap(r, pl)) continue;
        if (enemies.some(e => !e.dead && overlap({ x: nx * T, y: ny * T, w: T, h: T }, e))) continue;
        tiles[i] = ES_BREU_VIVO; markDirty(nx, ny);
      }
    }
  }
  // the map forgets, once a second
  if ((esSecT += dt) >= 1 && esSeenAge) {
    esSecT = 0;
    if (esNearDirty || !esNearMask) {
      esNearDirty = false; esNearMask = new Uint8Array(WW * ES_D);
      for (const k of esLit) { const bx = k % WW, by = ((k / WW) | 0) - ES_S0; for (let dy = -14; dy <= 14; dy++) { const yy = by + dy; if (yy < 0 || yy >= ES_D) continue; const hw = Math.floor(Math.sqrt(196 - dy * dy)); for (let dx = -hw; dx <= hw; dx++) esNearMask[yy * WW + wrapX(bx + dx)] = 1; } }
    }
    let gone = 0;
    for (let r = 0; r < ES_D; r++) {
      const gy = ES_S0 + r, row = gy * WW, ar = r * WW, j = gy - LY0, inJ = LB && j >= 0 && j < LH;
      for (let x = 0; x < WW; x++) {
        if (!seen[row + x]) continue;
        let lit = esNearMask[ar + x] === 1;
        if (!lit && inJ) { const i = (((x - LX0) % WW) + WW) % WW; if (i < LW && LB[j * LW + i] > 0.1) lit = true; }
        if (lit) { esSeenAge[ar + x] = 0; continue; }
        const a = esSeenAge[ar + x] + 1; esSeenAge[ar + x] = a > 250 ? 250 : a;
        if (a >= 120) { seen[row + x] = 0; esSeenAge[ar + x] = 0; gone++; }
      }
    }
    if (gone) mapVer++;
  }
});

/* ---- the wisps: walking into a floating wisp gathers it (the tile goes, saved, so it does not come back) ---- */
HOOK.update.push(() => {
  if (!ESCURO || !pl || pl.dead || state !== 'play' || !touchingTile(pl, ES_LUME)) return;
  const x0 = Math.floor((pl.x + 1) / T), x1 = Math.floor((pl.x + pl.w - 1) / T), y0 = Math.floor(pl.y / T), y1 = Math.floor((pl.y + pl.h - 1) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (tileAt(tx, ty) !== ES_LUME || !canFit('lume_fatuo')) continue;
    setTile(tx, ty, AIR); addItem('lume_fatuo', 1);
    floatText((tx + 0.5) * T, ty * T - 2, '+1 Lume-Fátuo', '#b4ceff', 0.8);
    burst((tx + 0.5) * T, (ty + 0.5) * T, 10, '#9ab8ec', 50, -40, 0.5, 1, true);
    sfx.esLume();
  }
});

/* ---- blindness: the moth's dust, the watcher's sphere, the shroud ---- */
function esBlind(sec, k) { if (pl.dead) return; pl.esBlindT = Math.max(pl.esBlindT || 0, sec); pl.esBlindK = Math.max(k, (pl.esBlindT || 0) > 0 ? pl.esBlindK || 0 : 0); }
HOOK.update.push(dt => { if (!pl) return; if ((pl.esBlindT || 0) > 0) { pl.esBlindT -= dt; if (pl.esBlindT <= 0 || pl.dead) { pl.esBlindT = 0; pl.esBlindK = 0; } } });
HOOK.drawTop.push((cx, cy) => {
  const w = typeof esWrapT !== 'undefined' && esWrapT > 0 ? 1 : 0, b = (pl.esBlindT || 0) > 0 ? pl.esBlindK * Math.min(1, pl.esBlindT * 2) : 0, k = Math.max(w, b);
  if (k <= 0 || pl.dead) return;
  const W = lc.canvas.width, H = lc.canvas.height, x = pl.x + pl.w / 2 - cx, y = pl.y + pl.h / 2 - cy;
  const g = lc.createRadialGradient(x, y, w ? 6 : 18, x, y, w ? 26 : 70);
  g.addColorStop(0, 'rgba(2,2,4,0)'); g.addColorStop(1, `rgba(2,2,4,${(0.96 * k).toFixed(3)})`);
  lc.fillStyle = g; lc.fillRect(0, 0, W, H);
});

/* ---- sounds ---- */
Object.assign(sfx, {
  esAcende(big) {
    if (big) { tone(330, 1.8, 'sine', 0.05, -20); tone(495, 1.4, 'sine', 0.03, -30, 0.06); tone(110, 1.2, 'sine', 0.05, 20); noise(0.8, 0.05, 2400, 'bandpass', 0, 1.2); return; }   // a pyre: the same glass, deeper
    tone(660, 1.4, 'sine', 0.04, -40); tone(990, 1.1, 'sine', 0.025, -60, 0.06); tone(1320, 0.8, 'sine', 0.012, 0, 0.12); noise(0.6, 0.04, 3200, 'bandpass', 0, 1.5);   // the cold flame catching: glassy
  },
  esLume() { tone(1180, 0.35, 'sine', 0.03, 200); tone(1770, 0.25, 'sine', 0.015, 120, 0.05); },
  esApaga(v = 1) { noise(0.35, 0.07 * v, 900, 'lowpass'); noise(0.5, 0.03 * v, 2600, 'highpass', 0.05); tone(180, 0.3, 'sine', 0.015 * v, -120); },
  esRisca() { noise(0.12, 0.06, 3000, 'bandpass', 0, 2); },
  esChia() { noise(0.18, 0.04, 4200, 'highpass'); }
});
