'use strict';

/* Carrega antes dos arquivos do jogo.
   O código do jogo liga teclado, rodinha e "salvar ao sair da aba" na janela. Aqui as teclas e a rodinha
   param no document, antes de chegar nesses ouvintes, e o "salvar" nunca roda: a wiki só lê, nunca mexe no save. */
for (const t of ['keydown', 'keyup', 'wheel']) document.addEventListener(t, e => e.stopPropagation());
document.addEventListener('visibilitychange', e => e.stopImmediatePropagation());

// o mesmo atalho que o jogo define no 20-hud-menus (que a wiki não carrega)
const $ = id => document.getElementById(id);
