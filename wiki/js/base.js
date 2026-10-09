'use strict';

/* ================= a base da wiki: desenhos, dicas, markdown, tabelas e navegação =================
   Tudo da wiki mora em UDW, para não esbarrar nos nomes globais do jogo. */
const UDW = { pages: {}, nav: [], rolls: new Map(), imgs: new Map() };

(() => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const num = (v, d = 0) => (Math.round(v * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',');
  const pct = (v, d = 1) => num(v * 100, d).replace(/,0+$/, '') + '%';
  UDW.esc = esc; UDW.num = num; UDW.pct = pct;
  UDW.slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ---------- itens ---------- */
  UDW.SLOT = { weapon: 'Arma', shield: 'Escudo', head: 'Cabeça', body: 'Corpo', feet: 'Pés', acc: 'Acessório', tool: 'Picareta' };
  UDW.isGear = id => !!ITEMS[id].slot;
  // a cor do nome de uma base: lendária se for única de chefe, branca se for equipamento, a raridade escrita se for material
  UDW.baseRar = id => { const it = ITEMS[id]; return it.legend ? 4 : it.slot ? 0 : (it.rar | 0); };
  // os blocos de construção da catedral: itens cujo bloco é um dos ids da catedral (41-catedral-api, a partir de CT_CALCARIO)
  UDW.cathBlocks = () => Object.keys(ITEMS).filter(id => ITEMS[id].block >= CT_CALCARIO);
  UDW.white = id => { const k = 'w:' + id; if (!UDW.rolls.has(k)) UDW.rolls.set(k, mkItem(id, 0)); return UDW.rolls.get(k); };
  UDW.icon = (id, px = 30) => ICON[id] ? `<img class="ic" src="${ICON[id].url}" width="${px}" height="${px}" alt="">` : '';
  UDW.item = (id, o = {}) => {
    const it = ITEMS[id]; if (!it) return esc(id);
    return `<a class="it" href="#/item/${id}" data-item="${id}">${UDW.icon(id, o.px || 26)}<span style="color:${RAR_COL[UDW.baseRar(id)]}">${esc(it.name)}</span>${o.n ? `<b class="qt">×${o.n}</b>` : ''}</a>`;
  };
  UDW.kindOf = id => { const it = ITEMS[id]; return it.slot ? (it.slot === 'weapon' ? KIND[it.kind || 'sword'].name : UDW.SLOT[it.slot]) : it.gold ? 'Moeda' : it.spell ? 'Feitiço' : it.scroll ? 'Pergaminho' : it.use ? 'Consumível' : it.block || it.deco ? 'Bloco' : it.icon === 'bar' ? 'Barra' : it.icon === 'ore' || id === 'carvao' ? 'Minério' : 'Material'; };
  // a dica do jogo: o mesmo texto que aparece quando você passa o mouse num item lá dentro
  UDW.tipFor = s => {
    const it = ITEMS[s.id];
    if (it.slot) return `<span class="tn" style="color:${RAR_COL[itemRar(s)]}">${esc(itemName(s))}</span>${gearTipBody(s)}${it.desc ? `<p>${esc(it.desc)}</p>` : ''}`;
    return `<span class="tn" style="color:${RAR_COL[it.rar | 0]}">${esc(it.name)}</span><small>${UDW.kindOf(s.id)}</small>${it.desc ? `<p>${esc(it.desc)}</p>` : ''}`;
  };
  UDW.tipBox = s => `<div class="tipbox fixo">${UDW.tipFor(s)}</div>`;
  UDW.keep = s => { const k = 'r:' + s.uid; UDW.rolls.set(k, s); return k; };

  /* ---------- desenhos do jogo ---------- */
  const toURL = c => { try { return c.toDataURL(); } catch (e) { return ''; } };
  function crop(src, pad = 1) {
    const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    const c = mk(x1 - x0 + 1 + pad * 2, y1 - y0 + 1 + pad * 2); c.getContext('2d').drawImage(src, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1);
    return c;
  }
  const memo = (k, f) => { if (!UDW.imgs.has(k)) { let v = null; try { v = f(); } catch (e) { console.warn('wiki: desenho', k, e); } UDW.imgs.set(k, v); } return UDW.imgs.get(k); };
  const pix = (c, scale, cls = '') => c ? `<img class="px ${cls}" src="${c.url}" width="${c.w * scale}" height="${c.h * scale}" alt="">` : '';
  const pack2 = c => c ? { url: toURL(c), w: c.width, h: c.height } : null;
  // um monstro parado, desenhado pela mesma função do jogo (15-render drawEnemy), num quadro fora da tela
  UDW.enemyArt = type => memo('e:' + type, () => {
    const D = ET[type]; if (!D) return null;
    low.width = 260; low.height = 160; VW = 260; VH = 160; lc.imageSmoothingEnabled = false;
    const e = { type, x: 130 - D.w / 2, y: 140 - D.h, w: D.w, h: D.h, vx: 0, vy: 0, onGround: true, facing: 1, t: 0.35, flash: 0, state: 'walk', stateT: 0, sAng: 0.9, arm: 2.7,
      variant: 1, lvl: 1, hp: 10, maxHp: 10, stun: 0, vis: 1, seed: 1, hop: 1, boss: !!D.boss, dead: false, phase: 1, atkCD: 1, rise: 0, risen: 1 };
    lc.clearRect(0, 0, 260, 160); drawEnemy(e, 0, 0);
    return pack2(crop(low));
  });
  UDW.enemyImg = (type, scale = 3) => pix(UDW.enemyArt(type), scale, 'sprite');
  // um morador, montado como na janela de conversa (17-vilarejo openTalk)
  UDW.npcImg = (n, scale = 4) => pix(memo('n:' + n.id, () => { n.attend = true; n.facing = 1; return pack2(crop(compose(npcPose(n)))); }), scale, 'sprite');
  UDW.villageImg = (k, scale = 2) => pix(memo('v:' + k, () => SPR.vil && SPR.vil[k] ? pack2(SPR.vil[k].c) : null), scale);
  // um objeto de cena da catedral (41 defProp guarda os pixels de cada variação)
  UDW.propImg = (id, v = 0, scale = 2) => pix(memo('p:' + id + ':' + v, () => {
    const P = PROP_DEFS[id], V = P && P.vars[v]; if (!V) return null;
    const c = mk(V.w, V.h), x = c.getContext('2d'), img = x.createImageData(V.w, V.h); new Uint32Array(img.data.buffer).set(V.px); x.putImageData(img, 0, 0);
    return pack2(c);
  }), scale);
  // um pedaço de 3 x 3 blocos com a textura de verdade
  UDW.blockImg = (t, scale = 2) => pix(memo('b:' + t, () => MAT[t] ? pack2(blockCanvas(t, T * 3, 2, 0, 0)) : null), scale);
  // qualquer bloco do mundo num quadrado de 3 x 3: textura (MAT), parede de fundo (WMAT) ou decoração de um bloco (DECO) na frente da parede w
  const wallFill = (buf, size, w) => { const P = WMAT[w][0], V = WMAT[w][1].v; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let v = V[texAt(x, y)]; if (x === 0 || y === 0 || x === size - 1 || y === size - 1) v -= 1.5; buf[y * size + x] = shadeOf(P, v); } };
  UDW.wallImg = (w, scale = 2) => pix(memo('w:' + w, () => {
    if (!WMAT[w]) return null; const S = T * 3, c = mk(S, S), x = c.getContext('2d'), img = x.createImageData(S, S);
    wallFill(new Uint32Array(img.data.buffer), S, w); x.putImageData(img, 0, 0); return pack2(c);
  }), scale);
  UDW.tileImg = (t, w, scale = 2) => {
    if (MAT[t]) return UDW.blockImg(t, scale);
    return pix(memo('d:' + t + ':' + w, () => {
      const arr = DECO[t]; if (!arr) return null;
      const one = arr instanceof Uint32Array ? [arr] : arr, stack = t === CT_COLUNA ? [one[2], one[1], one[0]] : t === CT_RAIZ || t === CV_RAIZES ? one : [one[0]];
      const S = T * 3, c = mk(S, S), x = c.getContext('2d'), img = x.createImageData(S, S), buf = new Uint32Array(img.data.buffer);
      if (WMAT[w]) wallFill(buf, S, w);
      const hang = CV_HANGS[t] || t === CT_RAIZ, y0 = hang ? 0 : S - stack.length * T;
      stack.forEach((sp, k) => { if (sp) for (let q = 0; q < T * T; q++) if (sp[q]) buf[(y0 + k * T + ((q / T) | 0)) * S + T + (q % T)] = sp[q]; });
      x.putImageData(img, 0, 0); return pack2(c);
    }), scale);
  };
  UDW.canvasImg = (k, f, scale = 2) => pix(memo(k, () => pack2(f())), scale);

  /* ---------- markdown (o suficiente para os documentos da pasta docs/) ---------- */
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {
      const d = UDW_DOCS.find(x => u.replace(/#.*/, '').endsWith(x.arquivo.split('/').pop()));
      return d ? `<a href="#/docs/${d.id}">${t}</a>` : `<span class="lk">${t}</span>`;
    });
    return s;
  }
  const check = s => s.replace(/^\[( |x|-)\]\s*/, (m, c) => `<span class="ck ck-${c === 'x' ? 'sim' : c === '-' ? 'nao' : 'vazio'}">${c === 'x' ? '✓' : c === '-' ? '✕' : ''}</span>`);
  UDW.md = (text, tocOut) => {
    const L = text.replace(/\r/g, '').split('\n'), out = []; let i = 0;
    const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    while (i < L.length) {
      const l = L[i];
      if (/^```/.test(l)) { const b = []; i++; while (i < L.length && !/^```/.test(L[i])) b.push(L[i++]); i++; out.push(`<pre>${esc(b.join('\n'))}</pre>`); continue; }
      const hm = /^(#{1,4})\s+(.*)/.exec(l);
      if (hm) { const n = hm[1].length, id = 'h-' + UDW.slug(hm[2]).replace(/[^a-z0-9]+/g, '-'); if (tocOut && n <= 2) tocOut.push([n, hm[2], id]); out.push(`<h${n + 1} id="${id}">${inline(hm[2])}</h${n + 1}>`); i++; continue; }
      if (/^---+\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
      if (/^\|/.test(l) && i + 1 < L.length && /^\|?\s*:?-{2,}/.test(L[i + 1])) {
        const head = cells(l); i += 2; const rows = [];
        while (i < L.length && /^\|/.test(L[i])) rows.push(cells(L[i++]));
        out.push(`<div class="tw"><table class="md"><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${check(inline(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
        const ord = /^\s*\d+\./.test(l), items = [];
        while (i < L.length && /^\s*([-*]|\d+\.)\s+/.test(L[i])) {
          const deep = /^\s{2,}/.test(L[i]), t = L[i].replace(/^\s*([-*]|\d+\.)\s+/, '');
          items.push(`<li${deep ? ' class="sub"' : ''}>${check(inline(t))}</li>`); i++;
        }
        out.push(ord ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`); continue;
      }
      if (!l.trim()) { i++; continue; }
      const p = []; while (i < L.length && L[i].trim() && !/^(#|\||```|---|\s*([-*]|\d+\.)\s)/.test(L[i])) p.push(L[i++]);
      if (p.length) out.push(`<p>${inline(p.join(' '))}</p>`); else i++;
    }
    return out.join('\n');
  };

  /* ---------- tabelas que ordenam ao clicar no título ---------- */
  // cols: [{ t: 'Título', k: (linha) => valor para ordenar, cls }]; rows: [{ cells: [html...], keys: [valor...] }]
  UDW.table = (cols, rows, cls = '') => {
    const id = 'tb' + Math.random().toString(36).slice(2, 8);
    UDW._tables = UDW._tables || {}; UDW._tables[id] = { rows, dir: 0, col: -1 };
    return `<div class="tw"><table class="grade ${cls}" id="${id}"><thead><tr>${cols.map((c, i) => `<th data-c="${i}" class="${c.cls || ''}${c.nosort ? '' : ' ord'}">${c.t}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr${r.attr || ''}>${r.cells.map((c, i) => `<td class="${cols[i].cls || ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };
  document.addEventListener('click', e => {
    const th = e.target.closest && e.target.closest('table.grade th.ord'); if (!th) return;
    const tb = th.closest('table'), S = UDW._tables[tb.id]; if (!S) return;
    const c = +th.dataset.c; S.dir = S.col === c ? -S.dir : 1; S.col = c;
    const cols = [...tb.querySelectorAll('th')];
    const rows = S.rows.slice().sort((a, b) => { const x = a.keys[c], y = b.keys[c]; return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt')) * S.dir; });
    tb.tBodies[0].innerHTML = rows.map(r => `<tr${r.attr || ''}>${r.cells.map((h, i) => `<td class="${cols[i].className.replace(/\bord\b|\bup\b|\bdn\b/g, '')}">${h}</td>`).join('')}</tr>`).join('');
    cols.forEach(t => t.classList.remove('up', 'dn')); th.classList.add(S.dir > 0 ? 'up' : 'dn');
  });

  /* ---------- dica flutuante ---------- */
  const tip = () => $('wtip');
  function showTip(html, ev) {
    const t = tip(); t.innerHTML = html; t.hidden = false;
    const r = t.getBoundingClientRect(), pad = 16;
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = Math.max(8, innerHeight - r.height - 8);
    t.style.left = Math.max(8, x) + 'px'; t.style.top = y + 'px';
  }
  document.addEventListener('pointermove', e => {
    const a = e.target.closest && e.target.closest('[data-item],[data-roll],[data-tip]');
    if (!a) { tip().hidden = true; return; }
    if (a.dataset.item) showTip(UDW.tipFor(UDW.isGear(a.dataset.item) ? UDW.white(a.dataset.item) : { id: a.dataset.item, n: 1 }), e);
    else if (a.dataset.roll && UDW.rolls.has(a.dataset.roll)) showTip(UDW.tipFor(UDW.rolls.get(a.dataset.roll)), e);
    else if (a.dataset.tip) showTip(`<p>${esc(a.dataset.tip)}</p>`, e);
  });
  document.addEventListener('scroll', () => { tip().hidden = true; }, true);

  /* ---------- pedaços de página ---------- */
  UDW.head = (titulo, sub) => `<header class="ph"><h1>${titulo}</h1>${sub ? `<p>${sub}</p>` : ''}</header>`;
  UDW.tabs = (base, list, cur) => `<nav class="abas">${list.map(([k, t]) => `<a href="#/${base}/${k}" class="${k === cur ? 'on' : ''}">${t}</a>`).join('')}</nav>`;
  UDW.stat = (v, t) => `<div class="st"><b>${v}</b><span>${t}</span></div>`;
  UDW.chip = (t, cor) => `<span class="chip"${cor ? ` style="--c:${cor}"` : ''}>${t}</span>`;
  UDW.rar = r => `<span style="color:${RAR_COL[r]}">${RAR[r]}</span>`;
})();
