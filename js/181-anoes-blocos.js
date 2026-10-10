'use strict';

/* ================= a Fortaleza dos Anões: blocos, paredes, terceira camada, minérios, decoração =================
   Brasafunda foi lavrada, não cavada: granito anão cinza-azulado de grão fino, cantaria em blocos retos com a junta
   da espessura de um fio e as quinas lascadas, lajes do chão dos salões com faixas de runas que os pés apagaram,
   chapas de bronze rebitadas com pátina verde escorrendo dos rebites, a grade de bronze por cima dos canais (anda-se
   nela e vê-se a lava por baixo), a pedra de canal lisa e refratária, o tijolo refratário amarelo queimado das
   forjas com fuligem, o eixo de engrenagem que continua girando, a comporta de bronze, a cera seca em favos que a
   coisa de baixo deixou, o Portão de Runas, a barricada de entulho, a seteira e a pedra quente que a Bomba de Lava
   deixa. O carvão volta no granito; o mithril, o metal da camada, corre nele em fios prata-azulados com brilho fraco.
   Como no 131 (CDART), cada material é uma textura contínua de 240x240 amostrada em pixels do mundo; contorno,
   borda acesa, sombra e oclusão vêm do 07-chunks-luz. Paredes de fundo e terceira camada só leem o tom (.v).
   Decoração de 1 bloco (escada anã e corrente de bronze que se escalam, alavanca, lâmpada de runa, braseiro, runa
   no piso, barril, bigorna, tenazes e malhos, respiro de vapor, casca de quitina, elmo caído): sprites 12x12 em
   rampas com luz de cima à esquerda. Ao vivo: o eixo girando, a alavanca (cabo e runa), o brilho firme das lâmpadas,
   braseiros e runas, o vapor dos respiros. A luz aqui não treme: a lava dos canais (LAVA, tile 10) já brilha parada.
   Ids: 180-anoes-api.

   ANART (para 182 objetos, 183/184 monstros, 186 chefe, 189 mecanismos):
     paletas de 6 tons (spec seção 12) em PALS: anGranito, anBronze, anPatina, anTijolo, anLava, anRuna, anMithril,
       anCera; derivadas: anCantaria, anLaje, anCanal, anQuente, anComporta; paredes anGranitoW, anCantariaW,
       anBronzeW, anTijoloW; terceira camada dpAnSaloes, dpAnMaquinas, dpAnForjas
     HEX: as mesmas rampas em hex (bronze, patina, granito, tijolo, lava, runa, mithril, cera), 6 tons, escuro->claro
     DRAN: rampas de sprite (7 tons, valores ph prontos para dPix/spr().put): bronze, patina, granito, ferro, madeira,
       runa, lava, mithril, cera, quitina, tijolo
     RUNES: 8 runas anãs 3x5 (linhas de '#'/'.'); runeAt(k, x, y) diz se o pixel (x 0..2, y 0..4) da runa k é traço
     helpers do 131/121: cg, cn, cells, dPix, cvSprite, spr, rimOut, disc, flipX, courses
     texturas: vGranito, vCantaria, vLaje, vBronze, vCanal, vTijolo, vCera, vEntulho, vQuente, gearV(px, py, ang)
     glows (canvas, criados na 1a vez em drawGlow): AN_GLOW.lamp/brasa/runa/mith/quente
     LEVER: os quadros do cabo da alavanca (7 ângulos de -0.65 a 0.65 rad) e as runas da base (acesa/apagada)
   Ganchos que outros arquivos podem definir: anLeverOn(x, y) (true = puxada), anLeverReady(x, y) (runa acesa; sem a
   função, acesa), afLeverCell(x, y) (186: a célula é do chefe, este arquivo não desenha nada nela),
   anLampDim(x, y) (0..1, multiplica o brilho da lâmpada: o 185 pode fazer piscar perto das brechas). */
const ANART = {};
{
const { cg, cn, cells, dPix, cvSprite } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
const courses = CDART.courses;
/* ---- paletas: 6 tons, escuro para claro (spec seção 12) ---- */
const HEX = {
  granito: ['#1e2228', '#2e343c', '#424a54', '#5a646e', '#7a848c', '#9ea6ac'],
  bronze: ['#2a1a0c', '#4a2e14', '#70461e', '#9a6a2c', '#c49448', '#e8c27a'],
  patina: ['#1a2a24', '#264036', '#345a4a', '#4a7a62', '#6a9a7e', '#94bca0'],
  tijolo: ['#3a2a18', '#5a4024', '#7a5832', '#9a7444', '#bc9660', '#dcbc88'],
  lava: ['#3a0c04', '#7a1e06', '#b8400a', '#e8700e', '#ffa62a', '#ffe08a'],
  runa: ['#0e2a3a', '#145070', '#1e7aa8', '#3aa8d8', '#7ad0f0', '#d0f4ff'],
  mithril: ['#1e2a3a', '#2e4258', '#46627e', '#6a8eac', '#9cc0d8', '#d8eef8'],
  cera: ['#2e220c', '#4a3814', '#6a521e', '#8a6c2a', '#a8883e', '#c6a65a']
};
pal('anGranito', HEX.granito); pal('anBronze', HEX.bronze); pal('anPatina', HEX.patina); pal('anTijolo', HEX.tijolo);
pal('anLava', HEX.lava); pal('anRuna', HEX.runa); pal('anMithril', HEX.mithril); pal('anCera', HEX.cera);
// derivadas: a cantaria é o mesmo granito lavrado (um pouco mais clara), a laje dos salões puxa para o quente,
// a pedra de canal é refratária (cinza-pardo), a crosta da pedra quente é quase preta
pal('anCantaria', ['#22262c', '#343a42', '#4a525c', '#646e78', '#868e96', '#a8aeb2']);
pal('anLaje', ['#201e1c', '#322e2a', '#48423c', '#605850', '#7c7266', '#9c907e']);
pal('anCanal', ['#1a1614', '#2a2420', '#3c342e', '#504640', '#685c54', '#82756a']);
pal('anQuente', ['#0c0a0a', '#151212', '#1e1918', '#28211e', '#332a26', '#40342e']);
pal('anComporta', ['#22160a', '#3a2410', '#5a3a18', '#7c5424', '#a07436', '#c49a56']);
// paredes de fundo: sempre muito mais escuras que o chão da frente
pal('anGranitoW', ['#08090b', '#0c0e11', '#111317', '#15181d', '#1a1e24', '#20252b']);
pal('anCantariaW', ['#090a0c', '#0e1013', '#131519', '#181b20', '#1e2228', '#252a30']);
pal('anBronzeW', ['#0c0805', '#110b07', '#170f09', '#1d130b', '#24180e', '#2c1d11']);
pal('anTijoloW', ['#0e0a06', '#140f09', '#1a130c', '#211810', '#291e14', '#312418']);
// terceira camada; o tom de cima das forjas é o brilho de uma boca de forja ao longe
pal('dpAnSaloes', ['#050607', '#08090b', '#0c0e10', '#111316', '#16191c', '#1c2024']);
pal('dpAnMaquinas', ['#070504', '#0b0806', '#100b08', '#150f0a', '#1b130d', '#221810']);
pal('dpAnForjas', ['#060404', '#0a0706', '#0f0a08', '#140e0a', '#1a120d', '#6a300c']);

const wrapT = v => ((v % TP) + TP) % TP;
const RAMPX = hexes => hexes.map(h => ph(h));
const BRONZE = RAMPX(HEX.bronze), PATINA = RAMPX(HEX.patina), LAVAC = RAMPX(HEX.lava), RUNAC = RAMPX(HEX.runa), GRAN = RAMPX(HEX.granito);
const HEAT = RAMPX(['#4a3426', '#5a3c28', '#6c462c']);                                    // a mancha de calor na pedra de canal
const SOOT = RAMPX(['#141210', '#201c18', '#2c2620']);

/* ---- runas anãs: 3 de largura, 5 de altura, retas e angulosas ---- */
const RUNES = [
  ['.#.', '###', '.#.', '.#.', '.#.'], ['#..', '##.', '#.#', '#..', '#..'], ['#.#', '#.#', '.#.', '#.#', '#.#'], ['###', '#..', '##.', '#..', '#..'],
  ['#.#', '###', '#.#', '#.#', '#.#'], ['.#.', '#.#', '.#.', '#.#', '.#.'], ['#..', '#..', '###', '..#', '..#'], ['##.', '#.#', '##.', '#.#', '##.']
];
const runeAt = (k, x, y) => x >= 0 && x < 3 && y >= 0 && y < 5 && RUNES[((k % 8) + 8) % 8][y][x] === '#';

/* ================= chão sólido ================= */
function vGranito(x, y) {   // granito anão: grão fino cinza-azulado, sal e pimenta de feldspato e mica, manchas suaves, um veio fino às vezes
  let v = 2.7 + cn(x, y, 8, 8, 18101) * 1.2 + cn(x, y, 30, 30, 18102) * 0.6 + cg(x, y, 18103) * 0.7;
  const h = hash2(x, y, 18104);
  if (h < 0.05) v += 1.1; else if (h > 0.95) v -= 1.2;
  if (hash2(x >> 1, y >> 1, 18105) < 0.02) v -= 0.8;                                         // um grão de mica
  const cr = Math.abs(cn(x, y, 12, 12, 18106));
  if (cr < 0.004) v -= 1.3; else if (Math.abs(cn(x, y - 1, 12, 12, 18106)) < 0.004) v += 0.6;  // o veio, com o lábio de baixo aceso
  return v;
}
const ashlar = courses(12, 12, 0.42, 18111);
function vCantaria(x, y) {   // cantaria anã: blocos retos de uma fiada, junta finíssima, face picada a cinzel, quinas lascadas
  const c = ashlar(x, y), { ly, lx, w } = c;
  if (ly === 11 || lx === 0) return 1.1 + cg(x, y, 18112) * 0.3;
  let v = 3.0 + (c.id - 0.5) * 0.8 + cn(x, y, 20, 20, 18113) * 0.6 + cg(x, y, 18114) * 0.55;
  const g = hash2(x, y, 18116); if (g < 0.04) v += 0.9; else if (g > 0.96) v -= 0.9;
  if (ly === 0) v += 1.0; else if (ly === 1) v += 0.3; else if (ly === 10) v -= 0.8;
  if (lx === 1) v += 0.5; else if (lx === w - 1) v -= 0.6;
  if ((x + y * 2 + ((c.id * 20) | 0)) % 5 === 0) v -= 0.22;                                  // as marcas do cinzel
  const ch = c.id * 7 % 1;
  if (ch < 0.4 && (ch < 0.2 ? lx + ly < 3 : (w - 1 - lx) + (10 - ly) < 3)) return 1.3 + (lx + ly) * 0.05;   // uma quina lascada
  if (hash2(x, y, 18115) < 0.015) v -= 1;
  return v;
}
const slabs = courses(12, 12, 0.55, 18121);
function vLaje(x, y) {   // laje gravada: lajes grandes e gastas, e em algumas fiadas uma faixa de runas entre dois sulcos, apagada aos pedaços
  const c = slabs(x, y), { ly, lx, w, row } = c;
  if (ly === 11 || lx === 0) return 0.9 + cg(x, y, 18125) * 0.3;
  let v = 2.9 + (c.id - 0.5) * 0.7 + cn(x, y, 20, 20, 18126) * 0.5 + cg(x, y, 18127) * 0.45;
  if (ly === 0) v += 0.9; else if (ly === 10) v -= 0.7;
  if (lx === 1) v += 0.4; else if (lx === w - 1) v -= 0.5;
  if (hash2(row, 0, 18122) < 0.55 && ly >= 3 && ly <= 9 && lx > 1 && lx < w - 1) {
    const f = Math.min(1, (cn(x, y, 24, 24, 18123) + 0.12) * 5);                              // onde os pés não apagaram
    if (f > 0) {
      if (ly === 3) return v - 1.1 * f;
      if (ly === 9) return v - 0.8 * f;
      if (ly === 4) v += 0.4 * f;
      const k = Math.floor(wrapT(x) / 5), gx = wrapT(x) % 5, gy = ly - 4, rk = (hash2(k, row, 18124) * 8) | 0;
      if (runeAt(rk, gx, gy)) return v - 1.3 * f;
      if (runeAt(rk, gx, gy - 1)) v += 0.5 * f;                                               // o lábio de baixo do sulco, aceso
    }
  }
  if (hash2(x, y, 18128) < 0.02) v -= 0.9;
  return v;
}
function vBronze(x, y) {   // chapa de bronze: placas 24 x 12 desencontradas, rebites, marcas de martelo, pátina verde em manchas e escorrendo dos rebites
  const row = Math.floor(wrapT(y) / 12), ly = wrapT(y) % 12, off = row % 2 ? 12 : 0, lx = wrapT(x + off) % 24, pl = Math.floor(wrapT(x + off) / 24);
  if (ly === 11 || lx === 23) return 0.5;
  const rx = lx < 7 ? 2 : lx < 16 ? 11 : 20, ry = ly < 5 ? 2 : 8, dx = lx - rx, dy = ly - ry;
  if (dx >= 0 && dx <= 1 && dy >= 0 && dy <= 1) return dx + dy === 0 ? 5.3 : dx + dy === 2 ? 2.2 : 4.1;
  const ph0 = hash2(pl * 3 + rx, row * 2 + ry, 18131);
  if (ph0 < 0.35 && (dx === 0 || dx === 1) && dy >= 2 && dy <= 3 + ph0 * 8) { MATX = PATINA[dy < 4 ? 3 : 2]; return -9; }   // a pátina que escorre do rebite
  let v = 3.0 + (hash2(pl, row, 18132) - 0.5) * 0.6 + cn(x, y, 6, 40, 18133) * 0.6 + cg(x, y, 18134) * 0.35;
  if ((dx === 2 && dy >= 0 && dy <= 2) || (dy === 2 && dx >= 0 && dx <= 2)) v -= 0.7;          // a sombra do rebite
  const d = cells(x, y, 6, 18135);
  if (d.id < 0.3 && d.d1 < 1.4) v += d.ox + d.oy < 0 ? -0.5 : 0.5;                            // marcas de martelo
  if (ly === 0) v += 1.0; else if (ly === 10) v -= 0.8;
  if (lx === 0) v += 0.5; else if (lx === 22) v -= 0.6;
  const p = cn(x, y, 20, 20, 18136) + (ly >= 9 || ly <= 1 ? 0.08 : 0) + cg(x, y, 18137) * 0.06;
  if (p > 0.24) { MATX = PATINA[p > 0.33 ? 3 : p > 0.28 ? 2 : 1]; return -9; }
  if (hash2(x, y, 18138) < 0.008) v += 1.4;                                                   // um brilho de desgaste
  return v;
}
function vGrade(x, y) {   // a textura da grade (ícone e mapa): trilho em cima, barras, trilho embaixo
  const lx = wrapT(x) % 4, ly = wrapT(y) % 12;
  if (ly <= 2) return ly === 0 ? 4.6 : ly === 1 ? 3.6 : 2.2;
  if (ly === 9 || ly === 10) return ly === 9 ? 3.6 : 1.8;
  if (ly === 11) return 0.1;
  return lx === 1 ? 4.2 : lx === 2 ? 2.6 : 0.1;
}
const canalB = courses(12, 24, 0.5, 18141);
function vCanal(x, y) {   // pedra de canal: blocos grandes, lisos e refratários, um brilho vidrado deitado, manchas de calor
  const c = canalB(x, y), { ly, lx, w } = c;
  if (ly === 11 || lx === 0) return 0.7;
  let v = 2.9 + (c.id - 0.5) * 0.6 + cn(x, y, 30, 30, 18142) * 0.5 + cg(x, y, 18143) * 0.18;
  if (ly === 0) v += 0.9; else if (ly === 10) v -= 0.7;
  if (lx === 1) v += 0.4; else if (lx === w - 1) v -= 0.5;
  const sh = Math.sin(y * 0.45 + cn(x, y, 8, 8, 18144) * 6); if (sh > 0.93) v += 0.8;
  const ht = cn(x, y, 30, 12, 18145); if (ht > 0.3 && hash2(x, y, 18147) < 0.7) { MATX = HEAT[ht > 0.38 ? 2 : ht > 0.34 ? 1 : 0]; return -9; }
  if (hash2(x, y, 18146) < 0.006) v -= 1;
  return v;
}
function vTijolo(x, y) {   // tijolo refratário: 12 x 5, amarelo queimado, cada um no seu tom, pintas de ferro, fuligem subindo, um vidrado aqui e ali
  const row = Math.floor(wrapT(y) / 6), ly = wrapT(y) % 6, off = row % 2 ? 6 : 0, lx = wrapT(x + off) % 12, bk = Math.floor(wrapT(x + off) / 12);
  if (ly === 5 || lx === 11) return 1.0 + cg(x, y, 18151) * 0.4;
  const h = hash2(bk, row, 18152);
  let v = 3.0 + (h - 0.5) * 1.2 + (ly === 0 ? 0.9 : ly === 4 ? -0.7 : 0) + (lx === 0 ? 0.4 : lx === 10 ? -0.5 : 0) + cg(x, y, 18153) * 0.5;
  if (h < 0.12) v -= 1.1;                                                                     // um tijolo mais queimado
  if (hash2(x, y, 18154) < 0.06) v -= 1.0;
  if (hash2(x, y, 18155) < 0.006) v += 1.6;
  const s = cn(x, y, 12, 6, 18156); if (s > 0.18) v -= (s - 0.18) * 7;
  if ((lx === 0 && ly === 0 && h > 0.7) || (lx === 10 && ly === 4 && h < 0.3)) v = 1.2;         // quinas lascadas
  return v;
}
// a engrenagem do eixo: dentes, aro, furos de alívio, cubo; (px, py) o pixel dentro do bloco, a o ângulo
function gearV(px, py, a) {
  const dx = px + 0.5 - 6, dy = py + 0.5 - 6, r = Math.hypot(dx, dy);
  if (r >= 5.6) return -1;
  const th = Math.atan2(dy, dx) - a, lt = r > 0 ? (dx + dy) / r : 0;
  if (r < 1.2) return 2.2;                                                                    // o eixo
  if (r < 2.3) return 4.6 - lt * 0.9;                                                         // o cubo
  if (r > 2.3 && r < 3.9) return Math.cos(th * 3) > 0.55 ? 4.2 - lt * 0.6 : 1.0;           // três raios e a alma funda entre eles                            // furos de alívio
  const R = Math.cos(th * 6) > 0.15 ? 5.5 : 4.2;
  if (r > R) return 0.2;                                                                      // o fundo do encaixe
  let v = 3.6 - lt * 0.7;
  if (r > R - 1) v += lt < 0 ? 1.2 : -1.0;
  return v;
}
function vEixo(x, y) {   // eixo de engrenagem: placa de mancal rebitada e a engrenagem no encaixe (o 181 a faz girar ao vivo)
  const lx = wrapT(x) % 12, ly = wrapT(y) % 12, g = gearV(lx, ly, 0);
  if (g >= 0) return g;
  let v = 2.6 + cg(x, y, 18161) * 0.25 + cn(x, y, 20, 20, 18162) * 0.3;
  if ((lx === 1 || lx === 10) && (ly === 1 || ly === 10)) return lx === 1 && ly === 1 ? 5 : 4.2;
  if (ly === 0 || lx === 0) v += 0.9; else if (ly === 11 || lx === 11) v -= 0.8;
  if (hash2(x, y, 18163) < 0.04) { MATX = PATINA[1 + (hash2(x, y, 18164) * 2 | 0)]; return -9; }
  return v;
}
function vComporta(x, y) {   // comporta: pranchas de bronze fundido em pé, duas cintas rebitadas, pátina escorrendo das cintas
  const lx = wrapT(x) % 12, ly = wrapT(y) % 12, pk = Math.floor(wrapT(x) / 4), plx = lx % 4;
  if (ly === 1 || ly === 8) return (lx % 4 === 2 ? 5.4 : 4.4) + cg(x, y, 18171) * 0.3;          // as cintas, com rebites
  if (ly === 2 || ly === 9) return lx % 4 === 2 ? 2.6 : 1.8;
  if (plx === 3) return 0.7;
  if (ly >= 3 && ly <= 6 && hash2(x, Math.floor(wrapT(y) / 12) * 2 + (ly > 5 ? 1 : 0), 18172) < 0.25 && ly - 3 < hash2(x, 3, 18173) * 5) { MATX = PATINA[ly < 5 ? 3 : 2]; return -9; }
  let v = 2.9 + (hash2(pk, 0, 18174) - 0.5) * 0.6 + cn(x, y, 40, 6, 18175) * 0.5 + cg(x, y, 18176) * 0.35;
  if (plx === 0) v += 0.6; else if (plx === 2) v -= 0.3;
  if (hash2(x, y, 18177) < 0.02) v -= 0.9;
  return v;
}
// favos: hexágonos regulares, fileiras de 8, células de 10, as ímpares deslocadas 5 (repete a cada 240)
function hexC(x, y) {
  const r = Math.floor(y / 8); let d1 = 99, d2 = 99, id = 0, ox = 0, oy = 0;
  for (let j = -1; j <= 1; j++) {
    const rr = r + j, wr = ((rr % 30) + 30) % 30, off = (wr & 1) * 5, c = Math.floor((x - off) / 10);
    for (let i = -1; i <= 1; i++) {
      const cc = c + i, wc = ((cc % 24) + 24) % 24, px = cc * 10 + off + 5, py = rr * 8 + 4, d = Math.hypot(x + 0.5 - px, (y + 0.5 - py) * 1.15);
      if (d < d1) { d2 = d1; d1 = d; id = hash2(wc, wr, 18181); ox = x + 0.5 - px; oy = y + 0.5 - py; } else if (d < d2) d2 = d;
    }
  }
  return { d1, d2, id, ox, oy };
}
function vCera(x, y) {   // cera seca: favos vazios fundos, alguns tampados, paredes finas acesas, sujeira, um favo quebrado
  const h = hexC(x, y), e = h.d2 - h.d1;
  if (e < 1.1) return 3.5 + (h.ox + h.oy < 0 ? 0.6 : -0.3) + cg(x, y, 18182) * 0.5;
  let v;
  if (h.id < 0.28) { v = 3.0 + cg(x, y, 18183) * 0.4 + (e < 2.1 ? (h.ox + h.oy < 0 ? 0.8 : -0.6) : 0); }   // tampado
  else if (h.id > 0.93) v = 0.3 + cg(x, y, 18184) * 0.3;                                      // quebrado: escuro até o fundo
  else { v = 1.0 + cg(x, y, 18185) * 0.3; if (e < 2.3) v += h.ox + h.oy > 0 ? 1.5 : -0.3; }  // aberto: a parede de baixo à direita pega a luz
  const dirt = cn(x, y, 12, 12, 18186); if (dirt > 0.2) v -= (dirt - 0.2) * 4;
  return v;
}
function vBarreiraT(x, y) {   // o portão de runas como textura (ícone e mapa): barras e a placa
  const lx = wrapT(x) % 12, ly = wrapT(y) % 12;
  if (lx <= 2 || lx >= 9) return lx === 1 || lx === 9 ? 4.4 : lx === 0 || lx === 10 ? 3 : 1.8;
  if (ly >= 3 && ly <= 8) { if (runeAt(6, lx - 4, ly - 3)) { MATX = RUNAC[4]; return -9; } return 2.4; }
  return lx === 6 ? 3.6 : 0.2;
}
function vEntulho(x, y) {   // barricada: pedaços de cantaria e granito, chapas de bronze tortas, pó nos vãos
  const c = cells(x, y, 8, 18191, 1), e = c.d2 - c.d1;
  if (e < 1.0) return hash2(x, y, 18192) < 0.3 ? 1.6 : 0.3;
  const lt = c.ox + c.oy < 0, rim = e < 2 ? (lt ? 1.1 : -0.9) : 0, l = 2.6 - (c.ox + c.oy) * 0.12 + rim + cg(x, y, 18193) * 0.5;
  if (c.id < 0.22) {   // bronze: chapa torta com um rebite
    if (hash2(Math.round(c.ox), Math.round(c.oy), 18194 + (c.id * 99 | 0)) < 0.05) { MATX = BRONZE[5]; return -9; }
    if (c.id < 0.06 && e > 2.5) { MATX = PATINA[2]; return -9; }
    MATX = BRONZE[Math.max(0, Math.min(5, Math.round(l + 0.2)))]; return -9;
  }
  if (c.id > 0.6 && ((c.oy + c.id * 30) % 5 + 5) % 5 < 0.8) return l - 1.2;                   // a junta de um pedaço de cantaria
  return l + 0.3;
}
function vSeteira(x, y) {   // seteira: um bloco de cantaria inteiro com a fenda funda no meio, a soleira acesa
  const lx = wrapT(x) % 12, ly = wrapT(y) % 12;
  if (lx === 0 || ly === 11) return 1.1 + cg(x, y, 18201) * 0.3;
  if (lx >= 5 && lx <= 6 && ly >= 2 && ly <= 9) return 0.1;
  if ((lx === 4 || lx === 7) && ly >= 1 && ly <= 10) return lx === 4 ? 1.4 : 3.9;
  if (lx >= 4 && lx <= 7 && ly === 1) return 1.6;
  if (lx >= 4 && lx <= 7 && ly === 10) return 4.3;
  let v = 3.0 + cn(x, y, 20, 20, 18202) * 0.5 + cg(x, y, 18203) * 0.55;
  if (ly === 0) v += 1.0; else if (ly === 10) v -= 0.8; if (lx === 1) v += 0.5; else if (lx === 11) v -= 0.6;
  const g = hash2(x, y, 18204); if (g < 0.04) v += 0.9; else if (g > 0.96) v -= 0.9;
  return v;
}
function vQuente(x, y) {   // pedra quente: crosta quase preta em placas, rachada, com laranja vivo nas rachaduras
  const c = cells(x, y, 10, 18211, 1.05), e = c.d2 - c.d1, hot = cn(x, y, 20, 20, 18212);
  if (e < 0.45) { MATX = LAVAC[hot > 0.08 ? 4 : hot > -0.08 ? 3 : 2]; return -9; }
  if (e < 0.95) { MATX = LAVAC[hot > 0.05 ? 2 : 1]; return -9; }
  if (e < 1.6 && hash2(x, y, 18213) < 0.35) { MATX = LAVAC[0]; return -9; }
  let v = 2.4 + (c.id - 0.5) * 1.0 + cg(x, y, 18214) * 0.5;
  if (e < 3) v += c.ox + c.oy < 0 ? 0.9 : -0.6;
  return v;
}

/* ---- paredes de fundo ---- */
const vGranitoW = vGranito, vCantariaW = vCantaria, vTijoloW = vTijolo;
function vRelevoW(x, y) {   // relevo: cantaria em painéis de 48 com moldura; em alguns a marca do clã (martelo sobre a montanha, três runas), apagada aos pedaços
  const px = wrapT(x) % 48, py = wrapT(y) % 48, pk = Math.floor(wrapT(x) / 48) + Math.floor(wrapT(y) / 48) * 5, h = hash2(pk, 0, 18221);
  if (px === 0 || py === 47) return 0.8;
  if (px === 2 || py === 2) return 4.0; if (px === 45 || py === 45) return 1.4;               // a moldura saliente
  if (px < 2 || py < 2 || px > 45 || py > 45) return 3.0 + cg(x, y, 18222) * 0.3;
  let v = 2.6 + cn(x, y, 20, 20, 18223) * 0.5 + cg(x, y, 18224) * 0.45;
  const f = cn(x, y, 12, 12, 18225) + 0.14; if (f < 0) return v;                              // aqui o relevo já se foi
  if (h < 0.6) {
    const inHam = (a, b) => (b >= 7 && b <= 10 && a >= 17 && a <= 31) || (a >= 23 && a <= 24 && b > 10 && b <= 19);
    const inMtn = (a, b) => b >= 16 && b <= 33 && Math.abs(a - 24) <= (b - 16) * 0.95;
    const inner = (fn) => fn(px, py), lit = (fn) => !fn(px - 1, py - 1), sh = (fn) => !fn(px + 1, py + 1);
    if (inner(inHam)) return 3.1 + (lit(inHam) ? 1.3 : 0) - (sh(inHam) ? 1.2 : 0) + cg(x, y, 18226) * 0.3;
    if (inner(inMtn)) return 2.9 + (lit(inMtn) ? 1.3 : 0) - (sh(inMtn) ? 1.1 : 0) + ((py - 16) % 6 === 5 ? -0.6 : 0);
    if (inHam(px - 1, py - 1) || inMtn(px - 1, py - 1)) return 1.2;                           // a sombra do relevo
    if (py >= 37 && py <= 41) for (let k = 0; k < 3; k++) { const rx = px - (15 + k * 7); if (runeAt((h * 80 | 0) + k, rx, py - 37)) return 1.0; if (runeAt((h * 80 | 0) + k, rx, py - 38)) v += 0.6; }
  } else if (py >= 20 && py <= 26) {   // uma faixa de runas só
    if (py === 20 || py === 26) return 1.2;
    const k = Math.floor(px / 5), rx = px % 5; if (runeAt((h * 50 | 0) + k, rx, py - 21)) return 1.0;
  }
  return v;
}
function vBronzeW(x, y) {   // painéis de bronze escuro, foscos: placas de 24, junta, rebites discretos, nenhum brilho
  const lx = wrapT(x) % 24, ly = wrapT(y) % 24, pk = Math.floor(wrapT(x) / 24) * 13 + Math.floor(wrapT(y) / 24);
  if (lx === 23 || ly === 23) return 0.5;
  if ((lx === 2 || lx === 20) && (ly === 2 || ly === 20)) return 3.8;
  let v = 2.6 + (hash2(pk, 0, 18231) - 0.5) * 0.7 + cn(x, y, 20, 20, 18232) * 0.5 + cg(x, y, 18233) * 0.3;
  if (lx === 0 || ly === 0) v += 0.7; else if (lx === 22 || ly === 22) v -= 0.6;
  return v;
}

/* ---- terceira camada ---- */
function vDpSaloes(x, y) {   // colunatas e arcos gigantes ao longe, em faixas de 120, sumindo aos pedaços
  const band = Math.floor(wrapT(y) / 120), by = wrapT(y) % 120, xx = wrapT(x + band * 30), lx = xx % 60, k = Math.floor(xx / 60);
  const bg = 1.2 + cn(x, y, 12, 12, 18301) * 0.5 + cg(x, y, 18302) * 0.2;
  const fade = 0.5 + Math.max(0, cn(x, y, 6, 3, 18303) + 0.3) * 1.2;
  let v = -1;
  if (by >= 112) v = 2.2 + ((xx % 20) === 0 ? -0.8 : 0) + (by === 112 ? 0.8 : 0);              // o piso
  else if (lx < 10) {                                                                         // a coluna, com capitel e base
    if (by < 10) v = by < 2 ? 3.4 : 2.6;
    else if ((by < 16 || by > 104) && lx >= 0) v = by === 10 || by === 105 ? 3.6 : 2.8;
    else if (lx >= 1 && lx <= 8) v = 2.4 + (lx <= 2 ? 0.9 : lx >= 7 ? -0.6 : 0) + ((by % 3) === 0 && lx === 4 ? -0.4 : 0);
  } else if (by < 16) v = 2.5 + (by === 0 ? 0.8 : by === 15 ? -0.6 : 0) + ((xx % 12) === 0 ? -0.6 : 0);   // a arquitrave
  else {
    const r = 25, dx = lx - 35, dy = by - 42;                                                  // o arco entre duas colunas
    if (by < 42 && dx * dx + dy * dy > r * r) v = 2.1 + ((by % 9) === 0 ? -0.5 : 0);
    else if (by < 42 && dx * dx + dy * dy > (r - 4) * (r - 4)) v = 2.9 + (dy < -r * 0.6 ? 0.6 : -0.2) + (Math.floor(Math.atan2(dy, dx) * 5) % 2 ? 0 : -0.5);
  }
  if (v < 0) return bg;
  v += cg(x, y, 18304) * 0.3 + (hash2(k, band, 18305) - 0.5) * 0.4;
  return bg + (v + 0.5 - bg) * Math.min(1, fade);
}
function vDpMaquinas(x, y) {   // engrenagens do tamanho de casas e eixos parados, no escuro
  const cx0 = Math.floor(wrapT(x) / 120), cy0 = Math.floor(wrapT(y) / 120);
  let v = 1.1 + cn(x, y, 10, 10, 18311) * 0.5 + cg(x, y, 18312) * 0.2;
  const sy = 30 + ((cy0 * 7) % 3) * 20; if (Math.abs(wrapT(y) % 120 - sy) < 4) v = 2.4 + (wrapT(y) % 120 - sy < -2 ? 0.8 : 0) + (wrapT(y) % 120 - sy > 2 ? -0.6 : 0);   // um eixo deitado
  for (let j = 0; j <= 1; j++) for (let i = 0; i <= 1; i++) {
    const gi = cx0 + i - (wrapT(x) % 120 < 60 ? 1 : 0), gj = cy0 + j - (wrapT(y) % 120 < 60 ? 1 : 0), wi = ((gi % 2) + 2) % 2, wj = ((gj % 2) + 2) % 2;
    const px = gi * 120 + 60 + (hash2(wi, wj, 18313) - 0.5) * 40, py = gj * 120 + 60 + (hash2(wi, wj, 18314) - 0.5) * 30, R = 34 + hash2(wi, wj, 18315) * 18;
    const X = x + 0.5 - px, Y = y + 0.5 - py, r = Math.hypot(X, Y); if (r > R + 5) continue;
    const th = Math.atan2(Y, X) + hash2(wi, wj, 18316) * 3, tooth = Math.cos(th * Math.round(R / 3)) > 0;
    if (r > R + (tooth ? 5 : 0)) continue;
    if (r < 7) return r < 4 ? 1.2 : 3.2;
    if (r > R * 0.3 && r < R * 0.75 && Math.cos(th * 6) < 0.3) return 0.8;                   // entre os raios
    return 2.5 + (r > R - 3 ? -(X + Y) / r * 0.8 : 0) + (Math.abs(r - R * 0.8) < 1 ? -0.7 : 0) + cg(x, y, 18317) * 0.25;
  }
  return v;
}
function vDpForjas(x, y) {   // chaminés em fila, fuligem, e lá embaixo o brilho laranja das bocas de forja
  const band = Math.floor(wrapT(y) / 120), by = wrapT(y) % 120, xx = wrapT(x + band * 40), k = Math.floor(xx / 40), lx = xx % 40;
  const bg = 1.1 + cn(x, y, 10, 5, 18321) * 0.6 + cg(x, y, 18322) * 0.2;
  const ground = 100;
  if (by > ground + 4) return 0.7 + cg(x, y, 18323) * 0.3;
  const cw = 5 + hash2(k, band, 18324) * 4, top = 10 + hash2(k, band, 18325) * 40, cx = 20 + (hash2(k, band, 18326) - 0.5) * 10, ux = lx - cx;
  if (by >= top && Math.abs(ux) < cw * (1 + (by - top) / 140)) {
    if (by > ground - 12 && by < ground - 2 && Math.abs(ux) < cw - 2) return hash2(k, band, 18327) < 0.55 ? (by > ground - 9 ? 5.4 : 4.6) : 0.5;   // a boca da forja
    return 2.2 + (ux < -cw + 2 ? 0.7 : 0) + ((by - top) % 6 === 0 ? -0.5 : 0) + cg(x, y, 18328) * 0.25;
  }
  if (by < top && by > top - 3 && Math.abs(ux) < cw + 1) return 2.8;                          // o rebordo da chaminé
  if (by < top && Math.abs(ux + (top - by) * 0.15) < 3 + (top - by) * 0.12 && cn(x, y, 20, 20, 18329) > -0.05) return bg + 0.6;   // a fuligem subindo
  if (by > ground - 14 && by <= ground + 4) return bg + Math.max(0, 1 - Math.abs(by - ground) / 14) * 1.2;   // o ar quente baixo
  return bg;
}

/* ---- assar e registrar ---- */
const BKV = {
  granito: bake(vGranito), cantaria: bake(vCantaria), laje: bake(vLaje), bronze: bake(vBronze), grade: bake(vGrade), canal: bake(vCanal), tijolo: bake(vTijolo),
  eixo: bake(vEixo), comporta: bake(vComporta), cera: bake(vCera), barreira: bake(vBarreiraT), entulho: bake(vEntulho), seteira: bake(vSeteira), quente: bake(vQuente),
  granitoW: bake(vGranitoW), cantariaW: bake(vCantariaW), relevoW: bake(vRelevoW), bronzeW: bake(vBronzeW), tijoloW: bake(vTijoloW),
  dpSaloes: bake(vDpSaloes), dpMaquinas: bake(vDpMaquinas), dpForjas: bake(vDpForjas)
};
const AN_SOLID = [
  // id, paleta, textura, dureza, cor no mapa
  [AN_GRANITO, 'anGranito', 'granito', 0.95, '#5a646e'], [AN_CANTARIA, 'anCantaria', 'cantaria', 1.1, '#7a848c'], [AN_LAJE, 'anLaje', 'laje', 1.05, '#6a6052'],
  [AN_BRONZE, 'anBronze', 'bronze', 1.3, '#9a6a2c'], [AN_CANAL, 'anCanal', 'canal', 1.15, '#504640'], [AN_TIJOLO, 'anTijolo', 'tijolo', 1.0, '#9a7444'],
  [AN_EIXO, 'anBronze', 'eixo', 1.2, '#c49448'], [AN_COMPORTA, 'anComporta', 'comporta', 0, '#7c5424'], [AN_CERA, 'anCera', 'cera', 0.35, '#8a6c2a'],
  [AN_ENTULHO, 'anGranito', 'entulho', 0.3, '#5a5650'], [AN_SETEIRA, 'anCantaria', 'seteira', 1.1, '#646e78'], [AN_PEDRA_QUENTE, 'anQuente', 'quente', 0.08, '#e8700e']
];
for (const [t, p, k, dig, col] of AN_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [AN_GRANITO, AN_ENTULHO]) BLEND[t] = 1;
EMIT[AN_PEDRA_QUENTE] = 0.6;

WMAT[WAN_GRANITO] = [PALS.anGranitoW, BKV.granitoW]; WMAT[WAN_CANTARIA] = [PALS.anCantariaW, BKV.cantariaW]; WMAT[WAN_RELEVO] = [PALS.anCantariaW, BKV.relevoW];
WMAT[WAN_BRONZE] = [PALS.anBronzeW, BKV.bronzeW]; WMAT[WAN_TIJOLO] = [PALS.anTijoloW, BKV.tijoloW];
DMAT[DP_AN_SALOES] = [PALS.dpAnSaloes, BKV.dpSaloes]; DMAT[DP_AN_MAQUINAS] = [PALS.dpAnMaquinas, BKV.dpMaquinas]; DMAT[DP_AN_FORJAS] = [PALS.dpAnForjas, BKV.dpForjas];

/* ---- os minérios: carvão no granito, e o mithril: caroços pequenos e fios prata-azulados correndo pela pedra ---- */
oreRamp(AN_O_MITHRIL, ['#121a24', '#1e2a3a', '#2e4258', '#46627e', '#6a8eac', '#9cc0d8', '#d8eef8']);
ORE_PAINT[AN_O_MITHRIL] = function (L, s) {
  const R = ORE_RAMP[AN_O_MITHRIL], pts = oreNodes(L, s, R, 180, [2.6, 0.7], [1.3, 0.4]);
  for (let i = 0; i < 3; i++) {   // os fios saindo dos caroços, finos e tortos
    const [x0, y0] = pts[i % pts.length]; let a = hash2(s, i, 181) * 6.28, x = x0, y = y0;
    for (let k = 0; k < 8; k++) {
      x += Math.cos(a); y += Math.sin(a) * 0.8; a += (hash2(s, i * 9 + k, 182) - 0.5) * 1.4;
      const xi = Math.round(x), yi = Math.round(y); if (xi < 1 || yi < 1 || xi > 10 || yi > 10) break;
      if (!L.m[yi * 12 + xi]) L.put(xi, yi, R[k < 2 ? 6 : k < 5 ? 5 : 4], 3);
    }
  }
  const [sx, sy] = pts[0]; L.put(sx, sy, R[6], 9);
};
ORE_HALO[AN_O_MITHRIL] = { pal: ['anGranito', '#46627e', 0.3, 0.12], shade: 0.2 };
ORE_PAINT[AN_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[AN_O_CARVAO] = { pal: ['anGranito', '#020204', 0.5, 0.2], shade: 0 };
MAT[AN_O_CARVAO] = [PALS.anGranito, bakeOre(AN_O_CARVAO, vGranito)]; MAT[AN_O_MITHRIL] = [PALS.anGranito, bakeOre(AN_O_MITHRIL, vGranito)];
for (const t of [AN_O_CARVAO, AN_O_MITHRIL]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[AN_O_CARVAO] = DIG[COAL]; ORE_XP[AN_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[AN_O_CARVAO] = ORE_NAME[COAL]; PCOL[AN_O_CARVAO] = PCOL[COAL]; ORE_ITEM[AN_O_CARVAO] = ORE_ITEM[COAL];
DIG[AN_O_MITHRIL] = 1.28; ORE_XP[AN_O_MITHRIL] = 16; ORE_NAME[AN_O_MITHRIL] = 'Mithril'; PCOL[AN_O_MITHRIL] = '#9cc0d8'; ORE_ITEM[AN_O_MITHRIL] = 'min_mithril';
EMIT[AN_O_MITHRIL] = 0.15;   // fraco: os fios brilham um pouco no escuro

/* ---- itens de bloco ---- */
const AN_ITEMS = {
  granito_anao: ['Granito Anão', AN_GRANITO, 'Granito cinza-azulado de grão fino. Os anões cavaram uma fortaleza inteira nele.'],
  cantaria_ana: ['Cantaria Anã', AN_CANTARIA, 'Bloco reto de granito lavrado, com a junta tão fina que não passa uma lâmina.'],
  laje_gravada: ['Laje Gravada', AN_LAJE, 'Laje do chão dos salões, com uma faixa de runas que os pés já apagaram.'],
  chapa_bronze: ['Chapa de Bronze', AN_BRONZE, 'Chapa grossa e rebitada, com manchas verdes de pátina.'],
  grade_bronze: ['Grade de Bronze', AN_GRADE, 'Grade de passar por cima. Aguenta o peso e deixa ver o que corre embaixo.'],
  pedra_canal: ['Pedra de Canal', AN_CANAL, 'Pedra refratária e lisa dos canais de lava. Ainda está morna.'],
  tijolo_refratario: ['Tijolo Refratário', AN_TIJOLO, 'Tijolo amarelo queimado das forjas. Aguenta o fogo sem rachar.'],
  cera_seca: ['Cera Seca', AN_CERA, 'Favos de cera amarelo-sujos, secos e quebradiços. Não foi abelha nenhuma que fez isto.']
};
for (const id in AN_ITEMS) { const [name, block, desc] = AN_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
BLOCK_DROP[AN_ENTULHO] = 'granito_anao'; BLOCK_DROP[AN_EIXO] = 'chapa_bronze'; BLOCK_DROP[AN_SETEIRA] = 'cantaria_ana';
// AN_COMPORTA, AN_BARREIRA e AN_PEDRA_QUENTE não deixam nada

/* ================= decoração: sprites 12x12 em rampas ================= */
const DRAN = {
  bronze: ['#1a1006', '#2a1a0c', '#4a2e14', '#70461e', '#9a6a2c', '#c49448', '#e8c27a'],
  patina: ['#101a16', '#1a2a24', '#264036', '#345a4a', '#4a7a62', '#6a9a7e', '#94bca0'],
  granito: ['#14171b', '#1e2228', '#2e343c', '#424a54', '#5a646e', '#7a848c', '#9ea6ac'],
  ferro: ['#0a0b0d', '#16181c', '#24272c', '#363a40', '#4a5058', '#646c76', '#848c96'],
  madeira: ['#120c08', '#1e140c', '#2c1e12', '#3c2a1a', '#4e3824', '#62482e', '#76583a'],
  runa: HEX.runa, lava: HEX.lava, mithril: HEX.mithril, cera: HEX.cera, tijolo: HEX.tijolo,
  quitina: ['#1e1206', '#3a2208', '#5e380c', '#8a5414', '#b4761e', '#d89a34', '#f4c060']
};
for (const k in DRAN) DRAN[k] = DRAN[k].map(h => ph(h));
const patinaFlecks = (a, s, p = 0.12) => { for (let k = 0; k < 144; k++) if (a[k] && hash2(k, s, 18401) < p) a[k] = dPix(DRAN.patina, 2 + hash2(k, s, 18402) * 3); };

/* a escada anã: degraus de granito engastados na parede, corrimão de bronze dos dois lados; em cima o corrimão dobra
   para dentro da pedra num suporte rebitado, embaixo os pés de pedra */
function stepsSprite(k, s) {   // 0 meio, 1 meio com um degrau lascado, 2 topo, 3 pé
  const a = spr(), G = DRAN.granito, B = DRAN.bronze;
  for (const ry of k === 3 ? [2] : [2, 8]) for (let x = 3; x <= 8; x++) {
    const chip = k === 1 && ry === 8 && x >= 7;
    a.put(x, ry, G, chip ? 3 : 5.6 - (x - 3) * 0.2 + cg(x, ry, s) * 0.5); a.put(x, ry + 1, G, 3.8 + cg(x, ry + 1, s) * 0.5); a.put(x, ry + 2, G, 1.8);
  }
  const y0 = k === 2 ? 1 : 0, y1 = k === 3 ? 8 : 11;
  for (let y = y0; y <= y1; y++) for (const x0 of [1, 9]) { a.put(x0, y, B, 5 + cg(x0, y, s) * 0.5); a.put(x0 + 1, y, B, 3 + cg(x0 + 1, y, s) * 0.4); }
  if (k === 2) { for (let x = 0; x <= 11; x++) { a.put(x, 0, B, 5.2 - x * 0.15); a.put(x, 1, B, 2.6); } for (const x of [1, 10]) a.put(x, 0, B, 6.4); }
  if (k === 3) for (let y = 9; y < 12; y++) for (let x = 0; x <= 11; x++) if (x <= 3 || x >= 8) a.put(x, y, G, (y === 9 ? 5.4 : 3.4) - (x % 8) * 0.15 + cg(x, y, s) * 0.5);
  for (const x0 of [1, 9]) a.put(x0, 5, B, 6.2);                                                // o brilho do corrimão gasto pela mão
  patinaFlecks(a, s, 0.08);
  return rimOut(a, G[0]);
}
const ESCADA = [stepsSprite(0, 18411), stepsSprite(1, 18412), stepsSprite(2, 18413), stepsSprite(3, 18414)];

/* a corrente de bronze: um elo de frente, outro de lado, pátina nas juntas; a última acaba num gancho */
function chainSprite(end, s) {
  const a = spr(), F = DRAN.bronze;
  const face = (cy) => { for (let y = cy - 3; y <= cy + 3; y++) for (let x = 3; x <= 8; x++) { const dx = (x + 0.5 - 6) / 2.6, dy = (y + 0.5 - cy) / 3.6, d = dx * dx + dy * dy; if (d <= 1 && d >= 0.32) a.put(x, y, F, 4.9 - dx * 1.6 - dy * 1.2 + cg(x, y, s) * 0.5 + (dx < -0.5 && dy < 0 ? 1 : 0)); } };
  const side = (y0, y1) => { for (let y = y0; y <= y1; y++) { a.put(5, y, F, 5.6 + cg(5, y, s) * 0.4 - (y === y0 || y === y1 ? 1 : 0)); a.put(6, y, F, 2.6); } };
  side(-1, 1); face(4.5);
  if (!end) side(8, 12);
  else { a.put(5, 8, F, 4); a.put(6, 8, F, 2.6); for (let y = 9; y <= 10; y++) { a.put(5, y, F, 4.4); a.put(6, y, F, 2.4); } a.put(4, 11, F, 3.4); a.put(5, 11, F, 2.6); a.put(3, 10, F, 4.6); a.put(3, 9, F, 4); }
  patinaFlecks(a, s, 0.14);
  return rimOut(a, F[0]);
}
const CORRENTE = [chainSprite(false, 18421), chainSprite(false, 18422), chainSprite(true, 18423)];

/* a alavanca: no chunk só a base (um bloco de granito com a cabeça do pino de bronze e o encaixe da runa, apagado);
   o cabo e a runa acesa são desenhados ao vivo (LEVER) */
function leverBase(s) {
  const a = spr(), G = DRAN.granito, B = DRAN.bronze;
  for (let y = 7; y < 12; y++) for (let x = 2; x <= 9; x++) a.put(x, y, G, (y === 7 ? 5.6 : y === 8 ? 4.4 : 3.4) - (x - 2) * 0.2 - (y === 11 ? 1.2 : 0) + cg(x, y, s) * 0.5);
  for (let y = 9; y <= 11; y++) { a.put(1, y, G, 4); a.put(10, y, G, 2.2); }
  for (let x = 4; x <= 7; x++) a.put(x, 6, B, 4.6 - (x - 4) * 0.6);                          // o mancal do pino
  for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) if (runeAt(4, gx, gy + 1)) a.put(4 + gx, 8 + gy, G, 1.2);   // o sulco da runa
  return rimOut(a, G[0]);
}
const ALAVANCA = [leverBase(18431)];
// o cabo em 7 ângulos (de -0.65, solta e caída para a esquerda, a 0.65, puxada para a direita): haste de bronze e uma bola na ponta
const LEVER = { frames: [], runeOn: null, runeOff: null, angs: [] };
for (let i = 0; i < 7; i++) {
  const ang = -0.65 + i * (1.3 / 6), c = mk(T, T), x = c.getContext('2d'), B = HEX.bronze, sn = Math.sin(ang), cs = Math.cos(ang);
  for (let k = 0; k <= 5; k++) { const px = Math.round(5.5 + sn * k), py = Math.round(6.5 - cs * k); x.fillStyle = B[k < 2 ? 3 : 4]; x.fillRect(px, py, 1, 1); x.fillStyle = B[1]; x.fillRect(px + 1, py, 1, 1); }
  const kx = Math.round(5.5 + sn * 5.6), ky = Math.round(6.5 - cs * 5.6);
  x.fillStyle = B[2]; x.fillRect(kx - 1, ky - 1, 3, 3); x.fillStyle = B[4]; x.fillRect(kx - 1, ky - 1, 2, 2); x.fillStyle = B[5]; x.fillRect(kx - 1, ky - 1, 1, 1);
  x.fillStyle = B[0]; x.fillRect(kx + 1, ky + 1, 1, 1);
  LEVER.frames.push(c); LEVER.angs.push(ang);
}
LEVER.runeOn = (() => { const c = mk(3, 3), x = c.getContext('2d'); for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) if (runeAt(4, gx, gy + 1)) { x.fillStyle = gy === 1 && gx === 1 ? HEX.runa[5] : HEX.runa[4]; x.fillRect(gx, gy, 1, 1); } return c; })();

/* a lâmpada de runa na parede: placa de bronze, gaiola, um cristal de runa aceso por dentro (frio, parado) */
function lampSprite(k, s) {
  const a = spr(), B = DRAN.bronze, R = DRAN.runa;
  for (let y = 1; y <= 10; y++) for (let x = 3; x <= 8; x++) a.put(x, y, B, 2.2 + cg(x, y, s) * 0.4);   // a placa
  for (let x = 2; x <= 9; x++) { a.put(x, 1, B, 5.4 - (x - 2) * 0.3); a.put(x, 2, B, 3.2); a.put(x, 10, B, 4.6 - (x - 2) * 0.3); a.put(x, 11, B, 2); }
  for (let y = 3; y <= 9; y++) for (let x = 4; x <= 7; x++) {
    const d = Math.hypot(x - 5.2, (y - 5.6) * 0.7);
    a.put(x, y, R, 5.6 - d * 0.9 - (x === 7 ? 0.8 : 0));
  }
  for (let y = 3; y <= 9; y++) { a.put(3, y, B, 4.6); a.put(8, y, B, 2.6); }                    // a gaiola
  if (k) for (const y of [4, 8]) for (let x = 4; x <= 7; x++) a.put(x, y, B, 3.6 - (x - 4) * 0.4);
  else for (let x = 4; x <= 7; x++) a.put(x, 6, B, 3.8 - (x - 4) * 0.4);
  a.put(5, 0, B, 4.4); a.put(6, 0, B, 2.4);
  patinaFlecks(a, s, 0.05);
  return rimOut(a, B[0], false);
}
const LAMPADA = [lampSprite(0, 18441), lampSprite(1, 18442)];

/* o braseiro de forja: tigela de bronze em três pés, cheia de brasa viva (laranja firme) */
function brazierSprite(s) {
  const a = spr(), B = DRAN.bronze, L = DRAN.lava;
  for (let x = 2; x <= 9; x++) { const h = 1 + hash2(x, s, 1) * 1.8; for (let y = Math.round(5 - h); y < 5; y++) a.put(x, y, L, 3 + hash2(x, y, s) * 2.6 - (y < 4 ? 0 : 0.8)); }
  for (let y = 5; y <= 8; y++) { const hw = 5 - (y - 5) * 0.8; for (let x = Math.round(5.5 - hw); x <= Math.round(5.5 + hw) - 1; x++) a.put(x, y, B, (y === 5 ? 5.6 : 4) - (x - 1) * 0.3 - (y - 5) * 0.3 + cg(x, y, s) * 0.4); }
  for (const x of [3, 8]) for (let y = 9; y <= 11; y++) { a.put(x + (x < 5 ? -(y - 9) * 0.5 : (y - 9) * 0.5), y, B, x < 5 ? 4.4 : 2.6); }
  for (let y = 9; y <= 11; y++) a.put(5, y, B, 3.4);
  for (const x of [1, 2, 9, 10]) a.put(x, 11, B, 3);
  patinaFlecks(a, s, 0.06);
  return rimOut(a, B[0]);
}
const BRASEIRO = [brazierSprite(18451), brazierSprite(18452)];
const AN_BRASAS = [[3, 3], [5, 2], [7, 3], [6, 4]];   // os pontos mais vivos da brasa (por cima do escuro)

/* a runa no piso: uma laje baixa de granito com a runa funda, acesa em azul fraco */
function runeSprite(k, s) {
  const a = spr(), G = DRAN.granito, R = DRAN.runa;
  for (let y = 5; y < 12; y++) for (let x = 2; x <= 9; x++) { if (y === 5 && (x === 2 || x === 9)) continue; a.put(x, y, G, (y === 5 ? 5.4 : 3.8) - (x - 2) * 0.25 - (y - 5) * 0.15 + cg(x, y, s) * 0.5); }
  for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 3; gx++) if (runeAt(k, gx, gy)) a.put(4 + gx, 6 + gy, R, 3.6 + (gy === 0 ? 0.6 : 0));
  return rimOut(a, G[0]);
}
const RUNA_K = [1, 3, 6, 7];
const RUNA = RUNA_K.map((k, i) => runeSprite(k, 18461 + i));

/* um barril de cerveja de pé: aduelas de madeira escura, dois aros de bronze, a torneira de lado */
function barrelSprite(s) {
  const a = spr(), W = DRAN.madeira, B = DRAN.bronze;
  for (let y = 2; y < 12; y++) {
    const hw = 4 + Math.sin((y - 1.5) / 10 * Math.PI) * 0.9;
    for (let x = Math.round(5.5 - hw); x <= Math.round(5.5 + hw) - 1; x++) { const u = (x + 0.5 - 5.5) / hw; a.put(x, y, W, 4.4 - u * 1.8 - u * u * 0.8 + (x % 3 === 0 ? -0.8 : 0) + cg(x, y, s) * 0.5); }
  }
  for (let x = 2; x <= 9; x++) a.put(x, 1, W, 2.2 + hash2(x, s, 2));                          // a tampa
  for (const y of [3, 9]) for (let x = 1; x <= 10; x++) { const u = (x + 0.5 - 5.5) / 4.5; a.put(x, y, B, 5 - u * 1.8); }
  a.put(10, 6, B, 5); a.put(11, 6, B, 3); a.put(11, 7, B, 2.4);
  patinaFlecks(a, s, 0.04);
  return rimOut(a, W[0]);
}
const BARRIL = [barrelSprite(18471)];

/* a bigorna pequena: ferro escuro, a face de cima gasta e clara, o chifre à esquerda, num toco de granito */
function anvilSprite(s) {
  const a = spr(), F = DRAN.ferro, G = DRAN.granito;
  for (let x = 1; x <= 10; x++) { a.put(x, 3, F, x < 3 ? 4.6 : 6 - (x - 3) * 0.12); a.put(x, 4, F, 3.6 - x * 0.08 + cg(x, 4, s) * 0.4); }
  a.put(0, 3, F, 4); a.put(0, 4, F, 2.6);
  for (let x = 3; x <= 9; x++) a.put(x, 5, F, 2.4);
  for (let y = 6; y <= 7; y++) for (let x = 4; x <= 7; x++) a.put(x, y, F, 3.2 - (x - 4) * 0.5);
  for (let x = 3; x <= 8; x++) a.put(x, 8, F, 3.8 - (x - 3) * 0.4);
  for (let y = 9; y < 12; y++) for (let x = 2; x <= 9; x++) a.put(x, y, G, (y === 9 ? 4.8 : 3.4) - (x - 2) * 0.2 + cg(x, y, s) * 0.5);
  return rimOut(a, F[0]);
}
const BIGORNA = [anvilSprite(18481)];

/* tenazes e malhos: uma tenaz encostada na parede, um malho deitado com o cabo para a esquerda */
function toolsSprite(k, s) {
  const a = spr(), F = DRAN.ferro, W = DRAN.madeira;
  for (let i = 0; i <= 9; i++) { const y = 1 + i, x = 2 + i * 0.35; a.put(x, y, F, 4.6 - i * 0.1); a.put(x + 1, y, F, 2.4); if (i > 5) a.put(x + 2 + (i - 5) * 0.4, y, F, 3.4); }   // a tenaz
  if (k) { for (let y = 3; y <= 11; y++) { a.put(9, y, W, 4.2); a.put(10, y, W, 2.6); } for (let x = 7; x <= 11; x++) { a.put(x, 1, F, 5.2 - (x - 7) * 0.3); a.put(x, 2, F, 3.6); a.put(x, 3, F, 2.4); } }   // um malho em pé
  for (let x = 1; x <= 7; x++) { a.put(x, 10, W, 4.6 - x * 0.1 + cg(x, 10, s) * 0.4); a.put(x, 11, W, 2.4); }   // o cabo do malho deitado
  for (let y = 8; y < 12; y++) for (let x = 7; x <= 10; x++) a.put(x, y, F, (y === 8 ? 5.4 : 3.6) - (x - 7) * 0.4 - (y === 11 ? 1 : 0));
  return rimOut(a, F[0]);
}
const TENAZ = [toolsSprite(0, 18491), toolsSprite(1, 18492)];

/* o respiro de vapor: um toco de cano de bronze saindo do chão com uma grelha em cima (o vapor sai ao vivo) */
function ventSprite(s) {
  const a = spr(), B = DRAN.bronze;
  for (let y = 7; y < 12; y++) for (let x = 3; x <= 8; x++) a.put(x, y, B, 4.6 - (x - 3) * 0.55 + cg(x, y, s) * 0.4 - (y === 11 ? 0.6 : 0));
  for (let x = 2; x <= 9; x++) { a.put(x, 6, B, 5.6 - (x - 2) * 0.35); a.put(x, 8, B, 3 - (x - 2) * 0.2); }
  for (const x of [4, 6]) a.put(x, 6, B, 0.4);                                                 // as fendas da grelha
  for (let x = 1; x <= 10; x++) a.put(x, 11, B, x < 3 || x > 8 ? 3 : 3.4);                      // o flange no chão
  patinaFlecks(a, s, 0.18);
  return rimOut(a, B[0]);
}
const VAPOR = [ventSprite(18501)];

/* uma casca de quitina partida: um gomo arqueado de âmbar meio translúcido, com as faixas dos segmentos, o oco escuro
   por baixo e a borda quebrada */
function chitinSprite(k, s) {
  const a = spr(), Q = DRAN.quitina;
  for (let x = 0; x < 12; x++) {
    if (k ? x > 8 + (hash2(x, s, 1) < 0.5 ? 1 : 0) : x < 2 - (hash2(x, s, 2) < 0.5 ? 1 : 0)) continue;   // a borda quebrada
    const u = (x + 0.5) / 12, top = 11.2 - Math.sin(u * Math.PI) * 6.6, th = 2.2 + Math.sin(u * Math.PI) * 0.8;
    for (let y = Math.floor(top); y < 12; y++) {
      const d = y - top;
      if (d < th) a.put(x, y, Q, 4.6 - (u - 0.3) * 2.4 - d * 0.7 + (d < 0.8 ? 1.2 : 0) + ((x + 1) % 3 === 0 ? -1.1 : 0) + cg(x, y, s) * 0.5);
      else if (d < th + 2.5) a.put(x, y, Q, 0.4 + (d - th) * 0.1);                             // o oco
    }
  }
  if (!k) { a.put(4, 6, Q, 6.2); a.put(5, 5, Q, 6); } else { a.put(3, 6, Q, 6.2); a.put(6, 6, Q, 1); a.put(6, 7, Q, 0.8); }   // um brilho; num deles um furo
  return rimOut(a, Q[0]);
}
const QUITINA = [chitinSprite(0, 18511), chitinSprite(1, 18512)];

/* um elmo anão caído: cúpula de bronze com a crista, a cinta rebitada, o protetor de nariz, o oco escuro embaixo;
   o outro está amassado e virado */
function helmSprite(k, s) {
  const a = spr(), B = DRAN.bronze;
  disc(a, 6, 8.6, 4.6, 5.4, B, (dx, dy, d, x, y) => y > 8 ? -1 : 4.4 - dx * 1.4 - dy * 1.2 - d * 0.5 + cg(x, y, s) * 0.5);
  for (let x = 0; x < 12; x++) for (let y = 9; y < 12; y++) if (a[y * 12 + x] === dPix(B, -1)) a[y * 12 + x] = 0;
  for (let y = 4; y <= 8; y++) a.put(6, y, B, 6 - (y - 4) * 0.2);                               // a crista
  for (let x = 1; x <= 10; x++) { a.put(x, 8, B, 5.2 - (x - 1) * 0.3); a.put(x, 9, B, 2.6 - (x - 1) * 0.1); }   // a cinta
  for (const x of [2, 5, 8]) a.put(x, 8, B, 6.4);
  for (let x = 2; x <= 9; x++) if (x < 5 || x > 6) a.put(x, 10, B, 0.4);                         // o oco
  for (let y = 10; y <= 11; y++) { a.put(5, y, B, 4.6); a.put(6, y, B, 2.6); }                   // o protetor de nariz
  if (k) { a.put(3, 5, B, 1.6); a.put(4, 6, B, 1.8); a.put(3, 6, B, 2.4); a.put(4, 5, B, 5.4); }  // o amassado
  patinaFlecks(a, s, 0.12);
  const r = rimOut(a, B[0]);
  return k ? flipX(r) : r;
}
const ELMO = [helmSprite(0, 18521), helmSprite(1, 18522)];

/* o portão de runas: dois montantes grossos de bronze, barras finas e a placa com a runa acesa; o de cima tem a travessa */
function gateSprite(k, s) {
  const a = spr(), B = DRAN.bronze, R = DRAN.runa;
  for (let y = 0; y < T; y++) {
    for (const x0 of [0, 9]) { a.put(x0, y, B, 4.2); a.put(x0 + 1, y, B, 5.4 + cg(x0, y, s) * 0.3); a.put(x0 + 2, y, B, 2.4); }
    for (const x0 of [4, 7]) if (y < 3 || y > 8) { a.put(x0, y, B, 4.4); }
  }
  for (let y = 3; y <= 8; y++) for (let x = 3; x <= 8; x++) a.put(x, y, B, (y === 3 || x === 3 ? 4.6 : y === 8 || x === 8 ? 2 : 2.8));   // a placa
  for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 3; gx++) if (runeAt(k === 2 ? 3 : 6, gx, gy)) a.put(4 + gx, 3 + gy, R, 4.2);
  if (k === 2) for (let x = 0; x < T; x++) { a.put(x, 0, B, 5.4 - x * 0.12); a.put(x, 1, B, 2.6); }
  patinaFlecks(a, s, 0.06);
  return a;
}
const BARREIRA = [gateSprite(0, 18531), gateSprite(1, 18532), gateSprite(2, 18533)];
DECO[AN_BARREIRA] = BARREIRA; MAT[AN_BARREIRA] = [PALS.anBronze, BKV.barreira]; SOLID[AN_BARREIRA] = 1; DIG[AN_BARREIRA] = 0; PCOL[AN_BARREIRA] = '#3aa8d8'; SEETHRU[AN_BARREIRA] = 1; EMIT[AN_BARREIRA] = 0.35;

/* a grade de bronze sobre os canais: trilho rebitado em cima, barras, trilho embaixo; vê-se através */
function grateSprite(k, s) {
  const a = spr(), B = DRAN.bronze;
  for (let x = 0; x < T; x++) {
    a.put(x, 0, B, 5.6 - (x % 6 === 5 ? 1 : 0)); a.put(x, 1, B, 4.4 + cg(x, 1, s) * 0.4); a.put(x, 2, B, 2.4);
    a.put(x, 8, B, 4.2); a.put(x, 9, B, 2.2);
    if (x % 4 === 1) for (let y = 3; y <= 7; y++) a.put(x, y, B, 4.6 - (y - 3) * 0.2);
    else if (x % 4 === 2) for (let y = 3; y <= 7; y++) a.put(x, y, B, 2.4);
  }
  for (const x of [2, 8]) a.put(x, 1, B, 6.4);                                                 // rebites
  if (k) for (let x = 0; x < T; x++) if (x % 4 === 3) a.put(x, 5, B, 3.2);                        // uma travessa
  patinaFlecks(a, s, 0.1);
  return a;
}
const GRADE = [grateSprite(0, 18541), grateSprite(1, 18542)];
DECO[AN_GRADE] = GRADE; MAT[AN_GRADE] = [PALS.anBronze, BKV.grade]; SOLID[AN_GRADE] = 1; DIG[AN_GRADE] = 0.9; PCOL[AN_GRADE] = '#c49448'; SEETHRU[AN_GRADE] = 1;

DECO[AN_ESCADA] = ESCADA; DECO[AN_CORRENTE] = CORRENTE; DECO[AN_ALAVANCA] = ALAVANCA; DECO[AN_LAMPADA] = LAMPADA; DECO[AN_BRASEIRO] = BRASEIRO; DECO[AN_RUNA] = RUNA;
DECO[AN_BARRIL] = BARRIL; DECO[AN_BIGORNA] = BIGORNA; DECO[AN_TENAZ] = TENAZ; DECO[AN_VAPOR] = VAPOR; DECO[AN_QUITINA] = QUITINA; DECO[AN_ELMO] = ELMO;
const AN_DECO = [
  // id, dureza, cor no mapa, o que cai
  [AN_ESCADA, 0.3, '#7a848c', null], [AN_CORRENTE, 0.3, '#9a6a2c', null], [AN_ALAVANCA, 0, '#c49448', null], [AN_LAMPADA, 0.15, '#d0f4ff', null],
  [AN_BRASEIRO, 0.2, '#ffa62a', null], [AN_RUNA, 0.2, '#3aa8d8', null], [AN_BARRIL, 0.15, '#4e3824', 'madeira'], [AN_BIGORNA, 0.4, '#4a5058', null],
  [AN_TENAZ, 0.1, '#646c76', null], [AN_VAPOR, 0.3, '#70461e', null], [AN_QUITINA, 0.05, '#b4761e', null], [AN_ELMO, 0.08, '#9a6a2c', null]
];
for (const [t, dig, col, drop] of AN_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop && ITEMS[drop]) BLOCK_DROP[t] = drop; }
EMIT[AN_LAMPADA] = 0.85; EMIT[AN_BRASEIRO] = 0.85; EMIT[AN_RUNA] = 0.3; EMIT[AN_ALAVANCA] = 0.2;
// o que cai quando o apoio some (56, 87); a escada, a corrente e a alavanca ficam (atravessam vãos, ou são mecanismo)
for (const t of [AN_BRASEIRO, AN_RUNA, AN_BARRIL, AN_BIGORNA, AN_TENAZ, AN_VAPOR, AN_QUITINA, AN_ELMO]) CV_STANDS[t] = 1;

// qual variação vai onde
const lever186 = (gx, gy) => typeof afLeverCell === 'function' && afLeverCell(gx, gy);
DECO_PICK[AN_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== AN_ESCADA && solidAt(gx, gy - 1) ? arr[2] : tileAt(gx, gy + 1) !== AN_ESCADA && solidAt(gx, gy + 1) ? arr[3] : arr[hash2(gx, gy, 18551) < 0.2 ? 1 : 0];
DECO_PICK[AN_CORRENTE] = (gx, gy, arr) => tileAt(gx, gy + 1) === AN_CORRENTE || solidAt(gx, gy + 1) ? arr[(gy & 1) ? 1 : 0] : arr[2];
DECO_PICK[AN_BARREIRA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== AN_BARREIRA ? arr[2] : arr[(gy & 1) ? 1 : 0];
DECO_PICK[AN_GRADE] = (gx, gy, arr) => arr[hash2(gx, gy, 18552) < 0.3 ? 1 : 0];
DECO_PICK[AN_ALAVANCA] = (gx, gy, arr) => lever186(gx, gy) ? null : arr[0];
const runaVar = (gx, gy) => (hash2(gx, gy, 18553) * RUNA.length) | 0;
DECO_PICK[AN_RUNA] = (gx, gy, arr) => arr[runaVar(gx, gy)];

// a escada anã e a corrente se escalam como as correntes da catedral; a escada conta também como a escada da mina (a pose, 88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, AN_CORRENTE) || _tt(e, AN_ESCADA))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, AN_ESCADA)); }; }

/* ================= ao vivo: o eixo girando, a alavanca, os brilhos firmes, o vapor ================= */
// os 4 quadros da engrenagem girando (6 dentes: 4 quadros cobrem o passo de um dente), só o disco do encaixe
const GEAR = [0, 1, 2, 3].map(f => {
  const c = mk(T, T), x = c.getContext('2d'), img = x.createImageData(T, T), b = new Uint32Array(img.data.buffer), P = PALS.anBronze;
  for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) { const g = gearV(px, py, f * Math.PI / 12); if (g >= 0) b[py * T + px] = shadeOf(P, g); }
  x.putImageData(img, 0, 0); return c;
});
const AN_GLOW = {};
const anVis = []; let anVisKey = '', anVisT = 0;   // eixos, alavancas e respiros à vista: x, y, tile
const anLevAng = new Map();                         // alavanca -> ângulo atual do cabo (vai até o alvo)
const leverOn = (gx, gy) => typeof anLeverOn === 'function' && !!anLeverOn(gx, gy);
const leverReady = (gx, gy) => typeof anLeverReady !== 'function' || !!anLeverReady(gx, gy);
const lampDim = (gx, gy) => typeof anLampDim === 'function' ? anLampDim(gx, gy) : 1;
HOOK.update.push(dt => {
  if (!ANOES || state !== 'play') return;
  const x0 = Math.floor(cam.x / T) - 1, y0 = Math.max(0, Math.floor(cam.y / T) - 1), key = x0 + ',' + y0;
  if (key !== anVisKey || (anVisT -= dt) <= 0) {
    anVisKey = key; anVisT = 0.5; anVis.length = 0;
    const y1 = Math.min(WH - 1, y0 + Math.ceil(VH / T) + 2), x1 = x0 + Math.ceil(VW / T) + 2;
    if (inAnoes(y0) || inAnoes(y1) || (y0 < AN_S0 && y1 >= AN_S0 + AN_D)) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = tileAt(x, y); if (t === AN_EIXO || t === AN_VAPOR || (t === AN_ALAVANCA && !lever186(x, y))) anVis.push(x, y, t); }
  }
  for (let i = 0; i < anVis.length; i += 3) {
    const gx = anVis[i], gy = anVis[i + 1], t = anVis[i + 2];
    if (t === AN_ALAVANCA) { const k = wrapX(gx) + ',' + gy, goal = leverOn(gx, gy) ? 0.65 : -0.65, a = anLevAng.has(k) ? anLevAng.get(k) : goal; anLevAng.set(k, approach(a, goal, dt * 5)); }
    else if (t === AN_VAPOR && parts.length < 500 && Math.random() < dt * 3.2 && tileAt(gx, gy) === AN_VAPOR) {   // baforadas de vapor, sem dano
      const big = Math.random() < 0.3;
      parts.push({ x: gx * T + 4 + Math.random() * 4, y: gy * T + 5, vx: rnd(-4, 4), vy: rnd(-26, -14), g: -4, life: rnd(1.0, 1.8), max: 1.8, col: Math.random() < 0.5 ? '#8a949c' : '#a8b2b8', size: big ? 3 : 2, smoke: true });
    }
  }
});
const sx = (gx, cx) => { let x = gx * T - cx; const W = WW * T; if (x < -W / 2) x += W; else if (x > W / 2) x -= W; return x; };
// o eixo e o cabo da alavanca, iluminados como o mundo
HOOK.drawWorld.push((cx, cy) => {
  if (!ANOES || !anVis.length) return;
  for (let i = 0; i < anVis.length; i += 3) {
    const gx = anVis[i], gy = anVis[i + 1], t = anVis[i + 2]; if (tileAt(gx, gy) !== t) continue;
    const x = Math.round(sx(gx, cx)), y = gy * T - cy;
    if (t === AN_EIXO) { const d = (gx + gy) & 1 ? 1 : -1, f = ((Math.floor(gameTime * 10 + hash2(gx, gy, 18562) * 4) * d) % 4 + 4) % 4; lc.drawImage(GEAR[f], x, y); }
    else if (t === AN_ALAVANCA) { const a = anLevAng.get(wrapX(gx) + ',' + gy); const f = Math.max(0, Math.min(6, Math.round(((a === undefined ? (leverOn(gx, gy) ? 0.65 : -0.65) : a) + 0.65) / 1.3 * 6))); lc.drawImage(LEVER.frames[f], x, y); }
  }
});
// os brilhos: lâmpada branco-azulada parada, braseiro laranja parado, runas azuis fracas, o portão, o mithril e a pedra quente
HOOK.drawGlow.push((cx, cy) => {
  if (!ANOES) return;
  if (!AN_GLOW.lamp) { AN_GLOW.lamp = glow(30, '#a8dcff'); AN_GLOW.core = glow(10, '#e4f6ff'); AN_GLOW.brasa = glow(30, '#ff8a2a'); AN_GLOW.runa = glow(14, '#3aa8d8'); AN_GLOW.mith = glow(9, '#9cc0d8'); AN_GLOW.quente = glow(14, '#ff7a1a'); }
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t < AN_GRANITO || t > AN_PEDRA_QUENTE) continue;
    const gx = emitters[i], gy = emitters[i + 1], X = gx * T + 6 - cx, Y = gy * T + 6 - cy;
    if (t === AN_LAMPADA) { const k = lampDim(gx, gy); lc.globalAlpha = 0.34 * k; lc.drawImage(AN_GLOW.lamp, X - 30, Y - 30); lc.globalAlpha = 0.5 * k; lc.drawImage(AN_GLOW.core, X - 10, Y - 10); }
    else if (t === AN_BRASEIRO) { lc.globalAlpha = 0.34; lc.drawImage(AN_GLOW.brasa, X - 30, Y - 32); }
    else if (t === AN_RUNA) { lc.globalAlpha = 0.2; lc.drawImage(AN_GLOW.runa, X - 14, Y - 13); }
    else if (t === AN_ALAVANCA) { if (lever186(gx, gy) || !leverReady(gx, gy)) continue; lc.globalAlpha = 0.16; lc.drawImage(AN_GLOW.runa, X - 14, Y - 11); }
    else if (t === AN_BARREIRA) { if (gy & 1) continue; lc.globalAlpha = 0.16 + Math.sin(gameTime * 1.2 + gy * 0.5) * 0.04; lc.drawImage(AN_GLOW.runa, X - 14, Y - 14); }
    else if (t === AN_O_MITHRIL) { if ((gx + gy) & 1) continue; lc.globalAlpha = 0.08 + Math.sin(gameTime * 1.3 + gx * 0.7 + gy) * 0.035; lc.drawImage(AN_GLOW.mith, X - 9, Y - 9); }
    else if (t === AN_PEDRA_QUENTE) { lc.globalAlpha = 0.22 + Math.sin(gameTime * 0.8 + gx) * 0.03; lc.drawImage(AN_GLOW.quente, X - 14, Y - 14); }
  }
  lc.globalAlpha = 1;
});
// por cima do escuro: o miolo do cristal, a brasa, as runas acesas
HOOK.drawTop.push((cx, cy) => {
  if (!ANOES) return;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (t !== AN_LAMPADA && t !== AN_BRASEIRO && t !== AN_RUNA && t !== AN_ALAVANCA && t !== AN_BARREIRA) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = Math.round(sx(gx, cx)), y = gy * T - cy;
    if (t === AN_LAMPADA) { lc.globalAlpha = lampDim(gx, gy); lc.fillStyle = HEX.runa[4]; lc.fillRect(x + 4, y + 4, 3, 4); lc.fillStyle = HEX.runa[5]; lc.fillRect(x + 5, y + 4, 1, 3); lc.globalAlpha = 1; }
    else if (t === AN_BRASEIRO) { lc.fillStyle = HEX.lava[4]; for (const [px, py] of AN_BRASAS) lc.fillRect(x + px, y + py, 1, 1); lc.fillStyle = HEX.lava[5]; lc.fillRect(x + 5, y + 3, 1, 1); }
    else if (t === AN_RUNA) { const k = RUNA_K[runaVar(gx, gy)]; lc.globalAlpha = 0.75; lc.fillStyle = HEX.runa[4]; for (let gy2 = 0; gy2 < 5; gy2++) for (let gx2 = 0; gx2 < 3; gx2++) if (runeAt(k, gx2, gy2)) lc.fillRect(x + 4 + gx2, y + 6 + gy2, 1, 1); lc.globalAlpha = 1; }
    else if (t === AN_ALAVANCA) { if (!lever186(gx, gy) && leverReady(gx, gy)) lc.drawImage(LEVER.runeOn, x + 4, y + 8); }
    else { const k = tileAt(gx, gy - 1) !== AN_BARREIRA ? 3 : 6; lc.globalAlpha = 0.6 + Math.sin(gameTime * 1.2 + gy * 0.5) * 0.15; lc.fillStyle = HEX.runa[4]; for (let gy2 = 0; gy2 < 5; gy2++) for (let gx2 = 0; gx2 < 3; gx2++) if (runeAt(k, gx2, gy2)) lc.fillRect(x + 4 + gx2, y + 3 + gy2, 1, 1); lc.globalAlpha = 1; }
  }
});

Object.assign(ANART, { HEX, DRAN, RUNES, runeAt, cg, cn, cells, dPix, cvSprite, spr, rimOut, disc, flipX, courses, patinaFlecks, BRONZE, PATINA, LAVAC, RUNAC, GRAN, SOOT,
  vGranito, vCantaria, vLaje, vBronze, vCanal, vTijolo, vCera, vEntulho, vQuente, gearV, GEAR, LEVER, AN_GLOW, anVis, anLevAng });
}
