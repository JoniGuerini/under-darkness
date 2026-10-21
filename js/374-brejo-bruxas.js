'use strict';

/* ================= o Brejo das Bruxas: as bruxas e quem as caça =================
   Os outros cinco dos dez bichos da sexta camada (docs/camadas/06-brejo-bruxas.md, seção 6; os do pântano estão no
   373). Gente: as bruxas do brejo e o que sobrou dos caçadores que vieram atrás delas.
   - a Bruxa da Vassoura (bjvassoura, voadora): passa por cima, rindo. A gargalhada e o frasco verde acendendo na mão
     (0,7 s) e ela solta o frasco: ele cai e quebra numa poça de veneno que borbulha 4 s no chão;
   - a Mão de Glória (bjmao, voadora, controle): a mão de enforcado seca com as velas nos dedos, flutuando. As chamas
     se inclinam para o herói e crescem (0,8 s): quem estiver OLHANDO para ela, com ela à vista e a menos de 8
     blocos, fica paralisado 1,2 s. Quem vira de costas não sofre nada. Também recua (o aviso) e investe;
   - o Caçador de Bruxas Afogado (bjinquisidor, corpo a corpo): o chapéu de aba larga, o casaco encharcado, o escudo
     de ferro com a cruz e a espada. Bloqueia de frente com o escudo. Ergue a espada (o brilho, 0,55 s) e desce o
     golpe por cima; ou planta os pés com o escudo à frente (0,4 s) e dá o tranco. Sobe escadas;
   - a Lavadeira da Noite (bjlavadeira, distância): a lavadeira das lendas, que lava a mortalha de quem vai morrer.
     Torce a mortalha (0,8 s, a água escorrendo) e joga em arco: quem é pego fica ENROLADO (não ataca, anda devagar,
     1,5 s);
   - a Bruxa do Boneco (bjbruxa, maldição): ergue o boneco de pano e a linha aparece esticada dela até o herói (1 s);
     depois três alfinetadas, cada uma com o brilho do alfinete antes. Sair da vista dela ou acertá-la corta a linha.
   Peças do 373 (BJB). Prefixo bj. */

Object.assign(ET, {
  bjvassoura: { name: 'Bruxa da Vassoura', w: 16, h: 18, hp: 70, dmg: 16, xp: 22, kb: 0.7, fly: true, blood: '#3a2a22' },
  bjmao: { name: 'Mão de Glória', w: 10, h: 12, hp: 55, dmg: 14, xp: 18, kb: 0.8, fly: true, blood: '#5a4a36' },
  bjinquisidor: { name: 'Caçador de Bruxas Afogado', w: 12, h: 22, hp: 95, dmg: 22, xp: 26, kb: 0.4, fly: false, climbs: true, blood: '#3a2a22' },
  bjlavadeira: { name: 'Lavadeira da Noite', w: 12, h: 22, hp: 65, dmg: 16, xp: 20, kb: 0.6, fly: false, blood: '#3a2a22' },
  bjbruxa: { name: 'Bruxa do Boneco', w: 12, h: 22, hp: 70, dmg: 11, xp: 22, kb: 0.6, fly: false, blood: '#3a2a22' }
});
const BJ2_TYPES = ['bjvassoura', 'bjmao', 'bjinquisidor', 'bjlavadeira', 'bjbruxa'];
const BJ2_DROPS = {
  bjvassoura: [['min_ferrobrejo', 0.1], ['erva_brejo', 0.35], ['pocao', 0.1], ['pocao_mana', 0.08]],
  bjmao: [['min_ferrobrejo', 0.08], ['vela_preta', 0.4], ['pocao_mana', 0.08]],
  bjinquisidor: [['min_ferrobrejo', 0.22, 1, 2], ['pocao', 0.1], ['chapeu_cacador', 0.012], ['fisga_turfeiro', 0.012]],
  bjlavadeira: [['min_ferrobrejo', 0.1], ['erva_brejo', 0.25], ['pocao', 0.1], ['botas_atoleiro', 0.012]],
  bjbruxa: [['min_ferrobrejo', 0.12], ['erva_brejo', 0.3], ['vela_preta', 0.2], ['pocao_mana', 0.1], ['chapeu_cacador', 0.012]]
};
function bj2Tables() { for (const k of BJ2_TYPES) DROPS[k] = BJ2_DROPS[k].filter(([id]) => ITEMS[id]); }
bj2Tables();
Object.assign(NAV_WALKERS, { bjinquisidor: 1, bjlavadeira: 1, bjbruxa: 1 });
Object.assign(CV_STEP, { bjinquisidor: 1, bjlavadeira: 1, bjbruxa: 1 });

const BJ2_RISO = 0.7, BJ2_CHAMA = 0.8, BJ2_ERGUE = 0.55, BJ2_PLANTA = 0.4, BJ2_TORCE = 0.8, BJ2_LINHA = 1, BJ2_ALFINETE = 0.35;
const BJ2_OLHAR = 8 * T, BJ2_POCA = 4;

/* ================= arte ================= */
const BJ2 = {};
{
const { BR, setO, ell, tubo, poly, perna, braco, saia, cp, cg } = BJB;
// o rosto de velha: o nariz comprido de gancho, o queixo, o olho fundo; cabelo branco solto
function velhaCabeca(P, hx, hy, s, cab = BR.cinzaV, pele = BR.bruxa) {
  for (let i = 0; i < 7; i++) tubo(P, hx - 1.6 + i * 0.3, hy - 2, hx - 3.6 - i * 0.2, hy + 4 + i * 0.6, 0.6, 0.4, cab, 2.6 + (i % 2) * 0.8, s + i);
  ell(P, hx, hy, 2.4, 2.8, 0.1, pele, s + 8, 2.8);
  P.put(hx + 2.4, hy + 0.2, pele, 3.4); P.put(hx + 3.2, hy + 0.8, pele, 3); P.put(hx + 3.4, hy + 1.6, pele, 2.4);   // o nariz
  P.put(hx + 1.4, hy + 2.6, pele, 3.2); P.put(hx + 2, hy + 2.8, pele, 2.6);                                        // o queixo
  P.put(hx + 1.2, hy - 0.4, pele, 0.2); P.put(hx + 1, hy + 1.8, pele, 0.6);
}
// o chapéu de bruxa: a aba larga, a copa torta caída para trás
function chapeuBruxa(P, hx, hy, s) {
  for (let x = hx - 5; x <= hx + 5; x += 0.5) P.put(x, hy - 2.2 + Math.abs(x - hx) * 0.05, BR.chapeu, 2.6 + (x < hx ? 0.4 : 0));
  poly(P, [[hx - 2.6, hy - 2.4], [hx + 2.8, hy - 2.4], [hx + 0.6, hy - 6], [hx - 2, hy - 8.4], [hx - 3.6, hy - 9]], BR.chapeu, (x, y) => 2.4 - (x - hx) * 0.2 + cg(x, y, s) * 0.4);
}

/* ---------- a Bruxa da Vassoura, 30 x 22: o corpo no x 14, a vassoura na linha 18 ---------- */
const VA_BX = 14, VA_FY = 21;
function vassoura(k) {   // 0-1 voando (a capa batendo), 2 rindo com o frasco aceso (aviso), 3 soltou
  const P = cp(30, 22), s = 37401 + k * 5;
  // a vassoura: o cabo comprido, a palha amarrada atrás
  tubo(P, VA_BX - 9, 17.4, VA_BX + 12, 15.6, 0.7, 0.6, BR.pau, 3, s);
  for (let i = 0; i < 8; i++) tubo(P, VA_BX - 9, 17.4, VA_BX - 15 + (i % 3) * 0.3, 15 + i * 0.8, 0.6, 0.5, BR.palha, 3 + (i % 2) * 0.8, s + i);
  for (let y = 15.4; y < 19; y += 0.5) P.put(VA_BX - 8.6, y, BR.corda, 4);
  // a capa preta voando para trás
  const fl = k === 1 ? 2 : 0;
  poly(P, [[VA_BX - 2, 6], [VA_BX + 2, 6], [VA_BX + 3, 16], [VA_BX - 9, 16 - fl], [VA_BX - 12, 10 - fl]], BR.chapeu, (x, y) => 2.2 + (Math.abs(Math.sin(x * 0.9 + y * 0.3)) < 0.25 ? -0.8 : 0) + cg(x, y, s) * 0.4 - (x < VA_BX - 8 && hash2(x, y, s) < 0.3 ? 9 : 0));
  // sentada de lado: a saia, a perna, a bota de bico
  saia(P, VA_BX - 3, VA_BX + 3, 10, 16, BR.roxo, s + 1, 1.4, 0.3);
  tubo(P, VA_BX + 2, 15.4, VA_BX + 5, 19, 0.9, 0.7, BR.roxo, 2, s + 2); for (let x = VA_BX + 4.4; x <= VA_BX + 7; x += 0.5) P.put(x, 19.6 - (x > VA_BX + 6.4 ? 0.6 : 0), BR.couro, 2.6);
  velhaCabeca(P, VA_BX + 1, 4.6, s + 3);
  chapeuBruxa(P, VA_BX + 1, 4.6, s + 4);
  // o braço segurando o cabo, o outro com o frasco
  braco(P, VA_BX, 8, VA_BX + 7, 15.4, BR.bruxa, 2.6, s + 5, 0.7, 0.8);
  const fh = k === 2 ? [VA_BX + 6, 1] : k === 3 ? [VA_BX + 8, 9] : [VA_BX + 4, 10];
  braco(P, VA_BX + 1.4, 8.4, fh[0], fh[1], BR.bruxa, 3.2, s + 6, 0.7, 0.8);
  if (k !== 3) { ell(P, fh[0] + 0.6, fh[1] - 1.6, 1.4, 1.6, 0, BR.vidro, s + 7, 3.6); P.put(fh[0] + 0.6, fh[1] - 3.4, BR.pau, 3); }
  return setO(P.done());
}
function frasco() { const P = cp(6, 7), s = 37421; ell(P, 3, 4.4, 2.2, 2.2, 0, BR.vidro, s, 3.4); P.put(3, 1.6, BR.vidro, 4); P.put(3, 0.6, BR.pau, 3); P.put(2.2, 3.4, BR.vidro, 5.6); return setO(P.done()); }

/* ---------- a Mão de Glória, 16 x 18: o pulso embaixo (linha 17), os dedos para cima com as velas ---------- */
function maoGloria(k) {   // 0-1 flutuando, 2 as chamas crescendo (aviso), 3 investindo (dedos para a frente)
  const P = cp(16, 18), s = 37431 + k * 3, fw = k === 3;
  // o pulso cortado, o pano amarrado, a palma seca
  ell(P, 7, 13.6, 3.6, 3, fw ? -0.4 : 0, BR.pele, s, 2.8);
  for (let x = 4; x <= 10; x += 0.5) P.put(x, 16.4, BR.pano, 3); for (let x = 4.6; x <= 9.6; x += 0.5) P.put(x, 17.2, BR.pano, 2.2);
  // os cinco dedos magros, as juntas, cada um com um toco de vela
  const D = [[3.6, 9, -0.4], [5.4, 6.6, -0.15], [7.4, 6, 0], [9.2, 6.8, 0.15], [11, 10.4, 0.55]];
  D.forEach(([x0, top, a], i) => {
    const tx = x0 + Math.sin(a) * 3 + (fw ? 3 : 0), ty = top + (fw ? 2 : 0);
    tubo(P, x0 + 0.4, 12, tx, ty, 0.7, 0.55, BR.pele, 2.8 + (i > 2 ? -0.3 : 0.3), s + i);
    P.put((x0 + tx) / 2, (12 + ty) / 2, BR.pele, 1.2);
    if (i < 4) { for (let j = 1; j <= 2; j++) P.put(tx, ty - j, BR.vela, 3.6 - j * 0.4); P.put(tx, ty - 3, BR.pau, 1); }   // a vela e o pavio
  });
  return setO(P.done());
}
const MAO_PAVIO = [[3.6 + Math.sin(-0.4) * 3, 6], [5.4 + Math.sin(-0.15) * 3, 3.6], [7.4, 3], [9.2 + Math.sin(0.15) * 3, 3.8]];

/* ---------- o Caçador de Bruxas Afogado, 30 x 28: o corpo no x 13, os pés na linha 27 ---------- */
const IN_BX = 13, IN_FY = 27;
function inquisidor(k) {   // 0 guarda, 1-2 andando, 3 a espada erguida (aviso), 4 o golpe, 5 o escudo plantado (aviso), 6 o tranco
  const P = cp(30, 28), s = 37441 + k * 5, wk = k === 1 ? 1 : k === 2 ? -1 : 0, lean = k === 4 ? 1.4 : k === 6 ? 2 : k === 5 ? 0.8 : 0;
  // as botas altas, as calças
  perna(P, IN_BX - 1.2 + lean * 0.3, 17, IN_BX - 2.2 - wk * 2 - (k >= 5 ? 1.6 : 0), IN_FY, BR.couro, 1.8, s, 1.3, 0.6);
  // o casaco comprido encharcado, a gola larga de linho
  saia(P, IN_BX - 3 + lean, IN_BX + 3 + lean, 8.6, 21, BR.chapeu, s + 1, 1.4, 0.35);
  for (let x = IN_BX - 3 + lean; x <= IN_BX + 3 + lean; x += 0.5) P.put(x, 9, BR.linho, 4.2 - Math.abs(x - IN_BX - lean) * 0.2);
  for (let x = IN_BX - 2.6 + lean; x <= IN_BX + 2.6 + lean; x += 0.5) P.put(x, 15, BR.couro, 3.2);   // o cinto
  P.put(IN_BX + lean, 15, BR.ferro, 4.4);
  perna(P, IN_BX + 1.2 + lean * 0.3, 17, IN_BX + 2.2 + wk * 2 + (k >= 5 ? 1.4 : 0), IN_FY, BR.couro, 2.6, s + 2, 1.3, 0.6);
  // a cabeça: o rosto inchado de afogado, o chapéu de aba larga e copa alta (o capotain), a fivela
  const hx = IN_BX + 1 + lean, hy = 5.4;
  ell(P, hx, hy, 2.4, 2.8, 0, BR.morto, s + 3, 2.8);
  P.put(hx + 1.4, hy - 0.2, BR.morto, 0.2); P.put(hx + 1.2, hy + 1.8, BR.morto, 0.8);
  for (let x = hx - 6; x <= hx + 6; x += 0.5) P.put(x, hy - 2.4 + (Math.abs(x - hx) > 4.6 ? 0.6 : 0), BR.chapeu, 2.8 + (x < hx ? 0.5 : 0));
  poly(P, [[hx - 2.8, hy - 2.6], [hx + 2.8, hy - 2.6], [hx + 2.4, hy - 7.6], [hx - 2.4, hy - 7.6]], BR.chapeu, (x, y) => 2.4 - (x - hx) * 0.25 + cg(x, y, s) * 0.3);
  for (let x = hx - 2.6; x <= hx + 2.6; x += 0.5) P.put(x, hy - 3.6, BR.couro, 3);
  P.put(hx + 0.4, hy - 3.6, BR.ferrugem, 4.6);
  // a espada: o braço de perto; guardada em pé, erguida acima da cabeça, ou descida na frente
  const sw = k === 3 ? [[hx + 1, hy - 4], [hx - 4, hy - 12]] : k === 4 ? [[IN_BX + 7 + lean, 14], [IN_BX + 15, 22]] : [[IN_BX + 5, 14], [IN_BX + 8, 3]];
  // o escudo: o braço de trás, na frente do corpo, com a cruz
  const sh = k >= 5 ? [IN_BX + 6 + lean, 13] : k === 3 || k === 4 ? [IN_BX + 1 + lean, 14] : [IN_BX + 4, 13];
  braco(P, IN_BX - 0.6 + lean, 10, sh[0] - 1, sh[1], BR.chapeu, 1.8, s + 4, 0.9, 0);
  ell(P, sh[0], sh[1], 2.8, 4, 0, BR.ferro, s + 5, 2.8, (u, v) => [BR.ferro, Math.abs(u) < 0.18 || Math.abs(v + 0.15) < 0.12 ? 1.4 : 0]);
  for (const [x, y] of [[-2, -3], [2, -3], [-2, 3], [2, 3]]) P.put(sh[0] + x, sh[1] + y, BR.ferrugem, 4);
  braco(P, IN_BX + 1.4 + lean, 10.4, sw[0][0], sw[0][1], BR.chapeu, 2.8, s + 6, 0.9, 0.9);
  const [a, b] = sw; tubo(P, a[0], a[1], b[0], b[1], 0.6, 0.45, BR.ferro, 3.8, s + 7);
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  for (let w = -2; w <= 2; w += 0.5) P.put(a[0] + ux * 1.4 - uy * w, a[1] + uy * 1.4 + ux * w, BR.ferro, 3.4);   // a guarda
  // a água escorrendo do casaco
  for (let i = 0; i < 4; i++) P.put(IN_BX - 3 + i * 2 + lean, 21 + (i % 2), BR.lodo, 4);
  return setO(P.done());
}

/* ---------- a Lavadeira da Noite, 30 x 28: o corpo no x 12, os pés na linha 27 ---------- */
const LA_BX = 12, LA_FY = 27;
function lavadeira(k) {   // 0 de pé, 1-2 andando, 3 agachada lavando, 4 torcendo (aviso), 5 jogou
  const P = cp(30, 28), s = 37461 + k * 5, wk = k === 1 ? 1 : k === 2 ? -1 : 0, kneel = k === 3;
  const top = kneel ? 7 : 0;
  // a saia comprida molhada, o avental
  saia(P, LA_BX - 3, LA_BX + 3, 9 + top, LA_FY, BR.linho, s, kneel ? 4 : 2 + Math.abs(wk) * 0.6, 0.3);
  poly(P, [[LA_BX - 1 + 0.4, 12 + top], [LA_BX + 3, 12 + top], [LA_BX + 3.6, 22 + top * 0.5], [LA_BX - 0.4, 22 + top * 0.5]], BR.pano, (x, y) => 2.6 + cg(x, y, s) * 0.4);
  // o corpo magro, o xale
  ell(P, LA_BX + 0.4, 10 + top, 3, 3.4, 0.1, BR.pano, s + 1, 2.4);
  // a cabeça: o lenço amarrado, o rosto de velha (a lenda: os dentes compridos, os pés de pato não se veem)
  const hx = LA_BX + 1.2 + (kneel ? 1.4 : 0), hy = 5 + top;
  velhaCabeca(P, hx, hy, s + 2, BR.cinzaV, BR.morto);
  poly(P, [[hx - 3, hy - 1], [hx - 2, hy - 3.4], [hx + 2, hy - 3.6], [hx + 3, hy - 1.6], [hx - 4.4, hy + 4]], BR.linho, (x, y) => 3 - (x - hx) * 0.15 + cg(x, y, s) * 0.3);
  // a mortalha nas mãos: esfregando no chão; torcida (um rolo com a água pingando); jogada
  if (k === 3) { braco(P, LA_BX + 1, 11 + top, LA_BX + 8, LA_FY - 1, BR.morto, 3, s + 3, 0.7, 0.8); for (let x = LA_BX + 5; x < LA_BX + 15; x++) P.put(x, LA_FY - 0.4 + Math.sin(x) * 0.4, BR.linho, 4.2); }
  else if (k === 4) { braco(P, LA_BX - 0.4, 10, LA_BX + 5, 9, BR.morto, 2.4, s + 3, 0.7, 0.8); braco(P, LA_BX + 1.4, 10.4, LA_BX + 9, 10.4, BR.morto, 3, s + 4, 0.7, 0.8); for (let x = LA_BX + 4.4; x < LA_BX + 10; x += 0.5) { const tw = Math.sin(x * 2.4); P.put(x, 9.6 + tw * 0.6, BR.linho, 4 + tw); P.put(x, 10.4 - tw * 0.6, BR.linho, 3 - tw); } }
  else if (k === 5) braco(P, LA_BX + 1.4, 10.4, LA_BX + 9, 5, BR.morto, 3, s + 3, 0.7, 0.8);
  else { braco(P, LA_BX + 1.4, 10.4, LA_BX + 3.4, 17, BR.morto, 3, s + 3, 0.7, 0.8); for (let y = 16; y < 24; y++) P.put(LA_BX + 3.6 + Math.sin(y * 0.8) * 0.4, y, BR.linho, 3.8 - (y - 16) * 0.15); }
  if (!kneel) { for (let x = LA_BX - 2; x <= LA_BX + 3; x += 0.5) P.put(x - wk, LA_FY, BR.lodo, 2.6); }
  return setO(P.done());
}
// a mortalha voando (4 quadros: o pano abrindo e virando)
function mortalha(k) {
  const P = cp(16, 12), s = 37481 + k;
  for (let i = 0; i < 12; i++) { const t = i / 11, x = 2 + t * 12, y = 6 + Math.sin(t * 5 + k * 1.6) * 3, h = 2 + Math.sin(t * Math.PI) * 2.4; for (let j = -h; j <= h; j += 0.5) P.put(x, y + j, BR.linho, 3.4 - j / h * 1.2 + (i % 3 === 0 ? -0.6 : 0)); }
  return setO(P.done());
}

/* ---------- a Bruxa do Boneco, 28 x 28: o corpo no x 12, os pés na linha 27 ---------- */
const BU_BX = 12, BU_FY = 27;
function bruxa(k) {   // 0 de pé, 1-2 andando, 3 o boneco erguido (a linha), 4 a alfinetada
  const P = cp(28, 28), s = 37491 + k * 5, wk = k === 1 ? 1 : k === 2 ? -1 : 0;
  // o manto vinho comprido, remendado, o capuz caído nas costas
  saia(P, BU_BX - 3.4, BU_BX + 3, 8, BU_FY, BR.vinho, s, 2 + Math.abs(wk) * 0.6, 0.35);
  for (let i = 0; i < 4; i++) { const y = 12 + i * 4, x = BU_BX - 2 + (i % 2) * 3; P.put(x, y, BR.pano, 3); P.put(x + 1, y, BR.pano, 2.4); }   // os remendos
  poly(P, [[BU_BX - 4, 6], [BU_BX - 1, 5], [BU_BX - 1, 10], [BU_BX - 5, 11]], BR.vinho, (x, y) => 1.8 + cg(x, y, s) * 0.4);
  // os colares de ossinhos e de dentes
  for (let x = BU_BX - 2; x <= BU_BX + 2.6; x += 1) P.put(x, 9 + Math.abs(x - BU_BX) * 0.3, BR.osso, 4.4);
  velhaCabeca(P, BU_BX + 1, 4.6, s + 1);
  // o braço de trás com os alfinetes; o de perto com o boneco
  const ph = k === 3 ? [BU_BX + 7, 3] : k === 4 ? [BU_BX + 6, 5] : [BU_BX + 4, 13];
  braco(P, BU_BX - 0.6, 9, k === 4 ? BU_BX + 5 : BU_BX - 2, k === 4 ? 2 : 15, BR.bruxa, 2, s + 2, 0.7, 0.8);
  if (k === 4) for (let j = 0; j < 4; j++) P.put(BU_BX + 5 - j * 0.3, 1 - j, BR.ferro, 4.6 - j * 0.4);   // o alfinete na mão de trás
  braco(P, BU_BX + 1.4, 9.4, ph[0], ph[1], BR.bruxa, 3, s + 3, 0.7, 0.8);
  // o boneco de pano: a cabecinha costurada, os braços de linha, alfinetes já espetados
  const bx = ph[0] + 0.6, by = ph[1] - 3;
  ell(P, bx, by, 1.6, 1.4, 0, BR.palha, s + 4, 3.4); poly(P, [[bx - 1.4, by + 1], [bx + 1.4, by + 1], [bx + 2, by + 5], [bx - 2, by + 5]], BR.palha, (x, y) => 3 + cg(x, y, s) * 0.5);
  P.put(bx - 0.6, by, BR.bico, 0.4); P.put(bx + 0.6, by, BR.bico, 0.4); P.put(bx - 2.4, by + 2, BR.palha, 3); P.put(bx + 2.4, by + 2, BR.palha, 2.6);
  P.put(bx + 0.6, by + 2.6, BR.ferro, 4.6); P.put(bx + 1.4, by + 1.8, BR.ferro, 5);
  return setO(P.done());
}

BJ2.get = () => BJ2.ready || (BJ2.ready = {
  va: [0, 1, 2, 3].map(vassoura), fr: frasco(), mg: [0, 1, 2, 3].map(maoGloria), inq: [0, 1, 2, 3, 4, 5, 6].map(inquisidor),
  la: [0, 1, 2, 3, 4, 5].map(lavadeira), mo: [0, 1, 2, 3].map(mortalha), bu: [0, 1, 2, 3, 4].map(bruxa)
});
Object.assign(BJ2, { VA_BX, VA_FY, IN_BX, IN_FY, LA_BX, LA_FY, BU_BX, BU_FY, MAO_PAVIO, velhaCabeca, chapeuBruxa });
}

/* ================= desenho ================= */
const bjBob = (e, a = 1.4) => Math.round(Math.sin(e.t * 2.6 + e.seed * 6) * a);
DRAW_E.bjvassoura = (e, fx, fy, fl) => { const k = e.state === 'cackle' ? 2 : e.state === 'drop' ? 3 : Math.floor(e.t * 6) % 2; bjBlit(cvPick(BJ2.get().va[k], e, fl), e, fx, fy + bjBob(e), BJ2.VA_BX + 1, BJ2.VA_FY - 2, bjJit(e, e.state === 'cackle', 30)); };
EYES_E.bjvassoura = (e, fx, fy) => {
  if (e.state !== 'cackle') return; const q = clamp(1 - e.stateT / BJ2_RISO, 0, 1), [x, y] = [fx + 7 * e.facing, fy + bjBob(e) - 1 - (BJ2.VA_FY - 2 - 0)];
  lc.globalAlpha = 0.3 + q * 0.6; lc.drawImage(bjGl('frascoG', 9, BJ_COL.veneno), Math.round(x) - 9, Math.round(y) - 9);
};
WARN_E.bjvassoura = e => e.state === 'cackle';

DRAW_E.bjmao = (e, fx, fy, fl) => { const k = e.state === 'flare' ? 2 : e.state === 'swoop' ? 3 : Math.floor(e.t * 3) % 2; const img = cvPick(BJ2.get().mg[k], e, fl); lc.drawImage(img, Math.round(fx - img.width / 2), fy - img.height + 2 + bjBob(e, 2)); };
// as quatro chamas nos dedos: pequenas, crescem e se inclinam para o herói no aviso (desenhadas por cima do escuro)
function bjMaoChamas(e, cx, cy, top) {
  const img = BJ2.get().mg[0].r, X0 = Math.round(e.x + e.w / 2 - img.width / 2 - cx), Y0 = Math.round(e.y + e.h - img.height + 2 + bjBob(e, 2) - cy);
  const flare = e.state === 'flare' ? clamp(1 - e.stateT / BJ2_CHAMA, 0, 1) : 0, lean = e.state === 'flare' ? Math.sign(pl.x + pl.w / 2 - (e.x + e.w / 2)) * flare * 2 : 0;
  for (let i = 0; i < 4; i++) {
    let [px, py] = BJ2.MAO_PAVIO[i]; if (e.facing < 0) px = img.width - 1 - px; px += 1; py += 1;
    const x = X0 + px, y = Y0 + py, f = Math.floor(gameTime * 9 + i * 1.7) % 3, H = 2 + Math.round(flare * 3);
    if (top) for (let j = 0; j < H; j++) { lc.fillStyle = j === 0 ? '#fff6e0' : j < H - 1 ? '#ffd890' : '#d8883a'; lc.fillRect(x + Math.round(lean * j / H) + (j === H - 1 && f === 1 ? 1 : 0), y - j, 1, 1); }
    else { lc.globalAlpha = 0.22 + flare * 0.5; lc.drawImage(bjGl('maoC', 8 + Math.round(flare * 4), BJ_COL.vela), x - 8 - Math.round(flare * 4), y - 9 - Math.round(flare * 4)); }
  }
  lc.globalAlpha = 1;
}
WARN_E.bjmao = e => e.state === 'flare' || e.state === 'pull';

const bjInPose = e => e.state === 'raise' ? 3 : e.state === 'cleave' ? 4 : e.state === 'plant' ? 5 : e.state === 'bash' ? 6 : Math.abs(e.vx) > 4 && e.onGround ? 1 + Math.floor(e.t * 5) % 2 : 0;
DRAW_E.bjinquisidor = (e, fx, fy, fl) => bjBlit(cvPick(BJ2.get().inq[bjInPose(e)], e, fl), e, fx, fy, BJ2.IN_BX + 1, BJ2.IN_FY + 1, bjJit(e, e.state === 'plant', 40));
EYES_E.bjinquisidor = (e, fx, fy) => {   // o brilho na ponta da espada erguida
  if (e.state !== 'raise') return; const q = clamp(1 - e.stateT / BJ2_ERGUE, 0, 1), x = fx + (1 + 0 - 4 + 1) * e.facing, y = fy - 1 - (BJ2.IN_FY - (5.4 - 12));
  lc.globalAlpha = 0.4 + q * 0.6; lc.drawImage(bjGl('espadaB', 6, '#f4f0e0'), Math.round(x - 1) - 6, Math.round(y) - 6);
};
WARN_E.bjinquisidor = e => e.state === 'raise' || e.state === 'plant';
// o escudo de frente aguenta o golpe: só andando ou parado, virado para o herói
BLOCK_E.bjinquisidor = (e, dir) => (e.state === 'walk' || e.state === 'plant') && e.stun <= 0 && dir === -e.facing;

const bjLaPose = e => e.state === 'wash' ? 3 : e.state === 'wring' ? 4 : e.state === 'throw' ? 5 : Math.abs(e.vx) > 4 && e.onGround ? 1 + Math.floor(e.t * 4) % 2 : 0;
DRAW_E.bjlavadeira = (e, fx, fy, fl) => bjBlit(cvPick(BJ2.get().la[bjLaPose(e)], e, fl), e, fx, fy, BJ2.LA_BX + 1, BJ2.LA_FY + 1, bjJit(e, e.state === 'wring' && e.stateT < 0.3, 30));
EYES_E.bjlavadeira = (e, fx, fy) => { const kneel = e.state === 'wash'; lc.globalAlpha = e.state === 'wring' ? 0.75 : 0.3; lc.drawImage(bjGl('olhoL', 3, '#c8d0e0'), Math.round(fx + (2.4 + (kneel ? 1.4 : 0)) * e.facing) - 3, Math.round(fy - 1 - (BJ2.LA_FY - (4.6 + (kneel ? 7 : 0)))) - 3); };
WARN_E.bjlavadeira = e => e.state === 'wring';

const bjBuPose = e => e.state === 'raise' || e.state === 'pins' ? (e.state === 'pins' && e.pinT < 0.12 ? 4 : 3) : Math.abs(e.vx) > 4 && e.onGround ? 1 + Math.floor(e.t * 4) % 2 : 0;
DRAW_E.bjbruxa = (e, fx, fy, fl) => bjBlit(cvPick(BJ2.get().bu[bjBuPose(e)], e, fl), e, fx, fy, BJ2.BU_BX + 1, BJ2.BU_FY + 1);
EYES_E.bjbruxa = (e, fx, fy) => { lc.globalAlpha = e.state === 'raise' || e.state === 'pins' ? 0.8 : 0.3; lc.drawImage(bjGl('olhoB', 3, '#d0f080'), Math.round(fx + 2.2 * e.facing) - 3, Math.round(fy - 1 - (BJ2.BU_FY - 4.2)) - 3); };
WARN_E.bjbruxa = e => e.state === 'raise' || (e.state === 'pins' && e.pinT > 0);

/* ================= comportamento ================= */
const bj2Frascos = [], bj2Pocas = [], bj2Mortalhas = [];
const bjHover = (e, tx, ty, sp, dt, acc = 360) => { const ax = tx - (e.x + e.w / 2), ay = ty - (e.y + e.h / 2); e.vx = approach(e.vx, clamp(ax * 3, -sp, sp), acc * dt); e.vy = approach(e.vy, clamp(ay * 3, -sp, sp), acc * dt); };
// a altura que dá para voar acima do herói (até n blocos), sem bater no teto
function bjTeto(x, y, n) { const tx = Math.floor(x / T); let ty = Math.floor(y / T), k = 0; while (k < n && !solidAt(tx, ty - 1)) { ty--; k++; } return (ty + 1) * T - 4; }

/* ---------- a Bruxa da Vassoura ---------- */
AI.bjvassoura = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'cackle') {
    bjHover(e, pcx - e.facing * 8, Math.min(e.y + e.h / 2, bjTeto(pcx, pcy, 6)), 50, dt);
    if (e.stateT <= 0) {
      e.state = 'drop'; e.stateT = 0.5;
      const [x, y] = bjPt(e, BJ2.VA_BX + 7, 2, BJ2.VA_BX, BJ2.VA_FY - 2);
      bj2Frascos.push({ x, y, vx: e.vx * 0.6, vy: 20, t: 0, dmg: e.dmg }); sfx.bjSolta(Math.max(0.5, bjNear(e)));
    }
    return;
  }
  if (e.state === 'drop') { if (e.stateT <= 0) { e.state = 'fly'; e.atkCD = 2.6 + Math.random() * 1.4; } }
  else e.state = 'fly';
  let tx, ty;
  if (!aggro) { cvWander(e, dt); tx = e.x + (e.wander || 0) * 50; ty = (e.homeY || e.y) + Math.sin(e.t) * 8; }
  else { const sweep = Math.sin(e.t * 0.8 + e.seed * 5) * 70; tx = pcx + sweep; ty = bjTeto(pcx + sweep, pcy, 6) + 6; }
  bjHover(e, tx, ty, aggro ? 90 : 36, dt);
  e.facing = Math.sign(e.vx) || e.facing;
  if (Math.random() < dt * 0.25 && aggro) sfx.bjRiso(Math.max(0.2, bjNear(e, 260) * 0.5));
  if (aggro && e.atkCD <= 0 && !pl.dead && e.sees && Math.abs(dx) < 3 * T && dy > 2 * T && dy < 9 * T && e.state === 'fly') { e.state = 'cackle'; e.stateT = BJ2_RISO; sfx.bjRiso(Math.max(0.5, bjNear(e, 260))); }
};

/* ---------- a Mão de Glória ---------- */
AI.bjmao = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'flare') {   // as chamas crescem para o herói: quem olha fica preso
    e.vx *= Math.pow(0.03, dt); e.vy *= Math.pow(0.03, dt);
    if (e.stateT <= 0) {
      e.state = 'float'; e.atkCD = 2.4 + Math.random();
      const look = pl.facing === (Math.sign(e.x + e.w / 2 - pcx) || pl.facing);
      if (!pl.dead && look && dist < BJ2_OLHAR && clearPath(e, pl)) { bjParalisar(1.2); sfx.bjParalisa(1); bjSparks(pcx, pl.y + 4, 6, ['#ffd890', '#fff6e0'], 40, 0, 0.5); }
      else sfx.bjApaga(Math.max(0.3, bjNear(e)));
    }
    return;
  }
  if (e.state === 'pull') {   // recua um pouco antes de investir
    const d = Math.hypot(dx, dy) || 1; e.vx = approach(e.vx, -dx / d * 50, 400 * dt); e.vy = approach(e.vy, -dy / d * 50, 400 * dt);
    if (e.stateT <= 0) { e.state = 'swoop'; e.stateT = 0.45; e.sv = [dx / d * 230, dy / d * 230]; e.hitThis = false; sfx.bjInveste(Math.max(0.5, bjNear(e))); }
    return;
  }
  if (e.state === 'swoop') {
    e.vx = e.sv[0]; e.vy = e.sv[1]; e.facing = Math.sign(e.vx) || e.facing;
    if (!e.hitThis && !pl.dead && overlap(e, pl)) { e.hitThis = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); e.stateT = 0; }
    if (e.stateT <= 0 || e.hitWall) { e.state = 'float'; e.atkCD = 1.8 + Math.random(); }
    return;
  }
  e.state = 'float';
  let tx, ty;
  if (!aggro) { cvWander(e, dt); tx = e.x + (e.wander || 0) * 30; ty = (e.homeY || e.y) + Math.sin(e.t) * 6; }
  else { const side = Math.sign(e.x + e.w / 2 - pcx) || 1; tx = pcx + side * 6 * T; ty = pcy - 2 * T + Math.sin(e.t * 1.7) * 8; }
  bjHover(e, tx, ty, aggro ? 60 : 24, dt, 240);
  e.facing = aggro ? (Math.sign(dx) || e.facing) : (Math.sign(e.vx) || e.facing);
  if (!aggro || e.atkCD > 0 || pl.dead || !e.sees) return;
  if (dist < BJ2_OLHAR && (e.alt = !e.alt)) { e.state = 'flare'; e.stateT = BJ2_CHAMA; sfx.bjChama(Math.max(0.5, bjNear(e))); }
  else if (dist < 8 * T) { e.state = 'pull'; e.stateT = 0.5; }
};

/* ---------- o Caçador de Bruxas Afogado ---------- */
AI.bjinquisidor = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const cx = e.x + e.w / 2;
  if (e.state === 'raise') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'cleave'; e.stateT = 0.22; e.hitThis = false; sfx.bjGolpe(Math.max(0.5, bjNear(e))); } return; }
  if (e.state === 'cleave') {   // a espada desce na frente
    const hb = { x: e.facing > 0 ? cx : cx - 24, y: e.y - 4, w: 24, h: e.h + 4 };
    if (!e.hitThis && !pl.dead && overlap(hb, pl)) { e.hitThis = true; const r = hurtPlayer(e.dmg, cx, e, false); if (r === 'hit') { pl.vx += e.facing * 70; bjSparks(pl.x + pl.w / 2, pl.y + 6, 4, ['#a42e30', '#c84a44'], 50, 100, 0.4, false); } }
    if (e.stateT <= 0) { e.state = 'recover'; e.stateT = 0.6; }
    return;
  }
  if (e.state === 'plant') { e.vx = approach(e.vx, 0, 900 * dt); if (e.stateT <= 0) { e.state = 'bash'; e.stateT = 0.28; e.hitThis = false; e.vx = e.facing * 170; sfx.bjTranco(Math.max(0.5, bjNear(e))); } return; }
  if (e.state === 'bash') {
    e.vx = e.facing * 170;
    const hb = { x: e.facing > 0 ? cx : cx - 16, y: e.y + 2, w: 16, h: e.h - 4 };
    if (!e.hitThis && !pl.dead && overlap(hb, pl)) { e.hitThis = true; const r = hurtPlayer(Math.round(e.dmg * 0.7), cx, e, false); if (r === 'hit') { pl.vx = e.facing * 220; pl.vy = -120; shake(2); } e.stateT = Math.min(e.stateT, 0.05); }
    if (e.stateT <= 0 || e.hitWall) { e.state = 'recover'; e.stateT = 0.5; e.vx = 0; }
    return;
  }
  if (e.state === 'recover') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1 + Math.random() * 0.8; } return; }
  e.state = 'walk';
  let dir = 0;
  if (aggro) dir = Math.abs(dx) < 18 ? 0 : Math.sign(dx); else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 40 : 16, 500, 260, dy, aggro);
  if (aggro && e.onGround) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (!aggro || e.atkCD > 0 || !e.onGround || pl.dead || !clearPath(e, pl)) return;
  if (Math.abs(dx) < 26 && Math.abs(dy) < 20) { e.state = 'raise'; e.stateT = BJ2_ERGUE; e.vx = 0; sfx.bjErgue(Math.max(0.5, bjNear(e))); }
  else if (Math.abs(dx) < 4.5 * T && Math.abs(dy) < 12 && Math.random() < 0.5) { e.state = 'plant'; e.stateT = BJ2_PLANTA; e.vx = 0; sfx.bjPlanta(Math.max(0.5, bjNear(e))); }
  else e.atkCD = 0.4;
};

/* ---------- a Lavadeira da Noite ---------- */
AI.bjlavadeira = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'wring') {   // torce a mortalha: a água escorre
    e.vx = approach(e.vx, 0, 700 * dt);
    if (Math.random() < dt * 16) { const [x, y] = bjPt(e, BJ2.LA_BX + 7, 11, BJ2.LA_BX, BJ2.LA_FY); bjP0(x + rnd(-2, 2), y); }
    if (e.stateT <= 0) {
      e.state = 'throw'; e.stateT = 0.4;
      const [x, y] = bjPt(e, BJ2.LA_BX + 9, 5, BJ2.LA_BX, BJ2.LA_FY), tx = pl.x + pl.w / 2, ty = pl.y + pl.h / 2, tFl = clamp(Math.abs(tx - x) / 150, 0.45, 1.1);
      bj2Mortalhas.push({ x, y, vx: (tx - x) / tFl, vy: (ty - y) / tFl - 0.5 * 380 * tFl, t: 0, dmg: e.dmg, hit: false }); sfx.bjJoga(Math.max(0.5, bjNear(e)));
    }
    return;
  }
  if (e.state === 'throw') { if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 2.4 + Math.random(); } return; }
  if (e.state === 'wash') {   // lavando a mortalha na beira, cantando baixinho
    e.vx = 0; if (Math.random() < dt * 0.3) sfx.bjLava(Math.max(0.2, bjNear(e) * 0.6));
    if (aggro && e.sees) { e.state = 'walk'; e.facing = Math.sign(dx) || e.facing; } return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const ideal = 7 * T; dir = Math.abs(dx) < ideal - T ? -Math.sign(dx) : Math.abs(dx) > ideal + 2 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; if (!dir && Math.random() < dt * 0.2) { e.state = 'wash'; return; } }
  walk(e, dt, dir, aggro ? 34 : 14, 500, 250, dy, aggro && dir === Math.sign(dx));
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (aggro && e.atkCD <= 0 && e.onGround && !pl.dead && e.sees && dist < 11 * T && Math.abs(dy) < 5 * T) { e.state = 'wring'; e.stateT = BJ2_TORCE; e.vx = 0; sfx.bjTorce(Math.max(0.5, bjNear(e))); }
};
const bjP0 = (x, y) => BJB.bjP({ x, y, vx: rnd(-4, 4), vy: 20, g: 300, life: 0.5, max: 0.5, col: '#7a6a4a', size: 1, lit: false });

/* ---------- a Bruxa do Boneco ---------- */
AI.bjbruxa = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'raise' || e.state === 'pins') {   // a linha esticada até o herói: some se ele sair da vista
    e.vx = approach(e.vx, 0, 700 * dt); e.facing = Math.sign(dx) || e.facing;
    e.losT = (e.losT || 0) - dt; if (e.losT <= 0) { e.losT = 0.1; e.lineOk = !pl.dead && dist < 13 * T && clearPath(e, pl); }
    if (!e.lineOk) { e.state = 'walk'; e.atkCD = 1.4; sfx.bjCorta(Math.max(0.4, bjNear(e))); return; }
    if (e.state === 'raise') { if (e.stateT <= 0) { e.state = 'pins'; e.pins = equip.head && ITEMS[equip.head.id] && ITEMS[equip.head.id].bjCaca ? 2 : 3; e.pinT = BJ2_ALFINETE; } return; }
    e.pinT -= dt;
    if (e.pinT <= 0) {   // a alfinetada: o boneco sente, o herói também
      e.pins--; e.pinT = BJ2_ALFINETE; pl.invuln = Math.min(pl.invuln, 0);
      const r = hurtPlayer(e.dmg, e.x + e.w / 2, null, true); sfx.bjAlfinete(1);
      if (r === 'hit') bjSparks(pl.x + pl.w / 2 + rnd(-3, 3), pl.y + rnd(4, 16), 4, ['#a42e30', '#ece6c8'], 30, 60, 0.3, false);
      if (e.pins <= 0) { e.state = 'walk'; e.atkCD = 3 + Math.random(); }
    }
    return;
  }
  e.state = 'walk';
  let dir = 0;
  if (aggro) { const ideal = 6 * T; dir = Math.abs(dx) < ideal - T ? -Math.sign(dx) : Math.abs(dx) > ideal + 2 * T ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 30 : 12, 500, 250, dy, aggro && dir === Math.sign(dx));
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
  if (aggro && e.atkCD <= 0 && e.onGround && !pl.dead && e.sees && dist < 10 * T) { e.state = 'raise'; e.stateT = BJ2_LINHA; e.lineOk = true; e.losT = 0.1; sfx.bjBoneco(Math.max(0.5, bjNear(e))); }
};

/* ---------- golpes e nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !BJ2_TYPES.includes(e.type)) return r;
  if (e.type === 'bjbruxa' && (e.state === 'raise' || e.state === 'pins') && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1.2); sfx.bjCorta(0.8); }   // acertada: a linha corta
  if (e.type === 'bjmao' && e.state === 'flare' && e.stun > 0) { e.state = 'float'; e.atkCD = Math.max(e.atkCD, 1.2); }
  if (e.type === 'bjinquisidor' && (e.state === 'raise' || e.state === 'cleave' || e.state === 'bash')) e.stun = 0;   // não para no meio do golpe
  if (e.type === 'bjlavadeira' && e.state === 'wash') e.state = 'walk';
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!BJ2_TYPES.includes(e.type)) return r;
  const v = Math.max(0.3, bjNear(e, 260));
  if (e.type === 'bjvassoura') { sfx.bjGrito(v); }
  else if (e.type === 'bjmao') sfx.bjApaga(v);
  else sfx.bjCaiMorto(v);
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !BJ2_TYPES.includes(type)) return e;
  e.atkCD = 0.8 + Math.random() * 0.8; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2;
  e.state = type === 'bjvassoura' ? 'fly' : type === 'bjmao' ? 'float' : type === 'bjlavadeira' && Math.random() < 0.6 ? 'wash' : 'walk';
  return e;
}; }

/* ---------- a cada quadro: os frascos caindo, as poças, as mortalhas voando ---------- */
function bj2Update(dt) {
  for (let i = bj2Frascos.length - 1; i >= 0; i--) {
    const F = bj2Frascos[i]; F.t += dt; F.vy = Math.min(F.vy + 420 * dt, 360); F.x += F.vx * dt; F.y += F.vy * dt;
    const tx = Math.floor(F.x / T), ty = Math.floor(F.y / T), hitH = bjHits(F.x, F.y, 2);
    if (hitH || solidAt(tx, ty) || aguaAt(tx, ty) || F.t > 4) {
      if (hitH) hurtPlayer(Math.round(F.dmg * 0.6), F.x, null, true);
      const g = solidAt(tx, ty) ? ty * T : bjFloor(F.x, F.y - 4, 6);
      sfx.bjQuebra(Math.max(0.3, clamp(1 - Math.hypot(pl.x - F.x, pl.y - F.y) / 260, 0, 1)));
      bjSparks(F.x, F.y, 8, ['#5a8e5c', '#82b478', '#c8f07a'], 60, 300, 0.5, false);
      if (g !== null) bj2Pocas.push({ x: F.x, y: g, t: 0, w: 1.6 * T, dps: Math.max(2, Math.round(F.dmg * 0.35)), seed: Math.random() * 9 });
      bj2Frascos.splice(i, 1);
    }
  }
  for (let i = bj2Pocas.length - 1; i >= 0; i--) {
    const Pq = bj2Pocas[i]; Pq.t += dt;
    if (!pl.dead && Math.abs(pl.x + pl.w / 2 - Pq.x) < Pq.w && Math.abs(pl.y + pl.h - Pq.y) < 6) bjEnvenenar(1, Pq.dps);
    if (Math.random() < dt * 8) BJB.bjP({ x: Pq.x + rnd(-Pq.w, Pq.w), y: Pq.y - 1, vx: 0, vy: -12, g: 0, life: 0.5, max: 0.5, col: '#82b478', size: 1, lit: true });
    if (Pq.t > BJ2_POCA) bj2Pocas.splice(i, 1);
  }
  for (let i = bj2Mortalhas.length - 1; i >= 0; i--) {
    const M = bj2Mortalhas[i]; M.t += dt; M.vy = Math.min(M.vy + 380 * dt, 300); M.x += M.vx * dt; M.y += M.vy * dt;
    if (Math.random() < dt * 10) bjP0(M.x, M.y + 3);
    if (!M.hit && bjHits(M.x, M.y, 5)) { M.hit = true; const r = hurtPlayer(M.dmg, M.x - Math.sign(M.vx) * 6, null, true); if (r === 'hit') { bjEnrolar(1.5); sfx.bjEnrola(1); } bj2Mortalhas.splice(i, 1); continue; }
    if (solidAt(Math.floor(M.x / T), Math.floor(M.y / T)) || M.t > 3) { bjLama(M.x, M.y, 4, 20, -30, ['#686052', '#867e6c', '#4a443a']); bj2Mortalhas.splice(i, 1); }
  }
}
HOOK.update.push(bj2Update);
{ const _nw = newWorld; newWorld = function (sd, sv) { bj2Frascos.length = 0; bj2Pocas.length = 0; bj2Mortalhas.length = 0; bj2Tables(); return _nw(sd, sv); }; }

// a luz que eles dão: só a vela da Mão, o frasco aceso, as poças de veneno
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) { if (e.dead) continue; if (e.type === 'bjmao') addL(e.x + e.w / 2, e.y, e.state === 'flare' ? 0.5 : 0.22); else if (e.type === 'bjvassoura' && e.state === 'cackle') addL(e.x + e.w / 2 + e.facing * 7, e.y, 0.3); }
  for (const Pq of bj2Pocas) addL(Pq.x, Pq.y - 4, 0.18);
}; }

HOOK.drawWorld.push((cx, cy) => {
  const B = BJ2.get();
  for (const F of bj2Frascos) lc.drawImage(B.fr.r, Math.round(F.x - cx - 3), Math.round(F.y - cy - 4));
  for (const M of bj2Mortalhas) { const img = B.mo[Math.floor(M.t * 10) % 4][M.vx >= 0 ? 'r' : 'l']; lc.drawImage(img, Math.round(M.x - cx - img.width / 2), Math.round(M.y - cy - img.height / 2)); }
  for (const Pq of bj2Pocas) {   // a poça verde no chão, borbulhando
    const a = Math.min(1, (BJ2_POCA - Pq.t) * 2), x0 = Math.round(Pq.x - Pq.w - cx), y = Math.round(Pq.y - cy), W = Math.round(Pq.w * 2);
    lc.globalAlpha = 0.85 * a;
    for (let x = 0; x < W; x++) { const e2 = Math.abs(x - W / 2) / (W / 2), h = e2 > 0.85 ? 1 : 2; lc.fillStyle = (x + Math.floor(gameTime * 6)) % 5 === 0 ? '#82b478' : '#3e6a44'; lc.fillRect(x0 + x, y - h, 1, h); }
    lc.fillStyle = '#c8f07a'; const b = Math.floor((gameTime * 3 + Pq.seed) % 1 * W); lc.fillRect(x0 + b, y - 3, 1, 1);
  }
  lc.globalAlpha = 1;
});
HOOK.drawGlow.push((cx, cy) => {
  for (const e of enemies) if (!e.dead && e.type === 'bjmao') bjMaoChamas(e, cx, cy, false);
  for (const Pq of bj2Pocas) { lc.globalAlpha = 0.25 * Math.min(1, (BJ2_POCA - Pq.t) * 2); lc.drawImage(bjGl('poca', 16, BJ_COL.veneno), Math.round(Pq.x - cx) - 16, Math.round(Pq.y - cy) - 18); }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'bjmao') bjMaoChamas(e, cx, cy, true);
    else if (e.type === 'bjbruxa' && (e.state === 'raise' || e.state === 'pins') && !pl.dead) {   // a linha do boneco até o herói
      const [bx, by] = bjPt(e, BJ2.BU_BX + 7.6, 2, BJ2.BU_BX, BJ2.BU_FY), hx = pl.x + pl.w / 2, hy = pl.y + 8;
      const q = e.state === 'raise' ? clamp(1 - e.stateT / BJ2_LINHA, 0, 1) : 1, n = Math.ceil(Math.hypot(hx - bx, hy - by) / 2);
      lc.globalAlpha = 0.35 + 0.5 * q; lc.fillStyle = '#e8d8c8';
      for (let j = 0; j <= n * q; j++) { const t = j / n, sag = Math.sin(t * Math.PI) * (1 - q) * 10; lc.fillRect(Math.round(bx + (hx - bx) * t - cx), Math.round(by + (hy - by) * t + sag - cy), 1, 1); }
      if (e.state === 'pins' && e.pinT < 0.15) { lc.globalAlpha = 1; lc.fillStyle = '#ffffff'; const X = Math.round(hx - cx), Y = Math.round(hy - cy); lc.fillRect(X - 2, Y, 5, 1); lc.fillRect(X, Y - 2, 1, 5); }   // o brilho do alfinete
    }
  }
  lc.globalAlpha = 1;
});

/* ---------- sons ---------- */
Object.assign(sfx, {
  bjRiso(v = 1) { for (let k = 0; k < 5; k++) tone(700 - k * 40 + Math.random() * 60, 0.09, 'sawtooth', 0.016 * v, -120, k * 0.11); },
  bjSolta(v = 1) { tone(900, 0.1, 'sine', 0.02 * v, -300); },
  bjQuebra(v = 1) { for (let k = 0; k < 4; k++) noise(0.05, 0.06 * v, 3000 + k * 500, 'bandpass', k * 0.03, 4); noise(0.3, 0.04 * v, 600, 'lowpass', 0.05); tone(200, 0.4, 'sine', 0.01 * v, 60, 0.1); },
  bjChama(v = 1) { noise(0.8, 0.04 * v, 700, 'bandpass', 0, 1); tone(180, 0.8, 'sine', 0.02 * v, 120); },
  bjParalisa(v = 1) { tone(90, 0.8, 'sawtooth', 0.03 * v, -10); tone(135, 0.8, 'sine', 0.02 * v, -15); noise(0.4, 0.04 * v, 1200, 'bandpass', 0, 2); },
  bjApaga(v = 1) { noise(0.25, 0.04 * v, 900, 'lowpass'); },
  bjInveste(v = 1) { noise(0.3, 0.06 * v, 600, 'bandpass', 0, 1); },
  bjErgue(v = 1) { tone(1400, 0.4, 'sine', 0.01 * v, 400); noise(0.08, 0.03 * v, 4000, 'highpass'); },
  bjGolpe(v = 1) { noise(0.16, 0.1 * v, 1800, 'bandpass', 0, 1); tone(140, 0.12, 'sawtooth', 0.03 * v, -80); },
  bjPlanta(v = 1) { noise(0.2, 0.08 * v, 300, 'lowpass'); tone(220, 0.08, 'square', 0.02 * v, -40); tone(330, 0.12, 'triangle', 0.015 * v, -40, 0.05); },
  bjTranco(v = 1) { noise(0.2, 0.1 * v, 500, 'lowpass'); tone(180, 0.15, 'square', 0.03 * v, -100); },
  bjTorce(v = 1) { for (let k = 0; k < 4; k++) noise(0.15, 0.03 * v, 1200 + k * 200, 'bandpass', k * 0.18, 3); },
  bjJoga(v = 1) { noise(0.3, 0.06 * v, 700, 'bandpass', 0, 1); },
  bjEnrola(v = 1) { noise(0.4, 0.06 * v, 500, 'lowpass'); tone(160, 0.3, 'sine', 0.02 * v, -40); },
  bjLava(v = 1) { for (let k = 0; k < 3; k++) noise(0.12, 0.03 * v, 900, 'bandpass', k * 0.2, 2); tone(330, 0.6, 'sine', 0.006 * v, -20, 0.2); },
  bjBoneco(v = 1) { tone(440, 1, 'sine', 0.01 * v, -60); tone(466, 1, 'sine', 0.008 * v, -60); noise(0.6, 0.02 * v, 3000, 'bandpass', 0, 6); },
  bjAlfinete(v = 1) { tone(2600, 0.05, 'square', 0.02 * v, -900); noise(0.04, 0.05 * v, 5000, 'highpass'); },
  bjCorta(v = 1) { tone(1800, 0.1, 'sine', 0.02 * v, -1400); },
  bjGrito(v = 1) { tone(820, 0.6, 'sawtooth', 0.02 * v, -500); noise(0.5, 0.03 * v, 2400, 'bandpass', 0, 2); }
});
Object.assign(BJ2, { bj2Frascos, bj2Pocas, bj2Mortalhas, bjHover, bjTeto });
