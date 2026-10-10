'use strict';

/* ================= fora de foco: o jogo não para =================
   Com a janela minimizada, em outra aba ou coberta, o navegador deixa de chamar o requestAnimationFrame
   (ou chama bem devagar), e o frame() do 24-boot congelava tudo: a fornalha, a bigorna, o caldeirão, a
   panela, o relógio do dia e os monstros. Aqui o tempo real que passou é sempre simulado:
   - um relógio de fundo (setInterval) roda o jogo sem desenhar enquanto o quadro não vem;
   - quando o quadro volta depois de um buraco, o tempo que faltou é recuperado antes de desenhar.
   A simulação anda em passos normais de 33 ms (nada de um salto gigante na física). Se o navegador
   segurar o relógio por muito tempo (minutos), o que passar do limite de CPU de cada rodada só avança
   o relógio do dia, as oficinas (tickFurnace, já embrulhado pelo 96 e pelo 99) e os elixires.
   Só o menu (Esc), a tela de título e a morte param o jogo, como antes.
   Embrulha `frame` (24-boot); carrega depois dele. */
(() => {
  const STEP = 0.033;
  const RUNS = { play: 1, inv: 1, talk: 1, char: 1 };   // estados em que o tempo corre
  let lastRaf = performance.now(), busy = false;

  // um passo de jogo sem desenho, com as mesmas regras do frame()
  function step(dt) {
    if (state === 'play') { if (hitstop > 0) hitstop -= dt; else update(dt); }
    else if (state === 'inv' || state === 'talk' || state === 'char') updateParts(dt);
    if (state !== 'menu' && state !== 'pause' && state !== 'dead') tickFurnace(dt);
    levelFlash = Math.max(0, levelFlash - dt * 1.2); hurtVig = Math.max(0, hurtVig - dt * 1.5);
    for (const k in pressed) pressed[k] = false;
    mouse.lPressed = false;
  }
  // só os relógios, para buracos grandes demais para simular passo a passo
  function fastForward(sec) {
    while (sec > 0 && RUNS[state]) {
      const c = Math.min(0.5, sec); sec -= c;
      if (state === 'play') { gameTime += c; worldTime += c; if (typeof tickAlq === 'function' && !pl.dead) tickAlq(c); }
      tickFurnace(c);
    }
  }
  // simula sec segundos; budget = milissegundos de CPU que esta rodada pode gastar
  function catchUp(sec, budget) {
    if (busy || sec <= 0 || !RUNS[state]) return;
    busy = true;
    const quiet = sec > 0.25, wasMuted = muted;
    if (quiet) muted = true;   // sem a rajada de golpes e passos de uma vez só
    try {
      const t0 = performance.now();
      while (sec > 1e-4 && RUNS[state] && performance.now() - t0 < budget) { const dt = Math.min(STEP, sec); sec -= dt; step(dt); }
      if (sec > 1e-4) fastForward(sec);
    } catch (err) { console.error(err); }
    finally { muted = wasMuted; busy = false; }
  }

  // o quadro voltou depois de um buraco: recupera o que faltou e deixa o último passo para o frame normal
  const _frame = frame;
  frame = function (now) {
    lastRaf = performance.now();
    const gap = (now - last) / 1000;
    if (gap > 0.1) { catchUp(gap - STEP, 40); last = now - STEP * 1000; }
    _frame(now);
  };

  // relógio de fundo: só age quando o quadro parou de vir
  setInterval(() => {
    const now = performance.now();
    if (!document.hidden && now - lastRaf < 250) return;
    const sec = (now - last) / 1000;
    last = now;
    catchUp(sec, 200);
  }, 200);

  // aba escondida: soltar as teclas (o blur nem sempre vem junto)
  document.addEventListener('visibilitychange', () => { if (document.hidden) { for (const k in keys) keys[k] = false; mouse.l = mouse.r = false; } });

  window.__foraDeFoco = { catchUp, step };   // para testes
})();
