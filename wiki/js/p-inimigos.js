'use strict';

/* ================= inimigos e chefes (ET do 10-combate, mudado pelo 44, 46 e 49) ================= */
(() => {
  const E = UDW.esc, N = UDW.num;
  const isBoss = t => !!(ET[t] && ET[t].boss);
  // os números de um monstro num nível: cria um de mentira com o spawnEnemy do jogo, na profundidade daquele nível, e tira da lista
  UDW.enemyAt = (t, lvl) => {
    if (t === 'rei') return { lvl: REI.lvl, hp: REI.hp, dmg: REI.dmg, xp: REI.xp, gold: 0 };
    if (t === 'boss') return { lvl: 10, hp: ET.boss.hp, dmg: ET.boss.dmg, xp: 450, gold: 0 };
    if (t === 'maeteia') return { lvl: 4, hp: ET.maeteia.hp, dmg: ET.maeteia.dmg, xp: ET.maeteia.xp, gold: 0 };
    // the same numbers the spawnEnemy of 10 and 56 give at that level
    const D = ET[t], m = 1 + 0.3 * (lvl - 1);
    return { lvl, hp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (lvl - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (lvl - 1)))), gold: Math.max(1, Math.round(D.xp * 0.5 * (1 + 0.25 * (lvl - 1)))) };
  };
  // where each level is found (56: caves 1 level every 50 m, the cathedral starts at 2 and goes up 1 every 45 m; 30% are born a level higher)
  const ondeNivel = l => { const o = []; if (l <= 4) o.push(`${(l - 1) * 50 + (l === 1 ? 6 : 0)} a ${Math.min(CAVE_D, l * 50) - 1} m`); if (l >= 2) o.push(`${CAVE_D + (l - 2) * 45} a ${CAVE_D + (l - 1) * 45 - 1} m`); return o.join(' e '); };
  // onde cada um aparece: CATH_SPAWN (45) faixa por faixa
  UDW.spawnsOf = t => {
    const o = [];
    for (const z in CATH_SPAWN) { const [tab, max] = CATH_SPAWN[z], tot = tab.reduce((n, r) => n + r[1], 0), r = tab.find(x => x[0] === t); if (r) o.push({ z: +z, nome: ZONE_NAMES[z], p: r[1] / tot, max }); }
    return o;
  };
  const flags = t => { const D = ET[t], f = []; if (D.fly) f.push('Voa'); if (D.phase) f.push('Atravessa paredes'); if (D.boss) f.push('Chefe'); if (D.touch) f.push('Corpo machuca'); return f; };

  function card(t) {
    const D = ET[t], e = UDW.enemyAt(t, 1), sp = UDW.spawnsOf(t);
    return `<a class="ecard${UDW.ativos().has(t) ? '' : ' off'}" href="#/inimigo/${t}"><div class="eart">${UDW.enemyImg(t, D.boss ? 2 : 3)}</div><b>${E(D.name)}</b>
      <div class="mini"><span>Vida <b>${e.hp}</b></span><span>Dano <b>${e.dmg}</b></span><span>XP <b>${e.xp}</b></span></div>
      <small>${sp.length ? sp.map(s => s.nome).join(', ') : t === 'rei' ? 'Sala do trono' : t === 'maeteia' ? 'Câmara do Ninho' : t === 'filhote' ? 'Ovos da Mãe-Teia' : 'Cavernas desligadas'}</small></a>`;
  }
  UDW.pages.inimigos = {
    render() {
      const A = UDW.ativos(), all = Object.keys(ET).filter(t => !isBoss(t));
      const on = all.filter(t => A.has(t)), off = all.filter(t => !A.has(t));
      return UDW.head('Inimigos', 'Números no nível 1. Cada nível a mais soma 30% de vida e 20% de dano. Nas cavernas o nível sobe 1 a cada 50 m; a catedral começa no nível 2 e sobe 1 a cada 45 m. 30% nascem um nível acima.')
        + `<h2>No mundo de hoje <small>${on.length}</small></h2><div class="egrid">${on.map(card).join('')}</div>`
        + `<h2>Nas cavernas desligadas <small>${off.length}</small></h2><p class="nota">${UDW_TXT.cavernas}</p><div class="egrid">${off.map(card).join('')}</div>`;
    }
  };

  UDW.pages.inimigo = {
    render(t) {
      const D = ET[t]; if (!D) return UDW.head('Inimigo não encontrado');
      const A = UDW.ativos(), sp = UDW.spawnsOf(t), lv = D.boss ? [1] : [1, 2, 3, 4, 5, 6];
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
      const carr = `<section class="chefe off"><div class="eart big">${UDW.enemyImg('boss', 2)}</div><div>
        <h2>${E(ET.boss.name)} ${UDW.chip('Desligado', '#8a7f70')}</h2><p class="lead">${E(UDW_TXT.carrascoOnde)}</p><p>${E(UDW_TXT.inimigos.boss)}</p>
        <div class="stats">${UDW.stat(ET.boss.hp, 'vida')}${UDW.stat(ET.boss.dmg, 'dano')}${UDW.stat(450, 'XP')}${UDW.stat(10, 'nível')}</div>
        <h3>Solta</h3><div class="lista">${(DROPS.boss || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div>
        <p class="nota">Missão do ancião: ${CARRASCO_GOLD} de ouro ao contar a vitória.</p></div></section>`;
      const T2 = ET.maeteia ? `<section class="chefe"><div class="eart big">${UDW.enemyImg('maeteia', 3)}</div><div>
        <h2>${E(ET.maeteia.name)} ${UDW.chip('No mundo', '#7fd36a')}</h2><p class="lead">${E(UDW_TXT.teiaOnde)}</p>
        <div class="stats">${UDW.stat(ET.maeteia.hp, 'vida')}${UDW.stat(ET.maeteia.dmg, 'dano')}${UDW.stat(ET.maeteia.xp, 'XP')}${UDW.stat(4, 'nível')}</div>
        <ol class="fases">${UDW_TXT.teiaFases.map(([f, t]) => `<li><b>${f}</b> ${E(t)}</li>`).join('')}</ol>
        <h3>Solta</h3><div class="lista">${(DROPS.maeteia || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div></div></section>` : '';
      return UDW.head('Chefes') + T2 + rei + carr;
    }
  };
})();
