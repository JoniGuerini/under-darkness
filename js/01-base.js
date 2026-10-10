'use strict';

/* ================= constants & utils ================= */
const T = 12, WW = 900, WH = 1946, CH = 16, SURF_BASE = 46;   // 1760 -> 1946 (2026-10-10): the hive (layer 9) between the dwarf fortress and the abyss; 1574 -> 1760 (2026-10-10): the dwarf fortress between the petrified forest and the abyss; 1388 -> 1574 (2026-10-10): the petrified forest between the sunken city and the abyss; 1202 -> 1388 (2026-10-10): the sunken city between the fungal mines and the abyss; 1016 -> 1202 (2026-10-10): the fungal mines between the mine and the abyss; 830 -> 1016 (2026-10-09): the abyss under the mine; WH 240 -> 440 (2026-10-08): the caves above the cathedral; 440 -> 640 (2026-10-09): the ice caves under it; 640 -> 830 (2026-10-09): the mine under the ice
const GRAV = 980, MAXFALL = 430, DAY_LEN = 1440; // one full day = 24 real minutes (12 of day, 12 of night)
const WSC = WW / 300;   // how many times wider than the original 300-tile world (2026-10-09: 3x); world-wide counts scale by it
const SPX = WW >> 1, VIL_HALF = 34;   // the village spans this many tiles either side of the spawn
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - (1 - t) * (1 - t);
const approach = (v, t, d) => v < t ? Math.min(v + d, t) : Math.max(v - d, t);
const rnd = (a, b) => a + Math.random() * (b - a);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function makeNoise(sd) {
  const v = (ix, iy) => hash2(ix, iy, sd);
  const sm = t => t * t * (3 - 2 * t);
  function n2(x, y) { const ix = Math.floor(x), iy = Math.floor(y), ux = sm(x - ix), uy = sm(y - iy); const a = v(ix, iy), b = v(ix + 1, iy), c = v(ix, iy + 1), d = v(ix + 1, iy + 1); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; }
  function fbm(x, y, oct) { let s = 0, amp = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += amp * n2(x * f + i * 17.3, y * f + i * 9.1); n += amp; amp *= 0.5; f *= 2; } return s / n; }
  return { n2, fbm };
}
function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function pack(r, g, b, a = 255) { return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0; }
function ph(hex, m = 1) { const [r, g, b] = rgb(hex); return pack(Math.min(255, r * m) | 0, Math.min(255, g * m) | 0, Math.min(255, b * m) | 0); }
function mixHex(a, b, t) { const A = rgb(a), B = rgb(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
