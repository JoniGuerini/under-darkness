'use strict';

/* ================= a Necrópole: blocos, paredes, terceira camada, minérios, decoração, a luz de alma =================
   Uma cidade feita para os mortos e construída por vivos: tudo é pedra trabalhada, gasta e fria. O granito negro é a
   rocha da camada, salpicada de feldspato cinza e pontos de mica; a terra de cova é escura, solta, com cacos de osso e
   fios de raiz; a laje de rua são placas gastas em fiadas desencontradas, as quinas lascadas; o mármore funerário é
   cinza-claro com veio escuro, em fiadas altas; a telha de ardósia são escamas azul-escuras sobrepostas; a parede de
   nichos é a grade do columbário, um nicho por bloco, quase todos fechados por uma placa com nome, alguns abertos (um
   crânio olha de dentro); o ossuário é parede de crânios em fileira e cabeças de fêmur em argamassa; a cantaria dos
   quartéis são blocos grandes riscados de cinzel, com fuligem; o mármore real é negro, polido, com veio de ouro; a cal
   é branca e esfarela; o rastrilho é uma grade de ossos longos presos por cintas de ferro; a laje de cova é a tampa da
   sepultura, com a borda chanfrada e a inscrição.
   Como o 281, cada material é uma textura contínua de 240x240 (o 07 põe contorno, borda acesa, sombra e oclusão); a
   decoração de 1 bloco são sprites de 12x12 em rampas de 7 tons com luz de cima à esquerda; a chama de alma das
   lanternas, o musgo-de-alma e a sepulcrita são desenhados ao vivo, só no que está na tela. */
const NCART = {};   // ferramentas para 382 (objetos), 383 e 384 (monstros), 387 (o rei) e 388 (a sepulcrita)
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro ---- */
pal('ncGranito', ['#121317', '#1d1f24', '#2a2d34', '#3a3e46', '#4f535c', '#686c76']);
pal('ncTerra', ['#17120e', '#261e17', '#362b21', '#47392b', '#5a4a38', '#705e48']);
pal('ncLaje', ['#24221e', '#37342d', '#4d493f', '#655f53', '#7f786a', '#9b9382']);
pal('ncMarmore', ['#36363a', '#535357', '#747476', '#979592', '#bab8b2', '#dcdad2']);
pal('ncTelha', ['#101216', '#1a1e24', '#262c34', '#333c46', '#444f5a', '#5a6670']);
pal('ncNicho', ['#201c18', '#332d27', '#494137', '#61574a', '#7b6f5e', '#978a74']);
pal('ncOssuario', ['#1e1a14', '#3a3226', '#5c503e', '#82735a', '#a89878', '#cebe9c']);
pal('ncCantaria', ['#1c1a18', '#2c2925', '#403c36', '#56514a', '#6e685e', '#888174']);
pal('ncReal', ['#07070a', '#101014', '#19191f', '#24242b', '#323239', '#46464f']);
pal('ncCal', ['#55524c', '#76726a', '#97938a', '#b7b3a8', '#d3cfc4', '#ebe7dc']);
pal('ncBarreira', ['#2a2419', '#4a4030', '#6e624a', '#968868', '#bcae8a', '#e0d4b0']);
pal('ncCova', ['#22201c', '#34312c', '#48443e', '#5e5952', '#77716a', '#918a82']);
// paredes de fundo: bem mais escuras que o chão da frente
pal('ncGranitoW', ['#060608', '#09090c', '#0d0e11', '#111216', '#16171b', '#1c1d22']);
pal('ncMarmoreW', ['#0c0c0d', '#121213', '#18181a', '#1f1f20', '#272727', '#303030']);
pal('ncNichosW', ['#070605', '#0c0a08', '#110e0c', '#171310', '#1d1914', '#241f19']);
pal('ncOssosW', ['#0a0806', '#100d0a', '#17130e', '#1e1913', '#262019', '#2f2820']);
pal('ncCantariaW', ['#080706', '#0c0b0a', '#11100e', '#161412', '#1c1a17', '#22201c']);
// a terceira camada: a cidade ao longe, a parede de nichos sem fim, a legião parada
pal('dpNcCidade', ['#030304', '#060608', '#0a0a0d', '#0f0f13', '#17171c', '#24242b']);
pal('dpNcNichos', ['#030302', '#060504', '#0a0907', '#0e0d0a', '#15130f', '#201d17']);
pal('dpNcLegiao', ['#020303', '#050606', '#08090a', '#0d0f10', '#151819', '#232829']);

const wrapT = v => ((v % TP) + TP) % TP;
const W2 = Math.PI * 2 / TP;
const RX = hexes => hexes.map(h => ph(h));
const GLINT = RX(['#9aa4b8', '#d6deea', '#ffffff']);                               // mica
const BONE = RX(['#5c503e', '#82735a', '#a89878', '#cebe9c', '#ece0c2']);           // os ossos claros
const IVORY = RX(['#6e6656', '#958c78', '#bab09a', '#dcd4bc', '#f4eedc']);         // as placas dos nichos
const GOLD = RX(['#4a3410', '#7a5a1c', '#a88030', '#d0aa50', '#f0d488', '#fff4c8']); // o veio de ouro
const IRONC = RX(['#121316', '#22252a', '#363a42', '#4e535c', '#6c727c']);           // as cintas de ferro
const LICHEN = RX(['#2a302a', '#3e463c', '#566050', '#707a66']);                    // o líquen pálido das lajes
const ROOT = RX(['#4a4234', '#6e6450', '#948a70', '#b8ae90']);                      // as raízes brancas da terra

/* ---- o chão sólido ---- */
function vGranito(x, y) {   // granito negro: grão grosso, feldspato cinza, mica que pisca, juntas retas de rocha antiga
  let v = 2.3 + cn(x, y, 10, 10, 38101) * 0.9 + cn(x, y, 40, 40, 38102) * 0.45 + cg(x, y, 38103) * 0.7;
  const c = cells(x, y, 6, 38104);
  if (c.id < 0.28 && c.d1 < 1.7) v += c.ox + c.oy < 0 ? 1.5 : 0.7;          // o feldspato, aceso em cima à esquerda
  else if (c.id > 0.86 && c.d1 < 1.3) v -= 1.3;                             // o grão escuro
  if (hash2(x, y, 38105) < 0.006) { MATX = GLINT[hash2(x, y, 38106) < 0.3 ? 2 : 1]; return -9; }
  const j = Math.abs(cn(wrapT(x + cn(x, y, 4, 4, 38107) * 22), wrapT(y + cn(x, y, 4, 4, 38108) * 22), 3, 3, 38109));
  if (j < 0.006) return 0.5;
  if (j < 0.011) v -= 0.6;
  return v;
}
function vTerra(x, y) {   // terra de cova: escura e solta, torrões, cacos de osso, fios de raiz pálida
  let v = 2.4 + cn(x, y, 16, 16, 38111) * 0.9 + cg(x, y, 38112) * 0.9;
  const c = cells(x, y, 9, 38113);
  if (c.d1 < 3.2 && c.id < 0.5) v += (c.ox + c.oy < 0 ? 0.7 : -0.5);       // os torrões
  const b = cells(x, y, 22, 38114);
  if (b.id < 0.12 && Math.abs(b.oy * 2.2 + b.ox * 0.4) < 1 && Math.abs(b.ox) < 3.2) { MATX = BONE[b.oy < 0 ? 3 : 1]; return -9; }   // um caco de osso
  const r = Math.abs(cn(wrapT(x + Math.sin(y * W2 * 8) * 10), y, 6, 2, 38115));
  if (r < 0.006 && hash2(x >> 2, y >> 3, 38116) < 0.5) { MATX = ROOT[r < 0.003 ? 2 : 1]; return -9; }
  if (hash2(x, y, 38117) < 0.03) v -= 1.2;
  return v;
}
// lajes em fiadas de 12: cada fiada tem o seu comprimento de placa e o seu deslocamento
const LAJE_W = [40, 30, 48, 60, 24];
function vLaje(x, y) {   // laje de rua: placas gastas, o meio liso, a quina de cima à esquerda clara, a junta escura, lascas
  const row = Math.floor(wrapT(y) / 12), oy = wrapT(y) % 12, W = LAJE_W[row % 5], sh = (hash2(row, 1, 38121) * W) | 0;
  const xx = wrapT(x + sh), slab = Math.floor(xx / W), ox = xx % W;
  if (oy === 0 || ox === 0) return hash2(x, y, 38122) < 0.3 ? 1.2 : 0.6;   // a junta
  let v = 2.8 + (hash2(row, slab, 38123) - 0.5) * 0.9 + cn(x, y, 20, 20, 38124) * 0.6 + cg(x, y, 38125) * 0.35;
  if (oy === 1) v += 0.9; else if (oy === 11) v -= 0.7;
  if (ox === 1) v += 0.5; else if (ox === W - 1) v -= 0.6;
  // a quina lascada (de vez em quando, na de cima à direita)
  if (hash2(row, slab, 38126) < 0.35 && ox > W - 5 && oy < 4 && ox - (W - 5) + (4 - oy) > 4) return 1.0;
  // o desgaste: o meio da placa mais liso e claro, a rachadura fina
  const ck = Math.abs(cn(wrapT(x + slab * 37), y, 8, 4, 38127)); if (ck < 0.005 && oy > 2 && oy < 10) v -= 1.3;
  if (hash2(x >> 1, y >> 1, 38128) < 0.02 && (ox < 3 || oy > 9)) { MATX = LICHEN[(hash2(x, y, 38129) * 3) | 0]; return -9; }
  return v;
}
function vMarmore(x, y) {   // mármore funerário: cinza-claro, veio escuro ondulando, fiadas de 24, juntas finas, polido
  const row = Math.floor(wrapT(y) / 24), oy = wrapT(y) % 24, sh = row & 1 ? 24 : 0, ox = wrapT(x + sh) % 48;
  if (oy === 0 || ox === 0) return 1.6;
  const w = cn(x, y, 3, 3, 38131) * 40, vein = Math.abs(Math.sin((x * 0.55 + y + w) * W2 * 6 + cn(x, y, 8, 8, 38132) * 5));
  let v = 3.6 + cn(x, y, 12, 12, 38133) * 0.6 + cg(x, y, 38134) * 0.2;
  if (vein < 0.035) v -= 2.4; else if (vein < 0.08) v -= 1.1; else if (vein < 0.12) v -= 0.4;
  if (oy === 1) v += 0.6; else if (oy === 23) v -= 0.6;
  const gl = cn(x, y, 4, 4, 38135); if (gl > 0.3 && gl < 0.33) v += 0.9;   // o brilho do polido
  return v;
}
function vTelha(x, y) {   // telha de ardósia: escamas redondas sobrepostas, fiadas de 6, a borda de baixo de cada uma clara
  const row = Math.floor(wrapT(y) / 6), oy = wrapT(y) % 6, sh = row & 1 ? 4 : 0, ox = wrapT(x + sh) % 8;
  const u = (ox - 3.5) / 4, d = u * u + Math.pow((oy - 5.2) / 5.4, 2);
  let v = 2.6 + (hash2(row, Math.floor(wrapT(x + sh) / 8), 38141) - 0.5) * 0.9 + cg(x, y, 38142) * 0.4 + cn(x, y, 20, 20, 38143) * 0.4;
  if (d > 1) return 0.6;                                         // o vão escuro entre as escamas
  if (d > 0.72 && oy > 2) v += 1.1;                              // a borda redonda de baixo pega luz
  v -= oy * 0.15;
  if (hash2(x, y, 38144) < 0.015) v -= 1.2;
  return v;
}
function vNicho(x, y) {   // parede de nichos: um nicho por bloco; a placa com o nome, a moldura, alguns abertos com o crânio
  const cx = Math.floor(wrapT(x) / 12), cy = Math.floor(wrapT(y) / 12), ox = wrapT(x) % 12, oy = wrapT(y) % 12, h = hash2(cx, cy, 38151);
  let v = 2.6 + cn(x, y, 20, 20, 38152) * 0.6 + cg(x, y, 38153) * 0.45;
  if (ox === 0 || oy === 0) return 1.1;                          // a junta entre os nichos
  if (ox === 1 || oy === 1) return v + 0.8;                      // a moldura acesa
  if (ox === 11 || oy === 11) return v - 0.7;
  if (ox < 2 || oy < 2 || ox > 10 || oy > 10) return v;
  // o miolo: 2..10
  if (h < 0.2) {   // aberto: o buraco escuro, o alto de um crânio olhando
    const sx = ox - 6, sy = oy - 6.8, d = (sx * sx) / 7.5 + (sy * sy) / 5.2;
    if (d < 1) { if (oy >= 7 && oy <= 7 && (ox === 4 || ox === 7)) return 0.4; MATX = BONE[clamp(Math.round(2.6 - (sx + sy) * 0.4), 0, 4)]; return -9; }
    return oy < 4 ? 0.9 : 0.4;
  }
  if (h < 0.3) {   // a placa quebrada: metade caiu
    if (ox + oy * 0.6 > 9) { MATX = IVORY[clamp(Math.round(2 - (ox - 6) * 0.15 + cg(x, y, 38154)), 0, 4)]; return -9; }
    return 0.5;
  }
  // a placa fechada: marfim gasto, duas linhas gravadas (o nome e as datas), a rosácea em cima
  let p = 2.4 + cn(x, y, 30, 30, 38155) * 0.6 + cg(x, y, 38156) * 0.4 + (h > 0.8 ? -0.6 : 0);
  if (oy === 2 || ox === 2) p += 0.7; else if (oy === 10 || ox === 10) p -= 0.6;
  if ((oy === 6 || oy === 8) && ox >= 4 && ox <= 8 && hash2(x, y >> 1, 38157) < 0.75) p -= 1.5;
  if (oy === 4 && ox === 6) p -= 1.2;
  MATX = IVORY[clamp(Math.round(p), 0, 4)]; return -9;
}
function vOssuario(x, y) {   // ossuário: fileira de crânios, fileira de cabeças de osso longo, argamassa escura entre eles
  const Y = wrapT(y), X = wrapT(x), band = Math.floor(Y / 12) & 1, oy = Y % 12;
  const mort = 0.9 + cn(x, y, 20, 20, 38161) * 0.5 + cg(x, y, 38162) * 0.5;
  if (band === 0) {   // os crânios: um em cada 12, a abóbada, as órbitas, o nariz, os dentes
    const ox = (X + (Math.floor(Y / 24) & 1 ? 6 : 0)) % 12, k = Math.floor((X + (Math.floor(Y / 24) & 1 ? 6 : 0)) / 12), sx = ox - 5.5, sy = oy - 5;
    const d = (sx * sx) / 22 + (sy * sy) / 20;
    if (d > 1 && !(oy >= 8 && oy <= 10 && Math.abs(sx) < 3.2)) return mort;
    let v = 3.2 - (sx + sy) * 0.18 - d * 0.6 + cg(x, y, 38163) * 0.4 + (hash2(k, Math.floor(Y / 12), 38164) - 0.5) * 0.8;
    if (oy >= 4 && oy <= 6 && (Math.abs(ox - 3.5) < 1.3 || Math.abs(ox - 7.5) < 1.3)) return oy === 4 ? 0.9 : 0.3;   // as órbitas
    if (oy === 7 && Math.abs(ox - 5.5) < 0.9) return 0.6;                                                      // o nariz
    if (oy >= 9) { if (ox % 2 === 0) return 0.6; v += 0.4; }                                                    // os dentes
    return v;
  }
  // as cabeças de osso longo, duas fileiras desencontradas de 6
  const sub = Math.floor(oy / 6), oo = oy % 6, ox = (X + (sub ? 3 : 0)) % 6, dx = ox - 2.5, dy = oo - 2.6, d = dx * dx + dy * dy;
  if (d > 7.6) return mort;
  let v = 3.4 - (dx + dy) * 0.32 - d * 0.08 + cg(x, y, 38165) * 0.45;
  if (d < 1.1 && hash2(Math.floor((X + (sub ? 3 : 0)) / 6), Math.floor(Y / 6), 38166) < 0.4) v -= 1.6;   // a ponta quebrada, o tutano seco
  return v;
}
function vCantaria(x, y) {   // cantaria dos quartéis: blocos de 24 x 12 desencontrados, riscos de cinzel em diagonal, fuligem
  const row = Math.floor(wrapT(y) / 12), oy = wrapT(y) % 12, sh = row & 1 ? 12 : 0, xx = wrapT(x + sh), bk = Math.floor(xx / 24), ox = xx % 24;
  if (oy === 0 || ox === 0) return 0.8;
  let v = 2.7 + (hash2(row, bk, 38171) - 0.5) * 1.0 + cn(x, y, 24, 24, 38172) * 0.5 + cg(x, y, 38173) * 0.35;
  const ch = Math.sin((x + y * 1.3) * W2 * 120 + hash2(row, bk, 38174) * 6); if (ch > 0.86) v -= 0.6; else if (ch < -0.92) v += 0.4;   // o cinzel
  if (oy === 1) v += 0.7; else if (oy === 11) v -= 0.6;
  if (ox === 1) v += 0.4; else if (ox === 23) v -= 0.5;
  const so = cn(x, y, 6, 6, 38175); if (so > 0.12) v -= (so - 0.12) * 4;   // a fuligem das fogueiras de outro tempo
  return v;
}
function vReal(x, y) {   // mármore real: negro polido em blocos de 24, o veio de ouro, a faixa de brilho
  const row = Math.floor(wrapT(y) / 24), oy = wrapT(y) % 24, sh = row & 1 ? 12 : 0, ox = wrapT(x + sh) % 24;
  if (oy === 0 || ox === 0) { MATX = GOLD[1]; return -9; }       // as juntas tomadas de ouro
  let v = 2.4 + cn(x, y, 10, 10, 38181) * 0.8 + cg(x, y, 38182) * 0.15;
  const w = Math.abs(cn(wrapT(x + cn(x, y, 4, 4, 38183) * 30), wrapT(y + cn(x, y, 4, 4, 38184) * 30), 4, 4, 38185));
  if (w < 0.004) { MATX = GOLD[w < 0.002 ? 4 : 3]; return -9; }
  if (w < 0.009) v += 1.2;
  const gl = Math.sin((x - y) * W2 * 4 + cn(x, y, 3, 3, 38186) * 2); if (gl > 0.94) v += 1.6; else if (gl > 0.85) v += 0.7;   // o polido
  if (oy === 1 || ox === 1) v += 0.6;
  return v;
}
function vCal(x, y) {   // cal: branca, esfarelando, poros, a crosta de cima mais clara
  let v = 3.4 + cn(x, y, 14, 14, 38191) * 0.8 + cg(x, y, 38192) * 0.8;
  const c = cells(x, y, 7, 38193); if (c.d1 < 1.2 && c.id < 0.3) v -= 1.8; else if (c.d2 - c.d1 < 0.8) v -= 0.5;
  return v;
}
function vBarreira(x, y) {   // o rastrilho de ossos: ossos longos em pé lado a lado, as cintas de ferro, os nós dos ossos
  const X = wrapT(x), Y = wrapT(y), bx = X % 6, by = Y % 12;
  if (by >= 5 && by <= 7) { MATX = IRONC[by === 5 ? 4 : by === 6 ? 2 : 1]; if (bx === 2 && by === 6) MATX = IRONC[4]; return -9; }   // a cinta e o rebite
  if (bx === 5) return 0.3;                                          // o vão entre os ossos (escuro)
  const u = (bx - 2) / 2.6;
  let v = 3.6 - u * 1.1 - u * u * 0.8 + cg(x, y, 38201) * 0.35 + Math.sin(Y * W2 * 40 + Math.floor(X / 6)) * 0.2;
  if ((by === 4 || by === 8) && Math.abs(u) < 0.9) v += 0.9;         // o nó do osso junto da cinta
  if (hash2(Math.floor(X / 6), Y >> 2, 38202) < 0.08) v -= 1;
  return v;
}
function vCova(x, y) {   // laje de cova: tampas de 24 x 12 com a borda chanfrada, a inscrição gasta, o líquen
  const oy = wrapT(y) % 12, xx = wrapT(x), sl = Math.floor(xx / 24), ox = xx % 24;
  if (ox === 0 || oy === 0) return 0.7;
  let v = 2.8 + (hash2(sl, Math.floor(wrapT(y) / 12), 38211) - 0.5) * 0.7 + cn(x, y, 16, 16, 38212) * 0.5 + cg(x, y, 38213) * 0.4;
  if (oy === 1 || ox === 1) v += 1; else if (oy === 11 || ox === 23) v -= 0.8;
  if (oy === 2 || ox === 2) v += 0.3;
  if (oy >= 4 && oy <= 7 && ox >= 6 && ox <= 18) { if ((oy === 5 || oy === 7) && hash2(x, y >> 1, 38214) < 0.55) v -= 1.4; }   // as letras
  if (oy >= 4 && oy <= 7 && ox >= 3 && ox <= 4) v -= oy === 5 ? 1.6 : 0.6;                                                  // o emblema
  if (cn(x, y, 8, 8, 38215) > 0.28 && hash2(x, y, 38216) < 0.5) { MATX = LICHEN[1 + ((hash2(x, y, 38217) * 2) | 0)]; return -9; }
  return v;
}

/* ---- paredes de fundo (só o tom) ---- */
const vGranitoW = (x, y) => { const v = vGranito(x, y); return v === -9 ? 3.4 : v * 0.9 + 0.3; };
const vMarmoreW = (x, y) => { const v = vMarmore(x, y); return v * 0.85 + 0.2; };
function vNichosW(x, y) {   // a parede de nichos vista de longe: a grade mais funda, os nichos escuros, poucas placas
  const ox = wrapT(x) % 12, oy = wrapT(y) % 12, h = hash2(Math.floor(wrapT(x) / 12), Math.floor(wrapT(y) / 12), 38221);
  let v = 3 + cn(x, y, 20, 20, 38222) * 0.6 + cg(x, y, 38223) * 0.4;
  if (ox <= 1 || oy <= 1) return v + (ox === 1 || oy === 1 ? 0.8 : 0);
  if (ox >= 11 || oy >= 11) return v - 0.6;
  if (h < 0.5) return oy < 4 ? 1.1 : 0.4;                            // aberto
  return 2.8 + (oy === 2 ? 0.8 : 0) + ((oy === 6 || oy === 8) && ox > 3 && ox < 9 ? -1 : 0) + cg(x, y, 38224) * 0.4;
}
const vOssosW = (x, y) => { const v = vOssuario(x, y); return v * 0.95 + 0.2; };
const vCantariaW = (x, y) => vCantaria(x, y) + 0.4;

/* ---- a terceira camada ---- */
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
function vDpCidade(x, y) {   // a cidade dos mortos ao longe: telhados de mausoléu em duas águas, cúpulas, obeliscos, em duas fileiras
  let v = 0.7 + cn(x, y, 12, 12, 38231) * 0.5 + cg(x, y, 38232) * 0.15;
  for (const [base, per, s, lit] of [[TP * 0.55, 40, 1, 2.6], [TP * 0.85, 30, 2, 3.6]]) {
    const k = Math.floor(wrapT(x) / per), ox = wrapT(x) % per, h = hash2(k, s, 38233), w = per * 0.7, cxk = per / 2;
    let top;
    if (h < 0.45) top = base - 18 - (w / 2 - Math.abs(ox - cxk)) * 0.9;                                 // o telhado de duas águas
    else if (h < 0.75) { const u = (ox - cxk) / (w / 2); top = Math.abs(u) < 1 ? base - 14 - Math.sqrt(1 - u * u) * 12 : base; }   // a cúpula
    else top = Math.abs(ox - cxk) < 2 ? base - 40 - h * 20 : base - 10;                                 // o obelisco
    if (Math.abs(ox - cxk) > w / 2 + (h >= 0.75 ? 4 : 0)) top = base;
    if (y > top) { v = lit - 1.6 + cn(x, y, 20, 20, 38234 + s) * 0.5 + cg(x, y, 38236) * 0.2; if (y < top + 1.5) v = lit; else if (y < top + 4) v += 0.6; }
  }
  return v;
}
function vDpNichos(x, y) {   // a parede de nichos sem fim: a grade de 24 x 18, os buracos escuros, a borda de cima acesa
  const ox = wrapT(x) % 24, oy = wrapT(y) % 20, h = hash2(Math.floor(wrapT(x) / 24), Math.floor(wrapT(y) / 20), 38241);
  let v = 2.2 + cn(x, y, 14, 14, 38242) * 0.7 + cg(x, y, 38243) * 0.2;
  if (ox > 3 && ox < 21 && oy > 3 && oy < 17) { v = h < 0.6 ? 0.5 : 1.5; if (oy === 4) v += 0.6; }
  else if (oy === 3 || ox === 3) v += 0.9;
  return v;
}
function vDpLegiao(x, y) {   // a legião parada no escuro: fileiras de vultos de elmo e lança, o alto dos elmos pegando a luz
  let v = 0.5 + cn(x, y, 10, 10, 38251) * 0.4;
  const Y = wrapT(y), row = Math.floor(Y / 40), oy = Y % 40, sh = row & 1 ? 5 : 0, X = wrapT(x + sh), k = Math.floor(X / 10), ox = X % 10 - 5;
  const jit = (hash2(k, row, 38252) - 0.5) * 3, hy = 14 + jit;
  if (Math.abs(ox) <= 2 && oy >= hy && oy < hy + 4) v = oy < hy + 1 ? 4.2 : 2.6;                       // o elmo
  else if (Math.abs(ox) <= 3.5 && oy >= hy + 4 && oy < 40) v = 1.6 + (oy < hy + 6 ? 0.8 : 0) - (oy - hy) * 0.03;   // os ombros e o corpo
  else if (ox === 4 && oy > hy - 12 && oy < 40) v = oy < hy - 9 ? 3.8 : 2;                             // a lança
  return v + cg(x, y, 38253) * 0.12;
}

/* ---- assar e registrar ---- */
const BKV = {
  granito: bake(vGranito), terra: bake(vTerra), laje: bake(vLaje), marmore: bake(vMarmore), telha: bake(vTelha), nicho: bake(vNicho), ossuario: bake(vOssuario),
  cantaria: bake(vCantaria), real: bake(vReal), cal: bake(vCal), barreira: bake(vBarreira), cova: bake(vCova),
  granitoW: bake(vGranitoW), marmoreW: bake(vMarmoreW), nichosW: bake(vNichosW), ossosW: bake(vOssosW), cantariaW: bake(vCantariaW),
  dpCidade: bake(vDpCidade), dpNichos: bake(vDpNichos), dpLegiao: bake(vDpLegiao)
};
const NC_SOLID = [
  // id, paleta, textura, dureza, cor no mapa
  [NC_GRANITO, 'ncGranito', 'granito', 1.5, '#3a3e46'], [NC_TERRA, 'ncTerra', 'terra', 0.5, '#47392b'], [NC_LAJE, 'ncLaje', 'laje', 1.1, '#655f53'],
  [NC_MARMORE, 'ncMarmore', 'marmore', 1.3, '#979592'], [NC_TELHA, 'ncTelha', 'telha', 0.8, '#333c46'], [NC_NICHO, 'ncNicho', 'nicho', 1.0, '#7b6f5e'],
  [NC_OSSUARIO, 'ncOssuario', 'ossuario', 0.8, '#a89878'], [NC_CANTARIA, 'ncCantaria', 'cantaria', 1.4, '#56514a'], [NC_REAL, 'ncReal', 'real', 1.8, '#24242b'],
  [NC_CAL, 'ncCal', 'cal', 0.4, '#b7b3a8'], [NC_COVA, 'ncCova', 'cova', 1.0, '#5e5952']
];
for (const [t, p, k, dig, col] of NC_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; NC_SOILS[t] = 1; }
for (const t of [NC_GRANITO, NC_TERRA, NC_CAL]) BLEND[t] = 1;
// o rastrilho de ossos: sólido, não quebra
MAT[NC_BARREIRA] = [PALS.ncBarreira, BKV.barreira]; SOLID[NC_BARREIRA] = 1; BLOCKY[NC_BARREIRA] = 1; DIG[NC_BARREIRA] = 0; PCOL[NC_BARREIRA] = '#bcae8a';

WMAT[WNC_GRANITO] = [PALS.ncGranitoW, BKV.granitoW]; WMAT[WNC_MARMORE] = [PALS.ncMarmoreW, BKV.marmoreW]; WMAT[WNC_NICHOS] = [PALS.ncNichosW, BKV.nichosW];
WMAT[WNC_OSSOS] = [PALS.ncOssosW, BKV.ossosW]; WMAT[WNC_CANTARIA] = [PALS.ncCantariaW, BKV.cantariaW];
DMAT[DP_NC_CIDADE] = [PALS.dpNcCidade, BKV.dpCidade]; DMAT[DP_NC_NICHOS] = [PALS.dpNcNichos, BKV.dpNichos]; DMAT[DP_NC_LEGIAO] = [PALS.dpNcLegiao, BKV.dpLegiao];

/* ---- os minérios: carvão no granito, e a sepulcrita: o metal que cresce onde muitos mortos repousam (os cravos dos
   caixões e o ferro das armaduras, passados por séculos de alma); nódulos de cinza-prata com o lustro verde-pálido ---- */
oreRamp(NC_O_SEPULCRITA, ['#0c1014', '#18222a', '#2a3a42', '#42585e', '#64807e', '#a2c8bc', '#eafff4']);
const SEP_TIP = new Map();   // semente do bloco -> o ponto mais claro (onde o lustro pisca, ao vivo)
ORE_PAINT[NC_O_SEPULCRITA] = function (L, s) {
  // três ou quatro nódulos redondos achatados como gotas de chumbo frio, a face de cima com o lustro claro, um fio verde
  const R = ORE_RAMP[NC_O_SEPULCRITA], n = 3 + (hash2(s, 1, 38401) < 0.4 ? 1 : 0);
  let tip = null, best = -9;
  for (let i = 0; i < n; i++) {
    const cx = 2.5 + hash2(s, 2 + i, 38402) * 7, cy = 2.5 + hash2(s, 3 + i, 38403) * 7, rx = 1.5 + hash2(s, i, 38404) * 1.4, ry = rx * 0.8;
    for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue;
      let l = 3.6 - (dx + dy) * 1.2 - d * 0.8 + (hash2(x + s, y, 38405) - 0.5) * 0.4;
      if (dx < -0.1 && dy < -0.2 && d < 0.45) l = 6;                    // o lustro
      L.put(x, y, ramp(R, Math.min(l, 6)), l);
      if (l > best) { best = l; tip = [x, y]; }
    }
  }
  // o fio verde-pálido que liga os nódulos
  for (let i = 0; i < 6; i++) { const x = 2 + ((hash2(s, i, 38406) * 8) | 0), y = 2 + ((hash2(s, i + 9, 38407) * 8) | 0); if (!L.m[y * 12 + x]) L.put(x, y, R[4], 2); }
  SEP_TIP.set(s, tip);
};
ORE_HALO[NC_O_SEPULCRITA] = { pal: ['ncGranito', '#4a7068', 0.24, 0.1], shade: 0.2 };
ORE_PAINT[NC_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[NC_O_CARVAO] = { pal: ['ncGranito', '#050506', 0.45, 0.18], shade: 0 };
MAT[NC_O_CARVAO] = [PALS.ncGranito, bakeOre(NC_O_CARVAO, vGranito)]; MAT[NC_O_SEPULCRITA] = [PALS.ncGranito, bakeOre(NC_O_SEPULCRITA, vGranito)];
for (const t of [NC_O_CARVAO, NC_O_SEPULCRITA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; NC_SOILS[t] = 1; }
DIG[NC_O_CARVAO] = DIG[COAL]; ORE_XP[NC_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[NC_O_CARVAO] = ORE_NAME[COAL]; PCOL[NC_O_CARVAO] = PCOL[COAL]; ORE_ITEM[NC_O_CARVAO] = ORE_ITEM[COAL];
DIG[NC_O_SEPULCRITA] = 1.95; ORE_XP[NC_O_SEPULCRITA] = 28; ORE_NAME[NC_O_SEPULCRITA] = 'Sepulcrita'; PCOL[NC_O_SEPULCRITA] = '#64807e'; ORE_ITEM[NC_O_SEPULCRITA] = 'min_sepulcrita';
EMIT[NC_O_SEPULCRITA] = 0.2;
const sepTip = (gx, gy) => SEP_TIP.get(((wrapX(gx) % 20) * 31 + (gy % 20) * 977 + NC_O_SEPULCRITA * 7919) | 0);

/* ---- itens de bloco ---- */
const NC_ITEMS = {
  granito_negro: ['Granito Negro', NC_GRANITO, 'A rocha em que a Necrópole foi cavada: negra, de grão grosso, com pontinhos de mica.'],
  terra_cova: ['Terra de Cova', NC_TERRA, 'Terra escura e solta, cheia de cacos de osso. Foi revirada muitas vezes.'],
  laje_rua: ['Laje de Rua', NC_LAJE, 'Uma placa do calçamento das avenidas dos túmulos, gasta pelos cortejos.'],
  marmore_funerario: ['Mármore Funerário', NC_MARMORE, 'Mármore cinza-claro com o veio escuro. Os mausoléus dos nobres são feitos dele.'],
  telha_ardosia: ['Telha de Ardósia', NC_TELHA, 'Escamas de ardósia azul-escura do telhado de um mausoléu.'],
  nicho: ['Pedra de Nicho', NC_NICHO, 'Um pedaço da parede de um columbário, com a placa de um nome que ninguém mais lê.'],
  ossuario: ['Parede de Ossuário', NC_OSSUARIO, 'Crânios e ossos longos assentados em argamassa, em fileiras certinhas.'],
  cantaria: ['Cantaria', NC_CANTARIA, 'Um bloco dos quartéis da legião, riscado de cinzel e escuro de fuligem.'],
  marmore_real: ['Mármore Real', NC_REAL, 'Mármore negro polido com veio de ouro. Só a cripta do rei tem dele.'],
  cal_virgem: ['Cal', NC_CAL, 'A cal que jogavam nas covas. Branca, esfarela na mão.'],
  laje_cova: ['Laje de Cova', NC_COVA, 'A tampa de uma sepultura, com a borda chanfrada e o nome gasto.']
};
for (const id in NC_ITEMS) { const [name, block, desc] = NC_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: ITEMS[id] && ITEMS[id].rar || 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }

/* ================= decoração: sprites de 12x12 em rampas ================= */
const DRT = {
  ferro: ['#0e0f12', '#1a1c21', '#2a2d34', '#3d414a', '#545963', '#6f7580', '#959ba6'],
  ferrugem: ['#1e120c', '#341e12', '#4e2c18', '#6a3e20', '#86522c', '#a26a3c', '#bc8452'],
  osso: ['#2a261e', '#4a4436', '#6e6652', '#968c74', '#bcb296', '#ddd4ba', '#f6f0de'],
  pedra: ['#1a1917', '#2c2a26', '#423f39', '#5a564e', '#757067', '#918b80', '#aea89c'],
  marmore: ['#2e2e30', '#4a4a4c', '#6a6a6a', '#8c8a86', '#aeaca6', '#cecbc4', '#ecebe4'],
  pano: ['#1a1816', '#2e2b27', '#45413a', '#5e5950', '#7a746a', '#968f84', '#b4ad9f'],
  flor: ['#1e1410', '#3a2418', '#5a3420', '#7a4a2a', '#9a6436', '#b88a52', '#d4b07a'],
  folha: ['#141610', '#22261a', '#323826', '#444c32', '#586242', '#6e7a54', '#8a9468'],
  fita: ['#1a0a0e', '#300f16', '#4a1620', '#661e2a', '#822a36', '#a03c46', '#bc5a60'],
  musgo: ['#0c1410', '#14221a', '#1e3426', '#2a4834', '#3a6046', '#4e7c5c', '#6a9c78'],
  alma: ['#1a3a2c', '#2e5e48', '#4a8a6a', '#6ab48e', '#94d6b0', '#c4f0d8', '#f0fff8'],
  barro: ['#1e140e', '#341f14', '#4c2e1c', '#664026', '#825434', '#9e6c46', '#b8865c'],
  bronze: ['#16120a', '#2a2212', '#42361c', '#5c4c28', '#786436', '#968046', '#b49c5c'],
  raiz: ['#2a261e', '#423c30', '#5e5644', '#7c725a', '#9a9074', '#b8ae90', '#d4ccae'],
  pau: ['#1a120a', '#2c1e12', '#42301c', '#5a4228', '#745636', '#8e6c46', '#a8845a'],
  real: ['#0a0a0d', '#141418', '#1e1e24', '#2a2a32', '#3a3a44', '#4e4e5a', '#686876']
};
for (const k in DRT) DRT[k] = DRT[k].map(h => ph(h));
const OB = DRT.osso, FE = DRT.ferro;
const PD = DRT.pedra;
/* a escada de ferro chumbada na pedra: dois montantes com rebites, degraus redondos; o topo com os ganchos, o pé com a
   sapata */
function escadaSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr(), y0 = k === 1 ? 2 : 0, y1 = k === 2 ? 10 : 11;
  for (let y = y0; y <= y1; y++) for (const x0 of [2, 9]) { a.put(x0, y, FE, 4.6 + cg(x0, y, s) * 0.5); a.put(x0 + 1, y, FE, 2.6); if (y % 6 === 1) a.put(x0, y, FE, 5.8); }
  for (const ry of [3, 9]) { if (ry > y1) continue; for (let x = 3; x <= 8; x++) { a.put(x, ry, FE, 4.8 - (x - 3) * 0.15 + cg(x, ry, s) * 0.3); a.put(x, ry + 1, FE, 1.8); } }
  if (k === 1) { for (const x0 of [2, 9]) { a.put(x0, 1, FE, 5); a.put(x0 - 1, 0, FE, 4.2); a.put(x0, 0, FE, 3); a.put(x0 + 1, 1, FE, 2.4); } }   // os ganchos na pedra
  if (k === 2) for (const x0 of [1, 8]) { for (let x = x0; x <= x0 + 3; x++) a.put(x, 11, FE, 3.4 - (x - x0) * 0.4); a.put(x0 + 1, 10, FE, 4); }   // as sapatas
  for (let y = y0; y <= y1; y += 4) a.put(3 + ((y * 7 + s) % 5), y, DRT.ferrugem, 3.6);   // a ferrugem escorrida
  return rimOut(a, FE[0], false);
}
const ESCADA = [escadaSprite(0, 38501), escadaSprite(1, 38502), escadaSprite(2, 38503)];
/* a corrente pendurada: elos ovais alternando de frente e de lado; o último termina num gancho */
function correnteSprite(k, s) {   // 0 e 1 meio (desencontrados), 2 o gancho
  const a = spr(), len = k === 2 ? 7 : 12;
  for (let y = 0; y < len; y++) {
    const seg = Math.floor((y + (k === 1 ? 3 : 0)) / 3) % 2, oy = (y + (k === 1 ? 3 : 0)) % 3;
    if (seg === 0) { for (const x of [4, 7]) a.put(x, y, FE, (x === 4 ? 4.8 : 2.6) + cg(x, y, s) * 0.3); if (oy === 0) { a.put(5, y, FE, 5.2); a.put(6, y, FE, 4.4); } }
    else { a.put(5, y, FE, 4.4 + cg(5, y, s) * 0.3); a.put(6, y, FE, 2.8); }
  }
  if (k === 2) { for (let y = 7; y < 11; y++) a.put(5, y, FE, 4.2); a.put(6, 11, FE, 3.6); a.put(7, 10, FE, 4.6); a.put(8, 9, FE, 3.8); a.put(4, 10, FE, 2.4); }
  return rimOut(a, FE[0], false);
}
const CORRENTE = [correnteSprite(0, 38511), correnteSprite(1, 38512), correnteSprite(2, 38513)];
/* a lanterna de alma no chão: a casinha de pedra de telhado pontudo, as frestas, a câmara onde a chama verde-pálida queima
   (a chama é desenhada ao vivo em LANT_F) */
const LANT_F = [[5, 6], [6, 6]];
function lanternaSprite(v, s) {
  const a = spr();
  for (let x = 3; x <= 8; x++) for (let y = 9; y <= 11; y++) a.put(x, y, PD, 3.6 - (x - 3) * 0.2 - (y - 9) * 0.6 + cg(x, y, s) * 0.5);   // a base
  for (let y = 4; y <= 8; y++) for (const x of [3, 8]) a.put(x, y, PD, x === 3 ? 4.4 : 2.4);                                            // os pilares
  for (let y = 4; y <= 8; y++) for (let x = 4; x <= 7; x++) a.put(x, y, DRT.alma, y >= 7 ? 2 : 1);                                       // a câmara (o fundo da chama)
  for (let x = 2; x <= 9; x++) a.put(x, 3, PD, 4.6 - (x - 2) * 0.25);                                                                     // o beiral
  for (let y = 0; y <= 2; y++) for (let x = 5 - y; x <= 6 + y; x++) a.put(x, y, PD, 4.8 - (x - 5 + y) * 0.5 - y * 0.2);                // o telhado
  if (v === 1) { a.put(5, 9, PD, 1.2); a.put(6, 10, PD, 1.4); a.put(2, 11, OB, 4.6); a.put(9, 11, OB, 3.6); }                        // rachada, um osso ao pé
  return rimOut(a, PD[0], true);
}
const LANTERNA = [lanternaSprite(0, 38521), lanternaSprite(1, 38522)];
/* a lanterna de alma pendurada: a corrente curta do teto, a gaiola de ferro, a chama dentro */
const LANT_T_F = [5, 8];
function lanternaTSprite(s) {
  const a = spr();
  for (let y = 0; y <= 3; y++) a.put(5, y, FE, y % 2 ? 4.2 : 3);
  for (let x = 3; x <= 8; x++) { a.put(x, 4, FE, 4.6 - (x - 3) * 0.3); a.put(x, 11, FE, 3 - (x - 3) * 0.2); }
  for (let y = 5; y <= 10; y++) { a.put(3, y, FE, 4.2); a.put(8, y, FE, 2.2); a.put(5, y, FE, 2.4); }
  for (let y = 5; y <= 10; y++) for (const x of [4, 6, 7]) a.put(x, y, DRT.alma, y > 8 ? 1.6 : 0.8);
  return rimOut(a, FE[0], false);
}
const LANTERNA_T = [lanternaTSprite(38531)];
/* a lápide pequena: de topo redondo, de topo reto, tombada; o nome gasto, o musgo no pé */
function lapideSprite(v, s) {
  const a = spr(), x0 = v === 2 ? 1 : 3, x1 = v === 2 ? 10 : 8, top = v === 2 ? 8 : 2;
  for (let y = top; y <= 11; y++) for (let x = x0; x <= x1; x++) {
    if (v === 0 && y < top + 2) { const u = (x + 0.5 - (x0 + x1 + 1) / 2) / ((x1 - x0 + 1) / 2); if (u * u + Math.pow((top + 2 - y) / 2.2, 2) > 1) continue; }
    let l = 3.6 - (x - x0) * 0.25 - (y - top) * 0.08 + cg(x, y, s) * 0.5;
    if (y === top || x === x0) l += 0.8; if (x === x1) l -= 0.9;
    if (v !== 2 && (y === top + 3 || y === top + 5) && x > x0 + 1 && x < x1 - 1 && hash2(x, y, s) < 0.7) l -= 1.6;
    if (v === 2 && y === top + 1 && x > x0 + 2 && x < x1 - 2 && x % 2) l -= 1.4;
    a.put(x, y, PD, l);
  }
  for (let x = x0; x <= x1; x++) if (hash2(x, 1, s) < 0.5) a.put(x, 11, DRT.musgo, 2.6 + cg(x, 11, s));
  return rimOut(a, PD[0], true);
}
const LAPIDE = [lapideSprite(0, 38541), lapideSprite(1, 38542), lapideSprite(2, 38543)];
/* as flores secas: um maço amarrado com a fita vermelha desbotada, as corolas murchas, caído no chão */
function floresSprite(v, s) {
  const a = spr(), F = DRT.flor, G = DRT.folha;
  for (let k = 0; k < 5; k++) { const x0 = 3 + k * 1.2 + (v ? 1 : 0), ang = (k - 2) * 0.22; for (let t = 0; t < 7; t++) a.put(x0 + Math.sin(ang) * t, 11 - t * 0.9, G, 3 - t * 0.15); }
  for (let k = 0; k < 4; k++) { const cx = 3 + k * 2 + (v ? 1 : 0), cy = 4 + ((k * 7 + s) % 3); disc(a, cx, cy, 1.4, 1.2, F, (dx, dy) => 4.4 - dy * 1.3 - dx * 0.6 + cg(cx, cy, s + k) * 0.6); a.put(cx, cy, F, 1.6); }
  for (let x = 4; x <= 8; x++) a.put(x + (v ? 1 : 0), 9, DRT.fita, 4 - (x - 4) * 0.3);
  a.put(9 + (v ? 1 : 0), 10, DRT.fita, 3.2); a.put(10 + (v ? 1 : 0), 11, DRT.fita, 2.6);
  return rimOut(a, F[0], true);
}
const FLORES = [floresSprite(0, 38551), floresSprite(1, 38552)];
/* ossos soltos: um crânio de gente e um fêmur; costelas soltas; uma mão aberta */
function ossosSprite(v, s) {
  const a = spr();
  if (v === 0) {
    disc(a, 4, 8.6, 3, 2.6, OB, (dx, dy) => 4.6 - dy * 1.3 - dx * 0.7 + cg(dx * 9 | 0, dy * 9 | 0, s) * 0.3);
    a.put(3, 9, OB, 0.6); a.put(5, 9, OB, 0.6); a.put(4, 10, OB, 1.2); for (let x = 2; x <= 6; x++) a.put(x, 11, OB, x % 2 ? 4.4 : 1.6);
    for (let x = 7; x <= 11; x++) { a.put(x, 10, OB, 4.6 - (x - 7) * 0.2); a.put(x, 11, OB, 2.4); } a.put(11, 9, OB, 5.2); a.put(7, 9, OB, 5);
  } else if (v === 1) {
    for (let r = 0; r < 4; r++) for (let t = 0; t < 6; t++) { const x = 2 + r * 2.4 + t * 0.3, y = 11 - Math.sin(t / 5 * Math.PI) * 3 - t * 0.2; a.put(x, y, OB, 4.6 - t * 0.3); }
    for (let x = 1; x <= 10; x++) a.put(x, 11, OB, 3 + cg(x, 11, s));
  } else {
    disc(a, 6, 10, 2.4, 1.4, OB, (dx, dy) => 4.4 - dy - dx * 0.6);
    for (let f = 0; f < 4; f++) for (let t = 0; t < 3; t++) a.put(4 + f * 1.4 + t * 0.4 * (f - 1.5), 8.4 - t, OB, 4.8 - t * 0.6);
    a.put(9, 10, OB, 4.2); a.put(10, 9, OB, 3.8);
  }
  return rimOut(a, OB[0], true);
}
const OSSOS = [ossosSprite(0, 38561), ossosSprite(1, 38562), ossosSprite(2, 38563)];
/* a mortalha pendurada: uma tira de pano cinzento caindo do teto, as dobras, a barra desfiada */
function mortalhaSprite(end, s) {
  const a = spr(), P = DRT.pano, len = end ? 10 : 12;
  for (let y = 0; y < len; y++) {
    const cx = 5.5 + Math.sin(y * 0.35 + s) * 0.9, hw = 2.6 + Math.sin(y * 0.5 + s * 2) * 0.4;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const d = (x + 0.5 - cx) / hw; if (Math.abs(d) > 1) continue;
      if (end && y > 6 && hash2(x, y, s) < (y - 6) * 0.2) continue;
      const fold = Math.sin(x * 1.7 + y * 0.2 + s);
      a.put(x, y, P, 3.6 - d * 1.2 + (fold > 0.7 ? 0.8 : fold < -0.8 ? -0.9 : 0) + cg(x, y, s) * 0.3);
    }
  }
  return rimOut(a, P[0], false);
}
const MORTALHA = [mortalhaSprite(false, 38571), mortalhaSprite(true, 38572)];
/* o musgo-de-alma: tufos baixos, verde-escuro, com pontinhos que acendem (o brilho vai ao vivo) */
const MUSGO_P = [[[3, 9], [6, 8], [9, 10]], [[2, 10], [5, 9], [8, 9]], [[4, 9], [7, 10]]];
function musgoSprite(v, s) {
  const a = spr(), M = DRT.musgo;
  for (let x = 0; x < 12; x++) { const h = 1 + Math.round((Math.sin(x * 1.3 + v * 2 + s) + 1) * 1.2 + hash2(x, v, s) * 1.4); for (let y = 12 - h; y < 12; y++) a.put(x, y, M, 2.4 + (y === 12 - h ? 1.4 : 0) - (12 - y) * 0.1 + cg(x, y, s) * 0.6); }
  for (const [x, y] of MUSGO_P[v]) { a.put(x, y, DRT.alma, 5); a.put(x, y - 1, M, 4); }
  return rimOut(a, M[0], true);
}
const MUSGO = [musgoSprite(0, 38581), musgoSprite(1, 38582), musgoSprite(2, 38583)];
/* a urna funerária: de barro com a boca larga e a tampa; de bronze com as alças */
function urnaSprite(v, s) {
  const a = spr(), U = v ? DRT.bronze : DRT.barro;
  for (let y = 3; y <= 11; y++) {
    const t = (y - 3) / 8, hw = y === 3 ? 2 : y === 4 ? 1.6 : 1.6 + Math.sin(t * Math.PI) * 2.4 - (y === 11 ? 0.6 : 0);
    for (let x = Math.floor(6 - hw); x <= Math.ceil(5 + hw); x++) { const u = (x + 0.5 - 6) / (hw + 0.5); if (Math.abs(u) > 1) continue; a.put(x, y, U, 3.8 - u * 1.6 - u * u * 0.4 + cg(x, y, s) * 0.4 + (y === 7 ? 0.7 : 0)); }
  }
  for (let x = 4; x <= 7; x++) a.put(x, 2, U, 4.6 - (x - 4) * 0.4); a.put(5, 1, U, 4.4); a.put(6, 1, U, 3.4);
  if (v) { a.put(2, 6, U, 4); a.put(2, 7, U, 3); a.put(9, 6, U, 3); a.put(9, 7, U, 2); }
  else for (let x = 3; x <= 8; x++) if (x % 2) a.put(x, 8, U, 1.6);
  return rimOut(a, U[0], true);
}
const URNA = [urnaSprite(0, 38591), urnaSprite(1, 38592)];
/* as raízes brancas que descem das covas de cima */
function raizSprite(end, s) {
  const a = spr(), R = DRT.raiz;
  for (let k = 0; k < 2; k++) {
    let x = 3 + k * 5 + hash2(k, 0, s) * 2; const len = end ? 6 + k * 3 : 12;
    for (let y = 0; y < len; y++) { x += Math.sin(y * 0.7 + k * 2 + s) * 0.35; const w = end && y > len - 3 ? 0 : 1; for (let d = 0; d <= w; d++) a.put(x + d, y, R, (d ? 2.4 : 4.4) + cg(x, y, s) * 0.5); }
    if (end) a.put(x, len, R, 3);
  }
  return rimOut(a, R[0], false);
}
const RAIZ = [raizSprite(false, 38601), raizSprite(true, 38602)];
/* o elmo caído: o elmo fechado de legionário de lado, a viseira em fresta; o outro de boca para cima */
function elmoSprite(v, s) {
  const a = spr();
  if (v === 0) {
    disc(a, 6, 8, 4.4, 3.6, FE, (dx, dy, d, x, y) => 4.4 - dy * 1.4 - dx * 0.8 + cg(x, y, s) * 0.4);
    for (let x = 3; x <= 9; x++) a.put(x, 11, FE, 2);
    for (let x = 6; x <= 10; x++) a.put(x, 8, FE, 0.6); a.put(2, 6, FE, 5.2);
    for (let y = 4; y <= 6; y++) a.put(5, y, DRT.ferrugem, 3.4);
  } else {
    disc(a, 6, 9.5, 4.4, 2.6, FE, (dx, dy, d, x, y) => (dy < -0.2 ? 1.4 : 4.2 - dx * 0.9) + cg(x, y, s) * 0.4);
    for (let x = 3; x <= 9; x++) a.put(x, 7, FE, 4.8 - (x - 3) * 0.3);
  }
  return rimOut(a, FE[0], true);
}
const ELMO = [elmoSprite(0, 38611), elmoSprite(1, 38612)];
/* as lanças fincadas no chão: hastes de madeira escura, as pontas de ferro, uma inclinada */
function lancasSprite(v, s) {
  const a = spr();
  const L = v ? [[3, -0.15], [8, 0.1]] : [[2, -0.1], [6, 0.05], [9, 0.2]];
  for (const [x0, sl] of L) {
    for (let y = 3; y <= 11; y++) { const x = x0 + (11 - y) * sl; a.put(x, y, DRT.pau, 3.6 + cg(x, y, s) * 0.5); }
    const tx = x0 + 9 * sl; a.put(tx, 2, FE, 5.2); a.put(tx, 1, FE, 4.8); a.put(tx + 0.6, 0, FE, 6); a.put(tx - 1, 3, FE, 3); a.put(tx + 1, 3, FE, 2.2);
  }
  return rimOut(a, FE[0], true);
}
const LANCAS = [lancasSprite(0, 38621), lancasSprite(1, 38622)];
/* a coluna da cripta: o pé com o degrau, o fuste canelado de mármore negro, o capitel com o anel de ouro */
function colunaSprite(k, s) {   // 0 pé, 1 meio, 2 capitel
  const a = spr(), R = DRT.real, G = DRT.bronze;
  for (let y = 0; y < 12; y++) {
    const wide = (k === 0 && y >= 9) || (k === 2 && y <= 2), x0 = wide ? 1 : 3, x1 = wide ? 10 : 8;
    for (let x = x0; x <= x1; x++) {
      const u = (x + 0.5 - 6) / (x1 - x0 + 1) * 2; let l = 3.8 - u * 1.8 - u * u * 0.5 + cg(x, y, s) * 0.3;
      if (!wide && (x === 4 || x === 7)) l -= 0.9;     // as caneluras
      if (wide && (y === 9 || y === 2)) l += 0.8;
      a.put(x, y, R, l);
    }
    if ((k === 0 && y === 8) || (k === 2 && y === 3)) for (let x = 3; x <= 8; x++) a.put(x, y, G, 5 - (x - 3) * 0.4);   // o anel de ouro
  }
  return rimOut(a, R[0], false);
}
const COLUNA = [colunaSprite(0, 38631), colunaSprite(1, 38632), colunaSprite(2, 38633)];

DECO[NC_ESCADA] = ESCADA; DECO[NC_CORRENTE] = CORRENTE; DECO[NC_LANTERNA] = LANTERNA; DECO[NC_LAPIDE] = LAPIDE; DECO[NC_FLORES] = FLORES; DECO[NC_OSSOS] = OSSOS;
DECO[NC_MORTALHA] = MORTALHA; DECO[NC_MUSGO] = MUSGO; DECO[NC_URNA] = URNA; DECO[NC_LANTERNA_T] = LANTERNA_T; DECO[NC_RAIZ] = RAIZ; DECO[NC_ELMO] = ELMO;
DECO[NC_LANCAS] = LANCAS; DECO[NC_COLUNA] = COLUNA;
const NC_DECO = [
  // id, dureza, cor no mapa, o que solta
  [NC_ESCADA, 0.3, '#545963', null], [NC_CORRENTE, 0.2, '#3d414a', null], [NC_LANTERNA, 0.2, '#94d6b0', null], [NC_LAPIDE, 0.5, '#757067', 'laje_cova'],
  [NC_FLORES, 0.03, '#9a6436', null], [NC_OSSOS, 0.05, '#ddd4ba', null], [NC_MORTALHA, 0.03, '#7a746a', 'mortalha_pano'], [NC_MUSGO, 0.03, '#3a6046', null],
  [NC_URNA, 0.1, '#825434', null], [NC_LANTERNA_T, 0.2, '#94d6b0', null], [NC_RAIZ, 0.03, '#9a9074', null], [NC_ELMO, 0.1, '#545963', null],
  [NC_LANCAS, 0.15, '#745636', null], [NC_COLUNA, 1.8, '#3a3a44', 'marmore_real']
];
for (const [t, dig, col, drop] of NC_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop) BLOCK_DROP[t] = drop; }
EMIT[NC_LANTERNA] = 0.8; EMIT[NC_LANTERNA_T] = 0.75; EMIT[NC_MUSGO] = 0.22;
// o que cai quando o apoio some (56, 87); escada, corrente e coluna ficam
for (const t of [NC_MORTALHA, NC_RAIZ, NC_LANTERNA_T]) CV_HANGS[t] = 1;
for (const t of [NC_LANTERNA, NC_LAPIDE, NC_FLORES, NC_OSSOS, NC_MUSGO, NC_URNA, NC_ELMO, NC_LANCAS]) CV_STANDS[t] = 1;

// que variação vai onde
const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[NC_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== NC_ESCADA ? arr[1] : tileAt(gx, gy + 1) !== NC_ESCADA ? arr[2] : arr[0];
DECO_PICK[NC_CORRENTE] = (gx, gy, arr) => tileAt(gx, gy + 1) === NC_CORRENTE || solidAt(gx, gy + 1) ? arr[gy & 1] : arr[2];
DECO_PICK[NC_LANTERNA] = (gx, gy, arr) => arr[vr(gx, gy, 38701, 2)];
DECO_PICK[NC_LAPIDE] = (gx, gy, arr) => arr[vr(gx, gy, 38702, 3)];
DECO_PICK[NC_FLORES] = (gx, gy, arr) => arr[vr(gx, gy, 38703, 2)];
DECO_PICK[NC_OSSOS] = (gx, gy, arr) => arr[vr(gx, gy, 38704, 3)];
DECO_PICK[NC_MORTALHA] = (gx, gy, arr) => tileAt(gx, gy + 1) === NC_MORTALHA ? arr[0] : arr[1];
const musgoV = (gx, gy) => vr(gx, gy, 38705, 3);
DECO_PICK[NC_MUSGO] = (gx, gy, arr) => arr[musgoV(gx, gy)];
DECO_PICK[NC_URNA] = (gx, gy, arr) => arr[vr(gx, gy, 38706, 2)];
DECO_PICK[NC_RAIZ] = (gx, gy, arr) => tileAt(gx, gy + 1) === NC_RAIZ ? arr[0] : arr[1];
DECO_PICK[NC_ELMO] = (gx, gy, arr) => arr[vr(gx, gy, 38707, 2)];
DECO_PICK[NC_LANCAS] = (gx, gy, arr) => arr[vr(gx, gy, 38708, 2)];
DECO_PICK[NC_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== NC_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== NC_COLUNA ? arr[2] : arr[1];

// a escada de ferro e a corrente se escalam como a corrente da catedral; a escada conta como a escada da mina (a pose de
// subir de frente, 88)
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, NC_ESCADA) || _tt(e, NC_CORRENTE))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, NC_ESCADA)); }; }

/* ================= ao vivo: a chama de alma, o musgo, o lustro da sepulcrita ================= */
const NC_GL = {};
const ncGlow = (k, r, col) => NC_GL[k] || (NC_GL[k] = glow(r, col));
const ncOut = cy => cy + VH < (NC_S0 - 6) * T || cy > (NC_S0 + NC_D + 6) * T;
const ALMA = ['#f0fff8', '#c4f0d8', '#7ad8a8', '#3a9a70'];
const isNcLive = t => t === NC_LANTERNA || t === NC_LANTERNA_T || t === NC_MUSGO || t === NC_O_SEPULCRITA;
HOOK.drawGlow.push((cx, cy) => {
  if (ncOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (!isNcLive(t)) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === NC_LANTERNA || t === NC_LANTERNA_T) {
      const [fx, fy] = t === NC_LANTERNA ? LANT_F[0] : LANT_T_F, f = 0.9 + Math.sin(tm * 5 + gx) * 0.06 + Math.sin(tm * 13 + gy) * 0.04;
      lc.globalAlpha = 0.28 * f; lc.drawImage(ncGlow('lb', 30, NC_COL.alma), x + fx - 30, y + fy - 30);
      lc.globalAlpha = 0.45 * f; lc.drawImage(ncGlow('ls', 7, NC_COL.almaB), x + fx + 0.5 - 7, y + fy - 7);
    } else if (t === NC_MUSGO) {
      lc.globalAlpha = 0.12 + Math.sin(tm * 0.9 + gx * 0.7) * 0.05; lc.drawImage(ncGlow('m9', 9, NC_COL.almaF), x + 6 - 9, y + 9 - 9);
    } else if (!((gx + gy) & 1)) {
      lc.globalAlpha = 0.06 + Math.max(0, Math.sin(tm * 1.2 + gx * 1.3 + gy)) * 0.06; lc.drawImage(ncGlow('s12', 12, NC_COL.alma), x + 6 - 12, y + 6 - 12);
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (ncOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (!isNcLive(t)) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    if (t === NC_LANTERNA || t === NC_LANTERNA_T) {   // a chama de alma: fria, alta e fina, quase sem tremer, a ponta que se solta
      const [fx, fy] = t === NC_LANTERNA ? LANT_F[0] : LANT_T_F, f = Math.floor(tm * 6 + gx * 3) % 4;
      lc.fillStyle = ALMA[3]; lc.fillRect(x + fx, y + fy + 1, 2, 1);
      lc.fillStyle = ALMA[2]; lc.fillRect(x + fx, y + fy - 1, 2, 2);
      lc.fillStyle = ALMA[1]; lc.fillRect(x + fx + (f === 1 ? 1 : 0), y + fy - 2, 1, 1);
      lc.fillStyle = ALMA[0]; lc.fillRect(x + fx + (f === 3 ? 1 : 0), y + fy - 3 + (f === 2 ? 1 : 0), 1, 1);
    } else if (t === NC_MUSGO) {   // os pontinhos acendem um por vez
      const P = MUSGO_P[musgoV(gx, gy)], k = Math.floor(tm * 0.8 + hash2(wrapX(gx), gy, 38711) * 5) % P.length, [px, py] = P[k];
      lc.globalAlpha = 0.5 + Math.sin(tm * 2 + gx) * 0.3; lc.fillStyle = ALMA[0]; lc.fillRect(x + px, y + py, 1, 1); lc.globalAlpha = 1;
    } else {   // o lustro da sepulcrita pisca de vez em quando
      const ph0 = (tm * 0.25 + hash2(wrapX(gx), gy, 38712) * 7) % 1; if (ph0 > 0.06) continue;
      const tp = sepTip(gx, gy); if (!tp) continue;
      lc.fillStyle = '#ffffff'; lc.fillRect(x + tp[0], y + tp[1] - 1, 1, 3); lc.fillRect(x + tp[0] - 1, y + tp[1], 3, 1);
    }
  }
  lc.globalAlpha = 1;
});
Object.assign(NCART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, wrapT, W2, RX, BONE, IVORY, GOLD, IRONC, DRT, ncGlow, NC_GL, ncOut, ALMA,
  vGranito, vTerra, vLaje, vMarmore, vTelha, vNicho, vOssuario, vCantaria, vReal, vCal, vBarreira, vCova, BKV, ESCADA, CORRENTE, LANTERNA, LANT_F });
}
