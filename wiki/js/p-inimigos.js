'use strict';

/* ================= inimigos e chefes (ET do 10-combate, mudado pelo 44, 46 e 49) ================= */
(() => {
  const E = UDW.esc, N = UDW.num;
  const isBoss = t => !!(ET[t] && ET[t].boss);
  /* Os níveis (revamp de 2026-10-21, js/129-camadas.js): a camada N tem monstros dos níveis vistos 5N-4 a 5N-1, um a cada
     quarto da altura dela (30% nascem um acima, nunca passando do 5N-1), e o chefe no 5N; nas Cavernas, 1 nível a cada
     50 m do desenho. As contas de vida, dano e XP usam a força lvlPw(nível), como o spawnEnemy do jogo; o ouro usa o nível visto. */
  const CAMS = () => UDW_CAMADAS();
  const camDoChefe = t => CAMS().find(C => C.chefe && (C.chefe[0] === t || (t === 'ttLasca' && C.id === 'titas')));
  UDW.camDoChefe = camDoChefe;
  // os números de um monstro num nível visto (os chefes têm números fixos no ET)
  UDW.enemyAt = (t, nv) => {
    const C = camDoChefe(t);
    if (t === 'rei') return { lvl: C ? C.nvChefe : nvDe(REI.lvl), hp: REI.hp, dmg: REI.dmg, xp: REI.xp, gold: 0 };
    if (C || isBoss(t)) return { lvl: C ? C.nvChefe : nv, hp: ET[t].hp, dmg: t === 'ttLasca' ? 0 : ET[t].dmg, xp: t === 'ttLasca' ? 0 : ET[t].xp, gold: 0 };
    const D = ET[t], p = lvlPw(nv), m = 1 + 0.3 * (p - 1);
    return { lvl: nv, hp: Math.round(D.hp * m), dmg: Math.round(D.dmg * (1 + 0.2 * (p - 1))), xp: Math.max(1, Math.round(D.xp * 0.18 * (1 + 0.15 * (p - 1)))), gold: 2 * nv, gold0: nv };
  };
  // a camada (registro do 129) de uma profundidade em metros, e o nível visto ali (o mesmo cálculo do layerLvl do 52 e do 56)
  const camAt = m => { const L = CAMS(); return L[Math.max(0, Math.min(L.length - 1, Math.floor(m / LAYER_D)))]; };
  UDW.lvAt = m => { const C = camAt(m); return C.pos === 1 ? 1 + Math.min(3, Math.floor(m / (50 * LAYER_K))) : C.nvLo + Math.min(3, Math.floor(4 * Math.max(0, m - C.de) / LAYER_D)); };
  // o mais alto da camada: os 30% de sorte nunca passam dele
  UDW.lvTop = m => camAt(m).nvHi;
  // onde cada nível visto é achado
  const ondeNivel = l => {
    if (l <= 4) { const c = 50 * LAYER_K; return `${l === 1 ? UDW_PROF.bands('cavernas')[0] : (l - 1) * c} a ${Math.min(CAVE_D, l * c) - 1} m${l === 4 ? ' (e 30% dos que nascem no nível 3)' : ''}`; }
    const C = CAMS().find(C => l >= C.nvLo && l <= C.nvChefe); if (!C) return '';
    if (l === C.nvChefe) return `chefe de ${C.nome}`;
    const q = LAYER_D / 4, k = l - C.nvLo; return `${C.de + Math.round(k * q)} a ${C.de + Math.round((k + 1) * q) - 1} m (${C.nome})`;
  };
  // a camada de uma zona do CATH_SPAWN (1 a 4: as cavernas antigas, desligadas; 5 a 8: a Catedral; as outras pelo XX_ZONE0 de cada camada)
  let ZL = null;
  const zoneLayer = z => {
    if (!ZL) { ZL = {}; for (const C of CAMS()) { if (C.id === 'catedral') { for (let k = 5; k <= 8; k++) ZL[k] = C.id; continue; } let z0; try { z0 = (0, eval)(C.pre + '_ZONE0'); } catch (e) { z0 = undefined; } if (typeof z0 === 'number') for (let k = 0; k < 4; k++) ZL[z0 + k] = C.id; } }
    return ZL[z] || null;
  };
  UDW.zoneLayer = zoneLayer;
  // o peso de um monstro numa tabela de spawn, somando se ele aparece mais de uma vez (a zona 33 lista as sementes duas vezes)
  const wOf = (tab, t) => tab.reduce((n, r) => n + (r[0] === t ? r[1] : 0), 0);
  // onde cada um aparece: CATH_SPAWN (45) faixa por faixa
  UDW.spawnsOf = t => {
    const o = [];
    for (const z in CATH_SPAWN) { const [tab, max] = CATH_SPAWN[z], tot = tab.reduce((n, r) => n + r[1], 0), w = wOf(tab, t); if (w) o.push({ z: +z, nome: ZONE_NAMES[z], p: w / tot, max }); }
    return o;
  };
  const flags = t => { const D = ET[t], f = []; if (D.fly && !D.crawl) f.push('Voa'); if (D.crawl) f.push('Anda em parede e teto'); if (D.phase) f.push('Atravessa paredes'); if (D.boss) f.push('Chefe'); if (D.touch) f.push('Corpo machuca'); return f; };

  // onde fica um monstro que não está no CATH_SPAWN: o chefe e os que só aparecem na luta com ele
  const onde = t => { for (const C of CAMS()) { if (C.chefe && C.chefe[0] === t) return C.chefe[1]; if (C.extra && C.extra[t]) return C.chefe ? C.chefe[1] : C.nome; }
    return t === 'afparte' ? 'A Grande Forja' : t === 'maebulbo' ? 'Gruta da Mãe' : t === 'lv_seg' ? 'A Nau Sem Nome' : 'Cavernas desligadas'; };
  function card(t) {
    const D = ET[t], e = UDW.enemyAt(t, 1), sp = UDW.spawnsOf(t);
    return `<a class="ecard${UDW.ativos().has(t) ? '' : ' off'}" href="#/inimigo/${t}"><div class="eart">${UDW.enemyImg(t, D.boss ? 2 : 3)}</div><b>${E(D.name)}</b>
      <div class="mini"><span>Vida <b>${e.hp}</b></span><span>Dano <b>${e.dmg}</b></span><span>XP <b>${e.xp}</b></span></div>
      <small>${sp.length ? sp.map(s => s.nome).join(', ') : onde(t)}</small></a>`;
  }
  // os monstros de cada camada, faixa por faixa (CATH_SPAWN de cada gerador), na ordem do registro (129)
  const lvAt = UDW.lvAt, lvTop = UDW.lvTop;
  const BIOMAS = () => CAMS().filter(C => UDW_TXT[C.fx]).map(C => ({ id: C.id, nome: `${C.pos}. ${C.nome}`, faixas: UDW_TXT[C.fx], chefes: C.chefe ? [[C.chefe[0], C.chefe[1]]] : [], extra: C.extra || {}, C }));
  function bioma(B) {
    const zs = B.faixas.map(f => ({ ...f, sp: CATH_SPAWN[f.zona] })), seen = [];
    for (const z of zs) for (const [t] of (z.sp ? z.sp[0] : [])) if (ET[t] && !seen.includes(t)) seen.push(t);
    const head = `<thead><tr><th></th>${zs.map(z => `<th class="fxh"><b>${E(ZONE_NAMES[z.zona] || z.nome)}</b><small>${z.de} a ${z.ate} m</small><small>nível ${lvAt(z.de)} a ${Math.min(lvTop(z.de), lvAt(z.ate - 1) + 1)}${z.sp ? ` · até ${z.sp[1]} juntos` : ''}</small></th>`).join('')}</tr></thead>`;
    const nome = t => { const e = UDW.enemyAt(t, B.C.nvLo); return `<td class="en"><a href="#/inimigo/${t}"><span class="eimg">${UDW.enemyImg(t, ET[t].boss ? 2 : 3)}</span><span><b>${E(ET[t].name)}</b><small>Vida ${e.hp} · Dano ${e.dmg} · XP ${e.xp}</small></span></a></td>`; };
    const rows = seen.map(t => `<tr>${nome(t)}${zs.map(z => { const tab = z.sp ? z.sp[0] : [], tot = tab.reduce((n, r) => n + r[1], 0), w = wOf(tab, t);
      if (!w) return '<td class="fx0"></td>'; const p = w / tot, lv = p >= 0.25 ? 3 : p >= 0.15 ? 2 : 1; return `<td class="fx${lv}"><i></i><span>${UDW.pct(p, 0)}</span></td>`; }).join('')}</tr>`);
    if (B.extra) for (const t in B.extra) if (ET[t] && !seen.includes(t)) rows.push(`<tr>${nome(t)}<td colspan="${zs.length}" class="onde">${E(B.extra[t])}</td></tr>`);
    const boss = B.chefes.filter(([t]) => ET[t]).map(([t, onde]) => `<tr class="chefe-l">${nome(t)}<td colspan="${zs.length}" class="onde"><a href="#/chefes">Chefe, nível ${B.C.nvChefe}</a>: ${E(onde)}</td></tr>`);
    return `<h2 id="${B.id}">${E(B.nome)} <small>níveis ${B.C.nvLo} a ${B.C.nvHi} · ${seen.length} monstros</small></h2><div class="tw"><table class="grade matriz inim">${head}<tbody>${rows.join('')}${boss.length ? `<tr class="grupo"><td colspan="${zs.length + 1}">Chefe</td></tr>` + boss.join('') : ''}</tbody></table></div>`;
  }
  UDW.pages.inimigos = {
    render(anchor) {
      const A = UDW.ativos(), off = Object.keys(ET).filter(t => !isBoss(t) && !A.has(t));
      return UDW.head('Inimigos', `Por camada e faixa, na ordem do jogo: ${CAMS().length} camadas de 5 níveis. Na camada N os monstros vão do nível 5N−4 ao 5N−1 (um a cada quarto da altura dela; 30% nascem um nível acima, nunca passando do 5N−1) e o chefe é o 5N. A porcentagem é a chance de cada monstro entre os que nascem naquela faixa. Vida, dano e XP aqui são os do primeiro nível da camada.`)
        + `<p class="bnav">${BIOMAS().map(B => `<a href="#/inimigos/${B.id}">${E(B.nome)}</a>`).join('')}<a href="#/inimigos/desligadas">Cavernas desligadas</a></p>`
        + `<h2 id="superficie">Superfície</h2><p class="nota">Nenhum monstro: o vilarejo e os campos são seguros, de dia e de noite.</p>`
        + BIOMAS().map(bioma).join('')
        + `<h2 id="desligadas">Nas cavernas desligadas <small>${off.length}</small></h2><p class="nota">${UDW_TXT.cavernas}</p><div class="egrid">${off.map(card).join('')}</div>`;
    },
    after(root, anchor) { if (anchor && $(anchor)) $(anchor).scrollIntoView(); }
  };

  UDW.pages.inimigo = {
    render(t) {
      const D = ET[t]; if (!D) return UDW.head('Inimigo não encontrado'); const CB = camDoChefe(t);
      const A = UDW.ativos(), sp = UDW.spawnsOf(t), Cs = CAMS().filter(C => sp.some(s => zoneLayer(s.z) === C.id)), lv = Cs.length ? Cs.flatMap(C => [0, 1, 2, 3].map(k => C.nvLo + k)) : [1, 2, 3, 4];
      let h = `<p class="volta"><a href="#/${D.boss ? 'chefes' : 'inimigos'}">← ${D.boss ? 'Chefes' : 'Inimigos'}</a></p>`;
      h += `<div class="etopo"><div class="eart big">${UDW.enemyImg(t, D.boss ? 4 : 6)}</div><div><h1>${E(D.name)}</h1>
        <div class="chips">${A.has(t) ? UDW.chip('No mundo', '#7fd36a') : UDW.chip('Desligado', '#8a7f70')}${flags(t).map(f => UDW.chip(f)).join('')}</div>
        <p class="lead">${E(UDW_TXT.inimigos[t] || '')}</p>${CB ? `<p>Chefe de <a href="#/biomas/${CB.id}">${E(CB.nome)}</a> (camada ${CB.pos}), nível ${CB.nvChefe}. <a href="#/chefes">Fases e o que solta</a>.</p>` : ''}</div></div>`;
      if (!D.boss && !CB) h += `<h2>Por nível</h2>` + UDW.table([{ t: 'Nível', cls: 'n' }, { t: 'Profundidade', cls: 'n' }, { t: 'Vida', cls: 'n' }, { t: 'Dano', cls: 'n' }, { t: 'XP', cls: 'n' }, { t: 'Ouro', cls: 'n' }],
        lv.map(l => { const e = UDW.enemyAt(t, l); return { cells: [l, ondeNivel(l), e.hp, e.dmg, e.xp, `${e.gold0} a ${e.gold}`], keys: [l, l, e.hp, e.dmg, e.xp, e.gold] }; }), 'compacta');
      if (sp.length) h += `<h2>Onde aparece</h2>` + UDW.table([{ t: 'Faixa' }, { t: 'Chance entre os monstros da faixa', cls: 'n' }, { t: 'Máximo ao mesmo tempo', cls: 'n' }],
        sp.map(s => ({ cells: [s.nome, UDW.pct(s.p, 0), s.max], keys: [s.z, s.p, s.max] })), 'compacta');
      const dr = DROPS[t] || [];
      if (dr.length) h += `<h2>O que solta</h2>` + UDW.table([{ t: 'Item' }, { t: 'Chance por morte', cls: 'n' }, { t: 'Quantidade', cls: 'n' }],
        dr.map(r => ({ cells: [UDW.item(r[0]), UDW.pct(UDW.dropRate(t, r), 2), r[2] ? (r[3] && r[3] !== r[2] ? `${r[2]}–${r[3]}` : r[2]) : 1], keys: [ITEMS[r[0]].name, UDW.dropRate(t, r), r[2] || 1] })))
        + (D.boss ? '' : `<p class="nota">Além disso: ${t === 'slime' ? '' : '6% de chance de uma tocha, '}55% de chance de ouro: um bicho de nível N solta de N a 2N moedas. Equipamento sai com raridade sorteada (tabela "Monstro").</p>`);
      return h;
    }
  };

  UDW.pages.chefes = {
    render() {
      const A = UDW.ativos(), solta = t => `<h3>Solta</h3><div class="lista">${(DROPS[t] || []).map(r => UDW.item(r[0], { n: r[2] ? `${r[2]}–${r[3]}` : 0 })).join('')}</div>`;
      const arte = t => {
        if (t === 'maeesporo') { try { const w = MAEA.wall(false).cv, c = document.createElement('canvas'), cw = 200, ch = 200; c.width = cw; c.height = ch; c.getContext('2d').drawImage(w, 140, 30, cw, ch, 0, 0, cw, ch); return `<img alt="" src="${c.toDataURL()}" style="width:${cw}px;image-rendering:pixelated">`; } catch (err) { return ''; } }
        return UDW.enemyImg(t === 'tita' ? 'ttLasca' : t, t === 'rei' ? 4 : t === 'maeteia' ? 3 : t === 'tita' ? 3 : 2);
      };
      const secao = C => {
        const [t, , kOnde, kFases] = C.chefe; if (!ET[t]) return '';
        const e = UDW.enemyAt(t, C.nvChefe);
        let h = `<section class="chefe" id="${t}"><div class="eart big">${arte(t)}</div><div>
          <h2>${E(ET[t].name)} ${A.has(t) ? UDW.chip('No mundo', '#7fd36a') : ''}</h2><p class="nota">Camada ${C.pos}: <a href="#/biomas/${C.id}">${E(C.nome)}</a></p><p class="lead">${E(UDW_TXT[kOnde] || '')}</p>
          <div class="stats">${UDW.stat(e.hp, 'vida')}${UDW.stat(e.dmg, 'dano')}${UDW.stat(e.xp, 'XP')}${UDW.stat(C.nvChefe, 'nível')}</div>
          <ol class="fases">${(UDW_TXT[kFases] || []).map(([f, x]) => `<li><b>${f}</b> ${E(x)}</li>`).join('')}</ol>`;
        if (t === 'rei') h += UDW.table([{ t: 'Ajuste' }, { t: 'Fase 1', cls: 'n' }, { t: 'Fase 2', cls: 'n' }, { t: 'Fase 3', cls: 'n' }], [
          ['Velocidade ao andar', REI.speed], ['Preparo do golpe (s)', REI.wind], ['Recuperação depois do golpe (s)', REI.rec], ['Pausa entre ataques (s)', REI.cd], ['Esqueletos por invocação', REI.sumN], ['Máximo de esqueletos', REI.sumCap], ['Intervalo de invocação (s)', REI.sumCD]
        ].filter(r => Array.isArray(r[1])).map(([k, v]) => ({ cells: [k, ...v.map(x => N(x, 2).replace(/,?0+$/, ''))], keys: [k, ...v] })), 'compacta');
        return h + solta(t) + `</div></section>`;
      };
      const L = CAMS().filter(C => C.chefe);
      return UDW.head('Chefes', `Um chefe no fundo de cada uma das ${CAMS().length} camadas, do mais fundo para o mais raso. O chefe da camada N é do nível 5N; vencido, abre o caminho para a camada de baixo.`)
        + `<p class="bnav">${L.map(C => ET[C.chefe[0]] ? `<a href="#/chefes/${C.chefe[0]}">${C.nvChefe}. ${E(ET[C.chefe[0]].name)}</a>` : '').join('')}</p>`
        + L.slice().reverse().map(secao).join('');
    },
    after(root, anchor) { if (anchor && $(anchor)) $(anchor).scrollIntoView(); }
  };
})();
