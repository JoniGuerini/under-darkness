'use strict';

/* ================= raridades, chances de sorteio e lendários ================= */
(() => {
  const E = UDW.esc;
  const SRC = { monster: 'Monstro', chest: 'Baú', forge: 'Forja', shop: 'Loja' };
  // chance de cada raridade por origem e profundidade: roda o rollRarity do próprio jogo muitas vezes
  let cache = null;
  function odds() {
    if (cache) return cache;
    cache = {}; const n = 20000;
    for (const s in RARITY_ODDS) { cache[s] = {}; for (let z = 1; z <= 4; z++) { const c = {}; for (let i = 0; i < n; i++) { const r = rollRarity(z, s); c[r] = (c[r] || 0) + 1; } cache[s][z] = c; } }
    cache.n = n; return cache;
  }
  const RS = [-1, 0, 1, 2, 3, 4];
  UDW.pages.raridades = {
    render() {
      const O = odds(), w = RARITY_ODDS;
      let h = UDW.head('Raridades e sorteio', 'Como o jogo decide a cor de cada peça que cai.');
      h += `<div class="rars">${RS.map(r => `<div class="rar" style="--c:${RAR_COL[r]}"><b>${RAR[r]}</b><span>${r < 0 ? 'base estragada, sem modificador, números 20% menores' : r === 0 ? 'base branca, sem modificador' : `tem um modificador ${RAR[r].toLowerCase()}`}</span><em>preço ×${String(RAR_VALUE[r]).replace('.', ',')}</em></div>`).join('')}</div>`;
      h += `<h2>Regras</h2><ul class="regras">
        <li>A raridade é a do modificador mais forte. Um item com um modificador raro e um incomum é Raro.</li>
        <li>O modificador da raridade sorteada é garantido. Em 40% das vezes a outra posição (prefixo ou sufixo) ganha um também, da mesma raridade ou menor.</li>
        <li>O nível do item é o da base mais um bônus que depende da profundidade (monstro e baú) ou de 0 a 1 (loja). A forja usa o nível da base e entrega a peça sempre branca; os modificadores dela vêm do encantador, com as chances da pedra usada (veja Moradores).</li>
        <li>Baú: só ${UDW.pct(CHEST_GEAR, 0)} dos baús trazem equipamento.</li>
        <li>Chance geral de um monstro soltar cada equipamento da sua tabela: ${UDW.pct(DROP_RATE.gear, 0)} do valor escrito, +10% por nível do monstro.</li></ul>`;
      h += `<h2>Pesos escritos no jogo</h2>` + UDW.table([{ t: 'Origem' }, ...RS.map(r => ({ t: `<span style="color:${RAR_COL[r]}">${RAR[r]}</span>`, cls: 'n' }))],
        Object.keys(w).map(s => ({ cells: [SRC[s] || s, ...w[s].map(v => String(v).replace('.', ','))], keys: [s, ...w[s]] })));
      h += `<h2>Chance real por profundidade</h2><p class="nota">Sorteado ${O.n.toLocaleString('pt-BR')} vezes com a função do jogo para cada célula. Profundidade 1 = Átrio, 2 = Nave, 3 = Claustro, 4 = Criptas.</p>`;
      for (const s in w) h += `<h3>${SRC[s] || s}</h3>` + UDW.table([{ t: 'Profundidade' }, ...RS.map(r => ({ t: `<span style="color:${RAR_COL[r]}">${RAR[r]}</span>`, cls: 'n' }))],
        [1, 2, 3, 4].map(z => ({ cells: [`${z} · ${UDW_TXT.faixas[z - 1].nome}`, ...RS.map(r => { const v = (O[s][z][r] || 0) / O.n; return v ? UDW.pct(v, v < 0.01 ? 2 : 1) : '<span class="zero">0</span>'; })], keys: [z, ...RS.map(r => O[s][z][r] || 0)] })), 'compacta');
      return h;
    }
  };

  UDW.pages.lendarios = {
    render() {
      const L = AFFIXES.filter(a => a.tier === 4), U = Object.keys(ITEMS).filter(id => ITEMS[id].legend);
      let h = UDW.head('Lendários', 'Os modificadores lendários mudam o jeito de lutar. As peças únicas dos chefes têm propriedades fixas.');
      h += `<h2>Únicos de chefe</h2><div class="rolls">${U.map(id => `<a href="#/item/${id}" class="semlinha">${UDW.tipBox(UDW.white(id))}</a>`).join('')}</div>`;
      h += `<h2>Modificadores lendários</h2><div class="lendas">${L.map(a => `<div class="lenda"><b>${E(a.name)}</b><span class="fxs">${UDW.affixText(a, 6)}</span><p class="flavor">"${E(a.flavor || '')}"</p><small>Aparece em: ${[...a.where].map(s => UDW.SLOT[s].toLowerCase()).join(', ')}</small></div>`).join('')}</div><p class="nota">Valores para o nível de item 6.</p>`;
      return h;
    }
  };
})();
