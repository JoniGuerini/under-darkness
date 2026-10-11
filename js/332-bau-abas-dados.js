'use strict';

/* ---- numbers for the village chest's tabs (js/27-bau.js, js/333-bau-abas.js); plain data, so the wiki loads it too ---- */
const STASH_COLS = 10, STASH_ROWS = 6, STASH_PER = STASH_COLS * STASH_ROWS;
const STASH_MAX_TABS = 12, STASH_NAME_MAX = 20;
// what the next tab costs (index = tabs you already have): cheap enough to buy the 2nd early, then each one a real goal
const STASH_PRECO = [0, 250, 750, 2000, 4500, 9000, 15000, 25000, 40000, 60000, 90000, 135000];
// tab colours, painted like the rest of the chest: a dark, a mid and a light step of each
const STASH_CORES = [
  ['carvalho', '#341c0e', '#6c3e1d', '#a96a34'], ['sangue', '#3a0e0c', '#7e2218', '#c4483a'], ['brasa', '#3e1a06', '#8e4612', '#dc8a34'],
  ['ouro', '#3e2c06', '#8e6a14', '#e6bc4a'], ['musgo', '#14260c', '#3c6420', '#86b04a'], ['mar', '#08262a', '#1a5e60', '#4caaa4'],
  ['noite', '#0e1638', '#28408a', '#6a8ae0'], ['ametista', '#22103a', '#58308c', '#a272dc'], ['rosa', '#38102a', '#86305e', '#d878a8'],
  ['cinza', '#1a1a20', '#4a4a56', '#9a9aa8']];
