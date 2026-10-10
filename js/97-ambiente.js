'use strict';
/* sons de ambiente (js/97-ambiente.js): no lugar da música, cada cenário tem o seu som de fundo, sem melodia.
   Tudo é sintetizado na hora com Web Audio (o jogo abre por file://, sem arquivos de áudio):
   - um "leito" contínuo de ruídos filtrados que respiram devagar (vento, ar da gruta, o salão vazio, o fogo)
   - eventos soltos sorteados no tempo (pássaros, grilos, gotas, pedrinhas, sussurros, sino, gelo estalando, madeira rangendo...)
   - cada cenário tem o seu eco (reverb gerado)
   Cenários: vila/superfície (dia e noite), cavernas, catedral, gelo, mina e abismo; algumas faixas mudam detalhes (o
   Ninho tem patinhas correndo, as Criptas mais sussurros, as Fornalhas o fogo e o fole, os Rios de Fogo a lava
   borbulhando, as Entranhas um coração batendo, o Trono do Caos sussurros).
   Ao trocar de cenário, um some enquanto o outro aparece (uns 4 s). O som do cenário que saiu é desmontado depois.
   Volume: passa pelo volume geral (Som desliga tudo); "Ambiente" liga e desliga e o slider "Volume do ambiente"
   (tela de opções, 40-opcoes) usa `musVol` do 09-audio, salvo em 'sob-a-terra-vol-musica'.
   AMBI.create(ctx, destino, nome) também funciona num OfflineAudioContext, para gravar prévias. */
const AMBI = (function () {
  const bufs = new WeakMap();
  // ruídos branco, rosa e marrom de 6 s, estéreo (canais diferentes), com a emenda do loop disfarçada
  function noiseBufs(A) {
    let b = bufs.get(A); if (b) return b;
    const sr = A.sampleRate, n = sr * 6, x = Math.floor(sr * 0.05);
    const mk = kind => {
      const B = A.createBuffer(2, n, sr);
      for (let c = 0; c < 2; c++) {
        const d = B.getChannelData(c); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, br = 0;
        for (let i = 0; i < n; i++) {
          const w = Math.random() * 2 - 1;
          if (kind === 'white') d[i] = w * 0.5;
          else if (kind === 'pink') { b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
          else { br = (br + 0.02 * w) / 1.02; d[i] = br * 3.5; }
        }
        for (let i = 0; i < x; i++) { const k = i / x; d[i] = d[i] * k + d[n - x + i] * (1 - k); }
      }
      return B;
    };
    b = { white: mk('white'), pink: mk('pink'), brown: mk('brown'), loopEnd: (n - x) / sr };
    bufs.set(A, b); return b;
  }
  // eco: ruído que decai, um pouco mais abafado no fim
  function impulse(A, sec, damp) {
    const sr = A.sampleRate, n = Math.floor(sr * sec), B = A.createBuffer(2, n, sr), pre = Math.floor(sr * 0.012);
    for (let c = 0; c < 2; c++) {
      const d = B.getChannelData(c); let lp = 0;
      for (let i = pre; i < n; i++) { const t = (i - pre) / (n - pre), w = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4); lp += (w - lp) * (1 - damp * Math.min(1, t * 1.5)); d[i] = lp; }
    }
    return B;
  }

  /* ---------- peças de som (todas recebem o tempo exato em que tocam) ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  // uma "voz": entra aqui, passa por abafador (distância) e panorâmica, vai para o seco e para o eco
  function voice(A, o, pan, wet, dist) {
    const g = A.createGain(); let n = g;
    if (dist) { const f = A.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = dist; n.connect(f); n = f; }
    if (A.createStereoPanner) { const p = A.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); n.connect(p); n = p; }
    n.connect(o.dry); if (wet) { const s = A.createGain(); s.gain.value = wet; n.connect(s); s.connect(o.wet); }
    return g;
  }
  function osc(A, dst, t, type, f0, f1, dur, vol, att = 0.004) {
    const o = A.createOscillator(), g = A.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dst); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function nz(A, dst, t, dur, vol, ftype, f, q, att = 0.002, kind = 'white', f1) {
    const s = A.createBufferSource(), fl = A.createBiquadFilter(), g = A.createGain(), nb = noiseBufs(A);
    s.buffer = nb[kind]; s.loop = true; s.loopEnd = nb.loopEnd;
    fl.type = ftype; fl.frequency.setValueAtTime(f, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.Q.value = q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dst); s.start(t, rnd(0, 5)); s.stop(t + dur + 0.05);
  }
  // sons prontos
  const S = {
    bird(A, o, t) {   // passarinho: 2 a 6 assobios rápidos
      const v = voice(A, o, rnd(-0.9, 0.9), 0.15, 7000), f = rnd(2600, 4200), n = 2 + Math.floor(rnd(0, 5)), sp = rnd(0.07, 0.16), kind = Math.random() < 0.5;
      for (let i = 0; i < n; i++) { const a = f * rnd(0.9, 1.15); osc(A, v, t + i * sp, 'sine', kind ? a : a * 1.3, kind ? a * 1.35 : a * 0.85, rnd(0.05, 0.11), rnd(0.035, 0.06), 0.008); }
    },
    trill(A, o, t) {   // outro passarinho: um trinado
      const v = voice(A, o, rnd(-0.9, 0.9), 0.15, 7000), f = rnd(3000, 5000), n = 8 + Math.floor(rnd(0, 10));
      for (let i = 0; i < n; i++) osc(A, v, t + i * 0.045, 'sine', f, f * 0.92, 0.035, 0.022 * (1 - i / n * 0.5), 0.004);
    },
    crow(A, o, t) {   // corvo longe
      const v = voice(A, o, rnd(-1, 1), 0.3, 2200), n = 1 + Math.floor(rnd(0, 3));
      for (let i = 0; i < n; i++) { const tt = t + i * rnd(0.45, 0.6), f = rnd(480, 600), b = A.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 1300; b.Q.value = 2; b.connect(v); osc(A, b, tt, 'sawtooth', f, f * 0.8, 0.32, 0.09, 0.03); }
    },
    crickets(A, o, t) {   // grilos: grupos de pulsos agudos
      const v = voice(A, o, rnd(-1, 1), 0.1, 0), f = rnd(4300, 5200), g = 3 + Math.floor(rnd(0, 6));
      for (let k = 0; k < g; k++) for (let i = 0; i < 3; i++) osc(A, v, t + k * 0.32 + i * 0.03, 'sine', f, f, 0.022, 0.018, 0.003);
    },
    owl(A, o, t) {   // coruja: hu... hu-hu
      const v = voice(A, o, rnd(-1, 1), 0.35, 1500), f = rnd(330, 390);
      [[0, 0.45], [0.75, 0.18], [0.98, 0.5]].forEach(([d, l]) => osc(A, v, t + d, 'sine', f * 1.04, f * 0.94, l, 0.06, 0.08));
    },
    anvil(A, o, t) {   // o martelo do ferreiro, ao longe
      const v = voice(A, o, rnd(-0.6, 0.6), 0.35, 3200), n = 3 + Math.floor(rnd(0, 4));
      for (let i = 0; i < n; i++) { const tt = t + i * rnd(0.5, 0.7); osc(A, v, tt, 'triangle', 1900, 1850, 0.35, 0.03); osc(A, v, tt, 'sine', 2950, 2900, 0.2, 0.015); nz(A, v, tt, 0.04, 0.05, 'bandpass', 2400, 1); }
    },
    drip(A, o, t, far) {   // gota que cai na poça
      const v = voice(A, o, rnd(-0.9, 0.9), far ? 0.9 : 0.6, far ? 4000 : 0), f = rnd(900, 2200);
      osc(A, v, t, 'sine', f, f * 0.55, rnd(0.05, 0.09), far ? 0.05 : 0.08, 0.002);
      if (Math.random() < 0.4) osc(A, v, t + rnd(0.25, 0.6), 'sine', f * 1.1, f * 0.6, 0.06, 0.04, 0.002);
    },
    pebbles(A, o, t) {   // pedrinhas rolando
      const v = voice(A, o, rnd(-0.9, 0.9), 0.5, 5000), n = 3 + Math.floor(rnd(0, 7)); let tt = t;
      for (let i = 0; i < n; i++) { nz(A, v, tt, rnd(0.02, 0.05), rnd(0.05, 0.12) * (1 - i / n * 0.6), 'bandpass', rnd(1500, 3500), 3); tt += rnd(0.05, 0.22) * (1 + i * 0.15); }
    },
    groan(A, o, t) {   // a rocha geme lá no fundo
      const v = voice(A, o, rnd(-0.5, 0.5), 0.6, 300), f = rnd(38, 60), d = rnd(2.5, 4);
      osc(A, v, t, 'sawtooth', f, f * rnd(0.7, 0.9), d, 0.08, d * 0.4); nz(A, v, t, d, 0.12, 'lowpass', 140, 1, d * 0.4, 'brown');
    },
    skitter(A, o, t) {   // muitas patinhas correndo (o Ninho)
      const n = 14 + Math.floor(rnd(0, 26)), p0 = rnd(-1, 1), p1 = rnd(-1, 1);
      for (let i = 0; i < n; i++) { const k = i / n, v = voice(A, o, p0 + (p1 - p0) * k, 0.4, 6000); nz(A, v, t + i * rnd(0.022, 0.045), 0.012, 0.05 * Math.sin(Math.PI * k) + 0.01, 'highpass', 3500, 1); }
    },
    whisper(A, o, t, near) {   // sussurro sem palavras, perdido no salão
      const v = voice(A, o, rnd(-1, 1), 1, 0), syl = 3 + Math.floor(rnd(0, 5)); let tt = t;
      for (let i = 0; i < syl; i++) { const d = rnd(0.12, 0.3), f = rnd(900, 2600); nz(A, v, tt, d, near ? 0.05 : 0.03, 'bandpass', f, 6, d * 0.4, 'white', f * rnd(0.8, 1.2)); tt += d + rnd(0.02, 0.12); }
    },
    bell(A, o, t) {   // um sino que ninguém toca, longe
      const v = voice(A, o, rnd(-0.4, 0.4), 0.8, 2500), f = rnd(105, 140);
      [[0.5, 0.5], [1, 0.8], [1.183, 0.35], [1.506, 0.3], [2, 0.25], [2.514, 0.15], [2.662, 0.12], [3.011, 0.1]].forEach(([r, a], i) => osc(A, v, t, 'sine', f * r, f * r * 0.999, 7 - i * 0.6, 0.035 * a, 0.004));
    },
    chains(A, o, t) {   // correntes balançando
      const v = voice(A, o, rnd(-1, 1), 0.7, 6000), n = 2 + Math.floor(rnd(0, 4));
      for (let i = 0; i < n; i++) { const tt = t + i * rnd(0.08, 0.25), f = rnd(2800, 4200); osc(A, v, tt, 'triangle', f, f, 0.12, 0.025); osc(A, v, tt, 'sine', f * 1.47, f * 1.47, 0.08, 0.015); nz(A, v, tt, 0.03, 0.03, 'highpass', 4000, 1); }
    },
    whistle(A, o, t) {   // vento passando por uma janela quebrada
      const v = voice(A, o, rnd(-1, 1), 0.7, 0), d = rnd(3, 6), f = rnd(650, 1100);
      nz(A, v, t, d, 0.08, 'bandpass', f, 18, d * 0.45, 'pink', f * rnd(0.8, 1.25));
    },
    crack(A, o, t) {   // o gelo estala
      const v = voice(A, o, rnd(-1, 1), 0.7, 0);
      nz(A, v, t, 0.06, 0.18, 'highpass', 1800, 1, 0.001); osc(A, v, t, 'sine', rnd(260, 420), 60, 0.4, 0.06, 0.002);
      if (Math.random() < 0.5) nz(A, v, t + 0.07, 0.5, 0.05, 'bandpass', 900, 2, 0.01, 'white', 300);
    },
    creakIce(A, o, t) {   // o gelo range devagar
      const v = voice(A, o, rnd(-1, 1), 0.6, 1800), d = rnd(0.8, 1.8), b = A.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = rnd(500, 900); b.Q.value = 4; b.connect(v);
      osc(A, b, t, 'sawtooth', rnd(30, 45), rnd(70, 110), d, 0.12, d * 0.3);
    },
    tinkle(A, o, t) {   // cristais de gelo tilintando
      const v = voice(A, o, rnd(-1, 1), 0.6, 0), n = 3 + Math.floor(rnd(0, 5));
      for (let i = 0; i < n; i++) { const f = rnd(3200, 7000); osc(A, v, t + i * rnd(0.06, 0.2), 'sine', f, f, rnd(0.2, 0.5), 0.018, 0.002); }
    },
    creakWood(A, o, t) {   // as escoras da mina rangendo
      const v = voice(A, o, rnd(-1, 1), 0.5, 2500), d = rnd(0.6, 1.5), b = A.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = rnd(700, 1200); b.Q.value = 3; b.connect(v);
      const a = rnd(18, 30); osc(A, b, t, 'sawtooth', a, a * rnd(1.8, 3), d, 0.16, d * 0.35);
    },
    pick(A, o, t) {   // picaretas ao longe (os goblins cavando)
      const v = voice(A, o, rnd(-1, 1), 0.6, 2600), n = 2 + Math.floor(rnd(0, 4)), sp = rnd(0.6, 0.9);
      for (let i = 0; i < n; i++) { const tt = t + i * sp; nz(A, v, tt, 0.06, 0.09, 'bandpass', 2200, 2); osc(A, v, tt, 'triangle', 1500, 1300, 0.08, 0.025); }
    },
    cart(A, o, t) {   // um carrinho guinchando nos trilhos, muito longe
      const v = voice(A, o, rnd(-1, 1), 0.8, 3000), d = rnd(1.2, 2.2), f = rnd(1700, 2300), x = A.createOscillator(), xg = A.createGain();
      x.frequency.value = rnd(5, 8); xg.gain.value = 40; x.connect(xg);
      const s = osc(A, v, t, 'sine', f, f * rnd(0.9, 1.1), d, 0.012, d * 0.4); xg.connect(s.frequency); x.start(t); x.stop(t + d + 0.1);
    },
    pop(A, o, t) {   // estalos do fogo
      const v = voice(A, o, rnd(-0.6, 0.6), 0.2, 0); nz(A, v, t, rnd(0.008, 0.03), rnd(0.04, 0.12), 'bandpass', rnd(1500, 4500), 2, 0.001);
    },
    bellows(A, o, t) {   // o fole da fornalha
      const v = voice(A, o, rnd(-0.5, 0.5), 0.4, 1200); nz(A, v, t, 1.6, 0.12, 'lowpass', 300, 1, 0.7, 'pink', 700);
    },
    bubble(A, o, t) {   // a lava borbulhando: uma bolha grossa que estoura
      const v = voice(A, o, rnd(-0.8, 0.8), 0.4, 900), f = rnd(70, 130);
      osc(A, v, t, 'sine', f, f * 2.2, rnd(0.12, 0.2), 0.12, 0.02); nz(A, v, t + 0.15, 0.08, 0.08, 'lowpass', 600, 1, 0.003, 'brown');
    },
    heart(A, o, t) {   // as paredes de carne batendo como um coração (As Entranhas)
      const v = voice(A, o, rnd(-0.4, 0.4), 0.3, 200), n = 3 + Math.floor(rnd(0, 4)), sp = rnd(0.75, 0.95);
      for (let i = 0; i < n; i++) { const tt = t + i * sp; osc(A, v, tt, 'sine', 55, 38, 0.18, 0.16, 0.01); osc(A, v, tt + 0.22, 'sine', 48, 34, 0.16, 0.11, 0.01); }
    },
    roar(A, o, t) {   // longe, alguma coisa grande ruge
      const v = voice(A, o, rnd(-1, 1), 0.9, 600), d = rnd(1.4, 2.4), f = rnd(48, 70);
      osc(A, v, t, 'sawtooth', f, f * 0.7, d, 0.1, d * 0.3); nz(A, v, t, d, 0.1, 'lowpass', 260, 1, d * 0.3, 'brown', 160);
    }
  };

  /* ---------- os cenários ---------- */
  // leito: [ruído, filtro, freq mín, freq máx, Q, volume mín, volume máx, passo (s), escala(c)]
  // evento: [por segundo, som, quando(c) -> 0..1, extra]
  const day = c => c.night ? 0 : 1, night = c => c.night ? 1 : 0;
  const DEF = {
    vila: {
      rt: 1.6, damp: 0.6, wet: 0.18,
      beds: [['pink', 'lowpass', 320, 650, 0.7, 0.12, 0.3, 2.5, c => c.night ? 0.7 : 1], ['white', 'highpass', 3000, 5000, 0.5, 0.0, 0.05, 1.8, c => c.night ? 0.5 : 1]],
      ev: [[0.35, 'bird', day], [0.12, 'trill', day], [0.03, 'crow', c => c.night ? 0.3 : 1], [0.9, 'crickets', night], [0.03, 'owl', night], [0.04, 'anvil', c => c.vil && !c.night ? 1 : 0]]
    },
    caverna: {
      rt: 2.6, damp: 0.45, wet: 0.35,
      beds: [['brown', 'lowpass', 90, 150, 0.7, 0.35, 0.5, 3], ['pink', 'bandpass', 250, 600, 1.2, 0.04, 0.12, 2.8]],
      ev: [[0.45, 'drip'], [0.18, 'drip', null, true], [0.06, 'pebbles'], [0.03, 'groan'], [0.08, 'skitter', c => c.band === 2 ? 1 : 0], [0.02, 'chains', c => c.band === 3 ? 1 : 0]]
    },
    catedral: {
      rt: 4.5, damp: 0.35, wet: 0.6,
      beds: [['brown', 'lowpass', 70, 110, 0.7, 0.3, 0.42, 4], ['pink', 'bandpass', 180, 320, 0.7, 0.05, 0.1, 3.5]],
      ev: [[0.08, 'whisper', c => c.band >= 2 ? 1.6 : 0.6], [0.015, 'bell'], [0.05, 'chains'], [0.05, 'whistle', c => c.band <= 1 ? 1 : 0.3], [0.12, 'drip', null, true], [0.025, 'pebbles']]
    },
    gelo: {
      rt: 3, damp: 0.25, wet: 0.4,
      beds: [['pink', 'bandpass', 380, 1100, 3.5, 0.08, 0.3, 1.6], ['white', 'bandpass', 1000, 2300, 7, 0.0, 0.06, 1.2], ['brown', 'lowpass', 70, 110, 0.7, 0.25, 0.35, 4]],
      ev: [[0.07, 'crack'], [0.07, 'creakIce'], [0.12, 'tinkle'], [0.12, 'drip', null, true], [0.02, 'groan']]
    },
    mina: {
      rt: 2.2, damp: 0.55, wet: 0.3,
      beds: [['brown', 'lowpass', 90, 140, 0.7, 0.35, 0.48, 3], ['pink', 'bandpass', 280, 450, 1, 0.03, 0.08, 2.5], ['pink', 'bandpass', 500, 900, 0.8, 0.12, 0.25, 0.7, c => c.band === 3 ? 1 : 0]],
      ev: [[0.12, 'creakWood'], [0.07, 'pick', c => c.band === 3 ? 0.4 : 1], [0.06, 'pebbles'], [0.25, 'drip', c => c.band === 3 ? 0.2 : 1], [0.012, 'cart'], [0.02, 'groan'], [7, 'pop', c => c.band === 3 ? 1 : 0], [0.12, 'bellows', c => c.band === 3 ? 1 : 0]]
    },
    abismo: {
      rt: 3.4, damp: 0.5, wet: 0.45,
      beds: [['brown', 'lowpass', 55, 95, 0.7, 0.4, 0.55, 3.5], ['pink', 'lowpass', 300, 600, 0.8, 0.1, 0.24, 0.9], ['pink', 'bandpass', 160, 260, 1.5, 0.04, 0.1, 3, c => c.band === 2 ? 1.5 : 1]],
      ev: [[4, 'pop', c => c.band === 1 ? 1.2 : c.band === 2 ? 0.1 : 0.5], [0.3, 'bubble', c => c.band === 1 ? 1 : 0.15], [0.05, 'chains', c => c.band === 0 || c.band === 3 ? 1 : 0.2], [0.08, 'whisper', c => c.band === 3 ? 1.5 : 0.3], [0.05, 'heart', c => c.band === 2 ? 1 : 0], [0.15, 'drip', c => c.band === 2 ? 1 : 0], [0.025, 'roar'], [0.02, 'groan']]
    }
  };

  // monta um cenário num contexto de áudio e devolve { out, schedule(t0, t1, c), stop(t) }
  function create(A, dest, name) {
    const D = DEF[name], out = A.createGain(), dry = A.createGain(), cv = A.createConvolver(), wet = A.createGain();
    out.gain.value = 0; dry.connect(out); cv.buffer = impulse(A, D.rt, D.damp); wet.gain.value = 1; wet.connect(cv);
    const wg = A.createGain(); wg.gain.value = D.wet * 0.6; cv.connect(wg); wg.connect(out); out.connect(dest);
    const o = { dry, wet }, nb = noiseBufs(A), srcs = [];
    const beds = D.beds.map(b => {
      const s = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain();
      s.buffer = nb[b[0]]; s.loop = true; s.loopEnd = nb.loopEnd; f.type = b[1]; f.frequency.value = (b[2] + b[3]) / 2; f.Q.value = b[4]; g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(dry); const sw = A.createGain(); sw.gain.value = 0.25; g.connect(sw); sw.connect(wet);
      s.start(A.currentTime, rnd(0, 5)); srcs.push(s);
      return { b, f, g, next: 0 };
    });
    const evs = D.ev.map(e => ({ e, next: -1 }));
    function schedule(t0, t1, c) {
      for (const B of beds) {
        const b = B.b, sc = b[8] ? b[8](c) : 1;
        while (B.next < t1) {
          const t = Math.max(t0, B.next), k = b[7];
          B.f.frequency.setTargetAtTime(rnd(b[2], b[3]), t, k * 0.6);
          B.g.gain.setTargetAtTime(rnd(b[5], b[6]) * sc, t, k * 0.6);
          B.next = t + k * rnd(0.7, 1.3);
        }
      }
      for (const E of evs) {
        const [rate, snd, when, extra] = E.e;
        if (E.next < 0) E.next = t0 + rnd(0.3, 2) + Math.random() / rate;
        while (E.next < t1) {
          const f = when ? when(c) : 1;
          if (E.next >= t0 && f > 0 && Math.random() < Math.min(1, f)) S[snd](A, o, E.next, extra);
          if (f > 1 && E.next >= t0 && Math.random() < f - 1) S[snd](A, o, E.next + rnd(0.2, 1.5), extra);
          E.next += -Math.log(1 - Math.random()) / rate;
        }
      }
    }
    function stop(t) { for (const s of srcs) { try { s.stop(t); } catch (e) { } } setTimeout(() => { try { out.disconnect(); } catch (e) { } }, Math.max(0, (t - A.currentTime) * 1000) + 200); }
    return { out, schedule, stop };
  }
  return { create, names: Object.keys(DEF) };
})();

if (typeof document !== 'undefined') (function () {
  const VOL = 0.9, FADE = 1.3;   // FADE: constante de tempo da troca (s); uns 4 s até completar
  let ambOn = true; try { ambOn = localStorage.getItem('sob-a-terra-ambiente') !== '0'; } catch (e) { }
  let bus = null, cur = null, inst = null, until = 0;

  // onde o herói está: qual cenário e qual faixa dele
  function where() {
    const c = { name: 'vila', band: 0, night: false, vil: true };
    try {
      if (typeof pl === 'undefined' || !pl || !surf) return c;
      const tx = Math.floor((pl.x + 4) / T), ty = Math.floor((pl.y + 10) / T), z = zoneAt(tx, ty);
      c.night = typeof isNight === 'function' && isNight(); c.vil = typeof inVillage === 'function' && inVillage(tx, ty);
      const in4 = (z0, nm) => { if (typeof z0 === 'number' && z >= z0 && z <= z0 + 3) { c.name = nm; c.band = z - z0; return true; } return false; };
      if (z === 0) c.name = 'vila';
      else if (z === 4) { c.name = 'catedral'; c.band = 3; }
      else if (z >= 5 && z <= 8) { c.name = 'catedral'; c.band = z - 5; }
      else if (in4(typeof CV_ZONE0 !== 'undefined' ? CV_ZONE0 : null, 'caverna') || in4(typeof IC_ZONE0 !== 'undefined' ? IC_ZONE0 : null, 'gelo') || in4(typeof MN_ZONE0 !== 'undefined' ? MN_ZONE0 : null, 'mina') || in4(typeof AB_ZONE0 !== 'undefined' ? AB_ZONE0 : null, 'abismo')) { }
      else c.name = 'caverna';   // as cavernas antigas (zonas 1 a 3)
    } catch (e) { }
    return c;
  }
  function target() { return ambOn ? VOL * musVol : 0; }
  function tick() {
    if (!ac || ac.state !== 'running' || !master) return;
    if (!bus) { bus = ac.createGain(); bus.gain.value = target(); bus.connect(master); }
    if (muted || !ambOn) return;   // sem som: nem agenda nada
    const c = where(), now = ac.currentTime;
    if (!inst || c.name !== cur) {
      if (inst) { const old = inst; old.out.gain.cancelScheduledValues(now); old.out.gain.setTargetAtTime(0, now, FADE); old.stop(now + FADE * 6); }
      cur = c.name; inst = AMBI.create(ac, bus, cur); inst.out.gain.setTargetAtTime(1, now, FADE); until = now;
    }
    const t0 = Math.max(until, now + 0.05); inst.schedule(t0, now + 1.2, c); until = now + 1.2;
  }
  setInterval(tick, 300);
  function setBus(k) { if (!bus) return; const now = ac.currentTime; bus.gain.cancelScheduledValues(now); bus.gain.setValueAtTime(bus.gain.value, now); bus.gain.linearRampToValueAtTime(target(), now + k); }
  // a tela de opções (40-opcoes) usa estes três
  window.setMusicVol = v => { musVol = v; setBus(0.08); };
  window.isAmbOn = () => ambOn;
  window.ambNow = () => cur;   // qual cenário está tocando (para testes)
  window.toggleAmb = () => { ambOn = !ambOn; try { localStorage.setItem('sob-a-terra-ambiente', ambOn ? '1' : '0'); } catch (e) { } setBus(0.6); };
})();
