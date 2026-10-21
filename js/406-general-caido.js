'use strict';

/* ================= O General Caído: o chefe do Campo da Última Guerra =================
   O Campo do Estandarte (docs/camadas/17-campo-guerra.md, seção 7). O 405 reserva do outro lado do mundo, na faixa do
   Estandarte, uma caixa maciça de cx - 53 a cx + 52 e de top - 3 a fy + 3, cava os dois corredores por fora e chama
   guDress; este arquivo escreve o Campo dentro dela: o oco de 100 x 30 de teto em arco, o chão de ferro de batalha
   (protegido), as duas portas no pé das paredes, os dois baluartes de cantaria de 5 de altura com a escada de cerco (a
   saída da Carga), e no meio O Estandarte: a haste alta com o pano dourado dos anjos, presa por duas cordas a duas
   estacas fincadas no chão. Sem trono: a sala é o estandarte e a cavalaria que ele ainda chama.
   O General foi o último comandante dos anjos que caíram para o lado de baixo: armadura negra com o fio de ouro, as
   asas queimadas, a coroa de chifres. Entrar no Campo acorda o General; a Muralha de Escudos (GU_BARREIRA) fecha as
   duas portas.
     1. O estandarte de pé: enquanto ele está erguido o General leva 70% menos dano (e não passa de 60% da vida). A cada
        8 s o estandarte levanta um caído (um pilar de luz por 1,2 s no chão, depois um Cavaleiro Caído ou um Arqueiro
        da Chuva; até 3; sem XP e sem loot). Para derrubar o estandarte: quebrar as duas estacas (as cordas soltam) e
        depois o pé da haste. Ele luta de espada: Corte (a espada sobe 0,55 s) e Investida (agacha 0,7 s, a marca corre
        pelo chão, e ele avança 6 blocos).
     2. O estandarte caído: ele arranca o estandarte do chão e luta com ele como alabarda: Varrida (a haste vai para
        trás 0,7 s e passa larga na frente) e Investida. A cada 14 s, A CARGA: a corneta soa, os cascos marcam todo o chão
        por 1,6 s e uma onda de cavalaria espectral atravessa o Campo de uma porta à outra, pegando quem estiver até 2
        blocos acima do chão. Sobe-se num baluarte ou pula-se por cima.
     3. Abaixo de 33%: ele finca o estandarte no meio do Campo e o pano pega fogo do inferno. Volta à espada, e: Salto do
        Juízo (a sombra cresce no chão debaixo do herói por 1 s; ele cai ali e a onda corre para os dois lados), as
        Fendas (três linhas acesas no chão por 1 s, uma debaixo do herói, e estouram em fogo) e A Carga a cada 18 s.
   Sair do Campo, usar portal ou morrer reinicia: o estandarte volta de pé com as estacas, os caídos e o General somem e a
   muralha abre. Vencer: A Lança do General (lança lendária: +6% de dano por inimigo a até 5 blocos do herói, até +30%)
   e uma das três bases da camada. A morte fica salva (generalCaido.dead). Carrega depois do 405 e antes do 49. */

const GEN_L = layerBossLvl('guerra');
const GEN = { hp: Math.round(330 * (1 + 0.3 * (GEN_L - 1))), dmg: Math.round(9 * (1 + 0.2 * (GEN_L - 1))), xp: 560, p3: 0.33, piso1: 0.6, carga2: 14, carga3: 18, ergue: 8, fenda: 4.5 };
const genState = { dead: false };
ET.general = { name: 'O General Caído', w: 12, h: 24, hp: GEN.hp, dmg: GEN.dmg, xp: GEN.xp, kb: 0, fly: false, blood: '#2a1a1e', boss: true };
ET.gu_estaca = { name: 'Estaca do Estandarte', w: 8, h: 10, hp: Math.round(GEN.hp * 0.06), dmg: 0, xp: 0, kb: 0, fly: true, phase: true, blood: '#6c5430' };
ET.gu_haste = { name: 'Haste do Estandarte', w: 10, h: 18, hp: Math.round(GEN.hp * 0.08), dmg: 0, xp: 0, kb: 0, fly: true, phase: true, blood: '#a07820' };
AI.gu_estaca = e => { e.vx = 0; e.vy = 0; };
DRAW_E.gu_estaca = () => { }; DRAW_E.gu_haste = () => { };   // desenhados pelo HOOK.drawWorld (as estacas, a haste no estandarte)
AI.gu_haste = e => { e.vx = 0; e.vy = 0; };
const GEN_BASES = ['espada_anjo', 'escudo_muralha', 'elmo_chifres_caido'];
const genDrops = () => { DROPS.general = [['lanca_general', 1], ['min_belicita', 1, 6, 10], ['medalha_guerra', 1, 1, 3], ['pena_anjo', 1, 2, 4], ['chifre_demonio', 1, 2, 4], ['pocao', 1, 2, 4]].filter(([id]) => ITEMS[id]); DROPS.gu_estaca = []; DROPS.gu_haste = []; };

let genBoss = null;
// o estandarte: 'pe' (de pé, preso), 'solto' (as estacas quebradas), 'caido' (na mão dele), 'fogo' (fincado no meio, aceso)
const genStd = { st: 'pe', estacas: [], haste: null, fallT: 0 };
const genFx = { carga: null, cargaT: GEN.carga2, ergueT: 4, fendaT: GEN.fenda, fendas: [], erupcoes: [], minions: [] };

/* ---------- a sala (o 405 chama guDress depois do guAfter) ---------- */
const genB = () => guBoss;
const genStdX = () => genB().cx * T + T / 2;
function genDoors(shut) {
  const B = genB(); if (!B) return;
  for (const x of [B.cx - 51, B.cx + 50]) for (let y = B.fy - 4; y < B.fy; y++) { const i = y * WW + wrapX(x); tiles[i] = shut ? GU_BARREIRA : AIR; walls[i] = WGU_TIJOLO; diffs.delete(i); markDirty(wrapX(x), y); }
  if (typeof mapVer !== 'undefined') mapVer++;
}
function guDress() {
  const B = genB(); if (!B) return;
  const W1 = x => ((x % WW) + WW) % WW, I = (x, y) => y * WW + W1(x), R = mulberry32(seed ^ 0x6e7a1);
  // o oco: 100 x 30, o teto em arco (mais alto no meio), a parede de fundo de tijolo de fosso embaixo e de rocha queimada em cima
  for (let y = B.top; y < B.fy; y++) for (let x = B.cx - 50; x <= B.cx + 49; x++) {
    const i = I(x, y), u = (x + 0.5 - B.cx) / 50, v = (B.fy - y) / B.h;
    if (v > 0.7 + 0.3 * (1 - u * u)) continue;   // os ombros do arco
    tiles[i] = AIR; walls[i] = v < 0.35 ? WGU_TIJOLO : WGU_ESCORIA; guKeep.add(i); if (agua.length) agua[i] = 0;
  }
  // o chão: ferro de batalha por cima, terra embaixo; protegido
  for (let x = B.cx - 53; x <= B.cx + 52; x++) { tiles[I(x, B.fy)] = GU_SUCATA; tiles[I(x, B.fy + 1)] = GU_TERRA; guKeep.add(I(x, B.fy)); }
  // as portas: 4 de altura, cruzando a casca
  for (const D of B.doors) for (let k = 0; k < 4; k++) { const x = D.side < 0 ? B.cx - 51 - k : B.cx + 50 + k; for (let y = B.fy - 4; y < B.fy; y++) { const i = I(x, y); tiles[i] = AIR; walls[i] = WGU_TIJOLO; guKeep.add(i); } }
  // os dois baluartes: 8 x 5 de cantaria, a escada de cerco do lado de dentro; duas auréolas caídas em cima (a luz)
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? B.cx - 36 : B.cx + 28, lx = s < 0 ? x0 + 8 : x0 - 1;
    for (let y = B.fy - 5; y < B.fy; y++) for (let x = x0; x < x0 + 8; x++) { tiles[I(x, y)] = y === B.fy - 5 ? GU_CANTARIA : (x + y) % 5 === 0 ? GU_MARMORE : GU_CANTARIA; guKeep.add(I(x, y)); }
    for (let y = B.fy - 6; y < B.fy; y++) { tiles[I(lx, y)] = GU_ESCADA; guKeep.add(I(lx, y)); }
    for (const ax of [x0 + 2, x0 + 5]) { tiles[I(ax, B.fy - 6)] = GU_AUREOLA; guKeep.add(I(ax, B.fy - 6)); }
  }
  // o chão do campo: lanças, espadas, ossos e elmos fincados, longe do estandarte e das escadas; fendas apagadas nos cantos
  for (let x = B.cx - 48; x <= B.cx + 47; x++) {
    if (Math.abs(x - B.cx) < 8 || tiles[I(x, B.fy - 1)] !== AIR || !SOLID[tiles[I(x, B.fy)]]) continue;
    if (GU_CLIMB(tiles[I(x - 1, B.fy - 1)]) || GU_CLIMB(tiles[I(x + 1, B.fy - 1)])) continue;
    const q = R(); if (q < 0.07) tiles[I(x, B.fy - 1)] = GU_LANCA; else if (q < 0.11) tiles[I(x, B.fy - 1)] = GU_ESPADA; else if (q < 0.15) tiles[I(x, B.fy - 1)] = GU_OSSOS; else if (q < 0.17) tiles[I(x, B.fy - 1)] = GU_ELMO; else if (q < 0.19 && Math.abs(x - B.cx) > 40) tiles[I(x, B.fy - 1)] = GU_FENDA;
  }
  // flâmulas penduradas do arco
  for (let x = B.cx - 40; x <= B.cx + 40; x += 6 + ((R() * 6) | 0)) { let y = B.top; while (y < B.fy - 12 && tiles[I(x, y)] !== AIR) y++; if (tiles[I(x, y - 1)] === AIR) continue; const n = 2 + ((R() * 3) | 0); for (let k = 0; k < n; k++) if (tiles[I(x, y + k)] === AIR) tiles[I(x, y + k)] = GU_FLAMULA; }
  genStd.st = genState.dead ? 'caido' : 'pe';
}

/* ---------- a arte do General (o boneco do herói de armadura negra, as asas queimadas atrás, a coroa de chifres) ---------- */
const GENA = {};
{
const { kit, man, set, espada, RP, tube, lin, bez } = GUART;
const BODY = [
  "..k.hhhh.k..", "..khhhhhhk..", "..hhhhhhhh..", "..hhhhhvvh..", "..hhhhhhhh..", "..hhhhhhhh..", "...hhhhhh...", "....gggg....",
  "..rrrrrrrr..", ".crrroorrr..", ".crrrorrrrr.", ".crrroorrrr.", ".crrrrrrrr..", ".cbbbbbbkb..", ".crrrrrrrr..", ".ccrrorrrr..",
  ".ccrrorrrrr.", ".ccrRorrrrr."];
const GMAT = { k: '#2a1a14', h: '#24222a', v: '#0a0406', g: '#3a3640', r: '#2a2830', o: '#c8a040', c: '#4a1012', b: '#1a1414', p: '#22202a', f: '#18161c', a: '#2a2830' };
let K = null;
const kitG = () => K || (K = kit(BODY, GMAT, 41501, { r: 'plate', h: 'plate' }));
// as asas queimadas: as penas negras com a ponta em brasa, abertas para trás (k: 0 fechadas, 1 abertas)
const wings = k => (P, bx, by) => {
  const sh = [bx + 4, by + 10];
  for (let j = 0; j < 6; j++) {
    const tip = k ? [bx - 12 + j * 1.4, by - 4 + j * 3.2] : [bx - 5 + j * 0.6, by + 4 + j * 2.6];
    tube(P, lin(sh[0] - j * 0.2, sh[1] + j * 0.4, tip[0], tip[1]), t => 2.2 - t * 1.4, RP.penaN, 41510 + j, 3 - j * 0.2);
    P.put(tip[0], tip[1], RP.ferrugem, 4.6);
  }
};
// a alabarda: o estandarte arrancado do chão, a lâmina de machado no alto e o pano dourado preso embaixo dela
const alabarda = (P, h, a, fogo) => {
  const c = Math.cos(a), sn = Math.sin(a), top = [h[0] + c * 15, h[1] + sn * 15];
  P.line(h[0] - c * 7, h[1] - sn * 7, top[0], top[1], RP.madeira, 3.8, 1);
  for (let u = 0; u < 5; u++) for (let w = 0; w < 4 - u * 0.5; w++) P.put(top[0] - c * u + sn * w, top[1] - sn * u - c * w, RP.aco, 4.8 - w * 0.6);
  P.put(top[0] + c, top[1] + sn, RP.aco, 5.4);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) P.put(top[0] - c * (5 + j) - sn * i * 0.9, top[1] - sn * (5 + j) + c * i * 0.9 * -1, i === 0 ? RP.ouro : fogo ? RP.pano : RP.ouro, i === 0 ? 4.6 : 3.2 - i * 0.2);
};
const cache = {};
const pose = (n, fn) => () => cache[n] || (cache[n] = fn());
const crown = (P, bx, by) => { for (const [x, y] of [[2, -1], [1, -2], [9, -1], [10, -2], [5, -1], [6, -2]]) P.put(bx + x, by + y, RP.chifre, 3.6); };
const ESP = o => set(man(kitG(), Object.assign({ behind: (P, bx, by) => { wings(o.wk || 0)(P, bx, by); crown(P, bx, by); } }, o)));
const SW = (legs, far, near, ang, extra) => ESP(Object.assign({ legs, far: [[1.4, 3.2], [2.6, 5.8]], near, nearItem: (P, h) => espada(P, h, ang, 12, RP.aco, RP.ouro) }, extra || {}));
const AL = (legs, near, ang, extra) => ESP(Object.assign({ legs, far: [[2.4, 2], [4.4, 2.6]], near, nearItem: (P, h) => alabarda(P, h, ang, false) }, extra || {}));
Object.assign(GENA, {
  esp: pose('esp', () => { const S = {}; for (const L of GUW.LEGK) S[L] = SW(L, null, [[2.4, 2.4], [4, 3.6]], 0.6); return S; }),
  windS: pose('windS', () => SW('wide', null, [[-1, -2], [-2, -4.6]], -2.2, { wk: 1 })),
  slashS: pose('slashS', () => SW('w0', null, [[3.6, 1.2], [7.4, 1.6]], 0.25, { lean: 2, wk: 1 })),
  lwind: pose('lwind', () => SW('idle', null, [[2.4, 2.4], [4.6, 2]], -0.1, { crouch: 4, wk: 1 })),
  lunge: pose('lunge', () => SW('w0', null, [[3.8, 0.6], [7.6, 0.4]], 0, { lean: 3, wk: 0 })),
  alab: pose('alab', () => { const S = {}; for (const L of GUW.LEGK) S[L] = AL(L, [[2.2, 2.2], [3.4, 2.6]], -1.35); return S; }),
  windA: pose('windA', () => AL('wide', [[-1.6, -1.4], [-3.2, -3]], -2.7, { wk: 1 })),
  sweepA: pose('sweepA', () => AL('w0', [[3.6, 1], [7, 1.2]], 0.1, { lean: 2, wk: 1 })),
  jump: pose('jump', () => SW('jump', null, [[1.4, -3], [2.4, -6.4]], -1.6, { wk: 1 })),
  roar: pose('roar', () => SW('wide', null, [[3, -2], [5.6, -4.6]], -0.9, { wk: 1, bob: -1 }))
});
}

/* ---------- desenho ---------- */
DRAW_E.general = (e, fx, fy, fl) => {
  const st = e.state, alab = genStd.st === 'caido' && e.ph === 2;
  let img;
  if (st === 'intro' || st === 'fase2' || st === 'fase3') img = GENA.roar();
  else if (st === 'wind') img = alab ? GENA.windA() : GENA.windS();
  else if (st === 'slash' || (st === 'recover' && e.stateT > 0.3 && e.last === 'slash')) img = alab ? GENA.sweepA() : GENA.slashS();
  else if (st === 'lwind') img = GENA.lwind();
  else if (st === 'lunge') img = GENA.lunge();
  else if (st === 'jwind' || st === 'air') img = GENA.jump();
  else { const L = GUW.legsOf(e, 6), S = alab ? GENA.alab() : GENA.esp(); img = S[L]; }
  GUART.guBlit(img, e, fx, fy, fl, st === 'wind' && e.stateT < 0.2 ? Math.round(Math.sin(e.t * 50) * 0.7) : 0);
};
EYES_E.general = (e, fx, fy) => { const a = WARN_E.general(e) ? 0.95 : 0.6; guOlhos(e, fx, fy, '#ffd070', a, 3, -18); if (e.state === 'intro') { lc.globalAlpha = 0.5; lc.drawImage(GUE.glw(GU_COL.ouro, 14), fx - 14, fy - 32); } };
WARN_E.general = e => e.state === 'wind' || e.state === 'lwind' || e.state === 'jwind';

// o estandarte no mundo: de pé no meio com as cordas, caído, ou fincado em fogo
const genSprite = {};
function genStdImg(kind) {
  if (genSprite[kind]) return genSprite[kind];
  const { painter, toCv, RP, tube, lin } = GUART, P = painter(40, 64), fogo = kind === 'fogo';
  // a haste, a trave, o pano largo com a asa de ouro bordada (no fogo: o pano preto queimando)
  P.line(20, 4, 20, 64, RP.madeira, 3.8, 2);
  P.line(8, 6, 32, 6, RP.madeira, 3.4, 1); P.put(7, 6, RP.ouro, 5); P.put(33, 6, RP.ouro, 4);
  for (let y = 0; y < 4; y++) { P.put(20, y, RP.ouro, 5 - y * 0.6); P.put(21, y, RP.ouro, 3.4 - y * 0.4); }
  for (let x = 9; x < 32; x++) {
    const len = 30 + Math.round(Math.sin(x * 0.7) * 2) - (x % 5 === 0 ? 3 : 0);
    for (let y = 7; y < len; y++) {
      const edge = x === 9 || x === 31 || y === 7;
      if (fogo && hash2(x, y, 5) < 0.08 + (y - 7) / 120) continue;
      P.put(x, y, edge ? RP.ouro : fogo ? RP.penaN : RP.pena, edge ? 4.6 : 3.2 - (x - 9) * 0.03 + Math.sin(x * 0.9 + y * 0.1) * 0.4);
    }
  }
  if (!fogo) { for (let j = 0; j < 8; j++) { P.put(13 + j, 20 - j * 0.6, RP.ouro, 4.6); P.put(13 + j, 21 - j * 0.3, RP.ouro, 3.4); P.put(27 - j * 0.4, 14 + j * 0.9, RP.ouro, 3.8); } P.mark('brilho', 16, 18); }
  else for (let x = 10; x < 31; x++) for (let k = 0; k < 2; k++) P.N(x, 30 - k + Math.round(Math.sin(x) * 1.5), k ? '#ffd070' : '#ff6a1a');
  P.done();
  return (genSprite[kind] = toCv(P));
}
HOOK.drawWorld.push((cx, cy) => {
  const B = genB(); if (!B || !GUERRA) return;
  const X = Math.round(genStdX() - cx), Y = Math.round(B.fy * T - cy);
  if (X < -120 || X > VW + 120 || Y < -80 || Y > VH + 80) return;
  const st = genStd.st;
  if (st === 'pe' || st === 'solto' || st === 'fogo') {
    let ang = 0;
    if (st === 'solto') ang = Math.sin(gameTime * 1.5) * 0.04;
    const img = genStdImg(st === 'fogo' ? 'fogo' : 'pe');
    lc.save(); lc.translate(X, Y); lc.rotate(ang + (genStd.fallT > 0 ? 0 : 0)); lc.drawImage(img, -20, -64); lc.restore();
    if (st === 'pe') {   // as cordas até as estacas
      lc.globalAlpha = 1; lc.fillStyle = '#786240';
      for (const E of genStd.estacas) { if (!E || E.dead) continue; const ex = Math.round(E.x + E.w / 2 - cx), ey = Math.round(E.y + 2 - cy), n = Math.max(6, Math.abs(ex - X)); for (let k = 0; k <= n; k += 2) { const t = k / n; lc.fillRect(Math.round(X + (ex - X) * t), Math.round(Y - 40 + (ey - (Y - 40)) * t + Math.sin(t * Math.PI) * 3), 1, 1); } }
    }
  } else if (st === 'tomba') {   // caindo: gira até deitar
    const q = clamp(genStd.fallT / 1.2, 0, 1), img = genStdImg('pe');
    lc.save(); lc.translate(X, Y); lc.rotate(-q * q * Math.PI / 2 * genStd.dir * -1); lc.drawImage(img, -20, -64); lc.restore();
  }
  // as estacas: o tronco curto fincado com o nó da corda
  for (const E of genStd.estacas) { if (!E || E.dead) continue; const ex = Math.round(E.x + E.w / 2 - cx), ey = Math.round(E.y + E.h - cy), fl = E.flash > 0; lc.fillStyle = fl ? '#ffffff' : '#2a1e12'; lc.fillRect(ex - 3, ey - 10, 6, 10); lc.fillStyle = fl ? '#ffffff' : '#64462a'; lc.fillRect(ex - 2, ey - 11, 3, 10); lc.fillStyle = fl ? '#ffffff' : '#927a52'; lc.fillRect(ex - 3, ey - 8, 6, 2); }
  const H = genStd.haste; if (H && !H.dead && H.flash > 0) { lc.globalAlpha = 0.7; lc.fillStyle = '#ffffff'; lc.fillRect(X - 2, Y - 18, 4, 18); lc.globalAlpha = 1; }
  // a carga: os cavaleiros espectrais
  const C = genFx.carga;
  if (C && C.run) {
    const x = Math.round(C.x - cx);
    for (let k = 0; k < 4; k++) {
      const hx = x - C.dir * k * 22, hy = Y - 1 + (k % 2), bob = Math.round(Math.sin(gameTime * 18 + k) * 1.2);
      lc.globalAlpha = 0.55 - k * 0.1; lc.fillStyle = '#c8d8e8';
      lc.fillRect(hx - 9, hy - 13 + bob, 18, 6); lc.fillRect(hx + C.dir * 7, hy - 19 + bob, 5, 8);   // o corpo do cavalo e o pescoço
      for (let l = 0; l < 4; l++) lc.fillRect(hx - 8 + l * 5 + (Math.floor(gameTime * 20 + l) % 2), hy - 7, 1, 7);   // as patas
      lc.fillStyle = '#e8f0ff'; lc.fillRect(hx - 2, hy - 24 + bob, 4, 11);   // o cavaleiro
      lc.fillRect(hx + C.dir * 2, hy - 30 + bob, 1, 18);   // a lança
    }
    lc.globalAlpha = 1;
  }
  // as fendas estourando
  for (const F of genFx.erupcoes) { const x = Math.round(F.x - cx), q = F.t / 0.5; lc.globalAlpha = 1 - q; for (let k = 0; k < 3 * T; k += 2) { lc.fillStyle = k < 8 ? '#fff0c0' : k < 20 ? '#ffb050' : '#e06010'; lc.fillRect(x - 3 + Math.round(Math.sin(k + gameTime * 30) * 1.5), Y - k - 1, 6 - (k >> 3), 2); } }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  const B = genB(); if (!B || !GUERRA) return;
  const X = Math.round(genStdX() - cx), Y = Math.round(B.fy * T - cy); if (X < -120 || X > VW + 120) return;
  if (genStd.st === 'pe' || genStd.st === 'solto') { lc.globalAlpha = 0.35 + 0.08 * Math.sin(gameTime * 1.3); lc.drawImage(GUE.glw(GU_COL.ouro, 30), X - 30, Y - 50); }
  if (genStd.st === 'fogo') { lc.globalAlpha = 0.5 + 0.12 * Math.sin(gameTime * 9); lc.drawImage(GUE.glw(GU_COL.brasa, 34), X - 34, Y - 54); }
  if (genFx.carga && genFx.carga.run) { lc.globalAlpha = 0.4; lc.drawImage(GUE.glw('#c8d8ff', 30), Math.round(genFx.carga.x - cx) - 30, Y - 40); }
  for (const F of genFx.erupcoes) { lc.globalAlpha = 0.6 * (1 - F.t / 0.5); lc.drawImage(GUE.glw(GU_COL.brasa, 18), Math.round(F.x - cx) - 18, Y - 30); }
  lc.globalAlpha = 1;
});
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  const B = genB(); if (!B || !GUERRA) return;
  if (genStd.st === 'pe' || genStd.st === 'solto') addL(genStdX(), B.fy * T - 40, 0.55); else if (genStd.st === 'fogo') addL(genStdX(), B.fy * T - 40, 0.7);
  if (genFx.carga && genFx.carga.run) addL(genFx.carga.x, B.fy * T - 16, 0.5);
  for (const F of genFx.erupcoes) addL(F.x, B.fy * T - 12, 0.5);
}; }

/* ---------- a luta ---------- */
const genFight = () => !!(bossFight && bossFight.gu);
const genIn = (m = 0) => { const B = genB(); if (!B) return false; const tx = Math.floor((pl.x + pl.w / 2) / T), ty = Math.floor((pl.y + pl.h / 2) / T); return Math.abs(wdx(tx - B.cx)) <= B.w / 2 - m && ty >= B.top - 1 && ty <= B.fy; };
function genSet(e, st, t) { e.state = st; e.stateT = t; }
function genStakes() {
  const B = genB(); genStd.estacas = [];
  for (const s of [-1, 1]) { const D = ET.gu_estaca, e = spawnEnemy('gu_estaca', (B.cx + s * 6) * T + 2, B.fy * T - D.h, -1); Object.assign(e, { hp: D.hp, maxHp: D.hp, dmg: 0, xp: 0, gold: 0, guMinion: true, guStd: true, facing: -s }); genStd.estacas.push(e); }
  const D = ET.gu_haste, h = spawnEnemy('gu_haste', B.cx * T + T / 2 - D.w / 2, B.fy * T - D.h, -1); Object.assign(h, { hp: D.hp, maxHp: D.hp, dmg: 0, xp: 0, gold: 0, guMinion: true, guStd: true }); genStd.haste = h;
}
function genStart() {
  const B = genB(); genDrops();
  const D = ET.general, e = spawnEnemy('general', (B.cx + 18) * T, B.fy * T - D.h, -1);
  Object.assign(e, { boss: true, lvl: GEN_L, hp: D.hp, maxHp: D.hp, dmg: D.dmg, xp: D.xp, gold: 0, ph: 1, cd: 1.4, cd2: 6, last: '' });
  e.facing = Math.sign(pl.x - e.x) || -1;
  genSet(e, 'intro', 1.4);
  genBoss = e;
  genStd.st = 'pe'; genStd.fallT = 0; genStakes();
  Object.assign(genFx, { carga: null, cargaT: GEN.carga2, ergueT: 4, fendaT: GEN.fenda }); genFx.fendas.length = 0; genFx.erupcoes.length = 0; genFx.minions.length = 0;
  bossFight = { e, gu: true };
  genDoors(true);
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = 'O General Caído'; bn.lastChild.textContent = 'o último comandante'; }
  $('bossbar').hidden = false; $('hud').classList.add('boss'); hudCache.bossFill = null;
  showBanner('O General Caído', 'o estandarte ainda está de pé');
  sfx.genCorneta(1); shake(3);
}
function genClear() {
  for (const m of genFx.minions) if (m && !m.dead) { m.dead = true; m.despawn = true; }
  for (const E of genStd.estacas) if (E && !E.dead) { E.dead = true; E.despawn = true; }
  if (genStd.haste && !genStd.haste.dead) { genStd.haste.dead = true; genStd.haste.despawn = true; }
  genStd.estacas = []; genStd.haste = null; genFx.minions.length = 0; genFx.carga = null; genFx.fendas.length = 0; genFx.erupcoes.length = 0;
}
function genEnd(won) {
  const e = genBoss; genBoss = null; bossFight = null;
  $('bossbar').hidden = true; $('hud').classList.remove('boss');
  const bn = document.querySelector('#bossbar .bn'); if (bn) { bn.firstChild.textContent = ''; bn.lastChild.textContent = ''; }
  genClear(); genDoors(false);
  if (!won) { if (e && !e.dead) { e.dead = true; e.despawn = true; } genStd.st = 'pe'; return; }
  genState.dead = true; genStd.st = 'caido';
  const x = e ? e.x + e.w / 2 : genStdX(), y = e ? e.y + e.h / 2 : genB().fy * T - 20;
  burst(x, y, 40, GU_COL.ouro, 150, 60, 1.2, 1, true); burst(x, y, 30, '#2a1a1e', 110, 120, 1.4);
  const bases = GEN_BASES.filter(id => ITEMS[id]);
  if (bases.length) dropGear(x, y - 10, bases[(Math.random() * bases.length) | 0], lootZone(Math.floor(x / T), Math.floor(y / T)));
  sfx.genMorte();
  showBanner('Vitória', 'o estandarte não se ergue mais');
  saveGame();
}
{ const _eb = endBossFight; endBossFight = function (won) { if (bossFight && bossFight.gu) return genEnd(won); return _eb(won); }; }

// o estandarte cai (o pé da haste quebrou): ele vem buscar
function genStdCai() {
  genStd.st = 'tomba'; genStd.fallT = 0; genStd.dir = genBoss && genBoss.x > genStdX() ? 1 : -1;
  GUE.sparks(genStdX(), genB().fy * T - 30, 20, GUE.LUZ, 90, 200, 0.8);
  sfx.genTomba(1); shake(3);
}
// a vida que cada fase deixa: com o estandarte de pé ele não passa de 60%
const genPiso = e => genStd.st === 'pe' || genStd.st === 'solto' || genStd.st === 'tomba' ? Math.floor(e.maxHp * GEN.piso1) : e.ph < 3 ? Math.floor(e.maxHp * (GEN.p3 - 0.01)) : 0;
{ const _k = killEnemy; killEnemy = function (e) {
  if (e && e.type === 'general' && !e.dead) { const f = genPiso(e); if (f > 0) { e.hp = f; return; } }
  if (e && e.guMinion) {   // os caídos levantados pelo estandarte, as estacas e a haste: sem XP e sem loot
    e.dead = true; const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    burst(cx, cy, 14, ET[e.type].blood || '#6a5a48', 90, 260, 0.6); GUE.sparks(cx, cy, 8, e.guStd ? GUE.LUZ : GUE.PO, 60, 100, 0.5);
    if (e.type === 'gu_estaca') { sfx.genCorda(1); if (genStd.estacas.every(E => E.dead)) genStd.st = 'solto'; }
    else if (e.type === 'gu_haste') genStdCai();
    else sfx.guMorre(0.6);
    return;
  }
  return _k(e);
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (!e || e.dead) return _hit(e, dir, mult, melee);
  if (e.type === 'general') {
    if (e.state === 'fase2' || e.state === 'fase3') { GUE.sparks(e.x + e.w / 2, e.y + 8, 4, GUE.LUZ, 40, 0, 0.3); return; }
    if (genStd.st === 'pe' || genStd.st === 'solto') { mult *= 0.3; GUE.sparks(e.x + e.w / 2, e.y + 10, 3, GUE.LUZ, 40, 0, 0.3); }   // o estandarte o protege
    const r = _hit(e, dir, mult, melee);
    if (!e.dead) { const f = genPiso(e); if (f > 0 && e.hp < f) e.hp = f; e.stun = 0; }
    return r;
  }
  if (e.type === 'gu_haste' && genStd.st === 'pe') { GUE.sparks(e.x + e.w / 2, e.y + 6, 4, GUE.LUZ, 40, 0, 0.3); sfx.block(); return; }   // presa pelas cordas: quebre as estacas
  return _hit(e, dir, mult, melee);
}; }

AI.general = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.cd -= dt; e.cd2 -= dt;
  const B = genB(), fy = B.fy * T, ecx = e.x + e.w / 2, pcx = pl.x + pl.w / 2;
  const alab = genStd.st === 'caido' && e.ph === 2;
  if (e.state === 'intro') { e.vx = 0; if (e.stateT <= 0) genSet(e, 'walk', 0); return; }
  if (e.state === 'fase2') {   // vai até o estandarte caído e o arranca
    const d = genStdX() - ecx; e.facing = Math.sign(d) || e.facing;
    if (Math.abs(d) > 10 && e.stateT > 0.6) { walk(e, dt, Math.sign(d), 90, 900, 300, 0, true); return; }
    e.vx = 0; if (genStd.st === 'tomba') { genStd.st = 'caido'; sfx.genCorneta(0.8); }
    if (e.stateT <= 0) { e.ph = 2; genSet(e, 'walk', 0); e.cd = 1; genFx.cargaT = 5; }
    return;
  }
  if (e.state === 'fase3') {   // finca o estandarte no meio, em fogo
    const d = genStdX() - ecx; e.facing = Math.sign(d) || e.facing;
    if (Math.abs(d) > 10 && e.stateT > 0.8) { walk(e, dt, Math.sign(d), 90, 900, 300, 0, true); return; }
    e.vx = 0; if (genStd.st !== 'fogo') { genStd.st = 'fogo'; GUE.sparks(genStdX(), fy - 20, 30, GUE.BRAS, 90, -40, 0.9); sfx.genFogo(1); shake(4); }
    if (e.stateT <= 0) { genSet(e, 'walk', 0); e.cd = 1; e.cd2 = 3; genFx.cargaT = Math.max(genFx.cargaT, 6); genFx.fendaT = 2; }
    return;
  }
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 800 * dt); if (e.stateT <= 0) { genSet(e, 'slash', 0.24); e.swingHit = false; e.last = 'slash'; e.vx = e.facing * 70; sfx.guCorte(1); } return; }
  if (e.state === 'slash') { const hb = alab ? { x: ecx - 36, y: e.y - 4, w: 72, h: e.h + 4 } : { x: e.facing > 0 ? ecx : ecx - 30, y: e.y, w: 30, h: e.h }; if (!e.swingHit && !pl.dead && overlap(hb, pl)) { e.swingHit = true; hurtPlayer(Math.round(e.dmg * (alab ? 1.2 : 1)), ecx, e, false); } e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) genSet(e, 'recover', 0.55); return; }
  if (e.state === 'lwind') { e.vx = 0; if (e.stateT <= 0) { genSet(e, 'lunge', 0.42); e.swingHit = false; e.last = 'lunge'; e.vx = e.facing * 300; sfx.genInveste(1); } return; }
  if (e.state === 'lunge') { if (!e.swingHit && !pl.dead && overlap({ x: e.x - 4, y: e.y, w: e.w + 8, h: e.h }, pl)) { e.swingHit = true; hurtPlayer(Math.round(e.dmg * 1.1), ecx, e, false); pl.vx += e.facing * 180; } if (e.hitWall) e.stateT = 0; if (e.stateT <= 0) { e.vx = 0; genSet(e, 'recover', 0.6); } return; }
  if (e.state === 'jwind') { e.vx = 0; if (e.stateT <= 0) { const top = GUE.teto(ecx, e.y, 14); e.jump = { x0: e.x, y0: e.y, tx: e.jTo - e.w / 2, H: Math.min(9 * T, Math.max(2 * T, e.y - top - 4)), t: 0 }; genSet(e, 'air', 1.0); sfx.genSalto(1); } return; }
  if (e.state === 'air') {   // o salto: um arco até onde a sombra estava
    const J = e.jump; J.t = Math.min(1, J.t + dt / 1.0);
    e.x = J.x0 + (J.tx - J.x0) * J.t; e.y = J.y0 - Math.sin(J.t * Math.PI) * J.H; e.vx = 0; e.vy = -GRAV * dt;
    if (J.t >= 1) {
      e.y = J.y0; const lx = e.x + e.w / 2;
      if (!pl.dead && Math.abs(pcx - lx) < 18 && pl.y + pl.h > fy - 3 * T) hurtPlayer(Math.round(e.dmg * 1.3), lx, e, false);
      GUE.onda(lx, fy, 1, e.dmg, 4 * T, 220, 2 * T, 'luz'); GUE.onda(lx, fy, -1, e.dmg, 4 * T, 220, 2 * T, 'luz');
      GUE.sparks(lx, fy - 2, 24, GUE.PO, 110, 300, 0.8); sfx.guImpacto(1); shake(6);
      genSet(e, 'recover', 0.8); e.last = 'land';
    }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { genSet(e, 'walk', 0); e.cd = Math.max(e.cd, 0.6 + Math.random() * 0.5); } return; }
  // andando: chega perto e escolhe o golpe
  e.state = 'walk';
  if (e.ph === 1 && (genStd.st === 'tomba' || genStd.st === 'caido')) { genSet(e, 'fase2', 2.2); sfx.genGrito(1); return; }
  if (e.ph === 2 && e.hp <= e.maxHp * GEN.p3 && genStd.st === 'caido') { e.ph = 3; genSet(e, 'fase3', 2.4); sfx.genGrito(1); return; }
  const mv = Math.abs(dx) > 22 ? Math.sign(dx) : 0;
  walk(e, dt, mv, 46 + (e.ph - 1) * 8, 700, 300, dy, true);
  e.facing = Math.sign(dx) || e.facing;
  if (e.cd > 0 || pl.dead || !e.onGround) return;
  if (e.ph === 3 && e.cd2 <= 0 && pl.onGround) {   // o Salto do Juízo: a sombra no chão debaixo do herói
    e.jTo = pcx; e.cd2 = 6 + Math.random() * 2; genSet(e, 'jwind', 1.0); GUE.marca(pcx, fy, 'sombra', 1.0, { w: 28 }); e.cd = 2; return;
  }
  if (Math.abs(dx) < (alab ? 40 : 30) && Math.abs(dy) < 30) { genSet(e, 'wind', alab ? 0.7 : 0.55); e.cd = 1.4; return; }
  if (Math.abs(dx) > 4 * T && Math.abs(dx) < 11 * T && Math.abs(dy) < 2 * T) { genSet(e, 'lwind', 0.7); GUE.marca(ecx + e.facing * 6, fy, 'racha', 0.7, { dir: e.facing, len: 6 * T }); e.cd = 2.2; sfx.genRosna(1); }
};

/* ---------- o que o Campo faz enquanto se luta: os caídos, a Carga, as fendas ---------- */
function genTick(dt) {
  const e = genBoss, B = genB(), fy = B.fy * T, pcx = pl.x + pl.w / 2;
  if (genStd.st === 'tomba') { genStd.fallT += dt; if (genStd.fallT > 1.2 && e && e.ph === 1 && e.state !== 'fase2') { /* fica deitado até ele vir */ } }
  // 1. o estandarte levanta os caídos
  genFx.minions = genFx.minions.filter(m => m && !m.dead);
  if (genStd.st === 'pe' || genStd.st === 'solto') {
    genFx.ergueT -= dt;
    if (genFx.ergueT <= 0 && genFx.minions.length < 3) {
      genFx.ergueT = GEN.ergue;
      for (let k = 0; k < 10; k++) {
        const x = (B.cx + (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 38)) * T; if (Math.abs(x - pcx) < 4 * T) continue;
        const tx = Math.floor(x / T); if (solidAt(tx, B.fy - 1) || solidAt(tx, B.fy - 2) || !solidAt(tx, B.fy)) continue;
        GUE.marca(x, fy, 'luz', 1.2, { onEnd: true }); genFx.fendas.push({ kind: 'ergue', x, t: 0 }); sfx.genErgue(1); break;
      }
    }
  }
  // 2. A Carga
  if (e && e.ph >= 2 && genStd.st !== 'pe') {
    genFx.cargaT -= dt;
    if (genFx.cargaT <= 0 && !genFx.carga) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      genFx.carga = { dir, t: 0, run: false, x: (B.cx - dir * 50) * T, hit: false };
      for (let x = B.cx - 49; x < B.cx + 49; x += 5) GUE.marca(x * T, fy, 'casco', 1.6, { w: 4 });
      sfx.genCorneta(1);
    }
  }
  const C = genFx.carga;
  if (C) {
    C.t += dt;
    if (!C.run && C.t >= 1.6) { C.run = true; sfx.genCascos(1); }
    if (C.run) {
      C.x += C.dir * 300 * dt;
      if (Math.random() < dt * 40) GUE.fx.length < 400 && GUE.fx.push({ x: C.x - C.dir * rnd(0, 60), y: fy - 1, vx: rnd(-20, 20), vy: -rnd(20, 60), g: 200, life: 0.6, max: 0.6, col: GUE.PO[(Math.random() * 3) | 0], size: 1 });
      if (!C.hit && !pl.dead && Math.abs(C.x - pcx) < 14 && pl.y + pl.h > fy - 2 * T - 1) { C.hit = true; hurtPlayer(Math.round((e ? e.dmg : GEN.dmg) * 1.4), C.x - C.dir * 10, null, true); pl.vx += C.dir * 260; pl.vy = Math.min(pl.vy, -160); }
      if ((C.dir > 0 && C.x > (B.cx + 52) * T) || (C.dir < 0 && C.x < (B.cx - 52) * T)) { genFx.carga = null; genFx.cargaT = e && e.ph === 3 ? GEN.carga3 : GEN.carga2; }
    }
  }
  // 3. as fendas (fase 3): três linhas acesas, uma debaixo do herói
  if (e && e.ph === 3 && genStd.st === 'fogo') {
    genFx.fendaT -= dt;
    if (genFx.fendaT <= 0) {
      genFx.fendaT = GEN.fenda;
      const xs = [pcx, pcx + rnd(5, 12) * T * (Math.random() < 0.5 ? 1 : -1), (B.cx + rnd(-45, 45)) * T];
      for (const x of xs) { const tx = Math.floor(x / T); if (Math.abs(tx - B.cx) > 48 || !solidAt(tx, B.fy)) continue; GUE.marca(x, fy, 'fenda', 1.0); genFx.fendas.push({ kind: 'fenda', x, t: 0 }); }
      sfx.genRacha(1);
    }
  }
  for (let i = genFx.fendas.length - 1; i >= 0; i--) {
    const F = genFx.fendas[i]; F.t += dt;
    if (F.kind === 'fenda' && F.t >= 1.0) {
      genFx.fendas.splice(i, 1); genFx.erupcoes.push({ x: F.x, t: 0 });
      if (!pl.dead && Math.abs(pcx - F.x) < 9 && pl.y + pl.h > fy - 3 * T) hurtPlayer(Math.round((e ? e.dmg : GEN.dmg) * 1.1), F.x, null, true);
      GUE.sparks(F.x, fy - 4, 14, GUE.BRAS, 70, -60, 0.7); sfx.genEstoura(GUE.near(F.x, fy));
    } else if (F.kind === 'ergue' && F.t >= 1.2) {
      genFx.fendas.splice(i, 1);
      if (genStd.st !== 'pe' && genStd.st !== 'solto') continue;
      const type = Math.random() < 0.6 ? 'gu_cavaleiro' : 'gu_arqueiro', D = ET[type];
      const m = spawnEnemy(type, F.x - D.w / 2, fy - D.h, -1);
      if (m && !m.dead) { m.guMinion = true; m.xp = 0; m.gold = 0; m.state = 'walk'; m.atkCD = 1; m.memT = 4; genFx.minions.push(m); GUE.sparks(F.x, fy - 12, 16, GUE.LUZ, 60, -40, 0.7); }
    }
  }
  for (let i = genFx.erupcoes.length - 1; i >= 0; i--) { genFx.erupcoes[i].t += dt; if (genFx.erupcoes[i].t > 0.5) genFx.erupcoes.splice(i, 1); }
}
HOOK.update.push(dt => {
  if (!GUERRA || state !== 'play' || !pl) return;
  const B = genB(); if (!B) return;
  if (!genFight()) {
    if (!genState.dead && !pl.dead && genIn(4)) genStart();
    return;
  }
  if (pl.dead || !genIn(-1)) { endBossFight(false); return; }
  genTick(dt);
});

/* ---------- A Lança do General ---------- */
STAT_DEF.lgGeneral = { t: '+6% de dano para cada inimigo a até 5 blocos de você (até +30%)', flag: 1 };
STAT_KEYS.push('lgGeneral');
ITEMS.lanca_general = {
  name: 'A Lança do General', slot: 'weapon', kind: 'spear', rar: 4,
  pal: { w: '#fff4c0', W: '#f0d070', l: '#8a6a20', g: '#24222a', G: '#100c10', h: '#4a1012', p: '#c8a040' },
  legend: [['lgGeneral', 1], ['crit', 0.05], ['dmgPct', 0.1]],
  desc: 'A haste do último estandarte dos anjos, com a lâmina que o General pôs na ponta quando caiu. Quanto mais gente em volta, mais ela lembra da guerra.'
};
BASE_INFO.lanca_general = [GEN_L, 0.94];
ITEM_G.lanca_general = 1; ITEMS.lanca_general.g = 1;
genDrops();
{ const _rc = recalc; recalc = function () {
  const r = _rc.apply(this, arguments); let b = 0;
  for (const k of EQ_SLOTS) if (equip[k]) b += itemStats(equip[k]).lgGeneral || 0;
  if (!pl.lg) pl.lg = {}; pl.lg.general = b > 0;
  return r;
}; }
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead && pl.lg && pl.lg.general) {
    const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2; let n = 0;
    for (const o of enemies) if (!o.dead && Math.hypot(o.x + o.w / 2 - pcx, o.y + o.h / 2 - pcy) < 5 * T) n++;
    mult *= 1 + Math.min(0.3, 0.06 * n);
  }
  return _hit(e, dir, mult, melee);
}; }

/* ---------- som ---------- */
Object.assign(sfx, {
  genCorneta(v = 1) { tone(196, 0.9, 'sawtooth', 0.035 * v, 0); tone(294, 0.7, 'sawtooth', 0.025 * v, 0, 0.35); tone(392, 1.1, 'sawtooth', 0.03 * v, -8, 0.7); noise(1.6, 0.03 * v, 600, 'bandpass', 0, 1); },
  genCascos(v = 1) { for (let k = 0; k < 18; k++) { tone(60 + (k % 3) * 8, 0.08, 'sine', 0.05 * v, -20, k * 0.09); noise(0.06, 0.04 * v, 300, 'lowpass', k * 0.09); } noise(1.8, 0.05 * v, 900, 'bandpass', 0, 0.6); },
  genGrito(v = 1) { tone(110, 1.2, 'sawtooth', 0.05 * v, -30); tone(165, 1, 'sawtooth', 0.03 * v, -40, 0.05); noise(1.2, 0.08 * v, 500, 'bandpass', 0, 0.8); },
  genRosna(v = 1) { tone(90, 0.5, 'sawtooth', 0.03 * v, 20); noise(0.5, 0.04 * v, 400, 'lowpass'); },
  genInveste(v = 1) { noise(0.35, 0.1 * v, 1200, 'bandpass', 0, 0.8); tone(140, 0.3, 'square', 0.03 * v, -60); },
  genSalto(v = 1) { noise(0.4, 0.08 * v, 300, 'lowpass'); tone(200, 0.6, 'sine', 0.02 * v, 400); },
  genErgue(v = 1) { for (let k = 0; k < 3; k++) tone(523 * (1 + k * 0.5), 1.0, 'sine', 0.008 * v, 0, k * 0.15); noise(1.2, 0.02 * v, 3000, 'bandpass', 0, 2); },
  genCorda(v = 1) { tone(220, 0.25, 'triangle', 0.03 * v, -150); noise(0.15, 0.06 * v, 1800, 'bandpass', 0, 2); },
  genTomba(v = 1) { noise(1.0, 0.1 * v, 400, 'lowpass'); tone(70, 1.0, 'sine', 0.08 * v, -20, 0.6); noise(0.3, 0.12 * v, 900, 'bandpass', 1.1, 1); },
  genFogo(v = 1) { noise(1.6, 0.12 * v, 700, 'bandpass', 0, 0.5); noise(1.4, 0.06 * v, 2600, 'highpass', 0.1); tone(55, 1.6, 'sawtooth', 0.04 * v, -10); },
  genRacha(v = 1) { for (let k = 0; k < 5; k++) noise(0.06, 0.06 * v, 1500 + k * 300, 'bandpass', k * 0.15, 4); tone(80, 0.9, 'sawtooth', 0.02 * v, 30); },
  genEstoura(v = 1) { noise(0.4, 0.12 * v, 900, 'bandpass', 0, 0.7); tone(60, 0.3, 'sine', 0.06 * v, -20); },
  genMorte() { tone(130, 3, 'sawtooth', 0.05, -60); tone(196, 2.4, 'sawtooth', 0.03, -80, 0.4); noise(3, 0.1, 400, 'bandpass', 0, 0.6); for (let k = 0; k < 8; k++) tone(1200 + k * 200, 0.3, 'sine', 0.01, -200, 1 + k * 0.15); }
});

/* ---------- save ---------- */
{ const _mk = makeSave; makeSave = function () {
  const o = _mk(); o.generalCaido = { dead: genState.dead };
  if (o && Array.isArray(o.diffs)) o.diffs = o.diffs.filter(([, t]) => t !== GU_BARREIRA);   // a muralha nunca vai para o save
  return o;
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  if (bossFight && bossFight.gu) bossFight = null;
  genBoss = null; genClear(); genStd.st = 'pe';
  genState.dead = !!(sv && sv.generalCaido && sv.generalCaido.dead);   // antes da geração: guDress lê
  return _nw(sd, sv);
}; }
