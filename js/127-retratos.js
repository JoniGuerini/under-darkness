'use strict';

/* ================= os retratos da conversa =================
   A janela de conversa mostrava o boneco do vilarejo ampliado 1,7x com suavização: borrado. Agora cada morador
   tem um busto de frente pintado no tamanho do retrato (48 x 44, mostrado a 2x pelo CSS, sem suavizar):
   cabeça, rosto, cabelo, roupa e os detalhes de cada um, no mesmo visual granulado do vilarejo
   (rampas de 6 tons do 37-heroi, luz de cima à esquerda, contorno escuro). Pintado uma vez por morador.
   Morador sem retrato próprio usa o boneco recortado em escala inteira (2x), sem borrar.
   Embrulha openTalk; carrega depois do 118-encantador. */

const RET_W = 48, RET_H = 44;

// ferramentas de desenho numa grade de letras; tudo que é simétrico espelha em torno da linha x = 24
function retKit() {
  const G = Array.from({ length: RET_H }, () => Array(RET_W).fill('.'));
  const ok = (x, y) => x >= 0 && x < RET_W && y >= 0 && y < RET_H;
  const set = (x, y, c, only) => { if (ok(x, y) && (!only || only.includes(G[y][x]))) G[y][x] = c; };
  const K = {
    G, set,
    pm: (x, y, c, only) => { set(x, y, c, only); set(RET_W - 1 - x, y, c, only); },
    span: (y, x0, x1, c, only) => { for (let x = x0; x <= x1; x++) K.pm(x, y, c, only); },
    ell(cx, cy, rx, ry, c, only) {
      for (let y = 0; y < RET_H; y++) for (let x = 0; x < RET_W; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) set(x, y, c, only);
      }
    },
    rect(x0, y0, x1, y1, c, only) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c, only); },
    // ombros: meia elipse em cima, reto até a base do retrato
    torso(y0, rx, ry, c) { K.ell(24, y0 + ry, rx, ry, c); K.rect(Math.round(24 - rx), y0 + ry, Math.round(24 + rx) - 1, RET_H - 1, c); },
    // detalhe livre (assimétrico): linhas de texto a partir de (x0, y0); espaço não pinta
    rows(x0, y0, arr, only) { arr.forEach((s, j) => { for (let i = 0; i < s.length; i++) if (s[i] !== ' ') set(x0 + i, y0 + j, s[i], only); }); },
    // rosto padrão: olhos (branco, pupila), pálpebra, nariz com sombra à direita, boca
    face(ey, o = {}) {
      const s = o.skin || 's', S = s.toUpperCase();
      K.pm(19, ey, 'o'); K.pm(20, ey, 'e'); K.pm(21, ey, 'o');
      K.span(ey - 1, 19, 21, o.lid || S);
      if (o.lash) { K.pm(18, ey - 1, o.lash); K.pm(18, ey, o.lash); }
      for (let y = ey + 1; y <= ey + 3; y++) K.set(25, y, S);
      K.set(22, ey + 4, S); K.set(25, ey + 4, S); K.set(23, ey + 4, S);
      if (!o.noMouth) K.span(ey + 7, 22, 23, 'm');
      if (o.lip) K.span(ey + 8, 23, 23, S);
    }
  };
  return K;
}

/* pintura: luz pela forma (normal da máscara borrada de cada grupo), sombra embaixo do que está por cima,
   textura de cabelo/lã/couro, grão, maiúscula = um tom mais escuro, contorno escuro em volta */
function retPaint(G, mats, seed) {
  const c = mk(RET_W, RET_H), x = c.getContext('2d');
  const lowC = ch => ch.toLowerCase();
  const grp = (i, j) => {
    if (i < 0 || j < 0 || i >= RET_W || j >= RET_H) return null;
    const ch = G[j][i]; if (ch === '.') return null;
    const M = mats[lowC(ch)]; return M && typeof M === 'object' ? (M.g || lowC(ch)) : (M ? '#' + lowC(ch) : null);
  };
  const R = 3, disk = [];
  for (let v = -R; v <= R; v++) for (let u = -R; u <= R; u++) if (u * u + v * v <= R * R + 1) disk.push([u, v]);
  const B = (i, j, g) => { let s = 0; for (const [u, v] of disk) if (grp(i + u, j + v) === g) s++; return s / disk.length; };
  // caixa de cada grupo, para o degradê leve da esquerda para a direita
  const box = {};
  for (let j = 0; j < RET_H; j++) for (let i = 0; i < RET_W; i++) {
    const g = grp(i, j); if (!g) continue;
    const b = box[g] || (box[g] = [i, j, i, j]); b[0] = Math.min(b[0], i); b[1] = Math.min(b[1], j); b[2] = Math.max(b[2], i); b[3] = Math.max(b[3], j);
  }
  x.fillStyle = '#140c10';
  for (let j = 0; j < RET_H; j++) for (let i = 0; i < RET_W; i++) {
    if (G[j][i] !== '.') continue;
    if (grp(i - 1, j) || grp(i + 1, j) || grp(i, j - 1) || grp(i, j + 1)) x.fillRect(i, j, 1, 1);
  }
  for (let j = 0; j < RET_H; j++) for (let i = 0; i < RET_W; i++) {
    const ch = G[j][i]; if (ch === '.') continue;
    const L = lowC(ch), M = mats[L]; if (!M) continue;
    if (typeof M === 'string') { x.fillStyle = M; x.fillRect(i, j, 1, 1); continue; }
    const g = M.g || L, h = hash2(i, j, seed);
    const gx = B(i + 1, j, g) - B(i - 1, j, g), gy = B(i, j + 1, g) - B(i, j - 1, g), len = Math.hypot(gx, gy);
    let v = 3;
    if (len > 0.001) v += ((gx * 0.6 + gy * 0.8) / len) * Math.min(1, len * 3.5) * 1.7;   // a borda virada para a luz clareia
    const b = box[g], u = b[2] > b[0] ? (i - b[0]) / (b[2] - b[0]) : 0.5;
    v += (0.5 - u) * (M.flat ? 0.6 : 1.1);
    if (ch !== L) v -= 1;
    if (!M.over) { const up = grp(i, j - 1), up2 = grp(i, j - 2); if ((up && up !== g) || (up2 && up2 !== g && !M.soft)) v -= up && up !== g ? 1 : 0.5; }
    if (M.tex === 'hair') { const k = hash2(i, Math.floor((j + (i * 7) % 5) / 5), seed); v += k < 0.3 ? -1 : k > 0.86 ? 1 : 0; }   // fios: riscos na vertical
    else if (M.tex === 'metal') v += (i + j) % 5 === 0 ? 0.8 : 0;
    const gr = M.grain === undefined ? 0.05 : M.grain;
    v += h < gr * 0.5 ? -1 : h > 1 - gr * 0.5 ? 1 : 0;
    x.fillStyle = heroRamp(M.hex)[clamp(Math.round(v), 0, 5)]; x.fillRect(i, j, 1, 1);
  }
  return c;
}

const RET_OLHO = '#efe6d4', RET_PUPILA = '#1c1422';
const RET_ARTE = {
  // Grimaldo: careca largo, sobrancelha grossa, barba cheia escura até o peito, braços de fora, avental de couro
  ferreiro: () => {
    const K = retKit();
    K.torso(28, 22, 7, 'r');
    K.rect(2, 33, 8, 43, 's'); K.rect(39, 33, 45, 43, 's');                       // braços nus nos lados
    K.rect(15, 33, 32, 43, 'a');                                                    // peito do avental
    for (let y = 28; y < 34; y++) { K.pm(14 + Math.floor((y - 28) / 2), y, 't'); K.pm(15 + Math.floor((y - 28) / 2), y, 't'); }
    K.rect(19, 24, 28, 30, 's');
    K.ell(24, 15, 10.5, 11, 's');
    K.ell(13.6, 17, 1.8, 2.8, 's'); K.ell(34.4, 17, 1.8, 2.8, 's');
    K.span(13, 17, 21, 'h'); K.span(14, 18, 21, 'H');                             // sobrancelha grossa
    K.face(15, { noMouth: true });
    K.rect(23, 16, 24, 19, 's'); K.span(19, 21, 22, 'S');                         // nariz largo
    // barba: das costeletas até o peito, bigode por cima da boca
    K.ell(24, 25, 11.5, 10.5, 'h', ['s', '.', 'r', 'a', 't']);
    K.rect(15, 16, 32, 19, 's', ['h']);
    K.span(19, 17, 23, 'h'); K.span(20, 15, 23, 'h');
    K.span(21, 21, 23, 'h'); K.span(22, 22, 23, 'm');
    K.rect(13, 17, 14, 20, 'h'); K.rect(33, 17, 34, 20, 'h');
    K.span(36, 21, 22, 'H'); K.span(37, 22, 23, 'h');
    return retPaint(K.G, {
      s: { hex: '#d0926a', grain: 0.05 }, h: { hex: '#3a2418', tex: 'hair', grain: 0.12 }, r: { hex: '#8a4a3a', grain: 0.06 },
      a: { hex: '#8a5a30', grain: 0.12 }, t: { hex: '#2a1a12', over: true, grain: 0 }, m: { hex: '#4a2018', over: true }, o: RET_OLHO, e: RET_PUPILA
    }, 41);
  },
  // Marta: magra, lenço verde amarrado na cabeça, mechas grisalhas escapando, xale de lã, vestido e avental
  curandeira: () => {
    const K = retKit();
    K.torso(30, 19, 7, 'd');
    K.rect(17, 36, 30, 43, 'a');
    K.ell(24, 33, 18, 5, 'g'); K.rect(8, 33, 39, 36, 'g');                       // xale nos ombros
    K.rows(20, 33, ['gggggggg', ' gggggg ', '  gggg  ', '   gg   ']);              // ponta do xale
    K.rect(20, 25, 27, 31, 's');
    K.ell(24, 17, 8.6, 10.5, 's');
    K.ell(15.2, 19, 1.4, 2.2, 's'); K.ell(32.8, 19, 1.4, 2.2, 's');
    K.ell(24, 11, 11, 7.5, 'k'); K.rect(13, 11, 34, 13, 'k');                     // lenço
    K.span(14, 15, 18, 'h'); K.span(15, 15, 16, 'h'); K.span(16, 15, 15, 'h');   // mechas grisalhas
    K.rows(10, 10, [' hhh', 'hhhh', 'hhhh', ' hh']);                              // coque escapando atrás
    K.rows(33, 9, [' kk', 'kKkk', 'kkKk', ' kk']);                                // nó do lenço
    K.span(16, 19, 21, 'H');
    K.face(18, { lid: 'S' });
    K.pm(18, 20, 'S');                                                             // ruga no canto do olho
    return retPaint(K.G, {
      s: { hex: '#e8b894', grain: 0.04 }, k: { hex: '#4e7a3e', grain: 0.06 }, h: { hex: '#9a8c7c', tex: 'hair' },
      g: { hex: '#5a6e3a', grain: 0.06 }, d: { hex: '#5a3a4a', grain: 0.06 }, a: { hex: '#d8ccaa', grain: 0.2 },
      m: { hex: '#b06a5a', over: true }, o: RET_OLHO, e: RET_PUPILA
    }, 43);
  },
  // Odo: rosto redondo e corado, ruivo com entradas, costeletas e bigodão, papada, camisa aberta, colete e avental
  taverneiro: () => {
    const K = retKit();
    K.torso(29, 23, 7, 'w');
    K.rect(1, 31, 13, 43, 'v'); K.rect(34, 31, 46, 43, 'v');                      // colete
    K.ell(24, 33, 7, 3.5, 's');                                                     // gola aberta
    K.rect(13, 39, 34, 43, 'a');                                                    // avental
    K.rect(19, 25, 28, 31, 's');
    K.ell(24, 17, 10.5, 10.5, 's');
    K.ell(24, 26.5, 7.5, 2.6, 's');                                                 // papada
    K.ell(13.4, 18, 1.8, 2.8, 's'); K.ell(34.6, 18, 1.8, 2.8, 's');
    K.ell(24, 8.5, 9.5, 3.6, 'h', ['.', 's']); K.rect(19, 6, 28, 9, 's');        // entradas
    K.rect(14, 9, 15, 21, 'h'); K.rect(32, 9, 33, 21, 'h');                       // costeletas
    K.rect(13, 12, 15, 15, 'h'); K.rect(32, 12, 34, 15, 'h');
    K.span(13, 18, 21, 'h');
    K.face(15, { noMouth: true });
    K.ell(17.5, 19, 2, 1.3, 'c'); K.ell(30.5, 19, 2, 1.3, 'c');                  // bochecha corada
    K.span(20, 18, 23, 'h'); K.span(21, 17, 21, 'h'); K.span(22, 17, 18, 'H');   // bigodão
    K.span(23, 22, 23, 'm');
    return retPaint(K.G, {
      s: { hex: '#eeb896', grain: 0.04 }, h: { hex: '#b85a22', tex: 'hair' }, c: { hex: '#e07a6a', over: true, grain: 0 },
      w: { hex: '#ece4d0', grain: 0.06 }, v: { hex: '#6a3a22', grain: 0.06 }, a: { hex: '#f2ecdc', grain: 0.1 },
      m: { hex: '#9a4a3a', over: true }, o: RET_OLHO, e: RET_PUPILA
    }, 47);
  },
  // Caetano: rosto comprido, careca, cabelo branco nos lados, sobrancelha cerrada, barba branca longa, túnica azul com gola dourada
  anciao: () => {
    const K = retKit();
    K.torso(30, 20, 6, 'r');
    for (let y = 30; y < RET_H; y++) { const w = 2 + Math.floor((y - 30) * 0.6); K.span(y, 24 - w - 2, 24 - w - 1, 't'); }   // gola dourada em V
    K.rect(20, 25, 27, 31, 's');
    K.ell(24, 15, 8.6, 11.5, 's');
    K.ell(15.2, 17, 1.5, 2.6, 's'); K.ell(32.8, 17, 1.5, 2.6, 's');
    K.rows(12, 8, ['  www', ' wwww', 'wwwww', 'wwww', 'www', 'www', 'www', 'ww', 'ww']);
    K.rows(32, 8, ['www  ', 'wwww ', 'wwwww', ' wwww', '  www', '  www', '  www', '   ww', '   ww']);
    K.span(10, 21, 22, 'S');                                                        // ruga da testa
    K.span(13, 18, 21, 'w'); K.pm(17, 12, 'w');
    K.face(15, { noMouth: true });
    // barba longa até embaixo
    K.ell(24, 30, 9.5, 12, 'w', ['s', '.', 'r', 't']); K.rect(17, 30, 30, 43, 'w');
    K.rect(17, 30, 30, 43, 'w'); K.ell(24, 44, 9, 4, 'w');
    K.rect(17, 16, 30, 19, 's', ['w']);
    K.span(20, 19, 23, 'w'); K.span(21, 18, 23, 'w'); K.span(22, 22, 23, 'm');
    K.pm(23, 28, 'W'); K.pm(22, 33, 'W'); K.pm(23, 38, 'W');                       // fios da barba
    return retPaint(K.G, {
      s: { hex: '#e0b090', grain: 0.04 }, w: { hex: '#e8e8e0', tex: 'hair', grain: 0.06 }, r: { hex: '#34467a', grain: 0.06 },
      t: { hex: '#c8a050', tex: 'metal', over: true, grain: 0 }, m: { hex: '#9a5a50', over: true }, o: RET_OLHO, e: RET_PUPILA
    }, 53);
  },
  // Aurélia: chapéu pontudo de aba larga com faixa dourada, cabelo prateado comprido, gola alta e broche
  maga: () => {
    const K = retKit();
    K.torso(33, 19, 6, 'r');
    K.rect(14, 18, 33, 37, 'h'); K.rect(9, 18, 15, 43, 'h'); K.rect(32, 18, 38, 43, 'h');                      // cabelo comprido
    K.ell(12, 43, 4, 5, 'h'); K.ell(35, 43, 4, 5, 'h');
    K.rect(19, 29, 28, 35, 'r'); K.span(29, 20, 20, 'R');                         // gola alta
    K.set(23, 36, 'k'); K.set(24, 36, 'k'); K.set(23, 37, 'k'); K.set(24, 37, 'k'); K.set(24, 36, 'q');
    K.ell(24, 20, 8.4, 10.5, 's');
    K.ell(24, 15, 10, 5.5, 'h', ['.', 's']); K.rows(16, 14, ['hhhh', 'hhh', 'hh']); K.rows(28, 14, ['hhhh', ' hhh', '  hh']);
    K.rect(15, 15, 16, 26, 'h'); K.rect(31, 15, 32, 26, 'h');
    K.face(20, { lash: 'e', lid: 'S' });
    K.pm(20, 18, 'h'); K.span(18, 19, 21, 'h', ['s']);
    // chapéu: aba larga, faixa dourada, copa inclinada que sai pelo alto
    K.ell(24, 12, 22, 2.6, 'p');
    K.rect(15, 8, 32, 10, 'g');
    K.rows(14, 0, ['           pppp', '          pppppp', '         ppppppp', '        pppppppp', '       ppppppppp',
      '     pppppppppppp', '   pppppppppppppp', '  ppppppppppppppppp']);
    K.rect(16, 6, 31, 7, 'p');
    return retPaint(K.G, {
      s: { hex: '#eec4a4', grain: 0.03 }, h: { hex: '#d8d4e8', tex: 'hair', grain: 0.05 }, p: { hex: '#3e2462', grain: 0.06 },
      g: { hex: '#d8b050', tex: 'metal', grain: 0 }, r: { hex: '#56347e', grain: 0.06 }, k: { hex: '#d8b050', over: true, grain: 0 },
      q: '#ff7ad0', m: { hex: '#b0606a', over: true }, o: RET_OLHO, e: RET_PUPILA
    }, 59);
  },
  // Teodoro: cabelo grisalho preso, óculos de lapidário de latão na testa com lentes verde-água,
  // cavanhaque, casaco verde-petróleo de gola alta com botões de latão e um rubi na lapela
  encantador: () => {
    const K = retKit();
    K.torso(30, 20, 7, 'c');
    K.rect(22, 30, 25, 43, 'C');
    for (let y = 33; y < RET_H; y += 3) { K.set(23, y, 'k'); K.set(24, y, 'k'); }
    K.rows(14, 31, ['  cc', ' ccc', 'cccc', 'ccc']); K.rows(30, 31, ['cc  ', 'ccc ', 'cccc', ' ccc']);   // gola
    K.set(15, 36, 'x'); K.set(16, 36, 'x'); K.set(15, 37, 'X');
    K.rect(20, 25, 27, 31, 's');
    K.ell(24, 16, 8.8, 11, 's');
    K.ell(15, 18, 1.5, 2.6, 's'); K.ell(33, 18, 1.5, 2.6, 's');
    K.ell(24, 9.5, 10, 5.5, 'h', ['.', 's']); K.rect(15, 9, 16, 17, 'h'); K.rect(31, 9, 32, 17, 'h');
    K.rows(33, 10, ['hh', 'hhh', ' hhh', '  hh', '  hh', '   h']);               // rabo preso atrás
    // óculos na testa: tira de latão e duas lentes
    K.rect(15, 10, 32, 11, 'g');
    K.ell(19.5, 10.5, 3.2, 2.8, 'g'); K.ell(28.5, 10.5, 3.2, 2.8, 'g');
    K.ell(19.5, 10.5, 2, 1.7, 'l'); K.ell(28.5, 10.5, 2, 1.7, 'l'); K.set(18, 9, 'n'); K.set(27, 9, 'n');
    K.span(14, 19, 21, 'h');
    K.face(16, { noMouth: true });
    K.span(21, 20, 23, 'w'); K.span(22, 22, 22, 'w');                             // bigode
    K.span(23, 22, 23, 'm');
    K.rect(22, 24, 25, 27, 'w'); K.rect(23, 28, 24, 28, 'w');                    // cavanhaque
    return retPaint(K.G, {
      s: { hex: '#e0b48e', grain: 0.04 }, h: { hex: '#8e8e88', tex: 'hair' }, w: { hex: '#b8b8b0', tex: 'hair', over: true },
      g: { hex: '#c9a14a', tex: 'metal', grain: 0 }, l: '#5ff0cc', n: '#d8fff2', c: { hex: '#1e6e64', grain: 0.06 }, k: { hex: '#d8b050', over: true, grain: 0 },
      x: { hex: '#d03040', over: true, grain: 0 }, m: { hex: '#9a5a48', over: true }, o: RET_OLHO, e: RET_PUPILA
    }, 61);
  }
};
function retratoDe(n) { return RET_ARTE[n.id] ? cached('ret:' + n.id, RET_ARTE[n.id]) : null; }

{
  const _openTalk = openTalk;
  openTalk = function (n) {
    _openTalk(n);
    if (!n || !NPCS.includes(n) || $('talk').hidden) return;
    const cv = $('talkCv'), x = cv.getContext('2d'), r = retratoDe(n);
    x.save();
    try {
      x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height);
      if (r) x.drawImage(r, 0, 0);
      else { n.facing = 1; compose(npcPose(n)); x.drawImage(comp, OX - 6, OY - 4, 24, 22, 0, 0, 48, 44); }
    } finally { x.restore(); }
  };
}
