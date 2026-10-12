'use strict';
/* tela de Testes (Menu > Testes): um cartão largo com quatro abas, no lugar da antiga lista de botões do menu de pausa.
   Modo deus: a chave do modo em cima e as chaves de cada efeito lado a lado (60-modo-deus).
   Viagem: o Vilarejo e as camadas em grade; escolher uma camada mostra as faixas dela embaixo (teleporte do 75).
   Batalhão: quantos monstros soltar, um ao lado do outro, e Limpar (75), com a faixa e os monstros vivos de agora; a tela fica aberta para clicar de novo.
   Outros: pular para a próxima estação (334) e para a próxima fase da lua (337), e +5 pontos de runa (341).
   Esc volta ao menu de pausa. Carrega depois do 60-modo-deus.
   Senha: a tela (e o F4 do modo deus) só abre depois da senha do Jonathan. O código guarda só o SHA-256 dela, nunca
   a senha; acertou uma vez, o navegador lembra (localStorage 'ud-testes'). Só segura quem joga, não quem lê o código. */
let testesAba = 'deus';
const testesOpen = () => !!$('testes') && !$('testes').hidden;
let testesFecha = () => { };
const TESTES_HASH = 'f1a1b800cc073cb9c46577be7164eec4e8741335a91f5f5dfef832bffd414163';
let testesLiberado = (() => { try { return localStorage.getItem('ud-testes') === TESTES_HASH; } catch (e) { return false; } })();
// SHA-256 em hex: crypto.subtle quando a página é segura (https, arquivo local); fora disso, a conta na mão
async function testesSha(t) {
  const by = new TextEncoder().encode(t);
  if (window.crypto && crypto.subtle) return [...new Uint8Array(await crypto.subtle.digest('SHA-256', by))].map(b => b.toString(16).padStart(2, '0')).join('');
  const K = [], H = [], R = (x, n) => (x >>> n) | (x << (32 - n));
  for (let n = 2, c = 0; c < 64; n++) { let p = true; for (let d = 2; d * d <= n; d++) if (n % d === 0) { p = false; break; } if (!p) continue; if (c < 8) H[c] = (Math.pow(n, 1 / 2) * 2 ** 32) | 0; K[c++] = (Math.pow(n, 1 / 3) * 2 ** 32) | 0; }
  const L = ((by.length + 9 + 63) >> 6) << 6, m = new Uint8Array(L); m.set(by); m[by.length] = 0x80;
  const dv = new DataView(m.buffer); dv.setUint32(L - 4, by.length * 8); dv.setUint32(L - 8, Math.floor(by.length / 0x20000000));
  for (let o = 0; o < L; o += 64) {
    const w = []; for (let i = 0; i < 64; i++) w[i] = i < 16 ? dv.getUint32(o + i * 4) : (R(w[i - 2], 17) ^ R(w[i - 2], 19) ^ (w[i - 2] >>> 10)) + w[i - 7] + (R(w[i - 15], 7) ^ R(w[i - 15], 18) ^ (w[i - 15] >>> 3)) + w[i - 16] | 0;
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = h + (R(e, 6) ^ R(e, 11) ^ R(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i] | 0, t2 = (R(a, 2) ^ R(a, 13) ^ R(a, 22)) + ((a & b) ^ (a & c) ^ (b & c)) | 0;
      h = g; g = f; f = e; e = d + t1 | 0; d = c; c = b; b = a; a = t1 + t2 | 0;
    }
    [a, b, c, d, e, f, g, h].forEach((v, i) => { H[i] = H[i] + v | 0; });
  }
  return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}
// sem a senha o F4 não liga o modo deus (desligar sempre pode)
{ const _t = toggleModoDeus; toggleModoDeus = function () { if (!testesLiberado && !deusOn) return; return _t.apply(this, arguments); }; }
(function () {
  const OPC = [['vida', 'Sem dano'], ['mana', 'Mana infinita'], ['golpe', 'Um golpe mata'], ['luz', 'Luz total'], ['tocha', 'Tochas infinitas'], ['ouro', 'Compras de graça']];
  const ABAS = [['deus', 'Modo deus'], ['viagem', 'Viagem'], ['batalhao', 'Batalhão'], ['outros', 'Outros']];
  const chave = (id, nome, cls) => `<button type="button" class="ttog ${cls}" id="${id}" role="switch" aria-checked="false"><span class="tnome">${nome}</span><span class="sw"><i></i></span><b></b></button>`;
  const el = document.createElement('div');
  el.id = 'testes'; el.className = 'overlay'; el.hidden = true;
  el.innerHTML = `
    <section class="card testcard" aria-label="Testes">
      <h2>Testes</h2>
      <div class="tlock">
        <em>Senha</em>
        <input type="password" id="tSenha" autocomplete="off" spellcheck="false" aria-label="Senha" maxlength="64">
        <div class="tlbtns"><button type="button" class="ghost" id="tLockBack">Voltar</button><button type="button" id="tLockOk">Entrar</button></div>
      </div>
      <div class="ttabs" role="tablist">${ABAS.map(([k, t]) => `<button type="button" class="tab" data-tt="${k}" role="tab">${t}</button>`).join('')}</div>
      <div class="tpane" data-tp="deus">
        ${chave('tDeus', 'Modo deus', 'mestre')}
        <div class="tfx">${OPC.map(([k, t]) => chave('tFx-' + k, t, 'fx')).join('')}</div>
      </div>
      <div class="tpane" data-tp="viagem" hidden>
        <div class="tlayers" id="tLayers"></div>
        <div class="tbands"><span class="tbnome" id="tBandNome"></span><div class="tbrow" id="tBands"></div></div>
      </div>
      <div class="tpane" data-tp="batalhao" hidden>
        <div class="tinfo"><div><em>Faixa</em><span id="tArmyZona"></span></div><div><em>Monstros vivos</em><span id="tArmyVivos"></span></div></div>
        <div class="tarmy" id="tArmy"></div>
        <div class="tclear"><button type="button" class="ghost warn" id="tClear">Limpar monstros</button></div>
      </div>
      <div class="tpane" data-tp="outros" hidden>
        <div class="tmundo">
          <div class="tcell"><em>Estação</em><strong id="tEst"></strong><button type="button" class="ghost" id="tEstPula">Próxima estação</button></div>
          <div class="tcell"><em>Lua</em><strong id="tLua"></strong><button type="button" class="ghost" id="tLuaPula">Próxima fase</button></div>
          <div class="tcell"><em>Runas</em><strong id="tRuna"></strong><button type="button" class="ghost" id="tRunaMais">+5 pontos</button></div>
        </div>
      </div>
      <div class="tfoot"><button type="button" class="ghost" id="tBack">Voltar</button></div>
    </section>`;
  document.body.appendChild(el);
  const focar = b => b.addEventListener('pointerenter', () => b.focus({ preventScroll: true }));
  let tickT = 0;
  const tick = () => { const now = performance.now(); if (now - tickT < 70) return; tickT = now; initAudio(); sfx.select(); };

  /* modo deus: a chave de cima liga o modo; as de baixo, cada efeito (ficam apagadas com o modo desligado) */
  function pintaChave(id, on) { const b = $(id); b.classList.toggle('on', on); b.setAttribute('aria-checked', on); b.querySelector('b').textContent = on ? 'Ligado' : 'Desligado'; }
  function pintaDeus() {
    pintaChave('tDeus', deusOn);
    for (const [k] of OPC) pintaChave('tFx-' + k, DEUS[k]);
    el.querySelector('.tfx').classList.toggle('off', !deusOn);
  }
  $('tDeus').addEventListener('click', () => { toggleModoDeus(); tick(); });
  for (const [k] of OPC) $('tFx-' + k).addEventListener('click', () => { DEUS[k] = !DEUS[k]; deusRefill(); pintaDeus(); tick(); });
  deusMenu = () => { if (testesOpen()) pintaDeus(); };

  /* viagem: o Vilarejo e as camadas; a camada onde o herói está fica marcada */
  let camada = null;
  const ptY = () => Math.floor((pl.y + pl.h - 1) / T);
  const dentro = L => ptY() >= L.faixas[0].y0 && ptY() < L.faixas[L.faixas.length - 1].y1;
  function pintaViagem() {
    const Ls = __tp.LAYERS(), box = $('tLayers'), aqui = Ls.find(dentro);
    if (camada && !Ls.some(L => L.nome === camada)) camada = null;
    if (!camada && aqui) camada = aqui.nome;
    box.innerHTML = `<button type="button" class="tl vila${aqui ? '' : ' aqui'}" data-l="-1"><span class="tn">Vilarejo</span></button>` +
      Ls.map((L, i) => `<button type="button" class="tl${L.nome === camada ? ' sel' : ''}${L === aqui ? ' aqui' : ''}" data-l="${i}"><i class="tnum">${i + 1}</i><span class="tn">${L.nome}</span></button>`).join('');
    for (const b of box.querySelectorAll('.tl')) focar(b);
    pintaFaixas();
  }
  function pintaFaixas() {
    const L = __tp.LAYERS().find(C => C.nome === camada), row = $('tBands');
    $('tBandNome').textContent = L ? L.nome : '';
    row.innerHTML = L ? L.faixas.map((F, i) => `<button type="button" class="ghost tb" data-f="${i}"><i class="tnum">${i + 1}</i>${F.nome}</button>`).join('') : '';
    el.querySelector('.tbands').hidden = !L;
    for (const b of row.querySelectorAll('.tb')) focar(b);
  }
  $('tLayers').addEventListener('click', e => {
    const b = e.target.closest('.tl'); if (!b) return;
    const i = +b.dataset.l;
    if (i < 0) { const v = tpVilSpot(); __tp.go(v.x, v.y); return; }
    camada = __tp.LAYERS()[i].nome; tick();
    for (const x of $('tLayers').querySelectorAll('.tl')) x.classList.toggle('sel', x === b);
    pintaFaixas();
  });
  $('tBands').addEventListener('click', e => {
    const b = e.target.closest('.tb'), L = __tp.LAYERS().find(C => C.nome === camada); if (!b || !L) return;
    // a camada pode ainda não ter sido gerada (312): gera o que falta até ela e só então procura o lugar
    const F = L.faixas[+b.dataset.f];
    genAteLinha(F.y0, () => { const s = __tp.spot(F, L.entrada()); if (s) __tp.go(s[0] * T + T / 2, (s[1] + 1) * T); });
  });

  /* batalhão */
  $('tArmy').innerHTML = [25, 50, 100, 200, 500].map(n => `<button type="button" class="tn-army" data-n="${n}"><strong>${n}</strong><span>monstros</span></button>`).join('');
  for (const b of $('tArmy').querySelectorAll('button')) { focar(b); b.addEventListener('click', () => { __tp.battalion(+b.dataset.n); pintaBatalhao(); sfx.select(); }); }
  $('tClear').addEventListener('click', () => { __tp.clearMobs(); pintaBatalhao(); tick(); });
  function pintaBatalhao() {
    const tx = Math.floor((pl.x + pl.w / 2) / T), z = zoneAt(tx, ptY());
    $('tArmyZona').textContent = (CATH_SPAWN[z] && ZONE_NAMES[z]) || ZONE_NAMES[CV_ZONE0] || '';
    $('tArmyVivos').textContent = String(enemies.filter(e => !e.boss).length);
  }

  /* outros */
  function pintaMundo() {
    $('tEst').textContent = typeof EST_NOMES !== 'undefined' ? EST_NOMES[estNow().s] : '';
    $('tLua').textContent = typeof LUA_FASES !== 'undefined' ? LUA_FASES[luaFase()] : '';
    if (typeof RUNE_BOARDS !== 'undefined') $('tRuna').textContent = 'Nível ' + Math.max(0, ...Object.keys(RUNE_BOARDS).map(id => runOf(id).lvl));
  }
  $('tEstPula').addEventListener('click', () => { if (typeof estPula === 'function') estPula(); pintaMundo(); tick(); });
  $('tLuaPula').addEventListener('click', () => { if (typeof luaOff === 'undefined') return; luaOff = (luaOff + 1) & 7; luaIcone = ''; saveGame(); pintaMundo(); tick(); });
  if (typeof EST_NOMES === 'undefined') $('tEstPula').closest('.tcell').hidden = true;
  if (typeof LUA_FASES === 'undefined') $('tLuaPula').closest('.tcell').hidden = true;
  $('tRunaMais').addEventListener('click', () => { if (typeof runTestePontos === 'function') runTestePontos(); pintaMundo(); });
  if (typeof runTestePontos !== 'function') $('tRunaMais').closest('.tcell').hidden = true;

  /* abas */
  const PINTA = { deus: pintaDeus, viagem: pintaViagem, batalhao: pintaBatalhao, outros: pintaMundo };
  function aba(t) {
    testesAba = t;
    for (const b of el.querySelectorAll('.ttabs .tab')) { const on = b.dataset.tt === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }
    for (const p of el.querySelectorAll('.tpane')) p.hidden = p.dataset.tp !== t;
    PINTA[t]();
  }
  for (const b of el.querySelectorAll('.ttabs .tab')) { b.addEventListener('click', () => { aba(b.dataset.tt); tick(); }); }
  for (const b of el.querySelectorAll('button:not(.tl):not(.tb):not(.tn-army)')) focar(b);

  /* abrir e fechar: abre por cima do menu de pausa e volta para ele */
  const card = el.querySelector('.testcard'), senha = $('tSenha');
  function abre() {
    el.hidden = false; $('pause').hidden = true;
    card.classList.toggle('travado', !testesLiberado);
    if (!testesLiberado) { senha.value = ''; senha.focus(); return; }
    camada = null; aba(testesAba);
    el.querySelector('.ttabs .tab.on').focus();
  }
  let conferindo = false;
  async function entra() {
    if (conferindo) return; conferindo = true;
    try {
      if (await testesSha(senha.value) !== TESTES_HASH) { senha.value = ''; bad(senha); senha.focus(); return; }
      testesLiberado = true; try { localStorage.setItem('ud-testes', TESTES_HASH); } catch (e) { }
      senha.value = ''; tick(); abre();
    } finally { conferindo = false; }
  }
  $('tLockOk').addEventListener('click', entra);
  senha.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); entra(); } });
  function volta() { if (!testesOpen()) return; el.hidden = true; if (state === 'pause') { $('pause').hidden = false; $('btnTests').focus(); } }
  testesFecha = () => { el.hidden = true; };   // usado pelo 75 quando a viagem ou o batalhão devolvem o jogo
  window.openTestes = abre;
  $('tBack').addEventListener('click', volta);
  $('tLockBack').addEventListener('click', volta);
  el.addEventListener('pointerdown', e => { if (e.target === el) volta(); });
  { const _pg = pauseGame; pauseGame = function () { el.hidden = true; return _pg.apply(this, arguments); }; }
  { const _rg = resumeGame; resumeGame = function () { el.hidden = true; return _rg.apply(this, arguments); }; }

  // teclado: Esc volta; setas trocam de aba e andam pelos botões; as teclas do jogo não passam (o F4 passa, e a tela acompanha)
  addEventListener('keydown', e => {
    if (!testesOpen()) return;
    const a = document.activeElement;
    if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); volta(); return; }
    if (e.code === 'F4') return;
    if (a === senha) { if (!['Tab', 'Enter', 'NumpadEnter'].includes(e.code)) e.stopPropagation(); return; }   // digitando a senha: nenhuma tecla vira comando
    if (/^Arrow(Left|Right)$/.test(e.code) && a && a.classList.contains('tab')) {
      e.preventDefault(); const t = ABAS.map(x => x[0]), i = (t.indexOf(testesAba) + (e.code === 'ArrowRight' ? 1 : t.length - 1)) % t.length;
      aba(t[i]); el.querySelector('.ttabs .tab.on').focus();
    } else if (/^Arrow(Left|Right|Up|Down)$/.test(e.code)) {
      e.preventDefault();
      const list = [...el.querySelectorAll('.ttabs .tab.on, .tpane:not([hidden]) button, #tBack')].filter(b => b.offsetParent);
      const i = list.indexOf(a), d = /Right|Down/.test(e.code) ? 1 : list.length - 1;
      if (list.length) list[(i + d) % list.length].focus();
    }
    if (!['Tab', 'Enter', 'NumpadEnter', 'Space'].includes(e.code)) e.stopPropagation();
  }, true);
})();
