'use strict';

/* ================= Nevasca, o terceiro feitiço: os dados =================
   Funciona como o Arco Voltaico (js/63-arco-dados.js): um herói novo começa com mais um pergaminho não identificado;
   botão direito identifica, botão direito de novo aprende, e o feitiço fica na barra. Com ele na mão, o clique esquerdo
   gasta mana e abre uma nuvem de neve onde está o mouse: por alguns segundos caem dela fragmentos de gelo que ferem,
   resfriam (o inimigo fica lento) e, com golpes seguidos, congelam o inimigo num bloco de gelo. Chefes só resfriam.
   Este arquivo só tem os dados (itens, números e ícones) e carrega logo depois de 65-morcego-dados, para a wiki ver também.
   As regras (aprender, lançar, os fragmentos, resfriar, congelar, desenhar) ficam em js/68-nevasca.js. */

// cost: mana · cd: segundos entre lançamentos · dur: segundos de neve · reach: até onde o mouse alcança a partir do herói
// r: meia largura da área · h: altura máxima da nuvem acima da mira · rate: fragmentos por segundo · min/max: dano de um fragmento
// wind: vento que inclina a queda · fall: velocidade da queda
// chill: segundos de frio depois do último fragmento · slow: fração da velocidade que sobra resfriado (slowBoss nos chefes)
// freezeAt: fragmentos seguidos que congelam · freeze: segundos congelado · imm: segundos depois de descongelar sem poder congelar de novo
const NEV = { cost: 12, cd: 1.6, dur: 3, reach: 170, r: 30, h: 84, rate: 20, min: 1, max: 3, wind: 62, fall: 300,
  chill: 3, slow: 0.5, slowBoss: 0.72, freezeAt: 4, freeze: 2.2, imm: 1.5 };

Object.assign(ITEMS, {
  perg_selado_n: { name: 'Pergaminho Não Identificado', rar: 0, scroll: 1, icon: 'perg_selado_n', desc: 'Um rolo lacrado com cera azulada, frio ao toque. Deixa geada nos dedos.' },
  perg_nevasca: { name: 'Pergaminho da Nevasca', rar: 2, scroll: 2, icon: 'perg_nevasca', desc: 'As runas soltam vapor branco como respiração no inverno. Lido em voz alta, ensina o feitiço e se desfaz.' },
  feitico_nevasca: { name: 'Nevasca', rar: 2, spell: true, icon: 'feitico_nevasca', desc: 'Uma nuvem de inverno se abre sobre os inimigos e despeja fragmentos de gelo. Quem fica debaixo dela resfria e, se ficar demais, congela.' }
});
const isNevItem = id => id === 'perg_selado_n' || id === 'perg_nevasca' || id === 'feitico_nevasca';

/* ---- ícones: o mesmo rolo do Arco, com lacre e runas de gelo ---- */
const NEV_PAL = { roll: '#c9a978', sheet: '#d8c49a', ink: '#8a7458', rune: '#7cc8ec', wax: '#3c6a94', ribbon: '#2a3a4c', rim: '#1e3a5c', ice: '#a8dcf4' };
function nevPaintRows(rows, seed) {
  const c = mk(13, 13), x = c.getContext('2d');
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const m = SCROLL_MAT[rows[j][i]]; if (!m) continue;
    let v = m[1]; const g = hash2(i, j, seed);
    if (m[0] === 'sheet' || m[0] === 'roll') v += g < 0.16 ? -1 : g > 0.9 ? 1 : 0;   // fibras do papel
    x.fillStyle = heroRamp(NEV_PAL[m[0]])[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}
// o feitiço: um floco de gelo de oito pontas, branco no miolo, dentro de um disco de noite de inverno
const NEV_FLAKE = [
  ".............",
  "......w......",
  "....w.w.w....",
  ".....www.....",
  "..w...w...w..",
  "...w..w..w...",
  ".wwwwwCwwwww.",
  "...w..w..w...",
  "..w...w...w..",
  ".....www.....",
  "....w.w.w....",
  "......w......",
  "............."
];
function nevPaintSpell() {
  const c = mk(13, 13), x = c.getContext('2d'), rim = heroRamp(NEV_PAL.rim), ice = heroRamp(NEV_PAL.ice);
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const d = Math.hypot(i - 6, j - 6); if (d > 6.4) continue;
    const g = hash2(i, j, 97);
    let v = d > 5.3 ? (j < 6 ? 4 : 2) : (i + j < 11 ? 2 : 1);                 // borda clara em cima, miolo escuro
    if (g < 0.14) v -= 1; else if (g > 0.9) v += 1;
    x.fillStyle = rim[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  const on = (i, j) => NEV_FLAKE[j] && NEV_FLAKE[j][i] && NEV_FLAKE[j][i] !== '.';
  x.fillStyle = ice[1];   // halo gelado em volta do floco
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) if (!on(i, j) && Math.hypot(i - 6, j - 6) < 5.3 && (on(i + 1, j) || on(i - 1, j) || on(i, j + 1) || on(i, j - 1))) x.fillRect(i, j, 1, 1);
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    if (!on(i, j)) continue;
    const d = Math.hypot(i - 6, j - 6);
    x.fillStyle = NEV_FLAKE[j][i] === 'C' ? '#f4fcff' : d < 2 ? ice[5] : hash2(i, j, 13) < 0.3 ? ice[3] : ice[4];
    x.fillRect(i, j, 1, 1);
  }
  return c;
}
{
  const _makeIcon = makeIcon;
  makeIcon = function (id) {
    if (!isNevItem(id)) return _makeIcon(id);
    const src = id === 'feitico_nevasca' ? nevPaintSpell() : nevPaintRows(id === 'perg_nevasca' ? SCROLL_ID_ROWS : SCROLL_ROWS, id === 'perg_nevasca' ? 47 : 43);
    const o = outlined(src); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}
