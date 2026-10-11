'use strict';

/* ================= plataforma de madeira =================
   Pedido do Jonathan (2026-10-11): uma tirinha de madeira do tamanho de um bloco para atravessar buracos e subir
   penhascos, como no Terraria. O herói passa por ela pulando de baixo e, caindo, para em cima dela.
   - Bloco PLAT (125, livre na faixa da mina; a bolsa de blocos mostra a plataforma na página da Superfície, logo
     depois da madeira). Não é sólido: luz, bichos e tiros passam; só o herói pisa nela.
   - Descer: S (ou seta para baixo) + pulo em cima da plataforma solta o herói por ela.
   - Coloca como bloco, e uma plataforma se apoia também na plataforma do lado, então dá para fazer uma ponte no ar.
   - Receita no Criar (235): 1 madeira = 8 plataformas. Picareta tira e devolve a plataforma.
   - Arte: tábua com veio e pregos; as pontas soltas ganham uma mão-francesa de ferro por baixo.
   Carrega depois do 235-criar e antes do 237-blocos (a bolsa precisa ver o item novo). */

const PLAT = 125;
DIG[PLAT] = 0.12; PCOL[PLAT] = '#8a5a32';
BLOCK_DROP[PLAT] = 'plataforma';
ITEMS.plataforma = { name: 'Plataforma', rar: 0, stack: 99, block: PLAT, desc: 'Uma tábua presa na parede. Você pula através dela por baixo e pisa em cima. S + pulo desce por ela.' };
CRAFT_RECIPES.push({ id: 'plataforma', n: 8, need: [['madeira', 1]] });
if (typeof SURF_OF !== 'undefined') SURF_OF.set(PLAT, 'madeira');

/* ---- arte: 12 x 12, a tábua nas 5 fileiras de cima ---- */
const PLAT_P = { o: '#1a0e08', d: '#3a2412', m: '#6b4424', g: '#5a381c', l: '#8a5a32', h: '#c4925a', k: '#120c08', i: '#4a4a52', I: '#7a7a86' };
const PLAT_TOP = ['oooooooooooo', 'hllhlllllhll', 'mgmkmmmgmkmm', 'dmmmmgmmmmdm', 'oooooooooooo'];
const platRows = (left, right) => {
  const r = PLAT_TOP.map(s => s.split(''));
  if (left) { r[0][0] = '.'; r[1][0] = 'o'; r[2][0] = 'o'; r[3][0] = 'o'; r[4][0] = '.'; }
  if (right) { r[0][11] = '.'; r[1][11] = 'o'; r[2][11] = 'o'; r[3][11] = 'o'; r[4][11] = '.'; }
  const rows = r.map(a => a.join(''));
  const br = ['............', '............', '............', '............', '............', '............', '............'];
  const put = (row, x, ch) => { br[row] = br[row].slice(0, x) + ch + br[row].slice(x + 1); };
  if (left) { put(0, 2, 'i'); put(1, 2, 'I'); put(1, 3, 'i'); put(2, 3, 'I'); put(2, 2, 'i'); put(3, 2, 'i'); }
  if (right) { put(0, 9, 'i'); put(1, 9, 'I'); put(1, 8, 'i'); put(2, 8, 'I'); put(2, 9, 'i'); put(3, 9, 'i'); }
  return rows.concat(br);
};
DECO[PLAT] = [platRows(false, false), platRows(true, false), platRows(false, true), platRows(true, true)].map(rows => rowsT(rows, PLAT_P));
const platSide = (x, y) => tileAt(x, y) === PLAT || solidAt(x, y);
DECO_PICK[PLAT] = (gx, gy, arr) => arr[(platSide(gx - 1, gy) ? 0 : 1) + (platSide(gx + 1, gy) ? 0 : 2)];

// ícone: duas tábuas, uma em cima da outra, com as mãos-francesas
{ const _mi = makeIcon; makeIcon = function (id) {
  if (id !== 'plataforma') return _mi(id);
  const rows = ['ooooooooooo', 'hllhllllhll', 'mgmkmmgmkmm', 'ooooooooooo', '.i.......i.', '.Ii.....iI.', '..I.....I..', 'ooooooooooo', 'hllhllllhll', 'mgmkmmgmkmm', 'ooooooooooo'];
  const c = mk(13, 13), x = c.getContext('2d'); x.drawImage(fromRows(rows, PLAT_P), 1, 1);
  const o = outlined(c); let url = ''; try { url = o.toDataURL(); } catch (e) { }
  return { cv: o, url };
}; }

/* ---- colocar: também apoia na plataforma do lado ---- */
let platPlacing = false;
{ const _cp = canPlace; canPlace = function (tx, ty) {
  if (_cp(tx, ty)) return true;
  if (!platPlacing) return false;
  if (ty < 1 || ty >= WH - 3 || inVillage(tx, ty)) return false;
  const t = tileAt(tx, ty); if (t !== AIR && t !== TUFT && t !== FLOWER && t !== WEB) return false;
  return tileAt(tx - 1, ty) === PLAT || tileAt(tx + 1, ty) === PLAT;
}; }
{ const _ph = placeHeld; placeHeld = function (held) {
  platPlacing = !!held && held.s.id === 'plataforma';
  try { return _ph(held); } finally { platPlacing = false; }
}; }

/* ---- pisar: só caindo, e só se os pés estavam em cima da tábua no começo do passo ---- */
function platUnder(e, y) {   // a fileira da tábua em que os pés tocam, ou -1
  const ty = Math.floor((y + e.h) / T), x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.001) / T);
  for (let tx = x0; tx <= x1; tx++) if (tileAt(tx, ty) === PLAT) return ty;
  return -1;
}
{ const _me = moveEntity; moveEntity = function (e, dt, step) {
  if (e !== pl) return _me(e, dt, step);
  const y0 = pl.y, b0 = y0 + pl.h;
  _me(e, dt, step);
  if ((pl.platDropT || 0) > 0 || pl.climb || pl.onGround || pl.vy < 0) return;
  const b1 = pl.y + pl.h; if (b1 < b0) return;
  // cada fileira cruzada pelos pés neste passo, de cima para baixo
  for (let ty = Math.ceil(b0 / T - 0.001); ty * T <= b1 + 0.01; ty++) {
    const top = ty * T, x0 = Math.floor(pl.x / T), x1 = Math.floor((pl.x + pl.w - 0.001) / T);
    let hit = false; for (let tx = x0; tx <= x1 && !hit; tx++) if (tileAt(tx, ty) === PLAT) hit = true;
    if (hit && b0 <= top + 0.01) { pl.y = top - pl.h; pl.vy = 0; pl.onGround = true; return; }
  }
}; }
// S + pulo em cima da plataforma: desce por ela em vez de pular
{ const _up = updatePlayer; updatePlayer = function (dt) {
  if (pl.platDropT > 0) pl.platDropT -= dt;
  const jump = pressed.Space || pressed.KeyW || pressed.ArrowUp, down = keys.KeyS || keys.ArrowDown;
  if (!pl.dead && jump && down && pl.onGround && !pl.climb && platUnder(pl, pl.y + 0.5) >= 0 && !rectSolid(pl.x, pl.y + 1, pl.w, pl.h)) {
    const s = [pressed.Space, pressed.KeyW, pressed.ArrowUp];
    pressed.Space = pressed.KeyW = pressed.ArrowUp = false; pl.jumpBuf = 0;
    pl.platDropT = 0.22; pl.onGround = false; pl.y += 1; pl.vy = Math.max(pl.vy, 40);
    try { return _up(dt); } finally { [pressed.Space, pressed.KeyW, pressed.ArrowUp] = s; }
  }
  return _up(dt);
}; }
