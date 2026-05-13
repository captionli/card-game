const engine = require('../../utils/game-engine');
const ai = require('../../utils/ai');
const { SUITS, RANK_LABELS } = require('../../utils/constants');

Page({
  data: {
    players: [],
    tableDisplay: {},
    currentSeat: -1,
    selectedCard: null,
    validPlays: [],
    hasValidPlays: true,
    phase: 'loading',
    statusText: '',
    statusRed: false,
    canAct: false,
    playDisabled: true,
    withholdDisabled: true,
    results: null,
    lastPlayedCard: null,
    showResult: false,
    withheldDisplay: [],
    displayHand: [],
    totalScores: [0, 0, 0, 0],
    roundNumber: 0,
    swapMode: false,
    swapPhase: false,
    swapSelected: [],
    swapSum: 0
  },

  _table: null,

  onLoad(options) {
    this.setData({ swapMode: options.mode === 'swap' });
    this.initGame();
  },

  initGame() {
    this.setData({ totalScores: [0, 0, 0, 0], roundNumber: 0 });
    this.startNewRound();
  },

  startNewRound() {
    const players = engine.createPlayers('你');
    const deck = engine.createDeck();
    engine.dealCards(deck, players);
    this._table = engine.createTable();

    const firstSeat = engine.findFirstPlayer(players);
    const round = this.data.roundNumber + 1;

    const baseData = {
      players: this.clonePlayers(players),
      tableDisplay: this.tableToDisplay(),
      currentSeat: firstSeat,
      phase: 'playing',
      selectedCard: null,
      canAct: firstSeat === 0,
      results: null,
      lastPlayedCard: null,
      showResult: false,
      roundNumber: round
    };

    if (this.data.swapMode) {
      this.setData({
        ...baseData,
        phase: 'swap',
        swapPhase: true,
        swapSelected: [],
        swapSum: 0,
        statusText: '换三张：选3张牌，点数和≤21，换给对家',
        statusRed: false,
        displayHand: this.buildDisplayHand(players[0].hand, [], null, false)
      });
    } else {
      this.setData(baseData);
      this.updateUIForCurrentPlayer(firstSeat);
    }
  },

  clonePlayers(players) {
    return players.map(p => ({
      ...p,
      hand: [...p.hand],
      withheld: [...p.withheld]
    }));
  },

  tableToDisplay() {
    const display = {};
    for (const suit of SUITS) {
      display[suit] = Array.from(this._table[suit] || []);
    }
    return display;
  },

  buildDisplayHand(hand, validPlays, selectedCard, hasValidPlays) {
    return hand.map(card => {
      const isPlayable = hasValidPlays
        ? validPlays.some(vp => vp.suit === card.suit && vp.rank === card.rank)
        : true;
      const isSelected = selectedCard
        && selectedCard.suit === card.suit
        && selectedCard.rank === card.rank;
      return {
        suit: card.suit,
        rank: card.rank,
        disabled: hasValidPlays && !isPlayable,
        selected: isSelected,
        key: card.suit + '_' + card.rank
      };
    });
  },

  syncState(extra) {
    const p0 = this.data.players[0];
    this.setData({
      players: this.clonePlayers(this.data.players),
      tableDisplay: this.tableToDisplay(),
      withheldDisplay: this.buildWithheldDisplay(p0.withheld),
      displayHand: this.buildDisplayHand(p0.hand, this.data.validPlays, this.data.selectedCard, this.data.hasValidPlays),
      ...extra
    });
  },

  buildWithheldDisplay(withheld) {
    return withheld.map(c => ({
      suit: c.suit,
      rank: c.rank,
      label: RANK_LABELS[c.rank],
      red: c.suit === '♥' || c.suit === '♦',
      key: c.suit + '_' + c.rank
    }));
  },

  // ===== 换三张阶段 =====
  onSwapTap(e) {
    if (this.data.phase !== 'swap') return;
    const { suit, rank } = e.detail;
    const selected = [...this.data.swapSelected];
    const idx = selected.findIndex(c => c.suit === suit && c.rank === rank);

    if (idx >= 0) {
      selected.splice(idx, 1);
    } else {
      if (selected.length >= 3) {
        wx.showToast({ title: '已选满3张', icon: 'none', duration: 1000 });
        return;
      }
      const newSum = this.data.swapSum + rank;
      if (newSum > 21) {
        wx.showToast({ title: '点数和不能超过21', icon: 'none', duration: 1000 });
        return;
      }
      selected.push({ suit, rank });
    }

    const sum = selected.reduce((s, c) => s + c.rank, 0);
    this.setData({
      swapSelected: selected,
      swapSum: sum,
      displayHand: this.buildSwapDisplay(this.data.players[0].hand, selected)
    });
  },

  buildSwapDisplay(hand, selected) {
    return hand.map(card => ({
      suit: card.suit,
      rank: card.rank,
      disabled: false,
      selected: selected.some(c => c.suit === card.suit && c.rank === card.rank),
      key: card.suit + '_' + card.rank
    }));
  },

  onConfirmSwap() {
    if (this.data.swapSelected.length !== 3) {
      wx.showToast({ title: '请选满3张', icon: 'none' });
      return;
    }

    const human = this.data.players[0];
    const opposite = this.data.players[2];

    const humanCards = [];
    const aiCards = [];
    const selected = this.data.swapSelected;

    for (const sc of selected) {
      const hi = human.hand.findIndex(c => c.suit === sc.suit && c.rank === sc.rank);
      if (hi >= 0) humanCards.push(...human.hand.splice(hi, 1));
    }

    for (let i = 0; i < selected.length; i++) {
      if (opposite.hand.length > 0) {
        const ri = Math.floor(Math.random() * opposite.hand.length);
        aiCards.push(...opposite.hand.splice(ri, 1));
      }
    }

    human.hand.push(...aiCards);
    opposite.hand.push(...humanCards);
    engine.sortHand(human.hand);
    engine.sortHand(opposite.hand);

    // 进入预览阶段，只显示换来的3张
    const previewDisplay = aiCards.map(c => ({
      suit: c.suit,
      rank: c.rank,
      disabled: false,
      selected: false,
      key: c.suit + '_' + c.rank
    }));

    this.setData({
      phase: 'preview',
      swapPhase: true,
      swapSelected: [],
      swapSum: 0,
      players: this.clonePlayers(this.data.players),
      statusText: '换得3张牌',
      displayHand: previewDisplay
    });
  },

  onConfirmPreview() {
    const firstSeat = this.data.currentSeat;
    this.setData({
      phase: 'playing',
      swapPhase: false,
      displayHand: []
    });
    this.updateUIForCurrentPlayer(firstSeat);
  },

  updateUIForCurrentPlayer(seat) {
    const player = this.data.players[seat];

    if (seat === 0) {
      const validPlays = engine.getValidPlays(player, this._table);
      const hasValid = validPlays.length > 0;
      const statusText = hasValid
        ? '请选择一张牌出牌'
        : '无牌可出，请选择一张牌扣住';

      this.setData({
        canAct: true,
        validPlays,
        hasValidPlays: hasValid,
        statusText,
        statusRed: !hasValid,
        playDisabled: !hasValid,
        withholdDisabled: hasValid,
        selectedCard: null,
        displayHand: this.buildDisplayHand(player.hand, validPlays, null, hasValid)
      });
    } else {
      this.setData({
        canAct: false,
        statusRed: false,
        selectedCard: null,
        statusText: '等待 ' + player.name + ' 思考中...'
      });

      setTimeout(() => {
        this.executeAiTurn(seat);
      }, ai.aiDelay());
    }
  },

  executeAiTurn(seat) {
    if (this.data.phase !== 'playing') return;
    if (this.data.currentSeat !== seat) return;

    const players = this.data.players;
    const player = players[seat];
    const decision = ai.aiDecide(player, this._table);

    if (decision.action === 'play') {
      engine.playCard(player, decision.card, this._table);
      this.syncState({ lastPlayedCard: decision.card });
    } else {
      engine.withholdCard(player, decision.card);
      this.syncState({ lastPlayedCard: null });
    }

    this.afterAction();
  },

  onCardTap(e) {
    if (!this.data.canAct) return;

    const { suit, rank } = e.detail;
    const selectedCard = { suit, rank };
    const now = Date.now();
    const last = this._lastTap || {};

    if (this.data.hasValidPlays && last.suit === suit && last.rank === rank && (now - last.time) < 400) {
      this._lastTap = null;
      this.setData({ selectedCard, playDisabled: false });
      this.onPlay();
      return;
    }

    this._lastTap = { suit, rank, time: now };

    if (this.data.hasValidPlays) {
      const isValid = this.data.validPlays.some(
        c => c.suit === suit && c.rank === rank
      );
      if (!isValid) {
        wx.showToast({ title: '不符合出牌规则', icon: 'none', duration: 1500 });
        return;
      }
      this.setData({
        selectedCard,
        playDisabled: false,
        displayHand: this.buildDisplayHand(
          this.data.players[0].hand, this.data.validPlays, selectedCard, true
        )
      });
    } else {
      this.setData({
        selectedCard,
        withholdDisabled: false,
        displayHand: this.buildDisplayHand(
          this.data.players[0].hand, [], selectedCard, false
        )
      });
    }
  },

  onPlay() {
    if (!this.data.selectedCard || !this.data.canAct) return;

    const players = this.data.players;
    const player = players[0];
    const card = this.data.selectedCard;
    engine.playCard(player, card, this._table);

    this.syncState({
      lastPlayedCard: card,
      canAct: false,
      selectedCard: null,
      playDisabled: true,
      withholdDisabled: true
    });

    this.afterAction();
  },

  onWithhold() {
    if (!this.data.selectedCard || !this.data.canAct) return;

    const players = this.data.players;
    const player = players[0];
    const card = this.data.selectedCard;
    engine.withholdCard(player, card);

    this.syncState({
      canAct: false,
      selectedCard: null,
      playDisabled: true,
      withholdDisabled: true
    });

    this.afterAction();
  },

  afterAction() {
    if (engine.isGameOver(this.data.players)) {
      this.endRound();
      return;
    }

    const nextSeat = engine.findNextPlayerWithCards(
      this.data.players,
      this.data.currentSeat
    );

    this.setData({ currentSeat: nextSeat });

    setTimeout(() => {
      this.updateUIForCurrentPlayer(nextSeat);
    }, 600);
  },

  endRound() {
    const rankings = engine.getRankings(this.data.players);
    const totals = [...this.data.totalScores];
    const results = rankings.map(r => {
      const idx = r.player.seatIndex;
      totals[idx] += r.score;
      return {
        rank: r.rank,
        name: r.player.name,
        score: r.score,
        total: totals[idx],
        isHuman: r.player.isHuman,
        withheld: r.player.withheld.map(c => ({
          suit: c.suit,
          label: RANK_LABELS[c.rank],
          red: c.suit === '♥' || c.suit === '♦'
        }))
      };
    });

    this.setData({
      phase: 'finished',
      statusText: '本轮结束',
      canAct: false,
      results,
      totalScores: totals,
      showResult: true
    });
  },

  onNextRound() {
    this.setData({ showResult: false });
    this.startNewRound();
  },

  onFinishGame() {
    wx.navigateBack();
  },

  onBackHome() {
    wx.navigateBack();
  }
});
