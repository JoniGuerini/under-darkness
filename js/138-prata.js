'use strict';

/* ================= prata: o metal da Cidade Afundada (2026-10-10) =================
   Um metal por camada (102): a prata é o da sexta, a Cidade Afundada (130-139). Prata escurecida no aterro e na pedra
   com limo, que só brilha onde a picareta raspa; funde na fornalha como os outros (6 minérios por barra, receita no
   136, que carrega depois da forja). Aqui: o minério e a barra, o metal na forja (METALS, nível de item pela posição
   da camada no registro 129) e as 9 peças. Também os materiais da camada (moeda afundada, cera do Poço, corda
   alcatroada, pérola negra) e as três bases que só caem lá (Facão do Saqueador, Capuz do Poço, Couraça da Guarda da
   Cidade), com o que cada uma faz.
   Carrega logo depois do 127-esporita, antes do 110-infernita: a bigorna mostra a prata antes da infernita. */

const PRATA_PAL = ['#2a2e34', '#a0a8b2', '#f4f8fc'];   // escuro, corpo, brilho: como ORE_PAL
Object.assign(ITEMS, {
  min_prata: { name: 'Minério de Prata', rar: 2, stack: 99, icon: 'ore', ore: PRATA_PAL, desc: 'Prata escurecida presa no entulho. Brilha só onde a picareta raspou.' },
  barra_prata: { name: 'Barra de Prata', rar: 2, stack: 99, icon: 'bar', ore: PRATA_PAL, desc: 'Fundida de 6 minérios de prata. Vai para a bigorna do Grimaldo.' }
});
// a lump of black fill with tarnished silver showing where it was scraped, and a bar with a bright edge
ORE_ICONS.min_prata = [[
  "...rrrr...",
  "..rRsSrr..",
  ".rsSWsrRr.",
  "rrSsssSrrr",
  "rRrsSsrRsr",
  ".rrrsrrSr.",
  "..rrrrrr..",
  "....rr...."], { r: '#241f19', R: '#483d31', s: '#4a5058', S: '#a0a8b2', W: '#f4f8fc' }];
BAR_ICONS.barra_prata = [[
  "...tTTTTTTTt.",
  "..tTgWgggGTe.",
  ".tggGgggGggeE",
  "FFFFFFFFFFFeE",
  "mmmmGmmmmmmEE",
  "mmmmmmmGmmmE.",
  "dddddddddd..."], { T: '#ccd2da', t: '#a0a8b2', g: '#8a929c', G: '#ccd2da', W: '#f4f8fc', F: '#727a84', m: '#4a5058', e: '#3a3e46', E: '#2a2e34', d: '#1a1d22' }];

METALS.push({ id: 'prata', name: 'Prata', bar: 'barra_prata', il: layerForgeIl('cidade'),
  wp: { w: '#f4f8fc', W: '#ccd2da', l: '#727a84', g: '#3a3a30', G: '#22221c', h: '#26241c', p: '#a0a8b2' },
  m: '#8a929c', M: '#e4e8ee', body: { r: '#9aa2ac', R: '#6a727c', D: '#454b54', b: '#2a2e34', B: '#e4e8ee' }, s: '#8a929c', S: '#4a5058' });
FORGE_ILVL.push(layerForgeIl('cidade'));
{
  const t = METALS.length - 1, M = METALS[t];
  // [peça, nome, gênero, barras, números]: entre a esporita e a infernita
  const P = [
    ['espada', 'Espada Forjada', 1, 4, { slot: 'weapon', kind: 'sword', dmg: 40, crit: 0.15 }],
    ['adaga', 'Adaga Forjada', 1, 2, { slot: 'weapon', kind: 'dagger', dmg: 26, crit: 0.11 }],
    ['machado', 'Machado Forjado', 0, 5, { slot: 'weapon', kind: 'axe', dmg: 61, crit: 0.05 }],
    ['maca', 'Maça Forjada', 1, 5, { slot: 'weapon', kind: 'mace', dmg: 47, crit: 0.05 }],
    ['lanca', 'Lança Forjada', 1, 4, { slot: 'weapon', kind: 'spear', dmg: 43, crit: 0.09 }],
    ['montante', 'Montante Forjado', 0, 6, { slot: 'weapon', kind: 'greatsword' }],
    ['elmo', 'Elmo Forjado', 0, 4, { slot: 'head', def: 7, hp: 19, art: HELM, oy: -1 }],
    ['peitoral', 'Peitoral Forjado', 0, 6, { slot: 'body', def: 11, hp: 27 }],
    ['botas', 'Botas Forjadas', 3, 3, { slot: 'feet', def: 4, spd: 0.055 }]
  ];
  for (const [pc, nm, g, bars, st] of P) {
    const id = `f_${pc}_${M.id}`, f = g === 0 || g === 2 ? 'Forjado' : g === 3 ? 'Forjadas' : 'Forjada';
    const o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `${f} na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st);
    o.pal = o.slot === 'weapon' ? M.wp : o.slot === 'head' ? { m: M.m, M: M.M } : o.slot === 'body' ? M.body : { s: M.s, S: M.S };
    if (o.kind === 'greatsword') o.twoHand = true;
    ITEMS[id] = o; ITEM_G[id] = g; o.g = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
}

/* ---------- os materiais da camada ---------- */
Object.assign(ICON_ART, {
  cdMoeda: [["..cCCCc..", ".cCWWCCc.", "cCWcCCcCc", "cCcCCcCCc", "cCCcCCcCc", ".cCCCCcc.", "..cccccg.", "....ggg.."], { c: '#6a5a2a', C: '#a8924a', W: '#e8d89a', g: '#2a3e30' }],
  cdCera: [["...ww....", "..wWWw...", ".wWWWWw..", ".wWwWWw..", "wWWWWwWw.", "wwWWWWww.", ".wwwwww..", "..dddd..."], { w: '#a89470', W: '#d8c8a0', d: '#3a2e22' }],
  cdCorda: [["kK.......", ".kK......", "..kKkK...", "...KkKk..", "..kK.kK..", ".kK...kK.", "kK.....kK", "K.......k"], { k: '#2a1e14', K: '#5a4430' }],
  cdPerola: [["...ppp...", "..pPPPp..", ".pPWPPPp.", ".pPPPPPp.", ".pPPPPPp.", "..pPPPp..", "...ppp..."], { p: '#14161c', P: '#3e4652', W: '#b4bcc8' }]
});
Object.assign(ITEMS, {
  moeda_afundada: { name: 'Moeda Afundada', rar: 0, stack: 99, icon: 'cdMoeda', desc: 'Uma moeda da cidade com o rosto do rei raspado. O Odo coleciona e paga bem.' },
  cera_poco: { name: 'Cera do Poço', rar: 1, stack: 99, icon: 'cdCera', desc: 'Cera das velas do culto, cinza e com cheiro de água parada. A Marta usa nas misturas.' },
  corda_alcatroada: { name: 'Corda Alcatroada', rar: 0, stack: 99, icon: 'cdCorda', desc: 'Corda grossa untada de piche, dos saqueadores. O Grimaldo amarra cabos com ela.' },
  perola_negra: { name: 'Pérola Negra', rar: 2, stack: 99, icon: 'cdPerola', desc: 'Nasce no fundo da água negra das cisternas. A Aurélia quer todas que você achar.' }
});

/* ---------- as bases que só caem na Cidade Afundada (nível 13) ---------- */
const CD_BASE_LVL = layerLo('cidade');
Object.assign(ITEMS, {
  facao_saqueador: { name: 'Facão do Saqueador', slot: 'weapon', kind: 'dagger', rar: 1, costas: 0.6, pal: { w: '#e4e8ee', W: '#a0a8b2', l: '#4a5058', g: '#3a2a1a', G: '#22180e', h: '#2a1d12', p: '#6a5a2a' }, desc: 'Lâmina larga e gasta, boa para trabalho sujo. Pelas costas, corta muito mais.' },
  capuz_poco: { name: 'Capuz do Poço', slot: 'head', rar: 1, def: 5, furtivo: 1, art: ["............", "...mmmmm....", "..mMMMMmm...", ".mMmmmmmMm..", ".mm.....mm..", ".m.......m..", ".m.........."], oy: -1, pal: { m: '#6a5a44', M: '#a89470' }, desc: 'O capuz cor de cera suja do culto. Quem usa demora mais para ser notado.' },
  couraca_guarda: { name: 'Couraça da Guarda da Cidade', slot: 'body', rar: 1, def: 13, hp: 22, pal: { r: '#727a84', R: '#4a5058', D: '#2e343e', b: '#20242c', B: '#ccd2da' }, desc: 'A armadura da guarda antiga, com o brasão da cidade raspado do peito.' }
});
Object.assign(BASE_INFO, { facao_saqueador: [CD_BASE_LVL, 1.05], capuz_poco: [CD_BASE_LVL], couraca_guarda: [CD_BASE_LVL] });
Object.assign(ITEM_G, { facao_saqueador: 0, capuz_poco: 0, couraca_guarda: 1 });
for (const id of ['facao_saqueador', 'capuz_poco', 'couraca_guarda']) ITEMS[id].g = ITEM_G[id];

// o que o facão (costas) e o capuz (furtivo) fazem fica no 136, que carrega depois do combate
