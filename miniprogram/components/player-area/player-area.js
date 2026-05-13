Component({
  properties: {
    player: { type: Object, value: null },
    totalScore: { type: Number, value: 0 },
    position: { type: String, value: 'top' },
    isCurrent: { type: Boolean, value: false },
    showHand: { type: Boolean, value: false },
    validPlays: { type: Array, value: [] },
    selectedCard: { type: Object, value: null },
    canAct: { type: Boolean, value: false },
    hasValidPlays: { type: Boolean, value: false }
  },

  methods: {
    onCardTap(e) {
      if (!this.properties.canAct) return;
      this.triggerEvent('cardtap', e.detail);
    }
  }
});
