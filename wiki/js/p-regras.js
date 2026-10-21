'use strict';

/* ================= regras gerais: herói, armas, defesa, vigor, níveis, mundo ================= */
(() => {
  const E = UDW.esc, N = UDW.num;
  UDW.pages.regras = {
    render() {
      let h = UDW.head('Regras do jogo', 'Os números que valem para tudo.');
      h += `<h2>Herói</h2><div class="stats">${UDW.stat(HERO_HP, 'vida inicial')}${UDW.stat(pl.maxMana || pl.mana, 'mana')}${UDW.stat(UDW.pct(BASE_CRIT, 0), 'crítico base')}${UDW.stat('+' + UDW.pct(pl.critDmg, 0), 'dano do crítico')}${UDW.stat(VIG_MAX, 'vigor')}${UDW.stat(pl.gold, 'ouro inicial')}</div>
        <ul class="regras"><li>Subir de nível não dá bônus nenhum (vida, mana, dano e defesa vêm só do equipamento).</li>
        <li>Sem regeneração de vida natural: só de equipamento, poção ou Elixir da Gosma. A mana regenera sozinha.</li>
        <li>Poção de Vida: ${POT_HEAL} de vida ao longo de 5 s. Beber outra soma ao que falta curar. Poções maiores, mana e elixires: veja <a href="#/alquimia">Alquimia</a>.</li>
        <li>Encostar num monstro não machuca; só os ataques dele.</li>
        <li>Sem arma, um golpe a cada ${N(SWING, 1)} s.</li></ul>`;
      h += `<h2>Tipos de arma</h2><p class="nota">Toda arma do mesmo nível tem o mesmo dano por segundo. O que muda é quanto cada golpe varia e a velocidade.</p>`
        + UDW.table([{ t: 'Tipo' }, { t: 'Traço' }, { t: 'Variação do golpe', cls: 'n' }, { t: 'Segundos por golpe', cls: 'n' }, { t: 'Alcance', cls: 'n' }, { t: 'Extra' }],
          Object.keys(WEAPON_TYPES).map(k => { const W = WEAPON_TYPES[k], K = KIND[k]; return { cells: [K.name, W.trait, '±' + UDW.pct(W.spread, 0), `${N(W.spd[0], 2)} a ${N(W.spd[1], 2)}`, K.reach + ' px', [W.crit ? `+${UDW.pct(W.crit, 0)} de crítico` : '', K.note].filter(Boolean).join('; ')], keys: [K.name, W.trait, W.spread, W.spd[0], K.reach, ''] }; }));
      h += `<h3>Dano por segundo pelo nível do item</h3><div class="barras">${Array.from({ length: 12 }, (_, i) => i + 1).map(L => { const v = weaponDps(L), mx = weaponDps(12); return `<div><i style="height:${v / mx * 100}%"></i><b>${N(v, 1)}</b><span>${L}</span></div>`; }).join('')}</div>`;
      h += `<h2>Defesa</h2><p class="nota">Cada ponto de defesa corta uma parte de cada golpe, cada vez menos, nunca passando de 75%. Todo golpe tira pelo menos 1.</p><div class="barras def">${[0, 2, 4, 6, 8, 10, 15, 20, 25, 30, 40, 60].map(d => `<div><i style="height:${armorCut(d) / 0.75 * 100}%"></i><b>${UDW.pct(armorCut(d), 0)}</b><span>${d}</span></div>`).join('')}</div>`;
      h += `<h2>Escudo e vigor</h2><ul class="regras"><li>Cada golpe no escudo gasta ${VIG_BLOCK} de vigor; um aparo no tempo certo gasta ${VIG_PARRY}. Golpe de chefe pesa ${N(VIG_BOSS, 1)} vezes mais.</li>
        <li>Com vigor zero, a guarda quebra: o escudo cai e só volta quando o vigor chegar a ${VIG_BACK}.</li>
        <li>O vigor só recupera com o escudo abaixado: ${VIG_REGEN} por segundo (${VIG_REGEN_BROKEN} com a guarda quebrada), depois de ${N(VIG_DELAY, 1)} s.</li></ul>`;
      { const NV = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 99];
        h += `<h2>Experiência</h2><p class="nota">Monstros dão pouca experiência; minerar não dá nenhuma. O herói vai do nível 1 ao 100 nas ${LAYERS.length} camadas: o XP para subir é 10 × força<sup>1,5</sup>, com a força da escala de antes (igual ao nível até o 4, depois 0,4 × nível + 2,5). Saves de antes do revamp de 2026-10-21 passam o nível do herói para a escala nova uma vez só.</p><div class="tw"><table class="grade compacta"><thead><tr><th>Nível</th>${NV.map(l => `<th class="n">${l}</th>`).join('')}</tr></thead><tbody><tr><td>XP para subir</td>${NV.map(l => `<td class="n">${xpNeed(l)}</td>`).join('')}</tr></tbody></table></div>`; }
      h += `<h2>Camadas e níveis</h2><p class="nota">A ordem é a do registro do jogo (js/129-camadas.js). Cada camada tem ${LAYER_D} m e 5 níveis: na camada N os monstros vão do nível 5N−4 ao 5N−1, um nível a cada quarto da altura (nas Cavernas, um a cada ${50 * LAYER_K} m), 30% nascem um nível acima, nunca passando do 5N−1, e o chefe é o 5N. O nível no rótulo do monstro é esse; vida, dano e XP seguem a força (igual ao nível até o 4, depois 0,4 × nível + 2,5). Detalhes em <a href="#/docs/camada-00-revamp">O revamp das camadas</a>.</p>`
        + UDW.table([{ t: '#', cls: 'n' }, { t: 'Camada' }, { t: 'Profundidade', cls: 'n' }, { t: 'Monstros', cls: 'n' }, { t: 'Chefe' }, { t: 'Nível do chefe', cls: 'n' }, { t: 'Nível de item da forja', cls: 'n' }],
          UDW_CAMADAS().map(C => ({ cells: [C.pos, `<a href="#/biomas/${C.id}">${UDW.esc(C.nome)}</a>`, `${C.de} a ${C.ate} m`, `${C.nvLo} a ${C.nvHi}`, C.chefe && ET[C.chefe[0]] ? `<a href="#/chefes/${C.chefe[0]}">${UDW.esc(ET[C.chefe[0]].name)}</a>` : '', C.nvChefe, C.pos >= 5 ? layerForgeIl(C.id) : '—'], keys: [C.pos, C.nome, C.de, C.nvLo, '', C.nvChefe, C.pos] })), 'compacta');
      h += `<h2>Baú do vilarejo</h2><div class="stats">${UDW.stat(STASH_PER, 'casas por aba')}${UDW.stat('sem limite', 'abas')}${UDW.stat(N(stashPreco(1e9), 0).replace(/\B(?=(\d{3})+$)/g, '.'), 'preço máximo de uma aba')}</div>
        <ul class="regras"><li>Começa com uma aba. O + no fim da fileira de abas mostra o preço da próxima e pede confirmação antes de gastar.</li>
        <li>Dá para comprar quantas abas quiser. As que não cabem na fileira ficam de lado: as setas (ou a rodinha do mouse) andam com a fileira e o botão de lista mostra todas numa coluna.</li>
        <li>Clique direito ou duplo clique numa aba: muda o nome e a cor dela.</li>
        <li>Arrastar um item e soltar em cima de uma aba guarda ele naquela aba.</li>
        <li>Guardar tudo, Empilhar, Pegar tudo e Organizar valem para a aba aberta. Forja, alquimia e cozinha contam o que está em todas as abas.</li></ul>`
        + UDW.table([{ t: 'Aba' }, { t: 'Preço em ouro', cls: 'n' }], STASH_PRECO.map((p, i) => ({ cells: [i === STASH_PRECO.length - 1 ? `${i + 1} em diante` : String(i + 1), i ? p.toLocaleString('pt-BR') : 'já vem com o baú'] })));
      h += `<h2>Mundo</h2><div class="stats">${UDW.stat(`${WW} × ${WH}`, 'blocos de largura e altura')}${UDW.stat(T + ' px', 'tamanho do bloco')}${UDW.stat(DAY_LEN / 60 + ' min', 'um dia inteiro')}</div>
        <ul class="regras"><li>O mundo dá a volta: andando sempre para um lado, você chega pelo outro.</li>
        <li>Dia das 6h às 18h, noite das 18h às 6h. Um jogo novo começa às 18h.</li>
        <li>Estações: cada uma dura ${EST_DIAS} dias do jogo (${Math.floor(EST_DIAS * DAY_LEN / 3600)} h e ${EST_DIAS * DAY_LEN / 60 % 60} min de jogo rodando), um ano tem ${EST_DIAS * 4} dias. Veja <a href="#/estacoes">Estações</a>.</li>
        <li>Lua: muda de fase uma vez por noite; o ciclo tem ${LUA_DIAS} fases e dura ${LUA_DIAS} dias do jogo. A lua cheia clareia um pouco a noite e a lua nova escurece.</li>
        <li>A superfície é segura: nenhum monstro nasce debaixo do céu aberto.</li>
        <li>Os monstros só percebem o herói com linha de visão, um caminho curto pelo chão ou muito perto; e procuram caminho até ele.</li>
        <li>O nível dos monstros sobe com a profundidade: 5 níveis por camada (veja Camadas e níveis acima).</li></ul>`;
      return h;
    }
  };
})();
