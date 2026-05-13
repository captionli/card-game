const { getValidPlays } = require('./game-engine');

function aiDecide(player, table) {
  const validPlays = getValidPlays(player, table);
  if (validPlays.length > 0) {
    return { action: 'play', card: validPlays[0] };
  }
  let maxCard = player.hand[0];
  for (const card of player.hand) {
    if (card.rank > maxCard.rank) {
      maxCard = card;
    }
  }
  return { action: 'withhold', card: maxCard };
}

function aiDelay() {
  return 800 + Math.random() * 600;
}

module.exports = {
  aiDecide,
  aiDelay
};
