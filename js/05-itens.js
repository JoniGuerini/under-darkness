'use strict';

/* ================= items ================= */
const RAR = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'];
const RAR_COL = ['#d9cfbb', '#7fd36a', '#62a8ff', '#c27bff', '#ff9a3c'];
const SLOT_NAME = { weapon: 'Arma', shield: 'Escudo', tool: 'Ferramenta', head: 'Cabeça', body: 'Corpo', feet: 'Pés', acc: 'Acessório' };
const EQ_SLOTS = ['head', 'body', 'feet', 'weapon', 'shield', 'tool', 'acc1', 'acc2'];
const DEFAULT_EQ = { head: null, body: 'tunica', feet: null, weapon: 'espada_ferro', shield: 'escudo_madeira', tool: 'picareta_ferro', acc1: null, acc2: null };
const BODY_RAGS = { r: '#8f8574', R: '#6e6556', D: '#524a3e', b: '#5a4a3a', B: '#6e5a46' };
// head overlays drawn on top of the warrior's head (12 wide, aligned with the body sprite)
const HOOD = ["....cccc....", "...cCCccc...", "..cCcccccc..", "..ccccc.....", "..cccc......", "..cccc......", "..ccc.......", "...cc......."];
const HELM = ["....mmmm....", "...mMMmmm...", "..mMmmmmmm..", "..mmmmmmmmm.", "..mm.....m..", "..mm.....m..", "..m........."];
const HELM_GOLD = ["...pp.......", "..pppp......"].concat(HELM);
const HELM_HORNS = ["..K......K..", "..K......K..", "..KK....KK..", "...KmmmmK...", "...mMMmmm...", "..mMmmmmmm..", "..mmmmmmmmm.", "..mm.....m..", "..mm.....m..", "..m........."];
const CROWN = ["...c.cc.c...", "...cCccCc...", "...cccccc..."];
// weapon shapes share the sword's palette keys (w W l = metal, g G = guard, h = handle, p = pommel)
const DAGGER = [".w.", "wWl", "wWl", "wWl", "gGg", ".h.", ".h.", ".p."];
const AXE = ["...l...", "...lwW.", "...lWWw", "...lWWw", "...lwW.", "...h...", "...h...", "...h...", "...h...", "...h...", "...h...", "...h...", "...h...", "...p..."];
const MACE = [".lWl.", "lWwWl", "WwwwW", "lWwWl", ".lWl.", "..h..", "..h..", "..h..", "..h..", "..h..", "..h..", "..p.."];
const PSPEAR = [".w.", "wWl", "wWl", ".W.", "gGg", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".h.", ".p."];
const KIND = {
  sword: { name: 'Espada', spd: 1, reach: 28, rows: SWORD, px: 2.5, py: 11, note: 'equilibrada' },
  dagger: { name: 'Adaga', spd: 1.6, reach: 20, crit: 0.1, rows: DAGGER, px: 1.5, py: 6, note: 'golpes rápidos e crítico alto' },
  axe: { name: 'Machado', spd: 0.65, reach: 31, kb: 1.7, rows: AXE, px: 3.5, py: 11, note: 'empurra os inimigos longe' },
  mace: { name: 'Maça', spd: 0.8, reach: 27, stun: 0.3, rows: MACE, px: 2.5, py: 9, note: '30% de chance de atordoar' },
  spear: { name: 'Lança', spd: 0.85, reach: 44, thrust: true, rows: PSPEAR, px: 1.5, py: 12, note: 'estocada reta e comprida' }
};
const SW = {
  bone: { w: '#fbf6ea', W: '#ddd2b6', l: '#a89a7c', g: '#8a7a5c', G: '#5a4c38', h: '#3b2a20', p: '#ddd2b6' },
  gold: { w: '#fff8cc', W: '#f0c43a', l: '#b07a0a', g: '#c04040', G: '#7a2020', h: '#3b2a20', p: '#f0c43a' },
  crys: { w: '#f8f0ff', W: '#c493ff', l: '#7a3fd0', g: '#5a4a7a', G: '#3a2f55', h: '#2a2040', p: '#c493ff' },
  horn: { w: '#f0e6cc', W: '#c8b48a', l: '#6e5a40', g: '#3a2a20', G: '#2a1a14', h: '#3a2418', p: '#8a6a4a' }
};
const SH = {
  iron: { o: '#33353b', W: '#858d97', w: '#a9b1bb', m: '#d0d4da', M: '#ffffff' },
  bone: { o: '#6e6250', W: '#d4c8aa', w: '#ece4cf', m: '#8a7a5c', M: '#b5aa92' },
  gold: { o: '#6e500c', W: '#d0a02c', w: '#f0c43a', m: '#c04040', M: '#ff9090' }
};
const ITEMS = {
  espada_ferro: { name: 'Espada de Ferro', slot: 'weapon', rar: 0, dmg: 12, crit: 0.10, pal: SWORD_P, desc: 'Velha, mas afiada. Foi com ela que você chegou aqui.' },
  cutelo: { name: 'Cutelo Enferrujado', slot: 'weapon', rar: 1, dmg: 15, crit: 0.06, pal: SWORD_SK, desc: 'Arrancado de um esqueleto. Pesado e cheio de ferrugem.' },
  espada_osso: { name: 'Espada de Osso', slot: 'weapon', rar: 2, dmg: 19, crit: 0.12, pal: SW.bone, desc: 'Afiada de um jeito que osso não deveria ser.' },
  espada_ouro: { name: 'Espada de Ouro', slot: 'weapon', rar: 2, dmg: 23, crit: 0.15, pal: SW.gold, desc: 'Brilha até no escuro das cavernas profundas.' },
  lamina_cristal: { name: 'Lâmina de Cristal', slot: 'weapon', rar: 3, dmg: 31, crit: 0.20, pal: SW.crys, desc: 'Vibra baixinho quando algo se aproxima.' },
  escudo_madeira: { name: 'Escudo de Madeira', slot: 'shield', rar: 0, def: 0, parry: 0.22, pal: SHIELD_PAL, desc: 'Tábuas presas num aro de ferro. Aguenta mais do que parece.' },
  escudo_ferro: { name: 'Escudo de Ferro', slot: 'shield', rar: 1, def: 2, parry: 0.24, pal: SH.iron, desc: 'Amassado, mas inteiro.' },
  escudo_osso: { name: 'Escudo de Osso', slot: 'shield', rar: 2, def: 3, parry: 0.28, pal: SH.bone, desc: 'Leve. Facilita aparar no tempo certo.' },
  picareta_ferro: { name: 'Picareta de Ferro', slot: 'tool', rar: 0, dmg: 6, mine: 1, pal: PICK_P, desc: 'Gasta, mas firme. Aperte 2 para segurar e mantenha o clique esquerdo para minerar.' },
  escudo_ouro: { name: 'Escudo Dourado', slot: 'shield', rar: 3, def: 5, parry: 0.32, pal: SH.gold, desc: 'Pesado e bonito. A janela de aparo é bem generosa.' },
  capuz: { name: 'Capuz de Pano', slot: 'head', rar: 1, def: 1, hp: 5, art: HOOD, oy: 0, pal: { c: '#6b5a44', C: '#8f7a5a' }, desc: 'Esquenta a cabeça e esconde o rosto.' },
  elmo_ferro: { name: 'Elmo de Ferro', slot: 'head', rar: 2, def: 3, art: HELM, oy: -1, pal: { m: '#9aa3ad', M: '#dfe4ea' }, desc: 'Com proteção de nariz.' },
  elmo_ouro: { name: 'Elmo Dourado', slot: 'head', rar: 3, def: 5, hp: 15, art: HELM_GOLD, oy: -3, pal: { m: '#d8a830', M: '#fff0a0', p: '#c83a3a' }, desc: 'Com penacho vermelho. Ninguém passa despercebido.' },
  tunica: { name: 'Túnica de Pano', slot: 'body', rar: 0, def: 0, pal: { r: '#d6c39a', R: '#a8946b', D: '#7c6a4b', b: '#7b4f2c', B: '#b47c45' }, desc: 'Linho simples. Confortável e sem proteção nenhuma.' },
  cota: { name: 'Cota de Malha', slot: 'body', rar: 2, def: 4, spd: -0.04, pal: { r: '#a3abb5', R: '#78808b', D: '#555c66', b: '#5a3a22', B: '#8a6038' }, desc: 'Protege bem, mas pesa um pouco.' },
  manto: { name: 'Manto Sombrio', slot: 'body', rar: 3, def: 5, hp: 10, spd: 0.06, pal: { r: '#56437a', R: '#3e3060', D: '#2a2044', b: '#c9a14a', B: '#f0d080' }, desc: 'Um tecido que parece engolir a luz.' },
  botas_couro: { name: 'Botas de Couro', slot: 'feet', rar: 1, def: 1, spd: 0.08, pal: { s: '#7a4f2e', S: '#55361d' }, desc: 'Finalmente, algo nos pés.' },
  botas_ferro: { name: 'Botas de Ferro', slot: 'feet', rar: 2, def: 3, pal: { s: '#9aa3ad', S: '#6f7883' }, desc: 'Barulhentas, mas firmes.' },
  anel_vida: { name: 'Anel de Vida', slot: 'acc', rar: 2, hp: 25, icon: 'ring', desc: 'Um rubi que pulsa como um coração.' },
  amuleto: { name: 'Amuleto do Caçador', slot: 'acc', rar: 2, xp: 0.15, crit: 0.04, icon: 'amulet', desc: 'Quem caça mais, aprende mais.' },
  pedra_lunar: { name: 'Pedra Lunar', slot: 'acc', rar: 3, regen: 2, def: 1, icon: 'moon', desc: 'Fria ao toque. Fecha feridas devagar.' },
  carvao: { name: 'Carvão', rar: 0, stack: 99, icon: 'coal', desc: 'Queima devagar. Combustível da fornalha: cada barra fundida gasta 1.' },
  barra_cobre: { name: 'Barra de Cobre', rar: 0, stack: 99, icon: 'bar', ore: ORE_PAL[COPPER], desc: 'Fundida de 2 minérios de cobre. Vai para a bigorna do Grimaldo.' },
  barra_ferro: { name: 'Barra de Ferro', rar: 1, stack: 99, icon: 'bar', ore: ORE_PAL[IRON], desc: 'Fundida de 3 minérios de ferro. Vai para a bigorna do Grimaldo.' },
  barra_ouro: { name: 'Barra de Ouro', rar: 2, stack: 99, icon: 'bar', ore: ORE_PAL[GOLD], desc: 'Fundida de 4 minérios de ouro. Vai para a bigorna do Grimaldo.' },
  barra_cristal: { name: 'Barra de Cristal', rar: 3, stack: 99, icon: 'bar', ore: ORE_PAL[CRYSTAL], desc: 'Fundida de 5 cristais brutos. Vai para a bigorna do Grimaldo.' },
  pocao: { name: 'Poção de Vida', rar: 1, stack: 30, use: true, icon: 'potion', desc: 'Recupera 12 de vida ao longo de 5 segundos.' },
  tocha: { name: 'Tocha', rar: 0, stack: 99, icon: 'torch', desc: 'Q coloca uma tocha onde o mouse aponta.' },
  gel: { name: 'Gel', rar: 0, stack: 99, icon: 'gel', desc: 'Grudento. Material.' },
  carne: { name: 'Carne Podre', rar: 0, stack: 99, icon: 'flesh', desc: 'Melhor não comer. Material.' },
  asa: { name: 'Asa de Morcego', rar: 0, stack: 99, icon: 'wing', desc: 'Fina como papel. Material.' },
  osso: { name: 'Osso', rar: 0, stack: 99, icon: 'bone', desc: 'Material.' },
  olho: { name: 'Olho Sombrio', rar: 1, stack: 99, icon: 'eye', desc: 'Ainda parece estar olhando. Material.' },
  min_cobre: { name: 'Minério de Cobre', rar: 0, stack: 99, icon: 'ore', ore: ORE_PAL[COPPER], desc: 'Material.' },
  min_ferro: { name: 'Minério de Ferro', rar: 0, stack: 99, icon: 'ore', ore: ORE_PAL[IRON], desc: 'Material.' },
  min_ouro: { name: 'Minério de Ouro', rar: 1, stack: 99, icon: 'ore', ore: ORE_PAL[GOLD], desc: 'Material.' },
  min_cristal: { name: 'Cristal Bruto', rar: 2, stack: 99, icon: 'ore', ore: ORE_PAL[CRYSTAL], desc: 'Material.' },
  terra: { name: 'Terra', rar: 0, stack: 99, block: DIRT, desc: 'Um bloco de terra. Na barra, clique para colocar.' },
  pedra: { name: 'Pedra', rar: 0, stack: 99, block: STONE, desc: 'Paralelepípedo firme. Bom para pontes e paredes.' },
  pedra_escura: { name: 'Pedra Escura', rar: 0, stack: 99, block: DEEP, desc: 'Ardósia das profundezas.' },
  madeira: { name: 'Madeira', rar: 0, stack: 99, block: PLANK, desc: 'Tábuas da árvore que você derrubou. Vira piso, parede ou ponte.' },
  tijolo: { name: 'Tijolo da Cripta', rar: 1, stack: 99, block: CRYPT, desc: 'Pedra escura e fria. Só se solta depois que o Carrasco cai.' },
  candelabro: { name: 'Candelabro', rar: 1, stack: 99, deco: CANDLE, desc: 'Coloque no chão para iluminar. Na barra, clique para colocar.' },
  brasa: { name: 'Brasa Infernal', rar: 1, stack: 99, icon: 'ember', desc: 'Não apaga nunca. Material.' },
  presa: { name: 'Presa Infernal', rar: 1, stack: 99, icon: 'fang', desc: 'Arrancada de um cão infernal. Material.' },
  chifre: { name: 'Chifre de Demônio', rar: 1, stack: 99, icon: 'horn', desc: 'Pesado e torto. Material.' },
  ectoplasma: { name: 'Ectoplasma', rar: 1, stack: 99, icon: 'ecto', desc: 'Frio e grudento. Brilha de leve no escuro. Material.' },
  cranio: { name: 'Crânio em Brasa', rar: 1, stack: 99, icon: 'skullI', desc: 'Ainda morno. Material.' },
  lamina_infernal: { name: 'Lâmina Infernal', slot: 'weapon', rar: 3, dmg: 36, crit: 0.14, pal: { w: '#fff0c8', W: '#ff8a3a', l: '#b02a10', g: '#3a1a1a', G: '#1a0a0a', h: '#2a1410', p: '#ff5a2a' }, desc: 'Tirada das mãos do Carrasco. Ainda está quente.' },
  coracao_infernal: { name: 'Coração Infernal', slot: 'acc', rar: 3, hp: 40, regen: 1, icon: 'heart', desc: 'Ainda bate. Devagar.' }
};
// more gear: new weapon kinds, armour from the crypt and the undead, special rings, better picks
Object.assign(ITEMS, {
  adaga_ferro: { name: 'Adaga de Ferro', slot: 'weapon', kind: 'dagger', rar: 0, dmg: 8, crit: 0.06, pal: SWORD_P, desc: 'Curta e ligeira. Para quem gosta de chegar perto.' },
  adaga_osso: { name: 'Adaga de Osso', slot: 'weapon', kind: 'dagger', rar: 1, dmg: 12, crit: 0.08, pal: SW.bone, desc: 'Um osso lascado até virar navalha.' },
  adaga_cristal: { name: 'Adaga de Cristal', slot: 'weapon', kind: 'dagger', rar: 2, dmg: 19, crit: 0.1, pal: SW.crys, desc: 'Quase não pesa. Corta o ar com um assobio.' },
  machado_ferro: { name: 'Machado de Ferro', slot: 'weapon', kind: 'axe', rar: 0, dmg: 19, crit: 0.04, pal: SWORD_P, desc: 'Feito para lenha. Serve para o resto também.' },
  machado_chifre: { name: 'Machado de Chifre', slot: 'weapon', kind: 'axe', rar: 2, dmg: 31, crit: 0.05, pal: SW.horn, desc: 'Lâmina de chifre de demônio presa num cabo torto.' },
  machado_ouro: { name: 'Machado Dourado', slot: 'weapon', kind: 'axe', rar: 2, dmg: 36, crit: 0.05, pal: SW.gold, desc: 'Pesado demais para ser só enfeite.' },
  maca_ferro: { name: 'Maça de Ferro', slot: 'weapon', kind: 'mace', rar: 0, dmg: 15, crit: 0.04, pal: SWORD_P, desc: 'Não corta. Amassa.' },
  maca_osso: { name: 'Maça de Osso', slot: 'weapon', kind: 'mace', rar: 1, dmg: 21, crit: 0.05, pal: SW.bone, desc: 'Um crânio na ponta de um fêmur. Bem sutil.' },
  maca_ouro: { name: 'Maça Dourada', slot: 'weapon', kind: 'mace', rar: 2, dmg: 29, crit: 0.05, pal: SW.gold, desc: 'Atordoa só de olhar.' },
  lanca_ferro: { name: 'Lança de Ferro', slot: 'weapon', kind: 'spear', rar: 0, dmg: 13, crit: 0.06, pal: SWORD_P, desc: 'Mantém o perigo a uma boa distância.' },
  lanca_osso: { name: 'Lança de Osso', slot: 'weapon', kind: 'spear', rar: 1, dmg: 19, crit: 0.07, pal: SW.bone, desc: 'A preferida dos guardiões esqueléticos.' },
  lanca_cristal: { name: 'Lança de Cristal', slot: 'weapon', kind: 'spear', rar: 2, dmg: 28, crit: 0.09, pal: SW.crys, desc: 'A ponta brilha antes de acertar.' },
  broquel: { name: 'Broquel', slot: 'shield', rar: 1, def: 0, parry: 0.36, pal: { o: '#3a2a1a', W: '#7a5a34', w: '#a07a48', m: '#c8ced8', M: '#ffffff' }, desc: 'Pequeno e leve. Perfeito para aparar.' },
  escudo_torre: { name: 'Escudo-Torre', slot: 'shield', rar: 1, def: 6, parry: 0.14, spd: -0.06, pal: { o: '#22242a', W: '#4e545e', w: '#6a707a', m: '#8a909a', M: '#b8bec8' }, desc: 'Uma porta com alça. Segura tudo, mas é difícil aparar com ele.' },
  escudo_espinhos: { name: 'Escudo de Espinhos', slot: 'shield', rar: 2, def: 3, parry: 0.24, thorns: 0.2, pal: { o: '#1e2a1a', W: '#3e5a2e', w: '#5a7a3e', m: '#c8ced8', M: '#ffffff' }, desc: 'Quem te acerta se machuca.' },
  escudo_infernal: { name: 'Escudo Infernal', slot: 'shield', rar: 3, def: 7, parry: 0.28, hp: 15, pal: { o: '#1a0a0a', W: '#6e1a1a', w: '#a02a1a', m: '#ff8a3a', M: '#ffe0a0' }, desc: 'Ainda cheira a enxofre.' },
  elmo_osso: { name: 'Elmo de Osso', slot: 'head', rar: 1, def: 4, art: HELM, oy: -1, pal: { m: '#d4c8aa', M: '#f4ecd8' }, desc: 'O crânio de alguém bem maior que você.' },
  elmo_chifres: { name: 'Elmo de Chifres', slot: 'head', rar: 2, def: 6, crit: 0.03, art: HELM_HORNS, oy: -4, pal: { m: '#5a3a3a', M: '#8a5a5a', K: '#e8dcc0' }, desc: 'Chifres de demônio pregados num elmo de ferro.' },
  coroa_espectral: { name: 'Coroa Espectral', slot: 'head', rar: 3, def: 3, regen: 1, light: 2, art: CROWN, oy: -3, pal: { c: '#7fe8ff', C: '#e8fbff' }, desc: 'Flutua um dedo acima da cabeça e ilumina o caminho.' },
  couraca_osso: { name: 'Couraça de Osso', slot: 'body', rar: 1, def: 5, pal: { r: '#d4c8aa', R: '#a89a7c', D: '#7a6e58', b: '#5a4a3a', B: '#ece4cf' }, desc: 'Costelas amarradas com couro.' },
  armadura_placas: { name: 'Armadura de Placas', slot: 'body', rar: 2, def: 8, spd: -0.08, pal: { r: '#8a929c', R: '#5e6670', D: '#3e444c', b: '#2a2a30', B: '#c8ced8' }, desc: 'Quase nada atravessa. Nem você corre muito.' },
  manto_espectral: { name: 'Manto Espectral', slot: 'body', rar: 3, def: 3, dodge: 0.08, pal: { r: '#8ab8d0', R: '#5a88a0', D: '#3a5a70', b: '#c8f4ff', B: '#e8fbff' }, desc: 'Às vezes os golpes simplesmente atravessam.' },
  botas_osso: { name: 'Botas de Osso', slot: 'feet', rar: 1, def: 2, spd: 0.04, pal: { s: '#d4c8aa', S: '#a89a7c' }, desc: 'Fazem um barulhinho a cada passo.' },
  grevas_demonio: { name: 'Grevas Demoníacas', slot: 'feet', rar: 3, def: 4, spd: 0.06, pal: { s: '#5a1a1a', S: '#2a0a0a' }, desc: 'Esquentam os pés. Às vezes demais.' },
  anel_vampiro: { name: 'Anel do Vampiro', slot: 'acc', rar: 2, lifeSteal: 0.025, icon: 'ring', iconPal: { r: '#5a0a14', R: '#d63a4a', y: '#3a2a2a' }, desc: 'Cada golpe devolve um pouco da vida que tira.' },
  anel_espinhos: { name: 'Anel de Espinhos', slot: 'acc', rar: 2, thorns: 0.25, icon: 'ring', iconPal: { r: '#3a6a2a', R: '#9fd65a', y: '#6e5a40' }, desc: 'Quem te acerta também sente.' },
  anel_furia: { name: 'Anel da Fúria', slot: 'acc', rar: 2, atkSpd: 0.12, icon: 'ring', iconPal: { r: '#c8501a', R: '#ffb070', y: '#e8c04a' }, desc: 'O braço fica mais rápido que a cabeça.' },
  amuleto_vento: { name: 'Amuleto do Vento', slot: 'acc', rar: 2, spd: 0.08, dodge: 0.04, icon: 'amulet', iconPal: { c: '#b5aa92', y: '#9aa3ad', G: '#3aa8c8', g: '#c8f4ff' }, desc: 'Leve como uma brisa.' },
  talisma_ossos: { name: 'Talismã de Ossos', slot: 'acc', rar: 2, onKill: 6, icon: 'skullI', iconPal: { o: '#ece4cf', O: '#b5aa92', x: '#1a1014', y: '#7a2a2a' }, desc: 'Cada inimigo que cai te devolve um pouco de vida.' },
  lanterna_fantasma: { name: 'Lanterna Fantasma', slot: 'acc', rar: 2, light: 3, xp: 0.05, icon: 'lantern', desc: 'Uma chama azul que nunca apaga. Ilumina bem mais longe.' },
  picareta_ouro: { name: 'Picareta de Ouro', slot: 'tool', rar: 1, dmg: 9, mine: 1.6, pal: { M: '#fff0a0', m: '#b07a0a', a: '#e8c04a', h: '#9a6a3c', H: '#5f3a20' }, desc: 'Minera bem mais rápido.' },
  picareta_cristal: { name: 'Picareta de Cristal', slot: 'tool', rar: 2, dmg: 13, mine: 2.3, pal: { M: '#f0e0ff', m: '#7a3fd0', a: '#c493ff', h: '#5a4a7a', H: '#3a2f55' }, desc: 'Corta pedra como se fosse terra.' }
});
// grammatical gender for the generated names: 0 masc, 1 fem, 2 masc plural, 3 fem plural
const ITEM_G = { espada_ferro: 1, cutelo: 0, espada_osso: 1, espada_ouro: 1, lamina_cristal: 1, lamina_infernal: 1, escudo_madeira: 0, escudo_ferro: 0, escudo_osso: 0, escudo_ouro: 0, picareta_ferro: 1, picareta_ouro: 1, picareta_cristal: 1, capuz: 0, elmo_ferro: 0, elmo_ouro: 0, elmo_osso: 0, elmo_chifres: 0, coroa_espectral: 1, tunica: 1, cota: 1, manto: 0, couraca_osso: 1, armadura_placas: 1, manto_espectral: 0, botas_couro: 3, botas_ferro: 3, botas_osso: 3, grevas_demonio: 3, anel_vida: 0, amuleto: 0, pedra_lunar: 1, coracao_infernal: 0, anel_vampiro: 0, anel_espinhos: 0, anel_furia: 0, amuleto_vento: 0, talisma_ossos: 0, lanterna_fantasma: 1, adaga_ferro: 1, adaga_osso: 1, adaga_cristal: 1, machado_ferro: 0, machado_chifre: 0, machado_ouro: 0, maca_ferro: 1, maca_osso: 1, maca_ouro: 1, lanca_ferro: 1, lanca_osso: 1, lanca_cristal: 1, broquel: 0, escudo_torre: 0, escudo_espinhos: 0, escudo_infernal: 0 };
// forged gear: every armour slot and every weapon kind in each metal, made at Grimaldo's anvil from bars
const METALS = [
  { id: 'cobre', name: 'Cobre', bar: 'barra_cobre', wp: { w: '#ffd8b0', W: '#e0884c', l: '#9a4a22', g: '#5a3a22', G: '#3a2416', h: '#3b2a20', p: '#e0884c' }, m: '#c8703a', M: '#ffc08a', body: { r: '#c8703a', R: '#9a4a22', D: '#6a3416', b: '#4a2a16', B: '#ffc08a' }, s: '#c8703a', S: '#8a4420' },
  { id: 'ferro', name: 'Ferro', bar: 'barra_ferro', wp: { w: '#f4f6f8', W: '#b8c0cc', l: '#6e7680', g: '#3a2a1a', G: '#22180e', h: '#2a1d12', p: '#8a929c' }, m: '#7e8792', M: '#dfe4ea', body: { r: '#8a929c', R: '#5e6670', D: '#3e444c', b: '#2a2a30', B: '#c8ced8' }, s: '#9aa3ad', S: '#6f7883' },
  { id: 'ouro', name: 'Ouro', bar: 'barra_ouro', wp: SW.gold, m: '#d8a830', M: '#fff0a0', body: { r: '#d8a830', R: '#a87808', D: '#6a4a08', b: '#5a3a10', B: '#fff0a0' }, s: '#d8a830', S: '#8a6a10' },
  { id: 'cristal', name: 'Cristal', bar: 'barra_cristal', wp: SW.crys, m: '#8a5ad8', M: '#e8d4ff', body: { r: '#9a6ae0', R: '#6a32c0', D: '#40207a', b: '#2a1a4a', B: '#f0deff' }, s: '#9a6ae0', S: '#5a2aa0' }
];
// [piece, name, gender, bars, stats per metal tier]
const FORGE_PIECES = [
  ['espada', 'Espada Forjada', 1, 4, t => ({ slot: 'weapon', kind: 'sword', dmg: [14, 18, 25, 33][t], crit: [0.08, 0.09, 0.11, 0.13][t] })],
  ['adaga', 'Adaga Forjada', 1, 2, t => ({ slot: 'weapon', kind: 'dagger', dmg: [9, 12, 17, 22][t], crit: [0.05, 0.06, 0.07, 0.09][t] })],
  ['machado', 'Machado Forjado', 0, 5, t => ({ slot: 'weapon', kind: 'axe', dmg: [22, 28, 39, 51][t], crit: 0.04 })],
  ['maca', 'Maça Forjada', 1, 5, t => ({ slot: 'weapon', kind: 'mace', dmg: [17, 22, 30, 40][t], crit: 0.04 })],
  ['lanca', 'Lança Forjada', 1, 4, t => ({ slot: 'weapon', kind: 'spear', dmg: [15, 19, 27, 36][t], crit: [0.06, 0.06, 0.07, 0.08][t] })],
  ['elmo', 'Elmo Forjado', 0, 4, t => ({ slot: 'head', def: [2, 3, 4, 6][t], hp: [0, 0, 10, 15][t], art: HELM, oy: -1 })],
  ['peitoral', 'Peitoral Forjado', 0, 6, t => ({ slot: 'body', def: [3, 5, 7, 9][t], hp: [0, 0, 15, 20][t], spd: [0, -0.03, 0, 0][t] })],
  ['botas', 'Botas Forjadas', 3, 3, t => ({ slot: 'feet', def: [1, 2, 3, 4][t], spd: [0, 0, 0.03, 0.05][t] })]
];
const RECIPES = [];
METALS.forEach((M, t) => {
  for (const [pc, nm, g, bars, st] of FORGE_PIECES) {
    const id = `f_${pc}_${M.id}`, o = Object.assign({ name: `${nm} de ${M.name}`, rar: 0, forged: true, desc: `Forjada na bigorna do Grimaldo com ${bars} barras de ${M.name.toLowerCase()}.` }, st(t));
    if (o.slot === 'weapon') o.pal = M.wp; else if (o.slot === 'head') o.pal = { m: M.m, M: M.M }; else if (o.slot === 'body') o.pal = M.body; else o.pal = { s: M.s, S: M.S };
    if (!o.hp) delete o.hp; if (!o.spd) delete o.spd;
    if (g === 0 || g === 2) o.desc = o.desc.replace('Forjada', 'Forjado');
    if (g === 3) o.desc = o.desc.replace('Forjada', 'Forjadas');
    ITEMS[id] = o; ITEM_G[id] = g; RECIPES.push({ id, metal: t, bar: M.bar, n: bars });
  }
});
for (const id in ITEMS) { const it = ITEMS[id]; if (it.slot === 'weapon' && !it.kind) it.kind = 'sword'; it.g = ITEM_G[id] || 0; }
// boss gear is legendary: always the same properties
ITEMS.lamina_infernal.legend = [['cruel', 0.2], ['vampiro', 0.03]]; ITEMS.lamina_infernal.rar = 4;
ITEMS.coracao_infernal.legend = [['carniceiro', 8]]; ITEMS.coracao_infernal.rar = 4;
// coins never take a bag slot: they go straight to your purse
ITEMS.ouro = { name: 'Ouro', rar: 0, stack: 1e9, icon: 'coin', gold: true, g: 0, desc: 'Moedas. O vilarejo aceita.' };

/* ---- random properties (bases, modifiers, rarity, damage and DPS): js/48-itemizacao.js ---- */
const BLOCK_DROP = { [CRYPT]: 'tijolo', [DIRT]: 'terra', [GRASS]: 'terra', [STONE]: 'pedra', [DEEP]: 'pedra_escura', [PLANK]: 'madeira' };
const ORE_ITEM = { [COAL]: 'carvao', [COPPER]: 'min_cobre', [IRON]: 'min_ferro', [GOLD]: 'min_ouro', [CRYSTAL]: 'min_cristal' };
const DROPS = {
  slime: [['gel', 0.65, 1, 2], ['pocao', 0.06], ['anel_vida', 0.012]],
  zombie: [['carne', 0.55, 1, 2], ['pocao', 0.08], ['capuz', 0.05], ['botas_couro', 0.05], ['adaga_ferro', 0.03], ['maca_ferro', 0.03]],
  bat: [['asa', 0.55], ['pocao', 0.05], ['amuleto', 0.02], ['anel_vampiro', 0.015]],
  archer: [['osso', 0.6, 1, 2], ['pocao', 0.08], ['botas_couro', 0.03], ['capuz', 0.03], ['adaga_osso', 0.03], ['amuleto_vento', 0.012], ['anel_furia', 0.012]],
  guard: [['osso', 0.65, 1, 3], ['pocao', 0.1], ['escudo_ferro', 0.05], ['escudo_osso', 0.04], ['elmo_ferro', 0.05], ['cota', 0.03], ['lanca_osso', 0.04], ['escudo_torre', 0.03], ['armadura_placas', 0.02], ['broquel', 0.03]],
  ghost: [['ectoplasma', 0.6], ['pocao', 0.1], ['pedra_lunar', 0.015], ['manto_espectral', 0.03], ['coroa_espectral', 0.02], ['lanterna_fantasma', 0.02]],
  skull: [['cranio', 0.45], ['pocao', 0.06], ['talisma_ossos', 0.03], ['anel_espinhos', 0.02]],
  skeleton: [['osso', 0.7, 1, 3], ['pocao', 0.1], ['cutelo', 0.07], ['escudo_ferro', 0.05], ['elmo_ferro', 0.04], ['cota', 0.035], ['botas_ferro', 0.03], ['espada_osso', 0.03], ['escudo_osso', 0.025], ['machado_ferro', 0.03], ['lanca_ferro', 0.03], ['elmo_osso', 0.03], ['couraca_osso', 0.02], ['botas_osso', 0.02], ['maca_osso', 0.02]],
  imp: [['brasa', 0.5], ['pocao', 0.08], ['anel_vampiro', 0.015]],
  hound: [['presa', 0.5], ['pocao', 0.1], ['anel_furia', 0.02], ['grevas_demonio', 0.015]],
  brute: [['chifre', 0.6], ['pocao', 0.12], ['espada_ouro', 0.03], ['escudo_ouro', 0.025], ['elmo_ouro', 0.025], ['manto', 0.025], ['machado_chifre', 0.04], ['elmo_chifres', 0.03], ['grevas_demonio', 0.03], ['escudo_infernal', 0.02]],
  boss: [['lamina_infernal', 1], ['coracao_infernal', 1], ['pocao', 1, 3, 5]],
  lurker: [['olho', 0.6], ['pocao', 0.15], ['espada_ouro', 0.05], ['escudo_ouro', 0.04], ['elmo_ouro', 0.04], ['manto', 0.04], ['pedra_lunar', 0.04], ['lamina_cristal', 0.03], ['adaga_cristal', 0.03], ['lanca_cristal', 0.03], ['maca_ouro', 0.03], ['machado_ouro', 0.02]]
};
const CHEST_LOOT = {
  1: ['capuz', 'botas_couro', 'cutelo', 'escudo_ferro', 'anel_vida', 'amuleto', 'adaga_ferro', 'machado_ferro', 'maca_ferro', 'lanca_ferro', 'broquel'],
  2: ['elmo_ferro', 'cota', 'espada_osso', 'escudo_osso', 'botas_ferro', 'espada_ouro', 'anel_vida', 'adaga_osso', 'maca_osso', 'lanca_osso', 'elmo_osso', 'couraca_osso', 'botas_osso', 'escudo_torre', 'anel_vampiro', 'anel_furia', 'amuleto_vento', 'picareta_ouro'],
  3: ['elmo_ouro', 'manto', 'escudo_ouro', 'lamina_cristal', 'pedra_lunar', 'espada_ouro', 'adaga_cristal', 'machado_ouro', 'maca_ouro', 'lanca_cristal', 'armadura_placas', 'escudo_espinhos', 'anel_espinhos', 'talisma_ossos', 'lanterna_fantasma', 'picareta_cristal', 'elmo_chifres']
};
const ICON_ART = {
  ring: [["..rRRr..", "...rr...", ".yy..yy.", "y......y", "y......y", "y......y", ".yy..yy.", "..yyyy.."], { r: '#d63a4a', R: '#ff9a9a', y: '#e8c04a' }],
  amulet: [["c.......c", ".c.....c.", "..c...c..", "...c.c...", "....c....", "...yyy...", "..yGGGy..", "..yGgGy..", "..yGGGy..", "...yyy..."], { c: '#b5aa92', y: '#e8c04a', G: '#3aa860', g: '#a8f0c0' }],
  moon: [["..bbbb..", ".bBBbbb.", "bBWBbbbb", "bBBbbbbb", "bbbbbbdb", "bbbbbddb", ".bbbddb.", "..bbbb.."], { b: '#8fa8e0', B: '#c8d8ff', W: '#ffffff', d: '#5a70b0' }],
  potion: [["...kk...", "...kk...", "...ww...", "..wRRw..", ".wRrrrw.", ".wrrrrw.", ".wrrrrw.", "..wwww.."], { k: '#8a5a32', w: '#cfe6f0', r: '#d63a4a', R: '#ff9a9a' }],
  torch: [[".yy.", "yYYy", ".yy.", ".ww.", ".ww.", ".ww.", ".WW.", ".WW."], { y: '#ff9a2a', Y: '#fff3b0', w: '#8a5a32', W: '#5f3a20' }],
  gel: [["...gg....", "..gLgg...", ".gLgggg..", "ggggggggg", "gggggggGg", ".GGGGGGG."], { g: '#5ccf4f', L: '#d3f9bd', G: '#2f8a3a' }],
  flesh: [["..pppp..", ".pPpppp.", "ppppGppp", "pppGGppp", "ppppppPp", ".ppppp.."], { p: '#8a4a42', P: '#b07a6a', G: '#7a9a4a' }],
  wing: [["KKk.......", "KkkKk.....", ".KkkkKkk..", "..KkkkkkKk", "...KKkkkkK", ".....KKKK."], { K: '#2b1f36', k: '#6d5684' }],
  bone: [["oo......oo", "ooo....ooo", ".oooooooo.", ".oOOOOOOo.", "ooo....ooo", "oo......oo"], { o: '#ece4cf', O: '#b5aa92' }],
  eye: [["..wwww..", ".wwwwww.", "wwwrrwww", "wwrPPrww", "wwrPPrww", "wwwrrwww", ".wwwwww.", "..wwww.."], { w: '#eadaa8', r: '#b0122a', P: '#ff5d78' }],
  lantern: [["..kkk..", ".k...k.", ".kCcCk.", "kcCWCck", "kcWWWck", "kcCWCck", ".kcccK.", "..kkk.."], { k: '#3a3a42', K: '#5a5a66', c: '#3a8a9a', C: '#7fe8ff', W: '#e8fbff' }],
  ecto: [ART_ICO_ECTO, ART_ICO_ECTO_P], skullI: [ART_ICO_SKULL, ART_ICO_SKULL_P],
  coal: [["...kk.....", "..kKKk.kk.", ".kKkkkkKKk", "kkkkkKkkkk", "kKkkkkkkk.", ".kkk.kkk.."], { k: '#1c1c21', K: '#5a5a66' }],
  coin: [["..yyy..", ".yYYYy.", "yYyyyOy", "yYyOyOy", "yYyyyOy", ".yOOOy.", "..yyy.."], { y: '#d8a020', Y: '#fff0a0', O: '#8a5a0a' }],
  heart: [ART_ICO_HEART, ART_ICO_HEART_P], ember: [ART_ICO_EMBER, ART_ICO_EMBER_P], fang: [ART_ICO_FANG, ART_ICO_FANG_P], horn: [ART_ICO_HORN, ART_ICO_HORN_P]
};
const BAR_ICON = ["...LLLLL..", "..LHHHHHL.", ".LHmmmmmmd", "Lmmmmmmmdd", "ddddddddd."];
// each metal casts its own bar: a long copper bar going green at the corner, a squat hammered iron
// bar, a stamped gold bar with a glint, and a cut crystal bar you can almost see through
const BAR_ICONS = {
  barra_cobre: [[
    "...tTTTTTTTt.",
    "..tTtttttttTe",
    ".tttttttttteE",
    "FFFFFFFFFFFeE",
    "mmmmmsmmmmmEE",
    "gmmmmmmmmmmE.",
    "ggddddddddd.."], { T: '#ffd2a0', t: '#f4914a', F: '#ffb070', m: '#d8692c', s: '#a8481c', d: '#8e3a14', e: '#b4521e', E: '#6e2e10', g: '#3f9c78' }],
  barra_ferro: [[
    "..tTtTTtTt..",
    ".tTtttttttee",
    "FFFFFFFFFFeE",
    "mhhhhmmmrmeE",
    "mmmmmmhmmmEE",
    "mrmmmmmhhhEE",
    "mmmmmmmmmmE.",
    "dddddddddd.."], { T: '#eef1f6', t: '#b4bac8', F: '#d6dbe4', m: '#8a90a0', h: '#a9afbd', r: '#5a5f6c', d: '#3e414b', e: '#646a78', E: '#3a3d46' }],
  barra_ouro: [[
    "..........W.",
    "...tTTTTTWWW",
    "..tTWtttttWe",
    ".tTWttttttee",
    "FFFFFFFFFFeE",
    "mmmsmmsmmmEE",
    "mmmssssmmmEE",
    "dddddddddd.."], { W: '#ffffff', T: '#fff2a6', t: '#f8d65a', F: '#fff6c0', m: '#e2ac22', s: '#b47e0e', d: '#7a4e06', e: '#c08a10', E: '#7a4e06' }],
  barra_cristal: [[
    "...LLLLLLLLL.",
    "..LWLLLLLLLPp",
    ".LWLLLLLLLPpp",
    "FFFFFFFFFFFpd",
    "PPPGPPPPPPPpd",
    "PPPPGPPPPGPdd",
    "pppppppppppd."], { W: '#ffffff', L: '#e6d2ff', F: '#f4e6ff', G: '#e0c8ff', P: '#a66cf6', p: '#6a32c0', d: '#3a1874' }]
};
const ORE_ICON = ["..ssss..", ".sSsoss.", "ssoOssss", "sssssoOs", "sSsossss", ".ssssss."];
// raw ore as a loose chunk, drawn in the same colours as the nodes in the rock
const ORE_ICONS = {
  min_cobre: [[
    "...mhmd...",
    ".mhHmmhmd.",
    ".hHWhhhmdg",
    "dmhhmhmmdG",
    "dmhmmmmddg",
    ".dmmdmddg.",
    "..gdgddg..",
    "....gG...."], { W: '#fff2dc', H: '#ffc58a', h: '#f4914a', m: '#d8692c', d: '#a8481c', g: '#2f8a68', G: '#58b88e' }],
  min_ferro: [[
    "...hHHm...",
    "..hHWHmm..",
    ".hhHHmmmd.",
    "dhhhmmmrdd",
    "dmhmmmRrdd",
    ".dmmmrrdd.",
    "..ddddd..."], { W: '#ffffff', H: '#ced4e0', h: '#9ea5b4', m: '#6f7584', d: '#474b58', r: '#a84e22', R: '#cc6a30' }],
  min_ouro: [[
    "...QwQq...",
    "..yYQqqd..",
    ".yYWyqyYd.",
    "qyYyoqyyod",
    "qQyoqqqodd",
    ".qQqqyYqd.",
    "..qqdyodd.",
    "....ddd..."], { w: '#fffdf6', Q: '#eeeae0', q: '#b8b4ae', d: '#8e8c8e', W: '#ffffff', Y: '#fff2a6', y: '#e2ac22', o: '#b47e0e' }],
  min_cristal: [[
    "....W.....",
    "...LWp....",
    "...LPp.W..",
    ".W.LPpLWp.",
    "LWpLPpLPp.",
    "LPpLPpLPp.",
    "LPpLPpLPp.",
    ".LPpbbPpb.",
    "bbBbbbbBbb"], { W: '#f4e6ff', L: '#b88aff', P: '#8a52e6', p: '#5c2cae', b: '#30364b', B: '#4c5576' }]
};
function oreIconArt(id) { const a = ORE_ICONS[id], it = ITEMS[id]; return a ? fromRows(a[0], a[1]) : fromRows(ORE_ICON, { s: '#6c7078', S: '#8d929b', o: it.ore[1], O: it.ore[2] }); }
const TUNIC_ICON = ["..r....r..", ".rrr..rrr.", "rrrrrrrrrr", "RrrrrrrrrR", ".Rrrrrrrr.", ".bbbbbbBb.", ".Rrrrrrrr.", ".RRrrrrrr.", "RRrrrrrrRR"];
const BOOTS_ICON = [".ss....ss..", ".sS....sS..", ".sS....sS..", ".sSs...sSs.", ".sSss..sSss", "SSSSS..SSSS"];
const lookCache = new Map();
function cached(k, fn) { let v = lookCache.get(k); if (!v) { v = fn(); lookCache.set(k, v); } return v; }
function weaponFor(id) { const it = ITEMS[id]; return cached('w:' + id, () => fromRows(KIND[it.kind || 'sword'].rows, it.pal)); }
function pickFor(id) { return cached('p:' + id, () => fromRows(PICK, ITEMS[id].pal)); }
function shieldFor(id) { return cached('s:' + id, () => ({ face: fromRows(SHIELD_FACE, ITEMS[id].pal), side: fromRows(SHIELD_SIDE, ITEMS[id].pal) })); }
function headFor(id) { return cached('h:' + id, () => ({ img: fromRows(ITEMS[id].art, ITEMS[id].pal), oy: ITEMS[id].oy })); }
function bodyFor(id) { return cached('b:' + (id || '-'), () => { const pal = Object.assign({}, PC, id ? ITEMS[id].pal : BODY_RAGS); return { img: fromRows(PBODY, pal), r: pal.r, R: pal.R }; }); }
function legsFor(id) {
  return cached('l:' + (id || '-'), () => {
    const o = {}, boot = id ? Object.assign({}, PC, ITEMS[id].pal) : PC;
    for (const k in LEGS) { const rows = LEGS[k], c = mk(12, 4), x = c.getContext('2d'); for (let y = 0; y < 4; y++) { const pal = y >= 2 ? boot : PC; for (let i = 0; i < 12; i++) { const col = pal[rows[y][i]]; if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); } } } o[k] = c; }
    return o;
  });
}
const ICON = {};
function makeIcon(id) {
  const it = ITEMS[id], c = mk(13, 13), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const center = img => x.drawImage(img, Math.floor((13 - img.width) / 2), Math.floor((13 - img.height) / 2));
  if (it.slot === 'weapon') { const img = weaponFor(id); x.save(); x.translate(6.5, 6.5); x.rotate(Math.PI / 4); x.drawImage(img, -img.width / 2, -img.height / 2); x.restore(); }
  else if (it.slot === 'tool') center(fromRows(PICK_ICON, it.pal));
  else if (it.slot === 'shield') center(shieldFor(id).face);
  else if (it.slot === 'head') center(fromRows(it.art, it.pal));
  else if (it.slot === 'body') center(fromRows(TUNIC_ICON, it.pal));
  else if (it.slot === 'feet') center(fromRows(BOOTS_ICON, it.pal));
  else if (it.block) center(blockCanvas(it.block, 12, 2, 24, 36));
  else if (it.deco) center(fromRows(ART_CANDLE, ART_CANDLE_P));
  else if (it.icon === 'bar') { const a = BAR_ICONS[id]; center(a ? fromRows(a[0], a[1]) : fromRows(BAR_ICON, { L: it.ore[2], H: it.ore[2], m: it.ore[1], d: it.ore[0] })); }
  else if (it.icon === 'ore') center(oreIconArt(id));
  else { const a = ICON_ART[it.icon]; center(fromRows(a[0], it.iconPal || a[1])); }
  const o = outlined(c); let url = ''; try { url = o.toDataURL(); } catch (e) { }
  return { cv: o, url };
}
function buildIcons() { for (const id in ITEMS) ICON[id] = makeIcon(id); }

/* inventory data */
const INV_N = 38;   // 0-7 = the hotbar row (keys 3 to 0), 8-37 = the backpack (3 rows of 10)
let inv = new Array(INV_N).fill(null);
const equip = Object.fromEntries(EQ_SLOTS.map(k => [k, null]));
let invDirty = true, look = null;
const stackMax = id => ITEMS[id].stack || 1;
function countItem(id) { let n = 0; for (const s of inv) if (s && s.id === id) n += s.n; return n; }
function addItem(id, n = 1) {
  const mx = stackMax(id);
  if (mx > 1) for (const s of inv) { if (n <= 0) break; if (s && s.id === id && s.n < mx) { const k = Math.min(n, mx - s.n); s.n += k; n -= k; } }
  for (let i = 0; i < INV_N && n > 0; i++) if (!inv[i]) { const k = Math.min(n, mx); inv[i] = ITEMS[id].slot ? mkItem(id, 0) : { id, n: k }; n -= k; }
  invDirty = true; return n;
}
function addInst(s) { for (let i = 0; i < INV_N; i++) if (!inv[i]) { inv[i] = s; invDirty = true; return true; } return false; }
function canFit(id) { const mx = stackMax(id); for (const s of inv) { if (!s) return true; if (s.id === id && s.n < mx) return true; } return false; }
function removeItem(id, n = 1) { for (let i = INV_N - 1; i >= 0 && n > 0; i--) { const s = inv[i]; if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (s.n <= 0) inv[i] = null; } } invDirty = true; return n === 0; }
const eqId = k => equip[k] ? equip[k].id : null;
function buildLook() {
  const b = heroBodyFor(eqId('body')), w = eqId('weapon'), K = KIND[w ? ITEMS[w].kind || 'sword' : 'sword'];   // hero art: js/37-heroi.js
  look = { body: b.img, sleeve: b.r, sleeveD: b.R, arm: b.arm, legs: heroLegsFor(eqId('feet')), head: equip.head ? heroHeadFor(eqId('head')) : null, weapon: w ? weaponFor(w) : null, wpx: K.px, wpy: K.py, spear: !!K.thrust, pick: equip.tool ? pickFor(eqId('tool')) : null, shield: equip.shield ? heroShieldFor(eqId('shield')) : null };
}
