'use strict';

/* ================= início e busca ================= */
(() => {
  const gear = () => Object.keys(ITEMS).filter(id => ITEMS[id].slot);
  // os chefes das camadas (UDW_CAMADAS, textos.js) e todo monstro que nasce em alguma faixa
  const ativos = () => { const s = new Set(UDW_CAMADAS().filter(C => C.chefe).map(C => C.chefe[0])); s.add('filhote'); for (const z in CATH_SPAWN) for (const [t] of CATH_SPAWN[z][0]) s.add(t); return s; };
  UDW.ativos = ativos;

  UDW.pages.inicio = {
    render() {
      const g = gear(), mats = Object.keys(ITEMS).filter(id => !ITEMS[id].slot && !ITEMS[id].gold);
      const tiers = [1, 2, 3, 4].map(t => AFFIXES.filter(a => a.tier === t).length), A = ativos();
      const card = (href, titulo, num, txt, img) => `<a class="cardlink" href="#/${href}">${img || ''}<div><b>${titulo}</b><span class="n">${num}</span><p>${txt}</p></div></a>`;
      const sw = ['espada_ferro', 'machado_ouro', 'lamina_cristal', 'escudo_ouro', 'elmo_chifres', 'coroa_rei', 'anel_vampiro', 'manto_espectral'].filter(id => ITEMS[id]);
      return `<div class="hero">
        <div class="hero-txt"><h1 class="titulo">Under Darkness</h1>
        <p>Tudo o que existe no jogo hoje, lido direto dos arquivos do jogo. Quando o jogo muda, a wiki muda junto.</p>
        <div class="vitrine">${sw.map(id => `<a href="#/item/${id}" data-item="${id}">${UDW.icon(id, 44)}</a>`).join('')}</div></div>
        <div class="hero-art">${UDW.npcImg(NPCS[0], 4)}${UDW.enemyImg('rei', 3)}${UDW.enemyImg('skeleton', 4)}</div>
      </div>
      <section class="cards">
        ${card('itens', 'Equipamentos', g.length, 'bases de arma, armadura, escudo, acessório e picareta, com dano, velocidade e DPS')}
        ${card('modificadores', 'Modificadores', AFFIXES.length, `${tiers[0]} incomuns, ${tiers[1]} raros, ${tiers[2]} épicos e ${tiers[3]} lendários`)}
        ${card('materiais', 'Materiais e blocos', mats.length, 'minérios, barras, drops de monstro, consumíveis e blocos')}
        ${card('forja', 'Receitas da forja', RECIPES.length + Object.keys(FURN).length, `${Object.keys(FURN).length} fundições na fornalha e ${RECIPES.length} peças na bigorna`)}
        ${card('alquimia', 'Alquimia', ALQ_RECIPES.length, `${HERBS.length} ervas, ${ALQ_RECIPES.filter(rc => ALQ[rc.id].kind !== 'elixir').length} poções e ${ALQ_RECIPES.filter(rc => ALQ[rc.id].kind === 'elixir').length} elixires no alambique da Marta`)}
        ${card('inimigos', 'Inimigos', Object.keys(ET).length, `${A.size} aparecem no mundo de hoje; os outros estão nas cavernas desligadas`)}
        ${card('npcs', 'Moradores', NPCS.length, NPCS.map(n => n.name).join(', '))}
        ${card('biomas', 'Camadas', LAYERS.length, `${LAYERS.length} camadas de 5 níveis, do 1 ao ${5 * LAYERS.length} (${LAYERS.map(L => L.nome).join(', ').replace(/, ([^,]*)$/, ' e $1')}): ${Object.keys(PROP_DEFS).length} objetos de cena, ${UDW.cathBlocks().length} blocos de construção`)}
        ${card('regras', 'Regras do jogo', '', 'herói, níveis, defesa, vigor, poção, dia e noite, tamanho do mundo')}
      </section>`;
    }
  };

  // busca em tudo: itens, modificadores, monstros, moradores, objetos de cena e documentos
  UDW.pages.busca = {
    render(q = '') {
      const s = UDW.slug(q), has = t => UDW.slug(t).includes(s), out = [];
      if (s.length < 2) return UDW.head('Busca') + '<p class="vazio">Digite pelo menos 2 letras.</p>';
      const its = Object.keys(ITEMS).filter(id => has(ITEMS[id].name) || has(id));
      if (its.length) out.push(`<h2>Itens</h2><div class="lista">${its.map(id => UDW.item(id)).join('')}</div>`);
      const af = AFFIXES.filter(a => has(Array.isArray(a.name) ? a.name.join(' ') : a.name));
      if (af.length) out.push(`<h2>Modificadores</h2><div class="lista">${af.map(a => `<a class="it" href="#/modificadores/${a.id}"><span style="color:${RAR_COL[a.tier]}">${UDW.esc(Array.isArray(a.name) ? a.name[0] : a.name)}</span></a>`).join('')}</div>`);
      const en = Object.keys(ET).filter(t => has(ET[t].name));
      if (en.length) out.push(`<h2>Inimigos</h2><div class="lista">${en.map(t => `<a class="it" href="#/inimigo/${t}">${UDW.esc(ET[t].name)}</a>`).join('')}</div>`);
      const np = NPCS.filter(n => has(n.name) || has(n.role));
      if (np.length) out.push(`<h2>Moradores</h2><div class="lista">${np.map(n => `<a class="it" href="#/npcs/${n.id}">${n.name}, ${n.role}</a>`).join('')}</div>`);
      const pr = Object.keys(PROP_DEFS).filter(id => has(PROP_DEFS[id].nome || id));
      if (pr.length) out.push(`<h2>Objetos de cena</h2><div class="lista">${pr.map(id => `<a class="it" href="#/biomas/objetos">${UDW.esc(PROP_DEFS[id].nome)}</a>`).join('')}</div>`);
      const dc = [];
      for (const d of UDW_DOCS) for (const m of d.texto.matchAll(/^#{1,4}\s+(.*)$/gm)) if (has(m[1])) dc.push(`<a class="it" href="#/docs/${d.id}/${encodeURIComponent('h-' + UDW.slug(m[1]).replace(/[^a-z0-9]+/g, '-'))}">${UDW.esc(m[1])} <em>${d.titulo}</em></a>`);
      if (dc.length) out.push(`<h2>Nos documentos</h2><div class="lista col">${dc.slice(0, 30).join('')}</div>`);
      return UDW.head(`Busca: ${UDW.esc(q)}`) + (out.join('') || '<p class="vazio">Nada encontrado.</p>');
    }
  };
})();
