// 花色与点数常量
const SUITS = ['♠', '♥', '♣', '♦'];
const RANK_LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_MIN = 1;
const RANK_MAX = 13;

function cardLabel(rank) {
  return RANK_LABELS[rank];
}

function cardRankValue(rank) {
  return rank;
}

function isRed(suit) {
  return suit === '♥' || suit === '♦';
}

const COLORS = {
  bg: '#1a5c2a',
  tableCenter: '#1e7030',
  redCard: '#e74c3c',
  blackCard: '#2c3e50',
  cardBack: '#1a3a8a',
  highlight: '#ffd700',
  playBtn: '#4caf50',
  withholdBtn: '#f44336',
  anchor7: '#ff9800',
  cardBg: '#ffffff',
  emptySlot: 'rgba(255,255,255,0.15)',
  activePlayer: 'rgba(255,215,0,0.3)',
  disabledCard: 0.4
};

const AI_NAMES = ['电脑A', '电脑B', '电脑C'];

module.exports = {
  SUITS,
  RANK_LABELS,
  RANK_MIN,
  RANK_MAX,
  cardLabel,
  cardRankValue,
  isRed,
  COLORS,
  AI_NAMES
};
