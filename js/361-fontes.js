'use strict';
/* fontes para testar (pedido do Jonathan, 2026-10-14): Opções > Vídeo > Fonte troca a fonte de todo o texto do jogo na hora.
   A escolhida é registrada pela API FontFace com o nome "UD Pixel" (texto) e "UD Titulo" (títulos); o CSS (--font-ui e
   --font-title em css/estilo.css) e o texto do canvas (js/15, 16, 17, 27, 46) já usam esses nomes, então tudo troca junto.
   Fica salva no navegador em 'ud-fonte'. Fontes que não são pixel ganham font-size-adjust para ficarem do tamanho certo. */
const FONTES = [
  { id: 'pixel', nome: 'UD Pixel', txt: [['UDPixel-Regular', '100 750'], ['UDPixel-Bold', '751 900']] },
  { id: 'classica', nome: 'Clássica (Rubik)', txt: [['Rubik', '300 900']], tit: [['Jersey10-Regular', '100 900']], adj: .58 },
  { id: 'pixelify', nome: 'Pixelify Sans', txt: [['PixelifySans', '400 700']], adj: .58 },
  { id: 'vt323', nome: 'VT323', txt: [['VT323-Regular', '100 900']], adj: .6 },
  { id: 'medieval', nome: 'Cinzel e Alegreya', txt: [['AlegreyaSans-Regular', '100 600'], ['AlegreyaSans-Bold', '601 900']], tit: [['Cinzel', '400 900']], adj: .58 },
  { id: 'garamond', nome: 'EB Garamond', txt: [['EBGaramond', '400 800']], adj: .58 },
  { id: 'fell', nome: 'IM Fell English', txt: [['IMFellEnglish-Regular', '100 900']], adj: .58 },
  { id: 'medievalsharp', nome: 'MedievalSharp', txt: [['MedievalSharp', '100 900']] }
];
let fonteAtual = FONTES[0];
function usarFonte(id) {
  const f = FONTES.find(x => x.id === id) || FONTES[0];
  for (const ff of [...document.fonts]) if (ff._ud) document.fonts.delete(ff);
  const add = (fam, list) => {
    for (const [arq, w] of list) {
      const ff = new FontFace(fam, `url(fonts/${arq}.woff2)`, { weight: w, display: 'block' });
      ff._ud = 1; document.fonts.add(ff); ff.load().catch(() => { });
    }
  };
  add('UD Pixel', f.txt); add('UD Titulo', f.tit || f.txt);
  const r = document.documentElement.style;
  r.setProperty('--font-title', '"UD Titulo", "UD Pixel", monospace');
  r.setProperty('--fsa', f.adj ? 'ex-height ' + f.adj : 'none');
  document.documentElement.dataset.fonte = f.id;
  fonteAtual = f;
  try { localStorage.setItem('ud-fonte', f.id); } catch (e) { }
}
(function () {
  let salva = null;
  try { salva = localStorage.getItem('ud-fonte'); } catch (e) { }
  usarFonte(salva || 'pixel');
  const st = document.createElement('style');
  st.textContent = 'html[data-fonte] body, html[data-fonte] body *{font-size-adjust:var(--fsa,none)!important}';
  document.head.appendChild(st);

  /* a linha "Fonte" na aba Vídeo das opções */
  const pane = document.querySelector('#opts .opane[data-op="video"]');
  if (!pane) return;
  const row = document.createElement('div');
  row.className = 'orow';
  row.innerHTML = '<span class="olbl">Fonte</span><div class="ofonte"><button type="button" class="ghost" id="oFonteAnt" aria-label="Fonte anterior">&lt;</button><b id="oFonteNome"></b><button type="button" class="ghost" id="oFonteProx" aria-label="Próxima fonte">&gt;</button></div>';
  pane.appendChild(row);
  const pinta = () => { $('oFonteNome').textContent = fonteAtual.nome; };
  const passo = d => {
    const i = FONTES.indexOf(fonteAtual);
    usarFonte(FONTES[(i + d + FONTES.length) % FONTES.length].id); pinta();
    try { initAudio(); sfx.select(); } catch (e) { }
  };
  $('oFonteAnt').addEventListener('click', () => passo(-1));
  $('oFonteProx').addEventListener('click', () => passo(1));
  pinta();
})();
