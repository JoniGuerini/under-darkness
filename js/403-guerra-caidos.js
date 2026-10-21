'use strict';

/* ================= O Campo da Última Guerra: os caídos =================
   Cinco dos dez bichos da camada (docs/camadas/17-campo-guerra.md, seção 6; os outros cinco no 404). Os soldados dos
   dois exércitos que caíram na última guerra e não pararam de lutar: o mesmo boneco do herói (12 x 22, os mesmos
   encaixes de ombro e de pé), pintado com o heroPaint e vestido de armadura velha, com os olhos acesos atrás da
   viseira. Os avisos são sempre visíveis e sempre antes do golpe (a marca vermelha do 15 e o que cada um faz):
   - o Cavaleiro Caído (gu_cavaleiro) bate a espada no escudo duas vezes (o estalo, a lâmina acende), dá o golpe de
     escudo e o corte; de frente, com o escudo erguido, segura os golpes (BLOCK_E);
   - o Arqueiro da Chuva (gu_arqueiro) fica longe, aponta o arco para o alto e solta a saraivada: três marcas vermelhas
     aparecem no chão em volta do herói por 0,9 s e só depois as flechas caem nelas, de cima;
   - o Porta-Estandarte (gu_portaestandarte) carrega o estandarte rasgado: quem luta perto dele (6 blocos) bate 30% mais
     forte (a aura dourada no chão mostra o alcance); ergue a haste (0,7 s) e varre na frente;
   - o Soldado Enterrado (gu_enterrado) dorme debaixo do barro (só o monte de terra e uma mão): quando o herói passa
     perto, a lama borbulha embaixo dele por 0,7 s e o soldado sobe estocando para cima; depois luta e, sozinho, se
     enterra de novo;
   - o Penitente do Mangual (gu_penitente) gira o mangual por cima da cabeça (o assobio sobe, 0,6 s), avança girando
     1,5 s e fica tonto 1,2 s (a hora de bater).
   Nenhum cava bloco. O 405 põe o nível e as tabelas de spawn. O pintor é o do 401 (GUART.kit, man, set). Brilhos pelo
   HOOK.drawGlow e EYES_E; as faíscas e as flechas são do GUE (este arquivo), que o 404 e o 406 também usam. Prefixo gu. */

/* ---------- números ---------- */
Object.assign(ET, {
  gu_cavaleiro: { name: 'Cavaleiro Caído', w: 10, h: 22, hp: 120, dmg: 24, xp: 30, kb: 0.4, fly: false, blood: '#4a3a30', climbs: true },
  gu_arqueiro: { name: 'Arqueiro da Chuva', w: 9, h: 22, hp: 60, dmg: 18, xp: 24, kb: 0.9, fly: false, blood: '#4a3a30' },
  gu_portaestandarte: { name: 'Porta-Estandarte', w: 10, h: 22, hp: 95, dmg: 20, xp: 28, kb: 0.5, fly: false, blood: '#4a3a30', climbs: true },
  gu_enterrado: { name: 'Soldado Enterrado', w: 10, h: 22, hp: 80, dmg: 22, xp: 24, kb: 0.7, fly: false, blood: '#5a4632', climbs: true },
  gu_penitente: { name: 'Penitente do Mangual', w: 10, h: 22, hp: 100, dmg: 26, xp: 28, kb: 0.5, fly: false, blood: '#6a2018', climbs: true }
});
const GU_TYPES_A = ['gu_cavaleiro', 'gu_arqueiro', 'gu_portaestandarte', 'gu_enterrado', 'gu_penitente'];
const GU_DROPS_A = {
  gu_cavaleiro: [['min_belicita', 0.08], ['trapo_estandarte', 0.12], ['medalha_guerra', 0.04], ['pocao', 0.06], ['escudo_muralha', 0.01], ['espada_anjo', 0.006]],
  gu_arqueiro: [['pena_anjo', 0.12], ['trapo_estandarte', 0.1], ['min_belicita', 0.05], ['pocao', 0.07]],
  gu_portaestandarte: [['trapo_estandarte', 0.45, 1, 2], ['medalha_guerra', 0.06], ['min_belicita', 0.06], ['pocao', 0.07]],
  gu_enterrado: [['min_belicita', 0.1], ['trapo_estandarte', 0.06], ['pocao', 0.06], ['elmo_chifres_caido', 0.006]],
  gu_penitente: [['chifre_demonio', 0.1], ['min_belicita', 0.08], ['medalha_guerra', 0.04], ['pocao', 0.07], ['elmo_chifres_caido', 0.01]]
};
function guTablesA() { for (const k of GU_TYPES_A) DROPS[k] = GU_DROPS_A[k].filter(([id]) => ITEMS[id]); }
guTablesA();
Object.assign(NAV_WALKERS, { gu_cavaleiro: 1, gu_portaestandarte: 1, gu_enterrado: 1, gu_penitente: 1, gu_arqueiro: 1 });
Object.assign(CV_STEP, { gu_cavaleiro: 1, gu_arqueiro: 1, gu_portaestandarte: 1, gu_enterrado: 1, gu_penitente: 1 });

const GU_TAP = 0.8, GU_CHUVA = 0.9, GU_HASTE = 0.7, GU_BORBULHA = 0.7, GU_GIRO = 0.6, GU_GIRA_T = 1.5, GU_TONTO = 1.2;
const GU_AURA = 6 * T;                                 // o alcance do estandarte

/* ================= GUE: o que os dez e o chefe dividem ================= */
const GUE = {};
{
const fx = [], flechas = [], ondas = [], marcas = [], lancas = [];
const GL = {};
const glw = (c, r) => GL[c + r] || (GL[c + r] = glow(r, c));
const P = o => { if (fx.length < 400) fx.push(o); };
// faíscas acesas (com o brilho da cor delas)
function sparks(x, y, n, cols, sp = 40, g = 0, life = 0.4) { for (let i = 0; i < n; i++) P({ x: x + rnd(-1, 1), y: y + rnd(-1, 1), vx: rnd(-sp, sp), vy: rnd(-sp, sp), g, life: life * rnd(0.6, 1), max: life, col: cols[Math.floor(Math.random() * cols.length)], size: 1 }); }
const near = (x, y, r = 240) => clamp(1 - Math.hypot(pl.x + pl.w / 2 - x, pl.y + pl.h / 2 - y) / r, 0, 1);
const live = e => e && !e.dead && enemies.includes(e);
const hitsHero = (x, y, m = 3) => !pl.dead && x > pl.x - m && x < pl.x + pl.w + m && y > pl.y - m && y < pl.y + pl.h + m;
// um ponto relativo ao corpo (dx para a frente, dy a partir da linha dos pés) no mundo
const R = (e, dx, dy) => [e.x + e.w / 2 + dx * e.facing, e.y + e.h + dy];
// o topo do chão debaixo de (x, y) em px (até max blocos)
function chao(x, y, max = 8) {
  const tx = Math.floor(x / T); let ty = Math.floor(y / T);
  if (solidAt(tx, ty)) { for (let k = 0; k < 3 && solidAt(tx, ty - 1); k++) ty--; return solidAt(tx, ty - 1) ? null : ty * T; }
  for (let k = 1; k <= max; k++) if (solidAt(tx, ty + k)) return (ty + k) * T;
  return null;
}
// o teto acima de (x, y), até max blocos (px da borda de baixo do bloco sólido)
function teto(x, y, max = 8) { const tx = Math.floor(x / T), ty = Math.floor(y / T); for (let k = 1; k <= max; k++) if (solidAt(tx, ty - k)) return (ty - k + 1) * T; return y - max * T; }
// uma marca de aviso no chão: kind 'flecha' (o X vermelho), 'racha' (rachaduras), 'lama' (bolhas), 'casco' (a poeira dos cascos), 'circulo', 'sombra', 'luz'
function marca(x, y, kind, dur, extra) { const m = Object.assign({ x, y, kind, t: 0, dur }, extra || {}); marcas.push(m); if (marcas.length > 80) marcas.shift(); return m; }
// a flecha que cai do alto (a chuva) ou que voa (o lacaio arqueiro do chefe)
function flecha(x, y, vx, vy, dmg, g = 0) { flechas.push({ x, y, vx, vy, dmg, g, life: 3 }); if (flechas.length > 60) flechas.shift(); }
// a onda de choque que corre pelo chão: pega quem está a até alto px do chão
function onda(x, fy, dir, dmg, len, sp = 200, alto = 2 * T, col = 'pedra') { ondas.push({ x, fy, dir, dmg, len, sp, alto, d: 0, hit: false, col }); }
// a lança de luz (o serafim, o chefe): reta e rápida
function lanca(x, y, vx, vy, dmg, kind = 'luz') { lancas.push({ x, y, vx, vy, dmg, kind, life: 2.4 }); }
const LUZ = ['#fff4c0', '#f0d070', '#ffffff'], BRAS = ['#ff9a30', '#ffd070', '#e06010'], PO = ['#6a5a48', '#8a7a66', '#4a3e30'], ACO = ['#c8d0d8', '#fff6d8', '#6c7480'], SANG = ['#7a1a10', '#a83028'];
HOOK.update.push(dt => {
  for (let i = fx.length - 1; i >= 0; i--) { const p = fx[i]; p.life -= dt; if (p.life <= 0) { fx.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  for (let i = marcas.length - 1; i >= 0; i--) { const m = marcas[i]; m.t += dt; if (m.t >= m.dur) marcas.splice(i, 1); }
  const pcx = pl.x + pl.w / 2;
  for (let i = flechas.length - 1; i >= 0; i--) {
    const A = flechas[i]; A.life -= dt; A.vy += A.g * dt;
    const nx = A.x + A.vx * dt, ny = A.y + A.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { sparks(A.x, A.y, 3, PO, 30, 200, 0.3); const v = near(A.x, A.y); if (v > 0.05) sfx.guFincada(v); flechas.splice(i, 1); continue; }
    A.x = nx; A.y = ny;
    if (hitsHero(A.x, A.y, 2)) { const r = hurtPlayer(A.dmg, pcx - Math.sign(A.vx || 0.01) * 10, null, true); if (r !== 'none' || pl.invuln > 0) { sparks(A.x, A.y, 4, SANG, 40, 200, 0.4); flechas.splice(i, 1); continue; } }
    if (A.life <= 0) flechas.splice(i, 1);
  }
  for (let i = lancas.length - 1; i >= 0; i--) {
    const L = lancas[i]; L.life -= dt;
    const nx = L.x + L.vx * dt, ny = L.y + L.vy * dt;
    if (Math.random() < dt * 40) P({ x: L.x, y: L.y, vx: rnd(-6, 6), vy: rnd(-6, 6), g: 0, life: 0.3, max: 0.3, col: L.kind === 'luz' ? LUZ[(Math.random() * 3) | 0] : BRAS[(Math.random() * 3) | 0], size: 1 });
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) { sparks(L.x, L.y, 10, L.kind === 'luz' ? LUZ : BRAS, 70, 0, 0.5); const v = near(L.x, L.y); if (v > 0.05) sfx.guLuzQuebra(v); lancas.splice(i, 1); continue; }
    L.x = nx; L.y = ny;
    if (hitsHero(L.x, L.y, 3)) { const r = hurtPlayer(L.dmg, pcx - Math.sign(L.vx || 0.01) * 10, null, true); if (r !== 'none' || pl.invuln > 0) { sparks(L.x, L.y, 8, L.kind === 'luz' ? LUZ : BRAS, 60, 0, 0.4); lancas.splice(i, 1); continue; } }
    if (L.life <= 0) lancas.splice(i, 1);
  }
  for (let i = ondas.length - 1; i >= 0; i--) {
    const O = ondas[i], step = O.sp * dt; O.d += step; O.x += O.dir * step;
    const tx = Math.floor(O.x / T), ty = Math.floor(O.fy / T);
    // a onda acaba na parede ou onde o chão some
    if (O.d > O.len || solidAt(tx, ty - 1) || !solidAt(tx, ty)) { ondas.splice(i, 1); continue; }
    if (Math.random() < dt * 30) P({ x: O.x + rnd(-3, 3), y: O.fy - 1, vx: rnd(-10, 10), vy: -rnd(30, 70), g: 260, life: 0.5, max: 0.5, col: O.col === 'fogo' ? BRAS[(Math.random() * 3) | 0] : O.col === 'luz' ? LUZ[(Math.random() * 3) | 0] : PO[(Math.random() * 3) | 0], size: Math.random() < 0.3 ? 2 : 1 });
    if (!O.hit && !pl.dead && Math.abs(O.x - pcx) < 8 && pl.y + pl.h > O.fy - O.alto && pl.y + pl.h <= O.fy + 3) { O.hit = true; hurtPlayer(O.dmg, O.x - O.dir * 10, null, true); }
  }
});
HOOK.drawWorld.push((cx, cy) => {
  // as marcas no chão (por baixo dos corpos): sempre antes do golpe
  for (const m of marcas) {
    const x = Math.round(m.x - cx), y = Math.round(m.y - cy), q = m.t / m.dur;
    if (x < -60 || x > VW + 60 || y < -60 || y > VH + 60) continue;
    if (m.kind === 'flecha') {   // o X vermelho piscando, cada vez mais rápido, e a sombra das flechas descendo
      const on = Math.sin(m.t * (10 + q * 30)) > -0.3; lc.globalAlpha = on ? 0.9 : 0.4; lc.fillStyle = GU_COL.aviso;
      for (let k = -3; k <= 3; k++) { lc.fillRect(x + k, y - 2 + k * 0.3 | 0, 1, 1); lc.fillRect(x + k, y - 2 - k * 0.3 | 0, 1, 1); }
      lc.globalAlpha = 0.25 + q * 0.4; lc.fillStyle = '#140808'; lc.fillRect(x - 4, y - 1, 9, 1);
    } else if (m.kind === 'racha') {   // as rachaduras correndo pelo chão à frente do demônio
      const n = Math.round(m.len * Math.min(1, q * 1.6)); lc.globalAlpha = 0.85; lc.fillStyle = '#ff6a3a';
      for (let k = 0; k < n; k += 2) { lc.fillRect(x + m.dir * k, y - 1 - ((k * 7) % 3 === 0 ? 1 : 0), 2, 1); }
      lc.globalAlpha = 0.5; lc.fillStyle = GU_COL.aviso; lc.fillRect(Math.min(x, x + m.dir * n), y - 1, Math.abs(n), 1);
    } else if (m.kind === 'lama') {   // a lama borbulhando debaixo do herói
      lc.globalAlpha = 0.9; lc.fillStyle = '#3c2e24'; lc.fillRect(x - 7, y - 1, 15, 1);
      for (let k = 0; k < 5; k++) { const h = hash2(k, m.x | 0, 3), t = (m.t * (2 + h * 2) + h) % 1; lc.fillStyle = t < 0.7 ? '#62503e' : '#8a7660'; lc.fillRect(x - 6 + Math.round(h * 12), y - 1 - Math.round(t * 3), t > 0.7 ? 2 : 1, 1); }
      lc.fillStyle = GU_COL.aviso; lc.globalAlpha = 0.5 + 0.4 * Math.sin(m.t * 30); lc.fillRect(x - 7, y, 15, 1);
    } else if (m.kind === 'casco') {   // a carga: a poeira e as marcas de casco correndo pelo chão
      lc.globalAlpha = 0.85; for (let k = 0; k < m.w; k += 5) { const yy = y - ((k / 5) & 1); lc.fillStyle = GU_COL.aviso; lc.fillRect(x + k, yy, 2, 1); lc.fillStyle = '#5a4a3a'; lc.fillRect(x + k + 2, yy - 1, 1, 1); }
    } else if (m.kind === 'circulo') {   // a consagração: o anel de ouro crescendo, o vermelho por dentro
      const r = m.r * Math.min(1, q * 1.25); lc.globalAlpha = 0.8;
      for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2, px = x + Math.round(Math.cos(t) * r), py = y - 1 + Math.round(Math.sin(t) * r * 0.25); lc.fillStyle = a % 2 ? GU_COL.ouro : GU_COL.aviso; lc.fillRect(px, py, 1, 1); }
    } else if (m.kind === 'sombra') {   // a sombra do salto do general: cresce até o tamanho dele
      const w = Math.round(m.w * (0.3 + 0.7 * q)); lc.globalAlpha = 0.55; lc.fillStyle = '#0a0406'; lc.fillRect(x - (w >> 1), y - 1, w, 2); lc.fillStyle = GU_COL.aviso; lc.globalAlpha = 0.6; lc.fillRect(x - (w >> 1), y, w, 1);
    } else if (m.kind === 'luz') {   // o pilar de luz onde o estandarte vai levantar um caído
      const a = Math.min(1, q * 1.4); lc.globalAlpha = 0.25 * a; lc.fillStyle = GU_COL.luz; lc.fillRect(x - 3, y - 26, 7, 26); lc.globalAlpha = 0.7 * a; lc.fillRect(x - 1, y - 26, 3, 26); lc.fillStyle = GU_COL.aviso; lc.fillRect(x - 4, y, 9, 1);
    } else if (m.kind === 'fenda') {   // a fenda do inferno que vai estourar: a linha acesa no chão, cada vez mais larga
      const w = 2 + Math.round(q * 6); lc.globalAlpha = 0.6 + 0.3 * Math.sin(m.t * 20); lc.fillStyle = '#ff6a1a'; lc.fillRect(x - w, y - 1, w * 2 + 1, 1); lc.fillStyle = GU_COL.aviso; lc.fillRect(x - 1, y - 2, 3, 1);
    } else if (m.kind === 'mira') {   // a linha de mira do serafim
      const L = m.len || 120, n = Math.ceil(L / 3); lc.globalAlpha = 0.25 + 0.5 * (m.lock ? 1 : q); lc.fillStyle = m.lock ? GU_COL.aviso : GU_COL.luz;
      for (let k = 0; k < n; k += 2) lc.fillRect(Math.round(x + m.dx * k * 3), Math.round(y + m.dy * k * 3), 1, 1);
    }
  }
  // as flechas e as ondas
  for (const A of flechas) { const x = Math.round(A.x - cx), y = Math.round(A.y - cy), sp = Math.hypot(A.vx, A.vy) || 1, ux = A.vx / sp, uy = A.vy / sp; lc.globalAlpha = 1; lc.fillStyle = '#4a341e'; for (let k = 1; k < 7; k++) lc.fillRect(Math.round(x - ux * k), Math.round(y - uy * k), 1, 1); lc.fillStyle = '#c8d0d8'; lc.fillRect(x, y, 1, 1); lc.fillStyle = '#bcb296'; lc.fillRect(Math.round(x - ux * 7), Math.round(y - uy * 7), 1, 1); }
  for (const O of ondas) { const x = Math.round(O.x - cx), y = Math.round(O.fy - cy); lc.globalAlpha = 0.9; lc.fillStyle = O.col === 'fogo' ? '#ff8a20' : O.col === 'luz' ? '#fff0b8' : '#8a7a66'; lc.fillRect(x - 3, y - 4, 6, 4); lc.fillStyle = O.col === 'fogo' ? '#ffd070' : '#bcae96'; lc.fillRect(x - 2 + O.dir, y - 6, 3, 2); }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  for (const p of fx) { lc.globalAlpha = Math.min(1, p.life / p.max * 1.5) * 0.45; lc.drawImage(glw(p.col, 4), Math.round(p.x) - cx - 4, Math.round(p.y) - cy - 4); }
  for (const L of lancas) { lc.globalAlpha = 0.7; lc.drawImage(glw(L.kind === 'luz' ? GU_COL.luz : GU_COL.brasa, 12), Math.round(L.x) - cx - 12, Math.round(L.y) - cy - 12); }
  for (const O of ondas) if (O.col !== 'pedra') { lc.globalAlpha = 0.5; lc.drawImage(glw(O.col === 'fogo' ? GU_COL.brasa : GU_COL.luz, 10), Math.round(O.x) - cx - 10, Math.round(O.fy) - cy - 14); }
  for (const m of marcas) if (m.kind === 'luz' || m.kind === 'fenda') { lc.globalAlpha = 0.35 * Math.min(1, m.t / m.dur * 1.4); lc.drawImage(glw(m.kind === 'luz' ? GU_COL.luz : GU_COL.brasa, 14), Math.round(m.x) - cx - 14, Math.round(m.y) - cy - (m.kind === 'luz' ? 20 : 8)); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const p of fx) { lc.globalAlpha = Math.min(1, p.life / p.max * 2); lc.fillStyle = p.col; lc.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.size || 1, p.size || 1); }
  // a lança de luz: o risco claro com a ponta
  for (const L of lancas) { const x = Math.round(L.x - cx), y = Math.round(L.y - cy), sp = Math.hypot(L.vx, L.vy) || 1, ux = L.vx / sp, uy = L.vy / sp; for (let k = 0; k < 9; k++) { lc.globalAlpha = 1 - k / 10; lc.fillStyle = k < 2 ? '#ffffff' : L.kind === 'luz' ? '#f0d070' : '#ff8a20'; lc.fillRect(Math.round(x - ux * k), Math.round(y - uy * k), 1, 1); } }
  lc.globalAlpha = 1;
});
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const L of lancas) addL(L.x, L.y, 0.5);
  for (const m of marcas) if (m.kind === 'luz') addL(m.x, m.y - 12, 0.5 * Math.min(1, m.t / m.dur * 1.4)); else if (m.kind === 'fenda') addL(m.x, m.y - 4, 0.4);
  for (const O of ondas) if (O.col !== 'pedra') addL(O.x, O.fy - 6, 0.4);
}; }
const clear = () => { fx.length = 0; flechas.length = 0; ondas.length = 0; marcas.length = 0; lancas.length = 0; };
Object.assign(GUE, { fx, flechas, ondas, marcas, lancas, sparks, near, live, hitsHero, R, chao, teto, marca, flecha, onda, lanca, glw, clear, LUZ, BRAS, PO, ACO, SANG,
  // anda devagar sem o herói, persegue com ele
  passo(e, dt, aggro, dx, dy, sp, stop = 18) { let mv = 0; if (aggro) mv = Math.abs(dx) > stop ? Math.sign(dx) : 0; else { cvWander(e, dt); mv = e.wander; } walk(e, dt, mv, aggro ? sp : sp * 0.4, 600, 280, dy, aggro); if (!e.cdClimb) e.facing = aggro ? (Math.sign(dx) || e.facing) : (mv || e.facing); return mv; },
  // o golpe corpo a corpo: a caixa na frente do corpo (w x h a partir de oy acima dos pés)
  golpe(e, w, h, oy, mult = 1) { const ecx = e.x + e.w / 2, hb = { x: e.facing > 0 ? ecx : ecx - w, y: e.y + e.h - oy - h, w, h }; if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; return hurtPlayer(Math.round(e.dmg * mult), ecx, e, false); } return null; },
  // pode atacar daqui: no chão, perto, sem bloco no meio
  pode(e, dx, dy, rx, ry = 18) { return e.atkCD <= 0 && e.onGround && !pl.dead && Math.abs(dx) < rx && Math.abs(dy) < ry && clearPath(e, pl); }
});
{ const _nw = newWorld; newWorld = function (sd, sv) { clear(); guTablesA(); return _nw(sd, sv); }; }
}

/* ================= a arte ================= */
const GUW = {};
{
const { kit, man, set, espada, lanca, escudo, arco, guBlit, RP, limb } = GUART;
// os corpos (12 x 18): h elmo ou capuz, v a fenda da viseira (os olhos acendem por cima), g gorjal, r armadura, t
// tabardo, c capa, b cinto, k fivela, s pele, o osso, m barro
const BODIES = {
  cavaleiro: [
    "....hhhh....", "...hhhhhh...", "..hhhhhhhh..", "..hhhhhvvh..", "..hhhhhhhh..", "..hhhhhhhh..", "...hhhhhh...", "....gggg....",
    "..rrrrrrrr..", ".crrrtttrr..", ".crrrtttrrr.", ".crrrtttrrr.", ".crrrtttrr..", ".cbbbbbbkb..", ".crrrtttrr..", ".ccrrtttrr..",
    ".ccrrrrrrr..", ".ccrRrrrrr.."],
  arqueiro: [
    "...cccc.....", "..cccccc....", ".cccccccc...", ".cccchhvvh..", ".ccchhhhhh..", ".ccchhhhhh..", "..cchhhhh...", "...ccgggg...",
    "..cccrrrrr..", "..ccrrrrrr..", "..crrrrrrr..", "..crrbrrrr..", "..crrrbrrr..", "..cbbbbbkb..", "..crrrrrrr..", "..crrrrrrr..",
    ".ccrrrrrrr..", ".ccrRrrrrr.."],
  porta: [
    "....oo......", "...hhhh.....", "..hhhhhh....", "..hhhhvvh...", "..hhhhhhh...", "..hhhhhhh...", "...hhhhh....", "....ggg.....",
    "..rrttttrr..", "..rrttttrr..", ".rrrttttrrr.", ".rrrttttrrr.", "..rrttttrr..", "..bbbbbbkb..", "..rrttttrr..", "..rrttttrr..",
    ".rrrttttrrr.", ".rRrttttrrr."],
  enterrado: [
    "...hhhh.....", "..hhhhhh....", "..hmhhhhh...", "..hhhhhvv...", "..ommoooo...", "..ooomooo...", "...oooo.....", "....ggg.....",
    "..rrrmrrrr..", "..rmrrrrmr..", ".rrrmrrrrr..", ".rrrrrmrrr..", "..rmrrrrr...", "..bbbbbbkb..", "..rrrmrrrr..", "..rmrrrrrr..",
    ".rrrrmrrrr..", ".rRrrrrrmr.."],
  penitente: [
    "...cccc.....", "..cccccc....", ".cccccccc...", ".ccccccvvc..", ".cccccccc...", ".ccccccss...", "..ccccsss...", "...csssss...",
    "..sssssss...", "..ssbsssss..", ".sssbssssss.", ".ssssbsssss.", "..sssssbss..", "..bbbbbbkb..", "..tttttttt..", "..tttttttt..",
    ".tttttttttt.", ".tTtttttttt."]
};
const MATS = {
  cavaleiro: { h: '#3c3c44', v: '#0a0608', g: '#4a4a52', r: '#45454e', t: '#5a1a18', c: '#3e1416', b: '#2a1e14', k: '#a07820', p: '#34343a', f: '#26262c', a: '#45454e', hd: '#3c3c44' },
  arqueiro: { c: '#3a3a2e', h: '#4a4234', v: '#0a0608', g: '#5a4a36', r: '#5a4632', b: '#2a1e14', k: '#7a6040', p: '#3a342a', f: '#2a221a', a: '#3a3a2e' },
  porta: { o: '#d8c8a0', h: '#6a6050', v: '#0a0608', g: '#5a5040', r: '#5a5662', t: '#a07820', b: '#2a1e14', k: '#d0a838', p: '#3a3640', f: '#2a2830', a: '#5a5662' },
  enterrado: { h: '#4a4438', m: '#3c2e24', v: '#0a0608', o: '#8a7a5e', g: '#4a4438', r: '#4e4636', b: '#2a1e14', k: '#5a4a30', p: '#3c3428', f: '#2a2018', a: '#4e4636' },
  penitente: { c: '#2a2224', v: '#0a0608', s: '#8a6a58', b: '#4a4a52', k: '#6a6a72', t: '#3a2a22', p: '#2a2220', f: '#1e1814', a: '#8a6a58' }
};
const TEX = { cavaleiro: { r: 'plate', h: 'plate' }, porta: { r: 'mail' }, enterrado: { r: 'mail' }, arqueiro: {}, penitente: {} };
const KITS = {};
const K = name => KITS[name] || (KITS[name] = kit(BODIES[name], MATS[name], 40900 + Object.keys(BODIES).indexOf(name) * 37, TEX[name]));
const cache = {};
const lazy = (name, fn) => () => cache[name] || (cache[name] = fn());
// as pernas pela pose: andando (4 passos), no ar, subindo
const legsOf = (e, k = 7) => e.cdClimb ? (Math.floor((e.climbD || 0) / 6) % 2 ? 'clA' : 'clB') : !e.onGround ? 'jump' : Math.abs(e.vx) > 6 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(e.t * k) % 4] : 'idle';
const LEGK = ['idle', 'w0', 'w1', 'w2', 'w3', 'jump', 'clA', 'clB'];

/* ---------- o Cavaleiro Caído: o escudo de ferro na frente, a espada na mão de trás ---------- */
const CAV = lazy('cav', () => {
  const k = K('cavaleiro'), S = {};
  const shield = (P, bx, by, up) => escudo(P, bx + 10.5, by + 12.5 + (up ? -1 : 0), RP.ferro, RP.vinho, true);
  const base = (legs, o = {}) => set(man(k, Object.assign({ legs, far: [[1.6, 3.2], [3.2, 5.6]], farItem: (P, h) => espada(P, h, -1.2, 10), near: [[2, 2], [3.4, 3.2]], front: (P, bx, by) => shield(P, bx, by) }, o)));
  for (const L of LEGK) S[L] = base(L);
  // a batida: a espada sobe e desce contra o escudo (0 erguida, 1 batendo)
  S.tap0 = set(man(k, { legs: 'idle', far: [[2, -2], [4.4, -4.6]], farItem: (P, h) => espada(P, h, -1.9, 10), near: [[2, 2], [3.4, 3.2]], front: (P, bx, by) => shield(P, bx, by, true) }));
  S.tap1 = set(man(k, { legs: 'idle', far: [[3, 0], [6, 0.4]], farItem: (P, h) => espada(P, h, -0.3, 10), near: [[2, 2], [3.4, 3.2]], front: (P, bx, by) => shield(P, bx, by, true) }));
  // o golpe de escudo (o escudo empurrado para a frente) e o corte (a espada varrendo baixo)
  S.bash = set(man(k, { legs: 'w0', lean: 2, far: [[1.6, 3.2], [3.2, 5.6]], farItem: (P, h) => espada(P, h, -1.2, 10), near: [[3.6, 1], [6, 1]], front: (P, bx, by) => escudo(P, bx + 15, by + 12, RP.ferro, RP.vinho, true) }));
  S.slash = set(man(k, { legs: 'w2', lean: 1, far: [[3.4, 1.6], [7, 2.4]], farItem: (P, h) => espada(P, h, 0.35, 11), near: [[0.4, 2.6], [-0.8, 4.4]], front: (P, bx, by) => escudo(P, bx + 4.5, by + 13.5, RP.ferro, RP.vinho, false) }));
  return S;
});
/* ---------- o Arqueiro da Chuva: o arco longo ---------- */
const ARQ = lazy('arq', () => {
  const k = K('arqueiro'), S = {};
  const quiver = (P, bx, by) => { for (let y = 9; y < 17; y++) { P.put(bx + 2, by + y, RP.couro, 3); P.put(bx + 3, by + y, RP.couro, 2); } for (const dx of [1.5, 2.5, 3.5]) P.put(bx + dx, by + 8, RP.pena, 4.6); };
  for (const L of LEGK) S[L] = set(man(k, { legs: L, behind: quiver, far: [[1.2, 3.4], [2, 6]], near: [[2.2, 2.4], [4, 3.6]], nearItem: (P, h) => arco(P, h, 0.3, false) }));
  // mirando para o alto (a corda puxada) e a soltura
  S.aim = set(man(k, { legs: 'wide', behind: quiver, far: [[1.2, -2.2], [1.6, -5]], near: [[2.6, -2], [4.8, -4.6]], nearItem: (P, h) => arco(P, h, -1.1, true) }));
  S.shoot = set(man(k, { legs: 'wide', behind: quiver, far: [[-0.6, -1], [-2, -2.4]], near: [[2.6, -2], [4.8, -4.6]], nearItem: (P, h) => arco(P, h, -1.1, false) }));
  S.aimF = set(man(k, { legs: 'wide', behind: quiver, far: [[1.2, 0.6], [1.6, 0.6]], near: [[3, 0.2], [6, -0.2]], nearItem: (P, h) => arco(P, h, -0.05, true) }));
  return S;
});
/* ---------- o Porta-Estandarte: a haste com o estandarte rasgado ---------- */
function bandeira(P, h, a, s) {   // a haste segura em h apontando a; o pano pendurado do alto
  const [c, sn] = [Math.cos(a), Math.sin(a)], top = [h[0] + c * 14, h[1] + sn * 14];
  P.line(h[0] - c * 6, h[1] - sn * 6, top[0], top[1], RP.madeira, 3.8, 1);
  P.put(top[0], top[1], RP.ouro, 5.4); P.put(top[0] + c, top[1] + sn, RP.ouro, 4.4);
  // o pano: preso no alto da haste, caindo para trás
  for (let j = 0; j < 8; j++) for (let i = 0; i < 9 - (j > 5 ? (j - 5) * 2 : 0); i++) { const x = top[0] - 1 - i - c * j * 0.3, y = top[1] + 1 + j + i * 0.15; P.put(x, y, (j === 0 || i === 0) ? RP.ouro : RP.vinho, (j === 0 || i === 0) ? 4.2 : 3.2 - i * 0.12 + Math.sin(i * 1.2 + j) * 0.4); }
}
const POR = lazy('por', () => {
  const k = K('porta'), S = {};
  for (const L of LEGK) S[L] = set(man(k, { legs: L, far: [[1.6, 2.4], [3, 4.4]], near: [[2, 2], [3.6, 2.8]], nearItem: (P, h) => bandeira(P, h, -1.45, 1) }));
  S.wind = set(man(k, { legs: 'wide', far: [[0.6, -2], [0, -4.6]], near: [[1.4, -2.4], [0.6, -5.6]], nearItem: (P, h) => bandeira(P, h, -2.3, 2) }));
  S.sweep = set(man(k, { legs: 'w0', lean: 2, far: [[3, 1.4], [6, 1.6]], near: [[3.4, 1.2], [7, 1]], nearItem: (P, h) => bandeira(P, h, 0.15, 3) }));
  return S;
});
/* ---------- o Soldado Enterrado: a espada curta enferrujada ---------- */
const ENT = lazy('ent', () => {
  const k = K('enterrado'), S = {};
  for (const L of LEGK) S[L] = set(man(k, { legs: L, far: [[1.6, 3], [2.6, 5.6]], near: [[2.4, 2.2], [4.4, 3.4]], nearItem: (P, h) => espada(P, h, 0.4, 8, RP.ferrugem, RP.ferro) }));
  S.wind = set(man(k, { legs: 'wide', far: [[1.6, 3], [2.6, 5.6]], near: [[-1, -1.6], [-2.4, -3.6]], nearItem: (P, h) => espada(P, h, -2.4, 8, RP.ferrugem, RP.ferro) }));
  S.stab = set(man(k, { legs: 'w0', lean: 2, far: [[1.6, 3], [2.6, 5.6]], near: [[3.6, 0.6], [7, 0.4]], nearItem: (P, h) => espada(P, h, 0, 8, RP.ferrugem, RP.ferro) }));
  // subindo do barro: os braços para cima, a espada estocando para o alto (o corpo meio enterrado é cortado no desenho)
  S.rise = set(man(k, { legs: 'idle', far: [[0.6, -3], [1, -6]], near: [[1.4, -3.4], [2.2, -7]], nearItem: (P, h) => espada(P, h, -1.5, 9, RP.ferrugem, RP.ferro) }));
  return S;
});
/* ---------- o Penitente do Mangual: o mangual de três correntes (a bola é ao vivo) ---------- */
const PEN = lazy('pen', () => {
  const k = K('penitente'), S = {};
  const cabo = (P, h, a) => { const [c, sn] = [Math.cos(a), Math.sin(a)]; P.line(h[0] - c * 2, h[1] - sn * 2, h[0] + c * 4, h[1] + sn * 4, RP.madeira, 3.8); P.put(h[0] + c * 4.6, h[1] + sn * 4.6, RP.ferro, 4.6); };
  const chains = (P, bx, by) => { for (let y = 9; y < 16; y++) P.put(bx + 4 + (y % 2), by + y, RP.ferro, y % 2 ? 4.4 : 2.4); };
  for (const L of LEGK) S[L] = set(man(k, { legs: L, mid: chains, far: [[1.6, 3], [2.6, 5.6]], near: [[2.4, 2.4], [4, 4]], nearItem: (P, h) => cabo(P, h, 1.2) }));
  S.up = set(man(k, { legs: 'wide', mid: chains, far: [[1.6, 3], [2.6, 5.6]], near: [[1.4, -3], [1.6, -6.4]], nearItem: (P, h) => cabo(P, h, -1.6) }));
  S.dizzy = set(man(k, { legs: 'wide', lean: -1, bob: 1, mid: chains, far: [[0.6, 3.6], [0.4, 6.6]], near: [[1, 3.6], [1.4, 6.8]], nearItem: (P, h) => cabo(P, h, 1.5) }));
  return S;
});
Object.assign(GUW, { K, legsOf, LEGK, CAV, ARQ, POR, ENT, PEN, bandeira, lazy, kitOf: K });
}
// os olhos atrás da viseira: dois pontinhos acesos (fx, fy é o pé)
const GU_EYE = { brasa: null, luz: null };
function guOlhos(e, fx, fy, col, a = 0.5, ox = 3, oy = -18) {
  const g = GUE.glw(col, 3); lc.globalAlpha = a; lc.drawImage(g, Math.round(fx + ox * e.facing) - 3, Math.round(fy + oy) - 3);
}

/* ================= desenho ================= */
const { guBlit } = GUART;
const guJit = (e, on, k = 50) => on ? Math.round(Math.sin(e.t * k) * 0.7) : 0;
DRAW_E.gu_cavaleiro = (e, fx, fy, fl) => {
  const S = GUW.CAV(), st = e.state;
  const img = st === 'tap' ? (e.tapFx > 0 ? S.tap1 : S.tap0) : st === 'bash' ? S.bash : st === 'slash' || (st === 'recover' && e.stateT > 0.25) ? S.slash : S[GUW.legsOf(e)];
  guBlit(img, e, fx, fy, fl, guJit(e, st === 'tap' && e.tapFx > 0));
};
EYES_E.gu_cavaleiro = (e, fx, fy) => guOlhos(e, fx, fy, '#ff5a2a', e.state === 'tap' ? 0.8 : 0.45, 3, -18);
WARN_E.gu_cavaleiro = e => e.state === 'tap';
BLOCK_E.gu_cavaleiro = (e, dir) => (e.state === 'walk' || e.state === 'tap') && e.stun <= 0 && dir === -e.facing && !(pl.y + pl.h <= e.y + 4);
DRAW_E.gu_arqueiro = (e, fx, fy, fl) => { const S = GUW.ARQ(), st = e.state; guBlit(st === 'aim' ? S.aim : st === 'shoot' ? S.shoot : S[GUW.legsOf(e)], e, fx, fy, fl); };
EYES_E.gu_arqueiro = (e, fx, fy) => guOlhos(e, fx, fy, '#ff5a2a', e.state === 'aim' ? 0.8 : 0.4, 3, -18);
WARN_E.gu_arqueiro = e => e.state === 'aim';
DRAW_E.gu_portaestandarte = (e, fx, fy, fl) => { const S = GUW.POR(), st = e.state; guBlit(st === 'wind' ? S.wind : st === 'sweep' || (st === 'recover' && e.stateT > 0.25) ? S.sweep : S[GUW.legsOf(e)], e, fx, fy, fl, guJit(e, st === 'wind' && e.stateT < 0.25)); };
EYES_E.gu_portaestandarte = (e, fx, fy) => guOlhos(e, fx, fy, '#ffd070', e.state === 'wind' ? 0.8 : 0.45, 3, -18);
WARN_E.gu_portaestandarte = e => e.state === 'wind';
DRAW_E.gu_enterrado = (e, fx, fy, fl) => {
  const S = GUW.ENT(), st = e.state;
  if (st === 'buried' || st === 'bubble' || st === 'dig') {   // o monte de barro e uma mão que sai; cavando, o corpo afunda
    if (st === 'dig') { const q = clamp(1 - e.stateT / 1, 0, 1), cut = Math.round(q * 22); lc.save(); lc.beginPath(); lc.rect(fx - 30, fy - 40, 60, 40 - cut); lc.clip(); guBlit(S.idle, e, fx, fy + cut, fl); lc.restore(); }
    lc.fillStyle = '#2a201a'; lc.fillRect(fx - 6, fy - 2, 13, 2); lc.fillStyle = '#4e3e30'; lc.fillRect(fx - 5, fy - 3, 11, 1); lc.fillStyle = '#62503e'; lc.fillRect(fx - 3, fy - 4, 6, 1);
    if (st === 'buried' && Math.sin(e.t * 0.7 + e.seed) > 0.4) { lc.fillStyle = '#8a7a5e'; lc.fillRect(fx + 2 * e.facing, fy - 6, 1, 2); lc.fillRect(fx + 1 * e.facing, fy - 7, 1, 1); lc.fillRect(fx + 3 * e.facing, fy - 7, 1, 1); }
    return;
  }
  if (st === 'rise') { const q = clamp(1 - e.stateT / 0.3, 0, 1), cut = Math.round((1 - q) * 18); lc.save(); lc.beginPath(); lc.rect(fx - 30, fy - 40, 60, 40); lc.clip(); guBlit(S.rise, e, fx, fy + cut, fl); lc.restore(); lc.fillStyle = '#4e3e30'; lc.fillRect(fx - 7, fy - 2, 15, 2); return; }
  guBlit(st === 'wind' ? S.wind : st === 'stab' || (st === 'recover' && e.stateT > 0.25) ? S.stab : S[GUW.legsOf(e)], e, fx, fy, fl, guJit(e, st === 'wind' && e.stateT < 0.2));
};
EYES_E.gu_enterrado = (e, fx, fy) => { if (e.state === 'buried' || e.state === 'bubble') return; guOlhos(e, fx, fy, '#c8d070', e.state === 'wind' ? 0.75 : 0.35, 3, -18); };
WARN_E.gu_enterrado = e => e.state === 'bubble' || e.state === 'wind';
DRAW_E.gu_penitente = (e, fx, fy, fl) => {
  const S = GUW.PEN(), st = e.state, up = st === 'wind' || st === 'spin';
  guBlit(st === 'dizzy' ? S.dizzy : up ? S.up : S[GUW.legsOf(e)], e, fx, fy, fl, guJit(e, st === 'spin', 30));
  // a bola de ferro com espinhos girando na corrente (ao vivo)
  const hx = fx + 3 * e.facing, hy = fy - (up ? 30 : 9);
  const a = up ? e.giro || 0 : Math.sin(e.t * 2) * 0.4 + 1.4, r = up ? 9 : 6, bx = Math.round(hx + Math.cos(a) * r * (up ? 1 : e.facing)), by = Math.round(hy + Math.sin(a) * r * (up ? 0.45 : 1));
  lc.fillStyle = '#62626a'; const n = 5; for (let k = 1; k < n; k++) lc.fillRect(Math.round(hx + (bx - hx) * k / n), Math.round(hy + (by - hy) * k / n), 1, 1);
  lc.fillStyle = fl ? '#ffffff' : '#2e2e34'; lc.fillRect(bx - 2, by - 2, 5, 5); lc.fillStyle = fl ? '#ffffff' : '#62626a'; lc.fillRect(bx - 1, by - 2, 2, 1); lc.fillRect(bx - 2, by - 1, 1, 2);
  lc.fillStyle = fl ? '#ffffff' : '#86868e'; lc.fillRect(bx, by - 3, 1, 1); lc.fillRect(bx, by + 3, 1, 1); lc.fillRect(bx - 3, by, 1, 1); lc.fillRect(bx + 3, by, 1, 1);
};
EYES_E.gu_penitente = (e, fx, fy) => guOlhos(e, fx, fy, '#ff5a2a', e.state === 'wind' || e.state === 'spin' ? 0.8 : 0.4, 3, -18);
WARN_E.gu_penitente = e => e.state === 'wind';

/* ================= comportamento ================= */
const guVol = (e, r = 240) => Math.max(0.25, GUE.near(e.x + e.w / 2, e.y + e.h / 2, r));

/* ---------- o Cavaleiro Caído ---------- */
AI.gu_cavaleiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.tapFx = (e.tapFx || 0) - dt;
  if (e.state === 'tap') {   // duas batidas da espada no escudo, a lâmina acende
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    const el = GU_TAP - e.stateT, n = el >= GU_TAP * 0.6 ? 2 : el >= GU_TAP * 0.2 ? 1 : 0;
    if (n > e.tapN) { e.tapN = n; e.tapFx = 0.11; const [x, y] = GUE.R(e, 7, -12); GUE.sparks(x, y, 4, GUE.ACO, 40, 0, 0.3); sfx.guEscudo(guVol(e), n); }
    if (e.stateT <= 0) { e.state = 'bash'; e.stateT = 0.18; e.swingHit = false; e.vx = e.facing * 110; sfx.guEmpurra(guVol(e)); }
    return;
  }
  if (e.state === 'bash') {   // o golpe de escudo: empurra e atordoa pouco
    const r = GUE.golpe(e, 16, 16, 3, 0.6); if (r === 'hit') { pl.vx += e.facing * 160; }
    e.vx = approach(e.vx, 0, 500 * dt);
    if (e.stateT <= 0) { e.state = 'slash'; e.stateT = 0.22; e.swingHit = false; sfx.guCorte(guVol(e)); }
    return;
  }
  if (e.state === 'slash') { GUE.golpe(e, 22, 14, 2, 1); e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; } return; }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.6; } return; }
  e.state = 'walk';
  GUE.passo(e, dt, aggro, dx, dy, 36 + e.lvl * 0.3, 20);
  e.stepT = (e.stepT || 0) - dt;
  if (e.onGround && Math.abs(e.vx) > 6 && e.stepT <= 0) { e.stepT = 0.45; const v = GUE.near(e.x, e.y, 200); if (v > 0.05) sfx.guArmadura(v); }
  if (aggro && GUE.pode(e, dx, dy, 30)) { e.state = 'tap'; e.stateT = GU_TAP; e.tapN = 0; e.tapFx = 0; e.vx = 0; }
};

/* ---------- o Arqueiro da Chuva ---------- */
AI.gu_arqueiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'aim') {   // o arco para o alto; as marcas no chão já estão lá
    e.vx = approach(e.vx, 0, 700 * dt);
    if (e.stateT <= 0) {
      for (const m of e.guAlvos) { const top = GUE.teto(m.x, m.y - 2, 9); GUE.flecha(m.x + rnd(-1, 1), top + 2, rnd(-8, 8), 330, e.dmg, 200); }
      e.state = 'shoot'; e.stateT = 0.35; e.atkCD = 2.4 + Math.random(); sfx.guSoltura(guVol(e, 300));
    }
    return;
  }
  if (e.state === 'shoot') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  // longe: 6 a 11 blocos
  let mv = 0;
  if (aggro) { const a = Math.abs(dx); mv = a < 5 * T ? -Math.sign(dx) : a > 11 * T || !e.sees ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); mv = e.wander; }
  walk(e, dt, mv, aggro ? 42 : 18, 600, 280, dy, aggro && mv === Math.sign(dx));
  if (!e.cdClimb) e.facing = aggro ? (Math.sign(dx) || e.facing) : (mv || e.facing);
  if (aggro && e.atkCD <= 0 && e.onGround && e.sees && !pl.dead && dist > 3 * T && dist < 15 * T) {
    // três marcas no chão: debaixo do herói e uma de cada lado (só onde há chão)
    const pcx = pl.x + pl.w / 2, base = GUE.chao(pcx, pl.y + pl.h - 2, 4);
    if (base === null) { e.atkCD = 0.5; return; }
    e.guAlvos = [];
    for (const o of [0, -1.6 * T, 1.6 * T]) { const x = pcx + o + rnd(-3, 3), y = GUE.chao(x, base - 4, 3); if (y !== null && Math.abs(y - base) < 2 * T) e.guAlvos.push(GUE.marca(x, y, 'flecha', GU_CHUVA + 0.25)); }
    e.state = 'aim'; e.stateT = GU_CHUVA; e.vx = 0; sfx.guPuxa(guVol(e, 300));
  }
};

/* ---------- o Porta-Estandarte ---------- */
AI.gu_portaestandarte = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'sweep'; e.stateT = 0.25; e.swingHit = false; e.vx = e.facing * 60; sfx.guVarre(guVol(e)); } return; }
  if (e.state === 'sweep') { GUE.golpe(e, 26, 18, 2, 1); e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.55; } return; }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.6 + Math.random() * 0.6; } return; }
  e.state = 'walk';
  // com aliados perto fica um pouco atrás deles (a aura cobre todos); sozinho, luta
  const allies = enemies.some(o => o !== e && !o.dead && o.type.startsWith('gu_') && Math.abs(o.x - e.x) < GU_AURA && Math.abs(o.y - e.y) < 3 * T);
  GUE.passo(e, dt, aggro, dx, dy, 34 + e.lvl * 0.3, allies ? 4 * T : 22);
  if (aggro && GUE.pode(e, dx, dy, 30)) { e.state = 'wind'; e.stateT = GU_HASTE; e.vx = 0; sfx.guErgue(guVol(e)); }
};
// a aura: quem luta perto do estandarte bate 30% mais forte
const guAura = src => src && src.type && src.type !== 'gu_portaestandarte' && src.type.startsWith('gu_') && enemies.some(o => o.type === 'gu_portaestandarte' && !o.dead && o.state !== 'buried' && Math.abs(o.x - src.x) < GU_AURA && Math.abs(o.y - src.y) < GU_AURA);
{ const _hp = hurtPlayer; hurtPlayer = function (dmg, srcX, src, isProj) { if (dmg > 0 && src && src.type && guAura(src)) dmg = Math.round(dmg * 1.3); return _hp(dmg, srcX, src, isProj); }; }
HOOK.drawWorld.push((cx, cy) => {   // a aura dourada no chão em volta de cada estandarte
  for (const e of enemies) {
    if (e.dead || e.type !== 'gu_portaestandarte') continue;
    const x = Math.round(e.x + e.w / 2 - cx), y = Math.round(e.y + e.h - cy); if (x < -90 || x > VW + 90) continue;
    lc.globalAlpha = 0.3 + 0.12 * Math.sin(gameTime * 2 + e.seed); lc.fillStyle = GU_COL.ouro;
    for (let k = -GU_AURA; k <= GU_AURA; k += 4) if (((k / 4 + Math.floor(gameTime * 4)) & 3) === 0) lc.fillRect(x + k, y - 1, 2, 1);
  }
  lc.globalAlpha = 1;
});

/* ---------- o Soldado Enterrado ---------- */
AI.gu_enterrado = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'buried') {   // debaixo do barro: espera o herói passar perto, no mesmo chão
    e.vx = 0;
    if (!pl.dead && Math.abs(dx) < 5 * T && Math.abs(dy) < 2 * T && pl.onGround && e.atkCD <= 0) {
      const x = pl.x + pl.w / 2, y = GUE.chao(x, pl.y + pl.h - 2, 2);
      if (y !== null && !rectSolid(x - e.w / 2, y - e.h, e.w, e.h)) { e.state = 'bubble'; e.stateT = GU_BORBULHA; e.guAt = [x, y]; GUE.marca(x, y, 'lama', GU_BORBULHA); sfx.guLama(guVol(e)); }
    }
    return;
  }
  if (e.state === 'bubble') { e.vx = 0; if (e.stateT <= 0) { e.x = e.guAt[0] - e.w / 2; e.y = e.guAt[1] - e.h; e.state = 'rise'; e.stateT = 0.3; e.swingHit = false; e.facing = Math.sign(dx) || e.facing; GUE.sparks(e.guAt[0], e.guAt[1] - 2, 12, GUE.PO, 70, 300, 0.6); sfx.guSobe(guVol(e)); } return; }
  if (e.state === 'rise') {   // a estocada para o alto, saindo do chão
    const ecx = e.x + e.w / 2, hb = { x: ecx - 8, y: e.y - 6, w: 16, h: e.h + 6 };
    if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') pl.vy = Math.min(pl.vy, -220); }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.5; e.guAwake = 6; }
    return;
  }
  if (e.state === 'dig') { e.vx = 0; if (e.stateT <= 0) { e.state = 'buried'; e.atkCD = 1.5; } return; }
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'stab'; e.stateT = 0.2; e.swingHit = false; e.vx = e.facing * 90; sfx.guCorte(guVol(e)); } return; }
  if (e.state === 'stab') { GUE.golpe(e, 22, 10, 6, 1); e.vx = approach(e.vx, 0, 500 * dt); if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.45; } return; }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.3 + Math.random() * 0.6; } return; }
  e.state = 'walk';
  e.guAwake = (e.guAwake ?? 6) - (aggro ? 0 : dt);
  // sem o herói por um tempo, no chão firme: volta para debaixo do barro
  if (e.guAwake <= 0 && e.onGround && dist > 7 * T) { e.state = 'dig'; e.stateT = 1; sfx.guLama(guVol(e) * 0.7); return; }
  GUE.passo(e, dt, aggro, dx, dy, 30 + e.lvl * 0.3, 18);
  if (aggro && GUE.pode(e, dx, dy, 26)) { e.state = 'wind'; e.stateT = 0.55; e.vx = 0; }
};

/* ---------- o Penitente do Mangual ---------- */
AI.gu_penitente = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 700 * dt); e.giro = (e.giro || 0) + dt * (8 + (1 - e.stateT / GU_GIRO) * 10); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { e.state = 'spin'; e.stateT = GU_GIRA_T; e.guTick = 0; e.guDir = e.facing; } return; }
  if (e.state === 'spin') {   // avança girando: acerta a cada 0,35 s quem estiver no raio da bola
    e.giro = (e.giro || 0) + dt * 18; e.guTick -= dt;
    const r = walk(e, dt, e.guDir, 105, 900, 0, dy, false); if (r === 0) e.guDir = -e.guDir;
    e.facing = e.guDir;
    const ecx = e.x + e.w / 2, ecy = e.y + 4;
    if (e.guTick <= 0 && !pl.dead && Math.abs(pl.x + pl.w / 2 - ecx) < 16 && pl.y < e.y + e.h && pl.y + pl.h > e.y - 8) { e.guTick = 0.35; hurtPlayer(e.dmg, ecx, e, false); }
    if (Math.random() < dt * 6) GUE.sparks(ecx + Math.cos(e.giro) * 9, ecy + Math.sin(e.giro) * 4 - 6, 1, GUE.ACO, 20, 0, 0.25);
    if (e.stateT <= 0) { e.state = 'dizzy'; e.stateT = GU_TONTO; e.vx = 0; sfx.guTonto(guVol(e)); }
    return;
  }
  if (e.state === 'dizzy') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1 + Math.random() * 0.6; } return; }
  e.state = 'walk';
  GUE.passo(e, dt, aggro, dx, dy, 32 + e.lvl * 0.3, 3 * T);
  if (aggro && GUE.pode(e, dx, dy, 6 * T)) { e.state = 'wind'; e.stateT = GU_GIRO; e.vx = 0; e.giro = 0; sfx.guAssobio(guVol(e)); }
};

/* ---------- golpes que eles levam ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (!e || e.dead || !GU_TYPES_A.includes(e.type)) return _hit(e, dir, mult, melee);
  if (e.type === 'gu_enterrado' && (e.state === 'buried' || e.state === 'bubble')) { GUE.sparks(e.x + e.w / 2, e.y + e.h - 2, 3, GUE.PO, 30, 200, 0.3); return; }   // debaixo do barro
  if (e.type === 'gu_cavaleiro' && BLOCK_E.gu_cavaleiro(e, dir)) { const [x, y] = GUE.R(e, 6, -12); GUE.sparks(x, y, 5, GUE.ACO, 50, 200, 0.3); }
  const mt = e.type === 'gu_penitente' && e.state === 'dizzy' ? 1.4 : 1;   // tonto: a hora de bater
  const r = _hit(e, dir, mult * mt, melee);
  if (e.dead) return r;
  // levar golpe durante o aviso não cancela o golpe pesado (a não ser atordoado de verdade)
  if (e.type === 'gu_arqueiro' && e.state === 'aim' && e.stun > 0.3) { e.state = 'walk'; e.atkCD = 0.8; }
  if ((e.type === 'gu_cavaleiro' && (e.state === 'tap' || e.state === 'bash')) || (e.type === 'gu_penitente' && e.state === 'spin')) e.stun = Math.min(e.stun, 0.05);
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !GU_TYPES_A.includes(type)) return e;
  for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.state = type === 'gu_enterrado' && !e.guMinion ? 'buried' : 'walk';
  return e;
}; }

/* ---------- os sons de todos do Campo (o 404 e o 406 usam também) ---------- */
Object.assign(sfx, {
  guEscudo(v = 1, n = 1) { noise(0.06, 0.12 * v, 1400 + n * 200, 'bandpass', 0, 3); tone(260 + n * 40, 0.12, 'square', 0.02 * v, -80); tone(1800, 0.08, 'triangle', 0.008 * v, -400, 0.01); },
  guEmpurra(v = 1) { noise(0.12, 0.1 * v, 600, 'lowpass'); tone(120, 0.14, 'square', 0.03 * v, -40); },
  guCorte(v = 1) { noise(0.14, 0.08 * v, 2800, 'bandpass', 0, 1.2); tone(900, 0.1, 'sine', 0.01 * v, -500); },
  guArmadura(v = 1) { noise(0.05, 0.03 * v, 2200, 'bandpass', 0, 4); noise(0.04, 0.025 * v, 500, 'lowpass', 0.05); },
  guPuxa(v = 1) { tone(180, GU_CHUVA, 'sawtooth', 0.006 * v, 60); noise(GU_CHUVA, 0.015 * v, 900, 'bandpass', 0, 3); },
  guSoltura(v = 1) { tone(140, 0.12, 'triangle', 0.03 * v, -40); for (let k = 0; k < 3; k++) noise(0.12, 0.04 * v, 3200, 'bandpass', 0.04 + k * 0.05, 2); },
  guFincada(v = 1) { noise(0.04, 0.05 * v, 1800, 'bandpass', 0, 3); tone(500, 0.05, 'square', 0.006 * v, -200); },
  guErgue(v = 1) { noise(0.4, 0.04 * v, 700, 'bandpass', 0, 1); tone(330, 0.5, 'sine', 0.012 * v, 110); },
  guVarre(v = 1) { noise(0.22, 0.09 * v, 1100, 'bandpass', 0, 0.8); },
  guLama(v = 1) { for (let k = 0; k < 5; k++) tone(90 + Math.random() * 60, 0.09, 'sine', 0.03 * v, 40, k * 0.12); noise(0.6, 0.03 * v, 300, 'lowpass'); },
  guSobe(v = 1) { noise(0.25, 0.1 * v, 400, 'lowpass'); tone(160, 0.2, 'sawtooth', 0.02 * v, 200); },
  guAssobio(v = 1) { tone(300, GU_GIRO + 0.6, 'sine', 0.012 * v, 900); for (let k = 0; k < 8; k++) noise(0.05, 0.02 * v, 1400 + k * 200, 'bandpass', k * 0.1, 3); },
  guTonto(v = 1) { tone(400, 0.4, 'triangle', 0.012 * v, -200); },
  guLuzQuebra(v = 1) { tone(1800, 0.2, 'sine', 0.012 * v, -900); noise(0.15, 0.04 * v, 5000, 'highpass'); },
  guMorre(v = 1) { noise(0.3, 0.06 * v, 900, 'bandpass', 0, 1); tone(140, 0.4, 'sawtooth', 0.015 * v, -60); }
});
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (e.type && e.type.startsWith('gu_') && !e.boss) sfx.guMorre(guVol(e));
  return r;
}; }
// a luz que eles dão: só o aviso (a lâmina acesa, a aura)
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) { if (e.dead || !GU_TYPES_A.includes(e.type)) continue; if (WARN_E[e.type](e)) addL(e.x + e.w / 2, e.y + e.h / 2, 0.25); }
}; }
