'use strict';

/* ================= inimigos e chefes (ET do 10-combate, mudado pelo 44, 46 e 49) ================= */
(() => {
  const E = UDW.esc, N = UDW.num;
  const isBoss = t => !!(ET[t] && ET[t].boss);
  // os números de um monstro num nível: cria um de mentira com o spawnEnemy do jogo, na profundidade daquele nível, e tira da lista
  UDW.enemyAt = (t, lvl) => {
    if (t === 'rei') return { lvl: REI.lvl, hp: REI.hp, dmg: REI.dmg, xp: REI.xp, gold: 0 };
    if (t === 'yetiancestral') return { lvl: 9, hp: ET.yetiancestral.hp, dmg: ET.yetiancestral.dmg, xp: ET.yetiancestral.xp, gold: 0 };
    if (t === 'maeesporo') return { lvl: layerBossLvl('fungo'), hp: ET.maeesporo.hp, dmg: ET.maeesporo.dmg, xp: ET.maeesporo.xp, gold: 0 };
    if (t === 'nox') return { lvl: NOX_L, hp: ET.nox.hp, dmg: ET.nox.dmg, xp: ET.nox.xp, gold: 0 };
    if (t === 'sineiro') return { lvl: layerBossLvl('cidade'), hp: ET.sineiro.hp, dmg: ET.sineiro.dmg, xp: ET.sineiro.xp, gold: 0 };
    if (t === 'cervo') return { lvl: layerBossLvl('floresta'), hp: ET.cervo.hp, dmg: ET.cervo.dmg, xp: ET.cervo.xp, gold: 0 };
    if (t === 'dama') return { lvl: layerBossLvl('elfos'), hp: ET.dama.hp, dmg: ET.dama.dmg, xp: ET.dama.xp, gold: 0 };
    if (t === 'olhocometa') return { lvl: layerBossLvl('nave'), hp: ET.olhocometa.hp, dmg: ET.olhocometa.dmg, xp: ET.olhocometa.xp, gold: 0 };
    if (t === 'rainha') return { lvl: layerBossLvl('colmeia'), hp: ET.rainha.hp, dmg: ET.rainha.dmg, xp: ET.rainha.xp, gold: 0 };
    if (t === 'autoforja') return { lvl: layerBossLvl('anoes'), hp: ET.autoforja.hp, dmg: ET.autoforja.dmg, xp: ET.autoforja.xp, gold: 0 };
    if (t === 'principecaos') return { lvl: layerBossLvl('abismo'), hp: ET.principecaos.hp, dmg: ET.principecaos.dmg, xp: ET.principecaos.xp, gold: 0 };
    if (t === 'reigoblin') return { lvl: 10, hp: ET.reigoblin.hp, dmg: ET.reigoblin.dmg, xp: ET.reigoblin.xp, gold: 0 };
    if (t === 'maeteia') return { lvl: 4, hp: ET.maeteia.hp, dmg: ET.maeteia.dmg, xp: ET.maeteia.xp, gold: 0 };
    // the same numbers the spawnEnemy of 10 and 56 give at that level
    const D = ET[t], m = 1 + 0.3 * (lvl - 1);
    return { lvl, hp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) };
  };
  // where each level is found (caves 1 level every 50 m; every layer below starts 1 above the one over it, its second level from 93 m down; 30% are born a level higher, never past the layer's top)
  const ondeNivel = l => { const o = []; if (l <= 4) o.push(`${(l - 1) * 50 + (l === 1 ? 6 : 0)} a ${Math.min(CAVE_D, l * 50) - 1} m`); LAYERS.forEach((L, n) => { if (!n) return; const top = n * LAYER_D, lo = layerLo(L.id); if (l === lo) o.push(`${top} a ${top + 92} m`); if (l === lo + 1) o.push(`${top + 93} a ${top + LAYER_D - 1} m`); }); return o.join(' e ') || '30% nascem um nível acima'; };
  // a camada de uma zona do CATH_SPAWN (1 a 4: as cavernas antigas, desligadas)
  const zoneLayer = z => typeof EL_ZONE0 !== 'undefined' && typeof ELFOS !== 'undefined' && z >= EL_ZONE0 && z < EL_ZONE0 + 4 ? 'elfos' : typeof NV_ZONE0 !== 'undefined' && typeof NAVE !== 'undefined' && z >= NV_ZONE0 && z < NV_ZONE0 + 4 ? 'nave' : typeof ES_ZONE0 !== 'undefined' && typeof ESCURO !== 'undefined' && z >= ES_ZONE0 && z < ES_ZONE0 + 4 ? 'escuro' : typeof CM_ZONE0 !== 'undefined' && typeof COLMEIA !== 'undefined' && z >= CM_ZONE0 && z < CM_ZONE0 + 4 ? 'colmeia' : typeof AN_ZONE0 !== 'undefined' && typeof ANOES !== 'undefined' && z >= AN_ZONE0 && z < AN_ZONE0 + 4 ? 'anoes' : typeof FP_ZONE0 !== 'undefined' && z >= FP_ZONE0 && z < FP_ZONE0 + 4 ? 'floresta' : typeof CD_ZONE0 !== 'undefined' && z >= CD_ZONE0 ? 'cidade' : typeof FG_ZONE0 !== 'undefined' && z >= FG_ZONE0 ? 'fungo' : typeof AB_ZONE0 !== 'undefined' && z >= AB_ZONE0 ? 'abismo' : typeof MN_ZONE0 !== 'undefined' && z >= MN_ZONE0 ? 'mina' : z >= IC_ZONE0 ? 'gelo' : null;;
  // o peso de um monstro numa tabela de spawn, somando se ele aparece mais de uma vez (a zona 33 lista as sementes duas vezes)
  const wOf = (tab, t) => tab.reduce((n, r) => n + (r[0] === t ? r[1] : 0), 0);
  // onde cada um aparece: CATH_SPAWN (45) faixa por faixa
  UDW.spawnsOf = t => {
    const o = [];
    for (const z in CATH_SPAWN) { const [tab, max] = CATH_SPAWN[z], tot = tab.reduce((n, r) => n + r[1], 0), w = wOf(tab, t); if (w) o.push({ z: +z, nome: ZONE_NAMES[z], p: w / tot, max }); }
    return o;
  };
  const flags = t => { const D = ET[t], f = []; if (D.fly && !D.crawl) f.push('Voa'); if (D.crawl) f.push('Anda em parede e teto'); if (D.phase) f.push('Atravessa paredes'); if (D.boss) f.push('Chefe'); if (D.touch) f.push('Corpo machuca'); return f; };

  function card(t) {
    const D = ET[t], e = UDW.enemyAt(t, 1), sp = UDW.spawnsOf(t);
    return `<a class="ecard${UDW.ativos().has(t) ? '' : ' off'}" href="#/inimigo/${t}"><div class="eart">${UDW.enemyImg(t, D.boss ? 2 : 3)}</div><b>${E(D.name)}</b>
      <div class="mini"><span>Vida <b>${e.hp}</b></span><span>Dano <b>${e.dmg}</b></span><span>XP <b>${e.xp}</b></span></div>
      <small>${sp.length ? sp.map(s => s.nome).join(', ') : t === 'rei' ? 'Sala do trono' : t === 'maeteia' ? 'Câmara do Ninho' : t === 'yetiancestral' ? 'Trono de Gelo' : t === 'reigoblin' ? 'Oficina da Escavadeira' : t === 'principecaos' ? 'Trono do Caos' : t === 'sineiro' ? 'Torre do Sino' : t === 'nox' ? 'O Escuro Total' : t === 'cervo' ? 'Clareira dos Troncos Gigantes' : t === 'autoforja' || t === 'afparte' ? 'A Grande Forja' : t === 'olhocometa' ? 'O Planetário' : t === 'rainha' || t === 'rainhasaco' ? 'A esfera da Rainha' : t === 'larva' ? 'Ovos e favos reais quebrados' : t === 'maeesporo' || t === 'maebulbo' ? 'Gruta da Mãe' : t === 'filhote' ? 'Ovos da Mãe-Teia' : 'Cavernas desligadas'}</small></a>`;
  }
  // os monstros de cada bioma, faixa por faixa (CATH_SPAWN do 45 e do 56)
  // nível dos monstros numa faixa (o mesmo cálculo do layerLvl do 52 com o registro de camadas do 129: cada camada começa 1 acima do fim da de cima, sobe 1 a partir de 93 m)
  const layerAt = m => LAYERS[Math.min(LAYERS.length, Math.floor(m / LAYER_D) + 1) - 1].id;
  const lvAt = m => m < CAVE_D ? 1 + Math.min(3, Math.floor(m / 50)) : layerLo(layerAt(m)) + (m % LAYER_D >= 93 ? 1 : 0);
  // o mais alto da camada: os 30% de sorte nunca passam dele
  const lvTop = m => m < CAVE_D ? 4 : layerLo(layerAt(m)) + 1;
  const BIOMAS = () => [
    { id: 'cavernas', nome: 'As Cavernas', faixas: UDW_TXT.cvFaixas, chefes: [['maeteia', 'Câmara do Ninho, no fundo do Ninho']], extra: { filhote: 'Só sai dos ovos durante a luta com a Mãe-Teia' } },
    { id: 'catedral', nome: 'A Catedral Abandonada', faixas: UDW_TXT.faixas, chefes: [['rei', 'Sala do trono, na Nave ou no Claustro']], extra: {} },
    { id: 'gelo', nome: 'As Cavernas de Gelo', faixas: UDW_TXT.icFaixas, chefes: [['yetiancestral', 'Trono de Gelo, no Coração do Inverno']], extra: {} },
    { id: 'mina', nome: 'A Mina Abandonada', faixas: UDW_TXT.mnFaixas, chefes: [['reigoblin', 'Oficina da Escavadeira, nas Fornalhas Esquecidas']], extra: {} },
    { id: 'fungo', nome: 'As Minas Fúngicas', faixas: UDW_TXT.fgFaixas, chefes: [['maeesporo', 'Gruta da Mãe, no Coração do Micélio']], extra: { aguaviva: 'Nasce só na água das Grutas Alagadas e do Coração' } },
    { id: 'cidade', nome: 'A Cidade Afundada', faixas: UDW_TXT.cdFaixas, chefes: [['sineiro', 'Torre do Sino, no Palácio do Sino']], extra: {} },
    { id: 'floresta', nome: 'A Floresta Petrificada', faixas: UDW_TXT.fpFaixas, chefes: [['cervo', 'Clareira dos Troncos Gigantes, na Clareira dos Gigantes']], extra: {} },
    { id: 'anoes', nome: 'A Fortaleza dos Anões', faixas: UDW_TXT.anFaixas, chefes: [['autoforja', 'A Grande Forja, nas Forjas de Runas']], extra: {} },
    { id: 'colmeia', nome: 'A Colmeia', faixas: UDW_TXT.cmFaixas, chefes: [['rainha', 'A esfera de favos, no Berçário']], extra: { rainhasaco: 'Só aparece na luta com a Rainha, quando ela solta o abdômen' } },
    { id: 'nave', nome: 'A Nave Caída', faixas: UDW_TXT.nvFaixas, chefes: [['olhocometa', 'O Planetário, no Núcleo']], extra: {} },
    { id: 'elfos', nome: 'O Reino Élfico', faixas: UDW_TXT.elFaixas, chefes: [['dama', 'O Espelho da Lua, no Poço da Lua']], extra: { fatuo: 'Vem em grupos de 3 a 5' } },
    { id: 'abismo', nome: 'O Abismo', faixas: UDW_TXT.abFaixas, chefes: [['principecaos', 'Trono do Caos, no fundo do Abismo']], extra: {} },
    { id: 'escuro', nome: 'A Escuridão', faixas: UDW_TXT.esFaixas, chefes: [['nox', 'O Escuro Total, no Fundo do Mundo']], extra: { maofundo: 'Nasce só nos poços sem fundo dos Grandes Vãos', traca: 'Vem em bandos de 5 a 8' } }
  ];
  function bioma(B) {
    const zs = B.faixas.map(f => ({ ...f, sp: CATH_SPAWN[f.zona] })), seen = [];
    for (const z of zs) for (const [t] of (z.sp ? z.sp[0] : [])) if (ET[t] && !seen.includes(t)) seen.push(t);
    const head = `<thead><tr><th></th>${zs.map(z => `<th class="fxh"><b>${E(ZONE_NAMES[z.zona] || z.nome)}</b><small>${z.de} a ${z.ate} m</small><small>nível ${lvAt(z.de)} a ${Math.min(lvTop(z.de), lvAt(z.ate - 1) + 1)}${z.sp ? ` · até ${z.sp[1]} juntos` : ''}</small></th>`).join('')}</tr></thead>`;
    const nome = t => { const e = UDW.enemyAt(t, 1); return `<td class="en"><a href="#/inimigo/${t}"><span class="eimg">${UDW.enemyImg(t, ET[t].boss ? 2 : 3)}</span><span><b>${E(ET[t].name)}</b><small>Vida ${e.hp} · Dano ${e.dmg} · XP ${e.xp}</small></span></a></td>`; };
    const rows = seen.map(t => `<tr>${nome(t)}${zs.map(z => { const tab = z.sp ? z.sp[0] : [], tot = tab.reduce((n, r) => n + r[1], 0), w = wOf(tab, t);
      if (!w) return '<td class="fx0"></td>'; const p = w / tot, lv = p >= 0.25 ? 3 : p >= 0.15 ? 2 : 1; return `<td class="fx${lv}"><i></i><span>${UDW.pct(p, 0)}</span></td>`; }).join('')}</tr>`);
    if (B.extra) for (const t in B.extra) if (ET[t] && !seen.includes(t)) rows.push(`<tr>${nome(t)}<td colspan="${zs.length}" class="onde">${E(B.extra[t])}</td></tr>`);
    const boss = B.chefes.filter(([t]) => ET[t]).map(([t, onde]) => `<tr class="chefe-l">${nome(t)}<td colspan="${zs.length}" class="onde"><a href="#/chefes">Chefe</a>: ${E(onde)}</td></tr>`);
    return `<h2 id="${B.id}">${E(B.nome)} <small>${seen.length} monstros</small></h2><div class="tw"><table class="grade matriz inim">${head}<tbody>${rows.join('')}${boss.length ? `<tr class="grupo"><td colspan="${zs.length + 1}">Chefe</td></tr>` + boss.join('') : ''}</tbody></table></div>`;
  }
  UDW.pages.inimigos = {
    render(anchor) {
      const A = UDW.ativos(), off = Object.keys(ET).filter(t => !isBoss(t) && !A.has(t));
      return UDW.head('Inimigos', 'Por bioma e faixa. A porcentagem é a chance de cada monstro entre os que nascem naquela faixa. Números no nível 1: cada nível a mais soma 30% de vida e 20% de dano, e 30% nascem um nível acima.')
        + `<p class="bnav">${BIOMAS().map(B => `<a href="#/inimigos/${B.id}">${E(B.nome)}</a>`).join('')}<a href="#/inimigos/desligadas">Cavernas desligadas</a></p>`
        + `<h2 id="superficie">Superfície</h2><p class="nota">Nenhum monstro: o vilarejo e os campos são seguros, de dia e de noite.</p>`
        + BIOMAS().map(bioma).join('')
        + `<h2 id="desligadas">Nas cavernas desligadas <small>${off.length}</small></h2><p class="nota">${UDW_TXT.cavernas}</p><div class="egrid">${off.map(card).join('')}</div>`;
    },
    after(root, anchor) { if (anchor && $(anchor)) $(anchor).scrollIntoView(); }
  };

  UDW.pages.inimigo = {
    render(t) {
      const D = ET[t]; if (!D) return UDW.head('Inimigo não encontrado');
      const A = UDW.ativos(), sp = UDW.spawnsOf(t), zl = sp.length ? zoneLayer(sp[0].z) : null, lo = zl && sp.every(s => zoneLayer(s.z) === zl) ? layerLo(zl) : 0, lv = D.boss ? [1] : lo ? [lo - 1, lo, lo + 1, lo + 2] : [1, 2, 3, 4, 5, 6];
      let h = `<p class="volta"><a href="#/${D.boss ? 'chefes' : 'inimigos'}">← ${D.boss ? 'Chefes' : 'Inimigos'}</a></p>`;
      h += `<div class="etopo"><div class="eart big">${UDW.enemyImg(t, D.boss ? 4 : 6)}</div><div><h1>${E(D.name)}</h1>
        <div class="chips">${A.has(t) ? UDW.chip('No mundo', '#7fd36a') : UDW.chip('Desligado', '#8a7f70')}${flags(t).map(f => UDW.chip(f)).join('')}</div>
        <p class="lead">${E(UDW_TXT.inimigos[t] || '')}</p></div></div>`;
      if (!D.boss) h += `<h2>Por nível</h2>` + UDW.table([{ t: 'Nível', cls: 'n' }, { t: 'Profundidade', cls: 'n' }, { t: 'Vida', cls: 'n' }, { t: 'Dano', cls: 'n' }, { t: 'XP', cls: 'n' }, { t: 'Ouro', cls: 'n' }],
        lv.map(l => { const e = UDW.enemyAt(t, l); return { cells: [l, ondeNivel(l), e.hp, e.dmg, e.xp, `até ${e.gold}`], keys: [l, l, e.hp, e.dmg, e.xp, e.gold] }; }), 'compacta');
      if (sp.length) h += `<h2>Onde aparece</h2>` + UDW.table([{ t: 'Faixa' }, { t: 'Chance entre os monstros da faixa', cls: 'n' }, { t: 'Máximo ao mesmo tempo', cls: 'n' }],
        sp.map(s => ({ cells: [s.nome, UDW.pct(s.p, 0), s.max], keys: [s.z, s.p, s.max] })), 'compacta');
      const dr = DROPS[t] || [];
      if (dr.length) h += `<h2>O que solta</h2>` + UDW.table([{ t: 'Item' }, { t: 'Chance por morte', cls: 'n' }, { t: 'Quantidade', cls: 'n' }],
        dr.map(r => ({ cells: [UDW.item(r[0]), UDW.pct(UDW.dropRate(t, r), 2), r[2] ? (r[3] && r[3] !== r[2] ? `${r[2]}–${r[3]}` : r[2]) : 1], keys: [ITEMS[r[0]].name, UDW.dropRate(t, r), r[2] || 1] })))
        + (D.boss ? '' : `<p class="nota">Além disso: ${t === 'slime' ? '' : '6% de chance de uma tocha, '}55% de chance de ouro. Equipamento sai com raridade sorteada (tabela "Monstro").</p>`);
      return h;
    }
  };

  UDW.pages.chefes = {
    render() {
      const A = UDW.ativos();
      const rei = ET.rei ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('rei', 4)}</div><div>
        <h2>${E(ET.rei.name)} ${A.has('rei') ? UDW.chip('No mundo', '#7fd36a') : ''}</h2><p class="lead">${E(UDW_TXT.reiOnde)}</p>
        <div class="stats">${UDW.stat(REI.hp, 'vida')}${UDW.stat(REI.dmg, 'dano')}${UDW.stat(REI.xp, 'XP')}${UDW.stat(REI.lvl, 'nível')}</div>
        <ol class="fases">${UDW_TXT.reiFases.map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        ${UDW.table([{ t: 'Ajuste' }, { t: 'Fase 1', cls: 'n' }, { t: 'Fase 2', cls: 'n' }, { t: 'Fase 3', cls: 'n' }], [
          ['Velocidade ao andar', REI.speed], ['Preparo do golpe (s)', REI.wind], ['Recuperação depois do golpe (s)', REI.rec], ['Pausa entre ataques (s)', REI.cd], ['Esqueletos por invocação', REI.sumN], ['Máximo de esqueletos', REI.sumCap], ['Intervalo de invocação (s)', REI.sumCD]
        ].filter(r => Array.isArray(r[1])).map(([k, v]) => ({ cells: [k, ...v.map(x => N(x, 2).replace(/,?0+$/, ''))], keys: [k, ...v] })), 'compacta')}
        <h3>Solta</h3><div class="lista">${(DROPS.rei || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T2 = ET.maeteia ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('maeteia', 3)}</div><div>
        <h2>${E(ET.maeteia.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.teiaOnde)}</p>
        <div class="stats">${UDW.stat(ET.maeteia.hp, 'vida')}${UDW.stat(ET.maeteia.dmg, 'dano')}${UDW.stat(ET.maeteia.xp, 'XP')}${UDW.stat(4, 'nível')}</div>
        <ol class="fases">${UDW_TXT.teiaFases.map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.maeteia || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T3 = ET.yetiancestral ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('yetiancestral', 2)}</div><div>
        <h2>${E(ET.yetiancestral.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.yetiOnde)}</p>
        <div class="stats">${UDW.stat(ET.yetiancestral.hp, 'vida')}${UDW.stat(ET.yetiancestral.dmg, 'dano')}${UDW.stat(ET.yetiancestral.xp, 'XP')}${UDW.stat(9, 'nível')}</div>
        <ol class="fases">${UDW_TXT.yetiFases.map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.yetiancestral || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T4 = ET.reigoblin ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('reigoblin', 2)}</div><div>
        <h2>${E(ET.reigoblin.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.rgOnde)}</p>
        <div class="stats">${UDW.stat(ET.reigoblin.hp, 'vida')}${UDW.stat(ET.reigoblin.dmg, 'dano')}${UDW.stat(ET.reigoblin.xp, 'XP')}${UDW.stat(10, 'nível')}</div>
        <ol class="fases">${UDW_TXT.rgFases.map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.reigoblin || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T5 = ET.principecaos ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('principecaos', 2)}</div><div>
        <h2>${E(ET.principecaos.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.principeOnde || '')}</p>
        <div class="stats">${UDW.stat(ET.principecaos.hp, 'vida')}${UDW.stat(ET.principecaos.dmg, 'dano')}${UDW.stat(ET.principecaos.xp, 'XP')}${UDW.stat(layerBossLvl('abismo'), 'nível')}</div>
        <ol class="fases">${(UDW_TXT.principeFases || []).map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.principecaos || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T6 = ET.maeesporo ? `<section class="chefe"><div class="eart big">${(() => { try { const w = MAEA.wall(false).cv, c = document.createElement("canvas"), cw = 200, ch = 200; c.width = cw; c.height = ch; c.getContext("2d").drawImage(w, 140, 30, cw, ch, 0, 0, cw, ch); return `<img alt="" src="${c.toDataURL()}" style="width:${cw}px;image-rendering:pixelated">`; } catch (err) { return ''; } })()}</div><div>
        <h2>${E(ET.maeesporo.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.maeOnde || '')}</p>
        <div class="stats">${UDW.stat(ET.maeesporo.hp, 'vida')}${UDW.stat(ET.maeesporo.dmg, 'dano')}${UDW.stat(ET.maeesporo.xp, 'XP')}${UDW.stat(layerBossLvl('fungo'), 'nível')}</div>
        <ol class="fases">${(UDW_TXT.maeFases || []).map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.maeesporo || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T7 = ET.sineiro ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('sineiro', 2)}</div><div>
        <h2>${E(ET.sineiro.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.sineiroOnde || '')}</p>
        <div class="stats">${UDW.stat(ET.sineiro.hp, 'vida')}${UDW.stat(ET.sineiro.dmg, 'dano')}${UDW.stat(ET.sineiro.xp, 'XP')}${UDW.stat(layerBossLvl('cidade'), 'nível')}</div>
        <ol class="fases">${(UDW_TXT.sineiroFases || []).map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.sineiro || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T8 = ET.cervo ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('cervo', 2)}</div><div>
        <h2>${E(ET.cervo.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.cervoOnde || '')}</p>
        <div class="stats">${UDW.stat(ET.cervo.hp, 'vida')}${UDW.stat(ET.cervo.dmg, 'dano')}${UDW.stat(ET.cervo.xp, 'XP')}${UDW.stat(layerBossLvl('floresta'), 'nível')}</div>
        <ol class="fases">${(UDW_TXT.cervoFases || []).map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.cervo || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T9 = ET.autoforja ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('autoforja', 2)}</div><div>
        <h2>${E(ET.autoforja.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.autoforjaOnde || '')}</p>
        <div class="stats">${UDW.stat(ET.autoforja.hp, 'vida')}${UDW.stat(ET.autoforja.dmg, 'dano')}${UDW.stat(ET.autoforja.xp, 'XP')}${UDW.stat(layerBossLvl('anoes'), 'nível')}</div>
        <ol class="fases">${(UDW_TXT.autoforjaFases || []).map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.autoforja || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T10 = ET.rainha ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('rainha', 2)}</div><div>
        <h2>${E(ET.rainha.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.rainhaOnde || '')}</p>
        <div class="stats">${UDW.stat(ET.rainha.hp, 'vida')}${UDW.stat(ET.rainha.dmg, 'dano')}${UDW.stat(ET.rainha.xp, 'XP')}${UDW.stat(layerBossLvl('colmeia'), 'nível')}</div>
        <ol class="fases">${(UDW_TXT.rainhaFases || []).map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.rainha || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T13 = ET.dama ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('dama', 2)}</div><div>
        <h2>${E(ET.dama.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.damaEspelhoOnde || '')}</p>
        <div class="stats">${UDW.stat(ET.dama.hp, 'vida')}${UDW.stat(ET.dama.dmg, 'dano')}${UDW.stat(ET.dama.xp, 'XP')}${UDW.stat(layerBossLvl('elfos'), 'nível')}</div>
        <ol class="fases">${(UDW_TXT.damaFases || []).map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.dama || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T12 = ET.olhocometa ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('olhocometa', 2)}</div><div>
        <h2>${E(ET.olhocometa.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.olhoCometaOnde || '')}</p>
        <div class="stats">${UDW.stat(ET.olhocometa.hp, 'vida')}${UDW.stat(ET.olhocometa.dmg, 'dano')}${UDW.stat(ET.olhocometa.xp, 'XP')}${UDW.stat(layerBossLvl('nave'), 'nível')}</div>
        <ol class="fases">${(UDW_TXT.olhoCometaFases || []).map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.olhocometa || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      const T11 = ET.nox ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('nox', 2)}</div><div>
        <h2>${E(ET.nox.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.noxOnde || '')}</p>
        <div class="stats">${UDW.stat(ET.nox.hp, 'vida')}${UDW.stat(ET.nox.dmg, 'dano')}${UDW.stat(ET.nox.xp, 'XP')}${UDW.stat(NOX_L, 'nível')}</div>
        <ol class="fases">${(UDW_TXT.noxFases || []).map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.nox || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      return UDW.head('Chefes') + T11 + T5 + T13 + T12 + T10 + T9 + T8 + T7 + T6 + T4 + T3 + T2 + rei;
    }
  };
})();
