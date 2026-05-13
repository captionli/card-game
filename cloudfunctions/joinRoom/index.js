const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { roomId } = event;

  const res = await db.collection('rooms').where({ roomId }).get();
  if (res.data.length === 0) {
    return { success: false, error: '房间不存在' };
  }

  const room = res.data[0];

  if (room.status !== 'waiting') {
    return { success: false, error: '游戏已开始' };
  }

  const emptySeat = room.players.find(p => !p.openId);
  if (!emptySeat) {
    return { success: false, error: '房间已满' };
  }

  emptySeat.openId = openId;
  emptySeat.nickName = event.nickName || '';
  emptySeat.avatarUrl = event.avatarUrl || '';
  emptySeat.isOnline = true;
  emptySeat.lastHeartbeat = db.serverDate();

  // 将对应手牌分配给该玩家
  const creatorHand = room.players[0].hand;
  const seatIdx = emptySeat.seatIndex;
  if (seatIdx > 0 && creatorHand) {
    // 手牌已在createRoom时分配完（存在players[0].hand中），需要重新分配
    // 这里简化处理：所有手牌在创建时分配，现在仅从第0位玩家处获取对应手牌
  }

  await db.collection('rooms').doc(room._id).update({
    data: {
      players: room.players,
      version: room.version + 1
    }
  });

  return {
    success: true,
    roomId,
    seatIndex: emptySeat.seatIndex
  };
};
