'use strict';

/* ================= runas: as árvores dos cinco feitiços de gelo =================
   Os nós próprios de cada feitiço (os comuns vêm de RUNE_GEN em js/340-runas-dados). br: em qual dos dois galhos
   próprios o nó fica. O que cada efeito `g` faz em jogo está em js/424-runas-feiticos. */

runeBoard('feitico_nevasca', { P: NEV, elem: 'gelo',
  nodes: [
    { k: 'duracao', br: 0, par: null, name: 'Inverno Longo', max: 3, icon: 'relogio', p: { dur: 0.6 }, val: r => `A neve cai por ${rnS(rnBase('feitico_nevasca', 'dur') + 0.6 * r)}` },
    { k: 'largura', br: 0, par: 'duracao', name: 'Nuvem Larga', max: 3, icon: 'area', p: { r: 6 }, val: r => `Largura da nuvem: ${rnB(2 * (rnBase('feitico_nevasca', 'r') + 6 * r))}` },
    { k: 'densa', br: 0, par: 'duracao', name: 'Neve Densa', max: 3, icon: 'tres', pm: { rate: 0.15 }, val: r => `+${15 * r}% de fragmentos por segundo` },
    { k: 'granizo', br: 0, par: 'densa', name: 'Granizo', max: 2, icon: 'pedra', g: { hail: 0.08 }, val: r => `${8 * r}% dos fragmentos são pedras de granizo com o triplo do dano` },
    { k: 'geada', br: 0, par: 'largura', name: 'Geada', max: 1, icon: 'floco', g: { frost: 1 }, val: r => r ? 'Depois da neve, o chão fica com geada por 2 s e resfria quem pisa' : 'A neve não deixa geada' },
    { k: 'pesada', br: 0, par: 'densa', name: 'Fragmentos Pesados', max: 1, icon: 'floco', g: { shardStacks: 1 }, val: r => r ? 'Cada fragmento soma 2 para congelar' : 'Cada fragmento soma 1 para congelar' },
    { k: 'segue', br: 1, par: null, name: 'Nuvem Mansa', max: 1, icon: 'ima', g: { follow: 1 }, val: r => r ? 'A nuvem anda devagar atrás da mira' : 'A nuvem fica parada' },
    { k: 'dupla', br: 1, par: 'segue', name: 'Duas Nuvens', max: 1, icon: 'nuvem', g: { twin: 1 }, val: r => r ? 'Abre uma segunda nuvem do lado' : 'Abre uma nuvem só' },
    { k: 'fim', br: 1, par: 'segue', name: 'Último Sopro', max: 2, icon: 'onda', g: { endNova: 1 }, val: r => r ? `No fim, a nuvem desaba num anel de gelo (${100 * r}% do dano, soma ${r + 1} para congelar)` : 'A nuvem se desfaz' },
    { k: 'alcance', br: 1, par: 'dupla', name: 'Céu Distante', max: 2, icon: 'alcance', p: { reach: 25 }, val: r => `A nuvem abre até ${rnB(rnBase('feitico_nevasca', 'reach') + 25 * r)} do herói` }
  ], skip: ['reach'] });

runeBoard('feitico_lanca_gelo', { P: ESC.lanca_gelo, elem: 'gelo',
  nodes: [
    { k: 'veloz', br: 0, par: null, name: 'Estaca Veloz', max: 2, icon: 'veloz', pm: { spd: 0.15 }, val: r => `Velocidade: +${15 * r}%` },
    { k: 'longe', br: 0, par: 'veloz', name: 'Estaca Longa', max: 2, icon: 'alcance', pm: { len: 0.2 }, val: r => `Alcance: ${rnB(rnBase('feitico_lanca_gelo', 'len') * (1 + 0.2 * r))}` },
    { k: 'pesada', br: 0, par: 'veloz', name: 'Estaca Pesada', max: 2, icon: 'floco', p: { stacks: 1 }, val: r => `Soma ${rnBase('feitico_lanca_gelo', 'stacks') + r} para congelar` },
    { k: 'perfura', br: 0, par: 'longe', name: 'Perfurar', max: 2, icon: 'perfura', g: { pierce: 1 }, val: r => r ? `Atravessa ${r} inimigo${r > 1 ? 's' : ''} antes de quebrar` : 'Quebra no primeiro inimigo' },
    { k: 'ricochete', br: 0, par: 'perfura', name: 'Ricochete', max: 1, icon: 'ricochete', g: { bounce: 1 }, val: r => r ? 'Bate na parede e volta uma vez' : 'Quebra na parede' },
    { k: 'leque', br: 1, par: null, name: 'Leque', max: 2, icon: 'tres', g: { fan: 1 }, val: r => r ? `Saem mais ${r * 2} estacas em leque` : 'Sai uma estaca só' },
    { k: 'estilhaco', br: 1, par: 'leque', name: 'Estilhaço', max: 2, icon: 'explosao', g: { shards: 3 }, val: r => r ? `Ao quebrar, solta ${3 * r} lascas para a frente` : 'Quebra sem soltar lascas' },
    { k: 'congela', br: 1, par: 'leque', name: 'Golpe no Frio', max: 2, icon: 'floco', g: { chilledStacks: 1 }, val: r => `Em quem já está resfriado, soma +${r} para congelar` },
    { k: 'gelada', br: 1, par: 'estilhaco', name: 'Respingo Gelado', max: 2, icon: 'onda', g: { splash: 0.5 }, val: r => r ? `Ao quebrar, resfria e fere quem está em volta (${50 * r}% do dano)` : 'Só fere quem toca' },
    { k: 'pico', br: 1, par: 'congela', name: 'Pico de Gelo', max: 1, icon: 'espinho', g: { spike: 1 }, val: r => r ? 'Onde a estaca quebra, brota um espinho de gelo do chão' : 'A estaca só se quebra' }
  ] });

runeBoard('feitico_nova_gelo', { P: ESC.nova_gelo, elem: 'gelo', near: true,
  nodes: [
    { k: 'raio', br: 0, par: null, name: 'Anel Largo', max: 3, icon: 'area', p: { r: 10 }, val: r => `Raio do anel: ${rnB(rnBase('feitico_nova_gelo', 'r') + 10 * r)}` },
    { k: 'rapida', br: 0, par: 'raio', name: 'Anel Rápido', max: 2, icon: 'veloz', pm: { grow: -0.2 }, val: r => `Abre ${20 * r}% mais rápido` },
    { k: 'pesada', br: 0, par: 'raio', name: 'Frio Pesado', max: 2, icon: 'floco', p: { stacks: 1 }, val: r => `Soma ${rnBase('feitico_nova_gelo', 'stacks') + r} para congelar` },
    { k: 'empurra', br: 0, par: 'rapida', name: 'Rajada', max: 1, icon: 'onda', set: { push: 1 }, val: r => r ? 'O anel empurra quem ele acerta' : 'O anel não empurra' },
    { k: 'centro', br: 0, par: 'pesada', name: 'Olho do Inverno', max: 2, icon: 'ultimo', g: { center: 0.4 }, val: r => `Quem está colado no herói leva +${40 * r}%` },
    { k: 'dupla', br: 1, par: null, name: 'Segundo Anel', max: 1, icon: 'eco', g: { twin: 1 }, val: r => r ? 'Um segundo anel sai meio segundo depois' : 'Sai um anel só' },
    { k: 'geada', br: 1, par: 'dupla', name: 'Chão de Geada', max: 2, icon: 'floco', g: { frostRing: 1 }, val: r => r ? `O chão em volta fica com geada por ${r * 2} s e resfria quem pisa` : 'O anel não deixa geada' },
    { k: 'puxa', br: 1, par: 'dupla', name: 'Vórtice', max: 1, icon: 'ima', g: { pull: 1 }, val: r => r ? 'Quem o anel acerta é puxado para perto do herói' : 'O anel não puxa' },
    { k: 'armadura', br: 1, par: 'geada', name: 'Armadura de Gelo', max: 2, icon: 'escudo', g: { armor: 0.15 }, val: r => r ? `Depois de lançar, leva ${15 * r}% menos dano por 2 s` : 'Sem armadura' },
    { k: 'lascas', br: 1, par: 'puxa', name: 'Coroa de Lascas', max: 1, icon: 'explosao', g: { ringShards: 8 }, val: r => r ? 'Quando o anel termina, 8 lascas voam para todo lado' : 'O anel só se desfaz' }
  ] });

runeBoard('feitico_estacas', { P: ESC.estacas, elem: 'gelo', near: true,
  nodes: [
    { k: 'mais', br: 0, par: null, name: 'Fileira Longa', max: 3, icon: 'tres', p: { n: 2 }, val: r => `${rnBase('feitico_estacas', 'n') + 2 * r} espinhos` },
    { k: 'altas', br: 0, par: 'mais', name: 'Espinhos Altos', max: 2, icon: 'espinho', p: { h: 4 }, val: r => `Altura: +${4 * r} pixels` },
    { k: 'duram', br: 0, par: 'mais', name: 'Gelo Firme', max: 2, icon: 'relogio', p: { life: 0.3 }, val: r => `Ficam de pé por ${rnS(rnBase('feitico_estacas', 'life') + 0.3 * r)}` },
    { k: 'espaco', br: 0, par: 'altas', name: 'Passo Largo', max: 2, icon: 'salto', p: { gap: 2 }, val: r => `Espaço entre os espinhos: +${2 * r} pixels` },
    { k: 'veloz', br: 0, par: 'duram', name: 'Brotar Rápido', max: 2, icon: 'veloz', pm: { step: -0.25 }, val: r => `Brotam ${25 * r}% mais rápido` },
    { k: 'pesada', br: 1, par: null, name: 'Frio Cortante', max: 2, icon: 'floco', p: { stacks: 1 }, val: r => `Soma ${rnBase('feitico_estacas', 'stacks') + r} para congelar` },
    { k: 'lados', br: 1, par: 'pesada', name: 'Dois Lados', max: 1, icon: 'bifurcacao', g: { both: 1 }, val: r => r ? 'Brota uma fileira para cada lado' : 'Brota só para a frente' },
    { k: 'lancam', br: 1, par: 'pesada', name: 'Catapulta', max: 1, icon: 'cima', g: { launch: 1 }, val: r => r ? 'Os espinhos jogam os inimigos para o alto' : 'Os espinhos não levantam ninguém' },
    { k: 'segunda', br: 1, par: 'lados', name: 'Segunda Onda', max: 1, icon: 'eco', g: { again: 1 }, val: r => r ? 'Uma segunda fileira brota logo depois' : 'Brota uma fileira só' },
    { k: 'final', br: 1, par: 'lancam', name: 'Ponta Final', max: 1, icon: 'explosao', g: { bigEnd: 1 }, val: r => r ? 'O último espinho explode em lascas' : 'O último espinho só derrete' }
  ] });

runeBoard('feitico_orbe', { P: ESC.orbe, elem: 'gelo',
  nodes: [
    { k: 'dura', br: 0, par: null, name: 'Orbe Lento', max: 3, icon: 'relogio', p: { dur: 0.6 }, val: r => `Dura ${rnS(rnBase('feitico_orbe', 'dur') + 0.6 * r)}` },
    { k: 'chuva', br: 0, par: 'dura', name: 'Chuva de Lascas', max: 3, icon: 'tres', pm: { rate: 0.2 }, val: r => `+${20 * r}% de lascas por segundo` },
    { k: 'estouro', br: 0, par: 'dura', name: 'Estouro', max: 3, icon: 'explosao', p: { burst: 5 }, val: r => `${rnBase('feitico_orbe', 'burst') + 5 * r} lascas no estouro final` },
    { k: 'longe', br: 0, par: 'chuva', name: 'Lascas Longas', max: 2, icon: 'alcance', pm: { slife: 0.25 }, val: r => `As lascas voam ${25 * r}% mais longe` },
    { k: 'pesada', br: 0, par: 'estouro', name: 'Lascas Pesadas', max: 2, icon: 'floco', p: { stacks: 1 }, val: r => `Cada lasca soma ${rnBase('feitico_orbe', 'stacks') + r} para congelar` },
    { k: 'rapido', br: 1, par: null, name: 'Orbe Rápido', max: 2, icon: 'veloz', pm: { spd: 0.25 }, val: r => `Anda ${25 * r}% mais rápido` },
    { k: 'busca', br: 1, par: 'rapido', name: 'Orbe Faminto', max: 1, icon: 'ima', g: { seek: 1 }, val: r => r ? 'O orbe vira na direção do inimigo mais perto' : 'O orbe vai reto até a mira' },
    { k: 'contato', br: 1, par: 'rapido', name: 'Corpo Gelado', max: 2, icon: 'adaga', g: { touch: 1 }, val: r => r ? `O orbe fere quem encosta nele (${100 * r}% do dano, a cada 0,4 s)` : 'O orbe só fere com as lascas' },
    { k: 'dois', br: 1, par: 'busca', name: 'Par de Orbes', max: 1, icon: 'eco', g: { twin: 1 }, val: r => r ? 'Sai um segundo orbe, um pouco abaixo do primeiro' : 'Sai um orbe só' }
  ] });
