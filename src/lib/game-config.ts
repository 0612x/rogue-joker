import { Modifier, Enemy, HandType, Joker, Consumable, TFTCard, Synergy } from '@/types/game';

// --- Level & Shop Constants ---
export const LEVEL_EXP_CURVE: Record<number, number> = {
  1: 0,
  2: 0,
  3: 6,
  4: 10,
  5: 20,
  6: 36,
  7: 56,
  8: 80,
  9: 9999 // Max level
};

export const SHOP_PROBABILITIES: Record<number, Record<number, number>> = {
  3: { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0 },
  4: { 1: 75, 2: 25, 3: 0, 4: 0, 5: 0 }, // Interpolated
  5: { 1: 45, 2: 35, 3: 20, 4: 0, 5: 0 },
  6: { 1: 30, 2: 35, 3: 30, 4: 5, 5: 0 }, // Interpolated
  7: { 1: 15, 2: 30, 3: 40, 4: 15, 5: 0 },
  8: { 1: 10, 2: 20, 3: 35, 4: 25, 5: 10 }, // Interpolated
  9: { 1: 5, 2: 10, 3: 30, 4: 40, 5: 15 }
};

// --- Synergies ---
export const SYNERGIES: Synergy[] = [
  // Suits
  {
    id: 'spades',
    name: '锋刃 (Blade)',
    type: 'suit',
    thresholds: [2, 4, 6, 8],
    currentCount: 0,
    activeLevel: 0,
    description: '黑桃伤害提升 20%/50%/100%/300%。8锋刃自带 100% 真实伤害。',
    icon: '⚔️'
  },
  {
    id: 'hearts',
    name: '堡垒 (Fortress)',
    type: 'suit',
    thresholds: [2, 4, 6, 8],
    currentCount: 0,
    activeLevel: 0,
    description: '打出红桃加 15/40/100/300 护甲。8堡垒回合结束反弹 100% 护甲值的伤害。',
    icon: '🛡️'
  },
  {
    id: 'clubs',
    name: '猛毒 (Venom)',
    type: 'suit',
    thresholds: [2, 4, 6],
    currentCount: 0,
    activeLevel: 0,
    description: '打出梅花上 2/5/15 层毒。6猛毒每回合毒伤翻倍。',
    icon: '🧪'
  },
  {
    id: 'diamonds',
    name: '财阀 (Tycoon)',
    type: 'suit',
    thresholds: [3, 5, 7],
    currentCount: 0,
    activeLevel: 0,
    description: '打出方块掉 1 块钱概率 30%/80%/100%。7财阀每回合送 1 次免费 D 牌和 1 个消耗品。',
    icon: '💎'
  },
  // Classes
  {
    id: 'calculator',
    name: '算力者 (Calculator)',
    type: 'class',
    thresholds: [2, 4, 6],
    currentCount: 0,
    activeLevel: 0,
    description: '包含对子时，总倍率 +2 / +6 / +15。',
    icon: '🧮'
  },
  {
    id: 'surfer',
    name: '浪客 (Surfer)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2) 同花只需 4 张。(4) 同花只需 3 张，且同花倍率 x3。',
    icon: '🌊'
  },
  {
    id: 'geek',
    name: '极客 (Geek)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2) 顺子可循环 (Q-K-A-2-3)。(4) 打出顺子恢复 1 次出牌机会。',
    icon: '🃏'
  },
  {
    id: 'magician',
    name: '魔术师 (Magician)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2) 换牌次数 +2。(4) 每次换牌，弃掉的牌化为真实伤害打怪。',
    icon: '🎩'
  },
  {
    id: 'assassin',
    name: '刺客 (Assassin)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2) 只打 1 张牌时，伤害 x3。(4) 只打 1 张牌时，触发该牌 3 次效果。',
    icon: '🔪'
  },
  {
    id: 'cheater',
    name: '老千 (Cheater)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2) 商店 D 牌只需 1 块钱。(4) 商店必定刷出一张你场上已有的牌。',
    icon: '🎲'
  }
];

// --- Jokers (Global Rule Modifiers) ---
export const JOKERS: Joker[] = [
  {
    id: 'joker-straight-flush',
    name: '全能顺子',
    description: '所有顺子现在都视为同花顺。',
    rarity: 'legendary'
  },
  {
    id: 'joker-blind-immune',
    name: '透视之眼',
    description: '免疫怪物的“致盲”效果。',
    rarity: 'rare'
  }
];

// --- Consumables (One-time use) ---
export const CONSUMABLES: Consumable[] = [
  {
    id: 'cons-heal',
    name: '急救包',
    description: '恢复 30 点生命值。'
  },
  {
    id: 'cons-spades',
    name: '黑漆桶',
    description: '将选中的牌全部变为黑桃。'
  }
];

// --- Modifiers (Relics/Items) ---

export const MODIFIERS: Modifier[] = [
  // Common
  {
    id: 'heart-firewall',
    name: '红桃防火墙',
    description: '结算时，牌型中每包含 1 张 ♥ 红桃，为你提供等同于其点数的护甲。',
    tier: 'common',
    trigger: 'onCalculation'
  },
  {
    id: 'club-trojan',
    name: '梅花木马',
    description: '结算时，牌型中每包含 1 张 ♣ 梅花，给怪物施加 1 层中毒。',
    tier: 'common',
    trigger: 'onCalculation'
  },
  {
    id: 'diamond-miner',
    name: '方块矿工',
    description: '结算打出包含 ♦ 方块的牌时，额外获得 方块数量 * 2 的金币。',
    tier: 'common',
    trigger: 'onCalculation'
  },
  {
    id: 'overclock',
    name: '算力超载',
    description: '打出“对子”或“两对”时，基础乘区 (Multiplier) 临时 +2。',
    tier: 'common',
    trigger: 'onCalculation'
  },
  {
    id: 'garbage-collect',
    name: '垃圾回收',
    description: '每次使用“换牌 (Discard)”功能，恢复 3 点生命值。',
    tier: 'common',
    trigger: 'onDiscard'
  },
  // Rare
  {
    id: 'high-card-pride',
    name: '高牌尊严',
    description: '如果你只打出 1 张牌（高牌），这张牌的基础伤害翻 3 倍，且不消耗“出牌次数”。',
    tier: 'rare',
    trigger: 'onPlay'
  },
  {
    id: 'straight-obsession',
    name: '顺子强迫症',
    description: '打出“顺子”时，不仅造成伤害，还会强行消除怪物头顶 20% 的意图伤害。',
    tier: 'rare',
    trigger: 'onPlay'
  },
  {
    id: 'four-of-a-kind-root',
    name: '炸弹提权',
    description: '打出“四条（炸弹）”后，立刻为你补充 2 次“换牌次数”。',
    tier: 'rare',
    trigger: 'onPlay'
  },
  {
    id: 'thorns-protocol',
    name: '荆棘反弹',
    description: '回合结束时，你身上每保留 5 点未被打破的护甲，对怪物造成 2 点真实伤害。',
    tier: 'rare',
    trigger: 'onTurnEnd'
  },
  // Legendary
  {
    id: 'fuzzy-logic',
    name: '模糊匹配',
    description: '你的“同花”和“顺子”，现在只需要 4 张牌 即可触发判定。',
    tier: 'legendary',
    trigger: 'passive'
  },
  {
    id: 'quantum-jack',
    name: '薛定谔的 J',
    description: '你牌库里所有的 J 变为万能牌 (Wildcard)。',
    tier: 'legendary',
    trigger: 'passive'
  },
  {
    id: 'memory-overwrite',
    name: '内存覆写',
    description: '当你换牌 (Discard) 时，弃掉的牌的总点数，会直接化为真实伤害砸在怪物脸上。',
    tier: 'legendary',
    trigger: 'onDiscard'
  }
];

// --- Monsters ---

export const MONSTER_TEMPLATES: Record<string, Omit<Enemy, 'id' | 'currentHp' | 'block' | 'statusEffects' | 'intent'>> = {
  // Tier 1
  'glitch-slime': {
    name: '乱码史莱姆',
    tier: 1,
    maxHp: 60,
  },
  'basic-firewall': {
    name: '基础防火墙',
    tier: 1,
    maxHp: 100,
  },
  // Tier 2
  'ransomworm': {
    name: '勒索蠕虫',
    tier: 2,
    maxHp: 200,
  },
  'cryptomancer': {
    name: '加密法师',
    tier: 2,
    maxHp: 180,
  },
  // Tier 3
  'format-leviathan': {
    name: '格式化终结者',
    tier: 3,
    maxHp: 500,
  }
};

// --- Hand Scoring Rules ---

export const HAND_SCORES: Record<HandType, { base: number; mult: number }> = {
  'High Card': { base: 5, mult: 1 },
  'Pair': { base: 10, mult: 2 },
  'Two Pair': { base: 20, mult: 2 },
  'Three of a Kind': { base: 30, mult: 3 },
  'Straight': { base: 30, mult: 4 },
  'Flush': { base: 35, mult: 4 },
  'Full House': { base: 40, mult: 4 },
  'Four of a Kind': { base: 60, mult: 7 },
  'Straight Flush': { base: 100, mult: 8 },
  'Royal Flush': { base: 100, mult: 8 },
};
