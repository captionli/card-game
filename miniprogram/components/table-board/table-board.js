const SUITS = ['♠', '♥', '♣', '♦'];

Component({
  properties: {
    table: { type: Object, value: {} },
    lastPlayedCard: { type: Object, value: null }
  },

  data: {
    cols: []
  },

  observers: {
    'table, lastPlayedCard'(table, lastPlayedCard) {
      if (!table || Object.keys(table).length === 0) return;
      this.buildCols(table, lastPlayedCard);
    }
  },

  methods: {
    buildSuitCards(suit, table, lastPlayedCard) {
      const raw = table[suit] || [];
      const ranks = raw instanceof Set ? Array.from(raw) : raw;
      ranks.sort((a, b) => a - b);
      return ranks.map(rank => ({
        suit,
        rank,
        isAnchor7: rank === 7,
        isNew: lastPlayedCard && lastPlayedCard.suit === suit && lastPlayedCard.rank === rank,
        key: suit + '_' + rank
      }));
    },

    buildCols(table, lastPlayedCard) {
      const cols = [
        {
          suits: [
            { suit: '♠', cards: this.buildSuitCards('♠', table, lastPlayedCard), red: false },
            { suit: '♥', cards: this.buildSuitCards('♥', table, lastPlayedCard), red: true }
          ]
        },
        {
          suits: [
            { suit: '♣', cards: this.buildSuitCards('♣', table, lastPlayedCard), red: false },
            { suit: '♦', cards: this.buildSuitCards('♦', table, lastPlayedCard), red: true }
          ]
        }
      ];
      this.setData({ cols });
    }
  }
});
