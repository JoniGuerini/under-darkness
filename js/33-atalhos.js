'use strict';
/* quadro de atalhos (canto inferior esquerdo): vem desligado. Liga e desliga pelo botão do menu ou pela tecla H.
   A escolha fica guardada no navegador. */
try { helpHidden = localStorage.getItem('sob-a-terra-atalhos') !== '1'; } catch (e) { helpHidden = true; }
$('help').hidden = helpHidden;
(function () {
  const btn = document.createElement('button');
  btn.id = 'btnHelp'; btn.className = 'ghost'; btn.type = 'button';
  ($('btnFps') || $('btnFull')).after(btn);
})();
function helpUI() {
  $('help').hidden = helpHidden;
  $('btnHelp').textContent = helpHidden ? 'Atalhos: desligado' : 'Atalhos: ligado';
  try { localStorage.setItem('sob-a-terra-atalhos', helpHidden ? '0' : '1'); } catch (e) { }
}
function toggleHelp() { helpHidden = !helpHidden; helpUI(); }
helpUI();
$('btnHelp').addEventListener('click', toggleHelp);
addEventListener('keydown', e => { if (e.code === 'KeyH') helpUI(); });   // a tecla H já troca helpHidden no 08; aqui só guarda e atualiza o botão
