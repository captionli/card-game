const db = wx.cloud.database();

function callFunction(name, data) {
  return wx.cloud.callFunction({ name, data }).then(res => res.result);
}

function watchRoom(roomId, onChange) {
  const watcher = db.collection('rooms')
    .where({ roomId })
    .watch({
      onChange(snapshot) {
        if (snapshot.docs.length > 0) {
          onChange(snapshot.docs[0]);
        }
      },
      onError(err) {
        console.error('watch error:', err);
      }
    });
  return watcher;
}

async function createRoom(nickName, avatarUrl) {
  return callFunction('createRoom', { nickName, avatarUrl });
}

async function joinRoom(roomId, nickName, avatarUrl) {
  return callFunction('joinRoom', { roomId, nickName, avatarUrl });
}

async function doPlayCard(roomId, card) {
  return callFunction('playCard', { roomId, card });
}

async function doWithholdCard(roomId, card) {
  return callFunction('withholdCard', { roomId, card });
}

module.exports = {
  callFunction,
  watchRoom,
  createRoom,
  joinRoom,
  doPlayCard,
  doWithholdCard
};
