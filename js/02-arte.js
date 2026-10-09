'use strict';

/* ================= sprite toolkit ================= */
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function fromRows(rows, pal) { const h = rows.length, w = rows[0].length; const c = mk(w, h), x = c.getContext('2d'); for (let y = 0; y < h; y++) { const r = rows[y]; for (let i = 0; i < r.length; i++) { const col = pal[r[i]]; if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); } } } return c; }
function outline(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data, n = w * h; const a = new Uint8Array(n);
  for (let i = 0; i < n; i++) a[i] = d[i * 4 + 3] > 60 ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (a[i]) continue; if ((x > 0 && a[i - 1]) || (x < w - 1 && a[i + 1]) || (y > 0 && a[i - w]) || (y < h - 1 && a[i + w])) { const j = i * 4; d[j] = 20; d[j + 1] = 13; d[j + 2] = 20; d[j + 3] = 255; } }
  ctx.putImageData(img, 0, 0);
}
function outlined(src) { const c = mk(src.width + 2, src.height + 2), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 1, 1); outline(x, c.width, c.height); return c; }
function flip(src) { const c = mk(src.width, src.height), x = c.getContext('2d'); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c; }
function whiteOf(src) { const c = mk(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); return c; }
function set4(rows, pal) { const o = outlined(fromRows(rows, pal)); const l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; }
function rowsU32(rows, pal) { const a = new Uint32Array(64); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const c = pal[rows[y][x]]; a[y * 8 + x] = c ? ph(c) : 0; } return a; }
function glow(r, col) { const c = mk(r * 2, r * 2), x = c.getContext('2d'); const g = x.createRadialGradient(r, r, 0, r, r, r); const [R, G, B] = rgb(col); g.addColorStop(0, `rgba(${R},${G},${B},1)`); g.addColorStop(0.35, `rgba(${R},${G},${B},0.4)`); g.addColorStop(1, `rgba(${R},${G},${B},0)`); x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c; }

/* ================= sprite art (all hand-placed pixels) ================= */
// Warrior, facing right. 12 wide. Upper body rows 0-17, legs rows 18-21.
const PBODY = [
  "....hhhh....",
  "...hhHHhh...",
  "..hhHhhhhh..",
  "..hhhhssss..",
  "..hhhsssess.",
  "..hhssssss..",
  "...hsSsss...",
  "....SSss....",
  "....rSsr....",
  "...rrrrrr...",
  "..rrrrrrrr..",
  "..Rrrrrrrr..",
  "..Rrrrrrrr..",
  "..bbbbbbBb..",
  "..RrrrrrRr..",
  "..RRrrrrrr..",
  ".RRrrrrrrrr.",
  ".DRRrrrrRRD."
];
const ZBODY = [
  "....hhhh....",
  "...hhHhhh...",
  "..hhHhhhhh..",
  "..hhhhssss..",
  "..hhhsssess.",
  "..hhssssss..",
  "...hsSsss...",
  "....SSss....",
  "....rSsr....",
  "...rrrrrr...",
  "..rrrrsrrr..",
  "..Rrrrrrrr..",
  "..Rrrsrrrr..",
  "..bbbbbbBb..",
  "..RrrrrrRr..",
  "..RRrrrr.r..",
  ".RRrrr.rrrr.",
  ".D.RrrrR.RD."
];
const SKBODY = [
  "....oooo....",
  "...oooooo...",
  "..oooooooo..",
  "..oooooxxo..",
  "..ooooOxxo..",
  "..Ooooooooo.",
  "...OoxoxO...",
  "....oooo....",
  ".....oo.....",
  "...oooooo...",
  "...o.oo.o...",
  "...oooooo...",
  "...o.oo.o...",
  "...oooooo...",
  ".....oo.....",
  ".....oo.....",
  "...oOOOOo...",
  "...oO..Oo..."
];
const LEGS = {
  idle: ["...SS..ss...", "...SS..ss...", "...SS..ss...", "...SSS.sss.."],
  w0: ["...SS..ss...", "..SS....ss..", "..SS....ss..", ".SSS....sss."],
  w1: ["....Sss.....", "....SSss....", "....SSsss...", "...SSS......"],
  w2: ["...ss..SS...", "..ss....SS..", "..ss....SS..", ".sss....SSS."],
  w3: ["....sSS.....", "....ssSS....", "....ssSSS...", "...sss......"],
  jump: ["...SS.ss....", "..SS...ss...", "..SSS..sss..", "............"]
};
const WALK = ['w0', 'w1', 'w2', 'w3'];
const PC = { h: '#4a2c17', H: '#71472a', s: '#eab58c', S: '#c4855e', e: '#2a1a22', r: '#d6c39a', R: '#a8946b', D: '#7c6a4b', b: '#7b4f2c', B: '#b47c45' };
const ZC = { h: '#263021', H: '#3a4630', s: '#8bae72', S: '#5f8452', e: '#ff3b3b', r: '#5a6f95', R: '#425275', D: '#2f3b57', b: '#3a2c22', B: '#5a4532' };
const SKC = { o: '#ece4cf', O: '#b5aa92', x: '#1a1420', s: '#e6dcc4', S: '#b5aa92' };

const SWORD = [
  "..w..",
  ".wWl.",
  ".wWl.",
  ".wWl.",
  ".wWl.",
  ".wWl.",
  ".wWl.",
  ".wWl.",
  ".wWl.",
  "gGGGg",
  "..h..",
  "..h..",
  "..p.."
];
const SWORD_P = { w: '#f2f6fa', W: '#bac7d3', l: '#7f8d9b', g: '#c0903f', G: '#7f5a24', h: '#5a3520', p: '#cf9c42' };
const SWORD_SK = { w: '#cdbb9c', W: '#9c8466', l: '#6b5440', g: '#5a4a3a', G: '#3d3128', h: '#3b2a20', p: '#5a4a3a' };
const SHIELD_FACE = [
  "..ooo..",
  ".owWwo.",
  "oWwWwWo",
  "oWwmwWo",
  "oWmMmWo",
  "oWwmwWo",
  "oWwWwWo",
  ".owWwo.",
  "..ooo.."
];
const SHIELD_SIDE = [
  ".oo..",
  "oWwo.",
  "oWwo.",
  "oWwo.",
  "oWwom",
  "oWwoM",
  "oWwom",
  "oWwo.",
  "oWwo.",
  "oWwo.",
  ".oo.."
];
const SHIELD_PAL = { o: '#4d4a50', W: '#9a6234', w: '#bf8048', m: '#a4a6ad', M: '#eef0f4' };
// pickaxe held upright (head on top, grip at row 11 like the sword) and a diagonal one for the icon
const PICK = [
  "..aMMMa..",
  ".aMmmmMa.",
  "aMm.h.mMa",
  "Mm..h..mM",
  "m...h...m",
  "....h....",
  "....h....",
  "....h....",
  "....h....",
  "....h....",
  "....H....",
  "....H....",
  "....H...."
];
const PICK_ICON = ["......MMMMM.", "....MMmmmmMM", "...amm...hmM", "..a.....h.mM", ".......h..mM", "......h...mM", ".....h...mM.", "....h....mM.", "...h.....a..", "..H.....a...", ".H..........", "............"];
const PICK_P = { M: '#dfe6ee', m: '#7f8d9b', a: '#aeb9c5', h: '#9a6a3c', H: '#5f3a20' };

const SLIME = [
  "....gggg....",
  "..ggLLgggg..",
  ".gLLggggggg.",
  ".gLgggggggg.",
  "ggggggeggegg",
  "ggggggeggegg",
  "gggggggggggg",
  "GgggggggggGG",
  ".GGGGGGGGGG."
];
const SLIME_PALS = [
  { g: '#5ccf4f', G: '#2f8a3a', L: '#d3f9bd', e: '#14301a' },
  { g: '#4fa8e0', G: '#2a5f9e', L: '#cdeeff', e: '#0f2238' },
  { g: '#e0584f', G: '#9a2a2f', L: '#ffc9bd', e: '#3a0f12' },
  { g: '#a463e0', G: '#5f2f9e', L: '#ead3ff', e: '#200f38' }
];
const SLIME_BLOOD = ['#5ccf4f', '#4fa8e0', '#e0584f', '#a463e0'];
const BAT_A = [
  "K.............K",
  "Kk...........kK",
  "Kkk..b...b..kkK",
  ".Kkk.bbbbb.kkK.",
  "..KkkbebebkkK..",
  "...KKbbbbbKK...",
  "......bbb......",
  ".......b......."
];
const BAT_B = [
  "...............",
  "...............",
  ".....b...b.....",
  ".....bbbbb.....",
  "...kkbebebkk...",
  ".KkkkbbbbbkkkK.",
  "KkkK..bbb..KkkK",
  "KK.....b.....KK"
];
const BAT_PAL = { K: '#2b1f36', k: '#5d4672', b: '#46355a', e: '#ff5a4a' };
const LURK_A = [
  ".....mmmm.....",
  "...mmMMMMmm...",
  "..mMMmmmmMMm..",
  ".mMmmwwwwmmMm.",
  ".mMmwwwwwwmMm.",
  "mMmwwwppwwwmMm",
  "mMmwwpPPpwwmMm",
  "mMmwwwppwwwmMm",
  ".mMmwwwwwwmMm.",
  ".mmMmwwwwmMmm.",
  "..mmMMmmMMmm..",
  "..m.mm..mm.m..",
  ".m..m.mm.m..m.",
  "....m....m...."
];
const LURK_B = LURK_A.slice(0, 11).concat([
  "..mm.m..m.mm..",
  "...m.m..m.m...",
  "..m...mm...m.."
]);
const LURK_PAL = { m: '#2a1638', M: '#4d2c68', w: '#eadaa8', p: '#b0122a', P: '#ff5d78' };
// ---- crypt & demon art (hand-placed pixels) ----
const ART_IMP_A = ["WW.........WW", "WwW..H.H..WwW", ".WwW.rrrr.WwW", "..WwrRrryry..", "...wrrrrrrr..", "....rRrkkr...", "...t.rrrrr...", "..t...r..r...", ".tt.........."], ART_IMP_A_P = { W: '#2a0a10', w: '#6e1a22', H: '#e8d8b0', r: '#c8402a', R: '#ff7a5a', y: '#ffe14a', k: '#3a0a08', t: '#8e2018' };
const ART_IMP_B = [".............", ".....H.H.....", ".....rrrr....", "....rRrryry..", "WWwrrrrrrrwWW", "WwwrRrkkrwwwW", "...t.rrrrr...", "..t...r..r...", ".tt.........."], ART_IMP_B_P = { W: '#2a0a10', w: '#6e1a22', H: '#e8d8b0', r: '#c8402a', R: '#ff7a5a', y: '#ffe14a', k: '#3a0a08', t: '#8e2018' };
const ART_HOUND_A = ["............kk..", "...f.f.f...kbbk.", "..fFfFfFf.kbbebk", ".tkbbbbbbbkbbbbb", "tFkbBBbbbbbbbbkk", ".tkbbbbbbbbbbk..", "...bb.....bb....", "..bb.......bb...", "..k.........k..."], ART_HOUND_A_P = { k: '#14080a', b: '#3a1418', B: '#5a2024', f: '#ff7a1a', F: '#ffd27a', e: '#ffe14a', t: '#c0300a' };
const ART_HOUND_B = ["............kk..", "...f.f.f...kbbk.", "..fFfFfFf.kbbebk", ".tkbbbbbbbkbbbbb", "tFkbBBbbbbbbbbkk", ".tkbbbbbbbbbbk..", "....bb...bb.....", "....b.b..b.b....", "....k..k.k..k..."], ART_HOUND_B_P = { k: '#14080a', b: '#3a1418', B: '#5a2024', f: '#ff7a1a', F: '#ffd27a', e: '#ffe14a', t: '#c0300a' };
const ART_CANDLE = ["............", "............", ".w...w...w..", ".w...w...w..", ".W...W...W..", "gGg.gGg.gGg.", ".g...g...g..", ".gg..g..gg..", "..ggggggg...", ".....G......", "....gGg.....", "...gGGGg...."], ART_CANDLE_P = { w: '#e8dcc0', W: '#b8a888', g: '#b08a3a', G: '#6e5420' };
const ART_CANDLE2 = ["............", "............", "............", ".....w......", ".....w......", ".....W......", "....gGg.....", ".....g......", ".....g......", ".....G......", "....gGg.....", "...gGGGg...."], ART_CANDLE2_P = { w: '#e8dcc0', W: '#b8a888', g: '#b08a3a', G: '#6e5420' };
const ART_CHAIN = [".....O......", "....o.o.....", "....o.o.....", "....o.o.....", ".....O......", ".....o......", ".....O......", "....o.o.....", "....o.o.....", "....o.o.....", ".....O......", ".....o......"], ART_CHAIN_P = { o: '#4a4e58', O: '#8a8f9a' };
const ART_CHAIN_END = [".....O......", "....o.o.....", "....o.o.....", "....o.o.....", ".....O......", ".....o......", ".....oO.....", "......o.....", "...o..o.....", "...o..o.....", "....oo......", "............"], ART_CHAIN_END_P = { o: '#4a4e58', O: '#8a8f9a' };
const ART_BANNER_T = [".kkkkkkkkkk.", "..rRrrrrRr..", "..rrrrrrrr..", "..rrrrrrrr..", "..ryrrrryr..", "..rryrryrr..", "..rrryyrrr..", "..rryyyyrr..", "..rryrryrr..", "..rrryyrrr..", "..rrrrrrrr..", "..rRrrrrrr.."], ART_BANNER_T_P = { k: '#2a2630', r: '#5e141c', R: '#7e222a', y: '#9a7a34' };
const ART_BANNER_B = ["..rrrrrrrr..", "..rrrrrrRr..", "..rrrrrrrr..", "..rr.rrr.r..", "..r..rr..r..", "......r.....", "............", "............", "............", "............", "............", "............"], ART_BANNER_B_P = { k: '#2a2630', r: '#5e141c', R: '#7e222a', y: '#9a7a34' };
const ART_WEB = ["wwwwwwwwww..", "w.w..w..w...", "ww.www.w....", "w.w..ww.....", "w..w.w......", "ww..w.......", "w.ww........", "w.w.........", "ww..........", "w...........", "w...........", "............"], ART_WEB_P = { w: '#5c5c68' };
const ART_URN = ["............", "............", "............", "............", "....kkkk....", "....oOoo....", "...oOoooo...", "..oOooooOo..", "..oOyyyyoo..", "..ooooooOo..", "...oooooo...", "....kkkk...."], ART_URN_P = { k: '#2a1a12', o: '#7a4a30', O: '#a8704a', y: '#b08a3a' };
const ART_URN2 = ["............", "............", "............", "............", "............", ".....kk.....", "....oOoo....", "...oOoooo...", "...oyyyyo...", "...oOoooo...", "....oooo....", "....kkkk...."], ART_URN2_P = { k: '#1e1e24', o: '#4e525c', O: '#727886', y: '#7a2a2a' };
const ART_GATE = [".k..k..k..k.", ".m..m..m..m.", ".m..m..m..m.", "kmmmmmmmmmmk", ".m..m..m..m.", ".m..m..m..m.", ".m..m..m..m.", ".m..m..m..m.", "kmmmmmmmmmmk", ".m..m..m..m.", ".m..m..m..m.", ".k..k..k..k."], ART_GATE_P = { k: '#1c1c22', m: '#6a6e78' };
const ART_ALTAR = ["............", "............", "............", ".....rr.....", "....rRRr....", ".....rr.....", "..kkkkkkkk..", "..sSssssss..", "...ssssss...", "...sSssss...", "..ssssssss..", ".ssssssssss."], ART_ALTAR_P = { s: '#3a3446', S: '#544c64', k: '#16131c', r: '#ff3a2a', R: '#ffc0a0' };
const ART_DBODY = ["....hhhh....", "...hhhhhh...", "..hhsssshh..", "..hssssss...", "..hsssseess.", "..hssssss...", "...sSsss....", "....SSss....", "...SssssS...", "..sssssssss.", ".sSsssssssss", ".sSsssSssss.", "..SssssSss..", "..bbbbbbBb..", "..RrrrrrRr..", "..RRrrrrrr..", ".RRr.rrr.rr.", ".DR..rr..RD."], ART_DBODY_P = { h: '#1a0c0e', s: '#a8322a', S: '#7a1e1a', e: '#ffd23a', r: '#2e2220', R: '#1e1614', D: '#120c0a', b: '#4a3020', B: '#8a6038' };
const ART_DHORNS = ["..K......K..", "..Kk....kK..", "...Kk..kK..."], ART_DHORNS_P = { K: '#d8c8a8', k: '#8a7a5a' };
const ART_CLEAVER = ["..mmmm.", ".mMMMMm", ".mMMMMm", ".mMMMMm", ".mMMMMm", "..mMMMm", "...mMmm", "...h...", "...h...", "...h...", "...h...", "...H...", "...H...", "...H..."], ART_CLEAVER_P = { m: '#4a4e58', M: '#9aa0aa', h: '#4a2a18', H: '#2a1810' };
const ART_BBODY = ["....hhhh....", "...hhHHhh...", "..hhHhhhhh..", "..hhhhhhhh..", "..hhhhheeh..", "..hhhhhhhh..", "...hhhhhh...", "....SSss....", "...SssssS...", "..sssssssss.", ".sSsssssssss", ".sSsssSssss.", "..SsssssSs..", "..bbbbbbBb..", "..pppppppp..", "..Pppppppp..", ".PPpppppppp.", ".dPPppppPPd."], ART_BBODY_P = { h: '#121014', H: '#2a2630', e: '#ffd23a', s: '#8a2018', S: '#5e1410', b: '#2a1e1a', B: '#6a5a48', p: '#1c1618', P: '#141012', d: '#0c0a0a' };
const ART_BHORNS = [".K........K.", ".KK......KK.", "..KK....KK..", "...k....k..."], ART_BHORNS_P = { K: '#cfc2a4', k: '#7a6e58' };
const ART_AXE = ["....k....", "....kmm..", "....kMMm.", "....kMMMm", "....kMMMm", "....kMMMm", "....kMMm.", "....kmm..", "....k....", "....h....", "....h....", "....h....", "....h....", "....h....", "....H....", "....H....", "....H....", "....k...."], ART_AXE_P = { k: '#1c1c22', m: '#5a5e68', M: '#b8bec8', h: '#3a2214', H: '#24160c' };
const ART_ICO_HEART = ["rr.rr..", "rRrrrr.", "rRrrrrr", "rrrrrrr", ".rrrrr.", "..rrr..", "...r..."], ART_ICO_HEART_P = { r: '#a01a2a', R: '#ff6a7a' };
const ART_ICO_EMBER = ["...y....", "..yYy...", ".yYOYy..", ".yOROy..", "..ORO...", "...O...."], ART_ICO_EMBER_P = { y: '#ffd27a', Y: '#fff3b0', O: '#ff7a1a', R: '#c0300a' };
const ART_ICO_FANG = ["w......", "ww.....", ".ww....", ".wWw...", "..wWw..", "...wWw.", "....www"], ART_ICO_FANG_P = { w: '#ece4cf', W: '#b5aa92' };
const ART_ICO_HORN = ["......k.", "......Kk", ".....kKk", "....kKK.", "...kKKk.", "..kKKk..", ".kKKKk..", "kKKKk...", "kkkk...."], ART_ICO_HORN_P = { k: '#6e5a40', K: '#c8b48a' };
const DLEG_P = { S: '#7a1e1a', s: '#a8322a' }, BLEG_P = { S: '#141012', s: '#1c1618' };
// ---- undead art ----
const ART_BOW = [".w...", ".sw..", ".s.w.", ".s.w.", ".s..w", ".s..w", ".s..W", ".s..w", ".s..w", ".s.w.", ".s.w.", ".sw..", ".w..."], ART_BOW_P = { w: '#8a5a32', W: '#5f3a20', s: '#e8e0cc' };
const ART_SPEAR = [".M.", "MmM", "MmM", ".m.", ".k.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".H."], ART_SPEAR_P = { M: '#c8ced8', m: '#7a808a', k: '#3a2a1a', h: '#6a4628', H: '#3a2414' };
const ART_GHOST_A = ["....wwww....", "...wWWWWw...", "..wWWWWWWw..", "..wWkkWkkw..", "..wWkeWkew..", "..wWWWWWWw..", "...wWkkWw...", "w..wWkkWw..w", "Ww.wWWWWw.wW", ".WwwWWWWwwW.", "..wWWWWWWw..", "..wWWwWWWw..", "...wW.wWw...", "...w..wW....", "......w....."], ART_GHOST_A_P = { w: '#5a7890', W: '#b8d8ec', k: '#0a1018', e: '#7fe8ff' };
const ART_GHOST_B = ["....wwww....", "...wWWWWw...", "..wWWWWWWw..", "..wWkkWkkw..", "..wWkeWkew..", "..wWWWWWWw..", "...wWkkWw...", "...wWkkWw...", ".wwwWWWWwww.", "Ww.wWWWWw.wW", "w.wWWWWWWw.w", "..wWWWwWWw..", "...wWw.wW...", "....wW..w...", ".....w......"], ART_GHOST_B_P = { w: '#5a7890', W: '#b8d8ec', k: '#0a1018', e: '#7fe8ff' };
const ART_SKULL_A = ["..f..f..f..", ".fFf.fFf.f.", "..fFfFfFf..", "..ooooooo..", ".ooooooooo.", ".oxxooxxoo.", ".oxyooxyoo.", ".ooooOoooo.", "..oOoOoOo..", "..o.o.o.o.."], ART_SKULL_A_P = { f: '#ff7a1a', F: '#ffd27a', o: '#ece4cf', O: '#b5aa92', x: '#1a1014', y: '#ff8a2a' };
const ART_SKULL_B = [".f..f..f...", "..fFf.fFf..", ".fFfFfFfF..", "..ooooooo..", ".ooooooooo.", ".oxxooxxoo.", ".oxyooxyoo.", ".ooooOoooo.", "..oOoOoOo..", "..o.o.o.o.."], ART_SKULL_B_P = { f: '#ff7a1a', F: '#ffd27a', o: '#ece4cf', O: '#b5aa92', x: '#1a1014', y: '#ff8a2a' };
const ART_ICO_ECTO = ["..wWWw..", ".wWWWWw.", "wWWkWkWw", "wWWWWWWw", ".wWWWWw.", "..wWWw..", "...ww...", "....w..."], ART_ICO_ECTO_P = { w: '#5fa8b8', W: '#c8f4ff', k: '#2a5a6a' };
const ART_ICO_SKULL = ["..oooo..", ".oooooo.", "oxxooxxo", "oxyooxyo", "oooOOooo", ".oOoOoO.", ".o.o.o.."], ART_ICO_SKULL_P = { o: '#ece4cf', O: '#b5aa92', x: '#1a1014', y: '#ff8a2a' };

// 8x8 decorations
const TORCH_ROWS = ["........", "........", "........", "...yy...", "...ww...", "...ww...", "...WW...", "...WW..."];
const SHROOM_ROWS = ["........", "........", "..cccc..", ".cCccCc.", "cccccccc", "...ss...", "...ss...", "..ssss.."];
const TUFT_A = ["........", "........", "........", "........", "..g...g.", ".gG.g.g.", ".g.gG.Gg", "gG.gg.g."];
const TUFT_B = TUFT_A.map(r => r.split('').reverse().join(''));
const FLOWER_ROWS = ["........", "........", "...pp...", "..pYp...", "...pp...", "...g....", "..gg.g..", ".g.gGg.."];
