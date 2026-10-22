'use strict';

/* ================= runas: as árvores dos cinco feitiços de fogo =================
   Os nós próprios de cada feitiço (os comuns vêm de RUNE_GEN em js/340-runas-dados). br: em qual dos dois galhos
   próprios o nó fica. O que cada efeito `g` faz em jogo está em js/424-runas-feiticos. */

runeBoard('feitico_bola', { P: FOGO.bola, elem: 'fogo',
  nodes: [
    { k: 'veloz', br: 0, par: null, name: 'Bola Veloz', max: 2, icon: 'veloz', pm: { spd: 0.15 }, val: r => `Velocidade: +${15 * r}%` },
    { k: 'grande', br: 0, par: 'veloz', name: 'Explosão Larga', max: 3, icon: 'area', p: { r: 5 }, val: r => `Raio da explosão: ${rnB(rnBase('feitico_bola', 'r') + 5 * r)}` },
    { k: 'voo', br: 0, par: 'veloz', name: 'Longo Voo', max: 2, icon: 'alcance', g: { fly: 0.02 }, val: r => `+${2 * r}% de dano por bloco que a bola voou (até +${40 * r}%)` },
    { k: 'quica', br: 0, par: 'grande', name: 'Quicar', max: 2, icon: 'ricochete', g: { bounce: 1 }, val: r => r ? `Bate na parede e volta ${r} vez${r > 1 ? 'es' : ''} antes de explodir` : 'Explode na parede' },
    { k: 'busca', br: 0, par: 'voo', name: 'Bola Faminta', max: 1, icon: 'ima', g: { seek: 1 }, val: r => r ? 'A bola vira devagar na direção do inimigo mais perto' : 'A bola vai reto' },
    { k: 'leque', br: 1, par: null, name: 'Leque', max: 2, icon: 'tres', g: { fan: 1 }, val: r => r ? `Saem mais ${r * 2} bolas em leque` : 'Sai uma bola só' },
    { k: 'divide', br: 1, par: 'leque', name: 'Dividir', max: 2, icon: 'bifurcacao', g: { split: 3 }, val: r => r ? `Ao explodir, solta ${3 * r} bolinhas que também explodem` : 'Explode uma vez só' },
    { k: 'rastro', br: 1, par: 'leque', name: 'Chão em Brasa', max: 2, icon: 'parede', g: { floor: 1 }, val: r => r ? `A explosão deixa o chão em chamas por ${1 + r} s` : 'O chão não pega fogo' },
    { k: 'faisca', br: 1, par: 'divide', name: 'Rastro de Faíscas', max: 1, icon: 'chama', g: { sparks: 1 }, val: r => r ? 'A bola solta faíscas no caminho que acendem quem tocam' : 'A bola voa limpa' }
  ] });

runeBoard('feitico_inferno', { P: FOGO.inferno, elem: 'fogo', near: true,
  nodes: [
    { k: 'longo', br: 0, par: null, name: 'Sopro Longo', max: 3, icon: 'alcance', pm: { len: 0.12 }, val: r => `Alcance do sopro: +${12 * r}%` },
    { k: 'largo', br: 0, par: 'longo', name: 'Leque de Chamas', max: 2, icon: 'area', pm: { ang: 0.12 }, val: r => `Abertura: +${12 * r}%` },
    { k: 'rapido', br: 0, par: 'longo', name: 'Fogo Voraz', max: 2, icon: 'veloz', pm: { tick: -0.12 }, val: r => `Queima ${12 * r}% mais vezes por segundo` },
    { k: 'fole', br: 0, par: 'largo', name: 'Fole', max: 1, icon: 'onda', g: { push: 1 }, val: r => r ? 'O sopro empurra quem ele queima' : 'O sopro não empurra' },
    { k: 'brasas', br: 0, par: 'largo', name: 'Brasas', max: 2, icon: 'chama', g: { embers: 1 }, val: r => r ? 'Brasas caem do jato e queimam o chão por um instante' : 'Sem brasas no chão' },
    { k: 'faisca', br: 0, par: 'rapido', name: 'Fagulha', max: 2, icon: 'tres', g: { ignNear: 0.1 }, val: r => `${10 * r}% de chance de o fogo pular para quem está perto do alvo` },
    { k: 'fumaca', br: 0, par: 'fole', name: 'Fumaça', max: 2, icon: 'nuvem', g: { smoke: 0.3 }, val: r => r ? `Quem é queimado demora +${rnS(0.3 * r)} para atacar` : 'A fumaça não atrapalha' },
    { k: 'crescente', br: 1, par: null, name: 'Fôlego Crescente', max: 2, icon: 'sobrecarga', g: { ramp: 0.04 }, val: r => `+${4 * r}% de dano por segundo soprando (até +${40 * r}%)` },
    { k: 'pavio', br: 1, par: 'crescente', name: 'Pavio Curto', max: 2, icon: 'explosao', g: { start: 0.5 }, val: r => `No primeiro meio segundo, +${50 * r}% de dano` },
    { k: 'azul', br: 1, par: 'crescente', name: 'Chama Azul', max: 2, icon: 'crit', g: { blue: 0.05 }, val: r => `Depois de 2 s soprando, +${5 * r}% de chance de crítico` },
    { k: 'bolas', br: 1, par: 'pavio', name: 'Cuspe', max: 1, icon: 'pedra', g: { puffs: 1 }, val: r => r ? 'A cada 1,2 s soprando, sai uma bola de fogo pequena' : 'Só sai chama' },
    { k: 'dragao', br: 1, par: 'azul', name: 'Fôlego de Dragão', max: 2, icon: 'cobra', g: { roar: 1.5 }, val: r => r ? `A cada 2,5 s soprando sem parar, uma explosão na ponta do jato (${150 * r}% do dano)` : 'Sem explosão' },
    { k: 'calor', br: 1, par: 'bolas', name: 'Muralha de Calor', max: 2, icon: 'escudo', g: { heat: 0.1 }, val: r => r ? `Soprando, leva ${10 * r}% menos dano de quem está na frente` : 'Sem proteção' },
    { k: 'eterno', br: 1, par: 'dragao', name: 'Fogo Eterno', max: 1, icon: 'relogio', g: { bossBurn: 1 }, val: r => r ? 'Chefes queimados pelo sopro queimam pelo dobro do tempo' : 'Chefes queimam o tempo normal' }
  ] });

runeBoard('feitico_parede', { P: FOGO.parede, elem: 'fogo',
  nodes: [
    { k: 'larga', br: 0, par: null, name: 'Parede Larga', max: 3, icon: 'area', p: { w: 12 }, val: r => `Largura: ${rnB(rnBase('feitico_parede', 'w') + 12 * r)}` },
    { k: 'dura', br: 0, par: 'larga', name: 'Fogo Teimoso', max: 3, icon: 'relogio', p: { dur: 1 }, val: r => `Fica acesa por ${rnS(rnBase('feitico_parede', 'dur') + r)}` },
    { k: 'alta', br: 0, par: 'larga', name: 'Labaredas Altas', max: 2, icon: 'chama', p: { h: 6 }, val: r => `Altura: +${6 * r} pixels` },
    { k: 'rapida', br: 0, par: 'dura', name: 'Fogo Faminto', max: 2, icon: 'veloz', pm: { tick: -0.12 }, val: r => `Queima ${12 * r}% mais vezes por segundo` },
    { k: 'muralha', br: 0, par: 'alta', name: 'Muralha', max: 1, icon: 'escudo', g: { block: 1 }, val: r => r ? 'Quem encosta na parede é jogado para trás' : 'Dá para atravessar a parede' },
    { k: 'dupla', br: 1, par: null, name: 'Duas Paredes', max: 1, icon: 'parede', g: { twin: 1 }, val: r => r ? 'Sobe uma segunda parede do lado da primeira' : 'Sobe uma parede só' },
    { k: 'avanca', br: 1, par: 'dupla', name: 'Parede que Anda', max: 1, icon: 'veloz', g: { move: 1 }, val: r => r ? 'A parede anda devagar para longe do herói' : 'A parede fica parada' },
    { k: 'explode', br: 1, par: 'dupla', name: 'Desabar', max: 2, icon: 'explosao', g: { endBoom: 1 }, val: r => r ? `Quando apaga, a parede explode inteira (${100 * r}% do dano)` : 'A parede só se apaga' },
    { k: 'cura', br: 1, par: 'avanca', name: 'Fogueira', max: 2, icon: 'coracao', g: { heal: 1 }, val: r => r ? `De pé dentro da parede, o herói ganha ${r} de vida por segundo` : 'O fogo não cura' }
  ] });

runeBoard('feitico_meteoro', { P: FOGO.meteoro, elem: 'fogo',
  nodes: [
    { k: 'rapido', br: 0, par: null, name: 'Queda Rápida', max: 2, icon: 'veloz', pm: { delay: -0.15 }, val: r => `Cai ${15 * r}% mais rápido` },
    { k: 'cratera', br: 0, par: 'rapido', name: 'Cratera', max: 3, icon: 'area', p: { r: 6 }, val: r => `Raio da explosão: ${rnB(rnBase('feitico_meteoro', 'r') + 6 * r)}` },
    { k: 'chamas', br: 0, par: 'rapido', name: 'Chão Ardente', max: 2, icon: 'parede', p: { patch: 1 }, val: r => `O chão queima por ${rnS(rnBase('feitico_meteoro', 'patch') + r)}` },
    { k: 'calor', br: 0, par: 'chamas', name: 'Calor Residual', max: 2, icon: 'chama', g: { patchDmg: 0.5 }, val: r => `O chão em chamas fere +${50 * r}%` },
    { k: 'pesado', br: 0, par: 'cratera', name: 'Onda de Choque', max: 1, icon: 'cima', g: { launch: 1 }, val: r => r ? 'A explosão joga os inimigos para o alto' : 'A explosão não levanta ninguém' },
    { k: 'chuva', br: 1, par: null, name: 'Chuva de Meteoros', max: 2, icon: 'tres', g: { extra: 1 }, val: r => r ? `Caem mais ${r} meteoro${r > 1 ? 's' : ''} em volta, logo depois` : 'Cai um meteoro só' },
    { k: 'mira', br: 1, par: 'chuva', name: 'Olho do Céu', max: 1, icon: 'ima', g: { seek: 1 }, val: r => r ? 'O meteoro cai no inimigo mais perto da mira' : 'O meteoro cai na mira' },
    { k: 'atordoa', br: 1, par: 'chuva', name: 'Estremecer', max: 2, icon: 'choque', g: { stun: 0.6 }, val: r => r ? `Quem a explosão acerta fica atordoado por ${rnS(0.6 * r)}` : 'A explosão não atordoa' },
    { k: 'estilhacos', br: 1, par: 'mira', name: 'Estilhaços', max: 2, icon: 'pedra', g: { rocks: 4 }, val: r => r ? `A explosão lança ${4 * r} pedras em brasa` : 'A explosão não lança pedras' }
  ] });

runeBoard('feitico_hidra', { P: FOGO.hidra, elem: 'fogo',
  nodes: [
    { k: 'vida', br: 0, par: null, name: 'Hidra Velha', max: 3, icon: 'relogio', p: { dur: 2 }, val: r => `Fica de pé por ${rnS(rnBase('feitico_hidra', 'dur') + 2 * r)}` },
    { k: 'rapida', br: 0, par: 'vida', name: 'Cuspe Rápido', max: 3, icon: 'veloz', pm: { rate: -0.1 }, val: r => `Cospe ${10 * r}% mais rápido` },
    { k: 'alcance', br: 0, par: 'vida', name: 'Olhos de Cobra', max: 2, icon: 'olho', p: { range: 20 }, val: r => `Enxerga até ${rnB(rnBase('feitico_hidra', 'range') + 20 * r)}` },
    { k: 'cabecas', br: 0, par: 'rapida', name: 'Ninho', max: 2, icon: 'cobra', p: { n: 1 }, val: r => `Até ${rnBase('feitico_hidra', 'n') + r} hidras ao mesmo tempo` },
    { k: 'veloz', br: 0, par: 'alcance', name: 'Cuspe Veloz', max: 2, icon: 'alcance', pm: { spd: 0.2 }, val: r => `As bolas voam ${20 * r}% mais rápido` },
    { k: 'dupla', br: 1, par: null, name: 'Duas Línguas', max: 1, icon: 'tres', g: { twin: 1 }, val: r => r ? 'Cada cuspe sai dobrado, em leque' : 'Cospe uma bola por vez' },
    { k: 'explosiva', br: 1, par: 'dupla', name: 'Cuspe Explosivo', max: 2, icon: 'explosao', g: { boltBoom: 0.6 }, val: r => r ? `As bolas estouram em volta (${60 * r}% do dano)` : 'As bolas só acertam quem tocam' },
    { k: 'mordida', br: 1, par: 'dupla', name: 'Mordida', max: 1, icon: 'adaga', g: { bite: 1 }, val: r => r ? 'A hidra morde quem chega perto dela' : 'A hidra só cospe' },
    { k: 'morte', br: 1, par: 'explosiva', name: 'Última Chama', max: 2, icon: 'chama', g: { endBoom: 1.2 }, val: r => r ? `Quando some, a hidra explode (${120 * r}% do dano)` : 'A hidra some em brasas' }
  ] });
