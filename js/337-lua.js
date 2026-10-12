'use strict';

/* ================= as fases da lua =================
   Pedido do Jonathan (2026-10-12): a lua passa por crescente, cheia, minguante e nova, com um ciclo
   que combina com o dia de 24 min e as estações de 7 dias (js/334-estacoes.js).
   - Uma fase por noite, 8 fases: o ciclo dura 8 dias do jogo (3 h 12 min reais). O ano de 28 dias tem 3,5 ciclos,
     então a lua cheia cai num dia diferente a cada estação, como na vida real (o ano real também não fecha em luas inteiras).
     Na escala real (29,5 dias por lua, 91 dias por estação) a lua trocaria de fase várias vezes na mesma noite.
   - A fase vira às 18h, quando a lua nasce. Um jogo novo começa na lua cheia (como já era).
   - A lua é redesenhada maior, com mares, crateras, a sombra de verdade de uma esfera e a borda da sombra pontilhada.
     O lado escuro aparece de leve (luz da Terra). A lua nova quase some.
   - A noite na superfície fica um pouco mais clara na lua cheia e mais escura na lua nova.
   - O ícone de lua do relógio mostra a fase. A fase vai no save (só o ajuste do botão de teste; o resto sai do worldTime). */

const LUA_FASES = ['Lua Nova', 'Lua Crescente', 'Quarto Crescente', 'Crescente Gibosa', 'Lua Cheia', 'Minguante Gibosa', 'Quarto Minguante', 'Lua Minguante'];
const LUA_DIAS = 8;
let luaOff = 0;
const luaFase = () => ((Math.floor(worldTime / DAY_LEN) + 4 + luaOff) % 8 + 8) % 8;
const luaBrilho = p => (1 - Math.cos(p / 8 * Math.PI * 2)) / 2;   // 0 na nova, 1 na cheia

/* ---- o desenho (33x33, assado uma vez por fase em buildBackdrop) ---- */
const LUA_CLARO = [[96, 100, 138], [124, 128, 164], [152, 156, 188], [184, 187, 212], [214, 216, 234], [242, 242, 250]];
const LUA_ESCURO = [[18, 22, 42], [26, 31, 56], [36, 43, 72]];
const LUA_MARES = [[-3.2, -1.6, 3.4, 2.6], [1.6, -4.2, 2.6, 1.8], [2.6, 1.2, 2.4, 2.8], [-1.2, 3.6, 2.2, 1.6], [-5.2, 2.4, 1.6, 2.2]];
const LUA_CRATERAS = [[-4, -5, 1.3], [4.5, -2, 1.6], [0.5, 6.2, 1.9], [-6, 0.5, 1], [5, 4, 1.1], [-2, 1, 0.9], [2, -6.5, 0.9]];
function luaRuido(x, y) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(i, j, 211), b = hash2(i + 1, j, 211), c = hash2(i, j + 1, 211), d = hash2(i + 1, j + 1, 211);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
bgMoonSprite = function (ph) {
  const S = 33, c = mk(S, S), x = c.getContext('2d'), img = x.createImageData(S, S), u = new Uint32Array(img.data.buffer), o = 16, r = 9.5;
  const th = ph / 8 * Math.PI * 2, sx = Math.sin(th), sz = -Math.cos(th), sg = sx >= 0 ? 1 : -1, luz = luaBrilho(ph);
  const escA = ph === 0 ? 110 : 228;
  for (let y = 0; y < S; y++) for (let px = 0; px < S; px++) {
    const dx = px - o, dy = y - o, d = Math.hypot(dx, dy), by = BAYER4[(y & 3) * 4 + (px & 3)];
    if (d <= r) {
      const U = dx / r, V = dy / r, W = Math.sqrt(Math.max(0, 1 - U * U - V * V)), ndl = U * sx + W * sz;
      // relevo: mares escuros com borda irregular, crateras com a parede virada para o sol acesa, e grão
      let mar = 0;
      for (const [mx, my, ax, ay] of LUA_MARES) { const q = ((dx - mx) / ax) ** 2 + ((dy - my) / ay) ** 2 + (luaRuido(px * 0.7, y * 0.7) - 0.5) * 0.9; if (q < 1) mar = Math.max(mar, q < 0.6 ? 1 : 0.6); }
      let t = 0.82 - mar * 0.3 + (hash2(px, y, 7) - 0.5) * 0.12 + (luaRuido(px * 0.4 + 9, y * 0.4) - 0.5) * 0.1 - (1 - W) * 0.16;
      for (const [cx, cy, cr] of LUA_CRATERAS) {
        const e = Math.hypot(dx - cx, dy - cy);
        if (e < cr) t -= 0.12 + ((dx - cx) * sg < 0 ? 0.12 : -0.04);
        else if (e < cr + 0.9 && (dx - cx) * sg > 0) t += 0.1;
      }
      if (d > r - 0.9) t -= 0.1;
      // a sombra da esfera: perto da borda da sombra escurece, e a borda é pontilhada
      const f = clamp((ndl + 0.05) / 0.2, 0, 1);
      if (f * 16 > by + 0.5) {
        const k = clamp(t * (0.62 + 0.38 * clamp(ndl * 1.6 + 0.25, 0, 1)), 0, 0.999);
        u[y * S + px] = bgPack(LUA_CLARO[Math.min(5, Math.floor(k * 6 + by / 16))]);
      } else {
        const k = clamp(t * 0.9, 0, 0.999);
        u[y * S + px] = bgPack(LUA_ESCURO[clamp(Math.floor(k * 3 + by / 16 - 0.5), 0, 2)], escA);
      }
    } else if (luz > 0.05) {
      // halo: mais forte quanto mais cheia
      if (d <= r + 3 && by < 2 + luz * 5) u[y * S + px] = bgPack([200, 214, 255], 30 + luz * 50);
      else if (d <= r + 7 && by < luz * 2.2) u[y * S + px] = bgPack([170, 190, 255], 20 + luz * 30);
    }
  }
  x.putImageData(img, 0, 0); return c;
};

/* ---- a noite na superfície: um pouco mais clara na cheia, mais escura na nova ---- */
function luaNoite() { const n = 1 - dayFactor(hourNow()); if (n > 0) skyLight = clamp(skyLight + n * (luaBrilho(luaFase()) - 0.5) * 0.16, 0, 1); }
HOOK.update.push(luaNoite);
{ const _ri = idleUpdate; idleUpdate = function (dt) { _ri(dt); luaNoite(); }; }

/* ---- o ícone do relógio mostra a fase ---- */
const LUA_ICONE = [
  ['transparent', 'inset 0 0 0 1px #4a5272'],
  ['transparent', 'inset -3px 0 0 #dfe6ff'],
  ['linear-gradient(90deg,transparent 50%,#dfe6ff 50%)', 'none'],
  ['#dfe6ff', 'inset 3px 0 0 #2a3150'],
  ['#dfe6ff', 'none'],
  ['#dfe6ff', 'inset -3px 0 0 #2a3150'],
  ['linear-gradient(90deg,#dfe6ff 50%,transparent 50%)', 'none'],
  ['transparent', 'inset 3px 0 0 #dfe6ff']
];
let luaIcone = '';
HOOK.update.push(() => {
  const el = $('hSun'); if (!el) return;
  const k = isNight() ? 'n' + luaFase() : 'd'; if (k === luaIcone) return; luaIcone = k;
  if (k === 'd') { el.style.background = ''; el.style.boxShadow = ''; return; }
  const [bg, sh] = LUA_ICONE[luaFase()]; el.style.background = bg; el.style.boxShadow = sh;
});

/* ---- save ---- */
{ const _nw = newWorld; newWorld = function (sd, sv) { _nw(sd, sv); luaOff = sv && sv.lua !== undefined && isFinite(+sv.lua) ? Math.round(+sv.lua) & 7 : 0; luaIcone = ''; }; }
{ const _ms = makeSave; makeSave = function () { const v = _ms(); if (luaOff) v.lua = luaOff; return v; }; }

/* ---- Menu > Testes: pular para a próxima fase ---- */
// (o botão fica na aba Mundo da tela de Testes, 339-testes)
