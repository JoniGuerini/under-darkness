'use strict';

/* ================= moradores do vilarejo (NPCS, SHOPS, CHAT e HELLO do 17-vilarejo) ================= */
(() => {
  const E = UDW.esc;
  const HOUSE = { ferreiro: 'forge', curandeira: 'cottage', taverneiro: 'tavern', anciao: 'elder', maga: 'torre', encantador: 'oficina' };
  const line = l => { try { return typeof l === 'function' ? l() : l; } catch (e) { return ''; } };

  // o vilarejo inteiro, montado com as casas e os moradores do jogo nas posições de verdade
  function panorama() {
    const L = typeof VIL_LEFT !== 'undefined' ? VIL_LEFT : VIL_HALF, W = (VIL_HALF + L + 4) * T, H = 120, c = mk(W, H), x = c.getContext('2d'), gy = H - 10, X = v => (v + L + 2) * T;
    x.imageSmoothingEnabled = false;
    for (const v of VIL_BUILD) { const b = SPR.vil[v.k]; if (b) x.drawImage(b.c, Math.round(X(v.x0) + b.ox), gy - b.c.height + 1); }
    for (const n of NPCS) { n.attend = false; n.facing = n.face; const cv = compose(npcPose(n)), fx = Math.round(X(n.x)); x.save(); if (n.facing < 0) { x.translate(fx, 0); x.scale(-1, 1); x.drawImage(cv, -CW / 2, gy - (OY + 22) + 1); } else x.drawImage(cv, fx - CW / 2, gy - (OY + 22) + 1); x.restore(); }
    for (let i = 0; i < W; i += T) { x.drawImage(blockCanvas(GRASS, T, 0, i, 0), i, gy + 1); }
    return c;
  }

  let lvlLoja = 1;
  function lojaGrimaldo(lvl) {
    const L0 = pl.lvl; pl.lvl = lvl;
    try { restock(); } finally { pl.lvl = L0; }
    return `<div class="rolls">${stock.ferreiro.map(g => `<div class="preco">${UDW.tipBox(g.s)}<b>${g.price} de ouro</b></div>`).join('')}</div>`;
  }

  UDW.pages.npcs = {
    render(focus) {
      let h = UDW.head('Moradores', 'O vilarejo é o único lugar seguro: nada ataca na superfície. Aperte E perto de um morador para conversar.');
      h += `<div class="pano">${UDW.canvasImg('vila-pano', panorama, 2)}</div>`;
      restock();
      for (const n of NPCS) {
        const buys = SHOPS[n.id] ? Object.keys(ITEMS).filter(id => { try { return SHOPS[n.id].buys(id) && !ITEMS[id].slot; } catch (e) { return false; } }) : [];
        const gearToo = SHOPS[n.id] && Object.keys(ITEMS).some(id => ITEMS[id].slot && SHOPS[n.id].buys(id));
        const sells = (stock[n.id] || []).filter(g => g.inf);
        h += `<section class="npc" id="npc-${n.id}"><div class="nart">${UDW.npcImg(n, 5)}</div><div class="ntxt">
          <h2>${E(n.name)} <small>${E(n.role)}</small></h2><p class="lead">${E(UDW_TXT.npcs[n.id] || '')}</p>
          ${SHOPS[n.id] ? `<h3>${E(SHOPS[n.id].title)}</h3>` : ''}
          ${sells.length ? `<p><span class="rot">Vende</span>${sells.map(g => `${UDW.item(g.s.id)} <b class="ouro">${g.price}</b>`).join(' ')}</p>` : ''}
          ${n.id === 'ferreiro' ? '<p><span class="rot">Vende</span>10 peças sorteadas por dia (veja abaixo) e a forja: <a href="#/forja">fornalha e bigorna</a>.</p>' : ''}
          ${n.id === 'curandeira' ? '<p><span class="rot">Serviço</span>A <a href="#/alquimia">alquimia</a>: poções e elixires no alambique.</p>' : ''}
          ${n.id === 'encantador' && typeof GEMS !== 'undefined' ? `<p><span class="rot">Serviço</span>Encantar uma peça com uma pedra preciosa. As 5 pedras aparecem em todas as camadas; descendo, as melhores ficam menos raras. A pedra decide a chance de raridade:</p>` + UDW.table([{ t: 'Pedra' }, { t: 'Onde' }, ...RAR.slice(1).map(r => ({ t: r, cls: 'n' }))], GEMS.map(g => ({ cells: [UDW.item(g.id), E(g.layer), ...g.odds.map(w => w ? w + '%' : '–')], keys: [ITEMS[g.id].name, g.layer, ...g.odds] }))) : ''}
          ${n.id === 'maga' && typeof SCHOOLS !== 'undefined' ? `<p><span class="rot">Serviço</span>Identificar os pergaminhos de escola. Cada um vira um feitiço sorteado da escola dele, entre os que o herói ainda não conhece, e já vai para a barra. A escola que o herói já sabe inteira some da prateleira.</p>` + UDW.table([{ t: 'Pergaminho' }, { t: 'Ouro', cls: 'n' }, { t: 'Pode sair' }], SCHOOLS.map(sc => ({ cells: [UDW.item(sc.scroll), sc.price, sc.spells.map(id => UDW.item(id, { px: 22 })).join(' ')], keys: [ITEMS[sc.scroll].name, sc.price, sc.spells.length] }))) : ''}
          ${n.id === 'taverneiro' ? '<p><span class="rot">Serviço</span>A <a href="#/cozinha">cozinha</a>: carne assada e ensopado de cogumelos.</p>' : ''}
          ${buys.length || gearToo ? `<p><span class="rot">Compra</span>${gearToo ? `<span class="it">${n.id === 'maga' ? 'cajados, varinhas e tomos' : 'qualquer equipamento'}</span>` : ''}${buys.map(id => UDW.item(id, { px: 22 })).join('')}</p>` : ''}
          <details><summary>Falas</summary><ul class="falas">${[...(HELLO[n.id] || []), ...(CHAT[n.id] || [])].map(l => `<li>"${E(line(l))}"</li>`).join('')}</ul></details>
          </div><div class="casa">${UDW.villageImg(HOUSE[n.id], 1)}</div></section>`;
        if (n.id === 'ferreiro') h += `<div class="sub"><h3>Mercadoria do dia <label>com o herói no nível <select id="lojaLv">${[1, 6, 12].map(l => `<option${l === lvlLoja ? ' selected' : ''}>${l}</option>`).join('')}</select></label> <button id="lojaGo" type="button">Sortear outro dia</button></h3><div id="lojaOut"></div></div>`;
      }
      return h;
    },
    after(root, focus) {
      const go = () => { lvlLoja = +$('lojaLv').value; $('lojaOut').innerHTML = lojaGrimaldo(lvlLoja); };
      if ($('lojaGo')) { $('lojaGo').addEventListener('click', go); $('lojaLv').addEventListener('change', go); go(); }
      if (focus && $('npc-' + focus)) setTimeout(() => $('npc-' + focus).scrollIntoView(), 30);
    }
  };
})();
