'use strict';

/* ================= ficha do personagem (C), refeita 2026-10-13 =================
   Pedido do Jonathan: a ficha tem que mostrar o que a árvore de talentos (js/345-talentos.js) e os itens fazem.
   Veste a torre da Aurélia, como a árvore e as runas. Troca o miolo do #char (index.html) e as funções
   refreshChar e charTipAt do js/22-ficha.js; o resto do 22 (inventário, dicas dos itens) fica como está.
   Cada linha diz de onde vem o número (itens, árvore) na dica; as que a árvore muda levam um losango violeta.
   Carrega depois do 345-talentos. Visual em css/ficha.css. */

(() => {
  const C = $('char');
  C.innerHTML = `<section class="fch" aria-label="Personagem">
    <header class="ch"><h3>Personagem</h3><span id="chLvl"></span><button class="ghost" id="btnCloseChar" type="button" aria-label="Fechar">×</button></header>
    <div class="ftop">
      <div class="fdoll"><canvas id="charCv" width="48" height="44" aria-hidden="true"></canvas></div>
      <div class="fbars">
        <div class="fbar hp"><i id="chHpF"></i><span><b>Vida</b><b id="chHp"></b></span></div>
        <div class="fbar mp"><i id="chMpF"></i><span><b>Mana</b><b id="chMp"></b></span></div>
        <div class="fbar xp"><i id="chXpF"></i><span><b>Experiência</b><b id="chXp"></b></span></div>
      </div>
    </div>
    <div class="fcols" id="chStats"></div>
  </section>
  <div id="charTip" class="tipbox" hidden></div>`;
  $('btnCloseChar').addEventListener('click', closeChar);
})();

// ícones das seções: as mesmas máscaras 11x11 da árvore
const FCH_IC = {};
function fchIcon(key, col) {
  const k = key + col.W; if (FCH_IC[k]) return FCH_IC[k];
  const M = ARV_ICON[key], cv = mk(13, 13), g = cv.getContext('2d');
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) { const ch = M[y][x]; if (ch === '.') continue; g.fillStyle = '#000'; g.fillRect(x + 2, y + 2, 1, 1); }
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) { const ch = M[y][x]; if (ch === '.') continue; g.fillStyle = col[ch]; g.fillRect(x + 1, y + 1, 1, 1); }
  return (FCH_IC[k] = cv.toDataURL());
}
const fchReg = k => ARV_REG.find(G => G.k === k).col;

// números
const fN = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
const fP = v => { const r = Math.round(v * 1000) / 10; return (r > 0 ? '+' : r < 0 ? '−' : '') + String(Math.abs(r)).replace('.', ',') + '%'; };
const fP0 = v => String(Math.round(v * 1000) / 10).replace('.', ',') + '%';
// o que os itens equipados somam
function fchItens() {
  const t = {}; for (const k of STAT_KEYS) t[k] = 0;
  for (const s of EQ_SLOTS) { const it = equip[s]; if (!it) continue; const st = itemStats(it); for (const k of STAT_KEYS) t[k] += st[k] || 0; }
  return t;
}
// de onde vem: "Itens +10% · Árvore +5%"
const fchFrom = (it, ar) => [it ? 'Itens ' + fP(it) : '', ar ? 'Árvore de talentos ' + fP(ar) : ''].filter(Boolean).join(' · ');

let FCH_ROWS = {};
function refreshChar() {
  const need = xpNeed(pl.lvl), w = equip.weapon, I = fchItens(), F = arvAny ? arvFx : {}, a = k => (F[k] || 0) / 100;
  const K = w ? KIND[ITEMS[w.id].kind || 'sword'] : null, bow = !!(K && K.bow);
  $('chLvl').innerHTML = `Nível <b>${pl.lvl}</b>`;
  $('chHp').textContent = `${Math.ceil(pl.hp)} / ${pl.maxHp}`; $('chHpF').style.width = pct(pl.hp / pl.maxHp);
  $('chMp').textContent = `${Math.floor(pl.mana)} / ${pl.maxMana}`; $('chMpF').style.width = pct(pl.mana / pl.maxMana);
  $('chXp').textContent = `${Math.floor(pl.xp)} / ${need}`; $('chXpF').style.width = pct(Math.min(1, pl.xp / need));
  const m = v => fN(v / T) + ' m';
  // o total de cada tipo de dano (itens e árvore multiplicam um o outro)
  const phys = (1 + (I.dmgPct || 0)) * (1 + a('dmgAll') + a('dmgFis')) - 1, hit = (1 + (I.dmgPct || 0)) * (1 + a('dmgAll') + a('dmgFis') + (bow ? 0 : a('dmgMelee'))) - 1;
  const sp = pl.spellPct || 0, el = e => (1 + sp) * (1 + a('dmgAll') + a(ARV_ELEM[e])) - 1;
  const res = k => { const e = pl.res ? pl.res[k] || 0 : 0, t = Math.min(0.75, (k === 'fogo' ? a('resFogo') : k === 'frio' ? a('resFrio') : 0) + a('resAll')); return [1 - (1 - e) * (1 - t), e, t]; };
  const manaS = 2.2 * (1 + a('manaRegen'));
  const free = typeof arvPoints === 'function' ? Math.max(0, arvPoints()) : 0;
  // [rótulo, valor, classe ('z' zerado, 'up' bônus, 'neg'), a árvore mexe?, ajuda, de onde vem]
  const R = (k, v, cls, arv, help, from) => ({ k, v, cls: cls || '', arv: !!arv, help, from });
  const groups = [
    ['Ataque', 'dmgMelee', fchReg('corpo'), w ? itemName(w) : 'Sem arma', [
      R('Dano', `${fN(pl.dmgMin)} – ${fN(pl.dmgMax)}`, '', a('dmgAll') || a('dmgFis') || (!bow && a('dmgMelee')),
        'Quanto cada golpe tira, sorteado entre o mínimo e o máximo. Já conta o dano da arma, o % de dano dos itens e o dano geral, físico e corpo a corpo da árvore.',
        `Bônus no golpe ${fP(hit)}`),
      R('Golpes por segundo', fN(pl.aps), '', a('atkSpd'), 'Quantos golpes por segundo segurando o botão. Vem da arma e da velocidade de ataque.', fchFrom(I.atkSpd, a('atkSpd'))),
      R('Dano por segundo', fN(pl.dps), 'big', hit !== (I.dmgPct || 0) || a('atkSpd') || a('crit') || a('critDmg'),
        'O dano médio de um segundo atacando sem parar: dano × golpes por segundo, contando o crítico. É o número para comparar armas e talentos.'),
      R('Crítico', fP0(pl.crit), pl.crit ? '' : 'z', a('crit') || F.noCrit, F.noCrit ? 'Golpe Firme: seus golpes nunca são críticos.' : 'Chance de um golpe ser crítico. Todo mundo começa com 5%; a árvore aumenta essa base em porcentagem.', fchFrom(I.crit, a('crit'))),
      R('Dano crítico', '+' + fP0(pl.critDmg), '', a('critDmg'), 'Quanto um crítico causa a mais. +75% quer dizer 1,75 vez o dano.', fchFrom(I.critDmg, a('critDmg'))),
      R('Alcance', m(pl.reach), '', false, 'Até onde a arma chega a partir do centro do corpo.'),
      R('Roubo de vida', fP0(pl.lifeSteal), pl.lifeSteal ? 'up' : 'z', a('lifeSteal'), 'Parte do dano corpo a corpo que volta como vida.', fchFrom(I.lifeSteal, a('lifeSteal'))),
      R('Atordoar', fP0(pl.stunCh), pl.stunCh ? 'up' : 'z', a('stun'), 'Chance de um golpe corpo a corpo deixar o inimigo tonto. Não funciona nos chefes.', fchFrom(0, a('stun')))]],
    ['Dano', 'dmgAll', fchReg('fisico'), '', [
      R('Geral', fP(a('dmgAll')), a('dmgAll') ? 'up' : 'z', a('dmgAll'), 'Vale para todo golpe: corpo a corpo, flecha e feitiço.', fchFrom(0, a('dmgAll'))),
      R('Físico', fP(phys), phys ? 'up' : 'z', a('dmgFis') || a('dmgAll'), 'Golpes de arma e flechas: o % de dano dos itens, o dano físico e o geral. Já está no Dano do Ataque.', fchFrom(I.dmgPct, a('dmgFis'))),
      R('Corpo a corpo', fP(a('dmgMelee')), a('dmgMelee') ? (bow ? 'z' : 'up') : 'z', a('dmgMelee'), bow ? 'Só vale com arma de perto; o arco na mão não usa.' : 'Só os golpes com arma de perto. Já está no Dano do Ataque.', fchFrom(0, a('dmgMelee'))),
      R('Feitiços', fP(sp), sp ? 'up' : 'z', a('dmgSpell'), 'Todo feitiço. Vem de cajados, varinhas, tomos, elixir e da árvore.', fchFrom(sp - a('dmgSpell'), a('dmgSpell'))),
      R('Fogo', fP(el('fogo')), el('fogo') ? 'up fogo' : 'z', a('dmgFogo') || a('dmgAll'), 'Total dos feitiços de fogo, queimadura inclusa: feitiços, geral e fogo.', fchFrom(0, a('dmgFogo'))),
      R('Gelo', fP(el('gelo')), el('gelo') ? 'up gelo' : 'z', a('dmgGelo') || a('dmgAll'), 'Total dos feitiços de gelo: feitiços, geral e gelo.', fchFrom(0, a('dmgGelo'))),
      R('Raio', fP(el('raio')), el('raio') ? 'up raio' : 'z', a('dmgRaio') || a('dmgAll'), 'Total dos feitiços de raio, Arco Voltaico incluso: feitiços, geral e raio.', fchFrom(0, a('dmgRaio')))]],
    ['Magia', 'manaPct', fchReg('mana'), '', [
      R('Mana máxima', String(pl.maxMana), '', a('manaPct'), 'O total de mana para os feitiços.', fchFrom(0, a('manaPct'))),
      R('Regeneração de mana', fN(manaS) + ' /s', '', a('manaRegen'), 'Mana que volta por segundo.', fchFrom(0, a('manaRegen'))),
      R('Recarga dos feitiços', fP(a('castSpd')), a('castSpd') ? 'up' : 'z', a('castSpd'), 'Quanto mais rápido a espera entre feitiços acaba.', fchFrom(0, a('castSpd'))),
      R('Mana ao matar', fP0(a('manaKill')), a('manaKill') ? 'up' : 'z', a('manaKill'), 'Parte da mana máxima que volta a cada inimigo derrotado.'),
      R('Mente sobre matéria', fP0(a('mom')), a('mom') ? 'up' : 'z', a('mom'), 'Parte do dano recebido que sai da mana antes da vida.')]],
    ['Defesa', 'defPct', fchReg('defesa'), '', [
      R('Vida máxima', String(pl.maxHp), '', a('hpPct'), 'O total de vida. 20 do herói, mais os itens; a árvore aumenta em porcentagem.', fchFrom(0, a('hpPct'))),
      R('Regeneração', pl.regenB ? fN(pl.regenB) + ' /s' : '0', pl.regenB ? 'up' : 'z', a('regen'), 'Vida que volta por segundo depois de 4 segundos sem levar dano.'),
      R('Defesa', pl.def ? `${pl.def} (−${Math.round(armorCut(pl.def) * 100)}%)` : '0', pl.def ? '' : 'z', a('defPct'), 'Corta o dano de todo golpe. Entre parênteses, quanto ela corta (no máximo 75%). A árvore aumenta a defesa das peças em porcentagem.', fchFrom(0, a('defPct'))),
      R('Esquiva', fP0(pl.dodge), pl.dodge ? 'up' : 'z', a('dodge'), 'Chance de escapar ileso de um golpe. O máximo é 40%.', fchFrom(I.dodge, a('dodge'))),
      R('Recebe menos dano', fP0(Math.min(0.75, a('lessTaken'))), a('lessTaken') ? 'up' : 'z', a('lessTaken'), 'Corta todo dano recebido, depois das resistências.'),
      R('Espinhos', fP0(pl.thorns), pl.thorns ? 'up' : 'z', a('thorns'), 'Quem te acerta de perto leva de volta essa parte do dano.', fchFrom(I.thorns, a('thorns'))),
      R('Vida ao matar', '+' + (pl.onKill || 0), pl.onKill ? 'up' : 'z', false, 'Vida recuperada a cada inimigo derrotado.'),
      R('Poções', fP(a('potion')), a('potion') ? 'up' : 'z', a('potion'), 'Quanto a mais cada poção de vida cura.')]],
    ['Escudo', 'parry', fchReg('guarda'), '', [
      R('Janela de aparo', pl.parry ? secs(pl.parry) : 'sem escudo', pl.parry ? '' : 'z', a('parry'), 'Tempo logo depois de levantar o escudo em que um golpe vira aparo: o inimigo fica tonto e você não leva nada.', fchFrom(0, a('parry'))),
      R('Custo de vigor', fP(-Math.min(0.6, a('vigCost'))), a('vigCost') ? 'up' : 'z', a('vigCost'), 'Quanto menos vigor bloquear e aparar gastam.'),
      R('Aparar cura', fP0(a('parryHeal')), a('parryHeal') ? 'up' : 'z', a('parryHeal'), 'Parte da vida máxima que volta a cada aparo.')]],
    ['Resistências', 'resAll', fchReg('fogo'), '', ['fogo', 'frio', 'veneno'].map(k => {
      const [t, e, ar] = res(k);
      return R(k === 'fogo' ? 'Fogo' : k === 'frio' ? 'Frio' : 'Veneno', fP0(t), t ? 'up ' + (k === 'frio' ? 'gelo' : k) : 'z', ar,
        'Corta o dano desse tipo antes da defesa. Vem dos elixires da Marta e da árvore (até 75% cada).', fchFrom(e, ar));
    })],
    ['Exploração', 'spd', fchReg('agilidade'), '', [
      R('Velocidade', fP(pl.spd), pl.spd > 0 ? 'up' : pl.spd < 0 ? 'neg' : 'z', a('spd'), 'Quão mais rápido você anda que o normal.', fchFrom(I.spd, a('spd'))),
      R('Mineração', equip.tool ? fP0(pl.mine) : 'sem picareta', equip.tool ? '' : 'z', false, 'Velocidade para cavar. 100% é a picareta velha.'),
      R('Dano da picareta', String(pl.pickDmg || 4), '', false, 'Quanto a picareta tira de um inimigo no caminho enquanto você cava.'),
      R('Luz', '+' + (pl.light || 0), pl.light ? 'up' : 'z', false, 'Brilho a mais em volta de você nas cavernas.'),
      R('Bônus de XP', fP(pl.xpB), pl.xpB ? 'up' : 'z', false, 'Experiência a mais por inimigo derrotado.')]],
    ['Jornada', 'inicio', ARV_NEUTRO, '', [
      R('Talentos', free ? `${free} ${free === 1 ? 'livre' : 'livres'}` : 'todos usados', free ? 'up' : '', false, 'Pontos livres para a árvore de talentos. Cada nível dá 1.', `${arv.on.size - 1} nós ligados`),
      R('Inimigos', String(pl.kills), '', false, 'Quantos inimigos você derrotou neste mundo.'),
      R('Ouro', goldTxt(pl.gold), '', false, 'Dinheiro para o vilarejo.'),
      R('Próximo nível', `${Math.max(0, need - Math.floor(pl.xp))} XP`, '', false, 'Quanta experiência ainda falta para subir de nível.')]]
  ];
  FCH_ROWS = {};
  $('chStats').innerHTML = groups.map(([h, ic, col, sub, rows], gi) => `<section class="fbox"><h4><img src="${fchIcon(ic, col)}" alt="">${h}</h4>${sub ? `<p class="fsub"${gi === 0 && w ? ` style="color:${RAR_COL[itemRar(w)]}"` : ''}>${UDesc(sub)}</p>` : ''}<dl>${rows.map((r, i) => {
    const id = gi + '.' + i; FCH_ROWS[id] = r;
    return `<dt data-r="${id}"${r.arv ? ' class="arv"' : ''}>${r.k}</dt><dd data-r="${id}" class="${r.cls}">${r.v}</dd>`;
  }).join('')}</dl></section>`).join('');
  const cv = $('charCv'), x = cv.getContext('2d');
  compose(poseFor(0, 2.7, 0.9, 'idle', false)); x.clearRect(0, 0, 48, 44); x.drawImage(comp, OX - 18, OY - 12, 48, 44, 0, 0, 48, 44);
}
const UDesc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function charTipAt(t) {
  const tip = $('charTip'), el = t && t.closest && t.closest('.fbox dt, .fbox dd');
  document.querySelectorAll('#chStats .hl').forEach(e => e.classList.remove('hl'));
  const r = el && FCH_ROWS[el.dataset.r];
  if (!r) { tip.hidden = true; return; }
  const dt = el.tagName === 'DT' ? el : el.previousElementSibling, dd = dt.nextElementSibling;
  dt.classList.add('hl'); dd.classList.add('hl');
  tip.innerHTML = `<span class="tn">${r.k}</span><small>${dd.textContent}</small><p>${r.help || ''}</p>${r.from ? `<em>${UDesc(r.from)}</em>` : ''}`;
  tip.hidden = false;
  const b = dd.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  let x = b.right + 14, y = b.top - 6;
  if (x + w > innerWidth - 8) x = dt.getBoundingClientRect().left - w - 14;
  if (x < 8) x = Math.max(8, b.left); if (y + h > innerHeight - 8) y = innerHeight - h - 8;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
