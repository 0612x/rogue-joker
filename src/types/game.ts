export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number; // Numerical value for scoring (2-14)
  isSelected: boolean;
  isGlass?: boolean; // Glass material: double damage, chance to break
  isLocked?: boolean; // Locked by monster: cannot be played or discarded
  isHidden?: boolean; // Blinded by monster: suit/rank hidden
  isJunk?: boolean; // Parasite card: 0 points, takes space
}

export type ModifierTier = 'common' | 'rare' | 'legendary' | 'mythic';

export interface Joker {
  id: string;
  name: string;
  description: string;
  rarity: ModifierTier;
}

export interface Consumable {
  id: string;
  name: string;
  description: string;
}

export interface TFTCard {
  id: string;
  templateId: string;
  name: string;
  stars: number;
  description: string;
  synergies: string[]; // e.g., ['spades', 'assassin']
  rarity: ModifierTier; // mapped to cost: 1=common, 2=rare, 3=legendary, 4=mythic, 5=god
  cost: number;
  stats: {
    chips?: number;
    mult?: number;
    percentMult?: number;
    // Dynamic stats for the new system
    baseDamageMod?: number; // % increase
    baseArmorMod?: number; // Flat armor
    poisonMod?: number; // Stacks
    goldChance?: number; // %
  };
}

export interface Synergy {
  id: string;
  name: string;
  type: 'suit' | 'class';
  thresholds: number[];
  currentCount: number;
  activeLevel: number; // 0 for inactive, 1 for first threshold, etc.
  description: string;
  icon: string;
}

export interface Modifier {
  id: string;
  name: string;
  description: string;
  tier: ModifierTier;
  trigger?: 'onPlay' | 'onDiscard' | 'onTurnEnd' | 'onCalculation' | 'passive';
}

export type HandType = 
  | 'High Card'
  | 'Pair'
  | 'Two Pair'
  | 'Three of a Kind'
  | 'Straight'
  | 'Flush'
  | 'Full House'
  | 'Four of a Kind'
  | 'Straight Flush'
  | 'Royal Flush';

export const HAND_TYPE_NAMES: Record<HandType, string> = {
  'High Card': '高牌',
  'Pair': '对子',
  'Two Pair': '两对',
  'Three of a Kind': '三条',
  'Straight': '顺子',
  'Flush': '同花',
  'Full House': '葫芦',
  'Four of a Kind': '四条',
  'Straight Flush': '同花顺',
  'Royal Flush': '皇家同花顺',
};

export interface HandEvaluation {
  type: HandType;
  baseChips: number;
  baseMult: number;
  cards: Card[]; // The cards that actually make up the hand
}

export interface ScoreBreakdown {
  chips: number;
  mult: number;
  total: number;
  chipBreakdown: { source: string; value: number }[];
  multBreakdown: { source: string; value: number }[];
}

export interface Enemy {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  maxHp: number;
  currentHp: number;
  block: number;
  intent: EnemyIntent;
  statusEffects: StatusEffect[];
}

export type IntentType = 'attack' | 'defend' | 'lock' | 'blind' | 'junk' | 'leech';

export interface EnemyIntent {
  type: IntentType;
  value?: number; // Damage amount, block amount, count of cards to lock/blind
  description?: string;
}

export interface StatusEffect {
  type: 'poison' | 'vulnerable' | 'weak';
  stacks: number;
}

export interface PlayerState {
  maxHp: number;
  currentHp: number;
  block: number;
  gold: number;
  level: number;
  currentExp: number;
  maxExp: number;
  overclockCount: number; // For Lv.9 mechanic
  hands: number; // Hands remaining this turn
  discards: number; // Discards remaining this turn
  deck: Card[];
  hand: Card[];
  discardPile: Card[];
  modifiers: Modifier[]; // Legacy, will migrate to Jokers/TFT
  jokers: Joker[];
  consumables: Consumable[];
  activeTFTCards: TFTCard[];
  benchTFTCards: TFTCard[];
  pendingCardIds: string[]; 
  handsUsedThisBattle: number;
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  clubs: '♣',
  diamonds: '♦',
};

export const SUIT_COLORS: Record<Suit, string> = {
  spades: 'text-cyan-300',
  hearts: 'text-fuchsia-500',
  clubs: 'text-emerald-400',
  diamonds: 'text-yellow-400',
};
