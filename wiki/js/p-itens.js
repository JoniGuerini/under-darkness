'use strict';

/* ================= itens: equipamentos, materiais e a página de cada item ================= */
(() => {
  const E = UDW.esc, N = UDW.num;
  const npcName = id => (NPCS.find(n => n.id === id) || {}).name || id;

  /* ---- de onde vem cada coisa (lido das tabelas do jogo) ---- */
  // chance real por monstro morto, como em rollDrops (10-combate): a tabela vezes DROP_RATE de cada tipo de coisa
  UDW.dropRate = (type, row, lvl = 1) => {
    const [id, ch] = row, it = ITEMS[id], boss = ET[type] && ET[type].boss;
    const k = boss || type === 'rei' ? 1 : it.slot ? DROP_RATE.gear * (1 + 0.1 * (lvl - 1)) : (it.use || id === 'tocha') ? DROP_RATE.use : DROP_RATE.mat;
    return Math.min(1, ch * k);
  };
  UDW.dropsOf = id => { const o = []; for (const t in DROPS) for (const r of DROPS[t]) if (r[0] === id && ET[t]) o.push({ t, r, p: UDW.dropRate(t, r) }); return o.sort((a, b) => b.p - a.p); };
  UDW.shopTiers = id => Object.keys(SHOP_GEAR).filter(k => SHOP_GEAR[k].includes(id)).map(Number);
  UDW.recipeOf = id => RECIPES.find(r => r.id === id);
  UDW.buyers = id => Object.keys(SHOPS).filter(k => { try { return SHOPS[k].buys(id); } catch (e) { return false; } });
  UDW.origins = id => {
    const o = [], it = ITEMS[id], A = UDW.ativos();
    if (Object.values(DEFAULT_EQ).includes(id)) o.push(['Inicial', '#7fd36a']);
    if (it.legend) o.push(['Chefe', '#ff9a3c']);
    const d = UDW.dropsOf(id).filter(x => !ET[x.t].boss && x.t !== 'rei');
    if (d.length) o.push(['Monstros', d.some(x => A.has(x.t)) ? '#c4b596' : '#5e5548']);
    if (it.slot && UDW.shopTiers(id).length) o.push(['Loja', '#62a8ff']);
    if (UDW.recipeOf(id)) o.push(['Forja', '#f0a83c']);
    return o;
  };
  const chips = id => UDW.origins(id).map(([t, c]) => UDW.chip(t, c)).join('');

  /* ---- números de uma base branca ---- */
  UDW.baseNums = id => {
    const s = UDW.white(id), it = ITEMS[id], b = baseStats(s), L = baseInfo(id).L, o = { L, def: b.def || 0, parry: b.parry || 0 };
    if (it.slot === 'weapon') { const w = weaponInfo(s); Object.assign(o, { min: w.min, max: w.max, aps: w.aps, dps: w.dps, type: WEAPON_TYPES[it.kind || 'sword'].trait }); }
    if (it.slot === 'tool') Object.assign(o, { mine: b.mine, pick: b.dmg });
    o.fx = effectLines(s); o.value = sellPrice(s); o.buy = gearValue(s);
    return o;
  };

  const FILT = [['', 'Todos'], ['weapon', 'Armas'], ['shield', 'Escudos'], ['head', 'Cabeça'], ['body', 'Corpo'], ['feet', 'Pés'], ['acc', 'Acessórios'], ['tool', 'Picaretas']];
  UDW.pages.itens = {
    render(f = '') {
      const ids = Object.keys(ITEMS).filter(id => ITEMS[id].slot && !ITEMS[id].alias && (!f || ITEMS[id].slot === f));
      const weap = !f || f === 'weapon';
      const cols = [{ t: 'Item' }, { t: 'Tipo' }, { t: 'Nível', cls: 'n' }];
      if (weap) cols.push({ t: 'Dano', cls: 'n' }, { t: 'Golpes/s', cls: 'n' }, { t: 'DPS', cls: 'n' });
      if (f !== 'weapon') cols.push({ t: 'Defesa', cls: 'n' });
      if (!f || f === 'shield') cols.push({ t: 'Aparo', cls: 'n' });
      cols.push({ t: 'Efeito da base', nosort: true }, { t: 'Origem', nosort: true }, { t: 'Venda', cls: 'n' });
      const rows = ids.map(id => {
        const it = ITEMS[id], n = UDW.baseNums(id), c = [UDW.item(id), E(UDW.kindOf(id)) + (n.type ? `<small>${n.type}</small>` : ''), n.L], k = [it.name, UDW.kindOf(id), n.L];
        if (weap) { c.push(n.min != null ? `${n.min} – ${n.max}` : '', n.aps ? N(n.aps, 1) : '', n.dps ? N(n.dps, 1) : ''); k.push(n.min || 0, n.aps || 0, n.dps || 0); }
        if (f !== 'weapon') { c.push(n.def || ''); k.push(n.def); }
        if (!f || f === 'shield') { c.push(n.parry ? N(n.parry, 2) + ' s' : ''); k.push(n.parry); }
        c.push(`<span class="fxs">${n.fx.join('<br>')}${it.slot === 'tool' ? `Mineração ${Math.round(n.mine * 100)}%` : ''}</span>`, chips(id), n.value); k.push('', '', n.value);
        return { cells: c, keys: k };
      });
      return UDW.head('Equipamentos', 'Cada peça que cai é uma destas bases brancas com até um prefixo e um sufixo sorteados por cima. Os números abaixo são os da base comum; passe o mouse para ver a dica do jogo.')
        + `<nav class="abas">${FILT.map(([k, t]) => `<a href="#/itens/${k}" class="${k === f ? 'on' : ''}">${t}</a>`).join('')}</nav>`
        + `<p class="conta">${ids.length} bases</p>` + UDW.table(cols, rows);
    }
  };

  /* ---- materiais, consumíveis e blocos ---- */
  const MCAT = [['Minérios', id => ITEMS[id].icon === 'ore' || id === 'carvao'], ['Barras', id => ITEMS[id].icon === 'bar'], ['Consumíveis', id => ITEMS[id].use || id === 'tocha'],
    ['Drops de monstro', id => !ITEMS[id].block && !ITEMS[id].deco && UDW.dropsOf(id).length > 0], ['Blocos', id => ITEMS[id].block || ITEMS[id].deco], ['Moeda', id => ITEMS[id].gold]];
  UDW.pages.materiais = {
    render() {
      const done = new Set(); let h = '';
      for (const [cat, f] of MCAT) {
        const ids = Object.keys(ITEMS).filter(id => !ITEMS[id].slot && !done.has(id) && f(id)); ids.forEach(id => done.add(id));
        if (!ids.length) continue;
        const rows = ids.map(id => {
          const d = UDW.dropsOf(id), b = UDW.buyers(id);
          const onde = id in ORE_ITEM_REV ? 'Minerando' : Object.keys(FURN).some(k => FURN[k].bar === id) ? 'Fornalha do Grimaldo' : d.length ? d.slice(0, 4).map(x => `${E(ET[x.t].name)} <em>${UDW.pct(x.p)}</em>`).join(', ') + (d.length > 4 ? ` e mais ${d.length - 4}` : '') : ITEMS[id].block ? 'Quebrando o bloco' : '';
          const furn = FURN[id] ? `${FURN[id].n} → ${E(ITEMS[FURN[id].bar].name)}` : RECIPES.some(r => r.bar === id) ? `${RECIPES.filter(r => r.bar === id).length} receitas da bigorna` : '';
          return { cells: [UDW.item(id), onde, furn, b.map(npcName).join(', '), MAT_VAL[id] || ''], keys: [ITEMS[id].name, onde, furn, b.join(), MAT_VAL[id] || 0] };
        });
        h += `<h2>${cat} <small>${ids.length}</small></h2>` + UDW.table([{ t: 'Item' }, { t: 'Onde conseguir', nosort: true }, { t: 'Forja', nosort: true }, { t: 'Quem compra' }, { t: 'Venda', cls: 'n' }], rows);
      }
      const rest = Object.keys(ITEMS).filter(id => !ITEMS[id].slot && !done.has(id));
      if (rest.length) h += `<h2>Outros</h2><div class="lista">${rest.map(id => UDW.item(id)).join('')}</div>`;
      return UDW.head('Materiais e blocos', 'Tudo que empilha na mochila. A chance de drop é por monstro morto, já com a taxa geral do jogo aplicada.') + h;
    }
  };
  const ORE_ITEM_REV = {}; for (const t in ORE_ITEM) ORE_ITEM_REV[ORE_ITEM[t]] = +t;

  /* ---- a página de um item ---- */
  const SRC = [['monster', 'Monstro'], ['shop', 'Loja'], ['forge', 'Forja']];
  let rollSrc = 'monster', rollZ = 2;
  UDW.pages.item = {
    render(id) {
      const it = ITEMS[id]; if (!it) return UDW.head('Item não encontrado');
      const gear = !!it.slot, s = gear ? UDW.white(id) : { id, n: 1 };
      let h = `<div class="itemtopo"><div class="bigic">${UDW.icon(id, 96)}</div><div>${UDW.tipBox(s)}</div><div class="fontes">`;
      // de onde vem
      const d = UDW.dropsOf(id), A = UDW.ativos();
      if (it.legend) { const b = Object.keys(DROPS).find(t => DROPS[t].some(r => r[0] === id)); h += `<h3>Chefe</h3><p>${b && ET[b] ? `<a href="#/chefes">${E(ET[b].name)}</a> sempre solta` : 'Item único de chefe'}${b && !A.has(b) ? ' <em>(desligado no mundo atual)</em>' : ''}.</p>`; }
      const dn = d.filter(x => !ET[x.t].boss && x.t !== 'rei');
      if (dn.length) h += `<h3>Cai de</h3><ul class="fl">${dn.map(x => `<li><a href="#/inimigo/${x.t}">${UDW.enemyImg(x.t, 1)}${E(ET[x.t].name)}</a><b>${UDW.pct(x.p, 2)}</b>${A.has(x.t) ? '' : '<em>desligado</em>'}</li>`).join('')}</ul>`;
      const ct = UDW.shopTiers(id);
      if (ct.length && gear) h += `<h3>Loja</h3><p>A loja do Grimaldo pode ter esta peça (lista ${ct.map(t => `<b>${t}</b>`).join(', ')} de 3).</p>`;
      const rc = UDW.recipeOf(id);
      if (rc) h += `<h3>Forja</h3><p>Bigorna do Grimaldo: ${UDW.item(rc.bar, { n: rc.n })} em ${N(anvilTime(rc), 1)} s.</p>`;
      if (FURN[id]) h += `<h3>Fornalha</h3><p>${FURN[id].n} deste + 1 ${UDW.item('carvao')} viram 1 ${UDW.item(FURN[id].bar)} em ${N(FURN[id].t, 1)} s.</p>`;
      const uses = RECIPES.filter(r => r.bar === id);
      if (uses.length) h += `<h3>Usado na bigorna</h3><div class="lista">${uses.map(r => UDW.item(r.id) + `<em class="qt">${r.n}</em>`).join('')}</div>`;
      const fromF = Object.keys(FURN).filter(k => FURN[k].bar === id);
      if (fromF.length) h += `<h3>Fundido na fornalha</h3><p>${fromF.map(k => `${FURN[k].n} ${UDW.item(k)}`).join('')} + 1 ${UDW.item('carvao')}</p>`;
      const b = UDW.buyers(id);
      h += `<h3>Venda</h3><p>${gear ? `Uma base comum vale ${sellPrice(s)} de ouro na venda (a loja cobra ${gearValue(s)}). Raridade e nível do item mudam o preço.` : MAT_VAL[id] ? `${MAT_VAL[id]} de ouro cada${b.length ? `, para ${b.map(npcName).join(', ')}` : ''}.` : 'Ninguém compra.'}</p>`;
      h += `</div></div>`;
      if (gear && !it.legend) {
        // o que pode sair nesta base
        const L = baseInfo(id).L, pool = k => AFFIXES.filter(a => a.kind === k && a.where.has(it.slot));
        const row = a => `<a class="mod" href="#/modificadores/${a.id}" style="--c:${RAR_COL[a.tier]}"><b>${E(Array.isArray(a.name) ? a.name[0] : a.name)}</b><span>${UDW.affixText(a, L)}</span></a>`;
        h += `<h2>Modificadores possíveis nesta base</h2><div class="duas"><div><h3>Prefixos</h3>${pool('p').map(row).join('') || '<p class="vazio">Nenhum</p>'}</div><div><h3>Sufixos</h3>${pool('s').map(row).join('') || '<p class="vazio">Nenhum</p>'}</div></div><p class="nota">Valores para o nível de item ${L}.</p>`;
        h += `<h2>Sorteio</h2><div class="sorteio"><div class="ctl">
          <label>Origem <select id="rSrc">${SRC.map(([k, t]) => `<option value="${k}"${k === rollSrc ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
          <label>Profundidade <select id="rZ">${[1, 2, 3, 4].map(z => `<option value="${z}"${z === rollZ ? ' selected' : ''}>${z} · ${UDW_TXT.faixas[z - 1].nome}</option>`).join('')}</select></label>
          <button id="rGo" type="button">Sortear 12</button></div><div id="rOut" class="rolls"></div></div>`;
      }
      return `<p class="volta"><a href="#/${gear ? 'itens' : 'materiais'}">← ${gear ? 'Equipamentos' : 'Materiais e blocos'}</a></p>` + h;
    },
    after(root, id) {
      const go = $('rGo'); if (!go) return;
      const run = () => {
        rollSrc = $('rSrc').value; rollZ = +$('rZ').value;
        const list = []; for (let i = 0; i < 12; i++) list.push(rollItem(id, rollZ, rollSrc));
        list.sort((a, b) => itemRar(b) - itemRar(a));
        $('rOut').innerHTML = list.map(s => UDW.tipBox(s)).join('');
      };
      go.addEventListener('click', run); run();
    }
  };
})();
