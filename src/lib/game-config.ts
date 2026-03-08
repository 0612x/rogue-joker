import { Modifier, Enemy, HandType, Joker, Consumable, TFTCard, Synergy } from '@/types/game';

// --- Level & Shop Constants ---
export const LEVEL_EXP_CURVE: Record<number, number> = {
  1: 2,
  2: 4,
  3: 8,
  4: 14,
  5: 24,
  6: 9999 // Max level
};

export const SHOP_PROBABILITIES: Record<number, Record<number, number>> = {
  1: { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0 },
  2: { 1: 80, 2: 20, 3: 0, 4: 0, 5: 0 },
  3: { 1: 50, 2: 35, 3: 15, 4: 0, 5: 0 },
  4: { 1: 30, 2: 40, 3: 25, 4: 5, 5: 0 },
  5: { 1: 15, 2: 30, 3: 35, 4: 15, 5: 5 },
  6: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
};

// --- Synergies (Refactored to 8 Core Resources System) ---
export const SYNERGIES: Synergy[] = [
  // Suits
  {
    id: 'spades',
    name: '锋刃 (Core)',
    type: 'suit',
    thresholds: [2, 4, 6],
    currentCount: 0,
    activeLevel: 0,
    description: '(2)每张黑桃+15筹码; (4)每张黑桃额外+40筹码，且每损失10%血量筹码翻倍; (6)重装核芯: 当前护甲1:1转化为基础筹码。',
    icon: '⚔️'
  },
  {
    id: 'hearts',
    name: '堡垒 (Firewall)',
    type: 'suit',
    thresholds: [2, 4, 6],
    currentCount: 0,
    activeLevel: 0,
    description: '(2)回合结束保留30%护甲; (4)保留70%护甲，受真实伤害扣血时每扣1血+1最大生命值; (6)保留100%护甲，受击时消耗等额护甲反弹真实伤害。',
    icon: '🛡️'
  },
  {
    id: 'clubs',
    name: '猛毒 (Trojan)',
    type: 'suit',
    thresholds: [2, 4, 6],
    currentCount: 0,
    activeLevel: 0,
    description: '(2)每打1张梅花植入1层木马(减1意图伤害); (4)木马回合结束不减半，怪物每5层木马全局倍率+1; (6)怪物攻击时引爆木马，造成(层数x最大血量)真伤。',
    icon: '🧪'
  },
  {
    id: 'diamonds',
    name: '财阀 (Syndicate)',
    type: 'suit',
    thresholds: [2, 4, 6],
    currentCount: 0,
    activeLevel: 0,
    description: '(2)胜利额外掉落3金币; (4)利息上限10，商店刷新1金币; (6)1金币可抵挡3点伤害，且每10金币全局倍率+1。',
    icon: '💎'
  },
  // Classes
  {
    id: 'calculator',
    name: '算力者 (Calculator)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2)含对子的牌型倍率+5; (4)双线程并发: 所有含对子的牌型算分结算两次。',
    icon: '🧮'
  },
  {
    id: 'surfer',
    name: '黑客 (Hacker)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2)同花只需4张; (4)权限绕过: 同花只需3张，且打出同花时不消耗出牌次数。',
    icon: '🌊'
  },
  {
    id: 'geek',
    name: '极客 (Geek)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2)顺子可首尾相连; (4)内存溢出: 每次打出顺子，恢复1次出牌次数和2次弃牌次数。',
    icon: '🃏'
  },
  {
    id: 'magician',
    name: '欺诈师 (Illusionist)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2)每回合额外获得2次弃牌; (4)数据劫持: 每次弃牌进入缓存，下次出牌时缓存点数加到基础筹码中并清空。',
    icon: '🎩'
  },
  {
    id: 'assassin',
    name: '刺客 (Assassin)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2)只出单张时，底分按“四条(炸弹)”计算; (4)拔线处决: 怪物血量低于你最大生命值两倍时，单卡直接秒杀。',
    icon: '🔪'
  },
  {
    id: 'cheater',
    name: '破壁人 (Breaker)',
    type: 'class',
    thresholds: [2, 4],
    currentCount: 0,
    activeLevel: 0,
    description: '(2)出牌次数为0时可透支生命出牌(扣15%当前血); (4)鲜血献祭: 商店可用生命值购买刷新和卡牌(1金币=2血)。',
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
