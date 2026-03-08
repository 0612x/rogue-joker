import { TFTCard, Synergy } from '@/types/game';
import { SYNERGIES } from '@/lib/game-config';

export function calculateActiveSynergies(activeCards: TFTCard[]): Synergy[] {
  // 1. Count unique cards per synergy
  const synergyCounts: Record<string, Set<string>> = {};

  // 建立中文名到核心 ID 的动态映射表，完美兼容旧版数据
  const synergyMap: Record<string, string> = {
    '锋刃': 'spades',
    '堡垒': 'hearts',
    '猛毒': 'clubs',
    '财阀': 'diamonds',
    '算力者': 'calculator',
    '浪客': 'surfer',
    '极客': 'geek',
    '魔术师': 'magician',
    '刺客': 'assassin',
    '老千': 'cheater'
  };

  activeCards.forEach(card => {
    card.synergies.forEach(synName => {
      // 自动将中文转换为系统的英文 ID
      const synId = synergyMap[synName] || synName;
      
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
