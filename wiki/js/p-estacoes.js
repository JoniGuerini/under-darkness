'use strict';

/* ================= estações do ano e as árvores da superfície (js/334-estacoes, 335-arvores-estacoes, 336-clima-estacoes, 337-lua) =================
   Os números e os desenhos saem do código do jogo: as árvores são assadas pelo mesmo bakeEst do jogo. */
(() => {
  const N = UDW.num, E = UDW.esc;
  const SP_NOME = { carvalho: 'Carvalho', betula: 'Bétula', bordo: 'Bordo', cerejeira: 'Cerejeira', salgueiro: 'Salgueiro', pinheiro: 'Pinheiro', abeto: 'Abeto', arbusto: 'Arbusto', azevinho: 'Azevinho' };
  const SP_NOTA = {
    carvalho: 'O de sempre. Alguns dão fruta: flor branca na primavera, fruta no verão. No outono ficam laranja, ferrugem ou amarelos.',
    betula: 'Tronco branco com marcas pretas, copa alta e estreita. Amarela no outono.',
    bordo: 'Copa larga e redonda. Vermelho forte no outono.',
    cerejeira: 'Copa baixa e larga. Fica toda rosa no começo da primavera e solta pétalas.',
    salgueiro: 'Tronco grosso e galhos que caem quase até o chão. Amarelo no outono; no inverno sobram os fiozinhos pelados.',
    pinheiro: 'Sempre verde. No inverno, neve em cada andar.',
    abeto: 'Mais alto, estreito e azulado que o pinheiro. Sempre verde.',
    arbusto: 'Árvore baixinha. Vermelha no outono.',
    azevinho: 'Arbusto sempre verde. Frutinhas vermelhas no outono e no inverno.'
  };
  // um dia de cada visual para desenhar
  const COLS = [['Primavera (início)', { s: 0, d: 1 }], ['Primavera', { s: 0, d: 5 }], ['Verão', { s: 1, d: 3 }], ['Outono', { s: 2, d: 1 }], ['Fim do outono', { s: 2, d: 4 }], ['Inverno', { s: 3, d: 3 }]];
  const minDia = DAY_LEN / 60, horas = m => { const h = Math.floor(m / 60), r = Math.round(m % 60); return h ? `${h} h${r ? ' ' + r + ' min' : ''}` : `${r} min`; };
  UDW.pages.estacoes = {
    render() {
      let h = UDW.head('Estações', 'A superfície muda com o ano: árvores, capim, campos ao fundo, o tempo e a lua.');
      h += `<div class="stats">${UDW.stat(EST_DIAS + ' dias', 'cada estação')}${UDW.stat(horas(EST_DIAS * minDia), 'de jogo por estação')}${UDW.stat(EST_DIAS * 4 + ' dias', 'um ano')}${UDW.stat(horas(EST_DIAS * 4 * minDia), 'de jogo por ano')}</div>
        <ul class="regras"><li>Um dia do jogo dura ${N(minDia, 0)} minutos. Cada estação dura ${EST_DIAS} dias do jogo, e a ordem é ${EST_NOMES.join(', ')}.</li>
        <li>O dia da estação vira às 6h, no nascer do sol. Um jogo novo começa no primeiro dia da primavera.</li>
        <li>A estação vai no save. Quando ela muda com o herói na superfície, o nome dela aparece na faixa do lugar.</li>
        <li>Primavera: capim verde-claro, flores mais coloridas, campos com sebes floridas. Verão: o verde de sempre.</li>
        <li>Outono: capim e tufos amarelando e depois secos, campos colhidos, folhas caindo das árvores até ficarem peladas.</li>
        <li>Inverno: neve no chão, nos tufos, nos telhados do vilarejo e nos campos do fundo; neva de vez em quando, com pancadas mais fortes.</li>
        <li>Menu &gt; Testes tem um botão que pula para a próxima estação.</li></ul>`;
      h += `<h2>As árvores</h2><p class="nota">O mundo guarda a árvore pela altura do tronco; a espécie sai de um sorteio fixo pelo lugar onde ela nasceu, então cada árvore é sempre da mesma espécie.</p>`;
      h += `<div class="est-grade" style="display:grid;grid-template-columns:150px repeat(${COLS.length},1fr);gap:4px;align-items:end;overflow-x:auto">`;
      h += `<div></div>` + COLS.map(([t]) => `<div style="text-align:center;font-size:12px;opacity:.75">${E(t)}</div>`).join('');
      for (const kind of [0, 1, 2, 3]) for (const [sp] of TREE_SP[kind]) {
        h += `<div style="align-self:center"><b>${E(SP_NOME[sp] || sp)}</b><br><small style="opacity:.75">${E(SP_NOTA[sp] || '')}</small></div>`;
        h += COLS.map((c, i) => `<canvas class="est-arv" data-k="${kind}" data-sp="${sp}" data-c="${i}" width="${TR_W}" height="${TR_H}" style="width:100%;max-width:${TR_W}px;image-rendering:pixelated"></canvas>`).join('');
      }
      h += `</div>`;
      h += `<h2>A Lua</h2><div class="stats">${UDW.stat(LUA_DIAS + ' dias', 'um ciclo da lua')}${UDW.stat(horas(LUA_DIAS * minDia), 'de jogo por ciclo')}${UDW.stat(N(EST_DIAS * 4 / LUA_DIAS, 1).replace('.', ','), 'luas por ano')}</div>
        <ul class="regras"><li>A lua muda de fase uma vez por noite, às 18h, quando nasce: ${LUA_DIAS} fases, de nova a cheia e de volta. Um jogo novo começa na lua cheia.</li>
        <li>O ciclo não fecha com as estações: a lua cheia cai num dia diferente a cada estação, como na vida real.</li>
        <li>Na lua cheia a noite na superfície fica um pouco mais clara; na lua nova, mais escura.</li>
        <li>O ícone do relógio mostra a fase de noite. Menu &gt; Testes tem um botão que pula para a próxima fase.</li></ul>`;
      h += `<div style="display:grid;grid-template-columns:repeat(${LUA_FASES.length},1fr);gap:6px;background:#0d1428;padding:10px;border-radius:6px">` + LUA_FASES.map((n, p) => `<div style="text-align:center"><canvas class="est-lua" data-p="${p}" width="33" height="33" style="width:100%;max-width:99px;image-rendering:pixelated"></canvas><div style="font-size:12px;opacity:.8;color:#dfe6ff">${E(n)}</div></div>`).join('') + `</div>`;
      return h;
    },
    after(root) {
      for (const cv of root.querySelectorAll('canvas.est-lua')) { try { cv.getContext('2d').drawImage(bgMoonSprite(+cv.dataset.p), 0, 0); } catch (err) { console.warn('wiki: lua', err); } }
      for (const cv of root.querySelectorAll('canvas.est-arv')) {
        const kind = +cv.dataset.k, sp = cv.dataset.sp, e = COLS[+cv.dataset.c][1], v = 1;
        try { const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(estTreeSpr(kind, sp, v, treeLook(sp, kind, v, e)), 0, 0); } catch (err) { console.warn('wiki: árvore', sp, err); }
      }
    }
  };
})();
