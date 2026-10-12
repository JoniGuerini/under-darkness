'use strict';

/* ================= a tela leve: o navegador amplia o mundo, o canvas grande só leva os textos (2026-10-12) =================
   Antes, todo quadro o mundo pequeno (low, uns 480 x 270) era ampliado com drawImage para o canvas da tela inteira
   (#screen, 1920 x 1080, ou 4x isso num Retina), e esse canvas enorme ainda era copiado para a composição. Medido
   parado nas cavernas: metade do tempo do quadro era essa ampliação, e a cópia vinha por cima. Em máquina sem placa
   de vídeo boa (ou com a placa na lista negra do navegador, que desenha tudo na CPU) isso pesa mais que o jogo todo.
   Agora o próprio low fica na página, embaixo do #screen, ampliado pelo CSS com image-rendering: pixelated (o mesmo
   pixel inteiro de antes, S x S). O #screen virou uma camada transparente por cima: os números que voam, os nomes,
   as etiquetas e o mapa continuam nele, na resolução da tela, e ele só é limpo quando algo foi desenhado nele no
   quadro anterior; sem nada para mostrar, nem é tocado e o navegador não copia nada.
   O giro da câmera da Cidade dos Antigos (296) segue o caminho antigo durante o giro: desenha o low girado no #screen.
   Embrulha sc.drawImage (a ampliação do 15 é a chamada drawImage(low, 0, 0, VW * S, VH * S)). Carrega por último. */
(() => {
  if (typeof cvs === 'undefined' || !cvs || !low) return;
  const D = sc.drawImage;
  let dirty = true, key = '';
  // tudo que pinta no #screen marca que ele tem algo a limpar no próximo quadro
  for (const m of ['fillText', 'strokeText', 'fillRect', 'strokeRect', 'fill', 'stroke', 'putImageData']) {
    const f = sc[m]; sc[m] = function () { dirty = true; return f.apply(this, arguments); };
  }
  low.id = 'world'; low.setAttribute('aria-hidden', 'true');
  low.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;image-rendering:pixelated;background:var(--void)';
  cvs.style.background = 'transparent';
  cvs.before(low);
  sc.drawImage = function (img) {
    // durante o giro da câmera (296) o low é um quadro quadrado maior e precisa ser desenhado girado: o caminho antigo
    if (img !== low || (typeof atCam !== 'undefined' && atCam.big)) { dirty = true; return D.apply(this, arguments); }
    const k = VW + 'x' + VH + ':' + S + ':' + dpr;
    if (k !== key) { key = k; low.style.width = (VW * S / dpr) + 'px'; low.style.height = (VH * S / dpr) + 'px'; }
    if (dirty) { sc.save(); sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalAlpha = 1; sc.clearRect(0, 0, cvs.width, cvs.height); sc.restore(); dirty = false; }
  };
})();
