'use strict';
/* tela de opções: a mesma no título e no menu de pausa (Esc). Três abas:
   Som: som geral ligado/desligado, som de ambiente ligado/desligado (97-ambiente), volume do ambiente e volume dos efeitos (sliders em pixel art)
   Vídeo: tela cheia e contador de FPS
   Atalhos: quadro de atalhos na tela ligado/desligado e a lista de todas as teclas
   Cada opção só chama o que já existia (toggleSound, toggleAmb, toggleFull, toggleFps, toggleHelp), então tudo continua salvo
   no navegador como antes. Os volumes ficam em 'sob-a-terra-vol-musica' (hoje o do ambiente) e 'sob-a-terra-vol-efeitos' (lidos no 09-audio).
   No menu de pausa os botões soltos de som, música, tela cheia, FPS e atalhos dão lugar a um botão "Opções". */
let optsFrom = null;
const optsOpen = () => !!$('opts') && !$('opts').hidden;
(function () {
  const KEYS = [
    [['A', 'D'], 'Andar'], [['W'], 'Pular e subir corrente'], [['S'], 'Descer'],
    [['1', '0'], 'Item da barra (ou rodinha do mouse)', '–'], [['Clique esquerdo'], 'Golpear, minerar e colocar bloco'],
    [['Botão direito'], 'Levantar o escudo (ou Shift)'], [['E'], 'Conversar e abrir o baú da vila'], [['Q'], 'Colocar tocha'],
    [['R'], 'Beber poção'], [['Tab'], 'Mapa'], [['I'], 'Inventário'], [['C'], 'Atributos'], [['P'], 'Talentos'],
    [['Esc'], 'Menu'], [['F'], 'Tela cheia'], [['M'], 'Ligar e desligar o som'], [['H'], 'Mostrar atalhos na tela'], [['F3'], 'FPS']];
  const keyList = KEYS.map(([k, t, sep]) => `<div class="okey"><span class="kk">${k.map(x => `<kbd>${x}</kbd>`).join(sep ? `<i>${sep}</i>` : ' ')}</span><span>${t}</span></div>`).join('');
  const tog = (id, label) => `<div class="orow"><span class="olbl">${label}</span><button type="button" class="otog" id="${id}" role="switch" aria-checked="false"><span class="sw"><i></i></span><b></b></button></div>`;
  const sld = (id, label) => `<div class="orow"><span class="olbl">${label}</span><div class="osl" id="${id}" role="slider" tabindex="0" aria-label="${label}" aria-valuemin="0" aria-valuemax="100"><div class="trk"><i class="fill"></i><i class="knob"></i></div><b class="val"></b></div></div>`;
  const el = document.createElement('div');
  el.id = 'opts'; el.className = 'overlay'; el.hidden = true;
  el.innerHTML = `
    <section class="card optcard" aria-label="Opções">
      <h2>Opções</h2>
      <div class="otabs" role="tablist">
        <button type="button" class="tab on" data-ot="som" role="tab">Som</button>
        <button type="button" class="tab" data-ot="video" role="tab">Vídeo</button>
        <button type="button" class="tab" data-ot="atalhos" role="tab">Atalhos</button>
      </div>
      <div class="opane" data-op="som">${tog('oSom', 'Som')}${tog('oMus', 'Ambiente')}${sld('oVolMus', 'Volume do ambiente')}${sld('oVolSfx', 'Volume dos efeitos')}</div>
      <div class="opane" data-op="video" hidden>${tog('oFull', 'Tela cheia')}${tog('oFps', 'Mostrar FPS')}</div>
      <div class="opane" data-op="atalhos" hidden>${tog('oHelp', 'Atalhos na tela')}<div class="sep" role="separator"></div><div class="okeys" id="oKeys">${keyList}</div></div>
      <div class="ofoot"><button type="button" class="ghost" id="oBack">Voltar</button></div>
    </section>`;
  document.body.appendChild(el);
  if (typeof customScroll === 'function') customScroll($('oKeys'));

  /* abas */
  let tab = 'som';
  function showTab(t) {
    tab = t;
    for (const b of el.querySelectorAll('.otabs .tab')) { const on = b.dataset.ot === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }
    for (const p of el.querySelectorAll('.opane')) p.hidden = p.dataset.op !== t;
  }
  for (const b of el.querySelectorAll('.otabs .tab')) b.addEventListener('click', () => { showTab(b.dataset.ot); sfxTick(); });

  /* liga/desliga */
  const TOG = {
    oSom: [() => !muted, () => { initAudio(); toggleSound(); }],
    oMus: [() => window.isAmbOn ? isAmbOn() : true, () => { initAudio(); if (window.toggleAmb) toggleAmb(); }],
    oFull: [() => !!fullEl(), () => toggleFull()],
    oFps: [() => fpsOn, () => toggleFps()],
    oHelp: [() => !helpHidden, () => toggleHelp()]
  };
  function paintTog(id) {
    const b = $(id), on = !!TOG[id][0]();
    b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
    b.querySelector('b').textContent = id === 'oFull' ? (on ? 'Ligada' : 'Desligada') : (on ? 'Ligado' : 'Desligado');
  }
  function paintAll() { for (const id in TOG) paintTog(id); paintSl('oVolMus', musVol); paintSl('oVolSfx', sfxVol); el.querySelector('[data-op="som"]').classList.toggle('mute', muted); }
  for (const id in TOG) $(id).addEventListener('click', () => { TOG[id][1](); paintAll(); setTimeout(paintAll, 150); sfxTick(); });
  document.addEventListener('fullscreenchange', () => { if (optsOpen()) paintAll(); });

  /* sliders: trilho de ferro, enchimento de brasa e um botão de latão; 5 em 5 por cento */
  function paintSl(id, v) {
    const s = $(id), p = Math.round(v * 100);
    s.style.setProperty('--v', v);
    s.setAttribute('aria-valuenow', p);
    s.querySelector('.val').textContent = p + '%';
  }
  let tickT = 0;
  function sfxTick() { const now = performance.now(); if (now - tickT < 70) return; tickT = now; initAudio(); sfx.select(); }
  function saveVol() { try { localStorage.setItem('sob-a-terra-vol-musica', String(musVol)); localStorage.setItem('sob-a-terra-vol-efeitos', String(sfxVol)); } catch (e) { } }
  function setVol(id, v) {
    v = Math.round(Math.max(0, Math.min(1, v)) * 20) / 20;
    if (id === 'oVolMus') { if (v === musVol) return; musVol = v; initAudio(); if (window.setMusicVol) setMusicVol(v); }
    else { if (v === sfxVol) return; sfxVol = v; initAudio(); if (sfxOut) sfxOut.gain.setTargetAtTime(v, ac.currentTime, 0.02); sfxTick(); }
    paintSl(id, v); saveVol();
  }
  for (const id of ['oVolMus', 'oVolSfx']) {
    const s = $(id), trk = s.querySelector('.trk');
    const at = e => { const r = trk.getBoundingClientRect(); setVol(id, (e.clientX - r.left) / r.width); };
    s.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.preventDefault(); s.focus(); s.setPointerCapture(e.pointerId); s.classList.add('drag'); at(e); });
    s.addEventListener('pointermove', e => { if (s.hasPointerCapture(e.pointerId)) at(e); });
    const end = e => { s.classList.remove('drag'); try { s.releasePointerCapture(e.pointerId); } catch (x) { } };
    s.addEventListener('pointerup', end); s.addEventListener('pointercancel', end);
    s.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); setVol(id, (id === 'oVolMus' ? musVol : sfxVol) + (e.deltaY < 0 ? 0.05 : -0.05)); }, { passive: false });
  }

  /* abrir e fechar */
  function open(from) {
    optsFrom = from; showTab(tab); paintAll();
    el.hidden = false;
    if (from === 'pause') $('pause').hidden = true;
    el.querySelector('.otabs .tab.on').focus();
  }
  function close() {
    if (!optsOpen()) return;
    el.hidden = true;
    if (optsFrom === 'pause') { if (state === 'pause') { $('pause').hidden = false; $('btnOpts').focus(); } }
    else if (optsFrom === 'title' && $('ttOpt')) $('ttOpt').focus();
    optsFrom = null;
  }
  window.openOpts = open; window.closeOpts = close;
  $('oBack').addEventListener('click', close);
  el.addEventListener('pointerdown', e => { if (e.target === el) close(); });

  // teclado: Esc fecha; setas mexem no slider escolhido; Q e E trocam de aba; as teclas do jogo não passam enquanto a tela está aberta
  addEventListener('keydown', e => {
    if (!optsOpen()) return;
    const a = document.activeElement;
    if (e.code === 'Escape') { e.preventDefault(); close(); }
    else if (a && a.classList.contains('osl') && /^Arrow(Left|Right|Up|Down)$/.test(e.code)) { e.preventDefault(); setVol(a.id, (a.id === 'oVolMus' ? musVol : sfxVol) + (/Right|Up/.test(e.code) ? 0.05 : -0.05)); }
    else if (/^Arrow(Left|Right)$/.test(e.code) && a && a.classList.contains('tab')) { e.preventDefault(); const t = ['som', 'video', 'atalhos'], i = (t.indexOf(tab) + (e.code === 'ArrowRight' ? 1 : 2)) % 3; showTab(t[i]); el.querySelector('.otabs .tab.on').focus(); }
    else if (/^Arrow(Up|Down)$/.test(e.code)) {
      e.preventDefault();
      const list = [...el.querySelectorAll('.otabs .tab.on, .opane:not([hidden]) .otog, .opane:not([hidden]) .osl, #oBack')];
      const i = list.indexOf(a); list[(i + (e.code === 'ArrowDown' ? 1 : list.length - 1)) % list.length].focus();
    }
    if (!['Tab', 'Enter', 'NumpadEnter', 'Space'].includes(e.code)) e.stopPropagation();
  }, true);

  // menu de pausa: um botão "Opções" no lugar dos botões soltos
  for (const id of ['btnSound', 'btnMusic', 'btnFull', 'btnFps', 'btnHelp']) if ($(id)) $(id).hidden = true;
  const b = document.createElement('button');
  b.id = 'btnOpts'; b.className = 'ghost'; b.type = 'button'; b.textContent = 'Opções';
  $('btnResume').after(b);
  b.addEventListener('click', () => open('pause'));
})();
