'use strict';

/* ================= the hero's jump and landing sounds (foley) =================
   Before this, the jump was a square-wave blip and the landing a short burst of noise.
   Now both are built like recorded foley, sample by sample, from the physical events a mic would catch:
     jump    - the soles scuffing and pushing off (grit on dirt, a dry scrape on stone, a knock on wood),
               a quick exhale, the tunic and cloak swelling with the motion, buckles and mail shaking
     landing - heel then the second foot hitting the floor (weight thud + crunch of dirt or the click of stone),
               cloth slapping down, the gear rattling and settling; harder falls hit deeper, louder,
               and draw a short breath out
   Takes are rendered in idle time and each one is replaced after it plays, so no two jumps sound alike.
   The floor under the feet picks the surface: terra (dirt, grass, clay, moss), cascalho (gravel, rubble),
   madeira (planks), metal (grates) or pedra (everything else). Underground a short stone-room echo is added.
   Plays through sfxOut, so the effects volume and the mute apply. The same file runs in Node
   (module.exports = FOLEY, FOLEY.render('jump'|'land', opts, sr)) to render .wav previews. */

const FOLEY = (() => {
  // ---------- small dsp toolkit ----------
  let seed = 1;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const rr = (a, b) => a + (b - a) * rnd();
  const nz = () => rnd() * 2 - 1;
  // RBJ biquad, run in place over a buffer
  function biquad(buf, type, f, q, sr) {
    const w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * q);
    let b0, b1, b2; const a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
    else { b0 = al; b1 = 0; b2 = -al; }   // band-pass, 0 dB peak
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < buf.length; i++) {
      const x = buf[i], y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x; y2 = y1; y1 = y; buf[i] = y;
    }
    return buf;
  }
  // smoothed random wobble (0..1), used to make friction noise grainy and uneven like a real scrape
  function wobble(n, rate, sr) {
    const out = new Float32Array(n); let v = rnd(), tgt = rnd(), k = rate / sr;
    for (let i = 0; i < n; i++) { if (rnd() < k) tgt = rnd(); v += (tgt - v) * 0.02; out[i] = v; }
    return out;
  }
  function mixInto(dst, src, at, g = 1) { for (let i = 0; i < src.length; i++) { const j = at + i; if (j >= 0 && j < dst.length) dst[j] += src[i] * g; } }

  // ---------- the layers ----------
  // weight hitting the floor: low noise impulse plus the short boom of the body, pitch sinking
  function thud(sr, amp, cut, boomHz) {
    const n = Math.round(sr * 0.16), b = new Float32Array(n), tau = sr * rr(0.018, 0.03);
    for (let i = 0; i < n; i++) b[i] = nz() * Math.min(1, i / (sr * 0.0015)) * Math.exp(-i / tau);
    biquad(b, 'lp', cut, 0.7, sr); biquad(b, 'lp', cut * 1.2, 0.6, sr);
    let ph = 0; const tb = sr * rr(0.03, 0.05);
    for (let i = 0; i < n; i++) { const f = boomHz * (1 + 0.6 * Math.exp(-i / (sr * 0.012))); ph += 2 * Math.PI * f / sr; b[i] = b[i] * 3.2 + Math.sin(ph) * 0.55 * Math.min(1, i / (sr * 0.002)) * Math.exp(-i / tb); }
    for (let i = 0; i < n; i++) b[i] *= amp;
    return b;
  }
  // grit: many tiny grains of dirt or gravel, few loud and many soft (as a real crunch)
  function grit(sr, dur, perSec, lo, hi, amp) {
    const n = Math.round(sr * (dur + 0.01)), b = new Float32Array(n), cnt = Math.max(1, Math.round(perSec * dur));
    for (let g = 0; g < cnt; g++) {
      const at = Math.floor(Math.pow(rnd(), 1.6) * dur * sr), len = Math.round(sr * rr(0.0006, 0.0035)), a = Math.pow(rnd(), 2.5) * (rnd() < 0.5 ? -1 : 1);
      for (let i = 0; i < len && at + i < n; i++) b[at + i] += nz() * a * Math.exp(-i / (len * 0.3));
    }
    biquad(b, 'hp', lo, 0.7, sr); biquad(b, 'lp', hi, 0.7, sr);
    for (let i = 0; i < n; i++) b[i] *= amp * 0.9;
    return b;
  }
  // sole scraping the floor: band-limited friction noise, roughened by a fast wobble
  function scuff(sr, dur, f, q, amp, rough = 260) {
    const n = Math.round(sr * dur), b = new Float32Array(n), w = wobble(n, rough, sr);
    for (let i = 0; i < n; i++) { const t = i / n, env = Math.min(1, t * 9) * Math.pow(1 - t, 1.8); b[i] = nz() * env * (0.25 + 0.75 * w[i] * w[i]); }
    biquad(b, 'bp', f, q, sr); biquad(b, 'hp', 300, 0.7, sr);
    for (let i = 0; i < n; i++) b[i] *= amp * 1.4;
    return b;
  }
  // fabric: dense crackle of fibres rubbing (micro impulses) over a soft swish of air, shaped by the motion
  function cloth(sr, dur, rise, amp, swish = 0.5) {
    const n = Math.round(sr * dur), cr = new Float32Array(n), sw = new Float32Array(n), env = new Float32Array(n);
    const ri = Math.max(1, rise * n), dens = rr(900, 1600);
    for (let i = 0; i < n; i++) env[i] = i < ri ? Math.pow(i / ri, 1.5) : Math.pow(1 - (i - ri) / (n - ri), 2.2);
    const w = wobble(n, 40, sr);
    for (let i = 0; i < n; i++) {
      if (rnd() < dens / sr * (0.3 + env[i] * 1.4)) { const a = Math.pow(rnd(), 1.8) * (rnd() < 0.5 ? -1 : 1), len = Math.round(sr * rr(0.0003, 0.0018)); for (let k = 0; k < len && i + k < n; k++) cr[i + k] += a * nz() * Math.exp(-k / (len * 0.35)); }
      sw[i] = nz();
    }
    biquad(cr, 'hp', 1100, 0.7, sr); biquad(cr, 'lp', 7000, 0.7, sr);
    biquad(sw, 'bp', rr(700, 1100), 0.6, sr); biquad(sw, 'lp', 2600, 0.7, sr);
    for (let i = 0; i < n; i++) cr[i] = (cr[i] * 0.6 + sw[i] * swish * 0.8) * env[i] * (0.55 + 0.45 * w[i]) * amp;
    return cr;
  }
  // buckles, rings of mail and the sword in its scabbard: short inharmonic metal ticks
  function gear(sr, dur, count, amp) {
    const n = Math.round(sr * (dur + 0.04)), b = new Float32Array(n);
    for (let g = 0; g < count; g++) {
      const at = Math.floor(Math.pow(rnd(), 1.3) * dur * sr), a = amp * 0.4 * Math.pow(rr(0.2, 1), 1.5), dec = sr * rr(0.003, 0.012);
      const len = Math.min(n - at, Math.round(dec * 5));
      // a ring knocking another: a few unrelated high partials that die almost at once, inside a scratch of noise
      for (let p = 0; p < 5; p++) { const f = rr(2200, 9500), ph0 = rnd() * 6.28, pa = rr(0.2, 1), d = dec * rr(0.5, 1.2); for (let i = 0; i < len; i++) b[at + i] += Math.sin(ph0 + 2 * Math.PI * f * i / sr) * pa * a * 0.5 * Math.exp(-i / d); }
      for (let i = 0; i < len; i++) b[at + i] += nz() * a * 0.6 * Math.exp(-i / (dec * 0.4));
    }
    biquad(b, 'hp', 1800, 0.7, sr);
    return b;
  }
  // leather of the boots and belt flexing: a few fast creaks through a body resonance
  function creak(sr, dur, amp) {
    const n = Math.round(sr * dur), b = new Float32Array(n); let next = 0, rate = rr(55, 110);
    for (let i = 0; i < n; i++) if (i >= next) { b[i] += (rnd() < 0.5 ? -1 : 1) * rr(0.4, 1) * Math.sin(Math.PI * i / n); next = i + Math.round(sr / (rate * rr(0.8, 1.25))); rate *= rr(0.98, 1.04); }
    biquad(b, 'bp', rr(900, 1500), 3, sr); biquad(b, 'bp', rr(2200, 3200), 1.5, sr);
    for (let i = 0; i < n; i++) b[i] *= amp * 9;
    return b;
  }
  // a short breath pushed out through the nose and mouth (unvoiced: no cartoon grunt)
  function breath(sr, dur, amp, hard) {
    const n = Math.round(sr * dur), a = new Float32Array(n), m = new Float32Array(n), w = wobble(n, 30, sr);
    for (let i = 0; i < n; i++) a[i] = m[i] = nz();
    biquad(a, 'bp', hard ? rr(650, 800) : rr(480, 620), 4, sr); biquad(m, 'bp', rr(1300, 1700), 3, sr);
    const out = new Float32Array(n), at = 0.06 * n;
    for (let i = 0; i < n; i++) { const env = i < at ? i / at : Math.pow(1 - (i - at) / (n - at), 1.6); out[i] = (a[i] * 1.6 + m[i] * 1.1) * env * (0.7 + 0.3 * w[i]) * amp; }
    biquad(out, 'hp', 250, 0.7, sr); biquad(out, 'lp', 4200, 0.7, sr);
    return out;
  }
  // knock of a board under the foot: two damped modes of the plank
  function knock(sr, amp) {
    const n = Math.round(sr * 0.12), b = new Float32Array(n), m = [[rr(150, 190), 0.05, 1], [rr(330, 420), 0.03, 0.6], [rr(700, 900), 0.012, 0.3]];
    for (const [f, d, g] of m) for (let i = 0; i < n; i++) b[i] += Math.sin(2 * Math.PI * f * i / sr) * g * Math.exp(-i / (sr * d));
    for (let i = 0; i < n; i++) b[i] *= amp * 0.6;
    return b;
  }
  // heel on hard stone: a sharp dry tick
  function tick(sr, amp, f) {
    const n = Math.round(sr * 0.03), b = new Float32Array(n);
    for (let i = 0; i < n; i++) b[i] = nz() * Math.exp(-i / (sr * 0.0025));
    biquad(b, 'bp', f, 1.4, sr);
    for (let i = 0; i < n; i++) b[i] *= amp * 3;
    return b;
  }

  // ---------- surfaces ----------
  const SURF = {
    terra:   { grit: [1400, 600, 6500, 0.55], scuff: [1300, 0.7], cut: 240, boom: 85, tick: 0, knock: 0 },
    cascalho:{ grit: [2400, 900, 8000, 0.5], scuff: [1700, 0.6], cut: 260, boom: 90, tick: 0.25, knock: 0 },
    pedra:   { grit: [420, 1800, 9000, 0.3], scuff: [2600, 0.9], cut: 300, boom: 95, tick: 0.55, knock: 0 },
    madeira: { grit: [200, 1500, 7000, 0.15], scuff: [1500, 0.8], cut: 280, boom: 110, tick: 0.12, knock: 0.6 },
    metal:   { grit: [300, 2000, 9000, 0.2], scuff: [2400, 0.9], cut: 320, boom: 100, tick: 0.35, knock: 0, ring: 1 }
  };

  // ---------- the two sounds ----------
  function render(kind, o = {}, sr = 44100) {
    seed = (o.seed != null ? o.seed : (Math.random() * 4294967295)) >>> 0;
    const s = SURF[o.surf] || SURF.terra, mail = o.mail != null ? o.mail : 0.5;
    const dur = kind === 'jump' ? 0.42 : 0.5, out = new Float32Array(Math.round(sr * dur)), at = t => Math.round(t * sr);
    if (kind === 'jump') {
      // both soles drive into the floor and scrape as the body leaves it
      mixInto(out, thud(sr, 0.22, s.cut * 0.8, s.boom * 1.1), 0);
      mixInto(out, scuff(sr, rr(0.06, 0.09), s.scuff[0] * rr(0.9, 1.15), s.scuff[1], 0.34), at(0.002));
      mixInto(out, grit(sr, rr(0.04, 0.07), s.grit[0], s.grit[1], s.grit[2], s.grit[3] * 0.8), at(0.006));
      if (s.tick) mixInto(out, tick(sr, s.tick * 0.35, rr(2600, 3600)), at(0.004));
      if (s.knock) mixInto(out, knock(sr, s.knock * 0.4), 0);
      if (s.ring) mixInto(out, gear(sr, 0.01, 2, 0.12), 0);
      mixInto(out, creak(sr, rr(0.035, 0.05), 0.09), at(rr(0, 0.01)));
      mixInto(out, breath(sr, rr(0.12, 0.16), 0.05, false), at(rr(0.01, 0.025)));
      // tunic and cloak swell as he rises
      mixInto(out, cloth(sr, rr(0.26, 0.34), rr(0.2, 0.32), 0.3, 0.6), at(0.012));
      mixInto(out, gear(sr, rr(0.1, 0.16), 2 + Math.round(mail * 5 * rr(0.6, 1.2)), 0.05 + mail * 0.06), at(0.02));
    } else {
      const k = Math.max(0.25, Math.min(1.2, o.k != null ? o.k : 0.65));   // impact strength (from the fall speed)
      const gap = rr(0.022, 0.05) * (1.15 - k * 0.35);                        // heel, then the second foot
      for (let f = 0; f < 2; f++) {
        const t0 = f ? gap : 0, a = f ? rr(0.6, 0.85) : 1;
        mixInto(out, thud(sr, 0.42 * k * a, s.cut * (0.85 + k * 0.25), s.boom * (1.05 - k * 0.15)), at(t0));
        mixInto(out, grit(sr, rr(0.05, 0.09) * (0.7 + k * 0.4), s.grit[0] * (0.7 + k * 0.5), s.grit[1], s.grit[2], s.grit[3] * k * a), at(t0 + 0.002));
        mixInto(out, scuff(sr, rr(0.03, 0.05), s.scuff[0] * rr(0.85, 1.1), s.scuff[1], 0.16 * k * a, 380), at(t0 + 0.004));
        if (s.tick) mixInto(out, tick(sr, s.tick * 0.5 * k * a, rr(2400, 3800)), at(t0));
        if (s.knock) mixInto(out, knock(sr, s.knock * 0.7 * k * a), at(t0));
        if (s.ring) mixInto(out, gear(sr, 0.02, 3, 0.18 * k * a), at(t0));
      }
      // the clothes slap down and the gear rattles and settles
      mixInto(out, cloth(sr, rr(0.16, 0.24) * (0.8 + k * 0.4), 0.06, 0.32 * Math.min(1, 0.5 + k * 0.6), 0.45), at(0.004));
      mixInto(out, gear(sr, rr(0.12, 0.2) * (0.7 + k * 0.5), 3 + Math.round(mail * 8 * k * rr(0.7, 1.2)), (0.05 + mail * 0.08) * Math.min(1, 0.4 + k * 0.7)), at(0.006));
      mixInto(out, creak(sr, rr(0.04, 0.07), 0.08 * k), at(gap + rr(0.005, 0.02)));
      // a hard fall pushes the air out of him
      if (k > 0.75) mixInto(out, breath(sr, rr(0.14, 0.2), 0.13 * (k - 0.5), true), at(gap + rr(0.01, 0.03)));
    }
    // soft and muffled, so it sits under the game instead of calling attention: little above ~4-5 kHz
    biquad(out, 'lp', o.surf === 'pedra' || o.surf === 'metal' ? 5200 : 4200, 0.6, sr);
    // even loudness from one take to the next (a jump stays soft, a landing grows with the fall), then a gentle limiter
    const kk = kind === 'jump' ? 1 : Math.max(0.25, Math.min(1.2, o.k != null ? o.k : 0.65));
    let e = 0; for (let i = 0; i < out.length; i++) e += out[i] * out[i];
    const g = (kind === 'jump' ? 0.018 : 0.014 + 0.03 * kk) / Math.max(1e-6, Math.sqrt(e / out.length));
    for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * g * 1.4) / 1.4;
    // fade the tail so nothing clicks off
    const fo = Math.round(sr * 0.03); for (let i = 0; i < fo; i++) out[out.length - 1 - i] *= i / fo;
    return out;
  }
  return { render, SURF };
})();
if (typeof module !== 'undefined') module.exports = FOLEY;

if (typeof window !== 'undefined') {
  // what the hero stands on, read from the tile under his feet (ids from 03, 41 and 52; missing ones are skipped)
  const has = v => typeof v === 'number' ? v : -1;
  const SURF_OF = new Map();
  [DIRT, GRASS, has(typeof CV_TERRA !== 'undefined' && CV_TERRA), has(typeof CV_ARGILA !== 'undefined' && CV_ARGILA), has(typeof CV_MUSGO !== 'undefined' && CV_MUSGO), has(typeof CT_CALC_TERRA !== 'undefined' && CT_CALC_TERRA)].forEach(t => SURF_OF.set(t, 'terra'));
  [has(typeof CV_CASCALHO !== 'undefined' && CV_CASCALHO), has(typeof CT_ESCOMBRO !== 'undefined' && CT_ESCOMBRO), has(typeof CT_RUINA !== 'undefined' && CT_RUINA)].forEach(t => SURF_OF.set(t, 'cascalho'));
  [PLANK, TRUNK].forEach(t => SURF_OF.set(t, 'madeira'));
  SURF_OF.set(has(typeof CT_GRADE !== 'undefined' && CT_GRADE), 'metal'); SURF_OF.delete(-1);
  const footSurface = () => {
    const x0 = Math.floor((pl.x + 1) / T), x1 = Math.floor((pl.x + pl.w - 1) / T), ty = Math.floor((pl.y + pl.h + 1) / T);
    let t = tileAt(Math.floor((pl.x + pl.w / 2) / T), ty); if (!SOLID[t]) t = SOLID[tileAt(x0, ty)] ? tileAt(x0, ty) : tileAt(x1, ty);
    return SURF_OF.get(t) || (SOLID[t] ? 'pedra' : 'terra');
  };
  // how much metal he wears: mail or plate on the body rattles more
  const mailAmount = () => { const id = eqId('body') || ''; return /cota|placas|peitoral/.test(id) ? 1 : 0.45; };
  const underground = () => typeof CV_S0 !== 'undefined' ? pl.y / T > CV_S0 + 4 : false;

  // a short stone-room echo for the caves and the cathedral (an impulse response of decaying noise)
  let foleyVerb = null, foleyWet = null;
  function foleyBus() {
    if (foleyVerb || !ac) return;
    const sr = ac.sampleRate, n = Math.round(sr * 0.9), ir = ac.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3) * Math.exp(-i / (sr * 0.16)); }
    foleyVerb = ac.createConvolver(); foleyVerb.buffer = ir;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    foleyWet = ac.createGain(); foleyWet.gain.value = 0;
    foleyWet.connect(lp); lp.connect(foleyVerb); foleyVerb.connect(sfxOut);
  }
  // a take costs ~10 ms to render, too much inside a frame: keep a few takes of each sound ready,
  // rendered in idle time, and replace each one after it is used
  const FSR = 44100, LAND_K = [0.4, 0.7, 1.0], POOL = 3, pool = new Map(), todo = [];
  const keyOf = (kind, surf, mail, ki) => kind + ':' + surf + ':' + mail + ':' + ki;
  function want(kind, surf, mail, ki) { todo.push([kind, surf, mail, ki]); pump(); }
  let pumping = false;
  function pump() {
    if (pumping || !todo.length) return; pumping = true;
    const idle = window.requestIdleCallback || (f => setTimeout(f, 30));
    idle(() => {
      pumping = false; const [kind, surf, mail, ki] = todo.shift(), key = keyOf(kind, surf, mail, ki);
      const list = pool.get(key) || []; pool.set(key, list);
      if (list.length < POOL) list.push(FOLEY.render(kind, { surf, mail, k: LAND_K[ki] }, FSR));
      pump();
    });
  }
  function take(kind, surf, mail, ki) {
    const list = pool.get(keyOf(kind, surf, mail, ki));
    want(kind, surf, mail, ki);
    return list && list.length ? list.shift() : FOLEY.render(kind, { surf, mail, k: LAND_K[ki] }, FSR);   // cold: render now
  }
  // warm the floors he is most likely to stand on first
  for (const surf of ['terra', 'pedra', 'cascalho', 'madeira'])
    for (let i = 0; i < POOL; i++) { want('jump', surf, 0.45, 0); for (let ki = 0; ki < 3; ki++) want('land', surf, 0.45, ki); }

  function playFoley(kind, surf, mail, k, vol) {
    if (!ac || muted || !sfxOut) return;
    foleyBus();
    const ki = kind === 'jump' ? 0 : k < 0.55 ? 0 : k < 0.85 ? 1 : 2;
    const data = take(kind, surf, mail, ki), buf = ac.createBuffer(1, data.length, FSR);
    buf.getChannelData(0).set(data);
    const src = ac.createBufferSource(), g = ac.createGain();
    // in-between fall speeds: the nearest take, scaled toward the real impact
    src.buffer = buf; src.playbackRate.value = 0.96 + Math.random() * 0.08; g.gain.value = vol * (kind === 'jump' ? 1 : clamp(k / LAND_K[ki], 0.75, 1.25));
    src.connect(g); g.connect(sfxOut);
    if (foleyWet) { foleyWet.gain.value = underground() ? 0.16 : 0.03; g.connect(foleyWet); }
    src.start();
  }

  sfx.jump = function () { playFoley('jump', footSurface(), mailAmount(), 0, 0.75); };
  // the old call in 11-jogador only fires on hard landings and carries no speed: the hook below plays every landing
  sfx.land = function () { };

  // every landing, scaled by the speed he hit the floor with (small steps down stay silent)
  let footAir = false, footVy = 0;
  const _updatePlayerFoley = updatePlayer;
  updatePlayer = function (dt) {
    const wasAir = footAir, vy = footVy;
    _updatePlayerFoley(dt);
    if (wasAir && pl.onGround && !pl.dead && vy > 110) {
      const k = Math.min(1.15, 0.28 + (vy - 110) / 420);
      playFoley('land', footSurface(), mailAmount(), k, 0.8);
    }
    footAir = !pl.onGround && !pl.climb; if (footAir) footVy = pl.vy;
  };
}
