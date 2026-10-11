'use strict';

/* ================= xenita: o metal da Nave Caída (2026-10-11) =================
   Um metal por camada (102): a xenita é o da décima, a Nave Caída (240-249). Cristal verde-neon que veio no casco da
   nave e cresceu na rocha que a queda fundiu: translúcido, com o miolo escuro e um brilho fraco que pisca; funde na
   fornalha como os outros e pede 7 minérios por barra (a receita da fornalha, os preços e as lojas ficam no 245, que
   carrega depois da forja e do vilarejo).
   Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição da camada no registro 129: 19) e as
   9 peças; o peitoral de xenita dá luz 1 (o cristal acende). Também os materiais da camada (gosma verde, chip
   alienígena, olho de vigia, cristal de plasma, tanque de oxigênio) e as três bases que só caem lá (Pistola de Raio,
   Escudo de Disco, Capacete de Astronauta).
   Carrega logo depois do 197-ambrita, antes do 110-infernita: a bigorna mostra a xenita entre a ambrita e a infernita.
   Carrega antes do 240, então não usa os ids de bloco da camada (o 241 liga gosma_verde ao bloco de gosma: o item é
   daqui, o 241 só reaproveita). Carrega antes do 09/41 (sfx, HOOK): o raio da pistola se registra no
   DOMContentLoaded, quando todos os arquivos já rodaram. */

const XENITA_PAL = ['#0a3a1a', '#3ad44e', '#d4ffb0'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_xenita: { name: 'Minério de Xenita', rar: 3, stack: 99, icon: 'ore', ore: XENITA_PAL, desc: 'Cristais verdes que piscam dentro do vidro da cratera. Não são deste mundo.' },
  barra_xenita: { name: 'Barra de Xenita', rar: 3, stack: 99, icon: 'bar', ore: XENITA_PAL, desc: 'Fundida de 7 minérios de xenita. Vai para a bigorna do Grimaldo.' }
});
// pontas de cristal verde-neon saindo do vidro escuro, e uma barra translúcida com o miolo preto
ORE_ICONS.min_xenita = [[
  "....N.....",
  "...nNk.N..",
  "..kNWnkNn.",
  ".rkNnNkNkr",
  "rRrkNkrnkr",
  ".rrrkrrRr.",
  "..rrrrrr..",
  "....rr...."], { r: '#06120c', R: '#1e4a30', k: '#0a3a1a', n: '#20a03a', N: '#7dff3a', W: '#d4ffb0' }];
BAR_ICONS.barra_xenita = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgkgGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmkkmmmEE",
  "mmmkkmmGmmmE.",
  "dddddddddd..."], { T: '#b8ff8a', t: '#7dff3a', g: '#3ad44e', G: '#d4ffb0', W: '#f4fff0', k: '#06200e', F: '#2aa83a', m: '#167a2a', e: '#0e5020', E: '#0a3a1a', d: '#041a0a' }];

METALS.push({ id: 'xenita', name: 'Xenita', bar: 'barra_xenita', il: layerForgeIl('nave'),
  wp: { w: '#d4ffb0', W: '#7dff3a', l: '#20a03a', g: '#14202a', G: '#0a1018', h: '#101a14', p: '#3ad44e' },
  m: '#3ad44e', M: '#c8ffa0', body: { r: '#3ad44e', R: '#1a8a32', D: '#0e4a1e', b: '#06200e', B: '#b8ff8a' }, s: '#3ad44e', S: '#0e5020' });
FORGE_ILVL.push(layerForgeIl('nave'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre a ambrita e a infernita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 42, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 28, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 63, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 49, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 45, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 8, hp: 20, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 11, hp: 29, light: 1 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 5, spd: 0.058 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    if (pc === 'peitoral') o.desc += ' O cristal dentro do metal acende verde no escuro.';
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  nvGosma: [["....g.....", "...gWg....", "..gGGGg...", ".gGWGGGg..", "gGGGGgGGg.", "gGGgGGGGg.", ".gGGGGGdg.", "..ddddd..."], { g: '#2e7a0c', G: '#6cd422', W: '#c8ff7a', d: '#1a4a06' }],
  nvChip: [[".p.p.p.p..", "kkkkkkkkk.", "kcCkkgGkk.", "kkCccgkkk.", "kgkkCkkck.", "kGggCkcCk.", "kkkkkkkkk.", ".p.p.p.p.."], { k: '#1a1e2a', p: '#b8bcc8', c: '#1a8aa0', C: '#36f0ff', g: '#2e7a0c', G: '#7dff3a' }],
  nvOlho: [["..wwwww...", ".wWWrWWw..", "wWWyyyWWw.", "wrWyKKyWw.", "wWyyKKyrw.", "wWWyyyWWw.", ".wwWrWWw..", "..wwwww..."], { w: '#a8a090', W: '#f4f0e6', r: '#d83a3a', y: '#ffd23a', K: '#0c0a10' }],
  nvPlasma: [["....W.....", "...rWo....", "..rrWoo...", ".rrRWOoy..", ".gGgWYyy..", ".bBbWVvv..", "..bbWvv...", "...bbv...."], { W: '#ffffff', r: '#c02a2a', R: '#ff3b3b', o: '#c86a1a', O: '#ff9a2e', y: '#c8b41a', Y: '#ffe53a', g: '#2aa82a', G: '#5dff4a', b: '#1a6ad0', B: '#3aa8ff', v: '#6a2ad0', V: '#9a4dff' }],
  nvOxi: [["...rRr....", "...kkk....", "..sWSSs...", "..sWSSs...", "..sWcCs...", "..sWSSs...", "..sWSSs...", "..sssss..."], { r: '#a01a1a', R: '#ff4a3a', k: '#3a3e48', s: '#7a8090', S: '#c8ccd8', W: '#f4f6fc', c: '#1a8aa0', C: '#36f0ff' }]
});
Object.assign(ITEMS, {
  gosma_verde: Object.assign(ITEMS.gosma_verde || {}, { name: 'Gosma Verde', rar: 0, stack: 99, icon: 'nvGosma', desc: 'Gosma verde que escorre da nave. Gruda nos dedos e brilha fraco. A Marta faz poção com ela.' }),
  chip_alien: { name: 'Chip Alienígena', rar: 1, stack: 99, icon: 'nvChip', desc: 'Uma plaquinha preta com trilhas de luz. O Grimaldo e o Teodoro não entendem, mas querem.' },
  olho_vigia: { name: 'Olho de Vigia', rar: 1, stack: 99, icon: 'nvOlho', desc: 'O olho de um Olho Vigia, ainda úmido. Às vezes a pupila mexe. A Marta e a Aurélia compram.' },
  cristal_plasma: { name: 'Cristal de Plasma', rar: 3, stack: 99, icon: 'nvPlasma', desc: 'Um cristal com as seis cores do arco-íris, morno na mão. A Aurélia paga caro.' },
  oxigenio: { name: 'Tanque de Oxigênio', rar: 1, stack: 99, icon: 'nvOxi', desc: 'O tanque das costas de um astronauta, ainda chiando. O Grimaldo aproveita o metal.' }
});

/* ---------- as bases que só caem na Nave ---------- */
const NV_BASE_LVL = layerLo('nave');
Object.assign(ITEMS, {
  pistola_raio: { name: 'Pistola de Raio', slot: 'weapon', kind: 'staff', rar: 1, mana: 12, spellPct: 0.4, raio: true, pal: { wood: '#3a4050', gem: '#ff3ec8', metal: '#c8ccd8', grip: '#1a1e2a' }, desc: 'A arma dos Visitantes de capacete, comprida como um cajado. Cada golpe solta um raio rosa reto.' },
  escudo_disco: { name: 'Escudo de Disco', slot: 'shield', rar: 1, def: 3, parry: 0.4, pal: { o: '#14161c', W: '#3e4654', w: '#a8b0c0', m: '#c8f0ff', M: '#f4fcff' }, desc: 'Um disquinho voador inteiro, com a cúpula e as luzes da borda. A janela de aparo é larga.' },
  capacete_astronauta: { name: 'Capacete de Astronauta', slot: 'head', rar: 1, def: 7, light: 1, art: ["....wwww....", "..wwWWWWww..", ".wWvvvvvvWw.", ".wvVpvvcvvw.", ".wvvvvvvvvw.", ".wWvvvvvvWw.", "..sssssss..."], oy: -1, pal: { w: '#c8ccd8', W: '#f4f6fc', v: '#1a2a4a', V: '#e8fbff', p: '#ff3ec8', c: '#36f0ff', s: '#7a8090' }, desc: 'O capacete branco de um astronauta que caiu aqui faz tempo. O visor reflete o neon e acende um pouco.' }
});
Object.assign(BASE_INFO, { pistola_raio: [NV_BASE_LVL, 0.95], escudo_disco: [NV_BASE_LVL], capacete_astronauta: [NV_BASE_LVL] });
Object.assign(ITEM_G, { pistola_raio: 1, escudo_disco: 0, capacete_astronauta: 0 });
for (const id of ['pistola_raio', 'escudo_disco', 'capacete_astronauta']) ITEMS[id].g = ITEM_G[id];
ITEMS.pistola_raio.twoHand = true;

/* ---- os desenhos próprios: a pistola (em pé como o cajado, a mesma pega em 3.5, 18.5) e o escudo de disco ----
   pistola: P p rosa do emissor · W brilho · c C anéis ciano · k casco escuro · S s chapa prateada · g G bobina verde
            h H cabo · x ponteira */
const NV_RAIO_ROWS = [
  "..pPp..",
  ".pWWPp.",
  ".cPWPc.",
  "cCcPcCc",
  ".kSsSk.",
  ".cCcCc.",
  "..kSk..",
  ".cCcCc.",
  "..kSk..",
  "..kSk..",
  ".gGgGg.",
  "..kSk..",
  "kSSsSSk",
  "kSgGgsk",
  "kSgWgsk",
  "kSgGgsk",
  "kSSsSSk",
  ".kkSkk.",
  "...h...",
  "...H...",
  "...h...",
  "...H...",
  "..kSk..",
  "...x..."
];
const NV_RAIO_ICON = [
  ".pWWPp.",
  ".cPWPc.",
  "cCcPcCc",
  ".kSsSk.",
  ".cCcCc.",
  "..kSk..",
  ".gGgGg.",
  "kSSsSSk",
  "kSgWgsk",
  "kSSsSSk",
  ".kkSkk.",
  "...h...",
  "...H..."
];
const NV_RAIO_PAL = { p: '#c0208e', P: '#ff3ec8', W: '#ffe0f6', c: '#1a8aa0', C: '#36f0ff', k: '#14161c', S: '#c8ccd8', s: '#7a8090', g: '#2e7a0c', G: '#7dff3a', h: '#2e3440', H: '#1a1e2a', x: '#7a8090' };
// o escudo: a face é o disco visto de cima (borda escura, chapa prateada, luzes na borda, a cúpula branca no meio);
// de lado, o disco em pé com a cúpula saindo. L l luzes (rosa, ciano, amarelo)
const NV_DISCO_FACE = [
  "..ooo..",
  ".oLwYo.",
  "oWwWwCo",
  "oLwmwWo",
  "oWmMmYo",
  "oCwmwWo",
  "oWwWwLo",
  ".oYwCo.",
  "..ooo.."
];
const NV_DISCO_SIDE = [
  ".oo..",
  "oWLo.",
  "oWwo.",
  "oWYo.",
  "oWwom",
  "oWCoM",
  "oWwom",
  "oWLo.",
  "oWwo.",
  "oWYo.",
  ".oo.."
];
const NV_DISCO_LUZ = { L: '#ff3ec8', C: '#36f0ff', Y: '#ffe53a' };
{
  const _weaponFor = weaponFor, _shieldFor = shieldFor, _heroShieldFor = heroShieldFor, _makeIcon = makeIcon;
  weaponFor = function (id) { return id === 'pistola_raio' ? cached('w:' + id, () => fromRows(NV_RAIO_ROWS, NV_RAIO_PAL)) : _weaponFor(id); };
  shieldFor = function (id) { return id === 'escudo_disco' ? cached('s:' + id, () => { const p = Object.assign({}, ITEMS[id].pal, NV_DISCO_LUZ); return { face: fromRows(NV_DISCO_FACE, p), side: fromRows(NV_DISCO_SIDE, p) }; }) : _shieldFor(id); };
  heroShieldFor = function (id) {
    if (id !== 'escudo_disco') return _heroShieldFor(id);
    return cached('hs:' + id, () => {
      const pal = ITEMS[id].pal, M = {};
      for (const k in pal) M[k] = { ramp: heroRamp(pal[k]), grain: k === 'W' || k === 'w' ? 0.12 : 0.05, under: true, lip: true };
      const f = L => NV_DISCO_LUZ[L] || M[L];
      return { face: heroPaint(NV_DISCO_FACE, f, 3, null, true), side: heroPaint(NV_DISCO_SIDE, f, 4, null, true) };
    });
  };
  makeIcon = function (id) {
    if (id !== 'pistola_raio') return _makeIcon(id);
    const c = mk(13, 13), x = c.getContext('2d'), img = fromRows(NV_RAIO_ICON, NV_RAIO_PAL); x.imageSmoothingEnabled = false;
    x.save(); x.translate(6.5, 6.5); x.rotate(Math.PI / 4); x.drawImage(img, -img.width / 2, -img.height / 2); x.restore();
    const o = outlined(c); let url = ''; try { url = o.toDataURL(); } catch (e) { }
    return { cv: o, url };
  };
}

/* ---- o raio da pistola: no fim da preparação de cada golpe sai um raio rosa reto na direção do mouse, até 9 blocos
   ou a primeira parede; acerta o primeiro bicho no caminho (o golpe de perto do cajado continua valendo) ---- */
const NV_RAIO = { reach: 108, mult: 1.3, life: 0.16 };
const nvRaios = [];
let nvRaioAt = -1;
addEventListener('DOMContentLoaded', () => {
  sfx.nvRaio = function () { tone(1800, 0.12, 'sawtooth', 0.03, -1300); tone(2600, 0.08, 'sine', 0.025, -900, 0.02); noise(0.05, 0.05, 5200, 'bandpass', 0, 2); };
  HOOK.update.push(dt => {
    for (let i = nvRaios.length - 1; i >= 0; i--) if ((nvRaios[i].t += dt) >= NV_RAIO.life) nvRaios.splice(i, 1);
    const w = equip.weapon; if (!w || w.id !== 'pistola_raio' || pl.dead || pl.atkT < 0 || nvRaioAt === pl.atkAt) return;
    if (pl.atkT < (pl.twoHand ? GS_TM : ATK_TM).wind) return;
    nvRaioAt = pl.atkAt;
    const [mx, my] = mouseWorld(), ox = pl.x + pl.w / 2 + pl.facing * 5, oy = pl.y + 7;
    let a = Math.atan2(my - oy, mx - ox);
    if (Math.cos(a) * pl.facing < 0.15) a = pl.facing > 0 ? clamp(a, -1.3, 1.3) : (a > 0 ? Math.max(a, Math.PI - 1.3) : Math.min(a, -Math.PI + 1.3));   // nunca atira para trás
    const ux = Math.cos(a), uy = Math.sin(a);
    let len = 0, hit = null;
    for (; len < NV_RAIO.reach; len += 2) {
      const x = ox + ux * len, y = oy + uy * len;
      if (solidAt(Math.floor(x / T), Math.floor(y / T))) break;
      for (const e of enemies) if (!e.dead && x >= e.x - 1 && x <= e.x + e.w + 1 && y >= e.y - 1 && y <= e.y + e.h + 1) { hit = e; break; }
      if (hit) break;
    }
    nvRaios.push({ x: ox, y: oy, ux, uy, len, t: 0 });
    if (hit) { hitEnemy(hit, ux >= 0 ? 1 : -1, NV_RAIO.mult); burst(ox + ux * len, oy + uy * len, 8, '#ff3ec8', 90, 0, 0.3, 1, true); }
    else burst(ox + ux * len, oy + uy * len, 4, '#ff9ae0', 50, 0, 0.25, 1, true);
    sfx.nvRaio();
  });
  let g = null;
  HOOK.drawGlow.push((cx, cy) => {
    if (!nvRaios.length) return;
    if (!g) g = glow(8, '#ff3ec8');
    for (const r of nvRaios) { const k = 1 - r.t / NV_RAIO.life; lc.globalAlpha = 0.35 * k; for (let d = 0; d <= r.len; d += 6) lc.drawImage(g, Math.round(r.x + r.ux * d - cx - 8), Math.round(r.y + r.uy * d - cy - 8)); }
  });
  HOOK.drawTop.push((cx, cy) => {
    for (const r of nvRaios) {
      const k = 1 - r.t / NV_RAIO.life;
      for (let d = 0; d <= r.len; d += 1) {
        const x = Math.round(r.x + r.ux * d - cx), y = Math.round(r.y + r.uy * d - cy);
        lc.globalAlpha = 0.9 * k; lc.fillStyle = '#ff3ec8'; lc.fillRect(x, y - 1, 1, 3);
        lc.globalAlpha = k; lc.fillStyle = '#ffe8fa'; lc.fillRect(x, y, 1, 1);
      }
    }
    lc.globalAlpha = 1;
  });
});
