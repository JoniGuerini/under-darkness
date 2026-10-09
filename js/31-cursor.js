'use strict';

/* ================= cursor: a pixel-art pointer drawn by the game, and no web-page text selection =================
   The system cursor is hidden (css/cursor.css) and a small canvas follows the mouse instead, at the same pixel size
   as the interface art. It changes with what is under it:
   seta (default) · mao (anything clickable) · pega (carrying an item) · texto (typing fields)
   and, in the world: espada (over a monster) · picareta (over a block the pick can reach). */
(function makeCursor() {
  const PAL = {
    W: '#fff6dc', S: '#d2d6e0', s: '#8e8b9c', d: '#4c4658',
    G: '#f2c470', B: '#b07a34', D: '#5e3c14',
    R: '#e04848', r: '#8a1a24', L: '#8a5a32', l: '#4a2c16',
  };
  const OUT = '#0d0a10';
  // shapes are drawn without their outline: build() adds a 1-pixel black rim, so hot spots are given in fill coordinates
  const ART = {
    seta: { hot: [0, 0], rows: [
      'G.........',
      'GB........',
      'GSB.......',
      'GSsB......',
      'GSssB.....',
      'GSsssB....',
      'GSssssB...',
      'GSsssssB..',
      'GSssssssB.',
      'GSsRBBBDDD',
      'GSRrB.....',
      'GBD.GB....',
      'GD...GB...',
      '.....GsB..',
      '......GD..',
    ] },
    mao: { hot: [2, 0], rows: [
      '..WS......',
      '..Sd......',
      '..Sd......',
      '..Sd......',
      '..Sd......',
      '..SdWSWS..',
      '..SdSdSdWS',
      'WSSdsdsdSd',
      'SdSsssssSd',
      'SdSssssssd',
      '.SSssssssd',
      '.SsssssdD.',
      '..Sssssd..',
      '..BGGRGB..',
      '..DBBBBD..',
    ] },
    pega: { hot: [5, 8], rows: [
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..WSWSWS..',
      '..SdSdSdWS',
      'WSSdsdsdSd',
      'SdSsssssSd',
      'SdSssssssd',
      '.SSssssssd',
      '.SsssssdD.',
      '..Sssssd..',
      '..BGGRGB..',
      '..DBBBBD..',
    ] },
    espada: { hot: [0, 0], rows: [
      'Ws...........',
      'SSs..........',
      '.SSs.........',
      '..SSs........',
      '...SSs.......',
      '....SSs......',
      '.....SSs..G..',
      '......SSdGB..',
      '.......SdBD..',
      '......GBLlD..',
      '.....GBD.Ll..',
      '.....BD...Ll.',
      '...........RG',
      '...........GD',
    ] },
    picareta: { hot: [0, 3], rows: [
      '..WSSSs......',
      '.SsddSSs.....',
      'Ss....dSSs...',
      'S......LdSs..',
      '......Ll..Ss.',
      '.....Ll....S.',
      '....Ll.....s.',
      '...Ll........',
      '..Ll.........',
      '.Ll..........',
      'Dl...........',
    ] },
    texto: { hot: [3, 5], rows: [
      'GBB.BBD',
      '...B...',
      '...G...',
      '...B...',
      '...B...',
      '...G...',
      '...B...',
      '...B...',
      '...G...',
      '...B...',
      'GBB.BBD',
    ] },
  };
  // a little grit on the metal, like the rest of the interface art
  const grain = (x, y) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); };
  const DARKER = { S: 's', s: 'd', G: 'B', B: 'D', L: 'l' };
  function build(a) {
    const h = a.rows.length, w = Math.max(...a.rows.map(r => r.length));
    const c = document.createElement('canvas'); c.width = w + 2; c.height = h + 2;
    const g = c.getContext('2d');
    const at = (x, y) => (y >= 0 && y < h && x >= 0 && x < a.rows[y].length && a.rows[y][x] !== '.') ? a.rows[y][x] : null;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      let k = at(x, y);
      if (k) { if (DARKER[k] && grain(x, y) < 0.14) k = DARKER[k]; g.fillStyle = PAL[k]; }
      else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) g.fillStyle = OUT;
      else continue;
      g.fillRect(x + 1, y + 1, 1, 1);
    }
    // a soft drop shadow one pixel down-right, so the pointer reads on any background
    const o = document.createElement('canvas'); o.width = c.width + 1; o.height = c.height + 1;
    const og = o.getContext('2d'); og.globalAlpha = 0.35; og.filter = 'brightness(0)'; og.drawImage(c, 1, 1);
    og.filter = 'none'; og.globalAlpha = 1; og.drawImage(c, 0, 0);
    return { img: o, hx: a.hot[0] + 1, hy: a.hot[1] + 1 };
  }
  const SHAPE = {}; for (const k in ART) SHAPE[k] = build(ART[k]);
  window.CURSOR_ART = SHAPE;   // handy for previews
  window.cursorKind = () => kind;

  const cv = document.createElement('canvas'); cv.id = 'cursor'; cv.hidden = true;
  const cg = cv.getContext('2d');
  document.body.appendChild(cv);
  document.documentElement.classList.add('own-cursor');

  let kind = '', scale = 0, mx = -99, my = -99, over = null, inside = false, press = false;
  const CLICK = 'button:not(:disabled), .slot:not(.no), .pg, .pr, a[href], select, summary, label, [role="button"], .sbar, [data-click]';
  const TYPE = 'input:not([type="button"]):not([type="range"]):not([type="checkbox"]), textarea, [contenteditable="true"]';
  const pxScale = () => Math.max(2, Math.min(4, Math.round(S / dpr * 0.75)));

  function worldKind() {
    if (typeof pl === 'undefined' || pl.dead) return 'seta';
    const [wx, wy] = mouseWorld();
    if (typeof portalUnderMouse === 'function' && portalUnderMouse()) return 'mao';   // portal aberto: js/29-portal.js
    for (const e of enemies) if (!e.dead && wx >= e.x - 2 && wx <= e.x + e.w + 2 && wy >= e.y - 2 && wy <= e.y + e.h + 2) return 'espada';
    const tg = pl.target;
    if (tg && tg.dig && tg.inReach && tg.pick && !tg.chest) return 'picareta';
    return 'seta';
  }
  function pickKind() {
    if ((typeof held !== 'undefined' && held) || (typeof drag !== 'undefined' && drag && drag.moved)) return 'pega';
    const el = over;
    if (el && el.closest) {
      if (el.closest(TYPE)) return 'texto';
      if (el.closest(CLICK)) return press ? 'pega' : 'mao';
    }
    if (el === cvs && state === 'play') return worldKind();
    return 'seta';
  }
  function paint() {
    const k = pickKind(), sc = pxScale();
    if (k !== kind || sc !== scale) {
      kind = k; scale = sc; const s = SHAPE[k];
      cv.width = s.img.width * sc; cv.height = s.img.height * sc;
      cv.style.width = cv.width + 'px'; cv.style.height = cv.height + 'px';
      cg.imageSmoothingEnabled = false; cg.clearRect(0, 0, cv.width, cv.height); cg.drawImage(s.img, 0, 0, cv.width, cv.height);
    }
    const s = SHAPE[kind], dip = press && kind !== 'texto' ? scale >> 1 : 0;
    cv.style.transform = `translate(${mx - s.hx * scale + dip}px,${my - s.hy * scale + dip}px)`;
  }
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; over = e.target; if (!inside) { inside = true; cv.hidden = false; } paint(); }, { passive: true });
  addEventListener('pointerdown', e => { press = true; over = e.target; paint(); }, true);
  addEventListener('pointerup', () => { press = false; paint(); }, true);
  document.addEventListener('mouseleave', () => { inside = false; cv.hidden = true; });
  addEventListener('blur', () => { inside = false; press = false; cv.hidden = true; });
  // the world under a still mouse keeps changing (monsters walk in, the hero walks up to a block)
  (function tick() { if (inside) paint(); requestAnimationFrame(tick); })();

  // nothing on the page gets highlighted or dragged around like a web page; typing fields keep working
  const typing = t => t && t.closest && t.closest(TYPE);
  document.addEventListener('selectstart', e => { if (!typing(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (!typing(e.target)) e.preventDefault(); });
  document.addEventListener('mousedown', e => { if (e.detail > 1 && !typing(e.target)) e.preventDefault(); });   // double and triple clicks
})();
