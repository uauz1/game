import type { WhoAmIDifficulty } from '../data/whoAmIQuestions';
import { loadHuroofPreferences } from './huroofStorage';

const STORAGE_KEY = 'qaddha-who-am-i-preferences-v1';

export type WhoAmIPreferences = {
  teamNames: [string, string];
  teamColors: [string, string];
  seconds: number;
  difficulty: WhoAmIDifficulty;
  roundCount: number;
};

export function loadWhoAmIPreferences(): WhoAmIPreferences {
  const shared = loadHuroofPreferences();
  const defaults: WhoAmIPreferences = {
    teamNames: shared.teamNames,
    teamColors: shared.teamColors,
    seconds: 45,
    difficulty: 'medium',
    roundCount: 8,
  };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<WhoAmIPreferences>;
    return {
      teamNames: Array.isArray(stored.teamNames) && stored.teamNames.length === 2 ? stored.teamNames : defaults.teamNames,
      teamColors: Array.isArray(stored.teamColors) && stored.teamColors.length === 2 ? stored.teamColors : defaults.teamColors,
      seconds: [30, 45, 60].includes(stored.seconds ?? 0) ? stored.seconds! : defaults.seconds,
      difficulty: ['easy', 'medium', 'hard'].includes(stored.difficulty ?? '') ? stored.difficulty! : defaults.difficulty,
      roundCount: [6, 8, 10].includes(stored.roundCount ?? 0) ? stored.roundCount! : defaults.roundCount,
    };
  } catch {
    return defaults;
  }
}

export function saveWhoAmIPreferences(preferences: WhoAmIPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // The game remains fully playable when storage is blocked or unavailable.
  }
}
