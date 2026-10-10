'use strict';

/* ================= os moradores, cada um com o seu corpo =================
   Grimaldo, Marta, Odo, Caetano, Aurélia e Teodoro deixam de ser o corpo do herói com outra cor:
   cada um tem silhueta, rosto, cabelo, porte e roupa próprios, pintados como o herói (heroPaint/heroRamp
   do 37-heroi): rampas de 6 tons, luz de cima à esquerda. Tudo é pintado uma vez no início.
   Os pés continuam no chão no mesmo ponto e a posição de cada morador no vilarejo não muda; o corpo pode
   ser mais largo (ox), mais alto ou mais baixo (oy) e os ombros vão junto (sb/sf, lidos pelo compose do 04).
   Carrega depois do 91-maga e do 96-alquimista, que mexem na lista e no objeto de mão. */

// letras = material; maiúscula = o mesmo material um tom mais escuro. Cada morador tem o seu mapa de cores.
const MORADOR_ARTE = {
  // ferreiro: largo, careca, barba cheia, braços de fora, avental de couro por cima da camisa de lã
  ferreiro: {
    ox: -1, oy: 0, sb: [5, 10.5], sf: [9.5, 10.5],
    body: [
      ".....ssss.....",
      "....ssssss....",
      "...ssssssss...",
      "...hssssddd...",
      "...hsssssess..",
      "...hhssshhhs..",
      "....hhhhhhhh..",
      "....hhhhhhh...",
      "....Shhhhhh...",
      "...rrrhhhhrr..",
      "..rrrrraaarrr.",
      "..rrrrraaaRrr.",
      "..rrrrraaaarr.",
      "..ttttttaaatt.",
      "..rraaaaaaaar.",
      "..rraaaAaaaar.",
      "..rraaaAaaaaa.",
      "..rraaaaaaaaa."
    ],
    lv: [
      ".....4554.....",
      "....445543....",
      "...34444332...",
      "...2443.......",
      "...14432.0....",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      ".............."
    ],
    legs: ["..PPP..ppp..", "..PPP..ppp..", "..FFF..fff..", ".FFFF.ffff.."],
    col: { s: '#d0926a', h: '#2a1a12', d: '#1e120c', e: '#140c10', r: '#8a4a3a', a: '#8a5a30', t: '#2a1a12', p: '#2e2620', f: '#3a2a1e' },
    tex: { a: 'leather', r: 'wool', h: 'hair' },
    arm: { sleeve: '#8a4a3a', skin: '#d0926a', sl: 1.6, r: 1.25 }
  },
  // alquimista: magra, lenço verde na cabeça, coque de cabelo grisalho, xale, vestido até o chão,
  // avental manchado e um cinto com frascos
  curandeira: {
    ox: 0, oy: 1, sb: [4.5, 9.5], sf: [7.5, 9.5],
    body: [
      "....kkkk....",
      "...kkkkkk...",
      ".hhkkkkkkk..",
      "hhhhhsssss..",
      "hhhhsssess..",
      ".hhhssssss..",
      "...hsssms...",
      "....ssss....",
      ".....ss.....",
      "...gggggg...",
      "..gggggggg..",
      "..gddddagg..",
      "...ddaaaa...",
      "...tvtqtt...",
      "...ddaaAa...",
      "...ddaaaaa..",
      "..dddaAaaa..",
      "..dddaaaaaa.",
      ".dDddaaaaaa.",
      ".dDdddaaaaa."
    ],
    lv: null,
    legs: ["............", "............", "............", "...FF..ff..."],
    col: { k: '#4e7a3e', h: '#9a8c7c', s: '#e8b894', e: '#22161e', m: '#b06a5a', g: '#5a6e3a', d: '#5a3a4a', a: '#d8ccaa', t: '#6a4426', v: '#5ae070', q: '#6ab8ff', p: '#3a2a22', f: '#3a2a22' },
    tex: { a: 'stain', g: 'wool', h: 'hair' },
    arm: { sleeve: '#5a6e3a', skin: '#e8b894', sl: 4.6, r: 0.8 }
  },
  // taverneiro: baixo e barrigudo, ruivo com entradas, costeletas e bigode, bochecha corada,
  // camisa com manga dobrada, colete e avental branco sobre a barriga
  taverneiro: {
    ox: -1, oy: 1, sb: [5, 9.5], sf: [8.5, 9.5],
    body: [
      ".....ssss.....",
      "....hsssss....",
      "...hhssssss...",
      "...hhsssddd...",
      "...hhssssess..",
      "...hhsssscss..",
      "....hssshhhh..",
      "....sssssss...",
      ".....ssss.....",
      "...vvwwwwvv...",
      "..vvvwwwwvvv..",
      "..vvvwwwwvvvv.",
      "..vvaaaaaaaaa.",
      "..vvaaaaaaaaaa",
      "..vvaaaaAaaaaa",
      "..vvaaaaaaaaa.",
      "..vvaaaaaaaa.."
    ],
    lv: [
      ".....4554.....",
      "....3455443...",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      "..............",
      ".............."
    ],
    legs: ["...PP..pp...", "...PP..pp...", "...FF..ff...", "...FFF.fff.."],
    col: { s: '#eeb896', h: '#b85a22', d: '#9a4418', e: '#22161e', c: '#e07a6a', w: '#ece4d0', v: '#6a3a22', a: '#f2ecdc', p: '#4a3628', f: '#3a2a1e' },
    tex: { v: 'wool', h: 'hair' },
    arm: { sleeve: '#ece4d0', skin: '#eeb896', sl: 2.6, r: 1.0 }
  },
  // ancião: alto e magro, um pouco curvado, careca com cabelo branco dos lados, barba longa até o peito,
  // túnica azul até o chão com barra dourada e cinto de corda
  anciao: {
    ox: 0, oy: -2, sb: [4.5, 12.5], sf: [7.5, 12.5],
    body: [
      ".....ssss...",
      "....ssssss..",
      "...wsssssss.",
      "...wwsssddd.",
      "...wwsssses.",
      "...wwssswwws",
      "....wwwwwww.",
      "....wwwwwww.",
      ".....wwwwww.",
      "...rrwwwwwr.",
      "..rrrrwwwwr.",
      "..rrrrrwwwr.",
      "..rrrrrwwr..",
      "..rrrrrrwr..",
      "..ttttttttr.",
      "..rrrrrrrrk.",
      "..rrRrrrrrk.",
      "..rrRrrrrrk.",
      ".rrrRrrrrrk.",
      ".rrrRrrrrrk.",
      ".rrrrrrrrrk.",
      ".rrrrrrrrrk.",
      ".kkkkkkkkkk."
    ],
    lv: [
      ".....4554...",
      "....445543..",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............",
      "............"
    ],
    legs: ["............", "............", "............", "...FF..ff..."],
    col: { s: '#e0b090', w: '#e8e8e0', d: '#d0d0c8', e: '#22161e', r: '#34467a', t: '#a8884a', k: '#d8b050', p: '#2a2a3a', f: '#6a4a2e' },
    tex: { w: 'hair', r: 'wool' },
    arm: { sleeve: '#34467a', skin: '#e0b090', sl: 4.8, r: 1.0 }
  },
  // maga: alta e esguia, cabelo prateado comprido até a cintura, chapéu pontudo de aba larga,
  // gola alta, faixa dourada e manto roxo até o chão
  maga: {
    ox: 0, oy: -1, sb: [4.5, 11.5], sf: [7.5, 11.5],
    body: [
      "....hhhh....",
      "...hhhhhh...",
      "..hhhhhhhh..",
      "..hhhhssss..",
      "..hhhhsses..",
      "..hhhsssss..",
      "..hhhssms...",
      "..hhhsss....",
      "..hhh.ss....",
      "..hhrrrrr...",
      "..hrrrrrrr..",
      "..hrrrrrrr..",
      "..hrrrrrrr..",
      "..hrkkkkrr..",
      "...rrrrrrk..",
      "...rrRrrrk..",
      "..rrrRrrrk..",
      "..rrrRrrrk..",
      ".rrrrRrrrk..",
      ".rrrrRrrrrk.",
      ".rrrrrrrrrk.",
      "kkkkkkkkkkk."
    ],
    lv: null,
    hat: {
      oy: -6,
      rows: [
        "..p.........",
        "..pp........",
        "...pp.......",
        "...ppp......",
        "...pppp.....",
        "...ppppp....",
        "..pppppppp..",
        "..gggggggg..",
        "pppppppppppp"
      ]
    },
    legs: ["............", "............", "............", "...FF..ff..."],
    col: { h: '#d8d4e8', s: '#eec4a4', e: '#22161e', m: '#b0606a', r: '#56347e', k: '#d8b050', p: '#3e2462', g: '#d8b050', f: '#2c1848' },
    tex: { h: 'hair', r: 'wool' },
    arm: { sleeve: '#56347e', skin: '#eec4a4', sl: 4.8, r: 1.0 }
  },
  // encantador: magro, cabelo grisalho preso atrás, óculos de lapidário de latão erguidos na testa (lentes verde-água),
  // cavanhaque grisalho, casaco verde-petróleo até o joelho com botões de latão e cinto com as cinco pedras
  encantador: {
    ox: 0, oy: 0, sb: [4.5, 10.5], sf: [7.5, 10.5],
    body: [
      "....hhhh....",
      "...hhhhhhh..",
      "..hhggggggg.",
      ".hhhglgglgg.",
      "hhhhhsssess.",
      ".hhhSsssss..",
      "...hswwmws..",
      "....swwws...",
      ".....sws....",
      "...cccccc...",
      "..ccccccck..",
      "..cccccckc..",
      "..ccccccck..",
      "..tyvtqtxt..",
      "..cccccckc..",
      "..ccCccccc..",
      ".cccCccccck.",
      ".cccCcccccc."
    ],
    lv: null,
    legs: ["...pp..pp...", "...pp..pp...", "...PP..pP...", "..FFF.fff..."],
    col: { h: '#8e8e88', g: '#c9a14a', l: '#5ff0cc', s: '#e0b48e', e: '#22161e', m: '#9a5a48', w: '#b8b8b0', c: '#1e6e64', k: '#d8b050', t: '#5a3a22',
      y: '#e8c040', v: '#3ac070', q: '#4a80e0', x: '#d03040', p: '#3a3440', f: '#4a3020' },
    tex: { h: 'hair', w: 'hair', c: 'wool' },
    arm: { sleeve: '#1e6e64', skin: '#e0b48e', sl: 4.6, r: 0.9 }
  }
};

function moradorMat(a) {
  const M = {};
  for (const k in a.col) {
    const tx = a.tex[k];
    M[k] = k === 'e' ? a.col.e : { ramp: heroRamp(a.col[k]), grain: tx === 'leather' ? 0.16 : tx === 'stain' ? 0.12 : tx === 'wool' ? 0.06 : 0, tex: tx === 'hair' ? 'hair' : null, lip: true };
  }
  // manchas verdes no avental da alquimista
  if (a.tex.a === 'stain') M.a.grain = 0.14;
  return L => M[L];
}

/* braço de morador: cápsula do ombro, manga até sl e depois a mão (pele própria de cada um), 64 ângulos */
function moradorArm(id, A, ang, len, dark) {
  const q = ((Math.round(ang / (Math.PI * 2) * HERO_ARM_N) % HERO_ARM_N) + HERO_ARM_N) % HERO_ARM_N, n = Math.max(0, Math.round(len));
  return cached('ma:' + id + dark + ':' + q + ':' + n, () => {
    const a = q / HERO_ARM_N * Math.PI * 2, dx = Math.sin(a), dy = -Math.cos(a), C = 9, c = mk(C * 2 + 1, C * 2 + 1), x = c.getContext('2d');
    const cr = heroRamp(A.sleeve), sr = heroRamp(A.skin), r2 = A.r * A.r * 0.8;
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
      const px = i + 0.5 - (C + 0.5), py = j + 0.5 - (C + 0.5);
      const t = clamp(px * dx + py * dy, 0, n), ex = px - dx * t, ey = py - dy * t;
      if (ex * ex + ey * ey > r2) continue;
      const side = -ex * 0.6 - ey * 0.8;
      let v = 3 - dark + (side > 0.35 ? 1 : side < -0.35 ? -1 : 0);
      const skin = t > A.sl;
      if (!skin && t > A.sl - 1.1) v -= 1;
      x.fillStyle = (skin ? sr : cr)[clamp(v, 0, 5)]; x.fillRect(i, j, 1, 1);
    }
    return { img: c, C, hx: dx * n, hy: dy * n };
  });
}

{
  const _buildNpcLooks = buildNpcLooks;
  buildNpcLooks = function () {
    _buildNpcLooks();
    for (const n of NPCS) {
      const a = MORADOR_ARTE[n.id]; if (!a || !n.look) continue;
      const mat = moradorMat(a), seed = 31 + n.id.length * 7;
      n.look.body = heroPaint(a.body, mat, seed, a.lv);
      n.look.legs = heroPaint(a.legs, mat, seed + 1);
      n.look.head = a.hat ? { img: heroPaint(a.hat.rows, mat, seed + 2), oy: a.hat.oy } : null;
      n.look.art = a;
    }
  };
  const _npcPose = npcPose;
  npcPose = function (n) {
    const P = _npcPose(n), a = n.look && n.look.art; if (!a) return P;
    P.ox = a.ox; P.oy = a.oy; P.sb = a.sb; P.sf = a.sf;
    if (P.back) Object.assign(P.back, { draw: (c, sx, sy, A) => moradorDraw(n.id, a.arm, c, sx, sy, A, 1) });
    if (P.front) Object.assign(P.front, { draw: (c, sx, sy, A) => moradorDraw(n.id, a.arm, c, sx, sy, A, 0) });
    return P;
  };
}
function moradorDraw(id, spec, c, sx, sy, A, dark) {
  const r = moradorArm(id, spec, A.ang, A.len, dark);
  c.drawImage(r.img, Math.round(sx - 0.5) - r.C, Math.round(sy - 0.5) - r.C);
  return [sx + r.hx, sy + r.hy];
}
