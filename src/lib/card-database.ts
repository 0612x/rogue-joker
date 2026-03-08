import { TFTCard } from '@/types/game';

// Helper to create cards
const createCard = (
  id: string,
  name: string,
  cost: number,
  synergies: string[],
  desc: string,
  stats: Partial<TFTCard['stats']> = {}
): Omit<TFTCard, 'id' | 'stars'> => ({
  templateId: id,
  name,
  cost,
  synergies,
  description: desc,
  rarity: cost === 1 ? 'common' : cost === 2 ? 'rare' : cost === 3 ? 'legendary' : cost === 4 ? 'mythic' : 'mythic', // Mapping cost to rarity loosely
  stats
});

export const CARD_DATABASE: Omit<TFTCard, 'id' | 'stars'>[] = [
  // --- 1 Cost ---
  createCard('c1-blade-assassin', '暗巷快刀', 1, ['spades', 'assassin'], '只打出单张 ♠ 时，基础伤害增加 15/35/100。'),
  createCard('c1-fortress-calc', '铁壁算盘', 1, ['hearts', 'calculator'], '打出红桃对子时，额外获得 20/40/120 点护甲。'),
  createCard('c1-venom-magician', '剧毒吹箭', 1, ['clubs', 'magician'], '每次使用“换牌”，对怪物施加 2/4/12 层中毒。'),
  createCard('c1-tycoon-calc', '贪婪矿工', 1, ['diamonds', 'calculator'], '打出方块对子时，必定额外掉落 1/2/6 金币。'),
  createCard('c1-blade-surfer', '深海潜行者', 1, ['spades', 'surfer'], '打出黑桃同花时，为你恢复 5/10/30 点生命值。'),
  createCard('c1-fortress-geek', '逻辑门卫', 1, ['hearts', 'geek'], '打出顺子时，清除你手牌中 1/2/5 个负面状态。'),
  createCard('c1-venom-geek', '生化黑客', 1, ['clubs', 'geek'], '打出顺子时，如果怪物中毒，毒发伤害结算 1/2/5 次。'),
  createCard('c1-tycoon-cheater', '发牌童子', 1, ['diamonds', 'cheater'], '回合结束时，每有1次未使用出牌次数，转化为 1/2/5 金币。'),

  // --- 2 Cost ---
  createCard('c2-blade-calc', '处刑双刃', 2, ['spades', 'calculator'], '打出黑桃对子时，若怪物血量低于 10%/20%/50%，直接斩杀。'),
  createCard('c2-fortress-surfer', '赤血海妖', 2, ['hearts', 'surfer'], '打出红桃同花时，生命上限永久提升 2/5/15 点。'),
  createCard('c2-venom-cheater', '走私毒枭', 2, ['clubs', 'cheater'], '回合结束时，怪物每有 10 层毒，获得 1/2/6 金币。'),
  createCard('c2-tycoon-assassin', '赏金猎头', 2, ['diamonds', 'assassin'], '只打出单张方块并击杀怪物时，掉落 5/12/30 金币宝箱。'),
  createCard('c2-blade-magician', '幻影飞刀', 2, ['spades', 'magician'], '每次换牌后，下一次出牌总倍率临时增加 1/3/8。'),
  createCard('c2-fortress-assassin', '孤高骑士', 2, ['hearts', 'assassin'], '如果本回合只出了 1 次牌就结束，获得 50/120/400 护甲。'),
  createCard('c2-venom-calc', '连环炸弹客', 2, ['clubs', 'calculator'], '打出“三条”或“四条”时，将怪物中毒层数复制 1/2/4 份。'),
  createCard('c2-tycoon-geek', '黄金罗盘', 2, ['diamonds', 'geek'], '打出包含方块的顺子时，下回合商店刷新必定出现 1/2/5 张财阀卡。'),

  // --- 3 Cost ---
  createCard('c3-blade-geek', '皇家剑舞者', 3, ['spades', 'geek'], '打出黑桃顺子时，本局常驻基础伤害永久 +5/+12/+40。'),
  createCard('c3-fortress-calc', '动能装甲', 3, ['hearts', 'calculator'], '当前护甲值的 5%/10%/30% 转化为出牌基础伤害。'),
  createCard('c3-venom-surfer', '瘟疫暴君', 3, ['clubs', 'surfer'], '打出梅花同花时，怪物损失当前生命 5%/10%/25% 的真实伤害。'),
  createCard('c3-tycoon-calc', '算力印钞机', 3, ['diamonds', 'calculator'], '每持有 1 金币，所有倍率提升 0.1/0.2/0.6。'),
  createCard('c3-blade-cheater', '暗网清道夫', 3, ['spades', 'cheater'], '每在商店刷新一次，下回合首发伤害增加 20/50/150。'),
  createCard('c3-fortress-magician', '灵魂熔炉', 3, ['hearts', 'magician'], '回合结束未打破的护甲，有 20%/50%/100% 概率保留。'),
  createCard('c3-venom-assassin', '见血封喉', 3, ['clubs', 'assassin'], '单出 1 张梅花时，强行挂上 15/35/100 层毒。'),
  createCard('c3-tycoon-magician', '洗钱专家', 3, ['diamonds', 'magician'], '弃掉方块时，每张方块抵消本回合受到的 10/25/80 点伤害。'),

  // --- 4 Cost ---
  createCard('c4-blade-surfer', '深海斩杀者', 4, ['spades', 'surfer'], '黑桃同花触发张数 -1/-1/-2，伤害 x1.5/2.5/6。'),
  createCard('c4-fortress-mix', '时空重塑者', 4, ['hearts', 'geek', 'magician'], '打出红桃顺子时，若受致命伤，免疫并恢复 30%/60%/100%。'),
  createCard('c4-venom-mix', '化学狂人', 4, ['clubs', 'calculator', 'assassin'], '打出梅花对子时，引爆毒层数造成 x2/x4/x10 真实伤害。'),
  createCard('c4-tycoon-magician', '虚空银行家', 4, ['diamonds', 'magician'], '换牌时，随机将场上 1/2/5 张普通牌永久转化为方块。'),
  createCard('c4-blade-assassin', '处决机器', 4, ['spades', 'assassin'], '单张黑桃伤害溅射 1/2/6 次。'),
  createCard('c4-fortress-cheater', '贪腐军阀', 4, ['hearts', 'cheater'], '受伤且护甲为0时，扣 5/4/1 金币抵消 100 伤害。'),
  createCard('c4-venom-surfer', '蔓延毒网', 4, ['clubs', 'surfer'], '梅花同花使怪物意图伤害永久降低 10%/25%/60%。'),
  createCard('c4-tycoon-calc', '资本大鳄', 4, ['diamonds', 'calculator'], '存款>50时，所有卡牌视为万能牌，全属性 +20%/50%/150%。'),

  // --- 5 Cost ---
  createCard('c5-blade-god', '终焉代码·灭世', 5, ['spades', 'hearts', 'clubs', 'diamonds', 'spades'], '包含黑桃的牌型扣除怪物最大生命 5%/15%/100%。'), // Multi-suit hack
  createCard('c5-fortress-god', '绝对屏障·神域', 5, ['spades', 'hearts', 'clubs', 'diamonds', 'hearts'], '回合开始生成 1/3/10 倍最大生命护盾，免疫UI污染。'),
  createCard('c5-venom-god', '万物归墟·凋零', 5, ['spades', 'hearts', 'clubs', 'diamonds', 'clubs'], '怪物回合开始时，毒层数 x1.5/x2.5/x10。'),
  createCard('c5-tycoon-god', '降维打击·清算', 5, ['spades', 'hearts', 'clubs', 'diamonds', 'diamonds'], '花费 100/50/1 金币直接胜利。'),
  createCard('c5-calc-god', '欧米伽终端', 5, ['calculator', 'surfer', 'geek', 'magician', 'assassin', 'cheater', 'calculator'], '解锁五条/八条。倍率指数飙升。'),
  createCard('c5-geek-god', '莫比乌斯环', 5, ['calculator', 'surfer', 'geek', 'magician', 'assassin', 'cheater', 'geek'], '顺子无限循环，不耗次数，倍率递增。'),
  createCard('c5-magician-god', '混沌魔方', 5, ['calculator', 'surfer', 'geek', 'magician', 'assassin', 'cheater', 'magician'], '换牌变为施法，弃牌变飞剑。'),
  createCard('c5-cheater-god', '造物主之手', 5, ['calculator', 'surfer', 'geek', 'magician', 'assassin', 'cheater', 'cheater'], '商店全免费/倒给钱。'),
];
