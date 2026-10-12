'use strict';

/* ================= audio ================= */
let ac = null, master = null, noiseBuf = null, muted = false, lastXpSfx = 0, lastCoin = 0;
// volumes separados (0 a 1), escolhidos na tela de opções (40-opcoes): sfxOut fica entre os efeitos e o volume geral
let sfxVol = 1, musVol = 1, sfxOut = null;
try { const a = localStorage.getItem('sob-a-terra-vol-efeitos'), b = localStorage.getItem('sob-a-terra-vol-musica'); if (a !== null) sfxVol = Math.max(0, Math.min(1, +a)); if (b !== null) musVol = Math.max(0, Math.min(1, +b)); } catch (e) { }
function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = muted ? 0 : 0.32; master.connect(ac.destination); sfxOut = ac.createGain(); sfxOut.gain.value = sfxVol; sfxOut.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ac = null; }
}
// voices: a hit that lands on 50 monsters at once asked for 50 copies of the same sound in the same instant. Each
// copy costs nodes on the page's thread and on the audio thread, and together they only sound louder (and clip).
// Now the same voice (same wave, pitch, length and offset) starts at most twice per ~40 ms, and at most 28 voices
// start in that window. One or two monsters sound exactly as before (2026-10-12).
const VOICE = { t: -1, n: 0, k: new Map() };
function voiceOk(key) {
  const now = ac.currentTime;
  if (now - VOICE.t > 0.04) { VOICE.t = now; VOICE.n = 0; VOICE.k.clear(); }
  const c = VOICE.k.get(key) || 0; if (c >= 2 || VOICE.n >= 28) return false;
  VOICE.k.set(key, c + 1); VOICE.n++; return true;
}
function tone(f, dur, type = 'square', vol = 0.15, slide = 0, delay = 0) {
  if (!ac || muted || !voiceOk(type + (f | 0) + ':' + dur + ':' + delay)) return; const t0 = ac.currentTime + delay; const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(sfxOut); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, vol = 0.2, freq = 1000, ftype = 'bandpass', delay = 0, q = 1) {
  if (!ac || muted || !voiceOk(ftype + (freq | 0) + ':' + dur + ':' + delay)) return; const t0 = ac.currentTime + delay; const s = ac.createBufferSource(); s.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = q; const g = ac.createGain();
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(f); f.connect(g); g.connect(sfxOut); s.start(t0); s.stop(t0 + dur + 0.02);
}
const sfx = {
  swing() { noise(0.13, 0.2, 2400, 'bandpass', 0, 0.8); tone(520, 0.09, 'triangle', 0.04, -260); },
  hit(c) { tone(c ? 230 : 150, 0.11, 'square', 0.16, -80); noise(0.08, 0.24, 700, 'lowpass'); },
  block() { tone(140, 0.09, 'triangle', 0.35, -50); noise(0.07, 0.35, 420, 'lowpass'); },
  parry() { tone(1046, 0.28, 'triangle', 0.15); tone(1568, 0.35, 'sine', 0.1, 0, 0.04); noise(0.05, 0.2, 3000, 'highpass'); },
  hurt() { tone(260, 0.2, 'sawtooth', 0.13, -160); },
  jump() { tone(260, 0.08, 'square', 0.04, 180); },
  kill() { tone(330, 0.07, 'square', 0.09, 220); tone(520, 0.12, 'square', 0.07, 300, 0.06); },
  xp() { if (gameTime - lastXpSfx < 0.045) return; lastXpSfx = gameTime; tone(880 + Math.random() * 400, 0.05, 'sine', 0.05); },
  level() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'square', 0.07, 0, i * 0.09)); tone(1318, 0.55, 'triangle', 0.08, 0, 0.36); },
  dig() { noise(0.05, 0.14, 900 + Math.random() * 500, 'bandpass', 0, 1.5); },
  dug() { noise(0.14, 0.24, 500, 'lowpass'); tone(110, 0.08, 'square', 0.05, -30); },
  tink() { tone(1300 + Math.random() * 300, 0.05, 'triangle', 0.05, -260); },
  pswing() { noise(0.08, 0.09, 1500, 'bandpass', 0, 0.8); },
  select() { tone(620, 0.04, 'square', 0.04, 160); },
  place() { noise(0.07, 0.2, 420, 'lowpass'); tone(170, 0.06, 'square', 0.05, -40); },
  roar() { tone(95, 0.7, 'sawtooth', 0.14, -45); noise(0.6, 0.12, 300, 'lowpass'); tone(62, 0.9, 'square', 0.06, -20, 0.1); },
  slam() { noise(0.32, 0.36, 220, 'lowpass'); tone(55, 0.3, 'square', 0.12, -25); },
  growl() { tone(120, 0.32, 'sawtooth', 0.07, -50); },
  bow() { tone(980, 0.07, 'triangle', 0.06, -520); noise(0.05, 0.08, 2600, 'highpass'); },
  draw() { tone(300, 0.35, 'triangle', 0.025, 180); },
  wail() { tone(520, 0.7, 'sine', 0.05, -260); tone(780, 0.6, 'sine', 0.025, -380, 0.05); },
  crackle() { noise(0.3, 0.1, 1800, 'bandpass', 0, 1.2); },
  fire() { noise(0.2, 0.12, 900, 'bandpass', 0, 0.7); tone(300, 0.2, 'sawtooth', 0.05, -150); },
  gate() { [180, 140, 110].forEach((f, i) => tone(f, 0.12, 'square', 0.1, -30, i * 0.07)); noise(0.3, 0.2, 600, 'lowpass'); },
  pot() { noise(0.12, 0.2, 2200, 'highpass'); tone(700, 0.05, 'triangle', 0.05, -300); },
  dodge() { noise(0.12, 0.1, 2600, 'bandpass', 0, 0.6); },
  sizzle() { noise(0.35, 0.14, 3200, 'highpass'); tone(240, 0.2, 'sawtooth', 0.03, -120); },
  map() { noise(0.09, 0.08, 3200, 'highpass'); tone(420, 0.05, 'triangle', 0.03, 120); },
  torch() { noise(0.25, 0.12, 1800, 'highpass'); tone(600, 0.1, 'sine', 0.04, 200); },
  shoot() { tone(420, 0.25, 'sine', 0.09, -240); },
  wind() { tone(170, 0.42, 'sawtooth', 0.035, 140); },
  land() { noise(0.06, 0.1, 300, 'lowpass'); },
  death() { tone(220, 0.5, 'sawtooth', 0.12, -150); tone(160, 0.7, 'square', 0.06, -90, 0.15); },
  potion() { tone(520, 0.12, 'sine', 0.08, 300); tone(880, 0.18, 'sine', 0.06, 240, 0.09); },
  chest() { noise(0.22, 0.14, 420, 'lowpass'); [784, 988, 1318].forEach((f, i) => tone(f, 0.2, 'triangle', 0.07, 0, 0.12 + i * 0.07)); },
  pickup() { if (gameTime - lastXpSfx < 0.05) return; lastXpSfx = gameTime; tone(660, 0.06, 'square', 0.05, 220); },
  rare() { [660, 880, 1175].forEach((f, i) => tone(f, 0.16, 'square', 0.06, 0, i * 0.06)); },
  equip() { noise(0.08, 0.16, 1400, 'bandpass', 0, 2); tone(300, 0.06, 'triangle', 0.08, 120, 0.03); },
  bad() { tone(160, 0.12, 'square', 0.06, -40); },
  trash() { noise(0.15, 0.15, 600, 'lowpass'); },
  coin() { if (gameTime - lastCoin < 0.06) return; lastCoin = gameTime; tone(1320, 0.05, 'square', 0.04); tone(1760, 0.09, 'square', 0.035, 0, 0.05); },
  anvil(v) { tone(1900 + Math.random() * 200, 0.12, 'triangle', 0.05 * v, -300); noise(0.05, 0.1 * v, 3200, 'highpass'); },
  talk() { tone(440, 0.06, 'triangle', 0.05, 80); tone(660, 0.08, 'triangle', 0.04, 0, 0.06); }
};
