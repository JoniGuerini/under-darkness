'use strict';

/* ================= quatro monstros novos das Cavernas de Gelo (a camada fica com 10) =================
   O sincelo vivo, pendurado no teto igual aos sincelos do cenário, que despenca quando o herói passa embaixo e
   depois rasteja atrás dele. O caçador congelado, explorador morto no gelo que voltou: arremessa um arpão que puxa
   o herói para perto e dá uma machadada. O javali da tundra, que bufa, investe em linha reta, derruba o herói e
   quebra o gelo no caminho; se bater numa parede fica tonto e leva mais dano. O wendigo, alto e magro, quase
   invisível no escuro até chegar perto: grita (deixa o herói lento), ataca com garras e foge da luz das tochas.
   Arte com o pincel do 55 (cp, rampas, contorno, cache). Carrega depois do 74 e antes do 49 (BAL). */

/* ---------- números ---------- */
Object.assign(ET, {
  sincelo: { name: 'Sincelo Vivo', w: 8, h: 14, hp: 34, dmg: 16, xp: 20, kb: 0.6, fly: false, blood: '#bfe8fa' },
  cacador: { name: 'Caçador Congelado', w: 8, h: 20, hp: 70, dmg: 14, xp: 30, kb: 0.5, fly: false, blood: '#6a8aa0' },
  javali: { name: 'Javali da Tundra', w: 20, h: 13, hp: 110, dmg: 18, xp: 34, kb: 0.15, fly: false, blood: '#8a2a2a' },
  wendigo: { name: 'Wendigo', w: 10, h: 30, hp: 150, dmg: 20, xp: 60, kb: 0.3, fly: false, blood: '#5a5a62' }
});
Object.assign(IC_BEASTS, { sincelo: 1, cacador: 1, javali: 1, wendigo: 1 });   // sangue frio: a Nevasca quase não pega

/* ---------- materiais ---------- */
Object.assign(ICON_ART, {
  iceEye: [["..bbbbb..", ".bBBBBBb.", "bBBkkkBBb", "bBkWwkkBb", "bBkwwkkBb", "bBBkkkBBb", ".bBBBBBb.", "..bbbbb.."], { b: '#3a6a8a', B: '#a8dcf4', k: '#0a1a2a', W: '#ffffff', w: '#7ae0ff' }],
  harpoon: [["........m", ".......mM", "......mM.", ".....mM..", "..r.mM...", "..rmM....", ".rmMr....", "rrr......"], { m: '#3a4048', M: '#b8c4d0', r: '#6a4a2a' }],
  boarTusk: [["......ww.", ".....wWw.", "....wWw..", "...wWw...", "..wWw....", ".wWw.....", "wWw......", "ww......."], { w: '#8a8068', W: '#f0e8d0' }],
  antler: [["k.....k..", "kK...kK..", ".kK.kK.k.", "..kKKkKk.", "...kKKk..", "...kKk...", "...kKk...", "....k...."], { k: '#3a3428', K: '#d8d0b8' }]
});
Object.assign(ITEMS, {
  olho_sincelo: { name: 'Olho de Sincelo', rar: 1, stack: 99, icon: 'iceEye', desc: 'Não derrete e continua olhando. Material.' },
  ponta_arpao: { name: 'Ponta de Arpão', rar: 1, stack: 99, icon: 'harpoon', desc: 'Ferro de outra época, afiado ainda. Material.' },
  presa_javali: { name: 'Presa de Javali', rar: 0, stack: 99, icon: 'boarTusk', desc: 'Curva e pesada. Material.' },
  galhada: { name: 'Galhada de Wendigo', rar: 2, stack: 99, icon: 'antler', desc: 'Fria demais para segurar muito tempo. Material.' }
});
Object.assign(DROPS, {
  sincelo: [['olho_sincelo', 0.45], ['lasca_eterna', 0.2], ['pocao', 0.08], ['adaga_cristal', 0.025], ['amuleto_vento', 0.01]],
  cacador: [['ponta_arpao', 0.5], ['pelo_yeti', 0.2], ['pocao', 0.12], ['machado_ouro', 0.04], ['manto', 0.03], ['elmo_ouro', 0.025]],
  javali: [['presa_javali', 0.6, 1, 2], ['carne', 0.5, 1, 2], ['pocao', 0.1], ['escudo_ouro', 0.03], ['anel_furia', 0.015]],
  wendigo: [['galhada', 0.55], ['essencia_gelida', 0.3], ['pocao', 0.2], ['lamina_cristal', 0.04], ['grevas_demonio', 0.02], ['amuleto_vento', 0.02]]
});
Object.assign(NAV_WALKERS, { cacador: 1, javali: 1, wendigo: 1 });
Object.assign(CV_STEP, { sincelo: 1, cacador: 1, javali: 1, wendigo: 1 });

/* ================= arte ================= */
const ICN = {};
{
const { RB, cp, set } = CVB;
const R7 = hexes => hexes.map(h => ph(h));
const RG = {
  gelo: R7(['#0e2434', '#1a3e58', '#2a5c80', '#4a86aa', '#78b4d4', '#a8dcf4', '#e4f6ff']),
  geloE: R7(['#06121c', '#0c1e2e', '#143044', '#1e445c', '#2c5a76', '#3e7292', '#568cae']),
  pele: R7(['#1a2430', '#2a3848', '#3e5062', '#566a7e', '#70869a', '#8ea4b6', '#b0c4d2']),
  peles: R7(['#120c06', '#20160c', '#322414', '#46341e', '#5c462a', '#765a38', '#927248']),
  neve: R7(['#3a4652', '#56626e', '#76828e', '#98a4ae', '#bac4cc', '#d6dee4', '#f2f6f8']),
  ferro: R7(['#101216', '#1c2026', '#2c3238', '#40484e', '#586268', '#747e86', '#98a2aa']),
  cabo: R7(['#140c06', '#22160c', '#342414', '#48341e', '#5e462a', '#765a38', '#90704a']),
  pelo: R7(['#2a2c30', '#44484e', '#62676e', '#848a90', '#a6acb0', '#c6cace', '#e6e8ea']),
  focinho: R7(['#2a1418', '#40202a', '#5a2e38', '#764048', '#92565c', '#ae7076', '#c88e92']),
  wend: R7(['#0c0c10', '#18181e', '#26262e', '#363640', '#484854', '#5c5c6a', '#727282']),
  osso: R7(['#3a3428', '#5a5240', '#7a705a', '#9a8e74', '#bab096', '#d6ccb2', '#eee6d0']),
  javali: R7(['#16120e', '#262018', '#3a3226', '#524636', '#6c5e4a', '#8a7a62', '#aa9a80'])
};
const shag = s => (x, y) => (hash2(x, y, s) < 0.22 ? 0.9 : 0) + ((x * 3 + y * 2) % 7 === 0 ? -0.8 : 0);

/* o sincelo: 'hang' 10 x 18 (ponta para baixo, um olho dentro); 'crawl' 16 x 10, deitado com patinhas de cristal (0-1) */
function icicleHang() {
  const P = cp(10, 18), s = 9101;
  for (let y = 0; y < 18; y++) { const hw = 4.6 * Math.pow(1 - y / 18, 0.8); for (let x = 0; x < 10; x++) { const k = (x + 0.5 - 5) / Math.max(0.5, hw); if (Math.abs(k) > 1) continue; P.put(x, y, RG.gelo, 4.4 - k * 1.4 - y * 0.06 + (Math.abs(k + 0.35) < 0.14 ? 1.6 : 0) + CVART.cg(x, y, s) * 0.4); } }
  for (let x = 1; x < 9; x++) P.put(x, 0, RG.geloE, 3);   // a raiz no teto
  P.blob(5, 6.4, 2, 2, RG.geloE, s + 1, 1); P.put(5, 6, RB.osso, 6.4); P.put(5.6, 6.6, RG.gelo, 6);   // o olho
  return set(P.done());
}
function icicleCrawl(k) {
  const P = cp(16, 10), s = 9111 + k;
  for (let i = 0; i < 4; i++) { const x = 4 + i * 2.8, o = ((i + k) % 2 ? 1 : -1) * 0.8; P.line(x, 6, x - 0.8 + o, 9.4, RG.gelo, 5); }   // patinhas de cristal
  for (let x = 0; x < 16; x++) { const hh = 3.6 * Math.pow(x / 16, 0.7); for (let y = 0; y < 10; y++) { const c = 4.6, kk = (y + 0.5 - c) / Math.max(0.5, hh); if (Math.abs(kk) > 1) continue; P.put(x, y, RG.gelo, 4.4 - kk * 1.4 + (Math.abs(kk + 0.4) < 0.16 ? 1.6 : 0) + CVART.cg(x, y, s) * 0.4); } }
  P.blob(12.6, 4.4, 1.6, 1.6, RG.geloE, s + 1, 1); P.put(13, 4, RB.osso, 6.4); P.put(13.6, 4.4, RG.gelo, 6);
  return set(P.done());
}
/* o caçador, 13 x 21 de frente para a direita: 0 parado, 1-2 andando, 3 mirando o arpão, 4 arremesso, 5 machado em cima, 6 machadada */
function hunter(pose) {
  const P = cp(13, 21), s = 9201 + pose, w = pose === 1 ? 1 : pose === 2 ? -1 : 0;
  if (pose === 3) P.line(1, 5, 10.6, 5.8, RG.cabo, 4);   // o arpão, por trás, apontado
  P.line(5.4, 14, 5.4 - w, 19.6, RG.peles, 2.8); P.line(7.6, 14, 7.6 + w, 19.6, RG.peles, 3.6);   // pernas
  P.blob(5.4 - w, 20, 1.4, 0.8, RG.peles, s + 5, 2); P.blob(7.8 + w, 20, 1.4, 0.8, RG.peles, s + 6, 2.4);   // botas de pele
  P.blob(6.4, 11.4, 3.6, 4.4, RG.peles, s, 3.6, (x, y) => (hash2(x, y, s) < 0.16 ? 2 : 0) + ((x + y) % 5 === 0 ? -0.6 : 0));   // casaco de peles com geada
  for (let x = 3; x <= 9; x++) P.put(x, 14, RG.cabo, 1.8);   // cinto
  P.blob(6.8, 5, 2.6, 2.8, RG.pele, s + 1, 4);   // a cabeça, azulada
  P.blob(8, 7.2, 2.1, 1.7, RG.neve, s + 2, 4.6);   // barba congelada
  P.blob(6.4, 2.6, 3.1, 1.7, RG.peles, s + 3, 3.6, (x, y) => hash2(x, y, s + 3) < 0.25 ? 1.6 : 0);   // gorro de pele
  P.put(8.4, 4.8, RG.gelo, 6.4);   // o olho que brilha
  P.put(9.6, 5.8, RG.pele, 4.4);   // nariz
  const axe = (hx, hy, ax, ay) => { P.line(hx, hy, ax, ay, RG.cabo, 3.6); const dx = ax - hx, dy = ay - hy, n = Math.hypot(dx, dy) || 1, px = -dy / n, py = dx / n; P.line(ax - px * 0.2, ay - py * 0.2, ax + px * 2.4, ay + py * 2.4, RG.ferro, 5); P.line(ax + dx / n, ay + dy / n, ax + dx / n + px * 2.2, ay + dy / n + py * 2.2, RG.ferro, 4.4); };
  if (pose === 3) P.line(6.4, 9, 3.4, 6.4, RG.peles, 3.6);
  else if (pose === 4) P.line(6.6, 9, 11.4, 8, RG.peles, 3.8);
  else if (pose === 5) { P.line(7, 9, 8.4, 3.4, RG.peles, 3.8); axe(8.4, 3.6, 9.4, 0.6); }
  else if (pose === 6) { P.line(7, 9, 11, 11, RG.peles, 3.8); axe(11, 11, 12.4, 14.4); }
  else { P.line(7, 9, 7.8 + w * 0.5, 12.6, RG.peles, 3.4); axe(8, 12.6, 9.6, 16.4); }
  return set(P.done());
}
/* o javali, 26 x 16 de frente para a direita: 0-1 andando, 2 bufando (cabeça baixa, pata no chão), 3 investida, 4 tonto */
function boar(pose) {
  const P = cp(26, 16), s = 9301 + pose * 3, ph = pose === 1 ? 1 : -1, low = pose === 2 || pose === 3 ? 1 : 0, ch = pose === 3, J = RG.javali;
  const legs = ch ? [[6, 10, 2.4, 15], [9, 10, 6.6, 15], [17, 10, 21, 15], [19.6, 10, 23.6, 14.6]] : pose === 2 ? [[6, 10, 6, 15], [9, 10, 9.4, 15], [17, 10, 16.4, 15], [19.6, 10, 21.6, 12.6]] : [[6, 10, 6 + ph, 15], [9, 10, 9 - ph, 15], [17, 10, 17 - ph, 15], [19.6, 10, 19.6 + ph, 15]];
  legs.forEach(([a, b, c, d], i) => { P.line(a, b, c, d, J, i % 2 ? 2.6 : 1.6); P.put(c, d, RG.cabo, 0.6); });
  P.blob(9.4, 8.6 + low * 0.5, 6.6, 4, J, s, 3.4, shag(s));   // o traseiro
  P.blob(15.4, 7.4 + low * 0.6, 5.8, 5, J, s + 4, 3.8, shag(s + 4));   // a corcova dos ombros
  for (let x = 7; x <= 18; x++) { const y = 3 + low * 0.5 + Math.abs(x - 15) * 0.18; P.put(x, y, J, 1.2 + (x % 2) * 0.8); if (x % 2) P.put(x, y - 1, J, 0.8); }   // a crina de cerdas escuras
  for (let x = 8; x <= 17; x += 2) if (hash2(x, 4, s) < 0.7) P.put(x, 4.4 + low * 0.5 + Math.abs(x - 15) * 0.18, RG.gelo, 5.6);   // gelo grudado no lombo
  const hx = ch ? 22.2 : 21.4, hy = 9.4 + low * 1.4;
  P.blob(hx, hy, 3.4, 2.8, J, s + 1, 3.6, shag(s + 1));   // a cabeça
  P.blob(hx + 3, hy + 0.8, 1.3, 1.5, RG.focinho, s + 2, 3.8); P.put(hx + 3.6, hy + 0.6, RG.focinho, 1);   // o focinho
  P.line(hx + 1.6, hy + 1.8, hx + 3.2, hy - 1.8, RB.osso, 6.2); P.put(hx + 3.2, hy - 2.4, RB.osso, 5.6);   // a presa grande
  P.line(hx - 1.4, hy - 2.2, hx - 2.4, hy - 4.6, J, 3);   // orelha
  if (pose === 4) { P.put(hx + 0.6, hy - 1.2, RG.cabo, 0.4); P.put(hx + 1.4, hy - 0.4, RG.cabo, 0.4); P.put(hx + 1.4, hy - 1.2, RG.cabo, 0.4); P.put(hx + 0.6, hy - 0.4, RG.cabo, 0.4); }
  else P.put(hx + 0.8, hy - 1, RB.olho, 5.4);
  P.line(3, 7, 1.4, 9 + ph * 0.4, J, 2.6);   // o rabinho
  return set(P.done());
}
/* o wendigo, 16 x 33 de frente para a direita: 0-1 andando, 2 grito (cabeça para trás), 3 garras na frente */
function wendigo(pose) {
  const P = cp(16, 33), s = 9401 + pose * 3, ph = pose === 1 ? 1 : -1, scream = pose === 2;
  P.line(6.6, 19, 7.6 + ph * 0.6, 25, RG.wend, 2.6); P.line(7.6 + ph * 0.6, 25, 5.8 - ph, 32, RG.wend, 2.4);   // perna de trás, o joelho virado
  P.line(9, 19, 10.4 - ph * 0.6, 25, RG.wend, 3.6); P.line(10.4 - ph * 0.6, 25, 9 + ph, 32, RG.wend, 3.2);
  P.line(5.6 - ph, 32.4, 7.6 - ph, 32.4, RG.osso, 3.4); P.line(9 + ph, 32.4, 11 + ph, 32.4, RG.osso, 3.8);   // cascos
  P.line(6.6, 10, 4.4, 18, RG.wend, 2.2); P.line(4.4, 18, 4, 23, RG.wend, 2); for (let k = 0; k < 3; k++) P.put(3.4 + k * 0.6, 24, RG.osso, 4);   // o braço de trás
  P.blob(8, 14.4, 2.8, 6, RG.wend, s, 3.6);   // o tronco magro
  for (let y = 11; y <= 16; y += 2.5) P.line(7, y, 9.6, y + 0.6, RG.wend, 5.2);   // costelas aparecendo
  if (pose === 3) { P.line(9.4, 10, 14, 9, RG.wend, 4); for (let k = 0; k < 3; k++) P.line(14, 8.4 + k, 15.8, 7.6 + k * 1.2, RG.osso, 5.4); }
  else { P.line(9.4, 10, 11.6, 18, RG.wend, 4); P.line(11.6, 18, 12.4, 23, RG.wend, 3.6); for (let k = 0; k < 3; k++) P.line(12 + k * 0.6, 23, 12.6 + k * 0.9, 25.6, RG.osso, 5); }   // braço comprido e as garras
  const hx = scream ? 9 : 9.6, hy = scream ? 5 : 6;
  P.blob(hx, hy, 2.4, 2.6, RG.osso, s + 1, 4.2);   // o crânio de cervo
  P.line(hx + 1.4, hy + 0.6, hx + 4, hy + (scream ? -0.6 : 1.4), RG.osso, 4.6); P.line(hx + 1.4, hy + 1.6, hx + 3.6, hy + (scream ? 3.4 : 2.4), RG.osso, 3.4);   // o focinho (aberto no grito)
  P.put(hx + 0.6, hy - 0.4, RG.cabo, 0.2); P.put(hx + 1.2, hy - 0.4, RG.cabo, 0.2);   // a órbita funda
  for (const d of [-1, 1]) { const bx = hx + (d < 0 ? -1.6 : 0.4); P.line(bx, hy - 2, bx + d * 2.4, hy - 5.6, RG.osso, 4); P.line(bx + d * 1.2, hy - 3.8, bx + d * 3.6, hy - 4.6, RG.osso, 3.6); P.line(bx + d * 2.4, hy - 5.6, bx + d * 2, hy - 8, RG.osso, 3.6); }   // a galhada
  return set(P.done());
}
ICN.get = () => ICN.ready || (ICN.ready = {
  hang: icicleHang(), crawl: [0, 1].map(icicleCrawl),
  hunter: [0, 1, 2, 3, 4, 5, 6].map(hunter),
  boar: [0, 1, 2, 3, 4].map(boar),
  wend: [0, 1, 2, 3].map(wendigo)
});
}

/* ================= desenho ================= */
DRAW_E.sincelo = (e, fx, fy, fl) => {
  const B = ICN.get();
  if (e.state === 'hang' || e.state === 'drop') { const img = fl ? B.hang.wr : B.hang.r; lc.drawImage(img, fx - 6, fy - e.h - 2 - (e.state === 'hang' ? 2 : 0)); return; }
  lc.drawImage(cvPick(B.crawl[Math.abs(e.vx) > 4 ? Math.floor(e.t * 10) % 2 : 0], e, fl), fx - 9, fy - 11);
};
DRAW_E.cacador = (e, fx, fy, fl) => {
  const B = ICN.get().hunter, k = e.state === 'aim' ? 3 : e.state === 'throw' || e.state === 'reel' ? 4 : e.state === 'wind' ? 5 : e.state === 'chop' ? 6 : Math.abs(e.vx) > 6 && e.onGround ? 1 + (Math.floor(e.t * 8) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 7, fy - 22);
};
DRAW_E.javali = (e, fx, fy, fl) => {
  const B = ICN.get().boar, k = e.state === 'paw' ? 2 : e.state === 'charge' ? 3 : e.state === 'dazed' ? 4 : Math.abs(e.vx) > 4 ? Math.floor(e.t * 7) % 2 : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 14, fy - 17 + (e.state === 'paw' ? Math.round(Math.abs(Math.sin(e.t * 20)) * 0.6) : 0));
  if (e.state === 'dazed') for (let i = 0; i < 3; i++) { const a = e.t * 5 + i * 2.1; lc.fillStyle = i % 2 ? '#ffe080' : '#ffffff'; lc.fillRect(Math.round(fx + e.facing * 8 + Math.cos(a) * 5), Math.round(fy - 18 + Math.sin(a) * 1.6), 1, 1); }
};
// o wendigo quase some no escuro: só aparece inteiro de perto ou quando ataca
const wdAlpha = e => e.state === 'scream' || e.state === 'wind' || e.state === 'claw' || e.flash > 0 ? 1 : clamp(1.25 - Math.hypot(pl.x - e.x, pl.y - e.y) / 90, 0.12, 1);
DRAW_E.wendigo = (e, fx, fy, fl) => {
  const B = ICN.get().wend, k = e.state === 'scream' ? 2 : e.state === 'wind' || e.state === 'claw' ? 3 : Math.abs(e.vx) > 6 && e.onGround ? Math.floor(e.t * 6) % 2 : 0;
  const a0 = lc.globalAlpha; lc.globalAlpha = a0 * wdAlpha(e);
  lc.drawImage(cvPick(B[k], e, fl), fx - 9, fy - 34);
  lc.globalAlpha = a0;
};
EYES_E.sincelo = (e, fx, fy) => { lc.globalAlpha = 0.5; if (e.state === 'hang' || e.state === 'drop') lc.drawImage(icEye(), fx - 6, fy - e.h + 2); else lc.drawImage(icEye(), fx + e.facing * 4 - 6, fy - 12); };
EYES_E.cacador = (e, fx, fy) => { lc.globalAlpha = 0.6; lc.drawImage(icEye(), fx + e.facing * 2 - 6, fy - 23); };
EYES_E.javali = (e, fx, fy) => { if (e.state === 'dazed') return; lc.globalAlpha = 0.35; lc.drawImage(SPR.glow.eye, fx + e.facing * 9 - 6, fy - 14); };
EYES_E.wendigo = (e, fx, fy) => { lc.globalAlpha = 0.85; lc.drawImage(SPR.glow.eye, fx + e.facing * 2 - 6, fy - 35); lc.globalAlpha = 0.5; lc.drawImage(icEye(), fx + e.facing * 2 - 6, fy - 35); };
WARN_E.sincelo = () => false;
WARN_E.cacador = e => e.state === 'aim' || e.state === 'wind';
WARN_E.javali = e => e.state === 'paw';
WARN_E.wendigo = e => e.state === 'scream' || e.state === 'wind';

/* ================= comportamento ================= */
// o sincelo: pendurado no teto até o herói passar embaixo; cai com tudo e depois rasteja mordendo
AI.sincelo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'hang') {
    e.vx = 0; e.vy = -GRAV * dt;   // preso no teto (a gravidade entra logo depois)
    if (!pl.dead && Math.abs(dx) < 16 && dy > 0 && dy < 190 && losClear(e.x + e.w / 2, e.y + e.h + 2, pl.x + pl.w / 2, pl.y + 4)) { e.state = 'drop'; e.vy = 60; e.swingHit = false; e.stateT = 2.5; sfx.icCrack && sfx.icCrack(); }
    return;
  }
  if (e.state === 'drop') {
    e.vx = 0;
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; const r = hurtPlayer(Math.round(e.dmg * 1.4), e.x + e.w / 2, e, false); if (r === 'hit') { icSlowT = Math.max(icSlowT, 1.5); floatText(pl.x + pl.w / 2, pl.y - 8, 'GELADO', '#a8dcf4', 0.8); } }
    if (e.onGround || e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; icShatter(e.x + e.w / 2, e.y + e.h, false); shake(1.5); }
    return;
  }
  return icCrawl(e, dt, dx, dy, dist, aggro);
};
const icCrawl = cvBiter(36, 30, 0.3, 120);
// o caçador: de longe mira e arremessa o arpão (se pegar, puxa o herói); de perto, machadada
const hnHarpoons = [];
AI.cacador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'aim') { e.vx = approach(e.vx, 0, 800 * dt); e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { hnThrow(e); e.state = 'throw'; e.stateT = 0.4; } return; }
  if (e.state === 'throw') { e.vx = 0; if (e.stateT <= 0 && !hnHarpoons.some(h => h.by === e)) { e.state = 'walk'; e.atkCD = 1.6 + Math.random(); } return; }
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 800 * dt); if (e.stateT <= 0) { e.state = 'chop'; e.stateT = 0.35; const hb = { x: e.facing > 0 ? ecx : ecx - 20, y: e.y, w: 20, h: e.h }; if (!pl.dead && overlap(hb, pl)) hurtPlayer(e.dmg, ecx, e, false); sfx.swing && sfx.swing(); } return; }
  if (e.state === 'chop') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1 + Math.random() * 0.6; } return; }
  if (!aggro) icWander(e, dt);
  const adx = Math.abs(dx);
  let dir = aggro ? (adx > 140 || adx < 60 ? Math.sign(dx) : 0) : e.wander;
  if (aggro && adx < 12) dir = 0;
  if (dir) e.facing = dir; else if (aggro) e.facing = Math.sign(dx) || e.facing;
  walk(e, dt, dir, 38 + e.lvl, 500, 260, dy, aggro);
  if (!aggro || e.atkCD > 0 || !e.onGround) return;
  if (adx < 22 && Math.abs(dy) < 18) { e.state = 'wind'; e.stateT = 0.4; e.facing = Math.sign(dx) || e.facing; }
  else if (adx > 50 && adx < 180 && Math.abs(dy) < 50 && losClear(ecx, e.y + 6, pl.x + pl.w / 2, pl.y + 8)) { e.state = 'aim'; e.stateT = 0.6; e.facing = Math.sign(dx) || e.facing; }
};
function hnThrow(e) {
  const ox = e.x + e.w / 2 + e.facing * 4, oy = e.y + 6, a = Math.atan2(pl.y + pl.h / 2 - oy, pl.x + pl.w / 2 - ox);
  hnHarpoons.push({ by: e, x: ox, y: oy, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, dmg: Math.max(1, Math.round(e.dmg * 0.6)), out: true, t: 0 }); sfx.pswing && sfx.pswing();
}
// o javali: bufa, investe em linha reta, derruba o herói e quebra gelo; bate na parede e fica tonto
const JV_BREAK = t => typeof IC_SLIP !== 'undefined' && IC_SLIP[t] && t !== IC_BARREIRA && DIG[t] > 0;
AI.javali = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'paw') { e.vx = approach(e.vx, 0, 900 * dt); if (Math.random() < dt * 14) parts.push({ x: ecx + e.facing * 12, y: e.y + 6, vx: e.facing * rnd(20, 50), vy: rnd(-20, 0), g: -10, life: 0.5, max: 0.5, col: '#e4f2fc', size: 1 }); if (e.stateT <= 0) { e.state = 'charge'; e.stateT = 2; e.swingHit = false; sfx.jvCharge(); } return; }
  if (e.state === 'charge') {
    e.vx = e.facing * (220 + e.lvl * 4);
    if (Math.random() < dt * 30) burst(ecx - e.facing * 8, e.y + e.h, 1, '#cfe6f4', 50, 200, 0.4);
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx, e, false); if (r === 'hit') { pl.vx = e.facing * 300; pl.vy = -220; } }
    if (e.hitWall) {   // gelo na frente: quebra e segue; qualquer outra coisa: fica tonto
      const fx = Math.floor((e.facing > 0 ? e.x + e.w + 2 : e.x - 2) / T), y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 1) / T);
      let broke = false, other = false;
      for (let ty = y0; ty <= y1; ty++) { const t = tileAt(fx, ty); if (!SOLID[t]) continue; if (JV_BREAK(t) && !(typeof icLedge !== 'undefined' && icLedge.has(ty * WW + wrapX(fx)))) { breakTile(fx, ty); broke = true; } else other = true; }
      if (other || !broke) { e.state = 'dazed'; e.stateT = 1.6; e.vx = -e.facing * 60; e.vy = -110; shake(3); sfx.slam && sfx.slam(); burst(ecx + e.facing * 10, e.y + 6, 12, '#cfe6f4', 90, 300, 0.5); }
      else { shake(2); sfx.icShatter && sfx.icShatter(); }
    } else if (e.stateT <= 0 || ledgeAhead(e, e.facing, 0, false) === 'stop') { e.state = 'recover'; e.stateT = 0.6; e.vx = 0; }
    return;
  }
  if (e.state === 'dazed' || e.state === 'recover') { e.vx = approach(e.vx, 0, 400 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.4 + Math.random() * 0.8; } return; }
  if (!aggro) icWander(e, dt);
  e.turnT = (e.turnT || 0) - dt;
  let dir = e.wander;
  if (aggro) { if (e.turnT <= 0) { e.facing = Math.sign(dx) || e.facing; e.turnT = 0.6; } dir = Math.abs(dx) < 18 ? 0 : Math.sign(dx); }
  else if (dir) e.facing = dir;
  walk(e, dt, dir, 32 + e.lvl, 400, 250, dy, aggro);
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dx) > 40 && Math.abs(dx) < 200 && Math.abs(dy) < 16 && Math.sign(dx) === e.facing && clearPath(e, pl)) { e.state = 'paw'; e.stateT = 0.75; sfx.jvSnort(); }
};
// o wendigo: rápido; grita (o herói fica lento), ataca com as garras, e foge da luz das tochas
function wdTorchNear(e) {
  const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h / 2) / T);
  for (let y = ty - 4; y <= ty + 4; y++) for (let x = tx - 4; x <= tx + 4; x++) if (tileAt(x, y) === TORCH) return x * T + T / 2;
  return null;
}
AI.wendigo = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.scrCD = (e.scrCD === undefined ? 1 : e.scrCD) - dt; e.torchT = (e.torchT || 0) - dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'scream') { e.vx = 0; if (e.stateT <= 0.5 && !e.screamed) { e.screamed = true; sfx.wdScream(); shake(3); if (!pl.dead && dist < 150) { if (!(typeof lgFirmeOn === 'function' && lgFirmeOn())) icSlowT = Math.max(icSlowT, 2.5); floatText(pl.x + pl.w / 2, pl.y - 8, 'GELADO', '#a8dcf4', 0.8); } } if (e.stateT <= 0) { e.state = 'walk'; e.screamed = false; } return; }
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'claw'; e.stateT = 0.5; e.swipes = 0; } return; }
  if (e.state === 'claw') {   // dois golpes rápidos
    const k = e.stateT < 0.25 ? 2 : 1;
    if (e.swipes < k) { e.swipes = k; const hb = { x: e.facing > 0 ? ecx : ecx - 22, y: e.y + 4, w: 22, h: e.h - 6 }; if (!pl.dead && overlap(hb, pl)) hurtPlayer(Math.round(e.dmg * 0.6), ecx, e, false); sfx.swing && sfx.swing(); }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.9 + Math.random() * 0.6; }
    return;
  }
  if (e.state === 'flee') { const d = Math.sign(ecx - (e.fleeX || ecx - e.facing)) || 1; e.facing = d; walk(e, dt, d, 80, 900, 280, dy, false); if (e.stateT <= 0) e.state = 'walk'; return; }
  if (e.torchT <= 0) { e.torchT = 0.5; const t = wdTorchNear(e); if (t !== null) { e.state = 'flee'; e.stateT = 2.5; e.fleeX = t; sfx.wdHiss(); return; } }
  if (!aggro) icWander(e, dt);
  let dir = aggro ? (Math.sign(dx) || 1) : e.wander;
  if (aggro && Math.abs(dx) < 10) dir = 0;
  if (dir) e.facing = dir; walk(e, dt, dir, 66 + e.lvl * 2, 800, 300, dy, aggro);
  if (!aggro || e.atkCD > 0 || !e.onGround) return;
  if (e.scrCD <= 0 && dist < 130 && clearPath(e, pl)) { e.state = 'scream'; e.stateT = 0.9; e.scrCD = 9 + Math.random() * 3; e.facing = Math.sign(dx) || e.facing; }
  else if (Math.abs(dx) < 24 && Math.abs(dy) < 24) { e.state = 'wind'; e.stateT = 0.3; e.facing = Math.sign(dx) || e.facing; }
};
// lgFirme (o Manto do Yeti) também segura o grito
function lgFirmeOn() { if (typeof EQ_SLOTS === 'undefined') return false; for (const k of EQ_SLOTS) if (equip[k] && (itemStats(equip[k]).lgFirme || 0) > 0) return true; return false; }

/* ---------- golpes, o arpão e o nascimento no teto ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'javali' && e.state === 'dazed') mult *= 1.6;
  if (e && e.type === 'sincelo' && e.state === 'hang') { e.state = 'drop'; e.vy = 30; e.swingHit = true; e.stateT = 2.5; }
  return _hit(e, dir, mult, melee);
}; }
function icnUpdate(dt) {
  for (let i = hnHarpoons.length - 1; i >= 0; i--) {
    const h = hnHarpoons[i], e = h.by; h.t += dt;
    if (!e || e.dead) { hnHarpoons.splice(i, 1); continue; }
    const ox = e.x + e.w / 2 + e.facing * 4, oy = e.y + 6;
    if (h.out) {
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (!pl.dead && h.x > pl.x - 1 && h.x < pl.x + pl.w + 1 && h.y > pl.y - 1 && h.y < pl.y + pl.h + 1) {
        const r = hurtPlayer(h.dmg, h.x - Math.sign(h.vx) * 4, null, true);
        if (r === 'hit') { const d = Math.sign(ox - (pl.x + pl.w / 2)) || 1; pl.vx = d * Math.min(320, Math.abs(ox - pl.x) * 2.4 + 60); pl.vy = -150; floatText(pl.x + pl.w / 2, pl.y - 8, 'FISGADO', '#d8c8a8', 0.8); e.atkCD = 0; e.state = 'walk'; }
        h.out = false; sfx.icHit && sfx.icHit();
      } else if (solidAt(Math.floor(h.x / T), Math.floor(h.y / T)) || h.t > 0.75) { h.out = false; burst(h.x, h.y, 4, '#b8c4d0', 50, 300, 0.3); }
    } else {   // a corda recolhe
      const a = Math.atan2(oy - h.y, ox - h.x); h.x += Math.cos(a) * 340 * dt; h.y += Math.sin(a) * 340 * dt;
      if (Math.hypot(ox - h.x, oy - h.y) < 8) hnHarpoons.splice(i, 1);
    }
  }
}
HOOK.update.push(icnUpdate);
HOOK.drawTop.push((cx, cy) => {
  for (const h of hnHarpoons) {
    const e = h.by, ox = Math.round(e.x + e.w / 2 + e.facing * 4) - cx, oy = Math.round(e.y + 6) - cy, x = Math.round(h.x) - cx, y = Math.round(h.y) - cy;
    const n = Math.max(1, Math.ceil(Math.hypot(x - ox, y - oy) / 2)); lc.fillStyle = '#8a6a44';
    for (let k = 0; k <= n; k++) lc.fillRect(Math.round(ox + (x - ox) * k / n), Math.round(oy + (y - oy) * k / n + Math.sin(k / n * Math.PI) * 2), 1, 1);   // a corda
    const a = Math.atan2(h.vy, h.vx); lc.fillStyle = '#c8d4e0'; lc.fillRect(x - 1, y - 1, 3, 3); lc.fillStyle = '#ffffff'; lc.fillRect(Math.round(x + Math.cos(a) * 2), Math.round(y + Math.sin(a) * 2), 1, 1);
  }
});
// os sincelos nascem pendurados no teto
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type === 'sincelo') { const tx = Math.floor((e.x + e.w / 2) / T), ty = Math.floor((e.y + e.h - 1) / T), r = cvRoofAbove(tx, ty, 14); if (r >= 0 && ty - r >= 3 && !rectSolid(e.x, (r + 1) * T, e.w, e.h)) { e.y = (r + 1) * T; e.state = 'hang'; e.vy = 0; } }
  return e;
}; }
function clearIcnFx() { hnHarpoons.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearIcnFx(); return _nw(sd, sv); }; }

/* ---------- sons ---------- */
Object.assign(sfx, {
  jvSnort() { noise(0.3, 0.08, 500, 'lowpass', 0, 2); noise(0.2, 0.06, 700, 'lowpass', 0.3, 2); },
  jvCharge() { tone(90, 0.5, 'sawtooth', 0.05, -30); noise(0.6, 0.06, 300, 'lowpass'); },
  wdScream() { tone(1400, 0.8, 'sawtooth', 0.035, -900); tone(1900, 0.7, 'square', 0.02, -1200, 0.05); noise(0.7, 0.05, 3000, 'highpass'); },
  wdHiss() { noise(0.4, 0.06, 2600, 'highpass'); }
});
if (!sfx.icCrack) sfx.icCrack = () => { noise(0.15, 0.08, 3000, 'highpass'); tone(1200, 0.08, 'square', 0.02, -600); };

/* ---------- onde nascem: cada faixa do Gelo fica com 4 a 6 ---------- */
Object.assign(CATH_SPAWN, {
  [IC_ZONE0]: [[['lobo', 0.3], ['espirito', 0.22], ['slime', 0.2], ['verme', 0.13], ['sincelo', 0.18], ['cacador', 0.15]], 8],
  [IC_ZONE0 + 1]: [[['lobo', 0.2], ['espirito', 0.17], ['sentinela', 0.18], ['sincelo', 0.15], ['cacador', 0.15], ['javali', 0.15]], 9],
  [IC_ZONE0 + 2]: [[['yeti', 0.25], ['lobo', 0.2], ['verme', 0.15], ['espirito', 0.15], ['javali', 0.15], ['wendigo', 0.1]], 9],
  [IC_ZONE0 + 3]: [[['sentinela', 0.28], ['yeti', 0.22], ['espirito', 0.2], ['lobo', 0.15], ['wendigo', 0.15]], 10]
});

/* ---------- o vilarejo ---------- */
Object.assign(MAT_VAL, { olho_sincelo: 14, ponta_arpao: 12, presa_javali: 8, galhada: 24 });
{ const c = SHOPS.curandeira, b = c.buys; c.buys = id => b(id) || id === 'olho_sincelo' || id === 'galhada'; c.hint = c.hint.replace(/\.$/, '') + ', olhos de sincelo e galhadas.'; }
{ const f = SHOPS.ferreiro, b = f.buys; f.buys = id => b(id) || id === 'ponta_arpao' || id === 'presa_javali'; f.hint = f.hint.replace(/\.$/, '') + ', arpões e presas de javali.'; }
