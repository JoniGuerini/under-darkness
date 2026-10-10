'use strict';

/* ================= quest cards: what to bring, how far along you are, and what you get ================= */
// Any villager can show one under their line in the talk window: showQuest(q) fills #talkQuest, talkSay clears it.
// q = { kind: 'Tarefa', title, state: 'open' | 'ready' | 'done', goals: [goal], rewards: [reward], note }
//   goal   = { icon, name, have, need, where }   (icon: an ITEMS id or a QICON key; where: a hint line)
//   reward = { icon, text }
// The look is plain here and dressed per villager in css/temas-npc.css.

// little icons for things that are not items: experience, a boss to kill, a place
const QICON = {};
(function makeQuestIcons() {
  const art = {
    xp: [["....y....", "...yYy...", "yyyyYyyyy", ".yYYWYYy.", "..yYYYy..", ".yYy.yYy.", ".yy...yy."], { y: '#7ab83a', Y: '#c8ff6a', W: '#f4ffd8' }],
    // a boss: a hood with two red eyes over a cleaver
    boss: [["...kkkkk...", "..kKKKKKk..", ".kKkkkkkKk.", ".kKkrkrkKk.", ".kKkkkkkKk.", "..kKkkkKk..", "...kkkkk...", "ss.......ss", "sSs.....sSs", ".sSs...sSs.", "..sSs.sSs.."], { k: '#3a2c36', K: '#7a6472', r: '#ff4a2a', s: '#8a909a', S: '#e4e8ee' }],
    place: [["..ddddd..", ".dDDDDDd.", "dDd...dDd", "dD.....Dd", "dD..k..Dd", "dD.kkk.Dd", "dDkkkkkDd", "ddddddddd"], { d: '#3a3f48', D: '#7d858f', k: '#0c0a10' }]
  };
  for (const k in art) {
    const img = fromRows(art[k][0], art[k][1]), c = mk(13, 13), x = c.getContext('2d');
    x.drawImage(img, Math.floor((13 - img.width) / 2), Math.floor((13 - img.height) / 2));
    let url = ''; try { url = outlined(c).toDataURL(); } catch (e) { }
    QICON[k] = url;
  }
})();
const qIcon = k => QICON[k] || (ICON[k] && ICON[k].url) || '';

// where a material comes from: the monsters that drop it (from DROPS), or the depth its ore sits at
const ORE_WHERE = { min_cobre: 'Minério de qualquer caverna', min_ferro: 'Minério das Cavernas Rasas para baixo', min_ouro: 'Minério das Cavernas Profundas', min_cristal: 'Minério do Abismo, na pedra escura', carvao: 'Veios pretos nas cavernas, ou com o Odo' };
function whereFrom(id) {
  if (ORE_WHERE[id]) return ORE_WHERE[id];
  const who = []; for (const t in DROPS) if (ET[t] && !ET[t].boss && DROPS[t].some(d => d[0] === id)) who.push(ET[t].name.toLowerCase());
  if (!who.length) return '';
  const list = who.length > 1 ? who.slice(0, -1).join(', ') + ' e ' + who[who.length - 1] : who[0];
  return 'Cai de ' + list;
}

const QSTATE = { open: 'Em andamento', ready: 'Pronta para entregar', done: 'Concluída' };
function questHTML(q) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const goal = g => {
    const done = g.have >= g.need, pc = Math.min(100, Math.round(g.have / g.need * 100));
    return `<li class="qg${done ? ' ok' : ''}"><span class="qi"><img src="${qIcon(g.icon)}" alt=""></span>`
      + `<span class="qn"><b>${esc(g.name)}</b>${g.where ? `<small>${esc(g.where)}</small>` : ''}</span>`
      + `<span class="qc"><em>${Math.min(g.have, g.need)}<i>/</i>${g.need}</em><span class="qbar"><i style="width:${pc}%"></i></span></span></li>`;
  };
  const rew = r => `<li><span class="qi"><img src="${qIcon(r.icon)}" alt=""></span><span>${esc(r.text)}</span></li>`;
  return `<header class="qh"><span class="qk">${esc(q.kind || 'Tarefa')}</span><span class="qs qs-${q.state}">${QSTATE[q.state] || ''}</span></header>`
    + `<h4 class="qt">${esc(q.title)}</h4>`
    + `<h5>Objetivo</h5><ul class="qgoals">${q.goals.map(goal).join('')}</ul>`
    + (q.rewards && q.rewards.length ? `<h5>Recompensa</h5><ul class="qrew">${q.rewards.map(rew).join('')}</ul>` : '')
    + (q.note ? `<p class="qnote">${esc(q.note)}</p>` : '');
}
function showQuest(q) { const el = $('talkQuest'); if (!el) return; el.className = 'quest qstate-' + q.state; el.innerHTML = questHTML(q); el.hidden = false; }
function hideQuest() { const el = $('talkQuest'); if (el) { el.hidden = true; el.innerHTML = ''; } }
