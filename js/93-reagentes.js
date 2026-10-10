'use strict';

/* ---- reagents for crafting: what you carry plus what is in the village chest ----
   Any crafting screen counts and spends materials through these three, never through countItem/removeItem,
   so the chest (stash, js/27-bau.js) is read too. Spending takes from the bag first and then from the chest. */
const stashCount = id => { let n = 0; for (const s of stash) if (s && s.id === id) n += s.n || 1; return n; };
const reagHave = id => countItem(id) + stashCount(id);
function reagTake(id, n = 1) {
  if (reagHave(id) < n) return false;
  const k = Math.min(n, countItem(id)); if (k) removeItem(id, k); n -= k;
  for (let i = STASH_N - 1; i >= 0 && n > 0; i--) { const s = stash[i]; if (s && s.id === id) { const t = Math.min(n, s.n); s.n -= t; n -= t; if (s.n <= 0) stash[i] = null; } }
  invDirty = true; return true;
}
// give materials back (a cancelled piece): into the bag, and what does not fit goes into the chest
function reagGive(id, n = 1) { const left = addItem(id, n); return left ? putInStash({ id, n: left }) : 0; }
