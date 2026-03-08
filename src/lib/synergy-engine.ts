import { TFTCard, Synergy } from '@/types/game';
import { SYNERGIES } from '@/lib/game-config';

export function calculateActiveSynergies(activeCards: TFTCard[]): Synergy[] {
  // 1. Count unique cards per synergy
  const synergyCounts: Record<string, Set<string>> = {};

  activeCards.forEach(card => {
    card.synergies.forEach(synId => {
      if (!synergyCounts[synId]) {
        synergyCounts[synId] = new Set();
      }
      synergyCounts[synId].add(card.templateId);
    });
  });

  // 2. Map to Synergy objects
  return SYNERGIES.map(template => {
    const count = synergyCounts[template.id]?.size || 0;
    
    // Find active level
    let activeLevel = 0;
    for (let i = 0; i < template.thresholds.length; i++) {
      if (count >= template.thresholds[i]) {
        activeLevel = i + 1;
      } else {
        break;
      }
    }

    return {
      ...template,
      currentCount: count,
      activeLevel
    };
  });
}

export function getSynergyBonus(synergies: Synergy[], type: 'chips' | 'mult'): number {
  let bonus = 0;
  // Example: Warrior (Blade) gives chips? No, Blade gives % Damage.
  // This function might be deprecated if we handle effects directly in GameBoard.
  return bonus;
}
