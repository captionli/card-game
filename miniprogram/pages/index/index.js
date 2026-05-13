Page({
  data: {},

  onLoad() {},

  startNormal() {
    wx.navigateTo({ url: '/pages/game/game?mode=normal' });
  },

  startSwap() {
    wx.navigateTo({ url: '/pages/game/game?mode=swap' });
  },

  goToLobby() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  }
});
