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

// Initial Player State
const INITIAL_PLAYER: PlayerState = {
  maxHp: 100,
  currentHp: 100,
  block: 0,
  gold: 0,
  level: 3,
  currentExp: 0,
  maxExp: LEVEL_EXP_CURVE[3],
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
  const [activeModal, setActiveModal] = useState<'poker' | 'rogue' | 'deck' | 'guide' | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  
  // Scoring UI State
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [playingCards, setPlayingCards] = useState<Card[]>([]);
  
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
    
    // Add TFT Card stats
    player.activeTFTCards.forEach(card => {
        if (card.stats.chips) options.tftChipsBonus! += card.stats.chips;
        if (card.stats.mult) options.tftMultBonus! += card.stats.mult;
    });

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

    // 3. Finalize
    addTimeout(() => {
      setDisplayChips(scoreBreakdown.chips);
      setDisplayMult(scoreBreakdown.mult);
    }, currentTime + 100);

    // 4. Total
    addTimeout(() => {
      setShowTotal(true);
      setDisplayTotal(scoreBreakdown.total);
    }, currentTime + 300);

    // 4.5 飞行撞击特效
    addTimeout(() => {
      setShowTotal(false);
      setFlyingDamage({ amount: scoreBreakdown.total, isFlying: true });
    }, currentTime + 1300);

    // 5. 命中判定与扣血 (大幅缩短飞行时间，形成急速撞击感)
    addTimeout(() => {
      setFlyingDamage(null);
      setEnemyHitState('hit');
      setTimeout(() => setEnemyHitState('idle'), 400); // 震动持续时间
      applyHandEffects();
    }, currentTime + 1550); // 仅250ms的飞行时间，短促有力

    return () => timeouts.forEach(clearTimeout);
  }, [isCalculating, scoreBreakdown, playingCards]);

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
    // Calculate Rewards
    let rewardGold = 5; // Base reward
    
    // 1. Interest
    const interest = Math.min(5, Math.floor(player.gold / 10));
    rewardGold += interest;
    
    // 2. Quick Kill Bonus
    if (player.handsUsedThisBattle === 1) rewardGold += 3;
    else if (player.handsUsedThisBattle === 2) rewardGold += 2;
    else if (player.handsUsedThisBattle === 3) rewardGold += 1;

    // 3. EXP Gain
    let newExp = player.currentExp + 2;
    let newLevel = player.level;
    let newMaxExp = player.maxExp;

    // Calculate Synergies for Start of Battle Effects
    const currentSynergies = calculateActiveSynergies(player.activeTFTCards);
    
    let baseDiscards = 3;
    const magician = currentSynergies.find(s => s.id === 'magician');
    if (magician && magician.activeLevel >= 1) {
        baseDiscards += 2;
    }

    const tycoon = currentSynergies.find(s => s.id === 'tycoon');
    if (tycoon && tycoon.activeLevel >= 3) {
        // Tycoon (7): Free Refresh (+2 Gold) + Consumable (+5 Gold value)
        rewardGold += 7;
    }

    // Level Up Logic
    while (newLevel < 9 && newExp >= newMaxExp) {
        newExp -= newMaxExp;
        newLevel++;
        newMaxExp = LEVEL_EXP_CURVE[newLevel];
    }
    // Cap at Lv 9
    if (newLevel === 9) {
        newExp = 0;
        newMaxExp = 9999;
    }

    setPlayer(prev => ({
        ...prev,
        currentHp: Math.min(prev.maxHp, prev.currentHp + 20), // Heal 20
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
    }));

    // Generate Shop (uses new level)
    // We need to wait for state update or pass level directly. 
    // Since generateShop reads from player.level, we should pass it or use useEffect.
    // But generateShop is called immediately. Let's modify generateShop to accept level optional?
    // Or just rely on the fact that we setPlayer, but React state updates are async.
    // Better to update generateShop to read from an argument if provided, or just defer.
    // For now, let's just use a timeout or assume the player state update will be handled in next render?
    // No, generateShop uses `player.level`.
    // Let's manually trigger generateShop with the NEW level.
    
    // Actually, generateShop reads `player.level`. We can't easily pass it without refactoring.
    // Let's just set the shop cards directly here using the new level logic.
    
    const probs = SHOP_PROBABILITIES[newLevel] || SHOP_PROBABILITIES[9];
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
        newShopCards.push({ ...template, id: Math.random().toString(36).substr(2, 9), stars: 1 } as TFTCard);
    }
    setShopCards(newShopCards);
    setShowShop(true);
  };

  const generateShop = () => {
    const newShopCards: TFTCard[] = [];
    const probs = SHOP_PROBABILITIES[player.level] || SHOP_PROBABILITIES[9];

    // Cheater (4): Guarantee own card
    const currentSynergies = calculateActiveSynergies(player.activeTFTCards);
    const cheater = currentSynergies.find(s => s.id === 'cheater');
    const forceOwnCard = cheater && cheater.activeLevel >= 2;

    for (let i = 0; i < 4; i++) {
        // Force Own Card logic for first slot
        if (i === 0 && forceOwnCard) {
             const ownCards = [...player.activeTFTCards, ...player.benchTFTCards];
             if (ownCards.length > 0) {
                 const randomOwn = ownCards[Math.floor(Math.random() * ownCards.length)];
                 const template = CARD_DATABASE.find(c => c.templateId === randomOwn.templateId);
                 if (template) {
                     newShopCards.push({ ...template, id: Math.random().toString(36).substr(2, 9), stars: 1 } as TFTCard);
                     continue;
                 }
             }
        }

        // Roll for rarity
        const roll = Math.random() * 100;
        let rarity = 1;
        let cumulative = 0;
        
        for (let r = 1; r <= 5; r++) {
            cumulative += probs[r] || 0;
            if (roll <= cumulative) {
                rarity = r;
                break;
            }
        }

        // Filter cards by rarity (cost)
        const pool = CARD_DATABASE.filter(c => c.cost === rarity);
        if (pool.length === 0) {
            // Fallback if pool empty (shouldn't happen)
            newShopCards.push({
                ...CARD_DATABASE[0],
                id: Math.random().toString(36).substr(2, 9),
                stars: 1
            } as TFTCard);
        } else {
            const template = pool[Math.floor(Math.random() * pool.length)];
            newShopCards.push({
                ...template,
                id: Math.random().toString(36).substr(2, 9),
                stars: 1
            } as TFTCard);
        }
    }
    setShopCards(newShopCards);
  };

  const buyExp = () => {
    if (player.gold < 4 && player.level < 9) return;
    if (player.level === 9 && player.gold < 20) return;

    if (player.level === 9) {
        // System Overclock
        setPlayer(prev => {
            // Buff a random card
            if (prev.activeTFTCards.length === 0) return { ...prev, gold: prev.gold - 20 };
            
            const newActive = [...prev.activeTFTCards];
            const randomIndex = Math.floor(Math.random() * newActive.length);
            const card = newActive[randomIndex];
            
            // Apply 15% buff (additive to base stats or just a generic buff counter?)
            // The prompt says "Base attributes permanently increased by 15%".
            // Since we don't have base attributes in state easily, let's add a "buffs" field or just modify stats.
            // Let's modify the `stats` object directly.
            
            const currentChips = card.stats.chips || 0;
            const currentMult = card.stats.mult || 0;
            const currentDmgMod = card.stats.baseDamageMod || 0;
            
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
        // Buy EXP
        setPlayer(prev => {
            let newExp = prev.currentExp + 4;
            let newLevel = prev.level;
            let newMaxExp = prev.maxExp;

            while (newLevel < 9 && newExp >= newMaxExp) {
                newExp -= newMaxExp;
                newLevel++;
                newMaxExp = LEVEL_EXP_CURVE[newLevel];
            }
            
            if (newLevel === 9) {
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
    const cost = (cheaterSynergy && cheaterSynergy.activeLevel >= 1) ? 1 : shopRefreshCost;

    if (player.gold >= cost) {
        setPlayer(prev => ({ ...prev, gold: prev.gold - cost }));
        generateShop();
    }
  };

  const buyTFTCard = (card: TFTCard, index: number) => {
    if (player.gold >= card.cost && player.benchTFTCards.length < 5) {
        setPlayer(prev => {
            const newBench = [...prev.benchTFTCards, card];
            // Check for synthesis
            const sameCards = newBench.filter(c => c.templateId === card.templateId && c.stars === card.stars);
            if (sameCards.length >= 3) {
                // Synthesize!
                const upgradedCard: TFTCard = {
                    ...card,
                    stars: card.stars + 1,
                    stats: {
                        chips: card.stats.chips ? card.stats.chips * 2 : undefined,
                        mult: card.stats.mult ? card.stats.mult * 2 : undefined,
                        percentMult: card.stats.percentMult ? card.stats.percentMult * 2 : undefined,
                    }
                };
                const remainingBench = newBench.filter(c => !(c.templateId === card.templateId && c.stars === card.stars));
                return {
                    ...prev,
                    gold: prev.gold - card.cost,
                    benchTFTCards: [...remainingBench, upgradedCard]
                };
            }
            return {
                ...prev,
                gold: prev.gold - card.cost,
                benchTFTCards: newBench
            };
        });
        setShopCards(prev => prev.filter((_, i) => i !== index));
    }
  };

  const swapTFTCard = (fromBenchIndex: number, toActiveIndex: number) => {
    setPlayer(prev => {
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
        if (prev.benchTFTCards.length >= 5) return prev;
        const card = prev.activeTFTCards[index];
        const newActive = prev.activeTFTCards.filter((_, i) => i !== index);
        const newBench = [...prev.benchTFTCards, card];
        return { ...prev, activeTFTCards: newActive, benchTFTCards: newBench };
    });
  };

  const moveBenchToActive = (index: number) => {
    setPlayer(prev => {
        if (prev.activeTFTCards.length >= 5) return prev;
        const card = prev.benchTFTCards[index];
        const newBench = prev.benchTFTCards.filter((_, i) => i !== index);
        const newActive = [...prev.activeTFTCards, card];
        return { ...prev, activeTFTCards: newActive, benchTFTCards: newBench };
    });
  };

  const handleSellCard = (type: 'active' | 'bench', index: number) => {
      setPlayer(prev => {
          const card = type === 'active' ? prev.activeTFTCards[index] : prev.benchTFTCards[index];
          if (!card) return prev;
          const sellValue = Math.max(1, card.cost - 1); // 基础回收价格
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
    // Draw initial hand for next battle
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

  // Play Hand Action
  const playHand = () => {
    if (!selectedHand || player.hands <= 0 || gameStatus !== 'playing' || isCalculating) return;

    // 1. Calculate Score (Base)
    // Auto-sort cards by value for the engine and display
    const sortedCards = [...selectedHand.cards].sort((a, b) => a.value - b.value);
    const sortedHand = { ...selectedHand, cards: sortedCards };
    
    let breakdown = calculateScore(sortedHand, evalOptions);

    // 2. Apply Synergy Bonuses
    const calculatorSynergy = activeSynergies.find(s => s.id === 'calculator');
    if (calculatorSynergy && calculatorSynergy.activeLevel > 0) {
        // Calculator: +2 / +6 / +15 Mult if hand contains Pair/Two Pair/Full House/Four of a Kind?
        // Description: "包含对子时". Strictly "Pair"? Or "At least a Pair"?
        // Usually "Contains a pair" includes Two Pair, Full House, 4oaK.
        // Let's check if the hand type implies a pair.
        const pairTypes = ['Pair', 'Two Pair', 'Three of a Kind', 'Full House', 'Four of a Kind'];
        if (pairTypes.includes(selectedHand.type)) {
            const bonus = calculatorSynergy.activeLevel === 1 ? 2 : calculatorSynergy.activeLevel === 2 ? 6 : 15;
            breakdown.mult += bonus;
            breakdown.multBreakdown.push({ source: '计算姬', value: bonus });
        }
    }

    const surferSynergy = activeSynergies.find(s => s.id === 'surfer');
    if (surferSynergy && surferSynergy.activeLevel >= 2) {
        // Surfer (4): Flush Mult x3
        if (['Flush', 'Straight Flush', 'Royal Flush'].includes(selectedHand.type)) {
            breakdown.mult *= 3;
            breakdown.multBreakdown.push({ source: '冲浪者(4)', value: 3 });
        }
    }

    // Recalculate Total after Synergy
    breakdown.total = breakdown.chips * breakdown.mult;

    // 3. Apply "onCalculation" Modifiers
    player.modifiers.filter(m => m.trigger === 'onCalculation').forEach(mod => {
        if (mod.id === 'heart-firewall') {
            // Handled in effect application, not score calc usually, but prompt says "provides Block".
            // Let's handle non-score effects in the next step.
        }
        if (mod.id === 'overclock') {
            if (selectedHand.type === 'Pair' || selectedHand.type === 'Two Pair') {
                breakdown.mult += 2;
                breakdown.multBreakdown.push({ source: '算力超载', value: 2 });
                breakdown.total = breakdown.chips * breakdown.mult;
            }
        }
        // Add other calculation modifiers here
    });

    // 3. Show Calculation UI
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

    // --- SYNERGY EFFECTS ---
    
    // 1. Blade (Spades) - Flat Damage
    const bladeSynergy = activeSynergies.find(s => s.id === 'blade');
    if (bladeSynergy && bladeSynergy.activeLevel > 0) {
        const bonus = bladeSynergy.activeLevel === 1 ? 15 : bladeSynergy.activeLevel === 2 ? 40 : 100;
        rawDamage += bonus;
    }

    // 2. Fortress (Hearts) - Block
    const fortressSynergy = activeSynergies.find(s => s.id === 'fortress');
    if (fortressSynergy && fortressSynergy.activeLevel > 0) {
        const bonus = fortressSynergy.activeLevel === 1 ? 10 : fortressSynergy.activeLevel === 2 ? 30 : 80;
        blockGain += bonus;
    }

    // 3. Venom (Clubs) - Poison
    const venomSynergy = activeSynergies.find(s => s.id === 'venom');
    if (venomSynergy && venomSynergy.activeLevel > 0) {
        const bonus = venomSynergy.activeLevel === 1 ? 2 : venomSynergy.activeLevel === 2 ? 5 : 12;
        poisonStacks += bonus;
    }

    // 4. Tycoon (Diamonds) - Gold
    const tycoonSynergy = activeSynergies.find(s => s.id === 'tycoon');
    if (tycoonSynergy && tycoonSynergy.activeLevel > 0) {
        const bonus = tycoonSynergy.activeLevel === 1 ? 2 : tycoonSynergy.activeLevel === 2 ? 5 : 15;
        goldGain += bonus;
    }

    // 5. Magician - (Removed Double Cast, implemented as Discard Bonus)
    // (No logic here for Magician)

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
      let newHp = Math.max(0, prev.currentHp - damageDealt);

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

      // Geek (4): Refund Hand if Straight
      const geek = activeSynergies.find(s => s.id === 'geek');
      if (geek && geek.activeLevel >= 2) {
          if (['Straight', 'Straight Flush', 'Royal Flush'].includes(selectedHand.type)) {
              handsConsumed = 0;
          }
      }

      let discardsGained = 0;
      if (prev.modifiers.some(m => m.id === 'four-of-a-kind-root') && selectedHand.type === 'Four of a Kind') {
          discardsGained = 2;
      }

      return {
        ...prev,
        hand: remainingHand,
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

      const selectedIds = new Set(selectedCards.map(c => c.id));
      const remainingHand = prev.hand.filter(c => !selectedIds.has(c.id));
      const newDiscard = [...prev.discardPile, ...selectedCards.map(c => ({...c, isSelected: false}))];
      
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
        discards: prev.discards - 1
      };
    });
  };

  // End Turn
  const endTurn = () => {
    if (gameStatus !== 'playing' || !enemy) return;

    // 1. Player Turn End Modifiers
    let thornsDamage = 0;
    if (player.modifiers.some(m => m.id === 'thorns-protocol')) {
        thornsDamage = Math.floor(player.block / 5) * 2;
    }

    // 2. Enemy Poison Damage & Thorns
    let enemyPoisonDamage = 0;
    const poisonEffect = enemy.statusEffects.find(e => e.type === 'poison');
    if (poisonEffect) {
        enemyPoisonDamage = poisonEffect.stacks;
    }

    const totalPassiveDamage = enemyPoisonDamage + thornsDamage;

    // Apply Passive Damage to Enemy
    let enemyAlive = true;
    setEnemy(prev => {
        if (!prev) return null;
        const newHp = Math.max(0, prev.currentHp - totalPassiveDamage);
        if (newHp <= 0) enemyAlive = false;
        
        return {
            ...prev,
            currentHp: newHp,
            statusEffects: prev.statusEffects.map(e => e.type === 'poison' ? { ...e, stacks: Math.max(0, e.stacks - 1) } : e).filter(e => e.stacks > 0)
        };
    });

    if (!enemyAlive) return;

    // 3. Enemy Action (Intent)
    const intent = enemy.intent;
    
    // 触发主角受击特效
    let damageToPlayer = 0;
    if (intent.type === 'attack') {
        damageToPlayer = Math.max(0, (intent.value || 0) - player.block);
    }
    if (damageToPlayer > 0) {
        setPlayerDamageTaken(damageToPlayer);
        setPlayerHitState('hit');
        setTimeout(() => setPlayerHitState('idle'), 400);
    }
    
    setPlayer(prev => {
        let newHp = prev.currentHp;
        let newHand = [...prev.hand];
        let newDiscard = [...prev.discardPile];
        let newDeck = [...prev.deck];

        // Attack
        if (intent.type === 'attack') {
            const damage = Math.max(0, (intent.value || 0) - prev.block);
            newHp -= damage;
        }

        // Lock
        if (intent.type === 'lock') {
            const count = intent.value || 1;
            const availableIndices = newHand.map((_, i) => i).filter(i => !newHand[i].isLocked);
            const indicesToLock = availableIndices.sort(() => Math.random() - 0.5).slice(0, count);
            indicesToLock.forEach(idx => {
                newHand[idx] = { ...newHand[idx], isLocked: true, isSelected: false };
            });
        }

        // Blind
        if (intent.type === 'blind') {
            const count = intent.value || 3;
            const availableIndices = newHand.map((_, i) => i).filter(i => !newHand[i].isHidden);
            const indicesToBlind = availableIndices.sort(() => Math.random() - 0.5).slice(0, count);
            indicesToBlind.forEach(idx => {
                newHand[idx] = { ...newHand[idx], isHidden: true };
            });
        }

        // Junk (Inject Null)
        if (intent.type === 'junk') {
            const count = intent.value || 2;
            for (let i = 0; i < count; i++) {
                newDeck.push({
                    id: `junk-${Date.now()}-${i}`,
                    suit: 'spades', // Dummy
                    rank: '2', // Dummy
                    value: 0,
                    isSelected: false,
                    isJunk: true
                });
            }
            newDeck = shuffleDeck(newDeck);
        }

        return {
            ...prev,
            currentHp: Math.max(0, newHp),
            hand: newHand,
            deck: newDeck,
            discardPile: newDiscard
        };
    });

    // 4. Enemy Defend
    if (intent.type === 'defend') {
        setEnemy(prev => prev ? ({ ...prev, block: prev.block + (intent.value || 0) }) : null);
    }

    // 5. Reset Player & Draw
    setPlayer(prev => {
        // Clear temp states (keep Locked/Hidden? Prompt says "Lock... this turn forbidden". So maybe clear lock next turn?
        // "Deadlock... randomly lock... forbid play/discard THIS turn".
        // So we should clear locks at start of next turn (which is now).
        // Wait, "Blind... underlying data exists... blind guess".
        // Usually Blind lasts until played or discarded.
        // Let's clear Lock, but keep Blind? Or clear both?
        // Slay the Spire clears "Entangled" next turn.
        // Let's clear Locks. Keep Blind?
        // Prompt doesn't specify duration. Let's clear both for fairness unless specified.
        
        const newDiscard = [...prev.discardPile, ...prev.hand.map(c => ({...c, isSelected: false, isLocked: false, isHidden: false}))];
        let currentDeck = [...prev.deck];
        let currentDiscard = [...newDiscard];

        if (currentDeck.length < 8) {
            const shuffledDiscard = shuffleDeck(currentDiscard);
            currentDeck = [...currentDeck, ...shuffledDiscard];
            currentDiscard = [];
        }

        const { drawn, remaining } = drawCards(currentDeck, 8);

        return {
            ...prev,
            hand: drawn,
            deck: remaining,
            discardPile: currentDiscard,
            pendingCardIds: [],
            hands: 3,
            discards: 3,
            block: 0
        };
    });

    // 6. Generate Next Intent
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
              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/5 text-left text-xs font-medium text-slate-300 transition-colors"
            >
              <Activity size={14} className="text-slate-400" />
              查看当前牌库
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {activeModal === 'poker' ? '牌型与伤害科普' : activeModal === 'rogue' ? '肉鸽效果与玩法' : activeModal === 'guide' ? '新手快速入门' : '当前牌库'}
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
        <section className="shrink-0 px-4 py-1.5 bg-slate-900/80 border-t border-white/10 backdrop-blur-2xl relative overflow-hidden z-40">
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
                            <span className="text-[7px] text-slate-500 font-mono">{player.activeTFTCards.length}/5</span>
                        </div>
                        <div className={`flex gap-1.5 justify-start p-1 rounded-lg transition-colors ${isSelling ? 'bg-rose-950/40 border border-rose-500/30' : 'border border-transparent'}`}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <motion.div 
                                    key={i} 
                                    onClick={() => {
                                        if (!player.activeTFTCards[i]) return;
                                        if (isSelling) handleSellCard('active', i);
                                        else moveActiveToBench(i);
                                    }}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    className={`
                                        w-9 h-12 rounded-lg border flex flex-col items-center justify-center shrink-0 relative transition-all duration-300 cursor-pointer overflow-hidden
                                        ${player.activeTFTCards[i] 
                                            ? (isSelling ? 'bg-rose-900 border-rose-500 shadow-lg shadow-rose-900/50' : 'bg-slate-800 border-blue-500/40 shadow-lg') 
                                            : 'bg-black/40 border-white/5 border-dashed hover:border-white/20'}
                                    `}
                                >
                                    {player.activeTFTCards[i] && isSelling && (
                                        <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center z-20 pointer-events-none">
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
                        </div>
                        <div className={`flex gap-1.5 p-1 rounded-lg transition-colors border ${isSelling ? 'bg-rose-950/40 border-rose-500/30' : 'bg-black/40 border-white/5'}`}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <motion.div 
                                    key={i} 
                                    onClick={() => {
                                        if (!player.benchTFTCards[i]) return;
                                        if (isSelling) handleSellCard('bench', i);
                                        else moveBenchToActive(i);
                                    }}
                                    className={`
                                        w-7 h-9 rounded-md flex items-center justify-center shrink-0 cursor-pointer transition-all border overflow-hidden relative
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
                                disabled={!selectedHand || player.hands <= 0 || isCalculating}
                                className={`
                                    col-span-2 py-1.5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all
                                    flex items-center justify-center gap-2 shadow-lg
                                    ${selectedHand && player.hands > 0 && !isCalculating
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
                                    animate={{ opacity: 0, y: -20, scale: 1.5 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute -top-6 left-4 z-50 text-xl font-black text-rose-500 drop-shadow-[0_0_10px_rgba(225,29,72,0.8)] pointer-events-none"
                                >
                                    -{playerDamageTaken}
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
                        <button onClick={buyExp} disabled={player.gold < 4} className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg sm:rounded-xl flex flex-col items-center justify-center py-1.5 sm:py-2.5 transition-colors disabled:opacity-50 group shadow-lg">
                            <span className="text-[10px] sm:text-xs font-black text-blue-400">{player.level===9?'系统超频':'购买经验'}</span>
                            <span className="text-[9px] sm:text-[10px] text-amber-400 font-mono mt-0.5">${player.level===9?20:4}</span>
                        </button>
                        <button onClick={() => setIsSelling(!isSelling)} className={`rounded-lg sm:rounded-xl flex flex-col items-center justify-center py-1.5 sm:py-2.5 transition-colors border shadow-lg ${isSelling ? 'bg-rose-600 border-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)]' : 'bg-rose-900/20 border-rose-500/30 text-rose-400 hover:bg-rose-900/40'}`}>
                            <span className="text-[10px] sm:text-xs font-black">{isSelling ? '取消出售' : '出售卡牌'}</span>
                            <span className="text-[8px] sm:text-[9px] font-mono opacity-80 mt-0.5">{isSelling ? '点击卡牌' : '回收金币'}</span>
                        </button>
                    </div>

                    <button onClick={refreshShop} disabled={player.gold < shopRefreshCost} className="w-full bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg sm:rounded-xl flex justify-between items-center px-2.5 sm:px-4 py-2 sm:py-3 transition-colors disabled:opacity-50 shrink-0 shadow-lg mt-0.5">
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
                                    disabled={player.gold < card.cost || player.benchTFTCards.length >= 5}
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



