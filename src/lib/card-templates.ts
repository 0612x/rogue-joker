import { TFTCard, ModifierTier } from '@/types/game';

type CardTemplate = Omit<TFTCard, 'id' | 'stars' | 'stats'> & {
  baseStats: {
    chips?: number;
    mult?: number;
    percentMult?: number;
  }
};

export const TFT_CARD_TEMPLATES: CardTemplate[] = [
  // --- 1 Cost (8 cards) ---
  {
    templateId: 'tft-blade-assassin-1',
    name: '暗巷快刀',
    description: '只打出单张 ♠ 时，基础伤害增加。',
    synergies: ['锋刃', '刺客'],
    rarity: 'common',
    cost: 1,
    baseStats: { chips: 15 },
    starEffects: {
      1: '只打出单张 ♠ 时，基础伤害 +15',
      2: '只打出单张 ♠ 时，基础伤害 +35',
      3: '只打出单张 ♠ 时，基础伤害 +100'
    }
  },
  {
    templateId: 'tft-fortress-calc-1',
    name: '铁壁算盘',
    description: '打出红桃对子时，额外获得护甲。',
    synergies: ['堡垒', '算力者'],
    rarity: 'common',
    cost: 1,
    baseStats: { chips: 0 },
    starEffects: {
      1: '打出红桃对子时，获得 20 护甲',
      2: '打出红桃对子时，获得 40 护甲',
      3: '打出红桃对子时，获得 120 护甲'
    }
  },
  {
    templateId: 'tft-venom-magician-1',
    name: '剧毒吹箭',
    description: '每次使用“换牌”，对怪物施加中毒。',
    synergies: ['猛毒', '魔术师'],
    rarity: 'common',
    cost: 1,
    baseStats: { chips: 0 },
    starEffects: {
      1: '换牌时施加 2 层毒',
      2: '换牌时施加 4 层毒',
      3: '换牌时施加 12 层毒'
    }
  },
  {
    templateId: 'tft-pluto-calc-1',
    name: '贪婪矿工',
    description: '打出方块对子时，额外掉落金币。',
    synergies: ['财阀', '算力者'],
    rarity: 'common',
    cost: 1,
    baseStats: { chips: 0 },
    starEffects: {
      1: '打出方块对子掉落 1 金币',
      2: '打出方块对子掉落 2 金币',
      3: '打出方块对子掉落 6 金币'
    }
  },
  {
    templateId: 'tft-blade-wanderer-1',
    name: '深海潜行者',
    description: '打出黑桃同花时，为你恢复生命值。',
    synergies: ['锋刃', '浪客'],
    rarity: 'common',
    cost: 1,
    baseStats: { chips: 0 },
    starEffects: {
      1: '黑桃同花恢复 5 生命',
      2: '黑桃同花恢复 10 生命',
      3: '黑桃同花恢复 30 生命'
    }
  },
  {
    templateId: 'tft-fortress-geek-1',
    name: '逻辑门卫',
    description: '打出顺子时，清除手牌负面状态。',
    synergies: ['堡垒', '极客'],
    rarity: 'common',
    cost: 1,
    baseStats: { chips: 0 },
    starEffects: {
      1: '顺子清除 1 个负面状态',
      2: '顺子清除 2 个负面状态',
      3: '顺子清除 5 个负面状态'
    }
  },
  {
    templateId: 'tft-venom-geek-1',
    name: '生化黑客',
    description: '打出顺子时，如果怪物中毒，毒发伤害结算。',
    synergies: ['猛毒', '极客'],
    rarity: 'common',
    cost: 1,
    baseStats: { chips: 0 },
    starEffects: {
      1: '顺子结算 1 次毒伤',
      2: '顺子结算 2 次毒伤',
      3: '顺子结算 5 次毒伤'
    }
  },
  {
    templateId: 'tft-pluto-gambler-1',
    name: '发牌童子',
    description: '回合结束时，未使用的出牌次数转化为金币。',
    synergies: ['财阀', '老千'],
    rarity: 'common',
    cost: 1,
    baseStats: { chips: 0 },
    starEffects: {
      1: '剩余出牌次数转 1 金币',
      2: '剩余出牌次数转 2 金币',
      3: '剩余出牌次数转 5 金币'
    }
  },

  // --- 2 Cost (8 cards) ---
  {
    templateId: 'tft-blade-calc-2',
    name: '处刑双刃',
    description: '打出黑桃对子时，若怪物血量低则秒杀。',
    synergies: ['锋刃', '算力者'],
    rarity: 'rare',
    cost: 2,
    baseStats: { chips: 0 },
    starEffects: {
      1: '血量 < 10% 秒杀',
      2: '血量 < 20% 秒杀',
      3: '血量 < 50% 秒杀'
    }
  },
  {
    templateId: 'tft-fortress-wanderer-2',
    name: '赤血海妖',
    description: '打出红桃同花时，永久提升生命上限。',
    synergies: ['堡垒', '浪客'],
    rarity: 'rare',
    cost: 2,
    baseStats: { chips: 0 },
    starEffects: {
      1: '红桃同花生命上限 +2',
      2: '红桃同花生命上限 +5',
      3: '红桃同花生命上限 +15'
    }
  },
  {
    templateId: 'tft-venom-gambler-2',
    name: '走私毒枭',
    description: '回合结束时，怪物身上每有 10 层毒获得金币。',
    synergies: ['猛毒', '老千'],
    rarity: 'rare',
    cost: 2,
    baseStats: { chips: 0 },
    starEffects: {
      1: '每 10 层毒获得 1 金币',
      2: '每 10 层毒获得 2 金币',
      3: '每 10 层毒获得 6 金币'
    }
  },
  {
    templateId: 'tft-pluto-assassin-2',
    name: '赏金猎头',
    description: '单出方块击杀怪物时，掉落金币宝箱。',
    synergies: ['财阀', '刺客'],
    rarity: 'rare',
    cost: 2,
    baseStats: { chips: 0 },
    starEffects: {
      1: '击杀掉落 5 金币宝箱',
      2: '击杀掉落 12 金币宝箱',
      3: '击杀掉落 30 金币宝箱'
    }
  },
  {
    templateId: 'tft-blade-magician-2',
    name: '幻影飞刀',
    description: '换牌后，下一次出牌总倍率增加。',
    synergies: ['锋刃', '魔术师'],
    rarity: 'rare',
    cost: 2,
    baseStats: { chips: 0 },
    starEffects: {
      1: '换牌后倍率 +1',
      2: '换牌后倍率 +3',
      3: '换牌后倍率 +8'
    }
  },
  {
    templateId: 'tft-fortress-assassin-2',
    name: '孤高骑士',
    description: '如果本回合只出 1 次牌就结束，获得护甲。',
    synergies: ['堡垒', '刺客'],
    rarity: 'rare',
    cost: 2,
    baseStats: { chips: 0 },
    starEffects: {
      1: '单次出牌结束获得 50 护甲',
      2: '单次出牌结束获得 120 护甲',
      3: '单次出牌结束获得 400 护甲'
    }
  },
  {
    templateId: 'tft-venom-calc-2',
    name: '连环炸弹客',
    description: '打出“三条”或“四条”时，复制中毒层数。',
    synergies: ['猛毒', '算力者'],
    rarity: 'rare',
    cost: 2,
    baseStats: { chips: 0 },
    starEffects: {
      1: '复制 1 份毒层数',
      2: '复制 2 份毒层数',
      3: '复制 4 份毒层数'
    }
  },
  {
    templateId: 'tft-pluto-geek-2',
    name: '黄金罗盘',
    description: '打出包含方块的顺子时，下回合商店必出财阀卡。',
    synergies: ['财阀', '极客'],
    rarity: 'rare',
    cost: 2,
    baseStats: { chips: 0 },
    starEffects: {
      1: '下回合商店出 1 张财阀卡',
      2: '下回合商店出 2 张财阀卡',
      3: '下回合商店出 5 张财阀卡'
    }
  },

  // --- 3 Cost (8 cards) ---
  {
    templateId: 'tft-blade-geek-3',
    name: '皇家剑舞者',
    description: '打出黑桃顺子时，永久提升基础伤害。',
    synergies: ['锋刃', '极客'],
    rarity: 'rare',
    cost: 3,
    baseStats: { chips: 0 },
    starEffects: {
      1: '黑桃顺子基础伤害 +5',
      2: '黑桃顺子基础伤害 +12',
      3: '黑桃顺子基础伤害 +40'
    }
  },
  {
    templateId: 'tft-fortress-calc-3',
    name: '动能装甲',
    description: '护甲值按比例转化为出牌基础伤害。',
    synergies: ['堡垒', '算力者'],
    rarity: 'rare',
    cost: 3,
    baseStats: { chips: 0 },
    starEffects: {
      1: '护甲 5% 转化为伤害',
      2: '护甲 10% 转化为伤害',
      3: '护甲 30% 转化为伤害'
    }
  },
  {
    templateId: 'tft-venom-wanderer-3',
    name: '瘟疫暴君',
    description: '打出梅花同花时，怪物损失当前生命真实伤害。',
    synergies: ['猛毒', '浪客'],
    rarity: 'rare',
    cost: 3,
    baseStats: { chips: 0 },
    starEffects: {
      1: '损失当前生命 5% 伤害',
      2: '损失当前生命 10% 伤害',
      3: '损失当前生命 25% 伤害'
    }
  },
  {
    templateId: 'tft-pluto-calc-3',
    name: '算力印钞机',
    description: '每持有 1 金币，所有倍率提升。',
    synergies: ['财阀', '算力者'],
    rarity: 'rare',
    cost: 3,
    baseStats: { chips: 0 },
    starEffects: {
      1: '每金币倍率 +0.1',
      2: '每金币倍率 +0.2',
      3: '每金币倍率 +0.6'
    }
  },
  {
    templateId: 'tft-blade-gambler-3',
    name: '暗网清道夫',
    description: '每在商店刷新一次，下回合首发伤害增加。',
    synergies: ['锋刃', '老千'],
    rarity: 'rare',
    cost: 3,
    baseStats: { chips: 0 },
    starEffects: {
      1: '刷新伤害 +20',
      2: '刷新伤害 +50',
      3: '刷新伤害 +150'
    }
  },
  {
    templateId: 'tft-fortress-magician-3',
    name: '灵魂熔炉',
    description: '回合结束未打破的护甲，有概率保留到下一回合。',
    synergies: ['堡垒', '魔术师'],
    rarity: 'rare',
    cost: 3,
    baseStats: { chips: 0 },
    starEffects: {
      1: '20% 概率保留护甲',
      2: '50% 概率保留护甲',
      3: '100% 概率保留护甲'
    }
  },
  {
    templateId: 'tft-venom-assassin-3',
    name: '见血封喉',
    description: '单出 1 张梅花时，强行挂上中毒。',
    synergies: ['猛毒', '刺客'],
    rarity: 'rare',
    cost: 3,
    baseStats: { chips: 0 },
    starEffects: {
      1: '强行挂 15 层毒',
      2: '强行挂 35 层毒',
      3: '强行挂 100 层毒'
    }
  },
  {
    templateId: 'tft-pluto-magician-3',
    name: '洗钱专家',
    description: '弃掉方块时，抵消本回合受到的伤害。',
    synergies: ['财阀', '魔术师'],
    rarity: 'rare',
    cost: 3,
    baseStats: { chips: 0 },
    starEffects: {
      1: '每张方块抵消 10 伤害',
      2: '每张方块抵消 25 伤害',
      3: '每张方块抵消 80 伤害'
    }
  },

  // --- 4 Cost (8 cards) ---
  {
    templateId: 'tft-blade-wanderer-4',
    name: '深海斩杀者',
    description: '黑桃同花需求减少，且最终伤害倍增。',
    synergies: ['锋刃', '浪客'],
    rarity: 'legendary',
    cost: 4,
    baseStats: { chips: 0 },
    starEffects: {
      1: '需求 -1，伤害 x1.5',
      2: '需求 -1，伤害 x2.5',
      3: '需求 -2，伤害 x6'
    }
  },
  {
    templateId: 'tft-fortress-geek-magician-4',
    name: '时空重塑者',
    description: '打出红桃顺子时，免疫致命伤害并恢复状态。',
    synergies: ['堡垒', '极客', '魔术师'],
    rarity: 'legendary',
    cost: 4,
    baseStats: { chips: 0 },
    starEffects: {
      1: '免疫并恢复 30%',
      2: '免疫并恢复 60%',
      3: '免疫并恢复 100%'
    }
  },
  {
    templateId: 'tft-venom-calc-assassin-4',
    name: '化学狂人',
    description: '打出梅花对子时，引爆中毒造成真实伤害。',
    synergies: ['猛毒', '算力者', '刺客'],
    rarity: 'legendary',
    cost: 4,
    baseStats: { chips: 0 },
    starEffects: {
      1: '引爆毒层数 x2 伤害',
      2: '引爆毒层数 x4 伤害',
      3: '引爆毒层数 x10 伤害'
    }
  },
  {
    templateId: 'tft-pluto-magician-4',
    name: '虚空银行家',
    description: '使用换牌时，随机将普通牌永久转化为方块。',
    synergies: ['财阀', '魔术师'],
    rarity: 'legendary',
    cost: 4,
    baseStats: { chips: 0 },
    starEffects: {
      1: '转化 1 张方块',
      2: '转化 2 张方块',
      3: '转化 5 张方块'
    }
  },
  {
    templateId: 'tft-blade-assassin-4',
    name: '处决机器',
    description: '单张黑桃打出的伤害会溅射重复计算。',
    synergies: ['锋刃', '刺客'],
    rarity: 'legendary',
    cost: 4,
    baseStats: { chips: 0 },
    starEffects: {
      1: '溅射 1 次',
      2: '溅射 2 次',
      3: '溅射 6 次'
    }
  },
  {
    templateId: 'tft-fortress-gambler-4',
    name: '贪腐军阀',
    description: '受到伤害且护甲为 0 时，扣除金币抵消伤害。',
    synergies: ['堡垒', '老千'],
    rarity: 'legendary',
    cost: 4,
    baseStats: { chips: 0 },
    starEffects: {
      1: '5 金币抵消 100 伤害',
      2: '4 金币抵消 100 伤害',
      3: '1 金币抵消 100 伤害'
    }
  },
  {
    templateId: 'tft-venom-wanderer-4',
    name: '蔓延毒网',
    description: '梅花同花使怪物的“意图伤害”永久降低。',
    synergies: ['猛毒', '浪客'],
    rarity: 'legendary',
    cost: 4,
    baseStats: { chips: 0 },
    starEffects: {
      1: '意图伤害降低 10%',
      2: '意图伤害降低 25%',
      3: '意图伤害降低 60%'
    }
  },
  {
    templateId: 'tft-pluto-calc-4',
    name: '资本大鳄',
    description: '存款超过 50 时，所有卡牌视为万能牌且全属性提升。',
    synergies: ['财阀', '算力者'],
    rarity: 'legendary',
    cost: 4,
    baseStats: { chips: 0 },
    starEffects: {
      1: '全属性 +20%',
      2: '全属性 +50%',
      3: '全属性 +150%'
    }
  },

  // --- 5 Cost (8 cards) ---
  {
    templateId: 'tft-all-blade-5',
    name: '终焉代码·灭世',
    description: '任何包含黑桃的牌型，扣除怪物最大生命。',
    synergies: ['锋刃'],
    rarity: 'mythic',
    cost: 5,
    baseStats: { chips: 0 },
    starEffects: {
      1: '扣除最大生命 5%',
      2: '扣除最大生命 15%',
      3: '扣除最大生命 100%'
    }
  },
  {
    templateId: 'tft-all-fortress-5',
    name: '绝对屏障·神域',
    description: '回合开始生成护盾，且免疫负面状态。',
    synergies: ['堡垒'],
    rarity: 'mythic',
    cost: 5,
    baseStats: { chips: 0 },
    starEffects: {
      1: '1倍生命护盾',
      2: '3倍生命护盾',
      3: '10倍生命护盾'
    }
  },
  {
    templateId: 'tft-all-venom-5',
    name: '万物归墟·凋零',
    description: '怪物回合开始时，毒层数自动翻倍。',
    synergies: ['猛毒'],
    rarity: 'mythic',
    cost: 5,
    baseStats: { chips: 0 },
    starEffects: {
      1: '毒层数 x1.5',
      2: '毒层数 x2.5',
      3: '毒层数 x10'
    }
  },
  {
    templateId: 'tft-all-pluto-5',
    name: '降维打击·清算',
    description: '花费金币跳过本层战斗。',
    synergies: ['财阀'],
    rarity: 'mythic',
    cost: 5,
    baseStats: { chips: 0 },
    starEffects: {
      1: '花费 100 金币跳过',
      2: '花费 50 金币跳过',
      3: '花费 1 金币跳过'
    }
  },
  {
    templateId: 'tft-all-calc-5',
    name: '欧米伽终端',
    description: '解锁隐藏牌型，倍率指数级飙升。',
    synergies: ['算力者'],
    rarity: 'mythic',
    cost: 5,
    baseStats: { chips: 0 },
    starEffects: {
      1: '倍率 ^2',
      2: '倍率 ^3',
      3: '倍率 ^5'
    }
  },
  {
    templateId: 'tft-all-geek-5',
    name: '莫比乌斯环',
    description: '顺子无限循环，不消耗出牌次数。',
    synergies: ['极客'],
    rarity: 'mythic',
    cost: 5,
    baseStats: { chips: 0 },
    starEffects: {
      1: '倍率 +2',
      2: '倍率 +5',
      3: '倍率 +20'
    }
  },
  {
    templateId: 'tft-all-magician-5',
    name: '混沌魔方',
    description: '换牌变为施法，弃牌化为暴击飞剑。',
    synergies: ['魔术师'],
    rarity: 'mythic',
    cost: 5,
    baseStats: { chips: 0 },
    starEffects: {
      1: '弃牌化为飞剑',
      2: '弃牌化为飞剑',
      3: '弃牌化为飞剑'
    }
  },
  {
    templateId: 'tft-all-gambler-5',
    name: '造物主之手',
    description: '商店所有内容变为免费甚至倒贴钱。',
    synergies: ['老千'],
    rarity: 'mythic',
    cost: 5,
    baseStats: { chips: 0 },
    starEffects: {
      1: '全部免费',
      2: '全部免费',
      3: '购买反而给钱'
    }
  }
];
