'use strict';

/* ================= inimigos e chefes (ET do 10-combate, mudado pelo 44, 46 e 49) ================= */
(() => {
  const E = UDW.esc, N = UDW.num;
  const isBoss = t => !!(ET[t] && ET[t].boss);
  // os números de um monstro num nível: cria um de mentira com o spawnEnemy do jogo, na profundidade daquele nível, e tira da lista
  UDW.enemyAt = (t, lvl) => {
    if (t === 'rei') return { lvl: REI.lvl, hp: REI.hp, dmg: REI.dmg, xp: REI.xp, gold: 0 };
    if (t === 'yetiancestral') return { lvl: 9, hp: ET.yetiancestral.hp, dmg: ET.yetiancestral.dmg, xp: ET.yetiancestral.xp, gold: 0 };
    if (t === 'principecaos') return { lvl: 12, hp: ET.principecaos.hp, dmg: ET.principecaos.dmg, xp: ET.principecaos.xp, gold: 0 };
    if (t === 'reigoblin') return { lvl: 10, hp: ET.reigoblin.hp, dmg: ET.reigoblin.dmg, xp: ET.reigoblin.xp, gold: 0 };
    if (t === 'maeteia') return { lvl: 4, hp: ET.maeteia.hp, dmg: ET.maeteia.dmg, xp: ET.maeteia.xp, gold: 0 };
    // the same numbers the spawnEnemy of 10 and 56 give at that level
    const D = ET[t], m = 1 + 0.3 * (lvl - 1);
    return { lvl, hp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) };
  };
  // where each level is found (56: caves 1 level every 50 m, the cathedral starts at 2 and goes up 1 every 45 m; 30% are born a level higher)
  const ondeNivel = l => { const o = []; if (l <= 4) o.push(`${(l - 1) * 50 + (l === 1 ? 6 : 0)} a ${Math.min(CAVE_D, l * 50) - 1} m`); if (l >= 2 && l <= 6) o.push(`${CAVE_D + (l - 2) * 45} a ${Math.min(IC_TOP, CAVE_D + (l - 1) * 45) - 1} m`); if (l >= 6 && l <= 8) o.push(`${IC_TOP + (l - 6) * 60} a ${Math.min(IC_TOP + IC_D, IC_TOP + (l - 5) * 60) - 1} m`); if (typeof MN_TOP !== 'undefined' && l >= 8 && l <= 10) o.push(`${MN_TOP + (l - 8) * 60} a ${Math.min(MN_TOP + MN_D, MN_TOP + (l - 7) * 60) - 1} m`); if (typeof AB_TOP !== 'undefined' && l >= 10 && l <= 12) o.push(`${AB_TOP + (l - 10) * 60} a ${Math.min(AB_TOP + AB_D, AB_TOP + (l - 9) * 60) - 1} m`); return o.join(' e ') || '30% nascem um nível acima'; };
  // onde cada um aparece: CATH_SPAWN (45) faixa por faixa
  UDW.spawnsOf = t => {
    const o = [];
    for (const z in CATH_SPAWN) { const [tab, max] = CATH_SPAWN[z], tot = tab.reduce((n, r) => n + r[1], 0), r = tab.find(x => x[0] === t); if (r) o.push({ z: +z, nome: ZONE_NAMES[z], p: r[1] / tot, max }); }
    return o;
  };
  const flags = t => { const D = ET[t], f = []; if (D.fly && !D.crawl) f.push('Voa'); if (D.crawl) f.push('Anda em parede e teto'); if (D.phase) f.push('Atravessa paredes'); if (D.boss) f.push('Chefe'); if (D.touch) f.push('Corpo machuca'); return f; };

  function card(t) {
    const D = ET[t], e = UDW.enemyAt(t, 1), sp = UDW.spawnsOf(t);
    return `<a class="ecard${UDW.ativos().has(t) ? '' : ' off'}" href="#/inimigo/${t}"><div class="eart">${UDW.enemyImg(t, D.boss ? 2 : 3)}</div><b>${E(D.name)}</b>
      <div class="mini"><span>Vida <b>${e.hp}</b></span><span>Dano <b>${e.dmg}</b></span><span>XP <b>${e.xp}</b></span></div>
      <small>${sp.length ? sp.map(s => s.nome).join(', ') : t === 'rei' ? 'Sala do trono' : t === 'maeteia' ? 'Câmara do Ninho' : t === 'yetiancestral' ? 'Trono de Gelo' : t === 'reigoblin' ? 'Oficina da Escavadeira' : t === 'principecaos' ? 'Trono do Caos' : t === 'filhote' ? 'Ovos da Mãe-Teia' : 'Cavernas desligadas'}</small></a>`;
  }
  // os monstros de cada bioma, faixa por faixa (CATH_SPAWN do 45 e do 56)
  const lvAt = m => typeof AB_TOP !== 'undefined' && m >= AB_TOP ? 10 + Math.min(2, Math.floor((m - AB_TOP) / 60)) : typeof MN_TOP !== 'undefined' && m >= MN_TOP ? 8 + Math.min(2, Math.floor((m - MN_TOP) / 60)) : m >= IC_TOP ? 6 + Math.min(2, Math.floor((m - IC_TOP) / 60)) : m < CAVE_D ? 1 + Math.min(3, Math.floor(m / 50)) : Math.min(6, 2 + Math.floor((m - CAVE_D) / 45));
  const BIOMAS = () => [
    { id: 'cavernas', nome: 'As Cavernas', faixas: UDW_TXT.cvFaixas, chefes: [['maeteia', 'Câmara do Ninho, no fundo do Ninho']], extra: { filhote: 'Só sai dos ovos durante a luta com a Mãe-Teia' } },
    { id: 'catedral', nome: 'A Catedral Abandonada', faixas: UDW_TXT.faixas, chefes: [['rei', 'Sala do trono, na Nave ou no Claustro']], extra: {} },
    { id: 'gelo', nome: 'As Cavernas de Gelo', faixas: UDW_TXT.icFaixas, chefes: [['yetiancestral', 'Trono de Gelo, no Coração do Inverno']], extra: {} },
    { id: 'mina', nome: 'A Mina Abandonada', faixas: UDW_TXT.mnFaixas, chefes: [['reigoblin', 'Oficina da Escavadeira, nas Fornalhas Esquecidas']], extra: {} },
    { id: 'abismo', nome: 'O Abismo', faixas: UDW_TXT.abFaixas, chefes: [['principecaos', 'Trono do Caos, no fundo do Abismo']], extra: {} }
  ];
  function bioma(B) {
    const zs = B.faixas.map(f => ({ ...f, sp: CATH_SPAWN[f.zona] })), seen = [];
    for (const z of zs) for (const [t] of (z.sp ? z.sp[0] : [])) if (!seen.includes(t)) seen.push(t);
    const head = `<thead><tr><th></th>${zs.map(z => `<th class="fxh"><b>${E(ZONE_NAMES[z.zona] || z.nome)}</b><small>${z.de} a ${z.ate} m</small><small>nível ${lvAt(z.de)} a ${Math.min(typeof MN_TOP !== 'undefined' && z.de >= MN_TOP ? 11 : z.de >= IC_TOP ? 9 : 7, lvAt(z.ate - 1) + 1)}${z.sp ? ` · até ${z.sp[1]} juntos` : ''}</small></th>`).join('')}</tr></thead>`;
    const nome = t => { const e = UDW.enemyAt(t, 1); return `<td class="en"><a href="#/inimigo/${t}"><span class="eimg">${UDW.enemyImg(t, ET[t].boss ? 2 : 3)}</span><span><b>${E(ET[t].name)}</b><small>Vida ${e.hp} · Dano ${e.dmg} · XP ${e.xp}</small></span></a></td>`; };
    const rows = seen.map(t => `<tr>${nome(t)}${zs.map(z => { const tab = z.sp ? z.sp[0] : [], tot = tab.reduce((n, r) => n + r[1], 0), r = tab.find(x => x[0] === t);
      if (!r) return '<td class="fx0"></td>'; const p = r[1] / tot, lv = p >= 0.25 ? 3 : p >= 0.15 ? 2 : 1; return `<td class="fx${lv}"><i></i><span>${UDW.pct(p, 0)}</span></td>`; }).join('')}</tr>`);
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
      const A = UDW.ativos(), sp = UDW.spawnsOf(t), lv = D.boss ? [1] : sp.length && typeof AB_ZONE0 !== 'undefined' && sp.every(s => s.z >= AB_ZONE0) ? [10, 11, 12, 13] : sp.length && typeof MN_ZONE0 !== 'undefined' && sp.every(s => s.z >= MN_ZONE0) ? [8, 9, 10, 11] : sp.length && sp.every(s => s.z >= IC_ZONE0) ? [6, 7, 8, 9] : [1, 2, 3, 4, 5, 6];
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
        <div class="stats">${UDW.stat(ET.principecaos.hp, 'vida')}${UDW.stat(ET.principecaos.dmg, 'dano')}${UDW.stat(ET.principecaos.xp, 'XP')}${UDW.stat(12, 'nível')}</div>
        <ol class="fases">${(UDW_TXT.principeFases || []).map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.principecaos || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      return UDW.head('Chefes') + T5 + T4 + T3 + T2 + rei;
    }
  };
})();
