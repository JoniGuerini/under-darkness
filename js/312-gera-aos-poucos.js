'use strict';

/* ================= a geração aos poucos: só as camadas de perto (2026-10-12) =================
   Pedido do Jonathan (2026-10-12): gerar o mundo inteiro de uma vez deixava o novo jogo e o carregar demorados, e o
   herói nem chega tão cedo nas camadas fundas. Agora um mundo novo sai com a superfície, as Cavernas e a Catedral; cada
   camada seguinte é gerada quando o herói entra na de cima dela (a de baixo fica sempre pronta antes de ele chegar),
   com a tela de carregando (234) enquanto isso.
   - Os geradores das camadas entregam o seu trabalho a genStage e os passes de depois (ligações do 87, quedas e minério
     do 313, bacias, pedras do 117, ervas do 94) se registram em genPos (129): aqui cada leva roda os passos de UMA camada
     (a primeira leva: Cavernas e Catedral, que montam a base) e depois os passes só nas camadas novas.
   - O mesmo mundo sai igual sempre: um save guarda até onde foi gerado (gerado) e o carregar refaz as mesmas levas, uma a
     uma, antes de pôr os blocos do jogador. Na hora de gerar mais com o jogo rodando, a geração vê o mundo como a semente
     deixou (tilesGen): tudo o que o jogo mudou volta por cima depois (os diffs, as alavancas, as salas dos chefes...).
   - As camadas ainda não geradas ficam com o topo previsto (cada uma começa onde a de cima termina), então as zonas, o
     Teleporte (que gera o que falta antes de levar o herói) e o mapa já sabem onde cada uma vai ficar.
   Carrega depois de todo o resto que embrulha buildCathedral, generate, newWorld e makeSave, antes do 24-boot. */

const GEN_INICIO = 1;     // a primeira leva: até a Catedral (posição 1 na lista de camadas)
let genFeito = -1;        // a camada mais funda já gerada (índice em LAYERS)
let genAlvo = GEN_INICIO; // até onde gerar no próximo mundo (o newWorld acerta pelo save)
let tilesGen = null, wallsGen = null;   // o mundo como a geração deixou, sem nada do jogo
let genIdxM = null;
const genIdx = id => { if (!genIdxM) genIdxM = new Map(LAYERS.map((L, k) => [L.id, k])); const k = genIdxM.get(id); return k === undefined ? -1 : k; };
const genFeita = id => { const k = genIdx(id); return k >= 0 && k <= genFeito; };   // (a camada que está sendo gerada já conta)

// o topo previsto das camadas que ainda não existem: cada uma começa onde a de cima termina (como cada gerador faz)
function genPreve() {
  for (let k = Math.max(1, genFeito + 1); k < LAYERS.length; k++) {
    const id = LAYERS[k].id, n = GEN_NOMES[id], ua = layerAcimaId(id), up = ua && genLinhas(ua); if (!n || !up || !genLinhas(id)) continue;
    const s = Math.min(WH - 12, up[0] + Math.min(up[1] - up[0], WH - 8 - up[0]));
    try { (0, eval)(`${n[0]} = ${s}`); } catch (e) { }
  }
}
function genPassos() {   // os passes de depois de uma leva, só nas camadas novas
  for (const P of GEN_POS) if (!P.id || genNova(P.id)) { try { P.fn(); } catch (err) { console.error(err); } }
}
function genFundoAcerta() { let r = null; for (let j = genFeito; j >= 0 && !r; j--) r = genLinhas(LAYERS[j].id);   // a camada mais funda que existe (2026-10-21)
   genFundo = genFeito >= LAYERS.length - 1 || !r ? WH : Math.min(WH, r[1] + 4); }
// a próxima leva: os passos de uma camada (o Pesadelo e o Abismo saem juntos: um embrulha o outro) e os passes
function genProxima() {
  const ids = []; for (const P of GEN_FILA) if (!ids.includes(P.id)) ids.push(P.id);
  const k = ids.findIndex(id => genIdx(id) > genFeito); if (k < 0) { genFeito = LAYERS.length - 1; return false; }
  const id = ids[k], a = genIdx(id), b = k + 1 < ids.length ? genIdx(ids[k + 1]) - 1 : LAYERS.length - 1;
  genNovas = LAYERS.slice(a, b + 1).map(L => L.id); genFeito = b;
  for (const P of GEN_FILA) if (P.id === id) P.fn();
  genPreve(); genFundoAcerta(); genPassos();
  return true;
}

// o buildCathedral inteiro: as Cavernas e a Catedral rodam na hora (são a base), as outras camadas entram na fila
{ const _bc = buildCathedral; buildCathedral = function () {
  GEN_FILA.length = 0; window.__quedas = {};
  genNovas = LAYERS.slice(0, GEN_INICIO + 1).map(L => L.id); genFeito = GEN_INICIO;
  genGuarda = true; try { _bc(); } finally { genGuarda = false; }
  genPreve(); genFundoAcerta(); genPassos();
  // um save que já tinha ido mais fundo: as mesmas levas, uma a uma, do mesmo jeito que saíram no jogo
  while (genFeito < genAlvo && genProxima()) { }
}; }
{ const _g = generate; generate = function () { const r = _g.apply(this, arguments); tilesGen = tiles.slice(); wallsGen = walls.slice(); return r; }; }
{ const _nw = newWorld; newWorld = function (sd, sv) {
  genAlvo = Math.max(GEN_INICIO, Math.min(LAYERS.length - 1, sv && typeof sv.gerado === 'number' ? sv.gerado | 0 : GEN_INICIO));
  return _nw(sd, sv);
}; }
{ const _mk = makeSave; makeSave = function () { const o = _mk(); o.gerado = genFeito; return o; }; }

// gerar mais com o jogo rodando, até a camada `ate` (índice em LAYERS)
function genMais(ate) {
  if (!tiles || !tilesGen || genFeito >= Math.min(ate, LAYERS.length - 1)) return false;
  const cur = tiles.slice(), curW = walls.slice(), velho = tilesGen, velhoW = wallsGen;
  tiles.set(tilesGen); walls.set(wallsGen);   // a geração vê o mundo como a semente deixou
  const ini = genFeito + 1;
  while (genFeito < ate && genProxima()) { }
  let topo = WH; for (let j = ini; j <= genFeito; j++) { const r = genLinhas(LAYERS[j].id); if (r) { topo = r[0]; break; } }
  // a camada de trás (36) e as águas, da primeira linha que a geração mexeu para baixo
  let first = topo; for (let i = 0, n = topo * WW; i < n; i++) if (tiles[i] !== velho[i] || walls[i] !== velhoW[i]) { first = (i / WW) | 0; break; }
  const yD = Math.max(0, first - 6);
  buildDepth(yD, Math.min(WH, genFundo + 8));
  if (CATEDRAL) { const keep = DEEPT.slice(0, yD * WW); genDeepA = yD; try { cathedralDeep(); } finally { genDeepA = 0; } DEEPT.set(keep, 0); }
  nzClear();
  if (agua.length) for (let i = Math.max(0, topo - 8) * WW; i < agua.length; i++) { aguaN[i] = agua[i] ? 8 : 0; aguaK[i] = agua[i]; aguaGen[i] = aguaN[i]; }
  tilesGen = tiles.slice(); wallsGen = walls.slice();
  // o que o jogo mudou nas camadas de cima volta por cima; nas novas, só os blocos do jogador
  for (let i = 0, n = topo * WW; i < n; i++) { if (cur[i] !== velho[i]) tiles[i] = cur[i]; if (curW[i] !== velhoW[i]) walls[i] = curW[i]; }
  for (const [i, t] of diffs) tiles[i] = t;
  propGoneMark();
  // o que se acerta ao carregar um save, para as camadas novas
  if (genFeita('escuro') && genNovas.includes('escuro')) {
    try { if (typeof esBoss !== 'undefined' && esBoss) for (const [x, y] of noxPyreTiles()) { const i = y * WW + x; tiles[i] = noxState.dead ? ES_PIRA : ES_PIRA_FRIA; } } catch (err) { console.error(err); }
    try { esScan(); } catch (err) { console.error(err); }
  }
  chunks.clear(); mapVer++;
  return true;
}

// a camada (índice em LAYERS) de uma linha do mundo; -1 na superfície
function genCamadaDe(ty) { let k = -1; for (let j = 0; j < LAYERS.length; j++) { const r = genLinhas(LAYERS[j].id); if (r && ty >= r[0]) k = j; } return k; }
// garante gerada a camada da linha y e a de baixo dela; depois() roda quando estiver pronto
function genAteLinha(y, depois) {
  const ate = Math.min(LAYERS.length - 1, genCamadaDe(y) + 1);
  if (ate <= genFeito) { if (depois) depois(); return; }
  comCarregando('Gerando o mundo', () => genMais(ate), () => { last = performance.now(); if (depois) depois(); });
}
// o herói entrou numa camada: a de baixo dela é gerada (com a tela de carregando)
setInterval(() => {
  if (state !== 'play' || typeof carregando === 'undefined' || carregando || !tiles || genFeito >= LAYERS.length - 1) return;
  const ty = Math.floor((pl.y + pl.h - 1) / T), ate = Math.min(LAYERS.length - 1, genCamadaDe(ty) + 1);
  if (ate > genFeito) genAteLinha(ty);
}, 300);
