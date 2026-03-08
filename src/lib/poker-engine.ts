import { Card, HandEvaluation, HandType, ScoreBreakdown } from '@/types/game';
import { RANK_SORT_VALUES } from '@/lib/deck';
import { HAND_SCORES } from '@/lib/game-config';

export interface EvaluationOptions {
  allowWrapAroundStraight?: boolean; // Q-K-A-2-3
  flushThreshold?: number; // 5, 4, or 3
  fourColorMultiplier?: number;
  spadeBaseBonus?: number;
  oddCardMultiplierBonus?: number;
  fuzzyLogic?: boolean; // Deprecated, use flushThreshold
  quantumJack?: boolean; // Jacks are wild
  tftChipsBonus?: number;
  tftMultBonus?: number;
}

export function evaluateHand(cards: Card[], options: EvaluationOptions = {}): HandEvaluation {
  if (cards.length === 0) {
    return { type: 'High Card', baseChips: 0, baseMult: 0, cards: [] };
  }

  // Sort by rank
  const sortedCards = [...cards].sort((a, b) => RANK_SORT_VALUES[b.rank] - RANK_SORT_VALUES[a.rank]);
  
  // Check for Flush
  const flushThreshold = options.flushThreshold || (options.fuzzyLogic ? 4 : 5);
  
  const suitCounts: Record<string, number> = {};
  cards.forEach(c => {
    if (options.quantumJack && c.rank === 'J') {
      // Wildcard handling simplified
    } else {
      suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    }
  });

  const jokerCount = options.quantumJack ? cards.filter(c => c.rank === 'J').length : 0;
  const maxSuitCount = Math.max(0, ...Object.values(suitCounts));
  const isFlush = (maxSuitCount + jokerCount) >= flushThreshold;
  
  // Check for Straight
  const straightThreshold = 5; // Straights are always 5 cards unless specified otherwise, but usually length is fixed.
  // Wait, if I have 4 cards, can I make a straight? No, straight is 5 cards.
  // But if I have "Short Straight" synergy? The prompt doesn't mention it.
  // Only "Flush requirements" are lowered.
  
  const uniqueRankValues = Array.from(new Set(cards.map(c => {
    if (options.quantumJack && c.rank === 'J') return -1;
    return RANK_SORT_VALUES[c.rank];
  }))).filter(v => v !== -1).sort((a, b) => b - a);

  let isStraight = false;
  
  if (uniqueRankValues.length > 0) {
      const needed = straightThreshold;
      
      // Extended range for wrap around: 14 down to 2.
      // If wrap allowed, we can treat 14 (A) as 1, and also connect K-A-2.
      // Actually, standard poker only wraps A-2-3-4-5.
      // "Q-K-A-2-3" means 12-13-14-2-3.
      // So 14 connects to 2.
      
      // We can simulate this by appending [14, 13...] to the end of the sequence if we treat it as a circle.
      // Or just check specific patterns.
      
      // Let's use the window method.
      // If wrap is allowed, we can map ranks to a circle.
      // 2,3,4,5,6,7,8,9,10,11,12,13,14.
      // 14 connects to 2.
      
      // We can iterate start from 14 down to 2.
      // For each start, check 5 consecutive.
      // If wrap allowed, (rank - 1) might become 14 if rank is 2.
      
      for (let start = 14; start >= 2; start--) {
          let found = 0;
          let wildcardsAvailable = jokerCount;
          
          for (let i = 0; i < needed; i++) {
              let rank = start - i;
              
              // Handle Wrap
              if (rank < 2) {
                  if (options.allowWrapAroundStraight) {
                      // 1 -> 14 (A)
                      // 0 -> 13 (K)
                      // -1 -> 12 (Q)
                      // etc.
                      // Formula: if rank < 2, rank = 13 + rank?
                      // 1 -> 14. 0 -> 13.
                      // Yes.
                      rank = 13 + rank;
                  } else if (rank === 1) {
                      // Standard Wheel (A-2-3-4-5) treats A as 1.
                      rank = 14; 
                  } else {
                      continue;
                  }
              }
              
              if (uniqueRankValues.includes(rank)) {
                  found++;
              } else if (wildcardsAvailable > 0) {
                  found++;
                  wildcardsAvailable--;
              }
          }
          
          if (found >= needed) {
              isStraight = true;
              break;
          }
      }
  } else {
      if (jokerCount >= straightThreshold) isStraight = true;
  }

  // Count frequencies
  const rankCounts: Record<string, number> = {};
  cards.forEach(c => {
      rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
  });
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  let type: HandType = 'High Card';
  
  if (isFlush && isStraight) {
    const isRoyal = sortedCards[0].rank === 'A' && sortedCards[1].rank === 'K'; 
    type = isRoyal ? 'Royal Flush' : 'Straight Flush';
  } else if (counts[0] === 4) {
    type = 'Four of a Kind';
  } else if (counts[0] === 3 && counts[1] >= 2) {
    type = 'Full House';
  } else if (isFlush) {
    type = 'Flush';
  } else if (isStraight) {
    type = 'Straight';
  } else if (counts[0] === 3) {
    type = 'Three of a Kind';
  } else if (counts[0] === 2 && counts[1] === 2) {
    type = 'Two Pair';
  } else if (counts[0] === 2) {
    type = 'Pair';
  } else {
    type = 'High Card';
  }

  const { base, mult } = HAND_SCORES[type];
  
  return {
    type,
    baseChips: base,
    baseMult: mult,
    cards: sortedCards
  };
}

export function calculateScore(handEval: HandEvaluation, options: EvaluationOptions = {}): ScoreBreakdown {
    const breakdown: ScoreBreakdown = {
        chips: handEval.baseChips + (options.tftChipsBonus || 0),
        mult: handEval.baseMult + (options.tftMultBonus || 0),
        total: 0,
        chipBreakdown: [
            { source: '基础筹码', value: handEval.baseChips },
            ...(options.tftChipsBonus ? [{ source: '插槽卡加成', value: options.tftChipsBonus }] : [])
        ],
        multBreakdown: [
            { source: '基础倍率', value: handEval.baseMult },
            ...(options.tftMultBonus ? [{ source: '插槽卡加成', value: options.tftMultBonus }] : [])
        ]
    };

    // 1. Card Chips
    let cardChips = 0;
    handEval.cards.forEach(card => {
        let val = card.value;
        // Spade Mania or other card specific buffs could go here
        if (options.spadeBaseBonus && card.suit === 'spades') {
             val += options.spadeBaseBonus;
        }
        
        // Quantum Jack: If it's a J and we used it as Wild, what value?
        // Default J value is 10. Let's keep it simple.
        
        cardChips += val;
        breakdown.chipBreakdown.push({ source: `${card.suit}${card.rank}`, value: val });
    });
    breakdown.chips += cardChips;

    // 2. Card/Hand Multipliers (e.g. Overclock)
    // "Overclock": Pair/Two Pair -> +2 Mult
    // This logic should ideally be passed in or handled by the caller, but if we put it here:
    // The prompt says "Overclock" is a Modifier. Modifiers are middlewares.
    // So this function should probably just do the BASE calculation, and middlewares modify the result.
    // BUT, the prompt says "Middleware... loop iterate execute".
    // So `calculateScore` might be called *inside* the middleware loop or the result passed through it.
    
    // Let's assume this function calculates the "Raw" score from cards + hand type.
    // External modifiers will adjust `breakdown.chips` and `breakdown.mult`.
    
    // However, for the specific "Four Color" or "Odd Amp" logic which depends on card properties:
    if (options.fourColorMultiplier && handEval.cards.length >= 4) {
        const suits = new Set(handEval.cards.map(c => c.suit));
        if (suits.size === 4) {
            breakdown.mult *= options.fourColorMultiplier;
            breakdown.multBreakdown.push({ source: '四色加成', value: options.fourColorMultiplier }); // This is x3, handled differently?
            // Usually Balatro does X mult vs + mult.
            // Let's treat this as X mult for now.
        }
    }

    if (options.oddCardMultiplierBonus) {
        let bonus = 0;
        handEval.cards.forEach(c => {
             const rankVal = RANK_SORT_VALUES[c.rank];
             if ([3, 5, 7, 9].includes(rankVal)) {
                 bonus += options.oddCardMultiplierBonus!;
             }
        });
        if (bonus > 0) {
            breakdown.mult += bonus;
            breakdown.multBreakdown.push({ source: '奇数增强', value: bonus });
        }
    }

    // Glass Cards (x2)
    const glassCards = handEval.cards.filter(c => c.isGlass);
    if (glassCards.length > 0) {
        const glassMult = Math.pow(2, glassCards.length);
        breakdown.mult *= glassMult;
        breakdown.multBreakdown.push({ source: '玻璃材质', value: glassMult }); // This is X mult
    }

    breakdown.total = breakdown.chips * breakdown.mult;
    return breakdown;
}
