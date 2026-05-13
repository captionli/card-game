const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function isValidPlay(card, table) {
  const played = table[card.suit] || [];
  if (played.length === 0) {
    return card.rank === 7;
  }
  return played.includes(card.rank - 1) || played.includes(card.rank + 1);
}

function findNextPlayer(players, currentSeat) {
  let next = (currentSeat + 1) % 4;
  while (players[next].handCount === 0) {
    next = (next + 1) % 4;
  }
  return next;
}

function isGameOver(players) {
  return players.every(p => p.handCount === 0);
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { roomId, card } = event;

  const res = await db.collection('rooms').where({ roomId }).get();
  if (res.data.length === 0) {
    return { success: false, error: '房间不存在' };
  }

  const room = res.data[0];

  if (room.status !== 'playing') {
    return { success: false, error: '游戏未开始' };
  }

  const currentPlayer = room.players[room.currentPlayerSeat];
  if (currentPlayer.openId !== openId) {
    return { success: false, error: '不是你的回合' };
  }

  if (!isValidPlay(card, room.table)) {
    return { success: false, error: '不符合出牌规则' };
  }

  const handIdx = currentPlayer.hand.findIndex(
    c => c.suit === card.suit && c.rank === card.rank
  );
  if (handIdx === -1) {
    return { success: false, error: '手牌中没有这张牌' };
  }

  currentPlayer.hand.splice(handIdx, 1);
  currentPlayer.handCount = currentPlayer.hand.length;
  room.table[card.suit].push(card.rank);
  room.table[card.suit].sort((a, b) => a - b);
  room.lastAction = {
    seatIndex: room.currentPlayerSeat,
    type: 'play',
    card,
    timestamp: db.serverDate()
  };

  if (isGameOver(room.players)) {
    room.status = 'finished';
  } else {
    room.currentPlayerSeat = findNextPlayer(room.players, room.currentPlayerSeat);
  }

  room.version = (room.version || 0) + 1;

  await db.collection('rooms').doc(room._id).update({
    data: {
      players: room.players,
      table: room.table,
      currentPlayerSeat: room.currentPlayerSeat,
      status: room.status,
      lastAction: room.lastAction,
      version: room.version
    }
  });

  return { success: true };
};
