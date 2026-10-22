'use strict';

/* ================= runas: o que os nós próprios de cada feitiço fazem em jogo =================
   Os números (saltos, alcance, largura, duração...) já mudam sozinhos no objeto do feitiço (runeApply, js/340).
   Aqui fica o comportamento novo, um bloco por feitiço, com as peças de js/423 (rnHit, rnSub, rnBlast, rnShot,
   rnField, rnLater). Para mexer nos feitiços sem tocar nos arquivos deles (64, 68, 113, 115, 116):
   - rnOnPush(lista, f): f vê cada coisa nova que o feitiço põe na lista dele (lança, bola, nuvem...).
   - rnTrack(lista, f): f roda quando uma coisa some da lista (fim da lança, da nuvem, da parede...).
   - O que precisa rodar ANTES do quadro do feitiço (rebater na parede, dar meia-volta) entra com HOOK.update.unshift.
   O Arco Voltaico é lançado por aqui (castArc trocado): bifurcação, retorno, gêmeo e o resto.
   Carrega depois de 423-runas-efeitos. */

function rnOnPush(arr, f) { const _p = arr.push; arr.push = function () { const n = _p.apply(this, arguments); for (let i = 0; i < arguments.length; i++) f(arguments[i]); return n; }; }
const rnTracks = [];
function rnTrack(arr, f, want) { const t = { arr, f, set: new Set() }; rnTracks.push(t); rnOnPush(arr, o => { if (!want || want(o)) t.set.add(o); }); }
// o inimigo mais perto da mira, dentro do alcance do herói
function rnNearAim(reach, rad, los) {
  const [mx, my] = mouseWorld(), sx = pl.x + pl.w / 2, sy = pl.y + 9;
  let best = null, bd = rad;
  for (const e of enemies) {
    if (!rnAlive(e)) continue;
    const ex = rnCx(e), ey = rnCy(e); if (Math.hypot(ex - sx, ey - sy) > reach) continue;
    const d = Math.hypot(ex - mx, ey - my); if (d < bd && (!los || losClear(sx, sy, ex, ey))) { bd = d; best = e; }
  }
  return best;
}
// vira a velocidade aos poucos na direção de um ponto
function rnSteer(o, tx, ty, rate, dt) {
  const sp = Math.hypot(o.vx, o.vy), a0 = Math.atan2(o.vy, o.vx), da = clamp(((Math.atan2(ty - o.y, tx - o.x) - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI, -rate * dt, rate * dt);
  o.vx = Math.cos(a0 + da) * sp; o.vy = Math.sin(a0 + da) * sp;
}
// cópias em leque da última coisa lançada: n pares, um de cada lado
function rnFan(arr, n, da, mk) {
  const o = arr[arr.length - 1]; if (!o) return;
  const a0 = Math.atan2(o.vy, o.vx), sp = Math.hypot(o.vx, o.vy);
  for (let k = 1; k <= n; k++) for (const sg of [-1, 1]) { const a = a0 + sg * da * k; arr.push(mk(o, Math.cos(a) * sp, Math.sin(a) * sp, a)); }
}
// antes de andar neste quadro: se vai bater na parede, rebate (vx e/ou vy trocam de sinal)
function rnBounce(o, dt) {
  const n = Math.max(1, Math.ceil(Math.hypot(o.vx, o.vy) * dt / 3));
  let x = o.x, y = o.y;
  for (let s = 0; s < n; s++) {
    const nx = x + o.vx * dt / n, ny = y + o.vy * dt / n;
    if (!solidAt(Math.floor(nx / T), Math.floor(ny / T))) { x = nx; y = ny; continue; }
    const hx = solidAt(Math.floor(nx / T), Math.floor(y / T)), hy = solidAt(Math.floor(x / T), Math.floor(ny / T));
    if (hx || !hy) o.vx = -o.vx;
    if (hy || !hx) o.vy = -o.vy;
    return true;
  }
  return false;
}
// um espinho de gelo do js/116 só de enfeite (não fere pelo js/116: o hit dele diz que já acertou todo mundo); o dano vem daqui
const RN_ALL = { has: () => true, add() { }, clear() { } };
function rnSpike(id, x, fy, frac, h = 16) {
  glSpikes.push({ x, y: fy, t: 0, hit: RN_ALL, h, seed: Math.random() * 99 | 0 });
  sfx.glSpike();
  for (const e of enemies) if (rnAlive(e) && e.x < x + 3 && e.x + e.w > x - 3 && e.y + e.h > fy - h && e.y < fy) rnSub(id, e, frac, { x });
}
// um raio que cai do alto numa coluna, do jeito do Relâmpago, mas por conta da runa que chamou
const rnCols = [];
function rnColumn(id, x, y, frac, delay) { const fy = fgFloor(x, y), bot = fy != null ? fy : y; rnCols.push({ id, x, top: rzCeil(x, bot, 12), bot, t: -delay, frac }); }

/* ================= Arco Voltaico ================= */
const rnArcHit = (e, dir, m) => rnHit('feitico_arco', e, ARC, () => { arcRoll = true; try { hitEnemy(e, dir, m, false); } finally { arcRoll = false; } }, dir);
function rnArcCast() {
  const S = rnSt('feitico_arco'), [mx, my] = mouseWorld(), pcx = pl.x + pl.w / 2;
  if (Math.abs(mx - pcx) > 2) pl.facing = mx > pcx ? 1 : -1;
  const sx = pcx + pl.facing * 6, sy = pl.y + 9, aim = Math.atan2(my - sy, mx - sx), hit = new Set();
  // o alvo: o inimigo mais perto da mira; se não houver um perto do mouse, o que estiver mais na direção dele
  const pick = () => {
    let first = null, best = Infinity;
    for (const e of enemies) {
      if (hit.has(e) || !arcAlive(e)) continue;
      const ex = ecx(e), ey = ecy(e), d = Math.hypot(ex - sx, ey - sy); if (d > ARC.reach) continue;
      const dm = Math.hypot(ex - mx, ey - my), da = Math.abs(((Math.atan2(ey - sy, ex - sx) - aim + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      const score = dm < 40 ? dm : da < 0.6 ? 40 + da * 120 + d * 0.2 : Infinity;
      if (score < best && losClear(sx, sy, ex, ey)) { best = score; first = e; }
    }
    return first;
  };
  const first = pick();
  pl.mana -= ARC.cost; arcCD = ARC.cd; pl.useT = 0.28; sfx.arc();
  if (!first) {
    // nada na mira: o raio corre até a parede ou até o fim do alcance e se apaga
    const L = Math.min(ARC.reach * 0.8, Math.hypot(mx - sx, my - sy)), ux = Math.cos(aim), uy = Math.sin(aim);
    let ex = sx, ey = sy; for (let t = 0; t < L; t += 3) { const nx = sx + ux * t, ny = sy + uy * t; if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) break; ex = nx; ey = ny; }
    burst(ex, ey, 6, '#8fd0ff', 60, 0, 0.3, 1, true);
    arcs.push(arcBolt([[sx, sy], [ex, ey]])); return;
  }
  // as correntes: primeiro escolhe os alvos, depois fere (assim o último elo sabe quem é o último)
  const see = (ax, ay, bx, by) => S.ghost || losClear(ax, ay, bx, by);
  const chain = (start, jumps) => {
    const out = [start]; hit.add(start); let cur = start;
    for (let j = 0; j < jumps; j++) {
      const ex = ecx(cur), ey = ecy(cur); let nxt = null, nd = ARC.hop;
      for (const e of enemies) { if (hit.has(e) || !arcAlive(e)) continue; const d = Math.hypot(ecx(e) - ex, ecy(e) - ey); if (d < nd && see(ex, ey, ecx(e), ecy(e))) { nd = d; nxt = e; } }
      if (!nxt) break;
      out.push(nxt); hit.add(nxt); cur = nxt;
    }
    return out;
  };
  const main = chain(first, ARC.jumps), fork = S.fork ? chain(first, Math.floor(ARC.jumps / 2)).slice(1) : [];
  const first2 = S.twin ? pick() : null, twin = first2 ? chain(first2, Math.floor(ARC.jumps / 2)) : [];
  const solo = main.length + fork.length + twin.length === 1, step = S.ramp ? 1 + S.ramp : ARC.fall;
  const strike = (list, from, mult0, lastOk, back) => {
    const path = [from]; let mult = mult0;
    list.forEach((e, j) => {
      const [px] = path[path.length - 1], ex = ecx(e), ey = ecy(e), isLast = lastOk && j === list.length - 1;
      path.push([ex, ey]);
      let m = mult;
      if (e === first || e === first2) m *= 1 + (S.first || 0);
      if (isLast && S.last) m *= 2;
      if (solo) m *= 1 + (S.solo || 0);
      rnArcHit(e, ex >= px ? 1 : -1, m);
      burst(ex, ey, 8, '#8fd0ff', 90, 0, 0.35, 1, true); burst(ex, ey, 4, '#f2fbff', 50, 0, 0.2, 1, true);
      if (path.length > 2) sfx.zap();
      if (isLast && S.endNova) rnBlast('feitico_arco', ex, ey, 28, S.endNova);
      mult *= step;
    });
    // Retorno: depois do último salto, o raio volta e acerta o primeiro alvo de novo
    if (back && list.length > 1 && !list[0].dead) {
      const e = list[0], [px] = path[path.length - 1];
      path.push([ecx(e), ecy(e)]); rnArcHit(e, ecx(e) >= px ? 1 : -1, mult);
      burst(ecx(e), ecy(e), 8, '#f2fbff', 90, 0, 0.35, 1, true); sfx.zap();
    }
    arcs.push(arcBolt(path));
  };
  strike(main, [sx, sy], 1, main.length > 1 || !fork.length, !!S.ret);
  if (fork.length) strike(fork, [ecx(first), ecy(first)], step, true, false);
  if (twin.length) strike(twin, [sx, sy], 1, true, false);
  shake(1.5);
}
castArc = rnCastWrap('feitico_arco', rnArcCast);

/* ================= Relâmpago ================= */
const rzStrikeAt = (x, y, o) => { const fy = fgFloor(x, y), bot = fy != null ? fy : y; rzStrikes.push(Object.assign({ x, top: rzCeil(x, bot, 12), bot, t: 0, done: false }, o)); };
RN_SPEC.feitico_relampago = {
  cast(S) {
    const s = rzStrikes[rzStrikes.length - 1]; if (!s) return;
    // Caçador: o raio cai no inimigo mais perto da mira
    if (S.seek) { const e = rnNearAim(ESC.relampago.reach, 70, false); if (e) { const fy = fgFloor(rnCx(e), rnCy(e)); s.x = rnCx(e); s.bot = fy != null ? fy : e.y + e.h; s.top = rzCeil(s.x, s.bot, 12); } }
    // Tempestade: mais raios em volta, um pouco depois
    for (let k = 1; k <= (S.storm | 0); k++) {
      const x = s.x + (k % 2 ? -1 : 1) * (30 + 12 * k) + rnd(-6, 6);
      if (!solidAt(Math.floor(x / T), Math.floor((s.bot - 6) / T))) rzStrikeAt(x, s.bot - 6, { t: -0.12 * k, rnX: true });
    }
  }
};

/* ================= Lança de Raio ================= */
const rnLanceOf = e => { for (const l of rzLances) if (l.hit.has(e) && escTouch(e, l.x, l.y, 6)) return l; return null; };
RN_SPEC.feitico_lanca_raio = {
  cast(S) { if (S.fan) rnFan(rzLances, S.fan, 0.16, (o, vx, vy) => ({ x: o.x, y: o.y, vx, vy, t: 0, life: o.life, hit: new Set(), trail: [[o.x, o.y]] })); },
  // Carga Crescente: cada inimigo já atravessado soma no próximo
  mult(e, S) { if (!S.pierceUp || runDepth > 0) return 0; const l = rnLanceOf(e); return l ? S.pierceUp * Math.max(0, l.hit.size - 1) : 0; },
  hit(e, S) { if (S.stunFirst) { const l = rnLanceOf(e); if (l && l.hit.size === 1) rnStun(e, S.stunFirst); } }
};
rnTrack(rzLances, l => { const S = rnSt('feitico_lanca_raio'); if (S.endBoom) rnBlast('feitico_lanca_raio', l.x, l.y, 24, S.endBoom); });

/* ================= Passo do Trovão ================= */
RN_SPEC.feitico_passo = {
  // quem o corpo do herói atravessa (só os golpes do próprio salto, não os estouros)
  hit(e, S) {
    if (rnInCast !== 'feitico_passo') return;
    if (S.stunPass) rnStun(e, S.stunPass);
    if (S.lifePass && !pl.dead) pl.hp = Math.min(pl.maxHp, pl.hp + S.lifePass);
    if (S.manaPass) pl.mana = Math.min(pl.maxMana, pl.mana + S.manaPass);
  },
  cast(S) {
    const d = rzDashes[rzDashes.length - 1]; if (!d) return;
    if (S.depart) rnBlast('feitico_passo', d.ax, d.ay, 30, S.depart);
    if (S.land) rnBlast('feitico_passo', d.bx, d.by, 30, S.land);
    if (S.thunder) rnColumn('feitico_passo', d.bx, d.by, 1, 0.3);
    if (S.trail) {
      const n = Math.max(1, Math.round(Math.hypot(d.bx - d.ax, d.by - d.ay) / 14));
      for (let k = 0; k <= n; k++) { const x = d.ax + (d.bx - d.ax) * k / n, y = d.ay + (d.by - d.ay) * k / n; rnField('feitico_passo', x - 7, y - 10, x + 7, y + 10, 1.5, { tick: 0.3, frac: S.trail }); }
    }
    if (S.reset && Math.random() < S.reset) { escCD.passo = 0; burst(pl.x + pl.w / 2, pl.y + 10, 12, '#bfe6ff', 80, 0, 0.35, 1, true); }
  }
};

/* ================= Essência Estática ================= */
{
  // Par de Essências: a de antes fica no ar junto com a nova
  const _c = ESC_CAST.pararaios;
  ESC_CAST.pararaios = S => {
    const keep = rnSt('feitico_pararaios').two ? rzCores[rzCores.length - 1] : null;
    const r = _c(S);
    if (r !== false && keep) rzCores.unshift(keep);
    return r;
  };
}
const rnCoreNear = e => { let best = null, bd = Infinity; for (const c of rzCores) { const d = Math.hypot(c.x - rnCx(e), c.y - rnCy(e)); if (d < bd) { bd = d; best = c; } } return best; };
RN_SPEC.feitico_pararaios = {
  mult(e, S) { if (!S.ramp || runDepth > 0) return 0; const c = rnCoreNear(e); return c ? S.ramp * Math.min(10, c.rnN || 0) : 0; },
  hit(e, S) {
    if (!S.pull || e.boss) return;
    const c = rnCoreNear(e); if (!c) return;
    e.vx = clamp((c.x - rnCx(e)) * 2.5, -80, 80);
    if (ET[e.type] && ET[e.type].fly) e.vy = clamp((c.y - rnCy(e)) * 2.5, -80, 80);
  }
};
rnTrack(rzCores, c => { const S = rnSt('feitico_pararaios'); if (S.endBoom && c.t >= ESC.pararaios.dur - 0.05) rnBlast('feitico_pararaios', c.x, c.y, 36, S.endBoom); });

/* ================= Nevasca ================= */
let rnNevR = NEV.r;
rnOnPush(nevShards, s => { const S = rnSt('feitico_nevasca'); if (S.hail && Math.random() < S.hail) { s.rnHail = true; s.len = 2; } });
RN_SPEC.feitico_nevasca = {
  // Granizo: a pedra que acertou fere o triplo
  mult(e, S) {
    if (!S.hail || runDepth > 0) return 0;
    for (const s of nevShards) if (s.rnHail && s.x >= e.x - 1 && s.x <= e.x + e.w + 1 && s.y >= e.y && s.y <= e.y + e.h) return 2;
    return 0;
  },
  hit(e, S) { if (S.shardStacks) rnAddStacks('feitico_nevasca', e, S.shardStacks); },
  cast(S) {
    const n = nevs[nevs.length - 1]; if (!n || !S.twin) return;
    const side = n.x >= pl.x + pl.w / 2 ? 1 : -1;
    for (const sd of [side, -side]) {
      const x = n.x + sd * (NEV.r * 2 + 8);
      if (!nevSolidPx(x, n.y) && !nevSolidPx(x, n.y + 6)) { nevs.push({ x, y: n.y, t: 0, acc: 0, seed: Math.floor(Math.random() * 1e6) }); break; }
    }
  }
};
// no fim da nuvem: geada no chão e o anel do Último Sopro
rnTrack(nevs, n => {
  const S = rnSt('feitico_nevasca'); if (!S.frost && !S.endNova) return;
  const fy = fgFloor(n.x, n.y + 8);
  if (S.frost && fy != null) rnFloorFields('feitico_nevasca', n.x, fy - 2, NEV.r, 2, { frac: 0, stacks: 1, tick: 0.5 });
  if (S.endNova) {
    glNovas.push({ x: n.x, y: fy != null ? fy - 8 : n.y + 30, t: 0, hit: new Set(), S: { r: NEV.r + 12, grow: 0.3, min: NEV.min * S.endNova, max: NEV.max * S.endNova, stacks: 1 + S.endNova, rn: 'feitico_nevasca' }, elem: 'gelo' });
    sfx.glCast('nova_gelo');
  }
});

/* ================= Lança de Gelo ================= */
RN_SPEC.feitico_lanca_gelo = {
  cast(S) { if (S.fan) rnFan(glLances, S.fan, 0.16, (o, vx, vy, a) => ({ x: o.x, y: o.y, vx, vy, a, t: 0, life: o.life })); },
  // Golpe no Frio: em quem já está resfriado, a lança soma mais para congelar
  pre(e, S, F) { if (F !== ESC.lanca_gelo || !S.chilledStacks || !rnChilled(e) || (e.nevFrz || 0) > 0) return null; F.stacks += S.chilledStacks; return () => { F.stacks -= S.chilledStacks; }; }
};
rnTrack(glLances, l => {
  const S = rnSt('feitico_lanca_gelo'), sp = Math.hypot(l.vx, l.vy) || 1, ux = l.vx / sp, uy = l.vy / sp;
  const wall = solidAt(Math.floor((l.x + ux * 3) / T), Math.floor((l.y + uy * 3) / T));
  // Perfurar: parou num bicho e ainda pode atravessar: uma lança nova continua do outro lado
  if (!wall && l.t < l.life && (l.rnP || 0) < (S.pierce || 0)) {
    const e0 = enemies.find(e => escTouch(e, l.x, l.y, 1.5));
    let x = l.x, y = l.y, ok = false;
    for (let k = 0; k < 20; k++) {
      x += ux * 2; y += uy * 2;
      if (solidAt(Math.floor(x / T), Math.floor(y / T))) break;
      if (!e0 || !escTouch(e0, x, y, 1.5)) { ok = true; break; }
    }
    if (ok) { glLances.push({ x, y, vx: l.vx, vy: l.vy, a: l.a, t: l.t, life: l.life, rnP: (l.rnP || 0) + 1, rnB: l.rnB }); return; }
  }
  // quebrou: Estilhaço, Respingo Gelado e Pico de Gelo
  const back = wall ? -1 : 1, a = Math.atan2(uy * back, ux * back);
  if (S.shards) for (let k = 0; k < S.shards; k++) rnShot('feitico_lanca_gelo', l.x - ux * 2, l.y - uy * 2, a + rnd(-0.5, 0.5), 170, 0.35, { frac: 0.35 });
  if (S.splash) rnBlast('feitico_lanca_gelo', l.x - ux * 2, l.y - uy * 2, 22, S.splash);
  if (S.spike) { const fy = fgFloor(l.x - ux * 2, l.y - uy * 2); if (fy != null && fy - l.y < 4 * T) rnSpike('feitico_lanca_gelo', l.x, fy, 0.6); }
});

/* ================= Nova Congelante ================= */
RN_SPEC.feitico_nova_gelo = {
  // Olho do Inverno: quem está colado no herói
  mult(e, S) {
    if (!S.center || runDepth > 0) return 0;
    const dx = Math.max(0, Math.abs(rnCx(e) - (pl.x + pl.w / 2)) - (e.w + pl.w) / 2), dy = Math.max(0, Math.abs(rnCy(e) - (pl.y + pl.h / 2)) - (e.h + pl.h) / 2);
    return Math.hypot(dx, dy) < 8 ? S.center : 0;
  },
  // Vórtice: puxa para perto do herói
  hit(e, S, dmg, dir, F) {
    if (!S.pull || F !== ESC.nova_gelo || e.boss) return;
    e.vx = clamp((pl.x + pl.w / 2 - rnCx(e)) * 3, -110, 110);
    if (ET[e.type] && ET[e.type].fly) e.vy = clamp((pl.y + pl.h / 2 - rnCy(e)) * 3, -110, 110);
  },
  cast(S) {
    if (S.twin) rnLater(0.5, () => { glNovas.push({ x: pl.x + pl.w / 2, y: pl.y + pl.h / 2, t: 0, hit: new Set(), S: ESC.nova_gelo, elem: 'gelo' }); sfx.glCast('nova_gelo'); shake(1.5); });
    if (S.frostRing) rnFloorFields('feitico_nova_gelo', pl.x + pl.w / 2, pl.y + pl.h - 2, ESC.nova_gelo.r * 0.8, 2 * S.frostRing, { frac: 0, stacks: 1, tick: 0.5 });
    if (S.armor) { pl.rnArmorT = gameTime + 2; pl.rnArmorP = S.armor; burst(pl.x + pl.w / 2, pl.y + pl.h / 2, 16, '#d8f4ff', 50, 0, 0.5, 1, true); }
  }
};
// Coroa de Lascas: quando o anel termina, lascas para todo lado
rnTrack(glNovas, n => {
  const S = rnSt('feitico_nova_gelo'); if (!S.ringShards || n.S !== ESC.nova_gelo) return;
  for (let k = 0; k < S.ringShards; k++) { const a = k / S.ringShards * Math.PI * 2 + 0.2; rnShot('feitico_nova_gelo', n.x + Math.cos(a) * n.S.r * 0.85, n.y + Math.sin(a) * n.S.r * 0.85, a, 150, 0.4, { frac: 0.4 }); }
  sfx.nevShatter();
});

/* ================= Estacas de Gelo ================= */
rnOnPush(glRows, r => { r.rnX0 = r.x; });
RN_SPEC.feitico_estacas = {
  // Catapulta: o espinho joga para o alto
  hit(e, S, dmg, dir, F) { if (S.launch && F === ESC.estacas && !e.boss && !(ET[e.type] && ET[e.type].fly)) { e.vy = -190; e.vx = (e.vx || 0) * 0.3; } },
  cast(S) {
    const r = glRows[glRows.length - 1]; if (!r) return;
    const rows = [r];
    if (S.both) { const b = { x: pl.x + pl.w / 2 - r.dir * 9, fy: r.fy, dir: -r.dir, left: r.left, t: 0 }; glRows.push(b); rows.push(b); }
    if (S.again) {
      const copy = rows.map(q => ({ x: q.x, fy: q.fy, dir: q.dir, left: q.left, t: 0 }));
      rnLater(0.35, () => { for (const q of copy) glRows.push(q); sfx.glCast('estacas'); });
    }
  }
};
// Ponta Final: o último espinho da fileira explode em lascas
rnTrack(glRows, r => {
  const S = rnSt('feitico_estacas'); if (!S.bigEnd || r.x === r.rnX0) return;
  const x = r.x - r.dir * ESC.estacas.gap, y = r.fy - ESC.estacas.h * 0.6;
  rnLater(0.12, () => { for (let k = 0; k < 7; k++) rnShot('feitico_estacas', x, y, -Math.PI / 2 + (k - 3) * 0.32, 160, 0.4, { frac: 0.45 }); glBreak(x, y, 12); sfx.nevShatter(); });
});

/* ================= Orbe Glacial ================= */
RN_SPEC.feitico_orbe = {
  cast(S) {
    const o = glOrbs[glOrbs.length - 1]; if (!o || !S.twin) return;
    const y = o.y + 10; if (!solidAt(Math.floor(o.x / T), Math.floor(y / T))) glOrbs.push({ x: o.x, y, vx: o.vx, vy: o.vy, go: o.go, t: 0, emit: 0.05, ang: o.ang + 1.2 });
  }
};

/* ================= Bola de Fogo e Meteoro: as explosões ================= */
let rnBallCtx = null, rnMetCtx = false;
RN_SPEC.feitico_bola = {
  cast(S) { if (S.fan) rnFan(fgBalls, S.fan, 0.16, (o, vx, vy) => ({ x: o.x, y: o.y, vx, vy, t: 0, life: o.life })); },
  // Longo Voo: quanto mais a bola voou, mais fere
  mult(e, S) { return S.fly && runDepth === 0 && rnBallCtx ? Math.min(20, (rnBallCtx.rnD || 0) / T) * S.fly : 0; }
};
{
  const _fe = fgExplode;
  fgExplode = function (x, y, F, big) {
    if (F === FOGO.bola) {
      const prev = rnBallCtx; rnBallCtx = fgBalls.find(q => q.x === x && q.y === y) || null;
      try { _fe(x, y, F, big); } finally { rnBallCtx = prev; }
      const S = rnSt('feitico_bola');
      // Dividir: bolinhas que pulam e explodem
      if (S.split) for (let k = 0; k < S.split; k++) rnShot('feitico_bola', x, y - 2, -Math.PI / 2 + (k - (S.split - 1) / 2) * 0.45, rnd(100, 130), 0.7, { g: 320, frac: 0.35, boom: 14, size: 2 });
      // Chão em Brasa
      if (S.floor) { const fy = fgFloor(x, y - 2); if (fy != null && fy - y < 2 * T) fgWall(x, fy, F.r * 1.2, { min: 1, max: 2, tick: FOGO.parede.tick, rn: 'feitico_bola' }, 1 + S.floor); }
      return;
    }
    if (F === FOGO.meteoro) {
      _fe(x, y, F, big); rnMetCtx = true;   // o chão em chamas que vem logo depois é deste meteoro
      const S = rnSt('feitico_meteoro');
      if (S.rocks) for (let k = 0; k < S.rocks; k++) rnShot('feitico_meteoro', x, y - 4, -Math.PI / 2 + rnd(-1.1, 1.1), rnd(150, 220), 1.1, { g: 420, frac: 0.3, ign: true, size: 2 });
      return;
    }
    return _fe(x, y, F, big);
  };
}
{
  const _w = fgWall;
  fgWall = function (x, fy, w, F, dur) {
    if (rnMetCtx && F !== FOGO.parede && !F.rn) {
      rnMetCtx = false;
      const k = 1 + (rnSt('feitico_meteoro').patchDmg || 0);
      F = Object.assign({}, F, { min: F.min * k, max: F.max * k, rn: 'feitico_meteoro' });
    }
    return _w(x, fy, w, F, dur);
  };
}
function rnMetAim(m, tx, ty) { const fy = fgFloor(tx, ty), ly = fy != null ? fy - 3 : ty, side = pl.facing; m.x0 = tx - side * 90; m.y0 = ly - 200; m.x1 = tx; m.y1 = ly; m.floor = fy; }
RN_SPEC.feitico_meteoro = {
  cast(S) {
    const m = fgMeteors[fgMeteors.length - 1]; if (!m) return;
    if (S.seek) { const e = rnNearAim(FOGO.meteoro.reach, 80, false); if (e) rnMetAim(m, rnCx(e), e.y + e.h - 2); }
    // Chuva de Meteoros: mais pedras em volta, logo depois
    for (let k = 1; k <= (S.extra | 0); k++) {
      const x = m.x1 + (k % 2 ? -1 : 1) * (34 + 16 * k) + rnd(-8, 8), y = m.y1 - 6;
      rnLater(0.22 * k, () => { const o = { x0: 0, y0: 0, x1: 0, y1: 0, floor: null, t: 0 }; rnMetAim(o, x, y); fgMeteors.push(o); });
    }
  },
  hit(e, S, dmg, dir, F) {
    if (F !== FOGO.meteoro) return;
    if (S.stun) rnStun(e, S.stun);
    if (S.launch && !e.boss && !(ET[e.type] && ET[e.type].fly)) { e.vy = -210; e.vx = dir * 60; }
  }
};

/* ================= Inferno ================= */
let rnBreathT = 0, rnBreathOn = false, rnRoarT = 0, rnPuffT = 0, rnEmberT = 0, rnWardT = 0;
rnOnPush(fgFlames, () => { rnBreathOn = true; });
RN_SPEC.feitico_inferno = {
  mult(e, S) { return runDepth > 0 ? 0 : Math.min(10, rnBreathT) * (S.ramp || 0) + (rnBreathT < 0.5 ? S.start || 0 : 0); },
  crit(e, S) { return S.blue && rnBreathT >= 2 ? S.blue : 0; },
  pre(e, S, F) { if (S.bossBurn && e.boss && F === FOGO.inferno) FOGO.burn.dur *= 2; return null; },   // rnHit põe a duração de volta
  hit(e, S, dmg, dir, F) {
    if (F !== FOGO.inferno) return;
    if (S.push && !e.boss) e.vx = pl.facing * 80;
    if (S.smoke && (e.rnSmokeT || 0) <= gameTime) {
      e.rnSmokeT = gameTime + 1; e.atkCD = Math.max(e.atkCD || 0, 0) + S.smoke;
      for (let k = 0; k < 3; k++) parts.push({ x: e.x + rnd(0, e.w), y: e.y + rnd(0, e.h * 0.5), vx: rnd(-6, 6), vy: rnd(-20, -8), g: -4, life: rnd(0.6, 1), max: 1, col: Math.random() < 0.5 ? '#3a3030' : '#4a3e3a', size: 2, smoke: true });
    }
    if (S.ignNear && Math.random() < S.ignNear) {
      const q = rnNearest(rnCx(e), rnCy(e), 40, z => z === e || z.fgBurn > 0);
      if (q) { rnIgnite('feitico_inferno', q); burst(rnCx(q), rnCy(q), 8, '#ffb040', 60, -30, 0.4, 1, true); }
    }
  },
  // Muralha de Calor: soprando, quem está na frente bate mais fraco
  hurt(srcX, S) { return S.heat && rnBreathT > 0 && srcX != null && Math.sign(srcX - (pl.x + pl.w / 2)) === pl.facing ? 1 - S.heat : 1; }
};

/* ================= Parede de Fogo ================= */
rnOnPush(fgWalls, w => { w.rnDir = (w.x0 + w.x1) / 2 >= pl.x + pl.w / 2 ? 1 : -1; });
const rnWallBox = w => { let top = Infinity, bot = -Infinity; for (const c of w.cols) { top = Math.min(top, c[1]); bot = Math.max(bot, c[1]); } return [top - FOGO.parede.h, bot]; };
RN_SPEC.feitico_parede = {
  cast(S) {
    const w = fgWalls[fgWalls.length - 1]; if (!w || w.F !== FOGO.parede || !S.twin) return;
    const P = FOGO.parede, cx = (w.x0 + w.x1) / 2, side = cx >= pl.x + pl.w / 2 ? 1 : -1, wd = w.x1 - w.x0 + 4, fy = w.cols[w.cols.length >> 1][1];
    for (const sd of [side, -side]) { const nx = cx + sd * wd, f = fgFloor(nx, fy - 6); if (f != null && Math.abs(f - fy) <= 18 && fgWall(nx, f, P.w, P, P.dur)) break; }
  }
};
// Desabar: quando apaga, a parede explode inteira
rnTrack(fgWalls, w => {
  const S = rnSt('feitico_parede'); if (!S.endBoom) return;
  const [top, bot] = rnWallBox(w), y = (top + bot) / 2;
  for (let x = w.x0 + 6; x <= w.x1 - 5; x += 14) { fgBooms.push({ x, y: y + rnd(-4, 4), r: 16, t: 0, life: 0.4 }); burst(x, y, 6, '#ffb040', 90, 60, 0.4, 1, true); }
  for (const e of enemies) if (rnAlive(e) && e.x + e.w > w.x0 - 10 && e.x < w.x1 + 10 && e.y + e.h > top - 10 && e.y < bot + 4) rnSub('feitico_parede', e, S.endBoom, { x: (w.x0 + w.x1) / 2 });
  shake(3.5); sfx.fgBoom(true);
}, w => w.F === FOGO.parede);

/* ================= Hidra ================= */
// Duas Línguas: cada cuspe sai dobrado, em leque
rnOnPush(fgBolts, b => {
  if (b.rnTwin || !rnSt('feitico_hidra').twin) return;
  const a = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy);
  b.vx = Math.cos(a - 0.12) * sp; b.vy = Math.sin(a - 0.12) * sp;
  fgBolts.push({ x: b.x, y: b.y, vx: Math.cos(a + 0.12) * sp, vy: Math.sin(a + 0.12) * sp, t: 0, rnTwin: true });
});
rnTrack(fgBolts, b => { const S = rnSt('feitico_hidra'); if (S.boltBoom) rnBlast('feitico_hidra', b.x, b.y, 16, S.boltBoom); });
rnTrack(fgHydras, h => { const S = rnSt('feitico_hidra'); if (S.endBoom) rnBlast('feitico_hidra', h.x, h.y - 12, 34, S.endBoom); });

/* ================= antes do quadro dos feitiços: rebater e dar meia-volta ================= */
HOOK.update.unshift(dt => {
  let S = rnSt('feitico_lanca_raio');
  if (S.bounce || S.ret) for (const l of rzLances) {
    if (S.bounce && (l.rnB || 0) < S.bounce && rnBounce(l, dt)) { l.rnB = (l.rnB || 0) + 1; l.t = Math.max(0, l.t - l.life * 0.5); l.hit.clear(); }
    // Bumerangue: no fim do caminho, volta para o herói
    if (S.ret && !l.rnRet && l.t + dt >= l.life) {
      const hx = pl.x + pl.w / 2, hy = pl.y + 10, d = Math.hypot(hx - l.x, hy - l.y), sp = Math.hypot(l.vx, l.vy);
      if (d > 12) { l.vx = (hx - l.x) / d * sp; l.vy = (hy - l.y) / d * sp; l.t = 0; l.life = d / sp; l.hit = new Set(); l.rnRet = true; }
    }
  }
  S = rnSt('feitico_lanca_gelo');
  if (S.bounce) for (const l of glLances) if ((l.rnB || 0) < S.bounce && rnBounce(l, dt)) { l.rnB = (l.rnB || 0) + 1; l.a = Math.atan2(l.vy, l.vx); l.t = Math.max(0, l.t - l.life * 0.5); }
  S = rnSt('feitico_bola');
  if (S.bounce) for (const b of fgBalls) if ((b.rnB || 0) < S.bounce && rnBounce(b, dt)) { b.rnB = (b.rnB || 0) + 1; b.t = Math.max(0, b.t - b.life * 0.5); }
});

/* ================= depois do quadro dos feitiços ================= */
HOOK.update.push(dt => {
  // o que sumiu das listas neste quadro
  for (const t of rnTracks) for (const o of t.set) if (!t.arr.includes(o)) { t.set.delete(o); try { t.f(o); } catch (err) { console.error(err); } }
  rnMetCtx = false;
  if (NEV.r !== rnNevR) { rnNevR = NEV.r; nevCloudS = null; nevGlowS = null; }   // a nuvem mudou de largura: pinta de novo

  // raios que caem por conta de uma runa (Trovoada)
  for (let i = rnCols.length - 1; i >= 0; i--) {
    const c = rnCols[i]; c.t += dt;
    if (c.t < 0) { if (Math.random() < dt * 30) rzPart(c.x + rnd(-5, 5), c.top + rnd(0, 6), 30); continue; }
    rnCols.splice(i, 1);
    for (let k = 0; k < 2; k++) { const a = arcBolt([[c.x + rnd(-3, 3), c.top], [c.x + rnd(-6, 6), (c.top + c.bot) / 2], [c.x, c.bot]]); a.life = 0.32; arcs.push(a); }
    for (const e of enemies) if (rnAlive(e) && e.x - 6 < c.x && e.x + e.w + 6 > c.x && e.y + e.h > c.top && e.y < c.bot) rnSub(c.id, e, c.frac, { x: c.x });
    burst(c.x, c.bot - 1, 18, '#bfe6ff', 120, 300, 0.4, 1, true); shake(3); sfx.rzThunder();
  }

  // Relâmpago: o que acontece quando o raio cai
  let S = rnSt('feitico_relampago');
  for (const s of rzStrikes) {
    if (!s.done || s.rnSeen) continue; s.rnSeen = true;
    if (S.sparks) for (const d of [-1, 1]) rnShot('feitico_relampago', s.x + d * 3, s.bot - 3, d > 0 ? 0 : Math.PI, 170, 0.45, { frac: S.sparks, pierce: 3 });
    if (S.branch) {
      const got = new Set();
      for (let k = 0; k < S.branch; k++) {
        const e = rnNearest(s.x, s.bot - 12, 80, q => got.has(q) || Math.abs(rnCx(q) - s.x) < ESC.relampago.w + q.w / 2);
        if (!e) break; got.add(e); rnZap(s.x, s.bot - 12, e); rnSub('feitico_relampago', e, 0.6, { x: s.x });
      }
    }
    if (S.field) rnField('feitico_relampago', s.x - 14, s.bot - 8, s.x + 14, s.bot, 2, { tick: 0.4, frac: S.field });
    // Réplica: meio segundo depois, outro raio no mesmo lugar
    if (S.after && !s.rnX && !s.rnRep) rzStrikes.push({ x: s.x, top: s.top, bot: s.bot, t: ESC.relampago.delay - 0.5, done: false, rnRep: true });
  }

  // Lança de Raio: lança grossa e rastro estático
  S = rnSt('feitico_lanca_raio');
  for (const l of rzLances) {
    const px = l.rnPx != null ? l.rnPx : l.trail[0][0], py = l.rnPy != null ? l.rnPy : l.trail[0][1];
    if (S.fat) {
      const n = Math.max(1, Math.ceil(Math.hypot(l.x - px, l.y - py) / 3));
      for (let s = 1; s <= n; s++) {
        const x = px + (l.x - px) * s / n, y = py + (l.y - py) * s / n;
        for (const e of enemies) if (!l.hit.has(e) && rnAlive(e) && escTouch(e, x, y, 2 + S.fat)) { l.hit.add(e); escHit(e, ESC.lanca_raio, 'raio', l.vx >= 0 ? 1 : -1, true); }
      }
    }
    if (S.trail) { l.rnTr = (l.rnTr || 0) + Math.hypot(l.x - px, l.y - py); if (l.rnTr >= 14) { l.rnTr = 0; rnField('feitico_lanca_raio', l.x - 7, l.y - 7, l.x + 7, l.y + 7, 1, { tick: 0.3, frac: S.trail }); } }
    l.rnPx = l.x; l.rnPy = l.y;
  }

  // Essência Estática: conta os pulsos (Acúmulo) e anda atrás de inimigo (Caçadora)
  S = rnSt('feitico_pararaios');
  for (const c of rzCores) {
    if (c.rnF != null && c.flash > c.rnF) c.rnN = (c.rnN || 0) + 1;
    c.rnF = c.flash;
    if (!S.follow) continue;
    const e = rnNearest(c.x, c.y, 140, null); if (!e) continue;
    const dx = rnCx(e) - c.x, dy = rnCy(e) - c.y, d = Math.hypot(dx, dy); if (d < 10) continue;
    const nx = c.x + dx / d * 22 * dt, ny = c.y + dy / d * 22 * dt;
    if (!solidAt(Math.floor(nx / T), Math.floor(ny / T))) { c.x = nx; c.y = ny; }
  }

  // Nevasca: a nuvem anda atrás da mira
  S = rnSt('feitico_nevasca');
  if (S.follow && nevs.length) {
    const [mx] = mouseWorld();
    for (const n of nevs) {
      const dx = mx - n.x; if (Math.abs(dx) < 2) continue;
      const nx = n.x + Math.sign(dx) * Math.min(Math.abs(dx), 30 * dt);
      if (!nevSolidPx(nx, n.y) && !nevSolidPx(nx + Math.sign(dx) * NEV.r * 0.5, n.y)) n.x = nx;
    }
  }

  // Orbe Glacial: Orbe Faminto e Corpo Gelado
  S = rnSt('feitico_orbe');
  if (S.seek || S.touch) for (const o of glOrbs) {
    if (S.seek && o.t < ESC.orbe.dur - 0.2) {
      const e = rnNearest(o.x, o.y, 120, null);
      if (e) { rnSteer(o, rnCx(e), rnCy(e), 3, dt); if (Math.hypot(rnCx(e) - o.x, rnCy(e) - o.y) > 10) o.go = Math.max(o.go, o.t + 0.1); }
    }
    if (S.touch) for (const e of enemies) if (rnAlive(e) && (e.rnOrbT || 0) <= gameTime && rnTouch(e, o.x, o.y, 5)) { e.rnOrbT = gameTime + 0.4; rnSub('feitico_orbe', e, S.touch, { x: o.x }); }
  }

  // Bola de Fogo: quanto voou, Bola Faminta e Rastro de Faíscas
  S = rnSt('feitico_bola');
  for (const b of fgBalls) {
    b.rnD = (b.rnD || 0) + Math.hypot(b.vx, b.vy) * dt;
    if (S.seek) { const e = rnNearest(b.x, b.y, 140, null); if (e) rnSteer(b, rnCx(e), rnCy(e), 2.5, dt); }
    if (S.sparks) { b.rnSp = (b.rnSp || 0) - dt; if (b.rnSp <= 0) { b.rnSp = 0.07; rnShot('feitico_bola', b.x, b.y, Math.PI / 2 + rnd(-0.6, 0.6), rnd(20, 50), 0.6, { g: 260, frac: 0, ign: true }); } }
  }

  // Inferno: o fôlego (quanto tempo soprando sem parar) e o que sai dele
  if (rnBreathOn && !pl.dead) {
    rnBreathT += dt;
    const S = rnSt('feitico_inferno'), F = FOGO.inferno, [hx, hy] = handXY(), [mx, my] = mouseWorld(), a = Math.atan2(my - hy, mx - hx);
    if (S.embers) {
      rnEmberT -= dt;
      if (rnEmberT <= 0) {
        rnEmberT = 0.22; const d = rnd(10, F.len * 0.8);
        rnShot('feitico_inferno', hx + Math.cos(a) * d, hy + Math.sin(a) * d, Math.PI / 2 + rnd(-0.5, 0.5), rnd(10, 40), 1.2, { g: 300, frac: 0, ign: true, end: s => { const fy = fgFloor(s.x, s.y - 2); if (fy != null && Math.abs(fy - s.y) < 8) fgWall(s.x, fy, 10, { min: 1, max: 2, tick: 0.35, rn: 'feitico_inferno' }, 1.2); } });
      }
    }
    if (S.puffs) { rnPuffT += dt; if (rnPuffT >= 1.2) { rnPuffT -= 1.2; rnShot('feitico_inferno', hx, hy, a, 200, 0.55, { frac: 1.5, boom: 14, size: 2 }); sfx.fgSpit(); } }
    if (S.roar) {
      rnRoarT += dt;
      if (rnRoarT >= 2.5) {
        rnRoarT -= 2.5;
        let tx = hx, ty = hy; for (let t = 0; t < F.len; t += 3) { const nx = hx + Math.cos(a) * t, ny = hy + Math.sin(a) * t; if (solidAt(Math.floor(nx / T), Math.floor(ny / T))) break; tx = nx; ty = ny; }
        rnBlast('feitico_inferno', tx, ty, 22, S.roar);
      }
    }
    if (S.ward) { rnWardT += dt; if (rnWardT >= 1) { rnWardT -= 1; rnOnCast('feitico_inferno', 0, null); } }
    if (S.blue && rnBreathT >= 2 && Math.random() < dt * 24) parts.push({ x: hx + Math.cos(a) * rnd(4, 18), y: hy + Math.sin(a) * rnd(4, 18), vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 10, g: -10, life: 0.25, max: 0.25, col: Math.random() < 0.5 ? '#9fd8ff' : '#e8f8ff', size: 1, glow: true });
  } else { rnBreathT = 0; rnRoarT = 0; rnPuffT = 0; rnWardT = 0; }
  rnBreathOn = false;

  // Parede de Fogo: anda, empurra e cura
  S = rnSt('feitico_parede');
  let healed = false;
  if (S.move || S.block || S.heal) for (const w of fgWalls) {
    if (w.F !== FOGO.parede) continue;
    if (S.move && !w.rnStop) {
      w.rnMv = (w.rnMv || 0) + 14 * dt;
      if (w.rnMv >= 3) {
        w.rnMv -= 3;
        const nc = [];
        for (const c of w.cols) { const px = c[0] + 3 * w.rnDir, f = fgFloor(px, c[1] - 6); if (f == null || Math.abs(f - c[1]) > 18) { w.rnStop = true; break; } nc.push([px, f, c[2]]); }
        if (!w.rnStop) { w.cols = nc; w.x0 += 3 * w.rnDir; w.x1 += 3 * w.rnDir; }
      }
    }
    const [top, bot] = rnWallBox(w);
    if (S.block) for (const e of enemies) {
      if (!rnAlive(e) || e.boss || (e.rnWallT || 0) > gameTime || e.x + e.w <= w.x0 || e.x >= w.x1 || e.y + e.h <= top || e.y >= bot) continue;
      e.rnWallT = gameTime + 0.35; e.vx = (rnCx(e) >= (w.x0 + w.x1) / 2 ? 1 : -1) * 130; e.vy = Math.min(e.vy, -70);
    }
    if (S.heal && !healed && !pl.dead && pl.x + pl.w > w.x0 && pl.x < w.x1 && pl.y + pl.h > top && pl.y < bot) {
      healed = true; pl.rnHeal = (pl.rnHeal || 0) + S.heal * dt;
      if (pl.rnHeal >= 1) { pl.rnHeal -= 1; if (pl.hp < pl.maxHp) { pl.hp += 1; floatText(pl.x + pl.w / 2, pl.y - 6, '+1', '#7dff8a', 0.7); } }
    }
  }

  // Hidra: Mordida
  S = rnSt('feitico_hidra');
  if (S.bite) for (const h of fgHydras) {
    h.rnBite = (h.rnBite || 0) - dt; if (h.rnBite > 0 || h.t < 0.3) continue;
    for (const e of enemies) {
      if (!rnAlive(e) || !rnTouch(e, h.x + h.face * 6, h.y - 14, 12)) continue;
      h.rnBite = 0.8; h.open = 0.25; h.face = rnCx(e) >= h.x ? 1 : -1;
      rnSub('feitico_hidra', e, 1.2, { x: h.x }); burst(rnCx(e), rnCy(e), 8, '#ffb040', 70, 0, 0.3, 1, true); sfx.fgSpit();
      break;
    }
  }
});

/* ---- granizo: uma pedrinha branca em vez do risco ---- */
HOOK.drawTop.push((cx, cy) => {
  for (const s of nevShards) {
    if (!s.rnHail) continue;
    const x = Math.round(s.x) - cx, y = Math.round(s.y) - cy;
    lc.fillStyle = '#ffffff'; lc.fillRect(x - 1, y - 1, 2, 1); lc.fillRect(x - 1, y, 1, 1);
    lc.fillStyle = '#a8dcf4'; lc.fillRect(x, y, 2, 1); lc.fillRect(x + 1, y - 1, 1, 1);
    lc.fillStyle = '#4a86b4'; lc.fillRect(x - 1, y + 1, 3, 1);
  }
});

/* ---- mundo novo ---- */
{
  const _nw = newWorld;
  newWorld = function (sd, sv) {
    _nw(sd, sv);
    for (const t of rnTracks) t.set.clear();
    rnCols.length = 0; rnBreathT = 0; rnBreathOn = false; rnMetCtx = false; rnBallCtx = null;
  };
}
