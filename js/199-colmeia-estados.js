'use strict';

/* ================= a Colmeia: os estados do herói e a colmeia que se conserta =================
   Carrega depois do 196 (a Rainha), no fim da cadeia da camada. Aqui:
   - os blocos que soltam larva (HATCH, 190): quando um Ovo Colado ou um Favo Real quebra (pelo herói, pela Rainha,
     por quem for: cmQuebra), sai no máximo uma larva no lugar, fora do limite de spawn da faixa;
   - a operária que lacra: os blocos que o herói quebrou na camada nos últimos 60 s ficam em cmBroken; a operária (193)
     pergunta cmCanSeal e chama cmSeal, que põe Cera Nova com setTile (entra nos diffs e no save). Nunca no bloco do
     herói nem nos 8 em volta, nunca escada, fio, a esfera da Rainha, o pouso ou as bocas;
   - encasulado (cmEncasular, a vespa-resineira): resina dura em volta, não anda, não ataca, não minera; A e D
     alternados soltam antes; desenhado por cima do herói;
   - ovo de parasita (cmPorOvo, a vespa-parasita): um ponto que pulsa no peito com um coração pequeno; em 5 s eclode
     (o dobro do dano da vespa e uma larva) se a vespa que pôs não morrer antes ou ele não beber poção;
   - a poça de mel: o pé no mel deixa o herói 40% mais lento (a lentidão das Minas Fúngicas, 120).
   Poção e morte limpam o casulo e o ovo. */

const cmBroken = new Map();   // 'tx,ty' -> { tx, ty, t }
const CM_SEAL_SEC = 60;
function cmSealable(t) { return t === AIR; }
function cmCanSeal(tx, ty) {
  tx = wrapX(tx);
  if (!COLMEIA || !inColmeia(ty) || !cmSealable(tileAt(tx, ty))) return false;
  if (inCmHall(tx, ty, 1) || inCmLand(tx, ty, 1) || cmKeep.has(ty * WW + tx)) return false;
  // o bloco do herói e os 8 em volta (o herói ocupa 1 x 2)
  const hx0 = Math.floor(pl.x / T), hx1 = Math.floor((pl.x + pl.w - 1) / T), hy0 = Math.floor(pl.y / T), hy1 = Math.floor((pl.y + pl.h - 1) / T);
  const dx0 = wdx(tx - hx0), dx1 = wdx(tx - hx1);
  if (dx0 >= -1 && dx1 <= 1 && ty >= hy0 - 1 && ty <= hy1 + 1) return false;
  // ninguém preso dentro
  for (const e of enemies) if (!e.dead && e.x < (tx + 1) * T && e.x + e.w > tx * T && e.y < (ty + 1) * T && e.y + e.h > ty * T) return false;
  return true;
}
function cmSeal(tx, ty) {
  tx = wrapX(tx);
  if (!cmCanSeal(tx, ty)) return false;
  setTile(tx, ty, CM_CERA_NOVA);
  cmBroken.delete(tx + ',' + ty);
  if (typeof burst === 'function') burst((tx + 0.5) * T, (ty + 0.5) * T, 6, '#d8b850', 30, -20, 0.4, 1);
  return true;
}
// quebra um bloco e sorteia a larva (a Rainha e o golpe no Favo Real usam isto)
function cmQuebra(tx, ty) {
  tx = wrapX(tx);
  const t = tileAt(tx, ty); if (!SOLID[t] || t === CM_LACRE || t === BEDROCK) return false;
  setTile(tx, ty, AIR);
  cmHatch(tx, ty, t);
  return true;
}
function cmHatch(tx, ty, t) {
  if (!COLMEIA || !(HATCH[t] > 0) || !ET.larva || Math.random() >= HATCH[t]) return null;
  const D = ET.larva, e = spawnEnemy('larva', (tx + 0.5) * T - D.w / 2, (ty + 1) * T - D.h - 0.5, CM_ZONE0 + clamp(colmeiaBand(ty), 0, 3));
  if (e && !e.dead) { e.cmHatched = true; if (inCmHall(tx, ty, 1)) e.cmMinion = true; }
  return e;
}
// o herói quebra: o bloco vai para a lista da operária, e o ovo ou o favo real pode soltar a larva
{ const _bt = breakTile; breakTile = function (tx, ty) {
  const t = tileAt(tx, ty);
  _bt(tx, ty);
  if (!COLMEIA || !inColmeia(ty) || SOLID[tileAt(tx, ty)]) return;
  cmHatch(tx, ty, t);
  if (SOLID[t] && CM_SOILS[t] && !inCmHall(wrapX(tx), ty, 1)) cmBroken.set(wrapX(tx) + ',' + ty, { tx: wrapX(tx), ty, t: gameTime });
}; }
// nenhum bicho fora do mundo de agora: a lista some com o mundo
{ const _nw = newWorld; newWorld = function (...a) { cmBroken.clear(); return _nw(...a); }; }

/* ---------- os contadores ---------- */
let cmLastAD = 0, cmHeart = 0;
HOOK.update.push(dt => {
  if (!pl || state !== 'play') return;
  for (const [k, b] of cmBroken) if (gameTime - b.t > CM_SEAL_SEC || SOLID[tileAt(b.tx, b.ty)]) cmBroken.delete(k);
  if (pl.dead) { pl.cmCasuloT = 0; pl.cmOvoT = 0; pl.cmOvoSrc = null; return; }
  // encasulado: preso; A e D alternados quebram a resina mais cedo
  if ((pl.cmCasuloT || 0) > 0) {
    const a = pressed.KeyA || pressed.ArrowLeft, d = pressed.KeyD || pressed.ArrowRight;
    const k = a && !d ? -1 : d && !a ? 1 : 0;
    if (k && k !== cmLastAD) { cmLastAD = k; pl.cmCasuloT -= 0.18; pl.cmCasuloK = (pl.cmCasuloK || 0) + 1; if (typeof sfx !== 'undefined' && sfx.cmRacha) sfx.cmRacha(); }
    pl.cmCasuloT -= dt;
    pl.vx = 0; pl.atkBuf = 0; pl.stunT = Math.max(pl.stunT, 0.05);
    if (pl.cmCasuloT <= 0) { pl.cmCasuloT = 0; cmLastAD = 0; burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 12, '#b05a1e', 70, -60, 0.6, 1); }
  }
  // o ovo: a vespa que pôs morreu, some; senão, eclode em 5 s
  if ((pl.cmOvoT || 0) > 0) {
    if (pl.cmOvoSrc && pl.cmOvoSrc.dead) { pl.cmOvoT = 0; pl.cmOvoSrc = null; }
    else {
      pl.cmOvoT -= dt;
      cmHeart += dt * (1.2 + (5 - pl.cmOvoT) * 0.35);
      if (cmHeart >= 1) { cmHeart = 0; if (typeof sfx !== 'undefined' && sfx.cmCoracao) sfx.cmCoracao(); }
      if (pl.cmOvoT <= 0) {
        pl.cmOvoT = 0; const src = pl.cmOvoSrc; pl.cmOvoSrc = null;
        hurtPlayer(Math.round((pl.cmOvoDmg || 20) * 2), pl.x + pl.w / 2, src, false);
        burst(pl.x + pl.w / 2, pl.y + 8, 16, '#e4ccb0', 80, -80, 0.6, 1);
        if (ET.larva) { const e = spawnEnemy('larva', pl.x + pl.w / 2 - ET.larva.w / 2, pl.y + pl.h - ET.larva.h - 1, CM_ZONE0 + 3); if (e && !e.dead) e.cmHatched = true; }
      }
    }
  }
  // o mel no pé
  if (COLMEIA && typeof fungLentidao === 'function' && cmNoMel()) fungLentidao(0.4, 0.15);
});
// a poção limpa os dois
{ const _dp = drinkPotion; drinkPotion = function () { const r = _dp(); if (r) { pl.cmCasuloT = 0; pl.cmOvoT = 0; pl.cmOvoSrc = null; } return r; }; }
// sons: a resina rachando, o coração do ovo
if (typeof sfx !== 'undefined' && typeof tone === 'function') {
  if (!sfx.cmRacha) sfx.cmRacha = () => { try { tone(900 + Math.random() * 300, 0.04, 'square', 0.03); } catch (e) { } };
  if (!sfx.cmCoracao) sfx.cmCoracao = () => { try { tone(70, 0.08, 'sine', 0.06); setTimeout(() => tone(60, 0.08, 'sine', 0.045), 130); } catch (e) { } };
}

/* ---------- o desenho: o casulo de resina em volta do herói, o ovo pulsando no peito ---------- */
const CM_CASULO_CV = (() => {
  const w = 16, h = 27, c = mk(w, h), x = c.getContext('2d'), R = ['#3e160a', '#64260e', '#8a3c14', '#b05a1e', '#d07e34', '#eca060'];
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const dx = (xx + 0.5 - w / 2) / (w / 2), dy = (yy + 0.5 - h / 2) / (h / 2), d = dx * dx + dy * dy;
    if (d > 1) continue;
    const ring = d > 0.72, streak = ((xx * 3 + yy) % 7) === 0, lit = dx < -0.2 && dy < -0.3;
    if (!ring && !streak && !lit && hash2(xx, yy, 1991) < 0.55) continue;   // translúcido: o herói aparece por dentro
    const l = ring ? (dx + dy < 0 ? 4 : 1) : lit ? 5 : 2 + (hash2(xx, yy, 1992) < 0.3 ? 1 : 0);
    x.fillStyle = R[l]; x.fillRect(xx, yy, 1, 1);
  }
  return c;
})();
HOOK.drawTop.push((cx, cy) => {
  if (!pl || pl.dead) return;
  const px = Math.round(pl.x + pl.w / 2 - cx), py = Math.round(pl.y - cy);
  if ((pl.cmCasuloT || 0) > 0) {
    const sh = (pl.cmCasuloK || 0) & 1 ? 1 : 0;
    lc.globalAlpha = 0.9; lc.drawImage(CM_CASULO_CV, px - 8 + sh, py - 3); lc.globalAlpha = 1;
    // as rachaduras de cada puxão
    lc.fillStyle = '#f4c890';
    for (let k = 0; k < Math.min(5, pl.cmCasuloK || 0); k++) lc.fillRect(px - 5 + ((k * 5) % 10), py + 3 + k * 4, 2, 1);
  }
  if ((pl.cmOvoT || 0) > 0) {
    const f = 5 - pl.cmOvoT, beat = Math.max(0, Math.sin(gameTime * (6 + f * 2))), r = 1 + beat;
    lc.fillStyle = '#4a2e22'; lc.fillRect(px - 2, py + 8, 4, 4);
    lc.fillStyle = beat > 0.6 ? '#f8ead6' : '#cca88e'; lc.fillRect(px - 1, py + 9, 2, 2);
    lc.globalAlpha = 0.25 + beat * 0.3; lc.fillStyle = '#ffb0a0'; lc.fillRect(px - 1 - r, py + 9 - r, 2 + r * 2, 2 + r * 2); lc.globalAlpha = 1;
  }
});
