'use strict';

/* ================= a Prisão dos Deuses: os bichos, parte dois =================
   Os outros cinco (docs/camadas/16-prisao-deuses.md, seção 6). Tiros, marcas, ondas, poças e faíscas são os do 393.
   - a Cria do Lobo (cria): os filhotes do lobo atado lá embaixo, magros, de pelo cinza-chumbo e olho âmbar. Vêm em
     dupla, correm rápido; perto, se agacham rosnando (as orelhas para trás, o olho acende, 0,4 s) e dão o bote;
   - o Gigante Agrilhoado (gigante): um dos que os deuses acorrentaram no salão, de joelhos, os pulsos presos ao chão por
     correntes curtas. Não sai do lugar, só vira. Ergue o punho (a marca vermelha acende no chão à frente, 1 s) e soca:
     quem está na marca leva, e uma onda corre rente ao chão por 6 blocos para os dois lados (pula-se por cima). Quem
     fica atrás dele leva a pisada do joelho (0,7 s de aviso, a marca curta atrás);
   - a Serpe do Fosso (serpe): a cobra de escamas verdes-escuras que mora nos poços do Tártaro, só a cabeça e o
     pescoço comprido fora da fenda, ondulando no ar. A garganta incha e acende verde (0,6 s) e ela cospe veneno em arco;
     onde o veneno cai fica uma poça por 3 s. Perto, recua o pescoço (0,45 s) e morde;
   - o Lamento (lamento): o que sobrou de um deus menor esquecido numa cela, um véu violeta quase transparente com um
     rosto. Flutua devagar, longe. Inspira (o rosto acende, um sussurro sobe, 0,8 s) e solta três gemidos lentos em leque;
   - o Acorrentador (acorrentador): o carcereiro vivo, encapuzado, com o gancho na corrente e a clava. Mantém uns 5
     blocos. O gancho brilha, a corrente chocalha e uma linha tracejada liga a mão ao herói (0,6 s; trava no fim): o
     gancho voa pela linha. Se pega, puxa o herói para perto (o herói fica sem controle um instante) e a clava desce logo
     depois (0,45 s de aviso). Se erra, ele fica puxando a corrente de volta (0,8 s) sem se defender. O escudo de frente
     segura o gancho.
   Prefixo pd2. */

Object.assign(ET, {
  cria: { name: 'Cria do Lobo', w: 16, h: 10, hp: 56, dmg: 18, xp: 22, kb: 0.7, fly: false, blood: '#7a1a14' },
  gigante: { name: 'Gigante Agrilhoado', w: 28, h: 38, hp: 270, dmg: 31, xp: 60, kb: 0, fly: false, blood: '#7a2418' },
  pdSerpe: { name: 'Serpe do Fosso', w: 14, h: 12, hp: 76, dmg: 22, xp: 30, kb: 0.4, fly: true, blood: '#3a6a1a' },
  lamento: { name: 'Lamento', w: 12, h: 16, hp: 52, dmg: 18, xp: 24, kb: 0.8, fly: true, blood: '#8a5ad8' },
  acorrentador: { name: 'Acorrentador', w: 10, h: 22, hp: 92, dmg: 21, xp: 32, kb: 0.5, fly: false, blood: '#6a1a14' }
});
const PD2_TYPES = ['cria', 'gigante', 'pdSerpe', 'lamento', 'acorrentador'];
const PD_TYPES = PD1_TYPES.concat(PD2_TYPES);
const PD2_DROPS = {
  cria: [['presa_lobo', 0.4], ['min_ferro_divino', 0.07], ['pocao', 0.07], ...PD_BASES],
  gigante: [['coracao_pedra', 0.5], ['icor_divino', 0.3], ['min_ferro_divino', 0.14], ['pocao', 0.1], ...PD_BASES],
  pdSerpe: [['icor_divino', 0.25], ['min_ferro_divino', 0.08], ['pocao', 0.07], ...PD_BASES],
  lamento: [['icor_divino', 0.35], ['min_ferro_divino', 0.06], ['pocao', 0.07], ...PD_BASES],
  acorrentador: [['elo_vivo', 0.35], ['min_ferro_divino', 0.09], ['pocao', 0.07], ...PD_BASES]
};
function pd2Tables() { for (const k of PD2_TYPES) DROPS[k] = PD2_DROPS[k].filter(([id]) => ITEMS[id]); }
pd2Tables();
Object.assign(NAV_WALKERS, { cria: 1, acorrentador: 1 });
Object.assign(CV_STEP, { cria: 1, acorrentador: 1 });
ET.acorrentador.climbs = true;

const PD2_AGACHA = 0.4, PD2_PUNHO = 1.0, PD2_PISA = 0.7, PD2_INCHA = 0.6, PD2_RECUA = 0.45, PD2_INSPIRA = 0.8, PD2_MIRA = 0.6, PD2_CLAVA = 0.45;

/* ================= arte ================= */
const PD2 = {};
{
const { cg } = CVART, { AR, rod, slab, ring, cp, set } = PD1, R7 = a => a.map(h => ph(h));
const AR2 = {
  lobo: R7(['#0c0c0e', '#1a1a1e', '#2a2a30', '#3e3e46', '#56565e', '#74747c', '#9a9aa2']),
  gig: R7(['#1a0e0a', '#2e1a12', '#46281a', '#603a26', '#7e5034', '#a06c48', '#c49068']),
  esc: R7(['#060c04', '#0e1a0a', '#182a10', '#24401a', '#345a24', '#4c7a34', '#6a9a48']),
  ventre: R7(['#2a2a14', '#46441e', '#66602c', '#86803e', '#a6a056', '#c4be74', '#e0dca0']),
  veu: R7(['#0e0818', '#1a1030', '#2a1a4a', '#3e2a68', '#58408a', '#7a5ab0', '#a888d8']),
  capuz: R7(['#0a0606', '#160c0c', '#241414', '#341e1c', '#462a26', '#5a3832', '#724a42']),
  madeira: R7(['#140a04', '#24140a', '#382012', '#4e2e1a', '#664024', '#82542e', '#a06e40'])
};
const ell = (P, cx, cy, rx, ry, R, base, s, ln = 1.4) => {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) P.put(x, y, R, base - (dx * 0.6 + dy * 0.8) * ln + cg(x, y, s) * 0.35);
  }
};

/* ---------- a Cria do Lobo: quadro 28 x 18, o meio dos pés em x 13, os pés na linha 16 ----------
   k 0 parado, 1-2 a corrida, 3 agachado (o aviso), 4 o bote (esticado) */
function cria(k) {
  const P = cp(28, 18), s = 39401 + k * 7, R = AR2.lobo, B = 13, F = 16;
  const crouch = k === 3 ? 3 : 0, str = k === 4 ? 3 : 0, by = F - 8 + crouch - (k === 4 ? 2 : 0);
  // as pernas de trás (na sombra) e as da frente
  const legs = k === 1 ? [[-6, 3], [5, -3]] : k === 2 ? [[-6, -3], [5, 3]] : k === 4 ? [[-9, -4], [8, 5]] : [[-6, 0], [5, 0]];
  for (const [lx, sw] of legs) rod(P, B + lx - str, by + 2, B + lx + sw - str + (lx > 0 ? str * 2 : 0), F, 2, R, 1.8, s + lx);
  // o corpo magro, as costelas
  ell(P, B - str * 0.3, by, 9 + str, 3.4, R, 3.1, s);
  for (let x = B - 3; x <= B + 2; x += 2) P.put(x, by + 1, R, 2);
  // o rabo para trás
  rod(P, B - 9 - str, by - 1, B - 14 - str, by - 3 + (k === 3 ? 4 : 0), 2, R, 2.8, s + 2);
  for (const [lx, sw] of legs) rod(P, B + lx + 2 - str, by + 2, B + lx + 2 + sw - str + (lx > 0 ? str * 2 : 0), F, 2, R, 3, s + lx + 9);
  // a cabeça: o focinho comprido, as orelhas (para trás no aviso), a boca aberta no bote
  const hx = B + 9 + str, hy = by - 2 + (k === 3 ? 2 : 0);
  ell(P, hx, hy, 3.4, 2.6, R, 3.6, s + 3);
  for (let i = 0; i <= 4; i++) { P.put(hx + 2 + i, hy + (i > 2 ? 1 : 0), R, 3.4 - i * 0.2); P.put(hx + 2 + i, hy + 1, R, 2.6); }
  if (k === 4) { P.put(hx + 5, hy + 2, R, 2.4); P.put(hx + 6, hy + 3, R, 2.4); P.put(hx + 4, hy + 2, AR.osso, 5); P.put(hx + 6, hy + 2, AR.osso, 5); }
  const ear = k === 3 ? [[hx - 3, hy - 2], [hx - 5, hy - 2]] : [[hx - 1, hy - 3], [hx - 1, hy - 5]];
  for (const [x, y] of ear) P.put(x, y, R, 3.8);
  P.put(hx + 1, hy - 1, AR.aviso, 1.5);
  return set(P.done());
}

/* ---------- o Gigante Agrilhoado: quadro 52 x 50, o meio dos pés em x 24, o chão na linha 48 ----------
   de joelhos. k 0 parado (as mãos no chão), 1 o punho erguido (o aviso), 2 o soco no chão, 3 o joelho erguido (a pisada
   para trás), 4 a pisada */
function gigante(k) {
  const P = cp(52, 50), s = 39421 + k * 9, R = AR2.gig, B = 24, F = 48;
  // a perna de trás dobrada (o joelho no chão, o pé para trás)
  const kneeUp = k === 3 ? 6 : 0;
  slab(P, B - 14, F - 6 - kneeUp, B - 4, F - kneeUp, R, s, 2.2);
  slab(P, B - 18, F - 3 - kneeUp * 0.5, B - 12, F - kneeUp * 0.5, R, s + 1, 2);
  // o tronco curvado, enorme, as costas para cima e à esquerda (luz de cima)
  ell(P, B - 2, F - 22, 13, 13, R, 3.1, s + 2, 1.6);
  ell(P, B + 3, F - 16, 10, 9, R, 2.8, s + 3, 1.2);
  // as marcas dos açoites e o cinto de ferro
  for (let i = 0; i < 4; i++) for (let t = 0; t < 8; t++) P.put(B - 8 + i * 4 + t * 0.6, F - 30 + t, R, 1.6);
  for (let x = B - 12; x <= B + 12; x++) P.put(x, F - 11 + (Math.abs(x - B) > 9 ? 1 : 0), AR.ferro, 3 + (x < B ? 0.6 : 0));
  // a perna da frente (o joelho à frente, a canela no chão)
  slab(P, B + 2, F - 8, B + 13, F, R, s + 4, 3);
  // a cabeça baixa, a barba, o colar de ferro grosso com a argola
  const hx = B + 9, hy = F - 33 + (k === 2 ? 4 : k === 1 ? -2 : 0);
  ell(P, hx, hy, 5, 5, R, 3.4, s + 5);
  for (let y = hy + 2; y <= hy + 7; y++) for (let x = hx - 2; x <= hx + 4; x++) P.put(x + (y - hy - 2) * 0.3, y, AR.pano, 3 - (y - hy) * 0.2 + cg(x, y, s + 6) * 0.6);
  slab(P, hx - 8, hy + 3, hx - 1, hy + 6, AR.ferro, s + 7, 3);
  ring(P, hx - 4, hy + 8, 2.4, 2.4, 1, AR.ferro, 3, s + 8);
  P.put(hx + 3, hy - 1, AR.aviso, 3); P.put(hx + 2, hy - 1, AR.aviso, 1.5);
  // o braço da frente: no chão, erguido acima da cabeça, ou socando
  const sh = [B + 7, F - 26], fist = k === 1 ? [B + 6, F - 46] : k === 2 ? [B + 22, F - 3] : [B + 18, F - 3];
  const el = k === 1 ? [B + 14, F - 38] : [(sh[0] + fist[0]) / 2 + 2, (sh[1] + fist[1]) / 2];
  rod(P, sh[0], sh[1], el[0], el[1], 6, R, 3.2, s + 9); rod(P, el[0], el[1], fist[0], fist[1], 5, R, 3.4, s + 10);
  ell(P, fist[0], fist[1], 4, 3.5, R, 3.6, s + 11);
  slab(P, (el[0] + fist[0] * 2) / 3 - 3, (el[1] + fist[1] * 2) / 3 - 2, (el[0] + fist[0] * 2) / 3 + 3, (el[1] + fist[1] * 2) / 3 + 2, AR.ferro, s + 12, 3.2);   // a algema
  return set(P.done());
}
// a algema do punho da frente (onde a corrente prende), em relação ao meio dos pés
PD2.GG_ALG = [[18, -3], [10, -42], [20, -3], [18, -3], [18, -3]];

/* ---------- a Serpe do Fosso: a cabeça (quadro 22 x 16, o meio em 10, 8) e o gomo do corpo (8 x 8) ----------
   k 0 boca fechada, 1 a garganta inchada (o aviso), 2 a boca aberta (cuspe), 3 recuada (o aviso da mordida), 4 a mordida */
function serpe(k) {
  const P = cp(22, 16), s = 39441 + k * 7, R = AR2.esc, cx = 9, cy = 8;
  const back = k === 3 ? -2 : k === 4 ? 2 : 0;
  ell(P, cx + back, cy, 6, 4.2, R, 3.3, s);
  // as escamas
  for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 5 + back; x <= cx + 5 + back; x++) if ((x + y * 2) % 4 === 0 && Math.hypot((x - cx - back) / 6, (y - cy) / 4.2) < 0.85) P.put(x, y, R, 2.2);
  // o queixo e a garganta (incha no aviso)
  ell(P, cx + back - 1, cy + 3, k === 1 ? 5 : 3.6, k === 1 ? 3 : 1.8, AR2.ventre, k === 1 ? 4 : 3, s + 1);
  // o focinho e a boca
  const open = k === 2 || k === 4;
  for (let i = 0; i <= 5; i++) { P.put(cx + 5 + back + i, cy - 1 - (open ? i * 0.4 : 0), R, 3.6 - i * 0.2); P.put(cx + 5 + back + i, cy - (open ? i * 0.4 : 0), R, 3); }
  if (open) for (let i = 0; i <= 5; i++) { P.put(cx + 5 + back + i, cy + 2 + i * 0.4, AR2.ventre, 3); }
  if (open) { P.put(cx + 9 + back, cy + 1, AR.osso, 5); P.put(cx + 9 + back, cy + 3, AR.osso, 5); }
  // os chifres de trás e o olho
  rod(P, cx - 3 + back, cy - 3, cx - 7 + back, cy - 6, 1.5, AR.osso, 3, s + 2);
  P.put(cx + 3 + back, cy - 2, AR.aviso, 3);
  return set(P.done());
}
function gomo(k) {
  const P = cp(10, 10), R = AR2.esc;
  ell(P, 5, 5, 4 - k * 0.4, 4 - k * 0.4, R, 3, 39461 + k);
  for (let x = 2; x < 9; x++) if (x & 1) P.put(x, 6, AR2.ventre, 2.6);
  return P.done();
}

/* ---------- o Lamento: quadro 22 x 28, o meio em 11, o fundo do véu na linha 26 ----------
   k 0-1 a flutuação, 2 inspirando (o rosto aberto, o aviso), 3 o grito */
function lamento(k) {
  const P = cp(22, 28), s = 39471 + k * 7, R = AR2.veu, cx = 11;
  for (let y = 4; y <= 26; y++) {
    const t = (y - 4) / 22, w = 4 + t * 5 + (k === 2 ? t * 1.5 : 0);
    for (let x = Math.floor(cx - w); x <= cx + w; x++) {
      const dx = (x + 0.5 - cx) / w, edge = y > 22 && ((x + k + Math.floor(y / 2)) % 3 === 0);
      if (edge) continue;
      P.put(x, y, R, 3.4 - dx * 0.9 - t * 1.2 + cg(x, y, s) * 0.5 + (Math.abs(dx) > 0.8 ? -0.8 : 0));
    }
  }
  // o rosto: os olhos fundos e a boca (aberta no aviso, rasgada no grito)
  const fy = 9;
  for (const ex of [cx - 2, cx + 2]) { P.put(ex, fy, R, 0.3); P.put(ex, fy + 1, R, 0.6); }
  const mh = k === 2 ? 3 : k === 3 ? 5 : 1;
  for (let y = 0; y < mh; y++) { P.put(cx, fy + 4 + y, R, 0.2); if (mh > 2) { P.put(cx - 1, fy + 4 + y, R, 0.5); P.put(cx + 1, fy + 4 + y, R, 0.5); } }
  // as mãos esticadas para os lados
  rod(P, cx - 5, 13, cx - 9 - (k === 3 ? 2 : 0), 16 - (k === 2 ? 4 : 0), 1.5, R, 3.6, s + 1);
  rod(P, cx + 5, 13, cx + 9 + (k === 3 ? 2 : 0), 16 - (k === 2 ? 4 : 0), 1.5, R, 3.6, s + 2);
  return set(P.done());
}

/* ---------- o Acorrentador: quadro 32 x 30, o meio dos pés em x 13, os pés na linha 28 ----------
   k 0 parado, 1-2 o passo, 3 o gancho erguido (o aviso), 4 o arremesso, 5 a clava erguida (o aviso), 6 a clavada */
const AC = [
  { lg: 0, cl: [-0.3, 6], mao: [18, 16] }, { lg: 2, cl: [-0.2, 6], mao: [18, 16] }, { lg: -2, cl: [-0.4, 6], mao: [17, 16] },
  { lg: 0, cl: [-0.3, 6], mao: [19, 6] }, { lg: 1, cl: [-0.3, 6], mao: [23, 13] }, { lg: -1, cl: [-2.4, 7], mao: [17, 16] }, { lg: 1, cl: [0.6, 7], mao: [17, 16] }
];
function acorrentador(k) {
  const o = AC[k], P = cp(32, 30), s = 39481 + k * 7, B = 13, F = 28, R = AR2.capuz;
  // a clava (atrás, na mão de trás) e o braço de trás
  const hx = B - 3, hy = F - 16, a = o.cl[0], L = 11;
  rod(P, B - 1, F - 19, hx, hy, 2, AR.pele, 2.2, s);
  rod(P, hx, hy, hx + Math.cos(a - Math.PI / 2) * L, hy + Math.sin(a - Math.PI / 2) * L, 2.5, AR2.madeira, 3, s + 1);
  const tx = hx + Math.cos(a - Math.PI / 2) * L, ty = hy + Math.sin(a - Math.PI / 2) * L;
  ell(P, tx, ty, 2.6, 2.6, AR2.madeira, 3.4, s + 2);
  P.put(tx - 1, ty - 2, AR.ferro, 5); P.put(tx + 2, ty, AR.ferro, 5);
  // as pernas, o manto até o joelho
  rod(P, B - 1, F - 9, B - 2 - o.lg, F, 2, AR.pano, 2.2, s + 3);
  rod(P, B + 1, F - 9, B + 2 + o.lg, F, 2, AR.pano, 3, s + 4);
  for (let y = F - 21; y <= F - 7; y++) { const w = 3 + (y - F + 21) * 0.18; for (let x = Math.floor(B - w); x <= B + w; x++) P.put(x, y, R, 3.2 - (x - B) / w * 0.8 + cg(x, y, s + 5) * 0.5 + ((x + y) % 5 === 0 ? -0.5 : 0)); }
  // o cinto com as voltas de corrente
  for (let x = B - 4; x <= B + 4; x++) P.put(x, F - 12, AR.ferro, (x & 1) ? 4 : 2.4);
  // o capuz pontudo e a sombra do rosto
  for (let y = F - 28; y <= F - 20; y++) { const w = (y - F + 28) * 0.45 + 0.5; for (let x = Math.floor(B - w); x <= B + 1 + w; x++) P.put(x, y, R, 3.6 - (x - B) * 0.25 - (y - F + 24) * 0.1); }
  for (let x = B; x <= B + 2; x++) P.put(x, F - 23, R, 0.2);
  P.put(B + 2, F - 23, AR.aviso, 2.6);
  // o braço da frente (segura a corrente do gancho)
  const [mx, my] = o.mao;
  rod(P, B + 2, F - 19, (B + 2 + mx) / 2, (F - 19 + my) / 2 + 1, 2, R, 3.4, s + 6); rod(P, (B + 2 + mx) / 2, (F - 19 + my) / 2 + 1, mx, my, 1.5, AR.pele, 3.4, s + 7);
  return set(P.done());
}

PD2.get = () => PD2.ready || (PD2.ready = {
  cr: [0, 1, 2, 3, 4].map(cria),
  gg: [0, 1, 2, 3, 4].map(gigante),
  sp: [0, 1, 2, 3, 4].map(serpe), gm: [0, 1, 2].map(gomo), gmW: null,
  lm: [0, 1, 2, 3].map(lamento),
  ac: AC.map((_, k) => acorrentador(k))
});
PD2.GL = { ambar: glow(4, '#ffb030'), ambarG: glow(9, '#ffb030'), verde: glow(5, '#7ad04a'), verdeG: glow(12, '#9ae060'), violeta: glow(8, '#b08aff'), violetaG: glow(16, '#c8a8ff'), branco: glow(6, '#fff0c8') };
Object.assign(PD2, { AR2, AC });
}

/* ================= desenho ================= */
const pd2CrPose = e => e.state === 'agacha' ? 3 : e.state === 'bote' ? 4 : e.onGround && Math.abs(e.vx) > 6 ? 1 + Math.floor(e.t * 10) % 2 : 0;
DRAW_E.cria = (e, fx, fy, fl) => pdBlit(cvPick(PD2.get().cr[pd2CrPose(e)], e, fl), e, fx, fy, 13, 16, pdJit(e, e.state === 'agacha'));
EYES_E.cria = (e, fx, fy) => { const G = PD2.GL, k = pd2CrPose(e), hot = k === 3 || k === 4; const hy = k === 3 ? -7 : k === 4 ? -12 : -11, hx = (k === 4 ? 13 : 10); lc.globalAlpha = hot ? 0.8 : 0.4; lc.drawImage(hot ? G.ambarG : G.ambar, Math.round(fx + hx * e.facing) - (hot ? 9 : 4), Math.round(fy + hy) - (hot ? 9 : 4)); };
WARN_E.cria = e => e.state === 'agacha';

const pd2GgPose = e => e.state === 'ergue' ? 1 : e.state === 'soco' ? 2 : e.state === 'joelho' ? 3 : e.state === 'pisa' ? 4 : 0;
DRAW_E.gigante = (e, fx, fy, fl) => {
  const k = pd2GgPose(e);
  // as correntes curtas dos pulsos até as argolas cravadas no chão
  const [ax, ay] = PD2.GG_ALG[k], hx = fx + ax * e.facing, hy = fy + ay, anc = fx + 24 * e.facing;
  pd1Corrente(Math.round(hx), Math.round(hy), Math.round(anc), Math.round(fy - 1));
  pd1Corrente(Math.round(fx - 16 * e.facing), Math.round(fy - 4), Math.round(fx - 26 * e.facing), Math.round(fy - 1));
  lc.fillStyle = '#0a0a0e'; lc.fillRect(Math.round(anc) - 2, fy - 3, 5, 3); lc.fillRect(Math.round(fx - 26 * e.facing) - 2, fy - 3, 5, 3);
  lc.fillStyle = '#55555f'; lc.fillRect(Math.round(anc) - 1, fy - 2, 3, 1); lc.fillRect(Math.round(fx - 26 * e.facing) - 1, fy - 2, 3, 1);
  pdBlit(cvPick(PD2.get().gg[k], e, fl), e, fx, fy, 24, 48, pdJit(e, (e.state === 'ergue' || e.state === 'joelho') && e.stateT < 0.25));
};
EYES_E.gigante = (e, fx, fy) => { const G = PD1.GL, k = pd2GgPose(e), hot = k === 1 || k === 3, dy = k === 2 ? 4 : k === 1 ? -2 : 0; lc.globalAlpha = hot ? 0.85 : 0.45; lc.drawImage(hot ? G.avisoM : G.aviso, Math.round(fx + 12 * e.facing) - (hot ? 16 : 5), Math.round(fy - 34 + dy) - (hot ? 16 : 5)); };
WARN_E.gigante = e => e.state === 'ergue' || e.state === 'joelho';

const pd2SpPose = e => e.state === 'incha' ? 1 : e.state === 'cospe' ? 2 : e.state === 'recua' ? 3 : e.state === 'morde' ? 4 : 0;
DRAW_E.pdSerpe = (e, fx, fy, fl) => {
  const A = PD2.get(), cx = e.x + e.w / 2, cy = e.y + e.h / 2, ox = fx - cx, oy = fy - (e.y + e.h);
  // o pescoço: do buraco (a base) até a cabeça, em gomos ao longo de uma curva que ondula
  const bx = e.homeX, by = e.baseY, n = 9;
  for (let i = n; i >= 1; i--) {
    const t = i / (n + 1), wob = Math.sin(e.t * 3 + t * 6) * 4 * Math.sin(t * Math.PI);
    const x = bx + (cx - bx) * t + wob, y = by + (cy - by) * t - Math.sin(t * Math.PI) * 8;
    const g = A.gm[i < 3 ? 2 : i < 6 ? 1 : 0];
    lc.drawImage(fl ? (A.gmW || (A.gmW = A.gm.map(whiteOf)))[A.gm.indexOf(g)] : g, Math.round(x + ox - g.width / 2), Math.round(y + oy - g.height / 2));
  }
  const img = cvPick(A.sp[pd2SpPose(e)], e, fl);
  lc.drawImage(img, Math.round(e.facing > 0 ? fx - 10 : fx - (img.width - 11)), Math.round(cy + oy - 9));
};
EYES_E.pdSerpe = (e, fx, fy) => {
  const G = PD2.GL, k = pd2SpPose(e), cy = fy - e.h / 2;
  if (k === 1) { lc.globalAlpha = 0.5 + 0.4 * clamp(1 - e.stateT / PD2_INCHA, 0, 1); lc.drawImage(G.verdeG, Math.round(fx + 1 * e.facing) - 12, Math.round(cy + 3) - 12); }
  lc.globalAlpha = k === 3 ? 0.8 : 0.35; lc.drawImage(PD1.GL.aviso, Math.round(fx + 4 * e.facing) - 5, Math.round(cy - 2) - 5);
};
WARN_E.pdSerpe = e => e.state === 'incha' || e.state === 'recua';

const pd2LmPose = e => e.state === 'inspira' ? 2 : e.state === 'grita' ? 3 : Math.floor(e.t * 2) % 2;
DRAW_E.lamento = (e, fx, fy, fl) => {
  const img = cvPick(PD2.get().lm[pd2LmPose(e)], e, fl), bob = Math.round(Math.sin(e.t * 2.2) * 2);
  lc.globalAlpha = fl ? 0.9 : 0.55 + 0.15 * Math.sin(e.t * 3.1); lc.drawImage(img, Math.round(fx - img.width / 2), Math.round(fy - img.height + 4 + bob)); lc.globalAlpha = 1;
};
EYES_E.lamento = (e, fx, fy) => { const G = PD2.GL, hot = e.state === 'inspira', bob = Math.round(Math.sin(e.t * 2.2) * 2); lc.globalAlpha = hot ? 0.45 + 0.45 * clamp(1 - e.stateT / PD2_INSPIRA, 0, 1) : 0.3; lc.drawImage(hot ? G.violetaG : G.violeta, Math.round(fx) - (hot ? 16 : 8), Math.round(fy - 17 + bob) - (hot ? 16 : 8)); };
WARN_E.lamento = e => e.state === 'inspira';

const pd2AcPose = e => e.state === 'mira' ? 3 : e.state === 'lanca' || e.state === 'recolhe' || e.state === 'puxa' ? 4 : e.state === 'ergue' ? 5 : e.state === 'clava' ? 6 : e.onGround && Math.abs(e.vx) > 4 ? 1 + Math.floor(e.t * 6) % 2 : 0;
function pd2AcMao(e) { const o = PD2.AC[pd2AcPose(e)], cx = e.x + e.w / 2, fy = e.y + e.h; return [cx + (o.mao[0] - 13) * e.facing, fy - (28 - o.mao[1])]; }
DRAW_E.acorrentador = (e, fx, fy, fl) => {
  pdBlit(cvPick(PD2.get().ac[pd2AcPose(e)], e, fl), e, fx, fy, 13, 28, pdJit(e, e.state === 'mira' && e.stateT < 0.2));
  if (e.gancho) return;
  // o gancho na mão (balançando, ou erguido girando no aviso)
  const [mx, my] = pd2AcMao(e), ox = fx - (e.x + e.w / 2), oy = fy - (e.y + e.h);
  const a = e.state === 'mira' ? e.t * 14 : Math.sin(e.t * 2) * 0.3 + Math.PI / 2, L = e.state === 'mira' ? 6 : 7;
  const gx = mx + Math.cos(a) * L, gy = my + Math.sin(a) * L;
  pd1Corrente(mx + ox, my + oy, gx + ox, gy + oy); pd2Gancho(gx + ox, gy + oy, a, fl);
};
EYES_E.acorrentador = (e, fx, fy) => {
  const G = PD1.GL, hot = e.state === 'mira' || e.state === 'ergue';
  lc.globalAlpha = hot ? 0.75 : 0.3; lc.drawImage(hot ? G.avisoG : G.aviso, Math.round(fx + 2 * e.facing) - (hot ? 10 : 5), Math.round(fy - 23) - (hot ? 10 : 5));
  if (e.state === 'mira') { const [mx, my] = pd2AcMao(e); lc.globalAlpha = 0.7; lc.drawImage(PD2.GL.branco, Math.round(fx + (mx - e.x - e.w / 2)) - 6, Math.round(fy + (my - e.y - e.h)) - 6); }
};
WARN_E.acorrentador = e => e.state === 'mira' || e.state === 'ergue';
// o gancho: a haste e a ponta curva (na tela)
function pd2Gancho(x, y, a, fl) {
  x = Math.round(x); y = Math.round(y);
  const ux = Math.cos(a), uy = Math.sin(a);
  for (let t = 0; t <= 4; t++) { lc.fillStyle = '#0a0a0e'; lc.fillRect(Math.round(x + ux * t) - 1, Math.round(y + uy * t) - 1, 3, 3); }
  for (let t = 0; t <= 4; t++) { lc.fillStyle = fl ? '#fff' : t < 2 ? '#a8a8b4' : '#6a6a76'; lc.fillRect(Math.round(x + ux * t), Math.round(y + uy * t), 1, 1); }
  const px = x + ux * 4, py = y + uy * 4, nx = -uy, ny = ux;
  for (let t = 0; t <= 3; t++) { const qx = Math.round(px + nx * t - ux * t * 0.6), qy = Math.round(py + ny * t - uy * t * 0.6); lc.fillStyle = '#0a0a0e'; lc.fillRect(qx - 1, qy - 1, 3, 3); lc.fillStyle = fl ? '#fff' : '#d8d8e0'; lc.fillRect(qx, qy, 1, 1); }
}

/* ================= comportamento ================= */
/* ---------- a Cria: corre, se agacha e dá o bote ---------- */
AI.cria = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  if (e.state === 'agacha') {
    e.vx = approach(e.vx, 0, 900 * dt);
    if (e.stateT <= 0) { e.state = 'bote'; e.stateT = 0.7; e.mordeu = false; const d = clamp(Math.abs(dx), T, 5 * T); e.vx = e.facing * (d / 0.38); e.vy = -170; e.onGround = false; sfx.pdBote(Math.max(0.3, pdNear(e))); }
    return;
  }
  if (e.state === 'bote') {
    if (!e.mordeu && overlap(e, pl) && !pl.dead) { e.mordeu = true; hurtPlayer(e.dmg, e.x + e.w / 2, e, false); }
    if ((e.onGround && e.stateT < 0.6) || e.stateT <= 0 || e.hitWall) { e.state = 'recupera'; e.stateT = 0.55; }
    return;
  }
  if (e.state === 'recupera') { e.vx = approach(e.vx, 0, 700 * dt); if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  if (aggro && e.atkCD <= 0 && e.onGround && dist < 4.6 * T && dist > T && Math.abs(dy) < 1.6 * T && e.sees) {
    e.facing = Math.sign(dx) || e.facing; e.state = 'agacha'; e.stateT = PD2_AGACHA; e.atkCD = 1.3 + Math.random() * 0.7;
    sfx.pdRosna(Math.max(0.3, pdNear(e)));
    return;
  }
  let dir = 0;
  if (aggro) { dir = Math.abs(dx) > 2.5 * T ? Math.sign(dx) : Math.abs(dx) < 1.5 * T ? -Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 92 : 30, 700, 280, dy, aggro && dir === Math.sign(dx));
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
};

/* ---------- o Gigante: de joelhos, preso; o soco com a onda, a pisada para trás ---------- */
AI.gigante = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt; e.vx = 0;
  if (e.state === 'ergue') { if (e.stateT <= 0) pd2GgSoca(e); return; }
  if (e.state === 'joelho') { if (e.stateT <= 0) pd2GgPisa(e); return; }
  if (e.state === 'soco' || e.state === 'pisa') { if (e.stateT <= 0) { e.state = 'recupera'; e.stateT = 0.9; } return; }
  if (e.state === 'recupera') { if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  if (!aggro) return;
  const behind = Math.sign(dx) !== e.facing && Math.abs(dx) > 4;
  // vira devagar (meio segundo olhando o herói pelas costas antes de virar)
  if (behind) { e.viraT = (e.viraT || 0) + dt; if (e.viraT > 0.8 && !(Math.abs(dx) < 2.6 * T && Math.abs(dy) < 2 * T && e.atkCD <= 0)) { e.facing = Math.sign(dx); e.viraT = 0; } }
  else e.viraT = 0;
  if (e.atkCD > 0 || Math.abs(dy) > 3 * T) return;
  const fr = pdFloorRow(e.x + e.w / 2, e.y + e.h - 2), cx = e.x + e.w / 2;
  if (behind && Math.abs(dx) < 2.6 * T) {
    e.state = 'joelho'; e.stateT = PD2_PISA; e.marca = fr >= 0 ? pdMarca(cx - e.facing * 6, cx - e.facing * 32, fr, PD2_PISA) : null; sfx.pdRange(Math.max(0.4, pdNear(e)));
  } else if (!behind && Math.abs(dx) < 6.5 * T && e.sees) {
    e.state = 'ergue'; e.stateT = PD2_PUNHO; e.marca = fr >= 0 ? pdMarca(cx + e.facing * 12, cx + e.facing * 40, fr, PD2_PUNHO) : null; sfx.pdGigErgue(Math.max(0.4, pdNear(e, 320)));
  }
};
function pd2GgSoca(e) {
  e.state = 'soco'; e.stateT = 0.25; e.atkCD = 2.4 + Math.random() * 0.8;
  const cx = e.x + e.w / 2, fy = e.y + e.h, x0 = Math.min(cx + e.facing * 12, cx + e.facing * 40);
  if (pdBoxHits(x0, fy - 24, 28, 24)) hurtPlayer(e.dmg, cx, e, false);
  const fr = pdFloorRow(cx, fy - 2), ix = cx + e.facing * 26;
  if (fr >= 0) { pdOnda(ix, fr, 1, 6 * T, Math.round(e.dmg * 0.6), e); pdOnda(ix, fr, -1, 6 * T, Math.round(e.dmg * 0.6), e); }
  burst(ix, fy - 2, 14, '#603a26', 90, 300, 0.6); pdSparks(ix, fy - 3, 8, PD_FAISCA, 80, 200, 0.4);
  const v = pdNear(e, 380); if (v > 0.02) { sfx.pdGigSoco(v); shake(2 + 4 * v); }
}
function pd2GgPisa(e) {
  e.state = 'pisa'; e.stateT = 0.2; e.atkCD = 1.6 + Math.random() * 0.5;
  const cx = e.x + e.w / 2, fy = e.y + e.h, x0 = Math.min(cx - e.facing * 6, cx - e.facing * 32);
  if (pdBoxHits(x0, fy - 16, 26, 16)) hurtPlayer(Math.round(e.dmg * 0.8), cx, e, false);
  burst(cx - e.facing * 18, fy - 2, 10, '#603a26', 70, 300, 0.5);
  const v = pdNear(e, 300); if (v > 0.02) { sfx.pdBaque(v); shake(1.5 + 2 * v); }
}

/* ---------- a Serpe: sai do buraco, ondula; incha a garganta e cospe; recua e morde ---------- */
AI.pdSerpe = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  // a cabeça fica presa a uns 5 blocos da base (o pescoço não estica mais)
  const lim = () => { const ddx = e.x + e.w / 2 - e.homeX, ddy = e.y + e.h / 2 - e.baseY, d = Math.hypot(ddx, ddy), M = 5 * T; if (d > M) { e.x -= ddx * (1 - M / d); e.y -= ddy * (1 - M / d); e.vx *= 0.5; e.vy *= 0.5; } };
  if (e.state === 'incha') {
    e.vx = approach(e.vx, 0, 300 * dt); e.vy = approach(e.vy, 0, 300 * dt); e.facing = Math.sign(pcx - cx) || e.facing;
    if (e.stateT <= 0) pd2SpCospe(e, pcx, pcy);
    lim(); return;
  }
  if (e.state === 'cospe') { e.vx = 0; e.vy = 0; if (e.stateT <= 0) e.state = 'walk'; lim(); return; }
  if (e.state === 'recua') {
    e.vx = approach(e.vx, -e.facing * 30, 400 * dt); e.vy = approach(e.vy, 0, 300 * dt);
    if (e.stateT <= 0) { e.state = 'morde'; e.stateT = 0.35; e.mordeu = false; const a = Math.atan2(pcy - cy, pcx - cx); e.vx = Math.cos(a) * 260; e.vy = Math.sin(a) * 260; sfx.pdSerpeMorde(Math.max(0.4, pdNear(e))); }
    lim(); return;
  }
  if (e.state === 'morde') {
    if (!e.mordeu && overlap(e, pl) && !pl.dead) { e.mordeu = true; hurtPlayer(e.dmg, cx, e, false); }
    e.vx = approach(e.vx, 0, 700 * dt); e.vy = approach(e.vy, 0, 700 * dt);
    if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1.1); }
    lim(); return;
  }
  e.state = 'walk';
  // ondula em volta de um ponto acima da base, puxado na direção do herói
  const th = e.t * 1.2 + e.seed, ax = aggro ? clamp(pcx - e.homeX, -3 * T, 3 * T) : 0;
  const gx = e.homeX + ax + Math.sin(th) * 1.5 * T, gy = e.baseY - 3.5 * T + Math.cos(th * 1.4) * T;
  e.vx = approach(e.vx, clamp((gx - cx) * 2, -70, 70), 200 * dt); e.vy = approach(e.vy, clamp((gy - cy) * 2, -70, 70), 200 * dt);
  e.facing = aggro ? Math.sign(pcx - cx) || e.facing : Math.sign(e.vx) || e.facing;
  if (aggro && e.atkCD <= 0 && e.sees) {
    if (dist < 2.6 * T) { e.state = 'recua'; e.stateT = PD2_RECUA; e.atkCD = 1.4; sfx.pdSibilo(Math.max(0.4, pdNear(e))); }
    else if (dist < 11 * T && losClear(cx, cy, pcx, pcy)) { e.state = 'incha'; e.stateT = PD2_INCHA; e.atkCD = 2.2 + Math.random() * 0.8; sfx.pdIncha(Math.max(0.4, pdNear(e))); }
  }
  lim();
};
function pd2SpCospe(e, px, py) {
  e.state = 'cospe'; e.stateT = 0.3;
  const sx = e.x + e.w / 2 + e.facing * 9, sy = e.y + e.h / 2;
  // mira no chão debaixo do herói (a poça fica onde ele estava)
  const fr = pdFloorRow(px, py), ty = fr >= 0 ? fr * T - 2 : py, d = Math.hypot(px - sx, ty - sy), tf = clamp(d / 190, 0.4, 1.1), v = pdArco(sx, sy, px, ty, 420, tf);
  for (let k = -1; k <= 1; k++) pdTiro({ kind: 'veneno', x: sx, y: sy, vx: v.vx * (1 + k * 0.12), vy: v.vy, g: 420, r: 3, dmg: Math.round(e.dmg * 0.7), src: e, life: 2.5, onEnd: pd2Poca });
  sfx.pdCuspe(Math.max(0.4, pdNear(e)));
}
// o veneno caiu: abre uma poça no chão de baixo
function pd2Poca(S, x, y) {
  const fr = pdFloorRow(x, y - 4); if (fr < 0) return;
  for (const Q of pdPocas) if (Q.fr === fr && x > Q.x0 - 8 && x < Q.x1 + 8) { Q.x0 = Math.min(Q.x0, x - 8); Q.x1 = Math.max(Q.x1, x + 8); Q.t = Math.min(Q.t, 0.5); return; }
  if (pdPocas.length < 16) pdPocas.push({ x0: x - 9, x1: x + 9, fr, t: 0, max: 3, cd: 0, dmg: Math.max(4, Math.round(S.dmg * 0.4)) });
  pdSparks(x, fr * T - 2, 5, ['#7ad04a', '#d8ffb0'], 40, 200, 0.4);
  const v = pdNearP(x, y, 200); if (v > 0.05) sfx.pdChia(v);
}

/* ---------- o Lamento: flutua longe, inspira e solta três gemidos ---------- */
AI.lamento = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'inspira') {
    e.vx = approach(e.vx, 0, 200 * dt); e.vy = approach(e.vy, 0, 200 * dt);
    if (e.stateT <= 0) {
      e.state = 'grita'; e.stateT = 0.5;
      const a = Math.atan2(pcy - cy, pcx - cx);
      for (const k of [-0.32, 0, 0.32]) pdTiro({ kind: 'gemido', x: cx, y: cy - 3, vx: Math.cos(a + k) * 70, vy: Math.sin(a + k) * 70, r: 3, dmg: e.dmg, src: e, life: 3.6 });
      sfx.pdGemido(Math.max(0.4, pdNear(e, 300)));
    }
    return;
  }
  if (e.state === 'grita') { if (e.stateT <= 0) e.state = 'walk'; return; }
  e.state = 'walk';
  // fica a uns 6-8 blocos, um pouco acima
  const th = e.t * 0.6 + e.seed;
  let gx, gy;
  if (aggro) { const side = Math.sign(cx - pcx) || 1; gx = pcx + side * 7 * T + Math.sin(th) * T; gy = pcy - 2 * T + Math.cos(th * 1.3) * T; }
  else { gx = e.homeX + Math.sin(th) * 3 * T; gy = e.homeY + Math.cos(th) * T; }
  e.vx = approach(e.vx, clamp((gx - cx) * 1.2, -38, 38), 90 * dt); e.vy = approach(e.vy, clamp((gy - cy) * 1.2, -32, 32), 90 * dt);
  if (aggro) e.facing = Math.sign(pcx - cx) || e.facing;
  if (aggro && e.atkCD <= 0 && e.sees && dist < 12 * T && losClear(cx, cy, pcx, pcy)) { e.state = 'inspira'; e.stateT = PD2_INSPIRA; e.atkCD = 2.6 + Math.random(); sfx.pdSussurro(Math.max(0.4, pdNear(e, 300))); }
};

/* ---------- o Acorrentador: mira o gancho, lança, puxa, clava ---------- */
AI.acorrentador = function (e, dt, dx, dy, dist, aggro) {
  e.stateT -= dt;
  const pcx = pl.x + pl.w / 2, pcy = pl.y + pl.h / 2;
  if (e.state === 'mira') {
    e.vx = approach(e.vx, 0, 600 * dt); e.facing = Math.sign(dx) || e.facing;
    if (e.stateT > 0.15) { e.alvoX = pcx; e.alvoY = pcy; }
    e.chT = (e.chT || 0) - dt; if (e.chT <= 0) { e.chT = 0.15; sfx.pdChocalha(Math.max(0.3, pdNear(e)) * 0.7); }
    if (e.stateT <= 0) {
      const [mx, my] = pd2AcMao(e), a = Math.atan2(e.alvoY - my, e.alvoX - mx);
      e.state = 'lanca'; e.stateT = 2;
      e.gancho = pdTiro({ kind: 'gancho', x: mx, y: my, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, r: 3, src: e, life: 3, x0: mx, y0: my, max: 7.5 * T, fase: 'vai' });
      sfx.pdArremesso(Math.max(0.4, pdNear(e)));
    }
    return;
  }
  if (e.state === 'lanca' || e.state === 'recolhe') { e.vx = 0; if (!e.gancho) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1.4); } return; }
  if (e.state === 'puxa') { e.vx = 0; if (!e.gancho) { e.state = 'ergue'; e.stateT = PD2_CLAVA; sfx.pdErgue(Math.max(0.4, pdNear(e)) * 0.7); } return; }
  if (e.state === 'ergue') { e.vx = 0; e.facing = Math.sign(dx) || e.facing; if (e.stateT <= 0) pd2AcClava(e); return; }
  if (e.state === 'clava') { e.vx = 0; if (e.stateT <= 0) { e.state = 'walk'; e.atkCD = 1.6 + Math.random() * 0.6; } return; }
  e.state = 'walk';
  if (aggro && e.atkCD <= 0 && e.onGround) {
    if (Math.abs(dx) < 3 * T && Math.abs(dy) < 1.5 * T) { e.facing = Math.sign(dx) || e.facing; e.state = 'ergue'; e.stateT = PD2_CLAVA + 0.1; sfx.pdErgue(Math.max(0.4, pdNear(e)) * 0.7); return; }
    if (dist > 3 * T && dist < 7 * T && e.sees && clearPath(e, pl)) { e.facing = Math.sign(dx) || e.facing; e.state = 'mira'; e.stateT = PD2_MIRA; e.alvoX = pcx; e.alvoY = pcy; return; }
  }
  let dir = 0;
  if (aggro) { const adx = Math.abs(dx); dir = adx < 3.5 * T ? -Math.sign(dx) : adx > 6 * T || !e.sees ? Math.sign(dx) : 0; }
  else { cvWander(e, dt); dir = e.wander; }
  walk(e, dt, dir, aggro ? 46 : 22, 400, 260, dy, aggro && dir === Math.sign(dx));
  if (aggro) e.facing = Math.sign(dx) || e.facing; else if (dir) e.facing = dir;
};
function pd2AcClava(e) {
  e.state = 'clava'; e.stateT = 0.35;
  const cx = e.x + e.w / 2, fy = e.y + e.h, x0 = Math.min(cx, cx + e.facing * 36);
  if (pdBoxHits(x0, fy - 24, 36, 24)) hurtPlayer(e.dmg, cx, e, false);
  burst(cx + e.facing * 16, fy - 3, 6, '#6a6050', 50, 300, 0.4); const v = pdNear(e, 260); if (v > 0.03) sfx.pdBaque(v * 0.6);
}
// o gancho: vai em linha reta até o fim da corrente ou a pedra; pega o herói (o escudo de frente segura); volta
pdGanchoTick = function (S, dt) {
  const e = pdLive(S.src) ? S.src : null;
  if (!e) return true;
  const [mx, my] = pd2AcMao(e);
  if (S.fase === 'vai') {
    const nx = S.x + S.vx * dt, ny = S.y + S.vy * dt;
    if (solidAt(Math.floor(nx / T), Math.floor(ny / T)) || Math.hypot(nx - S.x0, ny - S.y0) > S.max) { S.fase = 'volta'; e.state = 'recolhe'; burst(S.x, S.y, 4, '#8a8070', 40, 200, 0.3); sfx.pdPuxa(Math.max(0.3, pdNear(e))); return false; }
    S.x = nx; S.y = ny;
    if (pdHeroIn(S.x, S.y, 4)) {
      const front = Math.sign(S.x - (pl.x + pl.w / 2)) === pl.facing || Math.abs(S.x - pl.x - pl.w / 2) < 2;
      if (pl.shieldK >= 0.6 && front) { S.fase = 'volta'; e.state = 'recolhe'; sfx.block(); burst(S.x, S.y, 8, '#ffd27a', 80, 120, 0.3); return false; }
      // pegou: o herói vem até perto do acorrentador
      S.fase = 'puxa'; e.state = 'puxa';
      const ddx = (e.x + e.w / 2 + e.facing * 16) - (pl.x + pl.w / 2), ddy = (e.y + e.h - pl.h) - pl.y;
      pl.vx = clamp(ddx * 3, -340, 340); pl.vy = Math.min(-120, ddy * 3 - 80); pl.onGround = false; pl.stunT = Math.max(pl.stunT, 0.35); pl.climb = false;
      hurtPlayer(Math.round(e.dmg * 0.35), S.x, null, true);
      pl.vx = clamp(ddx * 3, -340, 340); pl.vy = Math.min(-120, ddy * 3 - 80); pl.stunT = Math.max(pl.stunT, 0.35);   // o golpe empurra; o gancho manda
      sfx.pdGanchoPega(1);
      return false;
    }
    return false;
  }
  if (S.fase === 'puxa') { S.x = pl.x + pl.w / 2; S.y = pl.y + 8; S.pt = (S.pt || 0) + dt; if (S.pt > 0.3) S.fase = 'volta'; return false; }
  // volta: na recolhida errada ele fica parado (0,8 s); na puxada, rápido
  const d = Math.hypot(mx - S.x, my - S.y), sp = e.state === 'recolhe' ? 140 : 420;
  if (d < 6) { e.gancho = null; return true; }
  S.x += (mx - S.x) / d * sp * dt; S.y += (my - S.y) / d * sp * dt;
  return false;
};

/* ---------- golpes, mortes, nascimento ---------- */
{ const _hit = hitEnemy; hitEnemy = function (e, dir, mult = 1, melee = false) {
  if (e && e.type === 'acorrentador' && e.state === 'recolhe') mult = (mult || 1) * 1.3;   // pego de calças curtas
  const r = _hit(e, dir, mult, melee);
  if (!e || e.dead || !PD2_TYPES.includes(e.type)) return r;
  if (e.type === 'gigante') { e.stun = 0; e.vx = 0; }
  else if (e.type === 'cria' && e.state === 'agacha' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.6); }
  else if (e.type === 'pdSerpe' && e.stun > 0 && (e.state === 'incha' || e.state === 'recua')) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.9); }
  else if (e.type === 'lamento' && e.stun > 0 && e.state === 'inspira') { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 1); }
  else if (e.type === 'acorrentador') { if (e.state === 'mira' && e.stun > 0) { e.state = 'walk'; e.atkCD = Math.max(e.atkCD, 0.8); } if (e.state === 'ergue') e.stun = 0; }
  return r;
}; }
{ const _k = killEnemy; killEnemy = function (e) {
  const r = _k(e);
  if (!PD2_TYPES.includes(e.type)) return r;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, v = Math.max(0.3, pdNear(e, 300));
  if (e.type === 'gigante') { burst(cx, e.y + e.h - 6, 22, '#603a26', 90, 300, 0.9); pdSparks(cx, e.y + e.h - 10, 10, ['#ffcc4a', '#fff0b0'], 60, -20, 0.9); sfx.pdGigMorre(v); shake(3); }
  else if (e.type === 'lamento') { pdSparks(cx, cy, 16, ['#b08aff', '#c8a8ff', '#ffffff'], 40, -30, 0.9); sfx.pdLamentoMorre(v); }
  else if (e.type === 'pdSerpe') { burst(e.homeX, e.baseY, 8, '#24401a', 50, 200, 0.6); sfx.pdMorre(v); }
  else if (e.type === 'cria') sfx.pdGane(v);
  else sfx.pdMorre(v);
  return r;
}; }
{ const _sp = spawnEnemy; spawnEnemy = function (type, px, py, zone) {
  const e = _sp(type, px, py, zone);
  if (!e || !PD2_TYPES.includes(type)) return e;
  if (!ET[type].fly) for (let k = 0; k < 3 && rectSolid(e.x, e.y, e.w, e.h); k++) e.y -= T;
  e.atkCD = 0.8 + Math.random() * 0.6; e.homeX = e.x + e.w / 2; e.homeY = e.y + e.h / 2; e.state = 'walk';
  if (type === 'pdSerpe') {
    // a base é o chão (ou a fenda) debaixo da cabeça; sem chão perto, ela fica onde nasceu
    const fr = pdFloorRow(e.homeX, e.y + e.h); e.baseY = fr >= 0 ? fr * T : e.y + e.h + 2 * T;
    e.y = Math.min(e.y, e.baseY - 3 * T);
  }
  if (type === 'cria' && !pdGrupoSpawn) {
    pdGrupoSpawn = true;
    try { const x = px + (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 12); if (!rectSolid(x, py, e.w, e.h)) spawnEnemy('cria', x, py, zone); } finally { pdGrupoSpawn = false; }
  }
  return e;
}; }
{ const _nw = newWorld; newWorld = function (sd, sv) { pd2Tables(); return _nw(sd, sv); }; }

// o gancho na corrente (com a luz) e a linha tracejada da mira por cima do escuro
HOOK.drawWorld.push((cx, cy) => {
  for (const S of pdTiros) {
    if (S.kind !== 'gancho' || !pdLive(S.src)) continue;
    const [mx, my] = pd2AcMao(S.src);
    pd1Corrente(mx - cx, my - cy, S.x - cx, S.y - cy);
    pd2Gancho(S.x - cx, S.y - cy, Math.atan2(S.y - my, S.x - mx), false);
  }
});
HOOK.drawTop.push((cx, cy) => {
  const blink = Math.floor(gameTime * 14) % 2;
  for (const e of enemies) {
    if (e.dead || e.type !== 'acorrentador' || e.state !== 'mira') continue;
    const [mx, my] = pd2AcMao(e), lock = e.stateT <= 0.15, L = Math.hypot(e.alvoX - mx, e.alvoY - my), n = Math.floor(L / 4);
    lc.globalAlpha = lock && blink ? 0.45 : 0.75; lc.fillStyle = lock ? '#ffffff' : PD_COL.aviso;
    const off = Math.floor(gameTime * 20) % 2;
    for (let i = off; i < n; i += 2) { const t = i / n; lc.fillRect(Math.round(mx + (e.alvoX - mx) * t - cx), Math.round(my + (e.alvoY - my) * t - cy), 1, 1); }
  }
  lc.globalAlpha = 1;
});
{ const _pl = propLights; propLights = function (addL, x0, y0, w, h) {
  _pl(addL, x0, y0, w, h);
  for (const e of enemies) if (!e.dead && (e.type === 'lamento' || (e.type === 'pdSerpe' && e.state === 'incha') || (e.type === 'gigante' && e.state === 'ergue'))) addL(e.x + e.w / 2, e.y + e.h / 2, e.type === 'lamento' ? 0.25 : 0.3);
}; }

Object.assign(sfx, {
  pdRosna(v = 1) { tone(90, 0.4, 'sawtooth', 0.03 * v, 20); noise(0.4, 0.04 * v, 300, 'bandpass', 0, 3); },
  pdBote(v = 1) { noise(0.15, 0.05 * v, 900, 'bandpass'); tone(260, 0.12, 'sawtooth', 0.02 * v, -80); },
  pdGane(v = 1) { tone(900, 0.35, 'sine', 0.03 * v, -500); },
  pdGigErgue(v = 1) { tone(60, 1.0, 'sawtooth', 0.04 * v, 30); noise(1.0, 0.04 * v, 400, 'bandpass', 0, 2); for (let k = 0; k < 4; k++) tone(700 + k * 90, 0.05, 'square', 0.006 * v, 0, 0.2 + k * 0.15); },
  pdGigSoco(v = 1) { noise(0.5, 0.2 * v, 350, 'lowpass'); tone(45, 0.6, 'sine', 0.15 * v, -20); noise(0.1, 0.06 * v, 2600, 'highpass'); },
  pdGigMorre(v = 1) { tone(55, 1.4, 'sawtooth', 0.05 * v, -20); noise(1.2, 0.1 * v, 400, 'lowpass'); for (let k = 0; k < 5; k++) tone(800 - k * 80, 0.08, 'square', 0.006 * v, 0, 0.3 + k * 0.12); },
  pdIncha(v = 1) { noise(0.6, 0.04 * v, 500, 'bandpass', 0, 4); tone(180, 0.6, 'sine', 0.02 * v, 120); },
  pdCuspe(v = 1) { noise(0.18, 0.07 * v, 1800, 'bandpass', 0, 1.5); },
  pdChia(v = 1) { noise(0.5, 0.03 * v, 4000, 'highpass'); },
  pdSibilo(v = 1) { noise(0.45, 0.05 * v, 5000, 'bandpass', 0, 3); },
  pdSerpeMorde(v = 1) { noise(0.08, 0.06 * v, 1500, 'bandpass'); tone(400, 0.08, 'square', 0.015 * v, -200); },
  pdSussurro(v = 1) { noise(0.8, 0.03 * v, 2200, 'bandpass', 0, 6); tone(330, 0.8, 'sine', 0.012 * v, 60); tone(495, 0.8, 'sine', 0.008 * v, 50, 0.1); },
  pdGemido(v = 1) { tone(280, 0.9, 'sine', 0.03 * v, -90); tone(420, 0.8, 'triangle', 0.012 * v, -140, 0.05); },
  pdLamentoMorre(v = 1) { tone(520, 1.2, 'sine', 0.025 * v, -380); noise(1, 0.02 * v, 1800, 'bandpass', 0, 4); },
  pdGanchoPega(v = 1) { tone(1500, 0.06, 'square', 0.02 * v, -300); noise(0.12, 0.06 * v, 1200, 'bandpass'); for (let k = 0; k < 5; k++) tone(1100 + Math.random() * 500, 0.03, 'square', 0.008 * v, 0, 0.05 + k * 0.05); }
});
