'use strict';

/* ================= janela grande aberta: o mundo atrás para de ser redesenhado (2026-10-10) =================
   Com a loja, a forja, a alquimia, a cozinha, o encantador, o baú ou o inventário abertos o jogo já está parado
   (só as partículas andam), mas o canvas da tela inteira era redesenhado em todo quadro. Num Mac Retina isso é
   4x mais pixels, e a placa de vídeo ainda tinha de misturar a janela texturizada por cima dele a cada quadro:
   o FPS caía para uns 60 só de abrir uma loja. Agora o mundo é desenhado mais duas vezes depois que a janela
   abre e fica parado; o resto da página não muda e a placa não refaz nada. Ao fechar, volta tudo.
   A conversa simples (#talk) não entra: ali o mundo continua aparecendo bastante. Embrulha render (15). */
(() => {
  const BIG = ['shop', 'forge', 'alq', 'cozinha', 'enc', 'stash', 'inv'].map(id => () => document.getElementById(id));
  const els = BIG.map(f => null);
  const bigOpen = () => { for (let i = 0; i < BIG.length; i++) { const e = els[i] || (els[i] = BIG[i]()); if (e && !e.hidden) return true; } return false; };
  let still = 0;
  const _render = render;
  render = function () {
    if ((state === 'inv' || state === 'talk' || state === 'char') && bigOpen()) { if (still >= 2) return; still++; }
    else still = 0;
    return _render.apply(this, arguments);
  };
})();
