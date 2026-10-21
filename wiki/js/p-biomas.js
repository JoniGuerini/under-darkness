'use strict';

/* ================= biomas: as 20 camadas na ordem do registro (js/129-camadas.js, LAYERS; revamp de 2026-10-21), os blocos e objetos de cada uma faixa por faixa e o documento de biomas ================= */
(() => {
  const E = UDW.esc, X = UDW_TXT;
  const CAMS = () => UDW_CAMADAS();
  const TABS = () => [...CAMS().map(C => [C.id, C.curto]), ['blocos', 'Blocos'], ['objetos', 'Objetos de cena'], ['documento', 'Documento de biomas'], ['regras', 'Regras de geração']];
  // nível dos monstros numa faixa (p-inimigos: o mesmo cálculo do layerLvl do 52; camada N: 5N-4 a 5N-1, um a cada quarto da altura; nas cavernas, 1 a cada 50 m do desenho)
  const lvAt = m => UDW.lvAt(m), lvTop = m => UDW.lvTop(m);
  // a tabela de spawn de uma zona com o mesmo monstro somado (a zona 33 lista as sementes duas vezes)
  const spTab = sp => { const o = []; for (const [t, w] of sp ? sp[0] : []) { const r = o.find(x => x[0] === t); if (r) r[1] += w; else o.push([t, w]); } return o; };
  const lvTxt = f => { const a = lvAt(f.de), b = Math.min(lvTop(f.de), lvAt(f.ate - 1) + 1); return a === b ? `Monstros de nível ${a}.` : `Monstros de nível ${a} a ${b}.`; };
  function cavernas() {
    let h = `<p class="lead">${E(X.caverna)}</p><p><span class="rot">Entrada</span>${E(X.cavernaEntrada)}</p>${X.cavernaSom ? `<p><span class="rot">Som</span>${E(X.cavernaSom)}</p>` : ''}<h2>Faixas</h2><div class="faixas">`;
    for (const f of X.cvFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1;
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${sp[0].map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
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
    let h = `<p class="lead">${E(X.gelo)}</p><p><span class="rot">Entrada</span>${E(X.geloEntrada)}</p>${X.geloSom ? `<p><span class="rot">Som</span>${E(X.geloSom)}</p>` : ''}<h2>Faixas</h2><div class="faixas">`;
    for (const f of X.icFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1;
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${sp[0].map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.icMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.icMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/gelo">Blocos do gelo por faixa</a><a href="#/biomas/objetos/gelo">Objetos do gelo por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.yetiancestral ? ET.yetiancestral.name : 'O Yeti Ancestral')}</a>: ${E(X.yetiOnde)}</p>`;
    return h;
  }
  function mina() {
    let h = `<p class="lead">${E(X.mina)}</p><p><span class="rot">Entrada</span>${E(X.minaEntrada)}</p>${X.minaSom ? `<p><span class="rot">Som</span>${E(X.minaSom)}</p>` : ''}<h2>Faixas</h2><div class="faixas">`;
    for (const f of X.mnFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1;
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${sp[0].map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.mnMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.mnMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/mina">Blocos da mina por faixa</a><a href="#/biomas/objetos/mina">Objetos da mina por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.reigoblin ? ET.reigoblin.name : 'O Rei Goblin')}</a>: ${E(X.rgOnde)}</p>`;
    return h;
  }
  function fungo() {
    let h = `<p class="lead">${E(X.fungo)}</p><p><span class="rot">Entrada</span>${E(X.fungoEntrada)}</p><p><span class="rot">Som</span>${E(X.fungoSom)}</p><p><span class="rot">Água</span>${E(X.fungoAgua)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.fgFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1, tab = sp ? sp[0].filter(([t]) => ET[t]) : [];
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}${f.extra ? ' ' + E(f.extra) : ''}</p>` : ''}
        <div class="lista">${X.fgMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.fgMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/fungo">Blocos das minas fúngicas por faixa</a><a href="#/biomas/objetos/fungo">Objetos das minas fúngicas por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.maeesporo ? ET.maeesporo.name : 'A Mãe-Esporo')}</a>: ${E(X.maeOnde || '')}</p>`;
    return h;
  }
  function cidade() {
    let h = `<p class="lead">${E(X.cidade)}</p><p><span class="rot">Entrada</span>${E(X.cidadeEntrada)}</p><p><span class="rot">Som</span>${E(X.cidadeSom)}</p><p><span class="rot">Água</span>${E(X.cidadeAgua)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.cdFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1, tab = sp ? sp[0].filter(([t]) => ET[t]) : [];
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.cdMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.cdMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/cidade">Blocos da cidade afundada por faixa</a><a href="#/biomas/objetos/cidade">Objetos da cidade afundada por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.sineiro ? ET.sineiro.name : 'O Sineiro Afogado')}</a>: ${E(X.sineiroOnde || '')}</p>`;
    return h;
  }
  function floresta() {
    let h = `<p class="lead">${E(X.floresta)}</p><p><span class="rot">Entrada</span>${E(X.florestaEntrada)}</p><p><span class="rot">Som</span>${E(X.florestaSom)}</p><p><span class="rot">Luz</span>${E(X.florestaLuz)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.fpFaixas) {
      const sp = CATH_SPAWN[f.zona], tab = spTab(sp).filter(([t]) => ET[t]), tot = tab.reduce((n, r) => n + r[1], 0) || 1;
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo (o bando de sementes conta como um; no máximo 2 lagartos de quartzo). ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.fpMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }, { t: 'Fornalha' }],
      X.fpMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m', FURN[id] ? `${FURN[id].n} → ${UDW.item(FURN[id].bar)}` : 'combustível'], keys: [ITEMS[id].name, a, b, ''] })), 'compacta');
    h += `<h3>Geodos</h3><p>${E(X.florestaGeodo)}</p>`;
    h += `<p class="bnav"><a href="#/biomas/blocos/floresta">Blocos da floresta petrificada por faixa</a><a href="#/biomas/objetos/floresta">Objetos da floresta petrificada por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.cervo ? ET.cervo.name : 'O Cervo de Pedra')}</a>: ${E(X.cervoOnde || '')}</p>`;
    return h;
  }
  function anoes() {
    let h = `<p class="lead">${E(X.anoes)}</p><p><span class="rot">Entrada</span>${E(X.anoesEntrada)}</p><p><span class="rot">Som</span>${E(X.anoesSom)}</p><p><span class="rot">Alavancas e runas</span>${E(X.anoesMecanismos)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.anFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1, tab = sp ? sp[0].filter(([t]) => ET[t]) : [];
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.anMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.anMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/anoes">Blocos da fortaleza por faixa</a><a href="#/biomas/objetos/anoes">Objetos da fortaleza por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.autoforja ? ET.autoforja.name : 'O Autômato-Forja')}</a>: ${E(X.autoforjaOnde || '')}</p>`;
    return h;
  }
  function elfos() {
    let h = `<p class="lead">${E(X.elfos)}</p><p><span class="rot">Entrada</span>${E(X.elfosEntrada)}</p><p><span class="rot">Som</span>${E(X.elfosSom)}</p><p><span class="rot">Enraizado, silenciado e enfeitiçado</span>${E(X.elfosEstados)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.elFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1, tab = sp ? sp[0].filter(([t]) => ET[t]) : [];
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.elMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.elMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/elfos">Blocos do reino por faixa</a><a href="#/biomas/objetos/elfos">Objetos do reino por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.dama ? ET.dama.name : 'A Dama do Espelho')}</a>: ${E(X.damaEspelhoOnde || '')}</p>`;
    return h;
  }
  function dragao() {
    let h = `<p class="lead">${E(X.dragao)}</p><p><span class="rot">Entrada</span>${E(X.dragaoEntrada)}</p><p><span class="rot">Som</span>${E(X.dragaoSom)}</p><p><span class="rot">Pés presos, puxado e agarrado</span>${E(X.dragaoEstados)}</p><p><span class="rot">O ouro solto</span>${E(X.dragaoOuro)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.dgFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1, tab = sp ? sp[0].filter(([t]) => ET[t]) : [];
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.dgMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.dgMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="nota">Dracônio: veios na obsidiana rajada, no osso de dragão, na lava cordada e no andesito, perto do fogo (a até 6 blocos de magma, ouro solto ou crosta), nos Tubos de Lava e no Leito de Ouro; uns poucos longe do fogo. 8 minérios por barra.</p>`;
    h += `<p class="bnav"><a href="#/biomas/blocos/dragao">Blocos do covil por faixa</a><a href="#/biomas/objetos/dragao">Objetos do covil por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.cinzarel ? ET.cinzarel.name : 'Cinzarel, o Dragão Ancião')}</a>: ${E(X.cinzarelOnde || '')}</p>`;
    return h;
  }
  function titas() {
    let h = `<p class="lead">${E(X.titas)}</p><p><span class="rot">Entrada</span>${E(X.titasEntrada)}</p><p><span class="rot">Som</span>${E(X.titasSom)}</p><p><span class="rot">O corpo do titã</span>${E(X.titasEscalada)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.ttFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1, tab = sp ? sp[0].filter(([t]) => ET[t]) : [];
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.ttMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.ttMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/titas">Blocos do ossário por faixa</a><a href="#/biomas/objetos/titas">Objetos do ossário por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.tita ? ET.tita.name : 'O Último Titã')}</a>: ${E(X.titaOnde || '')}</p>`;
    return h;
  }
  function antigos() {
    let h = `<p class="lead">${E(X.antigos)}</p><p><span class="rot">Entrada</span>${E(X.antigosEntrada)}</p><p><span class="rot">Som</span>${E(X.antigosSom)}</p><p><span class="rot">Gravidade virada</span>${E(X.antigosGravidade)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.atFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1, tab = sp ? sp[0].filter(([t]) => ET[t]) : [];
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.atMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.atMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/antigos">Blocos da cidade por faixa</a><a href="#/biomas/objetos/antigos">Objetos da cidade por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.arquiteto ? ET.arquiteto.name : 'O Arquiteto')}</a>: ${E(X.arquitetoOnde || '')}</p>`;
    return h;
  }
  function mar() {
    let h = `<p class="lead">${E(X.mar)}</p><p><span class="rot">Entrada</span>${E(X.marEntrada)}</p><p><span class="rot">Som</span>${E(X.marSom)}</p><p><span class="rot">Fôlego, puxão, bolha, tinta e água fervente</span>${E(X.marEstados)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.msFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1, tab = sp ? sp[0].filter(([t]) => ET[t]) : [];
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.msMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.msMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/mar">Blocos do mar por faixa</a><a href="#/biomas/objetos/mar">Objetos do mar por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.leviata ? ET.leviata.name : 'O Leviatã')}</a>: ${E(X.leviataOnde || '')}</p>`;
    return h;
  }
  function escuro() {
    let h = `<p class="lead">${E(X.escuro)}</p><p><span class="rot">Entrada</span>${E(X.escuroEntrada)}</p><p><span class="rot">Luz</span>${E(X.escuroLuz)}</p><p><span class="rot">Som</span>${E(X.escuroSom)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.esFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1, tab = sp ? sp[0].filter(([t]) => ET[t]) : [];
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo, só no escuro. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.esMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.esMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/escuro">Blocos da Escuridão por faixa</a><a href="#/biomas/objetos/escuro">Objetos da Escuridão por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.nox ? ET.nox.name : 'Nox, Aquele Que Apaga')}</a>: ${E(X.noxOnde || '')}</p>`;
    return h;
  }
  function abismo() {
    let h = `<p class="lead">${E(X.abismo)}</p><p><span class="rot">Entrada</span>${E(X.abismoEntrada)}</p><p><span class="rot">Som</span>${E(X.abismoSom)}</p><h2>Faixas</h2><div class="faixas">`;
    for (const f of X.abFaixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1;
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${sp[0].map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${X.abMinerios.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => UDW.item(id, { px: 22 })).join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }],
      X.abMinerios.map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m'], keys: [ITEMS[id].name, a, b] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/abismo">Blocos do abismo por faixa</a><a href="#/biomas/objetos/abismo">Objetos do abismo por faixa</a></p>`;
    h += `<h2>Chefe</h2><p><a href="#/chefes">${E(ET.principecaos ? ET.principecaos.name : 'O Príncipe do Caos')}</a>: ${E(X.principeOnde || '')}</p>`;
    return h;
  }
  // as camadas do revamp (brejo, necrópole, prisão, guerra, acendedores): o mesmo formato das outras, pelos textos de cada uma
  function camada(C) {
    const fx = X[C.fx] || [], mi = X[C.mi] || [], k = C.lead || C.id;
    let h = `<p class="lead">${E(X[k] || '')}</p>${X[k + 'Entrada'] ? `<p><span class="rot">Entrada</span>${E(X[k + 'Entrada'])}</p>` : ''}${X[k + 'Som'] ? `<p><span class="rot">Som</span>${E(X[k + 'Som'])}</p>` : ''}${(C.extras || []).map(([r, key]) => X[key] ? `<p><span class="rot">${E(r)}</span>${E(X[key])}</p>` : '').join('')}<h2>Faixas</h2><div class="faixas">`;
    for (const f of fx) {
      const sp = CATH_SPAWN[f.zona], tab = spTab(sp).filter(([t]) => ET[t]), tot = tab.reduce((n, r) => n + r[1], 0) || 1;
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${tab.map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
        <div class="lista">${mi.filter(([, a, b]) => a < f.ate && b > f.de).map(([id]) => ITEMS[id] ? UDW.item(id, { px: 22 }) : '').join('')}</div>
      </section>`;
    }
    h += `</div><h2>Minérios</h2>` + UDW.table([{ t: 'Minério' }, { t: 'De', cls: 'n' }, { t: 'Até', cls: 'n' }, { t: 'Fornalha' }],
      mi.filter(([id]) => ITEMS[id]).map(([id, a, b]) => ({ cells: [UDW.item(id), a + ' m', b + ' m', FURN[id] ? `${FURN[id].n} → ${UDW.item(FURN[id].bar)}` : 'combustível'], keys: [ITEMS[id].name, a, b, ''] })), 'compacta');
    h += `<p class="bnav"><a href="#/biomas/blocos/${C.id}">Blocos por faixa</a><a href="#/biomas/objetos/${C.id}">Objetos por faixa</a></p>`;
    if (C.chefe && ET[C.chefe[0]]) h += `<h2>Chefe</h2><p><a href="#/chefes/${C.chefe[0]}">${E(ET[C.chefe[0]].name)}</a>, nível ${C.nvChefe}: ${E(X[C.chefe[2]] || C.chefe[1])}</p>`;
    return h;
  }
  function catedral() {
    let h = `<p class="lead">${E(X.catedral)}</p><p><span class="rot">Entrada</span>${E(X.catedralEntrada)}</p>${X.catedralSom ? `<p><span class="rot">Som</span>${E(X.catedralSom)}</p>` : ''}`;
    h += `<h2>Faixas</h2><div class="faixas">`;
    for (const f of X.faixas) {
      const sp = CATH_SPAWN[f.zona], tot = sp ? sp[0].reduce((n, r) => n + r[1], 0) : 1;
      h += `<section class="faixa"><header><b>${E(ZONE_NAMES[f.zona] || f.nome)}</b><em>${f.de} a ${f.ate} m</em><i>"${E(ZONE_SUB[f.zona] || '')}"</i></header>
        <p>${E(f.carater)}.</p><p><span class="rot">Andares</span>${f.andares} <span class="rot">Salas</span>${E(f.salas)}</p>
        ${sp ? `<div class="spawn">${sp[0].map(([t, w]) => `<a href="#/inimigo/${t}" title="">${UDW.enemyImg(t, 2)}<span>${E(ET[t].name)}</span><b>${UDW.pct(w / tot, 0)}</b></a>`).join('')}</div><p class="nota">Até ${sp[1]} monstros ao mesmo tempo. ${lvTxt(f)}</p>` : ''}
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
  const PAREDE = { cavernas: 'WCV_ROCHA', catedral: 'WCT_CALCARIO', gelo: 'WIC_ROCHA', mina: 'WMN_FERROSA', fungo: 'WFG_XISTO', brejo: 'WBJ_TURFA', cidade: 'WCD_CANTARIA', floresta: 'WFP_GRANITO', anoes: 'WAN_CANTARIA',
    elfos: 'WEL_SALAO', mar: 'WMS_ROCHA', dragao: 'WDG_ANDESITO', titas: 'WTT_ROCHA', necropole: 'WNC_GRANITO', antigos: 'WAT_LAJE', prisao: 'WPD_ROCHA', guerra: 'WGU_TERRA', abismo: 'WAB_BASALTO', acendedores: 'WAC_ROCHA', escuro: 'WES_BREU' };
  const ev = n => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const chave = C => C.id === 'catedral' ? 'ct' : C.pre.toLowerCase();
  // as camadas na ordem do jogo (as que têm faixas na wiki) e a superfície
  const BIOMAS = () => [
    ...CAMS().filter(C => X[C.fx] && (C.id === 'cavernas' || C.id === 'catedral' || typeof ev(C.pre + '_S0') === 'number')).map(C => ({ id: C.id, nome: C.nome, de: C.id === 'cavernas' ? UDW_PROF.bands('cavernas')[0] : C.de, ate: C.ate, parede: ev(PAREDE[C.id]) || 1,
      faixas: X[C.fx].map((f, b) => ({ k: chave(C) + b, nome: ZONE_NAMES[f.zona] || f.nome, de: f.de, ate: f.ate })) })),
    { id: 'superficie', nome: 'Superfície', parede: 1, faixas: [{ k: 'sup', nome: 'Vilarejo, campos e morros', de: null }] }
  ];
  function census() {
    if (UDW.censo) return UDW.censo;
    const C = { t: {}, w: {}, p: {}, n: SEEDS.length };
    const add = (o, id, k) => { (o[id] = o[id] || {})[k] = (o[id][k] || 0) + 1; };
    // a faixa de uma linha: da camada mais funda para cima, pelo topo (S0) e altura de cada gerador (GEN_NOMES do 129) e as faixas dela (XX_BANDS)
    let FX = null;
    const faixasDoMundo = () => CAMS().filter(C => C.id !== 'cavernas' && C.id !== 'catedral' && GEN_NOMES[C.id]).map(C => {
      const y0 = ev(GEN_NOMES[C.id][0]), d = ev(GEN_NOMES[C.id][1]), B = ev(C.pre + '_BANDS');
      return typeof y0 === 'number' && typeof d === 'number' && Array.isArray(B) ? { y0, y1: y0 + d, B, k: chave(C) } : null; }).filter(Boolean).reverse();
    const bandOf = (x, y) => {
      if (y < surf[x] + 6 || y - CV_S0 < CV_BANDS[0]) return 'sup';
      for (const F of FX) if (y >= F.y0 && y < F.y1) { const r = y - F.y0; let b = 0; while (b < 3 && r >= F.B[b + 1]) b++; return F.k + b; }
      return y < CB_S0 ? 'cv' + Math.max(0, Math.min(3, caveBand(y))) : 'ct' + cathBand(y);
    };
    for (const sd of SEEDS) {
      generate(sd); FX = faixasDoMundo();
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
    // as pedras preciosas na rocha de cada camada (117): um bloco por pedra e por rocha, com o nome da pedra
    if (typeof ORE_NAME !== 'undefined') for (const t in ORE_NAME) if (!NOMES.t[t] && typeof ORE_ITEM !== 'undefined' && ORE_ITEM[t]) NOMES.t[t] = ORE_NAME[t] + ' na rocha';
    return NOMES;
  }
  const isOre = t => [COAL, COPPER, IRON, GOLD, CRYSTAL, CV_O_CARVAO, CV_O_COBRE, CV_O_FERRO, CV_O_OURO, IC_O_FERRO, IC_O_OURO, IC_O_CRISTAL, MN_O_CARVAO, MN_O_COBALTO, IC_O_CARVAO, MN_O_FERRO, MN_O_OURO, MN_O_CRISTAL, AB_O_CARVAO, AB_O_INFERNITA, FG_O_CARVAO, FG_O_ESPORITA, CD_O_CARVAO, CD_O_PRATA, FP_O_CARVAO, FP_O_PLATINA, FP_O_CRISTAL].includes(t) || (typeof ORE_ITEM !== 'undefined' && !!ORE_ITEM[t]) || (typeof CM_O_AMBRITA !== 'undefined' && (t === CM_O_CARVAO || t === CM_O_AMBRITA)) || (typeof ES_O_NOCTIRIO !== 'undefined' && (t === ES_O_CARVAO || t === ES_O_NOCTIRIO)) || (typeof NV_O_XENITA !== 'undefined' && (t === NV_O_CARVAO || t === NV_O_XENITA)) || (typeof EL_O_LUNARITA !== 'undefined' && (t === EL_O_CARVAO || t === EL_O_LUNARITA)) || (typeof DG_O_DRACONIO !== 'undefined' && (t === DG_O_CARVAO || t === DG_O_DRACONIO)) || (typeof AT_O_ESTELAR !== 'undefined' && (t === AT_O_CARVAO || t === AT_O_ESTELAR)) || (typeof TT_O_ADAMANTITA !== 'undefined' && (t === TT_O_CARVAO || t === TT_O_ADAMANTITA));
  // os minérios das camadas novas: os nomes XX_O_* dos textos e o CAMADA_EXT[id].minerios (129)
  let ORES = null;
  const oresNovos = () => { if (ORES) return ORES; ORES = new Set(); for (const k in X.blocoNome) if (/_O_/.test(k)) { const v = ev(k); if (typeof v === 'number') ORES.add(v); }
    if (typeof CAMADA_EXT !== 'undefined') for (const id in CAMADA_EXT) for (const n of CAMADA_EXT[id].minerios || []) { const v = ev(n); if (typeof v === 'number') ORES.add(v); } return ORES; };
  const kindT = t => isOre(t) || oresNovos().has(t) ? 'Minérios' : SOLID[t] && BLOCKY[t] ? 'Terreno' : 'Decoração de um bloco';
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
      for (const g of ['Terreno', 'Minérios', 'Decoração de um bloco']) {
        const gs = ts.filter(t => kindT(t) === g); if (!gs.length) continue;
        linhas.push(`<tr class="grupo"><td colspan="${B.faixas.length + 1}">${g}</td></tr>`);
        for (const t of gs) { const d = BLOCK_DROP[t] || (typeof ORE_ITEM !== 'undefined' && ORE_ITEM[t]);
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
      return `<figure class="prop"><div class="pimg">${UDW.propImg(id, 0, P.vars[0].w > 60 ? 1 : 2)}</div><figcaption><b>${E(P.nome || id)}</b><span>${(P.faixas || []).map(f => ((X.faixaChavePref || {})[id.slice(0, 3)] || {})[f] || X.faixaChave[f] || f).join(', ')}</span></figcaption></figure>`; }).join('')}</div>`;
    return h;
  }

  UDW.pages.biomas = {
    render(tab = 'cavernas', anchor) {
      const Ls = CAMS(), C = Ls.find(c => c.id === tab);
      const sub = C ? `Camada ${C.pos} de ${Ls.length}, ${C.pos > 1 ? 'debaixo ' + UDW_PROF.de(Ls[C.pos - 2].nome) : 'logo debaixo do vilarejo'}: monstros dos níveis ${C.nvLo} a ${C.nvHi}, chefe no nível ${C.nvChefe}.`
        : { blocos: 'O que nasce em cada camada, faixa por faixa.', objetos: 'Os objetos de cena de cada camada, faixa por faixa.' }[tab] || '';
      let h = UDW.head(C ? C.nome : 'Biomas', sub) + UDW.tabs('biomas', TABS(), tab);
      if (tab === 'objetos' || tab === 'blocos') h += UDW.censo ? (tab === 'objetos' ? objetos() : blocos()) : '<p class="nota" id="censo">Gerando mundos para contar o que nasce em cada faixa...</p>';
      else if (tab === 'documento' || tab === 'regras') { const d = UDW_DOCS.find(x => x.id === (tab === 'documento' ? 'biomas' : 'regras-de-bioma')); h += UDW.docView(d); }
      else if (C) { const F = { cavernas, catedral, gelo, mina, fungo, cidade, floresta, anoes, elfos, mar, dragao, titas, antigos, abismo, escuro }[C.id]; h += F ? F() : camada(C); }
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
