'use strict';

/* ================= pergaminhos de escola em jogo (dados e ícones em js/120-pergaminhos-dados.js) =================
   - Só a Aurélia abre o lacre: na conversa com ela, "Identificar pergaminhos" abre todos os pergaminhos de escola da
     mochila. Cada um vira, no mesmo lugar, um feitiço sorteado da escola entre os que o herói ainda não conhece
     (procura na mochila e no baú da vila). Se ele já sabe a escola inteira, o pergaminho volta lacrado.
   - O feitiço vai para a barra se o pergaminho estava fora dela e houver lugar.
   - Botão direito no pergaminho lacrado não abre nada.
   - O jogo novo começa sem feitiço e sem pergaminho (os arquivos de cada feitiço não dão mais nada).
   Carrega depois de 116-gelo (embrulha quickAction, tipHTML e talkMenu por cima dos outros feitiços). */

const knowsSpell = id => inv.some(q => q && q.id === id) || (typeof stash !== 'undefined' && stash.some(q => q && q.id === id));
const schoolLeft = k => { const sc = SCHOOLS.find(s => s.k === k); return sc ? sc.spells.filter(id => ITEMS[id] && !knowsSpell(id)) : []; };
const schoolDone = k => schoolLeft(k).length === 0;

// abre um pergaminho que está em inv[i]; devolve o feitiço que saiu, ou null se a escola já não tem nada novo
function openSchoolScroll(i) {
  const s = inv[i], sc = s && SCHOOL_OF[s.id]; if (!sc) return null;
  const left = schoolLeft(sc.k); if (!left.length) return null;
  const id = left[Math.floor(Math.random() * left.length)];
  if ((s.n || 1) > 1) s.n -= 1; else inv[i] = null;
  let at = inv[i] ? -1 : i;
  if (at < 0 || at >= HB_BAG) { const f = inv.findIndex((q, j) => !q && j < HB_BAG); if (f >= 0) at = f; }
  if (at < 0) at = inv.findIndex(q => !q);
  if (at < 0) { if (inv[i]) inv[i].n += 1; else inv[i] = s; return null; }
  inv[at] = mkItem(id);
  return id;
}

function magaIdentify(n) {
  const got = [], none = [];
  for (let i = 0; i < inv.length; i++) {
    while (inv[i] && SCHOOL_OF[inv[i].id]) {
      const sc = SCHOOL_OF[inv[i].id], id = openSchoolScroll(i);
      if (!id) { if (!none.includes(sc.k)) none.push(sc.k); break; }
      got.push(id);
    }
  }
  if (!got.length && !none.length) { talkMenu(n, 'Você não trouxe nenhum pergaminho lacrado. Eu vendo alguns, se quiser.'); return; }
  if (got.length) {
    sfx.learn(); burst(pl.x + pl.w / 2, pl.y + 8, 22, SPELL_ELEM[ITEMS[got[0]].elem].col, 70, -40, 0.7, 1, true);
    for (const id of got) toast('Feitiço aprendido: ' + ITEMS[id].name, 'gold', RAR_COL[2]);
    changed(false); invDirty = true; if (typeof hudCache !== 'undefined') hudCache.hb = null;
  }
  const names = got.map(id => ITEMS[id].name), list = names.length > 1 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names[0];
  const empty = none.map(k => SPELL_ELEM[k].name.toLowerCase()).join(' e ');
  let line = got.length === 1 ? pickLine([`O lacre cedeu. É ${list}. Já está em você.`, `${list}. Bom sorteio. Use com cuidado.`, `Deixe-me ver... ${list}. As runas já passaram para você.`])
    : got.length ? `Abri todos. Saíram ${list}.` : '';
  if (none.length) line += (line ? ' ' : '') + `O de ${empty} eu nem preciso abrir: não tem nada nele que você já não saiba.`;
  talkMenu(n, line);
}

/* ---- a conversa dela ganha o serviço ---- */
{ const _tm = talkMenu; talkMenu = function (n, text) {
  if (!n || n.id !== 'maga') return _tm(n, text);
  talkSay(text, [['Comprar e vender', () => openShop(n), true], ['Identificar pergaminhos', () => magaIdentify(n), true], ['Conversar', () => chat(n)], ['Até logo', closeTalk]]);
}; }

/* ---- na mochila: o lacre não abre, e a dica diz de que escola é ---- */
{
  const _quickAction = quickAction;
  quickAction = function (r) {
    const s = r && r.k === 'inv' ? inv[r.i] : null;
    if (!s || !SCHOOL_OF[s.id] || (typeof stashOpen === 'function' && stashOpen()) || shopNpc || forgeNpc) return _quickAction(r);
    hideTip(); bad(null); toast('O lacre não cede');
  };
  const _actFor = actFor;
  actFor = function (s, r) {
    if (!s || !SCHOOL_OF[s.id] || !r || r.k !== 'inv' || (typeof stashOpen === 'function' && stashOpen()) || shopNpc || forgeNpc) return _actFor(s, r);
    return 'Clique: pegar e mover';
  };
  const _tipHTML = tipHTML;
  tipHTML = function (s, r, act2) {
    const it = ITEMS[s.id]; if (!SCHOOL_OF[s.id]) return _tipHTML(s, r, act2);
    const act = act2 != null ? act2 : '';
    return `<span class="tn" style="color:${RAR_COL[it.rar]}">${it.name}</span><small>Pergaminho · Não identificado</small>${it.desc ? `<p>${it.desc}</p>` : ''}${act ? `<em>${act}</em>` : ''}`;
  };
}
