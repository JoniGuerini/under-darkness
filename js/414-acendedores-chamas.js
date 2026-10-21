'use strict';

/* ================= As Ruínas dos Acendedores: o que o fogo virou (docs/camadas/19-ruinas-acendedores.md, seção 6) =================
   Os outros cinco bichos da camada (os loucos estão no 413, que guarda as peças comuns em ACM). Nenhum machuca no
   toque: todo golpe tem aviso.
   - o Enxame de Fagulhas (fagulhas), enxame. Um bolo de fagulhas soltas que atravessa a pedra. Antes do bote o bolo se
     aperta num nó branco (0,8 s) e então corre numa linha reta pelo herói, deixando um rastro;
   - o Braseiro Faminto (faminto), emboscada. Fica parado igual a um braseiro frio. Com o herói perto as brasas acendem
     por baixo da cinza (0,7 s) e ele morde ou salta em cima. Depois de acordado anda pulando nas três pernas;
   - o Forno Andante (fornoandante), pesado. Um forno de tijolo e ferro andando. A porta da barriga abre e o fogo de dentro
     clareia (1 s) antes do cone de chamas na frente; ou ergue um pé (0,8 s) e pisa, e uma onda de cinza corre pelo chão
     dos dois lados (pular passa por cima);
   - o Círio Vivo (círio), lento. Uma vela do tamanho de um homem, o pavio aceso no lugar da cabeça. Por onde anda deixa
     poças de cera que prendem o passo; a chama do pavio cresce (0,8 s) e ele sacode três bolas de cera fervendo;
   - o Enforcado do Pavio (pavio), do teto. Pendurado por um pavio grosso, balançando. Quando o herói passa embaixo, o laço
     de pavio aceso desce brilhando (0,8 s) até a altura dele; quem ainda estiver no laço é puxado para cima e queima. */

Object.assign(ET, {
  fagulhas: { name: 'Enxame de Fagulhas', w: 12, h: 12, hp: 34, dmg: 11, xp: 18, kb: 1.2, fly: true, phase: true, blood: '#f6962a' },
  faminto: { name: 'Braseiro Faminto', w: 12, h: 12, hp: 78, dmg: 19, xp: 24, kb: 0.6, fly: false, blood: '#a4380a' },
  fornoandante: { name: 'Forno Andante', w: 18, h: 26, hp: 230, dmg: 24, xp: 34, kb: 0.15, fly: false, blood: '#5a2a1c' },
  cirio: { name: 'Círio Vivo', w: 10, h: 22, hp: 88, dmg: 15, xp: 24, kb: 0.6, fly: false, blood: '#e8d6a6' },
  pavio: { name: 'Enforcado do Pavio', w: 10, h: 18, hp: 62, dmg: 14, xp: 22, kb: 0.5, fly: true, blood: '#5a2a1a' }
});
const AC2_TYPES = ['fagulhas', 'faminto', 'fornoandante', 'cirio', 'pavio'];
const AC2_DROPS = {
  fagulhas: [['brasa_viva', 0.3], ['min_ardorita', 0.05]],
  faminto: [['brasa_viva', 0.5, 1, 2], ['min_ardorita', 0.1], ['pocao', 0.06], ['aticador', 0.012]],
  fornoandante: [['brasa_viva', 0.6, 1, 3], ['min_ardorita', 0.22, 1, 2], ['pocao', 0.12], ['botas_brasa', 0.02]],
  cirio: [['cera_acendedor', 0.6, 1, 3], ['pavio_eterno', 0.2], ['min_ardorita', 0.07], ['pocao', 0.07], ['capuz_cinza', 0.012]],
  pavio: [['pavio_eterno', 0.45, 1, 2], ['min_ardorita', 0.07], ['pocao', 0.06]]
};
function ac2Tables() { for (const k of AC2_TYPES) DROPS[k] = AC2_DROPS[k].filter(([id]) => ITEMS[id]); }
ac2Tables();
Object.assign(NAV_WALKERS, { fornoandante: 1, cirio: 1, faminto: 1 });
Object.assign(CV_STEP, { fornoandante: 1, cirio: 1 });

const AC_NO = 0.8, AC_BRASAS = 0.7, AC_PORTA = 1, AC_PE = 0.8, AC_CHAMA = 0.8, AC_LACO = 0.8;

/* ================= arte ================= */
const AC2 = {};
{
const { TR, ell, tubo, poly, perna, braco, setO, cp, cg } = ACM;
// o Braseiro Faminto: a bacia de bronze com cinza em cima, as três pernas de ferro. 0 dormindo (igual a um braseiro
// frio), 1 as brasas acendendo, 2-3 pulando (as pernas abertas), 4 mordendo (a bacia aberta, os dentes de ferro)
const FB = 9, FF = 13;
function faminto(k) {
  const P = cp(18, 14), s = 41401 + k * 7, open = k === 4, hop = k === 2 || k === 3, hot = k > 0;
  // as pernas
  const sp = hop ? (k === 2 ? 3 : 1.6) : 0;
  for (const [x0, x1, b] of [[FB - 3, FB - 5 - sp, 2], [FB, FB + (k === 3 ? 1 : 0), 1.4], [FB + 3, FB + 5 + sp, 3]]) { P.line(x0, FF - 5, (x0 + x1) / 2 + (hop ? 0 : 0.4), FF - 2.6 - (hop ? 1.4 : 0), TR.ferro, b + 0.6); P.line((x0 + x1) / 2, FF - 2.6 - (hop ? 1.4 : 0), x1, FF, TR.ferro, b); }
  // a bacia
  poly(P, [[FB - 5.4, FF - 9 + (open ? 1 : 0)], [FB + 5.4, FF - 9 - (open ? 2 : 0)], [FB + 3.6, FF - 4.6], [FB - 3.6, FF - 4.6]], TR.bronze, (x, y) => 2.4 + (y - (FF - 9)) * -0.2 + (x < FB ? 0.6 : 0) + cg(x, y, s) * 0.5);
  for (let x = FB - 5; x <= FB + 5; x++) P.put(x, FF - 9 + (open ? (x - FB) * -0.27 : 0), TR.bronze, 4.6);
  // a cinza e as brasas por cima (no bote: a boca aberta, os dentes)
  if (open) { for (let x = FB - 4; x <= FB + 4; x++) { P.put(x, FF - 10 + (x - FB) * -0.3, TR.brasa, 5 - Math.abs(x - FB) * 0.3); if (x % 2 === 0) P.put(x, FF - 11 + (x - FB) * -0.32, TR.ferro, 4); } }
  else for (let x = FB - 4; x <= FB + 4; x++) { P.put(x, FF - 10, hot && hash2(x, 1, s) < 0.6 ? TR.brasa : TR.ferro, hot ? 3.4 + hash2(x, 2, s) * 2 : 2 + hash2(x, 2, s) * 1.4); if (Math.abs(x - FB) < 3) P.put(x, FF - 11, hot && hash2(x, 3, s) < 0.4 ? TR.brasa : TR.ferro, hot ? 4.4 : 2.6); }
  return setO(P.done());
}
// o Forno Andante: o corpo de tijolo, as cintas de ferro, a porta da barriga, a chaminé por cabeça, as pernas curtas de
// ferro. 0 parado, 1-2 andando, 3 a porta aberta (o aviso do cone), 4 o pé erguido (o aviso da pisada), 5 pisando
const OB = 14, OF = 31;
function forno(k) {
  const P = cp(30, 32), s = 41421 + k * 7, st = k === 1 ? 1.4 : k === 2 ? -1.4 : 0, lift = k === 4, door = k === 3;
  // as pernas
  perna(P, OB - 4, OF - 7, OB - 5 - st, OF - (lift ? 0 : 0), TR.ferro, 1.8, s, 2, 0.8);
  perna(P, OB + 4, OF - 7, OB + 5 + st, lift ? OF - 5 : OF, TR.ferro, 2.8, s + 1, 2, 0.8);
  // o corpo: um barril de tijolo
  const y0 = OF - 25, y1 = OF - 6;
  for (let y = y0; y <= y1; y++) {
    const u = (y - y0) / (y1 - y0), half = 7 + Math.sin(u * Math.PI) * 1.6;
    for (let x = Math.round(OB - half); x <= OB + half; x++) {
      const row = Math.floor((y - y0) / 3), mortar = (y - y0) % 3 === 2 || (x + (row % 2) * 2) % 5 === 0;
      P.put(x, y, mortar ? TR.manto : TR.tijolo, (mortar ? 2 : 2.6) + (OB - x) / half * 0.9 - u * 0.4 + cg(x, y, s) * 0.5);
    }
  }
  for (const yy of [y0 + 2, y1 - 1]) for (let x = OB - 8; x <= OB + 8; x++) P.put(x, yy, TR.ferro, 3 + (x < OB ? 0.8 : 0));
  // a porta da barriga: fechada (ferro com rebites) ou aberta (o fogo dentro)
  const dx0 = OB - 3, dx1 = OB + 4, dy0 = OF - 18, dy1 = OF - 10;
  for (let y = dy0; y <= dy1; y++) for (let x = dx0; x <= dx1; x++) {
    if (door) P.put(x, y, TR.brasa, 5 - Math.abs(x - OB - 0.5) * 0.3 - Math.abs(y - (dy0 + dy1) / 2) * 0.3 + cg(x, y, s) * 0.6);
    else P.put(x, y, TR.ferro, 2.4 + (x === dx0 || y === dy0 ? 1.4 : 0) + ((x === dx0 + 1 || x === dx1 - 1) && (y === dy0 + 1 || y === dy1 - 1) ? 2 : 0));
  }
  if (door) for (let y = dy0; y <= dy1; y++) P.put(dx1 + 1.6, y, TR.ferro, 3.4);   // a porta aberta, de lado
  // a chaminé: a cabeça, com os dois olhos de brasa
  for (let y = y0 - 6; y < y0; y++) for (let x = OB - 3; x <= OB + 3; x++) P.put(x, y, TR.ferro, 2.4 + (x < OB ? 0.8 : 0) + (y === y0 - 6 ? 1.4 : 0) + cg(x, y, s) * 0.4);
  P.put(OB + 1, y0 - 3, TR.brasa, 5); P.put(OB + 2.6, y0 - 3, TR.brasa, 4);
  // os braços de ferro curtos
  braco(P, OB - 7, y0 + 4, OB - 9, y0 + 12, TR.ferro, 2, s + 3, 1.6, 1.8);
  braco(P, OB + 7, y0 + 4, OB + 9 + (door ? 2 : 0), y0 + (door ? 8 : 12), TR.ferro, 3, s + 4, 1.6, 1.8);
  return setO(P.done());
}
// o Círio Vivo: a vela grossa de cera com os pingos, os braços de cera derretida, o pavio aceso no lugar da cabeça
// (a chama vem no desenho). 0 parado, 1-2 andando, 3 sacudindo
const CB = 8, CF = 25;
function cirio(k) {
  const P = cp(18, 26), s = 41441 + k * 7, st = k === 1 ? 1 : k === 2 ? -1 : 0, shake = k === 3;
  for (let y = CF - 19; y <= CF; y++) {
    const u = (y - (CF - 19)) / 19, half = 3.6 + u * 1.4 + (y > CF - 2 ? 0.8 : 0);
    for (let x = Math.round(CB - half); x <= CB + half; x++) P.put(x + (y > CF - 3 ? st * (x > CB ? 0.4 : -0.4) : 0), y, TR.cera, 2.6 + (CB - x) / half * 1.2 + cg(x, y, s) * 0.4 + (u < 0.06 ? 1 : 0));
  }
  // os pingos escorridos pelo corpo
  for (let i = 0; i < 6; i++) { const x = CB - 3 + hash2(i, 1, s) * 7, y0 = CF - 19 + hash2(i, 2, s) * 4, L = 3 + hash2(i, 3, s) * 6; for (let y = y0; y < y0 + L; y++) P.put(x, y, TR.cera, 4.6); P.put(x, y0 + L, TR.cera, 5); }
  // o rosto afundado na cera
  P.put(CB + 1.6, CF - 16, TR.bronze, 1); P.put(CB + 3, CF - 16, TR.bronze, 1); P.line(CB + 1.6, CF - 13.6, CB + 3, CF - 13.4, TR.bronze, 1.4);
  // o pavio
  P.line(CB + 0.5, CF - 19, CB + 0.5, CF - 22, TR.manto, 1.4);
  // os braços de cera
  braco(P, CB - 3.4, CF - 15, shake ? CB - 6 : CB - 5, shake ? CF - 20 : CF - 9, TR.cera, 2.2, s + 2, 1.3, 1.4);
  braco(P, CB + 3.6, CF - 15, shake ? CB + 8 : CB + 5, shake ? CF - 21 : CF - 9, TR.cera, 3.4, s + 3, 1.3, 1.4);
  return setO(P.done());
}
// o Enforcado do Pavio: um Acendedor pendurado pelo pescoço, as mãos amarradas, o manto rasgado. 0-1 balançando, 2 acordado
// (a cabeça erguida, os olhos acesos)
const PB = 7, PT = 1;
function enforcado(k) {
  const P = cp(16, 22), s = 41461 + k * 7, woke = k === 2, sw = k === 1 ? 0.6 : 0;
  // o manto de fuligem pendurado
  poly(P, [[PB - 3, PT + 6], [PB + 3, PT + 6], [PB + 4 + sw, PT + 18], [PB - 4 + sw, PT + 18]], TR.manto, (x, y) => 2.4 + (Math.abs(Math.sin(x * 1.6)) < 0.25 ? -0.8 : 0) + cg(x, y, s) * 0.4);
  for (let x = PB - 4; x <= PB + 4; x++) if (hash2(x, 1, s) < 0.6) P.put(x + sw, PT + 18 + (hash2(x, 2, s) < 0.4 ? 1 : 0), TR.barra, 2.4);
  // os pés pendurados
  P.line(PB - 1 + sw, PT + 18, PB - 1.4 + sw, PT + 20.4, TR.pele, 2); P.line(PB + 1 + sw, PT + 18, PB + 1.2 + sw, PT + 20.6, TR.pele, 3);
  // a cabeça caída de lado (acordado: erguida)
  const hx = PB + (woke ? 0.6 : 1.6), hy = PT + 3.4 + (woke ? -0.4 : 0.6);
  ell(P, hx, hy, 2.2, 2.6, woke ? 0 : 0.5, TR.pele, s + 2, 3, (u, v) => [TR.pele, u > 0.4 ? -1 : 0]);
  P.put(hx + 0.8, hy - 0.2, TR.brasa, woke ? 5 : 2); if (woke) P.put(hx - 0.6, hy - 0.2, TR.brasa, 4);
  // o laço no pescoço
  for (let x = PB - 2; x <= PB + 2; x++) P.put(x, PT + 5.6, TR.cera, 3.4);
  // as mãos amarradas na frente
  braco(P, PB - 2.6, PT + 7, PB + 0.4, PT + 12, TR.manto, 2, s + 3, 1, 1); braco(P, PB + 2.6, PT + 7, PB + 1, PT + 12, TR.manto, 3, s + 4, 1, 1);
  return setO(P.done());
}
AC2.get = () => AC2.ready || (AC2.ready = {
  fa: [0, 1, 2, 3, 4].map(faminto), fo: [0, 1, 2, 3, 4, 5].map(forno), ci: [0, 1, 2, 3].map(cirio), en: [0, 1, 2].map(enforcado)
});
Object.assign(AC2, { FB, FF, OB, OF, CB, CF, PB, PT });
}

/* ================= desenho ================= */
const ac2Walk = (e, n = 2, f = 7) => Math.abs(e.vx) > 4 && e.onGround ? 1 + Math.floor(e.t * f) % n : 0;
// o enxame: as fagulhas soltas em volta do centro (no aviso: apertadas num nó branco; no bote: um risco)
function ac2Fagulhas(e) {
  const n = 14, out = [], ecx = e.x + e.w / 2, ecy = e.y + e.h / 2, knot = e.state === 'knot' ? clamp(1 - e.stateT / AC_NO, 0, 1) : 0;
  for (let i = 0; i < n; i++) {
    const a = e.t * (2 + (i % 3)) + i * 2.4, r = (e.state === 'dash' ? 2 : 7 - knot * 5) * (0.5 + hash2(i, 1, e.seed | 0) * 0.6);
    const tl = e.state === 'dash' ? i * 1.6 : 0;
    out.push([ecx + Math.cos(a) * r - (e.vx || 0) * tl / 120, ecy + Math.sin(a * 1.3) * r * 0.8 - (e.vy || 0) * tl / 120, i]);
  }
  return out;
}
DRAW_E.fagulhas = (e, fx0, fy0) => {
  const cx = fx0 - (e.x + e.w / 2), cy = fy0 - (e.y + e.h), knot = e.state === 'knot';
  for (const [x, y, i] of ac2Fagulhas(e)) { lc.fillStyle = knot && i % 2 ? '#fff0c0' : i % 3 ? '#f6962a' : '#ffd070'; lc.fillRect(Math.round(x + cx), Math.round(y + cy), 1, 1); }
};
EYES_E.fagulhas = (e, fx0, fy0) => {
  const knot = e.state === 'knot', g = ACM.gl(knot ? 12 : 9, knot ? '#fff0c0' : '#ff9a3a');
  lc.globalAlpha = knot ? 0.6 + 0.3 * clamp(1 - e.stateT / AC_NO, 0, 1) : 0.45; lc.drawImage(g, Math.round(fx0) - g.width / 2, Math.round(fy0 - e.h / 2) - g.height / 2); lc.globalAlpha = 1;
};
WARN_E.fagulhas = e => e.state === 'knot';

DRAW_E.faminto = (e, fx0, fy0, fl) => {
  const k = e.state === 'sleep' ? 0 : e.state === 'wake' ? 1 : e.state === 'bite' ? 4 : !e.onGround ? 2 : Math.abs(e.vx) > 4 ? 2 + Math.floor(e.t * 8) % 2 : 1;
  ACM.blit(cvPick(AC2.get().fa[k], e, e.state === 'sleep' ? false : fl), e, fx0, fy0, AC2.FB + 1, AC2.FF + 1, ACM.jit(e, e.state === 'wake', 60));
};
EYES_E.faminto = (e, fx0, fy0) => { if (e.state === 'sleep') return; const g = ACM.gl(8, '#ff7a1a'); lc.globalAlpha = e.state === 'wake' ? 0.3 + 0.6 * clamp(1 - e.stateT / AC_BRASAS, 0, 1) : 0.5; lc.drawImage(g, Math.round(fx0) - 8, Math.round(fy0 - 11) - 8); lc.globalAlpha = 1; };
WARN_E.faminto = e => e.state === 'wake';

DRAW_E.fornoandante = (e, fx0, fy0, fl) => {
  const k = e.state === 'door' || e.state === 'flame' ? 3 : e.state === 'lift' ? 4 : e.state === 'stomp' ? 5 : ac2Walk(e, 2, 4);
  ACM.blit(cvPick(AC2.get().fo[k === 5 ? 0 : k], e, fl), e, fx0, fy0, AC2.OB + 1, AC2.OF + 1, ACM.jit(e, e.state === 'door' || e.state === 'lift', 40));
};
EYES_E.fornoandante = (e, fx0, fy0) => {
  const open = e.state === 'door' || e.state === 'flame', g = ACM.gl(open ? 16 : 6, '#ff7a1a');
  lc.globalAlpha = open ? 0.5 + 0.4 * (e.state === 'flame' ? 1 : clamp(1 - e.stateT / AC_PORTA, 0, 1)) : 0.5;
  lc.drawImage(g, Math.round(fx0 + 0.5 * e.facing) - g.width / 2, Math.round(fy0 - (open ? 15 : 29)) - g.height / 2); lc.globalAlpha = 1;
};
WARN_E.fornoandante = e => e.state === 'door' || e.state === 'lift';

DRAW_E.cirio = (e, fx0, fy0, fl) => ACM.blit(cvPick(AC2.get().ci[e.state === 'flare' ? 3 : ac2Walk(e, 2, 4)], e, fl), e, fx0, fy0, AC2.CB + 1, AC2.CF + 1);
// a chama do pavio: cresce no aviso
EYES_E.cirio = (e, fx0, fy0) => {
  const q = e.state === 'flare' ? clamp(1 - e.stateT / AC_CHAMA, 0, 1) : 0, x = Math.round(fx0 + 0.5 * e.facing), y = Math.round(fy0 - 23), h = 3 + q * 5 + Math.sin(e.t * 20) * 0.6;
  const g = ACM.gl(q > 0 ? 14 : 8, '#ffb050'); lc.globalAlpha = 0.5 + q * 0.4; lc.drawImage(g, x - g.width / 2, Math.round(y - h / 2) - g.height / 2); lc.globalAlpha = 1;
  lc.fillStyle = '#d86214'; lc.fillRect(x - 1, Math.round(y - h), 3, Math.round(h)); lc.fillStyle = '#ffd070'; lc.fillRect(x, Math.round(y - h + 1), 1, Math.round(h - 1)); lc.fillStyle = '#fff0c0'; lc.fillRect(x, y - 2, 1, 2);
};
WARN_E.cirio = e => e.state === 'flare';

// o enforcado: o pavio do teto até o pescoço (balançando); o laço que desce no aviso
DRAW_E.pavio = (e, fx0, fy0, fl) => {
  const cx = fx0 - (e.x + e.w / 2), cy = fy0 - (e.y + e.h), sw = Math.sin(e.t * 1.4 + e.seed) * 2;
  const ax = e.x + e.w / 2 + cx, ay = (e.ceilY !== undefined ? e.ceilY : e.y - 10) + cy;
  lc.fillStyle = '#3c332c'; for (let y = ay; y < e.y + 6 + cy; y++) lc.fillRect(Math.round(ax + sw * (y - ay) / Math.max(1, e.y + 6 + cy - ay)), Math.round(y), 1, 1);
  const k = e.state === 'noose' || e.state === 'hold' ? 2 : Math.floor(e.t * 1.2 + e.seed) % 2;
  ACM.blit(cvPick(AC2.get().en[k], e, fl), e, fx0 + Math.round(sw), fy0, AC2.PB + 1, AC2.PT + 21);
};
EYES_E.pavio = (e, fx0, fy0) => { if (e.state !== 'noose' && e.state !== 'hold') return; const g = ACM.gl(5, '#ff9a3a'); lc.globalAlpha = 0.7; lc.drawImage(g, Math.round(fx0 + 1) - 5, Math.round(fy0 - 18) - 5); lc.globalAlpha = 1; };
WARN_E.pavio = e => e.state === 'noose';

/* ================= comportamento ================= */
const ac2Ondas = [], ac2Cones = [];

/* ---------- o Enxame de Fagulhas ---------- */
AI.fagulhas = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'knot') { e.vx *= Math.pow(0.02, dt); e.vy *= Math.pow(0.02, dt); if (Math.random() < dt * 10) sfx.acChia(ACM.near(e) * 0.4); if (e.stateT <= 0) { const a = Math.atan2(e.ty - (e.y + e.h / 2), e.tx - (e.x + e.w / 2)); e.state = 'dash'; e.stateT = 0.55; e.vx = Math.cos(a) * 260; e.vy = Math.sin(a) * 260; e.hitThis = false; sfx.acRisco(Math.max(0.5, ACM.near(e))); } return; }
  if (e.state === 'dash') {
    if (Math.random() < dt * 60) ACM.sparks(e.x + e.w / 2, e.y + e.h / 2, 1, ACM.FOGO, 10, 0, 0.5);
    if (!e.hitThis && !pl.dead && overlap(e, pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, e.x + e.w / 2, e, false); if (r === 'hit') ACM.acQueima(Math.max(1, Math.round(e.dmg * 0.2)), 1.2); }
    if (e.stateT <= 0) { e.state = 'drift'; e.atkCD = 1.8 + Math.random(); e.vx *= 0.2; e.vy *= 0.2; }
    return;
  }
  e.state = 'drift';
  // em volta do herói, a uns 4 blocos, mudando de lado; sem herói, flutua perto de casa
  e.ang = (e.ang || Math.random() * 6) + dt * 1.3;
  const ox = aggro ? pl.x + pl.w / 2 : e.homeX, oy = aggro ? pl.y + pl.h / 2 - T : e.homeY;
  const tx = ox + Math.cos(e.ang) * 4 * T, ty = oy + Math.sin(e.ang * 1.6) * 2 * T;
  e.vx = approach(e.vx, clamp((tx - e.x - e.w / 2) * 2, -90, 90), 220 * dt); e.vy = approach(e.vy, clamp((ty - e.y - e.h / 2) * 2, -90, 90), 220 * dt);
  e.facing = Math.sign(e.vx) || e.facing;
  if (Math.random() < dt * 2) sfx.acCrepita(ACM.near(e) * 0.4);
  if (!aggro || e.atkCD > 0 || pl.dead) return;
  if (dist < 6 * T && dist > 2 * T) { e.state = 'knot'; e.stateT = AC_NO; e.tx = pl.x + pl.w / 2; e.ty = pl.y + pl.h / 2; sfx.acAperta(Math.max(0.4, ACM.near(e))); }
};

/* ---------- o Braseiro Faminto ---------- */
AI.faminto = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'sleep') { e.vx = 0; if (!pl.dead && dist < 3.4 * T && Math.abs(dy) < 2 * T && e.atkCD <= 0) { e.state = 'wake'; e.stateT = AC_BRASAS; sfx.acBrasas(Math.max(0.4, ACM.near(e))); } return; }
  if (e.state === 'wake') {   // as brasas acendem por baixo da cinza
    e.vx = 0; e.facing = Math.sign(dx) || e.facing;
    if (Math.random() < dt * 20) ACM.sparks(e.x + e.w / 2 + rnd(-4, 4), e.y + 2, 1, ACM.FOGO, 8, -40, 0.5);
    if (e.stateT <= 0) {
      if (dist < 1.8 * T) { e.state = 'bite'; e.stateT = 0.35; e.hitThis = false; sfx.acMordida(Math.max(0.5, ACM.near(e))); }
      else { e.state = 'leap'; e.stateT = 0.8; e.hitThis = false; e.vx = e.facing * clamp(Math.abs(dx) * 1.6, 80, 170); e.vy = -230; sfx.acPulo(Math.max(0.5, ACM.near(e))); }
    }
    return;
  }
  if (e.state === 'bite' || e.state === 'leap') {
    const ecx = e.x + e.w / 2, hb = e.state === 'bite' ? { x: e.facing > 0 ? ecx : ecx - 18, y: e.y - 4, w: 18, h: e.h + 4 } : { x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 4 };
    if (e.state === 'bite') e.vx = approach(e.vx, 0, 600 * dt);
    if (!e.hitThis && !pl.dead && overlap(hb, pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') ACM.acQueima(Math.max(1, Math.round(e.dmg * 0.15)), 1); }
    if ((e.state === 'bite' && e.stateT <= 0) || (e.state === 'leap' && e.onGround && e.stateT < 0.6)) { e.state = 'walk'; e.atkCD = 1.4 + Math.random() * 0.6; e.vx = 0; ACM.ash(ecx, e.y + e.h, 4); }
    return;
  }
  e.state = 'walk';
  // acordado: pula atrás do herói; longe e sem ver ninguém, volta a dormir no lugar
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 10 ? 0 : Math.sign(dx);
  else { e.idleT = (e.idleT || 0) + dt; if (e.idleT > 6 && e.onGround) { e.state = 'sleep'; e.idleT = 0; e.atkCD = 1; return; } }
  if (aggro) e.idleT = 0;
  e.hopT = (e.hopT || 0) - dt;
  if (dir && e.onGround && e.hopT <= 0) { e.hopT = 0.5; e.vy = -150; e.vx = dir * 70; sfx.acPulo(ACM.near(e) * 0.4); }
  if (e.onGround) e.vx = approach(e.vx, 0, 300 * dt);
  if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || pl.dead || !e.onGround) return;
  if (dist < 4 * T && Math.abs(dy) < 2 * T) { e.state = 'wake'; e.stateT = AC_BRASAS; e.vx = 0; sfx.acBrasas(Math.max(0.4, ACM.near(e))); }
};

/* ---------- o Forno Andante ---------- */
AI.fornoandante = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'door') {   // a porta abre, o fogo clareia
    e.vx = approach(e.vx, 0, 600 * dt);
    if (Math.random() < dt * 14) { const [x, y] = ACM.pt(e, AC2.OB + 1, AC2.OF - 14, AC2.OB, AC2.OF); ACM.sparks(x, y, 1, ACM.FOGO, 20, -30, 0.5); }
    if (e.stateT <= 0) { e.state = 'flame'; e.stateT = 0.7; e.hitThis = false; const [x, y] = ACM.pt(e, AC2.OB + 5, AC2.OF - 14, AC2.OB, AC2.OF); ac2Cones.push({ x, y, dir: e.facing, t: 0, L: 4 * T, dmg: e.dmg, owner: e, hit: false }); sfx.acChamas(Math.max(0.6, ACM.near(e, 320))); }
    return;
  }
  if (e.state === 'flame') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2.2 + Math.random(); } return; }
  if (e.state === 'lift') {   // o pé erguido
    e.vx = 0;
    if (e.stateT <= 0) {
      e.state = 'stomp'; e.stateT = 0.4; shake(3); sfx.acPisa(Math.max(0.6, ACM.near(e, 320)));
      const y = e.y + e.h; for (const d of [-1, 1]) ac2Ondas.push({ x: e.x + e.w / 2 + d * e.w / 2, y, dir: d, t: 0, dmg: e.dmg, hit: false });
      ACM.ash(e.x + e.w / 2, y, 14, 60);
    }
    return;
  }
  if (e.state === 'stomp') { if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.8 + Math.random(); } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 2 * T ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 26 : 12, 300, 200, dy, aggro);
  if (dir) e.facing = dir;
  e.stepT = (e.stepT || 0) - dt; if (Math.abs(e.vx) > 4 && e.onGround && e.stepT <= 0) { e.stepT = 0.5; sfx.acPasso(ACM.near(e) * 0.6); }
  if (!aggro || e.atkCD > 0 || pl.dead || !e.onGround) return;
  if (dist < 4 * T && Math.abs(dy) < 2 * T && Math.sign(dx) === e.facing && Math.random() < 0.6) { e.state = 'door'; e.stateT = AC_PORTA; e.vx = 0; sfx.acPorta(Math.max(0.5, ACM.near(e))); }
  else if (dist < 7 * T && Math.abs(dy) < 2 * T) { e.state = 'lift'; e.stateT = AC_PE; e.vx = 0; sfx.acRange(Math.max(0.5, ACM.near(e))); }
};

/* ---------- o Círio Vivo ---------- */
AI.cirio = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'flare') {
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT <= 0) {
      e.state = 'walk'; e.atkCD = 2.4 + Math.random();
      const [x, y] = ACM.pt(e, AC2.CB, AC2.CF - 22, AC2.CB, AC2.CF);
      for (const k of [0.7, 1, 1.35]) ACM.acProj({ x, y, vx: e.facing * clamp(Math.abs(dx), 40, 140) * k, vy: -170 - (k - 1) * 40, kind: 'cera', r: 2, dmg: e.dmg, life: 4 });
      sfx.acSacode(Math.max(0.5, ACM.near(e)));
    }
    return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 3 * T ? 0 : Math.sign(dx);
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 22 : 10, 300, 200, dy, aggro);
  if (dir) e.facing = dir;
  // as poças de cera por onde anda
  e.dripT = (e.dripT || 0) - dt; if (Math.abs(e.vx) > 4 && e.onGround && e.dripT <= 0) { e.dripT = 1.6; ACM.acCera(e.x + e.w / 2, e.y + e.h - 2, 12, 8); }
  if (!aggro || e.atkCD > 0 || pl.dead || !e.onGround) return;
  if (dist < 7 * T && Math.abs(dy) < 3 * T && e.sees) { e.state = 'flare'; e.stateT = AC_CHAMA; e.vx = 0; sfx.acChama(Math.max(0.4, ACM.near(e))); }
};

/* ---------- o Enforcado do Pavio ---------- */
AI.pavio = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.vx = 0; e.vy = 0;
  if (e.homeX !== undefined) { e.x = e.homeX - e.w / 2; e.y = e.homeY - e.h; }
  if (e.state === 'noose') {   // o laço aceso desce até a altura do herói
    const q = clamp(1 - e.stateT / AC_LACO, 0, 1); e.nY = lerp(e.y + e.h, e.nTo, q);
    if (Math.random() < dt * 20) ACM.sparks(e.nX, e.nY, 1, ACM.FOGO, 6, 10, 0.4);
    if (e.stateT <= 0) {
      const pcx = pl.x + pl.w / 2;
      if (!pl.dead && Math.abs(pcx - e.nX) < 9 && pl.y < e.nTo + 6 && pl.y + pl.h > e.nTo - 6) {
        const r = hurtPlayer(e.dmg, e.nX, e, false);
        if (r === 'hit') { e.state = 'hold'; e.stateT = 0.6; ACM.acQueima(Math.max(1, Math.round(e.dmg * 0.25)), 2); sfx.acLaco(Math.max(0.5, ACM.near(e))); return; }
      }
      e.state = 'up'; e.stateT = 0.5; sfx.acChia(ACM.near(e) * 0.4);
    }
    return;
  }
  if (e.state === 'hold') {   // puxa para cima
    if (!pl.dead) { pl.vy = Math.min(pl.vy, -200); pl.vx *= 0.5; }
    e.nY = pl.y + 4;
    if (e.stateT <= 0) { e.state = 'up'; e.stateT = 0.5; }
    return;
  }
  if (e.state === 'up') { e.nY = lerp(e.nY, e.y + e.h, Math.min(1, dt * 8)); if (e.stateT <= 0) { e.state = 'hang'; e.atkCD = 1.6 + Math.random(); } return; }
  e.state = 'hang';
  e.facing = Math.sign(dx) || e.facing;
  if (!aggro || e.atkCD > 0 || pl.dead) return;
  const pcx = pl.x + pl.w / 2;
  if (Math.abs(pcx - (e.x + e.w / 2)) < 2.5 * T && dy > 0 && pl.y + 6 - (e.y + e.h) < 8 * T && losClear(e.x + e.w / 2, e.y + e.h, pcx, pl.y + 4)) {
    e.state = 'noose'; e.stateT = AC_LACO; e.nX = pcx; e.nTo = pl.y + 5; e.nY = e.y + e.h; sfx.acPavio(Math.max(0.4, ACM.near(e)));
  }
};
// o laço: o pavio descendo do enforcado até o laço, a argola acesa
HOOK.drawTop.push((cx, cy) => {
  for (const e of enemies) {
    if (e.dead || e.type !== 'pavio' || (e.state !== 'noose' && e.state !== 'hold' && e.state !== 'up') || e.nY === undefined) continue;
    const x0 = e.x + e.w / 2, y0 = e.y + e.h - 4, n = Math.max(2, Math.ceil(Math.hypot(e.nX - x0, e.nY - y0) / 1.5));
    lc.fillStyle = '#6a5646'; for (let i = 0; i < n; i++) { const t = i / n; lc.fillRect(Math.round(x0 + (e.nX - x0) * t - cx), Math.round(y0 + (e.nY - y0) * t - cy), 1, 1); }
    const x = Math.round(e.nX - cx), y = Math.round(e.nY - cy);
    lc.fillStyle = '#d86214'; lc.fillRect(x - 3, y - 1, 7, 1); lc.fillRect(x - 3, y + 2, 7, 1); lc.fillRect(x - 3, y, 1, 2); lc.fillRect(x + 3, y, 1, 2);
    lc.fillStyle = '#ffd070'; lc.fillRect(x - 2, y - 1, 5, 1);
  }
});
HOOK.drawGlow.push((cx, cy) => {
  for (const e of enemies) if (!e.dead && e.type === 'pavio' && (e.state === 'noose' || e.state === 'hold') && e.nY !== undefined) { const g = ACM.gl(9, '#ff9a3a'); lc.globalAlpha = 0.8; lc.drawImage(g, Math.round(e.nX - cx) - 9, Math.round(e.nY - cy) - 9); }
  for (const C of ac2Cones) {   // o cone de chamas do forno
    const k = C.t < 0.15 ? C.t / 0.15 : 1 - (C.t - 0.15) / 0.55;
    for (let i = 0; i < 26; i++) { const d = hash2(i, Math.floor(C.t * 30), 3) * C.L * clamp(C.t / 0.15, 0, 1), sp = d * 0.45 * (hash2(i, 7, 3) - 0.5) * 2, g = ACM.gl(d > C.L * 0.6 ? 5 : 7, d > C.L * 0.6 ? '#d86214' : '#ffb050'); lc.globalAlpha = k * 0.8; lc.drawImage(g, Math.round(C.x + C.dir * d - cx) - g.width / 2, Math.round(C.y + sp - cy) - g.height / 2); }
  }
  for (const O of ac2Ondas) { const g = ACM.gl(6, '#ff8a3a'); lc.globalAlpha = 0.6; lc.drawImage(g, Math.round(O.x - cx) - 6, Math.round(O.y - cy) - 9); }
  lc.globalAlpha = 1;
});
HOOK.drawWorld.push((cx, cy) => {
  for (const O of ac2Ondas) { const x = Math.round(O.x - cx), y = Math.round(O.y - cy); lc.fillStyle = '#625d57'; lc.fillRect(x - 3, y - 5, 6, 5); lc.fillStyle = '#7c766e'; lc.fillRect(x - 2, y - 7, 4, 3); lc.fillStyle = '#ffb050'; lc.fillRect(x - 1, y - 2, 2, 2); }
});

/* ---------- a cada quadro: o cone de chamas, a onda de cinza ---------- */
HOOK.update.push(dt => {
  for (let i = ac2Cones.length - 1; i >= 0; i--) {
    const C = ac2Cones[i]; C.t += dt;
    if (C.owner && ACM.live(C.owner)) { const [x, y] = ACM.pt(C.owner, AC2.OB + 5, AC2.OF - 14, AC2.OB, AC2.OF); C.x = x; C.y = y; }
    if (!C.hit && C.t > 0.08 && !pl.dead) {
      const px = (pl.x + pl.w / 2 - C.x) * C.dir, py = pl.y + pl.h / 2 - C.y;
      if (px > -4 && px < C.L && Math.abs(py) < 8 + px * 0.45) { const r = hurtPlayer(C.dmg, C.x, C.owner, true); if (r !== 'none' || pl.invuln > 0) { C.hit = true; if (r === 'hit') ACM.acQueima(Math.max(1, Math.round(C.dmg * 0.2)), 2); } }
    }
    if (C.t > 0.7) ac2Cones.splice(i, 1);
  }
  for (let i = ac2Ondas.length - 1; i >= 0; i--) {
    const O = ac2Ondas[i]; O.t += dt; O.x += O.dir * 150 * dt;
    // corre pelo chão: para no vão e na parede
    const tx = Math.floor(O.x / T), ty = Math.floor((O.y - 2) / T);
    if (solidAt(tx, ty) || !solidAt(tx, ty + 1) || O.t > 1.2) { ACM.ash(O.x, O.y, 4); ac2Ondas.splice(i, 1); continue; }
    if (Math.random() < dt * 30) ACM.ash(O.x, O.y, 1, 20, -40);
    if (!O.hit && !pl.dead && Math.abs(pl.x + pl.w / 2 - O.x) < 6 && pl.y + pl.h > O.y - 7 && pl.y + pl.h <= O.y + 2) { O.hit = true; const r = hurtPlayer(O.dmg, O.x - O.dir * 6, null, true); if (r === 'hit') { pl.vy = Math.min(pl.vy, -120); pl.vx += O.dir * 100; } }
  }
});

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead && e.type === 'faminto' && e.state === 'sleep') { e.state = 'wake'; e.stateT = AC_BRASAS * 0.6; }
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !AC2_TYPES.includes(e.type)) return r;
  if (e.type === 'cirio' && e.state === 'flare' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1); }
  if (e.type === 'pavio') { e.stun = 0; if (e.state === 'hold') { e.state = 'up'; e.stateT = 0.4; } }
  if (e.type === 'fagulhas' && e.state === 'knot') { e.state = 'drift'; e.atkCD = Math.max(e.atkCD, 1); }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!AC2_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, ACM.near(e, 260));
  if (e.type === 'fagulhas') { ACM.sparks(cx, cy, 16, ACM.FOGO, 70, 60, 0.7); sfx.acCrepita(v); }
  else if (e.type === 'cirio') { ACM.acCera(cx, e.y + e.h - 2, 22, 10); ACM.sparks(cx, e.y, 6, ACM.FOGO, 20, -30, 0.6); sfx.acCera(v); }
  else if (e.type === 'fornoandante') { ACM.sparks(cx, cy, 24, ACM.FOGO, 70, 80, 0.9); ACM.ash(cx, e.y + e.h, 16, 60); shake(4); sfx.acPisa(v); }
  else { ACM.ash(cx, e.y + e.h, 8, 40); ACM.sparks(cx, cy, 6, ACM.FOGO, 30, 40, 0.6); sfx.acCai(v); }
  return r;
}; }
// o enforcado: sobe até o teto (até 12 blocos); sem teto, não nasce. O faminto nasce dormindo
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || e.dead || !AC2_TYPES.includes(type)) return e;
  if (type !== 'fagulhas' && type !== 'pavio') for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.6 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  if (type === 'pavio') {
    const tx = Math.floor((e.x + e.w / 2) / T); let ty = Math.floor(e.y / T), k = 0;
    while (k < 12 && !solidAt(tx, ty - 1)) { ty--; k++; }
    if (!solidAt(tx, ty - 1) || solidAt(tx, ty + 2)) { e.dead = true; e.hp = 0; e.acVoid = true; return e; }
    e.ceilY = ty * T; e.homeX = tx * T + T / 2; e.homeY = e.ceilY + 10 + e.h; e.x = e.homeX - e.w / 2; e.y = e.homeY - e.h; e.state = 'hang';
  } else if (type === 'faminto') e.state = 'sleep';
  else e.state = type === 'fagulhas' ? 'drift' : 'walk';
  return e;
}; }
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'fagulhas') addL(e.x + e.w / 2, e.y + e.h / 2, e.state === 'knot' ? 0.6 : 0.4);
    else if (e.type === 'cirio') addL(e.x + e.w / 2, e.y, e.state === 'flare' ? 0.65 : 0.45);
    else if (e.type === 'fornoandante') addL(e.x + e.w / 2, e.y + 10, e.state === 'door' || e.state === 'flame' ? 0.75 : 0.25);
    else if (e.type === 'faminto' && e.state !== 'sleep') addL(e.x + e.w / 2, e.y, 0.35);
    else if (e.type === 'pavio' && (e.state === 'noose' || e.state === 'hold')) addL(e.nX, e.nY, 0.45);
  }
}; }
function clearAc2Fx() { ac2Ondas.length = 0; ac2Cones.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearAc2Fx(); ac2Tables(); return _nw(sd, sv); }; }

/* ---------- sons ---------- */
Object.assign(sfx, {
  acAperta(v = 1) { for (let k = 0; k < 6; k++) noise(0.04, 0.02 * v, 2600 + k * 300, 'bandpass', k * 0.12, 4); tone(500, 0.8, 'sine', 0.006 * v, 500); },
  acRisco(v = 1) { noise(0.3, 0.06 * v, 2200, 'bandpass', 0, 1); },
  acCrepita(v = 1) { for (let k = 0; k < 3; k++) noise(0.02, 0.03 * v, 3000, 'highpass', k * 0.05); },
  acBrasas(v = 1) { noise(0.6, 0.03 * v, 500, 'lowpass', 0, 1); for (let k = 0; k < 4; k++) noise(0.03, 0.03 * v, 2600, 'bandpass', 0.1 + k * 0.12, 3); },
  acMordida(v = 1) { tone(140, 0.12, 'square', 0.03 * v, -60); noise(0.1, 0.07 * v, 1200, 'bandpass', 0, 2); },
  acPulo(v = 1) { tone(220, 0.1, 'triangle', 0.015 * v, 120); noise(0.08, 0.03 * v, 900, 'bandpass', 0, 2); },
  acPorta(v = 1) { tone(90, 0.5, 'sawtooth', 0.02 * v, 30); noise(0.5, 0.04 * v, 300, 'lowpass', 0, 1); },
  acChamas(v = 1) { noise(0.7, 0.1 * v, 700, 'lowpass', 0, 1); noise(0.5, 0.04 * v, 2000, 'bandpass', 0.05, 1); },
  acRange(v = 1) { tone(70, 0.6, 'sawtooth', 0.02 * v, 20); },
  acPisa(v = 1) { tone(55, 0.4, 'sine', 0.06 * v, -25); noise(0.4, 0.08 * v, 250, 'lowpass', 0, 1); },
  acPasso(v = 1) { tone(60, 0.15, 'sine', 0.03 * v, -15); },
  acChama(v = 1) { noise(0.8, 0.03 * v, 800, 'bandpass', 0, 1); tone(300, 0.8, 'sine', 0.006 * v, 200); },
  acSacode(v = 1) { noise(0.25, 0.05 * v, 900, 'bandpass', 0, 1); },
  acPavio(v = 1) { noise(0.8, 0.02 * v, 2200, 'highpass', 0, 1); tone(400, 0.8, 'sine', 0.005 * v, -100); },
  acLaco(v = 1) { tone(160, 0.25, 'sawtooth', 0.03 * v, 200); noise(0.3, 0.05 * v, 1600, 'bandpass', 0, 2); }
});
