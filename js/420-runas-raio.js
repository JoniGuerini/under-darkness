'use strict';

/* ================= runas: as árvores dos cinco feitiços de raio =================
   Os nós próprios de cada feitiço (os comuns vêm de RUNE_GEN em js/340-runas-dados). br: em qual dos dois galhos
   próprios o nó fica. O que cada efeito `g` faz em jogo está em js/341-runas (Arco Voltaico) e js/424-runas-feiticos. */

runeBoard('feitico_arco', { P: ARC, elem: 'raio', skip: ['reach'],
  // o Arco Voltaico já tinha tabuleiro: os nós comuns que viraram comuns guardam o nome de antes no save
  legacy: { dmg: 'sobrecarga', shockC: 'choque', cost: 'fluxo', cd: 'descarga' },
  nodes: [
    { k: 'ricochete', br: 0, par: null, name: 'Ricochete', max: 3, icon: 'ricochete', p: { jumps: 2 }, val: r => `Saltos: ${rnBase('feitico_arco', 'jumps') + 2 * r}` },
    { k: 'corrente', br: 0, par: 'ricochete', name: 'Corrente Firme', max: 3, icon: 'corrente', p: { fall: 0.05 }, val: r => `Cada salto perde ${Math.round((1 - rnBase('feitico_arco', 'fall') - 0.05 * r) * 100)}% do dano` },
    { k: 'bifurcacao', br: 0, par: 'ricochete', name: 'Bifurcação', max: 1, icon: 'bifurcacao', g: { fork: 1 }, val: r => r ? 'No primeiro alvo o raio se divide em dois e a segunda corrente salta metade das vezes' : 'O raio não se divide' },
    { k: 'crescente', br: 0, par: 'corrente', name: 'Corrente Crescente', max: 2, icon: 'veloz', g: { ramp: 0.06 }, val: r => `Cada salto ganha +${6 * r}% de dano em vez de só perder` },
    { k: 'retorno', br: 0, par: 'bifurcacao', name: 'Retorno', max: 1, icon: 'eco', g: { ret: 1 }, val: r => r ? 'Depois do último salto, o raio volta e acerta o primeiro alvo de novo' : 'O raio não volta' },
    { k: 'ultimo', br: 0, par: 'retorno', name: 'Último Elo', max: 1, icon: 'ultimo', g: { last: 1 }, val: r => r ? 'O último alvo da corrente leva o dobro do dano' : 'O último alvo leva o dano normal' },
    { k: 'estouro', br: 0, par: 'ultimo', name: 'Estouro', max: 2, icon: 'explosao', g: { endNova: 0.4 }, val: r => r ? `O último alvo estoura em faíscas em volta (${40 * r}% do dano)` : 'O último alvo não estoura' },
    { k: 'alcance', br: 1, par: null, name: 'Alcance', max: 2, icon: 'alcance', p: { reach: 25 }, val: r => `Alcance do primeiro alvo: ${rnB(rnBase('feitico_arco', 'reach') + 25 * r)}` },
    { k: 'salto', br: 1, par: 'alcance', name: 'Salto Longo', max: 3, icon: 'salto', pm: { hop: 0.2 }, val: r => `Distância de um salto: ${rnB(rnBase('feitico_arco', 'hop') * (1 + 0.2 * r))}` },
    { k: 'atravessa', br: 1, par: 'salto', name: 'Atravessar', max: 1, icon: 'perfura', g: { ghost: 1 }, val: r => r ? 'Os saltos passam através das paredes' : 'Os saltos param nas paredes' },
    { k: 'gemeo', br: 1, par: 'alcance', name: 'Arco Gêmeo', max: 1, icon: 'tres', g: { twin: 1 }, val: r => r ? 'Sai um segundo arco da mão para o outro inimigo mais perto da mira' : 'Sai um arco só' },
    { k: 'primeiro', br: 1, par: 'gemeo', name: 'Ponta de Lança', max: 2, icon: 'adaga', g: { first: 0.2 }, val: r => `O primeiro alvo leva +${20 * r}% de dano` },
    { k: 'carga', br: 1, par: 'primeiro', name: 'Carga Única', max: 2, icon: 'sobrecarga', g: { solo: 0.4 }, val: r => `Se só houver um inimigo para acertar, ele leva +${40 * r}%` }
  ] });

runeBoard('feitico_relampago', { P: ESC.relampago, elem: 'raio',
  nodes: [
    { k: 'largura', br: 0, par: null, name: 'Raio Largo', max: 3, icon: 'area', p: { w: 2 }, val: r => `Largura do raio: +${4 * r} pixels` },
    { k: 'rapido', br: 0, par: 'largura', name: 'Queda Rápida', max: 2, icon: 'veloz', pm: { delay: -0.2 }, val: r => `Cai ${20 * r}% mais rápido` },
    { k: 'atordoa', br: 0, par: 'largura', name: 'Estrondo', max: 3, icon: 'choque', p: { stun: 0.2 }, val: r => `Atordoa por ${rnS(rnBase('feitico_relampago', 'stun') + 0.2 * r)}` },
    { k: 'tempestade', br: 0, par: 'rapido', name: 'Tempestade', max: 2, icon: 'tres', g: { storm: 1 }, val: r => r ? `Caem mais ${r} raio${r > 1 ? 's' : ''} em volta da mira` : 'Cai um raio só' },
    { k: 'replica', br: 0, par: 'atordoa', name: 'Réplica', max: 1, icon: 'eco', g: { after: 1 }, val: r => r ? 'Meio segundo depois, um segundo raio cai no mesmo lugar' : 'Cai uma vez só' },
    { k: 'cacador', br: 1, par: null, name: 'Caçador', max: 1, icon: 'ima', g: { seek: 1 }, val: r => r ? 'O raio cai no inimigo mais perto da mira' : 'O raio cai onde está a mira' },
    { k: 'faiscas', br: 1, par: 'cacador', name: 'Faíscas no Chão', max: 2, icon: 'onda', g: { sparks: 0.4 }, val: r => r ? `Ao cair, faíscas correm pelo chão dos dois lados (${40 * r}% do dano)` : 'O raio não espalha no chão' },
    { k: 'ramifica', br: 1, par: 'cacador', name: 'Ramificar', max: 2, icon: 'bifurcacao', g: { branch: 1 }, val: r => r ? `O raio salta para ${r} inimigo${r > 1 ? 's' : ''} perto de onde caiu` : 'O raio não salta' },
    { k: 'campo', br: 1, par: 'faiscas', name: 'Chão Carregado', max: 2, icon: 'choque', g: { field: 0.25 }, val: r => r ? `O chão onde caiu fica carregado por 2 s e dá choque em quem pisa (${25 * r}% do dano)` : 'O chão não fica carregado' }
  ] });

runeBoard('feitico_lanca_raio', { P: ESC.lanca_raio, elem: 'raio',
  nodes: [
    { k: 'veloz', br: 0, par: null, name: 'Lança Veloz', max: 2, icon: 'veloz', pm: { spd: 0.15 }, val: r => `Velocidade: +${15 * r}%` },
    { k: 'longe', br: 0, par: 'veloz', name: 'Lança Longa', max: 3, icon: 'alcance', pm: { len: 0.2 }, val: r => `Alcance: ${rnB(rnBase('feitico_lanca_raio', 'len') * (1 + 0.2 * r))}` },
    { k: 'leque', br: 0, par: 'veloz', name: 'Leque', max: 2, icon: 'tres', g: { fan: 1 }, val: r => r ? `Saem mais ${r * 2} lanças em leque` : 'Sai uma lança só' },
    { k: 'carga', br: 0, par: 'longe', name: 'Carga Crescente', max: 2, icon: 'sobrecarga', g: { pierceUp: 0.1 }, val: r => `Cada inimigo atravessado dá +${10 * r}% de dano no próximo` },
    { k: 'grossa', br: 0, par: 'leque', name: 'Lança Grossa', max: 2, icon: 'area', g: { fat: 2 }, val: r => r ? `A lança acerta quem passa até ${2 * r} pixels a mais de distância` : 'A lança só acerta quem toca' },
    { k: 'ricochete', br: 1, par: null, name: 'Ricochete', max: 2, icon: 'ricochete', g: { bounce: 1 }, val: r => r ? `Bate na parede e volta ${r} vez${r > 1 ? 'es' : ''}` : 'Some na parede' },
    { k: 'retorno', br: 1, par: 'ricochete', name: 'Bumerangue', max: 1, icon: 'eco', g: { ret: 1 }, val: r => r ? 'No fim do caminho, a lança volta para o herói acertando de novo' : 'A lança não volta' },
    { k: 'atordoa', br: 1, par: 'ricochete', name: 'Ponta Paralisante', max: 1, icon: 'choque', g: { stunFirst: 0.5 }, val: r => r ? 'O primeiro inimigo atravessado fica atordoado por meio segundo' : 'Sem atordoar a mais' },
    { k: 'rastro', br: 1, par: 'retorno', name: 'Rastro Estático', max: 2, icon: 'onda', g: { trail: 0.25 }, val: r => r ? `O caminho da lança chia por 1 s e dá choque em quem toca (${25 * r}% do dano)` : 'A lança não deixa rastro' },
    { k: 'explode', br: 1, par: 'atordoa', name: 'Ponta Explosiva', max: 2, icon: 'explosao', g: { endBoom: 0.6 }, val: r => r ? `No fim, a lança estoura em volta (${60 * r}% do dano)` : 'A lança some sem estourar' }
  ] });

runeBoard('feitico_passo', { P: ESC.passo, elem: 'raio', near: true, skip: ['reach'],
  nodes: [
    { k: 'longe', br: 0, par: null, name: 'Passo Longo', max: 3, icon: 'salto', p: { reach: 20 }, val: r => `Distância do salto: ${rnB(rnBase('feitico_passo', 'reach') + 20 * r)}` },
    { k: 'inv', br: 0, par: 'longe', name: 'Intocável', max: 2, icon: 'escudo', p: { inv: 0.15 }, val: r => `Sem levar dano por ${rnS(rnBase('feitico_passo', 'inv') + 0.15 * r)} depois do salto` },
    { k: 'chegada', br: 0, par: 'longe', name: 'Chegada Trovejante', max: 2, icon: 'explosao', g: { land: 0.7 }, val: r => r ? `Ao chegar, um estouro fere quem está em volta (${70 * r}% do dano)` : 'A chegada não estoura' },
    { k: 'partida', br: 0, par: 'inv', name: 'Partida', max: 1, icon: 'onda', g: { depart: 0.5 }, val: r => r ? 'Ao sair, um estouro fere quem ficou para trás (50% do dano)' : 'A saída não estoura' },
    { k: 'trovoada', br: 0, par: 'chegada', name: 'Trovoada', max: 1, icon: 'sobrecarga', g: { thunder: 1 }, val: r => r ? 'Um raio cai do alto onde o herói chega' : 'Nenhum raio cai na chegada' },
    { k: 'rastro', br: 1, par: null, name: 'Rastro de Raio', max: 2, icon: 'corrente', g: { trail: 0.3 }, val: r => r ? `O caminho fica eletrizado por 1,5 s (${30 * r}% do dano em quem toca)` : 'O caminho não fica eletrizado' },
    { k: 'atordoa', br: 1, par: 'rastro', name: 'Atropelo', max: 1, icon: 'choque', g: { stunPass: 0.6 }, val: r => r ? 'Quem o herói atravessa fica atordoado por 0,6 s' : 'Sem atordoar a mais' },
    { k: 'duplo', br: 1, par: 'rastro', name: 'Passo Duplo', max: 2, icon: 'eco', g: { reset: 0.2 }, val: r => `${20 * r}% de chance de a recarga zerar` },
    { k: 'vampiro', br: 1, par: 'atordoa', name: 'Vampiro do Trovão', max: 2, icon: 'coracao', g: { lifePass: 1 }, val: r => `+${r} de vida por inimigo atravessado` },
    { k: 'mana', br: 1, par: 'duplo', name: 'Carga Roubada', max: 2, icon: 'fluxo', g: { manaPass: 1 }, val: r => `+${r} de mana por inimigo atravessado` }
  ] });

runeBoard('feitico_pararaios', { P: ESC.pararaios, elem: 'raio',
  nodes: [
    { k: 'dura', br: 0, par: null, name: 'Essência Duradoura', max: 3, icon: 'relogio', p: { dur: 1.5 }, val: r => `Fica no ar por ${rnS(rnBase('feitico_pararaios', 'dur') + 1.5 * r)}` },
    { k: 'alcance', br: 0, par: 'dura', name: 'Campo Largo', max: 3, icon: 'area', p: { range: 8 }, val: r => `Alcance do choque: ${rnB(rnBase('feitico_pararaios', 'range') + 8 * r)}` },
    { k: 'pulso', br: 0, par: 'dura', name: 'Pulso Rápido', max: 2, icon: 'veloz', pm: { pulse: -0.12 }, val: r => `Pulsa ${12 * r}% mais rápido` },
    { k: 'alvos', br: 0, par: 'alcance', name: 'Mais Fios', max: 3, icon: 'tres', p: { n: 1 }, val: r => `Acerta até ${rnBase('feitico_pararaios', 'n') + r} inimigos por pulso` },
    { k: 'sobrecarga', br: 0, par: 'pulso', name: 'Acúmulo', max: 2, icon: 'sobrecarga', g: { ramp: 0.05 }, val: r => `Cada pulso dá +${5 * r}% de dano (até +${50 * r}%)` },
    { k: 'duas', br: 1, par: null, name: 'Par de Essências', max: 1, icon: 'eco', g: { two: 1 }, val: r => r ? 'Duas essências podem ficar no ar ao mesmo tempo' : 'Uma essência por vez' },
    { k: 'segue', br: 1, par: 'duas', name: 'Caçadora', max: 1, icon: 'ima', g: { follow: 1 }, val: r => r ? 'A essência anda devagar até o inimigo mais perto' : 'A essência fica parada' },
    { k: 'atrai', br: 1, par: 'duas', name: 'Atração', max: 1, icon: 'ima', g: { pull: 1 }, val: r => r ? 'Cada choque puxa o inimigo um pouco para a essência' : 'O choque não puxa' },
    { k: 'final', br: 1, par: 'segue', name: 'Último Suspiro', max: 2, icon: 'explosao', g: { endBoom: 1.5 }, val: r => r ? `Ao sumir, a essência explode (${150 * r}% do dano)` : 'A essência some em silêncio' }
  ] });
