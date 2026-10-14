'use strict';
/* música da tela de início: uma marcha medieval em ré menor, 4/4 a 108, animada e imponente. Violoncelos num ostinato
   pesado de colcheias, contrabaixo, harpa em arpejo, tímpano e tambores, trompas nos acordes, flauta na melodia e o
   coral cantando o tema em oitavas no meio. Instrumentos gravados de verdade (o banco FluidR3, licença MIT, veja
   musica/LICENCA-FluidR3.txt), compostos e gravados num mp3 de 71,1 s (32 compassos) que dá a volta sem emenda.
   A versão calma (harpa, violoncelo, coral e flauta) ficou guardada em musica/guardadas/musica-calma.mp3.
   O áudio fica em musica/titulo-musica.js e só é carregado depois que o jogo abre, para não atrasar a entrada.
   O navegador não deixa tocar som antes de um clique ou tecla: a música começa no primeiro clique ou tecla com a tela
   de início aberta, sobe devagar, dá a volta para sempre e some em ~1,5 s quando o jogo começa. Volta (do começo) se o
   menu de pausa voltar para a tela de início. Segue o som geral (ligado/desligado) e o volume do ambiente das opções
   (`musVol` do 09-audio). Só toca na tela de início: dentro do jogo continua só o ambiente (97-ambiente). */
(() => {
  const LOOP = 3136000 / 44100, LAME_DELAY = 1105 / 44100, VOL = 0.9, IN = 2.5, OUT = 1.5;
  let buf = null, loading = false, decoding = false, src = null, gain = null, vol = -1;
  const titleOn = () => { const t = document.getElementById('title'); return !!t && !t.hidden && !t.classList.contains('out'); };
  function load() {
    if (loading) return; loading = true;
    const s = document.createElement('script'); s.src = 'musica/titulo-musica.js'; s.onload = tick; document.head.appendChild(s);
  }
  function decode() {
    if (decoding || typeof TITULO_MUSICA === 'undefined') return; decoding = true;
    const bin = atob(TITULO_MUSICA), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    ac.decodeAudioData(u.buffer, b => { buf = b; tick(); }, () => { });
  }
  function start() {
    // o Chrome e o Safari cortam o silêncio que o mp3 põe no começo; se algum navegador não cortar, pula ele
    const off = buf.duration > LOOP + 0.01 ? LAME_DELAY : 0;
    gain = ac.createGain(); gain.gain.value = 0; gain.connect(master);
    src = ac.createBufferSource(); src.buffer = buf; src.loop = true; src.loopStart = off; src.loopEnd = off + LOOP;
    src.connect(gain); src.start(ac.currentTime + 0.05, off); vol = -1;
  }
  function stop() {
    const now = ac.currentTime, s = src, g = gain;
    g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + OUT);
    s.stop(now + OUT + 0.05); s.onended = () => { try { g.disconnect(); } catch (e) { } };
    src = gain = null;
  }
  function tick() {
    if (!buf && !loading) load();
    if (typeof ac === 'undefined' || !ac || ac.state !== 'running' || !master) return;
    if (!buf) { decode(); return; }
    const on = titleOn() && !muted && musVol > 0;
    if (on && !src) start();
    else if (!on && src) stop();
    if (src) {
      const want = VOL * musVol;
      if (want !== vol) { const now = ac.currentTime; gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); gain.gain.linearRampToValueAtTime(want, now + (vol < 0 ? IN : 0.08)); vol = want; }
    }
  }
  // o primeiro clique ou tecla na tela de início liga o som (o navegador só deixa assim)
  const wake = () => { if (titleOn()) { initAudio(); setTimeout(tick, 30); } };
  addEventListener('pointerdown', wake, true); addEventListener('keydown', wake, true);
  setInterval(tick, 250);
  addEventListener('load', () => setTimeout(load, 400));
})();
