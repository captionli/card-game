const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const SUITS = ['♠', '♥', '♣', '♦'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
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

function generateRoomId() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function findFirstPlayer(hands) {
  for (let i = 0; i < hands.length; i++) {
    if (hands[i].some(c => c.suit === '♥' && c.rank === 7)) {
      return i;
    }
  }
  return 0;
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  const deck = createDeck();
  const hands = [[], [], [], []];
  for (let i = 0; i < 52; i++) {
    hands[i % 4].push(deck[i]);
  }
  for (const h of hands) sortHand(h);

  const firstSeat = findFirstPlayer(hands);

  const roomId = generateRoomId();

  const room = {
    roomId,
    status: 'waiting',
    maxPlayers: 4,
    createdAt: db.serverDate(),
    ownerOpenId: openId,
    version: 0,
    currentPlayerSeat: firstSeat,
    table: { '♠': [], '♥': [], '♣': [], '♦': [] },
    lastAction: null,
    players: [
      {
        openId,
        nickName: '',
        avatarUrl: '',
        seatIndex: 0,
        hand: hands[0],
        handCount: 13,
        withheldCount: 0,
        withheldScore: 0,
        isOnline: true,
        lastHeartbeat: db.serverDate()
      },
      { openId: '', nickName: '', avatarUrl: '', seatIndex: 1, hand: [], handCount: 0, withheldCount: 0, withheldScore: 0, isOnline: false, lastHeartbeat: null },
      { openId: '', nickName: '', avatarUrl: '', seatIndex: 2, hand: [], handCount: 0, withheldCount: 0, withheldScore: 0, isOnline: false, lastHeartbeat: null },
      { openId: '', nickName: '', avatarUrl: '', seatIndex: 3, hand: [], handCount: 0, withheldCount: 0, withheldScore: 0, isOnline: false, lastHeartbeat: null }
    ]
  };

  const result = await db.collection('rooms').add({ data: room });

  return {
    success: true,
    roomId,
    docId: result._id,
    hand: hands[0],
    firstSeat
  };
};
