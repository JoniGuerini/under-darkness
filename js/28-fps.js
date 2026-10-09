'use strict';
/* contador de FPS: liga e desliga pelo botão do menu de pausa ou pela tecla F3.
   Vem desligado; a escolha fica guardada no navegador. Aparece como uma linha a mais no painel do canto superior direito. */
let fpsOn = false, fpsFrames = 0, fpsT0 = 0;
try { fpsOn = localStorage.getItem('sob-a-terra-fps') === '1'; } catch (e) { }
(function () {
  const row = document.createElement('div');
  row.className = 'row'; row.id = 'fpsRow'; row.hidden = !fpsOn;
  row.innerHTML = '<em>FPS</em><span id="hFps">--</span>';
  document.querySelector('#hud .world').appendChild(row);
  const btn = document.createElement('button');
  btn.id = 'btnFps'; btn.className = 'ghost'; btn.type = 'button';
  $('btnFull').after(btn);
  const help = $('help').lastElementChild;
  if (help) help.insertAdjacentHTML('beforeend', ' · <span class="k">F3</span> FPS');
})();
function setFpsLabel() { $('btnFps').textContent = fpsOn ? 'FPS: ligado' : 'FPS: desligado'; }
function toggleFps() {
  fpsOn = !fpsOn; $('fpsRow').hidden = !fpsOn; setFpsLabel();
  fpsFrames = 0; fpsT0 = performance.now(); $('hFps').textContent = '--';
  try { localStorage.setItem('sob-a-terra-fps', fpsOn ? '1' : '0'); } catch (e) { }
}
setFpsLabel();
$('btnFps').addEventListener('click', toggleFps);
addEventListener('keydown', e => {
  if (e.code !== 'F3') return;
  e.preventDefault();
  if (!e.repeat && !(e.target && e.target.tagName === 'INPUT')) toggleFps();
});
(function fpsTick(now) {
  requestAnimationFrame(fpsTick);
  if (!fpsOn) return;
  if (!fpsT0) fpsT0 = now;
  fpsFrames++;
  const span = now - fpsT0;
  if (span >= 500) {
    const fps = Math.round(fpsFrames * 1000 / span), el = $('hFps');
    el.textContent = fps;
    el.style.color = fps >= 50 ? '#9fd65a' : fps >= 30 ? '#f0c040' : '#e05a4a';
    fpsFrames = 0; fpsT0 = now;
  }
})(0);
