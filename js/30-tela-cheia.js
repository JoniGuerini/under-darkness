'use strict';
/* tela cheia que volta sozinha: se o jogador ligou a tela cheia e o jogo saiu dela por qualquer motivo
   (alt-tab, Esc do navegador, perda de foco), ela volta no primeiro clique ou tecla depois que a janela tem foco de novo.
   O navegador só deixa entrar em tela cheia a partir de um gesto do jogador, por isso não dá para voltar no instante do foco.
   Desligar a tela cheia pelo menu ou pela tecla F apaga o desejo. A escolha fica guardada no navegador. */
try { if (localStorage.getItem('sob-a-terra-tela-cheia') === '1') wantFull = true; } catch (e) { }
function saveWantFull() { try { localStorage.setItem('sob-a-terra-tela-cheia', wantFull ? '1' : '0'); } catch (e) { } }
document.addEventListener('fullscreenchange', saveWantFull);
document.addEventListener('webkitfullscreenchange', saveWantFull);
function reenterFull(e) {
  if (!wantFull || fullEl() || !document.hasFocus()) return;
  if (e.type === 'keydown' && (e.code === 'Escape' || e.code === 'KeyF')) return;   // Esc não conta como gesto; F o jogo já trata
  enterFull();
}
addEventListener('pointerdown', reenterFull, true);
addEventListener('keydown', reenterFull, true);
