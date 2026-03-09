import { TFTCard } from '@/types/game';

// 辅助函数：快速生成卡牌数据
const createCard = (
  templateId: string,
  name: string,
  cost: number,
  synergies: string[],
  desc: string
): Omit<TFTCard, 'id' | 'stars'> => ({
  templateId,
  name,
  cost,
  synergies,
  description: desc,
  rarity: cost === 1 ? 'common' : cost === 2 ? 'rare' : cost === 3 ? 'epic' : cost === 4 ? 'legendary' : 'mythic',
  stats: { chips: 0, mult: 0, percentMult: 0 }
});

// 核心卡池：38张全新流派卡牌
export const CARD_DATABASE: Omit<TFTCard, 'id' | 'stars'>[] = [
  // --- 1 Cost (8张) ---
  createCard('c1-01', '暗巷快刀', 1, ['spades', 'assassin'], '【星级: +3/+8/+25 筹码】\n单张牌击杀怪物时，永久增加基础筹码。'),
  createCard('c1-02', '发牌童子', 1, ['diamonds', 'magician'], '【星级: +1/+2/+5金, +2/+5/+15血】\n胜利时若本回合未弃牌得金币，若受伤回血。'),
  createCard('c1-03', '铁壁算盘', 1, ['hearts', 'calculator'], '【星级: 提升 2%/5%/15%】\n当前手牌中每有一张红桃，提升你的护甲获取率。'),
  createCard('c1-04', '见习黑客', 1, ['clubs', 'geek'], '【星级: 植入 2/5/15 层】\n每次打出顺子，强制给怪物植入木马病毒。'),
  createCard('c1-05', '拾荒猎犬', 1, ['diamonds', 'cheater'], '【星级: +2/+5/+15 筹码】\n每次商店刷新扣1血，并永久增加基础筹码。'),
  createCard('c1-06', '盾卫新兵', 1, ['hearts', 'assassin'], '【星级: +15/+35/+100 护甲】\n如果只打出1张牌，额外获得大量护甲。'),
  createCard('c1-07', '毒液试管', 1, ['clubs', 'surfer'], '【星级: 每张梅花回 1/2/6 血】\n打出同花时，牌型中每包含一张梅花为你回血。'),
  createCard('c1-08', '算力学徒', 1, ['spades', 'calculator'], '【星级: 倍率临时 +1/+2/+6】\n打出对子时，本回合全局倍率临时提升。'),

  // --- 2 Cost (8张) ---
  createCard('c2-01', '狂血海妖', 2, ['hearts', 'surfer'], '【星级: 转化 5/10/25 血】\n每战限1次：打红桃同花扣除当前血量转化为最大生命。'),
  createCard('c2-02', '连环炸弹客', 2, ['clubs', 'calculator'], '【星级: 增加 20%/50%/翻倍】\n算分后总筹码为奇数的牌型，使怪物木马层数暴增。'),
  createCard('c2-03', '孤高骑士', 2, ['hearts', 'assassin'], '【星级: 转化 10%/25%/70%】\n打出无对子的牌型时，伤害按比例转化为护甲。'),
  createCard('c2-04', '数据矿工', 2, ['spades', 'diamonds'], '【星级: +2/+5/+15 筹码】\n你每拥有5金币，打出的黑桃额外提供基础筹码。'),
  createCard('c2-05', '幻影魔术师', 2, ['clubs', 'magician'], '【星级: 每张施加 3/8/25 层】\n弃牌时，弃掉的梅花牌转化为木马病毒施加给怪物。'),
  createCard('c2-06', '超频狂人', 2, ['spades', 'cheater'], '【星级: 扣 20%/15%/5% 最大生命】\n出牌次数耗尽时，可扣除最大生命值强行出牌。'),
  createCard('c2-07', '逻辑守卫', 2, ['hearts', 'geek'], '【星级: +20/+50/+150 护甲】\n每次打出顺子，下回合自动获得护甲。'),
  createCard('c2-08', '赏金猎手', 2, ['diamonds', 'assassin'], '【星级: 20%/50%/100% 概率】\n用单张牌击杀怪物时，概率掉落5金币宝箱。'),

  // --- 3 Cost (8张) ---
  createCard('c3-01', '狂战士协议', 3, ['spades', 'cheater'], '【星级: +10筹1倍/+25筹2倍/+80筹6倍】\n每损失10%血，打出的牌额外加筹码加倍率。'),
  createCard('c3-02', '虚空银行家', 3, ['diamonds', 'magician'], '【星级: 15%/40%/100% 概率】\n弃牌概率永久从牌库删除，每删一张赚3块。'),
  createCard('c3-03', '皇家剑舞者', 3, ['spades', 'geek'], '【星级: 20%/50%/100% 概率】\n打出黑桃顺子，概率复制一张黑桃永久加入牌库。'),
  createCard('c3-04', '灵魂熔炉', 3, ['hearts', 'magician'], '【星级: +1/+3/+10 倍率】\n每次受到真实扣血伤害，永久增加全局倍率。'),
  createCard('c3-05', '生化传播者', 3, ['clubs', 'surfer'], '【星级: 10%/25%/80% 比例】\n打出同花时，按怪物身上的木马层数比例回血。'),
  createCard('c3-06', '量化分析师', 3, ['diamonds', 'calculator'], '【星级: 1利息 = +1/+2/+5 倍率】\n结算利息不仅给金币，还永久增加全局倍率。'),
  createCard('c3-07', '处刑之刃', 3, ['spades', 'assassin'], '【星级: 点数 x2/x4/x10】\n只打出单张黑桃时，伤害无视护甲，基础点数乘算。'),
  createCard('c3-08', '算力印钞机', 3, ['diamonds', 'hearts'], '【星级: 1金抵 2/5/15 伤】\n你的金币可当做护甲。护甲归零时自动扣钱抵伤。'),

  // --- 4 Cost (8张) ---
  createCard('c4-01', '时间重塑者', 4, ['hearts', 'geek', 'magician'], '【星级: 回溯至 30%/60%/100%】\n打出顺子清空负面状态，并回溯血量至最大值比例。'),
  createCard('c4-02', '处决机器', 4, ['spades', 'assassin'], '【星级: 总伤害 x1.5/x3/x8】\n单出 A 或 K 时，最终总伤害疯狂乘算拔高。'),
  createCard('c4-03', '资本巨鳄', 4, ['diamonds', 'calculator'], '【星级: 点数额外 +5/+15/+50】\n存款超50时，手牌全视为万能牌，且附加点数。'),
  createCard('c4-04', '木马母体', 4, ['clubs', 'cheater'], '【星级: 1倍/3倍/10倍 真伤】\n怪物攻击前受木马真实伤害，毒死则直接取消该次攻击。'),
  createCard('c4-05', '深网黑客', 4, ['clubs', 'surfer'], '【星级: 10%/30%/100% 转化率】\n同花不耗次数，且造成的伤害比例转化为木马病毒。'),
  createCard('c4-06', '绝对零度', 4, ['hearts', 'calculator'], '【星级: 转化 5%/15%/50%】\n打出四条（炸弹）时，将当前护甲比例永久转为最大生命。'),
  createCard('c4-07', '血色盛宴', 4, ['spades', 'cheater'], '【星级: 1%/5%/20% 转化率】\n击杀怪物的溢出伤害(Overkill)，按比例转化为治疗量回血。'),
  createCard('c4-08', '幻象核心', 4, ['spades', 'magician'], '【星级: 点数 +3/+8/+25】\n每次你弃掉黑桃，该牌永久增加基础点数(越弃越强)。'),

  // --- 5 Cost (6张) ---
  createCard('c5-01', '欧米伽终端', 5, ['calculator'], '【星级: 伤害额外 x2/x5/x20】\n强制锁定按[同花顺]算分，且最终伤害额外乘算。'),
  createCard('c5-02', '降维打击·清算', 5, ['diamonds'], '【星级: 20块/10块/2块 买1点倍率】\n商店点击空白处直接花钱买全局倍率。'),
  createCard('c5-03', '万物归墟·凋零', 5, ['clubs'], '【星级: 20%/50%/100% 暴击】\n怪物锁死防御意图，且你的毒伤大概率暴击(伤害x3)。'),
  createCard('c5-04', '神创堡垒·埃癸斯', 5, ['hearts'], '【星级: 10%/30%/100% 转化率】\n护甲绝对不重置。出牌时护甲比例转化为倍率。'),
  createCard('c5-05', '真理之剑·达摩克利斯', 5, ['spades'], '【星级: 黑桃筹码 x2/x5/x20】\n伤害全转真伤。牌库所有黑桃筹码永久乘算！'),
  createCard('c5-06', '源代码·悖论', 5, ['cheater'], '【星级: 死线 -50/-150/-999血】\n不死图腾！0血以下不死，出牌不耗次数改为按比例扣血。')
];