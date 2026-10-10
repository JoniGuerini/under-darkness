'use strict';

/* ================= tela de carregamento =================
   Gerar o mundo (newWorld) roda tudo de uma vez e trava a página por alguns segundos. Esta tela (#udLoad no index.html,
   css/carregando.css) aparece antes, espera dois quadros para ser desenhada e só então gera o mundo.
   A barra anda com transform pelo tempo que a última geração levou (localStorage 'ud-gera-ms'); a chama e a barra
   seguem se mexendo mesmo com o jogo ocupado, porque transform/opacity são animados fora do script.
   Embrulha charNew, charLoad e startPlaying (que espera o mundo ficar pronto) e o "Novo mundo" do menu de pausa.
   Ao abrir a página a tela já começa visível (classe boot) e some aqui, que carrega por último. */
const udLoad = $('udLoad'), udLoadFill = udLoad.querySelector('.enche'), udLoadName = udLoad.querySelector('.nome');
let carregando = false, carregaPlay = false;
{ // grão estático, pintado uma vez
  const cv = udLoad.querySelector('.grao'), g = cv.getContext('2d'), im = g.createImageData(cv.width, cv.height);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 26 | 0; im.data[i] = v + 6; im.data[i + 1] = v + 3; im.data[i + 2] = v; im.data[i + 3] = Math.random() < 0.5 ? 70 : 0; }
  g.putImageData(im, 0, 0);
}
function carregaEstimativa() { try { const v = +localStorage.getItem('ud-gera-ms'); if (v > 200 && v < 120000) return v; } catch (e) { } return 7000; }
function carregaFecha() {
  udLoadFill.style.transition = 'transform .12s linear'; udLoadFill.style.transform = 'scaleX(1)';
  setTimeout(() => { udLoad.classList.add('out'); setTimeout(() => { if (!carregando) { udLoad.hidden = true; udLoad.classList.remove('out'); } }, 230); }, 130);
}
// mostra a tela, deixa ela aparecer e roda fn (a geração); depois roda depois()
function comCarregando(nome, fn, depois) {
  if (carregando) return;
  carregando = true;
  udLoadName.textContent = nome;
  udLoad.classList.remove('boot', 'out'); udLoad.hidden = false;
  udLoadFill.style.transition = 'none'; udLoadFill.style.transform = 'scaleX(.02)';
  void udLoadFill.offsetWidth;
  const est = carregaEstimativa();
  udLoadFill.style.transition = `transform ${Math.round(est * 1.15)}ms cubic-bezier(.2,.65,.35,1)`; udLoadFill.style.transform = 'scaleX(.94)';
  // dois quadros para a tela ser desenhada; com a aba escondida o requestAnimationFrame não roda, então o setTimeout garante
  let foi = false;
  const gera = () => {
    if (foi) return; foi = true;
    const t0 = performance.now();
    try { fn(); } catch (err) { console.error(err); }
    try { localStorage.setItem('ud-gera-ms', String(Math.round(performance.now() - t0))); } catch (e) { }
    carregando = false;
    try { if (depois) depois(); } catch (err) { console.error(err); }
    if (carregaPlay) { carregaPlay = false; _carregaStart(); }
    carregaFecha();
  };
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(gera, 30)));
  setTimeout(gera, document.hidden ? 30 : 400);
}
const _carregaNew = charNew, _carregaLoad = charLoad, _carregaStart = startPlaying;
charNew = function () { comCarregando('Gerando o mundo', _carregaNew); };
charLoad = function (id) {
  if (!chars.list.some(c => c.id === id)) return false;
  comCarregando('Carregando o mundo', () => _carregaLoad(id));
  return true;
};
startPlaying = function () { if (carregando) { carregaPlay = true; return; } _carregaStart(); };
// pausa > Novo mundo (segundo clique): o mesmo, com a tela
document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#btnNew') || !newArmed) return;
  e.stopImmediatePropagation(); e.preventDefault();
  resetNewBtn();
  comCarregando('Gerando o mundo', () => { newWorld((Math.random() * 2 ** 31) | 0); saveGame(); }, () => { $('pause').hidden = true; state = 'play'; last = performance.now(); });
}, true);
// teclas não passam para o jogo enquanto a tela está aberta
for (const ev of ['keydown', 'keyup']) addEventListener(ev, e => { if (carregando) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
// página aberta: tudo carregou, a tela de início já está pronta
carregaFecha();
