import { useState, useEffect, useMemo } from 'react';
import { Card, Enemy, PlayerState, HandEvaluation, IntentType, HandType, Modifier, ScoreBreakdown, Suit, HAND_TYPE_NAMES, TFTCard, Synergy } from '@/types/game';
import { createDeck, shuffleDeck, drawCards } from '@/lib/deck';
import { evaluateHand, calculateScore, EvaluationOptions } from '@/lib/poker-engine';
import { CardComponent } from '@/components/Card';
import ScoreCalculation from '@/components/ScoreCalculation';
import { MODIFIERS, MONSTER_TEMPLATES, LEVEL_EXP_CURVE, SHOP_PROBABILITIES, SYNERGIES } from '@/lib/game-config';
import { CARD_DATABASE } from '@/lib/card-database';
import { calculateActiveSynergies } from '@/lib/synergy-engine';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Skull, Coins, RefreshCw, Play, Zap, Heart, Activity, Menu, Info, BookOpen, X, Sparkles, Lock, Ghost, HelpCircle, EyeOff, Trash2, Droplet, Layers, Archive, Star, ArrowUpCircle, Cpu, ShoppingCart } from 'lucide-react';
import { SUIT_SYMBOLS, SUIT_COLORS } from '@/types/game';

// Tutorial Components & Data
const TutorialCard = ({ rank, suit, isGlass, isLocked, isHidden, isJunk }: { rank?: string, suit?: Suit, isGlass?: boolean, isLocked?: boolean, isHidden?: boolean, isJunk?: boolean, key?: any }) => {
  const color = isHidden ? 'text-slate-400' : SUIT_COLORS[suit || 'spades'];
  const symbol = isHidden ? '?' : SUIT_SYMBOLS[suit || 'spades'];
  
  return (
    <div className={`
      w-10 h-14 sm:w-12 sm:h-18 rounded-md border flex flex-col items-center justify-center relative overflow-hidden shrink-0
      ${isGlass ? 'border-blue-400 bg-blue-900/30 shadow-[0_0_10px_rgba(96,165,250,0.3)]' : 'border-white/20 bg-slate-800'}
      ${isJunk ? 'grayscale opacity-40' : ''}
    `}>
      <span className={`text-[10px] sm:text-xs font-black font-mono leading-none ${color} drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]`}>{rank}</span>
      <span className={`text-[8px] sm:text-[10px] leading-none ${color} drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]`}>{symbol}</span>
      {isGlass && <div className="absolute bottom-0.5 right-0.5 text-[6px] text-blue-300 animate-pulse"><Sparkles size={6} /></div>}
      {isLocked && <div className="absolute top-0.5 right-0.5 text-[6px] text-rose-500"><Lock size={6} /></div>}
      {isJunk && <div className="absolute inset-0 flex items-center justify-center opacity-10"><Ghost size={12} /></div>}
    </div>
  );
};

const TUTORIAL_HANDS_EXAMPLES = [
  { name: '同花顺 (Straight Flush)', score: '100 x 8', desc: '五张花色相同且点数连续的牌。', cards: [
    { rank: '9', suit: 'hearts' }, { rank: '8', suit: 'hearts' }, { rank: '7', suit: 'hearts' }, { rank: '6', suit: 'hearts' }, { rank: '5', suit: 'hearts' }
  ]},
  { name: '四条 (Four of a Kind)', score: '60 x 7', desc: '四张点数相同的牌。', cards: [
    { rank: 'A', suit: 'spades' }, { rank: 'A', suit: 'hearts' }, { rank: 'A', suit: 'clubs' }, { rank: 'A', suit: 'diamonds' }, { rank: '2', suit: 'hearts' }
  ]},
  { name: '葫芦 (Full House)', score: '40 x 4', desc: '三张点数相同的牌加一对。', cards: [
    { rank: 'K', suit: 'spades' }, { rank: 'K', suit: 'hearts' }, { rank: 'K', suit: 'clubs' }, { rank: '2', suit: 'hearts' }, { rank: '2', suit: 'diamonds' }
  ]},
  { name: '同花 (Flush)', score: '35 x 4', desc: '五张花色相同的牌。', cards: [
    { rank: 'A', suit: 'diamonds' }, { rank: 'J', suit: 'diamonds' }, { rank: '8', suit: 'diamonds' }, { rank: '5', suit: 'diamonds' }, { rank: '2', suit: 'diamonds' }
  ]},
  { name: '顺子 (Straight)', score: '30 x 4', desc: '五张点数连续的牌。', cards: [
    { rank: 'Q', suit: 'spades' }, { rank: 'J', suit: 'hearts' }, { rank: '10', suit: 'diamonds' }, { rank: '9', suit: 'clubs' }, { rank: '8', suit: 'spades' }
  ]},
];

const MONSTER_ABILITIES = [
  { name: '致盲 (Blind)', icon: <EyeOff size={14} className="text-slate-400" />, desc: '隐藏手牌信息，无法看到花色与点数。', example: <TutorialCard rank="?" suit="spades" isHidden /> },
  { name: '锁链 (Lock)', icon: <Lock size={14} className="text-rose-400" />, desc: '卡牌被锁死，本回合无法打出或弃掉。', example: <TutorialCard rank="A" suit="hearts" isLocked /> },
  { name: '寄生 (Junk)', icon: <Trash2 size={14} className="text-emerald-400" />, desc: '往弃牌堆塞入 0 分废牌，稀释牌库。', example: <TutorialCard rank="?" suit="spades" isJunk /> },
  { name: '吸血 (Leech)', icon: <Droplet size={14} className="text-rose-600" />, desc: '你造成的伤害 50% 转化为怪物生命回复。', example: <TutorialCard rank="K" suit="diamonds" /> },
];
// Runtime Buff Storage for Cross-Turn mechanics
let globalTemporaryMult = 0;
let illusionistCacheScore = 0;
// --- 全局战斗缓存状态 (修复 ReferenceError) ---
let turnTemporaryMult = 0;
// Initial Player State
const INITIAL_PLAYER: PlayerState = {
  maxHp: 100,
  currentHp: 100,
  block: 0,
  gold: 0,
  level: 1,
  currentExp: 0,
  maxExp: 2,
  overclockCount: 0,
  hands: 3,
  discards: 3,
  deck: [],
  hand: [],
  discardPile: [],
  modifiers: [],
  jokers: [],
  consumables: [],
  activeTFTCards: [],
  benchTFTCards: [],
  pendingCardIds: [],
  handsUsedThisBattle: 0
};

export default function GameBoard() {
  const [player, setPlayer] = useState<PlayerState>(INITIAL_PLAYER);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [selectedHand, setSelectedHand] = useState<HandEvaluation | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showShop, setShowShop] = useState(false);
  const [shopCards, setShopCards] = useState<TFTCard[]>([]);
  const [shopRefreshCost, setShopRefreshCost] = useState(2);
  const [level, setLevel] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<'poker' | 'rogue' | 'deck' | 'guide' | 'mechanics' | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  
  // 浮动特效反馈数组
  const [feedbackTexts, setFeedbackTexts] = useState<{id: number, text: string, color: string}[]>([]);
  const [tftFeedbacks, setTftFeedbacks] = useState<{index: number, text: string, color: string, id: number}[]>([]);
  
  // Scoring UI State
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [playingCards, setPlayingCards] = useState<Card[]>([]);
  const [scoringSequence, setScoringSequence] = useState<any[]>([]); // 存放数字依次跳动的动画队列
  
  // Derived cards for the buffer zone
  const selectedCards = useMemo(() => {
    return player.pendingCardIds
      .map(id => player.hand.find(c => c.id === id))
      .filter((c): c is Card => !!c);
  }, [player.hand, player.pendingCardIds]);
  const currentBufferCards = isCalculating ? playingCards : selectedCards;

  // Animation states for scoring
  const [displayChips, setDisplayChips] = useState(0);
  const [displayMult, setDisplayMult] = useState(0);
  const [displayTotal, setDisplayTotal] = useState<number | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [showTotal, setShowTotal] = useState(false);
  const [chipsPulse, setChipsPulse] = useState(false);
  const [multPulse, setMultPulse] = useState(false);
  const [flyingDamage, setFlyingDamage] = useState<{ amount: number, isFlying: boolean } | null>(null);
  const [enemyHitState, setEnemyHitState] = useState<'idle' | 'hit'>('idle');
  const [playerHitState, setPlayerHitState] = useState<'idle' | 'hit'>('idle');
  const [playerDamageTaken, setPlayerDamageTaken] = useState<number>(0);
  const [playerBlockTaken, setPlayerBlockTaken] = useState<number>(0);

  // Derived Synergies
  const activeSynergies = useMemo(() => {
    return calculateActiveSynergies(player.activeTFTCards);
  }, [player.activeTFTCards]);

  // Derived evaluation options from modifiers AND synergies
  const evalOptions = useMemo<EvaluationOptions>(() => {
    const options: EvaluationOptions = {
        tftChipsBonus: 0,
        tftMultBonus: 0,
        flushThreshold: 5,
        allowWrapAroundStraight: false
    };
    
    // (卡牌与Buff的数值注入已全部转移至 playHand 的动画时序队列中，实现动态跳字！)

    // Synergies
    const surfer = activeSynergies.find(s => s.id === 'surfer');
    if (surfer && surfer.activeLevel >= 1) {
        options.flushThreshold = 4;
        if (surfer.activeLevel >= 2) {
            options.flushThreshold = 3;
        }
    }

    const geek = activeSynergies.find(s => s.id === 'geek');
    if (geek && geek.activeLevel >= 1) {
        options.allowWrapAroundStraight = true;
    }

    // Calculator (4) & Assassin (2) rule altering can be placed in score calculation
    const assassin = activeSynergies.find(s => s.id === 'assassin');
    // ...

    // Capital Croc Wildcard rule
    if (player.gold > 50 && player.activeTFTCards.some(c => c.templateId === 'c4-03')) {
       // All cards treated as wildcards is tricky in memo, handled via score logic natively if needed
    }

    // Modifiers (Legacy/Items)
    player.modifiers.forEach(m => {
      if (m.id === 'four-color') options.fourColorMultiplier = 3;
      if (m.id === 'spade-mania') options.spadeBaseBonus = 4;
      if (m.id === 'odd-amp') options.oddCardMultiplierBonus = 2;
      if (m.id === 'fuzzy-logic') options.flushThreshold = Math.min(options.flushThreshold || 5, 4);
      if (m.id === 'quantum-jack') options.quantumJack = true;
    });
    return options;
  }, [player.modifiers, player.activeTFTCards, activeSynergies]);

  // Initialize Game
  useEffect(() => {
    startNewRun();
  }, []);

  // Scoring Animation Logic
  useEffect(() => {
    if (!isCalculating || !scoreBreakdown || !playingCards.length) return;

    const baseChips = scoreBreakdown.chipBreakdown[0]?.value || 0;
    const baseMult = scoreBreakdown.multBreakdown[0]?.value || 0;

    setDisplayChips(0);
    setDisplayMult(0);
    setShowTotal(false);
    setDisplayTotal(null);

    const timeouts: NodeJS.Timeout[] = [];
    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timeouts.push(id);
    };

    // 1. Reveal Base Score
    addTimeout(() => {
      setDisplayChips(baseChips);
      setDisplayMult(baseMult);
      setChipsPulse(true);
      setMultPulse(true);
      setTimeout(() => { setChipsPulse(false); setMultPulse(false); }, 200);
    }, 300);

    // 2. Animate Cards
    let currentTime = 500;
    const cardInterval = 400;

    playingCards.forEach((card, index) => {
      addTimeout(() => {
        setActiveCardIndex(index);
        addTimeout(() => {
            setDisplayChips(prev => prev + card.value);
            setChipsPulse(true);
            setTimeout(() => setChipsPulse(false), 200);
            if (card.isGlass) {
                setDisplayMult(prev => prev * 2);
                setMultPulse(true);
                setTimeout(() => setMultPulse(false), 200);
            }
        }, 150); 
      }, currentTime);

      addTimeout(() => {
        setActiveCardIndex(null);
      }, currentTime + 300);

      currentTime += cardInterval;
    });

    // 3. Animate Synergy and TFT Sequence (依次亮起并跳动数字)
    scoringSequence.forEach((step) => {
        addTimeout(() => {
            if (step.type === 'synergy' || step.type === 'mod') {
                setFeedbackTexts([{ id: Date.now(), text: step.text, color: step.color }]);
            } else if (step.type === 'tft') {
                setTftFeedbacks([{ id: Date.now(), index: step.index!, text: step.text, color: step.color }]);
            }
            
            // 数字跳动同步
            setDisplayChips(step.chips);
            setDisplayMult(step.mult);
            
            // 如果直接暴力修改了Total乘区(如处决乘算*3)，临时弹一下总分提示
            if (step.total !== step.chips * step.mult) {
                setDisplayTotal(step.total);
                setShowTotal(true);
                setTimeout(() => setShowTotal(false), 400);
            }
            
            setChipsPulse(true);
            setMultPulse(true);
            setTimeout(() => { setChipsPulse(false); setMultPulse(false); }, 200);
        }, currentTime);
        
        currentTime += 600; // 每个流派特效给600ms的展示时间，爽感拉满
    });

    // 4. Finalize & Clear feedbacks
    addTimeout(() => {
      setFeedbackTexts([]);
      setTftFeedbacks([]);
      setDisplayChips(scoreBreakdown.chips);
      setDisplayMult(scoreBreakdown.mult);
    }, currentTime + 100);

    // 5. Show Final Total
    addTimeout(() => {
      setShowTotal(true);
      setDisplayTotal(scoreBreakdown.total);
    }, currentTime + 300);

    // 6. Flying Damage Blast
    addTimeout(() => {
      setShowTotal(false);
      setFlyingDamage({ amount: scoreBreakdown.total, isFlying: true });
    }, currentTime + 1300);

    // 7. Hit Enemy
    addTimeout(() => {
      setFlyingDamage(null);
      setEnemyHitState('hit');
      setTimeout(() => setEnemyHitState('idle'), 400); 
      applyHandEffects();
    }, currentTime + 1550); 

    return () => timeouts.forEach(clearTimeout);
  }, [isCalculating, scoreBreakdown, playingCards, scoringSequence]);

  // Check Win Condition
  useEffect(() => {
    if (enemy && enemy.currentHp <= 0 && gameStatus === 'playing') {
      setGameStatus('won'); // 标记为过渡状态，防止重复触发
      startNextBattle();    // 直接发放奖励并在当前屏幕展开底部商店！
    }
  }, [enemy?.currentHp, gameStatus]);

  // Check Loss Condition
  useEffect(() => {
    if (player.currentHp <= 0 && gameStatus === 'playing') {
      setGameStatus('lost');
    }
  }, [player.currentHp, gameStatus]);

  const generateEnemy = (level: number): Enemy => {
    // Determine Tier based on level
    // Level 1-3: Tier 1
    // Level 4-6: Tier 2
    // Level 7+: Tier 3
    let tier: 1 | 2 | 3 = 1;
    if (level >= 4) tier = 2;
    if (level >= 7) tier = 3;

    // Filter templates by tier
    const templates = Object.entries(MONSTER_TEMPLATES).filter(([_, t]) => t.tier === tier);
    const [id, template] = templates[Math.floor(Math.random() * templates.length)];

    // Scale HP
    const hp = template.maxHp + (level * 10);

    // Initial Intent
    const intent: { type: IntentType; value: number; description: string } = {
       type: 'attack',
       value: 10 + (level * 2),
       description: '攻击'
    };

    return {
      id: `enemy-${level}-${id}`,
      name: template.name,
      tier: template.tier,
      maxHp: hp,
      currentHp: hp,
      block: 0,
      intent: intent,
      statusEffects: []
    };
  };

  const startNewRun = () => {
    turnTemporaryMult = 0;
    setLevel(1);
    const newDeck = shuffleDeck(createDeck());
    const { drawn, remaining } = drawCards(newDeck, 8);
    
    setPlayer({
      ...INITIAL_PLAYER,
      deck: remaining,
      hand: drawn,
      discardPile: []
    });
    setEnemy(generateEnemy(1));
    setGameStatus('playing');
    setScoreBreakdown(null);
  };

  const startNextBattle = () => {
    turnTemporaryMult = 0;
    let rewardGold = 2; 
    let healAmount = 0;
    
    const currentSynergies = calculateActiveSynergies(player.activeTFTCards);
    
    // 财阀(Syndicate) 胜利额外掉落
    const syndicate = currentSynergies.find(s => s.id === 'diamonds');
    if (syndicate && syndicate.activeLevel >= 1) {
        rewardGold += 3;
    }

    // 利息 (财阀4: 上限10)
    let interestCap = (syndicate && syndicate.activeLevel >= 2) ? 10 : 5;
    const interest = Math.min(interestCap, Math.floor(player.gold / 10));
    rewardGold += interest;
    
    // 快速击杀
    if (player.handsUsedThisBattle === 1) rewardGold += 2;
    else if (player.handsUsedThisBattle === 2) rewardGold += 1;

    // c1-02 与 c3-06 的养成结算
    const updatedActiveCards = player.activeTFTCards.map(c => {
        if (c.templateId === 'c1-02') {
            const magician = currentSynergies.find(s => s.id === 'magician');
            const baseDiscards = 3 + (magician && magician.activeLevel >= 1 ? 2 : 0);
            const hasDiscarded = player.discards < baseDiscards; 
            if (!hasDiscarded) rewardGold += c.stars === 1 ? 1 : c.stars === 2 ? 2 : 5;
            if (player.currentHp < player.maxHp) healAmount += c.stars === 1 ? 2 : c.stars === 2 ? 5 : 15;
        }
        if (c.templateId === 'c3-06' && interest > 0) {
            const multGain = interest * (c.stars===1?1:c.stars===2?2:5);
            return { ...c, stats: { ...c.stats, mult: (c.stats?.mult || 0) + multGain } };
        }
        return c;
    });

    // 3. EXP Gain
    let newExp = player.currentExp + 2;
    let newLevel = player.level;
    let newMaxExp = player.maxExp;

    // (移除了重复声明的 currentSynergies)
    
    let baseDiscards = 3;
    const magician = currentSynergies.find(s => s.id === 'magician');
    if (magician && magician.activeLevel >= 1) {
        baseDiscards += 2;
    }

    // Level Up Logic
    while (newLevel < 6 && newExp >= newMaxExp) {
        newExp -= newMaxExp;
        newLevel++;
        newMaxExp = LEVEL_EXP_CURVE[newLevel];
    }
    if (newLevel === 6) {
        newExp = 0;
        newMaxExp = 9999;
    }

    setPlayer(prev => ({
        ...prev,
        currentHp: Math.min(prev.maxHp, prev.currentHp + 20),
        gold: prev.gold + rewardGold,
        level: newLevel,
        currentExp: newExp,
        maxExp: newMaxExp,
        hands: 3,
        discards: baseDiscards,
        block: 0,
        hand: [],
        discardPile: [],
        pendingCardIds: [],
        handsUsedThisBattle: 0,
        deck: shuffleDeck([...prev.deck, ...prev.hand, ...prev.discardPile]),
        activeTFTCards: updatedActiveCards
    }));

    const probs = SHOP_PROBABILITIES[newLevel] || SHOP_PROBABILITIES[6];
    const newShopCards: TFTCard[] = [];
    for (let i = 0; i < 4; i++) {
        const roll = Math.random() * 100;
        let rarity = 1;
        let cumulative = 0;
        for (let r = 1; r <= 5; r++) {
            cumulative += probs[r] || 0;
            if (roll <= cumulative) { rarity = r; break; }
        }
        const pool = CARD_DATABASE.filter(c => c.cost === rarity);
        const template = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : CARD_DATABASE[0];
        newShopCards.push({ 
            ...template, 
            id: Math.random().toString(36).substr(2, 9), 
            stars: 1,
            stats: { ...template.baseStats } // Fixed: Initialize stats correctly
        } as TFTCard);
    }
    setShopCards(newShopCards);
    setShowShop(true);
  };

  const generateShop = () => {
    const newShopCards: TFTCard[] = [];
    const probs = SHOP_PROBABILITIES[player.level] || SHOP_PROBABILITIES[6];

    const currentSynergies = calculateActiveSynergies(player.activeTFTCards);
    const cheater = currentSynergies.find(s => s.id === 'cheater');
    const forceOwnCard = cheater && cheater.activeLevel >= 2;

    for (let i = 0; i < 4; i++) {
        if (i === 0 && forceOwnCard) {
             const ownCards = [...player.activeTFTCards, ...player.benchTFTCards];
             if (ownCards.length > 0) {
                 const randomOwn = ownCards[Math.floor(Math.random() * ownCards.length)];
                 const template = CARD_DATABASE.find(c => c.templateId === randomOwn.templateId);
                 if (template) {
                     newShopCards.push({ 
                         ...template, 
                         id: Math.random().toString(36).substr(2, 9), 
                         stars: 1,
                         stats: { ...template.baseStats }
                     } as TFTCard);
                     continue;
                 }
             }
        }

        const roll = Math.random() * 100;
        let rarity = 1;
        let cumulative = 0;
        
        for (let r = 1; r <= 5; r++) {
            cumulative += probs[r] || 0;
            if (roll <= cumulative) { rarity = r; break; }
        }

        const pool = CARD_DATABASE.filter(c => c.cost === rarity);
        if (pool.length === 0) {
            newShopCards.push({
                ...CARD_DATABASE[0],
                id: Math.random().toString(36).substr(2, 9),
                stars: 1,
                stats: { ...CARD_DATABASE[0].baseStats }
            } as TFTCard);
        } else {
            const template = pool[Math.floor(Math.random() * pool.length)];
            newShopCards.push({
                ...template,
                id: Math.random().toString(36).substr(2, 9),
                stars: 1,
                stats: { ...template.baseStats }
            } as TFTCard);
        }
    }
    setShopCards(newShopCards);
  };

  const buyExp = () => {
    if (player.gold < 4 && player.level < 6) return;
    if (player.level === 6 && player.gold < 20) return;

    if (player.level === 6) {
        setPlayer(prev => {
            if (prev.activeTFTCards.length === 0) return { ...prev, gold: prev.gold - 20 };
            const newActive = [...prev.activeTFTCards];
            const randomIndex = Math.floor(Math.random() * newActive.length);
            const card = newActive[randomIndex];
            
            const currentChips = card.stats?.chips || 0;
            const currentMult = card.stats?.mult || 0;
            const currentDmgMod = card.stats?.baseDamageMod || 0;
            
            newActive[randomIndex] = {
                ...card,
                stats: {
                    ...card.stats,
                    chips: currentChips > 0 ? Math.ceil(currentChips * 1.15) : undefined,
                    mult: currentMult > 0 ? Math.ceil(currentMult * 1.15) : undefined,
                    baseDamageMod: currentDmgMod + 15
                }
            };
            return {
                ...prev,
                gold: prev.gold - 20,
                overclockCount: prev.overclockCount + 1,
                activeTFTCards: newActive
            };
        });
    } else {
        setPlayer(prev => {
            let newExp = prev.currentExp + 4;
            let newLevel = prev.level;
            let newMaxExp = prev.maxExp;

            while (newLevel < 6 && newExp >= newMaxExp) {
                newExp -= newMaxExp;
                newLevel++;
                newMaxExp = LEVEL_EXP_CURVE[newLevel];
            }
            if (newLevel === 6) {
                newExp = 0;
                newMaxExp = 9999;
            }
            return {
                ...prev,
                gold: prev.gold - 4,
                level: newLevel,
                currentExp: newExp,
                maxExp: newMaxExp
            };
        });
    }
  };

  const refreshShop = () => {
    const cheaterSynergy = activeSynergies.find(s => s.id === 'cheater');
    const tycoonSynergy = activeSynergies.find(s => s.id === 'diamonds');
    let cost = shopRefreshCost;
    if (cheaterSynergy && cheaterSynergy.activeLevel >= 1) cost = 1;
    if (tycoonSynergy && tycoonSynergy.activeLevel >= 3) cost = 1; // 财阀6 D牌1块钱
    
    const canBloodSacrifice = cheaterSynergy && cheaterSynergy.activeLevel >= 2;
    const requiredHp = (cost - player.gold) * 2;

    if (player.gold >= cost || (canBloodSacrifice && player.currentHp > requiredHp)) {
        let goldToPay = Math.min(player.gold, cost);
        let hpToPay = canBloodSacrifice && player.gold < cost ? requiredHp : 0;
        let hpCost = hpToPay;
        let tftFbs: any[] = [];
        
        // c1-05 拾荒猎犬 (刷新扣血涨筹码)
        const updatedCards = player.activeTFTCards.map((c, idx) => {
            if (c.templateId === 'c1-05') {
                hpCost += 1;
                tftFbs.push({ index: idx, text: `拾荒成长`, color: 'text-rose-400', id: Date.now()+idx });
                return { ...c, stats: { ...c.stats, chips: (c.stats?.chips || 0) + (c.stars===1?2:c.stars===2?5:15) } };
            }
            return c;
        });

        if (tftFbs.length > 0) {
            setTftFeedbacks(tftFbs);
            setTimeout(() => setTftFeedbacks([]), 2000);
        }

        setPlayer(prev => ({ 
            ...prev, 
            gold: prev.gold - goldToPay,
            currentHp: Math.max(1, prev.currentHp - hpCost),
            activeTFTCards: updatedCards
        }));
        generateShop();
    }
  };
  // Fixed: Comprehensive 3-to-1 Synthesis Logic
  const buyTFTCard = (card: TFTCard, index: number) => {
    const cheaterSynergy = activeSynergies.find(s => s.id === 'cheater');
    const canBloodSacrifice = cheaterSynergy && cheaterSynergy.activeLevel >= 2;
    const requiredHp = (card.cost - player.gold) * 2;

    if ((player.gold >= card.cost || (canBloodSacrifice && player.currentHp > requiredHp)) && player.benchTFTCards.length < 6) {
        const goldToPay = Math.min(player.gold, card.cost);
        const hpToPay = canBloodSacrifice && player.gold < card.cost ? requiredHp : 0;

        setPlayer(prev => {
            let newActive = [...prev.activeTFTCards];
            let newBench = [...prev.benchTFTCards, { ...card, stats: { ...card.stats } }];

            let synthesized = true;
            while(synthesized) {
                synthesized = false;
                const counts: Record<string, {type: 'active'|'bench', index: number}[]> = {};
                
                newActive.forEach((c, i) => {
                    const key = `${c.templateId}_${c.stars}`;
                    if(!counts[key]) counts[key] = [];
                    counts[key].push({type: 'active', index: i});
                });
                newBench.forEach((c, i) => {
                    const key = `${c.templateId}_${c.stars}`;
                    if(!counts[key]) counts[key] = [];
                    counts[key].push({type: 'bench', index: i});
                });

                for (const key in counts) {
                    if (counts[key].length >= 3 && !key.endsWith('_3')) {
                        synthesized = true;
                        // Reverse delete to prevent array index shifting issues
                        const toRemove = counts[key].slice(0, 3).reverse(); 
                        let templateCard: TFTCard | null = null;
                        
                        toRemove.forEach(rm => {
                            if (rm.type === 'active') {
                                templateCard = newActive[rm.index];
                                newActive.splice(rm.index, 1);
                            } else {
                                templateCard = newBench[rm.index];
                                newBench.splice(rm.index, 1);
                            }
                        });

                        if (templateCard) {
                            const upgraded: TFTCard = {
                                ...(templateCard as TFTCard),
                                id: Math.random().toString(36).substr(2, 9), // Grant new ID for UI animation
                                stars: (templateCard as TFTCard).stars + 1,
                                stats: {
                                    chips: (templateCard as TFTCard).stats?.chips ? (templateCard as TFTCard).stats.chips! * 2 : undefined,
                                    mult: (templateCard as TFTCard).stats?.mult ? (templateCard as TFTCard).stats.mult! * 2 : undefined,
                                    percentMult: (templateCard as TFTCard).stats?.percentMult ? (templateCard as TFTCard).stats.percentMult! * 2 : undefined,
                                }
                            };
                            newBench.push(upgraded);
                        }
                        break; // Break inner loop, restart while
                    }
                }
            }

            return {
                ...prev,
                gold: prev.gold - goldToPay,
                currentHp: prev.currentHp - hpToPay,
                activeTFTCards: newActive,
                benchTFTCards: newBench
            };
        });
        setShopCards(prev => prev.filter((_, i) => i !== index));
    }
  };

  const swapTFTCard = (fromBenchIndex: number, toActiveIndex: number) => {
    setPlayer(prev => {
        if (!showShop) return prev;
        const newActive = [...prev.activeTFTCards];
        const newBench = [...prev.benchTFTCards];
        
        const benchCard = newBench[fromBenchIndex];
        const activeCard = newActive[toActiveIndex];
        
        if (benchCard) {
            newActive[toActiveIndex] = benchCard;
            if (activeCard) {
                newBench[fromBenchIndex] = activeCard;
            } else {
                newBench.splice(fromBenchIndex, 1);
            }
        } else if (activeCard) {
            newActive.splice(toActiveIndex, 1);
            newBench.push(activeCard);
        }
        
        return { ...prev, activeTFTCards: newActive.filter(Boolean), benchTFTCards: newBench.filter(Boolean) };
    });
  };

  const moveActiveToBench = (index: number) => {
    setPlayer(prev => {
        if (!showShop) return prev; // Fixed: Prevent swapping during combat
        if (prev.benchTFTCards.length >= 6) return prev; // Fixed: Bench Limit 6
        const card = prev.activeTFTCards[index];
        const newActive = prev.activeTFTCards.filter((_, i) => i !== index);
        const newBench = [...prev.benchTFTCards, card];
        return { ...prev, activeTFTCards: newActive, benchTFTCards: newBench };
    });
  };

  const moveBenchToActive = (index: number) => {
    setPlayer(prev => {
        if (!showShop) return prev; // Fixed: Prevent swapping during combat
        if (prev.activeTFTCards.length >= prev.level) return prev; // Fixed: Active Limit = Level
        const card = prev.benchTFTCards[index];
        const newBench = prev.benchTFTCards.filter((_, i) => i !== index);
        const newActive = [...prev.activeTFTCards, card];
        return { ...prev, activeTFTCards: newActive, benchTFTCards: newBench };
    });
  };

  const handleSellCard = (type: 'active' | 'bench', index: number) => {
      setPlayer(prev => {
          if (!showShop) return prev;
          const card = type === 'active' ? prev.activeTFTCards[index] : prev.benchTFTCards[index];
          if (!card) return prev;
          const sellValue = Math.max(1, card.cost - 1);
          const newActive = [...prev.activeTFTCards];
          const newBench = [...prev.benchTFTCards];
          if (type === 'active') newActive.splice(index, 1);
          else newBench.splice(index, 1);
          return { ...prev, gold: prev.gold + sellValue, activeTFTCards: newActive, benchTFTCards: newBench };
      });
  };

  const closeShop = () => {
    setIsSelling(false);
    setShowShop(false);
    setPlayer(prev => {
        const { drawn, remaining } = drawCards(prev.deck, 8);
        return { ...prev, hand: drawn, deck: remaining };
    });
    setEnemy(generateEnemy(level));
    setGameStatus('playing');
    setScoreBreakdown(null);
  };

  // Handle Card Selection
  const toggleCardSelection = (cardId: string) => {
    if (gameStatus !== 'playing' || isCalculating) return;
    
    setPlayer(prev => {
      const card = prev.hand.find(c => c.id === cardId);
      if (card?.isLocked) return prev; // Cannot select locked cards

      const isSelecting = !card?.isSelected;
      
      // Limit selection to 5
      if (isSelecting && prev.pendingCardIds.length >= 5) return prev;

      const newHand = prev.hand.map(c => 
        c.id === cardId ? { ...c, isSelected: isSelecting } : c
      );
      
      const newPendingIds = isSelecting 
        ? [...prev.pendingCardIds, cardId]
        : prev.pendingCardIds.filter(id => id !== cardId);

      return { ...prev, hand: newHand, pendingCardIds: newPendingIds };
    });
  };

  // Evaluate Hand
  useEffect(() => {
    const selectedCards = player.hand.filter(c => c.isSelected);
    if (selectedCards.length > 0) {
      const evaluation = evaluateHand(selectedCards, evalOptions);
      setSelectedHand(evaluation);
    } else {
      setSelectedHand(null);
    }
  }, [player.hand, evalOptions]);

  // Play Hand Action (重构：精准排队的算分流)
  const playHand = () => {
    if (!selectedHand || player.hands <= 0 || gameStatus !== 'playing' || isCalculating) return;

    // 1. Calculate Score (Base from poker cards)
    const sortedCards = [...selectedHand.cards].sort((a, b) => a.value - b.value);
    const sortedHand = { ...selectedHand, cards: sortedCards };
    let breakdown = calculateScore(sortedHand, evalOptions);

    const hasSpades = sortedHand.cards.some(c => c.suit === 'spades');
    const hasHearts = sortedHand.cards.some(c => c.suit === 'hearts');
    const hasClubs = sortedHand.cards.some(c => c.suit === 'clubs');
    const hasDiamonds = sortedHand.cards.some(c => c.suit === 'diamonds');
    const isSingle = sortedHand.cards.length === 1;
    const isPair = ['Pair', 'Two Pair', 'Full House', 'Four of a Kind'].includes(sortedHand.type);
    const isStraight = ['Straight', 'Straight Flush', 'Royal Flush'].includes(sortedHand.type);
    const isFlush = ['Flush', 'Straight Flush', 'Royal Flush'].includes(sortedHand.type);

    // Trackers for animation steps
    let curChips = breakdown.chips;
    let curMult = breakdown.mult;
    let curTotal = curChips * curMult;

    const animSequence: any[] = [];
    const addSeq = (type: 'synergy'|'tft'|'mod', text: string, color: string, idx?: number) => {
        animSequence.push({ type, text, color, index: idx, chips: curChips, mult: curMult, total: curTotal });
    }

    // --- 羁绊算分队列录入 ---
    const calc = activeSynergies.find(s => s.id === 'calculator');
    if (calc && calc.activeLevel >= 1 && isPair) {
        curMult += 5;
        curTotal = curChips * curMult;
        addSeq('synergy', '算力: 倍率飙升', 'text-blue-400');
    }

    const blades = activeSynergies.find(s => s.id === 'spades');
    const spadesCount = sortedHand.cards.filter(c => c.suit === 'spades').length;
    if (blades && blades.activeLevel >= 1 && spadesCount > 0) {
        let chipPerSpade = blades.activeLevel === 1 ? 15 : blades.activeLevel >= 2 ? 55 : 0;
        if (blades.activeLevel >= 2) {
            const hpLossPercent = Math.max(0, (player.maxHp - player.currentHp) / player.maxHp);
            chipPerSpade *= (1 + Math.floor(hpLossPercent / 0.1));
        }
        curChips += (chipPerSpade * spadesCount);
        if (blades.activeLevel >= 3) curChips += player.block;
        curTotal = curChips * curMult;
        addSeq('synergy', '锋刃: 筹码转化', 'text-cyan-400');
    }

    if (illusionistCacheScore > 0) {
        curChips += illusionistCacheScore;
        curTotal = curChips * curMult;
        illusionistCacheScore = 0; // consumed
        addSeq('synergy', '欺诈: 缓存释放', 'text-purple-400');
    }

    const assassin = activeSynergies.find(s => s.id === 'assassin');
    if (assassin && assassin.activeLevel >= 1 && isSingle) {
        curChips += 55; // (四条基础60 - 高牌基础5 = 55)
        curMult += 6;   // (四条倍率7 - 高牌倍率1 = 6)
        curTotal = curChips * curMult;
        addSeq('synergy', '刺客: 致命处决', 'text-rose-500');
    }

    if (calc && calc.activeLevel >= 2 && isPair) {
        curTotal *= 2;
        addSeq('synergy', '算力: 双线程并发', 'text-blue-300');
    }

    const trojan = activeSynergies.find(s => s.id === 'clubs');
    if (trojan && trojan.activeLevel >= 1 && hasClubs) addSeq('synergy', '木马: 植入病毒', 'text-emerald-400');
    
    const hacker = activeSynergies.find(s => s.id === 'surfer');
    if (hacker && hacker.activeLevel >= 2 && isFlush) addSeq('synergy', '黑客: 权限绕过', 'text-purple-400');
    
    const geekSync = activeSynergies.find(s => s.id === 'geek');
    if (geekSync && geekSync.activeLevel >= 2 && isStraight) addSeq('synergy', '极客: 内存溢出', 'text-green-400');

    // --- 本回合缓存增益结算 ---
    if (turnTemporaryMult > 0) {
        curMult += turnTemporaryMult;
        curTotal = curChips * curMult;
        addSeq('synergy', `学徒算力汇聚: +${turnTemporaryMult}倍`, 'text-blue-300');
    }

    // --- TFT 卡牌插槽特效录入 (严格排队，动态加分) ---
    player.activeTFTCards.forEach((card, index) => {
        let text = ""; let color = "text-cyan-300";
        let triggered = false;

        // 1. 卡牌永久养成属性注入
        let statsTriggered = false;
        if (card.stats?.chips) { curChips += card.stats.chips; statsTriggered = true; }
        if (card.stats?.mult) { curMult += card.stats.mult; statsTriggered = true; }
        if (statsTriggered) {
            curTotal = curChips * curMult;
            addSeq('tft', `[${card.name}] 属性加成`, 'text-white', index);
        }

        // 2. 独立机制判定
        if (card.templateId === 'c5-01') {
            curChips += 100 - breakdown.baseChips;
            curMult += 8 - breakdown.baseMult;
            curTotal = curChips * curMult;
            text = `欧米伽协议`; color = "text-yellow-400"; triggered = true;
        }
        if (card.templateId === 'c4-02' && isSingle && ['A','K'].includes(sortedHand.cards[0].rank)) {
            const m = (card.stars === 1 ? 1.5 : card.stars === 2 ? 3 : 8);
            curTotal = Math.floor(curTotal * m);
            text = `处决乘算 x${m}`; color = "text-rose-500"; triggered = true;
        }
        if (card.templateId === 'c2-04' && hasSpades && player.gold >= 5) {
            const bonus = Math.floor(player.gold / 5) * (card.stars===1?2:card.stars===2?5:15) * sortedHand.cards.filter(c=>c.suit==='spades').length;
            if (bonus > 0) { curChips += bonus; curTotal = curChips * curMult; text = `算力挖掘 +${bonus}`; color="text-amber-400"; triggered = true; }
        }
        if (card.templateId === 'c3-01' && player.currentHp < player.maxHp) {
            const lossPercent = Math.max(0, (player.maxHp - player.currentHp) / player.maxHp);
            const stacks = Math.floor(lossPercent / 0.1);
            if (stacks > 0) {
                curChips += stacks * (card.stars===1?10:card.stars===2?25:80);
                curMult += stacks * (card.stars===1?1:card.stars===2?2:6);
                curTotal = curChips * curMult;
                text = `狂血增幅`; color="text-rose-400"; triggered = true;
            }
        }
        if (card.templateId === 'c3-07' && isSingle && sortedHand.cards[0].suit === 'spades') {
            const m = card.stars===1?2:card.stars===2?4:10;
            curChips *= m; curTotal = curChips * curMult;
            text = `处刑点数 x${m}`; color="text-purple-400"; triggered = true;
        }
        if (card.templateId === 'c4-03' && player.gold > 50) {
            const bonus = (card.stars===1?5:card.stars===2?15:50) * sortedHand.cards.length;
            curChips += bonus; curTotal = curChips * curMult;
            text = `资本注入 +${bonus}`; color="text-amber-400"; triggered = true;
        }
        if (card.templateId === 'c5-04') {
            const bonus = Math.floor(player.block * (card.stars===1?0.1:card.stars===2?0.3:1));
            if (bonus > 0) { curMult += bonus; curTotal = curChips * curMult; text = `埃癸斯转倍 +${bonus}`; color="text-amber-400"; triggered = true; }
        }
        if (card.templateId === 'c5-05' && hasSpades) {
            const m = card.stars===1?2:card.stars===2?5:20;
            curChips *= m; curTotal = curChips * curMult;
            text = `真理乘算 x${m}`; color="text-slate-100"; triggered = true;
        }
        if (card.templateId === 'c1-08' && isPair) { 
            const bonus = card.stars===1?1:card.stars===2?2:6;
            curMult += bonus; curTotal = curChips * curMult;
            text = `临时倍率+${bonus}`; color="text-blue-400"; triggered = true; 
        }

        // 仅动画播报 (底层扣血/护甲结算移交 applyHandEffects)
        if (card.templateId === 'c1-01' && isSingle) { text = `高牌蓄势`; triggered = true; }
        if (card.templateId === 'c1-04' && isStraight) { text = `植入木马`; color="text-emerald-400"; triggered = true; }
        if (card.templateId === 'c1-06' && isSingle) { text = `坚壁防御`; color="text-fuchsia-400"; triggered = true; }
        if (card.templateId === 'c1-07' && isFlush && hasClubs) { text = `毒液回血`; color="text-emerald-300"; triggered = true; }
        if (card.templateId === 'c2-01' && isFlush && hasHearts) { text=`血祭扩容`; color="text-rose-500"; triggered = true; }
        if (card.templateId === 'c2-02' && (curChips % 2 !== 0)) { text=`病毒裂变`; color="text-emerald-400"; triggered = true; }
        if (card.templateId === 'c2-03' && !isPair) { text=`孤高转化`; color="text-fuchsia-400"; triggered = true; }
        if (card.templateId === 'c2-07' && isStraight) { text=`逻辑守卫`; color="text-fuchsia-400"; triggered = true; }
        if (card.templateId === 'c3-03' && isStraight && hasSpades) { text=`皇家复制`; color="text-cyan-300"; triggered = true; }
        if (card.templateId === 'c3-05' && isFlush) { text=`生化治愈`; color="text-emerald-300"; triggered = true; }
        if (card.templateId === 'c4-01' && isStraight) { text=`时间回溯`; color="text-blue-300"; triggered = true; }
        if (card.templateId === 'c4-05' && isFlush) { text=`深网感染`; color="text-emerald-400"; triggered = true; }
        if (card.templateId === 'c4-06' && selectedHand.type === 'Four of a Kind') { text=`零度转化`; color="text-blue-200"; triggered = true; }

        if (triggered) addSeq('tft', text, color, index);
    });

    // Handle legacy Modifiers if any
    player.modifiers.filter(m => m.trigger === 'onCalculation').forEach(mod => {
        if (mod.id === 'overclock' && (selectedHand.type === 'Pair' || selectedHand.type === 'Two Pair')) {
            curMult += 2;
            curTotal = curChips * curMult;
            addSeq('mod', '算力超载', 'text-blue-300');
        }
    });

    // 覆盖最终算分结果
    breakdown.chips = curChips;
    breakdown.mult = curMult;
    breakdown.total = curTotal;

    // 提交数据到渲染管道，开启沉浸式跳动
    setScoringSequence(animSequence);
    setScoreBreakdown(breakdown);
    setPlayingCards(sortedHand.cards);
    setIsCalculating(true);
  };

  // Callback after animation completes
  const applyHandEffects = () => {
    if (!selectedHand || !scoreBreakdown || !enemy) {
        setPlayingCards([]);
        setIsCalculating(false);
        return;
    }

    // Glass Breakage
    const brokenCards = selectedHand.cards.filter(c => c.isGlass && Math.random() < 0.25);

    // Effect Accumulators
    let rawDamage = scoreBreakdown.total;
    let blockGain = 0;
    let poisonStacks = 0;
    let goldGain = 0;
    let isPiercing = false;

    // --- SYNERGY EFFECTS (Fixed IDs matching config) ---
    
    // 1. Blade (Spades)
    const bladeSynergy = activeSynergies.find(s => s.id === 'spades');
    if (bladeSynergy && bladeSynergy.activeLevel > 0) {
        const bonus = bladeSynergy.activeLevel === 1 ? 30 : bladeSynergy.activeLevel === 2 ? 80 : 0;
        rawDamage += bonus;
        if (bladeSynergy.activeLevel >= 3) {
            rawDamage *= 3;
        }
    }

    // 2. Fortress (Hearts)
    const fortressSynergy = activeSynergies.find(s => s.id === 'hearts');
    if (fortressSynergy && fortressSynergy.activeLevel > 0) {
        const bonus = fortressSynergy.activeLevel === 1 ? 20 : fortressSynergy.activeLevel === 2 ? 50 : 0;
        blockGain += bonus;
    }

    // 3. Venom (Clubs)
    const venomSynergy = activeSynergies.find(s => s.id === 'clubs');
    if (venomSynergy && venomSynergy.activeLevel > 0) {
        const bonus = venomSynergy.activeLevel === 1 ? 2 : venomSynergy.activeLevel === 2 ? 6 : 6;
        poisonStacks += bonus;
    }

    // --- COMBAT NUMBERS & CARD EFFECTS ---
    let healAmount = 0;
    let maxHpGain = 0;
    let selfHpLoss = 0;
    let trueDamageExt = 0;
    
    const isSingle = selectedHand.cards.length === 1;
    const isPair = ['Pair', 'Two Pair', 'Full House', 'Four of a Kind'].includes(selectedHand.type);
    const isStraight = ['Straight', 'Straight Flush', 'Royal Flush'].includes(selectedHand.type);
    const isFlush = ['Flush', 'Straight Flush', 'Royal Flush'].includes(selectedHand.type);
    const clubsCount = selectedHand.cards.filter(c => c.suit === 'clubs').length;

    // Trojan (Clubs) Poison Applying
    const trojan = activeSynergies.find(s => s.id === 'clubs');
    if (trojan && trojan.activeLevel >= 1 && clubsCount > 0) {
        poisonStacks += clubsCount; // Base Synergy
    }

    player.activeTFTCards.forEach((card) => {
        const id = card.templateId;
        const s = card.stars;

        // c1-01 暗巷快刀 (放在了死亡判定里)
        // c1-04 见习黑客
        if (id === 'c1-04' && isStraight) poisonStacks += s===1?2:s===2?5:15;
        // c1-06 盾卫新兵
        if (id === 'c1-06' && isSingle) blockGain += s===1?15:s===2?35:100;
        // c1-07 毒液试管
        if (id === 'c1-07' && isFlush) healAmount += clubsCount * (s===1?1:s===2?2:6);
        // c1-08 算力学徒 (累加到本回合缓存供下次出牌使用)
        if (id === 'c1-08' && isPair) turnTemporaryMult += s===1?1:s===2?2:6;
        // c2-01 狂血海妖
        if (id === 'c2-01' && isFlush && selectedHand.cards.some(c=>c.suit==='hearts')) {
             selfHpLoss += s===1?5:s===2?10:25; maxHpGain += s===1?5:s===2?10:25;
        }
        // c2-02 病毒裂变 (当前筹码为奇数使毒伤百分比提升)
        if (id === 'c2-02' && (breakdown.chips % 2 !== 0)) {
             poisonStacks += Math.floor((enemy.statusEffects.find(e=>e.type==='poison')?.stacks || 0) * (s===1?0.2:s===2?0.5:1));
        }
        // c2-03 孤高骑士
        if (id === 'c2-03' && !isPair) blockGain += Math.floor(rawDamage * (s===1?0.1:s===2?0.25:0.7));
        // c2-07 逻辑守卫 (Simplified to current turn)
        if (id === 'c2-07' && isStraight) blockGain += s===1?20:s===2?50:150;
        // c3-05 生化传播者
        if (id === 'c3-05' && isFlush) {
            const currentPsn = enemy.statusEffects.find(e=>e.type==='poison')?.stacks || 0;
            healAmount += currentPsn * (s===1?0.1:s===2?0.25:0.8);
        }
        // c3-07 处刑之刃
        if (id === 'c3-07' && isSingle && selectedHand.cards[0].suit === 'spades') isPiercing = true;
        // c4-01 时间重塑者
        if (id === 'c4-01' && isStraight) healAmount += 999;
        // c4-05 深网黑客
        if (id === 'c4-05' && isFlush) poisonStacks += Math.floor(rawDamage * (s===1?0.1:s===2?0.3:1));
        // c4-06 绝对零度
        if (id === 'c4-06' && selectedHand.type === 'Four of a Kind') maxHpGain += Math.floor(player.block * (s===1?0.05:s===2?0.15:0.5));
        // c5-01 欧米伽终端 (已在算分处挂载)
        // c5-05 达摩克利斯
        if (id === 'c5-05') isPiercing = true;
    });

    // c1-03 铁壁算盘 (全局护甲获取率提升)
    const c103 = player.activeTFTCards.find(c => c.templateId === 'c1-03');
    if (c103 && blockGain > 0) {
        const heartsInDeck = player.deck.filter(c => c.suit === 'hearts').length;
        blockGain = Math.floor(blockGain * (1 + (heartsInDeck * (c103.stars===1?0.02:c103.stars===2?0.05:0.15))));
    }

    // Assassin (4) Execute
    const assassin = activeSynergies.find(s => s.id === 'assassin');
    if (assassin && assassin.activeLevel >= 2 && isSingle && enemy.currentHp <= player.maxHp * 2) {
         trueDamageExt += enemy.currentHp; 
    }

    // Suit Effects
    // (Note: Base game has no suit effects, but we keep the logic for future modifiers)
    
    // RE-CALCULATE EFFECTS BASED ON MODIFIERS ONLY (Per prompt)
    // Apply Modifiers
    player.modifiers.forEach(mod => {
        if (mod.id === 'heart-firewall') {
            selectedHand.cards.filter(c => c.suit === 'hearts').forEach(c => blockGain += c.value);
        }
        if (mod.id === 'club-trojan') {
            poisonStacks += selectedHand.cards.filter(c => c.suit === 'clubs').length;
        }
        if (mod.id === 'diamond-miner') {
            goldGain += selectedHand.cards.filter(c => c.suit === 'diamonds').length * 2;
        }
        if (mod.id === 'high-card-pride') {
            if (selectedHand.cards.length === 1) {
                rawDamage *= 3;
            }
        }
        if (mod.id === 'straight-obsession') {
            if (selectedHand.type === 'Straight' || selectedHand.type === 'Straight Flush') {
                // Handled in enemy intent update
            }
        }
        if (mod.id === 'four-of-a-kind-root') {
             if (selectedHand.type === 'Four of a Kind') {
                 // Handled in player state update
             }
        }
    });

    // Apply to Enemy
    setEnemy(prev => {
      if (!prev) return null;
      let damageDealt = rawDamage;
      
      // 6. Assassin - Single Card Bonus
      const assassinSynergy = activeSynergies.find(s => s.id === 'assassin');
      if (assassinSynergy && assassinSynergy.activeLevel > 0) {
          if (selectedHand.cards.length === 1) {
              // Level 1: Damage x3
              // Level 2: Trigger 3 times (Assume x3 * x3 = x9 for now, or just x3 effects)
              // Let's interpret "Trigger 3 times" as "Score 3 times".
              // If Level 1 is x3, Level 2 is "Trigger 3 times".
              // Does Level 2 REPLACE Level 1? Usually thresholds stack or replace.
              // "Thresholds: [2, 4]".
              // If activeLevel is 2 (4 units), it implies Level 1 is also active?
              // Usually in TFT, higher tier replaces or adds.
              // Description: "(2)... (4)...".
              // Let's assume Level 2 is x9 (x3 from Lv1 * x3 from Lv2? Or just x3 total?)
              // "Trigger 3 times" sounds like x3.
              // If Lv1 is x3, and Lv2 is "Trigger 3 times", maybe Lv2 is just x3 but applies to effects?
              // Let's make Lv1 x3, and Lv2 x9 to be safe/powerful.
              const multiplier = assassinSynergy.activeLevel === 1 ? 3 : 9;
              damageDealt *= multiplier;
          }
      }

      if (prev.intent.type === 'leech') {
          const healAmount = Math.floor(damageDealt * 0.5);
          prev.currentHp = Math.min(prev.maxHp, prev.currentHp + healAmount);
      }

      let currentBlock = prev.block;
      if (currentBlock > 0) {
          if (damageDealt >= currentBlock) {
              damageDealt -= currentBlock;
              currentBlock = 0;
          } else {
              currentBlock -= damageDealt;
              damageDealt = 0;
          }
      }
      // True Damage Piercing
      if (isPiercing) {
          damageDealt = rawDamage; // Skip block deduction completely
          currentBlock = prev.block;
      }
      
      let newHp = Math.max(0, prev.currentHp - damageDealt - trueDamageExt);
      
      // Kill & Overkill Visual Feedbacks
      let killFbs: any[] = [];

      // c1-01 暗巷快刀 Kill Check
      if (newHp <= 0 && isSingle) {
          player.activeTFTCards.forEach((c, idx) => {
             if (c.templateId === 'c1-01') {
                 killFbs.push({ index: idx, text: `杀戮成长`, color: 'text-rose-400', id: Date.now()+idx });
                 c.stats = { ...c.stats, chips: (c.stats?.chips || 0) + (c.stars===1?3:c.stars===2?8:25) };
             }
          });
      }
      // c2-08 赏金猎手 Kill Check
      if (newHp <= 0 && isSingle) {
          player.activeTFTCards.forEach((c, idx) => {
             if (c.templateId === 'c2-08' && Math.random() < [0.2, 0.5, 1][c.stars-1]) {
                 goldGain += 5;
                 killFbs.push({ index: idx, text: `赏金爆金+$5`, color: 'text-amber-400', id: Date.now()+idx });
             }
          });
      }
      // c4-07 血色盛宴 Overkill
      if (newHp <= 0 && damageDealt > prev.currentHp) {
          const overkill = damageDealt - prev.currentHp;
          player.activeTFTCards.forEach((c, idx) => {
             if (c.templateId === 'c4-07') {
                 const amt = Math.floor(overkill * (c.stars===1?0.01:c.stars===2?0.05:0.2));
                 if (amt > 0) {
                     healAmount += amt;
                     killFbs.push({ index: idx, text: `溢出吸血+${amt}`, color: 'text-rose-500', id: Date.now()+idx });
                 }
             }
          });
      }

      if (killFbs.length > 0) {
          setTftFeedbacks(killFbs);
          setTimeout(() => setTftFeedbacks([]), 2500);
      }

      let newIntent = { ...prev.intent };
      if (player.modifiers.some(m => m.id === 'straight-obsession') && (selectedHand.type === 'Straight' || selectedHand.type === 'Straight Flush')) {
          if (newIntent.value && newIntent.value > 0) {
              newIntent.value = Math.floor(newIntent.value * 0.8);
          }
      }

      let newStatusEffects = [...prev.statusEffects];
      if (poisonStacks > 0) {
          const currentPoison = newStatusEffects.find(e => e.type === 'poison');
          if (currentPoison) {
              newStatusEffects = newStatusEffects.map(e => e.type === 'poison' ? { ...e, stacks: e.stacks + poisonStacks } : e);
          } else {
              newStatusEffects.push({ type: 'poison', stacks: poisonStacks });
          }
      }

      return {
        ...prev,
        currentHp: newHp,
        block: currentBlock,
        statusEffects: newStatusEffects,
        intent: newIntent
      };
    });

    // Apply to Player - COMBINED UPDATE
    setPlayer(prev => {
      const playedCardIds = new Set(selectedHand.cards.map(c => c.id));
      const brokenCardIds = new Set(brokenCards.map(c => c.id));
      
      const remainingHand = prev.hand.filter(c => !playedCardIds.has(c.id));
      const newDiscard = [
        ...prev.discardPile, 
        ...selectedHand.cards
          .filter(c => !brokenCardIds.has(c.id))
          .map(c => ({...c, isSelected: false}))
      ];
      
      let handsConsumed = 1;
      if (prev.modifiers.some(m => m.id === 'high-card-pride') && selectedHand.cards.length === 1) {
          handsConsumed = 0;
      }

      let discardsGained = 0;
      if (prev.modifiers.some(m => m.id === 'four-of-a-kind-root') && selectedHand.type === 'Four of a Kind') {
          discardsGained = 2;
      }

      // 逻辑门卫 净化手牌
      let finalHand = remainingHand;
      if (player.activeTFTCards.some(t => t.templateId === 'c1-fortress-geek') && isStraight) {
          finalHand = finalHand.map(c => ({...c, isLocked: false, isHidden: false}));
      }

      // 极客 (4) 内存溢出
      const geek = activeSynergies.find(s => s.id === 'geek');
      if (geek && geek.activeLevel >= 2 && isStraight) {
          handsConsumed = -1; // 恢复1次 = 消耗-1
          discardsGained += 2;
      }

      // 黑客 (4) 同花不耗次数
      const hacker = activeSynergies.find(s => s.id === 'surfer');
      if (hacker && hacker.activeLevel >= 2 && isFlush) {
          handsConsumed = 0;
      }
      if (isFlush && prev.activeTFTCards.some(c => c.templateId === 'c4-05')) {
          handsConsumed = 0;
      }
      
      // c3-03 皇家复制 (黑桃顺子概率把黑桃塞入弃牌堆养牌库)
      const c303 = prev.activeTFTCards.find(c => c.templateId === 'c3-03');
      if (c303 && isStraight && hasSpades && Math.random() < (c303.stars===1?0.2:c303.stars===2?0.5:1)) {
          const spades = selectedHand.cards.filter(c => c.suit === 'spades');
          if (spades.length > 0) newDiscard.push({...spades[Math.floor(Math.random()*spades.length)], id: `clone-${Date.now()}`, isSelected: false});
      }

      // 破壁人 (2): 透支出牌
      let overdraftHp = 0;
      const cheater = activeSynergies.find(s => s.id === 'cheater');
      if (prev.hands <= 0 && cheater && cheater.activeLevel >= 1) {
          handsConsumed = 0; // 不再扣除次数
          overdraftHp = Math.floor(prev.currentHp * 0.15);
      }

      return {
        ...prev,
        currentHp: Math.max(1, Math.min(prev.maxHp + maxHpGain, prev.currentHp + healAmount - selfHpLoss - overdraftHp)),
        maxHp: prev.maxHp + maxHpGain,
        hand: finalHand,
        discardPile: newDiscard,
        pendingCardIds: [],
        hands: prev.hands - handsConsumed,
        handsUsedThisBattle: prev.handsUsedThisBattle + 1,
        discards: prev.discards + discardsGained,
        block: prev.block + blockGain,
        gold: prev.gold + goldGain
      };
    });

    // Final cleanup
    setPlayingCards([]);
    setIsCalculating(false);
    setScoreBreakdown(null);
    setShowTotal(false);
    setDisplayTotal(null);
  };

  // Discard Action
  const discardHand = () => {
    if (player.discards <= 0 || gameStatus !== 'playing' || isCalculating) return;
    
    const selectedCards = player.hand.filter(c => c.isSelected);
    if (selectedCards.length === 0) return;

    // Check for "Deadlock" (Locked cards cannot be discarded)
    if (selectedCards.some(c => c.isLocked)) return;

    // Magician (4): Discarded cards deal True Damage
    const magicianSynergy = activeSynergies.find(s => s.id === 'magician');
    if (magicianSynergy && magicianSynergy.activeLevel >= 2) {
        const damage = selectedCards.reduce((sum, c) => sum + c.value, 0);
        setEnemy(prev => {
            if (!prev) return null;
            return { ...prev, currentHp: Math.max(0, prev.currentHp - damage) };
        });
        // Visual feedback for True Damage
        setFlyingDamage({ amount: damage, isFlying: true });
        setTimeout(() => setFlyingDamage(null), 500);
    }

    setPlayer(prev => {
      // Modifiers: Garbage Collect
      let hpHeal = 0;
      if (prev.modifiers.some(m => m.id === 'garbage-collect')) {
          hpHeal = 3;
      }

      // Modifiers: Memory Overwrite
      let memoryDamage = 0;
      if (prev.modifiers.some(m => m.id === 'memory-overwrite')) {
          memoryDamage = selectedCards.reduce((sum, c) => sum + c.value, 0);
      }

      // Apply Memory Overwrite Damage immediately
      if (memoryDamage > 0) {
          setEnemy(e => e ? { ...e, currentHp: Math.max(0, e.currentHp - memoryDamage) } : null);
      }
      
     // 新版羁绊和卡牌的弃牌逻辑 & 视觉反馈
      let discardPoison = 0;
      let newTftFbs: any[] = [];
      let goldEarned = 0;
      let activeCardsUpdated = [...prev.activeTFTCards];

      // Illusionist (4) 数据劫持
      const illusionist = calculateActiveSynergies(prev.activeTFTCards).find(s => s.id === 'magician');
      if (illusionist && illusionist.activeLevel >= 2) {
          illusionistCacheScore += selectedCards.reduce((acc, c) => acc + c.value, 0);
          setFeedbackTexts([{ id: Date.now(), text: `数据劫持`, color: 'text-purple-400' }]);
          setTimeout(() => setFeedbackTexts([]), 2000);
      }

      activeCardsUpdated = activeCardsUpdated.map((card, idx) => {
          // c2-05 幻影魔术师 (梅花转木马)
          if (card.templateId === 'c2-05') {
              const clubs = selectedCards.filter(c => c.suit === 'clubs').length;
              if (clubs > 0) {
                  discardPoison += clubs * (card.stars === 1 ? 3 : card.stars === 2 ? 8 : 25);
                  newTftFbs.push({ index: idx, text: `病毒转化`, color: 'text-emerald-400', id: Date.now()+idx });
              }
          }
          // c4-08 幻象核心 (弃掉黑桃永久加点数)
          if (card.templateId === 'c4-08') {
              const spades = selectedCards.filter(c => c.suit === 'spades').length;
              if (spades > 0) {
                  newTftFbs.push({ index: idx, text: `幻象成长`, color: 'text-purple-300', id: Date.now()+idx });
              }
          }
          return card;
      });

      if (discardPoison > 0) {
          setEnemy(e => {
             if (!e) return null;
             let newEffects = [...e.statusEffects];
             const p = newEffects.find(ef => ef.type === 'poison');
             if (p) p.stacks += discardPoison;
             else newEffects.push({ type: 'poison', stacks: discardPoison });
             return { ...e, statusEffects: newEffects };
          });
      }

      const selectedIds = new Set(selectedCards.map(c => c.id));
      const remainingHand = prev.hand.filter(c => !selectedIds.has(c.id));

      // 虚空银行家 c3-02 (永久删卡换钱)
      let cardsToDiscard = [...selectedCards.map(c => ({...c, isSelected: false}))];
      const bankerIndex = prev.activeTFTCards.findIndex(c => c.templateId === 'c3-02');
      if (bankerIndex !== -1) {
          const banker = prev.activeTFTCards[bankerIndex];
          const chance = banker.stars === 1 ? 0.15 : banker.stars === 2 ? 0.4 : 1;
          let deleted = 0;
          cardsToDiscard = cardsToDiscard.filter(c => {
              if (Math.random() < chance) { goldEarned += 3; deleted++; return false; }
              return true;
          });
          if (deleted > 0) {
              newTftFbs.push({ index: bankerIndex, text: `虚空删卡+$${deleted*3}`, color: 'text-amber-400', id: Date.now()+bankerIndex });
          }
      }

      // c4-08 点数附加 (应用到 cardsToDiscard)
      const phantom = prev.activeTFTCards.find(c => c.templateId === 'c4-08');
      if (phantom) {
          const bonus = phantom.stars === 1 ? 3 : phantom.stars === 2 ? 8 : 25;
          cardsToDiscard = cardsToDiscard.map(c => c.suit === 'spades' ? { ...c, value: c.value + bonus } : c);
      }

      if (newTftFbs.length > 0) {
          setTftFeedbacks(newTftFbs);
          setTimeout(() => setTftFeedbacks([]), 2000);
      }

      const newDiscard = [...prev.discardPile, ...cardsToDiscard];
      
      // Draw replacements
      const drawCount = selectedCards.length;
      let currentDeck = [...prev.deck];
      let currentDiscard = [...newDiscard];
      let drawnCards: Card[] = [];

      if (currentDeck.length < drawCount) {
         const shuffledDiscard = shuffleDeck(currentDiscard);
         currentDeck = [...currentDeck, ...shuffledDiscard];
         currentDiscard = [];
      }

      const drawResult = drawCards(currentDeck, drawCount);
      drawnCards = drawResult.drawn;
      currentDeck = drawResult.remaining;

      return {
        ...prev,
        currentHp: Math.min(prev.maxHp, prev.currentHp + hpHeal),
        hand: [...remainingHand, ...drawnCards],
        deck: currentDeck,
        discardPile: currentDiscard,
        pendingCardIds: [],
        discards: prev.discards - 1,
        gold: prev.gold + goldEarned,
        activeTFTCards: activeCardsUpdated
      };
    });
  };

  // End Turn
  const endTurn = () => {
    if (gameStatus !== 'playing' || !enemy) return;

    turnTemporaryMult = 0; // 回合结束清空全局临时倍率

    const fortress = activeSynergies.find(s => s.id === 'hearts');
    const trojan = activeSynergies.find(s => s.id === 'clubs');
    const syndicate = activeSynergies.find(s => s.id === 'diamonds');

    // 1. Passive Damage (Poison & Item Thorns)
    let thornsDamage = 0;
    if (player.modifiers.some(m => m.id === 'thorns-protocol')) {
        thornsDamage = Math.floor(player.block / 5) * 2;
    }

    const poisonEffect = enemy.statusEffects.find(e => e.type === 'poison');
    const trojanStacks = poisonEffect ? poisonEffect.stacks : 0;
    const enemyPoisonDamage = trojanStacks; 
    
    // c5-03 凋零 (毒伤暴击)
    let finalPoisonDamage = enemyPoisonDamage;
    const witherCard = player.activeTFTCards.find(c => c.templateId === 'c5-03');
    if (witherCard && Math.random() < (witherCard.stars===1?0.2:witherCard.stars===2?0.5:1)) {
        finalPoisonDamage *= 3;
        setFeedbackTexts(prev => [...prev, { id: Date.now(), text: `毒伤暴击`, color: 'text-emerald-400' }]);
    }

    const totalPassiveDamage = finalPoisonDamage + thornsDamage;

    let currentEnemyHp = Math.max(0, enemy.currentHp - totalPassiveDamage);
    const keepPoison = trojan && trojan.activeLevel >= 2;
    let nextStatusEffects = enemy.statusEffects.map(e => {
        if (e.type === 'poison') {
            return keepPoison ? e : { ...e, stacks: Math.max(0, e.stacks - 1) };
        }
        return e;
    }).filter(e => e.stacks > 0);

    if (currentEnemyHp <= 0) {
        setEnemy(prev => prev ? { ...prev, currentHp: 0, statusEffects: nextStatusEffects } : null);
        return;
    }

    // 2. Enemy Action & 病毒爆发 (Trojan 6)
    const intent = enemy.intent;
    let trojanExploded = false;

    // c4-04 木马母体: 怪物攻击前受木马真实伤害，毒死则取消攻击
    const c404 = player.activeTFTCards.find(c => c.templateId === 'c4-04');
    if (c404 && intent.type === 'attack' && trojanStacks > 0) {
        const preDmg = trojanStacks * (c404.stars===1?1:c404.stars===2?3:10);
        currentEnemyHp = Math.max(0, currentEnemyHp - preDmg);
        setFlyingDamage({ amount: preDmg, isFlying: true });
        if (currentEnemyHp <= 0) {
            intent.type = 'defend';
            intent.value = 0;
        }
    }

    // Trojan (6): 怪物激活意图时引爆所有木马
    if (trojan && trojan.activeLevel >= 3 && trojanStacks > 0) {
        const explosionDamage = trojanStacks * player.maxHp;
        currentEnemyHp = Math.max(0, currentEnemyHp - explosionDamage);
        nextStatusEffects = nextStatusEffects.filter(e => e.type !== 'poison');
        trojanExploded = true;
        setFlyingDamage({ amount: explosionDamage, isFlying: true });
        setFeedbackTexts(prev => [...prev, { id: Date.now()+1, text: `木马引爆!`, color: 'text-emerald-400' }]);
    }

    if (currentEnemyHp <= 0) {
        setEnemy(prev => prev ? { ...prev, currentHp: 0, statusEffects: nextStatusEffects } : null);
        return;
    }

    // 3. Resolve Intent Attack
    let damageToPlayer = 0;
    let blockConsumed = 0;
    let reflectDamage = 0;
    let maxHpGain = 0;
    let goldLost = 0;
    let blockAfterHit = player.block;

    if (intent.type === 'attack') {
        let incomingDamage = intent.value || 0;
        
        // Trojan (2): 木马削减意图伤害
        if (trojan && trojan.activeLevel >= 1) {
            incomingDamage = Math.max(0, incomingDamage - trojanStacks);
        }

        // Fortress (6): 护甲反弹真实伤害
        if (fortress && fortress.activeLevel >= 3) {
            reflectDamage = Math.min(incomingDamage, player.block);
        }

        blockConsumed = Math.min(incomingDamage, blockAfterHit);
        blockAfterHit -= blockConsumed;
        let remainingDmg = incomingDamage - blockConsumed;

        // Syndicate (6): 金币抵挡真实伤害 (1金=3甲)
        if (remainingDmg > 0 && syndicate && syndicate.activeLevel >= 3) {
            const goldNeeded = Math.ceil(remainingDmg / 3);
            if (player.gold >= goldNeeded) {
                goldLost += goldNeeded;
                remainingDmg = 0;
            } else {
                goldLost += player.gold;
                remainingDmg -= player.gold * 3;
            }
        }

        // c3-08: 算力印钞机
        const printCard = player.activeTFTCards.find(c => c.templateId === 'c3-08');
        if (remainingDmg > 0 && printCard && player.gold > goldLost) {
            const ratio = printCard.stars === 1 ? 2 : printCard.stars === 2 ? 5 : 15;
            const availableGold = player.gold - goldLost;
            const goldNeeded = Math.ceil(remainingDmg / ratio);
            if (availableGold >= goldNeeded) {
                goldLost += goldNeeded;
                remainingDmg = 0;
            } else {
                goldLost += availableGold;
                remainingDmg -= availableGold * ratio;
            }
        }

        damageToPlayer = remainingDmg;

        // Fortress (4): 受到真实扣血伤害时，永久加生命上限
        if (damageToPlayer > 0 && fortress && fortress.activeLevel >= 2) {
            maxHpGain += damageToPlayer;
            setFeedbackTexts(prev => [...prev, { id: Date.now()+2, text: `防线增殖 +${damageToPlayer}上限`, color: 'text-fuchsia-400' }]);
        }
    }

    // c3-04 灵魂熔炉: 受到扣血伤害时，当前卡牌永久加基础倍率
    let activeCardsUpdatedForHit = [...player.activeTFTCards];
    if (damageToPlayer > 0) {
        activeCardsUpdatedForHit = activeCardsUpdatedForHit.map(c => {
            if (c.templateId === 'c3-04') {
                return { ...c, stats: { ...c.stats, mult: (c.stats?.mult || 0) + (c.stars===1?1:c.stars===2?3:10) } };
            }
            return c;
        });
    }

    if (reflectDamage > 0) {
        currentEnemyHp = Math.max(0, currentEnemyHp - reflectDamage);
        setFeedbackTexts(prev => [...prev, { id: Date.now()+3, text: `荆棘反弹`, color: 'text-rose-400' }]);
    }

    // Apply Enemy Updates
    setEnemy(prev => {
        if (!prev) return null;
        let blockGain = intent.type === 'defend' ? (intent.value || 0) : 0;
        return {
            ...prev,
            currentHp: currentEnemyHp,
            block: prev.block + blockGain,
            statusEffects: nextStatusEffects
        };
    });

    if (intent.type === 'attack') {
        setPlayerDamageTaken(damageToPlayer);
        setPlayerBlockTaken(blockConsumed);
        setPlayerHitState('hit');
        setTimeout(() => setPlayerHitState('idle'), 500);
    }

    // 4. Reset Player State & Draw
    setPlayer(prev => {
        let newHp = prev.currentHp;
        let newHand = [...prev.hand];
        let newDeck = [...prev.deck];

        if (intent.type === 'attack') newHp -= damageToPlayer;
        if (intent.type === 'lock') {
            const count = intent.value || 1;
            const avail = newHand.map((_, i) => i).filter(i => !newHand[i].isLocked);
            avail.sort(() => Math.random() - 0.5).slice(0, count).forEach(idx => {
                newHand[idx] = { ...newHand[idx], isLocked: true, isSelected: false };
            });
        }
        if (intent.type === 'blind') {
            const count = intent.value || 3;
            const avail = newHand.map((_, i) => i).filter(i => !newHand[i].isHidden);
            avail.sort(() => Math.random() - 0.5).slice(0, count).forEach(idx => {
                newHand[idx] = { ...newHand[idx], isHidden: true };
            });
        }
        if (intent.type === 'junk') {
            const count = intent.value || 2;
            for (let i = 0; i < count; i++) {
                newDeck.push({ id: `junk-${Date.now()}-${i}`, suit: 'spades', rank: '2', value: 0, isSelected: false, isJunk: true });
            }
            newDeck = shuffleDeck(newDeck);
        }

        const newDiscard = [...prev.discardPile, ...newHand.map(c => ({...c, isSelected: false, isLocked: false, isHidden: false}))];
        let currentDeck = [...newDeck];
        let currentDiscard = [...newDiscard];

        if (currentDeck.length < 8) {
            const shuffledDiscard = shuffleDeck(currentDiscard);
            currentDeck = [...currentDeck, ...shuffledDiscard];
            currentDiscard = [];
        }

        const { drawn, remaining } = drawCards(currentDeck, 8);
        
        let baseDiscards = 3;
        const magician = activeSynergies.find(s => s.id === 'magician');
        if (magician && magician.activeLevel >= 1) baseDiscards += 2;

        // Fortress (2/4/6) 护甲保留
        let retainRate = 0;
        if (fortress) {
            if (fortress.activeLevel === 1) retainRate = 0.3;
            if (fortress.activeLevel === 2) retainRate = 0.7;
            if (fortress.activeLevel >= 3) retainRate = 1.0;
        }
        // c5-04 神创堡垒绝对保留
        if (prev.activeTFTCards.some(c => c.templateId === 'c5-04')) retainRate = 1.0;
        
        const retainedBlock = Math.floor(blockAfterHit * retainRate);

        return {
            ...prev,
            currentHp: Math.max(0, newHp),
            maxHp: prev.maxHp + maxHpGain,
            hand: drawn,
            deck: remaining,
            discardPile: currentDiscard,
            pendingCardIds: [],
            hands: 3,
            discards: baseDiscards,
            block: retainedBlock,
            gold: prev.gold - goldLost,
            activeTFTCards: activeCardsUpdatedForHit
        };
    });

    generateNextIntent();
  };

  const generateNextIntent = () => {
      setEnemy(prev => {
          if (!prev) return null;
          
          // Simple AI based on Tier
          const r = Math.random();
          let type: IntentType = 'attack';
          let value = 0;
          let desc = '';

          if (prev.tier === 1) {
              // 80% Attack, 20% Defend
              if (r < 0.8) { type = 'attack'; value = 15; desc = '猛击'; }
              else { type = 'defend'; value = 10; desc = '铁壁'; }
          } else if (prev.tier === 2) {
              // Ransomworm / Cryptomancer logic
              if (prev.name.includes('勒索')) {
                  // Lock or Attack
                  if (r < 0.4) { type = 'lock'; value = 2; desc = '死锁'; }
                  else { type = 'attack'; value = 20; desc = '重击'; }
              } else {
                  // Blind or Attack
                  if (r < 0.4) { type = 'blind'; value = 3; desc = '致盲'; }
                  else { type = 'attack'; value = 15; desc = '攻击'; }
              }
          } else {
              // Boss
              if (r < 0.3) { type = 'junk'; value = 3; desc = '注入垃圾'; }
              else if (r < 0.6) { type = 'leech'; value = 0; desc = '吸血诅咒'; }
              else { type = 'attack'; value = 25; desc = '毁灭打击'; }
          }

          return {
              ...prev,
              intent: { type, value, description: desc }
          };
      });
  };

  if (!enemy) return <div className="flex items-center justify-center h-screen bg-black text-white">加载中...</div>;

  return (
    <div className="w-full h-[100dvh] bg-slate-950 text-slate-200 font-sans overflow-hidden flex flex-col relative">
      
      {/* Top Bar */}
      <header className="shrink-0 h-12 px-3 flex justify-between items-center bg-slate-900/50 border-b border-white/5 backdrop-blur-xl z-20">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all z-10 relative"
        >
          <Menu size={18} />
        </button>
        
        <div className="absolute left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 tracking-[0.1em] uppercase font-bold">
          系统节点_等级_{level}
        </div>
      </header>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 left-3 w-56 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
          >
            <button 
              onClick={() => { setActiveModal('guide'); setShowMenu(false); }}
              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 text-left text-xs font-medium text-slate-300 border-b border-white/5 transition-colors"
            >
              <HelpCircle size={14} className="text-blue-400" />
              新手快速入门
            </button>
            <button 
              onClick={() => { setActiveModal('poker'); setShowMenu(false); }}
              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 text-left text-xs font-medium text-slate-300 border-b border-white/5 transition-colors"
            >
              <BookOpen size={14} className="text-emerald-400" />
              牌型与伤害科普
            </button>
            <button 
              onClick={() => { setActiveModal('rogue'); setShowMenu(false); }}
              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 text-left text-xs font-medium text-slate-300 border-b border-white/5 transition-colors"
            >
              <Info size={14} className="text-amber-400" />
              肉鸽效果与玩法
            </button>
            <button 
              onClick={() => { setActiveModal('deck'); setShowMenu(false); }}
              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 text-left text-xs font-medium text-slate-300 border-b border-white/5 transition-colors"
            >
              <Activity size={14} className="text-slate-400" />
              查看当前牌库
            </button>
            <button 
              onClick={() => { setActiveModal('mechanics'); setShowMenu(false); }}
              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 text-left text-xs font-medium text-amber-400 bg-amber-500/10 transition-colors"
            >
              <Layers size={14} />
              系统机制百科
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {activeModal === 'poker' ? '牌型与伤害科普' : activeModal === 'rogue' ? '肉鸽效果与玩法' : activeModal === 'guide' ? '新手快速入门' : activeModal === 'mechanics' ? '系统机制百科' : '当前牌库'}
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto text-xs text-slate-400 space-y-6 font-sans">
                {activeModal === 'guide' && (
                  <div className="space-y-4">
                    <section>
                      <h4 className="text-blue-400 font-bold mb-2 uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Zap size={12} /> 核心玩法
                      </h4>
                      <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-black text-xs">1</div>
                          <p className="leading-relaxed">从手牌中选择 1-5 张牌，凑成特定的<b>扑克牌型</b>打出，对怪物造成伤害。</p>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-black text-xs">2</div>
                          <p className="leading-relaxed"><b>花色本身没有效果</b>，除非你获得了特定的<b>构筑词条</b>（如红桃防火墙）。</p>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-black text-xs">3</div>
                          <p className="leading-relaxed">每回合有有限的<b>出牌次数</b>和<b>弃牌次数</b>。弃牌可以帮你过滤手牌，寻找大牌。</p>
                        </div>
                      </div>
                    </section>
                  </div>
                )}
                {activeModal === 'poker' && (
                  <div className="space-y-4">
                    <section>
                      <h4 className="text-blue-400 font-bold mb-2 uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Activity size={12} /> 伤害计算公式
                      </h4>
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-[10px] space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">基础分:</span>
                          <span className="text-white">牌型固定分 (如同花 35)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">点数分:</span>
                          <span className="text-white">所选牌点数之和 (A=11, JQK=10)</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 mt-1.5 pt-1.5">
                          <span className="text-emerald-400 font-bold">最终伤害:</span>
                          <span className="text-emerald-400 font-bold">(基础 + 点数) × 牌型倍率</span>
                        </div>
                      </div>
                    </section>
                    <section>
                      <h4 className="text-blue-400 font-bold mb-3 uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <BookOpen size={12} /> 牌型图鉴
                      </h4>
                      <div className="space-y-3">
                        {TUTORIAL_HANDS_EXAMPLES.map((hand, i) => (
                          <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-black text-[10px]">{hand.name}</span>
                              <span className="text-rose-400 font-mono text-[9px] bg-rose-400/10 px-1.5 py-0.5 rounded-full">{hand.score}</span>
                            </div>
                            <div className="flex gap-1 mb-2">
                               {hand.cards.map((c, ci) => (
                                 <TutorialCard key={ci} rank={c.rank} suit={c.suit as any} />
                               ))}
                            </div>
                            <p className="text-[9px] text-slate-500 leading-relaxed">{hand.desc}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
                {activeModal === 'rogue' && (
                  <div className="space-y-4">
                    <section>
                      <h4 className="text-amber-400 font-bold mb-2 uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Sparkles size={12} /> 构筑词条 (修正符)
                      </h4>
                      <p className="leading-relaxed">击败怪物后，你将获得<b>“词条”</b>。这是你变强的唯一途径。例如“红桃防火墙”让红桃牌提供护甲，“梅花木马”让梅花牌施加中毒。</p>
                    </section>
                    <section>
                      <h4 className="text-amber-400 font-bold mb-3 uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Skull size={12} /> 怪物威胁图鉴
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {MONSTER_ABILITIES.map((ability, i) => (
                          <div key={i} className="bg-black/20 p-3 rounded-xl border border-white/5 flex gap-3 items-center">
                            <div className="shrink-0 scale-75 origin-left">
                              {ability.example}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                {ability.icon}
                                <span className="text-white font-bold text-[10px]">{ability.name}</span>
                              </div>
                              <p className="text-[9px] text-slate-500 leading-relaxed">{ability.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
                {activeModal === 'mechanics' && (
                  <div className="space-y-4 font-sans text-xs">
                    <section className="bg-black/30 p-3 rounded-xl border border-white/5">
                      <h4 className="text-amber-400 font-bold mb-2 uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Coins size={12} /> 经济与利息系统
                      </h4>
                      <p className="leading-relaxed text-slate-300">
                        击败怪物会获得基础金币。如果你保留金币不花，**每拥有 10 金币，下回合就会产生 1 金币的利息**（利息上限为 5 金币/回合，即 50 存款吃满）。<br/><br/>
                        <span className="text-amber-500/80">提示：前期适当存钱吃利息，是后期能疯狂D牌的关键。</span>
                      </p>
                    </section>
                    
                    <section className="bg-black/30 p-3 rounded-xl border border-white/5">
                      <h4 className="text-blue-400 font-bold mb-2 uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Layers size={12} /> 等级、上场位与备战席
                      </h4>
                      <div className="space-y-2 text-slate-300">
                        <p><b>玩家等级 (LEVEL)：</b>最高上限为 <span className="text-emerald-400 font-bold">6级</span>。等级可以通过花费金币购买经验来提升。</p>
                        <p><b>上场位 (ACTIVE)：</b>等同于你的当前等级。1级只能上阵1张卡片，<span className="text-emerald-400 font-bold">满级6级最多同时上阵6张卡</span>。只有在场上的卡片才能为你提供【羁绊】和【属性加成】。</p>
                        <p><b>备战席 (BENCH)：</b>固定拥有 6 个空位。你可以把商店买来的卡先放在这里。如果备战席和场上凑齐了 <span className="text-amber-400 font-bold">3张同星级、同名的卡</span>，它们会自动合成一张更高星级的卡（属性翻倍）！</p>
                      </div>
                    </section>

                    <section className="bg-black/30 p-3 rounded-xl border border-white/5">
                      <h4 className="text-purple-400 font-bold mb-2 uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Star size={12} /> 羁绊是如何生效的？
                      </h4>
                      <p className="leading-relaxed text-slate-300">
                        每张商店购买的卡片都有左侧的“颜色条”和名字下方的“标签”。当你把它们拖到【上场位】时，会自动激活对应的职业/花色羁绊。<br/>
                        比如：场上有两张带有【锋刃】标签的卡，就会激活“2锋刃”效果（全局伤害增加）。点击左侧羁绊栏可以随时查看生效加成。
                      </p>
                    </section>
                  </div>
                )}
                {activeModal === 'deck' && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {[...player.deck, ...player.hand, ...player.discardPile].sort((a,b) => a.value - b.value).map((c, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 scale-90">
                        <TutorialCard rank={c.rank} suit={c.suit} isGlass={c.isGlass} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col min-h-0 relative z-10">
        
        {/* Enemy Section */}
        <section className={`shrink-0 px-3 py-2 flex items-center justify-between gap-3 bg-slate-900/30 border-b border-white/5 backdrop-blur-sm ${showShop ? 'hidden' : ''}`}>
            {/* Enemy Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0 relative">
                {enemyHitState === 'hit' && (
                    <motion.div 
                        initial={{ opacity: 1, y: 0, scale: 0.5 }}
                        animate={{ opacity: 0, y: -40, scale: 2.5 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute -top-4 left-6 z-[100] text-4xl font-black text-rose-500 drop-shadow-[0_0_15px_rgba(225,29,72,1)] pointer-events-none"
                    >
                        -{displayTotal || 0}
                    </motion.div>
                )}
                <motion.div 
                    animate={enemyHitState === 'hit' ? { 
                        x: [-5, 5, -5, 5, 0], 
                        y: [-2, 2, -2, 2, 0],
                        backgroundColor: ['#1e293b', '#9f1239', '#1e293b'] 
                    } : {}}
                    transition={{ duration: 0.4 }}
                    className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 shadow-xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors" />
                    <Skull size={20} className="text-rose-400 relative z-10" />
                </motion.div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                        <h2 className="text-sm font-bold text-white truncate tracking-tight">{enemy.name}</h2>
                        <span className="text-[10px] font-mono text-rose-400 font-bold">{enemy.currentHp}/{enemy.maxHp}</span>
                    </div>
                    {/* HP Bar */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden w-full">
                        <motion.div 
                            className="h-full bg-rose-500 rounded-full"
                            initial={{ width: '100%' }}
                            animate={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }}
                        />
                    </div>
                    {/* Status Effects */}
                    <div className="flex gap-1 mt-1.5 h-3.5">
                        {enemy.block > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] px-1 py-0 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 font-bold"><Shield size={8} />{enemy.block}</span>
                        )}
                        {enemy.statusEffects.map((e, i) => (
                            <span key={i} className="flex items-center gap-0.5 text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-bold">
                                {e.type === 'poison' && <Skull size={8} />} {e.stacks}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enemy Intent */}
            <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-white/5 shadow-lg">
                    <span className="text-xs font-bold text-white">{enemy.intent.value}</span>
                    {enemy.intent.type === 'attack' && <Sword size={14} className="text-rose-400" />}
                    {enemy.intent.type === 'defend' && <Shield size={14} className="text-blue-400" />}
                    {enemy.intent.type === 'lock' && <Lock size={14} className="text-amber-400" />}
                    {enemy.intent.type === 'blind' && <EyeOff size={14} className="text-slate-400" />}
                    {enemy.intent.type === 'junk' && <Trash2 size={14} className="text-emerald-400" />}
                    {enemy.intent.type === 'leech' && <Droplet size={14} className="text-rose-500" />}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-bold">{enemy.intent.description}</span>
            </div>
        </section>

        {/* Unified Top Row: Jokers and Consumables */}
        <section className="shrink-0 px-4 py-2 flex justify-center bg-slate-900/90 border-b border-white/10 backdrop-blur-2xl z-50 shadow-2xl">
            <div className="relative flex items-center bg-black/40 p-2 rounded-2xl border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] w-full max-w-2xl min-h-[48px]">
                
                {/* Empty State Background Hint (当且仅当全空时显示) */}
                {player.modifiers.length === 0 && player.consumables.length === 0 && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                             <Sparkles size={12}/> 暂无词条与道具 <Zap size={12}/>
                         </span>
                     </div>
                )}
                
                <div className="flex w-full items-center justify-between px-1 z-10">
                    {/* Jokers Area (Left) */}
                    <div className="flex items-center gap-3">
                        {player.modifiers.length > 0 && (
                            <div className="flex items-center gap-1.5 shrink-0 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                                <Sparkles size={12} className="text-amber-400" />
                                <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-widest">词条</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                            <AnimatePresence>
                                {player.modifiers.map(modifier => (
                                    <motion.div 
                                        key={modifier.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        whileHover={{ y: -4, zIndex: 50, scale: 1.1 }}
                                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-amber-500/50 shadow-lg flex items-center justify-center relative cursor-help group shrink-0"
                                    >
                                        <div className="text-amber-400 text-[11px] font-black">{modifier.name[0]}</div>
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 border border-white/20 px-3 py-2 rounded-xl text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-[100] pointer-events-none transition-all border-t-amber-500 shadow-xl">
                                            <div className="font-black text-amber-400 mb-0.5 text-xs">{modifier.name}</div>
                                            <div className="text-slate-400 text-[8px] whitespace-normal w-32 leading-relaxed">{modifier.description}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Consumables Area (Right) */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            <AnimatePresence>
                                {player.consumables.map((item, i) => (
                                    <motion.div 
                                        key={`cons-${i}`}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        className="w-8 h-8 rounded-lg bg-slate-800 border border-emerald-500/50 flex items-center justify-center cursor-pointer shadow-lg relative group shrink-0"
                                    >
                                        <div className="text-emerald-400 text-[10px] font-black">{item.name[0]}</div>
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 border border-white/20 px-3 py-1.5 rounded-xl text-[9px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-[100] pointer-events-none shadow-xl border-t-emerald-500">
                                            {item.name}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        {player.consumables.length > 0 && (
                            <div className="flex items-center gap-1.5 shrink-0 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                                <Zap size={12} className="text-emerald-400" />
                                <span className="text-[9px] font-black text-emerald-400/80 uppercase tracking-widest">道具</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>

        {/* Center Field - Buffer Zone */}
        <div className={`flex-1 flex-col items-center justify-center relative px-4 py-2 transition-all duration-500 ${(isCalculating || showTotal) ? 'z-[100]' : 'z-30'} ${showShop ? 'hidden' : 'flex'}`}>
            {/* Scoring Header */}
            <AnimatePresence>
                {isCalculating && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-0 flex flex-col items-center gap-1 z-50"
                    >
                        <div className="text-xs font-black text-white uppercase tracking-[0.4em] drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                            {selectedHand ? HAND_TYPE_NAMES[selectedHand.type] : '计算中...'}
                        </div>
                        <div className="h-0.5 w-12 bg-gradient-to-r from-blue-500 to-rose-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                <div className="w-6 h-px bg-slate-800" />
                待发区 / BUFFER
                <div className="w-6 h-px bg-slate-800" />
            </div>
            
            <div className="flex gap-2 sm:gap-4 items-center justify-center w-full max-w-2xl h-28 sm:h-36 md:h-48 relative z-40">
                {/* Score Equation Overlay during calculation - Sleek Cyber-Pill */}
                <AnimatePresence>
                    {isCalculating && (
                        <motion.div 
                            initial={{ opacity: 0, y: 15, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.9 }}
                            className="absolute -top-10 sm:-top-14 flex items-center z-50 bg-slate-950/90 backdrop-blur-2xl rounded-2xl border border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.3)] px-1 py-1"
                        >
                            <div className="flex items-center gap-4 px-5 py-2.5 sm:px-8">
                                <div className="flex flex-col items-start">
                                    <span className="text-[7px] font-black text-blue-400/60 uppercase tracking-widest">筹码 / CHIPS</span>
                                    <motion.span 
                                        animate={{ scale: chipsPulse ? 1.1 : 1 }}
                                        className="text-2xl sm:text-4xl font-black font-mono text-blue-400 leading-none tracking-tighter"
                                    >
                                        {displayChips}
                                    </motion.span>
                                </div>
                                
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10">
                                    <span className="text-slate-400 text-xl font-black italic">×</span>
                                </div>
                                
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] font-black text-rose-400/60 uppercase tracking-widest">倍率 / MULT</span>
                                    <motion.span 
                                        animate={{ scale: multPulse ? 1.1 : 1 }}
                                        className="text-2xl sm:text-4xl font-black font-mono text-rose-500 leading-none tracking-tighter"
                                    >
                                        {displayMult}
                                    </motion.span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/*羁绊文字反馈 (全局居中且绝对位于最上层)*/}
                <AnimatePresence>
                    {feedbackTexts.length > 0 && (
                        <div className="absolute -top-16 sm:-top-24 left-1/2 -translate-x-1/2 flex flex-col gap-1.5 z-[200] pointer-events-none items-center w-max">
                            {feedbackTexts.map(fb => (
                                <motion.div
                                    key={fb.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1.1 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`text-sm sm:text-xl font-black ${fb.color} drop-shadow-[0_0_15px_currentColor] bg-black/90 px-5 py-1.5 rounded-full border border-white/20`}
                                >
                                    {fb.text}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                {[0, 1, 2, 3, 4].map((slotIndex) => {
                    const card = currentBufferCards[slotIndex];
                    const isActive = activeCardIndex === slotIndex;

                    return (
                        <div 
                            key={slotIndex}
                            className={`
                                w-16 h-24 sm:w-24 sm:h-32 md:w-32 md:h-44 rounded-xl border-2 border-dashed border-white/5 bg-white/2 flex items-center justify-center relative transition-all duration-300
                                ${isActive ? 'border-blue-500/50 bg-blue-500/5 z-[60]' : 'z-10'}
                            `}
                        >
                            <AnimatePresence mode="popLayout">
                                {card && (
                                    <motion.div
                                        key={card.id}
                                        layoutId={card.id}
                                        animate={{ 
                                            scale: isActive ? 1.1 : 1,
                                            filter: isActive ? 'brightness(1.2)' : 'brightness(1)',
                                        }}
                                        className="relative w-full h-full"
                                    >
                                        <CardComponent 
                                            card={{...card, isSelected: false}} 
                                            onClick={() => !isCalculating && toggleCardSelection(card.id)}
                                            noRotation={true}
                                            disabled={isCalculating && !isActive}
                                            className="!w-full !h-full"
                                        />
                                        
                                        {/* Floating Score per card */}
                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, y: -50, scale: 1.2 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute top-0 left-1/2 -translate-x-1/2 text-xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,1)] whitespace-nowrap z-[70]"
                                                >
                                                    +{card.value}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        </motion.div>
                                )}
                            </AnimatePresence>
                            {!card && (
                                <div className="text-[10px] font-mono text-slate-800 font-black uppercase">槽位 {slotIndex + 1}</div>
                            )}
                        </div>
                    );
                })}

                {/* Total Score Settlement Popup - Sleek Hacker Dialog */}
                <AnimatePresence>
                    {showTotal && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center z-[150] pointer-events-none px-4"
                        >
                            {/* Dimmed Backdrop */}
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                                className="relative w-full max-w-md bg-slate-950 border border-blue-500/30 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8),0_0_40px_rgba(59,130,246,0.1)] overflow-hidden"
                            >
                                {/* Header Bar */}
                                <div className="bg-blue-500/10 border-b border-blue-500/20 px-6 py-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">结算报告 / SETTLEMENT</span>
                                    </div>
                                    <span className="text-[8px] font-mono text-slate-500">ID: NODE_IMPACT_0x7F</span>
                                </div>

                                {/* Content Area */}
                                <div className="p-8 flex flex-col items-center">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-4">
                                        最终造成伤害
                                    </div>

                                    <motion.div 
                                        animate={{ 
                                            scale: [1, 1.05, 1],
                                            textShadow: ["0 0 20px rgba(59,130,246,0)", "0 0 40px rgba(59,130,246,0.4)", "0 0 20px rgba(59,130,246,0)"]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-7xl sm:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                                    >
                                        {displayTotal}
                                    </motion.div>

                                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-8" />

                                    <div className="grid grid-cols-2 gap-8 w-full">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] text-slate-500 uppercase font-black mb-1">系统状态</span>
                                            <span className="text-[10px] text-emerald-400 font-bold">过载成功</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] text-slate-500 uppercase font-black mb-1">节点反馈</span>
                                            <span className="text-[10px] text-blue-400 font-bold">已摧毁</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Decoration */}
                                <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 飞行伤害炮弹 */}
                <AnimatePresence>
                    {flyingDamage && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5, y: 0 }}
                            animate={{ opacity: 1, scale: 1.5, y: -200 }} 
                            transition={{ duration: 0.25, ease: "easeIn" }}
                            className="absolute inset-0 flex items-center justify-center z-[70] pointer-events-none"
                        >
                            <div className="text-6xl font-black text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,1)] italic">
                                {flyingDamage.amount}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* TFT Tactical Board Area */}
        <section className={`shrink-0 px-4 py-1.5 bg-slate-900/80 border-t border-white/10 backdrop-blur-2xl relative overflow-visible ${isCalculating || tftFeedbacks.length > 0 ? 'z-[150]' : 'z-40'}`}>
            {/* Background Grid Effect */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
            
            <div className="flex gap-4 relative z-10">
                {/* Left Side: Synergy Panel (TFT Style) */}
                <div className="flex flex-col gap-1 w-24 shrink-0 border-r border-white/5 pr-2 overflow-y-auto max-h-32 scrollbar-none">
                    <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">羁绊 / SYNERGY</span>
                    <div className="flex flex-col gap-1">
                        {activeSynergies.filter(s => s.currentCount > 0).map(syn => (
                            <div key={syn.id} className="group relative cursor-help">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-4 h-5 rounded-sm flex items-center justify-center text-[8px] font-black transition-transform group-hover:scale-110 ${
                                        syn.activeLevel > 0 ? 'bg-amber-500 text-slate-950 shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'bg-slate-800 text-slate-500'
                                    }`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                                        {syn.currentCount}
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className={`text-[7px] font-bold truncate ${syn.activeLevel > 0 ? 'text-white' : 'text-slate-500'}`}>{syn.name.split(' ')[0]}</span>
                                        <div className="flex gap-0.5 mt-0.5">
                                            {syn.thresholds.map((t, i) => (
                                                <div key={i} className={`w-1 h-1 rounded-full ${syn.currentCount >= t ? 'bg-amber-500' : 'bg-slate-700'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* Tooltip */}
                                <div className="absolute left-full top-0 ml-2 w-40 bg-slate-900 border border-white/10 p-2 rounded-lg shadow-xl z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                    <div className="text-[9px] font-bold text-white mb-1">{syn.name}</div>
                                    <div className="text-[8px] text-slate-400 leading-tight">{syn.description}</div>
                                    <div className="mt-1 flex gap-1 text-[7px] text-slate-500">
                                        {syn.thresholds.map(t => (
                                            <span key={t} className={syn.currentCount >= t ? 'text-amber-400' : ''}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {activeSynergies.every(s => s.currentCount === 0) && (
                            <div className="text-[7px] text-slate-600 italic px-1">无激活羁绊</div>
                        )}
                    </div>
                </div>

                {/* Right Side: Board & Bench */}
                <div className="flex-1 flex flex-col gap-2">
                    {/* Active Field (Sockets) */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                <Layers size={8} /> 上场位 / ACTIVE
                            </span>
                            <span className="text-[7px] text-slate-500 font-mono">{player.activeTFTCards.length}/{player.level}</span>
                        </div>
                        <div className={`flex gap-1.5 justify-start p-1 rounded-lg transition-colors flex-wrap ${isSelling ? 'bg-rose-950/40 border border-rose-500/30' : 'border border-transparent'}`}>
                            {Array.from({ length: player.level }).map((_, i) => (
                                <motion.div 
                                    key={i} 
                                    onClick={() => {
                                        if (!showShop) return; // 战斗期间锁定点击
                                        if (!player.activeTFTCards[i]) return;
                                        if (isSelling) handleSellCard('active', i);
                                        else moveActiveToBench(i);
                                    }}
                                    whileHover={showShop ? { scale: 1.05, y: -2 } : {}}
                                   className={`
                                        w-9 h-12 rounded-lg border flex flex-col items-center justify-center shrink-0 relative transition-all duration-300 overflow-visible
                                        ${showShop ? 'cursor-pointer' : 'cursor-default'}
                                        ${player.activeTFTCards[i] 
                                            ? (isSelling ? 'bg-rose-900 border-rose-500 shadow-lg shadow-rose-900/50' : 'bg-slate-800 border-blue-500/40 shadow-lg') 
                                            : 'bg-black/40 border-white/5 border-dashed hover:border-white/20'}
                                    `}
                                >
                                    {player.activeTFTCards[i] && isSelling && (
                                        <div className="absolute inset-0 rounded-lg bg-rose-500/20 flex items-center justify-center z-20 pointer-events-none overflow-hidden">
                                            <span className="text-[10px] font-black text-white drop-shadow-md">出售</span>
                                        </div>
                                    )}
                                    {player.activeTFTCards[i] ? (
                                        <>
                                            <div className="text-blue-400 text-[7px] font-black text-center leading-tight px-0.5 truncate w-full">
                                                {player.activeTFTCards[i].name}
                                            </div>
                                            <div className="flex gap-0.5 mt-0.5">
                                                {Array.from({ length: player.activeTFTCards[i].stars }).map((_, j) => (
                                                    <Star key={j} size={4} className="fill-amber-400 text-amber-400" />
                                                ))}
                                            </div>
                                            {/* 插槽卡牌专属视觉反馈 */}
                                            <AnimatePresence>
                                                {tftFeedbacks.filter(f => f.index === i).map(fb => (
                                                    <motion.div
                                                        key={fb.id}
                                                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, y: -35, scale: 1.3 }}
                                                        exit={{ opacity: 0, y: -55 }}
                                                        className={`absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[14px] font-black ${fb.color} drop-shadow-[0_0_12px_currentColor] z-[200] pointer-events-none`}
                                                    >
                                                        {fb.text}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </>
                                    ) : (
                                        <div className="text-slate-800"><Layers size={10} /></div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Bench (Holding Area) */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Archive size={8} /> 备战席 / BENCH
                            </span>
                            <span className="text-[7px] text-slate-500 font-mono">{player.benchTFTCards.length}/6</span>
                        </div>
                        <div className={`flex gap-1.5 p-1 rounded-lg transition-colors border flex-wrap ${isSelling ? 'bg-rose-950/40 border-rose-500/30' : 'bg-black/40 border-white/5'}`}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <motion.div 
                                    key={i} 
                                    onClick={() => {
                                        if (!showShop) return; // 战斗期间锁定点击
                                        if (!player.benchTFTCards[i]) return;
                                        if (isSelling) handleSellCard('bench', i);
                                        else moveBenchToActive(i);
                                    }}
                                    className={`
                                        w-7 h-9 rounded-md flex items-center justify-center shrink-0 transition-all border overflow-hidden relative
                                        ${showShop ? 'cursor-pointer' : 'cursor-default'}
                                        ${player.benchTFTCards[i] 
                                            ? (isSelling ? 'bg-rose-900 border-rose-500' : 'bg-slate-800 border-white/10') 
                                            : 'bg-slate-900/20 border-transparent'}
                                    `}
                                >
                                    {player.benchTFTCards[i] && isSelling && (
                                        <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center z-20 pointer-events-none">
                                            <Trash2 size={10} className="text-white drop-shadow-md" />
                                        </div>
                                    )}
                                    {player.benchTFTCards[i] ? (
                                        <div className="flex flex-col items-center">
                                            <div className="text-slate-400 text-[7px] font-bold">{player.benchTFTCards[i].name[0]}</div>
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: player.benchTFTCards[i].stars }).map((_, j) => (
                                                    <Star key={j} size={3} className="fill-slate-600 text-slate-600" />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-900"><Archive size={8} /></div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- DYNAMIC BOTTOM AREA (SHOP OR COMBAT) --- */}
        {!showShop && (
            <div className="flex flex-col relative w-full">
                {/* Player Controls & Stats Section (with Left Level Block) */}
                <div className="shrink-0 relative z-30 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 pt-2 pb-1 px-3 flex gap-3">
                    
                    {/* Left: Level Block */}
                    <div className="w-16 shrink-0 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner py-1">
                        <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">LEVEL</div>
                        <div className="text-2xl font-black text-emerald-400 leading-none mt-1 mb-1">{player.level}</div>
                        <div className="w-full px-2 mb-1">
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-emerald-500" 
                                    initial={{ width: 0 }} 
                                    animate={{ width: player.level === 9 ? '100%' : `${(player.currentExp / player.maxExp) * 100}%` }} 
                                />
                            </div>
                        </div>
                        <div className="text-[7px] text-emerald-500/60 font-mono mb-0.5">
                            {player.level === 9 ? 'MAX' : `${player.currentExp}/${player.maxExp}`}
                        </div>
                    </div>

                    {/* Right: Controls & Stats */}
                    <div className="flex-1 flex flex-col justify-between">
                        {/* Action Buttons */}
                        <div className="grid grid-cols-4 gap-2 mb-1">
                            <button
                                onClick={playHand}
                                disabled={!selectedHand || (player.hands <= 0 && !(activeSynergies.find(s => s.id === 'cheater')?.activeLevel >= 1)) || isCalculating}
                                className={`
                                    col-span-2 py-1.5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all
                                    flex items-center justify-center gap-2 shadow-lg
                                    ${selectedHand && (player.hands > 0 || (activeSynergies.find(s => s.id === 'cheater')?.activeLevel >= 1)) && !isCalculating
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' 
                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'}
                                `}
                            >
                                <Play size={10} fill="currentColor" /> 出牌
                            </button>

                            <button
                                onClick={discardHand}
                                disabled={player.discards <= 0 || isCalculating}
                                className={`
                                    col-span-1 py-1.5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all
                                    flex items-center justify-center gap-2 border
                                    ${player.discards > 0 && !isCalculating
                                        ? 'bg-slate-900 text-rose-400 border-rose-500/20 hover:bg-rose-500/10' 
                                        : 'bg-slate-900/50 text-slate-700 border-transparent cursor-not-allowed'}
                                `}
                            >
                                <RefreshCw size={10} /> 弃牌
                            </button>

                            <button
                                onClick={endTurn}
                                disabled={isCalculating}
                                className="col-span-1 py-1.5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border border-white/5 bg-slate-800 text-slate-400 hover:bg-rose-900/20 hover:text-rose-400"
                            >
                                <Activity size={10} /> 结束
                            </button>
                        </div>

                        {/* Player Stats Bar */}
                        <motion.div 
                            animate={playerHitState === 'hit' ? { 
                                x: [-3, 3, -3, 3, 0], 
                                backgroundColor: ['#00000033', '#9f1239', '#00000033'] 
                            } : {}}
                            transition={{ duration: 0.4 }}
                            className="px-3 py-1 flex justify-between items-center bg-black/30 rounded-lg border border-white/5 mb-1 relative"
                        >
                            {playerHitState === 'hit' && (
                                <motion.div 
                                    initial={{ opacity: 1, y: 0, scale: 1 }}
                                    animate={{ opacity: 0, y: -20, scale: 1.2 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute -top-8 left-4 z-50 flex flex-col items-center pointer-events-none"
                                >
                                    {playerDamageTaken > 0 && (
                                        <div className="text-xl font-black text-rose-500 drop-shadow-[0_0_10px_rgba(225,29,72,0.8)]">
                                            -{playerDamageTaken}
                                        </div>
                                    )}
                                    {playerBlockTaken > 0 && (
                                        <div className="text-base font-black text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                                            -{playerBlockTaken} 🛡️
                                        </div>
                                    )}
                                    {playerDamageTaken === 0 && playerBlockTaken === 0 && (
                                        <div className="text-base font-black text-slate-400 drop-shadow-md">
                                            MISS
                                        </div>
                                    )}
                                </motion.div>
                            )}
                            <div className="flex items-center gap-2">
                                <Heart size={10} className="text-rose-500" />
                                <span className="text-[10px] font-bold text-white">{player.currentHp}/{player.maxHp}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield size={10} className="text-blue-400" />
                                <span className="text-[10px] font-bold text-white">{player.block}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Coins size={10} className="text-amber-400" />
                                <span className="text-[10px] font-bold text-white">${player.gold}</span>
                            </div>
                        </motion.div>

                        {/* Hand Info Bar */}
                        <div className="flex justify-between items-center mb-0.5">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-blue-400">
                                    <span className="text-[7px] font-bold uppercase">出牌</span>
                                    <span className="text-[9px] font-mono font-bold">{player.hands}</span>
                                </div>
                                <div className="flex items-center gap-1 text-rose-400">
                                    <span className="text-[7px] font-bold uppercase">弃牌</span>
                                    <span className="text-[9px] font-mono font-bold">{player.discards}</span>
                                </div>
                            </div>
                            
                            <div className="h-4 flex items-center justify-center min-w-[70px] bg-black/60 px-2 rounded-full border border-white/5">
                                <AnimatePresence mode="wait">
                                    {selectedHand ? (
                                        <motion.div key="hand" className="flex items-center gap-1.5">
                                            <span className="text-[7px] font-black text-white uppercase tracking-widest">{HAND_TYPE_NAMES[selectedHand.type]}</span>
                                            <div className="flex gap-1 text-[7px] font-mono">
                                                <span className="text-blue-400">{selectedHand.baseChips}</span>
                                                <span className="text-slate-600">x</span>
                                                <span className="text-rose-400">{selectedHand.baseMult}</span>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="text-[6px] text-slate-600 uppercase tracking-widest font-black">请选择牌</div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Layers size={9} />
                                <span className="text-[8px] font-mono font-bold">{player.deck.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Player Hand Area */}
                <div className="shrink-0 relative z-50 pb-safe overflow-visible pointer-events-none -mt-8">
                    <div className="flex justify-center items-end h-32 sm:h-40 pointer-events-auto">
                        <div className="flex items-end justify-center min-w-max px-8 pb-2 overflow-visible">
                            <AnimatePresence>
                                {player.hand
                                    .filter(card => !card.isSelected)
                                    .map((card, index) => (
                                        <CardComponent 
                                            key={card.id}
                                            layoutId={card.id}
                                            card={card} 
                                            index={index} 
                                            total={player.hand.filter(c => !c.isSelected).length}
                                            onClick={() => toggleCardSelection(card.id)}
                                            disabled={isCalculating}
                                            noRotation={false}
                                        />
                                    ))
                                }
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        )}

       
        {/* --- INLINE SHOP AREA (RESPONSIVE VERTICAL LIST) --- */}
        {showShop && (
            <div className="shrink-0 relative z-[100] bg-slate-900/95 backdrop-blur-xl border-t border-blue-500/30 p-2 sm:p-5 pb-safe flex gap-2 sm:gap-4 h-[420px] sm:h-[450px] animate-in slide-in-from-bottom-10 duration-500 w-full overflow-hidden">
                
                {/* Left Panel: Compact Info & Controls */}
                <div className="w-36 sm:w-56 shrink-0 flex flex-col gap-1.5 sm:gap-2.5 h-full pb-1">
                    {/* Header Info (Compact Gold & Level) */}
                    <div className="bg-black/40 border border-white/10 rounded-xl p-2 sm:p-3 flex flex-col gap-1 sm:gap-1.5 shadow-inner shrink-0">
                        
                        {/* Gold & Level Row */}
                        <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/80 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded border border-amber-500/20 shadow-inner">
                                <Coins size={12} className="text-amber-400 sm:w-[14px] sm:h-[14px]" />
                                <span className="text-[11px] sm:text-sm font-black text-amber-400 font-mono tracking-tight">${player.gold}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[11px] sm:text-sm text-emerald-400 font-black leading-none">LV.{player.level}</span>
                                <span className="text-[8px] sm:text-[9px] text-slate-500 mt-0.5">{player.level===9?'MAX':`${player.currentExp}/${player.maxExp}`}</span>
                            </div>
                        </div>

                        <div className="h-1 sm:h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-emerald-500" initial={{width:0}} animate={{width: player.level===9?'100%':`${(player.currentExp/player.maxExp)*100}%`}} />
                        </div>

                        {/* Probabilities */}
                        <div className="flex justify-between text-[8px] sm:text-[10px] font-mono mt-0.5 sm:mt-1 px-0.5">
                            {Object.entries(SHOP_PROBABILITIES[player.level as keyof typeof SHOP_PROBABILITIES] || {}).map(([c, p]) => (
                                <span key={c} className={c==='1'?'text-slate-400':c==='2'?'text-emerald-400':c==='3'?'text-blue-400':c==='4'?'text-purple-400':'text-amber-400'}>{p}%</span>
                            ))}
                        </div>

                        <div className="text-[9px] sm:text-xs text-amber-400/80 mt-1 flex justify-between border-t border-white/5 pt-1 sm:pt-2 font-bold">
                            <span>当前利息:</span>
                            <span className="font-mono text-amber-400">+${Math.min(5, Math.floor(player.gold / 10))}</span>
                        </div>
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 shrink-0">
                        <button onClick={buyExp} disabled={player.gold < (player.level===6?20:4) && !(activeSynergies.find(s => s.id === 'cheater')?.activeLevel >= 2 && player.currentHp > ((player.level===6?20:4) - player.gold) * 2)} className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg sm:rounded-xl flex flex-col items-center justify-center py-1.5 sm:py-2.5 transition-colors disabled:opacity-50 group shadow-lg">
                            <span className="text-[10px] sm:text-xs font-black text-blue-400">{player.level===6?'系统超频':'购买经验'}</span>
                            <span className="text-[9px] sm:text-[10px] text-amber-400 font-mono mt-0.5">${player.level===6?20:4}</span>
                        </button>
                        <button onClick={() => setIsSelling(!isSelling)} className={`rounded-lg sm:rounded-xl flex flex-col items-center justify-center py-1.5 sm:py-2.5 transition-colors border shadow-lg ${isSelling ? 'bg-rose-600 border-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)]' : 'bg-rose-900/20 border-rose-500/30 text-rose-400 hover:bg-rose-900/40'}`}>
                            <span className="text-[10px] sm:text-xs font-black">{isSelling ? '取消出售' : '出售卡牌'}</span>
                            <span className="text-[8px] sm:text-[9px] font-mono opacity-80 mt-0.5">{isSelling ? '点击卡牌' : '回收金币'}</span>
                        </button>
                    </div>

                    <button onClick={refreshShop} disabled={player.gold < shopRefreshCost && !(activeSynergies.find(s => s.id === 'cheater')?.activeLevel >= 2 && player.currentHp > (shopRefreshCost - player.gold) * 2)} className="w-full bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg sm:rounded-xl flex justify-between items-center px-2.5 sm:px-4 py-2 sm:py-3 transition-colors disabled:opacity-50 shrink-0 shadow-lg mt-0.5">
                        <span className="text-[10px] sm:text-sm font-bold text-slate-300 flex items-center gap-1.5 sm:gap-2"><RefreshCw size={12} className="text-blue-400 sm:w-[14px] sm:h-[14px]"/> 刷新</span>
                        <span className="text-[10px] sm:text-sm text-amber-400 font-mono">${shopRefreshCost}</span>
                    </button>

                    {/* 超大号 继续前进 按钮 (紧贴刷新按钮下方) */}
                    <button onClick={closeShop} className="w-full mt-1.5 sm:mt-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg sm:rounded-xl text-xs sm:text-base font-black text-white py-3.5 sm:py-5 shadow-xl shadow-emerald-900/30 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shrink-0">
                        继续前进 <Play size={14} fill="currentColor" className="sm:w-[16px] sm:h-[16px]" />
                    </button>
                </div>

                {/* Right Panel: Vertical Shop Cards Strip */}
                <div className="flex-1 flex flex-col gap-2 sm:gap-3 overflow-y-auto no-scrollbar pb-2 pr-1 h-full">
                    {shopCards.map((card, i) => (
                        <motion.div 
                            key={card.id}
                            whileHover={{ x: -4 }}
                            className="w-full shrink-0 bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl flex relative overflow-hidden shadow-xl group hover:border-blue-500/40 transition-all"
                        >
                            {/* Left Color Bar */}
                            <div className={`w-1.5 sm:w-2 shrink-0 ${card.rarity === 'common' ? 'bg-slate-500' : card.rarity === 'rare' ? 'bg-blue-500' : card.rarity === 'epic' ? 'bg-purple-500' : card.rarity === 'legendary' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                            
                            {/* Card Content: Switches from row on desktop to column on mobile */}
                            <div className="p-1.5 sm:p-3 flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-3">
                                
                                {/* Info Box */}
                                <div className="w-full sm:w-1/4 sm:min-w-[120px] flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-start shrink-0">
                                    <div className="text-[11px] sm:text-sm font-black text-white truncate max-w-[60%] sm:max-w-full mb-0 sm:mb-1.5">{card.name}</div>
                                    <div className="flex gap-1 flex-wrap">
                                        {card.synergies.slice(0, 2).map(s => <span key={s} className="text-[8px] sm:text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded leading-none border border-white/5">{s}</span>)}
                                    </div>
                                </div>
                                
                                {/* Description Box */}
                                <div className="flex-1 bg-black/40 rounded-lg p-1.5 sm:p-2.5 overflow-y-auto no-scrollbar border border-white/5 flex items-start sm:items-center min-h-[36px] sm:max-h-[60px]">
                                    <div className="text-[9px] sm:text-[11px] text-slate-400 leading-snug line-clamp-2">{card.description}</div>
                                </div>

                                {/* Buy Button */}
                                <button 
                                    onClick={() => buyTFTCard(card, i)}
                                    disabled={(player.gold < card.cost && !(activeSynergies.find(s => s.id === 'cheater')?.activeLevel >= 2 && player.currentHp > (card.cost - player.gold) * 2)) || player.benchTFTCards.length >= 6}
                                    className="w-full sm:w-28 shrink-0 py-1.5 sm:py-3 bg-slate-800 hover:bg-blue-600 disabled:opacity-50 text-[10px] sm:text-xs font-black text-white rounded-lg sm:rounded-xl border border-white/5 flex flex-row sm:flex-col justify-center items-center gap-1 transition-colors shadow-md"
                                >
                                    <span>购买</span>
                                    <span className="text-amber-400 font-mono text-[10px] sm:text-sm">${card.cost}</span>
                                </button>

                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        )}
      </main>

      
      {/* Game Over Screen - 仅在玩家死亡时显示 */}
      {gameStatus === 'lost' && (
        <div className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-rose-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl shadow-rose-900/20"
          >
            <h2 className="text-4xl font-black mb-2 text-rose-500">
              连接已断开
            </h2>
            <p className="text-slate-400 mb-8">
              你的信号已被终止，系统已被清理。
            </p>
            <button 
              onClick={startNewRun}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-rose-900/50 transition-all"
            >
              重启系统 / REBOOT
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}



