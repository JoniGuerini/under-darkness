'use strict';

/* ================= liga a wiki: prepara os desenhos do jogo, monta o menu e troca de página pelo endereço (#/...) ================= */
(() => {
  // a wiki nunca grava o save do jogo
  saveGame = function () { };

  // o mesmo preparo do start() do 24-boot, só a parte dos desenhos
  comp = mk(CW, CHT); cctx = comp.getContext('2d', { willReadFrequently: true }); cctx.imageSmoothingEnabled = false;
  try { buildSprites(); } catch (e) { console.warn('wiki: buildSprites', e); }
  try { buildIcons(); } catch (e) { console.warn('wiki: buildIcons', e); }

  const NAV = [
    ['Início', [['inicio', 'Visão geral']]],
    ['Itens', [['itens', 'Equipamentos'], ['materiais', 'Materiais e blocos'], ['modificadores', 'Modificadores'], ['raridades', 'Raridades e sorteio'], ['lendarios', 'Lendários'], ['forja', 'Forja'], ['cozinha', 'Cozinha'], ['alquimia', 'Alquimia'], ['oficios', 'Ofícios']]],
    ['Mundo', [['inimigos', 'Inimigos'], ['chefes', 'Chefes'], ['npcs', 'Moradores'], ['biomas', 'Biomas'], ['estacoes', 'Estações'], ['talentos', 'Talentos'], ['regras', 'Regras do jogo']]],
    ['Arquivos', [['docs', 'Documentos']]]
  ];
  $('nav').innerHTML = NAV.map(([g, list]) => `<div class="ng"><small>${g}</small>${list.map(([k, t]) => `<a href="#/${k}" data-k="${k}">${t}</a>`).join('')}</div>`).join('');

  function route() {
    const parts = (location.hash.replace(/^#\/?/, '') || 'inicio').split('/').map(decodeURIComponent);
    const k = parts[0], P = UDW.pages[k] || UDW.pages.inicio, main = $('main');
    const navK = k === 'item' ? (UDW.isGear(parts[1] || '') ? 'itens' : 'materiais') : k === 'inimigo' ? 'inimigos' : k;
    for (const a of document.querySelectorAll('#nav a')) a.classList.toggle('on', a.dataset.k === navK);
    try { main.innerHTML = P.render(...parts.slice(1)); if (P.after) P.after(main, ...parts.slice(1)); }
    catch (e) { console.error(e); main.innerHTML = UDW.head('Esta página quebrou') + `<p class="erro">Algo no código do jogo mudou e esta página não conseguiu ler. Detalhe: ${UDW.esc(e.message)}</p>`; }
    if (!parts.includes('keep-scroll')) main.scrollTop = 0;
    $('wtip').hidden = true;
    document.title = (main.querySelector('h1') ? main.querySelector('h1').textContent + ' · ' : '') + 'Under Darkness · Wiki';
  }
  addEventListener('hashchange', route);

  let tmo = 0;
  $('busca').addEventListener('input', e => { clearTimeout(tmo); const q = e.target.value.trim(); tmo = setTimeout(() => { location.hash = q ? '#/busca/' + encodeURIComponent(q) : '#/inicio'; }, 180); });
  route();
})();
