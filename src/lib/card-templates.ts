import { TFTCard } from '@/types/game';

type CardTemplate = Omit<TFTCard, 'id' | 'stars' | 'stats'> & {
  baseStats: { chips?: number; mult?: number; percentMult?: number; }
};

// 38张全新卡牌库核心代码
export const TFT_CARD_TEMPLATES: CardTemplate[] = [
  // --- 1 Cost ---
  { templateId: 'c1-01', name: '暗巷快刀', description: '单张牌击杀时，永久增加基础筹码。', synergies: ['锋刃', '刺客'], rarity: 'common', cost: 1, baseStats: { chips: 0 }, starEffects: { 1: '+3筹码/杀', 2: '+8筹码/杀', 3: '+25筹码/杀' } },
  { templateId: 'c1-02', name: '发牌童子', description: '胜利时若本回合未弃牌得金币，若受伤回血。', synergies: ['财阀', '欺诈师'], rarity: 'common', cost: 1, baseStats: { chips: 0 }, starEffects: { 1: '+1金/+2血', 2: '+2金/+5血', 3: '+5金/+15血' } },
  { templateId: 'c1-03', name: '铁壁算盘', description: '牌库中每张红桃提升你的护甲获取率。', synergies: ['堡垒', '算力者'], rarity: 'common', cost: 1, baseStats: { chips: 0 }, starEffects: { 1: '提升 2%', 2: '提升 5%', 3: '提升 15%' } },
  { templateId: 'c1-04', name: '见习黑客', description: '打出顺子强制植入木马病毒。', synergies: ['猛毒', '极客'], rarity: 'common', cost: 1, baseStats: { chips: 0 }, starEffects: { 1: '植入 2 层', 2: '植入 5 层', 3: '植入 15 层' } },
  { templateId: 'c1-05', name: '拾荒猎犬', description: '商店每次刷新扣1血，永久增加基础筹码。', synergies: ['财阀', '破壁人'], rarity: 'common', cost: 1, baseStats: { chips: 0 }, starEffects: { 1: '+2 筹码', 2: '+5 筹码', 3: '+15 筹码' } },
  { templateId: 'c1-06', name: '盾卫新兵', description: '只打1张牌时额外获得护甲。', synergies: ['堡垒', '刺客'], rarity: 'common', cost: 1, baseStats: { chips: 0 }, starEffects: { 1: '+15 护甲', 2: '+35 护甲', 3: '+100 护甲' } },
  { templateId: 'c1-07', name: '毒液试管', description: '打出同花时，牌型中每张梅花为你回血。', synergies: ['猛毒', '黑客'], rarity: 'common', cost: 1, baseStats: { chips: 0 }, starEffects: { 1: '每张回 1 血', 2: '每张回 2 血', 3: '每张回 6 血' } },
  { templateId: 'c1-08', name: '算力学徒', description: '打出对子时，全局倍率本回合临时提升。', synergies: ['锋刃', '算力者'], rarity: 'common', cost: 1, baseStats: { chips: 0 }, starEffects: { 1: '倍率 +1', 2: '倍率 +2', 3: '倍率 +6' } },

  // --- 2 Cost ---
  { templateId: 'c2-01', name: '狂血海妖', description: '每战限1次：红桃同花扣除当前血量转化为最大生命。', synergies: ['堡垒', '黑客'], rarity: 'rare', cost: 2, baseStats: { chips: 0 }, starEffects: { 1: '转化 5 血', 2: '转化 10 血', 3: '转化 25 血' } },
  { templateId: 'c2-02', name: '连环炸弹客', description: '奇数筹码的牌型使怪物木马层数暴增。', synergies: ['猛毒', '算力者'], rarity: 'rare', cost: 2, baseStats: { chips: 0 }, starEffects: { 1: '增加 20%', 2: '增加 50%', 3: '木马翻倍' } },
  { templateId: 'c2-03', name: '孤高骑士', description: '打出无对子的牌型时，伤害转化为护甲。', synergies: ['堡垒', '刺客'], rarity: 'rare', cost: 2, baseStats: { chips: 0 }, starEffects: { 1: '转化 10%', 2: '转化 25%', 3: '转化 70%' } },
  { templateId: 'c2-04', name: '数据矿工', description: '每拥有5金币，黑桃额外提供基础筹码。', synergies: ['锋刃', '财阀'], rarity: 'rare', cost: 2, baseStats: { chips: 0 }, starEffects: { 1: '+2 筹码', 2: '+5 筹码', 3: '+15 筹码' } },
  { templateId: 'c2-05', name: '幻影魔术师', description: '弃牌时，梅花牌转化为木马病毒施加给怪物。', synergies: ['猛毒', '欺诈师'], rarity: 'rare', cost: 2, baseStats: { chips: 0 }, starEffects: { 1: '每张 3 层', 2: '每张 8 层', 3: '每张 25 层' } },
  { templateId: 'c2-06', name: '超频狂人', description: '出牌耗尽可扣最大生命强行出牌。', synergies: ['锋刃', '破壁人'], rarity: 'rare', cost: 2, baseStats: { chips: 0 }, starEffects: { 1: '扣 20% MaxHP', 2: '扣 15% MaxHP', 3: '扣 5% MaxHP' } },
  { templateId: 'c2-07', name: '逻辑守卫', description: '打出顺子下回合自动获得护甲。', synergies: ['堡垒', '极客'], rarity: 'rare', cost: 2, baseStats: { chips: 0 }, starEffects: { 1: '20 护甲', 2: '50 护甲', 3: '150 护甲' } },
  { templateId: 'c2-08', name: '赏金猎手', description: '单卡击杀概率掉落5金币宝箱。', synergies: ['财阀', '刺客'], rarity: 'rare', cost: 2, baseStats: { chips: 0 }, starEffects: { 1: '20% 掉落', 2: '50% 掉落', 3: '100% 掉落' } },

  // --- 3 Cost ---
  { templateId: 'c3-01', name: '狂战士协议', description: '每损失10%血，打出的牌加筹码加倍率。', synergies: ['锋刃', '破壁人'], rarity: 'rare', cost: 3, baseStats: { chips: 0 }, starEffects: { 1: '+10筹码/+1倍', 2: '+25筹码/+2倍', 3: '+80筹码/+6倍' } },
  { templateId: 'c3-02', name: '虚空银行家', description: '弃牌概率永久从牌库删除，每删一张得3块。', synergies: ['财阀', '欺诈师'], rarity: 'rare', cost: 3, baseStats: { chips: 0 }, starEffects: { 1: '15% 删除', 2: '40% 删除', 3: '100% 删除' } },
  { templateId: 'c3-03', name: '皇家剑舞者', description: '黑桃顺子概率复制一张黑桃永久加入牌库。', synergies: ['锋刃', '极客'], rarity: 'rare', cost: 3, baseStats: { chips: 0 }, starEffects: { 1: '20% 复制', 2: '50% 复制', 3: '100% 复制' } },
  { templateId: 'c3-04', name: '灵魂熔炉', description: '受到真实扣血伤害永久增加全局倍率。', synergies: ['堡垒', '欺诈师'], rarity: 'rare', cost: 3, baseStats: { chips: 0 }, starEffects: { 1: '+1 倍率', 2: '+3 倍率', 3: '+10 倍率' } },
  { templateId: 'c3-05', name: '生化传播者', description: '打出同花按怪物木马层数比例回血。', synergies: ['猛毒', '黑客'], rarity: 'rare', cost: 3, baseStats: { chips: 0 }, starEffects: { 1: '10% 层数回血', 2: '25% 层数回血', 3: '80% 层数回血' } },
  { templateId: 'c3-06', name: '量化分析师', description: '利息不仅仅给金币，还永久增加全局倍率。', synergies: ['财阀', '算力者'], rarity: 'rare', cost: 3, baseStats: { chips: 0 }, starEffects: { 1: '1利息=+1倍率', 2: '1利息=+2倍率', 3: '1利息=+5倍率' } },
  { templateId: 'c3-07', name: '处刑之刃', description: '单出黑桃伤害无视护甲，基础点数乘算。', synergies: ['锋刃', '刺客'], rarity: 'rare', cost: 3, baseStats: { chips: 0 }, starEffects: { 1: '点数 x2', 2: '点数 x4', 3: '点数 x10' } },
  { templateId: 'c3-08', name: '算力印钞机', description: '护甲归零时金币抵挡伤害。', synergies: ['财阀', '堡垒'], rarity: 'rare', cost: 3, baseStats: { chips: 0 }, starEffects: { 1: '1金抵 2 伤', 2: '1金抵 5 伤', 3: '1金抵 15 伤' } },

  // --- 4 Cost ---
  { templateId: 'c4-01', name: '时间重塑者', description: '顺子清空负面状态并回溯血量至最大值比例。', synergies: ['堡垒', '极客', '欺诈师'], rarity: 'legendary', cost: 4, baseStats: { chips: 0 }, starEffects: { 1: '回溯至 30%', 2: '回溯至 60%', 3: '回溯至 100%' } },
  { templateId: 'c4-02', name: '处决机器', description: '单出 A 或 K 最终总伤害乘算拔高。', synergies: ['锋刃', '刺客'], rarity: 'legendary', cost: 4, baseStats: { chips: 0 }, starEffects: { 1: '总伤害 x1.5', 2: '总伤害 x3', 3: '总伤害 x8' } },
  { templateId: 'c4-03', name: '资本巨鳄', description: '存款超50，手牌全变万能牌且点数附加。', synergies: ['财阀', '算力者'], rarity: 'legendary', cost: 4, baseStats: { chips: 0 }, starEffects: { 1: '点数 +5', 2: '点数 +15', 3: '点数 +50' } },
  { templateId: 'c4-04', name: '木马母体', description: '怪物攻击前受木马真实伤害，毒死则取消攻击。', synergies: ['猛毒', '破壁人'], rarity: 'legendary', cost: 4, baseStats: { chips: 0 }, starEffects: { 1: '1倍层数真伤', 2: '3倍层数真伤', 3: '10倍层数真伤' } },
  { templateId: 'c4-05', name: '深网黑客', description: '同花不耗次数，造成伤害比例转为木马。', synergies: ['猛毒', '黑客'], rarity: 'legendary', cost: 4, baseStats: { chips: 0 }, starEffects: { 1: '10% 转木马', 2: '30% 转木马', 3: '100% 转木马' } },
  { templateId: 'c4-06', name: '绝对零度', description: '打出四条将当前护甲比例永久转为最大生命。', synergies: ['堡垒', '算力者'], rarity: 'legendary', cost: 4, baseStats: { chips: 0 }, starEffects: { 1: '转化 5%', 2: '转化 15%', 3: '转化 50%' } },
  { templateId: 'c4-07', name: '血色盛宴', description: '击杀溢出伤害(Overkill)比例转化为治疗。', synergies: ['锋刃', '破壁人'], rarity: 'legendary', cost: 4, baseStats: { chips: 0 }, starEffects: { 1: '1% 回血', 2: '5% 回血', 3: '20% 回血' } },
  { templateId: 'c4-08', name: '幻象核心', description: '弃掉的黑桃牌永久增加其基础点数。', synergies: ['锋刃', '欺诈师'], rarity: 'legendary', cost: 4, baseStats: { chips: 0 }, starEffects: { 1: '点数 +3', 2: '点数 +8', 3: '点数 +25' } },

  // --- 5 Cost ---
  { templateId: 'c5-01', name: '欧米伽终端', description: '锁定同花顺底分，且最终伤害额外乘算。', synergies: ['算力者'], rarity: 'mythic', cost: 5, baseStats: { chips: 0 }, starEffects: { 1: '额外 x2', 2: '额外 x5', 3: '额外 x20' } },
  { templateId: 'c5-02', name: '降维打击·清算', description: '商店点空白处直接花钱买全局倍率。', synergies: ['财阀'], rarity: 'mythic', cost: 5, baseStats: { chips: 0 }, starEffects: { 1: '20块/倍率', 2: '10块/倍率', 3: '2块/倍率' } },
  { templateId: 'c5-03', name: '万物归墟·凋零', description: '怪物锁死防御意图，毒伤概率暴击。', synergies: ['猛毒'], rarity: 'mythic', cost: 5, baseStats: { chips: 0 }, starEffects: { 1: '20% 暴击(x3)', 2: '50% 暴击(x3)', 3: '100% 暴击(x3)' } },
  { templateId: 'c5-04', name: '神创堡垒·埃癸斯', description: '护甲绝对不重置，出牌时护甲比例转倍率。', synergies: ['堡垒'], rarity: 'mythic', cost: 5, baseStats: { chips: 0 }, starEffects: { 1: '转化 10%', 2: '转化 30%', 3: '转化 100%' } },
  { templateId: 'c5-05', name: '真理之剑·达摩克利斯', description: '伤害全转真伤，牌库所有黑桃筹码永久乘算。', synergies: ['锋刃'], rarity: 'mythic', cost: 5, baseStats: { chips: 0 }, starEffects: { 1: '黑桃筹码 x2', 2: '黑桃筹码 x5', 3: '黑桃筹码 x20' } },
  { templateId: 'c5-06', name: '源代码·悖论', description: '不死图腾！0血以下不死，出牌按比例扣血。', synergies: ['破壁人'], rarity: 'mythic', cost: 5, baseStats: { chips: 0 }, starEffects: { 1: '死线 -50血', 2: '死线 -150血', 3: '死线 -999血' } }
];