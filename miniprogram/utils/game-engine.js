const { SUITS, RANK_MIN, RANK_MAX } = require('./constants');

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let rank = RANK_MIN; rank <= RANK_MAX; rank++) {
      deck.push({ suit, rank });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function sortHand(hand) {
  const suitOrder = { '♠': 0, '♥': 1, '♣': 2, '♦': 3 };
  hand.sort((a, b) => {
    if (a.suit !== b.suit) return suitOrder[a.suit] - suitOrder[b.suit];
    return a.rank - b.rank;
  });
}

function dealCards(deck, players) {
  for (let i = 0; i < 52; i++) {
    players[i % 4].hand.push(deck[i]);
  }
  for (const p of players) {
    sortHand(p.hand);
  }
}

function findFirstPlayer(players) {
  for (let i = 0; i < players.length; i++) {
    if (players[i].hand.some(c => c.suit === '♥' && c.rank === 7)) {
      return i;
    }
  }
  return 0;
}

function createTable() {
  const table = {};
  for (const suit of SUITS) {
    table[suit] = new Set();
  }
  return table;
}

function isValidPlay(card, table) {
  const played = table[card.suit];
  if (played.size === 0) {
    return card.rank === 7;
  }
  return played.has(card.rank - 1) || played.has(card.rank + 1);
}

function getValidPlays(player, table) {
  const plays = [];
  for (const card of player.hand) {
    if (isValidPlay(card, table)) {
      plays.push(card);
    }
  }
  return plays;
}

function playCard(player, card, table) {
  const idx = player.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
  if (idx === -1) return false;
  player.hand.splice(idx, 1);
  table[card.suit].add(card.rank);
  return true;
}

function withholdCard(player, card) {
  const idx = player.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
  if (idx === -1) return false;
  player.hand.splice(idx, 1);
  player.withheld.push(card);
  return true;
}

function isGameOver(players) {
  return players.every(p => p.hand.length === 0);
}

function findNextPlayerWithCards(players, currentIdx) {
  let nextIdx = (currentIdx + 1) % 4;
  while (players[nextIdx].hand.length === 0) {
    nextIdx = (nextIdx + 1) % 4;
  }
  return nextIdx;
}

function calcScore(player) {
  return player.withheld.reduce((sum, c) => sum + c.rank, 0);
}

function getRankings(players) {
  const sorted = [...players].sort((a, b) => calcScore(a) - calcScore(b));
  return sorted.map((p, i) => ({
    player: p,
    rank: i + 1,
    score: calcScore(p)
  }));
}

function createPlayers(humanName) {
  const { AI_NAMES } = require('./constants');
  return [
    { name: humanName || '你', seatIndex: 0, isHuman: true, hand: [], withheld: [] },
    { name: AI_NAMES[0], seatIndex: 1, isHuman: false, hand: [], withheld: [] },
    { name: AI_NAMES[1], seatIndex: 2, isHuman: false, hand: [], withheld: [] },
    { name: AI_NAMES[2], seatIndex: 3, isHuman: false, hand: [], withheld: [] }
  ];
}

module.exports = {
  createDeck,
  sortHand,
  dealCards,
  findFirstPlayer,
  createTable,
  isValidPlay,
  getValidPlays,
  playCard,
  withholdCard,
  isGameOver,
  findNextPlayerWithCards,
  calcScore,
  getRankings,
  createPlayers
};
