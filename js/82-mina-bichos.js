'use strict';

/* ================= the creatures of the abandoned mine =================
   What stayed down here when the miners didn't come back up. The dead miner still swinging his pick (and digging
   through the rock to get at you); the haunted ore cart that sits on the rails like any other cart until you are
   in line with it, then rattles and comes at you, and smashes itself on the next wall; firedamp, the gas that
   drifts after you and swells and blows up (and any fire sets it off early: a torch, the lantern's fire, a blow);
   the haunted lantern that floats out of reach throwing fire; the false vein, a lump of gold ore in the floor that
   opens a mouth; the ore golem, slow and heavy, that slams the floor and throws rocks; and the mole rat that digs
   a tunnel straight through the rock toward you. The goblins are in 83.
   Same brush as 55 (cp, ramps, outline, cache). Loads after 81 and before 49 (BAL). */

/* ---------- stats ---------- */
Object.assign(ET, {
  mineiro: { name: 'Mineiro Morto', w: 9, h: 20, hp: 96, dmg: 18, xp: 32, kb: 0.45, fly: false, blood: '#5a6a4a' },
  carrinho: { name: 'Carrinho Assombrado', w: 22, h: 15, hp: 120, dmg: 22, xp: 36, kb: 0.08, fly: false, blood: '#6a5a4a' },
  grisu: { name: 'Grisu', w: 12, h: 12, hp: 20, dmg: 26, xp: 20, kb: 0.9, fly: true, blood: '#c8d070' },
  lampiao: { name: 'Lampião Assombrado', w: 10, h: 14, hp: 44, dmg: 15, xp: 28, kb: 0.7, fly: true, blood: '#ffb040' },
  falsoveio: { name: 'Falso Veio', w: 15, h: 15, hp: 80, dmg: 20, xp: 30, kb: 0.4, fly: false, blood: '#8a6a4a' },
  golem: { name: 'Golem de Minério', w: 18, h: 28, hp: 280, dmg: 28, xp: 64, kb: 0.05, fly: false, blood: '#7a5a46' },
  toupeira: { name: 'Rato-Toupeira', w: 14, h: 9, hp: 46, dmg: 15, xp: 20, kb: 0.8, fly: false, blood: '#a04a4a' }
});

/* ---------- materials ---------- */
Object.assign(ICON_ART, {
  gear: [["...kk....", ".k.KK.k..", "kKKKKKKk.", ".KKkkKK..", "kKk..kKk.", ".KKkkKK..", "kKKKKKKk.", ".k.KK.k.."], { k: '#3a2a20', K: '#9a6a44' }],
  nugget: [["..........", "...gg.....", "..gGGg....", ".gGWGGgg..", ".gGGGGGg..", "..gGGGg...", "...ggg....", ".........."], { g: '#8a5a08', G: '#f0c43a', W: '#fff6c8' }],
  oreCore: [["...kkk...", "..kOOOk..", ".kOGWOOk.", ".kOOGOOk.", ".kOOOGOk.", "..kOOOk..", "...kkk..."], { k: '#2a1a14', O: '#764233', G: '#f0c43a', W: '#fff6c8' }],
  oil: [["...mm....", "...MM....", "..mmmm...", ".mYYYYm..", ".mYWYYm..", ".mYYYYm..", ".mYYYYm..", "..mmmm..."], { m: '#4a3a24', M: '#8a7a5a', Y: '#d8a020', W: '#fff0a0' }]
});
Object.assign(ITEMS, {
  engrenagem: { name: 'Engrenagem Enferrujada', rar: 0, stack: 99, icon: 'gear', desc: 'Ainda gira, se você insistir. Material.' },
  pepita: { name: 'Pepita de Ouro', rar: 1, stack: 99, icon: 'nugget', desc: 'O que os mineiros vieram buscar. Material.' },
  nucleo_minerio: { name: 'Núcleo de Minério', rar: 2, stack: 99, icon: 'oreCore', desc: 'O coração quente de um golem. Material.' },
  oleo_lampiao: { name: 'Óleo de Lampião', rar: 1, stack: 99, icon: 'oil', desc: 'Queima sem acabar. Material.' }
});
Object.assign(DROPS, {
  mineiro: [['min_ferro', 0.35, 1, 2], ['min_ouro', 0.2], ['carvao', 0.3, 1, 2], ['pocao', 0.1], ['picareta_ouro', 0.025], ['elmo_ferro', 0.03], ['machado_ferro', 0.03]],
  carrinho: [['engrenagem', 0.6, 1, 2], ['min_ferro', 0.4, 1, 3], ['min_ouro', 0.25, 1, 2], ['pocao', 0.08], ['escudo_ferro', 0.03], ['botas_ferro', 0.025]],
  grisu: [['carvao', 0.25], ['pocao', 0.06]],
  lampiao: [['oleo_lampiao', 0.55], ['tocha', 0.4, 1, 3], ['pocao', 0.1], ['lanterna_fantasma', 0.02], ['amuleto', 0.02]],
  falsoveio: [['pepita', 0.6, 1, 3], ['min_ouro', 0.4, 1, 2], ['pocao', 0.08], ['anel_vida', 0.02], ['espada_ouro', 0.025]],
  golem: [['nucleo_minerio', 0.5], ['min_ferro', 0.6, 2, 4], ['min_ouro', 0.4, 1, 3], ['min_cobalto', 0.3, 1, 3], ['pocao', 0.15], ['armadura_placas', 0.03], ['maca_ouro', 0.035], ['escudo_torre', 0.025]],
  toupeira: [['pele_rato', 0.5], ['carne', 0.35], ['pocao', 0.06], ['botas_couro', 0.03], ['adaga_ferro', 0.02]]
});
for (const k of ['mineiro', 'carrinho', 'grisu', 'lampiao', 'falsoveio', 'golem', 'toupeira']) DROPS[k] = DROPS[k].filter(([id]) => ITEMS[id]);
Object.assign(NAV_WALKERS, { mineiro: 1, golem: 1, toupeira: 1 });
Object.assign(CV_STEP, { mineiro: 1, golem: 1, toupeira: 1, falsoveio: 1 });

/* ================= art ================= */
const MNB = {};
{
const { RB, cp, set } = CVB;
const cg = CVART.cg;
const R7 = hexes => hexes.map(h => ph(h));
const RM = {
  podre: R7(['#141810', '#222a1c', '#34402a', '#4a583a', '#62724c', '#7e8e62', '#9eac7e']),     // dead miner's skin
  camisa: R7(['#140e0c', '#241a16', '#382a22', '#4e3c30', '#665040', '#806652', '#9c8068']),
  calca: R7(['#0c0e12', '#161a20', '#222832', '#323a46', '#444e5c', '#5a6474', '#748090']),
  bota: R7(['#080604', '#120e0a', '#1e1810', '#2c2418', '#3c3222', '#4e422e', '#62543c']),
  latao: R7(['#2a1a06', '#4a300c', '#6e4a14', '#966820', '#bc8a30', '#dcae4a', '#f4d27a']),
  ferro: R7(['#0e0e11', '#1c1c21', '#2e2f36', '#44464f', '#5e616c', '#7c808c', '#a2a6b2']),
  cabo: R7(['#140c06', '#22160c', '#342414', '#48341e', '#5e462a', '#765a38', '#90704a']),
  madeira: R7(['#140b05', '#26160a', '#3c2412', '#56361c', '#724a28', '#8e6036', '#aa7a48']),
  luz: R7(['#5a2004', '#8a3a08', '#c26014', '#f08a24', '#ffb04a', '#ffd88a', '#fff4d0']),
  fantasma: R7(['#06201a', '#0c382c', '#145442', '#1e7a5c', '#34a07a', '#62c89c', '#a8f0d0']),
  gas: R7(['#3a3a18', '#565424', '#727034', '#8e8c46', '#aaa85c', '#c6c478', '#e2e09a']),
  rocha: R7(['#140c0b', '#271614', '#3e211c', '#593026', '#764233', '#925845', '#ae7058']),
  jaspe: R7(['#1e0806', '#38100a', '#561a10', '#762618', '#963624', '#b04a34', '#c86448']),
  ouro: R7(['#3a2404', '#6a4a0c', '#a87808', '#d8a420', '#f0c43a', '#fce07a', '#fff6c8']),
  cristal: R7(['#0a1e2a', '#123a50', '#1a5a78', '#2a80a0', '#4aa8c8', '#80d0e8', '#c8f4ff']),
  brasa: R7(['#3a0c02', '#6e1c04', '#a83a08', '#e06414', '#ff9a2a', '#ffd070', '#fff4c8']),
  rosa: R7(['#3a1a1c', '#5a2a2c', '#7a3e3e', '#9a5654', '#b8726c', '#d09088', '#e8b0a8']),
  boca: R7(['#100404', '#200808', '#341010', '#4a1818', '#622222', '#7a2e2e', '#963c3c'])
};

/* the dead miner, 17 x 24 facing right: 0 idle, 1-2 walk, 3 pick raised behind, 4 strike (pick down in front), 5 hacking at a wall */
function miner(pose) {
  const P = cp(17, 24), s = 9601 + pose, w = pose === 1 ? 1 : pose === 2 ? -1 : 0, hunch = pose === 4 ? 1 : 0;
  const pick = (hx, hy, ax, ay) => { P.line(hx, hy, ax, ay, RM.cabo, 3.8); const dx = ax - hx, dy = ay - hy, n = Math.hypot(dx, dy) || 1, px = -dy / n, py = dx / n; for (let t = -4; t <= 4; t += 0.5) { const bend = (t * t) / 16 * 0.9; P.put(ax + px * t - dx / n * bend, ay + py * t - dy / n * bend, RM.ferro, 4.8 - Math.abs(t) * 0.2 + (t < 0 ? 0.6 : 0)); } P.put(ax + px * 4.4 - dx / n * 1.4, ay + py * 4.4 - dy / n * 1.4, RM.ferro, 6.4); };
  if (pose === 3) pick(5, 9, 1.4, 1.6);   // behind the head
  P.line(6.4, 15, 6.4 - w, 22.6, RM.calca, 2.6); P.line(8.8, 15, 8.8 + w, 22.6, RM.calca, 3.6);   // legs
  P.blob(6.6 - w, 23, 1.6, 0.9, RM.bota, s + 7, 2.2); P.blob(9.4 + w, 23, 1.6, 0.9, RM.bota, s + 8, 2.8);
  P.line(5.4, 10, 4.6 - (pose === 3 ? 1 : 0), 15 + (pose === 3 ? -4 : 0), RM.podre, 2.4);   // the far arm
  P.blob(7.6 + hunch, 12, 3.4, 4.2, RM.camisa, s, 3.4, (x, y) => (hash2(x, y, s) < 0.14 ? -1.2 : 0) + ((x * 5 + y) % 9 === 0 ? -0.8 : 0));   // a torn shirt
  for (let y = 9; y <= 15; y++) { P.put(6 + hunch, y, RM.cabo, 2.4); P.put(9.4 + hunch, y, RM.cabo, 3.2); }   // braces
  for (let x = 5; x <= 10; x++) P.put(x + hunch, 15.4, RM.cabo, 1.8);
  P.put(7.6 + hunch, 13, RM.podre, 3.4); P.put(8.4 + hunch, 12, RB.osso, 4.6);   // a rib through the rip
  const hx = 9 + hunch, hy = 5.4 + hunch;
  P.blob(hx, hy, 2.8, 3, RM.podre, s + 1, 3.8);   // the head, sunken
  P.put(hx + 1.2, hy - 0.2, RM.boca, 0.4); P.put(hx + 1.8, hy - 0.2, RM.boca, 0.6); P.put(hx + 1.4, hy + 0.4, RB.osso, 3);   // a dark socket, a dull eye
  P.line(hx + 0.4, hy + 2, hx + 2.4, hy + 2.2, RB.osso, 4.6); P.put(hx + 1.2, hy + 2.6, RB.osso, 3.6);   // the jaw, teeth showing
  P.blob(hx - 0.4, hy - 2.4, 3.4, 1.8, RM.latao, s + 2, 3.8, (x, y, dx, dy) => dy > 0.4 ? -1.4 : 0);   // the brass helmet
  for (let x = hx - 4; x <= hx + 3.6; x++) P.put(x, hy - 1, RM.latao, 2.6);   // brim
  P.put(hx + 2.6, hy - 3.2, RM.luz, 5); P.put(hx + 2.6, hy - 2.4, RM.latao, 4.6); P.put(hx + 3.4, hy - 2.8, RM.luz, 4);   // the lamp on it
  if (pose === 3) P.line(9 + hunch, 9.6, 5.4, 9, RM.podre, 3.6);
  else if (pose === 4) { P.line(9.6, 10, 13, 12, RM.podre, 3.8); pick(13, 12, 15, 19); }
  else if (pose === 5) { P.line(9.4, 10, 12.6, 10.6, RM.podre, 3.8); pick(12.6, 10.6, 16.2, 10.6); }
  else { P.line(9, 10, 9.6 + w * 0.5, 14, RM.podre, 3.6); pick(9.6 + w * 0.5, 14, 11.6, 19.4); }
  return set(P.done());
}
/* the haunted cart, 28 x 21 facing right: 0 still, 1 rattling (ghost fire rising), 2-3 charging (wheels turning), 4 crashed */
function cart(pose) {
  const P = cp(28, 21), s = 9701, tilt = pose === 4 ? 1 : 0, lift = pose === 1 ? -1 : 0;
  const fire = pose >= 1 && pose <= 3;
  if (fire) for (let k = 0; k < 6; k++) {   // ghost fire over the load: tapering tongues, leaning back as it charges
    const bx = 6 + k * 3.2 + hash2(k, 0, s), h = 5 + hash2(k, pose + 5, s) * 4 + (pose === 1 ? 1 : 0), lean = pose >= 2 ? -0.7 : Math.sin(k * 2 + pose) * 0.3;
    for (let j = 0; j < h; j++) { const hw = 1.6 * (1 - j / h), x = bx + lean * j; for (let i = -hw; i <= hw; i += 0.5) P.put(x + i, 5 - j + lift, RM.fantasma, 6.2 - j / h * 3.4 - Math.abs(i) * 0.8); }
  }
  for (let k = 0; k < 8; k++) { const x = 6 + k * 2.2 + hash2(k, 0, s) * 1.2, y = 6.6 - Math.sin(k / 7 * Math.PI) * 2 + hash2(k, 1, s) + lift; P.blob(x, y, 1.8, 1.5, RM.rocha, s + k, 3.4); if (k % 3 === 1) P.put(x, y - 0.6, RM.ouro, 5); }   // the ore
  if (pose !== 0) for (const ex of [11, 16]) { P.put(ex, 5 + lift, RM.fantasma, 6.6); P.put(ex + 1, 5 + lift, RM.fantasma, 6); P.put(ex, 6 + lift, RM.fantasma, 5); }   // two eyes waking in the ore
  for (let y = 7; y < 16; y++) { const inset = Math.round((y - 7) * 0.25); for (let x = 2 + inset; x < 26 - inset; x++) { const row = (y - 7) % 3; P.put(x, y + (tilt && x > 14 ? 1 : 0), RM.madeira, 3.2 + (row === 0 ? 0.9 : row === 2 ? -0.8 : 0) - (x - 2) * 0.03 + cg(x, y, s) * 0.5); } }
  for (let x = 1; x < 27; x++) { P.put(x, 6 + (tilt && x > 14 ? 1 : 0), RM.ferro, 4.8); P.put(x, 7 + (tilt && x > 14 ? 1 : 0), RM.ferro, 3); }
  for (let y = 7; y < 16; y++) { P.put(2 + Math.round((y - 7) * 0.25), y, RM.ferro, 4.2); P.put(25 - Math.round((y - 7) * 0.25), y + tilt, RM.ferro, 2.6); }
  for (let x = 4; x < 24; x++) P.put(x, 16, RM.ferro, 2.2);
  const wheel = (cx, cy, rot) => { P.blob(cx, cy, 2.6, 2.6, RM.ferro, s + cx, 3); for (let k = 0; k < 2; k++) { const a = rot + k * 1.57; P.line(cx - Math.cos(a) * 1.8, cy - Math.sin(a) * 1.8, cx + Math.cos(a) * 1.8, cy + Math.sin(a) * 1.8, RM.ferro, 5.4); } };
  if (pose === 4) { wheel(7, 18, 0.4); P.blob(21, 19.4, 2.4, 1.2, RM.ferro, s, 2.4); }   // one wheel off
  else { const rot = pose === 3 ? 0.8 : 0; wheel(7, 18, rot); wheel(21, 18, rot); }
  return set(P.done());
}
/* firedamp: a sickly yellow-green cloud with two dim eyes; 0-1 drifting, 2 swelling (lit from inside) */
function gasCloud(pose) {
  const big = pose === 2, W = big ? 22 : 18, H = big ? 20 : 16, P = cp(W, H), s = 9801 + pose * 7, cx = W / 2, cy = H / 2;
  const puffs = [[0, 0, 5.4, 4.6], [-4, 1.4, 3.6, 3.2], [4.2, 1.2, 3.8, 3.4], [-1.6, -3, 3.4, 3], [2.4, -2.8, 3, 2.6], [0, 3.4, 4.4, 2.6]];
  for (const [ox, oy, rx, ry] of puffs) P.blob(cx + ox * (big ? 1.25 : 1) + (pose === 1 ? Math.sign(ox) * 0.6 : 0), cy + oy * (big ? 1.2 : 1), rx * (big ? 1.25 : 1), ry * (big ? 1.2 : 1), big ? RM.brasa : RM.gas, s + ox * 3, big ? 3.6 : 3, (x, y) => (hash2(x, y, s) < 0.3 ? -1 : 0));
  if (big) P.blob(cx, cy, 4, 3.4, RM.brasa, s + 99, 5.6);
  P.put(cx - 1.6, cy - 0.6, big ? RM.brasa : RM.boca, big ? 6.6 : 0.6); P.put(cx + 1.6, cy - 0.6, big ? RM.brasa : RM.boca, big ? 6.6 : 0.6);
  P.line(cx - 1.2, cy + 1.6, cx + 1.2, cy + 1.6, big ? RM.brasa : RM.boca, big ? 6.4 : 1);
  return P.done();   // no outline: gas has no edge
}
/* the haunted lantern, 13 x 20: 0-1 floating (flame flickers), 2 casting (glass burning white) */
function lantern(pose) {
  const P = cp(13, 20), s = 9851 + pose;
  for (let y = 0; y < 4; y++) P.put(6 + (y % 2), y, RM.ferro, 4.2 - (y % 2) * 1.4);   // the broken chain
  P.blob(6.5, 5, 2.6, 1.4, RM.ferro, s, 3.8);   // the cap
  for (let y = 6; y < 15; y++) for (let x = 2; x < 11; x++) {
    if (x === 2 || x === 10 || x === 6) { P.put(x, y, RM.latao, x === 2 ? 4.6 : x === 6 ? 3.4 : 2.6); continue; }
    const d = Math.hypot(x - 6, y - 10.4 + (pose === 1 ? 0.6 : 0));
    P.put(x, y, RM.luz, (pose === 2 ? 6.6 : 5.8) - d * (pose === 2 ? 0.6 : 0.9) + cg(x, y, s) * 0.3);
  }
  P.put(4, 9.6, RM.boca, 0.4); P.put(8, 9.6, RM.boca, 0.4); P.line(4.4, 12, 7.6, 12.4, RM.boca, pose === 2 ? 0.2 : 1.2);   // a face in the glass
  for (let x = 1; x < 12; x++) { P.put(x, 15, RM.latao, 4.8 - x * 0.25); P.put(x, 16, RM.latao, 3 - x * 0.15); }
  P.blob(6.5, 18, 2, 1.4, RM.latao, s + 1, 2.8);
  P.line(4, 18.4, 3, 19.6, RM.fantasma, 4); P.line(9, 18.4, 10, 19.6, RM.fantasma, 4);   // a ghost wisp trailing below
  return set(P.done());
}
/* the false vein, 16 x 17: 0 a lump of ore in the floor, 1 an eye opening, 2 the maw open, 3 hopping on stony stubs */
function falseVein(pose) {
  const P = cp(16, 17), s = 9901, open = pose >= 2 ? (pose === 2 ? 5 : 3) : 0;
  const rock = (x, y, top) => { const dx = (x + 0.5 - 8) / 8, v = 3.2 - dx * 0.9 - (y - (top ? 1 : 9)) * 0.08 + cg(x, y, s) * 0.6; return v; };
  // the bottom jaw (the block's lower half)
  for (let y = 8; y < 16; y++) for (let x = 0; x < 16; x++) { const band = Math.floor((y + Math.sin(x * 0.5) * 1.2) / 3) % 2; P.put(x, y + (pose === 3 ? 0 : 1), band ? RM.jaspe : RM.rocha, rock(x, y, false)); }
  // the top (lifted when it opens)
  for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) { const band = Math.floor((y + Math.sin(x * 0.5) * 1.2) / 3) % 2; P.put(x, y + 1 - open + (pose === 3 ? -1 : 0), band ? RM.jaspe : RM.rocha, rock(x, y, true) + (y === 0 ? 1 : 0)); }
  for (const [x, y] of [[3, 3], [9, 2], [12, 6], [5, 11], [11, 12], [2, 13], [7, 6]]) { const yy = y < 8 ? y + 1 - open + (pose === 3 ? -1 : 0) : y + (pose === 3 ? 0 : 1); P.put(x, yy, RM.ouro, 6); P.put(x + 1, yy, RM.ouro, 4.4); P.put(x, yy + 1, RM.ouro, 3.6); }   // the gold that fools you
  if (open) {
    for (let y = 9 - open; y < 9 + (pose === 3 ? 0 : 1); y++) for (let x = 1; x < 15; x++) P.put(x, y, RM.boca, 2 + (y - (9 - open)) * 0.4);
    for (let x = 1; x < 15; x += 2) { P.put(x, 9 - open, RB.osso, 5.6); P.put(x + 1, 8 + (pose === 3 ? 0 : 1) - 0, RB.osso, 4.6); }   // teeth, top and bottom
    P.line(5, 9 + (pose === 3 ? -1 : 0), 10, 9.4, RM.rosa, 4.4);   // tongue
  }
  if (pose >= 1) { P.put(11, 3 - open + (pose === 3 ? -1 : 0), RB.osso, 6); P.put(12, 3 - open + (pose === 3 ? -1 : 0), RB.olho, 5.4); }   // one eye in the rock
  if (pose === 3) for (const x of [3, 12]) { P.line(x, 15, x - 1, 16.6, RM.rocha, 2.6); P.line(x + 1, 15, x + 1.6, 16.6, RM.rocha, 3.2); }
  return set(P.done());
}
/* the ore golem, 28 x 34 facing right: 0-1 walking, 2 arms up (slam wind-up), 3 slam, 4 rock torn out and held back */
function golem(pose) {
  const P = cp(28, 34), s = 9951 + pose * 5, w = pose === 1 ? 1 : pose === 0 ? -1 : 0;
  // a chiselled boulder: octagonal, lit by facets from the top left, banded like the iron rock, ore specks
  const chunk = (cx, cy, rx, ry, ss, base = 3.4) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.max(Math.abs(dx), Math.abs(dy)) * 0.5 + (Math.abs(dx) + Math.abs(dy)) * 0.42;
      if (d > 1) continue;
      const face = dy < -0.35 ? 1.3 : dx < -0.35 ? 0.6 : dy > 0.4 ? -1.2 : dx > 0.4 ? -0.7 : 0.2;
      const band = Math.floor((y + Math.sin(x * 0.6 + ss) * 1.4) / 2) % 4 === 0;
      P.put(x, y, band ? RM.jaspe : RM.rocha, base + face - (d > 0.86 ? 0.8 : 0) + CVART.cg(x, y, ss) * 0.5 + (hash2(x, y, ss) < 0.04 ? 1.4 : 0));
    }
    for (let k = 0; k < rx * ry * 0.05; k++) { const a = hash2(k, 1, ss) * 6.28, d = hash2(k, 2, ss) * 0.6; P.put(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, RM.ouro, 4.4 + (k % 2) * 1.4); }
  };
  // legs: two stubby stacked boulders
  chunk(9.6 - w, 29.6, 3.6, 3.6, s + 1, 2.8); chunk(17.4 + w, 29.6, 3.8, 3.6, s + 2, 3.4);
  // the far arm
  if (pose === 2) { chunk(7, 8, 3.2, 3.6, s + 3, 2.8); chunk(6, 3, 3.4, 3, s + 4, 2.8); }
  else if (pose === 3) { chunk(6.6, 18, 3.2, 3.6, s + 3, 2.8); chunk(6, 25, 3.8, 3.4, s + 4, 2.8); }
  else chunk(6, 16 + w, 3.2, 4.6, s + 3, 2.6);
  // the body: a heap of banded rock, a vein of gold and one of crystal running through it, a molten core showing
  chunk(14, 17, 8.4, 9, s, 3.6);
  for (let k = 0; k < 9; k++) P.put(10 + k, 12 + Math.sin(k * 0.8) * 1.4 + k * 0.6, RM.ouro, 4.4 + (k % 3 === 0 ? 1.8 : 0));
  for (let k = 0; k < 5; k++) P.put(18 - k * 0.6, 20 + k, RM.cristal, 4.6 + (k % 2) * 1.6);
  P.blob(13.6, 18, 2, 1.8, RM.brasa, s + 9, 4.4);
  chunk(19, 6.4, 4.6, 4, s + 5, 3.8);   // head, sunk into the shoulders
  P.put(21, 6, RM.brasa, 6.4); P.put(22, 6, RM.brasa, 5.4); P.put(20.4, 5.2, RM.rocha, 1);   // a molten eye under a brow
  // the near arm
  if (pose === 2) { chunk(19, 8, 3.4, 3.8, s + 6); chunk(19.6, 2.6, 4, 2.6, s + 7, 3.8); }
  else if (pose === 3) { chunk(21, 18, 3.4, 3.6, s + 6); chunk(23.4, 26.4, 4.2, 3.6, s + 7, 3.8); }
  else if (pose === 4) { chunk(10, 12, 3.4, 3.4, s + 6); chunk(5, 9, 4, 3.6, s + 7, 3.2); }
  else { chunk(21.4, 16 - w, 3.4, 4.8, s + 6); chunk(22.4, 23 - w, 3.8, 3.4, s + 7, 3.8); }
  return set(P.done());
}
/* the mole rat, 19 x 12 facing right: 0 idle, 1-2 run, 3 bite (head out, incisors bared), 4 digging (head down, claws up) */
function moleRat(pose) {
  const P = cp(19, 12), s = 9991 + pose, ph = pose === 1 ? 1 : pose === 2 ? -1 : 0, dig = pose === 4, bite = pose === 3;
  P.line(1.4, 7.6, 0.2, 8.4 + ph * 0.4, RM.rosa, 2.6);   // the bald tail
  const by = dig ? 6.4 : 6.6;
  P.blob(7.6, by, 6, 3.4, RM.rosa, s, 3.4, (x, y) => ((x * 2 + y * 3) % 5 === 0 ? -0.9 : 0) + (hash2(x, y, s) < 0.1 ? 0.8 : 0));   // a wrinkled bald body
  for (const [x, o] of [[4.4, ph], [10, -ph]]) { P.line(x, 8.6, x + o, 11.2, RM.rosa, 2.4); P.line(x + 0.8, 11.2, x + 1.8 + o, 11.2, RB.osso, 4); }   // feet with claws
  const hx = bite ? 14.6 : dig ? 13.4 : 13.8, hy = dig ? 8 : bite ? 5.6 : 6.2;
  P.blob(hx, hy, 3, 2.6, RM.rosa, s + 1, 3.8);
  P.put(hx + 0.6, hy - 1.2, RM.boca, 0.4);   // a pinprick eye
  P.put(hx + 2.8, hy - 0.2, RM.rosa, 2.4);   // nose
  const ix = hx + 2.2, iy = hy + 1.2; P.line(ix, iy, ix + (bite ? 2 : 0.6), iy + (bite ? 1.4 : 2), RB.osso, 6.2); P.line(ix - 0.6, iy, ix + (bite ? 1.2 : 0), iy + (bite ? 1.8 : 2.2), RB.osso, 5);   // the long yellow incisors
  if (bite) P.line(ix + 0.4, iy - 1.6, ix + 2.2, iy - 2.4, RB.osso, 5.4);
  if (dig) { P.line(15, 8.6, 17.4, 10.6, RM.rosa, 4); for (let k = 0; k < 3; k++) P.put(17.6 + k * 0.4, 10 + k * 0.6, RB.osso, 5.4); }   // big digging claws
  else { P.line(12, 8.4, 13.4 + ph * 0.6, 11.2, RM.rosa, 3.6); P.put(14 + ph * 0.6, 11.2, RB.osso, 5); }
  return set(P.done());
}
// the lantern's glow, the gas's sickly glow, the cart's ghost fire, the golem's core
const GL = { warm: glow(16, '#ffb050'), gas: glow(14, '#d8e070'), ghost: glow(14, '#62e0a8'), core: glow(10, '#ff8030'), boom: glow(44, '#ffb040') };
MNB.get = () => MNB.ready || (MNB.ready = {
  miner: [0, 1, 2, 3, 4, 5].map(miner),
  cart: [0, 1, 2, 3, 4].map(cart),
  gas: [0, 1, 2].map(gasCloud),
  lamp: [0, 1, 2].map(lantern),
  vein: [0, 1, 2, 3].map(falseVein),
  golem: [0, 1, 2, 3, 4].map(golem),
  mole: [0, 1, 2, 3, 4].map(moleRat)
});
Object.assign(MNB, { RM, GL });
}

/* ================= drawing ================= */
DRAW_E.mineiro = (e, fx, fy, fl) => {
  const B = MNB.get().miner, k = e.state === 'wind' ? 3 : e.state === 'strike' ? 4 : e.state === 'dig' ? (e.stateT % 0.4 < 0.2 ? 5 : 3) : Math.abs(e.vx) > 5 && e.onGround ? 1 + (Math.floor(e.t * 5) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 9, fy - 24);
};
DRAW_E.carrinho = (e, fx, fy, fl) => {
  const B = MNB.get().cart, k = e.state === 'rattle' ? 1 : e.state === 'charge' ? 2 + (Math.floor(e.t * 14) % 2) : e.state === 'crash' ? 4 : 0;
  const j = e.state === 'rattle' ? Math.round(Math.sin(e.t * 50)) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 14 + j, fy - 21 + (e.state === 'rattle' && Math.sin(e.t * 37) > 0.5 ? -1 : 0));
};
DRAW_E.grisu = (e, fx, fy, fl) => {
  const B = MNB.get().gas, big = e.state === 'swell', img = B[big ? 2 : Math.floor(e.t * 2.4) % 2], bob = Math.round(Math.sin(e.t * 2.2 + e.seed) * 1.5);
  const a0 = lc.globalAlpha; lc.globalAlpha = a0 * (big ? (Math.floor(e.t * 18) % 2 ? 1 : 0.8) : fl ? 1 : 0.72);
  lc.drawImage(img, fx - (img.width >> 1), fy - e.h / 2 - (img.height >> 1) + bob);
  lc.globalAlpha = a0;
};
DRAW_E.lampiao = (e, fx, fy, fl) => {
  const B = MNB.get().lamp, k = e.state === 'cast' ? 2 : Math.floor(e.t * 6) % 2, bob = Math.round(Math.sin(e.t * 3 + e.seed) * 1.5), sw = Math.sin(e.t * 2) * 0.12;
  cvRot(cvPick(B[k], e, fl), fx, fy - 9 + bob, sw);
};
DRAW_E.falsoveio = (e, fx, fy, fl) => {
  const B = MNB.get().vein, k = e.state === 'hide' ? 0 : e.state === 'open' ? 1 : !e.onGround ? 3 : e.state === 'bite' || e.state === 'chase' ? 2 : 1;
  lc.drawImage(cvPick(B[k], e, fl), fx - 8, fy - 16 + (e.state === 'hide' ? 1 : 0));
};
DRAW_E.golem = (e, fx, fy, fl) => {
  const B = MNB.get().golem, k = e.state === 'wind' ? 2 : e.state === 'slam' ? 3 : e.state === 'rip' ? 4 : Math.abs(e.vx) > 4 && e.onGround ? Math.floor(e.t * 3) % 2 : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 14, fy - 34 + (e.state === 'wind' ? -1 : 0));
};
DRAW_E.toupeira = (e, fx, fy, fl) => {
  const B = MNB.get().mole, k = e.state === 'bite' ? 3 : e.state === 'burrow' || e.state === 'tunnel' ? 4 : Math.abs(e.vx) > 6 && e.onGround ? 1 + (Math.floor(e.t * 12) % 2) : 0;
  lc.drawImage(cvPick(B[k], e, fl), fx - 10, fy - 12);
};
EYES_E.mineiro = (e, fx, fy) => { lc.globalAlpha = 0.5; lc.drawImage(SPR.glow.eye, fx + e.facing * 4 - 6, fy - 26); };
EYES_E.carrinho = (e, fx, fy) => { if (e.state === 'walk') return; lc.globalAlpha = 0.7; lc.drawImage(MNB.GL.ghost, fx - 14, fy - 30); };
EYES_E.grisu = () => { };
EYES_E.lampiao = () => { };
EYES_E.falsoveio = (e, fx, fy) => { if (e.state === 'hide') return; lc.globalAlpha = 0.45; lc.drawImage(SPR.glow.eye, fx + e.facing * 4 - 6, fy - 19); };
EYES_E.golem = (e, fx, fy) => { lc.globalAlpha = 0.7; lc.drawImage(SPR.glow.eye, fx + e.facing * 7 - 6, fy - 34); };
EYES_E.toupeira = () => { };
WARN_E.mineiro = e => e.state === 'wind';
WARN_E.carrinho = e => e.state === 'rattle';
WARN_E.grisu = e => e.state === 'swell';
WARN_E.lampiao = e => e.state === 'cast';
WARN_E.falsoveio = e => e.state === 'open';
WARN_E.golem = e => e.state === 'wind' || e.state === 'rip';
WARN_E.toupeira = e => e.state === 'burrow';

/* ================= behaviour ================= */
const mnWander = e => (dt => { e.wtimer -= dt; if (e.wtimer <= 0) { e.wander = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.wtimer = 2 + Math.random() * 3; } });
function mnWand(e, dt) { mnWander(e)(dt); }
// rock the miners and the mole can dig through (never planks, beams, brick, the boss's gate or anything placed)
const MN_DIGGABLE = new Uint8Array(NT);
for (const t of [MN_FERROSA, MN_REJEITO, MN_ENTULHO, MN_CAVADA, MN_ESCORIA, MN_QUARTZITO]) MN_DIGGABLE[t] = 1;
const mnHall = (tx, ty) => typeof rgGuard === 'function' && rgGuard(tx, ty);
function mnDigOut(tx, ty, quiet) {
  const t = tileAt(tx, ty); if (!MN_DIGGABLE[t] || mnHall(tx, ty) || inVillage(tx, ty)) return false;
  setTile(tx, ty, AIR); burst((tx + 0.5) * T, (ty + 0.5) * T, quiet ? 4 : 8, PCOL[t] || '#6a4a3a', 60, 380, 0.5);
  return true;
}

// the dead miner: plods after you; a slow overhead blow with the pick; if rock is between you, he hacks his way through
AI.mineiro = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 800 * dt); if (e.stateT <= 0) { e.state = 'strike'; e.stateT = 0.35; const hb = { x: e.facing > 0 ? ecx - 2 : ecx - 22, y: e.y - 4, w: 24, h: e.h + 4 }; if (!pl.dead && overlap(hb, pl)) hurtPlayer(e.dmg, ecx, e, false); burst(ecx + e.facing * 14, e.y + e.h - 1, 6, '#ffe0a0', 80, 300, 0.25, 1, true); sfx.mnClank(); shake(1.5); } return; }
  if (e.state === 'strike') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.3 + Math.random() * 0.6; } return; }
  if (e.state === 'dig') {
    e.vx = 0;
    if (e.stateT <= 0) {
      const fx = Math.floor((e.facing > 0 ? e.x + e.w + 2 : e.x - 2) / T), y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 1) / T);
      let any = false; for (let ty = y0; ty <= y1; ty++) if (mnDigOut(fx, ty)) any = true;
      sfx.mnClank(); e.state = 'walk'; e.digCD = any ? 0.2 : 3;
    }
    return;
  }
  if (!aggro) mnWand(e, dt);
  e.digCD = (e.digCD || 0) - dt;
  let dir = aggro ? (Math.abs(dx) < 12 ? 0 : Math.sign(dx)) : e.wander;
  if (dir) e.facing = dir;
  walk(e, dt, dir, 26 + e.lvl, 400, 250, dy, aggro);
  if (!aggro) return;
  // blocked by rock with no way round: dig
  if (dir && e.hitWall && e.onGround && e.digCD <= 0 && !(e.nav && e.nav.steps <= 22) && Math.abs(dy) < 40) {
    const fx = Math.floor((e.facing > 0 ? e.x + e.w + 2 : e.x - 2) / T), y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 1) / T);
    let soft = false; for (let ty = y0; ty <= y1; ty++) if (MN_DIGGABLE[tileAt(fx, ty)] && !mnHall(fx, ty)) soft = true;
    if (soft) { e.state = 'dig'; e.stateT = 0.8; return; }
  }
  if (e.atkCD <= 0 && e.onGround && Math.abs(dx) < 24 && Math.abs(dy) < 20) { e.state = 'wind'; e.stateT = 0.6; e.facing = Math.sign(dx) || e.facing; sfx.mnGroan(); }
};

// the haunted cart: still as any other cart until you are level with it; then it rattles and comes for you
AI.carrinho = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'rattle') { e.vx = 0; if (Math.random() < dt * 20) parts.push({ x: ecx + rnd(-8, 8), y: e.y + 2, vx: rnd(-6, 6), vy: rnd(-30, -10), g: -20, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#62e0a8' : '#a8f0d0', size: 1, glow: true }); if (e.stateT <= 0) { e.state = 'charge'; e.stateT = 2.6; e.swingHit = false; sfx.mnRoll(); } return; }
  if (e.state === 'charge') {
    e.vx = e.facing * (230 + e.lvl * 5);
    if (Math.random() < dt * 30) parts.push({ x: ecx - e.facing * 10, y: e.y + e.h, vx: -e.facing * rnd(10, 40), vy: rnd(-30, -5), g: 300, life: 0.3, max: 0.3, col: '#ffd070', size: 1, glow: true });
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; const r = hurtPlayer(e.dmg, ecx - e.facing * 8, e, false); if (r === 'hit') { pl.vx = e.facing * 320; pl.vy = -200; } }
    if (e.hitWall) { e.state = 'crash'; e.stateT = 1.8; e.vx = -e.facing * 40; e.vy = -90; shake(4); sfx.slam && sfx.slam(); burst(ecx + e.facing * 12, e.y + 4, 14, '#764233', 110, 400, 0.6); burst(ecx, e.y, 6, '#f0c43a', 80, 400, 0.5); }
    else if (e.stateT <= 0) { e.state = 'brake'; e.stateT = 0.5; }
    return;
  }
  if (e.state === 'brake') { e.vx = approach(e.vx, 0, 600 * dt); if (Math.random() < dt * 40) burst(ecx - e.facing * 8, e.y + e.h, 1, '#ffd070', 60, 300, 0.2, 1, true); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1 + Math.random() * 0.8; } return; }
  if (e.state === 'crash') { e.vx = approach(e.vx, 0, 300 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.2 + Math.random() * 0.6; } return; }
  e.vx = approach(e.vx, 0, 400 * dt);
  if (aggro && e.atkCD <= 0 && e.onGround && Math.abs(dy) < 20 && Math.abs(dx) > 24 && Math.abs(dx) < 240 && clearPath(e, pl)) { e.facing = Math.sign(dx) || e.facing; e.state = 'rattle'; e.stateT = 0.7; sfx.mnRattle(); }
};

// firedamp: drifts after you and blows up next to you; fire or a blow sets it off early
const mnBooms = [];
AI.grisu = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'swell') { const k = Math.pow(0.05, dt); e.vx *= k; e.vy *= k; if (Math.random() < dt * 20) parts.push({ x: e.x + e.w / 2 + rnd(-8, 8), y: e.y + e.h / 2 + rnd(-6, 6), vx: rnd(-10, 10), vy: rnd(-20, 0), g: 0, life: 0.3, max: 0.3, col: '#ffd070', size: 1, glow: true }); if (e.stateT <= 0) mnGasBoom(e); return; }
  let tx, ty;
  if (aggro) { tx = dx; ty = dy - 4 + Math.sin(e.t * 1.3 + e.seed) * 10; }
  else { tx = Math.cos(e.t * 0.4 + e.seed) * 40; ty = Math.sin(e.t * 0.7 + e.seed) * 20; }
  const d = Math.hypot(tx, ty) || 1, sp = aggro ? 30 + e.lvl : 12, k = Math.min(1, dt * 1.2);
  e.vx = lerp(e.vx, tx / d * sp, k); e.vy = lerp(e.vy, ty / d * sp, k);
  if (e.hitWall) e.vx *= -1; if (e.hitCeil || e.onGround) e.vy *= -1;
  if (Math.random() < dt * 4) parts.push({ x: e.x + e.w / 2 + rnd(-6, 6), y: e.y + e.h / 2 + rnd(-4, 4), vx: rnd(-4, 4), vy: rnd(-8, -2), g: 0, life: 1, max: 1, col: Math.random() < 0.5 ? '#aaa85c' : '#c6c478', size: 1 });
  if (aggro && dist < 26) mnLight(e, 0.9);
  // a torch nearby sets it off
  e.fireT = (e.fireT || 0) - dt;
  if (e.fireT <= 0) { e.fireT = 0.25; const tx0 = Math.floor((e.x + e.w / 2) / T), ty0 = Math.floor((e.y + e.h / 2) / T); for (let y = ty0 - 1; y <= ty0 + 1; y++) for (let x = tx0 - 1; x <= tx0 + 1; x++) if (tileAt(x, y) === TORCH) { mnLight(e, 0.3); return; } }
};
function mnLight(e, t) { if (e.dead || e.state === 'swell') return; e.state = 'swell'; e.stateT = t; sfx.mnHiss(); }
function mnGasBoom(e) {
  if (e.boomed) return; e.boomed = true;
  const x = e.x + e.w / 2, y = e.y + e.h / 2, R = 40;
  if (!e.dead) { e.dead = true; e.hp = 0; }
  mnBooms.push({ x, y, t: 0.4 });
  burst(x, y, 30, '#ffb040', 170, 100, 0.55, 1, true); burst(x, y, 14, '#e2e09a', 90, -30, 0.9, 2); burst(x, y, 10, '#4a4440', 60, -40, 1.2, 2);
  shake(6); sfx.gbBoom ? sfx.gbBoom() : sfx.slam && sfx.slam();
  if (!pl.dead && Math.hypot(pl.x + pl.w / 2 - x, pl.y + pl.h / 2 - y) < R + 4) hurtPlayer(e.dmg, x, null, true);
  for (const o of enemies) {
    if (o === e || o.dead || o.boss || ET[o.type].boss) continue;
    const d = Math.hypot(o.x + o.w / 2 - x, o.y + o.h / 2 - y); if (d > R + 6) continue;
    if (o.type === 'grisu') { mnLight(o, 0.15 + d / 400); continue; }   // one sets off the next
    o.hp -= Math.round(e.dmg * 0.8); o.flash = 0.12; o.showHp = 2; o.vx += Math.sign(o.x + o.w / 2 - x) * 140;
    if (o.hp <= 0) killEnemy(o);
  }
}

// the haunted lantern: floats out of reach and throws fire
AI.lampiao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'cast') {
    const k = Math.pow(0.03, dt); e.vx *= k; e.vy *= k; e.facing = dx > 0 ? 1 : -1;
    if (Math.random() < dt * 30) parts.push({ x: e.x + e.w / 2 + rnd(-4, 4), y: e.y + rnd(2, 10), vx: rnd(-10, 10), vy: rnd(-30, -5), g: 0, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#ffd070' : '#ff8a2a', size: 1, glow: true });
    if (e.stateT <= 0) { fireball(e.x + e.w / 2, e.y + e.h / 2, 150, e.dmg); e.state = 'walk'; e.retreat = 0.7; e.atkCD = 2 + Math.random() * 0.9; }
    return;
  }
  let tx, ty;
  if (e.retreat > 0) { e.retreat -= dt; tx = -Math.sign(dx) * 50; ty = -20; }
  else if (aggro && dist < 240) { const want = dist < 80 ? -1 : dist > 150 ? 1 : 0; tx = dx * want + Math.cos(e.t * 0.8 + e.seed) * 36; ty = dy - 50 + Math.sin(e.t * 1.6) * 12; }
  else { tx = Math.cos(e.t * 0.5 + e.seed) * 50; ty = Math.sin(e.t * 0.9 + e.seed) * 24; }
  const d = Math.hypot(tx, ty) || 1, sp = aggro ? 52 : 22, k = Math.min(1, dt * 2);
  e.vx = lerp(e.vx, tx / d * sp, k); e.vy = lerp(e.vy, ty / d * sp, k);
  if (Math.abs(e.vx) > 3) e.facing = e.vx > 0 ? 1 : -1;
  if (e.hitWall) e.vx *= -1; if (e.hitCeil || e.onGround) e.vy *= -1;
  if (Math.random() < dt * 8) parts.push({ x: e.x + e.w / 2 + rnd(-2, 2), y: e.y + e.h, vx: rnd(-4, 4), vy: rnd(4, 12), g: 0, life: 0.6, max: 0.6, col: '#62e0a8', size: 1, glow: true });
  if (aggro && e.atkCD <= 0 && dist < 200 && losClear(e.x + e.w / 2, e.y + 6, pl.x + pl.w / 2, pl.y + pl.h / 2)) { e.state = 'cast'; e.stateT = 0.55; sfx.mnFlare(); }
};

// the false vein: sits in the floor like gold ore; opens when you come close, bites, hops after you, settles again
AI.falsoveio = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'walk') { e.state = 'hide'; e.x = Math.round(e.x / T) * T + (T - e.w) / 2; }
  if (e.state === 'hide') {
    e.vx = 0;
    if (Math.random() < dt * 0.6) parts.push({ x: e.x + rnd(2, e.w - 2), y: e.y + rnd(2, e.h - 2), vx: 0, vy: 0, g: 0, life: 0.5, max: 0.5, col: '#fff6c8', size: 1, glow: true });   // a glint, like any ore
    if (!pl.dead && dist < 30) { e.state = 'open'; e.stateT = 0.3; e.facing = Math.sign(dx) || e.facing; sfx.mnGrind(); }
    return;
  }
  if (e.state === 'open') { e.vx = 0; if (e.stateT <= 0) { e.state = 'bite'; e.swingHit = false; e.vx = (Math.sign(dx) || e.facing) * 150; e.vy = -170; e.stateT = 0.8; sfx.mnChomp(); } return; }
  if (e.state === 'bite' || e.state === 'chase') {
    if (!e.swingHit && !pl.dead && overlap(e, pl)) { e.swingHit = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); }
    if (e.onGround) {
      e.vx = approach(e.vx, 0, 900 * dt);
      if (e.state === 'bite' && e.stateT <= 0.5) { e.state = 'chase'; e.stateT = 6; e.hopT = 0.6; }
      if (e.state === 'chase') {
        e.hopT -= dt; e.lostT = dist > 120 || !aggro ? (e.lostT || 0) + dt : 0;
        if (e.hopT <= 0 && aggro) { e.facing = Math.sign(dx) || e.facing; e.vx = e.facing * (90 + e.lvl * 2); e.vy = -150; e.hopT = 1 + Math.random() * 0.4; e.swingHit = false; sfx.mnChomp(); }
        if (e.lostT > 2.5 || e.stateT <= 0) { e.state = 'hide'; e.x = Math.round(e.x / T) * T + (T - e.w) / 2; }
      }
    }
  }
};

// the ore golem: slow; slams the floor (the shock runs along it), tears out rocks and throws them
const mnRocks = [];
AI.golem = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'wind') { e.vx = approach(e.vx, 0, 600 * dt); if (e.stateT <= 0) { e.state = 'slam'; e.stateT = 0.5; mnSlam(e); } return; }
  if (e.state === 'slam') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.8 + Math.random() * 0.8; } return; }
  if (e.state === 'rip') { e.vx = 0; e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) { mnThrowRock(e, ecx - e.facing * 6, e.y + 4, Math.round(e.dmg * 0.7)); e.state = 'slam'; e.stateT = 0.4; } return; }
  if (!aggro) mnWand(e, dt);
  let dir = aggro ? (Math.abs(dx) < 16 ? 0 : Math.sign(dx)) : e.wander;
  if (dir) e.facing = dir;
  walk(e, dt, dir, 18 + e.lvl, 200, 200, dy, aggro);
  if (Math.abs(e.vx) > 4 && e.onGround) { e.stepT = (e.stepT || 0) - dt; if (e.stepT <= 0) { e.stepT = 0.33; sfx.mnStep(); if (dist < 140) shake(0.6); } }
  if (!aggro || e.atkCD > 0 || !e.onGround) return;
  if (Math.abs(dx) < 34 && Math.abs(dy) < 30) { e.state = 'wind'; e.stateT = 0.75; e.facing = Math.sign(dx) || e.facing; sfx.mnGroan(); }
  else if (Math.abs(dx) > 70 && dist < 230 && losClear(ecx, e.y + 4, pl.x + pl.w / 2, pl.y + 4)) { e.state = 'rip'; e.stateT = 0.7; burst(ecx - e.facing * 6, e.y + e.h, 10, '#764233', 70, 300, 0.5); sfx.mnGrind(); }
};
function mnSlam(e) {
  const ecx = e.x + e.w / 2, gy = e.y + e.h;
  shake(6); sfx.slam && sfx.slam();
  const hb = { x: e.facing > 0 ? ecx : ecx - 30, y: e.y, w: 30, h: e.h };
  let hit = false;
  if (!pl.dead && overlap(hb, pl)) { hurtPlayer(e.dmg, ecx, e, false); hit = true; }
  // the shock along the floor: hurts if you are standing on it
  if (!hit && !pl.dead && pl.onGround && Math.abs(pl.x + pl.w / 2 - ecx) < 96 && Math.abs(pl.y + pl.h - gy) < 10) { const r = hurtPlayer(Math.round(e.dmg * 0.5), ecx, null, true); if (r === 'hit') pl.vy = -180; }
  for (const d of [-1, 1]) for (let k = 1; k <= 6; k++) setTimeout(() => burst(ecx + d * k * 15, gy - 1, 3, '#8a6a52', 60, 300, 0.5), k * 40);
  for (let k = 0; k < 4; k++) { const tx = Math.floor(ecx / T) + ((Math.random() * 9) | 0) - 4, ty = Math.floor(e.y / T) - 1; let y = ty; while (y > ty - 10 && !solidAt(tx, y)) y--; if (solidAt(tx, y)) mnPebbles.push({ x: (tx + 0.5) * T, y: (y + 1) * T, vy: 0, t: 0 }); }   // dust and pebbles off the roof
}
const mnPebbles = [];
function mnThrowRock(e, ox, oy, dmg) {
  const tx = pl.x + pl.w / 2 + rnd(-6, 6), ty = pl.y + pl.h / 2, t = clamp(Math.abs(tx - ox) / 170, 0.45, 1.15), G = 420;
  mnRocks.push({ x: ox, y: oy, vx: (tx - ox) / t, vy: (ty - oy - 0.5 * G * t * t) / t, dmg, spin: 0, by: e });
  sfx.pswing && sfx.pswing();
}

// the mole rat: quick little bites; and it digs a tunnel straight through the rock to come up at you
AI.toupeira = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const ecx = e.x + e.w / 2;
  if (e.state === 'bite') { if (!e.swingHit && !pl.dead && overlap({ x: e.x - 3, y: e.y, w: e.w + 6, h: e.h }, pl)) { e.swingHit = true; hurtPlayer(e.dmg, ecx, e, false); } if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 0.9 + Math.random() * 0.5; e.retreat = 0.4; } return; }
  if (e.state === 'burrow') { e.vx = 0; if (Math.random() < dt * 30) burst(ecx + e.facing * 6, e.y + e.h, 1, '#6a4a3a', 60, 300, 0.4); if (e.stateT <= 0) { e.state = 'tunnel'; e.stateT = 3.5; e.digAcc = 0; sfx.mnDig(); } return; }
  if (e.state === 'tunnel') {
    // aim at the hero's feet, carve the way, cancel gravity
    const tx = pl.x + pl.w / 2 - ecx, ty = pl.y + pl.h - e.h / 2 - (e.y + e.h / 2), d = Math.hypot(tx, ty) || 1, sp = 80 + e.lvl * 2;
    const nx = e.x + tx / d * sp * dt, ny = e.y + ty / d * sp * dt;
    const x0 = Math.floor(nx / T), x1 = Math.floor((nx + e.w - 0.01) / T), y0 = Math.floor(ny / T), y1 = Math.floor((ny + e.h - 0.01) / T);
    let blocked = false;
    for (let y = y0; y <= y1 && !blocked; y++) for (let x = x0; x <= x1; x++) if (solidAt(x, y) && !MN_DIGGABLE[tileAt(x, y)]) { blocked = true; break; }
    if (blocked || mnHall(x0, y0)) { e.state = 'walk'; e.atkCD = 2.5; return; }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (solidAt(x, y)) mnDigOut(x, y, true);
    e.x = nx; e.y = ny; e.vx = 0; e.vy = -GRAV * dt; e.facing = Math.sign(tx) || e.facing;
    if (Math.random() < dt * 20) burst(ecx, e.y + e.h / 2, 1, '#6a4a3a', 50, 300, 0.4);
    e.digAcc += dt; if (e.digAcc > 0.35) { e.digAcc = 0; sfx.mnDig(); }
    if (!pl.dead && overlap(e, pl)) { e.state = 'bite'; e.stateT = 0.3; e.swingHit = false; e.vy = -120; return; }
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2; }
    return;
  }
  if (!aggro) mnWand(e, dt);
  let dir = aggro ? (e.retreat > 0 ? -Math.sign(dx) : Math.abs(dx) < 8 ? 0 : Math.sign(dx)) : e.wander;
  if (e.retreat > 0) e.retreat -= dt;
  if (dir) e.facing = dir;
  walk(e, dt, dir, 56 + e.lvl * 2, 900, 260, dy, aggro);
  if (!aggro || e.atkCD > 0 || !e.onGround) return;
  if (Math.abs(dx) < 18 && Math.abs(dy) < 12) { e.state = 'bite'; e.stateT = 0.3; e.swingHit = false; e.facing = Math.sign(dx) || e.facing; e.vx = e.facing * 120; sfx.mnSqueak(); }
  else if (dist > 40 && dist < 170 && !(e.nav && e.nav.steps <= 14) && (Math.abs(dy) > 24 || !clearPath(e, pl))) { e.state = 'burrow'; e.stateT = 0.5; e.facing = Math.sign(dx) || e.facing; sfx.mnSqueak(); }
};

/* ---------- blows, deaths, the projectiles ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && !e.dead) {
    if (e.type === 'carrinho' && e.state === 'crash') mult *= 1.6;
    if (e.type === 'falsoveio' && e.state === 'hide') { e.state = 'open'; e.stateT = 0.15; }
    if (e.type === 'grisu') mnLight(e, 0.25);
  }
  return _hit(e, dir, mult, melee);
}; }
{ const _k = killEnemy; killEnemy = function (e) { const r = _k(e); if (e.type === 'grisu' && !e.boomed) mnGasBoom(e); return r; }; }
function mnbUpdate(dt) {
  // the lantern's fire (and any fire) lights the gas
  if (enemies.some(e => e.type === 'grisu' && !e.dead)) {
    for (const p of projs) { if (p.kind !== 'fire') continue; for (const e of enemies) if (e.type === 'grisu' && !e.dead && e.state !== 'swell' && Math.hypot(p.x - (e.x + e.w / 2), p.y - (e.y + e.h / 2)) < 12) { mnLight(e, 0.05); p.life = 0; } }
    for (const l of enemies) if (l.type === 'lampiao' && !l.dead) for (const e of enemies) if (e.type === 'grisu' && !e.dead && overlap(l, e)) mnLight(e, 0.1);
  }
  for (let i = mnBooms.length - 1; i >= 0; i--) { mnBooms[i].t -= dt; if (mnBooms[i].t <= 0) mnBooms.splice(i, 1); }
  // rocks thrown by the golem
  for (let i = mnRocks.length - 1; i >= 0; i--) {
    const r = mnRocks[i]; r.vy = Math.min(r.vy + 420 * dt, 420); r.x += r.vx * dt; r.y += r.vy * dt; r.spin += dt * 10;
    let end = solidAt(Math.floor(r.x / T), Math.floor(r.y / T));
    if (!end && !pl.dead && r.x > pl.x - 3 && r.x < pl.x + pl.w + 3 && r.y > pl.y - 3 && r.y < pl.y + pl.h + 3) { hurtPlayer(r.dmg, r.x - Math.sign(r.vx) * 4, null, true); end = true; }
    if (end) { burst(r.x, r.y, 12, '#764233', 100, 400, 0.5); burst(r.x, r.y, 4, '#f0c43a', 60, 400, 0.4); sfx.mnCrumble(); mnRocks.splice(i, 1); }
  }
  // pebbles shaken off the roof (a little damage)
  for (let i = mnPebbles.length - 1; i >= 0; i--) {
    const p = mnPebbles[i]; p.t += dt; p.vy = Math.min(p.vy + 500 * dt, 380); p.y += p.vy * dt;
    if (!pl.dead && p.x > pl.x - 2 && p.x < pl.x + pl.w + 2 && p.y > pl.y && p.y < pl.y + pl.h) { hurtPlayer(2, p.x, null, true); mnPebbles.splice(i, 1); continue; }
    if (solidAt(Math.floor(p.x / T), Math.floor(p.y / T)) || p.t > 2) { burst(p.x, p.y, 3, '#5a4234', 40, 300, 0.3); mnPebbles.splice(i, 1); }
  }
}
HOOK.update.push(mnbUpdate);
HOOK.drawTop.push((cx, cy) => {
  for (const r of mnRocks) { const x = Math.round(r.x) - cx, y = Math.round(r.y) - cy, o = Math.floor(r.spin) % 2; lc.fillStyle = '#140c0b'; lc.fillRect(x - 3, y - 3, 6, 6); lc.fillStyle = '#593026'; lc.fillRect(x - 2, y - 2, 4, 4); lc.fillStyle = '#925845'; lc.fillRect(x - 2 + o, y - 2, 2, 2); lc.fillStyle = '#f0c43a'; lc.fillRect(x + 1 - o, y + 1, 1, 1); }
  for (const p of mnPebbles) { const x = Math.round(p.x) - cx, y = Math.round(p.y) - cy; lc.fillStyle = '#3e211c'; lc.fillRect(x - 1, y - 1, 2, 2); lc.fillStyle = '#764233'; lc.fillRect(x - 1, y - 1, 1, 1); }
});
HOOK.drawGlow.push((cx, cy) => {
  const G = MNB.GL;
  for (const b of mnBooms) { lc.globalAlpha = b.t / 0.4; lc.drawImage(G.boom, b.x - cx - 44, b.y - cy - 44); }
  for (const e of enemies) {
    if (e.dead) continue;
    const x = e.x + e.w / 2 - cx, y = e.y + e.h / 2 - cy;
    if (e.type === 'lampiao') { lc.globalAlpha = e.state === 'cast' ? 0.95 : 0.7; lc.drawImage(G.warm, x - 16, y - 16); }
    else if (e.type === 'grisu') { lc.globalAlpha = e.state === 'swell' ? 0.9 : 0.25; lc.drawImage(e.state === 'swell' ? G.warm : G.gas, x - 16, y - 16); }
    else if (e.type === 'mineiro') { lc.globalAlpha = 0.35; lc.drawImage(G.warm, x + e.facing * 4 - 16, e.y - cy - 2 - 16); }
    else if (e.type === 'carrinho' && e.state !== 'walk' && e.state !== 'crash') { lc.globalAlpha = 0.55; lc.drawImage(G.ghost, x - 14, e.y - cy - 4 - 14); }
    else if (e.type === 'golem') { lc.globalAlpha = 0.4; lc.drawImage(G.core, x - e.facing * 1 - 10, y - 10); }
  }
  lc.globalAlpha = 1;
});
// the false vein starts hidden; the mine's lanterns light the way they float
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (e && type === 'falsoveio') { e.state = 'hide'; e.x = Math.round(e.x / T) * T + (T - e.w) / 2; }
  return e;
}; }
function clearMnbFx() { mnBooms.length = 0; mnRocks.length = 0; mnPebbles.length = 0; }
{ const _nw = newWorld; newWorld = function (sd, sv) { clearMnbFx(); return _nw(sd, sv); }; }

/* ---------- sounds ---------- */
Object.assign(sfx, {
  mnClank() { tone(620, 0.08, 'square', 0.04, -300); noise(0.08, 0.06, 2400, 'highpass'); },
  mnGroan() { tone(110, 0.5, 'sawtooth', 0.03, -40); tone(140, 0.45, 'triangle', 0.025, -50, 0.05); },
  mnRattle() { for (let k = 0; k < 6; k++) noise(0.04, 0.05, 1600, 'bandpass', k * 0.1); },
  mnRoll() { tone(70, 0.8, 'sawtooth', 0.04, -10); noise(0.9, 0.05, 600, 'lowpass'); tone(1800, 0.3, 'square', 0.012, -900, 0.1); },
  mnHiss() { noise(0.5, 0.06, 3000, 'highpass'); },
  mnFlare() { noise(0.3, 0.06, 900, 'bandpass'); tone(300, 0.25, 'triangle', 0.025, 200); },
  mnGrind() { noise(0.35, 0.07, 400, 'lowpass'); tone(80, 0.3, 'square', 0.02, -20); },
  mnChomp() { noise(0.06, 0.08, 1200, 'lowpass'); tone(160, 0.06, 'square', 0.03, -80); },
  mnStep() { tone(55, 0.18, 'sine', 0.06, -20); noise(0.12, 0.04, 300, 'lowpass'); },
  mnCrumble() { noise(0.25, 0.07, 700, 'lowpass'); },
  mnDig() { noise(0.12, 0.05, 900, 'lowpass'); tone(200, 0.05, 'square', 0.015, -100); },
  mnSqueak() { tone(1800, 0.08, 'square', 0.02, 600); tone(2200, 0.06, 'square', 0.015, -400, 0.06); }
});
