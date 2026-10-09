'use strict';

/* ================= biomas: as cavernas (52 a 57), a catedral (41 a 46), o gelo (69 a 74) e o documento de biomas ================= */
(() => {
  const E = UDW.esc, X = UDW_TXT;
  const TABS = [['cavernas', 'Cavernas'], ['catedral', 'Catedral'], ['gelo', 'Gelo'], ['blocos', 'Blocos'], ['objetos', 'Objetos de cena'], ['documento', 'Documento de biomas'], ['regras', 'Regras de geração']];
  // nível dos monstros numa faixa (o mesmo cálculo do spawnEnemy do 56 e do 73)
  const lvAt = m => m >= IC_TOP ? 6 + Math.min(2, Math.floor((m - IC_TOP) / 60)) : m < CAVE_D ? 1 + Math.min(3, Math.floor(m / 50)) : Math.min(6, 2 + Math.floor((m - CAVE_D) / 45));
  function cavernas() {
    let h = `<p class="lead">${E(X.caverna)}</p><p><span class="rot">Entrada</span>${E(X.cavernaEntrada)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.cvFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1;
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${sp[0].map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. Monstros de nível ${lvAt(f.de)} a ${lvAt(f.ate - 1) + 1}.</p>` : ''}
        <div class="lista">${X.cvMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.cvMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/cavernas">Blocos das cavernas por faixa</a><a href="#/biomas/objetos/cavernas">Objetos das cavernas por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.maeteia ? ET.maeteia.name : 'A Mãe-Teia')}</a>: ${E(X.teiaOnde)}</p>`;
    return h;
  }
  function gelo() {
    let h = `<p class="lead">${E(X.gelo)}</p><p><span class="rot">Entrada</span>${E(X.geloEntrada)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.icFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1;
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${sp[0].map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. Monstros de nível ${lvAt(f.de)} a ${lvAt(f.ate - 1) + 1}.</p>` : ''}
        <div class="lista">${X.icMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.icMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/gelo">Blocos do gelo por faixa</a><a href="#/biomas/objetos/gelo">Objetos do gelo por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.yetiancestral ? ET.yetiancestral.name : 'O Yeti Ancestral')}</a>: ${E(X.yetiOnde)}</p>`;
    return h;
  }
  function catedral() {
    let h = `<p class="lead">${E(X.catedral)}</p><p><span class="rot">Entrada</span>${E(X.catedralEntrada)}</p>`;
    h += `<h2>Faixas</h2><div class="faixas">`;
    for (const f of X.faixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1;
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Andares</span>${f.andares} <span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${sp[0].map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. Monstros de nível ${lvAt(f.de)} a ${Math.min(7, lvAt(f.ate - 1) + 1)}.</p>` : ''}
        <div class="lista">${X.minerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div>`;
    h += `<h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }, { t: 'Fornalha' }],
      X.minerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m', FURN[id] ? `${FURN[id].n} → ${UDW.item(FURN[id].bar)}` : 'combustível'], keys: [ITEMS[id].name, a, b, ''] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/catedral">Blocos da catedral por faixa</a><a href="#/biomas/objetos/catedral">Objetos da catedral por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.rei ? ET.rei.name : 'O Rei Esqueleto')}</a>: ${E(X.reiOnde)}</p>`;
    h += `<h2>Cavernas antigas</h2><p class="nota">${E(X.cavernas)}</p><div class="lista">${[1, 2, 3, 4].map(z => `<span class="it off">${E(ZONE_NAMES[z])}</span>`).join('')}</div>`;
    return h;
  }

  /* ---------- blocos e objetos por bioma e faixa: gera mundos de verdade com o generate() do jogo e conta o que saiu em cada faixa ---------- */
  const SEEDS = [7919, 15838, 23757];
  const BIOMAS = () => [
    { id: 'cavernas', nome: 'As Cavernas', de: 6, ate: 186, parede: WCV_ROCHA, faixas: X.cvFaixas.map((f, b) => ({ k: 'cv' + b, nome: ZONE_NAMES[f.zona] || f.nome, de: f.de, ate: f.ate })) },
    { id: 'catedral', nome: 'A Catedral Abandonada', de: 186, ate: 372, parede: WCT_CALCARIO, faixas: X.faixas.map((f, b) => ({ k: 'ct' + b, nome: ZONE_NAMES[f.zona] || f.nome, de: f.de, ate: f.ate })) },
    { id: 'gelo', nome: 'As Cavernas de Gelo', de: 372, ate: 558, parede: WIC_ROCHA, faixas: X.icFaixas.map((f, b) => ({ k: 'ic' + b, nome: ZONE_NAMES[f.zona] || f.nome, de: f.de, ate: f.ate })) },
    { id: 'superficie', nome: 'Superfície', parede: 1, faixas: [{ k: 'sup', nome: 'Vilarejo, campos e morros', de: null }] }
  ];
  function census() {
    if (UDW.censo) return UDW.censo;
    const C = { t: {}, w: {}, p: {}, n: SEEDS.length };
    const add = (o, id, k) => { (o[id] = o[id] || {})[k] = (o[id][k] || 0) + 1; };
    const bandOf = (x, y) => y < surf[x] + 6 || y - CV_S0 < 6 ? 'sup' : y >= IC_S0 ? 'ic' + Math.max(0, Math.min(3, iceBand(y))) : y < CB_S0 ? 'cv' + Math.max(0, Math.min(3, caveBand(y))) : 'ct' + cathBand(y);
    for (const sd of SEEDS) {
      generate(sd);
      for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
        const i = y * WW + x, t = tiles[i], w = walls[i]; if (!t && !w) continue;
        const k = bandOf(x, y); if (t) add(C.t, t, k); if (w) add(C.w, w, k);
      }
      for (const P of PROPS) { const y = Math.floor((P.Y + P.h - 1) / T), x = Math.floor((P.X + P.w / 2) / T); add(C.p, P.def.id, bandOf(((x % WW) + WW) % WW, y)); }
    }
    return (UDW.censo = C);
  }
  // nomes pelas constantes do jogo (textos.js) ou pelo item que o bloco vira
  let NOMES = null;
  function nomes() {
    if (NOMES) return NOMES;
    NOMES = { t: {}, w: {} };
    for (const id in ITEMS) if (ITEMS[id].block != null && !NOMES.t[ITEMS[id].block]) NOMES.t[ITEMS[id].block] = ITEMS[id].name;
    for (const [o, src] of [[NOMES.t, X.blocoNome], [NOMES.w, X.paredeNome]]) for (const k in src) { try { o[/^\d+$/.test(k) ? +k : eval(k)] = src[k]; } catch (e) { } }
    return NOMES;
  }
  const isOre = t => [COAL, COPPER, IRON, GOLD, CRYSTAL, CV_O_CARVAO, CV_O_COBRE, CV_O_FERRO, CV_O_OURO, IC_O_FERRO, IC_O_OURO, IC_O_CRISTAL].includes(t);
  const kindT = t => t === CHEST || t === CHEST_OPEN ? 'Baús' : isOre(t) ? 'Minérios' : SOLID[t] && BLOCKY[t] ? 'Terreno' : 'Decoração de um bloco';
  // uma linha da matriz: o quanto aparece em cada faixa, comparado com a faixa onde mais aparece
  function cells(row, B) {
    const vs = B.faixas.map(f => row[f.k] || 0), mx = Math.max(...vs);
    return vs.map(v => { const r = v / mx, m = v / UDW.censo.n; if (!v || (r < 0.01 && m < 3)) return '<td class="fx0"></td>';
      const lv = r >= 0.5 ? 3 : r >= 0.15 ? 2 : 1; return `<td class="fx${lv}" data-tip="${E(lv === 3 ? 'Muito' : lv === 2 ? 'Comum' : 'Pouco')}: cerca de ${UDW.num(m, m < 10 ? 1 : 0)} por mundo"><i></i></td>`; });
  }
  const tot = (row, B) => B.faixas.reduce((n, f) => n + (row[f.k] || 0), 0);
  function matriz(B, linhas) {
    const head = `<thead><tr><th></th>${B.faixas.map(f => `<th class="fxh"><b>${E(f.nome)}</b>${f.de != null ? `<small>${f.de} a ${f.ate} m</small>` : ''}</th>`).join('')}</tr></thead>`;
    return `<div class="tw"><table class="grade matriz">${head}<tbody>${linhas.join('')}</tbody></table></div>`;
  }
  const legenda = `<p class="nota legenda"><span class="fx3"><i></i></span> muito <span class="fx2"><i></i></span> comum <span class="fx1"><i></i></span> pouco. Contado em ${SEEDS.length} mundos gerados pelo próprio jogo; passe o mouse para ver quantos por mundo.</p>`;
  const biomeNav = cur => `<p class="bnav">${BIOMAS().map(B => `<a href="#/biomas/${cur}/${B.id}"${''}>${E(B.nome)}</a>`).join('')}</p>`;

  function blocos() {
    const C = census(), N = nomes();
    let h = biomeNav('blocos') + legenda;
    for (const B of BIOMAS()) {
      const ts = Object.keys(C.t).map(Number).filter(t => tot(C.t[t], B) / C.n >= 1).sort((a, b) => tot(C.t[b], B) - tot(C.t[a], B));
      const ws = Object.keys(C.w).map(Number).filter(w => tot(C.w[w], B) / C.n >= 3).sort((a, b) => tot(C.w[b], B) - tot(C.w[a], B));
      h += `<h2 id="${B.id}">${E(B.nome)}</h2>`;
      const linhas = [];
      for (const g of ['Terreno', 'Minérios', 'Decoração de um bloco', 'Baús']) {
        const gs = ts.filter(t => kindT(t) === g); if (!gs.length) continue;
        linhas.push(`<tr class="grupo"><td colspan="${B.faixas.length + 1}">${g}</td></tr>`);
        for (const t of gs) { const d = BLOCK_DROP[t];
          linhas.push(`<tr><td class="bl">${UDW.tileImg(t, B.parede, 1)}<span><b>${E(N.t[t] || 'Bloco ' + t)}</b>${d && ITEMS[d] && ITEMS[d].name !== N.t[t] ? `<small>Solta <a href="#/item/${d}" data-item="${d}">${E(ITEMS[d].name)}</a></small>` : ''}</span></td>${cells(C.t[t], B).join('')}</tr>`); }
      }
      if (ws.length) { linhas.push(`<tr class="grupo"><td colspan="${B.faixas.length + 1}">Paredes de fundo</td></tr>`);
        for (const w of ws) linhas.push(`<tr><td class="bl">${UDW.wallImg(w, 1)}<span><b>${E(N.w[w] || 'Parede ' + w)}</b></span></td>${cells(C.w[w], B).join('')}</tr>`); }
      h += matriz(B, linhas);
    }
    return h;
  }

  function objetos() {
    const C = census(), A = id => E(X.apoio[PROP_DEFS[id].apoio] || PROP_DEFS[id].apoio || '');
    let h = biomeNav('objetos') + `<p class="nota">${Object.keys(PROP_DEFS).length} objetos, pintados uma vez e assados na imagem do mundo. Se o bloco que sustenta um objeto quebrar, ele cai.</p>` + legenda;
    const visto = new Set();
    for (const B of BIOMAS()) {
      const ids = Object.keys(C.p).filter(id => PROP_DEFS[id] && tot(C.p[id], B) > 0).sort((a, b) => tot(C.p[b], B) - tot(C.p[a], B));
      if (!ids.length) continue; ids.forEach(id => visto.add(id));
      h += `<h2 id="${B.id}">${E(B.nome)} <small>${ids.length}</small></h2>`;
      h += matriz(B, ids.map(id => { const P = PROP_DEFS[id], V = P.vars[0];
        return `<tr><td class="ob"><div class="oimg">${UDW.propImg(id, 0, Math.max(V.w, V.h) < 24 ? 3 : Math.max(V.w, V.h) < 48 ? 2 : 1)}</div><span><b>${E(P.nome && P.nome !== id ? P.nome : id.replace(/_/g, ' '))}</b><small>${A(id)}${P.luz ? ' · com luz' : ''}${P.vars.length > 1 ? ` · ${P.vars.length} variações` : ''}</small></span></td>${cells(C.p[id], B).join('')}</tr>`; }));
    }
    const resto = Object.keys(PROP_DEFS).filter(id => !visto.has(id));
    if (resto.length) h += `<h2>Raros <small>${resto.length}</small></h2><p class="nota">Não saíram nos mundos de teste: aparecem pouco ou só em salas especiais.</p><div class="props">${resto.map(id => { const P = PROP_DEFS[id];
      return `<figure class="prop"><div class="pimg">${UDW.propImg(id, 0, P.vars[0].w > 60 ? 1 : 2)}</div><figcaption><b>${E(P.nome || id)}</b><span>${(P.faixas || []).map(f => X.faixaChave[f] || f).join(', ')}</span></figcaption></figure>`; }).join('')}</div>`;
    return h;
  }

  UDW.pages.biomas = {
    render(tab = 'cavernas', anchor) {
      const sub = { cavernas: 'A primeira camada, logo debaixo do vilarejo.', catedral: 'A segunda camada, debaixo das cavernas.', gelo: 'A terceira camada, debaixo das criptas da catedral.', blocos: 'O que nasce em cada bioma, faixa por faixa.', objetos: 'Os objetos de cena de cada bioma, faixa por faixa.' };
      let h = UDW.head(tab === 'cavernas' ? 'As Cavernas' : tab === 'catedral' ? 'A Catedral Abandonada' : tab === 'gelo' ? 'As Cavernas de Gelo' : 'Biomas', sub[tab] || '') + UDW.tabs('biomas', TABS, tab);
      if (tab === 'objetos' || tab === 'blocos') h += UDW.censo ? (tab === 'objetos' ? objetos() : blocos()) : '<p class="nota" id="censo">Gerando mundos para contar o que nasce em cada faixa...</p>';
      else if (tab === 'documento' || tab === 'regras') { const d = UDW_DOCS.find(x => x.id === (tab === 'documento' ? 'biomas' : 'regras-de-bioma')); h += UDW.docView(d); }
      else if (tab === 'catedral') h += catedral();
      else if (tab === 'gelo') h += gelo();
      else h += cavernas();
      return h;
    },
    after(root, tab, anchor) {
      const go = () => { if (anchor && $(anchor)) $(anchor).scrollIntoView(); };
      if ((tab === 'objetos' || tab === 'blocos') && $('censo')) setTimeout(() => { const el = $('censo'); if (!el) return; el.outerHTML = tab === 'objetos' ? objetos() : blocos(); go(); }, 30);
      else go();
    }
  };
})();
