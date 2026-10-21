'use strict';

/* ================= O Campo da Última Guerra: blocos, paredes, terceira camada, minérios, decoração =================
   O campo de batalha enterrado (docs/camadas/17-campo-guerra.md, seção 4). No Campo das Lâminas, a terra de batalha:
   barro escuro e pisado, cheio de pontas de flecha, cacos de ferro, lascas de osso e manchas de ferrugem; o barro das
   trincheiras em camadas, marcado de botas; o ferro de batalha, armaduras e armas prensadas pela terra em placas com
   rebites. Nos Bastiões de Luz, o mármore celeste creme com veios de ouro e a cantaria dos anjos em blocos com a borda
   lavrada; as asas que caíram viraram penas de pedra sobrepostas. Na Brecha, a rocha queimada preta e marrom com cinza
   nas frestas, a mesma ainda em brasa por dentro, o tijolo de fosso dos demônios e as paliçadas de estacas amarradas.
   Como o 271: cada material é uma textura contínua de 240x240 amostrada em pixels do mundo; contorno, borda acesa,
   sombra e oclusão vêm do 07; paredes e terceira camada só leem o tom. O que brilha é desenhado ao vivo, só sobre o que
   está na tela: a brasa nas rachas, a pena de anjo, a fenda em brasa, a auréola caída, a faísca da belicita.
   Também aqui: GUART, o pintor dos objetos (o do 252/272, com a tinta acesa) e o dos guerreiros (o boneco do herói,
   12 x 22 com os mesmos encaixes, pintado com o heroPaint e vestido de armadura), que o 402 a 406 usam. Ids: 400. */
const GUART = {};
{
const { cg, cn, cells, dPix } = CVART;
const { spr, rimOut, disc, flipX } = FGART;
/* ---- paletas: 6 tons, do escuro ao claro ---- */
pal('guTerra', ['#1a1412', '#2a201a', '#3c2e24', '#4e3e30', '#62503e', '#7a6650']);
pal('guArgila', ['#1e1610', '#30241a', '#443426', '#5a4632', '#705840', '#886c50']);
pal('guSucata', ['#141416', '#222226', '#34343a', '#4a4a52', '#64646c', '#84848c']);
pal('guMarmore', ['#4a4232', '#6e644e', '#948a70', '#b8ae94', '#d8cfb6', '#f0e8d4']);
pal('guCantaria', ['#3e3828', '#5e5640', '#80785c', '#a49a7c', '#c6bc9e', '#e2dac0']);
pal('guEscoria', ['#0e0a0a', '#181212', '#241a18', '#322420', '#42302a', '#544036']);
pal('guBrasa', ['#120a08', '#1e100c', '#2c1812', '#3c2218', '#4e2e20', '#623a28']);
pal('guPenas', ['#3a3630', '#58524a', '#7a7468', '#9c968a', '#bcb6aa', '#dcd6ca']);
pal('guTijolo', ['#1c0c0a', '#2e1410', '#421e18', '#582a20', '#6e382a', '#864836']);
pal('guPalicada', ['#1a120a', '#2a1e12', '#3e2c1a', '#544024', '#6c5430', '#866a40']);
pal('guBarreira', ['#121214', '#22222a', '#383a44', '#545862', '#787c86', '#a0a4ac']);
// paredes de fundo: sempre bem mais escuras que o chão da frente
pal('guTerraW', ['#080605', '#0d0a08', '#130e0b', '#19130f', '#1f1813', '#261e18']);
pal('guMarmoreW', ['#0e0c09', '#15120e', '#1d1913', '#252019', '#2e281f', '#383026']);
pal('guEscoriaW', ['#050303', '#080505', '#0c0807', '#110b09', '#160f0c', '#1c130f']);
pal('guTijoloW', ['#080303', '#0d0505', '#130807', '#190b09', '#200f0c', '#28140f']);
pal('guPalicadaW', ['#070504', '#0c0906', '#110d09', '#17110c', '#1d1610', '#241c14']);
// a terceira camada: o campo ao longe (o tom 5 é o ouro apagado de um estandarte), as muralhas dos anjos (o tom 5 é
// uma janela clara lá longe), o fogo da brecha (o tom 5 é o clarão laranja)
pal('dpGuCampo', ['#030202', '#070504', '#0c0907', '#120e0b', '#1a1510', '#4a3a1c']);
pal('dpGuMuralha', ['#040404', '#080807', '#0e0d0b', '#161410', '#201d17', '#6a6040']);
pal('dpGuFogo', ['#040202', '#090403', '#100605', '#1a0a07', '#2c1008', '#8a3410']);

const wrapT = v => ((v % TP) + TP) % TP;
const W2 = Math.PI * 2 / TP;
const RX = hexes => hexes.map(h => ph(h));
const pp = (a, x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < T && y < T) a[y * T + x] = c; };
const BRASA = RX(['#5a1404', '#a03008', '#e06010', '#ff8a20', '#ffc060', '#fff0c0']);
const OURO = RX(['#3a2808', '#6a4c10', '#a07820', '#d0a838', '#f0d070', '#fff4c0']);
const FERRUGEM = RX(['#2a1208', '#46200e', '#663218', '#884624', '#a85e34']);
const OSSO = RX(['#4a4234', '#6e6450', '#948a72', '#bab096', '#ddd4ba']);
const FERRO = RX(['#16161a', '#2a2a30', '#44444c', '#62626a', '#86868e', '#b0b0b8']);
const CINZA = RX(['#3a3634', '#5a5450', '#7a7470', '#9a948e']);

/* ---- o chão sólido ---- */
function vTerra(x, y) {   // terra de batalha: barro escuro pisado, torrões, pontas de flecha e cacos de ferro, lascas de osso, ferrugem
  let v = 2.4 + cn(x, y, 30, 30, 40101) * 1.7 + cn(x, y, 100, 100, 40102) * 0.8 + cg(x, y, 40103) * 0.7;
  const wet = cn(x, y, 14, 18, 40104); if (wet > 0.2) v -= (wet - 0.2) * 4;
  const c = cells(x, y, 8, 40105);
  if (c.id < 0.12 && c.d1 < 1.8) v += c.ox + c.oy < 0 ? 1 : -0.9;                                               // torrões
  const m = cells(x, y, 16, 40106, 1.3);
  if (m.id < 0.07 && Math.abs(m.oy + m.ox * 0.6) < 0.6 && Math.abs(m.ox) < 3.2) { MATX = FERRO[m.ox < 0 ? 4 : 2]; return -9; }   // um caco de ferro deitado
  if (m.id > 0.93 && m.d1 < 1.6) { MATX = m.oy < 0 ? FERRO[3] : FERRO[1]; return -9; }                          // a ponta de uma flecha
  const b = cells(x, y, 20, 40107, 1.6);
  if (b.id < 0.05 && Math.abs(b.oy) < 0.7 && Math.abs(b.ox) < 2.6) { MATX = OSSO[b.oy < 0 ? 4 : 2]; return -9; }   // lasca de osso
  if (cn(x, y, 8, 8, 40108) > 0.3 && hash2(x, y, 40109) < 0.5) { MATX = FERRUGEM[(hash2(x, y, 40110) * 3) | 0]; return -9; }   // ferrugem
  if (hash2(x, y, 40111) < 0.03) v -= 1;
  return v;
}
function vArgila(x, y) {   // barro pisado das trincheiras: camadas deitadas, marcas de bota, poças secas que brilham
  const Y = wrapT(y), row = Math.floor((Y + Math.floor(cn(x, y, 8, 1, 40121) * 5)) / 5), r = (Y + 600) % 5;
  let v = 2.6 + (hash2(row, 0, 40122) - 0.5) * 1.1 + cn(x, y, 36, 12, 40123) * 0.9 + cg(x, y, 40124) * 0.5;
  if (r === 0) v -= 0.9; else if (r === 1) v += 0.5;
  const s = cells(x, y, 22, 40125, 0.7);
  if (s.id < 0.16 && Math.abs(s.oy) < 1.4 && Math.abs(s.ox) < 4) v -= 1.1 + (s.oy < 0 ? -0.6 : 0);            // a marca de uma bota
  const p = cn(x, y, 12, 6, 40126); if (p > 0.3) v += (p - 0.3) * 4;                                         // a poça seca, lisa e clara
  return v;
}
function vSucata(x, y) {   // ferro de batalha: placas de armadura e lâminas prensadas, sobrepostas, com rebites e ferrugem
  const c = cells(x, y, 18, 40131, 1.2), e = c.d2 - c.d1;
  if (e < 1) return 0.4 + cg(x, y, 40132) * 0.3;                                                             // a fresta entre placas
  let v = 2.4 + (c.id - 0.5) * 1.6 - (c.ox + c.oy) * 0.07 + cg(x, y, 40133) * 0.4;
  if (e < 2.2) v += c.oy < 0 ? 1.2 : -0.5;                                                                    // a borda da placa
  if (c.id > 0.6 && Math.abs(Math.hypot(c.ox - 3, c.oy + 3) - 0) < 1.1) return c.ox < 3 ? 4.8 : 2;            // um rebite
  const ru = cn(x, y, 10, 10, 40134); if (ru > 0.22 && c.id < 0.6) { MATX = FERRUGEM[ru > 0.32 ? 1 : 3]; return -9; }
  if (Math.abs(c.ox - c.oy * 0.3) < 0.4 && c.id > 0.75 && c.d1 < 8) v += 1.6;                                // um risco de golpe que pega luz
  return v;
}
function vMarmore(x, y) {   // mármore celeste: creme, liso, veios de ouro que serpenteiam, manchas de sangue velho
  const u = x + cn(x, y, 10, 10, 40141) * 60, vein = Math.abs(cn(u, y, 18, 40, 40142));
  let v = 3.2 + cn(x, y, 40, 40, 40143) * 1.0 + cg(x, y, 40144) * 0.25;
  if (vein < 0.012) { MATX = OURO[vein < 0.006 ? 4 : 3]; return -9; }
  if (vein < 0.03) v -= 0.8;
  if (cn(x, y, 20, 20, 40145) > 0.34) v -= 0.9;                                                               // a mancha escura
  return v;
}
function vCantaria(x, y) {   // cantaria dos anjos: blocos de 24 x 12 com a borda chanfrada acesa, um friso de ouro de vez em quando
  const X = wrapT(x), Y = wrapT(y), row = Math.floor(Y / 12), off = (row % 2) * 12, bx = (X + off) % 24, by = Y % 12;
  if (by === 0 || bx === 0) return 0.6;                                                                       // a junta
  let v = 3.0 + (hash2(Math.floor((X + off) / 24), row, 40151) - 0.5) * 0.8 + cn(x, y, 30, 30, 40152) * 0.6 + cg(x, y, 40153) * 0.3;
  if (by === 1 || bx === 1) v += 1.2; else if (by === 11 || bx === 23) v -= 1;                              // o chanfro
  if (hash2(Math.floor((X + off) / 24), row, 40154) < 0.12 && (by === 5 || by === 6) && bx > 3 && bx < 21) { MATX = OURO[by === 5 ? 4 : 2]; return -9; }   // o friso
  if (Math.abs(cn(x, y, 8, 30, 40155)) < 0.01) v -= 1.4;                                                      // uma racha
  return v;
}
function vEscoria(x, y) {   // rocha queimada: preta e marrom, rachada de calor em rede, cinza clara nas frestas
  const c = cells(x, y, 20, 40161, 1), e = c.d2 - c.d1;
  if (e < 0.8) { MATX = CINZA[(hash2(x, y, 40162) * 2) | 0]; return -9; }                                    // a cinza na fresta
  let v = 2.3 + (c.id - 0.5) * 1.3 - (c.ox + c.oy) * 0.06 + cn(x, y, 60, 60, 40163) * 0.8 + cg(x, y, 40164) * 0.6;
  if (e < 1.8) v += c.oy < 0 ? 0.8 : -0.6;
  if (hash2(x, y, 40165) < 0.004) { MATX = BRASA[1]; return -9; }                                             // uma brasinha que sobrou
  return v;
}
function vBrasa(x, y) {   // rocha em brasa: a rocha queimada com as rachas ainda acesas por dentro (brilha, não queima)
  const c = cells(x, y, 16, 40171, 1), e = c.d2 - c.d1;
  if (e < 0.9) { MATX = BRASA[e < 0.45 ? 4 : 3]; return -9; }
  if (e < 1.7) { MATX = BRASA[e < 1.3 ? 2 : 1]; return -9; }
  return 2.0 + (c.id - 0.5) * 1.2 - (c.ox + c.oy) * 0.07 + cg(x, y, 40172) * 0.5;
}
function vPenas(x, y) {   // penas petrificadas: penas compridas sobrepostas como telhas, a raque clara no meio de cada uma
  const X = wrapT(x), Y = wrapT(y), row = Math.floor(Y / 10), off = (row % 2) * 6, fx = (X + off) % 12, fy = Y % 10;
  const w = 5.6 * (1 - fy / 12), d = Math.abs(fx - 6);
  if (d > w) return 0.7 + cg(x, y, 40181) * 0.3;                                                              // a sombra da pena de cima
  let v = 3.6 - d * 0.35 - fy * 0.12 + cg(x, y, 40182) * 0.4 + cn(x, y, 30, 30, 40183) * 0.6;
  if (d < 0.6) v += 1.2;                                                                                      // a raque
  else if (Math.sin((fy - d * 0.8) * 2.2) > 0.7) v -= 0.6;                                                    // as barbas
  return v;
}
function vTijolo(x, y) {   // tijolo de fosso: tijolos grossos e tortos, vermelho-escuro, argamassa preta, queimados nas bordas
  const X = wrapT(x), Y = wrapT(y), row = Math.floor(Y / 8), off = (row * 7) % 16, bx = (X + off + Math.floor(cn(x, y, 6, 4, 40191) * 4)) % 16, by = Y % 8;
  if (by === 0 || bx === 0) return 0.4;
  let v = 2.6 + (hash2(Math.floor((X + off) / 16), row, 40192) - 0.5) * 1.2 + cg(x, y, 40193) * 0.6;
  if (by === 1) v += 0.8; else if (by === 7) v -= 0.8;
  if (cn(x, y, 10, 10, 40194) > 0.3) v -= 1.2;                                                                // queimado
  return v;
}
function vPalicada(x, y) {   // paliçada: estacas de 6 px em pé, a ponta de cada uma, duas cintas de corda
  const X = wrapT(x), Y = wrapT(y), sx = X % 6, k = Math.floor(X / 6), by = Y % 12;
  if (sx === 0) return 0.4;
  let v = 2.8 - Math.abs(sx - 2.5) * 0.4 + (sx < 3 ? 0.4 : 0) + (hash2(k, 0, 40201) - 0.5) * 1 + cg(x, y, 40202) * 0.5 + Math.sin(Y * W2 * 30 + k) * 0.25;
  if (by === 3 || by === 4) { MATX = PALS.guArgila[by === 3 ? 4 : 2]; return -9; }                            // a cinta de corda
  if (hash2(Math.floor(X / 2), Math.floor(Y / 3), 40203) < 0.04) v -= 1.2;                                     // um nó da madeira
  return v;
}
function vBarreira(x, y) {   // a muralha de escudos: escudos redondos de 12 px sobrepostos, o umbo aceso no meio
  const X = wrapT(x), Y = wrapT(y), row = Math.floor(Y / 10), off = (row % 2) * 6, cx = ((X + off) % 12) - 6, cy = (Y % 10) - 5;
  const d = Math.hypot(cx, cy * 1.1);
  if (d > 6.2) return 0.5;
  if (d > 5.2) return cx + cy < 0 ? 4.6 : 1.4;                                                                // o aro
  if (d < 1.6) return cx + cy < 0 ? 5 : 2.4;                                                                  // o umbo
  return 2.6 - (cx + cy) * 0.1 + cg(x, y, 40211) * 0.4;
}

/* ---- paredes de fundo (só o tom) ---- */
const vTerraW = (x, y) => { const v = vTerra(x, y); return v === -9 ? 2.6 : v - 0.2; };
const vMarmoreW = (x, y) => { const v = vCantaria(x, y); return v === -9 ? 3.4 : v; };
const vEscoriaW = (x, y) => { const v = vEscoria(x, y); return v === -9 ? 1.4 : v; };
const vTijoloW = (x, y) => vTijolo(x, y);
const vPalicadaW = (x, y) => { const v = vPalicada(x, y); return v === -9 ? 2.4 : v; };

/* ---- a terceira camada ---- */
const wrapD = d => { d = ((d % TP) + TP) % TP; return d > TP / 2 ? d - TP : d; };
function vDpCampo(x, y) {   // o campo ao longe: o chão escuro embaixo, lanças tortas contra o escuro, um estandarte de vez em quando
  const X = wrapT(x), Y = wrapT(y);
  let v = 1.3 + cn(x, y, 30, 30, 40301) * 0.6 + cg(x, y, 40302) * 0.25 + Y / TP * 1.2;
  for (let k = 0; k < 9; k++) {   // as lanças: riscos finos inclinados que saem do chão (Y 200)
    const bx = 14 + k * 26 + hash2(k, 0, 40303) * 10, tilt = (hash2(k, 1, 40303) - 0.5) * 0.5, top = 60 + hash2(k, 2, 40303) * 90;
    if (Y < top || Y > 205) continue;
    const lx = bx + (205 - Y) * tilt; if (Math.abs(wrapD(X - lx)) < 0.8) return 3.2;
    if (k % 4 === 1 && Y > top && Y < top + 18 && wrapD(X - lx) > 0 && wrapD(X - lx) < 14 - (Y - top) * 0.3) return Y < top + 3 ? 5 : 2.8;   // o estandarte
  }
  if (Y > 205) v = 2.6 + cn(x, y, 12, 4, 40304) * 0.8;
  return v;
}
function vDpMuralha(x, y) {   // as muralhas dos anjos ao longe: torres altas com ameias, uma janela clara de vez em quando
  const X = wrapT(x), Y = wrapT(y), k = Math.floor(X / 60), tx = X % 60, top = 40 + hash2(k, 0, 40311) * 50;
  let v = 1.2 + cn(x, y, 30, 30, 40312) * 0.5 + cg(x, y, 40313) * 0.2;
  if (tx > 14 && tx < 46 && Y > top) {
    v = 2.6 + (tx < 20 ? 0.6 : tx > 40 ? -0.5 : 0) + cn(x, y, 8, 8, 40314) * 0.4;
    if (Y < top + 6 && (tx % 8) < 4) return 0.9;                                                               // as ameias
    if (hash2(k, Math.floor(Y / 24), 40315) < 0.3 && tx > 27 && tx < 33 && Y % 24 > 8 && Y % 24 < 18) return 5;   // a janela clara
  } else if (Y > 180) v = 2.2 + (Y - 180) / 60;                                                                // o muro baixo entre as torres
  return v;
}
function vDpFogo(x, y) {   // o fogo da brecha: rocha escura em costelas, o clarão laranja subindo de baixo pelas fendas
  const u = wrapT(x + cn(x, y, 3, 6, 40321) * 50), r = Math.sin(u * W2 * 5);
  let v = 1.4 + r * 0.7 + cn(x, y, 20, 20, 40322) * 0.7 + cg(x, y, 40323) * 0.3;
  if (r < -0.8) { v = 2.4 + wrapT(y) / TP * 2.6 + cn(x, y, 6, 20, 40324); if (v > 4.6) v = 5; }
  return v;
}

/* ---- assar e registrar ---- */
const BKV = {
  terra: bake(vTerra), argila: bake(vArgila), sucata: bake(vSucata), marmore: bake(vMarmore), cantaria: bake(vCantaria), escoria: bake(vEscoria), brasa: bake(vBrasa),
  penas: bake(vPenas), tijolo: bake(vTijolo), palicada: bake(vPalicada), barreira: bake(vBarreira),
  terraW: bake(vTerraW), marmoreW: bake(vMarmoreW), escoriaW: bake(vEscoriaW), tijoloW: bake(vTijoloW), palicadaW: bake(vPalicadaW),
  dpCampo: bake(vDpCampo), dpMuralha: bake(vDpMuralha), dpFogo: bake(vDpFogo)
};
const GU_SOLID = [
  // id, paleta, textura, dureza, cor no mapa
  [GU_TERRA, 'guTerra', 'terra', 0.8, '#4e3e30'], [GU_ARGILA, 'guArgila', 'argila', 0.6, '#5a4632'], [GU_SUCATA, 'guSucata', 'sucata', 1.6, '#4a4a52'],
  [GU_MARMORE, 'guMarmore', 'marmore', 1.5, '#b8ae94'], [GU_CANTARIA, 'guCantaria', 'cantaria', 1.6, '#a49a7c'], [GU_ESCORIA, 'guEscoria', 'escoria', 1.3, '#322420'],
  [GU_BRASA, 'guBrasa', 'brasa', 1.3, '#a03008'], [GU_PENAS, 'guPenas', 'penas', 1.1, '#9c968a'], [GU_TIJOLO, 'guTijolo', 'tijolo', 1.2, '#582a20'],
  [GU_PALICADA, 'guPalicada', 'palicada', 0.5, '#6c5430'], [GU_BARREIRA, 'guBarreira', 'barreira', 0, '#787c86']
];
for (const [t, p, k, dig, col] of GU_SOLID) { MAT[t] = [PALS[p], BKV[k]]; SOLID[t] = 1; BLOCKY[t] = 1; DIG[t] = dig; PCOL[t] = col; }
for (const t of [GU_TERRA, GU_ARGILA, GU_ESCORIA, GU_MARMORE]) BLEND[t] = 1;
EMIT[GU_BRASA] = 0.42;

WMAT[WGU_TERRA] = [PALS.guTerraW, BKV.terraW]; WMAT[WGU_MARMORE] = [PALS.guMarmoreW, BKV.marmoreW]; WMAT[WGU_ESCORIA] = [PALS.guEscoriaW, BKV.escoriaW];
WMAT[WGU_TIJOLO] = [PALS.guTijoloW, BKV.tijoloW]; WMAT[WGU_PALICADA] = [PALS.guPalicadaW, BKV.palicadaW];
DMAT[DP_GU_CAMPO] = [PALS.dpGuCampo, BKV.dpCampo]; DMAT[DP_GU_MURALHA] = [PALS.dpGuMuralha, BKV.dpMuralha]; DMAT[DP_GU_FOGO] = [PALS.dpGuFogo, BKV.dpFogo];

/* ---- os minérios: o carvão na terra e na rocha queimada; a belicita: lascas de lâmina cinza-vinho com o fio dourado ---- */
oreRamp(GU_O_BELICITA, ['#140a0c', '#2a1418', '#4a2a30', '#6a4044', '#8a5a5e', '#c8a060', '#fff0b0']);
const BEL_TIP = new Map();
ORE_PAINT[GU_O_BELICITA] = function (L, s) {
  const R = ORE_RAMP[GU_O_BELICITA], n = 2 + (hash2(s, 1, 40401) < 0.55 ? 1 : 0);
  let tip = null, best = -9;
  for (let i = 0; i < n; i++) {   // lascas de lâmina: triângulos compridos saindo da terra, inclinados, a aresta de cima dourada
    const bx = 2.5 + hash2(s, 2 + i, 40402) * 7, by = 9 + hash2(s, 3 + i, 40403) * 2, len = 5 + hash2(s, i, 40404) * 3, a = -Math.PI / 2 + (hash2(s, 5 + i, 40405) - 0.5) * 1.2;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
      const dx = x + 0.5 - bx, dy = y + 0.5 - by, u = dx * ca + dy * sa, w = -dx * sa + dy * ca;
      if (u < 0 || u > len) continue; const hw = 1.5 * (1 - u / len) + 0.3; if (Math.abs(w) > hw) continue;
      let l = 3 - w * 0.9 + (hash2(x + s, y, 40406) - 0.5) * 0.4;
      if (w < -hw + 0.7) { l = 5.2; if (u > best) { best = u; tip = [x, y]; } }                               // o fio dourado
      L.put(x, y, ramp(R, Math.min(l, R.length - 2)), l);
    }
  }
  if (tip) L.put(tip[0], tip[1], R[6], 9);
  BEL_TIP.set(s, tip);
};
ORE_HALO[GU_O_BELICITA] = { pal: ['guTerra', '#6a2a30', 0.3, 0.12], shade: 0.4 };
ORE_PAINT[GU_O_CARVAO] = ORE_PAINT[COAL]; ORE_HALO[GU_O_CARVAO] = { pal: ['guTerra', '#020204', 0.5, 0.2], shade: 0 };
MAT[GU_O_CARVAO] = [PALS.guTerra, bakeOre(GU_O_CARVAO, vTerra)]; MAT[GU_O_BELICITA] = [PALS.guTerra, bakeOre(GU_O_BELICITA, vTerra)];
for (const t of [GU_O_CARVAO, GU_O_BELICITA]) { SOLID[t] = 1; BLOCKY[t] = 1; BLEND[t] = 1; }
DIG[GU_O_CARVAO] = DIG[COAL]; ORE_XP[GU_O_CARVAO] = ORE_XP[COAL]; ORE_NAME[GU_O_CARVAO] = ORE_NAME[COAL]; PCOL[GU_O_CARVAO] = PCOL[COAL]; ORE_ITEM[GU_O_CARVAO] = ORE_ITEM[COAL];
DIG[GU_O_BELICITA] = 1.9; ORE_XP[GU_O_BELICITA] = 26; ORE_NAME[GU_O_BELICITA] = 'Belicita'; PCOL[GU_O_BELICITA] = '#c8a060'; ORE_ITEM[GU_O_BELICITA] = 'min_belicita';
EMIT[GU_O_BELICITA] = 0.2;
const belTip = (gx, gy) => BEL_TIP.get(((wrapX(gx) % 20) * 31 + (gy % 20) * 977 + GU_O_BELICITA * 7919) | 0);

/* ---- itens de bloco ---- */
const GU_ITEMS = {
  terra_batalha: ['Terra de Batalha', GU_TERRA, 'Barro escuro pisado por dois exércitos, cheio de pontas de flecha e cacos de ferro.'],
  barro_trincheira: ['Barro de Trincheira', GU_ARGILA, 'O barro das trincheiras, em camadas, com marcas de bota.'],
  ferro_batalha: ['Ferro de Batalha', GU_SUCATA, 'Armaduras e lâminas que a terra prensou numa placa só. Dura e pesada.'],
  marmore_celeste: ['Mármore Celeste', GU_MARMORE, 'A pedra clara dos bastiões dos anjos, com veios de ouro.'],
  cantaria_anjos: ['Cantaria dos Anjos', GU_CANTARIA, 'Mármore lavrado em blocos perfeitos, com a borda chanfrada.'],
  rocha_queimada: ['Rocha Queimada', GU_ESCORIA, 'Rocha preta, rachada pelo fogo de quando os demônios entraram.'],
  penas_pedra: ['Penas Petrificadas', GU_PENAS, 'Penas de uma asa enorme que caiu e virou pedra.'],
  tijolo_fosso: ['Tijolo de Fosso', GU_TIJOLO, 'Tijolo grosso e torto das trincheiras dos demônios.'],
  palicada: ['Paliçada', GU_PALICADA, 'Estacas de madeira escura amarradas com corda.']
};
for (const id in GU_ITEMS) { const [name, block, desc] = GU_ITEMS[id]; ITEMS[id] = Object.assign(ITEMS[id] || {}, { name, rar: 0, stack: 99, block, desc }); BLOCK_DROP[block] = id; }
BLOCK_DROP[GU_BRASA] = 'rocha_queimada';   // apagada na mão

/* ================= decoração: sprites de 12x12 em rampas ================= */
const DRE = {
  madeira: ['#120c06', '#22160c', '#362414', '#4c341e', '#64462a', '#7e5a36', '#9a7244'],
  corda: ['#1a140c', '#2e2416', '#463822', '#5e4c30', '#786240', '#927a52', '#ae9468'],
  ferro: ['#0e0e10', '#1c1c20', '#2e2e34', '#46464e', '#62626a', '#86868e', '#b0b0b8'],
  ouro: ['#2a1a04', '#4a3008', '#7a5410', '#a87e20', '#d0a838', '#f0d070', '#fff4c0'],
  osso: ['#2a2418', '#4a4234', '#6e6450', '#948a72', '#bab096', '#ddd4ba', '#f2ead4'],
  pena: ['#4a4436', '#6e6650', '#968c72', '#bcb296', '#ddd4ba', '#f2ecd8', '#fffbee'],
  pano: ['#1e0606', '#360c0a', '#521410', '#701e18', '#8e2a22', '#ac3a2e', '#c85040'],
  brasa: ['#3a0c02', '#6a1a04', '#a83a08', '#e06a10', '#ff9a30', '#ffd070', '#fff4c8'],
  terra: ['#100c0a', '#1a1412', '#2a201a', '#3c2e24', '#4e3e30', '#62503e', '#7a6650'],
  couro: ['#140a06', '#2a160c', '#442614', '#5e381e', '#7a4c2a', '#9a663a', '#bc8650']
};
for (const k in DRE) DRE[k] = DRE[k].map(h => ph(h));
const MD = DRE.madeira, FE = DRE.ferro;

/* a escada de cerco: dois banzos de madeira e degraus grossos amarrados, gasta onde a mão pega */
function escadaSprite(k, s) {   // 0 meio, 1 topo, 2 pé
  const a = spr();
  for (let y = 0; y < 12; y++) { a.put(2, y, MD, 4.4 + cg(2, y, s) * 0.5); a.put(3, y, MD, 2.6); a.put(8, y, MD, 3.8 + cg(8, y, s) * 0.5); a.put(9, y, MD, 2.2); }
  for (const ry of [2, 8]) { for (let x = 3; x < 9; x++) { a.put(x, ry, MD, 5.2 - (x - 3) * 0.25); a.put(x, ry + 1, MD, 2.4); } a.put(2, ry, DRE.corda, 5); a.put(8, ry, DRE.corda, 4.6); }
  if (k === 1) { a.put(2, 0, MD, 6); a.put(8, 0, MD, 5.6); }
  if (k === 2) for (const x of [2, 8]) { a.put(x, 11, DRE.terra, 3); a.put(x + 1, 11, DRE.terra, 2); }
  return rimOut(a, MD[0], false);
}
const ESCADA = [escadaSprite(0, 40501), escadaSprite(1, 40502), escadaSprite(2, 40503)];
/* a corda de cerco: cânhamo grosso torcido, um nó a cada 6 */
function cordaSprite(end, s) {
  const a = spr(), R = DRE.corda, len = end ? 9 : 12;
  for (let y = 0; y < len; y++) {
    const ph0 = (y + s) % 3, x0 = 5;
    a.put(x0, y, R, ph0 === 0 ? 5.6 : 4); a.put(x0 + 1, y, R, ph0 === 1 ? 4.4 : 2.4);
    if ((y + s) % 6 === 4) { a.put(x0 - 1, y, R, 4); a.put(x0 + 2, y, R, 2.2); a.put(x0, y, R, 6); }
  }
  if (end) { a.put(5, 9, R, 4.4); a.put(4, 10, R, 3.4); a.put(6, 10, R, 2.6); a.put(5, 11, R, 2); }
  return rimOut(a, R[0], false);
}
const CORDA = [cordaSprite(false, 0), cordaSprite(false, 2), cordaSprite(true, 1)];
/* a lança fincada: a haste torta enfiada no chão, a ponta de ferro para cima, um trapo amarrado */
function lancaSprite(v, s) {
  const a = spr(), tilt = v ? -0.28 : 0.22;
  for (let y = 3; y < 12; y++) { const x = 6 + (11 - y) * tilt; a.put(x, y, MD, 4.4 - (y - 3) * 0.12); a.put(x + 1, y, MD, 2.4); }
  const tx = 6 + 9 * tilt;
  for (let y = 0; y < 3; y++) { const hw = y === 0 ? 0 : 1; for (let x = Math.round(tx) - hw; x <= Math.round(tx) + hw; x++) a.put(x, y, FE, x <= tx ? 5.4 - y * 0.4 : 3 - y * 0.3); }
  for (let j = 0; j < 4; j++) { a.put(tx + 1 + j * 0.8, 4 + j * 0.6, DRE.pano, 4.6 - j * 0.5); a.put(tx + 1 + j * 0.8, 5 + j * 0.6, DRE.pano, 2.6); }
  a.put(5, 11, DRE.terra, 3); a.put(8, 11, DRE.terra, 2.4);
  return rimOut(a, MD[0]);
}
const LANCA = [lancaSprite(0, 40511), lancaSprite(1, 40512), flipX(lancaSprite(0, 40513))];
/* a espada fincada: a lâmina enterrada até a metade, a guarda em cruz, o cabo em couro, o pomo */
function espadaSprite(v, s) {
  const a = spr(), cx = 5 + v;
  for (let y = 6; y < 12; y++) { a.put(cx, y, FE, 5.4 - (y - 6) * 0.3); a.put(cx + 1, y, FE, 3.2 - (y - 6) * 0.2); }
  for (let x = cx - 2; x <= cx + 3; x++) { a.put(x, 5, v ? DRE.ouro : FE, 4.8 - (x - cx + 2) * 0.4); a.put(x, 6, v ? DRE.ouro : FE, 2.4); }
  for (let y = 2; y < 5; y++) { a.put(cx, y, DRE.couro, y % 2 ? 4.4 : 3); a.put(cx + 1, y, DRE.couro, 2.4); }
  a.put(cx, 1, v ? DRE.ouro : FE, 5.6); a.put(cx + 1, 1, v ? DRE.ouro : FE, 3.4); a.put(cx, 0, v ? DRE.ouro : FE, 4);
  for (let x = cx - 2; x <= cx + 3; x++) a.put(x, 11, DRE.terra, 3.4 - Math.abs(x - cx) * 0.4);
  return rimOut(a, FE[0]);
}
const ESPADA = [espadaSprite(0, 40521), espadaSprite(1, 40522)];
/* o elmo caído: de lado no chão, a viseira em fenda, amassado, uma pluma rasgada */
function elmoSprite(v, s) {
  const a = spr();
  disc(a, 6, 8.2, 4.4, 3.6, FE, (dx, dy, d, x, y) => 4.2 - (dx + dy) * 1.2 - d * 0.6 + cg(x, y, s) * 0.5 + (y === 8 && x > 4 ? -3 : 0));
  for (let x = 2; x < 11; x++) a.put(x, 11, FE, 2 - Math.abs(x - 6) * 0.1);
  if (v) for (let j = 0; j < 5; j++) { a.put(3 - j * 0.6, 5 - j * 0.4, DRE.pano, 4.8 - j * 0.5); a.put(3 - j * 0.6, 6 - j * 0.4, DRE.pano, 2.6); }
  else { a.put(7, 4, DRE.ouro, 5); a.put(8, 4, DRE.ouro, 3.6); }
  a.put(4, 6, FE, 6); a.put(5, 5, FE, 5.6);
  return rimOut(a, FE[0]);
}
const ELMO = [elmoSprite(0, 40531), elmoSprite(1, 40532), flipX(elmoSprite(1, 40533))];
/* a pena de anjo: uma pena comprida e clara caída torta no chão; o brilho é ao vivo */
const PENA_P = [[3, 4], [8, 4]];
function penaSprite(v, s) {
  const a = spr(), R = DRE.pena, x0 = v ? 9 : 2, x1 = v ? 2 : 9, y0 = 4, y1 = 11;
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 1.4, w = 2 * Math.sin(t * Math.PI * 0.9 + 0.2);
    for (let k = -Math.ceil(w); k <= Math.ceil(w); k++) a.put(x + k * 0.35 * (v ? -1 : 1), y - k * 0.8, R, (k === 0 ? 6 : 4.6 - Math.abs(k) * 0.6) + cg(Math.round(x), Math.round(y), s) * 0.4);
  }
  return rimOut(a, R[0]);
}
const PENA = [penaSprite(0, 40541), penaSprite(1, 40542)];
/* a fenda em brasa: uma rachadura no chão, larga no meio, acesa por dentro; a fagulha é ao vivo */
function fendaSprite(v, s) {
  const a = spr();
  for (let x = 0; x < 12; x++) {
    const w = Math.max(0, 1.6 - Math.abs(x - 5.5 - v) * 0.28), y = 10 + Math.round(Math.sin(x * 0.9 + s) * 0.6);
    for (let k = 0; k <= w; k++) a.put(x, y - k, DRE.brasa, 5.8 - k * 1.4);
    a.put(x, y + 1, DRE.terra, 2.4); if (w > 0.5) { a.put(x, y - Math.ceil(w) - 1, DRE.terra, 4.4); }
  }
  return a;
}
const FENDA = [fendaSprite(0, 40551), fendaSprite(1, 40552)];
/* a flâmula rasgada: uma tira de pano vermelho com a barra dourada, pendurada de um prego do teto, rasgada em pontas */
function flamulaSprite(k, s) {   // 0 o pano, 1 a ponta rasgada
  const a = spr(), R = DRE.pano;
  for (let y = 0; y < 12; y++) {
    const sw = Math.sin(y * 0.5 + s) * 0.6, x0 = 3 + sw, x1 = 9 + sw - (k && y > 6 ? (y - 6) * 0.6 : 0);
    if (k && y > 9) break;
    for (let x = Math.round(x0); x < x1; x++) a.put(x, y, (y === 1 && !k) ? DRE.ouro : R, (y === 1 && !k) ? 5 : 4.6 - (x - x0) * 0.35 + cg(x, y, s) * 0.4 + (x === Math.round(x0) ? 0.8 : 0));
    if (!k && y === 0) { a.put(5, 0, FE, 4); a.put(6, 0, FE, 3); }
  }
  if (k) for (const x of [4, 6, 8]) { a.put(x, 10, R, 3); a.put(x, 11, R, 2); }
  return rimOut(a, R[0], false);
}
const FLAMULA = [flamulaSprite(0, 40561), flamulaSprite(1, 40562)];
/* as flechas fincadas: três flechas no chão em ângulos, as penas de cada uma */
function flechasSprite(v, s) {
  const a = spr();
  const L = v ? [[3, 0.5], [7, -0.3], [9, 0.2]] : [[2, -0.4], [5, 0.3], [9, -0.1]];
  for (const [bx, t] of L) {
    for (let j = 0; j < 8; j++) { const x = bx + j * t, y = 11 - j; a.put(x, y, MD, 4.2 - j * 0.15); }
    const tx = bx + 7 * t, ty = 4; a.put(tx, ty, DRE.pena, 5); a.put(tx - 1, ty + 1, DRE.pena, 3.4); a.put(tx + 1, ty + 1, DRE.pena, 4);
  }
  for (let x = 1; x < 11; x++) a.put(x, 11, DRE.terra, 2.6);
  return rimOut(a, MD[0]);
}
const FLECHAS = [flechasSprite(0, 40571), flechasSprite(1, 40572)];
/* os ossos de soldado: um crânio de lado e duas tíbias cruzadas, meio enterrados */
function ossosSprite(v, s) {
  const a = spr(), R = DRE.osso;
  for (let j = 0; j < 9; j++) { a.put(1 + j, 10 - j * 0.3, R, 4.6 - j * 0.1); a.put(1 + j, 11 - j * 0.3, R, 2.6); }
  if (v) for (let j = 0; j < 7; j++) { a.put(3 + j, 8 + j * 0.4, R, 4.2); }
  disc(a, 8, 8, 2.8, 2.6, R, (dx, dy, d, x, y) => 4.8 - (dx + dy) * 1.2 - d * 0.5 + cg(x, y, s) * 0.3);
  a.put(8, 8, R, 0.4); a.put(9, 8, R, 0.6); a.put(10, 10, R, 1); a.put(7, 10, R, 5.6);
  for (let x = 0; x < 12; x++) a.put(x, 11, DRE.terra, 2.8 + cg(x, 11, s));
  return rimOut(a, R[0]);
}
const OSSOS = [ossosSprite(0, 40581), ossosSprite(1, 40582), flipX(ossosSprite(1, 40583))];
/* a corrente pendurada: elos grossos de ferro alternando de frente e de lado, um gancho no fim */
function grilhaoSprite(end, s) {
  const a = spr(), len = end ? 10 : 12;
  for (let y = 0; y < len; y++) {
    const k = Math.floor(y / 3) % 2, yy = y % 3;
    if (k === 0) { a.put(5, y, FE, yy === 1 ? 2 : 5); a.put(7, y, FE, yy === 1 ? 2.4 : 3.4); if (yy !== 1) a.put(6, y, FE, 4.4); }
    else { a.put(6, y, FE, 4.8); a.put(7, y, FE, 2.6); }
  }
  if (end) { a.put(6, 10, FE, 5); a.put(7, 11, FE, 4); a.put(5, 11, FE, 3); a.put(4, 10, FE, 3.4); }
  return rimOut(a, FE[0], false);
}
const GRILHAO = [grilhaoSprite(false, 0), grilhaoSprite(true, 1)];
/* a lança gigante: a haste grossa de uma arma de gigante cravada do chão ao teto; o pé com terra, o meio, a ponta */
function colunaSprite(k, s) {   // 0 pé, 1 meio, 2 topo (a ponta de ferro cravada no teto), 3 meio com a cinta de couro
  const a = spr();
  for (let y = 0; y < 12; y++) {
    const hw = k === 2 && y < 6 ? 1 + y * 0.35 : 2.4;
    for (let x = 0; x < 12; x++) { const dx = x + 0.5 - 6; if (Math.abs(dx) > hw) continue; const R = k === 2 && y < 6 ? FE : MD; a.put(x, y, R, 4.6 - dx * 0.7 + cg(x, y, s) * 0.3 + Math.sin(y * 0.8 + s) * 0.2); }
    if (k === 3 && y >= 4 && y <= 6) for (let x = 3; x < 9; x++) a.put(x, y, DRE.couro, y === 4 ? 4.6 : 3);
  }
  if (k === 0) for (let x = 1; x < 11; x++) { a.put(x, 11, DRE.terra, 3.4 - Math.abs(x - 6) * 0.2); if (Math.abs(x - 6) > 2) a.put(x, 10, DRE.terra, 2.6); }
  return rimOut(a, MD[0], false);
}
const COLUNA = [colunaSprite(0, 40591), colunaSprite(1, 40592), colunaSprite(2, 40593), colunaSprite(3, 40594)];
/* o escudo caído: deitado de lado no chão, a frente pintada com a faixa do exército (ouro dos anjos ou vinho dos demônios) */
function escudoSprite(v, s) {
  const a = spr(), R = v ? DRE.pano : DRE.ouro;
  for (let x = 0; x < 12; x++) { const h = Math.round(4 * Math.sin((x + 0.5) / 12 * Math.PI)); for (let j = 0; j <= h; j++) a.put(x, 11 - j, j === h ? FE : (x === 5 || x === 6) ? R : MD, j === h ? 5.2 : 4 - j * 0.3 + cg(x, j, s) * 0.4); }
  a.put(6, 9, FE, 6); a.put(5, 9, FE, 4.4);
  return rimOut(a, MD[0]);
}
const ESCUDO = [escudoSprite(0, 40601), escudoSprite(1, 40602)];
/* a auréola caída: um aro de ouro deitado torto no chão, ainda aceso (a luz dos pousos); o brilho é ao vivo */
function aureolaSprite(v, s) {
  const a = spr(), R = DRE.ouro;
  for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 2, x = 6 + Math.cos(t) * 4.4, y = 9 + Math.sin(t) * 1.6 - (v ? Math.cos(t) * 0.8 : 0); a.put(x, y, R, Math.sin(t) < 0 ? 6 : 4.4); }
  for (let x = 1; x < 11; x++) a.put(x, 11, DRE.terra, 2.6);
  return a;
}
const AUREOLA = [aureolaSprite(0, 40611), aureolaSprite(1, 40612)];
/* o espinho de ferro: um estrepe de quatro pontas no chão, uma sempre para cima */
function cravoSprite(v, s) {
  const a = spr();
  const pts = v ? [[6, 3], [2, 11], [10, 11], [8, 10]] : [[5, 4], [1, 11], [11, 10], [3, 10]];
  for (const [px, py] of pts) { const n = 8; for (let j = 0; j <= n; j++) { const t = j / n; a.put(6 + (px - 6) * t, 9.6 + (py - 9.6) * t, FE, 4.6 - t * 0.8); } }
  a.put(6, 9, FE, 5.6); a.put(pts[0][0], pts[0][1], FE, 6);
  return rimOut(a, FE[0]);
}
const CRAVO = [cravoSprite(0, 40621), cravoSprite(1, 40622)];

DECO[GU_ESCADA] = ESCADA; DECO[GU_CORDA] = CORDA; DECO[GU_LANCA] = LANCA; DECO[GU_ESPADA] = ESPADA; DECO[GU_ELMO] = ELMO; DECO[GU_PENA] = PENA;
DECO[GU_FENDA] = FENDA; DECO[GU_FLAMULA] = FLAMULA; DECO[GU_FLECHAS] = FLECHAS; DECO[GU_OSSOS] = OSSOS; DECO[GU_GRILHAO] = GRILHAO; DECO[GU_COLUNA] = COLUNA;
DECO[GU_ESCUDO] = ESCUDO; DECO[GU_AUREOLA] = AUREOLA; DECO[GU_CRAVO] = CRAVO;
const GU_DECO = [
  // id, dureza, cor no mapa, o que solta
  [GU_ESCADA, 0.3, '#64462a', null], [GU_CORDA, 0.15, '#786240', null], [GU_LANCA, 0.2, '#64462a', null], [GU_ESPADA, 0.25, '#86868e', null], [GU_ELMO, 0.2, '#62626a', null],
  [GU_PENA, 0.03, '#ddd4ba', 'pena_anjo'], [GU_FENDA, 0.5, '#ff9a30', null], [GU_FLAMULA, 0.05, '#8e2a22', 'trapo_estandarte'], [GU_FLECHAS, 0.05, '#64462a', null], [GU_OSSOS, 0.1, '#bab096', null],
  [GU_GRILHAO, 0.4, '#46464e', null], [GU_COLUNA, 1.1, '#64462a', 'palicada'], [GU_ESCUDO, 0.2, '#a87e20', null], [GU_AUREOLA, 0.4, '#f0d070', null], [GU_CRAVO, 0.1, '#62626a', null]
];
for (const [t, dig, col, drop] of GU_DECO) { DIG[t] = dig; PCOL[t] = col; if (drop) BLOCK_DROP[t] = drop; }
EMIT[GU_PENA] = 0.32; EMIT[GU_FENDA] = 0.55; EMIT[GU_AUREOLA] = 0.75; EMIT[GU_ESPADA] = 0.02;
// a pena e a fenda soltam pouco: a pena de anjo só às vezes (o BLOCK_DROP vale sempre; o 405 limita quantas há)
CV_HANGS[GU_FLAMULA] = 1;
for (const t of [GU_LANCA, GU_ESPADA, GU_ELMO, GU_PENA, GU_FLECHAS, GU_OSSOS, GU_ESCUDO, GU_AUREOLA, GU_CRAVO]) CV_STANDS[t] = 1;

const vr = (gx, gy, s, n) => (hash2(wrapX(gx), gy, s) * n) | 0;
DECO_PICK[GU_ESCADA] = (gx, gy, arr) => tileAt(gx, gy - 1) !== GU_ESCADA ? arr[1] : tileAt(gx, gy + 1) !== GU_ESCADA ? arr[2] : arr[0];
DECO_PICK[GU_CORDA] = (gx, gy, arr) => tileAt(gx, gy + 1) === GU_CORDA || solidAt(gx, gy + 1) ? arr[gy & 1] : arr[2];
DECO_PICK[GU_LANCA] = (gx, gy, arr) => arr[vr(gx, gy, 40631, 3)];
DECO_PICK[GU_ESPADA] = (gx, gy, arr) => arr[vr(gx, gy, 40632, 2)];
DECO_PICK[GU_ELMO] = (gx, gy, arr) => arr[vr(gx, gy, 40633, 3)];
const penaV = (gx, gy) => vr(gx, gy, 40634, 2);
DECO_PICK[GU_PENA] = (gx, gy, arr) => arr[penaV(gx, gy)];
DECO_PICK[GU_FENDA] = (gx, gy, arr) => arr[vr(gx, gy, 40635, 2)];
DECO_PICK[GU_FLAMULA] = (gx, gy, arr) => tileAt(gx, gy + 1) === GU_FLAMULA ? arr[0] : arr[1];
DECO_PICK[GU_FLECHAS] = (gx, gy, arr) => arr[vr(gx, gy, 40636, 2)];
DECO_PICK[GU_OSSOS] = (gx, gy, arr) => arr[vr(gx, gy, 40637, 3)];
DECO_PICK[GU_GRILHAO] = (gx, gy, arr) => tileAt(gx, gy + 1) === GU_GRILHAO ? arr[0] : arr[1];
DECO_PICK[GU_COLUNA] = (gx, gy, arr) => tileAt(gx, gy + 1) !== GU_COLUNA ? arr[0] : tileAt(gx, gy - 1) !== GU_COLUNA ? arr[2] : arr[hash2(wrapX(gx), gy, 40638) < 0.2 ? 3 : 1];
DECO_PICK[GU_ESCUDO] = (gx, gy, arr) => arr[vr(gx, gy, 40639, 2)];
DECO_PICK[GU_AUREOLA] = (gx, gy, arr) => arr[vr(gx, gy, 40640, 2)];
DECO_PICK[GU_CRAVO] = (gx, gy, arr) => arr[vr(gx, gy, 40641, 2)];

// a escada de cerco sobe como a escada da mina (a pose de subir); a corda, como a corrente
{ const _tt = touchingTile; touchingTile = function (e, t) { return _tt(e, t) || (t === CHAIN && (_tt(e, GU_ESCADA) || _tt(e, GU_CORDA))) || (typeof MN_ESCADA !== 'undefined' && t === MN_ESCADA && _tt(e, GU_ESCADA)); }; }

/* ================= ao vivo: a brasa, a pena, a fenda, a auréola, a faísca da belicita ================= */
const GU_GL = {};
const guGlow = (k, r, col) => GU_GL[k] || (GU_GL[k] = glow(r, col));
const guOut = cy => cy + VH < (GU_S0 - 6) * T || cy > (GU_S0 + GU_D + 6) * T;
const isGu = t => t >= GU_TERRA && t <= GU_CRAVO;
HOOK.drawGlow.push((cx, cy) => {
  if (guOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (!isGu(t)) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case GU_BRASA: if ((gx + gy) & 1) break; lc.globalAlpha = 0.12 + Math.sin(tm * 1.3 + gx * 0.7 + gy) * 0.05; lc.drawImage(guGlow('b14', 14, '#ff6a1a'), x + 6 - 14, y + 6 - 14); break;
      case GU_PENA: { const [px, py] = PENA_P[penaV(gx, gy)]; lc.globalAlpha = 0.2 + Math.sin(tm * 1.1 + gx) * 0.06; lc.drawImage(guGlow('p16', 16, '#fff0d0'), x + px + 2 - 16, y + py + 3 - 16); break; }
      case GU_FENDA: lc.globalAlpha = 0.24 + Math.sin(tm * 4 + gx * 1.3) * 0.06 + Math.sin(tm * 11 + gy) * 0.03; lc.drawImage(guGlow('f18', 18, '#ff7a20'), x + 6 - 18, y + 9 - 18); break;
      case GU_AUREOLA: lc.globalAlpha = 0.34 + Math.sin(tm * 1.6 + gx * 0.4) * 0.07; lc.drawImage(guGlow('a26', 26, GU_COL.ouro), x + 6 - 26, y + 9 - 26); lc.globalAlpha = 0.4; lc.drawImage(guGlow('a8', 8, '#fff4c0'), x + 6 - 8, y + 8 - 8); break;
      case GU_O_BELICITA: lc.globalAlpha = 0.06 + Math.max(0, Math.sin(tm * 1.4 + gx * 1.9 + gy)) * 0.06; lc.drawImage(guGlow('o12', 12, '#e0b060'), x + 6 - 12, y + 6 - 12); break;
    }
  }
  lc.globalAlpha = 1;
});
HOOK.drawTop.push((cx, cy) => {
  if (guOut(cy)) return;
  const tm = gameTime;
  for (let i = 0; i < emitters.length; i += 3) {
    const t = emitters[i + 2]; if (!isGu(t)) continue;
    const gx = emitters[i], gy = emitters[i + 1], x = gx * T - cx, y = gy * T - cy;
    switch (t) {
      case GU_FENDA: {   // fagulhas sobem da fenda, uma de cada vez
        for (let k = 0; k < 2; k++) { const ph0 = (tm * 0.6 + k * 0.5 + hash2(wrapX(gx), gy, 40651)) % 1; lc.globalAlpha = 1 - ph0; lc.fillStyle = k ? '#ffd070' : '#ff9a30'; lc.fillRect(x + 3 + vr(gx + k, gy, 40652, 6) + Math.round(Math.sin(ph0 * 6 + k) * 1.5), y + 9 - Math.round(ph0 * 18), 1, 1); }
        lc.globalAlpha = 1; break;
      }
      case GU_AUREOLA: {   // um brilho corre pelo aro
        const ph0 = (tm * 0.35 + hash2(wrapX(gx), gy, 40653)) % 1, a = ph0 * Math.PI * 2;
        lc.fillStyle = '#fff8d8'; lc.fillRect(x + Math.round(6 + Math.cos(a) * 4.4), y + Math.round(9 + Math.sin(a) * 1.6), 1, 1);
        break;
      }
      case GU_PENA: case GU_O_BELICITA: {   // de vez em quando uma faísca
        const ph0 = (tm * 0.3 + hash2(wrapX(gx), gy, 40654) * 7) % 1; if (ph0 > 0.06) break;
        const tp = t === GU_PENA ? PENA_P[penaV(gx, gy)] : belTip(gx, gy); if (!tp) break;
        const L = ph0 < 0.03 ? 1 : 2; lc.fillStyle = t === GU_PENA ? '#ffffff' : '#fff0b0'; lc.fillRect(x + tp[0], y + tp[1] - L + 1, 1, L * 2 - 1); lc.fillRect(x + tp[0] - L + 1, y + tp[1], L * 2 - 1, 1);
        break;
      }
    }
  }
  lc.globalAlpha = 1;
});

/* ================= os pintores para os objetos, os guerreiros e o chefe ================= */
const R6 = hexes => hexes.map(h => ph(h));
const OUTLINE = ph('#060404');
/* o pintor dos objetos (o do 252/272): rampas de 6 tons, P.N marca um pixel de cor pura que acende, P.z para as juntas */
function painter(w, h) {
  const c = new Uint32Array(w * h), rid = new Int8Array(w * h).fill(-1), val = new Float32Array(w * h), zb = new Uint8Array(w * h), ramps = [];
  const idOf = R => { let i = ramps.indexOf(R); if (i < 0) { ramps.push(R); i = ramps.length - 1; } return i; };
  const P = {
    w, h, c, rid, val, zb, ramps, idOf, z: 0, pts: {},
    put(x, y, R, v) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0]; rid[k] = idOf(R); val[k] = v; zb[k] = P.z; },
    N(x, y, hex) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; c[k] = ph(hex); rid[k] = -2; val[k] = 5; zb[k] = P.z; },
    has(x, y) { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < w && y < h && c[y * w + x] !== 0; },
    blob(cx, cy, rx, ry, R, s, base = 2.6) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d > 1) continue; P.put(x, y, R, base + 1 - (dx + dy) * 1.1 - d * 0.5 + cg(x, y, s) * 0.4); } },
    ell(cx, cy, rx, ry, fn) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy; if (d <= 1) fn(x, y, dx, dy, d); } },
    rect(x0, y0, rw, rh, R, fn) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) { const v = fn(i, j, x0 + i, y0 + j); if (v !== null && v !== undefined) P.put(x0 + i, y0 + j, R, v); } },
    line(x0, y0, x1, y1, R, v, wd = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < wd; k++) P.put(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), R, typeof v === 'function' ? v(i / n, k) : v); } },
    nline(x0, y0, x1, y1, col) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) P.N(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, typeof col === 'function' ? col(i / n) : col); },
    mark(name, x, y, extra) { (P.pts[name] || (P.pts[name] = [])).push(Object.assign({ x: Math.round(x), y: Math.round(y) }, extra || {})); },
    done(rim = true) {
      if (rim) {
        const src = c.slice(), sr = rid.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const k = y * w + x; if (src[k]) continue;
          let n = -1; if (x > 0 && src[k - 1]) n = k - 1; else if (x < w - 1 && src[k + 1]) n = k + 1; else if (y > 0 && src[k - w]) n = k - w; else if (y < h - 1 && src[k + w]) n = k + w;
          if (n < 0) continue; const r = sr[n]; c[k] = r >= 0 ? ramps[r][0] : OUTLINE;
        }
      }
      return P;
    }
  };
  return P;
}
// uma curva grossa: fn(t) -> [x, y], wd(t) a largura; redonda no corte, luz de cima à esquerda
function tube(P, fn, wd, R, s, base = 2.8, n = 0) {
  const [ax, ay] = fn(0), [bx, by] = fn(1); n = n || Math.ceil(Math.hypot(bx - ax, by - ay) * 3) + 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = fn(t), r = Math.max(0.5, wd(t) / 2);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      const dx = (xx + 0.5 - x) / r, dy = (yy + 0.5 - y) / r, d = dx * dx + dy * dy; if (d > 1) continue;
      P.put(xx, yy, R, base + 0.8 - (dx + dy) * 0.95 - d * 0.45 + cg(xx, yy, s) * 0.3);
    }
  }
}
const lin = (x0, y0, x1, y1) => t => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
const bez = (a, b, c, d) => t => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; };
// polígono cheio (par-ímpar), f(x, y) -> o tom (null pula)
function poly(P, pts, R, f) {
  let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const py = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= py) !== (by <= py)) xs.push(ax + (py - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) { const v = f(x, y); if (v !== null) P.put(x, y, R, v); }
  }
}
// as juntas entre peças: cada parte pintada com P.z maior fica na frente; a de trás ganha sombra onde encosta
function seams(P, amt = 1.1) {
  const d = new Float32Array(P.w * P.h);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0) continue; const z = P.zb[k];
    const fz = (xx, yy) => xx >= 0 && yy >= 0 && xx < P.w && yy < P.h && P.c[yy * P.w + xx] && P.zb[yy * P.w + xx] > z;
    if (fz(x - 1, y) || fz(x, y - 1)) d[k] = amt; else if (fz(x + 1, y) || fz(x, y + 1)) d[k] = amt * 0.45;
  }
  const oz = P.z;
  for (let k = 0; k < d.length; k++) if (d[k]) { P.z = P.zb[k]; P.put(k % P.w, (k / P.w) | 0, P.ramps[P.rid[k]], P.val[k] - d[k]); }
  P.z = oz;
}
// sujeira sem trocar de rampa: escurece o tom onde o ruído passa
function grime(P, amt, cover, s) {
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const k = y * P.w + x; if (!P.c[k] || P.rid[k] < 0) continue;
    const n = cn(x, y, 14, 14, s) + cn(x, y, 40, 40, s + 1) * 0.5 - (0.5 - cover);
    if (n > 0) P.put(x, y, P.ramps[P.rid[k]], P.val[k] - Math.min(1, n * 3) * amt);
  }
}
// assa as camadas acesas de uma variação: os pixels acesos sozinhos e o halo em volta (pad HR)
const HR = 9;
function bakeLuz(P) {
  const list = [];
  for (let k = 0; k < P.w * P.h; k++) if (P.rid[k] === -2) list.push(k);
  if (!list.length) return { nv: null, halo: null };
  const nv = mk(P.w, P.h), nx = nv.getContext('2d'), im = nx.createImageData(P.w, P.h), d32 = new Uint32Array(im.data.buffer);
  for (const k of list) d32[k] = P.c[k];
  nx.putImageData(im, 0, 0);
  const HW = P.w + HR * 2, HH = P.h + HR * 2, acc = new Float32Array(HW * HH * 3), ker = [], dens = clamp(Math.sqrt(80 / list.length), 0.2, 1);
  for (let j = -HR; j <= HR; j++) for (let i = -HR; i <= HR; i++) { const d = Math.hypot(i, j) / HR; if (d < 1) ker.push(i, j, Math.pow(1 - d, 2.2) * 0.07 * dens); }
  for (const k of list) {
    const x = k % P.w + HR, y = ((k / P.w) | 0) + HR, q = P.c[k], r = (q & 255) / 255, g = ((q >> 8) & 255) / 255, b = ((q >> 16) & 255) / 255;
    for (let m = 0; m < ker.length; m += 3) { const o = ((y + ker[m + 1]) * HW + x + ker[m]) * 3, w = ker[m + 2]; acc[o] += r * w; acc[o + 1] += g * w; acc[o + 2] += b * w; }
  }
  const hc = mk(HW, HH), hx = hc.getContext('2d'), hi = hx.createImageData(HW, HH), hd = hi.data;
  for (let k = 0; k < HW * HH; k++) { const sat = v => Math.round(255 * (1 - Math.exp(-v * 1.6))); hd[k * 4] = sat(acc[k * 3]); hd[k * 4 + 1] = sat(acc[k * 3 + 1]); hd[k * 4 + 2] = sat(acc[k * 3 + 2]); hd[k * 4 + 3] = 255; }
  hx.putImageData(hi, 0, 0);
  return { nv, halo: hc };
}
const toCv = P => { const cv = mk(P.w, P.h), x = cv.getContext('2d'), img = x.createImageData(P.w, P.h); new Uint32Array(img.data.buffer).set(P.c); x.putImageData(img, 0, 0); return cv; };
// as rampas dos objetos e dos guerreiros
const RP = {};
for (const [k, H] of Object.entries({
  terra: ['#1a1412', '#2a201a', '#3c2e24', '#4e3e30', '#62503e', '#7a6650'], barro: ['#1e1610', '#30241a', '#443426', '#5a4632', '#705840', '#886c50'],
  ferro: ['#141418', '#26262c', '#3c3c44', '#5a5a64', '#7e7e88', '#aaaab4'], aco: ['#1a1c22', '#2e323a', '#4a5058', '#6c7480', '#98a0aa', '#c8d0d8'],
  ferrugem: ['#2a1208', '#46200e', '#663218', '#884624', '#a85e34', '#c47a48'], ouro: ['#3a2808', '#6a4c10', '#a07820', '#d0a838', '#f0d070', '#fff4c0'],
  marmore: ['#4a4232', '#6e644e', '#948a70', '#b8ae94', '#d8cfb6', '#f0e8d4'], osso: ['#4a4234', '#6e6450', '#948a72', '#bab096', '#ddd4ba', '#f2ead4'],
  madeira: ['#120c06', '#22160c', '#362414', '#4c341e', '#64462a', '#7e5a36'], couro: ['#1a1008', '#2e1e10', '#4a3018', '#684622', '#8a6030', '#ae8048'],
  pano: ['#1e0606', '#360c0a', '#521410', '#701e18', '#8e2a22', '#ac3a2e'], linho: ['#2a2418', '#463c2a', '#665a40', '#88795a', '#aa9a78', '#ccbc9a'],
  pena: ['#5a5446', '#7e7662', '#a49a82', '#c8bea4', '#e4dcc6', '#f8f2e2'], escoria: ['#0e0a0a', '#181212', '#241a18', '#322420', '#42302a', '#544036'],
  chifre: ['#100a08', '#1e1410', '#30221a', '#463428', '#5e4838', '#7a6050'], pele: ['#2a0e0c', '#461814', '#64241c', '#843428', '#a44a38', '#c46450'],
  pelo: ['#141210', '#24201c', '#38322c', '#4e4640', '#686058', '#867e74'], penaN: ['#08080a', '#121216', '#1e1e24', '#2c2c34', '#3e3e48', '#54545e'],
  vinho: ['#1a080c', '#2e1016', '#461a22', '#62262e', '#80343c', '#a0464e'], cinza: ['#1e1c1a', '#2e2b28', '#423e3a', '#58534e', '#706a64', '#8a847c']
})) RP[k] = R6(H);

/* ---------- os guerreiros: o boneco do herói (12 x 22, ombros em x 4.5 / 7.5 na linha 10.5) pintado de armadura ----------
   Como a gente da Cidade Afundada (133): o corpo de letras pintado pelo heroPaint, os braços e as armas por cima com o
   pintor da caverna (CVB.cp). Cada pose é um quadro de 40 x 34 com o boneco em x 14, y 9 (espaço para a arma erguida e a lança). */
const { cp } = CVB;
const RHx = hex => heroRamp(hex).map(c => { const m = /rgb\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? pack(+m[1], +m[2], +m[3]) : ph(c); });
const GW = 40, GH = 34, GX = 14, GY = 9;   // o quadro de cada pose e onde o boneco fica nele (os pés na linha GY + 22)
const LEGS = {
  idle: ["...PP..pp...", "...PP..pp...", "...FF..ff...", "...FFF.fff.."],
  w0: ["...PP..pp...", "..PP....pp..", "..FF....ff..", ".FFF....fff."],
  w1: ["....Ppp.....", "....PPpp....", "....FFfff...", "...FFF......"],
  w2: ["...pp..PP...", "..pp....PP..", "..ff....FF..", ".fff....FFF."],
  w3: ["....pPP.....", "....ppPP....", "....ffFFF...", "...fff......"],
  jump: ["...PP.pp....", "..PP...pp...", "..FFF..fff..", "............"],
  wide: ["..PP....pp..", ".PP......pp.", ".FF......ff.", "FFF......fff"],
  clA: ["...PP..pp...", "...FF..pp...", "...FF..pp...", ".......ff..."],
  clB: ["...PP..pp...", "...PP..ff...", "...PP..ff...", "...FF......."]
};
let scratch = null;
function stamp(P, cv, ox, oy) {   // um canvas do heroPaint dentro do buffer do pintor (uma vez, ao assar)
  if (!scratch) { const c = mk(32, 32); scratch = c.getContext('2d', { willReadFrequently: true }); }
  scratch.clearRect(0, 0, 32, 32); scratch.drawImage(cv, 0, 0);
  const d = scratch.getImageData(0, 0, cv.width, cv.height), u = new Uint32Array(d.data.buffer);
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) { const v = u[y * cv.width + x]; if (v >>> 24) { const X = x + ox, Y = y + oy; if (X >= 0 && Y >= 0 && X < P.w && Y < P.h) P.c[Y * P.w + X] = v; } }
}
// um membro ao longo de uma linha quebrada, a borda escura primeiro, luz de cima à esquerda
function limb(P, pts, r, R, base, s, rimV = 0.5) {
  const each = fn => { for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * 2)); for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n); } };
  each((cx, cy) => { const rr = r + 0.6; for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= rr) P.put(x, y, R, rimV); });
  each((cx, cy) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r; if (dx * dx + dy * dy > 1.3) continue; P.put(x, y, R, base + 0.6 - (dx + dy) * 0.8 + cg(x, y, s) * 0.4); } });
}
/* o kit de um guerreiro: o corpo (letras), as cores (C: letra -> cor), as pernas; sleeve/hand: a rampa do braço e da mão */
function kit(rows, C, seed, tex = {}) {
  const M = {};
  for (const L in C) M[L] = { ramp: heroRamp(C[L]), grain: tex[L] === 'hair' ? 0.08 : 0.08, lip: L !== 's', under: L === 'b' || L === 'k', tex: tex[L] };
  M.e = C.e || '#1c1422'; M.W = C.W || '#c4b8a0'; M.w = M.W;
  const body = heroPaint(rows, L => M[L], seed, null, false);
  const LM = { p: { ramp: heroRamp(C.p), grain: 0.1, tex: tex.p }, f: { ramp: heroRamp(C.f), grain: 0.05, lip: true } }, legs = {};
  for (const k in LEGS) legs[k] = heroPaint(LEGS[k], L => LM[L], seed + 3);
  return { seed, body, legs, sleeve: RHx(C.a || C.r), hand: RHx(C.h || C.s || C.a || C.r), C };
}
// um braço do ombro pelos deslocamentos dados (cotovelo, mão); devolve a mão
function arm(P, K, sx, sy, pts, far) {
  const a = [[sx, sy], ...pts.map(([x, y]) => [sx + x, sy + y])], h = a[a.length - 1];
  limb(P, a, 0.85, K.sleeve, far ? 1.6 : 3, K.seed + (far ? 5 : 9), 0.9);
  P.put(h[0], h[1], K.hand, far ? 2 : 3.6); P.put(h[0] + 0.6, h[1] + 0.5, K.hand, far ? 1.4 : 2.8);
  return h;
}
/* uma pose: o = { legs, lean, bob, crouch (0 a 6: o corpo desce, as pernas dobram), far / near (o braço), behind(P, bx, by),
   farItem(P, mão), nearItem(P, mão), mid(P, bx, by), front(P, bx, by) } */
function man(K, o) {
  const P = cp(GW, GH), bx = GX + (o.lean || 0), by = GY + (o.bob || 0) + (o.crouch || 0);
  if (!P.N) P.N = (x, y, hex) => P.put(x, y, [ph(hex)], 0);   // a cor exata (o pintor da caverna não tem)
  if (o.behind) o.behind(P, bx, by);
  if (o.far) { const h = arm(P, K, bx + 4.5, by + 10.5, o.far, true); if (o.farItem) o.farItem(P, h); }
  if (o.crouch) {   // ajoelhado ou agachado: as coxas para a frente
    const c = o.crouch, far = [[bx + 4.4, by + 18.6], [bx + 7.4, by + 18.6 + Math.max(0, 3.6 - c * 0.5)], [bx + 7, GY + 21.4]], near = [[bx + 6.6, by + 18.8], [bx + 9.8, by + 19 + Math.max(0, 3.4 - c * 0.5)], [bx + 9.4, GY + 21.4]];
    limb(P, far, 0.8, RHx(K.C.p), 1.2, K.seed + 11); P.blob(far[2][0] + 0.6, GY + 21.2, 1.5, 0.8, RHx(K.C.f), K.seed + 12, 1.6);
    limb(P, near, 0.85, RHx(K.C.p), 2.4, K.seed + 13); P.blob(near[2][0] + 0.8, GY + 21.2, 1.6, 0.8, RHx(K.C.f), K.seed + 14, 2.4);
  } else stamp(P, K.legs[o.legs || 'idle'], GX + (o.legX || 0), GY + 18);
  stamp(P, K.body, bx, by);
  if (o.mid) o.mid(P, bx, by);
  if (o.near) { const h = arm(P, K, bx + 7.5, by + 10.5, o.near, false); if (o.nearItem) o.nearItem(P, h); }
  if (o.front) o.front(P, bx, by);
  return P;
}
const dirOf = a => [Math.cos(a), Math.sin(a)];
// as armas, segurando na mão h e apontando para a
function espada(P, h, a, L = 9, R = RP.aco, guard = RP.ouro) {
  const [c, s] = dirOf(a), nx = -s, ny = c, [hx, hy] = h;
  P.line(hx - c * 1.8, hy - s * 1.8, hx + c * 0.4, hy + s * 0.4, RP.couro, 3.2);
  P.put(hx - c * 2.4, hy - s * 2.4, guard, 4.6);
  for (let k = -2; k <= 2; k++) P.put(hx + c * 1 + nx * k * 0.8, hy + s * 1 + ny * k * 0.8, guard, k < 0 ? 4.8 : 2.8);
  for (let t = 1.6; t <= L; t += 0.4) { const w = t > L - 1 ? 0.15 : 0.5; P.put(hx + c * t - nx * w, hy + s * t - ny * w, R, 4.8 - t * 0.05); P.put(hx + c * t + nx * w, hy + s * t + ny * w, R, 2.8); }
  P.put(hx + c * (L + 0.4), hy + s * (L + 0.4), R, 5.4);
}
function lanca(P, h, a, L = 13, back = 4, R = RP.aco) {
  const [c, s] = dirOf(a), [hx, hy] = h;
  P.line(hx - c * back, hy - s * back, hx + c * (L - 3), hy + s * (L - 3), RP.madeira, 3.6);
  for (let t = L - 3; t <= L; t += 0.4) { const w = (L - t) * 0.35; P.put(hx + c * t + s * w, hy + s * t - c * w, R, 5); P.put(hx + c * t - s * w, hy + s * t + c * w, R, 2.8); }
}
function escudo(P, cx, cy, R = RP.ferro, F = RP.ouro, big = false) {   // o escudo de frente: kite comprido, a borda, a faixa do exército
  const hw = big ? 4.2 : 3.4, hh = big ? 7.4 : 5.4;
  for (let y = Math.floor(cy - hh); y <= cy + hh; y++) for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
    const u = (x + 0.5 - cx) / hw, v = (y + 0.5 - cy) / hh, wv = 1 - Math.max(0, v) * Math.max(0, v) * 0.9; if (Math.abs(u) > wv || v < -1) continue;
    const edge = Math.abs(u) > wv - 0.28 || v < -0.85;
    P.put(x, y, edge ? R : (Math.abs(u) < 0.22 ? F : R), edge ? 4.6 - (u + v) * 1.2 : 3 - (u + v) * 0.9 + cg(x, y, 77) * 0.4);
  }
  P.put(cx - 0.5, cy - 1, F, 5.6);
}
function arco(P, h, a, drawn) {   // o arco longo: madeira curva, a corda, a flecha quando puxada
  const [c, s] = dirOf(a), nx = -s, ny = c, [hx, hy] = h;
  for (let k = -9; k <= 9; k++) { const t = k / 9, bow = (1 - t * t) * 2.6; P.put(hx + nx * k + c * bow, hy + ny * k + s * bow, RP.madeira, 4 - Math.abs(t) * 1.4); }
  const pull = drawn ? 4.4 : 0.6, tips = [[hx + nx * 9, hy + ny * 9], [hx - nx * 9, hy - ny * 9]], nock = [hx - c * pull, hy - s * pull];
  for (const [tx, ty] of tips) P.line(tx, ty, nock[0], nock[1], RP.linho, 4.4);
  if (drawn) { P.line(nock[0], nock[1], hx + c * 4, hy + s * 4, RP.madeira, 4.6); P.put(hx + c * 4.6, hy + s * 4.6, RP.aco, 5.4); P.put(nock[0] - c * 0.6, nock[1] - s * 0.6, RP.pena, 4.6); }
}
const set = P => { const cv = P.done(); const o = outlined(cv), l = flip(o); return { r: o, l, wr: whiteOf(o), wl: whiteOf(l) }; };
// desenha uma pose no ponto dos pés (fx, fy), virada para e.facing
const guBlit = (S, e, fx, fy, fl, jx = 0, jy = 0) => lc.drawImage(e.facing > 0 ? (fl ? S.wr : S.r) : (fl ? S.wl : S.l), fx - (e.facing > 0 ? GX + 7 : GW - GX - 5) + jx, fy - GY - 23 + jy);

Object.assign(GUART, { cg, cn, cells, dPix, spr, rimOut, disc, flipX, pp, wrapT, W2, RX, BRASA, OURO, FERRUGEM, OSSO, FERRO, CINZA, DRE, guGlow, GU_GL, guOut,
  vTerra, vArgila, vSucata, vMarmore, vCantaria, vEscoria, vBrasa, vPenas, vTijolo, vPalicada, PENA_P,
  painter, tube, lin, bez, poly, seams, grime, bakeLuz, toCv, HR, RP, R6, RHx, cp, GW, GH, GX, GY, kit, arm, man, limb, espada, lanca, escudo, arco, set, guBlit, dirOf });
}
