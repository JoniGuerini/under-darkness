'use strict';

/* ================= armas mágicas em jogo (dados: js/90-armas-magicas.js) =================
   - Mana: a mana máxima é 25 mais a mana de todas as peças equipadas (bases e modificadores).
   - Dano de feitiço: o Arco Voltaico e a Nevasca batem (1 + soma de spellPct) vezes mais forte.
   - Tomo: ocupa o espaço do escudo mas não levanta guarda (botão direito e Shift não fazem nada com ele),
     e não conta para os talentos "com escudo".
   - Com um feitiço selecionado na barra, o herói segura o cajado ou a varinha equipados (com o cajado, nas duas mãos).
   O cajado já segue as regras de duas mãos do montante (js/62-montante-maos.js), porque KIND.staff.twoHand.
   Carrega depois de 68-nevasca (embrulha recalc, rollPlayerDmg, updatePlayer, talCondOk, heldItem e holdsTwoHand). */

/* ---- mana e dano de feitiço ---- */
{
  const _recalc = recalc;
  recalc = function () {
    _recalc.apply(this, arguments);
    let mana = 0, sp = 0;
    for (const k of EQ_SLOTS) { const s = equip[k]; if (!s) continue; const st = itemStats(s); mana += st.mana || 0; sp += st.spellPct || 0; }
    pl.maxMana = 25 + Math.round(mana); pl.spellPct = sp;
    if (pl.mana > pl.maxMana) pl.mana = pl.maxMana;
  };
  const _roll = rollPlayerDmg;
  rollPlayerDmg = function () { const d = _roll(); return arcRoll || nevRoll ? d * (1 + (pl.spellPct || 0)) : d; };
}

/* ---- o tomo não é escudo ---- */
{
  const _updatePlayer = updatePlayer;
  updatePlayer = function (dt) {
    if (!equip.shield || !isTome(equip.shield.id)) return _updatePlayer(dt);
    const r = mouse.r, sl = keys.ShiftLeft, sr = keys.ShiftRight;
    mouse.r = false; keys.ShiftLeft = keys.ShiftRight = false;
    try { return _updatePlayer(dt); } finally { mouse.r = r; keys.ShiftLeft = sl; keys.ShiftRight = sr; }
  };
  const _talCondOk = talCondOk;
  talCondOk = function (c, kind) { return c === 'shield' && equip.shield && isTome(equip.shield.id) ? false : _talCondOk(c, kind); };
}

/* ---- com um feitiço na mão, o herói segura o cajado ou a varinha ---- */
const spellInHand = () => { if (hb.sel < 2) return false; const s = inv[hb.sel - 2]; return !!(s && ITEMS[s.id] && ITEMS[s.id].spell && equip.weapon && isMagicItem(equip.weapon.id)); };
{
  const _heldItem = heldItem;
  heldItem = function (L, ang) { return spellInHand() && L.weapon ? { img: L.weapon, ang, px: L.wpx, py: L.wpy } : _heldItem(L, ang); };
  const _holds = holdsTwoHand;
  holdsTwoHand = function (P) {
    if (_holds(P)) return true;
    return !!(spellInHand() && P && P.front && P.front.item && isTwoHand(equip.weapon.id) && look && look.weapon === P.front.item.img);
  };
}
