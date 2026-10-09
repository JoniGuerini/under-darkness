'use strict';
/* música de fundo (js/38-musica.js): dois temas compostos aqui mesmo, sem arquivos de áudio.
   - vila: violão dedilhado lento em ré menor, com bordão grave e uma melodia esparsa (clima de vila medieval esquecida)
   - caverna: suspense e exploração, sem pulso: zumbido grave, vento, notas soltas, gotas, acordes dissonantes que sobem devagar
   Cada tema é "gravado" uma vez no início (em pedaços, para não travar o jogo) num buffer que toca em loop sem emenda.
   Na superfície toca a vila; abaixo dela, a caverna. A troca é um cruzamento lento de volume.
   O botão "Som" do menu cala tudo (a música passa pelo mesmo volume geral); "Música" liga e desliga só a música. */
const MUSICA = (function () {
  const SR = 32000;
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // a "faixa": canais esquerdo/direito secos e um envio mono para o reverb
  function mkTrack(sec, tail) { const n = Math.ceil((sec + tail) * SR); return { len: Math.round(sec * SR), n, L: new Float32Array(n), R: new Float32Array(n), S: new Float32Array(n) }; }
  function put(tr, i, v, pan, send) { if (i < 0) i += tr.len; if (i < 0 || i >= tr.n) return; tr.L[i] += v * (1 - pan) ; tr.R[i] += v * (1 + pan); tr.S[i] += v * send; }

  // corda dedilhada (Karplus-Strong com afinação fina)
  function pluck(tr, t0, midi, vel, o = {}) {
    const R = o.rnd, f = mf(midi), N = SR / f, D = Math.max(2, Math.floor(N - 0.5)), frac = N - 0.5 - D, c = (1 - frac) / (1 + frac);
    const dec = o.dec || 3, bright = o.bright == null ? 0.5 : o.bright, pan = o.pan || 0, send = o.send == null ? 0.35 : o.send;
    const loss = Math.pow(0.001, 1 / (dec * f)), buf = new Float32Array(D);
    let lp = 0; for (let i = 0; i < D; i++) { lp += (R() * 2 - 1 - lp) * (0.15 + bright * 0.8); buf[i] = lp; }
    const pos = Math.max(1, Math.round(D * 0.13)), ex = buf.slice(); for (let i = 0; i < D; i++) buf[i] = ex[i] - 0.6 * ex[(i + pos) % D];
    let m = 0; for (let i = 0; i < D; i++) m += buf[i]; m /= D; for (let i = 0; i < D; i++) buf[i] -= m;
    const len = Math.min(Math.round(dec * 1.15 * SR), Math.round((o.cut || 99) * SR)), st = Math.round(t0 * SR), fade = Math.round(0.06 * SR);
    let idx = 0, prev = 0, a1 = 0, b1 = 0, body = 0; const g = vel * 0.55;
    for (let n = 0; n < len; n++) {
      const s = buf[idx], avg = loss * 0.5 * (s + prev); prev = s;
      const ap = c * avg + a1 - c * b1; a1 = avg; b1 = ap; buf[idx] = ap; idx = idx + 1 === D ? 0 : idx + 1;
      body += (s - body) * 0.55;
      let v = body * g; if (n > len - fade) v *= (len - n) / fade;
      put(tr, st + n, v, pan, send);
    }
  }
  // som contínuo com parciais (bordão, acordes que sobem), envelope de ataque/soltura
  function* swell(tr, t0, dur, midis, vol, o = {}) {
    const att = o.att || 2, rel = o.rel || 3, parts = o.parts || [1, 0.35, 0.18, 0.08], pan = o.pan || 0, send = o.send == null ? 0.6 : o.send, det = o.det || 0.0015;
    const st = Math.round(t0 * SR), len = Math.round(dur * SR), lfo = o.lfo || 0;
    // o.loop: som que dura o loop inteiro; as frequências são ajustadas para fechar ciclos inteiros e não estalar na volta
    const fix = hz => o.loop ? Math.max(1, Math.round(hz * dur)) / dur : hz;
    const ph = []; midis.forEach(m => parts.forEach((a, k) => { ph.push({ w: 2 * Math.PI * fix(mf(m) * (k + 1) * (1 + det * (k % 2 ? 1 : -1))) / SR, a: a / midis.length }); }));
    for (let n = 0; n < len; n++) {
      const t = n / SR; let e = o.loop ? 1 : t < att ? t / att : t > dur - rel ? Math.max(0, (dur - t) / rel) : 1; e = e * e * (3 - 2 * e);
      if (lfo) e *= 0.75 + 0.25 * Math.sin(2 * Math.PI * (t0 + t) / lfo);
      let v = 0; for (const q of ph) v += Math.sin(q.w * n) * q.a;
      put(tr, st + n, v * vol * e, pan, send);
      if ((n & 32767) === 0) yield;
    }
  }
  // ruído filtrado (vento nas galerias), volume que respira em ciclo exato do loop
  function* wind(tr, dur, vol, freq, q, period, R) {
    const w = 2 * Math.PI * freq / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al, b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - al) / a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0; const len = Math.round(dur * SR), xf = SR;   // 1 s a mais, que some enquanto o começo aparece
    for (let n = 0; n < len + xf; n++) {
      const x = R() * 2 - 1, y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y;
      const t = (n % len) / SR, e = 0.55 + 0.45 * Math.sin(2 * Math.PI * t / period), p = 0.5 * Math.sin(2 * Math.PI * t / (period * 1.5));
      const f = n < xf ? n / xf : n >= len ? (len + xf - n) / xf : 1;
      put(tr, n, y * vol * e * f, p, 0.5);
      if ((n & 32767) === 0) yield;
    }
  }
  function drip(tr, t0, f, vol, pan) {
    const st = Math.round(t0 * SR), len = Math.round(0.5 * SR); let p = 0;
    for (let n = 0; n < len; n++) { const t = n / SR, fr = f * (0.62 + 0.38 * Math.exp(-t / 0.03)); p += 2 * Math.PI * fr / SR; put(tr, st + n, Math.sin(p) * vol * Math.exp(-t / 0.05), pan, 1.4); }
  }
  function thump(tr, t0, vol) {
    const st = Math.round(t0 * SR), len = Math.round(0.9 * SR); let p = 0;
    for (let n = 0; n < len; n++) { const t = n / SR, fr = 38 + 30 * Math.exp(-t / 0.06); p += 2 * Math.PI * fr / SR; put(tr, st + n, Math.sin(p) * vol * Math.exp(-t / 0.22) * Math.min(1, t / 0.01), 0, 0.7); }
  }

  // reverb (Freeverb): lê o envio e soma no esquerdo/direito; anda em pedaços
  function* reverb(tr, room, damp, wet) {
    const sc = SR / 44100, combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], alls = [556, 441, 341, 225];
    const mk = (d, sp) => ({ b: new Float32Array(Math.round((d + sp) * sc)), i: 0, f: 0 });
    const CL = combs.map(d => mk(d, 0)), CR = combs.map(d => mk(d, 23)), AL = alls.map(d => mk(d, 0)), AR = alls.map(d => mk(d, 23));
    const comb = (c, x) => { const y = c.b[c.i]; c.f = y * (1 - damp) + c.f * damp; c.b[c.i] = x + c.f * room; if (++c.i >= c.b.length) c.i = 0; return y; };
    const all = (a, x) => { const bo = a.b[a.i], y = -x + bo; a.b[a.i] = x + bo * 0.5; if (++a.i >= a.b.length) a.i = 0; return y; };
    for (let n = 0; n < tr.n; n++) {
      const x = tr.S[n] * 0.015; let l = 0, r = 0;
      for (let k = 0; k < 8; k++) { l += comb(CL[k], x); r += comb(CR[k], x); }
      for (let k = 0; k < 4; k++) { l = all(AL[k], l); r = all(AR[k], r); }
      tr.L[n] += l * wet; tr.R[n] += r * wet;
      if ((n & 16383) === 0) yield;
    }
  }
  // dobra a cauda (o que soou depois do fim) sobre o começo: o loop não tem emenda
  function finish(tr, rms) {
    const L = new Float32Array(tr.len), R = new Float32Array(tr.len);
    for (let n = 0; n < tr.n; n++) { L[n % tr.len] += tr.L[n]; R[n % tr.len] += tr.R[n]; }
    let s = 0; for (let n = 0; n < tr.len; n++) s += L[n] * L[n] + R[n] * R[n];
    const k = rms / Math.sqrt(s / (2 * tr.len) || 1);
    for (let n = 0; n < tr.len; n++) { L[n] = Math.tanh(L[n] * k * 1.1) / 1.1; R[n] = Math.tanh(R[n] * k * 1.1) / 1.1; }
    return { sr: SR, L, R };
  }

  /* ---------- tema da vila: ré menor, 3/4, colcheias dedilhadas ---------- */
  function* vila() {
    const E = 0.42, BAR = 6 * E, BARS = 20, R = rng(7), tr = mkTrack(BAR * BARS, 7);
    const C = {
      Dm: [38, 57, 62, 65], Dm9: [38, 57, 64, 65], C: [36, 55, 60, 64], Bb: [34, 53, 58, 62], A: [33, 52, 57, 61], As: [33, 52, 57, 62],
      F: [41, 57, 60, 65], Gm: [43, 58, 62, 67], GmD: [38, 58, 62, 67]
    };
    const prog = ['Dm', 'Dm9', 'Bb', 'C', 'Dm', 'Dm9', 'Gm', 'A', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'As', 'A', 'Dm', 'Bb', 'GmD', 'A'];
    const pat = [0, 1, 2, 3, 2, 1], pv = [0.95, 0.5, 0.58, 0.66, 0.52, 0.46];
    const hum = () => (R() - 0.5) * 0.024;
    // bordão que respira por baixo de tudo (ré e lá graves)
    yield* swell(tr, 0, BAR * BARS, [38, 45], 0.05, { loop: true, parts: [1, 0.25, 0.1], lfo: BAR * 4, send: 0.3, det: 0.002 });
    for (let b = 0; b < BARS; b++) {
      const ch = C[prog[b]], quiet = b >= 8 && b < 16 ? 0.8 : 1;
      for (let i = 0; i < 6; i++) {
        const k = pat[i], m = ch[k], t = b * BAR + i * E + hum() + (k === 0 ? 0 : 0.012);
        const v = pv[i] * (k === 0 ? 1 : quiet) * (0.88 + R() * 0.2), pan = [-0.1, -0.35, 0.25, 0.4][k];
        pluck(tr, t, m, v, { rnd: R, dec: k === 0 ? 5 : 3.2, bright: k === 0 ? 0.3 : 0.45, pan, send: 0.3 });
        if (k > 0) pluck(tr, t + 0.007, m + 12, v * 0.2, { rnd: R, dec: 2.2, bright: 0.6, pan: -pan, send: 0.4 });   // cordas dobradas, brilho de 12 cordas
      }
      if (b % 4 === 0 && b < 16) pluck(tr, b * BAR - 0.02 + (b ? 0 : 0.02), 26, 0.55, { rnd: R, dec: 7, bright: 0.2, pan: 0, send: 0.25 });   // ré bem grave a cada 4 compassos
    }
    // melodia: [compasso, colcheia, nota, duração em colcheias]
    const mel = [
      [4, 0, 69, 3], [4, 3, 70, 1], [4, 4, 69, 2], [5, 0, 65, 3], [5, 3, 64, 1], [5, 4, 62, 2], [6, 0, 67, 2], [6, 2, 70, 2], [6, 4, 69, 2], [7, 0, 64, 3], [7, 3, 61, 3],
      [8, 0, 74, 3], [8, 3, 72, 1], [8, 4, 70, 2], [9, 0, 72, 4], [9, 4, 69, 2], [10, 0, 67, 2], [10, 2, 69, 1], [10, 3, 70, 1], [10, 4, 67, 2], [11, 0, 69, 6],
      [12, 0, 70, 2], [12, 2, 69, 1], [12, 3, 67, 1], [12, 4, 65, 2], [13, 0, 67, 3], [13, 3, 65, 1], [13, 4, 62, 2], [14, 0, 64, 2], [14, 2, 62, 2], [14, 4, 64, 2], [15, 0, 61, 6],
      [16, 2, 74, 4], [17, 0, 70, 6], [18, 0, 67, 3], [18, 3, 69, 3], [19, 0, 73, 6]
    ];
    for (const [b, e, m, d] of mel) {
      const t = b * BAR + e * E + hum() + 0.02, long = d >= 4;
      pluck(tr, t, m, 0.82, { rnd: R, dec: long ? 4 : 2.8, bright: 0.55, pan: 0.05, send: 0.45 });
      if (long) for (let k = 1; k < d * 2 - 1; k++) pluck(tr, t + k * E / 2, m, 0.18 + 0.1 * Math.sin(k), { rnd: R, dec: 1.2, bright: 0.5, pan: 0.05, send: 0.5, cut: E }); // trêmulo suave nas notas longas
      yield;
    }
    yield* reverb(tr, 0.86, 0.35, 0.55);
    return finish(tr, 0.11);
  }

  /* ---------- tema da caverna: sem pulso, suspense ---------- */
  function* caverna() {
    const LEN = 48, R = rng(31), tr = mkTrack(LEN, 8);
    yield* wind(tr, LEN, 0.05, 260, 0.9, 16, R);
    yield* swell(tr, 0, LEN, [26, 38], 0.07, { loop: true, parts: [1, 0.5, 0.2, 0.12], lfo: 12, send: 0.4, det: 0.004 }); yield;   // zumbido grave
    // acordes que sobem devagar e somem: intervalos tensos (trítono, segunda menor)
    for (const [t, d, ms, p] of [[3, 10, [51, 57], -0.3], [19, 9, [50, 51], 0.3], [33, 11, [46, 52], -0.1], [40, 8, [62, 63], 0.25]]) yield* swell(tr, t, d, ms, 0.045, { att: d * 0.45, rel: d * 0.45, pan: p, send: 0.9, parts: [1, 0.3, 0.12, 0.05, 0.03] });
    // notas soltas, frias, no mesmo violão escuro (ré frígio)
    const notes = [[2, 50, 0.6], [3.4, 51, 0.45], [9.5, 45, 0.55], [14, 50, 0.55], [15, 53, 0.42], [16.1, 51, 0.5], [25.5, 46, 0.5], [27, 45, 0.5],
      [32.6, 62, 0.3], [33.5, 61, 0.28], [38, 57, 0.3], [41, 50, 0.55], [42.3, 51, 0.48], [44, 50, 0.4], [45.2, 44, 0.45]];
    for (const [t, m, v] of notes) { pluck(tr, t, m, v, { rnd: R, dec: 4.5, bright: 0.22, pan: (R() - 0.5) * 0.8, send: 0.9 }); yield; }
    // gotas
    for (let i = 0; i < 14; i++) drip(tr, 1 + R() * (LEN - 2), 1100 + R() * 1500, 0.06 + R() * 0.05, (R() - 0.5) * 1.6);
    // um coração distante, raro
    [[7, 0.22], [7.38, 0.15], [29.5, 0.2], [29.88, 0.14]].forEach(([t, v]) => thump(tr, t, v));
    yield;
    yield* reverb(tr, 0.93, 0.45, 0.85);
    return finish(tr, 0.085);
  }

  // roda um gerador até o fim (usado no Node para as prévias)
  function renderSync(name) { const g = name === 'vila' ? vila() : caverna(); let r; do r = g.next(); while (!r.done); return r.value; }
  return { SR, vila, caverna, renderSync };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = MUSICA;

if (typeof document !== 'undefined') (function () {
  const VOL = 0.5, FADE = 1.6;   // FADE: constante de tempo da troca (s); cerca de 5 s até completar
  let musicOn = true; try { musicOn = localStorage.getItem('sob-a-terra-musica') !== '0'; } catch (e) { }
  const data = {}, gains = {};
  let bus = null, started = false, cur = 'vila';

  // grava os temas aos poucos depois que a página abre (um pedaço por vez)
  const queue = [['vila', MUSICA.vila()], ['caverna', MUSICA.caverna()]];
  const later = window.requestIdleCallback ? f => requestIdleCallback(f, { timeout: 200 }) : f => setTimeout(f, 8);
  (function work(dl) {
    const t0 = performance.now(), budget = dl && dl.timeRemaining ? Math.max(3, Math.min(10, dl.timeRemaining())) : 6;
    while (queue.length && performance.now() - t0 < budget) { const r = queue[0][1].next(); if (r.done) { data[queue[0][0]] = r.value; queue.shift(); } }
    if (queue.length) later(work);
  })();

  function where() {
    try { if (typeof pl === 'undefined' || !pl || !surf) return 'vila'; return zoneAt(Math.floor((pl.x + 4) / T), Math.floor((pl.y + 10) / T)) === 0 ? 'vila' : 'caverna'; } catch (e) { return 'vila'; }
  }
  function start() {
    bus = ac.createGain(); bus.gain.value = musicOn ? VOL * musVol : 0; bus.connect(master);
    cur = where();
    for (const k of ['vila', 'caverna']) {
      const d = data[k], b = ac.createBuffer(2, d.L.length, d.sr); b.copyToChannel(d.L, 0); b.copyToChannel(d.R, 1);
      const s = ac.createBufferSource(); s.buffer = b; s.loop = true;
      const g = ac.createGain(); g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(k === cur ? 1 : 0, ac.currentTime + 3);
      s.connect(g); g.connect(bus); s.start(ac.currentTime + 0.05); gains[k] = g;
    }
    started = true;
  }
  setInterval(() => {
    if (!ac || !data.vila || !data.caverna) return;
    if (!started) { start(); return; }
    const w = where();
    if (w !== cur) {
      cur = w; const now = ac.currentTime;
      for (const k in gains) { const g = gains[k].gain; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.setTargetAtTime(k === cur ? 1 : 0, now, FADE); }
    }
  }, 300);

  // volume da música (slider da tela de opções)
  window.setMusicVol = v => { musVol = v; if (bus) { const now = ac.currentTime; bus.gain.cancelScheduledValues(now); bus.gain.setValueAtTime(bus.gain.value, now); bus.gain.linearRampToValueAtTime(musicOn ? VOL * musVol : 0, now + 0.08); } };
  window.isMusicOn = () => musicOn;

  // botão "Música" no menu, logo abaixo de "Som"
  const btn = document.createElement('button'); btn.id = 'btnMusic'; btn.className = 'ghost'; btn.type = 'button';
  $('btnSound').after(btn);
  function label() { btn.textContent = musicOn ? 'Música: ligada' : 'Música: desligada'; }
  label();
  btn.addEventListener('click', () => {
    initAudio(); musicOn = !musicOn; label();
    try { localStorage.setItem('sob-a-terra-musica', musicOn ? '1' : '0'); } catch (e) { }
    if (bus) { const now = ac.currentTime; bus.gain.cancelScheduledValues(now); bus.gain.setValueAtTime(bus.gain.value, now); bus.gain.linearRampToValueAtTime(musicOn ? VOL * musVol : 0, now + 0.6); }
  });
})();
