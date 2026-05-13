# 憋7 微信小程序 — 开发文档 V1

> **版本**: 1.0.0（单机版）  
> **日期**: 2026-05-12  
> **状态**: 单机版（1人类+3AI）已完成，联机版待开发  
> **技术栈**: 微信原生小程序（WXML + WXSS + JS），无第三方依赖  

---

## 目录

1. [项目概述](#一项目概述)
2. [游戏规则](#二游戏规则)
3. [项目架构](#三项目架构)
4. [数据结构](#四数据结构)
5. [核心模块详解](#五核心模块详解)
6. [组件详解](#六组件详解)
7. [页面详解](#七页面详解)
8. [数据流与状态管理](#八数据流与状态管理)
9. [样式与布局](#九样式与布局)
10. [版本控制](#十版本控制)
11. [已知限制](#十一已知限制)
12. [Phase 3 联机开发计划](#十二phase-3-联机开发计划)
13. [未来需求](#十三未来需求)
14. [附录](#十四附录)

---

## 一、项目概述

### 1.1 项目背景

将现有的微信小游戏（飞机大战，Canvas渲染）完全改造为「憋7」多人联机卡牌游戏。采用微信原生小程序框架（WXML + WXSS + JS），先实现单机版（1人类+3AI）验证核心玩法，后续接入微信云开发实现线上多人联机。

### 1.2 憋7 简介

憋7（又称 Sevens / Fan Tan）是一款4人纸牌游戏，使用一副52张标准扑克（去掉大小王）。玩家轮流将手牌放到桌面，最先出完者为胜，最终根据扣牌分数排名。

### 1.3 技术选型

| 决策 | 选择 | 原因 |
|------|------|------|
| 项目类型 | 普通小程序 | 回合制卡牌不需要Canvas，WXML渲染UI组件更高效 |
| 渲染方式 | WXML + CSS | 卡牌用纯CSS绘制，无需图片素材，省体积且可任意缩放 |
| 单机AI | 客户端JS | 简单策略（优先小牌/扣大牌），无需服务端 |
| 联机方案 | 微信云开发 | 云数据库watch实时同步，云函数权威校验，免运维 |
| 包体积 | 全部主包 | 当前代码量极小（<100KB），无需分包 |

---

## 二、游戏规则

### 2.1 发牌

- 52张牌（♠ ♥ ♣ ♦ 四种花色，每种 A~K 共13张）
- 4名玩家，每人发13张
- 手牌按花色排序：♠ → ♥ → ♣ → ♦，同花色按点数从小到大

### 2.2 开局

- 持有 **红桃7（7♥）** 的玩家先出牌
- 桌面为空时，只能出四种花色的 7（不仅仅是7♥）

### 2.3 出牌规则

桌面有牌后：
- 只能出与桌面上已有牌**相邻**的牌（同花色、点数差1）
- 例如：桌上有 ♠5，则可以出 ♠4 或 ♠6
- 例如：桌上有 ♠5 和 ♠7，则可以出 ♠4、♠6 或 ♠8（6同时和5、7相邻）
- 每个花色从7开始向两端延伸，形成 [A...7...K] 的序列

### 2.4 扣牌

- 轮到某玩家时，若**没有任何可出的牌**，必须选择一张手牌扣住（面朝下放置）
- **有牌可出时，不能主动扣牌**（必须出牌）
- 扣牌需要玩家自己选择扣哪一张

### 2.5 结算

- 所有人手牌出完后游戏结束
- 扣牌分数计算：A=1, 2~10=面值, J=11, Q=12, K=13
- 扣牌总分最高者为最后一名，分数最低者获胜（排名按扣分升序）

---

## 三、项目架构

### 3.1 目录结构

```
d:\CCAPP\weixinbie7\
├── app.js                          # 小程序入口（App级生命周期）
├── app.json                        # 全局配置（页面路由/窗口样式）
├── app.wxss                        # 全局样式（背景色/字体）
├── .gitignore                      # Git忽略规则
├── sitemap.json                    # 站点地图（SEO配置）
├── project.config.json             # 项目配置（compileType: miniprogram）
├── project.private.config.json     # 个人私有配置（不入版本控制）
├── bie7.md                         # 原始游戏设计文档
├── bie7-V1.md                      # 本文档（开发文档V1）
│
├── pages/
│   ├── index/                      # 首页（游戏大厅）
│   │   ├── index.js                #   页面逻辑
│   │   ├── index.json              #   页面配置
│   │   ├── index.wxml              #   页面模板
│   │   └── index.wxss              #   页面样式
│   └── game/                       # 游戏对战页
│       ├── game.js                 #   游戏主控逻辑
│       ├── game.json               #   页面配置（引用组件）
│       ├── game.wxml               #   页面模板（桌面布局）
│       └── game.wxss               #   页面样式
│
├── components/
│   ├── card/                       # 单张卡牌组件
│   │   ├── card.js
│   │   ├── card.json
│   │   ├── card.wxml
│   │   └── card.wxss
│   ├── player-area/                # 玩家区域组件
│   │   ├── player-area.js
│   │   ├── player-area.json
│   │   ├── player-area.wxml
│   │   └── player-area.wxss
│   └── table-board/                # 桌面牌阵组件
│       ├── table-board.js
│       ├── table-board.json
│       ├── table-board.wxml
│       └── table-board.wxss
│
├── utils/
│   ├── constants.js                # 花色/点数/色值常量
│   ├── game-engine.js              # 核心游戏引擎（纯函数）
│   └── ai.js                       # AI决策模块
│
└── cloud/                          # 云函数目录（Phase 3 启用，当前为空）
```

### 3.2 组件依赖图

```
pages/game/game
├── table-board                    # 桌面中央牌阵
│   └── card                       #   每张已出的牌
├── player-area (×4)               # 4个玩家区域
│   └── card (×N)                  #   手牌（人类面朝上，AI牌背）
└── 结算弹窗（内联）               # 游戏结束排名
```

---

## 四、数据结构

### 4.1 单张牌 (Card)

```javascript
{
  suit: '♠' | '♥' | '♣' | '♦',  // 花色（Unicode字符）
  rank: 1-13                       // 点数，1=A, 11=J, 12=Q, 13=K
}
```

### 4.2 花色与点数常量

```javascript
// utils/constants.js
const SUITS = ['♠', '♥', '♣', '♦'];                      // 花色顺序（同时也是排序顺序）
const RANK_LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_MIN = 1;
const RANK_MAX = 13;

function cardLabel(rank)   → RANK_LABELS[rank]            // rank→显示文本
function cardRankValue(r)  → rank                         // 计分值
function isRed(suit)       → suit === '♥' || suit === '♦' // 红色花色
```

### 4.3 桌面状态 (Table)

**内部格式**（游戏引擎使用，O(1)查找）：

```javascript
// Map<Suit, Set<rank>>
// 示例: { '♠': Set{5,6,7}, '♥': Set{7}, '♣': Set{}, '♦': Set{7,8} }
const table = {};
for (const suit of SUITS) {
  table[suit] = new Set();
}
```

**展示格式**（传递给组件，兼容WXML数据绑定）：

```javascript
// Map<Suit, rank[]>
// 示例: { '♠': [5,6,7], '♥': [7], '♣': [], '♦': [7,8] }
```

### 4.4 玩家 (Player)

```javascript
{
  name: string,          // 昵称（人类: "你", AI: "电脑A/B/C"）
  seatIndex: number,     // 座位号 0-3
  isHuman: boolean,      // 是否人类玩家
  hand: Card[],          // 手牌（已排序：先花色后点数）
  withheld: Card[]       // 扣牌堆
}
```

座位布局：
- seatIndex 0 = 人类玩家（底部，全宽）
- seatIndex 1 = 电脑A（右侧）
- seatIndex 2 = 电脑B（顶部）
- seatIndex 3 = 电脑C（左侧）

### 4.5 游戏状态 (GameState)

页面 `data` 中的状态字段：

```javascript
{
  players: Player[],           // 4名玩家（每次操作后深拷贝）
  tableDisplay: Object,        // 桌面展示数据 { suit: rank[] }
  currentSeat: number,         // 当前回合玩家座位号
  selectedCard: Card|null,     // 人类当前选中的牌
  validPlays: Card[],          // 人类当前可出的牌
  hasValidPlays: boolean,      // 人类是否有可出牌（决定出牌/扣牌模式）
  phase: 'loading'|'playing'|'finished',
  statusText: string,          // 状态栏文字
  canAct: boolean,             // 人类是否可以操作
  playDisabled: boolean,       // 出牌按钮是否禁用
  withholdDisabled: boolean,   // 扣牌按钮是否禁用
  results: Ranking[]|null,     // 结算结果
  lastPlayedCard: Card|null,   // 最近一次出牌（预留动画用）
  showResult: boolean          // 是否显示结算弹窗
}
```

---

## 五、核心模块详解

### 5.1 game-engine.js — 游戏引擎

**设计原则**：纯函数风格，所有函数接收参数并返回/修改结果，不依赖全局状态。便于后续迁移到云函数（只需把函数体复制到云函数中）。

#### 函数清单

| 函数 | 签名 | 说明 |
|------|------|------|
| `createDeck()` | `() → Card[52]` | Fisher-Yates洗牌，返回52张随机顺序的牌 |
| `sortHand(hand)` | `(Card[]) → void` | 原地排序：先花色（♠♥♣♦）后点数（1→13） |
| `dealCards(deck, players)` | `(Card[52], Player[]) → void` | 4人循环发牌，每人13张，发完后排序 |
| `findFirstPlayer(players)` | `(Player[]) → number` | 找到持有7♥的玩家座位号 |
| `createTable()` | `() → Table` | 创建空桌面（4个空Set） |
| `isValidPlay(card, table)` | `(Card, Table) → boolean` | 判断某张牌是否可以打出 |
| `getValidPlays(player, table)` | `(Player, Table) → Card[]` | 获取玩家当前所有可出的牌 |
| `playCard(player, card, table)` | `(Player, Card, Table) → boolean` | 从手牌移除→加入桌面 |
| `withholdCard(player, card)` | `(Player, Card) → boolean` | 从手牌移除→加入扣牌堆 |
| `isGameOver(players)` | `(Player[]) → boolean` | 所有玩家手牌为空 |
| `findNextPlayerWithCards(players, cur)` | `(Player[], number) → number` | 跳过手牌空的玩家，循环找下一个 |
| `calcScore(player)` | `(Player) → number` | 计算扣分总分（rank值求和） |
| `getRankings(players)` | `(Player[]) → Ranking[]` | 按扣分升序排名，返回 [{player, rank, score}] |
| `createPlayers(humanName)` | `(string) → Player[4]` | 初始化4名玩家（1人类+3AI） |

#### isValidPlay 核心逻辑

```javascript
function isValidPlay(card, table) {
  const played = table[card.suit];   // Set<rank>
  if (played.size === 0) {
    return card.rank === 7;          // 空花色只能出7
  }
  return played.has(card.rank - 1) || played.has(card.rank + 1); // 相邻
}
```

#### 游戏主循环

```
initGame()
  → createPlayers() + createDeck() + dealCards()
  → findFirstPlayer()       ← 找7♥持有者
  → updateUIForCurrentPlayer(firstSeat)
      ├─ 人类座位 → 启用交互，计算validPlays
      └─ AI座位   → setTimeout(aiDelay) → executeAiTurn()
  → [玩家操作或AI执行]
  → afterAction()
      ├─ isGameOver? → endGame() → showResult
      └─ 否 → findNextPlayerWithCards() → updateUIForCurrentPlayer(nextSeat)
```

### 5.2 ai.js — AI策略

```javascript
function aiDecide(player, table) {
  const validPlays = getValidPlays(player, table);
  if (validPlays.length > 0) {
    return { action: 'play', card: validPlays[0] };  // 出第一张（小牌优先）
  }
  // 选分值最高的扣
  let maxCard = player.hand[0];
  for (const card of player.hand) {
    if (card.rank > maxCard.rank) maxCard = card;
  }
  return { action: 'withhold', card: maxCard };
}

function aiDelay() → 800 + Math.random() * 600  // 800~1400ms
```

**策略说明**：
- 当前为简单策略（优先出小牌，扣大牌）
- 进阶策略可扩展：延迟出关键牌（卡住对手）、优先出两端延伸等
- 模块化设计，替换AI只需修改 `aiDecide` 函数

### 5.3 constants.js — 常量定义

```javascript
const COLORS = {
  bg: '#1a5c2a',                    // 深绿色牌桌背景
  tableCenter: '#1e7030',           // 桌面中心
  redCard: '#e74c3c',               // ♥♦ 红色文字
  blackCard: '#2c3e50',             // ♠♣ 黑色文字
  cardBack: '#1a3a8a',              // 牌背蓝色
  highlight: '#ffd700',             // 选中金色边框
  playBtn: '#4caf50',               // 出牌按钮绿色
  withholdBtn: '#f44336',           // 扣牌按钮红色
  anchor7: '#ff9800',               // 7号位橙色边框
  cardBg: '#ffffff',                // 牌面白底
  emptySlot: 'rgba(255,255,255,0.15)',  // 空槽半透明
  activePlayer: 'rgba(255,215,0,0.3)',  // 当前玩家金色光晕
  disabledCard: 0.4                 // 不可出牌透明度
};
```

---

## 六、组件详解

### 6.1 card 组件（单张卡牌）

**文件**: `components/card/`

#### Properties

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| suit | String | '' | 花色符号 |
| rank | Number | 0 | 点数 1-13 |
| faceDown | Boolean | false | 是否牌背朝上 |
| disabled | Boolean | false | 是否灰显（不可出） |
| selected | Boolean | false | 是否选中（金色边框+上浮） |
| isNew | Boolean | false | 是否触发弹出动画 |
| compact | Boolean | false | 紧凑模式（桌面上的小牌） |

#### 渲染逻辑

- **正面**: 显示 rank 文字 + suit 符号，红/黑色根据花色决定
- **牌背**: 蓝色渐变 + 斜纹图案（CSS实现，无图片依赖）
- **选中**: `translateY(-16rpx)` + 金色边框阴影
- **禁用**: `opacity: 0.35`
- **弹出动画**: `@keyframes popIn` — scale 1.4→1.0, opacity 0.3→1.0, 300ms

#### 事件

| 事件 | 触发 | detail |
|------|------|--------|
| tap | 点击牌面（牌背不响应） | `{suit, rank}` |

#### CSS 类组合

```
.card .compact .red .selected .pop-in
.card .compact .black .disabled
.card .face-down                     → 蓝色牌背
```

### 6.2 player-area 组件（玩家区域）

**文件**: `components/player-area/`

#### Properties

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| player | Object | null | 玩家数据 |
| position | String | 'bottom' | top/left/right/bottom |
| isCurrent | Boolean | false | 是否当前回合（金色光晕） |
| showHand | Boolean | false | 是否展示手牌（人类=true, AI=false） |
| validPlays | Array | [] | 人类可出牌列表 |
| selectedCard | Object | null | 当前选中的牌 |
| canAct | Boolean | false | 人类是否可以操作 |
| hasValidPlays | Boolean | false | 人类是否有可出牌 |

#### 内部计算

组件通过 observer 监听属性变化，自动计算 `displayHand`：

```javascript
buildDisplayHand(hand, validPlays, selectedCard, hasValidPlays) {
  displayHand = hand.map(card => ({
    suit: card.suit,
    rank: card.rank,
    disabled: hasValidPlays && !validPlays.includes(card),  // 有可出牌时，不在可出列表中的灰显
    selected: selectedCard && cardMatch(selectedCard, card),
    key: `${card.suit}_${card.rank}`                        // 用于 wx:key
  }));
}
```

#### 显示状态

| 条件 | 显示内容 |
|------|----------|
| showHand=true | 手牌横向滚动列表（scroll-view） |
| showHand=false, 有手牌 | 蓝色牌背 × N |
| hand.length === 0 | "已出完所有牌" |

#### 事件

| 事件 | 触发 | detail |
|------|------|--------|
| cardtap | 点击手牌 | `{suit, rank}` |

### 6.3 table-board 组件（桌面牌阵）

**文件**: `components/table-board/`

#### Properties

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| table | Object | {} | 桌面数据 `{suit: rank[]}`，兼容Set和Array |
| lastPlayedCard | Object | null | 最近出牌（预留弹出动画） |

#### 渲染逻辑

```javascript
buildColumns(table) {
  // 对每个花色，从K(13)到A(1)生成13个槽位
  // 已出的牌渲染 card 组件，未出的渲染空槽
  // rank===7 的牌额外标记 isAnchor7（橙色边框）
}
```

#### 布局

```
  ♠       ♥       ♣       ♦       ← 花色标签（列头）
  K       K       K       K
  Q       Q       Q       Q
  ...     ...     ...     ...
┌─7─┐  ┌─7─┐  ┌─7─┐  ┌─7─┐       ← 锚点，橙色边框
  ...     ...     ...     ...
  A       A       A       A
```

- 4列 flex 横向排列，每列 `flex: 1, max-width: 120rpx`
- 槽位间距 `4rpx`
- 空槽: `rgba(255,255,255,0.08)` 背景 + 虚线边框 + 半透明点数标签
- 已出牌: card 组件 compact 模式
- 背景: 径向渐变 `#1e7030 → #155025`

---

## 七、页面详解

### 7.1 首页 — pages/index/

**路由**: `pages/index/index`（app.json 中首个页面 = 默认首页）

#### 布局

```
┌─────────────────────────────┐
│                             │
│          憋 7               │  ← 金色大字，96rpx
│      经典四人纸牌游戏        │  ← 副标题
│                             │
│   ┌─────────────────────┐   │
│   │  开始游戏（单机）    │   │  ← 绿色按钮，激活
│   └─────────────────────┘   │
│   ┌─────────────────────┐   │
│   │ 创建房间（即将开放） │   │  ← 橙色按钮，disabled
│   └─────────────────────┘   │
│   ┌─────────────────────┐   │
│   │ 加入房间（即将开放） │   │  ← 蓝色按钮，disabled
│   └─────────────────────┘   │
│                             │
│   ┌─ 规则简介 ──────────┐   │
│   │ 持有7♥的玩家先手     │   │
│   │ 必须出与桌面相邻的牌  │   │
│   │ 无牌可出时必须扣牌   │   │
│   │ 扣分最少者获胜       │   │
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

#### 交互

- 点击"开始游戏" → `wx.navigateTo({ url: '/pages/game/game?mode=single' })`
- 点击"创建房间"/"加入房间" → Toast "敬请期待"

### 7.2 游戏页 — pages/game/

**路由**: `pages/game/game`

#### 布局（CSS Grid）

```
┌──────────────┬───────────────────┬──────────────┐
│              │   AI玩家B (seat2)  │              │  行1: auto
│              │   手牌数/扣牌数     │              │
├──────────────┼───────────────────┼──────────────┤
│ AI玩家C      │                   │ AI玩家A      │
│ (seat3)      │   ♠ ♥ ♣ ♦       │ (seat1)      │  行2: 1fr
│ 左侧         │   桌面四列牌阵     │ 右侧         │
│              │                   │              │
├──────────────┴───────────────────┴──────────────┤
│                                                 │
│  [状态栏: "请选择一张牌出牌"]   [出牌] [扣牌]    │  行3: auto
│                                                 │
│  人类手牌 (横向滚动)                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐           │
│  │A♠│ │3♠│ │7♥│ │K♦│ │..│ │..│ │..│           │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘           │
│                                                 │
│  扣牌面板: [♠5] [♦K] ...                        │
└─────────────────────────────────────────────────┘
```

#### 生命周期

```
onLoad → initGame()
  → createPlayers / createDeck / dealCards / createTable
  → findFirstPlayer → updateUIForCurrentPlayer(seat)
  → [游戏循环: 人类操作或AI自动执行]
  → isGameOver? → endGame() → showResult弹窗
```

#### 人类操作流程

```
1. updateUIForCurrentPlayer(0)
   ├─ getValidPlays → 有牌可出: statusText="请选择一张牌出牌"
   │   ├─ 可出牌正常亮色，不可出牌灰暗(opacity:0.35)
   │   ├─ 点击可出牌 → 选中高亮(+金色边框+上浮)
   │   ├─ 点击不可出牌 → Toast "不符合出牌规则"
   │   └─ 点击"出牌"按钮 → onPlay() → syncState() → afterAction()
   └─ getValidPlays → 无牌可出: statusText="无牌可出，请选择一张牌扣住"
       ├─ 所有手牌可点击
       ├─ 点击手牌 → 选中高亮 → "扣牌"按钮激活
       └─ 点击"扣牌"按钮 → onWithhold() → syncState() → afterAction()
```

#### AI操作流程

```
1. updateUIForCurrentPlayer(seat)
   → statusText="等待 电脑X 思考中..."
   → setTimeout(aiDelay, 800~1400ms)
   → executeAiTurn(seat)
       ├─ aiDecide → 有牌: playCard(第一张) / 无牌: withholdCard(最大牌)
       └─ syncState() → afterAction()
```

#### 结算弹窗

```
┌─────────────────────────────┐
│        游戏结束              │
│                             │
│  #1  电脑A    扣分: 5       │
│  #2  你       扣分: 12      │  ← 人类高亮（金色边框）
│  #3  电脑C    扣分: 18      │
│  #4  电脑B    扣分: 25      │
│                             │
│  [再来一局]  [返回首页]     │
└─────────────────────────────┘
```

---

## 八、数据流与状态管理

### 8.1 setData 策略

**关键问题**：WeChat 小程序中，`setData` 对相同引用可能不触发变更检测。

**解决方案**：每次修改玩家数据后，通过 `clonePlayers()` 深拷贝：

```javascript
// pages/game/game.js
clonePlayers(players) {
  return players.map(p => ({
    ...p,
    hand: [...p.hand],         // 新数组引用
    withheld: [...p.withheld]  // 新数组引用
  }));
}

syncState(extra) {
  this.setData({
    players: this.clonePlayers(this.data.players),
    tableDisplay: this.tableToDisplay(),
    ...extra
  });
}
```

### 8.2 数据流图

```
game.js (页面状态)
  │
  ├─→ utils/game-engine.js  ← 纯函数，操作玩家对象和桌面Set
  │     ├─ hand.splice()     ← 修改手牌
  │     ├─ withheld.push()   ← 修改扣牌
  │     └─ table[Suit].add() ← 修改桌面
  │
  ├─→ syncState()            ← clonePlayers + setData
  │     │
  │     └─→ 触发组件 observer 和 WXML 重渲染
  │           ├─ player-area: 'player.hand' observer → buildDisplayHand
  │           └─ table-board: 'table' observer → buildColumns
  │
  └─→ 用户交互/AI决策
        └─→ 再次调用 engine → syncState → 循环
```

### 8.3 组件通信

```
game.wxml
  ├─→ table-board       props: table, lastPlayedCard
  │     (无事件，纯展示)
  │
  ├─→ player-area×3     props: player, position, isCurrent, showHand=false
  │     (无事件，纯展示)
  │
  └─→ player-area×1     props: ... showHand=true, validPlays, selectedCard, canAct
        bind:cardtap → game.onCardTap(e)
                         e.detail = {suit, rank}  ← 由 card 组件层层上传
```

事件链：
```
card 组件 tap 事件
  → card.triggerEvent('tap', {suit, rank})
    → player-area 捕获 bindtap → onCardTap → triggerEvent('cardtap', {suit, rank})
      → game 页面捕获 bind:cardtap → onCardTap(e) → e.detail = {suit, rank}
```

---

## 九、样式与布局

### 9.1 色值体系

| 用途 | 色值 | CSS变量位置 |
|------|------|------------|
| 全局背景 | #1a5c2a | app.wxss `page` |
| 桌面中心渐变 | #1e7030 → #155025 | table-board.wxss |
| 卡牌白底 | #ffffff | card.wxss |
| 红色牌面 | #e74c3c | card.wxss `.red` |
| 黑色牌面 | #2c3e50 | card.wxss `.black` |
| 牌背渐变 | #1a3a8a → #2a5ac0 | card.wxss `.face-down` |
| 选中高亮 | #ffd700 | card.wxss `.selected` |
| 当前回合光晕 | rgba(255,215,0,0.15) | player-area.wxss `.active-turn` |
| 出牌按钮 | #4caf50 | game.wxss `.play-btn` |
| 扣牌按钮 | #f44336 | game.wxss `.withhold-btn` |
| 7锚点 | #ff9800 | card.wxss `.anchor-7`（通过 class 控制） |
| 首页标题金 | #ffd700 | index.wxss `.title` |

### 9.2 适配方案

- 所有尺寸使用 **rpx** 单位（750rpx = 屏幕宽度）
- 卡牌标准尺寸: `64rpx × 88rpx`
- 卡牌紧凑尺寸: `44rpx × 60rpx`（桌面牌阵使用）
- 桌面4列使用 flex 横向排列，每列 `flex: 1; max-width: 120rpx`
- 手牌区使用 `scroll-view` 横向滚动（屏幕较小时）
- 布局使用 flexbox，不使用 CSS Grid（兼容性更好）

### 9.3 动画

| 动画 | 实现 | 时长 |
|------|------|------|
| 卡牌弹出 | CSS `@keyframes popIn` — scale+opacity | 300ms |
| 卡牌选中 | CSS `transition` — translateY+box-shadow | 200ms |
| 卡牌点击反馈 | CSS `hover-class` — scale(0.92) | 即时 |
| AI思考延迟 | JS `setTimeout` | 800~1400ms |
| 回合切换延迟 | JS `setTimeout` | 600ms |

---

## 十、版本控制

### 10.1 环境准备

#### 安装 Git

1. 前往 [git-scm.com](https://git-scm.com) 下载 Windows 版
2. 安装时一路默认即可（所有选项保持默认）
3. 安装完成后验证：
   ```powershell
   git --version
   # 应输出类似: git version 2.47.0
   ```

#### 托管平台

| 平台 | 地址 | 特点 |
|------|------|------|
| **GitHub**（推荐） | [github.com](https://github.com) | 全球最大，免费私有仓库，与微信开发者工具集成最好 |
| Gitee（码云） | [gitee.com](https://gitee.com) | 国内访问更快，中文界面 |

### 10.2 .gitignore 配置

项目根目录已创建 `.gitignore`，内容如下：

```gitignore
# 微信小程序
project.private.config.json

# 依赖（当前无npm依赖）
node_modules/

# 系统文件
.DS_Store
Thumbs.db
*.swp
*.swo

# IDE
.idea/
*.sublime-*
```

**说明**：
- `project.private.config.json` 包含个人 AppID 和本地设置，不应提交到仓库
- `sitemap.json` 会被提交（属于项目配置）
- 后续接入云开发后，`cloud/` 目录下云函数代码会提交，但 `node_modules/` 会被忽略

### 10.3 首次提交

```powershell
# 1. 进入项目目录
cd d:\CCAPP\weixinbie7

# 2. 初始化 Git 仓库
git init

# 3. 添加所有文件（.gitignore 会自动过滤）
git add .

# 4. 首次提交
git commit -m "V1.0.0: 憋7单机版（1人类+3AI）

- 项目从微信小游戏重构为普通小程序
- 实现完整憋7游戏规则引擎（utils/game-engine.js）
- AI自动对战（简单策略：优先出小牌，无牌出扣大牌）
- 游戏大厅首页（pages/index）
- 游戏对战页（pages/game）：桌面牌阵+4玩家区域+结算弹窗
- 3个可复用组件：card, player-area, table-board
- 纯CSS渲染卡牌，无图片依赖"

# 5. 打版本标签
git tag v1.0.0
```

### 10.4 推送到远程仓库

#### GitHub 操作步骤

1. 注册 [GitHub](https://github.com) 账号
2. 登录后点击右上角 **"+"** → **"New repository"**
3. 仓库名填 `bie7`，选 **Private**（私有）或 Public
4. 点击 "Create repository"
5. 创建后页面会显示推送命令，在终端执行：

```powershell
# 关联远程仓库（换成你自己的用户名）
git remote add origin https://github.com/你的用户名/bie7.git

# 推送到 GitHub
git push -u origin master

# 推送标签
git push --tags
```

### 10.5 日常开发流程

每次完成一个功能或修复后：

```powershell
# 1. 查看修改了哪些文件
git status

# 2. 添加修改的文件
git add .

# 3. 提交（写清楚改了什么）
git commit -m "修复: 出牌规则边界条件校验"

# 4. 推送到远程
git push
```

**提交信息规范建议**：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `新增:` | 新功能 | `新增: 房间创建与加入功能` |
| `修复:` | Bug修复 | `修复: 手牌出完后回合跳转异常` |
| `优化:` | 性能/体验改进 | `优化: 卡牌弹出动画帧率` |
| `重构:` | 代码结构调整 | `重构: game.js 拆分为多个模块` |
| `文档:` | 文档更新 | `文档: 更新联机开发计划` |

### 10.6 微信开发者工具集成

安装 Git 后，微信开发者工具自带的版本管理功能会自动可用：

- 点击工具栏左侧 **「版本管理」** 图标（或 `Ctrl+Shift+G`）
- 可以看到修改的文件列表、差异对比
- 直接在工具内完成 `add` → `commit` → `push`
- 分支切换和标签管理也可在工具内操作

### 10.7 分支策略

```
main              ← 稳定版本（可发布）
├── v1.0.0        ← 当前：单机版
├── v1.1.0        ← 未来：联机版（Phase 3）
└── develop       ← 日常开发（新功能先合到这里）
```

**使用方式**：

```powershell
# 开发新功能时创建分支
git checkout -b feature/room-system

# 开发完成后合并到 develop
git checkout develop
git merge feature/room-system

# 稳定后合并到 main
git checkout main
git merge develop
git tag v1.1.0
```

### 10.8 备份与恢复

```powershell
# 查看提交历史
git log --oneline --graph

# 回退到某个版本（保留修改）
git checkout <commit-hash>

# 丢弃本地修改，恢复到上一次提交
git checkout -- .

# 从远程重新克隆（换电脑时）
git clone https://github.com/你的用户名/bie7.git
```

---

## 十一、已知限制

### 11.1 当前版本的局限

| 限制 | 说明 | 影响 |
|------|------|------|
| 无图片素材 | 卡牌纯CSS渲染，花色用Unicode符号 | 部分旧设备花色符号可能显示不一致 |
| 无音效 | 未集成音效播放 | 游戏体验较安静 |
| AI策略简单 | 仅优先出小牌/扣大牌 | 缺乏挑战性 |
| 无中途退出处理 | 游戏页返回后状态丢失 | 不能断线重连 |
| 单页游戏 | 所有逻辑在 game.js 一个文件 | 随联机功能增加需拆分 |
| 无用户系统 | 无微信登录/头像/昵称 | Phase 3 需添加 |

### 11.2 兼容性说明

- 最低基础库版本：依赖 `wx:key`、Component observers 等特性，建议 ≥ 2.6.0
- 已在 `project.config.json` 设置 `"libVersion": "latest"`

---

## 十二、Phase 3 联机开发计划

### 12.1 前置条件

1. 在微信公众平台（mp.weixin.qq.com）开通云开发
2. 创建云开发环境（免费额度：数据库 2GB、云函数 1000万次/月）
3. 在 `app.js` 中初始化：
   ```javascript
   wx.cloud.init({ env: 'your-env-id' });
   ```

### 12.2 数据库设计

**集合**: `rooms`

```javascript
{
  _id: "auto_generated",
  roomId: "482915",                    // 6位数字房间号
  status: "waiting",                   // waiting | playing | finished
  maxPlayers: 4,
  createdAt: Date,
  ownerOpenId: "oxxx...",             // 房主

  players: [
    {
      openId: "oxxx...",
      nickName: "小明",
      avatarUrl: "...",
      seatIndex: 0,
      hand: [],                        // ⚠️ 仅云函数内部可见
      handCount: 13,                   // 对外暴露：手牌数量
      withheldCount: 0,                // 对外暴露：扣牌数量
      withheldScore: 0,                // 对外暴露：累计扣分
      isOnline: true,
      lastHeartbeat: Date
    }
    // ... up to 4
  ],

  // 游戏状态（所有人可见）
  table: {
    '♠': [7],
    '♥': [],
    '♣': [],
    '♦': []
  },

  currentPlayerSeat: 1,
  roundCount: 0,
  lastAction: {
    seatIndex: 0,
    type: "play",                      // play | withhold
    card: { suit: "♠", rank: 7 },
    timestamp: Date
  }
}
```

### 12.3 云函数

| 云函数 | 文件 | 功能 |
|--------|------|------|
| `createRoom` | `cloud/createRoom/index.js` | 生成6位房间号，洗牌发牌，写入rooms集合 |
| `joinRoom` | `cloud/joinRoom/index.js` | 加入已有房间，检查人数上限 |
| `playCard` | `cloud/playCard/index.js` | 校验合法性→更新桌面→切换回合 |
| `withholdCard` | `cloud/withholdCard/index.js` | 校验合法性→更新扣牌→切换回合 |
| `leaveRoom` | `cloud/leaveRoom/index.js` | 退出房间，标记托管或解散 |
| `heartbeat` | `cloud/heartbeat/index.js` | 心跳检测，标记离线 |

**云函数结构建议**:

```
cloud/
├── createRoom/
│   ├── index.js          # 云函数入口
│   ├── package.json      # 依赖声明
│   └── config.json       # 权限配置
├── playCard/
│   └── ...
└── shared/               # 共享模块
    ├── game-engine.js    # 从 utils/game-engine.js 复制
    └── constants.js      # 从 utils/constants.js 复制
```

### 12.4 客户端改造

#### 新增文件

| 文件 | 说明 |
|------|------|
| `pages/lobby/lobby.*` | 房间大厅（创建/加入房间，房间列表） |
| `pages/room/room.*` | 房间等待页（4个座位、分享按钮、准备状态） |
| `utils/cloud.js` | 云开发工具函数（watchRoom, callFunction等） |

#### 修改文件

| 文件 | 改动 |
|------|------|
| `app.js` | 添加 `wx.cloud.init()` |
| `app.json` | 添加 lobby/room 页面路由 |
| `pages/index/index.*` | "创建房间"/"加入房间"按钮激活，跳转到lobby |
| `pages/game/game.js` | 添加联机模式：从云数据库读取/监听状态，操作改为云函数调用 |

#### 实时同步流程

```
客户端A 出牌
  → 调用云函数 playCard(roomId, card)
    → 云函数校验合法性
    → 更新 rooms 集合文档
      → 云数据库 watch 自动推送给所有客户端
        → 客户端B/C/D 收到 onChange 回调
          → 更新本地游戏状态
```

### 12.5 安全性

| 风险 | 对策 | 实现位置 |
|------|------|----------|
| 客户端篡改手牌 | 手牌只在云函数内部操作 | 云函数 |
| 偷看他人手牌 | 数据库权限：`doc.players[].openId === auth.openId` 才可读hand字段 | 云开发控制台 |
| 出牌合法性 | 云函数中执行 `isValidPlay` 二次校验 | 云函数 |
| 重复操作 | 乐观锁：检查 `doc.version === expectedVersion` | 云函数 |
| 洗牌作弊 | 云函数使用安全随机数 | 云函数 |
| 回合顺序 | 只有 `currentPlayerSeat` 对应的玩家可以操作 | 云函数 |

### 12.6 断线重连

```
断线场景处理：
1. 客户端检测网络断开（wx.onNetworkStatusChange）
2. 显示"重连中..."遮罩
3. 重新 watch 房间数据 → 获取最新状态
4. 如果错过自己的回合 → 服务端已自动扣牌（超时机制）
5. 如果房间内只剩自己 → 提示并返回大厅

超时策略：
- 玩家回合超时（30秒）→ 云函数自动执行扣牌
- 长期离线（5分钟）→ 标记为托管（AI代打）
- 所有玩家离线 → 房间标记为 abandoned
```

---

## 十三、未来需求

### 13.1 短期（V1.1 — 联机版）

- [ ] 云开发环境搭建
- [ ] 6个云函数开发与部署
- [ ] 房间创建/加入/分享
- [ ] 实时状态同步（watch）
- [ ] 微信好友邀请（`wx.shareAppMessage` 分享房间号）
- [ ] 用户头像昵称获取与展示
- [ ] 断线重连与超时自动托管

### 13.2 中期（V1.2 — 体验优化）

- [ ] 音效系统（出牌声、扣牌声、回合提示音）
- [ ] 卡牌动画优化（出牌飞入桌面、扣牌翻转动画）
- [ ] AI 难度分级（简单=随机出牌，困难=策略最优）
- [ ] 支持2-3人模式（不足4人时AI补齐）
- [ ] 游戏内聊天（快捷短语/表情，避免打字）
- [ ] 历史战绩记录（云数据库存储对局记录）
- [ ] 再来一局（同一房间自动重新开始）

### 13.3 长期（V2.0 — 产品化）

- [ ] 观战模式（第5人加入只能观看）
- [ ] 排行榜（微信好友排行 + 全服排行）
- [ ] 多房间同时进行（大厅浏览房间列表）
- [ ] 房间设置面板（回合超时时间、是否允许中途加入）
- [ ] 牌局回放（按时间轴播放对局过程）
- [ ] 小游戏版本评估（如果需要更流畅的动画体验）
- [ ] 多语言支持（英语/繁体中文）
- [ ] 无障碍适配（旁白模式、大字体模式）

### 13.4 技术债务

- [ ] 将 game.js 拆分为多个模块（状态管理/UI更新/AI调度）
- [ ] 添加单元测试（game-engine.js 的纯函数非常适合测试）
- [ ] 错误边界处理（云函数调用失败的重试逻辑）
- [ ] 性能监控（setData 调用频率和数据量）
- [ ] 代码规范（ESLint + Prettier 配置）
- [ ] TypeScript 迁移评估

---

## 十四、附录

### A. 牌面数值参考

| 点数 | 标签 | 分数 | 花色排序 |
|------|------|------|----------|
| 1 | A | 1 | ♠(0) |
| 2 | 2 | 2 | ♥(1) |
| 3 | 3 | 3 | ♣(2) |
| 4 | 4 | 4 | ♦(3) |
| 5 | 5 | 5 | |
| 6 | 6 | 6 | |
| 7 | 7 | 7 | |
| 8 | 8 | 8 | |
| 9 | 9 | 9 | |
| 10 | 10 | 10 | |
| 11 | J | 11 | |
| 12 | Q | 12 | |
| 13 | K | 13 | |

### B. 测试清单

#### 功能测试

- [ ] 4名玩家各发13张牌，总计52张无重复
- [ ] 持有7♥的玩家先手
- [ ] 首轮只能出7（四个花色均可，不限于7♥）
- [ ] 出牌规则：仅相邻牌可出（包括填补缺口场景：桌上有5和7时可出6）
- [ ] 有牌可出时扣牌按钮禁用
- [ ] 无牌可出时出牌按钮禁用，必须自选一张扣牌
- [ ] 点击不可出牌时Toast提示"不符合出牌规则"
- [ ] AI自动出牌/扣牌（出小牌/扣大牌）
- [ ] 手牌出完后自动跳过该玩家
- [ ] 全部出完后正确结算，扣分高者排名低（第4名）
- [ ] 再来一局按钮正确重置所有状态
- [ ] 返回首页按钮正常工作

#### UI测试

- [ ] 桌面牌阵4列×13行正确渲染
- [ ] 已出牌显示白色底面+红/黑色文字
- [ ] 未出牌显示半透明空槽+灰色标签
- [ ] 7号位橙色边框突出显示
- [ ] 当前回合玩家金色光晕
- [ ] 人类手牌可出/不可出亮度区分（opacity 1.0 vs 0.35）
- [ ] 选中卡牌金色边框+上浮效果
- [ ] AI手牌蓝色牌背+数量正确
- [ ] 结算弹窗排名正确+人类高亮
- [ ] 小屏设备手牌可横向滚动

#### 边界测试

- [ ] 起手无7的玩家首轮必须扣牌
- [ ] 最后一个出牌的人触发游戏结束
- [ ] 某花色两端均已延伸到A和K后的出牌逻辑
- [ ] 快速点击（连点）不会导致重复操作
- [ ] AI回合中退出再进入的状态

### C. 开发环境搭建

1. 下载[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目 `d:\CCAPP\weixinbie7`
3. 使用测试号或注册的 AppID
4. 编译运行即可

**注意**：`project.private.config.json` 包含个人配置（如 AppID），不应提交到版本控制。

### D. 关键代码片段

#### D.1 洗牌算法

```javascript
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank });
    }
  }
  // Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
```

#### D.2 AI决策

```javascript
function aiDecide(player, table) {
  const validPlays = getValidPlays(player, table);
  if (validPlays.length > 0) {
    return { action: 'play', card: validPlays[0] }; // 出第一张
  }
  // 扣分值最高的牌
  let maxCard = player.hand[0];
  for (const card of player.hand) {
    if (card.rank > maxCard.rank) maxCard = card;
  }
  return { action: 'withhold', card: maxCard };
}
```

#### D.3 深拷贝玩家数据（触发setData更新）

```javascript
clonePlayers(players) {
  return players.map(p => ({
    ...p,
    hand: [...p.hand],
    withheld: [...p.withheld]
  }));
}
```

#### D.4 组件数据预处理（避免WXML中调用方法）

```javascript
// player-area.js — buildDisplayHand
buildDisplayHand(hand, validPlays, selectedCard, hasValidPlays) {
  const displayHand = hand.map((card, index) => ({
    suit: card.suit,
    rank: card.rank,
    disabled: hasValidPlays && !validPlays.some(
      vp => vp.suit === card.suit && vp.rank === card.rank
    ),
    selected: selectedCard
      && selectedCard.suit === card.suit
      && selectedCard.rank === card.rank,
    key: card.suit + '_' + card.rank
  }));
  this.setData({ displayHand });
}
```

---

> **文档维护者**: Claude Code  
> **最后更新**: 2026-05-12  
> **下一步**: Phase 3 联机开发（需先开通微信云开发环境）
