const { RANK_LABELS } = require('../../utils/constants');

Component({
  externalClasses: ['anchor-class'],

  properties: {
    suit: { type: String, value: '' },
    rank: { type: Number, value: 0 },
    faceDown: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    selected: { type: Boolean, value: false },
    isNew: { type: Boolean, value: false },
    compact: { type: Boolean, value: false }
  },

  data: {
    displayLabel: '',
    colorClass: ''
  },

  observers: {
    'suit, rank'(suit, rank) {
      if (!suit || !rank) return;
      this.setData({
        displayLabel: RANK_LABELS[rank] || rank,
        colorClass: (suit === '♥' || suit === '♦') ? 'red' : 'black'
      });
    }
  },

  methods: {
    onTap() {
      if (this.data.faceDown) return;
      this.triggerEvent('cardtap', {
        suit: this.data.suit,
        rank: this.data.rank
      });
    }
  }
});
