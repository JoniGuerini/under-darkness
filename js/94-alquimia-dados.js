'use strict';

/* ================= alquimia: ervas, frascos, poções e elixires (os dados) =================
   A Marta deixou de ser curandeira e virou alquimista e herborista (js/96-alquimista.js). Este arquivo tem só os dados,
   para a wiki ver também:
   - as 5 ervas, uma por camada, que nascem no mundo como plantas de um bloco (ids de bloco 118 a 122): Sanguinária na
     superfície, Lírio-das-grutas nas Cavernas, Losna-da-cripta na Catedral, Flor-de-geada no Gelo e Raiz-de-brasa na
     Mina. Colhe com a picareta (um golpe) ou com E perto dela; voltam a nascer com o tempo (js/95-alquimia-uso.js);
   - o Frasco de Vidro (a Marta vende) e as poções e elixires que ela prepara: `ALQ` (o que cada um faz) e
     `ALQ_RECIPES` (o que vai em cada um e quanto tempo leva no alambique);
   - os desenhos das plantas (12x12, nas rampas de 6 tons com luz de cima à esquerda) e dos ícones (13x13).
   O plantio das ervas embrulha `buildCathedral` (depois do 87-mundo-largo) e guarda os lugares em `HERB_SPOTS`.
   Carrega depois do 87-mundo-largo (a wiki também carrega). */

/* ---- as ervas no mundo: ids de bloco, uma por camada ---- */
const HB_SANGUE = 118, HB_LIRIO = 119, HB_LOSNA = 120, HB_GEADA = 121, HB_BRASA = 122;
const HERBS = [
  { t: HB_SANGUE, id: 'erva_sangue', camada: 0 },
  { t: HB_LIRIO, id: 'lirio_gruta', camada: 1 },
  { t: HB_LOSNA, id: 'losna', camada: 2 },
  { t: HB_GEADA, id: 'flor_geada', camada: 3 },
  { t: HB_BRASA, id: 'raiz_brasa', camada: 4 }
];
const HERB_OF = {}; for (const h of HERBS) HERB_OF[h.t] = h;
const isHerb = t => !!HERB_OF[t];
// quantas nascem em cada camada num mundo do tamanho original (multiplicado por WSC); mínimo de blocos entre duas
const HERB_N = [16, 36, 30, 30, 30], HERB_GAP = 4;
let HERB_SPOTS = [];   // [índice do bloco, id do bloco] de cada erva plantada na geração

/* ---- itens ---- */
Object.assign(ITEMS, {
  erva_sangue: { name: 'Sanguinária', rar: 0, stack: 99, icon: 'erva_sangue', desc: 'Folhas de nervura vermelha e bagas que mancham os dedos. Cresce no capim da superfície. Material de alquimia.' },
  lirio_gruta: { name: 'Lírio-das-grutas', rar: 0, stack: 99, icon: 'lirio_gruta', desc: 'Sinos azuis que brilham de leve no escuro das Cavernas. Material de alquimia.' },
  losna: { name: 'Losna-da-cripta', rar: 1, stack: 99, icon: 'losna', desc: 'Erva prateada e amarga que brota entre as lajes da Catedral. Material de alquimia.' },
  flor_geada: { name: 'Flor-de-geada', rar: 1, stack: 99, icon: 'flor_geada', desc: 'Pétalas de gelo que não derretem na mão. Só abre nas Cavernas de Gelo. Material de alquimia.' },
  raiz_brasa: { name: 'Raiz-de-brasa', rar: 2, stack: 99, icon: 'raiz_brasa', desc: 'Raiz retorcida com veios em brasa, quente ao toque. Nasce no chão da Mina. Material de alquimia.' },
  frasco: { name: 'Frasco de Vidro', rar: 0, stack: 99, icon: 'frasco', desc: 'Vidro soprado com rolha de cortiça. Toda poção começa num desses. A Marta vende.' }
});

// o que cada poção e elixir faz. kind: life (cura ao longo de 5 s), mana (devolve mana em 2 s) ou elixir (dura `t` s)
const ALQ = {
  pocao: { kind: 'life', heal: 12, liq: '#c42a36', shape: 'round' },
  pocao_maior: { kind: 'life', heal: 24, liq: '#d81c3c', shape: 'big' },
  pocao_superior: { kind: 'life', heal: 40, liq: '#ee3458', shape: 'big', gold: 1 },
  pocao_mana: { kind: 'mana', mana: 12, liq: '#2a5ad8', shape: 'vial' },
  pocao_mana_maior: { kind: 'mana', mana: 25, liq: '#5a44e8', shape: 'vial', gold: 1 },
  // cada elixir vem de um bicho e faz o que combina com ele; `res` = resistência a um tipo de dano (js/101-tipos-dano.js)
  elixir_pedra: { kind: 'elixir', t: 300, liq: '#8a7a54', fx: '+4 de defesa', nome: 'Couraça' },
  elixir_peconha: { kind: 'elixir', t: 300, liq: '#7ac02a', fx: 'golpes envenenam', nome: 'Peçonha' },
  elixir_regen: { kind: 'elixir', t: 300, liq: '#3ab84a', fx: '+0,5 de vida por segundo', nome: 'Gosma' },
  elixir_antidoto: { kind: 'elixir', t: 300, liq: '#6a8a2a', fx: '-50% de dano de veneno', nome: 'Antídoto', res: { veneno: 0.5 } },
  elixir_espectral: { kind: 'elixir', t: 300, liq: '#a8d0e8', fx: '+15% de esquiva', nome: 'Espectral' },
  elixir_carnical: { kind: 'elixir', t: 300, liq: '#8a1a24', fx: '6% de roubo de vida', nome: 'Carniçal' },
  elixir_clareza: { kind: 'elixir', t: 300, liq: '#8a3ad8', fx: 'mana volta duas vezes mais rápido, +20% de dano de feitiço', nome: 'Profano' },
  elixir_geada: { kind: 'elixir', t: 300, liq: '#7ad0f0', fx: '-50% de dano de frio, sem lentidão do gelo', nome: 'Geada', res: { frio: 0.5 } },
  elixir_furia: { kind: 'elixir', t: 300, liq: '#d8481a', fx: '+20% de dano', nome: 'Lobo' },
  elixir_vida: { kind: 'elixir', t: 300, liq: '#e8e0d0', fx: '+8 de vida máxima', nome: 'Yeti' },
  elixir_brasa: { kind: 'elixir', t: 300, liq: '#f0901a', fx: '-50% de dano de fogo e de explosões', nome: 'Fuligem', res: { fogo: 0.5 } },
  elixir_polvora: { kind: 'elixir', t: 300, liq: '#5a5050', fx: '+15% de velocidade de ataque', nome: 'Pólvora' }
};
ITEMS.pocao.desc = 'Recupera 12 de vida ao longo de 5 segundos.';
Object.assign(ITEMS, {
  pocao_maior: { name: 'Poção de Vida Maior', rar: 1, stack: 30, use: true, icon: 'pocao_maior', desc: 'Recupera 24 de vida ao longo de 5 segundos.' },
  pocao_superior: { name: 'Poção de Vida Superior', rar: 2, stack: 30, use: true, icon: 'pocao_superior', desc: 'Recupera 40 de vida ao longo de 5 segundos.' },
  pocao_mana: { name: 'Poção de Mana', rar: 0, stack: 30, use: true, icon: 'pocao_mana', desc: 'Devolve 12 de mana em 2 segundos.' },
  pocao_mana_maior: { name: 'Poção de Mana Maior', rar: 1, stack: 30, use: true, icon: 'pocao_mana_maior', desc: 'Devolve 25 de mana em 2 segundos.' },
  elixir_pedra: { name: 'Elixir da Couraça', rar: 1, stack: 20, use: true, icon: 'elixir_pedra', desc: 'Placas de quitina do besouro moídas no óleo. Por 5 minutos: +4 de defesa.' },
  elixir_peconha: { name: 'Elixir da Peçonha', rar: 1, stack: 20, use: true, icon: 'elixir_peconha', desc: 'Peçonha de aranha que escorre pela lâmina. Por 5 minutos: golpes corpo a corpo envenenam o inimigo por 4 segundos.' },
  elixir_regen: { name: 'Elixir da Gosma', rar: 1, stack: 20, use: true, icon: 'elixir_regen', desc: 'Gel de gosma, que sempre volta a se juntar. Por 5 minutos: +0,5 de vida por segundo (depois de 4 segundos sem levar dano).' },
  elixir_antidoto: { name: 'Antídoto de Carne Podre', rar: 1, stack: 20, use: true, icon: 'elixir_antidoto', desc: 'Quem come o que o zumbi come aguenta o vômito dele. Por 5 minutos: metade do dano de veneno (vômito, aranhas, centopeias, sapos, esporos).' },
  elixir_espectral: { name: 'Elixir Espectral', rar: 2, stack: 20, use: true, icon: 'elixir_espectral', desc: 'Ectoplasma frio que deixa o corpo meio fora deste mundo. Por 5 minutos: +15% de esquiva.' },
  elixir_carnical: { name: 'Elixir do Carniçal', rar: 2, stack: 20, use: true, icon: 'elixir_carnical', desc: 'A fome do carniçal. Por 5 minutos: 6% do dano dos golpes volta como vida.' },
  elixir_clareza: { name: 'Elixir Profano', rar: 2, stack: 20, use: true, icon: 'elixir_clareza', desc: 'Tinta das páginas do acólito dissolvida. Por 5 minutos: a mana volta duas vezes mais rápido e os feitiços dão +20% de dano.' },
  elixir_geada: { name: 'Elixir da Geada', rar: 2, stack: 20, use: true, icon: 'elixir_geada', desc: 'Essência do espírito da nevasca. Por 5 minutos: metade do dano de frio e o gelo não deixa o herói lento.' },
  elixir_furia: { name: 'Elixir do Lobo', rar: 2, stack: 20, use: true, icon: 'elixir_furia', desc: 'Presas de lobo da geada fervidas. Por 5 minutos: +20% de dano.' },
  elixir_vida: { name: 'Elixir do Yeti', rar: 2, stack: 20, use: true, icon: 'elixir_vida', desc: 'Pelo de yeti curtido no álcool. Por 5 minutos: +8 de vida máxima.' },
  elixir_brasa: { name: 'Elixir de Fuligem', rar: 2, stack: 20, use: true, icon: 'elixir_brasa', desc: 'Óleo de lampião assombrado com raiz-de-brasa. Por 5 minutos: metade do dano de fogo e de explosões.' },
  elixir_polvora: { name: 'Elixir de Pólvora', rar: 2, stack: 20, use: true, icon: 'elixir_polvora', desc: 'Pólvora goblin num gole que arde. Por 5 minutos: +15% de velocidade de ataque.' }
});
const isAlq = id => !!ALQ[id];

/* ---- as receitas do alambique: grupo, resultado, reagentes [id, quantidade], segundos por frasco ---- */
const ALQ_GROUPS = [['vida', 'Poções de vida'], ['mana', 'Poções de mana'], ['el_cv', 'Elixires das Cavernas'], ['el_ct', 'Elixires da Catedral'], ['el_ic', 'Elixires do Gelo'], ['el_mn', 'Elixires da Mina']];
const ALQ_RECIPES = [
  { g: 'vida', id: 'pocao', t: 2, r: [['erva_sangue', 2], ['frasco', 1]] },
  { g: 'vida', id: 'pocao_maior', t: 3, r: [['erva_sangue', 2], ['lirio_gruta', 1], ['gel', 1], ['frasco', 1]] },
  { g: 'vida', id: 'pocao_superior', t: 4, r: [['erva_sangue', 3], ['flor_geada', 1], ['frasco', 1]] },
  { g: 'mana', id: 'pocao_mana', t: 2, r: [['lirio_gruta', 2], ['frasco', 1]] },
  { g: 'mana', id: 'pocao_mana_maior', t: 3, r: [['lirio_gruta', 2], ['losna', 1], ['esporo', 1], ['frasco', 1]] },
  { g: 'el_cv', id: 'elixir_pedra', t: 4, r: [['quitina', 2], ['lirio_gruta', 1], ['frasco', 1]] },
  { g: 'el_cv', id: 'elixir_peconha', t: 4, r: [['glandula', 2], ['lirio_gruta', 1], ['frasco', 1]] },
  { g: 'el_cv', id: 'elixir_regen', t: 4, r: [['gel', 3], ['erva_sangue', 1], ['frasco', 1]] },
  { g: 'el_ct', id: 'elixir_antidoto', t: 4, r: [['carne', 3], ['losna', 1], ['frasco', 1]] },
  { g: 'el_ct', id: 'elixir_espectral', t: 5, r: [['ectoplasma', 2], ['losna', 1], ['frasco', 1]] },
  { g: 'el_ct', id: 'elixir_carnical', t: 5, r: [['garra_carnical', 2], ['losna', 1], ['frasco', 1]] },
  { g: 'el_ct', id: 'elixir_clareza', t: 5, r: [['pagina_profana', 2], ['losna', 1], ['frasco', 1]] },
  { g: 'el_ic', id: 'elixir_geada', t: 5, r: [['essencia_gelida', 2], ['flor_geada', 1], ['frasco', 1]] },
  { g: 'el_ic', id: 'elixir_furia', t: 5, r: [['presa_lobo', 2], ['flor_geada', 1], ['frasco', 1]] },
  { g: 'el_ic', id: 'elixir_vida', t: 5, r: [['pelo_yeti', 2], ['flor_geada', 1], ['frasco', 1]] },
  { g: 'el_mn', id: 'elixir_brasa', t: 6, r: [['oleo_lampiao', 2], ['raiz_brasa', 1], ['frasco', 1]] },
  { g: 'el_mn', id: 'elixir_polvora', t: 6, r: [['polvora', 2], ['raiz_brasa', 1], ['frasco', 1]] }
].filter(rc => rc.r.every(([id]) => ITEMS[id]));

/* ================= desenhos ================= */
// rampas de 6 tons, escuro para claro
const ALQ_RAMP = {
  folha: ['#0e1c0b', '#1b3315', '#2b4e1f', '#3e6a2a', '#578838', '#76a64c'],
  sangue: ['#2a0608', '#4c0c10', '#78141a', '#a41e24', '#cc3a3a', '#ee6c64'],
  caule: ['#1e241a', '#323c2c', '#4c5842', '#68765a', '#8a9878', '#b0bc9c'],
  lirio: ['#0c1a32', '#18325c', '#2a528c', '#4a7ebe', '#80b2e6', '#cceaff'],
  folhaGruta: ['#071614', '#0f2824', '#1a3e38', '#285650', '#3a706a', '#548c86'],
  losna: ['#191f18', '#2c382a', '#475545', '#687862', '#90a088', '#bccab0'],
  florLosna: ['#4a3a08', '#7a6010', '#ac8818', '#d6b030', '#eed25e', '#fff0a2'],
  gelo: ['#122238', '#264464', '#46749c', '#78aecc', '#b2def2', '#f0fcff'],
  geadaMiolo: ['#2a1c48', '#463272', '#684e9e', '#9076c4', '#bca6e4', '#e8dcff'],
  raiz: ['#120705', '#200e09', '#36180e', '#4e2414', '#66321c', '#804226'],
  brasa: ['#5a1004', '#9a2a06', '#d4500e', '#f6881a', '#ffc24a', '#fff0a2']
};
const ALQ_PK = {}; for (const k in ALQ_RAMP) ALQ_PK[k] = ALQ_RAMP[k].map(h => ph(h));
const alqLv = (R, v) => R[v < 0 ? 0 : v > R.length - 1 ? R.length - 1 : v | 0];

/* uma planta de 12x12 desenhada letra a letra; cada letra é [rampa, tom]. Grão por pixel, luz de cima à esquerda
   (borda que encosta no ar à esquerda/em cima clareia, à direita/embaixo escurece) e contorno no tom mais escuro */
function herbSprite(rows, map, s, rimRamp) {
  const at = (x, y) => x >= 0 && y >= 0 && x < T && y < T && rows[y][x] !== '.';
  const a = new Uint32Array(T * T);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const M = map[rows[y][x]]; if (!M) continue;
    let v = M[1] + (hash2(x, y, s) - 0.5) * 0.8;
    if (!at(x - 1, y) || !at(x, y - 1)) v += 0.6; if (!at(x + 1, y) || !at(x, y + 1)) v -= 0.5;
    a[y * T + x] = alqLv(ALQ_PK[M[0]], v);
  }
  const rim = ALQ_PK[rimRamp][0], b = a.slice();
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = y * T + x; if (b[k]) continue; if ((x > 0 && b[k - 1]) || (x < T - 1 && b[k + 1]) || (y > 0 && b[k - T])) a[k] = rim; }
  return a;
}
const alqFlip = a => { const b = new Uint32Array(T * T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) b[y * T + x] = a[y * T + T - 1 - x]; return b; };

// Sanguinária: roseta de folhas largas de nervura vermelha e um talo com cachos de bagas cor de sangue
const SPR_SANGUE = [herbSprite([
  "............",
  "....Rr......",
  "...RrrR.....",
  "....rs..Rr..",
  ".....s.Rrr..",
  "..Rr.s.s.r..",
  "..rr.ss.....",
  "......s.....",
  ".LG...s..GL.",
  "LGgv..s.vgGL",
  ".LGgvGsGvgG.",
  "..gGGgsgGg.."], { R: ['sangue', 4.6], r: ['sangue', 2.8], s: ['caule', 2.4], L: ['folha', 4.4], G: ['folha', 3.2], g: ['folha', 2], v: ['sangue', 2.2] }, 3302, 'folha'),
herbSprite([
  "............",
  "......rR....",
  ".Rr..RrrR...",
  "Rrr...sr....",
  ".rs...s.....",
  "..s..s..Rr..",
  "...s.s.Rrr..",
  "....ss.s.r..",
  ".GL..s.s....",
  "LGgv.sss.vGL",
  ".gGgvGsGvgGg",
  "..gGGgsgGg.."], { R: ['sangue', 4.6], r: ['sangue', 2.8], s: ['caule', 2.4], L: ['folha', 4.4], G: ['folha', 3.2], g: ['folha', 2], v: ['sangue', 2.2] }, 3303, 'folha')];
// Lírio-das-grutas: talo em arco com sinos azuis pendurados, estames que brilham, folhas de fita
const LIRIO_MAP = { s: ['caule', 2.4], S: ['caule', 3.6], B: ['lirio', 4.4], b: ['lirio', 3], h: ['lirio', 5.6], f: ['folhaGruta', 2.6], F: ['folhaGruta', 4] };
const SPR_LIRIO = [herbSprite([
  "............",
  "....sSSs....",
  "...s....s...",
  "..s......s..",
  "..s......B..",
  ".bBb....bBb.",
  ".bBb...bbBbb",
  "bbBbb...h.h.",
  ".h.h..s.....",
  "..f...s..F..",
  "..fF..s.Ff..",
  "...fFfsfF..."], LIRIO_MAP, 3312, 'folhaGruta'),
herbSprite([
  "............",
  "......sSs...",
  ".....s...s..",
  "....s.....B.",
  "...s.....bBb",
  "..sB.....bBb",
  ".bBbb...bbBb",
  ".bBbb....h.h",
  "bbBbbb......",
  ".h.h.s...F..",
  "..fF.s..Ff..",
  "...fFsfFf..."], LIRIO_MAP, 3313, 'folhaGruta')];
// Losna-da-cripta: hastes finas e prateadas, folhas recortadas e tufos de florzinhas amarelas
const LOSNA_MAP = { l: ['losna', 2.6], L: ['losna', 4.2], y: ['florLosna', 3], Y: ['florLosna', 5] };
const SPR_LOSNA = [herbSprite([
  "...y....Y...",
  "..yYy..yYy..",
  "...l....l...",
  ".y.lL..Ll.Y.",
  "yYy.l..l.yYy",
  ".lL.l.Ll.Ll.",
  "..l.lLl..l..",
  "..lL.l..Ll..",
  "...l.l.Ll...",
  ".Ll.lll.....",
  "..LlLlLlL...",
  ".lLlllllLl.."], LOSNA_MAP, 3322, 'losna'),
herbSprite([
  ".....Y......",
  "....yYy..y..",
  ".Y...l..yYy.",
  "yYy..lL..l..",
  ".l.L.l..Ll..",
  ".lL..l.l....",
  "..l..lLl.Y..",
  "..Ll.l.l.l..",
  "...l.lL.Ll..",
  ".Ll.lll.l...",
  "..LlLlLlL...",
  ".lLlllllLl.."], LOSNA_MAP, 3323, 'losna')];
// Flor-de-geada: uma estrela de pétalas de gelo com miolo violeta, no alto de um talo claro
const GEADA_MAP = { I: ['gelo', 5], i: ['gelo', 3.4], c: ['geadaMiolo', 3.4], C: ['geadaMiolo', 5.2], s: ['gelo', 2.6], e: ['gelo', 2.2], E: ['gelo', 3.8] };
const SPR_GEADA = [herbSprite([
  "......I.....",
  "..I...i...I.",
  "...Ii.i.iI..",
  "....iIcIi...",
  ".IiiIcCcIiiI",
  "....iIcIi...",
  "...Ii.s.iI..",
  "..I...s...I.",
  "......s.....",
  "..eE..s.Ee..",
  "...eEes.eE..",
  "....eesee..."], GEADA_MAP, 3332, 'gelo'),
herbSprite([
  ".....I......",
  ".I...i...I..",
  "..Ii.i.iI...",
  "...iIcIi....",
  "IiiIcCcIiiI.",
  "...iIcIi....",
  "..Ii.s.iI.I.",
  ".I...s...iIi",
  ".....s....s.",
  "..eE.s...Ee.",
  "...eEs.sEe..",
  "....eesee..."], GEADA_MAP, 3333, 'gelo')];
// Raiz-de-brasa: raiz retorcida em arco saindo do chão, rachada de brasa, com um broto aceso na ponta
const BRASA_MAP = { r: ['raiz', 2.4], R: ['raiz', 4], k: ['brasa', 3.2], y: ['brasa', 3.8], Y: ['brasa', 5.4] };
const SPR_BRASA = [herbSprite([
  "......Y.....",
  ".....yYy....",
  ".....rkr....",
  "...rRkRrr...",
  "..rRkr.rRr..",
  "..rkR...kRr.",
  ".rRk....rkR.",
  ".rkR.....rr.",
  ".rRk....rkR.",
  "rRkr....rRk.",
  "rkRr...rrkr.",
  "rrrrr..rrrr."], BRASA_MAP, 3342, 'raiz'),
herbSprite([
  "............",
  "....Y.......",
  "...yYy......",
  "...rkrR.....",
  "..rRk.rRr...",
  "..rk...kRr..",
  ".rRk....rRr.",
  ".rkR.....kR.",
  "..rR.....rk.",
  "..Rkr...rRk.",
  ".rrkRr.rRkr.",
  "rrrrrr.rrrrr"], BRASA_MAP, 3343, 'raiz')];

const HERB_ART = { [HB_SANGUE]: SPR_SANGUE, [HB_LIRIO]: SPR_LIRIO, [HB_LOSNA]: SPR_LOSNA, [HB_GEADA]: SPR_GEADA, [HB_BRASA]: SPR_BRASA };
for (const h of HERBS) {
  const t = h.t, a = HERB_ART[t];
  DECO[t] = [a[0], a[1], alqFlip(a[0]), alqFlip(a[1])];
  DIG[t] = 0.04; BLOCK_DROP[t] = h.id;
  if (typeof CV_STANDS !== 'undefined') CV_STANDS[t] = 1;   // cai quando o chão debaixo some (56-caverna-mundo)
}
PCOL[HB_SANGUE] = '#a41e24'; PCOL[HB_LIRIO] = '#80b2e6'; PCOL[HB_LOSNA] = '#90a088'; PCOL[HB_GEADA] = '#b2def2'; PCOL[HB_BRASA] = '#f6881a';
EMIT[HB_LIRIO] = 0.3; EMIT[HB_BRASA] = 0.36; EMIT[HB_GEADA] = 0.18;

/* ---- ícones de 13x13 ---- */
// as ervas: a própria planta, sem o chão
function herbIcon(t) {
  const a = HERB_ART[t][0], c = mk(13, 13), x = c.getContext('2d'), d = x.createImageData(12, 12), u = new Uint32Array(d.data.buffer);
  u.set(a); x.putImageData(d, 0, 0);
  return c;
}
// frascos: letra a letra. c C rolha · n N gargalo · g vidro · L líquido · d líquido na sombra · h brilho · w W rótulo · o ouro · e vidro vazio
const FLASK = {
  round: [".....ccc.....", ".....CCC.....", ".....nNn.....", ".....nNn.....", "....gnNng....", "...gLLLLLg...", "..gLhLLLLLg..", "..gLhLLLLLg..", "..gLLLLLLLg..", "..gLLLLLLdg..", "...gLLLLdg...", "....ggggg....", "............."],
  big: ["....ccccc....", ".....CCC.....", ".....nNn.....", "....onNno....", "...gnnNnng...", "..gLLLLLLLg..", ".gLhLLLLLLLg.", ".gLhLLLLLLLg.", ".gLhLLLLLLLg.", ".gLLLLLLLLdg.", ".gLLLLLLLLdg.", "..gLLLLLLdg..", "...ggggggg..."],
  vial: [".....ccc.....", ".....CCC.....", ".....nNn.....", "....gnNng....", "....gLLLg....", "...gLLLLLg...", "...gLhLLLg...", "...gLhLLLg...", "...gLhLLLg...", "...gLLLLdg...", "...gLLLLdg...", "...gLLLLdg...", "....ggggg...."],
  elixir: [".....ccc.....", ".....CCC.....", ".....nNn.....", "...ggnNngg...", "..gLLLLLLLg..", "..gLhLLLLLg..", "..gLhwwwwLg..", "..gLhwWWwLg..", "..gLLwwwwLg..", "..gLLLLLLdg..", "..gLLLLLLdg..", "..gLLLLLLdg..", "...ggggggg..."],
  empty: [".....ccc.....", ".....CCC.....", ".....nNn.....", ".....nNn.....", "....gnNng....", "...geeeeeg...", "..geheeeeeg..", "..geheeeeeg..", "..geeeeeeeg..", "..geeeeeedg..", "...geeeedg...", "....ggggg....", "............."]
};
function flaskIcon(shape, liq, gold, seed) {
  const rows = FLASK[shape], c = mk(13, 13), x = c.getContext('2d');
  const L = liq ? heroRamp(liq) : null, G = heroRamp('#7a96a4'), K = heroRamp('#9a6a3a'), O = heroRamp('#d8a838'), W = heroRamp('#d8c49a');
  let top = -1; for (let j = 0; j < 13; j++) if (rows[j].includes('L')) { top = j; break; }
  for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) {
    const ch = rows[j][i]; if (ch === '.') continue;
    const gr = hash2(i, j, seed), q = gr < 0.14 ? -1 : gr > 0.9 ? 1 : 0;
    let col;
    if (ch === 'c') col = (gold ? O : K)[4 + (q > 0 ? 1 : 0)];
    else if (ch === 'C') col = (gold ? O : K)[2 + q];
    else if (ch === 'o') col = O[i < 6 ? 5 : 3];
    else if (ch === 'n') col = G[3];
    else if (ch === 'N') col = G[5];
    else if (ch === 'g') col = G[i < 6 ? 4 : i > 6 ? 1 : 3];
    else if (ch === 'e') col = G[j < 7 ? 1 : 0];
    else if (ch === 'h') col = liq ? mixHex(L[5], '#ffffff', 0.55) : G[5];
    else if (ch === 'd') col = L ? L[1] : G[0];
    else if (ch === 'w') col = W[3 + q];
    else if (ch === 'W') col = L[1];
    else col = L[clamp((j === top ? 5 : j <= top + 1 ? 4 : 3) + q - (i > 7 ? 1 : 0), 0, 5)];
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
  }
  return c;
}
const ALQ_ICON = id => {
  const h = HERBS.find(q => q.id === id); if (h) return herbIcon(h.t);
  if (id === 'frasco') return flaskIcon('empty', null, 0, 77);
  const a = ALQ[id]; if (!a) return null;
  return flaskIcon(a.kind === 'elixir' ? 'elixir' : a.shape, a.liq, a.gold, 70 + Object.keys(ALQ).indexOf(id));
};
{
  const _makeIcon = makeIcon;
  makeIcon = function (id) {
    const src = ALQ_ICON(id); if (!src) return _makeIcon(id);
    const o = outlined(src); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}

/* ================= plantio: depois de todo o mundo pronto (e do 87 ligar os bolsões) ================= */
// em que camada fica uma linha: 0 superfície, 1 cavernas, 2 catedral, 3 gelo, 4 mina
function alqLayer(y) {
  if (typeof CB_S0 !== 'undefined' && y < CB_S0) return y < surf[SPX] + 6 ? 0 : 1;
  if (typeof IC_S0 !== 'undefined' && typeof GELO !== 'undefined' && GELO && y < IC_S0) return 2;
  if (typeof MN_S0 !== 'undefined' && typeof MINA !== 'undefined' && MINA && y < MN_S0) return 3;
  return typeof MN_S0 !== 'undefined' && typeof MINA !== 'undefined' && MINA ? 4 : 3;
}
function plantHerbs() {
  HERB_SPOTS = [];
  const s0 = (seed % 99991) + 4100, cover = new Set();
  // nada de erva atrás de objeto de cena, em sala de chefe ou no vilarejo
  if (typeof PROPS !== 'undefined') for (const p of PROPS) { const x0 = Math.floor(p.X / T), y0 = Math.floor(p.Y / T), x1 = Math.floor((p.X + p.w - 1) / T), y1 = Math.floor((p.Y + p.h - 1) / T); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cover.add(y * WW + wrapX(x)); }
  const hall = (x, y) => (typeof inTeiaHall === 'function' && inTeiaHall(x, y, -3)) || (typeof inYetiHall === 'function' && inYetiHall(x, y, -3)) ||
    (typeof inThroneHall === 'function' && inThroneHall(x, y, -3)) || (typeof inRgHall === 'function' && inRgHall(x, y, -3)) || inVillage(x, y);
  const cand = [[], [], [], [], []];
  for (let x = 0; x < WW; x++) {   // a superfície: capim, com ar em cima (tufos e flores podem dar lugar)
    const y = surf[x] - 1; if (y < 2 || tiles[(y + 1) * WW + x] !== GRASS) continue;
    const t = tiles[y * WW + x]; if ((t === AIR || t === TUFT || t === FLOWER) && tiles[(y - 1) * WW + x] === AIR && !hall(x, y)) cand[0].push(y * WW + x);
  }
  for (let y = surf[SPX] + 8; y < WH - 4; y++) for (let x = 0; x < WW; x++) {   // embaixo: chão firme de bloco cheio com dois de ar em cima
    const i = y * WW + x; if (tiles[i] !== AIR || tiles[i - WW] !== AIR) continue;
    const dn = tiles[i + WW]; if (!SOLID[dn] || !BLOCKY[dn] || dn === CHEST || cover.has(i) || cover.has(i - WW)) continue;
    if (y < surf[x] + 8 || hall(x, y)) continue;
    const L = alqLayer(y); if (L > 0) cand[L].push(i);
  }
  for (let L = 0; L < 5; L++) {
    const C = cand[L], want = Math.round(HERB_N[L] * (typeof WSC !== 'undefined' ? WSC : 1)); if (!C.length) continue;
    // sorteio pela semente (o mesmo mundo sempre tem as mesmas ervas), espalhadas pela camada inteira
    const key = i => hash2(i % WW, (i / WW) | 0, s0 + L), taken = [];
    C.sort((a, b) => key(a) - key(b));
    for (const i of C) {
      const x = i % WW, y = (i / WW) | 0;
      if (taken.some(j => Math.abs(wdx(j % WW - x)) < HERB_GAP && Math.abs(((j / WW) | 0) - y) < HERB_GAP)) continue;
      taken.push(i); if (taken.length >= want) break;
    }
    for (const i of taken) { tiles[i] = HERBS[L].t; HERB_SPOTS.push([i, HERBS[L].t]); }
  }
}
{ const _bc = buildCathedral; buildCathedral = function () { _bc(); try { plantHerbs(); } catch (err) { console.error(err); } }; }
